/*
 * Her topsides as the viewer draws them: the Boat deck and its houses, A and B decks, the wells, the forecastle and the
 * poop, the funnels, the masts and their rigging, the davits and the dome covers. Plain numbers in the ship's frame
 * with their sources, and pure builders that turn them into typed arrays (no three.js), so that
 * tools/topsides_tests.js can check them in Node; site/app.js makes the meshes. Nothing the model computes reads them.
 *
 * Source: "the note", docs/research/RESEARCH_topsides_dimensions_v1_2026-11-19.md (section numbers below are its); it
 * names, row by row, what each number was read or scaled from: the British Wreck Commissioner's report (BWC), The
 * Shipbuilder of 1911, Bob Read's articles from the H&W plans, and the Encyclopedia Titanica plans in Bo's screenshots
 * (the Boat-deck plan fitted to the ten davits, the inboard profile fitted to the fifteen bulkheads). Tags as there:
 *   [read] a source states it; [scaled] measured off a plan by script (about 0.5 m); [derived] arithmetic on those;
 *   [bet] a judgement, with its range; [appearance] drawn, not a fact of the ship (a segment count, a shade, a size).
 * Frames: SHIP, x forward of amidships, y to PORT, z up from the keel (the core's). Every part stands on the model's own
 * deck (C.deckZ(name, x)) and her deck's edge is the model's hull (C.halfBreadth, with her ends since D4: useHull,
 * G24), even where the sources differ (the
 * note, sections 4.1 and 7, lists by how much; the drawing does not correct the model). A height the sources give from
 * the keel (the funnel tops, the compass, the mast tops) is re-based: its height above the source's deck there (the
 * core's G.deck at the low point of sheer plus Read's primary sheer curve) is put on the model's deck.
 * Where this table departs from the note it says so and why (the davits' frame convention; the white sheer strake).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../core/core.js'));
  else root.TitanicTopsides = factory(root.TitanicCore);
})(typeof self !== 'undefined' ? self : this, function (C) {
  'use strict';
  const FT = C.FT, IN = 0.0254, FR = 3 * FT, DEG = Math.PI / 180, TAU = 2 * Math.PI, G = C.G;

  // =================================================================== the sources' decks, for re-basing
  // Read's primary sheer curve (C deck and every deck above): [inches from the AP, rise in inches above its lowest
  // point, 24.29 m abaft amidships] [read: Read, "Plotting Titanic's Sheer Curve", from the H&W lines plan; the note 4.1]
  const PSC = [[0, 48], [425, 40.8125], [850, 32.75], [1275, 25.6875], [1700, 19.25], [2125, 13.5625], [2550, 8.6875], [2975, 4.8125], [3400, 1.9375], [3825, 0.375], [4143.75, 0], [4250, 0.0625],
    [4675, 1.0625], [5100, 3.5], [5525, 7.4375], [5950, 12.875], [6375, 19.75], [6800, 28.8125], [7225, 38.0625], [7650, 49.3125], [8075, 62], [8500, 75.875], [8925, 91], [9350, 107.125], [9775, 124.1875], [10200, 142]];
  function srcRise(x) {                                   // m above the curve's lowest point, at x
    const X = (x - G.xAP) / IN;
    if (X <= PSC[0][0]) return PSC[0][1] * IN;
    for (let i = 0; i < PSC.length - 1; i++) { const [a, ya] = PSC[i], [b, yb] = PSC[i + 1]; if (X <= b) return (ya + (yb - ya) * (X - a) / (b - a)) * IN; }
    return PSC[PSC.length - 1][1] * IN;
  }
  // the sources' deck at x: the core's heights hold at amidships within 0.01 m (the note 4.1), the curve rising from there
  const srcDeckZ = (name, x) => G.deck[name] + srcRise(x) - srcRise(0);
  // a height above the keel from the sources, put on the model's deck at x
  const rebase = (zSrc, x, deck) => zSrc - srcDeckZ(deck || 'Boat', x) + C.deckZ(deck || 'Boat', x);

  // =================================================================== the davits: one convention with the boats
  // Read's davit frames and each davit's shift off its frame, inches (+ forward), the same both sides [read: Read, "A New
  // Understanding of the Positions of the Welin Boat Davits"; the note 3.1]. The note numbers frames from amidships with
  // no frame 0 (frame n at (n - 1/2) x 3 ft); the people reader's boat stations (core/readers/people.js, which
  // site/parts/50_boats.js draws) took that convention on 2026-11-19 (until then a frame at amidships, n x 3 ft, 0.46 m
  // farther out). Davits and boats must agree, so the davits follow the reader: FRAME0 false; true is the other
  // convention (tools/topsides_tests.js holds the davits at the reader's stations either way).
  const FRAME0 = false;
  const DAVIT_FRAMES = [[72, +(13 + 37 / 64)], [61, +(14 + 61 / 64)], [50, +(5 + 13 / 64)], [39, -(5 + 13 / 64)], [28, -(6 + 11 / 64)],
    [-35, +(6 + 11 / 64)], [-46, -(5 + 13 / 64)], [-57, -(6 + 51 / 64)], [-68, -(6 + 51 / 64)], [-79, -(13 + 37 / 64)]];
  const frameX = (n) => (FRAME0 ? n : n - Math.sign(n) * 0.5) * FR;
  const DAVIT_X = DAVIT_FRAMES.map(([f, s]) => frameX(f) + s * IN);

  // =================================================================== the numbers (the note, section 10 unless said)
  const N = {
    // ---- the Boat deck (the note 1.1): from its after edge to the navigating bridge's front, a shallow arc from +72.5 on
    // the centreline to +69.6 at the sides [scaled]; its after edge 9.8 m a side, full breadth by -73.3 [scaled]; the
    // deck's edge seen from the side (stringer, fascia) [appearance]
    boatDeck: { x0: -77.8, xFront: 72.5, xFrontSide: 69.6, hwAft: 9.8, fullFrom: -73.3, t: 0.35 },
    // its sides: open 42-in rails in way of the boats, the steel bulwark between the groups and by the cutters
    sides: [
      { x: [-77.8, -31.4], kind: 'rail' }, { x: [-31.4, 24.9], kind: 'bulwark' }, { x: [24.9, 56.6], kind: 'rail' }, { x: [56.6, 67.1], kind: 'bulwark' },
    ],
    bulwarkH: 1.22,                         // 4 ft by the cutters [read]; the same amidships [bet 1.07-1.22]
    rail: { h: 42 * IN, rows: [0.36, 0.71], every: 6 * FT },   // top rail 42 in [read]; two rails under it, a stanchion every 6 ft [bet: 3 to 5 bars]
    joints: [44.1, -25.2],                  // the expansion joints across the Boat deck [scaled]
    promLimits: [-33.2, -25.2, 44.1],       // rails across the deck from each house to her side [scaled]
    // the houses on the Boat deck (the note 1.2 and 10): sections [x0, x1, y starboard, y port] aft to forward; h above the
    // deck; the roof's colour [read: Read, colour guide: medium grey the bridge, wing cabs, officers' mess, the lifts'
    // room; dark grey the casing tops and the tank room]; win: its windows [appearance]
    houses: [
      { id: 'wheelhouse', secs: [[64.8, 67.8, -2.95, 2.95]], h: 2.4, roof: 'grey', win: 'front' },                      // [scaled]
      { id: 'officersHouse', secs: [[36.0, 64.8, -6.9, 6.9]], h: 2.4, roof: 'grey', win: 'side' },                         // [scaled]; its roof "formed a short deck"; the officers' mess roof medium grey [read: colour guide], the whole of it so [bet]
      { id: 'fwdEntrance', secs: [[26.3, 35.9, -8.6, 8.6]], h: 3.9, roof: 'white', win: 'side' },                         // [scaled]
      { id: 'funnel2House', secs: [[11.9, 26.1, -3.0, 3.05]], h: 2.7, roof: 'dark' },                                     // [scaled]
      { id: 'gymnasium', secs: [[11.9, 26.1, -8.54, -3.0]], h: 3.0, roof: 'white', win: 'gym' },                          // "eight windows of exceptional size" [read]
      { id: 'readingRoof', secs: [[5.1, 17.0, 3.1, 8.9]], h: 1.0, roof: 'white', raised: true },                          // [scaled]
      { id: 'loungeRoof', secs: [[-14.1, 5.1, -8.9, 8.9]], h: 1.0, roof: 'white', raised: true },                         // [scaled]
      { id: 'loungeBayP1', secs: [[-10.0, -6.2, 8.9, 10.0]], h: 1.0, roof: 'white', raised: true },                       // the bays [scaled]
      { id: 'loungeBayS1', secs: [[-10.0, -6.2, -10.0, -8.9]], h: 1.0, roof: 'white', raised: true },
      { id: 'loungeBayP2', secs: [[-3.6, 0.0, 8.9, 10.0]], h: 1.0, roof: 'white', raised: true },
      { id: 'loungeBayS2', secs: [[-3.6, 0.0, -10.0, -8.9]], h: 1.0, roof: 'white', raised: true },
      { id: 'funnel3Casing', secs: [[-23.0, -9.0, -3.0, 3.0]], h: 2.9, roof: 'dark' },                                    // [scaled]
      { id: 'engineCasingHouse', secs: [[-35.0, -26.6, -6.9, 6.9]], h: 2.7, roof: 'dark' },                               // the tank room to port [scaled]
      { id: 'smokeRoomRoof', secs: [[-64.3, -43.9, -8.5, 8.7]], h: 1.0, roof: 'white', raised: true },                    // [scaled]
      { id: 'funnel4Casing', secs: [[-56.0, -49.0, -3.0, 3.0]], h: 2.4, roof: 'dark' },                                   // [scaled x +/-1; y bet]
      { id: 'kennels', secs: [[-62.0, -57.0, -2.0, 2.0]], h: 2.0, roof: 'grey' },                                         // [read: that they were there; bet: the box]
      { id: 'secondEntrance', secs: [[-72.2, -65.3, -2.8, 2.8]], h: 2.3, roof: 'white', win: 'side' },                    // [scaled]
      { id: 'liftMachinery', secs: [[-71.0, -67.0, -2.0, 2.0]], h: 4.6, roof: 'grey' },                                   // [scaled]
    ],
    // the engine-casing house's skylight [read: "surmounted by a large skylight"; its size: bet]
    skylight: { x: [-33.5, -28.1], hw: 2.0, h: 0.7 },
    // fan housings and trunks at the boiler casings' ends (the note 6) [scaled: places; bet: 1.6 m boxes]
    fans: [[50.7, 2.35], [59.4, 2.35], [12.4, 2.7], [25.6, 2.7], [-22.5, 2.9], [-9.5, 2.9]],
    // the navigating bridge: open, at the deck's level; a roof over its middle on posts [scaled: +67.8 to +72.5, y bet
    // +/-4.5], 2.4 m up; its front a bulwark with windows across her [bet 1.2 m], nine windows in the middle shelter
    // [read in the note: a search summary]
    bridge: { x0: 67.8, hw: 4.5, h: 2.4, front: 1.2, windows: 9 },
    // the wing cabs: x +67.6 to +69.6, 1.6 m wide, their outer faces 0.4 m beyond the deck's edge [scaled]; 2.4 m [bet]
    cabs: { x0: 67.6, x1: 69.6, w: 1.6, out: 0.4, h: 2.4 },
    // the compass: "78ft. above the water-line" (z 34.2) and "12ft. above all ironwork" [read]; a brass platform on legs
    // from the lounge's roof, its floor 1.2 m under the compass [bet], at x +2.3 [scaled]; the platform 2.8 m square and
    // its ladders [bet: the plan's 4.2 x 4.8 m footprint with them]
    compass: { x: 2.3, z: 34.2, under: 1.2, size: 2.8 },
    // the Marconi lead-in mast on the officers' house: 10 in square, 5 ft [read]; at +45 [bet]
    leadIn: { x: 45.0, side: 0.25, h: 1.5 },

    // ---- A and B decks (the note 4.4, 4.5)
    // B deck's superstructure: the hull's side carried up to A deck, flush, with square windows [read; the pattern bet].
    // The note has its ends at +75.4 and -92.2; the model's hull steps to the wells at G.wellFwd[0] and G.wellAft[1]
    // (+76.9, -90.8: 1.5 and 1.4 m off, reported in the note 7), and the drawing keeps to the model's hull. At its after
    // end the No. 4 hatches stand in notches 2 m long, from 11.0 m out [read: the house forms their sides; bet: the size]
    bDeck: { notch: 2.0, notchHw: 11.0 },
    // A deck: from -77.8 to +72.9 [scaled], full breadth; its house (the note 4.5: 24 to 72 ft wide [read]): sections
    // aft to forward [scaled: the A-deck plan; the narrow part abreast the casings bet +/-3.7]
    aDeck: { x0: -77.8, x1: 72.9 },
    aHouse: [
      [-73.4, -64.3, 11.0],                 // the verandah cafes and palm courts, either side, 30 x 25 ft [read]
      [-64.3, -43.9, 9.6],                  // the smoke room, 63 ft wide [read]
      [-43.9, -35.0, 9.6],                  // the after entrance [bet]
      [-35.0, -14.1, 3.7],                  // abreast funnel 3's casing and the engine casing [bet]
      [-14.1, 17.0, 9.6],                   // the lounge, the reading and writing room [read: 63 ft]
      [17.0, 72.0, 9.3],                    // the forward entrance and the staterooms [scaled]
    ],
    // the promenade's steel screen "with large windows in it", 192 ft long [read]: +14.4 to +72.9 [derived]; abaft it a
    // bulwark [bet 1.07-1.22] with a teak rail, the Boat deck's edge on stanchions every 2.74 m [bet: every third frame]
    screen: { x0: 14.4, x1: 72.9 }, aBulwark: 1.15, stanchion: 2.74,
    aCranes: [[-76.0, 11.5], [-76.0, -11.5]],   // two 1.5-ton cranes at A deck's after corners [read; places bet]

    // ---- her hull's look above the water (the note 5)
    // Her topmost strake is white over a yellow sheer line [read: colour guide: "the sheer line between the hull black and
    // white"]. The note puts the black up to B deck; the photograph at the quay (Bo's 12_43_56) shows the forecastle's top
    // strake white with a row of ports in it, and the colour photograph (12_44_12) a row of round ports between the
    // yellow line and B deck's windows: so the line is drawn under her top strake, 2.1 m below B deck's sheer line [bet
    // 1.8-2.7: one strake, about 6 ft 6 in, up to the full C-to-B height], the line 0.18 m wide [bet 0.15-0.25: the note].
    strake: 2.1, sheerLine: 0.18,
    // the antifouling's edge: straight amidships, curving up from about the wells to the ends [read: the shape]; z 10.3
    // amidships rising 0.75 m at the ends [bet: the note's 0.5-1.0]
    boot: { z: 10.3, rise: 0.75, from: 75 },

    // ---- the wells, the forecastle and the poop (the note 4.2, 4.3, 4.6)
    wellBulwark: 1.15,                      // solid, above the well deck [bet 1.1-1.2]
    // hatches: x0, x1 (fore and aft), y0, y1; coamings 30 in, black outside but No. 4's white [read: sizes, colours];
    // places [bet], kept to the model's wells (No. 5 against the after well's forward end, as the note has it there)
    hatches: [
      { id: 1, x: [106.2, 109.8], y: [-2.13, 2.13], deck: 'B' },
      { id: 2, x: [84.5, 89.5], y: [-3.05, 3.05], deck: 'C' },
      { id: 3, x: [78.7, 82.4], y: [-3.05, 3.05], deck: 'C' },
      { id: '4P', x: [-90.8, -88.8], y: [11.0, 13.4], deck: 'B', white: true },
      { id: '4S', x: [-90.8, -88.8], y: [-13.4, -11.0], deck: 'B', white: true },
      { id: 5, x: [-94.55, -90.85], y: [-2.74, 2.74], deck: 'C' },
      { id: 6, x: [-103.6, -100.5], y: [-2.74, 2.74], deck: 'C' },
    ],
    coaming: 30 * IN,
    // the 2.5-ton electric cranes, white [read: Read, cranes; Shipbuilder]; places [bet], the jibs' heading [appearance]
    cranes: [
      { x: 80.0, y: 5.5, deck: 'C', aim: 0 }, { x: 80.0, y: -5.5, deck: 'C', aim: 0 },
      { x: -91.6, y: 5.5, deck: 'C', aim: Math.PI }, { x: -91.6, y: -5.5, deck: 'C', aim: Math.PI },
      { x: -105.2, y: 5.5, deck: 'C', aim: 0 }, { x: -105.2, y: -5.5, deck: 'C', aim: 0 },
    ],
    anchorCrane: { x: 125.0 },              // "at the centre-line of the forecastle deck" [read]; x [bet]
    anchorWell: { x: 128.0, l: 2.4, w: 2.0 },   // the centre anchor's well "immediately abaft the stem" [read]; size [bet]
    // capstans and windlass heads: NOT FOUND in the note; two forward, two aft, green [read: colour] [bet: places]
    capstans: [[117.0, 2.6], [117.0, -2.6], [-128.6, 4.0], [-128.6, -4.0]],
    // the breakwater, from No. 1 hatch's after corners outward and aft [read: there was one]; its height [bet 1.0-1.2]
    breakwater: { h: 1.1, back: 3.2 },
    // the docking bridge: -127.0 to -125.6, about 2.0 m over the poop deck, across her and 1.0 m beyond her sides [scaled;
    // the overhang bet], with telegraphs and a compass [read]
    dockBridge: { x0: -127.0, x1: -125.6, h: 2.0, over: 1.0 },
    stemHead: 130.6,                        // the stem's head [scaled]
    // the C-deck second-class promenade aft: "a covered-in space 84ft. long, with sliding windows" [read]; from the after
    // well forward [bet: its ends]
    cProm: { x0: -90.8, x1: -66.6 },

    // ---- the funnels (the note 2.1)
    // section 24 ft 6 in x 19 ft [read]; raked 2 in in 12 [read]; the top cut square to the axis, its forward point the
    // highest [read: Read; derived: the centre 0.61 m lower]; the black band 18 ft 6 in deep and the base flange black
    // [read]; the seat on the casing [scaled]; 40 segments round [appearance]
    funnel: { a: 24.5 * FT / 2, b: 19 * FT / 2, rake: Math.atan(2 / 12), black: 18.5 * FT, flange: 0.45, seg: 40 },
    funnels: [
      { id: 1, x: 54.9, seat: 2.35, top: 49.89, smoke: true, whistle: true },    // over bulkhead E [read]; x [scaled]
      { id: 2, x: 19.3, seat: 2.7, top: 50.34, smoke: true, whistle: true },     // over G
      { id: 3, x: -16.3, seat: 2.9, top: 50.34, smoke: true, whistle: false },   // over J; a dummy whistle [read]
      { id: 4, x: -52.3, seat: 2.4, top: 49.89, smoke: false, whistle: false },  // the turbine room's ventilator: no smoke [read]
    ],
    // the steam escape pipes on the forward face of every funnel: 17 in forward, 15 in aft [read]; their mouths 1.0 m
    // over the top's forward point [bet 0.6-1.5]; 0.15 m off the skin [bet]
    pipes: { dF: 17 * IN, dA: 15 * IN, over: 1.0, gap: 0.15 },
    shrouds: 6,                             // a side on each funnel, from the foot of the black band [read]

    // ---- the masts (the note 2.2): two points on each axis [scaled: the ET profile, x, z above the keel]; the profile's
    // decks stand low at the ends (the note 8, item 6), so each mast is lifted onto the model's deck at its foot; its top
    // is The Shipbuilder's "205ft. above the average draught line" over a 30-ft line, 71.6 [bet: the note's better
    // reading; the profile draws 69.1, a 34 ft 7 in line gives 73.0]; diameters [bet: 0.9 m at the deck, 0.6 at the
    // hounds, the teak pole 0.28]; "dark mast" [read: colour guide]
    masts: [
      { id: 'fore', foot: [95.0, 'B'], line: [[95.0, 24.74], [87.4, 69.1]], hounds: 47.5, middle: 56.4, upper: 65.2, top: 71.6 },
      { id: 'main', foot: [-87.4, 'A'], line: [[-87.4, 25.60], [-94.9, 69.1]], hounds: 47.9, middle: 55.6, upper: 65.6, top: 71.6 },   // seen from A deck up (stepped below: NOT FOUND)
    ],
    mastR: { deck: 0.45, hounds: 0.30, pole: 0.14 },
    // the crow's nest: the eye 29.0 m over her waterline at the night's drafts [read: BWC "about 95 ft. above the
    // waterline"; the note 7 says keep it]; the cage round the eye [bet: 1.5 m across, 1.2 m high, the eye 1.5 m over its
    // floor]; the profile draws it 1.6 m lower (floor z 35.2, the note 8, item 4)
    nest: { above: 29.0, r: 0.75, h: 1.2, eye: 1.5, ahead: 1.0 },
    // the foremast's derrick (for motor cars), stowed up and aft [read; scaled ends]
    derrick: { heel: [94.0, 25.1], head: [79.2, 37.1] },
  };

  // =================================================================== her stern as drawn
  // Bo, 2026-11-19: "the stern is incorrect it is circular shaped not pointed!" The model's fitted hull (C.halfBreadth,
  // which the flooding integrates) closes aft as 1 - u^3 from x -46.5 to a point at the counter's end; her deck plan
  // keeps nearly her full breadth until about 30 m from the end and then closes round. The DRAWN shell keeps the model's
  // half-breadth at and below her load waterline (z 10.5: 34 ft 6 in [read: the note 5]) and forward of x -75, and goes
  // over smoothly, with height up to C deck and aft to -95 [bet: the blend's ends], into the plan's outline, closing on
  // the counter's end as C.xAft(z) has it. The outline: half-breadth (m) at d m from the end, at the poop deck's edge
  // [scaled: Bo's deck plan 12_53_54, the outermost line found column by column (tools: px.js), 0.229 m a pixel from its
  // 123 px breadth = 92.5 ft; its tip as sqrt(d), so the edge meets the end athwartships]. Nothing in the model changes:
  // the drawn water is still clipped to the model's own hull (site/app.js hbTex), the bulkheads drawn to it; this is the
  // drawn shell's difference, as the screw's aperture is.
  // The counter's knuckle (T1, Bo 2026-11-20: "then do T1"): the model's hull steps out from her narrow run to her
  // counter between 11 and 12 m above the keel all along her after body, and its counter overhangs from 11 m at the post
  // to 15 m at her end; the ET profile draws the counter's underside from 17.1 m at the stern post to 22.2 m at her end.
  // The drawn shell follows the profile (held under the name near her end: see knuckleZ): abaft the post it is open below
  // the counter (the rudder's head shows there, as in the photographs), and forward of the post her run keeps the lines
  // of her waterline up to the knuckle, which comes
  // down to the waterline by x -112 [bet: the profile shows the knuckle abaft the post only]. This is the one place the
  // drawn shell is inside the model's hull, so the drawn water is clipped to the narrower of the two (site/app.js hbTex).
  // The flooding's hull is unchanged (backlog G2).
  const STERN = {
    plan: [[0, 0], [0.34, 2.64], [0.80, 4.24], [1.26, 5.16], [2.18, 6.65], [3.55, 7.68], [5.61, 9.05], [8.14, 9.97], [11.35, 10.89],
      [15.01, 11.57], [19.37, 12.26], [26.25, 12.95], [34.27, 13.64], [41.15, 14.10]],
    x0: -75, x1: -95, z0: 10.5,
    // the counter's underside on her centre line, height z (m) at d m abaft the stern post (the after perpendicular)
    // [scaled: Bo's inboard profile 12_53_26, x = (px - 673.09) x 0.23286, z = (407 - py) x 0.23125, the line found row by
    // row (tools: px.js); the last point closes it on the model's end, x -138.94: bet]
    post: -129.54,
    counter: [[0, 17.08], [0.89, 17.57], [2.98, 18.27], [4.61, 18.96], [6.24, 19.66], [7.40, 20.58], [8.57, 21.51], [8.91, 22.20], [9.40, 22.30]],
    kFwd: -112,                                          // where the knuckle forward of the post meets her waterline [bet]
  };
  function planStern(d) {                                // the plan's half-breadth d m from the stern's end
    const P = STERN.plan;
    if (!(d > 0)) return 0;
    if (d < P[1][0]) return P[1][1] * Math.sqrt(d / P[1][0]);
    for (let i = 1; i < P.length - 1; i++) if (d <= P[i + 1][0]) return P[i][1] + (P[i + 1][1] - P[i][1]) * (d - P[i][0]) / (P[i + 1][0] - P[i][0]);
    return P[P.length - 1][1];
  }
  const smooth01 = (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
  // The name across her counter (site/app.js) is drawn 0.25 to 2.15 m under the yellow sheer line at her end, on the
  // black under her white top strake (the strake [read]: Bo's photograph 12_43_56 shows it at her forecastle). The
  // profile draws the counter's underside up to 22.2 m at her end, above the name's foot (20.4 m): the two disagree there
  // (the profile is a modern reconstruction; the name's place rests on photographs of her ends). The drawn knuckle
  // follows the profile until it reaches the name's foot, less 0.15 m, and stays there to her end [bet, 2026-11-20].
  const NAME = { below: 0.25, depth: 2.15, clear: 0.15 };   // the name's band under the sheer line at her end (site/app.js)
  let capZ = null;
  const knuckleCap = () => (capZ === null ? (capZ = C.deckZ('B', STERN.post - STERN.counter[STERN.counter.length - 1][0]) - N.strake - NAME.depth - NAME.clear) : capZ);
  // the drawn knuckle's height at x: the profile's counter abaft the post (held under the name); forward of it, down to
  // her waterline by kFwd
  function knuckleZ(x) {
    const S = STERN, P = S.counter;
    if (x >= S.kFwd) return S.z0;
    if (x >= S.post) return S.z0 + (P[0][1] - S.z0) * smooth01((S.kFwd - x) / (S.kFwd - S.post));
    const d = S.post - x;
    let z = P[P.length - 1][1];
    for (let i = 0; i < P.length - 1; i++) if (d <= P[i + 1][0]) { z = P[i][1] + (P[i + 1][1] - P[i][1]) * (d - P[i][0]) / (P[i + 1][0] - P[i][0]); break; }
    return Math.min(z, knuckleCap());
  }
  // The model's hull the drawn shell stands on (G24, D95): since the calibration epoch's landing (D4) her hull has her
  // ends above 11.0 m as the deck plans draw them (core/core.js: buildShip's hullEnds, C3), reached only through
  // halfBreadth's third argument. The drawn shell stands on that hull, so that it is never inside it but under the
  // counter's knuckle; every edge drawn on the shell (the ports, B deck's windows, the houses' edges) follows. The page
  // gives its own ship's hull before it builds (useHull(ship.hull)); a caller that gives none has the default ship's,
  // built once (C.buildShip(): about 0.1 s; its hull is the same object as the page's)
  let HULL = null;
  const hullP = () => HULL || (HULL = C.buildShip().hull);
  function useHull(h) { if (h && h !== HULL) { HULL = h; BUILT = null; } return hullP(); }
  // the drawn shell's half-breadth at (x, z): the model's, or wider aft above her waterline and the counter's knuckle;
  // under the knuckle (T1) open abaft the post and her run's lines forward of it, the one place it is narrower
  function hullDraw(x, z) {
    const S = STERN, H = hullP();
    if (x < S.kFwd && z > S.z0 - 1e-9 && z < knuckleZ(x)) {
      if (x < S.post) return 0;                          // open under the counter: the rudder's head shows there
      return Math.min(C.halfBreadth(x, z, H), C.halfBreadth(x, S.z0, H));   // her run, its waterline's lines carried up
    }
    const hb = C.halfBreadth(x, z, H);
    if (!(hb > 0) || x >= S.x0 || z <= S.z0) return hb;
    // above the knuckle as before T1: round as the deck plan has it, coming in from her waterline to C deck [bet: the
    // blend's ends]; under the counter that leaves its underside a floor across her (its centre line the profile's)
    const wx = smooth01((S.x0 - x) / (S.x0 - S.x1)), wz = smooth01((z - S.z0) / (C.deckZ('C', x) - S.z0));
    const target = Math.min(C.halfBreadth(0, z, H), planStern(x - C.xAft(z)));   // never wider than her parallel body there
    return target > hb ? hb + wx * wz * (target - hb) : hb;
  }

  // =================================================================== helpers
  const zDeck = (name) => (x) => C.deckZ(name, x);
  const hbAt = (x, z) => hullDraw(x, z);                // every drawn edge stands on the drawn shell
  const lerp = (a, b, t) => a + (b - a) * t;
  function steps(x0, x1, step) { const n = Math.max(1, Math.ceil(Math.abs(x1 - x0) / step - 1e-9)), out = []; for (let i = 0; i <= n; i++) out.push(x0 + (x1 - x0) * i / n); return out; }
  // a packed mesh appended to a bucket (its indices moved on)
  function append(B, d) { const base = B.pos.length / 3; for (const v of d.pos) B.pos.push(v); for (const i of d.idx) B.idx.push(base + i); }
  // the Boat deck's half-breadth at x: the model's hull at that deck, narrowed to the after edge [scaled]
  function deckEdge(x) {
    const B = N.boatDeck, hb = hbAt(x, C.deckZ('Boat', x));
    if (x >= B.fullFrom) return hb;
    const full = hbAt(B.fullFrom, C.deckZ('Boat', B.fullFrom)), t = (x - B.x0) / (B.fullFrom - B.x0);
    return Math.min(hb, lerp(B.hwAft, full, Math.max(0, Math.min(1, t))));
  }
  // the bridge's front: x at y, a shallow arc [scaled ends; the arc's form: appearance]
  function frontX(y) { const B = N.boatDeck, e = deckEdge(B.xFrontSide), u = Math.min(1, Math.abs(y) / e); return B.xFront - (B.xFront - B.xFrontSide) * u * u; }
  // A deck's house: its half-breadth at x (0 outside it), never nearer her side than 1.5 m [bet]
  function aHouseHw(x) { for (const [a, b, hw] of N.aHouse) if (x >= a && x <= b) return Math.min(hw, hbAt(x, C.deckZ('A', x)) - 1.5); return 0; }

  // a growing mesh: positions in the ship's frame, triangles counter-clockwise seen from outside
  function bucket() { return { pos: [], idx: [] }; }
  function vtx(B, p) { B.pos.push(p[0], p[1], p[2]); return B.pos.length / 3 - 1; }
  function quad(B, a, b, c, d) { const i = vtx(B, a), j = vtx(B, b), k = vtx(B, c), l = vtx(B, d); B.idx.push(i, j, k, i, k, l); }
  function tri(B, a, b, c) { const i = vtx(B, a), j = vtx(B, b), k = vtx(B, c); B.idx.push(i, j, k); }
  // a grid of shared vertices (smooth shading: a funnel, a mast): rows[i][j], j round; quads (i,j)(i,j+1)(i+1,j+1)(i+1,j)
  // must be counter-clockwise from outside (the caller orders the rows so)
  function grid(B, rows, closed) {
    const n = rows[0].length, base = B.pos.length / 3;
    for (const r of rows) for (const p of r) B.pos.push(p[0], p[1], p[2]);
    const jm = closed ? n : n - 1;
    for (let i = 0; i < rows.length - 1; i++) for (let j = 0; j < jm; j++) {
      const a = base + i * n + j, b = base + i * n + (j + 1) % n, c = base + (i + 1) * n + (j + 1) % n, d = base + (i + 1) * n + j;
      B.idx.push(a, b, c, a, c, d);
    }
  }
  const seg = (L, a, b) => { L.push(a[0], a[1], a[2], b[0], b[1], b[2]); };
  function polyline(L, pts) { for (let i = 0; i < pts.length - 1; i++) seg(L, pts[i], pts[i + 1]); }

  // =================================================================== the builders
  // Each records the solids it makes (bucket, its triangles, and what "outward" means for them) for the test of normals.
  function solid(M, name, b, t0, test) { M.solids.push(Object.assign({ name, b, t0, t1: M.b[b].idx.length / 3 }, test)); }
  // Where a builder's work lies: each bucket's triangles and each line set's segments so far (mark), and what was added
  // between two marks as ranges [from, to) by bucket or set (span). The fall's copies of her (site/app.js, "the fall")
  // leave out or move what a range holds: a funnel, a mast, the crow's nest, the derrick, the aerial.
  function mark(M) { const o = { edges: M.edges.length / 6, rigging: M.rigging.length / 6 }; for (const k in M.b) o[k] = M.b[k].idx.length / 3; return o; }
  function span(a, b, out) { out = out || {}; for (const k in b) if (b[k] > a[k]) (out[k] = out[k] || []).push([a[k], b[k]]); return out; }

  // A house of sections on the Boat deck: walls, roof, and its outline for the X-ray look; z0(x), z1(x) its foot and roof.
  // Each wall and roof is recorded as a solid of its own, with the way it must face.
  function house(M, name, secs, z0, z1, wallB, roofB) {
    const W = M.b[wallB], E = M.edges, R = M.b[roofB];
    for (let s = 0; s < secs.length; s++) {
      const [x0, x1, yS, yP] = secs[s], xs = steps(x0, x1, 3);
      let t0 = W.idx.length / 3;
      for (let i = 0; i < xs.length - 1; i++) { const a = xs[i], b = xs[i + 1]; quad(W, [a, yP, z0(a)], [a, yP, z1(a)], [b, yP, z1(b)], [b, yP, z0(b)]); }   // port wall, outward +y
      solid(M, name + ' port wall', wallB, t0, { side: +1 });
      t0 = W.idx.length / 3;
      for (let i = 0; i < xs.length - 1; i++) { const a = xs[i], b = xs[i + 1]; quad(W, [a, yS, z0(a)], [b, yS, z0(b)], [b, yS, z1(b)], [a, yS, z1(a)]); }   // starboard wall, outward -y
      solid(M, name + ' starboard wall', wallB, t0, { side: -1 });
      t0 = R.idx.length / 3;
      for (let i = 0; i < xs.length - 1; i++) { const a = xs[i], b = xs[i + 1]; quad(R, [a, yS, z1(a)], [b, yS, z1(b)], [b, yP, z1(b)], [a, yP, z1(a)]); }   // roof, up
      solid(M, name + ' roof', roofB, t0, { up: true });
      for (let i = 0; i < xs.length - 1; i++) { const a = xs[i], b = xs[i + 1]; seg(E, [a, yP, z1(a)], [b, yP, z1(b)]); seg(E, [a, yS, z1(a)], [b, yS, z1(b)]); seg(E, [a, yP, z0(a)], [b, yP, z0(b)]); seg(E, [a, yS, z0(a)], [b, yS, z0(b)]); }
      // the ends: aft of the first section, forward of the last, and at a step the part of either breadth the other lacks
      const ends = [];
      if (s === 0) ends.push([x0, yS, yP, -1]);
      if (s === secs.length - 1) ends.push([x1, yS, yP, +1]);
      else {
        const [, , nS, nP] = secs[s + 1];
        for (const [lo, hi] of diff([yS, yP], [nS, nP])) ends.push([x1, lo, hi, +1]);
        for (const [lo, hi] of diff([nS, nP], [yS, yP])) ends.push([x1, lo, hi, -1]);
      }
      for (const [X, lo, hi, dir] of ends) {
        const p = [[X, lo, z0(X)], [X, hi, z0(X)], [X, hi, z1(X)], [X, lo, z1(X)]], te = W.idx.length / 3;
        if (dir > 0) quad(W, p[0], p[1], p[2], p[3]); else quad(W, p[3], p[2], p[1], p[0]);
        solid(M, name + (dir > 0 ? ' forward end' : ' after end'), wallB, te, { facing: dir });
        seg(E, p[0], p[1]); seg(E, p[3], p[2]); seg(E, p[0], p[3]); seg(E, p[1], p[2]);
      }
    }
  }
  function diff(A, B) {                                   // interval A less interval B: up to two intervals
    const out = [];
    if (B[0] > A[0]) out.push([A[0], Math.min(A[1], B[0])]);
    if (B[1] < A[1]) out.push([Math.max(A[0], B[1]), A[1]]);
    return out.filter(([a, b]) => b - a > 1e-6);
  }
  // A plate standing along her side at y = sgn * yOf(x, z), from zLo(x) to zHi(x), facing outboard (sgn +1: port); with
  // `both` its inboard face too (a bulwark seen from the deck); nz rows follow the tumblehome
  function sidePlate(M, name, bName, x0, x1, yOf, zLo, zHi, sgn, opts) {
    opts = opts || {};
    const B = M.b[bName], xs = steps(x0, x1, opts.step || 2), nz = opts.nz || 1, t0 = B.idx.length / 3;
    const P = (x, k) => { const z = lerp(zLo(x), zHi(x), k / nz); return [x, sgn * yOf(x, z), z]; };
    for (let i = 0; i < xs.length - 1; i++) for (let k = 0; k < nz; k++) {
      const a = xs[i], b = xs[i + 1];
      if (sgn > 0) quad(B, P(a, k), P(a, k + 1), P(b, k + 1), P(b, k)); else quad(B, P(a, k), P(b, k), P(b, k + 1), P(a, k + 1));
    }
    solid(M, name, bName, t0, { side: sgn });
    if (opts.both) for (let i = 0; i < xs.length - 1; i++) for (let k = 0; k < nz; k++) {
      const a = xs[i], b = xs[i + 1], q = (x, kk) => { const p = P(x, kk); return [p[0], p[1] - sgn * 0.03, p[2]]; };
      if (sgn > 0) quad(B, q(a, k), q(b, k), q(b, k + 1), q(a, k + 1)); else quad(B, q(a, k), q(a, k + 1), q(b, k + 1), q(b, k));
    }
    if (opts.edges !== false) for (let i = 0; i < xs.length - 1; i++) { seg(M.edges, P(xs[i], nz), P(xs[i + 1], nz)); if (opts.edgeLow) seg(M.edges, P(xs[i], 0), P(xs[i + 1], 0)); }
    if (opts.ends) for (const X of [x0, x1]) seg(M.edges, P(X, 0), P(X, nz));
  }
  // A plate across her at x = X, from -yOf to +yOf, zLo to zHi, facing dir (+1 forward)
  function endPlate(M, name, bName, X, hw, zLo, zHi, dir, opts) {
    opts = opts || {};
    const B = M.b[bName], n = 6, t0 = B.idx.length / 3;
    for (let i = 0; i < n; i++) {
      const a = lerp(-hw, hw, i / n), b = lerp(-hw, hw, (i + 1) / n), p = [[X, a, zLo], [X, b, zLo], [X, b, zHi], [X, a, zHi]];
      if (dir > 0) quad(B, p[0], p[1], p[2], p[3]); else quad(B, p[3], p[2], p[1], p[0]);
    }
    solid(M, name, bName, t0, { facing: dir });
    if (opts.edges !== false) { seg(M.edges, [X, -hw, zHi], [X, hw, zHi]); seg(M.edges, [X, -hw, zLo], [X, hw, zLo]); seg(M.edges, [X, -hw, zLo], [X, -hw, zHi]); seg(M.edges, [X, hw, zLo], [X, hw, zHi]); }
  }
  // A deck: its top between -hw(x) and +hw(x) at z(x), its edges t deep and its underside; front(y) (optional) the x of
  // a curved forward edge, from x1 at the sides
  function deckPlate(M, name, x0, x1, hw, z, t, opts) {
    opts = opts || {};
    const T = M.b[opts.top || 'deck'], U = M.b[opts.under || 'white'], E = M.edges, xs = steps(x0, x1, opts.step || 2), t0 = T.idx.length / 3;
    for (let i = 0; i < xs.length - 1; i++) {
      const a = xs[i], b = xs[i + 1], ha = hw(a), hb = hw(b), za = z(a), zb = z(b);
      quad(T, [a, -ha, za], [b, -hb, zb], [b, hb, zb], [a, ha, za]);
      quad(U, [a, ha, za], [a, ha, za - t], [b, hb, zb - t], [b, hb, zb]);                // its port edge, outward +y
      quad(U, [a, -ha, za - t], [a, -ha, za], [b, -hb, zb], [b, -hb, zb - t]);            // its starboard edge
      quad(U, [a, -ha, za - t], [a, ha, za - t], [b, hb, zb - t], [b, -hb, zb - t]);      // its underside, down
      seg(E, [a, ha, za], [b, hb, zb]); seg(E, [a, -ha, za], [b, -hb, zb]);
    }
    solid(M, name, opts.top || 'deck', t0, { up: true });
    const h0 = hw(x0), z0 = z(x0);
    quad(U, [x0, h0, z0], [x0, -h0, z0], [x0, -h0, z0 - t], [x0, h0, z0 - t]);            // its after edge, aft
    seg(E, [x0, -h0, z0], [x0, h0, z0]);
    const h1 = hw(x1), z1 = z(x1);
    if (!opts.front) { quad(U, [x1, -h1, z1 - t], [x1, h1, z1 - t], [x1, h1, z1], [x1, -h1, z1]); seg(E, [x1, -h1, z1], [x1, h1, z1]); return; }
    // the curved front: strips across her from x1 to front(y) (a triangle where the front meets x1, at her sides)
    const ys = steps(-h1, h1, 1.2), F = (y) => [opts.front(y), y, z(opts.front(y))], dn = (p) => [p[0], p[1], p[2] - t];
    for (let i = 0; i < ys.length - 1; i++) {
      const ya = ys[i], yb = ys[i + 1], A = F(ya), Bq = F(yb);
      quadOrTri(T, [x1, ya, z1], A, Bq, [x1, yb, z1]);
      quadOrTri(U, [x1, yb, z1 - t], dn(Bq), dn(A), [x1, ya, z1 - t]);
      quad(U, dn(A), dn(Bq), Bq, A);                                                      // its front edge, forward
      seg(E, A, Bq);
    }
  }
  // a quad, or the triangle left when one of its corners meets the next
  function quadOrTri(B, a, b, c, d) {
    const same = (p, q) => Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) + Math.abs(p[2] - q[2]) < 1e-7;
    if (same(a, b)) tri(B, a, c, d); else if (same(b, c)) tri(B, a, b, d); else if (same(c, d)) tri(B, a, b, c); else if (same(d, a)) tri(B, a, b, c); else quad(B, a, b, c, d);
  }
  // A box (a fitting) centred at (x, y) from z0 up h, l fore-and-aft by w across, turned by yaw about z; its top in topB
  function box(M, name, bName, x, y, z0, l, w, h, yaw, topB) {
    const B = M.b[bName], T = M.b[topB || bName], c = Math.cos(yaw || 0), s = Math.sin(yaw || 0);
    const P = (u, v, z) => [x + u * c - v * s, y + u * s + v * c, z], u = l / 2, v = w / 2, z1 = z0 + h, t0 = B.idx.length / 3;
    const k = [P(-u, -v, z0), P(u, -v, z0), P(u, v, z0), P(-u, v, z0), P(-u, -v, z1), P(u, -v, z1), P(u, v, z1), P(-u, v, z1)];
    quad(B, k[0], k[1], k[5], k[4]); quad(B, k[1], k[2], k[6], k[5]); quad(B, k[2], k[3], k[7], k[6]); quad(B, k[3], k[0], k[4], k[7]);
    solid(M, name, bName, t0, { inside: [x, y, z0 + h / 2] });
    const tt = T.idx.length / 3; quad(T, k[4], k[5], k[6], k[7]); solid(M, name + ' top', topB || bName, tt, { up: true });
    for (let i = 0; i < 4; i++) { seg(M.edges, k[4 + i], k[4 + (i + 1) % 4]); seg(M.edges, k[i], k[4 + i]); }
  }
  // An upright cylinder (n sides) at (x, y) from z0 to z1, radius r, with its top
  function cylinder(M, name, bName, x, y, z0, z1, r, n, topB) {
    const B = M.b[bName], t0 = B.idx.length / 3, P = (a, z) => [x + r * Math.cos(a), y + r * Math.sin(a), z];
    const rows = [[], []]; for (let i = 0; i < n; i++) { const a = i / n * TAU; rows[0].push(P(a, z0)); rows[1].push(P(a, z1)); }
    grid(B, rows, true);
    solid(M, name, bName, t0, { axis: [[x, y, z0], [x, y, z1]] });
    const T = M.b[topB || bName], tt = T.idx.length / 3;
    for (let i = 0; i < n; i++) { const a = i / n * TAU, b = (i + 1) / n * TAU; tri(T, [x, y, z1], P(a, z1), P(b, z1)); seg(M.edges, P(a, z1), P(b, z1)); }
    solid(M, name + ' top', topB || bName, tt, { up: true });
  }
  // A tube from A to Bp (n sides), radii r0 at A and r1 at Bp; its ends open (a mast, a pipe, a jib)
  function tube(M, name, bName, A, Bp, r0, r1, n) {
    const Bk = M.b[bName], d = [Bp[0] - A[0], Bp[1] - A[1], Bp[2] - A[2]], L = Math.hypot(d[0], d[1], d[2]), w = d.map(q => q / L);
    const ref = Math.abs(w[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
    let u = [w[1] * ref[2] - w[2] * ref[1], w[2] * ref[0] - w[0] * ref[2], w[0] * ref[1] - w[1] * ref[0]]; const lu = Math.hypot(u[0], u[1], u[2]); u = u.map(q => q / lu);
    const v = [w[1] * u[2] - w[2] * u[1], w[2] * u[0] - w[0] * u[2], w[0] * u[1] - w[1] * u[0]];
    const ring = (P, r) => { const out = []; for (let i = 0; i < n; i++) { const a = i / n * TAU, ca = Math.cos(a), sa = Math.sin(a); out.push([P[0] + r * (ca * u[0] + sa * v[0]), P[1] + r * (ca * u[1] + sa * v[1]), P[2] + r * (ca * u[2] + sa * v[2])]); } return out; };
    const t0 = Bk.idx.length / 3;
    grid(Bk, [ring(A, r0), ring(Bp, r1)], true);
    solid(M, name, bName, t0, { axis: [A, Bp] });
  }

  // ---- a funnel (the note 2.1): an elliptic cylinder raked aft; its sections square to the axis are the ellipse; its
  // seat level on the casing; its top square to the axis. uu: forward and up, square to the axis; y to port.
  function funnelGeom(f) {
    const F = N.funnel, r = F.rake, sr = Math.sin(r), cr = Math.cos(r), a = F.a, b = F.b;
    const zb = C.deckZ('Boat', f.x) + f.seat, zTopFwd = rebase(f.top, f.x);
    const axis = (s) => [f.x - s * sr, 0, zb + s * cr], uu = [cr, 0, sr];
    const sTop = (zTopFwd - zb - a * sr) / cr;                     // the top's forward point at zTopFwd
    const at = (s, th, k) => { const A = axis(s), c = Math.cos(th) * a * (k || 1); return [A[0] + c * uu[0], Math.sin(th) * b * (k || 1), A[2] + c * uu[2]]; };
    const sSeat = (th) => -a * Math.cos(th) * Math.tan(r);          // the seat: level, at zb
    return { f, zb, zTopFwd, sTop, sBlack: sTop - F.black, axis, at, sSeat, top: axis(sTop), uu };
  }
  function funnel(M, f) {
    const g = funnelGeom(f), n = N.funnel.seg, E = M.edges;
    // bands of shared rings, from s-functions low to high; th from forward (0) towards port: rows low to high and th
    // increasing give quads (s,th)(s,th')(s',th')(s',th) whose normal points outward
    const ring = (s, k) => { const out = []; for (let i = 0; i < n; i++) { const th = i / n * TAU; out.push(g.at(typeof s === 'function' ? s(th) : s, th, k)); } return out; };
    const band = (bName, sLo, sHi, name, k, inward) => {
      const B = M.b[bName], t0 = B.idx.length / 3, rows = [ring(sLo, k), ring(sHi, k)];
      grid(B, inward ? rows.reverse() : rows, true);
      solid(M, name, bName, t0, { funnel: f.id, axis: [g.axis(-5), g.axis(g.sTop + 5)], inward: !!inward });
    };
    band('cap', g.sSeat, (th) => g.sSeat(th) + N.funnel.flange, 'funnel ' + f.id + ' flange');
    const above = mark(M);                                          // all of it above the flange: what a falling piece leaves out
    band('buff', (th) => g.sSeat(th) + N.funnel.flange, g.sBlack, 'funnel ' + f.id);
    band('cap', g.sBlack, g.sTop, 'funnel ' + f.id + ' black');
    band('cap', g.sTop - 1.4, g.sTop, 'funnel ' + f.id + ' inside', 0.94, true);      // [appearance] the inner casing
    const Bc = M.b.cap;
    for (let i = 0; i < n; i++) {                                   // the rim, and a dark floor down the funnel [appearance]
      const t1 = i / n * TAU, t2 = (i + 1) / n * TAU;
      quad(Bc, g.at(g.sTop, t1, 0.94), g.at(g.sTop, t1, 1), g.at(g.sTop, t2, 1), g.at(g.sTop, t2, 0.94));
      tri(Bc, g.axis(g.sTop - 1.4), g.at(g.sTop - 1.4, t2, 0.94), g.at(g.sTop - 1.4, t1, 0.94));
      seg(E, g.at(g.sTop, t1), g.at(g.sTop, t2)); seg(E, g.at(g.sBlack, t1), g.at(g.sBlack, t2)); seg(E, g.at(g.sSeat(t1), t1), g.at(g.sSeat(t2), t2));
    }
    // the steam escape pipes, along the forward face, parallel to the axis; their upper metre black [appearance]
    const P = N.pipes, rF = P.dF / 2, rA = P.dA / 2, off = (s, d) => { const A = g.axis(s); return [A[0] + d * g.uu[0], 0, A[2] + d * g.uu[2]]; };
    const dA = N.funnel.a + P.gap + rA, dF = dA + rA + rF + 0.06, s0 = g.sSeat(0), s1 = g.sTop + P.over / Math.cos(N.funnel.rake);
    tube(M, 'funnel ' + f.id + ' after pipe', 'buff', off(s0, dA), off(s1 - 1.0, dA), rA, rA, 8);
    tube(M, 'funnel ' + f.id + ' after pipe top', 'cap', off(s1 - 1.0, dA), off(s1 - 0.3, dA), rA, rA, 8);
    tube(M, 'funnel ' + f.id + ' forward pipe', 'buff', off(s0, dF), off(s1 - 1.0, dF), rF, rF, 8);
    tube(M, 'funnel ' + f.id + ' forward pipe top', 'cap', off(s1 - 1.0, dF), off(s1, dF), rF, rF, 8);
    // a whistle on the forward pipe of funnels 1 and 2, dummies on 3 and 4 [read]; a small box [appearance]
    const wz = off(g.sTop - 2.2, dF + rF + 0.25);
    box(M, 'funnel ' + f.id + ' whistle', 'buff', wz[0], 0, wz[2], 0.5, 0.9, 1.3, 0, 'buff');
    const tip = off(s1, dF);
    return { id: f.id, x: f.x, seatZ: g.zb, zTopFwd: g.zTopFwd, top: { x: g.top[0], z: g.top[2] }, pipe: { x: tip[0], z: tip[2] }, smoke: f.smoke, g, torn: span(above, mark(M)) };
  }

  // ---- a mast: a tapered tube along its axis from its deck to its top; the axis is the profile's line lifted onto the
  // model's deck at the foot
  // the profile's first point is the foot, on its deck: lift is the model's deck there less the profile's
  function mastAxis(m) {
    const [[xa, za], [xb, zb]] = m.line, kx = (xb - xa) / (zb - za), lift = C.deckZ(m.foot[1], xa) - za;
    return { xAt: (z) => xa + (z - lift - za) * kx, lift, rake: Math.atan(-kx), zOf: (zp) => zp + lift, zFoot: za + lift };
  }
  function mast(M, m) {
    const A = mastAxis(m), zFoot = A.zFoot - 0.1;
    const zH = A.zOf(m.hounds), zU = A.zOf(m.upper), zT = rebase(m.top, m.line[0][0], m.foot[1]);   // the top from the keel, re-based
    const P = (z) => [A.xAt(z), 0, z], R = N.mastR;
    tube(M, m.id + 'mast', 'mast', P(zFoot), P(zH), R.deck, R.hounds, 12);
    tube(M, m.id + 'mast above the hounds', 'mast', P(zH), P(zU), R.hounds, R.hounds * 0.75, 12);
    tube(M, m.id + ' teak pole', 'mast', P(zU), P(zT), R.pole, R.pole * 0.7, 8);
    // the bands where the stays meet the mast [appearance: rings]
    for (const z of [zH, A.zOf(m.middle), zU]) tube(M, m.id + ' band', 'mast', P(z - 0.15), P(z + 0.15), R.hounds * 1.25, R.hounds * 1.25, 12);
    return { id: m.id, foot: P(zFoot), top: P(zT), xAt: A.xAt, rake: A.rake, hounds: P(zH), middle: P(A.zOf(m.middle)), upper: P(zU) };
  }
  // the crow's nest: a cage round the foremast with the lookouts' eye in it (N.nest); the eye's height over her waterline
  // at the night's drafts (Wilding's, the core's DEFAULT_PARAMS), as site/parts/20_night_scene.js had it
  function nestOf(fore) {
    const ns = N.nest, P = C.DEFAULT_PARAMS;
    const zWLAt = (x) => P.draftA + (P.draftF - P.draftA) * (x - G.xAP) / (G.xFP - G.xAP);
    let x = fore.xAt(40), z = 0;
    for (let i = 0; i < 6; i++) { z = zWLAt(x) + ns.above; x = fore.xAt(z); }    // the mast's x where the eye's height is
    const floor = z - ns.eye;
    return { x, floor, rim: floor + ns.h, r: ns.r, eye: { x: x + ns.ahead, y: 0, z }, above: ns.above, zWL: zWLAt(x) };
  }
  function nest(M, ns) {
    const B = M.b.white, n = 16, t0 = B.idx.length / 3, x = ns.x, r = ns.r;
    const ringAt = (z, rr) => { const o = []; for (let i = 0; i < n; i++) { const a = i / n * TAU; o.push([x + rr * Math.cos(a), rr * Math.sin(a), z]); } return o; };
    grid(B, [ringAt(ns.floor, r), ringAt(ns.rim, r)], true);
    solid(M, 'crow\'s nest', 'white', t0, { axis: [[x, 0, ns.floor], [x, 0, ns.rim]] });
    grid(B, [ringAt(ns.rim, r - 0.04), ringAt(ns.floor, r - 0.04)], true);                // its inside [appearance]
    const D = M.b.deck; for (let i = 0; i < n; i++) { const a = i / n * TAU, b = (i + 1) / n * TAU; tri(D, [x, 0, ns.floor + 0.05], [x + r * Math.cos(a), r * Math.sin(a), ns.floor + 0.05], [x + r * Math.cos(b), r * Math.sin(b), ns.floor + 0.05]); }
    for (let i = 0; i < n; i++) { const a = i / n * TAU, b = (i + 1) / n * TAU; seg(M.edges, [x + r * Math.cos(a), r * Math.sin(a), ns.rim], [x + r * Math.cos(b), r * Math.sin(b), ns.rim]); }
  }

  // rails: three rails and the stanchions along her side from x0 to x1 at y = sgn * yOf(x), on the deck z(x)
  function railAlong(M, x0, x1, yOf, z, sgn) {
    const R = N.rail, xs = steps(x0, x1, 1.5);
    for (let i = 0; i < xs.length - 1; i++) for (const h of [R.h, R.rows[1], R.rows[0]]) seg(M.rails, [xs[i], sgn * yOf(xs[i]), z(xs[i]) + h], [xs[i + 1], sgn * yOf(xs[i + 1]), z(xs[i + 1]) + h]);
    for (const x of steps(x0, x1, R.every)) seg(M.rails, [x, sgn * yOf(x), z(x)], [x, sgn * yOf(x), z(x) + R.h]);
  }
  // three rails along a path of [x, y] on the deck z(x), a stanchion every R.every metres along it
  function railPath(M, pts, z) {
    const R = N.rail;
    for (let i = 0; i < pts.length - 1; i++) for (const h of [R.h, R.rows[1], R.rows[0]]) seg(M.rails, [pts[i][0], pts[i][1], z(pts[i][0]) + h], [pts[i + 1][0], pts[i + 1][1], z(pts[i + 1][0]) + h]);
    let run = 0, next = 0;
    for (let i = 0; i < pts.length; i++) {
      if (i) run += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      if (run >= next - 1e-9) { seg(M.rails, [pts[i][0], pts[i][1], z(pts[i][0])], [pts[i][0], pts[i][1], z(pts[i][0]) + R.h]); next = run + R.every; }
    }
  }
  function railAcross(M, X, y0, y1, zz) {
    const R = N.rail;
    for (const k of [R.h, R.rows[1], R.rows[0]]) seg(M.rails, [X, y0, zz + k], [X, y1, zz + k]);
    for (const y of steps(y0, y1, R.every)) seg(M.rails, [X, y, zz], [X, y, zz + R.h]);
  }
  function railBox(M, x, y, l, w, zz, h) {
    const k = [[x - l / 2, y - w / 2], [x + l / 2, y - w / 2], [x + l / 2, y + w / 2], [x - l / 2, y + w / 2]];
    for (let i = 0; i < 4; i++) { const a = k[i], b = k[(i + 1) % 4]; seg(M.rails, [a[0], a[1], zz + h], [b[0], b[1], zz + h]); seg(M.rails, [a[0], a[1], zz + h / 2], [b[0], b[1], zz + h / 2]); seg(M.rails, [a[0], a[1], zz], [a[0], a[1], zz + h]); }
  }
  // a 2.5-ton electric crane: a post, a house turning on it and a jib [appearance: proportions]
  function crane(M, x, y, z, aim, small) {
    const c = Math.cos(aim), s = Math.sin(aim), k = small ? 0.75 : 1;
    cylinder(M, 'crane post', 'white', x, y, z, z + 1.9 * k, 0.55 * k, 12, 'grey');
    box(M, 'crane house', 'white', x, y, z + 1.9 * k, 1.7 * k, 1.3 * k, 1.2 * k, aim, 'grey');
    const A = [x + 0.6 * k * c, y + 0.6 * k * s, z + 2.4 * k], L = 7.6 * k, el = 32 * DEG;
    const B = [A[0] + L * Math.cos(el) * c, A[1] + L * Math.cos(el) * s, A[2] + L * Math.sin(el)];
    tube(M, 'crane jib', 'white', A, B, 0.22 * k, 0.13 * k, 6);
    seg(M.rigging, B, [B[0], B[1], z + 1.2]);                       // its fall [appearance]
    seg(M.rigging, B, [x, y, z + 3.1 * k]);                         // its topping lift [appearance]
  }

  // =================================================================== the whole ship
  // Returns typed arrays in the ship's frame (faces by colour, edges and lines as segments, windows as rows of
  // [x, y, z, nx, ny, w, h]), and what the viewer and the tests read: the funnels' tops (smoke) and pipes (steam), the
  // crow's nest, the masts, the davits.
  function build(opts) {
    const M = { b: { white: bucket(), deck: bucket(), grey: bucket(), dark: bucket(), black: bucket(), buff: bucket(), cap: bucket(), mast: bucket() }, solids: [], edges: [], rails: [], rigging: [], windows: [], litWindows: [] };
    const zB = zDeck('B'), zA = zDeck('A'), zBoat = zDeck('Boat'), zC = zDeck('C'), BD = N.boatDeck;
    const xWF = G.wellFwd[0], xWA = G.wellAft[1];                    // B deck's superstructure: the model's hull between its wells

    // ---- B deck: her side carried up to A deck, flush with the hull; its front over the forward well; at its after end
    // the notches of the No. 4 hatches
    const xB0 = xWA + N.bDeck.notch, yHull = (x, z) => hbAt(x, z);
    for (const sg of [1, -1]) sidePlate(M, 'B deck side', 'white', xB0, xWF, yHull, zB, zA, sg, { nz: 2 });
    endPlate(M, 'B deck front', 'white', xWF, hbAt(xWF, zA(xWF)), zB(xWF), zA(xWF), +1);
    house(M, 'B deck after end', [[xWA, xB0, -N.bDeck.notchHw, N.bDeck.notchHw]], zB, zA, 'white', 'deck');
    // the notches' after walls, from the house to her side
    for (const sg of [1, -1]) {
      const y0 = N.bDeck.notchHw, y1 = hbAt(xB0, zA(xB0)), z0 = zB(xB0), z1 = zA(xB0), t0 = M.b.white.idx.length / 3;
      const p = [[xB0, sg * y0, z0], [xB0, sg * y1, z0], [xB0, sg * y1, z1], [xB0, sg * y0, z1]];
      if (sg > 0) quad(M.b.white, p[3], p[2], p[1], p[0]); else quad(M.b.white, p[0], p[1], p[2], p[3]);
      solid(M, 'No. 4 hatch notch, after wall', 'white', t0, { facing: -1 });
      seg(M.edges, p[3], p[2]);
    }
    // A deck's level: the roof of B deck's superstructure, full breadth
    deckPlate(M, 'A deck', xB0, xWF, (x) => hbAt(x, zA(x)), zA, 0.25, {});
    // the open A-deck level forward of A deck's house and aft of the Boat deck: rails at her side and across
    for (const sg of [1, -1]) {
      railAlong(M, N.aDeck.x1, xWF - 0.1, (x) => hbAt(x, zA(x)) - 0.08, zA, sg);
      railAlong(M, xB0 + 0.1, N.aDeck.x0, (x) => hbAt(x, zA(x)) - 0.08, zA, sg);
      railAlong(M, xWA + 0.1, xB0, () => N.bDeck.notchHw - 0.08, zA, sg);
    }
    railAcross(M, xWF - 0.1, -hbAt(xWF, zA(xWF)) + 0.1, hbAt(xWF, zA(xWF)) - 0.1, zA(xWF));
    railAcross(M, xWA + 0.1, -N.bDeck.notchHw + 0.1, N.bDeck.notchHw - 0.1, zA(xWA));

    // ---- A deck's house and its promenade: the screen forward, the bulwark and the stanchions aft
    const zUnder = (x) => zBoat(x) - BD.t;
    {
      const secs = N.aHouse.map(([a, b]) => { const xm = (a + b) / 2, hw = aHouseHw(xm); return [a, b, -hw, hw]; });
      house(M, 'A deck house', secs, zA, zUnder, 'white', 'white');
    }
    const scr = N.screen;
    for (const sg of [1, -1]) {
      sidePlate(M, 'A deck screen', 'white', scr.x0, scr.x1, (x, z) => hbAt(x, z), zA, zUnder, sg, { ends: true, edgeLow: false });
      sidePlate(M, 'A deck bulwark', 'white', N.aDeck.x0, scr.x0, (x, z) => hbAt(x, z), zA, (x) => zA(x) + N.aBulwark, sg, { both: true, ends: true });
      for (const x of steps(N.aDeck.x0 + 0.3, scr.x0 - 0.3, N.stanchion)) {     // the Boat deck's edge on its stanchions
        const y = sg * (hbAt(x, zA(x) + 1.5) - 0.12);
        seg(M.rails, [x, y, zA(x) + N.aBulwark], [x, y, zUnder(x)]);
      }
      railAlong(M, N.aDeck.x0, scr.x0, (x) => hbAt(x, zA(x) + N.aBulwark) - 0.05, (x) => zA(x) + N.aBulwark - N.rail.h + 0.06, sg);   // the teak rail on it [appearance: a line]
    }
    for (const [x, y] of N.aCranes) crane(M, x, y, zA(x), Math.PI, true);

    // ---- the Boat deck: the plate with its curved front, its sides, the houses
    deckPlate(M, 'Boat deck', BD.x0, BD.xFrontSide, deckEdge, zBoat, BD.t, { front: frontX });
    for (const sg of [1, -1]) for (const s of N.sides) {
      if (s.kind === 'bulwark') sidePlate(M, 'steel bulwark', 'white', s.x[0], s.x[1], (x) => deckEdge(x), zBoat, (x) => zBoat(x) + N.bulwarkH, sg, { both: true, ends: true });
      else railAlong(M, s.x[0], s.x[1], (x) => deckEdge(x) - 0.05, zBoat, sg);
    }
    for (const sg of [1, -1]) railAlong(M, N.sides[3].x[1], N.cabs.x0, (x) => deckEdge(x) - 0.05, zBoat, sg);
    railAcross(M, BD.x0 + 0.05, -deckEdge(BD.x0) + 0.05, deckEdge(BD.x0) - 0.05, zBoat(BD.x0));
    // the bridge's front bulwark across her, following the arc [bet 1.2 m]; the middle shelter's roof on its posts and
    // its front windows; the wing cabs out over her sides
    {
      const ys = steps(-deckEdge(BD.xFrontSide), deckEdge(BD.xFrontSide), 1.2), Bw = M.b.white, t0 = Bw.idx.length / 3, hF = N.bridge.front;
      for (let i = 0; i < ys.length - 1; i++) {
        const xa = frontX(ys[i]) - 0.05, xb = frontX(ys[i + 1]) - 0.05, za = zBoat(xa), zb = zBoat(xb);
        quad(Bw, [xa, ys[i], za], [xb, ys[i + 1], zb], [xb, ys[i + 1], zb + hF], [xa, ys[i], za + hF]);
        quad(Bw, [xa - 0.04, ys[i], za + hF], [xb - 0.04, ys[i + 1], zb + hF], [xb - 0.04, ys[i + 1], zb], [xa - 0.04, ys[i], za]);
        seg(M.edges, [xa, ys[i], za + hF], [xb, ys[i + 1], zb + hF]);
      }
      solid(M, 'bridge front', 'white', t0, { open: true });
      const br = N.bridge, x1 = frontX(br.hw) - 0.1, zr = (x) => zBoat(x) + br.h;
      house(M, 'bridge shelter roof', [[br.x0, x1, -br.hw, br.hw]], (x) => zr(x) - 0.15, zr, 'white', 'grey');
      for (const [x, y] of [[br.x0, br.hw], [br.x0, -br.hw], [x1, br.hw], [x1, -br.hw]]) box(M, 'bridge post', 'white', x, y, zBoat(x), 0.2, 0.2, br.h - 0.15, 0, 'white');
      // the shelter's front: the screen between the bulwark and the roof, with its nine windows (windows below)
      const xs = frontX(0) - 0.12, t1 = Bw.idx.length / 3;
      for (const [ya, yb] of [[-br.hw, br.hw]]) {
        const za = zBoat(xs) + hF, zb = zr(xs) - 0.15;
        quad(Bw, [xs, ya, za], [xs, yb, za], [xs, yb, zb], [xs, ya, zb]);
      }
      solid(M, 'bridge shelter front', 'white', t1, { facing: +1 });
      const cb = N.cabs, xc = (cb.x0 + cb.x1) / 2;
      for (const sg of [1, -1]) {
        const out = deckEdge(xc) + cb.out, inn = out - cb.w;
        house(M, sg > 0 ? 'port wing cab' : 'starboard wing cab', [[cb.x0, cb.x1, sg > 0 ? inn : -out, sg > 0 ? out : -inn]], zBoat, (x) => zBoat(x) + cb.h, 'white', 'grey');
        box(M, 'wing deck', 'deck', xc, sg * (deckEdge(xc) + cb.out / 2), zBoat(xc) - BD.t, cb.x1 - cb.x0, cb.out + 0.1, BD.t, 0, 'deck');
      }
    }
    for (const H of N.houses) house(M, H.id, H.secs, zBoat, (x) => zBoat(x) + H.h, 'white', H.roof);
    { const s = N.skylight, xm = (s.x[0] + s.x[1]) / 2, z0 = zBoat(xm) + 2.7; house(M, 'engine-casing skylight', [[s.x[0], s.x[1], -s.hw, s.hw]], () => z0, () => z0 + s.h, 'white', 'dark'); }
    for (const [x, h] of N.fans) for (const sg of [1, -1]) box(M, 'fan housing', 'white', x, sg * 2.2, zBoat(x) + h, 1.6, 1.3, 1.6, 0, 'grey');
    // rails round the casings' and the tank room's roofs [read: 42 in on the tank room roof]
    for (const id of ['engineCasingHouse']) { const H = N.houses.find(h => h.id === id), [a, b, yS, yP] = H.secs[0]; railBox(M, (a + b) / 2, (yS + yP) / 2, b - a - 0.2, yP - yS - 0.2, zBoat((a + b) / 2) + H.h, N.rail.h); }
    // the compass platform on its legs over the lounge's roof
    {
      const cp = N.compass, zc = rebase(cp.z, cp.x), zf = zc - cp.under, zr = zBoat(cp.x) + 1.0, s = cp.size / 2 - 0.15;
      box(M, 'compass platform', 'white', cp.x, 0, zf - 0.15, cp.size, cp.size, 0.15, 0, 'deck');
      for (const [dx, dy] of [[-s, -s], [s, -s], [s, s], [-s, s]]) box(M, 'compass leg', 'white', cp.x + dx, dy, zr, 0.16, 0.16, zf - 0.15 - zr, 0, 'white');
      cylinder(M, 'standard compass', 'dark', cp.x, 0, zf, zc, 0.3, 12, 'buff');
      railBox(M, cp.x, 0, cp.size, cp.size, zf, 1.0);
      for (const sg of [1, -1]) seg(M.rails, [cp.x - 0.4, sg * (s + 0.9), zr], [cp.x - 0.4, sg * (s + 0.1), zf]);   // the ladders [appearance]
    }
    // the Marconi lead-in mast on the officers' house
    { const L = N.leadIn, z0 = zBoat(L.x) + 2.4; box(M, 'aerial lead-in mast', 'white', L.x, 0, z0, L.side, L.side, L.h, 0, 'white'); }
    // the expansion joints and the promenades' limits across the deck
    for (const x of N.joints) seg(M.rigging, [x, -deckEdge(x) + 0.1, zBoat(x) + 0.03], [x, deckEdge(x) - 0.1, zBoat(x) + 0.03]);
    for (const x of N.promLimits) {
      const hw = Math.max(...N.houses.filter(h => h.secs.some(([a, b]) => x >= a && x <= b)).map(h => Math.max(...h.secs.map(s => Math.max(Math.abs(s[2]), Math.abs(s[3]))))), 3.0);
      for (const sg of [1, -1]) railAcross(M, x, sg > 0 ? hw : -deckEdge(x) + 0.1, sg > 0 ? deckEdge(x) - 0.1 : -hw, zBoat(x));
    }

    // ---- the davits (Welin double-acting): a frame at each davit station, both sides, running 2.0 m inboard from the
    // deck's edge [scaled: the plan's symbol]; its arms are the viewer's (they swing out with the boats): where each stands
    const davits = [];
    for (const x of DAVIT_X) for (const sg of [1, -1]) {
      const e = deckEdge(x);
      box(M, 'davit frame', 'white', x, sg * (e - 1.0), zBoat(x), 0.5, 2.0, 0.9, 0, 'white');
      davits.push({ x, side: sg, edge: e, pivot: [x, sg * (e - 0.9), zBoat(x) + 0.9] });
    }
    // the lifeboats' chocks on deck, two under each of the fourteen (not the cutters, kept swung out) [read: "hinged wood
    // chocks"; appearance: their size; under the boat as site/parts/50_boats.js stows her, 1.6 m in from the edge]
    for (let i = 0; i < DAVIT_X.length - 1; i++) {
      const a = DAVIT_X[i], b = DAVIT_X[i + 1];
      if (Math.sign(a) !== Math.sign(b) || i === 0) continue;               // across the gap between the groups; the cutters' pair
      const xm = (a + b) / 2;
      for (const sg of [1, -1]) for (const dx of [-3.0, 3.0]) { const x = xm + dx; box(M, 'boat chock', 'deck', x, sg * (deckEdge(x) - 1.6), zBoat(x), 0.45, 2.3, 0.35, 0, 'deck'); }
    }

    // ---- funnels, masts, the crow's nest, the derrick
    const funs = N.funnels.map(f => funnel(M, f));
    const mastAt = [], masts = N.masts.map(m => { const a = mark(M), o = mast(M, m); mastAt.push(span(a, mark(M))); return o; });
    const ns = nestOf(masts[0]), nestAt = mark(M); nest(M, ns);
    const nestSpan = span(nestAt, mark(M)), derrickAt = mark(M), dk = N.derrick, dLift = C.deckZ('B', dk.heel[0]) - dk.heel[1] + 0.3;
    const dHeel = [dk.heel[0], 0, dk.heel[1] + dLift], dHead = [dk.head[0], 0, dk.head[1] + dLift];
    tube(M, 'derrick', 'mast', dHeel, dHead, 0.2, 0.14, 8);
    const derrickSpan = span(derrickAt, mark(M));

    // ---- the wells: bulwarks, black under the sheer line, white over it; hatches; cranes
    const zLine = (x) => C.deckZ('B', x) - N.strake, zLineTop = (x) => zLine(x) + N.sheerLine;
    for (const [w0, w1] of [G.wellFwd, G.wellAft]) for (const sg of [1, -1]) {
      const yW = (x, z) => hbAt(x, z) - 0.02, top = (x) => C.deckZ('C', x) + N.wellBulwark;
      sidePlate(M, 'well bulwark, black', 'black', w0, w1, yW, zC, (x) => Math.min(zLine(x), top(x)), sg, { both: true, edges: false });
      sidePlate(M, 'well bulwark, sheer line', 'buff', w0, w1, yW, (x) => Math.min(zLine(x), top(x)), (x) => Math.min(zLineTop(x), top(x)), sg, { edges: false });
      sidePlate(M, 'well bulwark, white', 'white', w0, w1, yW, (x) => Math.min(zLineTop(x), top(x)), top, sg, { both: true, ends: true });
    }
    for (const h of N.hatches) {
      const x = (h.x[0] + h.x[1]) / 2, y = (h.y[0] + h.y[1]) / 2;
      box(M, 'hatch ' + h.id, h.white ? 'white' : 'black', x, y, C.deckZ(h.deck, x), h.x[1] - h.x[0], h.y[1] - h.y[0], N.coaming, 0, 'deck');
    }
    for (const c of N.cranes) crane(M, c.x, c.y, C.deckZ(c.deck, c.x), c.aim);
    crane(M, N.anchorCrane.x, 0, zB(N.anchorCrane.x), Math.PI, true);
    { const w = N.anchorWell; box(M, 'centre anchor well', 'black', w.x, 0, zB(w.x), w.l, w.w, 0.25, 0, 'cap'); }
    for (const [x, y] of N.capstans) cylinder(M, 'capstan', 'dark', x, y, zB(x), zB(x) + 0.85, 0.45, 14, 'buff');
    // the breakwater: from No. 1 hatch's after corners out and aft to her side
    {
      const h1 = N.hatches[0], xa = h1.x[0], Bw = M.b.white;
      for (const sg of [1, -1]) {
        const xb = xa - N.breakwater.back, yb = sg * (hbAt(xb, zB(xb)) - 0.3), ya = sg * h1.y[1], za = zB(xa), zb = zB(xb), hb = N.breakwater.h;
        const p = [[xa, ya, za], [xb, yb, zb], [xb, yb, zb + hb], [xa, ya, za + hb]], t0 = Bw.idx.length / 3;
        if (sg > 0) { quad(Bw, p[0], p[1], p[2], p[3]); quad(Bw, p[3], p[2], p[1], p[0]); } else { quad(Bw, p[3], p[2], p[1], p[0]); quad(Bw, p[0], p[1], p[2], p[3]); }
        solid(M, 'breakwater', 'white', t0, { open: true });
        seg(M.edges, p[3], p[2]);
      }
    }
    // the forecastle's rails; the poop's round her stern from one side to the other; across the forecastle's after end
    // and the poop's forward end
    for (const sg of [1, -1]) railAlong(M, G.wellFwd[1] + 0.1, N.stemHead - 0.6, (x) => hbAt(x, zB(x)) - 0.08, zB, sg);
    {
      const xe = C.xAft(zB(G.xAP - G.sternOverhang)), side = [];
      for (const x of steps(G.wellAft[0] - 0.1, xe + 1.0, 1.5)) side.push(x);
      for (const d of [0.72, 0.5, 0.34, 0.22, 0.14]) side.push(xe + d);
      const half = side.map(x => [x, hbAt(x, zB(x)) - 0.08]).concat([[xe + 0.09, 0]]);
      for (const sg of [1, -1]) railPath(M, half.map(([x, y]) => [x, sg * y]), zB);   // each side from the well round to the centre line
    }
    { const x = G.wellFwd[1] + 0.1, h = hbAt(x, zB(x)) - 0.08; railAcross(M, x, -h, h, zB(x)); }
    { const x = G.wellAft[0] - 0.1, h = hbAt(x, zB(x)) - 0.08; railAcross(M, x, -h, h, zB(x)); }
    // the docking bridge on the poop: a narrow deck on stanchions across her and over her sides, its rails, telegraphs
    {
      const d = N.dockBridge, xm = (d.x0 + d.x1) / 2, z0 = zB(xm), z1 = z0 + d.h, hw = hbAt(xm, z0) + d.over;
      deckPlate(M, 'docking bridge', d.x0, d.x1, () => hw, () => z1, 0.2, { step: d.x1 - d.x0 });
      for (const y of [-0.92, -0.45, 0, 0.45, 0.92]) for (const x of [d.x0 + 0.1, d.x1 - 0.1]) seg(M.rails, [x, y * (hw - d.over), z0], [x, y * (hw - d.over), z1 - 0.2]);
      for (const x of [d.x0 + 0.05, d.x1 - 0.05]) for (const h of [N.rail.h, N.rail.rows[1]]) seg(M.rails, [x, -hw + 0.05, z1 + h], [x, hw - 0.05, z1 + h]);
      for (const sg of [1, -1]) for (const h of [N.rail.h, N.rail.rows[1]]) seg(M.rails, [d.x0 + 0.05, sg * (hw - 0.05), z1 + h], [d.x1 - 0.05, sg * (hw - 0.05), z1 + h]);
      for (const y of [-6, 0, 6]) box(M, 'docking-bridge telegraph', 'buff', xm, y, z1, 0.4, 0.4, 1.1, 0, 'buff');
    }

    // ---- the dome covers where the model has its staircases: the curbs white, the frames with the rails, the glass of
    // both in one mesh of its own, each dome's triangles a range of it (so that one can go and the other stay)
    const glass = bucket(), domes = [];
    for (const s of (opts && opts.stairs) || C.STAIRS || []) {
      if (!s.dome) continue;
      const d = dome(s), t0 = glass.idx.length / 3;
      append(M.b.white, d.curb); append(glass, d.glass); for (const v of d.frame) M.rails.push(v);
      domes.push({ id: d.id, stair: d.stair, x: d.x, a: d.a, b: d.b, z0: d.z0, zGlass: d.zGlass, crown: d.crown, under: d.under, t0, t1: glass.idx.length / 3 });
    }
    // ---- windows [appearance: their sizes and spacing; the note 5, 10: rows and pitches C]
    windows(M, zA, zB, zBoat, xB0, xWF);
    // ---- rigging (the note 2.3)
    const rig = rigging(M, masts, funs);

    const pack = (B) => ({ pos: Float32Array.from(B.pos), idx: Uint32Array.from(B.idx) });
    const faces = {}; for (const k in M.b) faces[k] = pack(M.b[k]);
    const fx = funs.map(o => ({ id: o.id, x: o.x, seatZ: o.seatZ, zTopFwd: o.zTopFwd, top: o.top, pipe: o.pipe, smoke: o.smoke }));
    // what each funnel, mast, the crow's nest, the derrick and the aerial are of the buckets and line sets (ranges by
    // bucket, 'edges' and 'rigging'): a funnel's above its flange, with its shrouds (and funnel 1's jackstay); each mast's
    // own stays apart from it (they end on her deck); the foot, the top and the heel in her frame
    const parts = {
      funnels: funs.map((o, i) => ({ id: o.id, x: o.x, at: Object.assign({}, o.torn, { rigging: rig.funnels[i] }) })),
      masts: masts.map((m, i) => ({ id: m.id, foot: m.foot, top: m.top, at: mastAt[i], stays: rig[m.id] || [] })),
      nest: { x: ns.x, at: nestSpan }, derrick: { heel: dHeel, head: dHead, at: derrickSpan }, aerial: { at: { rigging: rig.aerial } },
    };
    return {
      faces, solids: M.solids, edges: Float32Array.from(M.edges), rails: Float32Array.from(M.rails), rigging: Float32Array.from(M.rigging),
      glass: pack(glass), domes, windows: Float32Array.from(M.windows), lit: M.litWindows.slice(), davits, funnels: fx,
      smoke: fx.filter(f => f.smoke).map(f => ({ x: f.top.x, z: f.top.z })), steam: fx.filter(f => f.smoke).map(f => ({ x: f.pipe.x, z: f.pipe.z })),
      masts: masts.map(m => ({ id: m.id, foot: m.foot, top: m.top, rake: m.rake, hounds: m.hounds })), nest: ns, parts,
    };
  }

  // the angle her side makes with her centre line at (x, z), for a window laid flat on it
  function sideAngle(x, z) { const d = 0.5; return Math.atan((hbAt(x + d, z) - hbAt(x - d, z)) / (2 * d)); }
  // windows: [x, y, z, nx, ny, w, h] each, on the face whose outward normal is (nx, ny, 0); lit: [x, y, z] of those that
  // site/visuals.js lights with her other ports (B deck's and the screen's, at her side)
  function windows(M, zA, zB, zBoat, xB0, xWF) {
    const W = M.windows, put = (x, y, z, nx, ny, w, h) => W.push(x, y, z, nx, ny, w, h), off = 0.03;
    const onSide = (x, z, w, h, lit) => {
      const ang = sideAngle(x, z), y = hbAt(x, z);
      for (const sg of [1, -1]) { put(x, sg * (y + off), z, -Math.sin(ang), sg * Math.cos(ang), w, h); if (lit) M.litWindows.push([x, sg * (y + 0.06), z]); }
    };
    // B deck's square windows, a row along her side [the note: pitch 2.4, 1.4 m over the deck: C]
    for (let x = xB0 + 1.0; x <= xWF - 1.0; x += 2.4) onSide(x, zB(x) + 1.4, 0.75, 0.9, true);
    // the screen's large windows [the note: about 1.5 m wide at 2.3-2.7 m: C]
    for (let x = N.screen.x0 + 1.3; x <= N.screen.x1 - 1.0; x += 2.5) onSide(x, zA(x) + 1.45, 1.5, 1.2, true);
    // the A-deck house's own windows behind the open promenade, the lounge's and the smoke room's large ones
    for (let x = N.aDeck.x0 + 4.0; x <= N.screen.x0 - 1.0; x += 3.0) { const hw = aHouseHw(x); if (hw > 0) for (const sg of [1, -1]) put(x, sg * (hw + off), zA(x) + 1.5, 0, sg, 1.3, 1.6); }
    // the C-deck second-class promenade's sliding windows, in her top strake [read: "sliding windows at the side"]
    for (let x = N.cProm.x0 + 1.2; x <= N.cProm.x1 - 0.8; x += 1.8) onSide(x, C.deckZ('C', x) + 1.3, 1.1, 0.8, false);
    // the scuttles of her white top strake: C deck's row where site/visuals.js lights them, but in the C-deck promenade
    for (let x = -116; x <= 112; x += 2.6) {
      if (x > N.cProm.x0 && x < N.cProm.x1) continue;
      const z = C.deckZ('C', x) + 1.2; if (z > C.zTopAt(x) - 0.6) continue;
      if (hbAt(x, z) < 2) continue;
      onSide(x, z, 0.34, 0.34, false);
    }
    // the houses on the Boat deck
    for (const H of N.houses) {
      if (!H.win) continue;
      const [x0, x1, yS, yP] = H.secs[0];
      if (H.win === 'side') for (let x = x0 + 1.2; x <= x1 - 0.6; x += 1.9) { put(x, yP + off, zBoat(x) + 1.45, 0, 1, 0.6, 0.65); put(x, yS - off, zBoat(x) + 1.45, 0, -1, 0.6, 0.65); }
      if (H.win === 'gym') { for (let k = 0; k < 6; k++) { const x = x0 + 1.4 + k * 2.3; put(x, yS - off, zBoat(x) + 1.55, 0, -1, 1.45, 1.8); } put(x1 + off, (yS + yP) / 2 - 1.2, zBoat(x1) + 1.55, 1, 0, 1.45, 1.8); put(x1 + off, (yS + yP) / 2 + 1.2, zBoat(x1) + 1.55, 1, 0, 1.45, 1.8); }
      if (H.win === 'front') for (let k = -2; k <= 2; k++) put(x1 + off, k * 1.05, zBoat(x1) + 1.55, 1, 0, 0.7, 0.75);
    }
    // B deck's front over the forward well and A deck's house front: rows across her [appearance: their staterooms']
    for (let y = -hbAt(xWF, zB(xWF) + 1.4) + 1.2; y <= hbAt(xWF, zB(xWF) + 1.4) - 1.2; y += 2.2) put(xWF + off, y, zB(xWF) + 1.4, 1, 0, 0.75, 0.9);
    { const xF = N.aHouse[N.aHouse.length - 1][1], hw = aHouseHw(xF - 0.1); for (let y = -hw + 1.0; y <= hw - 1.0; y += 2.0) put(xF + off, y, zA(xF) + 1.5, 1, 0, 0.9, 1.0); }
    // the bridge shelter's nine windows; the wing cabs' on three sides [appearance]
    { const br = N.bridge, xs = frontX(0) - 0.12 + off, w = 2 * br.hw / br.windows; for (let k = 0; k < br.windows; k++) put(xs, -br.hw + w * (k + 0.5), zBoat(xs) + br.front + 0.55, 1, 0, w - 0.18, 0.75); }
    { const cb = N.cabs, xc = (cb.x0 + cb.x1) / 2; for (const sg of [1, -1]) { const out = deckEdge(xc) + cb.out; put(xc, sg * (out + off), zBoat(xc) + 1.5, 0, sg, 1.3, 0.8); put(cb.x1 + off, sg * (out - cb.w / 2), zBoat(cb.x1) + 1.5, 1, 0, 1.1, 0.8); } }
  }

  // the rigging: lines in the ship's frame (the note 2.3: the pattern read, most lower ends bets). Returns whose each run
  // of its segments is (ranges [from, to) of M.rigging's segments): each mast's stays, each funnel's shrouds (funnel 1's
  // with its jackstay to the foremast), the aerial
  function rigging(M, masts, funs) {
    const R = M.rigging, zB = (x) => C.deckZ('B', x), zBoat = (x) => C.deckZ('Boat', x);
    const fore = masts[0], main = masts[1], at = (m, z) => [m.xAt(z), 0, z];
    const side = (x, z, sg) => [x, sg * (hbAt(x, z) - 0.12), z + 0.3];
    const out = { fore: [], main: [], funnels: funs.map(() => []), aerial: [] }, now = () => R.length / 6;
    let a = now(); const own = (list) => { const b = now(); if (b > a) list.push([a, b]); a = b; };
    // the foremast: three shrouds a side from the hounds to her side at the forecastle deck, x +94 to +97; a backstay a
    // side from the middle and the upper bands, 5 to 10 m further aft; the forestays to the forecastle near the stem
    for (const sg of [1, -1]) {
      for (const x of [94.2, 95.6, 97.0]) seg(R, [fore.hounds[0], sg * 0.3, fore.hounds[2]], side(x, zB(x), sg));
      for (const [P, x] of [[fore.middle, 90.0], [fore.upper, 86.0]]) seg(R, [P[0], sg * 0.2, P[2]], side(x, zB(x), sg));
    }
    for (const [P, x] of [[fore.hounds, 115.0], [fore.hounds, 117.0], [fore.middle, 121.0], [fore.upper, 127.0]]) seg(R, [P[0] + 0.3, 0, P[2]], [x, 0, zB(x) + 0.3]);
    own(out.fore);
    // the mainmast: three shrouds a side to her side at B deck aft, x -92 to -100 (the after well's bulwark top there);
    // backstays further aft; forestays to the roofs forward of it, x -60 to -78
    const wellTop = (x) => C.deckZ('C', x) + N.wellBulwark;
    for (const sg of [1, -1]) {
      for (const x of [-92.4, -95.0, -97.6]) seg(R, [main.hounds[0], sg * 0.3, main.hounds[2]], [x, sg * (hbAt(x, wellTop(x)) - 0.12), wellTop(x)]);
      for (const [P, x] of [[main.middle, -101.0], [main.upper, -108.0]]) seg(R, [P[0], sg * 0.2, P[2]], [x, sg * (hbAt(x, wellTop(x)) - 0.12), wellTop(x)]);
    }
    for (const [P, x, z] of [[main.hounds, -76.5, C.deckZ('A', -76.5) + 0.3], [main.middle, -64.0, zBoat(-64.0) + 1.0], [main.upper, -60.0, zBoat(-60.0) + 1.0]]) seg(R, [P[0] + 0.3, 0, P[2]], [x, 0, z]);
    own(out.main);
    // the jackstays: from funnel 1's forward face to the foremast; from the mainmast's upper band to the poop under the
    // docking bridge
    { const g = funs[0].g, P = g.at(g.sTop - 4.5, 0); seg(R, P, at(fore, 50.0)); }
    own(out.funnels[0]);
    seg(R, main.upper, [-126.3, 0, zB(-126.3) + 0.5]);
    own(out.main);
    // the funnels' shrouds: six a side from the foot of the black band to eyes on the deck beside the funnel, spread fore
    // and aft [read: six; the deck ends bet]
    funs.forEach((o, i) => {
      const g = o.g, s = g.sBlack + 0.25;
      for (const sg of [1, -1]) for (let k = 0; k < N.shrouds; k++) {
        const th = sg * (40 + 20 * k) * DEG, A = g.at(s, th, 1.02);
        const xe = Math.max(N.boatDeck.x0 + 0.5, Math.min(N.boatDeck.xFrontSide - 0.5, g.f.x + (2.5 - k) * 3.0)), ye = sg * (deckEdge(xe) - 0.5);
        seg(R, A, [xe, ye, zBoat(xe) + 0.4]);
      }
      own(out.funnels[i]);
    });
    // the aerial: a flat top of four wires (The Shipbuilder: two) on spreaders, from the foremast's teak pole to forward
    // of funnel 4, in a slight catenary, the outer pair lower; its downleads from just forward of funnel 2 to the lead-in
    // on the officers' house [read; heights bet]
    const fz = fore.top[2] - 4.5, mz = main.top[2] - 4.5, xf = fore.xAt(fz), xm = -45.0;
    const wires = [[-1.5, 0.3], [-0.5, 0], [0.5, 0], [1.5, 0.3]];
    for (const [y, drop] of wires) {
      const pts = []; for (let i = 0; i <= 12; i++) { const t = i / 12, x = lerp(xf, xm, t), z = lerp(fz, mz + 1.5, t) - 2.2 * 4 * t * (1 - t) - drop; pts.push([x, y, z]); }
      polyline(R, pts);
    }
    for (const x of [xf, xm]) seg(R, [x, -1.6, (x === xf ? fz : mz + 1.5) - 0.3], [x, 1.6, (x === xf ? fz : mz + 1.5) - 0.3]);
    seg(R, [xm, 0, mz + 1.2], at(main, mz + 1.5));              // the flat top's halyard to the mainmast
    const xd = 24.0, td = (xf - xd) / (xf - xm), zd = lerp(fz, mz + 1.5, td) - 2.2 * 4 * td * (1 - td);
    for (const y of [-0.5, 0.5]) seg(R, [xd, y, zd], [N.leadIn.x, 0, C.deckZ('Boat', N.leadIn.x) + 2.4 + N.leadIn.h]);
    own(out.aerial);
    return out;
  }

  // =================================================================== the dome covers (one source of truth: core/core.js)
  // The weather cover over each grand staircase's dome stands where the flooding model puts it (C.STAIRS: x, and dome
  // { deck, up, l, b }: its glass `up` m over its deck, an ellipse l by b). It rises from the roof of the house under
  // it (or from the deck) to its glass: a glazed drum with a white curb, then a low glazed crown [appearance: the drum's
  // glazing, the crown's 0.6 m rise, its ribs and posts]. Its glass is a mesh of its own (hidden when the dome has given
  // way); its frame is lines.
  function roofUnder(x, y) {                                // the highest roof over (x, y) on the Boat deck, or the deck itself
    let z = C.deckZ('Boat', x), id = null;
    for (const H of N.houses) for (const [x0, x1, yS, yP] of H.secs) if (x >= x0 && x <= x1 && y >= yS && y <= yP && C.deckZ('Boat', x) + H.h > z) { z = C.deckZ('Boat', x) + H.h; id = H.id; }
    return { z, id };
  }
  function dome(stair) {
    const d = stair.dome, a = d.l / 2, b = d.b / 2, x = stair.x, n = 28, rise = 0.6, curb = 0.3;
    const zGlass = C.deckZ(d.deck, x) + d.up, under = d.deck === 'Boat' ? roofUnder(x, 0) : { z: C.deckZ(d.deck, x), id: null };
    const z0 = Math.min(under.z, zGlass - 0.4), zc = z0 + curb;
    const curbB = bucket(), glass = bucket(), lines = [];
    const P = (th, k, z) => [x + k * a * Math.cos(th), k * b * Math.sin(th), z];
    const ring = (k, z) => { const o = []; for (let i = 0; i < n; i++) o.push(P(i / n * TAU, k, z)); return o; };
    grid(curbB, [ring(1, z0), ring(1, zc)], true);
    grid(glass, [ring(1, zc), ring(1, zGlass)], true);
    const ks = [1, 0.75, 0.45, 0.15], zk = (k) => zGlass + rise * (1 - k * k);
    grid(glass, ks.map(k => ring(k, zk(k))), true);
    for (let i = 0; i < n; i++) tri(glass, P(i / n * TAU, 0.15, zk(0.15)), P((i + 1) / n * TAU, 0.15, zk(0.15)), [x, 0, zk(0)]);
    for (let i = 0; i < n; i++) { const t1 = i / n * TAU, t2 = (i + 1) / n * TAU; seg(lines, P(t1, 1, zGlass), P(t2, 1, zGlass)); seg(lines, P(t1, 1, zc), P(t2, 1, zc)); }
    for (let i = 0; i < 12; i++) { const th = i / 12 * TAU; seg(lines, P(th, 1, zc), P(th, 1, zGlass)); let prev = P(th, 1, zGlass); for (const k of ks.slice(1).concat([0])) { const p = P(th, k, zk(k)); seg(lines, prev, p); prev = p; } }
    const pack = (B) => ({ pos: Float32Array.from(B.pos), idx: Uint32Array.from(B.idx) });
    return { id: 'dome' + stair.id, stair: stair.id, x, a, b, z0, zGlass, crown: zk(0), under: under.id, curb: pack(curbB), glass: pack(glass), frame: Float32Array.from(lines) };
  }

  // the davits' arms (the viewer instances them): an arm in its own frame, the pivot at the origin, rising along +z and
  // reaching out along +y; L 3.0 m [bet], in at -15 degrees, swung out at 52 [appearance: the Welin quadrant's travel]
  const ARM = { L: 3.0, inDeg: -15, outDeg: 52, r: 0.09 };
  function davitArm() {
    const M = { b: { arm: bucket() }, solids: [], edges: [] }, L = ARM.L;
    const pts = [[0, 0, 0], [0, 0.05, L * 0.55], [0, 0.25, L * 0.85], [0, 0.6, L], [0, 0.95, L - 0.1]];
    for (let i = 0; i < pts.length - 1; i++) tube(M, 'arm', 'arm', pts[i], pts[i + 1], i ? ARM.r * 0.8 : ARM.r * 1.2, ARM.r * 0.8, 6);
    tube(M, 'quadrant', 'arm', [-0.12, -0.3, 0], [0.12, -0.3, 0], 0.32, 0.32, 10);
    return { pos: Float32Array.from(M.b.arm.pos), idx: Uint32Array.from(M.b.arm.idx), head: [0, 0.95, L - 0.1] };
  }
  // where a boat's davits stand: the two davit stations her station lies midway between (the people reader's BOATS and
  // STATION), and whether her arms are out for a state of hers (core/readers/people.js STATES)
  function davitsOf(stationX) {
    let best = null;
    for (let i = 0; i < DAVIT_X.length - 1; i++) {
      const a = DAVIT_X[i], b = DAVIT_X[i + 1]; if (Math.sign(a) !== Math.sign(b)) continue;
      const err = Math.abs((a + b) / 2 - stationX); if (!best || err < best.err) best = { fwd: Math.max(a, b), aft: Math.min(a, b), err };
    }
    return best;
  }
  const OUT_STATES = { swungOut: true, loading: true, lowering: true, away: true, floated: true, lost: true };
  const armsOut = (type, state) => type === 'cutter' || !!OUT_STATES[state];

  // =================================================================== the boats as they lay at 11:40 pm
  // Their sizes, length by beam by depth, m [read: the boats note 1.1: 30 ft x 9 ft 1 in x 4 ft; 25 ft 2 in x 7 ft 2 in
  // x 3 ft; 27 ft 5 in x 8 ft x 3 ft]: one table for site/parts/50_boats.js (the boats on a watch) and for the topsides'
  // boats on a damage preset. Collapsibles A and B folded on the officers' house's roof 5.3 m out from her centre line,
  // between funnel 1's casing and the roof's edge [bet: the topsides note 3.2, +/-0.5].
  const BOAT_DIM = { lifeboat: [9.14, 2.77, 1.22], cutter: [7.67, 2.18, 0.91], collapsible: [8.36, 2.44, 0.91], roof: [8.36, 2.44, 0.91] };
  const ROOF_BOATS = { y: 5.3 };
  // Where each of the people reader's twenty boats stands stowed, as site/parts/50_boats.js puts her while she is covered
  // (BP: core/readers/people.js; its BOATS, STATION, OUT): the lifeboats on their chocks 1.6 m inside the deck's edge,
  // their keels 0.4 m up; the cutters kept swung out [read], OUT m beyond the edge; collapsibles C and D folded on deck
  // abreast the cutters, 2.6 m inside the edge; A and B folded on the officers' house's roof. Ship frame: the keel's middle.
  function stowedBoats(BP) {
    return BP.BOATS.map((d, i) => {
      const st = BP.STATION[i], side = d.side === 'P' ? 1 : -1, [L, B, D] = BOAT_DIM[d.type], deck = st.z;
      let x = st.x, y, z, folded = false;
      if (d.type === 'cutter') { y = side * (st.edge + BP.OUT); z = deck + 0.4; }
      else if (d.type === 'roof') { x = d.stow.x; y = side * ROOF_BOATS.y; z = roofUnder(x, y).z; folded = true; }
      else if (d.type === 'collapsible') { y = side * (st.edge - 2.6); z = deck; folded = true; }
      else { y = side * (st.edge - 1.6); z = deck + 0.4; }
      return { id: d.id, type: d.type, x, y, z, L, B, D, folded };
    });
  }

  // the height of the yellow sheer line's foot at x (site/app.js's hull materials and site/parts/20_night_scene.js's)
  const sheerLineZ = (x) => C.deckZ('B', x) - N.strake;
  // the ship as built from these numbers and the core's staircases, once (site/visuals.js and site/app.js share it; it
  // is read, never changed)
  let BUILT = null;
  const built = () => BUILT || (BUILT = build());

  return {
    N, PSC, FRAME0, DAVIT_FRAMES, DAVIT_X, ARM, STERN, srcRise, srcDeckZ, rebase, deckEdge, frontX, aHouseHw, funnelGeom, mastAxis, nestOf,
    planStern, knuckleZ, hullDraw, useHull, build, built, dome, roofUnder, davitArm, davitsOf, armsOut, sheerLineZ, BOAT_DIM, ROOF_BOATS, stowedBoats,
    // colours of the buckets [read: Read's colour guide: white, a faded black, buff, black funnel tops, unpainted yellow
    // pine decks, medium and dark grey roofs, "dark mast" a dark brown; shades: appearance]. The page's own white, funnel,
    // funnel-top and X-ray mast colours are kept, so the looks' rules by colour hold (site/app.js, applyLook; the Night
    // look, site/parts/20_night_scene.js)
    COLORS: { white: 0xf2efe6, deck: 0xc2ab7c, grey: 0x8d9296, dark: 0x4c5156, black: 0x17191b, buff: 0xc78a3d, cap: 0x111111, mast: 0x5a4130, mastXray: 0xc9a46a,
      glass: 0x9fb9c8, window: 0x1c2730, arm: 0xeeeae0, rail: 0xe9e5db, rigging: 0x2b2f33, hullWhite: 0xe8e4da, sheer: 0xc9a03c, deckHull: 0xb59f72 },
  };
});
