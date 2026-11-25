/*
 * The boats and the people: a reader of the watch (core/night.js, "readers"; step 8 of
 * docs/BRAINSTORM_the_whole_night_v1_2026-11-17.md, section 5). Its state is sim.people.
 *
 * Twenty boats for 1,178 places, uncovered, loaded and lowered through the night by a model of places and minutes,
 * fitted to the launch record of 1912. Facts and rates are the research note's
 * (docs/research/RESEARCH_lifeboats_launch_sequence_v1_2026-11-17.md, "the note"; its section 11 is the specification),
 * each with its tag: [read] in a source the note opened, [derived] arithmetic on those, [bet] a judgement, no source.
 *
 * It counts places and minutes. It names nobody and draws no person: people are whole numbers moved between pools (on
 * board; waiting at a group of boats; in a boat; in the water). Nothing is drawn at random.
 *
 * What it reads, after the model's own step, and nothing else: her trim and list (sim.pitch, sim.roll); the height above
 * the sea of the boat deck's edge at each boat's davits (C.frameOf, C.worldZ: "the drop"); light on the boat deck (the
 * plant's dynamos, sim.plant.lights); her speed through the water, her place and heading (sim.mo); whether the sea is
 * in her (sim.openings); the touch (sim.night.tTouch); whether she has foundered. It writes sim.people and nothing else:
 * never the flooding, the motion, the ice or the plant, and nothing into sim.events, so a watch has the same fingerprint
 * with it and without (tools/people_tests.js). Left out on purpose: the weight of the people who leave her in the boats
 * (about 50 t against her 49,000: the brainstorm, section 2.2).
 *
 * A step, in order:
 *   1. The order to uncover: the officers' own, 20 minutes after the touch on a night that has let the sea in [read], or
 *      the player's (boats:uncover) at any time after the touch. The deck hands uncover and clear the fourteen lifeboats
 *      side by side and swing them out; the cutters are outboard already; collapsibles C and D are unfolded on deck and
 *      hooked to the cutters' davits once the cutters have gone; A and B are got down from the roof once C and D have
 *      gone (on the night neither reached the falls before the water did [read]).
 *   2. The call to the boats, 25 minutes after the order to uncover [derived: T 20 and T 45]. From then on the people on
 *      each quarter of the boat deck come forward to its boats, each with a chance a minute that rises with her trim
 *      (fitted: the fill jumped as the trim passed about 3.5 degrees [derived]). Men come forward only where the side's
 *      rule lets them in: more slowly under "women and children first" than under "fill her" [bet].
 *   3. Two parties of officers and hands, one to a side [read: the note, section 3.3], work the boats. A party loads up to
 *      two boats at once (one or two officers to a group [read]), in the order its group was worked on the night [read],
 *      hands each to the men on the falls, and moves to the other group on its side when it has no boat left to load where
 *      it is (RATE.follow; the other rule tried, going where people wait, fits the record no better).
 *   4. A boat is lowered once its party has given it its pace (fitted) and nobody more is waiting and it holds the fill
 *      asked (the officers' own: 30 % of her places [derived]; the player's boats:fill), or when it is full, or when
 *      nobody is left on that part of the deck to come, or when the water is near. By hand at 0.055 m/s over the drop
 *      the model gives at that station at that moment [derived]: slower with trim, with way on, when she bears on the
 *      high side, in the dark; not at all above 5 knots. A minute to release and clear, and she is away.
 *   5. A station within 2 m of the sea launches nothing more: a boat still there floats off [bet: 2 m]. When she founders
 *      the people still aboard are in the water, and a boat still at its davits goes with her.
 *
 * The orders it owns (each a logged order type of the watch, so a watch with them replays bit for bit):
 *   boats:uncover 'now'                                    uncover the boats now (after the touch; once)
 *   boats:rule    'only' | 'first' | 'fill', 'port' | 'starboard' | 'both'
 *                 women and children only / women and children first / fill her (all comers, and lowered full)
 *   boats:fill    0.3 | 0.5 | 0.75 | 1                     how full a boat must be before it is lowered
 * An order that cannot be carried out is refused, and sim.people.refused says why.
 *
 * Known consequence, reported and not patched: it reads the model's own list, which is too small late in the night
 * (README, "Known gaps: List"), so the gap at the last port boats is understated (tools/people_tests.js reports it).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../core.js'), require('../motion.js'), require('../night.js'));
  else root.TitanicPeople = factory(root.TitanicCore, root.TitanicMotion, root.TitanicNight);
})(typeof self !== 'undefined' ? self : this, function (C, Mo, N) {
  'use strict';
  const DEG = Math.PI / 180, KN = Mo && Mo.KN ? Mo.KN : 1852 / 3600, MIN = 60;

  // ------------------------------------------------------------------ the boats (the note, 11.1)
  // id; side (S starboard, P port: odd numbers starboard [read]); g, the group: 0 starboard forward, 1 starboard after,
  // 2 port forward, 3 port after [read]; x, the boat's station in metres forward of amidships, midway between her
  // davits [derived: the davits stand at frames 72F, 61F, 50F, 39F and 28F and at 35A, 46A, 57A, 68A and 79A, three feet
  // a frame, each a few inches off its frame: docs/research/RESEARCH_topsides_dimensions_v1_2026-11-19.md; until
  // 2026-11-19 these were placed from landmarks, 2 to 6 m off]; cap, places [read]; type; man, the hands who go with her to man her [bet: the
  // note's "to man in the water"]; davits, for a collapsible: the cutter whose davits she is launched from [read]; after:
  // the boat that must have gone from those davits first [read: A was meant for boat 1's davits after C]; stow, where she
  // stands until hooked on (x, and roof for the officers' house) [bet].
  // rec: the record, for the tests and the fit only (the model never reads it): T, minutes after 11:40 pm when she was
  // lowered on Wormstedt, Fitch and Behe's times, and n, the number aboard at lowering by Wormstedt and Fitch [read: the
  // note, 3.2 and 11.1]; A and B floated off at about T 155 to 160 [read].
  const BOATS = [
    { id: '7', side: 'S', g: 0, x: 30.03, cap: 65, type: 'lifeboat', man: 4, rec: { T: 60, n: 28 } },
    { id: '5', side: 'S', g: 0, x: 40.23, cap: 65, type: 'lifeboat', man: 4, rec: { T: 64, n: 36 } },
    { id: '3', side: 'S', g: 0, x: 50.55, cap: 65, type: 'lifeboat', man: 4, rec: { T: 75, n: 32 } },
    { id: '1', side: 'S', g: 0, x: 60.71, cap: 40, type: 'cutter', man: 3, rec: { T: 85, n: 12 } },
    { id: '9', side: 'S', g: 1, x: -36.57, cap: 65, type: 'lifeboat', man: 4, rec: { T: 110, n: 40 } },
    { id: '11', side: 'S', g: 1, x: -46.79, cap: 65, type: 'lifeboat', man: 4, rec: { T: 115, n: 50 } },
    { id: '13', side: 'S', g: 1, x: -56.87, cap: 65, type: 'lifeboat', man: 4, rec: { T: 120, n: 55 } },
    { id: '15', side: 'S', g: 1, x: -67.01, cap: 65, type: 'lifeboat', man: 4, rec: { T: 121, n: 68 } },
    { id: '8', side: 'P', g: 2, x: 30.03, cap: 65, type: 'lifeboat', man: 4, rec: { T: 80, n: 25 } },
    { id: '6', side: 'P', g: 2, x: 40.23, cap: 65, type: 'lifeboat', man: 4, rec: { T: 90, n: 23 } },
    { id: '4', side: 'P', g: 2, x: 50.55, cap: 65, type: 'lifeboat', man: 4, rec: { T: 130, n: 30 } },
    { id: '2', side: 'P', g: 2, x: 60.71, cap: 40, type: 'cutter', man: 3, rec: { T: 125, n: 17 } },
    { id: '16', side: 'P', g: 3, x: -67.01, cap: 65, type: 'lifeboat', man: 4, rec: { T: 100, n: 53 } },
    { id: '14', side: 'P', g: 3, x: -56.87, cap: 65, type: 'lifeboat', man: 4, rec: { T: 105, n: 40 } },
    { id: '12', side: 'P', g: 3, x: -46.79, cap: 65, type: 'lifeboat', man: 4, rec: { T: 110, n: 42 } },
    { id: '10', side: 'P', g: 3, x: -36.57, cap: 65, type: 'lifeboat', man: 4, rec: { T: 130, n: 57 } },
    { id: 'C', side: 'S', g: 0, x: 60.71, cap: 47, type: 'collapsible', man: 3, davits: '1', stow: { x: 60.71 }, rec: { T: 140, n: 43 } },
    { id: 'D', side: 'P', g: 2, x: 60.71, cap: 47, type: 'collapsible', man: 3, davits: '2', stow: { x: 60.71 }, rec: { T: 145, n: 20 } },
    { id: 'A', side: 'S', g: 0, x: 60.71, cap: 47, type: 'roof', man: 3, davits: '1', after: 'C', stow: { x: 55, roof: true }, rec: { T: null, float: [155, 160] } },
    { id: 'B', side: 'P', g: 2, x: 60.71, cap: 47, type: 'roof', man: 3, davits: '2', after: 'D', stow: { x: 55, roof: true }, rec: { T: null, float: [155, 155] } },
  ];
  const NB = BOATS.length, IDX = {};
  BOATS.forEach((b, i) => { IDX[b.id] = i; });
  // the order in which each group's boats were worked on the night [read: the note, 3.2 and 3.3], the collapsibles after
  // the cutters whose davits they take [read]
  const WORK = [['7', '5', '3', '1', 'C', 'A'], ['9', '11', '13', '15'], ['8', '6', '2', '4', 'D', 'B'], ['16', '14', '12', '10']].map(l => l.map(id => IDX[id]));
  const GROUPS = [{ id: 'Sf', side: 'S', name: 'starboard forward' }, { id: 'Sa', side: 'S', name: 'starboard after' }, { id: 'Pf', side: 'P', name: 'port forward' }, { id: 'Pa', side: 'P', name: 'port after' }];
  const OTHER = [1, 0, 3, 2];
  const PLACES = BOATS.reduce((a, b) => a + b.cap, 0);   // 1,178 [read]

  // where each boat is launched from: the boat deck's edge at her davits (ship frame: x forward, y to port, z up). The
  // edge is the hull's moulded half-breadth at the boat deck there (core/core.js), a little inside the davits [derived].
  // G24: on the ship's own hull, her ends with it (since the calibration's landing they widen her above 11.0 m): the
  // default ship's, C.buildShip().hull, built once when first asked, the same object a page or a watch of the default
  // ship carries (as site/topsides.js's useHull has by default), so that the drawn deck's edge and the stations agree
  let STATION_ = null;
  function stations() {
    if (STATION_) return STATION_;
    const H = C.buildShip().hull;
    return (STATION_ = BOATS.map(b => { const z = C.deckZ('Boat', b.x), e = C.halfBreadth(b.x, z, H); return { x: b.x, y: b.side === 'P' ? e : -e, z, edge: e }; }));
  }
  const OUT = 1.5;          // m from the deck's edge to the centre of a boat swung out [bet: a 9 ft 1 in boat clear of the side]

  // ------------------------------------------------------------------ the people
  // aboard at 11:40 pm: 2,201, the Court's count [read: the note 1.3]; of them women and children 534 [bet: 402 women and
  // 109 children among the passengers and 23 women in the crew, as remembered from the Court's table "Numbers Saved";
  // the note did not record the split, so check it there before leaning on it]. Each quarter of the boat deck (a group
  // of boats) draws on a quarter of each [bet].
  const PEOPLE = { aboard: 2201, wc: 534 };

  // ------------------------------------------------------------------ the rates (the note, 11.2)
  const T = {
    uncoverAfter: 20,     // min after the touch: the Captain's order to uncover, on a night that has let the sea in [read]
    uncover: 17.5,        // min to uncover a lifeboat and clear her falls, two or three hands, all fourteen side by side [read: 15 to 20]
    swing: 2.5,           // min to swing her out once cleared [read: 2 to 3]
    cutter: 5,            // min to ready a cutter, kept swung out at sea [bet]
    fold: 17.5,           // min to unfold a collapsible on deck and raise her sides [bet: the note's 15 to 20]
    hook: 3,              // min to hook a collapsible to a cutter's davits once the cutter has gone [bet]
    roof: 15,             // min to get A or B down from the officers' house with six to ten men [bet: the note's 10 to 20]
    call: 25,             // min from the order to uncover to the call to the boats [derived: T 20 and T 45 on the night]
    walk: 2,              // min for a party to move between the forward and after groups, about 100 m [bet]
    release: 1,           // min to release the falls and clear the side once afloat [derived: the note, "a minute more"]
  };
  const RATE = {
    load: 4.5,            // persons a minute into a boat with people waiting [derived: 3 to 6, a boat in 10 to 15 min]
    lower: 0.055,         // m/s by hand [derived: 60 ft in 5 to 6 minutes]
    gapL: 3, gap0: 0.3,   // the gap at a boat on the low side: g = gap0 + gapL sin(list), m [derived; L and g0 bets]
    gapHalf: 0.6, gapJump: 1.0,   // full rate below 0.6 m, half to 1.0 m, a quarter beyond (by jumping) [bet]
    reach: 0.75,          // m the davits hold a boat off the side: one on the high side bears on it below reach / sin(list) [bet: 0.5 to 1]
    noLower: 15,          // deg of list away from a boat beyond which she cannot be lowered [bet]
    trimSlow: 0.1,        // lowering time +10 % for each degree of trim beyond 5 [bet]
    wayFull: 1, wayNone: 5,   // knots: lowering as usual up to 1, half to 5, none above 5 [read: 5 kn, today's design limit;
                              // bet: 1, the boats note's proposal (launching normal at 1 knot or less). Until M7 it was 3,
                              // because the model kept 1 to 2 knots of way all night; since M7 she is under 1 knot from
                              // T+59.6, before the first boat (T+66.5), so 1 fits the same on the 1912 orders (Bo, 18 Nov.)]
    dark: 0.5,            // the work at the boats goes at half pace with no light on the boat deck [bet]
    lowStation: 2,        // m: a station this near the sea launches nothing; a boat there floats off [bet: the note's "about 2 m"]
    near: 4,              // m: the water this near, a loaded boat is lowered at once whatever she holds [bet]
    minFill: 0.3,         // the officers' own: no boat lowered with fewer than this share of her places (the smallest of the
                          // night: boat 1, 12 of 40; boat 6, 23 of 65) [derived]
    menFirst: 0.5,        // men come forward this much more slowly than women and children under "women and children first" [bet]
    tauWater: 17.5,       // min: survival in water near 0 C taken as exp(-t / tau) [bet: the note's 15 to 20]. Reported, never drawn
    jumpTrim: 3.5, jumpWidth: 0.25,   // deg: willingness rises across this trim [derived: the note, 3.2 at 12:55, 4.0 at 1:20];
                                      // the width [bet]
    follow: 'group',      // how a party chooses its group: 'group', work it to the end; or 'people', go where people wait
                          // (party(), below). On the 1912 record the two fit alike (tools/calibrate_people.js): the simpler stands
  };
  // fitted to the 1912 launch record by tools/calibrate_people.js: kLo and kHi, the chance a minute that a person on the boat
  // deck comes forward to a boat, well below and well above the trim of the jump; pace, the minutes a party gives a boat
  // before it will lower her (compare WFB's estimate of a boat's loading, 10 to 15 minutes [read]). The fit of 17 November:
  // 14 of the 18 within ten minutes of the re-examined times, 664 in them against 671; outside: 4 and 2 (port forward,
  // 40 and 32 minutes early: boat 4 hung at A deck for its windows, which the model leaves out), 11 (11 early), C (16 early).
  // Refitted 18 November on M7 (a stopped screw's drag: her way after the ice): the same 14 and the same four outside
  // (4 and 2 40 and 32 early, 11 11, C 16), 661 against 671; before it { kLo: 0.00185, kHi: 0.0421, pace: 8 }.
  // Refitted 23 November at G12's switch (D98: the watch ends at her hand-over, the break's onset), the fit having stood
  // off its optimum since the calibration epoch's landing (stage D; U0's finding, with and without its stations' mend):
  // J 0.896, 11 of the 18 within ten minutes, 677 in them against 671; collapsible A away, B lost with her at the
  // hand-over (T 156.46, before the record's floating-off at 155 to 160). Before it { kLo: 0.002, kHi: 0.04, pace: 8 }
  const FIT = { kLo: 0.000603, kHi: 0.08, pace: 8 };
  const RULES = ['only', 'first', 'fill'], FILLS = [0.3, 0.5, 0.75, 1], SIDES = { port: ['P'], starboard: ['S'], both: ['P', 'S'] };
  const MEN = { only: 0, first: RATE.menFirst, fill: 1 };
  const STATES = ['covered', 'cleared', 'swungOut', 'loading', 'lowering', 'away', 'floated', 'lost'];

  // ------------------------------------------------------------------ state
  function fresh() {
    const wc = [], men = [];
    for (let g = 0; g < 4; g++) {     // a quarter of each to each group, the remainders to the first groups
      wc.push(Math.floor(PEOPLE.wc / 4) + (g < PEOPLE.wc % 4 ? 1 : 0));
      const m = PEOPLE.aboard - PEOPLE.wc;
      men.push(Math.floor(m / 4) + (g < m % 4 ? 1 : 0));
    }
    return {
      damaged: false, tDamage: -1, uncoverT: -1, uncoverBy: null, callT: -1, over: false, tFounder: -1,
      rule: { S: 'first', P: 'only' },      // the night's: starboard "first", port "only" [read: the note 4.1]
      fill: RATE.minFill,
      boats: BOATS.map(() => ({ state: 'covered', n: 0, wc: 0, men: 0, prep: 0, prepT: -1, hook: -1, credit: 0, loadT: 0, low: 0, h: NaN, drop: NaN, waterT: 0,
        party: -1, slot: -1, tReady: -1, tLoad: -1, tLower: -1, tWater: -1, tAway: -1, tFloat: -1, tLost: -1, gap: NaN, list: NaN, kn: NaN, place: null })),
      groups: GROUPS.map((G, g) => ({ R: [wc[g], men[g]], Q: [0, 0], credit: [0, 0] })),
      parties: [{ side: 'S', g: 0, walk: 0, slots: [-1, -1] }, { side: 'P', g: 2, walk: 0, slots: [-1, -1] }],
      water: 0, orders: [], refused: [], log: [],
      count: { aboard: PEOPLE.aboard, inBoats: 0, inBoatsAway: 0, water: 0, boatsAway: 0, emptyAway: 0, floated: 0, lost: 0, total: PEOPLE.aboard },
      obs: { t: 0, dt: 0.25, tTouch: -1, damaged: false, foundered: false, trim: 0, list: 0, kn: 0, light: true, X: 0, Y: 0, psi: 0, drop: new Float64Array(NB) },
    };
  }

  // what the model shows the boats this step
  function observe(sim, o) {
    const F = C.frameOf(sim), m = sim.mo, w = sim.night;
    o.t = sim.t; o.dt = sim.params.dt; o.tTouch = w ? w.tTouch : -1;
    o.damaged = sim.openings.length > 0; o.foundered = !!(N && N.over ? N.over(sim) : sim.foundered);
    o.trim = sim.pitch / DEG; o.list = sim.roll / DEG;                    // + by the head; + starboard down
    o.kn = m ? Math.sqrt(m.u * m.u + m.v * m.v) / KN : 0;
    o.light = sim.plant ? sim.plant.lights > 0 : true;                    // either set of dynamos lights the boat deck [read]
    o.X = m ? m.X : 0; o.Y = m ? m.Y : 0; o.psi = m ? m.psi : 0;
    const ST = stations();
    for (let i = 0; i < NB; i++) { const s = ST[i]; o.drop[i] = C.worldZ(F, s.x, s.y, s.z); }
    return o;
  }

  // ------------------------------------------------------------------ the step
  const sigma = (x) => 1 / (1 + C.exp(-x));
  function willing(trim, F) { return F.kLo + (F.kHi - F.kLo) * sigma((Math.abs(trim) - RATE.jumpTrim) / RATE.jumpWidth); }
  const isGone = (b) => b.state === 'away' || b.state === 'floated' || b.state === 'lost';
  const onDeck = (b) => b.state === 'covered' || b.state === 'cleared' || b.state === 'swungOut' || b.state === 'loading';
  function note(P, t, id, what) { P.log.push({ t, id, what }); }
  // where on the earth a point of her side is (motion's frame: x north, y east; the ship's y to port)
  function placeOf(o, i) {
    const s = stations()[i], c = C.cos(o.psi), sn = C.sin(o.psi), yS = -(s.y + (s.y > 0 ? OUT : -OUT));   // to starboard
    const X = o.X + s.x * c - yS * sn, Y = o.Y + s.x * sn + yS * c, out = BOATS[i].side === 'S' ? 1 : -1;
    return { X, Y, dx: -sn * out, dy: c * out, psi: o.psi };
  }

  function uncover(P, t, by) { P.uncoverT = t; P.uncoverBy = by; note(P, t, null, by === 'order' ? 'The order to uncover the boats (yours)' : 'The officers\' order to uncover the boats'); }

  function tick(P, o, F) {
    F = F || FIT;
    if (P.over) return;
    const t = o.t, dt = o.dt, work = o.light ? 1 : RATE.dark, B = P.boats;
    // 1. the sea in her; the officers' order to uncover; the call to the boats
    if (!P.damaged && o.damaged) { P.damaged = true; P.tDamage = t; }
    if (P.uncoverT < 0 && P.damaged && o.tTouch >= 0 && t >= o.tTouch + T.uncoverAfter * MIN) uncover(P, t, 'officers');
    if (P.callT < 0 && P.damaged && P.uncoverT >= 0 && t >= P.uncoverT + T.call * MIN) { P.callT = t; note(P, t, null, 'The call to the boats: women and children first to the boat deck'); }
    for (let i = 0; i < NB; i++) B[i].drop = o.drop[i];
    // 2. she has gone: everyone still aboard is in the water; a boat still at her davits goes with her
    if (o.foundered) { founder(P, o); count(P); return; }
    // 3. the hands at the boats
    if (P.uncoverT >= 0) prepare(P, o, work);
    // 4. the people come forward, once called
    if (P.callT >= 0) forward(P, o, F);
    // 5. the parties choose their work; the boats being loaded take on their people and are handed to the falls
    if (P.callT >= 0) for (let p = 0; p < P.parties.length; p++) party(P, p, o, F, work);
    for (let i = 0; i < NB; i++) if (B[i].state === 'loading') load(P, i, o, F, work);
    // 6. the boats in the falls
    for (let i = 0; i < NB; i++) if (B[i].state === 'lowering') lower(P, i, o, work);
    // 7. a station the sea has reached launches nothing more: what is still there floats off
    for (let i = 0; i < NB; i++) {
      const b = B[i];
      if (onDeck(b) && o.drop[i] <= RATE.lowStation) {
        release(P, b);
        b.state = 'floated'; b.tFloat = t; b.h = 0; b.place = placeOf(o, i);
        note(P, t, BOATS[i].id, 'floats off' + (b.n ? ' with ' + b.n + ' in her' : ', empty'));
      }
      if (b.state === 'covered' || b.state === 'cleared' || b.state === 'swungOut' || b.state === 'loading') b.h = o.drop[i];
    }
    count(P);
  }

  // the hands uncover and clear the lifeboats side by side and swing them out; ready the cutters; unfold C and D and hook
  // them on once the cutters have gone; get A and B down once C and D have gone
  function prepare(P, o, work) {
    const t = o.t, dt = o.dt, B = P.boats;
    for (let i = 0; i < NB; i++) {
      const b = B[i], d = BOATS[i];
      if (b.state !== 'covered' && b.state !== 'cleared') continue;
      if (d.type === 'roof' && b.prepT < 0) { const a = B[IDX[d.after]]; if (!isGone(a)) continue; }   // A and B wait for C and D
      if (b.prepT < 0) b.prepT = t;
      b.prep += dt * work / MIN;            // minutes of work done
      if (d.type === 'lifeboat') {
        if (b.state === 'covered' && b.prep >= T.uncover) { b.state = 'cleared'; }
        if (b.state === 'cleared' && b.prep >= T.uncover + T.swing) { b.state = 'swungOut'; b.tReady = t; }
      } else if (d.type === 'cutter') {
        if (b.prep >= T.cutter) { b.state = 'swungOut'; b.tReady = t; }
      } else {                              // C and D unfolded; A and B got down; then hooked on once the davits are free
        if (b.state === 'covered' && b.prep >= (d.type === 'roof' ? T.roof : T.fold)) b.state = 'cleared';
        if (b.state === 'cleared') {
          const c = B[IDX[d.davits]], before = d.after ? B[IDX[d.after]] : null;
          if (isGone(c) && (!before || isGone(before))) {
            if (b.hook < 0) b.hook = 0;
            b.hook += dt * work / MIN;
            if (b.hook >= T.hook) { b.state = 'swungOut'; b.tReady = t; }
          }
        }
      }
    }
  }

  // each person on a quarter of the deck comes forward with a chance a minute that rises with her trim; men only where the
  // side's rule lets them in. Whole persons: the expected arrivals accumulate and move when they make one.
  function forward(P, o, F) {
    const k = willing(o.trim, F);
    for (let g = 0; g < 4; g++) {
      const G = P.groups[g], mu = MEN[P.rule[GROUPS[g].side]];
      for (let j = 0; j < 2; j++) {
        const h = j === 0 ? k : k * mu;
        if (!(h > 0) || G.R[j] <= 0) continue;
        G.credit[j] += G.R[j] * (1 - C.exp(-h * o.dt / MIN));
        const move = Math.min(G.R[j], Math.floor(G.credit[j]));
        if (move > 0) { G.R[j] -= move; G.Q[j] += move; G.credit[j] -= move; }
      }
    }
  }
  // who the rule lets into a boat at group g: waiting now, and still to come
  function waiting(P, g) { const G = P.groups[g]; return P.rule[GROUPS[g].side] === 'only' ? G.Q[0] : G.Q[0] + G.Q[1]; }
  function toCome(P, g) { const G = P.groups[g], r = P.rule[GROUPS[g].side]; return r === 'only' ? G.R[0] + G.Q[0] : (G.R[0] + G.Q[0] + (MEN[r] > 0 ? G.R[1] : 0) + G.Q[1]); }
  // the next boat a party could start loading at group g, in the order of the night
  function nextBoat(P, g) { for (const i of WORK[g]) if (P.boats[i].state === 'swungOut') return i; return -1; }

  // the people the next boat at group g could expect within a party's pace: those waiting, and those likely to come
  function expected(P, g, o, F) {
    const G = P.groups[g], mu = MEN[P.rule[GROUPS[g].side]];
    return waiting(P, g) + (G.R[0] + mu * G.R[1]) * (1 - C.exp(-willing(o.trim, F) * F.pace));
  }
  // A party has two loading points (one or two officers to a group [read: the note 11.2]). With both free it chooses its
  // group. RATE.follow 'group' (the reader's): it stays while a boat there is ready to load, and moves to the other group on
  // its side when none is. 'people' (tried in the calibration): it also leaves when its next boat could not expect the
  // officers' minimum within its pace while people enough to fill a boat wait at the other group [bet: "the port boats
  // waited for passengers" while the officers worked aft, the note 3.3]. A free loading point takes the next boat ready
  // at the party's group.
  function party(P, p, o, F, work) {
    const pt = P.parties[p];
    if (pt.walk > 0) { pt.walk -= o.dt * work / MIN; if (pt.walk > 0) return; pt.walk = 0; }
    if (pt.slots[0] < 0 && pt.slots[1] < 0) {
      const g = pt.g, other = OTHER[g], here = nextBoat(P, g), there = nextBoat(P, other);
      const stay = here >= 0 && (there < 0 || RATE.follow === 'group' || expected(P, g, o, F) >= RATE.minFill * BOATS[here].cap ||
        waiting(P, other) < BOATS[there].cap);
      if (!stay) { if (there >= 0) { pt.g = other; pt.walk = T.walk; } return; }
    }
    for (let s = 0; s < pt.slots.length; s++) {
      if (pt.slots[s] >= 0) continue;
      const i = nextBoat(P, pt.g); if (i < 0) return;
      const b = P.boats[i];
      b.state = 'loading'; b.tLoad = o.t; b.loadT = 0; b.credit = 0; b.party = p; b.slot = s; pt.slots[s] = i;
    }
  }
  function release(P, b) { if (b.party >= 0) { P.parties[b.party].slots[b.slot] = -1; b.party = -1; b.slot = -1; } }

  // the gap at a boat on the low side, m (the note, section 5)
  function gapAt(i, list) {
    const side = BOATS[i].side, lowSide = (side === 'P' && list < 0) || (side === 'S' && list > 0);
    return RATE.gap0 + (lowSide ? RATE.gapL * C.sin(Math.abs(list) * DEG) : 0);
  }
  // list away from a boat (her side high), deg
  function listAway(i, list) { return BOATS[i].side === 'S' ? -list : list; }
  function wayFactor(kn) { return kn <= RATE.wayFull ? 1 : (kn <= RATE.wayNone ? 0.5 : 0); }

  function load(P, i, o, F, work) {
    const b = P.boats[i], d = BOATS[i], g = d.g, G = P.groups[g], rule = P.rule[d.side];
    b.loadT += o.dt * work / MIN;
    // people step in at the load rate, slower across a gap; women and children first, men where the rule lets them
    const gap = gapAt(i, o.list), gf = gap < RATE.gapHalf ? 1 : (gap < RATE.gapJump ? 0.5 : 0.25);
    b.credit += RATE.load * work * gf * o.dt / MIN;
    while (b.credit >= 1 && b.n + d.man < d.cap) {
      let j = -1;
      if (G.Q[0] > 0) j = 0; else if (rule !== 'only' && G.Q[1] > 0) j = 1;
      if (j < 0) break;
      G.Q[j]--; b.n++; if (j === 0) b.wc++; else b.men++; b.credit -= 1;
    }
    if (b.credit > 1) b.credit = 1;           // nobody waiting: the rate is not banked
    // the officer's word to lower
    const held = b.n + d.man, full = held >= d.cap, want = rule === 'fill' ? 1 : P.fill;
    const near = o.drop[i] <= RATE.near, gone = toCome(P, g) < 1;
    const ready = b.loadT >= F.pace && (full || gone || (held >= want * d.cap && waiting(P, g) < 1));
    if (!(ready || near)) return;
    if (wayFactor(o.kn) <= 0 || listAway(i, o.list) > RATE.noLower) return;   // she cannot be lowered now: she waits, loaded
    // her hands come aboard from the men on that part of the deck, else from anywhere aboard
    let need = d.man;
    for (let k = 0; k < 4 && need > 0; k++) {
      const H = P.groups[(g + k) % 4];
      const r = Math.min(need, H.R[1]); H.R[1] -= r; need -= r;
      const q = Math.min(need, H.Q[1]); H.Q[1] -= q; need -= q;
    }
    const crew = d.man - need;
    b.n += crew; b.men += crew;
    b.state = 'lowering'; b.tLower = o.t; b.low = 0; b.h = o.drop[i];
    b.gap = gap; b.list = o.list; b.kn = o.kn;
    release(P, b);
  }

  function lower(P, i, o, work) {
    const b = P.boats[i];
    if (b.tWater >= 0) {                      // afloat: the falls released, she pulls clear
      b.h = 0; b.waterT += o.dt / MIN;
      if (b.waterT >= T.release) { b.state = 'away'; b.tAway = o.t; note(P, o.t, BOATS[i].id, 'away with ' + b.n); }
      return;
    }
    const away = listAway(i, o.list);
    let v = RATE.lower * work * wayFactor(o.kn) / (1 + RATE.trimSlow * Math.max(0, Math.abs(o.trim) - 5));
    if (away > RATE.noLower) v = 0;
    else if (away > 0 && RATE.gapL + b.low > RATE.reach / C.sin(away * DEG)) v *= 0.5;   // she bears on the side
    b.low += v * o.dt;
    b.h = o.drop[i] - b.low;
    if (b.h <= 0 || o.drop[i] <= RATE.lowStation) { b.h = 0; b.tWater = o.t; b.waterT = 0; b.place = placeOf(o, i); }
  }

  function founder(P, o) {
    const t = o.t;
    P.over = true; P.tFounder = t;
    for (let i = 0; i < NB; i++) {
      const b = P.boats[i];
      if (b.state === 'lowering') {
        if (b.tWater >= 0) { b.state = 'away'; b.tAway = t; note(P, t, BOATS[i].id, 'away with ' + b.n); }
        else { b.state = 'floated'; b.tFloat = t; b.h = 0; b.place = placeOf(o, i); note(P, t, BOATS[i].id, 'cut free as she goes, ' + b.n + ' in her'); }
      } else if (onDeck(b)) {
        P.water += b.n; b.state = 'lost'; b.tLost = t; b.h = NaN;
        release(P, b);
        note(P, t, BOATS[i].id, 'goes down with her' + (b.n ? ', ' + b.n + ' in her' : ''));
      }
    }
    for (const G of P.groups) { P.water += G.R[0] + G.R[1] + G.Q[0] + G.Q[1]; G.R[0] = G.R[1] = G.Q[0] = G.Q[1] = 0; }
    note(P, t, null, 'She founders');
  }

  function count(P) {
    const c = P.count;
    let aboard = 0, inBoats = 0, inAway = 0, away = 0, empty = 0, floated = 0, lost = 0;
    for (const G of P.groups) aboard += G.R[0] + G.R[1] + G.Q[0] + G.Q[1];
    for (let i = 0; i < NB; i++) {
      const b = P.boats[i];
      if (b.state === 'lost') { lost++; continue; }
      inBoats += b.n;
      if (b.state === 'away') { away++; inAway += b.n; empty += BOATS[i].cap - b.n; }
      if (b.state === 'floated') floated++;
    }
    c.aboard = aboard; c.inBoats = inBoats; c.inBoatsAway = inAway; c.water = P.water; c.boatsAway = away; c.emptyAway = empty;
    c.floated = floated; c.lost = lost; c.total = aboard + inBoats + P.water;
  }

  // ------------------------------------------------------------------ the reader
  function attach(sim) { sim.people = fresh(); return sim.people; }
  function step(sim) { const P = sim.people; if (!P) return; tick(P, observe(sim, P.obs)); }

  // the orders: why one would be refused now (null: it would be carried out)
  function valid(type, value, arg) {
    if (type === 'boats:uncover') return value === 'now' && arg === undefined;
    if (type === 'boats:rule') return RULES.indexOf(value) >= 0 && typeof arg === 'string' && Object.prototype.hasOwnProperty.call(SIDES, arg);
    if (type === 'boats:fill') return typeof value === 'number' && FILLS.indexOf(value) >= 0 && arg === undefined;
    return false;
  }
  const RULE_WORDS = { only: 'women and children only', first: 'women and children first', fill: 'fill her' };
  const SIDE_WORDS = { P: 'port', S: 'starboard' };
  function why(sim, type, value, arg) {
    const P = sim.people;
    if (!P) return 'There are no boats on this run';
    if (!valid(type, value, arg)) return 'That is not an order the boats know';
    if (sim.foundered || P.over) return 'She has gone: there is nothing left to order';
    if (type === 'boats:uncover') {
      if (!(sim.night && sim.night.tTouch >= 0)) return 'Nothing calls for the boats yet: she has not touched the ice';
      if (P.uncoverT >= 0) return 'The boats are already being uncovered, since ' + Math.round((P.uncoverT - sim.night.tTouch) / MIN) + ' min after the touch';
      return null;
    }
    const open = (s) => P.boats.some((b, i) => BOATS[i].side === s && onDeck(b));
    if (type === 'boats:rule') {
      const sides = SIDES[arg];
      if (sides.every(s => P.rule[s] === value)) return 'That is already the rule on the ' + (sides.length > 1 ? 'both sides' : SIDE_WORDS[sides[0]] + ' side') + ': ' + RULE_WORDS[value];
      if (!sides.some(open)) return 'No boat is left to load on the ' + (sides.length > 1 ? 'either side' : SIDE_WORDS[sides[0]] + ' side');
      return null;
    }
    if (type === 'boats:fill') {
      if (P.fill === value) return 'That is already the order: lower a boat once she holds ' + Math.round(value * 100) + ' % of her places';
      if (!open('P') && !open('S')) return 'Every boat has gone';
      return null;
    }
    return 'That is not an order the boats know';
  }
  function give(type) {
    return function (sim, value, arg) {
      const P = sim.people, no = why(sim, type, value, arg);
      if (no) { if (P) P.refused.push({ k: sim.night ? sim.night.k : -1, t: sim.t, type, value, arg, why: no }); return false; }
      if (type === 'boats:uncover') uncover(P, sim.t, 'order');
      else if (type === 'boats:rule') { for (const s of SIDES[arg]) P.rule[s] = value; note(P, sim.t, null, 'Your order: ' + RULE_WORDS[value] + ', ' + (arg === 'both' ? 'both sides' : arg + ' side')); }
      else if (type === 'boats:fill') { P.fill = value; note(P, sim.t, null, 'Your order: lower a boat once she holds ' + Math.round(value * 100) + ' % of her places'); }
      P.orders.push({ k: sim.night ? sim.night.k : -1, t: sim.t, type, value, arg });
      return true;
    };
  }
  const ORDERS = { 'boats:uncover': give('boats:uncover'), 'boats:rule': give('boats:rule'), 'boats:fill': give('boats:fill') };

  // ------------------------------------------------------------------ what it says
  // the count, and each boat: everything a page or a test needs, as plain data
  function readouts(sim) {
    const P = sim && sim.people; if (!P) return null;
    const c = P.count, tT = sim.night ? sim.night.tTouch : -1;
    return {
      aboard: c.aboard, inBoats: c.inBoats, inBoatsAway: c.inBoatsAway, water: c.water, total: c.total, boatsAway: c.boatsAway, emptyAway: c.emptyAway,
      floated: c.floated, lost: c.lost, places: PLACES, boats: NB, aboardAtStart: PEOPLE.aboard,
      rule: { port: P.rule.P, starboard: P.rule.S }, fill: P.fill, uncoverT: P.uncoverT, uncoverBy: P.uncoverBy, callT: P.callT, tTouch: tT, tFounder: P.tFounder,
      parties: P.parties.map(p => ({ side: p.side, group: GROUPS[p.g].name, walking: p.walk > 0, boats: p.slots.filter(i => i >= 0).map(i => BOATS[i].id) })),
      list: P.boats.map((b, i) => ({ id: BOATS[i].id, side: BOATS[i].side, group: GROUPS[BOATS[i].g].name, cap: BOATS[i].cap, state: b.state, n: b.n, h: b.h, drop: b.drop,
        tLower: b.tLower, tWater: b.tWater, tAway: b.tAway, tFloat: b.tFloat, tLost: b.tLost, place: b.place })),
    };
  }
  // the people in the water still alive t seconds after she went, by the survival bet (RATE.tauWater): a number, plainly
  function aliveInWater(sim, after) { const P = sim.people; if (!P || P.tFounder < 0) return 0; return P.water * C.exp(-Math.max(0, after) / (RATE.tauWater * MIN)); }
  function stateOf(i) { return STATES.indexOf(i); }

  const API = { BOATS, GROUPS, WORK, get STATION() { return stations(); }, OUT, PEOPLE, T, RATE, FIT, RULES, FILLS, STATES, PLACES, RULE_WORDS, IDX,
    fresh, observe, tick, willing, attach, step, valid, why, readouts, aliveInWater, gapAt, stateOf, ORDERS };
  if (N && N.reader) N.reader({ name: 'boats', state: 'people', attach, step, orders: ORDERS, valid });
  return API;
});
