// E1c: how much does a turn's heeling moment (and a little bow-wave head at the ports) change a sinking
// where openings sit near the waterline? Britannic preset (open portholes), and the 1912 preset for contrast.
// The external roll moment is the seam sim.xMph (N m, starboard down positive). SENSITIVITY only.
// Usage: node e1_heel.js <repo root> <scratch out dir>
const path = require('path');
const root = process.argv[2], outDir = process.argv[3];
const X = require('./xcore.js').build(root, outDir);
const SC = (() => { const f = require('fs').readFileSync(path.join(root, 'core', 'scenarios.js'), 'utf8'); const m = { exports: {} }; new Function('module', 'require', f)(m, () => X); return m.exports; })();
const G = 9.81, KN = 0.514444;
const ship = X.buildShip();

function run(label, preset, opt) {
  const sim = X.createSim(ship, {}, SC.PRESETS[preset].build());
  const S = sim.conn, KO = X.K.OPEN, KB = X.K.BREACH;
  const mgGM = sim.ms * G * sim.params.GM0;            // N m per radian of static heel, intact
  let maxList = 0, listAtEnd = 0, firstPort = null;
  while (!sim.foundered && sim.t < 8 * 3600) {
    const on = sim.t < (opt.mins || 0) * 60;
    sim.xMph = on ? mgGM * (opt.heelDeg || 0) * Math.PI / 180 : 0;
    const hd = on ? Math.pow((opt.kn || 0) * KN, 2) / (2 * G) : 0;
    for (let c = 0; c < S.n; c++) if (S.a[c] < 0 && (S.kind[c] === KO || S.kind[c] === KB)) S.hx[c] = (S.kind[c] === KO ? (opt.cpPort || 0) : (opt.cpBreach || 0)) * hd;
    X.step(sim);
    if (on) listAtEnd = sim.roll * 180 / Math.PI;
    maxList = Math.max(maxList, Math.abs(sim.roll * 180 / Math.PI));
    if (firstPort === null) { let q = 0; for (let c = 0; c < S.n; c++) if (S.kind[c] === KO) q += S.q[c]; if (q > 0.01) firstPort = sim.t / 60; }
  }
  const r = X.readouts(sim);
  console.log(label.padEnd(64), (sim.foundered ? (sim.founderT / 60).toFixed(2) : 'afloat').padStart(7), ' list at end of turn', listAtEnd.toFixed(2).padStart(6), ' first porthole inflow',
    (firstPort === null ? 'never' : firstPort.toFixed(1) + ' min').padStart(9), ' water', Math.round(r.waterT));
}
console.log('case'.padEnd(64), 'founder(min)');
run('Britannic preset, at rest', 'britannic', {});
run('Britannic, 15 min turn, moment for 2 deg to starboard', 'britannic', { mins: 15, heelDeg: 2 });
run('Britannic, 15 min turn, moment for 4 deg to starboard', 'britannic', { mins: 15, heelDeg: 4 });
run('Britannic, 15 min turn, moment for 4 deg to port', 'britannic', { mins: 15, heelDeg: -4 });
run('Britannic, 30 min turn, moment for 4 deg to starboard', 'britannic', { mins: 30, heelDeg: 4 });
run('Britannic, 15 min at 15 kn, ports see +0.2 U^2/2g, no heel', 'britannic', { mins: 15, kn: 15, cpPort: 0.2 });
run('Britannic, 15 min at 15 kn, +0.2 at ports, breach Cp +0.1, 4 deg stbd', 'britannic', { mins: 15, kn: 15, cpPort: 0.2, cpBreach: 0.1, heelDeg: 4 });
run('Britannic, 30 min at 15 kn, +0.2 at ports, breach Cp +0.1, 4 deg stbd', 'britannic', { mins: 30, kn: 15, cpPort: 0.2, cpBreach: 0.1, heelDeg: 4 });
run('Titanic 1912, at rest', 'titanic', {});
run('Titanic 1912, 15 min, moment for 4 deg to starboard', 'titanic', { mins: 15, heelDeg: 4 });
run('Titanic 1912, 15 min, moment for 4 deg to port', 'titanic', { mins: 15, heelDeg: -4 });
