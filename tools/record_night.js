// U0 of docs/BRAINSTORM_titanic_in_unreal_v1_2026-11-20.md (section 7; way 1 of its section 3): a recorded night, one JSON
// file that a renderer plays back on a timeline. The 1912 watch is run exactly as `node tools/night_run.js 1912 auto sink`
// runs it, with every reader of the watch attached as the page attaches them, and every step of it is written down.
//
//   node tools/record_night.js [seed] [auto | none | seconds] [--fall] [--flag]
//     seed, orders   as tools/night_run.js: 1912 and auto (the night's own orders) by default
//     --fall         on from the hand-over to the bed: the night's own fall (core/readers/fall.js, a reader of the watch),
//                    begun at the hand-over as the reader begins it and carried on by the watch's own steps, into the
//                    record's `fall` (without it that stays empty)
//     --flag         the what-if: the watch handed over at its founder flag (handover 'flag'), today's watch before D98
//   The watch ends at its hand-over (G12's switch, D98, the default since version 2): the break's onset (B2's check), or
//   its founder flag where it reaches no onset, or always on --flag.
//   -> out/titanic_night_1912.json (titanic_night_<seed>_<orders>[_flag][_fall].json for any other); under tools/gate.js out/gate/.
//      Not tracked: out/export_tests.txt (tools/export_tests.js) holds its size and hash; it is made again in seconds.
//
// The rate: every step of the model (0.25 s), with nothing between. Measured on the 1912 watch (tools/export_tests.js
// prints it): taking every second step instead, a straight line between samples misses her hull's height at ten
// stations by up to 4.9 cm (in her last minute) and the water's level in a space by up to 0.9 m; every fourth (1 s),
// 8.5 cm at the touch. U2 asks for 0.1 m. So nothing is thinned but the far ships' places (every 10 s, `every`).
//
// What is in it: her pose, place, heading and speed; the rudder and the screws' revolutions; the water in each of the
// model's 64 spaces and what comes in from the sea at each; the flow over each bulkhead's top; the plant's light,
// steam and fires (the lights, the funnels' smoke and steam); the berg; the hull's openings as the ice makes them, the
// weather openings as they give way, the doors; the model's events and the orders; what the readers give (the boats,
// the rockets and the wireless, the other ships, the reports to the bridge, the onset's mark); and at the end the
// night's fingerprint, which the model run alone must give (tools/export_tests.js checks it). The record reads the
// model and feeds nothing back: no physics is changed here, and the readers change nothing above them.
'use strict';
const fs = require('fs');
const C = require('../core/core.js');
const N = require('../core/night.js');
const Mo = require('../core/motion.js');
const J = require('./export_json.js');
const outFile = require('./outdir');
// the readers of the watch, as the page bundles them (core/readers/*.js in name order); each registers itself when loaded
const READER_FILES = ['circuits', 'fall', 'girder', 'onset', 'people', 'reports', 'rooms', 'section', 'world'];
const RD = {};
for (const r of READER_FILES) RD[r] = require('../core/readers/' + r + '.js');
const Fall = RD.fall;

// 2 (G12's cascade, D98): the record ends at the watch's hand-over, the break's onset by default (version 1 ended at the
// founder flag), and its fall is the night's own from there; `end` says which (handover, over)
const VERSION = 2;
const SOURCES = ['core/core.js', 'core/motion.js', 'core/encounter.js', 'core/systems.js', 'core/night.js']
  .concat(READER_FILES.map(r => 'core/readers/' + r + '.js'), ['tools/record_night.js', 'tools/export_json.js']);
const SHIPS_EVERY = 40;            // the other ships' places: every 10 s (they steam straight, tens of km off)
const FALL_MAX = 3600;             // s: the fall is cut off here if a piece never comes to rest
const { S } = J;
const KN = Mo.KN, DEG = Math.PI / 180;

function nameOf(seed, how, fall, flag) { return 'titanic_night_' + seed + (seed === 1912 && how === 'auto' ? '' : '_' + how) + (flag ? '_flag' : '') + (fall ? '_fall' : '') + '.json'; }
function ordersOf(sp, how) { return how === 'auto' ? { auto: true } : (how === 'none' ? {} : { script: N.scriptOf(Object.assign({}, sp.orders, { delay: +how })) }); }

// a channel's values from its first sample with a value to its last, `every` samples apart: { from, every, v }, or null
function span(a, d, empty, every) {
  every = every || 1;
  let i0 = 0, i1 = a.length - 1;
  while (i0 <= i1 && empty(a[i0])) i0++;
  while (i1 >= i0 && empty(a[i1])) i1--;
  if (i0 > i1) return null;
  const v = [];
  for (let i = i0; i <= i1; i += every) v.push(Number.isNaN(a[i]) ? null : a[i]);
  return { from: i0, every, v: S(v, d) };
}
const isNaNv = (x) => Number.isNaN(x);
const isZero = (x) => x === 0 || Number.isNaN(x);
const arrays = (n) => Array.from({ length: n }, () => []);

