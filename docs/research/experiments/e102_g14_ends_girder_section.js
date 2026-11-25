// e102 (G14, the calibration epoch's stage C3, D77): the girder and section side of G14's hull ends, first order.
// R3 (docs/research/RESEARCH_rooms_hull_ends_v1_2026-11-20.md, section 3) read her side at her ends on E, D and C decks
// against the model's C.halfBreadth: the model lies inside the plans' at both ends, more the higher the deck. Stage C3
// restores her ends in C.halfBreadth behind a switch of C.buildShip (the mainline's change). Before it exists, this asks
// what it would do to this lane's two libraries, with R3's shortfall as the restored breadth (e95's rule: linear in z
// between E and D and between D and C, C deck's shortfall from C to B, nothing above C in a well, nothing below E deck):
//   A. the hull: where the model narrows forward of amidships (R3 read nothing between 80A and 80F); the 1912 preset's
//      waterline at her ends against E deck (the restored ends lie above it); the restored volume by zone and band,
//      against the space above E deck each zone has today;
//   B. core/readers/section.js at her ends, off and on: C.halfBreadth is wrapped in this process only, so section.js
//      (which calls C.halfBreadth(x, z, ship.hull)) sees the restored breadth; the core's own columns do not change;
//   C. core/readers/girder.js, first order: the restored volume as buoyancy outboard of the model's side, added to the
//      gauge with its own formulas (e95's), (a) dry wherever under water, an upper bound, (b) only where that
//      compartment's space above E deck holds no water in the model; along the core's own path (the restored buoyancy
//      would change the path itself, which only stage D's refit can show): the 1912 preset's record moments (trim 11 and
//      17 degrees) and the panel's C-7 (35,000 t aboard), and on the 1912 watch B2's onset, with the end stations'
//      capacities as restored;
//   D. the weight curve does not read the hull's form; it reads her profile's ends (C.zoneBounds()) for the hull's
//      trapezoid: the moment if the stern tip moved forward (G2: the model's counter runs past the plan's E deck).
// Headless; changes nothing in the repository.
//   node docs/research/experiments/e102_g14_ends_girder_section.js [<worktree>]
'use strict';
const path = require('path');
const cp = require('child_process');
const root = path.resolve(process.argv[2] || path.join(__dirname, '..', '..', '..'));
const C = require(path.join(root, 'core', 'core.js'));
const SC = require(path.join(root, 'core', 'scenarios.js'));
const N = require(path.join(root, 'core', 'night.js'));
const G = require(path.join(root, 'core', 'readers', 'girder.js'));
const S = require(path.join(root, 'core', 'readers', 'section.js'));
const O = require(path.join(root, 'core', 'readers', 'onset.js'));
const L = require(path.join(__dirname, 'e91_g12_lib.js'));
const { f, DEG } = L;
const t0 = Date.now(), ship = C.buildShip(), RHO = C.RHO, GRAV = C.GRAV, GN = 1e9;
let head = '?'; try { head = cp.execSync('git -C "' + root + '" rev-parse --short HEAD').toString().trim(); } catch (e) { /* not a repository */ }
const say = (s) => console.log(s === undefined ? '' : s);

