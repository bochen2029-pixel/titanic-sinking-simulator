# R3: her openings as the deck plans write them, for S1's WINDOWS (v1)

- **Written:** 2026-11-20, about 23:28 CST, by the R3 session (Claude Opus 5.5).
- **The coordinator's word** (about 23:08): "Make the openings you read on the plans into one sourced, structured table for S1's WINDOWS, which the mainline takes up with G14: data/rooms/openings.json". It asks for:
  - deck, room, kind, clear size, count, frames, side, height above the deck where given, source and check for each row;
  - derived fields from the model's own functions;
  - suite rows for sizes, containment and counts.
- **Not touched:** `core/` and `WINDOWS`, which are the mainline's.
- **Rules:** R0 v1.1, as for the rooms. Nothing in the model changes.

## 1. What was made

| Item | What |
|---|---|
| `data/rooms/openings.json` | 129 rows on C, B, A and the Boat deck: 695 openings counted, 438 m² of clear area; 661 of them, 419 m², to the weather. With E deck added (section 7): 184 rows, 921 openings counted, 474 m²; 887 of them, 455 m², to the weather |
| Each row | a group of like openings on one side of one room or the rooms it names (rows of that deck's table). It carries: its kind (sidelight, window, door in her side, gangway door, house door, deck light); where it stands (her side, a house wall, the deck); the plan's own words; its size as printed and its shape; its count and how the count was had; its side (P, S, P&S, front, aft wall, fwd wall); its frames; for counted ones, each opening's frame (`positions`); source, check and tags |
| Derived fields, `tools/rooms_table.js --write data/rooms/openings.json` | x in metres (through its deck's table), the model's zones the span crosses (`C.zoneAt`), and the clear area of one and of all |
| `tools/rooms_table_tests.js`, four new rows | each row's fields; sizes positive and counts whole; each opening inside its deck and its rooms (within a metre of their frames, and one in her side on a room at her side, that side); the derived fields current. It prints the counts and areas per deck and side, by kind, and the groups with no count. The suite has 75 rows, PASS |

## 2. How the counts were had

- **Printed:** where the plan prints a count ("N OFF"), that count.
  - Where the printed count is plainly for both sides, half a side is a bet and is tagged so: C deck's library and entrance windows (20 and 8); B's second-class windows (26); A's lounge (12 and 8), aft entrance and corridor (20) and forward staterooms (46); the Boat deck's officers' house (26).
  - Where the plan labels each bay, the labels decide: A's verandahs carry two A and two A1 each; its smoke room, two bays a side of B, B1, B1, B. Both agree with the printed totals.
- **Counted on the page:** where the plan prints none.
  - Along her side, by pixel profile of the page at 1:1. The side's outer line is traced. A window or Utley's sidelight is a bar filling the band between the side's two lines; a round sidelight is a bump outward of the line's running median. The two doors in C deck's promenade show as their swings.
  - The counts were checked by eye where it mattered:
    - C's poop, 11 a side by both methods;
    - the forecastle's 12 in sidelights, counted by eye with the pixel count as a check;
    - the stern's curve, four a side by eye, where the line is too steep for the profile.
  - B deck's 27 OFF (staterooms amidships) is printed a side, and 27 a side were counted.
- **Not counted:** C deck's poop-front windows (2 ft 8 in by 1 ft 9 in): the plan draws them as the wall's own line, so their two rows have no count, with the reason.

## 3. What the table holds, deck by deck

**C deck** (288 openings, 88 m²)
- In her side:
  - the poop's and the stern's 14 in sidelights (15 a side; the stern's four a side are of the same drawn size [bet]);
  - the second-class promenade's 12 vertical sliding windows of 34 by 31 in a side, and its two doors in her side a side, 6 ft 0 in by 4 ft 3 in clear;
  - two 17 in sidelights a side at the promenade's forward end;
  - Utley's pivoting sidelights of 24 by 19 in along the first-class staterooms: 66 to port, 65 to starboard, from 68.5A to 74.5F;
  - the baths' and W.C.s' small round sidelights in pairs of 10 and 12 in: 7 pairs a side; the plan labels one pair, the rest are taken alike [bet];
  - three 17 in sidelights a side at the house's forward end;
  - the forecastle's 12 in sidelights: 16 to port, 15 to starboard.
- In the house walls, to the covered promenade: the library and aft entrance (pattern K, 3 ft 0 in by 21 in), the forward entrance (L, 3 ft 8 in by 25 in), the third-class entrance's 15 in circular lights.

**B deck** (171 openings, 92 m²)
- Doors in her side, one a side each: the folding-down gangway door, 10 ft 0 in clear; passenger doors of 4 ft 9 in and 4 ft 0 in.
- The house front: its 4 ft 6 in doors.
- Pattern I sliding windows (2 ft 11 in by 21 in, clear glass 2 ft 10 in by 19½ in): 27 a side amidships.
- The printed 46 forward of frame 46F: 14 a side counted from 45.5F to 69.5F, and 18 left to the house's forward end and front [bet].
- The second-class rooms' 26 windows (L).
- The Cafe Parisien's 3 (5 ft 10 in by 3 ft 5 in).
- The private promenades' 12 OFF P&S (3 ft 5 in by 23½ in), read as 12 a side (11 and 10 counted) [bet].
- The forward entrance's two a side (E).
- The smoke room's after-wall pair (5 ft 4 in by 3 ft 6 in).
- Four E windows by the recess for coats and hats, tagged as opening inside her [bet].

**A deck** (144 openings, 195 m²)

| Room | Windows |
|---|---|
| The verandahs | A and A1, 6 ft 11 in high |
| The smoke room | B and B1, 5 ft |
| The lounge | C and C1, 7 ft 5 in |
| The reading and writing room | one D (6 ft 1 in), two D1 (3 ft 8 in), one D2 (6 ft 2 in), one D3 in its forward wall (7 ft 2 in); all 7 ft 7 in high, teak framed at promenade level and brass at the raised roof |
| The aft entrance and corridor | E, 20 |
| The starboard corridor and forward entrance | E, 18 |
| The forward staterooms | F, 46 |
| The after end | H, 2 |
| The promenade's forward end | one 30 by 37 in window a side |

Doors without sizes: the verandahs' double sliding doors, the revolving doors to the promenade, the sliding doors at its forward end.

**The Boat deck** (92 openings, 62 m²)

| House | Windows |
|---|---|
| The second-class entrance | 7 E |
| The officers' mess house | 9 H, and its teak sliding doors |
| The gymnasium and forward entrance | 18 E |
| The officers' house | 26 of 22 by 37 in |
| The bridge and wheelhouse | 16 of 30 by 37 in, front to sides |

Also 14 skid lights in the deck, 8 in clear.

## 4. Limits, and bets to know

- **Sizes** are as printed, in the printed order. A rectangle's two figures multiply to its area whichever is its height. `clear` says whether the plan gives the clear opening or glass (true), the frame (false), or does not say (null). The areas are clear where given and otherwise the printed size.
- **Heights above the deck:** the plans give none, except the reading room's words on its two levels. `height_in` is null throughout.
- **Tagged "inside her":** some openings open from room to room or to the covered promenade inside her side, not to the weather; the sums give them apart.
  - C deck's house windows to the covered promenade, and its poop-front and third-class-entrance lights;
  - B deck's windows by the recess.
- **Not tabled:**
  - the openings of D and the lower decks, whose sidelights would be a later pass; E deck is in section 7, but for its bow's counts;
  - the well decks' wash and freeing ports;
  - B deck's galley windows, and the 5 ft 3 in by 2 ft 6 in windows by its forward second-class entrance (not read with confidence);
  - the Boat deck's 34 by 31 in clear glass by the bridge.
- **Not checked** against a 1911-12 original: that waits for Bo's OK to a download.

## 5. A correction to C deck's table, found with the openings

C deck's second-class covered promenade runs forward to 70A, not 74A: its two 17 in sidelights stand at 73.8A and 71.6A.

| Row | Was | Now |
|---|---|---|
| The forward second-class entrance (C-018) | to 74A | ends at 71.5A |
| A cross passage between the promenades | none | new, C-083: 71.5A to 70A |
| The staff cabins, the surgery, staterooms C 102 to C 92, and the two fore-and-aft passages | from 74A | start at 70A |
| The aft entrance hall (C-014) | to 30 ft | its walls at 24.4 ft, with the promenade's after part inboard to them (new: C-081 and C-082) |

C deck now has 83 rows, and passes.

## 7. E deck (the coordinator's optional pass, about 23:31; for G17, the ports that go under as she settles)

E deck's sidelights and doors in her side, the same way: 55 more rows; 110 openings counted to port and 116 to starboard, 36 m². All of them are to the weather.

| Stretch | What the plan writes | Count, port and starboard | How |
|---|---|---|---|
| Her stern, aft of bulkhead O (111A) | 12" SIDELIGHTS WITH SHUTTERS; 3RD CLASS PERMANENT | 12 and 12 | by eye on her stern's curve, where the profile finds only some (about one either way); starboard taken as port's [bet] |
| O (111A) to about 80A | 15" SIDELIGHTS WITH SHUTTERS (and 15" DIAMETER SIDELIGHTS by the doors) | 15 and 15 | pixel profile |
| Doors in her side at about 91.5A | STORE ENTRANCE DOOR P&S 6'-0" X 4'-6" CLEAR | 1 and 1 | printed; the swings found on both sides |
| Doors in her side at about 78.5A | DOOR P&S 8'-0" X 4'-6" CLEAR | 1 and 1 | printed; the swings found on both sides |
| About 78A to 83F, amidships | round sidelights; no size printed by them | 81 and 87 | pixel profile; about 15 in by the drawn ring, as the 15 in ones aft [bet]. A few rings 18 to 23 px across may be two run together, and are counted as one |
| About 84F to 110F | 12" SIDELIGHTS WITH SHUTTERS, a vent mark over each | not counted | drawn small with a vent mark over each; the profile finds about half of what the eye sees. A finer pass would count them |
| Forward of 110F | 10" UTLEY'S VENTILATING SIDELIGHTS WITH SHUTTERS | not counted | as the 12 in ones aft of them |

- **The rooms:** each group is put on the E table's rows at her side, that side. Where no row at her side covers a sidelight's frame (a wall, or a gap between blocks), it goes to the nearest row at her side within 2.5 m.
- **Three features left out:** door-like swings in her side at 14.5A (starboard only), 36.5F (starboard) and 85.5F (both sides). They have no label read, so they are not tabled as doors.
- **D deck is not done.** Its sidelights would be the same work: the plan's labels at its stern read 12 in (3rd class permanent). It is left for a later pass, as is a finer count of E deck's bow.

## 8. Effort, by the clock

| Work | Time (CST) |
|---|---|
| Reading and counting on the plans | 23:10 to 23:21 |
| The table, the tool, the suite and this note | 23:21 to 23:28 |
| **In all** | **18 minutes** |
| E deck's pass (section 7) | 23:31 to 23:40, 9 minutes |
