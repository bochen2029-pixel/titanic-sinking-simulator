/*
 * Her strength along her length (stage B1 of docs/DESIGN_the_break_and_two_bodies_v1_2026-11-19.md, section 4.2): the
 * hull's cross-section at a station as longitudinal elements, each with an area, a height and a load-shortening curve,
 * and Smith's progressive-collapse method on it. Impose a curvature, find the neutral axis where the section's net force
 * is nothing, sum the moments: the moment against curvature rises, peaks at the ultimate moment Mu and falls. The falling
 * branch is kept (stage B4's hinge carries it). With the shear the side shell can carry, Vu, that is what the hull could
 * bear at that station; core/readers/girder.js gives what it is asked to bear, and core/readers/onset.js compares the two.
 *
 *   elements(ship, x, opts)        the section at x: [{ name, kind, z, A, t, sT, sC, tLaw, cLaw, ... }], from the ship's own
 *                                  form (core/core.js: halfBreadth, deckZ, inWell) and the scantlings below
 *   elastic(els)                   area, neutral axis, moment of inertia, moduli at the strength deck and the keel
 *   collapse(els, sense, opts)     Smith's curve in 'hog' or 'sag': { k, M, zNA, Mu, kU, zU, iU, first, order }
 *   shear(els)                     Vu: the side shell's area in shear times what its seams carry
 *   at(ship, x, opts)              all of it at one station, cached: { x, el, hog, sag, Vu, where }
 *   along(ship, xs, opts)          at many stations: { x, hog, sag, Vu } as Float64Arrays
 *   curve(ship, x, sense, opts)    the whole moment-curvature curve to opts.kMax yield curvatures (default 6), cached
 *   hinge(ship, x, sense, opts)    stage B4's law from the falling branch: against the angle between the parts, the
 *                                  joint's moment and its slope, the share torn, the work, the hinge's height, the
 *                                  ligament's tension and shear capacity, and the tear's opening in each space; cached
 *
 * It reads the ship's form and nothing of a sim's state: strength belongs to the ship, not to the night. It writes into
 * nothing; its caches are keyed by the ship (a WeakMap) and the options, outside any sim. It is pure: the same ship and
 * options give the same bits. Deterministic: fixed-order sums, a bracketed root-find with a fixed number of iterations.
 *
 * Signs: z up from the keel (the ship frame); strain positive in tension; a hogging curvature puts the top in tension;
 * the moment hogging positive (as the gauge's), so a sagging section's Mu is reported as a positive magnitude.
 *
 * Numbers carry their source as core/readers/girder.js tags them: [read] in a source the repository's notes read;
 * [search summary] only in a digest; [derived] arithmetic on those, shown; [bet] no source, this lane's judgement;
 * [fitted] set to reproduce a reference. The notes: docs/research/RESEARCH_breakup_hull_girder_v1_2026-11-17.md ("the
 * girder note"; its section 3 is the structure), docs/research/RESEARCH_hull_strength_along_length_v1_2026-11-17.md ("the
 * strength note"; its section 4 is the plating and the frames), docs/research/RESEARCH_bow_crushing_head_on_v1_2026-11-17.md
 * (Paik et al. 2025, via "the bow note"), and this stage's own research, docs/research/RESEARCH_midship_scantlings_v1_2026-11-19.md
 * ("the scantlings note": Mengot's pages, Walker 1912, Halpern, the Report, Wilding, Layton, read by a research subagent
 * on 2026-11-19, web pages only).
 *
 * Decided before any result was computed, and kept whatever the result:
 *   - each element as the design prescribes it (4.2): in tension up to its riveted joint's strength, then parting; in
 *     compression up to its buckling stress between floors (or beams, or frames), then shedding load;
 *   - a plate's buckling as the girder note derives it: a wide plate between its supports, k about 1.1, with the
 *     plasticity correction of Johnson and Ostenfeld;
 *   - the strength decks B and C (Mengot); the decks below them out, "not continuously riveted" (Mengot); nothing above B;
 *   - the tank top at the Marine Forensics Panel's own 0.75 in, its section being the reference of the check.
 * Decided after the first comparison with the panel's elastic section (its neutral axis then 0.77 m high), each a source
 * replacing a bet of this lane's: no extra strake inboard of B deck's doubled edge (Mengot's words need none); the
 * girders at the panel's own 1 in, not 0.75; the margin plate the panel names. Then the one figure no source gives, C
 * deck's plating against B's, fitted to the panel's section (FIT). No choice looked at the ultimate moment, which is what
 * the elements give, fitted to nothing; it lay inside 4.0 to 5.4 GN m at every step it was computed.
 * tools/strength_tests.js prints what other choices give beside these; none of them is chosen by its result.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../core.js'));
  else root.TitanicSection = factory(root.TitanicCore);
})(typeof self !== 'undefined' ? self : this, function (C) {
  'use strict';
  const IN = 0.0254, FT = C.FT;
  const bulk = (id) => C.BULKHEADS.find(b => b.id === id).x;

  // ---------------------------------------------------------------- the steel
  const MAT = {
    E: 207e9,        // Pa: mild steel [derived in the girder note, section 3: "E 207 GPa, nu 0.3"]
    nu: 0.3,         // [the same]
    // yield of her hull plate, recovered: 262 and 280 MPa (NIST-IR 6118, Table 1) [read in the girder note, section 3];
    // the lower is taken (the 1996 plate's 38 ksi) [bet: which specimen ran along her is not stated]; 280 is a what-if
    sY: 262e6,
    // the base yield Paik et al. state their joints' equivalent efficiencies against, so that 0.626 x 245 = 153.4 MPa
    // [read in the bow note, via the girder note, section 3]
    base: 245e6,
  };

  // ---------------------------------------------------------------- her riveted joints, in tension (and shear)
  // A joint's strength as a stress on the plate's gross area, as an efficiency on MAT.base. A strake carries the hull's
  // tension across its butts (the seams between strakes carry only shear), so the butts' riveting is what counts.
  // The scantlings note (docs/research/RESEARCH_midship_scantlings_v1_2026-11-19.md; its tags are kept): bottom butts
  // lapped and quadruple-riveted, bottom seams double-riveted laps, topside
  // seams treble or quadruple, topside and doubling butts double-strapped (The Shipbuilder, 1911) [search summary]; the
  // tank top's butts triple-riveted (the panel) [search summary]; the sheer strake's butts with triple plates, heavily
  // riveted (the panel) [search summary]
  const JOINT = {
    // a quadruple-riveted 1.00 in side-shell joint: 0.626 x 245 = 153.4 MPa (Paik et al. 2025, Table 4) [read in the bow
    // note]: taken for every quadruple-riveted or double-strapped butt of 1 in plate (the bottom's, the side's, the
    // sheer strake's, the strength decks', the keel's and the girders') [bet: the one such joint the notes give]
    quad: 0.626,
    // a triple-riveted joint: 42 % on the gross area (the panel's efficiencies: 28 % double, 42 % triple) [search summary,
    // the scantlings note, 6], as a stress on her plate's yield: 0.42 x 262 = 110 MPa, on Paik's base 0.449 [derived]
    triple: 0.42 * 262 / 245,
    // a double-riveted joint: 28 % (the panel) [search summary]: 0.28 x 262 = 73 MPa, on Paik's base 0.299 [derived]
    double: 0.28 * 262 / 245,
  };

  // ---------------------------------------------------------------- her frames and plating along her length
  // Frames: 36 in amidships, the widest anywhere in her (Chirnside); 24 in at the very bow, 27 in at the stern (Mengot)
  // [read in the strength note, section 4]. Where the spacing changes: NOT FOUND. Taken 36 in over x -60 to +60 and
  // closing in a straight line to 24 in at the stem and 27 in at the stern [bet].
  function frameAt(x) {
    const s0 = 36 * IN;
    if (x > 60) return s0 + (24 * IN - s0) * Math.min(1, (x - 60) / (129.54 - 60));
    if (x < -60) return s0 + (27 * IN - s0) * Math.min(1, (-60 - x) / (129.54 - 60));
    return s0;
  }
  // Shell plating: 1 in amidships (Wilding: 20/20ths) [read in the strength note, section 4]; the sides taper "fore and
  // aft of the funnels" to 0.7 and 0.6 in (Mengot) [read there]; in the forward body 0.84 to 0.90 in toward boiler room 6,
  // 0.70 to 0.84 over the holds, 0.60 to 0.70 near the stem (Paik et al., Fig. 51) [read in the bow note]. As a line
  // through those: 1.00 in to x +45, 0.87 at +62 (boiler room 6), 0.77 at +93 (the holds), 0.65 at +122 and on to the
  // stem [derived]; the after body the same, mirrored about amidships [bet: no figures aft].
  const SIDE_T = [[0, 1.00], [45, 1.00], [62, 0.87], [93, 0.77], [122, 0.65], [140, 0.65]];
  // the bottom: 14/20 to 21/20 in in the forward body (Paik et al., Fig. 51) [read in the bow note]; 1 in amidships as the
  // shell [bet: its own figure amidships NOT FOUND], tapering as the sides to 0.70 in (14/20) at the ends [bet]
  const BOTTOM_T = [[0, 1.00], [45, 1.00], [62, 0.90], [93, 0.80], [122, 0.70], [140, 0.70]];
  const lerpT = (tab, x) => {
    const a = Math.abs(x);
    for (let i = 1; i < tab.length; i++) if (a <= tab[i][0]) { const [x0, t0] = tab[i - 1], [x1, t1] = tab[i]; return (t0 + (t1 - t0) * (a - x0) / (x1 - x0)) * IN; }
    return tab[tab.length - 1][1] * IN;
  };

  // ---------------------------------------------------------------- the scantlings, element by element
  // Every figure here is a number the checks can move; each carries its tag. t in inches unless stated.
  // Her plates were generally 6 ft wide and 30 ft long (the Titanic Historical Society) [read in the strength note, 4]: a
  // strake whose width the sources do not give is taken as one plate's, 6 ft [bet].
  const STRAKE = 72 * IN;
  const SCANT = {
    // the keel: a flat keel plate, "a single thickness of plating" 1 1/2 in (Walker 1912) [read]; the A strake over the
    // keel bar 30/20 in amidships, 24/20 at the ends (Layton) [read]; its width NOT FOUND: one strake [bet]
    keelPlate: { w: STRAKE, t: [[0, 1.50], [45, 1.50], [122, 1.20], [140, 1.20]], tag: 'flat keel plate 1 1/2 in (Walker; Layton) [read], 1.2 in at the ends (24/20, Layton) [read]; one strake wide [bet]' },
    keelBar: { w: 19.5 * IN, t: 3 * IN, tag: 'keel bar, a flat bar 19 1/2 x 3 in (Walker 1912; Mengot) [read]' },
    // the bilge strake doubled (Wilding; Walker: "doubling of the plating at the bilges") [read]; bilge plating over 1 in
    // for two-fifths of her length (Layton) [read]: over x -52 to +52 [derived: 0.4 x 850 ft, amidships]; the doubling
    // 1 in over one strake at the turn of the bilge [bet]
    bilgeDouble: { t: 1.0, w: STRAKE, x: 0.2 * 850 * FT, tag: 'the bilge strake doubled [read], over two-fifths of her length [read]; 1 in, one strake [bet]' },
    // the double bottom: 63 in deep at the centre line, 78 in in way of the reciprocating machinery (the Wreck
    // Commissioner's Report; Halpern) [read; Mengot gives 75 in]; the change begins at frame 25A (Mengot) [read in the
    // girder note, 1.3]: x -22.4 [derived there]; it runs aft to bulkhead L, the after end of the engines' room [bet]
    db: { d: 63 * IN, dDeep: 78 * IN, deepFrom: -22.4, deepTo: bulk('L'), tag: '63 in; 78 in under the reciprocating engines [read]; from frame 25A [read] to bulkhead L [bet]' },
    // the double bottom from the forepeak's bulkhead A to the after peak's bulkhead P (the core's peaks have none)
    // [read: core/core.js ZONES]; the tank top full width from the dynamo room to boiler room 6 (Mengot) [read], a
    // narrower wedge fore and aft [read]: taken full width throughout [bet]
    dbExtent: [bulk('P'), bulk('A')],
    // the tank top: 0.75 in in the panel's own model of the bottom (Mengot and Woytowich 2010) [search summary]: the panel's
    // section is the reference, so its figure is taken; "about half as thick" as the 1 in shell (Mengot) [read] and 0.60 in
    // forward (Paik et al.) [read in the bow note] are what-ifs
    tankTop: { t: 0.75, tag: 'tank top 0.75 in (the panel\'s model) [search summary]; about 0.5 in by Mengot [read], a what-if' },
    // Where two sources differ, the panel's own figure is taken, since the panel's section is the reference of the check
    // (rule set before any result). The centre keelson, watertight, 670 ft from bulkhead B to O, the double bottom's depth
    // (Halpern) [read]; four side girders a side "between keel and margin plate", as the panel counted them in its midship
    // section [search summary] (Halpern: five intercostal girders a side [read]), the outermost taken as the watertight
    // wing longitudinal 30 ft off the centre line, bulkhead D to M (Halpern) [read]; the margin plate, continuous, dropping
    // nearly vertically from the tank top's edge to the bottom shell (Halpern) [read]. Their thicknesses: 1 in, the panel's
    // model of the bottom (1 in for every plate but the tank top's 0.75) [search summary]
    centreGirder: { t: 1.0, x: [bulk('O'), bulk('B')], tag: 'centre keelson, B to O [read]; 1 in (the panel\'s model) [search summary]' },
    sideGirders: { n: 4, t: 1.0, tag: 'four side girders a side (the panel) [search summary]; 1 in (the panel\'s model) [search summary]' },
    margin: { t: 1.0, tag: 'the margin plate, continuous, nearly vertical (Halpern) [read]; 1 in (the panel\'s model) [search summary]; at the tank top\'s edge [bet]' },
    // the sheer strake doubled with 1 in plate over its top 100 in (Mengot) [read]; the shell doubled between C and B decks
    // (the Report) [read]; its extent along her NOT FOUND: the bridge deck's length less its ends, x -77.7 to +77.7 (the
    // three-fifths zone of the period rules) [bet]; the 0.9 in angle joining it to B deck's stringer (Mengot) [read]: a
    // 6 x 6 in angle [bet]
    sheerDouble: { t: 1.0, h: 100 * IN, x: 77.7, angle: (6 + 6 - 0.9) * 0.9 * IN * IN, tag: 'sheer strake doubled 1 in over its top 100 in [read]; over x -77.7 to +77.7 [bet]; its 0.9 in angle [read], 6 x 6 in [bet]' },
    // The strength decks, B and C ("B&C decks are the strength decks", Mengot) [read]. Across her (Mengot, both pages)
    // [read]: "Double 1 inch plates at the outer edge of B Deck", then it "tapers to 3/4", with a 1 in plate down each
    // side of each funnel's uptake, the plating getting thicker going outboard; C deck the same pattern, no figures given
    // [read]. As elements: the doubled edge strake 2 x 1 in, one strake wide [read; its width a bet]; 3/4 in across the
    // rest [read]; a 1 in strake each side of an uptake [read; one strake wide, bet]. Beyond x +/-77.7 the edge single
    // [bet]. C deck: B's pattern scaled by FIT.cDeck [fitted]
    strong: { edge: { w: STRAKE, t: 2.0 }, field: 0.75, uptake: { w: STRAKE, t: 1.0 }, edgeX: 77.7,
      tag: 'doubled 1 in edge strake, 3/4 in across the rest, 1 in beside the uptakes (Mengot) [read]; strake widths one plate [bet]; C deck B\'s pattern x FIT.cDeck [fitted]' },
    // The decks below C: "not continuously riveted", attached by brackets at each frame (Mengot) [read], and the panel's
    // author counts B and C as the strength decks [read]: left out of the section; their thicknesses are NOT FOUND in any
    // open source (the scantlings note). opts.lowerDecks puts D, E and F in at 1/2 in [bet], a what-if.
    lower: { D: 0.5, E: 0.5, F: 0.5, tag: 'D, E and F decks: not continuously riveted (Mengot) [read]: out; a what-if puts them in at 1/2 in [bet]' },
    // deck beams on every frame (Walker; the Report) [read]; four lines of longitudinal girders under B to E decks
    // (Walker) [read]: the plating's panels between them about a fifth of her breadth, 5.6 m [derived]
    beamSpan: 92.5 * FT / 5,
  };
  // FITTED: the one figure no source gives that sets how her steel is shared between her top and her bottom: C deck's
  // plating, which Mengot gives only as B's pattern, as a share of B's (bounds set beforehand: 0.5 to 1.5), fitted by least
  // squares to the Marine Forensics Panel's elastic midship section (neutral axis 398 in; moduli 1.86e6 in3 at B deck and
  // 2.23e6 in3 at the keel: three figures, one parameter, so two of the three remain a check). tools/strength_tests.js
  // prints the section as found (C deck as B) beside the fit, refits it and holds this figure to the refit. The ultimate
  // moment is fitted to nothing.
  const FIT = { cDeck: 0.893, tag: '[fitted: the panel\'s elastic midship section]' };
  // The openings through the strength decks, across her (m) over x0..x1 [sizes read in Mengot, "Titanic's Blueprints",
  // via the scantlings note, 4; places derived or bet as each says]. Only B and C enter the section.
  const OPENINGS = [
    // the uptakes' holes 20 x 45 ft (which way is across not stated: 20 ft across, as the funnel's 19 ft beam [bet]);
    // each funnel's uptakes merge over the bulkhead between its two boiler rooms (Halpern) [read]: E, G and J [derived]
    { name: 'first funnel\'s uptakes', x0: bulk('E') - 22.5 * FT, x1: bulk('E') + 22.5 * FT, w: 20 * FT, decks: ['B', 'C'], uptake: true, tag: '20 x 45 ft [read]; over bulkhead E [derived]' },
    { name: 'second funnel\'s uptakes', x0: bulk('G') - 22.5 * FT, x1: bulk('G') + 22.5 * FT, w: 20 * FT, decks: ['B', 'C'], uptake: true, tag: '20 x 45 ft [read]; over bulkhead G [derived]' },
    { name: 'third funnel\'s uptakes', x0: bulk('J') - 22.5 * FT, x1: bulk('J') + 22.5 * FT, w: 20 * FT, decks: ['B', 'C'], uptake: true, tag: '20 x 45 ft [read]; over bulkhead J [derived]' },
    // the reciprocating engines' opening, 42 x 38 ft at the launch, closed down to 24 x 20 ft (Mengot) [read]; centred in
    // their room, K to L [bet: the place]
    { name: 'engine room opening', x0: 0.5 * (bulk('K') + bulk('L')) - 12 * FT, x1: 0.5 * (bulk('K') + bulk('L')) + 12 * FT, w: 20 * FT, decks: ['B', 'C'], tag: '24 x 20 ft as completed [read]; centred in its room [bet]' },
    // the turbine's opening, 25 x 48 ft at the launch, closed down to 18 x 20 ft for the fourth funnel (Mengot) [read];
    // centred in its room, L to M [bet]
    { name: 'turbine room opening', x0: 0.5 * (bulk('L') + bulk('M')) - 10 * FT, x1: 0.5 * (bulk('L') + bulk('M')) + 10 * FT, w: 18 * FT, decks: ['B', 'C'], tag: '18 x 20 ft as completed [read]; centred in its room [bet]' },
    // the forward grand staircase: 16 ft wide (the 1911 brochure) [read], boat deck to E deck [read], its forward end at
    // about frame 43F and running 33 ft aft (the scantlings note) [derived]
    { name: 'forward grand staircase', x0: (425 - 330) * FT, x1: (425 - 297) * FT, w: 16 * FT, decks: ['B', 'C'], tag: '16 ft wide [read]; 297 to 330 ft from the FP [derived]' },
    // Not here: the aft grand staircase (A to C decks, between the third and fourth funnels [read]): no source places it
    // along her except "at or just aft of the point of rupture", which would put the record into the strength; the
    // expansion joints, which cut nothing at or below B deck ("no construct at all on B-deck itself", Mengot; they "go
    // down to the strong deck", Wilding) [read]; hatches, light wells and lifts, whose sizes are NOT FOUND
  ];

  // ---------------------------------------------------------------- the section at a station
  const deckZ = (name, x) => C.deckZ(name, x);
  // the strength deck: B, except in the open well decks, where the hull's top is C (core/core.js inWell) [read: the core]
  function strengthDeck(x) { return C.inWell(x) ? 'C' : 'B'; }
  function openW(deck, x) { let w = 0; for (const o of OPENINGS) if (x >= o.x0 && x <= o.x1 && o.decks.indexOf(deck) >= 0) w += o.w; return w; }
  const inSpan = (spans, x) => spans.some(s => x >= s[0] && x <= s[1]);
  // load-shortening laws, chosen per element (see stress() below):
  //   tension 'joint': elastic to sT, a plateau of slip EPS_SLIP, then to nothing over EPS_DROP (the joint parts)
  //   compression 'buckle': elastic to sC, then shedding as (eC / e)^Q_SHED; 'yield': elastic to sC, then held
  const EPS_SLIP = 5e-4;   // a rivet's slip before it shears, a fifth of a 1 in rivet's diameter over a 30 ft plate [bet]
  const EPS_DROP = 5e-4;   // the joint's load gone over as much again [bet]
  const Q_SHED = 0.5;      // a buckled wide plate's load falls as the square root of its shortening [bet]

  // a wide plate between supports s apart (along her) and b apart (across), compressed along her: its elastic buckling
  // stress k pi^2 E / (12 (1 - nu^2)) (t/s)^2 with k = (1 + (s/b)^2)^2 (about 1.1 for the bottom: the girder note, 3),
  // and the plasticity correction of Johnson and Ostenfeld above half the yield [derived: the girder note's method]
  function buckle(t, s, b, sY, opts) {
    const kb = opts && opts.buckle === 'clamped' ? 4 : 1;     // what-if: the floors holding the plate's edges from turning
    const k = kb * Math.pow(1 + (s / b) * (s / b), 2);
    const sE = k * Math.PI * Math.PI * MAT.E / (12 * (1 - MAT.nu * MAT.nu)) * (t / s) * (t / s);
    return sE <= 0.5 * sY ? sE : sY * (1 - sY / (4 * sE));
  }

  // The section at x: elements { name, kind, z, A, dz (vertical extent, for its own inertia), t, s, sT, sC, tLaw, cLaw,
  // web (true for the side shell: it carries the shear) }. Each pair of mirrored elements (port and starboard) is one
  // element of twice the area: the section is symmetric. What-ifs: opts.scale multiplies every element's strengths, in
  // tension and in compression, buckling included (the monotonicity check; a hull stronger than any load); opts.sY
  // replaces the yield; opts.eta replaces joint efficiencies ({ quad, triple, double }); opts.buckle 'clamped' holds the
  // plates' loaded edges from turning (k four times); opts.fit replaces the fitted figure ({ cDeck }); opts.tankTop its
  // thickness (in); opts.lowerDecks puts D, E and F decks in; opts.parting { slip, drop } replaces the riveted joints'
  // parting strains (EPS_SLIP, EPS_DROP, each a strain; B4's gate 4 what-if, the coordinator's word of 2026-11-23 19:11).
  // That one is set on the joints' elements (eSlip, eDrop) only when asked, so that the default's elements, and every
  // hash of them, stay as they are; the laws below read an element's own value, else the constant, in the same order.
  function elements(ship, x, opts) {
    opts = opts || {};
    const els = build(ship, x, opts), sc = opts.scale || 1;
    if (sc !== 1) for (const e of els) { e.sT *= sc; e.sC *= sc; }
    if (opts.parting) for (const e of els) if (e.tLaw === 'joint') { if (opts.parting.slip !== undefined) e.eSlip = opts.parting.slip; if (opts.parting.drop !== undefined) e.eDrop = opts.parting.drop; }
    return els;
  }
  function build(ship, x, opts) {
    const P = ship && ship.hull ? ship.hull : undefined;
    const hb = (z) => C.halfBreadth(x, z, P);
    const sY = opts.sY || MAT.sY, base = MAT.base;
    const J = Object.assign({}, JOINT, opts.eta || {});
    const F = Object.assign({}, FIT, opts.fit || {});            // the fitted figures; opts.fit for the fit itself and what-ifs
    const jT = (eta) => eta * base;
    const s = frameAt(x);
    const top = strengthDeck(x), zTop = deckZ(top, x);
    const els = [];
    const add = (e) => { if (e.A > 0) els.push(e); };
    const tSide = lerpT(SIDE_T, x), tBot = lerpT(BOTTOM_T, x), tKeel = lerpT(SCANT.keelPlate.t, x);
    // the lowest point of the section at x: the flat of her bottom where she has one, else the first height with breadth
    let z0 = 0; if (!(hb(0) > 1e-3)) { while (z0 < zTop && !(hb(z0) > 1e-3)) z0 += 0.05; }
    if (z0 >= zTop - 0.5) return els;                         // no hull here worth the name (the stem, the stern tip)
    const dbD = (x <= SCANT.db.deepFrom && x >= SCANT.db.deepTo) ? SCANT.db.dDeep : SCANT.db.d;
    // the double bottom where she has one and her bottom lies far enough under its tank top to hold it
    const inDB = x >= SCANT.dbExtent[0] && x <= SCANT.dbExtent[1] && dbD > z0 + 0.3;
    const zTT = inDB ? dbD : 0;
    const rb = (P || C.HULL).rb;                                // her bilge's radius, the ship's own form
    const zMargin = inDB ? 7 * FT : 0;                          // the double bottom up her side to 7 ft over half her length [read: the Report]
    const yFlat = hb(z0);
    const nSG = SCANT.sideGirders.n, gs = Math.max(1, yFlat / (nSG + 1));
    // the bottom: lapped butts carry load only through rivet shear (the panel's argument, via the girder note, 2 and 3)
    // [read], so the joint limits the bottom in compression as well as in tension [derived from that]
    const lapC = (sb) => Math.min(sb, jT(J.quad));
    // the flat of her bottom: the keel plate (one strake about the centre line), then the bottom shell out to the bilge;
    // plates between floors (s along her) and between the double bottom's girders (gs across)
    if (yFlat > 0.05) {
      const yK = Math.min(0.5 * SCANT.keelPlate.w, yFlat);
      add({ name: 'keel plate', kind: 'bottom', z: z0, dz: 0, A: 2 * tKeel * yK, t: tKeel, s, sT: jT(J.quad), sC: lapC(buckle(tKeel, s, inDB ? gs : SCANT.beamSpan, sY, opts)), tLaw: 'joint', cLaw: 'buckle', web: false });
      const yb = yFlat - yK, nb = Math.max(1, Math.round(yb / 2));
      for (let i = 0; i < nb && yb > 0; i++) add({ name: 'bottom shell', kind: 'bottom', z: z0, dz: 0, A: 2 * tBot * yb / nb, t: tBot, s, sT: jT(J.quad), sC: lapC(buckle(tBot, s, inDB ? gs : SCANT.beamSpan, sY, opts)), tLaw: 'joint', cLaw: 'buckle', web: false });
    }
    // the shell from the bilge up to the strength deck, by girth: strips about 0.6 m long, with C deck an edge of its own
    // and the sheer strake's doubling over its top 100 in
    const zC = deckZ('C', x), sheerX = Math.abs(x) <= SCANT.sheerDouble.x && top === 'B', zSh = zTop - SCANT.sheerDouble.h;
    const zs = [z0];
    { let z = z0, acc = 0; const dz = 0.1;
      while (z < zTop - 1e-9) {
        let zn = Math.min(zTop, z + dz); if (sheerX && z < zSh - 1e-9 && zn > zSh) zn = zSh;
        acc += C.hypot(hb(zn) - hb(z), zn - z); z = zn;
        if (acc >= 0.6 || z >= zTop - 1e-9 || (sheerX && Math.abs(z - zSh) < 1e-9)) { zs.push(z); acc = 0; }
      } }
    // the bilge strake's doubling: one strake about the middle of the bilge's turn, amidships [read: doubled; bet: where]
    const bilgeX = inDB && Math.abs(x) <= SCANT.bilgeDouble.x;
    let gBil0 = 0, gBil1 = 0;
    if (bilgeX) { let g = 0, gMid = 0; for (let z = z0; z < rb; z += 0.01) { const d = C.hypot(hb(z + 0.01) - hb(z), 0.01); if (z + 0.005 < 0.5 * rb) gMid = g + d; g += d; } gBil0 = gMid - 0.5 * SCANT.bilgeDouble.w; gBil1 = gMid + 0.5 * SCANT.bilgeDouble.w; }
    let girth = 0;
    for (let i = 1; i < zs.length; i++) {
      const za = zs[i - 1], zb = zs[i];
      if (!(zb > za + 1e-6)) continue;
      // the strip's girth length, by its 0.1 m pieces
      let L = 0; { const n = Math.max(1, Math.ceil((zb - za) / 0.1)); for (let j = 0; j < n; j++) { const a = za + (zb - za) * j / n, b = za + (zb - za) * (j + 1) / n; L += C.hypot(hb(b) - hb(a), b - a); } }
      const g0 = girth, g1 = girth + L; girth = g1;
      const zm = 0.5 * (za + zb), bilge = zm < zMargin || (zm < rb && !inDB);
      const t = bilge ? tBot : tSide;
      const td = sheerX && zm >= zSh - 1e-6 ? SCANT.sheerDouble.t * IN : 0;
      // the share of this strip under the bilge strake's doubling
      const bd = bilgeX ? Math.max(0, Math.min(g1, gBil1) - Math.max(g0, gBil0)) : 0;
      const tb = SCANT.bilgeDouble.t * IN;
      // the shell between frames (s along her) and between the decks (about a deck's height up her, 2.7 m) [derived];
      // doubled, the two plates riveted together buckle as one of their summed thickness [bet]
      const sBk = buckle(t + td, s, 2.7, sY, opts), sBkB = buckle(t + tb, s, 2.7, sY, opts);
      // below the margin, the bottom's lapped butts [read]; above it, the topside's double-strapped butts, whose plates bear
      // on each other in compression [bet]
      const sC = bilge ? lapC(bd > 0 ? sBkB : sBk) : sBk;
      add({ name: bilge ? 'bilge' : 'side shell', kind: bilge ? 'bilge' : 'side', z: zm, dz: zb - za, A: 2 * t * L, t, s, sT: jT(J.quad), sC, tLaw: 'joint', cLaw: 'buckle', web: true, wz: zb - za });
      if (bd > 0) add({ name: 'bilge strake doubling', kind: 'bilge', z: zm, dz: zb - za, A: 2 * tb * bd, t: tb, s, sT: jT(J.quad), sC: lapC(sBkB), tLaw: 'joint', cLaw: 'buckle', web: true, wz: (zb - za) * bd / L });
      if (td > 0) add({ name: 'sheer strake doubling', kind: 'sheer', z: zm, dz: zb - za, A: 2 * td * L, t: td, s, sT: jT(J.quad), sC: sBk, tLaw: 'joint', cLaw: 'buckle', web: true, wz: zb - za });
    }
    // the keel bar, a hard corner [read: its size and that it is flat]
    add({ name: 'keel bar', kind: 'keel', z: z0, dz: 0, A: SCANT.keelBar.w * SCANT.keelBar.t, t: SCANT.keelBar.t, s, sT: jT(J.quad), sC: sY, tLaw: 'joint', cLaw: 'yield', web: false });
    // the double bottom: tank top, centre keelson, side girders. A girder's web between floors (s along her, the double
    // bottom's depth up her) buckles as a plate loaded on its short edges [derived: k = (h/s + s/h)^2 on (t/h)^2]
    const web = (t, h) => { const k = Math.pow(h / s + s / h, 2), sE = k * Math.PI * Math.PI * MAT.E / (12 * (1 - MAT.nu * MAT.nu)) * (t / h) * (t / h); return sE <= 0.5 * sY ? sE : sY * (1 - sY / (4 * sE)); };
    if (inDB) {
      const yTT = hb(zTT), tTT = (opts.tankTop || SCANT.tankTop.t) * IN;     // opts.tankTop (in): a what-if
      // its butts triple-riveted (the panel) [search summary], lapped as the bottom's [bet]: the joint limits it both ways
      add({ name: 'tank top', kind: 'tanktop', z: zTT, dz: 0, A: 2 * tTT * yTT, t: tTT, s, sT: jT(J.triple), sC: Math.min(buckle(tTT, s, gs, sY, opts), jT(J.triple)), tLaw: 'joint', cLaw: 'buckle', web: false });
      const hG = zTT - z0, tCG = SCANT.centreGirder.t * IN, tSG = SCANT.sideGirders.t * IN;
      // the margin plate: from the tank top's edge (a twentieth of its half breadth in from the shell) down to where that
      // line meets the shell of the bilge [bet: where; read: that it drops nearly vertically]
      { const yM = 0.95 * yTT; let zM = z0; while (zM < zTT && hb(zM) < yM) zM += 0.01; const hM = zTT - zM, tM = SCANT.margin.t * IN;
        if (hM > 0.05) add({ name: 'margin plate', kind: 'girder', z: zM + 0.5 * hM, dz: hM, A: 2 * tM * hM, t: tM, s, sT: jT(J.quad), sC: web(tM, hM), tLaw: 'joint', cLaw: 'buckle', web: false }); }
      if (x >= SCANT.centreGirder.x[0] && x <= SCANT.centreGirder.x[1]) add({ name: 'centre keelson', kind: 'girder', z: z0 + 0.5 * hG, dz: hG, A: tCG * hG, t: tCG, s, sT: jT(J.quad), sC: web(tCG, hG), tLaw: 'joint', cLaw: 'buckle', web: false });
      // intercostal: cut at every floor and joined to it by angles; their joints double-riveted [bet]
      for (let g = 1; g <= nSG; g++) {
        const yg = g * gs; if (yg >= yFlat) break;
        add({ name: 'side girder ' + g, kind: 'girder', z: z0 + 0.5 * hG, dz: hG, A: 2 * tSG * hG, t: tSG, s, sT: jT(J.double), sC: web(tSG, hG), tLaw: 'joint', cLaw: 'buckle', web: false });
      }
    }
    // the decks: B and C, the strength decks (in the wells C is the top); with opts.lowerDecks, D, E and F as well
    const SG = SCANT.strong, camber = (2 / 3) * 3 * IN;          // a 3 in camber on all decks (Mengot) [read]: the plating's mean rise [derived]
    const decks = ['C', 'B'].concat(opts.lowerDecks ? ['F', 'E', 'D'] : []);
    for (const d of decks) {
      const zd = deckZ(d, x);
      if (zd > zTop + 1e-6 || zd < zTT + 0.5) continue;
      if (d === 'B' && top !== 'B') continue;
      const y = hb(zd); if (!(y > 0.5)) continue;
      const wOpen = openW(d, x), uptake = OPENINGS.some(o => o.uptake && x >= o.x0 && x <= o.x1 && o.decks.indexOf(d) >= 0);
      const bW = SCANT.beamSpan, bk = (t) => buckle(t, s, bW, sY, opts);
      if (d === 'B' || d === 'C') {
        // across her from the side: the edge strake (doubled amidships), then 3/4 in to the middle, with a 1 in strake each
        // side of an uptake [read: Mengot's pattern; widths one strake, bet]; C deck the same pattern x FIT.cDeck [fitted]
        const mid = Math.abs(x) <= SG.edgeX, f = d === 'C' ? F.cDeck : 1;
        const wE = Math.min(SG.edge.w, 0.5 * y), tE = (mid ? SG.edge.t : 1.0) * IN * f;
        const wU = uptake ? Math.min(2 * SG.uptake.w, Math.max(0, 2 * (y - wE) - wOpen)) : 0, tU = SG.uptake.t * IN * f;
        const wF = Math.max(0, 2 * (y - wE) - wOpen - wU), tF = SG.field * IN * f;
        add({ name: d + ' deck edge strake', kind: 'stringer', deck: d, z: zd, dz: 0, A: 2 * wE * tE, t: tE, s, sT: jT(J.quad), sC: buckle(tE, s, wE, sY, opts), tLaw: 'joint', cLaw: 'buckle', web: false });
        if (wU > 0) add({ name: d + ' deck by the uptakes', kind: 'deck', deck: d, z: zd + camber, dz: 0, A: wU * tU, t: tU, s, sT: jT(J.quad), sC: bk(tU), tLaw: 'joint', cLaw: 'buckle', web: false });
        add({ name: d + ' deck plating', kind: 'deck', deck: d, z: zd + camber, dz: 0, A: wF * tF, t: tF, s, sT: jT(J.quad), sC: bk(tF), tLaw: 'joint', cLaw: 'buckle', web: false, open: wOpen, width: 2 * y });
      } else {
        // a what-if: a lower deck plated across at 1/2 in [bet], its joints double-riveted [bet], the uptakes through it
        const t = SCANT.lower[d] * IN, w = Math.max(0, 2 * y - openW('C', x));
        add({ name: d + ' deck', kind: 'deck', deck: d, z: zd + camber, dz: 0, A: w * t, t, s, sT: jT(J.double), sC: bk(t), tLaw: 'joint', cLaw: 'buckle', web: false });
      }
    }
    // the angle joining B deck's stringer to the sheer strake: a hard corner [read: 0.9 in; bet: 6 x 6 in]
    if (sheerX) add({ name: 'sheer strake angle', kind: 'stringer', z: zTop - 0.08, dz: 0, A: 2 * SCANT.sheerDouble.angle, t: 0.9 * IN, s, sT: jT(J.quad), sC: sY, tLaw: 'joint', cLaw: 'yield', web: false });
    return els;
  }

  // ---------------------------------------------------------------- an element's stress at a strain
  function stress(e, eps) {
    const E = MAT.E;
    if (eps >= 0) {
      const eT = e.sT / E;
      if (eps <= eT) return E * eps;
      if (e.tLaw === 'yield') return e.sT;
      const sl = e.eSlip === undefined ? EPS_SLIP : e.eSlip, dr = e.eDrop === undefined ? EPS_DROP : e.eDrop;
      const e1 = eT + sl; if (eps <= e1) return e.sT;
      const e2 = e1 + dr; if (eps >= e2) return 0;
      return e.sT * (e2 - eps) / dr;
    }
    const a = -eps, eC = e.sC / E;
    if (a <= eC) return E * eps;
    if (e.cLaw === 'yield') return -e.sC;
    return -e.sC * Math.pow(eC / a, Q_SHED);
  }
  // whether an element has passed its peak at this strain (for the order in which they fail)
  function failed(e, eps) { return eps >= 0 ? eps > e.sT / MAT.E + (e.tLaw === 'yield' ? Infinity : (e.eSlip === undefined ? EPS_SLIP : e.eSlip)) : (-eps > e.sC / MAT.E && e.cLaw !== 'yield'); }

  // ---------------------------------------------------------------- the elastic section
  function elastic(els) {
    let A = 0, Az = 0;
    for (const e of els) { A += e.A; Az += e.A * e.z; }
    const zNA = A > 0 ? Az / A : 0;
    let I = 0, zMin = Infinity, zMax = -Infinity;
    for (const e of els) { const d = e.z - zNA; I += e.A * (d * d + e.dz * e.dz / 12); if (e.z - 0.5 * e.dz < zMin) zMin = e.z - 0.5 * e.dz; if (e.z + 0.5 * e.dz > zMax) zMax = e.z + 0.5 * e.dz; }
    let zDeck = zMax; for (const e of els) if (e.kind === 'deck' || e.kind === 'stringer') zDeck = Math.max(zDeck, e.z);
    return { A, zNA, I, zMin, zMax, zDeck, Zdeck: I / (zDeck - zNA), Zkeel: I / (zNA - zMin) };
  }

  // ---------------------------------------------------------------- Smith's method
  // the net force on the section for curvature k (1/m, hogging positive) about a neutral axis at height zn
  function netForce(els, k, zn) { let F = 0; for (let i = 0; i < els.length; i++) { const e = els[i]; F += e.A * stress(e, k * (e.z - zn)); } return F; }
  function momentOf(els, k, zn) { let M = 0; for (let i = 0; i < els.length; i++) { const e = els[i]; M += e.A * stress(e, k * (e.z - zn)) * (e.z - zn); } return M; }
  // the neutral axis for curvature k, near z0: the nearest root of the net force from z0 in the direction its sign
  // points, bracketed and refined (the Illinois form of false position, then bisection to the last bit that matters)
  function findNA(els, k, z0, lo, hi) {
    const f = (z) => netForce(els, k, z);
    const f0 = f(z0);
    if (f0 === 0) return z0;
    // F falls with zn in hogging (k > 0) and rises in sagging: step the way that brings it toward nothing
    const dir = (f0 > 0) === (k > 0) ? 1 : -1;
    let a = z0, fa = f0, step = 0.02, b = z0, fb = f0;
    for (let it = 0; it < 60; it++) {
      b = a + dir * step;
      if (b > hi) b = hi; if (b < lo) b = lo;
      fb = f(b);
      if (fb === 0) return b;
      if ((fb > 0) !== (fa > 0)) break;
      if (b === hi || b === lo) return b;          // no root inside: the section has nothing left in one sense
      a = b; fa = fb; step *= 1.6;
    }
    if ((fb > 0) === (fa > 0)) return b;
    // Illinois false position, then bisection
    let side = 0;
    for (let it = 0; it < 60; it++) {
      const c = (a * fb - b * fa) / (fb - fa), fc = f(c);
      if (fc === 0 || Math.abs(b - a) < 1e-7) return c;
      if ((fc > 0) === (fb > 0)) { b = c; fb = fc; if (side === -1) fa *= 0.5; side = -1; }
      else { a = c; fa = fc; if (side === 1) fb *= 0.5; side = 1; }
    }
    return 0.5 * (a + b);
  }
  // Smith's curve. sense 'hog' or 'sag'; opts: { kMax: in yield curvatures (default 6), steps (default 120), stopAfter:
  // stop once the moment has fallen to this share of its peak after the peak (default: run to kMax), refine (default 8:
  // sub-steps between the two coarse steps either side of the peak) }
  function collapse(els, sense, opts) {
    opts = opts || {};
    const sg = sense === 'sag' ? -1 : 1, el = elastic(els);
    if (!(el.A > 0)) return null;
    const lo = el.zMin - 0.01, hi = el.zMax + 0.01;
    const ky = MAT.sY / (MAT.E * Math.max(el.zMax - el.zNA, el.zNA - el.zMin));
    const kMax = (opts.kMax || 6) * ky, n = opts.steps || 120;
    const K = [0], Mx = [0], Z = [el.zNA];
    let z = el.zNA, peak = 0, ip = 0;
    for (let i = 1; i <= n; i++) {
      const k = sg * kMax * i / n;
      z = findNA(els, k, z, lo, hi);
      const M = sg * momentOf(els, k, z);         // a magnitude in the sense asked
      K.push(Math.abs(k)); Mx.push(M); Z.push(z);
      if (M > peak) { peak = M; ip = i; }
      if (opts.stopAfter && ip > 0 && i > ip + 2 && M < opts.stopAfter * peak) break;
    }
    // refine about the peak: between the coarse steps either side of it, on its own continuation
    let Mu = peak, kU = K[ip], zU = Z[ip];
    const r = opts.refine === undefined ? 8 : opts.refine;
    if (r > 0 && ip > 0 && ip < K.length - 1) {
      let zr = Z[ip - 1];
      for (let j = 1; j < 2 * r; j++) {
        const k = K[ip - 1] + (K[ip + 1] - K[ip - 1]) * j / (2 * r);
        zr = findNA(els, sg * k, zr, lo, hi);
        const M = sg * momentOf(els, sg * k, zr);
        if (M > Mu) { Mu = M; kU = k; zU = zr; }
      }
    }
    // which elements have failed at the peak, and the first to fail on the way up
    let first = null;
    for (let i = 1; i < K.length && !first; i++) for (const e of els) if (failed(e, sg * K[i] * (e.z - Z[i]))) { first = { name: e.name, kind: e.kind, z: e.z, k: K[i], tension: sg * (e.z - Z[i]) > 0 }; break; }
    const gone = els.filter(e => failed(e, sg * kU * (e.z - zU))).map(e => e.name);
    return { sense: sense === 'sag' ? 'sag' : 'hog', k: Float64Array.from(K), M: Float64Array.from(Mx), zNA: Float64Array.from(Z), Mu, kU, zU, iU: ip, ky, first, gone, el };
  }

  // ---------------------------------------------------------------- the shear the side shell carries
  // Vu: every web element (the side shell and its doubling) at the least of the plate's shear yield (sY / sqrt 3), its
  // seams' (the joint's efficiency on Paik's base, in shear as in tension [bet]) and its elastic buckling between frames
  // (k_s = 5.34 + 4 (s/h)^2, h a deck's height, 2.7 m), corrected for plasticity; times its vertical extent [derived: the
  // plastic shear of the webs, as rules take it]
  // opts as elements(): scale multiplies the result (every strength), sY and eta replace the yield and the joints
  function webShear(e, opts) {                     // one web element's share of Vu, both sides (N); 0 for any other
    if (!e.web) return 0;
    opts = opts || {};
    const sY = opts.sY || MAT.sY, eta = Object.assign({}, JOINT, opts.eta || {}).quad, tY = sY / Math.sqrt(3), tJ = eta * MAT.base / Math.sqrt(3);
    const ks = 5.34 + 4 * (e.s / 2.7) * (e.s / 2.7), tE = ks * Math.PI * Math.PI * MAT.E / (12 * (1 - MAT.nu * MAT.nu)) * (e.t / e.s) * (e.t / e.s);
    const tB = tE <= 0.5 * tY ? tE : tY * (1 - tY / (4 * tE));
    return Math.min(tY, tJ, tB) * e.t * 2 * e.wz * (opts.scale || 1);
  }
  function shear(els, opts) { let V = 0; for (const e of els) V += webShear(e, opts); return V; }

  // ---------------------------------------------------------------- along her, cached by ship
  const CACHE = new WeakMap();
  const NOSHIP = {};
  function cacheFor(ship, opts) {
    const s = ship || NOSHIP;
    let m = CACHE.get(s); if (!m) { m = new Map(); CACHE.set(s, m); }
    const key = JSON.stringify(opts || {});
    let c = m.get(key); if (!c) { c = new Map(); m.set(key, c); }
    return c;
  }
  function where(x) {
    for (const b of C.BULKHEADS) if (Math.abs(x - b.x) < 0.05) return 'bulkhead ' + b.id;
    const n = C.ZONES[C.zoneAt(x)].name;
    return n.charAt(0) === 'N' ? n : n.charAt(0).toLowerCase() + n.slice(1);
  }
  function at(ship, x, opts) {
    const c = cacheFor(ship, opts), key = x.toFixed(6);
    let r = c.get(key); if (r) return r;
    const els = elements(ship, x, opts);
    if (!els.length) r = { x, where: where(x), none: true, hog: null, sag: null, Vu: 0, el: null, n: 0 };
    else {
      const o = { stopAfter: 0.8 };
      const hog = collapse(els, 'hog', o), sag = collapse(els, 'sag', o);
      r = { x, where: where(x), none: false, el: hog.el, n: els.length, Vu: shear(els, opts),
        hog: { Mu: hog.Mu, kU: hog.kU, zU: hog.zU, ky: hog.ky, first: hog.first, gone: hog.gone },
        sag: { Mu: sag.Mu, kU: sag.kU, zU: sag.zU, ky: sag.ky, first: sag.first, gone: sag.gone } };
    }
    c.set(key, r);
    return r;
  }
  function along(ship, xs, opts) {
    const n = xs.length, out = { x: Float64Array.from(xs), hog: new Float64Array(n), sag: new Float64Array(n), Vu: new Float64Array(n), at: [] };
    for (let i = 0; i < n; i++) { const r = at(ship, xs[i], opts); out.at.push(r); out.hog[i] = r.none ? 0 : r.hog.Mu; out.sag[i] = r.none ? 0 : r.sag.Mu; out.Vu[i] = r.Vu; }
    return out;
  }
  // ---------------------------------------------------------------- the hinge: stage B4's law, from B1's falling branch
  // From the onset the section at x becomes a hinge. The two parts either side of it turn about it by theta (rad),
  // positive as the side that failed opens (the deck in hogging, the bottom in sagging), about her own y axis through
  // (x, zNA). The turning is spread over a hinge length Lh, so the section's curvature is kU + theta / Lh, and the moment
  // the joint still carries is Smith's there: Mu at theta 0, then the falling branch. At each theta:
  //   M, dM    the joint's moment (N m) and its slope dM/dtheta (N m per rad; central differences on the grid; at() gives
  //            the slope of the segment theta falls in)
  //   c        the share of the section's steel torn (parted in tension): the tear's state. It reaches cTop at thetaTop,
  //            when everything on the opening side has parted; the rest, the ligament, goes only at the release, which
  //            is the free body's (c is 1 from then)
  //   cPast    the share past its peak, torn or buckled
  //   W        the work the steel has taken since the onset (J), the integral of M over theta: the tear's energy; its
  //            rate is the tear's power
  //   zNA      the height the parts turn about (m)
  //   Nt, Vs   the ligament still holding (N): the tension the elements not yet parted can carry, each at its joint's
  //            strength (a buckled plate pulled straight again carries its joint's [bet]); and the shear its webs can
  //            carry, by whichever path is the stronger: the side shell's strakes not yet parted (B2's Vu at theta 0),
  //            or, once the side is torn, the double bottom's own webs (the centre keelson, the side girders, the margin
  //            plates: each at the least of its shear yield, its joint's strength over sqrt 3 and its buckling between
  //            floors) [bet: the stronger path carries it all]. THE RELEASE RULE (the free body's, each step): the joint
  //            carries the moment min(its demand, M(theta)), and lets go at the first step where the force across it
  //            passes the ligament: its tension (along her) above Nt, or its shear above Vs.
  //   open     the tear's opening to the sea in each of the core's four spaces at x, in the core's node order: port
  //            below E deck, port above, starboard below, starboard above (m2). Each parted strip of shell opens by its
  //            length round the girth times the gap its stretching past parting leaves over the hinge, Lh (eps -
  //            eps_parted) [derived], half to each side; a strip is placed by its centre's height against E deck's.
  //            Past the curve's end the parts turn on as rigid bodies about the hinge's height, and each torn strip's
  //            gap grows by its height above it times the further angle [derived]. Decks that part open spaces to each
  //            other, not to the sea, and are not counted here.
  //   span     the tear's height range in each of those four spaces: [bottom, top] (m above the keel) over the strips
  //            of shell parted so far that open there, clipped to the space's side of E deck; null where none has. The
  //            exchange of water and air through a tear wants its top and bottom [derived].
  //   ku       the joint's slope on unloading (N m per rad): E I / Lh of what still holds, every element not yet parted,
  //            about its own centroid [bet: unloading elastic at E, a buckled plate's too, as Smith's method takes it].
  //            Past the tear's top the joint's moment is mostly the ligament bending elastically, so when its demand
  //            falls the joint springs back down this line, and on reloading goes up it to the curve again: the torn
  //            part never mends, the ligament does not stay bent. k0 (one number) is the intact section's E I / Lh,
  //            the joint's slope before it yields.
  //   zU, unload  the joint unloading: the parts turn back about zU, the centroid of what still holds (m above the
  //            keel). unload(thetaMax, theta) is the joint on its unloading line from thetaMax back to theta: the moment
  //            M(thetaMax) - ku (thetaMax - theta) (below zero, the ligament bent back the other way), and each space's
  //            opening, every torn strip's gap closing by its height above zU times the springback, none below contact
  //            [derived]; at unloading's start it is at(thetaMax). at(theta).closeRate is that closing's first rate, by
  //            space (m2 per rad of springback), over the strips not at contact.
  // Lh: the hinge's length, about the girder's depth, 20 m (BRAINSTORM v2, 5.6 item 5: "the usual rule") [bet]; its
  // what-ifs a web frame's spacing in the boiler rooms (9 ft) and a frame's (36 in): tools/strength_tests.js prints them.
  // opts as elements(), and { Lh (m), kMax (curvature's end, in yield curvatures: default 10), steps (default 400) }
  const HINGE_LH = 20;
  const HINGES = new WeakMap();
  function hinge(ship, x, sense, opts) {
    opts = opts || {};
    const s0 = ship || NOSHIP; let m = HINGES.get(s0); if (!m) { m = new Map(); HINGES.set(s0, m); }
    const key = x.toFixed(6) + '|' + sense + '|' + JSON.stringify(opts);
    if (m.has(key)) return m.get(key);
    const eo = Object.assign({}, opts); delete eo.Lh; delete eo.kMax; delete eo.steps;
    const els = elements(ship, x, eo);
    if (!els.length) { m.set(key, null); return null; }
    const Lh = opts.Lh || HINGE_LH, sg = sense === 'sag' ? -1 : 1;
    const cv = collapse(els, sense, { kMax: opts.kMax || 10, steps: opts.steps || 400 });
    // the falling branch from the peak: (kU, Mu, zU), then every step of the curve beyond it
    const K = [cv.kU], Mv = [cv.Mu], Z = [cv.zU];
    for (let i = 0; i < cv.k.length; i++) if (cv.k[i] > cv.kU * (1 + 1e-12)) { K.push(cv.k[i]); Mv.push(cv.M[i]); Z.push(cv.zNA[i]); }
    const n = K.length, A0 = els.reduce((t, e) => t + e.A, 0), zE = C.deckZ('E', x);
    const theta = new Float64Array(n), M = Float64Array.from(Mv), zNA = Float64Array.from(Z);
    const c = new Float64Array(n), cPast = new Float64Array(n), W = new Float64Array(n), Nt = new Float64Array(n), Vs = new Float64Array(n), open = new Float64Array(4 * n);
    const ku = new Float64Array(n), span = new Float64Array(8 * n).fill(NaN), k0 = MAT.E * elastic(els).I / Lh;
    const parted = new Uint8Array(els.length), past = new Uint8Array(els.length);
    const shell = (e) => e.kind === 'side' || e.kind === 'bilge' || e.kind === 'bottom' || e.kind === 'sheer';
    // the strips of shell, each one's gap at each point of the curve (m; as open sums them), and the centroid of what holds
    const sIdx = [], sOf = new Int32Array(els.length).fill(-1);
    for (let j = 0; j < els.length; j++) if (shell(els[j]) && els[j].t > 0) { sOf[j] = sIdx.length; sIdx.push(j); }
    const nS = sIdx.length, gapS = new Float64Array(nS * n), zU = new Float64Array(n);
    // a double-bottom web's shear (N): the least of shear yield, its joint's strength over sqrt 3, and its buckling as a
    // panel between floors (s along her, its own depth up her) [derived as webShear's]
    const sYh = (eo.sY || MAT.sY) * (eo.scale || 1);
    const dbShear = (e) => {
      const tY = sYh / Math.sqrt(3), tJ = e.sT / Math.sqrt(3), h = e.dz > 0 ? e.dz : 1;
      const ks = 5.34 + 4 * Math.pow(Math.min(e.s, h) / Math.max(e.s, h), 2), b = Math.min(e.s, h);
      const tE = ks * Math.PI * Math.PI * MAT.E / (12 * (1 - MAT.nu * MAT.nu)) * (e.t / b) * (e.t / b) * (eo.scale || 1);
      const tB = tE <= 0.5 * tY ? tE : tY * (1 - tY / (4 * tE));
      return Math.min(tY, tJ, tB) * e.A;
    };
    for (let i = 0; i < n; i++) {
      theta[i] = (K[i] - cv.kU) * Lh;
      let aParted = 0, aPast = 0, nt = 0, vSide = 0, vBottom = 0;
      for (let j = 0; j < els.length; j++) {
        const e = els[j], eps = sg * K[i] * (e.z - Z[i]), ePart = e.sT / MAT.E + (e.eSlip === undefined ? EPS_SLIP : e.eSlip) + (e.eDrop === undefined ? EPS_DROP : e.eDrop);
        if (e.tLaw !== 'yield' && eps >= ePart) parted[j] = 1;           // once parted, parted for good
        if (failed(e, eps)) past[j] = 1;
        if (parted[j]) {
          aParted += e.A;
          if (shell(e) && e.t > 0) {                                     // the gap it leaves, round its girth, each side
            const gap = Math.max(0, Lh * (eps - ePart)), side = e.A / (2 * e.t) * gap, layer = e.z < zE ? 0 : 1;
            open[4 * i + layer] += side; open[4 * i + 2 + layer] += side; gapS[sOf[j] * n + i] = gap;
          }
        } else { nt += e.A * e.sT; vSide += webShear(e, eo); if (e.kind === 'girder') vBottom += dbShear(e); }
        if (past[j] || parted[j]) aPast += e.A;
      }
      c[i] = aParted / A0; cPast[i] = aPast / A0; Nt[i] = nt; Vs[i] = Math.max(vSide, vBottom);
      // what still holds, for the joint's slope on unloading; and each space's tear by height, over every strip parted so far
      const hold = []; for (let j = 0; j < els.length; j++) if (!parted[j]) hold.push(els[j]);
      const eh = hold.length ? elastic(hold) : null;
      ku[i] = eh ? MAT.E * eh.I / Lh : 0; zU[i] = eh ? eh.zNA : Z[i];
      for (let j = 0; j < els.length; j++) {
        const e = els[j]; if (!parted[j] || !shell(e) || !(e.t > 0)) continue;
        const up = e.z >= zE, lo = up ? Math.max(zE, e.z - 0.5 * e.dz) : e.z - 0.5 * e.dz, hi = up ? e.z + 0.5 * e.dz : Math.min(zE, e.z + 0.5 * e.dz);
        for (const q of up ? [1, 3] : [0, 2]) { const a = 8 * i + 2 * q; if (!(span[a] <= lo)) span[a] = lo; if (!(span[a + 1] >= hi)) span[a + 1] = hi; }
      }
      if (i > 0) { W[i] = W[i - 1] + 0.5 * (M[i] + M[i - 1]) * (theta[i] - theta[i - 1]); for (let q = 0; q < 4; q++) open[4 * i + q] = Math.max(open[4 * i + q], open[4 * (i - 1) + q]); }
    }
    const dM = new Float64Array(n);
    for (let i = 0; i < n; i++) { const a = i > 0 ? i - 1 : 0, b = i < n - 1 ? i + 1 : n - 1; dM[i] = b > a ? (M[b] - M[a]) / (theta[b] - theta[a]) : 0; }
    let iTop = 0; for (let i = 1; i < n; i++) if (c[i] > c[iTop] + 1e-12) iTop = i;
    let rise = 0; for (let i = 1; i < n; i++) rise = Math.max(rise, M[i] - M[i - 1]);
    // past the curve's end: the rate at which each space's opening grows with the angle (m2 per rad), the torn strips
    // turning as rigid parts about the hinge's last height
    const openRate = [0, 0, 0, 0], zEnd = zNA[n - 1];
    for (let j = 0; j < els.length; j++) {
      const e = els[j]; if (!parted[j] || !shell(e) || !(e.t > 0)) continue;
      const arm = Math.max(0, sg * (e.z - zEnd)), side = e.A / (2 * e.t) * arm, layer = e.z < zE ? 0 : 1;
      openRate[layer] += side; openRate[2 + layer] += side;
    }
    const thEnd = theta[n - 1];
    // where theta falls on the curve: the point at or below it, the next, the share between, and the angle past the end
    const place = (th) => {
      let i = 0;
      if (th >= thEnd) i = n - 1; else if (th > 0) { let lo = 0, hi = n - 1; while (hi - lo > 1) { const md = (lo + hi) >> 1; if (theta[md] <= th) lo = md; else hi = md; } i = lo; }
      const j = Math.min(n - 1, i + 1), f = j > i ? Math.min(1, Math.max(0, (th - theta[i]) / (theta[j] - theta[i]))) : 0;
      return { i, j, f, past: th > thEnd ? th - thEnd : 0 };
    };
    // a torn strip's gap there (m), as open sums it, the parts turning as rigid bodies past the curve's end
    const gapAt = (s, p) => { const j = sIdx[s], b = s * n; return gapS[b + p.i] + (gapS[b + p.j] - gapS[b + p.i]) * p.f + (parted[j] ? Math.max(0, sg * (els[j].z - zEnd)) * p.past : 0); };
    // the tear's closing on unloading, by space (m2 per rad of springback): each torn strip not at contact, its girth
    // times its height above the centroid of what holds
    const closeAt = (p) => {
      const zp = zU[p.i] + (zU[p.j] - zU[p.i]) * p.f, out = [0, 0, 0, 0];
      for (let s = 0; s < nS; s++) {
        const e = els[sIdx[s]]; if (!(gapAt(s, p) > 0)) continue;
        const rate = e.A / (2 * e.t) * Math.max(0, sg * (e.z - zp)), layer = e.z < zE ? 0 : 1; out[layer] += rate; out[2 + layer] += rate;
      }
      return out;
    };
    const atTheta = (th) => {
      const p = place(th), i = p.i, j = p.j, f = p.f, past = p.past, L = (a) => a[i] + (a[j] - a[i]) * f;
      return { theta: th, M: L(M), dM: j > i ? (M[j] - M[i]) / (theta[j] - theta[i]) : 0, c: L(c), cPast: L(cPast), W: L(W) + M[n - 1] * past, zNA: L(zNA), Nt: L(Nt), Vs: L(Vs),
        open: [0, 1, 2, 3].map(q => open[4 * i + q] + (open[4 * j + q] - open[4 * i + q]) * f + openRate[q] * past), beyond: past > 0,
        ku: L(ku), span: [0, 1, 2, 3].map(q => { const a = 8 * i + 2 * q; return span[a] === span[a] ? [span[a], span[a + 1]] : null; }),
        zU: L(zU), closeRate: closeAt(p) };
    };
    // the joint on its unloading line, from thetaMax back to theta (see zU, unload above)
    const unload = (thMax, th) => {
      const p = place(thMax), a = atTheta(thMax), d = Math.max(0, thMax - th), op = a.open.slice();
      for (let s = 0; s < nS; s++) {
        const e = els[sIdx[s]], g = gapAt(s, p), arm = Math.max(0, sg * (e.z - a.zU)); if (!(g > 0) || !(arm > 0)) continue;
        const shut = e.A / (2 * e.t) * Math.min(g, arm * d), layer = e.z < zE ? 0 : 1;
        op[layer] -= shut; op[2 + layer] -= shut;
      }
      return { theta: thMax - d, thetaMax: thMax, M: a.M - a.ku * d, open: op.map(v => Math.max(0, v)) };
    };
    // the moment capacity under shear (B1+B2, 2026-11-24, for B4's consistency with the onset): the onset's own circle,
    // (M/Mu)^2 + (V/Vu)^2 = 1 (core/readers/onset.js), with the ligament's own Vs(s) for Vu. Vs at s = 0 is the
    // section's Vu, the onset's, so a joint that yields at Mu under(0, V) yields where the onset fired. The factor on the
    // moment capacity at the backbone's abscissa s: sqrt(1 - (V/Vs(s))^2), 0 once |V| reaches Vs(s). Nothing calls it by
    // default (the fall's hinge law takes it behind its own switch), so it moves no bit
    // (a ligament with no shear left, Vs(s) 0, holds no moment under any shear and its full moment under none: no 0/0)
    // A third argument, the joint's own moment about her z at a list (Z1's hinge.yieldOn 'resultant', D116), takes the
    // onset's biaxial check as it stands: her lateral capacity taken as her vertical, so Mz is set against Mu.
    // sqrt(1 - (V/Vs(s))^2 - (Mz/Mu)^2), 0 past it. A fourth argument, Muz, is for a lateral capacity once one is
    // computed (e124: bracketed 5.15 to 9.50 GN m at x -10.93 against Mu 4.939). With two arguments it is the shear
    // circle alone, to the bit.
    const under = (s, V, Mz, Muz) => {
      const vs = atTheta(s).Vs, u = vs > 0 ? Math.abs(V) / vs : (V ? Infinity : 0), w = Mz ? Math.abs(Mz) / (Muz || cv.Mu) : 0, q = 1 - u * u - w * w;
      return u >= 1 || !(q > 0) ? 0 : Math.sqrt(q);
    };
    const r = { x, where: where(x), sense: cv.sense, Lh, Mu: cv.Mu, kU: cv.kU, ky: cv.ky, theta, M, dM, c, cPast, W, zNA, Nt, Vs, open, openRate, k0, ku, span, zU, unload, under,
      thetaTop: theta[iTop], cTop: c[iTop], thetaEnd: thEnd, rise, monotone: rise <= 1e-6 * cv.Mu, at: atTheta, n };
    m.set(key, r);
    return r;
  }

  const CURVES = new WeakMap();
  function curve(ship, x, sense, opts) {
    const s = ship || NOSHIP; let m = CURVES.get(s); if (!m) { m = new Map(); CURVES.set(s, m); }
    const key = x.toFixed(6) + '|' + sense + '|' + JSON.stringify(opts || {});
    let r = m.get(key); if (r) return r;
    const els = elements(ship, x, opts);
    r = els.length ? collapse(els, sense, { kMax: (opts && opts.kMax) || 6, steps: (opts && opts.steps) || 180 }) : null;
    m.set(key, r);
    return r;
  }

  return { MAT, JOINT, SCANT, FIT, OPENINGS, SIDE_T, BOTTOM_T, STRAKE, EPS_SLIP, EPS_DROP, Q_SHED, HINGE_LH,
    frameAt, strengthDeck, buckle, elements, stress, failed, elastic, collapse, shear, webShear, at, along, curve, hinge, where };
});
