# W6, the lists: her early starboard list, her late port list, and her last minute (design v1)

- **Written:** 2026-11-20 16:32 CST (clock), by the mainline session ("Titanic simulator model accuracy", Claude Code
  74cc0d65, Opus 5.5), on the coordinator's order of work (`docs/BRAINSTORM_the_descent_to_the_bed_v2_1_2026-11-20.md`,
  section 3, step 5: "The lists and her last minute (W6, Z9)") under Bo's standing word ("ok continue, proceed at your own
  best recommendation").
- **Status:** advice only; nothing here is built. The cascade's go is the coordinator's for Bo (as D58); the record's
  band (section 7) is Bo's.
- **Supersedes:** nothing (the first W6 design).
- **Lineage:** `HANDOFF.md` 4a and 4b (the first port's notes on the lists); `docs/research/RESEARCH_lists_bunkers_scotland_road_v1_2026-11-17.md`
  (the record, the mechanisms, the bunkers); BACKLOG W6; U3's finding in BACKLOG U3 ("the core's levels lag their water
  by up to 70 m3 at 69 degrees of pitch").

## The answer in one paragraph

Measured on join 3's tip (`f01b15f`): after T 10 the model's list is its 2-degree coal list to port and nothing else,
amplified as her stability falls. With the coal list set to 0 the flooding's own asymmetry is gone by T 10, and she
floats at 0.0 degrees to the end. So she lists to port from about T 7, where the record has her 5 degrees to starboard
at T 5 to 10 and to starboard until about T 85 to 100; late in the night she lists about half as far to port as the
record's qualitative figures. The level solver is not the cause of her last minute: run to its tight tolerance every
step, the list moves less than 0.1 degree until T 155, and the roll still reaches its 80-degree clamp, five seconds
later. W6 has three parts. (A) The early starboard list: two places hold starboard water for the right times, the holds
below the firemen's tunnel for minutes and BR5's empty starboard bunker for an hour. The bunker's water sits where the
coal that made the port list came from, so while it holds it roughly cancels the coal list, and when it bursts the
coal list comes back: the change of side. (B) The late port list: the free surface above E deck that HANDOFF 4b looked
for is there (1.2 to 1.4 m of GM from T 115), but her GM stays near 0.5 m, because her water's weight low in her raises
it about as much; 15 degrees would need about 0.1 m. Where her water's weight sits, and her GM with it frozen, come
next. (C) The last minute (trim past 20 degrees, the roll to the clamp) is a phase
the real ship did not reach in one piece. Leave it to B4's break at the onset, which ends the watch before it.

## 1. What the model does now (measured)

`docs/research/experiments/e72_w6_list_probe.js` on `f01b15f`, list in degrees, + to starboard (the core's sign):

| T (min after the touch) | the 1912 watch | the 1912 damage preset | the record |
|---|---|---|---|
| 1 | -4.5 | -1.9 | |
| 5 | +0.2 | +1.0 | +5 (T 5-10, Hichens: the inclinometer) |
| 10 | -2.0 | -3.3 | +5 (Halpern's reconstruction) |
| 30 | -2.4 | -2.3 | starboard (five witnesses); level (Lightoller, T 25-35) |
| 60 | -1.6 | -1.5 | starboard |
| 85 | -2.1 | -3.2 | +2 (Symons, boat 1, "slight") |
| 100 | -3.7 | -4.7 | 0 |
| 110 | -4.5 | -5.4 | |
| 120 | -2.3 | -2.2 | -6 (Rowe, collapsible C: "about six degrees") |
| 130 | -3.9 | -3.6 | -10 (Halpern, from qualitative witnesses) |
| 145 | -7.5 | -6.9 | -15 (Halpern, the same) |
| 155 | -2.8 | -3.8 | |
| 156 | -6.7 | -10.0 | |

The watch's +21 degrees at T 0.1 is the encounter's own heel in the turn at speed, before the water. The record's
column is section 1 of the research note: Hichens's +5 is the only measured angle and Rowe's "about six" the only port
figure from a witness; Halpern's -10 and -15 rest on witnesses the note could not check. In the last minute the trim
passes 20 degrees at T 156.78 on the watch (list -23), the roll reaches its clamp (1.4 rad, 80.2 degrees) at T 157.20
at a trim of 35.5, and the flag falls by trim (pitch over 1.2 rad) at T 157.74. The preset is the same: clamp at
T 156.67, flag at T 157.20.

## 2. Why: three measurements

- **The coal list is all of it after T 10.** With `coalListDeg` 0 the preset lists +1.8 at T 2 and +3.8 at T 5, -0.2 at
  T 10, and 0.0 at every mark from T 15 to T 156 (`e74`). The flooding's own asymmetry dies with the holds' merging.
  With 3 degrees the port list deepens everywhere (-4.6 at T 10, -8.0 at T 145) and she founders at T 156.43.
- **Not the level solver.** The same preset with the level solve run to 40 iterations a step gives the same table; run
  to its tight tolerance every step (`full`), the list moves less than 0.1 degree until T 155, the clamp comes at
  T 156.75 instead of 156.67 and the flag at T 157.28 instead of 157.20 (`e72`, two scratch variants of the core). U3's
  "lag of up to 70 m3" is the step's loose tolerance, a thousandth of a space's own scale (`nodeVtol`), not the six
  iterations; it does not drive her roll.
- **Scotland Road's split changes little.** `upperSplit` 1 (above E deck port and starboard exchange through cross
  passages only), alone or with `wStbd` 0.5 and `axUp` 0.2, moves the list by under 1 degree until T 145 (-6.8 and
  -5.9 against -6.9) and deepens the last minutes (`e74`), as HANDOFF 4b found.

## 3. Part A: the early starboard list

### 3.1 Two clocks, two places (`e73`, `e74`, the preset)

- **The holds below the firemen's tunnel** (`zMergeHold` 4.6 m, `axHold` 0.05 m2 now). With the divider at 7 m the
  list is +3.9 at T 10; with 0.005 m2 under it as well, +6.0 at T 10 (+7.9 without the coal list). Every variant is
  back on the coal list by T 30: this place holds starboard water for minutes.
- **BR5's empty forward starboard bunker** (the bunker of the fire; the ice opened it 2 ft above the plates and 2 ft
  abaft bulkhead E; Barrett shut its door; it held the water until it burst "about an hour" after the collision, the
  Report, or at about 1:10, Barrett: research note, mechanism 3). A stand-in through the roll seam (`sim.xMph`: a
  starboard weight filling from T 1 to T 10, let go at T 75 over a minute; the weight's own mass left out): 300 t at
  8 m gives +2.3 at T 10, +1.2 at T 60, +1.8 at T 75, then -3.2 at T 85 when it has gone; without the coal list,
  +5.1 at T 10; 450 t, +4.8 at T 10. This place holds starboard water for an hour.

### 3.2 The reading

The research note derives the coal list itself from this bunker: its starboard half was emptied of 200 to 330 tons of
coal, about 6.5 m to starboard, to dig out the fire (section 0, 1.9 to 3.1 degrees at GM 0.80 m). Water filling the
empty half (a full-width bunker 2.74 m long from the tank top to G deck holds about 500 to 540 m3, so its starboard half
about 250 to 270 m3) puts back roughly the moment the coal took away. So while the bunker holds, the coal list is
cancelled, and she floats near level once the holds have merged; when it bursts, the coal list returns, and grows as her
stability falls. That is the record's shape: starboard (5 degrees at first, from the holds and the bunker together),
then slight or level (Lightoller's even keel at T 25 to 35 against Symons's slight starboard list at T 85), then to port
from the change of side, which the boats date between 12:55 and 1:35 (the research note, section 1) and Barrett's
burst puts at about 1:10 (T 90). The model today has the coal list from the start and neither the bunker nor a long
enough split in the holds.

### 3.3 What to build

- **A pocket in a space** (the core, new state): a held volume inside one node, with its own capacity, its centroid
  (ship frame), its fill (a share of one opening's inflow, here BR5's starboard damage at the bunker) and its release (a
  head, a time or a strength: the bunker's door and its bulkhead plating). Its water counts in the node's weight at
  the pocket's centroid, not at the node's level, until it is released into the node. With no pocket nothing in the
  step changes, so the seams gate (`GATE_PARAMS`, `GATE_SHIP`) holds to the bit. Saved by `serialize`.
- **The bunker's numbers, each with its source:** capacity 250 to 270 m3 (derived above; the coal's permeability does
  not apply: it was empty); place against bulkhead E, starboard, tank top to G deck; fill from the 1912 opening in BR5
  (`core/scenarios.js`); release by its strength [bet: the head at which a bunker's plating gives way; the Report's
  "about an hour" and Barrett's 1:10 are its check, not its fit].
- **The tunnel's height from the plans** before any change to `zMergeHold` (HANDOFF 4a asks for it; the 4.6 m has no
  source in `DEFAULT_PARAMS`). A height read from a plan may hold the holds' split longer or shorter than 4.6 m does.
- **Considered and set aside:** splitting BR5's lower layer into port and starboard (as holds 2 and 3) holds the whole
  stokehold's water apart, where only the bunker's 2.74 m held it; and moving the coal list over time double counts the
  bunker.

## 4. Part B: the late port list

- **Measured:** -6.9 at T 145 on the preset against the record's -15 (Halpern's, from qualitative witnesses) and -2.2
  at T 120 against Rowe's "about six". A dip at T 120 (-2.2 between -5.4 at T 110 and -3.6 at T 130) on every variant
  is unexplained: find its event first.
- **HANDOFF 4b's reading, still open:** a 35 m strip of E deck flooded across the beam has a free-surface inertia of
  about 64,000 m4, a loss of GM of about 1.3 m, more than the 0.8 m she had; the model holds her GM near 0.5 m through
  2:00. Its suspects: the pressed-up rule takes away the free surface of a space that fills to its top; the upper
  layer's capacity and permeability; the waterplane's loss as the forecastle goes under.
- **First measurement (`e75`, the preset):** her GM (`C.gmNow` on a restored copy, water re-levelled at the nudged
  roll, so free surface included) is 0.52 m at T 5, 0.92 at T 60, 0.57 at T 85 to 100, 0.43 at T 125 to 140, 0.53 at
  T 145, 0.29 at T 155. The free surface is not missing: computed from the core's columns cut by each space's level
  (merged pairs as one surface, times the permeability), it costs 0.5 to 1.0 m below E deck through T 60, and above
  E deck 0.94 m from T 85 and 1.2 to 1.4 m from T 115 (HANDOFF 4b's 1.3 m), with 1,700 to 2,200 m2 of surface there.
  The water's weight low in her raises her GM with the water frozen by about as much, so her GM stays near 0.5 m. A
  list of 15 degrees from her coal list's offset would need her GM near 0.1 m. So Part B is a question of where her
  water's weight sits and what her GM is with it frozen (the tiers above B deck, the hull's flare, the pressed-up
  spaces), not of a free surface the model leaves out.
- **The dip at T 115 to 120:** zone 5's lower space fills to its top (no surface of its own from then) and hands its
  surface to the space above it, while the sum of the surfaces barely changes (1.58, 1.52, 1.60 m of GM at T 110, 115
  and 120). The list's swing from -5.45 to -2.20 is then the port and starboard shares of the water, not the GM: to
  look at next, with each space's centroid across the beam against time.
- **Plan:** next, her GM with the water frozen against time and the water's height; the shares across the beam in
  zones 4 to 7 through T 110 to 125; then a law with its source where the model departs from one, never a list fitted
  to Halpern's figures. `C.gmNow` itself does not put back the shares of water it moves between a pair's two halves
  (it saves and restores the levels and centroids, not `vol`): harmless while it is only called from the console and
  on an intact ship (`tools/smoke.js`), but it should save `vol` too before anything calls it on a run.

## 5. Part C: her last minute

- **Measured:** above (section 1). The flag is by trim; the fall then starts from 80 degrees of list (D54 (a): the
  stern lands upside down).
- **The real ship did not reach it in one piece:** she broke at a trim of about 10 to 15 degrees (HANDOFF 4d; the
  descent's v2 break design); B2's onset is at T 154.97 (strength table, join 3), where her trim is about 8.6.
- **Proposal:** W6 does not tune the last minute. B4 brings the break into the watch at the onset (D55: Z6 inside B4,
  after the lists), which ends the core's one-piece watch before trim 20. Until then the clamp stays, labelled as it is.
  If the coordinator wants W6 to make "the flag by sinking, not by trim" anyway, the only honest change is to drop the
  trim rule and let the roll and the clamp run on to the hull's top going under: physics of a ship that did not exist.
  Not recommended.

## 6. The cascade

Parts A and B move the 1912 flooding, since every opening's head follows her list: a divider at 7 m moved the founder
by +0.55 min, the bunker's stand-in by up to -0.23 min. After them, in order: the calibration (`node tools/calibrate.js 45`),
the validation (11 verdicts; the coordinator's guard: a changed verdict or the 1912 founder outside 157 to 160 min goes
to Bo), the systems suite's 1912 fingerprint (refrozen, with the reason), the reports' fitted constant
(`tools/reports_tests.js`), the people's fit (`tools/calibrate_people.js`), the Carpathia search (`EVAL_VERSION`, and its
published best night), the fall's hand-over (`tools/fall_trials.js`, `tools/night_after_tests.js`), B2's onset (the
strength table), the export table and the guide. The headway reference and the encounter's area constant do not move
(the list after the touch is not the encounter's).

## 7. Tests (done when): a band for Bo to set

- MUST: at T 5 to 15, +3 to +7 (Hichens's +5 on the inclinometer [read]).
- MUST: from T 30 to T 85, starboard or level, never more than 1 degree to port (five witnesses to starboard; Lightoller
  level at T 25 to 35 [read]).
- MUST: the change of side between T 85 and T 110 (the boats' scraping, 12:55 to 1:35; Barrett's burst, 1:10 [read]).
- MUST: at T 120, -3 to -9 (Rowe's "about six" [read]).
- CHECK: to port and growing from T 120 to the onset; Halpern's -10 at T 130 and -15 at T 145 [read in a secondary].
- MUST: the 11 validation verdicts as they are; the 1912 founder within 157 to 160 min; the seams gate to the bit.

## 8. Decisions needed (who decides)

| | Decision | My pick | Who |
|---|---|---|---|
| D61 | W6's scope | A and B; C left to B4's break | the coordinator, for Bo |
| D62 | The record's band (section 7) | MUST for the witnesses' numbers (Hichens, Rowe) and the change of side; CHECK for Halpern's | Bo |
| D63 | The bunker as a pocket in BR5's starboard node (new core state) | yes; a split of BR5's lower layer set aside | the coordinator |
| D64 | The firemen's tunnel's height | read it from the plans before moving `zMergeHold` | the mainline (research) |

## 9. Risks

- **The refit's cascade:** every fitted number downstream moves, once for A and B together if they land together.
- **The coal list and the bunker are one fact:** changing the coal list's size and adding the bunker's water separately
  would count the same coal twice. Size them together from the research note's 200 to 330 tons.
- **Part B may find a deeper fault** (where the water's weight sits; the pressed-up spaces; the tiers' buoyancy high
  up) that also moves the flooding's timeline.
- **The record is thin:** two witness numbers. A model tuned to Halpern's -15 is tuned to a reconstruction.

## 10. Sources

- Measured on `f01b15f` with the probes kept as `docs/research/experiments/e72_w6_list_probe.js` (the list against
  time, watch and preset; the two solver variants were scratch copies of `core/core.js` with `(full ? 40 : 6)` set to
  40, and with `full` forced true in `solveLevels`), `e73_w6_bunker_standin.js`, `e74_w6_params_whatif.js` and
  `e75_w6_gm_free_surface.js`; their output in `docs/research/experiments/results_2026-11-20/e72_e74_w6.txt` and
  `e75_w6.txt`.
- Read: `HANDOFF.md` 4a, 4b, 4d; the research note's sections 0 to 3; `core/core.js` (`DEFAULT_PARAMS`, `solveOne`,
  `solvePair`, `solveLevels`, `loads`, the step's clamps and founder rule); BACKLOG W6 and U3; the descent plan v2.1,
  sections 3 to 5.
- Not checked: the plans' height of the firemen's tunnel; Hackett and Bedford (1996); Halpern's papers (PDFs); the
  bunker's plating and its door.
