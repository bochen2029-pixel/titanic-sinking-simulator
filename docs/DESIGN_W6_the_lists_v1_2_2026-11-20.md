# W6 and G6: the band, the record against the timeline, and option (a) previewed (design v1.2)

- **Written:** 2026-11-20 18:4x CST, by the mainline session ("Titanic simulator model accuracy", Claude Code 74cc0d65,
  Opus 5.5), after the coordinator's decisions of 18:3x CST.
- **Status:** the decisions below are made (D62, D69). Option (a) is previewed on the branch wt/g6w6-preview; nothing is
  adopted, and it lands only on D69's five conditions.
- **Supersedes:** `docs/DESIGN_W6_the_lists_v1_1_2026-11-20.md` (unchanged as written).
- **Lineage:** v1.1; G6's research note (`docs/research/RESEARCH_br5_damage_extent_G6_v1_2026-11-20.md`) and its build
  (wt/g6, c52a121); e82 to e84.

## Changes in v1.2

1. **D62 decided: band A.** Bo, relayed by the coordinator: "Do what you think is best. If you're unsure, ask and decide
   together with the coordinator." The coordinator decided: A as MUST (Hichens's +3 to +7 early; Rowe's -3 to -9 at
   T 120; the change of side between T 85 and T 110); B and C reported beside it, never fitted to. Under A, Part B needs
   nothing for the late list (Rowe's -6 is met as the model stands); W6 is Part A and the change of side.
2. **G6 built and found to trip the founder guard** (wt/g6, c52a121): with the tear ending at boiler room 5's bunker,
   as the record has it, the 1912 watch founders at about T 177 (T 157.74 before).
3. **The finding behind it:** the model's 160-minute timeline leans on boiler room 5 flooding through its side from the
   first minutes, which the record says did not happen. G6 and W6 each take that flooding away.
4. **D69 decided: the record leads, on conditions** (section 2), and option (a) previewed against them (section 3).

## 1. Where her last hour's water goes today (e84 on main, 0f3f4d1)

On the 1912 watch she gains about 78,000 m3 from T 97 to her foundering at T 157.74, and most of it aft of boiler room
5: boiler room 4, 12,600 m3 (16 %); boiler room 3, 9,000 (12 %); boiler room 2, 8,000 (10 %); the reciprocating engine
room, 8,400 (11 %); boiler room 1, 4,500 (6 %); the turbine room, 4,900 (6 %); boiler room 5 itself, 10,600 (14 %),
holding 3,500 m3 an hour before the end from its torn side. Her pace in that hour is the cascade over the bulkhead tops
at E deck, aft from compartment to compartment; boiler room 5 flooding early is the link that starts it on time. The
preset is the same within 1 %.

## 2. D69: the record against the timeline (the coordinator, 18:3x CST, on Bo's word)

The record leads, conditionally. Option (a), G6 and W6 together with the preset's boiler room 5 matched to the record
and one flooding refit whose targets include the watch's founder alongside the preset's, lands through a join with its
gate only if all five hold:

1. the 11 validation verdicts unchanged;
2. the watch founders between 157 and 160 min, and the preset within the calibration's band;
3. no flow number moves more than half its present value (a tripled fOpen fails);
4. J no worse than 1.2 x 9.39 = 11.27;
5. where her last hour's water goes instead of boiler room 5 can be said, and it is physical.

If any fails: G6 and W6 are parked as findings with their numbers, and the next task is the missing path, a research note
before any code (the forward compartments' openings and E deck's paths, against the record's room-by-room times). The
founder guard stands.

## 3. Option (a), previewed

The branch wt/g6w6-preview: G6 (c52a121) with W6 merged in (eff18dc). The preset's boiler room 5 already matches the
record (its one opening 0.7 m abaft the bulkhead, inside the bunker, which with W6 holds its water); the encounter's
area constant stands (refound on the branch: it moves in its eleventh digit). With today's flow numbers the 1912 watch
founders at T 178.69 (the bunker bursting at T 77.2) and the preset at T 167.0.

### 3.1 The refit with the opening held (e83, 18:31 to 18:40 CST)

The calibration's score (tools/calibrate.js) plus the watch's founder against 160 min at the preset founder's weight
((T - 160) / 4)^2; the opening held at 0.7506 m2; Nelder-Mead, 87 evaluations:

| | today (S1's fit) | the refit with both founders |
|---|---|---|
| wMul | 1.036 | 3.00 (its upper bound; x 2.9) |
| aDown | 0.2815 | 0.511 (x 1.8) |
| fOpen | 0.02068 | 0.0605 (x 2.9) |
| J (the preset) | 9.39 | 11.58 |
| the preset's founder | 157.20 | 156.85 |
| the watch's founder | 157.74 | 168.36 |

D69's conditions: (2) fails (the watch at 168.4; the preset at 156.85), (3) fails (all three numbers move by more than
half), (4) fails (11.58 > 11.27). Even with wMul at its bound the watch does not come back to 160: **a missing path, not
a parameter.**

### 3.1b The refit with the opening's total area free (e83 --free-area, 18:35 to 18:45 CST)

The coordinator allowed the area to move to its sources' value (Wilding's 12 sq ft, the 1996 sonar survey's 12 to 13)
without counting against condition (3); the watch's damage scaled with it (the encounter's area constant times area /
0.7506), so the preset and the watch keep one damage:

| | today (S1's fit) | the refit, area free | moved |
|---|---|---|---|
| the opening's area | 0.7506 m2 (8.1 sq ft) | 0.8014 m2 (8.6 sq ft) | +7 % (not toward 12 sq ft) |
| wMul | 1.036 | 1.217 | +17 % |
| aDown | 0.2815 | 0.362 | +29 % |
| fOpen | 0.02068 | 0.01881 | -9 % |
| J (the preset) | 9.39 | 9.20 | better |
| the preset's founder | 157.20 | 156.88 | |
| the watch's founder | 157.74 | 166.51 | |
| the 11 verdicts (a scratch copy) | | all the same (1912 2h36m against 2h37m; five compartments 2h11m, 2h13m; Britannic 0h48m, 0h49m; doors open 2h49m, 2h58m) | |

D69: (1) holds; (3) holds; (4) holds; (2) fails (the watch at 166.5, the preset at 156.88). The record-following PRESET
fits better than today on a modest refit; the WATCH lags it by 9.6 min with one damage area and one set of numbers.

**Why the watch lags (e86):** the encounter shares the area out unlike Hackett and Bedford's split. On main the watch
gave boiler room 6 22.9 % (the preset 32 %) but tore boiler room 5's stokehold side for 8.4 % (the preset 6 %), and the
two cancelled (boiler room 5's water at T 90: 2,863 m3 on the watch, 2,805 on the preset; they foundered half a minute
apart). With G6 the watch gives boiler room 5 3.1 % (its two openings inside the bunker) against the preset's 6 %, and
boiler room 6 24.4 % against 32 %: at T 120 boiler room 5 holds 3,817 m3 against 5,434, and the watch founders 9.6 min
later. G6's tear took away the compensation that hid a light boiler room 6 in the encounter's damage.

### 3.2 Her last hour (e84; `results_2026-11-20/e84_e85_preview.txt`)

On the watch, refitted, her last hour (T 108 to 168.4, 80,560 m3) is the same cascade aft over the bulkhead tops as on
main (boiler room 4 17 %, 5 15 %, 3 11 %, the reciprocating engine room 10 %, 2 10 %), started about ten minutes later
because boiler room 5 starts later (it holds 2,383 m3 an hour before the end, against 3,520 on main). Nothing new
carries the water instead of boiler room 5; the refit only hurries the old path, and not enough. Condition (5) therefore
also fails as asked: there is no substitute path to name in the model.

## 3.3 D69's verdict, and the next task

- **Option (a) fails D69:** the refit with the opening held fails (2), (3), (4) and (5); the refit with the area free
  fails (2) alone, the watch at T 166.5 (and the preset 0.12 min under 157).
- **So, as D69 sets it, G6 and W6 are parked as findings,** each built on its branch (wt/g6 at c52a121; wt/w6 to ba0352a)
  and this preview kept with its experiments; nothing lands.
- **The next task, reframed** (proposed to the coordinator, 18:48 CST): not a new path in the flooding core. With the
  record's boiler room 5 and Hackett and Bedford's split the preset sinks on time on a modest refit; the watch needs the
  same split. So: the encounter's damage split, boiler rooms 6 and 5 near Hackett and Bedford's 32 % and 6 % with the
  tear still ending at the bunker (G6's second half; e82's grid has points with boiler room 6 at 28 %, which lose the
  forepeak), after a research note on each compartment's share (Hackett and Bedford's C1 to C7 if reachable; the sonar
  survey's six openings by compartment).
- **The three Fable agents' reports** go in section 6 when they come.

## 4. A finding in its own right: room by room, the record-following model follows the record where main does not

(Kept however option (a) lands: the coordinator's word after the held-area refit.) Minutes after the touch on the 1912 watch, when each room
first has 0.3 m over its floor (8 ft in brackets), e85:

| Room | main | the preview, refitted | the record |
|---|---|---|---|
| boiler room 6 | 1.4 (10.0) | 1.3 (9.3) | 8 ft at T 10 (Barrett) |
| boiler room 5 | 3.9 (34.2) | 77.1 (92.1) | plates dry until the rush: T 60 (the Report) or T 90 (Barrett) |
| boiler room 4 | 108.4 (132.0) | 105.1 (138.1) | water from under the floor, about a foot by T 100 |
| boiler room 3 | 148.3 | 166.0 | |
| she founders | 157.74 | 168.36 | about 160 |

Main floods boiler room 5 through its side from T 4 and has 8 ft there by T 34, which the record says did not happen;
the record-following model keeps it dry until the bunker bursts (T 77), as Barrett and the Report have it, and puts
water in boiler room 4 as the record does (about a foot by T 100 to 105). Forward of boiler room 5 both match the
record (boiler room 6, 8 ft at T 9 to 10, Barrett's figure). What the record-following model lacks is the pace of her
last phase, not the order of the rooms.
