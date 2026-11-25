# R3 addendum v1.1: her side from 40 frames out, on E, D, C and B decks, the plan's against the model's

- **Written:** 2026-11-21, 05:17 to 05:30 CST, by the B1+B2 lane (Claude Code, Opus 5.5), in the worktree
  `b1b2-strength-85bc79`. R3 rests, so the coordinator gave this pass to this lane.
- **v1 stands as written:** `RESEARCH_rooms_hull_ends_v1_2026-11-20.md` (R3, 2026-11-20). This version adds the
  stretch it did not read, and answers one request.
- **The coordinator's word** (05:1x; BACKLOG G20, its G14 half; D80's (b)):
  - read her side on the deck plans at 40F to 75F and 40A to 75A, where R3 read nothing and the model already lies
    1.15 m inside the plan at 80F;
  - do it as R3 did, so that C3's shape rests on a sourced table before the mainline sets it;
  - agree the table's form with the mainline.
- **The form, agreed with the mainline** (C3's owner, 05:2x):
  - R3's `side.at` in each deck's table, R3's method and units;
  - every 5 frames, with single frames added only where a reading leaves the smooth line through its neighbours by
    more than 0.1 m;
  - B deck as well, which removes R3's bet of C deck's side for the C-to-B band there;
  - `tools/rooms_table_tests.js` holding port against starboard and printing the comparison.
  - The mainline's one request: for each end and deck, the frame where the model's side first lies more than 0.1 m
    inside the plan's (section 4).
- **The rules:** R0 v1.1 (`RESEARCH_rooms_plans_licence_v1_1_2026-11-20.md`): Encyclopedia Titanica's free plans read
  on the page, nothing saved, facts only. Nothing in the model changes.

## 1. What was done

- **Read:** her side as each plan draws it, to port and to starboard, at 40, 45, 50, 55, 60, 65, 70 and 75 frames
  aft and forward. That is 16 frames a deck on E, D and C decks, and 18 on B deck, with 80A and 80F, where R3 had not
  read B.
- **The plans:** Encyclopedia Titanica's E, D, C and B deck pages
  (`https://www.encyclopedia-titanica.org/titanic-deckplans/<deck>-deck.html`), in the built-in browser.
- **Kept:** each table's `side.at` (data/rooms/{E,D,C,B}_deck.json), between R3's 80A and 80F. Each table's
  `side.note` says when and how; B deck's `side` is new, with R3's `unit` text.
- **Checked:** `tools/rooms_table_tests.js` holds each reading's port against its starboard (within 1.5 ft; the
  worst of the new ones is 0.20 ft) and prints the comparison. The suite has 76 rows, all PASS; its table
  (`out/rooms_table_tests.txt`) was rewritten with the gate's `--write`, moved only by these frames.

## 2. How the side was read

**R3's method exactly** (v1, section 2), with R3's own tools in the page:
- R3's helpers (the Zoomify viewer at 650 x 490, pixels read from the viewer's own canvas) and R3's calibration of
  each plan: its midship and centreline in the image's pixels, and its feet a pixel. E deck's frames are the anchors.
  B deck's calibration is R3's from its openings pass.
- **The reading at each frame:** from her outside inward, the first dark pixel on a continuous line (a dark path at
  least 28 px each way along her), at three columns 6 px apart about the frame's tick; the median of the three.
- **The check against R3:** the same reading at R3's 80A and 80F gives R3's figures within 0.1 ft, one pixel:
  - C deck: exactly at 80A, 0.1 ft at 80F;
  - D deck: exactly at 80A, 0.1 ft at 80F;
  - E deck: within 0.1 ft at both.
- **One feature looked at by eye:** D deck at about 42F, port, where the reading is 0.3 ft under E deck's.
  - The plan there draws her side as a clean double line, with the reception room's shell doors (6 ft by 4 ft 5 in
    clear, P and S) and round sidelights.
  - The reading is on the outer line. The difference is the plans' own (section 3).

## 3. The readings (ft from the centreline, port and starboard)

