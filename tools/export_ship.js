// U0 of docs/BRAINSTORM_titanic_in_unreal_v1_2026-11-20.md (section 7): the ship as numbers, one JSON file for a modeller in
// Blender or Unreal, built from the model's own tables and functions and the drawn ship's (site/topsides.js,
// site/visuals.js). Nothing in it is placed by hand: a change to a sourced number moves the web viewer and this file alike.
//
//   node tools/export_ship.js          -> out/titanic_ship.json (under tools/gate.js: out/gate/). Not tracked: out/export_tests.txt
//                                         (tools/export_tests.js) holds its size and hash; regenerate it in seconds
//
// The file states its frames and units itself. Its keys stand in a fixed order and its numbers at fixed decimals
// (tools/export_json.js), so two runs give the same bytes; its sources are named by their git blob ids (`made.sources`).
// What a source marks [read], [scaled], [derived], [measured], [bet] or [appearance] is under `notes`, path by path, in the
// source's own words with its tags; a sampled function says which function it samples.
// It reads the model and feeds nothing back: no physics is changed here.
'use strict';
const fs = require('fs');
const C = require('../core/core.js');
const Sys = require('../core/systems.js');
const BP = require('../core/readers/people.js');   // the boats' stations (registers its reader with the night: nothing steps here)
const TS = require('../site/topsides.js');
const V = require('../site/visuals.js');
const J = require('./export_json.js');
const outFile = require('./outdir');

const NAME = 'titanic_ship.json';
const VERSION = 1;
const SOURCES = ['core/core.js', 'core/systems.js', 'core/motion.js', 'core/night.js', 'core/encounter.js', 'core/readers/people.js',
  'site/topsides.js', 'site/visuals.js', 'tools/export_ship.js', 'tools/export_json.js'];
const { F, S } = J;
const D_TABLE = 4;                 // decimals of the sampled tables (0.1 mm)

const range = (a, b, step) => { const out = [], n = Math.round((b - a) / step); for (let i = 0; i <= n; i++) out.push(a + i * step); return out; };
// stations as written: rounded to 6 decimals before they are sampled, so the file's x is the x each sample was taken at
const stations = (list) => Array.from(new Set(list.map(x => +x.toFixed(6)))).sort((a, b) => a - b);
// the lowest point of her section at x as the viewer finds it (site/app.js, profileBottom): the first z from the keel up,
// in steps of 0.05 m to her top, where the half-breadth exceeds 0.02 m; null where there is none
function profileBottom(fn, x) { const zt = C.zTopAt(x); for (let z = 0; z <= zt; z += 0.05) if (fn(x, z) > 0.02) return z; return null; }
const DECKS = ['orlop', 'G', 'F', 'E', 'D', 'C', 'B', 'A', 'Boat'];
// the deck a point stands on: the highest of the model's decks at or under z there (null under the orlop)
function deckAt(x, z) { let d = null; for (const n of DECKS) if (C.deckZ(n, x) <= z + 1e-9) d = n; return d; }
const hex = (c) => '#' + c.toString(16).padStart(6, '0');
const plain = (o) => JSON.parse(JSON.stringify(o));          // a table as plain data (functions and undefined dropped)

