'use strict';
// e83 (first numbered e70, renumbered at the coordinator's word: the mainline's e70 is E1's engine probe): the part of
// a box below a plane, its volume, area and first moments, exactly (Z1, 2026-11-20; Z6 milestone 2's groundwork after
// e69: the water's centroid in each of the core's column boxes at any attitude, for the moments of each space's water
// and air). The library, e83_z6_box_moments_lib.js, and these tests were derived and written by a
// Fable subagent at Bo's word (18:31 CST, relayed by the coordinator), briefed and rerun by Z1 (PASS). Tests against an
// independent integration (exact along the axis of the largest |g|, a midpoint grid over the other two): 705 cases,
// 400 random and 305 degenerate (g along an axis, tiny components, corner levels, coordinate planes).
//   node docs/research/experiments/e83_z6_box_moments.js [gridN=1500] [randomCases=400]
// Output of 2026-11-20 (its stdout): results_2026-11-20/e83_z6_box_moments.txt
const { boxMoments } = require('./e83_z6_box_moments_lib.js');

const N = +(process.argv[2] || 1500);
const NRAND = +(process.argv[3] || 400);

// ---- a seeded generator (mulberry32) ----
let seed = 20261120;
function rnd() {
  seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function gauss() { return Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(2 * Math.PI * rnd()); }
function unit(v) { const n = Math.hypot(v[0], v[1], v[2]); return [v[0] / n, v[1] / n, v[2] / n]; }

// ---- the reference: exact along the axis of the largest |g|, midpoint grid over the two others ----
function reference(w, g, s, n) {
  let m = 0;
  if (Math.abs(g[1]) > Math.abs(g[m])) m = 1;
  if (Math.abs(g[2]) > Math.abs(g[m])) m = 2;
  const i = (m + 1) % 3, j = (m + 2) % 3;
  const wi = w[i], wj = w[j], wm = w[m], gi = g[i], gj = g[j], gm = g[m];
  const hi = 2 * wi / n, hj = 2 * wj / n;
  let V = 0, Mi = 0, Mj = 0, Mm = 0;
  for (let a = 0; a < n; a++) {
    const ti = -wi + (a + 0.5) * hi;
    const base = s - gi * ti;
    let rowL = 0, rowJ = 0, rowM = 0;
    for (let b = 0; b < n; b++) {
      const tj = -wj + (b + 0.5) * hj;
      const c = (base - gj * tj) / gm;
      let lo = -wm, up = wm;
      if (gm > 0) { if (c < up) up = c; } else { if (c > lo) lo = c; }
      if (up > lo) {
        const len = up - lo;
        rowL += len; rowJ += tj * len; rowM += 0.5 * (up * up - lo * lo);
      }
    }
    V += rowL; Mi += ti * rowL; Mj += rowJ; Mm += rowM;
  }
  const dA = hi * hj;
  const M = [0, 0, 0];
  M[i] = Mi * dA; M[j] = Mj * dA; M[m] = Mm * dA;
  return { V: V * dA, M };
}

// ---- the brief's own V and A (the CDF of three uniforms), a second independent check ----
function cdf1(t, l3) { if (t <= 0) return [0, 0]; if (t >= l3) return [1, 0]; return [t / l3, 1 / l3]; }
function cdf2(t, l2, l3) { if (t <= 0) return [0, 0]; if (t >= l2 + l3) return [1, 0]; const d = 2 * l2 * l3; if (t < l2) return [t * t / d, t / (l2 * l3)]; if (t < l3) return [(t - 0.5 * l2) / l3, 1 / l3]; const u = l2 + l3 - t; return [1 - u * u / d, u / (l2 * l3)]; }
function cdf3(t, l1, l2, l3) { const top = l1 + l2 + l3; if (t <= 0) return [0, 0]; if (t >= top) return [1, 0]; if (l2 < 1e-5 * l3) return cdf1(t - 0.5 * (l1 + l2), l3); if (l1 < 1e-5 * l2) return cdf2(t - 0.5 * l1, l2, l3); const p = (x) => (x > 0 ? x : 0); const a = [t, t - l1, t - l2, t - l3, t - l1 - l2, t - l1 - l3, t - l2 - l3, t - top], sg = [1, -1, -1, -1, 1, 1, 1, -1]; let c = 0, d = 0; for (let k = 0; k < 8; k++) { const v = p(a[k]); c += sg[k] * v * v * v; d += sg[k] * v * v; } const den = l1 * l2 * l3; return [c / (6 * den), d / (2 * den)]; }
function briefVA(w, g, s) {
  const l = [2 * w[0] * Math.abs(g[0]), 2 * w[1] * Math.abs(g[1]), 2 * w[2] * Math.abs(g[2])].sort((x, y) => x - y);
  const r = cdf3(s + 0.5 * (l[0] + l[1] + l[2]), l[0], l[1], l[2]);
  const Vbox = 8 * w[0] * w[1] * w[2];
  return [Vbox * r[0], Vbox * r[1]];
}

// ---- cases ----
const cases = [];
function rw() { return [0.2 + 7.8 * rnd(), 0.2 + 7.8 * rnd(), 0.2 + 7.8 * rnd()]; }
function bsum(w, g) { return w[0] * Math.abs(g[0]) + w[1] * Math.abs(g[1]) + w[2] * Math.abs(g[2]); }
function add(kind, w, g, fr) { cases.push({ kind, w, g, s: fr * bsum(w, g) }); }
const FRS = [-1.05, -0.93, -0.5, -0.11, 0, 0.27, 0.6, 0.97, 1.05];

for (let c = 0; c < NRAND; c++) add('random', rw(), unit([gauss(), gauss(), gauss()]), -1.2 + 2.4 * rnd());
// g exactly along each axis, + and -
for (let k = 0; k < 3; k++) for (const sg of [1, -1]) {
  const g = [0, 0, 0]; g[k] = sg;
  const w = rw();
  for (const fr of FRS) add('axis', w, g, fr);
}
// one component tiny relative to the others (others random), then two tiny
for (const eps of [1e-9, 1e-6, 1e-4, 1e-12, 1e-2]) for (let k = 0; k < 3; k++) {
  const w = rw();
  const v = [gauss(), gauss(), gauss()]; v[k] = (rnd() < 0.5 ? -1 : 1) * eps;
  const g = unit(v);
  for (const fr of [-0.97, -0.4, 0.05, 0.55, 0.99]) add('tiny1 ' + eps, w, g, fr);
  const v2 = [(rnd() < 0.5 ? -1 : 1) * eps, (rnd() < 0.5 ? -1 : 1) * eps * (0.3 + rnd()), (rnd() < 0.5 ? -1 : 1) * eps * (0.3 + rnd())];
  v2[k] = rnd() < 0.5 ? -1 : 1;
  const g2 = unit(v2);
  for (const fr of [-0.97, -0.4, 0.05, 0.55, 0.99]) add('tiny2 ' + eps, w, g2, fr);
  // very close to the box's corner levels, where the tiny widths matter
  for (const fr of [-1 + 0.5 * eps, 1 - 0.5 * eps]) add('tiny2edge ' + eps, w, g2, fr);
}
// g in a coordinate plane (one component exactly 0)
for (let k = 0; k < 3; k++) for (let r = 0; r < 4; r++) {
  const w = rw();
  const v = [gauss(), gauss(), gauss()]; v[k] = 0;
  const g = unit(v);
  for (const fr of [-0.9, -0.3, 0.1, 0.7, 0.98]) add('plane', w, g, fr);
}
// a plane case with equal products (the trapezoid a triangle), and a cube on its corner
add('equal', [2, 2, 2], unit([1, 1, 0]), 0.3);
add('equal', [1, 2, 4], unit([4, 2, 1]), -0.2);
for (const fr of FRS) add('corner', [3, 3, 3], unit([1, -1, 1]), fr);

// ---- run ----
const out = { V: 0, A: 0, M: [0, 0, 0] };
const o2 = { V: 0, A: 0, M: [0, 0, 0] };
const worst = {};
function note(kind, name, v, c) {
  for (const key of [kind.split(' ')[0], 'ALL']) {
    const wk = worst[key] || (worst[key] = {});
    if (!wk[name] || v > wk[name].v || !(v === v)) wk[name] = { v, c };
  }
}
function Vof(w, g, s) { return boxMoments(w, g, s, o2).V; }

const t0 = Date.now();
for (const c of cases) {
  const { w, g, s, kind } = c;
  const Vbox = 8 * w[0] * w[1] * w[2], wmax = Math.max(w[0], w[1], w[2]), B = bsum(w, g);
  boxMoments(w, g, s, out);
  const V = out.V, A = out.A, M = [out.M[0], out.M[1], out.M[2]];
  const ref = reference(w, g, s, N);
  note(kind, 'V vs grid', Math.abs(V - ref.V) / Vbox, c);
  for (let k = 0; k < 3; k++) note(kind, 'M' + (k + 1) + ' vs grid', Math.abs(M[k] - ref.M[k]) / (Vbox * wmax), c);
  // exact zeros by symmetry
  for (let k = 0; k < 3; k++) if (g[k] === 0 && M[k] !== 0) note(kind, 'M_k not 0 where g_k = 0', 1, c);
  // against the brief's V and A
  const br = briefVA(w, g, s);
  note(kind, 'V vs brief cdf3', Math.abs(V - br[0]) / Vbox, c);
  // the breakpoints of V(s)
  const b = [w[0] * Math.abs(g[0]), w[1] * Math.abs(g[1]), w[2] * Math.abs(g[2])];
  const bp = [];
  for (let m = 0; m < 8; m++) bp.push((m & 1 ? b[0] : -b[0]) + (m & 2 ? b[1] : -b[1]) + (m & 4 ? b[2] : -b[2]));
  bp.sort((x, y) => x - y);
  let near = Infinity;
  for (const x of bp) near = Math.min(near, Math.abs(s - x));
  // Between two breakpoints V is one cubic, so a central difference with Richardson's
  // step halving is exact there: keep both steps inside the piece.
  const d = Math.min(1e-3 * B, 0.5 * near);
  if (near > 1e-7 * B) {
    // the brief's cdf3 drops a width under 1e-5 of the next: within that width of a
    // breakpoint its A is a step where the true A is a ramp, so compare away from them
    if (near > 3e-5 * B) note(kind, 'A vs brief cdf3', Math.abs(A - br[1]) * B / Vbox, c);
    const D1 = (Vof(w, g, s + d) - Vof(w, g, s - d)) / (2 * d);
    const D2 = (Vof(w, g, s + 0.5 * d) - Vof(w, g, s - 0.5 * d)) / d;
    const dV = (4 * D2 - D1) / 3;
    note(kind, 'A vs dV/ds', Math.abs(A - dV) * B / Vbox, c);
  }
  // g.M = s V - integral of V (Simpson between the breakpoints: V is a cubic there)
  let iv = 0;
  for (let m = 0; m < 7; m++) {
    const a = bp[m], e = Math.min(bp[m + 1], s);
    if (e > a) iv += (e - a) / 6 * (Vof(w, g, a) + 4 * Vof(w, g, 0.5 * (a + e)) + Vof(w, g, e));
  }
  if (s > bp[7]) iv += (s - bp[7]) * Vbox;
  const gM = g[0] * M[0] + g[1] * M[1] + g[2] * M[2];
  note(kind, 'g.M vs sV - int V', Math.abs(gM - (s * V - iv)) / (Vbox * B), c);
  // the mirror: (g, s) -> (-g, -s) is the complement; M(box) = 0
  boxMoments(w, [-g[0], -g[1], -g[2]], -s, o2);
  note(kind, 'V + V(mirror) = Vbox', Math.abs(V + o2.V - Vbox) / Vbox, c);
  for (let k = 0; k < 3; k++) note(kind, 'M + M(mirror) = 0', Math.abs(M[k] + o2.M[k]) / (Vbox * wmax), c);
  // wholly below, wholly above
  if (s >= B && !(V === Vbox && A === 0 && M[0] === 0 && M[1] === 0 && M[2] === 0)) note(kind, 'wholly below wrong', 1, c);
  if (s <= -B && !(V === 0 && A === 0 && M[0] === 0 && M[1] === 0 && M[2] === 0)) note(kind, 'wholly above wrong', 1, c);
}
const secs = (Date.now() - t0) / 1000;

// ---- timing ----
const POOL = 1024, pw = [], pg = [], ps = [];
for (let i = 0; i < POOL; i++) {
  const w = rw(); let g = unit([gauss(), gauss(), gauss()]);
  if (i % 4 === 0) { g = [0, 0, 0]; g[i % 3] = i % 8 ? 1 : -1; }      // a quarter along an axis
  pw.push(w); pg.push(g); ps.push((-0.98 + 1.96 * rnd()) * bsum(w, g));  // all cut by the plane
}
let sink = 0;
for (let i = 0; i < 200000; i++) { boxMoments(pw[i & 1023], pg[i & 1023], ps[i & 1023], out); sink += out.V; }
const CALLS = 1e6;
const h0 = process.hrtime.bigint();
for (let i = 0; i < CALLS; i++) { const k = i & 1023; boxMoments(pw[k], pg[k], ps[k], out); sink += out.M[0]; }
const h1 = process.hrtime.bigint();
const nsCall = Number(h1 - h0) / CALLS;
const h2 = process.hrtime.bigint();
for (let i = 0; i < CALLS; i++) { const k = i & 1023; boxMoments(pw[k], pg[k], 1e3, out); sink += out.V; }
const h3 = process.hrtime.bigint();
const nsOut = Number(h3 - h2) / CALLS;

// ---- report ----
const TOL = {
  'V vs grid': 2e-6, 'M1 vs grid': 2e-6, 'M2 vs grid': 2e-6, 'M3 vs grid': 2e-6,
  // 1e-7: the brief's own approximation where it drops a small width
  'V vs brief cdf3': 1e-7, 'A vs brief cdf3': 1e-6, 'A vs dV/ds': 1e-6,
  'g.M vs sV - int V': 1e-11, 'V + V(mirror) = Vbox': 1e-12, 'M + M(mirror) = 0': 1e-12,
};
let fail = 0;
console.log('cases: ' + cases.length + ' (' + NRAND + ' random), reference grid ' + N + ' x ' + N + ', ' + secs.toFixed(1) + ' s');
for (const key of Object.keys(worst).sort((a, b) => (a === 'ALL') - (b === 'ALL'))) {
  console.log('[' + key + ']');
  for (const name of Object.keys(worst[key])) {
    const r = worst[key][name];
    const tol = TOL[name] === undefined ? 0 : TOL[name];
    const ok = r.v <= tol;
    if (!ok && key === 'ALL') fail++;
    let line = '  ' + name.padEnd(26) + r.v.toExponential(2) + (ok ? '' : '   FAIL (tol ' + tol + ')');
    if (!ok || key === 'ALL') line += '   at w=[' + r.c.w.map((x) => x.toFixed(3)) + '] g=[' + r.c.g.map((x) => x.toExponential(3)) + '] s=' + r.c.s.toFixed(5) + ' (' + r.c.kind + ')';
    console.log(line);
  }
}
console.log('time per call: ' + nsCall.toFixed(0) + ' ns (cut boxes, a quarter of them with g along an axis); ' + nsOut.toFixed(0) + ' ns wholly below (early out)   [' + (sink === sink ? 'ok' : 'NaN') + ']');
if (!(sink === sink)) fail++;
console.log(fail ? 'RESULT: FAIL (' + fail + ')' : 'RESULT: PASS');
process.exit(fail ? 1 : 0);
