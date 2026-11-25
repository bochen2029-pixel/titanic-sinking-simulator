// The ship's plant (core/systems.js): each dependency checked by making it fail, and the intact ship unchanged.
//   node tools/systems_tests.js          (about two minutes)
// MUST rows: the dependency holds (what fails, and what follows from it). CHECK rows: figures against the record.
const C = require('../core/core.js');
const Mo = require('../core/motion.js');
const N = require('../core/night.js');
const Sys = require('../core/systems.js');
const SC = require('../core/scenarios.js');
const ship = C.buildShip(), KN = Mo.KN, DEG = Math.PI / 180;
const rows = []; let fails = 0;
function row(kind, what, value, ref, ok) { rows.push([kind, what, value, ref, ok]); if (kind === 'MUST' && !ok) fails++; }
const f = (x, n) => (x === null || x === undefined ? 'n/a' : x.toFixed(n === undefined ? 1 : n));

// a ship under way on a calm sea, no ice near, with the plant; damage can be added
function underWay(order, opts) {
  opts = opts || {};
  const sim = C.createSim(ship, {}, { openings: opts.openings || [], coalListDeg: 0 });
  Mo.attach(sim, { order: order || 'full ahead' }); Sys.attach(sim, opts.plant);
  return sim;
}
function run(sim, secs, each) { const t1 = sim.t + secs; while (sim.t < t1 && !sim.foundered) { if (each) each(sim); Sys.step(sim); Mo.step(sim); } return sim; }
const hole = (k, area, z) => SC.zoneHole(k, area, z || 2.0, 'starboard');

