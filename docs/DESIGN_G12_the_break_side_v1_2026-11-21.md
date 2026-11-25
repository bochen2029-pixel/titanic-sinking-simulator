# G12, the break's side: the onset as the hand-over, the falling pieces' lever, her hull's ends (design v1)

- **Written:** begun 2026-11-20 23:03 CST, re-scoped 23:25, finished 2026-11-21 00:07 CST, by the B1+B2 lane
  session (Claude Code d3308b57, Opus 5.5), at the coordinator's asks (11-20, about 22:45, 23:10 and 23:25), under Bo's
  overnight word (work on until noon 11-21). Section 2 draws on a Fable subagent's independent read (11-20, 23:29 to
  23:52).
- **Status:** design and headless experiments only. Nothing in `core/`, `core/readers/fall.js` or `core/night.js` is
  changed. Measured on main `7966a23` (join 6) with e91 to e96 (`docs/research/experiments/`; their output in
  `results_2026-11-21/e91_e96_g12.txt`). They ran first on join 5's `a247162`: the onset's verdicts held (both pieces
  upright at every onset hand-over); the flag's moved with the refit (QC B-2's point; section 4).
- **Scope.** BACKLOG G12: on the 1912 watch her pieces rest on the bed upside down, where the wreck has both upright
  (R5 1.1); Bo saw it in User Guide 1.5. Z2's QC found its cause (`QC_B_fall_and_z2_fix_2026-11-20.md` in the group's
  notes, B-1): `fall.js` freezes each piece's lumped air pocket where the air lay at the hand-over, low in the hull at the
  flag's attitude; one line (the air at each slice's floodable centre) lands both pieces upright in every case tried.
  That fix is Z1's. This note is the break's side of G12, independent of it: (1) the onset hand-over as the faithful one,
  and what it moves; (2) QC B-6, the falling pieces' lever under D52: is it physical?; (3) her hull's ends (R3) against
  the onset's time and the moment at the break.
- **Standing decisions:** D54 (Bo, 11-20 10:30: pick (c), the flag now, "then the break with Z6 and B4 in ONE cascade");
  D61 (W6's part C, the last minute, "left to B4's break at the onset"); D52 (the water's push on the hull's own section,
  not the tiers above B deck); Z3's design (`docs/DESIGN_the_join_Z3_v1_2026-11-20.md`: the seam `Night.over`, the
  what-if 'onset').

## The answers in one paragraph

(1) The onset is the faithful hand-over: she broke as one ship at 10 to 17 degrees of trim, and the core's last minute
after the onset (the trim to 69, the roll to its 80-degree clamp, Z9) is a one-piece ship that did not exist. Handing
over there moves the watch's end, its fingerprint and its readers' last word 2.29 minutes earlier (the readers end
with the same counts), and it needs the onset to be the watch's own check (the forecast and reader-less watches read
none today), one `gone(sim)` on the page (QC B-4: the word `foundered` on 33 lines of `site/app.js` and in seven parts,
`Night.over` nowhere), the end card's lines for a break, Carpathia's end and score (`EVAL_VERSION` up, the search run
again), the export's end and fall, the presets, and the references the cascade refreezes. Its cost: the watch ends about
two minutes before the record's break, B2's reported finding. (2) The near-zero lever is partly physical: a flooded
hull's weight in water truly sits near the middle of her depth, so the hull alone has no pendulum; but the model's exact
zero comes from D52's share 0 on the tiers' side drag (their steel sides keep most of a solid plate's wake even with the
glass gone: at a solidity of 0.8 the lever is about +1.9 m, keel down preferred) and, in the stern, from the engine
rooms' permeability solids; ships that capsized going down mostly lie upright. Split D52's share (QC S3) and size the
engine rooms' solids by their iron, in Z6's time. (3) Her hull's ends, to first order: aft the restored volume is never
under water before her last half minute; forward it is under water from T 150 but its spaces above E deck are already
flooded; so the onset does not move, and even the dry upper bound moves it only 0.4 minutes later at the same station.
With G12 mended by B-1, the switch need not hurry: it belongs in D54 (c)'s one cascade with Z6 and B4.

