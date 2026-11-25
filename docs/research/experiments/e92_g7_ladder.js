// e92 (G7): one rung of G7's ladder checked against D69's five conditions (docs/DESIGN_G7_the_forepeak_tank_v1_2026-11-20.md,
// section 4): at the numbers given and the switches given (g11: G11's widths; peakTank: the tank), the 11 validation
// verdicts (tools/validate.js in this process, its file under out/gate/e92), both founders (the preset; the watch with the
// encounter's exact area constant, as tools/calibrate.js takes it), J, the moves against join 6's numbers, the forepeak's
// tank and vent (e91's figures), and the bulkheads-to-B-deck what-if among the verdicts.
//   node docs/research/experiments/e92_g7_ladder.js '[area,wMul,aDown,fOpen]' '{"g11":0,"peakTank":1}' [--write label]
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..', '..', '..');
const C = require(path.join(root, 'core', 'core.js'));
const [area, wMul, aDown, fOpen] = JSON.parse(process.argv[2]), sw = JSON.parse(process.argv[3] || '{}');
const JOIN6 = { area: 0.7853, wMul: 1.1, aDown: 0.2647, fOpen: 0.02189 }, J0 = 9.39;
const params = Object.assign({ wMul, aDown, fOpen }, sw.g11 !== undefined ? { g11: sw.g11 } : {});
const shipOpts = sw.peakTank !== undefined ? { peakTank: sw.peakTank } : {};
const out = [], log = (s) => { out.push(s); console.log(s); };
// every ship this process builds takes the rung's switches (the preset's, the watch's, calibrate.js's, validate.js's):
// patched before the tools that build one at load are required
const mk = C.buildShip; C.buildShip = (o) => mk(Object.assign({}, shipOpts, o || {}));
const SC = require(path.join(root, 'core', 'scenarios.js'));
const N = require(path.join(root, 'core', 'night.js'));
const CAL = require(path.join(root, 'tools', 'calibrate.js'));
log('e92 (G7 ladder) on ' + root + ': area ' + area + ' m2 (' + (area * 10.7639).toFixed(2) + ' sq ft), ' + JSON.stringify(params) + ', ship ' + JSON.stringify(shipOpts));
const o = CAL.simulate({ area, params }), Jp = CAL.score(o), Tp = o.res.foundered ? o.res.founderT / 60 : NaN;
const W2 = CAL.watchFounders ? CAL.watchFounders(params, area) : { asis: CAL.watchFounder(params, area), never: NaN }, Tw = W2.never === W2.never ? W2.never : W2.asis;
log('  (2) the preset founders at T ' + Tp.toFixed(2) + ', the watch at T ' + W2.asis.toFixed(2) + ' as it is and T ' + W2.never.toFixed(2) + ' with no pumps led through the main (G18; 157 to 160 for all three)');
log('  (3) the moves against join 6: area ' + (100 * (area / JOIN6.area - 1)).toFixed(1) + ' %, wMul ' + (100 * (wMul / JOIN6.wMul - 1)).toFixed(0) + ' %, aDown ' + (100 * (aDown / JOIN6.aDown - 1)).toFixed(0) + ' %, fOpen ' + (100 * (fOpen / JOIN6.fOpen - 1)).toFixed(0) + ' % (each within half of D69\'s base: wMul 1.036, aDown 0.2815, fOpen 0.02068: ' + ['wMul', 'aDown', 'fOpen'].map(k => (100 * (params[k] / { wMul: 1.036, aDown: 0.2815, fOpen: 0.02068 }[k] - 1)).toFixed(0) + ' %').join(', ') + ')');
log('  (4) J (the preset) ' + Jp.toFixed(2) + ' (no more than ' + (1.2 * J0).toFixed(2) + '); the watch\'s term ' + (((Tw - 160) / 4) ** 2).toFixed(2) + (W2.never === W2.never ? ' (on the never-led branch, G18)' : ''));
// the forepeak's tank and vent on the watch
{
  const ship = C.buildShip(), sim = N.create(ship, N.spec(1912), { auto: true, readers: false, params });
  const tank = sim.pockets.find(k => k.name === 'the forepeak tank'), n0 = C.nodeIndex(0, 0, 0), n1 = C.nodeIndex(0, 1, 0);
  let full = null, vent0 = null, vent30 = 0, dry10 = 0;
  while (!N.over(sim) && sim.t < 5 * 3600) {
    N.step(sim); if (sim.night.tTouch < 0) continue;
    const T = (sim.t - sim.night.tTouch) / 60;
    if (T <= 10) dry10 = Math.max(dry10, sim.vol[n0] + sim.vol[n1]);
    if (tank) { if (full === null && tank.vol >= tank.cap) full = T; if (tank.dV > 0) { if (vent0 === null) vent0 = T; if (T <= 30) vent30 += tank.dV; } }
    if (T > 40) break;
  }
  log('  the forepeak on the watch: ' + (tank ? 'the tank (' + tank.cap.toFixed(0) + ' m3) full at T ' + (full === null ? 'never' : full.toFixed(1)) + '; water up its vent from T ' + (vent0 === null ? 'never' : vent0.toFixed(1)) + ', ' + vent30.toFixed(2) + ' m3 by T 30' : 'no tank') + '; its own space at most ' + dry10.toFixed(2) + ' m3 by T 10');
}
// (1) the validation table with these numbers and switches
process.env.TITANIC_OUT = path.join(root, 'out', 'gate', 'e92');
const cs = C.createSim, b0 = SC.PRESETS.titanic.build;
C.createSim = (sh, p, scen) => cs(sh, Object.assign({}, params, p || {}), scen);
SC.PRESETS.titanic.build = (p) => b0(Object.assign({ areaTitanic: area }, p || {}));
log('  (1) the validation table (its verdicts against join 6\'s: the bulkheads-to-B-deck what-if among them):');
const ol = console.log; console.log = (...a) => { const s = a.join(' '); out.push('    ' + s); ol('    ' + s); };
require(path.join(root, 'tools', 'validate.js'));
console.log = ol;
const wi = process.argv.indexOf('--write');
if (wi > 0) { const dir = path.join(__dirname, 'results_2026-11-21'); if (!fs.existsSync(dir)) fs.mkdirSync(dir); fs.appendFileSync(path.join(dir, 'e92_g7_ladder.txt'), '#### ' + (process.argv[wi + 1] || '') + '\n' + out.join('\n') + '\n\n'); }
