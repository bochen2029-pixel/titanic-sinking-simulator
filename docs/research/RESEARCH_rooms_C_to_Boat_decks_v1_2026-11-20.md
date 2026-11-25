# R3: C, B, A and the Boat deck, read into sourced tables (v1)

- **Written:** 2026-11-20, about 21:52 CST, by the R3 session (Claude Opus 5.5).
- **The coordinator's word** ("Titanic simulator model accuracy (fork)", about 20:55): "Go on with C, B, A and the Boat deck, under the same rules, then send one final report with every finding." Also: placing walls by the printed frame numbers when the pane's scale shifted was "the right fallback. Note it per row." Nothing in the model is changed here; the findings go to the mainline through the coordinator.
- **Rules:** R0 v1.1, `docs/research/RESEARCH_rooms_plans_licence_v1_1_2026-11-20.md`, as for the first five decks.
- **Earlier notes:** E deck `RESEARCH_rooms_E_deck_pilot_v1_2026-11-20.md`; F and G `RESEARCH_rooms_F_G_decks_v1_2026-11-20.md`; D and the orlop `RESEARCH_rooms_D_orlop_decks_v1_2026-11-20.md`.

## 1. What was made

| File | What |
|---|---|
| `data/rooms/C_deck.json` | 80 rows, 135 cabin numbers: the steering engine room and third-class rooms under the poop; the second-class library, entrances and covered promenade; the first-class staterooms C 1 to C 148 in blocks; the casings, the staircases, the purser's and enquiry offices; the crew's spaces under the forecastle |
| `data/rooms/B_deck.json` | 36 rows, 95 cabin numbers: the second-class smoke room, entrances and promenade; the a la carte restaurant, its galley and reception room; the Cafe Parisien; the staterooms B 1 to B 102 and the two suites with private promenades; the casings and the grand staircase |
| `data/rooms/A_deck.json` | 48 rows: the verandahs and palm courts, the smoke room, the lounge, the reading and writing room, the two first-class entrances, the corridors, the staterooms A 1 to A 37, and the promenade as strips beside each part of the house |
| `data/rooms/Boat_deck.json` | 12 rows: the houses only (the second-class entrance, the house over the smoke room, the engine casing's house, the officers' mess house, the second funnel's house, the gymnasium, the forward entrance, the officers' house in three, the wheelhouse) |
| `docs/evidence/rooms/{C,B,A,Boat}_deck_outlines.png` | the pictures, each looked at before the commit. They now shade pale blue where the model has no space on that deck |
| the five earlier tables | each row now carries a `placed: ...` tag saying how its walls were placed (the coordinator's word) |
| `tools/rooms_table.js` | `shellAt` for the Boat deck (her side 1.2 m over it); `spaceAt(x, y, deck)`: whether the model has a space standing on that deck there (`C.tierTop` more than 0.3 m over it); the picture's pale-blue shading |
| `tools/rooms_table_tests.js` | two changes, below. All nine tables: 68 rows, PASS. Its table is `out/rooms_table_tests.txt` |

**The two changes to the suite:**

1. **The fit check's deck is counted on the rooms' own grid.** C deck's rooms cover whole compartments wall to wall, and the old bound (an integral of her half-breadth) came out up to 0.6 % under the grid's count of the same deck, at the zones' ends. That failed a full deck for rounding alone. The deck is now the grid's cells inside her side where the model has a space of that deck. The five earlier tables still pass, worst slab 100.0 %.
2. **A new row: the rooms against the model's own spaces on the deck.** On C deck the model has none in the wells; above B deck, only its tiers and houses (`C.TIER`).
   - A row more than half outside them must be tagged `beyond the model`: it stays in the table as a fact of the plan, and is named as a finding.
   - Every row with a square metre or more outside is printed.
   - Tagged rows are also left out of the slab check, which they cannot pass.

## 2. How these four were read

- **The scale.** Each plan's scale was found from its own frame ticks along the centreline: 30.8 to 30.85 px a frame amidships, which is E deck's 0.0975 ft a pixel. The midship section was placed by the printed frame numbers either side of it.
- **A ruler of her frames** (E deck's anchors) was then drawn over the page in the browser, at that scale. The plan's own printed frames fall on it within a few inches: at 140A, 1F and 140F on C deck; at 140A and 140F on B; at 80A and 76A on A; at 2 to 10 either side of amidships on the Boat deck.
- **Walls** were read against that ruler, at 1:2 or 3:4 (to about a frame) and at 1:1 (to about half a frame).
- **Pixel profiles at 1:1** measured these, to a pixel; those rows are tagged `profiled`:
  - the long walls: the passages, and the houses' sides;
  - the poop front, the houses' two ends and the forecastle's after wall.
- **The pane's changing scale** did not matter this time: positions came from the page itself, not from screenshot pixels. Each row's `placed:` tag says how.
- **Block level, as on D deck:** a row is a block of rooms between passages (its cabin numbers in `plan`), a public room, a casing, a stair or a crew space. The well decks, the forecastle and poop decks (B level), the open navigating bridge, the domes and the raised roofs have no rows: they are open deck or roofs, not rooms.
- **Every row** is tagged `approx` and "not checked against an original": the Shipbuilder's plates are too small to read a room.

## 3. Findings for the model (nothing in the model is changed)

### 3.1 The model's side at C deck is narrower than the plan's at both ends

The plan's half-breadth at C deck was read by pixel profile; the model's is `halfBreadth` halfway between C and B decks.

| Frame | x (m) | Plan (ft) | Model (ft) | Model less plan (m) |
|---|---|---|---|---|
| 150A | -130.6 | 31.1 | 11.2 | -6.08 |
| 140A | -123.8 | 35.7 | 18.8 | -5.15 |
| 130A | -116.8 | 38.5 | 25.3 | -4.01 |
| 120A | -108.9 | 42.8 | 31.3 | -3.49 |
| 100A | -91.3 | 43.6 | 40.4 | -0.99 |
| 80A | -72.9 | 45.6 | 44.8 | -0.25 |
| 110F | 99.0 | 36.3 | 27.9 | -2.57 |
| 120F | 106.4 | 31.0 | 22.6 | -2.55 |
| 130F | 113.4 | 24.4 | 16.9 | -2.27 |
| 140F | 119.9 | 16.2 | 11.0 | -1.58 |

- The model's hull above the waterline is fine at the ends, and the plan's C deck is full: under the poop by 3.5 to 6 m a side, under the forecastle by 1.6 to 2.6 m.
- Amidships they agree.
- So the space the model gives the poop and the forecastle at C deck, and their buoyancy while dry, is short.
- The drawn shell (`TS.hullDraw`, topsides) already takes the plan's round stern above the waterline; the model's own hull does not.
- Two rooms under the poop stand wholly outside the model's side: the store and the deck engineer's cabin at 140A to 138A, out to 35 ft where the model's side is at 19 ft. They are tagged `beyond the model`.
- **Not done:** the same comparison on E and D decks, where the rows use the model's side too.

### 3.2 The well decks and the house ends

All against `G.wellFwd` and `G.wellAft`, `TIER.B` and `TIER.A`.

| What | Plan | Model | Difference |
|---|---|---|---|
| C deck: the poop front (end of the enclosure under the poop) | 117A, -106.37 m | aft well from -106.0 m | 0.37 m |
| C deck: the bridge-deck house's after wall | 98A, -89.42 m | aft well to -90.8 m | the house is 1.4 m shorter aft |
| C deck: the second-class stair house and two deck stores, standing in the aft well | to 103A, -94.04 m | well | 3.2 m into the model's well (rows tagged `beyond the model`) |
| C deck: the house front | 83F, 75.63 m | fwd well from 76.9 m | 1.3 m |
| C deck: the forecastle's after wall | 101F, 91.64 m | fwd well to 92.0 m | 0.4 m |
| B deck: the enclosed house's after end (the second-class smoke room's after wall) | 92A, -83.89 m | `TIER.B` from -90.8 m, full breadth | 6.9 m |
| B deck: the deck's after edge, open aft of the house | 103A on the centreline, 99A at the sides (-90.3 m) | the same tier | the second-class entrance house, bar and lavatory stand on this open deck |
| B deck: the house front | 80F, 72.89 m | `TIER.B` to 76.9 m | 4.0 m |
| B deck: the deck's forward edge, open before the house | 83F, 75.63 m | the same | 1.3 m |
| A deck: the deck | 88.5A to 80F (-80.68 to 72.89 m) | `TIER.A` -77.8 to 72.6 m | 2.9 m aft; 0.3 m forward |
| A deck: the house | 84.4A to 76.7F (-76.95 to 69.87 m) | the same | 0.85 m aft; 2.7 m forward |

- **On B deck the model's tier is longer than the plan's house** at both ends. The model counts as enclosed, full breadth:
  - 6.9 m of open deck aft;
  - 4.0 m (house) or 1.3 m (deck) forward.
- **In the suite**, B deck's rooms cover 33 % of the model's B tier in zone 3 (forward) and 53 % in zone 13 (aft), against 98 to 100 % elsewhere.
- **The second-class promenade on B deck** (99A to 74.5A, between the house at 31.2 ft and her side) has 13 in waterways, the drainage of an open deck. The model's B tier counts it as enclosed, full breadth.

### 3.3 A deck's house against `TIER.houseA` (9.6 m, 31.5 ft, aft of the screen)

| Part of the house | Plan | Against the model |
|---|---|---|
| Smoke room and lounge | about 31 to 32 ft a side (bays to 32 ft) | agree |
| Verandahs and palm courts (80.9A to 72.5A) | out to 36.0 ft | 4.5 ft wider: 10.8 m² each outside the model |
| Staterooms A 36 and A 37 | out to 33 ft | wider |
| Between the aft entrance and the lounge (39A to 24.5A) | only 16.1 ft to port and 19.8 ft to starboard, with the promenade inboard of the model's house | the model counts space where the plan has open promenade; its A tier there is 78 to 81 % covered on the starboard side (zones 9 and 10) |
| Port, forward of the reading room (19F to 28.5F) | open: the house is only the casing, at 9.9 ft | |

- **The screen:** the plan draws the promenade alike fore and aft and marks no glazed screen. The model's screen at 14.1 m (15.9F) cannot be checked against this plan.
- **The promenade aft of the screen** is outside the model's space, as the model means: 10 strips, 672 m², tagged `beyond the model`.

### 3.4 The Boat deck's houses against `TIER.houses`

| House | Plan | Model | Note |
|---|---|---|---|
| Second-class entrance | -74.31 to -66.11 m; +3.3 / -3.0 m | -72.2 to -65.3 m; 2.8 m | starts 2.1 m further aft; 0.5 m wider |
| Engine casing's house (tank rooms, engineers' smoke room) | -35.81 to -27.55 m; +6.9 / -6.9 m | -35.0 to -26.6 m; 6.9 m | 0.8 to 1.0 m further aft |
| **Officers' mess house** (the mess, pantry, tank rooms, deck chairs, the casing of Nos 1 and 2) | -25.72 to -13.30 m; -6.0 to +5.7 m | **none** | about 12.4 m by 11.7 m the model leaves out. Tagged `beyond the model` |
| Second funnel's house (casing of Nos 3 and 4) | 11.43 to 26.1 m; ±3.0 m | 11.9 to 26.3 m; 5.8 m centred | |
| Gymnasium | 11.43 to 26.57 m, to starboard, -8.66 to -3.29 m | the same 5.8 m centred house [its bet] | 54 % of the gymnasium outside the model's house. Tagged |
| Forward first-class entrance | 26.57 to 35.82 m; -8.35 to +8.96 m | 26.3 to 36.0 m; 8.6 m | agree |
| Officers' house | 35.82 to 64.56 m; -5.97 to +6.89 m | 36.0 to 64.8 m; 6.9 m | agree |
| Wheelhouse | 64.56 to 66.94 m; ±2.4 m | 64.8 to 67.8 m; 2.95 m | the model's runs 0.9 m into the open bridge |

