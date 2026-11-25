// What the viewer draws of the ship under way, checked as numbers in Node (site/visuals.js).
//   node tools/visuals_tests.js          (a few seconds)
// MUST rows: the stern gear's figures against the builder's, Kelvin's wake against its theory, the lights against
// the 1910 rules, the wake's record deterministic. Certified values: docs/research/abacus/results_stern_gear_wake_lights.
const C = require('../core/core.js');
const Mo = require('../core/motion.js');
const V = require('../site/visuals.js');
const Sys = require('../core/systems.js');
const FT = C.FT, DEG = Math.PI / 180, G = C.GRAV;
const rows = []; let fails = 0;
function row(what, value, ref, ok) { rows.push([what, value, ref, ok]); if (!ok) fails++; }
const f = (x, n) => (x === null || x === undefined || Number.isNaN(x) ? 'n/a' : x.toFixed(n === undefined ? 2 : n));

// ---- 1. stern gear
const S = V.STERN;
row('the wing shafts are where the motion model puts them', S.wing.y + ' m', 'core/motion.js SHIP.wing.y = ' + Mo.SHIP.wing.y + ' m', S.wing.y === Mo.SHIP.wing.y);
const gw = V.propeller(S.wing), gc = V.propeller(S.centre);
row('wing screw: pitch angle at 0.7 of the radius, on the mesh', f(V.meshPitchAngle(gw, 0.7), 3) + ' deg', '34.1080 deg (abacus1:57ccccfd96ce)', Math.abs(V.meshPitchAngle(gw, 0.7) - 34.108) < 0.01);
row('centre screw: pitch angle at 0.7 of the radius, on the mesh', f(V.meshPitchAngle(gc, 0.7), 3) + ' deg', '21.1991 deg (abacus1:1e2e6c059ce1)', Math.abs(V.meshPitchAngle(gc, 0.7) - 21.1991) < 0.01);
const aw = V.bladeFaceArea(gw) * S.wing.Z / (FT * FT), ac = V.bladeFaceArea(gc) * S.centre.Z / (FT * FT);
row('wing screw: the three blades\' face area, from the mesh', f(aw, 1) + ' sq ft', '160 sq ft (H&W notebook), within 3 %', Math.abs(aw / 160 - 1) < 0.03);
row('centre screw: the three blades\' face area, from the mesh', f(ac, 1) + ' sq ft', '120 sq ft (H&W notebook), within 3 %', Math.abs(ac / 120 - 1) < 0.03);
const xs = (x) => x - C.G.xAP, sp = Sys.PLANT.screws;
row('the screws\' stations as the side plan of 1911 has them (R2, e20)', 'wing ' + f(xs(S.wing.x)) + ' m, centre ' + f(xs(S.centre.x)) + ' m ahead of the stock, centre ' + f(S.centre.z) + ' m up', '9.72, 3.03, 3.75 m; the plant\'s discs (core/systems.js) the same', Math.abs(xs(S.wing.x) - 9.72) < 1e-9 && Math.abs(xs(S.centre.x) - 3.03) < 1e-9 && S.centre.z === 3.75 &&
  S.wing.x === sp[0].x && S.wing.x === sp[2].x && S.wing.y === sp[0].y && S.wing.y === -sp[2].y && S.wing.z === sp[0].z && S.centre.x === sp[1].x && S.centre.z === sp[1].z && sp[0].R === S.wing.D / 2 && sp[1].R === S.centre.D / 2);
