/*
 * What the viewer draws of the ship under way, as plain numbers (no three.js): the stern gear's shapes, the wake's
 * construction, the navigation lights' arcs, the engines' kinematics. site/app.js turns them into meshes;
 * tools/visuals_tests.js checks them in Node. Sources: docs/research/RESEARCH_stern_gear_wake_lights_v1 and v1_1
 * (R1, measured from The Shipbuilder's figures of 1911), docs/BRAINSTORM_screws_rudder_wake_lights_v1.
 * Tags as in the notes: [read], [measured], [derived], [bet], and [appearance] for what is drawn but not modelled.
 *
 * Frames. SHIP: x forward from amidships, y to PORT, z up from the keel (the core's). Geometry for three.js is in
 * THREE-LOCAL axes: x forward, y up, z to STARBOARD (app.js's SX(x, y, z) = (x, z, -y)). EARTH: X north, Y east,
 * heading psi clockwise from north (core/motion.js).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../core/core.js'), require('../core/systems.js'), require('./topsides.js'));
  else root.TitanicVisuals = factory(root.TitanicCore, root.TitanicSystems, root.TitanicTopsides);
})(typeof self !== 'undefined' ? self : this, function (C, Sys, TS) {
  'use strict';
  const FT = C.FT, DEG = Math.PI / 180, TAU = 2 * Math.PI, G = C.GRAV;

  // =================================================================== the stern gear
  // The screws' stations and the centre screw's height are the plant's (core/systems.js PLANT.screws: one table for its
  // immersion and for the drawing), read from Engineering's side plan of 1911 (R2: docs/research/experiments/e20).
  const SCREWS = Sys.PLANT.screws;
  const STERN = {
    // wing screws: Harland & Wolff's notebook via Chirnside [read]; 6.0 m off the centre line is core/motion.js's
    // figure, which R1 found consistent with The Shipbuilder's two sections (5.14 m in the engine room, 5.38 m in
    // the turbine room, the shafts level at 3.80 m) [measured]; outward turning (Halpern) [read]; 9.72 m ahead of the
    // rudder's stock (the side plan; e20 reads their hubs 3.63 m above the keel there, within its reading of R1's 3.80) [measured]
    wing: { D: 23.5 * FT, P: 35 * FT, Z: 3, area: 160 * FT * FT, hub: 0.22, y: 6.0, z: SCREWS[0].z, x: SCREWS[0].x, xEngine: -37.6, yEngine: 5.14 },
    // centre screw: 17 ft, three blades, solid bronze [read]; 3.03 m ahead of the rudder's stock and 3.75 m above the keel,
    // in the aperture (the side plan) [measured]; its shaft falls to it from the turbine's axis, 4.82 m above the keel
    // (R1) [measured], drawn straight [appearance]; right-handed [bet: its hand is undocumented]
    centre: { D: 17 * FT, P: 14.5 * FT, Z: 3, area: 120 * FT * FT, hub: 0.18, y: 0, z: SCREWS[1].z, x: SCREWS[1].x, xTurbine: -56.8, zTurbine: Sys.PLANT.turbineAxis },
    shaftR: { wing: 28.5 / 2 * 0.0254, centre: 22.5 / 2 * 0.0254 },   // tail shafts [read]
    // the rudder: stock on the after perpendicular; heel 0.3 m above the keel [bet: the side plan reads 0.65 m]; casting 78 ft 8 in [read]
    rudder: { x: C.G.xAP, heel: 0.3, stockR: 23.5 / 2 * 0.0254, top: (78 + 8 / 12) * FT, area: 401.63 * FT * FT, draftAft: 33.75 * FT },
    // the aperture the centre screw turns in, the side plan's (cut out of the drawn shell only; the physics hull is untouched) [measured]
    aperture: { x0: C.G.xAP + 0.77, x1: C.G.xAP + 4.34, z0: 0.94, z1: 7.24 },
  };

  // The trailing edge of the rudder, traced from the photograph of the stern castings (The Shipbuilder 1911, Fig. 17):
  // [height above the heel, chord from the stock's axis], m [measured, R1]. Scaled below so that the area under the
  // night's draft aft is the plans' 401.63 sq ft (the trace alone gives 2.8 % less).
  const RUDDER_TRACE = Sys.RUDDER_TRACE;          // one table for the drawing and for the plant's rudder immersion (core/systems.js)

  function lerpTable(T, h) {
    if (h <= T[0][0]) return T[0][1];
    for (let i = 1; i < T.length; i++) if (h <= T[i][0]) { const a = T[i - 1], b = T[i]; return a[1] + (b[1] - a[1]) * (h - a[0]) / (b[0] - a[0]); }
    return T[T.length - 1][1];
  }
  function areaBelow(T, hMax) {                    // trapezoid area of a [h, chord] table from h = 0 to hMax
    let A = 0;
    for (let i = 1; i < T.length; i++) {
      const h0 = T[i - 1][0], h1 = Math.min(T[i][0], hMax); if (h1 <= h0) break;
      A += 0.5 * (T[i - 1][1] + lerpTable(T, h1)) * (h1 - h0);
    }
    return A;
  }
  const R_ = STERN.rudder;
  const RUDDER_SCALE = R_.area / areaBelow(RUDDER_TRACE, R_.draftAft - R_.heel);
  const RUDDER = RUDDER_TRACE.map(([h, c]) => [h, c * RUDDER_SCALE]);
  function rudderImmersedArea() { return areaBelow(RUDDER, R_.draftAft - R_.heel); }

  // how far a wing screw's disc at station x stays outside the model's hull, m (negative: it would cut the drawn shell).
  // Until R2 this chose the station (0.15 of a diameter clear [bet]); now it checks the measured one.
  function wingClearanceAt(x) {
    const s = STERN.wing, R = s.D / 2;
    let m = 1e9;
    for (let k = 0; k < 144; k++) {
      const a = k / 144 * TAU, y = s.y + R * Math.sin(a), z = s.z + R * Math.cos(a);
      if (z < 0.02) continue;
      const c = y - C.halfBreadth(x, z); if (c < m) m = c;
    }
    return m;
  }

  // ---- screws
  // Blade outline: the Wageningen B-series' chord shape (from memory, [appearance]); the chord scaled so that the blades'
  // area is the builder's. Section: flat face (the pitch helicoid, facing aft), parabolic back, thickness 5 % of the
  // diameter at the root and 0.4 % at the tip [appearance]. No skew, no rake [bet].
  const CHORD_B = [[0.2, 1.662], [0.3, 1.882], [0.4, 2.050], [0.5, 2.152], [0.6, 2.187], [0.7, 2.144], [0.8, 1.970], [0.9, 1.582]];
  function chordShape(x) {
    if (x >= 1) return 0;
    if (x > 0.9) return 1.582 * Math.sqrt((1 - x) / 0.1);
    return lerpTable(CHORD_B, x);
  }
  function simpson(f, a, b, n) { const h = (b - a) / n; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2); return s * h / 3; }
  function pitchAngle(spec, xr) { return Math.atan2(spec.P, TAU * xr * spec.D / 2) / DEG; }

  // A right-handed screw in its own frame: axis +x (forward), turning positive about +x (clockwise seen from aft)
  // when going ahead. A left-handed screw is its mirror image in z.
  function propeller(spec, opts) {
    opts = opts || {};
    const R = spec.D / 2, Z = spec.Z, xh = spec.hub, NC = opts.nc || 14, NRs = opts.nr || 16;
    const kc = spec.area / (Z * R * simpson(chordShape, xh, 1, 4000));
    let xs = []; for (let j = 0; j <= NRs; j++) xs.push(xh + (1 - xh) * Math.sin(Math.PI / 2 * j / NRs));
    for (const x of [0.3, 0.5, 0.7, 0.9]) if (x > xh) xs.push(x);
    xs.sort((a, b) => a - b); xs = xs.filter((x, i) => i === 0 || x - xs[i - 1] > 1e-6);
    const NS = NC + 1, NR = xs.length, tRoot = 0.05 * spec.D, tTip = 0.004 * spec.D;
    const pos = [], idx = [];
    for (let b = 0; b < Z; b++) {
      const th0 = b * TAU / Z, base = pos.length / 3;
      for (let side = 0; side < 2; side++) {     // 0 the face (the helicoid), 1 the back
        for (const x of xs) {
          const r = x * R, c = kc * chordShape(x), phi = Math.atan2(spec.P, TAU * r), cp = Math.cos(phi), sp = Math.sin(phi);
          const tm = tRoot + (tTip - tRoot) * (x - xh) / (1 - xh);
          for (let i = 0; i < NS; i++) {
            const s = -0.5 * Math.cos(Math.PI * i / NC), a = s * c, t = side ? tm * (1 - 4 * s * s) : 0;   // s = -1/2 trailing, +1/2 leading
            const th = th0 + (a * cp - t * sp) / r;
            pos.push(a * sp + t * cp, r * Math.cos(th), r * Math.sin(th));
          }
        }
      }
      for (let side = 0; side < 2; side++) for (let j = 0; j < NR - 1; j++) for (let i = 0; i < NC; i++) {
        const a = base + side * NR * NS + j * NS + i, bb = a + 1, c = a + NS, d = c + 1;
        if (side === 0) idx.push(a, c, bb, bb, c, d); else idx.push(a, bb, c, bb, d, c);
      }
    }
    const rootAxial = kc * chordShape(xh) * Math.sin(Math.atan2(spec.P, TAU * xh * R));
    return { pos: Float32Array.from(pos), idx: Uint32Array.from(idx), xs, NS, NR, Z, R, kc, rootAxial, rHub: xh * R };
  }
  // the face's area per blade (sum of its triangles), for the test against the builder's figure
  function bladeFaceArea(g) {
    const p = g.pos, per = 2 * g.NR * g.NS; let A = 0;
    for (let b = 0; b < g.Z; b++) for (let j = 0; j < g.NR - 1; j++) for (let i = 0; i < g.NS - 1; i++) {
      const v = (k) => b * per + j * g.NS + i + k;
      for (const [a, bb, c] of [[v(0), v(g.NS), v(1)], [v(1), v(g.NS), v(g.NS + 1)]]) {
        const ux = p[bb * 3] - p[a * 3], uy = p[bb * 3 + 1] - p[a * 3 + 1], uz = p[bb * 3 + 2] - p[a * 3 + 2];
        const wx = p[c * 3] - p[a * 3], wy = p[c * 3 + 1] - p[a * 3 + 1], wz = p[c * 3 + 2] - p[a * 3 + 2];
        const cx = uy * wz - uz * wy, cy = uz * wx - ux * wz, cz = ux * wy - uy * wx;
        A += 0.5 * Math.sqrt(cx * cx + cy * cy + cz * cz);
      }
    }
    return A / g.Z;
  }
  // the blade's pitch angle at radius ratio x, measured on the mesh's face from its trailing to its leading edge
  function meshPitchAngle(g, x) {
    const j = g.xs.findIndex(v => Math.abs(v - x) < 1e-9); if (j < 0) return NaN;
    const p = g.pos, a = j * g.NS, b = a + g.NS - 1;
    const th = (k) => Math.atan2(p[k * 3 + 2], p[k * 3 + 1]), r = x * g.R;
    return Math.atan2(p[b * 3] - p[a * 3], r * (th(b) - th(a))) / DEG;
  }
  // the boss: a lathe profile [radius, axial position], forward to aft [appearance]
  function hubProfile(g) {
    const r = g.rHub * 1.04, L = g.rootAxial + 0.3, pts = [[0.001, 0.5 * L + 0.55], [0.7 * r, 0.5 * L + 0.5], [0.95 * r, 0.5 * L + 0.2], [r, 0.5 * L]];
    for (let k = 0; k <= 8; k++) { const a = k / 8 * Math.PI / 2; pts.push([r * Math.cos(a), -0.5 * L - 0.95 * r * Math.sin(a)]); }
    pts[pts.length - 1][0] = 0.001;
    return pts;
  }

  // ---- rudder: a lofted blade, stock at x = 0, blade aft along -x, height y up, thickness z (THREE-LOCAL, origin at
  // the stock's axis on the heel). Main piece 0.30 m in radius round the stock; the blade 0.60 m thick at the stock,
  // 0.08 m at the trailing edge [appearance].
  function rudderGeometry() {
    const pos = [], idx = [], NX = 9, NN = 7, rows = [];
    const half = (xi, c) => 0.04 + 0.26 * Math.pow(Math.max(0, 1 - xi / Math.max(c, 1e-3)), 1.6);
    for (const [h, c] of RUDDER) {
      const ring = [];
      for (let i = 0; i <= NX; i++) { const xi = c * (1 - i / NX); ring.push([-xi, half(xi, c)]); }                  // starboard, trailing edge to stock
      for (let k = 1; k < NN; k++) { const a = Math.PI / 2 - Math.PI * k / NN; ring.push([0.30 * Math.cos(a), 0.30 * Math.sin(a)]); }   // the nose
      for (let i = 0; i <= NX; i++) { const xi = c * (i / NX); ring.push([-xi, -half(xi, c)]); }                        // port, stock to trailing edge
      rows.push(pos.length / 3);
      for (const [x, z] of ring) pos.push(x, h, z);
    }
    const M = 2 * (NX + 1) + NN - 1;
    for (let k = 0; k < RUDDER.length - 1; k++) for (let i = 0; i < M; i++) {
      const a = rows[k] + i, b = rows[k] + (i + 1) % M, c = rows[k + 1] + i, d = rows[k + 1] + (i + 1) % M;
      idx.push(a, b, c, b, d, c);
    }
    const capB = pos.length / 3; pos.push(-0.4, 0, 0); for (let i = 0; i < M; i++) idx.push(capB, rows[0] + (i + 1) % M, rows[0] + i);
    return { pos: Float32Array.from(pos), idx: Uint32Array.from(idx), top: RUDDER[RUDDER.length - 1][0] };
  }

  // ---- bossing: the plating faired round a wing shaft from where it leaves the hull to the screw (The Shipbuilder:
  // "boss arm castings, around which the shell plating is secured") [read for the arrangement; shape: appearance].
  // sgn +1 port, -1 starboard. Returned in THREE-LOCAL coordinates.
  function wingShaftY(x) { const w = STERN.wing; return w.yEngine + (x - w.xEngine) * (w.y - w.yEngine) / (w.x - w.xEngine); }
  function bossing(sgn, hubFwd) {
    const w = STERN.wing, zs = w.z, xEnd = w.x + hubFwd + 0.15;
    let xStart = xEnd; while (xStart < -60 && wingShaftY(xStart) - C.halfBreadth(xStart, zs) > 0.25) xStart += 0.25;
    const N = 28, NB = 24, pos = [], idx = [], rings = [];
    for (let k = 0; k <= N; k++) {
      const x = xEnd + (xStart - xEnd) * k / N, yS = wingShaftY(x), yH = Math.max(0, C.halfBreadth(x, zs) - 0.35);
      const rb = 0.95 + 0.3 * k / N;
      rings.push(pos.length / 3);
      for (let i = 0; i < NB; i++) {
        const b = i / NB * TAU, cb = Math.cos(b), sb = Math.sin(b);
        const yo = cb >= 0 ? yS + rb * cb : yS + (yS - yH) * cb, z = zs + rb * sb * (cb >= 0 ? 1 : 0.8 + 0.2 * (1 + cb));
        pos.push(x, z, -sgn * yo);
      }
    }
    for (let k = 0; k < N; k++) for (let i = 0; i < NB; i++) {
      const a = rings[k] + i, b = rings[k] + (i + 1) % NB, c = rings[k + 1] + i, d = rings[k + 1] + (i + 1) % NB;
      idx.push(a, c, b, b, c, d);
    }
    const tip = pos.length / 3; pos.push(xEnd - 0.5, zs, -sgn * wingShaftY(xEnd));
    for (let i = 0; i < NB; i++) idx.push(tip, rings[0] + i, rings[0] + (i + 1) % NB);
    return { pos: Float32Array.from(pos), idx: Uint32Array.from(idx), xStart, xEnd };
  }

  // =================================================================== the wake
  // Samples of the ship's state, laid every WAKE.every seconds of ship's time while she moves. Everything drawn of the
  // wake is computed from these: nothing is drawn in her own frame.
  const WAKE = {
    every: 0.5,               // s between samples
    keep: 4000,               // samples kept (33 min)
    xStern: -125.0,           // the turbulent wake starts at the screws [appearance]
    xBow: C.xFwd(8) - 2,      // Kelvin's waves are made at the bow [bet: the bow system; the stern's adds to it]
    halfWidth: 10.5,          // at the stern: the wing screws' races span 2 x (6.0 + 3.6) m [derived]
    widthExp: 0.2,            // the white wake widens as (1 + s/L)^0.2 with distance astern (Milgram et al. as cited) [read, search summary]
    life: 75,                 // s: the foam fades to 1/e [appearance]
    slickLife: 600,           // s: the smooth slick left in it [appearance]
    tauWaves: 150,            // s: crests fade to 1/e [appearance]
    crests: 14,               // transverse crests drawn
    thetaMax: 72,             // deg: divergent crests drawn out to this wave direction (they bunch at the bow beyond)
  };
  // ring buffer of samples: plain arrays (cheap to copy into a worker or a test)
  function wakeBuffer() { return { n: 0, t: [], X: [], Y: [], psi: [], u: [], v: [], r: [], T: [], seg: [], segId: 0, lastT: -1e9 }; }
  function wakeTake(w, sim, force) {              // called after each step; returns true when a sample was laid
    const m = sim.mo; if (!m) return false;
    if (!force && sim.t - w.lastT < WAKE.every - 1e-9) return false;
    if (m.u * m.u + m.v * m.v < 0.0025) { w.lastT = sim.t; w.segId++; return false; }   // stopped: lay nothing, start a new segment
    if (w.n >= WAKE.keep) for (const k of ['t', 'X', 'Y', 'psi', 'u', 'v', 'r', 'T', 'seg']) w[k].splice(0, WAKE.keep / 2);
    w.t.push(sim.t); w.X.push(m.X); w.Y.push(m.Y); w.psi.push(m.psi); w.u.push(m.u); w.v.push(m.v); w.r.push(m.r);
    w.T.push(m.TP + m.TS + m.TC); w.seg.push(w.segId);
    w.n = w.t.length; w.lastT = sim.t;
    return true;
  }
  function pointAt(w, i, x) { const c = Math.cos(w.psi[i]), s = Math.sin(w.psi[i]); return [w.X[i] + x * c, w.Y[i] + x * s]; }
  function velAt(w, i, x) {                       // earth velocity of the ship's point x on the centre line
    const c = Math.cos(w.psi[i]), s = Math.sin(w.psi[i]), vl = w.v[i] + w.r[i] * x;
    return [w.u[i] * c - vl * s, w.u[i] * s + vl * c];
  }
  function interp(w, t) {                         // fractional index of time t, or -1 outside the record
    if (w.n < 2 || t < w.t[0] || t > w.t[w.n - 1]) return -1;
    let lo = 0, hi = w.n - 1;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (w.t[mid] <= t) lo = mid; else hi = mid; }
    if (w.seg[lo] !== w.seg[hi]) return -1;
    return lo + (t - w.t[lo]) / (w.t[hi] - w.t[lo] || 1);
  }
  function stateAt(w, f, x) {                     // the source point, its velocity, at fractional index f
    const i = Math.floor(f), a = f - i, j = Math.min(i + 1, w.n - 1);
    const P0 = pointAt(w, i, x), P1 = pointAt(w, j, x), V0 = velAt(w, i, x), V1 = velAt(w, j, x);
    return [P0[0] + a * (P1[0] - P0[0]), P0[1] + a * (P1[1] - P0[1]), V0[0] + a * (V1[0] - V0[0]), V0[1] + a * (V1[1] - V0[1])];
  }
  // Kelvin's construction. Waves made at A, tau seconds ago, by a source moving at U along d: the wave travelling at
  // angle theta to d is stationary in her frame when its speed is U cos(theta); its energy moves at half that, so it
  // is now at A + (U tau / 2) cos(theta) (cos(theta) d + sin(theta) d_starboard): a circle of radius U tau / 4. Its
  // phase there, from the source, is -g tau / (2 U cos(theta)): crest n lies where tau = 4 pi n U cos(theta) / g.
  // The cusp, where the transverse and divergent waves meet, is theta = 35.26 deg: arcsin(1/3) = 19.47 deg off her track.
  const COS_C = Math.sqrt(2 / 3), SIN_C = Math.sqrt(1 / 3);
  function kelvinPoint(A, V, tau, theta) {
    const U = Math.sqrt(V[0] * V[0] + V[1] * V[1]); if (U < 1e-6) return null;
    const dx = V[0] / U, dy = V[1] / U, sx = -dy, sy = dx;        // d, and d turned to starboard (east of north)
    const k = 0.5 * U * tau * Math.cos(theta), c = Math.cos(theta), s = Math.sin(theta);
    return [A[0] + k * (c * dx + s * sx), A[1] + k * (c * dy + s * sy), U];
  }
  // the two arms (cusp lines): one point per sample, [X, Y, strength] each side
  function kelvinArms(w, tNow, out) {
    out = out || { port: [], stbd: [] }; out.port.length = 0; out.stbd.length = 0;
    for (let i = w.n - 1; i >= 0; i--) {
      const tau = tNow - w.t[i]; if (tau > 4 * WAKE.tauWaves) break; if (tau <= 0) continue;
      const P = pointAt(w, i, WAKE.xBow), V = velAt(w, i, WAKE.xBow);
      const a = kelvinPoint(P, V, tau, Math.acos(COS_C)), b = kelvinPoint(P, V, tau, -Math.acos(COS_C));
      if (!a) continue;
      const st = Math.min(1, (a[2] / 11.6) * (a[2] / 11.6)) * Math.exp(-tau / WAKE.tauWaves);
      out.stbd.push([a[0], a[1], st, w.seg[i]]); out.port.push([b[0], b[1], st, w.seg[i]]);
    }
    return out;
  }
  // crest n: points over theta from -thetaMax to +thetaMax; the emission time found by fixed point (U at emission)
  function kelvinCrest(w, tNow, n, nTheta, out) {
    out = out || []; out.length = 0;
    const thMax = WAKE.thetaMax * DEG, last = stateAt(w, w.n - 1, WAKE.xBow), U0 = Math.sqrt(last[2] * last[2] + last[3] * last[3]);
    if (U0 < 0.3) return out;
    for (let k = 0; k <= nTheta; k++) {
      const th = -thMax + 2 * thMax * k / nTheta, ct = Math.cos(th);
      let tau = 4 * Math.PI * n * U0 * ct / G, st = null;
      for (let it = 0; it < 4; it++) {
        const f = interp(w, tNow - tau); if (f < 0) { st = null; break; }
        st = stateAt(w, f, WAKE.xBow);
        const U = Math.sqrt(st[2] * st[2] + st[3] * st[3]); tau = 4 * Math.PI * n * U * ct / G;
      }
      if (!st) { out.push(null); continue; }
      const p = kelvinPoint([st[0], st[1]], [st[2], st[3]], tau, th);
      const strength = Math.min(1, (p[2] / 11.6) * (p[2] / 11.6)) * Math.exp(-tau / WAKE.tauWaves) * Math.min(1, (thMax - Math.abs(th)) / (12 * DEG));
      out.push([p[0], p[1], strength, tau]);
    }
    return out;
  }
  // the cusp of crest n on one side (sgn +1 starboard): [X, Y, U, tau, kx, ky] with k the waves' direction there
  function kelvinCusp(w, tNow, n, sgn) {
    const thc = sgn * Math.acos(COS_C), last = stateAt(w, w.n - 1, WAKE.xBow);
    let tau = 4 * Math.PI * n * Math.sqrt(last[2] * last[2] + last[3] * last[3]) * COS_C / G, st = null;
    for (let it = 0; it < 4; it++) {
      const f = interp(w, tNow - tau); if (f < 0) return null;
      st = stateAt(w, f, WAKE.xBow); tau = 4 * Math.PI * n * Math.sqrt(st[2] * st[2] + st[3] * st[3]) * COS_C / G;
    }
    const p = kelvinPoint([st[0], st[1]], [st[2], st[3]], tau, thc), U = p[2], dx = st[2] / U, dy = st[3] / U;
    return [p[0], p[1], U, tau, Math.cos(thc) * dx - Math.sin(thc) * dy, Math.cos(thc) * dy + Math.sin(thc) * dx];
  }
  function wavelengths(U) { const lt = TAU * U * U / G; return { transverse: lt, cusp: 2 / 3 * lt, alongArm: 2 / Math.sqrt(3) * lt }; }

  // =================================================================== the lights
  // 1910 regulations (New Zealand Gazette 1910, p. 3092) [read]: masthead light over 20 points, right ahead to two
  // points abaft the beam on each side, seen 5 miles; side lights over 10 points each, seen 2 miles, screened inboard;
  // no fixed stern light required of a steamer (only a light shown to one overtaking). Titanic's masthead light on the
  // foremast about 145 ft above the water (Halpern) [read]; side lights in the bridge wing cabs [read, search summary];
  // a stern light on the docking bridge [bet: photographs suggest one]. Bearings are of the viewer from the light,
  // relative to her bow, + to starboard, degrees.
  const LIGHTS = [
    { id: 'masthead', name: 'Masthead light', color: 0xfff1d6, at: [94.0, 0, 9.6 + 145 * FT], arc: [-112.5, 112.5], miles: 5 },
    { id: 'starboard', name: 'Starboard side light', color: 0x2cff8c, at: [74.6, -1, 0], arc: [0, 112.5], miles: 2 },
    { id: 'port', name: 'Port side light', color: 0xff2a1c, at: [74.6, 1, 0], arc: [-112.5, 0], miles: 2 },
    { id: 'stern', name: 'Stern light', color: 0xfff6e8, at: [-138.0, 0, 0], arc: [112.5, -112.5], miles: 1, optional: true },
  ];
  // Where they stand on the drawn ship (site/topsides.js): the masthead light on the raked foremast at its height (the
  // topsides note, 2.2: x about +90.0, where it was +94.0 on the old upright mast); the side lights at the wing cabs'
  // outboard faces (x +68.6, the cabs' middle; they stood at +74.6, forward of the drawn bridge); the stern light on the
  // taffrail.
  (function placeLights() {
    const cb = TS.N.cabs, xc = (cb.x0 + cb.x1) / 2, out = TS.deckEdge(xc) + cb.out + 0.12, fore = TS.mastAxis(TS.N.masts[0]);
    for (const L of LIGHTS) {
      if (L.id === 'masthead') L.at = [fore.xAt(L.at[2]), 0, L.at[2]];
      if (L.id === 'starboard' || L.id === 'port') L.at = [xc, L.at[1] * out, C.deckZ('Boat', xc) + 1.6];
      if (L.id === 'stern') L.at = [C.G.xAP - C.G.sternOverhang + 1.2, 0, C.deckZ('B', -135) + 1.4];
    }
  })();
  function sstep(a, b, x) { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  // how much of a light shows at bearing b (deg); soft = the width of its edge, degrees (a real screen is no knife edge)
  function lightFactor(L, b, soft) {
    soft = soft === undefined ? 1.5 : soft;
    while (b > 180) b -= 360; while (b <= -180) b += 360;
    if (L.id === 'masthead') return 1 - sstep(112.5, 112.5 + soft, Math.abs(b));
    if (L.id === 'starboard') return sstep(-soft, 0, b) * (1 - sstep(112.5, 112.5 + soft, b));
    if (L.id === 'port') return sstep(-soft, 0, -b) * (1 - sstep(112.5, 112.5 + soft, -b));
    if (L.id === 'stern') return sstep(112.5 - soft, 112.5, Math.abs(b));
    return 0;
  }
  // bearing of a viewer at ship-frame point (x, y, z) from light L, relative to the bow, + to starboard
  function bearingFrom(L, x, y) { return Math.atan2(-(y - L.at[1]), x - L.at[0]) / DEG; }

  // =================================================================== the wash thrown forward when backing (V4)
  // A wing screw going astern throws its race forward along her side ("quickwater"). Each half second a parcel of that
  // water leaves the screw at the efflux speed U0 = sqrt(2 |T| / (rho A)): momentum theory on the model's own thrust,
  // the same as the 1.6 n D sqrt(K_T) of the scour literature [derived]. It keeps that speed through the zone of flow
  // establishment and then slows as 1 / distance. R3 (2026-11-17, docs/research/RESEARCH_screws_wash_engines_v1_2026-11-17.md):
  // the German method (Fuehrer, Pohl and Roemisch 1987, usually cited as Fuehrer and Roemisch 1977), as tabulated in a
  // 2024 review (Kadir et al., Journal of Marine Science and Application): efflux 1.59 n D sqrt(K_T), the speed flat to
  // 2.6 diameters, then Vmax / V0 = 2.6 (x / D)^-1, which is this law with the zone at 2.6 [read in the review; the
  // original papers not opened]; it was 2.5 (PIANC 2015, as cited). Its place along her side is the distance it has run
  // through the water less the distance she has run since it left. It dies below 0.3 m/s.
  const WASH = { every: 0.5, zone: 2.6, die: 0.3, life: 180 };
  function washState() { return { p: [], lastT: -1e9 }; }     // parcels: [s run through the water, m ahead of the screw, U0, age]
  function washSpeed(q, xe) { return q[0] < xe ? q[2] : q[2] * xe / q[0]; }
  function washStep(st, t, dt, u, T, D) {
    const xe = WASH.zone * D;
    for (const q of st.p) { const U = washSpeed(q, xe); q[0] += U * dt; q[1] += (U - u) * dt; q[3] += dt; }
    st.p = st.p.filter(q => washSpeed(q, xe) > WASH.die && q[3] < WASH.life);
    if (T < 0 && t - st.lastT >= WASH.every - 1e-9) { st.p.push([0, 0, Math.sqrt(2 * -T / (C.RHO * Math.PI * D * D / 4)), 0]); st.lastT = t; }
  }
  // how far ahead of the screw the wash has crept along her side (m), and how hard it runs there (0..1)
  function washFront(st, D) {
    const xe = WASH.zone * D; let f = 0, s = 0;
    for (const q of st.p) if (q[1] > f) { f = q[1]; s = Math.min(1, washSpeed(q, xe) / 4); }
    return [f, s];
  }

  // =================================================================== the engines (X-ray only)
  // Four cylinders per set, from forward LP, HP, IP, LP; bores 97, 54, 84, 97 in; stroke 75 in [read]; the sets'
  // centre lines 5.14 m either side of hers, crankshafts 3.80 m above the keel [measured, R1]. Crank angles, V8
  // (2026-11-17, docs/research/RESEARCH_screws_wash_engines_v1_2026-11-17.md): the Yarrow-Schlick-Tweedy balance as
  // Samuel Halpern gives it (titanicology.com, revised 2011; his source not given): HP at the top, the IP 106 degrees
  // later, the forward LP 100 after that, the aft LP 54 after that [read]. Offsets on the crank angle, for the order of
  // the cylinders below: [154, 0, 254, 100] [derived]; going ahead, the sequence as given [bet]. Primary forces then
  // cancel with the HP and IP moving parts each 1.48 times an LP's [derived, the note]. They were [0, 180, 90, 270], an
  // even turning moment [bet]. The port set is the starboard's mirror image (outward-turning screws): site/app.js turns
  // it the other way with the offsets negated. Connecting rods 4.5 cranks long [bet: not found; 3.5 to 5 in the period];
  // cylinder pitch 4.4 m [bet: four cylinders in the 21 m engine room].
  const ENGINE = {
    cyl: [{ name: 'LP', bore: 97 }, { name: 'HP', bore: 54 }, { name: 'IP', bore: 84 }, { name: 'LP', bore: 97 }],
    stroke: 75 * 0.0254, cranks: [154, 0, 254, 100], rod: 4.5, pitch: 4.4, xMid: -37.6, y: 5.14, zShaft: 3.80, height: 30 * FT,
    pistonRod: 3.2,
    // the Parsons turbine: rotor 12 ft by 12 ft 8 in [read], on the centre line 4.82 m up [measured, R1]
    turbine: { x: -56.8, z: 4.82, rotorD: 12 * FT, rotorL: (12 + 8 / 12) * FT },
  };

  // =================================================================== her other lights (V6)
  // Rows of lit ports on C, D, E and F decks along the hull, and the windows at her side above it: B deck's and the
  // A-deck screen's, where site/topsides.js draws them (on her side, flush with the hull); seven in ten lit
  // [appearance]. Whether they burn is the plant's: core/systems.js (the dynamos, their steam, their room).
  // Accounts differ on whether they died at once or reddened first [read, search summary]; they are drawn going out
  // over three seconds.
  function portholes() {
    const out = []; let h = 2166136261;
    const lit = () => { h = Math.imul(h ^ (out.length + 7), 16777619) >>> 0; return (h % 10) < 7; };
    for (const deck of ['C', 'D', 'E', 'F']) for (let x = -116; x <= 112; x += 2.6) {
      const z = C.deckZ(deck, x) + 1.2; if (z > C.zTopAt(x) - 0.6) continue;
      const hb = TS.hullDraw(x, z); if (hb < 2) continue;              // on the drawn shell (its round stern: site/topsides.js)
      for (const sgn of [1, -1]) if (lit()) out.push([x, sgn * (hb + 0.06), z]);
    }
    for (const p of TS.built().lit) if (lit()) out.push(p.slice());
    return out;
  }
  // piston height above the crank's axis for crank angle a (rad): r cos a + sqrt(l^2 - (r sin a)^2)
  function pistonLift(a) { const r = ENGINE.stroke / 2, l = ENGINE.rod * r, s = r * Math.sin(a); return r * Math.cos(a) + Math.sqrt(l * l - s * s); }

  return {
    STERN, RUDDER, RUDDER_TRACE, RUDDER_SCALE, WAKE, LIGHTS, ENGINE, COS_C,
    chordShape, pitchAngle, propeller, bladeFaceArea, meshPitchAngle, hubProfile, rudderGeometry, rudderImmersedArea,
    wingClearanceAt, wingShaftY, bossing,
    wakeBuffer, wakeTake, pointAt, velAt, interp, stateAt, kelvinPoint, kelvinArms, kelvinCrest, kelvinCusp, wavelengths,
    lightFactor, bearingFrom, pistonLift,
    WASH, washState, washStep, washFront, washSpeed, portholes,
  };
});