## 1. The onset hand-over: the faithful moment

### 1.1 Why

- **The record's order:** she broke first, as one ship, at 10 to 17 degrees of trim (Hackett and Bedford 10 to 15,
  Long 10 to 11, Halpern 10 to 15: `docs/research/RESEARCH_breakup_hull_girder_v1_2026-11-17.md`), and the pieces went
  down after. B2's onset is that moment in the model: the first step where her strength is reached, at trim 9.4 on the
  watch.
- **The flag is not a moment of hers.** After the onset the core carries one hull on to trim 69 and to its roll clamp
  (80.2 degrees, Z9; W6 measured it, its design v1, sections 1, 2 and 5). W6 left that phase to "B4's break at the
  onset" (D61) and called the alternative "physics of a ship that did not exist". Mending Z9's roll in the core is not
  needed for G12 (B-1 mends it) and is not faithful: Z9 stays, labelled, after the break.

### 1.2 The two hand-overs, measured (e91)

| Hand-over | When | Trim, list | The bow on the bed | The stern on the bed | The joint |
|---|---|---|---|---|---|
| the watch, at the flag (H1) | T 157.03 after the touch, step 37928 | 68.9, -80.2 | upside down (roll -178.7), 1,504 m from the point under the break | upright (-0.8), 136 m | - |
| the watch, at the onset, cut clean | T 154.74, step 37378 | 9.4, -2.9 | upright (-1.1), 1,485 m | upright (-0.7), 115 m | - |
| the watch, at the onset, joined | the same | the same | upright (-1.1), 1,381 m | upright (-0.7), 34 m | lets go +25.2 s, in shear, at 49.4 deg |
| the preset, at the flag (H1) | T 157.33 after the damage | 68.9, -80.2 | upright (-1.0), 1,448 m | upside down (-179.4), 178 m | - |
| the preset, at the onset, cut clean | T 155.07 | 9.4, -4.0 | upright (-1.1), 1,479 m | upright (-0.7), 122 m | - |
| the preset, at the onset, joined | the same | the same | upright (-1.1), 1,376 m | upright (-0.7), 37 m | lets go +25.3 s, in shear, at 49.4 deg |

- At the onset the core is still a ship: trim 9.4, list under 4, the rates small (pitch 0.03 to 0.04 deg/s, heave
  -0.03 m/s). At the flag she is nearly on end and on her beam ends, pitching and heaving fast (1.0 deg/s, -1.4 m/s),
  her roll held at its clamp.
- Joined (Z6 inside B4, milestone 1: S.hinge as built, Lh 20 m), the ligament lets go about 25 s after the onset, in
  shear, as B1+B2's coin's edge said (the double bottom's 20.3 MN against the joint's own shear).
- How the pieces lie in this table is today's engine, with B-1's frozen pocket: section 4.

### 1.3 What it moves

Z3 built the seam: `Night.over(sim) = sim.foundered || (handover === 'onset' && sim.onset.found)`, the night's
post-hand-over branch (the clock and the readers only), and the readers' ends on it (people, reports, the wireless). As a
what-if its limits were stated (Z3's design, section 1, items 7 and 8). As the watch's own rule each becomes work:

1. **What "over" means.** Today she is gone at the flag. Under the onset rule she is gone, as a ship, at the break: the
   watch's end, its final fingerprint (the hash at the onset's step), its last step and the readers' last word move to
   the onset. `sim.foundered` never becomes true and `founderT` stays unset: every reader of `founderT` takes the
   hand-over's time (`sim.onset.found.t`) or the fall's.
2. **The onset must be the watch's own, not a reader's.** `over()` reads `sim.onset.found`, a reader's state. A watch
   built with `readers: false` (the fingerprint rows of every reader's suite, `carpathia.js`'s forks) has no onset and
   would run to the flag; the forecast's copy drops every reader's state (`forecastOf`) and forecasts the flag (Z3's
   stated limit), while the page's watch ends at the break: `systems_site_test`'s "the forecast equals the watch" fails.
   The cure: the watch carries B2's check itself, in plain data (`sim.night.onset`, B2's `O.start()` state, looked at by
   `O.look` on its schedule from `night.js`'s step), so that every copy, forecast and reader-less watch meets the same
   onset; the onset reader then only reports it. B2's functions are plain, and the build already bundles `onset.js` and
   `section.js` into the page and the worker. This is the one piece that touches B1+B2's files.
