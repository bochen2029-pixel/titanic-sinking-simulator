// wake_tests.js: her wake as a wave field (site/parts/24_wake_field.js), headless. Each row sets a cause and reads an
// outcome; nothing in the library is told what a wake looks like.
//   node tools/wake_tests.js            about a minute and a half; the table -> out/wake_tests.txt (tools/outdir.js)
// What is checked, and against what:
//   1  Michell's integral as coded, on Wigley's parabolic hull, against Peri's published figures
//   2  a field driven straight at 22.5 kn in a plain periodic box: the energy her hull leaves on the sea a second, over her
//      speed, against Michell's integral for the same waves (the two share no formula); the work the library meters
//   3  the transverse wavelength on her track against 2 pi U^2 / g;  4  the wedge's edge against Kelvin's 19.47 degrees
//   5  the baked scale against Holtrop's wave resistance; the page's two windows together, scaled, against it
//   6  port against starboard;  7  the helm hard over: outside against inside, and the same with her sideways motion left out
//   8  a window twice the size: nothing comes back off an edge
//   9  the white water's causes: speed (the breakers), thrust (the races), the shafts' direction, the bow's sheet
//   10 a field let go (time ran too fast) and made again from the record, against one that never was
//   11 her hull in the picture;  12 the same record gives the same bytes;  what a step costs (reported, not in the table)
//   13 the record cut back while the player is paused inside a sample (joint gate 2, 2026-11-20), and bounded with none
//   14 K4: the sea against her sides (her drawn waterline): her bow wave at her stem by the law (Noblesse and others 2008)
//      at 22.5 kn and at four speeds, the law on K6's two benchmark hulls, her own waves along her, the turn, and the
//      sea against her held as the last refresh left it while a window moves on after her
'use strict';
const fs = require('fs');
const C = require('../core/core.js');
const M = require('../core/motion.js');
const WF = require('../site/parts/24_wake_field.js');
const SP = require('./wake_spectrum.js');
const outFile = require('./outdir');
const G = C.GRAV, RHO = C.RHO, KN = WF.KN, DEG = Math.PI / 180, DT = 0.25, CFG = WF.CFG;
const lines = []; let fails = 0, n = 0;
const f = (v, d) => (v === null || v === undefined || !isFinite(v) ? 'n/a' : v.toFixed(d === undefined ? 0 : d));
function row(what, value, ref, ok, quiet) {
  n++; if (!ok) fails++;
  const s = (ok ? 'PASS ' : 'FAIL ') + what.padEnd(104) + ' ' + String(value).padEnd(60) + ' ' + ref;
  console.log(s); if (!quiet) lines.push(s);
}
const note = (s, quiet) => { console.log(s); if (!quiet) lines.push(s); };
const hull = WF.herHull(), L = M.SHIP.L;
const sample = (m, X0, Y0) => ({ t: m.t, X: (X0 || 0) + m.X, Y: (Y0 || 0) + m.Y, psi: m.psi, u: m.u, v: m.v, r: m.r, TP: m.TP, TS: m.TS, TC: m.TC, nP: m.nP, nS: m.nS, nC: m.nC, del: m.del });
const T0 = Date.now();

// ================================================================ 1. Michell's integral on Wigley's hull
note('1. MICHELL\'S INTEGRAL AS CODED, on Wigley\'s parabolic hull (L/B 10, B/T 1.6)');
{
  const Lw = 100, B = 10, T = 6.25, Yf = (x, z) => (Math.abs(x) > Lw / 2 ? 0 : 0.5 * B * (1 - 4 * x * x / (Lw * Lw)) * (1 - z * z / (T * T)));
  const g = WF.hullGrid(Yf, -Lw / 2, Lw / 2, T, 0.125, 51);
  let S = 0; const hx = 0.05, hz = 0.05;
  for (let x = -Lw / 2 + hx / 2; x < Lw / 2; x += hx) for (let z = -T + hz / 2; z < 0; z += hz) {
    const yx = 0.5 * B * (-8 * x / (Lw * Lw)) * (1 - z * z / (T * T)), yz = 0.5 * B * (1 - 4 * x * x / (Lw * Lw)) * (-2 * z / (T * T));
    S += 2 * Math.sqrt(1 + yx * yx + yz * yz) * hx * hz;
  }
  const PERI = [[0.25, 1.064], [0.316, 1.831], [0.45, 4.154]], got = PERI.map(([Fn]) => { const U = Fn * Math.sqrt(G * Lw); return 1000 * WF.michell(g, U, { L: Lw, step: 0.05, kMax: 60 }).Rw / (0.5 * RHO * U * U * S); });
  row('Cw x 1000 at Froude 0.25, 0.316 and 0.45 (Rw / (0.5 rho U^2 S), S ' + f(S / (Lw * Lw), 4) + ' L^2)', got.map(v => f(v, 3)).join(', '), 'Peri\'s 1.064, 1.831, 4.154, each within 0.1 % (research note R8, 2.1)', got.every((v, i) => Math.abs(v / PERI[i][1] - 1) < 1e-3));
}

