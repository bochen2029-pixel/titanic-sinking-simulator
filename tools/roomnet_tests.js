// NH6 stage 1: her rooms as the flooding network (core/readers/roomnet.js; the design,
// docs/DESIGN_her_rooms_as_the_flooding_network_v1_2026-11-23.md, section 8), against R3's tables (data/rooms) and the
// 1912 damage preset.
//   node tools/roomnet_tests.js      (about a minute; writes out/roomnet_1912.txt through tools/outdir.js)
// MUST rows: the graph (every room on its own slab's column pieces, every column piece shared out whole, every room of a
// space reachable); a hand-worked space; the open-floor identity (every slab rooms.js's, every minute of the 1912
// preset); conservation to the space and to her water; neutral (the 1912 watch read by it has the fingerprint and the
// state of one never read); the library as the page bundles it.
// CHECK rows: what stage 1 moves against the open floor (slabs, the staterooms' rooms); the sill's bet; the table of
// the staterooms' rooms by deck (out/roomnet_1912.txt, tracked).
'use strict';
const fs = require('fs');
const path = require('path');
const C = require('../core/core.js');
const SC = require('../core/scenarios.js');
const N = require('../core/night.js');
const R = require('../core/readers/rooms.js');
const K = require('../core/readers/cabins.js');
const NET = require('../core/readers/roomnet.js');
const outFile = require('./outdir');

const lines = [], say = (s) => { lines.push(s === undefined ? '' : s); console.log(s === undefined ? '' : s); };
const musts = []; let fails = 0;
function must(what, value, ref, ok) { musts.push([what, value, ref, ok]); if (!ok) fails++; }
const checks = [];
function check(what, value, ref, ok) { checks.push([what, value, ref, ok]); }
const f = (x, n) => (x === null || x === undefined || Number.isNaN(x) ? 'n/a' : (+x).toFixed(n === undefined ? 2 : n));
const DIR = path.join(__dirname, '..', 'data', 'rooms');
const code = (z) => { const c = K.compartment(z); return (c.fwd || 'stem') + '-' + (c.aft || 'stern'); };

// ---------------------------------------------------------------- 1. the graph
const tables = fs.readdirSync(DIR).filter((x) => x.endsWith('.json')).sort().map((x) => JSON.parse(fs.readFileSync(path.join(DIR, x), 'utf8')));
const before = JSON.stringify(tables);
const I = K.index(tables);
const ship = C.buildShip(), T = R.table(ship);
const t0 = process.hrtime.bigint();
const G = NET.graph(I, ship);
const tGraph = Number(process.hrtime.bigint() - t0) / 1e6;
const GO = NET.graph(I, ship, { open: true }), G15 = NET.graph(I, ship, { sill: 0.15 }), G30 = NET.graph(I, ship, { sill: 0.3 });
{
  let wrongSlab = 0, worst = 0;
  const vol = new Float64Array(T.col.length);
  for (const r of G.rooms) for (let j = 0; j < r.q.length; j++) { if (T.slab[r.q[j]] !== r.slab) wrongSlab++; vol[r.q[j]] += r.f[j] * (r.hi[j] - r.lo[j]); }
  for (let q = 0; q < T.col.length; q++) worst = Math.max(worst, Math.abs(vol[q] - (T.hi[q] - T.lo[q])) / (T.hi[q] - T.lo[q]));
  let unreached = 0;
  for (let n = 0; n < C.NN; n++) {
    const adj = new Map(G.bySpace[n].map((k) => [k, []]));
    for (const j of G.edgesBySpace[n]) { const e = G.edges[j]; adj.get(e.a).push(e.b); adj.get(e.b).push(e.a); }
    const seen = new Set([G.bySpace[n][0]]), st = [G.bySpace[n][0]];
    while (st.length) { const u = st.pop(); for (const v of adj.get(u)) if (!seen.has(v)) { seen.add(v); st.push(v); } }
    unreached += G.bySpace[n].length - seen.size;
  }
  const kinds = {};
  for (const e of G.edges) kinds[e.kind] = (kinds[e.kind] || 0) + 1;
  must('the graph: every room\'s share on its own slab\'s column pieces; every column piece shared out whole among its rooms and its slab\'s rest; every room of a space reachable from its others',
    G.rooms.length + ' rooms (' + G.rooms.filter((r) => r.kind === 'row').length + ' row pieces, ' + G.rooms.filter((r) => r.kind === 'rest').length + ' rests); on another slab ' + wrongSlab + '; the worst piece off by ' + worst.toExponential(1) + ' of itself; unreached ' + unreached,
    'none; under 1e-12; none', wrongSlab === 0 && worst < 1e-12 && unreached === 0);
  check('the openings by kind (the design, section 4: stand-ins named), and what R3\'s rows leave to them',
    Object.entries(kinds).map(([k, v]) => k + ' ' + v).join(', ') + '; closed sets opened to their rest ' + G.edges.filter((e) => e.closed).length + '; column pieces R3\'s rows cover past their plan ' + G.overlapping,
    'every room reached by the plans\' openings or a named stand-in', true);
}