function record(opts) {
  opts = opts || {};
  const seed = opts.seed === undefined ? 1912 : opts.seed, how = opts.how || 'auto';
  // opts.params: the core's parameters for a what-if (none: the default night, to the bit). opts.handover: 'flag' for the
  // what-if handed over at the founder flag (D98: the default hands over at the break's onset)
  const ship = C.buildShip(), sp = N.spec(seed), sim = N.create(ship, sp, Object.assign(ordersOf(sp, how), opts.params ? { params: opts.params } : {}, opts.handover ? { handover: opts.handover } : {}));
  const w = sim.night, NN = C.NN, NB = C.BULKHEADS.length, K = C.K;
  const P0 = sim.people, W0 = sim.world, CI0 = sim.circuits;
  const nBoats = P0 ? P0.boats.length : 0, ships = W0 ? W0.ships.map(s => s.id) : [];
  // G1 (core/readers/circuits.js): the step each section's fuses were seen to blow (-1 while they hold)
  const ciK = CI0 ? new Int32Array(CI0.sections.length).fill(-1) : null, CIG = CI0 ? RD.circuits.table(ship) : null;
  let nCi = 0;
  const PK = sim.pockets || [], NPK = PK.length;   // the pockets (W6's bunker, G7's peak tank): their water is not in sim.vol
  // the calibration epoch's C5: with params.weighOverfill 0 (the default since its D4) the core's loads weigh a full space
  // or pocket at its capacity, and the record gives her water as they weigh it (C.weighedWater) beside the vol it counts.
  // With 1 (C5 off, a what-if) it gives nothing more
  const WEIGH = sim.params.weighOverfill === 0 && typeof C.weighedWater === 'function';

  // ---------------------------------------------------------------- the channels, one value a step
  const ch = {
    zO: [], pitch: [], roll: [], X: [], Y: [], psi: [], u: [], v: [], r: [], rudderDeg: [], rpmP: [], rpmS: [], rpmC: [], inflow: [],
    level: arrays(NN), vol: arrays(NN), sea: arrays(NN), overP: arrays(NB), overS: arrays(NB), pk: arrays(NPK), weighed: [],
    lights: [], power: [], emergency: [], p: [], gen: [], demand: [], firing: [], blow: [], fires: arrays(6),
    bergX: [], bergY: [], bergPSI: [], boatH: arrays(nBoats), shipX: arrays(ships.length), shipY: arrays(ships.length),
  };
  // ---------------------------------------------------------------- what changes now and then, with the step it was seen at
  const events = [], hull = [], hullById = new Map(), weather = [], doors = [], boatChanges = [], peopleLog = [], rockets = [], lamp = [],
    lines = [], shipChanges = [], feed = [];
  let nEv = 0, nPL = 0, nRk = 0, nLm = 0, nLn = 0, nFd = 0, onset = null;
  const stPrev = new Uint8Array(sim.stairOps.length), doorPrev = Array.from({ length: NB }, (_, b) => ({ open: sim.doorOpen[b], falling: sim.doorFall[b] >= 0 }));
  const boatPrev = P0 ? P0.boats.map(b => b.state) : [], shipPrev = W0 ? W0.ships.map(s => s.state) : [];
  const seaQ = new Float64Array(NN), oP = new Float64Array(NB), oS = new Float64Array(NB);

  function take() {
    const k = w.k, m = sim.mo, Sc = sim.conn;
    ch.zO.push(sim.zO); ch.pitch.push(sim.pitch); ch.roll.push(sim.roll);
    ch.X.push(m.X); ch.Y.push(m.Y); ch.psi.push(m.psi); ch.u.push(m.u); ch.v.push(m.v); ch.r.push(m.r);
    ch.rudderDeg.push(m.del / DEG); ch.rpmP.push(m.nP); ch.rpmS.push(m.nS); ch.rpmC.push(m.nC); ch.inflow.push(sim.inflow);
    seaQ.fill(0); oP.fill(0); oS.fill(0);
    for (let c = 0; c < Sc.n; c++) {
      if (Sc.a[c] < 0) seaQ[Sc.b[c]] += Sc.q[c];
      if (Sc.kind[c] === K.OVER) { if (Sc.y[c] > 0) oP[Sc.idx[c]] += Sc.q[c]; else oS[Sc.idx[c]] += Sc.q[c]; }
    }
    for (let n = 0; n < NN; n++) {
      const wet = sim.vol[n] > 1e-6;
      ch.level[n].push(wet ? sim.level[n] : NaN); ch.vol[n].push(wet ? sim.vol[n] : NaN); ch.sea[n].push(seaQ[n]);
    }
    for (let j = 0; j < NPK; j++) { const v = PK[j].vol; ch.pk[j].push(v > 1e-6 ? v : NaN); }   // each pocket's own water (QC B-3)
    if (WEIGH) ch.weighed.push(C.weighedWater(sim));                                           // C5, dark: her water as loads weigh it
    for (let b = 0; b < NB; b++) { ch.overP[b].push(oP[b]); ch.overS[b].push(oS[b]); }
    const PL = sim.plant;
    ch.lights.push(PL.lights); ch.power.push(PL.power ? 1 : 0); ch.emergency.push(PL.emergency ? 1 : 0); ch.p.push(PL.p); ch.gen.push(PL.gen);
    ch.demand.push(PL.demand); ch.firing.push(PL.firing); ch.blow.push(PL.blow);
    for (let i = 0; i < 6; i++) ch.fires[i].push(PL.fires[i]);
    const bg = sim.enc.berg; ch.bergX.push(bg.X); ch.bergY.push(bg.Y); ch.bergPSI.push(bg.PSI);

    // the model's events and the hull's openings
    for (; nEv < sim.events.length; nEv++) { const e = sim.events[nEv]; events.push({ k, t: e.t, id: e.id, label: e.label }); }
    for (const o of sim.openings) {
      let h = hullById.get(o.id);
      if (!h) {
        h = { id: o.id, kind: o.kind, label: o.label, x: o.x, y: o.y, z: o.z, nx: o.nx === undefined ? null : o.nx, ny: o.ny === undefined ? null : o.ny,
          node: o.node, zone: o.zone, side: o.side, layer: o.layer, k, tOpen: o.tOpen, at: [], area: [] };
        hullById.set(o.id, h); hull.push(h);
      }
      if (!h.area.length || h.area[h.area.length - 1] !== o.area) { h.at.push(k); h.area.push(o.area); }
    }
    for (let j = 0; j < stPrev.length; j++) if (sim.stairSt[j] !== stPrev[j]) {
      weather.push({ k, i: j, id: sim.stairOps[j].id, state: sim.stairSt[j], t: sim.stairT[j] >= 0 ? sim.stairT[j] : sim.t });
      stPrev[j] = sim.stairSt[j];
    }
    for (let b = 0; b < NB; b++) {
      const open = sim.doorOpen[b], falling = sim.doorFall[b] >= 0, d = doorPrev[b];
      if (open !== d.open || falling !== d.falling) { doors.push({ k, b, id: C.BULKHEADS[b].id, open: open === 1, falling }); d.open = open; d.falling = falling; }
    }
    // the readers
    const P = sim.people;
    if (P) {
      for (let i = 0; i < nBoats; i++) {
        const b = P.boats[i];
        ch.boatH[i].push(b.state === 'lowering' ? b.h : NaN);
        if (b.state !== boatPrev[i]) {
          boatChanges.push({ k, boat: RD.people.BOATS[i].id, state: b.state, n: b.n, place: b.place ? { X: b.place.X, Y: b.place.Y, psi: b.place.psi } : null });
          boatPrev[i] = b.state;
        }
      }
      for (; nPL < P.log.length; nPL++) { const l = P.log[nPL]; peopleLog.push({ k, t: l.t, boat: l.id, what: l.what }); }
    }
    const Wd = sim.world;
    if (Wd) {
      for (; nRk < Wd.rockets.times.length; nRk++) rockets.push({ k, t: Wd.rockets.times[nRk] });
      for (; nLm < Wd.lamp.times.length; nLm++) lamp.push({ k, t: Wd.lamp.times[nLm] });
      for (; nLn < Wd.lines.length; nLn++) { const l = Wd.lines[nLn]; lines.push({ k, t: l.t, kind: l.kind, who: l.who, text: l.text }); }
      Wd.ships.forEach((s, i) => {
        ch.shipX[i].push(Wd.anchored ? s.X : NaN); ch.shipY[i].push(Wd.anchored ? s.Y : NaN);
        if (s.state !== shipPrev[i]) { shipChanges.push({ k, ship: s.id, state: s.state, how: s.how }); shipPrev[i] = s.state; }
      });
    }
    const Rp = sim.reports;
    if (Rp) for (; nFd < Rp.feed.length; nFd++) {
      const f = Rp.feed[nFd];
      feed.push({ k, n: f.n, t: f.t, tFact: f.tFact, ch: f.ch, who: f.who, by: f.by, words: f.words, kind: f.kind, rule: f.rule, qty: f.qty });
    }
    if (!onset && sim.onset && sim.onset.found) onset = Object.assign({ seenK: k }, sim.onset.found);
    const Ci = sim.circuits;
    if (Ci && Ci.out !== nCi) { for (let j = 0; j < ciK.length; j++) if (ciK[j] < 0 && Ci.sections[j].out >= 0) ciK[j] = k; nCi = Ci.out; }
  }

  // ---------------------------------------------------------------- the watch, as night_run.js runs it
  take();
  // N.run's loop: to the end of the encounter (the ice passed), or 600 s
  while (sim.t < 600 && w.tClear < 0) { N.step(sim); take(); }
  const encounter = { k: w.k, t: sim.t, fingerprint: N.fingerprint(sim) };
  // N.sink's loop: on until her hand-over (N.over: the break's onset by default, D98; the founder flag on a 'flag' watch
  // or where no onset comes), or she lies steady after four hours, or eight hours. Past the hand-over the model stands
  // still (Z3), so the record ends there
  while (!N.over(sim) && sim.t < 8 * 3600) {
    N.step(sim); take();
    if (sim.t > 4 * 3600 && Math.abs(sim.inflow) < 0.02 && Math.abs(sim.wth) < 1e-5) break;
  }
  const over = !!N.over(sim), handover = w.handover === 'onset' ? 'onset' : 'flag';
  const end = { k: w.k, t: sim.t, foundered: sim.foundered, founderT: sim.founderT, fingerprint: N.fingerprint(sim), handover, over,
    tOver: over ? (sim.foundered ? sim.founderT : (w.onset || sim.onset).found.t) : null };
  const sm = N.summary(sim);

  // ---------------------------------------------------------------- the fall (--fall): the night's own, from the hand-over
  const fallRec = fallSection(sim, opts.fall && over ? recordFall(sim) : null, end.k, opts.fall && !over ? 'Not recorded: the watch reached no hand-over (no onset of the break, no founder flag), so there is no fall.' : null);

  // ---------------------------------------------------------------- the file
  const nS = ch.zO.length;
  const rd = (d) => (a) => S(a, d);
  const obj = {
    format: 'titanic-night', version: VERSION,
    about: 'One night of the model, step by step, for a renderer to play back: her pose, place, heading and speed; the water in each of the model\'s 64 spaces; the openings as they open; her lights, steam and fires; the berg; the model\'s events and the orders; what the readers of the watch give (the boats, the rockets and the wireless, the other ships, the reports, the onset\'s mark, her lights by circuit); and the night\'s fingerprint at the end, which the model run alone gives. The ship it plays on is tools/export_ship.js\'s (titanic_ship.json): its spaces, openings and boats are numbered as there. Made by tools/record_night.js (U0 of docs/BRAINSTORM_titanic_in_unreal_v1_2026-11-20.md); the same sources give the same bytes.',
    made: { by: 'tools/record_night.js', version: VERSION, sources: J.sources(SOURCES),
      how: 'sources: the git blob id of each file it ran (git log --all --find-object=<id> finds the commits holding it). The watch is run as tools/night_run.js runs it (N.run, then N.sink), with every reader attached as the page attaches them, to its hand-over (end.handover).' },
    frames: {
      ship: 'x forward from amidships, y to port, z up from the keel\'s base line (as titanic_ship.json)',
      world: 'the core\'s: X forward along her heading, Y to port of it, Z up, the calm sea at Z = 0; it moves with her place and heading',
      pose: 'zO the world Z of her centre of gravity, pitch bow down +, roll starboard down +, rad; R = Ry(pitch) Rx(roll) = [[cp, sp sr, sp cr], [0, cr, -sr], [-sp, cp sr, cp cr]] (cp = cos pitch, sr = sin roll ...); a ship point p stands at R p + t in the world, t = [XO, YO, zO] - R g0 (constants below; C.poseFrame)',
      earth: 'X north, Y east, m, from where the watch began; psi her heading clockwise from north, rad (core/motion.js). A world point (Xw, Yw, Zw) of her lies at north X + Xw cos psi + Yw sin psi, east Y + Xw sin psi - Yw cos psi, up Zw (as site/app.js draws her)',
      motion: 'u ahead and v to STARBOARD, m/s, at amidships; r her rate of turn, rad/s, + turning her head to starboard; rudderDeg + to starboard (head to starboard); rpm + ahead (core/motion.js, the manoeuvring literature\'s frame)',
      berg: 'the berg\'s centre in the earth frame (X north, Y east), and PSI its own turn about the vertical, rad (core/encounter.js)',
    },
    units: {
      time: 's from the start of the watch (t = k dt); the ship\'s clock reads night.clock0 + t (s after midnight of the 14th)',
      length: 'm', angle: 'rad, except rudderDeg (degrees)', volume: 'm3', flow: 'm3/s (sea water; 1.025 t a m3)', rpm: 'revolutions a minute',
      share: 'plant: p the steam pressure as a share of the working 215 psi; gen the steam raised and demand the steam asked, as shares of full firing; firing the stokers\' firing; blow the steam blown off at the safety valves; lights 1 all her light, 0.15 the emergency lights alone, 0 dark; power, emergency 1 or 0: the main and the emergency dynamos running; fires[i] the share of boiler room i\'s fires burning, i = 0 boiler room 6 (forward) to 5 boiler room 1 (core/systems.js)',
      numbers: 'fixed decimals: lengths 3, angles 6, speeds 3, flows 3, volumes 1, shares 4, rudder and rpm 2, the far ships\' places 1; trailing zeros dropped; null: no value (a dry space has no level)',
    },
    night: {
      seed: sp.seed, gen: sp.gen, title: sp.title, orders: how, describe: N.describe(sp), clock0: sp.clock0,
      spec: JSON.parse(JSON.stringify(sp)), params: Object.assign({}, sim.params),
      readers: N.READERS.map(r => ({ name: r.name, state: r.state || null })),
    },
    constants: { dt: sim.params.dt, g0: sim.g0, XO: sim.XO, YO: sim.YO, massT: sim.ms / 1000, KG: sim.KG },
    clock: { k0: 0, n: nS, about: 'sample i is the state after step k = k0 + i of the watch, at t = k dt; sample 0 is the watch as it began. A span ({ from, every, v }) holds a channel from sample `from`, one value every `every` samples; null where the channel has no value then (a span absent: never one)' },
    channels: {
      zO: S(ch.zO, 3), pitch: S(ch.pitch, 6), roll: S(ch.roll, 6),
      X: S(ch.X, 3), Y: S(ch.Y, 3), psi: S(ch.psi, 6),
      u: S(ch.u, 3), v: S(ch.v, 3), r: S(ch.r, 6), rudderDeg: S(ch.rudderDeg, 2),
      rpm: { port: S(ch.rpmP, 2), starboard: S(ch.rpmS, 2), centre: S(ch.rpmC, 2) },
      inflow: S(ch.inflow, 3),
      water: {
        about: 'For each of the 64 spaces (n as in titanic_ship.json\'s subdivision.nodes): level, the world Z of its water\'s surface (a level plane in the world: draw it clipped to the space at her pose); vol, m3 of water in it. null while it is dry. A pocket\'s water is not in its space\'s vol: see pockets. The core solves its levels as a step begins, before it moves the water and her (C.step), so the level of sample i holds the vol of sample i - 1 at the pose of sample i - 1 (within the solve\'s tolerance, 0.1 % of what the space or its pair holds up to the hull\'s top or 0.5 m3); the level that holds sample i\'s vol at sample i\'s pose is sample i + 1\'s (tools/u3_water_tests.js)',
        level: ch.level.map(a => span(a, 3, isNaNv)), vol: ch.vol.map(a => span(a, 1, isNaNv)),
        pockets: {
          about: 'The pockets inside her spaces (the core\'s sim.pockets: W6\'s bunker, G7\'s peak tank), each holding water of its own, outside its space\'s vol. list: where each stands in the ship frame (x0 to x1 and z0 to z1, m; its middle xc, yc), its capacity cap (m3), its space node (n as above) and side: 1, inside node; -1, of both sides, inside node and its port twin node - 2. vol: m3 of its water at each step, null while it holds none (a pocket that gives way empties into its space at once: the event bunker). Place its water as the core does: from z0 up to z0 + (z1 - z0) min(vol, cap) / cap in her frame, its surface the world\'s level through (xc, yc) at that height; water past cap stands for the sea\'s head over a full pocket and is not drawn. Count it all: a space\'s water as the core counts it (C.spaceWater) is its vol with its pockets\' vol (a pocket of both sides half to each half), and over the 64 spaces that is the water aboard',
          list: PK.map(k => ({ name: k.name, node: k.node, side: k.side, x0: J.F(k.x0, 3), x1: J.F(k.x1, 3), z0: J.F(k.z0, 3), z1: J.F(k.z1, 3), xc: J.F(k.xc, 3), yc: J.F(k.yc, 3), cap: J.F(k.cap, 1) })),
          vol: ch.pk.map(a => span(a, 1, isNaNv)),
        },
        ...(WEIGH ? { weighed: {
          about: 'Only with the core\'s params.weighOverfill 0 (the calibration epoch\'s C5): her water as the core\'s loads weigh it. A full space weighs its capacity (subdivision.nodes\' vmax) and a full pocket its cap; the water past them stands for the sea\'s head and is counted in vol above but not weighed. total: m3 each step, the core\'s C.weighedWater: each space\'s vol cut at its vmax and each pocket\'s at its cap, summed',
          total: span(ch.weighed, 1, isZero),
        } } : {}),
      },
      sea: { about: 'For each space: m3/s coming in from the sea through every opening into it (the ice\'s, the weather openings, her deck going under); negative: going out', flow: ch.sea.map(a => span(a, 3, isZero)) },
      over: { about: 'For each bulkhead (i as subdivision.bulkheads): m3/s flowing aft over its top on the port side (Scotland Road) and on the starboard side (the alleyway), each with its stair share', port: ch.overP.map(a => span(a, 3, isZero)), starboard: ch.overS.map(a => span(a, 3, isZero)) },
      plant: {
        lights: S(ch.lights, 2), power: S(ch.power, 0), emergency: S(ch.emergency, 0), p: S(ch.p, 4), gen: S(ch.gen, 4), demand: S(ch.demand, 4),
        firing: S(ch.firing, 4), blow: S(ch.blow, 4), fires: ch.fires.map(rd(4)),
        smoke: 'The viewer\'s smoke leaves the three working funnels\' tops (titanic_ship.json, topsides.derived.smoke) every second [appearance: always]; the model\'s numbers behind it are gen and fires',
        steam: 'The viewer\'s steam jets from the escape pipes (topsides.derived.steam) while blow > 0.02, 1 + floor(3 min(1, blow)) jets a pipe each half second [appearance]',
      },
      berg: { X: S(ch.bergX, 3), Y: S(ch.bergY, 3), PSI: S(ch.bergPSI, 6) },
      boats: { about: 'For each boat (as boats.list in titanic_ship.json and readers.boats.list here): h, m above the sea, while she is being lowered (the deck\'s edge at her station less what she has been lowered); before, she hangs at the deck\'s edge, which her pose gives', h: ch.boatH.map(a => span(a, 3, isNaNv)) },
      ships: ships.map((id, i) => ({ id, X: span(ch.shipX[i], 1, isNaNv, SHIPS_EVERY), Y: span(ch.shipY[i], 1, isNaNv, SHIPS_EVERY) })),
    },
    events: events.map(e => ({ k: e.k, t: e.t, id: e.id, label: e.label })),
    orders: w.log.map(o => ({ k: o.k, t: o.t, type: o.type, value: o.value, arg: o.arg === undefined ? null : o.arg, refused: o.refused || null })),
    openings: {
      about: 'hull: the openings the ice made, each where it is (ship frame; nx, ny its outward normal), the space it lets the sea into (node) and from the step it appeared (k) its area, m2, as it grew (at: the steps; area: the areas from them on). weather: each weather opening of titanic_ship.json (openings.weather.list[i]) as the sea reached it (state 1: wet, leaking) and as it gave way (state 2, for good). doors: each watertight door\'s bulkhead (b) as its doors opened, began to fall or shut',
      hull: hull.map(h => ({ id: h.id, kind: h.kind, label: h.label, x: h.x, y: h.y, z: h.z, nx: h.nx, ny: h.ny, node: h.node, zone: h.zone, side: h.side, layer: h.layer, k: h.k, tOpen: h.tOpen, at: h.at, area: S(h.area, 6) })),
      weather, doors,
    },
    readers: {
      boats: RD.people ? {
        about: 'core/readers/people.js: each boat\'s state as it changed (covered, cleared, swungOut, loading, lowering, away, floated, lost), with the people in her then; place: where she reached the water (earth frame; psi her heading then). log: the reader\'s own notes',
        list: RD.people.BOATS.map(b => ({ id: b.id, side: b.side, cap: b.cap, type: b.type })),
        changes: boatChanges, log: peopleLog, count: Object.assign({}, sim.people.count),
      } : null,
      world: sim.world ? {
        about: 'core/readers/world.js: the rockets fired and the lamp worked (t), the wireless room\'s lines, each ship\'s state as it changed (its place: channels.ships)',
        rockets, lamp, wireless: lines, ships: sim.world.ships.map(s => ({ id: s.id, name: s.name, kn: s.kn })), shipChanges,
      } : null,
      reports: sim.reports ? { about: 'core/readers/reports.js: the reports to the bridge, as they reached it', feed } : null,
      onset: { about: 'core/readers/onset.js: the onset of the break, a mark that breaks nothing: the step (k), time (t; T minutes after the touch), the station x along her and its compartment, the sense, the moment and its capacity (N m), the shear and its capacity (N), her trim and list then. null: none before the flag', found: onset },
      circuits: CI0 ? {
        about: 'core/readers/circuits.js (G1 of docs/DESIGN_the_living_ship_v1_2026-11-23.md; its bets as it states them): her lights by circuit. Each section is one of core/readers/rooms.js\'s slabs, one deck\'s space in one watertight compartment on one side (key zone:P|S:floor; side 0 port, 1 starboard; floor the deck it stands on, "below G" the lowest; node its space, n as in titanic_ship.json), with a main and an emergency circuit. share: its share of her light (its floor\'s share of her floors); emergency: the emergency circuits\' share of each section\'s light (the plant\'s). out: the step its fuses blew, both circuits and for good (null: they held to the flag): the first step at whose start the core\'s level in its space (channels.water.level at that sample, with more than 0.5 m3 in the space) stood short m over the section\'s floor at its middle (x, y, z in her frame; h its mean height: a section lower than short blows at z + h), at her pose as that step began (the sample before). A section\'s light is the plant\'s lights (channels.plant.lights) until its out step, then none; her light by circuit is the plant\'s lights times the shares of the sections still holding',
        short: CI0.short, emergency: CI0.emergency,
        sections: CI0.sections.map((s, j) => ({ key: s.key, zone: s.zone, side: s.side, floor: s.floor, node: CIG.n[j], share: J.F(s.share, 8),
          x: J.F(CIG.x[j], 3), y: J.F(CIG.y[j], 3), z: J.F(CIG.z[j], 3), h: J.F(CIG.h[j], 3), out: ciK[j] < 0 ? null : ciK[j] })),
      } : null,
    },
    end: {
      k: end.k, t: end.t, foundered: end.foundered, founderT: end.founderT, fingerprint: end.fingerprint,
      encounter: { k: encounter.k, t: encounter.t, fingerprint: encounter.fingerprint, about: 'what tools/night_run.js prints: the fingerprint at the end of the encounter' },
      about: 'The record ends at the watch\'s hand-over (version 2, G12\'s switch, D98): handover \'onset\' (the default) at the break\'s onset, B2\'s check (readers.onset.found), or \'flag\' (the what-if, or a watch that reaches no onset) at the founder flag; over: whether it was reached; tOver: its time (s). fingerprint: core/night.js\'s hash of the watch at its last step, which the model run alone (no readers, no record) gives at the same step: tools/export_tests.js checks it. foundered and founderT are the core\'s flag, false and -1 at an onset hand-over',
      summary: { kind: sm.kind, verdict: N.verdict(sim), tBells: sm.tBells, tOrder: sm.tOrder, tTouch: sm.tTouch, tClear: sm.tClear, reaction: sm.reaction, knTouch: sm.knTouch, areaM2: sm.area, zones: sm.zones },
      handover: end.handover, over: end.over, tOver: end.tOver,
    },
    fall: fallRec,
  };
  const text = J.text(obj);
  return { obj, text, bytes: Buffer.byteLength(text), sha256: J.sha256(text), name: nameOf(seed, how, !!opts.fall, opts.handover === 'flag'), end, encounter, steps: nS - 1 };
}

