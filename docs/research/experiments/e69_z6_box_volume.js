'use strict';
// e69: Z6's level at any attitude, without column sets (Z1, 2026-11-20; docs/DESIGN_free_body_air_by_space_v1, section
// 2, and its section 9's "about half" of Z6: "the three column sets and the level solve at any attitude").
// Each of the core's column segments (core/core.js, buildShip: a column's share of a space, dx by dy by its height) is a
// box. The volume of a box below a plane is the box's volume times the CDF of a sum of three uniform variables (the
// plane's height over the box's points: each axis's half-width times the world's up along it), exact at any attitude:
// the inclusion-exclusion over the box's corners, (1 / 6 l1 l2 l3) sum (-1)^|S| (t - sum_S l)_+^3, with its derivative
// (the free surface's area within the box) beside it. Where a width is small against the next the sum is the others'
// shifted by its mean (error of order its ratio squared): so the core's own axis, at no angle, is exact too. A box
// wholly below or wholly above is settled by its reach alone; only the boxes the plane cuts take the cubic.
// So the space's volume below a level, its level for a given water, and the free surface's area need no set of columns
// along the ship's x or y, no switch between sets and nothing that jumps when one would switch: one rule, the core's own
// boxes. What it checks:
//   1. the rule against integration (exact along one axis, a 1000 x 1000 midpoint grid over the other two), 200 boxes;
//   2. a space (boiler room 6, port, below E deck: 168 boxes) from 0 to 90 deg of pitch, of roll and of both by 0.1 deg:
//      its half level moves smoothly, Newton's iterations few;
//   3. against the core's own rule (nodePass: the plane at each column's centre line, exact for a prism while the plane
//      crosses its sides) at 0 to 10 deg, where both hold: the same volume at the same level;
//   4. the cost: one pass over the space, and a level from scratch (wall clock: this machine).
//   node docs/research/experiments/e69_z6_box_volume.js [--root <tree>] [--write]
// Output of 2026-11-20: results_2026-11-20/e69_z6_box_volume.txt
const fs = require('fs'), path = require('path');
const argv = process.argv.slice(2), WRITE = argv.includes('--write'), ri = argv.indexOf('--root');
const ROOT = ri >= 0 ? path.resolve(argv[ri + 1]) : path.resolve(__dirname, '../../..');
const C = require(path.join(ROOT, 'core/core.js'));
const out = [], say = (s) => { s = s === undefined ? '' : s; out.push(s); console.log(s); };

// ---------------------------------------------------------------- the CDF of a sum of uniforms, and its density
// widths sorted ascending (l1 <= l2 <= l3); t from the lowest point up; [CDF, PDF]
function cdf1(t, l3) { if (t <= 0) return [0, 0]; if (t >= l3) return [1, 0]; return [t / l3, 1 / l3]; }
function cdf2(t, l2, l3) {
  if (t <= 0) return [0, 0];
  if (t >= l2 + l3) return [1, 0];
  const d = 2 * l2 * l3;
  if (t < l2) return [t * t / d, t / (l2 * l3)];
  if (t < l3) return [(t - 0.5 * l2) / l3, 1 / l3];
  const u = l2 + l3 - t; return [1 - u * u / d, u / (l2 * l3)];
}
const EPS = 1e-5;
function cdf3(t, l1, l2, l3) {
  const top = l1 + l2 + l3;
  if (t <= 0) return [0, 0];
  if (t >= top) return [1, 0];
  if (l2 < EPS * l3) return cdf1(t - 0.5 * (l1 + l2), l3);
  if (l1 < EPS * l2) return cdf2(t - 0.5 * l1, l2, l3);
  const p = (x) => (x > 0 ? x : 0);
  const a = [t, t - l1, t - l2, t - l3, t - l1 - l2, t - l1 - l3, t - l2 - l3, t - top], sg = [1, -1, -1, -1, 1, 1, 1, -1];
  let c = 0, d = 0;
  for (let k = 0; k < 8; k++) { const v = p(a[k]); c += sg[k] * v * v * v; d += sg[k] * v * v; }
  const den = l1 * l2 * l3;
  return [c / (6 * den), d / (2 * den)];
}
// a box below a world level h: its centre's world height zc, its half-widths w (its own axes), g the world's up in its
// axes (a unit vector): [volume, area of the plane within it]
const OUT = [0, 0];
function boxBelow(zc, w, g, h) {
  let l1 = 2 * w[0] * (g[0] < 0 ? -g[0] : g[0]), l2 = 2 * w[1] * (g[1] < 0 ? -g[1] : g[1]), l3 = 2 * w[2] * (g[2] < 0 ? -g[2] : g[2]);
  const half = 0.5 * (l1 + l2 + l3), vol = 8 * w[0] * w[1] * w[2];
  if (h >= zc + half) { OUT[0] = vol; OUT[1] = 0; return OUT; }
  if (h <= zc - half) { OUT[0] = 0; OUT[1] = 0; return OUT; }
  let s;
  if (l1 > l2) { s = l1; l1 = l2; l2 = s; }
  if (l2 > l3) { s = l2; l2 = l3; l3 = s; }
  if (l1 > l2) { s = l1; l1 = l2; l2 = s; }
  const r = cdf3(h - zc + half, l1, l2, l3);
  OUT[0] = vol * r[0]; OUT[1] = vol * r[1]; return OUT;
}