// ================================================================ a plain periodic box, as the prototype's (e51): 4 km of 8 m cells
const BOX = { n: 512, dx: 8 };
function boxRun(orders, tEnd, o) {
  o = o || {};
  const w = WF.createWindow({ n: BOX.n, dx: BOX.dx, edge: false }); WF.prepare(w, hull, 0); w.placed = true; w.meter = true;
  const m = M.create({ knots: 22.5 }), X0 = o.X0, Y0 = o.Y0, track = [], E = {}, Wk = {}, rec = {}; let oi = 0;
  while (m.t < tEnd - 1e-9) {
    while (oi < orders.length && m.t >= orders[oi][0] - 1e-9) { orders[oi][1](m); oi++; }
    M.stepAlone(m, DT);
    const st = sample(m, X0, Y0);
    WF.step(w, st, DT, Math.min(1, m.t / 20), o.noSide);        // her sources brought in over 20 s; no scale: thin-ship's own heights
    if (Math.abs(m.t % 2) < 1e-9) track.push([st.X, st.Y]);
    if (Math.abs(m.t % 30) < 1e-9) { E[m.t] = WF.energy(w); Wk[m.t] = w.work; rec[m.t] = st; }
  }
  return { w, m, track, E, Wk, rec, last: sample(m, X0, Y0), h: WF.heights(w) };
}

// ================================================================ 2 to 4, 6. straight at 22.5 knots
note('\n2 to 4, 6. STRAIGHT AT 22.5 kn FOR 300 s in a plain periodic box of ' + BOX.n + ' x ' + BOX.n + ' cells of ' + BOX.dx + ' m (thin-ship\'s own heights, unscaled)');
{
  const R = boxRun([], 300, { X0: 400, Y0: 2048 }), w = R.w, h = R.h, U = R.last.u, k0 = G / (U * U), X = R.last.X, Y = R.last.Y;
  const mi = WF.michell(hull, U, { L, kHi: w.kHi, soft: true }), RwE = (R.E[300] - R.E[150]) / 150 / U, RwW = (R.Wk[300] - R.Wk[150]) / 150 / U;
  row('2  the energy her hull leaves on the sea a second, over her speed (150 to 300 s)', f(RwE / 1000, 1) + ' kN', 'Michell\'s integral for the same waves (longer than ' + f(2 * Math.PI / w.kHi, 1) + ' m): ' + f(mi.Rw / 1000, 1) + ' kN, within 1 %', Math.abs(RwE / mi.Rw - 1) < 0.01);
  row('   the work the library meters on her hull\'s push, over her speed', f(RwW / 1000, 1) + ' kN', 'the same energy, within 0.5 %', Math.abs(RwW / RwE - 1) < 0.005);
  const xs = []; let prev = null; for (let s = 250; s <= 1500; s += 1) { const v = WF.at(w, h, X - s, Y); if (prev !== null && prev < 0 && v >= 0) xs.push(s - v / (v - prev)); prev = v; }
  const lam = (xs[xs.length - 1] - xs[0]) / (xs.length - 1), lam0 = 2 * Math.PI * U * U / G;
  row('3  the transverse waves on her track, 250 to 1,500 m astern: ' + xs.length + ' of them', f(lam, 2) + ' m apart', '2 pi U^2 / g = ' + f(lam0, 2) + ' m, within 0.5 %', xs.length > 8 && Math.abs(lam / lam0 - 1) < 0.005);
  const hts = [300, 600, 1000].map(s0 => { let lo = 1e9, hi = -1e9; for (let s = s0 - 45; s <= s0 + 45; s += 1) { const v = WF.at(w, h, X - s, Y); if (v < lo) lo = v; if (v > hi) hi = v; } return hi - lo; });
  const sph = [300, 600, 1000].map(s0 => 2 * mi.A0 * Math.sqrt(2 * Math.PI / (k0 * (s0 + 129))));
  row('   their height, crest to trough, 300, 600 and 1,000 m astern', hts.map(v => f(v, 2)).join(', ') + ' m', 'the far-field law from Michell\'s |A| astern: ' + sph.map(v => f(v, 2)).join(', ') + ' m; met as distance grows (within 10 % at 1,000 m)', Math.abs(hts[2] / sph[2] - 1) < 0.10 && Math.abs(hts[1] / sph[1] - 1) > Math.abs(hts[2] / sph[2] - 1));
  // the wedge: the farthest out that the waves are a quarter as high as the highest at that distance astern
  const edge = [600, 1000, 1400].map(s0 => {
    const span = (y) => { let lo = 1e9, hi = -1e9; for (let s = s0 - 60; s <= s0 + 60; s += 2) { const v = WF.at(w, h, X - s, Y + y); if (v < lo) lo = v; if (v > hi) hi = v; } return hi - lo; };
    let best = 0; for (let y = 40; y <= 900; y += 2) best = Math.max(best, span(y));
    let e = 0; for (let y = 900; y >= 40; y -= 2) if (span(y) >= 0.25 * best) { e = y; break; }
    return Math.atan(e / (s0 + 129)) / DEG;
  });
  row('4  the wedge\'s edge from her stem, 600, 1,000 and 1,400 m astern', edge.map(v => f(v, 1)).join(', ') + ' deg', 'Kelvin\'s 19.47 deg, approached from outside: falling, never below, within 1.5 deg at 1,400 m', edge[0] > edge[1] && edge[1] > edge[2] && edge[2] > 19.47 && edge[2] < 19.47 + 1.5);
  let worst = 0, big = 0; for (let s = -100; s <= 1500; s += 25) for (let y = 16; y <= 600; y += 24) { const a = WF.at(w, h, X - s, Y + y), b = WF.at(w, h, X - s, Y - y); worst = Math.max(worst, Math.abs(a - b)); big = Math.max(big, Math.abs(a)); }
  row('6  port against starboard, at ' + (65 * 25) + ' pairs of places', 'they differ by at most ' + (worst / big).toExponential(1) + ' of the highest wave', 'mirror images to rounding (under 1e-9)', worst / big < 1e-9);
}

