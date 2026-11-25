// e31: two looks for docs/BRAINSTORM_the_descent_to_the_bed_v2_2026-11-19.md (section 1); nothing is written.
// (a) the core simply run on past the founder flag; (b) the last minutes with the upper decks' free surface split
// (params.upperSplit), with no refit.
//   node docs/research/experiments/e31_core_run_on_and_upper_split.js [TREE]
// TREE: a folder holding core/ (default: this repository). Output of 2026-11-19, on the committed tree a97a6bd:
// results_2026-11-19/e31_core_run_on_and_upper_split.txt
'use strict';
const path = require('path');
const HEAD = process.argv[2] || path.join(__dirname, '..', '..', '..');
const C = require(path.join(HEAD, 'core', 'core.js'));
const SC = require(path.join(HEAD, 'core', 'scenarios.js'));
const DEG = 180 / Math.PI, NN = C.NN;
const f = (x, n) => (x === undefined || x === null || !isFinite(x) ? String(x) : x.toFixed(n === undefined ? 1 : n));
const ship = C.buildShip();
const mk = (params) => C.createSim(ship, params || {}, SC.PRESETS.titanic.build({ areaTitanic: SC.CALIBRATED_AREA }));
const airOf = (sim) => { let a = 0; for (let n = 0; n < NN; n++) a += ship.nodeVmax[n] - Math.min(sim.vol[n], ship.nodeVmax[n]); return a; };

console.log('== (a) THE CORE RUN ON PAST THE FLAG (the 1912 damage preset)');
{
  const sim = mk(); let flagT = -1, underT = -1;
  console.log('  t min   trim    list   hullTop     vz     air m3   since the flag');
  while (sim.t < 240 * 60) {
    C.step(sim);
    if (sim.foundered && flagT < 0) flagT = sim.t;
    if (flagT >= 0 && underT < 0 && sim.hullTop < -0.5) { underT = sim.t; console.log('   wholly under (hull top 0.5 m below the sea) at t', f(sim.t / 60, 2), 'min,', f((sim.t - flagT) / 60, 2), 'min after the flag; trim', f(sim.pitch * DEG, 1), 'list', f(sim.roll * DEG, 1), 'vz', f(sim.vz, 2), 'air', f(airOf(sim), 0)); }
    const since = flagT < 0 ? -1 : sim.t - flagT;
    if (flagT >= 0 && (Math.abs(since % 60) < 1e-9 && since <= 600 || Math.abs(since % 600) < 1e-9)) console.log(' ', f(sim.t / 60, 2).padStart(7), f(sim.pitch * DEG, 1).padStart(6), f(sim.roll * DEG, 1).padStart(7), f(sim.hullTop, 1).padStart(8), f(sim.vz, 3).padStart(8), f(airOf(sim), 0).padStart(9), f(since / 60, 0).padStart(6), 'min');
    if (underT >= 0 && sim.t > underT + 120) break;
  }
  if (underT < 0) console.log('   never wholly under in', f((sim.t - flagT) / 60, 0), 'minutes after the flag');
}

console.log('\n== (b) THE LAST MINUTES WITH THE UPPER DECKS\' FREE SURFACE SPLIT (params.upperSplit 1): no refit, a look only');
const variants = [['as committed', {}], ['upperSplit 1, axUp 1.0', { upperSplit: 1 }], ['upperSplit 1, axUp 0.3', { upperSplit: 1, axUp: 0.3 }], ['upperSplit 1, axUp 3.0', { upperSplit: 1, axUp: 3.0 }]];
for (const [nm, p] of variants) {
  const sim = mk(p); const marks = [60, 100, 130, 145, 150, 152, 154, 155, 156, 157, 158, 160]; let i = 0; const rows = [];
  let t10 = -1, t20 = -1, t45 = -1, tr11 = -1, tr17 = -1, l11 = 0, l17 = 0, maxList = 0;
  while (!sim.foundered && sim.t < 5 * 3600) {
    C.step(sim);
    const p1 = sim.pitch * DEG, r = Math.abs(sim.roll * DEG);
    if (r > maxList) maxList = r;
    if (t10 < 0 && r >= 10 && sim.t > 60 * 60) t10 = sim.t; if (t20 < 0 && r >= 20) t20 = sim.t; if (t45 < 0 && r >= 45) t45 = sim.t;
    if (tr11 < 0 && p1 >= 11) { tr11 = sim.t; l11 = sim.roll * DEG; } if (tr17 < 0 && p1 >= 17) { tr17 = sim.t; l17 = sim.roll * DEG; }
    while (i < marks.length && sim.t >= marks[i] * 60) { rows.push('T' + marks[i] + ' ' + f(p1, 1) + '/' + f(sim.roll * DEG, 1)); i++; }
  }
  const ev = (id) => { const e = sim.events.find(q => q.id === id); return e ? f(e.t / 60, 1) : '-'; };
  console.log(nm.padEnd(24), 'founders', f(sim.founderT / 60, 2), 'min at trim', f(sim.pitch * DEG, 1), 'list', f(sim.roll * DEG, 1), '| list 10 deg at T', f(t10 / 60, 1), ', 20 at', t20 < 0 ? 'never' : f(t20 / 60, 1), ', 45 at', t45 < 0 ? 'never' : f(t45 / 60, 1), '| trim 11 at T', f(tr11 / 60, 2), '(list', f(l11, 1) + '), 17 at T', f(tr17 / 60, 2), '(list', f(l17, 1) + ')');
  console.log('   trim/list:', rows.join('  '));
  console.log('   marks: over F', ev('overF'), ' ports', ev('ports'), ' well', ev('well'), ' fcastle', ev('fcastle'), ' bridge', ev('bridge'), ' (record: 75, 100, 130, 145, 155)');
}
