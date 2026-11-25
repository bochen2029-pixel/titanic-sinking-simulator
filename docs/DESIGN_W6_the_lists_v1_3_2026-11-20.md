# W6, G6 and G6b: one damage split for the preset and the watch, and one refit against D69 (design v1.3)

- **Written:** 2026-11-20 19:50 CST (clock) onward, by the mainline session ("Titanic simulator model accuracy", Claude
  Code 74cc0d65, Opus 5.5). The coordinator asked for G6b, the encounter's damage split, with a research note first
  (18:48 CST). It also asked that the reasoning for the flow numbers' moves be written into the design (in a message
  received at 19:27 CST by the clock).
- **Status:** decided by the coordinator on Bo's word (D70 to D73, section 7). G6, G6b and W6 land together with the
  A-kept refit, as join 6's core, from a branch on join 5's main after one full gate.
- **Supersedes:** `docs/DESIGN_W6_the_lists_v1_2_2026-11-20.md`, unchanged as written.
- **Lineage:**
  - v1.2 (D62, D69, the G6 and W6 preview);
  - G6b's research note, `docs/research/RESEARCH_damage_split_by_compartment_G6b_v1_2026-11-20.md`, on wt/g6b-notes;
  - the record room by room, `docs/research/RESEARCH_room_by_room_flooding_record_v1_2026-11-20.md`, on wt/g6b-notes;
  - e87 to e89.

## Changes in v1.3

1. **The branch.** wt/split carries G6 (c52a121) and W6 (189b8b5 to ba0352a) and the preview's experiments onto main
   4bf604e (join 4). Two conflicts were mended by hand: the BACKLOG's W6 row and the CHANGELOG's order. The seams gate
   passes; the pocket suite passes, 9 MUST rows.
2. **G6b's target corrected.** Hackett and Bedford's own opening areas (JOM 1998, Table I) put 22 % in boiler room 6,
   not the preset's 32 %. The preset's split is the water each room held. Section 1.
3. **G6b's mechanism.** `ICE.openAlong` scales each torn station's opening by its compartment's factor. It is needed
   because the encounter's contact law opens every torn metre alike. Section 2.
4. **One split for the preset and the watch, and one refit** inside D69's bounds (e89). Candidate A, Hackett and
   Bedford's split, at "A-kept" meets all five of D69's conditions with J 7.44 (sections 3 and 4). Its best J, 6.23,
   flips a knife-edge what-if.

## The answer in one paragraph

Give the 1912 damage preset and the 1912 watch one damage split, Hackett and Bedford's opening areas by compartment,
and refit the flow numbers with the opening's total area free (A-kept):
- **The fit:** all five of D69's conditions hold. The 11 validation verdicts are unchanged. The preset founders at
  T 157.27 and the watch at T 157.00. J is 7.44, where today's is 9.39. Her last hour is the cascade aft that main has,
  started on time by the record's rooms.
- **The opening** grows 6 %, to 0.7955 m² (8.56 sq ft), toward the sources' 12 to 12.6.
- **The flow numbers** move little: wMul +6 %, aDown -15 %, fOpen -9 %.

The record-following model, with G6's tear ending in boiler room 5's bunker and W6's bunker holding it, then sinks on
time from both starts.

The best J (6.23) lies further on, at wider weirs and fewer ways down. There validate.js's "all bulkheads to B deck"
what-if flips from afloat to foundering at 6 h. That what-if sits on a knife edge, and A-kept is the refit held to the
region where it stays afloat (section 4).

Two things stay open:
- **W6's own list band (D62) is not met early** (section 5). That is for the coordinator.
- **The forepeak (G7)** is the second early room, next.

## 1. Which split, and why (the research note's summary)

