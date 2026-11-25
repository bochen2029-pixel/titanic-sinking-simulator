// wigley_compare.js: the wave field's method on Wigley's parabolic hull, against its measured wave profiles along the
// hull with the model fixed, at four Froude numbers (K6).
//   node tools/wigley_compare.js [--cw] [--local] [--stated]
// The second bulb-less benchmark, after the Series 60 (tools/s60_compare.js). Wigley's hull is a formula, so it is
// smooth, and it is the same fore and aft: what differs between its bow and its stern is the water's doing.
// - The source: Kajitani, H., Miyata, H., Ikehata, M., Tanaka, H., Adachi, H., Namimatsu, M. and Ogiwara, S. (1983),
//   "The summary of the cooperative experiment on Wigley parabolic model in Japan", for the 17th ITTC's Resistance
//   Committee, Varna (DTIC ADP003037).
//   - The hull (its section 1): y = (B/2) (1 - (2x/L)^2) (1 - (z/D)^2), L/B 10, L/D 16; the wetted surface at rest
//     S = 0.661 L (2D + B).
//   - Table 1: the wave elevation on the hull, here the SRI model's (4.0 m) with the model fixed, at 21 places from
//     the bow (2x/L = -1) to the stern (1); its unit is below.
//   - Figure 2, the SRI model fixed: the wave pattern resistance (Cwp, Newman-Sharma) and the towing test's wave
//     resistance (Cw, form factor 0.095), read from the figure for this comparison. The circles' centres were found
//     on the page's pixels, the axes on its gridlines (284.5 px to 10^-3); a reading is good to about 0.01 x 10^-3.
// The method is the library's own, unchanged, as for the KCS and the Series 60:
// - Michell's footprints from the formula (hullGrid, michell), and the gain sqrt(measured wave resistance / Michell's),
//   through createWake's o.scale: the wave pattern's, or with --cw the towing test's;
// - the field run steady, and the sea against the plating read as the page reads it (alongside), linear and with the
//   bow's pile-up. A place reads the cell at or just abaft it (0.05 m cells), as the page draws the water abaft her stem.
// As with the Series 60, the hull is run at her length (its length made her waterline's, Froude-scaled), because the
// pile-up's lengths and the field's grids are hers.
// The unit of Table 1. The paper defines it as g zeta / U^2 (its section 4, the table's head). It is read here as
// 2 g zeta / U^2, that is zeta / (U^2 / 2g), the Series 60's unit:
// - the 17th ITTC's Resistance Committee (Report, Gothenburg 1984, Fig. 8) plots these same numbers on one axis with
//   the Series 60's fixed-model profiles, which are in zeta / (U^2 / 2g) (Kim and Jenkins 1981);
// - arXiv 2610.14027 (Fig. 2) converts them to zeta / L as 2 g zeta / U^2: its measured crest at Fn 0.25 is 0.0138 L;
// - so read, the crests agree with Noblesse and others' bow-wave relation (2008, eq. 4.1) within 2 to 17 %; as
//   printed they would stand at 0.68 to 0.88 of the Bernoulli limit, far outside the regime that relation puts them in.
// --stated reads the table as printed. --local sets the tank's profile less the field beside the hull's local flow
// (tools/local_flow.js). The note: RESULT_k6_wigley_benchmark_v1_1_2026-11-20.md.
'use strict';
const WF = require('../site/parts/24_wake_field.js');
const G = 9.81, RHO = 1025;
const X2 = [-1, -0.95, -0.9, -0.85, -0.8, -0.7, -0.6, -0.5, -0.4, -0.2, 0, 0.2, 0.4, 0.5, 0.6, 0.7, 0.8, 0.85, 0.9, 0.95, 1];   // 2x/L, bow (-1) to stern (1)
const FN = [0.250, 0.267, 0.289, 0.316];
const PRO = [   // Table 1, g zeta / U^2, SRI's 4.0 m model fixed: a row a place, a column a Froude number
  [0.192, 0.175, 0.186, 0.155], [0.440, 0.392, 0.408, 0.340], [0.368, 0.329, 0.324, 0.330], [0.248, 0.252, 0.258, 0.275], [0.104, 0.133, 0.192, 0.205],
  [-0.136, -0.070, -0.006, 0.045], [-0.160, -0.168, -0.132, -0.075], [-0.120, -0.175, -0.168, -0.140], [-0.032, -0.112, -0.144, -0.155], [-0.016, 0.000, -0.048, -0.100],
  [-0.056, -0.007, -0.012, -0.030], [-0.080, -0.070, -0.024, -0.005], [-0.088, -0.070, -0.072, -0.015], [-0.072, -0.063, -0.084, -0.035], [-0.048, -0.049, -0.084, -0.045],
  [0.008, 0.014, -0.054, -0.060], [0.016, 0.007, -0.042, -0.060], [0.016, 0.007, -0.024, -0.050], [0.024, 0.007, 0.006, -0.045], [0.080, 0.042, 0.084, -0.030],
  [0.224, 0.154, 0.162, -0.075]];
