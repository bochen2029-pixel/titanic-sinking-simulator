'use strict';
// e83's library (first numbered e70; Z6, milestone 2: the water's centroid at any attitude). Derived and tested by a Fable subagent at Bo's
// word (2026-11-20 18:31 CST, relayed by the coordinator: "for hard math, physics or logic hurdles any session may fan
// out deep-thinking Fable subagents"), briefed and verified by Z1 (its test rerun: PASS, 705 cases); the derivation is
// results_2026-11-20/e83_z6_box_moments_derivation.md. It supersedes e69's cdf3 for V and A: exact for every ratio of
// widths (e69's drops a width under 1e-5 of the next, off by up to 3e-8 of a box near a corner level).
// boxMoments(w, g, s, out): the part of a box below a plane, exactly.
//
//   box   |t_k| <= w_k (k = 1..3), centred at the origin, in its own axes
//   plane g.t = s, |g| = 1 (g in the box's axes; any signs; zeros allowed)
//   R = { t in box : g.t <= s }
//   out.V = vol(R); out.A = dV/ds; out.M[k] = integral over R of t_k dV
//
// Method (README.md has the derivation). With b_k = w_k |g_k| and, for a
// chosen axis k, R_k = the sum of the OTHER two terms g_i t_i + g_j t_j
// (a trapezoid density f_R with knots at +-c1, +-c2, c1 = |b_i - b_j|,
// c2 = b_i + b_j, plateau h = 1 / (2 max(b_i, b_j)); CDF F_R):
//
//   V   = Vbox / (2 b_k) * integral_{-b_k}^{b_k} F_R(s + z) dz
//   A   = Vbox / (2 b_k) * integral_{-b_k}^{b_k} f_R(s + z) dz
//   M_k = -Vbox * w_k^2 * g_k / 4 * I_k,
//   I_k = (1 / b_k) * integral_{-b_k}^{b_k} (1 - (z / b_k)^2) f_R(s + z) dz
//
// Each integral is a sum over the trapezoid's pieces of a polynomial of
// degree <= 3, done by Simpson's rule (exact for cubics). Every term is
// >= 0: nothing cancels, and nothing is divided by a small b.

let c1 = 0, c2 = 0, h = 0, bmin = 0;      // the trapezoid of the two other axes
let rV = 0, rA = 0, rI = 0;               // results of pieces()

function fR(r) {
  const a = r < 0 ? -r : r;
  if (a <= c1) return h;
  if (a >= c2) return 0;
  let p = (c2 - a) / (2 * bmin);
  if (p > 1) p = 1;
  return h * p;
}

function FR(r) {
  if (r <= -c2) return 0;
  if (r >= c2) return 1;
  if (r < -c1) {
    let p = (r + c2) / (2 * bmin);
    if (p > 1) p = 1;
    return h * bmin * p * p;
  }
  if (r <= c1) return h * (bmin + (r + c1));
  let p = (c2 - r) / (2 * bmin);
  if (p > 1) p = 1;
  return 1 - h * bmin * p * p;
}

