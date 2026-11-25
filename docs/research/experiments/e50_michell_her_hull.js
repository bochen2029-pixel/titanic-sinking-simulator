// e50: her free-wave spectrum and her wave resistance from her own hull, by Michell's thin-ship theory (1898), for
// docs/BRAINSTORM_the_wake_computed_v2_2026-11-19.md (section 3). The hull is the model's own, C.halfBreadth(x, z).
//
// Convention (x forward from amidships, zeta up from the still waterline, zeta <= 0 in the water, the ship moving toward
// +x at U through still water, Y(x, zeta) the half-breadth, k0 = g / U^2, theta the direction of a wave's travel from
// her course):
//   I(theta)   = double integral over her centre plane of Y exp(k0 sec^2(theta) zeta) exp(i k0 sec(theta) x) dx dzeta   (m3)
//   J(theta)   = the same of dY/dx = -i k0 sec(theta) I(theta), since Y is nought at both ends (by parts)
//   Rw         = (4 rho g^2 / (pi U^2)) integral 0..pi/2 of |J|^2 sec^3(theta) dtheta          (Michell's integral)
//              = (4 rho g^4 / (pi U^6)) integral 0..pi/2 of |I|^2 sec^5(theta) dtheta
//   |A(theta)| = (2 / pi) k0 sec^3(theta) |J| = (2 / pi) k0^2 sec^4(theta) |I|                  (the free-wave spectrum, m)
//   Rw         = (pi / 2) rho U^2 integral -pi/2..pi/2 of |A|^2 cos^3(theta) dtheta              (Havelock's formula)
// The two forms of Rw are the same number by construction; the constants are checked two other ways: against published
// figures for Wigley's parabolic hull (printed below for the research note to judge), and against the energy that a
// time-domain solution of the same linear problem leaves on the sea (e51: no Michell formula in it).
// Quadrature: Y sampled every dx and dz and taken as piecewise linear; the exponentials integrated exactly over each
// interval (Filon's way), so that short waves are not aliased; theta by tan(theta) in steps small against k0 L.
//   node docs/research/experiments/e50_michell_her_hull.js [TREE] [--write]
// TREE: a folder holding core/ (default: this repository; the output of 2026-11-19 is the committed tree a97a6bd's).
// Output: results_2026-11-19/e50_michell_her_hull.txt
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : path.join(__dirname, '..', '..', '..');
const C = require(path.join(ROOT, 'core', 'core.js')), M = require(path.join(ROOT, 'core', 'motion.js'));
const G = 9.81, RHO = 1025, KN = 1852 / 3600, DEG = Math.PI / 180;
const out = [], log = (s) => { out.push(s); console.log(s); };
const f = (v, n) => (v === null || v === undefined || !isFinite(v) ? 'n/a' : v.toFixed(n === undefined ? 0 : n));