| Frame | E deck | D deck | C deck | B deck |
|---|---|---|---|---|
| 80A | (R3) 44.88, 44.78 | (R3) 45.57, 45.38 | (R3) 45.60, 45.50 | 45.41, 45.41 |
| 75A | 45.27, 45.18 | 45.87, 45.77 | 45.90, 45.80 | 45.60, 45.70 |
| 70A | 45.67, 45.57 | 46.16, 46.06 | 46.09, 45.99 | 45.90, 45.99 |
| 65A | 45.96, 45.86 | 46.26, 46.16 | 46.19, 46.19 | 46.09, 46.19 |
| 60A | 46.16, 46.16 | 46.26, 46.26 | 46.19, 46.19 | 46.09, 46.19 |
| 55A | 46.35, 46.25 | 46.36, 46.26 | 46.29, 46.29 | 46.09, 46.09 |
| 50A | 46.35, 46.35 | 46.36, 46.26 | 46.29, 46.29 | 46.09, 46.09 |
| 45A | 46.35, 46.35 | 46.45, 46.26 | 46.39, 46.29 | 46.09, 46.09 |
| 40A | 46.35, 46.35 | 46.45, 46.36 | 46.39, 46.39 | 46.09, 46.09 |
| 40F | 46.35, 46.35 | 46.06, 45.96 | 45.99, 45.99 | 45.80, 45.90 |
| 45F | 46.25, 46.25 | 46.06, 45.87 | 45.90, 45.90 | 45.70, 45.70 |
| 50F | 46.16, 46.06 | 45.96, 45.87 | 45.90, 45.90 | 45.50, 45.60 |
| 55F | 45.96, 45.96 | 45.87, 45.77 | 45.80, 45.80 | 45.31, 45.41 |
| 60F | 45.76, 45.67 | 45.77, 45.67 | 45.70, 45.70 | 45.11, 45.11 |
| 65F | 45.27, 45.27 | 45.67, 45.47 | 45.50, 45.50 | 44.82, 44.92 |
| 70F | 44.68, 44.68 | 45.38, 45.28 | 45.31, 45.31 | 44.53, 44.62 |
| 75F | 43.90, 43.90 | 44.89, 44.79 | 44.92, 44.92 | 44.13, 44.23 |
| 80F | (R3) 43.11, 43.02 | (R3) 44.01, 43.81 | (R3) 44.53, 44.43 | 43.84, 43.84 |

**What the readings themselves show:**
- **Amidships the plans agree with her moulded beam.** 92 ft 6 in is 46.25 ft a side; the plans' outer line reads
  46.1 to 46.45 ft at 40A to 55A. The outer line lies about 0.1 ft outside the moulded line (the shell and the line's
  own width).
- **B deck reads 0.25 to 0.35 ft under the decks below amidships,** as her tumblehome would put it: the model's own
  takes 0.25 ft off at B deck.
- **The plans' scatter from deck to deck is about 0.1 m.** D and C decks read 0.3 to 0.4 ft narrower at 40F than at
  40A, where she is wall-sided, and E deck reads the same at both. A difference under 0.1 m between two plans is not
  a finding.
- **Smooth:** no reading in this stretch leaves the straight line through its neighbours by more than 0.1 m (the
  worst, 0.07 m, at D deck's 75F; 0.03 to 0.04 m on the other decks), so no single frames were added (the agreed
  rule).
  - R3's own frames, 5 to 10 apart at her ends, do leave such lines where her ends curve hard: E deck at 140A by
    0.65 m, as its sides close at the AP, and 0.1 to 0.2 m at the bow's 90F to 125F on D and C decks.
  - C3 should interpolate smoothly through them, or a later pass should read single frames there.

## 4. The plan against the model, and where the model first lies inside it

The model's half-breadth at each deck itself (`C.halfBreadth` at `C.deckZ`), against the plan's mean of port and
starboard; + where the model is inside the plan (m):

| Frame | x (m) | E | D | C | B |
|---|---|---|---|---|---|
| 80A | -72.9 | +0.25 | +0.32 | +0.25 | +0.19 |
| 75A | -68.4 | +0.12 | +0.21 | +0.16 | +0.11 |
| 70A | -63.8 | +0.06 | +0.15 | +0.10 | +0.10 |
| 65A | -59.2 | +0.02 | +0.07 | +0.06 | +0.09 |
| 60A | -54.6 | +0.01 | +0.03 | +0.02 | +0.06 |
| 50A | -45.4 | +0.03 | +0.02 | +0.03 | +0.03 |
| 40A | -36.3 | +0.03 | +0.05 | +0.06 | +0.03 |
| 40F | 36.3 | +0.06 | -0.05 | -0.04 | -0.03 |
| 45F | 40.8 | +0.10 | -0.00 | -0.02 | -0.03 |
| 50F | 45.3 | +0.18 | +0.08 | +0.07 | +0.00 |
| 55F | 49.9 | +0.30 | +0.21 | +0.18 | +0.07 |
| 60F | 54.5 | +0.46 | +0.39 | +0.33 | +0.16 |
| 65F | 59.1 | +0.61 | +0.60 | +0.51 | +0.31 |
| 70F | 63.7 | +0.77 | +0.85 | +0.75 | +0.50 |
| 75F | 68.3 | +0.94 | +1.09 | +1.00 | +0.72 |
| 80F | 72.9 | +1.15 | +1.25 | +1.29 | +1.02 |

