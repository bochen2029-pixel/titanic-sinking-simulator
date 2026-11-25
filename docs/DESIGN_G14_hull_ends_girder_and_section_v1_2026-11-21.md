# G14's hull ends, the girder and section side (the calibration epoch's stage C3, D77): design note v1

- **Written:** 2026-11-21, 03:27 to 03:31 CST, by the B1+B2 lane (Claude Code, Opus 5.5), in the worktree
  `b1b2-strength-85bc79`, on main `5e4d3cd` (join 7) plus this branch's D76 (b), which is inert here.
- **The ask** (the coordinator, 03:1x, inside D77): the hull change goes in dark, behind a switch the seams gate pins off,
  and lands in stage D's one refit. The mainline owns `C.halfBreadth`; this lane owns `section.js` and the girder's
  strength. A design note first, docs only:
  1. what the counter's full sections and the bow's flare above E deck change in the girder's weight and buoyancy curve
     and in `section.js`'s cross-sections at the ends, from R3's numbers per frame and e95's first-order result;
  2. which scantlings the ends need that no table has yet, and where a source might be;
  3. which of this lane's suites (strength, girder) move, and how each would show the switch off to the bit;
  4. what the onset and the break moment do with the switch on, as a first-order estimate.
- **What it rests on:**
  - R3's side at her ends, per frame: `docs/research/RESEARCH_rooms_hull_ends_v1_2026-11-20.md`, section 3.
  - The epoch's design v1.1, C3: `docs/DESIGN_calibration_epoch_v1_1_2026-11-21.md`, on `wt/epoch-notes`, for join 8.
  - e95 (this lane, on join 6): `docs/research/experiments/e95_g12_hull_ends_onset.js`.
  - **e102** (this note's): `docs/research/experiments/e102_g14_ends_girder_section.js`, and its output
    `results_2026-11-21/e102_g14_ends_girder_section.txt`. It takes 11 s.
  - `tools/girder_tests.js`, run at 03:2x on the same tree.
- **What it is not:** nothing in `core/` changes. The restored breadth is R3's shortfall by e95's rule: linear in height
  between E and D decks and between D and C, C deck's shortfall from C to B, nothing above C in a well, nothing below E
  deck. The mainline's shape will differ in detail. e102 wraps `C.halfBreadth` inside its own process only, so
  `section.js` sees the restored breadth while the core's columns stay as they are.

## The answers

1. **The weight curve does not change. The buoyancy curve changes only where the restored volume is under water.**
   - The weight curve reads no breadth: it is the lightship as Prohaska's trapezoid over her profile's extreme points
     (`C.zoneBounds()`), closed to `sim.ms` and `sim.g0`. It stays the same to the bit, provided the switch keeps two
     things: the hull at and below her initial waterlines, and the profile's extreme points (section 1.5).
   - At rest the restored ends lie wholly above the sea: E deck stands 4.3 to 8.3 m above it at her ends.
   - On the 1912 night the forward volume goes under from about T 50 min. Nearly all of R3's forward volume (1,514 of
     1,519 m3 by its rule) is under by T 150, and all of it by trim 11 degrees. The after volume (2,176 m3) never goes
     under before the flag, because her stern rises.
   - In `section.js` the ends' decks widen to the plan's (at 150A, from 3.45 to 9.61 m a side). The steel's area rises
     by up to 69 % (at 150A), and Mu by up to about a quarter, in hogging and in sagging. Vu stays the same: it counts
     the shell's vertical extent, which the switch does not change.
   - Amidships nothing changes, to the bit: the onset's station, and the section the C deck figure is fitted to.
