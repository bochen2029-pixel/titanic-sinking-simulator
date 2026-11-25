'use strict';
// e115: what stage D's landing (member C, D90) does to the fall's trials 4, 7 and 10, switch by switch (Z1, 2026-11-23;
// D91). On the landed tree, each of the landing's moves (SC.PRE_D4, as the landing commit lists them) is put back alone,
// and then all together, on the 1912 preset:
// - trials 7 and 10: the pieces let go flooded at the record's attitudes from the preset at t = 0 (the bow at 18 deg by
//   the head and 5 to port, the stern at 65): each piece's weight in water's place, its plan's middle, its lever, where it
//   lands untuned, and its lever fitted on the survey's side (the bow 772 m ahead of the point under the break, the
//   stern 148 m ahead);
// - trial 4: the stern at the flag with all its air and no vent: its air (m3 at one atmosphere), her weight in water,
//   the depth d* where Boyle leaves its air at her weight in water, its pocket's deepest in ten minutes, and its fate;
// - trial 12: the default fall from the same flag (the pocket's lift through each slice's floodable centre): each
//   piece's way up and its place.
// The record: the bow 772 m and the stern 148 m from the point under the break, both north of it (R5 1.1).
// Rerun on B1+B2's cascade (966fa4d, D92): the girder's weight curve, by which the fall weighs her, takes Prohaska's
// a = 0.660 since the landing (it was 0.40). The variants add a = 0.40 alone (as before D92), and "everything as before
// D4" puts a = 0.40 back with SC.PRE_D4's moves, so that it is the fall before the landing (the run of 2026-11-23 on
// dbb3276 read the same numbers there). The other variants keep a = 0.660. The fall reads the curve through the girder
// module's weight(sim) (fall.js piece()); a variant's a is given to it there, and taken back after the variant.
//   node docs/research/experiments/e115_d4_c_fall_attribution.js
// Output of 2026-11-23 (its stdout): results_2026-11-23/e115_d4_c_fall_attribution.txt
const path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..');
const C = require(path.join(ROOT, 'core/core.js')), SC = require(path.join(ROOT, 'core/scenarios.js'));
for (const r of ['girder.js', 'section.js', 'onset.js']) require(path.join(ROOT, 'core/readers', r));
const F = require(path.join(ROOT, 'core/readers/fall.js')), GI = require(path.join(ROOT, 'core/readers/girder.js'));
const DEG = Math.PI / 180, G = 9.80665, f = (v, d) => Number.isFinite(v) ? v.toFixed(d) : String(v);
const P = SC.PRE_D4;
if (!P) throw new Error('no SC.PRE_D4 on this tree: run it on stage D\'s landing');

// the variants: the landed tree, each move put back alone, and all of them
const A_BEFORE = 0.40;   // Prohaska's a before D92 (B1+B2's 966fa4d)
const VARIANTS = [['landed (C), a ' + GI.PROHASKA_A.toFixed(3), {}]];
VARIANTS.push(['Prohaska\'s a ' + A_BEFORE.toFixed(2) + ' (as before D92)', { a: A_BEFORE }]);
VARIANTS.push(['hullEnds as before (C3 off)', { ship: P.ship }]);
for (const k of Object.keys(P.params)) VARIANTS.push([k + ' ' + P.params[k] + ' (as before)', { params: { [k]: P.params[k] } }]);
VARIANTS.push(['every param as before', { params: P.params }]);
VARIANTS.push(['the preset\'s build as before (area ' + P.build.areaTitanic + ', bunkerOpen ' + P.build.bunkerOpen + ')', { build: P.build, scen: P.scen }]);
VARIANTS.push(['everything as before D4, a ' + A_BEFORE.toFixed(2) + ' too', { ship: P.ship, params: P.params, build: P.build, scen: P.scen, a: A_BEFORE }]);
// a variant's a: the girder's weight(sim) with no variant of its own gives the curve with that a (the cache keys on it)
const W0 = GI.weight;
const withA = (a) => { GI.weight = a === undefined ? W0 : (sim, v) => W0(sim, v || { a }); };

