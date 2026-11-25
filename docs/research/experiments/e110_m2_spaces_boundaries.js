'use strict';
// e110: the fall with Z6's spaces (K.air 'spaces', M2, a what-if) giving way boundary by boundary, section 5's fuller
// form (K.fail 'boundaries': each bulkhead, joiner work and E deck at its own head into the space across it, the shell at
// its own to the sea, a space giving way once at its weakest link), against the first form (K.fail 'simple': a space
// lagging the sea past 10 m gives way to the sea), on the 1912 preset and the 1912 watch at their flags, each to the bed
// (Z1, 2026-11-21; M2 step 4d). Per run: where each piece lands from the point under the break and which way up, when
// each is under and strikes, the reports (at the hand-over; at or after the stern is under, with their times and
// energies), each piece's failures by kind (and how many were of spaces with no air), the air at marks, the CPU. The
// record: the bow 772 m and the stern 148 m from the point under the break (R5 10a), the two 689 m apart (R5 10b); the
// reports about four, the first 0 to 60 s after she is under (R5 10b).
//   node docs/research/experiments/e110_m2_spaces_boundaries.js [cases: preset,watch] [modes: boundaries,simple]
// Output of 2026-11-21 (its stdout): results_2026-11-21/e110_m2_spaces_boundaries.txt
const path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..');
const CASES = (process.argv[2] || 'preset,watch').split(','), MODES = (process.argv[3] || 'boundaries,simple').split(',');
const C = require(path.join(ROOT, 'core/core.js')), N = require(path.join(ROOT, 'core/night.js')), SC = require(path.join(ROOT, 'core/scenarios.js'));
for (const r of ['girder.js', 'section.js', 'onset.js', 'people.js', 'reports.js', 'world.js']) require(path.join(ROOT, 'core/readers', r));
const F = require(path.join(ROOT, 'core/readers/fall.js')), GI = require(path.join(ROOT, 'core/readers/girder.js'));
const DEG = Math.PI / 180;
const f = (v, d) => Number.isFinite(v) ? v.toFixed(d) : String(v);
const word = (q) => { const R = F.quatR(q, new Float64Array(9)), roll = Math.abs(Math.atan2(R[7], R[8]) / DEG); return roll <= 45 ? 'upright' : (roll >= 135 ? 'upside down' : 'on her side'); };
const nm = (n) => C.ZONES[n >> 2].short + (((n >> 1) & 1) ? 'S' : 'P') + (n & 1);
const MK = [1, 2, 5, 10, 20, 30, 60, 120];

function run(name, sim, opts, mode) {
  const c0 = process.cpuUsage(), fall = F.begin(sim, Object.assign({}, opts, { K: { air: 'spaces', fail: mode } }));
  const air = []; let m = 0;
  while (!fall.done && fall.t - fall.t0 < 7200) { F.advance(fall); while (m < MK.length && fall.t - fall.t0 >= MK[m] - 1e-9) { air.push(fall.pieces.map(p => f(p.air, 0)).join('/')); m++; } }
  const cpu = process.cpuUsage(c0);
  const ev = (id, pc) => fall.events.find(e => e.id === id && e.piece === pc), us = ev('under', 'stern');
  console.log(name + ', K.fail \'' + mode + '\': ' + (fall.done ? 'all at rest' : 'NOT DONE') + ' at +' + f(fall.t - fall.t0, 1) + ' s; ' + f((cpu.user + cpu.system) / 1e6, 0) + ' s of CPU');
  fall.pieces.forEach((p, i) => {
    const w = F.worldOf(fall, i, [0.5 * (p.x0 + p.x1), 0, GI.Z_NA]), dX = w[0] - fall.breakAt[0], dY = w[1] - fall.breakAt[1], u = ev('under', p.id), s = ev('strike', p.id), b = fall.eng.bodies[i];
    const byKind = {}; let noAir = 0;
    for (const e of b.spc.ev) { if (!(e.energy > 1e6)) { noAir++; continue; } const k = e.boundary || 'shell'; byKind[k] = (byKind[k] || 0) + 1; }
    console.log('  ' + p.id.padEnd(6) + word(p.q).padEnd(12) + f(Math.hypot(dX, dY), 0) + ' m (' + f(dX, 0) + ', ' + f(dY, 0) + '); under +' + f(u ? u.t - fall.t0 : NaN, 1) + ' s; strikes +' + f(s ? (s.t - fall.t0) / 60 : NaN, 2) + ' min at ' + f(s ? s.speed : NaN, 2) + ' m/s');
    console.log('    failures ' + b.spc.ev.length + ' (' + noAir + ' of spaces with no air); with air, by kind: ' + Object.entries(byKind).map(([k, c]) => k + ' ' + c).join(', ') + '; the reports (past ' + f(b.K.reportMin / 1e9, 1) + ' GJ): ' + b.spc.ev.filter(e => e.energy >= b.K.reportMin).map(e => '+' + f(e.t - fall.t0, 1) + ' s ' + nm(e.node) + ' ' + (e.boundary || 'shell') + ' ' + f(e.depth, 0) + ' m ' + f(e.energy / 1e9, 2) + ' GJ').join('; '));
  });
  const rep = fall.events.filter(e => e.id === 'report'), atOnce = rep.filter(e => e.t <= fall.t0 + 1e-9).length, after = us ? rep.filter(e => e.t >= us.t) : [];
  console.log('  reports ' + rep.length + ': ' + atOnce + ' at the hand-over; the stern under at +' + f(us ? us.t - fall.t0 : NaN, 1) + ' s; ' + after.length + ' at or after it' + (after.length ? ' (' + after.map(e => '+' + f(e.t - us.t, 1) + ' s after, ' + f(e.energy / 1e9, 2) + ' GJ').join('; ') + ')' : ''));
  console.log('  air bow/stern m3 at +' + MK.join(', +') + ' s: ' + air.join(', '));
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
