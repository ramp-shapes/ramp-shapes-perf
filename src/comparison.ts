import * as path from 'node:path';
import * as Ramp from 'ramp-shapes';
import * as SparqlJs from 'sparqljs';

import * as JsonLd from './jsonld.js';
import {
  readJson, readQuadsFromTurtle, readShapes, toJson, makeDirectoryIfNotExists,
  writeFile, writeQuadsToTurtle,
} from './util.js';

const PREFIXES: { [prefix: string]: string } = {
  "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
  "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
  "xsd": "http://www.w3.org/2001/XMLSchema#",
  "ex": "http://example.com/schema/",
};

const JSONLD_CONTEXT = readJson(
  path.join(import.meta.dirname, '../datasets/comparison/context.json')
) as object;
const JSONLD_FRAME = readJson(
  path.join(import.meta.dirname, '../datasets/comparison/frame.json')
) as object;
const SHAPES = readShapes(
  path.join(import.meta.dirname, '../datasets/comparison/shapes.ttl')
);
const ROOT_SHAPE_IRI = PREFIXES['ex'] + 'Annotation';
const ROOT_SHAPE = SHAPES.find(s => s.id.value === ROOT_SHAPE_IRI)!;
const DATA = readQuadsFromTurtle(
  path.join(import.meta.dirname, '../datasets/comparison/data.ttl')
);

const documentLoader = JsonLd.makeDocumentLoader({
  overrideContexts: {}
});

(async function main() {
  const outDir = path.join(import.meta.dirname, '../out/comparison');
  await makeDirectoryIfNotExists(outDir);

  const jsonldDoc = await JsonLd.fromRdf(DATA, {documentLoader});
  await writeFile(
    path.join(outDir, `jsonld-doc.json`),
    toJson(jsonldDoc),
    {encoding: 'utf8'}
  );
  const jsonldFramed = await JsonLd.frame(jsonldDoc, JSONLD_FRAME, {documentLoader});
  await writeFile(
    path.join(outDir, `jsonld-framed.json`),
    toJson(jsonldFramed),
    {encoding: 'utf8'}
  );
  const jsonldFlattened = (await JsonLd.toRdf(jsonldFramed, {documentLoader}))
    .map(JsonLd.mapJsonLdQuad);
  await writeQuadsToTurtle(
    path.join(outDir, `jsonld-flattened.ttl`),
    jsonldFlattened,
    {...PREFIXES, "": "http://example.com/data/"}
  );

  const query = Ramp.generateQuery({shape: ROOT_SHAPE, prefixes: PREFIXES});
  const generator = new SparqlJs.Generator();
  await writeFile(
    path.join(outDir, `ramp-query.sparql`),
    generator.stringify(query),
    {encoding: 'utf8'}
  );

  const iterator = Ramp.frame({
    shape: ROOT_SHAPE,
    dataset: Ramp.Rdf.dataset(DATA as Ramp.Rdf.Quad[]),
  });
  for (const {value} of iterator) {
    await writeFile(
      path.join(outDir, `ramp-framed.json`),
      toJson(value),
      {encoding: 'utf8'}
    );
    const quads = Ramp.flatten({shape: ROOT_SHAPE, value});
    await writeQuadsToTurtle(
      path.join(outDir, `ramp-flattened.ttl`),
      quads,
      {...PREFIXES, "": "http://example.com/data/"}
    );
  }
})();