2. **Scantlings.**
   - At her ends `section.js` runs on tapers and on B deck's midship pattern. The poop's and the forecastle's decks, the
     counter's shell and framing, the flare's shell above E deck, where the frame spacing changes, and the lower decks
     at the counter are in no table (section 2).
   - None of them moves the 1912 onset: the ends' stations reach 0.54 to 0.58 of their strength at most. They matter
     only to a break at her ends (B4's what-ifs).
   - Places to look, not yet searched: Lloyd's Register's rules of 1909 to 1912 (the end reductions), The
     Shipbuilder's 1911 special number, the Inquiry's evidence (Wilding), and Mengot's pages again. The builder's own
     drawings, if an archive holds the ends' sheets, would need Bo's word for any copy.
3. **The suites.**
   - With the switch on, `strength_tests` moves where a path or an end station enters it: sections 4, 5, 6, 7 and 7b.
     Its midship sections (1, 2), the hinge (5b), and its monotonicity and cost rows (3, 8) stay.
   - With the switch on, `girder_tests` moves in its golden trace, RECORD, C-7 and the finding (sections 3 to 6). Its
     weight curve (1) and its rows at rest (2) stay.
   - **Off, both are today's to the bit.** While stage C keeps the default off, the existing MUST rows and the tracked
     table prove it. Section 3 below proposes rows that keep proving it after D4 turns the default on: the sections'
     hash, which depends on the form alone, and the off ship's preset on the pre-landing numbers. They come with the
     switch, from this lane.
4. **The onset and the break moment, first order.**
   - On join 7 the onset is at T 156.67 min, step 37842, x -10.93 (boiler room 2), trim 9.3.
   - With the restored volume dry wherever it is under water (the upper bound), the onset comes **0.42 min later**
     (T 157.09), at the same station, at trim 10.5. e95 found +0.41 on join 6.
   - With it dry only where the model's own space above E deck is dry, it does not move. Those spaces have flooded by
     T 100.
   - The break moment does not move: the station's strength is the midship section's (Mu 4.939 GN m), unchanged, and
     so is the hinge's law.
   - The record's moments (RECORD, trim 11 and 17) fall by 0.26 GN m at most, under the upper bound.
5. **Found on the way: C-7 is already off its fit on join 7.**
   - Prohaska's a = 0.40 was fitted to the panel's C-7, 4.64 GN m at 35,000 t. `girder_tests` now reads **4.477 GN m
     (-3.5 %)**, so its CHECK row is OUT, and the hull layer's tag still says "to 0.5 %".
   - The restored ends would take C-7 down to 4.18 under the upper bound, and leave it where it is under the model's
     own flooding.
   - Recommended: refit a once, at D4, with the switch on, as the girder's own step in the landing's cascade
     (section 5).

## 1. What the ends change in the girder and in `section.js`

### 1.1 The weight curve: nothing, by construction

- `girder.js`'s `weight(sim)` builds the curve from:
  - the machinery by room, the coal, the cargo and the people (fixed layers, placed by the bulkheads);
  - the hull (lightship less machinery, 31,773 t) as Prohaska's trapezoid from the stern tip to the stem head (x -138.99
    to 130.32), read once at load from `C.zoneBounds()`;
  - the remainder.
- The curve is closed to the model's own mass and centre (`sim.ms`, `sim.g0`). It reads no breadth.
- So it is the same to the bit if `sim.ms`, `sim.g0` and `C.zoneBounds()` are. Those hold if the switch leaves the hull
  at and below every initial waterline and leaves the profile's extreme points alone.
- **If the profile's ends moved**, the trapezoid would stretch or shrink (G2: the model's counter runs about 9 m past
  the plan's E deck).
  - e102's part D: with the stern tip 3 m forward, the hull layer's moment aft of the onset's station about it falls by
    0.100 GN m; with 7 m, by 0.239 GN m. That is about 0.034 GN m a metre, weights only, before the relief [derived].
  - That is the size of a C-7 miss, so the extreme points should stay. The model's profile already spans her length
    overall (882 ft 9 in).
- **G10 is different.** The stem's entrance lies below the waterline and needs the hull's fit run again. That moves
  `sim.ms` and `sim.g0` a little, so the weight curve's closure and `girder_tests` section 2 (intact at rest) move with
  it. G14 and G2, above the waterline, do not.

### 1.2 The buoyancy curve

- The girder takes its buoyancy from the core's own columns (`ship.cols`, cut by the sea's plane as `hydroPass` cuts
  them) and its water from the core's own spaces. A switch that builds the columns from the restored `C.halfBreadth`
  therefore reaches the girder with no change to `girder.js`.
