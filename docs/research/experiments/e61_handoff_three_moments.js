'use strict';
// e61: the hand-off from three moments (Z1, 2026-11-20, for the coordinator). The 1912 damage preset's model (S1, the
// mainline's tiers) is run to each moment and cut at x -23 (TitanicFall.begin, H1). The tiers' share of the section is
// 0 (K.tiersFlow, D52), the levers 0 (untuned). The moments are the flag, T 156.0, and the onset of the break (T 155.5
// until B1+B2 gives its step).
// For each piece: its state at the hand-off (afloat or under, its top, its air, its vent); when it is wholly under and how
// much air it has vented by then; where it lies on the bed (pitch, roll, distance from breakAt). The sterns' first two
// minutes, every 5 s.
// Found on 2026-11-20:
//   - the stern lands 82 to 148 m from breakAt; upright from 156.0 and 155.5, upside down from the flag;
//   - its time to wholly under (37 to 52 s) is the vent stand-in's: air through fOpen x length under a fixed 5 m head;
//   - the bow lands 1,279 to 1,474 m out, upside down from 155.5.
//   node docs/research/experiments/e61_handoff_three_moments.js [--root <tree>] [--onset <minutes>] [--cut <x>] [--tag <name>] [--write]
// --cut: where she is cut (default TitanicGirder.X_BREAK, -23); --tag: the output is e61_handoff_three_moments_<tag>.txt
// Output of 2026-11-20: results_2026-11-20/e61_handoff_three_moments.txt; at B2's onset on S1 (T 155.01, step 37202),
// cut at -10.93 and -23: e61_handoff_three_moments_onset_cut-10.93.txt and _onset_cut-23.txt
const fs = require('fs'), path = require('path');
const argv = process.argv.slice(2), WRITE = argv.includes('--write'), ri = argv.indexOf('--root'), oi = argv.indexOf('--onset'), xi = argv.indexOf('--cut'), gi = argv.indexOf('--tag');
const ROOT = ri >= 0 ? path.resolve(argv[ri + 1]) : path.resolve(__dirname, '../../..'), ONSET = oi >= 0 ? +argv[oi + 1] : 155.5;
const C = require(path.join(ROOT, 'core/core.js')), SC = require(path.join(ROOT, 'core/scenarios.js'));
const GI = require(path.join(ROOT, 'core/readers/girder.js')), F = require(path.join(ROOT, 'core/readers/fall.js'));
const CUT = xi >= 0 ? +argv[xi + 1] : GI.X_BREAK, TAG = gi >= 0 ? '_' + argv[gi + 1] : '';
const out = [], say = (s) => { s = s === undefined ? '' : s; out.push(s); console.log(s); };
const f = (x, n) => (x === null || x === undefined || !isFinite(x) ? 'n/a' : x.toFixed(n === undefined ? 1 : n));
const DEG = 180 / Math.PI, ship = C.buildShip();
say('e61: the hand-off from three moments, cut at x ' + CUT + ', the tiers\' share 0, untuned');
say('tree: ' + (ri >= 0 ? path.basename(ROOT) + ' (given by --root)' : 'this repository'));
// the model's own path: trim and list at the checkpoints, and the flag
const path1 = C.createSim(ship, {}, SC.PRESETS.titanic.build()), checks = [155.0, 155.5, 156.0, 156.5, 157.0];
let ci = 0;
while (!path1.foundered) {
  C.step(path1);
  if (ci < checks.length && path1.t >= checks[ci] * 60 - 1e-9) { say('the model at T ' + f(path1.t / 60, 2) + ': trim ' + f(path1.pitch * DEG, 1) + ', list ' + f(-path1.roll * DEG, 1) + ' to port'); ci++; }
}
say('the flag at T ' + f(path1.founderT / 60, 2));
const att = (q) => { const R = F.quatR(q, new Float64Array(9)); return { pitch: Math.atan2(-R[6], Math.sqrt(R[7] * R[7] + R[8] * R[8])) * DEG, roll: Math.atan2(R[7], R[8]) * DEG }; };
const moments = [['the flag', null], ['T 156.0', 156.0], ['T ' + f(ONSET, 2) + ' (the onset)', ONSET]];
const rows = [];
for (const [label, T] of moments) {
  const sim = C.createSim(ship, {}, SC.PRESETS.titanic.build());
  if (T === null) { while (!sim.foundered) C.step(sim); } else { while (!sim.foundered && sim.t < T * 60 - 1e-9) C.step(sim); }
  const fall = F.begin(sim, { any: true, cut: CUT, K: { tiersFlow: 0 } });
  const st = fall.pieces.map((p, i) => { const b = fall.eng.bodies[i]; return { state0: p.state, top0: b.top, air0: p.air, a0: b.air ? b.air.a : 0, vent: b.vent, tUnder: p.state === 'afloat' ? null : 0, aUnder: null, vUnder: null, trace: [] }; });
  for (let k = 0; k < 40 * 240 && !fall.done; k++) {
    F.advance(fall);
    fall.pieces.forEach((p, i) => {
      const s = st[i], b = fall.eng.bodies[i], tt = fall.t - fall.t0;
      if (s.tUnder === null && !(b.top > 0)) { s.tUnder = tt; s.aUnder = b.air ? b.air.a : 0; s.vUnder = p.air; }
      if (k % 20 === 19 && tt <= 120.01) s.trace.push(f(tt, 0) + 's top ' + f(b.top, 1) + ' air ' + f(p.air, 0) + ' (' + f(b.air ? b.air.a : 0, 0) + ' at 1 atm) roll ' + f(att(p.q).roll, 0));
    });
  }
  fall.pieces.forEach((p, i) => {
    const s = st[i], w = F.worldOf(fall, i, [0.5 * (p.x0 + p.x1), 0, GI.Z_NA]), ba = fall.breakAt, dX = w[0] - ba[0], dY = w[1] - ba[1], a = att(p.q);
    const strike = fall.events.find(e => e.id === 'strike' && e.piece === p.id);
    rows.push({ label, T0: fall.t0 / 60, trim0: sim.pitch * DEG, list0: -sim.roll * DEG, id: p.id, state0: s.state0, top0: s.top0, air0: s.air0, a0: s.a0, vent: s.vent, tUnder: s.tUnder, aUnder: s.aUnder, vUnder: s.vUnder,
      pitch: a.pitch, roll: a.roll, dist: Math.sqrt(dX * dX + dY * dY), along: dX, across: dY, tBed: strike ? (strike.t - fall.t0) / 60 : NaN, done: fall.done, trace: s.trace });
  });
}
for (const r of rows) {
  say(r.label.padEnd(22) + 'T ' + f(r.T0, 2) + ' (trim ' + f(r.trim0, 1) + ', list ' + f(r.list0, 1) + ') ' + r.id.padEnd(6) + ' at hand-off ' + r.state0 + ', top ' + f(r.top0, 1) + ' m, air ' + f(r.air0, 0) + ' m3 (' + f(r.a0, 0) + ' at 1 atm), vent ' + f(r.vent, 2) + ' m2'
    + ' | wholly under ' + (r.tUnder === null ? 'NEVER' : '+' + f(r.tUnder, 1) + ' s, then ' + f(r.vUnder, 0) + ' m3 of air left (' + f(r.aUnder, 0) + ' at 1 atm: ' + f(r.a0 > 0 ? 100 * (r.a0 - r.aUnder) / r.a0 : 0, 0) + ' % vented)')
    + ' | on the bed +' + f(r.tBed, 2) + ' min, pitch ' + f(r.pitch, 1) + ', roll ' + f(r.roll, 1) + ', ' + f(r.dist, 0) + ' m (along ' + f(r.along, 0) + ', across ' + f(r.across, 0) + ')' + (r.done ? '' : ' NOT DONE'));
}
say('');
say('the sterns\' first two minutes (every 5 s):');
for (const r of rows) if (r.id === 'stern') say(r.label + ': ' + r.trace.join(' | '));
if (WRITE) { const d = path.join(__dirname, 'results_2026-11-20'); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, 'e61_handoff_three_moments' + TAG + '.txt'), out.join('\n') + '\n'); }
