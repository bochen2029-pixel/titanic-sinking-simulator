// e23: Y3, whether to refit the flooding's flow parameters with the pumps in the 1912 damage. tools/calibrate.js 45 with
// the opening area held at 0.7506 m2 (--fix-area) from the committed parameters gives, on 2026-11-17:
//   with the pumps as worked:   wMul 2.735, aDown 0.280, fOpen 0.01411; J 9.487, founders 156.95 min
//   without them (as before):   wMul 1.377, aDown 0.2704, fOpen 0.01033; J 10.335, founders 157.26 min
//   committed (fitted without): wMul 1.182, aDown 0.277, fOpen 0.0101;  J 10.41 without the pumps, 12.80 with them
// This runs every case of tools/validate.js under the committed parameters and under the refit, the 1912 cases with
// their pumps, and prints the outcomes side by side.
//   node docs/research/experiments/e23_pumps_refit_validation.js [--write]
// Output of 2026-11-17: results_2026-11-17/e23_pumps_refit_validation.txt
const fs = require('fs'), path = require('path');
const C = require('../../../core/core.js');
const SC = require('../../../core/scenarios.js');
const out = [], log = (s) => { out.push(s); console.log(s); };
const ship = C.buildShip(), P = SC.PRESETS;
const SETS = {
  committed: { wMul: 1.182, aDown: 0.277, fOpen: 0.0101 },
  refit: { wMul: 2.735, aDown: 0.280, fOpen: 0.01411 },
};
function cases() {
  const t5 = P.titanic.build(); t5.openings = t5.openings.filter(o => C.zoneAt(o.x) !== 5);
  const t4 = P.titanic.build(); t4.openings = t4.openings.filter(o => C.zoneAt(o.x) <= 3);
  const tD = P.titanic.build(); tD.bulkTop = { C: 'D', D: 'D', E: 'D', F: 'D', G: 'D', H: 'D', J: 'D' };
  const tB = P.titanic.build(); tB.bulkTop = Object.fromEntries(C.BULKHEADS.map(b => [b.id, 'B']));
  const tOpen = P.titanic.build(); tOpen.doorsOpen = C.BULKHEADS.map(b => b.id);
  const nb = P.britannic.build(); nb.openings = nb.openings.filter(o => o.kind !== 'porthole');
  return [['Titanic 1912, pumps as worked', P.titanic.build()], ['Titanic 1912, no pumps', P.titanic.build({ noPumps: true })],
    ['Four forward compartments (Wilding: floats)', P.four.build()], ['Five forward compartments (Wilding: sinks)', P.five.build()],
    ['Olympic-Hawke 1911 (returned to port)', P.hawke.build()], ['Britannic 1916 (sank in about 55 min)', P.britannic.build()],
    ['Britannic, portholes shut', nb], ['Titanic damage without the BR5 seam', t5], ['Titanic damage stopping at hold 3', t4],
    ['Titanic damage, bulkheads to D deck', tD], ['Titanic damage, bulkheads to B deck', tB], ['Titanic damage, doors left open', tOpen]];
}
const fmt = (res, sim) => res.foundered ? 'founders ' + (res.founderT / 60).toFixed(1) + ' min' : 'afloat, trim ' + (sim.pitch * 180 / Math.PI).toFixed(1) + ' deg';
log('e23: the validation cases under the committed flow parameters and under the refit with the pumps');
log('  ' + 'case'.padEnd(46) + 'committed'.padEnd(30) + 'refit');
for (const [label, scen] of cases()) {
  const r = {};
  for (const k of Object.keys(SETS)) {
    const sim = C.createSim(ship, SETS[k], JSON.parse(JSON.stringify(scen)));
    const res = C.run(sim, { tMax: 8 * 3600, every: 60, stopWhenStable: true });
    r[k] = fmt(res, sim);
  }
  log('  ' + label.padEnd(46) + r.committed.padEnd(30) + r.refit);
}
if (process.argv.includes('--write')) {
  const dir = path.join(__dirname, 'results_2026-11-17');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, 'e23_pumps_refit_validation.txt'), out.join('\n') + '\n');
}
