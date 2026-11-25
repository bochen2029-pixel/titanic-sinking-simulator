// e16: M3, the speed against revolutions below 60 rpm. The model's resistance is purely quadratic (cR u|u|, Biles's 165 tons
// at 21 kn scaled to the night's displacement), so with its linear screw law the steady speed is exactly proportional to the
// revolutions while the turbine is in (homogeneous of degree 2 in n and u): 0.295 kn per rpm everywhere. The consensus
// (docs/research/RESEARCH_handling_consensus_v1_2026-11-16.md, section 5 and 8.5) wants Half (50 rpm, turbine in)
// 15.3 kn, 14.9-15.9, and Slow (30 rpm, turbine out) 8.6 kn, 8.2-9.2; the model gives 14.77 and 7.86.
// A real hull's resistance is not quadratic: friction grows a little slower than u^2 (the friction coefficient falls with
// the Reynolds number) and wave-making much faster. Here the SHAPE of Holtrop's 1984 method (formulas as reproduced in
// docs/research/RESEARCH_mmg_hull_rudder_propeller_models_v1_2026-11-16.md, M6; no bulb, no transom; C_M, C_WP assumed)
// is put under the model's resistance, still equal to Biles's figure at 21 kn, the screws recalibrated to 75 rpm = 22.15 kn
// against it as now. Then the speeds at 30, 50, 60, 74 rpm against the consensus's bands, the shape's sensitivity to the
// assumed coefficients, and the trailing centre screw's drag (Cdw: 0.25 [bet] before M4; the B-series' drag at zero torque,
// 0.10, since: docs/research/RESEARCH_propeller_four_quadrant_v1_2026-11-17.md). Every row names its Cdw; sections 3-5 use
// the one before M4, so that the shape alone is compared.
//   node docs/research/experiments/e16_resistance_shape.js [repo root] [--write]
// Output of 2026-11-17: results_2026-11-17/e16_resistance_shape.txt
const fs = require('fs'), path = require('path');
const root = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : path.join(__dirname, '..', '..', '..');
const C = require(path.join(root, 'core', 'core.js')), M = require(path.join(root, 'core', 'motion.js'));
const RHO = C.RHO, G = C.GRAV, KN = M.KN, S0 = M.SHIP, CDW0 = 0.25;
const out = [], log = (s) => { out.push(s); console.log(s); };
const f = (v, n) => (v === null || v === undefined || !isFinite(v) ? 'n/a' : v.toFixed(n === undefined ? 0 : n));