// ---------------------------------------------------------------- 2. a hand-worked space
// Three boxes at level trim (heights in the world, m): A, the lower deck, 10 m2 of plan from 0 to 2.5; C beside it, 6 m2
// from 0.1 to 2.5, behind a door whose sill is at 0.3; B over A, 10 m2 from 2.5 to 5.0, by a stair whose opening is A's
// deckhead, 2.5. The water starts in A (the lowest). Joining levels: A 0, C 0.3, B 2.5. By hand:
//   V 2:   A alone, 10 h = 2, h 0.2: A 2, C 0, B 0
//   V 3.6: A at C's sill holds 3.0; C takes the 0.6 left as a pool of its own, 6 (h' - 0.1) = 0.6, h' 0.2: A 3, C 0.6
//   V 10:  A and C together, 10 h + 6 (h - 0.1) = 10, h 0.6625: A 6.625, C 3.375
//   V 45:  A full (25) and C full (14.4) at 2.5, then B: 39.4 + 10 (h - 2.5) = 45, h 3.06: A 25, C 14.4, B 5.6
//   V 70:  all full (64.4); the 5.6 over the top on the highest room, B: A 25, C 14.4, B 30.6
// and the open floor (every sill open) at V 3.6: 10 h + 6 (h - 0.1) = 3.6, h 0.2625: A 2.625, C 0.975
{
  const box = (area, z0, z1) => ({ low: z0, top: z1, cap(h) { return h <= z0 ? [0, 0] : h >= z1 ? [area * (z1 - z0), 0] : [area * (h - z0), area]; } });
  const rooms = [box(10, 0, 2.5), box(6, 0.1, 2.5), box(10, 2.5, 5.0)];   // A, C, B
  const edges = [{ a: 0, b: 1, sill: 0.3 }, { a: 0, b: 2, sill: 2.5 }];
  const open = [{ a: 0, b: 1, sill: -Infinity }, { a: 0, b: 2, sill: -Infinity }];
  const cases = [[2, edges, [2, 0, 0]], [3.6, edges, [3, 0.6, 0]], [10, edges, [6.625, 3.375, 0]], [45, edges, [25, 14.4, 5.6]], [70, edges, [25, 14.4, 30.6]], [3.6, open, [2.625, 0.975, 0]]];
  let worst = 0;
  const got = cases.map(([V, E, want]) => { const r = NET.pour(rooms, E, V, 0); want.forEach((w, i) => { worst = Math.max(worst, Math.abs(r.water[i] - w)); }); return 'V ' + V + (E === open ? ' (open)' : '') + ': ' + Array.from(r.water).map((x) => f(x, 3)).join('/'); });
  must('a hand-worked space (three boxes: a lower deck A, a room C behind a 0.3 m sill, an upper deck B over a stair at 2.5; the cases worked by hand in this file): the water of A, C and B',
    got.join('; ') + '; the worst off ' + worst.toExponential(1) + ' m3', 'as worked by hand, within 1e-9 m3', worst < 1e-9);
}

