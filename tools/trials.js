// P1 acceptance: the motion model against the 1911-12 trial record, its own invariants, and its coupling to the core.
//   node tools/trials.js                     the table; exit 1 if any MUST row fails
//   node tools/trials.js --abacus-requests   write the steady-speed root requests for Abacus (then run abacus batch;
//                                            Abacus's exe: ABACUS_EXE, else "abacusExe" in tools/local_paths.json)
// MUST rows: fitted figures, invariants and signs. CHECK rows: record figures that were NOT fitted; they are reported
// with the reference, and a miss there is information, not a failure.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const C = require('../core/core.js');
const SC = require('../core/scenarios.js');
const M = require('../core/motion.js');
const T = require('./motion_trials.js');
const KN = M.KN, DEG = M.DEG;
const AB = path.join(__dirname, '..', 'docs', 'research', 'abacus');
// M3 (2026-11-17): the resistance has a shape in speed, so the balance is no longer a quadratic; the requests and answers
// are new files (the P1 ones stay as they were answered)
const ABREQ = path.join(AB, 'requests_motion_m3_steady_2026-11-17.jsonl'), ABRES = path.join(AB, 'results_motion_m3_steady_2026-11-17.jsonl');
const ORDERS = [['full ahead', 75], ['half ahead', 50], ['slow ahead', 30]];

function rootRequest(rpm) {                         // the straight-line force balance as an expression in u, from the model's own numbers
  const m = M.create({}), tin = rpm >= 50, b = M.balanceTerms(m, rpm, tin), v = { tP: String(b.tP), cR: String(b.cR), kc: String(b.centreDrag) };
  const terms = b.screws.map((s, i) => { const j = i + 1; v['a' + j] = String(s.rhoD4a); v['n' + j] = String(s.n); v['w' + j] = String(s.w); v['D' + j] = String(s.D); v['J' + j] = String(s.J0); return `a${j}*(n${j}^2 - n${j}*(1 - w${j})*u/(D${j}*J${j}))`; });
  // the shape g(u / uB), a cubic, inside [x0, x1] where it is not held: the search interval is that range of speeds
  const r = b.resist; v.uB = String(r.uB); r.g.forEach((c, k) => { v['g' + k] = String(c); });
  return { cmd: 'root.real', args: { f: `(1 - tP)*(${terms.join(' + ')} - kc*u^2) - cR*u^2*(g0 + g1*(u/uB) + g2*(u/uB)^2 + g3*(u/uB)^3)`, var: 'u', lo: String(r.x0 * r.uB), hi: String(r.x1 * r.uB), vars: v } };
}
if (process.argv.includes('--abacus-requests')) {
  fs.writeFileSync(ABREQ, ORDERS.map(o => JSON.stringify(rootRequest(o[1]))).join('\n') + '\n');
  // Abacus's exe is this machine's own: ABACUS_EXE, else "abacusExe" in tools/local_paths.json (untracked)
  const abacus = process.env.ABACUS_EXE || (() => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'local_paths.json'), 'utf8')).abacusExe; } catch (e) { return null; } })();
  console.log('wrote', ABREQ, '\nnow:', abacus || '<abacus.exe: set ABACUS_EXE, or "abacusExe" in tools/local_paths.json>', 'batch --in', ABREQ, '--out', ABRES);
  process.exit(0);
}

const rows = []; let fails = 0;
function row(kind, what, value, ref, ok) { rows.push([kind, what, value, ref, ok]); if (kind === 'MUST' && !ok) fails++; }
const f = (x, n) => (x === null || x === undefined ? 'n/a' : x.toFixed(n === undefined ? 1 : n));

