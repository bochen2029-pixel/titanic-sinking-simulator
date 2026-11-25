// e73 (W6): a what-if on the 1912 damage preset: the list against time with (1) the coal list before the collision set to
// a value and (2) a stand-in for BR5's empty forward starboard bunker (HANDOFF.md 4a; the lists research note, section
// 3.3 and mechanism 3): a starboard weight of `tons` at `arm` m off the centreline, filling from T 1 to T 10 and let go
// at `burst` minutes (over one minute), applied through the core's roll seam sim.xMph (+ = starboard down). The weight's
// own mass is left out: a first look at the moment only. Not a model: docs/DESIGN_W6_the_lists_v1_2026-11-20.md, 3.3,
// builds the bunker as a pocket in its space.
//   node docs/research/experiments/e73_w6_bunker_standin.js <coalListDeg> <tons> <arm m> <burst min> [worktree]   (seconds)
const path = require('path');
const [coal, tons, arm, burst] = [+process.argv[2], +process.argv[3], +process.argv[4], +process.argv[5]];
const root = process.argv[6] || path.join(__dirname, '..', '..', '..');
const C = require(path.join(root, 'core', 'core.js'));
const SC = require(path.join(root, 'core', 'scenarios.js'));
const ship = C.buildShip(), DEG = 180 / Math.PI, G = 9.81;
const scen = SC.PRESETS.titanic.build({}); scen.coalListDeg = coal;
const sim = C.createSim(ship, {}, scen);
const MARKS = [2, 5, 10, 15, 20, 30, 45, 60, 75, 85, 90, 100, 110, 120, 130, 140, 145, 150, 155, 156];
const REC = { 10: '+5', 85: '+2', 100: '0', 120: '-6', 130: '-10', 145: '-15' };
const share = (T) => (T < 1 ? 0 : T < 10 ? (T - 1) / 9 : T < burst ? 1 : T < burst + 1 ? burst + 1 - T : 0);
let mi = 0; const out = [];
while (!sim.foundered && sim.t < 4 * 3600) {
  const T = sim.t / 60;
  sim.xMph = tons * 1000 * G * arm * share(T) * Math.cos(sim.roll);
  C.step(sim);
  const T1 = sim.t / 60;
  while (mi < MARKS.length && T1 >= MARKS[mi]) { out.push(MARKS[mi] + ':' + (sim.roll * DEG).toFixed(1) + (REC[MARKS[mi]] ? '(' + REC[MARKS[mi]] + ')' : '')); mi++; }
}
console.log('coal ' + coal + ', bunker ' + tons + ' t at ' + arm + ' m to T ' + burst + ': founders T ' + (sim.foundered ? (sim.founderT / 60).toFixed(2) : 'no') + ' | ' + out.join(' '));
