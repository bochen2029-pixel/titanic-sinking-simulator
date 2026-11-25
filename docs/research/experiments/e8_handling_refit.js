// e8: the motion model refitted to the handling consensus (docs/research/RESEARCH_handling_consensus_v1_2026-11-16.md,
// section 11), before anything in core/motion.js changes. Fit, four figures:
//   1. tactical diameter 1,173.48 m at 20 kn, hard over, both engines ahead (turbine in)
//   2. two points (22.5 deg) in 37 s at 74 rpm, hard over WITH BOTH ENGINES RUNG FULL ASTERN AT THE SAME MOMENT (Conflict 1)
//   3. crash stop 914.4 m from 60 rpm, helm amidships
//   4. Slow ahead (30 rpm, turbine out) 8.6 kn, through the trailing centre screw's drag Cdw (optional in the note)
// then every check band of section 11. Free: uRk, cd, fA (core/motion.js SHIP.fit) and centre.Cdw.
//   node docs/research/experiments/e8_handling_refit.js [repo root]
// Output of 2026-11-16: results_2026-11-16/e8_handling_refit.txt
const path = require('path');
const root = process.argv[2] || path.join(__dirname, '..', '..', '..');
const M = require(path.join(root, 'core', 'motion.js'));
const KN = M.KN, DEG = M.DEG, DT = 0.25, f = (v, n) => (v === null || v === undefined ? 'n/a' : v.toFixed(n === undefined ? 0 : n));
const BASE_CENTRE = Object.assign({}, M.SHIP.centre);
const setCdw = (c) => { M.SHIP.centre = Object.assign({}, BASE_CENTRE, { Cdw: c }); };

function turn(fit, start, deltaDeg, reverse) {               // start: { knots } or { rpm }
  const m = M.create(Object.assign({ fit }, start));
  M.rudder(m, deltaDeg);
  if (reverse) M.telegraph(m, 'full astern');
  const o = { t225: null, x225: null, adv: null, tact: null, xHelm: null };
  while (m.t < 2400) {
    M.stepAlone(m, DT);
    const a = Math.abs(m.psi) / DEG;
    if (o.xHelm === null && Math.abs(Math.abs(m.del) - Math.abs(deltaDeg) * DEG) < 1e-9) o.xHelm = m.X;
    if (o.t225 === null && a >= 22.5) { o.t225 = m.t; o.x225 = m.X; if (reverse) break; }
    if (o.adv === null && a >= 90) { o.adv = m.X; o.trans = Math.abs(m.Y); }
    if (o.tact === null && a >= 180) o.tact = Math.abs(m.Y);
    if (a >= 400) break;
    if (reverse && m.u <= 0) break;
  }
  const U = Math.sqrt(m.u * m.u + m.v * m.v);
  o.ratio = U / ((start.knots || 0) * KN); o.rate = Math.abs(m.r) / DEG; o.U = U;
  o.heelProxy = U * Math.abs(m.r);
  o.advHelm = o.adv === null ? null : o.adv - o.xHelm;
  return o;
}
function crashStop(fit, rpm) {
  const m = M.create({ fit, rpm }), u0 = m.u; M.telegraph(m, 'full astern');
  let tAstern = null, tHard = null;
  while (m.u > 0 && m.t < 900) { M.stepAlone(m, DT); if (tAstern === null && m.nP < 0) tAstern = m.t; if (tHard === null && m.nP <= -0.95 * 75) tHard = m.t; }
  return { kn0: u0 / KN, t: m.t, dist: m.X, tAstern, tHard };
}
const steadyKn = (rpm) => M.create({ fit: {}, rpm }).u / KN;     // a fit override forces the constants to be derived anew (Cdw)
function bisect(g, lo, hi, n) { let glo = g(lo); const ghi = g(hi); if (!(isFinite(glo) && isFinite(ghi)) || (glo > 0) === (ghi > 0)) return null; for (let i = 0; i < n; i++) { const mid = 0.5 * (lo + hi), gm = g(mid); if ((gm > 0) === (glo > 0)) { lo = mid; glo = gm; } else hi = mid; } return 0.5 * (lo + hi); }

