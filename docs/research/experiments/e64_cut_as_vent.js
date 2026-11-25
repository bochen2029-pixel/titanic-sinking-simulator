'use strict';
// e64: the cut as a vent, a what-if (Z1, 2026-11-20, the coordinator's). It is not Z1's law: fall.js is not changed.
// The what-if is applied to fall.js's text in memory (loadWithCutVent below, also used by e65), behind two switches
// in K: cutVent (on or off) and cutScale (the cut's area x).
// The vent: the torn end's own section, the end slice's section polygon (758 m2 on the mainline's ship), its centre at
// the cut station. Cd K.ventCd (0.6). It is open while the cut's centre stands above the pocket's centre in the world,
// with that height difference as the head, by the deck vent's own orifice law. Everything else is as now.
// Run from T 155.5 and 156.0, both pieces, the tiers' share 0, untuned: the control (the vent off) and the what-if.
// The control is checked against the unpatched engine, to the bit.
// Found on 2026-11-20:
//   - the bow comes right: its air is gone in half a second, it never pitches past its trim at the hand-off, and it
//     lands upright 737 to 808 m dead ahead (R5: 772); the pair lies 679 to 763 m apart (R5: 689);
//   - the stern goes in 9 s: freed of the bow, it settles back cut end up within 5 s, and its one pocket's centre
//     (z 15.2 m) is above the cut's (13.8 m).
// So one lumped pocket cannot give both pieces; Z6 (docs/DESIGN_free_body_air_by_space_v1_2026-11-20.md) is the answer.
//   node docs/research/experiments/e64_cut_as_vent.js [--root <tree>] [--moments 155.5,156.0] [--write]
// Output of 2026-11-20: results_2026-11-20/e64_cut_as_vent.txt
const fs = require('fs'), path = require('path'), vm = require('vm');

// the what-if: two anchors in fall.js's text, each found exactly once, or this refuses (fall.js has changed)
const CUT_DEF = [
  'b.airMax = 0; for (let i = 0; i < n; i++) b.airMax += b.Vf[i];',
  'b.airMax = 0; for (let i = 0; i < n; i++) b.airMax += b.Vf[i];\n' +
  '    b.cut = null;\n' +
  "    if (b.ends.aft === 'torn') b.cut = { A: Math.abs(b.polyA[0]), p: [b.x0, b.polyCy[0], b.polyCz[0]] };\n" +
  "    else if (b.ends.fwd === 'torn') b.cut = { A: Math.abs(b.polyA[n - 1]), p: [b.x1, b.polyCy[n - 1], b.polyCz[n - 1]] };\n" +
  '    b.ventDeck = 0; b.ventCut = 0; b.cutOn = false;',
];
const CUT_VENT = [
  'a1 = a0 - rate * h; if (a1 < 0) a1 = 0;',
  'let rc = 0;\n' +
  '      b.cutOn = false;\n' +
  '      if (K.cutVent && b.cut) {\n' +
  '        const hc = b.X[2] + R0[6] * (b.cut.p[0] - b.C[0]) + R0[7] * (b.cut.p[1] - b.C[1]) + R0[8] * (b.cut.p[2] - b.C[2]) + da;\n' +
  '        if (hc > 0) { rc = K.ventCd * b.cut.A * (K.cutScale === undefined ? 1 : K.cutScale) * Math.sqrt(2 * rhoAt(sp, da) * GRAV * hc * RHO_AIR0 * pk / P_ATM) / RHO_AIR0; b.cutOn = true; if (b.cutH0 === undefined) b.cutH0 = hc; }\n' +
  '      }\n' +
  '      a1 = a0 - (rate + rc) * h; if (a1 < 0) a1 = 0;\n' +
  '      if (rate + rc > 0) { const lost = a0 - a1; b.ventDeck += lost * rate / (rate + rc); b.ventCut += lost * rc / (rate + rc); }',
];
// fall.js with the what-if, as a module of its own (its relative requires resolve beside the real file, so it shares
// the core and the girder reader with everything else)
function loadWithCutVent(root) {
  const file = path.join(root, 'core/readers/fall.js'), dir = path.dirname(file);
  let src = fs.readFileSync(file, 'utf8');
  for (const [a, b] of [CUT_DEF, CUT_VENT]) {
    const n = src.split(a).length - 1;
    if (n !== 1) throw new Error('e64: "' + a + '" is in fall.js ' + n + ' times, not once: fall.js has changed; update the what-if');
    src = src.replace(a, () => b);
  }
  const m = { exports: {} };
  const fn = vm.runInThisContext('(function (exports, require, module, __filename, __dirname) {' + src + '\n})', { filename: file + ' [e64: the cut as a vent]' });
  fn.call(m.exports, m.exports, (p) => require(p.startsWith('.') ? path.resolve(dir, p) : p), m, file, dir);
  return m.exports;
}
module.exports = { loadWithCutVent };

