import * as path from 'path';

import { BenchmarkGroup } from './benchmark';
import * as Util from './util';

async function writeLatexChart(statName: string, targets: ReadonlyArray<string>) {
  const statsJson = await Util.readFile(
    path.join(__dirname, `../out/stats-${statName}.json`),
    {encoding: 'utf8'}
  );
  const stats = (JSON.parse(statsJson) as BenchmarkGroup[]);

  for (const target of targets) {
    await writeChartData(stats, statName, target);
  }
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
  const relationTotals = new Map<string, number>();
  let count = 0;
  for (const group of stats) {
    if (statName === 'frame' && group.name === '39_Vatican Library') {
      continue;
    }
    count++;
    const rdfxjsonEvent = group.events.find(e => e.name === 'rdfxjson')!;
    for (const event of group.events) {
      let total = relationTotals.get(event.name) || 0;
      total += (event.stats.mean - rdfxjsonEvent.stats.mean) / rdfxjsonEvent.stats.mean;
      relationTotals.set(event.name, total);
    }
  }
  
  for (const [targetName, relationTotal] of relationTotals) {
    const averageRelation = relationTotal / count;
    console.log(
      `'${statName}' rdfxjson performance relative to ${targetName} ` +
      `is ${(averageRelation * 100).toFixed(2)}%`
    );
  }
}

async function main() {
  await writeLatexChart('frame', ['jsonld', 'jsonld-plus-compact', 'rdfxjson']);
  await writeLatexChart('flatten', ['jsonld', 'rdfxjson']);
}

main();
