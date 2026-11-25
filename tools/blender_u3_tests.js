// U3's stills, checked (tools/blender/u3_scene.py): what U3 adds to her scene at three times after the touch, built in
// headless Blender from the recorded night and the timelines made from it, read back off the GLB itself. CPU only: no
// render. The times (30, 90 and 150 minutes after the touch) are where it looks, not results: every number it checks
// against is the record's or the timelines', made here from the model, so a moved night moves both sides alike.
//   node tools/blender_u3_tests.js     (about a minute)   BLENDER=<blender.exe> to use another Blender
// MUST rows: two runs of Blender give the same GLB and the same list of what is in it; each time is drawn at the record's
// step for it; the spaces drawn wet are exactly the ones the core's cut of the record's level wets (core.js nodePass, as
// tools/u3_water_tests.js has it; the level that holds the step's water, the next sample's: the record's water.about);
// each one's water, read off the GLB's own triangles, times its permeability is that cut's to the file's 32-bit floats,
// and the record's volume within the core's level tolerance; every column's water stands at that level over its centre at
// the record's pose, or at the column's top; the pockets drawn are exactly those the record gives water of their own,
// each the prism of its own area that the core's law places, holding min(vol, cap), at its place; the lights drawn lit
// are u3_lights.json's at the step (version 2: until their section's fuses blow, G1), each at its own point; the steam
// and the smoke are drawn exactly when u3_smoke.json and
// the record's plant say, at their sources, rising along the world's vertical; her scene posed with her hull builds.
// Nothing is written: the runs go to a temporary folder, deleted after.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const G = require('./glb_read');

