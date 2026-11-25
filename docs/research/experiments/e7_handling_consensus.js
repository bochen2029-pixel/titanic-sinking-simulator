// e7: can the motion model honour all three of the sisters' turning records at once?
//   two points (22.5 deg) in 37 s at 21.5 kn (Olympic, 1912; BI 25292), a tactical diameter of 3,850 ft (1,173 m) and an
//   advance of about 2,100 ft (640 m), "2 1/2 lengths" (672 m) (Titanic's trial, 2 April 1912, at about 30 ft draft;
//   Wilding, Limitation of Liability 1915). Written for Bo's ask of 2026-11-16 (fit the handling to a consensus of the
//   three sisters' public data). It changes nothing: it patches a temporary copy of core/motion.js with scale knobs on
//   the hull's terms and refits uRk and cd (as tools/calibrate_motion.js does) to hold the first two records.
//   node docs/research/experiments/e7_handling_consensus.js [repo root]
// Output of 2026-11-16: results_2026-11-16/e7_handling_consensus.txt
const fs = require('fs'), os = require('os'), path = require('path');
const root = process.argv[2] || path.join(__dirname, '..', '..', '..');
const src = fs.readFileSync(path.join(root, 'core', 'motion.js'), 'utf8');
const coreReq = "require('./core.js')", anchor = '    const lam = S.rudder.H * S.rudder.H / S.rudder.A;';
if (src.split(coreReq).length !== 2 || src.split(anchor).length !== 2) throw new Error('core/motion.js changed: the patch anchors are not unique');
const knobbed = src.replace(coreReq, 'require(' + JSON.stringify(path.join(root, 'core', 'core.js')) + ')').replace(anchor,
  "    { const KX = global.__E7 || {}; H.Xvr *= KX.xvr || 1; H.NR *= KX.nr || 1; H.Nv *= KX.nv || 1; H.Yv *= KX.yv || 1; H.YR *= KX.yr || 1; H.Jz *= KX.jz || 1; H.my *= KX.my || 1; }\n" + anchor);
const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'e7-')), 'motion_e7.js');
fs.writeFileSync(tmp, knobbed);
const M = require(tmp);
const KN = M.KN, DEG = M.DEG, DT = 0.25, FT = 0.3048, f = (v, n) => v.toFixed(n === undefined ? 0 : n);

function turn(fit, kn, deltaDeg) {                          // helm hard over from a steady run; as tools/motion_trials.js
  const m = M.create({ fit, knots: kn });
  M.rudder(m, deltaDeg);
  const o = { t225: null, x225: null, adv: null, tact: null, xHelm: null, tHelm: null };
  while (m.t < 1800) {
    M.stepAlone(m, DT);
    const a = Math.abs(m.psi) / DEG;
    if (o.tHelm === null && Math.abs(Math.abs(m.del) - Math.abs(deltaDeg) * DEG) < 1e-9) { o.tHelm = m.t; o.xHelm = m.X; }
    if (o.t225 === null && a >= 22.5) { o.t225 = m.t; o.x225 = m.X; }
    if (o.adv === null && a >= 90) { o.adv = m.X; o.trans = Math.abs(m.Y); }
    if (o.tact === null && a >= 180) o.tact = Math.abs(m.Y);
    if (a >= 400) break;
  }
  const U = Math.sqrt(m.u * m.u + m.v * m.v);
  o.ratio = U / (kn * KN); o.rate = Math.abs(m.r) / DEG; o.advHelm = o.adv - o.xHelm;
  return o;
}
function bisect(g, lo, hi, n) { let glo = g(lo); const ghi = g(hi); if ((glo > 0) === (ghi > 0)) return null; for (let i = 0; i < n; i++) { const mid = 0.5 * (lo + hi), gm = g(mid); if ((gm > 0) === (glo > 0)) { lo = mid; glo = gm; } else hi = mid; } return 0.5 * (lo + hi); }
function fitTwo() {                                          // uRk for 37 s at 21.5 kn inside, cd for 1,173.48 m at 20 kn outside
  const uRkFor = (cd) => bisect(u => turn({ uRk: u, cd, fA: 0.518 }, 21.5, 40).t225 - 37, 0.5, 4, 24);
  const cd = bisect(c => { const u = uRkFor(c); return u === null ? NaN : turn({ uRk: u, cd: c, fA: 0.518 }, 20, 40).tact - 1173.48; }, 0.05, 12, 22);
  return cd === null || isNaN(cd) ? null : { uRk: uRkFor(cd), cd, fA: 0.518 };
}
function line(name, fit) {
  const a = turn(fit, 21.5, 40), b = turn(fit, 20, 40);
  return name.padEnd(30) + 'uRk ' + f(fit.uRk, 3) + ' cd ' + f(fit.cd, 3) + ' | two points ' + f(a.t225, 1) + ' s, run ' + f(a.x225) + ' m | tactical ' + f(b.tact) + ' m, advance ' + f(b.adv) + ' m (' + f(b.advHelm) + ' from the helm hard over), speed held ' + f(b.ratio, 2) + ', rate ' + f(b.rate, 2) + ' deg/s';
}

