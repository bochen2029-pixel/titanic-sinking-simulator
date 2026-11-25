// Her rooms at level 0 (core/readers/rooms.js, R1 of docs/BRAINSTORM_rooms_and_a_walk_through_her_v1_1_2026-11-20.md):
// the slabs of each of the core's spaces sum to it exactly, and their water to its water at every step (its pockets'
// with it, C.spaceWater: G7), all of them to her water (the readouts'); the library
// moves no fingerprint and is no reader (no state in the sim, none in the forecast's copy); the water on each deck
// through the 1912 night (the table below, tracked as out/rooms_tests.txt); what a call costs (a volatile line).
//   node tools/rooms_tests.js
'use strict';
const C = require('../core/core.js');
const N = require('../core/night.js');
const R = require('../core/readers/rooms.js');
const rows = []; let fails = 0;
function row(what, value, ref, ok) { rows.push(ok); if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + what.padEnd(92) + ' ' + String(value).padEnd(48) + ' ' + ref); }
const kt = (m3) => (m3 * C.RHO / 1000 / 1000).toFixed(2);   // thousand tonnes of sea water (RHO in kg/m3)

const ship = C.buildShip();
const t0 = process.hrtime.bigint();
const T = R.table(ship);
const tTable = Number(process.hrtime.bigint() - t0) / 1e6;
// 1. the table: the slabs of each space sum to its capacity
const sum = new Float64Array(C.NN), count = new Int32Array(C.NN);
for (const s of T.list) { sum[s.n] += s.vmax; count[s.n]++; }
let worstRel = 0, empty = 0;
for (let n = 0; n < C.NN; n++) { if (!count[n]) empty++; if (ship.nodeVmax[n] > 0) worstRel = Math.max(worstRel, Math.abs(sum[n] - ship.nodeVmax[n]) / ship.nodeVmax[n]); }
const floors = {}; for (const s of T.list) floors[s.floor] = (floors[s.floor] || 0) + 1;
row('the slabs: each of the core\'s 64 spaces cut at her decks (G and F below E deck; D, C, B, A, Boat above)', `${T.list.length} slabs (${Object.keys(floors).map(f => f + ' ' + floors[f]).join(', ')}); spaces with none: ${empty}`, 'every space has slabs', empty === 0 && T.list.length > 150);
row('  the slabs of each space sum to its capacity, the core\'s nodeVmax', `the worst space off by ${worstRel.toExponential(1)} of itself`, 'under 1e-12', worstRel < 1e-12);

