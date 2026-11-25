// e106 (the calibration epoch, C5 and C1): what weighing a full space at its capacity does to the break's onset (B2),
// against what it does to the founder flag. C5 (params.weighOverfill 0; wt/epoch-c 705a2fb, the gauge's side
// 1e18e98): a full space or pocket weighs its capacity, the excess being the sea's head on a stiff virtual area. C1
// (Mo.SHIP.massPockets 1; 372bda0): her mass under way counts every body of water, the pockets' too (the watch only: a
// preset has no motion). Runs, each to her founder, B2's onset looked for after every step by onset.js's own schedule:
//   the 1912 damage preset: today; C5;
//   the 1912 watch: today; C5; C5 with C1.
// For Bo's morning question (what the end term fits: the flag fitted, the onset held out): how far the onset moves under
// C5 against the flag. Headless; changes nothing in the repository (the switches are set on these sims and on the
// motion module inside this process only, and put back).
//   node docs/research/experiments/e106_c5_onset.js [<worktree>]
'use strict';
const path = require('path');
const cp = require('child_process');
const root = path.resolve(process.argv[2] || path.join(__dirname, '..', '..', '..'));
const C = require(path.join(root, 'core', 'core.js'));
const SC = require(path.join(root, 'core', 'scenarios.js'));
const Mo = require(path.join(root, 'core', 'motion.js'));
const N = require(path.join(root, 'core', 'night.js'));
const O = require(path.join(root, 'core', 'readers', 'onset.js'));
const t0 = Date.now(), ship = C.buildShip(), GN = 1e9;
let head = '?'; try { head = cp.execSync('git -C "' + root + '" rev-parse --short HEAD').toString().trim(); } catch (e) { /* not a repository */ }
const say = (s) => console.log(s === undefined ? '' : s);
const f = (v, d) => (v === null || v === undefined || !Number.isFinite(v)) ? 'n/a' : v.toFixed(d === undefined ? 2 : d);
if (C.DEFAULT_PARAMS.weighOverfill === undefined || Mo.SHIP.massPockets === undefined) { say('e106 needs C5 (params.weighOverfill) and C1 (SHIP.massPockets): run it on wt/epoch-c or later'); process.exit(1); }

function one(kind, c5, c1) {
  const keepC1 = Mo.SHIP.massPockets;
  Mo.SHIP.massPockets = c1 ? 1 : 0;
  try {
    const sim = kind === 'watch' ? N.create(ship, N.spec(1912), { auto: true }) : C.createSim(ship, {}, SC.PRESETS.titanic.build());
    if (c5) sim.params.weighOverfill = 0;
    const st = O.start();
    const Tz = () => kind === 'watch' ? (sim.night.tTouch >= 0 ? sim.night.tTouch : null) : 0;
    while (!sim.foundered && sim.t < 5 * 3600) {
      if (kind === 'watch') N.step(sim); else C.step(sim);
      O.look(sim, st);
    }
    const tz = Tz(), founder = sim.foundered ? (sim.founderT - tz) / 60 : null;
    let water = 0; C.eachWater(sim, (V) => { water += V; });
    return { kind, c5, c1, found: st.found, founder, looks: st.looks, water, weighed: C.weighedWater(sim), fp: kind === 'watch' ? N.fingerprint(sim) : null };
  } finally { Mo.SHIP.massPockets = keepC1; }
}
const RUNS = [['preset', 0, 0], ['preset', 1, 0], ['watch', 0, 0], ['watch', 1, 0], ['watch', 1, 1]].map(([k, a, b]) => one(k, a, b));

say('e106 (the epoch, C5 and C1) on ' + root + ' at ' + head + ': the break\'s onset (B2) against the founder flag, today and with the switches on');
say('  T: minutes after the collision (the preset) or the touch (the watch); the onset: the first step where (M/Mu)^2 + (V/Vu)^2 reaches 1 at any station');
say();
say('  run                         onset T    step   station                         M of Mu (GN m)   V of Vu (MN)   trim, list   flag T   flag less onset   water at the flag (m3): all, weighed');
const name = (r) => (r.kind === 'watch' ? 'the watch' : 'the preset') + (r.c5 ? (r.c1 ? ', C5 and C1' : ', C5') : ', today');
for (const r of RUNS) {
  const q = r.found;
  say('  ' + name(r).padEnd(26) + (q ? f(q.T, 2).padStart(9) + String(q.k).padStart(8) + ('   x ' + f(q.x, 2) + ' (' + q.where + ')').padEnd(34) + (f(q.M / GN, 3) + ' of ' + f(q.Mu / GN, 3)).padStart(16) + (f(q.V / 1e6, 1) + ' of ' + f(q.Vu / 1e6, 1)).padStart(15) + (f(q.trimDeg, 1) + ', ' + f(q.listDeg, 1)).padStart(13) : '    no onset before the flag'.padEnd(97)) +
    f(r.founder, 2).padStart(9) + (q ? f(r.founder - q.T, 2) : 'n/a').padStart(18) + ('   ' + f(r.water, 0) + ', ' + f(r.weighed, 0)));
}
say();
const by = (k, a, b) => RUNS.find(r => r.kind === k && r.c5 === a && r.c1 === b);
for (const [k, a, b, label] of [['preset', 1, 0, 'the preset, C5'], ['watch', 1, 0, 'the watch, C5'], ['watch', 1, 1, 'the watch, C5 and C1']]) {
  const r = by(k, a, b), base = by(k, 0, 0);
  const dOn = r.found && base.found ? r.found.T - base.found.T : null, dFl = r.founder !== null && base.founder !== null ? r.founder - base.founder : null;
  say('  ' + label.padEnd(24) + ': the onset moves ' + (dOn === null ? 'n/a' : (dOn >= 0 ? '+' : '') + f(dOn, 2) + ' min') + ' (station ' + (r.found && base.found ? (Math.abs(r.found.x - base.found.x) < 1e-6 ? 'the same' : f(base.found.x, 2) + ' to ' + f(r.found.x, 2)) : 'n/a') + '), the flag ' + (dFl === null ? 'n/a' : (dFl >= 0 ? '+' : '') + f(dFl, 2) + ' min') + '; the onset\'s move over the flag\'s ' + (dOn !== null && dFl ? f(dOn / dFl, 2) : 'n/a'));
}
say('  the watches\' fingerprints: ' + RUNS.filter(r => r.kind === 'watch').map(r => name(r) + ' ' + r.fp).join('; '));
say();
say('(e106 took ' + f((Date.now() - t0) / 1000, 0) + ' s)');
