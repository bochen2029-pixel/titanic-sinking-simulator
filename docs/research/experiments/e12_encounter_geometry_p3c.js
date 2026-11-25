// e12: the 1912 encounter's geometry searched again under P3c's contact law (stations every 0.125 m, the contact ramping in
// with the overlap); the method is e9's, which follows.
// The geometry is not a record: P3 fitted where the ice was (how far ahead of her stem when the helm went over, how far
// it reached to port of her track) to make the damage the record describes. With the quicker helm-alone turn of M2 the
// P3 point (220 m ahead, 32 m to port) tears from hold 3 (x 86) instead of the stem. Same score as e5: the tears on the
// starboard side from the forepeak (x 124) to boiler room 5 (x 53.2), nothing to port; then the split against Hackett and
// Bedford's (4 13 21 24 32 6 0 %). Physics as in core/encounter.js; the night's orders as reconstructed (port-around at
// the touch). The area constant is refitted afterwards at the chosen point (tools/calibrate_encounter.js).
//   node docs/research/experiments/e9_encounter_geometry_m2.js [repo root]      (a few minutes)
// Output of 2026-11-16: results_2026-11-16/e12_encounter_geometry_p3c.txt
const path = require('path');
const root = process.argv[2] || path.join(__dirname, '..', '..', '..');
const C = require(path.join(root, 'core', 'core.js'));
const E = require(path.join(root, 'core', 'encounter.js'));
const R = require(path.join(root, 'tools', 'encounter_run.js'));
const ship = C.buildShip();
const HB = [4, 13, 21, 24, 32, 6, 0];
function split(s) { const tot = s.stbd.area + s.port.area; return [...Array(16).keys()].map(k => (tot > 0 ? 100 * s.stbd.zone[k] / tot : 0)); }
function splitErr(sp) { let e = 0; for (let k = 0; k < 16; k++) e += Math.abs(sp[k] - (k < 7 ? HB[k] : 0)); return e; }
const res = [], t0 = Date.now();
for (let ahead = 150; ahead <= 300; ahead += 10) for (let port = 18; port <= 40; port += 2) {
  const s = E.summary(R.encounter({ ahead, port, portAround: 0 }, ship));
  if (!s.stbd.tears || s.port.tears || s.bow.crush > 0) continue;
  const ext = Math.abs(s.stbd.tearFrom - 124) + Math.abs(s.stbd.tearTo - 53.2), sp = split(s), se = splitErr(sp);
  res.push({ ext, se, score: ext + 0.5 * se, ahead, port, s, sp });
}
res.sort((a, b) => a.score - b.score);
console.log('e12: runs kept', res.length, 'in', ((Date.now() - t0) / 1000).toFixed(0), 's (handling ' + JSON.stringify(require(path.join(root, 'core', 'motion.js')).SHIP.fit) + ')');
console.log('best twelve (score = extent error m + 0.5 x split error points):');
for (const r of res.slice(0, 12)) console.log(' ', r.score.toFixed(0).padStart(4), '| ahead', r.ahead, 'port', r.port, '| tears x', r.s.stbd.tearFrom, '..', r.s.stbd.tearTo, '(' + r.s.stbd.tears + '), dents', r.s.stbd.dents, '| area', (r.s.stbd.area).toFixed(3), 'm2 | split', r.sp.slice(0, 7).map(v => v.toFixed(0)).join('/'), '+aft', (100 - r.sp.slice(0, 7).reduce((a, b) => a + b, 0)).toFixed(0), '| split error', r.se.toFixed(0));
const p3 = res.find(r => r.ahead === 220 && r.port === 32);
console.log('the P3 point (220, 32):', p3 ? 'tears x ' + p3.s.stbd.tearFrom + '..' + p3.s.stbd.tearTo + ', score ' + p3.score.toFixed(0) : 'not kept');

// Phase 2: refine around the best points, adding the two other records P3 honoured: the ice sighted at about 500 yards
// (457 m; British Report), and the impact 20-25 s after the helm order (Halpern). The sighting follows from the point as
// core/night.js historic() builds the night (the order 20.5 s after the bells at 22.5 knots).
const Mo = require(path.join(root, 'core', 'motion.js'));
const u = Mo.create({ knots: 22.5 }).u, RI = E.ICE.R;
const sightingOf = (ahead, port) => { const reach = ahead + RI + u * (20.5 + 0.125), off = port - RI; return Math.sqrt(reach * reach + off * off) - RI; };
const fine = [];
for (const c of res.slice(0, 4)) for (let ahead = c.ahead - 8; ahead <= c.ahead + 8; ahead += 2) for (let port = c.port - 2; port <= c.port + 2; port += 1) {
  if (fine.some(r => r.ahead === ahead && r.port === port)) continue;
  const sim = R.encounter({ ahead, port, portAround: 0 }, ship), s = E.summary(sim);
  if (!s.stbd.tears || s.port.tears || s.bow.crush > 0) continue;
  const ext = Math.abs(s.stbd.tearFrom - 124) + Math.abs(s.stbd.tearTo - 53.2), sp = split(s), se = splitErr(sp);
  const sight = sightingOf(ahead, port), tHit = sim.enc.tFirst;
  const score2 = ext + 0.5 * se + Math.abs(sight - 457.2) / 5 + Math.max(0, Math.abs(tHit - 22.5) - 2.5);
  fine.push({ ahead, port, s, sp, ext, se, sight, tHit, score2 });
}
fine.sort((a, b) => a.score2 - b.score2);
console.log('\nphase 2, best eight (score = extent m + 0.5 x split points + sighting error m / 5 + seconds outside 20-25 s to impact):');
for (const r of fine.slice(0, 8)) console.log(' ', r.score2.toFixed(1).padStart(5), '| ahead', r.ahead, 'port', r.port, '| tears x', r.s.stbd.tearFrom, '..', r.s.stbd.tearTo, '| split', r.sp.slice(0, 7).map(v => v.toFixed(0)).join('/'), '(error ' + r.se.toFixed(0) + ') | sighted at', r.sight.toFixed(0), 'm | impact', r.tHit.toFixed(1), 's after the order');
