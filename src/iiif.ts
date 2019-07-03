import * as path from 'path';
import { performance } from 'perf_hooks';
import * as Ram from 'ram-shapes';

import * as JsonLd from './jsonld';
import * as Util from './util';
import { BenchmarkGroup, runBenchmark } from './benchmark';

const JSONLD_IIIF_PRESENTATION_CONTEXT_V1 = require('../datasets/iiif-schema/presentation-context-v1.json');
const JSONLD_IIIF_PRESENTATION_CONTEXT_V2 = require('../datasets/iiif-schema/presentation-context-v2.json');
const JSONLD_IIIF_IMAGE_CONTEXT_V1 = require('../datasets/iiif-schema/image-context-v1.json');
const JSONLD_IIIF_IMAGE_CONTEXT_V2 = require('../datasets/iiif-schema/image-context-v2.json');
const JSONLD_IIIF_FRAME = require('../datasets/iiif-schema/manifest-frame.json');

const SHAPES = Util.readShapes(path.join(__dirname, '../datasets/iiif-schema/manifest-shapes.ttl'));
const MANIFEST_SHAPE_ID = Ram.Rdf.namedNode('http://iiif.io/api/presentation/2#Manifest');

const PREFIXES: { [prefix: string]: string } = {
  "sc": "http://iiif.io/api/presentation/2#",
  "iiif": "http://iiif.io/api/image/2#",
  "exif": "http://www.w3.org/2003/12/exif/ns#",
  "oa": "http://www.w3.org/ns/oa#",
  "cnt": "http://www.w3.org/2011/content#",
  "dc": "http://purl.org/dc/elements/1.1/",
  "dcterms": "http://purl.org/dc/terms/",
  "dctypes": "http://purl.org/dc/dcmitype/",
  "doap": "http://usefulinc.com/ns/doap#",
  "foaf": "http://xmlns.com/foaf/0.1/",
  "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
  "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
  "xsd": "http://www.w3.org/2001/XMLSchema#",
  "svcs": "http://rdfs.org/sioc/services#",
  "as": "http://www.w3.org/ns/activitystreams#",
};

const DOCUMENT_LOADER = JsonLd.makeDocumentLoader({
  overrideContexts: {
    // 'http://iiif.io/api/presentation/1/context.json': JSONLD_IIIF_PRESENTATION_CONTEXT_V1,
    'http://iiif.io/api/presentation/2/context.json': JSONLD_IIIF_PRESENTATION_CONTEXT_V2,
    // 'http://iiif.io/api/image/1/context.json': JSONLD_IIIF_IMAGE_CONTEXT_V2,
    'http://iiif.io/api/image/2/context.json': JSONLD_IIIF_IMAGE_CONTEXT_V2,
  }
});

interface BenchmarkedManifest {
  readonly manifestName: string;
  readonly fileName: string;
  readonly jsonldFlatten: object;
  readonly quads: Ram.Rdf.Quad[];
  readonly dataset: Ram.Rdf.Dataset;
  jsonldFramed?: object;
  jsonldFlattenQuadCount?: number;
  ramFramed?: object;
  ramFlattenQuadCount?: number;
}

async function main() {
  const manifests: BenchmarkedManifest[] = [];

  const manifestDir = path.join(__dirname, '../datasets/iiif');
  for (const fileName of await Util.readdir(manifestDir)) {
    if (!fileName.endsWith('.json')) { continue; }
    const manifestName = fileName.substring(0, fileName.length - '.json'.length);
    let manifest: BenchmarkedManifest;
    try {
      const manifestPath = path.join(manifestDir, fileName);
      const jsonldDocument = JSON.parse(await Util.readFile(manifestPath, {encoding: 'utf8'}));
      const jsonldFlatten = await JsonLd.flatten(
        jsonldDocument,
        'http://iiif.io/api/presentation/2/context.json',
        {documentLoader: DOCUMENT_LOADER}
      );
      const quads = await JsonLd.toRdf(jsonldDocument, {documentLoader: DOCUMENT_LOADER});
      manifest = {
        manifestName,
        fileName,
        jsonldFlatten,
        quads,
        dataset: Ram.Rdf.dataset(quads),
      };
      manifests.push(manifest);
    } catch (err) {
      console.warn('Skipping ', fileName);
    }
  }

  manifests.sort((a, b) => (
    a.quads.length < b.quads.length ? -1 :
    a.quads.length > b.quads.length ? 1 :
    0
  ));

  await writeTestResults(manifests);

  const statsFrame = await benchmarkFrame(manifests);
  await writeBenchmarkStats('frame', statsFrame);

  const statsFlatten = await benchmarkFlatten(manifests);
  await writeBenchmarkStats('flatten', statsFlatten);
}

