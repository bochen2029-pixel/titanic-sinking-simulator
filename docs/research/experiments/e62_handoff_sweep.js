'use strict';
// e62: how the landing hangs on the hand-off moment (Z1, 2026-11-20, for the coordinator). The 1912 damage preset's
// model (S1, the mainline's tiers) is run to each moment, T 155.25 to the flag a quarter-minute apart, and cut at x -23
// (TitanicFall.begin, H1). The tiers' share of the section is 0 (K.tiersFlow, D52), the levers 0 (untuned).
// For each moment and piece: the state at the hand-off, when it is wholly under, and where it lies on the bed. The bow's
// track every 10 s is printed for the moments traced.
// Found on 2026-11-20:
//   - the stern is steady: 82 to 152 m from breakAt (R5: 148), upright from every moment up to 156.75 and upside down
//     from 157.0 and the flag;
//   - the bow's distance is steady, 1,279 to 1,562 m (twice R5's 772), but not its bearing. That swings by the
//     quarter-minute (forward, aft, sideways): cut free afloat, it stands on its nose within 10 s, and whether it tips
//     past the vertical sets its whole glide.
//   node docs/research/experiments/e62_handoff_sweep.js [--root <tree>] [--moments flag,157.0,...] [--trace flag,156.0,155.5] [--cut <x>] [--tag <name>] [--write]
// --cut: where she is cut (default TitanicGirder.X_BREAK, -23); --tag: the output is e62_handoff_sweep_<tag>.txt
// Output of 2026-11-20: results_2026-11-20/e62_handoff_sweep.txt; at B2's onset on S1 (T 155.01, step 37202, given as
// 155.0083333333 so that the hand-over is that step) beside T 155.25, cut at -10.93 and -23: e62_handoff_sweep_onset_cut-10.93.txt
// and _onset_cut-23.txt
const fs = require('fs'), path = require('path');
const argv = process.argv.slice(2), WRITE = argv.includes('--write'), ri = argv.indexOf('--root'), mi = argv.indexOf('--moments'), ti = argv.indexOf('--trace'), xi = argv.indexOf('--cut'), gi = argv.indexOf('--tag');
const ROOT = ri >= 0 ? path.resolve(argv[ri + 1]) : path.resolve(__dirname, '../../..');
const MOM = (mi >= 0 ? argv[mi + 1] : 'flag,157.0,156.75,156.5,156.25,156.0,155.75,155.5,155.25').split(',');
const TR = (ti >= 0 ? argv[ti + 1] : 'flag,156.0,155.5').split(',').filter(Boolean);
const C = require(path.join(ROOT, 'core/core.js')), SC = require(path.join(ROOT, 'core/scenarios.js'));
const GI = require(path.join(ROOT, 'core/readers/girder.js')), F = require(path.join(ROOT, 'core/readers/fall.js'));
const CUT = xi >= 0 ? +argv[xi + 1] : GI.X_BREAK, TAG = gi >= 0 ? '_' + argv[gi + 1] : '';
const out = [], say = (s) => { s = s === undefined ? '' : s; out.push(s); console.log(s); };
const f = (x, n) => (x === null || x === undefined || !isFinite(x) ? 'n/a' : x.toFixed(n === undefined ? 1 : n));
const DEG = 180 / Math.PI, ship = C.buildShip();
const att = (q) => { const R = F.quatR(q, new Float64Array(9)); return { pitch: Math.atan2(-R[6], Math.sqrt(R[7] * R[7] + R[8] * R[8])) * DEG, roll: Math.atan2(R[7], R[8]) * DEG, yaw: Math.atan2(R[3], R[0]) * DEG }; };
say('e62: the hand-off sweep, cut at x ' + CUT + ', the tiers\' share 0, untuned');
say('tree: ' + (ri >= 0 ? path.basename(ROOT) + ' (given by --root)' : 'this repository'));
for (const m of MOM) {
  const T = m === 'flag' ? null : +m, sim = C.createSim(ship, {}, SC.PRESETS.titanic.build());
  if (T === null) { while (!sim.foundered) C.step(sim); } else { while (!sim.foundered && sim.t < T * 60 - 1e-9) C.step(sim); }
  const fall = F.begin(sim, { any: true, cut: CUT, K: { tiersFlow: 0 } }), ba = fall.breakAt;
  const where = (i) => { const p = fall.pieces[i]; return F.worldOf(fall, i, [0.5 * (p.x0 + p.x1), 0, GI.Z_NA]); };
  const st = fall.pieces.map((p, i) => ({ state0: p.state, top0: fall.eng.bodies[i].top, tUnder: p.state === 'afloat' ? null : 0 }));
  const bi = fall.pieces.findIndex(p => p.id === 'bow'), trace = [], traced = TR.includes(m);
  const tr = () => { const p = fall.pieces[bi], a = att(p.q), w = where(bi); trace.push(f(fall.t - fall.t0, 0) + 's ' + p.state + ' pitch ' + f(a.pitch, 0) + ' roll ' + f(a.roll, 0) + ' yaw ' + f(a.yaw, 0) + ' Z ' + f(w[2], 0) + ' along ' + f(w[0] - ba[0], 0) + ' across ' + f(w[1] - ba[1], 0)); };
  if (traced) tr();
  for (let k = 0; k < 40 * 240 && !fall.done; k++) {
    F.advance(fall);
    fall.pieces.forEach((p, i) => { if (st[i].tUnder === null && !(fall.eng.bodies[i].top > 0)) st[i].tUnder = fall.t - fall.t0; });
    if (traced && k % 40 === 39 && !fall.eng.bodies[bi].struck) tr();
  }
  const head = (T === null ? 'the flag' : 'T ' + f(T, 2)) + ' (T ' + f(fall.t0 / 60, 2) + ', trim ' + f(sim.pitch * DEG, 1) + ', list ' + f(-sim.roll * DEG, 1) + ')';
  fall.pieces.forEach((p, i) => {
    const a = att(p.q), w = where(i), dX = w[0] - ba[0], dY = w[1] - ba[1], s = st[i], strike = fall.events.find(e => e.id === 'strike' && e.piece === p.id);
    say(head.padEnd(42) + p.id.padEnd(6) + ' ' + String(s.state0).padEnd(8) + ' top ' + f(s.top0, 1).padStart(6) + ' m | under ' + (s.tUnder === null ? 'NEVER' : '+' + f(s.tUnder, 1) + ' s').padEnd(9) + ' | bed +' + f(strike ? (strike.t - fall.t0) / 60 : NaN, 2) + ' min, pitch ' + f(a.pitch, 1) + ', roll ' + f(a.roll, 1) + ', ' + f(Math.sqrt(dX * dX + dY * dY), 0) + ' m (along ' + f(dX, 0) + ', across ' + f(dY, 0) + ')' + (fall.done ? '' : ' NOT DONE'));
  });
  const W = fall.pieces.map((p, i) => where(i)), sb = fall.pieces.findIndex(p => p.id === 'stern');
  say(''.padEnd(42) + 'bow to stern ' + f(Math.hypot(W[bi][0] - W[sb][0], W[bi][1] - W[sb][1]), 0) + ' m');
  if (traced) say('  the bow, every 10 s to the bed:\n    ' + trace.join('\n    '));
}
if (WRITE) { const d = path.join(__dirname, 'results_2026-11-20'); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, 'e62_handoff_sweep' + TAG + '.txt'), out.join('\n') + '\n'); }
