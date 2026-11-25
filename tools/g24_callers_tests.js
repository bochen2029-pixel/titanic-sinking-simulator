// G24's remainder (BACKLOG G24, the coordinator 2026-11-23): since the calibration epoch's landing (D4) her ends above
// 11.0 m are on (C3, hullEnds 1), and C.halfBreadth takes them only through its third argument, the ship's hull. This
// suite finds every call made WITHOUT it from core/'s callers (the encounter, motion, the scenarios, the people reader),
// in real runs, and holds each caller to one of two things: it reads only at or below ends.z0, where the hull with her
// ends and the one without are the same to the bit; or it is named here, with what it reads above, until it passes the
// ship's hull. Headless, about half a minute.
//   node tools/g24_callers_tests.js
// How: C.halfBreadth is wrapped in this process (the callers look it up on the core's module object at each call), so
// each call without a hull is seen with its caller's file and compared with the call on the ship's own hull. core.js's
// own calls use its local function and are checked here by their heights (the pockets' capacities).
// MUST rows: the encounter's calls on the 1912 watch and five drawn nights; motion's (seaHeads' normals at the ice's
// openings) on the same; every preset's build; core.js's pockets. CHECK rows (failing visibly until fixed): what reads
// above 11.0 m where her ends widen her, with the most it is off.
'use strict';
const path = require('path');
const C = require('../core/core.js');
const HULL = C.buildShip().hull, Z0 = HULL.ends.z0, orig = C.halfBreadth;
const calls = new Map();                                     // caller file -> { n, maxZ, differ, worst, at }
function callerOf() {
  const lines = (new Error().stack || '').split('\n').slice(3);
  for (const l of lines) { const m = /[\\/](core[\\/](?:readers[\\/])?[\w.]+\.js):(\d+)/.exec(l); if (m && !/core[\\/]core\.js/.test(m[1])) return m[1].replace(/\\/g, '/') + ':' + m[2]; }
  return 'other';
}
C.halfBreadth = function (x, z, P) {
  if (P === undefined) {
    const who = callerOf(), a = orig(x, z), b = orig(x, z, HULL);
    let c = calls.get(who); if (!c) calls.set(who, c = { n: 0, maxZ: -Infinity, differ: 0, worst: 0, at: '' });
    c.n++; if (z > c.maxZ) c.maxZ = z;
    if (a !== b) { c.differ++; if (Math.abs(b - a) > c.worst) { c.worst = Math.abs(b - a); c.at = 'x ' + x.toFixed(2) + ', z ' + z.toFixed(2); } }
  }
  return orig(x, z, P);
};
// required after the wrapper, so that what they compute at load (the people reader's stations) is seen too
const N = require('../core/night.js');
const SC = require('../core/scenarios.js');
const BP = require('../core/readers/people.js');

const rows = []; let fails = 0, checks = 0;
function row(kind, what, value, ref, ok) { rows.push([kind, what, value, ref, ok]); if (!ok) { if (kind === 'MUST') fails++; else checks++; } }
const f = (x, n) => (x === null || x === undefined || !Number.isFinite(x) ? 'n/a' : (+x).toFixed(n === undefined ? 2 : n));
const byFile = (re) => [...calls.entries()].filter(([who]) => re.test(who));
const sum = (list) => list.reduce((s, [who, c]) => ({ n: s.n + c.n, maxZ: Math.max(s.maxZ, c.maxZ), differ: s.differ + c.differ, worst: Math.max(s.worst, c.worst), at: c.worst > s.worst ? who + ' at ' + c.at : s.at, lines: s.lines.concat(who) }), { n: 0, maxZ: -Infinity, differ: 0, worst: 0, at: '', lines: [] });

