'use strict';
// e68: Z6's joint on rigid bodies, against closed forms (Z1, 2026-11-20; docs/DESIGN_free_body_air_by_space_v1_1, sections
// 1 and 5). Standalone: no fall.js, no core; the joint as the note designs it, on plain rigid bodies, so that its solver
// is proved before the lane puts it between fall.js's two bodies.
//   - The joint: a pin at P on the hinge's axis (her y); five relative freedoms locked (three of translation at P, the
//     relative roll and yaw); solved exactly each sub-step as a constraint impulse from the bodies' inverse masses (any
//     symmetric positive 6 x 6, so an added mass's couplings too), not as a spring; the locked freedoms' drift projected
//     out at the sub-step's end.
//   - The hinge, rigid-plastic: the impulse that would keep theta where it is is applied while it is within the moment
//     M(theta) times the sub-step (or pushes to close: a torn section's faces meet, so it never closes); past that the
//     joint carries M(theta) and theta grows. One bounded unknown, so "solve the six, clamp the hinge's, re-solve the
//     five" is exact.
//   - The release: at the first sub-step where the force the joint would have to carry passes the ligament (its tension
//     along her above Nt, or its shear above Vs), the ligament parts: that sub-step's impulse is not applied, and the
//     bodies are free from it on.
// The rigs (the note's tests 11 to 14 and 16):
//   A. closure: two prisms pinned, tumbling in empty space, the hinge held: linear momentum to rounding, the locked
//      freedoms' drift, theta held; and one solve with random 6 x 6 inverse masses with couplings (an added mass's).
//   B. a prism pinned by its end to a fixed one, horizontal at rest, a net weight down (in water: weight less buoyancy),
//      a constant M: held when M exceeds the demand W' L/2; else it stops where the plastic work equals the work of its
//      weight (from rest to rest with no drag): W' (L/2) sin(theta) = M theta, and stays.
//   C. the same with a falling M(theta) = M0 (1 - theta/theta1): held at M0 above the demand; just below it opens and
//      theta never decreases, and the energy identity closes with the tear's work W = the integral of M over theta.
//   D. the release: a pull along her (and, again, across her) rising linearly in time on a held joint: the release on the
//      first sub-step where N passes Nt (|V| passes Vs), to the sub-step.
//   node docs/research/experiments/e68_z6_joint_rigs.js [--write]
// Output of 2026-11-20: results_2026-11-20/e68_z6_joint_rigs.txt
const fs = require('fs'), path = require('path');
const WRITE = process.argv.slice(2).includes('--write');
const out = [], say = (s) => { s = s === undefined ? '' : s; out.push(s); console.log(s); };
let fails = 0;
const row = (kind, what, value, ref, ok) => { if (!ok && kind === 'MUST') fails++; say((ok ? 'PASS ' : (kind === 'MUST' ? 'FAIL ' : 'out  ')) + kind.padEnd(6) + what.padEnd(96) + ' ' + String(value).padEnd(64) + ' ' + ref); };
const fe = (v) => (v === 0 ? '0' : v.toExponential(2)), f = (v, d) => v.toFixed(d === undefined ? 4 : d);

// ------------------------------------------------------------------ vectors, rotations, a small dense solve
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => Math.sqrt(dot(a, a)), unit = (a) => mul(a, 1 / norm(a));
const Rof = (q) => { const [w, x, y, z] = q; return [[1 - 2 * (y * y + z * z), 2 * (x * y - w * z), 2 * (x * z + w * y)], [2 * (x * y + w * z), 1 - 2 * (x * x + z * z), 2 * (y * z - w * x)], [2 * (x * z - w * y), 2 * (y * z + w * x), 1 - 2 * (x * x + y * y)]]; };
const Rv = (R, v) => [R[0][0] * v[0] + R[0][1] * v[1] + R[0][2] * v[2], R[1][0] * v[0] + R[1][1] * v[1] + R[1][2] * v[2], R[2][0] * v[0] + R[2][1] * v[1] + R[2][2] * v[2]];
const RTv = (R, v) => [R[0][0] * v[0] + R[1][0] * v[1] + R[2][0] * v[2], R[0][1] * v[0] + R[1][1] * v[1] + R[2][1] * v[2], R[0][2] * v[0] + R[1][2] * v[1] + R[2][2] * v[2]];
const mm = (A, B) => A.map((r, i) => [0, 1, 2].map(j => A[i][0] * B[0][j] + A[i][1] * B[1][j] + A[i][2] * B[2][j]));
const tr = (A) => [0, 1, 2].map(i => [0, 1, 2].map(j => A[j][i]));
// q <- exp(phi) q (phi a rotation vector in the world), normalized
function rotq(q, phi) {
  const a = norm(phi); if (a === 0) return q;
  const s = Math.sin(a / 2) / a, d = [Math.cos(a / 2), phi[0] * s, phi[1] * s, phi[2] * s];
  const r = [d[0] * q[0] - d[1] * q[1] - d[2] * q[2] - d[3] * q[3], d[0] * q[1] + d[1] * q[0] + d[2] * q[3] - d[3] * q[2], d[0] * q[2] - d[1] * q[3] + d[2] * q[0] + d[3] * q[1], d[0] * q[3] + d[1] * q[2] - d[2] * q[1] + d[3] * q[0]];
  const n = Math.hypot(r[0], r[1], r[2], r[3]); return r.map(v => v / n);
}
const qy = (a) => [Math.cos(a / 2), 0, Math.sin(a / 2), 0];
// Gaussian elimination with partial pivoting, fixed order (n <= 6)
function solve(K, b) {
  const n = b.length, A = K.map((r, i) => r.slice().concat([b[i]]));
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    if (p !== c) { const t = A[p]; A[p] = A[c]; A[c] = t; }
    for (let r = c + 1; r < n; r++) { const k = A[r][c] / A[c][c]; for (let j = c; j <= n; j++) A[r][j] -= k * A[c][j]; }
  }
  const x = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) { let s = A[r][n]; for (let j = r + 1; j < n; j++) s -= A[r][j] * x[j]; x[r] = s / A[r][r]; }
  return x;
}