| % of the opened area | FP | H1 | H2 | H3 | BR6 | BR5 |
|---|---|---|---|---|---|---|
| Hackett and Bedford, JOM 1998 Table I (1.171 m²) | 4.8 | 11.9 | 24.6 | 26.2 | 22.2 | 10.3 |
| The preset today ("follow the flooded capacities (Hackett & Bedford)": the water held) | 4 | 13 | 21 | 24 | 32 | 6 |
| The encounter with G6 (the tear's length per compartment) | 10.5 | 19.8 | 20.1 | 22.8 | 23.4 | 3.4 |

- **Hackett and Bedford's split** is another model's inference from the same record, not a measurement. It is the one
  published split by compartment, and it agrees with the Report's firmest early figure: boiler room 6, 8 ft above the
  double bottom after ten minutes (e87).
- **A, B and C.** Candidate B keeps Hackett and Bedford forward but leaves boiler room 5 at the encounter's 3.4 %, since
  the Report likens boiler room 5's leak to a fire hose. Candidate C gives the preset the encounter's own split.

## 2. The mechanism: `ICE.openAlong` (G6b's prototype, core/encounter.js on wt/split)

The encounter's contact law dents every station to where the ice crushes back, p0 / q = 6 MPa / 24 MPa per m =
0.250 m. That is 0.05 m beyond the tearing dent, so every torn metre opens alike, and only the top band tears (e88). The
split is then the tear's length in each compartment. No setting of the law makes boiler room 5's opening per metre
differ from the forepeak's. The berg's taper, for one, leaves it as it is.

`ICE.openAlong` (the form of tearAlong, P3b) gives each region a factor on the area constant: [[xAft, xFwd, factor],
...], or a ramp; null is 1 everywhere, and with none the openings keep their bits.
- **The factors** for candidate A, one per compartment over the 1912 damage's extent (from the stem to the bunker's
  after end, 9 ft abaft bulkhead E), are 0.454, 0.600, 1.222, 1.151, 0.949 and 3.047.
- **Outside that extent** the factor is 1.
- **The area constant,** refound so that the encounter still opens 0.7506 m², is 0.22021725042742005. It is scaled with
  the opening's total area as the calibration moves it.
- **Like tearAlong, the factors are fitted bets.** They make the encounter share its opening as the sources' split does
  at the 1912 point. Their physical reading: along the 1912 damage the shell opened less per metre forward, where the
  bow's framing is closer, than in holds 2 and 3 and boiler room 5's bunker. No structural source gives the numbers.
- **On another night** a tear into those compartments is shaped by the same factors. A tear elsewhere is as before.

## 3. The refit (e89, `docs/research/experiments/e89_g6b_refit.js`)

How e89 refits:
- **The score** is tools/calibrate.js's for the preset, plus the watch's founder against 160 min at the same weight
  (e83's).
- **The method** is Nelder-Mead, 45 iterations.
- **The bounds:** "D69" holds each flow number within half its present value, the area between 0.7506 m² and Wilding's
  1.115 m². "Band" also holds both founders to 157 to 160 min, by a steep penalty.

The flow numbers today are wMul 1.036, aDown 0.2815 and fOpen 0.02068. Today's preset scores J 9.39.

| Candidate, bounds | Area, m² (sq ft) | wMul | aDown | fOpen | Preset J | Preset T | Watch T |
|---|---|---|---|---|---|---|---|
| A, e83's wide bounds | 0.7936 (8.54) | 1.919 (+85 %) | 0.2595 (-8 %) | 0.01842 (-11 %) | 7.52 | 157.1 | 157.0 |
| A, D69 | 0.8392 (9.03) | 1.164 (+12 %) | 0.1552 (-45 %) | 0.01224 (-41 %) | 6.40 | 157.32 | 160.27 |
| **A, D69 and band** | **0.83983 (9.04)** | **1.397 (+35 %)** | **0.1545 (-45 %)** | **0.01278 (-38 %)** | **6.23** | **157.00** | **159.86** |
| B, D69 and band | 0.88528 (9.53) | 1.209 (+17 %) | 0.1816 (-35 %) | 0.01445 (-30 %) | 16.49 | 156.73 | 160.38 |
| C, D69 and band | 0.85785 (9.23) | 1.554 (+50 %, its bound) | 0.2709 (-4 %) | 0.0212 (+3 %) | 9.94 | 157.00 | 158.98 |
| **A', a point that keeps the 11 verdicts** (section 4) | **0.78 (8.40)** | **1.036 (0)** | **0.25 (-11 %)** | **0.02068 (0)** | **10.17** | **159.10** | **158.78** |
| **A-kept: A, D69 and band, wMul at most 1.1 and aDown at least 0.24** (section 4) | **0.79554 (8.56)** | **1.1 (+6 %, its bound)** | **0.24 (-15 %, its bound)** | **0.01879 (-9 %)** | **7.44** | **157.22** | **157.01** |

- **B fails D69's condition (4).** Its preset lists too far to port (13 degrees at T 100, against the record's 0), and
  water passes over bulkhead F at T 66 against the record's 75. With boiler room 5 at 3.4 % the timeline must come from
  forward, and the list goes wrong.
