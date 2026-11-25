// e51: her wake as a wave field, computed in time from her own motion, for
// docs/BRAINSTORM_the_wake_computed_v2_2026-11-19.md (sections 4 and 5). A prototype, not the page's part.
//
// THE PROBLEM SOLVED. Linear waves on deep, still water (the night's sea), forced by her hull as it moves:
//   dh/dt = |k| phi + w0,   dphi/dt = -g h        (h the surface's height, phi the potential at the surface, per Fourier mode)
// Every mode turns at its own exact frequency, omega^2 = g |k|, so the dispersion is exact for every wave the grid holds.
// w0 is what her hull does to the surface, written in her own frame once and for all:
//   surge u:  thin-ship sources on her centre plane, strength -2 u dY/dx (Michell's hull), each felt at the surface through
//             exp(-|k| depth):                      S_u(k') = -2 i kx' P(kx', |k|),  P = integral of Y exp(|k| zeta - i kx' x)
//   sway and yaw (the water meets station x at v + r x across her): dipoles across her, of moment (section + its sway
//             added area) a metre of length [bet: 0.9 of a half circle on her draught]:
//                                                   S_v(k') = -i ky' Q(kx', |k|),  S_r the same with x in it
// At each step the forcing is u S_u + v S_v + r S_r, turned to her heading and shifted to her place: no transform is
// needed to force it, and one to look at it. Her track is the motion model's own (core/motion.js, stepAlone).
// No Michell formula, no Kelvin construction and no wave angle is put in: what comes out is measured against them.
//   node docs/research/experiments/e51_wake_field_prototype.js [TREE] [--write]
// Output: results_2026-11-19/e51_wake_field_prototype.txt and e51_*.png (north up, 8 m a pixel)
'use strict';
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const ROOT = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : path.join(__dirname, '..', '..', '..');
const WRITE = process.argv.includes('--write');
const C = require(path.join(ROOT, 'core', 'core.js')), M = require(path.join(ROOT, 'core', 'motion.js'));
const G = 9.81, RHO = 1025, KN = 1852 / 3600, DEG = Math.PI / 180, DT = 0.25;
const out = [], log = (s) => { out.push(s); console.log(s); };
const f = (v, n) => (v === null || v === undefined || !isFinite(v) ? 'n/a' : v.toFixed(n === undefined ? 0 : n));
const RES = path.join(__dirname, 'results_2026-11-19');

// ---------------------------------------------------------------- the grid
const N = 512, DX = 8, LBOX = N * DX, DK = 2 * Math.PI / LBOX, KC = 0.85 * Math.PI / DX;   // waves shorter than 2.35 cells left out
const kOf = (a) => DK * (a < N / 2 ? a : a - N);
function fft1(re, im, n, inv) {
  for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (inv ? 2 : -2) * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k, b = a + len / 2, xr = re[b] * cr - im[b] * ci, xi = re[b] * ci + im[b] * cr;
        re[b] = re[a] - xr; im[b] = im[a] - xi; re[a] += xr; im[a] += xi;
        const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
      }
    }
  }
}
function fft2(re, im, n, inv) {
  const tr = new Float64Array(n), ti = new Float64Array(n);
  for (let r = 0; r < n; r++) { const o = r * n; fft1(re.subarray(o, o + n), im.subarray(o, o + n), n, inv); }
  for (let c = 0; c < n; c++) {
    for (let r = 0; r < n; r++) { tr[r] = re[r * n + c]; ti[r] = im[r * n + c]; }
    fft1(tr, ti, n, inv);
    for (let r = 0; r < n; r++) { re[r * n + c] = tr[r]; im[r * n + c] = ti[r]; }
  }
  if (inv) { const s = 1 / (n * n); for (let i = 0; i < n * n; i++) { re[i] *= s; im[i] *= s; } }
}

