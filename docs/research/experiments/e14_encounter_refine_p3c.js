// e14: e13's best point (q 24 MPa, p0 6 MPa, aRamp 0.1 m; ice 240 m ahead, reaching 40 m to port) lay at the corner of
// its grid; the geometry refined around it and beyond, the physics held, with e13's score; the best three sunk by the core
// at the calibrated area. Then the chosen point's smoothness: a metre either way must change the damage a little.
//   node docs/research/experiments/e14_encounter_refine_p3c.js [repo root]      (a few minutes)
// Output of 2026-11-16: results_2026-11-16/e14_encounter_refine_p3c.txt
const path = require('path');
const root = process.argv[2] || path.join(__dirname, '..', '..', '..');
const C = require(path.join(root, 'core', 'core.js'));
const E = require(path.join(root, 'core', 'encounter.js'));
const Mo = require(path.join(root, 'core', 'motion.js'));
const R = require(path.join(root, 'tools', 'encounter_run.js'));
const SC = require(path.join(root, 'core', 'scenarios.js'));
const ship = C.buildShip();
const HB = [4, 13, 21, 24, 32, 6, 0], ICE = { q: 24e6, p0: 6e6, aRamp: 0.1 };
const u = Mo.create({ knots: 22.5 }).u, RI = E.ICE.R;
const sightingOf = (ahead, port) => { const reach = ahead + RI + u * (20.5 + 0.125), off = RI - port; return Math.sqrt(reach * reach + off * off) - RI; };
const split = (s) => { const tot = s.stbd.area + s.port.area; return [...Array(16).keys()].map(k => (tot > 0 ? 100 * s.stbd.zone[k] / tot : 0)); };
const splitErr = (sp) => { let e = 0; for (let k = 0; k < 16; k++) e += Math.abs(sp[k] - (k < 7 ? HB[k] : 0)); return e; };
function score(ahead, port) {
  const sim = R.encounter({ ahead, port, portAround: 0, ice: ICE }, ship), s = E.summary(sim);
  if (!s.stbd.tears || s.port.tears || s.bow.crush > 0) return null;
  const ext = Math.abs(s.stbd.tearFrom - 124) + Math.abs(s.stbd.tearTo - 53.2), sp = split(s), se = splitErr(sp), sight = sightingOf(ahead, port), tHit = sim.enc.tFirst;
  return { ahead, port, s, sp, se, sight, tHit, area: s.stbd.area + s.port.area, score: ext + 0.5 * se + Math.abs(sight - 457.2) / 5 + Math.max(0, Math.abs(tHit - 22.5) - 2.5) };
}
const res = [];
for (let ahead = 232; ahead <= 264; ahead += 4) for (let port = 36; port <= 48; port += 2) { const r = score(ahead, port); if (r) res.push(r); }
res.sort((a, b) => a.score - b.score);
console.log('e14: q 24 MPa, p0 6 MPa, aRamp 0.1 m; geometry refined (' + res.length + ' kept); best eight:');
for (const r of res.slice(0, 8)) console.log('  ' + r.score.toFixed(1).padStart(5) + ' | ahead ' + r.ahead + ' port ' + r.port + ' | tears x ' + r.s.stbd.tearFrom + '..' + r.s.stbd.tearTo + ' | split ' + r.sp.slice(0, 7).map(v => v.toFixed(0)).join('/') + ' (error ' + r.se.toFixed(0) + ') | sighted ' + r.sight.toFixed(0) + ' m, impact ' + r.tHit.toFixed(1) + ' s');
console.log('\nthe best three, scaled to the calibrated ' + SC.CALIBRATED_AREA + ' m2 and sunk:');
for (const r of res.slice(0, 3)) {
  const alpha = E.ICE.alpha * SC.CALIBRATED_AREA / r.area, sim = R.encounter({ ahead: r.ahead, port: r.port, portAround: 0, ice: Object.assign({}, ICE, { alpha }) }, ship);
  R.sinkOn(sim, 8 * 3600);
  console.log('  ahead ' + r.ahead + ' port ' + r.port + ': ' + (sim.foundered ? 'founders ' + ((sim.t - sim.enc.tFirst) / 60).toFixed(1) + ' min after the touch' : 'afloat at 8 h') + ' (alpha ' + alpha.toFixed(5) + ')');
}
const b = res[0];
console.log('\nsmoothness at the best point (' + b.ahead + ', ' + b.port + '): the opened area and its split a little either way');
for (const [da, dp] of [[0, 0], [-1, 0], [1, 0], [0, -0.5], [0, 0.5], [-2, 0], [2, 0]]) { const r = score(b.ahead + da, b.port + dp); console.log('  ahead ' + (b.ahead + da) + ' port ' + (b.port + dp) + ': ' + (r ? r.area.toFixed(4) + ' m2, split ' + r.sp.slice(0, 7).map(v => v.toFixed(0)).join('/') : 'not a starboard tear')); }
