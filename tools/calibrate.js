// Calibrate the flooding paths against the eyewitness-derived timeline (Halpern 2023) and the foundering time.
// Run: node tools/calibrate.js [iterations] [start JSON [area, wMul, aDown, fOpen]] [--fix-area] [--no-pumps] [--no-watch] [--wide]
//
// D73 (2026-11-20, G6b's landing; docs/DESIGN_W6_the_lists_v1_3_2026-11-20.md): the score also holds the 1912 WATCH's
// foundering, minutes after the touch, against 160 min at the preset founder's weight, ((T - 160) / 4)^2, so that the
// preset and the watch, which share one damage split (Hackett and Bedford's), are fitted together. Both founders are
// held to D69's 157 to 160 min by a steep penalty outside it (100 per minute squared). The watch's damage is the
// encounter's: for each area tried, its area constant is the exact fixed point at which the 1912 encounter opens that
// area (tools/calibrate_encounter.js's), so the constant that lands with the area is the one the fit used.
// --no-watch scores the preset alone, as before D73; --no-pumps implies it.
// G7's rung 2b (2026-11-20, the coordinator's word; BACKLOG G18): the 1912 watch is bimodal at the bit level. At
// pumpOwn + 30 min the engineers decide once to lead more pumps to boiler room 4 through the main, and skip it for good
// if roomLost(4) holds at that instant (core/systems.js); at G7's numbers boiler room 4 sits on that threshold then
// (T about 104 to 105), so a change of 2e-14 in the area constant moves the watch's founder by about 1.35 min. The
// watch's term is therefore taken on the branch where no pumps are led through the main (Sys.PLANT.pumpLent set to
// Infinity in this tool only, for that run; the plant keeps its defaults), and both that run and the watch as it is
// are held to the band.
const C = require('../core/core.js');
const SC = require('../core/scenarios.js');
const ship = C.buildShip();
const OBS = SC.OBS;

function interp(hist, t, key, after) {
  if (t >= hist[hist.length - 1].t) return after !== undefined ? after : hist[hist.length - 1][key];
  for (let i = 1; i < hist.length; i++) {
    if (hist[i].t >= t) { const a = hist[i - 1], b = hist[i]; const u = (t - a.t) / (b.t - a.t); return a[key] + u * (b[key] - a[key]); }
  }
  return hist[0][key];
}

const NO_PUMPS = process.argv.includes('--no-pumps');   // the 1912 damage without its pumps (as calibrated before Y3)
// The epoch's C6 (D82b): x.bunkerOpen, and watchFounder's and watchFounders's third argument, is the bunker's own opening
// (m2), for stage D to sample with params.bunkerBurst: on the preset boiler room 5's holes total it (core/scenarios.js),
// on the watch the torn stations along the bunker do (ICE.bunkerOpen through the night's spec.ice). The area and its
// area constant stay those of the whole damage as fitted, so every other compartment opens as it does. Absent (or
// null), both runs are today's to the bit.
const own = (b) => b !== null && b !== undefined;
function simulate(x) {
  const params = Object.assign({}, x.params);
  const sim = C.createSim(ship, params, SC.PRESETS.titanic.build(own(x.bunkerOpen) ? { areaTitanic: x.area, noPumps: NO_PUMPS, bunkerOpen: x.bunkerOpen } : { areaTitanic: x.area, noPumps: NO_PUMPS }));
  const res = C.run(sim, { tMax: 260 * 60, every: 30 });
  return { sim, res };
}

function score(out, verbose) {
  const { res } = out;
  const H = res.hist;
  const Tf = res.foundered ? res.founderT / 60 : 300;
  let J = 0; const rows = [];
  const G = { trim: 0, founder: 0, list: 0, events: 0 };   // A4 (the epoch, stage A): J by group, printed; J itself as before
  for (const [m, obs] of OBS.trim) {
    if (m === 0) continue;
    const s = m <= 45 ? 0.3 : m <= 100 ? 0.4 : m <= 130 ? 0.7 : 1.5;
    const v = m * 60 > (res.foundered ? res.founderT : 1e9) ? 40 : interp(H, m * 60, 'trim');
    const j = ((v - obs) / s) ** 2; J += j; G.trim += j; rows.push(['trim', m, obs, v]);
  }
  { const j = ((Tf - OBS.founder) / 4) ** 2; J += j; G.founder += j; rows.push(['founder', '-', OBS.founder, Tf]); }
  for (const [m, obs] of OBS.list) {
    const v = m * 60 > (res.foundered ? res.founderT : 1e9) ? 0 : interp(H, m * 60, 'list');
    const j = 0.25 * ((v - obs) / 3) ** 2; J += j; G.list += j; rows.push(['list', m, obs, v]);
  }
  const evT = id => { const e = res.events.find(e => e.id === id); return e ? e.t / 60 : Tf; };
  for (const [id, obs, s] of [['well', 130, 8], ['bridge', 155, 5], ['overF', 75, 8]]) {
    const v = evT(id), j = ((v - obs) / s) ** 2; J += j; G.events += j; rows.push(['event:' + id, '-', obs, v]);
  }
  if (verbose) {
    for (const r of rows) console.log(r[0].padEnd(13), String(r[1]).padStart(4), 'obs', String(r[2]).padStart(6), 'model', (+r[3]).toFixed(2).padStart(7));
    console.log('J by group: ' + Object.entries(G).map(([k, v]) => k + ' ' + v.toFixed(3) + ' (' + (100 * v / J).toFixed(0) + ' %)').join(', '));
  }
  return J;
}

