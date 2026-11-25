// e34: more runs of the fall prototype (e33), for docs/BRAINSTORM_the_descent_to_the_bed_v2_2026-11-19.md (section
// 4.4): what decides the bow's travel and how she arrives. A scratch experiment; every coefficient is a stated bet.
//   node docs/research/experiments/e34_fall_prototype_whatifs.js [TREE]
// Output of 2026-11-19, on the committed tree a97a6bd: results_2026-11-19/e34_fall_prototype_whatifs.txt
'use strict';
const path = require('path');
const P = require(path.join(__dirname, 'e33_fall_prototype.js'));
const { body, run, line, GI, f, S } = P;
const XB = GI.X_BREAK;
// a run of a body whose weight is moved along her by `shift` metres (the lever between her weight in water and her
// plan's middle). The slices are shared, so the weights are put back only after the run (a first version of this put
// them back before it, and so measured nothing: its table of 13:44 CST was void and is not in the results).
function shiftedRun(x0, x1, opt, shift, init) {
  const st = S.filter(s => s.x >= x0 && s.x < x1);
  let m = 0, mx = 0; for (const s of st) { m += s.ms; mx += s.ms * s.x; }
  const xc = mx / m; let i2 = 0; for (const s of st) i2 += s.ms * (s.x - xc) * (s.x - xc);
  const k = shift * m / i2, keep = st.map(s => s.ms);
  st.forEach((s) => { s.ms = s.ms * (1 + k * (s.x - xc)); });
  const r = run(body(x0, x1, opt), init);
  st.forEach((s, i) => { s.ms = keep[i]; });
  return r;
}
// the research note's coefficients (docs/research/RESEARCH_falling_hull_physics_v1_2026-11-19.md, sections 1.2 and 1.3):
// cross-flow drag keel-on 1.1 (0.8 to 1.4) and deck-on 1.3; the rectangle's added mass 1.45 with the spheroid's end
// correction (0.90 bow, 0.87 stern); a faired end first 0.25 (0.15 to 0.35), a torn end first 0.95; friction 1.8e-3;
// along her 8 % (bow) and 12 % (stern) of her displaced mass
const KR6 = { bow: { cdKeel: 1.1, cdDeck: 1.3, cm: 1.45, k3d: 0.90, k1: 0.08, cdNose: 0.25, cdBlunt: 0.95, cf: 0.0018, lift: 1 },
  stern: { cdKeel: 1.1, cdDeck: 1.3, cm: 1.45, k3d: 0.87, k1: 0.12, cdNose: 0.25, cdBlunt: 0.95, cf: 0.0018, lift: 1 } };
console.log('== THE BOW FROM THE RECORD\'S BREAK (trim 11 to 25 deg) AND FROM THE MODEL\'S FLAG (69 deg)');
const bow = body(XB, 1e9, { name: 'bow', bluntAft: true });
for (const th of [-11, -17, -25, -69]) line('bow, ' + (-th) + ' deg nose down', run(bow, { depth: th === -69 ? 80 : 30, th, u: th === -69 ? 1.2 : 2 }));
line('bow, 69 deg, with its 12,641 m3 of air kept (at x 0)', run(body(XB, 1e9, { name: 'bow', bluntAft: true, air: 12641, xAir: 0 }), { depth: 80, th: -69, u: 1.2 }));
console.log('\n== THE LEVER: her weight moved along her (bow, 17 deg nose down)');
for (const sh of [-3, -1.5, 0, 1.5, 3, 6]) line('bow, weight ' + (sh >= 0 ? '+' : '') + sh + ' m (' + (sh >= 0 ? 'forward' : 'aft') + ')', shiftedRun(XB, 1e9, { name: 'bow', bluntAft: true }, sh, { depth: 30, th: -17, u: 2 }));
console.log('  the same with no lift at the blunt end (the lever alone, held by Munk\'s moment):');
for (const sh of [0, 3, 6, 10]) line('  bow, no lift, weight +' + sh + ' m', shiftedRun(XB, 1e9, { name: 'bow', bluntAft: true, K: { lift: 0 } }, sh, { depth: 30, th: -17, u: 2 }));
console.log('\n== THE STERN: its weight moved along it (broken end 70 deg down, wholly flooded)');
for (const sh of [-6, -3, 0, 3]) line('stern, weight ' + (sh >= 0 ? '+' : '') + sh + ' m', shiftedRun(-1e9, XB, { name: 'stern', bluntFwd: true }, sh, { depth: 60, th: -70, u: 1 }));
console.log('\n== WITH THE RESEARCH NOTE\'S COEFFICIENTS (its sections 1.2 and 1.3) in place of the first bets');
for (const th of [-11, -17, -25, -45]) line('bow, ' + (-th) + ' deg nose down', run(body(XB, 1e9, { name: 'bow', bluntAft: true, K: KR6.bow }), { depth: 30, th, u: 2 }));
line('bow, 17 deg, cross-flow drag 0.8', run(body(XB, 1e9, { name: 'bow', bluntAft: true, K: Object.assign({}, KR6.bow, { cdKeel: 0.8 }) }), { depth: 30, th: -17, u: 2 }));
line('bow, 17 deg, cross-flow drag 1.4', run(body(XB, 1e9, { name: 'bow', bluntAft: true, K: Object.assign({}, KR6.bow, { cdKeel: 1.4 }) }), { depth: 30, th: -17, u: 2 }));
line('bow, 17 deg, no lift at the blunt end', run(body(XB, 1e9, { name: 'bow', bluntAft: true, K: Object.assign({}, KR6.bow, { lift: 0 }) }), { depth: 30, th: -17, u: 2 }));
line('bow, 69 deg (the model\'s flag)', run(body(XB, 1e9, { name: 'bow', bluntAft: true, K: KR6.bow }), { depth: 80, th: -69, u: 1.2 }));
for (const th of [-85, -70, -45]) line('stern, broken end ' + (-th) + ' deg down', run(body(-1e9, XB, { name: 'stern', bluntFwd: true, K: KR6.stern }), { depth: 60, th, u: 1 }));
console.log('\n== HOW FAST THE PITCHING DIES (bow, 17 deg): her angle every 15 s for the first 4 minutes');
const r = run(bow, { depth: 30, th: -17, u: 2 }, { every: 15 });
console.log('  ', r.rows.slice(0, 17).map(q => f(q[0], 0) + 's ' + f(q[3], 1)).join('  '));
console.log('\n== THE WEIGHT IN WATER: the bow at 17 deg with her solids lighter or heavier (cross-flow drag as set)');
for (const k of [0.85, 1.0, 1.15]) {
  const keep = S.map(s => s.sol); S.forEach(s => { s.sol = s.sol * (2 - k); });
  line('bow, solids x ' + f(2 - k, 2), run(body(XB, 1e9, { name: 'bow', bluntAft: true }), { depth: 30, th: -17, u: 2 }));
  S.forEach((s, i) => { s.sol = keep[i]; });
}