// 2. the 1912 watch (her orders) to her foundering, the water shared out every 10 s of her time
const sim = N.create(ship, N.spec(1912), { auto: true, handover: 'flag' });
// a space's placed water: its own and its pockets' as far as each holds (G7: C.spaceWater less each pocket's over-fill,
// which stands for the sea's head over its top and has no place; the mainline's rule: count it, never place it), and
// the room its pockets add to its lowest slab, where rooms.js puts their water (a pocket of both sides half to each)
const share = (n, f) => { let c = 0; for (const k of sim.pockets || []) { if (k.side < 0) { if (n === k.node || n === k.node - 2) c += 0.5 * f(k); } else if (n === k.node) c += f(k); } return c; };
const water = (n) => (C.spaceWater ? C.spaceWater(sim, n) : sim.vol[n]) - share(n, k => Math.max(0, k.vol - k.cap));
const pocketCap = (n) => share(n, k => k.cap);
let worst = 0, calls = 0, tCalls = 0n, nextT = 0, over = 0, worstAll = 0, pocketsMax = 0, overMax = 0;
const timeline = [];
while (!sim.foundered) {
  N.step(sim);
  if (sim.night.k % 40 !== 0) continue;
  const a = process.hrtime.bigint(); const w = R.waterOf(sim); tCalls += process.hrtime.bigint() - a; calls++;
  let all = 0;
  for (let n = 0; n < C.NN; n++) {
    const ids = T.byNode[n];
    let s = 0;
    for (const id of ids) { s += w[id]; const cap = T.list[id].vmax + (id === ids[0] ? pocketCap(n) : 0); if (w[id] > cap * (1 + 1e-9) + 1e-6 && sim.vol[n] <= ship.nodeVmax[n]) over++; }
    all += s;
    const d = Math.abs(s - water(n)); if (d > worst) worst = d;
  }
  const ovf = R.overfill(sim).reduce((s, o) => s + o.m3, 0);
  const dAll = Math.abs(all + ovf - C.readouts(sim).waterM3); if (dAll > worstAll) worstAll = dAll;
  if (ovf > overMax) overMax = ovf;
  let pk = 0; for (const k of sim.pockets || []) pk += k.vol; if (pk > pocketsMax) pocketsMax = pk;
  if (sim.night.tTouch >= 0 && sim.t >= sim.night.tTouch + nextT) { timeline.push([sim.t - sim.night.tTouch, R.byDeck(sim)]); nextT += 600; }
}
timeline.push([sim.t - sim.night.tTouch, R.byDeck(sim)]);
row('the 1912 orders to her foundering: at every share-out (each 10 s) each space\'s slabs hold exactly its water, its pockets\' with it as far as each holds (C.spaceWater less over-fill)', `${calls} share-outs; the worst space off by ${worst.toExponential(1)} m3`, 'under 1e-6 m3', worst < 1e-6);
row('  and the slabs with the pockets\' over-fill (the sea\'s head over a full pocket\'s top: counted, not placed) are her water, the readouts\'', `the worst share-out off by ${worstAll.toExponential(1)} m3; the pockets held up to ${Math.round(pocketsMax)} m3, over-filled by up to ${overMax.toFixed(2)} m3`, 'under 1e-6 m3; the pockets held water', worstAll < 1e-6 && pocketsMax > 0);
row('  and no slab holds more than it can while its space is not over-full (a lowest slab: with its pockets\' capacity)', `${over} slabs over`, 'none', over === 0);

// 3. a library, not a reader: no state in the sim, none in the forecast's copy, no fingerprint moved
const bare = N.sink(N.create(C.buildShip(), N.spec(1912), { auto: true, handover: 'flag' }));
const fc = N.forecastOf ? N.forecastOf(sim) : {};
row('a library: the watch shared out every 10 s has the fingerprint and the state of one never shared out; no state of its own in the sim or the forecast\'s copy',
  `${N.fingerprint(sim)} at step ${sim.night.k}; rooms in the sim: ${'rooms' in sim}; in the forecast's copy: ${'rooms' in fc}`, `${N.fingerprint(bare)} at step ${bare.night.k}; false; false`,
  N.fingerprint(sim) === N.fingerprint(bare) && sim.night.k === bare.night.k && JSON.stringify(C.serialize(sim)) === JSON.stringify(C.serialize(bare)) && !('rooms' in sim) && !('rooms' in fc));

// the table: the water on each deck, minutes after the touch (thousand tonnes)
const DECKS = ['below G', 'G', 'F', 'E', 'D', 'C', 'B', 'A', 'Boat'];
console.log('\nThe 1912 orders: the water on each deck (thousand tonnes), by the minutes after the touch (the slabs whose floor is that deck; "below G": the holds and the boiler and engine rooms below G deck)');
console.log('  min  ' + DECKS.map(d => d.padStart(8)).join(''));
for (const [t, d] of timeline) console.log(String(Math.round(t / 60)).padStart(5) + '  ' + DECKS.map(k => kt(d[k] || 0).padStart(8)).join(''));
console.log('');
console.log(`~ cost: a share-out of every slab ${(Number(tCalls) / calls / 1000).toFixed(0)} us on average over ${calls}; the table built once in ${tTable.toFixed(0)} ms`);
console.log(fails ? `FAIL: ${fails} row(s)` : `PASS: all ${rows.length} rows`);
process.exit(fails ? 1 : 0);