3. **The page (QC B-4).** `site/app.js` knows she is gone by `sim.foundered` alone (the word on 33 of its lines: the
   model's loop, the flag's branch with its toast and the `foundered` event that shows the end card, `falling()`,
   `pace()`, `togglePlay()`), and so do seven parts (sound, the end card, the reports, help, the deep, the walk, the
   director); `Night.over` appears nowhere in `site/`. An onset watch would step on for ever: no end card, no "On the
   bed", the walk's and the director's last holds never ending. One `gone(sim)` (`Night.over` on a watch, the flag on a
   preset) and every use moved to it; Z3's design, section 2, names the sites; a browser row on a watch made with
   `handover: 'onset'`.
4. **The end card.** Its first line for a break: "her back broke at <clock>, <T> after she touched the ice, in boiler
   room 2"; then "the pieces parted at ...", "the bow went under at ...", "the stern at ..." (from `sim.fall.events`;
   Z2's lines already read them).
5. **The readers.** People, reports and the wireless end on `N.over` already. On the 1912 watch they end with the same
   counts either way (e91: 710 in the boats, 19 boats away, 1,491 in the water), 2.29 minutes earlier; the wireless
   falls silent at the break.
6. **Carpathia's search** (`tools/carpathia.js`) loops on `sim.foundered` and scores minutes to `founderT`. Under the
   onset rule its loop would run to its time limit with the core frozen. It must end on `N.over` and score minutes to the
   hand-over: 2.29 minutes less on the 1912 night, and a new meaning, "afloat until she breaks or founders, whichever
   comes first", under which a night whose hull breaks while she still floats is lost at the break. Scoring to the
   stern's going under would run the fall in every night of the search (seconds each, thousands of nights) for minutes
   Z6's milestone 2 has yet to set: the break is the cheap and decisive end; the pieces' minutes a line for the best
   nights. `EVAL_VERSION` rises, its progress folder with it, and the search and its note are run again (about 90 min).
7. **The export** (`tools/record_night.js`) loops on `sim.foundered` and records the fall from `Fall.begin(sim)` at the
   flag (rule H1). It must end on `N.over` and take the night's own fall (rule 'break'), as Z3 joined it.
8. **The presets.** Z3 offers 'onset' on a watch only; a preset hands over at its flag. The girder part already holds
   B2's state for a preset (`site/parts/55_girder.js`); the preset path can hand over at the onset from it.
9. **References and tables that move,** on purpose and said so in the cascade's commit: the 1912 watch's final
   fingerprint wherever a suite pins it (`systems_tests` "at the end of her sinking", `night_site_test`, `reports_tests`,
   `people_tests`, `world_tests`), `fall_trials` (trial 12 stays the flag's what-if; trial 13 becomes the default's),
   `export_tests`, `carpathia_tests` and its baseline, `night_after_tests`, the deep's and the end card's site suites, the
   User Guide's fall pictures and its account of the night.
10. **What does not move:** the core's step to the onset, to the bit; B2's onset itself (the same step); the joint, the
    hinge and the tear (B4, Z6); every watch and preset that never reaches an onset (the flag rule takes over, as Z3's
    `over` already does).

### 1.4 Its cost against the record

The record's last wireless signal came at 2:17 by her clock (the Virginian's 12:27 New York;
`docs/research/RESEARCH_ship_systems_plant_v1_2026-11-16.md`, the row "Wireless to the end") and her break at T 157 to
158.6 (2:17 to 2:18:36). B2's onset on the watch (T 154.74, about 2:14:44 by her clock, the touch at 11:40; trim 9.4)
is 2.3 minutes before that band and at the low edge of its trims: B2's reported finding, never tuned (B1+B2's lane
report). The flag (T 157.03, about 2:17:02) happens to fall inside the band, by the trim rule. So the onset rule moves
the watch's end about two minutes before the record's.
The pieces part later (joined: about 25 s after the onset) and go under later still (the stern about a minute after it
with milestone 1's stand-in vent; the record has it afloat 1.5 to 3 minutes after the break, which Z6's milestone 2 is
for).

