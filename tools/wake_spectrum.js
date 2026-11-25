// wake_spectrum.js: her waves by Michell's thin-ship theory from her own hull, against what the motion model's resistance
// spends on waves, and the scale that makes the page's wake carry off exactly that (site/parts/24_wake_field.js, SCALE).
//
//   node tools/wake_spectrum.js            the table -> out/wake_spectrum.txt (through tools/outdir.js), and whether the
//                                          table baked into the library is the one these sources give
//   node tools/wake_spectrum.js --bake     write the scale into site/parts/24_wake_field.js (its @@SCALE@@ line). Do it
//                                          after any change to her hull's form (C.halfBreadth), her draught (SHIP.d), her
//                                          mass or the constants below; then node tools/build_site.js
//
// Michell (1898), with the constants as tools/wake_tests.js checks them against Wigley's hull:
//   Rw = (4 rho g^4 / (pi U^6)) x the integral over 0..90 deg of |P|^2 sec^5(theta)
// Holtrop (1984), the wave-making part: the function of docs/research/experiments/e16_resistance_shape.js, which gave
// the motion model its resistance's shape (SHIP.resist, M3). Its wave resistance in newtons is taken as it stands; the
// motion model's own level is Biles's figure (SHIP.cR), so "what the model spends on waves" is Holtrop's share of a
// resistance of Holtrop's shape [stated].
// The scale at speed U is sqrt(Rw Holtrop / Rw Michell for all her waves): heights times it, energy times its square.
'use strict';
const fs = require('fs');
const path = require('path');
const C = require('../core/core.js');
const M = require('../core/motion.js');
const WF = require('../site/parts/24_wake_field.js');
const outFile = require('./outdir');
const G = C.GRAV, RHO = C.RHO, KN = WF.KN, S0 = M.SHIP;
const out = [], log = (s) => { out.push(s); console.log(s); };
const f = (v, n) => (v === null || v === undefined || !isFinite(v) ? 'n/a' : v.toFixed(n === undefined ? 0 : n));

// Holtrop's wave resistance for her (C_M 0.975 and C_WP 0.78 assumed, as M3; no bulb, no transom)
const BASE = { CM: 0.975, CWP: 0.78, lcb: 100 * S0.xG / S0.L, nu: 1.19e-6 };
function holtrop(V, o) {
  o = o || BASE;
  const L = S0.L, B = S0.B, T = S0.d, vol = S0.m / RHO, CB = vol / (L * B * T), CM = o.CM, CP = CB / CM, CWP = o.CWP, lcb = o.lcb;
  const LR = L * (1 - CP + 0.06 * CP * lcb / (4 * CP - 1));
  const BL = B / L, c7 = BL < 0.11 ? 0.229577 * Math.pow(BL, 1 / 3) : (BL <= 0.25 ? BL : 0.5 - 0.0625 * L / B);
  const iE = 1 + 89 * Math.exp(-Math.pow(L / B, 0.80856) * Math.pow(1 - CWP, 0.30484) * Math.pow(1 - CP - 0.0225 * lcb, 0.6367) * Math.pow(LR / B, 0.34574) * Math.pow(100 * vol / (L * L * L), 0.16302));
  const c1 = 2223105 * Math.pow(c7, 3.78613) * Math.pow(T / B, 1.07961) * Math.pow(90 - iE, -1.37565);
  const c15 = L * L * L / vol < 512 ? -1.69385 : (L * L * L / vol < 1727 ? -1.69385 + (L / Math.pow(vol, 1 / 3) - 8) / 2.36 : 0);
  const c16 = CP < 0.8 ? 8.07981 * CP - 13.8673 * CP * CP + 6.984388 * CP * CP * CP : 1.73014 - 0.7067 * CP;
  const m1 = 0.0140407 * L / T - 1.75254 * Math.pow(vol, 1 / 3) / L - 4.79323 * B / L - c16;
  const Fn = V / Math.sqrt(G * L), m4 = 0.4 * c15 * Math.exp(-0.034 * Math.pow(Fn, -3.29));
  const lam = L / B < 12 ? 1.446 * CP - 0.03 * L / B : 1.446 * CP - 0.36;
  return { RW: c1 * vol * RHO * G * Math.exp(m1 * Math.pow(Fn, -0.9) + m4 * Math.cos(lam * Math.pow(Fn, -2))), iE, Fn };
}
// the motion model's whole resistance at u (core/motion.js: cR u^2 g(u / uB))
const Rmodel = (u) => { const P = S0.resist; let x = u / P.uB; if (x < P.x0) x = P.x0; else if (x > P.x1) x = P.x1; return S0.cR * u * u * (P.g[0] + x * (P.g[1] + x * (P.g[2] + x * P.g[3]))); };

const hull = WF.herHull();
const scaleAt = (kn) => { const U = kn * KN, mi = WF.michell(hull, U, { L: S0.L }).Rw, h = holtrop(U).RW; return mi > 0 && h > 0 ? Math.sqrt(h / mi) : 0; };
function table() {
  const c = []; for (let i = 0; ; i++) { const kn = WF.SCALE.kn0 + i * WF.SCALE.dkn; if (kn > 25.001) break; c.push(+scaleAt(kn).toPrecision(6)); }
  return c;
}

module.exports = { holtrop, Rmodel, scaleAt, table };       // for tools/wake_tests.js
if (require.main !== module) return;

