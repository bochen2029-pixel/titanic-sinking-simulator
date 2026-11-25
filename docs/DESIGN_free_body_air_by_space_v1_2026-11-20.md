# Z6, the free body's air space by space: a design (v1)

- **Written:** 2026-11-20, 09:19 CST, by the Z1 session (Claude Code 7fe8d708, Opus 5.5).
- **For:** the coordinator (local_5ca1b235), on its request after Z1's report of 09:12: "a short DESIGN note for Z6, the free body's air space by space. Design only, no code."
- **Status:** design only. Nothing is built, and nothing in any tree changed for it.
- **Accepted** by the coordinator as written: size L, Z6 inside B4's joint, the cut as the open spaces' opening until B4 owns the tear, and the five doubts in this order.
- **Carried into the repository** with Z1's lane, at the coordinator's request, from the notes folder's `Z1_design_Z6_air_by_space_2026-11-20.md`. The text is as it stood; only this line and section 10's last two lines are new.
- **Where its evidence lives now:** `docs/research/experiments/results_2026-11-20/`, from the experiments e60 to e67. The notes-folder tables of section 1 are, in order: e62 (the hand-off sweep), e63 (the bow three ways), and e64 and e65 (the cut as a vent, and its rates).
- **Section 6's timings are one run's.** Wall-clock times on the laptop moved with what else was running. Across the day's runs the core took 62 to 119 µs a step, and the fall 30 to 119 µs a sub-step under water and 121 to 358 at the surface (e66). The ratios that size Z6 hold across the runs.

**Tags:**
- [R5]: `docs/research/RESEARCH_the_fall_and_the_wreck_v1_2026-11-19.md`
- [R6]: `docs/research/RESEARCH_falling_hull_physics_v1_2026-11-19.md`
- [plan]: `docs/BRAINSTORM_the_descent_to_the_bed_v2_2026-11-19.md`
- [core]: `core/core.js`
- [S1]: the mainline's staircases and windows
- [M]: measured today on the read-only copy of the mainline's tree (share 0)
- [bet]: a choice with a band, not a fact

## 0. In one paragraph

The fall's first minute is decided by the air, and one pocket a piece cannot give both pieces.

- **The bow:** let go with no air, it never stands on its nose. It falls flat and lands 724 to 792 m off, dead ahead (R5: 772). With Z1's one pocket it stands on its nose and lands 1.3 to 1.5 km off.
- **The stern:** an opening that empties the bow in seconds also empties the stern once it settles back, in 9 s against the record's 1.5 to 3 minutes. No exit rate gives both [M].

Z6 replaces the pocket with the core's own spaces, cut at the break.

- **State:** each space keeps its water and its air.
- **Where the air sits:** at any attitude, above the space's free surface. That surface is found by the core's level solve on whichever of three column sets stands most upright.
- **Exchange:** water and air cross each opening by laws that know which fluid is on each side, with Wallis's limit where one opening must carry both.
- **Failure:** a space whose boundary is pushed harder than its strength fails at once, as an event with an energy Δp·V.

Nothing is fitted: the openings are the core's own, the strengths are R6 4.3's, and each is a bet with its band.

## 1. Why: the three tables of 2026-11-20 [M]

| Table (notes folder) | What it showed |
|---|---|
| `Z1_handoff_sweep_share0_2026-11-20_0853.txt`, nine hand-off moments, T 155.25 to the flag | The stern lands 82 to 152 m from the break point, upright before T 157.0. The bow lands 1,279 to 1,562 m out, its bearing swinging by the quarter-minute: whether it tips past the vertical in its first 10 s decides it. |
| `Z1_bow_three_ways_share0_2026-11-20_0901.txt`, the bow from T 155.5 | With no air: under in 4 s, flat by 30 s, falling at 9.0 m/s, upright 724 m dead ahead (792 m from 156.0). With air: on its nose in 10 to 15 s, diving at up to 31 m/s, 1.47 km. With the vent shut it sinks from 155.5 but floats on end from 156.0: the air is about what floats it. |
| `Z1_cut_as_vent_*`, the cut as a vent of the one pocket | The bow lands 737 to 808 m, and the pair 679 to 763 m apart. The freed stern settles back cut end up within 5 s; its pocket's centre (z 15.2 m) lies above the cut's (13.8 m), so it goes under in 9 s. At the cut's area ×1/3 to ×1/100 the stern never lasts past 27 s. |

## 2. The state

**The spaces** are the core's 64 nodes: 16 compartments between bulkheads A to P, port and starboard, below and above E deck. Above E deck, each compartment is one space up to the top of what is shut in over it, the tiers included [core, S1].