// ------------------------------------------------------------------ a body: centre x, attitude q, velocity v, rate w (world)
function body(o) {
  const b = Object.assign({ x: [0, 0, 0], q: [1, 0, 0, 0], v: [0, 0, 0], w: [0, 0, 0], fixed: false }, o);
  b.R = () => Rof(b.q);
  // the inverse of its 6 x 6 generalized mass in the world: [1/m I, 0; 0, R diag(1/I) R^T] (zero when fixed), or W6
  // given directly (world frame) for the algebraic rig
  b.W = () => {
    if (b.fixed) return null;
    if (b.W6) return b.W6;
    const R = b.R(), D = [[1 / b.I[0], 0, 0], [0, 1 / b.I[1], 0], [0, 0, 1 / b.I[2]]], Wa = mm(mm(R, D), tr(R));
    const W = Array.from({ length: 6 }, () => new Array(6).fill(0));
    for (let i = 0; i < 3; i++) { W[i][i] = 1 / b.m; for (let j = 0; j < 3; j++) W[3 + i][3 + j] = Wa[i][j]; }
    return W;
  };
  b.Iw = () => { const R = b.R(), D = [[b.I[0], 0, 0], [0, b.I[1], 0], [0, 0, b.I[2]]]; return mm(mm(R, D), tr(R)); };
  return b;
}
const W6v = (W, a) => W.map(r => r.reduce((s, c, j) => s + c * a[j], 0));