function presetOf(v) {
  const ship = C.buildShip(v.ship || {}), scen = SC.PRESETS.titanic.build(v.build);
  if (v.scen) Object.assign(scen, v.scen);
  return { ship, sim0: C.createSim(ship, Object.assign({}, v.params || {}), scen), scen };
}
// trials 7 and 10: from the preset at t = 0, the pieces let go flooded
function trial7(ship, sim0) {
  const T = F.shipTables(ship), XB = GI.X_BREAK, XS = T.e[0], XF = T.e[T.nS], SEA = F.sea({});
  const spec = (id, o) => { const c = id === 'bow' ? [XB, XF] : [XS, XB]; return F.piece(ship, sim0, c[0], c[1], Object.assign({ id, kind: id, air: 0 }, o || {})); };
  const letGo = (id, pose, L) => {
    const fall = F.make(SEA, [spec(id, { lever: L || 0 })], { dt: C.DEFAULT_PARAMS.dt });
    F.place(fall, 0, { pitch: pose.trim * DEG, roll: -(pose.list || 0) * DEG, top: -1 });
    const p = fall.pieces[0], mid = 0.5 * (p.x0 + p.x1), brk = F.worldOf(fall, 0, [XB, 0, GI.Z_NA]);
    for (let k = 0; k < 20 * 240 && !fall.done; k++) F.advance(fall);
    const w = F.worldOf(fall, 0, [mid, 0, GI.Z_NA]);
    return { along: w[0] - brk[0], across: w[1] - brk[1] };
  };
  const out = {};
  for (const [id, pose, tgt] of [['bow', { trim: 18, list: 5 }, 772], ['stern', { trim: 65 }, 148]]) {
    const Lv = F.leverOf(F.body(spec(id), SEA)), u = letGo(id, pose, 0);
    let a = 0, ra = u.along, b = tgt > ra ? 0.5 : -0.5, rb = letGo(id, pose, b).along, fit = NaN;
    for (let k = 0; k < 16; k++) { if (Math.abs(rb - tgt) < 1) { fit = b; break; } const s = (rb - ra) / (b - a), st = s !== 0 ? (tgt - rb) / s : (tgt > rb ? 0.5 : -0.5), c = b + Math.max(-2, Math.min(2, st)); a = b; ra = rb; b = c; rb = letGo(id, pose, b).along; }
    out[id] = { xw: Lv.xw, xplan: Lv.xplan, lever: Lv.lever, untuned: u, fit, fitted: Lv.lever + fit };
  }
  return out;
}
// trial 4: from the preset at its flag, the stern with all its air and no vent
function trial4(sim0) {
  while (!sim0.foundered) C.step(sim0);
  const kept = F.begin(sim0, { vent: { stern: 0 } }), si = kept.pieces.findIndex(p => p.id === 'stern'), b = kept.eng.bodies[si];
  const a0 = b.air.a, wIn = F.leverOf(b).wIn, rho0 = b.rhoRef, R = new Float64Array(9);
  const dStar = (rho0 * a0 * F.P_ATM / wIn - F.P_ATM) / (rho0 * G);
  let dPeak = -Infinity, tPeak = 0;
  for (let k = 0; k < 10 * 240; k++) {
    F.advance(kept);
    F.quatR(b.q, R); const p = b.air.p, d = -(b.X[2] + R[6] * (p[0] - b.C[0]) + R[7] * (p[1] - b.C[1]) + R[8] * (p[2] - b.C[2]));
    if (d > dPeak) { dPeak = d; tPeak = kept.t - kept.t0; }
  }
  const Gk = F.massOf(b).g, zG = F.worldOf(kept, si, Gk)[2], floats = b.top > 0 && zG > -20;
  // trial 12 from the same flag: the default fall (the pocket's lift through each slice's floodable centre, its vent),
  // each piece's way up and its place against the point under the break
  const fall = F.begin(sim0);
  while (!fall.done && fall.k < 4 * 60 * 30) F.advance(fall);
  const lie = fall.pieces.map((p, i) => { const w = F.worldOf(fall, i, [0.5 * (p.x0 + p.x1), 0, GI.Z_NA]), dX = w[0] - fall.breakAt[0], dY = w[1] - fall.breakAt[1], R = F.quatR(p.q, new Float64Array(9)), roll = Math.atan2(R[7], R[8]) / DEG; return p.id + ' ' + (Math.abs(roll) <= 45 ? 'upright' : (Math.abs(roll) >= 135 ? 'upside down' : 'on her side')) + ' ' + f(Math.hypot(dX, dY), 0) + ' m (along ' + f(dX, 0) + ', across ' + f(dY, 0) + ')'; });
  return { T: sim0.founderT / 60, pitch: sim0.pitch / DEG, roll: sim0.roll / DEG, a0, wIn, ratio: rho0 * a0 / wIn, dStar, dPeak, tPeak, floats, lie };
}

console.log('stage D\'s landing (member C): the fall\'s trials 4, 7 and 10 with each of the landing\'s moves put back alone (SC.PRE_D4)');
for (const [label, v] of VARIANTS) {
  withA(v.a);
  const c0 = process.cpuUsage(), pr = presetOf(v), t7 = trial7(pr.ship, pr.sim0), t4 = trial4(pr.sim0), cpu = process.cpuUsage(c0);
  withA(undefined);
  console.log(label);
  for (const id of ['bow', 'stern']) { const q = t7[id]; console.log('  trial 7, the ' + id.padEnd(6) + 'weight in water at x ' + f(q.xw, 2) + ', plan\'s middle ' + f(q.xplan, 2) + ', lever ' + (q.lever >= 0 ? '+' : '') + f(q.lever, 2) + ' m; untuned ' + f(q.untuned.along, 0) + ' m along (across ' + f(q.untuned.across, 0) + '); the fit on the survey\'s side ' + (q.fit >= 0 ? '+' : '') + f(q.fit, 2) + ' m, the fitted lever ' + (q.fitted >= 0 ? '+' : '') + f(q.fitted, 2) + ' m'); }
  console.log('  trial 4: the flag at T ' + f(t4.T, 2) + ' min (pitch ' + f(t4.pitch, 1) + ', roll ' + f(t4.roll, 1) + '); the stern\'s air ' + f(t4.a0, 0) + ' m3 at one atmosphere, ' + f(t4.ratio, 2) + ' times her weight in water (' + f(t4.wIn / 1000, 0) + ' t); d* ' + f(t4.dStar, 1) + ' m; its pocket at most ' + f(t4.dPeak, 1) + ' m down (+' + f(t4.tPeak, 0) + ' s); ' + (t4.floats ? 'FLOATS' : 'SINKS') + '; ' + f((cpu.user + cpu.system) / 1e6, 0) + ' s of CPU');
  console.log('  trial 12, the default fall from the same flag: ' + t4.lie.join('; '));
}
