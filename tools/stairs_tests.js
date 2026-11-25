// S1 acceptance: the tiers above B deck and the two grand staircases in the flooding core (core/core.js: TIER, tierTop,
// WINDOWS, STAIRS, weatherOpenings, stairsStep, the flow laws lawUpright and lawLevel). The design and its numbers:
// docs/DESIGN_grand_staircases_dome_flooding_v1_2026-11-19.md.
//   node tools/stairs_tests.js      the table (about a minute); in the gate as `stairs`, its print tracked in
//                                   out/stairs_tests.txt
// MUST rows hold whatever the geometry and the strengths are set to; the CHECK rows and the timetable at the end say
// what those numbers give on the 1912 damage, and move with them (and with the calibration).
'use strict';
const crypto = require('crypto');
const C = require('../core/core.js');
const SC = require('../core/scenarios.js');

const rows = []; let fails = 0;
function row(kind, what, value, ref, ok) { rows.push([kind, what, value, ref, ok]); if (kind === 'MUST' && !ok) fails++; }
const f = (x, n) => x.toFixed(n === undefined ? 3 : n);
const e = (x) => x.toExponential(1);
const ship = C.buildShip(), hull = C.buildShip({ tiers: 0 });      // her as she is modelled, and the hull that stops at B deck
const SQ2G = Math.sqrt(2 * C.GRAV);
const NONE = { stairs: 0, windows: 0, sideOpenings: 0 };           // her tiers' sides whole and no staircase (and since D4 no opening in her side)
const sink = (key, params, sh) => C.createSim(sh || ship, params || {}, SC.PRESETS[key].build({}));
const state71 = (sim, buf) => { buf.set(sim.vol, 0); buf[64] = sim.zO; buf[65] = sim.pitch; buf[66] = sim.roll; buf[67] = sim.vz; buf[68] = sim.wth; buf[69] = sim.wph; buf[70] = sim.inflow; return buf; };
const founder = (sim) => { while (!sim.foundered && sim.t < 6 * 3600) C.step(sim); return sim; };

// ---------------------------------------------------------------- 1. the two flow laws, as functions
{
  // an upright opening: against the sum over its height of the speed the head gives at each height (midpoint rule)
  const num = (H1, H2, h) => { const N = 40000, top = Math.min(h, H1); let s = 0; for (let i = 0; i < N; i++) { const z = (i + 0.5) * top / N; s += Math.sqrt(H1 - (z > H2 ? z : H2)); } return s * top / N; };
  let worst = 0, n = 0, weir = 0, orif = 0, zero = 0, mono = 0, jump = 0;
  const hs = [0.5, 2.0, 2.4];
  for (const h of hs) for (const H1 of [0.05, 0.3, 0.999 * h, h, 1.001 * h, 1.7 * h, 4 * h, 12 * h]) {
    for (const r of [0, 0.1, 0.5, 0.9, 0.999, 1]) {
      const H2 = r * H1, q = C.lawUpright(H1, H2, h), ref = num(H1, H2, h);
      const err = Math.abs(q - ref) / (H1 * Math.sqrt(H1)); if (err > worst) worst = err; n++;   // against the weir's scale at that head
      if (r === 0 && H1 <= h) weir = Math.max(weir, Math.abs(q - (2 / 3) * H1 * Math.sqrt(H1)) / q);          // a weir under its top
      if (H2 >= h) orif = Math.max(orif, Math.abs(q - h * Math.sqrt(H1 - H2)) / Math.max(q, 1e-12));           // an orifice over it
      if (r === 1) zero = Math.max(zero, Math.abs(q));
      if (C.lawUpright(H1 * 1.01, H2, h) < q - 1e-12 || (H2 > 0 && C.lawUpright(H1, H2 * 0.99, h) < q - 1e-12)) mono++;
    }
    for (const H2 of [0, 0.3 * h]) jump = Math.max(jump, Math.abs(C.lawUpright(h * (1 + 1e-9), H2, h) - C.lawUpright(h * (1 - 1e-9), H2, h)));
    jump = Math.max(jump, Math.abs(C.lawUpright(3 * h, h * (1 + 1e-9), h) - C.lawUpright(3 * h, h * (1 - 1e-9), h)));
  }
  row('MUST', 'an upright opening carries the sum over its height of what the head gives there', 'worst ' + e(worst) + ' of ' + n + ' states', 'the same sum by the midpoint rule, within 1e-6 of H1^1.5', worst < 1e-6);
  row('MUST', 'the same: a weir while the sea is under its top, an orifice once both levels are over it', 'weir ' + e(weir) + ', orifice ' + e(orif), '(2/3) H^1.5 and h sqrt(H1 - H2), within 1e-12', weir < 1e-12 && orif < 1e-12);
  row('MUST', 'the same: nothing at equal levels, no step at its top, more for more head', 'at equal levels ' + e(zero) + '; across its top ' + e(jump) + '; ' + mono + ' states out of order', '0; under 1e-7; 0', zero < 1e-12 && jump < 1e-7 && mono === 0);
}
{
  let cross = 0, mono = 0, zero = 0, pick = 0, n = 0;
  for (const [A, P] of [[16, 21.6], [36, 21.6], [4, 9], [0.32, 0.43]]) {
    const Hx = 1.5 * A / P;                                         // where the rim and the hole carry the same
    cross = Math.max(cross, Math.abs(A * Math.sqrt(Hx) - P * (2 / 3) * Hx * Math.sqrt(Hx)) / (A * Math.sqrt(Hx)));
    for (const H1 of [0.02, 0.2, 0.5 * Hx, 0.999 * Hx, 1.001 * Hx, 2 * Hx, 6 * Hx]) for (const r of [0, 0.3, 0.9, 1]) {
      const H2 = r * H1, q = C.lawLevel(H1, H2, A, P), qo = A * Math.sqrt(H1 - H2), qw = P * (2 / 3) * H1 * Math.sqrt(H1); n++;
      if (q !== Math.min(qo, qw)) pick++;
      if (r === 1) zero = Math.max(zero, Math.abs(q));
      if (C.lawLevel(H1 * 1.01, H2, A, P) < q - 1e-12 || (H2 > 0 && C.lawLevel(H1, H2 * 0.99, A, P) < q - 1e-12)) mono++;
    }
  }
  row('MUST', 'a level opening carries the smaller of its rim as a weir and its area as an orifice', pick + ' of ' + n + ' states otherwise; at 1.5 A / P they differ by ' + e(cross), '0; equal there within 1e-12', pick === 0 && cross < 1e-12);
  row('MUST', 'the same: nothing at equal levels, more for more head', 'at equal levels ' + e(zero) + '; ' + mono + ' states out of order', '0; 0', zero < 1e-12 && mono === 0);
}

