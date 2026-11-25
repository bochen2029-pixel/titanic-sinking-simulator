// e20: R2, the screws' stations fore and aft, read from a plan with a scale. The plan: the side elevation of Olympic and
// Titanic printed in Engineering, vol. 91 (26 May 1911), "The White Star liner Titanic"; Wikimedia Commons, "File:Olympic
// and Titanic Side Plan 1911.png" (public domain), 3803 x 1052 px. Read on 2026-11-17 by viewing the image in the browser
// and scanning its pixels (nothing downloaded): below the waterline the plan draws the stern in dashed lines, with the
// rudder, the aperture in the stern frame with the centre screw in it, and the starboard wing screw forward of the frame,
// each screw as a hub with two blade outlines.
//   node docs/research/experiments/e20_screw_stations_side_plan_1911.js [--write]
// Output of 2026-11-17: results_2026-11-17/e20_screw_stations_side_plan_1911.txt
const fs = require('fs'), path = require('path');
const C = require('../../../core/core.js');
const Sys = require('../../../core/systems.js');
const out = [], log = (s) => { out.push(s); console.log(s); };
const FT = 0.3048, f = (v, n) => v.toFixed(n === undefined ? 2 : n);

// ---- the readings, in the image's pixels (x to the right = forward, y down)
// the scale bar ("Scale of feet", 0 to 400): ticks along its top edge and the ends of its blocks
const BAR = { 0: 1065.5, 20: 1145.5, 50: 1264, 70: 1344.5, 80: 1383.5, 90: 1423.5, 100: 1462, 300: 2242.5, 400: 2639.5 };
// (the block from 100 to 200 reads 383 px where the others read 397: a fault of the bar; its two clean 100-ft spans are used)
const PX_FT = ((BAR[100] - BAR[0]) + (BAR[400] - BAR[300])) / 200;
const AP = 242.5;          // the long dashed line under the counter: the rudder's fore edge on the rudder post (the stock), x
const STEM = 3621.5;       // the stem where the load waterline meets it
const KEEL = (x) => 979.2 + (369 - x) * 0.00647;   // the keel's lower edge (the scan leans 0.37 deg: 979 at x 390, 961 at x 3200)
const TANK_TOP = 958;      // the inner bottom over x 390 to 500, where the keel reads 978.75
const BULK = { P: 383, O: 612.5, N: 828.5 };       // the dashed watertight bulkheads, x
// the rudder's after edge, [y, x], and the height where its outline crosses the stock's line (its heel)
const RUDDER_EDGE = [[878, 180.5], [890, 181.5], [902, 183], [914, 187], [926, 193], [938, 201], [946, 207], [954, 215], [962, 225.5]];
const HEEL = 971.5;
// the screws: the centre of each hub (the crossing of its blade roots), checked against the middle of its two blade
// outlines; and the aperture's sides, arch and sole, the middles of their dashed lines
const WING = { x: 369, y: 932 }, CENTRE = { x: 282, y: 931 };
const APERTURE = { aft: 252.5, fwd: 299, top: 885.5, sole: 967.5 };

const ahead = (x) => (x - AP) / PX_FT * FT, up = (x, y) => (KEEL(x) - y) / PX_FT * FT;
log('e20: the screws\' stations from Engineering\'s side plan of 1911 (Wikimedia Commons), read by pixel scan');
log('\nThe scale and the plan\'s registration at the stern');
log('  scale bar: 0 to 100 ft ' + f(BAR[100] - BAR[0], 1) + ' px, 300 to 400 ft ' + f(BAR[400] - BAR[300], 1) + ' px -> ' + f(PX_FT, 4) + ' px a foot');
log('  ticks at 20, 50, 70, 80, 90 ft: ' + [20, 50, 70, 80, 90].map((k) => f((BAR[k] - BAR[0]) / PX_FT, 1)).join(', ') + ' ft');
log('  length between perpendiculars, the stock\'s line to the stem at the load waterline: ' + f((STEM - AP) / PX_FT, 1) + ' ft (850 ft)');
const zones = C.createSim(C.buildShip(), {}).ship.zones;
const model = { P: zones[15].xf, O: zones[14].xf, N: zones[13].xf };
for (const b of ['P', 'O', 'N']) log('  bulkhead ' + b + ': ' + f(ahead(BULK[b])) + ' m ahead of the stock; the model\'s ' + f(model[b] - C.G.xAP) + ' m (' + (ahead(BULK[b]) - (model[b] - C.G.xAP) >= 0 ? '+' : '') + f(ahead(BULK[b]) - (model[b] - C.G.xAP)) + ')');
log('  depth of the double bottom: ' + f((978.75 - TANK_TOP) / PX_FT, 2) + ' ft (63 in = 5.25 ft at the centre line)');
log('  the rudder, chord from the stock against R1\'s trace of the castings photograph (scaled to the plans\' area):');
const V = require('../../../site/visuals.js');
const lerp = (T, h) => { if (h <= T[0][0]) return T[0][1]; for (let i = 1; i < T.length; i++) if (h <= T[i][0]) { const a = T[i - 1], b = T[i]; return a[1] + (b[1] - a[1]) * (h - a[0]) / (b[0] - a[0]); } return T[T.length - 1][1]; };
for (const [y, x] of RUDDER_EDGE) {
  const h = (HEEL - y) / PX_FT * FT, c = (AP - x) / PX_FT * FT, r = lerp(V.RUDDER, h);
  log('    ' + f(h, 2).padStart(5) + ' m above the heel: plan ' + f(c) + ' m, R1 ' + f(r) + ' m');
}
log('  the rudder\'s heel ' + f(up(AP, HEEL)) + ' m above the keel (the drawing\'s bet 0.30 m; under a metre, not moved)');

