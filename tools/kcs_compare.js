// kcs_compare.js: the wave field's method on the KCS benchmark hull, against KRISO's measured wave profile along it (K6).
//   node tools/kcs_compare.js <kcs offsets .json>
// K6 checks the library's method on a hull with published towing-tank waves.
// - The hull: the KCS (KRISO container ship) at 230 m, draught 10.8 m. Its offsets come from the Tokyo 2015 workshop's
//   IGES (t2015.nmri.go.jp, KCS_hull_SVA.zip) through tools/iges_offsets.js. The geometry, and anything made from it,
//   stays outside this repository: pass the table's path.
// - The measurements: Kim, W.J., Van, S.H. and Kim, D.H. (2001), "Measurement of flows around modern commercial ship
//   models", Experiments in Fluids 31, 567-578.
//   - Fig. 6, the wave elevation along the hull at Fn 0.26, read from photographs; its 22 markers were digitised from
//     the figure for this comparison (X from -0.5, the F.P., to 0.5, the A.P.; H = zeta / Lpp).
//   - Section 3.1: the residuary resistance coefficient 0.725e-3 and the frictional one (ITTC 1957) 2.832e-3, at zero
//     trim and sinkage.
// The method is the library's own, unchanged:
// - Michell's thin-ship footprints from the hull's half-breadths (hullGrid, michell);
// - a gain of sqrt(the measured wave resistance / Michell's), given through createWake's o.scale. The wave resistance
//   is the residuary less the form drag, Cw = Cr - k Cf, with the form factor k from 0.05 to 0.15;
// - the field run steady at the hull's speed;
// - the sea against her plating read as the page reads it (alongside: 3 m off the plating), with and without the
//   bow's pile-up: the fixed factor 3.5 over CFG.bowReach of K6's first notes. The page's own bow wave is now a law
//   (Noblesse and others 2008, for non-bulbous bows), which a bulbous bow is outside; so this hull keeps the factor.
'use strict';
const fs = require('fs');
const WF = require('../site/parts/24_wake_field.js');
const file = process.argv[2];
if (!file) { console.log('usage: node tools/kcs_compare.js <kcs offsets .json> (from tools/iges_offsets.js; kept outside this repository)'); process.exit(2); }
const tab = JSON.parse(fs.readFileSync(file, 'utf8'));
const LPP = 230, T = 10.8, FN = 0.26, G = 9.81, RHO = 1025, U = FN * Math.sqrt(G * LPP), S = 9.4379 * 31.6 * 31.6;   // S: the model's 9.4379 m2 at 1:31.6
const CR = 0.725e-3, CF = 2.832e-3;
// KRISO's longitudinal wave cuts at y/Lpp 0.0741, 0.1509 and 0.4224 (the same 2001 measurements), as plotted in
// Kuhl, J. (2020), "Cahn-Hilliard Navier-Stokes simulations for marine free-surface flows", arXiv 2002.04885, Fig. 13
// (markers "Kim et. al (2001)", digitised from the figure): x1/Lpp from 0 at the A.P. to 1 at the F.P., zeta / Lpp.
const CUT_A = [[-0.3681,0.002417],[-0.3395,0.000993],[-0.3047,-0.001678],[-0.2757,-0.003201],[-0.2472,-0.00379],[-0.2144,-0.003532],[-0.1878,-0.001744],[-0.153,0.000949],[-0.1282,0.004084],[-0.095,0.00415],[-0.0663,0.004687],[-0.0323,0.00454],[-0.0047,0.004018],[0.026,0.0034],[0.0586,0.002634],[0.0837,0.001508],[0.1159,0.000221],[0.145,-0.001707],[0.1762,-0.003481],[0.2066,-0.004305],[0.2336,-0.004868],[0.2663,-0.004636],[0.297,-0.004051],[0.3276,-0.002892],[0.3583,-0.002009],[0.3873,-0.00106],[0.4146,-0.000508],[0.4436,2.2e-5],[0.4801,0.000265],[0.5101,-0.000384],[0.5394,-0.001302],[0.5667,-0.002583],[0.5989,-0.003767],[0.6276,-0.004536],[0.6554,-0.005099],[0.684,-0.005254],[0.7163,-0.004967],[0.7507,-0.00468],[0.7797,-0.002075],[0.8086,0.000147],[0.8373,0.003135],[0.8681,0.003898],[0.9334,0.0034],[0.9591,0.002804],[0.9914,0.002185],[1.0221,0.001567],[1.0507,0.001159],[1.0822,0.000762],[1.1104,0.000585],[1.1412,0.000442],[1.1722,0.000335],[1.2007,0.000254],[1.2318,0.000199],[1.2624,0.000177],[1.291,0.000121],[1.3217,0.000132],[1.3507,0.00011],[1.3855,0.000132]];
const CUT_B = [[-0.3685,-0.001176],[-0.3395,-0.001954],[-0.3088,-0.001739],[-0.2768,-0.001154],[-0.2479,-0.00077],[-0.2144,-0.00048],[-0.1854,-0.000348],[-0.1575,9.4e-5],[-0.1286,0.001019],[-0.0964,0.001695],[-0.0644,0.002716],[-0.037,0.003197],[-0.0101,0.003263],[0.0239,0.002758],[0.0517,0.001855],[0.0834,0.001082],[0.113,-0.000157],[0.1442,-0.001402],[0.1727,-0.002145],[0.2058,-0.003023],[0.2367,-0.00334],[0.2634,-0.002973],[0.2936,-0.002244],[0.326,-0.001573],[0.3525,-0.000431],[0.386,-0.00034],[0.4155,-0.000464],[0.4436,0.000232],[0.4756,0.001342],[0.5028,0.001369],[0.5352,4.1e-5],[0.5671,-0.001905],[0.5961,-0.003453],[0.6235,-0.004335],[0.6579,-0.004199],[0.6881,-0.003346],[0.7163,-0.002054],[0.7445,-0.000712],[0.7764,0.000422],[0.805,0.001226],[0.8373,0.001673],[0.864,0.001676],[0.8965,0.001627],[0.9256,0.001441],[0.9522,0.001231],[0.9865,0.001027],[1.0171,0.000845],[1.0472,0.000751],[1.0782,0.000591],[1.107,0.000538],[1.1381,0.000464],[1.1704,0.000414],[1.1986,0.000298],[1.226,0.000364],[1.2566,0.000282],[1.2873,0.000265],[1.3175,0.000232],[1.3482,0.000232],[1.3789,0.000207]];
const CUT_C = [[-0.3934,0.001373],[-0.3665,0.000954],[-0.3354,4.6e-5],[-0.3081,-0.00094],[-0.2753,-0.001673],[-0.2426,-0.001853],[-0.2172,-0.001462],[-0.1863,-0.000581],[-0.1552,0.000539],[-0.1225,0.001502],[-0.0952,0.001968],[-0.0645,0.001963],[-0.0355,0.001419],[-0.0045,0.000613],[0.0247,-0.00016],[0.0553,-0.000731],[0.0867,-0.001203],[0.1144,-0.001281],[0.1467,-0.00118],[0.1757,-0.000866],[0.2051,-0.000576],[0.2358,-0.000217],[0.2668,-9e-6],[0.2958,1.8e-5],[0.3252,1.8e-5],[0.3579,-8.3e-5],[0.3853,-0.000217],[0.4159,-0.000424],[0.447,-0.000475],[0.478,-0.000659],[0.507,-0.000636],[0.536,-0.000608],[0.5692,-0.000608],[0.6023,-0.000553],[0.6294,-0.000504],[0.6586,-0.000369],[0.6909,-0.00024],[0.722,-0.000138],[0.7473,-6.5e-5],[0.7783,-3.2e-5],[0.8057,-1.4e-5],[0.8384,6.9e-5],[0.8715,4.6e-5],[0.8988,4.6e-5],[0.9312,1.8e-5],[0.9585,4.6e-5],[0.99,7.4e-5],[1.0173,7.4e-5],[1.0517,6.9e-5],[1.0807,1.8e-5],[1.1101,4.6e-5],[1.1407,4.6e-5],[1.1681,4.6e-5],[1.199,4.3e-5],[1.2318,4.6e-5],[1.2608,9.7e-5],[1.2898,9.2e-5],[1.3176,4.1e-5],[1.35,6.3e-5],[1.383,4.1e-5]];
const MEAS = [[-0.5, 0.005765], [-0.4751, 0.010711], [-0.4499, 0.008434], [-0.3999, 0.005573], [-0.3504, 0.002740], [-0.3004, -0.001566], [-0.25, -0.003914], [-0.2003, -0.00521], [-0.15, -0.005487], [-0.1004, -0.003601], [-0.0504, -0.001388], [-0.0001, 0.0000427], [0.0497, 0.00032], [0.1001, -0.000498], [0.1499, -0.001872], [0.1997, -0.002982], [0.2493, -0.004505], [0.2997, -0.003096], [0.3496, -0.001409], [0.3994, 0.001281], [0.4496, 0.0021], [0.4993, 0.003345]];
// the hull in the library's frame: x forward of amidships (the IGES's x less Lpp / 2), zeta up from the waterline
const bAt = (xi, z) => { const fi = (xi - tab.x0) / (tab.x1 - tab.x0) * (tab.nx - 1), fj = (z - tab.z0) / (tab.z1 - tab.z0) * (tab.nz - 1); if (!(fi >= 0 && fi <= tab.nx - 1 && fj >= 0 && fj <= tab.nz - 1)) return 0; const i = Math.min(tab.nx - 2, Math.floor(fi)), j = Math.min(tab.nz - 2, Math.floor(fj)), a = fi - i, c = fj - j, B = tab.b; return B[i][j] * (1 - a) * (1 - c) + B[i + 1][j] * a * (1 - c) + B[i][j + 1] * (1 - a) * c + B[i + 1][j + 1] * a * c; };
const Yf = (x, zeta) => bAt(x + LPP / 2, zeta + T);
let xa = Infinity, xb = -Infinity, xw = -Infinity;
for (let x = -130; x <= 130; x += 0.25) { let any = false; for (let z = 0; z <= T + 1e-9; z += T / 20) if (Yf(x, z - T) > 1e-4) any = true; if (any) { xa = Math.min(xa, x); xb = Math.max(xb, x); } if (Yf(x, 0) > 1e-4) xw = Math.max(xw, x); }
const hull = WF.hullGrid(Yf, xa - 0.5, xb + 0.5, T, 0.5, 21); hull.xStem = xw;
const mi = WF.michell(hull, U);
const fields = new Map();
const fieldOf = (gain) => {        // the wake at that gain, steady after 150 s, her track along +X
  if (fields.has(gain)) return fields.get(gain);
  const W = WF.createWake({ hull, scale: () => gain }); WF.work(W, 0); let t = 0, X = 0;
  while (t < 150 - 1e-9) { t += 0.25; X += U * 0.25; WF.push(W, { t, X, Y: 0, psi: 0, u: U, v: 0, r: 0, TP: 0, TS: 0, TC: 0, nP: 0, nS: 0, nC: 0, del: 0 }); WF.work(W, 0); }
  WF.refresh(W); fields.set(gain, W); return W;
};
const PILE = 3.5;   // the fixed factor of K6's first notes on this hull, before the law (the KCS's bulb is outside the law's range)
const sideOf = (gain, pile) => {   // the sea against her port side (KRISO measured the port side); pile 1: the field alone
  const W = fieldOf(gain);
  const n = 960, a = WF.alongside(W, n, null, pile === 1 ? { linear: true } : { pile }), h = W.hull;
  return (x) => a[2 * Math.max(0, Math.min(n - 1, Math.round((x - h.x0) / (h.x1 - h.x0) * n - 0.5)))];
};
const seaOf = (gain) => {          // the field anywhere beside her, read as the page reads it (y0^2 = y^2 - b^2); x forward, y to starboard
  const W = fieldOf(gain), s = W.shown;
  return (x, y) => { const y0 = WF.fieldY(hull, x, y); return WF.at(W.near, W.hNear, s.X + x, s.Y + y0) + WF.at(W.far, W.hFar, s.X + x, s.Y + y0); };
};
const f = (v, d) => (isFinite(v) ? v.toFixed(d) : 'n/a');
console.log(`KCS at Fn ${FN}, ${f(U, 3)} m/s at full scale: the hull grid from x ${f(hull.x0, 1)} to ${f(hull.x1, 1)} m, its waterline's stem at ${f(xw, 2)} m; Michell's wave resistance ${f(mi.Rw / 1000, 1)} kN`);
console.log(`the measured profile (Kim, Van and Kim 2001, Fig. 6): first crest ${f(MEAS[1][1] * LPP, 2)} m at X ${MEAS[1][0]}, trough ${f(MEAS[8][1] * LPP, 2)} m at X ${MEAS[8][0]}, ${f(MEAS[21][1] * LPP, 2)} m at the A.P.`);
const rows10 = [];
for (const k of [0.05, 0.10, 0.15]) {
  const Cw = CR - k * CF, Rw = 0.5 * RHO * U * U * S * Cw, gain = Math.sqrt(Rw / mi.Rw), lin = sideOf(gain, 1), piled = sideOf(gain, PILE);
  const rows = MEAS.map(([Xp, H]) => { const x = -Xp * LPP; return [Xp, H * LPP, lin(x), piled(x)]; });
  const rms = (c) => Math.sqrt(rows.reduce((s, r) => s + (r[c] - r[1]) ** 2, 0) / rows.length);
  const cor = (c) => { const n = rows.length, ma = rows.reduce((s, r) => s + r[1], 0) / n, mb = rows.reduce((s, r) => s + r[c], 0) / n; let ab = 0, aa = 0, bb = 0; for (const r of rows) { ab += (r[1] - ma) * (r[c] - mb); aa += (r[1] - ma) ** 2; bb += (r[c] - mb) ** 2; } return ab / Math.sqrt(aa * bb); };
  console.log(`form factor ${f(k, 2)}: Cw ${f(Cw * 1000, 3)}e-3, the measured wave resistance ${f(Rw / 1000, 1)} kN, the gain ${f(gain, 4)} (Michell's over the measured: ${f(mi.Rw / Rw, 1)}); against the 22 measured points: linear rms ${f(rms(2), 3)} m, correlation ${f(cor(2), 2)}; with the bow's fixed pile (${PILE} over ${WF.CFG.bowReach} m) rms ${f(rms(3), 3)} m, correlation ${f(cor(3), 2)}; the first crest (X ${MEAS[1][0]}) ${f(rows[1][2], 2)} m linear, ${f(rows[1][3], 2)} m piled`);
  if (k === 0.10) rows10.push(...rows);
}
console.log('the profile at form factor 0.10 (m): X, measured, linear, piled');
for (const r of rows10) console.log(`  ${f(r[0], 3).padStart(7)}  ${f(r[1], 2).padStart(6)}  ${f(r[2], 2).padStart(6)}  ${f(r[3], 2).padStart(6)}`);
// the wave cuts: the field's own heights there (the bow's pile acts only against her plating, not here)
console.log('the wave cuts (Kuhl 2020, Fig. 13, KRISO\'s markers), on her port side, x1/Lpp from -0.4 to 1.4:');
for (const k of [0.05, 0.10, 0.15]) {
  const Cw = CR - k * CF, gain = Math.sqrt(0.5 * RHO * U * U * S * Cw / mi.Rw), sea = seaOf(gain), out = [];
  for (const [yl, data] of [[0.0741, CUT_A], [0.1509, CUT_B], [0.4224, CUT_C]]) {
    const rows = data.map(([x1, z]) => [x1, z * LPP, sea((x1 - 0.5) * LPP, -yl * LPP)]);
    const rmsOf = (c) => Math.sqrt(rows.reduce((s, r) => s + r[c] * r[c], 0) / rows.length), err = Math.sqrt(rows.reduce((s, r) => s + (r[2] - r[1]) ** 2, 0) / rows.length);
    const n = rows.length, ma = rows.reduce((s, r) => s + r[1], 0) / n, mb = rows.reduce((s, r) => s + r[2], 0) / n; let ab = 0, aa = 0, bb = 0;
    for (const r of rows) { ab += (r[1] - ma) * (r[2] - mb); aa += (r[1] - ma) ** 2; bb += (r[2] - mb) ** 2; }
    out.push(`y/Lpp ${yl}: measured rms ${f(rmsOf(1), 3)} m, field ${f(rmsOf(2), 3)} m (${f(rmsOf(2) / rmsOf(1), 2)}), rms difference ${f(err, 3)} m, correlation ${f(ab / Math.sqrt(aa * bb), 2)}`);
    if (k === 0.10) rows10.length = 0, rows10.push(...rows), out.push(rows.filter((r, i) => i % 6 === 0).map(r => `${f(r[0], 2)}: ${f(r[1], 2)} / ${f(r[2], 2)}`).join('   '));
  }
  console.log(`form factor ${f(k, 2)}:\n  ` + out.join('\n  '));
}
