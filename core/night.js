/*
 * The night and the watch (P4 of docs/BRAINSTORM_ship_under_way_v1_1): a scenario drawn from a seed, the lookout's
 * sighting, the bridge's orders, and the record that lets a night be replayed exactly.
 *
 *   spec(seed)            the night: where the berg lies, how large its spur is, how far off the lookout sees it.
 *                         Seed 1912 is reserved for the reconstructed night of 14 April 1912 (fixed, not drawn).
 *   create(ship, spec)    a sim with the ship under way (core/motion.js) and the berg ahead (core/encounter.js)
 *   step(sim)             orders due, one step of the encounter, then the lookout: bells, touch, clear
 *   helm, telegraph       the bridge's orders. Every order is logged with the step it was given at, so
 *   replay(ship, spec, log)   gives the same night again, bit for bit (tools/night_tests.js proves it).
 *   forecast(ship, forecastOf(sim))   a copy of the watch run on with no further order: the page's forecast (Y6)
 *
 * Nothing before the bells tells the bridge that ice is there. The time from the bells to the first order is the
 * reaction time; the viewer's Bridge panel and the scripts below give their orders through the same two functions.
 *
 * Geometry. The ship starts on her course at her speed; the berg's centre lies `off` metres to starboard of her track
 * (negative: to port) and far enough ahead that, if she holds her course, the range from her stem to the ice falls
 * to `sighting` after `lead` seconds. Frame: as motion.js (x forward, y to starboard; earth x north, y east).
 *
 * What is drawn at random, and from what spread, is a design choice [bet], listed in draw(). A change there changes
 * every seeded night, so the generator carries a version (GEN).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./core.js'), require('./motion.js'), require('./encounter.js'), require('./systems.js'));
  else root.TitanicNight = factory(root.TitanicCore, root.TitanicMotion, root.TitanicEncounter, root.TitanicSystems);
})(typeof self !== 'undefined' ? self : this, function (C, Mo, E, Sys) {
  'use strict';
  const DEG = Math.PI / 180, KN = Mo.KN, GEN = 1;
  const XS = C.xFwd(8);                       // the stem, as encounter.js measures "ahead"
  const XA = C.G.xAP - C.G.sternOverhang;     // the stern
  const HALF_B = 0.5 * C.G.B;

  // a deterministic stream from a 32-bit seed (mulberry32: integer arithmetic only, the same on every engine)
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
  const r1 = x => Math.round(x * 10) / 10;

  // The bridge's orders on 14 April 1912 as this repository reconstructs them (tools/encounter_tests.js, G1912):
  // helm hard over away from the ice 20.5 s after the bells, reversed at the first touch ("port around"), engines
  // stopped and the helm amidships a minute later. No engine order before the touch.
  const ORDERS_1912 = { delay: 20.5, turn: 'away', around: 0, stop: 60 };

  // Where the ice was when the helm went over on the reconstructed night: her stem `ahead` m short of it, the ice
  // reaching `port` m to port of her track. Not a record: fitted so that the contact makes the damage the record
  // describes (tears from the stem aft along the starboard side, the split against Hackett and Bedford's), the sighting
  // falls at about 500 yards and the impact 20-25 s after the order. P3 found 220 m and 32 m (e5); refitted with the
  // handling's consensus (M2, e9): 224 m and 36 m; refitted with P3c's contact law (e13, e14): 256 m and 46 m; refitted
  // with M3 and M4's handling (e17): 257 m and 47 m (tears x 123 to 42, from the stem into boiler room 5; split error 29
  // points; sighted at about 495 m; impact 25.9 s after the order; the core then sinks her 158.6 minutes after the touch).
  // She grazes the edge of a stem strike there: a metre either way changes the damage a good deal (e14, e17), as the
  // 1912 timing was near the worst (the miss window); no point in the timeline is steadier across courses (e17, P3e).
  // tools/encounter_tests.js, tools/calibrate_encounter.js and tools/night_tests.js read it from here.
  const GEOM_1912 = { ahead: 257, port: 47 };

  // The reconstructed night. With the order 20.5 s after the bells at 22.5 knots the sighting falls at 463 m: the
  // British report's "about 500 yards" (457 m). Course 266 deg true at 22.5 knots (Halpern).
  function historic(speedKn) {
    // off: the ice's centre from her track, + to starboard; reaching `port` m to port means its centre R - port to starboard
    const dt = C.DEFAULT_PARAMS.dt, u = Mo.create({ knots: 22.5 }).u, R = E.ICE.R, off = R - GEOM_1912.port, ahead = GEOM_1912.ahead;
    const reach = ahead + R + u * (ORDERS_1912.delay + 0.5 * dt);
    return {
      gen: GEN, seed: 1912, kind: '1912', title: 'The watch of 14 April 1912',
      // the bells 13.75 s into the watch, so that she touches at 11:40 pm (the Report): the order 20.5 s after them, the
      // impact 25.9 s after that (P3c's geometry; it was 17.25 s before P3c)
      speedKn: speedKn || 22.5, heading: 266, lead: 13.75, off, sighting: Math.sqrt(reach * reach + off * off) - R,
      // the recorded order, "hard-a-starboard": her head to port (rudder -40). Drawn nights keep 'away' for their bergs;
      // at P3c's geometry the berg's centre lies 6 m to port of her track, where 'away' would turn her to starboard
      ice: {}, orders: Object.assign({}, ORDERS_1912, { turn: -40 }), clock0: 23 * 3600 + 39 * 60, berg: { h: 20, seed: 1912 },
      // D112: the engineers raise the after doors by hand, as the record has it (core/systems.js, DOORS_RAISED)
      plant: { doorsRaised: 1912 },
    };
  }

  // A night drawn from a seed. The spreads [bet]:
  //   spur radius 25 to 60 m (the 1912 fit is 40), mass with its cube from 100,000 t at 40 m;
  //   top of the spur 4.5 to 6.5 m below the waterline (1912: 5.75), three bands a metre apart;
  //   sighting 250 to 595 m around the 500 yards (457 m) of 1912: the same flat calm and no moon, with worse or
  //   better luck. This makes a hard watch on purpose; it is not a climatology of ice sightings;
  //   the berg's centre anywhere within its radius plus 34 m of the track, either side: beyond radius plus 14 m
  //   she passes clear if nothing is done, so about a quarter of the nights need no order at all;
  //   12 to 40 s of quiet before the bells.
  // G1, how hard a drawn night is (opts.level). Each level maps the same draws to its own spreads, so a seed keeps its
  // berg's size, depth, height and clock across the levels; only where the ice lies and when it is seen change.
  //   hard: the generator above, and the default: a seed's night without a level is the night it always was (GEN stays);
  //   early: the ice seen sooner, from 1912's 457 m out to 1.6 times it, the berg anywhere as in hard;
  //   night1912: as on the night, seen at 0.9 to 1.1 times 457 m with the berg's centre within its radius plus 10 m of
  //     her track, so that nearly every night needs an order [bets, all]
  const LEVELS = {
    early: { name: 'Seen early', sight: [1.0, 0.6], offPad: 34 },
    hard: { name: 'Any night', sight: [0.55, 0.75], offPad: 34 },
    night1912: { name: 'Like 1912', sight: [0.9, 0.2], offPad: 10 },
  };
  function draw(seed, opts) {
    opts = opts || {};
    seed = seed >>> 0;
    const level = LEVELS[opts.level] ? opts.level : 'hard', L = LEVELS[level];
    const r = rng(seed);
    const R = r1(25 + 35 * r());
    const sighting = Math.round(457.2 * (L.sight[0] + L.sight[1] * r()));
    const lead = 0.25 * Math.round((12 + 28 * r()) * 4);
    const off = r1((2 * r() - 1) * (R + L.offPad));
    const d0 = Math.round((4.5 + 2 * r()) * 4) / 4;
    const h = Math.round(10 + 20 * r());                       // height of the visible berg, m (witnesses: 50 to 100 ft)
    const clock0 = 22 * 3600 + Math.floor(r() * 3.5 * 3600);
    const k = R / 40;
    return {
      gen: GEN, seed, kind: 'random', level, title: 'Night ' + seed + (level === 'hard' ? '' : ' · ' + L.name.toLowerCase()),
      speedKn: opts.speedKn || 22.5, heading: 266, lead, off, sighting,
      ice: { R, mass: 1e8 * k * k * k, depths: [d0, d0 + 1, d0 + 2] }, orders: ORDERS_1912, clock0, berg: { h, seed },
    };
  }
  function spec(seed, opts) {
    seed = seed >>> 0;
    return seed === 1912 ? historic(opts && opts.speedKn) : draw(seed, opts);
  }

  // the bridge's orders as a script: entries fire once, on a step count (k) or a time after an event of the watch
  function scriptOf(orders) {
    const o = Object.assign({}, ORDERS_1912, orders || {}), sc = [];
    if (o.engines0) sc.push({ when: 'start', after: 0, type: 'telegraph', value: o.engines0 });
    if (o.turn !== null) sc.push({ when: 'bells', after: o.delay, type: 'helm', value: o.turn });
    if (o.engines) sc.push({ when: 'bells', after: o.delay, type: 'telegraph', value: o.engines });
    if (o.around !== null) sc.push({ when: 'touch', after: o.around, type: 'helm', value: 'reverse' });
    if (o.stop !== null) {
      sc.push({ when: 'touch', after: o.stop, type: 'telegraph', value: 'stop' });
      sc.push({ when: 'touch', after: o.stop, type: 'helm', value: 0 });
    }
    sc.push({ when: 'clear', after: 0, type: 'helm', value: 0, unless: 'touch' });
    return sc;
  }

  // ------------------------------------------------------------------ readers
  // Modules that read the night and keep a state of their own beside it (the reports to the bridge, the boats, the other
  // ships: core/readers/*.js). Each registers itself here when it is loaded. From then on it is attached to every watch,
  // stepped after the model's own step, and may own order types of the watch's log, so that its orders replay with the
  // helm's. A reader never writes into the flooding, the motion, the ice or the plant: a watch has the same fingerprint
  // with every reader and with none (tools/night_tests.js). What a reader draws at random it draws from the night's seed.
  //   { name, state, attach(sim, spec), step(sim), orders: { type: (sim, value, arg) => done }, valid(type, value, arg) }
  // state: the key of its state in the sim (sim.people, sim.world), so that a copy of the watch made for a forecast can
  // leave it behind; valid: which of its orders it would accept from a shared address.
  // create(ship, spec, { readers: false }) gives a watch with none attached (the tests use it to show they change nothing);
  // an order of a reader's given to such a watch goes in its log and does nothing else.
  const OWN = { helm: 1, telegraph: 1, door: 1, doors: 1, fires: 1, pump: 1, hole: 1 };   // the orders this file carries out itself
  // G27 (docs/DESIGN_G27_the_brush_on_a_watch_v1_2026-11-24.md): a hole made by the player's hand on a watch (the page's
  // brush), an order of the model's own that no man on her gives or hears: value [x, z, side] (m, ship frame; side +1
  // port, -1 starboard), arg its area (m2). Its bounds need no state, so the page's address check and the model agree:
  // inside her sixteen zones 1 m clear of either end, from her floor there + 0.25 m (her inner bottom contains anything
  // lower: the brush's rule) to E deck, and no larger than the brush's largest, 0.02 x 250 = 5 m2 (site/app.js)
  const HOLE_MAX = 5;
  let SHIP0 = null;
  function validHole(value, arg) {
    if (!Array.isArray(value) || value.length !== 3 || !value.every(v => typeof v === 'number' && isFinite(v))) return false;
    if (!(typeof arg === 'number' && isFinite(arg) && arg > 0 && arg <= HOLE_MAX)) return false;
    const x = value[0], z = value[1], side = value[2], bx = C.zoneBounds();
    if (side !== 1 && side !== -1) return false;
    if (!(x < bx[0] - 1 && x > bx[16] + 1)) return false;
    const ship = SHIP0 || (SHIP0 = C.buildShip());
    return z >= ship.zones[C.zoneAt(x)].floor + 0.25 && z <= C.deckZ('E', x);
  }
  // whether an order is one of those (the model's own) and not a reader's: only the model's own change what she does, so
  // the page asks for a new forecast after them alone (site/app.js, order)
  function owns(type) { return OWN[type] === 1; }
  const READERS = [];
  // the onset's check (D76 b): the onset reader's plain functions, { start, look }, when it is loaded; the night carries
  // it itself on a watch handed over at the onset (create, step, over), so that copies and reader-less watches meet it.
  // G12 (D98): every watch hands over at the onset by default, so the check must be there wherever a watch is made. The
  // page bundles the reader after this file; in Node the night loads it itself the first time it is wanted, so that no
  // tool keeps the flag by forgetting to load it (a tool that wants the flag says so: handover 'flag')
  function onsetCheck() {
    let r = READERS.find(x => x.name === 'onset' && x.check);
    if (!r && typeof module === 'object' && module.exports && typeof require === 'function') { require('./readers/onset.js'); r = READERS.find(x => x.name === 'onset' && x.check); }
    return r ? r.check : null;
  }
  function reader(r) {
    if (!r || !r.name) throw new Error('a reader needs a name');
    for (const t of Object.keys(r.orders || {})) {
      if (OWN[t] || READERS.some(x => x.name !== r.name && x.orders && x.orders[t])) throw new Error('the order "' + t + '" is already taken');
    }
    const i = READERS.findIndex(x => x.name === r.name);        // loaded twice (a test, a page): the later one stands
    if (i >= 0) READERS[i] = r; else READERS.push(r);
    return r;
  }

  // opts: { auto: true } the reconstructed 1912 orders; { script } any script; { params } core parameters
  function create(ship, sp, opts) {
    opts = opts || {};
    const sim = C.createSim(ship, opts.params || {}, { openings: [], coalListDeg: sp.coalListDeg === undefined ? C.DEFAULT_PARAMS.coalListDeg : sp.coalListDeg });
    const m = Mo.attach(sim, { knots: sp.speedKn, heading: sp.heading });
    const R = sp.ice && sp.ice.R !== undefined ? sp.ice.R : E.ICE.R, dt = sim.params.dt;
    // half a step short, so that the bells ring on the step at t = lead and not, by a rounding, on the next
    const reach = Math.sqrt((sp.sighting + R) * (sp.sighting + R) - sp.off * sp.off);
    const along = XS + m.u * (sp.lead - 0.5 * dt) + reach, c = C.cos(m.psi), s = C.sin(m.psi);
    E.create(sim, { X: m.X + along * c - sp.off * s, Y: m.Y + along * s + sp.off * c }, sp.ice);
    if (Sys && opts.plant !== false) Sys.attach(sim, sp.plant);      // the machinery, and what flooding does to it (core/systems.js)
    const script = opts.script || (opts.auto ? scriptOf(sp.orders) : null);
    sim.night = {
      spec: sp, k: 0, phase: 'watch', tBells: -1, tOrder: -1, tTouch: -1, tClear: -1,
      range: 0, bearing: 0, ahead: 0, abeam: 0, minDist: 1e9, bearingBells: 0, rangeBells: 0, knTouch: 0, swingTouch: 0, aheadOrder: -1, calm: 0,
      hindsight: false, log: [], script, did: script ? new Uint8Array(script.length) : null, psi0: m.psi, hash: 2166136261,
      readers: opts.readers !== false,
    };
    // G12 (D98, Bo, 2026-11-23: "Yes, option (a)"): a watch is handed over to the fall at B2's onset by default; 'flag', the
    // core's foundering flag (rule H1), is the what-if, and every harness that fits or measures the founder names it
    // (G12's step 0). A flag watch carries no field for it, so it is today's watch to the bit. Anything else is refused
    const handover = opts.handover === undefined || opts.handover === null ? 'onset' : opts.handover;
    if (handover !== 'onset' && handover !== 'flag') throw new Error('Night.create: handover is \'onset\' or \'flag\', not ' + JSON.stringify(opts.handover));
    if (handover === 'onset') sim.night.handover = 'onset';
    // D76 (b): on an onset watch the night carries B2's check itself, its state plain data in sim.night.onset (a copy of
    // the watch, its forecast and a watch with no readers meet the same onset); a default watch has none
    if (sim.night.handover === 'onset') { const chk = onsetCheck(); if (chk) sim.night.onset = chk.start(); }
    look(sim, sim.night);
    if (sim.night.readers) for (const r of READERS) if (r.attach) r.attach(sim, sp);
    return sim;
  }

  // ------------------------------------------------------------------ orders
  // returns what the order did where it can fail: the bridge's door switch (Y2) is false without current; an order to the
  // pumps (Y6) says whether it was carried out, and why not
  function act(sim, type, value, arg) {
    const w = sim.night, m = sim.mo;
    let done = true;
    if (type === 'helm') {
      if (value === 'away') value = w.spec.off >= 0 ? -m.K.S.rudder.max : m.K.S.rudder.max;
      else if (value === 'toward') value = w.spec.off >= 0 ? m.K.S.rudder.max : -m.K.S.rudder.max;
      else if (value === 'reverse') value = -m.delCmd / DEG;
      Mo.rudder(sim, value);
    } else if (type === 'telegraph') Mo.telegraph(sim, value, arg);
    // the doors of bulkhead `value` by hand (Y2): opened at once (the bridge's switch goes off); shut by the lever, they fall
    else if (type === 'door') { if (arg) { if (sim.plant) Sys.openDoor(sim, value); else C.setDoor(sim, value, true); } else C.releaseDoor(sim, value, 'by hand'); }
    // the bridge's switch for the doors at the tank top (Y2): nothing without current from the main dynamos
    else if (type === 'doors') { if (sim.plant) done = Sys.bridgeDoors(sim); else for (let b = 0; b < C.BULKHEADS.length; b++) if (C.BULKHEADS[b].doors.some(d => d[0] === 'low')) C.releaseDoor(sim, b, 'from the bridge'); }
    else if (type === 'fires') { if (sim.plant) Sys.drawFires(sim, value); }   // to the stokehold: draw room value's fires (< 0: all)
    // to the pumps (Y6): value the room (-1: none), arg which pumps (core/systems.js, pumpOrder). An order that cannot be
    // carried out changes nothing; it goes in the log with its reason, and a replay refuses it again
    else if (type === 'pump') done = sim.plant ? Sys.pumpOrder(sim, value, arg) : { ok: false, why: 'No plant on this watch: there is nobody to give the order to' };
    // G27: a hole made by hand (the brush on a watch), placed on her shell's outer face from her own half-breadth as the
    // presets' holes are, so that the log's numbers alone place it and a replay gives the same opening to the bit
    else if (type === 'hole') {
      if (!validHole(value, arg)) throw new Error('Night.act: a hole out of bounds: ' + JSON.stringify([value, arg]));
      const x = value[0], z = value[1], y = value[2] * (C.halfBreadth(x, z, sim.ship.hull) + 0.02);
      C.addOpening(sim, { x, y, z, area: arg, kind: 'breach', label: 'a hole made by hand', tOpen: sim.t });
    } else {
      // an order a reader owns (above). On a watch without the readers it is logged and nothing more, so that a log
      // holding such orders replays there too (a forecast, a test of the model alone), to the same fingerprint
      const r = READERS.find(x => x.orders && x.orders[type]);
      if (!r) throw new Error('unknown order: ' + type);
      if (w.readers) done = r.orders[type](sim, value, arg);
    }
    const entry = { k: w.k, t: sim.t, type, value, arg };
    if (done && done.ok === false) entry.refused = done.why;      // an order that could not be carried out says why (the pumps'; a reader's may too)
    w.log.push(entry);
    if (type === 'helm' || type === 'telegraph') {                            // the wheel and the engines: the bridge's answer to the ice
      if (w.tBells < 0) w.hindsight = true;                    // an order before the bells: she was warned by nobody
      else if (w.tOrder < 0) { w.tOrder = sim.t; w.aheadOrder = w.ahead - XS - sim.enc.Rmax; }
    }
    return done;
  }
  function helm(sim, deg) { act(sim, 'helm', deg); }           // + = rudder to starboard (head to starboard); 'away', 'toward', 'reverse'
  function telegraph(sim, order, side) { act(sim, 'telegraph', order, side); }
  function door(sim, b, open) { act(sim, 'door', b, !!open); }
  function doors(sim) { return act(sim, 'doors', 'bridge'); }  // the bridge's switch: false if it had no current
  function fires(sim, k) { act(sim, 'fires', k); }
  // Y6, to the pumps: room 0-15 with which a pump's index, 'own', 'all' or 'off'; room -1 with a pump's index (take it
  // off) or 'engineers' (hand them back). Returns { ok, why } or { ok, text, short } (core/systems.js, pumpOrder)
  function pump(sim, room, which) { return act(sim, 'pump', room, which); }
  function hole(sim, x, z, side, area) { act(sim, 'hole', [x, z, side], area); }   // G27: the brush's hole on a watch

  function runScript(sim, w) {
    const sc = w.script, m = sim.mo;
    for (let i = 0; i < sc.length; i++) {
      if (w.did[i]) continue;
      const o = sc[i], after = o.after || 0;
      let due;
      if (o.k !== undefined) due = w.k >= o.k;
      else if (o.when === 'start') due = sim.t >= after;
      else if (o.when === 'bells') due = w.tBells >= 0 && sim.t >= w.tBells + after;
      else if (o.when === 'touch') due = w.tTouch >= 0 && m.t >= w.tTouch + after;
      else if (o.when === 'clear') due = w.tClear >= 0 && sim.t >= w.tClear + after;
      else throw new Error('unknown script entry');
      if (!due) continue;
      w.did[i] = 1;
      if (o.unless === 'touch' && w.tTouch >= 0) continue;
      act(sim, o.type, o.value, o.arg);
    }
  }

  // ------------------------------------------------------------------ the lookout
  const HB = new Float64Array(1), HU = new Uint32Array(HB.buffer);
  function mix(h, x) { HB[0] = x; h = Math.imul(h ^ HU[0], 16777619); return Math.imul(h ^ HU[1], 16777619); }

  function look(sim, w) {                                      // where the ice is: from the stem, and from amidships
    const m = sim.mo, e = sim.enc, b = e.berg, c = C.cos(m.psi), s = C.sin(m.psi);
    const dx = b.X - m.X, dy = b.Y - m.Y, fwd = dx * c + dy * s, stb = -dx * s + dy * c, fs = fwd - XS;
    w.ahead = fwd; w.abeam = stb;
    w.range = Math.sqrt(fs * fs + stb * stb) - e.Rmax;
    w.bearing = C.atan2(stb, fs) / DEG;                     // off the bow, + to starboard
    // the ice's centre from her centreline (stern to stem), for a lower bound on a wide miss
    const over = fwd > XS ? fwd - XS : (fwd < XA ? XA - fwd : 0), d = Math.sqrt(over * over + stb * stb);
    if (d < w.minDist) w.minDist = d;
  }
  function sideName(stb) { return stb >= 0 ? 'starboard' : 'port'; }
  function observe(sim, w) {
    const m = sim.mo, e = sim.enc;
    look(sim, w);
    if (w.tBells < 0 && w.range <= w.spec.sighting) {
      w.tBells = sim.t; w.phase = 'sighted'; w.bearingBells = w.bearing; w.rangeBells = w.range;
      const a = Math.abs(w.bearing), call = a < 2 ? 'Iceberg right ahead!' : 'Ice ' + (a < 11.25 ? 'fine' : 'broad') + ' on the ' + sideName(w.bearing) + ' bow!';
      sim.events.push({ t: sim.t, id: 'bells', label: 'Three bells from the crow\'s nest: "' + call + '" Range ' + w.range.toFixed(0) + ' m' });
    }
    if (w.tTouch < 0 && e.tFirst >= 0) {
      w.tTouch = e.tFirst; w.phase = 'contact';
      w.knTouch = Math.sqrt(m.u * m.u + m.v * m.v) / KN; w.swingTouch = (m.psi - w.psi0) / DEG;
      const where = w.ahead > 60 ? 'bow' : (w.ahead < -60 ? 'quarter' : 'side');
      sim.events.push({ t: sim.t, id: 'touch', label: 'She touches the ice on the ' + sideName(w.abeam) + ' ' + where + ' at ' + w.knTouch.toFixed(1) + ' knots' });
    }
    if (w.tClear < 0) {
      // the encounter is over when the ice is abaft the beam and out of reach, when she has stopped, or when she has
      // lain against the ice for ten seconds without closing on it (stopped on it, or the two moving as one)
      const b = e.berg, c = C.cos(m.psi), s = C.sin(m.psi), rx = m.u * c - m.v * s - b.VX, ry = m.u * s + m.v * c - b.VY;
      w.calm = w.tTouch >= 0 && rx * rx + ry * ry < 0.09 ? w.calm + sim.params.dt : 0;
      if ((!E.near(sim) && w.ahead < 0) || m.u * m.u + m.v * m.v < 0.0625 || w.calm >= 10) {
        w.tClear = sim.t; w.phase = 'clear';
        sim.events.push({ t: sim.t, id: 'clear', label: verdict(sim) });
      }
    }
    let h = w.hash;
    h = mix(h, m.u); h = mix(h, m.v); h = mix(h, m.r); h = mix(h, m.X); h = mix(h, m.Y); h = mix(h, m.psi); h = mix(h, m.del);
    h = mix(h, m.nP); h = mix(h, m.nS); h = mix(h, m.nC);
    h = mix(h, sim.zO); h = mix(h, sim.pitch); h = mix(h, sim.roll); h = mix(h, sim.inflow); h = mix(h, e.berg.X); h = mix(h, e.berg.Y);
    w.hash = h;
  }

  // Z3: she is gone: the core's flag, or under handover 'onset' the onset B2's check found (the night's own, D76 b; the
  // reader's on a watch made without it)
  function over(sim) {
    if (sim.foundered) return true;
    const w = sim.night;
    if (!w || w.handover !== 'onset') return false;
    const o = w.onset || sim.onset;
    return !!(o && o.found);
  }
  function step(sim) {
    const w = sim.night;
    if (over(sim)) {
      if (w.script) runScript(sim, w);
      w.k++; sim.t += sim.params.dt;
      if (w.readers) for (let i = 0; i < READERS.length; i++) if (READERS[i].step) READERS[i].step(sim);
      return;
    }
    if (w.script) runScript(sim, w);
    if (sim.plant) Sys.step(sim);                  // what the machinery can do this step, from the water in each room and her pose
    E.step(sim);
    w.k++;
    observe(sim, w);
    if (w.onset && !w.onset.found) { const chk = onsetCheck(); if (chk) chk.look(sim, w.onset); }   // D76 (b): onset watches only
    if (w.readers) for (let i = 0; i < READERS.length; i++) if (READERS[i].step) READERS[i].step(sim);   // they read; they change nothing above
  }
  // true while the watch needs real time: until the encounter is over (the ice passed, or she lies stopped or against it)
  function busy(sim) { return sim.night.tClear < 0; }
  function fingerprint(sim) { return (sim.night.hash >>> 0).toString(16).padStart(8, '0'); }

  // ------------------------------------------------------------------ what happened
  function summary(sim) {
    const w = sim.night, s = E.summary(sim);
    s.area = s.stbd.area + s.port.area + s.bow.area;
    s.zones = []; for (let k = 0; k < 16; k++) if (s.stbd.zone[k] + s.port.zone[k] + s.bow.zone[k] > 1e-6) s.zones.push(k);
    // the smallest gap between hull and ice: exact when under GAP_EXACT; for a wider miss a lower bound, from the
    // ice's distance off her centreline less her half breadth
    s.clearanceExact = s.minGap < E.GAP_EXACT;
    s.clearance = s.clearanceExact ? s.minGap : Math.max(E.GAP_EXACT, w.minDist - sim.enc.Rmax - HALF_B);
    s.seed = w.spec.seed; s.phase = w.phase; s.tBells = w.tBells; s.tOrder = w.tOrder; s.tTouch = w.tTouch; s.tClear = w.tClear;
    s.reaction = w.tBells >= 0 && w.tOrder >= 0 ? w.tOrder - w.tBells : null;
    s.hindsight = w.hindsight; s.knTouch = w.knTouch; s.swingTouch = w.swingTouch; s.rangeBells = w.rangeBells; s.bearingBells = w.bearingBells;
    s.aheadOrder = w.aheadOrder;
    s.headOn = s.bow.crush >= 1;                               // her stem went into the ice and the bow crushed
    s.fingerprint = fingerprint(sim);
    return s;
  }
  // compartments by name: "the forepeak to boiler room 4" when they lie in a row
  function zoneName(k) { const n = C.ZONES[k].name; return k === 0 || k === 15 ? 'the ' + n.toLowerCase() : (n.charAt(0) === 'N' ? n : n.charAt(0).toLowerCase() + n.slice(1)); }
  function zoneSpan(zs) {
    if (!zs.length) return 'no compartment';
    if (zs.length === 1) return zoneName(zs[0]);
    return zs[zs.length - 1] - zs[0] === zs.length - 1 ? zoneName(zs[0]) + ' to ' + zoneName(zs[zs.length - 1]) : zs.map(zoneName).join(', ');
  }
  // what happened, in one sentence (the headless tools print the metres from summary())
  function verdict(sim) {
    const s = summary(sim);
    if (s.kind === 'miss') {
      const side = sideName(sim.night.abeam);
      return 'Clear of the ice: it passed ' + (s.clearanceExact ? '' : 'more than ') + Math.max(0, s.clearance).toFixed(0) + ' m off her ' + side + ' side';
    }
    if (s.kind === 'dented') {
      return 'Clear of the ice: ' + (s.stbd.dents + s.port.dents) + ' m of plating dented, the deepest ' + (100 * Math.max(s.stbd.dmax, s.port.dmax)).toFixed(0) + ' cm. No seam opened, no water';
    }
    const tears = s.stbd.area + s.port.area, sides = s.stbd.tears && s.port.tears ? 'both sides' : 'the ' + (s.stbd.tears ? 'starboard' : 'port') + ' side';
    const seams = tears > 0 ? tears.toFixed(2) + ' m2 of seams open along ' + sides : '';
    if (s.bow.area > 0) return 'Stem into the ice: bow crushed in ' + s.bow.crush.toFixed(0) + ' m' + (seams ? ', ' + seams : '') + '. Open to the sea: ' + zoneSpan(s.zones);
    return 'Holed: ' + seams + ', ' + zoneSpan(s.zones);
  }

  // ------------------------------------------------------------------ headless helpers
  function run(sim, opts) {                                    // to the end of the encounter (the ice passed), or tMax
    opts = opts || {};
    const tMax = opts.tMax || 600, extra = opts.settle || 0;
    while (sim.t < tMax && (sim.night.tClear < 0 || sim.t < sim.night.tClear + extra)) step(sim);
    return sim;
  }
  function sink(sim, tMax) {                                   // on, until she founders or lies steady
    tMax = tMax || 8 * 3600;
    while (!over(sim) && sim.t < tMax) {
      step(sim);
      if (sim.t > 4 * 3600 && Math.abs(sim.inflow) < 0.02 && Math.abs(sim.wth) < 1e-5) break;
    }
    return sim;
  }
  function replay(ship, sp, log, kEnd, opts) {
    const sim = create(ship, sp, Object.assign({}, opts || {}, { script: log.map(o => ({ k: o.k, type: o.type, value: o.value, arg: o.arg })) }));
    while (sim.night.k < kEnd) step(sim);
    return sim;
  }
  // a night is its seed and its orders: that is the snapshot, and resuming is replaying
  function snapshot(sim) { const w = sim.night; return { spec: w.spec, k: w.k, log: w.log.map(o => Object.assign({}, o)) }; }
  function resume(ship, snap, opts) {
    const sim = replay(ship, snap.spec, snap.log, snap.k, opts);
    sim.night.script = null; sim.night.did = null;
    return sim;
  }
  // The forecast after the ice (Y6): what the watch does from now if no further order is given. Everything a step reads is
  // plain data in the sim (the core, her motion, the ice, the plant and its pumps, the night with its log and the scripted
  // orders still to come), so the watch is copied whole and run on: its plant, the engineers' later orders and the
  // bridge's orders all go with it, and so does a change no log holds (a hole made by hand). On one engine its "founders
  // at" is the watch's own, to the bit (tools/systems_tests.js, tools/systems_site_test.js). It replays nothing, so it
  // costs about what running the watch on costs. forecastOf(sim) is the copy (structured clone), without the ship's
  // geometry, which nothing in the sim shares: the page posts it, about 1 MB, to its forecast worker, which has its own ship.
  // The readers' states stay behind (each names its key in the sim, `state`), and the copy runs without the readers: a
  // forecast is of the model, which no reader changes; an order of theirs still to come is logged in the copy and idle.
  function forecastOf(sim) {
    const o = Object.assign({}, sim); o.ship = null;
    for (const r of READERS) if (r.state) delete o[r.state];
    o.night = Object.assign({}, sim.night, { readers: false });
    return structuredClone(o);
  }
  // forecaster(ship, f) runs that copy on in slices: go(n) takes up to n steps and returns true when done; result() gives
  // what core.run gives, the history every opts.every s, to her foundering (on an onset watch to its hand-over: over()),
  // 20 minutes lying steady, or opts.tMax s (6 h); over and overT (the hand-over's time, -1 for none) beside foundered
  function forecaster(ship, f, opts) {
    opts = opts || {};
    const sim = f; sim.ship = ship;
    const every = opts.every || 30, tEnd = sim.t + (opts.tMax || 6 * 3600), hist = [], dt = sim.params.dt;
    let next = sim.t, calm = 0, done = false;
    const sample = () => { const r = C.readouts(sim); hist.push({ t: sim.t, trim: r.trimDeg, list: r.listDeg, water: r.waterT, inflow: r.inflowTpm, dF: r.draftF, dA: r.draftA }); };
    function go(n) {
      for (let i = 0; i < n && !done; i++) {
        if (over(sim) || sim.t >= tEnd) { done = true; break; }
        if (sim.t >= next) { sample(); next += every; }
        step(sim);
        if (sim.t > 1800) { calm = Math.abs(sim.inflow) < 0.02 && Math.abs(sim.wth) < 1e-5 && Math.abs(sim.vz) < 1e-3 ? calm + dt : 0; if (calm > 1200) done = true; }
      }
      return done;
    }
    function result() {
      sample();
      const o = sim.night && (sim.night.onset || sim.onset), isOver = over(sim);
      return { hist, foundered: sim.foundered, founderT: sim.founderT, over: isOver, overT: !isOver ? -1 : (sim.foundered ? sim.founderT : o.found.t), final: C.readouts(sim), events: sim.events.slice(), endT: sim.t, k: sim.night.k };
    }
    return { sim, go, result };
  }
  function forecast(ship, f, opts) { const r = forecaster(ship, f, opts); r.go(Infinity); return r.result(); }
  // the same berg, another watch: the 1912 drill with the helm order `times` seconds after the bells
  function missWindow(ship, sp, opts) {
    opts = opts || {};
    const times = opts.times || [0, 5, 10, 15, 20, 25, 30], rows = [];
    for (const r of times) {
      const sim = run(create(ship, sp, { script: scriptOf(Object.assign({}, sp.orders, opts.orders || {}, { delay: r })) }), { tMax: opts.tMax || 600 });
      const s = summary(sim);
      rows.push({ reaction: r, kind: s.kind, clearance: s.clearance, clearanceExact: s.clearanceExact, area: s.area, zones: s.zones, headOn: s.headOn,
        stbd: s.stbd.tears ? [s.stbd.tearFrom, s.stbd.tearTo] : null, port: s.port.tears ? [s.port.tearFrom, s.port.tearTo] : null, text: verdict(sim) });
    }
    return rows;
  }
  function describe(sp) {
    const R = sp.ice && sp.ice.R !== undefined ? sp.ice.R : E.ICE.R, d = sp.ice && sp.ice.depths ? sp.ice.depths[0] : E.ICE.depths[0];
    const where = Math.abs(sp.off) < 0.05 ? 'dead on her track' : Math.abs(sp.off).toFixed(0) + ' m to ' + sideName(sp.off) + ' of her track';
    return 'Spur ' + (2 * R).toFixed(0) + ' m across, ' + d.toFixed(1) + ' m down, its centre ' + where + '; seen at ' + sp.sighting.toFixed(0) + ' m; ' + sp.speedKn + ' knots';
  }

  return {
    GEN, LEVELS, ORDERS_1912, GEOM_1912, XS, rng, spec, draw, historic, scriptOf, create, step, busy, helm, telegraph, door, doors, fires, pump, act,
    reader, READERS, owns, hole, validHole, HOLE_MAX,
    over, summary, verdict, fingerprint, run, sink, replay, snapshot, resume, forecastOf, forecaster, forecast, missWindow, describe,
  };
});
