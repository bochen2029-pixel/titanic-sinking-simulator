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
 *   - The hull is the core's own form: at each band's depth, a station every ICE.ds metres from stem to stern, both
 *     sides, using halfBreadth(x, z) at the pose when the encounter starts; each stands for ds metres of side. The
 *     torn stations of each metre are gathered into one opening for the flooding core (P3c).
 *   - Contact at a station: overlap = ice radius - distance of the (dented) hull point from the berg's centre.
 *     The interface force is the smaller of what the plating resists, q h (dent + overlap), and what the ice can carry
 *     before it crushes, p h, with p = p0 / sqrt(contact area) (the falling pressure-area relation of ice [bet: form]).
 *     A station's contact ramps in over its first ICE.aRamp metres of overlap (P3c: counted whole as soon as it
 *     touched, the area jumped as stations came and went, and the outcome followed the stations' spacing: e11).
 *     If the plating is weaker, it dents by the whole overlap; otherwise it dents to p/q and the ice outline crushes
 *     back by the rest. Dents and crushing are permanent.
 *   - A station whose dent exceeds dTear opens: a seam or plate tear of area alpha (dent - dTear) per metre of hull,
 *     handed to the core as an opening (addOpening, then setOpeningArea as it grows). Shallower dents are dents: no water.
 *   - Friction mu along the contact. The force acts on the ship (surge, sway, yaw, and roll about G through sim.xMph)
 *     and, reversed, on the berg. The berg also feels the water's drag.
 *   - A stem strike (added with P4): where her centreline itself is inside ice that faces her bow, the bow structure
 *     crushes at a force rising with the depth crushed (S1b) and the stem recedes; the compartments the crush reaches
 *     are open to the sea.
 *     Glancing touches such as the reconstructed 1912 one never meet this law (see ICE.bowF).
 * Far from the ice, Encounter.step is exactly Motion.step (checked by tools/encounter_tests.js).
 * Frame: as motion.js (MMG: x forward, y to starboard; earth x north, y east). Openings are written in the core's frame
 * (y to port), so a starboard station has y < 0.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./core.js'), require('./motion.js'));
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
    // fitted bets, not measurements. Searched again with P3c's contact law (e13, e14): q 24 MPa (it was 12), p0 and the
    // berg's mass as they were; with the 1912 geometry of core/night.js the damage then sinks her in 159 minutes.
    mass: 1e8, added: 0.5,  // berg mass, kg (100,000 t), and added-mass ratio [fitted bet: published estimates span 1e8 to over 1e9 kg]
    mu: 0.1,                // friction, ice on steel [bet]
    p0: 6e6,                // ice pressure at 1 m2 of contact, Pa; p = p0 / sqrt(A) [bet: order of ship-ice process pressures]
    q: 24e6,                // side-shell resistance, N per m2 of contact per m of dent [fitted bet]
    dTear: 0.2,             // dent at which riveted seams and plates open, m [bet]
    // P3b: where along the hull the seams open at another dent: [[xAft, xFwd, factor on dTear], ...] in the ship frame
    // (x forward from amidships, m), or [xAft, xFwd, factor at xAft, factor at xFwd] for a linear ramp; the first region
    // holding a station counts; null: the same everywhere (as before P3b's first use).
    // G6 (2026-11-20; docs/research/RESEARCH_br5_damage_extent_G6_v1_2026-11-20.md): along boiler room 5's own side,
    // from bulkhead F to the after end of its forward bunker (9 ft abaft bulkhead E), the seams open only at twice the
    // dent. What it rests on is the 1912 record, which ends the damage in that bunker:
    //   - the Report: "No. 5 boiler room was damaged at the ship's side in the starboard forward bunker", 2 ft from the
    //     bulkhead, and "In No. 4 boiler room there was no indication of any damage";
    //   - Barrett, BI 2105-2109: the stokehold's plates never covered.
    // [Fitted bet, and on any night but 1912 a bet: no structural source makes boiler room 5's side stronger than any
    // other (the shell's thickness along her length is not in the open record).] A dent never passes the ice's crushing
    // depth (p0 / q = 0.25 m), so twice the tearing dent (0.4 m) makes this stretch untearable by the side law on every
    // night; any factor from 2 gives the same 1912 night, and 2 is the least (e82).
    // Narrowed at G6b's landing (2026-11-20, join 6) from the whole hull aft of the bunker to boiler room 5's own side:
    // the wide rule stopped every night's tear aft of the bunker, which no source supports (the night suite's miss window,
    // the Carpathia suite's second contact). On the 1912 watch the ice dents boiler room 4 by 0.17 m at most and tears
    // nothing there either way, so the 1912 night is the same to the bit. A what-if switch to run a night without the
    // rule comes with G7.
    tearAlong: [[C.BULKHEADS.find(b => b.id === 'F').x, C.BULKHEADS.find(b => b.id === 'E').x - 9 * C.FT, 2]],
    // G6b (2026-11-20; docs/research/RESEARCH_damage_split_by_compartment_G6b_v1_2026-11-20.md, W6's design v1.3): where
    // along the hull a torn station's opening is scaled, in the form of tearAlong: [[xAft, xFwd, factor on alpha], ...]
    // or [xAft, xFwd, factor at xAft, factor at xFwd] for a ramp; the first region holding a station counts; null: 1
    // everywhere, and the openings keep their bits. The contact law dents every station to where the ice crushes back
    // (p0 / q, 0.25 m), so every torn metre opens alike and the split is only the length the tear crosses in each
    // compartment (e88). One factor per compartment over the 1912 damage's extent (from the stem to the end of boiler
    // room 5's bunker, 9 ft abaft bulkhead E; 1 elsewhere) makes the 1912 encounter share its opening as Hackett and
    // Bedford's areas do (JOM 1998, Table I: 4.8, 11.9, 24.6, 26.2, 22.2 and 10.3 %, the forepeak to boiler room 5), the
    // split the 1912 damage preset carries too (`TITANIC_SPLIT`) [fitted bet: their split is a flooding model's reading
    // of the record, not a measurement, and no structural source gives the factors]. Read physically, along the 1912
    // damage the shell opened less per metre forward, where the bow's frames are closer: 24 to 27 in apart in the
    // forepeak, 27 to 30 in hold 1, 30 to 33 in hold 2, 36 in from hold 3 aft (Olympic's frame spacing, Bob Read's
    // hull lines, Plan Sheet 8, 2010, CC BY-NC-ND 4.0: the numbers cited, nothing traced). The forepeak's and hold 1's
    // factors lie near the square of their spacing against amidships's (0.44 to 0.69); hold 2's and the bunker's are
    // not explained by it.
    openAlong: (() => { const x = (id) => C.BULKHEADS.find(b => b.id === id).x; return [[x('A'), 200, 0.4544], [x('B'), x('A'), 0.6002], [x('C'), x('B'), 1.2224], [x('D'), x('C'), 1.1508], [x('E'), x('D'), 0.9487], [x('E') - 9 * C.FT, x('E'), 3.0466]]; })(),
    // The calibration epoch's C6 (D82b; docs/research/RESEARCH_bunker_burst_head_W6_v1_2026-11-21.md on B1+B2's branch):
    // the bunker's own opening on a night, m2, a what-if through the night's own ice overrides (spec.ice) as tearAlong's
    // switch is. With bunkerOpen given, the torn stations of her starboard side along bunkerAlong (boiler room 5's
    // forward bunker, 9 ft abaft bulkhead E: openAlong's last region) open bunkerOpen between them, each in proportion
    // to its dent beyond the tearing dent, whatever alpha and openAlong say there; every other station opens as it
    // does. The total is bunkerOpen exactly from the first step in which a station tears there: it does not grow in
    // with the dents while the ice crosses the bunker (a third of a second at 22 knots), and a night whose tear never
    // reaches the bunker opens nothing there. null: the region opens by alpha and openAlong, and every night keeps its
    // bits. It sets the region's stations, as the summary counts them by compartment; a metre of hull is one opening
    // (syncOpenings), so the metres that straddle the bunker's two ends carry part of it to their own places, as they
    // do without it (on the 1912 night about 73 % of the region's opening lies in the pocket, 13 % in boiler room 5's
    // stokehold and 14 % in boiler room 6).
    bunkerAlong: [C.BULKHEADS.find(b => b.id === 'E').x - 9 * C.FT, C.BULKHEADS.find(b => b.id === 'E').x],
    bunkerOpen: 0.07609,   // the calibration epoch's landing (D4; D90): the history match's candidate C, as core/scenarios.js's BUNKER_OPEN_1912 (null before: the region's share)
    // m2 of opening per m of hull per m of dent beyond dTear: a seam gap of about 14 % of the excess dent. Fitted so that
    // the 1912 encounter opens the core's calibrated 0.7506 m2 (a fixed point: the holes change her motion a little
    // during the contact, and so the damage; tools/calibrate_encounter.js finds it, tools/encounter_tests.js checks it).
    // Refitted 2026-11-16 when the berg's drag was added (it had been 0.14326), and again the same day when the handling
    // was refitted to the sisters' consensus and the 1912 geometry with it (M2, e9: the tear now runs x 127 to 29, 98 m,
    // where it ran 69 m; it had been 0.14448247622448618), and again with P3c's contact law, its q and its 1912 geometry
    // (e13, e14; it had been 0.10976148390199011), and again with M3 and M4's handling and the 1912 geometry found with it
    // (e17; it had been 0.2069376129044827), and again with P5's sea pressure at the openings (the water let in during
    // the contact moves her a little; it had been 0.20714452400484218), and again with G6's tearAlong (boiler room 5's
    // stokehold side no longer torn: the same 0.7506 m2 opened forward of it; it had been 0.20701033996361745), and
    // again with G6b's openAlong and the area that calibration then found, 0.7853 m2 (it had been 0.21936823156251853),
    // and again with G7's forepeak tank and G11's widths and the area their refit found, 0.8196 m2 (rung 2b of
    // docs/research/RESULT_G7_ladder_v1_1_2026-11-21.md; it had been 0.23058811512419958).
    // The calibration epoch's landing (D4; D90): the fixed point at 0.9773 m2 on the ship with her ends, the landed
    // params, the bunker's opening and switches (node tools/calibrate_encounter.js). It was 0.24256786344109968 at 0.8196 m2.
    alpha: 0.2954447289602645,
    sub: 40,                // sub-steps a step while near the ice: the hull slides about half a station each (P3c, e11)
    // A stem strike. The bands above are a spur three metres thick; a ship that runs her stem into the berg meets its
    // whole face. Where her centreline is inside the ice and the ice faces her bow (within about 60 degrees of square),
    // the bow structure crushes along her axis at a force that rises with the depth crushed, F = bowF + bowFk s (s the
    // metres crushed so far), and the stem recedes to the ice. S1b (2026-11-17): the bow-crushing note's option B
    // (docs/research/RESEARCH_bow_crushing_head_on_v1_2026-11-17.md, section 6): a line through the mean of four
    // section-based crushing laws on her own bow (Amdahl 1983; Paik and Pedersen 1995; Zhang and Pedersen 2017; Minorsky
    // 1959 with frames), static 49 + 1.5 s MN, times 1.7 for mild steel's rate effects [derived there]. Against a fixed
    // face it crushes 28.8 m from 22.5 knots, Wilding's "80 or perhaps 100 feet" (British Inquiry Q20276, Q20280; 108-141 MN
    // as a constant), and 7.3 m from 10 knots, inside the section laws' 5.5-11.5 m (docs/research/experiments/e21). Until
    // S1b it was a constant 120 MN, which crushes too little in a slow strike (5.7 m at 10 knots). The one FE study of her
    // (Paik, Kim and Thomas 2025: riveted joints at reduced yield, rigid berg) gives about 62 MN on average, also rising with
    // depth, and 24.7 m at 10 knots: the weak end. Modern whole-ship laws (Pedersen 1993, 2020; 376-489 MN) were fitted to
    // welded bulbous bows: not used. The berg's face is rigid in a stem strike [bet, kept by S1b]: the side law's
    // p0/sqrt(A) would let the ice yield first up to about 400 m2 of contact (the note's section 4), but no ice law is
    // calibrated at the 100-500 m2 of a stem strike, and Wilding's estimate and the FE study both crush the bow against an
    // unyielding face; the Arizona (1879), where both gave way, crushed 6 m. The force acts along the ice's normal,
    // so an oblique blow also throws her head off. Between cosines 0.4 and 0.7 of the angle between that normal and her
    // axis the law fades in; more glancing touches are the side law's alone (the 1912 touch is one of those, and is
    // unchanged by this law). bowZ: the force's height above the keel, the centroid of the crushed section's steel,
    // 12.6-14.2 m over the first 5-40 m [derived, the note's section 3.3; it was 5.0, which put the force 5.8 m below her
    // centre of gravity and heeled her 17-27 degrees in an oblique strike, now 2-3]
    bowF: 84e6, bowFk: 2.5e6, bowCos0: 0.4, bowCos1: 0.7, bowZ: 13.0,
    bowOpen: 0.5,           // m2 of opening per metre of bow crushed, each side [bet: a crushed bow is open; the size matters little]
    bowMin: 0.5,            // m of crush before the forepeak is open [bet]
    // the berg's own resistance in the water: a blunt body, drag coefficient 1 on its breadth times its draft, the draft
    // from its mass as a slab of its own radius [bet]. Without it a pushed berg would coast for ever.
    cdBerg: 1.0,
    // P3b. The outline: nodes per band around the berg, joined by straight lines, fine enough that each hull station's
    // metre of side spans several (0.25 degree: 0.17 m of arc at 40 m). A crush clips the outline to the dented hull over
    // that metre's arc. Turning: the berg's moment of inertia is a disc of its spur's radius, a round body moves no water
    // turning (added 0) [bets], and the water slows its turning as it slows its drift, at the rim's speed [bet].
    nodes: 11520, turns: false, addedYaw: 0,
    // P3c (e11): refined together, stations every 0.125 m, the outline at the same arc per station, 40 sub-steps, and the
    // contact ramping in over 0.1 m of overlap [bet], the opened area converges and a course a fraction of a degree off
    // changes it under 2 % (it was 28 %); counting stations whole, it does not (10 % at the finest). Friction smooth
    // through zero sliding speed, over vSlip m/s [bet]. The berg's turning stays off: it made the outcome erratic (e10).
    aRamp: 0.1, vSlip: 0.1,
    ds: 0.125,              // m of hull each station stands for (its force, its contact and its opening scale with it)
    // X2 (2026-11-17): which stations the contact looks at. A station can matter only while it is nearer the berg's
    // centre than its band's radius as the berg was made (the outline only ever crushes back from there) plus the
    // smallest gap so far: farther off it neither touches the ice nor sets a new smallest gap. Such stations are passed
    // over: first a whole stretch of hull at a time (the berg's centre in her own axes gives the stretch that can be
    // within reach), then one by one by their distance. CULL_EPS of slack is tens of thousands of times the
    // arithmetic's rounding even 100 km from the origin, so nothing that could count is passed over, and the outcome is
    // the same to the last bit: tools/encounter_tests.js runs nights both ways (false: every station, every sub-step,
    // as it was until X2). A ship lying by the ice no longer pays for some 13,000 stations forty times a step.
    cull: true,
  };
  const CULL_EPS = 1e-6;                            // m
  // in a list that falls (the stations run from the stem aft): the first place not above v, and the first place below v
  function firstNotAbove(a, n, v) { let lo = 0, hi = n; while (lo < hi) { const mid = (lo + hi) >> 1; if (a[mid] > v) lo = mid + 1; else hi = mid; } return lo; }
  function firstBelow(a, n, v) { let lo = 0, hi = n; while (lo < hi) { const mid = (lo + hi) >> 1; if (a[mid] >= v) lo = mid + 1; else hi = mid; } return lo; }

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
    // the metre of hull each station belongs to: its opening is the metre's
    const gid = new Int32Array(xs.length), gx = [], gz = [], gn = [];
    for (let i = 0; i < xs.length; i++) {
      const m = Math.floor(xs[i]);
      if (!gx.length || Math.floor(gx[gx.length - 1] / gn[gn.length - 1]) !== m) { gx.push(0); gz.push(0); gn.push(0); }
      const g = gx.length - 1; gid[i] = g; gx[g] += xs[i]; gz[g] += zs[i]; gn[g]++;
    }
    for (let g = 0; g < gx.length; g++) { gx[g] /= gn[g]; gz[g] /= gn[g]; }
    return { depth, ds, n: xs.length, xs: Float64Array.from(xs), hb: Float64Array.from(hb), zs: Float64Array.from(zs), gid, ng: gx.length, gx: Float64Array.from(gx), gz: Float64Array.from(gz) };
  }

  // Attach an encounter. place: { ahead (m from the stem to the ice's edge along the heading), port (m the ice's edge
  // reaches to port of the ship's centreline track) }, or { X, Y } in the earth frame. ice: overrides of ICE.
  function create(sim, place, ice) {
    const P = Object.assign({}, ICE, ice || {}), m = sim.mo;
    const bands = P.depths.map(d => bandStations(sim, d, P.ds));
    // each station's tearing dent (P3b): dTear, or dTear times its region's factor
    for (const B of bands) {
      B.dt = new Float64Array(B.n);
      for (let i = 0; i < B.n; i++) {
        let f = 1;
        if (P.tearAlong) for (const [xa, xf, k, k2] of P.tearAlong) if (B.xs[i] >= xa && B.xs[i] < xf) { f = k2 === undefined ? k : k + (k2 - k) * (B.xs[i] - xa) / (xf - xa); break; }
        B.dt[i] = f === 1 ? P.dTear : P.dTear * f;
      }
      // G6b: each station's share of opening, alpha times its region's factor (P.openAlong, the form of tearAlong);
      // with none, every station's factor is 1 and the openings keep their bits
      if (P.openAlong) {
        B.fo = new Float64Array(B.n);
        for (let i = 0; i < B.n; i++) {
          let f = 1;
          for (const [xa, xf, k, k2] of P.openAlong) if (B.xs[i] >= xa && B.xs[i] < xf) { f = k2 === undefined ? k : k + (k2 - k) * (B.xs[i] - xa) / (xf - xa); break; }
          B.fo[i] = f;
        }
      }
      // C6: the stations of the bunker's own opening (P.bunkerOpen), marked only on a night that gives one
      if (P.bunkerOpen !== null && P.bunkerOpen !== undefined) {
        B.bk = new Uint8Array(B.n);
        for (let i = 0; i < B.n; i++) if (B.xs[i] >= P.bunkerAlong[0] && B.xs[i] < P.bunkerAlong[1]) B.bk[i] = 1;
      }
      // X2: the band's greatest half-breadth, and whether its stations fall from the stem aft (they do; the stretch of
      // hull within reach is found by halving, which needs it)
      B.hbMax = 0; B.desc = true;
      for (let i = 0; i < B.n; i++) { if (B.hb[i] > B.hbMax) B.hbMax = B.hb[i]; if (i && !(B.xs[i] < B.xs[i - 1])) B.desc = false; }
    }
    const R = P.depths.map((d, i) => P.R * (1 - P.taper * i));
    const rIce = R.map(r => new Float64Array(P.nodes).fill(r));
    let bX, bY;
    if (place.X !== undefined) { bX = place.X; bY = place.Y; }
    else {
      const c = C.cos(m.psi), s = C.sin(m.psi), along = C.xFwd(8) + place.ahead + R[0], across = R[0] - place.port;
      bX = m.X + along * c - across * s; bY = m.Y + along * s + across * c;
    }
    // dmax: the side's deepest dent in that band (X2; contact() keeps it: whoever else writes a dent must keep it too)
    const side = () => bands.map(b => ({ dent: new Float64Array(b.n), t0: new Float64Array(b.n).fill(-1), op: new Int32Array(b.ng).fill(-1), ga: new Float64Array(b.ng), dmax: 0 }));
    sim.enc = {
      P, bands, rIce, rTop: R, NB: P.nodes, Rmax: R[0], berg: { X: bX, Y: bY, VX: 0, VY: 0, X0: bX, Y0: bY, PSI: 0, W: 0 },
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
    let u = (C.atan2(ey, ex) + Math.PI - e.berg.PSI) / TWO_PI * n;
    u -= n * Math.floor(u / n);
    let j = Math.floor(u); if (j >= n) j = n - 1;
    const w = u - j;
    return [j, j + 1 === n ? 0 : j + 1, w];
  }
  // contact forces for the current ship and berg states; updates dents and the ice outline
  function contact(sim, m, e, dt) {
    const P = e.P, b0 = e.berg, c = C.cos(m.psi), s = C.sin(m.psi);
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
            const Fb = w * (P.bowF + P.bowFk * e.bow), stop = vn / (inv * dt), F = Fb < stop ? Fb : stop;
            const fx = F * nx, fy = F * ny;
            Fx += fx; Fy += fy; N += xs * c * fy - xs * s * fx;
            roll -= F * nys * (m.KG - P.bowZ);
            e.bow += w * vn * dt / cax;                                      // the stem recedes along her axis as fast as it closes
          }
        }
      }
    }
    const xFront = e.xStem - e.bow;                 // forward of this the hull is crushed away
    const far = e.Rmax + GAP_EXACT, far2 = far * far;
    // X2 (see ICE.cull): the berg's centre in her own axes, x0 forward and y0 to starboard of her origin
    const cull = P.cull !== false && e.rTop !== undefined;
    const rx = b0.X - m.X, ry = b0.Y - m.Y, x0 = rx * c + ry * s, y0 = ry * c - rx * s;
    for (let k = 0; k < e.bands.length; k++) {
      const B = e.bands[k], rI = e.rIce[k];
      for (let sd = 0; sd < 2; sd++) {
        const sg = sd === 0 ? 1 : -1, D = sd === 0 ? e.stbd[k] : e.port[k];
        let i0 = 0, i1 = B.n, lim2 = far2;
        if (cull) {
          // within reach: the band's radius as made, plus the smallest gap so far (it can only fall while this side is
          // gone through, so the reach taken here is never too short), and never beyond the old limit
          const reach = e.rTop[k] + (e.minGap > 0 ? e.minGap : 0) + CULL_EPS;
          let rw = far;
          if (reach < far) { lim2 = reach * reach; rw = reach; }
          if (B.desc && D.dmax !== undefined) {
            // this side's points lie between yLo and yHi off her centreline (a dent moves a point inboard, at most by
            // the side's deepest), so sideways they are no nearer the berg's centre than g; the stretch of hull that
            // can be within rw of it is then x0 - hw to x0 + hw, and nothing forward of the crushed bow counts
            rw += CULL_EPS;
            const yLo = sd === 0 ? -D.dmax : -B.hbMax, yHi = sd === 0 ? B.hbMax : D.dmax;
            const g = y0 > yHi ? y0 - yHi : (y0 < yLo ? yLo - y0 : 0);
            if (g > rw) continue;
            const hw = Math.sqrt(rw * rw - g * g);
            i0 = firstNotAbove(B.xs, B.n, xFront < x0 + hw ? xFront : x0 + hw); i1 = firstBelow(B.xs, B.n, x0 - hw);
          }
        }
        for (let i = i0; i < i1; i++) {
          const x = B.xs[i], y = sg * (B.hb[i] - D.dent[i]);
          if (x > xFront) continue;
          const Xw = m.X + x * c - y * s, Yw = m.Y + x * s + y * c;
          const ex = Xw - b0.X, ey = Yw - b0.Y;
          if (ex * ex + ey * ey > lim2) continue;   // out of reach: no force, and no part in the smallest gap (exact below GAP_EXACT)
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
          if (D.dent[i] > D.dmax) D.dmax = D.dent[i];
          if (D.t0[i] < 0) D.t0[i] = sim.t;
          f *= B.ds; area += P.h * B.ds * (P.aRamp > 0 ? (ov < P.aRamp ? ov / P.aRamp : 1) : 1);   // the station stands for ds metres of hull
          const nx = ex / dist, ny = ey / dist;
          // friction against the relative sliding velocity of the hull point
          const ub = m.u - m.r * y, vb = m.v + m.r * x;
          const Vx = ub * c - vb * s - b0.VX, Vy = ub * s + vb * c - b0.VY, vt = -Vx * ny + Vy * nx;
          const ft = P.vSlip > 0 ? -P.mu * f * C.tanh(vt / P.vSlip) : (vt > 0 ? -P.mu * f : (vt < 0 ? P.mu * f : 0));
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

  // C6: m2 of opening per m2 of torn excess (dent beyond the tearing dent, times the station's length) along the bunker
  // on her starboard side, so that those stations open P.bunkerOpen between them; -1 with no bunkerOpen, or while no
  // station is torn there
  function bunkerScale(e) {
    const P = e.P;
    if (P.bunkerOpen === null || P.bunkerOpen === undefined) return -1;
    let S = 0;
    for (let k = 0; k < e.bands.length; k++) {
      const B = e.bands[k], R = e.stbd[k];
      for (let i = 0; i < B.n; i++) if (B.bk[i]) { const ex = R.dent[i] - B.dt[i]; if (ex > 0) S += ex * B.ds; }
    }
    return S > 0 ? P.bunkerOpen / S : -1;
  }

  // hand torn stations to the flooding core: one opening per metre of hull, band and side, new or larger (P3c)
  function syncOpenings(sim, e) {
    const P = e.P;
    for (let sd = 0; sd < 2; sd++) {
      const D = sd === 0 ? e.stbd : e.port, kB = sd === 0 ? bunkerScale(e) : -1;
      for (let k = 0; k < e.bands.length; k++) {
        const B = e.bands[k], R = D[k], ga = R.ga;
        ga.fill(0);
        for (let i = 0; i < B.n; i++) { const ex = R.dent[i] - B.dt[i]; if (ex > 0) ga[B.gid[i]] += kB >= 0 && B.bk[i] ? kB * ex * B.ds : (B.fo ? P.alpha * ex * B.ds * B.fo[i] : P.alpha * ex * B.ds); }
        for (let g = 0; g < B.ng; g++) {
          if (ga[g] <= 0) continue;
          if (R.op[g] < 0) {
            const z = B.gz[g], x = B.gx[g], yc = C.halfBreadth(x, z) + 0.02;
            R.op[g] = C.addOpening(sim, { x, y: sd === 0 ? -yc : yc, z, area: ga[g], kind: 'breach', label: 'ice:' + k + ':' + sd + ':' + g, tOpen: 0 }).id;
          } else C.setOpeningArea(sim, R.op[g], ga[g]);
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
    Mo.seaHeads(sim);                              // P5: the sea's pressure at the openings while she moves
    C.step(sim);
  }

  // what happened, for tests and the viewer
  function summary(sim) {
    const e = sim.enc, P = e.P, out = { minGap: e.minGap, tFirst: e.tFirst, dur: e.tFirst < 0 ? 0 : e.tLast - e.tFirst, Fmax: e.Fmax,
      bergMoved: Math.sqrt((e.berg.X - e.berg.X0) * (e.berg.X - e.berg.X0) + (e.berg.Y - e.berg.Y0) * (e.berg.Y - e.berg.Y0)), bergTurned: e.berg.PSI / DEG, crushed: e.crushed };
    for (const [name, D] of [['stbd', e.stbd], ['port', e.port]]) {
      let tears = 0, dents = 0, area = 0, excess = 0, xT0 = null, xT1 = null, xD0 = null, xD1 = null, dmax = 0;
      const zone = new Float64Array(16), kB = name === 'stbd' ? bunkerScale(e) : -1;   // C6
      for (let k = 0; k < e.bands.length; k++) {
        const B = e.bands[k], R = D[k];
        for (let i = 0; i < B.n; i++) {
          const d = R.dent[i]; if (d <= 0) continue;
          const x = B.xs[i]; if (d > dmax) dmax = d;
          if (xD0 === null || x > xD0) xD0 = x; if (xD1 === null || x < xD1) xD1 = x;
          if (d > B.dt[i]) {
            tears++; excess += d - B.dt[i]; const a = kB >= 0 && B.bk[i] ? kB * (d - B.dt[i]) * B.ds : (B.fo ? P.alpha * (d - B.dt[i]) * B.ds * B.fo[i] : P.alpha * (d - B.dt[i]) * B.ds); area += a; zone[C.zoneAt(x)] += a;
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
