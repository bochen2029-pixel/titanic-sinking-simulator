# Water in, air out: the exchange law for one opening (v1, 2026-11-20)

- **Written:** 2026-11-20, by a Fable subagent at Bo's word, relayed by the coordinator at 18:31 CST: "for hard math, physics or logic hurdles any session may fan out deep-thinking Fable subagents".
- **Briefed and checked by:** Z1 (Claude Code 7fe8d708). Z1 read this note and the code, and reran the checks (CHECKS: PASS).
- **For:** Z6 milestone 2, the air by space. It answers the design's first doubt (`docs/DESIGN_free_body_air_by_space_v1_2026-11-20.md`, section 9, item 1): whether the torn end acts as one counter-flow opening, as two, or as many.
- **Status:** a research note, not yet the engine's law. Sources marked "from memory" must be checked against the originals before the repository cites them.
- **Files:**
  - `docs/research/experiments/e84_z6_exchange_lib.js`: the law and its safeguards;
  - `e84_z6_exchange.js`: the checks and the estimates of section 8;
  - `results_2026-11-20/e84_z6_exchange.txt`: its output.

  Where the text below says `exchange.js` or `exchange_test.js`, read those.

Marks used below: **[sourced]** a value from the literature; **[sourced, from memory]** a literature value I could not re-read today (the page was paywalled or would not parse) and which must be checked against the original before it is called a source in the repository; **[derived]** follows from the equations here; **[bet]** my judgement.

## 0. The finding that matters most

The question was put as "does the bow's air leave in about 1 second or about 30". Three results, in order of confidence:

