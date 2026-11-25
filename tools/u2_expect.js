// U2's sea proof: what Unreal must find, and the check of what it found (docs/BRAINSTORM_titanic_in_unreal_v1_2026-11-20.md,
// section 7 and its 10.4; the run sheet docs/runbooks/U2_unreal_on_the_rtx_machine.md).
// From the recorded night alone (tools/record_night.js), by its own frames.pose: at six steps (the watch's start, the
// touch, one hour, two hours, the onset of the break, the hand-over: the record's end) her pose, and the height above the calm sea of the points
// whose heights are her waterline (her keel at ten stations, her deck edges at four), and where the GLB's markers
// (tools/blender/build_ship.py) stand in the core's world. Unreal (tools/unreal/u2_sea.py) poses her at the same steps
// and measures the same things; --check compares them, within U2's 0.1 m.
//   node tools/u2_expect.js [--night <titanic_night_1912.json>] [--out <u2_expected.json>]   (default out/: not tracked)
//   node tools/u2_expect.js --check <u2_result.json> [--expected <u2_expected.json>]
//   node tools/u2_expect.js --selftest      the check against made-up results: the same numbers pass, 0.2 m off fails
'use strict';
const fs = require('fs');
const path = require('path');
const C = require('../core/core.js');
const J = require('./export_json.js');
const outFile = require('./outdir');

const TOL = 0.1;                                  // m: U2's own test (the plan, section 7)
const STATIONS = [-130, -100, -70, -40, -10, 20, 50, 80, 110, 128];
const MARKERS = [['marker o', [0, 0, 1]], ['marker x', [100, 0, 1]], ['marker y', [0, 5, 1]], ['marker z', [0, 0, 11]]];
function points() {
  const P = STATIONS.map(x => ({ name: 'keel ' + x, p: [x, 0, 0] }));
  for (const x of [-100, -40, 20, 80]) {
    const z = C.deckZ('B', x), hb = C.halfBreadth(x, Math.min(z, C.zTopAt(x) - 0.01));
    P.push({ name: 'B deck edge ' + x + ' port', p: [x, hb, z] }, { name: 'B deck edge ' + x + ' starboard', p: [x, -hb, z] });
  }
  return P;
}
// the record's frames.pose: R = Ry(pitch) Rx(roll), t = [XO, YO, zO] - R g0; a ship point p stands at R p + t
function pose(K, zO, pitch, roll) {
  const cp = Math.cos(pitch), sp = Math.sin(pitch), cr = Math.cos(roll), sr = Math.sin(roll), g = K.g0;
  const R = [cp, sp * sr, sp * cr, 0, cr, -sr, -sp, cp * sr, cp * cr];
  const t = [K.XO - (R[0] * g[0] + R[1] * g[1] + R[2] * g[2]), K.YO - (R[3] * g[0] + R[4] * g[1] + R[5] * g[2]), zO - (R[6] * g[0] + R[7] * g[1] + R[8] * g[2])];
  return { R, t };
}
const apply = (F, p) => [0, 1, 2].map(i => F.R[i * 3] * p[0] + F.R[i * 3 + 1] * p[1] + F.R[i * 3 + 2] * p[2] + F.t[i]);

function expected(night) {
  const K = night.constants, ch = night.channels, k0 = night.clock.k0, n = night.clock.n, ev = (id) => night.events.find(e => e.id === id);
  const picks = [['the start', k0], ['the touch', ev('touch') ? ev('touch').k : null], ['one hour', 14400], ['two hours', 28800],
    ['the onset of the break', night.readers.onset && night.readers.onset.found ? night.readers.onset.found.k : null], ['the hand-over (' + (night.end.handover || 'flag') + ')', night.end.k]];
  const P = points(), steps = [];
  for (const [name, k] of picks) {
    if (k === null || k < k0 || k >= k0 + n) continue;
    const i = k - k0, F = pose(K, ch.zO[i], ch.pitch[i], ch.roll[i]);
    steps.push({ name, k, t: k * K.dt, zO: ch.zO[i], pitch: ch.pitch[i], roll: ch.roll[i], R: F.R, t3: F.t,
      points: P.map(q => ({ name: q.name, Z: apply(F, q.p)[2] })), markers: MARKERS.map(([m, p]) => ({ name: m, W: apply(F, p) })) });
  }
  return {
    format: 'titanic-u2-expected', version: 1,
    about: 'What Unreal must find at each step: her pose (zO, pitch, roll; R row by row and t3, the record\'s frames.pose) and, in the core\'s world (X along her heading, Y to port, Z up, the calm sea at Z = 0, metres), the height Z of each point and where each marker W stands. tools/unreal/u2_sea.py poses her by R and t3 through the axis mapping it measures by the markers, and reports the same in metres; node tools/u2_expect.js --check compares (within ' + TOL + ' m).',
    from: { night: night.night.title, orders: night.night.orders, fingerprint: night.end.fingerprint, sources: night.made.sources },
    tolerance: TOL, points: P.map(q => ({ name: q.name, p: q.p })), markers: MARKERS.map(([m, p]) => ({ name: m, p })), steps,
  };
}

