// e118 (B1+B2, 2026-11-23, at Z1's ask for G12's way up): the after watertight bulkheads K, L, M, N and O, each one's head
// of water at collapse from its scantlings, for the fall's per-bulkhead heads (Z1: K.headBulkheads by id, in place of
// K.headBulkhead's 15 m [8 to 30]). A note beside it says where every number comes from:
// docs/research/RESEARCH_after_bulkheads_heads_v1_2_2026-11-23.md (v1 and v1.1 beside it). Section 6 sets them against
// Bo's submarine spec's flat-panel capacities (C:\code\_ref_subsim_zip\base_src\spec\SPEC-phys.md lines 1112-1153), at
// the coordinator's word of 19:36. Section 7 gives each one's own natural period, dry and wetted, for a cascade's
// dynamic factor, at the coordinator's word of 23:47.
//
// Sources [read]:
//   - Wilding, the British Inquiry, Day 19, BI 20623-20643: the bulkheads "carried up to D deck" aft. Bulkhead D is
//     44 ft from the tank top, plated 0.56 in on the tank top and 0.30 in between E and F decks, its stiffeners 29 7/8 in
//     apart. BI 20660-20662: its plating 10 to 20 % over Lloyd's.
//   - the Limitation of Liability depositions: wilding02, "very large stiffeners of specially rolled sections",
//     "elaborately bracketed at top and bottom"; wilding03, the bulkhead plating 10 to 20 % and the stiffening "75 to 100
//     percent" over Lloyd's new rules. BI 25328-25331: all her bulkheads on the same footing for scantlings.
//   - Lloyd's Register's Rules 1911-12, Table 10 (archive.org HECRAR1912, leaves 210 to 214, printed pp. 180-184): it
//     tabulates watertight bulkheads to 40 ft deep only. Hers aft are 49 to 53 ft (Wilding, BI 20661: Lloyd's had no
//     published rules past about 650 ft).
// Her stiffeners' own sections are in no open source. So the method takes the rule's own margin and Wilding's word:
//   1. The rule's margin: three of Table 10's bracketed stiffeners, each in plastic collapse under a head over the floor,
//      against the head its row was sized for (its bulkhead's depth, the water to the bulkhead deck): collapse over design.
//   2. Each after bulkhead: its depth from the floor to D deck, and its lowest stiffener's span from the floor to the
//      lowest deck that crosses it. M, N and O meet the orlop (R3's orlop table: stores and holds on it). K and L meet G
//      deck at the wings (R3's G table: stores and workshops), while the engine casings rise at the centre, so the
//      centre's stiffeners may run on to F deck: both spans are shown.
//   3. The rule-sized stiffener for that depth and span is the one whose collapse head is the rule's margin times the
//      bulkhead's depth. Hers carries 1.75 to 2.0 times its moments (Wilding's 75 to 100 %, read as strength).
//   4. Two loadings:
//      - upright, the water's head over the floor (a triangle, as e104);
//      - standing, the stern up on end with the bulkhead nearly level, a uniform pressure over the span (wL^2/8 against
//        the hinges' moments).
//      Loaded from the stiffeners' side their free flanges trip first: 0.6 to 0.8 of that
//      (docs/research/RESEARCH_falling_hull_physics_v1_2026-11-19.md, its bulkhead row) [derived there].
//      Which face hers stood on is NOT FOUND.
//   5. The plating between stiffeners: a strip clamped at the stiffeners (p = 4 sY t^2 / s^2), its bending only, a lower
//      bound; past it the plate carries the load as a membrane until its seams' rivets go (e104).
// Mild steel at 262 MPa, the lower of her recovered hull plate's two yields (NIST-IR 6118, as section.js takes it).
// Headless; changes nothing in the repository.
//   node docs/research/experiments/e118_after_bulkheads_heads.js [<worktree>]
'use strict';
const path = require('path');
const root = path.resolve(process.argv[2] || path.join(__dirname, '..', '..', '..'));
const C = require(path.join(root, 'core', 'core.js'));
const S = require(path.join(root, 'core', 'readers', 'section.js'));
const say = (s) => console.log(s === undefined ? '' : s);
const f = (v, d) => (v === null || v === undefined || !Number.isFinite(v)) ? 'n/a' : v.toFixed(d === undefined ? 2 : d);
const IN = 0.0254, FT = 0.3048, SY = 262e6, RG = C.RHO * C.GRAV;
const S_IN = 29.875;                                  // her stiffeners' spacing, in (Wilding, BI 20642) [read]

