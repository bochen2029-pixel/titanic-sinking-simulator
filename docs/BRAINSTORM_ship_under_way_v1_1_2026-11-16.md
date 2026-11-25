# BRAINSTORM: the ship under way, v1.1: sail her into the ice, and let the ice make the damage

- **Written:** 2026-11-16, 14:17 to 14:35 CST, session ab71e668 (Claude Code desktop, Fable 5.2 then Opus 5.5), at Bo's
  ask after v1: "eventually I want to do the whole iceberg thing ... right now ... I have to manually dent the holes ...
  Why not have a random scenario where there's an iceberg, and then depending upon how quickly I react and how I sail,
  ... either it does not hit at all, or if it hits, then the dents are organically or naturally filled. I don't have to
  use a paintbrush."
- **Status:** advice only; nothing here is a decision. No file of the simulator was changed (`core/`, `web/`, `site/`,
  `tools/`, `out/`, `dist/`).
- **Supersedes:** `BRAINSTORM_ship_under_way_v1_2026-11-16.md`, which stays unchanged and still holds the detail of
  the motion model, the seams and the flooding-at-speed physics. This version re-centres the plan on the encounter.
- **Lineage:** v1; research notes and experiments e0 to e2 of the same day; new experiment
  `docs/research/experiments/e3_encounter.js` with its output `results_2026-11-16/e3_encounter.txt`; Abacus requests
  `docs/research/abacus/requests_iceberg_encounter_v1_1_2026-11-16.jsonl` (11 answers, all certified or held).
- **Tags** as in v1: [measured], [read], [derived], [bet].

## Changes in v1.1

1. **The purpose is now explicit:** steering exists so that the collision is played, not painted. The damage
   presets and the hole tool become one source of openings among two; the other is contact with ice.
2. **A working end-to-end prototype** (section 2): ship model fitted to the trials, a fixed iceberg, a contact force,
   damage from contact, and the unmodified flooding core sinking the result.
3. **Corrections to v1** (v1 is not edited):
   - its result-file table names one prototype output; there are two, `e2_mmg_run1.txt` (with a coefficient I had
     remembered wrongly) and `e2_mmg_run2.txt` (sourced);
   - its risk 5 still calls the hull model's attribution "from memory"; section 4.2 of v1 cites the paper
     (Yoshimura, Nakao and Ishibashi 2009) and that citation stands;
   - the research note's figures on expected model accuracy (M9: turning indices within about 6 % with captive-test
     coefficients, 43 to 55 % off with regressions outside their hull family) belong beside v1's section 4.7; the fit
     below is why that matters less now.
4. **Build order** reordered so that the encounter arrives early (section 6).

## 0. The answer in one paragraph

Yes, and it is the right ambition: the damage should be an output of how she was handled, not an input. The pieces
fit the repository as it is. The flooding core already accepts openings at any time, each with its own opening time
(`addOpening`, `tOpen`), so an encounter only has to produce a list of openings: where along the hull, how big, and
when. I built that today as a prototype. A three-degree-of-freedom ship, fitted with two numbers to the 1912 trials,
steams at a fixed iceberg; the hull's own waterline at the depth of the 1912 damage is checked against the ice every
metre; contact pushes back on the ship and records how deep the ice reached into each metre of hull; that record
becomes openings; the core sinks her. With the helm order given 17 seconds before the ice, the generated damage
starts at the stem, runs down the starboard side and sinks her in 151 minutes, against the calibrated 157 of the
hand-made preset. Ten seconds earlier and she misses by 11 metres. Ten seconds later she hits head-on, crushes the
bow and floats. That is the game Bo described. What the prototype also shows is where the new hard physics lives: the
ice and the plating. A rigid round spur scrapes too far aft and spreads the damage too evenly, and the answer moves
from 143 to 341 minutes with the spur's size and stiffness. So the next physics work is a breakable, movable iceberg
and plating that tears by energy, not a bigger ship model.

## 1. The loop

