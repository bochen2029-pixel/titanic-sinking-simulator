// e72 (W6): her list (roll, + = starboard down) and trim against time, on the 1912 watch and the 1912 damage preset,
// against the record's points (docs/research/RESEARCH_lists_bunkers_scotland_road_v1_2026-11-17.md, section 1: Hichens
// +5 at T 5-10; Halpern's reconstruction +5 at T 10, +2 at T 85, 0 at T 100, -10 at T 130, -15 at T 145; Rowe -6 at
// T 120). Also: when the trim passes 20 degrees, and when the roll reaches the core's clamp (1.4 rad).
//   node docs/research/experiments/e72_w6_list_probe.js [worktree] [watch|preset|both]   (seconds)
// The design: docs/DESIGN_W6_the_lists_v1_2026-11-20.md. Its section 2's solver variants ran this on scratch copies of
// core/ with `(full ? 40 : 6)` set to 40, and with `full = true;` at the head of solveLevels.
const path = require('path');
const modes = ['watch', 'preset', 'both'];
const a2 = process.argv[2], a3 = process.argv[3];
const root = a2 && !modes.includes(a2) ? a2 : path.join(__dirname, '..', '..', '..');
const which = modes.includes(a2) ? a2 : (a3 || 'both');
const C = require(path.join(root, 'core', 'core.js'));
const N = require(path.join(root, 'core', 'night.js'));
const SC = require(path.join(root, 'core', 'scenarios.js'));
const ship = C.buildShip(), DEG = 180 / Math.PI;
const MARKS = [1, 2, 5, 10, 15, 20, 30, 45, 60, 75, 85, 90, 100, 110, 120, 130, 140, 145, 150, 152, 154, 155, 156, 157, 158, 159, 160];
const REC = { 10: '+5', 85: '+2', 100: '0', 120: '-6 (Rowe)', 130: '-10', 145: '-15' };

function trace(name, sim, step, t0of, done) {
  const rows = []; let mi = 0, t20 = null, clamp = null, peakS = { r: -1e9, T: 0 }, peakP = { r: 1e9, T: 0 }, firstPort = null;
  while (!done(sim)) {
    step(sim);
    const t0 = t0of(sim); if (t0 === null) continue;
    const T = (sim.t - t0) / 60, roll = sim.roll * DEG, pitch = sim.pitch * DEG;
    if (t20 === null && pitch > 20) t20 = { T, roll };
    if (clamp === null && Math.abs(sim.roll) >= 1.4) clamp = { T, pitch };
    if (roll > peakS.r) peakS = { r: roll, T };
    if (roll < peakP.r) peakP = { r: roll, T };
    if (firstPort === null && T > 1 && roll < 0) firstPort = T;
    while (mi < MARKS.length && T >= MARKS[mi]) { rows.push([MARKS[mi], roll, pitch, sim.mw / 1e6]); mi++; }
  }
  const t0 = t0of(sim), Tend = (sim.t - t0) / 60;
  console.log('== ' + name + ': founders ' + (sim.foundered ? 'at T ' + ((sim.founderT - t0) / 60).toFixed(2) : 'no') + ' (stopped at T ' + Tend.toFixed(2) + '); roll at the end ' + (sim.roll * DEG).toFixed(2) + ', pitch ' + (sim.pitch * DEG).toFixed(2));
  console.log('   T min   list deg (+ stbd)   trim deg   water kt   record');
  for (const r of rows) console.log('   ' + String(r[0]).padStart(5) + '   ' + r[1].toFixed(2).padStart(9) + '           ' + r[2].toFixed(2).padStart(7) + '   ' + r[3].toFixed(1).padStart(7) + '   ' + (REC[r[0]] || ''));
  console.log('   most to starboard ' + peakS.r.toFixed(2) + ' at T ' + peakS.T.toFixed(1) + '; most to port ' + peakP.r.toFixed(2) + ' at T ' + peakP.T.toFixed(1) + '; first to port after T 1: ' + (firstPort === null ? 'never' : 'T ' + firstPort.toFixed(1)));
  console.log('   trim past 20 deg: ' + (t20 ? 'T ' + t20.T.toFixed(2) + ' at list ' + t20.roll.toFixed(2) : 'never') + '; roll at the clamp (80.2 deg): ' + (clamp ? 'T ' + clamp.T.toFixed(2) + ' at trim ' + clamp.pitch.toFixed(1) : 'never'));
}

if (which === 'watch' || which === 'both') {
  const sim = N.create(ship, N.spec(1912), { auto: true });
  trace('the 1912 watch (auto)', sim, N.step, s => (s.night.tTouch >= 0 ? s.night.tTouch : null), s => N.over(s) || s.t > 4 * 3600);
}
if (which === 'preset' || which === 'both') {
  const sim = C.createSim(ship, {}, SC.PRESETS.titanic.build({}));
  trace('the 1912 damage preset', sim, C.step, () => 0, s => s.foundered || s.t > 4 * 3600);
}