- **At rest** the restored volume is dry and above the sea (e102 A2, the 1912 preset, trim -0.20 deg):

  | Place | 150A | 135A | 110A | 80A | 80F | 110F | 135F | 154F |
  |---|---|---|---|---|---|---|---|---|
  | E deck above the sea (m) | 5.43 | 5.18 | 4.75 | 4.31 | 5.45 | 6.59 | 7.54 | 8.25 |

  Every column under the sea at rest keeps its submerged part. The new columns outboard of today's side begin above E
  deck, so the intact buoyancy and the rows at rest are the same.
- **On the 1912 night**, the volume under water by e102's C1 (the preset), m3; the watch's (C2) are within 25 m3 of these:

  | T (min) | 50 | 60 | 70 | 80 | 90 | 100 | 120 | 140 | 150 |
  |---|---|---|---|---|---|---|---|---|---|
  | (a) forward, under water | 35 | 168 | 298 | 432 | 574 | 738 | 1,062 | 1,386 | 1,514 |
  | (b) the same, its space above E deck dry | 35 | 83 | 45 | 67 | 43 | 0 | 0 | 0 | 0 |
  | aft, under water | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

  - (a) counts the restored volume as buoyancy wherever it is under water: the upper bound.
  - (b) counts it only where that compartment's space above E deck holds no water in the model. That is the model's own
    physics: the restored volume belongs to those spaces, and floods with them.
  - Under (b) the restored flare buys at most about 100 t of buoyancy, for about half an hour. It acts through the path
    instead: bigger spaces fill more slowly. Only stage D's rung for C3 can measure that.
- **The counter's 2,176 m3** never goes under before the flag. It matters to the stern after the break (Z1's fall: the
  after peak's space above E deck grows by 75 %), not to the girder before it.

### 1.3 The spaces above E deck at her ends

The restored volume by zone (e102 A3, both sides) against each zone's space above E deck today (`nodeVmax`, layer 1):

| Zone | E to D | D to C | C to B | In all | Above E today | Grows by |
|---|---|---|---|---|---|---|
| Forepeak | 59 | 99 | 96 | 254 | 554 | 46 % |
| No. 1 hold | 111 | 193 | 191 | 495 | 1,390 | 36 % |
| No. 2 hold | 144 | 219 | 138 | 501 | 2,078 | 24 % |
| No. 3 hold | 103 | 136 | 30 | 269 | 2,852 | 9 % |
| Electric engine room | 32 | 39 | 30 | 101 | 6,250 | 2 % |
| Shaft tunnel / refrigerated cargo | 119 | 148 | 30 | 297 | 2,906 | 10 % |
| Shaft tunnel / cargo | 245 | 357 | 236 | 838 | 2,253 | 37 % |
| After peak | 187 | 398 | 354 | 939 | 1,254 | 75 % |

In all: aft 2,176 m3 and forward 1,519 m3, by R3's rule as e95 and e102 apply it (R3 gives about 2,300 and 1,700). The
C to B band uses C deck's floor [bet: R3's; B deck's ends were not read].

### 1.4 `section.js`'s cross-sections at the ends

`section.js` builds each section from `C.halfBreadth(x, z, ship.hull)`, `C.deckZ` and `C.inWell`. With the restored
breadth (e102 B, the scantlings unchanged):

