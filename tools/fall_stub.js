// A TEST FEED for the page's fall (Z2 of docs/BRAINSTORM_the_descent_to_the_bed_v2_2026-11-19.md). It is not physics and is
// never shipped: tools/build_site.js bundles core/, core/readers/, site/ and site/parts/, and this file is in none of them.
// It fills sim.fall to the plan's contract (its section 5.1) with a drawn fall, so that the page can be built and tested
// before the fall's engine (Z1, core/readers/fall.js) is joined to it (Z3). What it draws, every number stated here:
//   - begin(sim), at the flag: she is cut in two at x XCUT (the bow forward of it, the stern abaft it), each piece at the
//     core's own pose at that moment (C.frameOf: r is its translation, q its rotation); the sea DEPTH deep at the point
//     under the break, sloping SLOPE degrees (deeper to port); its column's density, temperature and pressure every DZ m.
//   - step(sim): each piece turns flat (upright, on an even keel, heading as she was) within TURN s, falls at up to V m/s
//     (reached over RAMP s) until its keel is on the bed, and drifts so that it lands DRIFT from the point under the break:
//     the bow 770 m ahead, the stern 150 m out at 51 degrees to port of her heading (on a heading of north, the survey's
//     309 degrees: docs/research/RESEARCH_the_fall_and_the_wreck_v1, 10a).
//   - events: under (its highest point under the sea), report (the stern's: its highest point REPORTS m down, Pitman's
//     four), strike (its keel on the bed; the speed, and half its moving mass times the speed squared), rest (REST s after
//     the strike). done when every piece is at rest.
// Frames, as the page reads them (site/app.js, "the fall"): the world is the frame C.frameOf(sim) poses her in at the flag
// (x along her heading, y to port, z up, the sea at z = 0); a point p of a piece's own frame is at r + R(q) p with
// q = [w, x, y, z]; v and om are in the piece's own axes; depth is its lowest point's, metres under the sea.
// The sea's tables: depth (at the frame's origin), dz, rho[], T[], p[] at z = i dz below the surface, slope [d depth / dX,
// d depth / dY], relief [] (Fathom's form: depth += a sin(kx X + ky Y + ph)).
//   in a page: evaluate this file's text after the page has loaded (window.TitanicFall)
//   in Node:   const F = require('./fall_stub.js'); F.begin(sim); while (!sim.fall.done) F.step(sim);
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../core/core.js'));
  else root.TitanicFall = factory(root.TitanicCore);
})(typeof self !== 'undefined' ? self : this, function (C) {
  'use strict';
  const D2R = Math.PI / 180, G = C.G, DT = C.DEFAULT_PARAMS.dt;
  const STUB = {
    XCUT: -23, V: 9.7, RAMP: 10, TURN: 90, REST: 4, UNDER: 10,      // m; m/s; s; s; s; s in the state 'under'
    DEPTH: 3790, SLOPE: 0.5, DZ: 5,                                  // m; degrees, deeper to port; m between the column's nodes
    DRIFT: { bow: [770, 0], stern: [150 * Math.cos(51 * D2R), 150 * Math.sin(51 * D2R)] },   // m ahead, m to port
    REPORTS: [30, 60, 120, 240], REPORT_J: [0.08e9, 0.15e9, 0.3e9, 0.6e9],
    // her moving mass, t: herself with the water in her, and the water she drags (the plan's 4.1, from its e30 and e33)
    MASS: { bow: 94181 + 72333, stern: 65664 + 54227 },
    GRAV: 9.80665, P0: 101325,
  };
  const X_AFT = G.xAP - G.sternOverhang, X_FWD = C.xFwd(C.zTopAt(G.xFP));

  // ---- the sea: R6's density (1,026.3 kg/m3 at the surface and 4.97e-3 more a metre); temperature [the stub's bets: the
  // record's -2 deg C at the surface, 3.5 between 200 and 2,000 m, 2 at the bed]; pressure integrated from the density
  function column() {
    const n = Math.floor((STUB.DEPTH + 200) / STUB.DZ) + 1, rho = [], T = [], p = [];
    const nodes = [[0, -2.0], [50, 0.0], [200, 3.5], [2000, 3.5], [STUB.DEPTH, 2.0], [STUB.DEPTH + 200, 2.0]];
    const Tat = (z) => { for (let i = 1; i < nodes.length; i++) if (z <= nodes[i][0]) return nodes[i - 1][1] + (nodes[i][1] - nodes[i - 1][1]) * (z - nodes[i - 1][0]) / (nodes[i][0] - nodes[i - 1][0]); return nodes[nodes.length - 1][1]; };
    for (let i = 0; i < n; i++) { const z = i * STUB.DZ; rho.push(1026.3 + 4.97e-3 * z); T.push(Tat(z)); p.push(STUB.P0 + STUB.GRAV * (1026.3 * z + 0.5 * 4.97e-3 * z * z)); }
    return { depth: STUB.DEPTH, dz: STUB.DZ, rho, T, p, slope: [0, Math.tan(STUB.SLOPE * D2R)], relief: [] };
  }
  function bedDepth(sea, X, Y) {
    let d = sea.depth + (sea.slope ? sea.slope[0] * X + sea.slope[1] * Y : 0);
    for (const w of sea.relief || []) d += w.a * Math.sin(w.kx * X + w.ky * Y + w.ph);
    return d;
  }

  // ---- rotations: quaternions [w, x, y, z]
  function quatOf(F) {                            // the core's rotation (C.frameOf: R00 .. R22) as a quaternion
    const m00 = F.R00, m01 = F.R01, m02 = F.R02, m10 = F.R10, m11 = F.R11, m12 = F.R12, m20 = F.R20, m21 = F.R21, m22 = F.R22, tr = m00 + m11 + m22;
    let w, x, y, z;
    if (tr > 0) { const s = 0.5 / Math.sqrt(tr + 1); w = 0.25 / s; x = (m21 - m12) * s; y = (m02 - m20) * s; z = (m10 - m01) * s; }
    else if (m00 > m11 && m00 > m22) { const s = 2 * Math.sqrt(1 + m00 - m11 - m22); w = (m21 - m12) / s; x = 0.25 * s; y = (m01 + m10) / s; z = (m02 + m20) / s; }
    else if (m11 > m22) { const s = 2 * Math.sqrt(1 + m11 - m00 - m22); w = (m02 - m20) / s; x = (m01 + m10) / s; y = 0.25 * s; z = (m12 + m21) / s; }
    else { const s = 2 * Math.sqrt(1 + m22 - m00 - m11); w = (m10 - m01) / s; x = (m02 + m20) / s; y = (m12 + m21) / s; z = 0.25 * s; }
    const n = Math.sqrt(w * w + x * x + y * y + z * z);
    return [w / n, x / n, y / n, z / n];
  }
  function rot(q, v) {                            // R(q) v
    const [w, x, y, z] = q, [a, b, c] = v;
    return [(1 - 2 * (y * y + z * z)) * a + 2 * (x * y - w * z) * b + 2 * (x * z + w * y) * c,
      2 * (x * y + w * z) * a + (1 - 2 * (x * x + z * z)) * b + 2 * (y * z - w * x) * c,
      2 * (x * z - w * y) * a + 2 * (y * z + w * x) * b + (1 - 2 * (x * x + y * y)) * c];
  }
  const conj = (q) => [q[0], -q[1], -q[2], -q[3]];
  const mul = (a, b) => [a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3], a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2],
    a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1], a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0]];
  function slerp(a, b, t) {
    let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3], s = 1;
    if (d < 0) { d = -d; s = -1; }
    if (d > 0.9995) { const q = a.map((v, i) => v + (s * b[i] - v) * t), n = Math.hypot(...q); return q.map(v => v / n); }
    const th = Math.acos(d), k0 = Math.sin((1 - t) * th) / Math.sin(th), k1 = s * Math.sin(t * th) / Math.sin(th);
    return a.map((v, i) => k0 * v + k1 * b[i]);
  }
  // a piece's hull as points (its ends and every 10 m between, keel and deck, both sides): its lowest and highest
  function samples(x0, x1) {
    const pts = [];
    for (let x = x0; ; x = Math.min(x1, x + 10)) {
      const zt = C.zTopAt(x); let zb = 0;
      while (zb < zt && C.halfBreadth(x, zb) < 0.02) zb += 0.05;
      const hb = C.halfBreadth(x, Math.min(zt - 0.001, zb + 0.5)), ht = C.halfBreadth(x, zt - 0.001);
      pts.push([x, 0, zb], [x, hb, zb + 0.5], [x, -hb, zb + 0.5], [x, ht, zt], [x, -ht, zt]);
      if (x >= x1) break;
    }
    return pts;
  }
  function extremes(P, pts) {
    let lo = Infinity, hi = -Infinity;
    for (const s of pts) { const z = rot(P.q, s)[2] + P.r[2]; if (z < lo) lo = z; if (z > hi) hi = z; }
    return [lo, hi];
  }
  function tell(f, id, P, o) { f.events.push({ t: f.t, id, piece: P.id, depth: o.depth !== undefined ? o.depth : P.depth, energy: o.energy || 0, speed: o.speed !== undefined ? o.speed : P.speed }); }

  // its depth, its state, and the events of its highest point: under the sea, and (the stern's) its reports
  function look(f, i) {
    const P = f.pieces[i], Q = f.stub.priv[i], [lo, hi] = extremes(P, Q.pts);
    P.depth = -lo;
    if (Q.tUnder < 0 && hi < 0) { Q.tUnder = f.t; P.state = 'under'; tell(f, 'under', P, {}); }
    if (P.state === 'under' && f.t - Q.tUnder >= STUB.UNDER - 1e-9) P.state = 'falling';
    if (P.id === 'stern' && Q.tUnder >= 0) while (Q.reported < STUB.REPORTS.length && -hi >= STUB.REPORTS[Q.reported]) {
      tell(f, 'report', P, { depth: STUB.REPORTS[Q.reported], energy: STUB.REPORT_J[Q.reported] }); Q.reported++;
    }
  }

  function begin(sim) {
    if (sim.fall) return sim.fall;
    const F = C.frameOf(sim), q0 = quatOf(F), r0 = [F.tx, F.ty, F.tz], m = sim.mo, sea = column();
    const cut = rot(q0, [STUB.XCUT, 0, 10]), B = [cut[0] + r0[0], cut[1] + r0[1]];   // the point under the break
    const pieces = [], priv = [];
    for (const d of [{ id: 'bow', x0: STUB.XCUT, x1: X_FWD }, { id: 'stern', x0: X_AFT, x1: STUB.XCUT }]) {
      const xm = (d.x0 + d.x1) / 2, mid = rot(q0, [xm, 0, 0]), H0 = [mid[0] + r0[0], mid[1] + r0[1]], Zm0 = mid[2] + r0[2];
      const Hf = [B[0] + STUB.DRIFT[d.id][0], B[1] + STUB.DRIFT[d.id][1]];
      pieces.push({ id: d.id, x0: d.x0, x1: d.x1, r: r0.slice(), q: q0.slice(), v: [0, 0, 0], om: [0, 0, 0], state: 'afloat', depth: 0, speed: 0, air: 0, bury: [] });
      // the middle of its keel falls from where it was to the bed under where it lands, flat
      priv.push({ q0: q0.slice(), xm, H0, Hf, Zm0, total: Zm0 + bedDepth(sea, Hf[0], Hf[1]), s: 0, pts: samples(d.x0, d.x1), tUnder: -1, tStrike: -1, reported: 0 });
    }
    // v2 (the coordinator, 2026-11-20): breakAt, the point on the sea's surface under the break at the flag, in the pieces' frame
    sim.fall = { v: 2, rule: 'flag', t0: sim.t, k: 0, t: sim.t, done: false, breakAt: B.slice(), sea, at: m ? { X: m.X, Y: m.Y, psi: m.psi } : { X: 0, Y: 0, psi: 0 },
      pieces, debris: [], events: [], stub: { B, priv } };
    for (let i = 0; i < pieces.length; i++) look(sim.fall, i);
    return sim.fall;
  }

  function step(sim) {
    const f = sim.fall;
    if (!f || f.done) return;
    f.k++; f.t = f.t0 + f.k * DT;
    const te = f.k * DT;
    for (let i = 0; i < f.pieces.length; i++) {
      const P = f.pieces[i], Q = f.stub.priv[i];
      if (P.state === 'at rest') continue;
      if (P.state === 'striking') {
        if (f.t - Q.tStrike >= STUB.REST - 1e-9) { P.state = 'at rest'; P.speed = 0; P.v = [0, 0, 0]; P.om = [0, 0, 0]; tell(f, 'rest', P, { speed: 0 }); }
        continue;
      }
      const q1 = P.q;
      const u = Math.min(1, te / STUB.TURN);
      P.q = slerp(Q.q0, [1, 0, 0, 0], u * u * (3 - 2 * u));
      const vz = STUB.V * Math.min(1, te / STUB.RAMP);
      Q.s = Math.min(Q.total, Q.s + vz * DT);
      const pr = Q.s / Q.total, H = [Q.H0[0] + (Q.Hf[0] - Q.H0[0]) * pr, Q.H0[1] + (Q.Hf[1] - Q.H0[1]) * pr], Zm = Q.Zm0 - Q.s, mid = rot(P.q, [Q.xm, 0, 0]);
      P.r = [H[0] - mid[0], H[1] - mid[1], Zm - mid[2]];
      // the middle of its keel: its velocity (the world's, then in its own axes), its speed; its rates from the turn
      const k = vz / Q.total, vw = [(Q.Hf[0] - Q.H0[0]) * k, (Q.Hf[1] - Q.H0[1]) * k, -vz];
      P.speed = Math.hypot(vw[0], vw[1], vw[2]);
      P.v = rot(conj(P.q), vw);
      const dq = mul(conj(q1), P.q), sg = dq[0] < 0 ? -1 : 1, sn = Math.hypot(dq[1], dq[2], dq[3]), ang = 2 * Math.atan2(sn, sg * dq[0]);
      P.om = sn > 1e-12 ? [1, 2, 3].map(j => sg * dq[j] / sn * ang / DT) : [0, 0, 0];
      look(f, i);
      if (Q.s >= Q.total - 1e-9) {
        P.state = 'striking'; Q.tStrike = f.t;
        tell(f, 'strike', P, { speed: P.speed, energy: 0.5 * STUB.MASS[P.id] * 1000 * P.speed * P.speed });
      }
    }
    f.done = f.pieces.every(P => P.state === 'at rest');
  }

  return { begin, step, STUB, bedDepth, rot, quatOf };
});
