import * as fs from 'fs';
import * as N3 from 'n3';
import { Rdf, Shape, frameShapes } from 'ram-shapes';
import { promisify } from 'util';

export const exists = promisify(fs.exists);
export const mkdir = promisify(fs.mkdir);
export const readdir = promisify(fs.readdir);
export const readFile = promisify(fs.readFile);
export const writeFile = promisify(fs.writeFile);

export async function makeDirectoryIfNotExists(path: string) {
  if (!(await exists(path))) {
    await mkdir(path);
  }
}

export function readQuadsFromTurtle(path: string): N3.Quad[] {
  const ttl = fs.readFileSync(path, {encoding: 'utf-8'});
  return new N3.Parser().parse(ttl);
}

export function writeQuadsToTurtle(
  destinationPath: string,
  quads: Iterable<Rdf.Quad>,
  prefixes: { [prefix: string]: string }
): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(destinationPath);
    const writer = new N3.Writer(output, {prefixes});
    for (const quad of quads) {
      const q = N3.DataFactory.quad(
        Rdf.wrap(quad.subject) as N3.Quad_Subject,
        Rdf.wrap(quad.predicate) as N3.Quad_Predicate,
        Rdf.wrap(quad.object) as N3.Quad_Object,
        Rdf.wrap(quad.graph) as N3.Quad_Graph,
      );
      writer.addQuad(q);
    }
    writer.end(error => error ? reject(error) : resolve());
  });
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

export function readShapes(path: string): Shape[] {
  const quads = readQuadsFromTurtle(path);
  return frameShapes(quads as Rdf.Quad[]);
}
