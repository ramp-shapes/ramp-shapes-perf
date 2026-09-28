import * as fs from 'node:fs';
import { promisify } from 'node:util';
import type { Quad } from '@rdfjs/types';
import * as N3 from 'n3';
import * as Ramp from 'ramp-shapes';

export const exists = promisify(fs.exists);
export const mkdir = promisify(fs.mkdir);
export const readdir = promisify(fs.readdir);
export const readFile = promisify(fs.readFile);
export const writeFile = promisify(fs.writeFile);

export async function makeDirectoryIfNotExists(path: string) {
  if (!(await exists(path))) {
    await mkdir(path, {recursive: true});
  }
}

export function readJson(path: string): unknown {
  return JSON.parse(fs.readFileSync(path, {encoding: 'utf-8'}));
}

export function readQuadsFromTurtle(path: string): Quad[] {
  const ttl = fs.readFileSync(path, {encoding: 'utf-8'});
  return new N3.Parser({factory: Ramp.DefaultDataFactory}).parse(ttl);
}

export function writeQuadsToTurtle(
  destinationPath: string,
  quads: Iterable<Quad>,
  prefixes: { [prefix: string]: string }
): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(destinationPath);
    const writer = new N3.Writer(output, {prefixes});
    for (const quad of quads) {
      const q = N3.DataFactory.quad(
        quad.subject,
        quad.predicate,
        quad.object,
        quad.graph,
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
      return Ramp.termToString(value);
    }
    return value;
  }, 2);
}

export function readShapes(path: string): Ramp.Shape[] {
  const quads = readQuadsFromTurtle(path);
  return Ramp.frameShapes(Ramp.dataset(quads));
}