// ---------------------------------------------------------------- 2. the step carries those laws
// One opening given way on an undamaged ship whose space under it is a third full, the ship set down until the sea
// stands H over the opening: the connection's flow after one step, against the law worked here.
function carried(j, H) {
  const s0 = sink('blank');
  const d = C.serialize(s0), o = s0.stairOps[j];
  d.stairs[j].state = 2; d.stairs[j].t = 0;
  for (const n of o.nodes) { d.vol[n] = 0.3 * ship.nodeVmax[n]; d.vol[n ^ 2] = 0.3 * ship.nodeVmax[n ^ 2]; }   // both halves of the space
  const sim = C.restore(ship, d), op = sim.stairOps[j], S = sim.conn;
  const F0 = C.frameOf(sim);
  sim.zO -= C.worldZ(F0, op.x, op.y, op.z) + H;
  let v0 = 0; for (let k = 0; k < C.NN; k++) v0 += sim.vol[k];
  C.step(sim);
  let q = 0, back = 0, v1 = 0; for (let i = 0; i < op.nodes.length; i++) { q += S.q[op.conn + i]; back = Math.max(back, sim.level[op.nodes[i]] + H); }
  for (let k = 0; k < C.NN; k++) v1 += sim.vol[k];
  const p = sim.params, n = op.nodes.length;
  const law = op.type === 2 ? p.CdStair * op.size * SQ2G * C.lawUpright(H, 0, op.dim) : n * p.CdStair * SQ2G * C.lawLevel(H, 0, op.size / n, op.dim / n);
  return { q, law, op, back, kept: Math.abs((v1 - v0) - sim.inflow * p.dt) };      // kept: what came aboard in the step against the inflow it reports
}
{
  const ops = sink('blank').stairOps, jDoor = ops.findIndex(o => o.type === 2 && o.stair && isFinite(o.hc)), jDome = ops.findIndex(o => o.type === 3), jWin = ops.findIndex(o => o.type === 2 && !o.stair);
  let worst = 0, drowned = 0, kept = 0; const said = [];
  for (const [j, Hs, name] of [[jDoor, [0.3, 1.0, 2.5], 'door'], [jDome, [0.3, 3.0], 'dome'], [jWin, [0.4, 2.0], 'windows']]) for (const H of Hs) {
    const r = carried(j, H), err = Math.abs(r.q - r.law) / r.law; if (err > worst) worst = err; if (r.back > 0) drowned++; if (r.kept > kept) kept = r.kept;
    said.push(name + ' ' + f(H, 1) + ' m: ' + f(r.q, 2));
  }
  row('MUST', 'the step carries them: one opening given way, the sea H over it, the space under it a third full', said.join('; ') + ' m3/s; worst ' + e(worst), 'the law worked in this file, within 1e-9 (none drowned: ' + drowned + ')', worst < 1e-9 && drowned === 0);
  row('MUST', '... and what came in by it is in her: the water aboard after that step against the inflow the step reports', 'off by at most ' + e(kept) + ' m3 in those seven steps', 'under 1e-9 m3', kept < 1e-9);
}

