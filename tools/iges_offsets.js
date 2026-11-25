// iges_offsets.js: a hull's half-breadths from the rational B-spline surfaces (entity 128) of an IGES file (K6).
//   node tools/iges_offsets.js <file.igs> <draught m> <out.json> [stations] [waterlines]
// The IGES is data from outside: it is parsed, never run. Every surface is tessellated, and for each station and
// waterline the hull's half-breadth b(x, z) is the largest |y| at which any surface crosses that (x, z). It prints the
// surfaces' extents, the length and beam, and the volume under the draught, to set against the hull's published
// particulars. The table is written to out.json: { source, x0, x1, z0, z1, nx, nz, b[i][j] }, in the file's own frame.
// A benchmark's geometry and anything made from it stay outside this repository (BACKLOG K6): pass a path outside it.
'use strict';
const fs = require('fs');
const [file, draughtArg, out, nxArg, nzArg] = process.argv.slice(2);
if (!file || !draughtArg || !out) { console.log('usage: node tools/iges_offsets.js <file.igs> <draught m> <out.json> [stations] [waterlines]'); process.exit(2); }
const lines = fs.readFileSync(file, 'latin1').split(/\r?\n/).filter(l => l.length >= 73);
const sec = (c) => lines.filter(l => l[72] === c);
const D = sec('D'), P = sec('P');
const num = (t) => +t.trim().replace(/[dD]/, 'e');
const surfaces = [];
for (let i = 0; i < D.length; i += 2) {
  const type = +D[i].slice(0, 8), pd = +D[i].slice(8, 16), count = +D[i + 1].slice(24, 32);
  if (type !== 128) continue;
  const text = P.slice(pd - 1, pd - 1 + count).map(l => l.slice(0, 64)).join('');
  const p = text.slice(0, text.indexOf(';')).split(',').map(num);
  let k = 1; const K1 = p[k++], K2 = p[k++], M1 = p[k++], M2 = p[k++]; k += 5;   // PROP1..5
  const S = p.slice(k, k += K1 + M1 + 2), T = p.slice(k, k += K2 + M2 + 2);
  const n = (K1 + 1) * (K2 + 1), W = p.slice(k, k += n), C = p.slice(k, k += 3 * n);
  surfaces.push({ K1, K2, M1, M2, S, T, W, C, U0: p[k++], U1: p[k++], V0: p[k++], V1: p[k++] });
}
// a B-spline's basis functions of degree m on knots kn at u (Cox and de Boor)
const basis = (kn, m, K, u) => {
  let s = m; while (s < K && u >= kn[s + 1]) s++;
  const N = new Array(m + 1).fill(0), left = new Array(m + 1).fill(0), right = new Array(m + 1).fill(0); N[0] = 1;
  for (let j = 1; j <= m; j++) { left[j] = u - kn[s + 1 - j]; right[j] = kn[s + j] - u; let saved = 0; for (let r = 0; r < j; r++) { const den = right[r + 1] + left[j - r], t = den !== 0 ? N[r] / den : 0; N[r] = saved + right[r + 1] * t; saved = left[j - r] * t; } N[j] = saved; }
  return { s, N };
};
const point = (f, u, v) => {
  const bu = basis(f.S, f.M1, f.K1, u), bv = basis(f.T, f.M2, f.K2, v); let x = 0, y = 0, z = 0, w = 0;
  for (let b = 0; b <= f.M2; b++) for (let a = 0; a <= f.M1; a++) {
    const q = (bv.s - f.M2 + b) * (f.K1 + 1) + (bu.s - f.M1 + a), c = bu.N[a] * bv.N[b] * f.W[q];
    x += c * f.C[3 * q]; y += c * f.C[3 * q + 1]; z += c * f.C[3 * q + 2]; w += c;
  }
  return [x / w, y / w, z / w];
};
const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity], tri = [], NU = 48, NV = 48;
for (const f of surfaces) {
  const g = [];
  for (let b = 0; b <= NV; b++) { const row = []; for (let a = 0; a <= NU; a++) { const q = point(f, f.U0 + (f.U1 - f.U0) * a / NU, f.V0 + (f.V1 - f.V0) * b / NV); for (let c = 0; c < 3; c++) { lo[c] = Math.min(lo[c], q[c]); hi[c] = Math.max(hi[c], q[c]); } row.push(q); } g.push(row); }
  for (let b = 0; b < NV; b++) for (let a = 0; a < NU; a++) tri.push([g[b][a], g[b][a + 1], g[b + 1][a + 1]], [g[b][a], g[b + 1][a + 1], g[b + 1][a]]);
}
console.log(`${surfaces.length} surfaces of type 128, ${tri.length} triangles; extents x ${lo[0].toFixed(3)} to ${hi[0].toFixed(3)}, y ${lo[1].toFixed(3)} to ${hi[1].toFixed(3)}, z ${lo[2].toFixed(3)} to ${hi[2].toFixed(3)}`);
// b(x, z): the largest |y| of any triangle whose (x, z) shadow holds the point, triangles bucketed by grid cell
const nx = +(nxArg || 481), nz = +(nzArg || 121), x0 = lo[0], x1 = hi[0], z0 = lo[2], z1 = hi[2], cx = (x1 - x0) / (nx - 1), cz = (z1 - z0) / (nz - 1);
const cells = new Map();
for (const t of tri) {
  const ax = Math.min(t[0][0], t[1][0], t[2][0]), bx = Math.max(t[0][0], t[1][0], t[2][0]), az = Math.min(t[0][2], t[1][2], t[2][2]), bz = Math.max(t[0][2], t[1][2], t[2][2]);
  for (let i = Math.max(0, Math.floor((ax - x0) / cx)); i <= Math.min(nx - 1, Math.ceil((bx - x0) / cx)); i++) for (let j = Math.max(0, Math.floor((az - z0) / cz)); j <= Math.min(nz - 1, Math.ceil((bz - z0) / cz)); j++) { const key = i * nz + j; if (!cells.has(key)) cells.set(key, []); cells.get(key).push(t); }
}
const b = [];
for (let i = 0; i < nx; i++) {
  const row = [];
  for (let j = 0; j < nz; j++) {
    const x = x0 + i * cx, z = z0 + j * cz; let best = 0;
    for (const [A, B, C] of cells.get(i * nz + j) || []) {
      const d = (B[2] - C[2]) * (A[0] - C[0]) + (C[0] - B[0]) * (A[2] - C[2]); if (Math.abs(d) < 1e-14) continue;
      const l1 = ((B[2] - C[2]) * (x - C[0]) + (C[0] - B[0]) * (z - C[2])) / d, l2 = ((C[2] - A[2]) * (x - C[0]) + (A[0] - C[0]) * (z - C[2])) / d, l3 = 1 - l1 - l2;
      if (l1 >= -1e-9 && l2 >= -1e-9 && l3 >= -1e-9) best = Math.max(best, Math.abs(l1 * A[1] + l2 * B[1] + l3 * C[1]));
    }
    row.push(best);
  }
  b.push(row);
}
const T = +draughtArg; let vol = 0, wa = Infinity, wb = -Infinity, beam = 0;
const at = (i, z) => { const f = (z - z0) / cz, j = Math.min(nz - 2, Math.floor(f)); return b[i][j] + (b[i][j + 1] - b[i][j]) * (f - j); };
for (let i = 0; i < nx; i++) {
  let a = 0; for (let j = 0; j < nz - 1; j++) { const za = z0 + j * cz, zb = Math.min(z0 + (j + 1) * cz, T); if (za >= T) break; a += (b[i][j] + at(i, zb)) * (zb - za); }
  vol += a * cx * (i === 0 || i === nx - 1 ? 0.5 : 1);
  const w = at(i, T); if (w > 1e-6) { wa = Math.min(wa, x0 + i * cx); wb = Math.max(wb, x0 + i * cx); beam = Math.max(beam, 2 * w); }
}
console.log(`at the draught ${T}: the waterline from x ${wa.toFixed(3)} to ${wb.toFixed(3)} (${(wb - wa).toFixed(3)}), beam ${beam.toFixed(3)}; the volume under it ${vol.toFixed(1)} (both sides)`);
fs.writeFileSync(out, JSON.stringify({ source: file, x0, x1, z0, z1, nx, nz, b: b.map(r => r.map(v => +v.toFixed(5))) }));
console.log(`wrote ${out}: ${nx} stations by ${nz} waterlines`);