1. **One second is not physically available.** 35,000 m3 in 1 s through 300 m2 is 117 m/s of water, a head of over 690 m (section 10). Air cannot leave a closed space faster than water replaces it. The floor, for any regime and the whole section open, is about 5 s to lose half and 10 s to lose nine tenths. [derived]
2. **On a piece that is sinking, the air's volume goes by compression, not by venting, and the regime at the torn end hardly matters.** The sea's pressure rises 1 atm per 10 m. A space of air V at absolute pressure p on a piece sinking at w asks for water at Q_c = V ρ g w / p. At the surface with V = 35,000 m3 that is 3,400 m3/s per m/s of sinking speed. The largest exchange the torn end can carry (section 8) is about 1,500 m3/s at 300 m2. So above a sinking speed of about **0.4 m/s** the whole opening carries water inward, no air leaves, and the air is squeezed in place, its pressure lagging the sea's by whatever head the inflow needs. [derived] In the runs of section 8(iii) (0.5 m/s2 up to 10 m/s) the air's volume is halved at 8 to 10 s and down to a tenth at 18 s for a 300 m2 opening, level or end-up alike; 16 s and 23 s for 100 m2. Most of the air's *amount* is still aboard then; it simply no longer displaces much.
3. **Venting proper (the air's amount leaving) is a 10 to 100 s process** and decides the matter only while the piece is not yet sinking: level, about 11 s (half) and 23 s (nine tenths) at 300 m2; end up at 90 degrees, about 26 s and 46 s, with a band of a factor 4 either way that is real ignorance (section 5).

So the model's sensitivity is not to "one counter-flow opening, two, or many". It is to (i) the clear area times its discharge coefficient, which sets the pressure lag, and (ii) the first ten seconds of the piece's sinking speed.

## 1. Inputs and symbols

One opening between side a (inside) and side b (outside: the sea or another space).

- A: clear area. L: its extent along the dip direction in its own plane; b = A/L its width. n_z: the z-component of its unit normal pointing from a to b (0 vertical opening, +1 faces up, -1 faces down). Its vertical extent is h = L sqrt(1 - n_z^2); z_c its centroid's world height.
- A side is (z_w, p_a): its free surface's world height and the air pressure above it. The sea is (0, 1 atm). A side's pressure at height z is p(z) = p_a + ρ_w g max(z_w - z, 0); air's weight is neglected (under 1 % of water's to 80 m depth).
- ρ_w = 1025 kg/m3; ρ_a = 1.27 kg/m3 × p_a / 1 atm (isothermal, about 5 C); σ = 0.074 N/m.
- C_d: discharge coefficient, with obstruction if A is the gross area.
- D_h: hydraulic diameter of one unobstructed cell of the opening (the whole opening's is 2Lb/(L+b)).
- Outputs: q_w (water, b to a), q_a (air, a to b, at a's pressure), and the two reverse flows.

## 2. Law P, the pressure law: cases (a), (b), (c), (f)

At each height z of the opening, Δp(z) = p_b(z) - p_a(z). The strip at z flows from the higher pressure to the lower, carries whatever fluid stands on the upstream side at that height, at

    v(z) = sqrt(2 |Δp(z)| / ρ_upstream),      dq = C_d v(z) dA,     dA = A ds, z = z_c + (s - 1/2) h

Δp is piecewise linear in z with kinks at the two free surfaces, so the integral is exact in closed form (`lawP`): the mean of sqrt(x) for x linear from x0 to x1 is (2/3)(x1^1.5 - x0^1.5)/(x1 - x0). For air the pressure difference is capped at 0.47 p_upstream (choked flow). This is the stratified-flow integration of Brown and Solvason (1962) and Emmons's vent flows, as used in fire zone models and in ship flooding codes (Ruponen 2007; Dillingham 1981 for water alone); the only extension is that the two fluids differ in density by 800 to 1, so nothing is linearised. [sourced method; derived form]

What it gives, with no switch between cases:

- **(a) Opening wholly below the inside water.** Δp is uniform: q_w = C_d A sqrt(2 Δp / ρ_w), the submerged orifice.
- **(b) Opening wholly in the inside air, sea above it.** If p_sea(z) > p_a over the whole opening, water jets in over all of it; if p_a is higher over all of it, air blows out over all of it, at sqrt(ρ_w/ρ_a) = 28 times the speed water would have for the same pressure difference (11 times at 50 m depth).
- **(c) Vertical or inclined opening with the neutral plane inside it.** Where p_a = p_sea(z_n) falls inside the opening, air leaves above z_n and water enters below. With no net volume flow (quasi-steady, the piece not sinking) the neutral plane sets itself so that the two volume flows match. For air inside down to the opening's foot:

      air's share of the height   f = r/(1+r),   r = (ρ_a/ρ_w)^(1/3)      → 0.097 at the surface, 0.16 at 50 m
      q_w = q_a = C_d (2/3) b sqrt(2g) [(1-f) H]^1.5 = 0.574 C_d A sqrt(2 g H) at the surface

  [derived; `exchange_test.js` checks both to 0.2 %]. This is the doorway formula with the Boussinesq halves (each fluid taking half the door, Brown and Solvason's q = (C_d/3) A sqrt(g' H)) replaced by the true ratio: because air is so light it needs only the top tenth, and **the vertical torn end is a flooding opening vented at its top, not a lock exchange.** Water enters at 0.57 C_d sqrt(2gH): 4.8 m/s for H = 10 m, C_d = 0.6.
  When the inside level stands above the opening's foot, with an air layer of thickness a under the deckhead: q_w ≈ C_d A sqrt(2 g a) while a << H, so the layer thins as sqrt(a) falls linearly and is gone in the finite time t = 2 V_0 / (C_d A sqrt(2 g a_0)).
- **(f) Compression.** Law P needs no separate case: when the sea's pressure rises faster than the exchange can follow, p_a falls behind, the neutral plane climbs out of the top of the opening, and the opening is case (b), water in everywhere. The criterion, per space: compression rules when

      Q_c = V_a ρ_w g w / p_a   >   Q_x  (the exchange the opening can carry: section 2(c) or section 3)

  i.e. w > w* = Q_x p_a / (V_a ρ_w g). For the bow at the surface w* ≈ 0.2 to 0.6 m/s. Note that V_a/p_a falls as 1/p^2 with depth for a fixed amount of air, so w* rises fast: by 50 m depth (6 atm) the pocket is a sixth of its volume, Q_c is 36 times smaller at the same speed, and buoyancy-driven exchange is possible again even at 10 m/s. Exchange resumes at depth and removes what compression left; by then it is a few per cent of the first buoyancy. [derived]

**The discharge coefficient.** 0.60 for a sharp-edged opening [sourced: standard; ITTC and IMO flooding practice use 0.6]. Measured door and vent coefficients in flooding model tests run about 0.58 to 0.83 [sourced, from memory: Ruponen 2006-2007, the box-barge benchmark tests]; fire doorways 0.68 to 0.73 [sourced, from memory: Steckler, Quintiere and Rinkinen 1982]. Band for a clear opening: **0.45 to 0.75, central 0.60**. For the torn end the geometric blockage (decks, stubs, boilers, machinery) is separate and far less certain: clear fraction 0.4 to 0.8 of the gross section is my **[bet]**; say A is the clear area and keep C_d at 0.6. Air blowing out into water has the water's inertia to push aside; a lower C_d for the air strip (0.3 to 0.6) is a **[bet]** that barely matters, since the air strip resizes itself as C_d^(2/3).

## 3. Law X, the counter-current law: case (d)

Take the opening horizontal with water above and air below (the torn end up on a piece pitched to 90 degrees). Law P gives one-way flow or, at balance, none. In fact the interface is Rayleigh-Taylor unstable and air rises through falling water. The exchange is a flooding line in the two superficial velocities (volume flow per unit area), j_g of air upward and j_f of water downward:

    sqrt(j_g / j_g0) + sqrt(j_f / j_f0) = 1                                            (Wallis's form)
    j_f0 = (C/m)^2 sqrt(g D_h Δρ/ρ_w)        water alone
    j_g0 = min( C^2 sqrt(g D_h Δρ/ρ_a),  Ku (g σ Δρ)^(1/4) / sqrt(ρ_a) )    air alone: Wallis, capped by Kutateladze

With the net flux n = j_f - j_g taken from law P (the pressure difference at the opening), the pair on the line is unique (`floodingPair`); for n ≥ j_f0 there is water only, for n ≤ -j_g0 air only, so the law joins case (b) continuously. With no net flow (j_g = j_f = j):

    j = 1 / (1/sqrt(j_g0) + 1/sqrt(j_f0))^2
    without the cap:  j = C^2 sqrt(g D_h) / (m + (ρ_a/ρ_w)^(1/4))^2  = 0.35 sqrt(g D_h) for C = 0.70, m = 1 at the surface

**Constants.**

| Constant | Central | Band | Status |
|---|---|---|---|
| C (intercept) | 0.70 | 0.55 to 1.0 | [sourced] Wallis 1969: 0.725 sharp-edged ends, 0.88 to 1.0 rounded. 0.70 reproduces Clanet and Searby's bottle (below). The low end is a [bet] for a ragged, obstructed end |
| m (slope) | 1.0 | 0.8 to 1.0 | [sourced] Wallis 1969 |
| Ku (zero penetration) | 3.2 | 3.0 to 3.4 | [sourced] Pushkina and Sorokin 1969 (C_K = 1.79, Ku = C_K^2), confirmed for tubes of 6 inches and more by Richter, Wallis and Speers, NUREG/CR-0312 |
| the cap itself | on | on or off | [bet] |
| D_h | the whole opening's | 3 to 5 m (one deck height by a room) up to the whole | [bet]: the "one, two or many" question lives here, as sqrt(D_h) |

**Cross-checks of the no-net-flow exchange, as a Froude number j / sqrt(g D):**

- Emptying bottles, air and water, thin neck: Clanet and Searby (2004) find the emptying time T = 3.0 (L/sqrt(g D_0)) (D_0/d)^(5/2), which is j = 0.33 sqrt(g d) through the neck [sourced]. The law without the cap gives 0.347 at d = 20 mm (`exchange_test.js`). A long bubble in a vertical tube rises at 0.35 sqrt(g D) (Dumitrescu 1943; Davies and Taylor 1950) [sourced, from memory]: the same number.
- Epstein (1988), brine over water through a hole in a horizontal partition: Q = 0.055 sqrt(g D^5 Δρ/ρ_mean) for a thin partition (L/D < 0.15), rising to a peak near 0.147 at L/D ≈ 0.6 [sourced, from memory]. Put Δρ/ρ_mean = 2 for air and water (far outside the experiment's 0.02 to 0.2): j = 0.10 sqrt(g D) thin, 0.26 at the peak. Epstein and Kenton (1989) measured the one-way flow that purges the counter-flow, which is this law's j_f0 and j_g0 in kind; I could not re-read their constant.
- The limit of fully separated streams (water down one half, air up the other, each at Bernoulli speed for a head of order D): law P itself at a small tilt, about 0.48 sqrt(g D) for C_d = 0.6.

So the exchange Froude number of a large horizontal opening lies between **0.10 and 0.5, central 0.2 to 0.35** [bet on sourced ends]. C = 1.0 without the cap gives 0.71, above the separated limit: I keep it in the tables as an outer bound, not as a likely value.

**Wallis or Kutateladze at 5 to 20 m?** Neither, as published, and it matters to say why.

- Wallis's scaling (velocities as sqrt(g D)) was fitted in tubes up to about 50 mm. For gas-driven flooding (a forced gas stream holding up a film) it fails for dimensionless diameters D* = D sqrt(g Δρ/σ) above about 30 to 60; the gas velocity for zero penetration then stops growing with D and sits at Ku ≈ 3.2 [sourced]. Here D* is 1,800 to 7,400. Wallis's gas intercept at D = 17 m would be about 190 m/s, which is absurd; Kutateladze's is 15 m/s at the surface and 6 m/s at 50 m (it goes as ρ_a^(-1/2)). So the **gas** intercept must be Kutateladze's.
- But a Kutateladze form for the **liquid** intercept (j_f0 = Ku (gσΔρ)^(1/4)/sqrt(ρ_w) ≈ 0.5 m/s, whatever the size) describes a film draining on a wall against a gas core. It would say that water cannot fall through a 15 m hole faster than half a metre a second with no air opposing it, which is false. In a buoyancy-driven exchange through a short opening the liquid is not a film; the instability's scale grows to the opening's (bottles, Taylor bubbles, Rayleigh-Taylor fronts all go as sqrt(g × size)). So the **liquid** intercept keeps Froude scaling.
- Hence the hybrid: Froude for water, Kutateladze-capped for air. At D_h = 17 m it gives j = 2.4 m/s at the surface (Froude number 0.19) and 1.6 m/s at 50 m, against 4.5 m/s uncapped. **There is no experiment on air-water counter-current exchange through an opening metres wide that I could find**; the nearest full-scale work (the UPTF downcomer tests, 1980s-90s) is film flooding in an annulus and supports only the gas side [sourced, from memory]. The hybrid is a **[bet]** and the cap is a switch (`kuCap`) so that both ends can be run.

## 4. Intermediate orientations: case (e)

Both laws run at every attitude, and the opening takes the larger exchange:

    extra = max(0,  W × e_X  -  e_P),      W = f_x sqrt(|n_z|)
    q_w := q_w(P) + extra A,   q_a := q_a(P) + extra A

- e_P is law P's own two-way exchange (the smaller of its two opposed flows, per area); it grows with the vertical extent h = L sqrt(1 - n_z^2), as h^(1/2) in velocity.
- e_X is the flooding line's exchange at law P's net flux; W weights it by the component of gravity along the normal (velocities as sqrt(g |n_z| D)) and by f_x, the share of the opening that has water above and air below. A vertical opening (n_z = 0) or a stably stratified one (air above water: a diving bell, the stern's torn end facing down) gets none.
- The net flow is always law P's, so mass balance and the one-way limits are untouched.

Why a maximum and not a sum: the two are pictures of the same exchange, not two channels. The crossover falls at 5 to 15 degrees from horizontal for the central constants; beyond that the tilted opening separates its own streams (air out of its high edge, water in at its low edge) and law P rules. That a tilt speeds the exchange is well established for long bubbles in tubes (Zukoski 1966: the speed rises with inclination to a maximum between the vertical and the horizontal, then falls; Bendiksen 1984 gives Fr = 0.54 cos β + 0.35 sin β) [sourced for the trend; the two numbers from memory]. The weight sqrt(|n_z|) and the rule "larger of the two" are **[bets]**; the tables of section 8 show the law is not sensitive to them (90, 80 and 70 degrees differ by a factor 1.5, inside the band of C alone).

## 5. What is uncertain, plainly

1. **The clear area and its coefficient** (a factor 3 between plausible ends): it sets every time in section 8 in inverse proportion, and the pressure lag as its inverse square.
2. **The exchange Froude number of a horizontal opening metres wide** (0.10 to 0.5; a factor 5): no experiment at this scale, an 800:1 density ratio outside Epstein's data, a ragged obstructed edge outside Wallis's.
3. **The cell size** (one opening or many): sqrt(D_h), a factor 2 between 4 m cells and the whole section.
4. **Quasi-steadiness.** The laws are steady-state. The first second after the tear is not: the water has to be set moving (an inertial time of order L_eff / v ≈ 10 m / 10 m/s = 1 s), the air may oscillate (the "glug", a mass-spring of the water plug on the air pocket: period 2π sqrt(ρ_w L_eff V_a / (p_a A)) ≈ 2 to 7 s for these numbers). Neither is in the law. [derived] A plug inertia term per opening would be the next refinement; I would not add it before the area is better known.
5. **The structure.** With a 100 m2 opening the runs of section 8(iii) show the air's pressure 60 to 70 m of head behind the sea's. No deck or bulkhead of this ship stands a tenth of that. In truth the hull's own openings and plating give way and the effective area grows; the stern's wreck shows exactly this. The model should either open the space when the lag passes a strength, or accept that small torn ends are unphysical in a fall. **[bet]**
6. **Isothermal air.** Compression in seconds is nearer adiabatic (p V^1.4) for the bulk of a 35,000 m3 pocket; the air then holds 10 to 30 % more volume at a given depth for the first tens of seconds, until spray and steel cool it. Not in the law; a known bias toward too little buoyancy early.

## 6. Numerical safeguards at 1/32 s (in `exchange.js`)

- **The stiff variable is the air pressure, not the level.** A pocket's stiffness is p_a/V_a (Pa per m3), which for a fixed amount of air grows as depth squared. Air through an opening responds 28 times faster than water. Explicit stepping of p_a is unstable when (dq/dp)(p_a/V_a) dt > 2, which for a 20 m wide two-layer opening happens below about 260 m3 at the surface and below about 13,000 m3 at 50 atm. So:
- **`stepSpace` (use this):** one space's end-of-step air pressure is found so that Boyle's law closes with all its openings' flows evaluated at that pressure. The residual p V_new(p) - (pV)_new(p) is monotone in p, so 48 bisections in log p cannot fail, overshoot or depend on a starting guess; the count is fixed, so the step stays deterministic. Levels are taken explicitly (they move millimetres per sub-step). It also holds the positivities: no more air out than there is, no more water in than there is room.
- **`limitOneWay`:** for a flow q = c sqrt(Δp) relaxing a pressure difference against a stiffness k, the exact volume moved in dt is q dt (1 - x/4) for x = k q dt/Δp < 2 and Δp/k beyond: a sub-step can bring the two sides level and never passes them. Use it for water between two spaces' levels (k = ρ g (1/S_a + 1/S_b)); with several openings on one space, apply it to the space's summed net flow.
- The flooding line is solved by a fixed 40 bisections; `lawP` is closed-form. No iteration depends on tolerance, so results are the same bits on one engine.
- Cost: `stepSpace` evaluates each opening 49 times per sub-step. If that is too dear, keep the last pressure and do 3 to 4 secant steps inside a bisection bracket; the bracket is what must not be given up.

## 7. Where each case shows in the fall

| Time | Piece | Torn end | Law in charge |
|---|---|---|---|
| Break, piece near level, not sinking | bow, stern | vertical | P, two-layer: water over nine tenths of the opening, air out of the top tenth |
| Piece sinking faster than about 0.4 m/s near the surface | both | any | P, one-way inflow: compression, with a pressure lag |
| Bow pitched bow-down 60 to 90 degrees | bow | faces up | X (within about 10 degrees of 90) or P's tilted exchange; only if the sinking is slow or the depth is past about 50 m |
| Stern standing on end | stern | faces down | none: the air is stably trapped above (a diving bell) and only compression and the other openings take it |

## 8. Estimates: the bow's 35,000 m3 of air

From `exchange_test.js` (dt = 1/32 s, `stepSpace`). Shape of the opening: 1.4 times as wide as high (8.5 m, 14.6 m, 20.7 m high for 100, 300, 600 m2). A is clear area. Times are to lose **half / nine tenths of the air's amount**, in seconds. "Depth" is the deckhead's.

**(i) Level, vertical opening** (air a layer 14 m thick, the opening's top at the deckhead; piece not sinking). Band: C_d 0.45 / 0.60 / 0.75.

| A, m2 | depth | slow | central | fast |
|---|---|---|---|---|
| 100 | 0 | 53 / 106 | 40 / 79 | 32 / 64 |
| 100 | 50 m | 60 / 120 | 45 / 90 | 36 / 72 |
| 300 | 0 | 14 / 31 | 11 / 23 | 8.5 / 19 |
| 300 | 50 m | 16 / 37 | 12 / 28 | 9.7 / 22 |
| 600 | 0 | 6.5 / 15 | 4.9 / 12 | 3.9 / 9.2 |
| 600 | 50 m | 7.6 / 19 | 5.7 / 14 | 4.5 / 11 |

Air above the opening's top edge never leaves by this route. The band shown is C_d alone; the clear area's uncertainty multiplies it.

**(ii) Pitched, torn end up** (air a column 58 m deep under the opening; piece not sinking). Slow: C 0.55, cap on, 4 m cells, C_d 0.45. Central: C 0.70, cap on, the whole opening one cell, C_d 0.60. Fast: C 1.0, no cap, C_d 0.75 (an outer bound, see section 3).

| A, m2 | depth | 90 deg: slow | central | fast | 80 deg: slow | central | fast | 70 deg: slow | central | fast |
|---|---|---|---|---|---|---|---|---|---|---|
| 100 | 0 | 173 / 310 | 91 / 164 | 25 / 46 | 127 / 229 | 92 / 166 | 26 / 46 | 91 / 164 | 68 / 123 | 26 / 47 |
| 100 | 50 m | 225 / 405 | 130 / 234 | 30 / 54 | 142 / 256 | 107 / 192 | 30 / 54 | 101 / 182 | 76 / 137 | 31 / 56 |
| 300 | 0 | 58 / 104 | 26 / 46 | 6.4 / 12 | 32 / 58 | 24 / 44 | 6.5 / 12 | 23 / 42 | 17 / 31 | 6.7 / 12 |
| 300 | 50 m | 75 / 135 | 38 / 68 | 7.6 / 14 | 36 / 65 | 27 / 49 | 7.7 / 14 | 26 / 46 | 19 / 35 | 7.8 / 14 |
| 600 | 0 | 29 / 52 | 12 / 21 | 2.7 / 4.9 | 14 / 25 | 10 / 18 | 2.8 / 4.9 | 9.7 / 18 | 7.3 / 13 | 2.8 / 5.1 |
| 600 | 50 m | 38 / 68 | 17 / 31 | 3.2 / 5.8 | 15 / 27 | 11 / 20 | 3.2 / 5.8 | 11 / 19 | 8.2 / 15 | 3.3 / 5.9 |

Reading: at 300 m2 the horizontal opening is 2 to 3 times slower than the vertical one on the central constants, and anywhere from equal to 5 times slower across the band. At 70 degrees the tilt has already brought it back to the vertical opening's rate.

**(iii) The same spaces on a sinking piece** (0.5 m/s2 up to 10 m/s, from just under the surface; central constants). What counts for the fall is the air's volume.

| Case | volume halved | a tenth left | air's amount still aboard at 10 s | largest lag, m of head |
|---|---|---|---|---|
| level, 300 m2 | 8.3 s | 17.7 s | 91 % | 5.5 |
| level, 100 m2 | 15.8 s | 22.8 s | 99 % | 63 |
| end up, 300 m2 | 9.9 s | 17.8 s | 96 % | 14 |
| end up, 100 m2 | 16.6 s | 23.2 s | 99 % | 73 |

Boyle's law alone (no lag, nothing vented) would halve the volume at 10 m of depth, 6.3 s into this descent. The regime changes the answer by under 2 s at 300 m2; the area changes it by 7 s; the assumed acceleration changes it most of all (the depth of 10 m is reached at sqrt(20/acc) seconds).

## 9. Assessment: the bow's torn end in its first 30 seconds

- **Most likely sequence.** At the break the bow piece was already deep in the water, down by the head and going down; its torn end stood near the surface and near vertical. For the first seconds the end worked as section 2(c): water in over most of its height, air out of the top. As soon as the piece sank faster than a few tenths of a metre per second, which on any account is within seconds, the end became a one-way water inlet and the air aft was compressed where it stood, with a lag of metres to tens of metres of head. The counter-current regime at a steep pitch, on which the previous design hung the uncertainty, could act only if the piece hung near the surface pitched up for tens of seconds, which a bow piece without buoyancy forward does not do. I put the pure counter-current regime as the controlling one at under 1 in 5. **[bet]**
- **The time that matters** is how long the after air keeps most of its buoyant volume: **about 8 to 20 s**, set by the depth history and the clear area, not by the regime. Neither 1 s nor 30 s. By about 100 m (some 20 s) under a tenth of the surface volume is left on every case with 300 m2 or more.
- **The uncertainty really is wide, but it has moved.** In venting time proper (piece held at the surface) it is a factor of about 4 either way on the central 10 to 45 s, from the clear area (×3), the large-scale counter-current constant (×5, horizontal only) and the cell size (×2). In the buoyancy time on a sinking piece it is about a factor 2 (8 to 20 s), and it comes from the area, the first seconds' sinking speed, the adiabatic stiffening (item 6 of section 5, which lengthens it) and the structure giving way under the lag (which shortens it).
- **For the wreck's 772 m:** if the flat fall needs the buoyancy gone in about 1 s and the nose dive needs it kept for about 30 s, this law says the truth is between and nearer the first in effect: half gone inside 10 s and nearly all inside 20 s, during which the piece has fallen only 50 to 100 m of its 3,800. Whether 10 s of fading buoyancy aft is enough to set a nose-down attitude that then persists is a question for the free body's run, not for this law; I would run the fall with the lag band (clear area 150 to 600 m2) before believing either landing distance.

## 10. Certified arithmetic (abacus receipts)

Abacus certifies the arithmetic and the dimensions of the formulas, given the inputs stated; it says nothing about whether a constant or a law is right. All grades below are "exact" (certified). g = 9.80665 m/s2, ρ_w = 1025 kg/m3, ρ_a = 1.27 kg/m3, σ = 0.074 N/m, 1 atm = 101,325 Pa.

Dimensions:

| Formula | Comes out as | Receipt |
|---|---|---|
| C_d A sqrt(2 Δp/ρ) (orifice, every strip of law P) | m3/s | abacus1:24fe89ff1269 |
| C_d b sqrt(2g) H^1.5 (two-layer exchange) | m3/s | abacus1:931a5c460443 |
| Ku (g σ Δρ)^(1/4) / sqrt(ρ) (Kutateladze intercept) | m/s | abacus1:acea526d1607 |
| j sqrt(ρ/(g D Δρ)) (Wallis's group j*) | dimensionless | abacus1:2e196b84f176 |
| V ρ g w / p (compression demand Q_c) | m3/s | abacus1:35742622efd6 |
| sqrt(ρ L V/(p A)) (the glug's period, without its 2π) | s | abacus1:30608c0187b3 |

Numbers:

| Claim | Inputs | Receipt |
|---|---|---|
| Venting in 1 s through 300 m2 needs a head over 690 m | (35000/300)^2/(2g) > 690 | abacus1:de798668b01b |
| Q_c at the surface is 3,400 to 3,500 m3/s per m/s of sinking | 35000 × 1025 × g × 1 / 101325 | abacus1:b8edec59c7f7 |
| w* is 0.42 to 0.45 m/s for Q_x = 1,500 m3/s | 1500 × 101325/(35000 × 1025 × g) | abacus1:6d4764a27b08 |
| Air's share of a vertical opening's height at 1 atm is 0.096 to 0.098 | r/(1+r), r = (1.27/1025)^(1/3) | abacus1:3d003fa2f03f |
| The two-layer factor is 0.570 to 0.578 (the text's 0.574) | (2/3)(1/(1+r))^1.5 | abacus1:c616649ef29a |
| A 14 m air layer, 300 m2, C_d 0.6, opening much higher than the layer: gone in 23 to 24 s | 2 × 35000/(0.6 × 300 × sqrt(2g × 14)) | abacus1:96195690df77 |
| Kutateladze's gas intercept at the surface is 14.5 to 15.5 m/s | 3.2 (g × 0.074 × 1023.73)^(1/4)/sqrt(1.27) | abacus1:2a1b699e7940 |
| Uncapped exchange Froude number for C = 0.70, m = 1 is 0.34 to 0.36 | 0.49/(1 + (1.27/1025)^(1/4))^2 | abacus1:5a24749c9404 |
| Hybrid exchange at D_h = 17 m, C = 0.70, surface: j is 2.2 to 2.5 m/s | 1/(1/sqrt(j_g0) + 1/sqrt(j_f0))^2 | abacus1:992b2f0db21e |
| Hence nine tenths of 35,000 m3 through 300 m2, end up, held at the surface: 42 to 48 s (the run gives 46.2 s) | 0.9 × 35000/(300 j) | abacus1:9c962e382c18 |

The tables of section 8 are the stepped runs of `exchange_test.js` in binary64 and are not certified; the last two rows above and the 23 to 24 s row (the run: 23.4 s with a 14.6 m opening) tie them to closed forms.

## 11. Sources

Read or confirmed today (search results and abstracts):

- Clanet, C. and Searby, G. (2004), On the glug-glug of ideal bottles, J. Fluid Mech. 510, 145-168. https://hal.archives-ouvertes.fr/hal-00014915 (the emptying-time law and its 3.0).
- Richter, H. J., Wallis, G. B. and Speers, M. S., Effect of scale on two-phase countercurrent flow flooding, NUREG/CR-0312. https://www.osti.gov/biblio/5981602 (Wallis holds in 2 inch tubes; zero-penetration gas velocity the same for 6 inches and more).
- Pushkina, O. L. and Sorokin, Y. L. (1969), Breakdown of liquid film motion in vertical tubes, Heat Transfer Sov. Res. 1, 56-64: C_K = 1.79 at the onset of penetration, as quoted in Kobe University's CCFL papers (https://da.lib.kobe-u.ac.jp/da/kernel/90005497/90005497.pdf) and in the square-top-end study (C_K = 1.53 ± 0.11, m = 0.97 for D ≥ 30 mm: https://inis.iaea.org/records/sdprj-8x593).
- Epstein, M. (1988), Buoyancy-driven exchange flow through small openings in horizontal partitions, J. Heat Transfer 110, 885-893, DOI 10.1115/1.3250589; Epstein, M. and Kenton, M. A. (1989), Combined natural convection and forced flow through small openings in a horizontal partition, J. Heat Transfer 111, 980-987, DOI 10.1115/1.3250814. Existence, method (brine and water, L/D 0.01 to 10, four regimes) and the purging "flooding" flow confirmed; the coefficients quoted in section 3 are from memory.
- Heiselberg, P. and Li, Z. (2009), Buoyancy driven natural ventilation through horizontal openings. https://vbn.aau.dk/ws/files/19119141/Buoyancy_Driven_Natural_Ventilation_through_Horizontal_Openings (restates Epstein's regimes; the file would not parse today).
- Ruponen, P., Kurvinen, P., Saisto, I. and Harras, J., Air compression in a flooded tank of a damaged ship (full-scale tests: restricted venting delays flooding markedly). https://cris.vtt.fi/en/publications/air-compression-in-a-flooded-tank-of-a-damaged-ship/
- Zukoski, E. E. (1966), Influence of viscosity, surface tension, and inclination angle on motion of long bubbles in closed tubes, J. Fluid Mech. 25, 821-837. https://resolver.caltech.edu/CaltechAUTHORS:20110103-104138242 (the maximum at an intermediate inclination confirmed; numbers from memory).

From memory, to be checked against the originals before they are cited in the repository:

- Wallis, G. B. (1969), One-dimensional Two-phase Flow, McGraw-Hill, ch. 11 (the flooding correlation, C = 0.725 and 0.88 to 1.0, m = 0.8 to 1.0).
- Kutateladze, S. S. (1972), Elements of the hydrodynamics of gas-liquid systems, Fluid Mech. Sov. Res. 1, 29-50.
- Brown, W. G. and Solvason, K. R. (1962), Natural convection through rectangular openings in partitions, Int. J. Heat Mass Transfer 5, 859-868; Emmons, H. W., Vent flows, SFPE Handbook; Steckler, K. D., Quintiere, J. G. and Rinkinen, W. J. (1982), Flow induced by fire in a compartment, 19th Symp. (Int.) on Combustion.
- Dumitrescu, D. T. (1943), Z. angew. Math. Mech. 23, 139; Davies, R. M. and Taylor, G. I. (1950), Proc. R. Soc. A 200, 375; Benjamin, T. B. (1968), J. Fluid Mech. 31, 209; Bendiksen, K. H. (1984), Int. J. Multiphase Flow 10, 467.
- Ruponen, P. (2007), Progressive flooding of a damaged passenger ship, doctoral thesis, Helsinki University of Technology (the pressure-correction method with air; measured discharge coefficients); Dillingham, J. (1981), Marine Technology 18, 38.
- Whalley, P. B. (1987, 1991), flooding, slugging and bottle emptying, Int. J. Multiphase Flow (C about 0.9 to 1.0 for bottles with rounded necks).
- The UPTF downcomer counter-current tests (Glaeser 1992, Nucl. Eng. Des. 133, 259).