// D73: the 1912 watch. Loaded only when used, so that tools requiring this file for simulate() and score() pay nothing.
const WATCH = !process.argv.includes('--no-watch') && !NO_PUMPS;
const BAND = [157, 160];                                // D69's condition 2: both founders within 157 to 160 min
const outside = (T) => (T > BAND[1] ? T - BAND[1] : (T < BAND[0] ? BAND[0] - T : 0));
let W = null;
const alphaMemo = new Map();
function watchModules() {
  if (!W) {
    const E = require('../core/encounter.js'), N = require('../core/night.js'), R = require('./encounter_run.js');
    W = { E, N, R, Sys: require('../core/systems.js'), G: Object.assign({ portAround: 0 }, N.GEOM_1912), a0: E.ICE.alpha };
  }
  return W;
}
// the area constant at which the 1912 encounter opens `area` (tools/calibrate_encounter.js's fixed point and tolerance)
function alphaFor(area) {
  if (alphaMemo.has(area)) return alphaMemo.get(area);
  const { E, R, G, a0 } = watchModules();
  let alpha = a0 * area / SC.CALIBRATED_AREA;
  for (let it = 0; it < 40; it++) {
    const s = E.summary(R.encounter(Object.assign({}, G, { ice: { alpha } }), ship)), tot = s.stbd.area + s.port.area;
    if (Math.abs(tot - area) < 1e-10) break;
    alpha *= area / tot;
  }
  alphaMemo.set(area, alpha);
  return alpha;
}
function watchFounder(params, area, bunkerOpen) {
  const { E, N } = watchModules(), keep = E.ICE.alpha;
  E.ICE.alpha = alphaFor(area);
  try {
    const sp = N.spec(1912);
    if (own(bunkerOpen)) sp.ice = Object.assign({}, sp.ice, { bunkerOpen });
    // G12's step 0 (D98): the watch's founder is fitted at the flag, whatever the default hand-over becomes
    const sim = N.sink(N.create(ship, sp, { auto: true, readers: false, params, handover: 'flag' })); return sim.foundered ? (sim.founderT - sim.night.tTouch) / 60 : 300;
  }
  finally { E.ICE.alpha = keep; }
}
// G7's rung 2b: the watch as it is, and on the branch where no pumps are led through the main (G18)
function watchFounders(params, area, bunkerOpen) {
  const { Sys } = watchModules(), asis = watchFounder(params, area, bunkerOpen), keep = Sys.PLANT.pumpLent;
  Sys.PLANT.pumpLent = Infinity;
  try { return { asis, never: watchFounder(params, area, bunkerOpen) }; }
  finally { Sys.PLANT.pumpLent = keep; }
}

