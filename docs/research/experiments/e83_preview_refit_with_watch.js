// e83 (the G6 and W6 preview, option (a)): one flooding refit with both in, whose score holds the 1912 WATCH's foundering
// as well as the preset's. tools/calibrate.js scores the 1912 damage preset alone (trims, its founder against 160 min
// with a scale of 4 min, the list, three events); here the watch's founder (the 1912 orders, the engineers' pumps,
// minutes after the touch) is added with the same weight: ((T - 160) / 4)^2. The opening held at 0.7506 m2 (as Y3 and
// S1 refitted), the three flow numbers fitted, Nelder-Mead as calibrate.js. A preview: nothing is adopted.
//   node docs/research/experiments/e83_preview_refit_with_watch.js [iterations] [start JSON]   (about ten minutes)
const path = require('path');
const root = path.join(__dirname, '..', '..', '..');
const C = require(path.join(root, 'core', 'core.js'));
const N = require(path.join(root, 'core', 'night.js'));
const CAL = require(path.join(root, 'tools', 'calibrate.js'));
const ship = C.buildShip();
const iters = +(process.argv[2] || 45);
const start = process.argv[3] ? JSON.parse(process.argv[3]) : [0.7506, 1.036, 0.2815, 0.02068];
// --free-area: fit the opening's total area too (calibrate.js's bounds, 0.4 to 1.5 m2); the watch's damage then scales
// with it (the encounter's area constant times area / 0.7506: the 1912 encounter's opened area is near proportional to
// it), so that the preset and the watch keep one damage
const FREE = process.argv.includes('--free-area');
const E = require(path.join(root, 'core', 'encounter.js')), ALPHA0 = E.ICE.alpha;
const lo = [FREE ? 0.4 : start[0], 0.03, 0.1, 0.002], hi = [FREE ? 1.5 : start[0], 3, 8, 0.6];
const decode = (v) => { const x = v.map((e, i) => Math.min(hi[i], Math.max(lo[i], Math.exp(e)))); return { area: x[0], params: { wMul: x[1], aDown: x[2], fOpen: x[3] }, raw: x }; };
function watchFounder(params, area) {
  E.ICE.alpha = ALPHA0 * (area || 0.7506) / 0.7506;
  try {
    const sim = N.sink(N.create(ship, N.spec(1912), { auto: true, readers: false, params }));
    return sim.foundered ? (sim.founderT - sim.night.tTouch) / 60 : 300;
  } finally { E.ICE.alpha = ALPHA0; }
}
let evals = 0, best = { J: Infinity };
function objective(v) {
  const x = decode(v), out = CAL.simulate(x), Jp = CAL.score(out), Tw = watchFounder(x.params, x.area), J = Jp + ((Tw - 160) / 4) ** 2;
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
console.log('e83: the opening held at ' + start[0] + '; start ' + JSON.stringify(start));
const r = nelderMead(objective, start.map(Math.log), [0.2, 0.6, 0.6, 0.8], iters), x = decode(r.x);
console.log('\nBEST ' + JSON.stringify({ area: x.area, params: Object.fromEntries(Object.entries(x.params).map(([k, v]) => [k, +v.toPrecision(4)])) }));
const out = CAL.simulate(x), Jp = CAL.score(out, true), Tw = watchFounder(x.params, x.area);
console.log('preset J ' + Jp.toFixed(3) + '; the watch founders at ' + Tw.toFixed(2) + ' min (its term ' + (((Tw - 160) / 4) ** 2).toFixed(3) + '); J ' + (Jp + ((Tw - 160) / 4) ** 2).toFixed(3) + '; evals ' + evals);