- They are cut at the break station `x_b`. A node wholly forward goes to the bow, a node wholly aft to the stern.
- A node the cut crosses is split by length, and each part is open to the sea at the cut.
- At `x_b` = −23 the cut crosses Boiler room 1 (bulkhead J at −16.2, K at −27.1). The bow gets 40 spaces, with BR1's forward 62 %; the stern gets 28, with BR1's aft 38 %.

**At T 155.5** [M]:
- **The bow** holds 34,782 m³ of air, all of it in its after compartments: BR6 0.4, BR5 2.1, BR4 6.2, BR3 9.7, BR2 11.9 and its part of BR1 4.4 thousand m³. Its forward spaces (FP to H3) and the lower spaces of BR6 and BR5 are full.
- **The stern** is dry: 52,022 m³ in its 28 spaces. RE holds 13.9, TE 11.3, EL 11.0, T1 6.4, T2 4.7, AP 2.1 and its part of BR1 2.7 thousand m³.

**What each space k carries:**
- `W_k`, its water (m³);
- `a_k`, its air (m³ at one atmosphere, so its mass), isothermal [R6 10.5: n = 1, a bet within 1.0 to 1.4].

Everything else follows from these two:
- **The free surface:** a plane normal to gravity, at the height where the space's floodable volume below it equals `W_k`.
- **The air's volume:** `V_k − W_k`, at pressure `p_k = p_atm · a_k / (V_k − W_k)`.
- **The centroids:** the water's below the plane, the air's above it.

So the air always sits at the top of its space. That is the fix for today's pocket, which is fixed at a point in her frame.

