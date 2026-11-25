// e52: the wake as an eye sees it, near her: the wave field of e51 on a fine grid that moves with her, and the white water
// on top of it, for docs/BRAINSTORM_the_wake_computed_v2_2026-11-19.md (section 6). Bo, on e51's first picture: it "looks
// like the trail of a jet"; a liner's wake looks organic. It does, because most of what is seen is not the waves but the
// white water they and the screws make, and e51 drew none.
//
// THE WAVES: as e51 (exact linear waves forced by her hull's thin-ship sources), here in her own frame on a straight
// course: a 1,024 m square of 2 m cells that moves with her, so waves of 4.7 m and longer are held. Their heights are
// scaled so that the energy they carry off is what the motion model's resistance spends on waves (Holtrop's wave part,
// e50): 0.572 of thin-ship theory's heights at 22.5 kn.
// THE WHITE WATER (three laws; the numbers marked [bet] are to be set from the research note and the tank):
//   made   where the surface is steeper than it can stand: at a rate proportional to the excess of the slope over SLOPE_C
//          [bet], which is where the bow wave and the first divergent crests are; and in the screws' race astern, at a rate
//          proportional to thrust (full here);
//   left   where it was made: foam does not travel with a wave. On the earth it stands still, so past her it streams
//          astern at her speed, along her sides and into the wake, stirred by eddies whose size is the wake's and whose
//          places are drawn from a seed [appearance];
//   dies   exponentially: TAU_BREAK for a breaker's foam, TAU_WAKE for the aerated wake [bet; the page uses 75 s].
// THE PICTURE: from above, the sea shaded by its own slopes under a low sun [appearance: on the night there was none],
// the foam white where it lies. The first picture is the heights alone, as e51 drew them.
//   node docs/research/experiments/e52_wake_white_water_prototype.js [TREE] [--write]
// Output: results_2026-11-19/e52_wake_white_water_prototype.txt, e52_heights.png, e52_as_seen.png (north up, 2 m a pixel)
'use strict';
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const ROOT = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : path.join(__dirname, '..', '..', '..');
const WRITE = process.argv.includes('--write');
const C = require(path.join(ROOT, 'core', 'core.js')), M = require(path.join(ROOT, 'core', 'motion.js'));
const G = 9.81, RHO = 1025, KN = 1852 / 3600, DEG = Math.PI / 180, DT = 0.25;
const out = [], log = (s) => { out.push(s); console.log(s); };
const f = (v, n) => (v === null || v === undefined || !isFinite(v) ? 'n/a' : v.toFixed(n === undefined ? 0 : n));
const RES = path.join(__dirname, 'results_2026-11-19');

const N = 512, DX = 2, LBOX = N * DX, DK = 2 * Math.PI / LBOX, KC = 0.85 * Math.PI / DX;
const kOf = (a) => DK * (a < N / 2 ? a : a - N);
const U = 22.5 * KN, X0 = 760, Y0 = 512;              // her place in the square (amidships), heading north (+X)
const GAIN = Math.sqrt(361.2 / 1102.6);               // Holtrop's wave resistance over Michell's at 22.5 kn (e50)
const SLOPE_C = 0.10, K_BREAK = 6.0, TAU_BREAK = 14, TAU_WAKE = 70, K_RACE = 0.9, EDDY = 0.9, K_BOW = 1.6;   // [bets]

