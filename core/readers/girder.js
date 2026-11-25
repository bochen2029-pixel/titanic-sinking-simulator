/*
 * The hull girder's gauge (step 7a of docs/BRAINSTORM_the_whole_night_v1_2026-11-17.md): her weight along her length,
 * and the bending moment of her hull at any instant, as pure functions of the ship and a sim's state at that instant.
 *
 *   weight(sim)          the weight curve w(x) in the research note's layers (machinery by room, coal, cargo, people, the
 *                        hull as Prohaska's trapezoid, the remainder), closed to the model's own mass and centre exactly
 *                        (sim.ms, sim.g0), each layer with the height its weight acts at
 *   moment(sim, opts)    the bending moment and the shear at stations from bulkhead K to bulkhead J (x -27.1 to -16.2,
 *                        the break band) and along the whole hull, hogging positive; the governing station (the largest
 *                        moment in the band, over capacity), where its moment stands against the studies' range (below,
 *                        within, above 4.0 to 5.4 GN m); the beam form beside the exact one, as a cross-check
 *   capacity(x, M0)      what the girder can bear in hogging at x: 4.6 GN m central; with opts.joint, 10 % less near the aft
 *                        expansion joint (a bet, off by default)
 *   describe(res)        "hull 4.3 GN m, hogging at bulkhead J"
 *
 * Defaults (the coordinator's decisions of 2026-11-17, 21:20 CST, on this lane's finding): the weight curve with Prohaska's
 * a fitted to the panel's C-7 moment (PROHASKA_A below: 0.660 since the landing, D92; the note's 0.566 stays
 * selectable, VARIANTS.note); the
 * moment relieved by her inertia (opts.reading 'relieved'; 'stern' gives the note's definition); no knock-down for the
 * joint (opts.joint). A gauge shows the moment against the studies' range, not as a share of one capacity.
 *
 * It is not a reader in the registering sense: it keeps no state and owns no orders. It lives in core/readers/ because the
 * build bundles that folder after core/night.js, into the page and the forecast worker alike. Nothing here writes into a
 * sim: no event, no flag, no cache on it (the caches are keyed by the ship and the mass properties, outside the sim). It
 * breaks nothing: there is no break in this step, only the gauge.
 *
 * The two forms of the moment (docs/research/RESEARCH_breakup_hull_girder_v1_2026-11-17.md, section 9a):
 *   exact   about the section's neutral axis at the station (x_b, y 0, z_NA in the ship frame), the moment of every force
 *           on the part of her aft of x_b at its own point: the weights at their blocks' centroids and heights, the flood
 *           water in each column at its centroid, each column's buoyancy at its centre of buoyancy, all vertical in the
 *           world. The moment is taken about the horizontal axis across her (the world's Y: the core's pose is
 *           Ry(pitch) Rx(roll), so her x axis always lies in the world's X-Z plane): the bending in the vertical plane
 *           through her keel. Her list does not enter it except through the loads themselves; the model's list is a
 *           known gap (README) and the note says not to make the break depend on it (9d). With a list this moment is the
 *           resultant of the bending about her own deck axis (its cos(list) share, returned as Mvert) and the lateral
 *           bending (its sin(list) share).
 *   beam    q(x) = g cos(trim) (b(x) - w(x) - f(x)) per metre of her own x, shear V = the integral of q from the stern,
 *           moment M = the integral of V from the stern (trapezoids at the column slices' edges). It drops the along-hull
 *           components of the loads (g sin(trim)) acting at heights off the neutral axis: the term D below. Both must
 *           close at the bow at rest; a residual there in motion is the dynamic term (her heave and pitch accelerating,
 *           her damping, and on a watch the motion model's own loads, sim.xFz and sim.xMth): it is reported, not hidden.
 * Signs: hogging positive (the ends drooping about a supported middle); the shear V positive where the part aft of the
 * station is the heavier, so that dM/dx = V.
 *
 * Numbers: [read] where a source gives it, [search summary] where only a search digest did, [derived] for arithmetic on
 * them, [bet] where nothing was found, as the research note tags them (section 9). Units: SI inside (N, N m, kg);
 * tonnes in the weight table.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../core.js'));
  else root.TitanicGirder = factory(root.TitanicCore);
})(typeof self !== 'undefined' ? self : this, function (C) {
  'use strict';
  const GRAV = C.GRAV, RHO = C.RHO, LTT = C.LT / 1000;    // tonnes in a long ton (1.01605)
  const FT = C.FT, IN = 0.0254;
  const ZB = C.zoneBounds();                              // [the stem, bulkheads A to P, the stern], x m, from forward
  const bulk = (id) => C.BULKHEADS.find(b => b.id === id).x;
  const room = (k) => [ZB[k + 1], ZB[k]];                 // zone k from its after to its forward bulkhead
  const XJ = bulk('J'), XK = bulk('K');                   // -16.154, -27.127: boiler room 1 between them

  // ---------------------------------------------------------------- the section and its capacity (note, 9b and 9c)
  // the neutral axis 398 in above the keel, midship section (Marine Forensics Panel; Mengot and Woytowich) [search
  // summary]; taken for every station of the break band, which lies in her parallel middle body
  const Z_NA = 398 * IN;
  const CAP = {
    // N m in hogging at the break station. Central 4.6 GN m: the panel's flooding condition C-7, 22 ksi at B deck x
    // 1.86e6 in3 [derived from search summaries]; it agrees with the riveted deck, 30.5 m3 x 153 MPa = 4.7 GN m, and
    // with the 1912 design moment W L / 30 = 4.5 GN m (Archer, BI 24318) [derived from read]
    hog: 4.6e9,
    low: 4.0e9,     // 10 % under: the aft joint's weaker section (Paik et al. 2025) and C-7's uncertainty [bet]
    high: 5.4e9,    // Stettler and Thomas's largest moment, 1.79 million ft-tons [search summary; SI derived]
    whatIf: 8.5e9,  // the deck's plate-yield moment, 30.5 m3 x 280 MPa: a hull that never breaks [derived]
    sag: 5.6e9,     // sagging: the keel's modulus 36.5 m3 x 153 MPa [derived; a bet, not needed for 1912]
    // the aft expansion joint (frame 28A, between the third and fourth funnels) at x -25.1 [derived from search-summary
    // frames]: the section there about 10 % weaker than amidships (Paik et al.) [search summary]; within 3 m [bet].
    // Hogging only: the joint opens the deck, which hogging puts in tension [bet]. An option (opts.joint), off by default.
    joint: { x: -25.1, half: 3.0, factor: 0.9 },
  };
  // the break band: from bulkhead K to bulkhead J, the model's own (the note's -27 to -16 m), over boiler room 1 [read:
  // the wreck's bottom pieces and the funnels; section 1.3]; the note's central station -23 m, Mengot's frame 25A
  // -22.4 m (the bottom's centre) and the joint -25.1 m (the deck's) are stations of their own
  const BAND = [XK, XJ];
  const X_BREAK = -23.0;
  // capacity at x, N m: M0 the central value (default CAP.hog); joint: the aft joint's 10 % within 3 m [bet]
  function capacity(x, M0, sense, joint) {
    if (sense === 'sag' || sense === 'sagging') return CAP.sag;
    const c = M0 === undefined || M0 === null ? CAP.hog : M0;
    return joint && Math.abs(x - CAP.joint.x) <= CAP.joint.half + 1e-9 ? c * CAP.joint.factor : c;
  }
  // where a moment stands against the studies' range of what her hull could bear (the note, 9b): 'below' 4.0 GN m,
  // 'within' 4.0 to 5.4, 'above' 5.4 [the range: search summaries and derived; its use as one band: the coordinator's]
  function zone(M) { const m = Math.abs(M); return m > CAP.high ? 'above' : (m >= CAP.low ? 'within' : 'below'); }
  // Where the record's break falls on this model's curve: on the 1912 damage preset (core/scenarios.js "titanic"), the
  // default moment (the default curve, relieved, no knock-down, the largest in the band) when her trim first reaches
  // 11 and 17 degrees, the record's attitude at the break (the note, 9d) [measured: tools/girder_tests.js checks these
  // figures against its own run, to 0.01 GN m]. The page's gauge quotes them. Measured again with S1 (2026-11-19: the
  // tiers above B deck are buoyant until their windows go, which lifts her forward part late and bends her more): they
  // were 4.98 and 5.28. Measured again with G6, G6b and W6 (2026-11-20, join 6: the damage shared as Hackett and
  // Bedford's and refitted): they were 5.11 and 5.87. Measured again with G7 (2026-11-21, join 7: the forepeak held to
  // its tank, G11's widths, refitted): they were 5.11 and 5.84. Measured again at the calibration epoch's landing (D4,
  // 2026-11-23: the history match's member C, every stage C switch on, her ends restored, and a refitted to C-7 at
  // 0.660, D92; e113): they were 5.125 and 5.871 (on a = 0.40 the landed model gives 4.860 and 4.995).
  const RECORD = { trim: [11, 17], M: [5.591e9, 5.708e9] };

  // ---------------------------------------------------------------- her weight along her length (note, 9a)
  // Masses in tonnes; x in the model's frame (forward of amidships positive), from its own bulkheads where a room is meant.
  const DE = 140 * LTT;    // a double-ended boiler with its water: 91.5 LT dry + 48.5 LT [search summary] = 142.2 t
  const SE = 84;           // a single-ended boiler, 11 ft 9 in long against 20 ft: 11.75/20 x 140 LT = 83.6 t [derived; bet]
  const Z_BOILER = C.G.tankTop + 0.3 + 0.5 * (15.75 * FT);   // m: on saddles [bet: 0.3 m] on the tank top [read: core
                           // G.tankTop], 15 ft 9 in across [read: The Shipbuilder, via the note 4.2]: 4.3 m [derived]
  function fixedLayers(V) {
    const L = [];
    const add = (name, m, x0, x1, z, tag, machinery) => L.push({ name, m, x0, x1, z: V.zAll ? null : z, tag, machinery: !!machinery, shape: 'uniform' });
    // the boilers by room: four double-ended in 6, five in each of 5 to 2, five single-ended in 1 [read: The Shipbuilder 1911]
    add('Boilers, boiler room 6', 4 * DE, ...room(4), Z_BOILER, 'count [read]; unit weight [search summary]; height [derived, bet]', true);
    for (let k = 5; k <= 8; k++) add('Boilers, ' + C.ZONES[k].name.toLowerCase(), 5 * DE, ...room(k), Z_BOILER, 'count [read]; unit weight [search summary]; height [derived, bet]', true);
    add('Boilers, boiler room 1 (single-ended)', 5 * SE, ...room(9), Z_BOILER, 'count [read]; weight [bet]', true);
    // two engines of about 990 LT each [read: TRMA], plus 300 t of pumps and auxiliaries [bet], over x -45 to -30 where
    // the engines stand in their room (K to L) [note]; their crankshafts 3.80 m up (R1, core/systems.js PLANT.crank), the
    // cylinders above: 7 m [bet]
    add('Reciprocating engines and their room', 2 * 990 * LTT + 300, -45, -30, 7.0, 'engines [read]; the 300 t [bet]; place [note]; height [bet]', true);
    // the turbine, 420 LT complete [read: Norway Heritage], plus 300 t of condensers and auxiliaries [bet], over its room;
    // at its axis, 4.82 m up (R1, PLANT.turbineAxis) [measured]
    add('Turbine room', 420 * LTT + 300, ...room(11), 4.82, 'turbine [read]; the 300 t [bet]; height [measured: R1]', true);
    add('Electric engine room', 200, ...room(12), 4.0, '[bet]', true);
    // the shafts 250 t [bet] from the turbine room to the stern frame; the stern frame and its brackets and boss arms,
    // about 190 LT [read: Norway Heritage], and three screws, about 92 LT [search summary], at the stern
    add('Shafts', 250, -118, -50, 3.80, 'mass and place [bet]; height: the wing shafts\' 3.80 m [measured: R1]', true);
    add('Stern castings and screws', 190 * LTT + 92 * LTT, -130, -118, 5.0, 'castings [read]; screws [search summary]; height [bet]', true);
    // coal: about 3,050 t on the night (5,892 tons at Southampton less 4.5 days' burning; core/systems.js PLANT.coalAboard)
    // [derived], spread evenly over the bunkers of boiler rooms 6 to 1 [bet: the shape]; bunkers about half full: 5 m [bet].
    // What-if 'plant': as core/systems.js shares it out, by the furnace ends lit in each room (boiler room 1 cold, none)
    if (V.coal === 'plant') {
      const lit = [8, 10, 10, 10, 10];
      for (let k = 4; k <= 8; k++) add('Coal, ' + C.ZONES[k].name.toLowerCase(), 3050 * lit[k - 4] / 48, ...room(k), 5.0, 'mass [derived]; shared by the fires lit (core/systems.js); height [bet]');
    } else add('Coal', 3050, room(9)[0], room(4)[1], 5.0, 'mass [derived]; shape and height [bet]');
    // cargo 900 LT [bet: 559 to 1,400 tons in the digests], 60 % in holds 1 to 3 (bulkheads A to D), 40 % aft [bet]
    const cargo = V.cargo === undefined ? 910 : V.cargo;
    add('Cargo, holds 1 to 3', cargo * 550 / 910, room(3)[0], room(1)[1], 5.0, '[bet]');
    add('Cargo aft', cargo * 360 / 910, -113, room(13)[1], 5.0, '[bet]');
    add('People and luggage', 260, -100, 100, 17.0, '[bet]: about 2,200 aboard, on C to E decks');
    return L;
  }
  const LIGHTSHIP = 38760 * LTT;   // 38,760 LT [search summary]
  // The end ordinate of the hull's trapezoid, in W/L. 0.660 [fitted: the one outside figure, the panel's C-7 moment of
  // 4.64 GN m at about 35,000 t aboard (her water as the core weighs it, D88), which it gives to 0.1 % on the landed
  // model (tools/girder_tests.js, sections 3 and 4; docs/research/experiments/e113_prohaska_refit_d4.js)]. Refitted once
  // at the calibration epoch's landing (D(G14-c), D92, 2026-11-23). It was 0.40, fitted on join 1's path, on a model
  // without her ends above E deck (C3) and weighing the over-fill (C5): it absorbed their absence. On the landed model
  // 0.40 gives C-7 16.2 % low; the ends carry 59 % of that and C5 17 %, and with both off the old drift of about 3 %
  // returns (e113). 0.660 lies inside the 0.40 to 0.75 the code brackets. The note's 0.566, a recollection of a textbook
  // table for passenger ships (Munro-Smith after Prohaska) [bet], gives 5.8 % too little. 0.40 is the value the note
  // quotes for a small passenger paddle steamer (the Medway Queen study) [search summary].
  const PROHASKA_A = 0.660;
  const PROHASKA_A_NOTE = 0.566;
  const VARIANTS = { note: { a: PROHASKA_A_NOTE } };   // the note's own curve, for the finding's second column
  const REMAINDER = [-100, 115];   // fresh and feed water, stores, double-bottom liquids: the double bottom [bet: the place]
  const Z_REMAINDER = 0.8;         // m: half the double bottom's 1.60 m [bet]
  // What-ifs on the bets, for the sensitivity of the finding (tools/girder_tests.js); every one still closes exactly:
  //   a: Prohaska's end ordinate (0.4 to 0.75 brackets the values seen); lightship: t; remainder: [x0, x1];
  //   coal: 'plant'; cargo: t; zAll: every layer at the model's KG (the note's first cut for the heights);
  //   shape: 'buoyancy': HANDOFF 4d's curve with fewer bets, everything but the machinery spread like her intact buoyancy at
  //   the night's pose (sim.pose0), closed in LCG by a straight tilt [the note: a cross-check that understates the hog]
  const DEFAULT_VARIANT = {};

  // linear pieces: { x0, x1, w0, w1 (t/m at each end), z (m), layer }
  function piece(x0, x1, w0, w1, z, layer) { return { x0, x1, w0, w1, z, layer }; }
  // mass and first moment of a piece over [lo, hi] (t, t m): exact for a linear density
  function integ(p, lo, hi) {
    const u0 = lo > p.x0 ? lo : p.x0, u1 = hi < p.x1 ? hi : p.x1;
    if (!(u1 > u0)) return null;
    const s = (p.w1 - p.w0) / (p.x1 - p.x0), a = p.w0 + s * (u0 - p.x0), b = p.w0 + s * (u1 - p.x0), d = u1 - u0;
    return [0.5 * (a + b) * d, d / 6 * (a * (2 * u0 + u1) + b * (u0 + 2 * u1))];
  }

  const CURVES = new WeakMap();    // ship -> Map(mass properties and variant -> curve): outside the sim, so a call writes nothing into it
  function weight(sim, variant) {
    const ship = sim.ship, ms = sim.ms / 1000, xG = sim.g0[0], yG = sim.g0[1], KG = sim.g0[2], V = variant || DEFAULT_VARIANT;
    let byShip = CURVES.get(ship); if (!byShip) { byShip = new Map(); CURVES.set(ship, byShip); }
    const p0 = V.shape === 'buoyancy' ? sim.pose0 : null;
    const key = ms + '|' + xG + '|' + yG + '|' + KG + '|' + JSON.stringify(V) + (p0 ? '|' + p0.zO + '|' + p0.pitch + '|' + p0.roll : '');
    let cv = byShip.get(key); if (cv) return cv;
    cv = buildCurve(sim, ms, xG, yG, KG, V);
    byShip.set(key, cv);
    return cv;
  }
  function buildCurve(sim, ms, xG, yG, KG, V) {
    const ship = sim.ship, D = shipData(ship);
    let layers = fixedLayers(V);
    const mach = layers.filter(l => l.machinery).reduce((s, l) => s + l.m, 0);
    const xs = ZB[ZB.length - 1], xf = ZB[0], Lh = xf - xs;
    const a = V.a === undefined ? PROHASKA_A : V.a, b = (3 - a) / 2;
    const P = [];
    let lay, hullInfo;
    if (V.shape === 'buoyancy') {
      // HANDOFF 4d: the machinery as above; everything else, sim.ms less the machinery, spread like her intact buoyancy at
      // the night's pose (by column slice), tilted in a straight line to close her LCG, at the one height that closes KG
      layers = layers.filter(l => l.machinery);
      const F0 = C.poseFrame(sim, sim.pose0.zO, sim.pose0.pitch, sim.pose0.roll, {}), c = ship.cols, iR = 1 / F0.R22;
      const b0 = new Float64Array(D.nS);
      for (let i = 0; i < c.N; i++) { const zp = -(F0.R20 * c.x[i] + F0.R21 * c.y[i] + F0.tz) * iR; if (zp > c.zlo[i]) b0[D.colSlice[i]] += c.dxdy[i] * ((zp >= c.zhi[i] ? c.zhi[i] : zp) - c.zlo[i]); }
      let B0 = 0, xb = 0; for (let j = 0; j < D.nS; j++) { B0 += b0[j]; xb += b0[j] * D.xc[j]; } xb /= B0;
      let I2 = 0; for (let j = 0; j < D.nS; j++) I2 += b0[j] * (D.xc[j] - xb) * D.xc[j];
      const restM = ms - mach, momMach = layers.reduce((s, l) => s + l.m * 0.5 * (l.x0 + l.x1), 0);
      const kap = (((ms * xG - momMach) / restM) - xb) / (I2 / B0);
      const zr = V.zAll ? KG : (ms * KG - layers.reduce((s, l) => s + l.m * (l.z === null ? KG : l.z), 0)) / restM;
      const shaped = { name: 'Everything but the machinery, as her intact buoyancy', m: restM, x0: xs, x1: xf, z: zr, tag: 'HANDOFF 4d [bet]: sim.ms less the machinery, shaped like b0(x), tilted to close the LCG', shape: 'slices' };
      lay = layers.concat([shaped]);
      layers.forEach((l, i) => { if (l.z === null) l.z = KG; P.push(piece(l.x0, l.x1, l.m / (l.x1 - l.x0), l.m / (l.x1 - l.x0), l.z, i)); });
      for (let j = 0; j < D.nS; j++) {
        const wj = restM * b0[j] / B0 * (1 + kap * (D.xc[j] - xb)) / D.dx[j];
        if (b0[j] > 0) P.push(piece(D.e[j], D.e[j + 1], wj, wj, zr, lay.length - 1));
      }
      hullInfo = { xs, xf, L: Lh, shape: 'buoyancy', tilt: kap, z: zr };
    } else {
      // the hull, its structure and outfit: the lightship less the machinery [search summary; derived], as Prohaska's
      // trapezoid over her whole length (the model's own profile, stern tip to stem head: the note's "about -137 to +130")
      let Wh = (V.lightship === undefined ? LIGHTSHIP : V.lightship) - mach;
      let rest = ms - layers.reduce((s, l) => s + l.m, 0) - Wh;
      if (rest < 0) { Wh += rest; rest = 0; }    // a lighter sim than these layers: the hull gives way, never below zero
      const R0 = V.remainder || REMAINDER;
      const aTag = a === PROHASKA_A ? '[fitted: the panel\'s C-7 moment at 35,000 t aboard as weighed, to 0.1 %, on the landed model (D92)]' : (a === PROHASKA_A_NOTE ? '[bet: the note\'s textbook recollection]' : '[what-if]');
      const hull = { name: 'Hull, structure and outfit', m: Wh, x0: xs, x1: xf, z: 0, tag: 'lightship [search summary] less the machinery; Prohaska\'s trapezoid, a = ' + a + ' ' + aTag + '; height closes KG [derived]', shape: 'trapezoid' };
      const rem = { name: 'Remainder (water, stores, double-bottom liquids)', m: rest, x0: R0[0], x1: R0[1], z: V.zAll ? null : Z_REMAINDER, tag: 'mass closes sim.ms [derived]; place and height [bet]', shape: 'uniform' };
      lay = layers.concat([hull, rem]);
      // LCG closure (Prohaska): the trapezoid's end ordinates moved by equal and opposite amounts, +d forward and -d aft
      // (in W/L), keep its area and move its centroid 7 d L / 54 [derived: two end triangles of height d over L/3]
      const mom = (l) => l.m * 0.5 * (l.x0 + l.x1);
      const others = layers.reduce((s, l) => s + mom(l), 0) + mom(rem);
      let d = Wh > 0 ? (ms * xG - others - Wh * 0.5 * (xs + xf)) / (7 * Wh * Lh / 54) : 0;
      let slide = 0;
      if (Math.abs(d) > 0.9 * a) {               // not this ship: a centre too far out for the trapezoid; slide the remainder
        const dd = Math.sign(d) * 0.9 * a;
        slide = rest > 0 ? (ms * xG - others - Wh * 0.5 * (xs + xf) - 7 * dd * Wh * Lh / 54) / rest : 0;
        d = dd; rem.x0 += slide; rem.x1 += slide;
      }
      const wl = Wh / Lh;
      // height closure: the hull's own weight acts where the others leave KG [derived]
      for (const l of lay) if (l.z === null) l.z = KG;
      const zOthers = layers.reduce((s, l) => s + l.m * l.z, 0) + rem.m * rem.z;
      hull.z = V.zAll ? KG : (Wh > 0 ? (ms * KG - zOthers) / Wh : 0);
      lay.forEach((l, i) => {
        if (l.shape === 'trapezoid') {
          const x1 = xs + Lh / 3, x2 = xs + 2 * Lh / 3;
          P.push(piece(xs, x1, (a - d) * wl, b * wl, l.z, i), piece(x1, x2, b * wl, b * wl, l.z, i), piece(x2, xf, b * wl, (a + d) * wl, l.z, i));
        } else if (l.m > 0) P.push(piece(l.x0, l.x1, l.m / (l.x1 - l.x0), l.m / (l.x1 - l.x0), l.z, i));
      });
      hullInfo = { xs, xf, L: Lh, a, ends: [a - d, a + d], b, d, z: hull.z, slide };
    }
    for (const l of lay) if (l.z === null) l.z = KG;
    // its own integrals, from the pieces (the closure checks read these, not the bookkeeping above)
    let M = 0, Mx = 0, Mz = 0;
    for (const p of P) { const r = integ(p, -1e9, 1e9); M += r[0]; Mx += r[1]; Mz += r[0] * p.z; }
    for (const l of lay) { let m = 0, mx = 0; for (const p of P) if (lay[p.layer] === l) { const r = integ(p, -1e9, 1e9); m += r[0]; mx += r[1]; } l.xc = m > 0 ? mx / m : 0.5 * (l.x0 + l.x1); }
    // per column slice of this ship: mass, first moment, z moment (kg, kg m), for the beam form and the prefix sums
    const nS = D.nS, sm = new Float64Array(nS), smx = new Float64Array(nS), smz = new Float64Array(nS);
    for (let j = 0; j < nS; j++) for (const p of P) { const r = integ(p, D.e[j], D.e[j + 1]); if (r) { sm[j] += r[0] * 1000; smx[j] += r[1] * 1000; smz[j] += r[0] * p.z * 1000; } }
    return { ms, xG, yG, KG, variant: V, layers: lay, pieces: P, total: M, lcg: Mx / M, vcg: Mz / M, machinery: mach, hull: hullInfo, slice: { m: sm, mx: smx, mz: smz } };
  }
  // the weight per metre at x (t/m); w(curve, x, layer) for one layer alone
  function w(cv, x, layer) {
    let s = 0;
    for (const p of cv.pieces) {
      if (layer !== undefined && p.layer !== layer) continue;
      if (x >= p.x0 && x < p.x1) s += p.w0 + (p.w1 - p.w0) * (x - p.x0) / (p.x1 - p.x0);
    }
    return s;
  }
  // the weight aft of x: mass, first moment in x, moment in z (kg, kg m)
  function aftOf(cv, x, out) {
    let m = 0, mx = 0, mz = 0;
    for (const p of cv.pieces) {
      if (p.x0 >= x) continue;
      const r = integ(p, p.x0, x); if (!r) continue;
      m += r[0]; mx += r[1]; mz += r[0] * p.z;
    }
    out[0] = m * 1000; out[1] = mx * 1000; out[2] = mz * 1000;
    return out;
  }

  // ---------------------------------------------------------------- the ship's columns by slice (static per ship)
  const SHIPS = new WeakMap();
  function shipData(ship) {
    let d = SHIPS.get(ship); if (d) return d;
    const sl = ship.cols.slices.slice().sort((a, b) => a.xc - b.xc);       // from the stern forward
    const nS = sl.length, e = new Float64Array(nS + 1), xc = new Float64Array(nS), dx = new Float64Array(nS), zone = new Int32Array(nS);
    const colSlice = new Int32Array(ship.cols.N);
    for (let j = 0; j < nS; j++) {
      const s = sl[j]; xc[j] = s.xc; dx[j] = s.dx; zone[j] = s.zone; e[j] = s.xc - 0.5 * s.dx;
      for (let i = s.first; i < s.first + s.count; i++) colSlice[i] = j;
    }
    e[nS] = sl[nS - 1].xc + 0.5 * sl[nS - 1].dx;
    // the break band's stations: every column boundary from K to J, every half metre between, and the named points
    const xs = [];
    for (let j = 0; j <= nS; j++) if (e[j] >= BAND[0] - 1e-6 && e[j] <= BAND[1] + 1e-6) xs.push(e[j]);
    for (let x = -16.5; x >= -27.0 - 1e-9; x -= 0.5) xs.push(Math.round(x * 10) / 10);
    xs.push(-22.4, -25.1, CAP.joint.x + CAP.joint.half);
    xs.sort((a, b) => a - b);
    const band = []; for (const x of xs) if (!band.length || x - band[band.length - 1] > 1e-6) band.push(x);
    // each zone's slices (a run of them: the slices are cut zone by zone); scratch for the water's spread
    const zoneSlices = []; for (let k = 0; k < 16; k++) { let a = nS, b = 0; for (let j = 0; j < nS; j++) if (zone[j] === k) { a = Math.min(a, j); b = Math.max(b, j + 1); } zoneSlices.push([a, b]); }
    d = { nS, e, xc, dx, zone, colSlice, band: Float64Array.from(band), zoneSlices, tV: new Float64Array(nS), tY: new Float64Array(nS), tZ: new Float64Array(nS) };
    SHIPS.set(ship, d);
    return d;
  }

  // ---------------------------------------------------------------- the flood water, column by column
  // Each space's free surface for this pose and the water now in it, as the core's next step will find it (solveLevels:
  // the same merging of port and starboard, the same columns, its permeability), spread over the columns and summed by
  // slice: volume, and its moments in y and z (m3, m4). The core keeps a level from the start of the last step; this
  // solves it again for the pose and the water as they stand now, then scales the spread to the water exactly.
  function waterBySlice(sim, F, D, fV, fY, fZ) {
    const ship = sim.ship, c = ship.cols, iR = 1 / F.R22, tV = D.tV, tY = D.tY, tZ = D.tZ;
    let j0 = 0, j1 = 0, dv = 0, zmin = 0, zmax = 0;
    // the water under world level h in nodes n1 (and n2, a merged pair), by slice into the scratch (the zone's slices
    // only); returns its volume, and leaves the free surface's area per metre of h in dv. `bounds`: also find the
    // world heights of the spaces' lowest and highest points
    const pass = (n1, n2, h, bounds) => {
      for (let j = j0; j < j1; j++) { tV[j] = 0; tY[j] = 0; tZ[j] = 0; }
      let vol = 0, a2 = 0; zmin = 1e9; zmax = -1e9;
      for (let q = 0; q < 2; q++) {
        const n = q === 0 ? n1 : n2; if (n < 0) continue;
        const mu = ship.nodeMu[n], s1 = ship.nodeStart[n] + ship.nodeCount[n];
        for (let j = ship.nodeStart[n]; j < s1; j++) {
          const i = ship.entCol[j], a = ship.entA[j], b = ship.entE[j], base = F.R20 * c.x[i] + F.R21 * c.y[i] + F.tz;
          if (bounds) { const wa = base + F.R22 * a, wb = base + F.R22 * b; if (wa < zmin) zmin = wa; if (wb > zmax) zmax = wb; }
          const zp = (h - base) * iR;
          if (zp <= a) continue;
          let L; if (zp >= b) L = b - a; else { L = zp - a; a2 += c.dxdy[i] * mu; }
          const v = c.dxdy[i] * L * mu, k = D.colSlice[i];
          vol += v; tV[k] += v; tY[k] += v * c.y[i]; tZ[k] += v * (a + 0.5 * L);
        }
      }
      dv = a2 * iR;
      return vol;
    };
    const spread = (k, n1, n2, V, h0) => {
      if (!(V > 1e-6)) return;
      j0 = D.zoneSlices[k][0]; j1 = D.zoneSlices[k][1];
      const Vmax = ship.nodeVmax[n1] + (n2 >= 0 ? ship.nodeVmax[n2] : 0);
      let vol = pass(n1, n2, 1e9, true);            // the whole space, and its bounds
      if (!(zmax > zmin) || !(vol > 0)) return;
      if (V < Vmax * (1 - 1e-7)) {                  // not full: find the level, from the core's last one (Newton, bracketed)
        let lo = zmin, hi = zmax, h = h0 > lo && h0 < hi ? h0 : 0.5 * (lo + hi);
        const tol = 1e-7 * Vmax + 1e-4;
        for (let it = 0; it < 40; it++) {
          vol = pass(n1, n2, h, false);
          const err = vol - V;
          if (Math.abs(err) < tol) break;
          if (err > 0) hi = h; else lo = h;
          let hn = dv > 1e-9 ? h - err / dv : 0.5 * (lo + hi);
          if (!(hn > lo && hn < hi)) hn = 0.5 * (lo + hi);
          h = hn;
        }
      }                                             // full, or pressed up: the whole space carries all its water
      const s = vol > 0 ? V / vol : 0;              // the last pass, scaled to the water exactly
      for (let j = j0; j < j1; j++) { fV[j] += tV[j] * s; fY[j] += tY[j] * s; fZ[j] += tZ[j] * s; }
    };
    // C5 (the calibration epoch, dark until its landing): with params.weighOverfill 0 the core's loads weigh a full space
    // at its capacity, each space on its own, min(vol, nodeVmax); the excess is the sea's head over its top on a stiff
    // virtual area, pressure and not water. The gauge weighs as the core does, by the core's own test of the switch
    // (C.eachWater's), so that its water's total is C.weighedWater's (tools/girder_tests.js holds it). With 1, the
    // default, every space weighs its whole vol, as before, to the bit. A pocket follows through C.pocketPoints.
    const cut = !sim.params.weighOverfill, vm = ship.nodeVmax;
    const W = (n) => (cut ? Math.min(sim.vol[n], vm[n]) : sim.vol[n]);
    for (let k = 0; k < 16; k++) for (let L = 0; L < 2; L++) {
      const nP = C.nodeIndex(k, 0, L), nS = C.nodeIndex(k, 1, L), g = k * 2 + L;
      let merged = sim.mergeAlways[g] === 1;
      if (!merged && L === 0) {
        const zMw = C.worldZ(F, ship.zones[k].xm, 0, sim.zMerge[k]);
        merged = sim.vol[nP] > 1e-6 && sim.vol[nS] > 1e-6 && sim.level[nP] > zMw + 0.05 && sim.level[nS] > zMw + 0.05;
      }
      if (merged) spread(k, nP, nS, W(nP) + W(nS), sim.level[nP]);
      else { spread(k, nP, -1, W(nP), sim.level[nP]); spread(k, nS, -1, W(nS), sim.level[nS]); }
    }
    // W6: a pocket's water (the bunker of the fire) as the core weighs it (C.pocketPoints), in the slice where it stands
    if (sim.pockets) for (const pk of sim.pockets) {
      if (!(pk.vol > 0)) continue;
      const pts = C.pocketPoints(sim, F, pk);
      for (let i = 0; i < pts.length; i += 4) {
        const x = pts[i + 1]; let j = -1;
        for (let q = 0; q < D.nS; q++) { const a = Math.min(D.e[q], D.e[q + 1]), b = Math.max(D.e[q], D.e[q + 1]); if (x >= a && x < b) { j = q; break; } }
        if (j >= 0) { fV[j] += pts[i]; fY[j] += pts[i] * pts[i + 2]; fZ[j] += pts[i] * pts[i + 3]; }
      }
    }
  }

  // ---------------------------------------------------------------- the moment
  function where(x) {
    if (Math.abs(x - XJ) < 0.05) return 'bulkhead J';
    if (Math.abs(x - XK) < 0.05) return 'bulkhead K';
    const n = C.ZONES[C.zoneAt(x)].name;
    return n.charAt(0) === 'N' ? n : n.charAt(0).toLowerCase() + n.slice(1);
  }
  // opts: { reading: 'relieved' (the default: her inertia counted) or 'stern' (the note's: integrated from the stern),
  //         joint: true for the aft joint's 10 % knock-down [bet; off by default], cap: the central capacity in hogging
  //         for the ratio (N m, default CAP.hog), variant: a what-if weight curve (weight(); VARIANTS.note is the note's),
  //         loads: true for b, w, f per metre by slice }
  // The result's M is the reading's moment; Mstern, Mrel and Mfwd are all given beside it (gov, band, at(x)).
  function moment(sim, opts) {
    opts = opts || {};
    const ship = sim.ship, D = shipData(ship), cv = weight(sim, opts.variant), F = C.frameOf(sim), nS = D.nS, c = ship.cols;
    const cap0 = opts.cap === undefined ? CAP.hog : opts.cap, rel = opts.reading !== 'stern', joint = !!opts.joint;
    // buoyancy by slice, exactly as the core's hydroPass integrates it: each column under the world's plane Z = 0, cut at
    // its own centre line; its centre of buoyancy at (x, y, lo + s/2)
    const bV = new Float64Array(nS), bY = new Float64Array(nS), bZ = new Float64Array(nS);
    const iR = 1 / F.R22;
    for (let i = 0; i < c.N; i++) {
      const x = c.x[i], y = c.y[i], lo = c.zlo[i], hi = c.zhi[i];
      const zp = -(F.R20 * x + F.R21 * y + F.tz) * iR;
      if (zp <= lo) continue;
      const s = zp >= hi ? hi - lo : zp - lo, v = c.dxdy[i] * s, k = D.colSlice[i];
      bV[k] += v; bY[k] += v * y; bZ[k] += v * (lo + 0.5 * s);
    }
    const fV = new Float64Array(nS), fY = new Float64Array(nS), fZ = new Float64Array(nS);
    waterBySlice(sim, F, D, fV, fY, fZ);
    // the columns' net upward force by slice (buoyancy less the water in her), N, and its moments in y and z; prefix sums
    // from the stern, so that the part aft of any slice edge is one subtraction
    const rg = RHO * GRAV, P0 = new Float64Array(nS + 1), PX = new Float64Array(nS + 1), PY = new Float64Array(nS + 1), PZ = new Float64Array(nS + 1);
    for (let j = 0; j < nS; j++) {
      const f = rg * (bV[j] - fV[j]);
      P0[j + 1] = P0[j] + f; PX[j + 1] = PX[j] + f * D.xc[j]; PY[j + 1] = PY[j] + rg * (bY[j] - fY[j]); PZ[j + 1] = PZ[j] + rg * (bZ[j] - fZ[j]);
    }
    const yG = cv.yG, tmp = [0, 0, 0];
    // everything aft of x: net upward force and its moments, columns and weights (N, N m)
    const aft = (x, out) => {
      let j = 0;
      if (x >= D.e[nS]) j = nS; else if (x > D.e[0]) { let lo = 0, hi = nS; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (D.e[m] <= x) lo = m; else hi = m; } j = lo; }
      let s0 = P0[j], sx = PX[j], sy = PY[j], sz = PZ[j];
      if (j < nS && x > D.e[j]) {                // part of slice j: its loads are even along it
        const fr = (x - D.e[j]) / D.dx[j], f = P0[j + 1] - P0[j];
        s0 += fr * f; sx += fr * f * (D.e[j] + 0.5 * fr * D.dx[j]); sy += fr * (PY[j + 1] - PY[j]); sz += fr * (PZ[j + 1] - PZ[j]);
      }
      aftOf(cv, x, tmp);
      out[0] = s0 - GRAV * tmp[0]; out[1] = sx - GRAV * tmp[1]; out[2] = sy - GRAV * yG * tmp[0]; out[3] = sz - GRAV * tmp[2];
      return out;
    };
    // the exact form at x: about (x, 0, Z_NA), the horizontal axis across her (P_X - Q_X = R00 dx + R01 dy + R02 dz)
    const s4 = [0, 0, 0, 0], all = aft(D.e[nS] + 1, [0, 0, 0, 0]);
    const exact = (x, o) => {
      aft(x, s4);
      const S = s4[0], Mx = s4[1] - x * S, My = s4[2], Mz = s4[3] - Z_NA * S;
      o.Mstern = F.R00 * Mx + F.R01 * My + F.R02 * Mz;
      o.D = F.R01 * My + F.R02 * Mz;                            // what the beam form drops
      o.Mvert = F.R22 * Mx - F.R20 * Mz;                        // about her own deck axis (ship frame y)
      o.V = -F.R00 * S;
      // every force on her about the same axis: zero at rest; in motion the dynamic term, so that the moment taken from
      // the bow (the part forward of x) is the stern's less it. The two bracket the moment her inertia would give.
      o.R = F.R00 * (all[1] - x * all[0]) + F.R01 * all[2] + F.R02 * (all[3] - Z_NA * all[0]);
      o.Mfwd = o.Mstern - o.R;
      const rl = relief(x);
      o.Mrel = o.Mstern + rl;
      o.M = rel ? o.Mrel : o.Mstern;                            // the reading's
      // About HER OWN axes (B1+B2, 2026-11-24, e124: the onset's check at a list). The reading above is about the
      // horizontal axis across her. Her capacity Mu bends about her deck axis (y), and a list turns part of the vertical
      // forces' moment onto her vertical axis (z). So:
      // - MvertRel is Mvert relieved by her inertia as Mrel is;
      // - Mlat is the moment about her z (R21 Mx - R20 My), and MlatRel the same relieved. The relief's loads are
      //   vertical, along her centre line at the neutral axis: their normal part counts about her y, their lateral part
      //   about her z;
      // - Vz and Vlat are the shear's parts along her z and her y.
      // New fields only: the reading M and every figure before them stand to the bit.
      o.MvertRel = o.Mvert + (F.R22 / F.R00) * rl;
      o.Mlat = F.R21 * Mx - F.R20 * My;
      o.MlatRel = o.Mlat + (F.R21 / F.R00) * rl;
      o.Vz = -F.R22 * S; o.Vlat = -F.R21 * S;
      return o;
    };
    // Relieved by her inertia: what is left over (all the loads' force and moment, zero at rest) balanced by a rigid
    // acceleration of her mass, so that the moment is the same taken from either end. The mass by slice is her own (from
    // the weight curve, with the core's added mass in heave spread like it, params.addedHeave) and the water in her
    // [bet: how the added mass and the damping lie along her]. p_j = -mu_j (A + B (x_j - x_mu)): sum p = -sum F and
    // their moment about x_mu = -R(x_mu).
    const kA = 1 + (sim.params.addedHeave || 0);
    let mu0 = 0, mux = 0;
    const mu = new Float64Array(nS);
    for (let j = 0; j < nS; j++) { mu[j] = kA * cv.slice.m[j] + RHO * fV[j]; mu0 += mu[j]; mux += mu[j] * D.xc[j]; }
    const xmu = mux / mu0;
    let Imu = 0; for (let j = 0; j < nS; j++) Imu += mu[j] * (D.xc[j] - xmu) * (D.xc[j] - xmu);
    const Rmu = F.R00 * (all[1] - xmu * all[0]) + F.R01 * all[2] + F.R02 * (all[3] - Z_NA * all[0]);
    const pA = all[0] / mu0, pB = Rmu / (F.R00 * Imu);
    const Q0 = new Float64Array(nS + 1), QX = new Float64Array(nS + 1);
    for (let j = 0; j < nS; j++) { const p = -mu[j] * (pA + pB * (D.xc[j] - xmu)); Q0[j + 1] = Q0[j] + p; QX[j + 1] = QX[j] + p * D.xc[j]; }
    const relief = (x) => {                        // the moment of the inertial loads aft of x about x (cos(trim) lever)
      let j = 0;
      if (x >= D.e[nS]) j = nS; else if (x > D.e[0]) { let lo = 0, hi = nS; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (D.e[m] <= x) lo = m; else hi = m; } j = lo; }
      let s0 = Q0[j], sx = QX[j];
      if (j < nS && x > D.e[j]) { const fr = (x - D.e[j]) / D.dx[j], p = Q0[j + 1] - Q0[j]; s0 += fr * p; sx += fr * p * (D.e[j] + 0.5 * fr * D.dx[j]); }
      return F.R00 * (sx - x * s0);
    };
    // the beam form at the slice edges: V and M integrated from the stern (q even along each slice; trapezoids)
    const Vb = new Float64Array(nS + 1), Mb = new Float64Array(nS + 1), Fs = new Float64Array(nS);
    for (let j = 0; j < nS; j++) {
      Fs[j] = (P0[j + 1] - P0[j]) - GRAV * cv.slice.m[j];
      Vb[j + 1] = Vb[j] - F.R00 * Fs[j];
      Mb[j + 1] = Mb[j] + 0.5 * (Vb[j] + Vb[j + 1]) * D.dx[j];
    }
    const beamAt = (x) => {
      let j = 0; while (j < nS - 1 && D.e[j + 1] <= x) j++;
      const u = x - D.e[j], dV = Vb[j + 1] - Vb[j];
      return [Vb[j] + dV * u / D.dx[j], Mb[j] + Vb[j] * u + 0.5 * dV * u * u / D.dx[j]];
    };
    // along the whole hull, at every slice edge (M the reading's; the closure is the stern's: what is left at the bow)
    const hull = { x: Float64Array.from(D.e), M: new Float64Array(nS + 1), Mstern: new Float64Array(nS + 1), Mrel: new Float64Array(nS + 1), V: new Float64Array(nS + 1), D: new Float64Array(nS + 1), Mbeam: Mb, Vbeam: Vb,
      MvertRel: new Float64Array(nS + 1), MlatRel: new Float64Array(nS + 1), Vz: new Float64Array(nS + 1) };
    const o = {};
    let pk = 0, pkx = 0, spk = 0, Vpk = 0, Mbpk = 0, Vbpk = 0;
    for (let j = 0; j <= nS; j++) {
      exact(D.e[j], o); hull.M[j] = o.M; hull.Mstern[j] = o.Mstern; hull.Mrel[j] = o.Mrel; hull.V[j] = o.V; hull.D[j] = o.D;
      hull.MvertRel[j] = o.MvertRel; hull.MlatRel[j] = o.MlatRel; hull.Vz[j] = o.Vz;
      if (j < nS && Math.abs(o.M) > Math.abs(pk)) { pk = o.M; pkx = D.e[j]; }
      if (j < nS) { spk = Math.max(spk, Math.abs(o.Mstern)); Vpk = Math.max(Vpk, Math.abs(o.V)); Mbpk = Math.max(Mbpk, Math.abs(Mb[j])); Vbpk = Math.max(Vbpk, Math.abs(Vb[j])); }
    }
    // the break band: the governing station is the largest moment over capacity (with no knock-down, the largest moment)
    const B = D.band, nb = B.length;
    const band = { x: Float64Array.from(B), M: new Float64Array(nb), Mstern: new Float64Array(nb), Mfwd: new Float64Array(nb), Mrel: new Float64Array(nb), Mbeam: new Float64Array(nb), V: new Float64Array(nb), D: new Float64Array(nb), Mvert: new Float64Array(nb), cap: new Float64Array(nb), ratio: new Float64Array(nb),
      MvertRel: new Float64Array(nb), MlatRel: new Float64Array(nb), Vz: new Float64Array(nb) };
    let gi = 0, bpi = 0;
    for (let i = 0; i < nb; i++) {
      exact(B[i], o);
      band.M[i] = o.M; band.Mstern[i] = o.Mstern; band.Mfwd[i] = o.Mfwd; band.Mrel[i] = o.Mrel; band.V[i] = o.V; band.D[i] = o.D; band.Mvert[i] = o.Mvert; band.Mbeam[i] = beamAt(B[i])[1];
      band.MvertRel[i] = o.MvertRel; band.MlatRel[i] = o.MlatRel; band.Vz[i] = o.Vz;
      const sag = o.M < 0;
      band.cap[i] = sag ? CAP.sag : capacity(B[i], cap0, 'hog', joint);
      band.ratio[i] = (sag ? -o.M : o.M) / band.cap[i];
      if (band.ratio[i] > band.ratio[gi]) gi = i;
      if (o.M > band.M[bpi]) bpi = i;
    }
    const gov = { i: gi, x: B[gi], M: band.M[gi], cap: band.cap[gi], ratio: band.ratio[gi], zone: zone(band.M[gi]), sense: band.M[gi] < 0 ? 'sagging' : 'hogging', where: where(B[gi]),
      Mstern: band.Mstern[gi], Mrel: band.Mrel[gi], Mfwd: band.Mfwd[gi], Mbeam: band.Mbeam[gi], D: band.D[gi], Mvert: band.Mvert[gi] };
    // at the bow: what is left over from the stern (zero at rest; the dynamic term in motion)
    const nE = nS;
    const closure = {
      M: hull.Mstern[nE], V: hull.V[nE], Mpeak: spk, Vpeak: Vpk,
      Mshare: spk > 0 ? Math.abs(hull.Mstern[nE]) / spk : 0, Vshare: Vpk > 0 ? Math.abs(hull.V[nE]) / Vpk : 0,
      Mbeam: Mb[nE], Vbeam: Vb[nE], MbeamShare: Mbpk > 0 ? Math.abs(Mb[nE]) / Mbpk : 0, VbeamShare: Vbpk > 0 ? Math.abs(Vb[nE]) / Vbpk : 0,
    };
    const res = {
      t: sim.t, trimDeg: sim.pitch * 180 / Math.PI, listDeg: sim.roll * 180 / Math.PI, reading: rel ? 'relieved' : 'stern', joint,
      gov, band, hull, peak: { x: pkx, M: pk }, bandPeak: { x: B[bpi], M: band.M[bpi] }, closure,
      at: (x) => { const r = exact(x, {}); r.Mbeam = beamAt(x)[1]; r.Vbeam = beamAt(x)[0]; return r; },
    };
    if (opts.loads) {                              // per metre of her length, by slice: tonnes a metre
      const n = nS, L = { x: Float64Array.from(D.xc), b: new Float64Array(n), w: new Float64Array(n), f: new Float64Array(n) };
      for (let j = 0; j < n; j++) { L.b[j] = RHO * bV[j] / D.dx[j] / 1000; L.f[j] = RHO * fV[j] / D.dx[j] / 1000; L.w[j] = cv.slice.m[j] / D.dx[j] / 1000; }
      res.loads = L;
    }
    return res;
  }
  // the gauge's words: "hogging at bulkhead J" (where), "hull 4.3 GN m, hogging at bulkhead J" (describe)
  function placeOf(g) { return g.sense + (/^bulkhead/.test(g.where) ? ' at ' : ' over ') + g.where; }
  function describe(res) { return 'hull ' + (res.gov.M / 1e9).toFixed(1) + ' GN m, ' + placeOf(res.gov); }

  return { CAP, BAND, X_BREAK, Z_NA, RECORD, capacity, zone, weight, w, aftOf, moment, describe, placeOf, where, shipData, LIGHTSHIP, PROHASKA_A, PROHASKA_A_NOTE, VARIANTS };
});
