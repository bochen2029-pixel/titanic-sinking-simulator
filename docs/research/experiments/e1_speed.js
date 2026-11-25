// E1b: how much does ship speed change the 1912 sinking in THIS model, under simple, bounded assumptions?
// The external head at each hull opening is hx = Cp * U(t)^2 / (2 g); optional grazing-flow loss cm(U).
// Nothing here is a validated hydrodynamic model: it measures SENSITIVITY, to rank what is worth modelling.
// Usage: node e1_speed.js <repo root> <scratch out dir>
const path = require('path');
const root = process.argv[2], outDir = process.argv[3];
const X = require('./xcore.js').build(root, outDir);
const SC = (() => { const f = require('fs').readFileSync(path.join(root, 'core', 'scenarios.js'), 'utf8'); const m = { exports: {} }; new Function('module', 'require', f)(m, () => X); return m.exports; })();
const KN = 0.514444, G = 9.81, L = 259.08, XFP = X.G.xFP;
const ship = X.buildShip();

// speed profiles, t in seconds after the collision
const ELL = 3816;                        // m: m(1+k)/c = 50.49e6 kg / 13,231 kg/m (hull drag from Biles's 165 tons at 21 kn; abacus1:4cefc0a23470)
const prof = {
  stopped: () => 0,
  crash: (U0) => (t) => Math.max(0, U0 * (1 - t / 195)),                  // trial crash stop: 3 min 15 s
  coast: (U0) => (t) => U0 / (1 + U0 * t / ELL),                          // engines stopped, hull drag only
  hold: (U0, mins) => (t) => (t < mins * 60 ? U0 : Math.max(0, U0 * (1 - (t - mins * 60) / 195))),
  stopThenAhead: (U0, U1, t1, t2) => (t) => {                              // crash stop, rest, then ahead again
    if (t < 195) return U0 * (1 - t / 195);
    if (t < t1 * 60) return 0;
    if (t < t1 * 60 + 60) return U1 * (t - t1 * 60) / 60;
    if (t < t2 * 60) return U1;
    return Math.max(0, U1 * (1 - (t - t2 * 60) / 120));
  },
};
// pressure-coefficient assumptions for side openings; xi = distance aft of the stem / L
const cp = {
  zero: () => 0,
  plus10: () => 0.10,
  minus10: () => -0.10,
  bowProfile: (xi) => 0.5 * Math.exp(-xi / 0.04) - 0.06,
  ram: () => 1.0,
};
const cmf = { none: () => 1, grazing: (U) => 1 / Math.sqrt(1 + 0.5 * (U * U / (2 * G)) / 7.0) };

function runCase(label, uOf, cpOf, cmOf, presetKey) {
  const sim = X.createSim(ship, {}, SC.PRESETS[presetKey || 'titanic'].build());
  const S = sim.conn, KB = X.K.BREACH, KO = X.K.OPEN;
  const idx = []; for (let c = 0; c < S.n; c++) if (S.a[c] < 0 && (S.kind[c] === KB || S.kind[c] === KO)) idx.push(c);
  let w20 = 0, w40 = 0, trim30 = 0, in0 = 0;
  while (!sim.foundered && sim.t < 8 * 3600) {
    const U = uOf(sim.t), hd = U * U / (2 * G), m = cmOf(U);
    for (const c of idx) { S.hx[c] = cpOf((XFP - S.x[c]) / L) * hd; S.cm[c] = m; }
    X.step(sim);
    if (sim.t === 60) in0 = sim.inflow * 1.025 * 60;
    if (sim.t === 1200) w20 = X.readouts(sim).waterT;
    if (sim.t === 1800) trim30 = sim.pitch * 180 / Math.PI;
    if (sim.t === 2400) w40 = X.readouts(sim).waterT;
  }
  const overF = sim.events.find(e => e.id === 'overF');
  return { label, founder: sim.foundered ? sim.founderT / 60 : null, in0, w20, w40, trim30, overF: overF ? overF.t / 60 : null };
}

