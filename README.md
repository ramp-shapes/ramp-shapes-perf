# Performance benchmark for rdfxjson

This is a performance benchmark for [rdfxjson](https://github.com/AlexeyMz/rdfxjson) library.

## Usage instructions
Use `npm install` to install dependencies and `npm run build` to compile the code. Then run one of the following entry points:

| Entry point               | Description                                  |
|---------------------------|----------------------------------------------|
| `dist/fetch-manifests.js` | Fetches IIIF manifests into `datasets/iiif`  |
| `dist/annotation.js`      | Runs simple benchmark on OA annotation data  |
| `dist/iiif.js`            | Runs full benchmark on IIIF manifest data    |
| `dist/latex.js`           | Prepares benchmark stats as latex chart data |

After running `dist/iiif.js` you can manually inspect frame and flatten operation results for each test case.