function fft1(re, im, n, inv) {
  for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (inv ? 2 : -2) * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) { let cr = 1, ci = 0; for (let k = 0; k < len / 2; k++) { const a = i + k, b = a + len / 2, xr = re[b] * cr - im[b] * ci, xi = re[b] * ci + im[b] * cr; re[b] = re[a] - xr; im[b] = im[a] - xi; re[a] += xr; im[a] += xi; const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t; } }
  }
}
function fft2(re, im, n, inv) {
  const tr = new Float64Array(n), ti = new Float64Array(n);
  for (let r = 0; r < n; r++) { const o = r * n; fft1(re.subarray(o, o + n), im.subarray(o, o + n), n, inv); }
  for (let c = 0; c < n; c++) { for (let r = 0; r < n; r++) { tr[r] = re[r * n + c]; ti[r] = im[r * n + c]; } fft1(tr, ti, n, inv); for (let r = 0; r < n; r++) { re[r * n + c] = tr[r]; im[r * n + c] = ti[r]; } }
  if (inv) { const s = 1 / (n * n); for (let i = 0; i < n * n; i++) { re[i] *= s; im[i] *= s; } }
}
// her hull's surge footprint (as e51): P(kx, K) = double integral of Y exp(K zeta) exp(-i kx x)
const Td = M.SHIP.d, HX0 = C.G.xAP - 0.5, HX1 = C.xFwd(Td) + 0.5, HDX = 0.5, HNZ = 21, HDZ = Td / (HNZ - 1), HNX = Math.round((HX1 - HX0) / HDX) + 1;
const HY = new Float64Array(HNX * HNZ);
for (let i = 0; i < HNX; i++) for (let j = 0; j < HNZ; j++) HY[i * HNZ + j] = C.halfBreadth(HX0 + i * HDX, j * HDZ);
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
  return [re, -im];
}
log('e52: the wake near her, with its white water (tree: ' + ROOT + ')');
// the forcing of one step, mode by mode: u S_u exp(-i k . X0) dt / dx^2, and each mode's own turn and its shift astern
const n2 = N * N, SR = new Float64Array(n2), SI = new Float64Array(n2), KK = new Float64Array(n2), CW = new Float64Array(n2), SW = new Float64Array(n2), OM = new Float64Array(n2);
{
  const t0 = Date.now(), H = N / 2, PR = new Float64Array((H + 1) * (H + 1)), PI = new Float64Array((H + 1) * (H + 1));
  for (let ia = 0; ia <= H; ia++) for (let ib = 0; ib <= H; ib++) { const kx = ia * DK, K = DK * Math.sqrt(ia * ia + ib * ib); if (K > KC) continue; const P = Pof(kx, K); PR[ia * (H + 1) + ib] = P[0]; PI[ia * (H + 1) + ib] = P[1]; }
  for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) {
    const kx = kOf(a), ky = kOf(b), k = Math.sqrt(kx * kx + ky * ky), o = a * N + b, w = Math.sqrt(G * k);
    KK[o] = k; OM[o] = w; CW[o] = Math.cos(w * DT); SW[o] = Math.sin(w * DT);
    if (k > KC || k === 0) continue;
    const ia = Math.abs(a < H ? a : a - N), ib = Math.abs(b < H ? b : b - N), pr = PR[ia * (H + 1) + ib], pi = (kx < 0 ? -1 : 1) * PI[ia * (H + 1) + ib];
    const sr = 2 * kx * pi, si = -2 * kx * pr, ph = -(kx * X0 + ky * Y0), c = Math.cos(ph), s = Math.sin(ph), sc = GAIN * U * DT / (DX * DX);
    SR[o] = sc * (sr * c - si * s); SI[o] = sc * (sr * s + si * c);
  }
  log('grid ' + N + ' x ' + N + ' of ' + DX + ' m, moving with her (waves of ' + f(2 * Math.PI / KC, 1) + ' m and longer); her footprint in ' + f((Date.now() - t0) / 1000, 1) + ' s; heights scaled by ' + f(GAIN, 3) + ' (the model\'s wave resistance over thin-ship theory\'s)');
}
const hr = new Float64Array(n2), hi = new Float64Array(n2), pr = new Float64Array(n2), pi = new Float64Array(n2);
const shC = new Float64Array(N), shS = new Float64Array(N); for (let a = 0; a < N; a++) { shC[a] = Math.cos(kOf(a) * U * DT); shS[a] = Math.sin(kOf(a) * U * DT); }
function stepWaves(gain) {
  for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) {
    const o = a * N + b, k = KK[o]; if (k === 0) continue;
    const c = CW[o], s = SW[o], w = OM[o]; let h0 = hr[o] * c + pr[o] * (k / w) * s, h1 = hi[o] * c + pi[o] * (k / w) * s, p0 = pr[o] * c - hr[o] * (G / w) * s, p1 = pi[o] * c - hi[o] * (G / w) * s;
    h0 += gain * SR[o]; h1 += gain * SI[o];
    // her frame: the sea goes astern at U: exp(+i kx U dt)
    const cc = shC[a], ss = shS[a];
    hr[o] = h0 * cc - h1 * ss; hi[o] = h0 * ss + h1 * cc; pr[o] = p0 * cc - p1 * ss; pi[o] = p0 * ss + p1 * cc;
  }
}
function heights() { const re = Float64Array.from(hr), im = Float64Array.from(hi); fft2(re, im, N, true); return re; }