// ------------------------------------------------------------------ the joint
// rows (each 12 long: bow linear, bow angular, stern linear, stern angular): the pin's three, the relative roll and yaw,
// the hinge (theta-dot = sense e2.(w_b - w_s)); e1 her axis (the bodies' mean x), e2 the hinge's (the bow's y), e3 = e1 x e2
function frame(J) {
  const Rb = J.b.R(), Rs = J.s.R(), e2 = unit(Rv(Rb, [0, 1, 0])), e1 = unit(add(Rv(Rb, [1, 0, 0]), Rv(Rs, [1, 0, 0]))), e3 = unit(cross(e1, e2));
  return { Rb, Rs, e1, e2, e3, ab: Rv(Rb, J.pb), as: Rv(Rs, J.ps) };
}
function rows(J, F) {
  const r = [];
  for (const u of [[1, 0, 0], [0, 1, 0], [0, 0, 1]]) r.push([...u, ...cross(F.ab, u), ...mul(u, -1), ...mul(cross(F.as, u), -1)]);
  for (const e of [F.e1, F.e3]) r.push([0, 0, 0, ...e, 0, 0, 0, ...mul(e, -1)]);
  r.push([0, 0, 0, ...mul(F.e2, J.sense), 0, 0, 0, ...mul(F.e2, -J.sense)]);
  return r;
}
const nuOf = (J) => [...J.b.v, ...J.b.w, ...J.s.v, ...J.s.w];
// apply a 12-long impulse to the two bodies through their inverse masses
function kick(J, imp) {
  const Wb = J.b.W(), Ws = J.s.W();
  if (Wb) { const d = W6v(Wb, imp.slice(0, 6)); J.b.v = add(J.b.v, d.slice(0, 3)); J.b.w = add(J.b.w, d.slice(3, 6)); }
  if (Ws) { const d = W6v(Ws, imp.slice(6, 12)); J.s.v = add(J.s.v, d.slice(0, 3)); J.s.w = add(J.s.w, d.slice(3, 6)); }
}
function Kof(J, R) {           // K = J W J^T over the given rows
  const Wb = J.b.W(), Ws = J.s.W();
  const WJ = R.map(r => [...(Wb ? W6v(Wb, r.slice(0, 6)) : [0, 0, 0, 0, 0, 0]), ...(Ws ? W6v(Ws, r.slice(6, 12)) : [0, 0, 0, 0, 0, 0])]);
  return R.map(a => WJ.map(b => a.reduce((s, c, i) => s + c * b[i], 0)));
}
const rowsImpulse = (R, lam) => { const imp = new Array(12).fill(0); R.forEach((r, k) => { for (let i = 0; i < 12; i++) imp[i] += r[i] * lam[k]; }); return imp; };
// the measured hinge angle: the bow's attitude against the stern's, about the stern's y
function thetaOf(J) { const Rr = mm(tr(J.s.R()), J.b.R()); return J.sense * Math.atan2(-Rr[2][0], Rr[0][0]); }
// the elastic-plastic hinge (B1+B2, 2026-11-20 15:5x: "unloading is probably not rigid"): the moment it puts on the bow,
// closing positive, at theta, from its state. Before it yields, the intact section's line M0 + k0 theta (M0: what it
// carried at the hand-over, so that the hand-over starts at rest); it yields where that line reaches M(0); then the
// backbone M(theta - thY) while theta is at its furthest; below the furthest, the ligament's line, slope ku, back to it.
// Pure: commit() moves the state.
function hingeLaw(J, th) {
  if (!J.yielded) { const m = J.M0 + J.k0 * th; if (m < J.M(0)) return { m, yielded: false }; }
  // it yields where the intact line reaches M(0); at once (thY 0) when the hand-over already asks more than M(0)
  const thY = J.yielded ? J.thY : Math.max(0, (J.M(0) - J.M0) / J.k0), thMax = Math.max(J.yielded ? J.thMax : thY, th);
  return th >= thMax ? { m: J.M(th - thY), yielded: true, thY, thMax } : { m: J.M(thMax - thY) - J.ku * (thMax - th), yielded: true, thY, thMax };
}
function commitHinge(J, th) { const r = hingeLaw(J, th); if (r.yielded) { J.yielded = true; J.thY = r.thY; J.thMax = r.thMax; } return r.m; }
// one sub-step's joint solve on velocities nu* (already carrying the external impulses); returns what it did. Rigid
// mode (no ku): six rows, the hinge's clamped at M(theta). Elastic mode: the five locked rows only; the hinge's moment
// was applied before, as a law
function jointSolve(J, h) {
  if (J.released) return { free: true };
  const F = frame(J), R6 = rows(J, F), nu = nuOf(J), th = Math.max(J.theta, 0);
  if (J.ku !== undefined) {
    const R5 = R6.slice(0, 5), l5 = solve(Kof(J, R5), R5.map(r => -r.reduce((s, c, i) => s + c * nu[i], 0)));
    return finish(J, h, F, R5, l5, false);
  }
  let lam = solve(Kof(J, R6), R6.map(r => -r.reduce((s, c, i) => s + c * nu[i], 0)));
  let plastic = false, lh = lam[5];
  const cap = J.M(th) * h;
  if (lh < -cap) {              // the hinge yields: it carries M(theta), and the other five are solved with that in place
    plastic = true; lh = -cap;
    const R5 = R6.slice(0, 5), hImp = rowsImpulse([R6[5]], [lh]);
    const nu2 = nu.map((v, i) => v), Wb = J.b.W(), Ws = J.s.W();
    if (Wb) { const d = W6v(Wb, hImp.slice(0, 6)); for (let i = 0; i < 6; i++) nu2[i] += d[i]; }
    if (Ws) { const d = W6v(Ws, hImp.slice(6, 12)); for (let i = 0; i < 6; i++) nu2[6 + i] += d[i]; }
    const l5 = solve(Kof(J, R5), R5.map(r => -r.reduce((s, c, i) => s + c * nu2[i], 0)));
    lam = [...l5, lh];
  }
  J.lockedNow = !plastic;
  return finish(J, h, F, R6, lam, plastic);
}
// the force across the joint (on the bow, from the pin's three rows), in her frame: N along her (tension positive: it
// pulls the bow aft), V across (her z), L lateral (her y); the release test; then the impulse
function finish(J, h, F, R, lam, plastic) {
  const th = Math.max(J.theta, 0), Fb = mul([lam[0], lam[1], lam[2]], 1 / h), N = -dot(Fb, F.e1), V = dot(Fb, F.e3), L = dot(Fb, F.e2);
  const Nt = J.Nt(th), Vs = J.Vs(th);
  if (N > Nt || Math.abs(V) > Vs) {                            // the ligament parts: this impulse is not applied
    J.released = true; J.release = { k: J.k, t: J.k * h, theta: th, N, V, NtR: N / Nt, VsR: Math.abs(V) / Vs, by: N > Nt ? 'tension' : 'shear' };
    return { free: true, release: true };
  }
  kick(J, rowsImpulse(R, lam));
  J.maxN = Math.max(J.maxN || 0, N / Nt); J.maxV = Math.max(J.maxV || 0, Math.abs(V) / Vs);
  return { plastic, N, V, L, lam, F };
}
// the locked freedoms' error at positions: the pin's gap, and the relative roll and yaw (about e1, e3)
function jointError(J) {
  const F = frame(J), gap = sub(add(J.b.x, F.ab), add(J.s.x, F.as));
  const th = J.sense * thetaOf(J), Rt = mm(J.s.R(), Rof(qy(th))), E = mm(J.b.R(), tr(Rt));
  const phi = [(E[2][1] - E[1][2]) / 2, (E[0][2] - E[2][0]) / 2, (E[1][0] - E[0][1]) / 2];
  return { F, c: [...gap, dot(phi, F.e1), dot(phi, F.e3)] };
}
// project the drift out (mass-weighted, one Newton step; twice): the five locked freedoms, and in rigid mode the hinge's
// own angle too while it holds (to the angle it holds at), which the velocity rows alone let creep at second order
function project(J) {
  if (J.released) return;
  const withHinge = J.ku === undefined && J.lockedNow;
  for (let it = 0; it < 2; it++) {
    const { F, c } = jointError(J), R6 = rows(J, F), Rp = withHinge ? R6 : R6.slice(0, 5);
    if (withHinge) c.push(thetaOf(J) - J.thHold);
    const l = solve(Kof(J, Rp), c.map(v => -v)), imp = rowsImpulse(Rp, l);
    const Wb = J.b.W(), Ws = J.s.W();
    if (Wb) { const d = W6v(Wb, imp.slice(0, 6)); J.b.x = add(J.b.x, d.slice(0, 3)); J.b.q = rotq(J.b.q, d.slice(3, 6)); }
    if (Ws) { const d = W6v(Ws, imp.slice(6, 12)); J.s.x = add(J.s.x, d.slice(0, 3)); J.s.q = rotq(J.s.q, d.slice(3, 6)); }
  }
}
// one sub-step: external forces (and the gyroscopic term) -> the joint -> positions -> the drift out -> theta measured
function substep(J, h, ext) {
  for (const B of [J.b, J.s]) {
    if (B.fixed) continue;
    const e = ext ? ext(B, J.k * h) : { F: [0, 0, 0], T: [0, 0, 0] };
    B.v = add(B.v, mul(e.F, h / B.m));
    const Iw = B.Iw(), L = Rv(Iw, B.w), tq = sub(e.T, cross(B.w, L)), Wa = B.W();
    const dw = [0, 1, 2].map(i => Wa[3 + i][3] * tq[0] + Wa[3 + i][4] * tq[1] + Wa[3 + i][5] * tq[2]);
    B.w = add(B.w, mul(dw, h));
  }
  // elastic mode: the hinge's moment, from its law at the sub-step's start, as an equal and opposite pair about e2
  let mh = null;
  if (J.ku !== undefined && !J.released) {
    mh = commitHinge(J, J.theta);
    const e2 = frame(J).e2, tb = mul(e2, -J.sense * mh * h), Wb = J.b.W(), Ws = J.s.W();
    if (Wb) J.b.w = add(J.b.w, W6v(Wb, [0, 0, 0, ...tb]).slice(3, 6));
    if (Ws) J.s.w = add(J.s.w, W6v(Ws, [0, 0, 0, ...mul(tb, -1)]).slice(3, 6));
  }
  const th0 = J.theta, res = jointSolve(J, h);
  for (const B of [J.b, J.s]) { if (B.fixed) continue; B.x = add(B.x, mul(B.v, h)); B.q = rotq(B.q, mul(B.w, h)); }
  project(J);
  if (!J.released) {
    J.theta = thetaOf(J);
    if (J.ku === undefined && !J.lockedNow) J.thHold = Math.max(J.thHold, J.theta);   // rigid mode: it held where it stopped
    if (mh !== null) J.hingeWork += 0.5 * (mh + hingeLaw(J, J.theta).m) * (J.theta - th0);   // the hinge's work, signed
  }
  J.k++;
  return res;
}
function joint(b, s, o) { return Object.assign({ b, s, sense: 1, theta: 0, thHold: 0, k: 0, released: false, lockedNow: true, yielded: false, hingeWork: 0, M: () => 1e30, Nt: () => 1e30, Vs: () => 1e30 }, o); }
// a prism of length L, breadth B, depth D and mass m, its centre at its middle
const prism = (m, L, Bd, D, o) => body(Object.assign({ m, I: [m * (Bd * Bd + D * D) / 12, m * (L * L + D * D) / 12, m * (L * L + Bd * Bd) / 12] }, o));

