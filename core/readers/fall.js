/*
 * The fall: the free body (step Z1 of docs/BRAINSTORM_the_descent_to_the_bed_v2_2026-11-19.md, sections 4, 5.1, 5.2;
 * the break design's B5). From the founder flag she is one rigid body or two, carried to the bed on physics. Headless,
 * deterministic (sums in a fixed order; the one draw, the bed's slope, from a seed), no DOM; every state is plain data
 * or typed arrays. It registers nothing with core/night.js: joining it to the watch is step Z3, not this file's.
 *
 *   sea(spec)                        the water column to the bed, and the bed (plain data)
 *   piece(ship, sim, x0, x1, opts)   a rigid body built from the model itself between two stations of her length
 *   begin(sim, opts)                 sim.fall from a sim at its founder flag, by the interim rule H1
 *   step(sim)                        sim.fall on by one dt (the model's 0.25 s); `done` once every piece is at rest
 *   body, make, place, advance       the same machinery for the trials: bodies let go where a test puts them
 *
 * THE CONTRACT (the plan's 5.1, v: 3; the page reads these fields and nothing else of the fall). v: 2 is v: 1 with one
 * field more, breakAt (agreed by the lanes on 2026-11-20; a reader of v: 1 finds nothing else changed); v: 3 is v: 2
 * with one field more, lights (G2 of NH15, 2026-11-23; a reader of v: 2 finds nothing else changed):
 *   sim.fall = { v: 3, rule: 'flag' | 'break', t0, k, t, done,
 *     sea: { depth, ... },        the column's tables at z = i dz (dz, n, T deg C, S, rho kg/m3, p Pa absolute, c m/s) and
 *                                 the bed: its depth at (X, Y) is depth + slope[0] X + slope[1] Y (+ relief, none here)
 *     at: { X, Y, psi },          where the fall's frame lies on the earth when it began (all 0 on a preset)
 *     breakAt: [X, Y] | null,     the point on the sea's surface under the break when the fall began, in the frame of
 *                                 pieces[].r: the cut station on the girder's neutral axis (x at the cut, y 0, z Z_NA).
 *                                 null when she falls whole. The boilers mark it on the bed (the wreck's boiler field)
 *     pieces: [{ id: 'bow' | 'stern' | 'whole', x0, x1, r: [X, Y, Z], q: [w, x, y, z], v: [u, v, w], om: [p, q, r],
 *                state: 'afloat' | 'under' | 'falling' | 'striking' | 'at rest', depth, speed, air, bury: Float64Array }],
 *     debris: [],                 Z7's (closed forms); empty here
 *     events: [{ t, id: 'under' | 'report' | 'strike' | 'rest', piece, depth, energy, speed }],
 *     lights: { level: [], lit: [] | null, dark: [], sections: { piece: [], out: [] } | null } | null }
 * and one key beside them that the page must not read, sim.fall.eng: the engine's own state (each piece's slices, its
 * mass matrix, momenta and air; the coefficients; how her lights run down). Its form may change without a new contract
 * version.
 * The fields, exactly:
 *   r, q      a ship-frame point p of the piece stands at R(q) p + r in the fall's world frame (below): r is where the
 *             ship frame's origin (amidships, centreline, keel) is carried, and q her attitude, a unit quaternion
 *   v, om     the velocity of that same point and her angular velocity, both in her own axes (m/s, rad/s)
 *   depth     the depth of her lowest point, m (positive down); speed: her centre of mass's speed through the water, m/s
 *   air       m3 of air in her now, at its own pressure; bury: m of each slice's lowest point below the mud line, from
 *             her after end forward (her slices are the model's 3 m slices cut at x0 and x1)
 *   events    depth: her `depth` at the event; energy: her kinetic energy then, with the water in her and the water she
 *             drags (J; at 'rest', the work the mud took); speed: her `speed` then. 'report' is Z6's: one a space giving
 *             way with an energy past K.reportMin (an audible failure), its depth the depth of that space's free surface
 *             and its energy its air's lag behind the sea times its volume (J); it fires only under the what-if K.air
 *             'spaces' (none by default)
 *   t         the fall's clock, on sim.t's scale (t0 + k dt); step() never writes sim.t
 *   lights    her light carried piece by piece from the hand-over (G2 of docs/DESIGN_the_living_ship_v1_2026-11-23.md;
 *             "HER LIGHTS" below); null when the hand-over has no plant (sim.plant), as on a preset of the trials. Per
 *             piece, in pieces' order: level, its supply now as the plant's lights are (1 the main dynamos, the
 *             emergency share PLANT.emergency.lights the emergency dynamos alone, 0 none); dark, the clock (sim.t's
 *             scale) when its supply ended, -1 while it has one (the plant's own time of 'dark' when she was dark
 *             before the hand-over; t0 for a piece cut from her dynamos at the break); lit, its light now as a share of
 *             her whole light (its level times the share of her light whose sections' fuses hold on it), so that the
 *             pieces' lit sum to the circuits' sim.circuits.lit before the cut; null without sections. sections, when the
 *             hand-over has G1's circuits (sim.circuits, core/readers/circuits.js), in that table's order: piece, the
 *             index of the piece the section rides (by its middle), and out, the clock when its fuses blew (as
 *             sim.circuits had it at the hand-over, then the fall's), -1 while they hold. A section's main circuit is
 *             lit while its piece's level is 1 and its fuses hold, its emergency circuit while the level is above 0
 *             and they hold (G1's rule). Past the hand-over sim.circuits stands as the hand-over left it: read these
 *             instead
 *
 * FRAMES. Her own axes are the ship frame's: x forward from amidships, y to port, z up from the keel. The fall's world
 * frame is the core's at the hand-over: X along her heading then, Y to port of it, Z up, the sea's surface at Z = 0. At
 * the hand-over each piece has the core's own pose (R = Ry(pitch) Rx(roll), r = frameOf's translation), so she does not
 * jump. `at` puts that frame on the earth as core/motion.js has it (X north, Y east, psi clockwise from north):
 *   earth (N, E) = (at.X, at.Y) + X (cos psi, sin psi) + Y (sin psi, -cos psi)                    (earthOf below)
 * Fathom's frame has z down and y to starboard: a vector there is (x, -y, -z) here. Nothing of Fathom's is called.
 *
 * THE MOTION. Six degrees of freedom about the envelope's centroid C, her attitude a unit quaternion: no Euler angle
 * and no clamp anywhere (a falling hull passes 90 degrees). Kirchhoff's equations in her generalized momenta P, L with
 * M the whole 6 x 6 mass matrix about C (her structure, the water in her, less her air, plus the added mass):
 *   dP/dt = P x om + F          dL/dt = L x om + P x v + T          (Lamb 1932; Fossen 2011, 6.3)
 * so that Munk's moment, the P x v term, comes from the added masses alone, with no coefficient of its own. Water that
 * comes into her as her air is squeezed or vents arrives at rest: her momenta are kept and her speed falls.
 * THE STEP. Kick then drift, sub-stepped (sub in the water, subBed near and in the bed): each sub-step takes its
 * forces at the sub-step's middle (the implicit midpoint rule, iterated to 1e-12), then kicks the momenta and drifts
 * her place and attitude on the middle velocities (the attitude by the Cayley map). So the inviscid forces do no net
 * work, gravity and buoyancy work exactly through their potential (their density averaged over each point's path), and
 * the energy closes to rounding (tools/fall_trials.js, trial 2). Fathom's step (its motion.js) is the same
 * kick and drift, explicit, with its pitch clamped at 1.4 rad (:158), which this one must not have. In the step: no
 * Math.pow and no Math.hypot (core/motion.js's rule). Every transcendental is the model's own, plain arithmetic that
 * every engine computes alike (E1, E2a; QC B-7): C.sin and C.cos; C.log10 in the step's two lines (friction's Reynolds
 * number, the mud's rate factor) and C.atan2 for the joint's angle; C.log and C.tan only in its tables (the added mass,
 * Lamb's coefficients, the bed's slope). So a fall in the page has the same bits as in Node (tools/engine_tests.js
 * allows this file nothing). Halving the step moves her place on the bed by a millimetre (trials, "convergence").
 *
 * THE FORCES, slice by slice (docs/research/RESEARCH_falling_hull_physics_v1_2026-11-19.md, "R6", section 10; each
 * coefficient's source is beside it in K below):
 *   weight      the structure's, by the girder reader's curve (TitanicGirder.weight: the model's own, closed to sim.ms
 *               and its centre), at each slice's centroid; the water in her at the floodable volume's centroid
 *   buoyancy    the envelope's, at the local in-situ density (partly out of the sea: the section cut by the sea's plane
 *               at three Gauss points along the slice, exactly, at any attitude; there her drag is in proportion to how
 *               much of each slice is under, her added mass kept whole [mine: the water taken as unbounded; Z6's])
 *               Wholly flooded, the water in her and the envelope round it cancel, and what is left is her structure's
 *               weight against the buoyancy of her solids: the model's are her double bottom and the share of each space
 *               its permeability leaves, and they sit low. So the model's flooded hull is top-heavy, her weight in water
 *               acting about 0.5 m above her section's centre: falling flat the flow holds her keel down; end on, nothing
 *               does, and she turns over (tools/fall_trials.js, trials 5 and 12)
 *   air         one lumped pocket a piece, along her where her air was when the fall began, across her through each
 *               slice's floodable centre (K.airAt, G12; 'flag': where the air lay at the hand-over's pose, the default
 *               for a hand-over at the break's onset, K0.airAtBreak, D98): Boyle,
 *               isothermal, at its own depth; it vents through `vent` m2 (by default the core's own share of the top
 *               deck open to the sea, params.fOpen, over the piece's length) under a head of K.ventHead. A stand-in for
 *               Z6's spaces, which the what-if K.air 'spaces' puts in its place (M2 4c: core/readers/spaces.js; each
 *               space's own water and air, exchanged through the core's openings and the cut, giving way past its
 *               head with a 'report'; their air the pocket, its volume and its centroid, each sub-step)
 *   cross-flow  0.5 rho Cd h |c| c on each slice's cross-flow c, h and Cd by the face that leads (keel, deck, side)
 *   along her   form drag on the leading end (faired or torn), ITTC-57 friction with a roughness allowance
 *   lift        the slender body's, where the flow leaves a torn end: -|u| m'(end) c(end) (R6 10.1; e33's form)
 *   turning     each section's own cross-flow drag as it rolls about its centre [mine: the cross-flow principle
 *               applied across the section]
 *   added mass  2-D rectangles by each slice's own proportions (DNV-RP-C205 Table A-1 as R6 remembers it), the
 *               spheroid's k2 for the ends and k' for the turning modes (Lamb), k1 along her; at the column's mean
 *               density, so that her impulse is her own (0.9 % off at either end, a tenth of its own uncertainty)
 *   the bed     each slice below the mud line is resisted by R6's bearing law (True's form), q = R_f N_c s_u + 0.5 C_d
 *               rho_s v_n^2, on the shadow of its part in the mud, against its motion, at the centroid of its corners
 *               in the mud weighted by how far each is in; the mud does not pull. At her first touch the water she drags
 *               is shed (R6's default: not carried into the mud), its energy counted as the following water's. A piece
 *               whose every slice has moved slower than K.vRest for K.tRest, with the mud's static capacity under her
 *               above her weight in water, is held where it is ('at rest'). Z5 refines all of it
 *
 * NOT HERE (the plan's later steps): the spaces' own air and their reports by default (Z6: a what-if, K.air 'spaces',
 * without the joint), the three sets of columns at the surface (Z6), the bed's faces, adhesion and the landing's
 * bending (Z5), debris (Z7), currents, and any coupling between two pieces once the joint has let go (they do not touch
 * each other).
 *
 * Numbers: [read] where a source gives it, [derived] for arithmetic on them, [bet] where nothing was found, [textbook]
 * from memory, as R6 tags them; [mine] for a choice of this module's, with its reason.
 */