// a hull as a grid: Y[i * nz + j] at x = x0 + i dx, zeta = -T + j dz (j = nz - 1 is the waterline)
function grid(Yf, x0, x1, T, dx, dz) {
  const nx = Math.round((x1 - x0) / dx) + 1, nz = Math.round(T / dz) + 1, Y = new Float64Array(nx * nz);
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) Y[i * nz + j] = Yf(x0 + i * dx, -T + j * dz);
  return { Y, nx, nz, x0, dx, dz, T };
}
// I(theta) for a grid at k0: returns [re, im]
function Iof(g, k0, sec) {
  const a = k0 * sec * sec, kap = k0 * sec, { Y, nx, nz, dx, dz } = g, ah = a * dz;
  // depth: integral over one interval of (f0 + (f1 - f0) s / h) exp(a s), s from 0 to h, times exp(a zeta0)
  let w0, w1;
  if (ah < 1e-4) { w0 = dz * (0.5 + ah / 6); w1 = dz * (0.5 + ah / 3); }
  else { const e = Math.exp(ah), q = (e * (ah - 1) + 1) / (ah * ah); w1 = dz * q; w0 = dz * ((e - 1) / ah - q); }
  const ez = new Float64Array(nz); for (let j = 0; j < nz; j++) ez[j] = Math.exp(a * (-g.T + j * dz));
  const F = new Float64Array(nx);
  for (let i = 0; i < nx; i++) { let s = 0; const o = i * nz; for (let j = 0; j < nz - 1; j++) s += ez[j] * (Y[o + j] * w0 + Y[o + j + 1] * w1); F[i] = s; }
  // length: integral over one interval of (F0 + (F1 - F0) s / h) exp(i kap s): F0 E1 + (F1 - F0) / h S
  const th = kap * dx; let e1r, e1i, sr, si;
  if (th < 1e-3) { e1r = dx * (1 - th * th / 6); e1i = dx * th / 2; sr = dx * dx * (0.5 - th * th / 8); si = dx * dx * th / 3; }
  else {
    const c = Math.cos(th), s = Math.sin(th);
    e1r = s / kap; e1i = (1 - c) / kap;
    // S = -[exp(i th)(i th - 1) + 1] / kap^2
    sr = -(-c - th * s + 1) / (kap * kap); si = -(th * c - s) / (kap * kap);
  }
  let re = 0, im = 0;
  for (let i = 0; i < nx - 1; i++) {
    const ph = kap * (g.x0 + i * dx), c = Math.cos(ph), s = Math.sin(ph), d = (F[i + 1] - F[i]) / dx;
    const tr = F[i] * e1r + d * sr, ti = F[i] * e1i + d * si;
    re += c * tr - s * ti; im += c * ti + s * tr;
  }
  return [re, im];
}
// the spectrum and the resistance at U: integrate in s = tan(theta); returns Rw (N) and samples of |A|
function michell(g, U, L, opt) {
  opt = opt || {};
  const k0 = G / (U * U), ds = (opt.step || 0.08) / (k0 * L), dEff = opt.dEff || 1.5;
  const sMax = Math.sqrt(Math.max(1, 18 / (k0 * dEff)));            // beyond it exp(-k0 sec^2 dEff) < 1e-7
  const n = Math.min(400000, Math.ceil(sMax / ds)); let sum = 0, sumH = 0; const A = [];
  for (let i = 0; i <= n; i++) {
    const s = sMax * i / n, sec = Math.sqrt(1 + s * s), I = Iof(g, k0, sec), I2 = I[0] * I[0] + I[1] * I[1];
    const w = (i === 0 || i === n ? 0.5 : 1) * sMax / n;
    sum += w * I2 * sec * sec * sec;                                 // |I|^2 sec^5 dtheta = |I|^2 sec^3 ds
    const a = 2 / Math.PI * k0 * k0 * sec * sec * sec * sec * Math.sqrt(I2);
    sumH += w * a * a / (sec * sec * sec * sec * sec);              // |A|^2 cos^3 dtheta = |A|^2 cos^5 ds
    if (opt.keep) A.push([Math.atan(s) / DEG, a, I[0], I[1]]);
  }
  const Rw = 4 * RHO * G * G * G * G / (Math.PI * Math.pow(U, 6)) * sum, RwH = Math.PI * RHO * U * U * sumH;   // Havelock: (pi/2) x 2 sides
  return { Rw, RwH, k0, n, A };
}

