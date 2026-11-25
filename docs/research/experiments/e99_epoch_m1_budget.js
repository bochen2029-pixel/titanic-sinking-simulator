// e99: the calibration epoch's Stage 0, M1 (docs/DESIGN_calibration_epoch_v1_1_2026-11-21.md, section 2): the budget.
// The 1912 damage preset at the landed flow numbers and a range of openings, each read against the observation ledger
// (RECORD_1912, core/readers/ledger.js): the founder, the early record's rows (the sea at Symons's hatch, Robinson's
// stairs, Poingdestre's quarters; the tonnage at T 45) and the fit rows in range. It answers E-1 on join 7's code:
// the opening at which the early record is met, and her founder there (auditor E's experiment 1 had 1.0 m2 and
// T 127.3 on join 6's code).
//   node docs/research/experiments/e99_epoch_m1_budget.js [--write]
'use strict';
const fs = require('fs'), path = require('path'), os = require('os');
try { os.setPriority(0, os.constants.priority.PRIORITY_BELOW_NORMAL); } catch (e) {}
const C = require('../../../core/core.js'), SC = require('../../../core/scenarios.js'), L = require('../../../core/readers/ledger.js');
const ship = C.buildShip(), ROWS = SC.RECORD_1912, out = [], log = (s) => { out.push(s); console.log(s); };
const EARLY = ['symons_hatch1', 'robinson_mail_stairs', 'poingdestre_quarters', 'weeks_halpern_tonnage'];
function runAt(area) {
  const sim = C.createSim(ship, {}, SC.PRESETS.titanic.build({ areaTitanic: area }));
  const run = L.start(sim); L.take(run, sim);
  for (let k = 1; !sim.foundered && sim.t < 5 * 3600; k++) { C.step(sim); if (k % 20 === 0 || sim.foundered) L.take(run, sim); }
  L.close(run, sim, { onsetT: null });
  return { T: sim.foundered ? sim.founderT / 60 : NaN, res: L.evaluateAll(ROWS, run) };
}
log('e99 (the epoch, M1): the 1912 preset at the landed flow numbers (' + ['wMul', 'aDown', 'fOpen'].map(k => k + ' ' + C.DEFAULT_PARAMS[k]).join(', ') + ') and these openings, read by the ledger');
const fitIds = ROWS.filter(r => r.role === 'fit').map(r => r.id);
for (const area of [SC.CALIBRATED_AREA, 0.90, 1.00, 1.10]) {
  const r = runAt(area), by = Object.fromEntries(r.res.map(x => [x.id, x]));
  const early = EARLY.filter(id => by[id]).map(id => { const x = by[id]; return id + ' ' + (x.inRange ? 'in' : 'out') + (x.late !== null && x.late !== undefined && !Number.isNaN(x.late) ? ' (late ' + (+x.late).toFixed(1) + ')' : '') + ' model ' + (+x.model).toFixed(2); });
  const fitIn = fitIds.filter(id => by[id] && by[id].inRange).length;
  log('  opening ' + area.toFixed(4) + ' m2 (' + (area * 10.7639).toFixed(2) + ' sq ft; Cd x A ' + (0.6 * area).toFixed(3) + '): founders at T ' + r.T.toFixed(2) + '; fit rows in range ' + fitIn + ' of ' + fitIds.length);
  log('      ' + early.join('; '));
}
log('(Ledger rows are CHECKs; "late" is minutes outside the row\'s window, + late. Nothing here is fitted.)');
if (process.argv.includes('--write')) {
  const dir = path.join(__dirname, 'results_2026-11-21'); if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, 'e99_epoch_m1_budget.txt'), out.join('\n') + '\n(' + new Date().toISOString() + ')\n');
}
