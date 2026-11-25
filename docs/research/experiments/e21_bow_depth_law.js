// e21: S1b, the bow's crushing force against depth. A stem strike head-on (the berg centred on her track, no helm, the
// engines left as they are until 60 s after the touch) at 6.2, 10, 15 and 22.5 knots, the crush read from the encounter
// (`summary().bow.crush`), under three laws:
//   constant  F = 120 MN (S1, the committed law until S1b)
//   B         F = 84 MN + 2.5 MN a metre of crush (the bow-crushing note's option B: the mean of four section-based laws,
//             static 49 + 1.5 s MN, times a rate factor of 1.7)
// each against the free 100,000-t berg (the model's) and against a fixed face (a berg of 1e15 kg), beside the note's
// figures (docs/research/RESEARCH_bow_crushing_head_on_v1_2026-11-17.md, sections 3.6 and 6: fixed face, 5 % added mass).
//   node docs/research/experiments/e21_bow_depth_law.js [--write]
// Output of 2026-11-17: results_2026-11-17/e21_bow_depth_law.txt
const fs = require('fs'), path = require('path');
const E = require('../../../core/encounter.js');
const { encounter } = require('../../../tools/encounter_run.js');
const out = [], log = (s) => { out.push(s); console.log(s); };
const f = (v, n) => (v === null || v === undefined ? 'n/a' : v.toFixed(n === undefined ? 1 : n));
const LAWS = { constant: { bowF: 120e6, bowFk: 0 }, B: { bowF: 84e6, bowFk: 2.5e6 } };
// the note's figures: fixed face; constant 120 MN (section 3.6 and 6), B (section 6), section-based laws with rate (3.6)
const NOTE = {
  6.2: { constant: 2.2, B: null, laws: '2.3-5.0', fe: '14.8' },
  10: { constant: 5.7, B: 7.3, laws: '5.5-11.5', fe: '24.7' },
  15: { constant: 12.8, B: null, laws: '11.7-19.9', fe: '33.3' },
  22.5: { constant: 28.7, B: 28.8, laws: 'Wilding 24-30', fe: '52.5 (22 kn)' },
};
function strike(kn, law, fixed) {
  const ice = Object.assign({}, LAWS[law], fixed ? { mass: 1e15 } : {});
  const sim = encounter({ ahead: 200, port: E.ICE.R, helm: null, knots: kn, ice, encounterSecs: 200 });   // the berg's centre on her track
  const s = E.summary(sim);
  return { crush: s.bow.crush, kind: s.kind, Fmax: s.Fmax, dur: s.dur };
}
log('e21: the stem strike head-on, crush in metres (the model; the note\'s fixed-face figures in brackets)');
log('  knots   face    constant 120 MN        B: 84 + 2.5 s MN       section laws (rate)   FE (Paik et al.)');
const rows = [];
for (const kn of [6.2, 10, 15, 22.5]) {
  for (const fixed of [true, false]) {
    const a = strike(kn, 'constant', fixed), b = strike(kn, 'B', fixed), n = NOTE[kn];
    rows.push({ kn, fixed, a, b });
    log('  ' + f(kn).padStart(5) + '   ' + (fixed ? 'fixed' : 'free ') + '   ' + (f(a.crush, 1) + ' m' + (fixed ? ' [' + f(n.constant) + ']' : '')).padEnd(22) + ' ' +
      (f(b.crush, 1) + ' m' + (fixed && n.B !== null ? ' [' + f(n.B) + ']' : '')).padEnd(22) + ' ' + (fixed ? n.laws.padEnd(21) + ' ' + n.fe : ''));
  }
}
const r10 = rows.find((r) => r.kn === 10 && !r.fixed), r225 = rows.find((r) => r.kn === 22.5 && !r.fixed);
log('\nAgainst the free berg (the game\'s case): at 10 knots B crushes ' + f(r10.b.crush) + ' m (constant ' + f(r10.a.crush) + ');');
log('at 22.5 knots ' + f(r225.b.crush) + ' m (constant ' + f(r225.a.crush) + '; the note: 22.8 and 21.4 m).');
if (process.argv.includes('--write')) {
  const dir = path.join(__dirname, 'results_2026-11-17');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, 'e21_bow_depth_law.txt'), out.join('\n') + '\n');
}