const U225 = 22.5 * KN, U10 = 10 * KN, U8 = 8 * KN, U5 = 5 * KN;
const cases = [
  ['baseline: at rest from the collision', prof.stopped, cp.zero, cmf.none],
  ['crash stop from 22.5 kn, Cp +0.10', prof.crash(U225), cp.plus10, cmf.none],
  ['crash stop from 22.5 kn, Cp -0.10', prof.crash(U225), cp.minus10, cmf.none],
  ['crash stop from 22.5 kn, bow Cp profile', prof.crash(U225), cp.bowProfile, cmf.none],
  ['crash stop from 22.5 kn, bow profile + grazing loss', prof.crash(U225), cp.bowProfile, cmf.grazing],
  ['coast from 22.5 kn (no astern), bow Cp profile', prof.coast(U225), cp.bowProfile, cmf.none],
  ['coast from 22.5 kn, Cp +0.10', prof.coast(U225), cp.plus10, cmf.none],
  ['coast from 22.5 kn, Cp -0.10', prof.coast(U225), cp.minus10, cmf.none],
  ['coast from 22.5 kn, bow profile + grazing loss', prof.coast(U225), cp.bowProfile, cmf.grazing],
  ['stop, then 8 kn ahead from +10 to +20 min, Cp +0.10', prof.stopThenAhead(U225, U8, 10, 20), cp.plus10, cmf.none],
  ['stop, then 8 kn ahead from +10 to +20 min, bow profile', prof.stopThenAhead(U225, U8, 10, 20), cp.bowProfile, cmf.none],
  ['stop, then 8 kn ahead from +10 to +20 min, RAM (Cp 1)', prof.stopThenAhead(U225, U8, 10, 20), cp.ram, cmf.none],
  ['stop, then 8 kn ahead from +10 to +30 min, Cp +0.10', prof.stopThenAhead(U225, U8, 10, 30), cp.plus10, cmf.none],
  ['stop, then 8 kn ahead from +10 to +30 min, bow profile', prof.stopThenAhead(U225, U8, 10, 30), cp.bowProfile, cmf.none],
  ['stop, then 8 kn ahead from +10 to +30 min, RAM (Cp 1)', prof.stopThenAhead(U225, U8, 10, 30), cp.ram, cmf.none],
  ['hold 22.5 kn for 10 min, bow Cp profile', prof.hold(U225, 10), cp.bowProfile, cmf.none],
  ['hold 22.5 kn for 30 min, bow Cp profile', prof.hold(U225, 30), cp.bowProfile, cmf.none],
  ['hold 22.5 kn to the end, bow Cp profile', prof.hold(U225, 999), cp.bowProfile, cmf.none],
  ['hold 22.5 kn to the end, Cp +0.10', prof.hold(U225, 999), cp.plus10, cmf.none],
  ['hold 22.5 kn to the end, Cp -0.10', prof.hold(U225, 999), cp.minus10, cmf.none],
  ['hold 22.5 kn to the end, RAM (Cp 1): upper bound', prof.hold(U225, 999), cp.ram, cmf.none],
  ['hold 22.5 kn to the end, bow profile + grazing loss', prof.hold(U225, 999), cp.bowProfile, cmf.grazing],
  ['hold 10 kn to the end, bow Cp profile', prof.hold(U10, 999), cp.bowProfile, cmf.none],
  ['hold 10 kn to the end, RAM (Cp 1)', prof.hold(U10, 999), cp.ram, cmf.none],
  ['hold 5 kn to the end, RAM (Cp 1)', prof.hold(U5, 999), cp.ram, cmf.none],
];
const res = cases.map(c => runCase(c[0], c[1], c[2], c[3]));
const base = res[0];
const f = (v, d) => (v === null ? '  n/a' : v.toFixed(d));
console.log('dynamic head U^2/2g: 5 kn', (U5 * U5 / 2 / G).toFixed(3), 'm; 8 kn', (U8 * U8 / 2 / G).toFixed(3), 'm; 10 kn', (U10 * U10 / 2 / G).toFixed(3), 'm; 22.5 kn', (U225 * U225 / 2 / G).toFixed(3), 'm');
console.log('case'.padEnd(58), 'founder  d(min)  in@1min  water20  water40  trim30  overF');
for (const r of res) {
  console.log(r.label.padEnd(58), f(r.founder, 2).padStart(7), (r.founder === null ? '' : (r.founder - base.founder >= 0 ? '+' : '') + (r.founder - base.founder).toFixed(2)).padStart(7),
    f(r.in0, 0).padStart(8), f(r.w20, 0).padStart(8), f(r.w40, 0).padStart(8), f(r.trim30, 2).padStart(7), f(r.overF, 1).padStart(6));
}