// ---------------------------------------------------------------- her hull's three footprints, in her own frame
const Td = M.SHIP.d, HX0 = C.G.xAP - 0.5, HX1 = C.xFwd(Td) + 0.5, HDX = 0.5, HNZ = 21, HDZ = Td / (HNZ - 1), HNX = Math.round((HX1 - HX0) / HDX) + 1;
const HY = new Float64Array(HNX * HNZ), Seff = new Float64Array(HNX), dC = new Float64Array(HNX);
for (let i = 0; i < HNX; i++) {
  let area = 0, mom = 0, deep = 0;
  for (let j = 0; j < HNZ; j++) {
    const y = C.halfBreadth(HX0 + i * HDX, j * HDZ); HY[i * HNZ + j] = y;
    const w = (j === 0 || j === HNZ - 1 ? 0.5 : 1) * HDZ; area += 2 * y * w; mom += 2 * y * w * (Td - j * HDZ); if (y > 0.05 && Td - j * HDZ > deep) deep = Td - j * HDZ;
  }
  Seff[i] = area + 0.9 * 0.5 * Math.PI * deep * deep * (area > 1 ? 1 : area);   // section, and its sway added area [bet]
  dC[i] = area > 1e-6 ? mom / area : 0.5 * Td;
}
// P(kx, K) = double integral of Y exp(K zeta) exp(-i kx x): Filon in both directions (as e50)
function Pof(kx, K) {
  const ah = K * HDZ; let w0, w1;
  if (ah < 1e-4) { w0 = HDZ * (0.5 + ah / 6); w1 = HDZ * (0.5 + ah / 3); } else { const e = Math.exp(ah), q = (e * (ah - 1) + 1) / (ah * ah); w1 = HDZ * q; w0 = HDZ * ((e - 1) / ah - q); }
  const th = kx * HDX; let e1r, e1i, sr, si;
  if (th < 1e-3) { e1r = HDX * (1 - th * th / 6); e1i = HDX * th / 2; sr = HDX * HDX * (0.5 - th * th / 8); si = HDX * HDX * th / 3; }
  else { const c = Math.cos(th), s = Math.sin(th); e1r = s / kx; e1i = (1 - c) / kx; sr = -(-c - th * s + 1) / (kx * kx); si = -(th * c - s) / (kx * kx); }
  let re = 0, im = 0, Fp = 0;
  for (let i = 0; i < HNX; i++) {
    let F = 0; const o = i * HNZ; for (let j = 0; j < HNZ - 1; j++) F += Math.exp(K * (-Td + j * HDZ)) * (HY[o + j] * w0 + HY[o + j + 1] * w1);
    if (i > 0) { const ph = kx * (HX0 + (i - 1) * HDX), c = Math.cos(ph), s = Math.sin(ph), d = (F - Fp) / HDX, tr = Fp * e1r + d * sr, ti = Fp * e1i + d * si; re += c * tr - s * ti; im += c * ti + s * tr; }
    Fp = F;
  }
  return [re, -im];                                   // exp(-i kx x): the conjugate of the sum with exp(+i kx x)
}
function Qof(kx, K, pow) {                            // integral of Seff exp(-K dC) x^pow exp(-i kx x) dx
  let re = 0, im = 0;
  for (let i = 0; i < HNX; i++) { const x = HX0 + i * HDX, a = Seff[i] * Math.exp(-K * dC[i]) * (pow ? x : 1) * HDX * (i === 0 || i === HNX - 1 ? 0.5 : 1); re += a * Math.cos(kx * x); im -= a * Math.sin(kx * x); }
  return [re, im];
}
const NL = N + 1, H = N / 2;                          // lattice of her frame: index (ix + H) * NL + (iy + H)
const SuR = new Float64Array(NL * NL), SuI = new Float64Array(NL * NL), SvR = new Float64Array(NL * NL), SvI = new Float64Array(NL * NL), SrR = new Float64Array(NL * NL), SrI = new Float64Array(NL * NL);
{
  const t0 = Date.now();
  for (let ix = 0; ix <= H; ix++) for (let iy = 0; iy <= H; iy++) {
    const kx = ix * DK, ky = iy * DK, K = Math.sqrt(kx * kx + ky * ky); if (K > KC * 1.02) continue;
    const P = Pof(kx, K), Q = Qof(kx, K, 0), Q1 = Qof(kx, K, 1);
    for (const sx of [1, -1]) for (const sy of [1, -1]) {
      if ((sx < 0 && ix === 0) || (sy < 0 && iy === 0)) continue;
      const o = (sx * ix + H) * NL + (sy * iy + H), pr = P[0], pi = sx * P[1], qr = Q[0], qi = sx * Q[1], q1r = sx * Q1[0], q1i = Q1[1];
      // S_u = -2 i kx P ; S_v = -i ky Q ; S_r = -i ky Q1   (kx, ky signed; P, Q conjugated for kx < 0, Q1 odd in kx)
      SuR[o] = 2 * sx * kx * pi; SuI[o] = -2 * sx * kx * pr;
      SvR[o] = sy * ky * qi; SvI[o] = -sy * ky * qr;
      SrR[o] = sy * ky * q1i; SrI[o] = -sy * ky * q1r;
    }
  }
  log('e51: her wake as a wave field in time (tree: ' + ROOT + ')');
  log('grid ' + N + ' x ' + N + ' of ' + DX + ' m (' + LBOX + ' m square, waves of ' + f(2 * Math.PI / KC, 1) + ' m and longer); her three footprints computed in ' + f((Date.now() - t0) / 1000, 1) + ' s');
}