| x (m) | Frame | Strength deck | Half-breadth off / on (m) | Steel area off / on (m2) | Mu hog off / on (GN m) | Mu sag off / on (GN m) | Vu (MN) |
|---|---|---|---|---|---|---|---|
| -130.6 | 150A | B (poop) | 3.45 / 9.61 | 0.815 / 1.376 | 0.39 / 0.49 | 0.44 / 0.55 | 39.1 |
| -127.2 | 145A | B (poop) | 4.67 / 10.44 | 1.293 / 1.820 | 1.07 / 1.16 | 1.18 / 1.31 | 72.0 |
| -120.3 | 135A | B (poop) | 6.86 / 11.56 | 1.488 / 1.931 | 1.17 / 1.24 | 1.36 / 1.46 | 72.2 |
| -108.9 | 120A | B (poop) | 9.66 / 12.52 | 1.990 / 2.274 | 1.91 / 1.96 | 1.89 / 1.96 | 75.9 |
| -100.4 | 110A | C (well) | 10.97 / 12.83 | 1.797 / 1.921 | 1.91 / 2.10 | 1.27 / 1.41 | 69.8 |
| -82.1 | 90A | B | 13.17 / 13.74 | 2.926 / 2.985 | 3.71 / 3.74 | 2.51 / 2.57 | 84.5 |
| -10.93 | (onset) | B | 14.02 / 14.02 | 4.020 / 4.020 | 4.94 / 4.94 | 4.56 / 4.56 | 119.7 |
| 72.9 | 80F | B | 12.34 / 13.63 | 3.324 / 3.462 | 4.20 / 4.23 | 3.45 / 3.47 | 100.8 |
| 81.9 | 90F | C (well) | 11.22 / 13.06 | 2.240 / 2.358 | 2.19 / 2.47 | 1.42 / 1.56 | 77.5 |
| 90.8 | 100F | C (well) | 9.90 / 12.21 | 1.991 / 2.131 | 2.04 / 2.36 | 1.41 / 1.59 | 76.0 |
| 99.0 | 110F | B (forecastle) | 8.57 / 11.22 | 2.191 / 2.442 | 2.80 / 2.92 | 2.33 / 2.51 | 83.3 |
| 113.4 | 130F | B (forecastle) | 5.25 / 7.56 | 1.604 / 1.809 | 1.89 / 1.98 | 1.72 / 1.82 | 79.0 |
| 126.0 | 150F | B (forecastle) | 1.48 / 2.32 | 0.995 / 1.080 | 0.97 / 1.05 | 0.97 / 1.06 | 74.0 |

(The full table, 22 stations, is in e102's output.)

- **Amidships, to the bit:** the elements at x -10.93 (the onset's station, the hinge's) and x 0 (the section `FIT.cDeck`
  is fitted to) are the same with the switch on. The fit, the panel's section and the hinge's law stand.
- **The ends never govern.** From T 150 to the onset, the largest ratio (M/Mu)² + (V/Vu)² at any station outside x
  -70 to +70 is 0.540 (x -71.0). Under (a), with the ends' capacities as restored, it is 0.576.
- **Vu does not move**, because `webShear` takes each shell strip's vertical extent.
- **Mu rises most where a deck widens most:** the counter (150A: about +25 % in hogging) and the forward well (90F to
  100F: +13 to +16 %). Next to amidships (80A, 80F) it hardly moves (under 1 %).

### 1.5 What the switch must keep, for the girder and `section.js` to need no change

For the mainline, before it shapes the hull:

1. **The switch reaches `C.halfBreadth` through its third argument (`ship.hull`)**, as `tiers` and `peakTank` reach
   `buildShip`.
   - `section.js` calls `C.halfBreadth(x, z, ship.hull)`, and the girder reads `ship.cols`, so both follow with no edit.
   - A reader that calls `C.halfBreadth` without the ship's hull would not see the switch. The walk, the rooms tables
     and the topsides' clip all read the half-breadth; checking how each calls it is the mainline's list.
2. **`C.zoneBounds()` and the profile's extreme points stay** (the stem head and the stern tip). Both `girder.js` (its
   trapezoid, read once at load) and `buildColumns` read them from the globals. If G2 must move the counter's end, it
   is a separate change with its own cascade, and the weight curve moves (1.1).
3. **Nothing changes at or below any initial waterline.** On the 1912 preset the sea stands at 10.29 m above the keel
   at 150A and 9.38 m at 154F. Then `sim.ms` and `sim.g0` hold, so does the weight curve, and so do the hydrostatic
   targets at 32 ft 3 in and 34 ft 7 in. R3 read nothing below E deck, where the model is already 1.0 to 1.9 m inside
   the plan. The blend between the waterline and E deck is the mainline's [bet] and should start above the highest
   initial waterline.
4. **`C.deckZ` and `C.inWell` stay under this switch.** `section.js` reads the strength deck from them globally. If
   G2's deck items (the wells' ends, C deck's sheer) go behind the same switch, `section.js` must take the ship, and
   this lane should be told first.