// ---------------------------------------------------------------- 3. the tiers above B deck
{
  // what they enclose, by the columns against a fine sum of tierTop over the deck's plan
  let vCols = 0; for (let i = 0; i < ship.cols.N; i++) vCols += ship.cols.dxdy[i] * (ship.cols.zhi[i] - hull.cols.zhi[i]);
  let vFine = 0; const dx = 0.5, dy = 0.1;
  for (let x = C.TIER.B[0] + dx / 2; x < C.TIER.B[1]; x += dx) {
    const z0 = C.zTopAt(x);
    for (let y = dy / 2; y < 15; y += dy) {
      if (C.halfBreadth(x, z0) < y) break;
      let top = C.tierTop(x, y);
      while (top > z0 && C.halfBreadth(x, top) < y) top -= 0.02;       // inside the ship's side
      vFine += 2 * dx * dy * Math.max(0, top - z0);
    }
  }
  row('MUST', 'the tiers enclose what their plan says: her columns carried up through them', f(vCols, 0) + ' m3 by the columns, ' + f(vFine, 0) + ' m3 by a fine sum of the plan', 'within 2 % (columns 3 m by 0.5 m)', Math.abs(vCols - vFine) / vFine < 0.02 && ship.cols.N === hull.cols.N);
  let same = true; for (let i = 0; i < ship.cols.N && same; i++) if (ship.cols.zlo[i] !== hull.cols.zlo[i] || ship.cols.x[i] !== hull.cols.x[i] || ship.cols.y[i] !== hull.cols.y[i] || ship.cols.zhi[i] < hull.cols.zhi[i]) same = false;
  let lower = true; for (let n = 0; n < C.NN; n += 2) if (ship.nodeVmax[n] !== hull.nodeVmax[n]) lower = false;     // the spaces below E deck
  row('MUST', 'they add to her and take nothing away: every column where it was, none lower, the spaces below E deck as they were', (same ? 'the columns agree' : 'a column moved') + '; ' + (lower ? 'the lower spaces agree' : 'a lower space changed'), 'the hull to B deck is the same hull', same && lower);
  // set down level until the sea is over the houses: she displaces the hull's volume and the tiers'
  const a = sink('blank', NONE), b = sink('blank', NONE, hull);
  a.zO -= 30; b.zO -= 30;
  const Va = C.hydroPass(a, C.frameOf(a), {}).V, Vb = C.hydroPass(b, C.frameOf(b), {}).V;
  row('MUST', 'wholly under water she displaces the hull and the tiers', f(Va - Vb, 1) + ' m3 more than the hull alone', f(vCols, 1) + ' m3, what the tiers enclose', Math.abs(Va - Vb - vCols) < 1e-6 * vCols);
  // each window stands in its tier's side, above its deck
  const ops = sink('blank').stairOps; let out = 0, wins = 0;
  for (const o of ops) { if (o.stair || o.side) continue; wins++; const side = C.halfBreadth(o.x, o.zc, ship.hull); if (Math.abs(o.y) > side + 1e-9 || o.z <= C.zTopAt(o.x) || o.zc > C.tierTop(o.x, Math.abs(o.y)) + 1e-9) out++; }   // her side as the ship has it (her ends since D4)
  row('MUST', 'every window stands in the side of its tier, over its deck', wins + ' window openings; ' + out + ' outside', '0 outside', out === 0 && wins > 0);
}

// ---------------------------------------------------------------- 4. neutral until the sea reaches them
{
  const off = sink('blank', NONE), on = sink('blank');
  let same = on.conn.n === off.conn.n + on.stairOps.reduce((a, o) => a + o.nodes.length, 0);
  const A = off.conn, B = on.conn;
  for (let c = 0; c < A.n && same; c++) for (const k of ['a', 'b', 'type', 'x', 'y', 'z', 'area', 'coef', 'en', 'kind', 'idx']) if (A[k][c] !== B[k][c]) { same = false; break; }
  let lit = 0; for (let c = A.n; c < B.n; c++) if (B.en[c] || B.kind[c] !== C.K.STAIR) lit++;
  row('MUST', 'the openings\' connections come after every other, each off until the sea reaches it; with stairs 0 and windows 0 there is none', off.stairOps.length + ' openings and ' + off.conn.n + ' connections without; ' + on.stairOps.length + ' and ' + on.conn.n + ' with; ' + lit + ' of theirs on at the start', 'the first ' + off.conn.n + ' the same in both; 0 on', same && lit === 0 && off.stairOps.length === 0);
}
function lockstep(key, tMax) {
  const a = sink(key, NONE), b = sink(key), bufA = new Float64Array(71), bufB = new Float64Array(71);
  let firstDiff = -1, firstWet = -1;
  while (a.t < tMax && !(a.foundered && b.foundered)) {
    if (!a.foundered) C.step(a); if (!b.foundered) C.step(b);
    if (firstWet < 0 && b.stairSt.some(v => v > 0)) firstWet = b.t;
    if (firstDiff < 0) { state71(a, bufA); state71(b, bufB); for (let i = 0; i < 71; i++) if (bufA[i] !== bufB[i]) { firstDiff = b.t; break; } }
    if (firstDiff >= 0 && firstWet >= 0) break;
  }
  return { a, b, firstDiff, firstWet };
}
{
  const r = lockstep('hawke', 2 * 3600);
  row('MUST', 'a ship the sea never brings to them (Olympic and Hawke, two hours): every step the same with her openings as with none', (r.firstDiff < 0 ? 'no step differs' : 'differs at ' + f(r.firstDiff, 2) + ' s') + '; ' + (r.firstWet < 0 ? 'none wet' : 'one wet at ' + f(r.firstWet, 2) + ' s'), 'no difference in 71 numbers a step; none wet', r.firstDiff < 0 && r.firstWet < 0);
  const t = lockstep('titanic', 5 * 3600);
  row('MUST', 'the 1912 damage: every step the same with her openings as with none until the sea first stands at one', 'first wet at ' + f(t.firstWet / 60, 2) + ' min; first difference at ' + f(t.firstDiff / 60, 2) + ' min', 'no difference before the first is wet', t.firstWet > 0 && t.firstDiff >= t.firstWet);
}

