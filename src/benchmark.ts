import Benchmark from 'benchmark';

export interface Implementation {
  name: string;
  benchmark: () => Promise<unknown>;
}

export interface BenchmarkGroup {
  name: string;
  quadCount: number;
  events: BenchmarkJsCycleEvent[];
}

export interface BenchmarkJsCycleEvent {
  name: string;
  hz: number;
  stats: {
    mean: number;
    deviation: number;
    variance: number;
    rme: number;
    sample: number[];
  };
  times: object;
}

export function runBenchmark(
  implementations: ReadonlyArray<Implementation>
): Promise<BenchmarkJsCycleEvent[]> {
  const suite = new Benchmark.Suite();
  for (const impl of implementations) {
    const fn = (deferred: { resolve: () => void }) => {
      impl.benchmark().then(() => deferred.resolve());
    };
    suite.add({name: impl.name, fn, defer: true});
  }
  return new Promise<BenchmarkJsCycleEvent[]>((resolve) => {
    const events: BenchmarkJsCycleEvent[] = [];
    suite
      .on('cycle', (event: { target: BenchmarkJsCycleEvent }) => {
        const {name, hz, stats, times} = event.target;
        events.push({name, hz, stats, times});
        console.log(String(event.target));
      })
      .on('complete', function (this: any) {
        console.log('Fastest is ' + this.filter('fastest').map('name'));
        resolve(events);
      })
      .run({async: true});
  });
}