// ---- Holtrop 1984 for this hull
function holtrop(V, o) {                              // V m/s; o: { CM, CWP, lcb, nu } -> components in N
  const L = S0.L, B = S0.B, T = S0.d, vol = S0.m / RHO, CB = vol / (L * B * T), CM = o.CM, CP = CB / CM, CWP = o.CWP, lcb = o.lcb;
  const LR = L * (1 - CP + 0.06 * CP * lcb / (4 * CP - 1));
  const Sw = L * (2 * T + B) * Math.sqrt(CM) * (0.453 + 0.4425 * CB - 0.2862 * CM - 0.003467 * B / T + 0.3696 * CWP);
  const k1 = 0.93 + 0.487118 * Math.pow(B / L, 1.06806) * Math.pow(T / L, 0.46106) * Math.pow(L / LR, 0.121563) * Math.pow(L * L * L / vol, 0.36486) * Math.pow(1 - CP, -0.604247) - 1;   // the formula gives 1 + k1
  const Rn = V * L / o.nu, CF = 0.075 / Math.pow(Math.log10(Rn) - 2, 2), RF = 0.5 * RHO * V * V * Sw * CF;
  const BL = B / L, c7 = BL < 0.11 ? 0.229577 * Math.pow(BL, 1 / 3) : (BL <= 0.25 ? BL : 0.5 - 0.0625 * L / B);
  const iE = 1 + 89 * Math.exp(-Math.pow(L / B, 0.80856) * Math.pow(1 - CWP, 0.30484) * Math.pow(1 - CP - 0.0225 * lcb, 0.6367) * Math.pow(LR / B, 0.34574) * Math.pow(100 * vol / (L * L * L), 0.16302));
  const c1 = 2223105 * Math.pow(c7, 3.78613) * Math.pow(T / B, 1.07961) * Math.pow(90 - iE, -1.37565), c2 = 1, c5 = 1;
  const c15 = L * L * L / vol < 512 ? -1.69385 : (L * L * L / vol < 1727 ? -1.69385 + (L / Math.pow(vol, 1 / 3) - 8) / 2.36 : 0);
  const c16 = CP < 0.8 ? 8.07981 * CP - 13.8673 * CP * CP + 6.984388 * CP * CP * CP : 1.73014 - 0.7067 * CP;
  const m1 = 0.0140407 * L / T - 1.75254 * Math.pow(vol, 1 / 3) / L - 4.79323 * B / L - c16;
  const Fn = V / Math.sqrt(G * L), m4 = 0.4 * c15 * Math.exp(-0.034 * Math.pow(Fn, -3.29));
  const lam = L / B < 12 ? 1.446 * CP - 0.03 * L / B : 1.446 * CP - 0.36;
  const RW = c1 * c2 * c5 * vol * RHO * G * Math.exp(m1 * Math.pow(Fn, -0.9) + m4 * Math.cos(lam * Math.pow(Fn, -2)));
  const c4 = Math.min(0.5 * (C.DEFAULT_PARAMS.draftF) / L, 0.04);
  const CA = 0.006 * Math.pow(L + 100, -0.16) - 0.00205 + 0.003 * Math.sqrt(L / 7.5) * Math.pow(CB, 4) * c2 * (0.04 - c4);
  const RA = 0.5 * RHO * V * V * Sw * CA;
  return { RF, k1, RW, RA, R: RF * (1 + k1) + RW + RA, Sw, CF, CB, CP, Fn };
}
const BASE = { CM: 0.975, CWP: 0.78, lcb: 100 * S0.xG / S0.L, nu: 1.19e-6 };
const VB = 21 * KN;                                   // Biles's point: the model's resistance equals cR VB^2 there

// ---- steady speeds with a resistance R(u) = cR u^2 g(u), the screws recalibrated as derive() does, against R(u0)
function speeds(g, Cdw) {
  const S = S0, u0 = S.cal.kn * KN, n0 = S.cal.rpm / 60, sc = [S.wing, S.wing, S.centre], ns = [n0, n0, n0 * S.turbineRatio], R0 = S.cR * u0 * u0 * g(u0), scr = [];
  for (let i = 0; i < 3; i++) {
    const p = sc[i], D2 = p.D * p.D, D4 = D2 * D2, J = u0 * (1 - p.w) / (ns[i] * p.D), T = S.cal.share[i] * R0 / (1 - S.tP);
    scr.push({ D: p.D, D4, w: p.w, J0: p.J0, a: T / (RHO * ns[i] * ns[i] * D4 * (1 - J / p.J0)), A: Math.PI * D2 / 4 });
  }
  const Cd = Cdw === undefined ? CDW0 : Cdw;
  function bal(u, rpm, tin) {
    const nn = [rpm / 60, rpm / 60, tin ? rpm / 60 * S.turbineRatio : 0]; let X = 0;
    for (let i = 0; i < 3; i++) {
      const p = scr[i], n = nn[i], Va = u * (1 - p.w);
      if (i === 2 && !tin) { X -= 0.5 * RHO * Cd * p.A * Va * Va; continue; }
      X += RHO * p.D4 * p.a * (n * n - n * Va / (p.D * p.J0));
    }
    return (1 - S.tP) * X - S.cR * u * u * g(u);
  }
  return (rpm, tin) => { let lo = 0.01, hi = 16; for (let i = 0; i < 80; i++) { const mid = 0.5 * (lo + hi); if (bal(mid, rpm, tin) > 0) lo = mid; else hi = mid; } return 0.5 * (lo + hi) / KN; };
}
const BANDS = [[75, true, 21.75, 22.3, 'Full 75'], [74, true, 21.4, 21.9, '74'], [60, true, 17.3, 18.0, '60'], [50, true, 14.9, 15.9, 'Half 50'], [30, false, 8.2, 9.2, 'Slow 30 (turbine out)']];
function table(label, g, Cdw) {
  const sp = speeds(g, Cdw), r = BANDS.map(([rpm, tin, lo, hi]) => { const v = sp(rpm, tin); return { v, ok: v >= lo && v <= hi }; });
  return label.padEnd(44) + r.map((x, i) => (f(x.v, 2) + (x.ok ? ' in ' : ' OUT')).padStart(11)).join('') + '   ' + r.filter(x => x.ok).length + '/5';
}

