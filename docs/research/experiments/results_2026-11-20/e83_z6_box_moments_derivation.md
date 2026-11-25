# The part of a box below a plane: volume, area and first moments, exactly

`box_moments.js` exports `boxMoments(w, g, s, out)`; `out = { V, A, M: [M1, M2, M3] }` is filled in place (no allocation).
`test_box_moments.js` checks it: `node test_box_moments.js [gridN=1500] [randomCases=400]`.

## The problem

Box `|t_k| <= w_k` (k = 1, 2, 3), unit vector `g`, level `s`, `R = { t in box : g.t <= s }`.
Wanted: `V = vol(R)`, `A = dV/ds`, `M_k = integral over R of t_k dV`.

## The formulas

Write `t_k = w_k x_k` with `x_k` uniform on [-1, 1], `b_k = w_k |g_k|`, `B = b1 + b2 + b3`, `Vbox = 8 w1 w2 w3`.
Then `V = Vbox * P(g.t <= s)` and `M_k = Vbox * w_k * E[x_k 1(g.t <= s)]`.

Pick an axis k and call the two others i, j. `r = g_i t_i + g_j t_j` is the sum of two independent
uniforms; its density `f_R` is a trapezoid, symmetric about 0, that depends only on `b_i, b_j`:

    bmax = max(b_i, b_j), bmin = min(b_i, b_j), c1 = bmax - bmin, c2 = bmax + bmin, h = 1 / (2 bmax)
    f_R(r) = h                          for |r| <= c1      (the plateau)
           = h (c2 - |r|) / (2 bmin)    for c1 < |r| < c2  (the ramps)
           = 0                          for |r| >= c2
    F_R(r) = its integral: 0; h bmin p^2 with p = (r + c2) / (2 bmin); h (bmin + r + c1);
             1 - h bmin p^2 with p = (c2 - r) / (2 bmin); 1

Conditioning on x_k = y (so that g_k t_k = sgn(g_k) b_k y; the sign is taken out below by symmetry of f_R):

    V   = Vbox * (1/2) * integral_{-1}^{1} F_R(s - b_k y) dy
    A   = Vbox * (1/2) * integral_{-1}^{1} f_R(s - b_k y) dy
    E[x_k 1] = sgn(g_k) * integral_{-1}^{1} (y/2) F_R(s - b_k y) dy

and one integration by parts of the last (the antiderivative of y/2 chosen as (y^2 - 1)/4, which is
zero at both ends, so there is no boundary term) gives the result this module rests on:

    M_k = - Vbox * w_k^2 * g_k / 4 * I_k
    I_k = integral_{-1}^{1} (1 - y^2) f_R(s - b_k y) dy
        = (1 / b_k) * integral_{-b_k}^{b_k} (1 - (z / b_k)^2) f_R(s + z) dz

In words: the moment along axis k is `-g_k w_k^2 / 3` times the plane's area, where that "area" is
taken with a parabolic (Epanechnikov) weight along axis k in place of the flat one
(`A = Vbox/2 * integral of f_R`, `I_k` has `(1 - y^2)` for `1/2`; for b_k -> 0, I_k -> (4/3) f_R(s)
and `M_k -> -(g_k w_k^2 / 3) A`, the familiar waterplane-inertia term).

Each integral is over the window `r in [s - b_k, s + b_k]`, cut at the trapezoid's four knots
`-c2, -c1, c1, c2`: at most three pieces for A and I_k (integrand a polynomial of degree 1 and 3) and
one more for V where F_R = 1 (degree 2 on the others). Simpson's rule is exact for cubics, so one
Simpson step a piece is the closed form. V and A are computed once, on the axis of the largest b_k;
I_k once for each axis with b_k > 0.

Checks by hand: g = (0, 0, 1): f_R is a delta, I_3 = (1 - s^2/w3^2) / w3, M_3 = Vbox (s^2 - w3^2) / (4 w3),
which is `area * (s^2 - w3^2) / 2`. And `g.M = s V - integral_{-inf}^{s} V` holds to 3e-16 in the tests.

## Degeneracies, and why it is stable

- **No division by a small product.** `M_k` carries `g_k` as an explicit factor: g_k = 0 gives
  M_k = 0 exactly (the loop for that axis is skipped), and the sign of g_k gives the mirror image
  with no case analysis. The CDF-of-three-uniforms route gives `M_k = Vbox (N_k / (l1 l2 l3) - b_k F) / g_k`
  (N_k a sum of fourth and third powers), a 0/0 as g_k -> 0 on top of the alternating sum's own
  cancellation; I derived it and dropped it.
- **Every term is non-negative.** f_R, F_R, 1 - y^2 and the widths are all >= 0, so the sums cannot
  cancel; the alternating sum of cubes over the eight subsets never appears.
- **A small bmin** (one of the other two products tiny or 0) only appears in the ramps as the ratio
  `(c2 - |r|) / (2 bmin)`, clamped to [0, 1], and the ramps' width is 2 bmin, so their contribution
  is small with them. With bmin = 0 exactly, c1 = c2 and the ramps are empty pieces: the trapezoid is
  a box and no division happens. The knots' values (0, h, h, 0) are used as such, never recomputed.
