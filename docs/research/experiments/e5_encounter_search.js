// E5: search the 1912 encounter jointly over geometry (where the ice was, when the helm went over, the port-around)
// and the three physics bets that moved the damage most in E4 (plating resistance q, ice pressure p0, berg mass).
// Score: the tears should run on the starboard side from the forepeak (x 124) to boiler room 5 (x 53.2), nothing to
// port; second, the opening split against Hackett-Bedford's (4 13 21 24 32 6 0 %).
// Usage: node e5_encounter_search.js <repo root>     (about 5 minutes)
const path = require('path');
const root = process.argv[2];
const C = require(path.join(root, 'core', 'core.js'));
const E = require(path.join(root, 'core', 'encounter.js'));
const R = require(path.join(root, 'tools', 'encounter_run.js'));
const ship = C.buildShip();
const HB = [4, 13, 21, 24, 32, 6, 0];
function split(s) { const tot = s.stbd.area + s.port.area; return [...Array(16).keys()].map(k => (tot > 0 ? 100 * s.stbd.zone[k] / tot : 0)); }
function splitErr(sp) { let e = 0; for (let k = 0; k < 16; k++) e += Math.abs(sp[k] - (k < 7 ? HB[k] : 0)); return e; }
const res = [];
const t0 = Date.now();
for (const q of [6e6, 12e6]) for (const p0 of [6e6, 12e6]) for (const mass of [1e8, 5e8]) {
  for (let ahead = 170; ahead <= 240; ahead += 10) for (let port = 20; port <= 36; port += 2) for (const pa of [0, 2]) {
    const ice = { q, p0, mass };
    const sim = R.encounter({ ahead, port, portAround: pa, ice }, ship), s = E.summary(sim);
    if (!s.stbd.tears || s.port.tears) continue;
    const ext = Math.abs(s.stbd.tearFrom - 124) + Math.abs(s.stbd.tearTo - 53.2), sp = split(s), se = splitErr(sp);
    res.push({ ext, se, score: ext + 0.5 * se, ice, ahead, port, pa, s, sp });
  }
}
res.sort((a, b) => a.score - b.score);
console.log('runs kept', res.length, 'in', ((Date.now() - t0) / 1000).toFixed(0), 's; best ten (score = extent error m + 0.5 x split error points):');
for (const r of res.slice(0, 10)) console.log(' ', r.score.toFixed(0).padStart(4), 'q', r.ice.q / 1e6, 'p0', r.ice.p0 / 1e6, 'mass', r.ice.mass / 1e9, '| ahead', r.ahead, 'port', r.port, 'pa', r.pa,
  '| tears x', r.s.stbd.tearFrom, '..', r.s.stbd.tearTo, '(' + r.s.stbd.tears + '), dents', r.s.stbd.dents, '| split', r.sp.slice(0, 7).map(v => v.toFixed(0)).join('/'), '+aft', (100 - r.sp.slice(0, 7).reduce((a, b) => a + b, 0)).toFixed(0));
const byExt = res.slice().sort((a, b) => a.ext - b.ext)[0];
console.log('best on extent alone:', 'q', byExt.ice.q / 1e6, 'p0', byExt.ice.p0 / 1e6, 'mass', byExt.ice.mass / 1e9, 'ahead', byExt.ahead, 'port', byExt.port, 'pa', byExt.pa, 'tears', byExt.s.stbd.tearFrom, '..', byExt.s.stbd.tearTo, 'split', byExt.sp.slice(0, 7).map(v => v.toFixed(0)).join('/'));
