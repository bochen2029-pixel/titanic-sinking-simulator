'use strict';
// e121 (Z1, 2026-11-24, with the mainline's e120): the record's watertight doors in the stern's fall. e120 put the
// record's schedule on the 1912 watch as logged orders (G, H, J and K raised by hand at T+30, L, M, N and O at T+62, the
// floats armed as the plant arms them): the same night to the bit up to the onset, with J to O open at the break into
// the stern's dry rooms. The fall's spaces take each door as the core has it at the hand-over; K.floats (fall.js,
// spaces.doorsOf and doorsStep) says what then: 'core' (the default) the core's floats mirrored, a door released once
// water stands params.floatDepth over a floor either side of its bulkhead and shut params.doorFall later; 'none' each
// door as handed over, open to the bed (e120's held-open bracket). Member C's watch with that schedule, handed over at
// its onset (the cut there), K.air 'spaces' with the tree's limiter, each way to the stern's time under or --secs: which
// doors are open at the hand-over, when the fall's floats release and shut them, the stern's water, pose and failures
//   node docs/research/experiments/e121_z6_record_doors.js [--secs 600]
// Prints its table (results_2026-11-24/e121_z6_record_doors.txt is a run of it); writes nothing.
const path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..');
const C = require(path.join(ROOT, 'core/core.js')), N = require(path.join(ROOT, 'core/night.js'));
for (const r of ['girder.js', 'section.js', 'onset.js']) require(path.join(ROOT, 'core/readers', r));
const F = require(path.join(ROOT, 'core/readers/fall.js'));
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const SECS = Number(arg('--secs', 600));
const f = (v, d) => (Number.isFinite(v) ? v.toFixed(d) : String(v)), DEG = 180 / Math.PI, T0 = Date.now();
const bulk = (id) => C.BULKHEADS.findIndex(x => x.id === id), idB = (i) => C.BULKHEADS[i].id;
const RAISE = [{ T: 30, b: 'GHJK'.split('').map(bulk) }, { T: 62, b: 'LMNO'.split('').map(bulk) }];
if (F.K0.floats === undefined) { console.log('e121: K.floats is not in this tree'); process.exit(1); }
const sim = N.create(C.buildShip(), N.spec(1912), { auto: true, readers: false, handover: 'onset' });
let next = 0;
while (!N.over(sim)) {
  N.step(sim);
  const tt = sim.night.tTouch; if (tt < 0) continue;
  const T = (sim.t - tt) / 60;
  while (next < RAISE.length && T >= RAISE[next].T) { for (const b of RAISE[next].b) N.door(sim, b, true); next++; }
}
const fd = sim.night.onset.found;
console.log('e121: the record\'s doors in the stern\'s fall; K.limiter ' + JSON.stringify(F.K0.limiter) + ', K.floats default ' + JSON.stringify(F.K0.floats));
console.log('the onset at T+' + f((fd.t - sim.night.tTouch) / 60, 2) + ' min, x ' + f(fd.x, 2) + '; doors open at the hand-over: ' + C.BULKHEADS.map((b, i) => sim.doorOpen[i] ? b.id + (sim.doorFloat[i] ? ' (its float armed)' : '') + (sim.doorFall[i] >= 0 ? ' (falling, ' + f(sim.doorFall[i], 1) + ' s left)' : '') : '').filter(Boolean).join(', '));
for (const floats of ['core', 'none']) {
  const fall = F.begin(sim, { any: true, cut: fd.x, rule: 'break', t0: fd.t, K: { air: 'spaces', floats } });
  const is = fall.pieces.findIndex(p => p.id === 'stern'), b = fall.eng.bodies[is];
  console.log('\nK.floats \'' + floats + '\': the stern\'s doors ' + (b.spc.doors ? b.spc.doors.map(d => idB(d.b) + (d.float ? ' (float)' : '')).join(', ') || 'none' : 'as handed over'));
  const att = () => { const R = F.quatR(fall.pieces[is].q, new Float64Array(9)); return 'pitch ' + f(Math.asin(Math.max(-1, Math.min(1, -R[6]))) * DEG, 1) + ', roll ' + f(Math.atan2(R[7], R[8]) * DEG, 1); };
  let nextP = 30, under = null;
  while (!fall.done && fall.t - fall.t0 < SECS - 1e-9) {
    F.advance(fall);
    const t = fall.t - fall.t0, u = fall.events.find(e => e.id === 'under' && e.piece === 'stern');
    if (u) { under = u.t - fall.t0; break; }
    if (t >= nextP - 1e-9) { nextP += 30; const p = fall.pieces[is], W = b.spc.st.W; let w = 0; for (let k = 0; k < W.length; k++) w += W[k]; console.log('  +' + f(t, 0) + ' s: the stern lowest ' + f(-p.depth, 1) + ' m, ' + att() + ', water ' + f(w, 0) + ' m3, air ' + f(b.Vair, 0) + ' m3, given way ' + (b.spc.st.failed ? b.spc.st.failed.reduce((s, v) => s + v, 0) : 0) + ' of ' + b.spc.sp.n); }
  }
  const st = b.spc.st;
  console.log('  the stern\'s floats: released ' + ((st.doorsReleased || []).map(x => idB(x.b) + ' +' + f(x.t - fall.t0, 1) + ' s').join(', ') || 'none') + '; shut ' + ((st.doorsShut || []).map(x => idB(x.b) + ' +' + f(x.t - fall.t0, 1) + ' s').join(', ') || 'none'));
  console.log('  the stern ' + (under === null ? 'NOT under in ' + SECS + ' s' : 'under at +' + f(under, 2) + ' s (' + f(under / 60, 2) + ' min)'));
}
console.log('\ne121 done in ' + f((Date.now() - T0) / 1000, 0) + ' s');
