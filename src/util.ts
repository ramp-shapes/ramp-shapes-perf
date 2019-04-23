import * as fs from 'fs';
import * as N3 from 'n3';
import { Rdf, Shape, ShapesForShapes, FrameTypeHandler, frame, vocabulary } from 'rdfxjson';

export function readTriplesFromTurtle(path: string): N3.Quad[] {
  const ttl = fs.readFileSync(path, {encoding: 'utf-8'});
  return new N3.Parser().parse(ttl);
}

export function toJson(match: unknown): string {
  return JSON.stringify(match, (key, value) => {
    if (typeof value === 'object' && value !== null && 'termType' in value) {
      // value is RDF term
      return Rdf.toString(value);
    }
    return value;
  }, 2);
}

const frameType: FrameTypeHandler = (shape, value) => {
  if (shape.type === 'resource') {
    const term = value as Rdf.Term;
    if (term.termType === 'NamedNode') {
      switch (term.value) {
        case vocabulary.ObjectShape.value: return 'object';
        case vocabulary.UnionShape.value: return 'union';
        case vocabulary.SetShape.value: return 'set';
        case vocabulary.OptionalShape.value: return 'optional';
        case vocabulary.ResourceShape.value: return 'resource';
        case vocabulary.LiteralShape.value: return 'literal';
        case vocabulary.ListShape.value: return 'list';
        case vocabulary.MapShape.value: return 'map';
      }
    }
  }
  return FrameTypeHandler.convertToNativeType(shape, value);
};

export function readShapes(path: string): Shape[] {
  const quads = readTriplesFromTurtle(path);
  const framingResults = frame({
    rootShape: vocabulary.Shape,
    shapes: ShapesForShapes,
    triples: quads as Rdf.Quad[],
    frameType,
  });
  const shapes: Shape[] = [];
  for (const {value} of framingResults) {
    shapes.push(value as Shape);
  }
  return shapes;
}
