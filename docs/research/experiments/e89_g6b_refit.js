// e89 (G6b): one flooding refit with ONE damage split for the 1912 damage preset and the 1912 watch, against D69's five
// conditions (docs/DESIGN_W6_the_lists_v1_2_2026-11-20.md, section 2). On wt/split (G6 and W6 on main 4bf604e) with
// ICE.openAlong (G6b's prototype in core/encounter.js). The candidates (docs/research/RESEARCH_damage_split_by_compartment_G6b_v1_2026-11-20.md):
//   A: Hackett and Bedford's opening areas (JOM 1998, Table I) for both: 0.056 0.139 0.288 0.307 0.260 0.121 m2
//   B: theirs forward of boiler room 5, boiler room 5 at the encounter's own share (G6), for both
//   C: the encounter's own split (G6) for both: the preset takes it; openAlong none
// The preset's TITANIC_SPLIT takes the candidate's fractions; the watch's openings are scaled per compartment to the
// same split (openAlong), the area constant refound so that the 1912 encounter opens 0.7506 m2, then scaled with the
// opening's total area as e83 does. The score: tools/calibrate.js's for the preset, plus the watch's founder against
// 160 min at the preset founder's weight, ((T - 160) / 4)^2, as e83. Nelder-Mead as calibrate.js.
//   node docs/research/experiments/e89_g6b_refit.js <A|B|C> [iterations] [start JSON [area,wMul,aDown,fOpen]] [--d69]
//   node docs/research/experiments/e89_g6b_refit.js <A|B|C> --check '[area,wMul,aDown,fOpen]'
// --d69: each flow number held within half its value (D69's condition 3: wMul 0.518 to 1.554, aDown 0.141 to 0.422,
// fOpen 0.0103 to 0.0310); the area free between 0.7506 m2 and Wilding's 12 sq ft, 1.115 m2 (D69 lets it move to its
// sources' value). --check: D69's conditions 1 to 4 at the numbers given: the validation table (tools/validate.js run
// in this process with them, its file written under out/gate/e89, untracked), both founders, the moves, J.
const path = require('path');
const root = path.join(__dirname, '..', '..', '..');
const C = require(path.join(root, 'core', 'core.js'));
const E = require(path.join(root, 'core', 'encounter.js'));
const N = require(path.join(root, 'core', 'night.js'));
const R = require(path.join(root, 'tools', 'encounter_run.js'));
const SC = require(path.join(root, 'core', 'scenarios.js'));
const CAL = require(path.join(root, 'tools', 'calibrate.js'));
const ship = C.buildShip(), G = Object.assign({ portAround: 0 }, N.GEOM_1912);
const TODAY = { area: 0.7506, wMul: 1.036, aDown: 0.2815, fOpen: 0.02068 }, J0 = 9.39;
const bx = C.zoneBounds(), xB = C.BULKHEADS.find(b => b.id === 'E').x - 9 * C.FT, ALPHA0 = E.ICE.alpha, TARGET = 0.7506;
const enc = (ice) => E.summary(R.encounter(Object.assign({}, G, { ice: Object.assign({ openAlong: null }, ice) }), ship));
const shares = (s) => { const t = s.stbd.area + s.port.area; return [0, 1, 2, 3, 4, 5].map(k => 100 * s.stbd.zone[k] / t); };
function fixAlpha(openAlong) { let alpha = ALPHA0, s; for (let it = 0; it < 40; it++) { s = enc({ alpha, openAlong }); const tot = s.stbd.area + s.port.area; if (Math.abs(tot - TARGET) < 1e-10) break; alpha *= TARGET / tot; } return { alpha, s }; }
const base = fixAlpha(null), cur = shares(base.s);
const HBa = [0.056, 0.139, 0.288, 0.307, 0.260, 0.121], HBt = HBa.reduce((a, b) => a + b, 0), HB = HBa.map(a => 100 * a / HBt);
const fwd = HB.slice(0, 5), fsum = fwd.reduce((a, b) => a + b, 0), Bs = fwd.map(v => v * (100 - cur[5]) / fsum).concat([cur[5]]);
const name = process.argv[2], sp = { A: HB, B: Bs, C: cur }[name];
if (!sp) { console.log('e89: give a candidate, A, B or C'); process.exit(1); }
const open = name === 'C' ? null : [[bx[1], 200, sp[0] / cur[0]], [bx[2], bx[1], sp[1] / cur[1]], [bx[3], bx[2], sp[2] / cur[2]], [bx[4], bx[3], sp[3] / cur[3]], [bx[5], bx[4], sp[4] / cur[4]], [xB, bx[5], sp[5] / cur[5]]];
const fx = name === 'C' ? base : fixAlpha(open);
SC.TITANIC_SPLIT.forEach((s, k) => { s.f = sp[k] / 100; });
E.ICE.openAlong = open; E.ICE.alpha = fx.alpha;
const ALPHA1 = fx.alpha;
console.log('e89 (G6b) candidate ' + name + ' on ' + root + ': the split ' + sp.map(v => v.toFixed(2)).join('/') + ' (the watch\'s ' + shares(fx.s).map(v => v.toFixed(2)).join('/') + '); openAlong ' + JSON.stringify(open && open.map(r => r.map(v => +v.toFixed(4)))) + '; alpha ' + ALPHA1);
function watchFounder(params, area) {
  E.ICE.alpha = ALPHA1 * area / 0.7506;
  try { const sim = N.sink(N.create(ship, N.spec(1912), { auto: true, readers: false, params })); return sim.foundered ? (sim.founderT - sim.night.tTouch) / 60 : 300; }
  finally { E.ICE.alpha = ALPHA1; }
}
const ci = process.argv.indexOf('--check');
if (ci > 0) {
  const [area, wMul, aDown, fOpen] = JSON.parse(process.argv[ci + 1]), params = { wMul, aDown, fOpen };
  const x = { area, params }, out = CAL.simulate(x), Jp = CAL.score(out), Tp = out.res.foundered ? out.res.founderT / 60 : NaN, Tw = watchFounder(params, area);
  console.log('\nat area ' + area + ' m2 (' + (area * 10.7639).toFixed(2) + ' sq ft), ' + JSON.stringify(params) + ':');
  console.log('  (2) the preset founders at T ' + Tp.toFixed(2) + ', the watch at T ' + Tw.toFixed(2) + ' (157 to 160)');
  const mv = ['wMul', 'aDown', 'fOpen'].map(k => k + ' ' + (100 * (params[k] / TODAY[k] - 1)).toFixed(0) + ' %');
  console.log('  (3) the moves: ' + mv.join(', ') + ' (no more than 50 %); the area ' + (100 * (area / TODAY.area - 1)).toFixed(1) + ' %, toward the sources\' 12 to 12.6 sq ft');
  console.log('  (4) J (the preset) ' + Jp.toFixed(2) + ' (no more than ' + (1.2 * J0).toFixed(2) + '); the watch\'s term ' + (((Tw - 160) / 4) ** 2).toFixed(2));
  // (5) where her last hour's water goes (e84's table), and the rooms' times (e85's), on the watch with these numbers
  const byZone = (sim) => { const z = new Float64Array(16); for (let n = 0; n < C.NN; n++) z[n >> 2] += sim.vol[n]; for (const k of sim.pockets || []) z[k.node >> 2] += k.vol; return z; };
  E.ICE.alpha = ALPHA1 * area / 0.7506;
  const sim = N.create(ship, N.spec(1912), { auto: true, readers: false, params }), snaps = [], first = {}, lists = [];
  const mark = (key, t) => { if (first[key] === undefined) first[key] = t; };
  const LT = [10, 20, 30, 45, 60, 75, 85, 100, 110, 120, 130, 145, 155];
  let lastSign = 0, changes = [];
  while (!N.over(sim) && sim.t < 5 * 3600) {
    N.step(sim);
    if (Math.round(sim.t * 4) % 240 === 0) snaps.push([sim.t, byZone(sim)]);
    if (sim.night.tTouch < 0) continue;
    const T = (sim.t - sim.night.tTouch) / 60, F = C.frameOf(sim);
    // her list (+ starboard, degrees), against W6's band A (D62): Hichens +3 to +7 early; the change of side between
    // T 85 and T 110; Rowe -3 to -9 at T 120
    const roll = sim.roll * 180 / Math.PI;
    if (lists.length < LT.length && T >= LT[lists.length]) lists.push([LT[lists.length], roll]);
    const sg = roll > 0.5 ? 1 : (roll < -0.5 ? -1 : 0);
    if (sg !== 0 && sg !== lastSign) { if (lastSign !== 0) changes.push([T, sg]); lastSign = sg; }
    for (let k = 0; k < 12; k++) {
      const Z = sim.ship.zones[k]; let vol = 0, depth = 0;
      for (let s = 0; s < 2; s++) { const n = C.nodeIndex(k, s, 0); vol += sim.vol[n]; if (sim.vol[n] > 1e-6) depth = Math.max(depth, sim.level[n] - C.worldZ(F, Z.xm, 0, Z.floor)); }
      const up = sim.vol[C.nodeIndex(k, 0, 1)] + sim.vol[C.nodeIndex(k, 1, 1)];
      if (vol > 1) mark(k + ':any', T); if (depth > 0.3) mark(k + ':0.3', T); if (depth > 2.44) mark(k + ':8ft', T); if (up > 1) mark(k + ':E', T);
    }
  }
  E.ICE.alpha = ALPHA1;
  const t0 = sim.night.tTouch, tEnd = sim.founderT, end = byZone(sim), hour = snaps.filter(s => s[0] <= tEnd - 3600).pop() || snaps[0];
  const gain = end.map((v, k) => v - hour[1][k]), tot = gain.reduce((a, b) => a + b, 0);
  console.log('  (5) the watch\'s last hour, from T ' + ((hour[0] - t0) / 60).toFixed(1) + ' to T ' + ((tEnd - t0) / 60).toFixed(2) + ': ' + tot.toFixed(0) + ' m3 gained');
  console.log('      compartment   an hour before   at the end    gained   share    | 0.3 m over the floor, 8 ft, above E deck (T)');
  const f = (x) => (x === undefined ? '    -' : x.toFixed(1).padStart(6));
  for (let k = 0; k < 13; k++) console.log('      ' + C.ZONES[k].short.padEnd(12) + hour[1][k].toFixed(0).padStart(12) + end[k].toFixed(0).padStart(14) + gain[k].toFixed(0).padStart(10) + (100 * gain[k] / tot).toFixed(1).padStart(7) + ' %  |' + f(first[k + ':0.3']) + f(first[k + ':8ft']) + f(first[k + ':E']));
  console.log('  W6\'s band A (D62) on the watch: her list (+ starboard) ' + lists.map(([t, r]) => 'T ' + t + ' ' + r.toFixed(2)).join(', '));
  console.log('      changes of side (past 0.5 degrees): ' + (changes.length ? changes.map(([t, s]) => 'T ' + t.toFixed(1) + ' to ' + (s > 0 ? 'starboard' : 'port')).join(', ') : 'none') + ' (band A: Hichens +3 to +7 early; the change of side between T 85 and T 110; Rowe -3 to -9 at T 120)');
  // (1) the validation table, tools/validate.js in this process with these numbers
  process.env.TITANIC_OUT = path.join(root, 'out', 'gate', 'e89');
  const mk = C.createSim, b0 = SC.PRESETS.titanic.build;
  C.createSim = (sh, p, scen) => mk(sh, Object.assign({}, params, p || {}), scen);
  SC.PRESETS.titanic.build = (p) => b0(Object.assign({ areaTitanic: area }, p || {}));
  console.log('  (1) the validation table with these numbers:');
  require(path.join(root, 'tools', 'validate.js'));
  return;
}
const iters = +(process.argv[3] && process.argv[3][0] !== '-' ? process.argv[3] : 45);
const start = process.argv[4] && process.argv[4][0] === '[' ? JSON.parse(process.argv[4]) : [0.80, 1.217, 0.362, 0.01881];
const D69 = process.argv.includes('--d69');
let lo = D69 ? [0.7506, 0.5 * TODAY.wMul, 0.5 * TODAY.aDown, 0.5 * TODAY.fOpen] : [0.4, 0.03, 0.1, 0.002];
let hi = D69 ? [1.115, 1.5 * TODAY.wMul, 1.5 * TODAY.aDown, 1.5 * TODAY.fOpen] : [1.5, 3, 8, 0.6];
// --bounds '[[lo...],[hi...]]': other bounds (e.g. where validate.js's bulkheads-to-B-deck what-if stays afloat on
// this split: wMul at most about 1.15, aDown at least about 0.24, by the mainline's grid of 2026-11-20)
const bi = process.argv.indexOf('--bounds');
if (bi > 0) [lo, hi] = JSON.parse(process.argv[bi + 1]);
const decode = (v) => { const x = v.map((e, i) => Math.min(hi[i], Math.max(lo[i], Math.exp(e)))); return { area: x[0], params: { wMul: x[1], aDown: x[2], fOpen: x[3] }, raw: x }; };
// --band: both founders held inside D69's 157 to 160 min by a steep penalty outside it (100 per minute squared)
const BAND = process.argv.includes('--band');
const outside = (T) => (T > 160 ? T - 160 : (T < 157 ? 157 - T : 0));
let evals = 0, best = { J: Infinity };
function objective(v) {
  const x = decode(v), out = CAL.simulate(x), Jp = CAL.score(out), Tw = watchFounder(x.params, x.area);
  const Tp = out.res.foundered ? out.res.founderT / 60 : 300;
  const J = Jp + ((Tw - 160) / 4) ** 2 + (BAND ? 100 * (outside(Tw) ** 2 + outside(Tp) ** 2) : 0);
  evals++;
  if (J < best.J) { best = { J, x, Jp, Tw }; console.log('#' + evals + ' J=' + J.toFixed(2) + ' (preset ' + Jp.toFixed(2) + ', watch ' + Tw.toFixed(1) + ' min) area=' + x.raw[0].toPrecision(4) + ' wMul=' + x.raw[1].toPrecision(3) + ' aDown=' + x.raw[2].toPrecision(3) + ' fOpen=' + x.raw[3].toPrecision(3) + ' Tf=' + (out.res.foundered ? (out.res.founderT / 60).toFixed(1) : 'afloat')); }
  return J;
}
function nelderMead(f, x0, step, it) {
  const n = x0.length; let pts = [x0.slice()];
  for (let i = 0; i < n; i++) { const p = x0.slice(); p[i] += step[i]; pts.push(p); }
  let vals = pts.map(f);
  for (let k = 0; k < it; k++) {
    const idx = vals.map((v, i) => i).sort((a, b) => vals[a] - vals[b]); pts = idx.map(i => pts[i]); vals = idx.map(i => vals[i]);
    const c = new Array(n).fill(0); for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) c[j] += pts[i][j] / n;
    const w = pts[n], xr = c.map((cj, j) => cj + (cj - w[j])), fr = f(xr);
    if (fr < vals[0]) { const xe = c.map((cj, j) => cj + 2 * (cj - w[j])), fe = f(xe); if (fe < fr) { pts[n] = xe; vals[n] = fe; } else { pts[n] = xr; vals[n] = fr; } }
    else if (fr < vals[n - 1]) { pts[n] = xr; vals[n] = fr; }
    else { const xc = c.map((cj, j) => cj + 0.5 * (w[j] - cj)), fc = f(xc); if (fc < vals[n]) { pts[n] = xc; vals[n] = fc; } else { for (let i = 1; i <= n; i++) { pts[i] = pts[i].map((v, j) => pts[0][j] + 0.5 * (v - pts[0][j])); vals[i] = f(pts[i]); } } }
  }
  return { x: pts[0], f: vals[0] };
}
console.log('e89: ' + (D69 ? 'inside D69\'s bounds ' + JSON.stringify({ lo, hi }) : 'e83\'s bounds') + (BAND ? '; both founders held to 157 to 160 min' : '') + '; start ' + JSON.stringify(start));
const r = nelderMead(objective, start.map(Math.log), [0.1, 0.3, 0.3, 0.3], iters), x = decode(r.x);
console.log('\nBEST ' + JSON.stringify({ area: +x.area.toPrecision(5), params: Object.fromEntries(Object.entries(x.params).map(([k, v]) => [k, +v.toPrecision(4)])) }) + '; evals ' + evals);
const out = CAL.simulate(x), Jp = CAL.score(out, true), Tw = watchFounder(x.params, x.area);
console.log('preset J ' + Jp.toFixed(3) + ', founders at ' + (out.res.founderT / 60).toFixed(2) + '; the watch founders at ' + Tw.toFixed(2) + ' (its term ' + (((Tw - 160) / 4) ** 2).toFixed(3) + '); J ' + (Jp + ((Tw - 160) / 4) ** 2).toFixed(3));
