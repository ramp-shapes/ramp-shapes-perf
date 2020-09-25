import { Rdf } from 'ramp-shapes';

const namedNode = (value: string) => Rdf.DefaultDataFactory.namedNode(value);

export namespace rdf {
  export const NAMESPACE = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
  export const type = namedNode(NAMESPACE + 'type');
  export const value = namedNode(NAMESPACE + 'value');
  export const first = namedNode(NAMESPACE + 'first');
  export const rest = namedNode(NAMESPACE + 'rest');
  export const nil = namedNode(NAMESPACE + 'nil');
}

export namespace rdfs {
  export const NAMESPACE = 'http://www.w3.org/2000/01/rdf-schema#';
  export const label = namedNode(NAMESPACE + 'label');
}

export namespace xsd {
  export const NAMESPACE = 'http://www.w3.org/2001/XMLSchema#';
  export const string = namedNode(NAMESPACE + 'string');
  export const boolean = namedNode(NAMESPACE + 'boolean');
  export const integer = namedNode(NAMESPACE + 'integer');
  export const double = namedNode(NAMESPACE + 'double');
  export const decimal = namedNode(NAMESPACE + 'decimal');
  export const nonNegativeInteger = namedNode(NAMESPACE + 'nonNegativeInteger');
  export const dateTime = namedNode(NAMESPACE + 'dateTime');
}

export namespace oa {
  export const NAMESPACE = 'http://www.w3.org/ns/oa#';
  export const Annotation = namedNode(NAMESPACE + 'Annotation');
  export const RangeSelector = namedNode(NAMESPACE + 'RangeSelector');
  export const TextPositionSelector = namedNode(NAMESPACE + 'TextPositionSelector');
  export const XPathSelector = namedNode(NAMESPACE + 'XPathSelector');
  export const hasBody = namedNode(NAMESPACE + 'hasBody');
  export const hasTarget = namedNode(NAMESPACE + 'hasTarget');
  export const hasSource = namedNode(NAMESPACE + 'hasSource');
  export const hasSelector = namedNode(NAMESPACE + 'hasSelector');
  export const hasStartSelector = namedNode(NAMESPACE + 'hasStartSelector');
  export const hasEndSelector = namedNode(NAMESPACE + 'hasEndSelector');
  export const start = namedNode(NAMESPACE + 'start');
  export const end = namedNode(NAMESPACE + 'end');
  export const refinedBy = namedNode(NAMESPACE + 'refinedBy');
}