function fitAll(opts) {                                     // uRk and cd (and fA) with kappa held at opts.kap
  const reverse = opts.reverse, kap = opts.kap;
  let fA = 0.518, fit = null;
  for (let it = 0; it < 6; it++) {
    const t225 = (u, cd) => turn({ uRk: u, cd, fA, kap }, { rpm: 74 }, 40, reverse).t225;
    const uRkFor = (cd) => bisect(u => { const t = t225(u, cd); return t === null ? 1e3 : t - 37; }, 0.4, 6, 26);
    const cd = bisect(c => { const u = uRkFor(c); return u === null ? NaN : turn({ uRk: u, cd: c, fA, kap }, { knots: 20 }, 40, false).tact - 1173.48; }, 0.05, 15, 24);
    if (cd === null) return null;
    const uRk = uRkFor(cd);
    const fA2 = bisect(a => crashStop({ uRk, cd, fA: a, kap }, 60).dist - 914.4, 0.05, 3, 30);
    if (fA2 === null) return null;
    const done = Math.abs(fA2 - fA) < 1e-4; fA = fA2; fit = { uRk, cd, fA, kap };
    if (done) break;
  }
  return fit;
}
function checks(name, fit) {
  const helm = turn(fit, { rpm: 74 }, 40, false), rev = turn(fit, { rpm: 74 }, 40, true), c20 = turn(fit, { knots: 20 }, 40, false);
  const c11 = turn(fit, { knots: 11 }, 40, false), s60 = crashStop(fit, 60), s75 = crashStop(fit, 75), s30 = crashStop(fit, 30);
  const row = (what, v, band, ok) => console.log('   ' + (ok ? 'in ' : 'OUT') + ' ' + what.padEnd(58) + String(v).padEnd(22) + band);
  console.log('\n' + name + ': uRk ' + f(fit.uRk, 3) + ', cd ' + f(fit.cd, 3) + ', fA ' + f(fit.fA, 3) + ', kappa ' + f(fit.kap, 4) + ', centre Cdw ' + f(M.SHIP.centre.Cdw, 3));
  row('[fit] two points, 74 rpm, engines reversed with the helm', f(rev.t225, 1) + ' s', '37 s (35-39)', rev.t225 >= 35 && rev.t225 <= 39);
  row('[fit] tactical diameter at 20 kn', f(c20.tact) + ' m', '1,173 m (1,158-1,189)', c20.tact >= 1158 && c20.tact <= 1189);
  row('[fit] crash stop from 60 rpm', f(s60.dist) + ' m', '914 m (853-945)', s60.dist >= 853 && s60.dist <= 945);
  row('two points, 74 rpm, helm only', f(helm.t225, 1) + ' s', '30-37 s expected (sensitivity)', helm.t225 >= 30 && helm.t225 <= 37.5);
  row('distance in the two points (reversed / helm only)', f(rev.x225) + ' / ' + f(helm.x225) + ' m', '366-402 m', rev.x225 >= 366 && rev.x225 <= 402);
  row('advance at 20 kn from the order', f(c20.adv) + ' m', '700-885 m', c20.adv >= 700 && c20.adv <= 885);
  row('advance at 20 kn from the helm hard over', f(c20.advHelm) + ' m', '580-700 m', c20.advHelm >= 580 && c20.advHelm <= 700);
  row('speed held in the steady turn, 20 kn', f(c20.ratio, 2), '0.65-0.82', c20.ratio >= 0.65 && c20.ratio <= 0.82);
  row('steady rate, 20 kn', f(c20.rate, 2) + ' deg/s', '0.65-0.88', c20.rate >= 0.65 && c20.rate <= 0.88);
  const ratio11 = c11.tact / c20.tact;
  row('circle at 11 kn (turbine out, as in service) / at 20 kn', f(ratio11, 2) + ' (' + f(c11.tact) + ' m)', '1.00-1.10', ratio11 >= 1 && ratio11 <= 1.1);
  row('two points at 11 kn, helm only', f(c11.t225, 1) + ' s', '60-80 s', c11.t225 >= 60 && c11.t225 <= 80);
  row('crash stop: time to way off', f(s60.t) + ' s', '180-210 s', s60.t >= 180 && s60.t <= 210);
  row('crash stop: engines astern after / backing hard after', f(s60.tAstern) + ' / ' + f(s60.tHard) + ' s', '10-22 s / 40-70 s', s60.tAstern >= 10 && s60.tAstern <= 22 && s60.tHard >= 40 && s60.tHard <= 70);
  row('stop from 75 rpm (Olympic 1911, prompt reversal)', f(s75.dist) + ' m', 'no more than about 945 m', s75.dist <= 945);
  row('stop from 30 rpm / from 60 rpm (half-speed ratio)', f(s30.dist / s60.dist, 2), '0.75-0.90 (another ship)', s30.dist / s60.dist >= 0.75 && s30.dist / s60.dist <= 0.9);
  const sl = steadyKn(30), hf = steadyKn(50), s6 = steadyKn(60), s74 = steadyKn(74), s75k = steadyKn(75);
  row('speed at Slow (30 rpm, turbine out)', f(sl, 2) + ' kn', '8.2-9.2', sl >= 8.2 && sl <= 9.2);
  row('speed at Half (50 rpm, turbine in)', f(hf, 2) + ' kn', '14.9-15.9', hf >= 14.9 && hf <= 15.9);
  row('speed at 60 / 74 / 75 rpm', f(s6, 2) + ' / ' + f(s74, 2) + ' / ' + f(s75k, 2) + ' kn', '17.3-18.0 / 21.4-21.9 / 21.75-22.3', s6 >= 17.3 && s6 <= 18 && s74 >= 21.4 && s74 <= 21.9 && s75k >= 21.75 && s75k <= 22.3);
  return { helm, rev, c20, c11, s60 };
}

console.log('e8: the handling against the consensus (RESEARCH_handling_consensus_v1, section 11), before and after M2');
checks('A. P1\'S FIT (the 37 s as a turn with the helm alone, kappa 0.5)', { uRk: 1.60, cd: 2.7, fA: 0.518, kap: 0.5 });
const B = fitAll({ reverse: true, kap: 0.5 });
if (B) checks('B. REFIT WITH KAPPA HELD AT 0.5, 37 s WITH THE ENGINES REVERSED', B);
else console.log('\nB. REFIT WITH KAPPA HELD AT 0.5, 37 s WITH THE ENGINES REVERSED: no uRk and cd give both the 37 s and the trial circle');
checks('C. M2\'S FIT (core/motion.js now: tools/calibrate_motion.js, kappa fitted to the 11-kn circle)', Object.assign({}, M.SHIP.fit));
// the trailing centre screw's drag (a bet) against Slow ahead 8.6 kn
const cdw = bisect(c => { setCdw(c); return steadyKn(30) - 8.6; }, 0, 0.25, 30);
setCdw(0); const slow0 = steadyKn(30); setCdw(BASE_CENTRE.Cdw);
console.log('\nCentre screw drag for Slow = 8.6 kn: ' + (cdw === null ? 'not reachable with 0 <= Cdw <= 0.25 (with no drag at all: ' + f(slow0, 2) + ' kn): BACKLOG M3' : f(cdw, 4)));