// ---------------------------------------------------------------- the field and its step
function field() {
  const n2 = N * N, F = { hr: new Float64Array(n2), hi: new Float64Array(n2), pr: new Float64Array(n2), pi: new Float64Array(n2), t: 0 };
  return F;
}
const KK = new Float64Array(N * N), CW = new Float64Array(N * N), SW = new Float64Array(N * N), OM = new Float64Array(N * N);
for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) { const kx = kOf(a), ky = kOf(b), k = Math.sqrt(kx * kx + ky * ky), w = Math.sqrt(G * k), o = a * N + b; KK[o] = k; OM[o] = w; CW[o] = Math.cos(w * DT); SW[o] = Math.sin(w * DT); }
const cX = new Float64Array(N), sX = new Float64Array(N), cY = new Float64Array(N), sY = new Float64Array(N);
function stepField(F, st, gain) {                     // st: { X, Y, psi, u, v, r } in the grid's metres (X north = rows, Y east = columns)
  const { hr, hi, pr, pi } = F, cp = Math.cos(st.psi), sp = Math.sin(st.psi), u = st.u * gain, v = st.v * gain, r = st.r * gain, sc = DT / (DX * DX);
  for (let a = 0; a < N; a++) { const k = kOf(a); cX[a] = Math.cos(k * st.X); sX[a] = Math.sin(k * st.X); cY[a] = Math.cos(k * st.Y); sY[a] = Math.sin(k * st.Y); }
  for (let a = 0; a < N; a++) {
    const kX = kOf(a);
    for (let b = 0; b < N; b++) {
      const o = a * N + b, k = KK[o];
      // every mode turns by its own frequency (exact)
      if (k > 0) { const c = CW[o], s = SW[o], w = OM[o], h0 = hr[o], h1 = hi[o], p0 = pr[o], p1 = pi[o]; hr[o] = h0 * c + p0 * (k / w) * s; hi[o] = h1 * c + p1 * (k / w) * s; pr[o] = p0 * c - h0 * (G / w) * s; pi[o] = p1 * c - h1 * (G / w) * s; }
      if (k > KC || k === 0) continue;
      const kY = kOf(b), kxp = (kX * cp + kY * sp) / DK + H, kyp = (-kX * sp + kY * cp) / DK + H;
      const i0 = Math.floor(kxp), j0 = Math.floor(kyp); if (i0 < 0 || j0 < 0 || i0 >= N || j0 >= N) continue;
      const fx = kxp - i0, fy = kyp - j0, o00 = i0 * NL + j0, o10 = o00 + NL, w00 = (1 - fx) * (1 - fy), w10 = fx * (1 - fy), w01 = (1 - fx) * fy, w11 = fx * fy;
      const sr = u * (SuR[o00] * w00 + SuR[o10] * w10 + SuR[o00 + 1] * w01 + SuR[o10 + 1] * w11) + v * (SvR[o00] * w00 + SvR[o10] * w10 + SvR[o00 + 1] * w01 + SvR[o10 + 1] * w11) + r * (SrR[o00] * w00 + SrR[o10] * w10 + SrR[o00 + 1] * w01 + SrR[o10 + 1] * w11);
      const si = u * (SuI[o00] * w00 + SuI[o10] * w10 + SuI[o00 + 1] * w01 + SuI[o10 + 1] * w11) + v * (SvI[o00] * w00 + SvI[o10] * w10 + SvI[o00 + 1] * w01 + SvI[o10 + 1] * w11) + r * (SrI[o00] * w00 + SrI[o10] * w10 + SrI[o00 + 1] * w01 + SrI[o10 + 1] * w11);
      // shifted to her place: exp(-i (kX X + kY Y))
      const er = cX[a] * cY[b] - sX[a] * sY[b], ei = -(sX[a] * cY[b] + cX[a] * sY[b]);
      hr[o] += sc * (sr * er - si * ei); hi[o] += sc * (sr * ei + si * er);
    }
  }
  F.t += DT;
}
function energy(F) { let e = 0; const { hr, hi, pr, pi } = F; for (let o = 0; o < N * N; o++) e += G * (hr[o] * hr[o] + hi[o] * hi[o]) + KK[o] * (pr[o] * pr[o] + pi[o] * pi[o]); return 0.5 * RHO * DX * DX / (N * N) * e; }
function heights(F) { const re = Float64Array.from(F.hr), im = Float64Array.from(F.hi); fft2(re, im, N, true); return re; }
const at = (h, X, Y) => {                              // bilinear, periodic
  const a = X / DX, b = Y / DX, a0 = Math.floor(a), b0 = Math.floor(b), fa = a - a0, fb = b - b0, w = (i, j) => h[(((a0 + i) % N + N) % N) * N + ((b0 + j) % N + N) % N];
  return w(0, 0) * (1 - fa) * (1 - fb) + w(1, 0) * fa * (1 - fb) + w(0, 1) * (1 - fa) * fb + w(1, 1) * fa * fb;
};

