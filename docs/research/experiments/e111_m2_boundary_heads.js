'use strict';
// e111: the fall with Z6's spaces giving way boundary by boundary (K.air 'spaces', K.fail 'boundaries': section 5's
// fuller form, a what-if) on the 1912 preset at its flag, each boundary's head at the two ends of the design v1's band,
// one at a time, the others at their bets (Z1, 2026-11-21; M2 step 4d). The bets and bands, m of sea water: the shell 40
// (20 to 60), a bulkhead 15 (8 to 30), E deck loaded from below 5 (2 to 10), from above 15 (v1 has none: a bulkhead's
// band, 8 to 30), joiner work 2 (1 to 3.5). Per run: where each piece lands from the point under the break and which way
// up, when the stern is under, when each strikes, the reports (at the hand-over; at or after the stern is under, the
// first of them), the failures by kind, the CPU. The record: the bow 772 m and the stern 148 m from the point under the
// break (R5 10a); the reports about four, the first 0 to 60 s after she is under (R5 10b).
//   node docs/research/experiments/e111_m2_boundary_heads.js
// Output of 2026-11-21 (its stdout): results_2026-11-21/e111_m2_boundary_heads.txt
const path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..');
const C = require(path.join(ROOT, 'core/core.js')), SC = require(path.join(ROOT, 'core/scenarios.js'));
for (const r of ['girder.js', 'section.js', 'onset.js']) require(path.join(ROOT, 'core/readers', r));
const F = require(path.join(ROOT, 'core/readers/fall.js')), GI = require(path.join(ROOT, 'core/readers/girder.js'));
const DEG = Math.PI / 180;
const f = (v, d) => Number.isFinite(v) ? v.toFixed(d) : String(v);
const word = (q) => { const R = F.quatR(q, new Float64Array(9)), roll = Math.abs(Math.atan2(R[7], R[8]) / DEG); return roll <= 45 ? 'upright' : (roll >= 135 ? 'upside down' : 'on her side'); };
const RUNS = [['the bets', {}],
  ['shell 20', { headShell: 20 }], ['shell 60', { headShell: 60 }],
  ['bulkhead 8', { headBulkhead: 8 }], ['bulkhead 30', { headBulkhead: 30 }],
  ['deck from below 2', { headDeckBelow: 2 }], ['deck from below 10', { headDeckBelow: 10 }],
  ['deck from above 8', { headDeckAbove: 8 }], ['deck from above 30', { headDeckAbove: 30 }],
  ['joiner 1', { headJoiner: 1 }], ['joiner 3.5', { headJoiner: 3.5 }]];

const simF = C.createSim(C.buildShip(), {}, SC.PRESETS.titanic.build());
while (!simF.foundered) C.step(simF);
console.log('the 1912 preset at its flag (T ' + f(simF.founderT / 60, 2) + ' min), K.air \'spaces\', K.fail \'boundaries\'');
console.log('run | bow: m (along, across), way up, strikes | stern: m (along, across), way up, under, strikes | reports (at the hand-over; after the stern is under, the first) | failures with air by kind (bow; stern) | CPU s');
for (const [label, xk] of RUNS) {
  const c0 = process.cpuUsage(), fall = F.begin(simF, { K: Object.assign({ air: 'spaces', fail: 'boundaries' }, xk) });
  while (!fall.done && fall.t - fall.t0 < 7200) F.advance(fall);
  const cpu = process.cpuUsage(c0);
  const ev = (id, pc) => fall.events.find(e => e.id === id && e.piece === pc), us = ev('under', 'stern');
  const at = (id) => { const i = fall.pieces.findIndex(p => p.id === id), p = fall.pieces[i], w = F.worldOf(fall, i, [0.5 * (p.x0 + p.x1), 0, GI.Z_NA]); return { X: w[0] - fall.breakAt[0], Y: w[1] - fall.breakAt[1], word: word(p.q) }; };
  const bw = at('bow'), st = at('stern'), sb = ev('strike', 'bow'), ss = ev('strike', 'stern');
  const rep = fall.events.filter(e => e.id === 'report'), atOnce = rep.filter(e => e.t <= fall.t0 + 1e-9).length, after = us ? rep.filter(e => e.t >= us.t) : [];
  const kinds = fall.eng.bodies.map(b => { const k = {}; for (const e of b.spc.ev) if (e.energy > 1e6) k[e.boundary || 'shell'] = (k[e.boundary || 'shell'] || 0) + 1; return Object.entries(k).map(([a, c]) => a + ' ' + c).join(', '); });
  console.log(label.padEnd(18) + ' | ' + f(Math.hypot(bw.X, bw.Y), 0) + ' (' + f(bw.X, 0) + ', ' + f(bw.Y, 0) + '), ' + bw.word + ', +' + f(sb ? (sb.t - fall.t0) / 60 : NaN, 2) + ' min | '
    + f(Math.hypot(st.X, st.Y), 0) + ' (' + f(st.X, 0) + ', ' + f(st.Y, 0) + '), ' + st.word + ', under +' + f(us ? us.t - fall.t0 : NaN, 1) + ' s, +' + f(ss ? (ss.t - fall.t0) / 60 : NaN, 2) + ' min | '
    + rep.length + ' (' + atOnce + '; ' + after.length + (after.length ? ', +' + f(after[0].t - us.t, 1) + ' s after' : '') + ') | ' + kinds.join('; ') + ' | ' + f((cpu.user + cpu.system) / 1e6, 0) + (fall.done ? '' : ' NOT DONE'));
}
