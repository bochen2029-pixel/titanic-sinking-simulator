'use strict';
// e119 (Z1, 2026-11-23): the stern's hang and the spaces' one-way limiter (K.limiter: core/readers/fall.js, and
// spaces.js's stepPiece and heldBySea). The stern-work team (Bo's other PC, 11-23; digests STERNWORK_* in the group's
// notes) found the stern's hang under K.air 'spaces' a limiter artefact: e84's safeguard 1 floors a full space's free
// surface at 1e-6 m2. On main 5e12900 the pairwise limiter turned out to starve any space the sea feeds, full (the
// floor) or nearly full (a trapped bubble's p/V), and the floor alone matters little. Three parts, each under
// K.limiter 'pair' (the default, as before) and 'held' (a space the sea holds counted as stiff as the sea):
//   1. two rooms of 400 m3 on the engine's own stepPiece, side by side 20 to 30 m down, the bulkhead between them given
//      way over 20 m2, the forward one full and the after one dry at one atmosphere: the full one fed by the sea (its
//      shell given way, shellOpening's form) or sealed; the water in the after room at 0.25, 1, 2, 5 and 10 s;
//   2. the 1912 preset at its flag (H1): the stern's time under (K.air 'spaces', K.fail 'boundaries', every bet as set);
//   3. member C's watch at its onset (handover 'onset', the cut at the onset's station) with K.torn 20, Z6 v1.1's
//      stand-in for the torn hull: the stern's time under and her attitude every 30 s. K.torn is claude/z1-z6-onset's
//      (ffc845b): on a tree without it this part says so and is skipped.
//   node docs/research/experiments/e119_z6_limiter_hang.js [--parts 1,2,3] [--secs 900]
// Prints its table (results_2026-11-23/e119_z6_limiter_hang.txt is a run of it); writes nothing.
const path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..');
const C = require(path.join(ROOT, 'core/core.js')), SC = require(path.join(ROOT, 'core/scenarios.js'));
for (const r of ['girder.js', 'section.js', 'onset.js']) require(path.join(ROOT, 'core/readers', r));
const F = require(path.join(ROOT, 'core/readers/fall.js')), SP = require(path.join(ROOT, 'core/readers/spaces.js'));
const N = require(path.join(ROOT, 'core/night.js'));
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const PARTS = String(arg('--parts', '1,2,3')).split(',').map(Number), SECS = Number(arg('--secs', 900));
const f = (v, d) => (Number.isFinite(v) ? v.toFixed(d) : String(v)), DEG = 180 / Math.PI;
const LIMS = ['pair', 'held'];
const t0 = Date.now();
console.log('e119: the stern\'s hang and the one-way limiter; K.limiter ' + (F.K0.limiter === undefined ? 'NOT IN THIS TREE' : 'default ' + JSON.stringify(F.K0.limiter) + ' (each run below names its own)'));
if (F.K0.limiter === undefined) process.exit(1);

// ---------------------------------------------------------------- part 1: two rooms on the engine's own stepPiece
if (PARTS.includes(1)) {
  const box = [[5, 0, -25, 5, 2, 5], [-5, 0, -25, 5, 2, 5]], Af = (fn) => Float64Array.from(box.map(fn));
  const sp = { n: 2, node: Int32Array.from([0, 1]), start: Int32Array.from([0, 1]), count: Int32Array.from([1, 1]), mu: Af(() => 1), V: Af(b => 8 * b[3] * b[4] * b[5]),
    cx: Af(b => b[0]), cy: Af(b => b[1]), cz: Af(b => b[2]), bx: Af(b => b[0]), by: Af(b => b[1]), bz: Af(b => b[2]), wx: Af(b => b[3]), wy: Af(b => b[4]), wz: Af(b => b[5]) };
  const RI = [1, 0, 0, 0, 1, 0, 0, 0, 1], r0 = [0, 0, 0], DT = 1 / 32, MARKS = [0.25, 1, 2, 5, 10];
  console.log('\nPART 1: two rooms of 400 m3 (10 x 4 x 10 m, 20 to 30 m down), the bulkhead between them given way over 20 m2, the forward one full, the after one dry at one atmosphere; the spaces\' step 1/32 s');
  for (const fed of [true, false]) for (const lim of LIMS) {
    const ops = [{ c: -1, kind: 'failed bulkhead', a: 0, b: 1, px: 0, py: 0, pz: -25, nx: -1, ny: 0, nz: 0, A: 20, L: 10, Cd: 0.6, open: true }];
    if (fed) ops.push({ c: -1, kind: 'failed', a: 0, b: -1, px: 5, py: 2, pz: -25, nx: 0, ny: 1, nz: 0, A: 20, L: 10, Cd: 0.6, open: true });
    const st = { W: Float64Array.from([400, 0]), a: Float64Array.from([0, 400]), lev: new Float64Array(2) }, row = [];
    let m = 0;
    for (let i = 1; i <= 320; i++) {
      SP.stepPiece(sp, st, ops, RI, r0, DT, undefined, lim);
      if (m < MARKS.length && i * DT >= MARKS[m] - 1e-9) {
        const Va = sp.V[1] - st.W[1];
        row.push('+' + MARKS[m] + ' s ' + f(st.W[1], 1) + ' m3 (' + (Va > 1e-9 * sp.V[1] ? f(SP.flow.P_ATM * st.a[1] / Va / 1000, 1) + ' kPa' : 'no air') + ')');
        m++;
      }
    }
    console.log('  ' + (fed ? 'fed by the sea' : 'sealed        ') + '  ' + lim.padEnd(5) + ' ' + row.join(', '));
  }
}

