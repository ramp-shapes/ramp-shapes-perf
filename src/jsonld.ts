import * as JsonLd from 'jsonld';
import * as N3 from 'n3';
import { Rdf } from 'ramp-shapes';

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
  return (url) => {
    if (options.overrideContexts && url in options.overrideContexts) {
      return Promise.resolve({
        // this is for a context via a link header
        contextUrl: null,
        // this is the actual document that was loaded
        document: options.overrideContexts[url],
        // this is the actual context URL after redirects
        documentUrl: url,
      });
    }

    if (options.fetchRemoteContexts) {
      return NODE_DOCUMENT_LOADER(url);
    } else {
      return Promise.reject(new Error(`Fetching remote JSON-LD contexts is not allowed: ${url}`));
    }
  };
}

export function compact(
  doc: object,
  context: object | string,
  options: JsonLd.CompactOptions & { documentLoader: JsonLd.DocumentLoader }
): Promise<any> {
  return JsonLd.compact(doc, context, options);
}

export function frame(
  doc: object | string,
  frame: object,
  options: JsonLd.FrameOptions & { documentLoader: JsonLd.DocumentLoader }
): Promise<object> {
  return JsonLd.frame(doc, frame, options);
}

export function flatten(
  doc: object,
  context: object | string,
  options: JsonLd.FlattenOptions & { documentLoader: JsonLd.DocumentLoader }
): Promise<object> {
  return JsonLd.flatten(doc, context, options);
}

export function fromRdf(
  dataset: object | string,
  options: JsonLd.FromRdfOptions & { documentLoader: JsonLd.DocumentLoader }
): Promise<object> {
  return JsonLd.fromRDF(dataset, options);
}

export function toRdf(
  doc: object,
  options: JsonLd.ToRdfOptions & { documentLoader: JsonLd.DocumentLoader }
): Promise<JsonLd.Quad[]> {
  return JsonLd.toRDF(doc, options);
}

function registerTtlParser() {
  JsonLd.registerRDFParser('text/turtle', input => {
    return new Promise((resolve, reject) => {
      const quads: N3.Quad[] = [];
      new N3.Parser().parse(input, (error, quad, hash) => {
        if (error) {
          reject(error);
        } else if (quad) {
          quads.push(quad);
        } else {
          resolve(quads as JsonLd.Quad[]);
        }
      });
    });
  });
}

export function mapJsonLdQuad(quad: JsonLd.Quad): Rdf.Quad {
  return Rdf.DefaultDataFactory.quad(
    mapJsonLdTerm(quad.subject) as Rdf.Quad['subject'],
    mapJsonLdTerm(quad.predicate) as Rdf.Quad['predicate'],
    mapJsonLdTerm(quad.object) as Rdf.Quad['object'],
    mapJsonLdTerm(quad.graph) as Rdf.Quad['graph']
  );
}

function mapJsonLdTerm(term: JsonLd.Term): Rdf.Term {
  switch (term.termType) {
    case 'NamedNode':
      return Rdf.DefaultDataFactory.namedNode(term.value);
    case 'BlankNode':
      return Rdf.DefaultDataFactory.blankNode(term.value);
    case 'Literal':
      return Rdf.DefaultDataFactory.literal(
        term.value,
        term.language ? term.language : mapJsonLdTerm(term.datatype) as Rdf.NamedNode
      );
    case 'DefaultGraph':
      return Rdf.DefaultDataFactory.defaultGraph();
    default:
      throw new Error(`Unexpected JSON-LD term type: "${(term as Rdf.Term).termType}"`);
  }
}