- **A's three runs** found three local minima; the score is nearly flat in wMul (core.js's comment).

A at "D69 and band", term by term against tools/calibrate.js's targets:
- **Trim:** 0.88, 1.73, 2.43, 3.52, 4.16, 5.00 and 10.01 degrees at T 15 to 155, against 0.8, 1.8, 2.6, 3.2, 4.0, 5.5
  and 10.
- **List** (+ starboard): 0.48, -3.66, -6.10, -6.57 and -11.23 at T 10, 85, 100, 130 and 145, against 5, 2, 0, -10 and
  -15.
- **Events:** the well deck awash at T 123.3 (130), the bridge at 154.4 (155), and the water over bulkhead F at 75.1 (75).

## 4. D69's five conditions at A (D69 and band) and at A'

`e89_g6b_refit.js A --check '[area,wMul,aDown,fOpen]'` runs all of them at the numbers as rounded:
- A at [0.83983, 1.397, 0.1545, 0.01278];
- A-kept at [0.79554, 1.1, 0.24, 0.01879], the recommendation;
- A' at [0.78, 1.036, 0.25, 0.02068].

| | The condition | A (the best J) | **A-kept** | A' |
|---|---|---|---|---|
| 1 | The 11 validation verdicts unchanged | 10 of 11: "all bulkheads to B deck" founders at 6.0 h (main: afloat) | **all 11** | all 11 |
| 2 | Both founder within 157 to 160 min | the preset 157.01, the watch 159.88 | **the preset 157.27, the watch 157.00 (on the edge)** | the preset 159.10, the watch 158.78 |
| 3 | No flow number moves more than half its value; the area may move toward its sources | wMul +35 %, aDown -45 %, fOpen -38 %; the area +11.9 % | **wMul +6 %, aDown -15 %, fOpen -9 %; the area +6.0 %** | wMul 0, aDown -11 %, fOpen 0; the area +3.9 % |
| 4 | J at most 11.27 | 6.30 | **7.44** | 10.17 |
| 5 | Her last hour's water, said and physical | see below | **see below** | see below |

Condition (5): her last hour on the watch goes as on main.
- **Where it goes:** the cascade aft over the bulkhead tops at E deck. At A' the shares are boiler room 4 16.1 %, 5
  14.4 %, 3 11.1 %, the reciprocating engine room 10.8 %, boiler room 2 10.3 % and 6 10.3 %. Main's were 16.2, 13.6,
  11.5, 10.8, 10.3 and 10.3.
- **How it starts on time:** the cascade starts on time because the forward compartments now get the area they need.
  Holds 2 and 3 take Hackett and Bedford's share, and boiler room 5 its 10 %, held in the bunker until the bunker gives
  way: at T 56.6 on the preset at A' and T 52.5 at A. That is the Report's "about an hour" and the pumps note's 12:40.
- **Not through its side:** boiler room 5's stokehold no longer floods through its side from T 4, as main's does.
  Nothing unphysical carries the water.

What the rooms show:
- **Boiler room 5:** at A' its stokehold has 0.3 m over the tank top at T 30.1, from the door's leak past the pump, and
  8 ft at T 69.5. The record's plates stood about 2 ft over the tank top (Halpern) and stayed dry until the rush at T 60
  to 90.
- **Boiler room 4:** at A' it has 0.3 m at T 100.1, against the record's about a foot by T 95 to 100.