// ---------------------------------------------------------------- 3. the 1912 damage preset
const P = SC.PRESETS.titanic, BASE = P.clock.h * 3600 + P.clock.m * 60;
const sim = C.createSim(ship, {}, P.build({}));
const trS = NET.track(G), trO = NET.track(GO), tr15 = NET.track(G15), tr30 = NET.track(G30);
const slab1 = T.list.map(() => null), slabO = T.list.map(() => null);
let k = 0, idWorst = 0, conWorst = 0, allWorst = 0, nMin = 0, cost = 0n, nCost = 0, at30 = null;
const SANDBOX = 30 * 60 * 4;
// The witnesses room by room (docs/research/RESEARCH_room_by_room_flooding_record_v1_2026-11-20.md, its own tags and
// confidence kept): each a room of R3's (a row's piece in a zone), a window of T (minutes after the touch), and what was
// seen: dry (under WET over its floor throughout), wet (wet by the window's end), or a depth over its deck at its place
// within [lo, hi] at some time in the window [the band: the words' reading, a bet]. CHECK rows, read under stage 1 and on
// the open floor alike; nothing is tuned to them.
const WIT = [
  { id: 'hemming_forepeak_store', who: 'Hemming BI 17713-33 [read]', what: 'the forepeak store dry while air hissed from the peak tank', row: 'O-001', zone: 0, t: [3, 8], want: 'dry' },
  { id: 'symons_no1_coaming', who: 'Symons BI 11375-418, Lee BI 2455-80 [read]', what: 'a foot of water round No. 1 hatch\'s coaming on G deck', row: 'G-006', zone: 1, t: [15, 25], want: 'depth', lo: 0.15, hi: 0.6 },
  { id: 'hemming_racquet_court', who: 'Hemming BI 17736-41 [read]', what: 'the racquet court making water', row: 'G-020', zone: 3, t: [5, 15], want: 'wet' },
  { id: 'boxhall_mail_room', who: 'Wheat BI 10910-21, Boxhall BI 15374-77 [read]', what: 'the water within 2 ft of G deck: the mail room under it flooded', row: 'O-010', zone: 3, t: [10, 20], want: 'wet' },
  { id: 'boxhall_post_office', who: 'Wheat BI 10910-21, Boxhall BI 15374-77 [read]', what: '... and the post office on G deck over it not yet', row: 'G-018', zone: 3, t: [10, 20], want: 'dry' },
  { id: 'boxhall_e_deck', who: 'Boxhall BI 15372-73 [read]', what: 'E deck crossed with no water (forward, by the third-class stairs)', row: 'E-025', zone: 3, t: [15, 20], want: 'dry' },
  { id: 'robinson_six_steps', who: 'Robinson BI 13277-81 [read]', what: 'the water six steps below E deck: over F deck in hold 3 by about 1.4 m [derived: six 8 in steps]', row: 'F-030', zone: 3, t: [28, 32], want: 'depth', lo: 0.8, hi: 2.0 },
  { id: 'poingdestre_seamen', who: 'Poingdestre BI 2844-72; the Report, 3 ft at T 40 [read]', what: 'the seamen\'s quarters on E deck waist-deep', row: 'E-015', zone: 2, t: [40, 45], want: 'depth', lo: 0.6, hi: 1.2 },
  { id: 'ray_e_deck_forward', who: 'Ray, US day 9 [read]', what: 'forward E deck under water on both sides, to the main stairway\'s door (starboard: crew room #9A)', row: 'E-028', zone: 3, t: [65, 75], want: 'wet' },
  { id: 'barrett_alleyway_br5', who: 'Barrett BI 2348-52 [read]', what: '"just a little" water in the alleyway over boiler room 5 (Scotland Road\'s straight run)', row: 'E-SR1', zone: 5, t: [60, 90], want: 'depth', lo: 0.01, hi: 0.3 },
];
for (const w of WIT) {
  w.k = NET.ofRow(G, w.row).filter((kk) => G.rooms[kk].zone === w.zone);
  w.s1 = []; w.so = [];
}
const witSample = (s1, so) => {
  for (const w of WIT) {
    const T0 = sim.t / 60;
    if (T0 < w.t[0] - 1e-9 || T0 > w.t[1] + 1e-9) continue;
    const read = (Gx, res, tr) => {   // over the row's pieces in its zone: the deepest, and whether any is wet
      let dep = 0, wet = false;
      for (const kk of w.k) { const d = NET.depthAt(Gx, res, kk, sim); if (d.depth > dep) dep = d.depth; if (res.water[kk] >= tr.thr[kk]) wet = true; }
      return { T: T0, dep, wet };
    };
    w.s1.push(read(G, s1, trS)); w.so.push(read(GO, so, trO));
  }
};
while (!sim.foundered && sim.t < 5 * 3600) {
  C.step(sim);
  k++;
  if (k % 40) continue;
  const a = process.hrtime.bigint();
  const s1 = NET.share(G, sim);
  cost += process.hrtime.bigint() - a; nCost++;
  const so = NET.share(GO, sim), s15 = NET.share(G15, sim), s30 = NET.share(G30, sim);
  NET.observe(trS, G, s1, sim); NET.observe(trO, GO, so, sim); NET.observe(tr15, G15, s15, sim); NET.observe(tr30, G30, s30, sim);
  for (let s = 0; s < T.list.length; s++) {
    const thr = NET.WET * T.list[s].foot;
    if (slab1[s] === null && s1.slabs[s] >= thr) slab1[s] = sim.t;
    if (slabO[s] === null && so.slabs[s] >= thr) slabO[s] = sim.t;
  }
  if (k === SANDBOX) at30 = JSON.stringify(Array.from(s1.water));
  witSample(s1, so);
  if (k % 240) continue;
  // every minute: the open floor against rooms.js; stage 1 against each space's water and her water
  nMin++;
  const w = R.waterOf(sim);
  for (let s = 0; s < T.list.length; s++) idWorst = Math.max(idWorst, Math.abs(so.slabs[s] - w[s]) / T.list[s].vmax);
  for (let n = 0; n < C.NN; n++) { let v = 0; for (const kk of G.bySpace[n]) v += s1.water[kk]; conWorst = Math.max(conWorst, Math.abs(v - Math.max(0, sim.vol[n])) / ship.nodeVmax[n]); }
  let all = 0;
  for (let s = 0; s < T.list.length; s++) all += s1.slabs[s];
  for (const o of R.overfill(sim)) all += o.m3;
  allWorst = Math.max(allWorst, Math.abs(all - C.readouts(sim).waterM3));
}
const founderT = sim.founderT;
// the witnesses room by room, under stage 1 and on the open floor
const witRows = [];
{
  const judge = (w, S) => {
    if (!S.length) return { ok: false, v: 'no sample' };
    const dmin = Math.min(...S.map((s) => s.dep)), dmax = Math.max(...S.map((s) => s.dep)), wetAt = S.find((s) => s.wet);
    if (w.want === 'dry') return { ok: !wetAt, v: wetAt ? 'wet from T ' + f(wetAt.T, 1) : 'dry' };
    if (w.want === 'wet') return { ok: !!S[S.length - 1].wet, v: wetAt ? 'wet from T ' + f(wetAt.T, 1) : 'dry to T ' + f(S[S.length - 1].T, 1) };
    return { ok: S.some((s) => s.dep >= w.lo && s.dep <= w.hi), v: f(dmin) + ' to ' + f(dmax) + ' m' };
  };
  for (const w of WIT) {
    const a = judge(w, w.s1), b = judge(w, w.so);
    const want = w.want === 'depth' ? f(w.lo) + ' to ' + f(w.hi) + ' m' : w.want;
    witRows.push([w, a, b, want]);
    check('witness ' + w.id + ': ' + w.what + ' (' + w.who + '), ' + w.row + ' in zone ' + w.zone + ', T ' + w.t[0] + ' to ' + w.t[1],
      'stage 1 ' + a.v + (a.ok ? '' : ' (out)') + '; open floor ' + b.v + (b.ok ? '' : ' (out)'), want, a.ok);
  }
}
must('the open-floor identity: with every opening open, every slab\'s sum is rooms.js\'s waterOf, every minute of the 1912 preset (conservation to the slab, in the limit)',
  nMin + ' minutes, 250 slabs: the worst off by ' + idWorst.toExponential(1) + ' of its capacity', 'under 1e-9', idWorst < 1e-9 && nMin > 100);
