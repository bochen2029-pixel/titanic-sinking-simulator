// E1a: zero-speed invariance. The patched core with every seam at its neutral value must match the
// original core BIT FOR BIT at every step of the 1912 run (all 64 volumes, pose and rates), on this machine.
// Usage: node e1_invariance.js <repo root> <scratch out dir>
const path = require('path');
const root = process.argv[2], outDir = process.argv[3];
const C = require(path.join(root, 'core', 'core.js'));
const X = require('./xcore.js').build(root, outDir);
function scen(Core) {
  // scenarios.js binds to the core it is given, so load it against each core separately
  const f = require('fs').readFileSync(path.join(root, 'core', 'scenarios.js'), 'utf8');
  const m = { exports: {} };
  new Function('module', 'require', f)(m, () => Core);
  return m.exports;
}
for (const key of ['titanic', 'britannic', 'hawke']) {
  const a = C.createSim(C.buildShip(), {}, scen(C).PRESETS[key].build());
  const b = X.createSim(X.buildShip(), {}, scen(X).PRESETS[key].build());
  let steps = 0, bad = -1;
  const f64 = (x, y) => Object.is(x, y);
  while (!a.foundered && a.t < 4 * 3600) {
    C.step(a); X.step(b); steps++;
    let same = f64(a.zO, b.zO) && f64(a.pitch, b.pitch) && f64(a.roll, b.roll) && f64(a.vz, b.vz) && f64(a.wth, b.wth) && f64(a.wph, b.wph) && f64(a.inflow, b.inflow) && a.foundered === b.foundered;
    for (let n = 0; n < 64 && same; n++) same = f64(a.vol[n], b.vol[n]);
    if (!same) { bad = steps; break; }
  }
  console.log(key.padEnd(10), 'steps compared', steps, bad < 0 ? 'ALL BIT-IDENTICAL' : 'FIRST MISMATCH at step ' + bad,
    ' end t', a.t, 'foundered', a.foundered, a.foundered ? (a.founderT / 60).toFixed(2) + ' min' : '');
}