5. **R3's gap forward.**
   - R3 read no frame between 80A and 80F. Aft that is harmless: the model is within 0.25 to 0.32 m at 80A.
   - Forward, the model's side at E deck narrows from 14.10 m at x 29.9 (the end of its parallel body) to 11.97 m at
     80F, where the plan has 13.13 (e102 A1).
   - So the forward volume missing between E and B decks is larger than R3's 1,700 m3, by whatever lies between x 30
     and 72.9.
   - Recommended: R3 reads 40F to 75F before the shape is set.

## 2. The scantlings the ends need

What `section.js` uses at her ends today, and what no table has:

| Element at the ends | What `section.js` uses | Its tag | Where a source might be |
|---|---|---|---|
| The poop's and the forecastle's decks (B level, the strength deck there) | B deck's midship pattern: a single 1 in edge strake beyond x ±77.7, 3/4 in across | B deck [read], amidships only; at the ends an implicit [bet] | Lloyd's Register's rules (1909 to 1912 editions, Internet Archive) for superstructure decks; The Shipbuilder's 1911 special number; Mengot's pages |
| The counter's shell above the knuckle, aft of the AP | the side's taper, 0.65 in from 122 m | forward figures [read], aft mirrored [bet: no figures aft] | Lloyd's rules' end reductions; the Inquiry's evidence (Wilding, on the shell); the builder's drawings, if held (Bo's word) |
| The counter's framing (cant frames) and its deck beams | ordinary frames, spacing by `frameAt` | 27 in at the stern [read]; where it changes [bet] | The Shipbuilder 1911 (the stern's construction); Beveridge et al., The Ship Magnificent (2008), if Bo has it |
| The flare's shell above E deck forward | the side's taper, 0.65 to 0.84 in over 80F to the stem | Paik et al. 2025, Fig. 51 [read in the bow note] | Paik et al.'s own figure, read for its heights; Lloyd's rules |
| D and E decks at the counter (they run out over it to about 152A) | out of the section, as everywhere | "not continuously riveted" (Mengot) [read] | Mengot, The Shipbuilder: whether they are continuous over the counter |
| The poop's and the forecastle's side (C to B) and their sheer strakes | the side's taper, no doubling beyond x ±77.7 | [bet] | Lloyd's rules; the Inquiry |
| Where the frame spacing changes from 36 in | 36 in over x -60 to +60, then linear | NOT FOUND [bet] | The Shipbuilder 1911; H&W's profile |

- **What they matter to:** a break at her ends, which is not the 1912 onset. Its ends' stations reach 0.54 to 0.58 of
  their strength at most (1.4), so no choice in this table moves the onset.
- **When it matters:** B4's what-ifs (a second break, the stern's own strength as it rises) and any later
  ship-strength work. They do not need to be ready for stage D.
- **Rule for when one is found:** each figure goes in with its source and tag, as in the midship table. The fit
  (`FIT.cDeck`) does not move, since it is amidships.

## 3. The suites

### `strength_tests` (tracked table `out/strength_tests.txt`)

