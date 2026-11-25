/*
 * The ship's plant: the systems that depend on each other, so that a failure cascades the way it would have.
 *
 *   coal -> fires in each boiler room -> steam -> pressure -> the reciprocating engines -> the wing screws
 *                                                          -> their exhaust -> the turbine -> the centre screw
 *                                                 pressure -> the steering engines -> the rudder
 *                                                 pressure -> the dynamos -> electric light
 *   flooding: a boiler room's fires, the engine rooms, the turbine room, the dynamo flat, each knocked out by water
 *   the sea: a screw or the rudder out of the water does nothing
 *
 * Each step it reads the flooding core (water in each room, her pose) and writes what the machinery can do into
 * sim.mo.plant, which core/motion.js obeys (neutral when everything works: an intact ship gives the same bits as
 * before this module; tools/systems_tests.js and tools/astern_tests.js check it). Without the motion model (the damage
 * presets) it still runs the boilers and the dynamos, so the lights are an outcome there too.
 * Numbers: docs/research/RESEARCH_ship_systems_plant_v1_2026-11-16.md and the steering fact sheet; [read] where a source
 * gives it, [derived] where it is arithmetic on sources, [bet] where none was found. Design: docs/DESIGN_ship_systems_v1_1.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./core.js'));
  else root.TitanicSystems = factory(root.TitanicCore);
})(typeof self !== 'undefined' ? self : this, function (C) {
  'use strict';
  const PLANT = {
    // boiler rooms from forward, the core's zones 4 to 9: four double-ended boilers in 6, five in each of 5 to 2, five
    // single-ended in 1, 159 furnaces in all [read: The Shipbuilder 1911]; on 14 April the 24 double-ended were lit and
    // room 1 was cold [read: docs/research/RESEARCH_ship_systems_plant_v1_2026-11-16.md]. `lit` counts furnace ends.
    rooms: [
      { zone: 4, name: 'Boiler room 6', boilers: 4, ends: 2, lit: 8 }, { zone: 5, name: 'Boiler room 5', boilers: 5, ends: 2, lit: 10 },
      { zone: 6, name: 'Boiler room 4', boilers: 5, ends: 2, lit: 10 }, { zone: 7, name: 'Boiler room 3', boilers: 5, ends: 2, lit: 10 },
      { zone: 8, name: 'Boiler room 2', boilers: 5, ends: 2, lit: 10 }, { zone: 9, name: 'Boiler room 1', boilers: 5, ends: 1, lit: 0 },
    ],
    furnaceAbove: 1.0,     // m above the stokehold plates (the tank top): water there puts the fires out [bet]
    quench: 45,            // s for a room's fires to die once the water is at them [bet]
    drawTime: 1200,        // s for a room's stokers to draw its fires: room 5's 30 furnaces took 15-20 men about 20 minutes [read]
    burnOut: 900,          // s for the coal on the grates to burn down once a room's bunkers are empty [bet]
    store: 300,            // s: the steam and hot water in the boilers carry full demand this long from working pressure [bet]
    aux: 0.04,             // the auxiliaries' share of full-ahead steam: dynamos, steering, pumps [bet]
    nMax: 80,              // rpm the engines can turn at full pressure [read: 78 in normal service, 83 recorded; fact sheet section 3]
    nSteam: 78,            // rpm the boilers lit on the night hold at working pressure: her normal service maximum [read: fact
                           // sheet section 3]; the watch's 22.5 knots (about 76.5 rpm) is inside it, so an intact plant never limits her
    pEngine: 0.35,         // share of working pressure below which the main engines give nothing: above the dynamos' and the
                           // steering engines' needs, so a falling pressure stops the big consumers first, as the engineers
                           // kept the lights on to the end on the night [bet]
    pSteer: [0.25, 100 / 215],   // the steering engines: nothing below 25 %, full rate from 100 psi [read: 100 psi; the floor a bet]
    pDynamo: 0.3,          // the dynamos stop below this share of working pressure [bet]
    crank: 3.80, turbineAxis: 4.82, dynamoFlat: 1.0,   // m above the keel (R1 measured) / above the electric room's floor [bet]
    rooms2: { re: 10, te: 11, el: 12 },
    // the screws' discs and the rudder (ship frame: x, y to port, z up), m; site/visuals.js draws them from this table.
    // Stations from Engineering's side plan of 1911 (R2: docs/research/experiments/e20_screw_stations_side_plan_1911.js):
    // the wing screws 9.72 m ahead of the rudder's stock, the centre screw 3.03 m ahead of it and 3.75 m above the keel,
    // in the aperture [measured]; the wing shafts' offset and height as R1 found them [measured]
    screws: [{ x: C.G.xAP + 9.72, y: 6.0, z: 3.80, R: 23.5 * 0.3048 / 2 }, { x: C.G.xAP + 3.03, y: 0, z: 3.75, R: 17 * 0.3048 / 2 },
      { x: C.G.xAP + 9.72, y: -6.0, z: 3.80, R: 23.5 * 0.3048 / 2 }],
    // the rudder's area under water from its traced outline (below); heel [bet]. slack: the fitted rudder law holds until
    // her stern has risen this far above the night's draft aft (the blade's top half-metre works in the counter's shadow,
    // and the fit cannot resolve it); past that the outline's area counts [bet]. It keeps the 1912 encounter's bits.
    rudder: { x: -129.54, heel: 0.3, slack: 0.5 },
    // Y5: the 12 fans that blew air to the stokeholds were electric [read: the plant research note]; with the dynamos
    // stopped the fires burn on natural draught and make this share of the steam [bet: forced against natural draught]
    natDraught: 0.65,
    // Y1: the stokers fire to what she uses. With the engines idle for bankDelay s they bank the fires toward bankMargin
    // times the steam used, over bankTau s, and raise them again over raiseTau s [bets]; until then the surplus lifts the
    // safety valves: the roar from the escape pipes after the engines stopped, "through the first hour" [read: plant note].
    // idle: the engines count as idle below this share of full-ahead steam [bet]. Y1b: under way at working pressure the
    // stokers hold the fires to what she uses with the dampers and the fans, so she raises no more steam than she uses and
    // the valves stay shut at any speed she holds; once the engines are idle the surplus is more than the draught can hold
    // back, and the valves lift until the fires are banked
    bankDelay: 600, bankTau: 1200, raiseTau: 300, bankMargin: 1.2, blowEvent: 0.25, idle: 0.1,
    // Y4: two 30 kW emergency dynamos on D deck in the turbine room's casing, about 20 ft above the waterline, on their own
    // steam pipe above E deck; they ran every night and fed the emergency lights and the wireless [read: plant note].
    // Dry until the sea reaches D deck there; they need steam as the main sets do; her emergency lights are this share
    // of all her light [bet]. The stokehold fans are the main sets' load.
    // G3 (NH15's design, U0, its F3; the mainline's ruling as the plant's owner, 2026-11-23): their pipe had branches
    // from boiler rooms 5, 3 and 2, and a cross-connection by which any boiler could feed them "by opening two or three
    // valves" [read: the British Report, "Electrical Installation"; Wilding, BI 19822]. The plant keeps all its boilers'
    // steam in one store (P.p): a room whose fires are out, by the sea or by the stokers, keeps its boilers' steam in it,
    // and the main sets run on that steam after every lit room has flooded. So their pipe stands at the store's pressure
    // while it stands, whichever rooms' fires burn, and it crosses boiler room 1, where she breaks: the break takes it with
    // the mains, on the same step [derived]. Each set on its own rooms' boilers (the main sets' from rooms 1, 2 and 4)
    // needs a room's boilers to leave the store as the sea quenches them, which moves the steam that drives the engines,
    // the steering and the pumps: class C, for both sets at once
    emergency: { zone: 11, lights: 0.15 },
    breakTrimDeg: 20,      // past this trim the boilers and the steam mains give way: the break-up began about then [bet]
    breakTau: 10,          // s for the steam to go once the mains are broken [bet]
    // coal: Olympic burned 629 tons a day at 21.4 knots, so Titanic about 700 at 22 knots, which asks 95 % of full
    // firing: 750 t a day at full firing [derived]. 5,892 tons aboard at Southampton less about 4.5 days at 620 to 700
    // tons a day leaves about 3,000 tons, 3,050 t, on the night [derived] (the plant research note, items 3 and 4)
    coalPerDayFull: 750,
    coalAboard: 3050,
    psi: 215,              // working pressure [read: fact sheet section 3]
    // Y3: the steam bilge pumps (docs/research/RESEARCH_pumps_bilge_ballast_v1_2026-11-17.md): where each stood (the core's
    // zone), its rate in long tons of water an hour, all on the bilge main [read: the British Report; the ash-ejector
    // pumps' 150 is Wilding's estimate]. The ash-ejector pumps of boiler rooms 5, 3 and 2 shared a pump room with a 250 and
    // reached the bilges only by a portable pipe: left out. No pump needed the dynamos [read].
    pumps: [
      { room: 4, LTh: 150, name: 'Boiler room 6\'s ash-ejector pump' },
      { room: 5, LTh: 250, name: 'Boiler room 5\'s ballast-and-bilge pump' },
      { room: 6, LTh: 150, name: 'Boiler room 4\'s ash-ejector pump' },
      { room: 7, LTh: 250, name: 'Boiler room 3\'s ballast-and-bilge pump' },
      { room: 8, LTh: 250, name: 'Boiler room 2\'s ballast-and-bilge pump' },
      { room: 10, LTh: 250, name: 'A ballast pump in the reciprocating engine room' },
      { room: 10, LTh: 250, name: 'The other ballast pump in the reciprocating engine room' },
      { room: 10, LTh: 150, name: 'A bilge pump in the reciprocating engine room' },
      { room: 10, LTh: 150, name: 'The other bilge pump in the reciprocating engine room' },
      { room: 11, LTh: 150, name: 'The turbine room\'s bilge pump' },
    ],
    // what each zone's own suctions take at 2.5 m/s, LT/h [derived there]; 0 where nothing could be pumped: the peaks had no
    // suction, and the holds' valves stood in the firemen's passage, holed within minutes [read]
    suction: [0, 0, 0, 0, 345, 367, 345, 367, 367, 310, 591, 541, 225, 196, 196, 0],
    mainLTh: 920,          // what pumps standing elsewhere draw from one zone through the two 10-in mains [derived there]
    pumpOwn: 300,          // s from water in a room to its own pumps working [bet: "soon after the collision" in boiler room 5]
    pumpLent: 1800,        // s to lead pumps from dry rooms to it through the main [bet: boiler room 3's on 4 from about 12:10]
    // G18 (the calibration epoch's C2), dark until the epoch lands. leadRule 0: the room is judged lost or not at the
    // moment the led pumps would start (pumpT + pumpLent), yes or no: a step in every input. leadRule 1 (the design's
    // "e with d" as the mainline revised it): the room is judged once, when its own pumps start (pumpT + pumpOwn:
    // Wilding's half hour runs "from decision to start"), by whether the pumps can hold it, not by its depth (the night's
    // record has a deep boiler room 4 pumped through the main to about T 148, and boiler room 6 given up at once): its
    // mean inflow since water was seen, against its own pumps' rate with what the lead would bring. All of the lead at
    // a ratio of 1 or under, none at leadRatio or over, linear between [bet]. A room given none takes no pump from the
    // others; the pumps led start at pumpT + pumpLent and run as under rule 0.
    leadRule: 1,   // the calibration epoch's landing (D4): C2's rule, judged by inflow (G18)
    doorsHeld: false,   // D112's what-if (e120's bracket): the doors the engineers raise are held open, their floats disarmed
    leadRatio: 3,          // inflow over the pumps' rate at which a room is given up [bet]
    pumpPsi: [30, 80],     // psi at the pumps: nothing below, their full rate above, linear between [bet: direct-acting pumps]
    // Y6: the holds' own suctions for an order from the bridge, LT/h at 2.5 m/s (hold 1: 2 x 3.5 in; holds 2 and 3: 2 x 3.5
    // and 2 x 3 in) [derived in the note, section 5.1], through the forward mains while their valves can be worked. The
    // valves stood in the firemen's passage [read: the Report, "Pumping Arrangements"]; it is taken as flooded, and the
    // valves lost, once the water in hold 2 or 3 stands over its top (the core's params.zMergeHold) [bet]; on the night it
    // was holed within about five minutes [read]. The engineers' rules leave the holds alone, as on the night (`suction`).
    holdSuction: [0, 113, 196, 196],
  };
  const LTH = 1 / 3632;    // long tons of sea water an hour, in m3/s

  // The rudder's trailing edge, traced from the photograph of the stern castings (The Shipbuilder 1911, Fig. 17):
  // [height above the heel, chord from the stock's axis], m [measured, R1; docs/research/RESEARCH_stern_gear_wake_lights_v1_1].
  // Its chords are scaled so that the area under the night's draft aft is the plans' 401.63 sq ft (site/visuals.js draws it).
  const RUDDER_TRACE = [[0, 0.62], [0.22, 1.10], [0.84, 1.82], [1.77, 2.89], [3.02, 3.61], [4.26, 4.05], [5.50, 4.26],
    [6.75, 4.32], [8.00, 4.32], [9.24, 4.14], [10.48, 3.84], [11.72, 3.31], [12.97, 2.62], [14.21, 1.82], [15.46, 1.04],
    [16.70, 0.54], [17.63, 0.36], [17.95, 0]];
  function rudderArea(T, h) {                     // area of the outline from the heel up to h, m2 (trapezoids)
    let A = 0;
    for (let i = 1; i < T.length; i++) {
      const h0 = T[i - 1][0], h1 = Math.min(T[i][0], h); if (h1 <= h0) break;
      const c1 = T[i - 1][1] + (T[i][1] - T[i - 1][1]) * (h1 - h0) / (T[i][0] - h0);
      A += 0.5 * (T[i - 1][1] + c1) * (h1 - h0);
    }
    return A;
  }
  const RUDDER_NIGHT = rudderArea(RUDDER_TRACE, 33.75 * 0.3048 - PLANT.rudder.heel);   // under the night's draft aft (10.29 m)

  function attach(sim, opts) {
    opts = opts || {};
    const R = PLANT.rooms, litTotal = R.reduce((a, r) => a + r.lit, 0);
    const coal = Float64Array.from(R.map(r => r.lit > 0 ? PLANT.coalAboard * r.lit / litTotal : 0));
    if (opts.coal !== undefined) for (let k = 0; k < R.length; k++) coal[k] = R[k].lit > 0 ? opts.coal * R[k].lit / litTotal : 0;
    sim.plant = {
      fires: Float64Array.from(R.map(r => (r.lit > 0 ? 1 : 0))), out: new Uint8Array(R.length), drawn: new Uint8Array(R.length), coal, litTotal,
      p: 1, gen: 1, can: 1, demand: PLANT.aux, re: false, te: false, el: false, power: true, broken: false, events: {},
      firing: 1, idle: 0, blow: 0, emWet: false, emergency: true, lights: 1,
      // Y3: the engineers put the pumps to work on a ship under way (a watch); a scenario with its own schedule (the
      // 1912 damage) and the damage presets keep theirs
      doctrine: opts.pumps === undefined ? (!sim.pumpScripted && !!sim.mo) : !!opts.pumps,
      pumpT: new Float64Array(16).fill(-1), pumpLed: new Uint8Array(16), pumpOwnLTh: new Float64Array(16), pumpUsed: new Uint8Array(PLANT.pumps.length),
      // Y6: the entry in sim.pumpSched each pump works under (-1: none yet), whether the bridge has the pumps (the
      // engineers' rules then wait), when the firemen's passage flooded (-1: dry), and the orders counted for the log
      pumpOn: new Int32Array(PLANT.pumps.length).fill(-1), pumpBridge: false, passageT: -1, pumpN: 0,
      // D112: the doors the engineers raise by hand on a night whose record says so (DOORS_RAISED, by the spec's key),
      // the schedule's entries done, and each door raised (its bulkhead, when, why)
      doorsRaised: opts.doorsRaised && DOORS_RAISED[opts.doorsRaised] ? opts.doorsRaised : null, raisedN: 0, raised: [],
    };
    if (sim.mo) sim.mo.plant = { nMax: [PLANT.nMax, PLANT.nMax], turbine: true, steer: true, steerRate: 1, imm: [1, 1, 1], rudImm: 1 };
    // Y2: the floats under the floors arm the tank-top doors (bulkheads D to O); a door a scenario holds open (jammed, or
    // left open on purpose) stays unarmed. The bridge's switch starts off.
    sim.plant.doorSwitch = false;
    if (sim.doorFloat) for (let b = 0; b < LOW.length; b++) sim.doorFloat[b] = LOW[b] && !sim.doorOpen[b] ? 1 : 0;
    return sim.plant;
  }

  // Y2, the watertight doors. Twelve at the tank top, held open by friction clutches, were released all at once from the
  // bridge by electromagnets, so the bridge's switch needs current from the main dynamos [read: the British Report,
  // "Electrical Installation": "The watertight doors were released by electric magnets."; the plant note, section 7].
  // Without current a float under the floor of each compartment releases the doors into it, and a lever at each door
  // releases it by hand (the core: releaseDoor, doorsStep). Reopening was by hand, a pump handle and two or three men,
  // with the bridge's switch off ("Doors cannot ... be operated mechanically whilst switch is on"): opening a door by
  // hand here turns the switch off, and it opens at once [bet: the time it took is not modelled].
  const LOW = C.BULKHEADS.map(b => b.doors.some(d => d[0] === 'low'));
  // the bridge's switch: true if it released the doors, false if it had no current
  function bridgeDoors(sim) {
    const P = sim.plant;
    if (P && !P.power) { event(sim, 'doorsDead@' + sim.t, 'The bridge\'s switch for the watertight doors: no current, the magnets release nothing'); return false; }
    if (P) P.doorSwitch = true;
    for (let b = 0; b < LOW.length; b++) if (LOW[b]) C.releaseDoor(sim, b, 'from the bridge');
    return true;
  }
  function openDoor(sim, b) { if (sim.plant) sim.plant.doorSwitch = false; C.setDoor(sim, b, true); }
  function closeDoor(sim, b) { return C.releaseDoor(sim, b, 'by hand'); }

  // D112 (docs/DESIGN_D112_the_engineers_raise_the_after_doors_v1_2026-11-24.md): on the 1912 night the engineers raised
  // watertight doors by hand [read: docs/research/RESEARCH_tanks_counterflooding_door_schedule_v1_2026-11-17.md, section
  // 8, "medium": G, H, J and K from about T 30 on the chief engineer's order, to reach the pumps and valves; L, M, N and
  // O fully at about T 60 to 65, to fetch the 10-in suction pipe; none shut again by hand]. O's 2 ft at T 30 to 35 is not
  // modelled (a door here is open or shut). It is the engineers' own act, not the bridge's: no order in the watch's log,
  // no report to the bridge (there was no door indicator on the bridge, Olliver: the same note). A raised door's float
  // stays armed, as the yard built it, so its own float drops it when water stands over the floor on either side
  // (core.js doorsStep). e120: the 1912 watch with this schedule is the same night to the bit up to the hand-over.
  // PLANT.doorsHeld (a what-if, e120's bracket, never the default) disarms each raised door's float.
  const DOORS_RAISED = {
    1912: [
      { T: 30, ids: 'GHJK', why: 'to reach the pumps and valves, on the chief engineer\'s order' },
      { T: 62, ids: 'LMNO', why: 'to fetch the 10-in suction pipe' },
    ],
  };
  // whether the water stands at a float's depth on either side of bulkhead b (the core's own test, doorsStep)
  function floatWet(sim, b) {
    for (let k = b; k <= b + 1; k++) for (let sd = 0; sd < 2; sd++) {
      const n = C.nodeIndex(k, sd, 0);
      if (sim.vol[n] > 1e-6 && sim.level[n] - sim.zmin[n] > sim.params.floatDepth) return true;
    }
    return false;
  }
  function raiseDoors(sim, P) {
    const list = DOORS_RAISED[P.doorsRaised], T = (sim.t - sim.night.tTouch) / 60;
    while (P.raisedN < list.length && T >= list[P.raisedN].T) {
      const e = list[P.raisedN], done = [];
      for (const id of e.ids) {
        const b = C.BULKHEADS.findIndex(x => x.id === id);
        if (b < 0 || sim.doorOpen[b] || floatWet(sim, b)) continue;   // already open, or water at it: no man raises it into water
        openDoor(sim, b);
        if (PLANT.doorsHeld) sim.doorFloat[b] = 0;
        done.push(id); P.raised.push({ id, t: sim.t, why: e.why });
      }
      if (done.length) event(sim, 'raised' + P.raisedN, 'The engineers raise the doors in bulkhead' + (done.length > 1 ? 's ' : ' ') + done.join(', ') + ' by hand, ' + e.why);
      P.raisedN++;
    }
  }

  // is the water in room k at height h (m above its floor, ship frame) or above?
  function wet(sim, F, k, hAbove) {
    const Z = sim.ship.zones[k], thr = C.worldZ(F, 0.5 * (Z.xa + Z.xf), 0, Z.floor + hAbove);
    for (let s = 0; s < 4; s++) { const n = k * 4 + s; if (sim.vol[n] > 0.5 && sim.level[n] >= thr) return true; }
    return false;
  }
  // the share of a disc of radius R whose centre is d below the surface (negative: above) that is under water
  function immersed(d, R) {
    if (d >= R) return 1; if (d <= -R) return 0;
    const c = d / R; return 1 - (C.acos(c) - c * Math.sqrt(1 - c * c)) / Math.PI;
  }
  function event(sim, id, label) { const P = sim.plant; if (P.events[id]) return; P.events[id] = sim.t; sim.events.push({ t: sim.t, id: 'plant:' + id, label }); }

  function step(sim, dt) {
    const P = sim.plant; if (!P) return;
    dt = dt || sim.params.dt;
    if (P.doorsRaised && sim.night && sim.night.tTouch >= 0) raiseDoors(sim, P);   // D112: the engineers' doors (the 1912 night)
    const F = C.frameOf(sim), R = PLANT.rooms, m = sim.mo;
    // past a steep trim the boilers and the steam mains give way (the break-up): no steam made, what is left escapes
    if (!P.broken && sim.pitch > PLANT.breakTrimDeg * Math.PI / 180) { P.broken = true; event(sim, 'break', 'Her boilers and steam mains give way as she rises'); }
    // the boiler rooms: water at the furnaces puts the fires out for good; a room out of coal dies down
    let gen = 0;
    for (let k = 0; k < R.length; k++) {
      if (!P.out[k] && R[k].lit > 0 && wet(sim, F, R[k].zone, PLANT.furnaceAbove)) { P.out[k] = 1; event(sim, 'flood' + k, R[k].name + ' flooded: its fires are out'); }
      if (P.fires[k] > 0) {                       // fires never come back: water, the stokers' rakes, or no coal
        const tau = P.out[k] ? PLANT.quench : (P.drawn[k] ? PLANT.drawTime : (P.coal[k] <= 0 ? PLANT.burnOut : 0));
        if (tau > 0) P.fires[k] = Math.max(0, P.fires[k] - dt / tau);
        if (P.coal[k] <= 0 && !P.out[k] && !P.drawn[k]) event(sim, 'coal' + k, R[k].name + ': the bunkers are empty; the fires burn down');
      }
      gen += R[k].lit * P.fires[k];
    }
    const litOn = gen;                            // the fires' own weight, before the draught and the firing scale it (F1)
    if (P.broken) gen = 0;
    // the stokehold fans run on the dynamos: without them the fires make less (the lights as they stood last step)
    if (!P.power) { gen *= PLANT.natDraught; if (gen > 0) event(sim, 'fans', 'The stokehold fans stop with the dynamos: the fires burn on natural draught'); }
    // the stokers' firing (Y1): full unless the engines have stood idle long enough to bank the fires (last step's demand)
    const cap = gen / P.litTotal;
    P.idle = P.demand < PLANT.idle ? P.idle + dt : 0;
    const fTgt = P.idle > PLANT.bankDelay && cap > 0 ? Math.min(1, Math.max(0.05, PLANT.bankMargin * P.demand / cap)) : 1;
    if (P.firing !== fTgt) P.firing += (fTgt - P.firing) * dt / (fTgt < P.firing ? PLANT.bankTau : PLANT.raiseTau);
    gen *= P.firing;
    P.can = gen / P.litTotal;                     // the steam the fires can raise at their firing
    // demand: the engines' power goes as the cube of their revolutions; the auxiliaries take the rest
    const nP = m ? m.nP : 0, nS = m ? m.nS : 0, f = PLANT.nSteam * PLANT.nSteam * PLANT.nSteam;
    P.demand = PLANT.aux + (1 - PLANT.aux) * ((Math.abs(nP) * nP * nP + Math.abs(nS) * nS * nS) / (2 * f));
    // the boilers banked when supply exceeds demand (pressure held at the safety valves); drawn down when it does not
    P.p = P.broken ? Math.max(0, P.p - dt / PLANT.breakTau) : Math.max(0, Math.min(1, P.p + (P.can - P.demand) * dt / PLANT.store));
    if (P.p < 0.8) event(sim, 'p80', 'Steam pressure falling: ' + Math.round(P.p * PLANT.psi) + ' psi');
    // the steam raised (Y1b): at working pressure with the engines working, what she uses (PLANT.idle's note); else all
    // the fires can raise. The pressure above moves as it did before Y1b, to the bit, and so does the coal below
    P.gen = P.p >= 1 && P.demand >= PLANT.idle && P.can > P.demand ? P.demand : P.can;
    // at the safety valves with steam to spare: it blows off (Y1)
    P.blow = P.p >= 1 && P.gen > P.demand ? P.gen - P.demand : 0;
    if (P.blow > PLANT.blowEvent) event(sim, 'blowoff', 'Her safety valves lift: steam roars from the escape pipes on her funnels');
    if (P.firing < 0.5) event(sim, 'banked', 'The stokers bank the fires: the roar dies away');
    // coal burnt for the steam actually raised, shared among the rooms by their fires' weight, so that the shares sum to
    // one. F1 (NH15's design, U0; the mainline's ruling 2026-11-23): the share divided by gen after the draught and the
    // firing had scaled it, so a banked step burned up to 20 times its steam's coal. No bunker empties on the night, so
    // nothing else moved; the bunkers' readouts did
    const burn = Math.min(P.gen, P.demand) * PLANT.coalPerDayFull / 86400 * dt;
    if (gen > 0 && litOn > 0) for (let k = 0; k < R.length; k++) if (P.fires[k] > 0) P.coal[k] = Math.max(0, P.coal[k] - burn * R[k].lit * P.fires[k] / litOn);
    // the engine rooms, the turbine room, the dynamo flat
    if (!P.re && wet(sim, F, PLANT.rooms2.re, PLANT.crank - sim.ship.zones[PLANT.rooms2.re].floor)) { P.re = true; event(sim, 're', 'Reciprocating engine room flooded: both engines stop'); }
    if (!P.te && wet(sim, F, PLANT.rooms2.te, PLANT.turbineAxis - sim.ship.zones[PLANT.rooms2.te].floor)) { P.te = true; event(sim, 'te', 'Turbine room flooded: the turbine stops'); }
    if (!P.el && wet(sim, F, PLANT.rooms2.el, PLANT.dynamoFlat)) { P.el = true; }
    const power = !P.el && P.p > PLANT.pDynamo;
    // the emergency dynamos on D deck (Y4): dry until the sea reaches D deck at their room; steam from the one store, as
    // the main sets (G3's ruling, at PLANT.emergency)
    if (!P.emWet) { const ez = PLANT.emergency.zone, Z = sim.ship.zones[ez]; if (wet(sim, F, ez, C.deckZ('D', 0.5 * (Z.xa + Z.xf)) - Z.floor)) P.emWet = true; }
    const emergency = !P.emWet && P.p > PLANT.pDynamo;
    const lights = power ? 1 : (emergency ? PLANT.emergency.lights : 0);
    if (P.power && !power && lights > 0) event(sim, 'mainDark', P.el ? 'Water reaches the main dynamos: only the emergency dynamos on D deck light her now' : 'The main dynamos stop: only the emergency dynamos light her now');
    if (P.lights > 0 && lights === 0) event(sim, 'dark', P.el || P.emWet ? 'The last dynamos stop: the ship goes dark' : 'The dynamos stop for want of steam: the ship goes dark');
    P.power = power; P.emergency = emergency; P.lights = lights;
    // Y3: the pumps run on steam alone: their share of their rate at this pressure; and the engineers' orders
    { const psi = P.p * PLANT.psi, a = PLANT.pumpPsi[0], b = PLANT.pumpPsi[1]; sim.pumpScale = psi >= b ? 1 : (psi <= a ? 0 : (psi - a) / (b - a)); }
    // Y6: the firemen's passage, where the forward holds' bilge valves stood, runs along the tank top between the two halves
    // of holds 2 and 3: flooded once their water stands over its top (PLANT.holdSuction) [bet]. It is only read by orders.
    if (P.passageT < 0) for (let k = 2; k <= 3; k++) if (wet(sim, F, k, sim.params.zMergeHold - sim.ship.zones[k].floor)) { P.passageT = sim.t; break; }
    if (P.doctrine) pumpOrders(sim, P);
    if (!m || !m.plant) return;
    // what the machinery can do, for core/motion.js
    const L = m.plant, pe = (P.p - PLANT.pEngine) / (1 - PLANT.pEngine);
    const nMax = P.re ? 0 : (pe >= 1 ? PLANT.nMax : (pe <= 0 ? 0 : PLANT.nMax * C.cbrt(pe)));
    L.nMax[0] = nMax; L.nMax[1] = nMax;
    const want = Math.max(Math.abs(m.setP), Math.abs(m.setS));      // the revolutions the bridge has ordered
    if (nMax < want - 0.5) event(sim, 'slow', P.re ? 'The engines have stopped' : 'The engines cannot make the revolutions ordered: steam for ' + Math.round(nMax) + ' rpm');
    if (nMax <= 0 && !P.re) event(sim, 'nosteam', 'The engines have no steam');
    L.turbine = !P.te;
    const sr = (P.p - PLANT.pSteer[0]) / (PLANT.pSteer[1] - PLANT.pSteer[0]);
    L.steerRate = sr >= 1 ? 1 : (sr <= 0 ? 0 : sr); L.steer = L.steerRate > 0;
    if (!L.steer) event(sim, 'steer', 'The steering engines have no steam: the rudder stays where it is');
    for (let k = 0; k < 3; k++) { const s = PLANT.screws[k]; L.imm[k] = immersed(-C.worldZ(F, s.x, s.y, s.z), s.R); }
    const imm = L.imm[0] + L.imm[1] + L.imm[2];
    if (imm < 2.9) event(sim, 'screws', 'The tips of her screws are breaking the surface');
    if (imm < 1.5) event(sim, 'screwsHalf', 'Her screws are half out of the water: what they push falls with it');
    if (imm < 0.05) event(sim, 'screwsOut', 'Her screws are out of the water: no engine order can move her');
    // the rudder's area under water against the night's: the sea's height up the blade, through its traced outline
    const ru = PLANT.rudder, wl = (-(F.R20 * ru.x + F.tz) / F.R22) - ru.heel + ru.slack;
    const ra = wl <= 0 ? 0 : rudderArea(RUDDER_TRACE, wl) / RUDDER_NIGHT;
    L.rudImm = ra >= 1 ? 1 : ra;
  }

  // Y3, the engineers on a ship under way: water first seen in a room with suctions puts its own pumps to work
  // PLANT.pumpOwn later, and pumps standing in dry rooms are led to it through the main PLANT.pumpLent later, nearest
  // first, up to its suctions and what the mains carry; a room already lost when they would start (water over the core's
  // params.pumpAbandon) is given up [bets on the night's practice: boiler room 6 abandoned at once, 5 and 4 pumped]. A
  // pump works for one room only. The 1912 damage preset carries the night's own schedule instead (core/scenarios.js).
  function roomWater(sim, k) { let w = 0; for (let s = 0; s < 4; s++) w += sim.vol[k * 4 + s]; return w; }
  const lc = (s) => s.charAt(0).toLowerCase() + s.slice(1);
  function roomLost(sim, k) {
    for (let sd = 0; sd < 2; sd++) { const n = C.nodeIndex(k, sd, 0); if (sim.vol[n] > 1e-6 && sim.level[n] - sim.zmin[n] > sim.params.pumpAbandon) return true; }
    return false;
  }
  // G18, PLANT.leadRule 1: room k judged, once, when its own pumps start: its mean inflow since water was seen (before
  // any pump drew; over the time since, if the bridge had the pumps then) against its own pumps with the lead's most.
  // The judgement is plain data in the plant's state (sim.plant.pumpJudge, made only under this rule, so that the
  // state under rule 0 is what it was): w0 the room's water when first seen, m3; qin and qcap, m3/s; g, -1 until judged.
  function judgeRoom(sim, P, J, k) {
    const qin = (roomWater(sim, k) - J.w0[k]) / (sim.t - P.pumpT[k]);
    const qcap = (P.pumpOwnLTh[k] + Math.max(0, Math.min(PLANT.suction[k] - P.pumpOwnLTh[k], PLANT.mainLTh))) * LTH;
    const r = qcap > 0 ? qin / qcap : Infinity, R = PLANT.leadRatio;
    J.qin[k] = qin; J.qcap[k] = qcap;
    J.g[k] = r <= 1 ? 1 : (r >= R ? 0 : (R - r) / (R - 1));
  }
  function pumpOrders(sim, P) {
    const Pp = PLANT.pumps, graded = PLANT.leadRule === 1;
    const J = graded ? (P.pumpJudge || (P.pumpJudge = { w0: new Float64Array(16), qin: new Float64Array(16), qcap: new Float64Array(16), g: new Float64Array(16).fill(-1) })) : null;
    for (let k = 0; k < 16; k++) {
      if (!(PLANT.suction[k] > 0)) continue;
      if (P.pumpT[k] < 0) {                         // water first seen here: its own pumps, which stay on it
        if (roomWater(sim, k) < 1) continue;
        P.pumpT[k] = sim.t; if (graded) J.w0[k] = roomWater(sim, k);
        for (let i = 0; i < Pp.length; i++) {
          if (P.pumpUsed[i] || Pp[i].room !== k) continue;
          P.pumpUsed[i] = 1; P.pumpOwnLTh[k] += Pp[i].LTh; P.pumpOn[i] = sim.pumpSched.length;
          C.addPump(sim, { zone: k, room: k, q: Pp[i].LTh * LTH, t0: sim.t + PLANT.pumpOwn, label: Pp[i].name });
        }
        event(sim, 'pumps' + k, 'Water in ' + lc(C.ZONES[k].name) + ': the engineers put its pumps on it');
        continue;
      }
      if (graded && J.g[k] < 0 && sim.t >= P.pumpT[k] + PLANT.pumpOwn) judgeRoom(sim, P, J, k);
      if (P.pumpLed[k] || sim.t < P.pumpT[k] + PLANT.pumpLent) continue;
      P.pumpLed[k] = 1;                             // time to lead more pumps to it, from rooms still dry, unless it is lost
      let cap = Math.min(PLANT.suction[k] - P.pumpOwnLTh[k], PLANT.mainLTh), full = PLANT.suction[k] - P.pumpOwnLTh[k];
      // G18: under the graded rule the room's judgement says how much is led; a room given none takes no pump
      if (graded) { cap *= J.g[k] < 0 ? 1 : J.g[k]; full = cap; if (!(cap > 0)) continue; }
      else if (roomLost(sim, k)) continue;
      const idle = [];
      for (let i = 0; i < Pp.length; i++) if (!P.pumpUsed[i] && Pp[i].room !== k && roomWater(sim, Pp[i].room) < 1) idle.push(i);
      idle.sort((i, j) => Math.abs(Pp[i].room - k) - Math.abs(Pp[j].room - k) || i - j);
      for (const i of idle) {
        if (!(cap > 0)) break;
        const q = Math.min(Pp[i].LTh, cap); cap -= q; P.pumpUsed[i] = 1; P.pumpOn[i] = sim.pumpSched.length;
        C.addPump(sim, { zone: k, room: Pp[i].room, q: q * LTH, t0: sim.t, label: Pp[i].name + ', on ' + lc(C.ZONES[k].name) + ' through the main' });
      }
      if (cap < full) event(sim, 'led' + k, 'Pumps led to ' + lc(C.ZONES[k].name) + ' through the bilge main');
    }
  }

  // Y6, the bridge's orders to the pumps: pumpOrder(sim, room, which), logged on a watch by core/night.js as 'pump'
  //   room 0-15, which a pump's index in PLANT.pumps, 'own' or 'all': that pump, the room's own pumps, or every free pump
  //     that can reach it, put on the room; which 'off': every pump on the room taken off
  //   room -1, which a pump's index: that pump taken off; which 'engineers': the pumps handed back to the engineers' rules
  //     (pumpOrders above), which go on from where the pumps then stand
  // An order carried out takes the pumps from the engineers until they are handed back. Its times are the rules' own
  // [bets]: a pump put on the room it stands in works PLANT.pumpOwn after the order (its steam valve opened in its pump
  // room, Barrett BI 2111; "soon after the collision", the Court); one led to another room through the bilge main works
  // PLANT.pumpLent after it (to couple a pump to boiler room 4, "half an hour from decision to start" would be good going,
  // Wilding BI 20684-20685; Halpern's 12:10). A pump taken off stops at once [bet: its steam valve shut]; a pump moved is
  // taken off its room and led anew. What a room takes [the note, section 5.1]: a pump on its own room works at its full
  // rate on that room's suctions, less what pumps led through the main already draw from them (as the rules have it);
  // pumps led through the main draw what is left of the room's suctions, and at most PLANT.mainLTh in all. Steam scales
  // them all (sim.pumpScale), and the core stops a pump for good when the room it stands in floods. Refused, changing
  // nothing, with the reason in plain words: no steam; a peak (no suction); a hold once the firemen's passage has flooded;
  // a pump whose room has flooded (its crew has gone); a room whose suctions or mains take no more; no free pump.
  // Returns { ok: false, why } or { ok: true, text, short } (short: one line, for the page's notice), and says it in
  // sim.events either way.
  const cap1 = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  function roomName(k) { const Z = C.ZONES[k], n = Z.name; return n.charAt(0) === 'N' ? n : (Z.peak || Z.kind === 'engine' || Z.kind === 'tunnel' ? 'the ' : '') + lc(n); }
  const pumpName = (i) => lc(PLANT.pumps[i].name);
  const isPump = (i) => Number.isInteger(i) && i >= 0 && i < PLANT.pumps.length;
  // the entry pump i works under now (sim.pumpSched), or null: none, or it has stopped
  function onNow(sim, P, i) { const j = P.pumpOn[i], e = j >= 0 ? sim.pumpSched[j] : null; return e && !e.off ? e : null; }
  // LT/h drawn from room k by the pumps on it: its own, and those led to it through the main
  function loadOn(sim, k) {
    let own = 0, led = 0;
    for (const e of sim.pumpSched) if (!e.off && e.zone === k) { if (e.room === k) own += e.q / LTH; else led += e.q / LTH; }
    return { own, led };
  }
  // what room k's suctions take on an order, LT/h, or why nothing can be drawn from it
  function suctionFor(P, k) {
    if (C.ZONES[k].peak) return { lth: 0, why: cap1(roomName(k)) + ' has no bilge suction: no pump can draw from it' };
    if (PLANT.holdSuction[k] > 0) return P.passageT >= 0 ? { lth: 0, why: cap1(roomName(k)) + '\'s bilge valves stand in the firemen\'s passage, and it has flooded' } : { lth: PLANT.holdSuction[k] };
    return { lth: PLANT.suction[k] };
  }
  // what pump i would draw from room k, LT/h, with L on it already and its suctions S; or why nothing
  function drawOn(i, k, L, S) {
    const own = PLANT.pumps[i].room === k, left = own ? S.lth - L.led : S.lth - L.own - L.led, main = own ? Infinity : PLANT.mainLTh - L.led;
    if (!(left >= 0.5)) return { q: 0, own, why: cap1(roomName(k)) + '\'s suctions take no more' };
    if (!(main >= 0.5)) return { q: 0, own, why: 'The bilge mains carry no more to ' + roomName(k) };
    return { q: Math.min(PLANT.pumps[i].LTh, left, main), own };
  }
  function takeOff(sim, P, i) { const e = onNow(sim, P, i); if (!e) return false; e.off = true; e.tOff = sim.t; e.taken = true; P.pumpOn[i] = -1; P.pumpUsed[i] = 0; return true; }
  function putOn(sim, P, i, k, q) {
    const p = PLANT.pumps[i], own = p.room === k;
    takeOff(sim, P, i);                             // a pump moved comes off its room first
    P.pumpOn[i] = sim.pumpSched.length; P.pumpUsed[i] = 1;
    C.addPump(sim, { zone: k, room: p.room, q: q * LTH, t0: sim.t + (own ? PLANT.pumpOwn : PLANT.pumpLent), label: p.name + (own ? '' : ', on ' + roomName(k) + ' through the main') });
  }
  function said(sim, P, label) { sim.events.push({ t: sim.t, id: 'plant:pump' + (++P.pumpN), label }); }
  function pumpOrder(sim, room, which) {
    const P = sim.plant, Pp = PLANT.pumps;
    if (!P) return { ok: false, why: 'No plant: there is nobody to give the order to' };
    const no = (why) => { said(sim, P, 'Pumps: an order that cannot be carried out. ' + why); return { ok: false, why }; };
    const yes = (text, short) => {                  // (no "bridge" in the log's words: the forecast picks out "Water reaches the bridge")
      const first = !P.pumpBridge; P.pumpBridge = true; P.doctrine = false;
      said(sim, P, 'Pumps, by order: ' + text + (first ? '. The engineers now wait for orders' : ''));
      return { ok: true, text: cap1(text), short };
    };
    if (which === 'engineers') {
      if (!P.pumpBridge) return no(P.doctrine ? 'The engineers have the pumps already' : 'The pumps are not under orders: there is nothing to hand back');
      P.pumpBridge = false; P.doctrine = true;
      for (let k = 0; k < 16; k++) { const L = loadOn(sim, k); P.pumpOwnLTh[k] = L.own + L.led; }   // the rules' account of what is on each room
      said(sim, P, 'Pumps: handed back to the engineers. Their rules from now on: a room\'s own pumps on it when water comes in, more led to it through the main later');
      return { ok: true, text: 'The pumps are the engineers\' again', short: 'The pumps are the engineers\' again' };
    }
    if (room === -1) {                              // one pump taken off, wherever it is
      if (!isPump(which)) return no('There is no such pump');
      const e = onNow(sim, P, which);
      if (!e) return no(cap1(pumpName(which)) + ' is not at work, nor being rigged');
      takeOff(sim, P, which);
      return yes(pumpName(which) + ' taken off ' + roomName(e.zone), cap1(pumpName(which)) + ' taken off');
    }
    if (!(Number.isInteger(room) && room >= 0 && room < 16)) return no('There is no such room');
    if (which === 'off') {                          // every pump taken off the room
      const on = []; for (let i = 0; i < Pp.length; i++) { const e = onNow(sim, P, i); if (e && e.zone === room) on.push(i); }
      if (!on.length) return no('No pump is on ' + roomName(room));
      for (const i of on) takeOff(sim, P, i);
      const t = (on.length === 1 ? pumpName(on[0]) : on.length + ' pumps') + ' taken off ' + roomName(room);
      return yes(t, cap1(t));
    }
    const S = suctionFor(P, room);
    if (!(S.lth > 0)) return no(S.why);
    if (!(sim.pumpScale > 0)) return no('No steam for the pumps: ' + (P.p * PLANT.psi).toFixed(1) + ' psi in the boilers, and they stop at ' + PLANT.pumpPsi[0]);
    const lost = (i) => roomLost(sim, Pp[i].room);
    let cands;
    if (which === 'own' || which === 'all') {
      const own = [], other = [];
      for (let i = 0; i < Pp.length; i++) {
        const e = onNow(sim, P, i);
        if (Pp[i].room === room) { if (!(e && e.zone === room) && (which === 'own' || !e)) own.push(i); }   // 'all' takes free pumps only
        else if (which === 'all' && !e && !lost(i)) other.push(i);
      }
      if (which === 'own') {
        if (!Pp.some(p => p.room === room)) return no(cap1(roomName(room)) + ' has no pump of its own: lead one to it through the main');
        if (!own.length) return no('The pumps of ' + roomName(room) + ' are on it already');
      }
      if (own.length && roomLost(sim, room)) { if (which === 'own') return no(cap1(roomName(room)) + ' has flooded: the crews of its pumps have gone'); own.length = 0; }
      other.sort((i, j) => Math.abs(Pp[i].room - room) - Math.abs(Pp[j].room - room) || i - j);   // nearest first, as the rules
      cands = own.concat(other);
      if (!cands.length) return no('No free pump can reach ' + roomName(room) + ': each is at work or its room has flooded');
    } else {
      if (!isPump(which)) return no('There is no such pump');
      const e = onNow(sim, P, which);
      if (e && e.zone === room) return no(cap1(pumpName(which)) + ' is on ' + roomName(room) + ' already');
      if (lost(which)) return no(cap1(pumpName(which)) + ': its room has flooded, its crew gone');
      cands = [which];
    }
    const L = loadOn(sim, room), done = [];
    let why = null;
    for (const i of cands) {
      const d = drawOn(i, room, L, S);
      if (!(d.q > 0)) { why = why || d.why; continue; }
      putOn(sim, P, i, room, d.q); if (d.own) L.own += d.q; else L.led += d.q; done.push([i, d.q, d.own]);
    }
    if (!done.length) return no(why);
    const part = (list, many, how, secs) => (list.length === 1 ? pumpName(list[0][0]) : many) + how + ', ' + Math.round(list.reduce((a, d) => a + d[1], 0)) + ' tons an hour, at work in ' + Math.round(secs / 60) + ' minutes';
    const own = done.filter(d => d[2]), led = done.filter(d => !d[2]), mins = [own.length ? PLANT.pumpOwn : 0, led.length ? PLANT.pumpLent : 0].filter(Boolean).map(s => Math.round(s / 60)).join(' and ');
    return yes('on ' + roomName(room) + ': ' + [own.length ? part(own, 'its ' + own.length + ' own pumps', '', PLANT.pumpOwn) : '', led.length ? part(led, led.length + ' pumps', ' led through the main', PLANT.pumpLent) : ''].filter(Boolean).join('; '),
      (done.length === 1 ? cap1(pumpName(done[0][0])) : done.length + ' pumps') + ' on ' + roomName(room) + ': at work in ' + mins + ' min');
  }

  // an order to the stokehold: draw the fires in room k (0 = boiler room 6, forward), or in every room (k < 0)
  function drawFires(sim, k) {
    const P = sim.plant, R = PLANT.rooms; if (!P) return;
    for (let j = 0; j < R.length; j++) {
      if ((k < 0 || j === k) && R[j].lit > 0 && P.fires[j] > 0 && !P.out[j] && !P.drawn[j]) { P.drawn[j] = 1; event(sim, 'drawn' + j, R[j].name + ': the order to draw the fires'); }
    }
  }
  // tonnes of coal for so many hours at Full ahead (the coal option of a restart or a watch)
  const coalFor = (hours) => hours * PLANT.coalPerDayFull / 24;

  function readouts(sim) {
    const P = sim.plant; if (!P) return null;
    const L = sim.mo && sim.mo.plant, coal = P.coal.reduce((a, v) => a + v, 0), burn = Math.min(P.gen, P.demand) * PLANT.coalPerDayFull / 24;
    return {
      rooms: PLANT.rooms.map((r, k) => ({ name: r.name, lit: r.lit, fires: P.fires[k], flooded: !!P.out[k], drawn: !!P.drawn[k], coal: P.coal[k] })),
      psi: P.p * PLANT.psi, p: P.p, gen: P.gen, can: P.can, demand: P.demand, coal, hoursLeft: burn > 1e-9 ? coal / burn : Infinity,
      firing: P.firing, blow: P.blow, lights: P.lights, emergency: P.emergency,
      engines: !P.re, turbineRoom: !P.te, power: P.power, dynamosFlooded: P.el, broken: P.broken,
      nMax: L ? L.nMax[0] : null, steer: L ? L.steerRate : null, screws: L ? L.imm.slice() : null, rudder: L ? L.rudImm : null,
      doorSwitch: !!P.doorSwitch, doors: C.BULKHEADS.map((b, i) => ({ id: b.id, low: LOW[i], open: !!sim.doorOpen[i], falling: sim.doorFall ? sim.doorFall[i] >= 0 : false, float: sim.doorFloat ? !!sim.doorFloat[i] : false })),
      // D112: the doors the engineers raised by hand (the record's schedule), each with when and why
      raised: (P.raised || []).map(r => ({ id: r.id, t: r.t, why: r.why })),
      pumps: pumpsNow(sim),
    };
  }
  // Y3: the pumps as they stand: scheduled, at work (started and not stopped), being rigged (not yet started), stopped (the
  // room it stands in flooded), taken off by order (Y6). Y6: who has them, each pump, and each room with water or with
  // pumps on it (the Systems tab gives its orders from these)
  function pumpsNow(sim) {
    const list = sim.pumpSched || [], P = sim.plant;
    let running = 0, waiting = 0, stopped = 0, taken = 0;
    for (const e of list) { if (e.off) { if (e.taken) taken++; else stopped++; } else if (sim.t < e.t0) waiting++; else running++; }
    const out = { scheduled: list.length, running, waiting, stopped, taken, scale: sim.pumpScale === undefined ? 1 : sim.pumpScale,
      tpm: (sim.pumpOut || 0) * C.RHO / 1000 * 60, pumpedT: (sim.pumped || 0) * C.RHO / 1000,
      list: list.map(e => ({ label: e.label, zone: e.zone, room: e.room, LTh: e.q / LTH, t0: e.t0, off: e.off, tOff: e.tOff, taken: !!e.taken })) };
    if (!P || !P.pumpOn) return out;
    out.who = P.pumpBridge ? 'bridge' : (P.doctrine ? 'engineers' : (sim.pumpScripted ? 'night' : 'none'));
    out.passageT = P.passageT;
    const pumpOf = new Map(); P.pumpOn.forEach((j, i) => { if (j >= 0) pumpOf.set(j, i); });
    const state = (e) => (e.off ? 'stopped' : (sim.t < e.t0 ? 'rigging' : 'working'));
    out.each = PLANT.pumps.map((p, i) => { const e = onNow(sim, P, i); return { i, name: p.name, room: p.room, LTh: p.LTh, on: e ? e.zone : -1, state: e ? state(e) : (roomLost(sim, p.room) ? 'lost' : 'free'), t0: e ? e.t0 : -1 }; });
    out.rooms = [];
    for (let k = 0; k < 16; k++) {
      const on = [];
      list.forEach((e, j) => { if (e.zone === k && !e.taken) on.push({ i: pumpOf.has(j) ? pumpOf.get(j) : -1, label: e.label, LTh: e.q / LTH, room: e.room, state: state(e), t0: e.t0, tOff: e.tOff }); });
      const water = roomWater(sim, k);
      if (water < 1 && !on.some(p => p.state !== 'stopped')) continue;
      let depth = 0; for (let sd = 0; sd < 2; sd++) { const n = C.nodeIndex(k, sd, 0); if (sim.vol[n] > 1e-6) depth = Math.max(depth, sim.level[n] - sim.zmin[n]); }
      const S = suctionFor(P, k);
      out.rooms.push({ k, name: C.ZONES[k].name, waterT: water * C.RHO / 1000, depth, lost: roomLost(sim, k), suction: S.lth, why: S.why || '',
        tpm: (sim.pump ? sim.pump[k] : 0) * C.RHO / 1000 * 60, own: PLANT.pumps.some(p => p.room === k), pumps: on });
    }
    return out;
  }

  return { PLANT, RUDDER_TRACE, rudderArea, attach, step, readouts, immersed, drawFires, coalFor, bridgeDoors, openDoor, closeDoor, LOW, pumpOrder, DOORS_RAISED };
});
