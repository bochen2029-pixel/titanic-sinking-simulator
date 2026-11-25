/*
 * The calls for help: the wireless as a load on the ship's plant, the distress call, the rockets and the Morse lamp as
 * orders, and the other ships as places with speeds, operators' hours and an arrival rule. Step 9 of
 * docs/BRAINSTORM_the_whole_night_v1_2026-11-17.md (section 6).
 *
 * A reader of the watch (core/night.js, "readers"): attached to every watch, stepped after the model's own step. Its
 * state is sim.world. It reads the flooding, the motion and the plant and writes into none of them; it pushes nothing
 * into sim.events (what the bridge is told is its own list, sim.world.lines). It draws nothing at random.
 *
 * Numbers: docs/research/RESEARCH_wireless_rockets_ships_clock_v1_2026-11-17.md ("the note", by section; its section 10
 * is this file's specification) and docs/research/RESEARCH_ship_systems_plant_v1_2026-11-16.md ("the plant note").
 * Tags as there: [read] in a source the note read, [derived] arithmetic on those, [bet] no source; [measured] this
 * model's own figure, checked by tools/world_tests.js.
 *
 * Time. T is minutes after the touch, which is 11:40 pm by her own clock (apparent time, ATS). Her witnesses gave ATS;
 * the other ships' operators logged New York time; the two are joined by her offset from New York, which is disputed:
 * 2 h 02 min (Halpern, the modern reading: the default) or 1 h 50 min (implied by the British Report: a switch). It moves
 * every New York event 12 minutes (the note, sections 2.1 and 7; Conflicts 1, 4 and 7).
 *
 * Settings of the night, in its spec (spec.world), so that a replay and a snapshot carry them; history when absent:
 *   californian  her distance in nautical miles: 18 (the 1992 reappraisal, the default) or 9 (the Court, 1912)
 *   acts         whether her watch acts on what it sees of Titanic (her rockets, her Morse lamp): false, as on the night
 *   clock        '2:02' (the default) or '1:50'
 *   conduct      true: with no order from the player the bridge does as it did in 1912; false: nothing unless ordered
 *
 * Orders (logged in the watch's log like the helm's; each prefixed help: so that no two readers collide):
 *   help:call 'cqd'      make the distress call now (with no order: the captain's at T 25, the first call at T 47)
 *   help:rocket 'socket' fire a socket signal: 36 in the locker aft, the box to be fetched first (with no order: eight
 *                        from T 66)
 *   help:lamp 'cqd'      work the Morse lamp at the nearest ship's light
 * World.call(sim), World.rocket(sim), World.lamp(sim) give them through core/night.js, as Night.helm gives the helm's.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../core.js'), require('../night.js'), require('../systems.js'));
  else root.TitanicWorld = factory(root.TitanicCore, root.TitanicNight, root.TitanicSystems);
})(typeof self !== 'undefined' ? self : this, function (C, N, Sys) {
  'use strict';
  if (!C || !N || !N.reader) return null;
  const NM = 1852, KN = NM / 3600, FT = 0.3048, DEG = Math.PI / 180;
  const hm = (h, m) => h * 60 + m;
  const TOUCH = hm(23, 40);                 // the touch: 11:40 pm by her clock [read: the British Report; Pitman]

  // ------------------------------------------------------------------ the clocks (the note, sections 2.1 and 7)
  // minutes each ship's clock ran ahead of New York's. Titanic: 2 h 02 min from her noon longitude of 14 April, her
  // clocks not changed that night (Halpern; Pitman) [read]; 1 h 50 min implied by the British Report [derived there].
  // Carpathia: NY + 1:57 (Halpern) on the first reading, NY + 1:50 (Rostron) on the second [read]. Californian: NY + 1:50
  // (Lord) [read]; 12 minutes behind Titanic on the first reading, the same clock on the second (Conflicts 7).
  const CLOCKS = {
    '2:02': { titanic: 122, carpathia: 117, californian: 110, name: 'her clock 2 h 02 min ahead of New York (Halpern)' },
    '1:50': { titanic: 110, carpathia: 110, californian: 110, name: 'her clock 1 h 50 min ahead of New York (the British Report)' },
  };
  const tNY = (ck, n) => n + ck.titanic - TOUCH;                     // T of a New York time (minutes after midnight, 14 April)
  const tCarp = (ck, c) => c - ck.carpathia + ck.titanic - TOUCH;    // T of a time on Carpathia's clock
  const tCal = (ck, c) => c - ck.californian + ck.titanic - TOUCH;   // T of a time on Californian's clock

  // ------------------------------------------------------------------ the call (the note, sections 2.2 and 10.2)
  // New York times as logged [read: the Cape Race log; the Mount Temple's, Olympic's and Baltic's logs; Cottam]
  const NYT = {
    cqd: hm(22, 25),       // the first CQD, with the captain's position, struck a berg
    position: hm(22, 35),  // Boxhall's corrected position: ten minutes after the first
    noise: hm(22, 36),     // "Sinking; cannot hear for noise of steam" (the British Report's 12:26, moved to New York)
    sos: hm(22, 55),       // the first SOS
    engine: hm(23, 41),    // "engine room flooded" (11:41-11:45)
    come: hm(23, 55),      // to Carpathia, her last: come as quickly as possible, the engine room filling up to the boilers
  };
  // With no order from the player, on a night whose touch let the sea in, the bridge does as it did in 1912:
  const CONDUCT = {
    order: 25,             // T: the captain tells the operators to get assistance, about ten minutes after Bride turned out
                           // at about five to twelve (Bride, US Day 10) [read; T derived]; the call waited for the position
    // the socket signals, about eight, one every 8.9 minutes from T 66 [derived: the note, 10.4, from the first at T 65-67
    // and the last at T 125-132 (Titanic's witnesses, ATS: the same on either clock)]
    rockets: [66, 75, 84, 93, 102, 111, 119, 128],
  };

  // ------------------------------------------------------------------ the set (the note, sections 1 and 10.3)
  const PDYN = Sys && Sys.PLANT ? Sys.PLANT.pDynamo : 0.3;   // the plant's own: the dynamos stop below this share of working pressure
  // F2 (NH15's design, U0; the mainline's ruling, 2026-11-23): the operators' "Engine room flooded" goes out once boiler
  // room 3's fires are out. Their "engine room" is read as the boiler rooms [bet]: the record's next message has it
  // "filling up to the boilers", and her own engine rooms (the plant's `re` and `te`) flood only near her end. The room
  // is found by its name, not by its place in the plant's list
  const ENGINE_ROOM = Sys && Sys.PLANT ? Sys.PLANT.rooms.findIndex((r) => r.name === 'Boiler room 3') : 3;
  const SET = {
    // the operating room on the boat deck, at the after end of the officers' deckhouse (Bride, BI 16346-16355) [read];
    // x in the ship's frame: G26's places table's (tools/places_table.js, 'wireless': just abaft funnel 1's casing, from
    // R3's row Bt-10 and the topsides) [bet]; it was 50 [bet: about 22 m abaft the bridge's front at x 72]
    roomX: 48.0,
    vBus: 100,             // V: the DC bus the 5 kW motor generator ran from [derived: the note, 10.3; the plant note]
    pFull: 0.5,            // share of working pressure down to which the dynamos' governors hold the bus at full voltage;
                           // below it the voltage falls in a line to vSpark at the plant's own stopping point [bet, this file's]
    vRange: 90,            // V: full reach at or above this; the reach falls in proportion to the voltage below it [bet: the note, 10.3]
    vSpark: 70,            // V: no usable spark below this [bet: the note, 10.3]
    night: 1500,           // nm: the reach at night at full power [read: the note, section 1 (1,500 to 2,000); every ship here is inside it]
    battery: 150,          // nm: the reach on the storage battery in the wireless cabin [bet: the note's 100 to 200; NOT FOUND for Titanic]
    batteryHours: 6,       // its life [read: the plant note, the battery-and-coil set, "at least 6 h"]
    changeover: 2,         // min for a man to throw the change-over to the emergency dynamos, or to the battery [bet: the note, 10.3]
  };
  // Who throws the battery in: the operator at the key, when he has the call to make and finds the set without current
  // [bet]. The operators stay at the key until the sea reaches the room (Phillips went back to it after the captain had
  // released them: the note, 2.2) [read, bet].

  // ------------------------------------------------------------------ rockets and the lamp (the note, sections 5 and 10.4)
  const ROCKETS = {
    stock: 36,             // socket signals carried [read, secondary: THS; an equipment list in a forum post]
    fetch: 10,             // min to bring the box from the locker under the poop (Rowe fetched them from aft) [bet: the note,
                           // 10.4: the earliest first rocket about T 10-15]
    reload: 1,             // min between two from the one socket [bet: the firers' estimate of the interval was about five]
    burstFt: 600,          // ft: the burst ["several hundred feet" (Lightoller) read; 600 ft a secondary figure]
    lum: 25,               // nm: a burst's luminous range on a clear dark night [bet: the note, 10.4]
    report: 5,             // nm: its report heard within this [bet: the note, 10.4; NOT FOUND]
    socketX: 65.9,         // m: the socket in the starboard rail by emergency boat No. 1 [read: Boxhall], between No. 1's davits at
                           // +65.72 and +66.18 [read: Read's davit article; G26's places table, 'socket.stbd'] [bet: between them]; it was 62
  };
  const LAMP = { nm: 10 };          // read within this by a watch that is watching [read: Lord's claim of his own lamp]
  // a ship's lights seen from Titanic's bridge: her masthead light [bet: 100 ft] above the horizon of a 65.5 ft eye [derived:
  // the core's boat deck, 92.25 ft above the keel, less the night's mean draft, 9.83 m, plus 5.5 ft] is 21.2 nm off, so the
  // light's own range decides: 17 nm [read: Halpern's estimate for Titanic's masthead light]
  const LIGHTS = { nm: 17 };
  const horizon = (H, h) => 1.17 * (Math.sqrt(H) + Math.sqrt(h));    // nm: a light H ft up on the horizon of an eye h ft up [read: the note, 5.1]

  // ------------------------------------------------------------------ the other ships (the note, sections 3, 4 and 10.1)
  // Places from the wreck: bearing (true, deg) and distance (nm); speed (kn, a mean that includes her ice); delay (min from
  // hearing to under way at that speed); eye (ft, her bridge, for seeing a rocket). Rules for the model (the note, 10.1):
  // a rescuer steers for where Titanic is (the position she was sent, and where her lights and rockets then lead her);
  // if Titanic moves, the distance is from where she lies now. Arrival is not rescue.
  // Operators: the others were listening throughout [bet: the note, 10.3].
  const CQD_POS = { brg: 281, d: 13.1 };                  // Boxhall's position from the wreck [derived: the note, Conflicts 2]
  const SHIPS = [
    // heard by her one operator at 10:35 NY, who had called Titanic himself (T 57) [read]; she turned at 12:35 her time and
    // stopped among the boats at 4:00 (T 265): 46.5 nm [derived: 46.9 to the wreck, 45.9 to the boats at 4 a.m.] in 205 min,
    // 13.6 kn [derived]; bearing S 44 E from the wreck [derived]
    { id: 'carpathia', name: 'Carpathia', brg: 136, d: 46.5, kn: 13.6, delay: { '2:02': 3, '1:50': 10 }, eye: 55,
      // his watch: about to turn in at 10:35 NY; asleep from about 10:40-10:45 [bet: the note, 10.3]. Before 10:35 he was
      // taking Cape Cod's news and waiting for the Parisian (Cottam, BI 17085-17107) [read]; when that began is not in the
      // note [bet: 10:15 NY, after T 5, so that a call made at once is heard at once, as the note takes it in 10.5 (a)]
      offNY: hm(22, 45), busyNY: [hm(22, 15), hm(22, 35)] },
    // stopped in field ice at 10:21 pm her time, 22.8 nm N 19 W of the wreck on her own reckoning [read, derived]; her
    // distance is a setting (spec.world.californian). Her operator turned in at 11:35 her time (Evans, US; 11:30 at the
    // British inquiry) [read]. On a call heard or a signal acted on: 10 min to rouse the master and ring the engines [bet],
    // then the ice round her, 1.5 nm [bet: the note's d - 1.5 in open water] in 30 min [bet: 15-60, anchored on her morning],
    // or 15 min at the Court's distance, where the Court found the ice loose, 2-3 nm [read], then 13 kn [read: 12.5-13 full;
    // 13-13.5 on her morning run]. Eye 45 ft [read: Halpern's].
    { id: 'californian', name: 'Californian', brg: 341, d: 18, kn: 13, delay: { '2:02': 10, '1:50': 10 }, eye: 45,
      offCal: hm(23, 35), ice: { nm: 1.5, mins: 30, courtNm: 10, courtMins: 15 } },
    // answered the first CQD (10:25 NY) and reversed at 10:40 (15 min) [read]; 49.5 nm S 65 W of the position she was sent
    // [read: Moore; derived], so 60.6 nm from the wreck [derived]; about 11.5 kn [read]; met ice at about 3:00 her time and
    // stopped about 14 nm short [read]: here, after 35.5 nm of her run [derived], and she does not come on
    { id: 'mountTemple', name: 'Mount Temple', from: CQD_POS, brg: 245, d: 49.5, kn: 11.5, delay: { '2:02': 15, '1:50': 15 }, eye: 55, stopAfter: 35.5 },
    // 154 nm S 36 W [read; derived 148-154], 12.5 kn listed [read]; delay [bet]
    { id: 'frankfurt', name: 'Frankfurt', brg: 216, d: 154, kn: 12.5, delay: { '2:02': 15, '1:50': 15 }, eye: 55 },
    // SSW; 100 nm by her master [read] (70 at 12:25 NY in her own message; 106-107 by her operator: Conflicts 11); 13 kn [read]
    { id: 'birma', name: 'Birma', brg: 202.5, d: 100, kn: 13, delay: { '2:02': 15, '1:50': 15 }, eye: 55 },
    // about 170 nm N [read: the US Report, Cape Race]; 18 kn listed [read]
    { id: 'virginian', name: 'Virginian', brg: 0, d: 170, kn: 18, delay: { '2:02': 15, '1:50': 15 }, eye: 55 },
    // 243 nm E by her bridge [read] (SE in the US Report: Conflicts 13); 17.5 kn [derived: 134 nm west in about 7.5 h]
    { id: 'baltic', name: 'Baltic', brg: 90, d: 243, kn: 17.5, delay: { '2:02': 15, '1:50': 15 }, eye: 55 },
    // 505 nm W by S [read: her log; Haddock]; 22.7 kn [derived: 505 to 310 nm between 11:10 pm and 7:45 am NY]
    { id: 'olympic', name: 'Olympic', brg: 258.75, d: 505, kn: 22.7, delay: { '2:02': 15, '1:50': 15 }, eye: 55 },
  ];
  // Where the wreck lies from her place at the touch [measured: the 1912 watch on its own orders founders 1,295.7 m north
  // and 7,700.4 m west of where she was on the step of the touch, T 157.2; tools/world_tests.js checks it]. The note's
  // distances are to the wreck; this model's 1912 ship does not stop where she struck but runs on 4.2 nm after the touch
  // (6.75 before M7, when a stopped screw dragged nothing: 2,202.7 m north and 12,317.3 m west), so the other ships are
  // placed from her wreck, and the 1912 night brings Carpathia to it at the note's minute. A night that stops sooner lies
  // nearer them (the report says how much).
  // remeasured at G12's switch (D98): the 1912 watch now ends at her hand-over, the break's onset (T 156.46), so the wreck
  // is where she lies then; at her flag (the 'flag' what-if, T 163.47) she is 74 m on, at 1,323.4 m N and 7,816.3 m W
  // (remeasured at the calibration epoch's landing, D4, D90; 1,295.7 and 7,700.4 before it)
  const WRECK_1912 = { X: 1306.0, Y: -7744.0 };

  // ------------------------------------------------------------------ settings
  function settings(spec) {
    const w = (spec && spec.world) || {};
    return {
      californian: typeof w.californian === 'number' && isFinite(w.californian) && w.californian >= 1 && w.californian <= 40 ? w.californian : 18,
      acts: w.acts === true,
      clock: Object.prototype.hasOwnProperty.call(CLOCKS, w.clock) ? w.clock : '2:02',
      conduct: w.conduct !== false,
    };
  }

  // ------------------------------------------------------------------ attach
  function attach(sim, spec) {
    const o = settings(spec), ck = CLOCKS[o.clock];
    sim.world = {
      o, ck, clock0: spec && spec.clock0 !== undefined ? spec.clock0 : TOUCH * 60,
      anchored: false, X0: 0, Y0: 0, distress: false,
      set: { supply: 'main', volts: SET.vBus, reach: SET.night, working: true, why: 'on the main dynamos', room: false, emSince: -1,
        deadSince: -1, battery: -1, wasWorking: true },
      call: { order: -1, by: null, due: -1, first: -1, sent: {} },
      rockets: { fired: 0, pending: 0, fetched: -1, last: -1e9, times: [], ci: 0, mine: false },
      lamp: { worked: 0, times: [], lit: true, why: 'on the main dynamos' },
      F: {},                                                         // a frame reused each step (the wireless room's height)
      ships: SHIPS.map(s => {
        const d = s.id === 'californian' ? o.californian : s.d, ice = s.ice ? (d <= s.ice.courtNm ? s.ice.courtMins : s.ice.mins) : 0;
        // her operator's watch in T on this clock: off from offT; not listening from busy[0] to busy[1]
        const offT = s.offNY !== undefined ? tNY(ck, s.offNY) : (s.offCal !== undefined ? tCal(ck, s.offCal) : Infinity);
        const busy = s.busyNY ? [tNY(ck, s.busyNY[0]), tNY(ck, s.busyNY[1])] : null;
        return { id: s.id, name: s.name, kn: s.kn, delay: s.delay[o.clock], eye: s.eye, stopAfter: s.stopAfter || 0, offT, busy,
          iceNm: s.ice ? s.ice.nm : 0, iceMin: ice, d0: d, brg0: s.brg, from: s.from || null,
          X: 0, Y: 0, state: 'none', how: null, tHeard: -1, tGo: -1, tAlong: -1, tStop: -1, run: 0, iceRun: 0,
          seen: 0, tSeen: -1, lampRead: 0, inSight: false, tSight: -1, told: false, nm: 0, nmHeard: null };
      }),
      lines: [],
    };
    return sim.world;
  }
  // the other ships set down on the earth, from where she is now (the touch, or the first order of this reader's)
  function anchor(sim, W) {
    const m = sim.mo; if (!m || W.anchored) return;
    W.anchored = true; W.X0 = m.X; W.Y0 = m.Y;
    const wx = m.X + WRECK_1912.X, wy = m.Y + WRECK_1912.Y;
    for (const s of W.ships) {
      let x = wx, y = wy;
      if (s.from) { x += s.from.d * NM * C.cos(s.from.brg * DEG); y += s.from.d * NM * C.sin(s.from.brg * DEG); }
      s.X = x + s.d0 * NM * C.cos(s.brg0 * DEG); s.Y = y + s.d0 * NM * C.sin(s.brg0 * DEG);
    }
    for (const s of W.ships) s.nm = dist(sim, s) / NM;
  }

  // ------------------------------------------------------------------ helpers
  const tRef = (sim) => (sim.night && sim.night.tTouch >= 0 ? sim.night.tTouch : 0);
  const Tof = (sim, t) => (t - tRef(sim)) / 60;                     // minutes after the touch (before one: after the watch began)
  const tOfT = (sim, T) => tRef(sim) + 60 * T;
  function dist(sim, s) { const m = sim.mo, dx = s.X - m.X, dy = s.Y - m.Y; return Math.sqrt(dx * dx + dy * dy); }
  function bearing(sim, s) { const m = sim.mo; let b = C.atan2(s.Y - m.Y, s.X - m.X) / DEG; if (b < 0) b += 360; return b; }
  function clockText(W, t) {
    const s = ((Math.round(W.clock0 + t) % 86400) + 86400) % 86400;
    let h = Math.floor(s / 3600); const mm = Math.floor(s % 3600 / 60), ap = h >= 12 ? 'pm' : 'am';
    h = h % 12; if (h === 0) h = 12;
    return h + ':' + String(mm).padStart(2, '0') + ' ' + ap;
  }
  const miles = (nm) => (nm < 9.5 ? nm.toFixed(1) : String(Math.round(nm)));
  function side(rel) {                                               // a bearing off her bow, in words
    const a = Math.abs(rel), s = rel < 0 ? 'port' : 'starboard';
    if (a < 6) return 'right ahead'; if (a > 174) return 'right astern';
    return a < 45 ? 'on the ' + s + ' bow' : (a < 135 ? 'on the ' + s + ' beam' : 'on the ' + s + ' quarter');
  }
  function relBearing(sim, s) { let r = bearing(sim, s) - sim.mo.psi / DEG; r = ((r % 360) + 540) % 360 - 180; return r; }
  function line(sim, W, kind, text, who) { W.lines.push({ t: sim.t, T: Tof(sim, sim.t), kind, who: who || null, text }); }
  const awash = (sim, x, z) => C.worldZ(C.poseFrame(sim, sim.zO, sim.pitch, sim.roll, sim.world.F), x, 0, z) < 0;
  const bridgeDry = (sim) => !(sim.markT && sim.markT.bridge >= 0);
  // the Morse lamps (F9, NH15: docs/DESIGN_the_living_ship_v1_2026-11-23.md): joined to the emergency circuit "by
  // change-over switches", with the mast, side and stern lights, the bridge lights, the telegraph lamps and the Marconi
  // set [read: the British Report, "Electrical Installation", through the plant note]. On the main circuit while the main
  // dynamos run; when they stop and the emergency sets still run, dark until a man throws the change-over (SET.changeover,
  // the set's own bet, counted from the plant's own mainDark); then on the emergency sets while they run
  function lampState(sim) {
    const P = sim.plant;
    if (!P) return { lit: true, why: 'on the main dynamos' };
    if (P.power) return { lit: true, why: 'on the main dynamos' };
    if (!P.emergency) return { lit: false, why: P.broken ? 'no current: her steam mains have given way' : 'no current: the dynamos have stopped' };
    const t0 = P.events.mainDark;
    if (t0 === undefined || sim.t < t0 + SET.changeover * 60) return { lit: false, why: 'no current until the change-over to the emergency dynamos is thrown' };
    return { lit: true, why: 'on the emergency dynamos, by the change-over' };
  }
  const current = (sim) => lampState(sim).lit;

  // the bus voltage from the steam (the dynamos', main and emergency alike: they share the plant's stopping point)
  function voltsOf(p) {
    if (p >= SET.pFull) return SET.vBus;
    if (p <= PDYN) return 0;
    return SET.vSpark + (SET.vBus - SET.vSpark) * (p - PDYN) / (SET.pFull - PDYN);
  }
  function reachOf(v) { return v >= SET.vRange ? SET.night : (v >= SET.vSpark ? SET.night * v / SET.vRange : 0); }

  // ------------------------------------------------------------------ the set, each step
  function setStep(sim, W) {
    const S = W.set, P = sim.plant, t = sim.t;
    if (!S.room && awash(sim, SET.roomX, C.deckZ('Boat', SET.roomX))) S.room = true;   // the sea in the wireless room: for good
    let bus = 'main', v = SET.vBus;
    if (P) {
      if (P.power) { bus = 'main'; S.emSince = -1; } else if (P.emergency) { bus = 'emergency'; if (S.emSince < 0) S.emSince = t; } else { bus = 'none'; S.emSince = -1; }
      v = bus === 'none' ? 0 : voltsOf(P.p);
    }
    let supply = bus, why = bus === 'main' ? 'on the main dynamos' : 'on the emergency dynamos', reach = reachOf(v);
    if (bus === 'emergency' && t < S.emSince + SET.changeover * 60) { supply = 'none'; why = 'no current: the main dynamos have stopped and the change-over to the emergency dynamos is being thrown'; reach = 0; }
    if (supply !== 'none' && reach <= 0) { supply = 'none'; why = 'no spark: the dynamos give ' + Math.round(v) + ' V'; }
    if (supply === 'none') {
      // the operator throws in the battery when he has the call to make and finds the set dead
      if (W.call.due >= 0 && !S.room) { if (S.deadSince < 0) S.deadSince = t; if (S.battery < 0 && t >= S.deadSince + SET.changeover * 60) S.battery = t; }
      if (S.battery >= 0 && t < S.battery + SET.batteryHours * 3600) { supply = 'battery'; v = 0; reach = SET.battery; why = 'on its battery'; }
      else if (bus === 'none') why = S.battery >= 0 ? 'no current: the battery is spent' : (P && P.broken ? 'no current: her steam mains have given way' : 'no current: the dynamos have stopped for want of steam');
    } else S.deadSince = -1;
    if (S.room) { supply = 'none'; reach = 0; why = 'the sea is in the wireless room'; }
    S.supply = supply; S.volts = supply === 'battery' ? null : v; S.reach = reach; S.why = why; S.working = supply !== 'none';
    if (S.working && v > 0 && v < SET.vRange && supply !== 'battery') S.why = why + ', the voltage falling (' + Math.round(v) + ' V)';
  }

  // ------------------------------------------------------------------ the call, the messages, the bridge's own conduct
  function callStep(sim, W, T) {
    const c = W.call, S = W.set, t = sim.t, ck = W.ck;
    if (W.o.conduct && W.distress) {
      if (c.order < 0 && T >= CONDUCT.order) {
        c.order = t; c.by = 'bridge'; c.due = tOfT(sim, Math.max(CONDUCT.order, tNY(ck, NYT.cqd)));
        line(sim, W, 'order', 'The captain to the wireless room: send the call for assistance. The operators wait for the position.');
      }
    }
    if (c.due >= 0 && c.first < 0 && t >= c.due && S.working) {
      c.first = t;
      line(sim, W, 'out', 'CQD: struck a berg, her position. The operators keep calling.');
    }
    if (c.first < 0) return;
    const m = sim.mo, F = (min) => c.first + 60 * min, sent = c.sent;
    const send = (id, when, text) => { if (!sent[id] && t >= when && S.working) { sent[id] = t; line(sim, W, 'out', text); } };
    send('position', F(NYT.position - NYT.cqd), 'The corrected position is sent (Boxhall\'s).');
    if (!sent.noise && t >= F(NYT.noise - NYT.cqd) && S.working) {
      const loud = sim.plant && sim.plant.blow > 0.02;
      sent.noise = t; line(sim, W, 'out', loud ? 'Sinking; cannot hear for the noise of steam.' : 'Sinking.');
    }
    send('sos', F(NYT.sos - NYT.cqd), 'SOS: the new call goes out with the old.');
    if (sim.markT && sim.markT.ports >= 0) send('head', -1, 'Going down fast at the head; get your boats ready.');
    if (sim.plant && ENGINE_ROOM >= 0 && sim.plant.out[ENGINE_ROOM]) { if (!sent.engineDue) sent.engineDue = t; send('engine', sent.engineDue, 'Engine room flooded.'); }
    if (sent.engine) send('come', sent.engine + 60 * (NYT.come - NYT.engine), 'Come as quickly as possible: the engine room is filling up to the boilers.');
    if (!sent.release && sim.markT && sim.markT.fcastle >= 0) { sent.release = t; line(sim, W, 'order', 'The captain releases the operators; Phillips stays at the key.'); }
    void m;
  }

  // ------------------------------------------------------------------ rockets
  function fire(sim, W, by) {
    const R = W.rockets, t = sim.t;
    R.fired++; R.last = t; R.times.push(t);
    line(sim, W, 'order', 'A rocket goes up from the starboard socket, ' + R.fired + ' of ' + ROCKETS.stock + (by === 'bridge' ? '.' : ', on your order.'));
    if (!W.anchored) return;
    for (const s of W.ships) {
      const nm = dist(sim, s) / NM;
      if (nm <= Math.min(horizon(ROCKETS.burstFt, s.eye), ROCKETS.lum)) { s.seen++; if (s.tSeen < 0) s.tSeen = t; if (s.id === 'californian' && W.o.acts && s.state === 'none') act(sim, W, s, 'rocket'); }
    }
  }
  function rocketStep(sim, W, T) {
    const R = W.rockets, t = sim.t;
    if (!bridgeDry(sim)) { R.pending = 0; return; }
    if (W.o.conduct && W.distress && !R.mine && R.ci < CONDUCT.rockets.length && T >= CONDUCT.rockets[R.ci] && R.fired < ROCKETS.stock) { R.ci++; fire(sim, W, 'bridge'); }
    if (R.pending > 0 && R.fetched >= 0 && t >= R.fetched && t >= R.last + 60 * ROCKETS.reload - 1e-9 && R.fired < ROCKETS.stock) { R.pending--; fire(sim, W, 'player'); }
  }

  // ------------------------------------------------------------------ the other ships
  const onWatch = (s, T) => T < s.offT && !(s.busy && T >= s.busy[0] && T < s.busy[1]);
  function act(sim, W, s, how) {                                     // she has heard the call, or her watch acts on a signal
    s.nm = dist(sim, s) / NM; s.nmHeard = s.nm;
    s.state = 'heard'; s.how = how; s.tHeard = sim.t; s.tGo = sim.t + 60 * s.delay;
    if (how === 'wireless') {
      s.told = true;
      line(sim, W, 'in', s.name + ' answers: ' + miles(s.nm) + ' miles off.', s.id);
    }
  }
  function etaOf(s, t, d) {                                          // closed form, as if Titanic lay where she is now (d: m)
    if (s.state === 'alongside') return s.tAlong;
    if (s.state === 'none' || s.state === 'stopped') return null;
    let tt = s.state === 'heard' ? s.tGo : t, dd = d, run = s.run;
    const left = s.iceNm * NM - s.iceRun;
    if ((s.state === 'heard' || s.state === 'ice') && left > 0) { const v = s.iceNm * NM / (60 * s.iceMin); tt += left / v; dd -= left; run += left; }
    if (s.stopAfter && run + Math.max(0, dd) > s.stopAfter * NM) return null;
    return tt + Math.max(0, dd) / (s.kn * KN);
  }
  function shipsStep(sim, W, T, dt) {
    const S = W.set, t = sim.t, m = sim.mo, calling = W.call.first >= 0;
    for (const s of W.ships) {
      const d = dist(sim, s); s.nm = d / NM;
      if (s.state === 'none') {
        if (calling && S.working && s.nm <= S.reach && onWatch(s, T)) act(sim, W, s, 'wireless');
        else continue;
      }
      if (s.state === 'stopped') continue;
      if (s.state === 'alongside') { s.X = m.X; s.Y = m.Y; s.nm = 0; continue; }
      if (s.state === 'heard') {
        if (t < s.tGo) continue;
        s.state = s.iceNm > 0 ? 'ice' : 'coming';
        if (s.how === 'wireless' && S.working) {
          const eta = etaOf(s, t, d);
          line(sim, W, 'in', s.name + ': coming' + (eta === null ? '' : '; she expects to be with you at ' + clockText(W, eta)) + '.', s.id);
        }
      }
      // under way: a step toward where Titanic is now
      const v = s.state === 'ice' ? s.iceNm * NM / (60 * s.iceMin) : s.kn * KN;
      let stepM = v * dt;
      if (s.stopAfter && s.run + stepM >= s.stopAfter * NM) {      // the ice stops her (Mount Temple)
        stepM = Math.max(0, s.stopAfter * NM - s.run);
        s.X += (m.X - s.X) * stepM / d; s.Y += (m.Y - s.Y) * stepM / d; s.run += stepM;
        s.state = 'stopped'; s.tStop = t; s.nm = dist(sim, s) / NM;
        if (s.told && S.working) line(sim, W, 'in', s.name + ': stopped by the ice, ' + miles(s.nm) + ' miles off.', s.id);
        continue;
      }
      if (d <= stepM) {
        s.state = 'alongside'; s.tAlong = t - dt + d / v; s.X = m.X; s.Y = m.Y; s.nm = 0; s.run += d;
        line(sim, W, 'in', (s.told ? s.name : 'A steamer') + ' is alongside.', s.id);
        continue;
      }
      s.X += (m.X - s.X) * stepM / d; s.Y += (m.Y - s.Y) * stepM / d; s.run += stepM;
      if (s.state === 'ice') { s.iceRun += stepM; if (s.iceRun >= s.iceNm * NM) s.state = 'coming'; }
      s.nm = dist(sim, s) / NM;
    }
    // what the bridge can see: another ship's lights inside their range
    for (const s of W.ships) {
      const was = s.inSight; s.inSight = s.state !== 'alongside' && s.nm <= LIGHTS.nm;
      if (s.inSight && !was) {
        if (s.tSight < 0) s.tSight = t;
        line(sim, W, 'seen', (s.told ? s.name + '\'s lights' : 'A steamer\'s lights') + ' in sight ' + side(relBearing(sim, s)) + ', about ' + miles(s.nm) + ' miles.', s.id);
      }
    }
  }

  // ------------------------------------------------------------------ the step
  function step(sim) {
    const W = sim.world; if (!W || !sim.mo) return;
    // Z3: she is gone: the set is silent for good, no call and no rocket after; the other ships keep their courses
    if (N.over && N.over(sim)) {
      if (W.gone === undefined) { W.gone = sim.t; W.set.working = false; W.set.why = 'she has gone'; line(sim, W, 'set', 'The wireless is silent: she has gone.'); }
      if (W.anchored) shipsStep(sim, W, Tof(sim, sim.t), sim.params.dt);
      return;
    }
    const w = sim.night, dt = sim.params.dt;
    if (!W.anchored && w.tTouch >= 0) anchor(sim, W);
    if (!W.distress && w.tTouch >= 0 && sim.openings.length > 0) W.distress = true;    // the touch let the sea in
    const T = Tof(sim, sim.t);
    const was = W.set.working;
    setStep(sim, W);
    if (W.call.first >= 0 && was !== W.set.working) line(sim, W, 'set', W.set.working ? 'The wireless works again, ' + W.set.why + '.' : 'The wireless is silent: ' + W.set.why + '.');
    // the Morse lamp's state as plain data, for a view (NH15): the same rule its order obeys
    const ls = lampState(sim), dry = bridgeDry(sim);
    W.lamp.lit = ls.lit && dry; W.lamp.why = dry ? ls.why : 'the bridge is under water';
    callStep(sim, W, T);
    rocketStep(sim, W, T);
    if (W.anchored) shipsStep(sim, W, T, dt);
  }

  // ------------------------------------------------------------------ orders (core/night.js logs them and replays them)
  function ensureAnchor(sim) { const W = sim.world; if (W && !W.anchored) anchor(sim, W); }
  const ORDERS = {
    // make the call now: at once if the set works, else as soon as it does (the battery thrown in). False if already calling.
    'help:call': (sim) => {
      const W = sim.world, c = W.call; ensureAnchor(sim);
      if (c.first >= 0) return false;
      const first = c.order < 0;
      if (first) c.order = sim.t;
      c.by = 'player'; c.due = sim.t;
      line(sim, W, 'order', first ? 'Your order to the wireless room: send the distress call now.' : 'Your order to the wireless room: send it now, with the position we have.');
      return true;
    },
    // a rocket: the box is fetched from aft first; then one each time the socket is ready. False: none left, or no bridge.
    'help:rocket': (sim) => {
      const W = sim.world, R = W.rockets; ensureAnchor(sim);
      if (!bridgeDry(sim) || R.fired + R.pending >= ROCKETS.stock) return false;
      if (!R.mine) {
        R.mine = true;
        if (R.fired > 0) R.fetched = sim.t;                          // the box is on the bridge already
        else {
          // sent for now; or, on a night the bridge keeps its 1912 conduct, already on its way for the first at T 66
          const T = Tof(sim, sim.t), first = CONDUCT.rockets[0], own = sim.t + 60 * ROCKETS.fetch;
          R.fetched = W.o.conduct && W.distress && T >= first - ROCKETS.fetch ? Math.min(own, tOfT(sim, first)) : own;
          line(sim, W, 'order', 'Your order: rockets. ' + (R.fetched < own ? 'The box is on its way from aft.' : 'A quartermaster goes aft for the box.'));
        }
      }
      R.pending++;
      return true;
    },
    // the Morse lamp at the nearest ship's light: read by a watch within its range; she acts only if her watch acts
    'help:lamp': (sim) => {
      const W = sim.world; ensureAnchor(sim);
      if (!bridgeDry(sim) || !current(sim)) { line(sim, W, 'order', 'The Morse lamp: no current to it.'); return false; }
      W.lamp.worked++; W.lamp.times.push(sim.t);
      let read = null;
      for (const s of W.ships) {
        s.nm = dist(sim, s) / NM;
        if (s.nm <= LAMP.nm) { s.lampRead++; if (!read) read = s; if (s.id === 'californian' && W.o.acts && s.state === 'none') act(sim, W, s, 'lamp'); }
      }
      line(sim, W, 'order', 'The Morse lamp calls the nearest light: CQD.' + (read && read.state !== 'none' ? ' An answering light.' : ' No answer.'));
      return true;
    },
  };
  function valid(type, value, arg) {
    if (arg !== undefined && arg !== null) return false;
    if (type === 'help:call') return value === 'cqd';
    if (type === 'help:rocket') return value === 'socket';
    if (type === 'help:lamp') return value === 'cqd';
    return false;
  }
  N.reader({ name: 'world', state: 'world', attach, step, orders: ORDERS, valid });

  // ------------------------------------------------------------------ what the viewer and the tests read
  function readouts(sim) {
    const W = sim.world; if (!W) return null;
    const t = sim.t, S = W.set, R = W.rockets, c = W.call, T = (x) => (x >= 0 ? Tof(sim, x) : null);
    return {
      T: Tof(sim, t), clock: W.o.clock, clockName: W.ck.name, settings: Object.assign({}, W.o),
      set: { supply: S.supply, volts: S.volts, reach: S.reach, working: S.working, why: S.why, battery: S.battery >= 0, room: S.room },
      call: { orderedT: T(c.order), by: c.by, firstT: T(c.first), calling: c.first >= 0 && S.working, sent: Object.fromEntries(Object.entries(c.sent).filter(e => typeof e[1] === 'number' && e[0] !== 'engineDue').map(e => [e[0], Tof(sim, e[1])])) },
      rockets: { fired: R.fired, left: ROCKETS.stock - R.fired, pending: R.pending, fetchedT: T(R.fetched), times: R.times.map(x => Tof(sim, x)), mine: R.mine },
      lamp: { worked: W.lamp.worked, times: W.lamp.times.map(x => Tof(sim, x)) },
      ships: W.ships.map(s => {
        const d = W.anchored ? (s.state === 'alongside' ? 0 : dist(sim, s)) : null, eta = W.anchored ? etaOf(s, t, d) : null;
        return {
          id: s.id, name: s.name, state: s.state, how: s.how, told: s.told, nm: d === null ? null : d / NM, nmHeard: s.nmHeard,
          brg: W.anchored ? bearing(sim, s) : null, rel: W.anchored ? relBearing(sim, s) : null, kn: s.kn,
          heardT: T(s.tHeard), goT: T(s.tGo), etaT: eta === null ? null : Tof(sim, eta), alongsideT: T(s.tAlong), stoppedT: T(s.tStop),
          seen: s.seen, lampRead: s.lampRead, inSight: s.inSight, eta: eta === null ? null : clockText(W, eta),
        };
      }),
      lines: W.lines.length,
    };
  }
  const call = (sim) => N.act(sim, 'help:call', 'cqd');
  const rocket = (sim) => N.act(sim, 'help:rocket', 'socket');
  const lamp = (sim) => N.act(sim, 'help:lamp', 'cqd');

  return { CLOCKS, NYT, CONDUCT, SET, ROCKETS, LAMP, LIGHTS, SHIPS, CQD_POS, WRECK_1912, horizon, settings, attach, step, readouts, valid,
    call, rocket, lamp, etaOf, clockText, tNY, tCarp, tCal };
});