// 1. the intact ship: the plant changes nothing, bit for bit; damaged, it changes things only once something has failed
{
  const orders = (s, k) => { if (k === 0) Mo.rudder(s, -40); if (k === 1200) { Mo.telegraph(s, 'half astern'); Mo.rudder(s, 25); } if (k === 2400) { Mo.telegraph(s, 'full ahead'); Mo.rudder(s, 0); } if (k === 3600) Mo.telegraph(s, 'slow ahead', 'port'); };
  const go = (plant) => { const s = C.createSim(ship, {}, { openings: [], coalListDeg: 2 }); Mo.attach(s, { order: 'full ahead' }); if (plant) Sys.attach(s); const h = require('crypto').createHash('sha256'); for (let k = 0; k < 4800; k++) { orders(s, k); if (plant) Sys.step(s); Mo.step(s); h.update(Buffer.from(new Float64Array([s.mo.u, s.mo.v, s.mo.r, s.mo.X, s.mo.Y, s.mo.psi, s.mo.del, s.mo.nP, s.mo.nC, s.zO, s.pitch, s.roll]).buffer)); } return h.digest('hex'); };
  const withP = go(true), without = go(false);
  row('MUST', 'intact, 20 min of turns, astern and ahead, one shaft alone: with the plant and without', withP.slice(0, 12), without.slice(0, 12) + ' (no plant): the same bits', withP === without);
  const a = N.create(ship, N.spec(1912), { auto: true }), b = N.create(ship, N.spec(1912), { auto: true, plant: false });
  let part = null; for (let k = 0; k < 6000 && part === null; k++) { N.step(a); N.step(b); if (a.mo.r !== b.mo.r || a.mo.u !== b.mo.u) part = [k + 1, a.mo.plant.rudImm]; }
  row('CHECK', 'the 1912 watch with and without the plant: where they part', part ? 'step ' + part[0] + ' (' + f(part[0] / 240, 1) + ' min): the rudder ' + f(100 * part[1], 3) + ' % under water' : 'never in 25 min', 'after the collision, once her rising stern lifts the top of her rudder', part === null || part[0] > 387);
  // the night's boilers must hold her service speed for good: 22.5 knots for an hour, intact, with the plant
  const s = C.createSim(ship, {}, { openings: [], coalListDeg: 2 }); Mo.attach(s, { knots: 22.5 }); Sys.attach(s);
  let pMin = 1, nMin = 1e9; for (let k = 0; k < 14400; k++) { Sys.step(s); Mo.step(s); pMin = Math.min(pMin, s.plant.p); nMin = Math.min(nMin, s.mo.plant.nMax[0]); }
  row('MUST', 'intact at 22.5 knots (' + f(s.mo.setP, 1) + ' rpm) for an hour: the boilers lit on the night hold her', 'pressure never below ' + f(pMin * 215, 1) + ' psi; the engines never limited below ' + f(nMin, 1) + ' rpm; ' + f(s.mo.u / KN, 2) + ' kn', 'working pressure throughout (her service maximum is 78 rpm)', pMin === 1 && nMin >= 80 && Math.abs(s.mo.u / KN - 22.5) < 0.01);
}
// 2. no way, no steering: a rudder needs water moving past it
{
  const sim = underWay('stop'); Mo.rudder(sim, 40); run(sim, 120);
  row('MUST', 'at rest, engines stopped, rudder hard over for two minutes: she does not turn', 'heading ' + f(sim.mo.psi / DEG, 6) + ' deg, rate ' + sim.mo.r.toExponential(1), '0: nothing drives water past the rudder', sim.mo.psi === 0 && sim.mo.r === 0);
  const rates = ['slow ahead', 'half ahead', 'full ahead'].map(o => { const s = underWay(o); Mo.rudder(s, -40); run(s, 300); return [o, Math.abs(s.mo.r) / DEG, Math.sqrt(s.mo.u * s.mo.u + s.mo.v * s.mo.v) / KN]; });
  row('MUST', 'hard over: the faster she goes, the faster she turns', rates.map(r => r[0].split(' ')[0] + ' ' + f(r[1], 2) + ' deg/s at ' + f(r[2], 1) + ' kn').join('; '), 'rate rising with speed (the turbine\'s race only at Half and Full)', rates[0][1] < rates[1][1] && rates[1][1] < rates[2][1]);
}
// 3. boiler rooms 6, 5 and 4 flooded at full speed: fires out, steam short, engines slower, she slows
{
  const sim = underWay('full ahead', { openings: [hole(4, 1.2), hole(5, 1.2), hole(6, 1.2)] });
  const u0 = sim.mo.u; run(sim, 25 * 60);
  const P = sim.plant, rpm = sim.mo.nP, kn = sim.mo.u / KN, out = P.out.reduce((a, v) => a + v, 0);
  const expectRpm = Sys.PLANT.nSteam * Math.cbrt((P.gen - Sys.PLANT.aux) / (1 - Sys.PLANT.aux));
  row('MUST', 'boiler rooms 6, 5, 4 flooded at Full ahead: their fires out, the steam short, the engines slow', out + ' rooms out; ' + f(P.p * 215, 0) + ' psi; ' + f(rpm, 1) + ' rpm; ' + f(kn, 1) + ' kn (from ' + f(u0 / KN, 1) + ')',
    'three rooms out; the engines settle where the steam made equals the steam used: about ' + f(expectRpm, 0) + ' rpm', out === 3 && rpm < 70 && Math.abs(rpm - expectRpm) < 4 && kn < 20);
}
// 4. the reciprocating engine room flooded: both engines stop; the turbine (on their exhaust) stops; she coasts; she still steers
{
  const sim = underWay('full ahead', { openings: [hole(10, 1.5, 1.5)] });
  let tRe = null; run(sim, 30 * 60, s => { if (tRe === null && s.plant.re) tRe = s.t; });
  const m = sim.mo, rud0 = m.del; Mo.rudder(sim, 40); run(sim, 8); const moved = m.del - rud0;
  row('MUST', 'reciprocating engine room flooded: both engines and the turbine stop; she coasts', tRe === null ? 'the room never flooded' : 'flooded at ' + f(tRe / 60, 1) + ' min; ' + f(m.nP, 1) + '/' + f(m.nS, 1) + ' rpm, turbine ' + f(m.nC, 0) + ' rpm, ' + f(m.u / KN, 1) + ' kn', 'engines and turbine at 0; speed falling', tRe !== null && m.nP === 0 && m.nS === 0 && m.nC < 5 && m.u < 7 * KN);
  row('MUST', '  ... and with steam still up her rudder still answers the wheel', 'rudder moved ' + f(moved / DEG, 1) + ' deg in 8 s', 'the steering engines run on the boilers, not the main engines', moved > 25 * DEG);
}
// 5. no steam at all: the fires drawn in every room; the pressure falls; the steering gear and the dynamos stop
{
  const sim = underWay('half ahead'); for (let k = 0; k < 6; k++) sim.plant.out[k] = 1;      // the fires drawn
  let tSteer = null, tDark = null; run(sim, 40 * 60, s => { const L = s.mo.plant; if (tSteer === null && !L.steer) tSteer = s.t; if (tDark === null && !s.plant.power) tDark = s.t; });
  const m = sim.mo, d0 = m.del; Mo.rudder(sim, -30); run(sim, 10);
  row('MUST', 'every fire drawn: the steam runs down; the engines stop, then the dynamos, then the steering gear', 'pressure ' + f(sim.plant.p * 215, 0) + ' psi; engines ' + f(m.nP, 1) + ' rpm; dark at ' + f(tDark / 60, 1) + ' min, steering lost at ' + f(tSteer / 60, 1) + ' min', 'all of them, in the order the pressure falls through their needs', tSteer !== null && tDark !== null && m.nP === 0 && tDark <= tSteer);
  row('MUST', '  ... and then the wheel moves nothing', 'rudder ' + f(d0 / DEG, 1) + ' -> ' + f(m.del / DEG, 1) + ' deg after a hard order', 'unchanged', m.del === d0);
}
// 5a. blowing off (Y1): the engines stopped with every fire lit; the safety valves lift, then the stokers bank the fires
{
  const sim = underWay('stop');
  let tQuiet = null, pMin = 1; run(sim, 75 * 60, s => { pMin = Math.min(pMin, s.plant.p); if (tQuiet === null && s.plant.events.banked !== undefined && s.plant.blow < 0.1) tQuiet = s.t; });
  const E = sim.plant.events;
  row('MUST', 'engines stopped, every fire lit: the safety valves lift at once; banked, the roar dies within the hour', 'lifting at ' + f(E.blowoff / 60, 1) + ' min; banking from ' + f(Sys.PLANT.bankDelay / 60, 0) + ' min; quiet at ' + f(tQuiet === null ? null : tQuiet / 60, 1) + ' min; pressure never under ' + f(pMin * 215, 0) + ' psi',
    '"blew off steam loudly through the first hour" (plant research note); steam kept up', E.blowoff !== undefined && E.blowoff < 1 && tQuiet !== null && tQuiet < 3600 && pMin === 1);
}
// 5b. the dark feeds back into the steam (Y5): the electric engine room flooded at Full ahead, every boiler room dry
{
  const sim = underWay('full ahead', { openings: [hole(12, 1.0, 1.5)] });
  let tDark = null, tSlow = null; run(sim, 30 * 60, s => { if (tDark === null && !s.plant.power) tDark = s.t; if (tDark !== null && tSlow === null && s.mo.plant.nMax[0] < 74.5) tSlow = s.t; });
  const P = sim.plant, m = sim.mo, expect = Sys.PLANT.nSteam * Math.cbrt((Sys.PLANT.natDraught - Sys.PLANT.aux) / (1 - Sys.PLANT.aux));
  row('MUST', 'the dynamo room flooded at Full ahead: the main sets stop and the fans with them; on natural draught she slows', (tDark === null ? 'the main sets never stop' : 'main dynamos lost at ' + f(tDark / 60, 1) + ' min') + '; steam made ' + f(100 * P.gen, 0) + ' %; ' + f(m.nP, 1) + ' rpm, ' + f(m.u / KN, 1) + ' kn' + (P.re || P.te ? '; an engine room flooded too' : ''),
    'every fire still lit; ' + f(100 * Sys.PLANT.natDraught, 0) + ' % of the steam [bet]; about ' + f(expect, 0) + ' rpm', tDark !== null && tSlow !== null && !P.re && !P.te && P.out.every(v => v === 0) && Math.abs(P.gen - Sys.PLANT.natDraught) < 1e-9 && Math.abs(m.nP - expect) < 3);
  row('MUST', '  ... and the emergency dynamos on D deck keep her emergency lights (Y4)', 'lights ' + f(100 * P.lights, 0) + ' % of all her light; emergency sets ' + (P.emergency ? 'running' : 'stopped'), Sys.PLANT.emergency.lights * 100 + ' % [bet]: not dark while there is steam and D deck is dry', P.lights === Sys.PLANT.emergency.lights && P.emergency && P.events.dark === undefined);
}
// 5c. G3 (NH15's design, its F3; the ruling at Sys.PLANT.emergency): the emergency sets' pipe had branches from boiler
// rooms 5, 3 and 2 and a cross-connection to any boiler, and the plant keeps one store of steam. Those three rooms' fires
// put out (P.out, as the sea does), the main sets' flat flooded, boiler rooms 6 and 4 still lit, the engines stopped: the
// emergency sets burn on, on the store's steam. Class C, splitting the store by room, would turn this row over
{
  const sim = underWay('stop'), P = sim.plant, R = Sys.PLANT.rooms, at = (name) => R.findIndex(r => r.name === name);
  for (const name of ['Boiler room 5', 'Boiler room 3', 'Boiler room 2']) P.out[at(name)] = 1;
  P.el = true;                                    // the main sets' flat flooded
  let pMin = 1; run(sim, 30 * 60, s => { pMin = Math.min(pMin, s.plant.p); });
  const lit = R.filter((r, k) => P.fires[k] > 0).map(r => r.name.replace('Boiler room ', '')).join(', ');
  row('MUST', 'G3: boiler rooms 5, 3 and 2 out, the main sets\' flat flooded, rooms 6 and 4 lit, the engines stopped: the emergency sets burn on', 'after 30 min: lights ' + f(100 * P.lights, 0) + ' % of all her light, emergency sets ' + (P.emergency ? 'running' : 'stopped') + '; pressure never under ' + f(pMin * Sys.PLANT.psi, 0) + ' psi; rooms still lit: ' + (lit || 'none'),
    Sys.PLANT.emergency.lights * 100 + ' %: their pipe at the store\'s pressure whichever rooms\' fires burn (the cross-connection [read])', P.emergency && !P.power && P.lights === Sys.PLANT.emergency.lights && P.events.dark === undefined && lit === '6, 4');
}
// 6. the screws out of the water: the 1912 run near its end (6 s before she founders: it was 157.1 min, pinned to the
// foundering before W6 moved it), the telegraph at Full ahead
{
  const end = (() => { const s = C.createSim(ship, {}, SC.PRESETS.titanic.build({})); while (!s.foundered && s.t < 5 * 3600) C.step(s); return s.founderT; })();
  const sim = C.createSim(ship, {}, SC.PRESETS.titanic.build({}));
  while (sim.t < end - 6 && !sim.foundered) C.step(sim);
  Mo.attach(sim, { order: 'full ahead' }); Sys.attach(sim); Sys.step(sim);
  const L = sim.mo.plant; Mo.accelerations(sim.mo, 0, 0, 0);
  const full = 0.659e6;
  row('MUST', 'the 1912 run at ' + f(sim.t / 60, 1) + ' min, her stern up ' + f(sim.pitch / DEG, 0) + ' deg: Full ahead pushes nothing', 'screws ' + L.imm.map(v => f(100 * v, 0) + ' %').join(' / ') + ' under water; wing thrust ' + f(sim.mo.TP / 1e3, 0) + ' kN', 'no thrust from a screw in the air (' + f(full / 1e3, 0) + ' kN at Full)', L.imm[0] < 0.05 && Math.abs(sim.mo.TP) < 0.05 * full);
}
// 6b. F1 (NH15's design, U0; the mainline's ruling 2026-11-23): the coal a step burns is the coal for the steam it
// raised, shared among the rooms by their fires' weight. On a ship stopped long enough for the stokers to bank the fires
// (their firing well under 1), every step's coal taken from the bunkers is min(gen, demand) x coalPerDayFull / 86,400
// x dt, no more (it was up to 1 / firing times that)
{
  const s = C.createSim(ship, {}, { openings: [], coalListDeg: 2 }); Mo.attach(s, { knots: 22.5 }); Sys.attach(s); Mo.telegraph(s, 'stop');
  const dt = s.params.dt, total = () => s.plant.coal.reduce((a, v) => a + v, 0);
  let worst = 0, minFiring = 1, burnt = 0;
  for (let k = 0; k < 2400 / dt; k++) {
    const c0 = total(); Sys.step(s); const taken = c0 - total(), want = Math.min(s.plant.gen, s.plant.demand) * Sys.PLANT.coalPerDayFull / 86400 * dt;
    worst = Math.max(worst, Math.abs(taken - want)); minFiring = Math.min(minFiring, s.plant.firing); burnt += taken;
    Mo.step(s);
  }
  row('MUST', 'F1: stopped and banked, every step\'s coal from the bunkers is the coal for the steam raised (the rooms\' shares sum to one)', 'the firing down to ' + f(minFiring, 3) + '; ' + f(burnt, 3) + ' t in 40 min; each step within ' + worst.toExponential(1) + ' t of its steam\'s coal', 'within 1e-12 t a step, with the fires banked (firing under 0.5)', worst < 1e-12 && minFiring < 0.5);
}

