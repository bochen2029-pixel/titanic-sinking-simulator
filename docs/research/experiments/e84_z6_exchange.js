// e84 (Z1, 2026-11-20; Z6 milestone 2's groundwork): checks of the exchange law (e84_z6_exchange_lib.js) against closed
// forms, then the estimates of docs/research/RESEARCH_torn_end_exchange_law_v1_2026-11-20.md, section 8 (the bow's
// 35,000 m3 of air through a torn end of 100/300/600 m2). Written by a Fable subagent at Bo's word (18:31 CST, relayed
// by the coordinator), briefed and rerun by Z1.
//   node docs/research/experiments/e84_z6_exchange.js
// Output of 2026-11-20 (its stdout): results_2026-11-20/e84_z6_exchange.txt
'use strict';
const X = require('./e84_z6_exchange_lib.js');
const { G, RHO_W, P_ATM } = X;
const DT = 1 / 32, V0 = 35000;
const f1 = (x) => (x == null ? '   -' : x.toFixed(1));
const pad = (s, n) => String(s).padStart(n);
let fails = 0;
const check = (name, got, want, tol) => {
  const ok = Math.abs(got - want) <= tol * Math.abs(want);
  if (!ok) fails++;
  console.log((ok ? 'PASS ' : 'FAIL ') + name + ': ' + got.toPrecision(5) + ' against ' + want.toPrecision(5));
};

// ---- closed-form checks ------------------------------------------------------------------
console.log('== checks ==');
{ // (a) submerged orifice, 2 m head
  const op = { A: 10, L: 2, zc: -20, nz: 0, Cd: 0.6 };
  const f = X.exchange(op, { zw: -12, pa: P_ATM + RHO_W * G * 10 }, { zw: 0, pa: P_ATM });
  check('orifice, 2 m head', f.wIn, 0.6 * 10 * Math.sqrt(2 * G * 2), 1e-9);
}
{ // (c) two-layer: air inside to the opening's foot, quasi-steady neutral plane
  const H = 10, b = 20, op = { A: H * b, L: H, zc: -5, nz: 0, Cd: 0.6 };
  // find pa with water in = air out (no net volume): bisection on the neutral plane
  let lo = P_ATM, hi = P_ATM + RHO_W * G * 10;
  for (let i = 0; i < 60; i++) {
    const p = 0.5 * (lo + hi), f = X.exchange(op, { zw: -30, pa: p }, { zw: 0, pa: P_ATM });
    if (f.wIn - f.aOut > 0) lo = p; else hi = p;
  }
  const p = 0.5 * (lo + hi), f = X.exchange(op, { zw: -30, pa: p }, { zw: 0, pa: P_ATM });
  const r = Math.pow(X.rhoAir(p) / RHO_W, 1 / 3), frac = r / (1 + r);
  check('two-layer: air share of the height', (p - P_ATM) / (RHO_W * G) / H, frac, 2e-3);
  check('two-layer: exchange flow', f.wIn, 0.6 * (2 / 3) * b * Math.sqrt(2 * G) * Math.pow(H * (1 - frac), 1.5), 2e-3);
}
{ // (d) horizontal, no net flow: Wallis without the cap against Clanet & Searby's bottle (0.33 sqrt(g d))
  const d = 0.02, A = Math.PI * d * d / 4, op = { A: A, L: d, Dh: d, zc: -0.1, nz: 1, kuCap: false };
  const f = X.exchange(op, { zw: -1, pa: P_ATM + RHO_W * G * 0.1 }, { zw: 0, pa: P_ATM });
  console.log('     bottle neck 20 mm: j/sqrt(g d) = ' + (f.aOut / A / Math.sqrt(G * d)).toFixed(3) + ' (Clanet & Searby: 0.33)');
  const ic = X.intercepts(op, X.rhoAir(P_ATM)), pr = X.floodingPair(0.3 * ic.jf0, ic.jg0, ic.jf0);
  check('flooding line residual', Math.sqrt(pr.jg / ic.jg0) + Math.sqrt(pr.jf / ic.jf0), 1, 1e-9);
}
{ // the limiter: never past the level
  const lam = [0.5, 1.9, 2, 2.1, 50].map((x) => (x < 2 ? 1 - x / 4 : 1 / x) * x);
  check('limiter: largest share of the level moved', Math.max.apply(null, lam), 1, 1e-12);
}