// ---------------------------------------------------------------- R3's table and the restored breadth (e95's rule)
// model less plan, m a side (negative where the model is inside the plan): frame, x, E, D, C
const R3 = [
  ['150A', -130.6, null, -5.17, -6.16], ['148A', -129.2, null, -5.24, -6.04], ['145A', -127.2, 0.65, -5.11, -5.77],
  ['140A', -123.8, -1.04, -5.06, -5.27], ['135A', -120.3, -1.52, -4.69, -4.70], ['130A', -116.8, -1.93, -4.27, -4.13],
  ['125A', -112.9, -1.82, -3.71, -3.48], ['120A', -108.9, -1.74, -3.19, -2.86], ['115A', -104.7, -1.78, -2.69, -2.29],
  ['110A', -100.4, -1.56, -2.24, -1.86], ['100A', -91.3, -1.00, -1.33, -1.09], ['90A', -82.1, -0.50, -0.68, -0.57],
  ['80A', -72.9, -0.25, -0.32, -0.25],
  ['80F', 72.9, -1.15, -1.25, -1.29], ['90F', 81.9, -1.40, -1.58, -1.84], ['100F', 90.8, -1.52, -1.90, -2.31],
  ['105F', 94.9, -1.35, -2.02, -2.56], ['110F', 99.0, -1.44, -2.05, -2.65], ['115F', 102.7, -1.31, -2.02, -2.69],
  ['120F', 106.4, -1.19, -1.86, -2.65], ['125F', 110.0, -1.05, -1.93, -2.59], ['130F', 113.4, -0.92, -1.68, -2.31],
  ['135F', 116.7, -0.78, -1.53, -2.08], ['140F', 119.9, -0.72, -1.28, -1.66], ['145F', 122.9, -0.59, -1.02, -1.17],
  ['150F', 126.0, -0.47, -0.65, -0.84], ['154F', 128.5, -0.31, -0.35, -0.47],
];
// the shortfall to add at x on deck column k (2 E, 3 D, 4 C), m a side: linear between R3's frames, none outside them
// or where the model is the wider (e95's function)
function short(x, k) {
  const rows = R3.filter(r => r[k] !== null);
  const aft = rows.filter(r => r[1] < 0).sort((a, b) => a[1] - b[1]), fwd = rows.filter(r => r[1] > 0).sort((a, b) => a[1] - b[1]);
  const set = x < 0 ? aft : fwd;
  if (!set.length || x < set[0][1] || x > set[set.length - 1][1]) return 0;
  for (let i = 0; i < set.length - 1; i++) if (x >= set[i][1] && x <= set[i + 1][1]) { const u = (x - set[i][1]) / (set[i + 1][1] - set[i][1]); return Math.max(0, -(set[i][k] + (set[i + 1][k] - set[i][k]) * u)); }
  return Math.max(0, -set[set.length - 1][k]);
}
// the restored breadth at (x, z), m a side: linear from E deck's shortfall to D's, then to C's; C's from C to B; nothing
// below E deck, above B, or above C in a well
function extraAt(x, z) {
  const zE = C.deckZ('E', x), zD = C.deckZ('D', x), zC = C.deckZ('C', x), zB = C.deckZ('B', x);
  if (z < zE || z > zB) return 0;
  if (z <= zD) { const u = (z - zE) / (zD - zE); return short(x, 2) + (short(x, 3) - short(x, 2)) * u; }
  if (z <= zC) { const u = (z - zD) / (zC - zD); return short(x, 3) + (short(x, 4) - short(x, 3)) * u; }
  return C.inWell(x) ? 0 : short(x, 4);
}
// the added layers at x for the volume: [z0, z1, mean width a side] (e95's)
function layers(x) {
  const zE = C.deckZ('E', x), zD = C.deckZ('D', x), zC = C.deckZ('C', x), zB = C.deckZ('B', x), sE = short(x, 2), sD = short(x, 3), sC = short(x, 4);
  const out = [[zE, zD, 0.5 * (sE + sD), 'E-D'], [zD, zC, 0.5 * (sD + sC), 'D-C']];
  if (!C.inWell(x)) out.push([zC, zB, sC, 'C-B']);
  return out.filter(l => l[2] > 0 && l[1] > l[0]);
}

