// local_flow.js: a hull's local flow on its waterline, the part of a tank's wave profile that is not waves (K6).
//   node tools/local_flow.js          # its check against the two-dimensional thin strut
//   require('./local_flow.js').localFlow(h, x, y)   # h a hullGrid: zeta / (U^2 / 2g) on the waterline at (x, y)
// The wave field holds a hull's free waves only. Near a hull the water also speeds up past the midbody (its surface
// falls) and slows at the ends (it rises), in proportion to U^2 / 2g at every speed. This is that part, from the same
// thin-ship sources as Michell's integral, with the water's surface held flat (the double body):
// - sources m = -2 U dY/dx on the centre plane (x forward, the water running aft), and their image above the surface;
// - each panel's x-velocity in closed form: the integral of (x - xi) / R^3 over the panel is, over its two ends,
//   the difference of asinh(d2 / a) - asinh(d1 / a), a = sqrt((x - xi)^2 + y^2), d1 and d2 its depths;
// - zeta = U u / g, the linear Bernoulli relation, so zeta / (U^2 / 2g) = 2 u / U.
// It is a diagnostic for K6's benchmarks (tools/s60_compare.js and tools/wigley_compare.js, --local); the page does
// not use it. Read on the centre plane (y = 0) it is thin-ship theory's own value, and it is singular where the
// waterline has a kink (a hull interpolated straight between stations has one at every station); read on the hull's
// surface (y its half-breadth) it is smooth, and about 15 % lower amidships on a deep strut (the check below).
'use strict';
function localFlow(h, x, y) {
  const { nx, nz, dx, dz, x0, T, Y } = h; let sum = 0;
  const F = (xi, d1, d2) => { const a = Math.sqrt((x - xi) * (x - xi) + y * y) || 1e-9; return Math.asinh(d2 / a) - Math.asinh(d1 / a); };
  for (let i = 0; i < nx - 1; i++) {
    const xa = x0 + i * dx, xb = xa + dx;
    for (let j = 0; j < nz - 1; j++) {
      const s = ((Y[(i + 1) * nz + j] + Y[(i + 1) * nz + j + 1]) - (Y[i * nz + j] + Y[i * nz + j + 1])) / (2 * dx);   // dY/dx on the panel
      if (s === 0) continue;
      const d1 = T - (j + 1) * dz, d2 = T - j * dz;   // the panel's depths below the surface, shallow and deep
      sum += s * (F(xb, d1, d2) - F(xa, d1, d2));
    }
  }
  return -(2 / Math.PI) * sum;   // u / U = -(1 / pi) sum s [F(xb) - F(xa)], the source and its image together; zeta / q = 2 u / U
}
module.exports = { localFlow };
if (require.main === module) {
  // a deep parabolic strut (B/L 0.1, its draught 20 L): two-dimensional thin-strut theory gives
  // u / U = -(4 B / (pi L^2)) [L - x ln((L/2 + x) / (L/2 - x))], so zeta / q = 2 u / U, -8 B / (pi L) = -0.2546 amidships
  const WF = require('../site/parts/24_wake_field.js');
  const L = 100, B = 10, h = WF.hullGrid((x) => (Math.abs(x) <= L / 2 ? (B / 2) * (1 - (2 * x / L) ** 2) : 0), -L / 2 - 1, L / 2 + 1, 20 * L, 0.25, 401);
  let worst = 0;
  for (const x of [0, 20, 40]) {
    const exact = -(8 * B / (Math.PI * L * L)) * (L - (x ? x * Math.log((L / 2 + x) / (L / 2 - x)) : 0)), got = localFlow(h, x + 0.125, 0);
    if (x < 40) worst = Math.max(worst, Math.abs(got / exact - 1));
    console.log(`deep strut, x ${x} m: zeta / (U^2/2g) ${got.toFixed(4)} on the centre plane, ${localFlow(h, x + 0.125, (B / 2) * (1 - (2 * x / L) ** 2)).toFixed(4)} on its surface; the 2D thin strut ${exact.toFixed(4)}`);
  }
  console.log(worst < 0.01 ? `PASS: within ${(worst * 100).toFixed(2)} % of the 2D thin strut amidships and at x 20 m` : `FAIL: ${(worst * 100).toFixed(2)} % off`);
  process.exit(worst < 0.01 ? 0 : 1);
}
