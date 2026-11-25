// e22: Y3, the pumps on the 1912 damage. The calibrated preset (hand-made damage, 0.7506 m2) run by the core alone with
// and without the pumps as they were worked (core/scenarios.js PUMPS_1912), then two what-ifs from the pumps research
// note (docs/research/RESEARCH_pumps_bilge_ballast_v1_2026-11-17.md, section 3.3): the whole plant's bilge pumps led to
// boiler rooms 5 and 4 from 5 minutes, and every pump on every compartment it could reach. Reported: the founder time, the
// water pumped, when each pump stopped, the calibration's score (tools/calibrate.js) and its rows.
//   node docs/research/experiments/e22_pumps_1912.js [--write]
// Output of 2026-11-17: results_2026-11-17/e22_pumps_1912.txt
const fs = require('fs'), path = require('path');
const C = require('../../../core/core.js');
const SC = require('../../../core/scenarios.js');
const cal = require('../../../tools/calibrate.js');
const out = [], log = (s) => { out.push(s); console.log(s); };
const f = (v, n) => (v === null || v === undefined ? 'n/a' : v.toFixed(n === undefined ? 1 : n));
const ship = C.buildShip(), LTH = SC.LTH, T = SC.PRESETS.titanic;
function run(label, pumps, params) {
  const scen = T.build({ noPumps: true });
  if (pumps) scen.pumps = pumps;
  const sim = C.createSim(ship, params || {}, scen);
  const res = C.run(sim, { tMax: 260 * 60, every: 30 });
  const J = cal.score({ sim, res });
  log('  ' + label.padEnd(58) + (res.foundered ? 'founders ' + f(res.founderT / 60, 2) + ' min' : 'afloat').padEnd(22) + 'pumped ' + f(sim.pumped * C.RHO / 1000, 0).padStart(5) + ' t   J ' + f(J, 2));
  for (const e of sim.pumpSched) log('      ' + e.label.padEnd(84) + (e.off ? 'stopped ' + f(e.tOff / 60, 1) + ' min' : 'ran to the end'));
  return { sim, res, J };
}
// the flow parameters fitted before Y3 (without pumps); the defaults are now Y3's refit with the pumps (e23)
const OLD = { wMul: 1.182, aDown: 0.277, fOpen: 0.0101 };
log('e22: the 1912 damage (preset, core alone), founder time and the calibration score J');
log(' the flow parameters fitted before Y3, without pumps (wMul 1.182, aDown 0.277, fOpen 0.0101):');
run('no pumps', null, OLD);
run('the pumps as worked', SC.PUMPS_1912, OLD);
log(' Y3\'s refit with the pumps (the defaults: wMul ' + C.DEFAULT_PARAMS.wMul + ', aDown ' + C.DEFAULT_PARAMS.aDown + ', fOpen ' + C.DEFAULT_PARAMS.fOpen + '):');
const none = run('no pumps', null);
const as = run('the pumps as worked (BR5 from 10 min; BR4 from 30 min)', SC.PUMPS_1912);
// what-if 1: the whole bilge-connected plant (2,000 LT/h) led to boiler rooms 5 and 4 from 5 minutes, within their
// suctions (367 and 345 LT/h): the most those two rooms could take
const wi1 = run('what-if: BR5 and BR4 at their suction limits from 5 min', [
  { zone: 5, room: 5, q: 367 * LTH, t0: 300, label: 'boiler room 5 at its suctions (367 tons an hour)' },
  { zone: 6, room: 6, q: 345 * LTH, t0: 300, label: 'boiler room 4 at its suctions (345 tons an hour)' }]);
// what-if 2: every compartment with a suction pumped at its limit from 5 minutes, the pumps standing in the engine room
// (dry to the end), so none is abandoned: the holds' suctions too (as if their valves had been reachable)
const SUCT = [0, 113, 196, 196, 345, 367, 345, 367, 367, 310, 591, 541, 225, 196, 196, 0];
const all = [];
for (let k = 0; k < 16; k++) if (SUCT[k] > 0) all.push({ zone: k, room: 10, q: SUCT[k] * LTH, t0: 300, label: 'zone ' + k + ' at its suctions (' + SUCT[k] + ' tons an hour), from the engine room' });
const wi2 = run('what-if: every suction at its limit, never abandoned', all);
log('\nThe pumps as worked add ' + f((as.res.founderT - none.res.founderT) / 60, 2) + ' min (the research note\'s estimate: about 5, 2 to 11);');
log('the most boiler rooms 5 and 4 could take adds ' + f((wi1.res.founderT - none.res.founderT) / 60, 2) + ' min; every suction at its limit ' + f((wi2.res.founderT - none.res.founderT) / 60, 2) + ' min.');
log('Record: founders 160 min after the collision (157 to 160). Calibration score without pumps ' + f(none.J, 2) + ', with them ' + f(as.J, 2) + '.');
log('(The score jumps when she founders before 155 min: tools/calibrate.js then counts the trim observed at 155 min against');
log('40 degrees. The refit sits 2 minutes from that edge; the pumps as worked keep her afloat past it.)');
log('\nThe calibration rows with the pumps as worked:');
const save = console.log; const rows = []; console.log = (...a) => rows.push(a.join(' ')); cal.score({ sim: as.sim, res: as.res }, true); console.log = save;
for (const r of rows) log('  ' + r);
if (process.argv.includes('--write')) {
  const dir = path.join(__dirname, 'results_2026-11-17');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, 'e22_pumps_1912.txt'), out.join('\n') + '\n');
}