// ---------------------------------------------------------------- A. the hull
say('e102 (G14, D77 stage C3) on ' + root + ' at ' + head + ': the girder and section side of her hull ends, first order');
say();
say('A. THE HULL');
const hbM = (x, z) => C.halfBreadth(x, z, ship.hull), Bh = C.G.B / 2;
say('  A1. the model\'s half breadth at E, D and C decks between amidships and R3\'s first frames (m; the moulded ' + f(Bh, 2) + '); R3 read no frame here');
say('      x       E      D      C     (R3 at 80F: the plan E 13.13, D 13.38, C 13.56; at 80A: E 13.66, D 13.86, C 13.88)');
for (const x of [-72.9, -60, -50, -46.5, -40, 0, 29.9, 40, 50, 60, 65, 70, 72.9]) say('    ' + f(x, 1).padStart(6) + ['E', 'D', 'C'].map(d => f(hbM(x, C.deckZ(d, x)), 2).padStart(7)).join(''));
// the 1912 preset at rest: the waterline at her ends
{
  const sim = C.createSim(ship, {}, SC.PRESETS.titanic.build()), F = C.frameOf(sim), iR = 1 / F.R22;
  const zw = (x) => -(F.R20 * x + F.tz) * iR;   // the sea's height in her frame on the centreline at x
  say('  A2. the 1912 preset at rest (trim ' + f(sim.pitch / DEG, 2) + ' deg): the sea on her centreline against E deck at her ends (m above the keel)');
  for (const x of [-130.6, -120.3, -100.4, -72.9, 72.9, 99.0, 116.7, 128.5]) say('    x ' + f(x, 1).padStart(6) + ': the sea ' + f(zw(x), 2) + ', E deck ' + f(C.deckZ('E', x), 2) + ', so ' + f(C.deckZ('E', x) - zw(x), 2) + ' m above it');
}
// the restored volume by zone and band; each zone's space above E deck today (both sides' layer 1)
{
  const D = G.shipData(ship), SUB = 8, byZ = {};
  for (let j = 0; j < D.nS; j++) for (let s = 0; s < SUB; s++) {
    const x = D.e[j] + (s + 0.5) * D.dx[j] / SUB, dx = D.dx[j] / SUB, k = C.zoneAt(x);
    for (const [z0, z1, wid, band] of layers(x)) { const v = 2 * wid * (z1 - z0) * dx; byZ[k] = byZ[k] || { 'E-D': 0, 'D-C': 0, 'C-B': 0 }; byZ[k][band] += v; }
  }
  say('  A3. the restored volume between E and B decks (R3\'s rule; both sides, m3) by zone, against its space above E deck today');
  say('      zone                                    E-D     D-C     C-B     all    above E today    share');
  let aft = 0, fwd = 0;
  for (const k of Object.keys(byZ).map(Number).sort((a, b) => a - b)) {
    const b = byZ[k], all = b['E-D'] + b['D-C'] + b['C-B'], up = ship.nodeVmax[C.nodeIndex(k, 0, 1)] + ship.nodeVmax[C.nodeIndex(k, 1, 1)];
    if (k < 8) fwd += all; else aft += all;
    say('    ' + (k + ' ' + C.ZONES[k].name).padEnd(38) + f(b['E-D'], 0).padStart(7) + f(b['D-C'], 0).padStart(8) + f(b['C-B'], 0).padStart(8) + f(all, 0).padStart(8) + f(up, 0).padStart(17) + (f(100 * all / up, 1) + ' %').padStart(10));
  }
  say('    in all: aft ' + f(aft, 0) + ' m3, forward ' + f(fwd, 0) + ' m3 (R3: about 2,300 and 1,700; its C-B band at C\'s floor is a bet)');
}
say();

// ---------------------------------------------------------------- B. section.js at her ends, off and on
const HB0 = C.halfBreadth;
let ON = false;
C.halfBreadth = function (x, z, P) { const b = HB0(x, z, P); return ON && b > 0 ? b + extraAt(x, z) : b; };
function sectionAt(x) {
  const els = S.elements(ship, x);
  if (!els.length) return null;
  const el = S.elastic(els), hog = S.collapse(els, 'hog', { stopAfter: 0.8 }), sag = S.collapse(els, 'sag', { stopAfter: 0.8 });
  const top = S.strengthDeck(x), yTop = C.halfBreadth(x, C.deckZ(top, x), ship.hull);
  return { top, yTop, A: el.A, zNA: el.zNA, I: el.I, Zd: el.Zdeck, Zk: el.Zkeel, hog: hog.Mu, sag: sag.Mu, Vu: S.shear(els), n: els.length };
}
const XS = [-130.6, -127.2, -123.8, -120.3, -116.8, -112.9, -108.9, -104.7, -100.4, -91.3, -82.1, -72.9, -10.93, 0, 72.9, 81.9, 90.8, 99.0, 106.4, 113.4, 119.9, 126.0];
const SEC = {};
for (const on of [false, true]) { ON = on; for (const x of XS) { SEC[x] = SEC[x] || {}; SEC[x][on ? 'on' : 'off'] = sectionAt(x); } }
ON = false;
say('B. CORE/READERS/SECTION.JS AT HER ENDS: off (the model as it is) and on (R3\'s breadth above E deck); its scantlings unchanged');
say('       x  where              deck  half-breadth    area m2         Z deck m3        Z keel m3      Mu hog GN m      Mu sag GN m        Vu MN');
say('                                      off    on    off    on      off     on      off     on      off     on      off     on      off    on');
for (const x of XS) {
  const a = SEC[x].off, b = SEC[x].on;
  if (!a || !b) { say('  ' + f(x, 2).padStart(7) + '  no section'); continue; }
  const p = (u, v, d, w) => f(u, d).padStart(w) + f(v, d).padStart(w);
  say('  ' + f(x, 2).padStart(7) + '  ' + S.where(x).slice(0, 18).padEnd(18) + a.top.padStart(4) + p(a.yTop, b.yTop, 2, 6) + p(a.A, b.A, 3, 7) + p(a.Zd, b.Zd, 2, 8) + p(a.Zk, b.Zk, 2, 8) + p(a.hog / GN, b.hog / GN, 2, 8) + p(a.sag / GN, b.sag / GN, 2, 8) + p(a.Vu / 1e6, b.Vu / 1e6, 2, 7));
}
{
  const same = (x) => { const a = SEC[x].off, b = SEC[x].on; return a.A === b.A && a.I === b.I && a.hog === b.hog && a.sag === b.sag && a.Vu === b.Vu; };
  say('  amidships unchanged to the bit (x -10.93, the onset\'s station; x 0, the fit\'s section): ' + (same(-10.93) && same(0) ? 'yes' : 'NO'));
}
say();

