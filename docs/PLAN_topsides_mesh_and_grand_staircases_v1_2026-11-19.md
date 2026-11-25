# Plan: a faithful topsides mesh, and the two grand staircases with their domes (v1)

Written 2026-11-19 13:07 CST by the session that resumed after the image crash. Status: **PLAN ONLY. Nothing in `core/`, `site/`, `tools/` or `dist/` has been changed, and nothing will be until Bo says go.**
Tags: [M] measured in this session, [R] read from a file, [D] derived, [B] bet.

Revisions of this plan are new files (`..._v2_...`), never edits in place.

## 0. If this session dies again: how to resume

- This file is the plan. The goal recorded in the harness is `goal-2b293edb-3980-42de-9b4f-78bb2d555b4f`.
- What killed the last session: an image over the size limit sat in the conversation, so every later turn failed [R: the two error screenshots]. Rule for every session and subagent from now on: never open an image whose long side is over 1500 px; downscale a copy first; at most 3 images a step.
- Lanes (git worktrees of `C:\code\titanic-sinking-simulator-main`, all branched from main `a97a6bd`) [M: `git worktree list`]:

| Lane | Worktree | Branch | State now |
|---|---|---|---|
| topsides mesh | `C:\temp\titanic-wt-topsides` | `wt/topsides` | clean, no code yet |
| grand staircases | `C:\temp\titanic-wt-stairs` | `wt/stairs` | clean, created this session |
| the ether (W11), parked | `C:\temp\titanic-wt-ether` | `wt/ether` | 2 commits ahead of main; part 3 of 3 uncommitted (`core/readers/world.js` edited, `tools/ether_tests.js` untracked) |
| her way after Stop (M7) | `C:\temp\titanic-wt-stopway` | `wt/stopway` | landed in main squashed as `eb742d1` (its `core/` differs from main's by 8 lines of `readers/people.js`, a later change) [M]; leftover worktree |

- Scratch (not in git): `C:\temp\titanic-topsides-scratch` (about 30 article texts, The Shipbuilder, the Wreck Commissioner's report, plans; a 10-point draft of the dimensions), `C:\temp\titanic-stairs-scratch` (the staircase research lands here), `C:\temp\titanic-wt-ether-scratch`.
- Running now, read-only research, three Opus 5.5 subagents:
  - topsides dimensions note -> `C:\temp\titanic-wt-topsides\docs\research\RESEARCH_topsides_dimensions_v1_2026-11-19.md` (told to write the note only and wait for a go before any build);
  - staircases, geometry and the night's evidence -> `C:\temp\titanic-stairs-scratch\PART_A_staircases_geometry_and_evidence.md`;
  - dome failure and downflooding physics -> `C:\temp\titanic-stairs-scratch\PART_B_dome_failure_and_downflooding_physics.md`.

## 1. Where the work stood at 12:58 CST

1. **Main** is clean at `a97a6bd` (User Guide 1.3). The last full gate tables in `out/gate/` are from 11-18 and 11-19 12:45 [M].
2. **The ether lane (W11, part 3 of 3)** was mid-debug when Bo changed the order. Its new suite hung for 13 minutes; each of the six nights ended in 5 s with the right numbers, so the hang was in the suite's own `report()`; the suspects were two unbounded seed searches at `tools/ether_tests.js:263-264` [R: screenshot]. A capped scratch copy then ran in 6 s with one MUST row failing ("copied by every station whose log or operator has it") [M: `C:\temp\titanic-wt-ether-scratch\ether_run3_scratch_1119.txt`]. It is parked, not abandoned.
3. **The topsides order** (12:45): a dimensions hunt had produced a 10-point summary before the crash. Its two findings that matter most: the drawn funnels are in the wrong places (drawn at x = +45.5, +12.5, -20.5, -53.5; sources give about +54.5, +19.8, -15.9, -50.5) and at the wrong rake (drawn 4.3 degrees; the rigging plan gives 2 in 12, 9.46 degrees) [R: `C:\temp\titanic-topsides-scratch\RESEARCH_topsides_dimensions_draft.md`; to be re-verified by the note].
4. **The staircase order** (12:58): new.

## 2. What the code does today (so the plan is about the real thing)

### 2.1 The drawn topsides
`site/app.js:424-464` [R]: five boxes (B to A deck, A to boat deck, two deckhouses, a bridge), four elliptical cylinders, two masts. No boats, davits, promenades, wells' fittings, domes. The smoke and the steam jets carry their own copies of the funnel positions (`site/app.js:1048`, `:1075`). The Night look and the director take the pieces by name (`TitanicApp.deckhouses`, `userData.solid`). It is appearance only: no model number depends on it.

### 2.2 The flooding model near the staircases
- 16 zones, each port/starboard, each "below E deck" and "E deck to the hull's top". The hull's top is B deck amidships (22.5 m above keel) [R: `core/core.js:72`]. A deck, the boat deck, the deckhouses and the domes are above the modelled volume: they hold no water and give no buoyancy.
- The sea comes in from above only through "top deck" weirs at B deck whose width is a fitted share of each zone's length, `fOpen` = 0.01411: about 0.24 m of weir for a 17 m zone [R: `core/core.js:280`, `:414-419`]. That one fitted number stands for every hatch, door, window, stairway and dome on the ship.
- The forward staircase stands at about x = +37 m, over bulkhead F, between zone 5 (boiler room 5) and zone 6 (boiler room 4); the aft one at about x = -33 m, over zone 10 (reciprocating engine room) [D: funnel centres and the model's bulkheads; the research note will fix the frames].

### 2.3 The 1912 run's last five minutes [M: one run of the current core, this session]

| T (min after 11.40) | trim (deg) | list (deg, - = port) | inflow (t/min) |
|---|---|---|---|
| 150.0 | 6.2 | -7.6 | 582 |
| 155.0 | 10.1 | -43.3 | 3,749 |
| 155.5 | 13.0 | -58.9 | 7,474 |
| 156.0 | 21.9 | -80.2 | 16,091 |
| 156.5 | 42.8 | -80.2 | 26,098 |
| 156.94 | foundered | | |

On the centreline at the forward staircase, B deck goes under at T 153.3, A deck 154.2, the boat deck 154.7, a point 3.5 m above the boat deck (the dome, roughly) 155.0. The aft dome goes under at 155.75.

Two consequences, said flatly:
- **The dome acts in the last two minutes of this model.** One zone's space above E deck is about 4,000 m3 [M]; a 30 m2 opening under 1 m of head passes about 80 m3/s [D: 0.6 x 30 x sqrt(2 x 9.81 x 1)], so it fills that zone in under a minute. I expect the foundering time to move by less than a minute [B] and the final plunge to steepen. If Bo expects the staircase to change the whole night, it will not, unless the research shows the well took water much earlier by another route (the D-deck gangway door, the entrance doors on B and A deck). The plan measures this before touching the core (stage S2).
- **A finding that is not part of this order:** the model rolls to 43 degrees and then to 80 degrees to port in its last two minutes. The record has about 10 degrees to port. The calibration scores the list only up to T 145, so nothing catches it. I will not fix it in this lane unless Bo says so (decision D5), but the staircase model lands exactly in those minutes, so its effect will be read with that caveat.

## 3. Lane T: the topsides mesh (`wt/topsides`)

Principle: the drawn ship is built from a table of sourced numbers, as the stern gear already is (`site/visuals.js`). No imported 3D model, no textures. The default "x-ray" look stays (faint faces, visible edges) so the flooding stays readable; the Night look paints the same pieces solid.

| Stage | What | Done when |
|---|---|---|
| T0 | The dimensions note finished: every number in the ship's frame with its source and tag; where the core's own geometry disagrees with sources, listed, not changed | the note exists; I have read it and spot-checked ten numbers against the scratch texts |
| T1 | `site/topsides.js`: the data (decks' outlines, each deckhouse, funnels, masts, boats and davits, promenades, wells, forecastle and poop fittings) and builders that return typed arrays; no three.js in the data | `tools/topsides_tests.js` passes: 20 boats; davits at the sourced frames; funnel centres, section, rake and tops; every house inside its deck's outline and inside the hull's half-breadth; port and starboard alike where they should be |
| T2 | The boat deck first: its outline, bridge and wings, officers' quarters, the forward entrance and its dome cover, gymnasium, the raised roofs, compass platform, tank room, the aft entrance and dome cover, smoke room roof, second-class entrance; 16 boats under davits, 2 cutters swung out, 4 collapsibles; rails | a plan-view picture laid against the boat deck plan: every house corner within 1 m, every boat within 0.5 m (numbers, not impressions) |
| T3 | The open decks: A-deck promenade (stanchions, the glazed screen forward, open aft), B-deck sides and the aft promenade, the two wells, forecastle and poop (hatches, cranes, breakwater, docking bridge) | a broadside picture laid against the elevation: deck edges and screen ends within 1 m |
| T4 | Funnels (right centres, 7.47 x 5.79 m, 9.46 degrees, sourced tops, black tops), masts (rake, heights, crow's nest), a few stays as lines; the smoke and steam take their positions from `site/topsides.js` | `topsides_tests.js` holds smoke = data; the Night-look suite passes |
| T5 | Ventilators and small fittings, only if the frame cost allows | draw calls before and after reported; target at most +15 calls |
| T6 | Evidence and suites: before/after pictures (broadside, bow quarter from above, plan, stern quarter; both looks) in `docs/evidence/topsides/`; `build_site`, `gate --quick`, and the browser suites that touch the view (`night_scene_site`, `visuals_site`, `boats_site`, `director_site`, `night_site`); the Guide's pictures retaken and the Guide rebuilt | every verdict line PASS; `LANE_REPORT.md` |

Kept contracts: `TitanicApp.deckhouses` and `userData.solid`; the viewer reads the model and feeds nothing back; nothing in `core/` changes, so every fingerprint (1912: `3810e155`) stays.
One link to lane S: the two dome covers are drawn where the core's staircase table puts them, once that exists (one source of truth; a test holds it).

## 4. Lane S: the grand staircases and their domes (`wt/stairs`)

### 4.1 What is to be modelled (first statement; the research will correct the numbers)
Each staircase is a well through the decks with entries from the open air: the entrance doors at B, A and boat deck level, the windows of the entrance house, and the dome on its roof. In this model the well itself needs no volume of its own (everything from E deck to B deck in a zone is already one space); what is missing is the **entries above B deck** and the fact that the dome is one large opening, not a share of a fitted percentage.

Per staircase s, a list of entries e, each with a sill point (x, y, z) in the ship, a kind, a size, and a failure head:

- outside head on an entry: `H_e = hx_e - Z_e`, where `Z_e = R20 x + R21 y + R22 z + tz` is the sill's height in the world and `hx_e` the sea's level there (0 on a stopped ship; the existing seam at speed);
- an open door is a weir from the start: `q = Cw w (2/3) sqrt(2g) H^1.5`, with the submergence factor the core already uses;
- a window or the dome is shut until `H_e >= H_fail,e`, then open for good (an event in the log: "The dome over the forward grand staircase gives way");
- the opened dome is a drop inlet: weir control round its rim at small head, orifice control at large head: `q = min( Cw L (2/3) sqrt(2g) H^1.5 , Cd A sqrt(2g dH) )`; for a round opening the two cross at H = 0.375 (Cd/Cw) D [D];
- the well's throat and the doors out of each hall act in series with the entry: `A_eq = (sum of 1/A_i^2)^(-1/2)`;
- the water goes to the space above E deck of the zone the well stands in, half to each side (the well is on the centreline).

Parameters exposed (each with a low, likely and high value from the research): the dome's failure head, its area and rim, the door widths and sills, the throat. Bo's rule ("if water gets into the well the dome busts") becomes a switch as well: `domeFails: 'head'` (the default: physics) or `'wet'` (the dome goes the moment any entry of its well takes water), so both can be run and compared.

### 4.2 Stages

| Stage | What | Done when |
|---|---|---|
| S0 | Research, two parts (running), merged by me into `docs/research/RESEARCH_grand_staircases_domes_v1_2026-11-19.md`: geometry in the ship's frame; what witnesses saw and when; what is testimony and what is film; failure heads; the flow law; how published simulations treated it | the note, with a "conflicts and unknowns" section |
| S1 | A design note `docs/DESIGN_grand_staircases_v1_2026-11-19.md`: the equations above with the research's numbers, the entry table for both staircases, the default-off rule, the tests | Bo reads it (or says go without) |
| S2 | **An experiment before any core change** (`docs/research/experiments/e24_staircase_domes.js`): the same entries emulated with the core's existing openings on the current core; a table of foundering time, trim and list at T 150 to the end, with the dome's head at low/likely/high, with `'head'` against `'wet'`, with and without the doors | the table. **Stop and report to Bo here**: if the effect is seconds, he decides whether the core change and its cascade are worth it (decision D8) |
| S3 | The core: a staircase table (`C.STAIRS`), connections of a new kind built from it, the failure check in the step, the event; serialized with the snapshot; off when a scenario says so | `node tools/seams.js` PASS with the staircases off (the same bits as before; the gate's scenarios opt out, as they do for the pumps); a new `tools/stairs_tests.js`: off = old bits; each entry opens at its head; mass conserved; the dome's flow against the formula; replay of a watch to the bit |
| S4 | Refit and validate: `node tools/calibrate.js 45 "[0.7506,2.735,0.280,0.01411]" --fix-area` (the opening held, so the encounter's area constant should stand; `calibrate_encounter.js` checks it), `node tools/validate.js`; expect `fOpen` to fall, since the dome and doors no longer hide in it | the score J before and after (9.49 now), the validation table |
| S5 | The cascade the repo's rules demand when the 1912 night moves: the systems suite's fingerprint, `WRECK_1912`, the boats' fit (`calibrate_people.js`), the reports' fitted constant, the Carpathia acceptance and its search (about 90 min), the encounter and night tables, the headway reference if it moved, the girder's 1912 finding, the three sweeps (about 75 min) | `node tools/gate.js` ends `GATE: PASS`; every number that moved listed old -> new in `LANE_REPORT.md` |
| S6 | The viewer: the two wells and domes shown, the dome's failure as an event and a drawn burst [appearance], a line in the log; a what-if control for the dome's head and the `'wet'` rule | a browser suite for the part; the watch's fingerprint the same with the part as without |
| S7 | Papers: CLAUDE.md gets a staircase rule and command; BACKLOG, CHANGELOG, README; the Guide (a section in "her systems", pictures retaken, rebuilt as 1.4) | `node tools/gate.js --release` PASS |

### 4.3 What I expect, before the research is in [B]
- The forward dome fails at about T 155 on the model's clock (2.15 am), the aft one inside the last minute.
- The foundering time moves by tens of seconds; the trim's last two minutes steepen; `fOpen` refits lower.
- There is very likely no survivor who saw the dome break: the picture comes from the 1997 film and later reconstructions. The note will say which it is, and the model will be marked accordingly.

## 5. Order, and the ether lane

- T and S touch different files (T: `site/`, S: `core/` and a new viewer part) except `dist/` (a build product: rebuilt, never merged by hand) and `site/app.js` if S6 needs a hook.
- Proposed order onto main: **T, then S, then the ether**. The ether suite pins the 1912 fingerprint and Carpathia's 265.15; S moves both, so finishing the ether first would mean freezing its pins twice.
- T's build and S's stages S0 to S2 run side by side. S3 onward waits for Bo's word at S2.

## 6. Decisions for Bo (my default in bold; silence = the default)

| # | Question | Default |
|---|---|---|
| D1 | May the lanes commit on their own `wt/*` branches as they pass their stages? (The estate rule is "commit only when asked"; a five-hour cascade held uncommitted is fragile.) | **No commits until you say**; main is never touched either way |
| D2 | Do the staircases belong to the ship in every scenario (Britannic, Hawke, the hand-made ones), or only to the 1912 preset as the pumps do? | **Every scenario**; the seams gate opts out |
| D3 | The dome's rule | **By head, with your "wet" rule as a switch**, both in the S2 table |
| D4 | Rerun the Carpathia search (90 min) inside the cascade? | **Yes, last** |
| D5 | The 43 to 80 degree roll to port in the model's last two minutes | **Backlog item only**; not fixed here |
| D6 | The mesh's ceiling | **Numbers only, no imported model, no textures; at most +15 draw calls** |
| D7 | Order onto main | **T, S, ether** |
| D8 | After S2: go on to the core change if the effect is under a minute? | **Asked at S2, not assumed** |

## 7. What this plan does not do
- It does not finish the ether lane, model the break-up, or correct the core's hull or deck heights.
- It does not push, deploy, or touch any remote.
- It does not change the frozen references (`out/seams_reference.json` never; `out/headway_reference.json` only if S moves a headway run, said in the report).

## 8. Cost [B]
- T: three to five hours of agent work, minutes of machine time per suite.
- S: research about an hour; S1 and S2 about an hour; S3 about an hour; S4 and S5 four to five hours, most of it the machine (the gate 10 min, the Carpathia search 90, the sweeps 75, the refit 4, the boats' fit and the Guide).