// ---------------------------------------------------------------- e104's laws, the same code
// a stiffener with its plating: plastic moment (the plastic neutral axis halves the area; the plating effective over its
// whole spacing in tension, Faulkner's width in compression)
function plasticMoment(st, tp, s, plateInCompression) {
  const beta = (s / tp) * Math.sqrt(SY / 207e9), be = plateInCompression ? Math.min(1, beta > 1 ? 2 / beta - 1 / (beta * beta) : 1) * s : s;
  const parts = [{ y0: 0, y1: tp, w: be }, { y0: tp, y1: tp + st.d, w: st.tw }];
  if (st.bf > st.tw) parts.push({ y0: tp + st.d - st.tf, y1: tp + st.d, w: st.bf - st.tw });
  const n = 4000, top = tp + st.d, dy = top / n; let Atot = 0; const a = new Float64Array(n);
  for (let i = 0; i < n; i++) { const y = (i + 0.5) * dy; let w = 0; for (const p of parts) if (y >= p.y0 && y < p.y1) w += p.w; a[i] = w * dy; Atot += a[i]; }
  let acc = 0, pna = 0; for (let i = 0; i < n; i++) { if (acc + a[i] >= Atot / 2) { pna = (i + (Atot / 2 - acc) / a[i]) * dy; break; } acc += a[i]; }
  let Z = 0; for (let i = 0; i < n; i++) Z += a[i] * Math.abs((i + 0.5) * dy - pna);
  return { Mp: SY * Z, Z, be, A: Atot };
}
// the head over the floor (m) at which a stiffener of span L (m), spacing s, collapses: the free moment's peak reaching
// `need` (bracketed at both ends: mid-span's Mp plus the ends'); w(z) = RG s (h - z)+
function collapseHead(L, s, need) {
  const R0of = (h) => { const n = 400, dz = L / n; let R0 = 0; for (let i = 0; i < n; i++) { const z = (i + 0.5) * dz; R0 += RG * s * Math.max(0, h - z) * (L - z) * dz; } return R0 / L; };
  const Mmax = (h) => { const n = 400, dz = L / n, w = (z) => RG * s * Math.max(0, h - z); let best = 0, V = R0of(h), M = 0; for (let i = 0; i < n; i++) { const z = (i + 0.5) * dz; M += V * dz; V -= w(z) * dz; if (M > best) best = M; } return best; };
  let lo = 0, hi = 200; for (let it = 0; it < 70; it++) { const m = 0.5 * (lo + hi); if (Mmax(m) >= need) hi = m; else lo = m; }
  return hi;
}
// the moment `need` at which a stiffener of span L collapses under the head h over the floor (the inverse of the above)
function needFor(L, s, h) { let lo = 0, hi = 1e9; for (let it = 0; it < 90; it++) { const m = 0.5 * (lo + hi); if (collapseHead(L, s, m) >= h) hi = m; else lo = m; } return hi; }
// standing: a uniform head hu over the span, bracketed both ends: wL^2/8 = need
const uniformHead = (L, s, need) => 8 * need / (RG * s * L * L);
const BA = (d, b, t) => ({ d: d * IN, tw: t * IN, bf: b * IN, tf: t * IN });   // a bulb angle taken as a plain angle

