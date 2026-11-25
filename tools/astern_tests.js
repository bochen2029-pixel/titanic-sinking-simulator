// M1 acceptance: the rudder with sternway (core/motion.js), and headway unchanged to the bit.
//   node tools/astern_tests.js            the table (a few seconds)
//   node tools/astern_tests.js --freeze   record the headway reference (out/headway_reference.json) from the code as
//                                         it stands; done once, before M1, on this machine
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const C = require('../core/core.js');
const Mo = require('../core/motion.js');
const N = require('../core/night.js');
const REF = path.join(__dirname, '..', 'out', 'headway_reference.json');
const DEG = Math.PI / 180, KN = Mo.KN;

// runs in which she never has sternway: their bits must not move
function digest(m, steps, each) {
  const h = crypto.createHash('sha256'); let uMin = 1e9;
  for (let k = 0; k < steps; k++) {
    if (each) each(m, k);
    Mo.stepAlone(m, 0.25); if (m.u < uMin) uMin = m.u;
    h.update(Buffer.from(new Float64Array([m.u, m.v, m.r, m.X, m.Y, m.psi, m.del, m.nP, m.nS, m.nC]).buffer));
  }
  return { digest: h.digest('hex'), uMin };
}
const RUNS = {
  'full ahead, hard to port, 10 min': () => { const m = Mo.create({ order: 'full ahead' }); Mo.rudder(m, -40); return digest(m, 2400); },
  'full ahead, hard to starboard, 10 min': () => { const m = Mo.create({ order: 'full ahead' }); Mo.rudder(m, 40); return digest(m, 2400); },
  'half ahead, 20 deg port then starboard': () => { const m = Mo.create({ order: 'half ahead' }); return digest(m, 2400, (mm, k) => Mo.rudder(mm, k < 1200 ? -20 : 20)); },
  'slow ahead, zigzag 10/10': () => { const m = Mo.create({ order: 'slow ahead' }); return digest(m, 2400, (mm, k) => Mo.rudder(mm, Math.floor(k / 240) % 2 ? 10 : -10)); },
  'crash stop from 22.5 kn to the moment she stops': () => { const m = Mo.create({ knots: 22.5 }); Mo.telegraph(m, 'full astern'); let k = 0; const h = crypto.createHash('sha256'); while (m.u > 0 && k < 4000) { Mo.stepAlone(m, 0.25); if (m.u > 0) h.update(Buffer.from(new Float64Array([m.u, m.v, m.r, m.X, m.Y, m.psi]).buffer)); k++; } return { digest: h.digest('hex'), uMin: 0, steps: k }; },
  'from Half ahead: port screw ahead, starboard astern, 5 min': () => { const m = Mo.create({ order: 'half ahead' }); Mo.telegraph(m, 'half astern', 'starboard'); return digest(m, 1200); },
};
function nightPrint(seed, steps) { const s = N.create(C.buildShip(), N.spec(seed), { auto: true }); let uMin = 1e9; while (s.night.k < steps) { N.step(s); if (s.mo.u < uMin) uMin = s.mo.u; } return { digest: N.fingerprint(s), uMin }; }
const NIGHTS = { 'the 1912 watch, auto, 387 steps': () => nightPrint(1912, 387), 'night 7, auto, 700 steps': () => nightPrint(7, 700) };

if (process.argv.includes('--freeze')) {
  const out = {}; for (const [k, f] of Object.entries(Object.assign({}, RUNS, NIGHTS))) out[k] = f();
  fs.writeFileSync(REF, JSON.stringify({ made: new Date().toISOString(), note: 'headway runs before M1; tools/astern_tests.js', runs: out }, null, 1) + '\n');
  console.log('frozen ' + Object.keys(out).length + ' runs to ' + REF); for (const [k, v] of Object.entries(out)) console.log('  ' + k.padEnd(52) + v.digest.slice(0, 16) + '  min u ' + v.uMin.toFixed(3));
  process.exit(0);
}