// ---------------------------------------------------------------- a picture: north up, east to the right
const CRC = (() => { const t = new Int32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c; } return t; })();
function crc(buf) { let c = -1; for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; }
function png(file, h, scale, track, st) {
  const raw = Buffer.alloc(N * (N * 3 + 1));
  for (let row = 0; row < N; row++) {
    const a = N - 1 - row, o0 = row * (N * 3 + 1); raw[o0] = 0;
    for (let b = 0; b < N; b++) { let v = h[a * N + b] / scale; v = v > 1 ? 1 : (v < -1 ? -1 : v); const o = o0 + 1 + b * 3; raw[o] = Math.round(20 + 105 * (1 + v) * 0.55 + (v > 0 ? 110 * v : 0)); raw[o + 1] = Math.round(38 + 100 * (1 + v) * 0.6 + (v > 0 ? 80 * v : 0)); raw[o + 2] = Math.round(70 + 85 * (1 + v)); }
  }
  const dot = (X, Y, r, g, b) => { const a = Math.round(X / DX), c = Math.round(Y / DX); if (a < 0 || c < 0 || a >= N || c >= N) return; const o = (N - 1 - a) * (N * 3 + 1) + 1 + c * 3; raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; };
  if (track) for (const p of track) dot(p[0], p[1], 255, 190, 60);
  if (st) for (let x = -129; x <= 129; x += 4) for (let y = -12; y <= 12; y += 4) if (Math.abs(y) <= C.halfBreadth(x, Td)) dot(st.X + x * Math.cos(st.psi) - y * Math.sin(st.psi), st.Y + x * Math.sin(st.psi) + y * Math.cos(st.psi), 15, 15, 15);
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]), c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(N, 0); ihdr.writeUInt32BE(N, 4); ihdr[8] = 8; ihdr[9] = 2;
  const buf = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
  if (WRITE) { fs.mkdirSync(RES, { recursive: true }); fs.writeFileSync(path.join(RES, file), buf); }
}

// ---------------------------------------------------------------- Michell's Rw for the waves this grid holds (as e50)
function michellRw(U, kCut) {
  const k0 = G / (U * U), L = M.SHIP.L, sMax = Math.sqrt(Math.max(0, kCut / k0 - 1)), n = Math.ceil(sMax / (0.08 / (k0 * L))); let sum = 0, A0 = 0;
  for (let i = 0; i <= n; i++) { const s = sMax * i / n, sec = Math.sqrt(1 + s * s), P = Pof(k0 * sec, k0 * sec * sec), I2 = P[0] * P[0] + P[1] * P[1]; sum += (i === 0 || i === n ? 0.5 : 1) * sMax / n * I2 * sec * sec * sec; if (i === 0) A0 = 2 / Math.PI * k0 * k0 * Math.sqrt(I2); }
  return { Rw: 4 * RHO * Math.pow(G, 4) / (Math.PI * Math.pow(U, 6)) * sum, A0, k0 };
}

