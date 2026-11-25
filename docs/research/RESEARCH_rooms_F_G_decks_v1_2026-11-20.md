# R3: F and G decks' rooms, read into sourced tables (v1)

- **Written:** 2026-11-20, about 20:42 CST, by the R3 session (Claude Opus 5.5).
- **Status:** the coordinator's next step after the E-deck pilot. This is the report to the coordinator, before any further deck.
- **The coordinator's word** ("Titanic simulator model accuracy (fork)", about 20:16), on the pilot's three questions:
  1. "Yes, commit the picture. It is ours, drawn over the model's own outline from facts in our table, so it is not a redrawing of ET's. Keep it under docs/evidence/rooms/, and look at it before committing, as for any picture."
  2. "F and G decks next, as you propose: they lie below E deck, where the flooding's paths run. Same rules and the same report; come back after those two."
  3. The model's questions are routed by the coordinator: the passages' widths to the mainline, the bulkheads and the stern to the BACKLOG as findings.
- **Rules:** as for E deck: R0 v1.1, `docs/research/RESEARCH_rooms_plans_licence_v1_1_2026-11-20.md`.
- **The method** is the pilot's: `docs/research/RESEARCH_rooms_E_deck_pilot_v1_2026-11-20.md`, section 2.

## 1. What was made

| File | What |
|---|---|
| `data/rooms/F_deck.json` | 109 rows: 39 blocks; 178 cabin numbers named; 10 passages; 14 watertight-door entries |
| `data/rooms/G_deck.json` | 58 rows: 20 blocks; 95 cabin numbers named. Between bulkheads E and K, G deck is no floor: one row a boiler room (casing and side-bunker tops) and one a cross bunker |
| `docs/evidence/rooms/E_deck_outlines.png`, `F_deck_outlines.png`, `G_deck_outlines.png` | the pictures, committed on the coordinator's word. Each was looked at before the commit (section 4) |

### The tools, now for any deck

- `tools/rooms_table.js` takes the model's side and slab on the table's own deck: its half-breadth halfway between that deck and the one above, and `slabAt` on that deck. It exports `write` for patching scripts.
- `tools/rooms_table_tests.js` runs every table in `data/rooms`, top down.
  - E deck alone keeps the Scotland Road row.
  - The scale's check now passes four of K to O within 0.5 m, so that one bulkhead may step between decks; M does, on G deck.
  - With E deck it gives the same verdicts as before; only the wording moved.
- **The suite:** 22 rows, PASS. Its table is `out/rooms_table_tests.txt`.

## 2. The method, and what differed

1. **The browser pane was hidden this time,** so its screenshots came back scaled. The page was set to a 650 by 490 viewport, which gives screenshots at 1:1, and read at zoom 0.85 in two rows of views.
2. **Each deck's image has its own pixel grid.** So each table carries its own frame anchors: the frame ticks were scanned on the page and the labels read by eye.
   - F deck: 0.09734 ft a pixel.
   - G deck: 0.09735 ft a pixel.
3. **The y scale** is the breadth over the shell amidships: 943.5 px for 92.67 ft. On G deck the hull lines amidships are hidden by the bunkers' hatching, so G uses F's y scale [stated in its `how`].
4. **Long walls by ruler,** as on E: the passages alongside the engine casings, and F deck's passages aft and forward.

## 3. What the tables add: findings for the model (nothing in the model is changed)

### 3.1 The bulkheads

The plan marks all fifteen on F and G. Its positions at its own scale, against the model's:

| Bulkhead | E deck | F deck | G deck | Reading |
|---|---|---|---|---|
| A | 140F: +4.35 m | 134F: +0.49 m | 134F: +0.48 m | A steps forward 6 frames between F and E decks [read]; below E it agrees with the model |
| B | 110F: -2.81 m | 111F: -2.28 m | 111F: -2.30 m | 2.3 to 2.8 m aft of the model's on every deck read |
| C, D, E, H, J | (not on E) | within 0.21 m | within 0.21 m | agree |
| F | (not on E) | 42F: +1.11 m | 41F: +0.05 m | a frame apart between F and G decks [read: a step, or a frame misread by me] |
| G | (not on E) | 21F: -0.71 m | 22F: +0.21 m | the same |
| K, L, N, O | within 0.14 m | within 0.13 m | within 0.21 m | agree |
| M | 72A: -0.12 m | 72A: +0.07 m | 71A: +0.95 m | M steps a frame forward on G deck. The hatched bulkhead and its "W.T.B. M" label both stand at 71A there |
| P | 139A: -4.49 m | 139A: -4.17 m | 139A: -4.14 m | 4.1 to 4.5 m aft of the model's on every deck read; the model's P falls at about 133A, the forum's sterntube bulkhead |

So **B and P** are the model's two consistent differences, on all three decks. **A** steps. **F, G and M** are within a frame.

### 3.2 Watertight doors

| Deck | The plan | The model's `BULKHEADS` |
|---|---|---|
| F | C 1, D 1, F 2, H 2, J 2, M 1, N 1 seen | the same, and E 1 and G 1 as well |
| G | none seen | N 1 |

- **F deck:** the plan shows no door in E or G there, in the views read [check before use].
- **G deck:** in the views read, the plan marks no watertight door.
- The doors are listed in the tables, each at 3 ft [bet].

### 3.3 F deck's passages (clear widths, by ruler)