// 1. speeds against revolutions
const sp = rpm => M.create({ rpm }).u / KN;
// bands: the handling consensus (docs/research/RESEARCH_handling_consensus_v1_2026-11-16.md, sections 9 and 11)
row('CHECK', 'Full ahead, 75 rpm', f(sp(75), 2) + ' kn', '22.1 kn, 21.75-22.3 (BI 18372; 22.06 over a day; calibrated at Halpern\'s 22.15)', sp(75) >= 21.75 && sp(75) <= 22.3);
row('CHECK', '74 rpm', f(sp(74), 2) + ' kn', '21.7 kn, 21.4-21.9 (Olympic 21.5, BI 25292, plus Titanic\'s 1/8-1/4 kn)', sp(74) >= 21.4 && sp(74) <= 21.9);
row('CHECK', '60 rpm (the stopping trial), at the night\'s draft', f(sp(60), 2) + ' kn', '17.6 kn, 17.3-18.0 (18 kn at the trial\'s 30 ft, BI 25295, corrected)', sp(60) >= 17.3 && sp(60) <= 18.0);
row('CHECK', 'Half ahead, 50 rpm, turbine in', f(sp(50), 2) + ' kn', '15.3 kn, 14.9-15.9 (Smith; Fleming; Halpern; pitch and draft corrected)', sp(50) >= 14.9 && sp(50) <= 15.9);
row('CHECK', 'Slow ahead, 30 rpm, turbine out', f(sp(30), 2) + ' kn', '8.6 kn, 8.2-9.2 (Smith 8-9, Fleming 9); the model loses speed too fast below 60 rpm', sp(30) >= 8.2 && sp(30) <= 9.2);
for (const [name, rpm] of ORDERS) { const s = T.settle(rpm); row('MUST', 'time-stepper settles on the exact speed, ' + name, f(Math.abs(s.stepped - s.exact) * 1e9, 3) + ' nm/s off', 'under 1 nm/s', Math.abs(s.stepped - s.exact) < 1e-9); }
if (fs.existsSync(ABRES)) {
  const res = fs.readFileSync(ABRES, 'utf8').trim().split('\n').map(l => JSON.parse(l));
  ORDERS.forEach(([name, rpm], i) => {
    const a = res[i], roots = a.result && a.result.roots, e = roots && roots.length === 1 ? roots[0].enclosure : null;
    const mid = e ? (Number(e.lo) + Number(e.hi)) / 2 : NaN;
    const exact = M.create({ rpm }).u, ok = a.result && a.result.count === 1 && Math.abs(mid - exact) < 1e-9;
    row('MUST', 'steady speed is the certified unique root, ' + name, f(exact, 9) + ' m/s', (a.receipt && a.receipt.id) + ': ' + f(mid, 9) + ' (count ' + (a.result && a.result.count) + ')', ok);
  });
} else row('MUST', 'steady speeds certified by Abacus', 'no results file', 'run --abacus-requests, then abacus batch', false);

// 2. turning
const t21 = T.turn(null, 21.5, 40), t20 = T.turn(null, 20, 40), rev = T.turnReversed(null, 74, 40), t11 = T.turn(null, 11, 40);
row('MUST', 'two points (22.5 deg) at 74 rpm, hard over and both engines full astern [fitted]', f(rev.t225) + ' s', '37 s from the order (Olympic 1912, BI 25292; "And reversed both engines.", Wilding 1915)', Math.abs(rev.t225 - 37) <= 1.5);
row('MUST', 'tactical diameter, hard over at 20 kn, engines ahead [fitted]', f(t20.tact, 0) + ' m', '3,850 ft = 1,173 m (Titanic trials; Wilding 1915)', Math.abs(t20.tact - 1173.48) <= 0.03 * 1173.48);
row('MUST', 'circle at 11 kn (turbine out, as in service) over the circle at 20 kn [fitted]', f(t11.tact / t20.tact, 3), '1.03, 1.00-1.10: "only by a very small amount" (Wilding 1912 and 1915)', t11.tact / t20.tact >= 1.0 && t11.tact / t20.tact <= 1.1);
row('CHECK', 'two points at 21.5 kn with the helm alone', f(t21.t225) + ' s', '30-37 s expected (the consensus\'s sensitivity; Halpern read the 37 s this way)', t21.t225 >= 30 && t21.t225 <= 37.5);
row('CHECK', 'distance run to two points, engines reversed', f(rev.x225, 0) + ' m', '381 m, 366-402 (BI 25293: 0.2 nm by log, 1,200-1,300 ft; 440 yd, 1915)', rev.x225 >= 366 && rev.x225 <= 402);
row('CHECK', 'advance at 20 kn, from the helm order', f(t20.adv, 0) + ' m', '777 m, 700-885 (bounded by the records; Halpern\'s model 774)', t20.adv >= 700 && t20.adv <= 885);
row('CHECK', 'advance at 20 kn, from the rudder hard over', f(t20.advHelm, 0) + ' m', '640 m, 580-700 (Wilding\'s "about 2,100 feet", origin not stated)', t20.advHelm >= 580 && t20.advHelm <= 700);
row('CHECK', 'speed held in the steady turn at 20 kn', f(t20.ratio, 2), '0.74, 0.65-0.82 (Halpern\'s chart value; never measured)', t20.ratio >= 0.65 && t20.ratio <= 0.82);
row('CHECK', 'steady rate of turn at 20 kn', f(t20.rate, 2) + ' deg/s', '0.76 deg/s, 0.65-0.88 (follows from the speed held)', t20.rate >= 0.65 && t20.rate <= 0.88);
row('CHECK', 'two points at 11 kn, helm alone', f(t11.t225) + ' s', '70 s, 60-80 (counsel relaying Wilding, BI Day 29: "double as long")', t11.t225 >= 60 && t11.t225 <= 80);
const circ = [11, 19.5, 21.75].map(kn => T.turn(null, kn, 40).tact);
row('CHECK', 'circles at 11, 19.5, 21.75 kn (BI 25291\'s three)', circ.map(x => f(x, 0)).join(', ') + ' m', 'nearly the same: the slow one up to 10 % larger', circ[0] / circ[1] >= 1 && circ[0] / circ[1] <= 1.1 && Math.abs(circ[2] / circ[1] - 1) < 0.05);
const ns = T.turn(null, 21.5, 40, { noTurbine: true }), ns20 = T.turn(null, 20, 40, { noTurbine: true });
row('CHECK', 'centre screw out: two points; circle', f(ns.t225) + ' s; ' + f(ns20.tact, 0) + ' m', 'little slower than with it (the "turbine question"; consensus Conflict 15); no record', ns.t225 >= t21.t225 && ns20.tact >= t20.tact && ns20.tact < 1.1 * t20.tact);
const tp = T.turn(null, 20, -40);
row('MUST', 'port and starboard turns mirror each other', f(tp.tact, 1) + ' vs ' + f(t20.tact, 1) + ' m', 'the model has no handed terms yet', Math.abs(tp.tact - t20.tact) < 1e-6 * t20.tact);