function build() {
  const ship = C.buildShip(), G = C.G, B = TS.built();
  const sim = C.createSim(ship, {}, { openings: [] });        // the night's ship at the start: its connections and openings
  const zs = range(0, 32, 0.25);
  const KIND = Object.keys(C.K).reduce((o, k) => { o[C.K[k]] = k.toLowerCase(); return o; }, {});
  // the stations: every metre, and where the viewer rings her besides (site/app.js, hullStations): either side of the wells'
  // ends, where her top steps; for the drawn shell also either side of the stern post (T1: open under the counter abaft
  // it, her run's lines forward of it) and the round stern's last 0.72 m, where its edge comes round to meet her end
  // athwartships (Bo, 19 November: "circular shaped not pointed")
  const xEnd = C.xAft(C.zTopAt(G.xAP - G.sternOverhang)), wells = [];
  for (const w of [G.wellFwd, G.wellAft]) wells.push(w[0] - 0.04, w[0] + 0.04, w[1] - 0.04, w[1] + 0.04);
  const ROUND_END = [0.012, 0.03, 0.06, 0.1, 0.16, 0.25, 0.37, 0.52, 0.72];
  const xs = stations(range(-139, 131, 1).concat(wells));
  // and every 0.25 m from just abaft the stern post to kFwd, where the counter's knuckle comes down to her waterline: a
  // diagonal crease, which 1 m stations draw as a stair (the first stills, docs/evidence/blender/u1/README.md, item 4)
  const KNUCKLE = range(+(TS.STERN.post - 0.5).toFixed(2), TS.STERN.kFwd, 0.25);
  // the drawn shell at every station (G24): the shell a viewer draws, forward of x0 as well (where it is the stations' own)
  const xsDrawn = stations(range(-139, 131, 1).concat(wells, [TS.STERN.post - 0.02, TS.STERN.post + 0.02], ROUND_END.map(d => xEnd + d), KNUCKLE));

  // ---------------------------------------------------------------- the hull
  // G24: the ship's own hull (ship.hull). Since the calibration epoch's landing (D4) her ends above 11.0 m are restored
  // from the deck plans (C3, buildShip's hullEnds); C.halfBreadth takes them only through its third argument, as the
  // flooding's columns do. At or below ends.z0 the two are the same, to the bit
  const HB = (x, z) => C.halfBreadth(x, z, ship.hull);
  const hb = xs.map(x => S(zs.map(z => HB(x, z)), D_TABLE));
  const hbDrawn = xsDrawn.map(x => S(zs.map(z => TS.hullDraw(x, z)), D_TABLE));
  const hull = {
    particulars: {
      LBP: G.LBP, xFP: G.xFP, xAP: G.xAP, B: G.B, tankTop: G.tankTop, sternOverhang: G.sternOverhang,
      stemRefZ: G.stemRefZ, stemRake: G.stemRake, forefootR: G.forefootR, counterZ0: G.counterZ0, counterZ1: G.counterZ1,
      thZ: G.thZ, thAmount: G.thAmount, wellFwd: G.wellFwd, wellAft: G.wellAft,
      LOA: C.xFwd(C.zTopAt(G.xFP)) - (G.xAP - G.sternOverhang),
    },
    decks: {
      names: DECKS, z: Object.assign({}, G.deck), sheerF: G.sheerF, sheerA: G.sheerA,
      law: 'deckZ(name, x) = z[name] + sheer(x); sheer(x) = sheerF (x / xFP)^2 forward of amidships, sheerA (x / xAP)^2 abaft it (C.deckZ, C.sheer)',
      x: xs, deckZ: DECKS.reduce((o, n) => { o[n] = S(xs.map(x => C.deckZ(n, x)), D_TABLE); return o; }, {}),
    },
    form: {
      law: 'C.halfBreadth(x, z): the moulded half-breadth, 0 outside the profile. Full breadth B/2 between xPA and xPF (each blended from its *0 to its *1 value up to T0 by a smoothstep in z/T0); forward of xPF it falls as 1 - u^n to the stem C.xFwd(z), abaft xPA to the stern C.xAft(z), n blended in z by nBlend; under rb the bilge is a circle of radius rb; above thZ the tumblehome takes thAmount off by the Boat deck. Fitted by tools/fit_hull.js to the displacement, waterplane, LCF, KB and BM at 32 ft 3 in and 34 ft 7 in from H&W records.',
      params: Object.assign({}, C.HULL),
      stem: 'C.xFwd(z): the stem raked 1 in 12 through x = xFP at z = stemRefZ, rounded into the keel by a forefoot of radius forefootR',
      stern: 'C.xAft(z): xAP up to counterZ0; the counter overhangs on a quarter ellipse to xAP - sternOverhang at counterZ1 and above',
      ends: Object.assign({ about: 'Her ends above the waterline as the deck plans draw them (the calibration epoch\'s C3, on since its landing, D4; core/core.js ENDS_READ and endsSide): C.halfBreadth(x, z, ship.hull) is the law above with, above z0 (m, a bet over every first waterline), her side widened toward the plans\' outer line read on E, D, C and B deck from 40 frames out to her stem and stern: from nothing at z0 to all of it at E deck, above B deck what B deck read, faded in over `fade` m inside 40 frames, B deck beyond 80 frames taking C deck\'s less what B read at 80 over `bFade` m. deck[d].aft and .fwd: each reading\'s monotone cubic (Fritsch and Carlson), x and y in m (y her half-breadth there), m its slopes; stern, stem: where the plan ends that deck (null: not read). xa, xf: the innermost readings (40 frames aft and forward). At or below z0 the law is the one above without them, to the bit; hull.stations samples it with them' }, plain(ship.hull.ends)),
    },
    stations: {
      about: 'C.halfBreadth(x, z, ship.hull) sampled, her ends with it (form.ends; G24): halfBreadth[i][j] at x[i], z[j] (m); every metre and either side of the wells\' ends. Above her top (top[i], or weatherTop[i] where the tiers stand) it is the law carried on, not ship; bottom[i] the lowest point of her section as the viewer finds it (the first z from the keel up, in 0.05 m steps, where the half-breadth exceeds 0.02 m). The flooding integrates exactly this function (columns of 3 m by 0.5 m).',
      x: S(xs, 6), z: zs, halfBreadth: hb,
      bottom: S(xs.map(x => profileBottom(HB, x)), D_TABLE),
      top: S(xs.map(x => C.zTopAt(x)), D_TABLE), weatherTop: S(xs.map(x => C.deckTopAt(x)), D_TABLE),
      stem: S(zs.map(z => C.xFwd(z)), D_TABLE), stern: S(zs.map(z => C.xAft(z)), D_TABLE),
    },
    drawn: {
      about: 'TS.hullDraw, the drawn shell (site/topsides.js): the model\'s half-breadth at and below her load waterline (z0) and forward of x0, the deck plan\'s round stern above it, open under the counter abaft the stern post and her run\'s narrow lines under the counter\'s knuckle forward of it. It stands on the ship\'s own hull, her ends with it (G24: TS.useHull, the hull the page passes, C.buildShip().hull by default), so forward of x0 it is hull.stations\' own, and the drawn ship (the ports, the windows, the houses) stands on it. It is the shell a viewer draws, sampled here at every station, at x[i], z[j]: every metre, either side of the wells\' ends and of the stern post, at the round stern\'s last 0.72 m, the viewer\'s own rings there (site/app.js, hullStations), where its edge comes round to meet her end (xEnd) athwartships, and every 0.25 m from half a metre abaft the stern post to kFwd, where the counter\'s knuckle is a diagonal crease. Only under the knuckle is it inside the model\'s hull. T1\'s two rules (site/app.js hullRing): the counter\'s knuckle comes down to her waterline by kFwd (knuckleZ[i]); and her rows run level, every ring abaft kFwd taking one set of heights from the keel, each clipped at its own bottom (bottom[i], found as the viewer finds it, on this shell). This table\'s one z grid at every station keeps the rows level everywhere.',
      x0: TS.STERN.x0, x1: TS.STERN.x1, z0: TS.STERN.z0, kFwd: TS.STERN.kFwd, post: TS.STERN.post, xEnd,
      x: S(xsDrawn, 6), z: zs, halfBreadth: hbDrawn,
      bottom: S(xsDrawn.map(x => profileBottom(TS.hullDraw, x)), D_TABLE), top: S(xsDrawn.map(x => C.zTopAt(x)), D_TABLE),
      knuckleZ: S(xsDrawn.map(x => TS.knuckleZ(x)), D_TABLE),
    },
    tiers: Object.assign(plain(C.TIER), {
      law: 'C.tierTop(x, y): over B deck between TIER.B (the bridge deck\'s house, full breadth) to A deck; between TIER.A to the Boat deck, abaft the screen only within houseA of the centreline; a house of TIER.houses (x0 < x <= x1, |y| <= hw) to h over the Boat deck. Buoyant while dry; each compartment\'s space above E deck goes up through them.',
    }),
  };

  // ---------------------------------------------------------------- the subdivision
  const subdivision = {
    bulkheads: C.BULKHEADS.map((b, i) => ({ i, id: b.id, dFP_ft: b.dFP, x: b.x, top: b.top, doors: b.doors.map(([deck, count]) => ({ deck, count })) })),
    zones: ship.zones.map(z => ({ k: z.k, name: z.name, short: z.short, kind: z.kind, mu: z.mu, peak: !!z.peak, xf: z.xf, xa: z.xa, xm: z.xm, len: z.len, floor: z.floor })),
    muUp: C.MU_UP,
    nodes: {
      about: 'The model\'s 64 spaces: n = (zone * 2 + side) * 2 + layer; side 0 port, 1 starboard; layer 0 below E deck, 1 from E deck up (through the tiers). mu: permeability; vmax: what it holds, m3 (permeability counted); columns: the model\'s columns in it (3 m by 0.5 m).',
      list: Array.from({ length: C.NN }, (_, n) => ({ n, zone: n >> 2, side: (n >> 1) & 1, layer: n & 1, mu: ship.nodeMu[n], vmax: F(ship.nodeVmax[n], 3), columns: ship.nodeCount[n] })),
    },
    // U3, the water inside her: each space as the model integrates it, so that a renderer can clip it at the record's level
    spaces: {
      about: 'Each of the 64 spaces (n as in nodes.list) as the flooding integrates it: the model\'s own columns in it (C.buildShip: cols, entCol, entA, entE), each a vertical prism of plan dx by dy centred on (x, y), from a to e (m above the keel). Its water at a pose and a level h (the record\'s channels.water.level, a world Z) is mu times the sum of dx dy (min(e, zp) - a) over the columns where zp > a, zp = (h - base) / R22 and base = R20 x + R21 y + tz (frames.pose): exactly the core\'s nodePass. tools/u3_water_tests.js proves the record\'s volumes come back so.',
      dy: ship.cols.dy,
      list: Array.from({ length: C.NN }, (_, n) => {
        const j0 = ship.nodeStart[n], j1 = j0 + ship.nodeCount[n], x = [], y = [], dx = [], a = [], e = [];
        for (let j = j0; j < j1; j++) { const i = ship.entCol[j]; x.push(ship.cols.x[i]); y.push(ship.cols.y[i]); dx.push(ship.cols.dx[i]); a.push(ship.entA[j]); e.push(ship.entE[j]); }
        return { n, x: S(x, 6), y: S(y, 6), dx: S(dx, 6), a: S(a, 6), e: S(e, 6) };
      }),
    },
  };

  // ---------------------------------------------------------------- the openings
  const conns = [];
  const Sc = sim.conn;
  for (let c = 0; c < Sc.n; c++) {
    if (Sc.kind[c] === C.K.STAIR) continue;                      // the weather openings, below, by their ids
    conns.push({ kind: KIND[Sc.kind[c]], a: Sc.a[c], b: Sc.b[c], law: Sc.type[c], x: Sc.x[c], y: Sc.y[c], z: Sc.z[c], area: Sc.area[c], coef: Sc.coef[c], idx: Sc.idx[c], open: Sc.en[c] === 1 });
  }
  const openings = {
    about: 'The model\'s flow network at the start of the night (C.createSim with the night\'s parameters). connections: a and b are spaces (n), a = -1 the sea; law 0 an orifice (area m2), 1 a weir (area: its width, m; z its crest), 2 an upright opening (lawUpright), 3 a level one (lawLevel); x, y, z in the ship frame; idx: the bulkhead (door, over) or the zone (down, xlow, xmerge, xup, top) it belongs to; open: whether it passes water now (a shut door does not). The hull\'s breaches are made during the night by the ice: the night record lists them.',
    kinds: { door: 'a watertight door in a bulkhead', over: 'over a bulkhead\'s top at its crest (Scotland Road to port, the alleyway to starboard, a stair share each side)', down: 'through E deck (stairways, hatches)', xlow: 'beneath the firemen\'s tunnel (holds 2 and 3)', xmerge: 'over the tunnel\'s top', xup: 'cross passages above E deck', top: 'her weather deck open to the sea once it goes under' },
    connections: conns,
    weather: {
      about: 'The openings to the weather above B deck (C.weatherOpenings): the grand staircases\' doors and domes, then the tiers\' windows, two to a compartment a side a deck. type 2 upright (size its width, dim its height), 3 level (size its area, dim its rim); z its sill or plane, zc where its strength is measured; leak the share of its area open before it gives way; hc the head of sea that breaks it (null: never); nodes the spaces it opens into. Each holds until the head on it reaches hc, then is open for good: the night record gives when.',
      list: sim.stairOps.map((o, i) => ({ i, id: o.id, stair: o.stair || null, type: o.type, x: o.x, y: o.y, z: o.z, zc: o.zc, size: o.size, dim: o.dim, leak: o.leak, hc: o.hc, nodes: o.nodes, label: o.label || o.firstLabel || '' })),
    },
    staircases: plain(C.STAIRS),
    windowRows: plain(C.WINDOWS),
    marks: C.MARKS.map(m => ({ id: m.id, label: m.label, p: m.p(), when: m.when, observedMin: m.obs })),
  };

  // ---------------------------------------------------------------- the machinery under water
  const PL = Sys.PLANT;
  const machinery = {
    screws: PL.screws.map((s, i) => ({ id: ['port', 'centre', 'starboard'][i], x: s.x, y: s.y, z: s.z, R: s.R })),
    rudder: Object.assign({}, PL.rudder, { trace: Sys.RUDDER_TRACE, drawn: V.RUDDER, drawnScale: V.RUDDER_SCALE,
      about: 'trace: [height above the heel, chord from the stock\'s axis], m, from the photograph of the castings; drawn: the same scaled so the area under the night\'s draught aft is the plans\' 401.63 sq ft' }),
    stern: plain(V.STERN),
    engine: plain(V.ENGINE),
    plant: { rooms: plain(PL.rooms), furnaceAbove: PL.furnaceAbove, crank: PL.crank, turbineAxis: PL.turbineAxis, dynamoFlat: PL.dynamoFlat,
      emergency: plain(PL.emergency), pumps: PL.pumps.map(p => ({ room: p.room, LTh: p.LTh, name: p.name })) },
  };

  // ---------------------------------------------------------------- the drawn ship above the hull
  const windows = [];
  for (let i = 0; i < B.windows.length; i += 7) {
    const w = B.windows, x = w[i], z = w[i + 2];
    windows.push({ x, y: w[i + 1], z, nx: w[i + 3], ny: w[i + 4], w: w[i + 5], h: w[i + 6], zone: C.zoneAt(x), deck: deckAt(x, z) });
  }
  const topsides = {
    about: 'site/topsides.js: the drawn ship as one table of sourced numbers (N), her round stern (stern), the davits, and what its builders derive from them. Every part stands on the model\'s decks (C.deckZ), the deck\'s edge on the drawn shell (hull.drawn). x, y, z: the ship frame.',
    N: plain(TS.N),
    stern: plain(TS.STERN),
    davits: { frame0: TS.FRAME0, frames: TS.DAVIT_FRAMES.map(([f, inches]) => ({ frame: f, shiftIn: inches })), x: TS.DAVIT_X, arm: plain(TS.ARM), stations: plain(B.davits) },
    boatDims: plain(TS.BOAT_DIM), roofBoats: plain(TS.ROOF_BOATS),
    derived: {
      about: 'What TS.built() derives from N: each funnel\'s seat and top (top: the centre of its top; pipe: the mouth of its forward escape pipe), each mast\'s foot, hounds and top, the crow\'s nest, each dome\'s cover over C.STAIRS, and the points the viewer\'s smoke and steam leave from',
      funnels: plain(B.funnels), masts: plain(B.masts), nest: plain(B.nest),
      domes: B.domes.map(d => ({ id: d.id, stair: d.stair, x: d.x, a: d.a, b: d.b, z0: d.z0, zGlass: d.zGlass, crown: d.crown, under: d.under })),
      smoke: plain(B.smoke), steam: plain(B.steam),
      sheerLine: { strake: TS.N.strake, x: xs, z: S(xs.map(x => TS.sheerLineZ(x)), D_TABLE), about: 'the yellow sheer line\'s foot: B deck less the white top strake' },
      boatDeckEdge: { x: range(-77, 72, 1), y: S(range(-77, 72, 1).map(x => TS.deckEdge(x)), D_TABLE), about: 'TS.deckEdge(x): the Boat deck\'s half-breadth' },
      aHouse: { x: range(-73, 72, 1), y: S(range(-73, 72, 1).map(x => TS.aHouseHw(x)), D_TABLE), about: 'TS.aHouseHw(x): A deck\'s house, half-breadth (0: none)' },
    },
    windows: { about: 'Every window the viewer draws [appearance: sizes and spacing]: centre (x, y, z), the outward normal (nx, ny, 0) of the face it lies on, its width w and height h; zone: the compartment (C.zoneAt) and deck: the model\'s deck it stands on, so that its light can follow the plant and the sea', list: windows },
    colors: Object.keys(TS.COLORS).reduce((o, k) => { o[k] = hex(TS.COLORS[k]); return o; }, {}),
  };

  // ---------------------------------------------------------------- the lights
  const ports = V.portholes().map(([x, y, z]) => ({ x, y, z, zone: C.zoneAt(x), deck: deckAt(x, z) }));
  const lights = {
    about: 'Her lights burn while the plant\'s dynamos give them current (the night record\'s plant.lights: 1 all of them, 0.15 the emergency lights\' share, 0 none); the viewer fades each change over 3 s, and a light under the sea is dark. Which ports are lit is the viewer\'s [appearance: seven in ten].',
    navigation: V.LIGHTS.map(L => ({ id: L.id, name: L.name, color: hex(L.color), at: L.at, arc: L.arc, miles: L.miles, optional: !!L.optional })),
    ports: { about: 'The lit ports and side windows the viewer draws (V.portholes()): a point on the drawn shell; zone and deck as for windows', list: ports },
  };

  // ---------------------------------------------------------------- the boats
  const boats = {
    about: 'The twenty boats of core/readers/people.js: station x midway between her davits, on the Boat deck\'s edge (station: x, y, z, edge); OUT: a boat swung out stands this far beyond the edge; stowed: where each stands until she is swung out (TS.stowedBoats: the keel\'s middle, L by B by D). The night record gives what becomes of each.',
    out: BP.OUT,
    list: BP.BOATS.map((b, i) => ({ id: b.id, side: b.side, group: BP.GROUPS[b.g].name, cap: b.cap, type: b.type, man: b.man, davits: b.davits || null, after: b.after || null, station: BP.STATION[i] })),
    stowed: TS.stowedBoats(BP),
  };

  // ---------------------------------------------------------------- the sources' words, path by path
  const notes = {
    about: 'Each table as its source file comments it: the comment above an entry and on its lines, and the tags in its brackets ([read] a source states it; [scaled] measured off a plan; [derived] arithmetic on those; [measured] off a figure by script; [bet] a judgement; [appearance] drawn, not a fact of the ship). keys: an object\'s fields; rows: an array\'s rows by their index i. line: the line in the file of this export\'s sources.',
    'hull.particulars': J.notes('core/core.js', 'G'),
    'hull.form.params': J.notes('core/core.js', 'HULL'),
    'hull.tiers': J.notes('core/core.js', 'TIER'),
    'subdivision.bulkheads': J.notes('core/core.js', 'BULKHEADS'),
    'subdivision.zones': J.notes('core/core.js', 'ZONES'),
    'openings.staircases': J.notes('core/core.js', 'STAIRS'),
    'openings.windowRows': J.notes('core/core.js', 'WINDOWS'),
    'openings.marks': J.notes('core/core.js', 'MARKS'),
    'machinery': J.notes('core/systems.js', 'PLANT'),
    'machinery.stern': J.notes('site/visuals.js', 'STERN'),
    'machinery.engine': J.notes('site/visuals.js', 'ENGINE'),
    'lights.navigation': J.notes('site/visuals.js', 'LIGHTS'),
    'topsides.N': J.notes('site/topsides.js', 'N'),
    'topsides.stern': J.notes('site/topsides.js', 'STERN'),
    'topsides.davits.frames': J.notes('site/topsides.js', 'DAVIT_FRAMES'),
    'topsides.davits.arm': J.notes('site/topsides.js', 'ARM'),
    'topsides.boatDims': J.notes('site/topsides.js', 'BOAT_DIM'),
    'boats.list': J.notes('core/readers/people.js', 'BOATS'),
  };

  return {
    format: 'titanic-ship', version: VERSION,
    about: 'The Titanic as this repository\'s model has her, for a modeller in Blender or Unreal: the hull (the model\'s own half-breadth, sampled, with its decks, wells and the tiers above B deck); her subdivision (the bulkheads, the sixteen compartments, the model\'s 64 spaces); every opening of the model\'s flow network; the drawn ship above the hull (site/topsides.js: houses, funnels, masts, davits, domes, windows, the round stern); the screws, rudder and lights (core/systems.js, site/visuals.js); the boats\' stations. Every number is the model\'s or its tables\'. What a source marks [bet] or [appearance] is under notes, path by path. Made by tools/export_ship.js (U0 of docs/BRAINSTORM_titanic_in_unreal_v1_2026-11-20.md); the same sources give the same bytes.',
    made: { by: 'tools/export_ship.js', version: VERSION, sources: J.sources(SOURCES),
      how: 'sources: the git blob id of each file it read (git log --all --find-object=<id> finds the commits holding it)' },
    frames: {
      ship: 'x forward from amidships (halfway between the perpendiculars), y to port, z up from the keel\'s base line; right-handed. Every point in this file is in it unless said otherwise.',
      world: 'the core\'s: X forward along her heading, Y to port of it, Z up, the calm sea\'s surface at Z = 0; it moves with her place and heading and does not yaw. Right-handed.',
      pose: 'heave zO (the world Z of her centre of gravity), pitch (bow down positive), roll (starboard down positive), radians; R = Ry(pitch) Rx(roll); a ship point p stands at R p + t, t = [XO, YO, zO] - R g0 (C.poseFrame; the night record gives g0, XO, YO)',
      earth: 'core/motion.js\'s: X north and Y east, m, from where the watch began; heading psi clockwise from north, rad. A world point (Xw, Yw, Zw) of her when she is at (X, Y) heading psi lies at north X + Xw cos psi + Yw sin psi, east Y + Xw sin psi - Yw cos psi, up Zw (as site/app.js draws her)',
      three: 'the web viewer\'s three.js axes: (x, z, -y) of the ship frame (y up)',
      others: 'Blender\'s and Unreal\'s axes are the generator\'s choice; this file keeps the model\'s',
    },
    units: {
      length: 'm', angle: 'rad, except a key ending in Deg (degrees) and the arcs of the navigation lights (degrees, bearings from her bow, + to starboard)', area: 'm2', volume: 'm3',
      mass: 't (tonnes): sea water at 1.025 t a m3', head: 'm of sea water', LTh: 'long tons of water an hour', dFP_ft: 'ft abaft the forward perpendicular (the British Inquiry\'s figures)',
      numbers: 'at most 6 decimals, 4 in the sampled tables, 3 for volumes; trailing zeros dropped; null where the model has no finite value (an opening that never gives way)',
      color: '#rrggbb [appearance]',
    },
    hull, subdivision, openings, machinery, topsides, lights, boats, notes,
  };
}

function exportShip() { const obj = build(), text = J.text(obj); return { obj, text, bytes: Buffer.byteLength(text), sha256: J.sha256(text) }; }

if (require.main === module) {
  const t0 = Date.now(), r = exportShip(), file = outFile(NAME);
  fs.writeFileSync(file, r.text);
  const h = J.head(SOURCES);
  console.log(NAME + ': ' + r.bytes + ' bytes, sha256 ' + r.sha256 + ' (' + (Date.now() - t0) + ' ms)');
  console.log('  -> ' + file);
  console.log('  from ' + (h.commit || 'no git') + (h.committed ? ', its sources committed' : ', with sources not committed: ' + h.dirty.join(', ')));
}

module.exports = { NAME, VERSION, SOURCES, build, exportShip, deckAt };