// ---- one lumped space with one opening, stepped at 1/32 s --------------------------------
// box: free surface S, height Hc, ceiling at zTop; the opening's top at the ceiling.
function run(c) {
  const sea = { zw: 0, pa: P_ATM };
  let zTop = c.zTop, t = 0, w = 0;
  const h = c.L * Math.sqrt(1 - c.nz * c.nz);
  let Va = V0, zw = zTop - Va / c.S;
  let pa = X.sideP(sea, c.nz > 0.999 ? zTop : zTop - 0.1 * h);
  const M0 = pa * Va, marks = {}, rows = [];
  let nextRow = 0;
  while (t < (c.tmax || 900)) {
    if (c.sink) { w = Math.min(c.sink.wMax, c.sink.acc * t); }
    const op = Object.assign({ A: c.A, L: c.L, nz: c.nz, zc: zTop - 0.5 * h }, c.opt || {});
    const s = X.stepSpace({ zw: zw, pa: pa, Va: Va, S: c.S }, [{ op: op, other: sea }], DT);
    pa = s.pa; Va = s.Va; zw = s.zw; t += DT;
    zTop -= w * DT; zw -= w * DT;
    const fr = pa * Va / M0;
    if (!marks.t50 && fr <= 0.5) marks.t50 = t;
    if (!marks.t90 && fr <= 0.1) { marks.t90 = t; if (!c.sink) break; }
    if (!marks.v50 && Va <= 0.5 * V0) marks.v50 = t;
    if (!marks.v90 && Va <= 0.1 * V0) marks.v90 = t;
    if (c.rows && t >= c.rows[nextRow] - 1e-9) {
      rows.push({ t: t, depth: -zTop, Va: Va, kept: fr, boyle: V0 * (M0 / V0) / X.sideP(sea, zTop),
                  lag: (X.sideP(sea, zTop) - pa) / (RHO_W * G) });
      if (++nextRow >= c.rows.length) break;
    }
    if (Va < 1) break;
  }
  marks.rows = rows;
  return marks;
}

const shape = (A) => Math.sqrt(A / 1.4);                    // height of a section 1.4 times as wide as high
const AREAS = [100, 300, 600], DEPTHS = [1, 50];
function table(title, mk, bands) {
  console.log('\n== ' + title + ' ==');
  console.log('   A m2  depth m   time to lose half / nine tenths of the air, s:  ' + bands.map((b) => b.name).join(' | '));
  for (const A of AREAS) for (const D of DEPTHS) {
    const cells = bands.map((b) => { const r = run(mk(A, D, b.opt)); return pad(f1(r.t50), 6) + ' /' + pad(f1(r.t90), 6); });
    console.log(pad(A, 7) + pad(D, 8) + '      ' + cells.join('   |  '));
  }
}

// (i) level piece: the torn end a vertical opening, its top at the deckhead; the air a layer
// 14 m thick under it (S = 2500 m2). Band: the discharge coefficient.
table('(i) level: vertical opening, two-layer exchange (law P)',
  (A, D, opt) => ({ A: A, L: shape(A), nz: 0, S: V0 / 14, zTop: -D, opt: opt }),
  [{ name: 'slow (Cd 0.45)', opt: { Cd: 0.45 } }, { name: 'central (Cd 0.60)', opt: { Cd: 0.60 } }, { name: 'fast (Cd 0.75)', opt: { Cd: 0.75 } }]);

// (ii) pitched 90, 80, 70 degrees with the torn end up: the air a column under the opening
// (S = 600 m2, 58 m deep). Band: the flooding line (C, the cap, the cell size).
const CC = [
  { name: 'slow (C 0.55, cap, 4 m cells, Cd 0.45)', opt: { C: 0.55, kuCap: true, Dh: 4, Cd: 0.45 } },
  { name: 'central (C 0.70, cap, whole, Cd 0.60)', opt: { C: 0.70, kuCap: true, Cd: 0.60 } },
  { name: 'fast (C 1.0, no cap, whole, Cd 0.75)', opt: { C: 1.0, kuCap: false, Cd: 0.75 } }];
for (const pitch of [90, 80, 70]) {
  const nz = Math.cos((90 - pitch) * Math.PI / 180);
  table('(ii) pitched ' + pitch + ' deg, torn end up: counter-current (law X' + (pitch < 90 ? ' and law P' : '') + ')',
    (A, D, opt) => ({ A: A, L: shape(A), nz: nz, S: 600, zTop: -D, opt: opt }), CC);
}

// (iii) the same spaces on a piece that sinks: 0.5 m/s2 up to 10 m/s. What matters then is
// the air's VOLUME (its buoyancy): compression takes it whether or not any air leaves.
console.log('\n== (iii) sinking at 0.5 m/s2 up to 10 m/s, from just under the surface ==');
console.log('   case                         t s  depth m   air m3   air kept   Boyle alone m3   lag, m of head');
for (const c of [
  { name: 'level, 300 m2', A: 300, nz: 0, S: V0 / 14 }, { name: 'level, 100 m2', A: 100, nz: 0, S: V0 / 14 },
  { name: 'end up 90, 300 m2', A: 300, nz: 1, S: 600 }, { name: 'end up 90, 100 m2', A: 100, nz: 1, S: 600 }]) {
  const r = run({ A: c.A, L: shape(c.A), nz: c.nz, S: c.S, zTop: -1, sink: { acc: 0.5, wMax: 10 }, rows: [2, 5, 10, 15, 20, 30] });
  for (const q of r.rows) console.log('   ' + c.name.padEnd(26) + pad(q.t.toFixed(0), 5) + pad(q.depth.toFixed(0), 8) + pad(q.Va.toFixed(0), 10) +
    pad((100 * q.kept).toFixed(0) + ' %', 10) + pad(q.boyle.toFixed(0), 14) + pad(q.lag.toFixed(1), 14));
  console.log('   ' + c.name.padEnd(26) + ' air volume halved at ' + f1(r.v50) + ' s, a tenth left at ' + f1(r.v90) + ' s' +
    (r.rows.length < 6 ? ' (no air left before 30 s)' : ''));
}
console.log(fails ? '\nCHECKS: FAIL (' + fails + ')' : '\nCHECKS: PASS');