// ---------------------------------------------------------------- 5. the 1912 damage with them
// her water with the pockets' (G7: the forepeak's tank never gives way, so its water is never in sim.vol; QC B-3)
const aboard = (s) => { let v = 0; for (let n = 0; n < C.NN; n++) v += C.spaceWater(s, n); return v; };
const Y3 = { stairs: 0, wMul: 2.735, aDown: 0.280, fOpen: 0.01411 };               // the flow parameters before S1's refit
const before = founder(sink('titanic', Y3, hull));                                 // the model before S1, as it was fitted
const whole = sink('titanic', NONE); let vInWhole = 0;                             // her tiers' sides whole, no staircase
while (!whole.foundered && whole.t < 6 * 3600) { C.step(whole); vInWhole += whole.inflow * whole.params.dt; }
const noStairs = founder(sink('titanic', { stairs: 0 }));                          // windows, no staircase
const sim = sink('titanic');
let back = 0, mid = null, vIn = 0, vStair = 0, vWin = 0, peak = 0, peakT = 0, peakAll = 0, listBridge = null;
const prev = new Uint8Array(sim.stairSt.length), wetT = new Float64Array(sim.stairSt.length).fill(-1);
const h1 = crypto.createHash('sha256'), buf = new Float64Array(71);
while (!sim.foundered && sim.t < 6 * 3600) {
  C.step(sim);
  h1.update(Buffer.from(state71(sim, buf).buffer));
  vIn += sim.inflow * sim.params.dt;
  let q = 0, qw = 0; const Fn = C.frameOf(sim);
  for (let j = 0; j < sim.stairSt.length; j++) {
    const o = sim.stairOps[j];
    if (sim.stairSt[j] < prev[j]) back++;
    if (wetT[j] < 0 && o.stair && C.worldZ(Fn, o.x, o.y, o.z) < 0) wetT[j] = sim.t;       // the sea at its sill or on its cover (a dome may go before, by the air)
    prev[j] = sim.stairSt[j];
    for (let i = 0; i < o.nodes.length; i++) { if (o.stair) q += sim.conn.q[o.conn + i]; else qw += sim.conn.q[o.conn + i]; }
  }
  vStair += q * sim.params.dt; vWin += qw * sim.params.dt;
  if (q > peak) { peak = q; peakT = sim.t; peakAll = sim.inflow; }
  if (listBridge === null && sim.markT.bridge >= 0) listBridge = sim.roll * 180 / Math.PI;
  const st = sim.stairOps.map((o, j) => o.stair ? sim.stairSt[j] : -1).filter(v => v >= 0);
  if (!mid && st.some(v => v === 2) && st.some(v => v < 2)) mid = { d: C.serialize(sim), t: sim.t };
}
{
  const gone = Array.from(sim.stairSt).filter(v => v === 2).length;
  const said = sim.stairOps.filter(o => o.label), ids = said.map(o => o.id), ev = sim.events.filter(x => ids.includes(x.id));
  const goneSaid = sim.stairOps.filter((o, j) => o.label && sim.stairSt[j] === 2).length;
  const once = ev.length === goneSaid && new Set(ev.map(x => x.id)).size === ev.length;
  const timed = sim.stairOps.every((o, j) => (sim.stairSt[j] === 2) === (sim.stairT[j] >= 0) && (!o.label || sim.stairSt[j] !== 2 || ev.find(x => x.id === o.id).t === sim.stairT[j]));
  const firsts = ['winB', 'winA', 'winBoat'].map(id => sim.events.filter(x => x.id === id).length);
  row('MUST', 'each opening gives way once and for good; a staircase\'s says so once, a deck\'s windows once for the deck', gone + ' of ' + sim.stairOps.length + ' gave way; ' + ev.length + ' events of the staircases\'; the decks\' windows ' + firsts.join(', ') + '; ' + back + ' went back', 'an event for each of the staircases\', at its time; at most one for a deck; none goes back', once && timed && back === 0 && goneSaid > 0 && firsts.every(n => n <= 1));
  // the water aboard against the inflow summed less what was pumped out, over the whole run. The core's own step leaves
  // a little over: a space holding a film of water can be asked for more than it holds, and is then set to nothing
  // (backlog C3; 1.8 m3 on this run before S1 too). This row holds that leak small on the run as modelled; the row
  // above holds the openings' own flows exact. With the tiers' sides whole (a what-if) she lies 12 minutes longer at a
  // steep trim with a film in one space and the same leak grows: said here, not held.
  const err = aboard(sim) - (vIn - sim.pumped), err0 = aboard(whole) - (vInWhole - whole.pumped);
  row('MUST', 'over the whole 1912 run the water aboard is the inflow summed, less what was pumped, within one part in 10,000', f(aboard(sim), 1) + ' m3 aboard, over by ' + f(err, 2) + ' m3 (with her tiers\' sides whole, a what-if: ' + f(err0, 1) + ' of ' + f(aboard(whole), 0) + ')', 'within 1e-4 of the water aboard', Math.abs(err) < 1e-4 * aboard(sim));
  const again = sink('titanic'), h2 = crypto.createHash('sha256'), b2 = new Float64Array(71);
  while (!again.foundered && again.t < 6 * 3600) { C.step(again); h2.update(Buffer.from(state71(again, b2).buffer)); }
  const d1 = h1.digest('hex'), d2 = h2.digest('hex');
  row('MUST', 'the same damage run twice gives the same bits at every step', d1.slice(0, 12) + ' and ' + d2.slice(0, 12), 'equal', d1 === d2 && again.founderT === sim.founderT);
}
if (mid) {
  // a snapshot taken with some given way and some holding, restored: the openings and their connections as they were
  const live = C.restore(ship, mid.d), ref = sink('titanic');
  while (ref.t < mid.t) C.step(ref);
  let same = live.stairOps.length === ref.stairOps.length;
  for (let j = 0; j < ref.stairOps.length && same; j++) {
    if (live.stairSt[j] !== ref.stairSt[j] || live.stairT[j] !== ref.stairT[j]) same = false;
    const o = ref.stairOps[j], p = live.stairOps[j];
    for (let i = 0; i < o.nodes.length && same; i++) for (const k of ['en', 'area', 'dim', 'type', 'b']) if (live.conn[k][p.conn + i] !== ref.conn[k][o.conn + i]) same = false;
  }
  founder(live);
  row('MUST', 'saved with some given way and some holding, and restored: each opening and its connections as they were', 'at ' + f(mid.t / 60, 2) + ' min: ' + Array.from(ref.stairSt).filter(v => v === 2).length + ' gone, ' + Array.from(ref.stairSt).filter(v => v < 2).length + ' holding; ' + (same ? 'the same' : 'NOT the same'), 'states, times, and each connection\'s switch and sizes equal', same);
  row('CHECK', 'the restored copy run on founders when the run itself does', f(live.founderT, 2) + ' s against ' + f(sim.founderT, 2) + ' s', 'within 5 s (a restore solves the levels afresh, so not to the bit)', Math.abs(live.founderT - sim.founderT) <= 5);
} else row('MUST', 'saved with some given way and some holding, and restored', 'no such moment on the 1912 damage', 'one', false);