// ================================================================ 5. the scale
note('\n5. THE SCALE: the page\'s wake carries off what Holtrop\'s method spends on waves');
{
  const kns = [14, 18, 22.5], fresh = kns.map(SP.scaleAt), baked = kns.map(k => WF.scale(k * KN));
  row('5  the scale baked into the library at 14, 18 and 22.5 kn', baked.map(v => f(v, 4)).join(', '), 'sqrt(Rw Holtrop / Rw Michell) from these sources: ' + fresh.map(v => f(v, 4)).join(', ') + ', to 6 figures', baked.every((v, i) => Math.abs(v / fresh[i] - 1) < 2e-6));
  const U = 22.5 * KN, all = WF.michell(hull, U, { L }).Rw, hol = SP.holtrop(U).RW, c = WF.scale(U);
  row('   so her waves at 22.5 kn carry off', f(c * c * all * U / 1e6, 2) + ' MW (' + f(c * c * all / 1000, 1) + ' kN)', 'Holtrop\'s wave resistance at her speed: ' + f(hol * U / 1e6, 2) + ' MW (' + f(hol / 1000, 1) + ' kN; ' + f(100 * hol / SP.Rmodel(U), 1) + ' % of the motion model\'s resistance), within 0.01 %', Math.abs(c * c * all / hol - 1) < 1e-4);
  const mid = [18.125, 21.625, 22.375].map(k => WF.scale(k * KN) / SP.scaleAt(k));
  row('   between the table\'s speeds (18.125, 21.625, 22.375 kn) the table read by line', mid.map(v => f(100 * (v - 1), 2)).join(', ') + ' % off', 'within 1 % above 18 kn (below 14 kn the table is coarse against her humps and hollows, and her waves are a few kW)', mid.every(v => Math.abs(v - 1) < 0.01));
  // the two windows together, as the page runs them: the work her hull does on each, metered, a second, over her speed
  const W = WF.createWake(); WF.work(W, 0); W.near.meter = W.far.meter = true;
  const m = M.create({ knots: 22.5 }); let w0 = 0, t0 = 0;
  while (m.t < 60 - 1e-9) { M.stepAlone(m, DT); WF.push(W, sample(m)); WF.work(W, 0); if (Math.abs(m.t - 20) < 1e-9) { w0 = W.near.work + W.far.work; t0 = m.t; } }
  const Rw = (W.near.work + W.far.work - w0) / (m.t - t0) / m.u, far = WF.michell(hull, m.u, { L, kHi: W.far.kHi, soft: true }).Rw, near = WF.michell(hull, m.u, { L, kLo: W.near.kLo, kHi: W.near.kHi, soft: true }).Rw, cc = WF.scale(m.u);
  row('   the page\'s two windows together, following her with their edges tapered: her hull\'s work on them over her speed', f(Rw / 1000, 1) + ' kN', 'the scale squared times Michell for the two windows\' waves, ' + f(cc * cc * (far + near) / 1000, 1) + ' kN, within 2 %: nothing comes back to her', Math.abs(Rw / (cc * cc * (far + near)) - 1) < 0.02);
  row('   and of Holtrop\'s wave resistance that is', f(100 * Rw / SP.holtrop(m.u).RW, 1) + ' %', 'all but the waves shorter than ' + f(2 * Math.PI / W.near.kHi, 1) + ' m, which the fine window cannot hold: over 95 %', Rw / SP.holtrop(m.u).RW > 0.95 && Rw / SP.holtrop(m.u).RW < 1.005);
}

// ================================================================ 7. the helm hard over
note('\n7. HARD-A-STARBOARD (her head to port) AT 40 s, HELD TO 300 s, in the plain box');
{
  const lop = (R) => {
    let so = 0, si = 0, k = 0;
    for (let i = R.track.length - 19; i > R.track.length - 44 && i > 1; i -= 2) {       // 37 to 87 s back along her track (a point every 2 s)
      const p = R.track[i], q = R.track[i - 1], tx = p[0] - q[0], ty = p[1] - q[1], tl = Math.sqrt(tx * tx + ty * ty), nx = -ty / tl, ny = tx / tl;   // to starboard of her track: the outside of a turn to port
      for (let d = 60; d <= 260; d += 20) { const a = WF.at(R.w, R.h, p[0] + nx * d, p[1] + ny * d), b = WF.at(R.w, R.h, p[0] - nx * d, p[1] - ny * d); so += a * a; si += b * b; k++; }
    }
    return [Math.sqrt(so / k), Math.sqrt(si / k)];
  };
  const turn = [[40, (m) => M.rudder(m, -40)]], A = boxRun(turn, 300, { X0: 700, Y0: 2900 }), B = boxRun(turn, 300, { X0: 700, Y0: 2900, noSide: true });
  const s = A.last, a = lop(A), b = lop(B);
  note('   steady in the turn (the motion model\'s): ' + f(Math.sqrt(s.u * s.u + s.v * s.v) / KN, 1) + ' kn, turning ' + f(Math.abs(s.r) / DEG, 2) + ' deg/s; the water meets her stem ' + f(Math.abs(Math.atan2(s.v + s.r * 129, s.u)) / DEG, 1) + ' deg on the inside bow and her stern ' + f(Math.abs(Math.atan2(s.v - s.r * 129, s.u)) / DEG, 1) + ' deg on the outside');
  row('7  the sea 60 to 260 m either side of her track, 300 to 700 m back: rms height outside the turn over inside', f(a[0], 3) + ' m over ' + f(a[1], 3) + ' m: ' + f(a[0] / a[1], 2), 'over 1.5: a turning hull throws its wake outward', a[0] / a[1] > 1.5);
  row('   the same with her sideways motion left out of the forcing (the same track)', f(b[0], 3) + ' m over ' + f(b[1], 3) + ' m: ' + f(b[0] / b[1], 2), 'over 1.5 too: the lopsidedness is the curve of her track (her wake is crowded inside the circle and spread outside it)', b[0] / b[1] > 1.5);
  row('   the wave energy on the sea at 300 s, with her sideways motion and without', f(A.E[300] / 1e9, 2) + ' GJ and ' + f(B.E[300] / 1e9, 2) + ' GJ', 'more with it, by over a third: her drift and her swing make waves of their own, on both sides', A.E[300] > 1.33 * B.E[300]);
}

