// U3's first proof, the water inside her (docs/BRAINSTORM_titanic_in_unreal_v1_2026-11-20.md, sections 4.3 and 7), headless:
// the export's 64 spaces (tools/export_ship.js, subdivision.spaces: the model's own columns) cut at the recorded night's
// level, at its pose, give back the record's water. So a renderer that clips these named spaces at the record's level
// draws the model's water, space by space, step by step.
//   node tools/u3_water_tests.js         (about half a minute: the export and the record are made in this process)
// MUST rows: each space's columns times its permeability are the model's own capacity (nodeVmax); the columns are the
// model's; at a step every ten minutes of the night, every wet space's water, cut by the core's own rule from the
// record's level and pose (frames.pose), equals what the core's own level holds there (the model run alone, at its exact
// level and pose) within the record's rounding; and the record's water is the core's. CHECK rows: the core's level
// against the water it was solved for. core.js's step solves its levels first, from the water and her pose as the step
// begins, and then moves the water and her (C.step: poseFrame, solveLevels, the flows, the motion). So the level of
// sample i holds the water of sample i - 1 at the pose of sample i - 1, within the solve's own tolerance (the larger of
// 0.1 % of what the space or its pair holds up to the hull's top and 0.5 m3; core.js solveOne and solvePair), and the
// water of sample i at its own pose only within a step's flow and motion more: both, at those steps and at the hand-over.
'use strict';
const C = require('../core/core.js');
const N = require('../core/night.js');
const XS = require('./export_ship.js');
const RN = require('./record_night.js');

const rows = []; let fails = 0, checks = 0;
function row(kind, what, value, ref, ok) { rows.push([kind, what, value, ref, ok]); if (!ok) { if (kind === 'MUST') fails++; else checks++; } }
const f = (x, n) => (x === null || x === undefined || Number.isNaN(x) ? 'n/a' : (+x).toFixed(n === undefined ? 2 : n));
const at = (sp, i) => { if (!sp) return null; const j = (i - sp.from) / sp.every; return Number.isInteger(j) && j >= 0 && j < sp.v.length ? sp.v[j] : null; };
// the record's frames.pose
function frameOf(K, zO, pitch, roll) {
  const cp = Math.cos(pitch), sp = Math.sin(pitch), cr = Math.cos(roll), sr = Math.sin(roll), g = K.g0;
  const R20 = -sp, R21 = cp * sr, R22 = cp * cr;
  return { R20, R21, R22, tz: zO - (R20 * g[0] + R21 * g[1] + R22 * g[2]) };
}
// the core's nodePass, on the export's columns: the space's water below the world level h, and its free surface's area
function waterBelow(sp, dy, F, h, mu) {
  const iR = 1 / F.R22; let v = 0, area = 0;
  for (let j = 0; j < sp.x.length; j++) {
    const base = F.R20 * sp.x[j] + F.R21 * sp.y[j] + F.tz, zp = (h - base) * iR;
    if (zp <= sp.a[j]) continue;
    const A = sp.dx[j] * dy;
    if (zp >= sp.e[j]) v += A * (sp.e[j] - sp.a[j]); else { v += A * (zp - sp.a[j]); area += A; }
  }
  return { V: v * mu, area: area * mu * iR };
}

