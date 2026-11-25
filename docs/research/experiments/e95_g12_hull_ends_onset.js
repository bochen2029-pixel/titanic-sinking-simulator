// e95 (G12, G14): a first-order estimate of how restoring her hull's ends would move B2's onset and the moment at the
// break. R3 (274d336, docs/research/RESEARCH_rooms_hull_ends_v1_2026-11-20.md, section 3) read her side on E, D and C decks
// at her ends against the model's: the model is narrower above E deck, about 2,300 m3 aft and 1,700 m3 forward between E
// and B decks. Here that shortfall per frame becomes buoyancy columns outboard of the model's side, each 'tween deck at
// the mean of its two decks' shortfall and C to B at C's (R3's own rule; none over an open well), cut by the sea's plane
// at her pose: (a) dry wherever under water, an upper bound, and (b) only where that compartment's space above E deck is
// still dry in the model. The gauge's relieved moment (core/readers/girder.js) is extended by it with the gauge's own
// formulas (the added force aft of each station about it, and its inertial relief), and B2's ratio at every station with
// it gives the onset's new step. FIRST ORDER: along the core's own path to the flag; the restored buoyancy would change
// the path itself (her trim, her flooding), which only the refit can show. Headless; changes nothing.
//   node docs/research/experiments/e95_g12_hull_ends_onset.js [<worktree>]
'use strict';
const path = require('path');
const cp = require('child_process');
const root = path.resolve(process.argv[2] || path.join(__dirname, '..', '..', '..'));
const C = require(path.join(root, 'core', 'core.js'));
const N = require(path.join(root, 'core', 'night.js'));
const G = require(path.join(root, 'core', 'readers', 'girder.js'));
const O = require(path.join(root, 'core', 'readers', 'onset.js'));
const L = require(path.join(__dirname, 'e91_g12_lib.js'));
const { f, DEG } = L;
const t0 = Date.now(), ship = C.buildShip(), RHO = 1025, GRAV = C.GRAV || 9.81;
let head = '?'; try { head = cp.execSync('git -C "' + root + '" rev-parse --short HEAD').toString().trim(); } catch (e) { /* not a repository */ }
const say = (s) => console.log(s === undefined ? '' : s);

