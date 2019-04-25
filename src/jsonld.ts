import * as fs from 'fs';
import * as JsonLd from 'jsonld';
import * as N3 from 'n3';

registerTtlParser();

export interface LoaderOptions {
  /** @default false */
  fetchRemoteContexts?: boolean;
  overrideContexts?: {
    [contextIri: string]: object
  };
}

const NODE_DOCUMENT_LOADER = JsonLd.documentLoaders.node();

export function makeDocumentLoader(options: LoaderOptions): JsonLd.DocumentLoader {
  return (url, callback) => {
    if (options.overrideContexts && url in options.overrideContexts) {
      return callback(null, {
        // this is for a context via a link header
        contextUrl: null,
        // this is the actual document that was loaded
        document: options.overrideContexts[url],
        // this is the actual context URL after redirects
        documentUrl: url,
      });
    }

    if (options.fetchRemoteContexts) {
      return NODE_DOCUMENT_LOADER(url, callback);
    } else {
      callback(new Error(`Fetching remote JSON-LD contexts is not allowed: ${url}`), null);
    }
  };
}

export function compact(
  input: object,
  ctx: object | string,
  options: JsonLd.CompactOptions & { documentLoader: JsonLd.DocumentLoader }
): Promise<any> {
  return new Promise((resolve, reject) =>
    JsonLd.compact(input, ctx, options,
      (error, result) => error ? reject(error) : resolve(result))
  );
}

export function frame(
  input: object | string,
  frame: object,
  options: JsonLd.FrameOptions & { documentLoader: JsonLd.DocumentLoader }
): Promise<object> {
  return new Promise((resolve, reject) =>
    JsonLd.frame(input, frame, options,
      (error, result) => error ? reject(error) : resolve(result))
  );
}

export function flatten(
  input: object,
  ctx: object | string,
  options: JsonLd.FlattenOptions & { documentLoader: JsonLd.DocumentLoader }
): Promise<object> {
  return new Promise<any>((resolve, reject) =>
    JsonLd.flatten(input, ctx, options,
      (error, result) => error ? reject(error) : resolve(result))
  );
}

export function fromRdf(
  dataset: object | string,
  options: JsonLd.FromRdfOptions & { documentLoader: JsonLd.DocumentLoader }
): Promise<object> {
  return new Promise((resolve, reject) =>
    JsonLd.fromRDF(dataset, options,
      (error, result) => error ? reject(error) : resolve(result))
  );
}

export function toRdf(
  input: object,
  options: JsonLd.ToRdfOptions & { documentLoader: JsonLd.DocumentLoader }
): Promise<any[]> {
  return new Promise((resolve, reject) =>
    JsonLd.toRDF(input, options,
      (error, result) => error ? reject(error) : resolve(result))
  );
}

function registerTtlParser() {
  JsonLd.registerRDFParser('text/turtle', (input, callback) => {
    const quads: N3.Quad[] = [];
    N3.Parser().parse(input, (error, quad, hash) => {
      if (error) {
        callback(error, quads as JsonLd.Quad[]);
      } else if (quad) {
        quads.push(quad);
      } else if (callback) {
        callback(undefined, quads as JsonLd.Quad[]);
      }
    });
  });
}