The raised roofs over the smoke room and the lounge, about a metre over the deck, are houses 1.0 m high in the model. On the plan they are roofs with domes and skylights, with no rooms in them; this table has no rows there.

### 3.5 Openings in her side and her houses that the plans write

These are for the model's `WINDOWS` and its doors; none is in the model as such.

**C deck**

| Where | What the plan writes |
|---|---|
| The second-class covered promenade | two doors in her side each side, 6 ft 0 in by 4 ft 3 in clear opening, at about 85A and 83A; vertical sliding windows of 34 by 31 in along it |
| The poop front | teak windows that open, 2 ft 8 in by 1 ft 9 in |
| Her side | sidelights of 12 in (forecastle), 14 in (poop), 17 in and Utley's pivoting sidelights 24 by 19 in (the first-class staterooms) |

**B deck**

| Where | What the plan writes |
|---|---|
| The second-class promenade | in her side each side, a folding-down gangway door 10 ft 0 in clear (about 94A), and passenger doors of 4 ft 9 in (about 82A) and 4 ft 0 in (about 78A) |
| The house front | doors of 4 ft 6 in P&S |
| The forward staterooms | 46 sliding windows, 2 ft 11 in by 21 in (clear glass 2 ft 10 in by 19 in), from the front to frame 46F |
| The second-class smoke room and entrances | 26 windows, 3 ft 8 in by 25 in |
| The Cafe Parisien | windows 5 ft 10 in by 3 ft 5 in |
| The private promenades | 12 windows, 3 ft 5 in by 23½ in |