log('\nThe stations (m ahead of the rudder\'s stock; heights above the keel)');
const w = { x: ahead(WING.x), z: up(WING.x, WING.y) }, c = { x: ahead(CENTRE.x), z: up(CENTRE.x, CENTRE.y) };
const ap = { x0: ahead(APERTURE.aft), x1: ahead(APERTURE.fwd), z0: up(CENTRE.x, APERTURE.sole), z1: up(CENTRE.x, APERTURE.top) };
// the drawing as it stood at commit 52d22e0: the wing station chosen by a clearance of 0.15 D to the model's hull
const OLD = { wx: 6.74, wz: 3.80, cx: 1.9, cz: 4.82, ap: [0.3, 3.6, 1.9, 7.9] };
const row = (what, plan, old, unit) => log('  ' + what.padEnd(30) + ' plan ' + f(plan).padStart(6) + unit + '   drawing ' + f(old).padStart(6) + unit + '   ' + (Math.abs(plan - old) > 1 ? 'MOVE (' + f(plan - old) + ')' : 'within a metre (' + f(plan - old) + ')'));
row('wing screws, station', w.x, OLD.wx, ' m');
row('wing screws, hub height', w.z, OLD.wz, ' m');
row('centre screw, station', c.x, OLD.cx, ' m');
row('centre screw, hub height', c.z, OLD.cz, ' m');
row('aperture, after side', ap.x0, OLD.ap[0], ' m');
row('aperture, fore side', ap.x1, OLD.ap[1], ' m');
row('aperture, sole', ap.z0, OLD.ap[2], ' m');
row('aperture, arch', ap.z1, OLD.ap[3], ' m');
const R = 17 * FT / 2;
log('  the centre screw (radius ' + f(R) + ' m) at the drawing\'s 4.82 m would reach ' + f(4.82 + R) + ' m, above the plan\'s arch at ' + f(ap.z1) + ' m; at the plan\'s ' + f(c.z) + ' m it spans ' + f(c.z - R) + ' to ' + f(c.z + R) + ' m');
log('  reading: hubs +-1.5 px (+-0.12 m), the scale +-0.3 %; the plan\'s own drafting: its rudder is within 0.4 m of R1\'s trace,');
log('  its bulkheads within 0.2 m of the model\'s; the drawn blades are 8 to 12 % short of the screws\' diameters (a symbol), so');
log('  their hubs are read, not their tips');
log('\nVerdict (R2\'s rule: move what differs by more than a metre): the wing screws ' + f(w.x) + ' m ahead of the stock (was ' + f(OLD.wx) + '),');
log('the centre screw ' + f(c.x) + ' m ahead and ' + f(c.z) + ' m up (was ' + f(OLD.cx) + ' and ' + f(OLD.cz) + '; the turbine\'s axis stays at 4.82 m, R1, so its');
log('shaft falls about ' + f(4.82 - c.z) + ' m aft). The aperture moves with the screw it holds (each edge within a metre, but the old');
log('sole at 1.90 m would cut the moved screw): the plan\'s. The wing shafts\' height (' + f(w.z) + ' against 3.80) is kept.');
log('The model\'s hull clears the wing discs at the new station: ' + f(V.wingClearanceAt(C.G.xAP + w.x)) + ' m (' + f(V.wingClearanceAt(C.G.xAP + w.x) / (23.5 * FT), 3) + ' D).');
log('In the plant (core/systems.js): ' + JSON.stringify(Sys.PLANT.screws.map((s) => ({ x: +f(s.x - C.G.xAP), z: s.z }))));
if (process.argv.includes('--write')) {
  const dir = path.join(__dirname, 'results_2026-11-17');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, 'e20_screw_stations_side_plan_1911.txt'), out.join('\n') + '\n');
}
