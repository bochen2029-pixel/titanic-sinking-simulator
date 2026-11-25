// e77 (W6): the variants of the bunker's strength and the firemen's tunnel's height, on the 1912 watch and the 1912
// damage preset, against the three candidate bands for her list (docs/DESIGN_W6_the_lists_v1_1_2026-11-20.md, D62).
//   node docs/research/experiments/e77_w6_variants_bands.js [worktree]   (about a minute)
// Bands (+ = starboard, degrees; T minutes after the touch):
//   A, the witnesses' numbers: the most to starboard in T 5 to 10 within +3 to +7 (Hichens, the inclinometer); at T 120
//      within -3 to -9 (Rowe, "about six"); the change of side (the first time after T 20 she lists 1 degree to port)
//      between T 85 and T 110 (the boats' scraping, 12:55 to 1:35; Barrett's burst, 1:10).
//   B, A and the witnesses' signs: from T 20 to T 85 never more than 1 degree to port (five witnesses to starboard,
//      Lightoller level at T 25 to 35, Symons slight starboard at T 85); and more to port at T 145 than at T 120.
//   C, B and Halpern's reconstruction: at T 100 within -2 to +2; at T 130 within -14 to -6; at T 145 within -20 to -10.
const path = require('path');
const root = process.argv[2] || path.join(__dirname, '..', '..', '..');
const C = require(path.join(root, 'core', 'core.js'));
const N = require(path.join(root, 'core', 'night.js'));
const SC = require(path.join(root, 'core', 'scenarios.js'));
const ship = C.buildShip(), DEG = 180 / Math.PI;
const VARIANTS = [
  ['before W6 (bunker 0)', { bunker: 0 }],
  ['the bets: strength 13.0 m (T 60), tunnel 4.6 m', {}],
  ['strength 13.7 m (the head\'s peak, T 73)', { bunkerBurst: 13.7 }],
  ['never gives way', { bunkerBurst: 1e9 }],
  ['tunnel 3.4 m', { zMergeHold: 3.4 }],
  ['tunnel 6.0 m', { zMergeHold: 6.0 }],
  ['tunnel 6.0 m, never gives way', { zMergeHold: 6.0, bunkerBurst: 1e9 }],
];
function trace(make, step, t0of, done) {
  const sim = make(), L = [];                      // L[minute] = list at the end of that minute after the touch
  let side = null;
  while (!done(sim)) {
    step(sim);
    const t0 = t0of(sim); if (t0 === null) continue;
    const T = (sim.t - t0) / 60, m = Math.floor(T), r = sim.roll * DEG;
    if (m >= 0) L[m] = r;
    if (side === null && T > 20 && r <= -1) side = T;
  }
  const k = sim.pockets && sim.pockets[0];
  return { L, side, founder: sim.foundered ? (sim.founderT - t0of(sim)) / 60 : null, burst: k && k.state ? (k.t - t0of(sim)) / 60 : null };
}
function verdicts(r) {
  const L = r.L, at = (T) => L[T], max510 = Math.max(...[5, 6, 7, 8, 9, 10].map(at).filter(x => x !== undefined));
  const min2085 = Math.min(...L.slice(20, 86).filter(x => x !== undefined));
  const A = max510 >= 3 && max510 <= 7 && at(120) <= -3 && at(120) >= -9 && r.side !== null && r.side >= 85 && r.side <= 110;
  const B = A && min2085 >= -1 && at(145) < at(120);
  const Cb = B && at(100) >= -2 && at(100) <= 2 && at(130) <= -6 && at(130) >= -14 && at(145) <= -10 && at(145) >= -20;
  return { max510, min2085, A, B, C: Cb };
}
const f = (x, n) => (x === null || x === undefined || !isFinite(x) ? '  -  ' : (x >= 0 ? '+' : '') + x.toFixed(n === undefined ? 1 : n));
console.log('e77 on ' + root);
console.log('variant'.padEnd(46) + 'run      T5-10max  T10    T30    T60    T85    T100   T120   T130   T145  side   burst  founds  bands A B C');
for (const [name, params] of VARIANTS) {
  const runs = [
    ['watch ', trace(() => N.create(ship, N.spec(1912), { auto: true, params }), N.step, s => (s.night.tTouch >= 0 ? s.night.tTouch : null), s => N.over(s) || s.t > 4 * 3600)],
    ['preset', trace(() => C.createSim(ship, params, SC.PRESETS.titanic.build({})), C.step, () => 0, s => s.foundered || s.t > 4 * 3600)],
  ];
  for (const [which, r] of runs) {
    const v = verdicts(r), L = r.L;
    console.log(name.padEnd(46) + which + '   ' + [v.max510, L[10], L[30], L[60], L[85], L[100], L[120], L[130], L[145]].map(x => f(x).padStart(6)).join(' ') + ' ' + f(r.side, 0).padStart(5) + '  ' + f(r.burst, 0).padStart(5) + '  ' + (r.founder === null ? '  -   ' : r.founder.toFixed(2)) + '   ' + [v.A, v.B, v.C].map(b => (b ? 'y' : '-')).join(' '));
  }
}
