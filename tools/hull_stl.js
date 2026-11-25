// hull_stl.js: her hull as a closed binary STL, for a towing tank (K6 of docs/BRAINSTORM_the_wake_computed_v2_1).
//   node tools/hull_stl.js <out.stl> [draught m] [freeboard m] [dx m]
// The hull is the model's own (C.halfBreadth with the ship's hull, C.buildShip().hull: since the calibration epoch's
// landing her ends above 11.0 m are restored from the deck plans, C3, and the default freeboard reaches over that;
// G24), from her keel to `freeboard` metres above the waterline at `draught` (the night's mean by default), sampled
// every `dx` metres along her and in 40 steps up her side, and closed: her bottom, a flat lid at the top, and her two
// ends. No rudder, screws or bossings: her bare hull.
// The STL's frame is a tank's: x across her (to starboard), y along the tank with her bow toward -y (the water runs
// toward +y past her), z up from her waterline. Metres. It prints her extent and her displacement as the mesh holds it.
'use strict';
const fs = require('fs');
const C = require('../core/core.js');
const M = require('../core/motion.js');
const out = process.argv[2];
if (!out) { console.log('usage: node tools/hull_stl.js <out.stl> [draught m] [freeboard m] [dx m]'); process.exit(2); }
const T = +(process.argv[3] || M.SHIP.d), FB = +(process.argv[4] || 8), DX = +(process.argv[5] || 0.5), NZ = 40;
const x0 = C.G.xAP - 0.5, x1 = C.xFwd(T + FB) + 0.5, nx = Math.round((x1 - x0) / DX) + 1, zTop = T + FB;
const HULL = C.buildShip().hull;                          // the ship's own hull, her ends with it (G24)
// half-breadths on a grid: b[i][j] at x0 + i dx, z = zTop * j / NZ (z from the keel)
const b = [];
for (let i = 0; i < nx; i++) { const row = []; for (let j = 0; j <= NZ; j++) row.push(Math.max(0, C.halfBreadth(x0 + i * DX, Math.min(zTop * j / NZ, C.zTopAt(x0 + i * DX) - 1e-3), HULL))); b.push(row); }
// the tank's frame: X = y_ship (to starboard: core's y is to port, so X = -(port)), Y = -x (bow to -Y), Z = z - T
const P = (i, j, side) => [side * b[i][j], -(x0 + i * DX), zTop * j / NZ - T];
const tris = [];
const tri = (a, c, d) => { if ((a[0] === c[0] && a[1] === c[1] && a[2] === c[2]) || (a[0] === d[0] && a[1] === d[1] && a[2] === d[2]) || (c[0] === d[0] && c[1] === d[1] && c[2] === d[2])) return; tris.push([a, c, d]); };
for (let i = 0; i < nx - 1; i++) for (let j = 0; j < NZ; j++) for (const s of [1, -1]) {     // her two sides
  const a = P(i, j, s), c = P(i + 1, j, s), d = P(i + 1, j + 1, s), e = P(i, j + 1, s);
  if (s > 0) { tri(a, c, d); tri(a, d, e); } else { tri(a, d, c); tri(a, e, d); }
}
for (let i = 0; i < nx - 1; i++) {                       // her bottom (j = 0) and the lid (j = NZ), across her
  const a = P(i, 0, -1), c = P(i + 1, 0, -1), d = P(i + 1, 0, 1), e = P(i, 0, 1); tri(a, d, c); tri(a, e, d);
  const f = P(i, NZ, -1), g = P(i + 1, NZ, -1), h = P(i + 1, NZ, 1), k = P(i, NZ, 1); tri(f, g, h); tri(f, h, k);
}
for (const i of [0, nx - 1]) for (let j = 0; j < NZ; j++) {   // her two ends, closed across where her section is not nought
  const a = P(i, j, -1), c = P(i, j, 1), d = P(i, j + 1, 1), e = P(i, j + 1, -1);
  if (i === 0) { tri(a, c, d); tri(a, d, e); } else { tri(a, d, c); tri(a, e, d); }
}
// binary STL: 80-byte header, the count, then each triangle's normal (left nought: FluidX3D does not read it), three vertices, two bytes
const buf = Buffer.alloc(84 + 50 * tris.length);
buf.write('Titanic hull, C.halfBreadth (ship.hull), tank frame (m): x across, y aft, z up', 0, 'ascii');
buf.writeUInt32LE(tris.length, 80);
let o = 84;
for (const t of tris) { o += 12; for (const v of t) for (const q of v) { buf.writeFloatLE(q, o); o += 4; } o += 2; }
fs.writeFileSync(out, buf);
// what the mesh holds: its extent, and the volume under the waterline (the divergence theorem over its closed surface, cut at z = 0 by summing the sections)
let vol = 0; for (let i = 0; i < nx; i++) { let a = 0; for (let j = 0; j < NZ; j++) { const z0 = zTop * j / NZ, z1 = zTop * (j + 1) / NZ; if (z0 >= T) break; const zb = Math.min(z1, T); a += (b[i][j] + b[i][j + 1]) * (zb - z0); } vol += a * DX * (i === 0 || i === nx - 1 ? 0.5 : 1); }
let maxB = 0; for (const r of b) for (const v of r) if (v > maxB) maxB = v;
console.log(`wrote ${out}: ${tris.length} triangles; her hull from x ${x0.toFixed(1)} to ${x1.toFixed(1)} m (${(x1 - x0).toFixed(1)} m), beam ${(2 * maxB).toFixed(2)} m, from her keel (${(-T).toFixed(2)} m) to ${FB.toFixed(1)} m above her waterline; under it ${vol.toFixed(0)} m3 (${(vol * C.RHO / 1000).toFixed(0)} t; the model's mass ${(M.SHIP.m / 1000).toFixed(0)} t)`);