## 2. The falling pieces' lever under D52 (QC B-6): is it physical?

QC B-6 measured that since D52 the cross-flow drag on a piece falling flat acts at 12.28 / 12.04 / 12.61 m above the keel
(whole / bow / stern) against her weight in water's 12.27 / 11.96 / 12.70 m: levers of +0.02, +0.08 and -0.09 m, where
the trials' table still says 2.27 m (share 1's). So after the first seconds nothing prefers keel down. This section is a
Fable subagent's independent read of `fall.js`, `girder.js`'s weight curve and QC_B (11-20, 23:29 to 23:52), its
arithmetic checked with the abacus MCP (receipts in its report); its tags kept.

**What holds a flooded piece's roll at terminal speed:**
- **Her weight in water against the drag's line of action** (W g times the lever times sin of the roll): 0.29 / 0.17 /
  0.12 GN m per metre of lever [derived]. It is the only term that tells keel down from keel up.
- **Her shape (the added masses, Munk):** (m33 - m22) V^2 is 1.26 GN m/rad for the whole and about 0.58 for each piece
  [derived; abacus]; as a length, K / W is 4.3 m (3.4 bow, 4.9 stern). It goes as sin 2 phi: it holds either flat
  attitude, keel down or keel up, alike. (In separated flow the real term is the centre of pressure's travel on the
  leading face; a flat plate's estimate is of the same size, from a formula the agent gave from memory, not confirmed.)
- **The water inside:** full spaces have no free surface: mass and inertia, no moment [derived].
- **Air:** sits at the top whichever way she lies, so while it lasts it holds an inverted piece inverted [derived] (B-1's
  frozen pocket is a different fault: it stays where it lay at the hand-over, low in her at the flag).

**Her weight in water against the drag's centre** (independently of the model's numbers; the model's own masses with real
densities; KG 10.86 m from Halpern's GM and BM [search summary]):

| m above the keel | whole | bow | stern |
|---|---|---|---|
| weight in water, the model [read] | 12.27 | 11.96 | 12.70 |
| weight in water, the agent's estimate (wood afloat to neutral) [derived] | 11.57 to 11.95 | 11.77 to 12.17 | 11.31 to 11.69 |
| the drag's centre, the model since D52 [read] | 12.28 | 12.04 | 12.61 |
| the centre of her side, the hull only [derived] | 11.78 | 11.76 | 11.80 |
| the same with the tiers' sides at a solidity of 0.5 / 0.8 / 1 [derived] | 13.03 / 13.68 / 14.08 | 13.16 / 13.88 / 14.32 | 12.83 / 13.38 / 13.72 |
| lever, the model [read] | +0.02 | +0.08 | -0.09 |
| lever, the agent's, the hull only | 0.0 | -0.2 | +0.3 |
| lever, the agent's, the tiers at 0.8 (0.5 to 1) | +1.9 (1.1 to 2.5) | +1.9 (1.0 to 2.6) | +1.9 (1.1 to 2.4) |

- **Her weight in water truly sits near the middle of her hull's depth** (22.5 m to B deck), not well below it: under
  water her low weights nearly vanish (iron and steel keep about 87 % of their weight, coal about 20 %, liquids and stores
  none), and what is left is about 21,500 t of hull steel spread up her sides and decks against about 5,500 t of
  machinery [derived; bets on the fittings and the wood]. Her low KG makes her stable afloat by her waterplane; under water
  that is gone.
- **The model's solids** (non-floodable volume by permeability) are right in total (19.4 kt of buoyancy against 18.2 to
  19.8 kt item by item) and fair in the boiler rooms, but NOT in the engine rooms: their 15 % gives 2,761 m3 where their
  3,239 t of iron displaces 413 m3. That alone lifts the stern's weight in water from 11.95 to 12.70 m [derived; abacus].