// R3's table (model less plan, m a side; negative where the model is inside the plan): frame, x, E, D, C
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
// the shortfall to add (m a side) at x, each deck, linear between R3's frames, none outside them or where the model is wider
function short(x, k) {
  const rows = R3.filter(r => r[k] !== null);
  const aft = rows.filter(r => r[1] < 0).sort((a, b) => a[1] - b[1]), fwd = rows.filter(r => r[1] > 0).sort((a, b) => a[1] - b[1]);
  const set = x < 0 ? aft : fwd;
  if (!set.length || x < set[0][1] || x > set[set.length - 1][1]) return 0;
  for (let i = 0; i < set.length - 1; i++) if (x >= set[i][1] && x <= set[i + 1][1]) { const u = (x - set[i][1]) / (set[i + 1][1] - set[i][1]); return Math.max(0, -(set[i][k] + (set[i + 1][k] - set[i][k]) * u)); }
  return Math.max(0, -set[set.length - 1][k]);
}
// the added layers at x: [z0, z1, width a side]
function layers(x) {
  const zE = C.deckZ('E', x), zD = C.deckZ('D', x), zC = C.deckZ('C', x), zB = C.deckZ('B', x), sE = short(x, 2), sD = short(x, 3), sC = short(x, 4);
  const out = [[zE, zD, 0.5 * (sE + sD)], [zD, zC, 0.5 * (sD + sC)]];
  if (!C.inWell(x)) out.push([zC, zB, sC]);
  return out.filter(l => l[2] > 0 && l[1] > l[0]);
}
const D = G.shipData(ship), nS = D.nS, SUB = 8;
// the added volume by slice at her pose (sim's frame): per slice the volume under the sea's plane, its y and z moments;
// dryOnly: only where the compartment's space above E deck on that side holds no water (the core's node, layer 1)
function added(sim, dryOnly) {
  const F = C.frameOf(sim), iR = 1 / F.R22, V = new Float64Array(nS), Vy = new Float64Array(nS), Vz = new Float64Array(nS);
  let aft = 0, fwd = 0, aftAll = 0, fwdAll = 0;
  for (let j = 0; j < nS; j++) {
    for (let s = 0; s < SUB; s++) {
      const x = D.e[j] + (s + 0.5) * D.dx[j] / SUB, dx = D.dx[j] / SUB;
      for (const [z0, z1, wid] of layers(x)) {
        const zm = 0.5 * (z0 + z1), yo = C.halfBreadth(x, zm) + 0.5 * wid;
        for (const side of [0, 1]) {                         // 0 port (y +), 1 starboard (y -)
          const y = side === 0 ? yo : -yo, full = wid * (z1 - z0) * dx;
          if (x < 0) aftAll += full; else fwdAll += full;
          if (dryOnly) { const k = C.zoneAt(x), n = (k * 2 + side) * 2 + 1; if (sim.vol[n] > 1) continue; }
          const zp = -(F.R20 * x + F.R21 * y + F.tz) * iR, sub = Math.min(z1 - z0, Math.max(0, zp - z0));
          if (sub <= 0) continue;
          const v = wid * sub * dx;
          V[j] += v; Vy[j] += v * y; Vz[j] += v * (z0 + 0.5 * sub);
          if (x < 0) aft += v; else fwd += v;
        }
      }
    }
  }
  return { V, Vy, Vz, aft, fwd, aftAll, fwdAll, F };
}
// the gauge's relieved moment and its (unrelieved) shear at x changed by the added buoyancy, with the gauge's own relief
function delta(sim, A, xs) {
  const res = G.moment(sim, { loads: true }), Lw = res.loads, F = A.F, kA = 1 + (sim.params.addedHeave || 0);
  const mu = new Float64Array(nS); let mu0 = 0, mux = 0;
  for (let j = 0; j < nS; j++) { mu[j] = (kA * Lw.w[j] + Lw.f[j]) * D.dx[j] * 1000; mu0 += mu[j]; mux += mu[j] * D.xc[j]; }
  const xmu = mux / mu0; let Imu = 0; for (let j = 0; j < nS; j++) Imu += mu[j] * (D.xc[j] - xmu) * (D.xc[j] - xmu);
  const rg = RHO * GRAV, Fj = (j) => rg * A.V[j];
  let S = 0, SX = 0, SY = 0, SZ = 0; for (let j = 0; j < nS; j++) { S += Fj(j); SX += Fj(j) * D.xc[j]; SY += rg * A.Vy[j]; SZ += rg * A.Vz[j]; }
  const Rmu = F.R00 * (SX - xmu * S) + F.R01 * SY + F.R02 * (SZ - G.Z_NA * S), pA = S / mu0, pB = Rmu / (F.R00 * Imu);
  return xs.map((x) => {
    let s0 = 0, sx = 0, sy = 0, sz = 0, q0 = 0, qx = 0;
    for (let j = 0; j < nS; j++) {
      const a = D.e[j], b = D.e[j + 1]; if (a >= x) break;
      const fr = b <= x ? 1 : (x - a) / (b - a), xc = b <= x ? D.xc[j] : a + 0.5 * (x - a), p = -mu[j] * (pA + pB * (D.xc[j] - xmu));
      s0 += fr * Fj(j); sx += fr * Fj(j) * xc; sy += fr * rg * A.Vy[j]; sz += fr * rg * A.Vz[j]; q0 += fr * p; qx += fr * p * xc;
    }
    const dMstern = F.R00 * (sx - x * s0) + F.R01 * sy + F.R02 * (sz - G.Z_NA * s0), dRel = F.R00 * (qx - x * q0);
    return { dM: dMstern + dRel, dV: -F.R00 * s0 };
  });
}