// 7. the lights: an outcome of the flooding (the dynamos), not a clock
{
  const darkAt = (key, tMax) => { const sim = C.createSim(ship, {}, SC.PRESETS[key].build({})); Sys.attach(sim); while (sim.t < tMax && !sim.foundered) { C.step(sim); Sys.step(sim); if (!sim.plant.power) return [sim.t, sim.plant.el ? 'the dynamos flooded' : (sim.plant.broken ? 'the steam mains broken' : 'no steam')]; } return null; };
  const d = darkAt('titanic', 4 * 3600), clock = d ? 23 * 60 + 40 + d[0] / 60 - 24 * 60 : null;
  const hm = (mins) => Math.floor(mins / 60) + ':' + String(Math.floor(mins % 60)).padStart(2, '0') + ':' + String(Math.round((mins * 60) % 60)).padStart(2, '0') + ' am';
  const LR = require('./lights_record.js');     // D90 (a): a MUST since the epoch's landing, its window in one place
  row('MUST', 'the 1912 damage: the ship goes dark', d ? hm(clock) + ' (' + d[1] + ')' : 'never', LR.said, d !== null && LR.read(d[0]).ok);
  const four = darkAt('four', 4 * 3600);
  row('MUST', 'four compartments open (she floats): the lights burn on', four ? 'dark at ' + f(four[0] / 60, 1) + ' min' : 'lit after 4 h', 'never dark', four === null);
}

// 8. the watertight doors (Y2): the bridge's switch needs current; the floats and the levers do not
{
  const LOWB = C.BULKHEADS.map((b, i) => i).filter(i => Sys.LOW[i]), ids = (list) => list.map(i => C.BULKHEADS[i].id).join(' ') || 'none';
  const openOnes = (sim) => LOWB.filter(i => sim.doorOpen[i]);
  // with current: opened by hand (the bridge's switch goes off), then dropped from the bridge
  {
    const sim = underWay('stop'); for (const i of LOWB) Sys.openDoor(sim, i);
    const done = Sys.bridgeDoors(sim); run(sim, 24); const at24 = openOnes(sim).length; run(sim, 2); const at26 = openOnes(sim).length;
    row('MUST', 'the doors at the tank top opened by hand, then the bridge\'s switch with current: they fall shut in ' + C.DEFAULT_PARAMS.doorFall + ' s', 'released ' + done + '; open at 24 s: ' + at24 + ' of ' + LOWB.length + '; at 26 s: ' + at26, 'all ' + LOWB.length + ' released at once (electromagnets), shut by gravity in 25-30 s (cataracts) [bet: 25]', done === true && at24 === LOWB.length && at26 === 0);
  }
  // without current: the dynamo flat flooded at Full ahead; the doors opened by hand (for the pumps, as on the night aft)
  {
    const sim = underWay('full ahead', { openings: [hole(12, 1.0, 1.5)] });
    run(sim, 30 * 60, s => { if (!s.plant.power && openOnes(s).length === 0 && s.plant.doorSwitch === false && !s.__opened) { for (const i of LOWB) Sys.openDoor(s, i); s.__opened = s.t; } });
    const done = Sys.bridgeDoors(sim); run(sim, 120);
    const shut = LOWB.filter(i => !sim.doorOpen[i]), fl = sim.events.filter(e => /released by their float/.test(e.label)), letter = (e) => e.label.replace(/^Watertight doors in bulkhead (\w).*$/, '$1');
    const first = fl.filter(e => fl.length && e.t === fl[0].t).map(letter), later = fl.filter(e => e.t !== fl[0].t).map(e => letter(e) + ' at ' + f((e.t - sim.__opened) / 60, 1) + ' min');
    const forward = LOWB.filter(i => C.BULKHEADS[i].dFP < C.BULKHEADS[11].dFP);      // D to L, forward of the electric engine room
    row('MUST', 'the dynamo flat flooded (dark), the doors opened by hand: the bridge\'s switch releases nothing', 'released ' + done + '; ' + (sim.plant.power ? 'power on!' : 'no current') + '; opened at ' + f(sim.__opened / 60, 1) + ' min', 'false: the magnets need current (the British Report, Electrical Installation)', done === false && !sim.plant.power && sim.__opened !== undefined);
    row('MUST', '  ... but the floats shut the doors into the flooded room at once, and the doors forward stay open', 'by their float at once: ' + first.join(' ') + (later.length ? '; later ' + later.join(', ') : '') + '; open forward: ' + ids(forward.filter(i => sim.doorOpen[i])),
      'M and N, the bulkheads of the electric engine room (zone 12); a room flooded through a falling door trips its own float; D to L open', first.join(' ') === 'M N' && forward.every(i => sim.doorOpen[i]) && shut.every(i => !forward.includes(i)));
    const k = LOWB[0]; Sys.closeDoor(sim, k); run(sim, C.DEFAULT_PARAMS.doorFall + 1);
    row('MUST', '  ... and a door\'s lever needs no current: ' + C.BULKHEADS[k].id + ' released by hand falls shut', 'bulkhead ' + C.BULKHEADS[k].id + ' ' + (sim.doorOpen[k] ? 'open' : 'shut') + ' ' + C.DEFAULT_PARAMS.doorFall + ' s later', 'shut', !sim.doorOpen[k]);
  }
  // doors a scenario holds open (Britannic's, jammed) are not armed: the run is the core's own, with the plant or without
  {
    const go = (plant) => { const s = C.createSim(ship, {}, SC.PRESETS.britannic.build({})); if (plant) Sys.attach(s); const h = require('crypto').createHash('sha256'); while (s.t < 1800 && !s.foundered) { C.step(s); if (plant) Sys.step(s); h.update(Buffer.from(s.vol.buffer)); } return { d: h.digest('hex'), open: C.BULKHEADS.filter((b, i) => s.doorOpen[i]).map(b => b.id).join(' ') }; };
    const a = go(true), b = go(false);
    row('MUST', 'Britannic\'s doors held open (D, E): unarmed, they stay open; the run with the plant has the core\'s bits', a.d.slice(0, 12) + ', open: ' + a.open, b.d.slice(0, 12) + ' (no plant), open: ' + b.open, a.d === b.d && a.open === 'D E' && b.open === 'D E');
  }
  // the 1912 damage, its doors shut from the start: nothing changes with the floats armed
  {
    const go = (plant) => { const s = C.createSim(ship, {}, SC.PRESETS.titanic.build({})); if (plant) Sys.attach(s); const h = require('crypto').createHash('sha256'); while (s.t < 3 * 3600 && !s.foundered) { C.step(s); if (plant) Sys.step(s); h.update(Buffer.from(s.vol.buffer)); } return { d: h.digest('hex'), t: s.founderT }; };
    const a = go(true), b = go(false);
    row('MUST', 'the 1912 damage (doors shut from the bridge at once): with the floats armed, the core\'s own run', a.d.slice(0, 12) + ', founders ' + f(a.t / 60, 2) + ' min', b.d.slice(0, 12) + ' (no plant), ' + f(b.t / 60, 2) + ' min', a.d === b.d && a.t === b.t);
  }
}