// result: { steps: [{ k, points: [{ name, Z }], markers: [{ name, W }], sea: [{ name, Z }] (optional: the water's surface
// under each point, from the Water plugin) }], mapping: { M, o } (as measured) }
function check(exp, res) {
  const rows = []; let worst = 0;
  for (const s of exp.steps) {
    const r = (res.steps || []).find(q => q.k === s.k);
    if (!r) { rows.push({ ok: false, text: s.name + ' (step ' + s.k + '): not in the result' }); worst = Infinity; continue; }
    let e = 0, ew = '', em = 0, es = 0;
    s.points.forEach((p, j) => {
      const q = (r.points || []).find(v => v.name === p.name), sea = (r.sea || []).find(v => v.name === p.name);
      const got = q ? q.Z - (sea ? sea.Z : 0) : NaN, d = Math.abs(got - p.Z);
      if (!(d <= e)) { e = d; ew = p.name; }
      if (sea && Math.abs(sea.Z) > es) es = Math.abs(sea.Z);
    });
    for (const m of s.markers) { const q = (r.markers || []).find(v => v.name === m.name), d = q ? Math.max(...[0, 1, 2].map(i => Math.abs(q.W[i] - m.W[i]))) : Infinity; if (!(d <= em)) em = d; }
    const ok = e <= exp.tolerance && em <= exp.tolerance;
    worst = Math.max(worst, e, em);
    rows.push({ ok, text: s.name + ' (step ' + s.k + '): her waterline at ' + s.points.length + ' points off by ' + e.toFixed(4) + ' m at worst (' + ew + '); the markers ' + em.toFixed(4) + ' m' + (r.sea ? '; the sea\'s surface ' + es.toFixed(4) + ' m from Z = 0 at worst' : '') });
  }
  return { ok: rows.every(r => r.ok) && rows.length > 0, rows, worst };
}
function report(c) {
  for (const r of c.rows) console.log((r.ok ? 'PASS ' : 'FAIL ') + r.text);
  console.log(c.ok ? '\nPASS: U2\'s sea proof: every step within ' + TOL + ' m (worst ' + c.worst.toFixed(4) + ' m)' : '\nFAIL: U2\'s sea proof');
}

if (require.main === module) {
  const a = process.argv.slice(2), opt = (f) => { const i = a.indexOf(f); return i >= 0 ? a[i + 1] : null; };
  const nightPath = opt('--night') || outFile('titanic_night_1912.json');
  if (a.includes('--check')) {
    const exp = JSON.parse(fs.readFileSync(opt('--expected') || outFile('u2_expected.json'), 'utf8')), res = JSON.parse(fs.readFileSync(opt('--check'), 'utf8'));
    const c = check(exp, res); report(c); process.exit(c.ok ? 0 : 1);
  }
  if (!fs.existsSync(nightPath)) { console.error('no recorded night at ' + nightPath + ': node tools/record_night.js first'); process.exit(2); }
  const exp = expected(JSON.parse(fs.readFileSync(nightPath, 'utf8')));
  if (a.includes('--selftest')) {
    const same = { steps: exp.steps.map(s => ({ k: s.k, points: s.points.map(p => ({ name: p.name, Z: p.Z })), markers: s.markers.map(m => ({ name: m.name, W: m.W.slice() })) })) };
    const off = JSON.parse(JSON.stringify(same)); off.steps[2].points[3].Z += 0.2;
    const c1 = check(exp, same), c2 = check(exp, off);
    console.log((c1.ok ? 'PASS ' : 'FAIL ') + 'the check passes the expected numbers themselves (' + exp.steps.length + ' steps)');
    console.log((!c2.ok ? 'PASS ' : 'FAIL ') + 'the check fails a result 0.2 m off at one point of one step');
    console.log(c1.ok && !c2.ok ? '\nPASS: the check' : '\nFAIL: the check');
    process.exit(c1.ok && !c2.ok ? 0 : 1);
  }
  const file = opt('--out') || outFile('u2_expected.json'), text = J.text(exp);
  fs.writeFileSync(file, text);
  console.log('u2_expected.json: ' + exp.steps.length + ' steps (' + exp.steps.map(s => s.name + ' ' + s.k).join(', ') + '), ' + exp.points.length + ' points, ' + Buffer.byteLength(text) + ' bytes -> ' + file);
}

module.exports = { TOL, STATIONS, MARKERS, points, pose, expected, check };
