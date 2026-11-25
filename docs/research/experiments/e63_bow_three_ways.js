'use strict';
// e63: the bow released three ways (Z1, 2026-11-20, the coordinator's diagnostic). From the hand-off at T 155.5 (and
// T 156.0, summary lines only), cut at x -23, the tiers' share 0, untuned. The bow is let go three ways:
//   (a) as the hand-off has it;
//   (b) with its air taken out (every space full: air 0);
//   (c) with its air kept and its vent shut (vent 0).
// The stern is released as the hand-off has it each time; it does not touch the bow.
// Printed every 5 s for 90 s (the moments in full):
//   - pitch, and nose (her nose's angle below the horizontal in the vertical plane of her first heading; over 90 she has
//     tipped past the vertical; ill-set once she has yawed far);
//   - roll and heading;
//   - speed (her centre of mass's, through the water) and depth (her lowest point);
//   - top (her highest point above the sea) and air.
// Then where she lands.
// Found on 2026-11-20: the air is the lever.
//   - (b) never stands on its nose: under in 4 s, flat by 30 s, falling at 9.0 m/s. It lands upright 724 m (792 from
//     156.0) dead ahead, against R5's 772, untuned.
//   - (a) and (c) stand on their noses in 10 to 15 s, dive at up to 31 m/s, and land 1.3 to 1.5 km off.
//   - With the vent shut it sinks from 155.5 but floats on end from 156.0: her air is about what floats her.
//   node docs/research/experiments/e63_bow_three_ways.js [--root <tree>] [--moments 155.5,156.0] [--full 155.5] [--write]
// Output of 2026-11-20: results_2026-11-20/e63_bow_three_ways.txt
const fs = require('fs'), path = require('path');
const argv = process.argv.slice(2), WRITE = argv.includes('--write'), ri = argv.indexOf('--root'), mi = argv.indexOf('--moments'), fi = argv.indexOf('--full');
const ROOT = ri >= 0 ? path.resolve(argv[ri + 1]) : path.resolve(__dirname, '../../..');
const MOM = (mi >= 0 ? argv[mi + 1] : '155.5,156.0').split(',').map(Number), FULL = (fi >= 0 ? argv[fi + 1] : '155.5').split(',').map(Number);
const C = require(path.join(ROOT, 'core/core.js')), SC = require(path.join(ROOT, 'core/scenarios.js'));
const GI = require(path.join(ROOT, 'core/readers/girder.js')), F = require(path.join(ROOT, 'core/readers/fall.js'));
const out = [], say = (s) => { s = s === undefined ? '' : s; out.push(s); console.log(s); };
const f = (x, n) => (x === null || x === undefined || !isFinite(x) ? 'n/a' : x.toFixed(n === undefined ? 1 : n));
const DEG = 180 / Math.PI, ship = C.buildShip();
const att = (q) => { const R = F.quatR(q, new Float64Array(9)); return { pitch: Math.atan2(-R[6], Math.sqrt(R[7] * R[7] + R[8] * R[8])) * DEG, roll: Math.atan2(R[7], R[8]) * DEG, yaw: Math.atan2(R[3], R[0]) * DEG, nose: Math.atan2(-R[6], R[0]) * DEG }; };
const ways = [['(a) as now', {}], ['(b) its air taken out at the hand-off (every space full)', { air: { bow: 0 } }], ['(c) its air kept, its vent shut', { vent: { bow: 0 } }]];
say('e63: the bow released three ways, cut at x ' + GI.X_BREAK + ', the tiers\' share 0, untuned');
say('tree: ' + (ri >= 0 ? path.basename(ROOT) + ' (given by --root)' : 'this repository'));
const sim = C.createSim(ship, {}, SC.PRESETS.titanic.build());
for (const TM of MOM.slice().sort((x, y) => x - y)) {
  while (!sim.foundered && sim.t < TM * 60 - 1e-9) C.step(sim);
  const full = FULL.some(x => Math.abs(x - TM) < 1e-9);
  say('');
  say('==== the hand-off at T ' + f(sim.t / 60, 2) + ': trim ' + f(sim.pitch * DEG, 1) + ', list ' + f(-sim.roll * DEG, 1) + ' to port' + (sim.foundered ? ' (foundered)' : ''));
  for (const [label, o] of ways) {
    // begin reads the sim and writes only sim.fall: the three releases start from the same state
    const fall = F.begin(sim, Object.assign({ any: true, K: { tiersFlow: 0 } }, o)), ba = fall.breakAt;
    const i = fall.pieces.findIndex(p => p.id === 'bow'), b = fall.eng.bodies[i], rows = [];
    const where = () => { const p = fall.pieces[i]; return F.worldOf(fall, i, [0.5 * (p.x0 + p.x1), 0, GI.Z_NA]); };
    const row = () => {
      const p = fall.pieces[i], a = att(p.q), w = where();
      rows.push(f(fall.t - fall.t0, 0).padStart(3) + ' s ' + p.state.padEnd(8) + ' pitch ' + f(a.pitch, 0).padStart(4) + ' nose ' + f(a.nose, 0).padStart(4) + ' roll ' + f(a.roll, 0).padStart(5) + ' heading ' + f(a.yaw, 0).padStart(5)
        + ' speed ' + f(p.speed, 2).padStart(5) + ' depth ' + f(p.depth, 0).padStart(5) + ' top ' + f(b.top, 1).padStart(6) + ' air ' + f(p.air, 0).padStart(6) + ' (' + f(b.air ? b.air.a : 0, 0) + ' at 1 atm) along ' + f(w[0] - ba[0], 0) + ' across ' + f(w[1] - ba[1], 0));
    };
    const air0 = b.air ? b.air.a : 0, state0 = fall.pieces[i].state, top0 = b.top;
    let tUnder = state0 === 'afloat' ? null : 0, maxNose = att(fall.pieces[i].q).nose, tMax = 0, maxPitch = att(fall.pieces[i].q).pitch;
    if (full) row();
    for (let k = 0; k < 40 * 240 && fall.pieces[i].state !== 'at rest' && !fall.done; k++) {
      F.advance(fall);
      const tt = fall.t - fall.t0, a = att(fall.pieces[i].q);
      if (tUnder === null && !(b.top > 0)) tUnder = tt;
      if (tt <= 120.01) { if (a.nose > maxNose) { maxNose = a.nose; tMax = tt; } if (a.pitch > maxPitch) maxPitch = a.pitch; }
      if (full && k % 20 === 19 && tt <= 90.01) row();
    }
    const p = fall.pieces[i], a = att(p.q), w = where(), dX = w[0] - ba[0], dY = w[1] - ba[1];
    const strike = fall.events.find(e => e.id === 'strike' && e.piece === p.id);
    say('');
    say(label + ' (T ' + f(TM, 2) + '): at the hand-off ' + state0 + ', top ' + f(top0, 1) + ' m, vent ' + f(b.vent, 2) + ' m2, air ' + f(air0, 0) + ' m3 at 1 atm; wholly under ' + (tUnder === null ? 'NEVER' : '+' + f(tUnder, 1) + ' s')
      + '; in the first 120 s her pitch reached ' + f(maxPitch, 0) + ' deg, her nose ' + f(maxNose, 0) + ' deg (at +' + f(tMax, 0) + ' s: ' + (maxNose > 90 ? 'past the vertical' : 'not past the vertical') + ')');
    if (full) say('  ' + rows.join('\n  '));
    say('  on the bed +' + f(strike ? (strike.t - fall.t0) / 60 : NaN, 2) + ' min at ' + f(strike ? strike.speed : NaN, 2) + ' m/s; pitch ' + f(a.pitch, 1) + ', roll ' + f(a.roll, 1) + ', heading ' + f(a.yaw, 0) + '; '
      + f(Math.sqrt(dX * dX + dY * dY), 0) + ' m from breakAt (along ' + f(dX, 0) + ', across ' + f(dY, 0) + ')' + (p.state === 'at rest' ? '' : ' [state ' + p.state + ']'));
  }
}
if (WRITE) { const d = path.join(__dirname, 'results_2026-11-20'); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, 'e63_bow_three_ways.txt'), out.join('\n') + '\n'); }