// 9. the pumps (Y3): steam bilge pumps against the inflow (docs/research/RESEARCH_pumps_bilge_ballast_v1_2026-11-17.md)
{
  const LTH = SC.LTH, depth = (s, k) => Math.max(...[0, 1].map(sd => { const n = C.nodeIndex(k, sd, 0); return s.vol[n] > 1e-6 ? s.level[n] - s.zmin[n] : 0; }));
  // the 1912 damage: the pumps as worked against none
  const sink = (noPumps) => { const s = C.createSim(ship, {}, SC.PRESETS.titanic.build({ noPumps })); while (!s.foundered && s.t < 5 * 3600) C.step(s); return s; };
  const p = sink(false), n = sink(true), d = (p.founderT - n.founderT) / 60, br5 = p.pumpSched.find(e => e.zone === 5);
  row('MUST', 'the 1912 damage with its pumps as worked (boiler room 5 from 10 min, 4 from 30): she floats longer, a little', 'founders ' + f(p.founderT / 60, 2) + ' min against ' + f(n.founderT / 60, 2) + ' (+' + f(d, 2) + '); ' + f(p.pumped * C.RHO / 1000, 0) + ' t pumped; boiler room 5\'s pump stops at ' + f(br5.tOff / 60, 1) + ' min',
    '2 to 11 min longer, about 5 (the pumps note, 3.3); "could not have ... prolonged her life to any appreciable extent" (the Court); boiler room 5 given up between T 50 and T 80 (the note: its plates dry until the bunker door burst at about 12:40, T 60; the men left at about T 60; it was 20 to 45 min before W6 put the bunker in)', d >= 2 && d <= 11 && br5.off && br5.tOff > 50 * 60 && br5.tOff < 80 * 60);
  // a leak a pump can master: boiler room 4 holed at 0.01 m2 (about 290 tons an hour) against 400 tons an hour
  const leak = (pumps, plant, secs, each) => {
    const s = C.createSim(ship, {}, { openings: [hole(6, 0.01, 1.0)], coalListDeg: 0, pumps });
    if (plant) { Sys.attach(s); if (each) each(s); }
    while (s.t < secs) { if (plant) Sys.step(s); C.step(s); }
    return s;
  };
  const PUMP = [{ zone: 6, room: 6, q: 400 * LTH, t0: 0, label: 'boiler room 4: 400 tons an hour' }];
  const kept = leak(PUMP, false, 3600), open = leak(undefined, false, 3600);
  row('MUST', 'a leak the pumps can master (boiler room 4, 0.01 m2 at the bilge): held at the strum', 'water ' + f(depth(kept, 6), 2) + ' m deep after an hour, ' + f(kept.pumped * C.RHO / 1000, 0) + ' t pumped; without the pump ' + f(depth(open, 6), 2) + ' m',
    'no deeper than the strum (' + C.DEFAULT_PARAMS.pumpStrum + ' m) and a little; without, the room filling', depth(kept, 6) < C.DEFAULT_PARAMS.pumpStrum + 0.05 && depth(open, 6) > 0.4);
  // the pumps run on steam: every fire drawn, the pressure falls through 80 and 30 psi and they slow, then stop
  const cold = leak(PUMP, true, 3 * 3600, s => Sys.drawFires(s, -1));
  row('MUST', '  ... every fire drawn: the steam falls away, the pumps stop and the room fills', 'pressure ' + f(cold.plant.p * Sys.PLANT.psi, 0) + ' psi, pumps at ' + f(100 * cold.pumpScale, 0) + ' % of their rate; water ' + f(depth(cold, 6), 2) + ' m deep after 3 h',
    'no pumping below ' + Sys.PLANT.pumpPsi[0] + ' psi [bet]; deeper than the strum', cold.pumpScale === 0 && depth(cold, 6) > C.DEFAULT_PARAMS.pumpStrum + 0.1);
  // under way, the engineers: boiler room 5 holed small at Stop; its own pump 5 min after the water, one led from a dry
  // room through the main 30 min after, to the room's suctions
  const sim = underWay('stop', { openings: [hole(5, 0.01, 1.0)] }); run(sim, 3600);
  const own = sim.pumpSched.filter(e => e.zone === 5 && e.room === 5), led = sim.pumpSched.filter(e => e.zone === 5 && e.room !== 5), tW = sim.plant.pumpT[5];
  row('MUST', 'under way, a small leak in boiler room 5: the engineers put its own pump on it, then one through the main', 'water at ' + f(tW / 60, 1) + ' min; its own ' + own.map(e => f(e.q / LTH, 0) + ' t/h from ' + f(e.t0 / 60, 1)).join(', ') + ' min; led ' + led.map(e => f(e.q / LTH, 0) + ' t/h from room ' + e.room + ' at ' + f(e.t0 / 60, 1)).join(', ') + ' min; water ' + f(depth(sim, 5), 2) + ' m after an hour',
    'its 250 at +5 min, 117 t/h (its suctions\' 367 less 250) from the nearest dry room at +30 min [bets]; held near the strum', own.length === 1 && Math.abs(own[0].t0 - tW - Sys.PLANT.pumpOwn) < 1 && led.length === 1 && Math.abs(led[0].q / LTH - 117) < 1e-6 && Math.abs(led[0].t0 - tW - Sys.PLANT.pumpLent) < 1 && depth(sim, 5) < C.DEFAULT_PARAMS.pumpStrum + 0.05);
  const intact = underWay('full ahead'); run(intact, 600);
  row('MUST', 'the intact ship under way: no pump is put to work', intact.pumpSched.length + ' pumps scheduled', 'none', intact.pumpSched.length === 0);
}