console.log('RECORDS: two points in 37 s at 21.5 kn, run 366-396 m (Olympic 1912); tactical 1,158-1,189 m; advance 640 m (2,100 ft) or 672 m (2 1/2 lengths) (Titanic 1912, about 30 ft draft)');
console.log('\n1. THE FIT AS IT IS, AND REFITTED (uRk, cd) WITH EACH HULL TERM SCALED: does any one of them bring the advance to 640-672 m?');
global.__E7 = {};
console.log(line('as fitted (core/motion.js)', { uRk: M.SHIP.fit.uRk, cd: M.SHIP.fit.cd, fA: M.SHIP.fit.fA }));
const knobs = { nr: [0.6, 0.8, 1.25], jz: [0.5, 0.75, 1.5], xvr: [0, 0.5, 1.5, 2], nv: [0.6, 0.8, 1.25, 1.5], yv: [0.6, 0.8, 1.25, 1.6], yr: [0.5, 1.5, 2], my: [0.6, 1.5] };
let lo = 1e9, hi = -1e9;
for (const [k, vals] of Object.entries(knobs)) for (const v of vals) {
  global.__E7 = { [k]: v };
  const fit = fitTwo();
  if (!fit) { console.log((k + ' x ' + v).padEnd(30) + 'cannot hold 37 s and 1,173 m'); continue; }
  const b = turn(fit, 20, 40); lo = Math.min(lo, b.adv); hi = Math.max(hi, b.adv);
  console.log(line(k + ' x ' + v, fit));
}
global.__E7 = {};
console.log('   -> with 37 s and 1,173 m held, the advance from the order stays between ' + f(lo) + ' and ' + f(hi) + ' m');

console.log('\n2. THE TRIAL\'S OWN CONDITION: about 30 ft draft against the night\'s 32.25 ft (lighter by the mean 144 tons per inch [bet])');
const BASE = { d: M.SHIP.d, m: M.SHIP.m }, tons = (32.25 - 30) * 12 * 144;
const fit0 = { uRk: M.SHIP.fit.uRk, cd: M.SHIP.fit.cd, fA: M.SHIP.fit.fA };
console.log(line('the night (9.83 m)', fit0));
M.SHIP.d = 30 * FT; M.SHIP.m = BASE.m - tons * 1016.05;
console.log(line('trial draft (30 ft, -' + f(tons) + ' tons)', fit0));
Object.assign(M.SHIP, BASE);
console.log('   (the helm is hard over 10 s after the order at 4 deg/s; an advance taken from then is about 100 m shorter at 20 kn)');
fs.rmSync(path.dirname(tmp), { recursive: true, force: true });