const rows = []; let fails = 0;
function row(kind, what, value, ref, ok) { rows.push([kind, what, value, ref, ok]); if (kind === 'MUST' && !ok) fails++; }
const f = (x, n) => x.toFixed(n === undefined ? 3 : n);
const ref = JSON.parse(fs.readFileSync(REF, 'utf8')).runs;
for (const [k, fn] of Object.entries(Object.assign({}, RUNS, NIGHTS))) {
  const r = fn(), same = r.digest === ref[k].digest;
  row('MUST', 'headway unchanged to the bit: ' + k, r.digest.slice(0, 12) + (r.uMin < 0 ? ' (had sternway!)' : ''), ref[k].digest.slice(0, 12) + ' (before M1)', same && r.uMin >= 0);
}
// sternway: backing under Half astern from rest, the rudder put over after two minutes
function backing(rudderDeg, secs) {
  const m = Mo.create({}); Mo.telegraph(m, 'half astern'); let rMax = 0;
  for (let k = 0; k < secs * 4; k++) { if (k === 480) Mo.rudder(m, rudderDeg); Mo.stepAlone(m, 0.25); if (k >= 480 && Math.abs(m.r) > Math.abs(rMax)) rMax = m.r; }
  return { m, rMax, sternLat: m.v - m.r * 0.5 * m.K.S.L };
}
const bs = backing(30, 360), bp = backing(-30, 360), b0 = backing(0, 360);
row('MUST', 'sternway, rudder 30 deg to starboard: her stern goes to starboard, her head to port', 'r ' + f(bs.rMax / DEG, 3) + ' deg/s; head ' + f(bs.m.psi / DEG, 1) + ' deg after 4 min; ' + f(bs.m.u / KN, 1) + ' kn', 'r < 0 (seamanship: with sternway the stern follows the rudder)', bs.rMax < -0.02 * DEG && bs.m.psi < 0);
row('MUST', 'sternway, rudder 30 deg to port: her head to starboard, the same amount', 'r ' + f(bp.rMax / DEG, 3) + ' deg/s; head ' + f(bp.m.psi / DEG, 1) + ' deg', 'r > 0, mirror of the above to 1e-9', bp.rMax > 0.02 * DEG && Math.abs(bp.m.psi + bs.m.psi) < 1e-9);
row('MUST', 'sternway with the rudder amidships: no turn at all', 'r ' + b0.m.r.toExponential(2) + ' rad/s; head ' + b0.m.psi.toExponential(2) + ' rad', '0 (before M1 the rudder law made a yaw of its own astern)', b0.m.r === 0 && b0.m.psi === 0);
// the answer at sternway is weaker than at headway, as shiphandlers find it
{
  const ah = Mo.create({}); ah.u = Math.abs(bs.m.u); Mo.rudder(ah, 30); ah.del = 30 * DEG; Mo.accelerations(ah, 0, 0, 0); const rAhead = ah.dr;
  const as = Mo.create({}); as.u = bs.m.u; Mo.rudder(as, 30); as.del = 30 * DEG; Mo.accelerations(as, 0, 0, 0); const rAstern = as.dr;
  row('CHECK', 'the rudder\'s turning moment astern, against ahead at the same speed, engines stopped', f(Math.abs(rAstern / rAhead), 2) + ' of it, opposite in sign', 'well under 1: the trailing edge leads and nothing straightens the flow [bet: half the lift slope]', Math.sign(rAstern) === -Math.sign(rAhead) && Math.abs(rAstern / rAhead) < 1);
}
// nothing undefined at or near zero speed, any rudder, any yaw rate
{
  let bad = 0;
  for (const u of [0, -1e-12, 1e-12, -0.01, 0.01, -0.2]) for (const v of [0, 0.3, -0.3]) for (const r of [0, 0.002, -0.002]) for (const d of [-40, 0, 40]) {
    const m = Mo.create({}); m.u = u; m.v = v; m.r = r; m.del = d * DEG; m.delCmd = m.del; Mo.accelerations(m, 0, 0, 0);
    if (![m.du, m.dv, m.dr].every(Number.isFinite)) bad++;
  }
  row('MUST', 'nothing undefined at or near zero speed (u, v, r, rudder on a grid of 486 states)', bad + ' states with NaN or infinity', '0', bad === 0);
}
// the crash stop goes on into sternway: the rudder amidships keeps her straight now
{
  const m = Mo.create({ knots: 22.5 }); Mo.telegraph(m, 'full astern');
  for (let k = 0; k < 4 * 400; k++) Mo.stepAlone(m, 0.25);
  row('MUST', 'crash stop from 22.5 kn run on to 400 s (into sternway), helm amidships: she keeps her head', f(m.u / KN, 1) + ' kn, head ' + m.psi.toExponential(2) + ' rad', 'head 0 exactly', m.u < 0 && m.psi === 0);
}
// the centre screw never turns astern: it was driven by a low-pressure steam turbine on the reciprocating engines'
// exhaust, with no astern stage, and reversing the engines cut it out ("it automatically cuts out the turbine",
// Wilding 1915; Cone 1912). Every order sequence, both shafts and each alone, astern and ahead, the rudder working.
{
  let minC = Infinity, inAstern = 0, steps = 0;
  const seqs = [['full ahead', 'full astern', 'half astern', 'full ahead'], ['half ahead', 'slow astern', 'stop', 'full astern'], ['full astern', 'half ahead', 'full astern', 'slow ahead']];
  for (const seq of seqs) for (const side of [undefined, 'port', 'starboard']) {
    const m = Mo.create({ knots: 22.5 }); Mo.rudder(m, 25);
    for (let i = 0; i < seq.length; i++) {
      Mo.telegraph(m, seq[i], side);
      for (let k = 0; k < 4 * 180; k++) {
        Mo.stepAlone(m, 0.25); steps++;
        if (m.nC < minC) minC = m.nC;
        if (m.turbine && (m.setP < 0 || m.setS < 0 || m.nP < 0 || m.nS < 0)) inAstern++;
      }
    }
  }
  row('MUST', 'the centre screw never turns astern, and the turbine is never in while an engine is astern', 'lowest centre rpm ' + f(minC, 3) + '; turbine in with an engine astern on ' + inAstern + ' of ' + steps + ' steps', 'at or above 0; 0 steps (a turbine with no astern stage)', minC >= 0 && inAstern === 0);
}

for (const [kind, what, value, ref2, ok] of rows) console.log((kind === 'MUST' ? (ok ? 'PASS ' : 'FAIL ') : (ok ? 'in   ' : 'OUT  ')) + what.padEnd(90) + ' ' + String(value).padEnd(46) + ' ' + ref2);
console.log(fails ? '\nFAIL: ' + fails + ' MUST row(s)' : '\nPASS: every MUST row (' + rows.filter(r => r[0] === 'MUST').length + '); CHECK rows in range: ' + rows.filter(r => r[0] === 'CHECK' && r[4]).length + ' of ' + rows.filter(r => r[0] === 'CHECK').length);
process.exit(fails ? 1 : 0);
