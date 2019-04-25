import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import * as path from 'path';

// adopted from Mirador project example
const manifests = [
  { "manifestUri": "https://iiif.lib.harvard.edu/manifests/drs:48309543", "location": "Harvard University"},
  { "manifestUri": "https://iiif.lib.harvard.edu/manifests/drs:5981093", "location": "Harvard University"},
  { "manifestUri": "https://iiif.lib.harvard.edu/manifests/via:olvwork576793", "location": "Harvard University"},
  { "manifestUri": "https://iiif.lib.harvard.edu/manifests/drs:14033171", "location": "Harvard University"},
  { "manifestUri": "https://iiif.lib.harvard.edu/manifests/drs:46909368", "location": "Harvard University"},
  { "manifestUri": "https://iiif.lib.harvard.edu/manifests/drs:48331776", "location": "Harvard University"},
  { "manifestUri": "http://iiif.harvardartmuseums.org/manifests/object/299843", "location": "Harvard University"},
  { "manifestUri": "http://iiif.harvardartmuseums.org/manifests/object/304136", "location": "Harvard University"},
  { "manifestUri": "http://iiif.harvardartmuseums.org/manifests/object/198021", "location": "Harvard University"},
  { "manifestUri": "http://iiif.harvardartmuseums.org/manifests/object/320567", "location": "Harvard University"},
  { "manifestUri": "https://purl.stanford.edu/qm670kv1873/iiif/manifest.json", "location": "Stanford University"},
  { "manifestUri": "https://purl.stanford.edu/jr903ng8662/iiif/manifest.json", "location": "Stanford University"},
  { "manifestUri": "https://purl.stanford.edu/ch264fq0568/iiif/manifest.json", "location": "Stanford University"},
  { "manifestUri": "https://purl.stanford.edu/wh234bz9013/iiif/manifest.json", "location": "Stanford University"},
  { "manifestUri": "https://purl.stanford.edu/rd447dz7630/iiif/manifest.json", "location": "Stanford University"},
  { "manifestUri": "http://dms-data.stanford.edu/data/manifests/Stanford/ege1/manifest.json", "location": "Stanford University"},
  { "manifestUri": "http://dams.llgc.org.uk/iiif/4574752/manifest.json", "location": "National Library of Wales"},
  { "manifestUri": "http://dev.llgc.org.uk/iiif/ww1posters.json", "location": "National Library of Wales"},
  { "manifestUri": "http://dams.llgc.org.uk/iiif/newspaper/issue/3320640/manifest.json", "location": "National Library of Wales"},
  { "manifestUri": "http://dams.llgc.org.uk/iiif/2.0/1465298/manifest.json", "location": "National Library of Wales"},
  { "manifestUri": "http://manifests.ydc2.yale.edu/manifest/Admont23", "location": "Yale University"},
  { "manifestUri": "http://manifests.ydc2.yale.edu/manifest/Admont43", "location": "Yale University"},
  { "manifestUri": "http://manifests.ydc2.yale.edu/manifest/BeineckeMS10", "location": "Yale University"},
  { "manifestUri": "https://manifests.britishart.yale.edu/manifest/5005", "location": "Yale Center For British Art"},
  { "manifestUri": "https://manifests.britishart.yale.edu/manifest/1474", "location": "Yale Center For British Art"},
  { "manifestUri": "http://iiif.bodleian.ox.ac.uk/iiif/manifest/51a65464-6408-4a78-9fd1-93e1fa995b9c.json", "location": "Bodleian Libraries"},
  { "manifestUri": "http://iiif.bodleian.ox.ac.uk/iiif/manifest/f19aeaf9-5aba-4cee-be32-584663ff1ef1.json", "location": "Bodleian Libraries"},
  { "manifestUri": "http://iiif.bodleian.ox.ac.uk/iiif/manifest/3b31c0a9-3dab-4801-b3dc-f2a3e3786d34.json", "location": "Bodleian Libraries"},
  { "manifestUri": "http://iiif.bodleian.ox.ac.uk/iiif/manifest/e32a277e-91e2-4a6d-8ba6-cc4bad230410.json", "location": "Bodleian Libraries"},
  { "manifestUri": "http://demos.biblissima-condorcet.fr/iiif/metadata/BVMM/chateauroux/manifest.json", "location": "Biblissima"},
  { "manifestUri": "https://manifests.britishart.yale.edu/Osbornfa1", "location": "Yale Beinecke"},
  { "manifestUri": "http://www.e-codices.unifr.ch/metadata/iiif/sl-0002/manifest.json", "location": 'e-codices'},
  { "manifestUri": "http://www.e-codices.unifr.ch/metadata/iiif/bge-cl0015/manifest.json", "location": 'e-codices'},
  { "manifestUri": "http://www.e-codices.unifr.ch/metadata/iiif/fmb-cb-0600a/manifest.json", "location": 'e-codices'},
  { "manifestUri": "https://data.ucd.ie/api/img/manifests/ucdlib:33064", "location": "University College Dublin"},
  { "manifestUri": "https://data.ucd.ie/api/img/manifests/ucdlib:40851", "location": "University College Dublin"},
  { "manifestUri": "https://data.ucd.ie/api/img/manifests/ucdlib:30708", "location": "University College Dublin"},
  { "manifestUri": "http://dzkimgs.l.u-tokyo.ac.jp/iiif/zuzoubu/12b02/manifest.json", "location": "University of Tokyo"},
  { "manifestUri": "http://www2.dhii.jp/nijl/NIJL0018/099-0014/manifest_tags.json", "location": "NIJL"},
  { "manifestUri": "http://digi.vatlib.it/iiif/MSS_Vat.lat.3225/manifest.json", "location": "Vatican Library"},
  { "manifestUri": "http://media.nga.gov/public/manifests/nga_highlights.json", "location": "National Gallery of Art"},
  { "manifestUri": "https://media.nga.gov/public/manifests/multispectral_demo.json", "location": "National Gallery of Art"},
  { "manifestUri": "http://scta.info/iiif/pg-lon/manifest", "location": "Wellcome Library"}
];

async function downloadFile(url: string, dest: string): Promise<void> {
  const output = fs.createWriteStream(dest);
  try {
    try {
      const response = await openStream(url);
      response.pipe(output);
      await new Promise<void>((resolve, reject) => {
        output.on('finish', resolve)
          .on('error', reject);
      });
    } finally {
      await new Promise<void>(resolve => output.end(resolve));
    }
  } catch (err) {
    await new Promise<unknown>(resolve => fs.unlink(dest, resolve));
    throw err;
  }
}

function openStream(url: string) {
  return new Promise<http.IncomingMessage>((resolve, reject) => {
    const api = url.startsWith('https') ? https : http;
    api.get(url, response => {
      if (response.statusCode === 200) {
        resolve(response);
      } else if (
        (response.statusCode === 301 || response.statusCode === 302)
        && response.headers.location
      ) {
        resolve(openStream(response.headers.location));
      } else {
        reject(`Unexpected status code ${response.statusCode}`);
      }
    }).on('error', err => {
      reject(err);
    });
  });
}

async function downloadAll() {
  const tasks: Promise<void>[] = [];
  for (const manifest of manifests) {
    const task = downloadFile(
      manifest.manifestUri,
      path.join(
        __dirname,
        '../datasets/iiif',
        `${tasks.length.toString().padStart(2, '0')}_${manifest.location}.json`
      )
    ).then(
      () => console.log(`Downloaded ${manifest.manifestUri}`),
      error => console.error(`Failed to download ${manifest.manifestUri}`, error),
    );
    tasks.push(task);
  }
  await Promise.all(tasks);
}

downloadAll();
