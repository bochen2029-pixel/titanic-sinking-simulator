// e10: P3b measured. Can a smooth ice outline (and a berg that turns) make the 1912 damage independent of the course's
// phase? Before P3b the outline was 180 flat 2-degree bins in the earth frame: a course one degree off opened 28 % more
// (tools/night_tests.js, after M2). This runs the 1912 watch (auto orders) on courses a fraction of a degree apart
// against e10_encounter_variant.js, which replaces core/encounter.js for this script only: a continuous piecewise-
// linear outline in the berg's frame (ICE.nodes), the crush clipped to the dented hull over each station's arc,
// stations every ds metres (ICE.ds), and a berg that turns under the friction's moment (ICE.turns).
// Finding (2026-11-16): none of it brings the spread near 2 %; finer stations shrink it only to about 25 %, and turning
// makes it worse. The contact is not chaotic (a course nudged by 0.001 degree changes 0.14 %), but the law is
// discrete at the station scale: the ice pressure follows the count of stations in contact, and each station switches
// between denting and crushing. P3b was not adopted; BACKLOG P3c is the contact law to replace it.
//   node docs/research/experiments/e10_ice_outline_phase.js [repo root]      (a few minutes)
// Output of 2026-11-16: results_2026-11-16/e10_ice_outline_phase.txt
const path = require('path');
const root = process.argv[2] || path.join(__dirname, '..', '..', '..');
require.cache[require.resolve(path.join(root, 'core', 'encounter.js'))] = { id: 'variant', loaded: true, exports: require('./e10_encounter_variant.js') };
const C = require(path.join(root, 'core', 'core.js'));
const N = require(path.join(root, 'core', 'night.js'));
const ship = C.buildShip();
// offsets that fall between nodes (a round berg turned by a whole number of node spacings is the same problem)
const offsets = [0, 0.13, 0.37, 0.61, 0.89, 1.27, 45.3];
function run(ice, d) {
  const sp = N.spec(1912); sp.heading = 266 + d; sp.ice = Object.assign({}, sp.ice, ice);
  const sim = N.run(N.create(ship, sp, { auto: true, plant: false }), { tMax: 600 }), s = N.summary(sim);
  return { area: s.area, from: s.stbd.tearFrom, to: s.stbd.tearTo, turned: sim.enc.berg.PSI * 180 / Math.PI };
}
const line = (ice) => {
  const r = offsets.map(d => run(ice, d)), a = r.map(x => x.area), mean = a.reduce((x, y) => x + y, 0) / a.length;
  return JSON.stringify(ice).padEnd(46) + 'spread ' + (100 * (Math.max(...a) - Math.min(...a)) / mean).toFixed(1).padStart(5) + ' % of ' + mean.toFixed(3) + ' m2 | ' + a.map(v => v.toFixed(3)).join(' ') + (ice.turns ? ' | berg turned ' + r[0].turned.toFixed(1) + ' deg' : '');
};
console.log('e10: the 1912 watch on courses 266 + (' + offsets.join(', ') + ') degrees; opened area at the current ICE.alpha');
console.log('\n1. THE OUTLINE: node counts, the berg still (stations every metre)');
for (const nodes of [180, 720, 1440, 2880]) console.log('   ' + line({ nodes, turns: false, ds: 1 }));
console.log('\n2. CHAOS OR DISCRETENESS: the same course nudged (nodes 1440, stations every metre)');
for (const turns of [false, true]) for (const d of [0, 1e-9, 1e-6, 1e-3]) { const r = run({ nodes: 1440, turns, ds: 1 }, d); console.log('   ' + (turns ? 'the berg turns,  ' : 'the berg still,  ') + 'nudge ' + String(d).padEnd(6) + ' deg: ' + r.area.toFixed(5) + ' m2, x ' + r.from + '..' + r.to); }
console.log('\n3. FINER STATIONS (each carries ds metres of force, contact and opening)');
for (const ice of [{ ds: 0.5, nodes: 2880, turns: false }, { ds: 0.25, nodes: 2880, turns: false }, { ds: 0.25, nodes: 5760, turns: false }, { ds: 0.25, nodes: 2880, turns: true }]) console.log('   ' + line(ice));
