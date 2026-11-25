// s60_compare.js: the wave field's method on the Series 60 with block coefficient 0.60, a hull with a plumb stem and no
// bulb, against its measured wave profiles along the hull at six Froude numbers (K6).
//   node tools/s60_compare.js [--own] [--local]
// The KCS (tools/kcs_compare.js) has a bulbous bow, so it cannot test her bow wave. The Series 60 can: a plumb stem, no
// bulb, and Froude numbers either side of hers (0.23 at 22.5 kn). Her bow wave is now a law (the library's
// CFG.bowAngle: Noblesse and others 2008), which this tool runs at this hull's own 7.0 degree stem; the fixed factor
// 3.5 of K6's first notes is set beside it.
// - The source: Kim, Y.H. and Jenkins, D. (1981), "Trim and sinkage effects on wave resistance with Series 60,
//   CB = 0.60", DTNSRDC/SPD-1013-01, David W. Taylor Naval Ship Research and Development Center, September 1981 (DTIC
//   ADA105972, approved for public release). A 6.1 m model in the deep-water basin, here held at zero trim and sinkage.
//   - Table 1, the particulars, and Table 2, the offsets: both from Todd (1953). The offsets are each waterline's
//     half-breadth over its largest, and that largest over the load waterline's.
//   - Table 3: the wave profile along the hull with the model fixed, as zeta / (U^2 / 2g) (the report's equation 1), from
//     the stem (station 0) to the stern (20). One value is unreadable in the scan (station 17 at Fn 0.32) and is left out.
//   - Table 6: the wave resistance with the model fixed, from longitudinal wave cuts (Cw). Fn is on the waterline's
//     length, U / sqrt(g LWL).
// The method is the library's own, unchanged, as for the KCS:
// - Michell's footprints from the offsets (hullGrid, michell). The waterline runs 2.04 m past the A.P., where Table 2
//   stops; it is closed straight over that length [bet: about 0.4 % of the midship section is in it];
// - the gain sqrt(the measured wave resistance / Michell's), through createWake's o.scale;
// - the field run steady at the hull's speed, and the sea against the plating read as the page reads it (alongside),
//   linear and with the bow's pile-up. A station reads the cell at or just abaft it (0.05 m cells), so the stem reads as
//   the page draws the water just abaft her stem: the pile-up acts only abaft the stem.
// The pile-up's lengths (CFG.bowReach, CFG.sideOff) and the field's grids are hers. So the hull is run at her length,
// Froude-scaled: its waterline made as long as hers (the library's own hull at her mean draught), every length with it,
// at the same Froude numbers. --own runs it at its own 123.96 m as well.
// What it fits: the pile-up that brings the field's bow crest to the measured one (stations 0 to 3), with the reach held
// at hers, and with both free. It also sets the measured crest beside the bow-wave relation the bet was set by (Noblesse
// and others 2008, eq. 4.1, and the crest's place, eq. 7.1), and with --local the tank's profile less the field beside the hull's local flow (tools/local_flow.js).
'use strict';
const WF = require('../site/parts/24_wake_field.js');
const LPP = 121.92, LWL = 123.96, B = 16.25, H = B / 2.5, S = 2534.4, DISP = 7932.28, CW_WP = 0.706, G = 9.81, RHO = 1025;   // Table 1 (DISP in t)
const WL = [0, 0.075, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5];             // waterlines over the draught ("Tan." at the baseline)
const MAXH = [0.710, 0.866, 0.985, 1.0, 1.0, 1.0, 1.0, 1.0];         // each waterline's largest half-breadth, of the load waterline's
const STA = [0, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 18.5, 19, 19.5, 20];
const OFF = [   // Table 2: half-breadths as fractions of each waterline's largest, station by station from the F.P.
  [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.020, 0.042], [0.009, 0.032, 0.042, 0.041, 0.043, 0.051, 0.076, 0.120], [0.013, 0.064, 0.082, 0.087, 0.090, 0.102, 0.133, 0.198],
  [0.019, 0.095, 0.126, 0.141, 0.148, 0.160, 0.195, 0.278], [0.024, 0.127, 0.178, 0.204, 0.213, 0.228, 0.270, 0.360], [0.055, 0.196, 0.294, 0.346, 0.368, 0.391, 0.440, 0.531],
  [0.134, 0.314, 0.436, 0.502, 0.535, 0.562, 0.607, 0.683], [0.275, 0.466, 0.589, 0.660, 0.691, 0.718, 0.754, 0.804], [0.469, 0.630, 0.733, 0.802, 0.824, 0.841, 0.862, 0.889],
  [0.666, 0.779, 0.854, 0.906, 0.917, 0.926, 0.936, 0.946], [0.831, 0.898, 0.935, 0.971, 0.977, 0.979, 0.981, 0.982], [0.945, 0.964, 0.979, 0.996, 1.000, 1.000, 1.000, 1.000],
  [1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000], [0.965, 0.982, 0.990, 1.000, 1.000, 1.000, 1.000, 1.000], [0.882, 0.922, 0.958, 0.994, 1.000, 1.000, 1.000, 1.000],
  [0.767, 0.826, 0.892, 0.962, 0.987, 0.994, 0.997, 1.000], [0.622, 0.701, 0.781, 0.884, 0.943, 0.975, 0.990, 0.999], [0.463, 0.560, 0.639, 0.754, 0.857, 0.937, 0.977, 0.994],
  [0.309, 0.413, 0.483, 0.592, 0.728, 0.857, 0.933, 0.975], [0.168, 0.267, 0.330, 0.413, 0.541, 0.725, 0.844, 0.924], [0.065, 0.152, 0.193, 0.236, 0.321, 0.536, 0.709, 0.834],
  [0.032, 0.102, 0.130, 0.156, 0.216, 0.425, 0.626, 0.769], [0.014, 0.058, 0.076, 0.085, 0.116, 0.308, 0.530, 0.686], [0.010, 0.020, 0.020, 0.022, 0.033, 0.193, 0.418, 0.579],
  [0.000, 0.000, 0.000, 0.000, 0.000, 0.082, 0.270, 0.420]];
