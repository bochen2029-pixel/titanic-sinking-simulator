// e91 (G7): the forepeak's tank as a pocket under the orlop's watertight flat, on the 1912 damage preset and the 1912
// watch: when the tank is full; when water first comes up its vent into the forepeak's own space (now from the orlop
// up), and how much has come by T 30 (against Hemming's dry storerooms and the vent he heard blowing hard, BI 17716-33);
// the forepeak's own space in the first ten minutes (the Report: "not flooded above the Orlop deck"); its water by
// T 30, 45, 60, 75, 90 and whence; and both founders, with G7 and without (peakTank 0), at the flow numbers as they are.
//   node docs/research/experiments/e91_g7_forepeak.js [params JSON] [--write label]
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..', '..', '..');
const C = require(path.join(root, 'core', 'core.js'));
const N = require(path.join(root, 'core', 'night.js'));
const SC = require(path.join(root, 'core', 'scenarios.js'));
const params = process.argv[2] && process.argv[2][0] === '{' ? JSON.parse(process.argv[2]) : {};
const out = [], log = (s) => { out.push(s); console.log(s); };
const TS = [10, 30, 45, 60, 75, 90, 120];
function trace(kind, ship) {
  const sim = kind === 'watch' ? N.create(ship, N.spec(1912), { auto: true, readers: false, params }) : C.createSim(ship, params, SC.PRESETS.titanic.build({}));
  const tank = sim.pockets.find(k => k.name === 'the forepeak tank');
  const r = { full: null, vent0: null, vent: 0, space10: 0, at: [] }, n0 = C.nodeIndex(0, 0, 0), n1 = C.nodeIndex(0, 1, 0);
  const step = kind === 'watch' ? N.step : C.step, over = kind === 'watch' ? (s) => N.over(s) : (s) => s.foundered;
  while (!over(sim) && sim.t < 5 * 3600) {
    step(sim);
    const t0 = kind === 'watch' ? sim.night.tTouch : 0; if (t0 < 0) continue;
    const T = (sim.t - t0) / 60, space = sim.vol[n0] + sim.vol[n1];
    if (tank) {
      if (r.full === null && tank.vol >= tank.cap) r.full = T;
      if (tank.dV > 0) { r.vent += tank.dV; if (r.vent0 === null) r.vent0 = T; }
      if (T <= 30) r.vent30 = r.vent;
    }
    if (T <= 10) r.space10 = Math.max(r.space10, space);
    if (r.at.length < TS.length && T >= TS[r.at.length]) r.at.push([TS[r.at.length], tank ? tank.vol : 0, space]);
  }
  r.founder = sim.foundered ? (sim.founderT - (kind === 'watch' ? sim.night.tTouch : 0)) / 60 : null;
  r.cap = tank ? tank.cap : 0;
  return r;
}
log('e91 (G7) on ' + root + ', flow numbers ' + JSON.stringify(params));
const ship = C.buildShip(), ship0 = C.buildShip({ peakTank: 0 });
for (const kind of ['preset', 'watch']) {
  const g = trace(kind, ship), o = trace(kind, ship0);
  log('== the 1912 ' + (kind === 'watch' ? 'watch' : 'damage preset') + ': founders at T ' + (g.founder === null ? 'afloat' : g.founder.toFixed(2)) + ' with the tank, T ' + (o.founder === null ? 'afloat' : o.founder.toFixed(2)) + ' without (peakTank 0)');
  log('   the tank: ' + g.cap.toFixed(0) + ' m3, full at T ' + (g.full === null ? 'never' : g.full.toFixed(1)) + '; water first up its vent at T ' + (g.vent0 === null ? 'never' : g.vent0.toFixed(1)) + ', ' + (g.vent30 || 0).toFixed(2) + ' m3 by T 30, ' + g.vent.toFixed(1) + ' m3 in all');
  log('   the forepeak\'s own space (from the orlop up) in the first ten minutes: at most ' + g.space10.toFixed(2) + ' m3 (the Report: not flooded above the Orlop deck)');
  log('   T: the tank, the space above the orlop with the tank | the forepeak below E deck without it');
  for (let i = 0; i < g.at.length; i++) log('     T ' + String(g.at[i][0]).padStart(3) + ': ' + g.at[i][1].toFixed(0).padStart(5) + ', ' + g.at[i][2].toFixed(0).padStart(5) + ' m3 | ' + (o.at[i] ? o.at[i][2].toFixed(0).padStart(5) : '-') + ' m3');
}
const wi = process.argv.indexOf('--write');
if (wi > 0) { const dir = path.join(__dirname, 'results_2026-11-21'); if (!fs.existsSync(dir)) fs.mkdirSync(dir); fs.appendFileSync(path.join(dir, 'e91_g7_forepeak.txt'), '#### ' + (process.argv[wi + 1] || '') + '\n' + out.join('\n') + '\n\n'); }
