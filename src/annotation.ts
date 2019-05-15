import * as path from 'path';
import * as Ram from 'ram-shapes';

import * as JsonLd from './jsonld';
import { runBenchmark } from './benchmark';
import { rdf, rdfs, xsd, oa } from './namespaces';
import { readQuadsFromTurtle, toJson, readShapes } from './util';

const QUADS = readQuadsFromTurtle(path.join(__dirname, '../datasets/annotation/graph.ttl'));
const SHAPES = readShapes(path.join(__dirname, '../datasets/annotation/ram-shapes.ttl'));
const JSONLD_CONTEXT = require('../datasets/annotation/jsonld-context.json');
const JSONLD_FRAME = require('../datasets/annotation/jsonld-frame.json');

async function main() {
  const documentLoader = JsonLd.makeDocumentLoader({
    overrideContexts: {
      'https://www.w3.org/ns/anno.jsonld': JSONLD_CONTEXT,
    }
  });

  const JSONLD_DOCUMENT = await JsonLd.fromRdf(QUADS, {documentLoader, useNativeTypes: true});

  let jsonldCompacted: any;
  {
    const framed = await JsonLd.frame(JSONLD_DOCUMENT, JSONLD_FRAME, {documentLoader}) as any;
    framed['@context'] = 'https://www.w3.org/ns/anno.jsonld';
    jsonldCompacted = await JsonLd.compact(framed, JSONLD_CONTEXT, {documentLoader});
    jsonldCompacted['@context'] = 'https://www.w3.org/ns/anno.jsonld';
    console.log('[JSON-LD] compacted:', toJson(jsonldCompacted));
  }

  let ramFramed: any;
  {
    const triples = QUADS as Ram.Rdf.Quad[];
    for (const {value} of Ram.frame({rootShape: oa.Annotation, shapes: SHAPES, triples})) {
      ramFramed = value;
      console.log('[RAM] framed:', toJson(ramFramed));
    }
  }

  await runBenchmark([
    {
      name: '[OA] frame JSON-LD',
      benchmark: async () => {
        const framed = await JsonLd.frame(JSONLD_DOCUMENT, JSONLD_FRAME, {documentLoader}) as any;
        framed['@context'] = 'https://www.w3.org/ns/anno.jsonld';
        const compacted = await JsonLd.compact(framed, JSONLD_CONTEXT, {documentLoader});
      }
    },
    {
      name: '[OA] frame RAM',
      benchmark: async () => {
        const triples = QUADS as Ram.Rdf.Quad[];
        for (const {value: framed} of Ram.frame({rootShape: oa.Annotation, shapes: SHAPES, triples})) {
          // pass
        }
      }
    }
  ]);

  await runBenchmark([
    {
      name: '[OA] flatten JSON-LD',
      benchmark: async () => {
        const result = await JsonLd.toRdf(jsonldCompacted, {documentLoader});
      }
    },
    {
      name: '[OA] flatten RAM',
      benchmark: async () => {
        for (const triple of Ram.flatten({rootShape: oa.Annotation, shapes: SHAPES, value: ramFramed})) {
          // pass
        }
      }
    }
  ]);
}

main();