row('wing screw: its disc clears the model\'s hull at that station', f(V.wingClearanceAt(S.wing.x), 2) + ' m (' + f(V.wingClearanceAt(S.wing.x) / S.wing.D, 3) + ' D)', 'outside the drawn shell', V.wingClearanceAt(S.wing.x) > 0);
const A = S.aperture, Rc = S.centre.D / 2;
row('centre screw: it turns inside the aperture (the side plan\'s)', 'disc ' + f(S.centre.z - Rc) + ' to ' + f(S.centre.z + Rc) + ' m up, hub ' + f(xs(S.centre.x)) + ' m; aperture ' + f(A.z0) + ' to ' + f(A.z1) + ' m, ' + f(xs(A.x0)) + ' to ' + f(xs(A.x1)) + ' m', 'inside, with the blade roots\' half-length fore and aft', S.centre.z - Rc > A.z0 && S.centre.z + Rc < A.z1 && S.centre.x - gc.rootAxial / 2 > A.x0 && S.centre.x + gc.rootAxial / 2 < A.x1);
row('wing screws forward of the centre screw, discs not overlapping', 'wing x ' + S.wing.x + ', centre x ' + f(S.centre.x, 2) + ' m', 'apart by more than both hubs\' half-lengths', S.centre.x < S.wing.x - (gw.rootAxial + gc.rootAxial) / 2 - 0.5);
const shaftTurbine = V.wingShaftY(S.centre.xTurbine);
row('the drawn wing shaft passes the turbine room where The Shipbuilder\'s Fig. 51 has it', f(shaftTurbine, 2) + ' m from the centre line', '5.38 m (R1), within 0.10 m', Math.abs(shaftTurbine - 5.38) < 0.10);
row('rudder: area under the night\'s draft aft, traced outline scaled', f(V.rudderImmersedArea(), 2) + ' m2 (scale ' + f(V.RUDDER_SCALE, 4) + ')', '37.31 m2 (401.63 sq ft, Weeks); the trace alone within 5 %', Math.abs(V.rudderImmersedArea() - 37.31) < 0.01 && Math.abs(V.RUDDER_SCALE - 1) < 0.05);

// ---- 2. the wake on a straight course: Kelvin's angle and wavelengths
function straightRun(kn, secs) {
  const m = Mo.create({ knots: kn }), w = V.wakeBuffer();
  for (let k = 0; k < secs * 4; k++) { Mo.stepAlone(m, 0.25); V.wakeTake(w, { t: m.t, mo: m }); }
  return { m, w };
}
for (const kn of [22.5, 15, 10]) {
  const { m, w } = straightRun(kn, 420), tNow = m.t, U = m.u, L = V.wavelengths(U);
  const bow = V.pointAt(w, w.n - 1, V.WAKE.xBow), d = [Math.cos(m.psi), Math.sin(m.psi)], ds = [-d[1], d[0]];
  const arms = V.kelvinArms(w, tNow); let worst = 0;
  for (const side of ['port', 'stbd']) for (const p of arms[side]) {
    const rx = p[0] - bow[0], ry = p[1] - bow[1], along = -(rx * d[0] + ry * d[1]), across = Math.abs(rx * ds[0] + ry * ds[1]);
    if (along < 200) continue;
    worst = Math.max(worst, Math.abs(Math.atan2(across, along) / DEG - 19.4712));
  }
  row(kn + ' kn: the arms\' half-angle from her bow, every point 200 m or more astern', 'within ' + f(worst, 4) + ' deg of 19.4712', 'arcsin(1/3) = 19.471221 deg (abacus1:0e75f91371c0), within 0.5', worst < 0.5);
  const cusp = [], centre = [];
  for (let n = 1; n <= 8; n++) { cusp.push(V.kelvinCusp(w, tNow, n, 1)); const cr = V.kelvinCrest(w, tNow, n, 40); centre.push(cr[20]); }
  let e1 = 0, e2 = 0;
  for (let n = 0; n < 7; n++) {
    const a = cusp[n], b = cusp[n + 1], perp = Math.abs((b[0] - a[0]) * a[4] + (b[1] - a[1]) * a[5]);
    e1 = Math.max(e1, Math.abs(perp / L.cusp - 1));
    const c0 = centre[n], c1 = centre[n + 1], dc = Math.sqrt((c1[0] - c0[0]) ** 2 + (c1[1] - c0[1]) ** 2);
    e2 = Math.max(e2, Math.abs(dc / L.transverse - 1));
  }
  row(kn + ' kn: crests at the arms, spaced across their crests', 'lambda ' + f(L.cusp, 2) + ' m; worst ' + f(100 * e1, 3) + ' %', '(2/3) 2 pi U^2 / g; 57.2282 m at 22.5 kn (abacus1:8bdabaf8f6fe), within 2 %', e1 < 0.02);
  row(kn + ' kn: crests across her track, spaced along it', 'lambda ' + f(L.transverse, 2) + ' m; worst ' + f(100 * e2, 3) + ' %', '2 pi U^2 / g; 85.8423, 38.1521, 16.9565 m (abacus1:85df118e3f38 ...), within 2 %', e2 < 0.02);
}
// a full turn: the ribbon lies on the circle the stern described (the ribbon is laid from the stern's own positions)
{
  const m = Mo.create({ knots: 22.5 }), w = V.wakeBuffer(); Mo.rudder(m, -40);
  let maxErr = 0;
  for (let k = 0; k < 4 * 480; k++) {
    Mo.stepAlone(m, 0.25);
    if (V.wakeTake(w, { t: m.t, mo: m })) { const p = V.pointAt(w, w.n - 1, V.WAKE.xStern), sx = m.X + V.WAKE.xStern * Math.cos(m.psi), sy = m.Y + V.WAKE.xStern * Math.sin(m.psi); maxErr = Math.max(maxErr, Math.hypot(p[0] - sx, p[1] - sy)); }
  }
  row('hard over 8 min at 22.5 kn: the ribbon\'s centre is the stern\'s own track', 'off by at most ' + f(maxErr, 9) + ' m over ' + w.n + ' samples, head turned ' + f(Math.abs(m.psi) / DEG, 0) + ' deg', 'zero', maxErr < 1e-9);
}
// stopped: nothing is laid
{
  const w = V.wakeBuffer(), m = Mo.create({});
  const laid = [0, 1, 2, 3].map(k => V.wakeTake(w, { t: k, mo: m }));
  row('stopped, the wake lays nothing', 'samples ' + w.n, '0', w.n === 0 && !laid.some(Boolean));
}
// the same run twice: the same samples
{
  const a = straightRun(22.5, 60).w, b = straightRun(22.5, 60).w;
  row('the same run twice lays the same samples, bit for bit', a.n + ' samples', b.n + ' samples, equal', a.n === b.n && a.X.every((v, i) => v === b.X[i]) && a.Y.every((v, i) => v === b.Y[i]));
}

