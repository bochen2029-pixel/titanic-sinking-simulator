// Scenario presets shared by the viewer and the headless tools.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./core.js'));
  else root.TitanicScenarios = factory(root.TitanicCore);
})(typeof self !== 'undefined' ? self : this, function (C) {
  'use strict';
  const A4 = 0.210 * 0.297;
  // m2 aggregate opening, fitted to the eyewitness timeline and the 1912 watch's founder (8.82 sq ft; G7's refit with
  // the forepeak's tank and G11's widths, `node tools/calibrate.js 45`, D73's bounds, the watch held on both of its
  // branches (G18); rung 2b of docs/research/RESULT_G7_ladder_v1_1_2026-11-21.md). It was 0.7853 (8.45 sq ft; G6b's
  // refit) before the tank held the forepeak's water to the orlop, and 0.7506 (8.1 sq ft) while boiler room 5 flooded
  // through its side from the start and the split was the water held; the sources give 9 to 15 (Wilding), 12.6
  // (Hackett and Bedford). The refit's optimum was 0.8207; it is taken 0.13 % below, so that the watch with no pumps
  // led through the main founders 0.16 min inside D73's band rather than on its wall (the noise floor of a last-bit
  // change is about 0.06 min: QC A-3). The calibration epoch's landing (D4; D90, 2026-11-23) took it from the history
  // match's rerun: 0.9773 m2 (10.5 sq ft, inside Wilding's 9 to 15), candidate C of out/kept_1912.json, the one member
  // passing every screen (Barrett's W6 rows, the invariants, G18's robustness), with Hackett and Bedford's split (D85)
  // and every stage C switch on (docs/DESIGN_calibration_epoch_v1_2_2026-11-21.md). It was 0.8196 before.
  const CALIBRATED_AREA = 0.9773;
  // the bunker of the fire's own opening on the 1912 damage (C6; the landing, D90): m2, the history match's candidate C
  // (D82 a's range 0.003 to 0.085; Barrett's rows want 0.031 or more); core/encounter.js's ICE.bunkerOpen holds the same
  // for the watch
  const BUNKER_OPEN_1912 = 0.07609;
  // What the landing (D4) moved, as it stood before, for a run that must be the code before D4: a pin frozen from an
  // older commit, the seams gate, the coupled run of tools/trials.js. Give PRE_D4.params to createSim (under any of
  // the run's own), PRE_D4.ship to buildShip, PRE_D4.build to the 1912 preset's build, PRE_D4.scen onto the built
  // scenario (the build now reads the coal list from the params' defaults), and on a watch PRE_D4.modules to
  // Motion.SHIP and Systems.PLANT and PRE_D4.ice to Encounter.ICE. Add here any default a later landing moves.
  const PRE_D4 = {
    params: { weighOverfill: 1, g11Doors: 1, sideOpenings: 0, sideStrength: 1, aDown: 0.2786, zMergeHold: 4.6, fOpen: 0.02087, bunkerBurst: 13.0, peakVent: 0.008, coalListDeg: 2.0, GM0: 2.625 * C.FT },
    ship: { hullEnds: 0 },
    build: { bunkerOpen: null, areaTitanic: 0.8196 },
    scen: { coalListDeg: 2.0 },
    modules: { massPockets: 0, leadRule: 0 },
    ice: { alpha: 0.24256786344109968, bunkerOpen: null },
  };

  // Iceberg damage: short punctures and opened seams along the starboard side
  // (Wilding: ~12 sq ft aggregate; Benson 2025: holes about the size of a sheet of paper).
  // Fractions: Hackett and Bedford's opening areas by compartment (1996; JOM 1998, Table I, "A Summary of Damaged Areas
  // in Hull by Compartment": 0.056, 0.139, 0.288, 0.307, 0.260 and 0.121 m2, 1.171 m2 in all), FP, H1, H2, H3, BR6,
  // BR5 (G6b, 2026-11-20; docs/research/RESEARCH_damage_split_by_compartment_G6b_v1_2026-11-20.md). Until then they were
  // 0.04, 0.13, 0.21, 0.24, 0.32 and 0.06, the shares of the water each room held, though this comment named Hackett and
  // Bedford (the seams gate keeps them: TITANIC_SPLIT_GATE). The encounter shares its opening out the same way on the
  // 1912 watch (`ICE.openAlong` in core/encounter.js), so the preset and the watch carry one damage.
  const HB_AREAS = [0.056, 0.139, 0.288, 0.307, 0.260, 0.121], HB_TOTAL = 1.171;
  const TITANIC_SPLIT = [
    { k: 0, f: HB_AREAS[0] / HB_TOTAL, x0: 117, x1: 124, z: 3.2 },
    { k: 1, f: HB_AREAS[1] / HB_TOTAL, x0: 103, x1: 114, z: 2.8 },
    { k: 2, f: HB_AREAS[2] / HB_TOTAL, x0: 88, x1: 100, z: 2.6 },
    { k: 3, f: HB_AREAS[3] / HB_TOTAL, x0: 72, x1: 85, z: 2.5 },
    { k: 4, f: HB_AREAS[4] / HB_TOTAL, x0: 60, x1: 70, z: 2.3 },
    { k: 5, f: HB_AREAS[5] / HB_TOTAL, x0: 53.2, x1: 54.0, z: 2.3 },
  ];

  // The 1912 damage as the seams gate and the coupled trial run it (tools/seams.js, tools/trials.js): the split and the
  // area of the calibration their reference was frozen with (the shares of the water each room held, and 0.7506 m2).
  // Keep them so when the calibration moves (CLAUDE.md); a preset built with { split: TITANIC_SPLIT_GATE, areaTitanic:
  // GATE_AREA } is that damage.
  const TITANIC_SPLIT_GATE = [
    { k: 0, f: 0.04, x0: 117, x1: 124, z: 3.2 },
    { k: 1, f: 0.13, x0: 103, x1: 114, z: 2.8 },
    { k: 2, f: 0.21, x0: 88, x1: 100, z: 2.6 },
    { k: 3, f: 0.24, x0: 72, x1: 85, z: 2.5 },
    { k: 4, f: 0.32, x0: 60, x1: 70, z: 2.3 },
    { k: 5, f: 0.06, x0: 53.2, x1: 54.0, z: 2.3 },
  ];
  const GATE_AREA = 0.7506;

  // The calibration epoch's C6 (D82b; docs/research/RESEARCH_bunker_burst_head_W6_v1_2026-11-21.md on B1+B2's branch):
  // bunkerOpen (m2) is the bunker's own opening. Boiler room 5's share of the damage (the split's entry of BUNKER_ZONE)
  // lies wholly inside the bunker of the fire since G6; with bunkerOpen given, that compartment's holes total bunkerOpen
  // and every other compartment's are as they are, so the whole opening changes by the difference. The holes stay where
  // the damage's own share puts them (their number and heights from totalArea, not from bunkerOpen), so the opening
  // moves alone and nothing jumps as it is sampled; each is then smaller than a sheet of A4 below about 0.1 m2.
  // null or undefined: the share as it is, and the arrays keep their bits. Its range [D82a]: 0.003 m2 (one deck-hose
  // stream) to 0.085 m2 (Hackett and Bedford's share).
  const BUNKER_ZONE = 5;
  function icebergDamage(totalArea, split, bunkerOpen) {
    split = split || TITANIC_SPLIT;
    const own = bunkerOpen !== null && bunkerOpen !== undefined;
    const out = [];
    for (const s of split) {
      const a = totalArea * s.f;
      const n = Math.max(1, Math.round(a / A4));
      const each = own && s.k === BUNKER_ZONE ? bunkerOpen / n : a / n;
      for (let i = 0; i < n; i++) {
        const u = n === 1 ? 0.5 : i / (n - 1);
        const x = s.x0 + (s.x1 - s.x0) * u;
        const z = s.z + 0.35 * C.sin(i * 2.3 + s.k);
        const y = -(C.halfBreadth(x, z) + 0.02);
        out.push({ x, y, z, area: each, kind: 'breach', label: 'iceberg' });
      }
    }
    return out;
  }

  function zoneHole(k, area, z, side) {
    const Z = C.zoneBounds();
    const x = 0.5 * (Z[k] + Z[k + 1]);
    const hb = C.halfBreadth(x, z);
    return { x, y: side === 'port' ? hb + 0.02 : -(hb + 0.02), z, area, kind: 'breach' };
  }

  // Y3: the pumps as they were worked on the night (docs/research/RESEARCH_pumps_bilge_ballast_v1_2026-11-17.md, section
  // 5.1). Long tons of sea water an hour to m3/s: 1 m3/s = 3,632 LT/h. Boiler room 5's 250-ton ballast-and-bilge pump was
  // on soon after the collision (Barrett; the Court) [from 10 min: bet]; boiler room 4 had its own 150-ton ash-ejector
  // pump and boiler room 3's 250 through the main from about 12:10 (Halpern's reconstruction of Wilding's account), held
  // to boiler room 4's suctions (345 LT/h). Nothing was pumped in boiler room 6 or the holds (their valves stood in the
  // firemen's passage, holed within minutes); the forepeak had no suction.
  const LTH = 1 / 3632;
  const PUMPS_1912 = [
    { zone: 5, room: 5, q: 250 * LTH, t0: 10 * 60, label: 'boiler room 5: its ballast-and-bilge pump (250 tons an hour)' },
    { zone: 6, room: 6, q: 150 * LTH, t0: 30 * 60, label: 'boiler room 4: its ash-ejector pump (150 tons an hour)' },
    { zone: 6, room: 7, q: 195 * LTH, t0: 30 * 60, label: 'boiler room 4: boiler room 3\'s pump through the main, to its suctions (195 tons an hour)' },
  ];

  const PRESETS = {
    titanic: {
      title: 'Titanic, 14 April 1912',
      sea: { depth: 3790 },   // Z3: the fall runs here, at the 1912 site (3,790 m to the bed [R5 10a; D38])
      blurb: 'Iceberg damage along the starboard bow: six compartments holed, about ' + (CALIBRATED_AREA * 10.7639).toFixed(1) + ' sq ft in all (Wilding estimated 12), shared out as in Hackett and Bedford\'s analysis; boiler room 5 holed only inside its forward bunker. Watertight doors closed from the bridge; boiler rooms 5 and 4 pumped as they were. With no break on this card, her last minute is a roll onto her beam ends that no witness saw: a known fault. The watch of 14 April ends where she breaks, nearly upright.',
      clock: { h: 23, m: 40 },
      build: (p) => ({ openings: icebergDamage((p && p.areaTitanic) || CALIBRATED_AREA, p && p.split, p && p.bunkerOpen !== undefined ? p.bunkerOpen : BUNKER_OPEN_1912), coalListDeg: C.DEFAULT_PARAMS.coalListDeg, pumps: p && p.noPumps ? undefined : PUMPS_1912 }),
    },
    four: {
      title: 'Four forward compartments',
      sea: { depth: 3790 },   // Z3: the fall runs here, at the 1912 site (3,790 m to the bed [R5 10a; D38])
      blurb: 'Forepeak and holds 1-3 open to the sea. Wilding testified she would have floated like this.',
      build: () => ({ openings: [0, 1, 2, 3].map(k => zoneHole(k, 0.6, 3.0, 'starboard')), coalListDeg: 0 }),
    },
    five: {
      title: 'Five forward compartments',
      sea: { depth: 3790 },   // Z3: the fall runs here, at the 1912 site (3,790 m to the bed [R5 10a; D38])
      blurb: 'Add boiler room 6. Water reaches E deck at bulkhead E and the compartments fill one after another.',
      build: () => ({ openings: [0, 1, 2, 3, 4].map(k => zoneHole(k, 0.25, 3.0, 'starboard')), coalListDeg: 0 }),
    },
    hawke: {
      title: 'Olympic and HMS Hawke, 1911',
      // Z3: no sea: 1911, in shallow water off the Isle of Wight (and she never founders here)
      blurb: 'Rammed near the stern on the starboard side. Two after compartments flooded; she returned to Southampton.',
      build: () => ({ openings: [zoneHole(14, 2.0, 7.5, 'starboard'), zoneHole(15, 1.2, 8.0, 'starboard')], coalListDeg: 0 }),
    },
    britannic: {
      title: 'Britannic, 21 November 1916 (approx.)',
      // Z3: no sea: 119 m in the Kea Channel; her bow is below that long before the core's trim flag, and the core has no
      // bed, so she keeps the old slide until Z8 can carry a ship longer than the water is deep
      blurb: 'Mine on the starboard bow, six forward compartments flooded through failed doors, bulkheads raised to B deck, portholes open on her lower decks (their number and places are assumptions).',
      build: () => {
        const openings = [zoneHole(2, 1.6, 4.0, 'starboard'), zoneHole(3, 1.6, 4.0, 'starboard'), zoneHole(1, 0.4, 4.0, 'starboard')];
        // portholes: ~25 open, mostly starboard, on F and E decks forward and amidships (assumed spread)
        const pt = 0.10;
        const spots = [[2, 'F'], [3, 'F'], [4, 'F'], [5, 'F'], [6, 'E'], [7, 'E'], [8, 'E'], [9, 'E']];
        for (const [k, deck] of spots) {
          const Z = C.zoneBounds(); const x0 = Z[k + 1], x1 = Z[k];
          const n = deck === 'F' ? 2 : 4;
          for (let i = 0; i < n; i++) {
            const x = x0 + (x1 - x0) * (i + 0.5) / n; const z = C.deckZ(deck, x) + 1.1;
            const side = (deck === 'E' || i % 2 === 0) ? -1 : 1;
            openings.push({ x, y: side * (C.halfBreadth(x, z) + 0.02), z, area: pt, kind: 'porthole' });
          }
        }
        return {
          openings, coalListDeg: 0,
          doorsOpen: ['D', 'E'],
          bulkTop: { D: 'B', E: 'B', F: 'B', G: 'B', H: 'B', K: 'B' },
        };
      },
    },
    blank: {
      title: 'Undamaged hull',
      sea: { depth: 3790 },   // Z3: the fall runs here, at the 1912 site (3,790 m to the bed [R5 10a; D38])
      blurb: 'No damage. Switch to the hole tool and tap the hull below the waterline.',
      build: () => ({ openings: [], coalListDeg: C.DEFAULT_PARAMS.coalListDeg }),
    },
  };

  // Halpern (2023) eyewitness-derived trim and list, minutes after 23:40
  const OBS = {
    trim: [[0, -0.2], [15, 0.8], [30, 1.8], [45, 2.6], [75, 3.2], [100, 4.0], [130, 5.5], [155, 10.0]],
    list: [[10, 5], [85, 2], [100, 0], [130, -10], [145, -15]],          // + starboard
    founder: 160, breakup: 157,
    wilding40: 16000 * C.LT / 1000,                                      // tonnes in 40 min
    events: [
      { id: 'overF', label: 'Water seen pouring down from E deck at the Turkish baths (bulkhead F)', t: 75 },
      { id: 'ports', label: 'Second row of ports under the forecastle submerged', t: 100 },
      { id: 'well', label: 'Forward well deck awash', t: 130 },
      { id: 'fcastle', label: 'Forecastle head going under', t: 145 },
      { id: 'bridge', label: 'Bridge goes under; crow\'s nest at the waterline', t: 155 },
    ],
  };

  // The observation ledger (the calibration epoch, stage A3: docs/DESIGN_calibration_epoch_v1_1, section 3). One row is
  // one thing one witness saw, as it was seen: a level at a place at a time, an angle on an instrument, a mass, the end.
  // core/readers/ledger.js holds the operators that read a run against it; tools/ledger_tests.js prints every row as a
  // CHECK (out/ledger_1912.txt). NOTHING IS SCORED FROM IT YET: tools/calibrate.js still reads OBS, above, and `role`
  // only labels a row (fit, held, report) until stage D. The fields are the design's (3.1):
  //   id; witness; source (the Inquiry's questions or the paper, and the note that read it); group (rows that rest on
  //   one sighting or one derivation share it); kind (sea_at, water_in, sounding, angle, event, tonnage, end); place;
  //   value, unit; t, tLo, tHi (minutes after the touch); sided (two, lower, upper, interval); sigma (in the value's
  //   unit; with `interval`, the interval [lo, hi]; null where no source gives one: stage D's); disc (the model's
  //   allowance, { v, why }, or null); role; tag ({ value, place }: [read], [derived] or [bet]); was (the OBS entries it
  //   replaces). A list row also names its D62 band (`band`: A, B or C), so that stage D can set roles by E-3's option
  //   1 or 2; the roles here are option 1's. `trimWas` is Halpern's trim for the sighting, where OBS held it as one.
  // Conventions: a level is in metres over the place (the place is the deck or the floor the witness named; + up); an
  // angle in degrees (trim + by the bow, list + to starboard); a time in minutes after the touch. Where a source gives
  // a time as "about T" with no range, tLo and tHi are T - 5 and T + 5 [bet: the smaller of auditor E's 5 to 10 min for
  // the early witnesses' times; the design, 5.2]; the row's `time` tag says which it is.
  // The notes: ROOMS, LISTS, G6B and W6 are in docs/; QC E is auditor E's audit of 2026-11-20 (the group's notes
  // folder), whose experiment 1 placed the marks ("mine, from R3's E-deck table and the core's own marks; a place 5 m
  // off moves a time by a minute or two").
  const RECORD_1912 = (() => {
    const FT = C.FT;
    const ROOMS = 'docs/research/RESEARCH_room_by_room_flooding_record_v1_2026-11-20.md';
    const LISTS = 'docs/research/RESEARCH_lists_bunkers_scotland_road_v1_2026-11-17.md';
    const G6B = 'docs/research/RESEARCH_damage_split_by_compartment_G6b_v1_2026-11-20.md';
    const W6 = 'docs/DESIGN_W6_the_lists_v1_1_2026-11-20.md, section 3 (D62\'s bands)';
    const QCE = 'QC E (auditor E, 2026-11-20)';
    const HALPERN = 'Halpern (2023), "Lifeboats, Launch Times, List and Trim", Part II, as OBS held it (not opened for this ledger)';
    // a place in the ship frame: on `deck` at x, y (+ port); `by` says who placed it
    const at = (x, y, deck, by, what) => ({ x, y, z: deck === 'tank top' ? C.G.tankTop : C.deckZ(deck, x), deck, by, what });
    const HOLDS = 'the holds as one tank from the tank top to E deck: the water inside is 14 to 24 min late forward where the sea outside is in time [measured: auditor E; the design, 5.2]; held until S1c';
    const rows = [
      // ---- the fore-and-aft problem: OBS.trim and OBS.events, each sighting once
      { id: 'trim_at_touch', witness: 'none: her trim as she sailed', source: 'OBS.trim\'s first point (' + HALPERN + '); its primary is not in the repository\'s notes',
        group: 'start', kind: 'angle', place: { what: 'trim' }, value: -0.2, unit: 'deg', t: 0, tLo: 0, tHi: 0, sided: 'two', sigma: 0.3,
        disc: null, role: 'report', tag: { value: '[read: OBS]', place: '[read]', time: '[read]' }, was: ['OBS.trim [0, -0.2] (never scored: calibrate.js skips it)'],
        note: 'sigma: the score\'s 0.3 deg to T 45 [read: tools/calibrate.js]' },
      { id: 'symons_hatch1', witness: 'Symons (and Lee)', source: 'BI 11375-418 (Symons), BI 2455-80 (Lee): water round the G-deck hatch of No. 1 hold [read: ' + ROOMS + ']; a lower bound by Halpern\'s own method [read: ' + QCE + ', E-4]',
        group: 'symons_hatch1', kind: 'sea_at', place: at(108, 0.5, 'G', 'auditor E', 'G deck at No. 1 hatch (hold 1), a hatch trunk'), value: 0, unit: 'm', t: 15, tLo: 15, tHi: 20, sided: 'lower', sigma: null,
        disc: null, role: 'fit', tag: { value: '[read]', place: '[bet: auditor E\'s place]', time: '[read: T 15 (OBS) to 20 (the note)]' }, was: ['OBS.trim [15, 0.8]'], trimWas: 0.8,
        note: 'the note has "a foot of water round the coaming" at about T 20; the row keeps the deck itself' },
      { id: 'robinson_mail_stairs', witness: 'Robinson', source: 'BI 13277-83: the water within six steps of E deck on the mail-room stairs [read: ' + ROOMS + '; ' + QCE + ']',
        group: 'robinson_mail_stairs', kind: 'sea_at', place: at(73, -4.3, 'E', 'auditor E', 'the mail stairs (hold 3), starboard'), value: -1.2, unit: 'm', t: 30, tLo: 25, tHi: 35, sided: 'lower', sigma: null,
        disc: null, role: 'fit', tag: { value: '[bet: six steps taken as 1.2 m, auditor E]', place: '[bet: auditor E\'s place]', time: '[bet: about T 30, so 25 to 35]' }, was: ['OBS.trim [30, 1.8]'], trimWas: 1.8 },
      { id: 'poingdestre_quarters', witness: 'Poingdestre', source: 'BI 2842-58 (the note: 2844-72): the seamen\'s quarters on E deck waist-deep; the Report has 3 ft above E deck at T 40 [read: ' + ROOMS + '; ' + QCE + ']',
        group: 'poingdestre_quarters', kind: 'sea_at', place: at(92, 5.7, 'E', 'auditor E, from R3\'s E-deck table (frames 98F to 105F, port)', 'the seamen\'s quarters on E deck (over hold 2), port'), value: 3 * FT, unit: 'm', t: 45, tLo: 40, tHi: 45, sided: 'lower', sigma: null,
        disc: null, role: 'fit', tag: { value: '[read: 3 ft]', place: '[bet: auditor E\'s place]', time: '[read: T 40 (the Report) to 45]' }, was: ['OBS.trim [45, 2.6]'], trimWas: 2.6 },
      { id: 'wheat_stair_f', witness: 'Wheat', source: 'BI 11004-05: water came down a stairway from E deck to F deck, from the starboard side, at about 12:45 (T 65) [checked: ' + ROOMS + ']; OBS has it at T 75 by the Turkish baths (' + HALPERN + ')',
        group: 'wheat_stair_f', kind: 'event', place: { mark: 'overF', what: 'the core\'s own event: water over bulkhead F at its top' }, value: 75, unit: 'min', t: 75, tLo: 65, tHi: 75, sided: 'interval', sigma: [65, 75],
        disc: null, role: 'fit', tag: { value: '[read: T 65 (the transcript) to 75 (OBS)]', place: '[bet: where along her length the stair stood is not in his answers (the note\'s spot check)]', time: '[read]' }, was: ['OBS.trim [75, 3.2]', 'OBS.events overF, 75 (scored at sigma 8 min)'], trimWas: 3.2 },
      { id: 'symons_ports', witness: 'Symons', source: 'OBS.events "Second row of ports under the forecastle submerged", T 100, and OBS.trim\'s 4.0 at T 100: one sighting (' + HALPERN + ') [read: ' + QCE + ', E-4]',
        group: 'symons_ports', kind: 'sea_at', place: at(118, 9, 'C', 'the core\'s mark `ports` (core/core.js MARKS): 1.0 m under C deck', 'the second row of ports under her name, port bow'), value: -1.0, unit: 'm', t: 100, tLo: 90, tHi: 110, sided: 'two', sigma: null,
        disc: null, role: 'fit', tag: { value: '[bet: the core\'s mark]', place: '[bet: the core\'s mark]', time: '[derived: the score\'s 0.4 deg on this point at Halpern\'s own rate there, 0.03 to 0.05 deg a minute, is about 10 min]' }, was: ['OBS.trim [100, 4.0]', 'OBS.events ports, 100 (never scored)'], trimWas: 4.0 },
      { id: 'bride_well', witness: 'Bride (and Phillips)', source: 'BI 16549: the forward well deck awash [read: ' + QCE + ', its table]; Rowe has it awash when he left at T 120, the forecastle head not under (BI 17687) [read: ' + LISTS + ']',
        group: 'bride_well', kind: 'sea_at', place: at(84, 0, 'C', 'the core\'s mark `well` (core/core.js MARKS)', 'the forward well deck, centreline'), value: 0, unit: 'm', t: 130, tLo: 122, tHi: 138, sided: 'two', sigma: null,
        disc: null, role: 'fit', tag: { value: '[read]', place: '[bet: the core\'s mark]', time: '[read: the score\'s 8 min on the event, tools/calibrate.js]' }, was: ['OBS.trim [130, 5.5]', 'OBS.events well, 130 (scored at sigma 8 min)'], trimWas: 5.5,
        note: 'the two old terms could not both be met: the model\'s well deck is awash at 4.80 deg of trim, where Halpern maps 5.5 [measured: auditor E]' },
      { id: 'fcastle_head', witness: 'no witness named (Halpern\'s reconstruction)', source: 'OBS.events "Forecastle head going under", T 145 (' + HALPERN + '); its primary is not in the repository\'s notes',
        group: 'fcastle_head', kind: 'sea_at', place: at(126, 0, 'B', 'the core\'s mark `fcastle` (core/core.js MARKS)', 'the forecastle head, centreline'), value: 0, unit: 'm', t: 145, tLo: 140, tHi: 150, sided: 'two', sigma: null,
        disc: null, role: 'report', tag: { value: '[read: OBS]', place: '[bet: the core\'s mark]', time: '[bet: about T 145, so 140 to 150]' }, was: ['OBS.events fcastle, 145 (never scored)'] },
      { id: 'lightoller_bridge', witness: 'Lightoller', source: 'OBS.events "Bridge goes under; crow\'s nest at the waterline", T 155, and OBS.trim\'s 10 at T 155: one sighting (' + HALPERN + ') [read: ' + QCE + ', E-4]',
        group: 'lightoller_bridge', kind: 'sea_at', place: at(72, 0, 'Boat', 'the core\'s mark `bridge` (core/core.js MARKS); to be checked against where he stood (the design, 3.4)', 'the Boat deck at the bridge, centreline'), value: 0, unit: 'm', t: 155, tLo: 150, tHi: 160, sided: 'two', sigma: null,
        disc: null, role: 'fit', tag: { value: '[read]', place: '[bet: the core\'s mark]', time: '[read: the score\'s 5 min on the event, tools/calibrate.js]' }, was: ['OBS.trim [155, 10.0]', 'OBS.events bridge, 155 (scored at sigma 5 min)'], trimWas: 10.0 },
      // ---- the end
      { id: 'founder', witness: 'the record\'s end, 2:20', source: 'OBS.founder (' + HALPERN + '; his table: 2:20, T 160) [read: ' + QCE + ', its table]',
        group: 'end', kind: 'end', place: { mark: 'founder', what: 'the core\'s founder flag' }, value: 160, unit: 'min', t: 160, tLo: null, tHi: null, sided: 'two', sigma: 4,
        disc: { v: 1.35, why: 'levelRate doubled moves the founder 1.35 min sooner, halved 3.5 min later [measured: auditor A]; the smaller [bet: the design, 5.2]' },
        role: 'fit', tag: { value: '[read]', place: '[read]', time: '[read]' }, was: ['OBS.founder 160 (sigma 4 min; D69 holds it to 157 to 160)'],
        note: 'the 1912 watch\'s founder (D73) is this observation again on another configuration: one row here, and no row for the watch' },
      // the break by the witnesses (the mainline's ruling, 2026-11-24, at B1+B2's reading; the stern's own band is D107's)
      { id: 'break_onset', witness: 'the witnesses\' break, 2:15 to 2:19:40, the lights out about 2:17', source: 'after Joughin\'s 2:15 by his watch with the lights still burning (BI 6359-6363) and Lightoller\'s forward funnel falling at 2:15 to 2:17 (BI 14079-14083); before 2:20, when she was gone (the Report, Lee; Pitman\'s own watch, "2.20 exactly, ship\'s time", US Day 4; Boxhall), less the stern\'s shortest standing time, 20 s (Etches) [read: docs/research/RESEARCH_breakup_hull_girder_v1_2026-11-17.md\'s timeline and RESEARCH_the_fall_and_the_wreck_v1_2026-11-19.md 5.2]; the watches were not set alike (the latter, section 8, conflict 13)',
        group: 'end', kind: 'end', place: { mark: 'onset', what: 'the onset of the break, core/readers/onset.js (it breaks nothing)' }, value: 157, unit: 'min', t: 157, tLo: null, tHi: null, sided: 'interval', sigma: [155, 159.7],
        disc: null, role: 'report', tag: { value: '[derived]', place: '[read]', time: '[derived]' },
        was: ['OBS.breakup 157 (never scored)', 'the band T 157 to 158.6 until 2026-11-24: 157 the model\'s own event list (it foundered at 2:17 then), 158.6 Paik et al.\'s computed collapse through a search summary; neither an observation (' + HALPERN + '; ' + QCE + ')'] },
      // ---- her list (+ starboard). `band` is D62's; the roles are E-3's option 1 until Bo chooses
      { id: 'hichens_list', witness: 'Hichens', source: 'US Day 5: the captain read 5 degrees to starboard on the wheelhouse inclinometer 5 to 10 minutes after [read: ' + LISTS + ']; band A: +3 to +7 [read: ' + W6 + ']',
        group: 'list_hichens', kind: 'angle', place: { what: 'list' }, value: 5, unit: 'deg', t: 10, tLo: 5, tHi: 10, sided: 'interval', sigma: [3, 7], band: 'A',
        disc: null, role: 'held', tag: { value: '[read]', place: '[read: an instrument]', time: '[read: T 5 to 10]' }, was: ['OBS.list [10, 5]'],
        note: 'a CHECK by D72 until D64 (the tunnel\'s height) is settled' },
      { id: 'symons_list_85', witness: 'Symons (Halpern\'s figure)', source: 'BI 11440-42, 11467a: a slight list to starboard at boat 1, T 85 to 90; the +2 is Halpern\'s [read: ' + LISTS + ']',
        group: 'list_symons', kind: 'angle', place: { what: 'list' }, value: 2, unit: 'deg', t: 85, tLo: 85, tHi: 90, sided: 'two', sigma: 3, band: 'B',
        disc: null, role: 'held', tag: { value: '[derived: Halpern\'s number for a witness\'s "slight"]', place: '[read]', time: '[read]' }, was: ['OBS.list [85, 2]'],
        note: 'sigma: the score\'s 3 deg (at weight 0.25) [read: tools/calibrate.js]; band B holds only its sign (never more than 1 deg to port from T 20 to 85); option 2 would fit it' },
      { id: 'halpern_list_100', witness: 'Halpern\'s reconstruction', source: 'OBS.list (' + HALPERN + '); band C: -2 to +2 [read: ' + W6 + ']',
        group: 'list_halpern_100', kind: 'angle', place: { what: 'list' }, value: 0, unit: 'deg', t: 100, tLo: 100, tHi: 100, sided: 'two', sigma: 3, band: 'C',
        disc: null, role: 'held', tag: { value: '[derived: a reconstruction]', place: '[read]', time: '[read: OBS]' }, was: ['OBS.list [100, 0]'], note: 'sigma: the score\'s 3 deg' },
      { id: 'rowe_list', witness: 'Rowe', source: 'BI 17677-88: to port, "about six degrees" when he left in collapsible C at 1:40 [read: ' + LISTS + ']; band A: -3 to -9 [read: ' + W6 + ']',
        group: 'list_rowe', kind: 'angle', place: { what: 'list' }, value: -6, unit: 'deg', t: 120, tLo: 120, tHi: 120, sided: 'interval', sigma: [-9, -3], band: 'A',
        disc: null, role: 'fit', tag: { value: '[read]', place: '[read: judged by eye from the boat]', time: '[read]' }, was: [],
        note: 'band A\'s only number for the port list; it was not in OBS' },
      { id: 'side_change', witness: 'several: the boats scraping the high side, 12:55 to 1:35; Barrett\'s rush at 1:10', source: 'band A: over to port between T 85 and 110 [read: ' + W6 + '; ' + LISTS + ']',
        group: 'list_side', kind: 'event', place: { mark: 'toPort', what: 'the last time she goes over to port past half a degree, before T 150 (tools/pocket_tests.js\'s rule for D62\'s row)' }, value: 97.5, unit: 'min', t: 97.5, tLo: 85, tHi: 110, sided: 'interval', sigma: [85, 110], band: 'A',
        disc: null, role: 'fit', tag: { value: '[derived: a band from several witnesses]', place: '[derived]', time: '[derived]' }, was: [] },
      { id: 'halpern_list_130', witness: 'Halpern\'s reconstruction', source: 'OBS.list (' + HALPERN + '); band C: -14 to -6 [read: ' + W6 + ']',
        group: 'list_halpern_130', kind: 'angle', place: { what: 'list' }, value: -10, unit: 'deg', t: 130, tLo: 130, tHi: 130, sided: 'two', sigma: 3, band: 'C',
        disc: null, role: 'held', tag: { value: '[derived: a reconstruction]', place: '[read]', time: '[read: OBS]' }, was: ['OBS.list [130, -10]'], note: 'sigma: the score\'s 3 deg' },
      { id: 'boat_d_waterline', witness: 'Lightoller, Woolner (via Halpern)', source: 'BI 14020 (Lightoller) and Woolner: the sea about 10 ft below the Boat deck on the port side abreast boat D, A deck awash there, at about 2:05 [read: ' + QCE + ', E-3 and its table]; boat D loading at T 140 to 145 [read: ' + LISTS + ']',
        group: 'boat_d', kind: 'sea_at', place: at(60.7, 14.0, 'Boat', 'auditor E', 'the Boat deck\'s edge abreast collapsible D, port'), value: -10 * FT, unit: 'm', t: 145, tLo: 140, tHi: 145, sided: 'two', sigma: null, band: 'C',
        disc: null, role: 'held', tag: { value: '[read: via Halpern\'s text, as auditor E read it]', place: '[bet: auditor E\'s place]', time: '[read]' }, was: ['OBS.list [145, -15] (its primary)'] },
      { id: 'halpern_list_145', witness: 'Halpern\'s estimate', source: 'OBS.list (' + HALPERN + '): arctan(12.5 / 46) from boat D\'s waterline and his own trim trend [read: ' + QCE + ', E-3]; band C: -20 to -10 [read: ' + W6 + ']',
        group: 'boat_d', kind: 'angle', place: { what: 'list' }, value: -15, unit: 'deg', t: 145, tLo: 145, tHi: 145, sided: 'two', sigma: 3, band: 'C',
        disc: null, role: 'report', tag: { value: '[derived: an angle that depends on another fitted curve]', place: '[read]', time: '[read: OBS]' }, was: ['OBS.list [145, -15]'],
        note: 'kept beside its primary, boat_d_waterline, in one group; sigma: the score\'s 3 deg' },
      // ---- room by room: all held (the design, 3.4; auditor E's table)
      { id: 'boxhall_mail_room', witness: 'Boxhall (and Wheat)', source: 'BI 15374-77 (Boxhall), BI 10910-21 (Wheat): the water in the mail room within 2 ft of G deck [read: ' + ROOMS + ']',
        group: 'boxhall_mail_room', kind: 'water_in', place: at(73, -4.3, 'G', 'auditor E', 'the mail room (hold 3), starboard, under G deck'), value: -2 * FT, unit: 'm', t: 20, tLo: 10, tHi: 20, sided: 'two', sigma: null,
        disc: { v: null, why: HOLDS }, role: 'held', tag: { value: '[read: 2 ft]', place: '[bet: auditor E\'s place]', time: '[read: T 10 to 20]' }, was: [] },
      { id: 'carpenter_hold1', witness: 'the carpenter (through Poingdestre)', source: 'BI 2821-25: the carpenter\'s sounding, 7 ft in No. 1 hold; its time is loose [read: ' + ROOMS + ']',
        group: 'carpenter_hold1', kind: 'sounding', place: at(108.7, 0, 'tank top', 'the model\'s floor at the middle of hold 1 (e87)', 'hold 1, over the tank top'), value: 7 * FT, unit: 'm', t: 10, tLo: 5, tHi: 15, sided: 'two', sigma: null,
        disc: { v: null, why: HOLDS + '; low in the holds the model is early' }, role: 'held', tag: { value: '[read: 7 ft]', place: '[bet: where he sounded is not in the note; the floor is the tank top]', time: '[bet: about T 10, so 5 to 15]' }, was: [] },
      { id: 'barrett_br6', witness: 'Barrett', source: 'BI 1926-37: 8 ft above the plates when he came back, "just on ten minutes" [checked: ' + ROOMS + ']; the plates 0 to 6 ft over the tank top (BI 2096, 1883), so 8 to 14 ft over the model\'s floor [read: docs/research/experiments/e87_forward_rooms_vs_record.js]',
        group: 'barrett_br6', kind: 'sounding', place: at(62.5, 0, 'tank top', 'the model\'s floor at the middle of boiler room 6 (e87)', 'boiler room 6, over the tank top'), value: 8 * FT, unit: 'm', t: 10, tLo: 5, tHi: 15, sided: 'interval', sigma: [8 * FT, 14 * FT],
        disc: null, role: 'held', tag: { value: '[read: 8 ft over the plates]', place: '[bet: the plates\' height over the tank top is not settled]', time: '[bet: about T 10, so 5 to 15]' }, was: [] },
      { id: 'br5_plates_dry', witness: 'Barrett; the Report', source: 'BI 1964-69, 2037, 2109: the plates of boiler room 5 never covered until the rush, at T 60 (the Report) or 1:10, T 90 (BI 2038-41, 2349) [read: ' + ROOMS + ']',
        group: 'br5_plates_dry', kind: 'sounding', place: at(45.6, 0, 'tank top', 'the model\'s floor at the middle of boiler room 5 (e85)', 'boiler room 5\'s stokehold, over the tank top (its own water: the bunker of the fire is a pocket apart)'), value: 0.3, unit: 'm', t: 60, tLo: 60, tHi: 90, sided: 'two', sigma: null,
        disc: null, role: 'held', tag: { value: '[derived: "water over the plates" taken as 0.3 m over the model\'s floor, e85\'s and auditor E\'s threshold]', place: '[bet: the plates\' height]', time: '[read: T 60 to 90]' }, was: [],
        note: 'in range when the stokehold\'s first 0.3 m comes between T 60 and T 90' },
      { id: 'br4_from_below', witness: 'Dillon, Cavell', source: 'BI 3812-13, 3819-25 (Dillon, 1:15: through the floor, forward), BI 4257-65 (Cavell: about a foot over the plates as the men left, from below) [checked: ' + ROOMS + ']',
        group: 'br4_from_below', kind: 'sounding', place: at(28.2, 0, 'tank top', 'the model\'s floor at the middle of boiler room 4 (e85)', 'boiler room 4, over the tank top'), value: 1 * FT, unit: 'm', t: 95, tLo: 95, tHi: 100, sided: 'two', sigma: null,
        disc: { v: null, why: 'the record has the water from below; the model fills the room from above [measured: auditor E, E-12]. This row tests the depth and its time, not the path' }, role: 'held', tag: { value: '[read: about a foot]', place: '[bet: the plates\' height]', time: '[read: T 95 to 100]' }, was: [],
        note: 'read at the room\'s middle, as e85 reads it; Dillon has the water forward, where the trimmed floor is lower and the foot comes sooner (auditor E, over the room\'s lowest point: T 90.0 on G6b\'s landing)' },
      // ---- the water aboard: reported, never fitted
      { id: 'weeks_halpern_tonnage', witness: 'Weeks and Halpern\'s reconstruction', source: '13,500 long tons aboard at 12:25 (a digest of their chapter, read by the research agents) [read: ' + G6B + ']',
        group: 'tonnage_weeks_halpern', kind: 'tonnage', place: { what: 'aboard' }, value: 13500 * C.LT / 1000, unit: 't', t: 45, tLo: 45, tHi: 45, sided: 'two', sigma: null,
        disc: null, role: 'report', tag: { value: '[read in a secondary]', place: '[read]', time: '[read]' }, was: [] },
      { id: 'wilding_tonnage', witness: 'Wilding\'s assumption', source: 'BI 20422 and his 1915 deposition, via Halpern: 16,000 tons in about 40 minutes, the figure his 12 sq ft came from [checked: ' + G6B + ']',
        group: 'tonnage_wilding', kind: 'tonnage', place: { what: 'aboard' }, value: 16000 * C.LT / 1000, unit: 't', t: 40, tLo: 40, tHi: 40, sided: 'two', sigma: null,
        disc: null, role: 'report', tag: { value: '[read]', place: '[read]', time: '[read: about 40 minutes]' }, was: ['OBS.wilding40 (the chart only)'],
        note: 'an assumption, not a sighting: 16,257 t at T 40 means about 3.35 deg of trim against 2.6 witnessed [derived: auditor E]' },
    ];
    // RC2 (the red team's row 22): each row's source said in plain words, for the page's ledger (site/parts/78_ledger.js
    // shows `cite`). A row's `source`, its tags and its notes above are the working record: they name the project's own
    // audits and decisions, and they stay as they are. A cite adds no fact: it says the same source to a stranger, with
    // what is our own reading said as ours. Clock times count from the touch at 11:40 pm. tools/ledger_tests.js holds
    // every row to a cite with none of the working names in it.
    const HALPERN_AS_HELD = "Taken from Halpern's tables (2023) as an earlier version of this model held them; we have not opened his paper again for this row.";
    const CITE = {
      trim_at_touch: "Her trim as she sailed, about 0.2 degrees by the stern: the first point of Halpern's reconstruction of her trim. " + HALPERN_AS_HELD + " We have not traced it to a primary source.",
      symons_hatch1: "British Inquiry, questions 11375 to 11418 (Symons) and 2455 to 2480 (Lee): water round the G-deck hatch of No. 1 hold, 15 to 20 minutes after the collision. Where on the hatch is our placing. Read as a lower bound: the sea had reached at least this level.",
      robinson_mail_stairs: "British Inquiry, questions 13277 to 13283 (Robinson): the water within six steps of E deck on the mail-room stairs, about half an hour after the collision. Six steps taken as 1.2 m, and the time as 25 to 35 minutes: both are our reading.",
      poingdestre_quarters: "British Inquiry, questions 2842 to 2858 (Poingdestre): the seamen's quarters on E deck waist-deep, taken as 3 ft. The Court's Report has 3 ft above E deck 40 minutes after the collision. Where in the quarters is our placing.",
      wheat_stair_f: "British Inquiry, questions 11004 and 11005 (Wheat): water came down a stairway from E deck to F deck, from the starboard side, at about 12:45. Halpern's reconstruction (2023) has it at 12:55, by the Turkish baths, and the row takes both. Where along her the stair stood is not in his answers.",
      symons_ports: "Halpern's reconstruction (2023): the second row of ports under the forecastle submerged at 1:20, her trim then 4 degrees: one sighting, by Symons. " + HALPERN_AS_HELD + " The level of those ports is the model's own mark.",
      bride_well: "British Inquiry, question 16549 (Bride): the forward well deck awash, at about 1:50. Rowe has it awash when he left at 1:40, the forecastle head not yet under (question 17687). The level of the well deck is the model's own mark.",
      fcastle_head: "Halpern's reconstruction (2023): the forecastle head going under at about 2:05. " + HALPERN_AS_HELD + " We have not traced it to a witness.",
      lightoller_bridge: "Halpern's reconstruction (2023): the bridge going under, with the crow's nest at the waterline, at 2:15, her trim then 10 degrees: one sighting, by Lightoller. " + HALPERN_AS_HELD,
      founder: "She was gone at 2:20, 160 minutes after the collision: Pitman's time by his own watch (United States Inquiry, Day 4) and the Court's Report's, as Halpern's table (2023) has it.",
      break_onset: "Nobody timed the break: this band is worked out. It comes after Joughin's 2:15 by his watch, with the lights still burning (British Inquiry, questions 6359 to 6363), and Lightoller's forward funnel falling (questions 14079 to 14083). It comes before she was gone at 2:20 (Pitman's watch, United States Inquiry, Day 4; the Court's Report), by at least the shortest time a witness has the stern standing, Etches's 20 seconds. Some who watched saw her break. Her second and third officers, Lightoller and Pitman, said she went down whole. The wreck shows she broke. The witnesses' watches were not set alike.",
      hichens_list: "United States Inquiry, Day 5 (Hichens): the captain read 5 degrees to starboard on the commutator in the wheelhouse, five to ten minutes after the collision. His British evidence (questions 1042 and 1043) gives no figure. The band, 3 to 7 degrees, is ours.",
      symons_list_85: "British Inquiry, questions 11440 to 11442 and 11467a (Symons): a slight list to starboard at boat 1, at about 1:05 to 1:10. The 2 degrees is Halpern's figure for his \"slight\".",
      halpern_list_100: "Halpern's reconstruction of her list (2023): upright at about 1:20. A reconstruction, not a sighting. " + HALPERN_AS_HELD,
      rowe_list: "British Inquiry, questions 17677 to 17688 (Rowe): a list to port of \"about six degrees\" when he left in collapsible C at 1:40, judged by eye from the boat. It is the one figure a witness gave for her list to port.",
      side_change: "Several witnesses: the boats scraping down her high side from 12:55 to 1:35, and Barrett's rush of water at 1:10. From them she went over from starboard to port between 85 and 110 minutes after the collision: a band worked out from their accounts, not a sighting.",
      halpern_list_130: "Halpern's reconstruction of her list (2023): 10 degrees to port at 1:50. A reconstruction, not a sighting. " + HALPERN_AS_HELD,
      boat_d_waterline: "British Inquiry, question 14020 (Lightoller), and Woolner: the sea about 10 ft below the Boat deck on the port side abreast boat D, with A deck awash there, at about 2:05. Read through Halpern's text; where along her is our placing.",
      halpern_list_145: "Halpern's estimate (2023): 15 degrees to port at 2:05, which he works out from boat D's waterline and his own curve of her trim. An estimate resting on another fitted curve: reported here, and used for nothing.",
      boxhall_mail_room: "British Inquiry, questions 15374 to 15377 (Boxhall) and 10910 to 10921 (Wheat): the water in the mail room within 2 ft of G deck, 10 to 20 minutes after the collision. The model treats each hold as one tank from the tank top to E deck, so its water inside is 14 to 24 minutes late forward.",
      carpenter_hold1: "British Inquiry, questions 2821 to 2825 (Poingdestre, of the carpenter's sounding): 7 ft of water in No. 1 hold. Its time is loose, about ten minutes after the collision, and where he sounded is not recorded. The model treats each hold as one tank, so its water inside is late forward; low in the holds it is early.",
      barrett_br6: "British Inquiry, questions 1926 to 1937 (Barrett): 8 ft of water over the stokehold plates of boiler room 6 when he came back, \"just on ten minutes\" after. How high the plates stood over the tank top is not settled (0 to 6 ft, questions 2096 and 1883), so the band is 8 to 14 ft over the model's floor.",
      br5_plates_dry: "British Inquiry, questions 1964 to 1969, 2037 and 2109 (Barrett), and the Court's Report: the plates of boiler room 5 were never covered until the rush of water, an hour after the collision by the Report, or at 1:10 by Barrett (questions 2038 to 2041 and 2349). \"Water over the plates\" is taken as 0.3 m over the model's floor.",
      br4_from_below: "British Inquiry, questions 3812, 3813 and 3819 to 3825 (Dillon: at 1:15, through the floor, forward) and 4257 to 4265 (Cavell: about a foot over the plates as the men left, from below). The record has the water coming from below; the model fills the room from above. This row tests the depth and its time, not the path.",
      weeks_halpern_tonnage: "Halpern and Weeks's reconstruction: 13,500 long tons of water aboard at 12:25. Read in a digest of their chapter, not in the book itself: reported here, and used for nothing.",
      wilding_tonnage: "British Inquiry, question 20422 (Wilding), and his deposition of 1915, through Halpern: 16,000 tons in about 40 minutes, the figure his 12 square feet came from. It was his working assumption, not a sighting: that much water at 12:20 would give her about 3.4 degrees of trim, where Halpern's reconstruction has 2.6 at 12:25.",
    };
    for (const r of rows) r.cite = CITE[r.id] || null;
    return rows;
  })();

  return { PRESETS, OBS, RECORD_1912, icebergDamage, zoneHole, TITANIC_SPLIT, TITANIC_SPLIT_GATE, GATE_AREA, BUNKER_ZONE, A4, CALIBRATED_AREA, BUNKER_OPEN_1912, PRE_D4, PUMPS_1912, LTH };
});