try {
  const ship = JSON.parse(XS.exportShip().text), SP = ship.subdivision.spaces, nodes = ship.subdivision.nodes.list, model = C.buildShip();
  // ---- 1. each space's capacity is the model's
  let eCap = 0, wCap = -1;
  SP.list.forEach((sp, n) => {
    let v = 0; for (let j = 0; j < sp.x.length; j++) v += sp.dx[j] * SP.dy * (sp.e[j] - sp.a[j]);
    const d = Math.abs(v * nodes[n].mu - model.nodeVmax[n]) / Math.max(1, model.nodeVmax[n]);
    if (d > eCap) { eCap = d; wCap = n; }
  });
  row('MUST', 'each of the 64 spaces: its columns times its permeability, the model\'s own capacity (nodeVmax)', 'off by ' + eCap.toExponential(2) + ' at worst (space ' + wCap + ')', '<= 1e-6 of it', eCap <= 1e-6);
  row('MUST', 'the columns the export carries, the model\'s', SP.list.reduce((s, sp) => s + sp.x.length, 0) + ' column entries in 64 spaces', model.entCol.length + ' in the model', SP.list.reduce((s, sp) => s + sp.x.length, 0) === model.entCol.length);

  // ---- 2. the record's water, cut from its level at its pose
  const rec = JSON.parse(RN.record({}).text), K = rec.constants, ch = rec.channels, n = rec.clock.n;   // as a renderer reads it
  // the core solves port and starboard as one pair with one level (solvePair) everywhere but the lower spaces of holds 2
  // and 3 (the firemen's tunnel: mergeAlways 0 there until both stand over it); its tolerance is then the pair's
  const pairOf = (q) => q ^ 2, alone = (q) => { const k = q >> 2, layer = q & 1; return layer === 0 && (k === 2 || k === 3); };
  // the record's level at sample i, cut at the pose of sample iAt (i unless given), against the water of sample iAt
  function compare(i, iAt) {
    if (iAt === undefined) iAt = i;
    const F = frameOf(K, ch.zO[iAt], ch.pitch[iAt], ch.roll[iAt]), out = [];
    for (let q = 0; q < 64; q++) {
      const h = at(ch.water.level[q], i), vol = at(ch.water.vol[q], iAt);
      if (h === null || vol === null) continue;
      const vmax = nodes[q].vmax, w = waterBelow(SP.list[q], SP.dy, F, h, nodes[q].mu);
      // a full space is pressed up (core.js: its level over its top by the excess over its own surface): the columns hold vmax
      const want = Math.min(vol, vmax), got = Math.min(w.V, vmax);
      // over the tunnel the two halves are one pair again (the same level), solved and toleranced as a pair: since join 6
      // hold 2's halves stand merged at T 60 with 2.6 m3 between the cut and the record, inside the pair's tolerance
      const merged = alone(q) && at(ch.water.level[pairOf(q)], i) === h;
      const scale = alone(q) && !merged ? vmax : vmax + nodes[pairOf(q)].vmax;
      const tol = Math.max(1e-3 * scale, 0.5) + 0.0005 * w.area + 0.05 + 1e-6 * vmax;
      out.push({ q, want, got, d: Math.abs(got - want), tol, area: w.area, vol, tolCore: Math.max(1e-3 * scale, 0.5) });
    }
    return out;
  }
  const steps = []; for (let i = 0; i < n - 1; i += 2400) steps.push(i);
  // the model run alone to the same steps (no readers: the same night, to the bit), for its exact level, pose and water,
  // and its pose and water one step before. The record rounds them. The core's level at a step was solved before that
  // step moved the water and her (C.step), so it is held to the water and pose of the step before (within the solve's
  // tolerance: e116 measured 7 misses in the watch's 334,989 space-steps, the worst 0.04 %); against the step's own water
  // at its own pose it misses by a step's flow and motion more (on member C, 2.07 m3 for space 12 at step 2400, 106.6 % of
  // its tolerance: 1.77 for the solve, about 0.41 a step's flow; the core's columns and the export's cut alike). Both are
  // CHECKs: the model's, recorded as it is
  const sim = N.create(C.buildShip(), N.spec(1912), { auto: true, readers: false }), exact = new Map();
  for (const i of steps) {
    while (sim.night.k < rec.clock.k0 + i - 1) N.step(sim);
    const before = i > 0 && sim.night.k === rec.clock.k0 + i - 1 ? { F: frameOf(K, sim.zO, sim.pitch, sim.roll), vol: Float64Array.from(sim.vol) } : null;
    while (sim.night.k < rec.clock.k0 + i) N.step(sim);
    exact.set(i, { F: frameOf(K, sim.zO, sim.pitch, sim.roll), level: Float64Array.from(sim.level), vol: Float64Array.from(sim.vol), before });
  }
  // the core solves a space's halves as one pair with one level (solvePair) wherever their levels are one (all but the
  // lower spaces of holds 2 and 3 while the firemen's tunnel parts them): there a level holds the pair's water, summed
  const groupsOf = (E) => { const g = []; for (let q = 0; q < 64; q++) { if (q & 2) continue; const p = q | 2; g.push(E.level[q] === E.level[p] ? [q, p] : [q], ...(E.level[q] === E.level[p] ? [] : [[p]])); } return g; };
  // the solve's own tolerance in a step: the larger of 0.1 % of what the space or pair holds up to the hull's top (the
  // core's nodeVtol) and 0.5 m3 (core.js solveOne and solvePair)
  const held = (E, F, vol, grp) => { let got = 0, want = 0, vtol = 0; for (const q of grp) { const vmax = nodes[q].vmax; got += Math.min(waterBelow(SP.list[q], SP.dy, F, E.level[q], nodes[q].mu).V, vmax); want += Math.min(vol[q], vmax); vtol += model.nodeVtol[q]; } return { d: Math.abs(got - want), tol: Math.max(1e-3 * vtol, 0.5), wet: want > 1e-6 }; };   // a dry space's level is only its lowest point: the record gives none
  let checked = 0, fBad = 0, fWorst = 0, fRatio = 0, fWhere = '', vBad = 0, vWorst = 0;
  let solved = 0, solveBad = 0, solveRatio = 0, solveWhere = '', own = 0, ownBad = 0, ownRatio = 0, ownWhere = '';
  for (const i of steps) {
    const E = exact.get(i);
    for (const c of compare(i)) {
      checked++;
      const q = c.q, vmax = nodes[q].vmax, xw = waterBelow(SP.list[q], SP.dy, E.F, E.level[q], nodes[q].mu), xc = Math.min(xw.V, vmax);
      // U0's: the record's level and heave, each rounded to the mm, cut the export's columns as the core's exact ones do
      const tolF = 0.001 * Math.max(c.area, xw.area) + 1e-6 * vmax + 0.01, dF = Math.abs(c.got - xc);
      if (dF > tolF) fBad++;
      if (dF / tolF > fRatio) fRatio = dF / tolF;
      if (dF > fWorst) { fWorst = dF; fWhere = 'space ' + q + ' at step ' + (rec.clock.k0 + i); }
      // the record's water is the core's, to its decimals
      const dV = Math.abs(c.vol - E.vol[q]);
      if (dV > 0.05 + 1e-9) vBad++;
      if (dV > vWorst) vWorst = dV;
    }
    // the core's level against the water it was solved for (the step before's, at its pose), and against its own step's
    if (!E.before) continue;
    for (const grp of groupsOf(E)) {
      const s = held(E, E.before.F, E.before.vol, grp), o = held(E, E.F, E.vol, grp), name = 'space' + (grp.length > 1 ? 's ' + grp.join('+') : ' ' + grp[0]) + ' at step ' + (rec.clock.k0 + i);
      if (s.wet) { solved++; if (s.d > s.tol) solveBad++; if (s.d / s.tol > solveRatio) { solveRatio = s.d / s.tol; solveWhere = name + ', ' + f(s.d, 2) + ' m3 against ' + f(s.tol, 2); } }
      if (o.wet) { own++; if (o.d > o.tol) ownBad++; if (o.d / o.tol > ownRatio) { ownRatio = o.d / o.tol; ownWhere = name + ', ' + f(o.d, 2) + ' m3 against ' + f(o.tol, 2); } }
    }
  }
  row('MUST', 'every wet space, every ten minutes of the night (' + steps.length + ' steps): the record\'s level cutting the export\'s columns at the record\'s pose gives the water the core\'s own level holds (the model run alone, at its exact level and pose)', checked + ' space-steps, ' + fBad + ' outside; ' + f(fWorst, 3) + ' m3 at worst (' + fWhere + '), ' + f(100 * fRatio, 1) + ' % of the tolerance', 'within the record\'s rounding (1 mm of level and heave over the free surface) and 0.01 m3', fBad === 0 && checked > 200);   // a floor, not a result: later moves of the night change the count
  row('MUST', '  ... and the record\'s water is the core\'s, every one of them', vBad + ' outside; ' + f(vWorst, 3) + ' m3 at worst', 'within its decimals (0.05 m3)', vBad === 0);
  row('CHECK', 'the core\'s level at those steps against the water it was solved for, the step before\'s at the step before\'s pose (C.step solves its levels first): within the solve\'s tolerance (0.1 % of the space or its pair up to the hull\'s top, at least 0.5 m3)', solved + ' spaces and pairs, ' + solveBad + ' outside; ' + f(100 * solveRatio, 1) + ' % of it at most' + (solveWhere ? ' (' + solveWhere + ')' : ''), 'the model\'s, recorded as it is', solveBad === 0);
  row('CHECK', '  ... and against its own step\'s water at its own pose, a step\'s flow and motion more: what a renderer cutting each sample\'s level at that sample\'s pose draws', own + ' spaces and pairs, ' + ownBad + ' outside the tolerance; ' + f(100 * ownRatio, 1) + ' % of it at most' + (ownWhere ? ' (' + ownWhere + ')' : ''), 'the model\'s, recorded as it is', true);
  // at the hand-over (the break's onset by default; the founder flag under --flag, where she is steep and moving fast) the record's level, solved as the last step began, against the
  // water and pose it was solved for (the sample before) and against the last sample's own: what a renderer drawing by
  // level would miss, said plainly
  const flag = (cs) => ({ out: cs.filter(c => c.d > c.tol).length, n: cs.length, worst: cs.reduce((m, c) => (c.d > m.d ? c : m), { d: 0 }), rel: cs.filter(c => c.want >= 100).reduce((m, c) => Math.max(m, c.d / c.want), 0) });
  const lastOwn = flag(compare(n - 1)), lastSolved = flag(compare(n - 1, n - 2));
  row('CHECK', 'at the hand-over (step ' + (rec.clock.k0 + n - 1) + ', pitched ' + f(rec.channels.pitch[n - 1] * 180 / Math.PI, 1) + ' degrees), from the record alone: its last level against the water and pose it was solved for (the sample before), and against the last sample\'s own',
    'solved for: ' + lastSolved.out + ' of ' + lastSolved.n + ' wet spaces outside the tolerance, the most ' + f(lastSolved.worst.d, 1) + ' m3 (space ' + lastSolved.worst.q + '); its own: ' + lastOwn.out + ' of ' + lastOwn.n + ', the most ' + f(lastOwn.worst.d, 1) + ' m3 (space ' + lastOwn.worst.q + ', ' + f(lastOwn.worst.want, 1) + ' recorded), ' + f(100 * lastOwn.rel, 1) + ' % of the water at most in a space holding 100 m3 or more', 'the model\'s, recorded as it is', true);
} catch (e) {
  row('MUST', 'the suite ran', String(e && e.message || e), 'no error', false);
}
for (const [kind, what, value, ref, ok] of rows) console.log((ok ? 'PASS ' : (kind === 'MUST' ? 'FAIL ' : 'CHECK ')) + kind.padEnd(6) + what.padEnd(100) + ' ' + String(value).padEnd(60) + ' ' + ref);
const musts = rows.filter(r => r[0] === 'MUST').length;
console.log(fails ? '\nFAIL: ' + fails + ' MUST row(s)' : '\nPASS: all ' + musts + ' MUST rows' + (checks ? '; ' + checks + ' CHECK row(s) off' : ''));
process.exit(fails ? 1 : 0);