// ================================================================ 8. a window twice the size
note('\n8. THE EDGES: the same band in a window twice the size, both following her straight at 22.5 kn');
{
  const cmp = (o) => {
    const mk = (nn) => { const w = WF.createWindow({ n: nn, dx: o.dx, kLo: o.kLo, kHi: o.kHi, spongeEvery: o.sponge }); WF.prepare(w, hull, 0); return w; };
    const a = mk(256), b = mk(512), m = M.create({ knots: 22.5 }), back = o.lead * 256 * o.dx;
    while (m.t < o.T - 1e-9) { M.stepAlone(m, DT); const st = sample(m), g = Math.min(1, m.t / 20); for (const w of [a, b]) { WF.follow(w, st.X - back, st.Y, st.t); WF.step(w, st, DT, g); } }
    const ha = WF.heights(a), hb = WF.heights(b), X = m.X, Y = m.Y, half = 128 * o.dx, in0 = half - (CFG.dead + CFG.ramp) * o.dx;   // the smaller window's untapered part
    const meas = (y1) => { let d2 = 0, s2 = 0, k = 0; for (let x = -back - in0 + 2 * o.dx; x <= -back + in0 - 2 * o.dx; x += o.step) for (let y = -y1; y <= y1; y += o.step) { const p = WF.at(a, ha, X + x, Y + y), q = WF.at(b, hb, X + x, Y + y); d2 += (p - q) * (p - q); s2 += q * q; k++; } return { d: Math.sqrt(d2 / k), s: Math.sqrt(s2 / k), k }; };
    return { wake: meas(o.wake), all: meas(in0 - 2 * o.dx), in0, ahead: in0 - back - hull.xStem };
  };
  const kS = 2 * Math.PI / CFG.split;
  const nr = cmp({ dx: CFG.dxNear, kLo: kS, sponge: CFG.spongeNear, lead: CFG.leadNear, T: 150, step: 2 * CFG.dxNear, wake: 150 });
  row('8  the fine window (' + (256 * CFG.dxNear) + ' m; ' + f(nr.ahead) + ' m of it untapered ahead of her stem) against one of ' + (512 * CFG.dxNear) + ' m: in her wake, within 150 m of her track', 'they differ by ' + f(100 * nr.wake.d / nr.wake.s, 2) + ' % (rms, of an rms height of ' + f(nr.wake.s, 3) + ' m, at ' + nr.wake.k + ' places)', 'under 2 %: what leaves a window does not come back', nr.wake.d / nr.wake.s < 0.02);
  row('   anywhere in its untapered ' + f(2 * nr.in0) + ' m square', 'by ' + f(1000 * nr.all.d, 1) + ' mm rms, ' + f(100 * nr.all.d / nr.wake.s, 1) + ' % of the wake\'s rms height', 'under 5 % of it (far abeam, outside her wedge, there is next to nothing to compare with: ' + f(1000 * nr.all.s) + ' mm rms over the whole square)', nr.all.d / nr.wake.s < 0.05);
  const fr = cmp({ dx: CFG.dxFar, kHi: kS, sponge: CFG.spongeFar, lead: CFG.leadFar, T: 300, step: 3 * CFG.dxFar, wake: 450 });
  row('   the wide window (' + (256 * CFG.dxFar) + ' m; ' + f(fr.ahead) + ' m ahead of her stem) against one of ' + (512 * CFG.dxFar) + ' m: in her wake, within 450 m of her track', 'they differ by ' + f(100 * fr.wake.d / fr.wake.s, 2) + ' % (rms, of ' + f(fr.wake.s, 3) + ' m, at ' + fr.wake.k + ' places)', 'under 2 %', fr.wake.d / fr.wake.s < 0.02);
  row('   anywhere in its untapered ' + f(2 * fr.in0) + ' m square', 'by ' + f(1000 * fr.all.d, 1) + ' mm rms, ' + f(100 * fr.all.d / fr.wake.s, 1) + ' % of the wake\'s rms height', 'under 5 % of it', fr.all.d / fr.wake.s < 0.05);
}