**A deck**

| Where | What the plan writes |
|---|---|
| The verandahs | eight bronze-framed windows each, 6 ft 11 in by 4 ft 4 in and by 3 ft 8 in |
| The smoke room | 8 windows of 5 ft by 4 ft 4 in and 8 of 5 ft by 4 ft |
| The lounge | 12 windows of 7 ft 5 in by 3 ft 6 in and 8 of 7 ft 5 in by 27 in |
| The reading and writing room | 7 ft 7 in high, 3 ft 8 in to 8 ft 1 in wide |
| The entrances and corridors | 5 ft 4 in by 30 in: 20 aft, 18 forward |
| The forward staterooms | 46 windows, 3 ft 6 in by 27 in |

**The Boat deck**

| Where | What the plan writes |
|---|---|
| The officers' house | 26 windows, 22 by 37 in |
| The bridge and wheelhouse | 16 windows, 30 by 37 in |
| The gymnasium and the entrance | 18 windows, 5 ft 4 in by 30 in |
| The second-class entrance | 7 windows, 5 ft 4 in by 30 in |
| The officers' mess | 9 windows, 3 ft 6 in by 24 in |

### 3.6 Passages

| Deck | Where | Between its walls |
|---|---|---|
| C | the two fore-and-aft passages, aft of the forward entrance | 5.1 ft (1.55 m) |
| C | forward of the entrance | 4.7 ft (1.43 m) |
| B | aft of the entrance | 4.85 ft (1.48 m) |
| B | forward of it | 4.75 ft (1.45 m) |
| A | the forward staterooms' passages | 4.7 ft (1.43 m) |
| A | the port corridor aft | 6.2 ft |
| A | the starboard corridor forward | 9.9 ft |