// ---------------------------------------------------------------- a run on the motion model's own track
function run(name, X0, Y0, orders, tEnd, shots) {
  const m = M.create({ knots: 22.5 }), F = field(), track = [], E = [], rec = [];
  let oi = 0; const t0 = Date.now();
  while (m.t < tEnd - 1e-9) {
    while (oi < orders.length && m.t >= orders[oi][0] - 1e-9) { orders[oi][1](m); oi++; }
    M.stepAlone(m, DT);
    const st = { X: X0 + m.X, Y: Y0 + m.Y, psi: m.psi, u: m.u, v: m.v, r: m.r };
    stepField(F, st, Math.min(1, m.t / 20));          // her sources brought in over 20 s, so that the start makes no splash
    if (Math.abs(m.t % 2) < 1e-9) track.push([st.X, st.Y]);
    if (Math.abs(m.t % 5) < 1e-9) { E.push([m.t, energy(F)]); rec.push({ t: m.t, st, kn: Math.sqrt(m.u * m.u + m.v * m.v) / KN, del: m.del / DEG }); }
    for (const s of shots || []) if (Math.abs(m.t - s) < 1e-9) png('e51_' + name + '_t' + s + '.png', heights(F), 1.5, track, st);
  }
  return { m, F, track, E, rec, ms: Date.now() - t0, last: { X: X0 + m.X, Y: Y0 + m.Y, psi: m.psi, u: m.u, v: m.v, r: m.r } };
}

// ================================================================ 1. straight at 22.5 knots
log('\n1. STRAIGHT AT 22.5 kn FOR 300 s (heading north; nothing is told the field about wakes)');
{
  const R = run('straight', 400, 2048, [], 300, [300]), U = R.last.u, h = heights(R.F), k0 = G / (U * U);
  log('   ' + f(300 / DT) + ' steps in ' + f(R.ms / 1000, 1) + ' s (' + f(R.ms / (300 / DT), 1) + ' ms a step of the field here)');
  // wave resistance from the energy left on the sea
  const e1 = R.E.find(e => e[0] === 150), e2 = R.E.find(e => e[0] === 300), RwSim = (e2[1] - e1[1]) / 150 / U, mi = michellRw(U, KC), miAll = michellRw(U, 40);
  log('   energy left on the sea between 150 and 300 s: ' + f((e2[1] - e1[1]) / 150 / 1e6, 2) + ' MW, a wave resistance of ' + f(RwSim / 1000, 1) + ' kN');
  log('   Michell\'s integral over the same waves (longer than ' + f(2 * Math.PI / KC, 1) + ' m): ' + f(mi.Rw / 1000, 1) + ' kN (all waves: ' + f(miAll.Rw / 1000, 1) + ' kN): the field gives ' + f(100 * RwSim / mi.Rw, 1) + ' % of it');
  // the transverse waves on her track: wavelength and height against the stationary-phase figure
  const xs = []; let prev = null; for (let s = 250; s <= 1500; s += 1) { const v = at(h, R.last.X - s, R.last.Y); if (prev !== null && prev < 0 && v >= 0) xs.push(s - v / (v - prev)); prev = v; }
  const lam = (xs[xs.length - 1] - xs[0]) / (xs.length - 1);
  log('   transverse waves on her track 250 to 1,500 m astern: ' + xs.length + ' crests, ' + f(lam, 2) + ' m apart (2 pi U^2 / g = ' + f(2 * Math.PI * U * U / G, 2) + ' m)');
  for (const s0 of [300, 600, 1000]) { let lo = 1e9, hi = -1e9; for (let s = s0 - 45; s <= s0 + 45; s += 1) { const v = at(h, R.last.X - s, R.last.Y); if (v < lo) lo = v; if (v > hi) hi = v; } log('   their height (crest to trough) ' + s0 + ' m astern: ' + f(hi - lo, 2) + ' m (stationary phase from Michell\'s |A| ahead: ' + f(2 * mi.A0 * Math.sqrt(2 * Math.PI / (k0 * (s0 + 129))), 2) + ' m)'); }
  // the wedge: where the waves are highest across her wake
  for (const s0 of [600, 1000, 1400]) {
    let best = [0, 0], bestS = [0, 0];
    for (let y = 40; y <= 900; y += 2) for (const sd of [0, 1]) { let lo = 1e9, hi = -1e9; for (let s = s0 - 60; s <= s0 + 60; s += 2) { const v = at(h, R.last.X - s, R.last.Y + (sd ? y : -y)); if (v < lo) lo = v; if (v > hi) hi = v; } if (hi - lo > best[sd]) { best[sd] = hi - lo; bestS[sd] = y; } }
    // the wedge's edge: the farthest out that the waves are still a quarter as high as the highest
    let edge = 0; for (let y = 900; y >= 40; y -= 2) { let lo = 1e9, hi = -1e9; for (let s = s0 - 60; s <= s0 + 60; s += 2) { const v = at(h, R.last.X - s, R.last.Y + y); if (v < lo) lo = v; if (v > hi) hi = v; } if (hi - lo >= 0.25 * best[1]) { edge = y; break; } }
    log('   ' + s0 + ' m astern of amidships the highest waves stand ' + f(bestS[0]) + ' m to port and ' + f(bestS[1]) + ' m to starboard (' + f(best[0], 2) + ' and ' + f(best[1], 2) + ' m high, ' + f(Math.atan(bestS[1] / (s0 + 129)) / DEG, 1) + ' deg from her stem); the waves reach out to ' + f(edge) + ' m, ' + f(Math.atan(edge / (s0 + 129)) / DEG, 1) + ' deg (Kelvin\'s wedge: 19.47)');
  }
  // how much of her wave resistance waves of each length carry (Michell): what a grid of a given fineness holds
  { let s = '   of her wave resistance at 22.5 kn, waves longer than'; for (const lm of [60, 40, 30, 20, 10, 5, 2]) s += ' ' + lm + ' m carry ' + f(100 * michellRw(U, 2 * Math.PI / lm).Rw / miAll.Rw) + ' %;'; log(s); }
  let rms = 0; for (let o = 0; o < N * N; o++) rms += h[o] * h[o]; log('   the sea\'s height over the whole square: rms ' + f(Math.sqrt(rms / (N * N)), 3) + ' m; at her stem ' + f(at(h, R.last.X + 126, R.last.Y), 2) + ' m, amidships ' + f(at(h, R.last.X, R.last.Y + 16), 2) + ' m, at her stern ' + f(at(h, R.last.X - 128, R.last.Y), 2) + ' m');
}

