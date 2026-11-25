// e101: the calibration epoch's Stage 0, M5 (the design v1.1, C5): the full spaces' and pockets' virtual over-fill.
// A full space (sim.vol over the ship's nodeVmax) or pocket (vol over cap) is pressed up by the sea's head over a stiff
// virtual area (nodeAov; a pocket's aov), and the excess is counted as water aboard. Over the 1912 preset and the 1912
// watch: the total excess against time, its largest and when, and the largest contributors then.
//   node docs/research/experiments/e101_epoch_m5_overfill.js [--write]
'use strict';
const fs = require('fs'), path = require('path'), os = require('os');
try { os.setPriority(0, os.constants.priority.PRIORITY_BELOW_NORMAL); } catch (e) {}
const C = require('../../../core/core.js'), SC = require('../../../core/scenarios.js'), N = require('../../../core/night.js');
const ship = C.buildShip(), out = [], log = (s) => { out.push(s); console.log(s); };
function excess(sim) {
  const parts = [];
  for (let n = 0; n < C.NN; n++) { const e = sim.vol[n] - ship.nodeVmax[n]; if (e > 0) parts.push(['space ' + n + ' (zone ' + (n >> 2) + ')', e]); }
  for (const k of sim.pockets || []) { const e = k.vol - k.cap; if (e > 0) parts.push([k.name, e]); }
  return { total: parts.reduce((a, p) => a + p[1], 0), parts };
}
function watchOver(lab, sim, step, t0of, done) {
  let best = { total: -1 }, at = 0, last = null, series = [];
  while (!done(sim)) {
    step(sim); const t0 = t0of(sim); if (t0 < 0) continue;
    const x = excess(sim), T = (sim.t - t0) / 60;
    if (x.total > best.total) { best = x; at = T; }
    if (series.length === 0 || T >= series[series.length - 1][0] + 15) series.push([T, x.total]);
    last = x;
  }
  log('  ' + lab + ': the largest total ' + best.total.toFixed(2) + ' m3 at T ' + at.toFixed(1) + '; at the end ' + (last ? last.total.toFixed(2) : 'n/a') + ' m3');
  log('      then: ' + best.parts.sort((a, b) => b[1] - a[1]).slice(0, 6).map(p => p[0] + ' ' + p[1].toFixed(2)).join('; '));
  log('      every 15 min: ' + series.map(([T, v]) => 'T ' + T.toFixed(0) + ' ' + v.toFixed(1)).join(', '));
}
log('e101 (the epoch, M5): the virtual over-fill (vol past nodeVmax, a pocket past its cap), counted as water aboard');
watchOver('the 1912 preset', C.createSim(ship, {}, SC.PRESETS.titanic.build({})), C.step, () => 0, (s) => s.foundered || s.t > 5 * 3600);
watchOver('the 1912 watch', N.create(ship, N.spec(1912), { auto: true, readers: false }), N.step, (s) => s.night.tTouch, (s) => N.over(s) || s.t > 5 * 3600);
if (process.argv.includes('--write')) {
  const dir = path.join(__dirname, 'results_2026-11-21'); if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, 'e101_epoch_m5_overfill.txt'), out.join('\n') + '\n(' + new Date().toISOString() + ')\n');
}
