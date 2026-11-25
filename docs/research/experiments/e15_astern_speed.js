// e15: M4, astern thrust against speed. The handling consensus (docs/research/RESEARCH_handling_consensus_v1_2026-11-16.md,
// section 4 and rows 16, 18, 19) wants a crash stop whose distance depends only weakly on the speed she starts from:
//   914 m from 60 rpm [fitted]; from 75 rpm no more than about 945 m (Olympic, 1911: "rather less", best 884 m);
//   from half the speed about 0.82 of it (another, smaller ship: 19 kn to 9.5 kn cut it only about 15 %; Wilding 1915).
// Before M4 the model gave 1,203 m and 0.34: its astern law, |T| = K fA n^2 (1 + J / 1.48), borrowed the ahead quadrant's
// zero-thrust J for its speed term, and only fA was fitted. M4 puts in its place the measured shape of the B-series'
// crash-back quadrant (SHIP.astern in core/motion.js; docs/research/RESEARCH_propeller_four_quadrant_v1_2026-11-17.md).
// This experiment runs the stops under several shapes, each written the same way (a table of C_T* against
// x = atan2(Va, 0.7 pi |n| D), 0 to 90 degrees; the law before M4 and the drop-in 1 + 0.85 J^2 are put in that form too),
// fA refitted each time to 914.4 m from 60 rpm, in two readings of the trial:
//   A. the trial run with the usual handling (as before M4);
//   B. the trial run as Wilding described it, "reversed more slowly than usual" (tools/motion_trials.js TRIAL_1912), and
//      Olympic's stop with a prompt reversal (PROMPT, her engines "rather more smartly handled").
// The handling's other numbers stay as they stand; calibrate_motion.js refits them for the chosen law.
//   node docs/research/experiments/e15_astern_speed.js [repo root] [--write]       (about a minute)
// Output of 2026-11-17: results_2026-11-17/e15_astern_speed.txt
const fs = require('fs'), path = require('path');
const root = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : path.join(__dirname, '..', '..', '..');
const M = require(path.join(root, 'core', 'motion.js')), T = require(path.join(root, 'tools', 'motion_trials.js'));
const KN = M.KN, RHO = 1025, FIT = Object.assign({}, M.SHIP.fit), AST = M.SHIP.astern, TARGET = 914.4, K7 = 0.49 * Math.PI * Math.PI;
const out = [], log = (s) => { out.push(s); console.log(s); };
const f0 = (v, n) => (v === null || v === undefined || !isFinite(v) ? 'n/a' : v.toFixed(n === undefined ? 0 : n));
function bisect(g, lo, hi, n) { let glo = g(lo); const ghi = g(hi); if (!(isFinite(glo) && isFinite(ghi)) || (glo > 0) === (ghi > 0)) return null; for (let i = 0; i < n; i++) { const mid = 0.5 * (lo + hi), gm = g(mid); if ((gm > 0) === (glo > 0)) { lo = mid; glo = gm; } else hi = mid; } return 0.5 * (lo + hi); }
// a shape given as K_T(J) / K_T(0), put in the table's form: C_T* is K_T over (pi / 8) (J^2 + 0.49 pi^2)
const fromJ = (g) => [...Array(19).keys()].map(i => { const x = 5 * i; if (x === 90) return -g(Infinity); const J = 0.7 * Math.PI * Math.tan(x * Math.PI / 180); return -g(J) / (1 + J * J / K7); });
// the series' tables, beta 180 down to 90 (section 3 of the research note; the Titanic estimate is its section 5)
const SHAPES = [
  ['before M4: 1 + J / 1.48', fromJ(J => (J === Infinity ? 0 : 1 + J / 1.48)), false],
  ['B4-70 P/D 1.4, held (M4)', AST.ct, true],
  ['B4-70 P/D 1.4, not held', AST.ct, false],
  ['1 + 0.85 J^2 (drop-in), held', fromJ(J => (J === Infinity ? 0.85 * K7 : 1 + 0.85 * J * J)), true],
  ['Titanic estimate (EAR 0.37)', [-0.1860, -0.1702, -0.1593, -0.1956, -0.2507, -0.3307, -0.4004, -0.4680, -0.5342, -0.5669, -0.5904, -0.5684, -0.4976, -0.4339, -0.3899, -0.3558, -0.3338, -0.3137, -0.3010], true],
  ['B4-70 P/D 1.2', [-0.2192, -0.2103, -0.1838, -0.1978, -0.2921, -0.3725, -0.4220, -0.4767, -0.5212, -0.5832, -0.6458, -0.7118, -0.7614, -0.7505, -0.7295, -0.7041, -0.6887, -0.6895, -0.7092], true],
  ['B4-70 P/D 1.0', [-0.1792, -0.1719, -0.1486, -0.1764, -0.2648, -0.3285, -0.3826, -0.4391, -0.4918, -0.5592, -0.6202, -0.6812, -0.7313, -0.7550, -0.7559, -0.7402, -0.7299, -0.7329, -0.7719], true],
  ['B3-65 P/D 1.0', [-0.2095, -0.1997, -0.1555, -0.1666, -0.2562, -0.3352, -0.3792, -0.4635, -0.5422, -0.6223, -0.7137, -0.7773, -0.8064, -0.7536, -0.6812, -0.6458, -0.6395, -0.6435, -0.6660], true],
];
function withShape(ct, held, fn) { M.SHIP.astern = { ct, held }; try { return fn(); } finally { M.SHIP.astern = AST; } }
// one wing screw's astern pull at -75 rpm (MN) at a speed, and a held screw's drag at 18 kn, under the law in force
function pulls(fA) {
  const K = M.derive(FIT), p = K.scr[0], S = K.S, n = -1.25, As = S.astern, sh = (x) => { let i = Math.floor(x / 5); if (i > 17) i = 17; const f = (x - 5 * i) / 5; return (As.ct[i] + f * (As.ct[i + 1] - As.ct[i])) / As.ct[0]; };
  const at = (kn) => { const Va = kn * KN * (1 - S.wing.w), x = Math.atan2(Va, 0.7 * Math.PI * 1.25 * p.D) * 180 / Math.PI; return RHO * p.D4 * p.a * fA * sh(x) * (n * n + Va * Va / (K7 * p.D * p.D)) / 1e6; };
  const Va18 = 18 * KN * (1 - S.wing.w), held = As.held ? RHO * p.D4 * p.a * fA * sh(90) * Va18 * Va18 / (K7 * p.D * p.D) / 1e6 : 0;
  return [at(0), at(9), at(18), held];
}
function measure(ct, held, trialEngine) {
  return withShape(ct, held, () => {
    const fA = bisect(x => T.crashStop(Object.assign({}, FIT, { fA: x }), 60, trialEngine).dist - TARGET, 0.01, 4, 44);
    if (fA === null) return null;
    const f = Object.assign({}, FIT, { fA });
    return { fA, trial: T.crashStop(f, 60, trialEngine), u60: T.crashStop(f, 60), u75: T.crashStop(f, 75), p75: T.crashStop(f, 75, T.PROMPT), u30: T.crashStop(f, 30), rev: T.turnReversed(f, 74, 40), P: pulls(fA) };
  });
}
const HEAD = '                                 fA    trial time  usual 60  usual 75  prompt 75  30/60  37 s turn   pull at -75 rpm 0/9/18 kn; held at 18 kn (MN, one screw)';
function line(label, r) {
  if (!r) return label.padEnd(30) + 'no fA gives 914.4 m';
  return label.padEnd(30) + f0(r.fA, 4).padStart(7) + f0(r.trial.t).padStart(9) + ' s' + f0(r.u60.dist).padStart(8) + ' m' + f0(r.u75.dist).padStart(8) + ' m' + f0(r.p75.dist).padStart(9) + ' m' +
    f0(r.u30.dist / r.u60.dist, 3).padStart(7) + f0(r.rev.t225, 2).padStart(9) + ' s   ' + r.P.slice(0, 3).map(x => f0(x, 2)).join(' / ') + '; ' + f0(r.P[3], 2);
}
const t0 = Date.now();
log('e15: astern thrust against speed (M4), on core/motion.js as it stands: fit ' + JSON.stringify(FIT) + ', centre Cdw ' + M.SHIP.centre.Cdw + ', resistance shape ' + JSON.stringify(M.SHIP.resist.g.map(c => +c.toFixed(4))));
log('Each row: fA refitted so that the trial\'s crash stop from 60 rpm is 914.4 m. Targets (consensus): trial 180-210 s; usual 60 rpm 820-930 m (8.4);');
log('75 rpm, prompt reversal <= 945 m (best 884); 30/60 0.75-0.90; the 37 s turn is refitted afterwards (MUST within 1.5 s). The series\' astern bollard over');
log('ahead bollard at equal rpm is 0.66-0.96 (B4-70 P/D 1.4: 0.81, the Titanic estimate 0.71): a fitted fA far below about 0.6 points at the engine, not the screw');
let best = 0;
for (const [title, eng] of [['A. THE TRIAL WITH THE USUAL HANDLING (as before M4)', undefined], ['B. THE TRIAL "REVERSED MORE SLOWLY THAN USUAL" (TRIAL_1912 ' + JSON.stringify(T.TRIAL_1912) + '); OLYMPIC PROMPT (' + JSON.stringify(T.PROMPT) + ')', T.TRIAL_1912]]) {
  log('\n' + title + '\n' + HEAD);
  for (const [label, ct, held] of SHAPES) { const r = measure(ct, held, eng); if (r) best = Math.max(best, r.u30.dist / r.u60.dist); log(line(label, r)); }
}
log('\nthe largest ratio of the stop from 30 rpm to the stop from 60 rpm (usual handling) over every row: ' + f0(best, 3) + ' (the record\'s other ship: 0.80-0.85)');
log('\n(' + ((Date.now() - t0) / 1000).toFixed(0) + ' s; ' + new Date().toISOString() + ')');
if (process.argv.includes('--write')) {
  const dir = path.join(__dirname, 'results_2026-11-17');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, 'e15_astern_speed.txt'), out.join('\n') + '\n');
}
