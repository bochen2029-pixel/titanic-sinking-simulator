'use strict';
// e66: what a step costs today, the measure for Z6's (Z1, 2026-11-20; docs/DESIGN_free_body_air_by_space_v1, section 6).
// It times two things:
//   - the core's step: 64 spaces, its connections, the level solve, from the start to T 155.5 on the 1912 preset;
//   - the fall's advance from that hand-off (both pieces, 8 sub-steps each, dt 0.25 s): at the surface (the first 60 s),
//     under water, and to rest on the bed.
// Wall-clock times: they depend on the machine and its load. The counts (sub-steps, iterations) do not.
// Found on 2026-11-20 (this laptop):
//   - the core: 71 us a step;
//   - the fall: 317 us a sub-step at the surface, 81 to 93 under water, 4 iterations a sub-step;
//   - a whole fall: about 4.3 s.
// The spread: wall-clock times on this laptop moved with what else was running (five sessions shared it on
// 2026-11-20). Across that day's runs the core took 62 to 119 us a step, and the fall 30 to 119 us a sub-step under water
// and 121 to 358 at the surface. The design's figures are the first run's (71, 81 to 93, 317). The ratios Z6 is sized by
// (the core's step against the fall's sub-step) hold across them; the counts (sub-steps, iterations) never moved.
// --repeat N measures N times, so the spread is in the table.
//   node docs/research/experiments/e66_z6_step_cost.js [--root <tree>] [--repeat <N>] [--write]
// Output of 2026-11-20: results_2026-11-20/e66_z6_step_cost.txt
const fs = require('fs'), path = require('path');
const argv = process.argv.slice(2), WRITE = argv.includes('--write'), ri = argv.indexOf('--root'), pi = argv.indexOf('--repeat');
const ROOT = ri >= 0 ? path.resolve(argv[ri + 1]) : path.resolve(__dirname, '../../..'), REPEAT = pi >= 0 ? Math.max(1, +argv[pi + 1]) : 1;
const C = require(path.join(ROOT, 'core/core.js')), SC = require(path.join(ROOT, 'core/scenarios.js'));
const F = require(path.join(ROOT, 'core/readers/fall.js'));
const out = [], say = (s) => { s = s === undefined ? '' : s; out.push(s); console.log(s); };
say('e66: what a step costs today (wall clock: this machine, its load)');
say('tree: ' + (ri >= 0 ? path.basename(ROOT) + ' (given by --root)' : 'this repository'));
const ship = C.buildShip();
for (let rep = 1; rep <= REPEAT; rep++) {
  if (REPEAT > 1) { say(''); say('-- run ' + rep + ' of ' + REPEAT); }
  const sim = C.createSim(ship, {}, SC.PRESETS.titanic.build());
  const t = process.hrtime.bigint();
  let n = 0;
  while (!sim.foundered && sim.t < 155.5 * 60 - 1e-9) { C.step(sim); n++; }
  const coreMs = Number(process.hrtime.bigint() - t) / 1e6;
  say('the core: ' + n + ' steps to T 155.5 in ' + coreMs.toFixed(0) + ' ms: ' + (coreMs / n * 1000).toFixed(1) + ' us a step; connections ' + sim.conn.n);
  const fall = F.begin(sim, { any: true, K: { tiersFlow: 0 } });
  say('the fall\'s slices: ' + fall.eng.bodies.map(b => b.id + ' ' + b.n).join(', '));
  const seg = (label, k) => {
    const s0 = fall.eng.bodies.map(b => [b.subs, b.iters]);
    const t0 = process.hrtime.bigint();
    for (let i = 0; i < k && !fall.done; i++) F.advance(fall);
    const ms = Number(process.hrtime.bigint() - t0) / 1e6;
    const S = fall.eng.bodies.reduce((a, b, i) => a + b.subs - s0[i][0], 0), I = fall.eng.bodies.reduce((a, b, i) => a + b.iters - s0[i][1], 0);
    say(label.padEnd(34) + (ms / k).toFixed(2) + ' ms an advance (both pieces); ' + (S / k).toFixed(1) + ' sub-steps and ' + (I / Math.max(S, 1)).toFixed(1) + ' iterations a sub-step; ' + (ms * 1000 / Math.max(S, 1)).toFixed(0) + ' us a sub-step');
  };
  seg('the first 60 s (at the surface):', 240);
  seg('60 to 180 s (under):', 480);
  seg('180 to 300 s:', 480);
  let k = 0;
  const t1 = process.hrtime.bigint();
  while (!fall.done && k < 40 * 240) { F.advance(fall); k++; }
  say('the rest, to rest on the bed: ' + k + ' advances in ' + (Number(process.hrtime.bigint() - t1) / 1e6).toFixed(0) + ' ms');
}
if (WRITE) { const d = path.join(__dirname, 'results_2026-11-20'); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, 'e66_z6_step_cost.txt'), out.join('\n') + '\n'); }
