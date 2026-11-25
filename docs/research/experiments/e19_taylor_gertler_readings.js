// e19: M6, the period resistance curve read. Gertler's reanalysis of the Taylor Standard Series (DTMB Report 806, 1954;
// Internet Archive item DTIC_AD0224171, leaf n195: the chart "B/H = 3.00, Cp = 0.68", the low-speed range, Froude
// number 0.15 to 0.29) read on 2026-11-17 by viewing the page image in the browser and scanning its pixels: along a row
// of the scan at each speed, the thin gridlines (0.1 x 10^-3 of residual-resistance coefficient apart, about 680 px)
// and the chart's zero edge give the local scale (the scan leans about 0.8 degree, so each row is measured on its own
// gridlines), and the thick curves give C_R for volumetric coefficients 1.0 to 7.0 x 10^-3. The Froude scale comes from
// the speed-length-ratio grid (0.01 per 74 px, 0.50 at the chart's lower edge). Below Fn 0.149 the chart does not
// reach: C_R is held at its lowest value there, as is standard. This hull: volumetric coefficient 2.75 x 10^-3 (between
// the 2.0 and 3.0 curves, linear), B/T 2.87, Cp about 0.683.
// The worksheet and its rules are the period-curve research note's (docs/research/RESEARCH_period_resistance_curve_v1_2026-11-17.md,
// section 2.3): the shape from the 1947 ATTC friction line plus 0.0004 and C_R,3D = C_R (Gertler) less k (C_F model -
// C_F ship), the linear speed formulas fitted there to the model's speed solver.
//   node docs/research/experiments/e19_taylor_gertler_readings.js [--write]
// Output of 2026-11-17: results_2026-11-17/e19_taylor_gertler_readings.txt
const fs = require('fs'), path = require('path');
const out = [], log = (s) => { out.push(s); console.log(s); };
// pixel readings [image row, zero edge x, px per 1.0e-3, x of the 1.0, 2.0, 3.0 curves], measured as above
const ROWS = {
  0.149: { iy: 4152, x0: 3227.0, s: 678.8, c1: 2992.5, c2: 2952.0, c3: 2915.0 },
  0.156: { iy: 3986, x0: 3231.0, s: 680.8, c1: 2993.5, c2: 2954.5, c3: 2917.5 },
  0.184: { iy: 3290, x0: 3242.0, s: 681.5, c1: 3004.5, c2: 2965.5, c3: 2925.0 },
  0.226: { iy: 2246, x0: 3261.0, s: 683.6, c1: 3010.0, c2: 2843.0, c3: 2729.0 },
};
const f = (v, n) => v.toFixed(n === undefined ? 3 : n);
log('e19: Gertler (1954), B/H 3.00, Cp 0.68, low-speed chart (DTIC_AD0224171, leaf n195), read by pixel scan; C_R x 10^-3');
log('  Fn      vol 1.0   vol 2.0   vol 3.0   vol 2.75 (this hull)');
const CR = {};
for (const [fn, r] of Object.entries(ROWS)) {
  const v = (x) => (r.x0 - x) / r.s, a = v(r.c1), b = v(r.c2), c = v(r.c3);
  CR[fn] = b + 0.75 * (c - b);
  log('  ' + (+fn).toFixed(3) + '   ' + f(a) + '     ' + f(b) + '     ' + f(c) + '     ' + f(CR[fn]));
}
// the worksheet: friction + 0.0004 at the speeds, and the 2D-to-3D correction (the note's table, interpolated)
const FR = { 8.2: 1.9476, 15.3: 1.8345, 18: 1.8065, 22.15: 1.7725 }, CORR = { 8.2: 0.260, 15.3: 0.227, 18: 0.220, 22.15: 0.2107 };
const C3 = { 8.2: CR['0.149'] - CORR[8.2], 15.3: CR['0.156'] - CORR[15.3], 18: CR['0.184'] - CORR[18], 22.15: CR['0.226'] - CORR[22.15] };
log('\n  C_R,3D x 10^-3 (less the 2D-to-3D correction): 8.2 kn ' + f(C3[8.2]) + ' (held from Fn 0.149); 15.3 kn ' + f(C3[15.3]) + '; 18 kn ' + f(C3[18]) + '; 22.15 kn ' + f(C3[22.15]));
log('  Holtrop\'s equivalent, from the note: 8.2 kn about 0.172; 15.3 kn about 0.25; 18 kn 0.375; 22.15 kn about 0.692');
const g = (kn) => (FR[kn] + C3[kn]) / (FR[22.15] + C3[22.15]);
const s60 = 17.72 + 4.17 * (1 - g(18)), sHalf = 14.77 + 3.68 * (1 - g(15.3)), sSlow = 7.95 + 2.13 * (1 - g(8.2));
log('\nThe note\'s rules (in C_R,3D; its linear speed formulas, as-built screws):');
log('  60 rpm <= 18.0 kn needs C_R(18) >= 0.933 C_R(22.15) - 0.153 = ' + f(0.933 * C3[22.15] - 0.153) + ': ' + f(C3[18]) + ' -> ' + (C3[18] >= 0.933 * C3[22.15] - 0.153 ? 'pass' : 'FAIL') + '; 60 rpm ' + f(s60, 2) + ' kn (Holtrop 18.20)');
log('  Slow 30 >= 8.2 kn needs C_R(22.15) >= 0.434 + 1.133 C_R(8.2) = ' + f(0.434 + 1.133 * C3[8.2]) + ': ' + f(C3[22.15]) + ' -> ' + (C3[22.15] >= 0.434 + 1.133 * C3[8.2] ? 'pass' : 'FAIL') + '; Slow ' + f(sSlow, 2) + ' kn (Holtrop 8.25)');
log('  Half 50 >= 14.9 kn needs C_R(22.15) >= 0.129 + 1.037 C_R(15.3) = ' + f(0.129 + 1.037 * C3[15.3]) + ': ' + f(C3[22.15]) + ' -> ' + (C3[22.15] >= 0.129 + 1.037 * C3[15.3] ? 'pass' : 'FAIL') + '; Half ' + f(sHalf, 2) + ' kn (Holtrop 15.31)');
log('\nVerdict (the note\'s rule: replace Holtrop only if the period curve meets all three): KEEP Holtrop\'s shape. The period curve');
log('fails the 60-rpm rule as Holtrop does and gives the same 18.2 kn there, an independent confirmation that the shape is not');
log('what keeps 60 rpm over the consensus\'s band; and it loses Slow ahead (8.10 kn) where Holtrop is in.');
if (process.argv.includes('--write')) {
  const dir = path.join(__dirname, 'results_2026-11-17');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, 'e19_taylor_gertler_readings.txt'), out.join('\n') + '\n');
}
