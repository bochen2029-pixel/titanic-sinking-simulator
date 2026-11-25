// e41: does calling the hull girder's gauge every step move the run? (the break's test would sit in the step). For
// docs/DESIGN_the_break_and_two_bodies_v1_2026-11-19.md. It writes nothing. TITANIC_ROOT names the tree whose core is read
// (default: this repository). Output of 2026-11-19 on a clean worktree of a97a6bd: results_2026-11-19/e41_gauge_purity_every_step.txt
const path = require('path'), crypto = require('crypto');
const ROOT = process.env.TITANIC_ROOT || path.join(__dirname, '..', '..', '..');
const C = require(path.join(ROOT, 'core/core.js')), SC = require(path.join(ROOT, 'core/scenarios.js')), GI = require(path.join(ROOT, 'core/readers/girder.js'));
function run(mode) {
  const sim = C.createSim(C.buildShip(), {}, SC.PRESETS.titanic.build({}));
  const h = crypto.createHash('sha256'); let calls = 0, t0 = Date.now(), first = -1;
  const ref = mode === 'every' ? null : null;
  while (!sim.foundered && sim.t < 4 * 3600) {
    C.step(sim);
    if (mode === 'every' && sim.t >= 140 * 60) { GI.moment(sim); calls++; }
    if (mode === 'from0') { GI.moment(sim); calls++; }
    h.update(Buffer.from(sim.vol.buffer)); h.update(String(sim.pitch) + sim.roll + sim.zO);
  }
  return { mode, founderT: (sim.founderT / 60).toFixed(3), sha: h.digest('hex').slice(0, 12), calls, ms: Date.now() - t0 };
}
for (const m of ['none', 'every', 'from0']) console.log(JSON.stringify(run(m)));
