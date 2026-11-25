// e75 (W6, part B): her metacentric height against time on the 1912 damage preset, and what the free surface of the
// water in her spaces costs it. docs/DESIGN_W6_the_lists_v1_2026-11-20.md, section 4 (HANDOFF.md 4b: "The model holds
// GM near 0.5 m through 2:00 (gmNow()); find out why").
//   node docs/research/experiments/e75_w6_gm_free_surface.js [worktree]   (seconds)
// GM: C.gmNow on a copy restored from C.serialize (gmNow re-levels the water at a nudged roll and does not put the pairs'
// shares of water back, so it is never called on the run itself). The free surface: for each wet space (or each merged
// port-and-starboard pair, one surface), the core's columns cut by its level at this pose; their area (dxdy / R22) and
// its transverse second moment about the surface's own centre line (ship-frame y), times the space's permeability; the
// GM it costs is rho I / (the ship's mass with her water). A full space has no free surface of its own here.
const path = require('path');
const root = process.argv[2] || path.join(__dirname, '..', '..', '..');
const C = require(path.join(root, 'core', 'core.js'));
const SC = require(path.join(root, 'core', 'scenarios.js'));
const ship = C.buildShip(), DEG = 180 / Math.PI, RHO = 1025;
const sim = C.createSim(ship, {}, SC.PRESETS.titanic.build({}));
const MARKS = [5, 10, 30, 60, 85, 100, 110, 115, 120, 125, 130, 140, 145, 150, 154, 155];
const name = (n) => { const k = n >> 2, s = (n >> 1) & 1, L = n & 1; return 'z' + k + (s ? 'S' : 'P') + (L ? 'u' : 'l'); };

function surface(nodes) {                 // the free surface shared by these nodes at their (common) level
  const c = ship.cols, F = C.frameOf(sim), iR = 1 / F.R22;
  let A = 0, Ay = 0, Ayy = 0;
  for (const n of nodes) {
    if (sim.vol[n] <= 1e-6 || sim.vol[n] >= ship.nodeVmax[n] * (1 - 1e-7)) continue;
    const h = sim.level[n], mu = ship.nodeMu[n], s0 = ship.nodeStart[n], s1 = s0 + ship.nodeCount[n];
    for (let j = s0; j < s1; j++) {
      const i = ship.entCol[j], a = ship.entA[j], b = ship.entE[j];
      const zp = (h - (F.R20 * c.x[i] + F.R21 * c.y[i] + F.tz)) * iR;
      if (zp <= a || zp >= b) continue;
      const dA = c.dxdy[i] * iR * mu, y = c.y[i];
      A += dA; Ay += dA * y; Ayy += dA * y * y;
    }
  }
  return A > 0 ? { A, I: Ayy - Ay * Ay / A } : { A: 0, I: 0 };
}

console.log('e75 on ' + root + ': the 1912 damage preset');
console.log('   T    list   trim    GM m   mass kt  | free surface: GM cost m (lower, upper), area m2 (lower, upper) | the three costliest');
let mi = 0;
while (!sim.foundered && sim.t < 4 * 3600) {
  C.step(sim);
  const T = sim.t / 60;
  if (mi >= MARKS.length || T < MARKS[mi]) continue;
  while (mi < MARKS.length && T >= MARKS[mi]) mi++;
  const copy = C.restore(ship, C.serialize(sim)), gm = C.gmNow(copy);
  let mass = sim.ms; for (let n = 0; n < 64; n++) mass += RHO * sim.vol[n];
  const cost = [0, 0], area = [0, 0], each = [];
  for (let k = 0; k < 16; k++) for (let L = 0; L < 2; L++) {
    const nP = C.nodeIndex(k, 0, L), nS = C.nodeIndex(k, 1, L);
    const groups = sim.merged[k * 2 + L] ? [[nP, nS]] : [[nP], [nS]];
    for (const g of groups) {
      const s = surface(g); if (s.A <= 0) continue;
      const d = RHO * s.I / mass; cost[L] += d; area[L] += s.A;
      each.push([g.map(name).join('+'), d, s.A]);
    }
  }
  each.sort((p, q) => q[1] - p[1]);
  console.log(String(T.toFixed(0)).padStart(5) + ' ' + (sim.roll * DEG).toFixed(2).padStart(6) + ' ' + (sim.pitch * DEG).toFixed(2).padStart(6) + ' ' + gm.toFixed(3).padStart(7) + ' ' + (mass / 1e6).toFixed(1).padStart(8) +
    '  | ' + cost[0].toFixed(3) + ', ' + cost[1].toFixed(3) + '   ' + area[0].toFixed(0) + ', ' + area[1].toFixed(0) +
    '  | ' + each.slice(0, 3).map(e => e[0] + ' ' + e[1].toFixed(3) + ' (' + e[2].toFixed(0) + ' m2)').join('; '));
}
console.log('founders at T ' + (sim.foundered ? (sim.founderT / 60).toFixed(2) : 'no'));