// the 1912 watch to its flag: B2's ratio at every station each step from T 150, as it is and with the added buoyancy
const sim = N.create(ship, N.spec(1912), { auto: true });
const found = { base: null, dry: null, dryOnly: null }, at = {};
let lastLog = -1e9; const log = [];
while (!sim.foundered && sim.t < 5 * 3600) {
  N.step(sim);
  const T = L.Tof(sim);
  if (T < 150) continue;
  const ck = O.check(sim, { all: true }), xs = ck.all.map(s => s.x);
  const cases = { base: null, dry: added(sim, false), dryOnly: added(sim, true) };
  for (const [k, A] of Object.entries(cases)) {
    if (found[k]) continue;
    const d = A ? delta(sim, A, xs) : null;
    let best = null;
    ck.all.forEach((s, i) => {
      // the station's capacity in the moment's sense as found (first order: the added buoyancy does not turn hogging to
      // sagging near the onset)
      const M = s.M + (d ? d[i].dM : 0), V = s.V + (d ? d[i].dV : 0), Mu = s.Mu;
      const r = (M / Mu) * (M / Mu) + (V / s.Vu) * (V / s.Vu);
      if (!best || r > best.r) best = { r, x: s.x, where: s.where, M, Mu, V, Vu: s.Vu };
    });
    if (best.r >= 1) found[k] = { T, k: sim.night.k, trim: sim.pitch / DEG, list: sim.roll / DEG, best, A };
  }
  if (sim.t - lastLog >= 30) {
    lastLog = sim.t; const A = cases.dry, B = cases.dryOnly, i0 = ck.all.findIndex(s => Math.abs(s.x - (-10.9293)) < 0.05);
    const d0 = i0 >= 0 ? delta(sim, A, [ck.all[i0].x])[0] : null;
    log.push(f(T, 2) + ' trim ' + f(sim.pitch / DEG, 1) + ': submerged dry aft ' + f(A.aft, 0) + ', fwd ' + f(A.fwd, 0) + ' m3; where its space is dry aft ' + f(B.aft, 0) + ', fwd ' + f(B.fwd, 0) + (d0 ? '; at x -10.93 the gauge ' + f(ck.all[i0].M / 1e9, 3) + ' GN m, with the dry bound ' + f((ck.all[i0].M + d0.dM) / 1e9, 3) : ''));
  }
}
const A0 = added(sim, false);
say('e95 (G12, G14) on ' + root + ' at ' + head + ': R3\'s restored hull ends as buoyancy on the gauge, along the 1912 watch\'s own path (first order)');
say('  the restored volume between E and B decks, both sides, by R3\'s rule here: aft ' + f(A0.aftAll, 0) + ' m3, forward ' + f(A0.fwdAll, 0) + ' m3 (R3: about 2,300 and 1,700)');
say('  every 30 s from T 150: ' );
for (const l of log) say('    ' + l);
say('  B2\'s onset, the first step where (M/Mu)^2 + (V/Vu)^2 reaches 1 at any station:');
for (const [k, name] of [['base', 'as the model is'], ['dry', '(a) the restored volume dry wherever under water'], ['dryOnly', '(b) only where its compartment\'s space above E deck is dry']]) {
  const q = found[k];
  say('    ' + name.padEnd(62) + (q ? 'T ' + f(q.T, 2) + ', step ' + q.k + ', x ' + f(q.best.x, 2) + ' (' + q.best.where + '), M ' + f(q.best.M / 1e9, 3) + ' of ' + f(q.best.Mu / 1e9, 3) + ' GN m, trim ' + f(q.trim, 1) + ', list ' + f(q.list, 1) : 'none before the flag (T ' + f(L.Tof(sim), 2) + ')'));
}
say('(e95 took ' + f((Date.now() - t0) / 1000, 0) + ' s)');