const keys = ['area', 'wMul', 'aDown', 'fOpen'];
// The bounds (D73). The area from the calibrated 0.7506 m2 (before G6b) to Wilding's 12 sq ft, 1.115 m2: D69 lets it
// move toward its sources' value. Each flow number within half its value before G6b (D69's condition 3; D69_BASE).
// And, to keep every verdict of tools/validate.js, wMul at most 1.1 and aDown at least 0.24 (KEEP_B): past them the
// bulkheads-to-B-deck what-if founders at about 6 h on Hackett and Bedford's split, a knife edge in both
// (docs/research/experiments/e90_b_deck_what_if.js). --wide gives the bounds before D73, for what-ifs.
// G7 (join 7): with the forepeak's tank the B-deck what-if founders inside these bounds (5h17m at rung 2, which agrees
// with Wilding); under D75 as refined it is reported and does not bind, so the bounds have lost their reason. They
// stay until the calibration epoch frees them (QC E-2; docs/research/RESULT_G7_ladder_v1_2026-11-20.md, section 5).
const D69_BASE = { area: 0.7506, wMul: 1.036, aDown: 0.2815, fOpen: 0.02068 }, AREA_MAX = 1.115;
const KEEP_B = { wMulMax: 1.1, aDownMin: 0.24 };
const WIDE = process.argv.includes('--wide');
const lo = WIDE ? [0.4, 0.03, 0.1, 0.002] : [D69_BASE.area, 0.5 * D69_BASE.wMul, Math.max(0.5 * D69_BASE.aDown, KEEP_B.aDownMin), 0.5 * D69_BASE.fOpen];
const hi = WIDE ? [1.5, 3, 8, 0.6] : [AREA_MAX, Math.min(1.5 * D69_BASE.wMul, KEEP_B.wMulMax), 1.5 * D69_BASE.aDown, 1.5 * D69_BASE.fOpen];
function decode(v) {
  const x = keys.map((k, i) => Math.min(hi[i], Math.max(lo[i], Math.exp(v[i]))));
  return { area: x[0], params: { wMul: x[1], aDown: x[2], fOpen: x[3] }, raw: x };
}
let evals = 0, best = { J: Infinity };
function objective(v) {
  const x = decode(v);
  const out = simulate(x);
  let J = score(out), tail = '';
  if (WATCH) {
    const Tp = out.res.foundered ? out.res.founderT / 60 : 300, W2 = watchFounders(x.params, x.area, x.bunkerOpen);
    J += ((W2.never - 160) / 4) ** 2 + 100 * (outside(W2.never) ** 2 + outside(W2.asis) ** 2 + outside(Tp) ** 2);
    tail = ` watch=${W2.asis.toFixed(2)} never-led=${W2.never.toFixed(2)}`;
  }
  evals++;
  if (J < best.J) { best = { J, x }; console.log(`#${evals} J=${J.toFixed(2)} ` + keys.map((k, i) => `${k}=${x.raw[i].toPrecision(3)}`).join(' ') + ` Tf=${out.res.foundered ? (out.res.founderT / 60).toFixed(1) : 'afloat'}` + tail); }
  return J;
}
function nelderMead(f, x0, step, iters) {
  const n = x0.length;
  let pts = [x0.slice()];
  for (let i = 0; i < n; i++) { const p = x0.slice(); p[i] += step[i]; pts.push(p); }
  let vals = pts.map(f);
  for (let it = 0; it < iters; it++) {
    const idx = vals.map((v, i) => i).sort((a, b) => vals[a] - vals[b]);
    pts = idx.map(i => pts[i]); vals = idx.map(i => vals[i]);
    const c = new Array(n).fill(0);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) c[j] += pts[i][j] / n;
    const w = pts[n];
    const xr = c.map((cj, j) => cj + (cj - w[j])); const fr = f(xr);
    if (fr < vals[0]) { const xe = c.map((cj, j) => cj + 2 * (cj - w[j])); const fe = f(xe); if (fe < fr) { pts[n] = xe; vals[n] = fe; } else { pts[n] = xr; vals[n] = fr; } }
    else if (fr < vals[n - 1]) { pts[n] = xr; vals[n] = fr; }
    else { const xc = c.map((cj, j) => cj + 0.5 * (w[j] - cj)); const fc = f(xc); if (fc < vals[n]) { pts[n] = xc; vals[n] = fc; } else { for (let i = 1; i <= n; i++) { pts[i] = pts[i].map((v, j) => pts[0][j] + 0.5 * (v - pts[0][j])); vals[i] = f(pts[i]); } } }
  }
  return { x: pts[0], f: vals[0] };
}

if (require.main === module) {
  const iters = +(process.argv[2] || 40);
  // the default start: inside D73's bounds (G6b's hand point A', which keeps every verdict: e89)
  const start = process.argv[3] && process.argv[3][0] === '[' ? JSON.parse(process.argv[3]) : [0.78, 1.036, 0.25, 0.02068];
  // --fix-area: hold the opening area at the start value and fit the three flow parameters only (Y3 refitted this way,
  // so the iceberg encounter's area constant, fitted to this area, stays as it is)
  if (process.argv.includes('--fix-area')) { lo[0] = hi[0] = start[0]; console.log('area held at', start[0]); }
  console.log((WATCH ? 'the preset and the 1912 watch (D73), both founders held to ' + BAND.join(' to ') + ' min' : 'the preset alone') + '; bounds ' + JSON.stringify({ lo, hi }) + '; start ' + JSON.stringify(start));
  const x0 = start.map(Math.log);
  // the first steps: smaller inside D73's narrow bounds (e89's), as before D73 otherwise
  const r = nelderMead(objective, x0, WIDE || !WATCH ? [0.2, 0.6, 0.6, 0.8] : [0.1, 0.3, 0.3, 0.3], iters);
  const x = decode(r.x);
  console.log('\nBEST', JSON.stringify({ area: +x.area.toFixed(4), params: Object.fromEntries(Object.entries(x.params).map(([k, v]) => [k, +v.toPrecision(4)])) }));
  const out = simulate(x);
  console.log('J', score(out, true).toFixed(3));
  if (WATCH) {
    const W2 = watchFounders(x.params, x.area, x.bunkerOpen);
    console.log('the watch founders at ' + W2.asis.toFixed(2) + ' min after the touch as it is, ' + W2.never.toFixed(2) + ' with no pumps led through the main (the term ' + (((W2.never - 160) / 4) ** 2).toFixed(3) + ', G18); the preset at ' + (out.res.founderT / 60).toFixed(2) + '; the area constant at this area ' + alphaFor(x.area));
  }
  console.log('evals', evals);
}
module.exports = { simulate, score, decode, interp, watchFounder, watchFounders, alphaFor };