// 3. stopping. The trial's engines were reversed "more slowly than usual" (T.TRIAL_1912); the other stops use the usual
// handling, Olympic's of 1911 a prompt one (T.PROMPT): tools/motion_trials.js
const cs = T.crashStop(null, 60, T.TRIAL_1912), cu = T.crashStop(null, 60);
row('MUST', 'crash stop from 60 rpm, the trial\'s slow reversal: distance [fitted]', f(cs.dist, 0) + ' m', '"just over 3,000 feet" = 914 m (BI 25295)', Math.abs(cs.dist - 914.4) <= 0.05 * 914.4);
row('CHECK', 'crash stop, the trial\'s slow reversal: time to way off', f(cs.t, 0) + ' s', '195 s, 180-210 (BI 25295: "about three minutes and 15 seconds")', cs.t >= 180 && cs.t <= 210);
row('CHECK', 'crash stop from 60 rpm, usual reversal: engines astern after', f(cu.tAstern, 0) + ' s', '15 s, 10-22 (Cone 1912; USS Delaware 10 and 22 s)', cu.tAstern >= 10 && cu.tAstern <= 22);
row('CHECK', 'crash stop from 60 rpm, usual reversal: distance', f(cu.dist, 0) + ' m', '820-930 m (the consensus\'s 8.4: the trial corrected for its draft and its slow reversal)', cu.dist >= 820 && cu.dist <= 930);
const cs75 = T.crashStop(null, 75, T.PROMPT), cs30 = T.crashStop(null, 30);
row('CHECK', 'stop from 75 rpm, prompt reversal', f(cs75.dist, 0) + ' m', 'no more than about 945 m (Olympic 1911 stopped "rather less" than Titanic; Wilding 1915)', cs75.dist <= 945);
row('CHECK', 'stop from 30 rpm over the stop from 60 rpm, usual reversal', f(cs30.dist / cu.dist, 2), '0.82, 0.75-0.90 (halving the speed cut it about 15 %: another, smaller ship; Wilding 1915)', cs30.dist / cu.dist >= 0.75 && cs30.dist / cu.dist <= 0.9);