(55A and 45A are in `out/rooms_table_tests.txt`, with the model halfway to the deck above beside each.)

**The mainline's request: where the model first lies more than 0.1 m inside the plan**, going out from amidships.
The crossing is a straight line between the two frames either side of it:

| Deck | Aft | Forward |
|---|---|---|
| E | between 70A and 75A (x -66.8 m; 0.12 m at 75A) | between 40F and 45F (x 40.6 m; 0.10 m at 45F) |
| D | between 65A and 70A (x -60.9 m; 0.15 m at 70A) | between 50F and 55F (x 45.9 m; 0.21 m at 55F) |
| C | between 70A and 75A (x -64.0 m; 0.16 m at 75A) | between 50F and 55F (x 46.6 m; 0.18 m at 55F) |
| B | between 70A and 75A (x -65.6 m; 0.11 m at 75A) | between 55F and 60F (x 51.7 m; 0.16 m at 60F) |

- **Forward, C3's change must reach from about x 40 m** (45F on E deck; 50 to 60F on the decks above). The model's
  fore-body narrows from x 29.9 m (`HULL.xPF1`, its parallel body's end above the waterline), and by 65F it is 0.3
  to 0.6 m inside the plan on every deck.
- **Aft, from about x -61 to -67 m** (65A to 75A). Aft of amidships the model follows the plan to within 0.1 m for
  longer.
- Given the plans' 0.1 m scatter (section 3), the crossings are good to about a frame or two either way.

## 5. What the model lacks, over the whole run (R3's rule)

The floor the plan has and the model has not, both sides (m², the trapezoid rule over every frame read, plan less
model at the deck itself). From 80A and 80F out these are R3's own figures again (124, 300, 288 aft; 126, 179, 226
forward):

| Deck | Aft, in all | of it 40A to 80A | Forward, in all | of it 40F to 80F |
|---|---|---|---|---|
| E | 128 | 4 | 162 | 36 |
| D | 307 | 7 | 214 | 35 |
| C | 294 | 6 | 258 | 32 |
| B (read 80A to 80F only) | 5 | 5 | 20 | 20 |

The volume between E and B decks, each 'tween deck at the mean of its two decks (R3's rule). C to B is now the mean of
C and B where B is read (80A to 80F), and C deck's floor beyond, R3's bet there:

| Between | Aft (m³) | of it 40A to 80A | Forward (m³) | of it 40F to 80F |
|---|---|---|---|---|
| E and D (2.74 m) | 597 | 14 | 516 | 98 |
| D and C (3.20 m) | 961 | 20 | 754 | 107 |
| C and B (2.74 m) | 806 | 15 | 691 | 71 |
| **In all** | **2,364** | **49** | **1,961** | **276** |

- **Forward the model lacks about 1,960 m³ between E and B decks, not R3's 1,700:** 276 m³ more lie between 40F and
  80F, where R3 read nothing. About 2,010 t of sea while dry.
- **Aft the stretch adds little:** 49 m³.
- Below E deck nothing was compared (v1's limit stands). There the model's side is fitted at the load waterline and
  already 1.0 to 1.9 m inside the plan at E deck's ends (v1).

## 6. For C3 and G20

- **For C3 (the mainline):** a sourced side from 40 frames out on four decks, in the tables C3 reads, with the
  frames where its blend must begin (section 4). The forward change is wider than R3's v1 showed.
  - Starting the blend above the highest initial waterline (the mainline's plan) leaves that sea untouched: E deck
    stands well above the 1912 preset's sea at rest along this whole stretch (e102: 4.31 m at 80A, 5.45 m at 80F).
- **G20's other half** (D deck's sidelights, E deck's bow counts) is not done in this pass.

## 7. Sources and effort

- Encyclopedia Titanica's free deck plans, E, D, C and B decks, read on the page in the built-in browser, nothing
  saved (R0 v1.1). Not checked against a 1912 original: the coordinator holds that until Bo agrees to a download (v1).
- R3's v1 note and R3's page helpers (`C:\temp\titanic-wt-r3\_r3_tools\page_helpers.js`, untracked in R3's worktree;
  read, not changed: the same code was pasted into the page).
- The analysis (the smoothness check, plan less model, the crossings, the floor and volumes) is a scratch script in
  this lane's scratchpad. It reads only the four tables and the model, and every figure it gives is reproduced above.
- **Effort, by the clock:** 05:17 to 05:30 CST.
  - Reading the four plans took about 8 minutes (four jobs of 16 to 18 frames, both sides).
  - The tables, the suite and this note took about 5.