| Where | Clear width |
|---|---|
| alongside the reciprocating engine casing, K to L, both sides | 0.91 m |
| L to M | 1.37 to 1.40 m |
| M to O | 1.49 m |
| port, between the cabin rows, 68F to 95F | 1.22 m |

- F deck has no long working passage like Scotland Road.
- Forward, bulkheads C and D each have one door, to port.
- Abaft M the starboard passage is cut at N, with no door there.

### 3.4 Heights

The plan writes along F deck's side: "DECK DROPPED 18\" FROM FRAME 21 TO 60". F deck is 18 in lower under the Turkish bath and the swimming bath. The model's F deck is flat; noted, not used.

### 3.5 The stern

The plan's deck ends aft at about 128.2 m (F) and 129.0 m (G) abaft amidships. The model's side runs on further on each deck; the suite prints both. This is G2's after body again, now on three decks.

### 3.6 Rooms the record names, now placed

**F deck:**

| Room | Frames | Side and size |
|---|---|---|
| the swimming bath | 49.6F to 58.6F | starboard, about 30 by 14 ft |
| the Turkish bath | 21F to 42F | starboard |
| the third-class dining saloons | 13A to 21F | both sides of H, outboard of the casings at 20.2 ft |
| the third-class galley | 25A to 18.4A | |
| the third-class pantries | 18.4A to 12.3A | |
| the engineers' quarters | 30A to 53A | |
| the mail clerks | 78.6F to 81.7F | starboard |
| the squash court's gallery | 78F to 87.6F | |
| the first-class stair's flight from E deck (Wheat's) | 36.6F to 38.7F | just abaft F |

**G deck:**

| Room | Frames | Side and size |
|---|---|---|
| the post office | 78F to 88F | starboard; its stair down to the mail room at 82F to 88F. That is zone 3 of the model (No. 3 hold), as the model has it |
| the squash court | 77F to 87F | about 30 by 19 ft |
| the first-class baggage room | 88F to 95F | |
| the provision stores | M to N | |

### 3.7 The fit

| Deck | Cover of each slab | Worst slab | Overlap of rows |
|---|---|---|---|
| F | 72 to 100 % | 100.3 % | 107 m² |
| G | 92 to 101 % | 100.3 % | 166 m² |

- No slab is over-full on either deck.
- F's starboard Turkish-bath and pool region has the unread gaps, at 72 %.
- The overlaps are blocks drawn over the hatches and stairs they list in `minus`.

## 4. The checks

- **`node tools/rooms_table_tests.js`:** PASS, 22 rows, over E, F and G.
- **`node tools/gate.js --only rooms,rooms_table`:** PASS.
- **The pictures were looked at, deck by deck:**
  - the rooms tile each model deck;
  - the plan's bulkhead marks (red) stand where section 3.1 says against the model's (blue);
  - on G deck the boiler region is casings and bunker tops across her breadth;
  - the plan's ends stop short of the model's stern.
  - One fix came from looking: F deck's boiler room 4 casing had run into the Turkish bath's locker room, and was cut back to 31F.

## 5. Checked against an original

- **None of F's or G's rows** are checked against an original. The Shipbuilder's plate 5 (F, G, the orlops and the tank top) is on GG Archives as for E. It is the same small size, too small to read a row, and was not opened this time.
- **A legible 1911-12 original** is still the one thing that would check rows. It would also settle B, P and the stern on all three decks.

## 6. Effort (wall clock, by the files' times)

| Step | Clock (CST) | Minutes |
|---|---|---|
| The coordinator's word; the E picture into `docs/evidence`; the tools made general | 20:16 to 20:19 | 3 |
| F deck: calibration, 30 views, ruler; 109 rows; its checks and fixes; its picture | 20:19 to 20:33 | 14 |
| G deck: calibration, 23 views, the M check; 58 rows; its checks; its picture | 20:33 to 20:40 | 7 |
| This note, the leak scan, the commit, the report | 20:40 to about 20:48 | about 8 |

- **F deck** took about a minute a compartment. **G deck** took less, because a third of it is no floor.
- **Three decks so far:** E (47 minutes, with the tools made), F (14) and G (7).

## 7. For the coordinator

- **Findings for the BACKLOG**, beside E deck's:
  - B and P are 2.3 to 2.8 m and 4.1 to 4.5 m off on every deck read;
  - A steps 6 frames between F and E;
  - M steps a frame on G;
  - F deck is dropped 18 in from 21F to 60F;
  - the plan shows no F-deck door in E or G, and no G-deck door in N.
- **Next, if wanted:** D deck (the saloons and the third-class aft), or the orlops (the mail room, the cargo, the firemen's passage). Each is under half an hour at this level.

## 8. Sources

| Kind | What |
|---|---|
| Reference, read | Encyclopedia Titanica, Titanic Deckplans, F Deck and G Deck, https://www.encyclopedia-titanica.org/titanic-deckplans/f-deck.html and https://www.encyclopedia-titanica.org/titanic-deckplans/g-deck.html (Bruce Beveridge, Titanic The Ship Magnificent, The History Press 2008), on 2026-11-20 in the built-in browser; nothing saved |
| Repository | `core/core.js` (BULKHEADS and their doors, deckZ, halfBreadth); `core/readers/rooms.js` (R1); the E-deck pilot's note; `docs/research/RESEARCH_screws_wash_engines_v1_2026-11-17.md` (the after-peak bulkhead at 133A) |
