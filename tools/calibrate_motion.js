// Fit the motion model's four free numbers to the handling consensus of the three sisters' record
// (docs/research/RESEARCH_handling_consensus_v1_2026-11-16.md, section 11; experiment e8):
//   uRk  factor on the rudder's inflow           } against: two points (22.5 deg) in 37 s from the order at 74 rpm, hard
//   cd   factor on the cross-flow drag            }          over WITH BOTH ENGINES RUNG FULL ASTERN at the same moment
//   kap  share of the centre screw's race         }          (Olympic 1912, BI 25292; Wilding 1915: "And reversed both
//        acceleration that reaches the rudder     }          engines."); a tactical diameter of 3,850 ft = 1,173.48 m at
//                                                            20 kn, both engines ahead (Titanic, 2 April 1912); and the
//                                                            circle at 11 kn (turbine out, as in service) 1.03 times the
//                                                            circle at 20 kn (Wilding: "only by a very small amount")
//   fA   factor on astern thrust                    against: way off in "just over 3,000 feet" (914.4 m) from about
//                                                            60 rpm, both engines reversed (BI 25295), "more slowly than
//                                                            usual" (M4: run with T.TRIAL_1912's handling)
// Until M2 (2026-11-16) the 37 s was fitted as a turn with the helm alone and kap was MMG's typical 0.5; with kap 0.5 no
// drag gives 37 s reversed and the trial circle together (e8): the model leaned on the centre screw's race far more than
// the record allows. Run: node tools/calibrate_motion.js  (a minute or two). Paste the result into SHIP.fit in core/motion.js.
const T = require('./motion_trials.js');
const TARGET = { t225rev: 37, tact: 1173.48, ratio11: 1.03, stop: 914.4 };
function bisect(g, lo, hi, n) { let glo = g(lo); const ghi = g(hi); if (!(isFinite(glo) && isFinite(ghi)) || (glo > 0) === (ghi > 0)) return null; for (let i = 0; i < n; i++) { const mid = 0.5 * (lo + hi), gm = g(mid); if ((gm > 0) === (glo > 0)) { lo = mid; glo = gm; } else hi = mid; } return 0.5 * (lo + hi); }
const t0 = Date.now();
let fA = 0.518, fit = null;
for (let it = 0; it < 8; it++) {
  // innermost: uRk for 37 s reversed; then cd for the trial circle; then kap for the 11-kn circle
  const uRkFor = (kap, cd) => bisect(u => { const t = T.turnReversed({ uRk: u, cd, fA, kap }, 74, 40).t225; return (t === null ? 1e3 : t) - TARGET.t225rev; }, 0.4, 8, 28);
  const cdFor = (kap) => bisect(c => { const u = uRkFor(kap, c); return u === null ? NaN : T.turn({ uRk: u, cd: c, fA, kap }, 20, 40).tact - TARGET.tact; }, 0.05, 12, 26);
  const ratio = (kap) => { const cd = cdFor(kap); if (cd === null) return NaN; const u = uRkFor(kap, cd), f = { uRk: u, cd, fA, kap }; return T.turn(f, 11, 40).tact / T.turn(f, 20, 40).tact - TARGET.ratio11; };
  const kap = bisect(ratio, 0, 0.2, 22);         // above about 0.25 no drag gives the trial circle with 37 s reversed (e8)
  if (kap === null) { console.log('no kap in 0..0.2 gives the 11-kn circle'); process.exit(1); }
  const cd = cdFor(kap), uRk = uRkFor(kap, cd);
  const fA2 = bisect(a => T.crashStop({ uRk, cd, fA: a, kap }, 60, T.TRIAL_1912).dist - TARGET.stop, 0.05, 3, 32);
  const done = Math.abs(fA2 - fA) < 1e-5; fA = fA2; fit = { uRk, cd, fA, kap };
  console.log('pass ' + (it + 1) + ': ' + JSON.stringify(fit));
  if (done) break;
}
const r = (x, n) => +x.toFixed(n);
const out = { uRk: r(fit.uRk, 4), cd: r(fit.cd, 4), fA: r(fit.fA, 4), kap: r(fit.kap, 4) };
const a = T.turnReversed(out, 74, 40), h = T.turn(out, 21.5, 40), b = T.turn(out, 20, 40), c = T.turn(out, 11, 40), s = T.crashStop(out, 60, T.TRIAL_1912);
console.log('fit (' + ((Date.now() - t0) / 1000).toFixed(0) + ' s):', JSON.stringify(out));
console.log('  two points at 74 rpm, engines reversed with the helm:', a.t225.toFixed(2), 's (target 37); helm only at 21.5 kn:', h.t225.toFixed(2), 's');
console.log('  tactical diameter at 20 kn:', b.tact.toFixed(1), 'm (target 1,173.5); at 11 kn:', c.tact.toFixed(1), 'm, ratio', (c.tact / b.tact).toFixed(3), '(target 1.03)');
console.log('  crash stop from 60 rpm (' + s.kn0.toFixed(2) + ' kn), the trial\'s slow reversal:', s.dist.toFixed(1), 'm in', s.t.toFixed(0), 's (targets 914.4 m; 195 s, not fitted)');