**The B-deck what-if sits on a knife edge** (the mainline's probes on wt/split, 20:00 to 20:04 CST). With Hackett and
Bedford's split it founders at about 6 h:
- with wMul at 1.397 alone, or aDown at 0.1545 alone;
- with A's aDown and fOpen at any wMul from 1.036 to 1.25.

It stays afloat at today's flow numbers, and while wMul is at most about 1.15 with aDown at least about 0.24. On the
preset's present split with A's numbers it also stays afloat, but boiler room 4 then creeps to 1,748 m³. Main's
"afloat" therefore holds only near today's numbers.
- **What the sources say:** Wilding's counterfactuals are D deck (lost; the table keeps it) and C deck (lost if the pumps
  could not keep ahead of boiler room 4). Nothing settles B deck.
- **What it would take:** A meets D69 (1) only if the coordinator counts that what-if as unsourced. A' meets it as
  written.

What the moves mean physically:
- **The opening, +12 %.** It moves toward every source: Wilding's 12 sq ft (9 to 15), Hackett and Bedford's 12.6 (9.53
  at their first coefficient). The model's 8.1 sq ft was low because two rooms flooded early (the research note's
  finding): boiler room 5, mended here by G6 and W6, and the forepeak (G7).
- **wMul, +35 %.** It widens the weirs over each bulkhead's top at E deck:
  - the paths are Scotland Road to port (3.0 m × wMul), the starboard alleyway (2.0 m × wMul) and a centre stair share
    (0.5 m × wMul a side);
  - W6's bunker and G7's forepeak are both below E deck, and touch none of them;
  - the record's front on E deck runs 15 to 22 min ahead of the model's (the room-by-room note), which wider paths
    agree with, though the weirs run well below their free capacity;
  - the score is nearly flat in it.
- **aDown, -45 %.** It narrows the stairways and hatches down through E deck, by which water on E deck falls into the
  compartments under it. Less from above agrees with the record in boiler room 4: its water came up from below, through
  the floor (Dillon, Cavell, the room-by-room note), where the model fills it from E deck first.
- **fOpen, -38 %.** It lowers the share of the weather deck open to the sea once submerged. Her last minutes are then
  fed less from above; the bridge's event stays at T 154.4.

## 5. W6's list against band A (D62), at the same point

Band A is W6's MUST: Hichens's +3 to +7 early, the change of side between T 85 and T 110, and Rowe's -3 to -9 at T 120.
The preset at A's point:
- **Early:** +0.48 at T 10. It fails Hichens.
- **The change of side** comes before T 85 (-3.66 there). It fails the window.
- **At T 120** the list is about -6.4. It holds Rowe.

The watch's list (+ starboard), at T 10, 20, 45, 60, 85, 100, 110, 120, 130 and 145:

| | T 10 | 20 | 45 | 60 | 85 | 100 | 110 | 120 | 130 | 145 | To port for good |
|---|---|---|---|---|---|---|---|---|---|---|---|
| A | -0.40 | 0.39 | 0.20 | -1.76 | -4.75 | -8.50 | -10.26 | -11.28 | -6.01 | -7.08 | T 8.7 |
| A' | -0.50 | 0.42 | 0.21 | -1.92 | -3.44 | -5.91 | -6.76 | -5.43 | -2.92 | -4.41 | T 9.4 |
| A-kept | -0.39 | 0.41 | 0.20 | -1.98 | -3.62 | -6.61 | -7.14 | -4.95 | -3.21 | -4.92 | T 9.2 |

Against band A:
- **A** fails all three parts: early, the change of side, and Rowe's (-11.3 at T 120).
- **A' and A-kept** hold Rowe (-5.4 and -5.0 at T 120). They fail early (about level, where Hichens has +3 to +7), and
  the change of side comes at T 9.2 to 9.4, not between T 85 and T 110.

W6's part A brings the early list to level or slightly starboard, not to Hichens's +5. D64's tunnel height (a 4.6 m bet; only 6.0 gave the early spike) is the open lever. D72 (section 7): W6 lands with band A as CHECK rows,
printed and failing visibly, until D64 is settled.

## 6. What would land (wt/split), when the coordinator says

- **core/encounter.js:** `openAlong` documented as above, the 1912 factors, and the area constant refound
  (tools/calibrate_encounter.js's fixed point).
- **core/scenarios.js:** `TITANIC_SPLIT` set to Hackett and Bedford's fractions, its comment corrected (JOM 1998,
  Table I), and `CALIBRATED_AREA` set to the refit's.
