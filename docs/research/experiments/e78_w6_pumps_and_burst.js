// e78 (W6): the bunker of the fire and the 1912 damage's pumps: when it gives way and when she founders, with her pumps
// as worked and without them. With the head ACROSS its wall as the burst law (its water's head less the stokehold's,
// the first build), pumping the stokehold dry loaded the wall most and brought the burst: the systems suite measured
// her foundering at 167.35 min with the pumps against 176.37 without (the pumps note: they bought about 5 minutes). The
// law since is the head of its own water over its floor (DEFAULT_PARAMS, bunkerBurst); this prints both runs under it.
//   node docs/research/experiments/e78_w6_pumps_and_burst.js [worktree]   (seconds)
const path = require('path');
const root = process.argv[2] || path.join(__dirname, '..', '..', '..');
const C = require(path.join(root, 'core', 'core.js'));
const SC = require(path.join(root, 'core', 'scenarios.js'));
const ship = C.buildShip();
for (const [name, scen] of [['with her pumps as worked', SC.PRESETS.titanic.build({})], ['without pumps', SC.PRESETS.titanic.build({ noPumps: true })]]) {
  const sim = C.createSim(ship, {}, scen), k = sim.pockets[0];
  let stoke = 0;
  while (!sim.foundered && sim.t < 5 * 3600) { C.step(sim); if (k.state === 0) stoke = Math.max(stoke, sim.vol[k.node] + sim.vol[k.node - 2]); }
  console.log(name.padEnd(26) + ': the bunker gives way at ' + (k.state ? 'T ' + (k.t / 60).toFixed(2) : 'never') + ' (the stokehold at most ' + stoke.toFixed(1) + ' m3 while it held); founders at T ' + (sim.foundered ? (sim.founderT / 60).toFixed(2) : 'no') + '; ' + (sim.pumped * C.RHO / 1000).toFixed(0) + ' t pumped');
}