| Section | With the switch on | Why |
|---|---|---|
| 1. The section amidships (the panel, `FIT`) | stays, to the bit | x 0 and x -10.93 unchanged (e102 B) |
| 2. Smith's curve amidships | stays | the same elements |
| 3. A stronger hull is never weaker | stays | a property |
| 4. The 1912 preset's onset | moves | the path (stage D), and the restored buoyancy as the model floods it |
| 5. Along her, every 10 m, with the demand at the onset | moves | the end stations' strength (1.4); the demand with the path |
| 5b. The hinge (B4's law) at the onset's station | stays | the midship section |
| 6. A stronger hull never breaks sooner; the case that floats | holds; its numbers move | a property; the path |
| 7. The 1912 watch: the reader and the fingerprint | moves | the watch's path |
| 7b. D76 (b)'s rows | hold; their numbers move | properties of the check |
| 8. What it costs | stays | |

### `girder_tests` (no tracked table; MUST and CHECK rows) and `girder_site`

| Section | With the switch on | Why |
|---|---|---|
| 1. The weight curve | stays, to the bit | 1.1, given 1.5's conditions 2 and 3 |
| 2. Intact at rest | stays | the restored volume is above the sea at rest (1.2) |
| 3. The 1912 preset: the golden trace, RECORD, the finding, C-7 | moves | the path; RECORD is quoted by the page, so `girder_site` moves with it |
| 4. The weight curve's bets | moves | the path |
| 5. The cases that float | moves a little | Britannic's and Olympic's paths, if their water reaches above E deck at the ends |
| 6. The 1912 watch | moves | the watch's path |

### How the switch off shows, to the bit

- **During stage C** the default is off, so the existing rows are the proof:
  - `girder_tests`: the golden trace byte for byte, the state digest (`70e4c64d73388573` on join 7), RECORD to
    0.01 GN m;
  - `strength_tests`: its tracked table, which the gate marks STALE on any move.
- **After D4** the default is on, and these rows keep "off" checked, as `pocket_tests` holds `peakTank: 0` to join 6's
  core.

### The rows proposed (this lane writes them, with or right after the switch's commit, in stage C)

- `strength_tests`, a new section 9, "the hull's ends behind their switch (G14)":
  - **MUST**, off: `section.js`'s elements at section 5's stations and at R3's frames, for the ship built with the
    switch off, hashed field by field. The hash equals the default ship's in stage C, and a hash frozen at the switch's
    commit after D4. A section depends on the form alone, so the frozen hash outlives the refit.
  - **MUST**, on: the elements are the same as off's wherever `C.halfBreadth` is unchanged (x -10.93 and x 0 named).
    So the fit, the panel's section and the hinge stand.
  - **MUST**, on: the strength deck's half-breadth at R3's frames equals the shape's own table within 0.05 m. That
    proves the switch carries its numbers into `section.js`.
  - **CHECK**, on: the ends' Mu and Vu beside off's, as in e102 B.
  - **CHECK**, on: the onset on the preset and on the watch, beside off's, printed and not held.
- `girder_tests`:
  - **MUST**, on: the weight curve's pieces are the same as off's, to the bit. That is 1.5's conditions 2 and 3 as a
    test: it fails if the switch touches an initial waterline or the profile's ends.
  - **MUST**, on: the intact rows at rest are the same bits.
  - **MUST**, after D4: the ship built with the switch off runs the 1912 preset on the pre-landing numbers (a fixture of
    those parameters in the test) to the state digest frozen at the switch's commit.
  - **CHECK**, on: RECORD and C-7 beside off's.

## 4. The onset and the break moment with the switch on (first order)

From e102's C2 (the 1912 watch on join 7, the gauge extended by e95's formulas). Along the core's own path:

| | T (min after the touch) | Step | Station | M of Mu (GN m) | V of Vu (MN) | Trim, list (deg) |
|---|---|---|---|---|---|---|
| As the model is | 156.67 | 37842 | x -10.93, boiler room 2 | 4.869 of 4.939 | 20.18 of 119.66 | 9.3, -3.2 |
| (a) dry wherever under water, the ends' strength restored | 157.09 | 37942 | the same | 4.868 of 4.939 | 20.36 of 119.66 | 10.5, -5.7 |
| (b) dry only where its space is | 156.67 | 37842 | the same | 4.869 of 4.939 | 20.18 of 119.66 | 9.3, -3.2 |

- **The onset:**
  - At most 0.42 min later (100 steps), at the same station. On join 6, e95 found +0.41 (154.74 to 155.15).
  - Under the model's own flooding it does not move.
  - The upper bound reaches the onset at a trim nearer the record's 11 to 17 degrees (10.5 against 9.3). That is a
    consequence of a sourced shape, measured, not a target: nothing here is tuned toward the record's band.
- **The break moment:**
  - The strength at the onset's station is the midship section's, the same to the bit. So the moment at the onset stays
    about 4.87 GN m, and `S.hinge` at x -10.93 (the joint's law, the tear's spaces) is the same.
  - The record's moments on the preset (e102 C1):

    | Trim | As the model is | (a) | (b) |
    |---|---|---|---|
    | 11 deg | 5.125 GN m (RECORD) | 4.869 | 5.125 |
    | 17 deg | 5.871 GN m (RECORD) | 5.610 | 5.871 |

