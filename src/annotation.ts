import * as path from 'node:path';
import * as Ramp from 'ramp-shapes';

import * as JsonLd from './jsonld.js';
import { runBenchmark } from './benchmark.js';
import { oa } from './namespaces.js';
import { readJson, readQuadsFromTurtle, toJson, readShapes } from './util.js';

const QUADS = readQuadsFromTurtle(
  path.join(import.meta.dirname, '../datasets/annotation/graph.ttl')
);
const SHAPES = readShapes(
  path.join(import.meta.dirname, '../datasets/annotation/shapes.ttl')
);
const ROOT_SHAPE = SHAPES.find(s => Ramp.Rdf.equalTerms(s.id, oa.Annotation))!;
const JSONLD_CONTEXT = readJson(
  path.join(import.meta.dirname, '../datasets/annotation/jsonld-context.json')
) as object;
const JSONLD_FRAME = readJson(
  path.join(import.meta.dirname, '../datasets/annotation/jsonld-frame.json')
) as object;

async function main() {
  const documentLoader = JsonLd.makeDocumentLoader({
    overrideContexts: {
      'https://www.w3.org/ns/anno.jsonld': JSONLD_CONTEXT,
    }
  });

  const JSONLD_DOCUMENT = await JsonLd.fromRdf(QUADS, {documentLoader, useNativeTypes: true});

  let jsonldFramed: any;
  {
    jsonldFramed = await JsonLd.frame(JSONLD_DOCUMENT, JSONLD_FRAME, {documentLoader}) as any;
    console.log('[JSON-LD] framed:', toJson(jsonldFramed));
  }

  let ramFramed: any;
  {
    const dataset = Ramp.Rdf.dataset(QUADS as Ramp.Rdf.Quad[]);
    for (const {value} of Ramp.frame({shape: ROOT_SHAPE, dataset})) {
      ramFramed = value;
      console.log('[RAMP] framed:', toJson(ramFramed));
    }
  }

  await runBenchmark([
    {
      name: '[OA] frame JSON-LD',
      benchmark: async () => {
        const framed = await JsonLd.frame(JSONLD_DOCUMENT, JSONLD_FRAME, {documentLoader});
      }
    },
    {
      name: '[OA] frame RAMP',
      benchmark: async () => {
        const dataset = Ramp.Rdf.dataset(QUADS as Ramp.Rdf.Quad[]);
        for (const {value: framed} of Ramp.frame({shape: ROOT_SHAPE, dataset})) {
          // pass
        }
      }
    }
  ]);

  await runBenchmark([
    {
      name: '[OA] flatten JSON-LD',
      benchmark: async () => {
        const result = await JsonLd.toRdf(jsonldFramed, {documentLoader});
      }
    },
    {
      name: '[OA] flatten RAMP',
      benchmark: async () => {
        for (const triple of Ramp.flatten({shape: ROOT_SHAPE, value: ramFramed})) {
          // pass
        }
      }
    }
  ]);
}

main();