const CWP = [0.650e-3, 0.576e-3, 0.910e-3, 1.427e-3];   // Figure 2, the wave pattern's (SRI, fixed)
const CWT = [0.594e-3, 0.596e-3, 0.891e-3, 1.355e-3];   // Figure 2, the towing test's (SRI, fixed; at 0.250 the mean of two runs, 0.631 and 0.557)
const useCw = process.argv.includes('--cw'), CW = useCw ? CWT : CWP, HALF = process.argv.includes('--stated') ? 1 : 0.5;   // 0.5: Table 1 as 2 g zeta / U^2
const f = (v, d) => (isFinite(v) ? v.toFixed(d) : 'n/a');
// her waterline's length at her mean draught (the library's own hull), as in tools/s60_compare.js
const C = require('../core/core.js'), her = WF.herHull(); let aft = her.x0; while (aft < her.xStem && !(C.halfBreadth(aft, her.T) > 1e-4)) aft += 0.01;
const L = her.xStem - aft, B = L / 10, D = L / 16, S = 0.661 * L * (2 * D + B);
const yOf = (x, zeta) => (Math.abs(x) <= L / 2 && zeta >= -D ? (B / 2) * (1 - (2 * x / L) ** 2) * (1 - (zeta / D) ** 2) : 0);
const hull = WF.hullGrid(yOf, -L / 2 - 0.5, L / 2 + 0.5, D, 0.5, 21); hull.xStem = L / 2;
const BOWFIT = (r) => r.x2 <= -0.7 + 1e-9, CREST = (r) => r.x2 <= -0.8 + 1e-9, MID = (r) => r.x2 >= -0.6 - 1e-9 && r.x2 <= 0.7 + 1e-9, STERN = (r) => r.x2 >= 0.8 - 1e-9;
const OLD = 3.5;   // the fixed factor of K6's first notes, before the law: set beside the law for comparison
const ANGLE = Math.atan(2 * B / L) * 180 / Math.PI;   // the waterline's half-angle at the stem, for the law
const run = (opt) => {
  opt = opt || {}; const log = opt.quiet ? () => {} : console.log, out = [];
  log(`Wigley's hull at her length (her waterline, ${f(L, 2)} m): beam ${f(B, 2)} m, draught ${f(D, 2)} m, wetted surface ${f(S, 0)} m2; the gain from ${useCw ? "the towing test's Cw" : "the wave pattern's Cwp"}${HALF !== 1 ? '; Table 1 read as 2 g zeta / U^2' : '; TABLE 1 READ AS PRINTED (g zeta / U^2)'}; the bow's crest by the law (Noblesse and others at its ${f(ANGLE, 2)} deg stem), the factor dying away over ${WF.CFG.bowReach} m; read ${WF.CFG.sideOff} m out`);
  for (let c = 0; c < FN.length; c++) {
    if (opt.only && !opt.only.includes(c)) continue;
    const Fn = FN[c], U = Fn * Math.sqrt(G * L), k0 = U * U / G, mi = WF.michell(hull, U), Rw = 0.5 * RHO * U * U * S * CW[c], gain = Math.sqrt(Rw / mi.Rw);
    const W = WF.createWake({ hull, scale: () => gain, bowAngle: ANGLE }); WF.work(W, 0); let t = 0, X = 0;
    while (t < 150 - 1e-9) { t += 0.25; X += U * 0.25; WF.push(W, { t, X, Y: 0, psi: 0, u: U, v: 0, r: 0, TP: 0, TS: 0, TC: 0, nP: 0, nS: 0, nC: 0, del: 0 }); WF.work(W, 0); }
    WF.refresh(W);
    const n = Math.round((hull.x1 - hull.x0) / 0.05), w = (hull.x1 - hull.x0) / n;
    const aLin = WF.alongside(W, n, null, { linear: true }), aPile = WF.alongside(W, n), Plaw = W.bowPileNow, Zlaw = WF.bowCrest(W, U);
    const rows = X2.map((x2, i) => { const x = -x2 * L / 2, j = Math.max(0, Math.min(n - 1, Math.floor((x - hull.x0) / w - 0.5 - 1e-9))); return { x2, meas: HALF * PRO[i][c] * k0, lin: aLin[2 * j], piled: aPile[2 * j], d: hull.xStem - (hull.x0 + (j + 0.5) * w) }; });
    const mean = (a) => a.reduce((p, v) => p + v, 0) / a.length, rmsOf = (a) => Math.sqrt(mean(a.map(v => v * v)));
    const cor = (rs, key) => { const ma = mean(rs.map(r => r.meas)), mb = mean(rs.map(r => r[key])); let ab = 0, aa = 0, bb = 0; for (const r of rs) { ab += (r.meas - ma) * (r[key] - mb); aa += (r.meas - ma) ** 2; bb += (r[key] - mb) ** 2; } return ab / Math.sqrt(aa * bb); };
    const ratio = (rs) => rmsOf(rs.map(r => r.lin)) / rmsOf(rs.map(r => r.meas));
    const fit = rows.filter(BOWFIT), bow = rows.filter(CREST), mid = rows.filter(MID), stern = rows.filter(STERN);
    const pileFor = (R) => { let ra = 0, aa = 0; for (const r of fit) if (r.lin > 0) { const a = r.lin * Math.exp(-r.d / R); ra += (r.meas - r.lin) * a; aa += a * a; } return aa > 0 ? 1 + ra / aa : NaN; };
    const errFor = (P, R) => rmsOf(fit.map(r => r.meas - r.lin * (r.lin > 0 ? 1 + (P - 1) * Math.exp(-r.d / R) : 1)));
    let best = { R: NaN, P: NaN, e: Infinity }; for (let R = 2; R <= 120; R += 0.5) { const P = pileFor(R), e = errFor(P, R); if (e < best.e) best = { R, P, e }; }
    const R0 = WF.CFG.bowReach, crestM = Math.max(...bow.map(r => r.meas)), crestL = Math.max(...bow.map(r => r.piled));
    const o = { Fn, U, k0, gain, rows, crest: [crestM, Math.max(...bow.map(r => r.lin)), crestL], Plaw, Zlaw };
    out.push(o);
    log(`Fn ${Fn}: U ${f(U, 2)} m/s, U^2/g ${f(k0, 2)} m; Michell ${f(mi.Rw / 1000, 0)} kN (Cw ${f(mi.Rw / (0.5 * RHO * U * U * S) * 1000, 3)}e-3), measured ${f(Rw / 1000, 0)} kN (${f(CW[c] * 1000, 3)}e-3; Michell's ${f(mi.Rw / Rw, 2)} times), gain ${f(gain, 3)}`);
    log(`  the whole profile: linear corr ${f(cor(rows, 'lin'), 2)}, by the law corr ${f(cor(rows, 'piled'), 2)}; the field's height over the tank's: midbody (2x/L -0.6 to 0.7) ${f(ratio(mid), 2)} (corr ${f(cor(mid, 'lin'), 2)}), stern (0.8 to 1) ${f(ratio(stern), 2)}; Michell's own: midbody ${f(ratio(mid) / gain, 2)}, stern ${f(ratio(stern) / gain, 2)}`);
    // the relation by hand, as the law takes it: Noblesse, Delhommeau, Guilbaud, Hendrix and Yang (2008), "Simple analytical
    // relations for ship bow waves", J. Fluid Mech. 600, 105-132, eq. (4.1), Z_b = (U^2/g)(2.2/(1 + F_D)) tan a / cos a, and its
    // eq. (7.1), the crest T_b = (U^2/g) 1.1 cos^7 a / (1 + F_D) abaft the stem; F_D = U / sqrt(g D), a the waterline's
    // half-angle at the stem, atan(2B/L) for this hull
    const aE = Math.atan(2 * B / L), FD = U / Math.sqrt(G * D), zb = k0 * 2.2 / (1 + FD) * Math.tan(aE) / Math.cos(aE), tb = k0 * 1.1 * Math.cos(aE) ** 7 / (1 + FD);
    const at = (key) => fit.reduce((b, r) => (r[key] > b[key] ? r : b), fit[0]).d;   // the highest place over the bow (2x/L -1 to -0.7)
    log(`  Noblesse's relation (half-angle ${f(aE * 180 / Math.PI, 2)} deg, F_D ${f(FD, 3)}): the crest ${f(zb, 2)} m against the measured ${f(crestM, 2)} m (${f(zb / crestM, 2)}), ${f(crestM / (k0 / 2), 2)} of U^2/2g; it stands ${f(tb, 1)} m abaft the stem (the tank's highest place ${f(at('meas'), 1)} m, the field's ${f(at('lin'), 1)} m)`);
    log(`  the bow's crest (2x/L -1 to -0.8): measured ${f(crestM, 2)} m, linear ${f(o.crest[1], 2)} m, by the law ${f(crestL, 2)} m (${f(crestL / crestM, 2)} of the measured; its crest ${f(Zlaw, 2)} m, its factor ${f(Plaw, 2)}); over -1 to -0.7: the law ${f(rmsOf(fit.map(r => r.meas - r.piled)), 3)} m rms, the fixed factor ${OLD} ${f(errFor(OLD, R0), 3)}, none ${f(errFor(1, R0), 3)}; the factor that fits at ${R0} m: ${f(pileFor(R0), 2)} (${f(errFor(pileFor(R0), R0), 3)} m); with the reach free: ${f(best.P, 2)} over ${f(best.R, 1)} m (${f(best.e, 3)})`);
  }
  return out;
};
// for tools/wake_tests.js: the law on this hull at her length at Fn 0.25, quietly: the measured crest over 2x/L -1 to
// -0.8 (Table 1 read as 2 g zeta / U^2, with the wave pattern's gain) and the law's drawn crest there
const bowCheck = () => { const o = run({ quiet: true, only: [0] })[0]; return { hull: "Wigley's hull", Fn: o.Fn, measured: o.crest[0], law: o.crest[2], linear: o.crest[1], Z: o.Zlaw }; };
module.exports = { bowCheck };
if (require.main === module) {
const out = run();
// all four together, in the table's own units (g zeta / U^2), so that each Froude number counts alike
const R0 = WF.CFG.bowReach;
const pooled = (R) => { let ra = 0, aa = 0; for (const o of out) for (const r of o.rows) if (BOWFIT(r) && r.lin > 0) { const a = r.lin * Math.exp(-r.d / R) / o.k0; ra += (r.meas - r.lin) / o.k0 * a; aa += a * a; } return 1 + ra / aa; };
const pooledErr = (P, R) => { let e = 0, n = 0; for (const o of out) for (const r of o.rows) if (BOWFIT(r)) { e += ((r.meas - r.lin * (r.lin > 0 ? 1 + (P - 1) * Math.exp(-r.d / R) : 1)) / o.k0) ** 2; n++; } return Math.sqrt(e / n); };
let fb = { R: NaN, P: NaN, e: Infinity }; for (let R = 2; R <= 120; R += 0.5) { const P = pooled(R), e = pooledErr(P, R); if (e < fb.e) fb = { R, P, e }; }
const lawErr = (() => { let e = 0, n = 0; for (const o of out) for (const r of o.rows) if (BOWFIT(r)) { e += ((r.meas - r.piled) / o.k0) ** 2; n++; } return Math.sqrt(e / n); })();
console.log(`all four together (rms in g zeta / U^2 over 2x/L -1 to -0.7): the law ${f(lawErr, 3)}; none ${f(pooledErr(1, R0), 3)}; the fixed factor ${OLD} over ${R0} m ${f(pooledErr(OLD, R0), 3)}; the factor that fits at ${R0} m ${f(pooled(R0), 2)} (${f(pooledErr(pooled(R0), R0), 3)}); with the reach free ${f(fb.P, 2)} over ${f(fb.R, 1)} m (${f(fb.e, 3)})`);
console.log(`  the law's drawn crest over the measured, Fn by Fn: ${out.map(o => `${o.Fn}: ${f(o.crest[2] / o.crest[0], 2)}`).join(', ')}`);
console.log('the profile (m) at Fn 0.25 and 0.289: 2x/L: measured / linear / by the law');
for (const o of [out[0], out[2]]) console.log(`  Fn ${o.Fn}: ` + o.rows.map(r => `${r.x2}: ${f(r.meas, 2)}/${f(r.lin, 2)}/${f(r.piled, 2)}`).join('  '));
if (process.argv.includes('--local')) {
  // the hull's local flow (tools/local_flow.js) against what the tank shows beyond the field, in g zeta / U^2 (half of
  // zeta / (U^2/2g)), beside the mean over the four Froude numbers of (measured - field). The ends are read 0.05 m inside
  const { localFlow } = require('./local_flow.js'), avg = (a) => a.reduce((p, v) => p + v, 0) / a.length;
  const lf = X2.map(x2 => { const x = -x2 * L / 2 + (x2 === -1 ? -0.05 : x2 === 1 ? 0.05 : 0); return [localFlow(hull, x, 0) / 2, localFlow(hull, x, yOf(x, 0)) / 2]; });
  const res = X2.map((x2, i) => avg(out.map(o => (o.rows[i].meas - o.rows[i].lin) / o.k0)));
  console.log('the local flow, g zeta / U^2, 2x/L: (measured - field), the mean of four Fn / the local flow on the centre plane / on the hull');
  console.log('  ' + X2.map((x2, i) => `${x2}: ${f(res[i], 3)}/${f(lf[i][0], 3)}/${f(lf[i][1], 3)}`).join('  '));
  for (const [name, sel] of [['the bow (-1 to -0.7)', BOWFIT], ['the midbody (-0.6 to 0.7)', MID], ['the stern (0.8 to 1)', STERN]]) {
    const idx = X2.map((x2, i) => (sel({ x2 }) ? i : -1)).filter(i => i >= 0), rms = (g) => Math.sqrt(avg(idx.map(g)));
    console.log(`  ${name}: rms of (measured - field) ${f(rms(i => res[i] ** 2), 3)}; less the local flow on the centre plane ${f(rms(i => (res[i] - lf[i][0]) ** 2), 3)}, on the hull ${f(rms(i => (res[i] - lf[i][1]) ** 2), 3)}`);
  }
}
}
