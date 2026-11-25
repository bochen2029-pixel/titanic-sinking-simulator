// U1's CPU half, checked (docs/BRAINSTORM_titanic_in_unreal_v1_2026-11-20.md, section 7 and its check 4.5): the hull and the
// topsides built in Blender (tools/blender/build_ship.py) from tools/export_ship.js's titanic_ship.json, against that
// export and against the web viewer's own geometry. Headless and CPU only: Blender in background mode, no render.
//   node tools/blender_tests.js        (about half a minute)   BLENDER=<blender.exe> to use another Blender
// MUST rows: two runs give the same GLB and the same list of its objects; the hull's section at every station of the
// export, her half-breadth at every height of its grid on both sides, read off the GLB's own triangles; at every station
// her bottom where the export puts it and the top of her side where the tiers put it; her length overall; her volume off
// the GLB, the drawn shell's and the model's own hull with her ends (G24); the parts where the export puts them (the
// funnels' tops, the masts' tops, the crow's nest, the houses' roofs, the domes' crowns, the twenty boats). CHECK rows
// print what is worth seeing: her profile against the web viewer's own faces (TS.built()), metre by metre, where what
// this build leaves out shows. Nothing is written: the runs go to a temporary folder, deleted after.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');
const C = require('../core/core.js');
const TS = require('../site/topsides.js');
const XS = require('./export_ship.js');

const root = path.join(__dirname, '..');
const BLENDER = process.env.BLENDER || 'C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender.exe';
const SCRIPT = path.join(root, 'tools', 'blender', 'build_ship.py');
const rows = []; let fails = 0, checks = 0;
function row(kind, what, value, ref, ok) { rows.push([kind, what, value, ref, ok]); if (!ok) { if (kind === 'MUST') fails++; else checks++; } }
const f = (x, n) => (x === null || x === undefined || Number.isNaN(x) ? 'n/a' : (+x).toFixed(n === undefined ? 2 : n));
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');