// ---------------------------------------------------------------- 1. the rule's margin
// Table 10's bracketed entries [read from the page images, leaves 213 and 214, at the scan's resolution; the floor
// plating from leaf 210's rows, the OCR noisy: approx]: [row depth (ft), span (ft), stiffener, floor plating (in)]
const RULE = [
  ['24 to 26 ft deep, span 25 to 26 ft (e104\'s)', 25, 25.6, BA(10.5, 3.5, 0.56), 0.34],
  ['30 to 32 ft deep, span 25 to 26 ft', 31, 25.5, BA(12, 3.5, 0.64), 0.36],
  ['36 to 38 ft deep, span 26 to 27 ft', 37, 26.5, BA(12, 4, 0.70), 0.42],
];
const s = S_IN * IN;
say('e118: the after watertight bulkheads\' heads at collapse from their scantlings (Z1\'s ask, G12\'s way up); mild steel ' + f(SY / 1e6, 0) + ' MPa; stiffeners ' + S_IN + ' in apart [read]');
say();
say('1. THE RULE\'S MARGIN: Table 10\'s bracketed stiffeners in plastic collapse under a head over the floor, against the head their row was sized for (the bulkhead deck\'s)');
say('   entry                                          design head (m)   span (m)   Mp mid + ends (kN m)   collapse head (m)   margin');
const margins = [];
for (const [name, dFt, spFt, st, tpIn] of RULE) {
  const tp = tpIn * IN, L = spFt * FT, need = plasticMoment(st, tp, 30 * IN, true).Mp + plasticMoment(st, tp, 30 * IN, false).Mp;
  const hc = collapseHead(L, 30 * IN, need), hd = dFt * FT;
  margins.push(hc / hd);
  say('   ' + name.padEnd(46) + f(hd, 2).padStart(15) + f(L, 2).padStart(11) + f(need / 1e3, 0).padStart(22) + f(hc, 2).padStart(20) + f(hc / hd, 3).padStart(9));
}
const mLo = Math.min(...margins), mHi = Math.max(...margins);
say('   the rule\'s margin: ' + f(mLo, 3) + ' to ' + f(mHi, 3) + ' (collapse over the head to the bulkhead deck)');
say();