- **Both other products zero** (g along axis k, the ship level): f_R is a delta and the three closed
  forms are used directly (`V = Vbox (s + b_k) / (2 b_k)`, `A = Vbox / (2 b_k)`, `I_k = (1 - (s/b_k)^2) / b_k`).
  The switch is at bmax <= 1e-150 b_k, only to keep h finite; down to there the general code is used
  and is accurate (tested at 1e-12 and 1e-9 relative).
- **A tiny b_k itself** (the window is a sliver of the trapezoid): the piece's width is taken by the
  accurate route in each case (`2 b_k` when both ends are the window's, `q - p` when both are knots,
  `(q - s) + b_k` or `b_k - (p - s)` when mixed), and y is exactly +-1 at the window's ends, so the
  weight 1 - y^2 does not inherit the rounding of `s -+ b_k`.
- **No thresholds otherwise.** Unlike the brief's `cdf3` (which drops a width under 1e-5 of the next),
  nothing is approximated between the regimes; V and A here are exact for all ratios.
- Wholly below (s >= B): V = Vbox, A = 0, M = 0, returned at once; wholly above (s <= -B): all 0.

## Test results (this machine, node, 2026-11-20)

705 cases: 400 random (w in [0.2, 8], g a random direction, s in [-1.2 B, 1.2 B]) and 305 deliberate
(g along each axis with both signs; one component 1e-12, 1e-9, 1e-6, 1e-4, 1e-2 relative; two such
components, also at levels within half that width of the box's corner levels; g in each coordinate
plane; equal products; a cube on its corner). Reference: exact along the axis of the largest |g_k|,
midpoint grid 1500 x 1500 over the two others. RESULT: PASS.

| check | worst | normalised by |
|---|---|---|
| V against the grid | 3.3e-7 | Vbox |
| M1, M2, M3 against the grid | 7.8e-8, 1.4e-7, 2.5e-7 | Vbox * max(w) |
| the same with g along an axis (the grid is exact there) | V 5.6e-14, M 1.3e-14 | |
| V against the brief's cdf3 | 9.1e-9 (the brief's dropped width; 4e-14 on the random cases) | Vbox |
| A against the brief's cdf3 (away from breakpoints) | 3.7e-9 (5.6e-14 on the random cases) | Vbox / B |
| A against dV/ds (central difference with Richardson, exact on a cubic piece) | 1.8e-9 | Vbox / B |
| g.M against s V - integral of V | 3.2e-16 | Vbox * B |
| V(g, s) + V(-g, -s) = Vbox | 2.9e-16 | Vbox |
| M(g, s) + M(-g, -s) = 0 | 7.3e-17 | Vbox * max(w) |
| M_k = 0 exactly where g_k = 0; early outs | all exact | |

The errors against the grid are the grid's own: with 3000 x 3000 (60 random cases plus the deliberate
ones) they fall to V 9.7e-8, M 1.8e-8 / 1.5e-8 / 9.7e-8.

Time: about 250 to 310 ns a call for a box cut by the plane (a pool of 1,024 cases, a quarter of them
with g along an axis; 1e6 calls by process.hrtime.bigint), about 26 ns for a box wholly below or
above. No allocation: module-level scalars only.

## What surprised me

1. The integration by parts. The moment is a weighted plane area: no fourth powers, no 1/g_k, and
   the same three-piece loop as A with the weight (1 - y^2) for 1/2. The g_k = 0 symmetry and the
   mirror for g_k < 0 fall out of the explicit factor g_k.
2. Simpson's rule is the closed form here (the integrands are cubics at most on each piece), so the
   "piecewise quartic" never has to be written out or its cases enumerated.
3. The brief's cdf3 is not exact near a corner level when a width is under its 1e-5 threshold: there
   its A is a step where the true A is a ramp (seen as a 3e-2 difference in A * B / Vbox at
   g = (1, -5.6e-7, -5.7e-7), s within half the small width of -B; dV/ds agreed with this module to
   2e-9), and its V is off by up to about 3e-8 of Vbox. Harmless for a level solve at 1e-7, but a
   Newton iteration on A could notice it. This module's V and A can replace it.
4. The first test of A against a plain central difference "failed" at 5e-4 on a nearly axis-aligned
   g: the difference's own error (V''' is of order Vbox / (l1 l2 l3), huge when two widths are
   tiny). Richardson's step halving inside one cubic piece is exact and settled it.

## Caveats

- g is taken as a unit vector and is not normalised here; with |g| != 1, V and M are still those of
  { g.t <= s } and A is dV/ds (the plane's area divided by |g|).
- Not re-entrant across workers sharing the module instance mid-call (module-level scratch); each
  worker's own `require` is its own instance, so this only matters for recursion, which there is none of.
- The 1e-150 switch assumes the products are not themselves denormal.
