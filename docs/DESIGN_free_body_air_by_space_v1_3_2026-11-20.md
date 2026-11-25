# Z6, milestone 2: the geometry and the exchange settled (v1.3)

- **Written:** 2026-11-20, 19:05 CST, by the Z1 session (Claude Code 7fe8d708, Opus 5.5).
- **For:** the coordinator (local_5ca1b235), at Bo's "keep going, coordinate with the others". The coordinator at 19:1x: "Your lane may keep to headless groundwork".
- **Status:** design only. Milestone 2's code waits for W6 (D55), and W6 waits for G6b.
- **Read with:** v1 (the air by space), v1.1 (the joint and the tear), v1.2 (the hinge elastic-plastic). This note changes v1's sections 2, 4, 7 and 9 where it says so.
- **Evidence** (on main by join 5, merge `6e35d0b`):
  - `docs/research/experiments/e69_z6_box_volume.js`;
  - `e83_z6_box_moments.js`, with its library and derivation;
  - `e84_z6_exchange.js`, with its library;
  - `docs/research/RESEARCH_torn_end_exchange_law_v1_2026-11-20.md`.

  e83 and e84 were derived by Fable subagents at Bo's word (18:31, relayed), and read and rerun by Z1.

## 0. In one paragraph

v1 sized the column sets at any attitude as "about half" of Z6. They are not needed.
- **The geometry is exact in closed form.** Each of the core's own column segments is a box. The part of a box below a plane is exact in closed form: its volume, its free surface's area, and its three first moments. So each space's water volume, level, free surface and centroid come out at any attitude, with nothing to switch.
- **The exchange through an opening is one pressure law,** strip by strip, with a counter-current law beside it for a horizontal opening with water over air.
- **The finding that reorders the doubts:** on a sinking piece, the air's volume goes by compression, not by venting.
  - Half goes in about 8 to 10 s, nine tenths in about 18 s, through a 300 m² torn end.
  - The landing's sensitivity is the torn end's clear area times its coefficient (a factor of about 3), and the first seconds' sinking speed.
  - It is not "one opening, two, or many".

## 1. The level, the volume and the centroid (replaces v1, section 2's column sets)

**The boxes.** The spaces are the core's 64 nodes, as v1 has them. Each node's geometry is the core's own list of column segments (`buildShip`: `nodeStart`, `nodeCount`, `entCol`, `entA`, `entE`), each one a box:
- dx by dy by (entE − entA);
- its centre at (x, y, (entA + entE)/2) in the ship frame;
- the node's permeability μ.

Cutting at the break splits the boxes the cut crosses, by length (v1, section 2). No other tables are built.

**One box below a world level h:**
- **Its volume and its free surface's area:** the box's volume times the CDF of a sum of three uniform variables, and times its density (e69, then e83).
- **Its first moments:** M_k = −Vbox w_k² g_k / 4 · I_k (e83). I_k is the plane's area weighted by (1 − y²) along axis k. There is no cancellation and no division by a small width; g_k = 0 gives exactly 0.
- **Cost:** a box wholly in or out costs ~20 ns; a cut box ~220 ns.
- **Checks:**
  - against integration, 3e-7 of a box;
  - against the core's own centre-line rule at 0 to 10 degrees, the same volume at the same level to 1e-14.

**A space:**
- **The level** holding its water W solves Σ μ V_box(h) = W by Newton, from the last sub-step's level, with the bracket kept. It took at most 3 iterations at any attitude from 0 to 90 degrees (e69); one pass over a space of 168 boxes is ~2 µs.
- **The water's centroid** is Σ μ M_box / W, in each box's axes and turned into the ship's.
- **The air** is the rest of the space: its volume V_k − W at its own pressure (Boyle). Its centroid is the space's own (fixed, precomputed) less the water's, by moments: (V_k c_k − W c_w) / (V_k − W). It is exact, and it sits above the free surface by construction.
- **A full or empty space** (W = V_k or 0) costs nothing.

**Use the e83 library alone,** for V, A and M. e69's `cdf3` drops a width under 1e-5 of the next, and near a corner level it is off by up to 3e-8 of a box (found by e83's tests).

**Cost a sub-step:** about 30 spaces a piece are cut by their levels, at one or two passes each: ~50 to 100 µs a piece. That is within v1's sizing (section 6).

## 2. The exchange (replaces v1, section 4's table; its two-opening balance stays as a check)

From `RESEARCH_torn_end_exchange_law_v1` (e84), each opening between two sides takes two laws.

**Law P, the pressure law:**
- Each strip of the opening flows from the higher pressure to the lower, carrying the upstream fluid at Bernoulli's speed. Air flow is choked at 0.47 of its upstream pressure.
- Δp is piecewise linear in height, so the integral is closed-form.
- With no switch between them, it gives the submerged orifice, one-way flow, the two-layer exchange of a vertical opening, and compression's inflow.
- **The two-layer case** gives air only the top tenth of a vertical opening (r = (ρa/ρw)^(1/3)): q = 0.574 Cd A √(2gH) at the surface. So a vertical torn end is a flooding opening vented at its top, not a lock exchange half and half.