log('e16: the speed against revolutions with a resistance shaped by Holtrop 1984 (equal to Biles\'s at 21 kn). Hull: L ' + f(S0.L, 2) + ' m, B ' + f(S0.B, 2) + ' m, T ' + f(S0.d, 2) + ' m, ' + f(S0.m / 1000) + ' t');
log('\n1. HOLTROP 1984 FOR THIS HULL (C_M ' + BASE.CM + ', C_WP ' + BASE.CWP + ', lcb ' + f(BASE.lcb, 2) + ' % assumed; nu ' + BASE.nu + ')');
{ const h = holtrop(22.5 * KN, BASE); log('   at 22.5 kn: S ' + f(h.Sw) + ' m2, C_B ' + f(h.CB, 3) + ', C_P ' + f(h.CP, 3) + ', Fn ' + f(h.Fn, 3) + ', C_F ' + f(h.CF, 5) + ', 1+k1 ' + f(1 + h.k1, 3)); }
log('   kn     R_F(1+k1)  R_W     R_A     total kN   wave share   R / (cR u^2) relative to 21 kn');
const g0 = (u, o) => { const a = holtrop(u, o || BASE).R / (u * u), b = holtrop(VB, o || BASE).R / (VB * VB); return a / b; };
for (const kn of [6, 8, 10, 12, 14, 16, 18, 20, 21, 22, 22.5, 23]) {
  const h = holtrop(kn * KN, BASE);
  log('   ' + String(kn).padEnd(6) + f(h.RF * (1 + h.k1) / 1e3).padStart(9) + f(h.RW / 1e3).padStart(8) + f(h.RA / 1e3).padStart(8) + f(h.R / 1e3).padStart(10) + f(100 * h.RW / h.R, 1).padStart(10) + ' %' + f(g0(kn * KN), 4).padStart(14));
}
log('   (the model\'s cR u^2 at 21 kn: ' + f(S0.cR * VB * VB / 1e3) + ' kN; Holtrop\'s bare hull there: ' + f(holtrop(VB, BASE).R / 1e3) + ' kN)');

log('\n2. STEADY SPEEDS (kn) against the consensus: Full 75 21.75-22.3; 74 21.4-21.9; 60 17.3-18.0; Half 50 14.9-15.9; Slow 30 8.2-9.2');
log(''.padEnd(44) + BANDS.map(b => b[4].split(' ')[0].padStart(11)).join(''));
log(table('quadratic, Cdw 0.25 (before M3, M4)', () => 1));
log(table('Holtrop shape, Cdw 0.25', u => g0(u)));
for (const Cdw of [0.15, 0.1, 0.05, 0]) log(table('Holtrop shape, centre screw Cdw ' + Cdw, u => g0(u), Cdw));
log(table('quadratic, centre screw Cdw 0', () => 1, 0));
{ const P = S0.resist, poly = (u) => { let x = u / P.uB; if (x < P.x0) x = P.x0; else if (x > P.x1) x = P.x1; return P.g[0] + x * (P.g[1] + x * (P.g[2] + x * P.g[3])); };
  log(table('AS BUILT: SHIP.resist\'s cubic, Cdw ' + S0.centre.Cdw, poly, S0.centre.Cdw)); }

