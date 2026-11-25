# W6, the lists: the bunker of the fire built; the bands for Bo; the watch's tear into boiler room 5 (design v1.1)

- **Written:** 2026-11-20 17:47 CST (clock), by the mainline session ("Titanic simulator model accuracy", Claude Code
  74cc0d65, Opus 5.5), after the coordinator's decisions of 17:19 CST on Bo's standing word: "W6, decided on Bo's standing
  word unless marked as his. Start building on wt/w6 now, headless. It lands after join 4, with its own gate and its
  cascade named."
- **Status:** built and measured on wt/w6, headless; nothing has landed. D61, D63 and D64's method are the coordinator's
  (below); D62, the band, is Bo's and is put to him with three candidates.
- **Supersedes:** `docs/DESIGN_W6_the_lists_v1_2026-11-20.md` (unchanged as written).
- **Lineage:** as v1; e72 to e75 (v1), e76 and e77 (here).

## Changes in v1.1

1. **The bunker of the fire is built** as a pocket in the core (section 1). Without it the core is the one before W6, to
   the bit (proved three ways, section 1.3).
2. **Its strength is a bet** set to the pumps note's 12:40 and the Report's "about an hour" (13.0 m of its own water's
   head over its floor, bursting at T 58.3; the law is its own head, so the stokehold's pumps do not decide it), with the
   what-ifs either side, because the head across its wall peaks at T 73 and a head cannot reach Barrett's 1:10 (e76).
3. **A double count found and mended:** boiler room 5's columns include the bunker's place, so its water also stood
   there in the level solve; the overlap is moved to the stokehold's own centre across the beam (`C.pocketPoints`).
4. **D64:** no public source for the firemen's tunnel's height; the bet stays at 4.6 m, with 3.4 and 6.0 m as what-ifs.
5. **D62:** three candidate bands, each bound to its sources, and every variant's verdict against each (e77, section 3).
6. **A finding for the encounter's lane (section 4):** the watch's ice tears boiler room 5 open 12 m aft of bulkhead E,
   against the Report's 2 ft. On the watch the stokehold therefore floods by its own side, the bunker never bursts, and
   W6 cannot give the watch the record's early list.
7. **The cascade, named** (section 5), from one headless pass of every suite on the bets.

## The answer in one paragraph

The bunker works as Barrett, the Report and the pumps note describe it on the 1912 damage: it fills to its 260 m3 by
T 19, its door's leak stays below the stokehold's pump (the stokehold never holds more than 11 m3 while it stands, the
plates dry), and it gives way at T 58.3, putting its water into boiler room 5 at once; the pump there is given up at
T 71 where it was T 31 before. Her list follows: level or slightly starboard from T 15 to T 45 where the core before
W6 had her 2 to 3 degrees to port. But no variant puts her inside even the narrowest band on both the watch and the
preset. On the preset the early spike to +5 needs the tunnel at about 6 m, and the change of side at T 85 to 110 needs a
bunker that holds past T 73, which no head can make it do. On the watch the ice's tear carries 72 % of boiler room 5's
opening aft of the bunker, so the stokehold floods by its own side and the bunker's water no longer stands apart: the
watch's list barely moves. My pick: land the bunker on its bets (it is the record's mechanism, it moves the early list
the right way, and it puts boiler room 5's timeline where the note has it), put the band to Bo as candidate A, and send
the tear's extent to the encounter's lane as the next fault in line.

## 1. The pocket (core/core.js)

### 1.1 What it is

- **The space:** the starboard half of boiler room 5's forward bunker, from bulkhead E (x 54.25 m) aft its length (9 ft,
  the watertight passage through it [read]), from the tank top (1.60 m) to G deck (9.41 m on average over it), from the
  centreline to the shell; its capacity from the hull's own half-breadth: **259.9 m3** (the research note: half of 500 to
  540 m3 [derived]); its water's centre 6.11 m to starboard.
- **When it exists:** with a coal list to port (`coalListDeg > 0`) and `params.bunker` (1 by default): the coal list is
  that bunker's coal taken out, so the two go together. Every watch (2.0 degrees) and the 1912 damage have it; the
  presets with no coal list (the four and five compartments, Britannic, Olympic and Hawke) do not.
