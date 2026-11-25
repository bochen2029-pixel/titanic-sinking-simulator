// e100: the calibration epoch's Stage 0, M2 (the design v1.1, section 2; QC A-1): the half step on join 7's code.
// The 1912 damage preset at dt 0.25 (the base), 0.125 and 0.0625 s, with the level-equalising share held per second
// (params.levelRate 2, stage A1) and, for comparison, held per step as before A1 (levelRate = 0.5 / dt). Reported:
// the founder and her trim at T 30, 75, 100, 130 and 150. It gives the bounds of A1's half-step MUST row
// (tools/stairs_tests.js): auditor A measured 3.9 s and 0.015 deg between dt 0.25 and 0.125 on join 5.
//   node docs/research/experiments/e100_epoch_m2_half_step.js [--write]
'use strict';
const fs = require('fs'), path = require('path'), os = require('os');
try { os.setPriority(0, os.constants.priority.PRIORITY_BELOW_NORMAL); } catch (e) {}
const C = require('../../../core/core.js'), SC = require('../../../core/scenarios.js');
const ship = C.buildShip(), out = [], log = (s) => { out.push(s); console.log(s); };
const MARKS = [30, 75, 100, 130, 150];
function run(dt, levelRate) {
  const sim = C.createSim(ship, { dt, levelRate }, SC.PRESETS.titanic.build({}));
  const trim = {};
  while (!sim.foundered && sim.t < 5 * 3600) {
    C.step(sim);
    for (const m of MARKS) if (trim[m] === undefined && sim.t >= m * 60) trim[m] = sim.pitch * 180 / Math.PI;
  }
  return { T: sim.founderT, trim };
}
log('e100 (the epoch, M2): the 1912 preset at dt 0.25, 0.125 and 0.0625 s; the share held per second (levelRate 2) or per step (levelRate 0.5/dt)');
const base = run(0.25, 2);
const show = (lab, r) => log('  ' + lab.padEnd(44) + 'founders ' + (r.T / 60).toFixed(3) + ' min (' + (r.T - base.T >= 0 ? '+' : '') + (r.T - base.T).toFixed(2) + ' s); trim ' + MARKS.map(m => m + ': ' + (r.trim[m] === undefined ? 'n/a' : r.trim[m].toFixed(3) + ' (' + (r.trim[m] - base.trim[m] >= 0 ? '+' : '') + (r.trim[m] - base.trim[m]).toFixed(3) + ')')).join(', '));
show('dt 0.25 (the base; either way)', base);
for (const dt of [0.125, 0.0625]) {
  show('dt ' + dt + ', held per second (levelRate 2)', run(dt, 2));
  show('dt ' + dt + ', held per step (as before A1)', run(dt, 0.5 / dt));
}
if (process.argv.includes('--write')) {
  const dir = path.join(__dirname, 'results_2026-11-21'); if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, 'e100_epoch_m2_half_step.txt'), out.join('\n') + '\n(' + new Date().toISOString() + ')\n');
}
