'use strict';
// e108: the fall with Z6's spaces (K.air 'spaces', M2 step 4c, a what-if) against the default lumped pocket (K.air
// 'pocket'), on the 1912 preset at its flag and the 1912 watch at its flag, each begun as the fall's trials and the
// watch's reader begin it, and each followed to the bed (Z1, 2026-11-21). Per piece: the way up it lies on the bed, how
// far from the point under the break it lands, when it is under, when it strikes and how fast, when it is at rest; its
// air (m3, at its own pressure) at marks in time; under 'spaces' the failures (each space giving way past K.failHead,
// with its node, depth and energy; the reports, past K.reportMin, starred), and the spaces at the end. The CPU each run
// took, and a hash of each fall (pieces and events).
//   node docs/research/experiments/e108_m2_spaces_fall.js [LIM s of fall, default 7200] [cases: preset,watch]
//     [modes: pocket,spaces]
// Output of 2026-11-21 (its stdout): results_2026-11-21/e108_m2_spaces_fall.txt
const path = require('path'), crypto = require('crypto');
const ROOT = path.join(__dirname, '..', '..', '..');
const LIM = +(process.argv[2] || 7200);
const CASES = (process.argv[3] || 'preset,watch').split(','), MODES = (process.argv[4] || 'pocket,spaces').split(',');
const C = require(path.join(ROOT, 'core/core.js')), N = require(path.join(ROOT, 'core/night.js')), SC = require(path.join(ROOT, 'core/scenarios.js'));
for (const r of ['girder.js', 'section.js', 'onset.js', 'people.js', 'reports.js', 'world.js']) require(path.join(ROOT, 'core/readers', r));
const F = require(path.join(ROOT, 'core/readers/fall.js')), GI = require(path.join(ROOT, 'core/readers/girder.js'));
const DEG = Math.PI / 180;
const att = (q) => { const R = F.quatR(q, new Float64Array(9)); return { pitch: Math.atan2(-R[6], Math.hypot(R[7], R[8])) / DEG, roll: Math.atan2(R[7], R[8]) / DEG }; };
const word = (q) => { const r = Math.abs(att(q).roll); return r <= 45 ? 'upright' : (r >= 135 ? 'upside down' : 'on her side'); };
const fp = (fall) => { const h = crypto.createHash('sha256'); for (const p of fall.pieces) h.update(Buffer.from(new Float64Array(p.r.concat(p.q, [p.depth])).buffer)); h.update(JSON.stringify(fall.events)); return h.digest('hex'); };
const f = (v, d) => Number.isFinite(v) ? v.toFixed(d) : String(v);
const MARKS = [0, 1, 2, 5, 10, 20, 30, 60, 120, 240, 480, 960];