if (process.argv.includes('--bake')) {
  const file = path.join(__dirname, '..', 'site', 'parts', '24_wake_field.js'), src = fs.readFileSync(file, 'utf8').split('\n');
  const at = src.findIndex(l => l.includes('@@SCALE@@') && l.includes('const SCALE'));
  if (at < 0) { console.log('FAIL: no @@SCALE@@ line in ' + file); process.exit(1); }
  const c = table();
  src[at] = `  const SCALE = { kn0: ${WF.SCALE.kn0}, dkn: ${WF.SCALE.dkn}, c: [${c.join(', ')}] };   // @@SCALE@@ (tools/wake_spectrum.js --bake writes this line)`;
  fs.writeFileSync(file, src.join('\n'));
  console.log(`baked ${c.length} values, ${WF.SCALE.kn0} to ${WF.SCALE.kn0 + (c.length - 1) * WF.SCALE.dkn} kn, into site/parts/24_wake_field.js: at 22.5 kn ${f(scaleAt(22.5), 6)}`);
  console.log('now: node tools/build_site.js, then node tools/wake_tests.js');
  process.exit(0);
}

// ---------------------------------------------------------------- the table
const kS = 2 * Math.PI / WF.CFG.split, kTop = 0.85 * Math.PI / WF.CFG.dxNear;
log('wake_spectrum: her waves from her own hull (C.halfBreadth at her mean draught of the night, ' + f(S0.d, 2) + ' m, level)');
{
  let vol = 0, xa = 1e9, xf = -1e9;
  for (let i = 0; i < hull.nx; i++) { const x = hull.x0 + i * hull.dx; if (hull.Yw[i] > 1e-6) { if (x < xa) xa = x; if (x > xf) xf = x; } let sec = 0; for (let j = 0; j < hull.nz; j++) sec += 2 * hull.Y[i * hull.nz + j] * hull.dz * (j === 0 || j === hull.nz - 1 ? 0.5 : 1); vol += sec * hull.dx; }
  const ang = (d) => Math.atan(WF.waterline(hull, hull.xStem - d) / d) * 180 / Math.PI;
  log(`her hull on the grid (${hull.dx} m by ${f(hull.dz, 3)} m): waterline ${f(xf - xa, 1)} m, displaced ${f(vol * RHO / 1000)} t (the model's mass ${f(S0.m / 1000)} t); her waterline enters at ${f(ang(10), 1)} deg over 10 m (Holtrop's regression for her coefficients: ${f(holtrop(10).iE, 1)} deg)`);
}
log(`the page's two windows hold waves longer than ${f(2 * Math.PI / kTop, 2)} m: the wide one those longer than ${WF.CFG.split} m, the fine one the rest`);
log('');
log('  kn    Fn     Rw Michell   in the page\'s   Rw Holtrop   Michell /   scale     the model\'s    Holtrop\'s    power into   wave astern   its height astern,');
log('                all waves    windows         (waves)      Holtrop     (table)   whole resist.  share        waves        |A|, scaled   scaled, 300 m back');
log('                kN           % of all        kN                                 kN             %            MW           m             m crest to trough');
let worst = 0;
for (const kn of [6, 8, 10, 12, 14, 16, 18, 19, 20, 21, 22, 22.5, 23, 24, 25]) {
  const U = kn * KN, all = WF.michell(hull, U, { L: S0.L }), band = WF.michell(hull, U, { L: S0.L, kHi: kTop, soft: true }), h = holtrop(U), Rm = Rmodel(U);
  const c = all.Rw > 0 ? Math.sqrt(h.RW / all.Rw) : 0, baked = WF.scale(U); if (c > 0 && kn > WF.SCALE.kn0) worst = Math.max(worst, Math.abs(baked / c - 1));
  log('  ' + f(kn, 1).padStart(4) + '  ' + f(h.Fn, 3) + '  ' + f(all.Rw / 1000, 1).padStart(9) + '    ' + f(100 * band.Rw / all.Rw, 1).padStart(6) + '        ' + f(h.RW / 1000, 2).padStart(9) + '    ' + f(all.Rw / h.RW, 2).padStart(7) + '    ' + f(c, 4) + ' (' + f(baked, 4) + ')  ' + f(Rm / 1000).padStart(6) + '        ' + f(100 * h.RW / Rm, 1).padStart(5) + '        ' + f(h.RW * U / 1e6, 3).padStart(7) + '      ' + f(c * all.A0, 3).padStart(6) + '        ' + f(2 * c * all.A0 * Math.sqrt(2 * Math.PI / (all.k0 * 300)), 2));
}
log('');
log('scale: sqrt(Rw Holtrop / Rw Michell, all waves); in brackets the table baked into site/parts/24_wake_field.js, which');
log('the page uses: ' + (WF.SCALE.c.length < 2 ? 'NOT BAKED (run: node tools/wake_spectrum.js --bake)' : 'it is within ' + (100 * worst).toExponential(1) + ' % of these sources at every speed above'));
log('height astern: the stationary-phase law for the transverse wave on her track, 2 |A| sqrt(2 pi / (k0 x)), far astern');
fs.writeFileSync(outFile('wake_spectrum.txt'), out.join('\n') + '\n');
const ok = WF.SCALE.c.length > 1 && worst < 2e-3;
console.log(ok ? 'PASS: the baked scale is the one these sources give' : 'FAIL: the baked scale is not the one these sources give: node tools/wake_spectrum.js --bake');
process.exit(ok ? 0 : 1);