must('conservation: with the plans\' openings, each space\'s rooms hold its water (sim.vol), and the slabs with the pockets\' water and over-fill are her water (C.readouts), every minute',
  'the worst space off by ' + conWorst.toExponential(1) + ' of its capacity; her water off by ' + allWorst.toExponential(1) + ' m3', 'under 1e-9; under 1e-6 m3', conWorst < 1e-9 && allWorst < 1e-6);
// what stage 1 moves
const T0 = founderT, at = (x) => (x === null ? T0 : x);
{
  const mv = [];
  for (let s = 0; s < T.list.length; s++) { const d = (at(slab1[s]) - at(slabO[s])) / 60; if (Math.abs(d) > 1) mv.push([d, s]); }
  mv.sort((p, q) => Math.abs(q[0]) - Math.abs(p[0]) || p[1] - q[1]);
  check('stage 1 against the open floor: the slabs whose first-wet time moves more than a minute (the water climbing by the plans\' stairs and hatches, or waiting for the deck under it)',
    mv.length + ' of 250 (' + mv.filter((m) => m[0] > 0).length + ' later, ' + mv.filter((m) => m[0] < 0).length + ' earlier); the largest ' + mv.slice(0, 4).map(([d, s]) => f(d, 1) + ' min at ' + T.list[s].key).join(', '),
    'later, by the plans\' openings; none earlier by more than a minute', mv.every((m) => m[0] > -1));
}
const stateroom = G.rooms.filter((r) => r.kind === 'row' && r.row.labels.length);
const moved = (A, B) => { let m = 0, w = 0, wid = ''; for (const r of stateroom) { const d = (at(A.t[r.k]) - at(B.t[r.k])) / 60; if (Math.abs(d) > 1) m++; if (Math.abs(d) > Math.abs(w)) { w = d; wid = r.id; } } return [m, w, wid]; };
{
  const [m, w, wid] = moved(trS, trO), [m15, w15, i15] = moved(tr15, trS), [m30, w30, i30] = moved(tr30, trS);
  check('the staterooms\' rooms: stage 1 against the open floor, room by room', stateroom.length + ' room pieces; ' + m + ' move more than a minute, the largest ' + f(w, 1) + ' min (' + wid + ')', 'a few, later', true);
  check('the sill\'s bet (0 m): at 0.15 m and at 0.3 m, the staterooms\' rooms whose first-wet time moves more than a minute', '0.15 m: ' + m15 + ', the largest ' + f(w15, 1) + ' min (' + i15 + '); 0.3 m: ' + m30 + ', the largest ' + f(w30, 1) + ' min (' + i30 + ')', 'a few minutes at most', Math.abs(w15) < 15 && Math.abs(w30) < 30);
}

