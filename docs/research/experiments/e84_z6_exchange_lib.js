// e84's library (Z6 milestone 2's groundwork: the exchange at a torn end; v1's doubt 1). Written, with the research
// note docs/research/RESEARCH_torn_end_exchange_law_v1_2026-11-20.md and the tests e84_z6_exchange.js, by a Fable
// subagent at Bo's word (2026-11-20 18:31 CST, relayed by the coordinator), briefed, read and rerun by Z1 (CHECKS:
// PASS). A sketch for M2's exchange, not yet the engine's: water and air through ONE opening between two spaces, per
// sub-step. Plain functions, no state, fixed-order sums, no randomness: deterministic.
//
// Conventions (world frame): z up, metres, sea surface at z = 0. Pressures absolute, Pa.
// A "side" is { zw, pa }: the free surface's world height and the air pressure above it.
//   the sea:           { zw: 0, pa: P_ATM }
//   a compartment:     { zw: its level at the opening, pa: its air pocket's pressure }
// An opening is { A, L, zc, nz, Cd, Dh?, C?, m?, Ku?, kuCap? }:
//   A   clear area, m2            L   its extent along the dip direction in its own plane, m
//   zc  world height of centroid  nz  z-component of the unit normal that points from side a
//                                     (inside) to side b (outside): 0 = vertical opening,
//                                     +1 = faces up (b above a), -1 = faces down
//   Cd  discharge coefficient (obstruction included)
//   Dh  hydraulic diameter of ONE unobstructed cell of the opening (default: of the whole)
// Flows returned are volumes per second, each at its upstream side's pressure:
//   wIn (water b->a), wOut (water a->b), aIn (air b->a), aOut (air a->b).
'use strict';

const G = 9.80665, RHO_W = 1025, P_ATM = 101325;
const RHO_A0 = 1.27;      // air at 1 atm, about 5 C, kg/m3 (isothermal: rho = RHO_A0 * p / P_ATM)
const SIGMA = 0.074;      // sea water / air, N/m
const CHOKE = 0.47;       // air: (p_up - p_down) / p_up beyond which the flow is choked

const DEFAULTS = {
  Cd: 0.60,               // sourced: sharp-edged orifice; band 0.45-0.75 for a clear opening
  C: 0.70,                // Wallis intercept, sharp-edged ends; band 0.55-1.0 (see exchange_law.md)
  m: 1.0,                 // Wallis slope; band 0.8-1.0
  Ku: 3.2,                // Pushkina & Sorokin's zero-penetration Kutateladze number (C_K = 1.79)
  kuCap: true             // [bet] cap the gas intercept by Kutateladze at large Dh
};

function rhoAir(p) { return RHO_A0 * p / P_ATM; }
function sideP(side, z) { return side.pa + RHO_W * G * Math.max(side.zw - z, 0); }

// mean of sqrt(x) for x linear between a and b (a, b >= 0): exact
function meanSqrt(a, b) {
  const d = b - a;
  if (Math.abs(d) <= 1e-9 * Math.max(a, b, 1e-300)) return Math.sqrt(0.5 * (a + b));
  return (2 / 3) * (b * Math.sqrt(b) - a * Math.sqrt(a)) / d;
}

// ---------------------------------------------------------------------------------------
// Law P: the pressure law. Each strip of the opening carries the fluid that stands on its
// upstream side, at Bernoulli's speed for the local pressure difference. Exact integral of
// a piecewise-linear pressure difference. Covers (a) orifice, (b) one-way, (c) two-layer
// exchange with the neutral plane inside the opening, (f) compression-driven inflow.
// ---------------------------------------------------------------------------------------
function lawP(op, a, b) {
  const Cd = op.Cd != null ? op.Cd : DEFAULTS.Cd;
  const nz = Math.max(-1, Math.min(1, op.nz || 0));
  const h = op.L * Math.sqrt(Math.max(0, 1 - nz * nz));     // vertical extent
  const zlo = op.zc - 0.5 * h;
  const out = { wIn: 0, wOut: 0, aIn: 0, aOut: 0, dpLo: 0, dpHi: 0, h: h };
  const dpAt = (s) => { const z = zlo + s * h; return sideP(b, z) - sideP(a, z); };
  out.dpLo = dpAt(0); out.dpHi = dpAt(1);

  // break points in s: the two free surfaces (kinks of the pressure difference)
  const cuts = [0, 1];
  if (h > 1e-9) {
    const sa = (a.zw - zlo) / h, sb = (b.zw - zlo) / h;
    if (sa > 0 && sa < 1) cuts.push(sa);
    if (sb > 0 && sb < 1) cuts.push(sb);
    cuts.sort((x, y) => x - y);
  }
  const piece = (s0, s1, d0, d1) => {
    if (s1 - s0 <= 0) return;
    const sgn = (d0 + d1) >= 0 ? 1 : -1;                    // + : b -> a
    const up = sgn > 0 ? b : a;
    const zm = zlo + 0.5 * (s0 + s1) * h;
    const water = zm < up.zw;
    let x0 = Math.abs(d0), x1 = Math.abs(d1), rho = RHO_W;
    if (!water) {
      rho = rhoAir(up.pa);
      const cap = CHOKE * up.pa;                            // choked air: no faster
      x0 = Math.min(x0, cap); x1 = Math.min(x1, cap);
    }
    const q = Cd * op.A * (s1 - s0) * Math.sqrt(2 / rho) * meanSqrt(x0, x1);
    if (sgn > 0) { if (water) out.wIn += q; else out.aIn += q; }
    else { if (water) out.wOut += q; else out.aOut += q; }
  };
  for (let i = 0; i + 1 < cuts.length; i++) {
    const s0 = cuts[i], s1 = cuts[i + 1];
    const d0 = dpAt(s0), d1 = dpAt(s1);
    if (d0 * d1 < 0) {                                      // the neutral plane is in this piece
      const sr = s0 + (s1 - s0) * d0 / (d0 - d1);
      piece(s0, sr, d0, 0); piece(sr, s1, 0, d1);
    } else piece(s0, s1, d0, d1);
  }
  return out;
}