// ================================================================ 2. the helm hard over
log('\n2. HARD-A-STARBOARD (her head to port) AT 40 s, HELD TO 300 s');
{
  const R = run('turn', 700, 2900, [[40, (m) => M.rudder(m, -40)]], 300, [120, 300]), h = heights(R.F), L = R.last;
  for (const t of [40, 60, 80, 120, 180, 240, 300]) { const q = R.rec.find(x => x.t === t), s = q.st; log('   t ' + String(t).padStart(3) + ' s: ' + f(q.kn, 1) + ' kn, heading ' + f(s.psi / DEG, 0).padStart(4) + ' deg, turning ' + f(s.r / DEG, 2) + ' deg/s, drift amidships ' + f(Math.atan2(s.v, s.u) / DEG, 1) + ' deg; the water meets her stem at ' + f(Math.atan2(s.v + s.r * 129, s.u) / DEG, 1) + ' and her stern at ' + f(Math.atan2(s.v - s.r * 129, s.u) / DEG, 1) + ' deg; no sideways motion ' + (Math.abs(s.r) > 1e-6 ? f(-s.v / s.r, 0) + ' m forward of amidships' : 'anywhere')); }
  // how lopsided: waves outside her track against inside, 300 to 700 m back along it
  let so = 0, si = 0, n = 0;
  for (let i = R.track.length - 19; i > R.track.length - 44 && i > 1; i -= 2) {      // the track is laid every 2 s: 37 to 87 s back at about 8 m/s
    const p = R.track[i], q = R.track[i - 1], tx = p[0] - q[0], ty = p[1] - q[1], tl = Math.sqrt(tx * tx + ty * ty), nx = -ty / tl, ny = tx / tl;   // n: to starboard of her track (the outside of a turn to port)
    for (let d = 60; d <= 260; d += 20) { const a = at(h, p[0] + nx * d, p[1] + ny * d), b = at(h, p[0] - nx * d, p[1] - ny * d); so += a * a; si += b * b; n++; }
  }
  log('   60 to 260 m either side of her track, 300 to 700 m back: rms height ' + f(Math.sqrt(so / n), 3) + ' m outside the turn, ' + f(Math.sqrt(si / n), 3) + ' m inside it');
  // the share of the forcing that is her sideways motion: rerun with it left out
  const R0 = (() => { const m = M.create({ knots: 22.5 }), F = field(); let oi = 0; while (m.t < 300 - 1e-9) { if (!oi && m.t >= 40 - 1e-9) { M.rudder(m, -40); oi = 1; } M.stepAlone(m, DT); stepField(F, { X: 700 + m.X, Y: 2900 + m.Y, psi: m.psi, u: m.u, v: 0, r: 0 }, Math.min(1, m.t / 20)); } return F; })();
  log('   the wave energy on the sea at 300 s: ' + f(energy(R.F) / 1e9, 2) + ' GJ; with her sideways motion left out of the forcing (the same track): ' + f(energy(R0) / 1e9, 2) + ' GJ');
  const h0 = heights(R0); png('e51_turn_t300_surge_only.png', h0, 1.5, R.track, L);
}