// ---------------------------------------------------------------- 1. the rule against integration
let seed = 7; const rnd = () => { seed = (Math.imul(seed, 1103515245) + 12345) >>> 0; return seed / 4294967296; };
let worst = 0;
for (let trial = 0; trial < 200; trial++) {
  const w = [0.2 + 3 * rnd(), 0.2 + 3 * rnd(), 0.2 + 8 * rnd()];
  let g = [rnd() - 0.5, rnd() - 0.5, rnd() - 0.5]; if (trial % 5 === 0) g = [0, 0, 1]; if (trial % 7 === 0) g = [1e-9, 0.3, 0.95];
  const n = Math.hypot(g[0], g[1], g[2]); g = g.map(v => v / n);
  const span = w[0] * Math.abs(g[0]) + w[1] * Math.abs(g[1]) + w[2] * Math.abs(g[2]), h = (rnd() * 2 - 1) * 1.1 * span;
  const k = Math.abs(g[0]) >= Math.abs(g[1]) && Math.abs(g[0]) >= Math.abs(g[2]) ? 0 : (Math.abs(g[1]) >= Math.abs(g[2]) ? 1 : 2), o = [0, 1, 2].filter(q => q !== k);
  const M = 1000; let acc = 0;
  for (let i = 0; i < M; i++) for (let j = 0; j < M; j++) {
    const u = (-1 + (2 * i + 1) / M) * w[o[0]], v = (-1 + (2 * j + 1) / M) * w[o[1]];
    const tStar = (h - g[o[0]] * u - g[o[1]] * v) / g[k];
    acc += g[k] > 0 ? Math.min(Math.max(tStar + w[k], 0), 2 * w[k]) : Math.min(Math.max(w[k] - tStar, 0), 2 * w[k]);
  }
  const want = acc * (2 * w[o[0]] / M) * (2 * w[o[1]] / M), got = boxBelow(0, w, g, h)[0];
  worst = Math.max(worst, Math.abs(got - want) / (8 * w[0] * w[1] * w[2]));
}
say('e69: Z6\'s level at any attitude: the core\'s column segments as boxes, each below a plane by the CDF of a sum of three uniforms');
say('');
say('1. 200 boxes and planes (one in five with the world\'s up along a box\'s own axis) against integration, exact along one axis and a 1000 x 1000 midpoint grid over the others: the worst difference ' + worst.toExponential(2) + ' of the box (the grid\'s own error is of order 1e-6)');