// what the numbers in force give on the 1912 damage
const evT = (s, id) => { const x = s.events.find(v => v.id === id); return x ? x.t : -1; };
const tBridge = evT(sim, 'bridge'), tDomeF = evT(sim, 'domeF'), tDomeA = evT(sim, 'domeA');
row('CHECK', 'she founders at about 2:20 (160 minutes)', f(sim.founderT / 60, 2) + ' min (' + f(before.founderT / 60, 2) + ' before S1, with the hull to B deck)', '157 to 163 [read: the record\'s 2:20; the Court\'s 2 h 40 min]', sim.founderT / 60 >= 157 && sim.founderT / 60 <= 163);
row('CHECK', 'the sea reaches the bridge at about 2:15 (155 minutes)', f(tBridge / 60, 2) + ' min (' + f(evT(before, 'bridge') / 60, 2) + ' before S1)', '152 to 158', tBridge / 60 >= 152 && tBridge / 60 <= 158);
row('CHECK', 'the forward dome gives way after the sea reaches the bridge, and before she founders', tDomeF < 0 ? 'it holds' : f((tDomeF - tBridge) / 60, 2) + ' min after the bridge; ' + f((sim.founderT - tDomeF) / 60, 2) + ' min before the end', 'after the bridge, by under 3 min (no witness timed it: the design note, section 2)', tDomeF > tBridge && tDomeF - tBridge < 180 && tDomeF < sim.founderT);
{
  const b0 = sink('titanic', Y3, hull); let l0 = null; while (!b0.foundered && l0 === null) { C.step(b0); if (b0.markT.bridge >= 0) l0 = b0.roll * 180 / Math.PI; }
  row('CHECK', 'her list as the sea reaches the bridge is to port and moderate', f(listBridge, 1) + ' deg (before S1 ' + f(l0, 1) + '); at her end ' + f(sim.roll * 180 / Math.PI, 0) + ' deg', '-5 to -15 deg [read: about 10 deg to port at 2:15]; the model\'s list is a known gap (backlog W6)', listBridge <= -5 && listBridge >= -15);
}
row('CHECK', 'at its greatest the flow down the staircases is several times the ice\'s 400 tonnes a minute', f(peak * 1.025 * 60, 0) + ' t/min at ' + f(peakT / 60, 2) + ' min, of ' + f(peakAll * 1.025 * 60, 0) + ' in all', 'over 2,000 t/min ("rapid entry")', peak * 1.025 * 60 > 2000);

// A1 (the calibration epoch, stage A; QC A-1): the half step. With the level-equalising share held per second
// (params.levelRate), the 1912 damage at half the step founders where it does at dt 0.25 within the bounds below, and
// keeps her trim. The bounds are e100's measurement on join 7's code (Stage 0, M2) with a margin; widening them is a
// finding to bring back, never a tolerance to pass.
{
  // e100 (2026-11-21, join 7's code): +2.13 s and 0.008 deg at dt 0.125, +2.63 s and 0.008 deg at dt 0.0625 (held per
  // step, as before A1: -74.88 s and -113.19 s); the design's bounds, about five and two and a half times those
  const HALF_FOUNDER_S = 10, HALF_TRIM_DEG = 0.02, MARKS = [30, 75, 100, 130, 150];
  const runDt = (dt) => {
    const s = C.createSim(ship, { dt }, SC.PRESETS.titanic.build({})), trim = {};
    while (!s.foundered && s.t < 5 * 3600) { C.step(s); for (const m of MARKS) if (trim[m] === undefined && s.t >= m * 60) trim[m] = s.pitch * 180 / Math.PI; }
    return { T: s.founderT, trim };
  };
  const a = runDt(0.25), h = runDt(0.125), q = runDt(0.0625);
  const dTrim = (x) => Math.max(...MARKS.map(m => Math.abs(x.trim[m] - a.trim[m])));
  row('MUST', 'A1: the 1912 damage at half the step (dt 0.125, the share held per second) founders where it does at dt 0.25, and keeps her trim', 'founders ' + f((h.T - a.T), 2) + ' s apart; trim within ' + f(dTrim(h), 3) + ' deg at T ' + MARKS.join(', '), 'within ' + HALF_FOUNDER_S + ' s and ' + HALF_TRIM_DEG + ' deg (e100)', Math.abs(h.T - a.T) <= HALF_FOUNDER_S && dTrim(h) <= HALF_TRIM_DEG);
  row('CHECK', '  ... and at a quarter of the step (dt 0.0625)', 'founders ' + f((q.T - a.T), 2) + ' s apart; trim within ' + f(dTrim(q), 3) + ' deg', 'as above', Math.abs(q.T - a.T) <= HALF_FOUNDER_S && dTrim(q) <= HALF_TRIM_DEG);
}