// ---------------------------------------------------------------------------------------
// The flooding line: sqrt(jg/jg0) + sqrt(jf/jf0) = 1, with a given net flux n = jf - jg
// (downward positive). Returns the pair on the line; outside it, one-way flow.
// ---------------------------------------------------------------------------------------
function floodingPair(n, jg0, jf0) {
  if (n >= jf0) return { jg: 0, jf: n };
  if (n <= -jg0) return { jg: -n, jf: 0 };
  const a = 1 / Math.sqrt(jg0), b = 1 / Math.sqrt(jf0);
  let lo = Math.max(0, -n), hi = jg0;
  for (let i = 0; i < 40; i++) {                            // fixed count: deterministic
    const x = 0.5 * (lo + hi);
    if (a * Math.sqrt(x) + b * Math.sqrt(Math.max(0, x + n)) - 1 < 0) lo = x; else hi = x;
  }
  const jg = 0.5 * (lo + hi);
  return { jg: jg, jf: Math.max(0, jg + n) };
}

// The two intercepts of the flooding line for an opening with air (density rg) under water.
function intercepts(op, rg) {
  const C = op.C != null ? op.C : DEFAULTS.C, m = op.m != null ? op.m : DEFAULTS.m;
  const Ku = op.Ku != null ? op.Ku : DEFAULTS.Ku;
  const kuCap = op.kuCap != null ? op.kuCap : DEFAULTS.kuCap;
  const b = op.A / op.L;
  const Dh = op.Dh != null ? op.Dh : 2 * op.L * b / (op.L + b);
  const dr = RHO_W - rg;
  const jf0 = C * C * Math.sqrt(G * Dh * dr / RHO_W) / (m * m);   // water alone (Froude)
  const jgW = C * C * Math.sqrt(G * Dh * dr / rg);                // air alone, Wallis
  const jgK = Ku * Math.pow(G * SIGMA * dr, 0.25) / Math.sqrt(rg); // air alone, Kutateladze
  return { jf0: jf0, jg0: kuCap ? Math.min(jgW, jgK) : jgW, Dh: Dh };
}

// ---------------------------------------------------------------------------------------
// The whole law for one opening: law P, plus the counter-current exchange (law X) wherever
// water stands over air across the opening, weighted by how far the opening is from vertical.
// ---------------------------------------------------------------------------------------
function exchange(op, a, b) {
  const f = lawP(op, a, b);
  const nz = Math.max(-1, Math.min(1, op.nz || 0));
  f.extra = 0;
  if (Math.abs(nz) < 1e-6) return f;
  const upper = nz > 0 ? b : a, lower = nz > 0 ? a : b;
  // the share of the opening with water above it and air below it
  const hb = Math.max(f.h, 0.02 * op.L);
  const z0 = op.zc - 0.5 * hb, z1 = op.zc + 0.5 * hb;
  const fx = Math.max(0, Math.min(z1, upper.zw) - Math.max(z0, lower.zw)) / hb;
  if (fx <= 0) return f;
  const W = fx * Math.sqrt(Math.abs(nz));                   // [bet] g's share along the normal
  const ic = intercepts(op, rhoAir(lower.pa));
  const down = nz > 0 ? f.wIn + f.aIn : f.wOut + f.aOut;
  const up = nz > 0 ? f.wOut + f.aOut : f.wIn + f.aIn;
  const pair = floodingPair((down - up) / op.A, ic.jg0, ic.jf0);
  const eW = Math.min(pair.jg, pair.jf), eP = Math.min(down, up) / op.A;
  const extra = Math.max(0, W * eW - eP) * op.A;            // never less than law P's own
  f.extra = extra;
  if (nz > 0) { f.wIn += extra; f.aOut += extra; } else { f.wOut += extra; f.aIn += extra; }
  return f;
}

