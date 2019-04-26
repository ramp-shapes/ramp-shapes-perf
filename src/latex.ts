import * as path from 'path';

import { BenchmarkGroup } from './benchmark';
import * as Util from './util';

async function writeLatexChart(statName: string) {
  const statsJson = await Util.readFile(
    path.join(__dirname, `../out/stats-${statName}.json`),
    {encoding: 'utf8'}
  );
  const stats = (JSON.parse(statsJson) as BenchmarkGroup[]);

  await writeChartData(stats, statName, 'jsonld');
  await writeChartData(stats, statName, 'rdfxjson');
  compareOnAverage(stats, statName);
}

async function writeChartData(stats: BenchmarkGroup[], statName: string, targetName: string) {
  let data = '';

  let index = 0;
  for (const group of stats) {
    const event = group.events.find(e => e.name === targetName);
    if (!event) {
      throw new Error(`Cannot find event with name '${targetName}' at group ${index}`);
    }
    const {mean, deviation} = event.stats;
    const x = group.quadCount;
    const y = mean * 1000;
    const yError = deviation * 1000;
    data += `${x} ${y} ${yError}\r\n`;
    index++;
  }

  await Util.makeDirectoryIfNotExists(path.join(__dirname, `../../overleaf-rdfxjson/stats`));
  await Util.writeFile(
    path.join(
      __dirname,
      `../../overleaf-rdfxjson/stats`,
      `${statName}-${targetName}.dat`
    ),
    data,
    {encoding: 'utf8'}
  );
}

function compareOnAverage(stats: BenchmarkGroup[], statName: string) {
  let totalRelation = 0;
  let count = 0;
  for (const group of stats) {
    if (statName === 'frame' && group.name === '39_Vatican Library.json') {
      continue;
    }
    count++;
    const jsonldEvent = group.events.find(e => e.name === 'jsonld')!;
    const rdfxjsonEvent = group.events.find(e => e.name === 'rdfxjson')!;
    totalRelation += (jsonldEvent.stats.mean - rdfxjsonEvent.stats.mean) / rdfxjsonEvent.stats.mean;
  }
  const averageRelation = totalRelation / count;
  console.log(`'${statName}' rdfxjson performance relative to JSON-LD is ${(averageRelation * 100).toFixed(2)}%`);
}

async function main() {
  await writeLatexChart('frame');
  await writeLatexChart('flatten');
}

main();
