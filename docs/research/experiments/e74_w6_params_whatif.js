// e74 (W6): a what-if on the 1912 damage preset: the list against time with the core's params overridden (JSON) and,
// optionally, the coal list before the collision set to a value. The design: docs/DESIGN_W6_the_lists_v1_2026-11-20.md.
//   node docs/research/experiments/e74_w6_params_whatif.js '{"upperSplit":1,"wStbd":0.5}' [coalListDeg] [worktree]   (seconds)
// (In PowerShell pass the JSON with its quotes escaped: '{\"upperSplit\":1}'.)
const path = require('path');
const over = JSON.parse(process.argv[2] || '{}'), coal = process.argv[3];
const root = process.argv[4] || path.join(__dirname, '..', '..', '..');
const C = require(path.join(root, 'core', 'core.js'));
const SC = require(path.join(root, 'core', 'scenarios.js'));
const ship = C.buildShip(), DEG = 180 / Math.PI;
const scen = SC.PRESETS.titanic.build({}); if (coal !== undefined && coal !== '') scen.coalListDeg = +coal;
const sim = C.createSim(ship, over, scen);
const MARKS = [5, 10, 30, 60, 85, 100, 110, 120, 130, 140, 145, 150, 155, 156];
const REC = { 10: '+5', 85: '+2', 100: '0', 120: '-6', 130: '-10', 145: '-15' };
let mi = 0; const out = [];
while (!sim.foundered && sim.t < 4 * 3600) {
  C.step(sim);
  const T = sim.t / 60;
  while (mi < MARKS.length && T >= MARKS[mi]) { out.push(MARKS[mi] + ':' + (sim.roll * DEG).toFixed(1) + (REC[MARKS[mi]] ? '(' + REC[MARKS[mi]] + ')' : '')); mi++; }
}
console.log(JSON.stringify(over) + (coal !== undefined && coal !== '' ? ' coal ' + coal : '') + ': founders T ' + (sim.foundered ? (sim.founderT / 60).toFixed(2) : 'no') + ' | ' + out.join(' '));
