'use strict';
// e109: the fall with Z6's spaces (K.air 'spaces', M2, a what-if) on the 1912 preset at its flag, its cut's clear area
// 150, 300 and 600 m2 a piece (K.clear of the cut's gross section, 717 m2 a piece) crossed with the cut's discharge
// coefficient 0.45, 0.6 and 0.75 (K.cutCd: e84's band for a clear opening), each followed to the bed (Z1, 2026-11-21;
// M2's step 4e, the design v1.3's runs, without the ligament's rows: the spaces are not yet built with the joint). Per
// run: where each piece lands from the point under the break and which way up, when the stern is under, when each
// strikes, the two pieces' distance apart, the reports, the bow's and the stern's air at +1, +2, +5 and +10 s, the CPU.
// The record: the bow 772 m and the stern 148 m from the point under the break (R5 10a), the two 689 m apart (R5 10b);
// the reports about four, the first 0 to 60 s after she is under (R5 10b).
//   node docs/research/experiments/e109_m2_spaces_clear_cd.js [areas m2, default 150,300,600] [Cd, default 0.45,0.6,0.75]
// Output of 2026-11-21 (its stdout): results_2026-11-21/e109_m2_spaces_clear_cd.txt
const path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..');
const AREAS = (process.argv[2] || '150,300,600').split(',').map(Number), CDS = (process.argv[3] || '0.45,0.6,0.75').split(',').map(Number);
const C = require(path.join(ROOT, 'core/core.js')), SC = require(path.join(ROOT, 'core/scenarios.js'));
for (const r of ['girder.js', 'section.js', 'onset.js']) require(path.join(ROOT, 'core/readers', r));
const F = require(path.join(ROOT, 'core/readers/fall.js')), GI = require(path.join(ROOT, 'core/readers/girder.js'));
const DEG = Math.PI / 180;
const f = (v, d) => Number.isFinite(v) ? v.toFixed(d) : String(v);
const word = (q) => { const R = F.quatR(q, new Float64Array(9)), roll = Math.abs(Math.atan2(R[7], R[8]) / DEG); return roll <= 45 ? 'upright' : (roll >= 135 ? 'upside down' : 'on her side'); };

const simF = C.createSim(C.buildShip(), {}, SC.PRESETS.titanic.build());
while (!simF.foundered) C.step(simF);
// the cut's gross section a piece: its openings' areas at K.clear 1
const gross = (() => { const fl = F.begin(simF, { K: { air: 'spaces', fail: 'simple', clear: 1 } }); return fl.eng.bodies.map(b => b.spc.ops.filter(o => o.kind === 'cut').reduce((s, o) => s + o.A, 0)); })();
console.log('the 1912 preset at its flag (T ' + f(simF.founderT / 60, 2) + ' min); the cut\'s gross section ' + gross.map(g => f(g, 1)).join(' m2 (bow), ') + ' m2 (stern)');
console.log('clear m2 | Cd   | bow: m (along, across), way up, strikes | stern: m (along, across), way up, under, strikes | apart m | reports (at the hand-over, after the stern is under) | air bow/stern m3 at +1, 2, 5, 10 s | CPU s');
for (const area of AREAS) for (const cd of CDS) {
  const c0 = process.cpuUsage();
  const fall = F.begin(simF, { K: { air: 'spaces', fail: 'simple', clear: area / gross[0], cutCd: cd } });   // the first form of the failures, the default when this ran
  const B = fall.eng.bodies;
  // the stern's own cut takes its own share for the same clear area
  if (Math.abs(gross[1] - gross[0]) > 1e-6 * gross[0]) throw new Error('the two pieces\' cuts differ: ' + gross.join(' '));
  const air = []; const MK = [1, 2, 5, 10]; let m = 0;
  while (!fall.done && fall.t - fall.t0 < 7200) { F.advance(fall); while (m < MK.length && fall.t - fall.t0 >= MK[m] - 1e-9) { air.push(fall.pieces.map(p => f(p.air, 0)).join('/')); m++; } }
  const cpu = process.cpuUsage(c0);
  const at = (id) => { const i = fall.pieces.findIndex(p => p.id === id), p = fall.pieces[i], w = F.worldOf(fall, i, [0.5 * (p.x0 + p.x1), 0, GI.Z_NA]); return { X: w[0] - fall.breakAt[0], Y: w[1] - fall.breakAt[1], word: word(p.q) }; };
  const ev = (id, pc) => fall.events.find(e => e.id === id && e.piece === pc);
  const bw = at('bow'), st = at('stern'), us = ev('under', 'stern'), sb = ev('strike', 'bow'), ss = ev('strike', 'stern');
  const rep = fall.events.filter(e => e.id === 'report'), atOnce = rep.filter(e => e.t <= fall.t0 + 1e-9).length, after = us ? rep.filter(e => e.t >= us.t).length : 0;
  console.log(String(area).padStart(8) + ' | ' + f(cd, 2) + ' | ' + f(Math.hypot(bw.X, bw.Y), 0) + ' (' + f(bw.X, 0) + ', ' + f(bw.Y, 0) + '), ' + bw.word + ', +' + f(sb ? (sb.t - fall.t0) / 60 : NaN, 2) + ' min | '
    + f(Math.hypot(st.X, st.Y), 0) + ' (' + f(st.X, 0) + ', ' + f(st.Y, 0) + '), ' + st.word + ', under +' + f(us ? us.t - fall.t0 : NaN, 1) + ' s, +' + f(ss ? (ss.t - fall.t0) / 60 : NaN, 2) + ' min | '
    + f(Math.hypot(bw.X - st.X, bw.Y - st.Y), 0) + ' | ' + rep.length + ' (' + atOnce + ', ' + after + ') | ' + air.join(', ') + ' | ' + f((cpu.user + cpu.system) / 1e6, 0) + (fall.done ? '' : ' NOT DONE'));
}
