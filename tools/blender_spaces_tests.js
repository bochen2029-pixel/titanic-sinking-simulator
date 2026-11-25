// U3's named spaces, checked (tools/blender/build_spaces.py): the model's 64 spaces built in Blender from the export, read
// back off the GLB itself. Headless and CPU only: Blender in background mode, no render.
//   node tools/blender_spaces_tests.js     (about half a minute)   BLENDER=<blender.exe> to use another Blender
// MUST rows: two runs of Blender give the same GLB and the same list of its objects; one named object for every space the
// model has columns in, named by its n; each object's volume, read off the GLB's own triangles (closed boxes wound
// outward, by the divergence theorem), times its permeability is the model's own capacity (nodeVmax), to the precision
// of the file's 32-bit floats. Nothing is written: the runs go to a temporary folder, deleted after.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const C = require('../core/core.js');
const XS = require('./export_ship.js');
const G = require('./glb_read');

const root = path.join(__dirname, '..');
const BLENDER = process.env.BLENDER || 'C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender.exe';
const SCRIPT = path.join(root, 'tools', 'blender', 'build_spaces.py');
const rows = []; let fails = 0;
function row(kind, what, value, ref, ok) { rows.push([kind, what, value, ref, ok]); if (!ok && kind === 'MUST') fails++; }
function run(cmd, args, env) {
  return new Promise((resolve) => {
    const p = spawn(cmd, args, { cwd: root, env: Object.assign({}, process.env, env || {}), stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '', err = '';
    p.stdout.on('data', (d) => { out += d; }); p.stderr.on('data', (d) => { err += d; });
    p.on('error', (e) => { err += String(e); });
    p.on('close', (code) => resolve({ code, out, err }));
  });
}

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'titanic-u3-'));
  try {
    if (!fs.existsSync(BLENDER)) throw new Error('no Blender at ' + BLENDER + ' (set BLENDER)');
    const ex = await run(process.execPath, ['tools/export_ship.js'], { TITANIC_OUT: tmp });
    if (ex.code !== 0) throw new Error('the export failed: ' + ex.err.trim().split('\n').pop());
    const shipFile = path.join(tmp, XS.NAME), outs = [path.join(tmp, 'a'), path.join(tmp, 'b')];
    const bl = await Promise.all(outs.map(o => run(BLENDER, ['-b', '--factory-startup', '--python-exit-code', '1', '--python', SCRIPT, '--', '--ship', shipFile, '--out', o])));
    for (const r of bl) if (r.code !== 0 || !/GEN_OK titanic_spaces/.test(r.out)) throw new Error('Blender failed (exit ' + r.code + '): ' + (r.err.trim() || r.out.trim()).split('\n').slice(-3).join(' | '));
    const glbA = fs.readFileSync(path.join(outs[0], 'titanic_spaces.glb')), glbB = fs.readFileSync(path.join(outs[1], 'titanic_spaces.glb'));
    const infA = fs.readFileSync(path.join(outs[0], 'titanic_spaces.glb.json')), infB = fs.readFileSync(path.join(outs[1], 'titanic_spaces.glb.json'));
    row('MUST', 'titanic_spaces.glb: two runs of Blender, the same bytes; and the same list of what is in it', glbA.equals(glbB) && infA.equals(infB) ? 'the same bytes' : 'THEY DIFFER', 'the same bytes', glbA.equals(glbB) && infA.equals(infB));

    const model = C.buildShip(), parts = G.partsOf(G.readGLB(glbA));
    const want = []; for (let n = 0; n < C.NN; n++) if (model.nodeCount[n] > 0) want.push(n);
    const byN = new Map(); for (const [name, tris] of parts) { const m = /^space (\d+) /.exec(name); if (m) byN.set(+m[1], { name, tris }); }
    const missing = want.filter(n => !byN.has(n)), extra = [...byN.keys()].filter(n => !want.includes(n));
    row('MUST', 'one named object for every space the model has columns in, named by its n', byN.size + ' spaces' + (missing.length ? '; MISSING ' + missing.join(', ') : '') + (extra.length ? '; EXTRA ' + extra.join(', ') : ''), want.length + ' spaces', !missing.length && !extra.length);
    let worst = 0, wn = -1;
    for (const n of want) {
      const s = byN.get(n); if (!s) continue;
      const d = Math.abs(G.volume(s.tris) * model.nodeMu[n] - model.nodeVmax[n]) / model.nodeVmax[n];
      if (d > worst) { worst = d; wn = n; }
    }
    row('MUST', 'each space\'s volume, read off the GLB\'s own triangles, times its permeability: the model\'s own capacity (nodeVmax)', 'off by ' + worst.toExponential(2) + ' of it at worst (space ' + wn + ')', '<= 1e-5 (32-bit floats)', worst <= 1e-5 && wn >= 0);
    const inf = JSON.parse(infA.toString('utf8'));
    rows.push(['INFO', 'titanic_spaces.glb: ' + inf.objects.length + ' spaces, ' + inf.objects.reduce((s, o) => s + o.columns, 0) + ' columns, from ' + inf.blender, glbA.length + ' bytes', '', true]);
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