// ---------------------------------------------------------------- C. the girder, first order (e95's method)
const D = G.shipData(ship), nS = D.nS, SUB = 8;
function added(sim, dryOnly) {
  const F = C.frameOf(sim), iR = 1 / F.R22, V = new Float64Array(nS), Vy = new Float64Array(nS), Vz = new Float64Array(nS);
  let aft = 0, fwd = 0;
  for (let j = 0; j < nS; j++) for (let s = 0; s < SUB; s++) {
    const x = D.e[j] + (s + 0.5) * D.dx[j] / SUB, dx = D.dx[j] / SUB;
    for (const [z0, z1, wid] of layers(x)) {
      const zm = 0.5 * (z0 + z1), yo = HB0(x, zm, ship.hull) + 0.5 * wid;
      for (const side of [0, 1]) {
        const y = side === 0 ? yo : -yo;
        if (dryOnly) { const n = (C.zoneAt(x) * 2 + side) * 2 + 1; if (C.spaceWater(sim, n) > 1) continue; }
        const zp = -(F.R20 * x + F.R21 * y + F.tz) * iR, sub = Math.min(z1 - z0, Math.max(0, zp - z0));
        if (sub <= 0) continue;
        const v = wid * sub * dx;
        V[j] += v; Vy[j] += v * y; Vz[j] += v * (z0 + 0.5 * sub);
        if (x < 0) aft += v; else fwd += v;
      }
    }
  }
  return { V, Vy, Vz, aft, fwd, F };
}
function delta(sim, A, xs) {
  const res = G.moment(sim, { loads: true }), Lw = res.loads, F = A.F, kA = 1 + (sim.params.addedHeave || 0);
  const mu = new Float64Array(nS); let mu0 = 0, mux = 0;
  for (let j = 0; j < nS; j++) { mu[j] = (kA * Lw.w[j] + Lw.f[j]) * D.dx[j] * 1000; mu0 += mu[j]; mux += mu[j] * D.xc[j]; }
  const xmu = mux / mu0; let Imu = 0; for (let j = 0; j < nS; j++) Imu += mu[j] * (D.xc[j] - xmu) * (D.xc[j] - xmu);
  const rg = RHO * GRAV, Fj = (j) => rg * A.V[j];
  let S0 = 0, SX = 0, SY = 0, SZ = 0; for (let j = 0; j < nS; j++) { S0 += Fj(j); SX += Fj(j) * D.xc[j]; SY += rg * A.Vy[j]; SZ += rg * A.Vz[j]; }
  const Rmu = F.R00 * (SX - xmu * S0) + F.R01 * SY + F.R02 * (SZ - G.Z_NA * S0), pA = S0 / mu0, pB = Rmu / (F.R00 * Imu);
  return { res, d: xs.map((x) => {
    let s0 = 0, sx = 0, sy = 0, sz = 0, q0 = 0, qx = 0;
    for (let j = 0; j < nS; j++) {
      const a = D.e[j], b = D.e[j + 1]; if (a >= x) break;
      const fr = b <= x ? 1 : (x - a) / (b - a), xc = b <= x ? D.xc[j] : a + 0.5 * (x - a), p = -mu[j] * (pA + pB * (D.xc[j] - xmu));
      s0 += fr * Fj(j); sx += fr * Fj(j) * xc; sy += fr * rg * A.Vy[j]; sz += fr * rg * A.Vz[j]; q0 += fr * p; qx += fr * p * xc;
    }
    return { dM: F.R00 * (sx - x * s0) + F.R01 * sy + F.R02 * (sz - G.Z_NA * s0) + F.R00 * (qx - x * q0), dV: -F.R00 * s0 };
  }) };
}
// the water aboard as tools/girder_tests.js counts it for C-7 (the 64 spaces' sim.vol, without the pockets' own water)
const waterT = (sim) => { let v = 0; for (let n = 0; n < C.NN; n++) v += sim.vol[n]; return v * RHO / 1000; };
say('C. THE GIRDER (core/readers/girder.js), FIRST ORDER: the restored volume as buoyancy outboard of her side, on the gauge');
say('   (a) dry wherever under water (an upper bound); (b) only where its compartment\'s space above E deck holds no water');
{
  // C1. the 1912 damage preset: the record's moments (the governing station in the band at trim 11 and 17) and C-7
  const sim = C.createSim(ship, {}, SC.PRESETS.titanic.build());
  const out = { 11: null, 17: null, c7: null };
  let next = 0; const tl = [];
  while (!sim.foundered && (!out[11] || !out[17] || !out.c7)) {
    C.step(sim);
    const trim = sim.pitch / DEG, water = waterT(sim), log = sim.t >= next;
    const want11 = !out[11] && trim >= 11, want17 = !out[17] && trim >= 17, wantC7 = !out.c7 && water >= 35000;
    if (!(want11 || want17 || wantC7 || log)) continue;
    const A = added(sim, false), B = added(sim, true), band = Array.from(D.band);
    const dA = delta(sim, A, band), dB = delta(sim, B, band), res = dA.res;
    const gov = (dd) => { let best = -Infinity, bx = 0; band.forEach((x, i) => { const M = res.band.M[i] + (dd ? dd.d[i].dM : 0); if (M > best) { best = M; bx = x; } }); return { M: best, x: bx }; };
    if (log) { next += 600; tl.push(f(sim.t / 60, 0).padStart(5) + ' min, trim ' + f(trim, 1).padStart(5) + ', water ' + f(water, 0).padStart(6) + ' t: submerged dry fwd ' + f(A.fwd, 0).padStart(5) + ' m3, aft ' + f(A.aft, 0).padStart(4) + '; with its space dry fwd ' + f(B.fwd, 0).padStart(5) + ', aft ' + f(B.aft, 0).padStart(4) + '; the gauge ' + f(res.gov.M / GN, 3) + ' GN m, (a) ' + f(gov(dA).M / GN, 3) + ', (b) ' + f(gov(dB).M / GN, 3)); }
    const rec = () => ({ T: sim.t / 60, trim, water, base: { M: res.gov.M, x: res.gov.x }, a: gov(dA), b: gov(dB), A: A.fwd + A.aft, B: B.fwd + B.aft });
    if (want11) out[11] = rec();
    if (want17) out[17] = rec();
    if (wantC7) {
      // the hull's largest moment anywhere (the panel's C-7 is its peak along her)
      const xs = Array.from(D.e).slice(0, nS), pa = delta(sim, A, xs), pb = delta(sim, B, xs);
      const pk = (dd) => { let best = 0, bx = 0; xs.forEach((x, i) => { const M = res.hull.M[i] + (dd ? dd.d[i].dM : 0); if (Math.abs(M) > Math.abs(best)) { best = M; bx = x; } }); return { M: best, x: bx }; };
      out.c7 = { T: sim.t / 60, trim, water, base: pk(null), a: pk(pa), b: pk(pb), A: A.fwd + A.aft, B: B.fwd + B.aft };
    }
  }
  say('  C1. the 1912 damage preset along its own path, every 10 minutes:');
  for (const l of tl) say('    ' + l);
  say('    the record\'s moments (girder.js RECORD, the governing station in the band K to J):');
  for (const k of [11, 17]) { const r = out[k]; if (!r) { say('      trim ' + k + ': not reached'); continue; } say('      trim ' + k + ' deg (T ' + f(r.T, 2) + '): as the model is ' + f(r.base.M / GN, 3) + ' GN m at x ' + f(r.base.x, 2) + '; (a) ' + f(r.a.M / GN, 3) + ' at ' + f(r.a.x, 2) + ' (submerged ' + f(r.A, 0) + ' m3); (b) ' + f(r.b.M / GN, 3) + ' at ' + f(r.b.x, 2) + ' (' + f(r.B, 0) + ' m3)'); }
  const c = out.c7;
  if (c) say('    the panel\'s C-7, the hull\'s largest moment at 35,000 t aboard (T ' + f(c.T, 2) + ', trim ' + f(c.trim, 2) + '): as the model is ' + f(c.base.M / GN, 3) + ' GN m at x ' + f(c.base.x, 2) + ' (4.64 within 2 %: ' + (Math.abs(c.base.M / 4.64e9 - 1) <= 0.02 ? 'yes' : 'no') + '); (a) ' + f(c.a.M / GN, 3) + ' (' + (Math.abs(c.a.M / 4.64e9 - 1) <= 0.02 ? 'within' : 'outside') + ' 2 %); (b) ' + f(c.b.M / GN, 3) + ' (' + (Math.abs(c.b.M / 4.64e9 - 1) <= 0.02 ? 'within' : 'outside') + ' 2 %)');
}
{
  // C2. the 1912 watch: B2's onset with the restored buoyancy, the end stations' capacities as restored
  const sim = N.create(ship, N.spec(1912), { auto: true });
  const found = { base: null, a: null, b: null }, tl = [];
  let next = 0, endsMax = { off: 0, on: 0, xOff: 0, xOn: 0 };
  // the stations' capacities with the restored breadth at the stations outside amidships that R3's table covers
  const capOn = new Map();
  const capAt = (x) => { if (!capOn.has(x)) { ON = true; const s = sectionAt(x); ON = false; capOn.set(x, s); } return capOn.get(x); };
  while (!sim.foundered && sim.t < 5 * 3600) {
    N.step(sim);
    const touched = sim.night.tTouch >= 0, T = touched ? L.Tof(sim) : -1;
    if (touched && sim.t >= next) {
      next = sim.t + 600; const A = added(sim, false), B = added(sim, true);
      tl.push(f(T, 1).padStart(6) + ' min after the touch, trim ' + f(sim.pitch / DEG, 1).padStart(5) + ': submerged dry fwd ' + f(A.fwd, 0).padStart(5) + ', aft ' + f(A.aft, 0).padStart(4) + ' m3; with its space dry fwd ' + f(B.fwd, 0).padStart(5) + ', aft ' + f(B.aft, 0).padStart(4));
    }
    if (T < 150) continue;
    const ck = O.check(sim, { all: true }), xs = ck.all.map(s => s.x);
    const cases = { base: null, a: added(sim, false), b: added(sim, true) };
    for (const [k, A] of Object.entries(cases)) {
      if (found[k]) continue;
      const d = A ? delta(sim, A, xs).d : null;
      let best = null;
      ck.all.forEach((s, i) => {
        let Mu = s.Mu, Vu = s.Vu;
        const inR3 = (s.x <= -72.9 && s.x >= -130.6) || (s.x >= 72.9 && s.x <= 128.5);
        if (A && inR3) { const c = capAt(s.x); if (c) { Mu = s.sense === 'sag' || s.M < 0 ? c.sag : c.hog; Vu = c.Vu; } }
        const M = s.M + (d ? d[i].dM : 0), V = s.V + (d ? d[i].dV : 0);
        const r = (M / Mu) * (M / Mu) + (V / Vu) * (V / Vu);
        if (!best || r > best.r) best = { r, x: s.x, where: s.where, M, Mu, V, Vu };
        if (Math.abs(s.x) > 70) { if (!A && r > endsMax.off) { endsMax.off = r; endsMax.xOff = s.x; } if (k === 'a' && r > endsMax.on) { endsMax.on = r; endsMax.xOn = s.x; } }
      });
      if (best.r >= 1) found[k] = { T, k: sim.night.k, trim: sim.pitch / DEG, list: sim.roll / DEG, best };
    }
  }
  say('  C2. the 1912 watch: the restored volume under water every 10 minutes after the touch');
  for (const l of tl) say('    ' + l);
  say('    B2\'s onset, the first step where (M/Mu)^2 + (V/Vu)^2 reaches 1 at any station:');
  for (const [k, name] of [['base', 'as the model is'], ['a', '(a) dry wherever under water, the ends\' capacities restored'], ['b', '(b) only where its space is dry, the same']]) {
    const q = found[k];
    say('      ' + name.padEnd(64) + (q ? 'T ' + f(q.T, 2) + ', step ' + q.k + ', x ' + f(q.best.x, 2) + ' (' + q.best.where + '), M ' + f(q.best.M / GN, 3) + ' of ' + f(q.best.Mu / GN, 3) + ' GN m, V ' + f(q.best.V / 1e6, 2) + ' of ' + f(q.best.Vu / 1e6, 2) + ' MN, trim ' + f(q.trim, 1) + ', list ' + f(q.list, 1) : 'none before the flag'));
  }
  say('    the largest ratio at any station outside x -70 to +70 from T 150 to the onset or the flag: as the model is ' + f(endsMax.off, 3) + ' (x ' + f(endsMax.xOff, 1) + '), (a) ' + f(endsMax.on, 3) + ' (x ' + f(endsMax.xOn, 1) + ')');
}
say();

