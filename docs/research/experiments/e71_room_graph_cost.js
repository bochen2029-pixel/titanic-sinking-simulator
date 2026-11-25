// e71: what a room-by-room flooding model would cost to step. A cost sketch, not a model of her.
// For docs/BRAINSTORM_rooms_and_a_walk_through_her_v1_2026-11-20.md, section 5. It reads nothing and writes nothing.
//
//   node docs/research/experiments/e71_room_graph_cost.js [rooms] [openings per room]     defaults 2500 and 2.4
//
// A made-up ship of box rooms on nine decks, joined by doors (the core's lawUpright) and stairs (lawLevel), flooded
// from a few holes forward while she trims by the head. Each step does what a real room model would have to do:
//   1. every wet room's free surface from its volume, the room lying at her pitch (a clamped wedge, solved by bisection);
//   2. every opening's flow from the two levels;
//   3. the limiter: no room gives more than it holds (the cut of backlog C3), then the volumes moved.
// The rooms' sizes and the openings are drawn at random from a fixed seed, so the count of flow evaluations is real
// and the hydraulics are not. What it measures is microseconds a step.
'use strict';
const NR = +process.argv[2] || 2500, PER = +process.argv[3] || 2.4;
let s = 12345;
const rnd = () => { s = (Math.imul(s, 1103515245) + 12345) >>> 0; return s / 4294967296; };
const SQ2G = Math.sqrt(2 * 9.81), DT = 0.25, CD = 0.6;

// rooms: x of the middle, z of the floor (her frame), length, breadth, height
const X = new Float64Array(NR), Z = new Float64Array(NR), L = new Float64Array(NR), W = new Float64Array(NR), H = new Float64Array(NR);
const vol = new Float64Array(NR), lev = new Float64Array(NR).fill(-Infinity), out = new Float64Array(NR), scale = new Float64Array(NR);
for (let i = 0; i < NR; i++) {
  X[i] = -134 + 268 * rnd(); Z[i] = 2 + 2.7 * Math.floor(9 * rnd());
  L[i] = 2.5 + 6 * rnd(); W[i] = 2.5 + 4 * rnd(); H[i] = 2.5;
}
// openings: a room to a neighbour (the nearest few along her length on the same deck, or the deck above), or to the sea
const NO = Math.round(NR * PER);
const A = new Int32Array(NO), B = new Int32Array(NO), kind = new Uint8Array(NO), ox = new Float64Array(NO), oz = new Float64Array(NO),
  wid = new Float64Array(NO), hgt = new Float64Array(NO), q = new Float64Array(NO);