**The volume below a plane** is the core's own column integral (`solveLevels`), run on one of three column sets: along the ship's z (the core's own), x and y. The set used is the one whose axis stands most upright, with a margin so that she does not flick between sets. The factor that blows up never passes 1.73 [plan 5.6, item 2]. The water inside is quasi-static, as in the core: it finds its level at once, with no sloshing.

**The mass and the loads.** Each space's water is a mass at its own centroid. Each space's air is a lift ρ g (V_k − W_k) at the air's centroid. Together they replace "all her floodable volume, less one pocket" in today's `massWithAir` and `loads`. The air's own weight is left out (0.1 % of its lift at the surface [R6 4.1]).

**The hand-over** is exact on the z set, because it is the core's own columns:
- `W_k` = the core's `vol[n]`, split by length across the cut, with the pressed-over water dropped as Z1 drops it today;
- `a_k` = `V_k − W_k` at one atmosphere.

## 3. The openings

**The core's own table** [core], each opening with its point in the ship frame, its area or weir crest, Cd 0.6, and its state:

| Kind | What | Size | At T 155.5, bow / stern |
|---|---|---|---|
| DOOR | watertight doors in the bulkheads, low (tank top + 0.85 m) and higher (deck + 1 m) | 1.5 and 1.67 m² a door | 26 / 26, all shut |
| OVER | over a bulkhead's top along E or D deck: Scotland Road, the starboard alleyway, two centre shares | weirs 3.0, 2.0, 2 × 0.5 m, each × wMul (1.036 on the mainline after S1's refit; 2.735 on Z1's branch) | 36 / 24 |
| DOWN | through E deck, two a side in each compartment | aDown/2 each (aDown 0.2815 m² a side on the mainline) | 38 / 26 |
| XLOW, XMERGE, XUP | port to starboard: under the firemen's tunnel, the merge weir, the passages above E deck | 0.05 m²; 0.3 × length; 1.0 m² | 4 / 0 |
| TOP | the top deck open to the sea, three stations in each compartment | a weir crest of fOpen × length in all (fOpen 0.02068 m per m on the mainline; 0.01411 on Z1's branch) | 58 / 38 |
| BREACH, OPEN | the berg's openings, portholes | as the core has them | 14 / 0 |
| STAIR [S1] | the grand staircases' doors and domes, and the tiers' windows: shut until the sea's head on each reaches its strength (hDoor 1.0, hDome 0.5, hWin 1.5 m), then open for good | as S1 has them | 66 (21 open) / 36 |

**The cut** adds one opening for each space it crosses. It is that space's part of the section at `x_b`: below or above E deck, port or starboard, out of 758 m² in all [M]. It opens to the sea, Cd 0.6 [bet]. B4 later replaces it with the tear's own opening (section 7).

**Two notes on the table:**
1. **TOP is a weir crest in metres, not an area.** Z1's stand-in vent read fOpen × length as m² (3.17 m² for the bow). Z6 takes it as the core has it.
2. **aDown, fOpen and wMul were fitted to the night's flooding:** two and a half hours at small angles. At 60 to 90 degrees, and for air, they are used outside their fit. They stay as they are, each marked a bet for this use, with no refit in Z6.

## 4. Exchange through one opening

An opening has a top and a bottom in the world. Each side has water below its free surface and air above it. The laws follow from which fluid is at the opening on each side.

| At the opening | Law | Source |
|---|---|---|
| Water both sides | The core's own: an orifice `Cd A √(2g) Δh/√|Δh|`, or a weir with Villemonte's factor. Each side's level now carries its air's gauge pressure, `h + (p_k − p_atm)/ρg`, so compressed air pushes back on the water coming in. This is the one change to the core's law. | [core] |
| Air both sides | From the higher pressure to the lower, `ṁ = Cd A √(2 ρ_a Δp)`; the compressible and choked forms only near the surface. Above the sea, the outside is p_atm. | [R6 4.2, 10.5] |
| Air one side, water the other | One way: whichever fluid is pushed harder goes through. Water comes in as above, or air leaves and rises outside. | [R6 4.2] |
| Both ways through one opening (it straddles the inside surface) | Counter-flow, limited by Wallis's law: `√j_g* + m √j_f* = C`, `j_k* = j_k √(ρ_k / (g D Δρ))`, m ≈ 1, C 0.7 to 1.0, D = √A. That is 1.0 to 2.2 m³/s each way through 1 m × 1 m at the surface, and 3 to 13 through 2 m × 2 m: 30 to 100 times slower than one-way venting. | [R6 4.2]; Wallis for a ship's opening is a [bet] |

**A space with two openings**, one above its air and one below its water, vents fast. Air leaves at the top and water comes in at the bottom. The air's pressure settles where the two volumes match:

`Cd A_t √(2 Δp_t / ρ_a) = Cd A_b √(2 Δp_b / ρ_w)`, with `Δp_t + Δp_b = ρ_w g H`

where H is the height between the openings' outside levels.

- Per square metre, water passes √(ρ_w/ρ_a) ≈ 29 times less volume than air under the same head.
- So when the top opening exceeds about 1/29 of the bottom one, the water's way in sets the rate: about `Cd A_b √(2gH)`.
- When the top is the smaller, the air's way out sets it: R6's "about a minute for every few thousand m³ per m² of opening".

Z6 solves the balance, so whichever opening limits does so by itself. The cut-as-vent what-if had no such balance: it let air out at the air's rate, up to 29 times too fast.

**The cut is itself a two-opening space.** With a piece near level, the lower part of the cut is under the space's free surface and the upper part is above it. Water comes in low and air leaves high, through the same torn section. Whether the torn decks and machinery let it act as two openings, or force Wallis's counter-flow, is the largest bet here (section 9).

**Numerics:**
- Each transfer in a sub-step is limited to half of what would level the two sides, in water as the core limits it, and in pressure for air. The cut can empty a space in under a second; the sub-step is 1/32 s.
- Water that comes in arrives at rest: her momenta are kept, as today.

## 5. Failure

**A space's boundaries** are:
- its two bulkheads (watertight, up to D or E deck by the core's table);
- E deck between its layers;
- the tank top under the lower layer;
- the shell;
- the deck over the upper layer;
- the non-watertight joiner work above E deck.

**A boundary fails** when the pressure on one side exceeds the other side's by its strength. Strengths, as heads of sea water, each a bet with its band [R6 4.3, 10.5]:

| Boundary | Head (m) |
|---|---|
| Non-watertight doors, joiner work | 1 to 3.5 |
| Decks loaded from below, hatches | 2 to 10 |
| Watertight bulkheads | 8 to 30; × 0.6 to 0.8 from the wrong side |
| Tank top | 15 to 30 |
| Shell | 20 to 60 |
| Boilers | hundreds: never (the five lie whole [R5 2.3]) |

**The event.** The space floods at once: the failed boundary becomes an opening of its own area to the neighbouring space or to the sea. It is logged with its depth and its energy `E = Δp · V_air` [R6 4.4: 500 m³ at 60 m is 0.3 GJ, 70 kg of TNT].
- The fall's contract already reserves the id: "`'report'` is Z6's and never fires here".
- The energy enters the identity as the sea's work, beside today's `W.air`.
- Two air spaces whose boundary fails merge at a common pressure.
- S1's `stairsStep` (dry, then holding, then given way) is the same pattern on the weather openings. Z6 extends it to the spaces' boundaries.

**"Report" is an audible failure:** one whose energy exceeds a stated threshold [bet: about 0.1 GJ, R6 4.4's scale]. The trials count them.

**Lag** (the plan's fourth fate [plan 4.3]) needs no law of its own. The sea's pressure rises an atmosphere a second at 10 m/s, while inside it rises only as fast as water gets in; when the difference passes a boundary's strength, the boundary fails. That is Mengot's "dragged under before the interior could completely flood".

## 6. The step's cost

**Today** [M, on the dry copy, T 155.5]:
- The core's step takes 71 µs: 64 spaces, 392 connections, the level solve.
- The fall's advance (dt 0.25 s, both pieces, 8 sub-steps each, 4 iterations a sub-step):
  - 5.1 ms at the surface, about 317 µs a sub-step; the clipping of the sections is the cost;
  - 1.3 to 1.5 ms under water, 81 to 93 µs a sub-step.
- A whole fall from T 155.5 to rest takes about 4.3 s.

**Z6** adds, for each piece and each sub-step:
- the level solve of its 28 or 40 spaces on one column set;
- the flows of its 150 to 250 openings;
- the air's pressures and the failures.

The core's own step is the measure: about 50 to 80 µs a piece. It runs once a sub-step, not once an iteration: the levels and the air are frozen over a sub-step, as today's pocket is, and the loads use the frozen centroids.

| Phase | Today a sub-step | With Z6 |
|---|---|---|
| At the surface, with air | 317 µs | about 380 µs (× 1.2) |
| Under, with air | 81 to 93 µs | about 150 µs (× 1.8) |
| Wholly flooded, or every space failed | 81 to 93 µs | unchanged: Z6 idles for that piece |

- **A whole fall:** about 5 to 7 s instead of 4.3.
- **One-off costs:** the three column sets are built once per ship, at about three times the core's columns in memory.
- **The core is unchanged:** its columns are reused, and its references stay frozen.

## 7. The tests

From R5 10b and the plan's Z6 rows. MUST unless marked.

| # | Case | Band | Source |
|---|---|---|---|
| 1 | Water levels and buoyancy agree across the three column sets at 45 degrees of pitch and of roll, and nothing jumps when the set in use changes | a stated tolerance | plan, Z6 row |
| 2 | The hand-over: each space's water is the core's at the hand-off and its air is the rest; the pieces' totals equal today's (bow 34,782 m³, stern 52,022 at T 155.5) | to the core's tolerance | [M] |
| 3 | Conservation: each piece's water and air (moles) are accounted by opening, and the energy identity closes with the air's and the failures' work | to rounding (today 1e-15) | Z1 |
| 4 | Single-space rigs: a box with openings above and below vents in R6 4.2's time; a box with one opening fills at Wallis's rate; a tight box fails at its strength's depth with E = Δp V; a pocket carried down follows Boyle | closed forms | R6 4.1 to 4.4 |
| 5 | The bow, untuned, from the onset: distance from the break point, direction, attitude | 540 to 950 m, dead ahead within the record's heading; upright, list 0 to 10 degrees | R5 10b |
| 6 | The stern afloat after the release, its cut end flooding first and rising | 1.5 to 3 min; it settles back, then rises toward vertical (65 to 90 degrees) before it goes | R5 5.2, 10c |
| 7 | The stern's first space fails within a minute of going under | 18 to 305 m down | R5 10b; plan |
| 8 | CHECK: the reports | about four, the first 0 to 60 s after she is under | R5 10b (Pitman, Scarrott) |
| 9 | No space of the bow fails | none | plan, Z6 row |
| 10 | Today's tables as regressions: all openings shut, the stern at the flag floats (trial 4); the bow with no air lands as it did | 724 to 792 m, and afloat at 10 min | [M] |

## 8. What it changes for the hinge (B4)

- **The hinge decides how much air each piece lets go with, and which spaces are open.**
  - While the bow hangs from the stern by her bottom, the tear opens the spaces it crosses, deck down. The tear is the hanging bow's top, so its after spaces vent through it as it hangs.
  - The longer it hangs, the less air it lets go with, and the steeper it is: standing at 69 degrees, untuned and with no air (trial 9 lets it go flooded), it lands 1,376 m off.
- **With Z6 the two readings of D47 part on the bed.**
  - Let go at once, at the record's trim: the cut vents the bow's air in seconds and it falls flat to about 750 m.
  - Hanging by her bottom: it is let go steep and lands about 1.4 km off, whatever its air.
  - So the survey's 772 m speaks for the early release, as the plan said [plan 4.4]. Z6 takes away the air as the confounder: the bow's distance becomes a test of the hinge.
- **The stern runs the witnesses' sequence from the hinge and Z6 together.**
  1. While the hinge holds, the bow's pull keeps the stern's cut end down. The cut faces down and its air is trapped.
  2. When the hinge lets go, the stern settles back, and its spaces at the cut flood through it.
  3. That water pulls the cut end down again and stands it up. Its aft spaces keep their air behind bulkheads K to P, and it goes under end first with them unflooded.
- **The torn zone matters as much as the hinge's timing.** At x −23 the stern's open space is BR1's aft 4 m (2.7 thousand m³). A torn zone of about the hinge's length (20 m; the wreck misses 21 m [plan 5.6, item 5]) reaching past bulkhead K at −27.1 opens the engine room (13.9 thousand m³) from the first second, as in the wreck [plan 5.6, item 4]. The record's 1.5 to 3 minutes test both together.
- **The interface.** B4 owns the tear. Each step it hands Z6 the spaces it has opened and the open area in each, and Z6 uses that in place of the clean section of section 3. Until B4, the cut is one clean section at `x_b`, fully open at the hand-off.
- **The joint.** The hinge's force (computed each step, D47) depends on both parts' weights, which Z6 changes as they flood. So Z6 runs inside B4's joint, both parts stepped together, as one free body each under a constraint (D46).

## 9. Size, and what I am least sure of

**Size: L, not the plan's M.** About half of it is the column sets at any attitude.

| Part | Share |
|---|---|
| The three column sets and the level solve at any attitude (the core's `solveLevels` on a re-oriented set), with the set's switch and its margin | about half |
| The spaces' state, the hand-over, and the mass and loads with each space's water and air | moderate |
| The openings cut at the break, with the cut's own | small |
| The exchange laws (water, air, one-way, Wallis, the two-opening balance) and the limiter | moderate |
| Failures and the 'report' events | small |
| The trials: ten rows, four of them closed-form rigs | moderate |

- **Code:** about 1,000 to 1,400 lines in a new reader module beside `fall.js` (say `core/readers/spaces.js`, called once a sub-step), plus about 400 lines of trials.
- **Time:** one session, two to four days.
- **No refit:** no fitted number moves.
- **The contract becomes v: 3:**
  - each piece gains its spaces (water, air, pressure, level) for the page [plan 5.6: "each body with its own 64 water levels"];
  - the 'report' events fire.

**What I am least sure of**, most first:

1. **The exchange through the cut.** I don't know whether the torn section, with its decks, machinery and wreckage across it, acts as one counter-flow opening, as two (water low, air high), or as many small ones. Between those, the bow's air leaves in about a second or about half a minute. That moves the bow from about 740 m to about 1,000 m (the cut-as-vent rates table, ×1 to ×1/30), and test 5's band is 540 to 950. Wallis's law for a ship's opening is itself a bet [R6 4.2].
2. **The core's openings outside their fit, and its coarse upper spaces.** aDown, fOpen and wMul were fitted to small angles over hours. Above E deck one space per compartment and side stands in for many cabins, stairwells and windows. The stern's minutes hang on how its air is held up there.
3. **The failure heads and the report threshold.** The ranges are three to four times wide [R6 4.3], and the sections of the beams and stiffeners are bets. They set the first failure's depth and the count of reports, and "four" depends on the threshold.
4. **Isothermal against adiabatic.** The neutral depth is 7.5 m isothermal and 11.9 m adiabatic [R6 4.1]. This moves the stern's last seconds at the surface.
5. **Quasi-static water inside.** Spaces 20 m long, in motions of about 10 s, may slosh. That can matter for the stern settling back and rising, which is test 6's sequence.

## 10. Sources

- R5: sections 5.1, 5.2, 10b, 10c, 10d.
- R6: sections 4.1 to 4.5, 10.5, 10.9, 10.10.
- The plan v2: sections 4.3, 4.4, 5.6 (items 1 to 5), the Z6 row of section 6, D46 and D47.
- `core/core.js` on Z1's branch: BULKHEADS, ZONES, the nodes, `rebuildConnections`, the flow law in the step.
- The dry copy of the mainline's tree at 08:29: S1's `K_STAIR`, `weatherOpenings` and `stairsStep`.
- Z1's tables of 2026-11-20 and their scripts: `docs/research/experiments/e60` to `e65`, with their outputs in `results_2026-11-20/`.
- The timings and the space-by-space air: `e66_z6_step_cost.js` and `e67_z6_spaces_at_handoff.js` (first run between 09:16 and 09:19 CST as scratch scripts).