(function (root, factory) {
  // the girder reader is found when it is called, not when this file loads: the build bundles core/readers/ in name
  // order, so fall.js comes before girder.js in the page and the worker; so too section.js (the joint's law, S.hinge)
  // (and spaces.js, Z6's spaces, after it)
  // (G2) the plant's constants (core/systems.js), and G1's circuits (circuits.js, a reader: asked for only when a
  // hand-over carries sim.circuits, so that this file never loads it, and so never registers it, by itself)
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../core.js'), function () { return require('./girder.js'); }, require('../night.js'), function () { return require('./section.js'); }, function () { return require('./spaces.js'); }, function () { return require('../systems.js'); }, function () { return require('./circuits.js'); });
  else root.TitanicFall = factory(root.TitanicCore, function () { return root.TitanicGirder; }, root.TitanicNight, function () { return root.TitanicSection; }, function () { return root.TitanicSpaces; }, function () { return root.TitanicSystems; }, function () { return root.TitanicCircuits; });
})(typeof self !== 'undefined' ? self : this, function (C, girderOf, N, sectionOf, spacesLib, sysOf, circuitsOf) {
  'use strict';
  const GRAV = C.GRAV, DEG = Math.PI / 180, P_ATM = 101325;
  const RHO_AIR0 = P_ATM / (287.05 * 275.15);       // air at one atmosphere and 2 deg C, kg/m3 [textbook]
  const GAUSS = [[-Math.sqrt(0.6), 5 / 18], [0, 8 / 18], [Math.sqrt(0.6), 5 / 18]];   // 3-point Gauss on [-1, 1], weights / 2

  // ================================================================ the coefficients
  // Each with its source. A piece takes these, overridden by opts.K; the trials vary them by name.
  const K0 = {
    // cross-flow drag, effective (finite length included): beam-on 0.9 (0.6-1.2), keel-on 1.1 (0.8-1.4), deck-on 1.3
    // (1.0-1.6) [R6 1.2, 10.1, 10.10: bets, anchored by the surface model's fitted 0.72 in sway]
    cdBeam: 0.9, cdKeel: 1.1, cdDeck: 1.3,
    // along her, on her largest section: a faired end leading 0.25 (0.15-0.35), a torn end 0.95 (0.8-1.1), the whole
    // hull either way 0.15 [R6 1.2: Hoerner's base drag; flat face to cup]
    cdxFaired: 0.25, cdxTorn: 0.95, cdxWhole: 0.15,
    // skin friction: ITTC-57 plus 0.4e-3 (0.2-0.6e-3) on 0.85 of the girth times the length; nu of sea water at 2 deg C
    // [R6 10.1]
    dCf: 0.4e-3, wetShare: 0.85, nu: 1.75e-6,
    // added mass along her, a share of her displaced mass: 0.04 whole, 0.08 bow, 0.12 stern [R6 10.2]; a body of no
    // kind takes Lamb's k1 for its own proportions
    k1: { whole: 0.04, bow: 0.08, stern: 0.12 },
    // roll: 0.25 rho pi (B/2)^4 a metre [R6 10.2: bet, 0.2-0.3]
    rollAdded: 0.25,
    lift: 1,          // the slender body's lift at a torn trailing end [R6 10.1]; 0: none (e34's what-if)
    turn: 1,          // each section's own drag as it rolls [mine]
    potential: 1,     // Kirchhoff's added-mass terms (0 for a test of the rest alone)
    drag: 1,          // the viscous and separated terms (cross-flow, along her, friction, lift, turning)
    // the air: one lumped pocket. Isothermal [R6 4.1: n = 1, the brainstorm's]. Vent: Cd 0.6 [textbook], head 5 m [R6
    // 4.2: the air's height over the opening, 2-10 m]
    ventCd: 0.6, ventHead: 5,
    // where the pocket's lift acts in her, a stand-in until Z6's spaces carry each space's air [mine; G12, from QC B's
    // B-1, 2026-11-20]. Along her the pocket stands where her air was at the hand-over, slice by slice, in either case.
    // Across her:
    //   'centre': through each slice's own floodable centre, the default since G12 (Z1's call, at the coordinator's
    //             word, 2026-11-20: an interim until milestone 2's air space by space). The air at the top of a round
    //             section lifts through the section's centre whichever way she turns (the round-section idealisation;
    //             in a wide flat space the air seeks a corner, which Z6's spaces carry). Handed over at the flag, both
    //             pieces land upright as she is; a piece still turns over if her list there passes a threshold (on
    //             join 6's watch the bow beyond about 83 deg; the flag's is the core's clamp, 80) (trial 14).
    //   'flag':   where the air lay at the hand-over's pose, kept fixed in her as she turns (the engine to G12). At the
    //             flag's 80 deg of list that point is low in her: a lift under her weight in water, which holds a piece
    //             keel up (the watch's bow beyond about 75 deg of list), so that which way a piece lands turned on a
    //             hair (Q1; trial 14).
    airAt: 'centre',
    // and handed over at the break's onset (rule 'break'): 'flag' by default (D98, Bo 2026-11-23: G12's option (a)
    // with the onset's own air). There she is near upright (about 7 deg by the head, 1 to 11 of list on the kept set),
    // so her air lies high in her dry spaces, where 'flag' puts it, and 'centre' is the one that misplaces it. From
    // the onset both pieces land upright in all five ways on 30 of the kept set's 30 members with 'flag', 26 with
    // 'centre' (e117). An explicit K.airAt still wins
    airAtBreak: 'flag',
    // B4's joint from the onset (gate 1, docs/DESIGN_B4_Z6_the_break_from_the_onset_gates_1_2_v1_2026-11-23.md): 1 joins
    // the pieces at the onset's station in its sense when the reader hands over there; 0, the default until join 20, the
    // cut fall. A begin() given its own hinge is unchanged by it
    jointOnset: 0,
    // her air (M2, 4c): 'pocket', the one lumped pocket a piece above (the default, as before to the bit); 'spaces', the
    // what-if of Z6's spaces (core/readers/spaces.js): each of the piece's share of the core's 64 spaces holds its own
    // water and air, the air at its own pressure, exchanged through the core's openings and the cut's torn faces (e84's
    // laws), the spaces giving way past their heads (K.failHead, K.failShare) with a 'report' each, from the hand-over
    // on. Each sub-step the spaces are stepped at her pose and their air stands in as the pocket: its whole volume, its
    // lift through its volume-weighted centroid (exact for the moment of parallel forces). Not yet with the joint. The
    // spaces' own bets pass through K too: K.slot, K.clear and K.cutCd (openingsOf), K.failHead and K.failShare
    // (failSpaces), each defaulted there
    air: 'pocket',
    // the spaces' own step (K.air 'spaces'): they are stepped at most this often, the sub-steps between taking the
    // pocket as their last step left it (near the bed a sub-step is 1/256 s, for the mud) [mine: trial 17's step]
    spaceDt: 1 / 32,
    // a space giving way is a 'report', an audible failure, past this energy, J [bet: about 0.1 GJ, R6 4.4's scale; the
    // design v1, section 5]; every failure stays in the engine's own list (each body's spc.ev, with its node)
    reportMin: 1e8,
    // how the spaces give way (K.air 'spaces'): 'boundaries', section 5's fuller form, the default since its review
    // (failBoundaries: each space once, at its weakest link: each bulkhead, joiner work and E deck at its own head into the
    // space across it, K.headBulkhead, K.headJoiner, K.headDeckBelow, K.headDeckAbove; the shell at K.headShell to the
    // sea); 'simple', failSpaces' first form (a space lagging the sea past K.failHead gives way to the sea)
    fail: 'boundaries',
    // under K.fail 'boundaries', how often a space gives way (spaces.failBoundaries): 'space', once, at its weakest link,
    // and then it holds at any load (the default, as before to the bit); 'boundary', each boundary and each space's
    // shell once, so a space can give way again at another link (a what-if: the stern-work team found spaces holding
    // air 46 to 67 m behind the sea once given way, past the shell's 40 m)
    failOnce: 'space',
    // the watertight doors under K.air 'spaces' (Z1, 2026-11-24, with the mainline's e120): 'core', the default, the
    // core's own law mirrored (spaces.doorsOf, doorsStep): a door open at the hand-over with its float armed is released
    // once water stands params.floatDepth over the lowest point of a space below E deck either side of its bulkhead, and
    // falls shut over params.doorFall; 'none', each door as the hand-over left it, open to the bed (the fall before, and
    // e120's held-open bracket). With every door shut at the hand-over, as on the model's own 1912 night, the two are
    // the same bits
    floats: 'core',
    // the openings to the weather under K.air 'spaces' (Z1, 2026-11-24, the coordinator's (3); D115's fourth consistency,
    // the default since join 22, D116): 'core', the core's own law mirrored (spaces.weatherOf, weatherStep): each gives
    // way, for good, when the sea's head over its centre less the head of the water behind it reaches its own strength,
    // and a dome when the sea stands params.hAir over the lintels of its staircase's given-way doors; 'none', each as the
    // hand-over left it (the fall before join 22, a what-if: on member C 1 of the 197 had given way at the onset and 58
    // had the sea at their sills, and the others never opened in the fall)
    weather: 'core',
    // the spaces' one-way limiter (K.air 'spaces'; e84's safeguard 1, spaces.stepPiece): 'held', the default since D108
    // (join 20; Z1 on the stern-work team's finding, 2026-11-23): a space whose water stands over an open opening to the
    // sea, or to a held space, has its pressure kept by the sea, so its own stiffness leaves the pair's limiter (a sealed
    // space keeps its own); 'pair', the limiter before D108 (a what-if, to the bit): each side of an opening judged by its
    // own stiffness, its free surface's and its air's, so a full space fed by the sea (its free surface's area floored at
    // 1e-6 m2) or a nearly full one with a trapped bubble passes a dry neighbour 1 to 2 m3/s where the law asks 265 and
    // the stern hangs on them (fall_trials, trial 18; e119)
    limiter: 'held',
    // her solids in the fall (D(G12-e)'s step 3): 'core', what the core's permeabilities leave of each space (with the
    // double bottom), as before to the bit; 'items', each zone's solids made B1+B2's item-by-item volume (SOLIDS_ITEMS),
    // the zone's floodable volume and the hand-over's water in it scaled together (each slice keeps its fill), the core's
    // own permeabilities untouched (under K.air 'spaces', each space's room, permeability, water and air by the same
    // factor). K.wood: 'afloat' or 'soaked', the items' one switch (their band's spread, 1,544 m3)
    solids: 'core', wood: 'afloat',
    // G7's peak tank in the fall (Z1, 2026-11-24, on the hand-over's gap; the default since join 22, D116): the tank
    // shares no column with its space (its pocket's overlap is false), so it lies outside the floodable volume. 'weighed'
    // weighs its water as the core's loads and the girder do (C.pocketPoints: min(vol, cap) at the core's own point, at
    // the core's RHO), a mass in the slice where it stands, carried with her; the room stays in the envelope, so a full
    // tank is neutral, as a sealed tank of sea water is. 'solid' is the fall before join 22 (a what-if): the room buoyant
    // and its water not weighed, the bow light by the tank's water against the core and the gauge (330.7 t at x 119.89 on
    // member C at its onset). W6's bunker lies inside its space's columns and is weighed either way
    peakTank: 'weighed',
    // each slice's section in the fall (Z1, 2026-11-24, D115, with B1+B2): the polygon her buoyancy at the surface is
    // clipped on (three Gauss sections a slice), her bounding radii and the mud's corners are taken from, and its girth
    // her wetted area. 'full', the default since join 22 (D116): every column, the core's own section. 'decimated' is the
    // fall before join 22 (a what-if): every k-th column, about twelve a side, which at member C's onset (trim 6.93 deg; the
    // waterline across all the stern's slices and the bow's after 31) put the bow's centre of buoyancy 0.62 m forward and
    // the stern 70 t short against the core's own columns: 0.33 of the hand-over's 0.35 % in the joint's moment and its 1 %
    // in the shear. With 'full' the stern's statics at the joint's pin are the gauge's to 0.002 % (the rest the fall's
    // in-situ density, its own, against the core's uniform 1025). The slices' clip holds at any attitude, as the core's
    // column prisms would not
    section: 'full',
    // what her weight in water is measured against: the column's mean density, for her inertia and her added mass [mine]
    rhoRef: null,
    // the bed's regularization [mine, bets]: below vReg the mud's resistance falls in proportion to the speed (a plastic
    // law made smooth, so that the step need not stop on a discontinuity); a slice's face comes to bear over its own tilt
    // along her plus `ramp` m. The mud is plastic: a piece whose every slice has moved slower than vRest for tRest
    // seconds, with the mud's static capacity under her (N_c s_u on each slice's bearing) above her weight in water, is
    // held where it is ('at rest'). A plastic body would have stopped within v^2 M / (2 (capacity - weight)) of there:
    // centimetres
    vReg: 0.2, ramp: 0.5, vRest: 0.2, tRest: 0.5,
    // the water she drags is not carried into the mud [R6 10.7: "not carried in", the default of its worked example; a
    // switch]: at her first touch of the bed its momentum is shed (it flows on round her: the following water), and she
    // strikes with her own mass and the water in her. 1: carried in fully
    strikeAdded: 0,
    // the tiers' share of the section the water acts on, 0 to 1 [bet; decision D52, Bo's: 0]. The tiers above B deck
    // (each column above cols.zhiH, where the ship gives it) count for her buoyancy, her weight and the water in her at
    // any value; this says how far they also stand in the flow, for her added mass, her cross-flow and turning drag, and
    // where those act. 0, the default since D52 (Bo, 2026-11-20 10:09 CST: "yes share 0"): her hull's own envelope only,
    // because by the time she falls the tiers are no wall: their windows give way at 1.5 m of head (hWin in the core) and
    // a 10 m/s fall puts about 5 m on them; the A-deck promenade is open at the sides and the boat deck's houses are
    // narrower than her beam; the wreck's superstructure was largely stripped on the way down. 1: a solid wall to the
    // flow, as her hull is; on the tiers her sections are then taller than wide, and the flow lays every piece on its side
    // (docs/research/experiments/e60). Between, the share of the tiers' section that stands.
    // D76's D(G12-e) (2026-11-21) splits that one share in two, by what it moves:
    //   tiersAdded: the tiers' part in her added mass and in the torn end's lift. 0: D52's reason (a row of windows
    //               entrains little).
    //   tiersSide:  their side in her cross-flow and turning drag, and where those act: their solidity to a flow across
    //               her, 0.85 [derived: R3's openings on B, A and the Boat deck, in her side or a house wall, from
    //               the deck plans (data/rooms/openings.json, R3's c549e38), 154 m2 open to port and 172 to starboard,
    //               the glass gone, against the model's own tiers' side, 1,125 m2 a side (each slice's envelope above
    //               the hull's top): 0.863 and 0.847; 13 doors the table gives no area leave it about 1 % high]. A
    //               plate under about 20 % open keeps a solid plate's wake (Castro 1971 [search summary, in B1+B2's
    //               note 04bbb18, docs/DESIGN_G12_the_break_side_v1_2026-11-21.md, section 2]). Band: 0.5 to 1.
    // tiersFlow, where a run gives it, sets both: D52's one number, for the what-ifs and the experiments that name it
    // (e60 to e66). null: the two shares below
    tiersFlow: null, tiersAdded: 0, tiersSide: 0.85,
    // the step [mine; tools/fall_trials.js shows it converged]: sub-steps of the model's dt in the water and within
    // bedNear m of the bed; the midpoint's iteration
    sub: 8, subBed: 64, bedNear: 5, iterMax: 100, tol: 1e-12,
  };

  // the 2-D rectangle's added-mass coefficient against the ratio of the side across the motion to the side along it
  // (a/b), DNV-RP-C205 Table A-1 after Wendel 1956, as R6 1.3 remembers it [textbook]: interpolated in ln(a/b)
  const CA_RECT = [[0.1, 2.23], [0.2, 1.98], [0.5, 1.70], [1, 1.51], [2, 1.36], [5, 1.21], [10, 1.14], [1e6, 1.00]];
  function caRect(ab) {
    if (!(ab > CA_RECT[0][0])) return CA_RECT[0][1];
    for (let i = 1; i < CA_RECT.length; i++) {
      if (ab <= CA_RECT[i][0]) { const a = CA_RECT[i - 1], b = CA_RECT[i], u = C.log(ab / a[0]) / C.log(b[0] / a[0]); return a[1] + (b[1] - a[1]) * u; }
    }
    return 1.0;
  }
  // Lamb's coefficients of a prolate spheroid of length over diameter LD: along (k1), across (k2), turning (kr)
  // [R6 1.3: Lamb 1932; it reproduces 0.021 / 0.960 / 0.883 at 10 and 0.059 / 0.894 / 0.700 at 5]
  function lamb(LD) {
    if (!(LD > 1.0001)) return { k1: 0.5, k2: 0.5, kr: 0 };
    const e = Math.sqrt(1 - 1 / (LD * LD)), e2 = e * e, e3 = e2 * e, lg = C.log((1 + e) / (1 - e));
    const a0 = 2 * (1 - e2) / e3 * (0.5 * lg - e), b0 = 1 / e2 - (1 - e2) / (2 * e3) * lg;
    return { k1: a0 / (2 - a0), k2: b0 / (2 - b0), kr: e2 * e2 * (b0 - a0) / ((2 - e2) * (2 * e2 - (2 - e2) * (b0 - a0))) };
  }

  // ================================================================ the sea
  // EOS-80 (UNESCO 1983, Fofonoff and Millard; R6 5.1): in-situ density from salinity, temperature (IPTS-68) and
  // pressure (bar). It gives UNESCO's eight check values to 5e-6 kg/m3 and R6's 1,070.95838408 at (35, 0, 10,000 dbar).
  function rhoEOS(S, t, pb) {
    const t2 = t * t, t3 = t2 * t, t4 = t3 * t, t5 = t4 * t, s15 = S * Math.sqrt(S);
    const rw = 999.842594 + 6.793952e-2 * t - 9.095290e-3 * t2 + 1.001685e-4 * t3 - 1.120083e-6 * t4 + 6.536332e-9 * t5;
    const r0 = rw + (8.24493e-1 - 4.0899e-3 * t + 7.6438e-5 * t2 - 8.2467e-7 * t3 + 5.3875e-9 * t4) * S + (-5.72466e-3 + 1.0227e-4 * t - 1.6546e-6 * t2) * s15 + 4.8314e-4 * S * S;
    const Kw = 19652.21 + 148.4206 * t - 2.327105 * t2 + 1.360477e-2 * t3 - 5.155288e-5 * t4;
    const K = Kw + (54.6746 - 0.603459 * t + 1.09987e-2 * t2 - 6.1670e-5 * t3) * S + (7.944e-2 + 1.6483e-2 * t - 5.3009e-4 * t2) * s15
      + (3.239908 + 1.43713e-3 * t + 1.16092e-4 * t2 - 5.77905e-7 * t3 + (2.2838e-3 - 1.0981e-5 * t - 1.6078e-6 * t2) * S + 1.91075e-4 * s15) * pb
      + (8.50935e-5 - 6.12293e-6 * t + 5.2787e-8 * t2 + (-9.9348e-7 + 2.0816e-8 * t + 9.1697e-10 * t2) * S) * pb * pb;
    return r0 / (1 - pb / K);
  }
  // Mackenzie (1981), the speed of sound, m/s, for the readouts (as Fathom's core/ocean.js has it) [textbook]
  function mackenzie(T, S, D) {
    return 1448.96 + 4.591 * T - 5.304e-2 * T * T + 2.374e-4 * T * T * T + 1.340 * (S - 35) + 1.630e-2 * D + 1.675e-7 * D * D - 1.025e-2 * T * (S - 35) - 7.139e-13 * T * D * D * D;
  }
  // The column for an April night at the wreck: R6 5.2's nodes. The temperatures and salinities are its bets; the
  // density is computed. The 1912 sea: 3,790 m to the bed [R5 10a; decision D38], half a degree of slope, its direction
  // drawn from the night's seed (D38), at the wreck's latitude [R5 1.1].
  const PROFILES = {
    april1912: {
      z: [0, 10, 50, 100, 200, 500, 1000, 2000, 3000, 3784, 3800],
      T: [0, 0, 0, 1, 3.5, 4.2, 3.6, 3.1, 2.5, 2.0, 2.0],
      S: [32.80, 32.84, 33.00, 33.60, 34.40, 34.90, 34.90, 34.93, 34.93, 34.90, 34.90],
    },
  };
  // the bed: s_u = 2 + 1.8 z kPa (1-5, 1.2-2.5 a metre), N_c 7.5 on the flat (9 at a prow; 5.14-9), R_f = 1 + 0.1
  // log10(rate / 1e-5) capped at 4, C_d 0.8, the mud 1,600 kg/m3 [R6 6.2, 10.7: bets anchored by 25 kPa at 10-16 m];
  // the overburden term gamma' d off, as the plan's 4.6 and R6's worked example have it
  const SOIL = { su0: 2000, suK: 1800, Nc: 7.5, lambda: 0.1, gref: 1e-5, rfMax: 4, cd: 0.8, rho: 1600, overburden: 0 };
  // her solids by zone, item by item (K.solids 'items', D(G12-e)'s step 3): m3 a zone, bow to stern, with her wood afloat
  // (2,200 t at 0.6) and soaked (to neutral). B1+B2's list of 2026-11-21 (their note's v1.1; abacus receipts
  // 7edb6df9d626, e234b9c108a4, 29847baa331c, bf7c27c37f4c): the boilers and their water, coal, engines, turbine,
  // dynamos, shafts, castings, cargo, liquids and stores, people, hull steel, fittings, wood, each placed by zone [their
  // bets where marked: the heights, coal's density, the liquids' places, the fittings' density]. 19,091 or 17,547 m3 in all
  const SOLIDS_ITEMS = {
    afloat: [210, 719, 920, 999, 1607, 1834, 1864, 1864, 1947, 1165, 1688, 1210, 1154, 1022, 519, 368],
    soaked: [172, 672, 853, 918, 1505, 1710, 1735, 1735, 1811, 1084, 1531, 1088, 1039, 939, 449, 307],
  };
  const SEA_1912 = { depth: 3790, slope: 0.5, lat: 41.73, profile: 'april1912' };
  const lin = (xs, ys, x) => { if (x <= xs[0]) return ys[0]; for (let i = 1; i < xs.length; i++) if (x <= xs[i]) return ys[i - 1] + (ys[i] - ys[i - 1]) * (x - xs[i - 1]) / (xs[i] - xs[i - 1]); return ys[ys.length - 1]; };
  // a deterministic stream from a 32-bit seed (mulberry32, as core/night.js has it)
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  // spec: { depth, slope (deg), lat (deg), profile, seed, psi (rad: her heading, to turn the bed's dip into the fall's
  //   frame), uniform (kg/m3: a column of one density, for the closed-form tests), soil: {} }
  function sea(spec) {
    spec = Object.assign({}, SEA_1912, spec || {});
    const depth = +spec.depth, DZ = 5, n = Math.ceil((depth + 300) / DZ) + 1, P = PROFILES[spec.profile] || PROFILES.april1912;
    const sl = C.sin(spec.lat * DEG), s2 = sl * sl;
    const g0 = 9.7803253359 * (1 + 0.00193185265241 * s2) / Math.sqrt(1 - 0.00669437999013 * s2);   // normal gravity (Somigliana, WGS84)
    const T = new Float64Array(n), S = new Float64Array(n), rho = new Float64Array(n), p = new Float64Array(n), phi = new Float64Array(n), c = new Float64Array(n);
    const uni = spec.uniform ? +spec.uniform : 0;
    let pg = 0;                                     // gauge pressure, Pa, integrated in 1 m steps (midpoint, R6's way)
    for (let i = 0; i < n; i++) {
      const z = i * DZ;
      T[i] = lin(P.z, P.T, z); S[i] = lin(P.z, P.S, z);
      rho[i] = uni || rhoEOS(S[i], 1.00024 * T[i], pg / 1e5);
      p[i] = P_ATM + pg; c[i] = mackenzie(T[i], S[i], z);
      if (i < n - 1) for (let k = 0; k < DZ; k++) {
        const zm = z + k + 0.5, g = g0 + 3.086e-6 * zm;   // the free-air gradient [textbook], as R6 integrated it
        let r = uni || rhoEOS(lin(P.z, P.S, zm), 1.00024 * lin(P.z, P.T, zm), (pg + 0.5 * 1030 * g) / 1e5);
        if (!uni) r = rhoEOS(lin(P.z, P.S, zm), 1.00024 * lin(P.z, P.T, zm), (pg + 0.5 * r * g) / 1e5);
        pg += r * g;
      }
    }
    // the integral of the density, kg/m2, exact for the density linear between nodes (the potential of buoyancy)
    for (let i = 1; i < n; i++) phi[i] = phi[i - 1] + 0.5 * (rho[i - 1] + rho[i]) * DZ;
    // the bed: deepening by `slope` toward a bearing drawn from the seed; its dip turned into the fall's frame
    const r = rng(((spec.seed === undefined ? 1912 : spec.seed) ^ 0x5bd1e995) >>> 0);
    const bearing = 2 * Math.PI * r(), psi = spec.psi || 0;
    const bed = Object.assign({ depth, slope: spec.slope * DEG, bearing, dipX: C.cos(bearing - psi), dipY: -C.sin(bearing - psi) }, SOIL, spec.soil || {});
    // as the page reads the bed (Z2's note of 15:04): depth(X, Y) = depth + slope . (X, Y) + relief (none here)
    const tg = C.tan(bed.slope), slope = [tg * bed.dipX, tg * bed.dipY]; bed.tan = Math.abs(tg);
    return { depth, dz: DZ, n, lat: spec.lat, g: g0, uniform: uni, profile: spec.profile, T, S, rho, p, phi, c, slope, relief: [], bed };
  }
  // at a depth d (m, positive down): density, its integral, pressure (Pa absolute), temperature, the bed's depth
  function rhoAt(sp, d) {
    if (!(d > 0)) return sp.rho[0];
    const f = d / sp.dz, i = Math.floor(f);
    if (i >= sp.n - 1) return sp.rho[sp.n - 1];
    return sp.rho[i] + (sp.rho[i + 1] - sp.rho[i]) * (f - i);
  }
  function phiAt(sp, d) {
    if (!(d > 0)) return sp.rho[0] * d;
    let i = Math.floor(d / sp.dz); if (i > sp.n - 2) i = sp.n - 2;
    const u = d - i * sp.dz;
    return sp.phi[i] + sp.rho[i] * u + 0.5 * (sp.rho[i + 1] - sp.rho[i]) / sp.dz * u * u;
  }
  // the density a point meets on its way from depth d0 to d1 (the mean, so that buoyancy works through its potential)
  function rhoPath(sp, d0, d1) {
    const c0 = d0 > 0 ? Math.floor(d0 / sp.dz) : -1, c1 = d1 > 0 ? Math.floor(d1 / sp.dz) : -1;
    if (c0 === c1 || d1 === d0) return rhoAt(sp, 0.5 * (d0 + d1));      // linear within a cell: the middle's is the mean
    return (phiAt(sp, d1) - phiAt(sp, d0)) / (d1 - d0);
  }
  function pAt(sp, d) {
    if (!(d > 0)) return P_ATM;
    const f = d / sp.dz, i = Math.floor(f);
    if (i >= sp.n - 1) return sp.p[sp.n - 1];
    return sp.p[i] + (sp.p[i + 1] - sp.p[i]) * (f - i);
  }
  function tempAt(sp, d) { const f = (d > 0 ? d : 0) / sp.dz, i = Math.floor(f); return i >= sp.n - 1 ? sp.T[sp.n - 1] : sp.T[i] + (sp.T[i + 1] - sp.T[i]) * (f - i); }
  function bedDepth(sp, X, Y) { return sp.depth + sp.slope[0] * X + sp.slope[1] * Y; }
  function earthOf(fall, X, Y) { const a = fall.at, c = C.cos(a.psi), s = C.sin(a.psi); return [a.X + X * c + Y * s, a.Y + X * s - Y * c]; }

  // ================================================================ the model's slices (static for a ship)
  // Each of the ship's column slices, from the stern forward: its envelope (volume, centroid, breadth, depth, section
  // polygon, girth) and its floodable volume (the nodes' columns, at their permeabilities). Cached by ship, outside any
  // sim, as the girder reader caches its curves.
  const SHIPS = new WeakMap();
  function shipTables(ship) {
    let T = SHIPS.get(ship); if (T) return T;
    const c = ship.cols, sl = c.slices.slice().sort((a, b) => a.xc - b.xc), nS = sl.length;
    const colSlice = new Int32Array(c.N);
    const A = (k) => new Float64Array(k);
    T = { nS, colSlice, xc: A(nS), dx: A(nS), zone: new Int32Array(nS), e: A(nS + 1), Venv: A(nS), ey: A(nS), ez: A(nS), Vf: A(nS), fy: A(nS), fz: A(nS), B: A(nS), H: A(nS), zlo: A(nS), zhi: A(nS), Hh: A(nS), ezh: A(nS), Vh: A(nS), perim: A(nS), poly: [], perimFull: A(nS), polyFull: [] };
    // the hull's own top, where the ship gives it apart from the tiers above it (cols.zhiH); else the columns' top
    const top = c.zhiH || c.zhi;
    for (let j = 0; j < nS; j++) {
      const s = sl[j];
      T.xc[j] = s.xc; T.dx[j] = s.dx; T.zone[j] = s.zone; T.e[j] = s.xc - 0.5 * s.dx;
      let V = 0, my = 0, mz = 0, ymax = 0, zlo = 1e9, zhi = -1e9, Vh = 0, mzh = 0, zhh = -1e9;
      const port = [];
      for (let i = s.first; i < s.first + s.count; i++) {
        colSlice[i] = j;
        const v = c.dxdy[i] * (c.zhi[i] - c.zlo[i]);
        V += v; my += v * c.y[i]; mz += v * 0.5 * (c.zlo[i] + c.zhi[i]);
        const ay = Math.abs(c.y[i]); if (ay > ymax) ymax = ay;
        if (c.zlo[i] < zlo) zlo = c.zlo[i]; if (c.zhi[i] > zhi) zhi = c.zhi[i];
        const th = top[i] < c.zhi[i] ? top[i] : c.zhi[i];
        if (th > c.zlo[i]) { const vh = c.dxdy[i] * (th - c.zlo[i]); Vh += vh; mzh += vh * 0.5 * (c.zlo[i] + th); if (th > zhh) zhh = th; }
        if (c.side[i] === 0) port.push([c.y[i], c.zlo[i], c.zhi[i]]);
      }
      T.Venv[j] = V; T.ey[j] = V > 0 ? my / V : 0; T.ez[j] = V > 0 ? mz / V : 0.5 * (zlo + zhi);
      T.B[j] = 2 * ymax + c.dy; T.H[j] = zhi - zlo; T.zlo[j] = zlo; T.zhi[j] = zhi;
      T.Hh[j] = zhh > zlo ? zhh - zlo : T.H[j]; T.ezh[j] = Vh > 0 ? mzh / Vh : T.ez[j]; T.Vh[j] = Vh;
      // the section as a polygon: its bottom from starboard to port, then its top back; every k-th column, the outer
      // edge at the outer column's side. The hull is the same both sides of her centreline (the columns are). Two of
      // them (K.section): every k-th column, about twelve a side (the default, as before), and every column (the
      // section at full resolution), each with its girth
      port.sort((a, b) => a[0] - b[0]);
      const sectionOf = (step) => {
        const m = port.length, pick = [];
        for (let k = 0; k < m; k += step) pick.push(port[k]);
        if (pick[pick.length - 1] !== port[m - 1]) pick.push(port[m - 1]);
        const Y = port[m - 1][0] + 0.5 * c.dy, py = [], pz = [];
        const at = (k) => (k === pick.length - 1 ? Y : pick[k][0]);
        for (let k = pick.length - 1; k >= 0; k--) { py.push(-at(k)); pz.push(pick[k][1]); }
        for (let k = 0; k < pick.length; k++) { py.push(at(k)); pz.push(pick[k][1]); }
        for (let k = pick.length - 1; k >= 0; k--) { py.push(at(k)); pz.push(pick[k][2]); }
        for (let k = 0; k < pick.length; k++) { py.push(-at(k)); pz.push(pick[k][2]); }
        let per = 0; for (let k = 0; k < py.length; k++) { const k2 = (k + 1) % py.length; per += Math.sqrt((py[k2] - py[k]) * (py[k2] - py[k]) + (pz[k2] - pz[k]) * (pz[k2] - pz[k])); }
        return { poly: { y: py, z: pz }, per };
      };
      const sd = sectionOf(Math.max(1, Math.ceil(port.length / 12))), sf = sectionOf(1);
      T.poly.push(sd.poly); T.perim[j] = sd.per;
      T.polyFull.push(sf.poly); T.perimFull[j] = sf.per;
    }
    T.e[nS] = sl[nS - 1].xc + 0.5 * sl[nS - 1].dx;
    // the floodable volume: every node's columns at its permeability (the core's own nodeVmax, spread by slice)
    const NNs = ship.nodeVmax.length;
    for (let n = 0; n < NNs; n++) {
      const mu = ship.nodeMu[n], s1 = ship.nodeStart[n] + ship.nodeCount[n];
      for (let jj = ship.nodeStart[n]; jj < s1; jj++) {
        const i = ship.entCol[jj], a = ship.entA[jj], b = ship.entE[jj], v = mu * c.dxdy[i] * (b - a), k = colSlice[i];
        T.Vf[k] += v; T.fy[k] += v * c.y[i]; T.fz[k] += v * 0.5 * (a + b);
      }
    }
    for (let j = 0; j < nS; j++) { const v = T.Vf[j]; if (v > 0) { T.fy[j] /= v; T.fz[j] /= v; } else { T.fy[j] = T.ey[j]; T.fz[j] = T.ez[j]; } }
    SHIPS.set(ship, T);
    return T;
  }

  // The water in her as the core leaves it, by slice: each space's free surface solved again for the pose and the
  // water now in it, the water capped at what the space holds (the core keeps water "pressed over" in full spaces: that
  // is dropped), spread over its columns. It mirrors the girder reader's waterBySlice, which mirrors the core's
  // solveLevels (the same merging of port and starboard, the same column cut): a change to either needs it here too.
  function waterBySlice(sim, F, T) {
    const ship = sim.ship, c = ship.cols, iR = 1 / F.R22, nS = T.nS;
    const W = new Float64Array(nS), WY = new Float64Array(nS), WZ = new Float64Array(nS);
    const tV = new Float64Array(nS), tY = new Float64Array(nS), tZ = new Float64Array(nS);
    let dv = 0, zmin = 0, zmax = 0;
    const pass = (n1, n2, h, bounds) => {
      tV.fill(0); tY.fill(0); tZ.fill(0);
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
          const v = c.dxdy[i] * L * mu, k = T.colSlice[i];
          vol += v; tV[k] += v; tY[k] += v * c.y[i]; tZ[k] += v * (a + 0.5 * L);
        }
      }
      dv = a2 * iR;
      return vol;
    };
    const spread = (n1, n2, V, h0) => {
      const Vmax = ship.nodeVmax[n1] + (n2 >= 0 ? ship.nodeVmax[n2] : 0);
      if (V > Vmax) V = Vmax;                        // the phantom water dropped
      if (!(V > 1e-6)) return;
      let vol = pass(n1, n2, 1e9, true);
      if (!(zmax > zmin) || !(vol > 0)) return;
      if (V < Vmax * (1 - 1e-7)) {
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
      }
      const s = vol > 0 ? V / vol : 0;
      for (let j = 0; j < nS; j++) { if (tV[j] === 0) continue; W[j] += tV[j] * s; WY[j] += tY[j] * s; WZ[j] += tZ[j] * s; }
    };
    const nZ = ship.zones.length;
    for (let k = 0; k < nZ; k++) for (let L = 0; L < 2; L++) {
      const nP = C.nodeIndex(k, 0, L), nS2 = C.nodeIndex(k, 1, L), g = k * 2 + L;
      let merged = sim.mergeAlways[g] === 1;
      if (!merged && L === 0) {
        const zMw = C.worldZ(F, ship.zones[k].xm, 0, sim.zMerge[k]);
        merged = sim.vol[nP] > 1e-6 && sim.vol[nS2] > 1e-6 && sim.level[nP] > zMw + 0.05 && sim.level[nS2] > zMw + 0.05;
      }
      // C5 (the epoch, dark): with params.weighOverfill 0 each space weighs its capacity, so a merged pair's water is each
      // side's cut at its own room, as C.eachWater(sim, fn, true) gives it; at 1 (today) the pair is cut as a pair
      if (merged) spread(nP, nS2, sim.params.weighOverfill === 0 ? Math.min(sim.vol[nP], ship.nodeVmax[nP]) + Math.min(sim.vol[nS2], ship.nodeVmax[nS2]) : sim.vol[nP] + sim.vol[nS2], sim.level[nP]);
      else { spread(nP, -1, sim.vol[nP], sim.level[nP]); spread(nS2, -1, sim.vol[nS2], sim.level[nS2]); }
    }
    // W6: a pocket's water (the bunker of the fire) as the core weighs it (C.pocketPoints), in the slice where it stands,
    // as the girder reader takes it. Its water is its own, not in sim.vol: without this the fall would count the
    // pocket's room as air (QC B, B-3)
    if (sim.pockets) for (const pk of sim.pockets) {
      if (!(pk.vol > 0)) continue;
      const pts = C.pocketPoints(sim, F, pk);
      for (let i = 0; i < pts.length; i += 4) {
        const x = pts[i + 1]; let j = -1;
        for (let q = 0; q < nS; q++) { const a = Math.min(T.e[q], T.e[q + 1]), b = Math.max(T.e[q], T.e[q + 1]); if (x >= a && x < b) { j = q; break; } }
        if (j >= 0) { W[j] += pts[i]; WY[j] += pts[i] * pts[i + 2]; WZ[j] += pts[i] * pts[i + 3]; }
      }
    }
    return { W, WY, WZ };
  }

  // The structure's weight over [lo, hi] from the girder's curve: its mass (kg), centroid and second moments about the
  // centroid, exact for the curve's linear pieces (so that the pieces of a cut ship sum to the whole to rounding)
  function structureIn(cv, lo, hi) {
    const xm = 0.5 * (lo + hi);
    let m = 0, m1 = 0, m2 = 0, mz = 0, mzz = 0, m1z = 0;
    for (const p of cv.pieces) {
      const u0 = lo > p.x0 ? lo : p.x0, u1 = hi < p.x1 ? hi : p.x1;
      if (!(u1 > u0)) continue;
      const s = (p.w1 - p.w0) / (p.x1 - p.x0), a = p.w0 + s * (xm - p.x0), v0 = u0 - xm, v1 = u1 - xm;
      const d1 = v1 - v0, d2 = 0.5 * (v1 * v1 - v0 * v0), d3 = (v1 * v1 * v1 - v0 * v0 * v0) / 3, d4 = 0.25 * (v1 * v1 * v1 * v1 - v0 * v0 * v0 * v0);
      const pm = (a * d1 + s * d2) * 1000, p1 = (a * d2 + s * d3) * 1000, p2 = (a * d3 + s * d4) * 1000;
      m += pm; m1 += p1; m2 += p2; mz += pm * p.z; mzz += pm * p.z * p.z; m1z += p1 * p.z;
    }
    if (!(m > 1e-9)) return { m: 0, gx: xm, gz: cv.KG, sxx: 0, szz: 0, sxz: 0 };
    const gl = m1 / m, gz = mz / m;
    return { m, gx: xm + gl, gz, sxx: m2 - m * gl * gl, szz: mzz - m * gz * gz, sxz: m1z - m * gl * gz };
  }

  // a point mass (kg) added to a slice's structure: its mass, centroid and second moments about the centroid (the
  // parallel axes), so that the weight and the body's mass matrix take it as they take the slice's structure
  function addMass(s, m2, px, py, pz) {
    const m1 = s.ms, M = m1 + m2;
    if (!(m2 > 0) || !(M > 0)) return;
    const gx = (m1 * s.gx + m2 * px) / M, gy = (m1 * s.gy + m2 * py) / M, gz = (m1 * s.gz + m2 * pz) / M;
    const ax = s.gx - gx, ay = s.gy - gy, az = s.gz - gz, bx = px - gx, by = py - gy, bz = pz - gz, o = s.own;
    s.own = { xx: o.xx + m1 * ax * ax + m2 * bx * bx, yy: o.yy + m1 * ay * ay + m2 * by * by, zz: o.zz + m1 * az * az + m2 * bz * bz, xz: o.xz + m1 * ax * az + m2 * bx * bz };
    s.ms = M; s.gx = gx; s.gy = gy; s.gz = gz;
  }

  // K.solids 'items' (D(G12-e)'s step 3): a factor a zone (bow to stern) on its floodable volume, so that its solids, the
  // envelope less the floodable volume (the double bottom and what the core's permeabilities leave of each space), are
  // the items' (SOLIDS_ITEMS, K.wood). Spread over the zone's slices as its floodable volume already is, the room it
  // gains or loses is like the rest of its spaces', and the floodable centroid of each slice stays where it was
  function solidsScale(T, wood) {
    const items = SOLIDS_ITEMS[wood], S = new Float64Array(16), V = new Float64Array(16), g = new Float64Array(16);
    for (let j = 0; j < T.nS; j++) { const z = T.zone[j]; S[z] += T.Venv[j] - T.Vf[j]; V[z] += T.Vf[j]; }
    for (let z = 0; z < 16; z++) g[z] = V[z] > 0 ? (V[z] + S[z] - items[z]) / V[z] : 1;
    return g;
  }

  // ================================================================ a piece of the model
  // The ship's slices between x0 and x1 (cut exactly: a slice across a station is shared by its length), its structure
  // from the girder reader's weight curve integrated over each slice, its water and air from the sim (opts.air: 'sim',
  // the default; 0 for none; a number of m3 at the air's own centroid). opts: { id, kind, lever, vent, air, K }
  function piece(ship, sim, x0, x1, opts) {
    opts = opts || {};
    const T = shipTables(ship), GI = girderOf(), cv = GI.weight(sim), F = C.frameOf(sim);
    const xs = T.e[0], xf = T.e[T.nS];
    if (!(x1 > x0)) throw new Error('a piece needs x1 > x0');
    x0 = Math.max(x0, xs); x1 = Math.min(x1, xf);
    const kind = opts.kind || (x0 <= xs + 1e-6 && x1 >= xf - 1e-6 ? 'whole' : (x0 <= xs + 1e-6 ? 'stern' : (x1 >= xf - 1e-6 ? 'bow' : 'middle')));
    const water = opts.air === undefined || opts.air === 'sim' ? waterBySlice(sim, F, T) : null;
    const KP = Object.assign({}, K0, opts.K || {}), airAt = KP.airAt;   // where the pocket's lift acts across her (K0.airAt)
    if (airAt !== 'centre' && airAt !== 'flag') throw new Error('K.airAt is \'centre\' or \'flag\', not ' + JSON.stringify(airAt));
    if (KP.peakTank !== 'solid' && KP.peakTank !== 'weighed') throw new Error('K.peakTank is \'solid\' or \'weighed\', not ' + JSON.stringify(KP.peakTank));
    if (KP.section !== 'decimated' && KP.section !== 'full') throw new Error('K.section is \'decimated\' or \'full\', not ' + JSON.stringify(KP.section));
    const full = KP.section === 'full';
    // K.solids 'items': each zone's floodable volume and the hand-over's water in it, by the zone's factor (solidsScale)
    const gz = KP.solids === 'items' ? solidsScale(T, KP.wood) : null;
    const slices = [];
    let airV = 0, airX = 0, airY = 0, airZ = 0;
    for (let j = 0; j < T.nS; j++) {
      const lo = Math.max(x0, T.e[j]), hi = Math.min(x1, T.e[j + 1]);
      if (!(hi - lo > 1e-9)) continue;
      const f = (hi - lo) / T.dx[j], st = structureIn(cv, lo, hi);
      // her structure spread across her beam as a uniform plate [bet: the curve gives no breadth]
      const s = {
        x: 0.5 * (lo + hi), dx: hi - lo, B: T.B[j], H: T.H[j], Venv: f * T.Venv[j], ey: T.ey[j], ez: T.ez[j],
        Vf: gz ? f * T.Vf[j] * gz[T.zone[j]] : f * T.Vf[j], fy: T.fy[j], fz: T.fz[j], ms: st.m, gx: st.gx, gy: cv.yG, gz: st.gz,
        own: { xx: st.sxx, yy: st.m * T.B[j] * T.B[j] / 12, zz: st.szz, xz: st.sxz },
        Hh: T.Hh[j], ezh: T.ezh[j], Vh: f * T.Vh[j], perim: full ? T.perimFull[j] : T.perim[j], poly: full ? T.polyFull[j] : T.poly[j], shape: 'rect',
      };
      slices.push(s);
      if (water) {
        const Wv = gz ? f * water.W[j] * gz[T.zone[j]] : f * water.W[j], air = Math.max(0, s.Vf - Wv);
        if (air > 1e-9) {
          let cy = s.fy, cz = s.fz;                 // 'centre': the slice's own floodable centre
          if (airAt === 'flag') {                   // 'flag': the unfilled volume's centre at the hand-over's pose
            const wy = water.W[j] > 0 ? water.WY[j] / water.W[j] : s.fy, wz = water.W[j] > 0 ? water.WZ[j] / water.W[j] : s.fz;
            cy = (s.Vf * s.fy - Wv * wy) / air; cz = (s.Vf * s.fz - Wv * wz) / air;
          }
          airV += air; airX += air * s.x; airY += air * cy; airZ += air * cz;
        }
      }
    }
    // K.peakTank 'weighed': a pocket outside every space's columns (G7's tank) weighed as the core weighs it, its water a
    // mass in the slice of this piece where it stands
    if (KP.peakTank === 'weighed' && sim.pockets) for (const k of sim.pockets) {
      if (k.overlap !== false || !(k.vol > 0)) continue;
      const pts = C.pocketPoints(sim, F, k);
      for (let i = 0; i < pts.length; i += 4) {
        const px = pts[i + 1], s = slices.find(q => px >= q.x - 0.5 * q.dx && px < q.x + 0.5 * q.dx);
        if (s) addMass(s, C.RHO * pts[i], px, pts[i + 2], pts[i + 3]);
      }
    }
    let air = null;
    if (water && airV > 1e-6) air = { V: airV, p: [airX / airV, airY / airV, airZ / airV] };
    else if (typeof opts.air === 'number' && opts.air > 0) {
      let vf = 0, mx = 0, my = 0, mz = 0; for (const s of slices) { vf += s.Vf; mx += s.Vf * s.x; my += s.Vf * s.fy; mz += s.Vf * s.fz; }
      air = { V: Math.min(opts.air, vf), p: opts.airAt || [mx / vf, my / vf, mz / vf] };
    }
    // the vent: the core's own share of the top deck open to the sea once submerged (params.fOpen, the K_TOP openings of
    // core.js), over the piece's length [the model's own, calibrated to the night's flooding]
    const vent = opts.vent !== undefined ? opts.vent : (sim.params.fOpen || 0) * (x1 - x0);
    const torn = { aft: x0 > xs + 1e-6, fwd: x1 < xf - 1e-6 };
    return { id: opts.id || kind, kind, x0, x1, slices, ends: { aft: torn.aft ? 'torn' : 'faired', fwd: torn.fwd ? 'torn' : 'faired' }, air, vent, lever: opts.lever || 0, K: opts.K || {}, yG: cv.yG };
  }

  // ================================================================ a body: the engine's piece
  // From a spec ({ id, kind, x0, x1, slices: [{ x, dx, B, H, Venv, ey, ez, Vf, fy, fz, ms, gx, gy, gz, perim, poly,
  // shape: 'rect' | 'circle' }], ends: { aft, fwd: 'torn' | 'faired' | 'none' }, air: { V, p } | null, vent, lever, K })
  // the plain-data body the step moves: its tables as typed arrays, its mass matrix about C, its momenta.
  function body(spec, sp) {
    const K = Object.assign({}, K0, spec.K || {});
    if (K.air !== 'pocket' && K.air !== 'spaces') throw new Error('K.air is \'pocket\' or \'spaces\', not ' + JSON.stringify(K.air));
    if (K.fail !== 'simple' && K.fail !== 'boundaries') throw new Error('K.fail is \'simple\' or \'boundaries\', not ' + JSON.stringify(K.fail));
    if (K.floats !== 'core' && K.floats !== 'none') throw new Error('K.floats is \'core\' or \'none\', not ' + JSON.stringify(K.floats));
    if (K.weather !== 'none' && K.weather !== 'core') throw new Error('K.weather is \'none\' or \'core\', not ' + JSON.stringify(K.weather));
    if (K.failOnce !== 'space' && K.failOnce !== 'boundary') throw new Error('K.failOnce is \'space\' or \'boundary\', not ' + JSON.stringify(K.failOnce));
    if (K.limiter !== 'pair' && K.limiter !== 'held') throw new Error('K.limiter is \'pair\' or \'held\', not ' + JSON.stringify(K.limiter));
    if (K.solids !== 'core' && K.solids !== 'items') throw new Error('K.solids is \'core\' or \'items\', not ' + JSON.stringify(K.solids));
    if (K.wood !== 'afloat' && K.wood !== 'soaked') throw new Error('K.wood is \'afloat\' or \'soaked\', not ' + JSON.stringify(K.wood));
    if (K.peakTank !== 'solid' && K.peakTank !== 'weighed') throw new Error('K.peakTank is \'solid\' or \'weighed\', not ' + JSON.stringify(K.peakTank));
    if (K.section !== 'decimated' && K.section !== 'full') throw new Error('K.section is \'decimated\' or \'full\', not ' + JSON.stringify(K.section));
    const S = spec.slices, n = S.length;
    const A = () => new Float64Array(n);
    const b = {
      id: spec.id, kind: spec.kind || 'body', x0: spec.x0 === undefined ? S[0].x - 0.5 * S[0].dx : spec.x0, x1: spec.x1 === undefined ? S[n - 1].x + 0.5 * S[n - 1].dx : spec.x1,
      n, K, ends: Object.assign({ aft: 'none', fwd: 'none' }, spec.ends || {}),
      x: A(), dx: A(), B: A(), H: A(), Hd: A(), ezd: A(), Ha: A(), eza: A(), Venv: A(), ey: A(), ez: A(), Vf: A(), fy: A(), fz: A(), ms: A(), gx: A(), gy: A(), gz: A(), perim: A(), ca22: A(), ca33: A(),
      polyOff: new Int32Array(n + 1), polyY: null, polyZ: null, polyA: A(), polyCy: A(), polyCz: A(), lever: spec.lever || 0, vent: spec.vent || 0,
    };
    let np = 0;
    for (let i = 0; i < n; i++) np += S[i].poly.y.length;
    b.polyY = new Float64Array(np); b.polyZ = new Float64Array(np);
    np = 0;
    for (let i = 0; i < n; i++) {
      const s = S[i];
      b.x[i] = s.x; b.dx[i] = s.dx; b.B[i] = s.B; b.H[i] = s.H; b.Venv[i] = s.Venv; b.ey[i] = s.ey; b.ez[i] = s.ez;
      b.Vf[i] = s.Vf || 0; b.fy[i] = s.Vf ? s.fy : s.ey; b.fz[i] = s.Vf ? s.fz : s.ez; b.ms[i] = s.ms; b.gx[i] = s.gx; b.gy[i] = s.gy; b.gz[i] = s.gz;
      b.perim[i] = s.perim || 2 * (s.B + s.H);
      // the section the water acts on, its depth and the height of its centre, twice (K.tiersSide, K.tiersAdded: D52's
      // one share, split by D(G12-e)): for her cross-flow and turning drag (Hd, ezd), and for her added mass and the torn
      // end's lift (Ha, eza). At 1 (and wherever no tiers stand) the whole section, as it was, to the bit; at 0 the
      // hull's own; between, the tiers' share of the depth above the hull's top, and of the tiers' volume in the centre
      const Vt = s.Vh > 0 ? s.Venv - s.Vh : 0;
      const sect = (tf) => {
        if (tf === 1 || !(s.Hh > 0) || !(Vt > 1e-9)) return [s.H, s.ez];
        if (tf === 0) return [s.Hh, s.ezh];
        const ezt = (s.Venv * s.ez - s.Vh * s.ezh) / Vt;
        return [s.Hh + tf * (s.H - s.Hh), (s.Vh * s.ezh + tf * Vt * ezt) / (s.Vh + tf * Vt)];
      };
      const both = K.tiersFlow !== null && K.tiersFlow !== undefined, dS = sect(both ? K.tiersFlow : K.tiersSide), dA = sect(both ? K.tiersFlow : K.tiersAdded);
      b.Hd[i] = dS[0]; b.ezd[i] = dS[1]; b.Ha[i] = dA[0]; b.eza[i] = dA[1];
      if (s.shape === 'circle') { b.ca22[i] = 1; b.ca33[i] = 1; }
      else { b.ca22[i] = caRect(b.Ha[i] / s.B); b.ca33[i] = caRect(s.B / b.Ha[i]); }
      b.polyOff[i] = np;
      let ar = 0, my = 0, mz = 0;
      const py = s.poly.y, pz = s.poly.z, m = py.length;
      for (let k = 0; k < m; k++) { b.polyY[np + k] = py[k]; b.polyZ[np + k] = pz[k]; const k2 = (k + 1) % m, cr = py[k] * pz[k2] - py[k2] * pz[k]; ar += cr; my += (py[k] + py[k2]) * cr; mz += (pz[k] + pz[k2]) * cr; }
      b.polyA[i] = 0.5 * ar; b.polyCy[i] = ar !== 0 ? my / (3 * ar) : s.ey; b.polyCz[i] = ar !== 0 ? mz / (3 * ar) : s.ez;
      np += m;
    }
    b.polyOff[n] = np;
    // the column's mean density: what her inertia and her added mass are taken at [mine]
    const rhoRef = K.rhoRef || (sp ? rhoAt(sp, 0.5 * sp.depth) : 1035);
    b.rhoRef = rhoRef;
    // her weight's lever, the one fitted number (decision D49): her weight in water moved `lever` m along her (+ forward)
    // by tilting her structure's weight in a straight line over her slices, its total kept
    if (b.lever) {
      let m = 0, mx = 0, vs = 0; for (let i = 0; i < n; i++) { m += b.ms[i]; mx += b.ms[i] * b.x[i]; vs += b.Venv[i] - b.Vf[i]; }
      const xb = mx / m; let i2 = 0; for (let i = 0; i < n; i++) i2 += b.ms[i] * (b.x[i] - xb) * (b.x[i] - xb);
      const kap = (m - rhoRef * vs) * b.lever / i2;
      for (let i = 0; i < n; i++) b.ms[i] *= 1 + kap * (b.x[i] - xb);
    }
    // C: the envelope's centroid, her own origin for every term below
    let V = 0, vx = 0, vy = 0, vz = 0, Amax = 0;
    for (let i = 0; i < n; i++) { V += b.Venv[i]; vx += b.Venv[i] * b.x[i]; vy += b.Venv[i] * b.ey[i]; vz += b.Venv[i] * b.ez[i]; const a = b.Venv[i] / b.dx[i]; if (a > Amax) Amax = a; }
    b.C = [vx / V, vy / V, vz / V]; b.V = V; b.Amax = Amax; b.L = b.x1 - b.x0;
    // each slice's bounding radius about its envelope centroid, and the body's about C (for the quick tests of the
    // surface and the bed)
    b.rad = A(); let Rb = 0;
    for (let i = 0; i < n; i++) {
      let r2 = 0; for (let k = b.polyOff[i]; k < b.polyOff[i + 1]; k++) { const dy = b.polyY[k] - b.ey[i], dz = b.polyZ[k] - b.ez[i], d2 = dy * dy + dz * dz; if (d2 > r2) r2 = d2; }
      b.rad[i] = Math.sqrt(r2 + 0.25 * b.dx[i] * b.dx[i]);
      const ax = b.x[i] - b.C[0], ay = b.ey[i] - b.C[1], az = b.ez[i] - b.C[2], rr = Math.sqrt(ax * ax + ay * ay + az * az) + b.rad[i];
      if (rr > Rb) Rb = rr;
    }
    b.Rb = Rb;
    // the spheroid's end corrections for her own proportions [R6 1.3]
    const Lb = lamb(b.L / Math.sqrt(4 * Amax / Math.PI));
    b.lamb = Lb;
    const k1 = K.k1 && typeof K.k1 === 'object' ? (K.k1[b.kind] !== undefined ? K.k1[b.kind] : Lb.k1) : (typeof K.k1 === 'number' ? K.k1 : Lb.k1);
    b.k1 = k1;
    // the rigid body about C: her structure, and the water in her as if every floodable space were full (the pocket
    // takes its share out below). Each slice's structure at its centroid with its own second moments about it (the
    // girder curve's, exact; a body of no ship takes a uniform box), its water at its centroid spread evenly along the
    // slice. So every part is additive: the pieces of a cut ship sum to the whole.
    const M = new Float64Array(36), cx = b.C[0], cy = b.C[1], cz = b.C[2];
    let m = 0, sx = 0, sy = 0, sz = 0;
    const I = [0, 0, 0, 0, 0, 0];                     // Ixx Iyy Izz Ixy Ixz Iyz about C
    const pt = (mm, px, py, pz) => { m += mm; sx += mm * px; sy += mm * py; sz += mm * pz; I[0] += mm * (py * py + pz * pz); I[1] += mm * (px * px + pz * pz); I[2] += mm * (px * px + py * py); I[3] -= mm * px * py; I[4] -= mm * px * pz; I[5] -= mm * py * pz; };
    for (let i = 0; i < n; i++) {
      const ms = b.ms[i], o = S[i].own, sc = ms / (S[i].ms || 1);      // a lever's tilt scales a slice's own moments with its mass
      pt(ms, b.gx[i] - cx, b.gy[i] - cy, b.gz[i] - cz);
      const oxx = o ? o.xx * sc : ms * b.dx[i] * b.dx[i] / 12, oyy = o ? o.yy * sc : ms * b.B[i] * b.B[i] / 12, ozz = o ? o.zz * sc : ms * b.H[i] * b.H[i] / 12, oxz = o ? o.xz * sc : 0;
      I[0] += oyy + ozz; I[1] += oxx + ozz; I[2] += oxx + oyy; I[4] -= oxz;
      if (b.Vf[i] > 0) { const mw = rhoRef * b.Vf[i]; pt(mw, b.x[i] - cx, b.fy[i] - cy, b.fz[i] - cz); I[1] += mw * b.dx[i] * b.dx[i] / 12; I[2] += mw * b.dx[i] * b.dx[i] / 12; }
    }
    b.mass = m; b.mc = [sx, sy, sz];
    M[0] = m; M[7] = m; M[14] = m;
    // P = m v - S(c) w ; L = S(c) v + I w   (c = m r_G)
    const Sc = [[0, -sz, sy], [sz, 0, -sx], [-sy, sx, 0]];
    for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) { M[r * 6 + 3 + k] = -Sc[r][k]; M[(3 + r) * 6 + k] = Sc[r][k]; }
    M[21] = I[0]; M[28] = I[1]; M[35] = I[2]; M[22] = I[3]; M[27] = I[3]; M[23] = I[4]; M[33] = I[4]; M[29] = I[5]; M[34] = I[5];
    b.MRB = M;
    // the added mass about C, strip by strip: the section's velocity across her (v_y, v_z) with the spheroid's k2 on
    // its translations and k' on its turning, a quadratic form in (u v w p q r) [R6 10.2]
    const MA = new Float64Array(36), a2 = Math.sqrt(Lb.k2), ar = Math.sqrt(Lb.kr);
    const add = (w, c6) => { for (let r = 0; r < 6; r++) { if (c6[r] === 0) continue; for (let k = 0; k < 6; k++) MA[r * 6 + k] += w * c6[r] * c6[k]; } };
    for (let i = 0; i < n; i++) {
      const xi = b.x[i] - cx, eta = b.ey[i] - cy, zeta = b.eza[i] - cz;
      const m22 = b.ca22[i] * rhoRef * Math.PI * 0.25 * b.Ha[i] * b.Ha[i] * b.dx[i];
      const m33 = b.ca33[i] * rhoRef * Math.PI * 0.25 * b.B[i] * b.B[i] * b.dx[i];
      add(m22, [0, a2, 0, -a2 * zeta, 0, ar * xi]);
      add(m33, [0, 0, a2, a2 * eta, -ar * xi, 0]);
      const hb = 0.5 * b.B[i];
      MA[21] += K.rollAdded * rhoRef * Math.PI * hb * hb * hb * hb * b.dx[i];
    }
    MA[0] += k1 * rhoRef * V;
    if (!K.potential) MA.fill(0);
    b.MA = MA;
    b.M = new Float64Array(36); for (let k = 0; k < 36; k++) b.M[k] = M[k] + MA[k];
    // the pocket of air: its amount in m3 at one atmosphere (a), its place in her (ship frame)
    b.air = spec.air ? { a: 0, V0: spec.air.V, p: spec.air.p.slice() } : null;
    b.airMax = 0; for (let i = 0; i < n; i++) b.airMax += b.Vf[i];
    // the leading end's area along her, her wetted girth
    let wet = 0; for (let i = 0; i < n; i++) wet += b.perim[i] * b.dx[i];
    b.wet = K.wetShare * wet;
    b.cfL = b.L;
    // state, set by place()
    b.X = [0, 0, 0]; b.q = [1, 0, 0, 0]; b.P = [0, 0, 0]; b.Lm = [0, 0, 0]; b.nu = [0, 0, 0, 0, 0, 0];
    b.rate = [0, 0, 0, 0, 0, 0];
    b.state = 'falling'; b.tSlow = 0; b.struck = false; b.touched = false; b.arrival = null; b.wentUnder = false; b.bury = new Float64Array(n); b.shed = false; b.inMud = false;
    b.W = { drag: 0, mud: 0, cons: 0, surf: 0, air: 0, shed: 0, freeze: 0 };
    b.iters = 0; b.subs = 0; b.unconv = 0;
    return b;
  }

  // ================================================================ small linear algebra
  function quatR(q, R) {
    const w = q[0], x = q[1], y = q[2], z = q[3];
    R[0] = 1 - 2 * (y * y + z * z); R[1] = 2 * (x * y - w * z); R[2] = 2 * (x * z + w * y);
    R[3] = 2 * (x * y + w * z); R[4] = 1 - 2 * (x * x + z * z); R[5] = 2 * (y * z - w * x);
    R[6] = 2 * (x * z - w * y); R[7] = 2 * (y * z + w * x); R[8] = 1 - 2 * (x * x + y * y);
    return R;
  }
  function quatOfR(R) {                             // Shepperd: sqrt only
    const t = R[0] + R[4] + R[8];
    let q;
    if (t > 0) { const s = 2 * Math.sqrt(1 + t); q = [0.25 * s, (R[7] - R[5]) / s, (R[2] - R[6]) / s, (R[3] - R[1]) / s]; }
    else if (R[0] > R[4] && R[0] > R[8]) { const s = 2 * Math.sqrt(1 + R[0] - R[4] - R[8]); q = [(R[7] - R[5]) / s, 0.25 * s, (R[1] + R[3]) / s, (R[2] + R[6]) / s]; }
    else if (R[4] > R[8]) { const s = 2 * Math.sqrt(1 + R[4] - R[0] - R[8]); q = [(R[2] - R[6]) / s, (R[1] + R[3]) / s, 0.25 * s, (R[5] + R[7]) / s]; }
    else { const s = 2 * Math.sqrt(1 + R[8] - R[0] - R[4]); q = [(R[3] - R[1]) / s, (R[2] + R[6]) / s, (R[5] + R[7]) / s, 0.25 * s]; }
    if (q[0] < 0) { q[0] = -q[0]; q[1] = -q[1]; q[2] = -q[2]; q[3] = -q[3]; }
    const nq = Math.sqrt(q[0] * q[0] + q[1] * q[1] + q[2] * q[2] + q[3] * q[3]);
    return [q[0] / nq, q[1] / nq, q[2] / nq, q[3] / nq];
  }
  // the core's pose, R = Ry(pitch) Rx(roll) (pitch bow down +, roll starboard down +), as a row-major 3 x 3
  function poseR(pitch, roll) {
    const ct = C.cos(pitch), st = C.sin(pitch), cp = C.cos(roll), spp = C.sin(roll);
    return [ct, st * spp, st * cp, 0, cp, -spp, -st, ct * spp, ct * cp];
  }
  // Cholesky solve of the 6 x 6 symmetric positive-definite M: x = M^-1 b (L in scratch)
  function solve6(M, bv, x, Lw) {
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j <= i; j++) {
        let s = M[i * 6 + j];
        for (let k = 0; k < j; k++) s -= Lw[i * 6 + k] * Lw[j * 6 + k];
        Lw[i * 6 + j] = i === j ? Math.sqrt(s) : s / Lw[j * 6 + j];
      }
    }
    const y = [0, 0, 0, 0, 0, 0];
    for (let i = 0; i < 6; i++) { let s = bv[i]; for (let k = 0; k < i; k++) s -= Lw[i * 6 + k] * y[k]; y[i] = s / Lw[i * 6 + i]; }
    for (let i = 5; i >= 0; i--) { let s = y[i]; for (let k = i + 1; k < 6; k++) s -= Lw[k * 6 + i] * x[k]; x[i] = s / Lw[i * 6 + i]; }
    return x;
  }

  // ================================================================ the pocket
  // its volume now, m3, with its centre at depth d (the sea's pressure there, never less than one atmosphere)
  function airVolume(b, sp, d) {
    if (!b.air || !(b.air.a > 0)) return 0;
    const p = Math.max(pAt(sp, d), P_ATM), v = b.air.a * P_ATM / p;
    return v < b.airMax ? v : b.airMax;
  }
  // the mass matrix with the pocket's share of water taken out: a point of rhoRef V at the pocket. In the mud, with the
  // water she drags shed (K.strikeAdded 0), her own alone
  function massWithAir(b, Vair, M) {
    const M0 = b.shed ? b.MRB : b.M;
    for (let k = 0; k < 36; k++) M[k] = M0[k];
    if (!(Vair > 0)) return M;
    const m = b.rhoRef * Vair, px = b.air.p[0] - b.C[0], py = b.air.p[1] - b.C[1], pz = b.air.p[2] - b.C[2];
    M[0] -= m; M[7] -= m; M[14] -= m;
    const cx = m * px, cy = m * py, cz = m * pz;
    // -S(c) in the top right, S(c) in the bottom left
    M[4] -= cz; M[5] += cy; M[9] += cz; M[11] -= cx; M[15] -= cy; M[16] += cx;
    M[19] += cz; M[20] -= cy; M[24] -= cz; M[26] += cx; M[30] += cy; M[31] -= cx;
    M[21] -= m * (py * py + pz * pz); M[28] -= m * (px * px + pz * pz); M[35] -= m * (px * px + py * py);
    M[22] += m * px * py; M[27] += m * px * py; M[23] += m * px * pz; M[33] += m * px * pz; M[29] += m * py * pz; M[34] += m * py * pz;
    return M;
  }

  // ---------------------------------------------------------------- Z6's spaces as the pocket (K.air 'spaces', M2 4c)
  // b.spc = { sp, st, ops, K, t, acc, ev, seen, V }: the piece's spaces (spaces.spacesOf), their water and air
  // (stateOf's, changed in place), its openings (openingsOf's, with failSpaces' added), the spaces' clock, the time
  // owed to their next step, the reports logged (with the node) and how many of them the fall has heard, their air now.
  // spacesPocket: their air's whole volume (each space's room above its water, at its own pressure) through its
  // volume-weighted centroid in her frame, which is exact for the moment of the parallel lifts (the air's spread about
  // that point is left out of her inertia, as the pocket leaves it); the pocket's amount is what gives that volume at the
  // centroid's depth by airVolume. R, r: her pose (R row-major, her frame to the world; r her frame's origin in it)
  const SPW = {};
  function spacesPocket(b, sp, R, r) {
    const S = b.spc, water = spacesLib().water, ssp = S.sp, st = S.st, u = [R[6], R[7], R[8]], zr = r[2];
    let V = 0, mx = 0, my = 0, mz = 0;
    for (let k = 0; k < ssp.n; k++) {
      if (!(ssp.V[k] - st.W[k] > 1e-9 * ssp.V[k])) continue;
      water(ssp, k, u, zr, st.W[k], st.lev[k], SPW); st.lev[k] = SPW.level;
      V += SPW.air; mx += SPW.air * SPW.ax; my += SPW.air * SPW.ay; mz += SPW.air * SPW.az;
    }
    S.V = V;
    if (!(V > 0)) { b.air.a = 0; return; }
    b.air.p[0] = mx / V; b.air.p[1] = my / V; b.air.p[2] = mz / V;
    const da = -(zr + u[0] * b.air.p[0] + u[1] * b.air.p[1] + u[2] * b.air.p[2]);
    b.air.a = V * Math.max(pAt(sp, da), P_ATM) / P_ATM;
  }
  // a sub-step of h at her pose R (her centre C at b.X): the spaces are stepped over the time owed to them once it
  // reaches K.spaceDt, the spaces lagging the sea past their heads then give way (each report with her speed then), and
  // their air is set as the pocket. Returns whether they were stepped
  function spacesStep(b, sp, R, h) {
    const S = b.spc, SPm = spacesLib();
    if (S.tear) tearStep(S);                         // B4's gate 2: the tear's openings at the joint's state, or the release
    S.acc += h;
    if (S.acc < S.K.spaceDt * (1 - 1e-9)) return false;
    const dt = S.acc, c = b.C;
    S.acc = 0;
    const r = [b.X[0] - (R[0] * c[0] + R[1] * c[1] + R[2] * c[2]), b.X[1] - (R[3] * c[0] + R[4] * c[1] + R[5] * c[2]), b.X[2] - (R[6] * c[0] + R[7] * c[1] + R[8] * c[2])];
    SPm.stepPiece(S.sp, S.st, S.ops, R, r, dt, undefined, S.K.limiter);
    S.t += dt;
    if (S.doors && S.doors.length) SPm.doorsStep(S.sp, S.st, S.doors, S.ops, R, r, dt, S.P, S.t);   // the floats (K.floats 'core')
    if (S.weather && S.weather.list.length) SPm.weatherStep(S.sp, S.st, S.weather, S.ops, R, r, S.t, S.P);   // the openings to the weather (K.weather 'core')
    const n0 = S.ev.length;
    spacesFail(b, R, r, S.t);
    if (S.ev.length > n0) { const v = comSpeed(b, b.nu); for (let e = n0; e < S.ev.length; e++) S.ev[e].speed = v; }
    spacesPocket(b, sp, R, r);
    return true;
  }
  // the spaces giving way at her pose (K.fail): the first form, or section 5's by boundary (b.spc.bnd)
  function spacesFail(b, R, r, t) {
    const S = b.spc, SPm = spacesLib();
    return S.bnd ? SPm.failBoundaries(S.sp, S.st, S.ops, S.bnd, R, r, S.K, t, S.ev) : SPm.failSpaces(S.sp, S.st, S.ops, R, r, S.K, t, S.ev);
  }
  // K.torn (Z6 from the onset, docs/DESIGN_Z6_the_stern_from_the_onset_v1_2026-11-23.md): a hull that breaks in hogging
  // fails over a length, not at a plane (B4's hinge yields over Lh [bet 20 m]; the boiler field and the double bottom's
  // pieces lie between the pieces on the bed, R5 1.1). Within K.torn/2 of the cut, from the hand-over on, every boundary
  // of the piece (bulkhead, joiner work, E deck) whose centroid lies there gives way over K.failShare of its area, as
  // failBoundaries opens one, and every space with a box there opens its shell to the sea, as failSpaces does; each is
  // then given way for good (its 'once'). Counted in b.spc.torn. K.torn 0, the default: nothing, to the bit
  function tornOpen(b, xc, half) {
    const S = b.spc, sp = S.sp, st = S.st, SPm = spacesLib(), share = S.K.failShare === undefined ? 0.5 : S.K.failShare;
    st.failed = st.failed || new Uint8Array(sp.n);
    let nb = 0, ns = 0;
    if (S.bnd) {
      st.bfailed = st.bfailed || new Uint8Array(S.bnd.length);
      for (let i = 0; i < S.bnd.length; i++) {
        const B = S.bnd[i];
        if (st.bfailed[i] || Math.abs(B.px - xc) > half) continue;
        const A = share * B.A, L = B.kind === 'deck' ? Math.sqrt(A) : 2 * B.hz;
        S.ops.push({ c: -1, kind: 'torn ' + B.kind, a: B.a, b: B.b, px: B.px, py: B.py, pz: B.pz, nx: B.nx, ny: B.ny, nz: B.nz, A, L, Cd: 0.6, open: true });
        st.bfailed[i] = 1; nb++;
      }
    }
    for (let k = 0; k < sp.n; k++) {
      if (st.failed[k]) continue;
      let near = false;
      for (let q = sp.start[k], q1 = q + sp.count[k]; q < q1 && !near; q++) if (sp.bx[q] + sp.wx[q] >= xc - half && sp.bx[q] - sp.wx[q] <= xc + half) near = true;
      if (!near) continue;
      S.ops.push(SPm.shellOpening(sp, k, share)); st.failed[k] = 1; ns++;
      if (S.K.failOnce === 'boundary') (st.sfailed || (st.sfailed = new Uint8Array(sp.n)))[k] = 1;   // its shell given way (K.failOnce, claude/z1-limiter)
    }
    S.torn = { half, boundaries: nb, shells: ns };
  }
  // the failures the fall has not yet heard: each past K.reportMin into its events as a 'report', in the contract's form
  // (depth, the depth of the space's free surface; energy, its air's lag behind the sea times its volume, J; speed, hers
  // then)
  function spacesReport(fall, i) {
    const S = fall.eng.bodies[i].spc, id = fall.pieces[i].id;
    for (; S.seen < S.ev.length; S.seen++) {
      const e = S.ev[S.seen];
      if (e.energy >= S.K.reportMin) fall.events.push({ t: e.t, id: 'report', piece: id, depth: e.depth, energy: e.energy, speed: e.speed });
    }
  }

  // ================================================================ the section cut by the sea's plane
  // The part of slice i's section below the line a y + b z < c (the sea's plane at one point along the slice): area and
  // centroid, by clipping its polygon (Sutherland-Hodgman against one half-plane, then the shoelace)
  function clipArea(bd, i, a, bb, c, out) {
    const o = bd.polyOff[i], m = bd.polyOff[i + 1] - o, Y = bd.polyY, Z = bd.polyZ;
    let A = 0, my = 0, mz = 0, py = 0, pz = 0, has = false, fy = 0, fz = 0;
    const emit = (y, z) => { if (has) { const cr = py * z - y * pz; A += cr; my += (py + y) * cr; mz += (pz + z) * cr; } else { fy = y; fz = z; has = true; } py = y; pz = z; };
    let y0 = Y[o + m - 1], z0 = Z[o + m - 1], in0 = a * y0 + bb * z0 < c;
    for (let k = 0; k < m; k++) {
      const y1 = Y[o + k], z1 = Z[o + k], in1 = a * y1 + bb * z1 < c;
      if (in1 !== in0) { const d0 = a * y0 + bb * z0 - c, d1 = a * y1 + bb * z1 - c, t = d0 / (d0 - d1); emit(y0 + t * (y1 - y0), z0 + t * (z1 - z0)); }
      if (in1) emit(y1, z1);
      y0 = y1; z0 = z1; in0 = in1;
    }
    if (has) { const cr = py * fz - fy * pz; A += cr; my += (py + fy) * cr; mz += (pz + fz) * cr; }
    A *= 0.5;
    out[0] = A; out[1] = A !== 0 ? my / (6 * A) : 0; out[2] = A !== 0 ? mz / (6 * A) : 0;
    return out;
  }

  // ================================================================ the loads at a sub-step's middle
  // Everything on body b with her momenta's middle nu = (v, w), her place and attitude at the sub-step's start (X0, R0)
  // and end (X1, R1), their middle (Xm, Rm = (R0 + R1) / 2). F, T in her own axes about C. Works (J/s) into pw.
  const SC = { cut: [0, 0, 0] };
  function loads(b, sp, nu, X0, R0, X1, R1, Xm, Rm, Vair, out, pw) {
    const K = b.K, n = b.n, cx = b.C[0], cy = b.C[1], cz = b.C[2], g = GRAV;
    const v0 = nu[0], v1 = nu[1], v2 = nu[2], w0 = nu[3], w1 = nu[4], w2 = nu[5];
    const r3x = Rm[6], r3y = Rm[7], r3z = Rm[8];   // world up in her axes (the middle's)
    let cS0 = 0, cSx = 0, cSy = 0, cSz = 0;          // conservative vertical forces: their sum and first moment (N, N m)
    let sS0 = 0, sSx = 0, sSy = 0, sSz = 0;          // the same for buoyancy at the surface (not conservative as computed)
    let Fx = 0, Fy = 0, Fz = 0, Tx = 0, Ty = 0, Tz = 0;   // viscous and separated
    let Mx = 0, My = 0, Mz = 0, Nx = 0, Ny = 0, Nz = 0;   // the mud
    // the world Z of a point of hers at the start, the end and the middle
    const zAt = (Xv, R, px, py, pz) => Xv[2] + R[6] * px + R[7] * py + R[8] * pz;
    const vert = (F, px, py, pz) => { cS0 += F; cSx += F * px; cSy += F * py; cSz += F * pz; };
    let fsubSum = 0;
    for (let i = 0; i < n; i++) {
      const xi = b.x[i] - cx, dx = b.dx[i];
      // the structure's weight
      vert(-b.ms[i] * g, b.gx[i] - cx, b.gy[i] - cy, b.gz[i] - cz);
      // how much of the slice is under the sea: its box's extent in the world's Z about its middle
      const ex = b.ey[i] - cy, ez = b.ez[i] - cz, zmid = zAt(Xm, Rm, xi, ex, ez), rad = b.rad[i];
      let fsub = 1, cut = false;
      if (zmid + rad > 0) {
        if (zmid - rad >= 0) fsub = 0;
        else {
          // three sections along the slice, each cut exactly by the plane Z = 0; the polygon's centroid moved onto the
          // section's own, so that a slice that goes wholly under does not jump
          let A = 0, ax = 0, ay = 0, az = 0;
          const a = Rm[7], bb = Rm[8], A0 = b.polyA[i], oy = b.ey[i] - b.polyCy[i], oz = b.ez[i] - b.polyCz[i];
          for (let gq = 0; gq < 3; gq++) {
            const xg = xi + GAUSS[gq][0] * 0.5 * dx, wg = GAUSS[gq][1];
            // the section at xg is under where Xm_z + Rm20 xg + a (y - cy) + bb (z - cz) < 0
            const c = -(Xm[2] + Rm[6] * xg) + a * cy + bb * cz;
            let fr, yc, zc;
            if (Math.abs(a) + Math.abs(bb) < 1e-12) { fr = c > 0 ? 1 : 0; yc = b.polyCy[i]; zc = b.polyCz[i]; }
            else { clipArea(b, i, a, bb, c, SC.cut); fr = A0 > 0 ? SC.cut[0] / A0 : 0; yc = SC.cut[1]; zc = SC.cut[2]; }
            if (fr > 1) fr = 1; if (fr < 0) fr = 0;
            A += wg * fr; ax += wg * fr * xg; ay += wg * fr * (yc + oy - cy); az += wg * fr * (zc + oz - cz);
          }
          if (A < 1 - 1e-12) {
            cut = true; fsub = A;
            if (A > 0) {
              const px = ax / A, py = ay / A, pz = az / A, d = -zAt(Xm, Rm, px, py, pz);
              const Fb = rhoAt(sp, d) * g * b.Venv[i] * A;
              sS0 += Fb; sSx += Fb * px; sSy += Fb * py; sSz += Fb * pz;
            }
          }
        }
      }
      fsubSum += fsub;
      if (!cut && fsub === 1) {
        // wholly under: the envelope's buoyancy at its centroid, at the density met on the centroid's path
        const d0 = -zAt(X0, R0, xi, ex, ez), d1 = -zAt(X1, R1, xi, ex, ez);
        vert(rhoPath(sp, d0, d1) * g * b.Venv[i], xi, ex, ez);
      }
      // the water in her, every floodable space counted full (the pocket's lift gives back what is not)
      if (b.Vf[i] > 0) {
        const fx = xi, fy = b.fy[i] - cy, fz = b.fz[i] - cz;
        const d0 = -zAt(X0, R0, fx, fy, fz), d1 = -zAt(X1, R1, fx, fy, fz);
        vert(-rhoPath(sp, d0, d1) * g * b.Vf[i], fx, fy, fz);
      }
      if (!K.drag || fsub <= 0) continue;
      // cross-flow on the slice, at the centre of the section the water acts on (K.sections), at the local density
      const rho = rhoAt(sp, -zmid), ed = b.ezd[i] - cz;
      const Vy = v1 + w2 * xi - w0 * ed, Vz = v2 + w0 * ex - w1 * xi;
      const c2 = Vy * Vy + Vz * Vz;
      if (c2 > 0) {
        const cm = Math.sqrt(c2), ny = Vy / cm, nz = Vz / cm;
        const h = b.Hd[i] * Math.abs(ny) + b.B[i] * Math.abs(nz);
        const cd = K.cdBeam * ny * ny + (nz < 0 ? K.cdKeel : K.cdDeck) * nz * nz;
        const q = -0.5 * rho * cd * h * dx * cm * fsub, fy = q * Vy, fz = q * Vz;
        Fy += fy; Fz += fz;
        Tx += ex * fz - ed * fy; Ty += -xi * fz; Tz += xi * fy;
      }
      // the section's own drag as it rolls about its centre [mine]
      if (K.turn && w0 !== 0) {
        const hb = 0.5 * b.B[i], hh = 0.5 * b.Hd[i];
        Tx -= 0.25 * rho * dx * w0 * Math.abs(w0) * (0.5 * (K.cdKeel + K.cdDeck) * hb * hb * hb * hb + K.cdBeam * hh * hh * hh * hh) * fsub;
      }
    }
    // along her: the leading end's form drag and the skin's friction, at the density at C
    if (K.drag && fsubSum > 0) {
      const u = v0, dC = -Xm[2], rho = rhoAt(sp, dC), share = fsubSum / n;
      const lead = u > 0 ? b.ends.fwd : b.ends.aft;
      const cdx = b.kind === 'whole' ? K.cdxWhole : (lead === 'torn' ? K.cdxTorn : (lead === 'none' ? 0 : K.cdxFaired));
      const au = Math.abs(u), re = (au > 0.5 ? au : 0.5) * b.cfL / K.nu, lg = C.log10(re) - 2, cf = 0.075 / (lg * lg) + K.dCf;
      Fx += -0.5 * rho * (cdx * b.Amax + cf * b.wet) * u * au * share;
      // the slender body's lift where the flow leaves a torn end: -|u| m'(end) c(end), at the end
      if (K.lift) {
        const trail = u > 0 ? (b.ends.aft === 'torn' ? 0 : -1) : (u < 0 ? (b.ends.fwd === 'torn' ? n - 1 : -1) : -1);
        if (trail >= 0) {
          const i = trail, xe = (trail === 0 ? b.x0 : b.x1) - cx, ex = b.ey[i] - cy, ez = b.eza[i] - cz;
          const de = -zAt(Xm, Rm, xe, ex, ez);
          if (de > 0) {
            const re2 = rhoAt(sp, de), m22 = b.ca22[i] * re2 * Math.PI * 0.25 * b.Ha[i] * b.Ha[i], m33 = b.ca33[i] * re2 * Math.PI * 0.25 * b.B[i] * b.B[i];
            const Vy = v1 + w2 * xe - w0 * ez, Vz = v2 + w0 * ex - w1 * xe;
            const fy = -au * m22 * Vy, fz = -au * m33 * Vz;
            Fy += fy; Fz += fz;
            Tx += ex * fz - ez * fy; Ty += -xe * fz; Tz += xe * fy;
          }
        }
      }
    }
    // the pocket's lift, at the density where it stands
    let Fa = 0, pax = 0, pay = 0, paz = 0;
    if (Vair > 0) {
      pax = b.air.p[0] - cx; pay = b.air.p[1] - cy; paz = b.air.p[2] - cz;
      const da = -zAt(Xm, Rm, pax, pay, paz);
      Fa = rhoAt(sp, da) * g * Vair;
    }
    // the bed: each slice whose lowest point is below the mud line (none while all of her is well clear of it)
    const bed = sp.bed;
    let inMud = false, capStatic = 0;
    const clear = Xm[2] - b.Rb > -bedDepth(sp, Xm[0], Xm[1]) + bed.tan * b.Rb + 1;
    if (clear) { for (let i = 0; i < n; i++) b.bury[i] = 0; }
    for (let i = 0; i < n && !clear; i++) {
      const o = b.polyOff[i], m = b.polyOff[i + 1] - o, xi = b.x[i] - cx, dx = b.dx[i];
      // the mud line under the slice's middle (its slope is under a degree: the same across one slice)
      const ex = b.ey[i] - cy, ez = b.ez[i] - cz;
      const Zbed = -bedDepth(sp, Xm[0] + Rm[0] * xi + Rm[1] * ex + Rm[2] * ez, Xm[1] + Rm[3] * xi + Rm[4] * ex + Rm[5] * ez);
      // the corners of its section at both its ends: how far each is in the mud; the deepest is the slice's burial, and
      // the mud acts at their centroid weighted by how far each is in (a point that moves smoothly as she settles, where
      // the lowest corner alone would jump from one bilge to the other as she rolls through level)
      let d = 0, sw = 0, swx = 0, swy = 0, swz = 0;
      for (let sx = -0.5; sx <= 0.5; sx += 1) {
        const xe = xi + sx * dx, base = Xm[2] + Rm[6] * xe - Zbed;
        for (let k = 0; k < m; k++) {
          const yk = b.polyY[o + k] - cy, zk = b.polyZ[o + k] - cz, dk = -(base + Rm[7] * yk + Rm[8] * zk);
          if (dk > 0) { sw += dk; swx += dk * xe; swy += dk * yk; swz += dk * zk; if (dk > d) d = dk; }
        }
      }
      if (!(d > 0)) { b.bury[i] = 0; continue; }
      const px = swx / sw, py = swy / sw, pz = swz / sw, Zl = Zbed - d;
      b.bury[i] = d; inMud = true;
      // the shadow of the slice's part in the mud [mine: Z5 refines it face by face]
      let shadow = Math.abs(Rm[8]) * dx * b.B[i] + Math.abs(Rm[7]) * dx * b.H[i];
      if ((i === 0 && Rm[6] > 0) || (i === n - 1 && Rm[6] < 0)) shadow += Math.abs(Rm[6]) * b.B[i] * b.H[i];
      const e = Math.abs(Rm[6]) * dx + K.ramp, Ab = shadow * (d < e ? d / e : 1);
      capStatic += bed.Nc * (bed.su0 + bed.suK * d) * Ab;
      // the point's velocity in the world
      const lx = v0 + w1 * pz - w2 * py, ly = v1 + w2 * px - w0 * pz, lz = v2 + w0 * py - w1 * px;
      const VX = Rm[0] * lx + Rm[1] * ly + Rm[2] * lz, VY = Rm[3] * lx + Rm[4] * ly + Rm[5] * lz, VZ = Rm[6] * lx + Rm[7] * ly + Rm[8] * lz;
      const vn = -VZ, sp2 = VX * VX + VY * VY + VZ * VZ, spd = Math.sqrt(sp2);
      const su = bed.su0 + bed.suK * d;
      const rate = spd / b.B[i];
      let rf = 1 + bed.lambda * C.log10((rate > bed.gref ? rate : bed.gref) / bed.gref);
      if (rf > bed.rfMax) rf = bed.rfMax;
      let q = rf * bed.Nc * su + (vn > 0 ? 0.5 * bed.cd * bed.rho * vn * vn : 0) + (bed.overburden ? (bed.rho - rhoAt(sp, -Zl)) * g * d : 0);
      let FXw, FYw, FZw;
      if (vn > 0) { const k = q * Ab / (spd > K.vReg ? spd : K.vReg); FXw = -k * VX; FYw = -k * VY; FZw = -k * VZ; }
      else { const hs = Math.sqrt(VX * VX + VY * VY), k = q * Ab / (hs > K.vReg ? hs : K.vReg); FXw = -k * VX; FYw = -k * VY; FZw = 0; }
      // into her axes by the middle's attitude
      const fx = Rm[0] * FXw + Rm[3] * FYw + Rm[6] * FZw, fy = Rm[1] * FXw + Rm[4] * FYw + Rm[7] * FZw, fz = Rm[2] * FXw + Rm[5] * FYw + Rm[8] * FZw;
      Mx += fx; My += fy; Mz += fz;
      Nx += py * fz - pz * fy; Ny += pz * fx - px * fz; Nz += px * fy - py * fx;
    }
    // the vertical forces into her axes: F = S0 r3, T = S1 x r3
    const cF = [cS0 * r3x, cS0 * r3y, cS0 * r3z], cT = [cSy * r3z - cSz * r3y, cSz * r3x - cSx * r3z, cSx * r3y - cSy * r3x];
    const sF = [sS0 * r3x, sS0 * r3y, sS0 * r3z], sT = [sSy * r3z - sSz * r3y, sSz * r3x - sSx * r3z, sSx * r3y - sSy * r3x];
    const aF = [Fa * r3x, Fa * r3y, Fa * r3z], aT = [Fa * (pay * r3z - paz * r3y), Fa * (paz * r3x - pax * r3z), Fa * (pax * r3y - pay * r3x)];
    out[0] = cF[0] + sF[0] + aF[0] + Fx + Mx; out[1] = cF[1] + sF[1] + aF[1] + Fy + My; out[2] = cF[2] + sF[2] + aF[2] + Fz + Mz;
    out[3] = cT[0] + sT[0] + aT[0] + Tx + Nx; out[4] = cT[1] + sT[1] + aT[1] + Ty + Ny; out[5] = cT[2] + sT[2] + aT[2] + Tz + Nz;
    if (pw) {
      pw.cons = cF[0] * v0 + cF[1] * v1 + cF[2] * v2 + cT[0] * w0 + cT[1] * w1 + cT[2] * w2;
      pw.surf = sF[0] * v0 + sF[1] * v1 + sF[2] * v2 + sT[0] * w0 + sT[1] * w1 + sT[2] * w2;
      pw.air = aF[0] * v0 + aF[1] * v1 + aF[2] * v2 + aT[0] * w0 + aT[1] * w1 + aT[2] * w2;
      pw.drag = Fx * v0 + Fy * v1 + Fz * v2 + Tx * w0 + Ty * w1 + Tz * w2;
      pw.mud = Mx * v0 + My * v1 + Mz * v2 + Nx * w0 + Ny * w1 + Nz * w2;
      pw.inMud = inMud; pw.fsub = fsubSum / n; pw.cap = capStatic;
    }
    return out;
  }

  // ================================================================ one sub-step: kick then drift, at the middle
  const WK = { R0: new Float64Array(9), R1: new Float64Array(9), Rm: new Float64Array(9), X1: [0, 0, 0], Xm: [0, 0, 0], q1: [1, 0, 0, 0], M: new Float64Array(36), Lw: new Float64Array(36), z: [0, 0, 0, 0, 0, 0], zn: [0, 0, 0, 0, 0, 0], nu: [0, 0, 0, 0, 0, 0], nun: [0, 0, 0, 0, 0, 0], F: [0, 0, 0, 0, 0, 0], pw: {} };
  // her centre of mass's speed through the water at velocities nu (her air taken out of her mass)
  function comSpeed(b, nu) {
    let mm = b.mass, mx = b.mc[0], my = b.mc[1], mz = b.mc[2];
    if (b.Vair > 0) { const ma = b.rhoRef * b.Vair; mm -= ma; mx -= ma * (b.air.p[0] - b.C[0]); my -= ma * (b.air.p[1] - b.C[1]); mz -= ma * (b.air.p[2] - b.C[2]); }
    const gx = mx / mm, gy = my / mm, gz = mz / mm;
    const vx = nu[0] + nu[4] * gz - nu[5] * gy, vy = nu[1] + nu[5] * gx - nu[3] * gz, vz = nu[2] + nu[3] * gy - nu[4] * gx;
    return Math.sqrt(vx * vx + vy * vy + vz * vz);
  }
  function subStep(b, sp, h) {
    const K = b.K, R0 = quatR(b.q, WK.R0), R1 = WK.R1, Rm = WK.Rm, X1 = WK.X1, Xm = WK.Xm, q1 = WK.q1, M = WK.M, z = WK.z, zn = WK.zn, nu = WK.nu, nun = WK.nun, Fo = WK.F, pw = WK.pw;
    const P0 = [b.P[0], b.P[1], b.P[2], b.Lm[0], b.Lm[1], b.Lm[2]], nu0 = b.nu.slice();
    // the pocket: it vents through its opening over the sub-step at the rate its start allows, then is squeezed by Boyle
    let a0 = 0, a1 = 0;
    if (b.spc) {
      // Z6's spaces (K.air 'spaces'): stepped at the sub-step's start, their air the pocket over it (it leaves her through
      // the spaces' own openings, not the pocket's vent); squeezed by Boyle to the sub-step's end as the pocket is
      spacesStep(b, sp, R0, h);
      a0 = a1 = b.air.a;
    } else if (b.air && b.air.a > 0) {
      a0 = b.air.a;
      const da = -(b.X[2] + R0[6] * (b.air.p[0] - b.C[0]) + R0[7] * (b.air.p[1] - b.C[1]) + R0[8] * (b.air.p[2] - b.C[2]));
      const pk = Math.max(pAt(sp, da), P_ATM), dp = rhoAt(sp, da) * GRAV * K.ventHead;
      const rate = b.vent > 0 ? K.ventCd * b.vent * Math.sqrt(2 * dp * RHO_AIR0 * pk / P_ATM) / RHO_AIR0 : 0;   // m3 a second at one atmosphere
      a1 = a0 - rate * h; if (a1 < 0) a1 = 0;
      // more air than her spaces hold at this pressure bubbles out below
      const amax = b.airMax * pk / P_ATM; if (a0 > amax) a0 = amax; if (a1 > amax) a1 = amax;
    }
    // the first guess: the last sub-step's rate
    for (let k = 0; k < 6; k++) z[k] = P0[k] + 0.5 * h * b.rate[k];
    // her pocket over the sub-step: its middle amount at the start's depth (a lag of half a sub-step), her mass with it
    let Vair = 0;
    if (b.air && (a0 > 0 || a1 > 0)) {
      b.air.a = 0.5 * (a0 + a1);
      Vair = airVolume(b, sp, -(b.X[2] + R0[6] * (b.air.p[0] - b.C[0]) + R0[7] * (b.air.p[1] - b.C[1]) + R0[8] * (b.air.p[2] - b.C[2])));
    }
    massWithAir(b, Vair, M);
    let it = 0, conv = false, dlast = Infinity, relax = 1;
    for (; it < K.iterMax; it++) {
      solve6(M, z, nu, WK.Lw);
      // drift: the attitude by the Cayley map of the middle's turning, the place by the middle's velocity
      const hx = 0.5 * h * nu[3], hy = 0.5 * h * nu[4], hz = 0.5 * h * nu[5], q = b.q;
      let w = q[0] - q[1] * hx - q[2] * hy - q[3] * hz, x = q[0] * hx + q[1] + q[2] * hz - q[3] * hy, y = q[0] * hy - q[1] * hz + q[2] + q[3] * hx, zq = q[0] * hz + q[1] * hy - q[2] * hx + q[3];
      const nq = 1 / Math.sqrt(w * w + x * x + y * y + zq * zq); q1[0] = w * nq; q1[1] = x * nq; q1[2] = y * nq; q1[3] = zq * nq;
      quatR(q1, R1);
      for (let k = 0; k < 9; k++) Rm[k] = 0.5 * (R0[k] + R1[k]);
      for (let r = 0; r < 3; r++) { X1[r] = b.X[r] + h * (Rm[r * 3] * nu[0] + Rm[r * 3 + 1] * nu[1] + Rm[r * 3 + 2] * nu[2]); Xm[r] = 0.5 * (b.X[r] + X1[r]); }
      loads(b, sp, nu, b.X, R0, X1, R1, Xm, Rm, Vair, Fo, pw);
      // kick: the middle momenta from the rates at the middle (Kirchhoff's form)
      const Px = z[0], Py = z[1], Pz = z[2], Lx = z[3], Ly = z[4], Lz = z[5], v0 = nu[0], v1 = nu[1], v2 = nu[2], w0 = nu[3], w1 = nu[4], w2 = nu[5];
      const r0 = Py * w2 - Pz * w1 + Fo[0], r1 = Pz * w0 - Px * w2 + Fo[1], r2 = Px * w1 - Py * w0 + Fo[2];
      const r3 = Ly * w2 - Lz * w1 + Py * v2 - Pz * v1 + Fo[3], r4 = Lz * w0 - Lx * w2 + Pz * v0 - Px * v2 + Fo[4], r5 = Lx * w1 - Ly * w0 + Px * v1 - Py * v0 + Fo[5];
      b.rate[0] = r0; b.rate[1] = r1; b.rate[2] = r2; b.rate[3] = r3; b.rate[4] = r4; b.rate[5] = r5;
      for (let k = 0; k < 6; k++) zn[k] = P0[k] + 0.5 * h * b.rate[k];
      solve6(M, zn, nun, WK.Lw);
      let dmax = 0, vmax = 0;
      for (let k = 0; k < 6; k++) { const d = Math.abs(nun[k] - nu[k]); if (d > dmax) dmax = d; const a = Math.abs(nu[k]); if (a > vmax) vmax = a; }
      if (dmax <= K.tol * (1 + vmax)) { for (let k = 0; k < 6; k++) z[k] = zn[k]; conv = true; it++; break; }
      // an iteration that does not shrink (a stiff mud, a law that switches) is relaxed, more each time it fails
      if (dmax >= dlast) relax *= 0.5;
      dlast = dmax;
      for (let k = 0; k < 6; k++) z[k] += relax * (zn[k] - z[k]);
    }
    b.iters += it; b.subs++; if (!conv) b.unconv++;
    // the works over the sub-step: the middle's power times h (the forces of the last pass, the velocities they met)
    b.W.cons += h * pw.cons; b.W.surf += h * pw.surf; b.W.air += h * pw.air; b.W.drag += h * pw.drag; b.W.mud += h * pw.mud;
    // the end of the sub-step
    for (let k = 0; k < 3; k++) { b.P[k] = P0[k] + h * b.rate[k]; b.Lm[k] = P0[3 + k] + h * b.rate[3 + k]; b.X[k] = X1[k]; }
    b.q[0] = q1[0]; b.q[1] = q1[1]; b.q[2] = q1[2]; b.q[3] = q1[3];
    if (b.air) b.air.a = a1;
    b.inMud = pw.inMud; b.fsub = pw.fsub; b.cap = pw.cap;
    // her first touch of the bed: how she arrived (her speed and energy at the start of the sub-step that touched)
    if (pw.inMud && !b.touched) {
      b.touched = true;
      b.arrival = { speed: comSpeed(b, nu0), energy: 0.5 * (P0[0] * nu0[0] + P0[1] * nu0[1] + P0[2] * nu0[2] + P0[3] * nu0[3] + P0[4] * nu0[4] + P0[5] * nu0[5]), depth: bedDepth(sp, b.X[0], b.X[1]) };
    }
    // her velocities at the end, with her mass at the end
    const Ve = b.air && a1 > 0 ? airVolume(b, sp, -(b.X[2] + R1[6] * (b.air.p[0] - b.C[0]) + R1[7] * (b.air.p[1] - b.C[1]) + R1[8] * (b.air.p[2] - b.C[2]))) : 0;
    b.Vair = Ve;
    massWithAir(b, Ve, M);
    solve6(M, [b.P[0], b.P[1], b.P[2], b.Lm[0], b.Lm[1], b.Lm[2]], b.nu, WK.Lw);
    // her first touch of the bed (K.strikeAdded 0): the water she drags flows on, its momentum shed and its energy with
    // it (the following water); her velocity is kept. Out of the mud again she takes it up from rest, her momenta kept
    if (!K.strikeAdded && pw.inMud !== b.shed) {
      const ke = () => 0.5 * (b.P[0] * b.nu[0] + b.P[1] * b.nu[1] + b.P[2] * b.nu[2] + b.Lm[0] * b.nu[3] + b.Lm[1] * b.nu[4] + b.Lm[2] * b.nu[5]);
      const k0 = ke();
      b.shed = pw.inMud;
      massWithAir(b, Ve, M);
      if (b.shed) for (let r = 0; r < 3; r++) { let s = 0, t = 0; for (let k = 0; k < 6; k++) { s += M[r * 6 + k] * b.nu[k]; t += M[(3 + r) * 6 + k] * b.nu[k]; } b.P[r] = s; b.Lm[r] = t; }
      else solve6(M, [b.P[0], b.P[1], b.P[2], b.Lm[0], b.Lm[1], b.Lm[2]], b.nu, WK.Lw);
      b.W.shed += ke() - k0;
      b.rate = [0, 0, 0, 0, 0, 0];
    }
  }

  // ================================================================ placing a body
  // Her pose in the fall's frame and her velocities: R (row-major 3 x 3, her axes to the world's), Xc (where C is), and
  // the velocity of C and her turning, both in her axes. Her momenta follow from her mass with her air.
  function setState(b, sp, R, Xc, vC, om) {
    b.q = quatOfR(R); b.X = Xc.slice();
    const Rq = quatR(b.q, new Float64Array(9));
    if (b.air) {
      const da = -(Xc[2] + Rq[6] * (b.air.p[0] - b.C[0]) + Rq[7] * (b.air.p[1] - b.C[1]) + Rq[8] * (b.air.p[2] - b.C[2]));
      // the air as the core leaves it: its volume kept at the hand-over, at the pressure of its depth
      if (!(b.air.a > 0)) b.air.a = b.air.V0 * Math.max(pAt(sp, da), P_ATM) / P_ATM;
      b.Vair = airVolume(b, sp, da);
    } else b.Vair = 0;
    const M = massWithAir(b, b.Vair, new Float64Array(36)), nu = [vC[0], vC[1], vC[2], om[0], om[1], om[2]];
    b.nu = nu.slice();
    for (let r = 0; r < 3; r++) { let s = 0, t = 0; for (let k = 0; k < 6; k++) { s += M[r * 6 + k] * nu[k]; t += M[(3 + r) * 6 + k] * nu[k]; } b.P[r] = s; b.Lm[r] = t; }
    b.rate = [0, 0, 0, 0, 0, 0];
  }
  // the extent of a body in the world's Z: [lowest, highest] (its sections' corners at its slices' ends)
  function extent(b, R, Xc) {
    let lo = 1e300, hi = -1e300;
    for (let i = 0; i < b.n; i++) {
      const o = b.polyOff[i], m = b.polyOff[i + 1] - o, xe = Math.abs(R[6]) * 0.5 * b.dx[i], base = Xc[2] + R[6] * (b.x[i] - b.C[0]);
      for (let k = 0; k < m; k++) { const z = base + R[7] * (b.polyY[o + k] - b.C[1]) + R[8] * (b.polyZ[o + k] - b.C[2]); if (z - xe < lo) lo = z - xe; if (z + xe > hi) hi = z + xe; }
    }
    return [lo, hi];
  }

  // ================================================================ the fall
  // make(sea, specs, opts): a fall from piece specs (piece() or a test's), each placed with opts.poses[i] or later by
  // place(); opts: { rule, t0, dt, at, K (the step's), breakAt }
  function make(sp, specs, opts) {
    opts = opts || {};
    const fall = { v: 3, rule: opts.rule || 'flag', t0: opts.t0 || 0, k: 0, t: opts.t0 || 0, done: false, sea: sp, at: opts.at || { X: 0, Y: 0, psi: 0 }, breakAt: opts.breakAt || null, pieces: [], debris: [], events: [], lights: null,
      eng: { dt: opts.dt || C.DEFAULT_PARAMS.dt, bodies: [] } };
    for (const s of specs) {
      const b = body(s, sp);
      fall.eng.bodies.push(b);
      fall.pieces.push({ id: s.id || b.kind, x0: b.x0, x1: b.x1, r: [0, 0, 0], q: [1, 0, 0, 0], v: [0, 0, 0], om: [0, 0, 0], state: 'falling', depth: 0, speed: 0, air: 0, bury: new Float64Array(b.n) });
    }
    return fall;
  }
  // place(fall, i, pose): { R or pitch/roll (the core's convention), r (where her ship-frame origin is) or top (the
  //   height of her highest point, the horizontal place of C at X, Y), vC/om (her velocities in her axes, default 0) }
  function place(fall, i, pose) {
    const b = fall.eng.bodies[i], sp = fall.sea;
    if (b.K.air === 'spaces') throw new Error('K.air \'spaces\' is begin()\'s alone (the hand-over\'s spaces)');
    const R = pose.R ? Array.from(pose.R) : poseR(pose.pitch || 0, pose.roll || 0);
    let Xc;
    if (pose.r) Xc = [pose.r[0] + R[0] * b.C[0] + R[1] * b.C[1] + R[2] * b.C[2], pose.r[1] + R[3] * b.C[0] + R[4] * b.C[1] + R[5] * b.C[2], pose.r[2] + R[6] * b.C[0] + R[7] * b.C[1] + R[8] * b.C[2]];
    else { Xc = [pose.X || 0, pose.Y || 0, 0]; const ex = extent(b, R, Xc); Xc[2] = (pose.top === undefined ? -1 : pose.top) - ex[1]; }
    b.shed = false; b.inMud = false;
    setState(b, sp, R, Xc, pose.vC || [0, 0, 0], pose.om || [0, 0, 0]);
    b.state = 'falling'; b.tSlow = 0; b.struck = false; b.touched = false; b.arrival = null; b.wentUnder = false; b.bury.fill(0);
    b.W = { drag: 0, mud: 0, cons: 0, surf: 0, air: 0, shed: 0, freeze: 0 };
    sync(fall, i, true);
  }

  // the contract's fields of piece i from its body
  const RS = new Float64Array(9);
  function sync(fall, i, first) {
    const b = fall.eng.bodies[i], p = fall.pieces[i], sp = fall.sea, R = quatR(b.q, RS), c = b.C, nu = b.nu;
    p.r = [b.X[0] - (R[0] * c[0] + R[1] * c[1] + R[2] * c[2]), b.X[1] - (R[3] * c[0] + R[4] * c[1] + R[5] * c[2]), b.X[2] - (R[6] * c[0] + R[7] * c[1] + R[8] * c[2])];
    p.q = b.q.slice();
    // the ship-frame origin's velocity: v_C + w x (0 - c) = v_C - w x c
    p.v = [nu[0] - (nu[4] * c[2] - nu[5] * c[1]), nu[1] - (nu[5] * c[0] - nu[3] * c[2]), nu[2] - (nu[3] * c[1] - nu[4] * c[0])];
    p.om = [nu[3], nu[4], nu[5]];
    if (p.bury !== b.bury) p.bury.set(b.bury);
    const ex = extent(b, R, b.X);
    p.depth = -ex[0];
    // her centre of mass, with her air: the speed through the water
    let mm = b.mass, mx = b.mc[0], my = b.mc[1], mz = b.mc[2];
    if (b.Vair > 0) { const ma = b.rhoRef * b.Vair; mm -= ma; mx -= ma * (b.air.p[0] - c[0]); my -= ma * (b.air.p[1] - c[1]); mz -= ma * (b.air.p[2] - c[2]); }
    const gx = mx / mm, gy = my / mm, gz = mz / mm;
    const vx = nu[0] + nu[4] * gz - nu[5] * gy, vy = nu[1] + nu[5] * gx - nu[3] * gz, vz = nu[2] + nu[3] * gy - nu[4] * gx;
    p.speed = Math.sqrt(vx * vx + vy * vy + vz * vz);
    p.air = b.Vair || 0;
    p.state = b.state;
    b.top = ex[1]; b.low = ex[0];
    return p;
  }
  // her kinetic energy with the water in her and the water she drags (J), and her potential: her structure's weight,
  // and the water in her and the sea about her through the column (J; while she is wholly under)
  function energy(fall, i) {
    const b = fall.eng.bodies[i], sp = fall.sea, R = quatR(b.q, new Float64Array(9)), cx = b.C[0], cy = b.C[1], cz = b.C[2];
    const KE = 0.5 * (b.P[0] * b.nu[0] + b.P[1] * b.nu[1] + b.P[2] * b.nu[2] + b.Lm[0] * b.nu[3] + b.Lm[1] * b.nu[4] + b.Lm[2] * b.nu[5]);
    const z = (px, py, pz) => b.X[2] + R[6] * px + R[7] * py + R[8] * pz;
    let U = 0;
    for (let i2 = 0; i2 < b.n; i2++) {
      const xi = b.x[i2] - cx;
      U += b.ms[i2] * GRAV * z(b.gx[i2] - cx, b.gy[i2] - cy, b.gz[i2] - cz);
      U += GRAV * b.Venv[i2] * phiAt(sp, -z(xi, b.ey[i2] - cy, b.ez[i2] - cz));
      if (b.Vf[i2] > 0) U -= GRAV * b.Vf[i2] * phiAt(sp, -z(xi, b.fy[i2] - cy, b.fz[i2] - cz));
    }
    return { KE, U };
  }

  // one dt for every piece; events; done. While a joint holds (fall.eng.joint: the 'break' hand-over with a hinge), its
  // two bodies take each sub-step together (subStepPair), at the finer of their two counts; once it lets go, the rest
  // of that dt's sub-steps, and every dt after, are each body's own, as for any piece
  function advance(fall) {
    const sp = fall.sea, dt = fall.eng.dt, J = fall.eng.joint;
    if (J && !J.released) {
      const bb = fall.eng.bodies[J.ib], bs = fall.eng.bodies[J.is];
      const ns = Math.max(subsOf(fall, J.ib, dt), subsOf(fall, J.is, dt)), h = dt / ns;
      for (let s = 0; s < ns; s++) {
        if (!J.released) subStepPair(fall, h, s);
        else { if (bb.state !== 'at rest') subStep(bb, sp, h); if (bs.state !== 'at rest') subStep(bs, sp, h); }
      }
      if (bb.state !== 'at rest') afterSteps(fall, J.ib, dt);
      if (bs.state !== 'at rest') afterSteps(fall, J.is, dt);
      for (let i = 0; i < fall.eng.bodies.length; i++) if (i !== J.ib && i !== J.is) stepOne(fall, i, dt);
    } else for (let i = 0; i < fall.eng.bodies.length; i++) stepOne(fall, i, dt);
    // B4's gate 2: the tear's openings at the joint's state at the dt's end (idempotent; the release seen here at once)
    if (J) for (const b of fall.eng.bodies) if (b.spc && b.spc.tear) tearStep(b.spc);
    fall.k++; fall.t = fall.t0 + fall.k * dt;
    if (fall.lights) lightsAt(fall);
    let all = true; for (const b of fall.eng.bodies) if (b.state !== 'at rest') { all = false; break; }
    fall.done = all;
    return fall;
  }
  // near the bed (or in it) the step is finer: within bedNear m, and the way she makes in a step, of the bed under her
  function subsOf(fall, i, dt) {
    const b = fall.eng.bodies[i], K = b.K, sp = fall.sea;
    const reach = (fall.pieces[i].speed + 1) * dt + K.bedNear + sp.bed.tan * b.Rb;
    const nearBed = b.inMud || (-b.low) > bedDepth(sp, b.X[0], b.X[1]) - reach;
    return nearBed ? K.subBed : K.sub;
  }
  function stepOne(fall, i, dt) {
    const b = fall.eng.bodies[i];
    if (b.state === 'at rest') return;
    const ns = subsOf(fall, i, dt), h = dt / ns;
    for (let s = 0; s < ns; s++) subStep(b, fall.sea, h);
    afterSteps(fall, i, dt);
  }
  // after a dt's sub-steps: what she is now, and its events
  function afterSteps(fall, i, dt) {
    {
      const b = fall.eng.bodies[i], K = b.K;
      const p = sync(fall, i);
      if (b.spc) spacesReport(fall, i);
      if (b.inMud) {
        if (!b.struck) { b.struck = true; const a = b.arrival; fall.events.push({ t: fall.t + dt, id: 'strike', piece: p.id, depth: a.depth, energy: a.energy, speed: a.speed }); }
        // slower than vRest everywhere for tRest: held by the mud
        let vmax = 0;
        for (let k = 0; k < b.n; k++) {
          const px = b.x[k] - b.C[0], py = b.ey[k] - b.C[1], pz = b.ez[k] - b.C[2], nu = b.nu;
          const lx = nu[0] + nu[4] * pz - nu[5] * py, ly = nu[1] + nu[5] * px - nu[3] * pz, lz = nu[2] + nu[3] * py - nu[4] * px;
          const s2 = lx * lx + ly * ly + lz * lz; if (s2 > vmax) vmax = s2;
        }
        b.tSlow = Math.sqrt(vmax) < K.vRest && b.cap > weightInWater(b) * GRAV - GRAV * fall.sea.rho[0] * (b.Vair || 0) ? b.tSlow + dt : 0;
        b.state = 'striking';
        if (b.tSlow >= K.tRest - 1e-9) {
          const KE = energy(fall, i).KE;
          b.W.freeze = KE; b.W.mud -= KE;
          b.P = [0, 0, 0]; b.Lm = [0, 0, 0]; b.nu = [0, 0, 0, 0, 0, 0]; b.rate = [0, 0, 0, 0, 0, 0];
          b.state = 'at rest';
          sync(fall, i);
          fall.events.push({ t: fall.t + dt, id: 'rest', piece: p.id, depth: p.depth, energy: -b.W.mud, speed: 0 });
        }
      } else if (b.top > 0) b.state = 'afloat';
      else {
        if (!b.wentUnder) { b.wentUnder = true; fall.events.push({ t: fall.t + dt, id: 'under', piece: p.id, depth: p.depth, energy: energy(fall, i).KE, speed: p.speed }); }
        // under while her air still bears a tenth of her weight in water [mine]; falling after
        const wIn = weightInWater(b);
        b.state = b.Vair > 0 && fall.sea.rho[0] * b.Vair > 0.1 * wIn ? 'under' : 'falling';
      }
      p.state = b.state;
    }
  }
  // her weight in water, kg (her structure less the sea's weight of her solids, at the column's mean density)
  function weightInWater(b) {
    let m = 0, vs = 0; for (let i = 0; i < b.n; i++) { m += b.ms[i]; vs += b.Venv[i] - b.Vf[i]; }
    return m - b.rhoRef * vs;
  }

  // ================================================================ the joint (Z6 inside B4)
  // docs/DESIGN_free_body_air_by_space_v1_1 (section 1) and v1_2 (section 1); proved on rigid bodies in
  // docs/research/experiments/e68_z6_joint_rigs.js. While the ligament holds, the bow and the stern are one pin on the
  // hinge's axis at the break, (xb, 0, zNA) in the ship frame (both pieces keep the parent's ship frame): the hinge's
  // angle theta is free about her own y, the five other relative freedoms are locked. Both bodies take each sub-step
  // together, and the constraint's force is found at the sub-step's middle inside the midpoint's iterations, so that the
  // five locked velocities of the middle agree and the force does no work there. The hinge's moment is its law: the
  // intact section's line from the moment the joint carried at the hand-over, S.hinge's backbone at its furthest angle,
  // its unloading line below (S.hinge.unload: the ligament springs back, the torn part never mends), from theta at the
  // sub-step's start, as an equal and opposite pair about the hinge's axis. The joint lets go at the first sub-step
  // where its own force passes what still holds (S.hinge: its tension along her above Nt, or its shear across her above
  // Vs); that sub-step is run again with the bodies free. It is built only when a hand-over asks for it (begin's
  // opts.hinge); without it nothing here runs, and every fall is as before, to the bit.
  // The joint's state, fall.eng.joint (the engine's own): { H (S.hinge at the break, in its sense), xb, sense (+1
  // hogging: theta opens the deck, the bow's head down against the stern; -1 sagging), ib, is (the bodies: the bow, the
  // stern), theta, thMax, thY, yielded, M0 (the moment at the hand-over, closing positive), released, release (what let
  // go: t, theta, by, N/Nt, |V|/Vs), maxN, maxV (the largest ratios while it held), W (the hinge's own work, J: the
  // tear's, with its elastic returns), drift (the largest drift projected out), demand0 }
  const dot6 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3] + a[4] * b[4] + a[5] * b[5];
  const crs = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const unit3 = (a) => { const n = Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]); return [a[0] / n, a[1] / n, a[2] / n]; };
  const RTv3 = (R, v) => [R[0] * v[0] + R[3] * v[1] + R[6] * v[2], R[1] * v[0] + R[4] * v[1] + R[7] * v[2], R[2] * v[0] + R[5] * v[1] + R[8] * v[2]];
  const Rv3 = (R, v) => [R[0] * v[0] + R[1] * v[1] + R[2] * v[2], R[3] * v[0] + R[4] * v[1] + R[5] * v[2], R[6] * v[0] + R[7] * v[1] + R[8] * v[2]];
  // Gaussian elimination with partial pivoting, fixed order (n <= 6)
  function solveN(K, rhs) {
    const n = rhs.length, A = K.map((r, i) => r.slice().concat([rhs[i]]));
    for (let c = 0; c < n; c++) {
      let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
      if (p !== c) { const t = A[p]; A[p] = A[c]; A[c] = t; }
      for (let r = c + 1; r < n; r++) { const f = A[r][c] / A[c][c]; for (let j = c; j <= n; j++) A[r][j] -= f * A[c][j]; }
    }
    const x = new Array(n).fill(0);
    for (let r = n - 1; r >= 0; r--) { let s = A[r][n]; for (let j = r + 1; j < n; j++) s -= A[r][j] * x[j]; x[r] = s / A[r][r]; }
    return x;
  }
  const hingeAt = (J, s) => J.H.at(s > 0 ? s : 0);
  // the hinge's moment, closing positive, at theta, from its state: pure (commitHinge moves the state)
  // hinge.yieldOn (J.yieldOn; Z1 with B1+B2, 2026-11-24, on the coordinator's 3.6 % at the hand-over): 'resultant', the
  // default since join 22 (D116, below); 'moment' (the hinge before join 22, a what-if) yields on M = Mu alone; 'circle'
  // (a what-if) yields on the onset's own interaction,
  // (M/Mu)^2 + (V/Vs)^2 = 1: the moment capacity under the joint's shear (its last solve's; the hand-over's demand at the
  // first) is Mu sqrt(1 - (V/Vs)^2), and the backbone is scaled by the same factor with the ligament's Vs(s) as it tears.
  // The factor is the hinge's own, S.hinge's under(s, V) (B1+B2, core/readers/section.js), at the same abscissa as hingeAt.
  // 'resultant' (B1+B2's e124, 2026-11-24, on the list's axis): B2's onset judges the moment about the world's
  // horizontal axis across her, the resultant of M cos(list) about her y and M sin(list) about her z with her strength
  // the same both ways; the hinge bends about her y and its pin locks her relative yaw. So it yields on the resultant of
  // its own bending moments on the same circle, sqrt(m_y^2 + m_z^2) = Mu under(s, V): its capacity about her y is
  // Mu sqrt(1 - (V/Vs(s))^2 - (m_z/Mu)^2), m_z the locked yaw's moment (the joint's e3 row; its relative roll, e1, is
  // torsion and stays out), 0 past it: S.hinge's under(s, V, Mz) (B1+B2, 9ea7928). Its backbone stays about her y
  function shearShare(J, s) {
    if (J.yieldOn !== 'circle' && J.yieldOn !== 'resultant') return 1;
    const f0 = J.force ? J.force : J.demand0, ss = s > 0 ? s : 0, V = f0 ? f0.V : 0;
    return J.yieldOn === 'circle' ? J.H.under(ss, V) : J.H.under(ss, V, f0 && f0.Mz ? f0.Mz : 0);
  }
  function hingeLaw(J, th) {
    const Mu = J.H.Mu * shearShare(J, 0), k0 = J.H.k0;
    if (!J.yielded) { const m = J.M0 + k0 * th; if (m < Mu) return { m, yielded: false }; }
    // it yields where the intact line reaches Mu (under 'circle', the shear's share of it); at once (thY 0) when the
    // hand-over already asks more
    const thY = J.yielded ? J.thY : Math.max(0, (Mu - J.M0) / k0), thMax = Math.max(J.yielded ? J.thMax : thY, th);
    if (th >= thMax) return { m: hingeAt(J, th - thY).M * shearShare(J, th - thY), yielded: true, thY, thMax };
    return { m: J.H.unload(thMax - thY, th - thY).M * shearShare(J, thMax - thY), yielded: true, thY, thMax };
  }
  function commitHinge(J, th) { const r = hingeLaw(J, th); if (r.yielded) { J.yielded = true; J.thY = r.thY; J.thMax = r.thMax; } return r.m; }
  // B4's gate 2 (docs/DESIGN_B4_Z6_the_break_from_the_onset_gates_1_2_v1_2026-11-23.md): the tear's openings to the sea,
  // m2 a space in the core's node order [port below E, port above E, stbd below E, stbd above E], and their spans (m
  // above the keel), at the joint's state, by the hinge law's own angle as hingeLaw reads it: none before it yields; on
  // its backbone at theta - thY while loading; on its unloading line back from thMax (its spans then thMax's)
  function tearAt(J) {
    if (!J.yielded) return { open: [0, 0, 0, 0], span: [null, null, null, null] };
    const th = J.theta, top = hingeAt(J, J.thMax - J.thY);
    return th >= J.thMax ? hingeAt(J, th - J.thY) : { open: J.H.unload(J.thMax - J.thY, th - J.thY).open, span: top.span };
  }
  // under the spaces with the joint: while it holds, the broken spaces open to the sea only through the tear, each
  // piece's half of each space at the cut over its share of the space's room [bet: B1+B2's "your call"]; the cut's faces
  // stand shut. At the release they open, and the tear's last openings stand (tearStep, from spacesStep)
  function tearBegin(fall, J) {
    const B = fall.eng.bodies, room = new Map();
    for (const b of B) if (b.spc) for (const op of b.spc.ops) if (op.kind === 'cut') { const n = b.spc.sp.node[op.a]; room.set(n, (room.get(n) || 0) + b.spc.sp.V[op.a]); }
    for (const b of B) {
      if (!b.spc) continue;
      const S = b.spc, cut = [], tear = [];
      for (let i = 0, n0 = S.ops.length; i < n0; i++) {
        const op = S.ops[i];
        if (op.kind !== 'cut') continue;
        op.open = false; cut.push(i);
        const n = S.sp.node[op.a];
        S.ops.push({ c: -1, kind: 'tear', a: op.a, b: -1, px: op.px, py: op.py, pz: op.pz, nx: op.nx, ny: 0, nz: 0, A: 0, L: op.L, Cd: op.Cd, open: false });
        tear.push({ i: S.ops.length - 1, q: ((n >> 1) & 1) * 2 + (n & 1), share: S.sp.V[op.a] / room.get(n) });
      }
      S.tear = { J, cut, tear, released: false };
    }
    for (const b of B) if (b.spc) tearStep(b.spc);
  }
  function tearStep(S) {
    const T = S.tear, J = T.J;
    if (T.released) return;
    if (J.released) { for (const i of T.cut) S.ops[i].open = true; T.released = true; return; }
    const at = tearAt(J);
    for (const t of T.tear) {
      const op = S.ops[t.i], sp = at.span[t.q];
      op.A = (at.open[t.q] || 0) * t.share; op.open = op.A > 0;
      if (sp) { op.pz = 0.5 * (sp[0] + sp[1]); op.L = sp[1] - sp[0]; }
    }
  }
  // where the backbone stands (its abscissa) and the pin's height there: the neutral axis the parts turn about
  const backbone = (J) => (J.yielded ? Math.max(0, J.thMax - J.thY) : 0);
  const pinZ = (J) => hingeAt(J, backbone(J)).zNA;
  // the joint's rows at the bodies' attitudes Rb, Rs (row-major): each 12 long, [bow linear, bow angular, stern linear,
  // stern angular] in each body's own axes; the pin's three (along the world's axes), the relative roll and yaw (about
  // e1, e3), and with six the hinge's own (theta-dot, sense applied). e1 along her (the bodies' mean x), e2 the hinge's
  // axis (the bow's y), e3 = e1 x e2, all in the world
  function jointRows(J, bb, bs, Rb, Rs, six) {
    const zp = pinZ(J), rb = [J.xb - bb.C[0], -bb.C[1], zp - bb.C[2]], rs = [J.xb - bs.C[0], -bs.C[1], zp - bs.C[2]];
    const e2 = unit3([Rb[1], Rb[4], Rb[7]]), e1 = unit3([Rb[0] + Rs[0], Rb[3] + Rs[3], Rb[6] + Rs[6]]), e3 = unit3(crs(e1, e2));
    const rows = [];
    for (let k = 0; k < 3; k++) {
      // u_k . R (v + w x r) = a . v + w . (r x a), with a the row k of R
      const ab = [Rb[3 * k], Rb[3 * k + 1], Rb[3 * k + 2]], as = [Rs[3 * k], Rs[3 * k + 1], Rs[3 * k + 2]], cb = crs(rb, ab), cs = crs(rs, as);
      rows.push([ab[0], ab[1], ab[2], cb[0], cb[1], cb[2], -as[0], -as[1], -as[2], -cs[0], -cs[1], -cs[2]]);
    }
    const ax = six ? [e1, e3, e2] : [e1, e3];
    for (let a = 0; a < ax.length; a++) {
      const e = ax[a], sg = a === 2 ? J.sense : 1, gb = RTv3(Rb, e), gs = RTv3(Rs, e);
      rows.push([0, 0, 0, sg * gb[0], sg * gb[1], sg * gb[2], 0, 0, 0, -sg * gs[0], -sg * gs[1], -sg * gs[2]]);
    }
    return { rows, e1, e2, e3, rb, rs };
  }
  // K = J M^-1 J^T over both bodies (M each body's own 6 x 6, with her added mass and her air)
  function jointK(rows, Mb, Ms, Lw) {
    const Yb = rows.map(r => solve6(Mb, r.slice(0, 6), [0, 0, 0, 0, 0, 0], Lw)), Ys = rows.map(r => solve6(Ms, r.slice(6, 12), [0, 0, 0, 0, 0, 0], Lw));
    return rows.map(ri => rows.map((rj, j) => dot6(ri.slice(0, 6), Yb[j]) + dot6(ri.slice(6, 12), Ys[j])));
  }
  // Kirchhoff's rates from the momenta z, the velocities nu and the loads F (as subStep has them)
  function kirchhoff(z, nu, F, out) {
    const Px = z[0], Py = z[1], Pz = z[2], Lx = z[3], Ly = z[4], Lz = z[5], v0 = nu[0], v1 = nu[1], v2 = nu[2], w0 = nu[3], w1 = nu[4], w2 = nu[5];
    out[0] = Py * w2 - Pz * w1 + F[0]; out[1] = Pz * w0 - Px * w2 + F[1]; out[2] = Px * w1 - Py * w0 + F[2];
    out[3] = Ly * w2 - Lz * w1 + Py * v2 - Pz * v1 + F[3]; out[4] = Lz * w0 - Lx * w2 + Pz * v0 - Px * v2 + F[4]; out[5] = Lx * w1 - Ly * w0 + Px * v1 - Py * v0 + F[5];
    return out;
  }
  // the moment the joint carries now to hold theta (closing positive), from one locked solve at the bodies' state
  function jointDemand(fall, J) {
    const sp = fall.sea, B = [fall.eng.bodies[J.ib], fall.eng.bodies[J.is]], Lw = new Float64Array(36);
    const S = B.map(b => {
      const R = quatR(b.q, new Float64Array(9)), M = massWithAir(b, b.Vair || 0, new Float64Array(36)), F = [0, 0, 0, 0, 0, 0];
      loads(b, sp, b.nu, b.X, R, b.X, R, b.X, R, b.Vair || 0, F, {});
      const z = [b.P[0], b.P[1], b.P[2], b.Lm[0], b.Lm[1], b.Lm[2]], r = kirchhoff(z, b.nu, F, [0, 0, 0, 0, 0, 0]);
      return { R, M, r, a: solve6(M, r, [0, 0, 0, 0, 0, 0], Lw) };
    });
    const ax = jointRows(J, B[0], B[1], S[0].R, S[1].R, true), K = jointK(ax.rows, S[0].M, S[1].M, Lw);
    const lam = solveN(K, ax.rows.map(row => -(dot6(row.slice(0, 6), S[0].a) + dot6(row.slice(6, 12), S[1].a))));
    const F = [lam[0], lam[1], lam[2]];
    return { M0: -lam[5], N: -(F[0] * ax.e1[0] + F[1] * ax.e1[1] + F[2] * ax.e1[2]), V: F[0] * ax.e3[0] + F[1] * ax.e3[1] + F[2] * ax.e3[2], L: F[0] * ax.e2[0] + F[1] * ax.e2[1] + F[2] * ax.e2[2], Mz: lam[4] };
  }
  // the hinge's angle from the two attitudes: the bow's against the stern's, about the stern's y
  function jointTheta(J, bb, bs) {
    const Rb = quatR(bb.q, new Float64Array(9)), Rs = quatR(bs.q, new Float64Array(9));
    const r20 = Rs[2] * Rb[0] + Rs[5] * Rb[3] + Rs[8] * Rb[6], r00 = Rs[0] * Rb[0] + Rs[3] * Rb[3] + Rs[6] * Rb[6];
    return J.sense * C.atan2(-r20, r00);
  }
  // the five locked freedoms' drift at the bodies' places: the pin's gap (m, world) and the relative roll and yaw (rad)
  function jointError(J, bb, bs) {
    const Rb = quatR(bb.q, new Float64Array(9)), Rs = quatR(bs.q, new Float64Array(9)), ax = jointRows(J, bb, bs, Rb, Rs, false);
    const pb = Rv3(Rb, ax.rb), ps = Rv3(Rs, ax.rs), gap = [bb.X[0] + pb[0] - bs.X[0] - ps[0], bb.X[1] + pb[1] - bs.X[1] - ps[1], bb.X[2] + pb[2] - bs.X[2] - ps[2]];
    // the bow's attitude against the stern's turned by theta about the stern's y: E = Rb (Rs Ry)^T, its small rotation
    const th = J.sense * jointTheta(J, bb, bs), c = C.cos(th), s = C.sin(th);
    const T = [Rs[0] * c - Rs[2] * s, Rs[1], Rs[0] * s + Rs[2] * c, Rs[3] * c - Rs[5] * s, Rs[4], Rs[3] * s + Rs[5] * c, Rs[6] * c - Rs[8] * s, Rs[7], Rs[6] * s + Rs[8] * c];
    const E = (i, j) => Rb[3 * i] * T[3 * j] + Rb[3 * i + 1] * T[3 * j + 1] + Rb[3 * i + 2] * T[3 * j + 2];
    const phi = [(E(2, 1) - E(1, 2)) / 2, (E(0, 2) - E(2, 0)) / 2, (E(1, 0) - E(0, 1)) / 2];
    return { ax, Rb, Rs, c: [gap[0], gap[1], gap[2], phi[0] * ax.e1[0] + phi[1] * ax.e1[1] + phi[2] * ax.e1[2], phi[0] * ax.e3[0] + phi[1] * ax.e3[1] + phi[2] * ax.e3[2]] };
  }
  // the drift projected out, weighted by each body's own mass (one Newton step, twice); places and attitudes only. What
  // that moves is kept: the largest drift met (drift), the largest left after (resid), and the potential energy the
  // move made (Wproj, J: the identity counts it)
  function jointProject(fall, J, bb, bs) {
    const Lw = new Float64Array(36), U0 = energy(fall, J.ib).U + energy(fall, J.is).U;
    for (let it = 0; it < 2; it++) {
      const e = jointError(J, bb, bs), Mb = massWithAir(bb, bb.Vair || 0, new Float64Array(36)), Ms = massWithAir(bs, bs.Vair || 0, new Float64Array(36));
      J.drift = Math.max(J.drift, Math.sqrt(e.c[0] * e.c[0] + e.c[1] * e.c[1] + e.c[2] * e.c[2]));
      const l = solveN(jointK(e.ax.rows, Mb, Ms, Lw), e.c.map(v => -v));
      for (const [b, R, off, M] of [[bb, e.Rb, 0, Mb], [bs, e.Rs, 6, Ms]]) {
        const g = [0, 0, 0, 0, 0, 0];
        for (let i = 0; i < 5; i++) for (let k = 0; k < 6; k++) g[k] += e.ax.rows[i][off + k] * l[i];
        const d = solve6(M, g, [0, 0, 0, 0, 0, 0], Lw), dX = Rv3(R, [d[0], d[1], d[2]]), dPhi = Rv3(R, [d[3], d[4], d[5]]);
        b.X[0] += dX[0]; b.X[1] += dX[1]; b.X[2] += dX[2];
        const a = Math.sqrt(dPhi[0] * dPhi[0] + dPhi[1] * dPhi[1] + dPhi[2] * dPhi[2]);
        if (a > 0) {
          const sa = C.sin(a / 2) / a, d0 = C.cos(a / 2), d1 = dPhi[0] * sa, d2 = dPhi[1] * sa, d3 = dPhi[2] * sa, q = b.q;
          const r = [d0 * q[0] - d1 * q[1] - d2 * q[2] - d3 * q[3], d0 * q[1] + d1 * q[0] + d2 * q[3] - d3 * q[2], d0 * q[2] - d1 * q[3] + d2 * q[0] + d3 * q[1], d0 * q[3] + d1 * q[2] - d2 * q[1] + d3 * q[0]];
          const n = Math.sqrt(r[0] * r[0] + r[1] * r[1] + r[2] * r[2] + r[3] * r[3]); b.q = [r[0] / n, r[1] / n, r[2] / n, r[3] / n];
        }
      }
    }
    const e = jointError(J, bb, bs).c;
    J.resid = Math.max(J.resid, Math.sqrt(e[0] * e[0] + e[1] * e[1] + e[2] * e[2]), Math.abs(e[3]), Math.abs(e[4]));
    J.Wproj += energy(fall, J.ib).U + energy(fall, J.is).U - U0;
  }
  // a body's state that a sub-step moves, to run it again free if the ligament parts in it
  function snapBody(b) { return { P: b.P.slice(), Lm: b.Lm.slice(), X: b.X.slice(), q: b.q.slice(), nu: b.nu.slice(), rate: b.rate.slice(), a: b.air ? b.air.a : 0, Vair: b.Vair, inMud: b.inMud, fsub: b.fsub, cap: b.cap, shed: b.shed, touched: b.touched, arrival: b.arrival, iters: b.iters, subs: b.subs, unconv: b.unconv, W: Object.assign({}, b.W) }; }
  function restoreBody(b, s) { b.P = s.P; b.Lm = s.Lm; b.X = s.X; b.q = s.q; b.nu = s.nu; b.rate = s.rate; if (b.air) b.air.a = s.a; b.Vair = s.Vair; b.inMud = s.inMud; b.fsub = s.fsub; b.cap = s.cap; b.shed = s.shed; b.touched = s.touched; b.arrival = s.arrival; b.iters = s.iters; b.subs = s.subs; b.unconv = s.unconv; b.W = s.W; }
  // one sub-step of the two joined bodies: subStep's midpoint for each, iterated together, with the constraint's force
  // at the middle and the hinge's moment; then the release test, the drift and theta
  function subStepPair(fall, h, sIdx) {
    const J = fall.eng.joint, sp = fall.sea, B = [fall.eng.bodies[J.ib], fall.eng.bodies[J.is]], save = B.map(snapBody);
    const th0 = J.theta, mid = J.at !== 'start';
    let mh = hingeLaw(J, th0).m;                     // 'mid': the first iteration's, then the middle's (below)
    const S = B.map(b => {
      const s = { b, K: b.K, R0: quatR(b.q, new Float64Array(9)), R1: new Float64Array(9), Rm: new Float64Array(9), X1: [0, 0, 0], Xm: [0, 0, 0], q1: [1, 0, 0, 0], M: new Float64Array(36), Lw: new Float64Array(36),
        z: [0, 0, 0, 0, 0, 0], zn: [0, 0, 0, 0, 0, 0], nu: [0, 0, 0, 0, 0, 0], nun: [0, 0, 0, 0, 0, 0], Fo: [0, 0, 0, 0, 0, 0], pw: {}, r: [0, 0, 0, 0, 0, 0],
        P0: [b.P[0], b.P[1], b.P[2], b.Lm[0], b.Lm[1], b.Lm[2]], nu0: b.nu.slice(), a0: 0, a1: 0, Vair: 0 };
      const K = b.K, R0 = s.R0;
      // the pocket: as subStep. Under the spaces (B4's gate 2) each body's spaces are stepped at its own pose at the
      // sub-step's start, their air the pocket over it, as subStep does
      if (b.spc) { spacesStep(b, sp, R0, h); s.a0 = s.a1 = b.air.a; }
      else if (b.air && b.air.a > 0) {
        s.a0 = b.air.a;
        const da = -(b.X[2] + R0[6] * (b.air.p[0] - b.C[0]) + R0[7] * (b.air.p[1] - b.C[1]) + R0[8] * (b.air.p[2] - b.C[2]));
        const pk = Math.max(pAt(sp, da), P_ATM), dp = rhoAt(sp, da) * GRAV * K.ventHead;
        const rate = b.vent > 0 ? K.ventCd * b.vent * Math.sqrt(2 * dp * RHO_AIR0 * pk / P_ATM) / RHO_AIR0 : 0;
        s.a1 = s.a0 - rate * h; if (s.a1 < 0) s.a1 = 0;
        const amax = b.airMax * pk / P_ATM; if (s.a0 > amax) s.a0 = amax; if (s.a1 > amax) s.a1 = amax;
      }
      for (let k = 0; k < 6; k++) s.z[k] = s.P0[k] + 0.5 * h * b.rate[k];
      if (b.air && (s.a0 > 0 || s.a1 > 0)) {
        b.air.a = 0.5 * (s.a0 + s.a1);
        s.Vair = airVolume(b, sp, -(b.X[2] + R0[6] * (b.air.p[0] - b.C[0]) + R0[7] * (b.air.p[1] - b.C[1]) + R0[8] * (b.air.p[2] - b.C[2])));
      }
      massWithAir(b, s.Vair, s.M);
      return s;
    });
    const iterMax = Math.max(S[0].K.iterMax, S[1].K.iterMax), tol = Math.min(S[0].K.tol, S[1].K.tol), Lw = new Float64Array(36);
    let it = 0, conv = false, dlast = Infinity, relax = 1, lam = null, ax = null;
    for (; it < iterMax; it++) {
      for (const s of S) {
        const b = s.b, nu = s.nu, q = b.q, R0 = s.R0, R1 = s.R1, Rm = s.Rm;
        solve6(s.M, s.z, nu, s.Lw);
        const hx = 0.5 * h * nu[3], hy = 0.5 * h * nu[4], hz = 0.5 * h * nu[5];
        const w = q[0] - q[1] * hx - q[2] * hy - q[3] * hz, x = q[0] * hx + q[1] + q[2] * hz - q[3] * hy, y = q[0] * hy - q[1] * hz + q[2] + q[3] * hx, zq = q[0] * hz + q[1] * hy - q[2] * hx + q[3];
        const nq = 1 / Math.sqrt(w * w + x * x + y * y + zq * zq); s.q1[0] = w * nq; s.q1[1] = x * nq; s.q1[2] = y * nq; s.q1[3] = zq * nq;
        quatR(s.q1, R1);
        for (let k = 0; k < 9; k++) Rm[k] = 0.5 * (R0[k] + R1[k]);
        for (let r = 0; r < 3; r++) { s.X1[r] = b.X[r] + h * (Rm[r * 3] * nu[0] + Rm[r * 3 + 1] * nu[1] + Rm[r * 3 + 2] * nu[2]); s.Xm[r] = 0.5 * (b.X[r] + s.X1[r]); }
        loads(b, sp, nu, b.X, R0, s.X1, R1, s.Xm, Rm, s.Vair, s.Fo, s.pw);
      }
      ax = jointRows(J, B[0], B[1], S[0].Rm, S[1].Rm, false);
      if (mid) {                                     // the hinge at the middle: theta from the trial end attitudes (pure)
        const Rb = S[0].R1, Rs = S[1].R1, r20 = Rs[2] * Rb[0] + Rs[5] * Rb[3] + Rs[8] * Rb[6], r00 = Rs[0] * Rb[0] + Rs[3] * Rb[3] + Rs[6] * Rb[6];
        mh = hingeLaw(J, 0.5 * (th0 + J.sense * C.atan2(-r20, r00))).m;
      }
      // the hinge's moment, closing positive: about e2, -sense on the bow, +sense on the stern, in each one's axes
      const tw = [-J.sense * mh * ax.e2[0], -J.sense * mh * ax.e2[1], -J.sense * mh * ax.e2[2]], tb = RTv3(S[0].Rm, tw), ts = RTv3(S[1].Rm, tw);
      for (let k = 0; k < 3; k++) { S[0].Fo[3 + k] += tb[k]; S[1].Fo[3 + k] -= ts[k]; }
      for (const s of S) kirchhoff(s.z, s.nu, s.Fo, s.r);
      // the constraint's force at the middle: J M^-1 (P0 + h/2 (r + J^T lam)) = 0 for the five rows
      const K = jointK(ax.rows, S[0].M, S[1].M, Lw);
      const wb = solve6(S[0].M, S[0].P0.map((p, k) => p + 0.5 * h * S[0].r[k]), [0, 0, 0, 0, 0, 0], Lw);
      const ws = solve6(S[1].M, S[1].P0.map((p, k) => p + 0.5 * h * S[1].r[k]), [0, 0, 0, 0, 0, 0], Lw);
      lam = solveN(K.map(row => row.map(v => 0.5 * h * v)), ax.rows.map(row => -(dot6(row.slice(0, 6), wb) + dot6(row.slice(6, 12), ws))));
      let dmax = 0, vmax = 0;
      for (let j = 0; j < 2; j++) {
        const s = S[j], off = 6 * j;
        for (let k = 0; k < 6; k++) { let g = 0; for (let i = 0; i < 5; i++) g += ax.rows[i][off + k] * lam[i]; s.zn[k] = s.P0[k] + 0.5 * h * (s.r[k] + g); }
        solve6(s.M, s.zn, s.nun, s.Lw);
        for (let k = 0; k < 6; k++) { const d = Math.abs(s.nun[k] - s.nu[k]); if (d > dmax) dmax = d; const a = Math.abs(s.nu[k]); if (a > vmax) vmax = a; }
      }
      if (dmax <= tol * (1 + vmax)) { for (const s of S) for (let k = 0; k < 6; k++) s.z[k] = s.zn[k]; conv = true; it++; break; }
      if (dmax >= dlast) relax *= 0.5;
      dlast = dmax;
      for (const s of S) for (let k = 0; k < 6; k++) s.z[k] += relax * (s.zn[k] - s.z[k]);
    }
    // the force across the joint, on the bow, from the pin's three rows (the world's axes): N along her (tension
    // positive: it pulls the bow aft), V across her (e3), L lateral (e2); against what still holds there
    const F = [lam[0], lam[1], lam[2]], N = -(F[0] * ax.e1[0] + F[1] * ax.e1[1] + F[2] * ax.e1[2]);
    const V = F[0] * ax.e3[0] + F[1] * ax.e3[1] + F[2] * ax.e3[2], L = F[0] * ax.e2[0] + F[1] * ax.e2[1] + F[2] * ax.e2[2];
    const hs = hingeAt(J, backbone(J)), rN = N / hs.Nt, rV = Math.abs(V) / hs.Vs;
    if (J.trace) J.trace.push([rN, rV]);
    if (rN > 1 || rV > 1) {
      // the ligament parts: this sub-step is run again with the bodies free, from where it began
      B.forEach((b, j) => restoreBody(b, save[j]));
      J.released = true;
      J.release = { t: fall.t + (sIdx + 1) * h, k: fall.k, sub: sIdx, theta: th0, s: backbone(J), N, V, L, rN, rV, by: rN > 1 ? 'tension' : 'shear', maxN: J.maxN, maxV: J.maxV, W: J.W };
      fall.events.push({ t: J.release.t, id: 'release', piece: 'joint', depth: Math.max(fall.pieces[J.ib].depth, fall.pieces[J.is].depth), energy: J.W, speed: 0, by: J.release.by, theta: th0, rN, rV });
      for (const b of B) subStep(b, sp, h);
      return;
    }
    if (rN > J.maxN) J.maxN = rN;
    if (rV > J.maxV) J.maxV = rV;
    J.force = { N, V, L, rN, rV, Mz: lam[4] };
    // the end of the sub-step, each body as subStep ends it, with the joint's force in her rate
    for (let j = 0; j < 2; j++) {
      const s = S[j], b = s.b, off = 6 * j, pw = s.pw, K = s.K;
      for (let k = 0; k < 6; k++) { let g = 0; for (let i = 0; i < 5; i++) g += ax.rows[i][off + k] * lam[i]; b.rate[k] = s.r[k] + g; }
      b.iters += it; b.subs++; if (!conv) b.unconv++;
      b.W.cons += h * pw.cons; b.W.surf += h * pw.surf; b.W.air += h * pw.air; b.W.drag += h * pw.drag; b.W.mud += h * pw.mud;
      for (let k = 0; k < 3; k++) { b.P[k] = s.P0[k] + h * b.rate[k]; b.Lm[k] = s.P0[3 + k] + h * b.rate[3 + k]; b.X[k] = s.X1[k]; }
      b.q[0] = s.q1[0]; b.q[1] = s.q1[1]; b.q[2] = s.q1[2]; b.q[3] = s.q1[3];
      if (b.air) b.air.a = s.a1;
      b.inMud = pw.inMud; b.fsub = pw.fsub; b.cap = pw.cap;
      if (pw.inMud && !b.touched) {
        b.touched = true;
        b.arrival = { speed: comSpeed(b, s.nu0), energy: 0.5 * (s.P0[0] * s.nu0[0] + s.P0[1] * s.nu0[1] + s.P0[2] * s.nu0[2] + s.P0[3] * s.nu0[3] + s.P0[4] * s.nu0[4] + s.P0[5] * s.nu0[5]), depth: bedDepth(sp, b.X[0], b.X[1]) };
      }
      const R1 = s.R1, Ve = b.air && s.a1 > 0 ? airVolume(b, sp, -(b.X[2] + R1[6] * (b.air.p[0] - b.C[0]) + R1[7] * (b.air.p[1] - b.C[1]) + R1[8] * (b.air.p[2] - b.C[2]))) : 0;
      b.Vair = Ve;
      massWithAir(b, Ve, s.M);
      solve6(s.M, [b.P[0], b.P[1], b.P[2], b.Lm[0], b.Lm[1], b.Lm[2]], b.nu, s.Lw);
      if (!K.strikeAdded && pw.inMud !== b.shed) {
        const ke = () => 0.5 * (b.P[0] * b.nu[0] + b.P[1] * b.nu[1] + b.P[2] * b.nu[2] + b.Lm[0] * b.nu[3] + b.Lm[1] * b.nu[4] + b.Lm[2] * b.nu[5]);
        const k0 = ke();
        b.shed = pw.inMud;
        massWithAir(b, Ve, s.M);
        if (b.shed) for (let r = 0; r < 3; r++) { let a = 0, t = 0; for (let k = 0; k < 6; k++) { a += s.M[r * 6 + k] * b.nu[k]; t += s.M[(3 + r) * 6 + k] * b.nu[k]; } b.P[r] = a; b.Lm[r] = t; }
        else solve6(s.M, [b.P[0], b.P[1], b.P[2], b.Lm[0], b.Lm[1], b.Lm[2]], b.nu, s.Lw);
        b.W.shed += ke() - k0;
        b.rate = [0, 0, 0, 0, 0, 0];
      }
    }
    // the hinge's work as the bodies met it: its moment (the middle's, or the start's under 'start') against the middle's opening rate,
    // times h (the integrator's own reckoning of every load's work)
    const wb = Rv3(S[0].Rm, [S[0].nu[3], S[0].nu[4], S[0].nu[5]]), ws = Rv3(S[1].Rm, [S[1].nu[3], S[1].nu[4], S[1].nu[5]]);
    J.W += h * mh * J.sense * (ax.e2[0] * (wb[0] - ws[0]) + ax.e2[1] * (wb[1] - ws[1]) + ax.e2[2] * (wb[2] - ws[2]));
    // the drift out, theta from the attitudes, the hinge's state
    jointProject(fall, J, B[0], B[1]);
    J.theta = jointTheta(J, B[0], B[1]);
    const was = J.yielded;
    commitHinge(J, mid ? J.theta : th0);             // 'mid': the step's end angle; 'start': its start's, as before
    if (J.yielded && !was) J.tYield = fall.t + (sIdx + 1) * h;
  }
  // join(fall, hinge): the two pieces of a fall (0 the bow, 1 the stern, cut at hinge.x) pinned, as begin's opts.hinge
  // does at a hand-over; for a fall made and placed by hand (the trials). They must stand as one body when it is called
  function join(fall, hg, ship) {
    const sense = hg.sense === 'sag' ? -1 : 1, x = hg.x;
    // where in its sub-step the hinge's moment is taken (B4's gate 5, Z1 with B1+B2, 2026-11-24): 'mid', the default, at
    // the middle's angle inside the sub-step's iteration, its state committed at the step's end angle: the midpoint rule
    // of the rest of the step, so the release converges (member C: +22.69 s at K.sub 8, +22.63 at 64); 'start', the
    // scheme before, to the bit: the moment frozen at the start's angle, whose explicit step pumped the joint's elastic
    // mode (about 1 s) until it crossed the yield on a peak, so the release came 8 s early at K.sub 8 and moved with it
    const at = hg.at === undefined ? 'mid' : hg.at;
    if (at !== 'mid' && at !== 'start') throw new Error('hinge.at is \'mid\' or \'start\', not ' + JSON.stringify(hg.at));
    const yieldOn = hg.yieldOn === undefined ? 'resultant' : hg.yieldOn;   // D116, join 22: the onset's own check
    if (yieldOn !== 'moment' && yieldOn !== 'circle' && yieldOn !== 'resultant') throw new Error('hinge.yieldOn is \'moment\', \'circle\' or \'resultant\', not ' + JSON.stringify(hg.yieldOn));
    const H = hg.H || sectionOf().hinge(ship, x, sense < 0 ? 'sag' : 'hog', Object.assign({}, hg.opts || {}, hg.Lh ? { Lh: hg.Lh } : {}));
    if (!H) throw new Error('no hinge at x ' + x + ' (S.hinge gave none)');
    const J = { H, xb: x, sense, at, yieldOn, ib: 0, is: 1, theta: 0, thMax: 0, thY: 0, yielded: false, M0: 0, released: false, release: null, maxN: 0, maxV: 0, W: 0, Wproj: 0, drift: 0, resid: 0, force: null, trace: hg.trace ? [] : null };
    fall.eng.joint = J;
    J.demand0 = jointDemand(fall, J);
    J.M0 = J.demand0.M0;
    if (fall.eng.bodies.some(bd => bd.spc)) tearBegin(fall, J);    // B4's gate 2: the spaces with the joint
    return J;
  }

  // ================================================================ her lights (G2 of NH15)
  // HER LIGHTS. From the hand-over the fall carries her light piece by piece (docs/DESIGN_the_living_ship_v1_2026-11-23.md,
  // G2). Past the hand-over the plant is not stepped and no boiler raises steam, so the steam that is left goes as the
  // plant's own law for broken mains lets it go (core/systems.js): her pressure falls at 1/PLANT.breakTau a second from
  // sim.plant.p at the hand-over, and a set of dynamos stops at PLANT.pDynamo, or once the sea floods it. The dynamos feed
  // only the piece they stand in. Both sets stand aft, aft of every cut the model makes: the main sets in zone
  // PLANT.rooms2.el, the emergency sets on D deck in zone PLANT.emergency.zone. So the forward piece is dark from the
  // break, its leads cut there [derived: the design's G2, every lit boiler forward of the break]. The stern burns while
  // its dynamos run down: (1 - pDynamo) breakTau, 7 s from working pressure, with the plant's bets [Beesley's "single
  // flash", the plant note]. With the joint too the leads part at the hand-over: in hogging her upper decks, where they
  // run, part first [bet].
  // Her light by section is G1's (core/readers/circuits.js), when the hand-over carries it (sim.circuits). Each section
  // rides the piece its middle lies in, and keeps its fuses as the circuits had them. In the fall a section's fuses blow,
  // for good, on the step the sea outside her reaches its switches, if they stood in the air at the hand-over and its
  // piece has current then (a fuse blows only with current in it). Switches that stood under the sea at the hand-over
  // and held go on holding: the fall knows no space's own water [stand-in: a dry space under the sea keeps its lamps
  // while the dynamos run down]. The dynamos flood by the same rule, at the points the plant's wet() takes (their flat;
  // the emergency sets' D deck). A hand-over before the plant's own break (the onset, 6.9 deg by the head on member C)
  // begins lit; one at the flag begins as the plant left her (on the 1912 night, dark since its 20 deg rule). Nothing
  // here feeds back: the pieces' motion, the core and the plant are untouched (tools/night_after_tests.js).
  const RL = new Float64Array(9);
  function lightsBegin(fall, sim, F) {
    const P = sim.plant, Sy = P ? sysOf() : null;
    if (!P || !Sy) return;
    const PL = Sy.PLANT, ship = sim.ship, np = fall.pieces.length;
    // the piece a station lies in (the nearer end's, beyond her ends)
    const pieceAt = (x) => {
      for (let i = 0; i < np; i++) if (x >= fall.pieces[i].x0 && x <= fall.pieces[i].x1) return i;
      let best = 0, d = Infinity;
      for (let i = 0; i < np; i++) { const pc = fall.pieces[i], di = x < pc.x0 ? pc.x0 - x : x - pc.x1; if (di < d) { d = di; best = i; } }
      return best;
    };
    const mid = (z) => 0.5 * (ship.zones[z].xa + ship.zones[z].xf), xm = mid(PL.rooms2.el), xe = mid(PL.emergency.zone);
    const mainPt = [xm, 0, ship.zones[PL.rooms2.el].floor + PL.dynamoFlat], emPt = [xe, 0, C.deckZ('D', xe)];
    const e = { t0: fall.t, p0: P.p, p: P.p, tau: PL.breakTau, pDyn: PL.pDynamo, E: PL.emergency.lights, main: pieceAt(xm), em: pieceAt(xe),
      el: !!P.el, emWet: !!P.emWet, mainPt, emPt, mainAir: C.worldZ(F, mainPt[0], mainPt[1], mainPt[2]) > 0, emAir: C.worldZ(F, emPt[0], emPt[1], emPt[2]) > 0,
      sw: null, air: null, share: null, off: false };
    const L = { level: new Array(np).fill(0), lit: null, dark: new Array(np).fill(-1), sections: null };
    const S = sim.circuits, Ci = S ? circuitsOf() : null;
    if (S && Ci) {
      const G = Ci.table(ship), n = S.sections.length, blows = S.short < Infinity;
      const piece = new Array(n), out = new Array(n), sw = new Array(3 * n), air = new Array(n), share = new Array(n);
      for (let j = 0; j < n; j++) {
        const z = G.z[j] + Math.min(S.short, G.h[j]);
        piece[j] = pieceAt(G.x[j]); out[j] = S.sections[j].out; share[j] = S.sections[j].share;
        sw[3 * j] = G.x[j]; sw[3 * j + 1] = G.y[j]; sw[3 * j + 2] = z;
        air[j] = blows && C.worldZ(F, G.x[j], G.y[j], z) > 0;
      }
      L.sections = { piece, out }; L.lit = new Array(np).fill(0);
      e.sw = sw; e.air = air; e.share = share;
    }
    fall.lights = L; fall.eng.lights = e;
    lightsAt(fall);
    // a piece dark from the hand-over: since the plant's own 'dark' when she was dark before it; else cut at the break
    const before = P.lights === 0 && P.events && P.events.dark !== undefined ? P.events.dark : fall.t;
    for (let i = 0; i < np; i++) if (L.level[i] === 0) L.dark[i] = P.lights === 0 ? before : fall.t;
  }
  // her lights at the fall's clock now (begin, then each advance); nothing once every piece is dark
  function lightsAt(fall) {
    const L = fall.lights, e = fall.eng.lights;
    if (e.off) return;
    const np = fall.pieces.length, t = fall.t;
    const zOf = (i, p) => { const pc = fall.pieces[i], R = quatR(pc.q, RL); return R[6] * p[0] + R[7] * p[1] + R[8] * p[2] + pc.r[2]; };
    e.p = Math.max(0, e.p0 - (t - e.t0) / e.tau);
    if (!e.el && e.mainAir && e.p > e.pDyn && zOf(e.main, e.mainPt) < 0) e.el = true;
    if (!e.emWet && e.emAir && e.p > e.pDyn && zOf(e.em, e.emPt) < 0) e.emWet = true;
    const mainRun = !e.el && e.p > e.pDyn, emRun = !e.emWet && e.p > e.pDyn;
    let any = false;
    for (let i = 0; i < np; i++) {
      const lv = mainRun && e.main === i ? 1 : (emRun && e.em === i ? e.E : 0);
      L.level[i] = lv;
      if (lv > 0) any = true; else if (L.dark[i] < 0) L.dark[i] = t;
    }
    if (L.sections) {
      // a section's fuses blow where the sea outside reaches switches that stood in the air, while its piece has current;
      // the share of her light still held on each piece, summed in the table's order
      const S = L.sections, n = S.piece.length, held = new Array(np).fill(0), Rs = new Array(np).fill(null);
      for (let i = 0; i < np; i++) if (L.level[i] > 0) Rs[i] = quatR(fall.pieces[i].q, new Float64Array(9));
      for (let j = 0; j < n; j++) {
        const i = S.piece[j];
        if (S.out[j] < 0 && e.air[j] && Rs[i]) {
          const R = Rs[i], r = fall.pieces[i].r;
          if (R[6] * e.sw[3 * j] + R[7] * e.sw[3 * j + 1] + R[8] * e.sw[3 * j + 2] + r[2] < 0) S.out[j] = t;
        }
        if (S.out[j] < 0) held[i] += e.share[j];
      }
      for (let i = 0; i < np; i++) L.lit[i] = L.level[i] * held[i];
    }
    if (!any) e.off = true;
  }

  // ================================================================ the hand-over at the flag (H1)
  // opts: { pieces: 1 (whole) | 2 (the default: cut at X_BREAK), cut (x, m), lever: { bow, stern, whole } (m),
  //   vent: { bow, stern, whole } (m2), sea: a sea() spec (default the 1912 sea, its seed the night's), K (each body's) }
  function seedOf(sim) { return sim.night && sim.night.spec && sim.night.spec.seed !== undefined ? sim.night.spec.seed : 1912; }
  function begin(sim, opts) {
    opts = opts || {};
    if (!sim.foundered && !opts.any) throw new Error('the fall begins at the founder flag (rule H1)');
    const ship = sim.ship, GI = girderOf(), T = shipTables(ship), xs = T.e[0], xf = T.e[T.nS], XB = opts.cut === undefined ? GI.X_BREAK : opts.cut;
    const m = sim.mo;
    const at = m ? { X: m.X, Y: m.Y, psi: m.psi } : { X: 0, Y: 0, psi: 0 };
    const sp = sea(Object.assign({ seed: seedOf(sim), psi: at.psi }, opts.sea || {}));
    const cuts = opts.pieces === 1 ? [['whole', xs, xf]] : [['bow', XB, xf], ['stern', xs, XB]];
    const lev = opts.lever || {}, ven = opts.vent || {}, airs = opts.air || {};
    // the pocket's place across her: at the break's onset the air where it lay (K0.airAtBreak, D98), at the flag K0's
    // own; a K.airAt given wins
    const Kh = opts.rule === 'break' && !(opts.K && opts.K.airAt !== undefined) ? Object.assign({}, opts.K || {}, { airAt: K0.airAtBreak }) : opts.K;
    const specs = cuts.map(([id, a, b]) => piece(ship, sim, a, b, { id, kind: id, lever: lev[id] || 0, vent: ven[id], air: airs[id] === undefined ? 'sim' : airs[id], K: Kh }));
    // the core's pose and rates: her reference point G does not move across the world in the core; she heaves, pitches
    // and rolls about it. On a watch her way and her turning are core/motion.js's (u forward, v to starboard, r to
    // starboard: here -v to port, and -r about the world's Z)
    const F = C.frameOf(sim), R = [F.R00, F.R01, F.R02, F.R10, F.R11, F.R12, F.R20, F.R21, F.R22], t = [F.tx, F.ty, F.tz];
    // her turning in the world: d/dt of Ry(pitch) Rx(roll) is (roll' cos pitch, pitch', -roll' sin pitch); on a watch
    // her yaw too, about the world's Z (r turns her head to starboard: -r about Z up)
    const th = sim.pitch, wC = [sim.wph * C.cos(th), sim.wth, -sim.wph * C.sin(th)];
    const wW = [wC[0], wC[1], wC[2] - (m ? m.r : 0)];
    const g0 = sim.g0, gW = [R[0] * g0[0] + R[1] * g0[1] + R[2] * g0[2] + t[0], R[3] * g0[0] + R[4] * g0[1] + R[5] * g0[2] + t[1], R[6] * g0[0] + R[7] * g0[1] + R[8] * g0[2] + t[2]];
    // the point under the break (contract v: 2): the cut station on the girder's neutral axis, where the fall began;
    // none when she falls whole
    const breakW = opts.pieces === 1 ? null : [R[0] * XB + R[2] * GI.Z_NA + t[0], R[3] * XB + R[5] * GI.Z_NA + t[1]];
    const fall = make(sp, specs, { rule: opts.rule || 'flag', t0: opts.t0 === undefined ? sim.t : opts.t0, dt: sim.params.dt, at, breakAt: breakW });
    // Z6's spaces (K.air 'spaces', M2 4c): each piece's share of the core's spaces at the hand-over (stateOf) and its
    // openings; the spaces whose air lags the sea past their heads there give way at once (their reports follow the
    // placing, with her speed then). Their air is the pocket from the placing on: the lumped pocket and its vent go
    const SPm = fall.eng.bodies[0].K.air === 'spaces' ? spacesLib() : null;
    if (SPm) {
      const whole = SPm.spacesOf(ship, -1e9, 1e9), walls = C.BULKHEADS.map(w => ({ x: w.x, top: C.deckZ(w.top, w.x) }));
      const K1 = fall.eng.bodies[0].K, gz = K1.solids === 'items' ? solidsScale(T, K1.wood) : null;
      for (let i = 0; i < specs.length; i++) {
        const b = fall.eng.bodies[i], kd = specs[i].kind, lo = kd === 'bow' ? XB : -1e9, hi = kd === 'stern' ? XB : 1e9, ssp = SPm.spacesOf(ship, lo, hi);
        const st = SPm.stateOf(ssp, whole, sim, F);
        // K.solids 'items': each space's room and permeability, its water and its air by its zone's factor, as the slices'
        // floodable volumes and water are scaled (each space keeps its fill, and its level at her pose)
        if (gz) for (let k = 0; k < ssp.n; k++) { const g = gz[ssp.node[k] >> 2]; ssp.mu[k] *= g; ssp.V[k] *= g; st.W[k] *= g; st.a[k] *= g; }
        const sops = SPm.openingsOf(ssp, sim, lo, hi, b.K);
        b.spc = { sp: ssp, st, ops: sops, bnd: b.K.fail === 'boundaries' ? SPm.boundariesOf(ssp, walls) : null, K: b.K, t: fall.t, acc: 0, ev: [], seen: 0, V: 0,
          doors: b.K.floats === 'core' ? SPm.doorsOf(sim, ssp, sops) : null, P: { floatDepth: sim.params.floatDepth, doorFall: sim.params.doorFall, hAir: sim.params.hAir },
          weather: b.K.weather === 'core' ? SPm.weatherOf(sim, ssp, sops, b.K) : null };
        b.air = { a: 0, V0: 0, p: [b.C[0], b.C[1], b.C[2]] };
        if (b.K.torn > 0 && specs.length === 2) tornOpen(b, XB, 0.5 * b.K.torn);   // the torn length about the cut (Z6 from the onset)
        spacesFail(b, R, t, fall.t);
        spacesPocket(b, sp, R, t);
      }
    }
    for (let i = 0; i < specs.length; i++) {
      const b = fall.eng.bodies[i], c = b.C;
      const Xc = [R[0] * c[0] + R[1] * c[1] + R[2] * c[2] + t[0], R[3] * c[0] + R[4] * c[1] + R[5] * c[2] + t[1], R[6] * c[0] + R[7] * c[1] + R[8] * c[2] + t[2]];
      // the velocity of C in the world: G's heave and her pitch and roll about G (the core holds G's X and Y)
      const rx = Xc[0] - gW[0], ry = Xc[1] - gW[1], rz = Xc[2] - gW[2];
      const vW = [wC[1] * rz - wC[2] * ry, wC[2] * rx - wC[0] * rz, sim.vz + wC[0] * ry - wC[1] * rx];
      if (m) {
        // on a watch, her way at amidships, (u, -v) in this frame, and her yaw about amidships: (0, 0, -r) x arm
        const ax = Xc[0] - t[0], ay = Xc[1] - t[1];
        vW[0] += m.u + m.r * ay; vW[1] += -m.v - m.r * ax;
      }
      const vC = [R[0] * vW[0] + R[3] * vW[1] + R[6] * vW[2], R[1] * vW[0] + R[4] * vW[1] + R[7] * vW[2], R[2] * vW[0] + R[5] * vW[1] + R[8] * vW[2]];
      const om = [R[0] * wW[0] + R[3] * wW[1] + R[6] * wW[2], R[1] * wW[0] + R[4] * wW[1] + R[7] * wW[2], R[2] * wW[0] + R[5] * wW[1] + R[8] * wW[2]];
      setState(b, sp, R, Xc, vC, om);
      const p = sync(fall, i, true);
      b.state = b.top > 0 ? 'afloat' : 'falling';
      p.state = b.state;
      if (b.state !== 'afloat') { b.wentUnder = true; fall.events.push({ t: fall.t, id: 'under', piece: p.id, depth: p.depth, energy: energy(fall, i).KE, speed: p.speed }); }
    }
    if (SPm) for (let i = 0; i < specs.length; i++) { for (const e of fall.eng.bodies[i].spc.ev) e.speed = fall.pieces[i].speed; spacesReport(fall, i); }
    // her lights from the hand-over (G2): the plant's and the circuits' state there, each piece placed
    lightsBegin(fall, sim, F);
    // the joint (Z6 inside B4), only when asked: opts.hinge = { sense: 'hog' | 'sag', Lh, H (an S.hinge result at the
    // cut, else S.hinge(ship, cut, sense, { Lh })), opts (S.hinge's own: a ligament's what-if) }. The two pieces start as
    // one rigid body, so the joint holds at the hand-over; it carries what the bodies ask of it there (M0)
    if (opts.hinge && specs.length === 2) join(fall, Object.assign({}, opts.hinge, { x: XB }), ship);
    sim.fall = fall;
    return fall;
  }
  function step(sim) { if (sim.fall && !sim.fall.done) advance(sim.fall); return sim.fall; }
  // Z3: the fall as a reader of the night. Nothing before the hand-over; on the first step past it (its own step has
  // stepped the model, and sim.t is still the hand-over's), begin from the hand-over's state with t0 its time and
  // advance once, so that sim.fall.t equals sim.t from then on
  function onStep(sim) {
    if (sim.fall) { if (!sim.fall.done) advance(sim.fall); return; }
    if (!N || !N.over || !N.over(sim)) return;
    const onset = !sim.foundered, tHand = onset ? sim.onset.found.t : sim.founderT;
    if (!(sim.t > tHand)) return;
    if (!onset) begin(sim, { t0: tHand });
    else {
      // B4's gate 1 (join 20's plan): with K0.jointOnset the pieces are joined at the onset's own station, in its own
      // sense ('sagging' is sag; else hog), the hinge's length Lh 20 m [bet]; 0, until join 20, the cut fall to the bit
      const fo = sim.onset.found;
      begin(sim, { any: true, cut: fo.x, rule: 'break', t0: tHand, hinge: K0.jointOnset ? { sense: fo.sense === 'sagging' ? 'sag' : 'hog', Lh: 20 } : undefined });
    }
    advance(sim.fall);
  }
  if (N && N.reader) N.reader({ name: 'fall', state: 'fall', step: onStep });

  // ================================================================ readings for the trials and the page
  // the world place of a ship-frame point p of piece i (R(q) p + r)
  function worldOf(fall, i, p) {
    const pc = fall.pieces[i], R = quatR(pc.q, new Float64Array(9));
    return [R[0] * p[0] + R[1] * p[1] + R[2] * p[2] + pc.r[0], R[3] * p[0] + R[4] * p[1] + R[5] * p[2] + pc.r[1], R[6] * p[0] + R[7] * p[1] + R[8] * p[2] + pc.r[2]];
  }
  // where her weight in water acts along her, the middle of her plan, and the lever between them (m, + forward)
  function leverOf(b) {
    let wn = 0, wx = 0, pa = 0, px = 0;
    for (let i = 0; i < b.n; i++) { const w = b.ms[i] - b.rhoRef * (b.Venv[i] - b.Vf[i]); wn += w; wx += b.ms[i] * b.gx[i] - b.rhoRef * (b.Venv[i] - b.Vf[i]) * b.x[i]; pa += b.B[i] * b.dx[i]; px += b.B[i] * b.dx[i] * b.x[i]; }
    return { xw: wx / wn, xplan: px / pa, lever: wx / wn - px / pa, wIn: wn };
  }
  // the potential flow's loads on body b at velocities nu (her axes) and accelerations nud: Kirchhoff's terms alone
  // (F = -M_A nud - w x P_A, T = -M_A nud - w x L_A - v x P_A), for the closed-form tests
  function potentialLoads(b, nu, nud) {
    const MA = b.MA, PA = [0, 0, 0, 0, 0, 0], An = [0, 0, 0, 0, 0, 0];
    for (let r = 0; r < 6; r++) for (let k = 0; k < 6; k++) { PA[r] += MA[r * 6 + k] * nu[k]; An[r] += MA[r * 6 + k] * (nud ? nud[k] : 0); }
    const v = [nu[0], nu[1], nu[2]], w = [nu[3], nu[4], nu[5]];
    const cr = (a, c) => [a[1] * c[2] - a[2] * c[1], a[2] * c[0] - a[0] * c[2], a[0] * c[1] - a[1] * c[0]];
    const wP = cr(w, PA.slice(0, 3)), wL = cr(w, PA.slice(3)), vP = cr(v, PA.slice(0, 3));
    return { F: [-An[0] - wP[0], -An[1] - wP[1], -An[2] - wP[2]], T: [-An[3] - wL[0] - vP[0], -An[4] - wL[1] - vP[1], -An[5] - wL[2] - vP[2]] };
  }
  // the mass, centre (ship frame) and inertia about that centre of a body (all floodable water in, no air)
  function massOf(b) {
    const m = b.mass, g = [b.mc[0] / m + b.C[0], b.mc[1] / m + b.C[1], b.mc[2] / m + b.C[2]];
    const r = [g[0] - b.C[0], g[1] - b.C[1], g[2] - b.C[2]], M = b.MRB;
    // I about G = I about C - m (|r|^2 I - r r^T)
    const I = [M[21] - m * (r[1] * r[1] + r[2] * r[2]), M[28] - m * (r[0] * r[0] + r[2] * r[2]), M[35] - m * (r[0] * r[0] + r[1] * r[1]), M[22] + m * r[0] * r[1], M[23] + m * r[0] * r[2], M[29] + m * r[1] * r[2]];
    return { m, g, I };
  }

  return {
    K0, SEA_1912, SOIL, PROFILES, P_ATM, SOLIDS_ITEMS, solidsScale, caRect, lamb, rhoEOS, mackenzie,
    sea, rhoAt, phiAt, pAt, tempAt, bedDepth, earthOf,
    shipTables, waterBySlice, piece, body, make, place, advance, begin, step, sync, join, hingeLaw, tearAt,
    worldOf, leverOf, potentialLoads, massOf, energy, airVolume, weightInWater, extent, poseR, quatR, quatOfR, loads, yieldShare: shearShare,
  };
});
