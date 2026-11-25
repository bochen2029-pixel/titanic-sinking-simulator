// e120 (the mainline, 2026-11-24, at the coordinator's yes of 00:15 to the stern work's question 1): the after watertight
// doors on the 1912 watch, as the record has them and as the model has them.
//
// The record [read: docs/research/RESEARCH_tanks_counterflooding_door_schedule_v1_2026-11-17.md, section 8, "medium"]:
// all twelve vertical doors closed at T 0 to 3; G, H, J and K raised by hand from about T 30 on the chief engineer's
// order, so that the engineers could reach the pumps and valves; O raised 2 ft at about T 30 to 35 to free the tunnel
// greaser; L, M, N and O raised fully at about T 60 to 65 to fetch the 10-in suction pipe; none closed again by hand as
// far as anyone knows; D, E and F stayed shut. A float under each room's floor released the doors when water stood 18 in
// to 2 ft over the tank top [read: the same note]. The stern work's digest has L to O open from about 12:45 (T 65).
// The model's 1912 watch keeps every door shut: Night.scriptOf carries no door order, and core/systems.js's engineers'
// rules open none.
//
// Three watches of the landed member C, each to its hand-over (the break's onset by default, G12, D98), then the same
// three to her flag (handover 'flag'):
//   0. as recorded: every door shut (the watch itself: 0ae90224 at step 37,792 to the onset);
//   a. the record's schedule as logged orders (Night.door): G, H, J and K raised at T+30, L, M, N and O at T+62. O's
//      2 ft at T+30 is not modelled (a door here is open or shut). The floats as the model has them: a raised door's
//      float stays armed, so it falls shut once water stands params.floatDepth over the floor on either side of it
//      (core.js, doorsStep);
//   b. the same schedule held open: each door's float disarmed in the run as the door is raised. Not an order: no order
//      on a watch can hold a door against its float (the Carpathia search's "outside the orders" rows do the same).
// Printed for each: her end (T, broke or foundered), the onset's time and station, the doors' state and every door
// event, the water in each room from the one the break cuts to her stern at the hand-over (m3 and full share), and her
// trim and list through her last hour.
//   node docs/research/experiments/e120_after_doors_1912.js > docs/research/experiments/results_2026-11-24/e120_after_doors_1912.txt
'use strict';
const C = require('../../../core/core.js');
const N = require('../../../core/night.js');
const ROOM = ['FP', 'H1', 'H2', 'H3', 'BR6', 'BR5', 'BR4', 'BR3', 'BR2', 'BR1', 'RE', 'TE', 'EL', 'T1', 'T2', 'AP'];
const bulk = (id) => { const b = C.BULKHEADS.findIndex(x => x.id === id); if (b < 0) throw new Error('no bulkhead ' + id); return b; };
const RAISE = [{ T: 30, ids: 'GHJK' }, { T: 62, ids: 'LMNO' }].map(r => ({ T: r.T, ids: r.ids, b: r.ids.split('').map(bulk) }));
const f1 = (x) => x.toFixed(1), f2 = (x) => x.toFixed(2);

function run(kind, handover) {
  const ship = C.buildShip(), sim = N.create(ship, N.spec(1912), { auto: true, handover });
  const pose = [];                                    // every minute after the touch: [T, trim, list]
  let next = 0, lastMin = -1;
  while (!N.over(sim) && sim.t < 6 * 3600) {
    N.step(sim);
    const tt = sim.night.tTouch;
    if (tt < 0) continue;
    const T = (sim.t - tt) / 60;
    while (kind !== '0' && next < RAISE.length && T >= RAISE[next].T) {
      for (const b of RAISE[next].b) { N.door(sim, b, true); if (kind === 'b') sim.doorFloat[b] = 0; }
      next++;
    }
    const m = Math.floor(T);
    if (m !== lastMin) { lastMin = m; const r = C.readouts(sim); pose.push([T, r.trimDeg, r.listDeg]); }
  }
  const tt = sim.night.tTouch, onset = sim.night.onset && sim.night.onset.found ? sim.night.onset.found : null;
  const endT = sim.foundered ? sim.founderT : (onset ? onset.t : sim.t);
  const r = C.readouts(sim);
  const rooms = [];
  for (let k = 0; k < 16; k++) {
    let v = 0, cap = 0;
    for (let sd = 0; sd < 2; sd++) for (let ly = 0; ly < 2; ly++) { const n = (k * 2 + sd) * 2 + ly; v += C.spaceWater(sim, n); cap += ship.nodeVmax[n]; }
    rooms.push({ k, name: ROOM[k], v, cap, xa: ship.zones[k].xa, xf: ship.zones[k].xf });
  }
  const doors = C.BULKHEADS.map((b, i) => ({ id: b.id, open: !!sim.doorOpen[i], float: !!sim.doorFloat[i] }));
  const events = sim.events.filter(e => /^(door|shut)[A-P]:/.test(e.id)).map(e => ({ T: (e.t - tt) / 60, label: e.label }));
  return { kind, handover, sim, tt, endT, T: (endT - tt) / 60, broke: !sim.foundered && !!onset, onset, k: sim.night.k, fp: N.fingerprint(sim),
    trim: r.trimDeg, list: r.listDeg, pumped: sim.pumped, rooms, doors, events, pose, log: sim.night.log.filter(o => o.type === 'door').length };
}