const FN = [0.22, 0.25, 0.28, 0.30, 0.32, 0.35], CW = [0.176e-3, 0.230e-3, 1.011e-3, 1.375e-3, 1.316e-3, 1.780e-3];   // Table 6, model fixed
const PST = [0, 0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 18.5, 19, 19.5, 20];   // Table 3's stations
const PRO = [   // Table 3: zeta / (U^2 / 2g), model fixed, a row a station, a column a Froude number
  [0.275, 0.262, 0.209, 0.194, 0.210, 0.167], [0.275, 0.295, 0.248, 0.239, 0.230, 0.176], [0.254, 0.311, 0.261, 0.262, 0.250, 0.226], [0.106, 0.311, 0.248, 0.250, 0.260, 0.259],
  [0.000, 0.197, 0.157, 0.182, 0.210, 0.234], [-0.042, 0.016, 0.026, 0.068, 0.120, 0.151], [-0.064, -0.066, -0.094, -0.034, -0.010, 0.050], [-0.064, -0.131, -0.144, -0.159, -0.100, -0.067],
  [-0.106, -0.143, -0.183, -0.205, -0.170, -0.167], [-0.148, -0.131, -0.209, -0.228, -0.260, -0.226], [-0.169, -0.115, -0.144, -0.205, -0.260, -0.268], [-0.085, -0.066, -0.105, -0.159, -0.210, -0.234],
  [-0.042, -0.016, -0.026, -0.080, -0.120, -0.192], [-0.042, -0.066, 0.065, 0.000, -0.070, -0.134], [-0.127, -0.131, -0.013, 0.000, -0.030, -0.092], [-0.191, -0.196, -0.105, -0.057, -0.050, -0.084],
  [-0.169, -0.196, -0.170, -0.114, -0.080, -0.067], [-0.085, -0.066, -0.131, -0.125, -0.060, -0.050], [-0.021, 0.000, -0.091, -0.091, NaN, -0.017], [0.021, 0.006, 0.000, -0.011, 0.000, 0.033],
  [0.042, 0.082, 0.065, 0.023, 0.030, 0.067], [0.085, 0.115, 0.105, 0.068, 0.060, 0.100], [0.148, 0.148, 0.170, 0.114, 0.110, 0.134], [0.169, 0.180, 0.209, 0.171, 0.160, 0.167]];
