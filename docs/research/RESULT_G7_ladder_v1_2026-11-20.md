# G7's ladder: the forepeak's tank, G11's widths and G6's switch, one rung at a time (v1)

- **Written:** 2026-11-20 23:34 CST (clock), by the mainline session ("Titanic simulator model accuracy", Claude Code
  74cc0d65, Opus 5.5), on the coordinator's word (23:2x CST): "Your next items stand: the ladder's note, then
  REF_JOIN6 frozen, both on wt/g7."
- **Status:** a result. The coordinator approved rung 2 to land in join 7 (23:2x CST: "rung 2 is approved. Land G7 with
  G11's widths"). The verdicts are read by D75 as the coordinator refined it at 23:3x CST from the README's own
  validation table (section 4).
- **Supersedes:** nothing. The numbers were first reported in the mainline's handoffs of 23:08 and 23:20.
- **Lineage:**
  - G7's research note, `docs/research/RESEARCH_forepeak_held_to_its_tank_G7_v1_2026-11-20.md` (bc91319);
  - its design, `docs/DESIGN_G7_the_forepeak_tank_v1_2026-11-20.md` (ebe9439), both on wt/g7-notes for join 7;
  - the code on wt/g7: 339748c (the tank), 92b40ae (G11's widths, the switch's rows, e92), 63c8d9c and f54e7c8
    (rungs 1 to 3), 99a4e9b (REF_JOIN6, `C.spaceWater`, rungs 0 and 1a);
  - e91 and e92, `docs/research/experiments/results_2026-11-21/`; e90 (the B-deck what-if's knife edge, on join 6's
    core, `results_2026-11-20/e90_b_deck_what_if.txt`);
  - D69 (the five landing conditions), D73 (calibrate.js's watch, band and bounds), D75 (which verdicts bind).
- **Conventions:** T is minutes after the touch. A founder time "2h37m" is hours and minutes after the touch at
  11:40 pm, as `tools/validate.js` prints it (whole minutes, rounded down). All numbers are [measured] on this machine
  (node v26.13.0) unless tagged otherwise.

## The answer in one paragraph

The tank alone, at join 6's numbers, delays her end by about seven minutes (the preset T 157.33 to 164.22, the watch
T 157.03 to 164.45), which puts both founders out of D73's band (157 to 160) and J from 7.92 to 18.85. That delay is the
water the tank keeps out of her bow [derived, e91]: the forepeak stays dry above the orlop for its first twenty
minutes, as the record has it, and on the watch it holds 237 m³ less than join 6's at T 60. One refit within
D73's bounds brings her back: the opening 5.3 % wider (8.45 to 8.90 sq ft), aDown 3.9 % lower and fOpen 4.0 % higher,
with wMul on its bound of 1.1 (rung 1). G11's sourced E-deck widths then move the fit by a few tenths of a percent and
the founders by a tenth of a minute (rung 2: the opening 0.8286 m², 8.92 sq ft; aDown 0.256, fOpen 0.0214; the preset
T 157.13, the watch T 157.95, J 6.67). G6's switch, off, moves no bit (rung 3). Every sourced verdict is kept at every
rung that lands. The bulkheads-to-B-deck what-if, afloat at 8.5 degrees in join 6, now founders at 5h17m. The tank
itself makes that change, not the refit: it founders at 5h31m with the tank before the refit. That now agrees with
Wilding. The case is reported and does not bind, because its sources disagree.

## 1. The rungs

| Rung | What changed | Opening m² (sq ft) | wMul | aDown | fOpen | Founders: preset, watch (T) | J |
|---|---|---|---|---|---|---|---|
| 0 | join 6 (17712b2), on wt/g7 with `peakTank: 0`, `g11: 0` | 0.7853 (8.45) | 1.1 | 0.2647 | 0.02189 | 157.33, 157.03 | 7.92 |
| 1a | the tank, at join 6's numbers (no refit) | 0.7853 (8.45) | 1.1 | 0.2647 | 0.02189 | 164.22, 164.45 (out of 157 to 160) | 18.85 |
| 1 | the tank, refitted (`calibrate.js 45`, D73's bounds) | 0.8266 (8.90) | 1.1 | 0.2544 | 0.02277 | 157.03, 157.84 | 6.71 |
| 2 | rung 1 with G11's E-deck widths, refitted from rung 1 | 0.8286 (8.92) | 1.1 | 0.256 | 0.0214 | 157.13, 157.95 | 6.67 |
| 3 | rung 2 with G6's switch present and off | rung 2's, to the bit | | | | rung 2's | |

- **Rung 0 is join 6, to the bit.** wt/g7 with the tank and G11's widths off gives join 6's 1912 damage to the bit
  (`tools/pocket_tests.js`, REF_JOIN6: 37,759 steps, 08aad7cd3ebf439f, founding at 157.33 min, on 17712b2 and on
  wt/g7 alike). It also gives join 6's validation table to the minute (e92, rung 0).
- **J** is the preset's misfit as `tools/calibrate.js` scores it (D69 (4): no more than 11.27). The watch's term is
  0.55, 1.24, 0.29 and 0.26 on rungs 0, 1a, 1 and 2.
- **The moves against join 6, as D69 (3) reads them** (each within half of its value at D69's base): on rung 2 the
  opening is up 5.5 %, wMul is unchanged, aDown is down 3.3 % and fOpen is down 2.2 %.
- **Rung 2's encounter:** the 1912 encounter's area constant is refitted when rung 2 lands (`calibrate_encounter.js`),
  as for any change that moves the contact's water. calibrate.js's fixed point (D73) at rung 2's opening is
  alpha 0.24538374721945608.

## 2. Which change moved what

### 2.1 The tank alone (rung 0 to rung 1a)

- **The founders:** +6.9 min on the preset and +7.4 min on the watch.
- **The forepeak:** dry above the orlop for the first ten minutes (0.000 m³ by T 10, where join 6 had 143 m³ in the
  forepeak below E deck on the watch and 150 m³ on the preset; e91).
- **Bulkhead A at D deck:** water flows over it at 105.8 min instead of 84.9. The forepeak above the orlop now fills
  only through the tank's vent and from above, so water flows over bulkhead B at D deck (103.3 min) before A.
- **Bulkhead G at E deck:** 130.2 min instead of 111.1 [derived: her bow carries less water through the first hour
  and a half (e91), so she trims less when the water reaches the after bulkheads].
- **The validation cases (section 4):**
  - five compartments: +14 min;
  - without the BR5 seam: +11 min;
  - bulkheads to D deck: +6 min;
  - doors left open: +7 min;
  - Britannic with her ports shut: settles at 8.0 degrees instead of 8.5;
  - bulkheads to B deck: founders at 5h31m where join 6 floated at 8.5 degrees.

  The B-deck case was a knife edge before G7 (e90: on join 6's core small moves of wMul, aDown and fOpen flip it).
  The tank tips it.

### 2.2 The refit (rung 1a to rung 1)

- **The numbers:** the opening 5.3 % wider; aDown 3.9 % lower; fOpen 4.0 % higher; wMul pressed against its bound of
  1.1, where it already was at join 6.
- **The founders:** back inside the band, 157.03 and 157.84. J 6.71, better than join 6's 7.92.
- **Wilding's 16,000 tons:** at 74.5 min (join 6: 74.0; Wilding assumed 40).
- **The what-ifs:**
  - D deck 2h44m (rung 1a: 2h52m);
  - B deck 5h16m (rung 1a: 5h31m);
  - doors open 2h47m (rung 1a: 2h58m).

  The wider opening takes back most of the tank's delay in each.

### 2.3 G11's widths (rung 1 to rung 2)

- **The numbers:** the opening +0.24 %, aDown +0.6 %, fOpen −6.0 % against rung 1.
- **The founders:** +0.1 min on both. J 6.67.
- **The validation table:** every case within a minute of rung 1's. The widths are sourced (R3's E-deck report) and
  cost the fit nothing.

### 2.4 G6's switch (rung 3)

`ice: { tearAlong: null }` through a night's own spec runs the night without G6's tear rule.
- **Absent, or given as landed:** the 1912 encounter is the same to the bit (`tools/encounter_tests.js`, a MUST row).
- **Off (a what-if, a CHECK row):** the tear runs on aft to x 41.5 m, into boiler room 5's stokehold side aft of the
  bunker, as before G6. With the rule it stops at the bunker's after end, bulkhead E less 9 ft (x 51.5 m).

The encounter suite's total-opening row is off by 0.0003 m² on wt/g7. The tank moves the contact's water, and the
area constant is refitted when rung 2 lands.

## 3. The forepeak and its vent against the record

| | The record | Rung 2 (the watch; the preset in brackets) |
|---|---|---|
| The forepeak above the orlop, first ten minutes | The Report: "not flooded above the Orlop deck" | 0.000 m³ by T 10 (0.000) |
| The tank | Flooded through "the hole in the bottom of the peak tank" (the Report) | full (323 m³) at T 23.2 (22.2); holds for good |
| The vent | Hemming (BI 17716-17733): air from the tank's pipe "with considerable force", the stores above "dry", soon after the jar | air first; water up the vent from T 23.4 (22.4), 11.95 m³ by T 30 (13.40) |

The vent is a 4-inch pipe, 0.008 m², led to G deck forward [bet: Hemming's "exhaust pipe", its size not given; the
design, section 1]. It decides when water first stands in the stores (after T 23) and how fast they fill from below.
It does not decide whether they stay dry while Hemming was there: the tank fills first. pocket_tests holds those
three rows on the preset and the watch: dry, full and holding as MUST rows, the vent as a CHECK.

## 4. The validation table under D75, as refined

The coordinator refined D75 at 23:3x CST from the README's own table:
- The bulkheads to D deck have a source (Wilding: "no help"), so they bind.
- The bulkheads to B deck have sources that disagree (Wilding: "still sinks"; the later Britannic design claim: she
  floats with six flooded), so they are reported and do not bind.
- The doors left open are debated, so they are reported and do not bind.

| Case | Record | Binds | Rung 0 (join 6) | Rung 1a | Rung 1 | Rung 2 |
|---|---|---|---|---|---|---|
| Titanic 1912 (calibrated) | 2:20 am (band 157 to 160) | yes | 2h37m | 2h44m | 2h37m | 2h37m |
| Four forward compartments | Wilding: floats | yes | floats, 2.04° | floats, 2.06° | floats, 2.06° | floats, 2.06° |
| Five forward compartments | Wilding: sinks | yes | 2h14m | 2h28m | 2h29m | 2h29m |
| Olympic and Hawke, 1911 | reached port | yes | floats, −0.74° | the same | the same | the same |
| Britannic 1916, approx. | about 55 min | yes | 0h49m | 0h49m | 0h49m | 0h49m |
| Britannic, ports shut | floats (designed for six) | yes | floats, 8.53° | floats, 8.01° | floats, 8.01° | floats, 8.01° |
| Without the BR5 seam | Wilding: sinks, slower | yes | 3h08m | 3h19m | 3h11m | 3h10m |
| Stopping at hold 3 | Wilding's four: floats | yes | floats, 2.04° | floats, 2.06° | floats, 2.06° | floats, 2.06° |
| Bulkheads to D deck | Wilding: no help | yes | 2h46m | 2h52m | 2h44m | 2h45m |
| Bulkheads to B deck | Wilding: still sinks; Britannic's claim: floats | no (sources disagree) | floats, 8.53° | 5h31m | 5h16m | 5h17m |
| Doors left open | debated | no | 2h51m | 2h58m | 2h47m | 2h47m |

Rung 2 keeps every binding verdict. Of the two that do not bind:
- the bulkheads to B deck now founder, where join 6 floated (section 6 has the papers' wording);
- the doors left open founder 4 min sooner than in join 6.

The water aboard at the end barely moves: 100,534 t on rung 2 against 100,656 t in join 6 on the 1912 case.
pocket_tests' conservation row holds with both pockets (at worst 5.6e-6 m³, within 1e-5). C3's own suite,
`tools/conserve_tests.js`, runs in the landing's cascade.

## 5. wMul on its bound

D73 bounds the refit by wMul ≤ 1.1 and aDown ≥ 0.24.
- wMul sits on its bound at join 6, rung 1 and rung 2; aDown stays above its own (0.256).
- The coordinator's word for rungs 2 and 3 was: "Keep D73's bounds (wMul ≤ 1.1, aDown ≥ 0.24) unless rung 2 can't meet
  D69 with them." Rung 2 meets D69 with them, so no fit with the bounds freed was run.
- The bound existed for the bulkheads-to-B-deck what-if (e90: larger wMul tips it). Under the refined D75 that case no
  longer binds, so the bound has lost its reason. The coordinator has put freeing it into the calibration epoch (QC
  E-2), after the Carpathia rerun.
- Until then the fit is constrained, not converged. The J it would reach with wMul free is not known.

## 6. What the papers say

- **The bulkheads to B deck.** "On the B-deck what-if she now founders at 5h17m (about 4:57 am), about an hour after
  Carpathia's arrival (about 4:00 am; her first boat taken up at about 4:10). Before G7 she was afloat at the 8-hour
  check, at 8.5 degrees by the head. This now agrees with Wilding ("still sinks"). It is reported and does not bind
  the fit, because its sources disagree."
  - The coordinator's wording at 23:0x CST had rung 1's 5h16m (about 4:56 am). Rung 2 is the one that lands.
- **The README's validation table** gets the model column of rung 2:
  - the bulkheads to D deck: 2 h 45 min;
  - the bulkheads to B deck: founders after 5 h 17 min, which agrees with Wilding;
  - the doors left open: 2 h 47 min;
  - the BR5 seam: 3 h 10 min;
  - Britannic with her ports shut: floats at 8.0 degrees.
- **The opening the timeline fits:** about 8.9 sq ft (join 6: 8.5). The pumps' row and "Known gaps: List" are
  measured again when G7 lands; `out/validate.txt` does not carry them.

## Decisions taken, and needed

- **Taken:**
  - rung 2 lands in join 7 (the coordinator, 23:2x CST);
  - D75 refined, so the D deck binds and the B deck and the doors are reported (the coordinator, 23:3x CST);
  - `C.spaceWater` lands with G7 with no physics (the coordinator, 23:3x CST, from Z2's QC B-3 and A-6).
- **Needed:** none for G7. Freeing wMul (QC E-2) is the calibration epoch's, after the Carpathia rerun: a design
  first, seen by the coordinator before any code.

## Risks

- **The vent's area is a bet** (0.008 m²). It sets the water in the stores after T 23, not the first ten minutes.
- **wMul is on its bound.** The fit is the best within D73's bounds, not the best fit.
- **The B-deck what-if is a knife edge** (e90). It is reported, not binding, so a later change may flip it back. The
  flip is then said in words, as D75 requires.
- **Her mass under way leaves out the tank** (QC A-6). `core/motion.js`'s syncMass sums `sim.vol` alone. With G7 that
  leaves out the tank's water (about 330 t) from T 23 for the rest of the watch, besides the bunker's (about 270 t)
  until it gives way: about 0.6 % of her mass for good, where A-6 had 0.5 % for an hour. It moves the watch, so it waits
  for the calibration epoch (the coordinator, 23:3x CST).
- **The mirrors miss the pockets until they adopt `C.spaceWater`.** At T 30 that is 590.6 m³ of 7,871 (pocket_tests,
  section 6). The fall's hand-over, rooms.js, the walk and U0's record adopt it after join 7.

## Sources

- **Read:**
  - e91 and e92's results, `docs/research/experiments/results_2026-11-21/` (rungs 0, 1a, 1 and 2, each with its
    validation table);
  - pocket_tests' and encounter_tests' rows on wt/g7;
  - join 6's `out/validation.json` (17712b2);
  - e90's results (join 6's core);
  - the research note and the design (wt/g7-notes);
  - the coordinator's messages of 23:0x (D75), 23:2x (rung 2 approved) and 23:3x (QC; D75 refined), relayed in the
    mainline's handoffs.
- **Not checked here:** the record's quotations, which are the research note's ([checked] there).