log('\n3. THE SHAPE\'S SENSITIVITY TO THE ASSUMED COEFFICIENTS');
for (const [label, o] of [['C_M 0.96', { CM: 0.96 }], ['C_M 0.99', { CM: 0.99 }], ['C_WP 0.74', { CWP: 0.74 }], ['C_WP 0.82', { CWP: 0.82 }], ['lcb +1 %', { lcb: 1 }], ['lcb -3 %', { lcb: -3 }], ['nu 1.83e-6 (sea at -2 C)', { nu: 1.83e-6 }]]) {
  const oo = Object.assign({}, BASE, o); log(table(label, u => g0(u, oo)));
}
log('\n4. A WAVE SHARE ALONE (R = cR u^2 (1 - s + s (u/u21)^2), friction quadratic): how much is needed');
for (const s of [0.05, 0.1, 0.15, 0.2, 0.3]) log(table('s ' + s, u => (1 - s + s * (u / VB) * (u / VB))));

// 5. The shape as the model can carry it: a polynomial in x = u / u21 (no Math.pow in the step), least squares on Holtrop's
// g over 3 to 25 kn, held at its end values outside; the speeds again with it
log('\n5. THE SHAPE AS A POLYNOMIAL in x = u / (21 kn), fitted over 3-25 kn (least squares, 89 points), held constant outside');
const X0 = 3 / 21, X1 = 25 / 21;
function lsq(deg) {
  const xs = [], ys = [];
  for (let i = 0; i <= 88; i++) { const kn = 3 + 22 * i / 88; xs.push(kn / 21); ys.push(g0(kn * KN)); }
  const n = deg + 1, A = Array.from({ length: n }, () => new Array(n + 1).fill(0));
  for (let k = 0; k < xs.length; k++) { const p = []; let v = 1; for (let j = 0; j < n; j++) { p.push(v); v *= xs[k]; } for (let r = 0; r < n; r++) { for (let c = 0; c < n; c++) A[r][c] += p[r] * p[c]; A[r][n] += p[r] * ys[k]; } }
  for (let c = 0; c < n; c++) { let piv = c; for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[piv][c])) piv = r; [A[c], A[piv]] = [A[piv], A[c]]; for (let r = 0; r < n; r++) if (r !== c) { const q = A[r][c] / A[c][c]; for (let k = c; k <= n; k++) A[r][k] -= q * A[c][k]; } }
  const co = A.map((row, i) => row[n] / row[i]);
  let err = 0; for (let k = 0; k < xs.length; k++) { let v = 0; for (let j = deg; j >= 0; j--) v = v * xs[k] + co[j]; err = Math.max(err, Math.abs(v / ys[k] - 1)); }
  return { co, err };
}
for (const deg of [3, 4, 5, 6]) {
  const { co, err } = lsq(deg);
  // renormalise so that g(1) = 1 exactly (Biles's point), then the speeds; the error is given both ways (the period-curve
  // research note found the cubic's error after renormalising, 0.84 %, where only the 0.49 % before it was reported)
  const s1 = co.reduce((a, c) => a + c, 0), cn = co.map(c => c / s1);
  const poly = (u) => { let x = u / VB; if (x < X0) x = X0; else if (x > X1) x = X1; let v = 0; for (let j = deg; j >= 0; j--) v = v * x + cn[j]; return v; };
  let errN = 0; for (let i = 0; i <= 88; i++) { const kn = 3 + 22 * i / 88; errN = Math.max(errN, Math.abs(poly(kn * KN) / g0(kn * KN) - 1)); }
  log(table('degree ' + deg + ', max error ' + f(100 * err, 2) + ' % (' + f(100 * errN, 2) + ' % as used)', poly));
  log('    coefficients (g(1) = 1): [' + cn.map(c => c.toPrecision(17)).join(', ') + ']');
}

if (process.argv.includes('--write')) {
  const dir = path.join(__dirname, 'results_2026-11-17');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, 'e16_resistance_shape.txt'), out.join('\n') + '\n');
}