// ---------------------------------------------------------------------------------------
// Safeguard 1: the one-way limiter. For q = c*sqrt(dp) relaxing a pressure difference dp
// against a stiffness k (Pa per m3 moved), the exact volume moved in dt is
//   V = q*dt*(1 - x/4) for x < 2,  V = dp/k for x >= 2,   x = k*q*dt/dp
// so a sub-step can level the two sides but never pass the level. k of a side is
// rho*g/S (its free surface S) + pa/Va (its air pocket, if closed); the sea's is 0.
// With several openings on one space, use the space's summed net flow, or safeguard 2.
// ---------------------------------------------------------------------------------------
function sideStiffness(side) {
  let k = 0;
  if (side.S > 0 && isFinite(side.S)) k += RHO_W * G / side.S;
  if (side.Va > 0 && isFinite(side.Va)) k += side.pa / side.Va;
  return k;
}
function limitOneWay(f, a, b, dt) {
  const net = f.wIn + f.aIn - f.wOut - f.aOut;
  const dp = Math.max(Math.abs(f.dpLo), Math.abs(f.dpHi));
  const k = sideStiffness(a) + sideStiffness(b);
  if (!(k > 0) || net === 0) return 1;
  if (!(dp > 0)) return 0;
  const x = k * Math.abs(net) * dt / dp;
  return x < 2 ? 1 - 0.25 * x : 1 / x;                      // scale the NET part by this
}

// ---------------------------------------------------------------------------------------
// Safeguard 2 (the one to use for air): one space's air pressure taken implicitly.
// Air pressure is the stiff variable (at depth pa/Va grows as depth squared); the levels
// are slow. Find the end-of-step pressure p at which Boyle's law closes with the flows
// evaluated AT p. The residual is monotone in p, so bisection cannot fail or overshoot.
// space: { zw, pa, Va, S } (S: free-surface area; Va: air volume); ops: [{ op, other }].
// Returns the flows' volumes moved in dt and the new state. Fixed iteration count.
// ---------------------------------------------------------------------------------------
function stepSpace(space, ops, dt) {
  const M0 = space.pa * space.Va;                           // isothermal: p*V is the air's amount
  const evalAt = (p) => {
    const a = { zw: space.zw, pa: p };
    let w = 0, aOutPV = 0, aInPV = 0, wIn = 0, wOut = 0, aOut = 0;
    for (let i = 0; i < ops.length; i++) {
      const f = exchange(ops[i].op, a, ops[i].other);
      w += (f.wIn - f.wOut) * dt; wIn += f.wIn * dt; wOut += f.wOut * dt;
      aOut += f.aOut * dt; aOutPV += p * f.aOut * dt; aInPV += ops[i].other.pa * f.aIn * dt;
    }
    // positivity: never more air out than there is, never more water in than there is room
    const Mn = Math.max(0, M0 - Math.min(aOutPV, M0) + aInPV);
    const Vn = Math.max(1e-9, space.Va - w);
    return { R: p * Vn - Mn, Mn: Mn, Vn: Vn, w: w, wIn: wIn, wOut: wOut, aOut: aOut };
  };
  let pmax = space.pa;
  for (let i = 0; i < ops.length; i++) {
    const o = ops[i].other, op = ops[i].op;
    pmax = Math.max(pmax, sideP(o, op.zc - 0.5 * op.L), sideP(space, op.zc - 0.5 * op.L));
  }
  let lo = Math.log(1), hi = Math.log(2 * pmax);
  for (let i = 0; i < 48; i++) {
    const mid = 0.5 * (lo + hi);
    if (evalAt(Math.exp(mid)).R < 0) lo = mid; else hi = mid;
  }
  const p = Math.exp(0.5 * (lo + hi)), e = evalAt(p);
  const Va = e.Vn, pa = e.Mn / e.Vn;
  return { pa: e.Mn > 0 ? pa : p, Va: Va, zw: space.zw + (space.Va - Va) / space.S,
           airPV: e.Mn, moved: e };
}

module.exports = { G, RHO_W, P_ATM, RHO_A0, SIGMA, DEFAULTS, rhoAir, sideP, meanSqrt, lawP,
  floodingPair, intercepts, exchange, sideStiffness, limitOneWay, stepSpace };
