// Fit the parametric hull so the column-integrated hydrostatics match the
// Harland & Wolff numbers for Titanic. Run: node tools/fit_hull.js
const C = require('../core/core.js');
const FT = C.FT;

const T1 = 32.25 * FT;            // mean draft night of 14 April (Wilding)
const T2 = (34 + 7 / 12) * FT;    // load draft 34'7"
const targets = [
  // [label, fn(hyd), target, scale, weight]
  ['V @32\'3"  (m3)', h => h.t1.V, 1690500 * FT ** 3, 300, 3],
  ['Awp @32\'3" (m2)', h => h.t1.Awp, 59889 * FT ** 2, 40, 2],
  ['LCF @32\'3" (m)', h => h.t1.LCF, -10 * FT, 0.6, 1],
  ['KB @32\'3" (m)', h => h.t1.KB, 17.47 * FT, 0.05, 1],
  ['BM @32\'3" (m)', h => h.t1.BM, 20.86 * FT, 0.06, 2],
  ['V @34\'7"  (m3)', h => h.t2.V, 52310 * 35 * FT ** 3, 300, 2],
  ['Awp @34\'7" (m2)', h => h.t2.Awp, 143.8 * 420 * FT ** 2, 50, 1],
  ['LCB @34\'3" (m)', h => h.t3.LCB, -5.7 * FT, 0.8, 0.5],
  ['Cm @34\'7"', h => h.cm, 0.970, 0.004, 1],
];

const keys = ['xPF0', 'xPF1', 'xPA0', 'xPA1', 'nF0', 'nF1', 'nA0', 'nA1', 'rb'];
const lo = [-30, -10, -90, -90, 0.8, 1.2, 0.8, 1.2, 2.0];
const hi = [70, 70, 10, 10, 3.0, 3.6, 3.0, 3.6, 6.5];

function paramsFrom(v) {
  const P = Object.assign({}, C.HULL);
  keys.forEach((k, i) => { P[k] = v[i]; });
  return P;
}

function evaluate(P) {
  const cols = C.buildColumns(P, { dx: 3.0, dy: 0.5 });
  const t1 = C.evenKeel(cols, T1);
  const t2 = C.evenKeel(cols, T2);
  const t3 = C.evenKeel(cols, 34.25 * FT);
  // midship coefficient from the slice nearest x = 0
  let area = 0; const dy = cols.dy;
  let best = null;
  for (const s of cols.slices) if (!best || Math.abs(s.xc) < Math.abs(best.xc)) best = s;
  for (let i = best.first; i < best.first + best.count; i++) {
    const lo_ = cols.zlo[i], hi_ = cols.zhi[i];
    const s = T2 <= lo_ ? 0 : Math.min(T2, hi_) - lo_;
    area += dy * Math.max(0, s);
  }
  const cm = area / (C.G.B * T2);
  return { t1, t2, t3, cm, cols };
}

function objective(v) {
  let pen = 0;
  for (let i = 0; i < v.length; i++) {
    if (v[i] < lo[i]) pen += 1e3 * (lo[i] - v[i]) ** 2;
    if (v[i] > hi[i]) pen += 1e3 * (v[i] - hi[i]) ** 2;
  }
  const P = paramsFrom(v.map((x, i) => Math.min(hi[i], Math.max(lo[i], x))));
  const h = evaluate(P);
  let f = pen;
  for (const [, fn, tgt, sc, w] of targets) f += w * ((fn(h) - tgt) / sc) ** 2;
  return f;
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
    const xr = c.map((cj, j) => cj + (cj - w[j]));
    const fr = f(xr);
    if (fr < vals[0]) {
      const xe = c.map((cj, j) => cj + 2 * (cj - w[j])); const fe = f(xe);
      if (fe < fr) { pts[n] = xe; vals[n] = fe; } else { pts[n] = xr; vals[n] = fr; }
    } else if (fr < vals[n - 1]) { pts[n] = xr; vals[n] = fr; }
    else {
      const xc = c.map((cj, j) => cj + 0.5 * (w[j] - cj)); const fc = f(xc);
      if (fc < vals[n]) { pts[n] = xc; vals[n] = fc; }
      else {
        for (let i = 1; i <= n; i++) { pts[i] = pts[i].map((v, j) => pts[0][j] + 0.5 * (v - pts[0][j])); vals[i] = f(pts[i]); }
      }
    }
    if (it % 100 === 0) process.stderr.write(`iter ${it} f=${vals[0].toFixed(4)}\n`);
  }
  return { x: pts[0], f: vals[0] };
}

const x0 = keys.map(k => C.HULL[k]);
let res = nelderMead(objective, x0, [10, 10, 10, 10, 0.3, 0.3, 0.3, 0.3, 0.5], 700);
res = nelderMead(objective, res.x, [3, 3, 3, 3, 0.1, 0.1, 0.1, 0.1, 0.2], 500);
res = nelderMead(objective, res.x, [1, 1, 1, 1, 0.05, 0.05, 0.05, 0.05, 0.1], 400);
const P = paramsFrom(res.x);
const h = evaluate(P);
console.log('objective', res.f.toFixed(5));
console.log('params', JSON.stringify(keys.reduce((o, k) => (o[k] = +P[k].toFixed(3), o), {})));
for (const [label, fn, tgt] of targets) {
  const v = fn(h);
  console.log(label.padEnd(18), 'model', v.toFixed(3).padStart(11), ' target', tgt.toFixed(3).padStart(11), ' err', ((v - tgt) / Math.abs(tgt) * 100).toFixed(2) + '%');
}
console.log('columns', h.cols.N, 'slices', h.cols.slices.length);
console.log('extra @32\'3": LCB', h.t1.LCB.toFixed(2), 'BML', h.t1.BML.toFixed(1), 'Cb(LBP)', (h.t1.V / (C.G.LBP * C.G.B * T1)).toFixed(3));
