// e91 to e93 (G12): the helpers the three share. Plain functions; nothing here steps the model.
'use strict';
const DEG = Math.PI / 180;
const f = (v, n) => (v === null || v === undefined || !isFinite(v) ? 'n/a' : Number(v).toFixed(n === undefined ? 1 : n));
// how a piece lies: from its attitude quaternion, R = R(q); her z axis's world Z component is R[8] (the page's drawn 'up'
// is the same term, site/app.js fallMatrix)
function attitude(F, q) { const R = F.quatR(q, new Float64Array(9)); return { pitch: Math.atan2(-R[6], Math.sqrt(R[7] * R[7] + R[8] * R[8])) / DEG, roll: Math.atan2(R[7], R[8]) / DEG, up: R[8] }; }
const liesOf = (a) => (Math.abs(a.roll) < 30 ? 'upright' : (Math.abs(a.roll) > 150 ? 'UPSIDE DOWN' : 'on her side'));
// the fall on to rest (at most 30 minutes of its clock, as the trials' 20)
function toRest(F, fall) { while (!fall.done && fall.k < 4 * 60 * 30) F.advance(fall); return fall; }
// each piece at the end: how it lies, where from the point under the break, and its events
function landing(F, GI, fall) {
  return fall.pieces.map((p, i) => {
    const w = F.worldOf(fall, i, [0.5 * (p.x0 + p.x1), 0, GI.Z_NA]);
    const dX = fall.breakAt ? w[0] - fall.breakAt[0] : NaN, dY = fall.breakAt ? w[1] - fall.breakAt[1] : NaN;
    const ev = (id) => fall.events.find(e => e.id === id && e.piece === p.id);
    const a = attitude(F, p.q);
    return { id: p.id, a, lies: liesOf(a), atRest: p.state === 'at rest', dist: Math.hypot(dX, dY), along: dX, across: dY, under: ev('under'), strike: ev('strike'), rest: ev('rest') };
  });
}
// the core's pose and rates at a hand-over: trim and list in deg (list + to starboard), rates in deg/s, heave m/s
function handOf(sim) { return { trim: sim.pitch / DEG, list: sim.roll / DEG, wth: sim.wth / DEG, wph: sim.wph / DEG, vz: sim.vz }; }
// minutes after the touch on a watch, after t 0 on a preset
function Tof(sim) { const w = sim.night; return w ? (sim.t - w.tTouch) / 60 : sim.t / 60; }
function whenOf(sim) { return 'T ' + f(Tof(sim), 2) + (sim.night ? ' after the touch, step ' + sim.night.k : ' after the damage'); }
// the hinge's sense from B2's found record ('hogging' or 'sagging'; fall.js's join() takes 'hog' or 'sag')
const senseOf = (fd) => (fd.sense === 'sagging' ? 'sag' : 'hog');
// the perturbations of Z1's sensitivity runs (q1c, q1f), applied to the core's fields begin() reads, and put back after
const PERTURB = [
  { id: 'none', set: () => {} },
  { id: 'trim +1 deg', set: (s) => { s.pitch += DEG; } }, { id: 'trim -1 deg', set: (s) => { s.pitch -= DEG; } },
  { id: 'list +1 deg', set: (s) => { s.roll += DEG; } }, { id: 'list -1 deg', set: (s) => { s.roll -= DEG; } },
  { id: 'pitch rate x0.8', set: (s) => { s.wth *= 0.8; } }, { id: 'pitch rate x1.2', set: (s) => { s.wth *= 1.2; } },
  { id: 'roll rate x0.8', set: (s) => { s.wph *= 0.8; } }, { id: 'roll rate x1.2', set: (s) => { s.wph *= 1.2; } },
  { id: 'heave rate x0.8', set: (s) => { s.vz *= 0.8; } }, { id: 'heave rate x1.16', set: (s) => { s.vz *= 1.16; } },
  { id: 'heave rate x1.17', set: (s) => { s.vz *= 1.17; } }, { id: 'heave rate x1.18', set: (s) => { s.vz *= 1.18; } },
  { id: 'heave rate x1.2', set: (s) => { s.vz *= 1.2; } },
  { id: 'last-bit noise, seed 1', noise: 1 }, { id: 'last-bit noise, seed 2', noise: 2 }, { id: 'last-bit noise, seed 3', noise: 3 },
  { id: 'last-bit noise, seed 4', noise: 4 },
];
const FIELDS = ['pitch', 'roll', 'wth', 'wph', 'vz'];
// last-bit noise: Math's transcendental functions (the ones two engines may round apart, E2) give their result times
// (1 + k 2^-52), k in {-1, 0, 1} from a seeded generator, while the fall runs; put back after
const NOISY = ['log', 'exp', 'atan2', 'hypot', 'sin', 'cos', 'pow'], ULP = 2.220446049250313e-16;   // 2^-52
function withNoise(seed, fn) {
  const saved = NOISY.map(n => Math[n]); let s = (seed * 2654435761) >>> 0;
  const rnd = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s; };
  NOISY.forEach((n, i) => { const g = saved[i]; Math[n] = function () { const v = g.apply(Math, arguments), k = (rnd() % 3) - 1; return k === 0 || !isFinite(v) ? v : v * (1 + k * ULP); }; });
  try { return fn(); } finally { NOISY.forEach((n, i) => { Math[n] = saved[i]; }); }
}
// one fall from a hand-over under one perturbation: the core's fields begin() reads moved, the fall run to rest, put back
function perturbed(F, GI, sim, opts, p) {
  const keep = FIELDS.map(k => sim[k]), fallBefore = sim.fall;
  try {
    if (p.set) p.set(sim);
    const go = () => toRest(F, F.begin(sim, opts));
    const fall = p.noise ? withNoise(p.noise, go) : go();
    return { fall, land: landing(F, GI, fall), J: fall.eng.joint };
  } finally { FIELDS.forEach((k, i) => { sim[k] = keep[i]; }); sim.fall = fallBefore; }
}
module.exports = { DEG, f, attitude, liesOf, toRest, landing, handOf, Tof, whenOf, senseOf, PERTURB, perturbed, withNoise };
