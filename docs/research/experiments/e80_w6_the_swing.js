// e80 (W6, Part B): what rights her between T 115 and T 135 on the 1912 damage preset (with the bunker of the fire),
// where the record's port list grows: minute by minute her list, the water's moment across the beam (sum of vol x cy,
// m4: + to port), the events, and the spaces whose share of that moment changed most over the window.
//   node docs/research/experiments/e80_w6_the_swing.js [t0 min] [t1 min] [worktree]   (seconds)
const path = require('path');
const t0 = +(process.argv[2] || 112), t1 = +(process.argv[3] || 136);
const root = process.argv[4] || path.join(__dirname, '..', '..', '..');
const C = require(path.join(root, 'core', 'core.js'));
const SC = require(path.join(root, 'core', 'scenarios.js'));
const ship = C.buildShip(), DEG = 180 / Math.PI;
const sim = C.createSim(ship, {}, SC.PRESETS.titanic.build({}));
const name = (n) => C.ZONES[n >> 2].short + ((n >> 1) & 1 ? ' stbd' : ' port') + (n & 1 ? ' upper' : ' lower');
const mom = () => { const m = new Float64Array(C.NN); for (let n = 0; n < C.NN; n++) m[n] = sim.vol[n] > 1e-6 ? sim.vol[n] * sim.cy[n] : 0; return m; };
let ev0 = 0, m0 = null, next = t0;
while (!sim.foundered && sim.t < t1 * 60) {
  C.step(sim);
  const T = sim.t / 60;
  if (T < t0) { ev0 = sim.events.length; continue; }
  if (!m0) m0 = mom();
  for (; ev0 < sim.events.length; ev0++) console.log('      event T ' + (sim.events[ev0].t / 60).toFixed(2) + ': ' + sim.events[ev0].label);
  if (T >= next) {
    const m = mom(); let tot = 0, vol = 0; for (let n = 0; n < C.NN; n++) { tot += m[n]; vol += sim.vol[n]; }
    console.log('T ' + T.toFixed(0) + '  list ' + (sim.roll * DEG).toFixed(2).padStart(6) + '  trim ' + (sim.pitch * DEG).toFixed(2) + '  water ' + vol.toFixed(0) + ' m3  moment across ' + tot.toFixed(0) + ' m4');
    next += 1;
  }
}
const m1 = mom(), d = Array.from(m1, (v, n) => [n, v - m0[n]]).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
console.log('the spaces whose moment across the beam changed most from T ' + t0 + ' to T ' + t1 + ' (m4, + to port):');
for (const [n, dv] of d.slice(0, 10)) console.log('   ' + name(n).padEnd(22) + dv.toFixed(0).padStart(9) + '   (vol ' + sim.vol[n].toFixed(0) + ' m3, cy ' + sim.cy[n].toFixed(2) + ' m)');
