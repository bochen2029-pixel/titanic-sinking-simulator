// e11: P3c study. Does the contact converge as it is refined, and does the course's phase then stop mattering?
// The 1912 watch (auto orders) on courses a fraction of a degree apart, against e11_encounter_variant.js (loaded in place
// of core/encounter.js for this script only). Refined together, so that each level keeps the same ratios: hull stations
// every ds metres, outline nodes at the same arc per station, sub-steps so that the hull slides about half a station per
// sub-step. Then the same path with the contact area ramping in with the overlap (aRamp) instead of counting stations.
//   node docs/research/experiments/e11_contact_convergence.js [repo root]      (several minutes)
// Output of 2026-11-16: results_2026-11-16/e11_contact_convergence.txt
const path = require('path');
const root = process.argv[2] || path.join(__dirname, '..', '..', '..');
require.cache[require.resolve(path.join(root, 'core', 'encounter.js'))] = { id: 'variant', loaded: true, exports: require('./e11_encounter_variant.js') };
const C = require(path.join(root, 'core', 'core.js'));
const N = require(path.join(root, 'core', 'night.js'));
const ship = C.buildShip();
const offsets = [0, 0.13, 0.37, 0.61, 0.89, 1.27, 45.3];
function run(ice, d) {
  const sp = N.spec(1912); sp.heading = 266 + d; sp.ice = Object.assign({}, sp.ice, ice);
  const sim = N.run(N.create(ship, sp, { auto: true, plant: false }), { tMax: 600 }), s = N.summary(sim);
  return { area: s.area, from: s.stbd.tearFrom, to: s.stbd.tearTo, tears: s.stbd.tears };
}
function line(label, ice) {
  const t0 = Date.now(), r = offsets.map(d => run(ice, d)), a = r.map(x => x.area), mean = a.reduce((x, y) => x + y, 0) / a.length;
  const to = r.map(x => x.to).sort((x, y) => x - y);
  return label.padEnd(44) + 'mean ' + mean.toFixed(3) + ' m2, spread ' + (100 * (Math.max(...a) - Math.min(...a)) / mean).toFixed(1).padStart(5) + ' %, tears end x ' + to[0] + '..' + to[to.length - 1] + ' | ' + a.map(v => v.toFixed(3)).join(' ') + ' | ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s';
}
const levels = [[1, 1440, 5], [0.5, 2880, 10], [0.25, 5760, 20], [0.125, 11520, 40]];
console.log('e11: the 1912 watch on courses 266 + (' + offsets.join(', ') + ') degrees; opened area at the current ICE.alpha; the berg still');
for (const aRamp of [0, 0.1]) {
  console.log('\n' + (aRamp ? 'CONTACT AREA RAMPING IN OVER ' + aRamp + ' m OF OVERLAP' : 'CONTACT AREA = STATIONS TOUCHING (as now)'));
  for (const [ds, nodes, sub] of levels) console.log('   ' + line('ds ' + ds + ' m, nodes ' + nodes + ', sub ' + sub, { ds, nodes, sub, aRamp, turns: false }));
}
