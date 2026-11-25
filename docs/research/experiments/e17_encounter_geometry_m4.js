// e17: the 1912 encounter's geometry searched again after M3 and M4 (the resistance's shape, the astern law and the
// trial's slow reversal moved the handling's fit: uRk, cd, kap, fA), with BACKLOG P3e's test built into the choice.
// At e14's point (256 m ahead, 46 m to port) the refitted handling still tears the starboard side from the stem into
// boiler room 5, a little further aft, and the core sinks her a few minutes early; a first pass of this search
// (preliminary handling) found points in the timeline only at the edge of a stem strike, where a metre or a fraction of a
// degree of course changes the damage by 5 to 15 %. So the choice is made in four steps:
//   1. a grid of where the ice was, e14's score (the tears' extent from the forepeak, x 124, to boiler room 5, x 53.2, in
//      metres; half the split's error against Hackett and Bedford's in points; the sighting's distance from 457 m over 5;
//      the seconds outside 20-25 s from the order to the impact), starboard tears only, no stem strike;
//   2. refined by 1 m and 0.5 m around the best three;
//   3. for the best twenty: the same night on the courses between the outline's nodes (266.37, 267.13, 311.61, as
//      tools/night_tests.js checks it) and the ice a metre or half a metre away: the largest change of the opened area,
//      and whether any of them stops being a starboard tear;
//   4. all twenty sunk by the core at the calibrated area (157-160 min after the touch); then the choice: in the
//      timeline, the courses within 2 % (P3e's test) and the best score if any is; else, of those in the timeline, the
//      least score plus 5 for each point of the courses' spread (a judgement: a point of spread weighs as 5 m of tear).
//   node docs/research/experiments/e17_encounter_geometry_m4.js [repo root] [--write] [--ice '{...}'] [--out name]
//   (about half an hour). --ice: overrides of core/encounter.js ICE for the whole search (P3b: '{"tearAlong":[...]}');
//   --out: the results file's name in place of e17_encounter_geometry_m4.txt
// Output of 2026-11-17: results_2026-11-17/e17_encounter_geometry_m4.txt
const fs = require('fs'), path = require('path');
const root = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : path.join(__dirname, '..', '..', '..');
const C = require(path.join(root, 'core', 'core.js'));
const E = require(path.join(root, 'core', 'encounter.js'));
const Mo = require(path.join(root, 'core', 'motion.js'));
const N = require(path.join(root, 'core', 'night.js'));
const R = require(path.join(root, 'tools', 'encounter_run.js'));
const SC = require(path.join(root, 'core', 'scenarios.js'));
const ship = C.buildShip(), out = [], log = (s) => { out.push(s); console.log(s); };
const ai = process.argv.indexOf('--ice'), ao = process.argv.indexOf('--out');
if (ai > 0) Object.assign(E.ICE, JSON.parse(process.argv[ai + 1]));      // every encounter of the search, the watch's too
const HB = [4, 13, 21, 24, 32, 6, 0], G0 = Object.assign({}, N.GEOM_1912);
const u = Mo.create({ knots: 22.5 }).u, RI = E.ICE.R;
const sightingOf = (ahead, port) => { const reach = ahead + RI + u * (20.5 + 0.125), off = RI - port; return Math.sqrt(reach * reach + off * off) - RI; };
const split = (s) => { const tot = s.stbd.area + s.port.area; return [...Array(16).keys()].map(k => (tot > 0 ? 100 * s.stbd.zone[k] / tot : 0)); };
const splitErr = (sp) => { let e = 0; for (let k = 0; k < 16; k++) e += Math.abs(sp[k] - (k < 7 ? HB[k] : 0)); return e; };
const memo = new Map();
function score(ahead, port) {
  const key = ahead + ',' + port; if (memo.has(key)) return memo.get(key);
  const sim = R.encounter({ ahead, port, portAround: 0 }, ship), s = E.summary(sim);
  let r = null;
  if (s.stbd.tears && !s.port.tears && !(s.bow.crush > 0)) {
    const ext = Math.abs(s.stbd.tearFrom - 124) + Math.abs(s.stbd.tearTo - 53.2), sp = split(s), se = splitErr(sp), sight = sightingOf(ahead, port), tHit = sim.enc.tFirst;
    r = { ahead, port, s, sp, se, sight, tHit, area: s.stbd.area + s.port.area, score: ext + 0.5 * se + Math.abs(sight - 457.2) / 5 + Math.max(0, Math.abs(tHit - 22.5) - 2.5) };
  }
  memo.set(key, r); return r;
}
// the 1912 watch itself (auto orders) at this geometry on a course: the opened area, or null if not a starboard tear
function watch(ahead, port, heading) {
  N.GEOM_1912.ahead = ahead; N.GEOM_1912.port = port;
  try {
    const sp = N.spec(1912); if (heading !== undefined) sp.heading = heading;
    const s = N.summary(N.run(N.create(ship, sp, { auto: true, plant: false })));
    return s.stbd.tears && !s.port.tears && !(s.bow.crush > 0) ? s.area : null;
  } finally { N.GEOM_1912.ahead = G0.ahead; N.GEOM_1912.port = G0.port; }
}
function robust(r) {
  const base = r.area, ph = [266.37, 267.13, 311.61].map(h => watch(r.ahead, r.port, h)), nb = [[-1, 0], [1, 0], [0, -0.5], [0, 0.5]].map(([da, dp]) => score(r.ahead + da, r.port + dp));
  const dev = (a) => (a === null ? Infinity : Math.abs(a / base - 1));
  return { phase: Math.max(...ph.map(dev)), phaseAreas: ph, near: Math.max(...nb.map(x => dev(x && x.area))), nearAreas: nb.map(x => (x ? x.area : null)) };
}
function sink(r) {
  const alpha = E.ICE.alpha * SC.CALIBRATED_AREA / r.area, sim = R.encounter({ ahead: r.ahead, port: r.port, portAround: 0, ice: { alpha } }, ship);
  R.sinkOn(sim, 8 * 3600);
  return { alpha, min: sim.foundered ? (sim.t - sim.enc.tFirst) / 60 : null };
}
const pc = (x) => (isFinite(x) ? (100 * x).toFixed(1) + ' %' : 'flips');
const line = (r) => r.score.toFixed(1).padStart(5) + ' | ahead ' + r.ahead + ' port ' + r.port + ' | tears x ' + r.s.stbd.tearFrom + '..' + r.s.stbd.tearTo + ' | split ' + r.sp.slice(0, 7).map(v => v.toFixed(0)).join('/') + ' (error ' + r.se.toFixed(0) + ') | sighted ' + r.sight.toFixed(0) + ' m, impact ' + r.tHit.toFixed(1) + ' s';

