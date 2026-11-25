# R3 addendum: her side at her ends on C, D and E decks, the plan's against the model's (v1)

- **Written:** 2026-11-20, about 23:05 CST, by the R3 session (Claude Opus 5.5).
- **The coordinator's word** (about 22:50): "the same side comparison as C deck's, at E and D decks' ends, the model's side against the plan's under the poop and the forecastle. It's for BACKLOG G14, the hull's ends." The rules are R0 v1.1, as before. Nothing in the model changes.
- **The parent note:** `RESEARCH_rooms_C_to_Boat_decks_v1_2026-11-20.md`, section 3.1 (C deck). This addendum also corrects one number there (section 4 below).

## 1. What was done

- **Read:** her side as each plan draws it (Encyclopedia Titanica's plans, read on the page, nothing saved), to port and to starboard.
- **Where:** at 25 to 27 frames along each end of E, D and C decks, from 80A aft to the end of each deck, and from 80F to 154F forward.
- **Kept:** each table's header now carries its readings (`side`), with how they were read.
- **Checked:** `tools/rooms_table_tests.js` holds every reading's port against its starboard (the reading's own check: within 1.5 ft; worst 0.39 ft on C, 1.08 ft on D, 1.28 ft on E), and prints the comparison below. The suite now has 71 rows, all PASS.

## 2. How the side was read

- **Scale and centreline:** each plan's own, as for the rooms. Her frames are E deck's anchors; the plan's printed frames fall on the ruler.
- **The reading at each frame**, by pixel profile of the page at 1:1:
  1. from her outside inward, the first dark pixel that lies on a continuous line (a dark path at least 28 px each way along her);
  2. at three columns 6 px apart;
  3. the median of the three.
- **Why the line test:** annotations outside her hull (labels, dimension arrows) are not continuous lines, so it rejects them. The readings were then marked on the page and looked at: on E and D decks they sit on her outer line from end to end.
- **C deck was read again the same way.** The first reading (about 21:25, port only, the first dark pixel) agreed within 0.1 ft everywhere except at 120A, where it had caught an annotation: 42.8 ft against her line's 40.3 ft.
- **The model's side** is `C.halfBreadth`, at the deck itself (below), and halfway to the deck above, where the tables' `shell` rows put it. The second differs from the first by 0.1 m or less (suite table).
- **Gaps:** E deck's plan ends at the AP (148A), where its sides meet. C deck at 145F has a port reading only: the starboard line is broken there by fittings.

## 3. The numbers, per frame

**The model's half-breadth at the deck less the plan's** (m; negative where the model is narrower). The plan's value is the mean of port and starboard; the full table, with the model halfway up as well, is `out/rooms_table_tests.txt`.

| Frame | x (m) | E deck: plan | E: model less plan | D deck: plan | D: model less plan | C deck: plan | C: model less plan |
|---|---|---|---|---|---|---|---|
| 150A | -130.6 | (ends at 148A) | | 8.31 | -5.17 | 9.49 | -6.16 |
| 148A | -129.2 | | | 8.85 | -5.24 | 9.86 | -6.04 |
| 145A | -127.2 | 3.41 | **+0.65** | 9.38 | -5.11 | 10.29 | -5.77 |
| 140A | -123.8 | 6.11 | -1.04 | 10.40 | -5.06 | 10.89 | -5.27 |
| 135A | -120.3 | 7.57 | -1.52 | 11.03 | -4.69 | 11.35 | -4.70 |
| 130A | -116.8 | 8.88 | -1.93 | 11.53 | -4.27 | 11.72 | -4.13 |
| 125A | -112.9 | 9.70 | -1.82 | 11.92 | -3.71 | 12.04 | -3.48 |
| 120A | -108.9 | 10.49 | -1.74 | 12.28 | -3.19 | 12.29 | -2.86 |
| 115A | -104.7 | 11.36 | -1.78 | 12.61 | -2.69 | 12.53 | -2.29 |
| 110A | -100.4 | 11.90 | -1.56 | 12.89 | -2.24 | 12.83 | -1.86 |
| 100A | -91.3 | 12.69 | -1.00 | 13.29 | -1.33 | 13.30 | -1.09 |
| 90A | -82.1 | 13.22 | -0.50 | 13.59 | -0.68 | 13.66 | -0.57 |
| 80A | -72.9 | 13.66 | -0.25 | 13.86 | -0.32 | 13.88 | -0.25 |
| 80F | 72.9 | 13.13 | -1.15 | 13.38 | -1.25 | 13.56 | -1.29 |
| 90F | 81.9 | 12.26 | -1.40 | 12.62 | -1.58 | 13.06 | -1.84 |
| 100F | 90.8 | 11.00 | -1.52 | 11.59 | -1.90 | 12.21 | -2.31 |
| 105F | 94.9 | 10.11 | -1.35 | 11.00 | -2.02 | 11.75 | -2.56 |
| 110F | 99.0 | 9.42 | -1.44 | 10.25 | -2.05 | 11.07 | -2.65 |
| 115F | 102.7 | 8.52 | -1.31 | 9.44 | -2.02 | 10.34 | -2.69 |
| 120F | 106.4 | 7.58 | -1.19 | 8.46 | -1.86 | 9.47 | -2.65 |
| 125F | 110.0 | 6.61 | -1.05 | 7.68 | -1.93 | 8.56 | -2.59 |
| 130F | 113.4 | 5.62 | -0.92 | 6.57 | -1.68 | 7.40 | -2.31 |
| 135F | 116.7 | 4.63 | -0.78 | 5.55 | -1.53 | 6.29 | -2.08 |
| 140F | 119.9 | 3.68 | -0.72 | 4.40 | -1.28 | 4.95 | -1.66 |
| 145F | 122.9 | 2.66 | -0.59 | 3.22 | -1.02 | 3.52 | -1.17 |
| 150F | 126.0 | 1.60 | -0.47 | 1.89 | -0.65 | 2.21 | -0.84 |
| 154F | 128.5 | 0.66 | -0.31 | 0.79 | -0.35 | 1.01 | -0.47 |