// bk > 0: the axis integrated over; bi, bj >= 0: the two others.
// Sets rI = I_k and, when full, rV = V / Vbox and rA = A / Vbox.
function pieces(bk, bi, bj, s, full) {
  const bmax = bi > bj ? bi : bj;
  if (bmax <= 1e-150 * bk) {
    // the other two terms are (as good as) nothing: f_R is a delta at 0
    const y = s / bk;
    if (y >= 1) { rI = 0; rA = 0; rV = 1; return; }
    if (y <= -1) { rI = 0; rA = 0; rV = 0; return; }
    rI = (1 - y * y) / bk;
    rA = 0.5 / bk;
    rV = 0.5 * (y + 1);
    return;
  }
  bmin = bi > bj ? bj : bi;
  c1 = bmax - bmin;
  c2 = bmax + bmin;
  h = 0.5 / bmax;
  let sI = 0, sA = 0, sV = 0;
  for (let j = 0; j < 3; j++) {
    const p = j === 0 ? -c2 : (j === 1 ? -c1 : c1);
    const q = j === 0 ? -c1 : (j === 1 ? c1 : c2);
    if (!(q > p)) continue;
    const zp = p - s, zq = q - s;          // the piece in z = r - s
    if (zq <= -bk || zp >= bk) continue;   // outside the window
    const lo = zp < -bk, hi = zq > bk;     // clipped by the window's ends
    // the width, each case by its accurate route
    const dz = lo ? (hi ? 2 * bk : zq + bk) : (hi ? bk - zp : q - p);
    if (!(dz > 0)) continue;
    const ra = lo ? s - bk : p, rb = hi ? s + bk : q;
    const ya = lo ? 1 : -zp / bk, yb = hi ? -1 : -zq / bk;   // y = -z / bk
    const fa = lo ? fR(ra) : (j === 0 ? 0 : h);
    const fb = hi ? fR(rb) : (j === 2 ? 0 : h);
    const fm = 0.5 * (fa + fb);            // f_R is linear on a piece
    const ym = 0.5 * (ya + yb);
    let ka = 1 - ya * ya, kb = 1 - yb * yb, km = 1 - ym * ym;
    if (ka < 0) ka = 0;
    if (kb < 0) kb = 0;
    if (km < 0) km = 0;
    sI += dz * (ka * fa + 4 * km * fm + kb * fb);
    if (full) {
      sA += dz * fm;
      sV += dz * (FR(ra) + 4 * FR(0.5 * (ra + rb)) + FR(rb));
    }
  }
  rI = sI / (6 * bk);
  if (full) {
    // beyond the trapezoid's top knot F_R = 1
    const zp = c2 - s;
    let tail = 0;
    if (zp < bk) tail = zp < -bk ? 2 * bk : bk - zp;
    let v = (sV / 6 + tail) / (2 * bk);
    if (v > 1) v = 1;
    rV = v;
    rA = sA / (2 * bk);
  }
}

function boxMoments(w, g, s, out) {
  const w1 = w[0], w2 = w[1], w3 = w[2];
  const g1 = g[0], g2 = g[1], g3 = g[2];
  const b1 = w1 * (g1 < 0 ? -g1 : g1);
  const b2 = w2 * (g2 < 0 ? -g2 : g2);
  const b3 = w3 * (g3 < 0 ? -g3 : g3);
  const B = b1 + b2 + b3;
  const Vbox = 8 * w1 * w2 * w3;
  const M = out.M;
  M[0] = 0; M[1] = 0; M[2] = 0;
  out.A = 0;
  if (s >= B) { out.V = Vbox; return out; }
  if (s <= -B) { out.V = 0; return out; }
  const q = -0.25 * Vbox;
  if (b1 >= b2 && b1 >= b3) {
    pieces(b1, b2, b3, s, true);
    out.V = Vbox * rV; out.A = Vbox * rA; M[0] = q * w1 * w1 * g1 * rI;
    if (b2 > 0) { pieces(b2, b1, b3, s, false); M[1] = q * w2 * w2 * g2 * rI; }
    if (b3 > 0) { pieces(b3, b1, b2, s, false); M[2] = q * w3 * w3 * g3 * rI; }
  } else if (b2 >= b3) {
    pieces(b2, b1, b3, s, true);
    out.V = Vbox * rV; out.A = Vbox * rA; M[1] = q * w2 * w2 * g2 * rI;
    if (b1 > 0) { pieces(b1, b2, b3, s, false); M[0] = q * w1 * w1 * g1 * rI; }
    if (b3 > 0) { pieces(b3, b1, b2, s, false); M[2] = q * w3 * w3 * g3 * rI; }
  } else {
    pieces(b3, b1, b2, s, true);
    out.V = Vbox * rV; out.A = Vbox * rA; M[2] = q * w3 * w3 * g3 * rI;
    if (b1 > 0) { pieces(b1, b2, b3, s, false); M[0] = q * w1 * w1 * g1 * rI; }
    if (b2 > 0) { pieces(b2, b1, b3, s, false); M[1] = q * w2 * w2 * g2 * rI; }
  }
  return out;
}

module.exports = { boxMoments };