// 4. coupled to the flooding core
const ship = C.buildShip();
{ // at rest with motion attached and the engines stopped, the core gives the reference bits
  const ref = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'out', 'seams_reference.json'), 'utf8')).scenarios.titanic;
  // as the seams gate runs it (tools/seams.js): the flow parameters the reference was frozen with, the damage without its pumps (Y3)
  // and the ship without her grand staircases or the tiers above B deck (S1), the bunker of the fire (W6) or C3's cut,
  // and the 1912 damage's split and area as they were (G6b: SC.TITANIC_SPLIT_GATE, SC.GATE_AREA)
  // (and since the epoch's landing, every default it moved as it was: SC.PRE_D4)
  const sim = C.createSim(C.buildShip({ tiers: 0, peakTank: 0, hullEnds: 0 }), Object.assign({}, SC.PRE_D4.params, { wMul: 1.182, aDown: 0.277, fOpen: 0.0101, stairs: 0, conserve: 0, bunker: 0, g11: 0, g11Doors: 1, sideOpenings: 0 }), Object.assign(SC.PRESETS.titanic.build({ noPumps: true, split: SC.TITANIC_SPLIT_GATE, areaTitanic: SC.GATE_AREA, bunkerOpen: null }), SC.PRE_D4.scen));
  const keepMP = M.SHIP.massPockets; M.SHIP.massPockets = SC.PRE_D4.modules.massPockets;   // the run before D4, set back after it
  const h = crypto.createHash('sha256'), buf = new Float64Array(71); let steps = 0;
  try {
    M.attach(sim, {});
    while (!sim.foundered && sim.t < 4 * 3600) {
      M.step(sim); steps++;
      buf.set(sim.vol, 0); buf[64] = sim.zO; buf[65] = sim.pitch; buf[66] = sim.roll; buf[67] = sim.vz; buf[68] = sim.wth; buf[69] = sim.wph; buf[70] = sim.inflow;
      h.update(Buffer.from(buf.buffer)); h.update(sim.foundered ? 'F' : 'a');
    }
  } finally { M.SHIP.massPockets = keepMP; }
  const d = h.digest('hex');
  row('MUST', '1912 run driven by motion, engines stopped: same bits as the plain core', steps + ' steps, ' + d.slice(0, 12), 'seams reference ' + ref.sha256.slice(0, 12), d === ref.sha256 && steps === ref.steps);
}
function coupledTurn(deg, secs) {
  const sim = C.createSim(ship, {}, { openings: [], coalListDeg: 0 }); M.attach(sim, { knots: 20 });
  M.rudder(sim, deg);
  while (sim.t < secs) M.step(sim);
  return { heel: sim.roll / DEG, r: sim.mo.r };
}
const cS = coupledTurn(40, 600), cP = coupledTurn(-40, 600);
row('MUST', 'a turn to starboard heels her to port (core roll < 0), and the mirror', f(cS.heel, 2) + ' / ' + f(cP.heel, 2) + ' deg', 'outward heel in a steady turn', cS.r > 0 && cS.heel < 0 && cP.heel > 0);
row('CHECK', 'steady heel in the turn at 20 kn (intact, no coal list)', f(Math.abs(cS.heel), 2) + ' deg', '4.1 deg, 3.0-5.5 (Halpern\'s 5.4 at 22.5 kn brought to 20 kn; never observed)', Math.abs(cS.heel) >= 3.0 && Math.abs(cS.heel) <= 5.5);
{ // snapshots. The motion state alone restores bit for bit; coupled to the core it inherits the core's own restore
  // tolerance (restore re-solves the free surfaces; PORTING.md: "tracks the original to about 0.01 deg").
  const a0 = M.create({ knots: 22.5 }); M.rudder(a0, -40); for (let i = 0; i < 160; i++) M.stepAlone(a0, 0.25);
  const b0 = M.create({}); Object.assign(b0, JSON.parse(JSON.stringify(M.serialize({ mo: a0, conn: null, ...C.createSim(ship, {}, {}) }).motion)));
  for (let i = 0; i < 400; i++) { M.stepAlone(a0, 0.25); M.stepAlone(b0, 0.25); }
  row('MUST', 'motion snapshot mid-turn, restore, run on 100 s (standalone)', 'heading ' + f(a0.psi / DEG, 6) + ' vs ' + f(b0.psi / DEG, 6), 'bit-identical', a0.psi === b0.psi && a0.X === b0.X && a0.u === b0.u);
  const mk = () => { const s = C.createSim(ship, {}, SC.PRESETS.titanic.build()); M.attach(s, { knots: 22.5 }); M.helm1912(s, 'hard-a-starboard'); for (let i = 0; i < 160; i++) M.step(s); return s; };
  const a = mk(), b = M.restore(ship, JSON.parse(JSON.stringify(M.serialize(a))));
  for (let i = 0; i < 400; i++) { M.step(a); M.step(b); }
  const dh = Math.abs(a.mo.psi - b.mo.psi) / DEG, dx = Math.hypot(a.mo.X - b.mo.X, a.mo.Y - b.mo.Y);
  row('MUST', 'coupled snapshot mid-turn, restore, run on 100 s', f(dh, 5) + ' deg, ' + f(dx, 3) + ' m apart', 'within 0.01 deg and 1 m (the core\'s restore tolerance)', dh < 0.01 && dx < 1);
}
{ // the 1912 damage while she keeps steaming: the flood water's mass and the momentum of the inflow slow her
  const sim = C.createSim(ship, {}, SC.PRESETS.titanic.build()); M.attach(sim, { order: 'full ahead' });
  const u0 = sim.mo.u; while (sim.t < 1800) M.step(sim);
  row('CHECK', 'the 1912 damage at Full ahead for 30 min (the sea\'s pressure at the openings: P5)', f(u0 / KN, 2) + ' -> ' + f(sim.mo.u / KN, 2) + ' kn with ' + f((sim.mo.mass - sim.ms) / 1e6, 1) + ' thousand t aboard', 'she slows as she fills (hydrodynamics still at the intact draft)', sim.mo.u < u0);
}
{ // P5, flooding at speed (Tier 0, motion.js seaHeads): the outside level at each opening
  const at = (o, how, steps) => { const s = C.createSim(ship, {}, { openings: [o], coalListDeg: 0 }); M.attach(s, how); for (let i = 0; i < steps; i++) M.step(s); return s; };
  const xs = C.xFwd(4) - 40;                       // 40 m aft of the stem: past the bow wave's reach
  const ram = at({ x: xs, y: -(C.halfBreadth(xs, 4) + 0.02), z: 4, area: 0.05, kind: 'breach', label: 'bow:1:0' }, { knots: 10 }, 1);
  const slit = at({ x: 0, y: -(C.halfBreadth(0, 4) + 0.02), z: 4, area: 0.05, kind: 'breach', label: 'test' }, { knots: 22.5 }, 1);
  const rest = at({ x: 120, y: -(C.halfBreadth(120, 4) + 0.02), z: 4, area: 0.05, kind: 'breach', label: 'test' }, { order: 'stop' }, 40);
  const U = ram.mo.u, q = U * U / (2 * C.GRAV), hRam = ram.conn.hx[ram.openings[0].conn], hSlit = slit.conn.hx[slit.openings[0].conn], hRest = rest.conn.hx[rest.openings[0].conn];
  row('MUST', 'P5: a crushed bow faces the flow: its outside level rises by the whole dynamic head', f(hRam, 3) + ' m at ' + f(U / KN, 2) + ' kn', f(q, 3) + ' m (U^2/2g)', Math.abs(hRam - q) < 1e-9);
  row('MUST', 'P5: a slit in her parallel side amidships: next to nothing; stopped: exactly 0', f(hSlit, 4) + ' m at 22.5 kn; ' + hRest + ' m stopped', 'under 1 % of the dynamic head (6.83 m); 0', hSlit >= 0 && hSlit < 0.0683 && hRest === 0);
  const water = (kn) => { const s = at({ x: 120, y: -(C.halfBreadth(120, 4) + 0.02), z: 4, area: 0.2, kind: 'breach', label: 'test' }, kn ? { knots: kn } : { order: 'stop' }, 2400); let w = 0; for (let n = 0; n < C.NN; n++) w += s.vol[n]; return w * C.RHO / 1000; };
  const w0 = water(0), w10 = water(10), w22 = water(22.5);
  row('CHECK', 'P5: a 0.2 m2 hole in the forepeak\'s side, held 10 min at 0, 10 and 22.5 knots: water aboard', f(w0, 0) + ', ' + f(w10, 0) + ', ' + f(w22, 0) + ' t (x' + f(w22 / w0, 2) + ')', 'more at speed: the bow wave near the stem (e24: x1.02, x1.34) [bet]', w10 >= w0 && w22 > 1.2 * w0 && w22 < 1.6 * w0);
}

// print
const W = [6, 66, 30];
console.log('P1 acceptance: the motion model (core/motion.js), fit ' + JSON.stringify(M.SHIP.fit));
for (const [kind, what, value, ref, ok] of rows) console.log((kind === 'MUST' ? (ok ? 'PASS ' : 'FAIL ') : (ok ? 'in   ' : 'OUT  ')) + what.padEnd(W[1]) + ' ' + String(value).padEnd(W[2]) + ' ' + ref);
console.log(fails ? 'FAIL: ' + fails + ' MUST row(s)' : 'PASS: every MUST row (' + rows.filter(r => r[0] === 'MUST').length + '); CHECK rows in range: ' + rows.filter(r => r[0] === 'CHECK' && r[4]).length + ' of ' + rows.filter(r => r[0] === 'CHECK').length);
process.exit(fails ? 1 : 0);