// ---------------------------------------------------------------- the stern's time under, one fall
function sternUnder(fall, secs, label) {
  const is = fall.pieces.findIndex(p => p.id === 'stern'), b = fall.eng.bodies[is], lines = [];
  const att = () => { const R = F.quatR(fall.pieces[is].q, new Float64Array(9)); return 'pitch ' + f(Math.asin(Math.max(-1, Math.min(1, -R[6]))) * DEG, 1) + ', roll ' + f(Math.atan2(R[7], R[8]) * DEG, 1); };
  const reps = () => fall.events.filter(e => e.id === 'report' && e.piece === 'stern').length;
  let next = 30, under = null;
  while (!fall.done && fall.t - fall.t0 < secs - 1e-9) {
    F.advance(fall);
    const t = fall.t - fall.t0;
    const u = fall.events.find(e => e.id === 'under' && e.piece === 'stern');
    if (u) { under = u.t - fall.t0; break; }
    if (t >= next - 1e-9) { next += 30; const p = fall.pieces[is]; lines.push('+' + f(t, 0) + ' s ' + f(-p.depth, 0) + ' m, ' + att() + ', air ' + f(b.Vair, 0) + ' m3'); }
  }
  const failed = b.spc.st.failed ? b.spc.st.failed.reduce((s, v) => s + v, 0) : 0;
  console.log('  ' + label.padEnd(5) + ' the stern ' + (under === null ? 'NOT under in ' + secs + ' s' : 'under at +' + f(under, 2) + ' s (' + f(under / 60, 2) + ' min)') + '; reports ' + reps() + '; ' + failed + ' of ' + b.spc.sp.n + ' spaces given way');
  for (const l of lines) console.log('        ' + l);
}

// ---------------------------------------------------------------- part 2: the 1912 preset at its flag
if (PARTS.includes(2)) {
  const sim = C.createSim(C.buildShip(), {}, SC.PRESETS.titanic.build());
  while (!sim.foundered) C.step(sim);
  console.log('\nPART 2: the 1912 preset at its flag (T ' + f(sim.t / 60, 2) + ' min, trim ' + f(sim.pitch * DEG, 2) + ', list ' + f(sim.roll * DEG, 2) + '), cut at X_BREAK (H1); K.air \'spaces\', K.fail \'boundaries\'');
  for (const lim of LIMS) sternUnder(F.begin(sim, { K: { air: 'spaces', limiter: lim } }), Math.min(SECS, 600), lim);
}

// ---------------------------------------------------------------- part 3: member C's watch at its onset, K.torn 20
if (PARTS.includes(3)) {
  const sim = N.sink(N.create(C.buildShip(), N.spec(1912), { auto: true, readers: false, handover: 'onset' }));
  const fd = sim.night.onset && sim.night.onset.found;
  const go = (lim) => F.begin(sim, { any: true, cut: fd.x, rule: 'break', t0: fd.t, K: { air: 'spaces', torn: 20, limiter: lim } });
  const probe = go('pair'), torn = probe.eng.bodies[probe.pieces.findIndex(p => p.id === 'stern')].spc.torn;   // tornOpen's record: K.torn is in this tree
  if (!torn) console.log('\nPART 3: skipped: K.torn is not in this tree (claude/z1-z6-onset, ffc845b)');
  else {
    console.log('\nPART 3: member C\'s watch at its onset (step ' + sim.night.k + ', x ' + f(fd.x, 2) + ', trim ' + f(sim.pitch * DEG, 2) + ', list ' + f(sim.roll * DEG, 2) + '), cut there; K.air \'spaces\', K.fail \'boundaries\', K.torn 20 (the stern: ' + torn.boundaries + ' boundaries and ' + torn.shells + ' shells opened within ' + torn.half + ' m of the cut); to ' + SECS + ' s');
    sternUnder(probe, SECS, 'pair');
    sternUnder(go('held'), SECS, 'held');
  }
}
console.log('\ne119 done in ' + f((Date.now() - t0) / 1000, 0) + ' s');
