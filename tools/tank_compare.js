// tank_compare.js: her wave field against a towing tank's free surface (K6 of docs/BRAINSTORM_the_wake_computed_v2_1).
//   node tools/tank_compare.js <export folder> [heights file] [--png <out.png>] [--txt <out.txt>]
// The tank is a FluidX3D run (docs/runbooks/K6_tank_on_the_rtx_machine.md): water past her fixed hull at her speed, her
// bow turned by a drift or not, under a free surface. FluidX3D's code, the tank's setup and its results stay outside
// this repository (FluidX3D's licence; Bo, 2026-11-20); a tank number comes in only when Bo publishes it, with its method.
// Its export folder holds tank.txt (the grid, her place, the units) and heights_t<s>.f32 (the surface's height above the
// still water in each column; float32, y outer, x inner; NaN where her hull stands in the column). Cell (i, j) stands at
// (i, j) in the tank's coordinates, as FluidX3D voxelizes.
// The field is given her motion as the tank has it: steady at the tank's speed, her heading turned by the drift from her
// track (a sway to port of U sin(drift)), no turn, for 150 s after the library's own lead-in.
// Compared, on the same places:
//   0. the frame: the tank's hull columns against her plan where this mapping puts it; the tank's still level (its median
//      40 to 100 m ahead of her stem less the field's there), taken off everything after; how steady the tank is between
//      its last two heights files;
//   1. the sea against her plating along each side: the tank's first point clear of her hull, against the library's
//      alongside (her bow wave by the law of CFG.bowAngle's comment) and the field's own value there;
//   2. wave cuts along her, 1.5 beams off her centre line on each side, from her stem to the tank's end;
//   3. the transverse waves down the stream from her amidships, 40 to 340 m astern of her stern: their spacing;
//   4. the wedge: how far out the waves reach on each side, 300 and 450 m down the stream from her stem.
// --png writes the tank (left) beside the field (right) on the tank's grid, her stem up, heights from -1.5 m (dark) to
// +1.5 m (light), her hull black; at most 1400 pixels on a side. --txt keeps the report in a file as well (UTF-8).
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const C = require('../core/core.js');
const M = require('../core/motion.js');
const WF = require('../site/parts/24_wake_field.js');
const args = process.argv.slice(2), pos = [];
let png = null, txt = null;
for (let i = 0; i < args.length; i++) { if (args[i] === '--png') png = args[++i] || ''; else if (args[i] === '--txt') txt = args[++i] || ''; else pos.push(args[i]); }
const dir = pos[0];
if (!dir || png === '' || txt === '') { console.log('usage: node tools/tank_compare.js <export folder> [heights file] [--png <out.png>] [--txt <out.txt>]'); process.exit(2); }
const lines = [], say = (l) => { lines.push(l); console.log(l); };   // the report; --txt keeps it as UTF-8
const meta = {}; for (const l of fs.readFileSync(path.join(dir, 'tank.txt'), 'utf8').split(/\r?\n/)) { const m = /^(\S+)\s+(\S+)$/.exec(l.trim()); if (m) meta[m[1]] = +m[2]; }
const files = fs.readdirSync(dir).filter(n => /^heights_t\d+\.f32$/.test(n)).sort((a, b) => +a.match(/\d+/)[0] - +b.match(/\d+/)[0]);
const file = pos[1] || files[files.length - 1], before = files[files.indexOf(file) - 1];
const Nx = meta.Nx, Ny = meta.Ny, dx = meta.dx_m, U = meta.U_ms, KN = WF.KN, hull = WF.herHull();
const load = (name) => {
  const raw = fs.readFileSync(path.join(dir, name));
  if (raw.length !== 4 * Nx * Ny) { console.log(`tank_compare: ${name} holds ${raw.length} bytes, not ${4 * Nx * Ny}`); process.exit(2); }
  return new Float32Array(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.length));
};
const hT = load(file);
const f = (v, d) => (v === null || v === undefined || !isFinite(v) ? 'n/a' : v.toFixed(d === undefined ? 0 : d));

