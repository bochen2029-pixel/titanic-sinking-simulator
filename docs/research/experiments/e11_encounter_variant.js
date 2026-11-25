// e11's variant (P3c study): e10's, plus ICE.aRamp (contact area ramps in over aRamp m of overlap; 0 = the count) and ICE.vSlip
// (friction tanh(v / vSlip) instead of its sign; 0 = the sign). From e10's variant of core/encounter.js (P3b, 2026-11-16, measured and NOT adopted): the continuous outline in the berg's frame,
// the crush clipped over each station's arc, stations every ds metres, and a berg that turns. core/encounter.js stayed as it was.
/*
 * The iceberg encounter (P2, P3 of docs/BRAINSTORM_ship_under_way_v1_1): a ship under way (core/motion.js) meets a
 * berg, and the CONTACT makes the damage, which the flooding core then sinks her with.
 *
 * Model, per sub-step (dt / 5 while the ship is near the ice):
 *   - The berg's underwater spur is three horizontal bands (depths below the waterline); each band's outline is a
 *     continuous, piecewise-linear curve through a polar radius table around the berg's centre (ICE.nodes, in the
 *     berg's own frame; P3b: until then it was 180 flat 2-degree bins in the earth frame, and a course one degree off
 *     opened up to 28 % more). The berg moves as a free body (mass plus added mass) under the contact force, and turns
 *     under its moment: on a round berg only the sliding friction has one (P3b).
 *   - The hull is the core's own form: at each band's depth, a station every metre from stem to stern, both sides,
 *     using halfBreadth(x, z) at the pose when the encounter starts.
 *   - Contact at a station: overlap = ice radius - distance of the (dented) hull point from the berg's centre.
 *     The interface force is the smaller of what the plating resists, q h (dent + overlap), and what the ice can carry
 *     before it crushes, p h, with p = p0 / sqrt(contact area) (the falling pressure-area relation of ice [bet: form]).
 *     If the plating is weaker, it dents by the whole overlap; otherwise it dents to p/q and the ice outline crushes
 *     back by the rest. Dents and crushing are permanent.
 *   - A station whose dent exceeds dTear opens: a seam or plate tear of area alpha (dent - dTear) per metre of hull,
 *     handed to the core as an opening (addOpening, then setOpeningArea as it grows). Shallower dents are dents: no water.
 *   - Friction mu along the contact. The force acts on the ship (surge, sway, yaw, and roll about G through sim.xMph)
 *     and, reversed, on the berg. The berg also feels the water's drag.
 *   - A stem strike (added with P4): where her centreline itself is inside ice that faces her bow, the bow structure
 *     crushes at a constant force and the stem recedes; the compartments the crush reaches are open to the sea.
 *     Glancing touches such as the reconstructed 1912 one never meet this law (see ICE.bowF).
 * Far from the ice, Encounter.step is exactly Motion.step (checked by tools/encounter_tests.js).
 * Frame: as motion.js (MMG: x forward, y to starboard; earth x north, y east). Openings are written in the core's frame
 * (y to port), so a starboard station has y < 0.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../../../core/core.js'), require('../../../core/motion.js'));
  else root.TitanicEncounter = factory(root.TitanicCore, root.TitanicMotion);
})(typeof self !== 'undefined' ? self : this, function (C, Mo) {
  'use strict';
  const DEG = Math.PI / 180, TWO_PI = 2 * Math.PI;
  const GAP_EXACT = 100;                            // m: the smallest gap between hull and ice (minGap) is tracked exactly below this

  const ICE = {
    R: 40,                  // spur radius at the top band, m [bet]
    taper: 0.08,            // each deeper band is this share narrower [bet]
    depths: [5.75, 6.75, 7.75], h: 1.0,   // band centres below the waterline and band height, m: the 1912 damage lay 6.6-7.5 m down
    // q, p0 and mass were chosen by a joint search with the 1912 geometry (docs/research/experiments/e5): the tears must
    // run from the forepeak to about boiler room 5, starboard only, with the split near Hackett and Bedford's. They are
    // fitted bets, not measurements.
    mass: 1e8, added: 0.5,  // berg mass, kg (100,000 t), and added-mass ratio [fitted bet: published estimates span 1e8 to over 1e9 kg]
    mu: 0.1,                // friction, ice on steel [bet]
    p0: 6e6,                // ice pressure at 1 m2 of contact, Pa; p = p0 / sqrt(A) [bet: order of ship-ice process pressures]
    q: 12e6,                // side-shell resistance, N per m2 of contact per m of dent [fitted bet]
    dTear: 0.2,             // dent at which riveted seams and plates open, m [bet]
    // m2 of opening per m of hull per m of dent beyond dTear: a seam gap of about 14 % of the excess dent. Fitted so that
    // the 1912 encounter opens the core's calibrated 0.7506 m2 (a fixed point: the holes change her motion a little
    // during the contact, and so the damage; tools/calibrate_encounter.js finds it, tools/encounter_tests.js checks it).
    // Refitted 2026-11-16 when the berg's drag was added (it had been 0.14326), and again the same day when the handling
    // was refitted to the sisters' consensus and the 1912 geometry with it (M2, e9: the tear now runs x 127 to 29, 98 m,
    // where it ran 69 m; it had been 0.14448247622448618).
    alpha: 0.10976148390199011,
    sub: 5,
    // A stem strike [bet]. The bands above are a spur three metres thick; a ship that runs her stem into the berg meets
    // its whole face. Where her centreline is inside the ice and the ice faces her bow (within about 60 degrees of
    // square), the bow structure crushes at a constant force along her axis, and the stem recedes to the ice. 120 MN
    // stops her in 27 m from 22.5 knots against a fixed obstacle: Wilding's "80 or perhaps 100 feet"
    // (abacus1:148660ed92b9). The force acts along the ice's normal, so an oblique blow also throws her head off. Between
    // cosines 0.4 and 0.7 of the angle between that normal and her axis the law fades in; more glancing touches are the
    // side law's alone (the 1912 touch is one of those, and is unchanged by this law).
    bowF: 120e6, bowCos0: 0.4, bowCos1: 0.7, bowZ: 5.0,   // bowZ: height of the force above the keel, m
    bowOpen: 0.5,           // m2 of opening per metre of bow crushed, each side [bet: a crushed bow is open; the size matters little]
    bowMin: 0.5,            // m of crush before the forepeak is open [bet]
    // the berg's own resistance in the water: a blunt body, drag coefficient 1 on its breadth times its draft, the draft
    // from its mass as a slab of its own radius [bet]. Without it a pushed berg would coast for ever.
    cdBerg: 1.0,
    // P3b. The outline: nodes per band around the berg, joined by straight lines, fine enough that each hull station's
    // metre of side spans several (0.25 degree: 0.17 m of arc at 40 m). A crush clips the outline to the dented hull over
    // that metre's arc. Turning: the berg's moment of inertia is a disc of its spur's radius, a round body moves no water
    // turning (added 0) [bets], and the water slows its turning as it slows its drift, at the rim's speed [bet].
    nodes: 1440, turns: true, addedYaw: 0,
    aRamp: 0, vSlip: 0,
    ds: 1,                  // m of hull each station stands for (its force, its contact and its opening scale with it)
  };

  function bandStations(sim, depth, ds) {         // hull points at `depth` below the waterline, every ds metres, at the current pose
    ds = ds || 1;
    const F = C.frameOf(sim), xs = [], hb = [], zs = [];
    const xStem = C.xFwd(8);
    for (let x = Math.floor(xStem + 1); x >= C.G.xAP - C.G.sternOverhang; x -= ds) {
      const keelDepth = -C.worldZ(F, x, 0, 0);    // keel's depth below the sea at this station
      const z = keelDepth - depth;
      if (z <= 0.05) continue;
      const h = C.halfBreadth(x, z);
      if (h > 0.05) { xs.push(x); hb.push(h); zs.push(z); }
    }
    return { depth, ds, n: xs.length, xs: Float64Array.from(xs), hb: Float64Array.from(hb), zs: Float64Array.from(zs) };
  }

  // Attach an encounter. place: { ahead (m from the stem to the ice's edge along the heading), port (m the ice's edge
  // reaches to port of the ship's centreline track) }, or { X, Y } in the earth frame. ice: overrides of ICE.
  function create(sim, place, ice) {
    const P = Object.assign({}, ICE, ice || {}), m = sim.mo;
    const bands = P.depths.map(d => bandStations(sim, d, P.ds));
    const R = P.depths.map((d, i) => P.R * (1 - P.taper * i));
    const rIce = R.map(r => new Float64Array(P.nodes).fill(r));
    let bX, bY;
    if (place.X !== undefined) { bX = place.X; bY = place.Y; }
    else {
      const c = Math.cos(m.psi), s = Math.sin(m.psi), along = C.xFwd(8) + place.ahead + R[0], across = R[0] - place.port;
      bX = m.X + along * c - across * s; bY = m.Y + along * s + across * c;
    }
    const side = () => bands.map(b => ({ dent: new Float64Array(b.n), t0: new Float64Array(b.n).fill(-1), op: new Int32Array(b.n).fill(-1) }));
    sim.enc = {
      P, bands, rIce, NB: P.nodes, Rmax: R[0], berg: { X: bX, Y: bY, VX: 0, VY: 0, X0: bX, Y0: bY, PSI: 0, W: 0 },
      Iz: P.mass * (1 + P.addedYaw) * R[0] * R[0] / 2,
      stbd: side(), port: side(), area: 1, minGap: 1e9, tFirst: -1, tLast: -1, Fmax: 0, crushed: 0, pending: [],
      xStem: C.xFwd(8), bow: 0, bowOp: new Int32Array(32).fill(-1),      // the stem, metres of bow crushed, its openings
      // drag deceleration per (m/s)^2: 0.5 rho Cd (2R)(draft) / (mass with added mass), draft = mass / (rho pi R^2)
      dragK: 0.5 * C.RHO * P.cdBerg * 2 * R[0] * (P.mass / (C.RHO * Math.PI * R[0] * R[0])) / (P.mass * (1 + P.added)),
    };
    return sim.enc;
  }

  // where a point at (ex, ey) from the berg's centre falls on the outline: nodes j and j1 either side, and the weight w
  // of j1 (the outline is in the berg's frame, turned by PSI). Shared by the contact law and the viewer.
  function outlineAt(e, ex, ey) {
    const n = e.NB;
    let u = (Math.atan2(ey, ex) + Math.PI - e.berg.PSI) / TWO_PI * n;
    u -= n * Math.floor(u / n);
    let j = Math.floor(u); if (j >= n) j = n - 1;
    const w = u - j;
    return [j, j + 1 === n ? 0 : j + 1, w];
  }
  // contact forces for the current ship and berg states; updates dents and the ice outline
  function contact(sim, m, e, dt) {
    const P = e.P, b0 = e.berg, c = Math.cos(m.psi), s = Math.sin(m.psi);
    const p = P.p0 / Math.sqrt(e.area > 1 ? e.area : 1);
    let Fx = 0, Fy = 0, N = 0, roll = 0, area = 0, Tb = 0;
    // the stem: her centreline inside ice that faces her bow crushes the bow (see ICE.bowF)
    {
      const xs = e.xStem - e.bow, ex = m.X + xs * c - b0.X, ey = m.Y + xs * s - b0.Y, d2 = ex * ex + ey * ey;
      if (d2 < e.Rmax * e.Rmax && d2 > 1e-9) {
        const dist = Math.sqrt(d2), nx = ex / dist, ny = ey / dist;
        const at = outlineAt(e, ex, ey), r0 = e.rIce[0][at[0]] * (1 - at[2]) + e.rIce[0][at[1]] * at[2];
        const nxs = nx * c + ny * s, nys = -nx * s + ny * c, cax = -nxs;      // the ice's outward normal in her axes
        if (r0 - dist > 0 && cax > P.bowCos0) {
          const vb = m.v + m.r * xs;                                         // the stem's velocity against the berg's, along the normal
          const vn = -((m.u * c - vb * s - b0.VX) * nx + (m.u * s + vb * c - b0.VY) * ny);
          if (vn > 0) {
            const w = cax >= P.bowCos1 ? 1 : (cax - P.bowCos0) / (P.bowCos1 - P.bowCos0);
            const H = m.K.H, arm = xs * nys;                                 // no more force than ends the closing in this step
            const inv = nxs * nxs / (m.mass + H.mx) + nys * nys / (m.mass + H.my) + arm * arm / (m.IzG + H.Jz + m.xG * m.xG * m.mass) + 1 / (P.mass * (1 + P.added));
            const stop = vn / (inv * dt), F = w * P.bowF < stop ? w * P.bowF : stop;
            const fx = F * nx, fy = F * ny;
            Fx += fx; Fy += fy; N += xs * c * fy - xs * s * fx;
            roll -= F * nys * (m.KG - P.bowZ);
            e.bow += w * vn * dt / cax;                                      // the stem recedes along her axis as fast as it closes
          }
        }
      }
    }
    const xFront = e.xStem - e.bow;                 // forward of this the hull is crushed away
    const far2 = (e.Rmax + GAP_EXACT) * (e.Rmax + GAP_EXACT);
    for (let k = 0; k < e.bands.length; k++) {
      const B = e.bands[k], rI = e.rIce[k];
      for (let sd = 0; sd < 2; sd++) {
        const sg = sd === 0 ? 1 : -1, D = sd === 0 ? e.stbd[k] : e.port[k];
        for (let i = 0; i < B.n; i++) {
          const x = B.xs[i], y = sg * (B.hb[i] - D.dent[i]);
          if (x > xFront) continue;
          const Xw = m.X + x * c - y * s, Yw = m.Y + x * s + y * c;
          const ex = Xw - b0.X, ey = Yw - b0.Y;
          if (ex * ex + ey * ey > far2) continue;   // well clear: no force, and no part in the smallest gap (exact below GAP_EXACT)
          const dist = Math.sqrt(ex * ex + ey * ey);
          const at = outlineAt(e, ex, ey), j = at[0], j1 = at[1], w = at[2];
          const ov = rI[j] * (1 - w) + rI[j1] * w - dist;
          if (-ov < e.minGap) e.minGap = -ov;
          if (ov <= 0) continue;
          const fIce = p * P.h, d0 = D.dent[i];
          let f;
          if (P.q * P.h * (d0 + ov) <= fIce) { D.dent[i] = d0 + ov; f = P.q * P.h * D.dent[i]; }
          else {
            const dn = fIce / (P.q * P.h) > d0 ? fIce / (P.q * P.h) : d0;
            const crush = ov - (dn - d0), rNew = dist + (dn - d0);
            // the ice crushes back to the dented hull over the arc this station's metre of hull covers (half a metre
            // each side): the outline is clipped to rNew there, so the crushed ice is the envelope of the hull's passage
            const n = e.NB, half = 0.5 * B.ds / dist * n / TWO_PI, u = j + w;
            const lo = Math.ceil(u - half), hi = Math.floor(u + half);
            for (let q = lo; q <= hi; q++) { const jj = ((q % n) + n) % n; if (rI[jj] > rNew) rI[jj] = rNew; }
            if (rI[j] > rNew) rI[j] = rNew; if (rI[j1] > rNew) rI[j1] = rNew;
            e.crushed += crush;
            D.dent[i] = dn; f = fIce;
          }
          if (D.t0[i] < 0) D.t0[i] = sim.t;
          f *= B.ds; area += P.h * B.ds * (P.aRamp > 0 ? (ov < P.aRamp ? ov / P.aRamp : 1) : 1);   // the station stands for ds metres of hull
          const nx = ex / dist, ny = ey / dist;
          // friction against the relative sliding velocity of the hull point
          const ub = m.u - m.r * y, vb = m.v + m.r * x;
          const Vx = ub * c - vb * s - b0.VX, Vy = ub * s + vb * c - b0.VY, vt = -Vx * ny + Vy * nx;
          const ft = P.vSlip > 0 ? -P.mu * f * Math.tanh(vt / P.vSlip) : (vt > 0 ? -P.mu * f : (vt < 0 ? P.mu * f : 0));
          const fx = f * nx - ft * ny, fy = f * ny + ft * nx;
          Fx += fx; Fy += fy; N += (Xw - m.X) * fy - (Yw - m.Y) * fx;
          Tb += ey * fx - ex * fy;                        // the reaction's moment about the berg's centre (friction alone)
          const yB = -fx * s + fy * c;                    // the force's starboard component in the ship's axes
          roll -= yB * (m.KG - B.zs[i]);                  // core sign: a push to starboard below G heels her to port
        }
      }
    }
    e.area = area;
    const F = Math.sqrt(Fx * Fx + Fy * Fy);
    if (F > 0) { if (e.tFirst < 0) e.tFirst = m.t; e.tLast = m.t; if (F > e.Fmax) e.Fmax = F; }
    return { X: Fx * c + Fy * s, Y: -Fx * s + Fy * c, N, roll, Fx, Fy, Tb };
  }

  // hand torn stations to the flooding core: new openings, or larger ones
  function syncOpenings(sim, e) {
    const P = e.P;
    for (let sd = 0; sd < 2; sd++) {
      const D = sd === 0 ? e.stbd : e.port;
      for (let k = 0; k < e.bands.length; k++) {
        const B = e.bands[k], R = D[k];
        for (let i = 0; i < B.n; i++) {
          const ex = R.dent[i] - P.dTear;
          if (ex <= 0) continue;
          const a = P.alpha * ex * B.ds;
          if (R.op[i] < 0) {
            const z = B.zs[i], x = B.xs[i], yc = C.halfBreadth(x, z) + 0.02;
            const rec = C.addOpening(sim, { x, y: sd === 0 ? -yc : yc, z, area: a, kind: 'breach', label: 'ice:' + k + ':' + sd + ':' + i, tOpen: 0 });
            R.op[i] = rec.id;
          } else C.setOpeningArea(sim, R.op[i], a);
        }
      }
    }
    if (e.bow > P.bowMin) {                         // the crushed bow: every compartment the crush has reached is open, both sides
      const bx = C.zoneBounds(), xF = e.xStem - e.bow, kf = C.zoneAt(xF), z = 3.0;
      for (let k = 0; k <= kf; k++) {
        const len = (bx[k] < e.xStem ? bx[k] : e.xStem) - (bx[k + 1] > xF ? bx[k + 1] : xF);
        if (len <= 0) continue;
        for (let sd = 0; sd < 2; sd++) {
          const j = k * 2 + sd, a = P.bowOpen * len;
          if (e.bowOp[j] < 0) {
            let x = Math.max(bx[k + 1] + 0.5, Math.min(bx[k] - 1.5, xF - 0.5)), hb = C.halfBreadth(x, z);
            while (hb < 0.3 && x > bx[k + 1] + 1) { x -= 1; hb = C.halfBreadth(x, z); }
            e.bowOp[j] = C.addOpening(sim, { x, y: sd === 0 ? -(hb + 0.02) : hb + 0.02, z, area: a, kind: 'breach', label: 'bow:' + k + ':' + sd, tOpen: 0 }).id;
          } else C.setOpeningArea(sim, e.bowOp[j], a);
        }
      }
    }
  }

  function drift(e, dt) {                           // the water's drag on a moving berg (implicit, so it can only slow it)
    const b = e.berg, V = Math.sqrt(b.VX * b.VX + b.VY * b.VY);
    if (V > 0) { const k = 1 / (1 + e.dragK * V * dt); b.VX *= k; b.VY *= k; }
    if (b.W !== 0) { const rim = e.Rmax * (b.W < 0 ? -b.W : b.W); b.W /= 1 + e.dragK * rim * dt; }   // its turning, at the rim's speed
  }
  function near(sim) {
    const e = sim.enc, m = sim.mo, dx = m.X - e.berg.X, dy = m.Y - e.berg.Y;
    return dx * dx + dy * dy < (0.5 * C.G.LBP + 20 + e.Rmax + 60) * (0.5 * C.G.LBP + 20 + e.Rmax + 60);
  }
  function step(sim) {
    const e = sim.enc, m = sim.mo;
    if (!e || !near(sim)) {
      if (e) { drift(e, sim.params.dt); e.berg.X += e.berg.VX * sim.params.dt; e.berg.Y += e.berg.VY * sim.params.dt; e.berg.PSI += e.berg.W * sim.params.dt; }
      Mo.step(sim); return;
    }
    const P = e.P, dt = sim.params.dt / P.sub, Mb = P.mass * (1 + P.added);
    Mo.syncMass(sim, m);
    let roll = 0;
    for (let k = 0; k < P.sub; k++) {
      const f = contact(sim, m, e, dt);
      Mo.accelerations(m, f.X, f.Y, f.N);
      roll += Mo.heelMoment(m) + f.roll;
      Mo.advance(m, dt);
      e.berg.VX -= f.Fx / Mb * dt; e.berg.VY -= f.Fy / Mb * dt;
      if (P.turns) e.berg.W += f.Tb / e.Iz * dt;
      drift(e, dt);
      e.berg.X += e.berg.VX * dt; e.berg.Y += e.berg.VY * dt; e.berg.PSI += e.berg.W * dt;
    }
    if (m.couple) sim.xMph = roll / P.sub;
    syncOpenings(sim, e);
    C.step(sim);
  }

  // what happened, for tests and the viewer
  function summary(sim) {
    const e = sim.enc, P = e.P, out = { minGap: e.minGap, tFirst: e.tFirst, dur: e.tFirst < 0 ? 0 : e.tLast - e.tFirst, Fmax: e.Fmax,
      bergMoved: Math.sqrt((e.berg.X - e.berg.X0) ** 2 + (e.berg.Y - e.berg.Y0) ** 2), bergTurned: e.berg.PSI / DEG, crushed: e.crushed };
    for (const [name, D] of [['stbd', e.stbd], ['port', e.port]]) {
      let tears = 0, dents = 0, area = 0, excess = 0, xT0 = null, xT1 = null, xD0 = null, xD1 = null, dmax = 0;
      const zone = new Float64Array(16);
      for (let k = 0; k < e.bands.length; k++) {
        const B = e.bands[k], R = D[k];
        for (let i = 0; i < B.n; i++) {
          const d = R.dent[i]; if (d <= 0) continue;
          const x = B.xs[i]; if (d > dmax) dmax = d;
          if (xD0 === null || x > xD0) xD0 = x; if (xD1 === null || x < xD1) xD1 = x;
          if (d > P.dTear) {
            tears++; excess += d - P.dTear; const a = P.alpha * (d - P.dTear) * B.ds; area += a; zone[C.zoneAt(x)] += a;
            if (xT0 === null || x > xT0) xT0 = x; if (xT1 === null || x < xT1) xT1 = x;
          } else dents++;
        }
      }
      out[name] = { tears, dents, area, excess, tearFrom: xT0, tearTo: xT1, dentFrom: xD0, dentTo: xD1, dmax, zone };
    }
    // the crushed bow, if her stem went in: metres crushed, the opening it makes, and by compartment
    const bow = { crush: e.bow, area: 0, zone: new Float64Array(16) };
    if (e.bow > P.bowMin) {
      const bx = C.zoneBounds(), xF = e.xStem - e.bow, kf = C.zoneAt(xF);
      for (let k = 0; k <= kf; k++) {
        const len = (bx[k] < e.xStem ? bx[k] : e.xStem) - (bx[k + 1] > xF ? bx[k + 1] : xF);
        if (len > 0) { bow.zone[k] = 2 * P.bowOpen * len; bow.area += bow.zone[k]; }
      }
    }
    out.bow = bow;
    out.kind = out.stbd.tears + out.port.tears > 0 || bow.area > 0 ? 'holed' : (out.stbd.dents + out.port.dents > 0 ? 'dented' : 'miss');
    return out;
  }
  function setAlpha(sim, alpha) { sim.enc.P.alpha = alpha; syncOpenings(sim, sim.enc); }

  return { ICE, GAP_EXACT, create, step, near, summary, setAlpha, contact, bandStations, outlineAt };
});