## 4. What it shows

- **Amidships the model and the plans agree** on every deck: at 80A, within 0.25 to 0.32 m. The scales are right, and what follows is her form at her ends.
- **At both ends the model's side is inside the plan's on every deck, more the higher the deck:**

  | Deck | Aft (100A to the deck's end) | Forward (90F to 125F) |
  |---|---|---|
  | E | 1.0 to 1.9 m a side | 1.0 to 1.5 m |
  | D | 1.3 to 5.2 m | 1.6 to 2.1 m |
  | C | 1.1 to 6.2 m | 1.8 to 2.7 m |

  - Aft, the model lacks the full sections over her counter: D and C decks run out over it, to about 152A, and keep 8 to 10 m of half-breadth there; the model has 3.1 to 3.4 m.
  - Forward, it lacks her flare: the plans widen deck by deck at the bow; the model's sections hardly do (its half-breadth halfway up is 0.1 m more than at the deck).
- **One frame has the model wider:** at 145A on E deck (+0.65 m). E deck's plan closes to the AP at 148A, while the model's hull at that height runs on aft (G2 of the pilot's note: the model's counter runs about 9 m past the plan's E deck).
- **The floor the model lacks**, both sides, between 80A or 80F and the deck's end, by the trapezoid rule over these frames:

  | Deck | Aft (m²) | Forward (m²) |
  |---|---|---|
  | E | 124 | 126 |
  | D | 300 | 179 |
  | C | 288 | 226 |

- **The space the model lacks** between E deck and B deck, taking each 'tween deck's floor as the mean of its two decks (and C deck's floor for C to B, since B deck's ends, the poop and the forecastle, were not read [bet]):

  | Between | Aft (m³) | Forward (m³) |
  |---|---|---|
  | E and D | 582 | 418 |
  | D and C | 942 | 647 |
  | C and B | 791 | 620 |
  | **In all** | **2,300** | **1,700** |

  - About 2,370 t of sea aft and 1,730 t forward.
  - That is her buoyancy above E deck while those spaces are dry, and her water once they flood.
  - Below E deck (the run of her stern and her forefoot) nothing was compared here.
- **The correction to the C-deck finding** sent at 21:52: at 120A the model is 2.9 m narrower at the deck (2.7 m halfway up), not 3.5 m. The other C numbers stand within 0.1 m. The new table reads them at the deck itself, which makes them 0.1 m larger than the halfway figures first sent.

## 5. For G14

- **Pass on:** the per-frame numbers above, and the readings themselves in `data/rooms/{C,D,E}_deck.json` (`side`), for whoever reshapes the hull's ends.
- **Already done:** the drawn shell (`TS.hullDraw`) takes the deck plan's round stern above the waterline. The model's own `halfBreadth` does not, at the stern or the bow.
- **Not checked:** against a 1911-12 original; the coordinator holds that until Bo agrees to a download.
- **Effort, by the clock:** 22:50 to 23:05 CST, 15 minutes: reading the three decks about 9, the suite, the numbers and this note about 6.