### 3.7 Small things

- No watertight bulkhead is marked on C deck, at the bow included: a thin line across the windlass room at about 138.5F is not marked watertight.
- B deck's plan prints "NOS 3 & 4 BOILER CASING" twice: at 23A to 13A and at 15F to 26F. C and A decks' plans have Nos 1 and 2 at the after one, so the first is likely a label slip on the reference.
- The second class had a lift. The plan draws it on A deck and the Boat deck, in the second-class stair, at about 77A.

## 4. Effort, by the clock (CST)

| Deck | Time | Minutes |
|---|---|---|
| C deck | 20:58 to 21:30 | 32 |
| B deck | 21:30 to 21:38 | 8 |
| A deck | 21:38 to 21:44 | 6 |
| The Boat deck | 21:44 to 21:48 | 4 |
| The note, scan and commit | 21:48 on | |

- C deck's 32 minutes include the four tool changes, the suite's two changes and the side comparison.
- The ruler drawn over the page is what made B, A and the Boat deck fast. Each deck then needs:
  1. three to five screenshots at 1:2;
  2. a handful of pixel profiles;
  3. one rows file.

**In all:** nine tables, 569 rows. Each earlier deck's effort is in its own note.

## 5. Not checked

No row of these four decks. The 1911-12 plates reachable are too small to read a room. A legible original would check:
- the house ends (section 3.2);
- the officers' mess house (section 3.4);
- the round stern at C deck (section 3.1).
