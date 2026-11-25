// The encounter's one area constant: ICE.alpha, m2 of opening per metre of hull per metre of dent beyond the tearing
// dent. It is fitted so that the reconstructed 1912 encounter opens the flooding core's calibrated 0.7506 m2.
// A fixed point: the holes change her mass and motion a little during the contact, and so the damage.
//   node tools/calibrate_encounter.js        prints the constant to paste into core/encounter.js
const C = require('../core/core.js');
const E = require('../core/encounter.js');
const R = require('./encounter_run.js');
const SC = require('../core/scenarios.js');
const ship = C.buildShip(), G1912 = Object.assign({ portAround: 0 }, require('../core/night.js').GEOM_1912), target = SC.CALIBRATED_AREA;
let alpha = E.ICE.alpha;
for (let it = 0; it < 40; it++) {
  const s = E.summary(R.encounter(Object.assign({}, G1912, { ice: { alpha } }), ship)), tot = s.stbd.area + s.port.area;
  console.log('alpha ' + alpha + '  ->  ' + tot.toFixed(9) + ' m2  (stbd x ' + s.stbd.tearFrom + '..' + s.stbd.tearTo + ', port tears ' + s.port.tears + ', bow ' + s.bow.crush.toFixed(3) + ' m)');
  if (Math.abs(tot - target) < 1e-10) break;
  alpha *= target / tot;
}
console.log('ICE.alpha = ' + alpha);