// ------------------------------------------------------------------ the fall
// The night's own fall (Z3; D98): core/readers/fall.js, a reader of the watch, begins it on the first step past the
// hand-over, t0 the hand-over's time: at the break's onset with rule 'break', the pieces cut at the onset's station and
// the onset's own air (G12's step 1); at the founder flag with rule 'flag'. The watch's own steps carry it on. Here it is
// begun at the hand-over with the reader's own options (its onStep's), so that sample 0 is the hand-over, each piece at
// the core's pose there (she does not jump); then each of the watch's steps advances it (the reader's step), one sample a
// step, until every piece is at rest
function recordFall(sim) {
  const onset = !sim.foundered;
  Fall.begin(sim, onset ? { any: true, cut: sim.onset.found.x, rule: 'break', t0: sim.onset.found.t } : { t0: sim.founderT });
  const f = sim.fall, np = f.pieces.length, pc = [];
  for (let i = 0; i < np; i++) pc.push({ X: [], Y: [], Z: [], qw: [], qx: [], qy: [], qz: [], depth: [], speed: [], air: [], changes: [] });
  const states = f.pieces.map(() => null);
  const takeF = (j) => {
    f.pieces.forEach((p, i) => {
      const c = pc[i];
      c.X.push(p.r[0]); c.Y.push(p.r[1]); c.Z.push(p.r[2]); c.qw.push(p.q[0]); c.qx.push(p.q[1]); c.qy.push(p.q[2]); c.qz.push(p.q[3]);
      c.depth.push(p.depth); c.speed.push(p.speed); c.air.push(p.air);
      if (p.state !== states[i]) { c.changes.push({ i: j, state: p.state }); states[i] = p.state; }
    });
  };
  let j = 0;
  takeF(j);
  while (!f.done && f.t < f.t0 + FALL_MAX) { N.step(sim); takeF(++j); }
  return { f, pc };
}
function fallSection(sim, got, kOver, whyNot) {
  const base = {
    contract: 2,
    about: 'sim.fall (core/readers/fall.js, in contract v: 2\'s form) from the watch\'s hand-over (end.handover: the break\'s onset by default, D98; the founder flag on a \'flag\' watch) to the bed: each piece\'s pose as the engine carries it, r (where her ship frame\'s origin is, in the fall\'s world: the core\'s world frame at the hand-over, placed on the earth by `at` as frames.earth says) and q = [w, x, y, z] (her attitude, R(q) p + r for a ship point p); depth (her lowest point, m under the sea), speed (her centre of mass\'s, m/s), air (m3); her state as it changed (afloat, under, falling, striking, at rest), at sample i. clock: sample i at t = t0 + i dt; sample 0 the hand-over, each piece at the core\'s pose there (frames.pose at the watch\'s last sample), so that she does not jump. events: the engine\'s (under, strike, rest), each at its sample. sea: the column and the bed (the bed\'s depth at (X, Y) of the fall\'s world: depth + slope[0] X + slope[1] Y)',
  };
  if (!got) {
    return Object.assign(base, {
      recorded: false,
      why: whyNot || 'Not recorded here: tools/record_night.js --fall records the night\'s own fall from the hand-over, in this same form.',
      rule: null, t0: null, dt: sim.params.dt, at: null, breakAt: null, sea: null, clock: { k0: kOver, n: 0 }, done: null, pieces: [], events: [],
    });
  }
  const { f, pc } = got, sea = f.sea, dt = sim.params.dt;     // the engine steps at the model's dt (the contract: t = t0 + k dt)
  return Object.assign(base, {
    recorded: true,
    why: f.rule === 'break'
      ? 'The night\'s own fall (the fall reader, Z3), begun at the break\'s onset as the reader begins it (rule \'break\': the pieces cut at the onset\'s station, the onset\'s own air) and carried on by the watch\'s own steps at dt'
      : 'The night\'s own fall (the fall reader, Z3), begun at the founder flag as the reader begins it (rule \'flag\', the interim H1: the break taken at the flag) and carried on by the watch\'s own steps at dt',
    rule: f.rule, t0: f.t0, dt, at: { X: f.at.X, Y: f.at.Y, psi: f.at.psi }, breakAt: f.breakAt,
    sea: { depth: sea.depth, dz: sea.dz, n: sea.n, slope: sea.slope, relief: sea.relief, T: S(sea.T, 3), rho: S(sea.rho, 3) },
    clock: { k0: kOver, n: pc.length ? pc[0].X.length : 0 }, done: !!f.done,
    pieces: f.pieces.map((p, i) => {
      const c = pc[i];
      return { id: p.id, x0: p.x0, x1: p.x1, r: { X: S(c.X, 3), Y: S(c.Y, 3), Z: S(c.Z, 3) }, q: { w: S(c.qw, 7), x: S(c.qx, 7), y: S(c.qy, 7), z: S(c.qz, 7) },
        depth: S(c.depth, 2), speed: S(c.speed, 3), air: S(c.air, 1), changes: c.changes };
    }),
    events: f.events.map(e => ({ i: Math.round((e.t - f.t0) / dt), t: e.t, id: e.id, piece: e.piece, depth: e.depth, energy: e.energy, speed: e.speed })),
  });
}