// ---------------------------------------------------------------- 1. Wigley's hull: the code against the literature
log('e50: Michell\'s integral for her own hull (tree: ' + ROOT + ')');
log('\n1. WIGLEY\'S PARABOLIC HULL, L/B 10, B/T 1.6 (Y = (B/2)(1 - (2x/L)^2)(1 - (zeta/T)^2)): the code\'s check');
{
  const L = 100, B = 10, T = 6.25, Yf = (x, z) => (Math.abs(x) > L / 2 ? 0 : 0.5 * B * (1 - 4 * x * x / (L * L)) * (1 - z * z / (T * T)));
  const g = grid(Yf, -L / 2, L / 2, T, 0.125, 0.125);
  // wetted surface by quadrature (both sides)
  let S = 0; const hx = 0.05, hz = 0.05;
  for (let x = -L / 2 + hx / 2; x < L / 2; x += hx) for (let z = -T + hz / 2; z < 0; z += hz) {
    const yx = 0.5 * B * (-8 * x / (L * L)) * (1 - z * z / (T * T)), yz = 0.5 * B * (1 - 4 * x * x / (L * L)) * (-2 * z / (T * T));
    S += 2 * Math.sqrt(1 + yx * yx + yz * yz) * hx * hz;
  }
  let vol = 0; for (let i = 0; i < g.nx; i++) for (let j = 0; j < g.nz; j++) vol += 2 * g.Y[i * g.nz + j] * g.dx * g.dz * ((i === 0 || i === g.nx - 1) ? 0.5 : 1) * ((j === 0 || j === g.nz - 1) ? 0.5 : 1);
  log('   wetted surface ' + f(S / (L * L), 5) + ' L^2 (the usual 0.1487 L^2 [from memory]); volume ' + f(vol / (L * B * T), 4) + ' L B T (4/9 = 0.4444)');
  log('   Fn      Cw x 1000 (Rw / (0.5 rho U^2 S))   Rw / (rho g vol) x 1000   the two forms agree to');
  for (const Fn of [0.16, 0.18, 0.20, 0.22, 0.24, 0.25, 0.267, 0.28, 0.30, 0.316, 0.33, 0.35, 0.40, 0.45, 0.50, 0.60]) {
    const U = Fn * Math.sqrt(G * L), r = michell(g, U, L, { step: 0.05, dEff: 0.3 });
    log('   ' + f(Fn, 3) + '   ' + f(1000 * r.Rw / (0.5 * RHO * U * U * S), 4).padStart(8) + '                         ' + f(1000 * r.Rw / (RHO * G * vol), 4).padStart(8) + '                 ' + (Math.abs(r.Rw / r.RwH - 1)).toExponential(1));
  }
  // convergence: halve the steps
  const U = 0.316 * Math.sqrt(G * L), a = michell(g, U, L, { step: 0.05, dEff: 0.3 }), b = michell(grid(Yf, -L / 2, L / 2, T, 0.0625, 0.0625), U, L, { step: 0.025, dEff: 0.3 });
  log('   convergence at Fn 0.316: every step halved changes Rw by ' + (Math.abs(b.Rw / a.Rw - 1)).toExponential(1));
}