function run(cmd, args, env) {
  return new Promise((resolve) => {
    const p = spawn(cmd, args, { cwd: root, env: Object.assign({}, process.env, env || {}), stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '', err = '';
    p.stdout.on('data', (d) => { out += d; }); p.stderr.on('data', (d) => { err += d; });
    p.on('error', (e) => { err += String(e); });
    p.on('close', (code) => resolve({ code, out, err }));
  });
}

// ------------------------------------------------------------------ the GLB, read here (not by Blender)
function readGLB(buf) {
  if (buf.readUInt32LE(0) !== 0x46546C67 || buf.readUInt32LE(4) !== 2) throw new Error('not a glTF 2 binary');
  let off = 12, json = null, bin = null;
  while (off < buf.readUInt32LE(8)) {
    const len = buf.readUInt32LE(off), type = buf.readUInt32LE(off + 4), data = buf.subarray(off + 8, off + 8 + len);
    if (type === 0x4E4F534A) json = JSON.parse(data.toString('utf8')); else if (type === 0x004E4942) bin = data;
    off += 8 + len;
  }
  return { json, bin };
}
function accessor(g, i) {
  const a = g.json.accessors[i], bv = g.json.bufferViews[a.bufferView], n = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[a.type];
  const size = { 5126: 4, 5125: 4, 5123: 2, 5121: 1 }[a.componentType];
  const rd = { 5126: (o) => g.bin.readFloatLE(o), 5125: (o) => g.bin.readUInt32LE(o), 5123: (o) => g.bin.readUInt16LE(o), 5121: (o) => g.bin.readUInt8(o) }[a.componentType];
  const start = (bv.byteOffset || 0) + (a.byteOffset || 0), stride = bv.byteStride || n * size, out = new Float64Array(a.count * n);
  for (let k = 0; k < a.count; k++) for (let c = 0; c < n; c++) out[k * n + c] = rd(start + k * stride + c * size);
  return out;
}
// every node's triangles in the ship frame: glTF is +Y up, (X, Y, Z) = (x, z, -y) of the ship
function partsOf(g) {
  const parts = new Map();
  for (const nd of g.json.nodes || []) {
    if (nd.mesh === undefined) continue;
    const T = nd.translation || [0, 0, 0], Q = nd.rotation || [0, 0, 0, 1], Sc = nd.scale || [1, 1, 1];
    const rot = (v) => {                                   // q v q*, q = [x, y, z, w]
      const [qx, qy, qz, qw] = Q, [vx, vy, vz] = v;
      const tx = 2 * (qy * vz - qz * vy), ty = 2 * (qz * vx - qx * vz), tz = 2 * (qx * vy - qy * vx);
      return [vx + qw * tx + (qy * tz - qz * ty), vy + qw * ty + (qz * tx - qx * tz), vz + qw * tz + (qx * ty - qy * tx)];
    };
    const tris = [];
    for (const pr of g.json.meshes[nd.mesh].primitives) {
      if ((pr.mode === undefined ? 4 : pr.mode) !== 4) continue;
      const P = accessor(g, pr.attributes.POSITION), I = pr.indices === undefined ? null : accessor(g, pr.indices), nI = I ? I.length : P.length / 3;
      for (let k = 0; k < nI; k++) {
        const v = I ? I[k] : k, w = rot([P[v * 3] * Sc[0], P[v * 3 + 1] * Sc[1], P[v * 3 + 2] * Sc[2]]);
        tris.push(w[0] + T[0], -(w[2] + T[2]), w[1] + T[1]);
      }
    }
    parts.set(nd.name, Float64Array.from(tris));
  }
  return parts;
}
const maxZ = (tr) => { let m = -1e9; for (let i = 2; i < tr.length; i += 3) if (tr[i] > m) m = tr[i]; return m; };

// the section of a set of triangles by the plane x = x0: its segments, [ya, za, yb, zb] each
function section(tris, buckets, x0) {
  const segs = [], seen = new Set();
  for (const b of [Math.floor(x0) - 1, Math.floor(x0), Math.floor(x0) + 1]) for (const t of buckets.get(b) || []) {
    if (seen.has(t)) continue; seen.add(t);
    const o = t * 9, pts = [];
    for (let k = 0; k < 3; k++) {
      const a = o + 3 * k, c = o + 3 * ((k + 1) % 3), da = tris[a] - x0, dc = tris[c] - x0;
      if (da === 0) pts.push(tris[a + 1], tris[a + 2]);
      if ((da < 0 && dc > 0) || (da > 0 && dc < 0)) { const u = da / (da - dc); pts.push(tris[a + 1] + u * (tris[c + 1] - tris[a + 1]), tris[a + 2] + u * (tris[c + 2] - tris[a + 2])); }
    }
    if (pts.length === 4) segs.push(pts);
  }
  return segs;
}
function bucketsOf(tris) {
  const B = new Map();
  for (let t = 0; t < tris.length / 9; t++) {
    const xs = [tris[t * 9], tris[t * 9 + 3], tris[t * 9 + 6]], lo = Math.floor(Math.min(...xs)), hi = Math.floor(Math.max(...xs));
    for (let b = lo; b <= hi; b++) { if (!B.has(b)) B.set(b, []); B.get(b).push(t); }
  }
  return B;
}
// the side profile's top of triangles between x0 and x1: each triangle seen from the side, clipped to the slab
function profileTop(tris, x0, x1) {
  let m = -1e9;
  for (let t = 0; t < tris.length; t += 9) {
    let poly = [[tris[t], tris[t + 2]], [tris[t + 3], tris[t + 5]], [tris[t + 6], tris[t + 8]]];
    for (const [lim, keep] of [[x0, (p) => p[0] >= x0], [x1, (p) => p[0] <= x1]]) {
      const out = [];
      for (let i = 0; i < poly.length; i++) {
        const a = poly[i], b = poly[(i + 1) % poly.length], ka = keep(a), kb = keep(b);
        if (ka) out.push(a);
        if (ka !== kb) { const u = (lim - a[0]) / (b[0] - a[0]); out.push([lim, a[1] + u * (b[1] - a[1])]); }
      }
      poly = out; if (!poly.length) break;
    }
    for (const p of poly) if (p[1] > m) m = p[1];
  }
  return m;
}

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'titanic-u1-'));
  try {
    if (!fs.existsSync(BLENDER)) throw new Error('no Blender at ' + BLENDER + ' (set BLENDER)');
    // ================================================================ 1. the export, then Blender twice, each its own process
    const ex = await run(process.execPath, ['tools/export_ship.js'], { TITANIC_OUT: tmp });
    if (ex.code !== 0) throw new Error('the export failed: ' + ex.err.trim().split('\n').pop());
    const shipFile = path.join(tmp, XS.NAME), outs = [path.join(tmp, 'a'), path.join(tmp, 'b')];
    const bl = await Promise.all(outs.map(o => run(BLENDER, ['-b', '--factory-startup', '--python-exit-code', '1', '--python', SCRIPT, '--', '--ship', shipFile, '--out', o])));
    for (const r of bl) if (r.code !== 0 || !/GEN_OK titanic_ship/.test(r.out)) throw new Error('Blender failed (exit ' + r.code + '): ' + (r.err.trim() || r.out.trim()).split('\n').slice(-3).join(' | '));
    const glbA = fs.readFileSync(path.join(outs[0], 'titanic_ship.glb')), glbB = fs.readFileSync(path.join(outs[1], 'titanic_ship.glb'));
    const infA = fs.readFileSync(path.join(outs[0], 'titanic_ship.glb.json')), infB = fs.readFileSync(path.join(outs[1], 'titanic_ship.glb.json'));
    row('MUST', 'titanic_ship.glb: two runs of Blender, the same bytes; and the same list of what is in it', glbA.equals(glbB) && infA.equals(infB) ? 'the same bytes' : 'THEY DIFFER', 'the same bytes', glbA.equals(glbB) && infA.equals(infB));

    // ================================================================ 2. the hull against the export, station by station
    const ship = JSON.parse(fs.readFileSync(shipFile, 'utf8')), H = ship.hull, ST = H.stations, DR = H.drawn, N = ship.topsides.N, G = H.particulars;
    const parts = partsOf(readGLB(glbA)), hull = parts.get('hull');
    if (!hull) throw new Error('no hull in the GLB');
    const B = bucketsOf(hull), Z = ST.z;
    // the drawn shell at every station (hull.drawn since G24: the shell the web viewer draws and the drawn ship stands on)
    const stations = [];
    DR.x.forEach((x, i) => { if (DR.bottom[i] !== null) stations.push({ x, hb: DR.halfBreadth[i], bottom: DR.bottom[i], top: DR.top[i] }); });
    // the top of her side, the rule the build states: the Boat deck in way of the promenade's screen, A deck over B deck's superstructure
    const xB0 = G.wellAft[1] + N.bDeck.notch, xWF = G.wellFwd[0];
    const shellTop = (x, top) => (x >= N.screen.x0 && x <= N.boatDeck.xFront ? C.deckZ('Boat', x) : (x >= xB0 && x <= xWF ? C.deckZ('A', x) : top));
    let eHB = 0, wHB = null, nHB = 0, eBot = 0, wBot = null, eTop = 0, wTop = null;
    for (const s of stations) {
      const segs = section(hull, B, s.x);
      let zlo = 1e9, zhi = -1e9;
      for (const g of segs) { zlo = Math.min(zlo, g[1], g[3]); zhi = Math.max(zhi, g[1], g[3]); }
      Z.forEach((z, j) => {
        if (!(z > s.bottom + 1e-6 && z < s.top - 1e-6)) return;
        let yP = -1e9, yS = 1e9;
        for (const g of segs) {
          const [ya, za, yb, zb] = g;
          if ((z - za) * (z - zb) > 0) continue;
          const y = za === zb ? null : ya + (yb - ya) * (z - za) / (zb - za);
          for (const v of y === null ? [ya, yb] : [y]) { if (v > yP) yP = v; if (v < yS) yS = v; }
        }
        const e = Math.max(Math.abs(yP - s.hb[j]), Math.abs(-yS - s.hb[j]));
        nHB++;
        if (e > eHB) { eHB = e; wHB = 'x ' + f(s.x, 3) + ', z ' + f(z, 2); }
      });
      const eb = Math.abs(zlo - s.bottom), et = Math.abs(zhi - shellTop(s.x, s.top));
      if (eb > eBot) { eBot = eb; wBot = f(s.x, 3); }
      if (et > eTop) { eTop = et; wTop = f(s.x, 3); }
    }
    row('MUST', 'her section at every station of the export: the half-breadth at every height of its grid, port and starboard, read off the GLB\'s triangles', f(eHB * 1000, 2) + ' mm off at worst (' + (wHB || '-') + '), ' + nHB + ' heights at ' + stations.length + ' stations', '<= 1 mm', eHB <= 1e-3 && nHB > 20000);
    row('MUST', 'her profile at every station: her bottom where the export puts it (the viewer\'s rule), the top of her side where her deck or tier stands', 'bottom ' + f(eBot * 1000, 2) + ' mm off at worst (x ' + (wBot || '-') + '); top ' + f(eTop * 1000, 2) + ' mm (x ' + (wTop || '-') + ')', '<= 1 mm', eBot <= 1e-3 && eTop <= 1e-3);
    let xmin = 1e9, xmax = -1e9;
    for (let i = 0; i < hull.length; i += 3) { if (hull[i] < xmin) xmin = hull[i]; if (hull[i] > xmax) xmax = hull[i]; }
    // the stem's head: where her stem (hull.stations.stem) stands at the top of her foremost station's side
    const xLast = stations.reduce((m, s) => Math.max(m, s.x), -1e9), head = C.xFwd(C.zTopAt(xLast));
    row('MUST', 'her ends: the round stern\'s end and the stem\'s head at the top of her side (her length overall the export\'s, ' + f(G.LOA, 2) + ' m, within her sheer)', 'x ' + f(xmin, 3) + ' to ' + f(xmax, 3) + ': ' + f(xmax - xmin, 3) + ' m', 'x ' + f(DR.xEnd, 3) + ' to ' + f(head, 3), Math.abs(xmin - DR.xEnd) <= 1e-3 && Math.abs(xmax - head) <= 1e-3 && Math.abs(xmax - xmin - G.LOA) <= 0.01);

    // ---- G24: her volume. The hull read off the GLB's own triangles (a closed solid: her bottom, her sides, the lid at the
    // top of her side, her two ends) against the same section integrated to the same tops (shellTop, the build's rule)
    // from the functions themselves: the drawn shell (TS.hullDraw, the page's), which the build draws; and the model's own
    // hull with her ends (C.halfBreadth with ship.hull, as the flooding integrates it), and without them. Since both
    // halves of G24 the drawn shell stands on the model's hull: forward of x0 it is the model's own, and aft of it the
    // deck plan's round stern over her counter [appearance], whose difference is printed as the residual
    {
      const vol = (t) => { let v = 0; for (let o = 0; o + 9 <= t.length; o += 9) v += t[o] * (t[o + 4] * t[o + 8] - t[o + 5] * t[o + 7]) - t[o + 1] * (t[o + 3] * t[o + 8] - t[o + 5] * t[o + 6]) + t[o + 2] * (t[o + 3] * t[o + 7] - t[o + 4] * t[o + 6]); return Math.abs(v) / 6; };
      const Vg = vol(hull), HULL = C.buildShip().hull, x0 = DR.x0;
      // each column x (the middle of a 0.25 m cell) to its own top in equal steps of at most 0.05 m, midpoint rule
      const integ = (fn, xa, xb) => { let v = 0; const dx = 0.25; for (let x = xa + dx / 2; x < xb; x += dx) { const zt = shellTop(x, C.zTopAt(x)), n = Math.max(1, Math.ceil(zt / 0.05)), h = zt / n; let a = 0; for (let k = 0; k < n; k++) a += Math.max(0, fn(x, (k + 0.5) * h)); v += 2 * a * h * dx; } return v; };
      const XA = -150, XB = 145, ends = (x, z) => C.halfBreadth(x, z, HULL), none = (x, z) => C.halfBreadth(x, z);
      const VdF = integ(TS.hullDraw, x0, XB), VdA = integ(TS.hullDraw, XA, x0), VeF = integ(ends, x0, XB), VeA = integ(ends, XA, x0), VnF = integ(none, x0, XB), VnA = integ(none, XA, x0);
      const Vd = VdF + VdA, Ve = VeF + VeA, Vn = VnF + VnA;
      row('MUST', 'her volume (G24): the hull read off the GLB\'s own triangles, the drawn shell\'s (TS.hullDraw, which the build draws at every station) to the tops of her side',
        f(Vg, 0) + ' m3 off the GLB, ' + f(Vd, 0) + ' m3 by the function: ' + f(100 * (Vg - Vd) / Vd, 3) + ' %', 'within 0.5 % (1 m stations, a 0.25 m grid)', Math.abs(Vg - Vd) <= 0.005 * Vd);
      row('MUST', '  ... and the model\'s own hull with her ends (ship.hull, the flooding\'s): the residual is aft of x0, the drawn round stern over her counter (wider) and her counter left open under its knuckle (T1, narrower) [appearance]; forward of it none',
        'the model\'s ' + f(Ve, 0) + ' m3 (without her ends ' + f(Vn, 0) + ': they add ' + f(VeF - VnF, 0) + ' forward of x ' + f(x0, 0) + ' and ' + f(VeA - VnA, 0) + ' aft); the GLB ' + f(Vg - Ve, 0) + ' m3 (' + f(100 * (Vg - Ve) / Ve, 2) + ' %): the drawn shell forward of x ' + f(x0, 0) + ' ' + f(VdF - VeF, 1) + ' m3 off the model\'s, aft of it the round stern ' + f(VdA - VeA, 0),
        'within 0.5 %; forward within 1 m3', Math.abs(Vg - Ve) <= 0.005 * Ve && Math.abs(VdF - VeF) <= 1);
    }

    // ================================================================ 3. the parts where the export puts them
    {
      const D = ship.topsides.derived, bad = [];
      for (const g of D.funnels) { const t = parts.get('funnel ' + g.id + ' black'); if (!t || Math.abs(maxZ(t) - g.zTopFwd) > 2e-3) bad.push('funnel ' + g.id + ' top ' + f(t ? maxZ(t) : NaN, 3) + ' (the export ' + f(g.zTopFwd, 3) + ')'); }
      // the forward pipes' mouths, where the steam leaves (derived.steam): the tube's rim, square to the raked axis, rises
      // its radius times the sine of the rake over the mouth's centre
      D.funnels.filter(g => g.smoke).forEach((g, i) => {
        const t = parts.get('funnel ' + g.id + ' forward pipe top'), st = D.steam[i], want = st.z + N.pipes.dF / 2 * Math.sin(N.funnel.rake);
        if (!t || Math.abs(maxZ(t) - want) > 2e-3) bad.push('funnel ' + g.id + '\'s steam pipe mouth ' + f(t ? maxZ(t) : NaN, 3) + ' (the export ' + f(want, 3) + ')');
      });
      for (const m of D.masts) { const t = parts.get(m.id + 'mast above the hounds'); if (!t || Math.abs(maxZ(t) - m.top[2]) > 0.05) bad.push(m.id + 'mast top ' + f(t ? maxZ(t) : NaN, 3) + ' (the export ' + f(m.top[2], 3) + ')'); }
      { const t = parts.get('crow\'s nest'); if (!t || Math.abs(maxZ(t) - D.nest.rim) > 2e-3) bad.push('the nest\'s rim'); }
      for (const d of D.domes) { const t = parts.get(d.id); if (!t || Math.abs(maxZ(t) - d.crown) > 2e-3) bad.push(d.id + ' crown'); }
      for (const hs of N.houses) { const [x0, x1] = hs.secs[0], want = Math.max(C.deckZ('Boat', x0), C.deckZ('Boat', x1)) + hs.h + 0.06, t = parts.get(hs.id + ' roof'); if (!t || Math.abs(maxZ(t) - want) > 2e-3) bad.push(hs.id + ' roof ' + f(t ? maxZ(t) : NaN, 3) + ' (' + f(want, 3) + ')'); }
      // the markers (U2 measures Unreal's axis mapping by them): each tetrahedron's centroid at its point of the ship frame
      for (const m of JSON.parse(infA.toString('utf8')).markers || []) {
        const t = parts.get(m.name); if (!t) { bad.push(m.name + ' missing'); continue; }
        const c = [0, 0, 0], nv = t.length / 3; for (let v = 0; v < nv; v++) for (let q = 0; q < 3; q++) c[q] += t[v * 3 + q] / nv;
        if (Math.max(...c.map((v, q) => Math.abs(v - m.at[q]))) > 1e-3) bad.push(m.name + ' at ' + c.map(v => f(v, 3)).join(', '));
      }
      const boats = [...parts.keys()].filter(k => k.startsWith('boat ')).length;
      if (boats !== ship.boats.stowed.length) bad.push(boats + ' boats of ' + ship.boats.stowed.length);
      row('MUST', 'the parts where the export puts them: 4 funnels\' tops, 3 steam pipes\' mouths, 2 masts\' tops, the crow\'s nest, ' + D.domes.length + ' domes, ' + N.houses.length + ' houses\' roofs, ' + ship.boats.stowed.length + ' boats; and the 4 markers U2 measures Unreal\'s axes by', bad.length ? bad.join('; ') : 'all where the export puts them', 'all', bad.length === 0);
    }

    // ================================================================ 4. her profile against the web viewer's own faces
    {
      const Bt = TS.built(), view = [];
      for (const k of Object.keys(Bt.faces).concat(['glass'])) {
        const m = k === 'glass' ? Bt.glass : Bt.faces[k];
        for (let t = 0; t < m.idx.length; t++) { const v = m.idx[t]; view.push(m.pos[v * 3], m.pos[v * 3 + 1], m.pos[v * 3 + 2]); }
      }
      const vt = Float64Array.from(view), all = [];
      for (const [, t] of parts) for (const v of t) all.push(v);
      const bt = Float64Array.from(all), diffs = [];
      let within = 0, n = 0;
      for (let x = -138; x < 130; x += 1) {
        const zv = Math.max(profileTop(vt, x, x + 1), C.zTopAt(x + 0.5)), zb = profileTop(bt, x, x + 1);
        n++; if (Math.abs(zb - zv) <= 0.1) within++;
        diffs.push([Math.abs(zb - zv), x, zb - zv]);
      }
      diffs.sort((a, b) => b[0] - a[0] || a[1] - b[1]);
      row('CHECK', 'her profile against the web viewer\'s own faces (TS.built()), metre by metre: the top of everything seen from her side', within + ' of ' + n + ' metres within 0.1 m; the most apart: ' + diffs.slice(0, 6).map(d => 'x ' + d[1] + ' ' + (d[2] > 0 ? '+' : '') + f(d[2], 2)).join(', '), 'what this build leaves out: the cranes and the anchor crane, the compass, whistles, telegraphs, capstans, rails', true);
    }

    // ================================================================ what was built
    const inf = JSON.parse(infA.toString('utf8'));
    rows.push(['INFO', 'titanic_ship.glb: ' + inf.objects.length + ' objects, from ' + inf.blender, glbA.length + ' bytes', 'sha256 ' + sha(glbA), true]);
  } catch (e) {
    row('MUST', 'the suite ran', String(e && e.message || e), 'no error', false);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  for (const [kind, what, value, ref, ok] of rows) {
    if (kind === 'INFO') { console.log('       ' + what.padEnd(100) + ' ' + String(value).padEnd(60) + ' ' + ref); continue; }
    console.log((ok ? 'PASS ' : (kind === 'MUST' ? 'FAIL ' : 'CHECK ')) + kind.padEnd(6) + what.padEnd(100) + ' ' + String(value).padEnd(60) + ' ' + ref);
  }
  const musts = rows.filter(r => r[0] === 'MUST').length;
  console.log(fails ? '\nFAIL: ' + fails + ' MUST row(s)' + (checks ? ', ' + checks + ' CHECK row(s) off' : '') : '\nPASS: all ' + musts + ' MUST rows' + (checks ? '; ' + checks + ' CHECK row(s) off' : ''));
  process.exit(fails ? 1 : 0);
})();