// ---------------------------------------------------------------- 3b. the library as the page bundles it
{
  const vm = require('vm');
  const box = { console };
  box.self = box;
  vm.createContext(box);
  let ok = true;
  try { for (const file of ['core/core.js', 'core/scenarios.js', 'core/readers/cabins.js', 'core/readers/roomnet.js', 'core/readers/rooms.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), box, { filename: file }); } catch (e) { ok = false; }
  let same = false, steps = 0;
  if (ok && box.TitanicRoomNet && box.TitanicRooms) {
    const CB = box.TitanicCore, shipB = CB.buildShip(), GB = box.TitanicRoomNet.graph(box.TitanicCabins.index(tables), shipB);
    const simB = CB.createSim(shipB, {}, box.TitanicScenarios.PRESETS.titanic.build({}));
    while (steps < SANDBOX && !simB.foundered) { CB.step(simB); steps++; }
    same = at30 !== null && JSON.stringify(Array.from(box.TitanicRoomNet.share(GB, simB).water)) === at30;
  }
  must('the library as the page bundles it (core/readers/ in name order: cabins.js, roomnet.js, then rooms.js; no module): it finds TitanicRooms when first wanted and shares the 1912 preset\'s water at thirty minutes as Node does, to the bit',
    (ok ? 'loaded' : 'FAILED to load') + '; ' + steps + ' steps; the shares ' + (same ? 'the same' : 'DIFFERENT'), 'the same', ok && same);
}

// ---------------------------------------------------------------- 4. a library, not a reader: the 1912 watch
let costW = 0n, nW = 0;
{
  const bare = N.sink(N.create(C.buildShip(), N.spec(1912), { auto: true, handover: 'flag' }));
  const shipW = C.buildShip(), GW = NET.graph(I, shipW), w = N.create(shipW, N.spec(1912), { auto: true, handover: 'flag' }), trW = NET.track(GW);
  while (!w.foundered) {
    N.step(w);
    if (w.night.k % 40) continue;
    const a = process.hrtime.bigint();
    NET.observe(trW, GW, NET.share(GW, w), w);
    costW += process.hrtime.bigint() - a; nW++;
  }
  const fc = N.forecastOf(w);
  const keys = Object.keys(w).filter((x) => /room/i.test(x)).concat(Object.keys(fc).filter((x) => /room/i.test(x)));
  must('a library: the 1912 watch shared out by it every 10 s has the fingerprint and the state of one never read; no state of its own in the sim or the forecast\'s copy; the tables untouched',
    N.fingerprint(w) + ' at step ' + w.night.k + '; serialize ' + (JSON.stringify(C.serialize(w)) === JSON.stringify(C.serialize(bare)) ? 'the same' : 'DIFFERENT') + '; keys ' + (keys.join(', ') || 'none') + '; tables ' + (JSON.stringify(tables) === before ? 'untouched' : 'CHANGED'),
    N.fingerprint(bare) + ' at step ' + bare.night.k + ' never read',
    N.fingerprint(w) === N.fingerprint(bare) && w.night.k === bare.night.k && JSON.stringify(C.serialize(w)) === JSON.stringify(C.serialize(bare)) && !keys.length && JSON.stringify(tables) === before);
}

// ---------------------------------------------------------------- 5. the table
say('NH6 STAGE 1: HER ROOMS AS THE FLOODING NETWORK, the 1912 damage preset at its default numbers (core/readers/roomnet.js, level 0)');
say('she founders at T ' + f(founderT / 60) + ' (' + K.clock(founderT, BASE) + '); T is minutes after the touch, read every 10 s');
say('each space\'s water fills its rooms (R3\'s rows by slab, and each slab\'s rest) from the bottom, by the plans\' doors and the rows that pass a deck;');
say('the stand-ins: a passage or a row with no door to its slab opens to the rest; a plate opens at its highest point; a deck of casings,');
say('bunkers or machinery is no floor. Sills 0 m and coamings 0 m [bet]; wet: 1 cm over the room\'s floor [bet]. Its doors stand open: no timing.');
say('the open floor is rooms.js\'s sharing (every opening open). The design: docs/DESIGN_her_rooms_as_the_flooding_network_v1_2026-11-23.md');
say('');
say('THE STATEROOMS\' ROOMS by deck: the row, its compartment and side, its numbers; when it was first wet under stage 1 and on the open floor');
const DK = K.DECKS.slice().reverse();
const when = (t) => (t === null ? 'dry' : K.clock(t, BASE) + ' T ' + f(t / 60, 1));
for (const d of DK) {
  const rs = stateroom.filter((r) => r.row.deck === d);
  if (!rs.length) continue;
  say('');
  say(d + ' deck: ' + rs.length + ' room pieces');
  for (const r of rs) {
    const a = trS.t[r.k], b = trO.t[r.k], dd = (at(a) - at(b)) / 60;
    const nums = r.row.labels.length > 4 ? r.row.labels.slice(0, 3).join(', ') + ' .. ' + r.row.labels[r.row.labels.length - 1] + ' (' + r.row.labels.length + ')' : r.row.labels.join(', ');
    say('  ' + r.row.id.padEnd(7) + (code(r.zone) + ' ' + (r.side ? 'stbd' : 'port')).padEnd(15) + when(a).padEnd(22) + ('open ' + when(b)).padEnd(27) + (Math.abs(dd) > 1 ? (dd > 0 ? '+' : '') + f(dd, 1) + ' min  ' : '') + nums);
  }
}
say('');
say('THE SLABS WHOSE FIRST WATER STAGE 1 MOVES BY MORE THAN A MINUTE (stage 1, the open floor)');
for (let s = 0; s < T.list.length; s++) { const dd = (at(slab1[s]) - at(slabO[s])) / 60; if (Math.abs(dd) > 1) say('  ' + T.list[s].key.padEnd(14) + when(slab1[s]).padEnd(22) + ('open ' + when(slabO[s])).padEnd(27) + (dd > 0 ? '+' : '') + f(dd, 1) + ' min'); }
say('');
say('THE WITNESSES ROOM BY ROOM (docs/research/RESEARCH_room_by_room_flooding_record_v1_2026-11-20.md), each a CHECK: stage 1 and the open floor');
for (const [w, a, b, want] of witRows) say('  ' + (a.ok ? 'in   ' : 'out  ') + w.id.padEnd(24) + (w.row + ' z' + w.zone).padEnd(10) + ('T ' + w.t[0] + '-' + w.t[1]).padEnd(10) + ('want ' + want).padEnd(20) + ('stage 1 ' + a.v).padEnd(28) + 'open ' + b.v + (b.ok ? '' : ' (out)'));
say('');
say('THE CHECK ROWS');
for (const [what, value, ref, ok] of checks) say((ok ? 'in   ' : 'out  ') + 'CHECK ' + what + ' | ' + value + ' | ' + ref);
fs.writeFileSync(outFile('roomnet_1912.txt'), lines.join('\n') + '\n');

console.log('');
console.log('~ cost: the graph built in ' + tGraph.toFixed(0) + ' ms; share of every space ' + (Number(cost) / nCost / 1e6).toFixed(1) + ' ms on the preset, ' + (Number(costW) / nW / 1e6).toFixed(1) + ' ms on the watch');
for (const [what, value, ref, ok] of musts) console.log((ok ? 'PASS' : 'FAIL') + ' MUST  ' + what + ' | ' + value + ' | ' + ref);
console.log(fails ? 'FAIL: ' + fails + ' of ' + musts.length + ' MUST rows' : 'PASS: every MUST row (' + musts.length + '); CHECK rows in: ' + checks.filter((c) => c[3]).length + ' of ' + checks.length);
process.exit(fails ? 1 : 0);