try {
  // ---- the people reader's stations, computed when it is loaded
  const pp = sum(byFile(/readers\/people\.js/));
  // ---- the watches: the 1912 watch and five drawn nights, each through its encounter and on for an hour (motion steps
  // every step; the encounter makes its openings at the touch)
  const nights = [1912, 3, 7, 9, 16, 21];
  calls.forEach((c, who) => { if (!/people\.js/.test(who)) calls.delete(who); });
  for (const seed of nights) {
    const sim = N.create(C.buildShip(), N.spec(seed), seed === 1912 ? { auto: true, readers: false } : { readers: false });
    N.run(sim);
    const t1 = sim.t + 3600;
    while (!N.over(sim) && sim.t < t1) N.step(sim);
  }
  const enc = sum(byFile(/core\/encounter\.js/)), mo = sum(byFile(/core\/motion\.js/));
  row('MUST', 'the encounter (core/encounter.js): every call without the ship\'s hull, on the 1912 watch and five drawn nights (' + nights.slice(1).join(', ') + '), reads at or below ' + Z0 + ' m, where her ends change nothing',
    enc.n + ' calls (' + enc.lines.join(', ') + '); the highest at z ' + f(enc.maxZ, 2) + ' m; ' + enc.differ + ' differ', 'all at or below ' + Z0 + ' m; none differ', enc.n > 0 && enc.differ === 0 && enc.maxZ <= Z0);
  row('MUST', 'motion (core/motion.js, seaHeads\' normals at the hull\'s openings): no call without the ship\'s hull on the same watches (patch A, the mainline\'s yes: it reads sim.ship.hull)',
    mo.n + ' calls without it' + (mo.n ? ' (' + mo.lines.join(', ') + ')' : ''), 'none', mo.n === 0);
  // a hole made by hand at the height of a port forward (the page's hole tool can make one anywhere): its normal, from the
  // ship's hull with her ends (patch A): the one thing patch A moves
  {
    const sim = N.create(C.buildShip(), N.spec(1912), { auto: true, readers: false });
    N.run(sim);
    const x = 95, z = C.deckZ('E', x) + 1.1;
    C.addOpening(sim, { x, y: orig(x, z, HULL) + 0.02, z, area: 0.1, kind: 'breach', label: 'by hand' });
    for (let i = 0; i < 4; i++) N.step(sim);
    const o = sim.openings.find(q => q.label === 'by hand');
    const hx0 = orig(x + 0.5, z) - orig(x - 0.5, z), hx1 = orig(x + 0.5, z, HULL) - orig(x - 0.5, z, HULL), nn = Math.sqrt(hx1 * hx1 + 1);
    const ok = !!o && o.nx !== undefined && Math.abs(o.nx - (-hx1 / nn)) <= 1e-12 && Math.abs(o.ny - (-1 / nn)) <= 1e-12;
    row('MUST', '  ... a hole made by hand above ' + Z0 + ' m forward (x ' + x + ', z ' + f(z, 2) + ', E deck\'s ports): its outward normal from the ship\'s hull with her ends',
      o && o.nx !== undefined ? 'nx ' + f(o.nx, 6) + ', ny ' + f(o.ny, 6) + '; the side\'s slope ' + f(hx1, 4) + ' with her ends, ' + f(hx0, 4) + ' without: ' + f(Math.abs(Math.atan(hx1) - Math.atan(hx0)) * 180 / Math.PI, 2) + ' degrees apart' : 'no normal', 'the hull\'s with her ends, to 1e-12', ok);
  }
  // ---- every preset's build (the scenarios' openings)
  calls.forEach((c, who) => { if (/scenarios\.js/.test(who)) calls.delete(who); });
  const per = [];
  for (const key of Object.keys(SC.PRESETS)) {
    const before = sum(byFile(/core\/scenarios\.js/));
    SC.PRESETS[key].build({});
    const after = sum(byFile(/core\/scenarios\.js/));
    per.push({ key, n: after.n - before.n, differ: after.differ - before.differ, maxZ: after.maxZ });
  }
  const scn = sum(byFile(/core\/scenarios\.js/)), bad = per.filter(p => p.differ > 0);
  row('MUST', 'the presets\' builds (core/scenarios.js): every call without the ship\'s hull reads at or below ' + Z0 + ' m, but Britannic\'s open ports (named in the CHECK below)',
    per.map(p => p.key + ' ' + p.n + (p.differ ? ' (' + p.differ + ' differ)' : '')).join(', ') + '; the highest at z ' + f(scn.maxZ, 2) + ' m', 'none differ but britannic\'s', per.every(p => p.key === 'britannic' || p.differ === 0));
  row('CHECK', '  ... Britannic\'s open ports, 1.1 m over F and E deck (z up to ' + f(per.find(p => p.key === 'britannic').maxZ, 2) + ' m): placed on the hull without her ends',
    bad.length ? bad.map(p => p.key + ': ' + p.differ + ' of ' + p.n + ' differ').join('; ') + '; the most ' + f(scn.worst, 3) + ' m (' + scn.at + ')' : 'none differ', 'a named stand-in until the next refit (patch B: the mainline, 2026-11-23, "NOT NOW": it moves a validation case the history match screens on)', bad.length === 0);
  // ---- the people reader's stations at the Boat deck (G24's mend: the default ship's hull, built when first asked)
  {
    const ST = BP.STATION, worst = ST.reduce((m, s) => Math.max(m, Math.abs(s.edge - orig(s.x, s.z))), 0);
    const ok = ST.length === BP.BOATS.length && ST.every(s => s.edge === orig(s.x, s.z, HULL) && Math.abs(s.y) === s.edge);
    const pp2 = sum(byFile(/readers\/people\.js/));
    row('MUST', 'the people reader\'s boat stations (core/readers/people.js STATION): the Boat deck\'s edge at each davit on the ship\'s own hull with her ends, and no call without it',
      ST.length + ' stations on her hull with her ends (her ends move ' + ST.filter(s => s.edge !== orig(s.x, s.z)).length + ' of them, by ' + f(worst, 3) + ' m at most); ' + pp2.n + ' calls without the hull', 'every one; none', ok && pp2.n === 0);
  }
  // ---- core.js's own calls (its local halfBreadth, unwrapped): the pockets' capacities, by their heights
  {
    const sim = C.createSim(C.buildShip(), {}, SC.PRESETS.titanic.build({}));
    const tops = (sim.pockets || []).map(k => ({ name: k.name, z1: k.z1, x0: k.x0, x1: k.x1 }));
    const high = tops.filter(t => t.z1 > Z0);
    row('MUST', 'core.js\'s own calls without a hull (bunkerPocket, peakPocket): each pocket from its floor to its top, all at or below ' + Z0 + ' m',
      tops.map(t => t.name.split(' (')[0] + ' to z ' + f(t.z1, 2) + ' m').join('; '), 'at or below ' + Z0 + ' m', tops.length > 0 && high.length === 0);
  }
  // anything else seen
  const known = /encounter\.js|motion\.js|scenarios\.js|people\.js/;
  const other = [...calls.entries()].filter(([who]) => !known.test(who));
  row('MUST', 'no other caller in core/ calls C.halfBreadth without the ship\'s hull in these runs', other.length ? other.map(([who, c]) => who + ' (' + c.n + ')').join(', ') : 'none', 'none', other.length === 0);
} catch (e) {
  row('MUST', 'the suite ran', String(e && e.stack || e).split('\n').slice(0, 2).join(' '), 'no error', false);
}
for (const [kind, what, value, ref, ok] of rows) console.log((ok ? 'PASS ' : (kind === 'MUST' ? 'FAIL ' : 'CHECK ')) + kind.padEnd(6) + what.padEnd(100) + ' ' + String(value) + '   [' + ref + ']');
const musts = rows.filter(r => r[0] === 'MUST').length;
console.log(fails ? '\nFAIL: ' + fails + ' MUST row(s)' : '\nPASS: all ' + musts + ' MUST rows' + (checks ? '; ' + checks + ' CHECK row(s) off' : ''));
process.exit(fails ? 1 : 0);