- **Its water is its own** (`pk.vol`, beside the 64 spaces' `sim.vol`), so every space's level and water stay consistent
  for everything that reads them (the plant's water at the furnaces, the reports, U3's spaces, the export, the record).
- **In the step** it is space NN + j in the flow arrays only: the hull's openings inside it (by position) fill it (a flag
  on their connections, `S.pk`; the store's 64-space topology is untouched, so the export and the record see no new
  connection); its door to the stokehold is an orifice (`bunkerLeak` 0.005 m2 [bet], at the plates [bet]) with the same
  law, stability limit and C3 cut as a connection's; full, it is pressed up no higher than the sea (`bunkerAov` 1 m2
  [bet]); it gives way when the head across its wall, its water down to the stokehold's (or its floor), reaches
  `bunkerBurst` (`pocketsStep`), its water then going into boiler room 5 at once and its openings feeding the stokehold.
- **Her weight:** `C.pocketPoints` gives its water as point masses: its own water where it stands, filling it from the
  bottom, and the stokehold's water that the level solve puts in its place (its columns include the pocket) moved to the
  stokehold's own centre across the beam. The core's loads and the girder's slices read it; a snapshot carries it; the
  forecast's copy carries it (plain data).

### 1.2 The bets and their checks (e76 on the 1912 damage)

| Bet | Value | Its check |
|---|---|---|
| the door's leak | 0.005 m2 | while it holds, the stokehold holds at most 10.6 m3 against its pump (250 LT/h): Barrett's workable boiler room 5 |
| its strength | 13.0 m of head of its own water over its floor | it gives way at T 58.3: the pumps note's "its plates stayed dry until the bunker door burst at about 12:40 (T 60)" [read] and the Report's "about an hour". With the stokehold pumped dry, the head on its wall is 10.1 m at T 20 (full), 13.0 at T 60, 13.7 at T 73 (its peak; boiler room 5 then floods from above): Barrett's 1:10 (T 90) is out of any head's reach (e76) |
| the law: its own head, not the head across its wall | the stokehold's water on the wall's other side left out | the first build counted it, and the stokehold's pumps then decided when the bunker went: pumped dry, the wall carried the most and burst at T 60, unpumped the leak's half metre of water kept it whole, and the 1912 damage foundered 9 minutes SOONER with its pumps than without (167.35 against 176.37 min; the pumps note: they bought about 5). With its own head it bursts at T 58.3 pumped and T 57.6 unpumped, and the pumps buy 4.04 minutes (e78) |
| its top's stiffness | 1 m2 | pressed up a few m3 at most |

