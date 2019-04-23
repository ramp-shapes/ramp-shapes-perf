import Benchmark from 'benchmark';
import * as path from 'path';
import * as rdfxjson from 'rdfxjson';

import * as JsonLd from './jsonld';
import { rdf, rdfs, xsd, oa } from './namespaces';
import { readTriplesFromTurtle, toJson, readShapes } from './util';

const TRIPLES = readTriplesFromTurtle(path.join(__dirname, '../datasets/annotation/graph.ttl'));
const SHAPES = readShapes(path.join(__dirname, '../datasets/annotation/rxj-shapes.ttl'));
const JSONLD_CONTEXT = require('../datasets/annotation/jsonld-context.json');
const JSONLD_FRAME = require('../datasets/annotation/jsonld-frame.json');

async function main() {
  const documentLoader = JsonLd.makeDocumentLoader({
    overrideContexts: {
      'https://www.w3.org/ns/anno.jsonld': JSONLD_CONTEXT,
    }
  });

  const JSONLD_DOCUMENT = await JsonLd.fromRdf(TRIPLES, {documentLoader, useNativeTypes: true});

  let jsonldCompacted: any;
  {
    const framed = await JsonLd.frame(JSONLD_DOCUMENT, JSONLD_FRAME, {documentLoader});
    framed['@context'] = 'https://www.w3.org/ns/anno.jsonld';
    jsonldCompacted = await JsonLd.compact(framed, JSONLD_CONTEXT, {documentLoader});
    jsonldCompacted['@context'] = 'https://www.w3.org/ns/anno.jsonld';
    console.log('[JSON-LD] compacted:', toJson(jsonldCompacted));
  }

  let rxjFramed: any;
  {
    const triples = TRIPLES as rdfxjson.Rdf.Quad[];
    for (const {value} of rdfxjson.frame({rootShape: oa.Annotation, shapes: SHAPES, triples})) {
      rxjFramed = value;
      console.log('[rdfxjson] framed:', toJson(rxjFramed));
    }
  }

  await runBenchmark([
    {
      name: '[OA] frame JSON-LD',
      benchmark: async () => {
        const framed = await JsonLd.frame(JSONLD_DOCUMENT, JSONLD_FRAME, {documentLoader});
        framed['@context'] = 'https://www.w3.org/ns/anno.jsonld';
        const compacted = await JsonLd.compact(framed, JSONLD_CONTEXT, {documentLoader});
      }
    },
    {
      name: '[OA] frame rdfxjson',
      benchmark: async () => {
        const triples = TRIPLES as rdfxjson.Rdf.Quad[];
        for (const {value: framed} of rdfxjson.frame({rootShape: oa.Annotation, shapes: SHAPES, triples})) {
          // pass
        }
      }
    }
  ]);

  await runBenchmark([
    {
      name: '[OA] flatten JSON-LD',
      benchmark: async () => {
        const result = await JsonLd.flatten(jsonldCompacted, JSONLD_CONTEXT, {documentLoader});
      }
    },
    {
      name: '[OA] flatten rdfxjson',
      benchmark: async () => {
        for (const triple of rdfxjson.flatten({rootShape: oa.Annotation, shapes: SHAPES, value: rxjFramed})) {
          // pass
        }
      }
    }
  ]);
}

interface Implementation {
  name: string;
  benchmark: () => Promise<unknown>;
}

async function runBenchmark(implementations: ReadonlyArray<Implementation>) {
  const suite = new Benchmark.Suite();
  for (const impl of implementations) {
    const fn = (deferred: { resolve: () => void }) => {
      impl.benchmark().then(() => deferred.resolve());
    };
    suite.add({name: impl.name, fn, defer: true});
  }
  await new Promise((resolve) => {
    suite
      .on('cycle', (event: any) => {
        console.log(String(event.target));
      })
      .on('complete', function (this: any) {
        console.log('Fastest is ' + this.filter('fastest').map('name'));
        resolve();
      })
      .run({async: true});
  });
}

main();