- **Sunk ships:** ships that capsized going down and lie upright in deep water: Yorktown, SMS Scharnhorst, USS Johnston
  (her forward two thirds), Bismarck; ships that stayed inverted: Kirishima, USS Nevada, Hood's midships piece [read and
  search summary: the agent's report lists the pages]. A keel-down preference of a few metres of lever is real, its sign
  set by where the steel is: it rights hulls whose steel is low or spread, not armoured ones whose steel is high. These
  ships began their dives end on, so the record cannot say whether they turned while gathering way or at terminal speed.

**Verdict: partly physical.** The hull proper has no pendulum (its lever under about 0.5 m either way): physical. The
model's exact zero is not: (a) D52's share 0 on the tiers' SIDE drag: with their glass gone the tiers' sides are still
steel with openings (about 1,125 m2 at 26.4 m against the hull's 6,046 m2 at 11.8 m), and a plate under about 20 % open
keeps a solid plate's wake (Castro 1971) [search summary]; at a solidity of 0.8 [bet, to be sourced from R3's plans]
the lever is about +1.9 m for all three, keel down preferred, with the tiers still left out of the added mass; and (b)
in the stern, the engine rooms' solids. The two numbers that decide it: the tiers' solidity to a beam-on flow, and K / W
(4.3 m): with a lever below K / W an exactly inverted piece stays held (which is why QC's exp1 saw no change from a
higher drag centre), but at 1.9 m the rocking that tips her out of inverted falls from 90 degrees to 55 to 67, while
tipping her out of upright needs 113 to 125: one way, and only if she rocks.

## 3. Her hull's ends against the onset (R3, G14), to first order (e95)

R3 (`274d336`, `docs/research/RESEARCH_rooms_hull_ends_v1_2026-11-20.md`, section 3) found the model's side inside the
plans' above E deck at both ends: about 2,300 m3 aft and 1,700 m3 forward between E and B decks, some 4,100 t of
buoyancy while dry. e95 adds R3's shortfall per frame to the gauge as buoyancy columns outboard of the model's side
(each 'tween deck at the mean of its two decks' shortfall, C to B at C's, R3's rule; none over an open well):
2,176 m3 aft and 1,519 m3 forward by R3's rule (R3: about 2,300 and 1,700). They are cut by the sea's plane at her
pose, the gauge's relieved moment (`core/readers/girder.js`) is extended by them with the gauge's own formulas (the added
force aft of each station about it, and its inertial relief), and B2's ratio at every station gives the onset. First order only: along the core's own path, which the restored
buoyancy would itself change (her trim and flooding earlier in the night); the refit gives the full answer.

| The restored ends | B2's onset (the first step where (M/Mu)^2 + (V/Vu)^2 reaches 1 at any station) | Trim, list |
|---|---|---|
| none: the model as it is | T 154.74, step 37378, x -10.93 (boiler room 2), M 4.870 of 4.939 GN m | 9.4, -2.9 |
| (a) dry wherever under water (an upper bound) | T 155.15, step 37477, the same station, M 4.868 of 4.939 GN m | 10.5, -4.7 |
| (b) only where its compartment's space above E deck is dry | T 154.74, step 37378: unchanged | 9.4, -2.9 |

Along the watch from T 150: the forward volume is under water throughout (1,519 m3) and every forward space above E deck
is already flooded; the aft volume is never under water before T 157.0 (35 m3 then). At x -10.93 the dry bound takes
0.27 GN m off the gauge's moment throughout (4.773 to 4.503 GN m at T 154.5, 5.033 to 4.761 at T 155.0).

- **Aft:** the restored volume is never under water before her last half minute (she is down by the head): it cannot
  move the onset.
- **Forward:** it is all under water from T 150, but every forward compartment's space above E deck is flooded by then
  in the model, and restored spaces would flood with it: the onset does not move (case b).
- **The dry upper bound** (case a, as if the forward spaces above E deck stayed dry): 0.27 GN m less at the station, and
  the onset 0.41 minutes later (T 155.15), at the same station, at trim 10.5.