// ================================================================ 3. full astern from 22.5 knots
log('\n3. BOTH ENGINES FULL ASTERN AT 60 s, HELM AMIDSHIPS');
{
  const R = run('stop', 400, 2048, [[60, (m) => M.telegraph(m, 'full astern')]], 420, [240, 420]);
  let s = '   her speed ahead (astern negative): '; for (const q of R.rec) if (q.t % 60 === 0) s += 't ' + q.t + ' s ' + f(q.st.u / KN, 1) + ' kn; '; log(s);
  const stop = R.rec.find(q => q.st.u <= 0.05); log('   ' + (stop ? 'she has lost her way at t ' + stop.t + ' s, ' + f(stop.st.X - 400 - 60 * 22.5 * KN, 0) + ' m past the order' : 'she still has way at 420 s'));
  // her own waves come up with her: the sea's height at her stern and at her stem as she stops and after
  if (stop) {
    const m = M.create({ knots: 22.5 }), F = field(); let done = false, line = '   the sea at her stern / at her stem (m): ';
    while (m.t < stop.t + 60 - 1e-9) {
      if (!done && m.t >= 60 - 1e-9) { M.telegraph(m, 'full astern'); done = true; }
      if (m.t >= stop.t - 1e-9) M.telegraph(m, 'stop');                            // here she is left stopped, to watch her waves pass
      M.stepAlone(m, DT); const st = { X: 400 + m.X, Y: 2048 + m.Y, psi: m.psi, u: m.u, v: m.v, r: m.r };
      stepField(F, st, Math.min(1, m.t / 20));
      if (m.t >= stop.t - 60 - 1e-9 && Math.abs((m.t - stop.t) % 15) < 1e-9) { const h = heights(F); line += 't ' + (m.t - stop.t >= 0 ? '+' : '') + f(m.t - stop.t) + ' s ' + f(at(h, st.X - 128, st.Y), 2) + ' / ' + f(at(h, st.X + 126, st.Y), 2) + '; '; if (Math.abs(m.t - stop.t - 45) < 1e-9) png('e51_stop_waves_pass.png', h, 1.5, null, st); }
    }
    log(line);
  }
}

// ================================================================ 4. what a page would pay
log('\n4. THE COST, HERE (one thread of Node; a browser\'s engine is of the same kind)');
for (const n of [256, 512]) { const re = new Float64Array(n * n), im = new Float64Array(n * n); for (let i = 0; i < n * n; i++) re[i] = Math.sin(i * 0.37); const t0 = Date.now(); for (let k = 0; k < 10; k++) fft2(re, im, n, k % 2 === 1); log('   one ' + n + ' x ' + n + ' transform: ' + f((Date.now() - t0) / 10, 1) + ' ms'); }
if (WRITE) { fs.mkdirSync(RES, { recursive: true }); fs.writeFileSync(path.join(RES, 'e51_wake_field_prototype.txt'), out.join('\n') + '\n'); }