// ---------------------------------------------------------------- D. the weight curve and her profile's ends
{
  const blank = C.createSim(ship, {}, SC.PRESETS.blank.build()), cv = G.weight(blank), hl = cv.layers.find(l => l.shape === 'trapezoid'), H = cv.hull;
  say('D. THE WEIGHT CURVE: it reads no breadth. The hull (' + f(hl.m, 0) + ' t, Prohaska\'s a = ' + H.a + ') is a trapezoid over her profile, x ' + f(H.xs, 2) + ' to ' + f(H.xf, 2) + ' (C.zoneBounds())');
  // the hull's own moment aft of x about x (weights only, no buoyancy, no relief), with the trapezoid's stern end moved
  // forward by s and its end ordinates closed to the same centre (Prohaska's d), the other layers as they are
  const hullMoment = (s, x) => {
    const xs = H.xs + s, xf = H.xf, Lh = xf - xs, a = H.a, b = (3 - a) / 2, wl = hl.m / Lh, xc0 = hl.xc;
    const d = (xc0 - 0.5 * (xs + xf)) / (7 * Lh / 54);
    const x1 = xs + Lh / 3, x2 = xs + 2 * Lh / 3, P = [[xs, x1, (a - d) * wl, b * wl], [x1, x2, b * wl, b * wl], [x2, xf, b * wl, (a + d) * wl]];
    let m = 0;
    for (const [u0, u1, w0, w1] of P) { const hi = Math.min(u1, x); if (hi <= u0) continue; const n = 400; for (let i = 0; i < n; i++) { const u = u0 + (hi - u0) * (i + 0.5) / n, w = w0 + (w1 - w0) * (u - u0) / (u1 - u0); m += w * (hi - u0) / n * (x - u); } }
    return m * 1000 * GRAV;    // N m: the hull's weight aft of x, its moment about x (hogging positive)
  };
  for (const s of [0, 3, 7]) say('  the stern tip ' + (s ? f(s, 0) + ' m forward' : 'as it is') + ': the hull layer\'s moment aft of x -10.93 about it, weights only ' + f(hullMoment(s, -10.93) / GN, 3) + ' GN m' + (s ? ' (' + f((hullMoment(s, -10.93) - hullMoment(0, -10.93)) / GN, 3) + ')' : ''));
}
C.halfBreadth = HB0;
say();
say('(e102 took ' + f((Date.now() - t0) / 1000, 0) + ' s)');
