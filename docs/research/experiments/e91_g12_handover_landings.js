// e91 (G12): the 1912 watch (seed 1912, the 1912 orders) and the 1912 damage preset, handed to the fall at the founder
// flag (rule H1) and at B2's onset (Z3's what-if 'onset'), cut clean there or joined (Z6 inside B4: S.hinge as built,
// Lh 20 m): how each piece lies on the bed and where, and on the watch what the readers hold at each hand-over. The wreck
// has both pieces upright (R5 1.1). Headless; changes nothing (each begin() writes only sim.fall).
//   node docs/research/experiments/e91_g12_handover_landings.js [<worktree>]
'use strict';
const path = require('path');
const cp = require('child_process');
const root = path.resolve(process.argv[2] || path.join(__dirname, '..', '..', '..'));
const C = require(path.join(root, 'core', 'core.js'));
const SC = require(path.join(root, 'core', 'scenarios.js'));
const N = require(path.join(root, 'core', 'night.js'));
const GI = require(path.join(root, 'core', 'readers', 'girder.js'));
const F = require(path.join(root, 'core', 'readers', 'fall.js'));
const O = require(path.join(root, 'core', 'readers', 'onset.js'));
for (const r of ['people', 'reports', 'world']) require(path.join(root, 'core', 'readers', r + '.js'));
const L = require(path.join(__dirname, 'e91_g12_lib.js'));
const { f, DEG } = L;
const t0 = Date.now(), ship = C.buildShip();
let head = '?'; try { head = cp.execSync('git -C "' + root + '" rev-parse --short HEAD').toString().trim(); } catch (e) { /* not a repository */ }

// ---------------------------------------------------------------- the hand-overs
const out = [];
const say = (s) => { out.push(s === undefined ? '' : s); console.log(s === undefined ? '' : s); };
say('e91 (G12) on ' + root + ' at ' + head + ': where the pieces lie, by hand-over (the wreck: both upright, R5 1.1)');
say('  lies: upright within 30 deg of roll, UPSIDE DOWN past 150; roll and pitch of the piece at rest (deg; roll + to starboard, the core\'s sign)');
say();

// the watch to the flag, and to the onset (handover 'onset' makes over() true there)
const wFlag = N.create(ship, N.spec(1912), { auto: true });
while (!N.over(wFlag)) N.step(wFlag);
const wOn = N.create(ship, N.spec(1912), { auto: true, handover: 'onset' });
while (!N.over(wOn)) N.step(wOn);
const fdW = wOn.onset.found;
// the preset to the flag, and to its onset (B2's plain functions)
const pFlag = C.createSim(ship, {}, SC.PRESETS.titanic.build());
while (!pFlag.foundered && pFlag.t < 5 * 3600) C.step(pFlag);
const pOn = C.createSim(ship, {}, SC.PRESETS.titanic.build());
const stP = O.run(pOn, { stopAtOnset: true }), fdP = stP.found;

const cases = [
  { name: 'watch, the flag (H1)', sim: wFlag, opts: {} },
  { name: 'watch, the onset, cut clean', sim: wOn, opts: { any: true, cut: fdW.x, rule: 'break', t0: fdW.t } },
  { name: 'watch, the onset, joined', sim: wOn, opts: { any: true, cut: fdW.x, rule: 'break', t0: fdW.t, hinge: { sense: L.senseOf(fdW), Lh: 20 } } },
  { name: 'preset, the flag (H1)', sim: pFlag, opts: {} },
  { name: 'preset, the onset, cut clean', sim: pOn, opts: { any: true, cut: fdP.x, rule: 'break', t0: fdP.t } },
  { name: 'preset, the onset, joined', sim: pOn, opts: { any: true, cut: fdP.x, rule: 'break', t0: fdP.t, hinge: { sense: L.senseOf(fdP), Lh: 20 } } },
];
say('hand-over                         when                                 trim    list   pitch rate  roll rate  heave     piece  lies (pitch, roll)           from the break               under    strikes          joint');
for (const c of cases) {
  const h = L.handOf(c.sim), fall = L.toRest(F, F.begin(c.sim, c.opts)), land = L.landing(F, GI, fall), J = fall.eng.joint;
  c.land = land; c.h = h; c.J = J;
  land.forEach((p, i) => {
    const j = J ? (J.released ? 'let go +' + f(J.release.t - fall.t0, 1) + ' s by ' + J.release.by + ' at ' + f(J.release.theta / DEG, 1) + ' deg' : 'held') : '-';
    say((i ? '' : c.name).padEnd(34) + (i ? '' : L.whenOf(c.sim)).padEnd(37) + (i ? '' : f(h.trim, 1).padStart(5) + f(h.list, 1).padStart(8) + f(h.wth, 2).padStart(10) + f(h.wph, 2).padStart(11) + f(h.vz, 2).padStart(9)).padEnd(43) + '   ' + p.id.padEnd(6) + (p.lies + ' (' + f(p.a.pitch, 1) + ', ' + f(p.a.roll, 1) + ')').padEnd(29) + (f(p.dist, 0) + ' m (' + f(p.along, 0) + ', ' + f(p.across, 0) + ')').padEnd(29) + (p.under ? '+' + f(p.under.t - fall.t0, 1) + ' s' : '-').padEnd(9) + (p.strike ? '+' + f((p.strike.t - fall.t0) / 60, 2) + ' min ' + f(p.strike.speed, 2) : '-').padEnd(17) + (i ? '' : j));
  });
}
say('  rates: pitch and roll in deg/s, heave in m/s (up +); the flag\'s trim is by rule (pitch over 1.2 rad); the list there is the core\'s clamp when it reads -80.2');
say();

// ---------------------------------------------------------------- what the watch's readers hold at each hand-over
say('THE WATCH\'S READERS AT EACH HAND-OVER (the next step tells each reader she is gone: N.over)');
for (const [name, s] of [['the onset', wOn], ['the flag', wFlag]]) {
  const P = s.people && s.people.count, W = s.world;
  say('  ' + name.padEnd(10) + L.whenOf(s).padEnd(37) + (P ? 'people aboard ' + P.aboard + ', in boats ' + P.inBoats + ' (boats away ' + P.boatsAway + '), in the water ' + P.water : 'no people reader') + (W ? '; the wireless ' + (W.set && W.set.working ? 'working' : 'silent (' + (W.set && W.set.why) + ')') : ''));
}
say('  minutes afloat after the touch (Carpathia\'s score): the flag T ' + f(L.Tof(wFlag), 2) + ', the onset T ' + f(L.Tof(wOn), 2) + ': ' + f(L.Tof(wFlag) - L.Tof(wOn), 2) + ' min apart');
say();
say('(e91 took ' + f((Date.now() - t0) / 1000, 0) + ' s)');
