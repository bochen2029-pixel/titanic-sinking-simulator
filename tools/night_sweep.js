// How hard are the drawn nights? For each seed: no order at all, and the 1912 drill (helm hard over away from the
// ice, reversed at the touch, engines stopped a minute later) with the order 0, 5, 10, 15 and 20.5 s after the bells.
//   node tools/night_sweep.js [seeds=100] [first=1] [level=hard] [--jobs N]
// writes out/night_sweep.txt for the default level, out/night_sweep_<level>.txt for the others (core/night.js LEVELS, G1)
// --jobs N: the seeds shared among N worker threads; the table is the same to the letter (each night is its seed and
// its orders, whoever runs it), only the last line, the time taken, differs.
const fs = require('fs');
const path = require('path');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const C = require('../core/core.js');
const N = require('../core/night.js');

const cols = ['none', 0, 5, 10, 15, 20.5], f = (v, d) => v.toFixed(d === undefined ? 1 : d);
// one seed's row of the table, and what each of its six nights came to (0 clear, 1 dented, 2 seams, 3 stem)
function rowOf(ship, seed, level) {
  const sp = N.spec(seed, { level }), cells = [], kinds = [];
  cols.forEach((how) => {
    const opts = how === 'none' ? {} : { script: N.scriptOf(Object.assign({}, sp.orders, { delay: how })) };
    const s = N.summary(N.run(N.create(ship, sp, opts), { tMax: 600 }));
    let cell;
    if (s.kind === 'miss') { kinds.push(0); cell = 'clear ' + (s.clearanceExact ? '' : '>') + f(s.clearance, 0) + ' m'; }
    else if (s.kind === 'dented') { kinds.push(1); cell = 'dented'; }
    else if (s.headOn) { kinds.push(3); cell = 'STEM ' + f(s.bow.crush, 0) + ' m' + (s.stbd.area + s.port.area > 0 ? ' +' + f(s.stbd.area + s.port.area, 2) : ''); }
    else { kinds.push(2); cell = 'seams ' + f(s.stbd.area + s.port.area, 2) + ' m2'; }
    cells.push(cell.padEnd(16));
  });
  return { seed, kinds, line: String(seed).padStart(6) + '  ' + f(sp.ice.R * 2, 0).padStart(6) + ' ' + f(sp.off, 1).padStart(6) + '  ' + String(sp.sighting).padStart(6) + '  ' + f(sp.lead, 2).padStart(6) + '  ' + f(sp.ice.depths[0], 2).padStart(5) + ' | ' + cells.join(' ') };
}

if (!isMainThread) {
  const ship = C.buildShip();
  parentPort.postMessage(workerData.seeds.map(seed => rowOf(ship, seed, workerData.level)));
} else {
  const argv = process.argv.slice(2), ji = argv.indexOf('--jobs');
  const jobs = ji >= 0 ? Math.max(1, +argv[ji + 1] || 1) : 1;
  if (ji >= 0) argv.splice(ji, 2);
  const n = +(argv[0] || 100), first = +(argv[1] || 1), level = argv[2] || 'hard';
  if (!N.LEVELS[level]) { console.error('unknown level: ' + level + ' (one of ' + Object.keys(N.LEVELS).join(', ') + ')'); process.exit(1); }
  const seeds = [];
  for (let seed = first; seed < first + n; seed++) if (seed !== 1912) seeds.push(seed);
  const t0 = Date.now();
  const finish = (rows) => {
    rows.sort((a, b) => a.seed - b.seed);
    const tally = cols.map(() => ({ miss: 0, dented: 0, seams: 0, stem: 0 })), key = ['miss', 'dented', 'seams', 'stem'];
    for (const r of rows) r.kinds.forEach((k, j) => { tally[j][key[k]]++; });
    const lines = ['seed    spur m  off m  seen m  lead s  top m | ' + cols.map(c => (c === 'none' ? 'no order' : 'order +' + c + ' s').padEnd(16)).join(' ')].concat(rows.map(r => r.line));
    const tot = tally[0].miss + tally[0].dented + tally[0].seams + tally[0].stem;
    lines.push('');
    lines.push('Of ' + tot + ' nights (generator ' + N.GEN + (level === 'hard' ? '' : ', level ' + level + ': ' + N.LEVELS[level].name) + '):');
    cols.forEach((how, j) => {
      const t = tally[j], pc = v => (100 * v / tot).toFixed(0).padStart(3) + ' %';
      lines.push('  ' + (how === 'none' ? 'no order' : 'order ' + how + ' s after the bells').padEnd(30) + ' clear ' + pc(t.miss) + '   dented only ' + pc(t.dented) + '   seams opened ' + pc(t.seams) + '   stem into the ice ' + pc(t.stem));
    });
    lines.push('(' + ((Date.now() - t0) / 1000).toFixed(0) + ' s)');
    fs.writeFileSync(require('./outdir')(level === 'hard' ? 'night_sweep.txt' : 'night_sweep_' + level + '.txt'), lines.join('\n') + '\n');
    console.log(lines.slice(-8).join('\n'));
  };
  if (jobs === 1) { const ship = C.buildShip(); finish(seeds.map(seed => rowOf(ship, seed, level))); }
  else {
    // deal the seeds out like cards, so that each thread gets its share of the slow nights
    const hands = Array.from({ length: Math.min(jobs, seeds.length) }, () => []);
    seeds.forEach((seed, i) => hands[i % hands.length].push(seed));
    let rows = [], left = hands.length;
    for (const hand of hands) {
      const w = new Worker(__filename, { workerData: { seeds: hand, level } });
      w.on('message', (r) => { rows = rows.concat(r); });
      w.on('error', (e) => { console.error('a sweep thread failed: ' + e.message); process.exit(1); });
      w.on('exit', () => { if (--left === 0) finish(rows); });
    }
  }
}