// ================================================================ 9 to 12. her wake as the page runs it
// a watch of the motion model alone, fed to a wake sample by sample (as the page's part does); orders: [t, fn(m)]
function wakeRun(kn, orders, tEnd, o) {
  o = o || {};
  const W = WF.createWake(); WF.work(W, 0);
  const m = M.create({ knots: kn }), marks = {}; let oi = 0;
  while (m.t < tEnd - 1e-9) {
    while (oi < orders.length && m.t >= orders[oi][0] - 1e-9) { orders[oi][1](m); oi++; }
    M.stepAlone(m, DT); WF.push(W, sample(m));
    const fast = o.fast && m.t > o.fast[0] && m.t <= o.fast[1];
    WF.work(W, 0, !fast); if (W.live && Math.abs(m.t % 0.5) < 1e-9) WF.refresh(W);       // the sea refreshed twice a second of hers, as the page does at her own pace
    if (o.at && o.at.some(t => Math.abs(m.t - t) < 1e-9)) marks[m.t] = { made: Object.assign({}, W.made), kn: m.u / KN, T: m.TP + m.TS + m.TC, nP: m.nP, sumB: W.sumB, sumW: W.sumW };
  }
  return { W, m, marks };
}
const rate = (R, t0, t1, k) => (R.marks[t1].made[k] - R.marks[t0].made[k]) / (t1 - t0);
const whiteArea = (W, A, lim) => { let k = 0; for (let o = 0; o < A.length; o++) if (A[o] > lim) k++; return k * W.near.dx * W.near.dx; };
note('\n9. THE WHITE WATER\'S CAUSES (the wake as the page runs it: two windows, the scale, the record of her motion)');
let full = null;
{
  full = wakeRun(22.5, [], 40, { at: [20, 40] });
  const slow = wakeRun(14, [], 40, { at: [20, 40] }), bF = rate(full, 20, 40, 'breaking'), bS = rate(slow, 20, 40, 'breaking');
  note('   at 22.5 kn: ' + f(whiteArea(full.W, full.W.fb, 0.3)) + ' m2 of sea white from breaking and the bow\'s sheets, ' + f(whiteArea(full.W, full.W.fw, 0.3)) + ' m2 from the races (in the fine window; foam over 0.3)');
  row('9  foam made a second where the sea is too steep to stand: at 14 kn against 22.5 kn', f(bS, 2) + ' against ' + f(bF, 2) + ': ' + f(100 * bS / bF, 1) + ' %', 'under 5 %: her waves\' energy falls from 4.2 MW to 0.09, and the feathers go with it; no rule about speed is in the law', bF > 0 && bS / bF < 0.05);
  row('   the bow\'s sheet by the bow-wave relation: its strength at 22.5, 18, 10 and 5 kn', [22.5, 18, 10, 5].map(k => f(WF.bowShare(hull, k * KN), 2)).join(', '), '1 at 22.5 kn, falling with speed; nought below the speed at which her bow wave stops overturning (about 6 kn for her waterline\'s ' + f(Math.atan(WF.waterline(hull, hull.xStem - 10) / 10) / DEG, 1) + ' deg)', WF.bowShare(hull, 22.5 * KN) === 1 && WF.bowShare(hull, 18 * KN) < 1 && WF.bowShare(hull, 10 * KN) < WF.bowShare(hull, 18 * KN) && WF.bowShare(hull, 5 * KN) === 0);
  // the white road's width: where the races' foam is over a tenth of its strength on her track, across her wake
  {
    const W = full.W, s = W.st, B = C.G.B, widths = [150, 400, 1000].map(d => {
      const x = -129.5 - d, near = d < 420, vals = []; let top = 0;
      for (let y = -200; y <= 200; y += 2) { const v = near ? WF.at(W.near, W.fw, s.X + x, s.Y + y) : WF.at(W.far, W.fwFar, s.X + x, s.Y + y); vals.push(v); if (v > top) top = v; }   // she heads north in these runs
      let lo = 0, hi = vals.length - 1; while (lo < hi && vals[lo] < 0.1 * top) lo++; while (hi > lo && vals[hi] < 0.1 * top) hi--;
      return 2 * (hi - lo);
    }), law = [150, 400, 1000].map(d => Math.max(21, 0.5 * 1.9 * Math.pow(B, 0.8) * Math.pow(d, 0.2)));
    row('   the white road\'s width 150, 400 and 1,000 m astern of her (the races\' foam over a tenth of its strength on her track)', widths.map(v => f(v)).join(', ') + ' m', 'half the measured width of a ship\'s bubble wake, 1.9 B^0.8 x^0.2, and not less than her races\' span (research note R9): ' + law.map(v => f(v)).join(', ') + ' m; each within a factor of 1.5 (the spreading is set from that law)', widths.every((v, i) => v > law[i] / 1.5 && v < law[i] * 1.5));
  }
  // Stop from Full: the races follow the shafts, not her speed
  const stop = wakeRun(22.5, [[20, (m) => M.telegraph(m, 'stop')]], 80, { at: [10, 20, 60, 80] }), r0 = rate(stop, 10, 20, 'race'), r1 = rate(stop, 60, 80, 'race'), q = stop.marks[80];
  row('   "Stop" from Full ahead: foam made a second in the races 40 to 60 s after the order, against before it', f(r1, 2) + ' against ' + f(r0, 2) + ': ' + f(100 * r1 / r0, 1) + ' %, at ' + f(q.kn, 1) + ' kn', 'under 15 % while she still makes over 15 kn: the white road is her screws\', and stops with them (what is left is her hull\'s own wake)', r1 / r0 < 0.15 && q.kn > 15);
  // Full astern from Full: the wing screws throw their races forward
  const ast = wakeRun(22.5, [[20, (m) => M.telegraph(m, 'full astern')]], 100, { at: [10, 20, 80, 100] }), r2 = rate(ast, 80, 100, 'race'), qa = ast.marks[100];
  row('   "Full astern" from Full ahead: foam made a second in the races 60 to 80 s after the order', f(r2, 2) + ' (before it ' + f(rate(ast, 10, 20, 'race'), 2) + '), her wing shafts at ' + f(qa.nP, 0) + ' rpm, thrust ' + f(qa.T / 1e6, 2) + ' MN, at ' + f(qa.kn, 1) + ' kn', 'made again, by shafts turning astern, along her quarters ahead of the screws', r2 > 0.3 * rate(ast, 10, 20, 'race') && qa.nP < 0 && qa.T < 0);
}

