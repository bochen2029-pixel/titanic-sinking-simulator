/*
 * Z6's spaces: a falling piece's share of the core's 64 spaces, and the water and the air in each at any attitude
 * (milestone 2 of docs/DESIGN_free_body_air_by_space_v1_3_2026-11-20.md, section 1; v1 and v1.1 beside it).
 *
 * Each space is its own column segments, as the core builds them (buildShip: nodeStart, nodeCount, entCol, entA, entE;
 * a column cols.dx by cols.dy in plan, its segment from entA to entE up her), each segment a box in her frame, cut by
 * length at the piece's ends. Nothing else is tabled.
 *
 * The part of a box below a level plane is exact in closed form (e83's rule: its volume, its free surface's area and
 * its three first moments; docs/research/experiments/e83_z6_box_moments_lib.js, its derivation and its 705 cases
 * there). So in a space holding W m3:
 *   - the level that holds W is solved by Newton on the boxes, from the last level, inside the space's own bracket;
 *   - the water's centroid is the boxes' moments over W;
 *   - the air's is the space's own centroid less the water's, by moments: exact, and above the free surface.
 * At small angles the rule gives the core's own centre-line volumes (a prism cut through its sides only).
 *
 * A library of the fall (core/readers/fall.js): it reads the ship and registers nothing with the night. It also holds
 * the exchange through one opening (e84's laws P and X: `flow.exchange`) and one space's air pressure taken implicitly
 * (`flow.stepSpace`), ported so that they call no engine transcendental. Milestone 2's later parts build on them: each
 * piece's openings, its spaces' water and air stepped, and the failures.
 *
 * It calls no Math.sin or Math.cos (E1).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TitanicSpaces = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ================================================================ e83's box rule
  // boxMoments(w, g, s, out): the part R = { t : |t_k| <= w_k, g.t <= s } of a box centred at the origin, in its own
  // axes, below the plane g.t = s (|g| = 1; any signs, zeros allowed): out.V = vol(R), out.A = dV/ds, out.M[k] = the
  // integral over R of t_k. Copied from e83's library, unchanged but for its names' scope.
  let c1 = 0, c2 = 0, h = 0, bmin = 0;
  let rV = 0, rA = 0, rI = 0;
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
  function pieces(bk, bi, bj, s, full) {
    const bmax = bi > bj ? bi : bj;
    if (bmax <= 1e-150 * bk) {
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
      const zp = p - s, zq = q - s;
      if (zq <= -bk || zp >= bk) continue;
      const lo = zp < -bk, hi = zq > bk;
      const dz = lo ? (hi ? 2 * bk : zq + bk) : (hi ? bk - zp : q - p);
      if (!(dz > 0)) continue;
      const ra = lo ? s - bk : p, rb = hi ? s + bk : q;
      const ya = lo ? 1 : -zp / bk, yb = hi ? -1 : -zq / bk;
      const fa = lo ? fR(ra) : (j === 0 ? 0 : h);
      const fb = hi ? fR(rb) : (j === 2 ? 0 : h);
      const fm = 0.5 * (fa + fb);
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

  // ================================================================ a piece's spaces
  // spacesOf(ship, x0, x1): the spaces of the piece between x0 and x1 (her frame), each the core's node n with its
  // permeability mu, its room V (m3, mu counted), its own centroid, and its boxes: centres (bx, by, bz) and half widths
  // (wx, wy, wz). A column's segment that a cut crosses keeps the part inside, by length; a space with no box left out
  function spacesOf(ship, x0, x1) {
    const c = ship.cols, NN = ship.nodeMu.length, dy = c.dy;
    const bx = [], by = [], bz = [], wx = [], wy = [], wz = [];
    const node = [], start = [], count = [], mu = [], V = [], cx = [], cy = [], cz = [];
    for (let n = 0; n < NN; n++) {
      const s0 = bx.length, m = ship.nodeMu[n];
      let v = 0, mx = 0, my = 0, mz = 0;
      for (let j = ship.nodeStart[n], j1 = j + ship.nodeCount[n]; j < j1; j++) {
        const i = ship.entCol[j], a = ship.entA[j], b = ship.entE[j];
        if (!(b > a)) continue;
        const lo = Math.max(x0, c.x[i] - 0.5 * c.dx[i]), hi = Math.min(x1, c.x[i] + 0.5 * c.dx[i]);
        if (!(hi - lo > 1e-9)) continue;
        const xm = 0.5 * (lo + hi), hx = 0.5 * (hi - lo), hz = 0.5 * (b - a), zm = 0.5 * (a + b);
        bx.push(xm); by.push(c.y[i]); bz.push(zm); wx.push(hx); wy.push(0.5 * dy); wz.push(hz);
        const vb = m * 8 * hx * (0.5 * dy) * hz;
        v += vb; mx += vb * xm; my += vb * c.y[i]; mz += vb * zm;
      }
      if (bx.length > s0 && v > 0) { node.push(n); start.push(s0); count.push(bx.length - s0); mu.push(m); V.push(v); cx.push(mx / v); cy.push(my / v); cz.push(mz / v); }
    }
    const A = (a) => Float64Array.from(a);
    return { n: node.length, node: Int32Array.from(node), start: Int32Array.from(start), count: Int32Array.from(count), mu: A(mu), V: A(V), cx: A(cx), cy: A(cy), cz: A(cz),
      bx: A(bx), by: A(by), bz: A(bz), wx: A(wx), wy: A(wy), wz: A(wz) };
  }

  // ================================================================ the water in a space at any attitude
  // u: the world's up in her frame (unit: R^T z, R taking her frame to the world); zr: the world height of her frame's
  // origin. below() fills out with the room below the world level h in space k (V, mu counted), its free surface's
  // area along the vertical (A = dV/dh) and its first moments about her frame's origin (mx, my, mz)
  const W3 = new Float64Array(3), BOX = { V: 0, A: 0, M: new Float64Array(3) };
  function below(sp, k, u, zr, h, out) {
    const m = sp.mu[k];
    let V = 0, A = 0, mx = 0, my = 0, mz = 0;
    for (let q = sp.start[k], q1 = q + sp.count[k]; q < q1; q++) {
      W3[0] = sp.wx[q]; W3[1] = sp.wy[q]; W3[2] = sp.wz[q];
      const s = h - zr - (u[0] * sp.bx[q] + u[1] * sp.by[q] + u[2] * sp.bz[q]);
      boxMoments(W3, u, s, BOX);
      if (BOX.V === 0) continue;
      V += m * BOX.V; A += m * BOX.A;
      mx += m * (BOX.V * sp.bx[q] + BOX.M[0]); my += m * (BOX.V * sp.by[q] + BOX.M[1]); mz += m * (BOX.V * sp.bz[q] + BOX.M[2]);
    }
    out.V = V; out.A = A; out.mx = mx; out.my = my; out.mz = mz;
    return out;
  }
  // the space's lowest and highest world heights at this attitude: the bracket of its level
  function bracket(sp, k, u, zr, out) {
    let lo = Infinity, hi = -Infinity;
    const au0 = u[0] < 0 ? -u[0] : u[0], au1 = u[1] < 0 ? -u[1] : u[1], au2 = u[2] < 0 ? -u[2] : u[2];
    for (let q = sp.start[k], q1 = q + sp.count[k]; q < q1; q++) {
      const zc = zr + u[0] * sp.bx[q] + u[1] * sp.by[q] + u[2] * sp.bz[q], e = au0 * sp.wx[q] + au1 * sp.wy[q] + au2 * sp.wz[q];
      if (zc - e < lo) lo = zc - e;
      if (zc + e > hi) hi = zc + e;
    }
    out[0] = lo; out[1] = hi;
    return out;
  }
  // water(sp, k, u, zr, W, h0, out): the world level that holds W m3 in space k (Newton from h0, kept inside the
  // space's bracket; to 1e-12 of its room), and the water's and the air's centroids in her frame
  const BR = new Float64Array(2), WB = { V: 0, A: 0, mx: 0, my: 0, mz: 0 };
  function water(sp, k, u, zr, W, h0, out) {
    const Vk = sp.V[k];
    bracket(sp, k, u, zr, BR);
    let lo = BR[0], hi = BR[1], lev, it = 0;
    if (!(W > 0)) { lev = lo; WB.V = 0; WB.mx = 0; WB.my = 0; WB.mz = 0; }
    else if (!(W < Vk)) { lev = hi; below(sp, k, u, zr, hi, WB); }
    else {
      lev = h0 > lo && h0 < hi ? h0 : lo + (hi - lo) * W / Vk;
      const tol = 1e-12 * Vk;
      for (it = 0; it < 100; it++) {
        below(sp, k, u, zr, lev, WB);
        const err = WB.V - W;
        if ((err < 0 ? -err : err) <= tol) break;
        if (err > 0) hi = lev; else lo = lev;
        let hn = WB.A > 0 ? lev - err / WB.A : 0.5 * (lo + hi);
        if (!(hn > lo && hn < hi)) hn = 0.5 * (lo + hi);
        lev = hn;
      }
    }
    const wv = WB.V;
    out.level = lev; out.iter = it; out.V = wv;
    out.wx = wv > 0 ? WB.mx / wv : sp.cx[k]; out.wy = wv > 0 ? WB.my / wv : sp.cy[k]; out.wz = wv > 0 ? WB.mz / wv : sp.cz[k];
    const air = Vk - wv;
    out.air = air;
    out.ax = air > 1e-9 * Vk ? (Vk * sp.cx[k] - WB.mx) / air : sp.cx[k];
    out.ay = air > 1e-9 * Vk ? (Vk * sp.cy[k] - WB.my) / air : sp.cy[k];
    out.az = air > 1e-9 * Vk ? (Vk * sp.cz[k] - WB.mz) / air : sp.cz[k];
    return out;
  }


  // ================================================================ a piece's spaces at the hand-over
  // stateOf(sp, whole, sim, F): each space's water W (m3) and air a (m3 at one atmosphere: the core's air stands at the
  // atmosphere's pressure) at the hand-over, and its level by the box rule at the hand-over's pose F. A space's water is
  // the core's, its over-fill dropped as the fall drops it (min(vol, room); C5's rule); a space the cut crosses takes
  // the share of it that lies on this piece's side: its boxes' room below the core's own level, over the whole space's
  // (`whole`: spacesOf(ship, -inf, inf)). The two pieces' shares of a space sum to its water to rounding.
  const SB = { V: 0, A: 0, mx: 0, my: 0, mz: 0 }, SO = {};
  function stateOf(sp, whole, sim, F) {
    const n = sp.n, W = new Float64Array(n), a = new Float64Array(n), lev = new Float64Array(n), u = [F.R20, F.R21, F.R22], zr = F.tz;
    const idx = new Map(); for (let q = 0; q < whole.n; q++) idx.set(whole.node[q], q);
    for (let k = 0; k < n; k++) {
      const node = sp.node[k], q = idx.get(node), Wn = Math.min(sim.vol[node], whole.V[q]);
      let Wk = Wn;
      if (Math.abs(sp.V[k] - whole.V[q]) > 1e-9 * whole.V[q]) {   // the cut crosses this space: this piece's share
        const h = sim.level[node], mine = below(sp, k, u, zr, h, SB).V, all = below(whole, q, u, zr, h, SB).V;
        Wk = all > 0 ? Wn * mine / all : Wn * sp.V[k] / whole.V[q];
        if (Wk > sp.V[k]) Wk = sp.V[k];
      }
      W[k] = Wk; a[k] = sp.V[k] - Wk;
      water(sp, k, u, zr, Wk, sim.level[node], SO); lev[k] = SO.level;
    }
    return { W, a, lev };
  }

  // ================================================================ a piece's openings
  // openingsOf(sp, sim, x0, x1, K): the core's connections whose point lies in [x0, x1), each between two of this
  // piece's spaces or a space and the sea (-1), as e84's openings in her frame (the core's buildConnections, its kinds
  // K_DOOR 0 to K_STAIR 9):
  //   a, b     the inside space and the other side (a space, or -1 for the sea); the normal points from a to b
  //   px py pz its point in her frame; nx ny nz its unit normal in her frame
  //   A, L, Cd its clear area, its extent in its own plane (e84's L), its discharge coefficient
  //   open     whether it is open now (a door shut, a staircase's window not yet given way, a breach not yet come on)
  // An orifice (type 0) is a square of its area. A weir (type 1: area is its crest's length) is an upright slot of that
  // width from its crest up, K.slot m high [bet: 1 m; the clearance to the deck above for OVER is the geometry's, a
  // refinement]: under free overflow e84's strip law over it is the weir law; drowned it is an orifice. S1's upright
  // openings (type 2) take their width and height; its level ones (type 3), their area. The cut adds, for each space it
  // crosses, its boxes' faces at the cut times K.clear [bet: 0.4 to 0.8 of the gross section, v1.3; 0.6], to the sea,
  // its normal along her length out of the piece, its discharge coefficient K.cutCd [e84's: a sharp-edged orifice, 0.6;
  // band 0.45 to 0.75 for a clear opening].
  const KIND_NORMAL = [[-1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, -1, 0], [0, -1, 0], [0, -1, 0], [0, 0, 1], null, null, null];
  function openingsOf(sp, sim, x0, x1, K) {
    K = K || {};
    const slot = K.slot === undefined ? 1.0 : K.slot, clear = K.clear === undefined ? 0.6 : K.clear, cutCd = K.cutCd === undefined ? 0.6 : K.cutCd;
    const S = sim.conn, idx = new Map(), ops = [];
    for (let k = 0; k < sp.n; k++) idx.set(sp.node[k], k);
    for (let c = 0; c < S.n; c++) {
      if (!(S.x[c] >= x0 && S.x[c] < x1)) continue;
      const kd = S.kind[c], t = S.type[c], ca = S.a[c], cb = S.b[c];
      // inside: a space of this piece; the other side: a space or the sea. The core's a is the sea for its openings to the
      // weather (TOP, BREACH, OPEN, STAIR), so those turn round: inside the space, outside the sea
      let a, b, flip = 1;
      if (ca < 0) { a = idx.has(cb) ? idx.get(cb) : -2; b = -1; flip = -1; } else { a = idx.has(ca) ? idx.get(ca) : -2; b = cb < 0 ? -1 : (idx.has(cb) ? idx.get(cb) : -2); }
      if (a < 0 || b === -2) continue;
      let n = KIND_NORMAL[kd];
      if (!n) n = t === 3 ? [0, 0, 1] : [0, S.y[c] >= 0 ? 1 : -1, 0];   // her side (BREACH, OPEN, STAIR upright) or a dome
      else if (flip < 0) n = [-n[0], -n[1], -n[2]];
      let A, L, pz = S.z[c];
      if (kd === 6) { n = [0, 0, 1]; A = S.area[c] * slot; L = Math.sqrt(A); }   // TOP: hatches in the deck, level, out upward: the crest times K.slot [bet]
      else if (t === 0) { A = S.area[c]; L = Math.sqrt(A); }
      else if (t === 1) { A = S.area[c] * slot; L = slot; pz = S.z[c] + 0.5 * slot; }
      else if (t === 2) { A = S.area[c] * S.dim[c]; L = S.dim[c]; pz = S.z[c] + 0.5 * S.dim[c]; }
      else { A = S.area[c]; L = Math.sqrt(A); }
      const open = S.en[c] === 1 && !(S.tOn[c] > sim.t);
      const op = { c, kind: kd, a, b, px: S.x[c], py: S.y[c], pz, nx: n[0], ny: n[1], nz: n[2], A, L, Cd: S.coef[c], open };
      if (kd === 0) op.door = S.idx[c];                                 // K_DOOR: its bulkhead (doorsOf, doorsStep)
      ops.push(op);
    }
    // the cut: each space the cut crosses opens to the sea over its boxes' faces there
    const xc = x0 > -1e8 ? x0 : (x1 < 1e8 ? x1 : null);
    if (xc !== null) {
      const out = x0 > -1e8 ? -1 : 1;                                   // the bow's cut is its after end, the stern's its fore
      for (let k = 0; k < sp.n; k++) {
        let A = 0, zA = 0, yA = 0, zlo = Infinity, zhi = -Infinity;
        for (let q = sp.start[k], q1 = q + sp.count[k]; q < q1; q++) {
          if (Math.abs((out < 0 ? sp.bx[q] - sp.wx[q] : sp.bx[q] + sp.wx[q]) - xc) > 1e-6) continue;
          const f = 4 * sp.wy[q] * sp.wz[q];
          A += f; zA += f * sp.bz[q]; yA += f * sp.by[q];
          if (sp.bz[q] - sp.wz[q] < zlo) zlo = sp.bz[q] - sp.wz[q];
          if (sp.bz[q] + sp.wz[q] > zhi) zhi = sp.bz[q] + sp.wz[q];
        }
        if (!(A > 0)) continue;
        ops.push({ c: -1, kind: 'cut', a: k, b: -1, px: xc, py: yA / A, pz: zA / A, nx: out, ny: 0, nz: 0, A: clear * A, L: zhi - zlo, Cd: cutCd, open: true });
      }
    }
    return ops;
  }

  // ================================================================ the exchange through an opening (e84's laws P and X)
  // e84's library (docs/research/experiments/e84_z6_exchange_lib.js and its tests e84_z6_exchange.js; the research note
  // docs/research/RESEARCH_torn_end_exchange_law_v1_2026-11-20.md), copied here with two changes so that it calls no
  // engine transcendental (E2a): x^0.25 as two square roots, and stepSpace's bisection geometric by sqrt(lo hi) in place
  // of exp of the logs' mean. e84's own tests give the same output to the digit on the copy (Z1, 2026-11-21).
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
    // air pressed past about 800 bar is denser than the sea: no buoyant exchange (the line's intercepts 0). Only a speck
    // squeezed into a sliver of room gets there, and only in a pressure solve's bracket (Z1, 4d: its square root of a
    // negative was a NaN that the solve took for its root)
    const dr = RHO_W > rg ? RHO_W - rg : 0;
    const jf0 = C * C * Math.sqrt(G * Dh * dr / RHO_W) / (m * m);   // water alone (Froude)
    const jgW = C * C * Math.sqrt(G * Dh * dr / rg);                // air alone, Wallis
    const jgK = Ku * Math.sqrt(Math.sqrt(G * SIGMA * dr)) / Math.sqrt(rg); // air alone, Kutateladze (x^0.25 by two sqrt: the same bits in every engine)
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
  // (Z1, 2026-11-23, on the stern-work team's finding: in a piece's spaces it is applied pair by pair, so a side is
  // judged by its own stiffness alone, and a space the sea holds through another opening is taken as stiff as if it
  // were sealed: a full one by its free surface's floor, 1e-6 m2, a nearly full one by a trapped bubble's pa/Va.
  // stepPiece's 'held' (heldBySea) gives such a side the sea's 0; 'pair' is the limiter as it was.)
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
    // bisection on the pressure, geometric: the midpoint sqrt(lo hi) is exp of the logs' mean, by sqrt alone (correctly
    // rounded, so the same bits in every engine)
    let lo = 1, hi = 2 * pmax;
    for (let i = 0; i < 48; i++) {
      const mid = Math.sqrt(lo * hi);
      if (evalAt(mid).R < 0) lo = mid; else hi = mid;
    }
    const p = Math.sqrt(lo * hi), e = evalAt(p);
    const Va = e.Vn, pa = e.Mn / e.Vn;
    return { pa: e.Mn > 0 ? pa : p, Va: Va, zw: space.zw + (space.Va - Va) / space.S,
             airPV: e.Mn, moved: e };
  }


  // ================================================================ a piece's spaces stepped
  // stepPiece(sp, st, ops, R, r, dt, how, lim): one step of a piece's spaces over dt at her pose: R takes her frame to the
  // world (row-major), r is her frame's origin in the world, the sea's surface at z = 0. Each space's level by the box
  // rule at the pose and its pressure (airP: its air's, P_ATM a / (V - W), isothermal, a its air in m3 at one
  // atmosphere); each open opening's world centre and the world z of its normal. Then each space in turn, in a fixed
  // order (Gauss-Seidel): its air's pressure at the step's end taken implicitly over all its openings (e84's safeguard 2:
  // the root of stepSpace's residual, by rootIllinois from the space's last pressure, st.pLast; how 'bisect' takes e84's
  // 48 halvings, which it matches to about 1e-7 of a room a step at 1.7 times the speed), and every one of its openings'
  // flows at that pressure moved, all the water and then all the air, out of
  // one side and into the other. The solve and the moves take the same flows (flowsAt), as they can move: between two
  // spaces the net held by e84's one-way limiter (safeguard 1: a step levels the two sides, never passes the level;
  // lim 'held': a side the sea holds at the step's start, heldBySea's, counted as stiff as the sea, 0; 'pair' or none:
  // each side by its own stiffness, as before);
  // over the openings to one neighbour, no more water than it holds or has room for and no more air than it holds, and
  // no air into it with no room; the sea gives and takes without limit. Z1, 4c: with the caps applied only after the
  // solve, a space counted on moves the caps then refused (into a full neighbour, past a neighbour's air), and its air
  // was squeezed past the sea's, to 400 to 1,800 bar where the sea gave 150 to 220, and stranded in no room. A move
  // never takes more water or air than a side holds, nor more water than the other has room for, and no air goes into a
  // space with no room above its water; air left in a space its water has filled bubbles out to the sea (st.bubbled, m3
  // at one atmosphere). So her water and air change only by what passes to and from the sea. st: { W, a, lev }
  // (stateOf's), changed in place.
  // The root of a residual that rises with p, in [lo, hi]. rootBisect: 48 geometric halvings (sqrt alone, correctly
  // rounded, so the same bits in every engine), e84's stepSpace's. rootIllinois: geometric halvings until hi < 4 lo, then
  // Illinois false position (the end kept twice running has the other's residual halved), each point kept inside the
  // bracket, to a width of 1e-13 of p or 100 evaluations; a residual of exactly 0 ends it there
  function rootBisect(f, lo, hi) {
    for (let i = 0; i < 48; i++) { const mid = Math.sqrt(lo * hi); if (f(mid) < 0) lo = mid; else hi = mid; }
    return Math.sqrt(lo * hi);
  }
  function rootIllinois(f, lo, hi, guess) {
    let n = 0, flo, fhi;
    if (guess > lo && guess < hi) {
      // from the space's last pressure: a bracket a factor 1.5 about it, widened four-fold a side while it holds none
      let a = guess / 1.5, b = guess * 1.5;
      if (a < lo) a = lo; if (b > hi) b = hi;
      let fa = f(a), fb = f(b); n += 2;
      while (fa > 0 && a > lo && n < 40) { b = a; fb = fa; a = a / 4 < lo ? lo : a / 4; fa = f(a); n++; }
      while (fb < 0 && b < hi && n < 40) { a = b; fa = fb; b = b * 4 > hi ? hi : b * 4; fb = f(b); n++; }
      if (fa === 0) return a;
      if (fb === 0) return b;
      if (fa < 0 && fb > 0) { lo = a; flo = fa; hi = b; fhi = fb; }
      else if (fa > 0) return a;
      else return b;
    } else {
      flo = f(lo); n++;
      if (!(flo < 0)) return lo;
      while (hi > 4 * lo && n < 100) { const mid = Math.sqrt(lo * hi), fm = f(mid); n++; if (fm < 0) { lo = mid; flo = fm; } else { hi = mid; fhi = fm; } }
      if (fhi === undefined) { fhi = f(hi); n++; }
      if (!(fhi > 0)) return hi;
    }
    let kept = 0, step = 0, w2 = hi - lo;
    while (hi - lo > 1e-13 * hi && n < 160) {
      // two false-position steps that do not halve the bracket are followed by a halving: so it halves at least every
      // three evaluations whatever the residual's shape
      let x;
      if (step === 2) { x = 0.5 * (lo + hi); step = 0; kept = 0; w2 = hi - lo; }
      else {
        x = (lo * fhi - hi * flo) / (fhi - flo);
        if (!(x > lo && x < hi)) x = 0.5 * (lo + hi);
        step++;
      }
      const fx = f(x); n++;
      if (fx < 0) { lo = x; flo = fx; if (kept < 0) fhi *= 0.5; kept = -1; }
      else if (fx === 0) return x;
      else { hi = x; fhi = fx > 0 ? fx : Infinity; if (kept > 0) flo *= 0.5; kept = 1; }   // a NaN (a law past its range) counts as above the root, as rootBisect takes it
      if (step === 2 && hi - lo <= 0.5 * w2) { step = 0; w2 = hi - lo; }
    }
    return lo - flo * (hi - lo) / (fhi - flo);
  }
  // ================================================================ the watertight doors' floats in the fall
  // The core's doorsStep (core.js, Y2) mirrored in a piece's spaces (Z1, 2026-11-24, with the mainline's e120): a door
  // open at the hand-over whose float is armed (sim.doorFloat) is released once water stands P.floatDepth over the lowest
  // point of a space below E deck on either side of its bulkhead (zones b and b + 1, both sides, as the core's nodes b
  // and b + 1 at layer 0), and falls shut over P.doorFall seconds; a fall under way at the hand-over (sim.doorFall)
  // goes on. A door shut at the hand-over stays shut; nothing in the fall opens one. doorsOf(sim, sp, ops): this piece's
  // bulkheads with an open door, each { b, fall (seconds left, or -1), float, ops (indices), spaces (this piece's
  // spaces the float sees) }. doorsStep(sp, st, D, ops, R, r, dt, P, t): one step of them at her pose, t the clock at
  // the step's end; returns the count shut in it (each kept in st.doorsShut, { b, t }; each release in st.doorsReleased)
  function doorsOf(sim, sp, ops) {
    const byB = new Map(), idx = new Map();
    for (let k = 0; k < sp.n; k++) idx.set(sp.node[k], k);
    for (let i = 0; i < ops.length; i++) {
      const o = ops[i];
      if (!(o.door >= 0) || !o.open) continue;
      let d = byB.get(o.door);
      if (!d) {
        const b = o.door, spaces = [];
        for (let z = b; z <= b + 1; z++) for (let sd = 0; sd < 2; sd++) { const k = idx.get((z * 2 + sd) * 2); if (k !== undefined) spaces.push(k); }
        byB.set(b, d = { b, fall: sim.doorFall && sim.doorFall[b] >= 0 ? sim.doorFall[b] : -1, float: !!(sim.doorFloat && sim.doorFloat[b]), ops: [], spaces });
      }
      d.ops.push(i);
    }
    return Array.from(byB.values()).sort((x, y) => x.b - y.b);
  }
  const BRD = new Float64Array(2);
  function doorsStep(sp, st, D, ops, R, r, dt, P, t) {
    const u = [R[6], R[7], R[8]], zr = r[2];
    let n = 0;
    for (const d of D) {
      if (!d.ops.some(i => ops[i].open)) continue;
      if (d.fall >= 0) {
        d.fall -= dt;
        if (d.fall <= 0) { for (const i of d.ops) ops[i].open = false; n++; (st.doorsShut || (st.doorsShut = [])).push({ b: d.b, t }); }
        continue;
      }
      if (!d.float) continue;
      for (const k of d.spaces) {
        if (!(st.W[k] > 1e-6)) continue;
        bracket(sp, k, u, zr, BRD);
        if (st.lev[k] - BRD[0] > P.floatDepth) { d.fall = P.doorFall; (st.doorsReleased || (st.doorsReleased = [])).push({ b: d.b, t }); break; }
      }
    }
    return n;
  }
  // ================================================================ the openings to the weather in the fall
  // The core's stairsStep (core.js; S1, and C4's openings in her side) mirrored in a piece's spaces (Z1, 2026-11-24, the
  // coordinator's (3)): each of sim.stairOps (the tiers' windows, the grand staircases' doors and domes, D and E decks'
  // side openings) that this piece holds, in the state the hand-over left it (sim.stairSt: 0 the sea below its sill, 1
  // the sea at it, 2 given way). The sea reaching its sill makes it 1 (where it has a leak, its connections open with
  // their own area as handed over); it gives way, for good, once the sea's head over its centre less the head of the
  // water behind it (its spaces' levels) reaches its own strength (o.hc); a dome also once the sea stands
  // sim.params.hAir over the lintel of every door of its staircase that has given way (one at least). Given way, its
  // connections take its size shared among them, as the core's do (stairsStep). The sea's surface is the world's 0 (the
  // fall's sea has no heads of her motion). weatherOf(sim, sp, ops, K): this piece's openings to the weather not yet
  // given way, { list: [{ j, st, o, ops (indices), give ([A, L] for each), spaces }], st0, ops0 }. weatherStep(sp, st,
  // Wt, ops, R, r, t, P): one step at her pose, t the clock at its end; returns the count given way in it (each kept in
  // st.weatherOpened, { j, id, t })
  function weatherOf(sim, sp, ops, K) {
    const S = sim.conn, so = sim.stairOps || [], slot = K && K.slot !== undefined ? K.slot : 1.0;
    const idx = new Map(), byC = new Map(), list = [];
    for (let k = 0; k < sp.n; k++) idx.set(sp.node[k], k);
    for (let i = 0; i < ops.length; i++) if (ops[i].c >= 0) byC.set(ops[i].c, i);
    for (let j = 0; j < so.length; j++) {
      const o = so[j], s0 = sim.stairSt ? sim.stairSt[j] : 0, nc = o.nodes.length;
      if (s0 === 2) continue;
      const mine = [], give = [];
      for (let i = 0; i < nc; i++) {
        const q = byC.get(o.conn + i); if (q === undefined) continue;
        const c = o.conn + i, t = S.type[c], area = o.size / nc;
        mine.push(q);
        // its clear area and extent once given way, as openingsOf makes them from the connection's area
        if (S.kind[c] === 6) { const A = area * slot; give.push([A, Math.sqrt(A)]); }
        else if (t === 0) give.push([area, Math.sqrt(area)]);
        else if (t === 1) give.push([area * slot, slot]);
        else if (t === 2) give.push([area * S.dim[c], S.dim[c]]);
        else give.push([area, Math.sqrt(area)]);
      }
      if (!mine.length) continue;
      const spaces = []; for (const nd of o.nodes) { const k = idx.get(nd); if (k !== undefined && spaces.indexOf(k) < 0) spaces.push(k); }
      list.push({ j, st: s0, o, ops: mine, give, spaces });
    }
    return { list, st0: Uint8Array.from(sim.stairSt || []), ops0: so };
  }
  function weatherStep(sp, st, Wt, ops, R, r, t, P) {
    const u0 = R[6], u1 = R[7], u2 = R[8], zr = r[2], zAt = (x, y, z) => zr + u0 * x + u1 * y + u2 * z;
    const stOf = (j) => { for (const w of Wt.list) if (w.j === j) return w.st; return Wt.st0[j]; };
    let n = 0;
    for (const w of Wt.list) {
      if (w.st === 2) continue;
      const o = w.o;
      if (w.st === 0 && -zAt(o.x, o.y, o.z) > 0) {                    // the sea at its sill
        w.st = 1;
        if (o.leak > 0) for (const i of w.ops) ops[i].open = true;
      }
      let go = false;
      if (w.st === 1) {
        const zm = zAt(o.x, o.y, o.zc), out = -zm;
        if (out > 0) {
          let back = 0;
          for (const k of w.spaces) if (st.W[k] > 1e-6 && st.lev[k] - zm > back) back = st.lev[k] - zm;
          go = out - back >= o.hc;
        }
      }
      if (!go && o.type === 3 && P.hAir >= 0 && o.doors) {
        let any = false, all = true;
        for (let i = 0; i < o.doors.length && all; i++) {
          const dj = o.doors[i]; if (stOf(dj) !== 2) continue;
          any = true;
          const d = Wt.ops0[dj];
          if (!(-zAt(d.x, d.y, d.z + d.dim) >= P.hAir)) all = false;
        }
        go = any && all;
      }
      if (!go) continue;
      w.st = 2; n++;
      for (let q = 0; q < w.ops.length; q++) { const op = ops[w.ops[q]]; op.open = true; op.A = w.give[q][0]; op.L = w.give[q][1]; }
      (st.weatherOpened || (st.weatherOpened = [])).push({ j: w.j, id: o.id, t });
    }
    return n;
  }
  // heldBySea(ops, side, n): which of a piece's spaces the sea holds at the step's start (1 a space): a space whose water
  // stands over the bottom of an open opening to the sea that lies below the sea's surface, or over the bottom of an open
  // opening to a held space whose water stands over it too. Its water is one body with the sea's, so its pressure there
  // is the sea's, kept by the sea through that way however much it gives through another: for the one-way limiter its own
  // stiffness is 0, as the sea's is. A space with no such way (sealed, or dry below every way in) keeps its own: a full
  // space sealed cannot give water without leaving a void. Each opening's bottom is the law's (its centre less half its
  // vertical extent), at the pose stepPiece set (o.zcW, o.nzW); side[k].zw each space's level. Fixed order
  const HELD = { zw: 0, pa: 0, S: Infinity, Va: Infinity };          // a side the sea holds: sideStiffness 0
  function heldBySea(ops, side, n) {
    const held = new Uint8Array(n), q = [];
    const bottom = (o) => o.zcW - 0.5 * o.L * Math.sqrt(Math.max(0, 1 - o.nzW * o.nzW));
    for (const o of ops) {
      if (!o.open || o.b !== -1) continue;
      const z = bottom(o);
      if (z < 0 && side[o.a].zw > z && !held[o.a]) { held[o.a] = 1; q.push(o.a); }
    }
    while (q.length) {
      const k = q.pop();
      for (const o of ops) {
        if (!o.open || o.b < 0) continue;
        const j = o.a === k ? o.b : (o.b === k ? o.a : -1);
        if (j < 0 || held[j]) continue;
        const z = bottom(o);
        if (side[k].zw > z && side[j].zw > z) { held[j] = 1; q.push(j); }
      }
    }
    return held;
  }
  const SL = {}, SA = { V: 0, A: 0, mx: 0, my: 0, mz: 0 };
  function stepPiece(sp, st, ops, R, r, dt, how, lim) {
    const u = [R[6], R[7], R[8]], zr = r[2], n = sp.n, sea = { zw: 0, pa: P_ATM };
    const side = st.side || (st.side = Array.from({ length: n }, () => ({ zw: 0, pa: P_ATM, Va: 0, S: 0 })));
    for (let k = 0; k < n; k++) {
      water(sp, k, u, zr, st.W[k], st.lev[k], SL); st.lev[k] = SL.level;
      const Va = sp.V[k] - st.W[k], s = side[k];
      s.zw = SL.level; s.Va = Va; s.pa = airP(sp, st, k, Va, s.zw);
      s.S = Math.max(below(sp, k, u, zr, SL.level, SA).A, 1e-6);
    }
    for (const o of ops) if (o.open) { o.zcW = zr + u[0] * o.px + u[1] * o.py + u[2] * o.pz; o.nzW = u[0] * o.nx + u[1] * o.ny + u[2] * o.nz; }
    const held = lim === 'held' ? heldBySea(ops, side, n) : null;        // 'pair' (or none): the limiter as it was
    for (let k = 0; k < n; k++) {
      const list = [], nb = [];
      for (const o of ops) {
        if (!o.open) continue;
        if (o.a === k) list.push({ op: { A: o.A, L: o.L, zc: o.zcW, nz: o.nzW, Cd: o.Cd }, other: o.b < 0 ? sea : side[o.b], j: o.b });
        else if (o.b === k) list.push({ op: { A: o.A, L: o.L, zc: o.zcW, nz: -o.nzW, Cd: o.Cd }, other: side[o.a], j: o.a });
      }
      if (!list.length) continue;
      for (let i = 0; i < list.length; i++) { const j = list[i].j; if (j < 0) continue; let g = nb.find(x => x.j === j); if (!g) nb.push(g = { j, idx: [] }); g.idx.push(i); }
      const sk = side[k], k0 = { zw: sk.zw, pa: sk.pa, S: sk.S, Va: sk.Va }, FL = new Array(list.length);
      const flowsAt = (p) => {
        const me = { zw: sk.zw, pa: p };
        for (let i = 0; i < list.length; i++) {
          const it = list[i], f = exchange(it.op, me, it.other);
          if (it.j >= 0) {
            // the limiter, with k's stiffness at the step's start (so that the residual stays monotone in p)
            const s = limitOneWay(f, held && held[k] ? HELD : k0, held && held[it.j] ? HELD : it.other, dt);
            if (s < 1) {
              const vin = f.wIn + f.aIn, vout = f.wOut + f.aOut;
              if (vin > vout) { const q = (vout + s * (vin - vout)) / vin; f.wIn *= q; f.aIn *= q; }
              else if (vout > vin) { const q = (vin + s * (vout - vin)) / vout; f.wOut *= q; f.aOut *= q; }
            }
          }
          FL[i] = f;
        }
        for (const g of nb) {
          const j = g.j, room = Math.max(0, sp.V[j] - st.W[j]), full = !(room > 1e-9 * sp.V[j]), aj = st.a[j] > 0 ? st.a[j] * P_ATM / side[j].pa : 0;
          let wo = 0, wi = 0, ai = 0;
          for (const i of g.idx) { wo += FL[i].wOut; wi += FL[i].wIn; ai += FL[i].aIn; }
          const so = wo * dt > room ? room / (wo * dt) : 1, si = wi * dt > st.W[j] ? st.W[j] / (wi * dt) : 1, sa = ai * dt > aj ? aj / (ai * dt) : 1;
          for (const i of g.idx) { FL[i].wOut *= so; FL[i].wIn *= si; FL[i].aIn *= sa; if (full) FL[i].aOut = 0; }
        }
        return FL;
      };
      // the pressure at the step's end at which Boyle's law closes with the flows at it (stepSpace's residual and bracket)
      const M0 = sk.pa * sk.Va;
      const resid = (p) => {
        flowsAt(p);
        let w = 0, aOutPV = 0, aInPV = 0;
        for (let i = 0; i < list.length; i++) { const f = FL[i]; w += (f.wIn - f.wOut) * dt; aOutPV += p * f.aOut * dt; aInPV += list[i].other.pa * f.aIn * dt; }
        const Mn = Math.max(0, M0 - Math.min(aOutPV, M0) + aInPV), Vn = Math.max(1e-9, sk.Va - w);
        return p * Vn - Mn;
      };
      let pmax = sk.pa;
      for (const it of list) pmax = Math.max(pmax, sideP(it.other, it.op.zc - 0.5 * it.op.L), sideP(sk, it.op.zc - 0.5 * it.op.L));
      const p = how === 'bisect' ? rootBisect(resid, 1, 2 * pmax) : rootIllinois(resid, 1, 2 * pmax, st.pLast ? st.pLast[k] : 0);
      if (how !== 'bisect') (st.pLast || (st.pLast = new Float64Array(n)))[k] = p;
      flowsAt(p);
      for (let i = 0; i < list.length; i++) {                                // the water
        const f = FL[i], j = list[i].j;
        let w = (f.wIn - f.wOut) * dt;
        if (w > 0) { w = Math.min(w, sp.V[k] - st.W[k]); if (j >= 0) w = Math.min(w, st.W[j]); }
        else if (w < 0) { w = -Math.min(-w, st.W[k]); if (j >= 0) w = -Math.min(-w, sp.V[j] - st.W[j]); }
        st.W[k] += w; if (j >= 0) st.W[j] -= w;
      }
      for (let i = 0; i < list.length; i++) {                                // then the air, m3 at one atmosphere
        const f = FL[i], j = list[i].j;
        let am = (f.aIn * list[i].other.pa - f.aOut * p) * dt / P_ATM;
        if (am > 0) { if (j >= 0) am = Math.min(am, st.a[j]); if (!(sp.V[k] - st.W[k] > 1e-9 * sp.V[k])) am = 0; }
        else if (am < 0) { am = -Math.min(-am, st.a[k]); if (j >= 0 && !(sp.V[j] - st.W[j] > 1e-9 * sp.V[j])) am = 0; }
        st.a[k] += am; if (j >= 0) st.a[j] -= am;
      }
      // air left in a space its water has filled (where the water filled a neighbour before the air could pass into it)
      // has nowhere to stand: it bubbles out to the sea, as the lumped pocket's does past its room, and is counted
      for (let q = -1; q < nb.length; q++) {
        const j = q < 0 ? k : nb[q].j;
        if (st.a[j] > 0 && !(sp.V[j] - st.W[j] > 1e-9 * sp.V[j])) { st.bubbled = (st.bubbled || 0) + st.a[j]; st.a[j] = 0; }
      }
      for (const g of nb) refresh(sp, st, side, g.j);
      refresh(sp, st, side, k);                                             // the next spaces see k and its neighbours as they now are
    }
  }
  // failSpaces(sp, st, ops, R, r, K, t, events): a space's boundaries giving way (v1, section 5, in its simplest form). A
  // space whose air lags the sea's pressure at its free surface by more than K.failHead m of sea water [bet: 10 m; v1's
  // heads run from 2 (decks loaded from below) to 30 (watertight bulkheads) and 60 (the shell)] gives way at once, for
  // good: it opens to the sea across her, over K.failShare [bet: 0.5] of its own mean section (its room over its length),
  // as high as the space. A 'report' is logged with the time, the space's node, its free surface's depth and its energy,
  // the lag times its air's volume (J; v1: 500 m3 at 60 m is 0.3 GJ). Applied at the hand-over as well (Z1, 2026-11-21:
  // at the flag the core leaves air at one atmosphere in spaces a hundred metres down). Returns the count failed now.
  function failSpaces(sp, st, ops, R, r, K, t, events) {
    K = K || {};
    const head = K.failHead === undefined ? 10 : K.failHead, share = K.failShare === undefined ? 0.5 : K.failShare;
    const u = [R[6], R[7], R[8]], zr = r[2], RG = RHO_W * G;
    st.failed = st.failed || new Uint8Array(sp.n);
    let n = 0;
    for (let k = 0; k < sp.n; k++) {
      if (st.failed[k]) continue;
      const Va = sp.V[k] - st.W[k];
      if (!(Va > 1e-6 * sp.V[k])) continue;
      water(sp, k, u, zr, st.W[k], st.lev[k], SL); st.lev[k] = SL.level;
      const p = P_ATM * st.a[k] / Va, sea = P_ATM + RG * Math.max(0, -SL.level), lag = (sea - p) / RG;
      if (!(lag > head)) continue;
      ops.push(shellOpening(sp, k, share));
      st.failed[k] = 1; n++;
      if (events) events.push({ t, id: 'report', node: sp.node[k], depth: -SL.level, energy: lag * RG * Va });
    }
    return n;
  }
  // a space's shell given way: open to the sea across her over share of its mean section (its room over its length), as
  // high as the space
  function shellOpening(sp, k, share) {
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (let q = sp.start[k], q1 = q + sp.count[k]; q < q1; q++) {
      if (sp.bx[q] - sp.wx[q] < x0) x0 = sp.bx[q] - sp.wx[q]; if (sp.bx[q] + sp.wx[q] > x1) x1 = sp.bx[q] + sp.wx[q];
      if (sp.bz[q] - sp.wz[q] < z0) z0 = sp.bz[q] - sp.wz[q]; if (sp.bz[q] + sp.wz[q] > z1) z1 = sp.bz[q] + sp.wz[q];
    }
    const A = share * sp.V[k] / Math.max(x1 - x0, 1e-6);
    return { c: -1, kind: 'failed', a: k, b: -1, px: sp.cx[k], py: sp.cy[k], pz: 0.5 * (z0 + z1), nx: 0, ny: sp.cy[k] >= 0 ? 1 : -1, nz: 0, A, L: z1 - z0, Cd: 0.6, open: true };
  }
  // boundariesOf(sp, walls): each space's boundaries with its neighbours in the piece (v1, section 5), from the faces its
  // boxes share with theirs. The core's node is (zone 2 + side) 2 + layer (layer 0 below E deck). walls[z] = { x, top }:
  // the bulkhead between zone z and z + 1, at x, its top deck's height there (her frame; from the core's BULKHEADS and
  // deckZ: the caller's, so that this library needs no core). Kinds:
  //   'bulkhead'  across a bulkhead below its top deck (watertight)
  //   'joiner'    across it above its top deck (non-watertight joiner work)
  //   'deck'      E deck, between a space's two layers; a is the lower
  // Port and starboard of one compartment are open to each other in the core (its cross connections): no boundary. The
  // shell is failSpaces' (to the sea). Each boundary: { kind, a, b, A (m2), px py pz (its centroid), nx ny nz (its normal,
  // a to b), qx qy qz and hx hy hz (the centre and half extents of its bounding box along her axes) }, in a fixed order
  function boundariesOf(sp, walls) {
    const out = [], byNode = new Map();
    for (let k = 0; k < sp.n; k++) byNode.set(sp.node[k], k);
    const add = (kind, a, b, axis, sgn, A, cx, cy, cz, ex, ey, ez) => {
      const key = kind + ':' + a + ':' + b;
      let r = out.find(o => o.key === key);
      if (!r) out.push(r = { key, kind, a, b, A: 0, mx: 0, my: 0, mz: 0, lo: [Infinity, Infinity, Infinity], hi: [-Infinity, -Infinity, -Infinity], axis, sgn });
      r.A += A; r.mx += A * cx; r.my += A * cy; r.mz += A * cz;
      const c = [cx, cy, cz], e = [ex, ey, ez];
      for (let d = 0; d < 3; d++) { if (c[d] - e[d] < r.lo[d]) r.lo[d] = c[d] - e[d]; if (c[d] + e[d] > r.hi[d]) r.hi[d] = c[d] + e[d]; }
    };
    const ov = (c1, w1, c2, w2) => Math.min(c1 + w1, c2 + w2) - Math.max(c1 - w1, c2 - w2);
    for (let k = 0; k < sp.n; k++) {
      const nd = sp.node[k], zone = nd >> 2, side = (nd >> 1) & 1, layer = nd & 1;
      // across the bulkhead aft of this zone, the same side and layer
      const ja = byNode.get(((zone + 1) * 2 + side) * 2 + layer);
      if (ja !== undefined && zone < walls.length) {
        const xw = walls[zone].x, zt = walls[zone].top;
        for (let q = sp.start[k], q1 = q + sp.count[k]; q < q1; q++) {
          if (Math.abs(sp.bx[q] - sp.wx[q] - xw) > 1e-6) continue;
          for (let q2 = sp.start[ja], q3 = q2 + sp.count[ja]; q2 < q3; q2++) {
            if (Math.abs(sp.bx[q2] + sp.wx[q2] - xw) > 1e-6) continue;
            const oy = ov(sp.by[q], sp.wy[q], sp.by[q2], sp.wy[q2]); if (!(oy > 1e-9)) continue;
            const z0 = Math.max(sp.bz[q] - sp.wz[q], sp.bz[q2] - sp.wz[q2]), z1 = Math.min(sp.bz[q] + sp.wz[q], sp.bz[q2] + sp.wz[q2]);
            if (!(z1 - z0 > 1e-9)) continue;
            const yc = 0.5 * (Math.max(sp.by[q] - sp.wy[q], sp.by[q2] - sp.wy[q2]) + Math.min(sp.by[q] + sp.wy[q], sp.by[q2] + sp.wy[q2]));
            // split at the bulkhead's top deck: watertight below it, joiner work above
            const parts = [[z0, Math.min(z1, zt), 'bulkhead'], [Math.max(z0, zt), z1, 'joiner']];
            for (const [p0, p1, kind] of parts) if (p1 - p0 > 1e-9) add(kind, k, ja, 0, -1, oy * (p1 - p0), xw, yc, 0.5 * (p0 + p1), 0, 0.5 * oy, 0.5 * (p1 - p0));
          }
        }
      }
      // E deck, from the lower layer to the upper of the same compartment and side
      const ju = layer === 0 ? byNode.get(nd + 1) : undefined;
      if (ju !== undefined) {
        for (let q = sp.start[k], q1 = q + sp.count[k]; q < q1; q++) {
          const ztop = sp.bz[q] + sp.wz[q];
          for (let q2 = sp.start[ju], q3 = q2 + sp.count[ju]; q2 < q3; q2++) {
            if (Math.abs(sp.bz[q2] - sp.wz[q2] - ztop) > 1e-6) continue;
            const ox = ov(sp.bx[q], sp.wx[q], sp.bx[q2], sp.wx[q2]); if (!(ox > 1e-9)) continue;
            const oy = ov(sp.by[q], sp.wy[q], sp.by[q2], sp.wy[q2]); if (!(oy > 1e-9)) continue;
            const xc = 0.5 * (Math.max(sp.bx[q] - sp.wx[q], sp.bx[q2] - sp.wx[q2]) + Math.min(sp.bx[q] + sp.wx[q], sp.bx[q2] + sp.wx[q2]));
            const yc = 0.5 * (Math.max(sp.by[q] - sp.wy[q], sp.by[q2] - sp.wy[q2]) + Math.min(sp.by[q] + sp.wy[q], sp.by[q2] + sp.wy[q2]));
            add('deck', k, ju, 2, 1, ox * oy, xc, yc, ztop, 0.5 * ox, 0.5 * oy, 0);
          }
        }
      }
    }
    return out.map(r => ({ kind: r.kind, a: r.a, b: r.b, A: r.A, px: r.mx / r.A, py: r.my / r.A, pz: r.mz / r.A,
      nx: r.axis === 0 ? r.sgn : 0, ny: r.axis === 1 ? r.sgn : 0, nz: r.axis === 2 ? r.sgn : 0,
      qx: 0.5 * (r.hi[0] + r.lo[0]), qy: 0.5 * (r.hi[1] + r.lo[1]), qz: 0.5 * (r.hi[2] + r.lo[2]),
      hx: 0.5 * (r.hi[0] - r.lo[0]), hy: 0.5 * (r.hi[1] - r.lo[1]), hz: 0.5 * (r.hi[2] - r.lo[2]) }));
  }
  // failBoundaries(sp, st, ops, bnd, R, r, K, t, events): section 5's fuller form (Z1, M2 4d). Each boundary of
  // boundariesOf holds until the pressure across it (its greatest over the face at her pose: at its ends and where a free
  // surface crosses it) passes its strength as a head of sea water, each a bet in v1's band:
  //   a bulkhead K.headBulkhead [15 m; v1's 8 to 30; the wrong side's 0.6 to 0.8 not taken: which side each bulkhead's
  //   stiffeners face is not read]; joiner work K.headJoiner [2 m; v1's 1 to 3.5]; E deck loaded from below
  //   K.headDeckBelow [5 m; v1's 2 to 10] and from above K.headDeckAbove [15 m, a bulkhead's: v1's table has none].
  // A space gives way once, at its weakest link: of the boundaries pressed into it, and its shell, the one loaded furthest
  // past its strength (v1: the space floods at once through the failed boundary; judged pass by pass, a sub-step's flow
  // through the first opening would leave its load on the rest, and its one implosion would be logged again and again).
  // A boundary between two spaces can still give way from the other side, as that space's failure. The
  // shell's load is failSpaces' (its air's lag behind the sea at its free surface), its strength K.headShell [40 m; v1's
  // 20 to 60]: it opens to the sea as failSpaces' does. A boundary that gives way opens for good between its two spaces
  // over K.failShare of its own area (an upright face as high as it; E deck level), so the space floods from its
  // neighbour, or two air spaces share their air. Each failure is logged as failSpaces' are, once for the space: its
  // depth its free surface's, its energy the pressure across times its air, and the boundary's kind. Returns the count.
  // K.failOnce (Z1, 2026-11-24, on the stern-work team's finding): 'space' (or none), the rule above, to the bit: a space
  // gives way once and then holds at any load, even its shell 46 to 67 m behind the sea; 'boundary', each boundary and
  // each space's shell give way once: a space that has given way can give way again at another link, judged pass by
  // pass on the loads as they then stand (so a first opening that relieves the load leaves the rest standing), each
  // failure logged. st.sfailed: the shells given way, under 'boundary' (K.torn's shells mark it too)
  function failBoundaries(sp, st, ops, bnd, R, r, K, t, events) {
    K = K || {};
    const hb = K.headBulkhead === undefined ? 15 : K.headBulkhead, hj = K.headJoiner === undefined ? 2 : K.headJoiner;
    const hdb = K.headDeckBelow === undefined ? 5 : K.headDeckBelow, hda = K.headDeckAbove === undefined ? 15 : K.headDeckAbove;
    const hs = K.headShell === undefined ? 40 : K.headShell, share = K.failShare === undefined ? 0.5 : K.failShare, RG = RHO_W * G;
    const u = [R[6], R[7], R[8]], zr = r[2];
    st.bfailed = st.bfailed || new Uint8Array(bnd.length);
    st.failed = st.failed || new Uint8Array(sp.n);
    const each = K.failOnce === 'boundary';
    if (each) st.sfailed = st.sfailed || new Uint8Array(sp.n);
    const sd = new Array(sp.n);
    const sideOf = (k) => {
      if (!sd[k]) { water(sp, k, u, zr, st.W[k], st.lev[k], SL); st.lev[k] = SL.level; const Va = sp.V[k] - st.W[k]; sd[k] = { zw: SL.level, pa: airP(sp, st, k, Va, SL.level), Va }; }
      return sd[k];
    };
    // each space's weakest link: the largest load over strength past 1, which boundary (-1 its shell), the load
    const ratio = new Float64Array(sp.n).fill(1), pick = new Int32Array(sp.n).fill(-2), load = new Float64Array(sp.n);
    for (let i = 0; i < bnd.length; i++) {
      if (st.bfailed[i]) continue;
      const B = bnd[i], sa = sideOf(B.a), sb = sideOf(B.b);
      const zc = zr + u[0] * B.qx + u[1] * B.qy + u[2] * B.qz, e = (u[0] < 0 ? -u[0] : u[0]) * B.hx + (u[1] < 0 ? -u[1] : u[1]) * B.hy + (u[2] < 0 ? -u[2] : u[2]) * B.hz;
      let dmax = -Infinity, dmin = Infinity;
      for (const z of [zc - e, zc + e, sa.zw, sb.zw]) {
        if (z < zc - e - 1e-9 || z > zc + e + 1e-9) continue;
        const d = sideP(sb, z) - sideP(sa, z);
        if (d > dmax) dmax = d;
        if (d < dmin) dmin = d;
      }
      // its strength against b pressing into a, and against a pressing into b (E deck: a is the lower space)
      const vsB = B.kind === 'deck' ? hda : (B.kind === 'joiner' ? hj : hb), vsA = B.kind === 'deck' ? hdb : vsB;
      const ra = dmax / (vsB * RG), rb = -dmin / (vsA * RG);
      if (ra > ratio[B.a] && (each || !st.failed[B.a])) { ratio[B.a] = ra; pick[B.a] = i; load[B.a] = dmax; }
      if (rb > ratio[B.b] && (each || !st.failed[B.b])) { ratio[B.b] = rb; pick[B.b] = i; load[B.b] = -dmin; }
    }
    for (let k = 0; k < sp.n; k++) {
      if (each ? st.sfailed[k] : st.failed[k]) continue;
      const Va = sp.V[k] - st.W[k];
      if (!(Va > 1e-6 * sp.V[k])) continue;
      const s = sideOf(k), lag = (P_ATM + RG * Math.max(0, -s.zw) - P_ATM * st.a[k] / Va) / RG;
      if (lag / hs > ratio[k]) { ratio[k] = lag / hs; pick[k] = -1; load[k] = lag * RG; }
    }
    let n = 0;
    for (let k = 0; k < sp.n; k++) {
      const i = pick[k];
      if (i === -2) continue;
      let kind;
      if (i === -1) { ops.push(shellOpening(sp, k, share)); kind = 'shell'; if (each) st.sfailed[k] = 1; }
      else {
        if (st.bfailed[i]) continue;                                  // its other side took it first, this pass
        const B = bnd[i], A = share * B.A, L = B.kind === 'deck' ? Math.sqrt(A) : 2 * B.hz;
        ops.push({ c: -1, kind: 'failed ' + B.kind, a: B.a, b: B.b, px: B.px, py: B.py, pz: B.pz, nx: B.nx, ny: B.ny, nz: B.nz, A, L, Cd: 0.6, open: true });
        st.bfailed[i] = 1; kind = B.kind;
      }
      st.failed[k] = 1;                                               // it has given way: once, as the first form's
      n++;
      const s = sd[k];
      if (events) events.push({ t, id: 'report', node: sp.node[k], depth: -s.zw, energy: load[k] * (s.Va > 0 ? s.Va : 0), boundary: kind });
    }
    return n;
  }
  function refresh(sp, st, side, k) {
    const Va = sp.V[k] - st.W[k], s = side[k];
    s.Va = Va; s.pa = airP(sp, st, k, Va, s.zw);
  }
  // a space's pressure over its water: its air's (isothermal, a at one atmosphere in Va), never below water's vapour
  // pressure (a space with room and no air is a void the water fills); with no room above its water, the sea's at its
  // free surface (Z1, 4c: it is full because the sea's head filled it. The stand-in of one atmosphere made a full space
  // at depth a sink its neighbours' implicit steps counted on, so their air was squeezed past the sea's by the share
  // that could not go in, to 400 to 1,800 bar where the sea gave 150 to 220, and stranded in no room; and a void's 0 Pa
  // gave the law no density, so NaN)
  const P_VAP = 705;   // Pa, water's vapour pressure at 2 deg C [textbook]
  function airP(sp, st, k, Va, zw) {
    if (!(Va > 1e-9 * sp.V[k])) return P_ATM + RHO_W * G * Math.max(0, -zw);
    const p = P_ATM * st.a[k] / Va;
    return p > P_VAP ? p : P_VAP;
  }

  return {
    boxMoments, spacesOf, below, bracket, water, stateOf, openingsOf, stepPiece, heldBySea, doorsOf, doorsStep, weatherOf, weatherStep, failSpaces, shellOpening, boundariesOf, failBoundaries,
    // the exchange through one opening, and one space's air taken implicitly (e84's, ported: see above)
    flow: { G, RHO_W, P_ATM, RHO_A0, SIGMA, CHOKE, DEFAULTS, rhoAir, sideP, meanSqrt, lawP, floodingPair, intercepts, exchange, sideStiffness, limitOneWay, stepSpace },
  };
});