say('e68: Z6\'s joint on rigid bodies, against closed forms (the design v1.1, sections 1 and 5)');
say('');

// ================================================================== A. closure
{
  const h = 1 / 64, n = 4000;
  const bow = prism(2.0e7, 120, 28, 20, { x: [60, 0, 0], w: [0.02, -0.05, 0.03], v: [0.3, 0, -0.1] });
  const stern = prism(3.0e7, 150, 28, 20, { x: [-75, 0, 0], w: [-0.01, 0.04, -0.02], v: [-0.2, 0.1, 0] });
  const J = joint(bow, stern, { pb: [-60, 0, 0], ps: [75, 0, 0] });
  // start on the constraint: give the pair one rigid motion (the stern's) and solve once
  const P0 = add(mul(bow.v, bow.m), mul(stern.v, stern.m));
  let worstGap = 0, worstRot = 0, worstTh = 0, worstP = 0;
  const Lof = () => add(add(cross(bow.x, mul(bow.v, bow.m)), Rv(bow.Iw(), bow.w)), add(cross(stern.x, mul(stern.v, stern.m)), Rv(stern.Iw(), stern.w)));
  substep(J, h); const L0 = Lof(), P1 = add(mul(bow.v, bow.m), mul(stern.v, stern.m));
  for (let k = 1; k < n; k++) {
    substep(J, h);
    const e = jointError(J).c, P = add(mul(bow.v, bow.m), mul(stern.v, stern.m));
    worstGap = Math.max(worstGap, norm(e.slice(0, 3))); worstRot = Math.max(worstRot, Math.abs(e[3]), Math.abs(e[4])); worstTh = Math.max(worstTh, Math.abs(J.theta));
    worstP = Math.max(worstP, norm(sub(P, P0)) / norm(P0));
  }
  const dL = norm(sub(Lof(), L0)) / norm(L0);
  say('A. two prisms pinned (2.0e7 and 3.0e7 kg; 120 and 150 m), tumbling in empty space, the hinge held; ' + n + ' sub-steps of 1/64 s');
  row('MUST', 'A1 linear momentum: the joint\'s impulses equal and opposite', 'drift ' + fe(worstP) + ' of |P| (first step ' + fe(norm(sub(P1, P0)) / norm(P0)) + ')', 'to rounding (1e-12)', worstP < 1e-12);
  row('MUST', 'A2 the locked freedoms after the projection: the pin\'s gap, the relative roll and yaw', fe(worstGap) + ' m; ' + fe(worstRot) + ' rad', 'under 1e-9', worstGap < 1e-9 && worstRot < 1e-9);
  row('MUST', 'A3 theta held (no moment asked of the hinge passes its M)', fe(worstTh) + ' rad', 'under 1e-9', worstTh < 1e-9);
  row('CHECK', 'A4 angular momentum about the origin (the scheme is first order: the drift is the integrator\'s, not the joint\'s)', fe(dL) + ' of |L| over ' + (n * h).toFixed(1) + ' s', 'small; halves with the sub-step', dL < 1e-2);
  // A5: one solve with any symmetric positive 6 x 6 inverse masses (an added mass couples them): the six rows met
  let seed = 12345; const rnd = () => { seed = (Math.imul(seed, 1103515245) + 12345) >>> 0; return seed / 4294967296 - 0.5; };
  const spd = (scale) => { const A = Array.from({ length: 6 }, () => Array.from({ length: 6 }, () => rnd())); const M = A.map((r, i) => A.map((c) => r.reduce((s, v, k) => s + v * c[k], 0) + (0))); for (let i = 0; i < 6; i++) M[i][i] += 3; return M.map(r => r.map(v => v * scale)); };
  let worstRes = 0;
  for (let t = 0; t < 20; t++) {
    const b2 = body({ W6: spd(1e-7), x: [rnd() * 50, rnd() * 10, rnd() * 10], q: unitq([1 + rnd(), rnd(), rnd(), rnd()]), v: [rnd(), rnd(), rnd()], w: [rnd(), rnd(), rnd()] });
    const s2 = body({ W6: spd(2e-7), x: [rnd() * 50 - 60, rnd() * 10, rnd() * 10], q: unitq([1 + rnd(), rnd(), rnd(), rnd()]), v: [rnd(), rnd(), rnd()], w: [rnd(), rnd(), rnd()] });
    const J2 = joint(b2, s2, { pb: [rnd() * 40, rnd() * 5, rnd() * 5], ps: [rnd() * 40, rnd() * 5, rnd() * 5] });
    jointSolve(J2, h);
    const F = frame(J2), nu = nuOf(J2), scaleV = Math.max(...nu.map(Math.abs));
    for (const r of rows(J2, F)) worstRes = Math.max(worstRes, Math.abs(r.reduce((s, c, i) => s + c * nu[i], 0)) / scaleV);
  }
  row('MUST', 'A5 twenty solves with random symmetric positive 6 x 6 inverse masses (couplings as an added mass has): the six rows met', 'the worst row ' + fe(worstRes) + ' of the velocities', 'to rounding (1e-12)', worstRes < 1e-12);
  say('');
}
function unitq(q) { const n = Math.hypot(q[0], q[1], q[2], q[3]); return q.map(v => v / n); }