const KINDS = { '0': 'as recorded (every door shut)', a: 'the record\'s schedule, floats as modelled', b: 'the record\'s schedule, held open' };
const t0 = Date.now();
console.log('e120: the after watertight doors on the 1912 watch (member C, the landed model), ' + new Date().toISOString());
console.log('raised by hand (logged orders through Night.door): ' + RAISE.map(r => r.ids.split('').join(', ') + ' at T+' + r.T).join('; ') + '\n');
const res = {};
for (const ho of [undefined, 'flag']) for (const kind of ['0', 'a', 'b']) {
  const x = run(kind, ho); res[kind + (ho || '')] = x;
  const what = ho ? 'to her flag (handover \'flag\')' : 'to her hand-over (the default)';
  console.log('== ' + kind + '. ' + KINDS[kind] + ', ' + what);
  console.log('   her end T+' + f2(x.T) + ' (' + (x.broke ? 'she breaks: the onset' : (x.sim.foundered ? 'she founders: the flag' : 'neither, by T+360')) + '), step ' + x.k + ', fingerprint ' + x.fp + '; ' + x.log + ' door orders logged; pumped ' + Math.round(x.pumped * 1.025) + ' t');
  if (x.onset) console.log('   the onset: T+' + f2((x.onset.t - x.tt) / 60) + ' at x ' + f2(x.onset.x) + ' m' + (x.onset.sense ? ' (' + x.onset.sense + ')' : '') + (x.onset.what ? ', ' + x.onset.what : ''));
  console.log('   at her end: trim ' + f2(x.trim) + ' deg by the head, list ' + f2(x.list) + ' deg (+ starboard)');
  console.log('   doors open at her end: ' + (x.doors.filter(d => d.open).map(d => d.id + (d.float ? '' : ' (float disarmed)')).join(', ') || 'none'));
  for (const e of x.events.filter(e => e.T > 1)) console.log('   T+' + f2(e.T) + ' ' + e.label);
  const cut = x.onset ? x.onset.x : null;
  const aft = x.rooms.filter(q => cut === null ? q.k >= 8 : q.xa < cut);
  console.log('   water in the rooms from ' + (cut === null ? 'BR2' : 'the one the break cuts (x ' + f2(cut) + ')') + ' aft, at her end (m3, full share):');
  console.log('     ' + aft.map(q => q.name + ' ' + Math.round(q.v) + ' (' + (100 * q.v / q.cap).toFixed(0) + ' %)').join('; '));
  console.log('     all of them: ' + Math.round(aft.reduce((s, q) => s + q.v, 0)) + ' m3 of ' + Math.round(aft.reduce((s, q) => s + q.cap, 0)));
  const at = (dm) => { const T = x.T - dm; let best = null; for (const p of x.pose) if (p[0] <= T + 1e-9) best = p; return best; };
  console.log('   her last hour (trim by the head / list, deg): ' + [60, 45, 30, 15, 5, 0].map(dm => { const p = at(dm); return 'T+' + (p ? f1(p[0]) : '?') + ' ' + (p ? f2(p[1]) + ' / ' + f2(p[2]) : '?'); }).join('; '));
  console.log('');
}
const base = res['0'], bf = res['0flag'];
console.log('SUMMARY (member C)');
for (const kind of ['0', 'a', 'b']) {
  const x = res[kind], y = res[kind + 'flag'];
  console.log('  ' + kind + '. ' + KINDS[kind] + ': hand-over T+' + f2(x.T) + ' (' + (x.T - base.T >= 0 ? '+' : '') + f2(x.T - base.T) + ')' + (x.onset ? ' at x ' + f2(x.onset.x) : '') +
    '; her flag T+' + f2(y.T) + ' (' + (y.T - bf.T >= 0 ? '+' : '') + f2(y.T - bf.T) + ')');
}
console.log('(' + ((Date.now() - t0) / 1000).toFixed(0) + ' s)');