note('\n10 to 12. A FIELD LET GO AND MADE AGAIN; HER HULL IN THE PICTURE; THE SAME RECORD, THE SAME BYTES');
{
  // the same watch twice: once followed all the way, once with time running too fast to follow from 40 to 120 s
  const again = (orders) => {
    const A = wakeRun(22.5, orders, 150), B = wakeRun(22.5, orders, 150, { fast: [40, 120] }), s = sample(A.m), c = Math.cos(s.psi), sn = Math.sin(s.psi);
    const sea = (W, x, y) => { const X = s.X + x * c - y * sn, Y = s.Y + x * sn + y * c; return WF.at(W.near, W.hNear, X, Y) + WF.at(W.far, W.hFar, X, Y); };
    let d2 = 0, s2 = 0, k = 0; for (let x = -400; x <= 110; x += 10) for (let y = -150; y <= 150; y += 12) { const p = sea(A.W, x, y), q = sea(B.W, x, y); d2 += (p - q) * (p - q); s2 += p * p; k++; }
    return { A, B, rel: Math.sqrt(d2 / s2), k, live: A.W.live && B.W.live };
  };
  const st8 = again([]), tn = again([[20, (m) => M.rudder(m, -40)]]), A = st8.A, A2 = wakeRun(22.5, [], 150);
  row('10 time ran too fast to follow from 40 to 120 s and the field was made again from her record: the sea round her at 150 s, on a straight course', 'differs by ' + f(100 * st8.rel, 1) + ' % (rms, at ' + st8.k + ' places) from the field that followed her all the way', 'under 2 %: the wake is her record\'s, not the history of the page', st8.live && st8.rel < 0.02);
  row('   the same through a hard-over turn (the helm put over at 20 s)', 'differs by ' + f(100 * tn.rel, 1) + ' %', 'under 6 %: the fine window is made again from her last ' + CFG.spanNear + ' s only, and in a turn some older short waves are still about her', tn.live && tn.rel < 0.06);
  row('   its white water in the turn: the races\' and the breakers\' foam on the fine grid', f(tn.B.W.sumW, 0) + ' and ' + f(tn.B.W.sumB, 0) + ' against ' + f(tn.A.W.sumW, 0) + ' and ' + f(tn.A.W.sumB, 0), 'the races within 10 %, the breakers within 20 % (made again at 1 s steps over the last ' + CFG.spanBreak + ' s)', Math.abs(tn.B.W.sumW / tn.A.W.sumW - 1) < 0.10 && Math.abs(tn.B.W.sumB / tn.A.W.sumB - 1) < 0.20);
  // her hull in the picture
  const b0 = WF.waterline(hull, 0), y3 = WF.fieldY(hull, 0, b0 + 3), back = WF.seaY(hull, 0, y3), W = full.W, st = W.st;
  let far = 0, most = 0; for (let a = 1; a < W.n - 1; a++) for (let b = 1; b < W.n - 1; b++) {
    const X = W.near.X0 + a * W.near.dx - st.X, Y = W.near.Y0 + b * W.near.dx - st.Y, x = X * Math.cos(st.psi) + Y * Math.sin(st.psi), y = -X * Math.sin(st.psi) + Y * Math.cos(st.psi);
    if (x > -100 && x < hull.xStem - 50 && W.fb[a * W.n + b] > 0.25) { const out = Math.abs(WF.seaY(hull, x, y)) - WF.waterline(hull, x); if (out > far) far = out; most++; }
  }
  row('11 her hull in the picture: water 3 m off her plating amidships is read in the field', f(y3, 2) + ' m off her centre line (and back: ' + f(back - b0, 3) + ' m off her plating)', 'sqrt((b + 3)^2 - b^2) = ' + f(Math.sqrt(6 * b0 + 9), 2) + ' m for her half-breadth of ' + f(b0, 2) + ' m', Math.abs(y3 - Math.sqrt(6 * b0 + 9)) < 1e-9 && Math.abs(back - b0 - 3) < 1e-9);
  row('   the white water along her sides at 22.5 kn (foam over 0.25, from 50 m abaft her stem to 100 m abaft amidships)', most + ' cells, none farther than ' + f(far, 1) + ' m off her plating', 'a band along her plating (within 15 m), left there by her bow\'s sheets with nothing carrying it', most > 20 && far < 15);
  const same = (p, q) => { if (p.length !== q.length) return false; for (let i = 0; i < p.length; i++) if (p[i] !== q[i]) return false; return true; };
  row('12 the same record fed to another wake', 'the three textures ' + (same(A.W.texNear, A2.W.texNear) && same(A.W.texFar, A2.W.texFar) && same(A.W.texRace, A2.W.texRace) ? 'are the same bytes' : 'differ'), 'the same bytes: nothing in it but her motion (' + A.W.texNear.length + ' + ' + A.W.texFar.length + ' + ' + A.W.texRace.length + ')', same(A.W.texNear, A2.W.texNear) && same(A.W.texFar, A2.W.texFar) && same(A.W.texRace, A2.W.texRace));
  const cst = A2.W.cost;
  note('what it cost here, one thread, whatever else this machine was doing (not in the table): a sample played ' + f(cst.ms / cst.samples, 2) + ' ms, a refresh of the sea ' + f(cst.refreshMs / cst.refreshes, 2) + ' ms; the page takes them a piece at a time (tools/wake_site_test.js times it in a browser)', true);
}