// ---------------------------------------------------------------- the white water
const inHull = new Uint8Array(n2), YW = new Float64Array(N);
for (let a = 0; a < N; a++) { const x = a * DX - X0; YW[a] = x > HX0 && x < HX1 ? C.halfBreadth(x, Td) : 0; }
for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) { const x = a * DX - X0, y = b * DX - Y0; if (x > HX0 && x < HX1 && Math.abs(y) <= C.halfBreadth(x, Td)) inHull[a * N + b] = 1; }
// eddies: a few long waves of sideways and fore-and-aft water speed, fixed to the earth, their phases from a seed
function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const R = rng(1912), ED = []; for (let i = 0; i < 14; i++) { const lam = 14 + 60 * R(), th = 2 * Math.PI * R(); ED.push({ kx: 2 * Math.PI / lam * Math.cos(th), ky: 2 * Math.PI / lam * Math.sin(th), ph: 2 * Math.PI * R(), a: (0.5 + R()) / Math.sqrt(14) }); }
function eddy(xe, y) { let vx = 0, vy = 0; for (const e of ED) { const s = Math.sin(e.kx * xe + e.ky * y + e.ph) * e.a; vx += -e.ky * s; vy += e.kx * s; } return [vx * 12, vy * 12]; }   // solenoidal; about 1 m/s rms before EDDY
let Fb = new Float64Array(n2), Fw = new Float64Array(n2), Tb = new Float64Array(n2), Tw = new Float64Array(n2);
const samp = (A, a, b) => { if (a < 0 || b < 0 || a > N - 1.001 || b > N - 1.001) return 0; const a0 = Math.floor(a), b0 = Math.floor(b), fa = a - a0, fb = b - b0, o = a0 * N + b0; return A[o] * (1 - fa) * (1 - fb) + A[o + N] * fa * (1 - fb) + A[o + 1] * (1 - fa) * fb + A[o + N + 1] * fa * fb; };
function stepFoam(h, t, dt, gain) {
  let made = 0, steepest = 0;
  for (let a = 1; a < N - 1; a++) for (let b = 1; b < N - 1; b++) {
    const o = a * N + b; if (inHull[o]) { Tb[o] = 0; Tw[o] = 0; continue; }
    // where this water was dt ago: ahead of here by U dt, less what the eddies carried it (stronger where the water is white)
    const x = a * DX, y = b * DX, tu = EDDY * Math.min(1, Math.sqrt(Fb[o] + Fw[o])), e = eddy(x + U * t, y);
    const sa = (x + (U - tu * e[0]) * dt) / DX; let sb = (y - tu * e[1] * dt) / DX;
    // round her hull the water keeps its distance off her plating (it is pushed aside and closes in again astern) [bet: the
    // flow round her taken as her waterline's own shape, in place of the potential flow]
    { const yy = y - Y0, s0 = yy < 0 ? -1 : 1, eta = Math.abs(yy) - YW[a], au = Math.min(N - 1, Math.max(0, Math.round(sa))); if (eta > 0) sb = (Y0 + s0 * (YW[au] + eta)) / DX - tu * e[1] * dt / DX; }
    let fb = samp(Fb, sa, sb) * Math.exp(-dt / TAU_BREAK), fw = samp(Fw, sa, sb) * Math.exp(-dt / TAU_WAKE);
    const sx = (h[o + N] - h[o - N]) / (2 * DX), sy = (h[o + 1] - h[o - 1]) / (2 * DX), s = Math.sqrt(sx * sx + sy * sy); if (s > steepest) steepest = s;
    if (s > SLOPE_C) { const add = K_BREAK * (s - SLOPE_C) * dt * gain; fb += add; made += add; }
    // the race of the three screws, rising astern of her: full thrust
    const xs = x - X0, ys = y - Y0; if (xs < -122 && xs > -150) { const g = Math.exp(-0.5 * (ys * ys) / (8.5 * 8.5)); fw += K_RACE * g * dt * gain; }
    // the bow wave: linear theory cannot pile it up (0.5 to 1 m here against the 3 m or so of the bow-wave relation), so
    // its breaking is put in by rule: a sheet thrown off each bow from 5 to 40 m abaft the stem, within 8 m of her plating
    // [bet: K_BOW; its place from the relation's crest, a few metres abaft the stem]
    if (xs > HX1 - 42 && xs < HX1 - 4) { const dOut = Math.abs(ys) - C.halfBreadth(xs, Td); if (dOut >= 0 && dOut < 8) { const along = Math.min(1, (HX1 - 4 - xs) / 10) * Math.min(1, (xs - (HX1 - 42)) / 14); fb += K_BOW * Math.exp(-dOut / 3.5) * along * dt * gain; } }
    Tb[o] = fb > 1.5 ? 1.5 : fb; Tw[o] = fw > 1.5 ? 1.5 : fw;
  }
  const s1 = Fb; Fb = Tb; Tb = s1; const s2 = Fw; Fw = Tw; Tw = s2;
  return { made, steepest };
}

