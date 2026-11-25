// e82 (G6): the 1912 encounter's geometry searched again with boiler room 5's damage held where the record has it
// (docs/research/RESEARCH_br5_damage_extent_G6_v1_2026-11-20.md: the Report and Barrett put it in the starboard forward
// bunker, 2 ft abaft the bulkhead between boiler rooms 6 and 5; nothing in the stokehold's own side; boiler room 4
// undamaged). e17's method and score (docs/research/experiments/e17_encounter_geometry_m4.js), with G6's MUST rows:
//   - the starboard tears end no further aft than the bunker's after end, x 51.5 m (9 ft abaft bulkhead E, x 54.25);
//   - the split's error against Hackett and Bedford's no worse than the present point's;
//   - the sighting no further from 457 m than the present point's;
//   - the impact 20 to 25 s after the order;
//   and, as e17: starboard tears only, no stem strike, the courses' spread, the founder at the calibrated area.
//   node docs/research/experiments/e82_g6_geometry.js [--grid A0,A1,dA,P0,P1,dP] [--probe] [--write]
// --probe: the present point's terms and one run's cost, then stop.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..', '..', '..');
const C = require(path.join(root, 'core', 'core.js'));
const E = require(path.join(root, 'core', 'encounter.js'));
const Mo = require(path.join(root, 'core', 'motion.js'));
const N = require(path.join(root, 'core', 'night.js'));
const R = require(path.join(root, 'tools', 'encounter_run.js'));
const SC = require(path.join(root, 'core', 'scenarios.js'));
const ship = C.buildShip(), out = [], log = (s) => { out.push(s); console.log(s); };
// --ice '{...}': overrides of core/encounter.js ICE for the whole search (as e17's), e.g. P3b's tearAlong
const ai = process.argv.indexOf('--ice');
if (ai > 0) Object.assign(E.ICE, JSON.parse(process.argv[ai + 1]));
const HB = [4, 13, 21, 24, 32, 6, 0], G0 = Object.assign({}, N.GEOM_1912), X_AFT = 51.5;
const u = Mo.create({ knots: 22.5 }).u, RI = E.ICE.R;
const sightingOf = (ahead, port) => { const reach = ahead + RI + u * (20.5 + 0.125), off = RI - port; return Math.sqrt(reach * reach + off * off) - RI; };
const split = (s) => { const tot = s.stbd.area + s.port.area; return [...Array(16).keys()].map(k => (tot > 0 ? 100 * s.stbd.zone[k] / tot : 0)); };
const splitErr = (sp) => { let e = 0; for (let k = 0; k < 16; k++) e += Math.abs(sp[k] - (k < 7 ? HB[k] : 0)); return e; };
const memo = new Map();
function terms(ahead, port) {
  const key = ahead + ',' + port; if (memo.has(key)) return memo.get(key);
  const sim = R.encounter({ ahead, port, portAround: 0 }, ship), s = E.summary(sim);
  let r = null;
  if (s.stbd.tears && !s.port.tears && !(s.bow.crush > 0)) {
    const sp = split(s), se = splitErr(sp), sight = sightingOf(ahead, port), tHit = sim.enc.tFirst;
    const ext = Math.abs(s.stbd.tearFrom - 124) + Math.abs(s.stbd.tearTo - 53.2);
    r = { ahead, port, s, sp, se, sight, tHit, area: s.stbd.area + s.port.area, aft: s.stbd.tearTo,
      score: ext + 0.5 * se + Math.abs(sight - 457.2) / 5 + Math.max(0, Math.abs(tHit - 22.5) - 2.5) };
  }
  memo.set(key, r); return r;
}
const line = (r) => r.score.toFixed(1).padStart(5) + ' | ahead ' + r.ahead + ' port ' + r.port + ' | tears x ' + r.s.stbd.tearFrom + '..' + r.s.stbd.tearTo + ' | split ' + r.sp.slice(0, 7).map(v => v.toFixed(0)).join('/') + ' (error ' + r.se.toFixed(0) + ') | sighted ' + r.sight.toFixed(0) + ' m, impact ' + r.tHit.toFixed(1) + ' s';
const t0 = Date.now(), T = () => ((Date.now() - t0) / 1000).toFixed(1) + ' s';

const now = terms(G0.ahead, G0.port);
log('e82 (G6): ICE alpha ' + E.ICE.alpha + ', R ' + RI + ' m' + (ai > 0 ? '; ICE overrides ' + process.argv[ai + 1] : '') + '; the present point, ahead ' + G0.ahead + ' port ' + G0.port + ':');
log('  ' + (now ? line(now) : 'NOT a starboard tear') + '  (' + T() + ' for its run)');
if (process.argv.includes('--probe')) process.exit(0);
// held where they are: no worse than the present point on each (its impact, 25.9 s, is itself 0.9 s outside 20 to 25)
const late = (t) => Math.max(0, Math.abs(t - 22.5) - 2.5);
const lim = { se: now.se + 0.5, sight: Math.abs(now.sight - 457.2) + 0.5, late: late(now.tHit) + 0.05 };
const ok = (r) => r && r.aft >= X_AFT && r.se <= lim.se && Math.abs(r.sight - 457.2) <= lim.sight && late(r.tHit) <= lim.late;
log('G6\'s MUST: the tears end at x ' + X_AFT + ' or forward; the split\'s error at most ' + lim.se.toFixed(1) + '; the sighting within ' + lim.sight.toFixed(1) + ' m of 457; the impact within ' + (2.5 + lim.late).toFixed(2) + ' s of 22.5 (20 to 25 s, and no later than the present point)');

const gi = process.argv.indexOf('--grid');
const [A0, A1, dA, P0, P1, dP] = gi > 0 ? process.argv[gi + 1].split(',').map(Number) : [236, 290, 2, 36, 60, 2];
const all = [];
for (let ahead = A0; ahead <= A1; ahead += dA) for (let port = P0; port <= P1; port += dP) { const r = terms(ahead, port); if (r) all.push(r); }
log('\n1. GRID ahead ' + A0 + '-' + A1 + ' by ' + dA + ', port ' + P0 + '-' + P1 + ' by ' + dP + ': ' + all.length + ' starboard tears (' + T() + ')');
const pass = all.filter(ok).sort((a, b) => a.score - b.score);
log('   meeting G6\'s MUST rows: ' + pass.length + (pass.length ? '; the best ten:' : ''));
for (const r of pass.slice(0, 10)) log('  ' + line(r));
const aftOk = all.filter(r => r.aft >= X_AFT).sort((a, b) => a.score - b.score);
log('   ending at x ' + X_AFT + ' or forward (whatever else): ' + aftOk.length + (aftOk.length ? '; the best eight by e17\'s score:' : ''));
for (const r of aftOk.slice(0, 8)) log('  ' + line(r));
log('\n(' + T() + '; ' + new Date().toISOString() + ')');
if (process.argv.includes('--write')) {
  const dir = path.join(__dirname, 'results_2026-11-20'); if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, 'e82_g6_geometry.txt'), out.join('\n') + '\n');
}