// ---------------------------------------------------------------- 2. a space of the ship at any attitude
const ship = C.buildShip(), cols = ship.cols;
function spaceBoxes(n) {
  const out2 = [];
  for (let j = ship.nodeStart[n]; j < ship.nodeStart[n] + ship.nodeCount[n]; j++) {
    const i = ship.entCol[j], a = ship.entA[j], b = ship.entE[j];
    out2.push({ c: [cols.x[i], cols.y[i], 0.5 * (a + b)], w: [0.5 * cols.dx[i], 0.5 * cols.dy, 0.5 * (b - a)], A: cols.dxdy[i], a, b, x: cols.x[i], y: cols.y[i] });
  }
  return { boxes: out2, mu: ship.nodeMu[n] };
}
function spaceBelow(sb, R, tz, h) {
  const g = [R[6], R[7], R[8]];
  let V = 0, A = 0;
  for (const b of sb.boxes) { const r = boxBelow(R[6] * b.c[0] + R[7] * b.c[1] + R[8] * b.c[2] + tz, b.w, g, h); V += r[0]; A += r[1]; }
  return [V * sb.mu, A * sb.mu];
}
const poseR = (pitch, roll) => { const ct = Math.cos(pitch), st = Math.sin(pitch), cp = Math.cos(roll), sp = Math.sin(roll); return [ct, st * sp, st * cp, 0, cp, -sp, -st, ct * sp, ct * cp]; };
function levelOf(sb, R, tz, W) {
  let lo = Infinity, hi = -Infinity;
  for (const b of sb.boxes) { const zc = R[6] * b.c[0] + R[7] * b.c[1] + R[8] * b.c[2] + tz, s = b.w[0] * Math.abs(R[6]) + b.w[1] * Math.abs(R[7]) + b.w[2] * Math.abs(R[8]); if (zc - s < lo) lo = zc - s; if (zc + s > hi) hi = zc + s; }
  let a = lo, c = hi, h = 0.5 * (lo + hi), it = 0;
  for (; it < 60; it++) {
    const [V, A] = spaceBelow(sb, R, tz, h), err = V - W;
    if (Math.abs(err) < 1e-9 * W + 1e-9) break;
    if (err > 0) c = h; else a = h;
    let hn = A > 0 ? h - err / A : 0.5 * (a + c);
    if (!(hn > a && hn < c)) hn = 0.5 * (a + c);
    h = hn;
  }
  return { h, it };
}
const n0 = 6 * 4 + 0 * 2 + 0;                       // zone 6 (boiler room 6), port, below E deck: the core's node order
const sb = spaceBoxes(n0), Vfull = spaceBelow(sb, poseR(0, 0), 0, 1e6)[0];
say('2. space ' + n0 + ' (boiler room 6, port, below E deck): ' + sb.boxes.length + ' boxes, ' + Vfull.toFixed(1) + ' m3 (the core\'s nodeVmax ' + ship.nodeVmax[n0].toFixed(1) + '); the level holding half of it, 0 to 90 deg by 0.1');
for (const [label, fR] of [['pitch', (d) => poseR(d, 0)], ['roll', (d) => poseR(0, d)], ['both (roll 0.6 x pitch)', (d) => poseR(d, 0.6 * d)]]) {
  let prev = null, jump = 0, its = 0;
  for (let k = 0; k <= 900; k++) {
    const s = levelOf(sb, fR(k * 0.1 * Math.PI / 180), 0, 0.5 * Vfull);
    its = Math.max(its, s.it);
    if (prev !== null) jump = Math.max(jump, Math.abs(s.h - prev));
    prev = s.h;
  }
  say('   ' + label.padEnd(24) + ' the level moves at most ' + jump.toFixed(4) + ' m a step; Newton at most ' + its + ' iterations');
}

// ---------------------------------------------------------------- 3. against the core's own rule at small angles
for (const [pd, rd] of [[0, 0], [2, 1], [5, 3], [10, 5]]) {
  const R = poseR(pd * Math.PI / 180, rd * Math.PI / 180), lv = levelOf(sb, R, 0, 0.5 * Vfull);
  let Vc = 0;
  for (const b of sb.boxes) { const base = R[6] * b.x + R[7] * b.y, zp = (lv.h - base) / R[8]; if (zp <= b.a) continue; Vc += b.A * ((zp >= b.b ? b.b : zp) - b.a); }
  Vc *= sb.mu;
  say('3. pitch ' + String(pd).padStart(2) + ', roll ' + rd + ': at this rule\'s level for half the space the core\'s rule holds ' + Vc.toFixed(3) + ' m3 against ' + (0.5 * Vfull).toFixed(3) + ' (' + ((Vc / (0.5 * Vfull) - 1)).toExponential(1) + ')');
}

// ---------------------------------------------------------------- 4. the cost
{
  const R = poseR(0.6, 0.2), t0 = process.hrtime.bigint(); let s = 0, n = 0;
  for (let k = 0; k < 200; k++) { s += levelOf(sb, R, 0, (0.2 + 0.6 * (k % 7) / 7) * Vfull).it; n++; }
  const us = Number(process.hrtime.bigint() - t0) / 1e3 / n;
  const t1 = process.hrtime.bigint(); for (let k = 0; k < 2000; k++) spaceBelow(sb, R, 0, 0.1 * k - 50);
  const us1 = Number(process.hrtime.bigint() - t1) / 1e3 / 2000;
  say('4. one pass over the space\'s ' + sb.boxes.length + ' boxes: ' + us1.toFixed(2) + ' us; a level from scratch: ' + us.toFixed(1) + ' us (' + (s / n).toFixed(1) + ' iterations). Wall clock, this machine and its load');
  say('   so a piece\'s spaces, about 30 cut by their levels, one or two passes each from the last sub-step\'s level: of the order of 50 to 100 us a sub-step (v1, section 6, sized Z6 at 50 to 80)');
}
say('');
say('The design\'s three column sets (v1, sections 2 and 9: "about half" of Z6) are not needed: the core\'s own boxes, by this rule, give the volume, the level and the free surface\'s area at any attitude, exactly, with nothing to switch.');
if (WRITE) { const p = path.join(__dirname, 'results_2026-11-20', 'e69_z6_box_volume.txt'); fs.writeFileSync(p, out.join('\n') + '\n'); console.log('wrote ' + path.relative(path.join(__dirname, '../../..'), p)); }