- **So the onset moves at most 0.4 minutes, at the same station, and the moment at the break is unchanged there** (by
  its definition B2's ratio reaches 1). Whether it would bring back a knife-edge at the hand-over is B-1's question
  first; under today's engine e96 has B2's station firm half a minute after the onset (section 4).

## 4. A ready check for B-1's fix (e92 to e96, today's engine)

These ran on today's `fall.js`, with B-1's frozen pocket. They are not G12's diagnosis (B-1 is); they are a check, ready
for Z1: run them after B-1's line and every cell should read upright. Today:

- **e92, Z1's perturbations at each hand-over:** the onset both upright in 72 of 72 (the watch and the preset, cut clean
  and joined), on join 5 and on join 6 alike. The flag: the watch both upright in 3 of 18 on join 6 (0 of 18 on join 5;
  now its heave rate x1.17 to x1.2 lands both upright, the other way about from Z1's 21:48 run), the preset in 2 of 18 (16
  of 18 on join 5: join 6's refit turned its stern over, QC B-2).
- **e93, her list held from the onset to the flag:** on join 5 the flag then turned the stern over in 17 of 18; on join 6
  the watch lands both upright in 16 of 18 and the preset in 0 of 18. The same knife-edge, moving with each refit.
- **e94, let go every 15 s from the onset to the flag:** at B2's station the way up flips at single moments (on join 6 the
  bow at T 155.49, the stern at 156.74); at the flag rule's x -23 at most moments from T 155.49 on.
- **e96, the moment against the cut:** at the onset's own step every cut from x -27 to -7 holds (110 of 110); later the
  band's aft cuts go first (half a minute after the onset x -23 and -27 lose one run in six, a minute after all six),
  B2's station holds to a minute and a half after, and two minutes after every cut turns a piece over.
- **Reading:** this is what B-1 predicts. The frozen pocket's place follows the attitude she is handed over at: near
  upright (the onset) it lies high in her and rights her; nearly on end or on her beam ends it lies low or to one side and
  turns her over, a knife-edge that every refit moves. After B-1's line every cell here should read upright; any that
  does not is a residual worth a row of its own (rerun: `node docs/research/experiments/e9N_g12_*.js <worktree>`, one at
  a time; e92 about 3 minutes, e96 about 8).

## 5. Recommendation

1. **Take B-1 now (Z1), for G12.** It mends the way up without moving the hand-over, a fitted number or a fingerprint.
2. **Make the onset the watch's hand-over in the break's own cascade** (D54 (c): with Z6's milestone 2 and B4, once),
   for faithfulness, not for G12: she broke at the onset. With G12 mended, nothing presses the switch ahead of that
   cascade, and one cascade refreezes the references once. Hand over on the onset's own step, joined (S.hinge, Lh 20 m).
3. **First, the onset as the watch's own check** (section 1.3, item 2): B1+B2's small part, which also lets the forecast
   and every reader-less watch see the break before the switch is taken.
4. **The page's `gone(sim)`** (QC B-4) before the switch: it is the switch's longest single piece of work.
5. **Leave Z9's roll alone** (section 1.1).
6. **The lever (section 2):** split D52's one share as QC S3 proposes: the tiers stay out of the added mass (a row of
   windows entrains little), their side drag takes a solidity sourced from R3's deck plans (0.8 is a bet), and the
   engine rooms' solids are set by their iron's own volume; then print the lever the engine has (QC B-6's remedy). It
   gives the falling pieces the keel-down bias real wrecks show, so the way up holds after the first seconds. Z1's, in
   Z6's time; it is not G12's fix (B-1 is) and moves no fingerprint before the hand-over.
7. **The hull's ends need not wait for the break, nor the break for them** (section 3); check the refit's onset (its
   station and its moment) against this note's e95 and e96.

## 6. The plan

- **Z1:** B-1's line and its five-way trial (QC B-1's remedy); then rerun this note's e92 to e96 as its check.
- **B1+B2 (this lane):** the onset as the watch's own check: a plain-data state in `sim.night`, the look from
  `night.js`'s step through B2's plain functions, the onset reader reporting it; rows in `strength_tests` (the watch,
  the forecast's copy and a reader-less watch find the same onset, step for step; the 1912 fingerprint unchanged to the
  onset). It touches `night.js`, so the mainline and the coordinator place it.