async function writeTestResults(manifests: ReadonlyArray<BenchmarkedManifest>) {
  const outDir = path.join(__dirname, '../out');
  await Util.makeDirectoryIfNotExists(outDir);
  await Util.makeDirectoryIfNotExists(path.join(outDir, 'frame-ram'));
  await Util.makeDirectoryIfNotExists(path.join(outDir, 'frame-jsonld'));
  await Util.makeDirectoryIfNotExists(path.join(outDir, 'flatten-ram'));
  await Util.makeDirectoryIfNotExists(path.join(outDir, 'flatten-jsonld'));

  for (const manifest of manifests) {
    console.log('Testing manifest: ', manifest.manifestName, `(${manifest.quads.length} quads)`);
    try {
      let foundSoultion = false;
      const startRamTime = performance.now();
      const frameResults = Ram.frame({
        rootShape: MANIFEST_SHAPE_ID,
        shapes: SHAPES,
        dataset: manifest.dataset,
      });
      for (const {value} of frameResults) {
        const endRamTime = performance.now();
        if (foundSoultion) {
          console.warn('[ram] found multiple solutions');
          break;
        }
        foundSoultion = true;
        manifest.ramFramed = value as object;
        // console.log('[ram] framed:', toJson(value));
        console.log(`[ram] frame OK in ${Math.round(endRamTime - startRamTime)} ms`);
        const json = Util.toJson(value);

        await Util.writeFile(
          path.join(__dirname, '../out/frame-ram', `${manifest.manifestName}.json`),
          json,
          {encoding: 'utf8'}
        );
      }
    } catch (err) {
      console.error('[ram] frame error:', err);
    }

    try {
      const startJsonldTime = performance.now();
      const jsonldFramed = await JsonLd.frame(
        manifest.jsonldFlatten,
        JSONLD_IIIF_FRAME,
        {documentLoader: DOCUMENT_LOADER}
      );
      const endJsonldTime = performance.now();
      console.log(`[jsonld] frame OK in ${Math.round(endJsonldTime - startJsonldTime)} ms`);

      manifest.jsonldFramed = await JsonLd.compact(
        jsonldFramed,
        'http://iiif.io/api/presentation/2/context.json',
        {documentLoader: DOCUMENT_LOADER}
      );

      const json = JSON.stringify(manifest.jsonldFramed, null, 2);
      await Util.writeFile(
        path.join(__dirname, '../out/frame-jsonld', `${manifest.manifestName}.json`),
        json,
        {encoding: 'utf8'}
      );
    } catch (err) {
      console.error('[jsonld] frame error:', err);
    }

    try {
      const quads = Array.from(Ram.flatten({
        rootShape: MANIFEST_SHAPE_ID,
        shapes: SHAPES,
        value: manifest.ramFramed,
      }));
      manifest.ramFlattenQuadCount = quads.length;
      await Util.writeQuadsToTurtle(
        path.join(__dirname, '../out/flatten-ram', `${manifest.manifestName}.ttl`),
        quads,
        PREFIXES
      );
      console.log(`[ram] flatten OK (${manifest.ramFlattenQuadCount} quads)`);
    } catch (err) {
      console.error('[ram] flatten error:', err);
    }

    try {
      const flatDocument = await JsonLd.flatten(
        manifest.jsonldFramed!,
        'http://iiif.io/api/presentation/2/context.json',
        {documentLoader: DOCUMENT_LOADER}
      );
      const quads = await JsonLd.toRdf(flatDocument, {documentLoader: DOCUMENT_LOADER});
      manifest.jsonldFlattenQuadCount = quads.length;
      await Util.writeQuadsToTurtle(
        path.join(__dirname, '../out/flatten-jsonld', `${manifest.manifestName}.ttl`),
        quads,
        PREFIXES
      );
      console.log(`[jsonld] flatten OK (${manifest.jsonldFlattenQuadCount} quads)`);
    } catch (err) {
      console.error('[jsonld] flatten error:', err);
    }

    console.log('-----');
  }
}

async function benchmarkFrame(manifests: ReadonlyArray<BenchmarkedManifest>) {
  const stats: BenchmarkGroup[] = [];
  for (const manifest of manifests) {
    console.log('Benchmark frame(): ', manifest.manifestName);
    const events = await runBenchmark([
      {
        name: `jsonld`,
        benchmark: async () => {
          await JsonLd.frame(
            manifest.jsonldFlatten,
            JSONLD_IIIF_FRAME,
            {documentLoader: DOCUMENT_LOADER}
          );
        }
      },
      {
        name: `jsonld-plus-compact`,
        benchmark: async () => {
          const framed = await JsonLd.frame(
            manifest.jsonldFlatten,
            JSONLD_IIIF_FRAME,
            {documentLoader: DOCUMENT_LOADER}
          );
          await JsonLd.compact(
            framed,
            'http://iiif.io/api/presentation/2/context.json',
            {documentLoader: DOCUMENT_LOADER}
          );
        }
      },
      {
        name: `ram`,
        benchmark: async () => {
          const frameResults = Ram.frame({
            rootShape: MANIFEST_SHAPE_ID,
            shapes: SHAPES,
            dataset: manifest.dataset,
          });
          for (const {value} of frameResults) {
            // pass
          }
        }
      }
    ]);
    stats.push({name: manifest.manifestName, quadCount: manifest.quads.length, events});
    console.log('-----');
  }
  return stats;
}

async function benchmarkFlatten(manifests: ReadonlyArray<BenchmarkedManifest>) {
  const stats: BenchmarkGroup[] = [];
  for (const manifest of manifests) {
    console.log('Benchmark toRdf()/flatten(): ', manifest.manifestName);
    const events = await runBenchmark([
      {
        name: `jsonld`,
        benchmark: async () => {
          await JsonLd.toRdf(
            manifest.jsonldFramed!,
            {documentLoader: DOCUMENT_LOADER}
          );
        }
      },
      {
        name: `ram`,
        benchmark: async () => {
          const quads = Ram.flatten({
            rootShape: MANIFEST_SHAPE_ID,
            shapes: SHAPES,
            value: manifest.ramFramed,
          });
          for (const quad of quads) {
            // pass
          }
        }
      }
    ]);
    stats.push({name: manifest.manifestName, quadCount: manifest.quads.length, events});
    console.log('-----');
  }
  return stats;
}

async function writeBenchmarkStats(statsName: string, stats: BenchmarkGroup[]) {
  await Util.makeDirectoryIfNotExists(path.join(__dirname, '../out'));
  const statsJson = JSON.stringify(stats, null, 2);
  await Util.writeFile(
    path.join(__dirname, `../out/stats-${statsName}.json`),
    statsJson,
    {encoding: 'utf8'}
  );
}

main();
