# Performance benchmark for RAMP Shapes library ([see paper](https://www.researchgate.net/publication/337724413_RAMP_Shapes_Declarative_RDF_ADT_Mapping))

This is a performance benchmark for [ramp-shapes](https://github.com/ramp-shapes/ramp-shapes) library.

## Installation
1. Run `npm install` to install dependencies.
2. *(Optional)* Execute `npm link` in the checked out copy of the ramp-shapes library and `npm link ramp-shapes` to benchmark the latest library version.
3. Run `npm run build` to compile the code.

## Usage
After executing installation steps, run one of the following entry points:

| Entry point               | Description                                    |
|---------------------------|------------------------------------------------|
| `dist/fetch-manifests.js` | Fetches IIIF manifests into `datasets/iiif`    |
| `dist/annotation.js`      | Runs simple benchmark on OA annotation data    |
| `dist/iiif.js`            | Runs full benchmark on IIIF manifest data      |
| `dist/latex.js`           | Prepares benchmark stats as latex chart data   |
| `dist/comparison.js`      | Generates library comparison on simple example |

After running `dist/iiif.js` you can manually inspect frame and flatten operation results for each test case.

## References

Morozov A., Wohlgenannt G., Mouromtsev D., Pavlov D., Emelyanov Y. (2019) RAMP Shapes: Declarative RDF ↔ ADT Mapping. In: Garoufallou E., Fallucchi F., William De Luca E. (eds) Metadata and Semantic Research. MTSR 2019. Communications in Computer and Information Science, vol 1057. Springer, Cham

https://link.springer.com/chapter/10.1007/978-3-030-36599-8_4