// ---------------------------------------------------------------- pictures
const CRC = (() => { const t = new Int32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c; } return t; })();
function crc(buf) { let c = -1; for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; }
function writePng(file, rgb) {
  const raw = Buffer.alloc(N * (N * 3 + 1));
  for (let row = 0; row < N; row++) { raw[row * (N * 3 + 1)] = 0; for (let b = 0; b < N; b++) for (let k = 0; k < 3; k++) raw[row * (N * 3 + 1) + 1 + b * 3 + k] = rgb[((N - 1 - row) * N + b) * 3 + k]; }
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]), c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(N, 0); ihdr.writeUInt32BE(N, 4); ihdr[8] = 8; ihdr[9] = 2;
  if (WRITE) { fs.mkdirSync(RES, { recursive: true }); fs.writeFileSync(path.join(RES, file), Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))])); }
}
const hash = (a, b) => { let x = Math.imul(a * 374761393 + b * 668265263, 1274126177); x ^= x >>> 13; return ((Math.imul(x, 1103515245) >>> 0) % 1000) / 1000; };
function lace(a, b) { const s = (q) => { const a0 = Math.floor(a / q), b0 = Math.floor(b / q), fa = a / q - a0, fb = b / q - b0; return hash(a0, b0) * (1 - fa) * (1 - fb) + hash(a0 + 1, b0) * fa * (1 - fb) + hash(a0, b0 + 1) * (1 - fa) * fb + hash(a0 + 1, b0 + 1) * fa * fb; }; return 0.45 * s(1.5) + 0.35 * s(4) + 0.2 * s(11); }
function pictures(h) {
  const A = new Uint8Array(n2 * 3), B = new Uint8Array(n2 * 3), sun = [0.45, -0.62, 0.64];       // [appearance]
  for (let a = 1; a < N - 1; a++) for (let b = 1; b < N - 1; b++) {
    const o = a * N + b, q = o * 3;
    let v = h[o] / 1.0; v = v > 1 ? 1 : (v < -1 ? -1 : v);
    A[q] = Math.round(20 + 105 * (1 + v) * 0.55 + (v > 0 ? 110 * v : 0)); A[q + 1] = Math.round(38 + 100 * (1 + v) * 0.6 + (v > 0 ? 80 * v : 0)); A[q + 2] = Math.round(70 + 85 * (1 + v));
    const sx = (h[o + N] - h[o - N]) / (2 * DX), sy = (h[o + 1] - h[o - 1]) / (2 * DX), nl = 1 / Math.sqrt(1 + sx * sx + sy * sy), nx = -sx * nl, ny = -sy * nl, nz = nl;
    const dif = Math.max(0, nx * sun[0] + ny * sun[1] + nz * sun[2]), hx = sun[0], hy = sun[1], hz = sun[2] + 1, hl = 1 / Math.sqrt(hx * hx + hy * hy + hz * hz), spec = Math.pow(Math.max(0, (nx * hx + ny * hy + nz * hz) * hl), 60);
    let r = 8 + 40 * dif + 150 * spec, g = 32 + 78 * dif + 150 * spec, bl = 58 + 105 * dif + 140 * spec;
    const F = Fb[o] + 0.8 * Fw[o], al = Math.max(0, Math.min(1, (F * (0.35 + 1.3 * lace(a, b)) - 0.10) / 0.42));
    const green = Math.min(1, Fw[o] * 1.2) * 0.35;                                   // aerated water under the foam [appearance]
    r += green * 30; g += green * 70; bl += green * 55;
    r = r * (1 - al) + 238 * al; g = g * (1 - al) + 244 * al; bl = bl * (1 - al) + 246 * al;
    if (inHull[o]) { const x = a * DX - X0, y = b * DX - Y0, deck = Math.abs(y) < C.halfBreadth(x, Td) - 2.5; r = deck ? 150 : 18; g = deck ? 120 : 18; bl = deck ? 86 : 20; for (const xf of [54.5, 19.8, -15.9, -50.5]) if (Math.abs(x - xf) < 3.2 && Math.abs(y) < 2.6) { r = 196; g = 150; bl = 70; } A[q] = 15; A[q + 1] = 15; A[q + 2] = 15; }
    B[q] = Math.min(255, Math.round(r)); B[q + 1] = Math.min(255, Math.round(g)); B[q + 2] = Math.min(255, Math.round(bl));
  }
  writePng('e52_heights.png', A); writePng('e52_as_seen.png', B);
}

