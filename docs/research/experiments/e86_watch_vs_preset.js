// e86: the 1912 watch against the 1912 damage preset, compartment by compartment, at given flow numbers and opening area
// (the watch's damage scaled with the area, as e83 --free-area): each forward compartment's share of the opened area and
// its water at T 30, 60, 90 and 120, to see which compartment's pace makes the two founder apart.
//   node docs/research/experiments/e86_watch_vs_preset.js <worktree> '<flow numbers JSON>' <area m2>
const path = require('path');
const root = process.argv[2] || path.join(__dirname, '..', '..', '..');
const params = JSON.parse(process.argv[3] || '{}'), area = +(process.argv[4] || 0.7506);
const C = require(path.join(root, 'core', 'core.js'));
const N = require(path.join(root, 'core', 'night.js'));
const E = require(path.join(root, 'core', 'encounter.js'));
const SC = require(path.join(root, 'core', 'scenarios.js'));
const ship = C.buildShip(), A0 = E.ICE.alpha, MARKS = [30, 60, 90, 120];
const zoneWater = (sim, k) => { let v = 0; for (let s = 0; s < 4; s++) v += sim.vol[k * 4 + s]; for (const p of sim.pockets || []) if ((p.node >> 2) === k) v += p.vol; return v; };
const areaShare = (sim) => { const a = new Float64Array(16); let t = 0; for (const o of sim.openings) { a[o.zone] += o.area; t += o.area; } return Array.from(a, v => (t > 0 ? 100 * v / t : 0)); };
function trace(make, step, t0of, done) {
  const sim = make(), w = {};
  while (!done(sim)) { step(sim); const t0 = t0of(sim); if (t0 === null) continue; const T = (sim.t - t0) / 60; for (const m of MARKS) if (w[m] === undefined && T >= m) w[m] = Array.from({ length: 10 }, (_, k) => zoneWater(sim, k)); }
  return { sim, w, share: areaShare(sim), end: sim.foundered ? (sim.founderT - (t0of(sim) || 0)) / 60 : null };
}
E.ICE.alpha = A0 * area / 0.7506;
const watch = trace(() => N.create(ship, N.spec(1912), { auto: true, readers: false, params }), N.step, s => (s.night.tTouch >= 0 ? s.night.tTouch : null), s => N.over(s) || s.t > 5 * 3600);
E.ICE.alpha = A0;
const preset = trace(() => C.createSim(ship, params, SC.PRESETS.titanic.build({ areaTitanic: area })), C.step, () => 0, s => s.foundered || s.t > 5 * 3600);
console.log('e86 on ' + root + ', flow numbers ' + JSON.stringify(params) + ', area ' + area + ' m2: the watch founders at T ' + watch.end.toFixed(2) + ', the preset at T ' + preset.end.toFixed(2));
console.log('   room     area share (watch / preset)   water at T 30, 60, 90, 120 (m3): the watch | the preset');
for (let k = 0; k < 10; k++) console.log('   ' + C.ZONES[k].short.padEnd(6) + (watch.share[k].toFixed(1) + ' / ' + preset.share[k].toFixed(1) + ' %').padStart(18) + '      ' + MARKS.map(m => (watch.w[m] ? watch.w[m][k].toFixed(0) : '-').padStart(6)).join('') + '  | ' + MARKS.map(m => (preset.w[m] ? preset.w[m][k].toFixed(0) : '-').padStart(6)).join(''));
