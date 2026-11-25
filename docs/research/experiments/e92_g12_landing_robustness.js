// e92 (G12): how firmly each hand-over decides how the pieces lie. Z1's perturbations of the core's state at the hand-over
// (q1c, q1f): trim and list +-1 deg; pitch and roll rate x0.8 and x1.2; heave rate x0.8 and x1.2, and x1.16 to x1.18
// where the watch's flag flipped both pieces; and last-bit noise on Math's transcendental functions (four seeds: the way
// two engines differ, E2). For the 1912 watch and the 1912 damage preset, at the flag (H1) and at B2's onset, cut clean
// and joined (S.hinge as built, Lh 20 m). Headless; changes nothing (the core's fields are put back after each fall).
//   node docs/research/experiments/e92_g12_landing_robustness.js [<worktree>] [watch | preset | both]
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
const { f } = L;
const t0 = Date.now(), ship = C.buildShip();
let head = '?'; try { head = cp.execSync('git -C "' + root + '" rev-parse --short HEAD').toString().trim(); } catch (e) { /* not a repository */ }
const say = (s) => console.log(s === undefined ? '' : s);

const cases = [];
if (which !== 'preset') {
  // readers off: the pieces' fall reads the core alone, and the onset reader is attached on its own below
  const wFlag = N.create(ship, N.spec(1912), { auto: true });
  while (!N.over(wFlag)) N.step(wFlag);
  const wOn = N.create(ship, N.spec(1912), { auto: true, handover: 'onset' });
  while (!N.over(wOn)) N.step(wOn);
  const fd = wOn.onset.found;
  cases.push({ name: 'watch, flag', sim: wFlag, opts: {} });
  cases.push({ name: 'watch, onset clean', sim: wOn, opts: { any: true, cut: fd.x, rule: 'break', t0: fd.t } });
  cases.push({ name: 'watch, onset joined', sim: wOn, opts: { any: true, cut: fd.x, rule: 'break', t0: fd.t, hinge: { sense: L.senseOf(fd), Lh: 20 } } });
}
if (which !== 'watch') {
  const pFlag = C.createSim(ship, {}, SC.PRESETS.titanic.build());
  while (!pFlag.foundered && pFlag.t < 5 * 3600) C.step(pFlag);
  const pOn = C.createSim(ship, {}, SC.PRESETS.titanic.build());
  const fd = O.run(pOn, { stopAtOnset: true }).found;
  cases.push({ name: 'preset, flag', sim: pFlag, opts: {} });
  cases.push({ name: 'preset, onset clean', sim: pOn, opts: { any: true, cut: fd.x, rule: 'break', t0: fd.t } });
  cases.push({ name: 'preset, onset joined', sim: pOn, opts: { any: true, cut: fd.x, rule: 'break', t0: fd.t, hinge: { sense: L.senseOf(fd), Lh: 20 } } });
}

say('e92 (G12) on ' + root + ' at ' + head + ': how the pieces lie under Z1\'s perturbations at the hand-over');
say('  each cell: the bow / the stern, U upright (roll within 30 deg), X upside down (past 150), S on her side; then the two rolls (deg)');
const short = (p) => (p.lies === 'upright' ? 'U' : (p.lies === 'UPSIDE DOWN' ? 'X' : 'S')) + (p.atRest ? '' : '?');
say('  ' + 'perturbation'.padEnd(26) + cases.map(c => c.name.padEnd(26)).join(''));
const tally = cases.map(() => ({ bowU: 0, sternU: 0, both: 0, n: 0 }));
for (const p of L.PERTURB) {
  const cells = cases.map((c, ci) => {
    const r = L.perturbed(F, GI, c.sim, c.opts, p), b = r.land.find(x => x.id === 'bow'), s = r.land.find(x => x.id === 'stern'), T = tally[ci];
    T.n++; if (b.lies === 'upright') T.bowU++; if (s.lies === 'upright') T.sternU++; if (b.lies === 'upright' && s.lies === 'upright') T.both++;
    return (short(b) + '/' + short(s) + ' ' + f(b.a.roll, 0) + ', ' + f(s.a.roll, 0)).padEnd(26);
  });
  say('  ' + p.id.padEnd(26) + cells.join(''));
}
say();
say('  upright of ' + tally[0].n + ':       ' + tally.map(T => ('bow ' + T.bowU + ', stern ' + T.sternU + ', both ' + T.both).padEnd(26)).join(''));
say('  (? after a letter: not yet at rest when the fall stopped, 30 minutes of its clock)');
say('(e92 took ' + f((Date.now() - t0) / 1000, 0) + ' s)');
