// e6: what the model already holds for screws, rudder, wake and wash to be drawn from, and one check of signs.
// Written for docs/BRAINSTORM_screws_rudder_wake_lights_v1_2026-11-16.md. It changes nothing; it only asks the model.
//   node docs/research/experiments/e6_stern_wash_astern.js [repo root]
// Output of 2026-11-16: results_2026-11-16/e6_stern_wash_astern.txt
const path = require('path');
const root = process.argv[2] || path.join(__dirname, '..', '..', '..');
const C = require(path.join(root, 'core', 'core.js')), Mo = require(path.join(root, 'core', 'motion.js'));
const RHO = C.RHO, KN = Mo.KN, f = (v, n) => v.toFixed(n === undefined ? 2 : n);
const disc = (D) => Math.PI * D * D / 4;

// ---- 1. the model hull where the stern gear would be drawn
console.log('1. THE MODEL HULL AT THE STERN');
console.log('   xAP', f(C.G.xAP), 'm; counter overhang', C.G.sternOverhang, 'm above z', C.G.counterZ0, 'to', C.G.counterZ1, 'm; the underwater body ends at xAP');
console.log('   half-breadth (m)        z = 1     2     3     4     5     6     7     8    10    12');
for (const x of [-100, -110, -118, -120, -122, -124, -126, -128, -129.4]) console.log('     x = ' + String(x).padStart(7) + '        ' + [1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map(z => f(C.halfBreadth(x, z)).padStart(6)).join(''));
{
  const ship = C.buildShip(), sim = C.createSim(ship, {}, { openings: [], coalListDeg: 0 }), F = C.frameOf(sim);
  console.log('   keel below the sea at x = -124:', f(-C.worldZ(F, -124, 0, 0)), 'm; boat deck at the bridge (x 75):', f(C.deckZ('Boat', 75)), 'm above keel, the sea', f(-C.worldZ(F, 75, 0, 0)), 'm above keel there');
  console.log('   compartments aft of BR1:', C.ZONES.slice(10).map((z, i) => z.short + ' ' + f(C.zoneBounds()[10 + i + 1], 1) + '..' + f(C.zoneBounds()[10 + i], 1)).join(', '));
}

// ---- 2. steady states: thrust and race by telegraph order
console.log('\n2. STEADY STATES BY ORDER (race: far astern, in her frame, momentum theory on the model\'s own thrust)');
console.log('   order            rpm     kn  T wing MN  T centre MN  centre rpm  race wing  race centre  her speed m/s');
for (const order of ['full ahead', 'half ahead', 'slow ahead', 'dead slow ahead']) {
  const m = Mo.create({ order });
  for (let i = 0; i < 4000; i++) Mo.stepAlone(m, 0.25);
  const S = m.K.S, Va = m.u * (1 - S.wing.w), VaC = m.u * (1 - S.centre.w);
  const jw = Math.sqrt(Va * Va + 2 * Math.max(0, m.TP) / (RHO * disc(S.wing.D))), jc = m.TC > 0 ? Math.sqrt(VaC * VaC + 2 * m.TC / (RHO * disc(S.centre.D))) : VaC;
  console.log('   ' + order.padEnd(16), f(m.nP, 0).padStart(4), f(m.u / KN, 2).padStart(6), f(m.TP / 1e6, 3).padStart(10), f(m.TC / 1e6, 3).padStart(12), f(m.nC, 0).padStart(11), f(jw, 2).padStart(10), f(jc, 2).padStart(12), f(m.u, 2).padStart(14));
}

// ---- 3. crash stop: when does the wash the screws throw forward outrun her (the "quickwater")?
console.log('\n3. CRASH STOP FROM 22.5 KNOTS (Full astern, helm amidships)');
console.log('   wash over the ground = sqrt(2 |T| / rho A) on one wing screw, no decay with distance: a crude upper estimate');
console.log('       t s     kn  wing rpm  T wing MN  wash m/s  wash - her m/s  front x m');
{
  const m = Mo.create({ knots: 22.5 }); Mo.telegraph(m, 'full astern');
  let xq = null, tCross = null, tMid = null, tStop = null;
  for (let k = 0; k <= 1200; k++) {
    const S = m.K.S, T = Math.min(0, m.TP), w = Math.sqrt(2 * -T / (RHO * disc(S.wing.D))), rel = w - m.u;
    if (rel > 0 && tCross === null) { tCross = m.t; xq = S.xP * S.L; }
    if (xq !== null) { xq += Math.max(0, rel) * 0.25; if (xq >= 0 && tMid === null) tMid = m.t; }
    if (m.u <= 0 && tStop === null) tStop = m.t;
    if (k % 80 === 0 || m.t === tCross || m.t === tMid || m.t === tStop) console.log('   ' + f(m.t, 0).padStart(7), f(m.u / KN, 2).padStart(6), f(m.nP, 0).padStart(9), f(m.TP / 1e6, 3).padStart(10), f(w, 2).padStart(9), f(rel, 2).padStart(15), (xq === null ? '-' : f(xq, 0)).padStart(10));
    Mo.stepAlone(m, 0.25);
  }
  console.log('   the wash first outruns her at t =', tCross, 's; its front (undecayed) is amidships at t =', tMid, 's; she is stopped at t =', tStop, 's');
}

// ---- 3b. the same stop, second by second, with the helm amidships and with it hard over ("Full astern, hard over")
console.log('\n3b. FULL ASTERN FROM 22.5 KNOTS, HELM AMIDSHIPS AND HARD OVER');
for (const helm of [0, -40]) {
  const m = Mo.create({ knots: 22.5 }); Mo.telegraph(m, 'full astern'); Mo.rudder(m, helm);
  const X0 = m.X, Y0 = m.Y; let run = 0; const out = [];
  for (let k = 0; k < 2400 && m.u > 0; k++) {
    if ([0, 10, 15, 20, 60].includes(k / 4)) out.push('      t ' + String(k / 4).padStart(2) + ' s: ' + f(Math.sqrt(m.u * m.u + m.v * m.v) / KN) + ' kn, rudder ' + f(m.del * 180 / Math.PI, 0) + ' deg, wing ' + f(m.nP, 0) + ' rpm, centre ' + f(m.nC, 0) + ' rpm');
    const u = m.u, v = m.v; Mo.stepAlone(m, 0.25); run += Math.sqrt(u * u + v * v) * 0.25;
  }
  console.log('   rudder order ' + helm + ' deg: stopped at t = ' + f(m.t, 1) + ' s after ' + f(run, 0) + ' m along her track (' + f(Math.sqrt((m.X - X0) * (m.X - X0) + (m.Y - Y0) * (m.Y - Y0)), 0) + ' m from where the order was given), her head ' + f(Math.abs(m.psi) * 180 / Math.PI, 1) + ' deg round\n' + out.join('\n'));
}

// ---- 4. hard over: what the stern does (the wake is laid by the stern, not by amidships)
{
  const t = Mo.create({ knots: 22.5 }); Mo.rudder(t, -40);
  for (let k = 0; k < 480; k++) Mo.stepAlone(t, 0.25);
  const L = t.K.S.L;
  console.log('\n4. HARD OVER FOR 120 s FROM 22.5 KNOTS');
  console.log('   speed', f(Math.sqrt(t.u * t.u + t.v * t.v) / KN), 'kn; drift angle', f(Math.abs(Math.atan2(-t.v, t.u)) * 180 / Math.PI, 1), 'deg; rate of turn', f(Math.abs(t.r) * 180 / Math.PI, 2), 'deg/s; sideways speed', f(Math.abs(t.v - t.r * 0.5 * L), 2), 'm/s at the stern,', f(Math.abs(t.v + t.r * 0.5 * L), 2), 'm/s at the bow');
}

// ---- 5. a check of signs with sternway and with the screws opposed (seamanship says what should happen)
console.log('\n5. SIGNS (r > 0: her head goes to starboard)');
function run(label, expect, setup, secs) {
  const m = Mo.create({}); setup(m, 0);
  let out = '';
  for (let k = 0; k <= secs * 4; k++) {
    if (k % 240 === 0) out += '   t ' + String(k / 4).padStart(3) + ' s  ' + f(m.u / KN, 1).padStart(5) + ' kn  head ' + f(m.psi * 180 / Math.PI, 1).padStart(6) + ' deg  r ' + f(m.r * 180 / Math.PI, 3).padStart(7) + ' deg/s\n';
    setup(m, k / 4);
    Mo.stepAlone(m, 0.25);
  }
  console.log('   ' + label + '\n   expected: ' + expect + '\n' + out);
}
run('sternway under Half astern from rest; rudder 30 deg to starboard from t = 120 s', 'the stern goes to starboard, so her head goes to port (r < 0)', (m, t) => { Mo.telegraph(m, 'half astern'); if (t >= 120) Mo.rudder(m, 30); }, 300);
run('the same with the rudder 30 deg to port', 'r > 0', (m, t) => { Mo.telegraph(m, 'half astern'); if (t >= 120) Mo.rudder(m, -30); }, 300);
run('at rest: port screw Half ahead, starboard screw Half astern, rudder amidships', 'her head goes to starboard (r > 0) with little way', (m) => { Mo.telegraph(m, 'half ahead', 'port'); Mo.telegraph(m, 'half astern', 'starboard'); }, 300);
run('22.5 knots, then Full astern with the rudder held 20 deg to starboard', 'r > 0 while she has headway, fading as the race is lost', (m, t) => { if (t === 0) Object.assign(m, Mo.create({ knots: 22.5 })); Mo.telegraph(m, 'full astern'); Mo.rudder(m, 20); }, 300);