**Law X, the counter-current law:**
- For a horizontal opening with water over air: a Wallis-form flooding line, √(jg/jg0) + √(jf/jf0) = 1.
- The water's intercept is Froude-scaled, C² √(g Dh), with C = 0.70 (band 0.55 to 1.0).
- The air's is capped by Kutateladze (Ku 3.2), about 15 m/s at the surface.
- It is weighted by √|nz| at other attitudes, and the larger of P and X is taken. The hybrid is a bet behind a switch (`kuCap`).

**The stepping:**
- **Each space's air pressure is implicit:** a fixed-count bisection on Boyle's residual with all its openings evaluated at that pressure (`stepSpace`). It is monotone, cannot overshoot, and keeps the same bits on one engine.
- **Water levels are explicit,** with `limitOneWay`, the exact relaxation of a square-root law, so a sub-step can level two sides but never pass them.
- **Cost:** 49 evaluations of each opening a sub-step. If that is too dear, use a secant step inside the kept bracket.

**What the exchange takes from the joint:**
- the torn end's area per space (`S.hinge.at(θ).open`, or `unload(θmax, θ).open` on the ligament's line);
- its height range per space (`at(θ).span`).

These go in place of v1.1, section 2's stand-in.

**The coefficient.** Cd is 0.6 (band 0.45 to 0.75), for the clear area. The clear fraction of a torn section (decks, stubs, boilers) is 0.4 to 0.8 of the gross [bet]. That product is the run's largest band (section 4).

## 3. What the bow's air does, and what the runs must show

- **One second is not available:** 35,000 m³ in 1 s through 300 m² needs a head over 690 m (abacus `de798668b01b`).
- **On a sinking piece compression rules** above w* = Q_x p / (V ρ g), about 0.4 m/s at the surface (abacus `6d4764a27b08`). The whole torn end then carries water in, and the air is squeezed where it stands, its pressure lagging the sea's.
  - At 300 m²: the volume is halved at 8 to 10 s and down to a tenth at about 18 s, level or end-up alike.
  - At 100 m²: 16 s and 23 s.
- **The lag reaches 60 to 70 m of head** with a 100 m² end. No deck or bulkhead stands that. This is v1, section 5's failure rule in action: spaces give way, and the effective area grows. M2 must run the failures together with the exchange, not after it.
- **The runs M2 prints,** with the record printed beside them, never chosen by it:
  - the bow's distance, bearing and attitude;
  - the stern's minutes afloat after the release.

  These are given for the torn end's clear area at 150, 300 and 600 m² (or its share of the gross section at 0.4, 0.6 and 0.8). They are crossed with the ligament's as-built row and its sourced alternatives (v1.1, section 4; v1.2, section 3), and with Cd's band.

## 4. Doubts (replaces v1, section 9's list)

1. **The torn end's clear area times Cd:** a factor of about 3. It sets every venting time, inversely, and the pressure lag as its inverse square. It is the run's largest band.
2. **The first seconds' sinking speed:** the joint decides it now (milestone 1). The bow hangs by her bottom for 25 s as built, and lets go at once at a stiffer Lh.
3. **The failure heads** (v1, section 5): they set when the lag opens the spaces, and the count of reports.
4. **The air's compression:** isothermal is the bet. Adiabatic (n = 1.4) holds 10 to 30 % more volume in the first tens of seconds (e84, section 5). Its what-if is n = 1.4.
5. **The counter-current constant at the scale of metres** (Froude 0.10 to 0.5). It matters only for a piece that hangs near the surface pitched up for tens of seconds, which the bow does not do. It is now a minor doubt.
6. **The first second's inertia** (the "glug": a period of 2 to 7 s) is not in the law. Add a plug-inertia term only once the area is better known.

**Retired:** the column sets and their switch, which were v1's "about half". The question "one, two or many openings" reduces to √Dh within law X, and to doubt 1.

## 5. Tests (changes to v1, section 7)

- **Test 1** (the column sets' agreement) is replaced by the box rule's own checks: against integration, smoothness from 0 to 90 degrees, and the core's rule at small angles to 1e-14 (e69, e83). The trials rerun them on the spaces as cut at the break.
- **Test 4's single-space rigs** take e84's closed forms:
  - the two-layer exchange, q = 0.574 Cd A √(2gH) at the surface;
  - an air layer's finite emptying, t = 2 V0 / (Cd A √(2 g a0));
  - compression's onset, w*.

  All three are to the integrator's error.
- **New, CHECK:** the bow's air volume against time on a sinking piece, against e84's table (8 to 10 s to half at 300 m²), within its band.

## 6. Size

Milestone 2 was L, about half of it the column sets. What is left:
- the spaces' state and hand-over;
- the exchange, built on e84's library;
- the failures and 'report' events;
- the trials.

Say one to two sessions, on W6's flooding, once it lands. Rebase onto W6 first: it moves the flooding at the hand-over.
