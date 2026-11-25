# R3: D deck and the orlop, read into sourced tables (v1)

- **Written:** 2026-11-20, about 20:54 CST, by the R3 session (Claude Opus 5.5).
- **The coordinator's word** ("Titanic simulator model accuracy (fork)", about 20:41): "Yes: read D deck, then the orlops, under the same rules, and report after both." The model's findings go to the mainline through the coordinator, so nothing in the model is changed here.
- **Rules:** as before: R0 v1.1, `docs/research/RESEARCH_rooms_plans_licence_v1_1_2026-11-20.md`.
- **The method:** the pilot's (`docs/research/RESEARCH_rooms_E_deck_pilot_v1_2026-11-20.md`, section 2), at a coarser level (section 2 here).

## 1. What was made

| File | What |
|---|---|
| `data/rooms/D_deck.json` | 55 rows: 17 blocks; 94 cabin numbers. No watertight bulkhead passes through D deck, and the plan draws none: the table's `bulkheads` is empty |
| `data/rooms/orlop_deck.json` | 34 rows: the holds' orlop forward and aft; the mail, parcel and specie rooms; the baggage rooms; the refrigerated cargo and provision stores. Where the orlop is no floor (the boiler and engine rooms, D to M), one row a room or cross bunker |
| `docs/evidence/rooms/D_deck_outlines.png`, `orlop_deck_outlines.png` | the pictures, each looked at before the commit |
| `tools/rooms_table_tests.js` | now maps the orlop to R1's `below G` slab (R1 cuts the space below G deck as one slab). All five tables: 35 rows, PASS. Its table is `out/rooms_table_tests.txt` |

## 2. How these two were read, and why coarser

- **The browser pane was hidden** while these were read. Its screenshots came back at changing scales (1:1, 0.78, 2x), so pixel positions read off a screenshot were not trusted.
- **Instead:**
  1. Walls were placed by the frame numbers the plan prints beside them, to about two frames on D deck and two or three on the orlop.
  2. D deck's long walls were measured with the ruler in the page, which does not depend on the screenshot.
  3. Frames go to feet through E deck's anchors, since her frames are the same on every deck. Each table states this in its `how`.
- **Every row is tagged `approx`.** D deck's big rooms read well at this level; its cabins are blocks.

## 3. What the tables add: findings for the model (nothing in the model is changed)

### 3.1 Bulkhead B steps aft as it rises

| Where | B's frame | Against the model's |
|---|---|---|
| orlop | 114F | +0.17 m: the model's own, its Inquiry length |
| G and F decks | 111F | -2.3 m |
| E deck | 110F | -2.8 m |

So the model's B is right low in the ship. The forward hold's upper part is 2.3 to 2.8 m longer than the model's.

### 3.2 Bulkhead A

| Where | A's frame | Against the model's |
|---|---|---|
| orlop, G and F decks | 134F | about +0.5 m |
| E deck | 140F | +4.4 m |

A steps forward above F deck.

### 3.3 Bulkhead P

P stands at 139A on every deck read: the orlop, G, F and E. That is 4.1 to 4.5 m aft of the model's.