// her frame (x forward of amidships, y to starboard) in the tank's cells: the STL's (X, Y) is (y, -x) (tools/hull_stl.js),
// turned by the drift about z (FluidX3D's float3x3(axis, angle)), from where the setup put the STL's origin
const beta = (meta.drift_deg || 0) * Math.PI / 180, cb = Math.cos(beta), sb = Math.sin(beta);
const T = M.SHIP.d, x1 = C.xFwd(T + 8) + 0.5, xA = C.G.xAP - 0.5;      // the STL's two ends (tools/hull_stl.js, its defaults)
if (meta.origin_y_cells === undefined && beta !== 0) { console.log('tank_compare: an export with a drift needs origin_x_cells and origin_y_cells in its tank.txt'); process.exit(2); }
const oX = meta.origin_x_cells !== undefined ? meta.origin_x_cells : meta.centre_x_cells;
const oY = meta.origin_y_cells !== undefined ? meta.origin_y_cells : meta.bow_y_cells + x1 / dx;   // an older export: straight only
const cellOf = (x, y) => [oX + (cb * y + sb * x) / dx, oY + (sb * y - cb * x) / dx];
const herOf = (a, b) => { const X = (a - oX) * dx, Y = (b - oY) * dx; return [sb * X - cb * Y, cb * X + sb * Y]; };
const down = [-cb, sb], across = [sb, cb];      // in her frame: down the stream, and across it toward the tank's +x
const stemAt = (a, c) => [hull.xStem + a * down[0] + c * across[0], a * down[1] + c * across[1]];  // a down the stream from her stem, c across
// her plan as the setup finds her hull's columns: her hull anywhere from her keel to 8 cells over her waterline
const planDx = 0.25, plan = [];
for (let x = xA; x <= x1 + 1e-9; x += planDx) {
  let b = 0;
  for (let j = 0; j <= 40; j++) { const z = (T + 8) * j / 40; if (z > T + 8 * dx + 1e-9) break; b = Math.max(b, C.halfBreadth(x, Math.min(z, C.zTopAt(x) - 1e-3))); }
  plan.push(b);
}
const planAt = (x) => { const u = (x - xA) / planDx, i = Math.floor(u); if (i < 0 || i >= plan.length - 1) return 0; return plan[i] + (plan[i + 1] - plan[i]) * (u - i); };
let level = 0;                                  // the tank's still level, measured below
const sample = (h, x, y) => {                   // bilinear in the tank's columns, 8 cells clear of its walls; NaN by her hull
  const [a, b] = cellOf(x, y), a0 = Math.floor(a), b0 = Math.floor(b), fa = a - a0, fb = b - b0;
  if (a0 < 8 || b0 < 8 || a0 > Nx - 10 || b0 > Ny - 10) return NaN;
  const v = (i, j) => h[(b0 + j) * Nx + a0 + i];
  return v(0, 0) * (1 - fa) * (1 - fb) + v(1, 0) * fa * (1 - fb) + v(0, 1) * (1 - fa) * fb + v(1, 1) * fa * fb - level;
};
const tank = (x, y) => sample(hT, x, y);

// the field: her wake at the tank's speed and drift, steady, her track north
const W = WF.createWake(); WF.work(W, 0);
const m = M.create({ knots: U / KN }), dt = 0.25;
let t = 0, X = 0;
while (t < 150 - 1e-9) {
  M.stepAlone(m, dt); t += dt; X += U * dt;   // her plant for its thrust only (the white water); her motion is the tank's
  WF.push(W, { t, X, Y: 0, psi: beta, u: U * cb, v: -U * sb, r: 0, TP: m.TP, TS: m.TS, TC: m.TC, nP: m.nP, nS: m.nS, nC: m.nC, del: 0 });
  WF.work(W, 0);
}
WF.refresh(W);
const s = W.shown, cp = Math.cos(s.psi), sp = Math.sin(s.psi);
const field = (x, y) => { const y0 = WF.fieldY(hull, x, y), Xw = s.X + x * cp - y0 * sp, Yw = s.Y + x * sp + y0 * cp; return WF.at(W.near, W.hNear, Xw, Yw) + WF.at(W.far, W.hFar, Xw, Yw); };