// ================================================================ 13. the record cut back under a paused player
// Joint gate 2 (2026-11-20): systems_site ran three watches to the flag at 900x. The record (2,400 samples, cut back when
// it passes twice that) was cut while the player was paused inside a sample, holding that sample's place, and the page
// dropped the part on "Cannot read properties of undefined (reading 'X')" in centreOf. Here the record is kept short, so
// that it is cut again and again, and the player is given a few pieces of work a step, so that it is often paused inside one.
note('\n13. THE RECORD CUT BACK WHILE THE PLAYER IS PAUSED INSIDE A SAMPLE (joint gate 2 of 2026-11-20: systems_site)');
{
  const keep0 = CFG.keep, KEEP = 120;
  const runCut = (mode) => {
    CFG.keep = KEEP;
    const W = WF.createWake(); WF.work(W, 0); const m = M.create({ knots: 22.5 }); let cuts = 0, last = 0, err = null, k = 0, most = 0;
    try {
      for (; k < 900; k++) {
        M.stepAlone(m, DT); if (mode === 'stuck') W.mid = true;     // a player left inside a sample with nobody to finish it
        WF.push(W, sample(m)); if (W.rec.length < last) cuts++; last = W.rec.length; if (last > most) most = last;
        if (mode === 'run') for (let f = 0; f < 3; f++) WF.work(W, 1e-6, true);
      }
    } catch (e) { err = e; }
    CFG.keep = keep0; return { err, cuts, k, most };
  };
  const a = runCut('run');
  row('13 the record cut back while the player is paused inside a sample (a short record; a few pieces of work a step)', a.err ? 'threw at sample ' + a.k + ': ' + String(a.err.message || a.err).slice(0, 60) : `${a.k} samples, cut back ${a.cuts} times, no error`, 'no error (before the fix of 2026-11-20 it threw "reading \'X\'" in centreOf)', !a.err && a.cuts > 2);
  const b = runCut('off'), c = runCut('stuck');
  row('   the record bounded with nobody running the player (the switch off, a phone), and with a player left inside a sample', `at most ${b.most} and ${c.most} samples kept, cut ${b.cuts} and ${c.cuts} times`, `never over twice what it keeps (${2 * KEEP}), and never over three times when a player is left inside a sample`, !b.err && !c.err && b.cuts > 2 && c.cuts > 2 && b.most <= 2 * KEEP && c.most <= 3 * KEEP);
}

// ================================================================ 14. K4: the sea against her sides
note('\n14. THE SEA AGAINST HER SIDES (the library\'s alongside: what her drawn waterline follows, site/parts/26_wake_seams.js)');
{
  const NS = 256, runSides = (kn, orders, T) => {
    const W = WF.createWake(); WF.work(W, 0); const m = M.create({ knots: kn }); let oi = 0;
    while (m.t < T - 1e-9) { while (oi < orders.length && m.t >= orders[oi][0] - 1e-9) { orders[oi][1](m); oi++; } M.stepAlone(m, DT); WF.push(W, sample(m)); WF.work(W, 0); }
    WF.refresh(W);
    const a = WF.alongside(W, NS), h = W.hull, xs = [], port = [], stbd = [];
    for (let i = 0; i < NS; i++) { xs.push(h.x0 + (h.x1 - h.x0) * (i + 0.5) / NS); port.push(a[2 * i]); stbd.push(a[2 * i + 1]); }
    return { W, m, h, xs, port, stbd };
  };
  const rmsOf = (v) => Math.sqrt(v.reduce((s, q) => s + q * q, 0) / v.length);
  const crestsOf = (P) => { const c = []; for (let i = 2; i < NS - 2; i++) if (P.port[i] > P.port[i - 1] && P.port[i] >= P.port[i + 1] && P.port[i] > 0.1) c.push(P.xs[i]); return c; };
  // her bow wave's crest: the highest of the sea against her port side within three reaches abaft her stem
  const bowTop = (Q) => { let iM = -1; for (let i = 0; i < NS; i++) { const d = Q.h.xStem - Q.xs[i]; if (d > 0 && d < 3 * CFG.bowReach && (iM < 0 || Q.port[i] > Q.port[iM])) iM = i; } return { top: Q.port[iM], abaft: Q.h.xStem - Q.xs[iM], Z: WF.bowCrest(Q.W, (Q.W.shown || Q.W.st).u), P: Q.W.bowPileNow }; };
  const P = runSides(22.5, [], 60), B22 = bowTop(P), lin22 = WF.alongside(P.W, NS, null, { linear: true });
  let linTop = 0; for (let i = 0; i < NS; i++) linTop = Math.max(linTop, lin22[2 * i]);
  row('14 her bow wave against her plating at 22.5 kn (the law: Noblesse and others 2008, eq. 4.1, her stem at ' + CFG.bowAngle + ' deg)', f(B22.top, 2) + ' m, ' + f(B22.abaft) + ' m abaft her stem (the field alone ' + f(linTop, 2) + ' m; the law\'s factor ' + f(B22.P, 2) + ')', 'the law\'s crest, ' + f(B22.Z, 2) + ' m, to 1 %, within 20 m of the stem (the fixed factor 3.5 before it drew 3.06 m)', B22.abaft >= 0 && B22.abaft <= 20 && Math.abs(B22.top / B22.Z - 1) < 0.01);
  const Q18 = runSides(18, [], 60), byKn = [[10, runSides(10, [], 60)], [14, runSides(14, [], 60)], [18, Q18], [22.5, P]].map(([kn, Q]) => Object.assign({ kn }, bowTop(Q)));
  row('   the law at 10, 14, 18 and 22.5 kn: her drawn crest against the law\'s (the factor)', byKn.map(q => f(q.top, 2) + '/' + f(q.Z, 2) + ' m (' + f(q.P, 1) + ')').join(', '), 'each to 1 %, or the factor at its cap of ' + CFG.bowPileMax + ' (her field too small to carry it): the crest growing as u^2 / (1 + F_D)', byKn.every(q => Math.abs(q.top / q.Z - 1) < 0.01 || q.P >= CFG.bowPileMax - 1e-9));
  const bc = [require('./s60_compare.js').bowCheck(), require('./wigley_compare.js').bowCheck()];
  row('   the law on K6\'s two benchmark hulls at her length: the drawn crest against the tank\'s', bc.map(b => b.hull + ' at Fn ' + b.Fn + ' ' + f(b.law, 2) + ' against ' + f(b.measured, 2) + ' m').join('; '), 'within a sixth: the relation on a 7 and an 11.3 degree bow (Kim and Jenkins 1981; Kajitani and others 1983; tools/s60_compare.js, tools/wigley_compare.js)', bc.every(b => Math.abs(b.law / b.measured - 1) < 1 / 6));
  let worst = 0; for (let i = 0; i < NS; i++) worst = Math.max(worst, Math.abs(P.port[i] - P.stbd[i]));
  row('   port against starboard on a straight course', 'they differ by at most ' + worst.toExponential(1) + ' m', 'the same to rounding (under 1e-5 m)', worst < 1e-5);
  for (const [kn, Q] of [[22.5, P], [18, Q18]]) {
    const c = crestsOf(Q), U = Q.m.u, lam = 2 * Math.PI * U * U / G, gap = c.length > 1 ? (c[c.length - 1] - c[0]) / (c.length - 1) : NaN;
    row('   the crests along her side at ' + kn + ' kn: ' + c.length + ' of them', f(gap) + ' m apart on average', '2 pi U^2 / g = ' + f(lam) + ' m, within 15 %: her own transverse waves along her', c.length >= 2 && Math.abs(gap / lam - 1) < 0.15);
  }
  const T = runSides(22.5, [[5, (m) => M.rudder(m, -40)]], 60), dps = T.port.map((v, i) => v - T.stbd[i]);
  row('   hard-a-starboard (her head to port) at 5 s, at 60 s: port minus starboard along her', f(rmsOf(dps), 2) + ' m rms (port ' + f(rmsOf(T.port), 2) + ', starboard ' + f(rmsOf(T.stbd), 2) + ')', 'over 0.1 m: a turning hull meets the water differently on each side', rmsOf(dps) > 0.1);
  const E = WF.alongside(WF.createWake(), NS); let mx = 0; for (const v of E) mx = Math.max(mx, Math.abs(v));
  row('   a wake with no sea yet', 'the sea against her at most ' + f(mx, 3) + ' m', 'nought everywhere: the page\'s still waterline', mx === 0);
  // between refreshes the player moves a window on after her (follow), while the heights wait for the next refresh: the
  // sea against her plating must read the same until then (the join 6 gate's 1.2 m of 2026-11-20: read at the window's
  // new corner, it moved)
  {
    const Wm = WF.createWake(); WF.work(Wm, 0); const mm = M.create({ knots: 22.5 });
    while (mm.t < 30 - 1e-9) { M.stepAlone(mm, DT); WF.push(Wm, sample(mm)); WF.work(Wm, 0); }
    WF.refresh(Wm); const before = Array.from(WF.alongside(Wm, NS)), x0 = Wm.near.X0, y0 = Wm.near.Y0;
    let moved = false; while (mm.t < 45 - 1e-9 && !moved) { M.stepAlone(mm, DT); WF.push(Wm, sample(mm)); WF.work(Wm, 0); moved = Wm.near.X0 !== x0 || Wm.near.Y0 !== y0; }
    const after = WF.alongside(Wm, NS); let dmax = 0; for (let i = 0; i < before.length; i++) dmax = Math.max(dmax, Math.abs(after[i] - before[i]));
    row('   the sea against her plating between refreshes, once the fine window has moved on after her (' + f(Math.hypot(Wm.near.X0 - x0, Wm.near.Y0 - y0)) + ' m)', 'it changed by at most ' + f(dmax, 6) + ' m', 'not at all: it is the last refresh\'s, read where its windows stood then (the join 6 gate\'s 1.2 m, 2026-11-20)', moved && dmax === 0);
  }
}

