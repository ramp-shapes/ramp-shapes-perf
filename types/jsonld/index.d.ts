/*
 * Copyright (C) 2015-2019, metaphacts GmbH
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, you can receive a copy
 * of the GNU Lesser General Public License from http://www.gnu.org/
 */

declare module "jsonld" {
  type DocumentLoader = (url: string, options?: object) => Promise<DocumentLoaderResult>;

  interface DocumentLoaderResult {
    contextUrl?: string | null;
    documentUrl: string;
    document: any;
  }

  namespace documentLoaders {
    function node(): DocumentLoader;
  }

  const documentLoader: DocumentLoader;

  interface CompactOptions {
    /** the base IRI to use. */
    base?: string;
    /** true to compact arrays to single values when appropriate, false not to (default: true). */
    compactArrays?: boolean;
    /** true to compact IRIs to be relative to document base, false to keep absolute (default: true) */
    compactToRelative?: boolean;
    /** true to always output a top-level graph (default: false). */
    graph?: boolean;
    /** a context to expand with. */
    expandContext?: any;
    /** true to assume the input is expanded and skip expansion, false not to, defaults to false. */
    skipExpansion?: boolean;
    /** the document loader. */
    documentLoader?: DocumentLoader;
    /**
     * a function that can be used to custom map unmappable values
     * (or to throw an error when they are detected);
     * if this function returns `undefined` then the default behavior will be used.
     */
    expansionMap?: (info: any) => any;
    /** true if compaction is occuring during a framing operation. */
    framing?: boolean;
    /** a function that can be used to custom map unmappable values
     * (or to throw an error when they are detected);
     * if this function returns `undefined` then the default behavior will be used.
     */
    compactionMap?: (info: any) => any;
  }

  function compact(doc: any, ctx: any): Promise<any>;
  function compact(doc: any, ctx: any, options: CompactOptions): Promise<any>;

  interface ExpandOptions {
    /** the base IRI to use. */
    base?: string;
    /** a context to expand with. */
    expandContext?: any;
    /** true to keep free-floating nodes, false not to, defaults to false. */
    keepFreeFloatingNodes?: boolean;
    /** the document loader. */
    documentLoader?: DocumentLoader;
    /**
     * a function that can be used to custom map unmappable values
     * (or to throw an error when they are detected);
     * if this function returns `undefined` then the default behavior will be used.
     */
    expansionMap?: (info: any) => any;
  }

  function expand(doc: any): Promise<any>;
  function expand(doc: any, options: ExpandOptions): Promise<any>;

  interface FlattenOptions {
    /** the base IRI to use. */
    base?: string;
    /** a context to expand with. */
    expandContext?: any;
    /** the document loader. */
    documentLoader?: DocumentLoader;
  }

  function flatten(doc: any, ctx: any): Promise<any>;
  function flatten(doc: any, ctx: any, options: FlattenOptions): Promise<any>;

  interface FrameOptions {
    /** the base IRI to use. */
    base?: string;
    /** a context to expand with. */
    expandContext?: any;
    /** default @embed flag (default: '@last'). */
    embed?: '@last' | '@always' | '@never' | '@link'
    /** default @explicit flag (default: false). */
    explicit?: boolean;
    /** default @requireAll flag (default: true). */
    requireAll?: boolean;
    /** default @omitDefault flag (default: false). */
    omitDefault?: boolean;
    /** the document loader. */
    documentLoader?: DocumentLoader;
  }

  function frame(doc: any, frame: any): Promise<any>;
  function frame(doc: any, frame: any, options: FrameOptions): Promise<any>;

  interface NormalizeOptions {
    /** the normalization algorithm to use, `URDNA2015` or `URGNA2012` (default: `URDNA2015`). */
    algorithm?: 'URDNA2015' | 'URGNA2012';
    /** the base IRI to use. */
    base?: string;
    /** a context to expand with. */
    expandContext?: any;
    /** true to assume the input is expanded and skip expansion, false not to, defaults to false. */
    skipExpansion?: boolean;
    /**
     * the format if input is not JSON-LD:
     *   'application/n-quads' for N-Quads.
     */
    inputFormat?: string;
    /**
     * the format if output is a string:
     *   'application/n-quads' for N-Quads.
     */
    format?: string;
    /** the document loader. */
    documentLoader?: DocumentLoader;
    /** true to use a native canonize algorithm */
    useNative?: boolean;
  }

  function normalize(doc: any): Promise<any>;
  function normalize(doc: any, options: NormalizeOptions): Promise<any>;

  interface FromRdfOptions {
    /**
     * the format if dataset param must first be parsed:
     *   'application/n-quads' for N-Quads (default).
     */
    format?: string;
    /** a custom RDF-parser to use to parse the dataset. */
    rdfParser?: any;
    /** true to use rdf:type, false to use @type (default: false). */
    useRdfType?: boolean;
    /**
     * true to convert XSD types into native types (boolean, integer, double),
     * false not to (default: false).
     */
    useNativeTypes?: boolean;
  }

  function fromRDF(dataset: any): Promise<any>;
  function fromRDF(dataset: any, options: FromRdfOptions): Promise<any>;

  interface ToRdfOptions {
    /** the base IRI to use. */
    base?: string;
    /** a context to expand with. */
    expandContext?: any;
    /**
     * true to assume the input is expanded and skip expansion,
     * false not to, defaults to false.
     */
    skipExpansion?: boolean;
    /**
     * the format to use to output a string:
     *   'application/n-quads' for N-Quads.
     */
    format?: string;
    /**
     * true to output generalized RDF,
     * false to produce only standard RDF (default: false).
     */
    produceGeneralizedRdf?: boolean;
    /** the document loader. */
    documentLoader?: DocumentLoader;
  }

  function toRDF(doc: any): Promise<Quad[]>;
  function toRDF(doc: any, options: ToRdfOptions): Promise<Quad[]>;

  type RdfParser = (input: any) => Promise<Quad[]>;

  function registerRDFParser(contentType: string, parser: RdfParser): void;

  interface JsonLdValue {
    '@value': any;
    '@type'?: string;
    '@language'?: string;
    '@id'?: string;
  }

  interface SimpleTerm {
    termType: 'NamedNode';
    value: string;
  }

  interface Literal {
    termType: 'Literal';
    language: string;
    value: string;
    datatype: SimpleTerm;
  }

  interface BlankTerm {
    termType: 'BlankNode';
    value: string;
  }

  interface GraphTerm {
    termType: 'DefaultGraph';
    value: string;
  }

  type Term = SimpleTerm | Literal | BlankTerm | GraphTerm;

  interface Quad {
    subject: Term;
    predicate: Term;
    object: Term;
    graph: GraphTerm;
  }
}
