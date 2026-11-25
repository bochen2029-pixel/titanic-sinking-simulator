// e13: under P3c's contact law, the 1912 encounter's physics bets searched again jointly with its geometry, as e5 did
// for P3: the side shell's resistance q, the ice's pressure p0 at 1 m2, and the overlap over which a station's contact
// ramps in (aRamp), with where the ice was (ahead, port). Score as e12's second phase: the tears' extent from the forepeak
// (x 124) to boiler room 5 (x 53.2) in metres, half the split's error against Hackett and Bedford's in points, the
// sighting's distance from 457 m over 5, and the seconds outside 20-25 s from the order to the impact. Starboard tears
// only, no stem strike. Then the best few are sunk by the core (the 1912 timeline: 157-160 min).
//   node docs/research/experiments/e13_encounter_joint_p3c.js [repo root]      (about 20 minutes)
// Output of 2026-11-16: results_2026-11-16/e13_encounter_joint_p3c.txt
const path = require('path');
const root = process.argv[2] || path.join(__dirname, '..', '..', '..');
const C = require(path.join(root, 'core', 'core.js'));
const E = require(path.join(root, 'core', 'encounter.js'));
const Mo = require(path.join(root, 'core', 'motion.js'));
const R = require(path.join(root, 'tools', 'encounter_run.js'));
const SC = require(path.join(root, 'core', 'scenarios.js'));
const ship = C.buildShip();
const HB = [4, 13, 21, 24, 32, 6, 0];
const u = Mo.create({ knots: 22.5 }).u, RI = E.ICE.R;
const sightingOf = (ahead, port) => { const reach = ahead + RI + u * (20.5 + 0.125), off = RI - port; return Math.sqrt(reach * reach + off * off) - RI; };
function split(s) { const tot = s.stbd.area + s.port.area; return [...Array(16).keys()].map(k => (tot > 0 ? 100 * s.stbd.zone[k] / tot : 0)); }
function splitErr(sp) { let e = 0; for (let k = 0; k < 16; k++) e += Math.abs(sp[k] - (k < 7 ? HB[k] : 0)); return e; }
const res = [], t0 = Date.now();
for (const q of [6e6, 12e6, 24e6]) for (const p0 of [3e6, 6e6, 12e6]) for (const aRamp of [0.03, 0.1]) {
  for (let ahead = 190; ahead <= 240; ahead += 10) for (let port = 24; port <= 40; port += 4) {
    const ice = { q, p0, aRamp };
    const sim = R.encounter({ ahead, port, portAround: 0, ice }, ship), s = E.summary(sim);
    if (!s.stbd.tears || s.port.tears || s.bow.crush > 0) continue;
    const ext = Math.abs(s.stbd.tearFrom - 124) + Math.abs(s.stbd.tearTo - 53.2), sp = split(s), se = splitErr(sp);
    const sight = sightingOf(ahead, port), tHit = sim.enc.tFirst;
    const score = ext + 0.5 * se + Math.abs(sight - 457.2) / 5 + Math.max(0, Math.abs(tHit - 22.5) - 2.5);
    res.push({ score, ext, se, sp, ice, ahead, port, s, sight, tHit });
  }
}
res.sort((a, b) => a.score - b.score);
console.log('e13: runs kept ' + res.length + ' in ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s; best fifteen:');
for (const r of res.slice(0, 15)) console.log('  ' + r.score.toFixed(1).padStart(5) + ' | q ' + r.ice.q / 1e6 + ' p0 ' + r.ice.p0 / 1e6 + ' aRamp ' + r.ice.aRamp + ' | ahead ' + r.ahead + ' port ' + r.port + ' | tears x ' + r.s.stbd.tearFrom + '..' + r.s.stbd.tearTo + ' | split ' + r.sp.slice(0, 7).map(v => v.toFixed(0)).join('/') + ' (error ' + r.se.toFixed(0) + ') | sighted ' + r.sight.toFixed(0) + ' m, impact ' + r.tHit.toFixed(1) + ' s');
// the best five, sunk: the area constant set so that each opens the calibrated 0.7506 m2, then the core alone
console.log('\nthe best five, each scaled to the calibrated ' + SC.CALIBRATED_AREA + ' m2 and sunk by the core:');
for (const r of res.slice(0, 5)) {
  const tot = r.s.stbd.area + r.s.port.area, alpha = E.ICE.alpha * SC.CALIBRATED_AREA / tot;
  const sim = R.encounter({ ahead: r.ahead, port: r.port, portAround: 0, ice: Object.assign({}, r.ice, { alpha }) }, ship);
  R.sinkOn(sim, 8 * 3600);
  console.log('  q ' + r.ice.q / 1e6 + ' p0 ' + r.ice.p0 / 1e6 + ' aRamp ' + r.ice.aRamp + ' ahead ' + r.ahead + ' port ' + r.port + ': ' + (sim.foundered ? 'founders ' + ((sim.t - sim.enc.tFirst) / 60).toFixed(1) + ' min after the touch' : 'afloat at 8 h') + ' (alpha ' + alpha.toFixed(4) + ')');
}