const t0 = Date.now(), T = () => ((Date.now() - t0) / 1000).toFixed(0) + ' s';
log('e17: handling ' + JSON.stringify(Mo.SHIP.fit) + ', centre Cdw ' + Mo.SHIP.centre.Cdw + '; ICE alpha ' + E.ICE.alpha + ' (as committed when run)' + (ai > 0 ? '; ICE overrides ' + process.argv[ai + 1] : ''));
const coarse = [];
for (let ahead = 236; ahead <= 276; ahead += 4) for (let port = 38; port <= 52; port += 2) { const r = score(ahead, port); if (r) coarse.push(r); }
coarse.sort((a, b) => a.score - b.score);
log('\n1. GRID ahead 236-276 by 4, port 38-52 by 2: ' + coarse.length + ' starboard tears (' + T() + '); best eight:');
for (const r of coarse.slice(0, 8)) log('  ' + line(r));

const fine = new Map();
for (const c of coarse.slice(0, 3)) for (let ahead = c.ahead - 4; ahead <= c.ahead + 4; ahead += 1) for (let port = c.port - 2; port <= c.port + 2; port += 0.5) { const r = score(ahead, port); if (r) fine.set(ahead + ',' + port, r); }
const cand = [...fine.values()].sort((a, b) => a.score - b.score);
log('\n2. REFINED around the best three by 1 m and 0.5 m: ' + cand.length + ' starboard tears (' + T() + '); best ten:');
for (const r of cand.slice(0, 10)) log('  ' + line(r));

log('\n3. THE BEST TWENTY: the same night on the courses between the outline\'s nodes, and the ice a metre (ahead) or half a metre (port) away');
const top = cand.slice(0, 20).map(r => Object.assign(r, robust(r)));
for (const r of top) log('  ahead ' + String(r.ahead).padEnd(4) + ' port ' + String(r.port).padEnd(5) + ' score ' + r.score.toFixed(1).padStart(5) + ' | courses ' + pc(r.phase).padStart(7) + ' | a metre away ' + pc(r.near).padStart(7) + ' | areas ' + [r.area, ...r.phaseAreas].map(a => (a === null ? '--' : a.toFixed(4))).join(' '));
log('  (' + T() + ')');

log('\n4. ALL TWENTY SUNK at the calibrated ' + SC.CALIBRATED_AREA + ' m2, each with its own area constant (record 157-160 min after the touch)');
for (const r of top) { Object.assign(r, sink(r)); log('  ahead ' + String(r.ahead).padEnd(4) + ' port ' + String(r.port).padEnd(5) + ' (score ' + r.score.toFixed(1).padStart(4) + ', courses ' + pc(r.phase).padStart(6) + '): ' + (r.min === null ? 'afloat at 8 h' : 'founders ' + r.min.toFixed(1) + ' min') + ' (alpha ' + r.alpha.toFixed(5) + ')'); }
const inTime = top.filter(r => r.min !== null && r.min >= 157 && r.min <= 160), steady = inTime.filter(r => r.phase < 0.02).sort((a, b) => a.score - b.score);
const pick = steady.length ? steady[0] : inTime.slice().sort((a, b) => (a.score + 500 * a.phase) - (b.score + 500 * b.phase))[0];
if (!pick) log('\nNO CANDIDATE in the timeline');
else log('\n' + (steady.length ? 'CHOSEN (in the timeline, courses within 2 %, best score)' : 'CHOSEN (none in the timeline is within 2 % across courses; least score + 5 x spread in points)') + ': ahead ' + pick.ahead + ' port ' + pick.port +
  ' (score ' + pick.score.toFixed(1) + ', courses within ' + pc(pick.phase) + ', a metre away ' + pc(pick.near) + '), founders ' + pick.min.toFixed(1) + ' min, alpha about ' + pick.alpha.toFixed(5) + '; in the timeline: ' + inTime.map(r => r.ahead + '/' + r.port + ' ' + (r.score + 500 * r.phase).toFixed(1)).join(', '));
log('\n(' + T() + '; ' + new Date().toISOString() + ')');
if (process.argv.includes('--write')) {
  const dir = path.join(__dirname, 'results_2026-11-17');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, ao > 0 ? process.argv[ao + 1] : 'e17_encounter_geometry_m4.txt'), out.join('\n') + '\n');
}