// ---------------------------------------------------------------- 2. to 5. the after bulkheads
const floorAt = (x) => ((x <= S.SCANT.db.deepFrom && x >= S.SCANT.db.deepTo) ? S.SCANT.db.dDeep : S.SCANT.db.d);
const BH = [
  ['K', 'boiler room 1 | the reciprocating engine room', [['G deck, the wings', 'G'], ['F deck, the centre past the casings', 'F']]],
  ['L', 'the reciprocating engine room | the turbine room', [['G deck, the wings', 'G'], ['F deck, the centre past the casings', 'F']]],
  ['M', 'the turbine room | the provision stores (zone 12)', [['the orlop (aft of M)', 'orlop']]],
  ['N', 'zone 12 | zone 13 (the refrigerated cargo)', [['the orlop', 'orlop']]],
  ['O', 'zone 13 | zone 14 (the hold between O and P)', [['the orlop', 'orlop']]],
];
const WRONG = [0.6, 0.8], K_ = [1.75, 2.0];
say('2. TO 5. THE AFTER BULKHEADS (the model\'s own bulkheads, decks and floor). Each head is m of water: upright, over the floor (a triangle);');
say('   standing, uniform over the span (the bulkhead nearly level). Hers is 1.75 to 2.0 times the rule-sized stiffener; loaded from the stiffeners\' side, 0.6 to 0.8 of it');
const out = [];
for (const [id, between, spans] of BH) {
  const b = C.BULKHEADS.find(q => q.id === id), x = b.x, z0 = floorAt(x), zTop = C.deckZ(b.top, x), H = zTop - z0;
  say('   ' + id + ' at x ' + f(x, 2) + ' (' + between + '): the floor ' + f(z0, 2) + ' m, ' + b.top + ' deck ' + f(zTop, 2) + ' m, so ' + f(H, 2) + ' m (' + f(H / FT, 1) + ' ft) deep; its doors ' + JSON.stringify(b.doors));
  for (const [where, deck] of spans) {
    const L = C.deckZ(deck, x) - z0;
    const rows = [];
    for (const m of [mLo, mHi]) {
      const nRule = needFor(L, s, m * H);
      for (const k of K_) { const need = k * nRule; rows.push({ m, k, need, up: collapseHead(L, s, need), st: uniformHead(L, s, need) }); }
    }
    const up = rows.map(r => r.up), st = rows.map(r => r.st);
    const upLo = Math.min(...up), upHi = Math.max(...up), stLo = Math.min(...st), stHi = Math.max(...st);
    const nLo = Math.min(...rows.map(r => r.need)), nHi = Math.max(...rows.map(r => r.need));
    out.push({ id, where, L, upLo, upHi, stLo, stHi, nLo, nHi, x, z0 });
    say('     the lowest stiffener to ' + where.padEnd(38) + ' span ' + f(L, 2) + ' m: upright ' + f(upLo, 1) + ' to ' + f(upHi, 1) + ' m over the floor (from the stiffeners\' side ' + f(WRONG[0] * upLo, 1) + ' to ' + f(WRONG[1] * upHi, 1) + '); standing ' + f(stLo, 1) + ' to ' + f(stHi, 1) + ' m uniform (' + f(WRONG[0] * stLo, 1) + ' to ' + f(WRONG[1] * stHi, 1) + ')');
    say('       its moments M_p,mid + M_p,end ' + f(nLo / 1e3, 3) + ' to ' + f(nHi / 1e3, 3) + ' kN m (the band\'s ends; standing = 8 (M_p,mid + M_p,end) / (rho g s L^2), exactly the spec\'s p_s below)');
  }
}
say();
// the plating: 0.56 in on the floor and 0.30 in at the top (bulkhead D's, the same footing for all) [read]
const strip = (tIn) => 4 * SY * (tIn * IN) * (tIn * IN) / (s * s) / RG;
say('5. THE PLATING between stiffeners, a strip clamped at them, its bending only (a lower bound; past it a membrane, until its seams\' rivets go):');
say('   0.56 in, on the floor [read, bulkhead D]: ' + f(strip(0.56), 1) + ' m of head over it; 0.30 in, between E and F decks [read]: ' + f(strip(0.30), 1) + ' m. Standing, with the whole bulkhead under one pressure, the thin top strakes bend first: ' + f(strip(0.30), 1) + ' m uniform');
say();
// ---------------------------------------------------------------- 6. against Bo's submarine spec's flat-panel capacities
// C:\code\_ref_subsim_zip\base_src\spec\SPEC-phys.md lines 1112-1153, REQ-STRUCT-020 [read]: (a) the plate's mechanism,
// Wood's yield-line pressure (Zhang 1994), clamped: q_T = 48 M0 / (b^2 xi^2), M0 = sY t^2 / 4, xi = -beta + sqrt(3 +
// beta^2), beta = b/a, b the short side (an infinitely long clamped strip gives 16 M0 / b^2, this note's section 5);
// (b) the stiffener's three-hinge pressure, p_s = 8 (M_p,mid + M_p,end) / (s l^2) clamped, the same as section 4's
// standing case; (c) the plate's rupture, Greenspon 1955: P_f = (w_f/a) sU (h/a) (1 + a^2/b^2) / (16/pi^4), a the short
// side, w_f/a 0.10 (the conservative set; Day's tests 0.13 to 0.23); and the panel opens at min(k_s p_s, P_f), k_s 1 to
// 3 [the spec's bet]. The spec's own limits: Greenspon validated only at aspect ratio 1.55, on steel of sU 41.8 to 72.3
// ksi and a/h 110 to 432, clamped (welded) edges; nothing for rivet lines or seams. Her ultimate tensile strength: 430
// MPa [bet: the period's, as strength_tests' Stoney what-if takes it].
const SU = 430e6, Q = (pa) => pa / RG;
const wood = (tIn, b, a) => { const M0 = SY * (tIn * IN) * (tIn * IN) / 4, be = b / a, xi = -be + Math.sqrt(3 + be * be); return 48 * M0 / (b * b * xi * xi); };
const green = (tIn, a, b, set) => set * SU * ((tIn * IN) / a) * (1 + (a / b) * (a / b)) / (16 / Math.pow(Math.PI, 4));
say('6. AGAINST BO\'S SUBMARINE SPEC (SPEC-phys.md lines 1112-1153, REQ-STRUCT-020): its three capacities on her panels, m of water (uniform)');
say('   bulkhead   panel                                   aspect   a/h    (a) Wood, clamped   (c) Greenspon, set 0.10 (0.13-0.23)   (b) the stiffener: section 4\'s standing band');
for (const id of ['K', 'L', 'M', 'N', 'O']) {
  const r = out.filter(q => q.id === id)[0], b = C.BULKHEADS.find(q => q.id === id), Lt = C.deckZ('D', b.x) - C.deckZ('E', b.x);
  for (const [panel, tIn, a] of [['the floor\'s, 0.56 in, to the lowest deck', 0.56, r.L], ['the top\'s, 0.30 in, E to D deck', 0.30, Lt]]) {
    say('   ' + id.padEnd(11) + panel.padEnd(40) + f(a / s, 1).padStart(6) + f(s / (tIn * IN), 0).padStart(6) + f(Q(wood(tIn, s, a)), 1).padStart(14) + ('       ' + f(Q(green(tIn, s, a, 0.10)), 0) + ' (' + f(Q(green(tIn, s, a, 0.13)), 0) + '-' + f(Q(green(tIn, s, a, 0.23)), 0) + ')').padEnd(42) + (panel.startsWith('the floor') ? f(r.stLo, 1) + ' to ' + f(r.stHi, 1) + '; k_s 1 to 3: ' + f(r.stLo, 1) + ' to ' + f(3 * r.stHi, 0) : ''));
  }
}
say('   Her panels lie outside Greenspon\'s validation on both counts: aspect 3.6 to 12.5 against 1.55, a/h 53 and 100 against 110 to 432. And they are riveted: the membrane tension his');
say('   formula needs would have to cross the seams and the stiffeners\' heel rivets, whose strength it does not hold. So his rupture loads (hundreds of m) say only that the plate itself');
say('   does not open first. Its opening rule, min(k_s p_s, P_f), then reduces to k_s times the stiffener\'s three-hinge pressure, with k_s a bet the spec makes for welded panels.');
say();
say('THE BANDS FOR THE FALL (m of water; the lowest stiffener governs; the low end from the stiffeners\' side, the high end from the plating\'s side):');
for (const id of ['K', 'L', 'M', 'N', 'O']) {
  const r = out.filter(q => q.id === id), uLo = Math.min(...r.map(q => q.upLo)) * WRONG[0], uHi = Math.max(...r.map(q => q.upHi)), sLo = Math.min(...r.map(q => q.stLo)) * WRONG[0], sHi = Math.max(...r.map(q => q.stHi));
  say('   ' + id + ': upright ' + f(uLo, 1) + ' to ' + f(uHi, 1) + ' over the floor; standing ' + f(sLo, 1) + ' to ' + f(sHi, 1) + ' uniform, and the top strakes\' bending at ' + f(strip(0.30), 1) + ' (a lower bound)');
}
say();

