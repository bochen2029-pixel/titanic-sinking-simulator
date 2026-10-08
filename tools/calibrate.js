// Calibrate the flooding paths against the eyewitness-derived timeline (Halpern 2023)
// and the foundering time. Run: node tools/calibrate.js [iterations]
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

function simulate(x) {
  const params = Object.assign({}, x.params);
  const sim = C.createSim(ship, params, SC.PRESETS.titanic.build({ areaTitanic: x.area }));
  const res = C.run(sim, { tMax: 260 * 60, every: 30 });
  return { sim, res };
}

function score(out, verbose) {
  const { res } = out;
  const H = res.hist;
  const Tf = res.foundered ? res.founderT / 60 : 300;
  let J = 0; const rows = [];
  for (const [m, obs] of OBS.trim) {
    if (m === 0) continue;
    const s = m <= 45 ? 0.3 : m <= 100 ? 0.4 : m <= 130 ? 0.7 : 1.5;
    const v = m * 60 > (res.foundered ? res.founderT : 1e9) ? 40 : interp(H, m * 60, 'trim');
    J += ((v - obs) / s) ** 2; rows.push(['trim', m, obs, v]);
  }
  J += ((Tf - OBS.founder) / 4) ** 2; rows.push(['founder', '-', OBS.founder, Tf]);
  for (const [m, obs] of OBS.list) {
    const v = m * 60 > (res.foundered ? res.founderT : 1e9) ? 0 : interp(H, m * 60, 'list');
    J += 0.25 * ((v - obs) / 3) ** 2; rows.push(['list', m, obs, v]);
  }
  const evT = id => { const e = res.events.find(e => e.id === id); return e ? e.t / 60 : Tf; };
  for (const [id, obs, s] of [['well', 130, 8], ['bridge', 155, 5], ['overF', 75, 8]]) {
    const v = evT(id); J += ((v - obs) / s) ** 2; rows.push(['event:' + id, '-', obs, v]);
  }
  if (verbose) for (const r of rows) console.log(r[0].padEnd(13), String(r[1]).padStart(4), 'obs', String(r[2]).padStart(6), 'model', (+r[3]).toFixed(2).padStart(7));
  return J;
}

const keys = ['area', 'wMul', 'aDown', 'fOpen'];
const lo = [0.4, 0.03, 0.1, 0.002], hi = [1.5, 3, 8, 0.6];
function decode(v) {
  const x = keys.map((k, i) => Math.min(hi[i], Math.max(lo[i], Math.exp(v[i]))));
  return { area: x[0], params: { wMul: x[1], aDown: x[2], fOpen: x[3] }, raw: x };
}
let evals = 0, best = { J: Infinity };
function objective(v) {
  const x = decode(v);
  const out = simulate(x);
  const J = score(out);
  evals++;
  if (J < best.J) { best = { J, x }; console.log(`#${evals} J=${J.toFixed(2)} ` + keys.map((k, i) => `${k}=${x.raw[i].toPrecision(3)}`).join(' ') + ` Tf=${out.res.foundered ? (out.res.founderT / 60).toFixed(1) : 'afloat'}`); }
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
  const start = process.argv[3] ? JSON.parse(process.argv[3]) : [0.75, 0.4, 1.0, 0.02];
  const x0 = start.map(Math.log);
  const r = nelderMead(objective, x0, [0.2, 0.6, 0.6, 0.8], iters);
  const x = decode(r.x);
  console.log('\nBEST', JSON.stringify({ area: +x.area.toFixed(4), params: Object.fromEntries(Object.entries(x.params).map(([k, v]) => [k, +v.toPrecision(4)])) }));
  const out = simulate(x);
  console.log('J', score(out, true).toFixed(3));
  console.log('evals', evals);
}
module.exports = { simulate, score, decode, interp };