if (require.main === module) {
  const a = process.argv.slice(2), fall = a.includes('--fall'), flag = a.includes('--flag'), pos = a.filter(s => !s.startsWith('--'));
  const seed = pos[0] === undefined ? 1912 : +pos[0], how = pos[1] === undefined ? 'auto' : pos[1];
  const t0 = Date.now(), r = record({ seed, how, fall, handover: flag ? 'flag' : undefined }), file = outFile(r.name);
  fs.writeFileSync(file, r.text);
  const h = J.head(SOURCES);
  console.log(r.name + ': ' + r.steps + ' steps, ' + r.bytes + ' bytes, sha256 ' + r.sha256 + ' (' + (Date.now() - t0) + ' ms)');
  console.log('  fingerprint ' + r.end.fingerprint + ' at step ' + r.end.k + (r.end.over ? ', handed over (' + r.end.handover + ') at t ' + r.end.tOver + ' s' : ', afloat') + '; at the end of the encounter ' + r.encounter.fingerprint + ' at step ' + r.encounter.k);
  console.log('  -> ' + file);
  console.log('  from ' + (h.commit || 'no git') + (h.committed ? ', its sources committed' : ', with sources not committed: ' + h.dirty.join(', ')));
}

module.exports = { VERSION, SOURCES, SHIPS_EVERY, nameOf, ordersOf, record, span };