function main() {
  const argv = process.argv.slice(2), WRITE = argv.includes('--write'), ri = argv.indexOf('--root'), mi = argv.indexOf('--moments');
  const ROOT = ri >= 0 ? path.resolve(argv[ri + 1]) : path.resolve(__dirname, '../../..');
  const MOM = (mi >= 0 ? argv[mi + 1] : '155.5,156.0').split(',').map(Number);
  const C = require(path.join(ROOT, 'core/core.js')), SC = require(path.join(ROOT, 'core/scenarios.js'));
  const GI = require(path.join(ROOT, 'core/readers/girder.js')), F0 = require(path.join(ROOT, 'core/readers/fall.js')), F = loadWithCutVent(ROOT);
  const out = [], say = (s) => { s = s === undefined ? '' : s; out.push(s); console.log(s); };
  const f = (x, n) => (x === null || x === undefined || !isFinite(x) ? 'n/a' : x.toFixed(n === undefined ? 1 : n));
  const DEG = 180 / Math.PI, ship = C.buildShip();
  const att = (q) => { const R = F.quatR(q, new Float64Array(9)); return { pitch: Math.atan2(-R[6], Math.sqrt(R[7] * R[7] + R[8] * R[8])) * DEG, roll: Math.atan2(R[7], R[8]) * DEG, yaw: Math.atan2(R[3], R[0]) * DEG }; };
  // the bed's place and time of each piece, as bits: the control against the unpatched engine
  const bits = (fall) => fall.pieces.map(p => Array.from(p.r).concat(Array.from(p.q)).map(v => v.toString()).join(',')).join(';') + '|' + fall.events.map(e => e.id + e.piece + e.t).join(',');
  say('e64: the cut as a vent (a what-if in memory), cut at x ' + GI.X_BREAK + ', the tiers\' share 0, untuned');
  say('tree: ' + (ri >= 0 ? path.basename(ROOT) + ' (given by --root)' : 'this repository'));
  const sim = C.createSim(ship, {}, SC.PRESETS.titanic.build());
  for (const TM of MOM.slice().sort((x, y) => x - y)) {
    while (!sim.foundered && sim.t < TM * 60 - 1e-9) C.step(sim);
    say('');
    say('==== the hand-off at T ' + f(sim.t / 60, 2) + ': trim ' + f(sim.pitch * DEG, 1) + ', list ' + f(-sim.roll * DEG, 1) + ' to port');
    // the engine itself, to hold the control to
    const real = F0.begin(sim, { any: true, K: { tiersFlow: 0 } });
    for (let k = 0; k < 40 * 240 && !real.done; k++) F0.advance(real);
    for (const cutVent of [0, 1]) {
      const fall = F.begin(sim, { any: true, K: { tiersFlow: 0, cutVent } }), ba = fall.breakAt;
      const where = (i) => { const p = fall.pieces[i]; return F.worldOf(fall, i, [0.5 * (p.x0 + p.x1), 0, GI.Z_NA]); };
      const st = fall.pieces.map((p, i) => { const b = fall.eng.bodies[i]; return { id: p.id, state0: p.state, top0: b.top, a0: b.air ? b.air.a : 0, cut: b.cut, pz: b.air ? b.air.p[2] : NaN, px: b.air ? b.air.p[0] : NaN, tUnder: p.state === 'afloat' ? null : 0, aUnder: null, deckUnder: null, cutUnder: null, tCut: null, tGone: null, maxPitch: -1e9, trace: [] }; });
      for (let k = 0; k < 40 * 240 && !fall.done; k++) {
        F.advance(fall);
        const tt = fall.t - fall.t0;
        fall.pieces.forEach((p, i) => {
          const s = st[i], b = fall.eng.bodies[i], a = att(p.q);
          if (s.tCut === null && b.ventCut > 0) s.tCut = tt;
          if (s.tGone === null && b.air && !(b.air.a > 0)) s.tGone = tt;
          if (s.tUnder === null && !(b.top > 0)) { s.tUnder = tt; s.aUnder = b.air ? b.air.a : 0; s.deckUnder = b.ventDeck; s.cutUnder = b.ventCut; }
          if (tt <= 120.01 && a.pitch > s.maxPitch) s.maxPitch = a.pitch;
          if (k % 20 === 19 && tt <= 60.01) s.trace.push(f(tt, 0) + 's pitch ' + f(a.pitch, 0) + ' roll ' + f(a.roll, 0) + ' top ' + f(b.top, 1) + ' air ' + f(b.air ? b.air.a : 0, 0) + (b.cutOn ? ' CUT OPEN' : ''));
        });
      }
      const L = fall.pieces.map((p, i) => { const w = where(i); return { dX: w[0] - ba[0], dY: w[1] - ba[1] }; });
      say('');
      say('-- ' + (cutVent ? 'WITH the cut as a vent' : 'as now (the control): the same bits as the unpatched engine: ' + (bits(fall) === bits(real) ? 'yes' : 'NO')) + ':');
      fall.pieces.forEach((p, i) => {
        const s = st[i], b = fall.eng.bodies[i], a = att(p.q), l = L[i], strike = fall.events.find(e => e.id === 'strike' && e.piece === p.id);
        const vented = s.a0 > 0 && s.aUnder !== null ? 100 * (s.a0 - s.aUnder) / s.a0 : NaN;
        say(p.id.padEnd(6) + ' cut ' + (s.cut ? f(s.cut.A, 0) + ' m2, its centre at z ' + f(s.cut.p[2], 1) + ' m' : 'none') + '; pocket at x ' + f(s.px, 1) + ', z ' + f(s.pz, 1) + '; at the hand-off ' + s.state0 + ', top ' + f(s.top0, 1) + ' m, air ' + f(s.a0, 0) + ' m3 at 1 atm'
          + ' | the cut first vents ' + (s.tCut === null ? 'never' : 'at +' + f(s.tCut, 2) + ' s, head ' + f(b.cutH0, 2) + ' m') + ' | air gone ' + (s.tGone === null ? 'never' : '+' + f(s.tGone, 1) + ' s')
          + ' | wholly under ' + (s.tUnder === null ? 'NEVER' : '+' + f(s.tUnder, 1) + ' s, ' + f(vented, 0) + ' % of its air gone by then (by the deck ' + f(s.deckUnder, 0) + ', by the cut ' + f(s.cutUnder, 0) + ' m3 at 1 atm)')
          + ' | its pitch reached ' + f(s.maxPitch, 0) + ' deg in 120 s'
          + ' | on the bed +' + f(strike ? (strike.t - fall.t0) / 60 : NaN, 2) + ' min, pitch ' + f(a.pitch, 1) + ', roll ' + f(a.roll, 1) + ', heading ' + f(a.yaw, 0) + '; ' + f(Math.hypot(l.dX, l.dY), 0) + ' m from breakAt (along ' + f(l.dX, 0) + ', across ' + f(l.dY, 0) + '), bearing ' + f(Math.atan2(l.dY, l.dX) * DEG, 0) + ' deg to port of her heading' + (fall.done ? '' : ' NOT DONE'));
      });
      const bi = fall.pieces.findIndex(p => p.id === 'bow'), si = fall.pieces.findIndex(p => p.id === 'stern');
      say('bow to stern ' + f(Math.hypot(L[bi].dX - L[si].dX, L[bi].dY - L[si].dY), 0) + ' m');
      for (const s of st) say('  ' + s.id + ', its first 60 s: ' + s.trace.join(' | '));
    }
  }
  if (WRITE) { const d = path.join(__dirname, 'results_2026-11-20'); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, 'e64_cut_as_vent.txt'), out.join('\n') + '\n'); }
}
if (require.main === module) main();