// ---- 3. the lights against the 1910 rules
const expectAt = (b) => {                          // the rule, written out independently of lightFactor's code
  const a = Math.abs(b), s = [];
  if (a < 112.5) s.push('masthead');
  if (b >= 0 && b < 112.5) s.push('starboard');
  if (b <= 0 && b > -112.5) s.push('port');
  if (a > 112.5) s.push('stern');
  return s.sort().join(',');
};
let bad = [];
for (let k = 0; k < 16; k++) {
  const b = -180 + 11.25 + 22.5 * k, got = V.LIGHTS.filter(L => V.lightFactor(L, b) > 0.5).map(L => L.id).sort().join(',');
  if (got !== expectAt(b)) bad.push(b + ': ' + got + ' vs ' + expectAt(b));
}
row('sixteen bearings round her: which lights show', bad.length ? bad.join('; ') : 'all 16 as the rule', 'masthead 20 points, side lights 10 points each, stern 12 points', bad.length === 0);
const near = [[0.1, 'masthead,port,starboard'], [-3, 'masthead,port'], [3, 'masthead,starboard'], [110, 'masthead,starboard'], [115, 'stern'], [-115, 'stern'], [180, 'stern']];
bad = near.filter(([b, e]) => V.LIGHTS.filter(L => V.lightFactor(L, b) > 0.5).map(L => L.id).sort().join(',') !== e);
row('at the edges of the arcs (right ahead, two points abaft the beam)', bad.length ? JSON.stringify(bad) : 'all as the rule', 'both side lights right ahead; none abaft 112.5 deg but the stern light', bad.length === 0);
const eye = [75.2, 0, C.deckZ('Boat', 75.2) + 1.75];
const fromBridge = V.LIGHTS.filter(L => V.lightFactor(L, V.bearingFrom(L, eye[0], eye[1])) > 0.01).map(L => L.id);
row('from her own bridge none of her lights shows', fromBridge.length ? fromBridge.join(', ') : 'none', 'none (the screens and arcs hide them)', fromBridge.length === 0);
const mh = V.LIGHTS.find(L => L.id === 'masthead');
row('masthead light height above the water', f(mh.at[2] - 9.6, 1) + ' m', '145 ft = 44.196 m (Halpern; abacus1:73d28f0ff98e)', Math.abs(mh.at[2] - 9.6 - 44.196) < 0.01);

// ---- 4. engines
const lifts = [0, 90, 180, 270].map(a => V.pistonLift(a * DEG));
row('engines: the piston\'s travel is the stroke', f(lifts[0] - lifts[2], 4) + ' m', '75 in = 1.9050 m', Math.abs(lifts[0] - lifts[2] - 1.905) < 1e-9);
row('engines: their centre lines where the wing shafts are in the engine room', V.ENGINE.y + ' m, ' + V.ENGINE.zShaft + ' m up', 'Fig. 53: 5.14 m, 3.80 m (R1)', V.ENGINE.y === V.STERN.wing.yEngine && V.ENGINE.zShaft === V.STERN.wing.z);