say(`tank_compare: ${file} of ${path.basename(path.resolve(dir))}`);
say(`the tank: ${Nx} x ${Ny} x ${meta.Nz} cells of ${dx} m; her speed ${f(U / KN, 2)} kn, her drift ${f(meta.drift_deg || 0, 1)} deg; ${meta.steps} steps of ${meta.dt_s} s`);
say(`the field: her wake steady at ${f(U / KN, 2)} kn, her heading ${f(beta * 180 / Math.PI, 1)} deg to starboard of her track (a sway of ${f(U * sb, 2)} m/s to port), 150 s after the library's lead-in; heights scaled to Holtrop's wave resistance (scale ${f(WF.scale(s.u), 4)})`);
// 0. the frame, the still level, the steadiness
{
  let nT = 0, nP = 0, nB = 0;
  for (let b = 1; b < Ny - 1; b++) for (let a = 1; a < Nx - 1; a++) { const [x, y] = herOf(a, b), p = Math.abs(y) < planAt(x), q = !isFinite(hT[b * Nx + a]); if (p) nP++; if (q) nT++; if (p && q) nB++; }
  const v = [], w = [], med = (z) => { z.sort((p, q) => p - q); return z.length ? z[z.length >> 1] : 0; };
  for (let a = -100; a <= -40; a += dx) for (let c = -0.25 * Nx * dx; c <= 0.25 * Nx * dx; c += dx) { const p = stemAt(a, c), q = tank(p[0], p[1]); if (isFinite(q)) { v.push(q); w.push(field(p[0], p[1])); } }
  const ahead = med(v), rise = med(w); level = ahead - rise;   // her bow's own rise ahead of her, as the field has it, is no offset
  let st = '';
  if (before) {
    const hB = load(before); let sd = 0, sh = 0;
    for (let b = 8; b < Ny - 8; b++) for (let a = 8; a < Nx - 8; a++) { const p = hT[b * Nx + a], q = hB[b * Nx + a]; if (isFinite(p) && isFinite(q)) { sd += (p - q) * (p - q); sh += (p - level) * (p - level); } }
    st = `; from ${before} to ${file} the surface moved by ${f(Math.sqrt(sd / sh), 2)} of its own rms`;
  }
  say(`0. the frame: her hull stands in ${nT} columns of the tank, her plan where this mapping puts it covers ${nP}, both ${nB} (overlap ${f(nB / (nT + nP - nB), 3)}); 40 to 100 m ahead of her stem the tank stands ${f(ahead, 3)} m, the field ${f(rise, 3)} m: ${f(level, 3)} m taken off the tank below${st}`);
}
// 1. the sea against her plating
{
  const side = (sg) => { const out = []; for (let x = hull.x0 + 2; x < hull.xStem; x += dx) { let y = Math.max(WF.waterline(hull, x), planAt(x)) + 0.6 * dx, v = NaN; for (let k = 0; k < 8 && !isFinite(v); k++, y += 0.5 * dx) v = tank(x, sg * y); out.push([x, v, sg * y]); } return out; };
  const al = WF.alongside(W, 512), alAt = (x, sg) => { const i = Math.max(0, Math.min(511, Math.floor((x - hull.x0) / (hull.x1 - hull.x0) * 512))); return al[2 * i + (sg > 0 ? 1 : 0)]; };
  for (const [name, sg] of [['port', -1], ['starboard', 1]]) {
    const P = side(sg); let top = null, low = null;
    for (const p of P) { if (!isFinite(p[1])) continue; if (!top || p[1] > top[1]) top = p; if (!low || p[1] < low[1]) low = p; }
    const pairs = P.filter(p => isFinite(p[1])).map(p => [p[1], alAt(p[0], sg), field(p[0], p[2])]);
    const rms = (k) => Math.sqrt(pairs.reduce((a, q) => a + q[k] * q[k], 0) / pairs.length), cor = (k) => { const n = pairs.length, ma = pairs.reduce((a, q) => a + q[0], 0) / n, mb = pairs.reduce((a, q) => a + q[k], 0) / n; let sab = 0, saa = 0, sbb = 0; for (const q of pairs) { sab += (q[0] - ma) * (q[k] - mb); saa += (q[0] - ma) ** 2; sbb += (q[k] - mb) ** 2; } return sab / Math.sqrt(saa * sbb); };
    say(`1. against her plating, ${name}: the tank's highest ${f(top && top[1], 2)} m at ${f(top && hull.xStem - top[0])} m abaft her stem, lowest ${f(low && low[1], 2)} m at ${f(low && hull.xStem - low[0])} m; rms ${f(rms(0), 3)} m. The library's alongside: rms ${f(rms(1), 3)} m, correlation ${f(cor(1), 2)}; the field there: rms ${f(rms(2), 3)} m, correlation ${f(cor(2), 2)}`);
  }
}
// 2. wave cuts 1.5 beams off her centre line
for (const [name, sg] of [['port', -1], ['starboard', 1]]) {
  const yc = sg * 1.5 * C.G.B, pts = [];
  for (let x = hull.xStem; x > hull.xStem - 900; x -= dx) { const a = tank(x, yc); if (isFinite(a)) pts.push([x, a, field(x, yc)]); }
  const rms = (k) => Math.sqrt(pts.reduce((a, q) => a + q[k] * q[k], 0) / pts.length), span = (k) => Math.max(...pts.map(q => q[k])) - Math.min(...pts.map(q => q[k]));
  const n = pts.length, ma = pts.reduce((a, q) => a + q[1], 0) / n, mb = pts.reduce((a, q) => a + q[2], 0) / n; let sab = 0, saa = 0, sbb = 0;
  for (const q of pts) { sab += (q[1] - ma) * (q[2] - mb); saa += (q[1] - ma) ** 2; sbb += (q[2] - mb) ** 2; }
  say(`2. a wave cut ${f(Math.abs(yc))} m to ${name} of her centre line, ${f(n * dx)} m of it in the tank from her stem aft: the tank rms ${f(rms(1), 3)} m (crest to trough at most ${f(span(1), 2)} m); the field rms ${f(rms(2), 3)} m (${f(span(2), 2)} m); the field over the tank ${f(rms(2) / rms(1), 2)}, correlation ${f(sab / Math.sqrt(saa * sbb), 2)}`);
}
// 3. the transverse waves down the stream from her amidships
{
  const ups = (fn) => { const xs = []; let prev = null; const d0 = -hull.x0 + 40; for (let d = d0; d <= d0 + 300; d += 0.25) { const v = fn(d * down[0], d * down[1]); if (prev !== null && isFinite(v) && isFinite(prev) && prev < 0 && v >= 0) xs.push(d); prev = v; } return xs; };
  const gap = (xs) => (xs.length > 1 ? (xs[xs.length - 1] - xs[0]) / (xs.length - 1) : NaN), a = ups(tank), b = ups(field);
  say(`3. the transverse waves down the stream from her amidships, 40 to 340 m astern of her stern: the tank's ${a.length} up-crossings ${f(gap(a), 1)} m apart, the field's ${b.length} ${f(gap(b), 1)} m apart; 2 pi U^2 / g = ${f(2 * Math.PI * U * U / 9.81, 1)} m`);
}
// 4. the wedge on each side
{
  const aS = cellOf(hull.xStem, 0)[0], lim = [(aS - 10) * dx, (Nx - 11 - aS) * dx];   // to the tank's -x and +x walls, 10 cells short
  for (const d of [300, 450]) {
    const reach = (fn, sg, cMax) => {
      const amp = (c) => { let lo = Infinity, hi = -Infinity; for (let k = -20; k <= 20; k++) { const p = stemAt(d + k, sg * c), v = fn(p[0], p[1]); if (isFinite(v)) { if (v < lo) lo = v; if (v > hi) hi = v; } } return hi - lo; };
      let best = 0; for (let c = 20; c < cMax; c += 2) best = Math.max(best, amp(c));
      if (!(best > 0)) return NaN;
      for (let c = cMax; c > 20; c -= 2) if (amp(c) >= 0.25 * best) return c;
      return 20;
    };
    const r = [reach(tank, -1, lim[0]), reach(tank, 1, lim[1]), reach(field, -1, lim[0]), reach(field, 1, lim[1])], deg = (c) => f(Math.atan(c / d) * 180 / Math.PI, 1);
    say(`4. ${d} m down the stream from her stem: the tank's waves reach ${f(r[0])} m to port and ${f(r[1])} m to starboard (${deg(r[0])} and ${deg(r[1])} deg from her stem); the field's ${f(r[2])} and ${f(r[3])} m (${deg(r[2])} and ${deg(r[3])} deg); Kelvin's wedge 19.47 deg`);
  }
}
// the picture
if (png) {
  const k = Math.max(1, Math.ceil(Math.max(2 * Nx + 4, Ny) / 1400)), w0 = Math.floor(Nx / k), gap = 4, w = 2 * w0 + gap, hgt = Math.floor(Ny / k), line = w * 3 + 1, rows = Buffer.alloc(hgt * line);
  const put = (r, c, v) => { const o = r * line + 1 + c * 3; if (!isFinite(v)) { rows[o] = rows[o + 1] = rows[o + 2] = 0; return; } const q = Math.max(-1, Math.min(1, v / 1.5)); rows[o] = Math.round(30 + 100 * (1 + q)); rows[o + 1] = Math.round(50 + 95 * (1 + q)); rows[o + 2] = Math.round(80 + 85 * (1 + q)); };
  for (let r = 0; r < hgt; r++) {
    const b = r * k + (k >> 1);
    for (let c = 0; c < w0; c++) { const a = c * k + (k >> 1), [x, y] = herOf(a, b); put(r, c, hT[b * Nx + a] - level); put(r, w0 + gap + c, Math.abs(y) < planAt(x) ? NaN : field(x, y)); }
    for (let c = w0; c < w0 + gap; c++) { const o = r * line + 1 + c * 3; rows[o] = rows[o + 1] = rows[o + 2] = 255; }
  }
  const CRC = new Int32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; CRC[n] = c; }
  const crc = (buf) => { let c = -1; for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
  const chunk = (type, data) => { const len = Buffer.alloc(4), cs = Buffer.alloc(4), td = Buffer.concat([Buffer.from(type), data]); len.writeUInt32BE(data.length); cs.writeUInt32BE(crc(td)); return Buffer.concat([len, td, cs]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(hgt, 4); ihdr[8] = 8; ihdr[9] = 2;
  fs.writeFileSync(png, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(rows, { level: 9 })), chunk('IEND', Buffer.alloc(0))]));
  say(`the picture: ${path.basename(png)}, ${w} x ${hgt} pixels (the tank left, the field right, on the tank's grid; her stem up; a pixel ${f(k * dx, 2)} m; -1.5 m dark to +1.5 m light; her hull black)`);
}
if (txt) fs.writeFileSync(txt, lines.join('\n') + '\n');
