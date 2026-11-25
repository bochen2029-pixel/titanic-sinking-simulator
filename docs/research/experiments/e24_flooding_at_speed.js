// e24: P5, flooding at speed (Tier 0, core/motion.js seaHeads): what the sea's pressure at the openings does, measured
// on the watch (motion, encounter and plant, the pumps as the engineers work them) with it on and off:
//   - the 1912 watch on its reconstructed orders (the engines stopped as the record has them), sunk;
//   - the same night, but after the touch the telegraph rung to Full ahead (or Half, or Slow) and held to the end;
//   - the 1912 berg met dead ahead with no order (a stem strike: a crushed bow open to the sea, then held at Full);
//   - a side hole near the bow (0.2 m2 in the forepeak) at 22.5, 15 and 10 knots held, against the same at rest.
// Reported: founders after the touch (or after the start), and the head the sea adds at the openings at the start.
//   node docs/research/experiments/e24_flooding_at_speed.js [--write]
// Output of 2026-11-17: results_2026-11-17/e24_flooding_at_speed.txt
const fs = require('fs'), path = require('path');
const C = require('../../../core/core.js');
const Mo = require('../../../core/motion.js');
const N = require('../../../core/night.js');
const Sys = require('../../../core/systems.js');
const SC = require('../../../core/scenarios.js');
const out = [], log = (s) => { out.push(s); console.log(s); };
const f = (v, n) => (v === null || v === undefined ? 'n/a' : v.toFixed(n === undefined ? 1 : n));
const ship = C.buildShip();

function watch(label, after) {
  const res = {};
  for (const on of [false, true]) {
    Mo.SEAFLOW.on = on;
    const sp = N.spec(1912), sim = N.create(ship, sp, after === 'dead ahead' ? {} : { script: N.scriptOf(sp.orders) });
    if (after === 'dead ahead') { sim.enc.berg.Y = sim.mo.Y; }        // the berg's centre on her track: a stem strike
    let rung = false;
    while (!sim.foundered && sim.t < 6 * 3600) {
      N.step(sim);
      if (after && after !== 'dead ahead' && !rung && sim.night.tTouch >= 0 && sim.t > sim.night.tTouch + 30) {
        sim.night.script = null; sim.night.did = null;            // the bridge takes over from the reconstructed orders
        N.telegraph(sim, after); N.helm(sim, 0); rung = true;
      }
      if (sim.t > 4 * 3600 && Math.abs(sim.inflow) < 0.02 && Math.abs(sim.wth) < 1e-5) break;
    }
    const t0 = sim.night.tTouch >= 0 ? sim.night.tTouch : 0;
    res[on] = sim.foundered ? (sim.founderT - t0) / 60 : null;
  }
  Mo.SEAFLOW.on = true;
  const d = res[true] !== null && res[false] !== null ? res[true] - res[false] : null;
  log('  ' + label.padEnd(62) + (res[false] === null ? 'afloat' : f(res[false], 2) + ' min').padStart(12) + (res[true] === null ? 'afloat' : f(res[true], 2) + ' min').padStart(14) + (d === null ? '' : ('  ' + (d >= 0 ? '+' : '') + f(d, 2))));
  return res;
}
function sideHole(label, kn) {
  const res = {};
  for (const on of [false, true]) {
    Mo.SEAFLOW.on = on;
    const sim = C.createSim(ship, {}, { openings: [{ x: 120, y: -(C.halfBreadth(120, 4) + 0.02), z: 4, area: 0.2, kind: 'breach', label: 'test' }], coalListDeg: 0 });
    Mo.attach(sim, kn ? { knots: kn } : { order: 'stop' }); Sys.attach(sim);
    let water10 = null;
    while (!sim.foundered && sim.t < 3600) { Sys.step(sim); Mo.step(sim); if (water10 === null && sim.t >= 600) { water10 = 0; for (let n = 0; n < C.NN; n++) water10 += sim.vol[n]; } }
    res[on] = water10 * C.RHO / 1000;
  }
  Mo.SEAFLOW.on = true;
  log('  ' + label.padEnd(62) + (f(res[false], 0) + ' t').padStart(12) + (f(res[true], 0) + ' t').padStart(14) + '  x' + f(res[true] / res[false], 2));
}
log('e24: flooding at speed (P5, Tier 0): founders after the touch, without the sea\'s pressure at the openings and with it');
log('  ' + 'the watch'.padEnd(62) + 'without'.padStart(12) + 'with'.padStart(14) + '  change');
watch('1912, the reconstructed orders (the engines stopped)', null);
watch('1912, then Full ahead 30 s after the touch, held', 'full ahead');
watch('1912, then Half ahead 30 s after the touch, held', 'half ahead');
watch('1912, then Slow ahead 30 s after the touch, held', 'slow ahead');
log('\n  ' + 'a 0.2 m2 hole in the forepeak\'s side, 4 m above the keel: water in 10 min'.padEnd(62) + 'without'.padStart(12) + 'with'.padStart(14));
sideHole('stopped', 0);
sideHole('10 knots held', 10);
sideHole('15 knots held', 15);
sideHole('22.5 knots held', 22.5);
log('\nThe brainstorm measured the same law on the 1912 hand-made damage (section 5.4): the night as it happened moves by');
log('seconds to two minutes; a ship that holds her speed is where the pressure at the openings decides the outcome.');
if (process.argv.includes('--write')) {
  const dir = path.join(__dirname, 'results_2026-11-17');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, 'e24_flooding_at_speed.txt'), out.join('\n') + '\n');
}