// ---- 5. the wash when backing: a crash stop from 22.5 knots, helm amidships
{
  const m = Mo.create({ knots: 22.5 }), st = V.washState(), D = V.STERN.wing.D, toMid = -V.STERN.wing.x;
  Mo.telegraph(m, 'full astern');
  let tFwd = null, tMid = null, uMid = null, tStop = null;
  for (let k = 0; k < 4 * 400 && (tStop === null || m.t < tStop + 60); k++) {    // on past the stop: she gathers sternway
    Mo.stepAlone(m, 0.25); V.washStep(st, m.t, 0.25, m.u, m.TP, D);
    const fr = V.washFront(st, D)[0];
    if (tFwd === null && fr > 1) tFwd = m.t;
    if (tMid === null && fr >= toMid) { tMid = m.t; uMid = m.u; }
    if (tStop === null && m.u <= 0) tStop = m.t;
  }
  row('crash stop: the wash first runs forward of the wing screws', tFwd === null ? 'never' : 't ' + f(tFwd, 1) + ' s', 'once the astern thrust has built up and she has slowed', tFwd !== null && tFwd > 30);
  row('crash stop: the wash reaches amidships about when she loses her way', tMid === null ? 'never' : 't ' + f(tMid, 1) + ' s at ' + f(uMid / Mo.KN, 1) + ' kn; she stops at ' + f(tStop, 1) + ' s', 'within 40 s of the stop, under 3 knots either way (the shiphandler\'s sign: from memory)', tMid !== null && Math.abs(tMid - tStop) < 40 && Math.abs(uMid) < 3 * Mo.KN);
}

// ---- 6. the lights fail as an outcome of the flooding
{
  const SC = require('../core/scenarios.js'), Sys = require('../core/systems.js'), ship = C.buildShip();
  const failAt = (key, tMax) => {                  // the plant decides: the dynamos, their steam, their room (core/systems.js)
    const sim = C.createSim(ship, {}, SC.PRESETS[key].build({})); Sys.attach(sim);
    while (sim.t < tMax && !sim.foundered) { C.step(sim); Sys.step(sim); if (!sim.plant.power) return [sim.t, sim.plant.broken ? 'the steam mains broken' : (sim.plant.el ? 'the dynamos flooded' : 'no steam')]; }
    return null;
  };
  const t1912 = failAt('titanic', 4 * 3600), clock = t1912 ? 23 * 60 + 40 + t1912[0] / 60 : null;
  const hhmm = (mins) => { const h = Math.floor(mins / 60) % 24, mm = Math.floor(mins % 60), ss = Math.round((mins * 60) % 60); return (h % 12 || 12) + ':' + String(mm).padStart(2, '0') + ':' + String(ss).padStart(2, '0') + (h >= 12 ? ' am' : ' am'); };
  const LR = require('./lights_record.js');     // D90 (a): the record's window in one place
  row('the 1912 damage: her lights fail', t1912 ? hhmm(clock - 24 * 60) + ' (' + t1912[1] + ', ' + f(t1912[0] / 60, 2) + ' min after the damage)' : 'never', LR.said + ' [the rule is a bet]', t1912 !== null && LR.read(t1912[0]).ok);
  const tFour = failAt('four', 5 * 3600);
  row('four compartments open (she floats, Wilding): her lights never fail', tFour ? 'fail at ' + f(tFour[0] / 60, 1) + ' min' : 'burning after 5 h', 'never', tFour === null);
  // G24 (D95): against the model's hull with her ends (ship.hull since D4), as the drawn shell they stand on is
  const ports = V.portholes();
  const inside = ports.filter(p => Math.abs(p[1]) < C.halfBreadth(p[0], p[2], ship.hull) - 0.01 && Math.abs(p[1]) < 13.6).length;
  row('her ports and windows: lit ones drawn on her sides, none inside her hull with her ends', ports.length + ' lights, ' + inside + ' inside the hull', 'several hundred, none inside', ports.length > 300 && inside === 0);
}

for (const [what, value, ref, ok] of rows) console.log((ok ? 'PASS ' : 'FAIL ') + what.padEnd(92) + ' ' + String(value).padEnd(46) + ' ' + ref);
console.log(fails ? '\nFAIL: ' + fails + ' row(s)' : '\nPASS: all ' + rows.length + ' rows');
process.exit(fails ? 1 : 0);