- **core/core.js:** wMul, aDown and fOpen set to the refit's, with their history in the comment.
- **tools/calibrate.js:** the watch's founder carried in its score (D69's refit), so that `node tools/calibrate.js 45`
  reproduces the numbers. A change to the tool: the coordinator decides.
- **Then the suites the change moves:**
  - calibrate_encounter, encounter_tests and night_tests;
  - systems_tests (the 1912 watch's fingerprint moves, which is meant; refrozen and said so);
  - pocket, conserve and stairs (the 1912 timetable);
  - reports_tests (one constant fitted to the watch's trajectory) and calibrate_people;
  - world_tests (WRECK_1912, if her way after the ice moves);
  - the validation table in the commit;
  - the export's digests, STALE and meant;
  - then the full gate in a browser turn.
- **The seams gate keeps its frozen GATE_PARAMS and must pass.**

## 7. Decisions (the coordinator, in a message received at 20:16 CST by the clock)

They were made on Bo's word, relayed by the coordinator at 18:3x CST: "Do what you think is best. If you're unsure, ask
and decide together with the coordinator."

- **D70: A-kept.** It meets all five of D69's conditions: the 11 verdicts unchanged, both founders inside 157 to 160,
  every flow number inside half its value, and J 7.44.
  - A is out, because it flips the B-deck what-if.
  - The finding that this what-if sits on a knife edge, with nothing sourcing B deck, stands in this design
    (section 4).
  - A' is out on J.
- **D71: G6, G6b and W6 land now, with this refit.** G7, the forepeak held to its tank, comes next as its own step,
  with its own refit under D69. "A complete, record-based landing now beats waiting for one more lever."
- **D72: W6 lands with band A as CHECK, not MUST,** until D64's tunnel height is settled.
  - Band A's three rows are printed on the watch and on the preset, failing visibly.
  - At A-kept the early list is about level, where main runs to port from T 7. So W6 makes it no worse than main, and
    is closer to the record room by room.
  - Band A returns to MUST in the commit that settles D64.
  - **D72 amends D62; it does not reverse it.** Band A remains the band; only its rows' force waits on D64.
- **D73: calibrate.js carries the watch's founder in its objective,** with the bounds that keep every verdict as named
  constraints and their reason: wMul at most 1.1, aDown at least 0.24. Then `node tools/calibrate.js 45` reproduces
  the landed numbers. The validation table goes in the commit message, as CLAUDE.md asks.

The landing, as the coordinator set it:
- built on the mainline's branch from main (join 5), with the full cascade:
  - the refit and the validation;
  - the encounter's area constant refitted;
  - the headway reference and the systems suite's fingerprint refrozen, each with its reason;
  - every table that moves rerun: golden, stairs, the fall, night_after, export, U3's, Carpathia, strength's onset,
    the director's cut steps, night_end;
  - one full gate;
- handed to the coordinator as join 6's core;
- anything the gate shows outside D69 goes to the coordinator first.

Kept for G7's step, not this landing ("one lever at a time"; the coordinator, 20:1x): the R3 pilot's sourced widths for
E deck's paths. They are Scotland Road 2.24 m clear between its walls (2.63 m over them), narrowing aft to 1.32 m, and
the starboard passage 1.31 to 1.49 m, against the model's 3.0 and 2.0 m times wMul (R3's report,
`R3_note_E_deck_pilot_report_2026-11-20_2016.md`, branch claude/r3-e-deck at 4519e45). With the paths at their sourced
widths, wMul can come back toward 1 as a true multiplier rather than a width.

## Risks

- **The factors are fitted** to one night's split, itself another model's inference. Boiler room 5's factor (3.0)
  shapes any tear into its bunker on other nights.
- **The fit sits near its edges:** aDown and fOpen near their half-value bounds, and the preset's founder at 157.00.
- **The forepeak (G7)** would move the area again once it follows the record.

## Sources

- The research note (wt/g6b-notes) and its sources: JOM 1998 Table I; Halpern; the Report; Paik, Kim and Thomas 2025.
- e87 (wt/g6b-notes), e88 and e89 (wt/split). The runs' logs are in the mainline's scratchpad until they are written to
  `results_2026-11-20/e89_g6b_refit.txt`.