**Boiler room 5 given up:** with the bunker, its pump stops at T 71 (the room abandoned once its water stands 2.3 m
over its floor, after the burst's rush); before W6 it stopped at T 30.9, the plates wet from the first minutes. The
pumps note has the men leaving at about T 60, when the bunker door burst [read]. `tools/systems_tests.js`'s window for
it was 20 to 45 minutes, set on the model before W6, not on a source: it becomes T 50 to 80, with the note's words.

### 1.3 Neutral without it, and its own suite

`tools/pocket_tests.js` (a new gate row, `pocket`): 9 MUST rows, all PASS on wt/w6:
- `bunker: 0` gives the 1912 damage as the page runs it (pumps, tiers, staircases, C3) the bits of join 3's main
  (`0f3f4d1`), step by step: 37,727 steps, digest 97b8e5bf8f2555bd; and no pocket, and the 64 spaces' flow arrays;
- a pocket no opening reaches (the four forward compartments, with the night's coal list) changes nothing, to the bit;
- the water is conserved with it at every step to 3.1e-6 m3 (spaces and pocket against inflow less pumped);
- it fills to its capacity by T 18.7; the stokehold stays under 11 m3 while it holds; it gives way at T 58.27;
- a snapshot carries it (taken while it holds and after; two restores run on to the same bits. `restore` re-solves the
  levels, so a restored run is not the run itself to the bit, before W6 as after: on `0f3f4d1` the 1912 damage restored
  at T 30 founders at 9,433.25 s against 9,431.75 s);
- the girder's slices hold her spaces' water and the pocket's, to 1e-6.

The seams gate keeps `bunker: 0` in `GATE_PARAMS` (and the coupled trial with it): PASS, the frozen bits.

## 2. D64: the firemen's tunnel's height

A first public search (2026-11-20) found the passage on the tank top through holds 2 and 3, watertight from them, and a
table of door sizes (5 ft 6 in) that may be its height, but no height of the tunnel itself; the plans or Beveridge's
drawings are the next source. So, as the coordinator set it: **the bet stays 4.6 m** (the model's own, unsourced), and
the what-ifs either side are **3.4 m** (the tank top, 1.60 m, and a passage the height of its doors) and **6.0 m** (a
divider reaching G deck's partitions, Wilding's port-side cabins as a stand-in). Their verdicts are in section 3.

## 3. D62: the band, three candidates, and every variant against them (e77)

The candidates, each bound to its sources (the lists research note, section 1):

- **A, the witnesses' numbers.** The most to starboard within T 5 to 10 is +3 to +7 (Hichens's +5 on the wheelhouse
  inclinometer, US Day 5 [read]); at T 120, -3 to -9 (Rowe's "about six" from collapsible C, BI 17678 [read]); the change
  of side (the first time after T 20 she lists 1 degree to port) between T 85 and T 110 (the boats scraping the high
  side, 12:55 to 1:35; Barrett's burst, 1:10 [read]).
- **B, A and the witnesses' signs.** Also: from T 20 to T 85 never more than 1 degree to port (five witnesses to
  starboard, Lightoller's even keel at T 25 to 35, Symons's slight starboard at T 85 [read]); more to port at T 145 than
  at T 120 (Gracie, Hardy, Woolner: heavy to port at the end [read]).
- **C, B and Halpern's reconstruction.** Also: at T 100, -2 to +2; at T 130, -14 to -6; at T 145, -20 to -10 (Halpern's 0,
  -10, -15 [read in a secondary; his papers not opened]).

**My pick: A as MUST, B's two sign rows as CHECK, C's three as CHECK.** A holds only numbers a witness gave; B's signs
are firm but their times are loose; C is a reconstruction the research note could not check.

e77, the list (+ starboard, degrees) at T minutes after the touch; "side": the change of side as A defines it; "burst":
when the bunker gave way; founders: before any refit:

| Variant | Run | T 5-10 max | T 10 | T 30 | T 60 | T 85 | T 100 | T 120 | T 130 | T 145 | Side | Burst | Founders | A B C |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| before W6 (bunker 0) | watch | +0.6 | -2.5 | -2.4 | -1.6 | -2.2 | -3.8 | -2.4 | -4.1 | -7.6 | 20 | - | 157.74 | - - - |
| before W6 (bunker 0) | preset | +0.9 | -3.1 | -2.3 | -1.4 | -3.3 | -4.8 | -2.3 | -3.8 | -6.9 | 20 | - | 157.20 | - - - |
| **the bets** (13.0 m, 4.6 m) | watch | +1.1 | -1.8 | -1.0 | -0.6 | -2.2 | -4.2 | -2.1 | -3.4 | -5.5 | 20 | 68 | 159.58 | - - - |
| **the bets** (13.0 m, 4.6 m) | preset | +1.7 | -0.5 | +0.3 | -1.7 | -3.6 | -5.5 | -6.5 | -2.0 | -3.6 | 58 | 58 | 167.03 | - - - |
| strength 13.7 m (T 73) | watch | +1.1 | -1.8 | -1.0 | -0.6 | -2.2 | -4.3 | -2.1 | -3.2 | -5.2 | 20 | 81 | 160.09 | - - - |
| strength 13.7 m (T 73) | preset | +1.7 | -0.5 | +0.3 | +0.3 | -3.8 | -5.9 | -7.0 | -5.1 | -3.3 | 72 | 72 | 170.20 | - - - |
| never gives way | watch | +1.1 | -1.8 | -1.0 | -0.6 | -1.4 | -4.2 | -4.2 | -2.4 | -3.3 | 20 | - | 160.84 | - - - |
| never gives way | preset | +1.7 | -0.5 | +0.3 | +0.3 | +0.0 | -2.5 | -7.7 | -7.9 | -5.4 | 94 | - | 181.85 | - - - |
| tunnel 3.4 m | watch | -2.2 | -2.3 | -1.0 | -0.6 | -2.2 | -4.2 | -2.1 | -3.4 | -5.4 | 20 | 68 | 159.62 | - - - |
| tunnel 3.4 m | preset | -0.5 | -0.5 | +0.3 | -1.7 | -3.7 | -5.6 | -6.5 | -2.0 | -3.6 | 58 | 58 | 166.80 | - - - |
| tunnel 6.0 m | watch | +3.2 | +3.2 | -1.0 | -0.6 | -2.2 | -4.1 | -2.1 | -3.3 | -5.4 | 20 | 68 | 159.76 | - - - |
| tunnel 6.0 m | preset | +3.7 | +3.1 | +0.3 | -1.7 | -3.6 | -5.5 | -6.5 | -1.9 | -3.6 | 59 | 59 | 167.35 | - - - |
| tunnel 6.0 m, never gives way | watch | +3.2 | +3.2 | -1.0 | -0.6 | -1.3 | -4.2 | -4.3 | -2.4 | -3.3 | 20 | - | 160.98 | - - - |
| tunnel 6.0 m, never gives way | preset | +3.7 | +3.1 | +0.3 | +0.3 | +0.1 | -2.4 | -7.6 | -8.0 | -5.5 | 94 | - | 182.17 | y - - |

(Measured at 17:58 CST under the burst law of its own head, section 1.2; the first law's run, 17:42 to 17:45, differed
only on the watch, where the bunker then never gave way.)

Reading it:
- **The bunker does what the record says it did,** on the preset: level from T 15 to T 45 (+0.3) where the core before
  W6 had her 2.3 degrees to port, and the change of side at its burst.
- **The early spike is the tunnel's,** not the bunker's: +3.1 to +3.7 within T 5 to 10 at 6.0 m, under 2 at 4.6 m. A
  source for the tunnel's height decides it.
- **The change of side in A's window needs the bunker to hold past T 73,** which no head can do (e76): on the preset only
  "never gives way" reaches it (T 94), against the Report and Barrett, who both saw it go. A law other than a head (the
  plating creeping under a steady load) is a bet with nothing to fit it to.
- **The late port list stays short of Halpern's** in every variant (-3 to -8 at T 145 against -15): the rest of Part B.
- **Every founder moves later** before the refit (+3 to +25 min): the calibration refits the four flow numbers with the
  bunker in, and the coordinator's guard (the 1912 founder within 157 to 160 min) is then checked.

## 4. A finding for the encounter: the watch's tear into boiler room 5

At the end of the 1912 watch's encounter the ice has made 82 openings, 0.7506 m2 in all. In boiler room 5 there are 12,
0.0629 m2, from 0.8 m to 11.8 m aft of bulkhead E (90, 85, 80, 74, 67, 59, 51, 42, 35, 26, 16 and 5 cm2 at 1 m spacing);
only the first two, 0.0175 m2, lie in the bunker. The 1912 damage preset has one opening there, 0.045 m2, 0.7 m aft of
E. The British Report and Barrett put the damage in boiler room 5 about 2 ft abaft bulkhead E. So on the watch boiler
room 5's stokehold floods by its own side from the first minutes, the head across the bunker's wall never builds, it
never gives way, and nothing W6 can do in boiler room 5 gives the watch the record's early list (section 3: every
strength gives the watch the same night). The tear's length aft is set by the encounter's fitted geometry (`GEOM_1912`:
"tears x 123 to 42, from the stem into boiler room 5"), which is the encounter's lane: the split of the area by
compartment against Hackett and Bedford's is its fit. Proposed: the coordinator gives it to that lane as a fault to
weigh (its extent aft against the Report's 2 ft), before W6's Part B.

## 5. The cascade (one headless pass of every suite on the bets, before the refit; the browser suites at the landing)

The pass (17:41 to 17:55 CST, `node tools/gate.js --only <the 28 headless suites>` on wt/w6 with the first law): 13 of
28 good, unchanged: engine, topsides, seams, pocket, wake_scale, conserve, people, world, reports, wake, u3_water,
u3_lights, u3_smoke. The rest move with the physics, as a refit and its refreezes are meant to:

| Suite | What moves | At the landing |
|---|---|---|
| astern | the headway reference's 1912 watch (its first 387 steps flood into the bunker) | refreeze, said in the commit |
| systems | the 1912 watch's fingerprint (no pump order); two rows pinned to the old model, mended here: the screws row ran to 157.1 min (now 6 s before her foundering), boiler room 5's pump window (now the note's T 50 to 80) | refreeze the fingerprint |
| carpathia | its baseline (the 1912 watch's foundering and fingerprint) | refreeze; raise `EVAL_VERSION`; search again (the published best night moves) |
| girder | purity against the golden trace; `RECORD` (5.110 and 5.870 GN m at 11 and 17 degrees: 5.117 and 5.885 before the refit) | after the refit: the trace, then `RECORD` |
| strength | its trace against the golden trace | after the refit |
| visuals | the 1912 damage's lights fail at 2:26:30 (she founders at T 167 before the refit) against 2:15 to 2:19 | the refit's check |
| trials, stairs, golden, night, encounter (and its what-ifs), validate (and validation.json), fall, night_after, export | their tables | written after the refit, each with its reason |

**The refit, previewed** (18:00 to 18:03 CST, `node tools/calibrate.js 45 "[0.7506,1.036,0.2815,0.02068]" --fix-area`
on wt/w6, the opening held; output in `results_2026-11-20/e76_e78_w6.txt`'s companion `refit_w6_preview.txt`):

| | before W6 (S1's fit) | with the bunker, refitted |
|---|---|---|
| wMul, aDown, fOpen | 1.036, 0.2815, 0.02068 | 1.406, 0.3803, 0.06582 (fOpen x 3.2) |
| J | 9.39 | 11.46 |
| the 1912 founder | 157.20 min | 157.07 |
| her list at T 10, 85, 100, 130, 145 (the calibration's targets: +5, +2, 0, -10, -15, Halpern's) | -3.3, -3.2, -4.7, -3.6, -6.9 | -0.7, -3.2, -4.5, -2.3, -4.0 |
| the 11 validation verdicts (a scratch copy of the core with these numbers) | | all the same (founders or floats as before; the five compartments 2h04m against 2h13m; Britannic 0h47m against 0h49m; without the BR5 seam 2h56m against 3h08m; doors open 2h49m against 2h58m; bulkheads to D 2h53m against 2h49m) |

So the coordinator's guard would hold (no verdict changed; the founder within 157 to 160), but the calibration's own
score is worse, and its list terms show why: the bunker mends the early list (-0.7 against -3.3 at T 10) and the late
list is further from Halpern's figures than before (-4.0 against -6.9 at T 145), because without Part B the late port
list leans on the coal list alone. The refit then moves fOpen threefold to keep her foundering, which moves every
preset's late flooding (the five compartments 9 minutes sooner). **Recommendation (D68):** do not land Part A alone;
build Part B (the late port list) on this branch and land A and B together after one refit. And D62's band decides what
the calibration scores: its J holds Halpern's list figures as targets today (`SC.OBS`), which the band would make CHECKs.

The order at the landing: rebase onto main after join 4; the refit (`node tools/calibrate.js 45
"[0.7506,1.036,0.2815,0.02068]" --fix-area`, the opening held), its values into `DEFAULT_PARAMS` and the validation
table into the commit; the coordinator's guard (11 verdicts, the 1912 founder within 157 to 160 min); the refreezes;
the reports' constant (`tools/reports_tests.js`) and the people's fit (`tools/calibrate_people.js`); the tables; `dist/`;
ONE gate; the guide's pictures later, with 1.5.

## 6. Decisions

| | Decision | State |
|---|---|---|
| D61 | Scope: A and B; C to B4's break at the onset | decided (the coordinator, 17:19) |
| D62 | The band | Bo's: candidates A, B, C above; my pick A as MUST, the rest CHECK |
| D63 | The bunker as a pocket, neutral with none | decided (the coordinator); built |
| D64 | The tunnel's height | no source found: bet 4.6 m, what-ifs 3.4 and 6.0 (section 3) |
| D65 | The bunker's strength and law | proposed: 13.0 m of its own water's head over its floor (bursts at T 58.3: the pumps note's 12:40, the Report's hour); what-ifs 13.7 m and never; the head across the wall set aside (it let the pumps decide the burst); the coordinator's |
| D67 | The systems suite's two rows pinned to the old model | mended here with their sources (the screws row 6 s before her foundering; boiler room 5 given up within T 50 to 80, the pumps note) |
| D68 | When Part A lands | proposed: with Part B, after one refit (the preview: J 9.39 to 11.46, fOpen x 3.2, the verdicts unchanged); and the calibration's list targets follow D62's band; the coordinator's, the band's part Bo's |
| D66 | The watch's tear into boiler room 5 | proposed: to the encounter's lane as a fault to weigh (section 4) |

## 7. Sources

- Measured on wt/w6 (core with the pocket): `tools/pocket_tests.js`; `docs/research/experiments/e76_w6_bunker_head.js`,
  `e77_w6_variants_bands.js` and `e78_w6_pumps_and_burst.js`, their output in `results_2026-11-20/e76_e78_w6.txt`; the
  seams gate; one headless pass of every suite (section 5).
- Read: the lists research note, sections 0, 1, 3; `core/scenarios.js` (`TITANIC_SPLIT`); `core/night.js` (`GEOM_1912`).
- Searched, not found: the firemen's tunnel's height (Encyclopedia Titanica's threads on the fireman's passageway and its
  analysis of the watertight doors; the TRMA's paper; the British Inquiry's report on the accommodation).