function run(name, sim, opts, mode) {
  const c0 = process.cpuUsage();
  const fall = F.begin(sim, Object.assign({}, opts, { K: mode === 'spaces' ? { air: mode, fail: 'simple' } : { air: mode } }));   // the first form of the failures, the default when this ran
  const B = fall.eng.bodies;
  const head = B.map((b, i) => {
    const p = fall.pieces[i];
    if (b.spc) {
      const S = b.spc, nf = S.st.failed ? S.st.failed.reduce((x, y) => x + y, 0) : 0;
      let room = 0; for (let k = 0; k < S.sp.n; k++) room += S.sp.V[k];
      return p.id + ': ' + S.sp.n + ' spaces (room ' + f(room, 0) + ' m3; the body\'s floodable ' + f(b.airMax, 0) + '), ' + S.ops.length + ' openings, ' + nf + ' give way at the hand-over; air ' + f(p.air, 0) + ' m3 at x ' + f(b.air.p[0], 1) + ', y ' + f(b.air.p[1], 1) + ', z ' + f(b.air.p[2], 1);
    }
    return p.id + ': the pocket ' + (b.air ? f(b.air.V0, 0) + ' m3 (the core\'s room above her water), now ' + f(p.air, 0) + ' m3 at x ' + f(b.air.p[0], 1) + ', y ' + f(b.air.p[1], 1) + ', z ' + f(b.air.p[2], 1) : 'none');
  });
  const trace = B.map(() => []);
  let m = 0;
  const mark = () => { const tt = fall.t - fall.t0; while (m < MARKS.length && tt >= MARKS[m] - 1e-9) { for (let i = 0; i < B.length; i++) { const p = fall.pieces[i]; trace[i].push('+' + MARKS[m] + ' s ' + f(p.air, 0) + ' m3 (' + f(p.depth, 0) + ' m, ' + p.state + ')'); } m++; } };
  mark();
  while (!fall.done && fall.t - fall.t0 < LIM) { F.advance(fall); mark(); }
  const cpu = process.cpuUsage(c0);
  console.log(name + ', K.air \'' + mode + '\': ' + (fall.done ? 'all at rest' : 'NOT DONE') + ' at +' + f(fall.t - fall.t0, 1) + ' s; ' + f((cpu.user + cpu.system) / 1e6, 1) + ' s of CPU; hash ' + fp(fall).slice(0, 16));
  for (const h of head) console.log('  ' + h);
  for (let i = 0; i < B.length; i++) {
    const p = fall.pieces[i], a = att(p.q), w = F.worldOf(fall, i, [0.5 * (p.x0 + p.x1), 0, GI.Z_NA]);
    const dX = fall.breakAt ? w[0] - fall.breakAt[0] : NaN, dY = fall.breakAt ? w[1] - fall.breakAt[1] : NaN;
    const ev = (id) => fall.events.find(e => e.id === id && e.piece === p.id);
    const u = ev('under'), s = ev('strike'), r = ev('rest');
    console.log('  ' + p.id.padEnd(6) + word(p.q).padEnd(12) + 'pitch ' + f(a.pitch, 1) + ', roll ' + f(a.roll, 1) + '; ' + f(Math.hypot(dX, dY), 0) + ' m from the point under the break (along ' + f(dX, 0) + ', across ' + f(dY, 0) + '); under +' + f(u ? u.t - fall.t0 : NaN, 1) + ' s; strikes +' + f(s ? (s.t - fall.t0) / 60 : NaN, 2) + ' min at ' + f(s ? s.speed : NaN, 2) + ' m/s (' + f(s ? s.energy / 1e9 : NaN, 2) + ' GJ); rest +' + f(r ? (r.t - fall.t0) / 60 : NaN, 2) + ' min');
    console.log('    air: ' + trace[i].join('; '));
    const b = B[i];
    if (b.spc) {
      const rep = fall.events.filter(e => e.id === 'report' && e.piece === p.id), after = u ? rep.filter(e => e.t >= u.t) : [];
      console.log('    reports ' + rep.length + ' (past ' + b.K.reportMin / 1e9 + ' GJ, starred) of ' + b.spc.ev.length + ' failures; ' + after.length + ' at or after it is under' + (after.length ? ', the first +' + f(after[0].t - u.t, 1) + ' s after' : '') + ': ' + b.spc.ev.map(e => (e.energy >= b.K.reportMin ? '*' : '') + '+' + f(e.t - fall.t0, 2) + ' s node ' + e.node + ' ' + f(e.depth, 0) + ' m ' + f(e.energy / 1e9, 2) + ' GJ').join('; '));
      let nf = 0, wa = 0, aa = 0; for (let k = 0; k < b.spc.sp.n; k++) { nf += b.spc.st.failed[k]; wa += b.spc.st.W[k]; aa += b.spc.st.a[k]; }
      console.log('    the spaces at the end: ' + nf + ' given way; water ' + f(wa, 0) + ' m3, air ' + f(b.spc.V, 1) + ' m3 (' + f(aa, 1) + ' at 1 atm); the spaces\' clock +' + f(b.spc.t - fall.t0, 3) + ' s');
    }
  }
  return fall;
}

if (CASES.includes('preset')) {
  const simF = C.createSim(C.buildShip(), {}, SC.PRESETS.titanic.build());
  while (!simF.foundered) C.step(simF);
  for (const mode of MODES) run('the 1912 preset at its flag (T ' + f(simF.founderT / 60, 2) + ' min)', simF, {}, mode);
}
if (CASES.includes('watch')) {
  const sw = N.create(C.buildShip(), N.spec(1912), { auto: true });
  while (!N.over(sw)) N.step(sw);
  for (const mode of MODES) run('the 1912 watch at its flag (step ' + sw.night.k + ', T ' + f(sw.founderT / 60, 2) + ' min)', sw, { t0: sw.founderT }, mode);
}