// ================================================================== B and C. a prism hung by a hinge from a fixed one
// the bow: 40 m by 10 by 10, 2.0e6 kg, its net weight (in water: weight less buoyancy) W' = 0.2 m g down at its middle
// (constant: it is wholly under); pinned at its after end to a fixed stern, horizontal, at rest
const G = 9.81, MB = 2.0e6, LB = 40, Wn = 0.2 * MB * G, D0 = Wn * LB / 2;
function hang(Mfun, h, T, opts) {
  const bow = prism(MB, LB, 10, 10, { x: [LB / 2, 0, 0] }), stern = prism(1, 1, 1, 1, { fixed: true, x: [0, 0, 0] });
  const J = joint(bow, stern, Object.assign({ pb: [-LB / 2, 0, 0], ps: [0, 0, 0], M: Mfun }, opts || {}));
  const elastic = J.ku !== undefined;
  const ext = (B) => ({ F: [0, 0, -Wn], T: [0, 0, 0] });
  // thMin: the least theta in the run's second half (the held rigs); thBack: the least once it has first turned back
  let thMax = 0, back = 0, Wsteel = 0, worstE = 0, stopK = -1, lastTh = 0, plasticSteps = 0, thMin = Infinity, thMaxMonotone = true, lastMax = -Infinity, turned = false, thBack = Infinity;
  const n = Math.round(T / h);
  for (let k = 0; k < n; k++) {
    const th0 = J.theta, r = substep(J, h, ext), th1 = J.theta;
    if (r.plastic) plasticSteps++;
    // the tear's work over the sub-step: M at the mean angle times the angle turned (the trapezoid is the integral's own);
    // in elastic mode the hinge's own signed work, its elastic returns with it
    Wsteel += 0.5 * (Mfun(th0) + Mfun(th1)) * Math.max(0, th1 - th0);
    const steel = elastic ? J.hingeWork : Wsteel;
    if (th1 < th0 - 1e-12) back = Math.max(back, th0 - th1);
    const ke = 0.5 * MB * dot(bow.v, bow.v) + 0.5 * dot(bow.w, Rv(bow.Iw(), bow.w)), pe = Wn * (LB / 2) * Math.sin(th1);
    // rigid mode: the identity until the first stop (a stop against closing takes the kinetic energy that is left);
    // elastic mode: throughout (nothing is taken but by the steel's own law)
    if (stopK < 0 || elastic) worstE = Math.max(worstE, Math.abs(pe - steel - ke) / D0);
    if (stopK < 0 && k > 2 && th1 > 1e-9 && Math.abs(th1 - lastTh) < 1e-14) stopK = k;
    if (elastic) { if (J.yielded && J.thMax < lastMax) thMaxMonotone = false; if (J.yielded) lastMax = J.thMax; }
    thMax = Math.max(thMax, th1); lastTh = th1;
    if (k * h > T / 2) thMin = Math.min(thMin, th1);
    if (th1 < th0 - 1e-12 && th0 > 1e-6) turned = true;
    if (turned) thBack = Math.min(thBack, th1);
  }
  return { theta: J.theta, thMax, back, worstE, stopK, plasticSteps, J, thMin, thMaxMonotone, thBack };
}
// the energy balance's root: W' (L/2) sin(th) = Mc th, by bisection (fixed iterations)
function stopAngle(kappa) { let lo = 1e-6, hi = Math.PI; for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (Math.sin(m) - kappa * m > 0) lo = m; else hi = m; } return (lo + hi) / 2; }
{
  say('B. a prism (40 m, 2.0e6 kg, net weight 0.2 m g) hung by a hinge from a fixed one, horizontal at rest; the demand at theta 0 is W\' L/2 = ' + (D0 / 1e6).toFixed(3) + ' MN m');
  const held = hang(() => 1.1 * D0, 1 / 256, 10);
  row('MUST', 'B1 M = 1.1 x the demand: the hinge holds', 'theta ' + fe(held.theta) + ' rad after 10 s; yielded on ' + held.plasticSteps + ' sub-steps', '0 (under 1e-9)', Math.abs(held.theta) < 1e-9 && held.plasticSteps === 0);
  for (const kappa of [0.6, 0.9]) {
    const want = stopAngle(kappa), res = [];
    for (const h of [1 / 64, 1 / 256, 1 / 1024]) res.push([h, hang(() => kappa * D0, h, 20)]);
    const e = res.map(([h, r]) => Math.abs(r.theta - want));
    row('MUST', 'B2 M = ' + kappa + ' x the demand: it turns and stops where W\' (L/2) sin(theta) = M theta (rest to rest, no drag), and stays', res.map(([h, r]) => 'h 1/' + Math.round(1 / h) + ': ' + f(r.theta, 5)).join(', ') + ' rad', f(want, 5) + ' rad; the error falls with h (1/1024 within 1e-3)', e[2] < 1e-3 && e[2] < e[0]);
    row('MUST', 'B3   it never turns back (theta never decreases), though past the vertical its weight asks it to close', 'the most it went back: ' + fe(Math.max(...res.map(([, r]) => r.back))) + ' rad', '0', res.every(([, r]) => r.back === 0));
    row('CHECK', 'B4   the energy identity until it stops: the work of its weight = the tear\'s work + its kinetic energy', res.map(([h, r]) => 'h 1/' + Math.round(1 / h) + ': ' + fe(r.worstE)).join(', ') + ' of W\' L/2', 'falls with h (the scheme\'s, first order)', res[2][1].worstE < res[0][1].worstE);
  }
  say('');
  say('C. the same prism with a falling M(theta) = M0 (1 - theta / 0.3), floor 0');
  const falling = (M0) => (th) => Math.max(0, M0 * (1 - th / 0.3));
  const cHeld = hang(falling(1.02 * D0), 1 / 256, 10);
  row('MUST', 'C1 M0 = 1.02 x the demand: it holds', 'theta ' + fe(cHeld.theta) + ' rad; yielded on ' + cHeld.plasticSteps + ' sub-steps', '0', Math.abs(cHeld.theta) < 1e-9 && cHeld.plasticSteps === 0);
  const cRes = [1 / 64, 1 / 256, 1 / 1024].map(h => [h, hang(falling(0.98 * D0), h, 20)]);
  const c0 = cRes[1][1];
  row('MUST', 'C2 M0 = 0.98 x the demand: it opens past the peak, swings past the vertical, and never closes: it stops at its furthest angle', 'theta ' + f(c0.theta, 4) + ' rad at 20 s (furthest ' + f(c0.thMax, 4) + '); the most it went back ' + fe(c0.back), 'theta = its furthest; never back', c0.back === 0 && Math.abs(c0.theta - c0.thMax) < 1e-12 && c0.theta > Math.PI / 2);
  row('CHECK', 'C3   the energy identity with the tear\'s work W = the integral of M over theta, until it first stops', cRes.map(([h, r]) => 'h 1/' + Math.round(1 / h) + ': ' + fe(r.worstE)).join(', ') + ' of W\' L/2', 'falls with h', cRes[2][1].worstE < cRes[0][1].worstE);
  say('');

  // ================================================================ E. the elastic-plastic hinge (B1+B2: unloading is not rigid)
  // the same prism; the hinge carries what it carried at the hand-over (M0 = the demand W' L/2: so it starts at rest), the
  // intact section's slope k0 before it yields, the ligament's ku below its furthest angle. The stiffnesses here are the
  // rig's: ku = M / 1 degree (B1+B2's order: the ligament springs back about a degree from the tear's top), k0 = 50 ku
  say('E. the elastic-plastic hinge: the same prism, the hinge holding the demand at the hand-over (M0 = W\' L/2); below its');
  say('   furthest angle the ligament\'s line, ku = W\' L/2 a degree (B1+B2\'s order: about a degree of spring-back from the tear\'s');
  say('   top); before it yields, the intact section\'s, k0 = 50 ku');
  const ku = D0 / (Math.PI / 180), k0 = 50 * ku;
  const eHeld = hang(() => 1.1 * D0, 1 / 256, 10, { ku, k0, M0: D0 });
  row('MUST', 'E1 backbone 1.1 x the demand: it holds, at rest from the hand-over (no transient)', 'theta ' + fe(eHeld.theta) + ' rad, the most ' + fe(Math.max(Math.abs(eHeld.thMax), Math.abs(eHeld.thMin))) + ' rad after 10 s; yielded ' + eHeld.J.yielded, 'under 1e-6 rad; not yielded', Math.abs(eHeld.theta) < 1e-6 && !eHeld.J.yielded);
  const wantE = stopAngle(0.6), eRes = [1 / 256, 1 / 1024].map(h => [h, hang(() => 0.6 * D0, h, 30, { ku, k0, M0: D0 })]), e1 = eRes[1][1];
  // after it stops it springs back on the ligament's line: between its furthest and the furthest less twice (M - demand) / ku
  const dem = D0 * Math.cos(wantE), spring = 2 * (0.6 * D0 - dem) / ku;
  row('MUST', 'E2 backbone 0.6 x the demand: its furthest angle is the energy balance\'s, as the rigid hinge\'s (no elastic energy is stored on the backbone)', eRes.map(([h, r]) => 'h 1/' + Math.round(1 / h) + ': ' + f(r.J.thMax, 5)).join(', ') + ' rad', f(wantE, 5) + ' rad, within 1e-3', Math.abs(e1.J.thMax - wantE) < 1e-3);
  row('MUST', 'E3   then it springs back on the ligament\'s line and swings there: theta between its furthest and that less 2 (M - demand) / ku; the furthest never decreases', 'swings ' + f(e1.thBack, 5) + ' to ' + f(e1.J.thMax, 5) + ' rad (' + f((e1.J.thMax - e1.thBack) * 180 / Math.PI, 3) + ' deg); the furthest ' + (e1.thMaxMonotone ? 'never decreased' : 'DECREASED'), f(wantE - spring, 5) + ' to ' + f(wantE, 5) + ' rad (' + f(spring * 180 / Math.PI, 3) + ' deg), within 5 %', e1.thMaxMonotone && Math.abs((e1.J.thMax - e1.thBack) - spring) < 0.05 * spring);
  row('CHECK', 'E4   the energy identity throughout, with the hinge\'s own work (its plastic work and its elastic returns)', eRes.map(([h, r]) => 'h 1/' + Math.round(1 / h) + ': ' + fe(r.worstE)).join(', ') + ' of W\' L/2', 'falls with h', eRes[1][1].worstE < eRes[0][1].worstE);
  const fRes = hang(falling(0.98 * D0), 1 / 1024, 40, { ku, k0, M0: D0 });
  const demF = D0 * Math.abs(Math.cos(fRes.J.thMax)), springF = 2 * demF / ku;
  row('MUST', 'E5 a falling backbone (C\'s): it opens, swings, and at its furthest springs back by the ligament\'s line only: the torn part never mends', 'furthest ' + f(fRes.J.thMax, 4) + ' rad (' + (fRes.thMaxMonotone ? 'never decreased' : 'DECREASED') + '); swings back to ' + f(fRes.thBack, 4) + ' (' + f((fRes.J.thMax - fRes.thBack) * 180 / Math.PI, 3) + ' deg)', 'back by at most 2 demand / ku = ' + f(springF * 180 / Math.PI, 3) + ' deg (+5 %)', fRes.thMaxMonotone && isFinite(fRes.thBack) && fRes.J.thMax - fRes.thBack <= 1.05 * springF + 1e-9);
  say('');
}

