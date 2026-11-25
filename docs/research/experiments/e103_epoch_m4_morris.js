// e103: the calibration epoch's Stage 0, M4 (docs/DESIGN_calibration_epoch_v1_1_2026-11-21.md, sections 2 and 5): a
// Morris screen of the flooding's inputs on the 1912 damage preset. For each input its elementary effects (Morris
// 1991; four levels, a step of 2/3 of its range, ten trajectories, seed 1) on: the founder (min), the calibration's
// score J (tools/calibrate.js), and three of the observation ledger's readings (core/readers/ledger.js): the water at
// T 45 (t; Weeks and Halpern 13,717), the change of side to port (T; the record 85 to 110), Poingdestre's mark (min
// late). Printed: mu* (the mean of |EE|, in the output's unit across the input's whole range) and sigma, the inputs
// ranked by mu* on the founder. It decides which inputs the history match samples and which it freezes (D3).
//   node docs/research/experiments/e103_epoch_m4_morris.js [--write] [--r N]
'use strict';
const fs = require('fs'), path = require('path'), os = require('os');
try { os.setPriority(0, os.constants.priority.PRIORITY_BELOW_NORMAL); } catch (e) {}
const C = require('../../../core/core.js'), SC = require('../../../core/scenarios.js'), L = require('../../../core/readers/ledger.js');
const CAL = require('../../../tools/calibrate.js');
const ship = C.buildShip(), ROWS = SC.RECORD_1912, out = [], log = (s) => { out.push(s); console.log(s); };
const ri = process.argv.indexOf('--r'), R = ri > 0 ? +process.argv[ri + 1] : 10;
const D = C.DEFAULT_PARAMS;
// a split is an array of { k, f, x0, x1, z }: blend the shares f only (the first run blended the objects: NaN, so no
// opening and every run the same; every effect then printed as zero)
const blend = (t) => SC.TITANIC_SPLIT.map((s, i) => Object.assign({}, s, { f: (1 - t) * s.f + t * SC.TITANIC_SPLIT_GATE[i].f }));
// the inputs: [name, lo, hi, source of the range]; 'area' and 'split' go to the preset's build, the rest to params
const IN = [
  ['area', 0.7506, 1.115, 'D73: from the old fit to Wilding\'s 12 sq ft'], ['wMul', 1.0, 1.17, 'G11: Scotland Road clear against over its walls'],
  ['aDown', 0.14, 0.42, 'half of D69\'s base either way'], ['fOpen', 0.0103, 0.031, 'half of D69\'s base either way'],
  ['CdBreach', 0.55, 0.65, 'orifice coefficients [bet]'], ['CdDoor', 0.55, 0.65, '[bet]'], ['Cweir', 0.55, 0.65, '[bet]'],
  ['axHold', 0.025, 0.10, 'x0.5 to x2 [bet]'], ['axOpen', 3, 12, 'x0.5 to x2 [bet]'], ['zMergeHold', 3.4, 6.0, 'D64'],
  ['axUp', 0.5, 2, 'x0.5 to x2 [bet]'], ['doorLowA', 1.0, 2.0, 'the Carpathia GUESSES'], ['doorA', 1.0, 2.2, 'the Carpathia GUESSES'],
  ['leakDoor', 0.015, 0.06, 'x0.5 to x2 [bet]'], ['bunkerBurst', 9, 17, 'W6 [bet]'], ['bunkerLeak', 0.0025, 0.01, 'x0.5 to x2 [bet]'],
  ['peakVent', 0.004, 0.016, 'G7 [bet]'], ['coalListDeg', 1, 3, '[bet]'], ['GM0', 0.6, 1.0, 'Hackett and Bedford 0.80 [bet]'],
  ['levelRate', 1, 4, 'A-1: x0.5 to x2'], ['pumpAbandon', 1.5, 3.0, 'the Carpathia GUESSES'], ['split', 0, 1, 'H&B\'s split (0) to the gate\'s (1)'],
];
const OUT = ['founder', 'J', 'water45', 'toPort', 'poingdestreLate'];
let seed = 1; const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
// The coal list is the scenario's: the preset's build sets coalListDeg 2.0 and createSim takes the scenario's over the
// params', so the first run (2026-11-21 10:32), which set it in params, read 0 for it on every output (the erratum, the
// mainline 11-21 12:0x, found when the history match ruled out every set on the change of side). It goes on the built
// scenario now; the run of that date is in git.
function evalAt(u) {                              // u: each input on [0, 1]
  const params = {}, scen = {}; let coal;
  IN.forEach(([k, lo, hi], i) => { const v = lo + u[i] * (hi - lo); if (k === 'area') scen.areaTitanic = v; else if (k === 'split') scen.split = blend(v); else if (k === 'coalListDeg') coal = v; else params[k] = v; });
  const built = SC.PRESETS.titanic.build(scen); built.coalListDeg = coal;
  const sim = C.createSim(ship, params, built), run = L.start(sim), hist = [];
  L.take(run, sim);
  const rec = () => { const r = C.readouts(sim); hist.push({ t: sim.t, trim: r.trimDeg, list: r.listDeg, water: r.waterT }); };
  rec();
  for (let k = 1; !sim.foundered && sim.t < 5 * 3600; k++) { C.step(sim); if (k % 20 === 0 || sim.foundered) { L.take(run, sim); rec(); } }
  L.close(run, sim, { onsetT: null });
  const res = { hist, events: sim.events, foundered: sim.foundered, founderT: sim.founderT };
  const by = Object.fromEntries(L.evaluateAll(ROWS, run).map(x => [x.id, x]));
  const get = (id, f) => (by[id] ? +by[id][f] : NaN);
  return { founder: sim.foundered ? sim.founderT / 60 : 300, J: CAL.score({ sim, res }), water45: get('weeks_halpern_tonnage', 'model'), toPort: get('side_change', 'model'), poingdestreLate: get('poingdestre_quarters', 'reach') };
}
const k = IN.length, DELTA = 2 / 3, EE = IN.map(() => OUT.map(() => []));
{                                                 // a guard: the corners must founder, and differ
  const a = evalAt(IN.map(() => 0)), b = evalAt(IN.map(() => 1));
  if (!(a.founder < 300 && b.founder < 300 && a.founder !== b.founder)) { console.error('e103: the corners do not move the founder (' + a.founder + ', ' + b.founder + '): the inputs are not reaching the run'); process.exit(1); }
  log('  the corners: every input at its low end founders at T ' + a.founder.toFixed(2) + ', at its high end T ' + b.founder.toFixed(2));
}
log('e103 (the epoch, M4): Morris screen on the 1912 preset, ' + k + ' inputs, ' + R + ' trajectories (' + R * (k + 1) + ' runs), seed 1');
const t0 = Date.now();
for (let r = 0; r < R; r++) {
  const u = IN.map(() => (rnd() < 0.5 ? 0 : 1 / 3)), order = IN.map((_, i) => i).sort(() => rnd() - 0.5);
  let y = evalAt(u);
  for (const i of order) {
    u[i] += DELTA; const y2 = evalAt(u);
    OUT.forEach((o, j) => { const d = y2[o] - y[o]; if (Number.isFinite(d)) EE[i][j].push(d); });   // the effect across 2/3 of the range
    y = y2;
  }
  console.log('  trajectory ' + (r + 1) + ' of ' + R + ' (' + ((Date.now() - t0) / 1000).toFixed(0) + ' s)');
}
const stat = (a) => { const n = a.length || 1, m = a.reduce((s, x) => s + Math.abs(x), 0) / n, mean = a.reduce((s, x) => s + x, 0) / n, sd = Math.sqrt(a.reduce((s, x) => s + (x - mean) * (x - mean), 0) / Math.max(1, n - 1)); return [m / DELTA, sd / DELTA, mean / DELTA]; };
const rows = IN.map(([name, lo, hi, src], i) => ({ name, lo, hi, src, s: OUT.map((o, j) => stat(EE[i][j])) }));
rows.sort((a, b) => b.s[0][0] - a.s[0][0]);
log('mu* and sigma: the mean |effect| and its spread across the input\'s whole range (the founder and the late mark in min, J in its units, the water in t, the side change in min); the sign is the mean effect\'s');
log('input'.padEnd(13) + 'range'.padEnd(18) + OUT.map(o => o.padStart(22)).join(''));
for (const r of rows) log(r.name.padEnd(13) + (r.lo + ' to ' + r.hi).padEnd(18) + r.s.map(([m, sd, mean]) => ((mean >= 0 ? '+' : '-') + m.toFixed(2) + ' (' + sd.toFixed(2) + ')').padStart(22)).join(''));
log('(' + ((Date.now() - t0) / 1000).toFixed(0) + ' s. Ranges and their sources: ' + IN.map(([n, , , s]) => n + ': ' + s).join('; ') + ')');
if (process.argv.includes('--write')) {
  const dir = path.join(__dirname, 'results_2026-11-21'); if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, 'e103_epoch_m4_morris.txt'), out.join('\n') + '\n(' + new Date().toISOString() + ')\n');
}
