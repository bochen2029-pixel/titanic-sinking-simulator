// e81 (W6, Part B): how freely the water passes E deck over the boiler rooms, and her late list. The core's openings
// through E deck are two a side in every compartment (K_DOWN, params.aDown: "stairways and hatches", calibrated, 0.28
// m2 a side). Over the boiler rooms the ship had more: the casings, the escapes, the stokeholds' ladders and gratings.
// A sensitivity test, not a law: their area in zones 4 to 9 (boiler rooms 6 to 1) multiplied by a factor, put back
// after every rebuild of the connections, on the 1912 damage with the bunker of the fire in.
//   node docs/research/experiments/e81_w6_e_deck_openings.js [worktree]   (about half a minute)
const path = require('path');
const root = process.argv[2] || path.join(__dirname, '..', '..', '..');
const C = require(path.join(root, 'core', 'core.js'));
const SC = require(path.join(root, 'core', 'scenarios.js'));
const ship = C.buildShip(), DEG = 180 / Math.PI;
const MARKS = [10, 60, 85, 100, 110, 115, 120, 125, 130, 135, 140, 145, 150, 155];
const f = (x) => (x === undefined || !isFinite(x) ? '  -  ' : (x >= 0 ? '+' : '') + x.toFixed(1));
console.log('e81 on ' + root + ': the openings through E deck over boiler rooms 6 to 1 (zones 4 to 9) times a factor');
console.log('factor'.padEnd(10) + MARKS.map(m => ('T' + m).padStart(6)).join('') + '   founds');
for (const k of [1, 2, 5, 20]) {
  const sim = C.createSim(ship, {}, SC.PRESETS.titanic.build({}));
  let conn = null;
  const widen = () => { const S = sim.conn; for (let c = 0; c < S.n; c++) if (S.kind[c] === C.K.DOWN && S.idx[c] >= 4 && S.idx[c] <= 9) S.area[c] *= k; conn = S; };
  const L = {};
  while (!sim.foundered && sim.t < 5 * 3600) {
    if (sim.conn !== conn) widen();
    C.step(sim);
    const T = sim.t / 60;
    for (const m of MARKS) if (L[m] === undefined && T >= m) L[m] = sim.roll * DEG;
  }
  console.log(('x ' + k).padEnd(10) + MARKS.map(m => f(L[m]).padStart(6)).join('') + '   ' + (sim.foundered ? (sim.founderT / 60).toFixed(2) : '-'));
}