// ================================================================== D. the release
{
  say('D. the release: a held joint (the bow pinned to a fixed stern, M huge), no weight; a pull at the bow\'s middle rising in time');
  const h = 1 / 64;
  const run = (dir, rate, Nt, Vs) => {
    const bow = prism(2.0e7, 120, 28, 20, { x: [60, 0, 0] }), stern = prism(1, 1, 1, 1, { fixed: true });
    const J = joint(bow, stern, { pb: [-60, 0, 0], ps: [0, 0, 0], Nt: () => Nt, Vs: () => Vs });
    const ext = (B, t) => ({ F: mul(dir, rate * t), T: [0, 0, 0] });
    let vAt = null;
    for (let k = 0; k < 4000 && !J.released; k++) substep(J, h, ext);
    if (J.released) { vAt = bow.v.slice(); }
    return { J, v: vAt };
  };
  const t1 = run([1, 0, 0], 1e7, 227e6, 1e30), want1 = Math.floor(227e6 / (1e7 * h)) + 1;
  row('MUST', 'D1 a pull along her rising 10 MN a second against Nt 227 MN (the as-built ligament\'s, B1+B2): the release on the first sub-step where N passes Nt', t1.J.release ? 'sub-step ' + t1.J.release.k + ' (t ' + f(t1.J.release.t, 4) + ' s), by ' + t1.J.release.by + ', N/Nt ' + f(t1.J.release.NtR, 6) : 'NO RELEASE', 'sub-step ' + want1 + ': the first with ' + (1e7 * want1 * h / 1e6).toFixed(3) + ' MN > 227', !!t1.J.release && t1.J.release.k === want1 && t1.J.release.by === 'tension');
  const t2 = run([0, 0, 1], 1e6, 1e30, 20.34e6), want2 = Math.floor(20.34e6 / (1e6 * h)) + 1;
  row('MUST', 'D2 a pull across her (up) rising 1 MN a second against Vs 20.34 MN (the as-built double bottom\'s): the release on the first sub-step where |V| passes Vs', t2.J.release ? 'sub-step ' + t2.J.release.k + ' (t ' + f(t2.J.release.t, 4) + ' s), by ' + t2.J.release.by + ', |V|/Vs ' + f(t2.J.release.VsR, 6) : 'NO RELEASE', 'sub-step ' + want2 + ': the first with ' + (1e6 * want2 * h / 1e6).toFixed(4) + ' MN > 20.34', !!t2.J.release && t2.J.release.k === want2 && t2.J.release.by === 'shear');
  row('MUST', 'D3 the margin printed on the way: the largest N/Nt and |V|/Vs while held', 'N/Nt ' + f(t1.J.maxN, 6) + ' (tension run); |V|/Vs ' + f(t2.J.maxV, 6) + ' (shear run)', 'just under 1 at the sub-step before the release', t1.J.maxN < 1 && t1.J.maxN > 0.999 && t2.J.maxV < 1 && t2.J.maxV > 0.999);
  say('');
}

say(fails ? 'FAIL: ' + fails + ' MUST row(s)' : 'PASS: every MUST row');
if (WRITE) {
  const p = path.join(__dirname, 'results_2026-11-20', 'e68_z6_joint_rigs.txt');
  fs.writeFileSync(p, out.join('\n') + '\n');
  console.log('wrote ' + path.relative(path.join(__dirname, '../../..'), p));
}
process.exit(fails ? 1 : 0);