// ---------------------------------------------------------------- 2. her hull
const S0 = M.SHIP, Td = S0.d;
function herGrid(T, dx, dz) { const x1 = C.xFwd(T) + 0.5, x0 = C.G.xAP - 0.5; return grid((x, z) => C.halfBreadth(x, z + T), x0, x1, T, dx, dz); }
log('\n2. HER HULL at the night\'s mean draught, ' + f(Td, 2) + ' m (core/motion.js SHIP.d), level');
const gH = herGrid(Td, 0.25, 0.1229 * 2);
{
  let vol = 0, Awp = 0, xa = 1e9, xf = -1e9, amid = 0;
  for (let i = 0; i < gH.nx; i++) {
    const x = gH.x0 + i * gH.dx, yw = gH.Y[i * gH.nz + gH.nz - 1];
    if (yw > 1e-6) { if (x < xa) xa = x; if (x > xf) xf = x; }
    Awp += 2 * yw * gH.dx; let sec = 0;
    for (let j = 0; j < gH.nz; j++) sec += 2 * gH.Y[i * gH.nz + j] * gH.dz * ((j === 0 || j === gH.nz - 1) ? 0.5 : 1);
    vol += sec * gH.dx; if (sec > amid) amid = sec;
  }
  const Lwl = xf - xa;
  log('   waterline ' + f(xa, 1) + ' to ' + f(xf, 1) + ' m: ' + f(Lwl, 1) + ' m; displaced ' + f(vol) + ' m3 (' + f(vol * RHO / 1000) + ' t; the model\'s mass ' + f(S0.m / 1000) + ' t); block ' + f(vol / (Lwl * C.G.B * Td), 3) + ', prismatic ' + f(vol / (amid * Lwl), 3) + ', waterplane ' + f(Awp / (Lwl * C.G.B), 3) + ', midship ' + f(amid / (C.G.B * Td), 3));
  // the waterline's entrance: half-angle from the stem over the first metres, and the run aft
  const Yw = (x) => C.halfBreadth(x, Td), xs = C.xFwd(Td);
  const ang = (d) => Math.atan(Yw(xs - d) / d) / DEG;
  log('   entrance half-angle of the waterline, from the stem over 5, 10, 20, 30 m: ' + [5, 10, 20, 30].map(d => f(ang(d), 1)).join(', ') + ' deg; half-breadth 20 m aft of the stem ' + f(Yw(xs - 20), 2) + ' m');
  const xr = C.G.xAP; log('   run half-angle at the stern over 10, 20, 30 m: ' + [10, 20, 30].map(d => f(Math.atan(Yw(xr + d) / d) / DEG, 1)).join(', ') + ' deg');
}
// Holtrop 1984 as in e16_resistance_shape.js (its function, copied): the motion model's resistance takes its shape
function holtrop(V, o) {
  const L = S0.L, B = S0.B, T = S0.d, vol = S0.m / RHO, CB = vol / (L * B * T), CM = o.CM, CP = CB / CM, CWP = o.CWP, lcb = o.lcb;
  const LR = L * (1 - CP + 0.06 * CP * lcb / (4 * CP - 1));
  const Sw = L * (2 * T + B) * Math.sqrt(CM) * (0.453 + 0.4425 * CB - 0.2862 * CM - 0.003467 * B / T + 0.3696 * CWP);
  const k1 = 0.93 + 0.487118 * Math.pow(B / L, 1.06806) * Math.pow(T / L, 0.46106) * Math.pow(L / LR, 0.121563) * Math.pow(L * L * L / vol, 0.36486) * Math.pow(1 - CP, -0.604247) - 1;
  const Rn = V * L / o.nu, CF = 0.075 / Math.pow(Math.log10(Rn) - 2, 2), RF = 0.5 * RHO * V * V * Sw * CF;
  const BL = B / L, c7 = BL < 0.11 ? 0.229577 * Math.pow(BL, 1 / 3) : (BL <= 0.25 ? BL : 0.5 - 0.0625 * L / B);
  const iE = 1 + 89 * Math.exp(-Math.pow(L / B, 0.80856) * Math.pow(1 - CWP, 0.30484) * Math.pow(1 - CP - 0.0225 * lcb, 0.6367) * Math.pow(LR / B, 0.34574) * Math.pow(100 * vol / (L * L * L), 0.16302));
  const c1 = 2223105 * Math.pow(c7, 3.78613) * Math.pow(T / B, 1.07961) * Math.pow(90 - iE, -1.37565);
  const c15 = L * L * L / vol < 512 ? -1.69385 : (L * L * L / vol < 1727 ? -1.69385 + (L / Math.pow(vol, 1 / 3) - 8) / 2.36 : 0);
  const c16 = CP < 0.8 ? 8.07981 * CP - 13.8673 * CP * CP + 6.984388 * CP * CP * CP : 1.73014 - 0.7067 * CP;
  const m1 = 0.0140407 * L / T - 1.75254 * Math.pow(vol, 1 / 3) / L - 4.79323 * B / L - c16;
  const Fn = V / Math.sqrt(G * L), m4 = 0.4 * c15 * Math.exp(-0.034 * Math.pow(Fn, -3.29));
  const lam = L / B < 12 ? 1.446 * CP - 0.03 * L / B : 1.446 * CP - 0.36;
  const RW = c1 * vol * RHO * G * Math.exp(m1 * Math.pow(Fn, -0.9) + m4 * Math.cos(lam * Math.pow(Fn, -2)));
  return { RW, RF, k1, iE, Sw, Fn };
}
const BASE = { CM: 0.975, CWP: 0.78, lcb: 100 * S0.xG / S0.L, nu: 1.19e-6 };
const Rmodel = (u) => { const P = S0.resist; let x = u / P.uB; if (x < P.x0) x = P.x0; else if (x > P.x1) x = P.x1; return S0.cR * u * u * (P.g[0] + x * (P.g[1] + x * (P.g[2] + x * P.g[3]))); };
log('   Holtrop\'s own entrance half-angle for this hull (his regression, e16): ' + f(holtrop(10, BASE).iE, 1) + ' deg');
log('\n3. HER WAVE RESISTANCE AND SPECTRUM AGAINST SPEED');
log('   kn    Fn     k0 L   waves    Rw Michell  Rw Holtrop  ratio  model\'s whole  Michell    power into   |A| ahead  |A| largest  at     transverse wave\'s height (crest to trough)');
log('                       along    kN          kN                 resistance kN  share      waves MW     m          m            deg    300 m and 1,000 m astern, m');
const rows = [];
for (const kn of [5, 8, 10, 12, 14, 16, 18, 19, 20, 21, 22, 22.5, 23, 24]) {
  const U = kn * KN, r = michell(gH, U, S0.L, { keep: true }), h = holtrop(U, BASE), Rm = Rmodel(U);
  let amax = 0, tmax = 0; for (const a of r.A) if (a[1] > amax) { amax = a[1]; tmax = a[0]; }
  const A0 = r.A[0][1], hT = (x) => 2 * A0 * Math.sqrt(2 * Math.PI / (r.k0 * x));
  rows.push({ kn, U, r, h, Rm, A0, amax, tmax });
  log('   ' + f(kn, 1).padStart(4) + '  ' + f(U / Math.sqrt(G * S0.L), 3) + '  ' + f(r.k0 * S0.L, 1).padStart(6) + '  ' + f(r.k0 * S0.L / (2 * Math.PI), 1).padStart(5) + '   ' + f(r.Rw / 1000, 1).padStart(8) + '    ' + f(h.RW / 1000, 1).padStart(8) + '   ' + f(r.Rw / h.RW, 2).padStart(5) + '   ' + f(Rm / 1000).padStart(8) + '      ' + f(100 * r.Rw / Rm, 1).padStart(5) + ' %   ' + f(r.Rw * U / 1e6, 2).padStart(7) + '      ' + f(A0, 3).padStart(6) + '     ' + f(amax, 3).padStart(6) + '      ' + f(tmax, 0).padStart(3) + '    ' + f(hT(300), 2) + ', ' + f(hT(1000), 2));
}
// how fast it grows near full speed, and where the humps and hollows are
{
  const lo = rows.find(r => r.kn === 18), hi = rows.find(r => r.kn === 22.5);
  log('   between 18 and 22.5 kn Michell\'s Rw grows as U^' + f(Math.log(hi.r.Rw / lo.r.Rw) / Math.log(hi.U / lo.U), 1) + ' and the transverse amplitude as U^' + f(Math.log(hi.A0 / lo.A0) / Math.log(hi.U / lo.U), 1));
  let s = '   Rw / U^6 against speed (humps and hollows of the interference): ';
  for (let kn = 12; kn <= 24.01; kn += 0.5) { const U = kn * KN, r = michell(gH, U, S0.L); s += f(kn, 1) + ':' + f(r.Rw / Math.pow(U, 6) * 1e3, 1) + ' '; }
  log(s);
}
// the spectrum at full speed, by direction
{
  const r = rows.find(q => q.kn === 22.5).r; let s = '';
  for (const t of [0, 10, 20, 30, 35.26, 40, 50, 60, 70, 75, 80]) { let best = r.A[0]; for (const a of r.A) if (Math.abs(a[0] - t) < Math.abs(best[0] - t)) best = a; s += f(t, 0) + ':' + f(best[1], 3) + ' '; }
  log('\n4. THE SPECTRUM AT 22.5 kn, |A| in m by wave direction (deg from her course; 35.26 is the cusp\'s): ' + s);
  // the share of the wave resistance carried by the transverse (theta < 35.26) and the divergent waves
  let t = 0, d = 0; for (let i = 1; i < r.A.length; i++) { const a = r.A[i], th = a[0] * DEG, dth = (a[0] - r.A[i - 1][0]) * DEG, e = a[1] * a[1] * Math.pow(Math.cos(th), 3) * dth; if (a[0] < 35.264) t += e; else d += e; }
  log('   of her wave resistance, the transverse waves carry ' + f(100 * t / (t + d)) + ' % and the divergent ' + f(100 * d / (t + d)) + ' %');
}
// the draught: deeper by the head after the ice is another hull
{
  const U = 22.5 * KN, a = michell(gH, U, S0.L).Rw, b = michell(herGrid(10.54, 0.25, 0.2635), U, S0.L).Rw;
  log('\n5. AT HER LOAD DRAUGHT (10.54 m, 34 ft 7 in) at 22.5 kn: Rw ' + f(b / 1000, 1) + ' kN, ' + f(100 * (b / a - 1), 1) + ' % on the night\'s draught');
}
if (process.argv.includes('--write')) { const dir = path.join(__dirname, 'results_2026-11-19'); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, 'e50_michell_her_hull.txt'), out.join('\n') + '\n'); }