// ---------------------------------------------------------------- 7. each after bulkhead's own natural period (T_b)
// At the coordinator's word of 23:47 (the stern work's digests, 2026-11-23). A bulkhead beside a failing space sees more
// than the static difference through the AIR's overshoot (their H4; subsim's two-pocket probe). subsim's cascade step
// (one degree of freedom on the load L(t) = p_air - p_n) needs each bulkhead's own period, which "no one has" (their 03,
// section 2.5). Here it is for the lowest stiffener with its plating, in the bulkhead's first mode with all its
// stiffeners in phase (the mode a uniform pressure excites):
//   - hers: Table 10's deepest bracketed stiffener (the 36 to 40 ft row's) scaled alike in every dimension until its
//     M_p,mid + M_p,end is section 4's [bet: Wilding's "specially rolled sections" taken in the rule's shape]; the
//     plating 0.56 in (the floor's) [read], effective over its whole spacing (elastic);
//   - E 207 GPa (as e104's plating law takes it) and steel at 7,850 kg/m3 [the usual figures];
//   - Rayleigh's quotient on an assumed mode, clamped (bracketed: 1 - cos(2 pi y/L)) and simply supported
//     (sin(pi y/L)), the band's two ends;
//   - the water's added mass on a wetted face: Rayleigh's integral for the panel (the span L by the bulkhead's breadth
//     B at mid-span) in a rigid baffle, incompressible, the far water at rest: M_a = rho/(2 pi) times the double
//     integral of psi(P) psi(Q) / |PQ| over the panel [derived]. Over the breadth it is closed:
//     G(eta) = 2 (B asinh(B/|eta|) - sqrt(B^2 + eta^2) + |eta|); along the span, a midpoint sum, each cell's own term by
//     the log's mean over the cell. Its check: a square piston of side a, psi = 1, gives
//     (4 ln(1 + sqrt 2) - (4/3)(sqrt 2 - 1)) a^3 = 2.973214 a^3 exactly.
//   - no face wetted (air both sides), one (a full space against an air space: the cascade's case) and two.
// A load that rises over t_r to a constant, on a system of period T: its peak response is 1 + |sin(pi t_r/T)| / (pi t_r/T)
// times the static one; the envelope 1 + T/(pi t_r) bounds it, and nothing exceeds 2 (a step). The rises: 0.3 s (a
// neighbour's air arrested with its boundary gone whole, 1,000 m3 at 44 m; 0.50 s at 15 m: subsim's port, their 03,
// section 6) to 3.4 s (the air's first peak through the fall's own opening: their review, F7).
const E_ST = 207e9, RHO_ST = 7850, RHO_W = C.RHO;
const BASE = BA(12, 4, 0.70);                           // Table 10's 36 to 40 ft row's bulb angle (section 1's RULE[2])
const scaled = (sig) => ({ d: BASE.d * sig, tw: BASE.tw * sig, bf: BASE.bf * sig, tf: BASE.tf * sig });
const TP7 = 0.56 * IN;
const mpPair = (st) => plasticMoment(st, TP7, s, true).Mp + plasticMoment(st, TP7, s, false).Mp;
function sigmaFor(need) { let lo = 0.2, hi = 6; for (let it = 0; it < 80; it++) { const m = 0.5 * (lo + hi); if (mpPair(scaled(m)) >= need) hi = m; else lo = m; } return hi; }
function elastic(st, tp, w) {                          // the stiffener with its plating over the width w: A, I (m2, m4)
  const parts = [{ y0: 0, y1: tp, w }, { y0: tp, y1: tp + st.d, w: st.tw }];
  if (st.bf > st.tw) parts.push({ y0: tp + st.d - st.tf, y1: tp + st.d, w: st.bf - st.tw });
  let A = 0, Ay = 0; for (const p of parts) { const a = p.w * (p.y1 - p.y0); A += a; Ay += a * 0.5 * (p.y0 + p.y1); }
  const yb = Ay / A; let I = 0;
  for (const p of parts) { const h = p.y1 - p.y0, a = p.w * h, yc = 0.5 * (p.y0 + p.y1); I += p.w * h * h * h / 12 + a * (yc - yb) * (yc - yb); }
  return { A, I, yb };
}
const Gx = (eta, B) => { const e = Math.abs(eta); return 2 * (B * Math.asinh(B / e) - Math.sqrt(B * B + e * e) + e); };
const Gself = (h, B) => 2 * (B * (Math.log(2 * B / h) + 0.5) + h / 3);   // G's mean over one cell, from its log
function addedJ(L, B, psi, n) {                        // the double integral of psi psi' / r over the panel L x B
  const h = L / n, y = new Float64Array(n), p = new Float64Array(n);
  for (let i = 0; i < n; i++) { y[i] = (i + 0.5) * h; p[i] = psi(y[i]); }
  let J = 0;
  for (let i = 0; i < n; i++) { let row = p[i] * Gself(h, B); for (let j = 0; j < n; j++) if (j !== i) row += p[j] * Gx(y[i] - y[j], B); J += p[i] * row; }
  return J * h * h;
}
const MODES = {
  clamped: { psi: (L) => (y) => 1 - Math.cos(2 * Math.PI * y / L), m2: (L) => 1.5 * L, k2: (L) => 8 * Math.pow(Math.PI, 4) / (L * L * L) },
  simple: { psi: (L) => (y) => Math.sin(Math.PI * y / L), m2: (L) => 0.5 * L, k2: (L) => 0.5 * Math.pow(Math.PI, 4) / (L * L * L) },
};
say('7. EACH AFTER BULKHEAD\'S OWN NATURAL PERIOD T_b (s): the lowest stiffener with its plating, all in phase; clamped to simply supported; no face wetted, one, both');
const sq1 = addedJ(1, 1, () => 1, 2000), sqExact = 4 * Math.log(1 + Math.SQRT2) - (4 / 3) * (Math.SQRT2 - 1);
const cv = out.reduce((a, q) => (q.L > a.L ? q : a), out[0]), cvB = 2 * C.halfBreadth(cv.x, cv.z0 + 0.5 * cv.L), cvPsi = MODES.clamped.psi(cv.L);
const cv600 = addedJ(cv.L, cvB, cvPsi, 600), cv1200 = addedJ(cv.L, cvB, cvPsi, 1200);
say('   the added-mass integral\'s checks: a unit square piston gives ' + sq1.toFixed(6) + ' against ' + sqExact.toFixed(6) + ' exactly (n 2,000); her longest panel (' + cv.id + ', ' + f(cv.L, 2) + ' m) at n 600 against 1,200: ' + f(100 * (cv600 / cv1200 - 1), 4) + ' %');
say('   bulkhead, span          B (m)   section (d x bf x t, in)               I (cm4)   steel (kg/m)   water per face (kg/m)   T dry          T one face     T both faces   1 + T/(pi t_r): t_r 0.3 s / 3.4 s (one face)');
const T7 = [];
for (const r of out) {
  const B = 2 * C.halfBreadth(r.x, r.z0 + 0.5 * r.L);
  const rows = [];
  for (const need of [r.nLo, r.nHi]) {
    const sig = sigmaFor(need), st = scaled(sig), el = elastic(st, TP7, s), mS = RHO_ST * el.A;
    for (const mk of ['clamped', 'simple']) {
      const M = MODES[mk], J = addedJ(r.L, B, M.psi(r.L), 600), mA = RHO_W * J * s / (2 * Math.PI * B);   // per stiffener, generalized
      const K = E_ST * el.I * M.k2(r.L), T = (nw) => 2 * Math.PI * Math.sqrt((mS * M.m2(r.L) + nw * mA) / K);
      rows.push({ sig, st, el, mS, mA: mA / M.m2(r.L), T0: T(0), T1: T(1), T2: T(2), mk });
    }
  }
  const band = (k) => [Math.min(...rows.map(q => q[k])), Math.max(...rows.map(q => q[k]))];
  const [t0a, t0b] = band('T0'), [t1a, t1b] = band('T1'), [t2a, t2b] = band('T2'), [ia, ib] = band('mA'), [ma, mb] = band('mS');
  const Ia = Math.min(...rows.map(q => q.el.I)), Ib = Math.max(...rows.map(q => q.el.I));
  const stA = rows[0].st, stB = rows[rows.length - 1].st;
  const sec = f(stA.d / IN, 1) + 'x' + f(stA.bf / IN, 1) + 'x' + f(stA.tw / IN, 2) + ' to ' + f(stB.d / IN, 1) + 'x' + f(stB.bf / IN, 1) + 'x' + f(stB.tw / IN, 2);
  const env = (T, tr) => Math.min(2, 1 + T / (Math.PI * tr));
  T7.push({ id: r.id, where: r.where, L: r.L, B, t0a, t0b, t1a, t1b, t2a, t2b, rA: Math.min(...rows.map(q => q.mA / q.mS)), rB: Math.max(...rows.map(q => q.mA / q.mS)) });
  const to = r.where.startsWith('G') ? 'to G' : (r.where.startsWith('F') ? 'to F' : 'to the orlop');
  say('   ' + (r.id + ', ' + f(r.L, 2) + ' m ' + to).padEnd(24) + f(B, 1).padStart(6) + '   ' + sec.padEnd(32) + (f(Ia * 1e8, 0) + '-' + f(Ib * 1e8, 0)).padStart(14) + (f(ma, 0) + '-' + f(mb, 0)).padStart(13) + (f(ia, 0) + '-' + f(ib, 0)).padStart(20)
    + ('   ' + f(t0a, 3) + '-' + f(t0b, 3)).padEnd(15) + ('  ' + f(t1a, 3) + '-' + f(t1b, 3)).padEnd(15) + ('  ' + f(t2a, 3) + '-' + f(t2b, 3)).padEnd(15)
    + '   ' + f(env(t1a, 0.3), 2) + '-' + f(env(t1b, 0.3), 2) + ' / ' + f(env(t1a, 3.4), 3) + '-' + f(env(t1b, 3.4), 3));
}
const allT1 = T7.map(q => q.t1b), allT2 = T7.map(q => q.t2b), allT0 = T7.map(q => q.t0a);
const t1Max = Math.max(...allT1), t2Max = Math.max(...allT2), at1 = T7.filter(q => q.t1b === t1Max)[0];
say('   so T_b runs from ' + f(Math.min(...allT0), 3) + ' s (dry, the stiffest) to ' + f(t1Max, 3) + ' s with one face wetted and ' + f(t2Max, 3) + ' s with both (the longest: ' + at1.id + ' to ' + at1.where + ').');
say('   One wetted face adds ' + f(Math.min(...T7.map(q => q.rA)), 1) + ' to ' + f(Math.max(...T7.map(q => q.rB)), 1) + ' times her steel\'s mass per metre: the water, not the steel, sets T_b once a face is wet.');
say('   Against the air\'s rise of 3.4 s the steel\'s own factor is at most ' + f(1 + t1Max / (Math.PI * 3.4), 3) + ' (one face) and ' + f(1 + t2Max / (Math.PI * 3.4), 3) + ' (both); against 0.3 s (a neighbour\'s boundary gone whole) at most ' + f(Math.min(2, 1 + t1Max / (Math.PI * 0.3)), 2) + ' and ' + f(Math.min(2, 1 + t2Max / (Math.PI * 0.3)), 2) + '.');
say('   Both ride on the AIR\'s overshoot, which is the larger factor (the note v1.2, section 8).');