const BOW = 5, CREST = 4;   // Table 3's first five stations (0 to 3) are the bow's crest for the fits; the first four (0 to 2) give its height
const lerp = (a, b, t) => a + (b - a) * t;
const OVER = (LWL - LPP) / (LPP / 20);   // stations of waterline past the A.P.
const yOwn = (x, zeta) => {               // the half-breadth at its own size: x forward of amidships, zeta up from the waterline
  let s = (LPP / 2 - x) / (LPP / 20), fade = 1;
  if (s > 20) { if (s > 20 + OVER) return 0; fade = 1 - (s - 20) / OVER; s = 20; }
  if (!(s >= 0)) return 0;
  let i = 0; while (i < STA.length - 2 && STA[i + 1] < s) i++; const ts = (s - STA[i]) / (STA[i + 1] - STA[i]);
  const w = (zeta + H) / H; if (!(w >= 0)) return 0; let j = 0; while (j < WL.length - 2 && WL[j + 1] < w) j++; const tw = Math.min(1, (w - WL[j]) / (WL[j + 1] - WL[j]));
  const at = (ii, jj) => OFF[ii][jj] * MAXH[jj] * B / 2;
  return fade * Math.max(0, lerp(lerp(at(i, j), at(i + 1, j), ts), lerp(at(i, j + 1), at(i + 1, j + 1), ts), tw));
};
const hullAt = (k) => {                   // the hull made k times its own size
  const h = WF.hullGrid((x, zeta) => k * yOwn(x / k, zeta / k), -k * (LPP / 2 + OVER * LPP / 20) - 0.5, k * LPP / 2 + 0.5, k * H, 0.5, 21);
  h.xStem = k * LPP / 2; return h;
};
const f = (v, d) => (isFinite(v) ? v.toFixed(d) : 'n/a');
// her waterline's length at her mean draught (the library's own hull): its stem less the waterline's aft end, found on
// the core's own half-breadth in 1 cm steps
const C = require('../core/core.js'), her = WF.herHull(); let aft = her.x0; while (aft < her.xStem && !(C.halfBreadth(aft, her.T) > 1e-4)) aft += 0.01;
const HER_LWL = her.xStem - aft, K_HER = HER_LWL / LWL;
// the hull against Table 1, at its own size
if (require.main === module) {
  const h = hullAt(1); let vol = 0, wp = 0;
  for (let i = 0; i < h.nx; i++) { for (let j = 0; j < h.nz; j++) vol += 2 * h.Y[i * h.nz + j] * (j === 0 || j === h.nz - 1 ? 0.5 : 1) * h.dz * h.dx; wp += 2 * h.Yw[i] * h.dx; }
  console.log(`Series 60, CB 0.60 (Kim and Jenkins 1981, Tables 1-3 and 6): Lpp ${LPP} m, LWL ${LWL} m, B ${B} m, draught ${f(H, 2)} m. Built from Table 2: volume ${f(vol, 0)} m3 (Table 1: ${f(DISP / 1.025, 0)} m3 of sea water), waterplane ${f(wp, 1)} m2 (Table 1: ${f(CW_WP * LPP * B, 1)} m2)`);
  console.log(`her waterline at her mean draught: ${f(HER_LWL, 2)} m (the library's hull), so at her length the Series 60 is made ${f(K_HER, 4)} times its own size`);
}
const OLD = 3.5;   // the fixed factor of K6's first notes, before the law: set beside the law for comparison
const runAt = (k, label, opt) => {
  opt = opt || {}; const log = opt.quiet ? () => {} : console.log;
  const hull = hullAt(k), lwl = k * LWL, out = [];
  log(`\n${label}: Lpp ${f(k * LPP, 2)} m, LWL ${f(lwl, 2)} m, draught ${f(k * H, 2)} m; the bow's crest by the law (Noblesse and others at its 7.0 deg stem), the factor dying away over ${WF.CFG.bowReach} m; read ${WF.CFG.sideOff} m out`);
  for (let c = 0; c < FN.length; c++) {
    if (opt.only && !opt.only.includes(c)) continue;
    const Fn = FN[c], U = Fn * Math.sqrt(G * lwl), q = U * U / (2 * G), mi = WF.michell(hull, U), Rw = 0.5 * RHO * U * U * k * k * S * CW[c], gain = Math.sqrt(Rw / mi.Rw);
    const W = WF.createWake({ hull, scale: () => gain, bowAngle: 7.0 }); WF.work(W, 0); let t = 0, X = 0;
    while (t < 150 - 1e-9) { t += 0.25; X += U * 0.25; WF.push(W, { t, X, Y: 0, psi: 0, u: U, v: 0, r: 0, TP: 0, TS: 0, TC: 0, nP: 0, nS: 0, nC: 0, del: 0 }); WF.work(W, 0); }
    WF.refresh(W);
    const n = Math.round((hull.x1 - hull.x0) / 0.05), w = (hull.x1 - hull.x0) / n;
    const aLin = WF.alongside(W, n, null, { linear: true }), aPile = WF.alongside(W, n), Plaw = W.bowPileNow, Zlaw = WF.bowCrest(W, U);
    const rows = [];
    PST.forEach((s, i) => {
      const meas = PRO[i][c] * q; if (!isFinite(meas)) return;
      const x = k * (LPP / 2 - s * LPP / 20), j = Math.max(0, Math.min(n - 1, Math.floor((x - hull.x0) / w - 0.5 - 1e-9)));
      rows.push({ s, i, meas, lin: aLin[2 * j], piled: aPile[2 * j], d: hull.xStem - (hull.x0 + (j + 0.5) * w) });
    });
    const mean = (a) => a.reduce((p, v) => p + v, 0) / a.length, rmsOf = (a) => Math.sqrt(mean(a.map(v => v * v)));
    const cor = (rs, key) => { const ma = mean(rs.map(r => r.meas)), mb = mean(rs.map(r => r[key])); let ab = 0, aa = 0, bb = 0; for (const r of rs) { ab += (r.meas - ma) * (r[key] - mb); aa += (r.meas - ma) ** 2; bb += (r[key] - mb) ** 2; } return ab / Math.sqrt(aa * bb); };
    const diff = (rs, key) => rmsOf(rs.map(r => r[key] - r.meas)), ratio = (rs) => rmsOf(rs.map(r => r.lin)) / rmsOf(rs.map(r => r.meas));
    const bow = rows.filter(r => r.i < CREST), fit = rows.filter(r => r.i < BOW), away = rows.filter(r => r.i >= BOW);
    const mid = rows.filter(r => r.s >= 4 && r.s <= 17), stern = rows.filter(r => r.s >= 18);   // the midbody's troughs; the stern's rise
    // the pile-up that brings a field m times the page's to the measured bow (stations 0 to 3): 1 + (P - 1) exp(-d / R)
    // on the crests. m = 1 is the page's field; m = 1 / gain is Michell's own height, unscaled
    const pileFor = (m, R) => { let ra = 0, aa = 0; for (const r of fit) if (r.lin > 0) { const a = m * r.lin * Math.exp(-r.d / R); ra += (r.meas - m * r.lin) * a; aa += a * a; } return aa > 0 ? 1 + ra / aa : NaN; };
    const errFor = (m, P, R) => rmsOf(fit.map(r => r.meas - m * r.lin * (r.lin > 0 ? 1 + (P - 1) * Math.exp(-r.d / R) : 1)));
    const free = (m) => { let b = { R: NaN, P: NaN, e: Infinity }; for (let R = 2; R <= 120; R += 0.5) { const P = pileFor(m, R), e = errFor(m, P, R); if (e < b.e) b = { R, P, e }; } return b; };
    const R0 = WF.CFG.bowReach, best = free(1), own = free(1 / gain);
    const o = { Fn, U, q, mi: mi.Rw, Rw, gain, rows, corLin: cor(rows, 'lin'), corPile: cor(rows, 'piled'), dLin: diff(rows, 'lin'), dPile: diff(rows, 'piled'), ratio: ratio(rows),
      awayRatio: ratio(away), awayCor: cor(away, 'lin'), crest: [Math.max(...bow.map(r => r.meas)), Math.max(...bow.map(r => r.lin)), Math.max(...bow.map(r => r.piled))],
      P22: pileFor(1, R0), e22: errFor(1, pileFor(1, R0), R0), eOld: errFor(1, OLD, R0), eLin: errFor(1, 1, R0), best,
      eLaw: rmsOf(fit.map(r => r.meas - r.piled)), Plaw, Zlaw,
      P22own: pileFor(1 / gain, R0), e22own: errFor(1 / gain, pileFor(1 / gain, R0), R0), eOwn: errFor(1 / gain, 1, R0), own };
    out.push(o);
    log(`Fn ${Fn}: U ${f(U, 2)} m/s, U^2/2g ${f(q, 2)} m; Michell ${f(mi.Rw / 1000, 0)} kN, measured ${f(Rw / 1000, 0)} kN (Cw ${f(CW[c] * 1000, 3)}e-3, Michell's ${f(mi.Rw / Rw, 1)} times), gain ${f(gain, 3)}`);
    log(`  the whole profile: linear corr ${f(o.corLin, 2)}, rms difference ${f(o.dLin, 2)} m, the field's rms over the measured ${f(o.ratio, 2)} (Michell's own, unscaled: ${f(o.ratio / gain, 2)}); by the law corr ${f(o.corPile, 2)}, rms difference ${f(o.dPile, 2)} m`);
    log(`  abaft station 3: the field's rms over the measured ${f(o.awayRatio, 2)} (Michell's own: ${f(o.awayRatio / gain, 2)}; the geometric mean of the two, the field / sqrt(gain): ${f(o.awayRatio / Math.sqrt(gain), 2)}), corr ${f(o.awayCor, 2)}. The bow's crest (stations 0-2): measured ${f(o.crest[0], 2)} m, linear ${f(o.crest[1], 2)} m (x${f(o.crest[0] / o.crest[1], 2)}), by the law ${f(o.crest[2], 2)} m (${f(o.crest[2] / o.crest[0], 2)} of the measured; its crest ${f(Zlaw, 2)} m, its factor ${f(Plaw, 2)}), Michell's own ${f(o.crest[1] / gain, 2)} m`);
    // the bow-wave relation the bet was set by: Noblesse, Delhommeau, Guilbaud, Hendrix and Yang (2008), J. Fluid Mech.
    // 600, 105-132, eq. (4.1), Z_b = (U^2/g)(2.2/(1 + F_D)) tan a / cos a, and eq. (7.1), the crest T_b = (U^2/g) 1.1 cos^7 a /
    // (1 + F_D) abaft the stem; F_D = U / sqrt(g D), a the half-angle of entrance, Table 1's 7.0 degrees
    const aE = 7.0 * Math.PI / 180, Dk = k * H, FD = U / Math.sqrt(G * Dk), zb = (2 * q) * 2.2 / (1 + FD) * Math.tan(aE) / Math.cos(aE), tb = (2 * q) * 1.1 * Math.cos(aE) ** 7 / (1 + FD);
    const at = (key) => fit.reduce((b, r) => (r[key] > b[key] ? r : b), fit[0]).d;   // the highest place over the bow (stations 0 to 3)
    log(`  Noblesse's relation (half-angle 7.0 deg, F_D ${f(FD, 3)}): the crest ${f(zb, 2)} m against the measured ${f(o.crest[0], 2)} m (${f(zb / o.crest[0], 2)}), ${f(o.crest[0] / q, 2)} of U^2/2g; it stands ${f(tb, 1)} m abaft the stem (the tank's highest place ${f(at('meas'), 1)} m, the field's ${f(at('lin'), 1)} m)`);
    log(`  the midbody (stations 4-17): the field's rms over the measured ${f(ratio(mid), 2)} (Michell's own ${f(ratio(mid) / gain, 2)}); the stern (18-20): ${f(ratio(stern), 2)} (Michell's own ${f(ratio(stern) / gain, 2)})`);
    log(`  over stations 0-3: the law ${f(o.eLaw, 3)} m rms; the fixed factor ${OLD} ${f(o.eOld, 3)} m; none ${f(o.eLin, 3)} m. The factor that fits at a reach of ${R0} m: ${f(o.P22, 2)} (${f(o.e22, 3)} m); with the reach free: ${f(best.P, 2)} over ${f(best.R, 1)} m (${f(best.e, 3)} m)`);
    log(`  on Michell's own height: the pile at ${R0} m ${f(o.P22own, 2)} (rms ${f(o.e22own, 3)} m; none: ${f(o.eOwn, 3)} m); with the reach free: ${f(own.P, 2)} over ${f(own.R, 1)} m (rms ${f(own.e, 3)} m)`);
  }
  if (opt.quiet) return out;
  // the pile over all six together: one least-squares fit of every bow point (stations 0 to 3), in the table's own units
  // (zeta / (U^2 / 2g)), so that each Froude number counts alike; the reach held at hers, and free
  const pooled = (mOf, R) => { let ra = 0, aa = 0; for (const o of out) { const m = mOf(o); for (const r of o.rows) if (r.i < BOW && r.lin > 0) { const a = m * r.lin * Math.exp(-r.d / R) / o.q; ra += (r.meas - m * r.lin) / o.q * a; aa += a * a; } } return 1 + ra / aa; };
  const pooledErr = (mOf, P, R) => { let e = 0, n = 0; for (const o of out) { const m = mOf(o); for (const r of o.rows) if (r.i < BOW) { e += ((r.meas - m * r.lin * (r.lin > 0 ? 1 + (P - 1) * Math.exp(-r.d / R) : 1)) / o.q) ** 2; n++; } } return Math.sqrt(e / n); };
  const pooledFree = (mOf) => { let b = { R: NaN, P: NaN, e: Infinity }; for (let R = 2; R <= 120; R += 0.5) { const P = pooled(mOf, R), e = pooledErr(mOf, P, R); if (e < b.e) b = { R, P, e }; } return b; };
  const R0 = WF.CFG.bowReach, page = () => 1, mich = (o) => 1 / o.gain, geo = (o) => 1 / Math.sqrt(o.gain), fp = pooledFree(page), fm = pooledFree(mich), fg = pooledFree(geo);
  const lawErr = (() => { let e = 0, n = 0; for (const o of out) for (const r of o.rows) if (r.i < BOW) { e += ((r.meas - r.piled) / o.q) ** 2; n++; } return Math.sqrt(e / n); })();
  console.log(`all six Froude numbers together (rms in zeta / (U^2/2g) over stations 0-3): the law ${f(lawErr, 3)}; on the page's field, the fixed factor ${OLD} over ${R0} m ${f(pooledErr(page, OLD, R0), 3)}, none ${f(pooledErr(page, 1, R0), 3)}; the factor that fits at ${R0} m ${f(pooled(page, R0), 2)} (${f(pooledErr(page, pooled(page, R0), R0), 3)}); with the reach free ${f(fp.P, 2)} over ${f(fp.R, 1)} m (${f(fp.e, 3)})`);
  console.log(`  the law's drawn crest over the measured, Fn by Fn: ${out.map(o => `${o.Fn}: ${f(o.crest[2] / o.crest[0], 2)}`).join(', ')}`);
  console.log(`  on Michell's own height: none ${f(pooledErr(mich, 1, R0), 3)}; the pile at ${R0} m ${f(pooled(mich, R0), 2)} (${f(pooledErr(mich, pooled(mich, R0), R0), 3)}); with the reach free ${f(fm.P, 2)} over ${f(fm.R, 1)} m (${f(fm.e, 3)}). At Fn 0.22 and 0.25 (hers, 0.23, between), the pile at ${R0} m: ${f(out[0].P22, 2)} and ${f(out[1].P22, 2)} on the page's field, ${f(out[0].P22own, 2)} and ${f(out[1].P22own, 2)} on Michell's own`);
  console.log(`  on their geometric mean (the field / sqrt(gain)): none ${f(pooledErr(geo, 1, R0), 3)}; the pile at ${R0} m ${f(pooled(geo, R0), 2)} (${f(pooledErr(geo, pooled(geo, R0), R0), 3)}); with the reach free ${f(fg.P, 2)} over ${f(fg.R, 1)} m (${f(fg.e, 3)})`);
  console.log('the profile (m) at Fn 0.22 and 0.25: station: measured / linear / by the law');
  for (const o of out.slice(0, 2)) console.log(`  Fn ${o.Fn}: ` + o.rows.map(r => `${r.s}: ${f(r.meas, 2)}/${f(r.lin, 2)}/${f(r.piled, 2)}`).join('  '));
  if (process.argv.includes('--local')) {
    // the hull's local flow (tools/local_flow.js) against what the tank shows beyond the field, in zeta / (U^2/2g): the
    // same at every speed, so set beside the mean over the six Froude numbers of (measured - field). The stem is read
    // 0.05 m abaft it, as the field is
    const { localFlow } = require('./local_flow.js'), avg = (a) => a.reduce((p, v) => p + v, 0) / a.length;
    const sts = out[0].rows.map(r => r.s), lf = sts.map(s => { const x = k * (LPP / 2 - s * LPP / 20) - (s === 0 ? 0.05 : 0); return [localFlow(hull, x, 0), localFlow(hull, x, WF.waterline(hull, x))]; });
    const res = sts.map(s => avg(out.map(o => { const r = o.rows.find(rr => rr.s === s); return r ? (r.meas - r.lin) / o.q : NaN; }).filter(isFinite)));
    console.log('the local flow, zeta / (U^2/2g), station: (measured - field), the mean of six Fn / the local flow on the centre plane / on the hull');
    console.log('  ' + sts.map((s, i) => `${s}: ${f(res[i], 3)}/${f(lf[i][0], 3)}/${f(lf[i][1], 3)}`).join('  '));
    for (const [name, sel] of [['the bow (stations 0-3)', (s) => s <= 3], ['the midbody (4-17)', (s) => s >= 4 && s <= 17], ['the stern (18-20)', (s) => s >= 18]]) {
      const idx = sts.map((s, i) => (sel(s) ? i : -1)).filter(i => i >= 0), rms = (g) => Math.sqrt(avg(idx.map(g)));
      console.log(`  ${name}: rms of (measured - field) ${f(rms(i => res[i] ** 2), 3)}; less the local flow on the centre plane ${f(rms(i => (res[i] - lf[i][0]) ** 2), 3)}, on the hull ${f(rms(i => (res[i] - lf[i][1]) ** 2), 3)}`);
    }
  }
  return out;
};
// for tools/wake_tests.js: the law on this hull at her length at Fn 0.22 (hers is 0.23), quietly: the measured crest over
// stations 0-2 and the law's drawn crest there
const bowCheck = () => { const o = runAt(K_HER, '', { quiet: true, only: [0] })[0]; return { hull: 'the Series 60', Fn: o.Fn, measured: o.crest[0], law: o.crest[2], linear: o.crest[1], Z: o.Zlaw }; };
module.exports = { bowCheck };
if (require.main === module) {
  runAt(K_HER, 'At her length (Froude-scaled to her waterline)');
  if (process.argv.includes('--own')) runAt(1, 'At its own length');
}