| Stage | What happens | Exists? |
|---|---|---|
| Scenario | a seeded random night: iceberg size, shape and underwater spur, position relative to the track, visibility (how far off the lookout sees it), the ship's speed | new: `core/encounter.js` |
| Watch | the lookout's sighting at a random range; the bell and the telephone; the bridge's reaction time is the player's | new; the viewer |
| Handling | telegraph and wheel (v1's Bridge panel) drive the motion model of v1 | v1 design; prototype |
| Contact | every step near the ice: the hull's waterline at a few heights against the ice; a force on the ship; the damage record per metre and per side | prototype (one height) |
| Damage | the record becomes openings, opened at the moment that metre was torn | prototype |
| Flooding | the calibrated core, unchanged | exists |
| Aftermath | the player keeps the bridge: stop, steam on, close doors, pump | v1 design |

Determinism carries over: the scenario comes from a seed held in the snapshot, so a night replays exactly and a
forecast or a tree search can run "the same night, another watch".

## 2. What the prototype shows

`docs/research/experiments/e3_encounter.js`, 88 s on this laptop, [measured] throughout this section.

### 2.1 The ship, fitted to the trials with two numbers

The hull is v1's sourced unified form (no division by speed, cross-flow drag by strips). Two numbers were fitted: a
factor on the rudder's inflow and a factor on the cross-flow drag. Targets: two points (22.5°) in 37 s from the order
at 21.5 knots, and a tactical diameter of 3,850 ft (1,173.5 m).

| Rudder rate | Inflow factor | Drag factor | Two points | Tactical diameter |
|---|---|---|---|---|
| 2.5 °/s | 1.75 | 3.5 | 37.0 s | 1,178 m |
| 4 °/s (used below) | 1.60 | 2.7 | 37.0 s | 1,177 m |
| 8 °/s | 1.55 | 2.5 | 36.8 s | 1,185 m |

Not fitted, against the record: advance 816 m (Wilding's 2,100 ft is 640 m; Halpern's model 774 m); speed held in
the turn 0.66 of the approach (Halpern's model 0.76); steady heel 3.5° (Hackett and Bedford about 5.4°). The circle
is the same at 11, 19.5 and 21.75 knots, as Wilding said it nearly was. The rudder rate barely matters to the fit,
which is good news, since nobody measured it.

The famous question, answered by construction: with the centre screw stopped, the same ship takes 47 s for the two
points and her circle grows by 43 % (`abacus1:791a4cf74dc7`).

### 2.2 The miss window

Helm hard-a-starboard (a turn to port), engines untouched, 22.5 knots, a round spur of 40 m radius whose edge reaches
the given distance to port of the ship's track. Rows: how far the stem is from the ice when the order is given.

| Order given | Ice 4 m to port of the track | 12 m | 20 m | 30 m |
|---|---|---|---|---|
| 150 m (13 s) | side, x 23 to -85 | side, x 92 to -56 | side from the stem, both sides | head-on |
| 200 m (17 s, `abacus1:75c6b74a8b2e`) | stern only | side, x -8 to -127 | side, x 61 to -61 | side, from the stem |
| 250 m (22 s) | miss by 10 m | miss by 3 m | stern only | side, x 23 to -83 |
| 290 m (25 s) | miss by 23 m | miss by 16 m | miss by 8 m | stern only |
| 350 m (30 s, `abacus1:e1d9e923f12f`) | miss by 46 m | miss by 39 m | miss by 32 m | miss by 23 m |

Read it as the player will feel it: 30 seconds of warning clears anything in this table; 20 to 25 seconds decides it
by metres; at 17 seconds or less she touches unless the ice lies to starboard of her track, and the only choice left
is which part of her takes it. (x is metres from amidships, positive forward; the stem is at x = 129.) The
official account's sighting at about 500 yards (457.2 m, `abacus1:06597969b3c1`) leaves 40 seconds at 22.5 knots;
the helmsman's "about half a minute" before the order, and Halpern's 20 to 25 seconds from order to impact, sit
exactly in the band where the table turns. [read: fact sheet section 7]

(Two cosmetic faults in the printed grid: a cell that never came near the ice prints "M 1000000000", and long cells
run into each other. Not worth fixing in a prototype.)

### 2.3 The 1912 encounter, found from the damage

Searching the geometry for starboard contact from the forepeak to boiler room 5 gives: order at 200 m (17.3 s), ice
reaching 27 m to port of the track, helm reversed 2 s after the first touch (the "port around"). Contact runs 16 s,
the heading has swung 9.5° at the first touch (Halpern's one point is 11.25°), speed 21.0 knots.

The force peaks at 23.5 MN, about 2,360 tons (`abacus1:d91087fbf570`), a sideways push of 0.08 g on the bow
(`abacus1:ca937287483f`). That is gentle enough to fit the many witnesses who felt little more than a grinding.

| Share of the opening area | Forepeak | Hold 1 | Hold 2 | Hold 3 | BR6 | BR5 | BR4 and aft |
|---|---|---|---|---|---|---|---|
| Generated | 1 % | 5 % | 8 % | 11 % | 12 % | 14 % | 49 % |
| Reconstructed (Hackett and Bedford) | 4 % | 13 % | 21 % | 24 % | 32 % | 6 % | 0 % |

With the same total area (one constant, 0.0017846 m² of opening per metre of hull per metre of overlap,
`abacus1:c63a12dad744`, chosen so the total equals the calibrated 0.7506 m²), the core sinks her in 151 minutes.
The right order of size, and the wrong shape: the contact runs on to x = -42, into the engine rooms, because a rigid
spur keeps scraping along the parallel midbody as the stern swings in. The real damage stopped at boiler room 5.

### 2.4 Another watch, the same ice

| What the bridge did | Outcome | Flooding core |
|---|---|---|
| as matched above | side contact, 0.75 m² | founders at 151 min |
| order 5 s sooner | the stern only, 0.28 m² aft | founders at 322 min |
| order 10 s or 20 s sooner | miss by 11.5 m or 64 m | no damage |
| order 5 s later | bow, both sides, 92 MN | afloat, 0.9° by the head |
| order 10 s later, or no order | head-on at 22 knots | afloat, bow crushed 27 m |
| helm held, never reversed | side contact, 0.85 m² | founders at 150 min |
| engines stopped with the order | less damage, 0.54 m² | afloat, 3° by the head |
| 15 knots instead of 22.5 | 0.35 m² | founders at 304 min |
| 10 knots | 0.16 m² | founders at 689 min |
| turned to starboard instead | head-on | afloat |

Three things stand out, each a claim to test rather than to believe:

- **Head-on she floats**, as Wilding testified. The crush here is energy over a constant crushing force: 120 MN
  makes 27.4 m at 22.5 knots (`abacus1:148660ed92b9`), which I chose to match his 80 to 100 feet, so this row is
  consistent by construction, not a prediction.
- **At 15 knots she outlasts the 4 h 20 min Carpathia needed** (304 minutes). The lower speed shortens the gash and
  lowers the force; the damage-per-overlap constant makes that automatic. If it survives a better damage law, it is
  the most interesting single result of the feature.
- **Stopping the engines with the order** turned a sinking into a float here, against the common view that stopping
  the centre screw robbed the rudder. Both effects are in the model (the slower turn, the slower speed); which wins
  depends on numbers that are bets. Treat it as a question the finished model must answer, not an answer.

### 2.5 How much the bets matter

The same 1912 geometry, the damage constant refitted each time to keep the total area:

| Ice | Contact | Flooding core |
|---|---|---|
| as above (40 m spur, 0.3 MN/m² stiffness) | x 127 to -42 | 151 min |
| 3 times stiffer | x 127 to -33 | 143 min |
| 3 times softer | x 127 to -64 | 192 min |
| spur radius 20 m | x 127 to -47, more forward | 164 min |
| spur radius 80 m | x 40 to -61: misses the bow | 341 min |
| friction 0 or 0.3 | about the same | 153 or 147 min |

The ice's shape and stiffness move the outcome by a factor of two. That is the honest headline of this experiment.

## 3. The new hard physics: ice and plating

What the prototype simplifies, in order of payoff:

1. **The iceberg should break and move.** A real spur crushes and fractures once the contact pressure exceeds the
   ice's strength, which caps the force and lets the hull slide past; and a berg of 100,000 to a million tonnes is
   pushed and turned by 23 MN over 16 s. Both shorten the scrape aft. Model: a crushing-pressure law (pressure falling
   with contact area, the form used in ice-structure codes such as ISO 19906 [bet: from memory]) and a rigid-body
   iceberg with its own mass, added mass and rotation, under the same contact force.
2. **The plating should tear by energy, not by overlap.** Collision engineering relates the volume of steel deformed
   to the energy absorbed (Minorsky's correlation and its successors [bet: from memory, to be read before coding]).
   Per metre of hull: the energy put in by the contact force over the indentation; a threshold below which the plate
   only dents (the "dents" Bo named, which let no water in); above it, a tear whose area grows with the excess. Riveted
   seams open before plates tear: the 1912 damage was mostly sprung seams and popped rivets, so the seam spacing on the
   frame drawings (the core does not have it yet) gives the damage its texture.
3. **Contact at several heights.** One waterline at 2.75 m above the keel is the 1912 damage height. The spur's depth
   should be part of the scenario, and the contact checked at three or four heights; the column builder's
   `halfBreadth(x, z)` already answers every one.
4. **The ice's shape.** A circle is the simplest; a scenario should draw a berg from a few shapes (a spur, a shelf
   below the waterline, a vertical face), each with a visible part for the lookout and a hidden part for the hull.
5. **The bow wave and the swing push the ship off the ice** (the "cushion" argued in some accounts). Small; later.

Each of these is a calibration against the same evidence the repository already fits: the 1912 damage split, its
total area, the eyewitness trim curve. The order of work is to make the 1912 encounter reproduce Hackett and
Bedford's split without a hand-set constant, and only then to trust the what-ifs.

## 4. The watch, as a game

- **Sighting.** A clear, calm, moonless night with no breaking water at the berg's base: the lookouts saw it at about
  500 yards [read: the British report via the fact sheet]. A scenario draws the sighting range from a spread around
  that, and a hazier night shortens it. The player gets the three bells and the telephone; nothing earlier.
- **Reaction time is the player's.** The orders go through v1's machinery: the wheel to the rudder at the gear's rate,
  the telegraph to the engines with their reversing delays. The table of section 2.2 is the felt difficulty: half a
  minute to save her.
- **Time.** The encounter lasts under a minute; it runs at 1× with the contact sub-stepped at 0.05 s (five per core
  step, deterministic). After the contact the clock can run fast again.
- **What the player learns.** The damage is drawn where the ice touched: dents where plates bent and held, open seams
  where they let go. The viewer's hole markers become the record of the night, not the brush.
- **The paintbrush stays**, as a sandbox tool and for the validation presets.

## 5. Where it plugs in

- `core/encounter.js` (new): scenario from a seed; iceberg state; contact and damage; it calls `C.addOpening` with
  `tOpen` as each metre tears. The prototype adds 166 openings for the 1912 match; the core's connection store holds
  2,048 and the run cost was unchanged, so per-metre openings are affordable. Merging neighbours by compartment and
  side is an easy saving if needed.
- `core/motion.js` (v1): the ship. It gains the contact force as an external force and moment.
- Snapshots carry the seed, the iceberg's state and the damage record, so the forecast worker and the tree search can
  restore a night after the collision.
- The flooding core is unchanged, and v1's bit-identity gate still guards it.

## 6. Build order, revised

| Step | What | Acceptance test |
|---|---|---|
| P0 | v1's seams and bit-identity gate | unchanged from v1 |
| P1 | v1's motion model, surge, sway and yaw, fitted as in 2.1 | the two fitted trial figures exact; advance, speed loss and heel reported |
| P2 | the encounter: fixed ice, contact, damage to openings, as in the prototype | the 1912 geometry gives contact from the forepeak aft; the total area matches the calibrated 0.7506 m² |
| P3 | ice that crushes and moves; plating that dents, then tears by energy; several heights | the 1912 split within a few points of Hackett and Bedford's without a hand-set constant; 157 ± 5 minutes |
| P4 | the scenario generator and the watch: seed, sighting, bells, Bridge panel, the iceberg drawn | a seeded night replays exactly; the miss window of 2.2 reproduced through the UI |
| P5 | v1's flooding at speed (Tier 0) and the aftermath controls | v1's tests |

P1 and P2 are mostly written in `e3_encounter.js`; the work there is moving them into the core's frame, rules and
arrays.

## 7. Decisions needed (who decides)

| # | Decision | Who | Recommendation |
|---|---|---|---|
| D12 | Make the encounter the first playable goal, ahead of v1's flooding-at-speed tiers | Bo | Yes |
| D13 | Random nights: how random (sighting range, spur depth, berg shape, speed) and whether the 1912 night is one fixed seed | Bo | Random with a published 1912 seed, so the history is always one click away |
| D14 | How much plating detail: per-metre tears, or rivet seams from the frame drawings | Bo | Per metre now; seams when the drawings are digitised |
| D15 | Head-on and the "stop engines" result: report them as the model finds them, even where they contradict common belief | Bo | Yes, with the bets named beside them |

v1's D1 to D11 stand; D9 (git before any code) is still first.

## 8. Risks

1. **The what-ifs are only as good as the ice and plate laws**, and section 2.5 shows they move the answer by a factor
   of two. Until P3 passes, every what-if in the viewer should say so.
2. **Calibration fights.** The flooding core's four parameters were fitted with the hand-made damage. If the
   generated damage differs in shape, the flow parameters will want refitting, and that touches the oracle. Do P3
   against the existing calibration first; refit only with Bo's word.
3. **A game can teach the wrong history.** The 1912 night must stay one exact, sourced seed; random nights are
   labelled as what they are.
4. **The fit holds two numbers on two measurements.** The advance (816 m against 640 or 774) and the heel (3.5°
   against 5.4°) are the first misfits to look at.

## 9. Sources

- This repository: `core/core.js` (`addOpening`, `tOpen`, `zoneAt`, `halfBreadth`), `core/scenarios.js`
  (`CALIBRATED_AREA`, `TITANIC_SPLIT`, `zoneHole`).
- v1 and its three research notes (the fact sheet's sections 5 to 7 for the trials and the night; M7 and M10 for the
  rudder inflow without 1/n and the unified hull form).
- Abacus: 11 answers in `docs/research/abacus/results_iceberg_encounter_v1_1_2026-11-16.jsonl`, each cited above.
- Not read: any ice-mechanics or ship-collision source. Sections 3.1 and 3.2 name the families from memory; they are
  the first reading for P3.