// ---------------------------------------------------------------- 6. C4: G11's doors and the openings in her side
// The calibration epoch's stage C4, dark until its landing: params.g11Doors (1: every door of BULKHEADS; 0: without the
// three the deck plans do not show) and params.sideOpenings (0: none; 1: D and E deck's sidelights and doors in her
// side from R3's table, core/core.js SIDE_OPENINGS). By default both are the model before C4, to the bit.
{
  const SO = require('./side_openings.js');
  const run = (key, params, scen, sh) => {
    const s = C.createSim(sh || ship, params || {}, scen || SC.PRESETS[key].build({})), h = crypto.createHash('sha256'), b = new Float64Array(71);
    while (!s.foundered && s.t < 6 * 3600) { C.step(s); h.update(Buffer.from(state71(s, b).buffer)); }
    return { s, d: h.digest('hex').slice(0, 16) };
  };
  const min = (r) => r.s.foundered ? f(r.s.founderT / 60, 2) : 'afloat';
  // every step's 71 numbers on the 1912 damage and on Britannic (her doors D and E open, her staircases' openings giving
  // way), digested, as join 9's tip 37190bd gave them before C4. Update them only with a change that is meant to move
  // those runs (the epoch's landing will), and say so, as with the systems suite's fingerprint.
  // The calibration epoch's B1 (the model's own pow) refroze them: adc1275 with C.pow preloaded over its Math.pow (node -r
  // tools/pow_preload.js tools/hull_ends_tests.js --print there; without the preload, 47a354e65ea6df35 and f144932739ded42c)
  const C4_BEFORE = { titanic: '1e94ca5a17c07221', britannic: '97d4f57b83e4ebef' };
  // Since the epoch's landing (D4) the defaults are the landing's: the row runs the configuration before it (SC.PRE_D4:
  // g11Doors 1, sideOpenings 0, the ship without her ends, the numbers and the 1912 damage as they were) with D89's trace
  // zeroed, as at join 9
  const preShip = C.buildShip(SC.PRE_D4.ship), pre = Object.assign({}, SC.PRE_D4.params, { keepTrace: 0 });
  const preScen = (key) => (key === 'titanic' ? Object.assign(SC.PRESETS.titanic.build(SC.PRE_D4.build), SC.PRE_D4.scen) : SC.PRESETS[key].build({}));
  const runPre = (key, extra) => run(key, Object.assign({}, pre, extra || {}), preScen(key), preShip);
  const t0 = runPre('titanic'), b0 = runPre('britannic');
  const odd = { sideStrength: 0.01, leakSide: 0.5 };       // the side openings' other numbers, with none of them built
  const t1 = runPre('titanic', odd), b1 = runPre('britannic', odd);
  row('MUST', 'C4: with g11Doors 1 and sideOpenings 0 (as before the epoch\'s landing, SC.PRE_D4) the 1912 damage and Britannic have the bits they had before C4 at every step', t0.d + ' and ' + b0.d + '; with the side openings\' other numbers changed ' + (t1.d === t0.d && b1.d === b0.d ? 'the same' : 'NOT the same'), C4_BEFORE.titanic + ' and ' + C4_BEFORE.britannic + ' (join 9\'s tip)', t0.d === C4_BEFORE.titanic && b0.d === C4_BEFORE.britannic && t1.d === t0.d && b1.d === b0.d && pre.g11Doors === 1 && pre.sideOpenings === 0);

  // g11Doors 0: the connections with and without, walked side by side
  {
    const a = sink('blank', { g11Doors: 1 }).conn, b = sink('blank', { g11Doors: 0 }).conn;   // 1 and 0 named (0 is the default since D4)
    const sig = (S, c) => [S.kind[c], S.idx[c], S.a[c], S.b[c], S.type[c], S.x[c], S.y[c], S.z[c], S.area[c], S.coef[c], S.en[c], S.dim[c]].join(',');
    const gone = []; let j = 0;
    for (let i = 0; i < a.n; i++) { if (j < b.n && sig(a, i) === sig(b, j)) j++; else gone.push(i); }
    const names = gone.map((c) => {
      const bh = C.BULKHEADS[a.idx[c]], deck = ['G', 'F', 'E'].find((d) => Math.abs(a.z[c] - (C.deckZ(d, bh.x) + 1.0)) < 1e-9) || '?';
      return a.kind[c] === C.K.DOOR ? bh.id + ':' + deck + (a.y[c] < 0 ? ':S' : ':P') : 'not a door';
    });
    const want = ['E:F:P', 'E:F:S', 'G:F:P', 'G:F:S', 'N:G:P', 'N:G:S'];
    const low = (S) => { let n = 0; for (let c = 0; c < S.n; c++) if (S.kind[c] === C.K.DOOR && S.idx[c] === C.BULKHEADS.findIndex((x) => x.id === 'N') && S.z[c] < C.deckZ('G', 0) - 3) n++; return n; };
    row('MUST', 'C4: g11Doors 0 takes away the three doors the deck plans do not show (F deck in E and in G, G deck in N), each in its two halves, and nothing else', a.n + ' connections with, ' + b.n + ' without; gone: ' + names.join(' ') + '; N\'s low door ' + (low(b) === 2 ? 'stays' : 'NOT as it was'), want.join(' ') + '; every other connection the same, in the same order', j === b.n && names.join(' ') === want.join(' ') && low(a) === 2 && low(b) === 2);
  }

  // sideOpenings 1: the openings against the data
  {
    const T = SO.derive(), core = C.SIDE_OPENINGS.map(SO.line), data = T.rows.map(SO.line);
    const tableSame = core.length === data.length && core.every((v, i) => v === data[i]);
    const off = sink('blank', { sideOpenings: 0 }), on = sink('blank', { sideOpenings: 1 }), ops = on.stairOps, side = ops.filter((o) => o.side);   // 0 and 1 named (1 is the default since D4)
    const said = []; let ok = tableSame && T.unused.length === 0;
    for (const t of T.totals.sort((p, q) => (p.deck + p.side < q.deck + q.side ? -1 : 1))) {
      const mine = side.filter((o) => o.side.deck === t.deck && (o.y < 0 ? 1 : 0) === t.side);
      const n = mine.reduce((s, o) => s + o.side.count, 0), A = mine.reduce((s, o) => s + o.side.area, 0), open = mine.reduce((s, o) => s + o.size * o.dim, 0);
      const win = mine.filter((o) => o.side.kind === 'doorwin').reduce((s, o) => s + o.side.area, 0);
      said.push(t.deck + (t.side ? ' stbd ' : ' port ') + n + ', ' + f(A, 2) + ' m2');
      // the data's areas are rounded row by row (to 0.001 m2); what can open is that less the doors' windows, counted once
      if (n !== t.count || Math.abs(A - t.area) > 0.02 || Math.abs(open - (A - win)) > 1e-9) ok = false;
    }
    row('MUST', 'C4: sideOpenings 1 gives her the openings of the data (data/rooms/openings.json, D and E deck): the core\'s table is the one made from it, and each deck and side has its count and its clear area', C.SIDE_OPENINGS.length + ' rows' + (tableSame ? '' : ' (NOT the data\'s: node tools/side_openings.js)') + '; ' + said.join('; '), T.totals.map((t) => t.deck + (t.side ? ' stbd ' : ' port ') + t.count + ', ' + f(t.area, 2)).join('; ') + '; within 0.02 m2', ok);
    // where they stand, and what else moved
    let out = 0;
    const ABOVE = { D: 'C', E: 'D' };
    for (const o of side) if (Math.abs(Math.abs(o.y) - C.halfBreadth(o.x, o.zc, ship.hull)) > 1e-9 || o.z < C.deckZ(o.side.deck, o.x) - 1e-9 || o.z + o.dim > C.deckZ(ABOVE[o.side.deck], o.x) || C.zoneAt(o.x) !== (o.nodes[0] >> 2) || !(o.hc > 0) || !(o.size > 0)) out++;
    const ids = new Set(ops.map((o) => o.id)).size === ops.length;
    const rest = ops.filter((o) => !o.side).map((o) => o.id).join(' '), before = off.stairOps.filter((o) => !(o.stair && o.hc === Infinity)).map((o) => o.id).join(' ');
    const steel = off.stairOps.filter((o) => o.stair && o.hc === Infinity).map((o) => o.id);
    let lit = 0; for (const o of side) for (let i = 0; i < o.nodes.length; i++) if (on.conn.en[o.conn + i]) lit++;
    const last = ops.findIndex((o) => o.side) === ops.length - side.length;
    const plain = JSON.stringify(JSON.parse(JSON.stringify(side))) === JSON.stringify(side);
    row('MUST', 'C4:   each stands in her side between its deck and the next, in its own compartment, off until the sea is on it; they come after every other opening', side.length + ' openings; ' + out + ' out of place; ' + lit + ' on at the start; ' + (ids ? 'no id twice' : 'an id twice') + '; ' + (plain ? 'plain data' : 'NOT plain data'), '0; 0; the others as before but the staircase\'s gangway doors (' + steel.join(', ') + '), which the plans\' own doors stand for', out === 0 && lit === 0 && ids && last && plain && rest === before && steel.length === 2 && side.length === C.SIDE_OPENINGS.length);
    // a ship the sea never brings to them: the same bits with them
    const h0 = sink('hawke'), h1 = sink('hawke', { sideOpenings: 1 }), bufA = new Float64Array(71), bufB = new Float64Array(71);
    let diff = -1;
    while (h0.t < 3600 && diff < 0) { C.step(h0); C.step(h1); state71(h0, bufA); state71(h1, bufB); for (let i = 0; i < 71; i++) if (bufA[i] !== bufB[i]) { diff = h0.t; break; } }
    row('MUST', 'C4:   a ship the sea never brings to them (Olympic and Hawke, an hour): every step the same with them as without', (diff < 0 ? 'no step differs' : 'differs at ' + f(diff, 2) + ' s') + '; ' + Array.from(h1.stairSt).filter((v) => v > 0).length + ' wet', 'no difference in 71 numbers a step', diff < 0);
  }

  // the rungs: each switch on alone, on the 1912 damage
  const open = () => { const sc = SC.PRESETS.titanic.build({}); sc.doorsOpen = C.BULKHEADS.map((x) => x.id); return sc; };
  const g = run('titanic', { g11Doors: 0 }), o0 = run('titanic', {}, open()), o1 = run('titanic', { g11Doors: 0 }, open()), bg = run('britannic', { g11Doors: 0 });
  row('CHECK', 'C4 rung: g11Doors 0 alone. The 1912 damage has every door shut, so it does not feel them; the what-ifs with doors open do', '1912: ' + min(g) + ' min (' + (g.d === t0.d ? 'the same bits' : 'other bits') + '); every door held open: ' + min(o1) + ' against ' + min(o0) + '; Britannic: ' + min(bg) + ' against ' + min(b0), '1912 as by default, ' + min(t0) + ' min', g.d === t0.d);
  const s1 = run('titanic', { sideOpenings: 1 }), s3 = run('titanic', { sideOpenings: 1, sideStrength: 0.3 }), s10 = run('titanic', { sideOpenings: 1, sideStrength: 0.1 });
  const went = (r) => r.s.stairOps.filter((o, j) => o.side && r.s.stairSt[j] === 2).reduce((n, o) => n + o.side.count, 0);
  const firstT = (r) => { const x = r.s.events.filter((v) => /^side/.test(v.id)).sort((p, q) => p.t - q.t)[0]; return x ? f(x.t / 60, 2) + ' min' : 'none'; };
  row('CHECK', 'C4 rung: sideOpenings 1 alone, the 1912 damage: she founders', min(s1) + ' min (by default ' + min(t0) + '); ' + went(s1) + ' of her ' + went({ s: { stairOps: s1.s.stairOps, stairSt: s1.s.stairOps.map(() => 2) } }) + ' openings give way, the first at ' + firstT(s1), '157 to 163, as she does by default', s1.s.founderT / 60 >= 157 && s1.s.founderT / 60 <= 163);
  row('CHECK', 'C4 rung:   ... and with every strength at 0.3 and at 0.1 of its bet (sideStrength): the bets decide it', 'at 0.3: ' + min(s3) + ' min, ' + went(s3) + ' give way, the first at ' + firstT(s3) + '; at 0.1: ' + min(s10) + ' min, ' + went(s10) + ', the first at ' + firstT(s10), 'said, not held: a strength under about a third of the bets moves her end by minutes', true);
}

