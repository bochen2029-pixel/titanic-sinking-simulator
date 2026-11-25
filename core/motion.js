/*
 * The ship under way: surge, sway and yaw, three shafts and one rudder, joined to the flooding core through its seams.
 * Headless, deterministic, no DOM, the same module pattern as core.js. Design: docs/BRAINSTORM_ship_under_way_v1 and
 * v1_1 (P1). Every number below carries its source or is marked [bet].
 *
 * FRAME (the one trap). Inside this file the manoeuvring literature's frame is used (MMG: Yasukawa and Yoshimura 2015):
 *   x forward, y to STARBOARD, z down; u, v the velocities at amidships; r > 0 turns the bow to starboard;
 *   rudder angle delta > 0 turns the bow to starboard; earth frame x0 north, y0 east; heading psi clockwise from north.
 * The core's frame is x forward, y to PORT, z up, roll positive starboard down. The only quantity that crosses is the
 * roll moment from turning (seam xMph), mapped in heelMoment() below. Flood-water centroids (core x) need no mapping.
 * 1912 helm orders were tiller orders: "hard-a-starboard" put the head to PORT, i.e. delta = -40 here (helm1912()).
 *
 * STEP. Motion.step(sim): forces from the state at t; the roll moment into sim.xMph; C.step(sim); then velocities,
 * then positions from the new velocities (semi-implicit Euler, dt = the core's 0.25 s). At rest with the engines
 * stopped every force is zero and the core gives the same bits as without motion (tools/trials.js checks it).
 * No Math.pow inside the step (its last bit depends on the C runtime: README); no Math.hypot; no division by speed.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./core.js'));
  else root.TitanicMotion = factory(root.TitanicCore);
})(typeof self !== 'undefined' ? self : this, function (C) {
  'use strict';
  const RHO = C.RHO, FT = C.FT, G = C.GRAV, KN = 1852 / 3600, DEG = Math.PI / 180, PI07 = 0.7 * Math.PI;

  // ---------------------------------------------------------------- ship data
  const SHIP = {
    L: C.G.LBP, B: C.G.B,
    d: 0.5 * (C.DEFAULT_PARAMS.draftF + C.DEFAULT_PARAMS.draftA),        // 9.83 m, the night's mean draft (Wilding)
    m: 49020667.158, xG: -3.1954, KG: 10.7987,     // the core's mass, LCG and KG for 14 April (createSim; used when not attached)
    zH: 0.5,                                       // hull side force acts at this share of the draft above the keel [bet; 0.5-0.65, M4]
    // resistance R = cR u|u| g(|u| / uB): Biles's 165 tons at 21 kn for about 53,000 t (Hawke inquiry), scaled to 49,021 t
    // (abacus1:4cefc0a23470), times a shape g in x = u / uB, a cubic g0 + g1 x + g2 x^2 + g3 x^3 with g(1) = 1, held at its
    // values at x0 and x1 outside them. M3 (2026-11-17): the shape of Holtrop's 1984 method for this hull (friction with its
    // form factor, wave-making, correlation; no bulb or transom; C_M 0.975 and C_WP 0.78 assumed, the shape hardly moves
    // with them), fitted over 3-25 kn within 0.84 % as used (docs/research/experiments/e16_resistance_shape.js; the period
    // curve research note keeps it: docs/research/RESEARCH_period_resistance_curve_v1_2026-11-17.md). Until M3 it was 1:
    // a quadratic resistance made the speed exactly proportional to the revolutions
    cR: 13231,
    resist: { uB: 21 * KN, x0: 3 / 21, x1: 25 / 21, g: [1.0822331610460612, -0.69099582864974440, 0.48388570807433345, 0.12487695952934966] },
    tP: 0.15,                                      // thrust deduction [bet]
    // calibration point for the screws: 75 rpm gives 22.15 kn straight ahead (Halpern, "Speed and Revolutions", Titanic table;
    // 22.06 kn averaged at 75 rpm on the 13-14 April run), with power shared 15 : 15 : 16 (2 x 15,000 ihp + 16,000 shp)
    cal: { rpm: 75, kn: 22.15, share: [15 / 46, 15 / 46, 16 / 46] },
    // screws: Harland & Wolff notebook via Chirnside (fact sheet section 2). J0 = advance ratio of zero thrust [bet]
    wing: { D: 23.5 * FT, w: 0.15, J0: 1.48, y: 6.0 },   // y: wing shaft off the centreline, m [bet: not found in any source]
    // Cdw: drag coefficient (on its disc) of the centre screw trailing free with the turbine out. M4: the B-series' drag at
    // zero torque, 0.10 for B4-70 of pitch ratio 1.0 (0.03 at 1.4; the centre screw's is 0.85, so more is possible); 0.25 [bet]
    // before (four-quadrant research note, section 6)
    centre: { D: 17 * FT, w: 0.30, J0: 0.95, Cdw: 0.10 },
    turbineRatio: 2.2,                             // turbine rpm per engine rpm (Thearle: 175-180 at 80; fact sheet section 3)
    // rudder: 401.63 sq ft (Weeks; abacus1:2b8bb87f9a58), hard over 40 deg (Hichens, BI 998); immersed span [bet]
    rudder: { A: 37.31, H: 9.5, max: 40, rate: 4 },   // rate deg/s [bet: never measured; the fit is insensitive to it]
    asternLift: 0.5,                               // the rudder's lift slope with sternway, share of ahead [bet] (M1)
    // M4 (2026-11-17). A wing screw turning astern while she still goes ahead (n < 0, Va > 0, the "crash-back" quadrant)
    // takes the shape of the Wageningen B4-70 screw of pitch ratio 1.4, the series' nearest to the wing screws' 1.49:
    // MARIN's four-quadrant Fourier series (1984), as reprinted in Roddy, Hess and Faller (2006), NSWCCD-50-TR-2006/004
    // (approved for public release), evaluated in docs/research/RESEARCH_propeller_four_quadrant_v1_2026-11-17.md.
    // ct: its thrust coefficient C_T* at beta = 180, 175, ..., 90 deg, i.e. at x = atan2(Va, 0.7 pi |n| D) = 0, 5, ..., 90.
    //   |T| = rho D^4 a fA [C_T*(x) / C_T*(0)] (n^2 + Va^2 / (0.49 pi^2 D^2))
    // so fA sets the astern bollard pull (as before M4) and the table the rest: the pull grows about as 1 + 0.85 J^2 with
    // the advance ratio J = Va / (|n| D) (before M4: 1 + J / 1.48, too weak at speed). held: while an engine is being
    // reversed (its dead time) the screw is held and drags as at x = 90, so the force is continuous as it starts astern;
    // a screw stopped by "Stop": SHIP.stopped below (M7; before it, no force at all). With sternway the ahead law
    // mirrored (J0), as before.
    astern: { ct: [-0.2515, -0.2397, -0.2262, -0.2479, -0.3310, -0.4180, -0.4723, -0.5290, -0.5760, -0.6332, -0.7100, -0.7601, -0.7579, -0.7228, -0.6907, -0.6543, -0.6347, -0.6305, -0.6545], held: true },
    // M7 (2026-11-18). A wing screw whose engine is stopped while she has way ("Stop", or the plant's limit 0: no steam,
    // water at the engines) gave no force at all before M7, so her way after "Stop" was the hull's resistance alone (and
    // 4 % from the centre screw): from 22.5 kn, 4.1 kn 26 minutes later and 1.9 at an hour. A stopped screw drags, by its
    // state (docs/research/RESEARCH_way_after_stop_v1_2026-11-18.md):
    //   'held'  it stands: the held screw of a reversal's dead time, x = 90 of the table above, C_D 0.54 on its disc at the
    //           advance speed [derived: the B4-70 shape scaled by fA; the sources give 0.30 for these screws' blade area
    //           (Tabaczek and Bugalski's eq. 7) to 0.65 (B4-70 P/D 1.4, MARIN's series)]. With sternway the series' locked
    //           screw at 270 deg, aft = 0.5985 / 0.6545 of it [read: research note four-quadrant, section 3]
    //   'trail' the water turns the screw and the engine against the engine's friction: held below the speed uB at which
    //           the water's torque on the held screw equals that friction; above it the drag of the series' first quadrant
    //           beyond zero torque where its torque equals the friction. trail: pairs [r, share of held drag], r = (uB / u)^2
    //           = the friction over the held screw's torque [derived: B4-70 P/D 1.4, beta 34.4 (zero torque) to 65 deg];
    //           uB 6 kn [bet: 3.7 to 9.8 kn for a friction of 3 to 10 % of the engine's full torque]
    //   'free'  turned by the water with no friction: the series' drag at zero torque, 0.045 of held [derived]
    // state: the engine-room witnesses say the engines stood between the orders after the collision (Dillon, BI 3720-3723,
    // among the main engines; Scott, BI 5617-5622), and below about 4 to 10 kn a held wing screw's torque is under any
    // likely friction of the engine (the note, section 3): 'held' [read]. The centre screw keeps its own law (Cdw, M4:
    // trailing free with the turbine cut out). With no way (u = 0) every state gives exactly 0.
    stopped: { state: 'held', aft: 0.5985 / 0.6545, uB: 6 * KN, free: 0.045,
      trail: [[0, 0.045], [0.0334, 0.0790], [0.2555, 0.3066], [0.4516, 0.4776], [0.6047, 0.6382], [0.7484, 0.7769], [0.9081, 0.9072], [1, 0.998]] },
    // MMG rudder interaction (Yasukawa and Yoshimura 2015 typical values; t_R from Kijima 1990): research note M1, M2
    // (kappa, the share of the centre screw's race acceleration that reaches the rudder, typically 0.5, is fitted: SHIP.fit)
    tR: 1 - (0.28 * 0.666 + 0.55), aH: 0.25, xH: -0.45, xR: -0.5, gamR: 0.5, lR: -0.9, xP: -0.48,
    // engines: rates from H. I. Cone (US Navy, 1912), via Halpern: 10-20 s to stop and start astern, 30-50 s more to back hard [bet]
    engine: { down: 5.0, up: 1.0, astern: 1.5, dead: 5.0, turbineTau: 10, spinDownTau: 30 },
    // fitted to the 1911-12 trials by tools/calibrate_motion.js (values and residuals in its output)
    // 2026-11-16 (P1): two points 37.3 s helm only, tactical diameter 1,175 m, stop 914 m: { uRk: 1.60, cd: 2.7, fA: 0.518, kap: 0.5 }
    // M2 (the same day): refitted to the handling consensus of the three sisters' record (docs/research/
    // RESEARCH_handling_consensus_v1_2026-11-16.md; experiments e7, e8): two points in 37.00 s at 74 rpm with both engines
    // rung full astern at the helm order (35.5 s with the helm alone), tactical diameter 1,173.5 m at 20 kn, the 11-kn circle
    // 1.03 times it, stop 914 m from 60 rpm. kap fell from MMG's typical 0.5: the record says the centre screw's race
    // mattered little to her steering, and with 0.5 no drag gave both the 37 s and the trial circle: { uRk: 1.8125, cd: 2.4281,
    // fA: 0.518, kap: 0.0458 }. M3 and M4 (2026-11-17): refitted with the resistance's shape, the B-series' astern law, the
    // centre screw's windmilling drag and the trial's slow reversal (its 914 m now under TRIAL_1912), the trial measures
    // interpolated between steps
    fit: { uRk: 1.8225, cd: 2.4774, fA: 0.6501, kap: 0.0552 },
    // The calibration epoch's C1 (QC A-6): her mass under way counts the pockets' water too (W6's bunker while it holds,
    // G7's tank for good), through C.eachWater. 0 is the sum of sim.vol alone, as before, to the bit; 1 lands with the
    // epoch's ONE refit (D4), since it moves the watch.
    massPockets: 1,   // the calibration epoch's landing (D4): on
  };
  // engine-order telegraph, open water (Captain Smith, Hawke inquiry: Full about 75, Half 50, Slow 30; fact sheet section 4)
  const TELEGRAPH = {
    'full ahead': 75, 'half ahead': 50, 'slow ahead': 30, 'dead slow ahead': 20, 'stop': 0,
    'dead slow astern': -20, 'slow astern': -30, 'half astern': -50, 'full astern': -75,
  };

  // ------------------------------------------------------- derived constants
  function derive(fitOverride, engineOverride) {
    const S = Object.assign({}, SHIP, { fit: Object.assign({}, SHIP.fit, fitOverride || {}), engine: Object.assign({}, SHIP.engine, engineOverride || {}) });
    const L = S.L, d = S.d, B = S.B;
    const CB = S.m / RHO / (L * B * d), k = 2 * d / L, cbl = CB * B / L;
    const MU = 0.5 * RHO * L * L * d;
    const mp = S.m / MU, mxp = 0.04 * mp;
    const r2 = (d / L) * (d / L), bl2 = (B / L) * (B / L);
    // added masses: Clarke, Gedling and Hine 1983 (via Fossen's MSS; research note M2c, M3); surge 4 % [bet]
    const myp = Math.PI * r2 * (1 + 0.16 * CB * B / d - 5.1 * bl2) * (L / d);
    const Jzp = Math.PI * r2 * (1 / 12 + 0.017 * CB * B / d - 0.33 * B / L) * (L / d);
    const H = {
      CB, mx: mxp * MU, my: myp * MU, Jz: Jzp * MU * L * L,
      // linear terms: Kijima 1990 in Yoshimura 2009's v-form (three reproductions agree; research note M2a, M10)
      Yv: -(0.5 * Math.PI * k + 1.4 * cbl), YR: 0.5 * cbl + mxp, Nv: -k, NR: -0.54 * k + k * k,
      Xvr: (2.86 * cbl - 0.21) - myp,                         // Yoshimura, Nakao and Ishibashi 2009, Eq. 17
      // cross-flow drag by strips (the same paper, Eqs. 9 and 19-21), extrapolated to L/B 9.2 and scaled by the fit
      CD: (-0.0591 * (L / d) + 1.848) * S.fit.cd, CrY: 0.520 * (L / B) - 1.062, CrN: 0.0742 * (L / d) - 0.297,
      NS: 40,
    };
    // screws: fix each screw's K_T slope so that the calibration point balances the hull resistance
    const u0 = S.cal.kn * KN, n0 = S.cal.rpm / 60, sc = [S.wing, S.wing, S.centre];
    const ns = [n0, n0, n0 * S.turbineRatio], scr = [];
    for (let i = 0; i < 3; i++) {
      const p = sc[i], D2 = p.D * p.D, D4 = D2 * D2, J = u0 * (1 - p.w) / (ns[i] * p.D);
      const T = S.cal.share[i] * S.cR * u0 * u0 * gR(S, u0) / (1 - S.tP);
      scr.push({ D: p.D, D3: D2 * p.D, D4, w: p.w, J0: p.J0, a: T / (RHO * ns[i] * ns[i] * D4 * (1 - J / p.J0)), A: Math.PI * D2 / 4 });
    }
    const lam = S.rudder.H * S.rudder.H / S.rudder.A;
    const R = { fa: 6.13 * lam / (lam + 2.25), eta: S.centre.D / S.rudder.H };
    return { S, H, scr, R };
  }
  // the resistance's shape at speed |u| (SHIP.resist): a cubic by Horner's rule, no Math.pow
  function gR(S, au) {
    const P = S.resist; let x = au / P.uB;
    if (x < P.x0) x = P.x0; else if (x > P.x1) x = P.x1;
    return P.g[0] + x * (P.g[1] + x * (P.g[2] + x * P.g[3]));
  }
  let DEF = derive();

  // ---------------------------------------------------------------- state
  function create(opts) {
    opts = opts || {};
    const K = opts.fit || opts.engine ? derive(opts.fit, opts.engine) : DEF;   // engine: other reversing rates (a trial's handling)
    const m = {
      K, t: 0, u: 0, v: 0, r: 0, X: 0, Y: 0, psi: (opts.heading || 0) * DEG,
      del: 0, delCmd: 0,
      nP: 0, nS: 0, nC: 0, deadP: 0, deadS: 0, setP: 0, setS: 0, turbine: false,
      mass: K.S.m, xG: K.S.xG, KG: K.S.KG, IzG: K.S.m * 0.0625 * K.S.L * K.S.L,   // with flood water when attached (syncMass)
      ay: 0, dv: 0, dr: 0, du: 0, Fn: 0, TP: 0, TS: 0, TC: 0, inflow: 0, couple: opts.couple !== false,
    };
    if (opts.order !== undefined || opts.rpm !== undefined || opts.knots !== undefined) {
      let rpm = opts.rpm !== undefined ? opts.rpm : (typeof opts.order === 'number' ? opts.order : TELEGRAPH[opts.order || 'stop']);
      if (opts.knots !== undefined) rpm = rpmFor(m, opts.knots);
      setOrder(m, rpm, rpm);
      m.nP = m.nS = rpm; m.turbine = turbineRule(m); m.nC = m.turbine ? rpm * K.S.turbineRatio : 0;
      m.u = steadySpeed(m, rpm, rpm, m.turbine);
    }
    return m;
  }
  function setOrder(m, port, stbd) { m.setP = port; m.setS = stbd; }
  // the turbine is in only at Half or Full ahead (Fleming); reversing cuts it out (Wilding); noTurbine forces it out (a what-if)
  function turbineRule(m) { return !m.noTurbine && m.setP >= 50 && m.setS >= 50; }

  // straight-line steady speed for given shaft speeds: cR u^2 g(u) = (1 - tP) sum T(u). For a fixed g it is a quadratic,
  // solved exactly; g is then taken at that speed and the quadratic solved again until the speed stops changing (a
  // contraction: the shape changes slowly). With g = 1 the first solution is the answer.
  function steadySpeed(m, rpmP, rpmS, turbineIn) {
    const K = m.K, S = K.S, nn = [rpmP / 60, rpmS / 60, turbineIn ? 0.5 * (rpmP + rpmS) / 60 * S.turbineRatio : 0];
    let a0 = 0, a1 = 0, kc = 0;
    for (let i = 0; i < 3; i++) {
      const p = K.scr[i], n = nn[i];
      if (i === 2 && !turbineIn) { kc = (1 - S.tP) * 0.5 * RHO * S.centre.Cdw * p.A * (1 - p.w) * (1 - p.w); continue; }
      if (n <= 0) continue;
      a0 += (1 - S.tP) * RHO * p.D4 * p.a * n * n;
      a1 += (1 - S.tP) * RHO * p.D3 * p.a * n * (1 - p.w) / p.J0;
    }
    if (!(a0 > 0)) return 0;
    let u = -1;
    for (let it = 0; it < 200; it++) {
      const a2 = S.cR * gR(S, u < 0 ? S.cal.kn * KN : u) + kc, un = (-a1 + Math.sqrt(a1 * a1 + 4 * a2 * a0)) / (2 * a2);
      if (un === u) break;
      u = un;
    }
    return u;
  }
  function balanceTerms(m, rpm, turbineIn) {          // the coefficients of the quadratic, for an independent check (Abacus)
    const K = m.K, S = K.S, nn = [rpm / 60, rpm / 60, turbineIn ? rpm / 60 * S.turbineRatio : 0];
    const out = { cR: S.cR, tP: S.tP, screws: [], resist: { uB: S.resist.uB, x0: S.resist.x0, x1: S.resist.x1, g: S.resist.g.slice() } };
    for (let i = 0; i < 3; i++) { const p = K.scr[i]; out.screws.push({ n: nn[i], rhoD4a: RHO * p.D4 * p.a, D: p.D, w: p.w, J0: p.J0, A: p.A }); }
    out.centreDrag = turbineIn ? 0 : 0.5 * RHO * S.centre.Cdw * K.scr[2].A * (1 - K.scr[2].w) * (1 - K.scr[2].w);
    return out;
  }
  function rpmFor(m, knots) {                         // the shaft speed whose steady speed is `knots` (bisection, turbine rule applied)
    let lo = 0, hi = 90;
    for (let i = 0; i < 60; i++) { const mid = 0.5 * (lo + hi); if (steadySpeed(m, mid, mid, mid >= 50) / KN < knots) lo = mid; else hi = mid; }
    return 0.5 * (lo + hi);
  }

  // ---------------------------------------------------------------- engines
  function shaft(n, set, dead, dt, E) {               // returns [n, dead]; n in rpm
    if (dead > 0) return [n, dead - dt];
    if (n !== 0 && (set === 0 || (set > 0) !== (n > 0))) {           // stopping, or must reverse: run down first
      const dn = E.down * dt;
      if ((n > 0 ? n : -n) <= dn) return [0, set !== 0 ? E.dead : 0];  // valve gear reversed: a dead time
      return [n > 0 ? n - dn : n + dn, 0];
    }
    const up = set < 0 ? E.astern : E.up, rate = ((set > 0 ? set : -set) > (n > 0 ? n : -n)) ? up : E.down;
    const dn = rate * dt;
    if (set > n) return [n + dn < set ? n + dn : set, 0];
    return [n - dn > set ? n - dn : set, 0];
  }
  // the crash-back quadrant's shape C_T*(x) / C_T*(0), x in degrees (0 bollard, 90 held), linear between the table's 5 degrees
  function asternShape(As, x) {
    let i = Math.floor(x / 5); if (i > 17) i = 17; else if (i < 0) i = 0;
    const c = As.ct, f = (x - 5 * i) / 5;
    return (c[i] + f * (c[i + 1] - c[i])) / c[0];
  }
  // M7: the share of the held screw's drag that a stopped screw gives in its state (SHIP.stopped), at her speed |u|
  function stoppedShare(St, au) {
    if (St.state === 'held') return 1;
    if (St.state === 'free') return St.free;
    const b2 = St.uB * St.uB, u2 = au * au;
    if (u2 <= b2) return 1;                          // 'trail' below uB: the friction holds it
    const r = b2 / u2, T = St.trail;                 // the friction over the held screw's torque; u2 > b2 > 0 here
    for (let i = 1; i < T.length; i++) if (r <= T[i][0]) return T[i - 1][1] + (r - T[i - 1][0]) / (T[i][0] - T[i - 1][0]) * (T[i][1] - T[i - 1][1]);
    return 1;
  }
  // St: SHIP.stopped when the shaft is stopped by order (M7), else null
  function screwThrust(p, n, u, w, fA, As, held, St) {   // n in rev/s; ahead: linear K_T in J; astern: SHIP.astern
    const Va = u * (1 - w);
    if (n > 0) return RHO * p.D4 * p.a * (n * n - n * Va / (p.D * p.J0));
    if (n < 0) {
      if (Va > 0) {                                  // she still goes ahead: the crash-back quadrant
        const x = C.atan2(Va, PI07 * -n * p.D) / DEG;
        return -RHO * p.D4 * p.a * fA * asternShape(As, x) * (n * n + Va * Va / (PI07 * PI07 * p.D * p.D));
      }
      return -RHO * p.D4 * p.a * fA * (n * n - n * Va / (p.D * p.J0));   // sternway
    }
    if (held && As.held && Va > 0) return -RHO * p.D4 * p.a * fA * asternShape(As, 90) * Va * Va / (PI07 * PI07 * p.D * p.D);
    if (St && Va !== 0) {                            // M7: stopped by order, it drags by its state
      const h = RHO * p.D4 * p.a * fA * asternShape(As, 90) * Va * Va / (PI07 * PI07 * p.D * p.D) * stoppedShare(St, u < 0 ? -u : u);
      return Va > 0 ? -h : h * St.aft;
    }
    return 0;
  }

  // ---------------------------------------------------------------- forces and integration
  function accelerations(m, extX, extY, extN) {
    const K = m.K, S = K.S, H = K.H, R = K.R, L = S.L, d = S.d;
    const u = m.u, v = m.v, r = m.r, U2 = u * u + v * v, U = Math.sqrt(U2), au = u < 0 ? -u : u;
    // hull: Yoshimura 2009 unified form (no division by speed): linear terms in velocity products plus cross-flow by strips
    let sy = 0, sn = 0;
    const NS = H.NS, dx = L / NS;
    for (let i = 0; i < NS; i++) {
      const x = -0.5 * L + (i + 0.5) * dx, a = v + H.CrY * r * x, b = v + H.CrN * r * x;
      sy += (a < 0 ? -a : a) * a * dx; sn += (b < 0 ? -b : b) * b * x * dx;
    }
    const YH = 0.5 * RHO * L * d * (H.Yv * v * au + H.YR * L * r * u) - 0.5 * RHO * d * H.CD * sy;
    const NH = 0.5 * RHO * L * L * d * (H.Nv * v * u + H.NR * L * r * au) - 0.5 * RHO * d * H.CD * sn;
    const XH = -S.cR * u * au * gR(S, au) + 0.5 * RHO * L * d * H.Xvr * v * r * L;
    // screws
    const beta = U > 1e-9 ? C.atan2(-v, u) : 0, rp = U > 0.1 ? r * L / U : 0;
    const bP = beta - S.xP * rp, wC = S.centre.w * C.exp(-4 * bP * bP);
    const fA = S.fit.fA;
    const pl = m.plant;                             // what the machinery can do (core/systems.js); null: everything works
    // M7: a wing shaft at rest, out of a reversal's dead time, with its order (as far as the plant can carry it out) at Stop
    const stP = m.nP === 0 && !(m.deadP > 0) && (pl ? limited(m.setP, pl.nMax[0]) : m.setP) === 0 ? S.stopped : null;
    const stS = m.nS === 0 && !(m.deadS > 0) && (pl ? limited(m.setS, pl.nMax[1]) : m.setS) === 0 ? S.stopped : null;
    const TP0 = screwThrust(K.scr[0], m.nP / 60, u, S.wing.w, fA, S.astern, m.deadP > 0, stP), TS0 = screwThrust(K.scr[1], m.nS / 60, u, S.wing.w, fA, S.astern, m.deadS > 0, stS);
    const VAc = u * (1 - wC);
    const TC0 = m.turbine ? screwThrust(K.scr[2], m.nC / 60, u, wC, fA, S.astern, false) : -0.5 * RHO * S.centre.Cdw * K.scr[2].A * VAc * (VAc < 0 ? -VAc : VAc);
    // a screw out of the water pushes nothing: its thrust goes with the share of its disc under water [bet: no ventilation law]
    const TP = pl ? TP0 * pl.imm[0] : TP0, TS = pl ? TS0 * pl.imm[2] : TS0, TC = pl ? TC0 * pl.imm[1] : TC0;
    const XP = (1 - S.tP) * (TP + TS + TC);
    const NP = S.wing.y * (1 - S.tP) * (TP - TS);                  // port screw ahead swings the head to starboard
    let X, Y, N;
    if (u >= 0) {
      // rudder in the centre screw's race: momentum theory written with the thrust (no 1/n: research note M7)
      const ui = Math.sqrt(Math.max(0, VAc * VAc + 8 * TC / (RHO * Math.PI * S.centre.D * S.centre.D)));
      const q = VAc + S.fit.kap * (ui - VAc);
      const uR = S.fit.uRk * Math.sqrt(R.eta * q * q + (1 - R.eta) * VAc * VAc);
      const vR = U * S.gamR * (beta - S.lR * rp), UR2 = uR * uR + vR * vR, UR = Math.sqrt(UR2);
      let CN = UR > 1e-6 ? R.fa * (C.sin(m.del) * uR - C.cos(m.del) * vR) / UR : 0;   // f_alpha sin(alpha_R), without atan2
      if (CN > 1.3) CN = 1.3; else if (CN < -1.3) CN = -1.3;                        // stall [bet]
      let FN = 0.5 * RHO * S.rudder.A * UR2 * CN;
      if (pl) FN *= pl.rudImm;                      // only the rudder's area under water works
      const cd = C.cos(m.del);
      X = XH + XP - (1 - S.tR) * FN * C.sin(m.del) - RHO * m.inflow * u + extX;   // the ingested water must be brought to speed
      Y = YH - (1 + S.aH) * FN * cd + extY;
      N = NH + NP - (S.xR + S.aH * S.xH) * L * FN * cd + extN;
      m.Fn = FN;
    } else {
      // Sternway (M1). The water meets the rudder from aft, so the MMG terms written for headway do not apply: the
      // magnitude uR and the drift angle beta (which turns to 180 degrees) made a side force of their own and none
      // from the rudder. Written instead with the water's velocity at the rudder as a vector, signed: uRs > 0 when it
      // moves aft. The rudder leads, so nothing straightens the flow (gamma_R = 1, l_R at the rudder's own place) and
      // the hull adds nothing to its force (t_R = a_H = 0) [bet]. Its trailing edge now meets the water first: half the
      // lift slope [bet]. The centre screw's race, if the turbine still drives it, is added as at u = 0 ahead.
      const ui0 = Math.sqrt(Math.max(0, 8 * TC / (RHO * Math.PI * S.centre.D * S.centre.D)));
      const uRs = u + S.fit.uRk * Math.sqrt(R.eta) * S.fit.kap * ui0;
      const vRs = -(v + r * S.xR * L), UR2 = uRs * uRs + vRs * vRs, UR = Math.sqrt(UR2);
      let CN = UR > 1e-6 ? S.asternLift * R.fa * (C.sin(m.del) * uRs - C.cos(m.del) * vRs) / UR : 0;
      if (CN > 1.3) CN = 1.3; else if (CN < -1.3) CN = -1.3;
      let FN = 0.5 * RHO * S.rudder.A * UR2 * CN; if (pl) FN *= pl.rudImm;
      const cd = C.cos(m.del);
      X = XH + XP - FN * C.sin(m.del) - RHO * m.inflow * u + extX;
      Y = YH - FN * cd + extY;
      N = NH + NP - S.xR * L * FN * cd + extN;
      m.Fn = FN;
    }
    // equations of motion about amidships (MMG standard, Eq. 4), with the flood water in the mass
    const M = m.mass, xG = m.xG, MX = M + H.mx, MY = M + H.my;
    const M22 = m.IzG + H.Jz + xG * xG * M, M12 = xG * M, DET = MY * M22 - M12 * M12;
    const du = (X + MY * v * r + xG * M * r * r) / MX;
    const bY = Y - MX * u * r, bN = N - xG * M * u * r;
    m.du = du; m.dv = (bY * M22 - M12 * bN) / DET; m.dr = (MY * bN - M12 * bY) / DET;
    m.ay = m.dv + u * r; m.TP = TP; m.TS = TS; m.TC = TC;
  }
  // an order the engines cannot obey for want of steam (or water in their room) is carried out as far as they can
  function limited(set, L) { return (set < 0 ? -set : set) <= L ? set : (set > 0 ? L : -L); }
  function advance(m, dt) {                         // engines and rudder, then velocities, then positions (semi-implicit)
    const S = m.K.S, E = S.engine, pl = m.plant;
    let o = shaft(m.nP, pl ? limited(m.setP, pl.nMax[0]) : m.setP, m.deadP, dt, E); m.nP = o[0]; m.deadP = o[1];
    o = shaft(m.nS, pl ? limited(m.setS, pl.nMax[1]) : m.setS, m.deadS, dt, E); m.nS = o[0]; m.deadS = o[1];
    const tin = turbineRule(m) && m.nP > 40 && m.nS > 40 && (!pl || pl.turbine);   // the turbine also needs its room dry
    m.turbine = tin;
    const tgt = tin ? 0.5 * (m.nP + m.nS) * S.turbineRatio : 0, tau = tin ? E.turbineTau : E.spinDownTau;
    m.nC += (tgt - m.nC) * (dt / tau);
    // the steering engines move the rudder only with steam; without it the rudder stays where it is
    const rate = pl ? S.rudder.rate * DEG * dt * pl.steerRate : S.rudder.rate * DEG * dt, lim = S.rudder.max * DEG;
    const cmd = pl && !pl.steer ? m.del : (m.delCmd > lim ? lim : (m.delCmd < -lim ? -lim : m.delCmd));
    m.del += cmd - m.del > rate ? rate : (cmd - m.del < -rate ? -rate : cmd - m.del);
    m.u += m.du * dt; m.v += m.dv * dt; m.r += m.dr * dt;
    m.psi += m.r * dt;
    const c = C.cos(m.psi), s = C.sin(m.psi);
    m.X += (m.u * c - m.v * s) * dt; m.Y += (m.u * s + m.v * c) * dt;
    m.t += dt;
  }
  // standalone (no flooding core): the trials and the fit use this
  function stepAlone(m, dt, ext) { accelerations(m, ext ? ext.X : 0, ext ? ext.Y : 0, ext ? ext.N : 0); advance(m, dt); }

  // ---------------------------------------------------------------- the core
  // the turning moment on roll, in the CORE's sign (starboard down positive): a turn to starboard (ay > 0) heels her to port
  function heelMoment(m) { return -m.mass * m.ay * (m.KG - m.K.S.zH * m.K.S.d); }
  function syncMass(sim, m) {                       // ship plus flood water: mass, centre, and the water's yaw inertia
    let mw = 0, mx = 0, Iw = 0, M, xG;
    if (SHIP.massPockets && sim.pockets && sim.pockets.length) {   // C1: every body of water, the pockets' too
      C.eachWater(sim, (V, x) => { const w = RHO * V; if (w > 0) { mw += w; mx += w * x; } }, true);
      M = sim.ms + mw; xG = (sim.ms * sim.g0[0] + mx) / M;
      C.eachWater(sim, (V, x) => { const w = RHO * V; if (w > 0) { const e = x - xG; Iw += w * e * e; } }, true);
    } else {
      for (let n = 0; n < C.NN; n++) { const w = RHO * sim.vol[n]; if (w > 0) { mw += w; mx += w * sim.cx[n]; } }
      M = sim.ms + mw; xG = (sim.ms * sim.g0[0] + mx) / M;
      for (let n = 0; n < C.NN; n++) { const w = RHO * sim.vol[n]; if (w > 0) { const e = sim.cx[n] - xG; Iw += w * e * e; } }
    }
    const e0 = sim.g0[0] - xG, L = m.K.S.L;
    // yaw inertia about the combined centre: the ship's own (radius of gyration L/4, MMG standard) moved by e0, plus the water's
    m.mass = M; m.xG = xG; m.IzG = sim.ms * (0.0625 * L * L + e0 * e0) + Iw;
    m.KG = sim.KG; m.inflow = sim.inflow;
  }
  // P5, flooding at speed (Tier 0 of docs/BRAINSTORM_ship_under_way_v1_2026-11-16.md, section 5): the sea's pressure at
  // each hull opening while she moves, through the core's seam hx (the outside level, m above the calm sea). In her frame
  // the flow is steady, so the outside level rises by C_p U^2 / 2g, U the water's speed past the opening and C_p the
  // stagnation share of the plating's angle to that flow: sin^2 of the angle at which the water meets the plate, 1
  // head-on, about 0.02 along the 1912 damage (6 to 9 degrees to the centreline), and 0 where the water leaves the plate
  // (no suction: Tier 0) [bet]. A crushed bow faces the flow: C_p 1 ahead [bet]. Near the stem the bow wave adds its rise:
  // SEAFLOW.bowWave U^2 / 2g at the stem (the brainstorm's 3 to 4.5 m at 22 knots and about 1 m at 10), falling to
  // nothing SEAFLOW.bowLen m aft, and with depth as exp(-g d / U^2) (0.60 at 7 m at 22.5 knots, 0.07 at 10) [bets]. The
  // discharge factor cm stays 1: the loss of a compact hole in a cross-flow (the brainstorm's 5.3) waits for its source.
  // Stopped, every head is 0 and the core's bits are as before.
  const SEAFLOW = { on: true, bowWave: 0.55, bowLen: 30 };   // on: false for experiments only (e24)
  function seaHeads(sim) {
    const m = sim.mo, ops = sim.openings, S = sim.conn;
    if (!ops.length || !SEAFLOW.on) return;
    const u = m.u, v = m.v, r = m.r, twoG = 2 * G;
    const moving = u !== 0 || v !== 0 || r !== 0;
    const F = moving ? (sim._F && sim._F.R20 !== undefined ? sim._F : C.frameOf(sim)) : null;   // her pose at the last step
    for (let i = 0; i < ops.length; i++) {
      const o = ops[i], c = o.conn; if (c < 0) continue;
      if (!moving) { S.hx[c] = 0; continue; }
      if (o.nx === undefined) {                     // the plating's outward normal in MMG axes (x forward, y to starboard)
        const sg = o.y >= 0 ? 1 : -1;
        if (o.label && o.label.indexOf('bow:') === 0) { o.nx = 1; o.ny = 0; }      // a crushed bow faces ahead
        else {
          // G24: on the ship's own hull, her ends with it (every watch's openings lie below 11.0 m, where it is the same)
          const H = sim.ship.hull, hx = (C.halfBreadth(o.x + 0.5, o.z, H) - C.halfBreadth(o.x - 0.5, o.z, H)), nn = Math.sqrt(hx * hx + 1);
          o.nx = -hx / nn; o.ny = -sg / nn;
        }
      }
      const Vx = u + r * o.y, Vy = v + r * o.x, U2 = Vx * Vx + Vy * Vy;   // her velocity at the opening (y to port: y_mmg = -o.y)
      const wn = -(Vx * o.nx + Vy * o.ny);          // the water's velocity relative to her, along the outward normal
      let h = wn < 0 && U2 > 0 ? (wn * wn / U2) * U2 / twoG : 0;
      if (u > 0) {                                  // the bow wave
        const back = C.xFwd(o.z) - o.x;
        if (back < SEAFLOW.bowLen) {
          const d = -(F.R20 * o.x + F.R21 * o.y + F.R22 * o.z + F.tz), k = G / (u * u);
          h += SEAFLOW.bowWave * u * u / twoG * (1 - (back > 0 ? back : 0) / SEAFLOW.bowLen) * C.exp(-k * (d > 0 ? d : 0));
        }
      }
      S.hx[c] = h;
    }
  }
  function attach(sim, opts) { sim.mo = create(opts); syncMass(sim, sim.mo); return sim.mo; }
  function step(sim) {
    const m = sim.mo;
    syncMass(sim, m);
    accelerations(m, 0, 0, 0);
    if (m.couple) sim.xMph = heelMoment(m);
    seaHeads(sim);
    C.step(sim);
    advance(m, sim.params.dt);
  }

  // ---------------------------------------------------------------- orders
  function telegraph(sim, order, side) {
    const m = sim.mo || sim, rpm = typeof order === 'number' ? order : TELEGRAPH[order];
    if (rpm === undefined) throw new Error('unknown telegraph order: ' + order);
    if (side === 'port') m.setP = rpm; else if (side === 'starboard') m.setS = rpm; else { m.setP = rpm; m.setS = rpm; }
  }
  function rudder(sim, deg) { const m = sim.mo || sim; m.delCmd = deg * DEG; }      // + = to starboard (head to starboard)
  function helm1912(sim, order) {                   // tiller orders of 1912
    const t = { 'hard-a-starboard': -40, 'hard-a-port': 40, 'midships': 0, 'starboard': -15, 'port': 15 }[order];
    if (t === undefined) throw new Error('unknown helm order: ' + order);
    rudder(sim, t);
  }

  // ---------------------------------------------------------------- readouts and snapshots
  function readouts(sim) {
    const m = sim.mo || sim, U = Math.sqrt(m.u * m.u + m.v * m.v);
    let hdg = (m.psi / DEG) % 360; if (hdg < 0) hdg += 360;
    return {
      t: m.t, knots: U / KN, surgeKn: m.u / KN, heading: hdg, rotDegMin: m.r / DEG * 60, drift: U > 0.1 ? C.atan2(-m.v, m.u) / DEG : 0,
      rudder: m.del / DEG, rpmPort: m.nP, rpmStbd: m.nS, rpmCentre: m.nC, turbine: m.turbine,
      northNm: m.X / 1852, eastNm: m.Y / 1852, heel: sim.roll !== undefined ? sim.roll / DEG : null,
      thrustT: (m.TP + m.TS + m.TC) / 9964.02, rudderForceT: m.Fn / 9964.02,
    };
  }
  const KEYS = ['t', 'u', 'v', 'r', 'X', 'Y', 'psi', 'del', 'delCmd', 'nP', 'nS', 'nC', 'deadP', 'deadS', 'setP', 'setS', 'turbine', 'couple'];
  function serialize(sim) { const o = { core: C.serialize(sim), motion: {} }; for (const k of KEYS) o.motion[k] = sim.mo[k]; return o; }
  function restore(ship, d) { const sim = C.restore(ship, d.core); sim.mo = create({}); Object.assign(sim.mo, d.motion); syncMass(sim, sim.mo); return sim; }

  return {
    SHIP, TELEGRAPH, KN, DEG, derive, create, attach, step, stepAlone, accelerations, advance,
    steadySpeed, balanceTerms, rpmFor, telegraph, rudder, helm1912, heelMoment, syncMass, readouts, serialize, restore,
    seaHeads, SEAFLOW,
    setFit(fit) { DEF = derive(fit); },
  };
});