- **What first order cannot say:** the restored spaces change her path (their filling, her trim and her list at each
  minute). The refit then moves the opening and the flows. Stage D's rung for C3 measures the founder's and the onset's
  minutes with the switch on, as G7's ladder did. These estimates bound only the restored buoyancy's own effect on the
  gauge.

## 5. Found on the way: C-7 has drifted off Prohaska's fit

- `tools/girder_tests.js` on join 7 (5e4d3cd, run 03:2x CST): PASS every MUST row (9); CHECK 8 of 14.
  - The C-7 row is OUT: the hull's largest moment at 35,000 t aboard is 4.477 GN m (x -0.5, boiler room 2, trim 7.4),
    against the panel's 4.64. That is -3.5 % against the row's 2 %.
  - Its table of the weight curve's bets reads 4.495 for the default (sampled once a minute) and 4.974 for the note's
    a = 0.566.
  - The hull layer's tag in `girder.js` still says "[fitted: the panel's C-7 moment at 35,000 t, to 0.5 %]". That was
    true when it was fitted; the refits since (G6, G6b, G7) moved her path under it.
- **First order:**
  - Linear between those two curves, a = 0.45 would meet 4.64 [derived].
  - With the switch on, C-7 is 4.183 under (a), which would ask a = 0.55 [derived, the same slope]. Under (b) it is
    4.477, asking 0.45 as now.
- **Recommended: D(G14-c), below.** Do not refit a now. A new a moves the gauge, so it moves the onset, RECORD (quoted
  by the page), `strength_tests`' table and `girder_site`. That cascade belongs in D4's one landing, with the switch on
  and the new path under it. Until then the CHECK row stays visibly OUT, as now.

## 6. For the coordinator: the decisions this note asks for

- **D(G14-a): the switch's interface** (1.5):
  - the switch goes through `ship.hull` into `C.halfBreadth`;
  - `C.zoneBounds()`, `C.deckZ` and `C.inWell` are untouched;
  - nothing changes at or below the presets' initial waterlines.
  - Then `girder.js`, `section.js` and `onset.js` need no edit, and the weight curve stays the same to the bit.
  - Advice: yes. Tell the mainline before it shapes the hull.
- **D(G14-b): R3 reads 40F to 75F** (and 40A to 75A, for symmetry) before the shape is set: the model is already
  1.15 m inside the plan at 80F (1.5, item 5). Advice: yes, about 15 minutes of R3's.
- **D(G14-c): Prohaska's a is refitted once, at D4, with the switch on**, as the girder's own step in the landing's
  cascade:
  - its bounds are the 0.40 to 0.75 the code already brackets;
  - RECORD is remeasured and the hull layer's tag corrected;
  - `strength_tests` is rewritten with `--write`, and the commit says why.
  - Advice: yes; not before D4 (section 5).
- **D(G14-d): this lane writes section 3's rows** with or right after the mainline's switch commit, on a branch from
  the stage C branch. It is neutral to every fingerprint, since the default stays off. Advice: yes.
- **The scantlings of section 2** wait. No source is needed for stage D; B4's ends what-ifs would ask for them first.

## 7. Files and effort

- New: this note; `docs/research/experiments/e102_g14_ends_girder_section.js` (reserved in
  `C:\temp\titanic-experiment-numbers.txt` at 03:17); `docs/research/experiments/results_2026-11-21/e102_g14_ends_girder_section.txt`.
- Read only: `core/readers/girder.js`, `core/readers/section.js`, `core/readers/onset.js`, `core/core.js` (`halfBreadth`,
  `buildColumns`, `zoneBounds`, `G`), `tools/girder_tests.js`, `tools/strength_tests.js`, R3's note, the epoch's design
  v1.1 (C3), `BACKLOG.md` (G14, G17).
- By the clock: 03:13 to 03:31 CST. Reading took about 6 minutes, e102 (written, then two runs of 11 to 13 s) and
  `girder_tests` (about 3 minutes, BelowNormal) about 6, the note about 6.