// ================================================================ 15. K6: another hull and another gain
note('\n15. ANOTHER HULL AND ANOTHER GAIN (createWake\'s o.hull and o.scale, the seams for K6\'s benchmark hull)');
{
  const run = (o) => { const W = WF.createWake(o); WF.work(W, 0); const m = M.create({ knots: 22.5 }); while (m.t < 60 - 1e-9) { M.stepAlone(m, DT); WF.push(W, sample(m)); WF.work(W, 0); } WF.refresh(W); return W; };
  const A = run(), B = run({ hull: WF.herHull() }), C = run({ scale: (u) => 2 * WF.scale(u) });
  let same = 0, worst = 0, big = 0; const N = A.hNear.length + A.hFar.length;
  for (const [a, b, c] of [[A.hNear, B.hNear, C.hNear], [A.hFar, B.hFar, C.hFar]]) for (let i = 0; i < a.length; i++) { if (a[i] === b[i]) same++; worst = Math.max(worst, Math.abs(c[i] - 2 * a[i])); big = Math.max(big, Math.abs(2 * a[i])); }
  row('15 her own hull given as another (o.hull), at 22.5 kn after 60 s: both windows\' heights', same + ' of ' + N + ' the same', 'every one, to the bit: the seam changes nothing for her', same === N);
  row('   her gain doubled (o.scale)', 'every height doubled, to ' + (worst / big).toExponential(1) + ' of the highest', 'within 1e-6 of it: the field is linear in its gain, and the seam is the only gain the player uses', big > 0 && worst / big < 1e-6);
}

fs.writeFileSync(outFile('wake_tests.txt'), lines.join('\n') + '\n');
console.log((fails ? `FAIL: ${fails} row(s)` : `PASS: all ${n} rows`) + ' (' + f((Date.now() - T0) / 1000) + ' s)');
process.exit(fails ? 1 : 0);
