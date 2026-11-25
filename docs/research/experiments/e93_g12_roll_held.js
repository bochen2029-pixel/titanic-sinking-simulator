// e93 (G12, Z9): the other way to mend G12, the core's last-minute roll. Her list and trim through her last minutes as
// the core has them (the roll to its 80.2-degree clamp), and the same night with her list held from B2's onset on (her
// roll inertia made infinite and her roll rate zero there, as B2's 'list held' what-if and e40 held it): when the flag
// falls, how it is reached, and how the pieces lie handed over at that flag, with e92's perturbations. This stands for
// any mending of Z9 that keeps her near upright to the flag; it is not one. Headless; changes nothing in the repository.
//   node docs/research/experiments/e93_g12_roll_held.js [<worktree>] [watch | preset | both]
'use strict';
const path = require('path');
const cp = require('child_process');
const root = path.resolve(process.argv[2] || path.join(__dirname, '..', '..', '..'));
const which = process.argv[3] || 'both';
const C = require(path.join(root, 'core', 'core.js'));
const SC = require(path.join(root, 'core', 'scenarios.js'));
const N = require(path.join(root, 'core', 'night.js'));
const GI = require(path.join(root, 'core', 'readers', 'girder.js'));
const F = require(path.join(root, 'core', 'readers', 'fall.js'));
const O = require(path.join(root, 'core', 'readers', 'onset.js'));
const L = require(path.join(__dirname, 'e91_g12_lib.js'));
const { f, DEG } = L;
const t0 = Date.now(), ship = C.buildShip();
let head = '?'; try { head = cp.execSync('git -C "' + root + '" rev-parse --short HEAD').toString().trim(); } catch (e) { /* not a repository */ }
const say = (s) => console.log(s === undefined ? '' : s);

// one night to its flag, its list and trim logged from a minute before the onset; held from the onset when asked
function toFlag(make, step, onsetOf, hold) {
  const sim = make(), log = []; let tOn = null, held = false, lastLog = -1e9;
  while (!sim.foundered && sim.t < 5 * 3600) {
    step(sim);
    const fd = onsetOf(sim);
    if (fd && tOn === null) tOn = sim.t;
    if (hold && fd && !held) { sim.Iph0 = 1e30; sim.wph = 0; held = true; }
    if (tOn !== null && sim.t - lastLog >= 10) { log.push({ T: L.Tof(sim), trim: sim.pitch / DEG, list: sim.roll / DEG }); lastLog = sim.t; }
  }
  return { sim, log, tOn };
}
const runs = [];
if (which !== 'preset') {
  const st = { k: 0 };
  const make = () => N.create(ship, N.spec(1912), { auto: true });
  runs.push(['watch, as it is', toFlag(make, N.step, (s) => s.onset && s.onset.found, false)]);
  runs.push(['watch, list held from the onset', toFlag(make, N.step, (s) => s.onset && s.onset.found, true)]);
}
if (which !== 'watch') {
  // the preset has no readers: B2's plain functions look on their schedule
  const presetRun = (hold) => { const st = O.start(); return toFlag(() => C.createSim(ship, {}, SC.PRESETS.titanic.build()), C.step, (s) => O.look(s, st), hold); };
  runs.push(['preset, as it is', presetRun(false)]);
  runs.push(['preset, list held from the onset', presetRun(true)]);
}

say('e93 (G12, Z9) on ' + root + ' at ' + head + ': her last minutes, as they are and with her list held from B2\'s onset; the flag\'s hand-over from each');
for (const [name, r] of runs) {
  const s = r.sim, onT = r.tOn === null ? null : (s.night ? (r.tOn - s.night.tTouch) / 60 : r.tOn / 60);
  say('  ' + name + ': the onset at T ' + f(onT, 2) + '; the flag at T ' + f(L.Tof(s), 2) + ' (trim ' + f(s.pitch / DEG, 1) + ', list ' + f(s.roll / DEG, 1) + ')');
  say('    T, trim, list from the onset, every 10 s: ' + r.log.map(e => f(e.T, 2) + ' ' + f(e.trim, 1) + '/' + f(e.list, 1)).join('  '));
}
say();
say('THE FLAG\'S HAND-OVER FROM EACH, under e92\'s perturbations (U upright, X upside down, S on her side; the bow / the stern; their rolls)');
say('  ' + 'perturbation'.padEnd(26) + runs.map(([n]) => n.padEnd(36)).join(''));
const tally = runs.map(() => ({ bowU: 0, sternU: 0, both: 0, n: 0 }));
const short = (p) => (p.lies === 'upright' ? 'U' : (p.lies === 'UPSIDE DOWN' ? 'X' : 'S')) + (p.atRest ? '' : '?');
for (const p of L.PERTURB) {
  const cells = runs.map(([, r], ri) => {
    const x = L.perturbed(F, GI, r.sim, {}, p), b = x.land.find(q => q.id === 'bow'), s = x.land.find(q => q.id === 'stern'), T = tally[ri];
    T.n++; if (b.lies === 'upright') T.bowU++; if (s.lies === 'upright') T.sternU++; if (b.lies === 'upright' && s.lies === 'upright') T.both++;
    return (short(b) + '/' + short(s) + ' ' + f(b.a.roll, 0) + ', ' + f(s.a.roll, 0)).padEnd(36);
  });
  say('  ' + p.id.padEnd(26) + cells.join(''));
}
say();
say('  upright of ' + tally[0].n + ':       ' + tally.map(T => ('bow ' + T.bowU + ', stern ' + T.sternU + ', both ' + T.both).padEnd(36)).join(''));
say('(e93 took ' + f((Date.now() - t0) / 1000, 0) + ' s)');
