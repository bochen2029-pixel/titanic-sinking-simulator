// e114: stage D's step 1d (Bo, 2026-11-23). The first history match (2026-11-21, --d4) found the validation case "the
// 1912 damage, all bulkheads to D deck" (titanicD) failing conservation above 1e-5 m3 in 16 of its 69 sets; the step
// conserves the water (C3), and tools/conserve_tests.js holds every validation case within 1e-5 as a MUST. Which
// switch or part makes the leak? The worst set is replayed as the harness built it, its conservation followed step by
// step, then again with each of the landing's switches and the parts that came with them put back one at a time.
//   node docs/research/experiments/e114_titanicd_conservation.js [progress.jsonl] [--write]
'use strict';
const fs = require('fs'), path = require('path'), os = require('os');
try { os.setPriority(0, os.constants.priority.PRIORITY_BELOW_NORMAL); } catch (e) {}
const C = require('../../../core/core.js'), SC = require('../../../core/scenarios.js');
const out = [], log = (s) => { out.push(s); console.log(s); };
const FILE = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'C:/temp/titanic-wt-epoch-d4/out/gate/history_match/runs_02508de24d5a.jsonl';
const recs = fs.readFileSync(FILE, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch (e) { return null; } }).filter((o) => o && o.kind === 'cases');
const bad = recs.filter((o) => Math.abs(o.r.cases.titanicD.cons) > 1e-5).sort((a, b) => Math.abs(b.r.cases.titanicD.cons) - Math.abs(a.r.cases.titanicD.cons));
log('e114: titanicD conservation; ' + recs.length + ' sets with cases in ' + path.basename(FILE) + ', ' + bad.length + ' above 1e-5 m3 (the worst ' + (bad[0] ? bad[0].r.cases.titanicD.cons.toExponential(2) : 'none') + ')');
const x = bad[0].x;
log('the worst set: ' + JSON.stringify(x));
const blend = (t) => SC.TITANIC_SPLIT.map((s, i) => Object.assign({}, s, { f: (1 - t) * s.f + t * SC.TITANIC_SPLIT_GATE[i].f }));
function scen() {                                       // the harness's titanicD: the set's 1912 damage, bulkheads to D
  const b = { areaTitanic: x.area, bunkerOpen: x.bunkerOpen }; if (x.split !== 0) b.split = blend(x.split);
  const s = SC.PRESETS.titanic.build(b); if (x.coalListDeg !== undefined) s.coalListDeg = x.coalListDeg;
  s.bulkTop = { C: 'D', D: 'D', E: 'D', F: 'D', G: 'D', H: 'D', J: 'D' };
  return s;
}
const D4 = { weighOverfill: 0, g11Doors: 0, sideOpenings: 1 };
const sampled = ['bunkerBurst', 'aDown', 'fOpen', 'GM0', 'zMergeHold', 'peakVent', 'sideStrength'];
function run(label, extra, shipOpts) {
  const p = Object.assign({}, D4); for (const k of sampled) p[k] = x[k]; Object.assign(p, extra || {});
  const sim = C.createSim(C.buildShip(Object.assign({ hullEnds: 1 }, shipOpts || {})), p, scen());
  const sum = () => { let s = 0; for (let n = 0; n < sim.vol.length; n++) s += sim.vol[n]; for (const k of sim.pockets || []) s += k.vol; return s; };
  const v0 = sum(); let inSum = 0, worst = 0, prev = 0, jump = { d: 0, t: -1 }, calm = 0;
  while (sim.t < 8 * 3600 && !sim.foundered) {
    C.step(sim);
    inSum += sim.inflow * sim.params.dt;
    const err = sum() - v0 - (inSum - (sim.pumped || 0));
    if (Math.abs(err) > Math.abs(worst)) worst = err;
    if (Math.abs(err - prev) > Math.abs(jump.d)) jump = { d: err - prev, t: sim.t };
    prev = err;
    if (sim.t > 1800) { calm = (Math.abs(sim.inflow) < 0.02 && Math.abs(sim.wth) < 1e-5 && Math.abs(sim.vz) < 1e-3) ? calm + sim.params.dt : 0; if (calm > 1200) break; }
  }
  log('  ' + label.padEnd(58) + ' worst ' + worst.toExponential(2).padStart(10) + ' m3;  largest step ' + jump.d.toExponential(2).padStart(10) + ' at T ' + (jump.t / 60).toFixed(2).padStart(7) + ';  ' + (sim.foundered ? 'founders at T ' + (sim.founderT / 60).toFixed(1) : 'afloat at T ' + (sim.t / 60).toFixed(0)));
  return { worst, jump };
}
log('the case as the harness ran it, then one thing put back at a time:');
run('as the harness ran it (--d4)');
run('weighOverfill 1', { weighOverfill: 1 });
run('g11Doors 1', { g11Doors: 1 });
run('sideOpenings 0', { sideOpenings: 0 });
run('hullEnds 0', {}, { hullEnds: 0 });
run('bunker 0 (no bunker pocket)', { bunker: 0 });
run('peakTank 0 (no tank pocket)', {}, { peakTank: 0 });
run('windows 0 and stairs 0', { windows: 0, stairs: 0 });
run('conserve 0 (the cut off)', { conserve: 0 });
// Part 2: the case as the harness ran it, each step's change in the error binned by the bunker's state
{
  const p = Object.assign({}, D4); for (const k of sampled) p[k] = x[k];
  const sim = C.createSim(C.buildShip({ hullEnds: 1 }), p, scen()), k = sim.pockets.find((q) => q.name.indexOf('bunker') >= 0);
  const sum = () => { let t = 0; for (let n = 0; n < sim.vol.length; n++) t += sim.vol[n]; for (const q of sim.pockets) t += q.vol; return t; };
  const v0 = sum(); let inSum = 0, prev = 0; const bins = {};
  while (sim.t < 8 * 3600 && !sim.foundered) {
    C.step(sim); inSum += sim.inflow * sim.params.dt;
    const err = sum() - v0 - (inSum - (sim.pumped || 0)), d = err - prev; prev = err;
    const key = 'the bunker ' + (k.state === 0 ? (k.vol >= k.cap ? 'full' : 'filling') : 'given way') + ', the stokehold ' + (sim.vol[k.node] + sim.vol[k.node - 2] > 0 ? 'wet' : 'dry');
    const B = bins[key] || (bins[key] = { steps: 0, sum: 0, big: 0, first: -1 });
    B.steps++; B.sum += d; if (Math.abs(d) > 1e-9) { B.big++; if (B.first < 0) B.first = sim.t / 60; }
  }
  log('Part 2: where the water goes (the bunker gave way at T ' + (k.t / 60).toFixed(2) + '):');
  for (const [key, B] of Object.entries(bins)) log('  ' + key.padEnd(40) + String(B.steps).padStart(7) + ' steps; error made ' + B.sum.toExponential(2).padStart(10) + '; steps over 1e-9 m3: ' + B.big + (B.first >= 0 ? ' (the first at T ' + B.first.toFixed(2) + ')' : ''));
  log('So: a fault in the step, met while the bunker of the fire (W6) fills with water on both sides of its door; not the landing\'s switches, not C3\'s cut (with the cut off the step makes 0.31 m3, as before C3).');
  log('The cause (D89, the mainline 11-23): core/core.js solvePair set a port-and-starboard pair holding 1e-6 m3 or less to nothing, so the trace the bunker\'s door trickles into a stokehold the pumps keep dry was lost, up to 1e-6 m3 a step. Mended by params.keepTrace (on): the trace is kept, with no surface and no head; 0 zeroes it as before. On the mended core this run reads 9.5e-10 m3 at worst (roundoff): results_2026-11-23/e114_titanicd_conservation_after_d89.txt.');
}
if (process.argv.includes('--write')) {
  const dir = path.join(__dirname, 'results_2026-11-23'); if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, 'e114_titanicd_conservation.txt'), out.join('\n') + '\n(' + new Date().toISOString() + ')\n');
}
