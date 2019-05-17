import * as path from 'path';
import * as Ram from 'ram-shapes';
import * as SparqlJs from 'sparqljs';

import * as JsonLd from './jsonld';
import * as Util from './util';

const JSONLD_CONTEXT = require('../datasets/comparison/context.json');
const JSONLD_FRAME = require('../datasets/comparison/frame.json');
const SHAPES = Util.readShapes(path.join(__dirname, '../datasets/comparison/shapes.ttl'));
const DATA = Util.readQuadsFromTurtle(path.join(__dirname, '../datasets/comparison/data.ttl'));

const PREFIXES: { [prefix: string]: string } = {
  "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
  "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
  "xsd": "http://www.w3.org/2001/XMLSchema#",
  "ex": "http://example.com/schema/",
};

const documentLoader = JsonLd.makeDocumentLoader({
  overrideContexts: {}
});

(async function main() {
  const outDir = path.join(__dirname, '../out/comparison');
  await Util.makeDirectoryIfNotExists(outDir);

  const jsonldDoc = await JsonLd.fromRdf(DATA, {documentLoader});
  await Util.writeFile(
    path.join(outDir, `jsonld-doc.json`),
    Util.toJson(jsonldDoc),
    {encoding: 'utf8'}
  );
  const jsonldFramed = await JsonLd.frame(jsonldDoc, JSONLD_FRAME, {documentLoader});
  await Util.writeFile(
    path.join(outDir, `jsonld-framed.json`),
    Util.toJson(jsonldFramed),
    {encoding: 'utf8'}
  );
  const jsonldCompacted = await JsonLd.compact(jsonldFramed, JSONLD_CONTEXT, {documentLoader});
  await Util.writeFile(
    path.join(outDir, `jsonld-compacted.json`),
    Util.toJson(jsonldCompacted),
    {encoding: 'utf8'}
  );

  const rootShape = Ram.Rdf.namedNode(PREFIXES['ex'] + 'Annotation');
  const query = Ram.generateQuery({
    rootShape,
    shapes: SHAPES,
    prefixes: PREFIXES,
  });
  const generator = new SparqlJs.Generator();
  await Util.writeFile(
    path.join(outDir, `ram-query.sparql`),
    generator.stringify(query),
    {encoding: 'utf8'}
  );

  const iterator = Ram.frame({
    rootShape,
    shapes: SHAPES,
    triples: DATA as Ram.Rdf.Quad[],
  });
  for (const {value} of iterator) {
    await Util.writeFile(
      path.join(outDir, `ram-framed.json`),
      Util.toJson(value),
      {encoding: 'utf8'}
    );
    const quads = Ram.flatten({rootShape, shapes: SHAPES, value});
    await Util.writeQuadsToTurtle(
      path.join(outDir, `ram-flattened.ttl`),
      quads,
      {...PREFIXES, "": "http://example.com/data/"}
    );
  }
})();