for (const [kind, what, value, ref2, ok] of rows) console.log((kind === 'MUST' ? (ok ? 'PASS ' : 'FAIL ') : (ok ? 'in   ' : 'OUT  ')) + what.padEnd(118) + ' ' + String(value).padEnd(64) + ' ' + ref2);

console.log('\nThe 1912 damage (minutes after the collision; the strengths in force: a dome ' + sim.params.hDome + ' m of sea, a staircase\'s door ' + sim.params.hDoor + ' m, a window ' + sim.params.hWin + ' m):');
console.log('  her end (the last three with today\'s flow parameters)        bridge   founders');
for (const [label, s] of [['the model before S1 (the hull to B deck, as fitted then)', before], ['her tiers, their sides whole, no staircase', whole], ['her tiers and their windows, no staircase', noStairs], ['her tiers, their windows and the staircases', sim]]) console.log('  ' + label.padEnd(58) + f(evT(s, 'bridge') / 60, 2).padStart(9) + f(s.founderT / 60, 2).padStart(11));
console.log('  opening          the sea at it   gives way   label');
sim.stairOps.forEach((o, j) => { if (o.stair) console.log('  ' + o.id.padEnd(16) + (wetT[j] < 0 ? '-' : f(wetT[j] / 60, 2)).padStart(12) + (sim.stairT[j] < 0 ? '-' : f(sim.stairT[j] / 60, 2)).padStart(12) + '   ' + o.label); });
for (const id of ['winB', 'winA', 'winBoat']) { const x = sim.events.find(v => v.id === id); console.log('  ' + id.padEnd(16) + ''.padStart(12) + (x ? f(x.t / 60, 2) : '-').padStart(12) + '   ' + (x ? x.label + ' (the first of them)' : 'no window of that deck gives way')); }
console.log('  of the ' + f(vIn * 1.025, 0) + ' t that came aboard: ' + f(vStair * 1.025, 0) + ' t down the two staircases, ' + f(vWin * 1.025, 0) + ' t by the tiers\' windows');
console.log(fails ? '\nFAIL: ' + fails + ' MUST row(s)' : '\nPASS: every MUST row (' + rows.filter(r => r[0] === 'MUST').length + '); CHECK rows in range: ' + rows.filter(r => r[0] === 'CHECK' && r[4]).length + ' of ' + rows.filter(r => r[0] === 'CHECK').length);
process.exit(fails ? 1 : 0);
