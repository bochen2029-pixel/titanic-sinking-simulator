'use strict';
// e65: the cut as a vent with its exit slowed (Z1, 2026-11-20). It is e64's what-if (in memory; fall.js is not changed)
// with the cut's area scaled by K.cutScale: x1, x1/3, x1/10, x1/30 and x1/100. The question: is there one rate at which
// the bow loses its air before it stands on its nose and the stern keeps its air a minute?
// From T 155.5 and 156.0, both pieces, the tiers' share 0, untuned.
// Found on 2026-11-20: no.
//   - the bow lands within about 900 m only if its air is out within about 4 s (a tenth of the section or more);
//   - with its cut open the stern never lasts past 27 s at any rate, against 45 to 51 s with the deck vent alone;
//   - x1/30 is near the water's own inflow limit (air passes the same opening about 29 times faster): there the bow
//     lands 905 to 1,060 m off and the stern goes in 13 to 16 s.
//   node docs/research/experiments/e65_cut_as_vent_rates.js [--root <tree>] [--moments 155.5,156.0] [--scales 1,0.333,...] [--write]
// Output of 2026-11-20: results_2026-11-20/e65_cut_as_vent_rates.txt
const fs = require('fs'), path = require('path');
const { loadWithCutVent } = require('./e64_cut_as_vent.js');
const argv = process.argv.slice(2), WRITE = argv.includes('--write'), ri = argv.indexOf('--root'), mi = argv.indexOf('--moments'), si0 = argv.indexOf('--scales');
const ROOT = ri >= 0 ? path.resolve(argv[ri + 1]) : path.resolve(__dirname, '../../..');
const MOM = (mi >= 0 ? argv[mi + 1] : '155.5,156.0').split(',').map(Number);
const SCL = (si0 >= 0 ? argv[si0 + 1] : '1,0.3333333333333333,0.1,0.03333333333333333,0.01').split(',').map(Number);
const C = require(path.join(ROOT, 'core/core.js')), SC = require(path.join(ROOT, 'core/scenarios.js'));
const GI = require(path.join(ROOT, 'core/readers/girder.js')), F = loadWithCutVent(ROOT);
const out = [], say = (s) => { s = s === undefined ? '' : s; out.push(s); console.log(s); };
const f = (x, n) => (x === null || x === undefined || !isFinite(x) ? 'n/a' : x.toFixed(n === undefined ? 1 : n));
const DEG = 180 / Math.PI, ship = C.buildShip();
const att = (q) => { const R = F.quatR(q, new Float64Array(9)); return { pitch: Math.atan2(-R[6], Math.sqrt(R[7] * R[7] + R[8] * R[8])) * DEG, roll: Math.atan2(R[7], R[8]) * DEG }; };
say('e65: the cut as a vent at five rates (e64\'s what-if), cut at x ' + GI.X_BREAK + ', the tiers\' share 0, untuned');
say('tree: ' + (ri >= 0 ? path.basename(ROOT) + ' (given by --root)' : 'this repository'));
const sim = C.createSim(ship, {}, SC.PRESETS.titanic.build());
for (const TM of MOM.slice().sort((x, y) => x - y)) {
  while (!sim.foundered && sim.t < TM * 60 - 1e-9) C.step(sim);
  say('');
  say('==== the hand-off at T ' + f(sim.t / 60, 2) + ': trim ' + f(sim.pitch * DEG, 1) + ', list ' + f(-sim.roll * DEG, 1) + ' to port');
  for (const cutScale of SCL) {
    const fall = F.begin(sim, { any: true, K: { tiersFlow: 0, cutVent: 1, cutScale } }), ba = fall.breakAt;
    const where = (i) => { const p = fall.pieces[i]; return F.worldOf(fall, i, [0.5 * (p.x0 + p.x1), 0, GI.Z_NA]); };
    const st = fall.pieces.map((p, i) => { const b = fall.eng.bodies[i]; return { id: p.id, a0: b.air ? b.air.a : 0, pz: b.air ? b.air.p[2] : NaN, px: b.air ? b.air.p[0] : NaN, tUnder: p.state === 'afloat' ? null : 0, aUnder: null, tCut: null, tGone: null, maxPitch: -1e9 }; });
    for (let k = 0; k < 40 * 240 && !fall.done; k++) {
      F.advance(fall);
      const tt = fall.t - fall.t0;
      fall.pieces.forEach((p, i) => {
        const s = st[i], b = fall.eng.bodies[i], a = att(p.q);
        if (s.tCut === null && b.ventCut > 0) s.tCut = tt;
        if (s.tGone === null && b.air && !(b.air.a > 0)) s.tGone = tt;
        if (s.tUnder === null && !(b.top > 0)) { s.tUnder = tt; s.aUnder = b.air ? b.air.a : 0; }
        if (tt <= 120.01 && a.pitch > s.maxPitch) s.maxPitch = a.pitch;
      });
    }
    const L = fall.pieces.map((p, i) => { const w = where(i); return { dX: w[0] - ba[0], dY: w[1] - ba[1] }; });
    const bi = fall.pieces.findIndex(p => p.id === 'bow'), si = fall.pieces.findIndex(p => p.id === 'stern');
    say('');
    say('-- the cut\'s area x ' + f(cutScale, 4) + ' (' + f(fall.eng.bodies[bi].cut.A * cutScale, 1) + ' m2): bow to stern ' + f(Math.hypot(L[bi].dX - L[si].dX, L[bi].dY - L[si].dY), 0) + ' m');
    fall.pieces.forEach((p, i) => {
      const s = st[i], b = fall.eng.bodies[i], a = att(p.q), l = L[i], strike = fall.events.find(e => e.id === 'strike' && e.piece === p.id);
      say('  ' + p.id.padEnd(6) + 'pocket at x ' + f(s.px, 1) + ', z ' + f(s.pz, 1) + ' (the cut\'s centre z ' + f(b.cut.p[2], 1) + ') | the cut first vents ' + (s.tCut === null ? 'never' : '+' + f(s.tCut, 2) + ' s, head ' + f(b.cutH0, 2) + ' m')
        + ' | air gone ' + (s.tGone === null ? 'never' : '+' + f(s.tGone, 1) + ' s') + ' | wholly under ' + (s.tUnder === null ? 'NEVER' : '+' + f(s.tUnder, 1) + ' s (' + f(s.a0 > 0 ? 100 * (s.a0 - s.aUnder) / s.a0 : NaN, 0) + ' % gone)')
        + ' | pitch reached ' + f(s.maxPitch, 0) + ' | bed +' + f(strike ? (strike.t - fall.t0) / 60 : NaN, 2) + ' min, pitch ' + f(a.pitch, 1) + ', roll ' + f(a.roll, 1) + '; ' + f(Math.hypot(l.dX, l.dY), 0) + ' m (along ' + f(l.dX, 0) + ', across ' + f(l.dY, 0) + ')' + (fall.done ? '' : ' NOT DONE'));
    });
  }
}
if (WRITE) { const d = path.join(__dirname, 'results_2026-11-20'); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, 'e65_cut_as_vent_rates.txt'), out.join('\n') + '\n'); }
