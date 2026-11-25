// The calls for help (core/readers/world.js): the wireless, the rockets and the other ships, against the research note
// that specifies them (docs/research/RESEARCH_wireless_rockets_ships_clock_v1_2026-11-17.md, "the note"; its section 10).
//   node tools/world_tests.js [--jobs N]     (two or three minutes; the nights run in N threads, 4 by default)
// MUST rows: invariants, and the note's own arithmetic reproduced by the model. CHECK rows: figures against the record,
// each with its reference; out of range is reported, not failed.
'use strict';
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const C = require('../core/core.js');
const N = require('../core/night.js');
const World = require('../core/readers/world.js');
const NM = 1852, KN = NM / 3600, DEG = Math.PI / 180;
let shipCache = null; const theShip = () => shipCache || (shipCache = C.buildShip());

// ---------------------------------------------------------------- helpers (in the threads)
const Tn = (sim) => (sim.night.tTouch >= 0 ? (sim.t - sim.night.tTouch) / 60 : -1);
// G12's switch (D98): a watch ends at its hand-over, by default the break's onset, her flag where she founders first
// (core/night.js over); past it the model stands still and only the clock and the readers step, so every loop here stops
// on N.over, never on the flag alone
function until(sim, T) { while (!N.over(sim) && Tn(sim) < T - 1e-9) N.step(sim); return sim; }
function spec(seed, world) { const s = N.spec(seed); if (world) s.world = world; return s; }
const endOf = (sim) => (sim.foundered ? sim.founderT : (sim.night.onset && sim.night.onset.found ? sim.night.onset.found.t : -1));
function out(sim, extra) {
  const r = World.readouts(sim);
  return Object.assign({ r, lines: sim.world.lines, fp: N.fingerprint(sim), k: sim.night.k, log: sim.night.log,
    endT: N.over(sim) ? (endOf(sim) - sim.night.tTouch) / 60 : null, broke: N.over(sim) && !sim.foundered }, extra || {});
}
// Carpathia's place before she moves, and the 1912 wreck, both on this night's earth (the reader's own placing)
function places(sim) {
  const W = sim.world, cs = World.SHIPS[0], wx = W.X0 + World.WRECK_1912.X, wy = W.Y0 + World.WRECK_1912.Y;
  return { wx, wy, cx: wx + cs.d * NM * Math.cos(cs.brg * DEG), cy: wy + cs.d * NM * Math.sin(cs.brg * DEG), d: cs.d, brg: cs.brg };
}
// plain data only: numbers, strings, booleans, null, arrays, plain objects, typed arrays; the paths of anything else
function plainData(v, path, bad) {
  if (v === null || v === undefined || typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean') return bad;
  if (typeof v === 'function') { bad.push(path + ' (a function)'); return bad; }
  if (ArrayBuffer.isView(v)) return bad;
  if (Array.isArray(v)) { v.forEach((x, i) => plainData(x, path + '[' + i + ']', bad)); return bad; }
  if (typeof v !== 'object' || Object.getPrototypeOf(v) !== Object.prototype) { bad.push(path + ' (' + (v && v.constructor ? v.constructor.name : typeof v) + ')'); return bad; }
  for (const k of Object.keys(v)) plainData(v[k], path + '.' + k, bad);
  return bad;
}
const madeGood = (sim, P) => P.d - Math.sqrt((P.cx - sim.mo.X) * (P.cx - sim.mo.X) + (P.cy - sim.mo.Y) * (P.cy - sim.mo.Y)) / NM;
// The bridge takes her to the point `nm` miles nearer Carpathia's place than the 1912 wreck (on the line between them)
// and stops her there: the helm at twice the heading error, a new order no oftener than every 15 s; Half ahead while she
// points within 60 degrees of it and more than a mile is left, Slow ahead otherwise; Full astern once what lies ahead of
// her is under 150 s of her speed; Stop when her way is off. Every order through Night.helm and Night.telegraph.
function makeGood(sim, nm) {
  const P = places(sim), ux = Math.cos(P.brg * DEG), uy = Math.sin(P.brg * DEG), qx = P.wx + nm * NM * ux, qy = P.wy + nm * NM * uy;
  let lastHelm = -1e9, lastRud = 999, tel = null, phase = 'go', tStop = null;
  const ring = (o) => { if (tel !== o) { N.telegraph(sim, o); tel = o; } };
  const start = madeGood(sim, P);
  while (!N.over(sim) && phase !== 'stopped') {
    const m = sim.mo, dx = qx - m.X, dy = qy - m.Y, u = Math.sqrt(m.u * m.u + m.v * m.v);
    const err = ((Math.atan2(dy, dx) / DEG - m.psi / DEG) % 360 + 540) % 360 - 180;
    if (phase === 'go') {
      const rud = Math.max(-40, Math.min(40, Math.round(2 * err)));
      if (Math.abs(rud - lastRud) >= 5 && sim.t - lastHelm >= 15) { N.helm(sim, rud); lastRud = rud; lastHelm = sim.t; }
      ring(Math.sqrt(dx * dx + dy * dy) > NM && Math.abs(err) < 60 ? 'half ahead' : 'slow ahead');
      if (dx * Math.cos(m.psi) + dy * Math.sin(m.psi) < 150 * u && Math.abs(err) < 60) { phase = 'astern'; ring('full astern'); N.helm(sim, 0); }
    } else if (m.u < 0.15 * KN) { phase = 'stopped'; ring('stop'); tStop = Tn(sim); }
    N.step(sim);
  }
  return { P, start, tStop, atStop: madeGood(sim, P) };
}

// ---------------------------------------------------------------- the nights (each in a thread; plain data back)
const RUNS = {
  // the 1912 watch on its orders, with the reader and without it, side by side to her hand-over
  fed1912() {
    const ship = theShip(), a = N.create(ship, spec(1912), { auto: true }), b = N.create(ship, spec(1912), { auto: true, readers: false });
    let steps = 0, diff = -1, anchor = null;
    while (!N.over(a) && a.t < 4 * 3600) {
      N.step(a); N.step(b); steps++;
      if (diff < 0 && a.night.hash !== b.night.hash) diff = steps;
      if (!anchor && a.night.tTouch >= 0) anchor = { X: a.mo.X, Y: a.mo.Y };
    }
    return out(a, { steps, diff, bOver: N.over(b), fpB: N.fingerprint(b), bWorld: b.world === undefined, wreck: { X: a.mo.X - anchor.X, Y: a.mo.Y - anchor.Y } });
  },
  // a drawn night: seed 7, holed along her side (zones 0 to 2), with and without the reader, for three hours
  fedDrawn() {
    const ship = theShip(), a = N.create(ship, spec(7), {}), b = N.create(ship, spec(7), { readers: false });
    let steps = 0, diff = -1;
    while (!N.over(a) && a.t < 3 * 3600) { N.step(a); N.step(b); steps++; if (diff < 0 && a.night.hash !== b.night.hash) diff = steps; }
    return out(a, { steps, diff, fpB: N.fingerprint(b), openings: a.openings.length, kind: N.summary(a).kind });
  },
  // (a) the call made at once: CQD at T 5 instead of T 47
  callNow(arg) {
    const sim = N.create(theShip(), spec(1912, arg || null), { auto: true });
    until(sim, 5); const done = World.call(sim); N.sink(sim);
    return out(sim, { done });
  },
  // (b) five miles made good toward Carpathia after the 1912 call (from T 60, when she turns)
  goodAfter() {
    const sim = N.create(theShip(), spec(1912), { auto: true });
    until(sim, 60); const g = makeGood(sim, 5.0); N.sink(sim);
    return out(sim, { g: { start: g.start, tStop: g.tStop, atStop: g.atStop, end: madeGood(sim, g.P), from60: null } });
  },
  // both: the call at T 5 and five miles made good from T 10; then the watch replayed from its own log
  goodBoth() {
    const ship = theShip(), sp = spec(1912), sim = N.create(ship, sp, { auto: true });
    until(sim, 5); World.call(sim); until(sim, 10); const g = makeGood(sim, 5.0); N.sink(sim);
    const rp = N.replay(ship, sp, sim.night.log, sim.night.k);
    return out(sim, { g: { start: g.start, tStop: g.tStop, atStop: g.atStop, end: madeGood(sim, g.P) },
      replay: { fp: N.fingerprint(rp), lines: JSON.stringify(rp.world.lines) === JSON.stringify(sim.world.lines), ships: JSON.stringify(World.readouts(rp).ships) === JSON.stringify(World.readouts(sim).ships), n: rp.world.lines.length } });
  },
  // the set obeys the plant: no 1912 conduct; every fire drawn at the touch; the call ordered after the dynamos stop
  plant() {
    const sim = N.create(theShip(), spec(1912, { conduct: false }), { auto: true });
    while (sim.night.tTouch < 0) N.step(sim);
    N.fires(sim, -1);
    const reach = [];
    while (!N.over(sim) && sim.plant.power) { N.step(sim); const T = Tn(sim); if (Math.abs(T - Math.round(T)) < 0.002 && T >= 80) reach.push([Math.round(T), sim.world.set.reach]); }
    const tDark = Tn(sim), emergency = sim.plant.emergency;
    until(sim, tDark + 0.5); const tCall = Tn(sim); World.call(sim);
    const before = []; let tBattery = null, tFirst = null;
    while (!N.over(sim) && Tn(sim) < tCall + 12) {
      N.step(sim);
      const W = sim.world;
      if (tBattery === null && W.set.battery >= 0) tBattery = Tn(sim);
      if (tFirst === null && W.call.first >= 0) tFirst = Tn(sim);
      if (tBattery === null) for (const s of W.ships) if (s.state !== 'none') before.push(s.id);
    }
    return out(sim, { tDark, emergency, tCall, tBattery, tFirst, before, reach });
  },
  // F9 (NH15): the Morse lamp joined to the emergency circuit by a change-over switch. A what-if: the dynamo flat flooded
  // by hand at T 30, so the main sets stop and the emergency sets run on; the lamp is dark until a man throws the
  // change-over (SET.changeover), then lit on the emergency sets. Its order is refused in the dark and worked after
  lampChange() {
    const sim = N.create(theShip(), spec(1912, { conduct: false }), { auto: true });
    until(sim, 30); sim.plant.el = true;
    while (!N.over(sim) && sim.plant.events.mainDark === undefined && sim.plant.events.dark === undefined) N.step(sim);
    const t0 = sim.plant.events.mainDark, emergency = sim.plant.emergency, look = () => {
      const w0 = sim.world.lamp.worked, s = { lit: sim.world.lamp.lit, why: sim.world.lamp.why };
      World.lamp(sim); N.step(sim); s.worked = sim.world.lamp.worked > w0; return s;
    };
    while (!N.over(sim) && t0 !== undefined && sim.t < t0 + 60) N.step(sim);
    const dark = look();
    while (!N.over(sim) && t0 !== undefined && sim.t < t0 + 150) N.step(sim);
    const lit = look();
    return out(sim, { t0: t0 === undefined ? null : (t0 - sim.night.tTouch) / 60, emergency, dark, lit });
  },
  // seeing is not answering: Californian's distance and her watch
  cal(arg) { const sim = N.create(theShip(), spec(1912, arg), { auto: true }); N.sink(sim); return out(sim); },
  // every kind of order, then the watch replayed from its log: the same world line for line, the same fingerprint
  replayAll() {
    const ship = theShip(), sp = spec(1912), sim = N.create(ship, sp, { auto: true });
    const given = [];
    until(sim, 3); given.push(['help:call', World.call(sim)]);
    until(sim, 30); given.push(['help:rocket', World.rocket(sim)]);
    until(sim, 30.5); given.push(['help:rocket', World.rocket(sim)]);
    until(sim, 50); given.push(['help:lamp', World.lamp(sim)]);
    // a watch may be copied with structuredClone (the forecast does): the reader's state must be plain data, and the copy
    // must carry on as the original would. The replay below has no copy swapped in.
    until(sim, 60); const plain = plainData(sim.world, 'sim.world', []); sim.world = structuredClone(sim.world);
    until(sim, 140);
    const rp = N.replay(ship, sp, sim.night.log, sim.night.k);
    const bare = N.replay(ship, sp, sim.night.log.filter(o => !/^help:/.test(o.type)), sim.night.k, { readers: false });
    return out(sim, { given, plain, replay: { fp: N.fingerprint(rp), lines: JSON.stringify(rp.world.lines) === JSON.stringify(sim.world.lines), ships: JSON.stringify(World.readouts(rp).ships) === JSON.stringify(World.readouts(sim).ships), n: rp.world.lines.length }, bareFp: N.fingerprint(bare) });
  },
  // no touch: a drawn night that misses with no order (seed 3), and the 1912 berg missed (the wheel 6.5 s after the bells)
  noTouch() {
    const ship = theShip(), res = [];
    for (const [name, sp, o] of [['night 3, no order', spec(3), {}], ['1912, hard to port 6.5 s after the bells', spec(1912), { script: [{ when: 'bells', after: 6.5, type: 'helm', value: -40 }] }]]) {
      const sim = N.create(ship, sp, o);
      while (sim.t < 150 * 60) N.step(sim);
      const W = sim.world;
      res.push({ name, touch: sim.night.tTouch, kind: N.summary(sim).kind, order: W.call.order, first: W.call.first, rockets: W.rockets.fired, under: W.ships.filter(s => s.state !== 'none').length, lines: W.lines.length, anchored: W.anchored });
    }
    return res;
  },
  // the literal what-if (b): turned toward Carpathia at T 60 and Half ahead for 30 minutes, then Stop
  literalB() {
    const sim = N.create(theShip(), spec(1912), { auto: true });
    until(sim, 60); const P = places(sim), start = madeGood(sim, P);
    let lastHelm = -1e9, lastRud = 999;
    N.telegraph(sim, 'half ahead');
    while (!N.over(sim) && Tn(sim) < 90) {
      const m = sim.mo, err = ((Math.atan2(P.cy - m.Y, P.cx - m.X) / DEG - m.psi / DEG) % 360 + 540) % 360 - 180, rud = Math.max(-40, Math.min(40, Math.round(2 * err)));
      if (Math.abs(rud - lastRud) >= 5 && sim.t - lastHelm >= 15) { N.helm(sim, rud); lastRud = rud; lastHelm = sim.t; }
      N.step(sim);
    }
    const at90 = madeGood(sim, P), kn90 = Math.sqrt(sim.mo.u * sim.mo.u + sim.mo.v * sim.mo.v) / KN;
    N.telegraph(sim, 'stop'); N.helm(sim, 0); N.sink(sim);
    return out(sim, { start, at90, kn90, end: madeGood(sim, P) });
  },
};

if (!isMainThread) { parentPort.postMessage(RUNS[workerData.run](workerData.arg)); }
else {
  const ji = process.argv.indexOf('--jobs'), jobs = ji >= 0 ? Math.max(1, +process.argv[ji + 1] || 1) : 4;
  // [key, run, argument], the long ones first
  const todo = [['fed1912', 'fed1912'], ['goodBoth', 'goodBoth'], ['fedDrawn', 'fedDrawn'], ['goodAfter', 'goodAfter'], ['callNow', 'callNow'],
    ['callNow9', 'callNow', { californian: 9 }], ['clock150', 'cal', { clock: '1:50' }], ['callNow150', 'callNow', { clock: '1:50' }],
    ['cal9', 'cal', { californian: 9 }], ['cal9acts', 'cal', { californian: 9, acts: true }], ['cal18acts', 'cal', { acts: true }],
    ['literalB', 'literalB'], ['replayAll', 'replayAll'], ['plant', 'plant'], ['noTouch', 'noTouch'], ['lampChange', 'lampChange']];
  const got = {}, t0 = Date.now();
  const all = jobs === 1
    ? Promise.resolve().then(() => { for (const [key, run, arg] of todo) got[key] = RUNS[run](arg); })
    : new Promise((resolve, reject) => {
      const queue = todo.slice(); let busy = 0;
      const next = () => {
        if (!queue.length && !busy) return resolve();
        while (queue.length && busy < jobs) {
          const [key, run, arg] = queue.shift(); busy++;
          const w = new Worker(__filename, { workerData: { run, arg } });
          w.on('message', (v) => { got[key] = v; });
          w.on('error', reject);
          w.on('exit', () => { busy--; next(); });
        }
      };
      next();
    });
  all.then(() => report(got, Date.now() - t0)).catch((e) => { console.log('FAIL the suite could not finish: ' + (e && e.stack || e)); process.exit(1); });
}

// ---------------------------------------------------------------- the rows
function report(got, ms) {
  const rows = []; let fails = 0;
  const row = (kind, what, value, ref, ok) => { rows.push([kind, what, value, ref, ok]); if (kind === 'MUST' && !ok) fails++; };
  const f = (x, n) => (x === null || x === undefined ? 'n/a' : x.toFixed(n === undefined ? 1 : n));
  const ship = (g, id) => g.r.ships.find(s => s.id === id);
  const lineAt = (g, re) => { const l = g.lines.find(x => re.test(x.text)); return l ? l.T : null; };
  const near = (x, ref, tol) => x !== null && x !== undefined && Math.abs(x - ref) <= tol;
  // the note's own arithmetic (section 10.5): Carpathia's run of 46.5 nm at 13.6 kn
  const RUN = 46.5 / 13.6 * 60;

  // ---- 1. nothing fed back
  {
    const g = got.fed1912, cs = ship(g, 'carpathia');
    row('MUST', 'nothing fed back: the 1912 watch on its orders, every step\'s fingerprint with the reader and without it', g.steps + ' steps to her hand-over; ' + (g.diff < 0 ? 'none differs' : 'differs at step ' + g.diff) + '; ' + g.fp + ' / ' + g.fpB,
      'the same at every step (with it: the call made, ' + g.r.rockets.fired + ' rockets, Carpathia ' + cs.state + ')', g.diff === -1 && g.fp === g.fpB && g.steps > 30000 && g.bOver && g.bWorld && g.r.rockets.fired === 8 && g.r.call.firstT !== null);
    const d = got.fedDrawn;
    row('MUST', 'nothing fed back: drawn night 7 (' + d.kind + ' along her side, ' + d.openings + ' openings), three hours with the reader and without', d.steps + ' steps; ' + (d.diff < 0 ? 'none differs' : 'differs at step ' + d.diff) + '; ' + d.fp + ' / ' + d.fpB,
      'the same at every step (with it: the bridge\'s 1912 conduct, call at ' + f(d.r.call.firstT, 1) + ', ' + d.r.rockets.fired + ' rockets)', d.diff === -1 && d.fp === d.fpB && d.r.call.firstT !== null && d.r.rockets.fired === 8);
    row('MUST', 'the 1912 wreck where the reader places the other ships from (WRECK_1912), from her place at the touch', f(g.wreck.X, 1) + ' m N, ' + f(g.wreck.Y, 1) + ' m E; her end T ' + f(g.endT, 2) + (g.broke ? ' (the break\'s onset)' : ' (her flag)'),
      World.WRECK_1912.X + ' m N, ' + World.WRECK_1912.Y + ' m E [measured], within 50 m', Math.abs(g.wreck.X - World.WRECK_1912.X) < 50 && Math.abs(g.wreck.Y - World.WRECK_1912.Y) < 50);
  }
  // ---- 2. the 1912 watch, no order from the player
  {
    const g = got.fed1912, cs = ship(g, 'carpathia'), ca = ship(g, 'californian'), times = g.r.rockets.times, want = [66, 75, 84, 93, 102, 111, 119, 128];
    row('MUST', 'the 1912 watch, no order of the player\'s: Carpathia hears at 57 minutes', 'heard T ' + f(cs.heardT, 2) + ', under way T ' + f(cs.goT, 2), 'T 57 (10:35 NY: Cottam calls Titanic himself) [read]; under way T 60 [read: Halpern]', near(cs.heardT, 57, 0.1) && near(cs.goT, 60, 0.1));
    row('MUST', '  ... and is alongside at 265 (the note\'s model: within two minutes)', 'T ' + f(cs.etaT, 2) + ' (' + cs.eta + '), ' + f(cs.nm, 2) + ' nm to go at her end, T ' + f(g.endT, 2), 'T 265 = 57 + 3 + 205 (the note, 10.1); stopped T 265, boat No. 2 T 275 [read]', near(cs.etaT, 265, 2));
    row('MUST', '  ... Californian hears nothing', ca.state + '; heard ' + (ca.heardT === null ? 'never' : 'T ' + f(ca.heardT, 1)) + '; saw ' + ca.seen + ' rockets', 'her operator turned in at T 7 (11:35 her time); her watch saw eight and did not act [read]', ca.state === 'none' && ca.heardT === null && ca.seen === 8);
    row('MUST', '  ... and eight rockets go up at the note\'s times', times.map(t => f(t, 2)).join(', '), want.join(', ') + ' (the note, 10.4) [derived]', times.length === 8 && times.every((t, i) => Math.abs(t - want[i]) < 0.05));
    const silent = lineAt(g, /wireless is silent/);
    row('MUST', '  ... her set works on the main dynamos to her end, the sea in the wireless room or her hand-over, whichever is first, then falls silent; the battery is never thrown in', 'silent T ' + f(silent, 2) + ' (' + g.r.set.why + '); battery ' + g.r.set.battery + '; her end T ' + f(g.endT, 2),
      'at work until within a few minutes of the end, ending abruptly; the battery never used [read]; the model\'s room at x 50 m [bet]', silent !== null && silent <= g.endT && silent > 145 && g.r.set.battery === false && (g.r.set.room || (g.broke && silent === g.endT)));
  }
  // ---- 3. the note's what-ifs (section 10.5)
  {
    const a = got.callNow, cs = ship(a, 'carpathia');
    row('MUST', 'what-if (a), the call made at once (CQD at T 5): Carpathia at about 213', 'heard T ' + f(cs.heardT, 2) + ', under way T ' + f(cs.goT, 2) + ', alongside T ' + f(cs.etaT, 2), 'T 213 = 8 + 205 (the note, 10.5 a); within 3 min', a.done === true && near(cs.heardT, 5, 0.05) && near(cs.etaT, 8 + RUN, 3));
    const b = got.goodAfter, cb = ship(b, 'carpathia'), fb = 60 + (46.5 - b.g.end) / 13.6 * 60;
    row('MUST', 'what-if (b), five miles made good toward her after the 1912 call: Carpathia at about 243', 'made good ' + f(b.g.end, 2) + ' nm (' + f(b.g.start, 2) + ' at T 60, stopped T ' + f(b.g.tStop, 1) + '); alongside T ' + f(cb.etaT, 2) + '; her end T ' + f(b.endT, 2),
      'T 243 = 60 + (46.5 - 5) / 13.6 x 60 (the note, 10.5 b); within 3 min; the note\'s formula at the model\'s ' + f(b.g.end, 2) + ' nm: ' + f(fb, 2), near(cb.etaT, 60 + (46.5 - 5) / 13.6 * 60, 3) && near(cb.etaT, fb, 1));
    const c = got.goodBoth, cc = ship(c, 'carpathia'), fc = 8 + (46.5 - c.g.end) / 13.6 * 60;
    row('MUST', 'both: the call at T 5 and five miles made good from T 10: Carpathia at about 191', 'made good ' + f(c.g.end, 2) + ' nm (' + f(c.g.start, 2) + ' at T 10, stopped T ' + f(c.g.tStop, 1) + '); alongside T ' + f(cc.etaT, 2) + '; her end T ' + f(c.endT, 2),
      'T 191 = 8 + (46.5 - 5) / 13.6 x 60 (the note, 10.5 b); within 3 min; the formula at ' + f(c.g.end, 2) + ' nm: ' + f(fc, 2), near(cc.etaT, 8 + (46.5 - 5) / 13.6 * 60, 3) && near(cc.etaT, fc, 1));
    row('CHECK', '  where the model\'s own motion makes the difference: the 1912 watch runs on 4.2 nm after the touch', '(b) ' + f(b.g.start, 2) + ' nm already made good at T 60; both: ' + f(c.g.start, 2) + ' at T 10 (she is still short of the 1912 wreck)',
      'the note has her stopped where she struck: its 5 nm are all steamed', true);
    const L = got.literalB, cl = ship(L, 'carpathia');
    row('CHECK', 'what-if (b) as orders: turned toward Carpathia at T 60, Half ahead to T 90, then Stop', 'made good ' + f(L.start, 2) + ' -> ' + f(L.at90, 2) + ' at T 90 (' + f(L.kn90, 1) + ' kn) -> ' + f(L.end, 2) + ' nm; alongside T ' + f(cl.etaT, 1) + '; her end T ' + f(L.endT, 2),
      '10 kn for 30 min = 5.0 nm, T 243 (the note); its costs: the turn, the inflow at speed (P5)', cl.etaT !== null);
  }
  // ---- 4. the set obeys the plant
  {
    const p = got.plant, heard = p.r.ships.filter(s => s.state !== 'none'), unheard = p.r.ships.filter(s => s.state === 'none');
    const inside = heard.every(s => s.nmHeard !== null && s.nmHeard <= World.SET.battery);
    const at = (s) => s.name + ' ' + (s.state === 'none' ? 'not heard' : 'T ' + f(s.heardT, 2)) + ' (' + f(s.state === 'none' ? s.nm : s.nmHeard, 0) + ' nm)';
    const farHeard = heard.filter(s => s.nmHeard > World.SET.battery + 1e-9);
    row('MUST', 'the set obeys the plant: every fire drawn at the touch, the bridge\'s own conduct off; the dynamos stop', 'main and emergency dynamos stopped at T ' + f(p.tDark, 2) + ' (emergency ' + (p.emergency ? 'running' : 'stopped') + '); reach ' + p.reach.filter(x => x[0] % 5 === 0).map(x => x[0] + ':' + Math.round(x[1])).join(' ') + ' nm',
      'both buses on the one steam: dark at about 107 [measured: the plant]; reach 1,500 nm, falling with the voltage [bet: the note, 10.3]', p.tDark > 90 && p.tDark < 120 && !p.emergency && p.reach.length > 0);
    row('MUST', '  ... the call ordered after: not heard until the battery is thrown in, then only inside the battery\'s reach', 'ordered T ' + f(p.tCall, 2) + '; battery T ' + f(p.tBattery, 2) + '; first CQD T ' + f(p.tFirst, 2) + '; heard before it: ' + (p.before.length ? p.before.join(' ') : 'none') + '; ' + p.r.ships.map(at).join('; '),
      'battery 2 min after [bet]; heard only within ' + World.SET.battery + ' nm [bet] by an operator on watch (Carpathia\'s asleep from T 65)', p.before.length === 0 && near(p.tBattery, p.tCall + World.SET.changeover, 0.02) && near(p.tFirst, p.tBattery, 0.02) && heard.length > 0 && inside && farHeard.length === 0 && unheard.some(s => s.nm > World.SET.battery) && p.r.set.supply === 'battery' && p.r.set.reach === World.SET.battery);
    const q = got.lampChange, say = (s) => (s.lit ? 'lit' : 'dark') + ' (' + s.why + '), its order ' + (s.worked ? 'worked' : 'refused');
    row('MUST', 'F9: the Morse lamp on the emergency circuit by a change-over switch: the dynamo flat flooded by hand at T 30, the emergency sets running on',
      'main sets out at T ' + f(q.t0, 2) + ' (emergency sets ' + (q.emergency ? 'running' : 'STOPPED') + '); a minute after: ' + say(q.dark) + '; 2.5 min after: ' + say(q.lit),
      'dark until a man throws the change-over (' + World.SET.changeover + ' min [bet]), then lit on the emergency sets [read: the British Report]',
      q.t0 !== null && q.emergency && !q.dark.lit && !q.dark.worked && q.lit.lit && q.lit.worked && /change-over/.test(q.dark.why) && /emergency/.test(q.lit.why));
  }
  // ---- 5. seeing is not answering
  {
    const g9 = got.cal9, c9 = ship(g9, 'californian'), alongBefore = g9.r.ships.filter(s => s.alongsideT !== null && s.alongsideT < g9.endT);
    row('MUST', 'seeing is not answering: Californian at 9 nm, her watch not acting: eight rockets bring nobody', 'she saw ' + c9.seen + '; ' + c9.state + '; alongside before her end: ' + (alongBefore.length ? alongBefore.map(s => s.name).join(', ') : 'nobody'), 'in 1912 they saw eight and did not act [read]', c9.seen === 8 && c9.state === 'none' && alongBefore.length === 0);
    // the note's arithmetic from her first rocket, as this model fires them (the note, 10.4: the first at T 66)
    const ice = (d) => (d <= 10 ? 15 : 30), note = (T0, d) => T0 + 10 + ice(d) + (d - 1.5) / 13 * 60;
    const a9 = got.cal9acts, s9 = ship(a9, 'californian'), r9 = note(66, 9);
    row('MUST', '  ... her watch set to act on the first rocket, 9 nm: alongside at the note\'s arithmetic', 'acted T ' + f(s9.heardT, 2) + '; alongside T ' + f(s9.alongsideT !== null ? s9.alongsideT : s9.etaT, 2) + ' (her end T ' + f(a9.endT, 1) + ')',
      'T ' + f(r9, 1) + ' = 66 + 10 + 15 + 7.5 / 13 x 60 (the note\'s 10.5 from its own first rocket, 10.4); within 3 min', near(s9.heardT, 66, 0.05) && near(s9.alongsideT, r9, 3));
    const a18 = got.cal18acts, s18 = ship(a18, 'californian'), r18 = note(66, 18);
    row('MUST', '  ... and at 18 nm', 'acted T ' + f(s18.heardT, 2) + '; alongside T ' + f(s18.etaT, 2) + ' (after her end, T ' + f(a18.endT, 1) + ')', 'T ' + f(r18, 1) + ' = 66 + 10 + 30 + 16.5 / 13 x 60; within 3 min', near(s18.heardT, 66, 0.05) && near(s18.etaT, r18, 3));
    row('CHECK', '  the note\'s own minutes for these, 137 and 193, start from Californian\'s clock (12:45 her time = T 77 on the 12-minute offset)', 'model T ' + f(s9.alongsideT, 1) + ' and T ' + f(s18.etaT, 1) + ': 11 minutes sooner',
      'its rocket schedule (10.4) has the first at T 66; on equal clocks it gives T 65, so 125 and 181: the record\'s two clocks disagree by 11 minutes here', near(s9.alongsideT, 137, 3) && near(s18.etaT, 193, 3));
  }
  // ---- 6. orders logged; the watch replays from its log
  {
    const g = got.replayAll, n = g.log.filter(o => /^help:/.test(o.type)), types = n.map(o => o.type.slice(5)).join(' ');
    row('MUST', 'each order is logged: a call, two rockets and the lamp, given through core/night.js', types + ' (' + g.given.map(x => x[1]).join(' ') + '); rockets ' + g.r.rockets.times.map(t => f(t, 1)).join(', '),
      'call rocket rocket lamp, as given; the box fetched from aft first (10 min [bet]), the bridge\'s own rockets then stopped', types === 'call rocket rocket lamp' && n.every(o => World.valid(o.type, o.value, o.arg)) && g.given.every(x => x[1] === true) && near(g.r.rockets.times[0], 40, 0.02) && g.r.rockets.fired === 2);
    row('MUST', '  ... and the watch replays from its log to the same world, line for line, and the same fingerprint', 'lines ' + (g.replay.lines ? 'equal' : 'DIFFER') + ' (' + g.replay.n + '); ships ' + (g.replay.ships ? 'equal' : 'DIFFER') + '; ' + g.replay.fp + ' / ' + g.fp + '; without the reader and its orders ' + g.bareFp,
      'equal; and the model alone has the same fingerprint', g.replay.lines && g.replay.ships && g.replay.fp === g.fp && g.bareFp === g.fp);
    row('MUST', '  ... the reader\'s state is plain data, and a copy of it by structuredClone, swapped in at T 60, carries on to the same world', g.plain.length ? 'not plain: ' + g.plain.slice(0, 4).join(', ') : 'no function, no class instance; lines ' + (g.replay.lines ? 'equal' : 'DIFFER') + ' to the replay without the copy',
      'plain (a watch is copied so by the forecast); equal', g.plain.length === 0 && g.replay.lines && g.replay.ships);
    const b = got.goodBoth;
    row('MUST', '  ... the same for the watch with the call at once and ' + b.log.filter(o => !/^help:/.test(o.type)).length + ' orders to the wheel and the engines', 'lines ' + (b.replay.lines ? 'equal' : 'DIFFER') + ' (' + b.replay.n + '); ships ' + (b.replay.ships ? 'equal' : 'DIFFER') + '; ' + b.replay.fp + ' / ' + b.fp, 'equal', b.replay.lines && b.replay.ships && b.replay.fp === b.fp);
  }
  // ---- 7. no touch
  {
    const g = got.noTouch;
    row('MUST', 'a night with no touch: no calls, no rockets, no ship under way (150 min of each)', g.map(x => x.name + ': ' + x.kind + ', call ' + (x.order < 0 ? 'none' : 'T ' + f(x.order / 60, 1)) + ', rockets ' + x.rockets + ', under way ' + x.under + ', lines ' + x.lines).join('; '),
      'nothing', g.length === 2 && g.every(x => x.touch < 0 && x.order < 0 && x.first < 0 && x.rockets === 0 && x.under === 0 && x.lines === 0));
  }
  // ---- 8. CHECK: the message script on the 1912 watch against the note's table (10.2)
  {
    const g = got.fed1912, sh = (id) => ship(g, id), sent = g.r.call.sent;
    const sc = [
      ['25', 'the captain orders the call', g.r.call.orderedT, [24, 26]],
      ['47', 'CQD with the position; Mount Temple answers', g.r.call.firstT, [46, 48], 'Mount Temple heard T ' + f(sh('mountTemple').heardT, 1)],
      ['57', 'the corrected position; Carpathia answers', sent.position, [56, 58], 'Carpathia heard T ' + f(sh('carpathia').heardT, 1)],
      ['58', 'sinking; cannot hear for the noise of steam', sent.noise, [57, 59], (lineAt(g, /noise of steam/) !== null ? 'with' : 'without') + ' the steam (her safety valves at T 58)'],
      ['60', 'Carpathia: coming, expects to arrive in four hours', sh('carpathia').goT, [59, 61], 'she says ' + f((sh('carpathia').etaT - sh('carpathia').goT) / 60, 1) + ' h at the end'],
      ['70', 'Frankfurt answers', sh('frankfurt').heardT, [65, 75], 'the others listening throughout [bet: the note, 10.3]'],
      ['77', 'the first SOS', sent.sos, [76, 78]],
      ['82-92', 'Olympic answers; Baltic hears', sh('olympic').heardT, [80, 94], 'Baltic T ' + f(sh('baltic').heardT, 1)],
      ['102', 'get your boats ready; going down fast at the head', sent.head, [97, 107], 'when the second row of ports under her forecastle goes under (the core\'s mark; observed T 100)'],
      ['107', 'Frankfurt\'s captain will come; Virginian (through Cape Race)', sh('frankfurt').goT, [102, 112], 'Virginian heard T ' + f(sh('virginian').heardT, 1)],
      ['117-122', 'putting the women off in the boats', null, null, 'not modelled here (the boats)'],
      ['123-127', 'engine room flooded', sent.engine, [120, 130], 'when boiler room 3 is lost (the operators\' "engine room" was the boiler rooms [bet: the note])'],
      ['129', 'last acknowledgement heard by Mount Temple', null, null, 'not modelled'],
      ['137', 'come quickly: the engine room filling up to the boilers (Carpathia\'s last)', sent.come, [134, 140]],
      ['140', 'SOS, the Asian\'s last', null, null, 'not modelled (the Asian is not in the note\'s table)'],
      ['145', 'the captain releases the operators', sent.release, [140, 150], 'when her forecastle head goes under (the core\'s mark; observed T 145)'],
      ['145-158', 'the last calls while the power fails; Virginian\'s last at or before 158', lineAt(g, /wireless is silent/), [145, 158], 'the sea in the wireless room; the plant\'s pressure held to the break'],
    ];
    for (const [T, what, model, range, note] of sc) row('CHECK', 'the 1912 script, T ' + T + ': ' + what, model === null || model === undefined ? (range ? 'never' : 'n/a') : 'T ' + f(model, 1) + (note ? '; ' + note : ''), 'the note, 10.2' + (range ? ': T ' + T : ' (' + (note || '') + ')'), range ? near(model, (range[0] + range[1]) / 2, (range[1] - range[0]) / 2) : true);
    const far = [['mountTemple', null, 'stopped by ice T 241, about 14 nm short [read]'], ['frankfurt', 800, ''], ['birma', 500, ''], ['virginian', 680, ''], ['baltic', 930, ''], ['olympic', 1420, '']];
    for (const [id, ref, note] of far) {
      const s = sh(id);
      if (id === 'mountTemple') { const st = s.stoppedT !== null ? s.stoppedT : (s.goT + World.SHIPS[2].stopAfter / s.kn * 60); row('CHECK', 'the 1912 script: Mount Temple stopped by the ice', 'T ' + f(st, 1) + (s.stoppedT === null ? ' (after her end: from her run)' : ''), note, near(st, 241, 10)); continue; }
      row('CHECK', 'the 1912 night: ' + s.name + ' under way T ' + f(s.goT, 0) + ', expected', 'T ' + f(s.etaT, 0) + ' (' + s.eta + ')', 'about ' + ref + ' (the note, 10.1: from her 1912 hearing, later than the model\'s T 47)', near(s.etaT, ref, 0.12 * ref));
    }
  }
  // ---- 9. CHECK: both clocks, the same night with the British Report's offset beside the default
  {
    const A = got.fed1912, B = got.clock150, s = (g, id) => ship(g, id);
    const pair = (what, a, b, ref, ok) => row('CHECK', 'clocks, 2:02 | 1:50: ' + what, f(a, 2) + ' | ' + f(b, 2), ref, ok);
    pair('the first CQD', A.r.call.firstT, B.r.call.firstT, 'T 47 | T 35 (10:25 NY)', near(A.r.call.firstT, 47, 0.1) && near(B.r.call.firstT, 35, 0.1));
    pair('Carpathia hears', s(A, 'carpathia').heardT, s(B, 'carpathia').heardT, 'T 57 | T 45 (10:35 NY)', near(s(A, 'carpathia').heardT, 57, 0.1) && near(s(B, 'carpathia').heardT, 45, 0.1));
    pair('Carpathia under way', s(A, 'carpathia').goT, s(B, 'carpathia').goT, 'T 60 | T 55 (12:35 her time, NY + 1:57 | + 1:50)', near(s(A, 'carpathia').goT, 60, 0.1) && near(s(B, 'carpathia').goT, 55, 0.1));
    pair('Carpathia alongside', s(A, 'carpathia').etaT, s(B, 'carpathia').etaT, 'T 265 | T 260 (4:00 her time)', near(s(A, 'carpathia').etaT, 265, 2) && near(s(B, 'carpathia').etaT, 260, 2));
    pair('the rockets (her own witnesses: the same on both)', A.r.rockets.times[0], B.r.rockets.times[0], 'T 66 | T 66', near(B.r.rockets.times[0], 66, 0.05));
    const n150 = got.callNow150, n202 = got.callNow;
    pair('the call at once: Carpathia alongside', s(n202, 'carpathia').etaT, s(n150, 'carpathia').etaT, 'T 213 | T 220 (the note, 10.5 a: the 10 min that reading implies)', near(s(n202, 'carpathia').etaT, 213, 3) && near(s(n150, 'carpathia').etaT, 220, 3));
    row('CHECK', 'clocks, 2:02 | 1:50: the call at once: Californian\'s operator', (s(n202, 'californian').heardT === null ? 'asleep' : 'hears T ' + f(s(n202, 'californian').heardT, 1)) + ' | ' + (s(n150, 'californian').heardT === null ? 'asleep' : 'hears T ' + f(s(n150, 'californian').heardT, 1)),
      'on until T 7 | T -5: "on equal clocks he had already turned in" (the note, 10.5 a)', s(n202, 'californian').heardT !== null && s(n150, 'californian').heardT === null);
  }
  // ---- 10. CHECK: the call at once and Californian; her lights from Titanic's bridge
  {
    const a = got.callNow, a9 = got.callNow9, c18 = ship(a, 'californian'), c9 = ship(a9, 'californian');
    row('CHECK', 'the call at once: Californian hears it (her operator still on) and comes, 18 nm', 'heard T ' + f(c18.heardT, 1) + '; alongside T ' + f(c18.alongsideT, 1) + (c18.alongsideT !== null && c18.alongsideT < a.endT ? ', before her end' : ''), 'T 121 (106-151), the only ship to reach her afloat (the note, 10.5 a)', near(c18.alongsideT, 121, 15));
    row('CHECK', '  ... and at 9 nm', 'heard T ' + f(c9.heardT, 1) + '; alongside T ' + f(c9.alongsideT, 1), 'T 80 (65-110) with 30 min of ice; the model takes the Court\'s loose ice (15 min) at the Court\'s distance', near(c9.alongsideT, 80, 15));
    const cs = ship(a, 'carpathia'), seen = a.lines.find(l => l.who === 'carpathia' && l.kind === 'seen');
    row('CHECK', 'Carpathia\'s lights from Titanic\'s bridge (17 nm [bet]): on the 1912 night never before her end; with the call at once', (ship(got.fed1912, 'carpathia').inSight ? 'in sight' : 'not in sight') + ' at the 1912 end; with the call at once, in sight from T ' + f(seen ? seen.T : null, 1) + ', ' + f(cs.nm, 1) + ' nm at her end',
      'on the night she was 24 nm off when Titanic went [derived]', !ship(got.fed1912, 'carpathia').inSight && !!seen);
  }

  for (const [kind, what, value, ref, ok] of rows) console.log((kind === 'MUST' ? (ok ? 'PASS ' : 'FAIL ') : (ok ? 'in   ' : 'OUT  ')) + what.padEnd(118) + ' ' + String(value).padEnd(80) + ' ' + ref);
  console.log('\n(' + Math.round(ms / 1000) + ' s)');
  console.log(fails ? 'FAIL: ' + fails + ' MUST row(s)' : 'PASS: every MUST row (' + rows.filter(r => r[0] === 'MUST').length + '); CHECK rows in range: ' + rows.filter(r => r[0] === 'CHECK' && r[4]).length + ' of ' + rows.filter(r => r[0] === 'CHECK').length);
  process.exit(fails ? 1 : 0);
}