const root = path.join(__dirname, '..');
const BLENDER = process.env.BLENDER || 'C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender.exe';
const SCENE = path.join(root, 'tools', 'blender', 'u3_scene.py'), BUILD = path.join(root, 'tools', 'blender', 'build_ship.py');
const TIMES = [30, 90, 150];
const rows = []; let fails = 0;
function row(kind, what, value, ref, ok) { rows.push([kind, what, value, ref, ok]); if (!ok && kind === 'MUST') fails++; }
const f = (x, n) => (x === null || x === undefined || Number.isNaN(x) ? 'n/a' : (+x).toFixed(n === undefined ? 2 : n));
function run(cmd, args, env) {
  return new Promise((resolve) => {
    const p = spawn(cmd, args, { cwd: root, env: Object.assign({}, process.env, env || {}), stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '', err = '';
    p.stdout.on('data', (d) => { out += d; }); p.stderr.on('data', (d) => { err += d; });
    p.on('error', (e) => { err += String(e); });
    p.on('close', (code) => resolve({ code, out, err }));
  });
}
const tail = (r) => (r.err.trim() || r.out.trim()).split('\n').slice(-3).join(' | ');
// a value of a recorded span ({from, every, v}) at the record's index i, or null (as the script reads it)
const at = (sp, i) => { if (!sp) return null; const d = i - sp.from; if (d < 0 || d % sp.every) return null; const j = d / sp.every; return j < sp.v.length ? sp.v[j] : null; };
// each point of `got` matched to its own point of `want` within tol (1 m cells): what is left over on either side
function match(got, want, tol) {
  const cell = (p) => Math.floor(p[0]) + ',' + Math.floor(p[1]) + ',' + Math.floor(p[2]), grid = new Map(), used = new Set();
  want.forEach((p, j) => { const c = cell(p); if (!grid.has(c)) grid.set(c, []); grid.get(c).push(j); });
  let extra = 0, worst = 0;
  for (const p of got) {
    let best = -1, bd = Infinity;
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let c = -1; c <= 1; c++) {
      for (const j of grid.get((Math.floor(p[0]) + a) + ',' + (Math.floor(p[1]) + b) + ',' + (Math.floor(p[2]) + c)) || []) {
        if (used.has(j)) continue;
        const d = Math.hypot(p[0] - want[j][0], p[1] - want[j][1], p[2] - want[j][2]);
        if (d < bd) { bd = d; best = j; }
      }
    }
    if (best < 0 || bd > tol) { extra++; continue; }
    used.add(best); if (bd > worst) worst = bd;
  }
  return { extra, missing: want.length - used.size, worst };
}
// the centre of each run of 8 triangles (an octahedron: its six corners, each in four of them)
function centres(tris) {
  const out = [];
  for (let t = 0; t + 72 <= tris.length; t += 72) { const c = [0, 0, 0]; for (let v = 0; v < 24; v++) for (let a = 0; a < 3; a++) c[a] += tris[t + v * 3 + a] / 24; out.push(c); }
  return out;
}

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'titanic-u3s-'));
  try {
    if (!fs.existsSync(BLENDER)) throw new Error('no Blender at ' + BLENDER + ' (set BLENDER)');
    // ---- the inputs, made here from the model: the export, the record and the two timelines
    const env = { TITANIC_OUT: tmp };
    const made = await Promise.all([['tools/export_ship.js'], ['tools/record_night.js', '1912', 'auto'], ['tools/u3_lights.js'], ['tools/u3_smoke.js']].map(a => run(process.execPath, a, env)));
    made.forEach((r, j) => { if (r.code !== 0) throw new Error(['the export', 'the record', 'u3_lights.js', 'u3_smoke.js'][j] + ' failed: ' + tail(r)); });
    const F = { ship: path.join(tmp, 'titanic_ship.json'), night: path.join(tmp, 'titanic_night_1912.json'), lights: path.join(tmp, 'u3_lights.json'), smoke: path.join(tmp, 'u3_smoke.json') };
    const args = (out, more) => ['-b', '--factory-startup', '--python-exit-code', '1', '--python', SCENE, '--', '--ship', F.ship, '--night', F.night, '--lights', F.lights, '--smoke', F.smoke, '--t', TIMES.join(','), '--out', out].concat(more || []);
    const outs = [path.join(tmp, 'a'), path.join(tmp, 'b')];
    const [ra, rb, posed] = await Promise.all([
      run(BLENDER, args(outs[0])), run(BLENDER, args(outs[1])),
      run(BLENDER, ['-b', '--factory-startup', '--python-exit-code', '1', '--python', BUILD, '--', '--ship', F.ship, '--out', path.join(tmp, 'ship')])
        .then(r => (r.code !== 0 ? r : run(BLENDER, args(path.join(tmp, 'scene'), ['--glb', path.join(tmp, 'ship', 'titanic_ship.glb')])))),
    ]);
    for (const r of [ra, rb]) if (r.code !== 0 || !/U3_READY/.test(r.out)) throw new Error('Blender failed (exit ' + r.code + '): ' + tail(r));
    const glbA = fs.readFileSync(path.join(outs[0], 'u3_scene.glb')), glbB = fs.readFileSync(path.join(outs[1], 'u3_scene.glb'));
    const infA = fs.readFileSync(path.join(outs[0], 'u3_scene.glb.json')), infB = fs.readFileSync(path.join(outs[1], 'u3_scene.glb.json'));
    const same = glbA.equals(glbB) && infA.equals(infB);
    row('MUST', 'u3_scene.glb: two runs of Blender, the same bytes; and the same list of what is in it', same ? 'the same bytes' : 'THEY DIFFER', 'the same bytes', same);

    const ship = JSON.parse(fs.readFileSync(F.ship, 'utf8')), rec = JSON.parse(fs.readFileSync(F.night, 'utf8'));
    const LJ = JSON.parse(fs.readFileSync(F.lights, 'utf8')), SJ = JSON.parse(fs.readFileSync(F.smoke, 'utf8')), inf = JSON.parse(infA.toString('utf8'));
    const K = rec.constants, ch = rec.channels, k0 = rec.clock.k0, SP = ship.subdivision.spaces, nodes = ship.subdivision.nodes.list, zones = ship.subdivision.zones;
    const parts = G.partsOf(G.readGLB(glbA));
    const label = (n) => n + ' ' + zones[nodes[n].zone].short + ' ' + (nodes[n].side === 0 ? 'port' : 'starboard') + ' ' + (nodes[n].layer === 0 ? 'lower' : 'upper');
    const pairOf = (q) => q ^ 2, alone = (q) => { const k = q >> 2, layer = q & 1; return layer === 0 && (k === 2 || k === 3); };
    const stepOf = (t) => Math.floor((rec.end.summary.tTouch + 60 * t) / K.dt + 0.5);

    let badStep = [], setBad = [], volWorst = 0, volWhere = '', recBad = 0, recRatio = 0, spaces = 0;
    let topWorst = 0, topLoose = 0, topMissing = 0, columns = 0;
    let lightBad = [], lit = 0, plumeBad = [], plumes = 0; const infos = [];
    let pkBad = [], pkDrawn = 0, pkVolWorst = 0, pkPlaceWorst = 0;
    for (const t of TIMES) {
      const k = stepOf(t), i = k - k0, e = inf.times.find(x => x.t === t), sfx = ' t' + t;
      if (!e || e.k !== k) { badStep.push('T+' + t + ': ' + (e ? e.k : 'missing') + ' against ' + k); continue; }
      const pitch = ch.pitch[i], roll = ch.roll[i], cp = Math.cos(pitch), sp = Math.sin(pitch), cr = Math.cos(roll), sr = Math.sin(roll), g = K.g0;
      const R20 = -sp, R21 = cp * sr, R22 = cp * cr, tz = ch.zO[i] - (R20 * g[0] + R21 * g[1] + R22 * g[2]);
      const mine = new Map([...parts].filter(([name]) => name.endsWith(sfx)));
      // ---- the water: the core's cut of the record's level, space by space (the next sample's level, which holds this
      // sample's water at this sample's pose; at the last sample, or where the next has none, its own)
      const want = new Map();
      for (let q = 0; q < SP.list.length; q++) {
        const hNext = i + 1 < rec.clock.n ? at(ch.water.level[q], i + 1) : null;
        const h = hNext !== null ? hNext : at(ch.water.level[q], i), vol = at(ch.water.vol[q], i);
        if (h === null || vol === null) continue;
        const s = SP.list[q], cols = []; let V = 0, area = 0;
        for (let j = 0; j < s.x.length; j++) {
          const zp = (h - (R20 * s.x[j] + R21 * s.y[j] + tz)) / R22;
          if (zp <= s.a[j]) continue;
          const top = zp >= s.e[j] ? s.e[j] : zp, A = s.dx[j] * SP.dy;
          V += A * (top - s.a[j]); if (zp < s.e[j]) area += A;
          cols.push({ x: s.x[j], y: s.y[j], top });
        }
        const vmax = nodes[q].vmax, mu = nodes[q].mu, scale = alone(q) ? vmax : vmax + nodes[pairOf(q)].vmax;
        const tol = Math.max(1e-3 * scale, 0.5) + 0.0005 * area * mu / R22 + 0.05 + 1e-6 * vmax;
        want.set(q, { name: 'water ' + label(q) + sfx, vol, V, cols, mu, vmax, tol });
      }
      const drawn = [...mine.keys()].filter(nm => nm.startsWith('water ')).sort(), wet = [...want.values()].filter(w => w.cols.length).map(w => w.name).sort();
      if (drawn.join('|') !== wet.join('|')) setBad.push('T+' + t + ': ' + drawn.length + ' drawn, ' + wet.length + ' wet by the cut');
      for (const [q, w] of want) {
        const tris = mine.get(w.name), vG = tris ? G.volume(tris) : 0;
        if (w.cols.length) {
          spaces++;
          const d = Math.abs(vG - w.V) / Math.max(w.V, 100);
          if (d > volWorst) { volWorst = d; volWhere = 'space ' + q + ' at T+' + t; }
        }
        const dRec = Math.abs(Math.min(vG * w.mu, w.vmax) - Math.min(w.vol, w.vmax));
        if (dRec > w.tol) recBad++;
        if (dRec / w.tol > recRatio) recRatio = dRec / w.tol;
        if (!tris) continue;
        // each column's top: the upward horizontal triangles, by the centre of their extent in plan
        const byX = w.cols.slice().sort((p, r) => p.x - r.x), xs = byX.map(c => c.x), seen = new Set();
        columns += w.cols.length;
        for (let o = 0; o < tris.length; o += 9) {
          const az = tris[o + 2], bz = tris[o + 5], cz = tris[o + 8];
          if (az !== bz || az !== cz) continue;
          const nz = (tris[o + 3] - tris[o]) * (tris[o + 7] - tris[o + 1]) - (tris[o + 4] - tris[o + 1]) * (tris[o + 6] - tris[o]);
          if (nz <= 0) continue;
          const cx = (Math.min(tris[o], tris[o + 3], tris[o + 6]) + Math.max(tris[o], tris[o + 3], tris[o + 6])) / 2;
          const cy = (Math.min(tris[o + 1], tris[o + 4], tris[o + 7]) + Math.max(tris[o + 1], tris[o + 4], tris[o + 7])) / 2;
          let lo = 0, hi = xs.length; while (lo < hi) { const m = (lo + hi) >> 1; if (xs[m] < cx - 1e-3) lo = m + 1; else hi = m; }
          let hit = -1;
          for (let j = lo; j < xs.length && xs[j] <= cx + 1e-3; j++) if (Math.abs(byX[j].y - cy) <= 1e-3) { hit = j; break; }
          if (hit < 0) { topLoose++; continue; }
          seen.add(hit);
          const d = Math.abs(az - byX[hit].top); if (d > topWorst) topWorst = d;
        }
        topMissing += w.cols.length - seen.size;
      }
      // ---- her lights: u3_lights.json's rule at the step
      let level = 0; for (const p of LJ.plant) if (p.k <= k) level = p.lights;
      const on = LJ.lights.filter(L => level > 0 && (L.out === null || k < L.out));
      const pw = on.filter(L => L.kind !== 'navigation'), nav = on.filter(L => L.kind === 'navigation');
      lit += on.length;
      const lt = mine.get('lights' + sfx), mL = match(lt ? centres(lt) : [], pw.map(L => L.p), 1e-3);
      if (mL.extra || mL.missing || (lt ? lt.length / 9 !== 8 * pw.length : pw.length > 0)) lightBad.push('T+' + t + ': ' + mL.extra + ' drawn not lit, ' + mL.missing + ' lit not drawn');
      const navDrawn = [...mine.keys()].filter(nm => nm.startsWith('light ')).sort(), navWant = nav.map(L => 'light ' + L.id + sfx).sort();
      if (navDrawn.join('|') !== navWant.join('|')) lightBad.push('T+' + t + ': navigation ' + navDrawn.length + ' drawn, ' + navWant.length + ' lit');
      for (const L of nav) { const c = mine.get('light ' + L.id + sfx); if (c && match(centres(c), [L.p], 1e-3).missing) lightBad.push('T+' + t + ': ' + L.id + ' away from its point'); }
      // ---- the steam and the smoke: when, where, and up the world's vertical
      const steamOn = SJ.jets.some(j => j.from <= k && (j.to === null || k < j.to)), smokeOn = ch.plant.gen[i] > 0.02;
      for (const [kind, onNow, pts] of [['steam', steamOn, SJ.steam], ['smoke', smokeOn, SJ.smoke]]) {
        const names = [...mine.keys()].filter(nm => nm.startsWith(kind + ' ')), wantN = onNow ? pts.length : 0;
        if (names.length !== wantN) { plumeBad.push('T+' + t + ': ' + names.length + ' ' + kind + ' plumes, ' + wantN + ' wanted'); continue; }
        pts.forEach((p, s) => {
          const tris = mine.get(kind + ' ' + s + sfx); if (!onNow) return; if (!tris) { plumeBad.push('T+' + t + ': ' + kind + ' ' + s + ' missing'); return; }
          plumes++;
          const vs = new Map(); for (let o = 0; o < tris.length; o += 3) vs.set(tris[o] + ',' + tris[o + 1] + ',' + tris[o + 2], [tris[o], tris[o + 1], tris[o + 2]]);
          const pr = [...vs.values()].map(v => [v, v[0] * R20 + v[1] * R21 + v[2] * R22]), lo = Math.min(...pr.map(x => x[1])), hi = Math.max(...pr.map(x => x[1]));
          const mean = (sel) => { const c = [0, 0, 0]; sel.forEach(x => { for (let a = 0; a < 3; a++) c[a] += x[0][a] / sel.length; }); return c; };
          const b = mean(pr.filter(x => x[1] < lo + 1e-3)), tp = mean(pr.filter(x => x[1] > hi - 1e-3)), ax = [tp[0] - b[0], tp[1] - b[1], tp[2] - b[2]], L = Math.hypot(...ax);
          const off = Math.hypot(b[0] - p.x, b[1], b[2] - p.z), tilt = Math.acos(Math.min(1, (ax[0] * R20 + ax[1] * R21 + ax[2] * R22) / L));
          if (off > 1e-3 || tilt > 1e-4) plumeBad.push('T+' + t + ': ' + kind + ' ' + s + ' ' + f(off * 1000, 2) + ' mm off its source, ' + f(tilt * 1e6, 1) + ' microradians off the vertical');
        });
      }
      // ---- the pockets (the record's water.pockets): each one holding water of its own, drawn as the prism of its own area
      // that the core's law places, along x0 to x1, centred across her at yc, from its floor up to z0 + (z1 - z0) min(vol,
      // cap) / cap in her frame: it holds min(vol, cap)
      const PKR = ch.water.pockets, pkWant = [];
      if (PKR) PKR.list.forEach((q, j) => { const v = at(PKR.vol[j], i); if (v !== null) pkWant.push({ j, q, v }); });
      const pkNames = [...mine.keys()].filter(nm => nm.startsWith('pocket ')).sort(), pkWet = pkWant.map(p => 'pocket ' + p.j + sfx).sort();
      if (pkNames.join('|') !== pkWet.join('|')) pkBad.push('T+' + t + ': drawn ' + (pkNames.join(', ') || 'none') + '; the record ' + (pkWet.join(', ') || 'none'));
      for (const { j, q, v } of pkWant) {
        const tris = mine.get('pocket ' + j + sfx);
        if (!tris) continue;
        pkDrawn++;
        const placed = Math.min(v, q.cap), h = q.z1 - q.z0, w = q.cap / h / (q.x1 - q.x0), fill = q.z0 + h * placed / q.cap;
        pkVolWorst = Math.max(pkVolWorst, Math.abs(G.volume(tris) - placed));
        const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
        for (let o = 0; o < tris.length; o += 3) for (let c = 0; c < 3; c++) { lo[c] = Math.min(lo[c], tris[o + c]); hi[c] = Math.max(hi[c], tris[o + c]); }
        const want = [q.x0, q.yc - w / 2, q.z0, q.x1, q.yc + w / 2, fill], got = [lo[0], lo[1], lo[2], hi[0], hi[1], hi[2]];
        pkPlaceWorst = Math.max(pkPlaceWorst, ...want.map((x, c) => Math.abs(x - got[c])));
      }
      infos.push(['INFO', 'T+' + t + ' min, step ' + k + ': ' + wet.length + ' spaces wet, ' + f([...want.values()].reduce((s, w) => s + w.V * w.mu, 0), 1) + ' m3 of water drawn', on.length + ' lights lit (plant ' + level + ')', (steamOn ? 'steam blowing' : 'no steam') + (smokeOn ? ', smoke (gen ' + f(ch.plant.gen[i], 3) + ')' : ', no smoke'), true]);
    }
    row('MUST', 'each time drawn at the record\'s step for it (its minutes after the touch, on the step nearest)', badStep.length ? badStep.join('; ') : TIMES.map(t => 'T+' + t).join(', ') + ' at their steps', 'the record\'s steps', !badStep.length);
    row('MUST', 'the spaces drawn wet: exactly those the core\'s cut of the record\'s level wets, named by their n', setBad.length ? setBad.join('; ') : 'the same spaces at every time', 'the core\'s cut (core.js nodePass)', !setBad.length);
    row('MUST', 'each space\'s water read off the GLB\'s own triangles: the core\'s cut of the record\'s level at the record\'s pose', spaces + ' space-times; off by ' + volWorst.toExponential(2) + ' at worst (' + (volWhere || 'none') + ')', '<= 1e-5 of it (32-bit floats)', volWorst <= 1e-5 && spaces > 0);
    row('MUST', '... and the record\'s own volume (channels.water.vol), every space it has wet', recBad + ' outside the tolerance; ' + f(100 * recRatio, 1) + ' % of it used at most', 'within the core\'s level tolerance and the rounding (as u3_water_tests)', recBad === 0);
    row('MUST', 'every column\'s water stands at the record\'s level (the next sample\'s) over its centre at the record\'s pose, or at its top', columns + ' columns; ' + topMissing + ' without a top, ' + topLoose + ' tops astray; off by ' + f(topWorst * 1000, 3) + ' mm at worst', '<= 0.1 mm', !topMissing && !topLoose && topWorst <= 1e-4 && columns > 0);
    row('MUST', 'the pockets drawn: exactly those the record gives water of their own (channels.water.pockets), each the prism of its own area that the core\'s law places, holding min(vol, cap), at its place',
      pkBad.length ? pkBad.join('; ') : pkDrawn + ' pocket-times; the volume off by ' + pkVolWorst.toExponential(2) + ' m3, the place by ' + f(pkPlaceWorst * 1000, 3) + ' mm at most',
      'the record\'s; within 0.01 m3 and 1 mm', !pkBad.length && pkDrawn > 0 && pkVolWorst <= 0.01 && pkPlaceWorst <= 1e-3);
    row('MUST', 'the lights drawn lit: u3_lights.json\'s at the step (the plant has light, their section\'s fuses hold), each at its own point', lightBad.length ? lightBad.join('; ') : lit + ' lights, each at its point', 'every one, within 1 mm', !lightBad.length && lit > 0);
    row('MUST', 'the steam and the smoke drawn exactly when the record says (a jet of u3_smoke.json; gen > 0.02), at their sources, up the world\'s vertical', plumeBad.length ? plumeBad.join('; ') : plumes + ' plumes, each where and when it should be', 'within 1 mm and 0.1 mrad', !plumeBad.length);
    const sceneOk = posed.code === 0 && TIMES.every(t => new RegExp('U3_SCENE t' + t + ': ').test(posed.out));
    row('MUST', 'her scene at each time, posed on the sea with her hull (tools/blender/build_ship.py\'s GLB) and both views set up', sceneOk ? 'built, no render' : 'FAILED (exit ' + posed.code + '): ' + tail(posed), 'built', sceneOk);
    rows.push(...infos);
    rows.push(['INFO', 'u3_scene.glb: ' + parts.size + ' objects at ' + TIMES.length + ' times, from ' + inf.blender, glbA.length + ' bytes', '', true]);
  } catch (e) {
    row('MUST', 'the suite ran', String(e && e.message || e), 'no error', false);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  for (const [kind, what, value, ref, ok] of rows) {
    if (kind === 'INFO') { console.log('       ' + what.padEnd(100) + ' ' + String(value).padEnd(60) + ' ' + ref); continue; }
    console.log((ok ? 'PASS ' : 'FAIL ') + kind.padEnd(6) + what.padEnd(100) + ' ' + String(value).padEnd(60) + ' ' + ref);
  }
  console.log(fails ? '\nFAIL: ' + fails + ' MUST row(s)' : '\nPASS: all ' + rows.filter(r => r[0] === 'MUST').length + ' MUST rows');
  process.exit(fails ? 1 : 0);
})();