- **Z2:** the page's `gone(sim)` and the end card's lines for a break (QC B-4).
- **The mainline, in the break's cascade:** `handover: 'onset'` as the default; Carpathia's end, score and `EVAL_VERSION`
  and its rerun; the export's end and fall; the presets; the references and tables (section 1.3, item 9); the guide.
- **Done when:** on the 1912 watch the pieces lie upright (a MUST row after B-1, its five-way trial passing); the
  forecast equals the watch to its end; Carpathia's baseline is the watch's own end; the page's end card reads the
  break; the guide's pictures show both pieces upright.

## 7. Decisions needed

| Id | Question | Proposal | Who |
|---|---|---|---|
| D(G12-a) | The watch's own hand-over | the onset, joined, on its own step, in D54 (c)'s one cascade; the flag the what-if and the fallback | the coordinator, for Bo |
| D(G12-b) | The onset as the watch's own check (`night.js` reading B2's plain functions) | yes, before the switch: the forecast and reader-less watches then see the break | the coordinator, with the mainline |
| D(G12-c) | Z9, the last-minute roll | left as it is, labelled, after the break | the coordinator |
| D(G12-d) | Carpathia's score under the onset rule | minutes to the break or the flag, whichever first; `EVAL_VERSION` up, the search run again | the coordinator, for Bo |
| D(G12-e) | The falling pieces' lever (QC B-6) | split D52's share: the tiers' added mass 0, their side drag at a sourced solidity; the engine rooms' solids by their iron; print the lever | the coordinator, with Z1 |

## 8. Experiments and sources

- `docs/research/experiments/`: `e91_g12_handover_landings.js` (the six hand-overs, the readers at each);
  `e92_g12_landing_robustness.js`, `e93_g12_roll_held.js`, `e94_g12_handover_moment.js`, `e96_g12_cut_station.js` (today's
  engine's way up, by perturbation, held list, moment and cut: B-1's check); `e95_g12_hull_ends_onset.js` (R3's ends on
  the gauge); `e91_g12_lib.js` (their helpers and Z1's perturbations). Output: `results_2026-11-21/e91_e96_g12.txt`.
- `core/readers/fall.js` (`begin`, `join`, `onStep`, `piece`, the drag), `core/night.js` (`over`, `step`, `forecastOf`),
  `core/readers/girder.js` (`moment`, its relief; `weight`), `core/readers/people.js`, `reports.js`, `world.js` (their
  ends on `N.over`), `site/app.js` and `site/parts/` (their `sim.foundered`), `tools/carpathia.js`,
  `tools/record_night.js`, `out/fall_trials.txt` ("THE PIECES"; trials 12 and 13).
- `docs/DESIGN_the_join_Z3_v1_2026-11-20.md`; `docs/DESIGN_W6_the_lists_v1_2026-11-20.md` (sections 1, 2, 5);
  `docs/BRAINSTORM_the_descent_to_the_bed_v2_1_2026-11-20.md` (D54); `docs/DESIGN_free_body_air_by_space_v1_2_2026-11-20.md`;
  R3's `docs/research/RESEARCH_rooms_hull_ends_v1_2026-11-20.md` (`274d336`, section 3);
  `docs/research/RESEARCH_breakup_hull_girder_v1_2026-11-17.md`; `docs/research/RESEARCH_ship_systems_plant_v1_2026-11-16.md`.
- Z2's QC (the group's notes folder, not in the repository): `QC_00_SYNTHESIS_2026-11-20.md`,
  `QC_B_fall_and_z2_fix_2026-11-20.md` (B-1, B-4, B-6). Z1's Q1 findings (its CONTINUATION, 11-20 21:12 and 21:47).
- Section 2's sources (the Fable subagent's, as it gave them): Halpern, "Stability and Trim" (titanicology.com); the hull
  at launch (Encyclopedia Titanica's archive); Castro 1971, the wake of perforated plates (Journal of Fluid Mechanics);
  Assen and others, a centre-of-mass offset and vortex shedding (arXiv 2308.04129); the wrecks' pages (Wikipedia: USS
  Yorktown CV-5, SMS Scharnhorst, USS Johnston DD-557, Bismarck, Kirishima, USS Indianapolis; USS Nevada: PMC8804083).