const order = Array.from({ length: NR }, (_, i) => i).sort((a, b) => Z[a] - Z[b] || X[a] - X[b]);
const place = new Int32Array(NR); order.forEach((r, k) => { place[r] = k; });
for (let c = 0; c < NO; c++) {
  const a = Math.floor(NR * rnd()), k = place[a];
  let b = order[Math.min(NR - 1, Math.max(0, k + (rnd() < 0.5 ? -1 : 1) * (1 + Math.floor(3 * rnd()))))];
  kind[c] = rnd() < 0.12 ? 1 : 0;                                        // one in eight a stair or hatch
  if (kind[c] === 1) b = order[Math.min(NR - 1, k + Math.floor(NR / 9))];  // to the deck above
  if (c < 12) { A[c] = -1; B[c] = order[Math.floor(NR / 9 * rnd())]; }    // twelve holes to the sea, low and anywhere
  else { A[c] = a; B[c] = b === a ? order[(k + 1) % NR] : b; }
  const r = B[c];
  ox[c] = X[r]; oz[c] = kind[c] ? Z[r] : Z[r] + 0.05; wid[c] = kind[c] ? 3.0 : 0.8; hgt[c] = kind[c] ? 7.0 : 2.0;
}
function lawUpright(H1, H2, h) { const d = H2 < h ? H2 : h, e = H1 - d, r = H1 > h ? H1 - h : 0; return d * Math.sqrt(H1 - H2) + (2 / 3) * (e * Math.sqrt(e) - r * Math.sqrt(r)); }
function lawLevel(H1, H2, a, p) { const qo = a * Math.sqrt(H1 - H2), qw = p * (2 / 3) * H1 * Math.sqrt(H1); return qo < qw ? qo : qw; }
// the water in a box of length l and height h lying at slope t, its surface d0 over the floor at the middle (per breadth)
function wedge(d0, l, h, t) {
  if (t < 1e-9) return l * Math.min(h, Math.max(0, d0));
  const a = d0 - 0.5 * l * t, b = d0 + 0.5 * l * t;                      // depth at the two ends
  const f = (d) => { const c = d < 0 ? 0 : d > h ? h : d; return d < 0 ? 0 : d > h ? h * d - 0.5 * h * h : 0.5 * c * c; };
  return (f(b) - f(a)) / t;
}
let evals = 0, wet = 0;
function step(pitch, sink) {
  const t = Math.tan(pitch), cp = Math.cos(pitch), sp = Math.sin(pitch);
  wet = 0;
  for (let i = 0; i < NR; i++) {                                         // 1. levels, in the world's height
    const base = -sp * X[i] + cp * Z[i] - sink;
    if (vol[i] <= 1e-9) { lev[i] = -Infinity; continue; }
    wet++;
    const want = vol[i] / W[i], full = L[i] * H[i];
    let lo = -0.5 * L[i] * t, hi = H[i] + 0.5 * L[i] * t;
    if (want >= full) { lev[i] = base + hi * cp; continue; }
    for (let k = 0; k < 14; k++) { const m = 0.5 * (lo + hi); if (wedge(m, L[i], H[i], t) < want) lo = m; else hi = m; }
    lev[i] = base + 0.5 * (lo + hi) * cp;
  }
  out.fill(0);
  for (let c = 0; c < NO; c++) {                                         // 2. flows
    const a = A[c], b = B[c], zc = -sp * ox[c] + cp * oz[c] - sink;
    const Ha = (a < 0 ? 0 : lev[a]) - zc, Hb = lev[b] - zc, H1 = Ha > Hb ? Ha : Hb;
    if (!(H1 > 0)) { q[c] = 0; continue; }
    evals++;
    const H2 = Ha > Hb ? (Hb > 0 ? Hb : 0) : (Ha > 0 ? Ha : 0);
    const v = CD * SQ2G * (kind[c] ? lawLevel(H1, H2, wid[c], hgt[c]) : wid[c] * lawUpright(H1, H2, hgt[c])) * DT;
    q[c] = Ha >= Hb ? v : -v;
    const from = q[c] > 0 ? a : b; if (from >= 0) out[from] += Math.abs(q[c]);
  }
  for (let i = 0; i < NR; i++) scale[i] = out[i] > vol[i] ? vol[i] / out[i] : 1;   // 3. the cut, then the move
  for (let c = 0; c < NO; c++) {
    if (q[c] === 0) continue;
    const a = A[c], b = B[c], from = q[c] > 0 ? a : b, to = q[c] > 0 ? b : a;
    const dv = Math.abs(q[c]) * (from >= 0 ? scale[from] : 1);
    if (from >= 0) vol[from] -= dv;
    if (to >= 0) { const cap = L[to] * W[to] * H[to]; vol[to] = Math.min(cap, vol[to] + dv); }
  }
}
// two hours forty of her time, her head going down and her hull settling as she did, roughly
const STEPS = 38400, marks = [0.25, 0.5, 0.75, 1];
let t0 = process.hrtime.bigint(), done = 0;
console.log(`e71: ${NR} rooms, ${NO} openings (${PER} a room), dt ${DT} s, node ${process.version}`);
for (const m of marks) {
  const upto = Math.round(STEPS * m), n0 = done, e0 = evals, tA = process.hrtime.bigint();
  for (; done < upto; done++) { const f = done / STEPS; step(0.17 * f * f, 9 * f * f); }
  const us = Number(process.hrtime.bigint() - tA) / 1000 / (done - n0);
  console.log(`  to ${(done * DT / 60).toFixed(0).padStart(3)} min: ${us.toFixed(0).padStart(5)} us a step, ${wet} rooms wet, ${((evals - e0) / (done - n0)).toFixed(0)} flows a step`);
}
const total = Number(process.hrtime.bigint() - t0) / 1e9;
console.log(`  the whole night: ${total.toFixed(1)} s for ${STEPS} steps = ${(total / STEPS * 1e6).toFixed(0)} us a step; at her own pace (4 steps a second) ${(total / STEPS * 4 * 100).toFixed(2)} % of one thread; her night runs ${(STEPS * DT / total).toFixed(0)} times faster than she sank`);