// 10. the pumps, the player's part (Y6): orders to the pumps on a watch (Night.pump, core/systems.js pumpOrder), logged,
// refused with their reason, replayed bit for bit; the forecast made after an order is the watch run on
{
  const LTH = SC.LTH, PL = Sys.PLANT, sp = N.spec(1912);
  const after = (sim, secs) => { while (!sim.foundered && (sim.night.tTouch < 0 || sim.t < sim.night.tTouch + secs)) N.step(sim); return sim; };
  const sched = (s) => JSON.stringify(s.pumpSched.map(e => [e.zone, e.room, e.q, e.t0, e.off, e.tOff, !!e.taken]));
  const last = (s) => s.night.log[s.night.log.length - 1];
  // no order: the 1912 watch on its orders with the engineers' pumps, sunk, has the bits it had before Y6 (frozen from
  // 126f70a, Y6's base, at the end of her sinking; refrozen on purpose with M7, the stopped screws' drag: she runs on
  // 4.3 nm after the touch instead of 6.8, so the sea's pressure at her openings (P5) falls sooner, and she founders 2.25 s
  // later. Before M7: { fp: '9546a25c', k: 37970, founderT: 9492.5, pumped: 262.37128303961066 }. Refrozen on purpose
  // again with S1, 2026-11-19: the tiers above B deck, their windows and the grand staircases, and the flow parameters
  // refitted with them: she founders 30.25 s later. Before S1: { fp: '3810e155', k: 37979, founderT: 9494.75, pumped:
  // 262.9573926211077 }. Refrozen on purpose again with C3, 2026-11-20: the step conserves the water (a space never
  // gives more than it holds), which cuts a few of her last minutes' flows: she founders 0.25 s sooner. Before C3:
  // { fp: '611be326', k: 38100, founderT: 9525, pumped: 257.9363986783767 }). Refrozen on purpose again with G6, G6b
  // and W6, 2026-11-20 (join 6): boiler room 5 holed only inside its bunker, which holds the stokehold dry for its pump
  // until it gives way (so the pumps lift nearly twice the water), the damage shared as Hackett and Bedford's, and the
  // area and flow numbers refitted (D73): she founders 42.75 s sooner. Before: { fp: 'ede5d1eb', k: 38099, founderT:
  // 9524.75, pumped: 257.34065253300207 }. Refrozen on purpose again with G7 and G11, 2026-11-21 (join 7): the forepeak
  // held to its tank, the E-deck widths, the refit of rung 2b (the opening 0.8196 m2, aDown 0.2786, fOpen 0.02087):
  // she founders 115.25 s later, on the branch of G18 where the engineers lead pumps to boiler room 4 at about T 105
  // (a last-bit change can take the other branch, about 1.35 min sooner: BACKLOG G18). Before: { fp: 'b63a2b3e',
  // k: 37928, founderT: 9482, pumped: 488.72721640990324 }. The calibration epoch's B1 (the model's own pow, a change of
  // arithmetic: the code before it with C.pow preloaded gives these bits, docs/research/experiments/e107) moved it from
  // { fp: '1a1bd179', k: 38389, founderT: 9597.25, pumped: 669.7963243395852 }: 0.75 s sooner, on the same branch.
  // The calibration epoch's landing (D4; D90, 2026-11-23: every stage C switch on, the history match's candidate C, and
  // D89's trace kept) moved it from { fp: '5854a3e4', k: 38386, founderT: 9596.5, pumped: 669.92958425148 }: T 163.47
  // after the touch.
  // G12's switch (D98, Bo, 2026-11-23: "Yes, option (a)"): a watch hands over to the fall at the break's onset by default
  // (core/night.js), so the watch "sunk" ends there, T 156.46 after the touch; refrozen on purpose at the onset. The flag
  // that was BASE, { fp: '48b71712', k: 39473, founderT: 9868.25, pumped: 910.209426288034 }, is now the 'flag' what-if's,
  // held below to the bit (BASE_FLAG): the switch moves no step before the hand-over.
  // D112 (the stern's join): the engineers raise the after doors by hand on the 1912 night (core/systems.js,
  // DOORS_RAISED; the door note's section 8), their floats armed. The watch to its hand-over is the same to the bit
  // (BASE). Run on to her flag, the floats drop J to N in her last four minutes as the water comes aft, so the flag
  // what-if's bits move, 48b71712 -> 0fdcf0ad, at the same step, time and water pumped (e120 found the same)
  const BASE = { fp: '0ae90224', k: 37792, endT: 9448, pumped: 874.0225709902187 };
  const BASE_FLAG = { fp: '0fdcf0ad', k: 39473, founderT: 9868.25, pumped: 910.209426288034 };
  // a watch's end: her hand-over (the onset the night's own check found), or her flag where she founders first; a
  // forecast's result gives the same as overT
  const endT = (s) => (s.foundered ? s.founderT : (s.night.onset && s.night.onset.found ? s.night.onset.found.t : -1));
  // the same watch carries Y1b's two rows: stepped by hand until the roar after the order to stop has died, then sunk
  const plain = N.create(ship, sp, { auto: true }), y = { run: 0, bt: 0, tStop: -1, tLift: -1, tQuiet: -1 };
  while (!N.over(plain) && y.tQuiet < 0) {
    const touched = plain.night.tTouch >= 0; N.step(plain);
    const w = plain.night, b = plain.plant.blow;
    if (y.tStop < 0 && w.log.some(o => o.type === 'telegraph' && o.value === 'stop')) y.tStop = plain.t;
    if (y.tStop < 0) { y.run = Math.max(y.run, b); if (w.tBells >= 0 && !touched) y.bt = Math.max(y.bt, b); }
    else if (y.tLift < 0) { if (b > 0.02) y.tLift = plain.t; }
    else if (b <= 0.02) y.tQuiet = plain.t;
  }
  N.sink(plain);
  row('MUST', 'no pump order: the 1912 watch with the engineers\' pumps, to its hand-over at the break\'s onset (G12), is what it was before Y6', N.fingerprint(plain) + ' at step ' + plain.night.k + '; handed over at ' + f(endT(plain), 2) + ' s (T ' + f((endT(plain) - plain.night.tTouch) / 60, 2) + '); ' + f(plain.pumped, 3) + ' m3 pumped',
    BASE.fp + ' at step ' + BASE.k + '; ' + f(BASE.endT, 2) + ' s; ' + f(BASE.pumped, 3) + ' m3 (126f70a, refrozen with M7, S1, C3, join 6, G7, the epoch\'s B1 and its landing, and at the onset with G12\'s switch)', N.fingerprint(plain) === BASE.fp && plain.night.k === BASE.k && endT(plain) === BASE.endT && plain.pumped === BASE.pumped && N.over(plain) && !plain.foundered);
  // D112: the engineers' doors on the 1912 night (core/systems.js DOORS_RAISED): raised by hand at T+30 and T+62, their
  // floats armed; at the hand-over G and H are shut by their own floats and J to O stand open, the bridge's switch off.
  // The watch is the same to the bit (the row above)
  {
    const P = plain.plant, T = (t) => f((t - plain.night.tTouch) / 60, 2);
    const openAt = C.BULKHEADS.map((b, i) => (plain.doorOpen[i] ? b.id : '')).join('');
    const armed = C.BULKHEADS.every((b, i) => !plain.doorOpen[i] || plain.doorFloat[i] === 1);
    row('MUST', 'D112: on the 1912 watch the engineers raise G to K at T+30 and L to O at T+62 by hand (the record\'s schedule, floats armed); at the hand-over G and H are shut by their floats and J to O stand open',
      P.raised.map(r => r.id + ' T+' + T(r.t)).join(', ') + '; open at the hand-over ' + (openAt || 'none') + (armed ? ', every float armed' : ', A FLOAT DISARMED') + '; the bridge\'s switch ' + (P.doorSwitch ? 'on' : 'off'),
      'G to K at T+30.00, L to O at T+62.00; open JKLMNO, floats armed; switch off (the door note, section 8; e120)',
      P.raised.map(r => r.id).join('') === 'GHJKLMNO' && P.raised.slice(0, 4).every(r => T(r.t) === '30.00') && P.raised.slice(4).every(r => T(r.t) === '62.00') && openAt === 'JKLMNO' && armed && !P.doorSwitch);
  }
  // the 'flag' what-if (handover 'flag'): the watch before the switch, to her foundering, to the bit; sunk as N.sink does
  // it, step by step, so that G3's row reads the step each set of dynamos stops (the plant's last minute, the 20-degree
  // rule, comes after the onset: it is the flag's)
  const flagW = N.create(ship, sp, { auto: true, handover: 'flag' });
  const g3 = { power: -1, emergency: -1, broken: -1, emFirst: false };
  while (!N.over(flagW) && flagW.t < 8 * 3600) {
    N.step(flagW); const P = flagW.plant, k = flagW.night.k;
    if (P.power && !P.emergency) g3.emFirst = true;
    if (g3.power < 0 && !P.power) g3.power = k;
    if (g3.emergency < 0 && !P.emergency) g3.emergency = k;
    if (g3.broken < 0 && P.broken) g3.broken = k;
    if (flagW.t > 4 * 3600 && Math.abs(flagW.inflow) < 0.02 && Math.abs(flagW.wth) < 1e-5) break;
  }
  row('MUST', '  ... and the \'flag\' what-if, sunk to her foundering: her flag at the step, time and water pumped of the watch before the switch; its bits D112\'s (the floats drop J to N in her last minutes)', N.fingerprint(flagW) + ' at step ' + flagW.night.k + '; founders at ' + f(flagW.founderT, 2) + ' s; ' + f(flagW.pumped, 3) + ' m3 pumped',
    BASE_FLAG.fp + ' at step ' + BASE_FLAG.k + '; ' + f(BASE_FLAG.founderT, 2) + ' s; ' + f(BASE_FLAG.pumped, 3) + ' m3 (BASE until G12\'s switch)', N.fingerprint(flagW) === BASE_FLAG.fp && flagW.night.k === BASE_FLAG.k && flagW.founderT === BASE_FLAG.founderT && flagW.pumped === BASE_FLAG.pumped && !flagW.night.handover);
  const Tk = (k) => f((k * flagW.params.dt - flagW.night.tTouch) / 60, 2);
  row('MUST', 'G3: on the 1912 watch to her foundering (the \'flag\' what-if) the emergency sets run while the main sets do, and the break stops both on the same step','the mains broken at T ' + Tk(g3.broken) + '; the main sets stopped at step ' + g3.power + ' (T ' + Tk(g3.power) + '), the emergency sets at step ' + g3.emergency + (g3.emFirst ? '; the emergency sets stopped first' : ''),
    'the same step, after the break: one store of steam, and their pipe from boiler rooms 5, 3 and 2 crosses boiler room 1, where she breaks [derived]', g3.broken > 0 && g3.power >= g3.broken && g3.power === g3.emergency && !g3.emFirst);
  // G18 (the calibration epoch's C2; the design's section 6, as the mainline revised it): the engineers' lead through
  // the main is judged once, when the room's own pumps start, by its mean inflow against what the pumps could take,
  // and graded by that ratio (PLANT.leadRule 1, on since the epoch's landing; 0 is the one-shot rule before it). The 1912
  // watch at the encounter's area constant alpha (1 + e): under the old rule a last-bit change could take the other
  // branch (about 1.35 min); under the graded rule her founder must not step. G18's own "done when" (BACKLOG; D90's
  // screen, the coordinator 2026-11-23): every founder of the eleven, and of the watch with the lead forced each way,
  // within the history match's band, 150 to 170 min after the touch, with the spread printed.
  {
    const E = require('../core/encounter.js'), v8 = require('v8');
    const ES = [-1e-4, -1e-6, -1e-8, -1e-10, -1e-12, 0, 1e-12, 1e-10, 1e-8, 1e-6, 1e-4], a0 = E.ICE.alpha, rule0 = PL.leadRule;
    const ledOn = (s, k) => s.pumpSched.filter(p => p.zone === k && p.room !== k);
    const watch = (e, rule) => {
      E.ICE.alpha = a0 * (1 + e); PL.leadRule = rule;
      try {
        const s = N.sink(N.create(ship, sp, { auto: true, readers: false, handover: 'flag' }));   // G18 measures the founder: the flag's
        return { e, T: s.foundered ? (s.founderT - s.night.tTouch) / 60 : Infinity, founderT: s.founderT, fp: N.fingerprint(s), k: s.night.k, pumped: s.pumped, led4: ledOn(s, 6).length };
      } finally { E.ICE.alpha = a0; PL.leadRule = rule0; }
    };
    const es = (e) => (e === 0 ? '0' : (e > 0 ? '+' : '') + e.toExponential(0));
    const on = ES.map(e => watch(e, 1)), off = ES.map(e => watch(e, 0)), b1 = on[5], b0 = off[5];
    const near = on.filter(r => Math.abs(r.e) <= 1e-6), worst = Math.max(...near.map(r => Math.abs(r.T - b1.T)));
    row('MUST', 'G18, the graded lead (leadRule 1): the 1912 watch at alpha (1 + e), |e| up to 1e-6: her founder does not step', 'founders within ' + worst.toFixed(4) + ' min of e = 0\'s ' + f(b1.T, 2) + ' (' + near.length + ' watches)',
      'within 0.1 min (a last bit is worth about 0.06)', worst <= 0.1);
    // the lead forced each way at e = 0: off (no pumps led through the main: PLANT.pumpLent Infinity, as
    // tools/calibrate.js's watchFounders runs it) and on (PLANT.leadRatio 1e12: every room given the whole lead)
    const forced = (key, v) => { const k0 = PL[key]; PL[key] = v; try { return watch(0, 1); } finally { PL[key] = k0; } };
    const fOff = forced('pumpLent', Infinity), fOn = forced('leadRatio', 1e12), all13 = on.concat([fOff, fOn]);
    const lo = Math.min(...all13.map(r => r.T)), hi = Math.max(...all13.map(r => r.T));
    row('MUST', 'G18 closed: every founder of the eleven (e from -1e-4 to +1e-4) and of the lead forced off and on lies in the history match\'s band', f(lo, 2) + ' to ' + f(hi, 2) + ' min after the touch, the spread ' + f(hi - lo, 2) + ' min (the eleven ' + f(Math.min(...on.map(r => r.T)), 2) + ' to ' + f(Math.max(...on.map(r => r.T)), 2) + '; lead off ' + f(fOff.T, 2) + ', on ' + f(fOn.T, 2) + ')', '150 to 170 min (D90\'s screen; the band of D85 and the rerun)', all13.every(r => r.T >= 150 && r.T <= 170));
    row('CHECK', '  ... the eleven founders under the graded rule, min after the touch', on.map(r => es(r.e) + ': ' + f(r.T, 2)).join('; '), 'one branch', worst <= 0.1);
    // the same watch at e = 0 stepped by hand: how boiler rooms 6, 5, 4 and 3 are judged and what is led to them; and
    // the forecast made on the way (the copy through v8's serializer, as the page posts it) is the watch run on
    PL.leadRule = 1;
    try {
      const s = N.create(ship, sp, { auto: true, readers: false, handover: 'flag' }), fcs = [];   // G18's founder world: the flag's
      const posted = () => v8.deserialize(v8.serialize(N.forecastOf(s)));
      while (!N.over(s) && s.t < 8 * 3600) {
        const cleared = s.night.tClear >= 0; N.step(s);
        const T = s.night.tTouch, t = T < 0 ? -1 : (s.t - T) / 60;
        if (!cleared && s.night.tClear >= 0) fcs.push(['the end of the encounter', N.forecast(ship, posted())]);
        if (T >= 0 && fcs.length === 1 && t >= 45) fcs.push(['T 45', N.forecast(ship, posted())]);
        if (T >= 0 && fcs.length === 2 && t >= 120) fcs.push(['T 120', N.forecast(ship, posted())]);
      }
      const J = s.plant.pumpJudge, T0 = s.night.tTouch;
      const say = (k) => {
        const L = ledOn(s, k), name = C.ZONES[k].name.toLowerCase();
        if (!J || J.g[k] < 0) return name + ': not judged' + (s.plant.pumpT[k] < 0 ? ' (no water seen)' : ' (water at T ' + f((s.plant.pumpT[k] - T0) / 60, 2) + ')');
        return name + ': water at T ' + f((s.plant.pumpT[k] - T0) / 60, 2) + ', inflow ' + f(J.qin[k] / LTH, 0) + ' t/h against ' + f(J.qcap[k] / LTH, 0) + ', r ' + f(J.qin[k] / J.qcap[k], 3) + ', g ' + f(J.g[k], 3) + '; ' +
          (L.length ? 'led ' + f(L.reduce((a, p) => a + p.q / LTH, 0), 1) + ' t/h at T ' + f((L[0].t0 - T0) / 60, 2) + ' (to T ' + L.map(p => (p.off ? f((p.tOff - T0) / 60, 1) : 'the end')).join(', ') + ')' : 'none led');
      };
      row('CHECK', '  ... how the graded rule judges the boiler rooms at e = 0, and what it leads', [4, 5, 6, 7].map(say).join('. '),
        'all of the lead at r 1 or under, none at ' + PL.leadRatio + ' or over [bet]; boiler room 6 given up, boiler room 4 pumped (the night\'s record)', !!J && ledOn(s, 4).length === 0 && ledOn(s, 6).length > 0);
      row('MUST', '  ... the forecast under the graded rule (at the end of the encounter, at T 45, at T 120) is the watch run on', fcs.map(([w, fc]) => w + ': founders at ' + f(fc.founderT, 2) + ' s, step ' + fc.k).join('; ') + '; the watch ' + f(s.founderT, 2) + ' s, step ' + s.night.k + ', ' + N.fingerprint(s),
        'equal, bit for bit; the watch stepped by hand is the watch sunk (' + b1.fp + ')', fcs.length === 3 && fcs.every(([w, fc]) => fc.foundered && fc.founderT === s.founderT && fc.k === s.night.k) && N.fingerprint(s) === b1.fp && s.founderT === b1.founderT && s.pumped === b1.pumped);
    } finally { PL.leadRule = rule0; }
    row('CHECK', '  ... the graded rule at e = 0 is the watch as it is to her foundering (BASE_FLAG, the \'flag\' what-if); the one-shot rule before it, beside', b1.fp + ' at step ' + b1.k + '; founders at ' + f(b1.T, 2) + ' min; ' + f(b1.pumped, 3) + ' m3 pumped. The one-shot rule: ' + b0.fp + ', ' + f(b0.T, 2) + ' min',
      BASE_FLAG.fp + ' at step ' + BASE_FLAG.k + '; ' + f((BASE_FLAG.founderT - flagW.night.tTouch) / 60, 2) + ' min; ' + f(BASE_FLAG.pumped, 3) + ' m3', b1.fp === BASE_FLAG.fp && b1.k === BASE_FLAG.k);
    const worst0 = Math.max(...off.filter(r => Math.abs(r.e) <= 1e-6).map(r => Math.abs(r.T - b0.T)));
    row('CHECK', '  ... today\'s rule (leadRule 0) on the same eleven: the knife edge', off.map(r => es(r.e) + ': ' + f(r.T, 2) + (r.led4 ? '' : ' (4 not led)')).join('; '), 'steps of about 1.35 min for a last-bit change (BACKLOG G18): ' + f(worst0, 2) + ' min here', worst0 <= 0.1);
  }
  // Y1b, found by U3's smoke (tools/u3_smoke.js): at 22.5 knots (76.4 rpm) the plant blew off 0.058 of full steam from the
  // watch's first step, so the page jetted steam before any order. Under way at working pressure she now raises what she uses.
  // The roar after the order to stop is the plant's as before Y1b, to the bit (the pressure, the firing, the coal)
  const tT = (t) => f((t - plain.night.tTouch) / 60, 1);
  row('MUST', 'Y1b: at Full ahead on the 1912 watch the safety valves stay shut, from the bells to the touch and on to the order to stop', 'blow at most ' + y.bt.toFixed(4) + ' from the bells to the touch; at most ' + y.run.toFixed(4) + ' from the first step to the order to stop',
    'under 0.02 (the page\'s jets) at every step', y.bt < 0.02 && y.run < 0.02);
  // The quiet's band holds the model's own time, not the record's: T+86.6 at Y1b, T+77.4 since join 6 (G6, G6b, W6),
  // when boiler room 5's pump works on while the bunker holds and the pumps lift nearly twice the water.
  row('MUST', 'Y1b: the roar comes within a minute of the order to stop and lasts as it did, to about T+67 (T+77 before the epoch\'s landing)', y.tStop < 0 ? 'no order to stop' : 'stop at T ' + tT(y.tStop) + '; the valves lift ' + f(y.tLift - y.tStop, 2) + ' s after it (the event at T ' + tT(plain.plant.events.blowoff) + '); quiet (blow 0.02 or under) at T ' + tT(y.tQuiet),
    'within 60 s; quiet between T 59 and T 75 (T 70 to 86 before the epoch\'s landing, T 80 to 92 before join 6)', y.tStop >= 0 && y.tLift >= 0 && y.tLift - y.tStop <= 60 && y.tQuiet >= 0 && (y.tQuiet - plain.night.tTouch) / 60 >= 59 && (y.tQuiet - plain.night.tTouch) / 60 <= 75);
  // a watch with orders to the pumps, as a player might give them: 2 min after the touch every pump that can reach boiler
  // room 5 (its own is on it already, the engineers'), boiler room 2's pump on boiler room 4 before the water comes, the
  // forepeak's own pumps (refused: it has no suction); at 20 min boiler room 2's pump taken off; at 40 the pumps handed back
  {
    const played = (sim) => {
      const w = sim.night; if (w.tTouch < 0) return;
      const t = sim.t - w.tTouch;
      if (t >= 120 && !w.y1) { w.y1 = 1; N.pump(sim, 5, 'all'); N.pump(sim, 6, 4); N.pump(sim, 0, 'own'); }
      if (t >= 1200 && !w.y2) { w.y2 = 1; N.pump(sim, -1, 4); }
      if (t >= 2400 && !w.y3) { w.y3 = 1; N.pump(sim, -1, 'engineers'); }
    };
    const a = N.create(ship, sp, { auto: true });
    while (!N.over(a) && a.t < 5 * 3600) { played(a); N.step(a); }
    const log = JSON.parse(JSON.stringify(a.night.log)), po = log.filter(o => o.type === 'pump'), ref = po.filter(o => o.refused);
    const b = N.replay(ship, sp, log, a.night.k);
    row('MUST', 'orders to the pumps go in the watch\'s log, a refused one with its reason; the watch replays from the log bit for bit', po.length + ' pump orders (' + po.map(o => o.value + ':' + o.arg).join(' ') + '), refused: "' + (ref[0] ? ref[0].refused : '') + '"; replayed: ' + N.fingerprint(b) + ', handed over at ' + f(endT(b), 2) + ' s',
      'the played watch: ' + N.fingerprint(a) + ', ' + f(endT(a), 2) + ' s; the same pumps, the same tons pumped', po.length === 5 && ref.length === 1 && ref[0].value === 0 && /no bilge suction/.test(ref[0].refused) &&
      N.fingerprint(a) === N.fingerprint(b) && endT(a) === endT(b) && endT(a) > 0 && sched(a) === sched(b) && a.pumped === b.pumped && N.fingerprint(a) !== BASE.fp);
  }
  // an order takes effect after its delay: boiler room 4 holed small at Stop; before the water comes, its own pump (on it
  // PL.pumpOwn later) and boiler room 3's through the main (PL.pumpLent later, to what the room's suctions leave)
  {
    const s = underWay('stop', { openings: [hole(6, 0.01, 1.0)] }), lth = () => s.pump[6] / LTH;
    const deep = () => Math.max(...[0, 1].map(sd => { const n = C.nodeIndex(6, sd, 0); return s.vol[n] > 1e-6 ? s.level[n] - s.zmin[n] : 0; }));
    const r1 = Sys.pumpOrder(s, 6, 'own'), r2 = Sys.pumpOrder(s, 6, 3);
    run(s, PL.pumpOwn - 0.25); const q0 = lth(), p0 = s.pumped; run(s, 0.5); const q1 = lth();
    run(s, PL.pumpLent - PL.pumpOwn - 0.5); const q2 = lth(), p1 = s.pumped, d1 = deep(); run(s, 0.5); const q3 = lth();
    run(s, 3600 - s.t); const p2 = s.pumped, d2 = deep(), T = (v) => f(v * C.RHO / 1000, 1);
    row('MUST', 'an order takes effect after its delay: boiler room 4\'s own pump in ' + f(PL.pumpOwn / 60, 0) + ' min, boiler room 3\'s through the main in ' + f(PL.pumpLent / 60, 0) + ', to the room\'s suctions; the tons pumped follow',
      f(q0, 0) + ' -> ' + f(q1, 0) + ' t/h at ' + f(PL.pumpOwn / 60, 0) + ' min, ' + f(q2, 0) + ' -> ' + f(q3, 0) + ' at ' + f(PL.pumpLent / 60, 0) + '; pumped ' + T(p0) + ', ' + T(p1) + ', ' + T(p2) + ' t at 5, 30, 60 min; ' + f(d1, 2) + ' then ' + f(d2, 2) + ' m deep',
      '0 -> 150, 150 -> 345 (its suctions\' 345 less 150); nothing before 5 min; more an hour after; gaining on the leak', r1.ok && r2.ok && /195 tons an hour/.test(r2.text) && q0 === 0 && Math.abs(q1 - 150) < 1e-9 && Math.abs(q2 - 150) < 1e-9 && Math.abs(q3 - 345) < 1e-9 &&
      p0 === 0 && p1 > 0 && p2 - p1 > p1 - p0 && d2 < d1);
  }
  // refused with the reason, changing nothing: the holds once the firemen's passage has flooded; no free pump; no steam
  {
    const w = after(N.create(ship, sp, { auto: true }), 120);
    const free = [11, 10, 6, 7].map(k => N.pump(w, k, 'all')), nf = free[3];
    after(w, 600);
    const s0 = sched(w) + w.plant.pumpBridge + w.plant.doctrine, rp = N.pump(w, 2, 'all'), s1 = sched(w) + w.plant.pumpBridge + w.plant.doctrine, lp = last(w);
    row('MUST', 'an order that cannot be carried out is refused, logged with its reason, and changes nothing: the holds\' valves lost; no free pump', '"' + rp.why + '" (the passage flooded at ' + f((w.plant.passageT - w.night.tTouch) / 60, 1) + ' min); "' + nf.why + '" after ' + free.slice(0, 3).filter(r => r.ok).length + ' rooms took every free pump',
      'the passage holed about 5 min after the collision (the Report); the log says why; the pumps as they were', !rp.ok && /firemen's passage/.test(rp.why) && lp.type === 'pump' && lp.refused === rp.why && s0 === s1 && free.slice(0, 3).every(r => r.ok) && !nf.ok && /No free pump/.test(nf.why));
    const c = after(N.create(ship, sp, { auto: true }), 0); N.fires(c, -1);
    while (!N.over(c) && c.pumpScale > 0) N.step(c);
    const cs0 = sched(c), rc = N.pump(c, 7, 'own'), cs1 = sched(c);
    row('MUST', '  ... and no steam: every fire drawn at the touch, the pressure gone, the pumps cannot run', (N.over(c) ? 'she was handed over first' : f((c.t - c.night.tTouch) / 60, 1) + ' min after the touch, ' + f(c.plant.p * PL.psi, 0) + ' psi') + ': "' + rc.why + '"',
      'refused below ' + PL.pumpPsi[0] + ' psi [bet]', !N.over(c) && !rc.ok && /No steam/.test(rc.why) && last(c).refused === rc.why && cs0 === cs1);
  }
  // the forecast made after an order (core/night.js forecast) is the watch run on, to the bit. The copy of the watch goes
  // through v8's serializer, the structured clone the page's postMessage to its worker uses
  {
    const v8 = require('v8'), posted = (s) => v8.deserialize(v8.serialize(N.forecastOf(s)));
    const toCome = (s) => (s.night.script ? s.night.script.filter((o, i) => !s.night.did[i]).length : 0);
    const coreAlone = (s) => { const o = C.restore(ship, C.serialize(s)); C.run(o, { tMax: o.t + 6 * 3600, every: 30, stopWhenStable: true }); return o; };
    const w = after(N.create(ship, sp, { auto: true }), 180);
    const ra = N.pump(w, 6, 'all'), rb = N.pump(w, 5, 'all');
    for (let i = 0; i < 240; i++) N.step(w);
    const fc = N.forecast(ship, posted(w)), old = coreAlone(w);
    N.sink(w);
    // G12's switch: the forecast and the watch both end at the hand-over (the onset; her flag where she founders first)
    const min = (t) => f((t - w.night.tTouch) / 60, 2) + ' min';
    row('MUST', 'the forecast made after an order (every pump on boiler rooms 4 and 5, 3 min after the touch) is the watch run on, to its hand-over', 'forecast: hands over ' + min(fc.overT) + ' after the touch, step ' + fc.k + '; the watch ' + min(endT(w)) + ', step ' + w.night.k + ' (the core alone from a snapshot, as before Y6, to her flag: ' + min(old.founderT) + ')',
      'equal, bit for bit (one engine)', ra.ok && rb.ok && fc.over && N.over(w) && fc.overT === endT(w) && fc.k === w.night.k);
    const e = N.create(ship, sp, { auto: true }); while (e.night.tClear < 0) N.step(e);
    const ne = toCome(e), fce = N.forecast(ship, posted(e)), olde = coreAlone(e);
    row('MUST', '  ... and at the end of the encounter, the 1912 orders still to come (Stop a minute after the touch) and the engineers\' later orders', ne + ' scripted orders to come; forecast: hands over ' + min(fce.overT) + '; the watch ' + min(endT(plain)) + ' (the core alone, to her flag: ' + min(olde.founderT) + ')',
      'equal, bit for bit', ne > 0 && fce.over && fce.overT === endT(plain) && fce.k === plain.night.k);
    // a hole made by hand after the ice (the Damage tab's, which no log holds) goes with the copy
    const h = after(N.create(ship, sp, { auto: true }), 300); C.addOpening(h, hole(7, 0.05, 2.0));
    const fh = N.forecast(ship, posted(h)); N.sink(h);
    row('MUST', '  ... and a hole made by hand after the ice (boiler room 3, 0.05 m2: in no log) goes with it', 'forecast: hands over ' + min(fh.overT) + '; the watch ' + min(endT(h)) + ' (without the hole ' + min(endT(plain)) + ')',
      'equal, bit for bit; sooner than without it', fh.over && fh.overT === endT(h) && fh.k === h.night.k && endT(h) < endT(plain));
  }
}

for (const [kind, what, value, ref, ok] of rows) console.log((kind === 'MUST' ? (ok ? 'PASS ' : 'FAIL ') : (ok ? 'in   ' : 'OUT  ')) + what.padEnd(100) + ' ' + String(value).padEnd(70) + ' ' + ref);
console.log(fails ? '\nFAIL: ' + fails + ' MUST row(s)' : '\nPASS: every MUST row (' + rows.filter(r => r[0] === 'MUST').length + '); CHECK rows in range: ' + rows.filter(r => r[0] === 'CHECK' && r[4]).length + ' of ' + rows.filter(r => r[0] === 'CHECK').length);
process.exit(fails ? 1 : 0);