// ---------------------------------------------------------------- the run: 100 s at 22.5 kn
const T_END = 100, DTF = 0.5; let t = 0, k = 0, last = null; const t0 = Date.now();
while (t < T_END - 1e-9) {
  const gain = Math.min(1, t / 15); stepWaves(gain); t += DT; k++;
  if (k % 2 === 0) { const h = heights(); last = stepFoam(h, t, DTF, gain); if (Math.abs(t % 20) < 1e-9) { let fb = 0, fw = 0; for (let o = 0; o < n2; o++) { fb += Fb[o] > 0.3 ? 1 : 0; fw += Fw[o] > 0.3 ? 1 : 0; } log('   t ' + f(t) + ' s: steepest slope ' + f(last.steepest, 3) + '; sea white from breaking ' + f(fb * DX * DX) + ' m2, from the race ' + f(fw * DX * DX) + ' m2'); } }
}
const h = heights();
log('100 s in ' + f((Date.now() - t0) / 1000, 1) + ' s here');
{
  const at = (x, y) => h[Math.round((X0 + x) / DX) * N + Math.round((Y0 + y) / DX)];
  log('the sea along her side (2 m off her plating), from the stem aft every 20 m, m: ' + Array.from({ length: 14 }, (_, i) => { const x = 126 - 20 * i; return f(at(x, C.halfBreadth(x, Td) + 2), 2); }).join(' '));
  // slopes: where the surface is steepest, and how much of it is steeper than the bet
  let n = 0, nb = 0, smax = 0, xs = 0, ys = 0; const dist = [0, 0, 0, 0];
  for (let a = 1; a < N - 1; a++) for (let b = 1; b < N - 1; b++) { const o = a * N + b; if (inHull[o]) continue; const sx = (h[o + N] - h[o - N]) / (2 * DX), sy = (h[o + 1] - h[o - 1]) / (2 * DX), s = Math.sqrt(sx * sx + sy * sy); n++; if (s > SLOPE_C) nb++; if (s > smax) { smax = s; xs = a * DX - X0; ys = b * DX - Y0; } if (s > 0.05) dist[0]++; if (s > 0.1) dist[1]++; if (s > 0.2) dist[2]++; if (s > 0.3) dist[3]++; }
  log('the steepest water: slope ' + f(smax, 3) + ' at ' + f(xs) + ' m forward of amidships, ' + f(Math.abs(ys)) + ' m off her centre line; steeper than 0.05, 0.1, 0.2, 0.3: ' + dist.map(d => f(d * DX * DX) + ' m2').join(', ') + '; breaking by the bet (over ' + SLOPE_C + '): ' + f(nb * DX * DX) + ' m2');
  let wb = 0, ww = 0, wide = []; for (const xb of [-150, -250, -400, -600]) { let lo = 1e9, hi2 = -1e9; const a = Math.round((X0 + xb) / DX); for (let b = 0; b < N; b++) if (Fw[a * N + b] + Fb[a * N + b] > 0.15) { const y = b * DX - Y0; if (y < lo) lo = y; if (y > hi2) hi2 = y; } wide.push(xb + ' m: ' + (hi2 > lo ? f(hi2 - lo) : '0') + ' m'); }
  for (let o = 0; o < n2; o++) { if (Fb[o] > 0.3) wb++; if (Fw[o] > 0.3) ww++; }
  log('white water at 100 s: ' + f(wb * DX * DX) + ' m2 from breaking, ' + f(ww * DX * DX) + ' m2 from the race; its width across her track at ' + wide.join(', '));
  log('foam 3 m off her plating (1 = white), from 10 m abaft the stem every 20 m: ' + Array.from({ length: 13 }, (_, i) => { const x = 118 - 20 * i, y = C.halfBreadth(x, Td) + 3; return f(Fb[Math.round((X0 + x) / DX) * N + Math.round((Y0 + y) / DX)], 2); }).join(' '));
}
pictures(h);
if (WRITE) { fs.mkdirSync(RES, { recursive: true }); fs.writeFileSync(path.join(RES, 'e52_wake_white_water_prototype.txt'), out.join('\n') + '\n'); }
