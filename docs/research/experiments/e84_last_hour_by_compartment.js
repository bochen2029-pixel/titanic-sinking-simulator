// e84 (the G6 and W6 preview): where her water goes in her last hour, compartment by compartment, on the 1912 watch and
// the 1912 damage preset: each compartment's water an hour before she founders and at her foundering (m3; the pockets'
// water counted in their compartment), and its gain over that hour. Run on two worktrees (main as it is, the preview with
// its refit's flow numbers) to say where the water goes instead of boiler room 5.
//   node docs/research/experiments/e84_last_hour_by_compartment.js <worktree> ['{"wMul":..,"aDown":..,"fOpen":..}']
const path = require('path');
const root = process.argv[2] || path.join(__dirname, '..', '..', '..');
const params = JSON.parse(process.argv[3] || '{}');
const C = require(path.join(root, 'core', 'core.js'));
const N = require(path.join(root, 'core', 'night.js'));
const SC = require(path.join(root, 'core', 'scenarios.js'));
const ship = C.buildShip();
const byZone = (sim) => { const z = new Float64Array(16); for (let n = 0; n < C.NN; n++) z[n >> 2] += sim.vol[n]; for (const k of sim.pockets || []) z[k.node >> 2] += k.vol; return z; };
function trace(name, make, step, t0of, done) {
  const sim = make(), snaps = [];
  while (!done(sim)) { step(sim); if (Math.round(sim.t * 4) % 240 === 0) snaps.push([sim.t, byZone(sim)]); }   // every minute
  const t0 = t0of(sim), tEnd = sim.founderT, end = byZone(sim);
  const hour = snaps.filter(s => s[0] <= tEnd - 3600).pop() || snaps[0];
  const gain = end.map((v, k) => v - hour[1][k]), tot = gain.reduce((a, b) => a + b, 0);
  console.log('== ' + name + ': founders at T ' + ((tEnd - t0) / 60).toFixed(2) + '; her last hour from T ' + ((hour[0] - t0) / 60).toFixed(1) + ': ' + tot.toFixed(0) + ' m3 gained');
  console.log('   compartment   an hour before   at the end    gained   share of the hour');
  for (let k = 0; k < 16; k++) if (end[k] > 1 || hour[1][k] > 1) console.log('   ' + C.ZONES[k].short.padEnd(12) + hour[1][k].toFixed(0).padStart(12) + end[k].toFixed(0).padStart(14) + gain[k].toFixed(0).padStart(10) + (100 * gain[k] / tot).toFixed(1).padStart(12) + ' %');
}
console.log('e84 on ' + root + ', flow numbers ' + JSON.stringify(params));
trace('the 1912 watch', () => N.create(ship, N.spec(1912), { auto: true, readers: false, params }), N.step, s => s.night.tTouch, s => N.over(s) || s.t > 5 * 3600);
trace('the 1912 damage preset', () => C.createSim(ship, params, SC.PRESETS.titanic.build({})), C.step, () => 0, s => s.foundered || s.t > 5 * 3600);