- It is not a step between these decks: if the model's P (the Inquiry's 814 ft, about 133A on these frames) holds anywhere, it is below the orlop, at the sterntube (the ET forum's 133A).
- Unresolved here.

### 3.4 The rest

- **C, D, N and O** on the orlop agree with the model within 0.35 m.
- **M** reads about 71A on the orlop, as on G deck. That is a frame forward of E and F decks [bet: within the reading's 2 to 3 frames].
- **The orlop's watertight door:** the plan marks one, in N. The model's `BULKHEADS` gives N a door at its lowest level ('low'), so the two may be the same door [not checked].

### 3.5 Rooms the record names, now placed

**On the orlop:**

| Room | Frames | Side |
|---|---|---|
| the mail room | 78F to 95F | starboard, under the post office on G deck, with its stair |
| the parcel room | 86F to 89F | |
| the specie room | 92F to 95F | |
| the first and second class baggage rooms | 78F to 95F | port |
| the cargo hold for motor cars | 95F to 114F | (No. 2 hold) |
| the refrigerated cargo spaces | 93A to 111A | |
| the provision stores | M to N | |
| the wine, spirits and champagne stores, and the west-bound beef | forward of M | |

These are the mail room and holds of the record's flooding, now with places.

**On D deck:**

| Room | Frames |
|---|---|
| the third-class open space and bar | 82.5F to 103F |
| the first-class staterooms D 1 to D 50 | 48F to 82.5F |
| the first-class entrances from the gangway doors | 43F to 48F |
| the reception room | 29F to 43F, round the grand staircase and the lifts |
| the first-class dining saloon | 24A to 29F [its after end within 3 frames] |
| the galley and pantries | 24A to 47A |
| the hospital, the bake house, the butcher's | 47A to 67A |
| the second-class dining saloon | 67A to 93A |
| the second-class cabins | 93A to 111A |
| the third-class entrance aft | 120A to 130A |

- **D deck's door to the sea:** the plan writes one starboard door, "6'-10\" X 4'-6\" CLEAR OPENING", by the open space.
- **The first-class gangway doors** at the D-deck entrances are drawn, but their size is not written.

### 3.6 The fit

| Deck | Cover of each slab | Worst slab | Notes |
|---|---|---|---|
| D | 75 to 100 % | 100.1 % | 442 m² of overlap, the coarse blocks over their stairs and hatches |
| orlop | 91 to 101 % | 100.3 % | its rooms fill R1's `below G` slab, since the boiler and engine rooms are rows too |

No slab is over-full on either deck.

### 3.7 The stern

- At D deck the plan reaches about 433 ft abaft amidships, which is 8 ft further aft than E deck, on the counter.
- At the orlop the plan and the model end together near the after perpendicular: the model's counter starts above the orlop.

## 4. The checks

- **`node tools/rooms_table_tests.js`:** PASS, 35 rows, over D, E, F, G and the orlop.
- **The pictures were looked at:**
  - D deck's blocks tile its deck, with the unread gaps white.
  - On the orlop, B' falls on B, while P' stands 4.5 m aft.

## 5. Checked against an original

None of these rows. The Shipbuilder's plates 4c and 5 are the same 1000 px copies, and were not opened this time.

## 6. Effort (wall clock, by the files' times)

| Step | Clock (CST) | Minutes |
|---|---|---|
| D deck: the page, frame ticks, overviews at 0.5, the centreline pass at 0.85, the ruler; 55 rows; checks; picture | 20:42 to 20:49 | 7 |
| The orlop: the page, overviews; 34 rows; the suite's slab mapping; checks; picture | 20:49 to 20:52 | 3 |
| This note, the leak scan, the commit, the report | 20:52 to about 20:56 | about 4 |

These two were read at block level, coarser than E, F and G. That, not the decks, is why they were fast.

## 7. For the coordinator

- **Findings to route:**
  - B steps (orlop 114F; F and G 111F; E 110F);
  - A steps (F, G and the orlop 134F; E 140F);
  - P is 4.1 to 4.5 m aft of the model's on all four decks read;
  - the orlop's door in N;
  - D deck's starboard door, 6 ft 10 in by 4 ft 6 in.
- **What stands now:** five tables, D to the orlop, 393 rows (E 137, F 109, G 58, D 55, the orlop 34). Each is at block level, with its passages, stairs, hatches, doors and casings.
- **Next, if wanted:**
  - C deck and up (the tiers, S1's windows), or the tank top;
  - or a second, finer pass on D deck;
  - or a legible 1911-12 original to check the findings in section 3.

## 8. Sources

| Kind | What |
|---|---|
| Reference, read | Encyclopedia Titanica, Titanic Deckplans, D Deck and Orlop Deck, https://www.encyclopedia-titanica.org/titanic-deckplans/d-deck.html and https://www.encyclopedia-titanica.org/titanic-deckplans/orlop-deck.html (Bruce Beveridge, Titanic The Ship Magnificent, The History Press 2008), on 2026-11-20 in the built-in browser; nothing saved |
| Repository | `core/core.js` (BULKHEADS with their tops and doors, deckZ with the orlop, halfBreadth, xAft); `core/readers/rooms.js` (R1's slabs); the E, F and G notes |
