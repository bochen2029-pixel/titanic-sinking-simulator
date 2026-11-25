# R3 pilot: E deck's rooms, read into a sourced table (v1)

- **Written:** 2026-11-20, about 20:20 CST, by the R3 pilot session (Claude Opus 5.5). Z2 ("Titanic Z2: the deep") started it on Bo's word, relayed by the coordinator: "Yes start it if you can, plenty of quota left etc".
- **Status:** a pilot. This is the report to the coordinator ("Titanic simulator model accuracy (fork)"), before any further deck is read.
- **Rules:** `docs/research/RESEARCH_rooms_plans_licence_v1_1_2026-11-20.md`, R0 v1.1, Bo's decision:
  - facts only;
  - Encyclopedia Titanica's free plans read on the page, never saved;
  - each row checked against a 1912 original where one can be reached;
  - bets marked as bets.
- **Brief:** Z2's `Z2_brief_R3_pilot_E_deck_2026-11-20_1930.md`, in the group's notes folder.

## 1. What was made

| File | What |
|---|---|
| `data/rooms/E_deck.json` | the table: 137 rows. 123 rooms or blocks of rooms; Scotland Road in 8 stretches; the starboard passage in 6 |
| `tools/rooms_table.js` | fills each row's derived fields from the model's own functions (metres, area, `C.zoneAt`, `TitanicRooms.slabAt`, the plan's compartment); draws the picture |
| `tools/rooms_table_tests.js` | the checks (section 4); its table is `out/rooms_table_tests.txt`; gate row `rooms_table` (quick, headless) |

### Each row

- **Read off the plan:** id, kind, name, the plan's own words; the outline by frames (aft, fwd) and by feet from the centreline (port +, with `shell+`/`shell-` for her side); doors (to which row or place, width, how known); source; check; tags.
- **Derived:** `x_m`, `y_m`, `poly_m`, `area_m2`, the pieces by zone and side with their slab, `zone`, `slab`, `plan_compartment`, `zone_note`.
- **Kinds:**

  | Kind | Rows |
  |---|---|
  | crew | 39 |
  | cabin | 20 |
  | service | 19 |
  | stair | 18 |
  | passage | 16 |
  | casing | 12 |
  | hatch | 6 |
  | store | 5 |
  | lift | 1 |
  | trunk | 1 |

- **Doors:** 373 named.
- **Cabins:** 44 rows are blocks. The cabin rows name 118 cabins by number.

### Decisions (the lane's own, under Bo's standing word)

1. **A JSON file in `data/rooms/`, not a module under `core/` or `site/`.**
   - The table is data: a reader (R4) or the export (U0) can load it.
   - Nothing in `dist/` moves, so the page and the gate's dist check are untouched.
   - One file a deck: `<deck>_deck.json`.
2. **Blocks.** Dense cabins and crew rooms between two passages are one row, with their numbers listed, as the brief allows. The rest are rooms on their own:
   - passages, stairs, hatches, lifts and casings;
   - the doors to the sea;
   - the labelled service rooms.
3. **Frames to metres by the plan's own scale.**
   - The scale is set by her 36 in frames amidships (0.09756 ft a pixel), from the midship section between frames 1A and 1F.
   - It needs no fit. At that scale:
     - bulkheads K to O land within 0.15 m of the model's;
     - the stem at E deck lands 0.1 m from the model's FP.
4. **Her side in metres is the model's half-breadth,** halfway between E and D decks. This is a stand-in for the plan's shell (section 3, item 5). So the rooms fit the model's slabs by construction at the side.
5. **Door widths.**
   - Where the plan writes a size, that size is used: the shell doors.
   - Ordinary doors take 2 ft 3 in, and watertight doors 3 ft. Both are bets, marked on every door.
6. **The picture is not committed.**
   - `node tools/rooms_table.js --png out/rooms_E_deck.png data/rooms/E_deck.json` draws the table's outlines on the model's own deck, its bulkheads and the plan's bulkhead marks. It is 1348 by 1440 px, in `out/`, untracked.
   - It copies no plan. A floor plan drawn from a modern redrawing's numbers is close enough to "a drawing" that it waits for the coordinator's word.
   - It has been looked at (section 4).

## 2. Method, so the next deck goes the same way

1. **Open the deck in the built-in browser.** ET's deck page is a Zoomify viewer of one 9174 by 1210 px image; full zoom is 1:1. Read it at 1:1 in two rows of views (port half, starboard half) along her length: 28 views for E deck.
2. **Measure the frames with a ruler in the page.**
   - The plan prints frame numbers every second frame along the centreline, with a tick at every frame. A scan of the page's canvas found the ticks to the pixel. The scan reads pixels in the page and keeps nothing.
   - The labels read by eye number the ticks. That gives the `frames.anchors` table: 38 anchors, stern to stem.
3. **Read the bulkheads.** The plan marks W.T.B. A, B, L, N, O and P, and W.T.D. doors in K, L, M, N and O. C to J stop under E deck and are not drawn on it.
4. **Measure the long fore-and-aft walls with the same ruler,** compartment by compartment: dark rows across a stretch, in both halves. These are the passages' walls and the cabin rows' walls, to 1.2 in.
5. **Read each room or block by eye** from the views: walls by frames to about a frame, offsets to about a foot, tagged `approx`.
6. **Check against the original.** The reachable 1911 plate is The Shipbuilder's (section 5). Its labels are compared block by block.
7. **Fill and check:** `node tools/rooms_table.js --write`, then `node tools/rooms_table_tests.js`, then the picture.

## 3. What the table adds: findings for the model (nothing in the model is changed here)

1. **Scotland Road** (rows E-SR1 to E-SR8; the record is in `docs/research/RESEARCH_lists_bunkers_scotland_road_v1_2026-11-17.md`).
   - **Its straight run** goes from the forward cross passage (82.5F) to 19A. It is 2.24 m clear between its walls and 2.63 m over them; the walls are drawn about 7.5 in thick. The record's 8 ft 6 in to 9 ft (2.59 to 2.74 m) is the over-the-walls figure.
   - **Further aft it varies** (clear widths):

     | Stretch | Clear width |
     |---|---|
     | 19A to 24A | 2.72 m |
     | jogs outboard at about 25A round the engine casing | |
     | alongside the casing, through K, to L | 1.97 m |
     | L to M, back inboard | 2.09 m |
     | M to O | 1.68 m |
     | O to P | 1.32 m |

   - **The model** carries one port path of 3.11 m (wPort 3.0 x wMul 1.036) the whole way.
2. **The starboard passage** (E-SP1 to E-SP6).
   - It is 1.49 m clear from the forward end to M. It jogs outboard abaft K, like Scotland Road, and steps inboard at M.
   - It is 1.31 to 1.34 m from M aft.
   - The model's starboard path is 2.07 m.
   - Wilding's steel door at its forward end was not found on the plan: a bet in E-SP1.
3. **Watertight doors on E deck.**
   - **The plan:** K 2; L 3 (two to port, one into the engine casing); M 2; N 2; O 1 seen.
   - **The model:** K 2, L 2, M 2, N 2, O 1.
   - Their widths are not written: 3 ft [bet].
4. **The bulkheads on E deck.**
   - **K to O** agree with the model within 0.15 m, by her frames at the plan's scale. So the model's Inquiry lengths stand there, and so does the scale.
   - **A, B and P** do not:

     | Bulkhead | Frame on the plan | Against the model's |
     |---|---|---|
     | A | 140F | 4.35 m forward |
     | B | 110F | 2.81 m aft |
     | P | 139A | 4.49 m aft |

   - By the plan's frame scale, the model's planes fall at about 133F, 114F and 133A. 133A is where the ET forum puts the after-peak bulkhead at the sterntube (`RESEARCH_screws_wash_engines_v1_2026-11-17.md`).
   - So the likely reading is steps in A, B and P above the lower decks [bet]. The model has one plane a bulkhead.
   - Ten rows straddle a model bulkhead that the plan does not (E-003, E-007 to E-010, E-106, E-107, E-111; and E-090, E-091 at M, item 6). The suite lists them.
5. **The stern.**
   - The plan's E deck ends at frame 148A, about 129.3 m abaft amidships. By the plan's scale that is the after perpendicular.
   - The model's side at E deck runs on to 138.9 m: its counter, 9.4 m from 15 m up.
   - So the model's after peak at E deck is three times the plan's, and its slab is 55 % covered by the table.
   - One of the two is about 9 m wrong at E deck. This is a number for backlog G2 ("her after body above the waterline by metres"). An original's stern frames would settle it.
6. **Bulkhead M on E deck.** The plan draws no bulkhead through the potato store and the stair beside it at 72A; M's two doors are in the passages. Either M steps round them, or the plan simplifies [bet].
7. **Openings through E deck.** The model lumps them as `aDown`, 0.28 m² a side. The plan shows these:

   | Kind | What | Rows |
   |---|---|---|
   | stairs | 18 rows of them | |
   | spiral stairs | two of the firemen's, in 6 in coamings | E-007, E-008 |
   | hatches | No. 2, the bunker hatch, No. 4 port and starboard, No. 5, No. 6 | |
   | lift | three cars | |
   | ash hoists | 2 ft 4 in holes | |
   | fidleys and casings | open to the boiler rooms below | |
   | portable plates | four "for shipping furnaces" in Scotland Road, at about 52-54F, 25-30F, 13-17F and 9-14A | |

   Each is now a place and a size to count, in place of one fitted area.
8. **Doors to the sea on E deck.**

   | Doors | Where | Size written on the plan |
   |---|---|---|
   | the forward gangway doors, port and starboard | about 84F | not written |
   | two pairs aft | about 80A, and the store entrance at 90-93A | 6 ft by 4 ft 6 in clear |
   | four ash doors | | 5 ft 6 in by 2 ft 3 in clear |
   | one door, port | about 50A | 6 ft 5 in by 3 ft |

   The plan also writes "DOOR FOR PORT USE" at about 33F, in Scotland Road; it is not interpreted here.
9. **Her frame spacing as drawn.**
   - 36 in from about 108A to about 90F.
   - Closing to about 24 in at the bow and about 27 to 28 in at the stern.
   - The hull-strength note had "where the spacing changes: NOT FOUND". The anchors table gives it, as this plan draws it.
10. **The fit.**
    - The rooms cover 55 to 100 % of each E-deck slab, and no slab is over-full: the worst is 100.3 % of its floor.
    - The 202 m² where rows overlap are blocks drawn over a hatch or a stair they list in `minus`, or two readings of one wall.

## 4. The checks (`node tools/rooms_table_tests.js`: PASS, all 8 rows)

- every row has its fields; every door names a row or a place;
- the derived fields are the model's;
- every row stands in an E-deck slab;
- no slab holds more room floor than it has, against the larger of its columns' area and her deck there;
- no room stands outside the model's side: 0.4 m²;
- Scotland Road's straight run is 2.63 m over its walls, within the record's 2.59 to 2.74 m (2.24 m clear);
- the plan's K to O fall within 0.15 m of the model's.

The picture was looked at, panel by panel:

- the rooms tile the model's deck;
- Scotland Road's course is visible: straight, then the jog, then narrowing aft;
- the plan's A, B and P marks stand apart from the model's, while K to O coincide;
- the model's hull runs on past the plan's stern.

## 5. Where the reference and an original part

- **The original reached:**
  - The Shipbuilder, Midsummer 1911, plate 4d, "Upper Deck E", the Olympic and Titanic number.
  - It is reproduced by GG Archives; its largest copy is 1000 by 129 px.
  - It agrees with the reference on everything legible at that size:

    | Agrees | |
    |---|---|
    | the forepeak store | three rooms of 24 trimmers |
    | 44 seamen | No. 2 hatch |
    | the boiler casings | saloon waiters and second-class stewards to port |
    | first-class cabins to starboard | the engine casing and the engineers' mess |
    | the potato store | the second-class entrance |
    | third class permanent to port aft | second class to starboard aft |
    | the after-peak store | |

  - Nothing on it conflicts with the reference.
- **Checked:** 28 rows, at block level.
- **Not checked:** 109 rows, "too small at 1000 px". It cannot give frames, widths or cabin numbers.
- **Not reached:** the inquiries' exhibits, and the builder's general arrangement at a legible size. A legible original would check every row, and would settle A, B, P, the stern and the passages' widths.

## 6. Effort (wall clock, this session, on the laptop, one browser tab)

By the clock (`date` and the files' times), not by feel:

| Step | Clock (CST) | Minutes |
|---|---|---|
| Brief, rules, R1, setup (own worktree `C:\temp\titanic-wt-r3`, branch `claude/r3-e-deck`, from 7f4fe28) | 19:27 to 19:33 | 6 |
| Reading the plan: calibration, the ruler, 28 views at 1:1, bulkheads, the walls by ruler | 19:33 to 19:55 | 22 |
| The 1911 original | 19:55 to 19:58 | 3 |
| Writing the 137 rows | 19:58 to 20:06 | 8 |
| Tools, checks, picture, gate row | 20:06 to 20:11 | 5 |
| This note, the leak scan, the commit | 20:11 to 20:14 | 3 |
| **Total, to the first commit** | **19:27 to 20:14** | **47** |

- **Per compartment:** about 3 minutes of session time for each of her 16 on E deck, at block level. A person at the same detail would take far longer; that was not measured.
- The first commit's message says "about 75 minutes". That was an estimate, written before the clock was read; this table replaces it.
- **Rooms one by one:** the 118 cabins and the crew rooms inside the blocks would take about three times as long, and add little until R4 needs openings room by room.

### What was hard

1. The plan's footnote marks (`*` and `**`) are not explained on the page: kept as written.
2. The big letters beside stairs and doors (B, K, M, Q) are not explained: kept, not interpreted.
3. Scotland Road's course aft of 24A, and how its stretches join at L: E-SR5 carries a bet.
4. Spaces with no label (the forward open third-class space, the cross passage): their outlines are bets.
5. The 1911 original exists, but not at a size that checks a row.

## 7. Recommendation for the coordinator

- **Value per hour is high** for passages, doors, stairs, hatches and bulkhead marks: every finding in section 3 came from them.
- **It is low for cabin-level detail** until R4 gives rooms openings.
- **Next decks, in the brainstorm's order, at the same block level:** F and G (the mail room, the squash court, the firemen's passage, the bunkers), then D. Each is under an hour of session time; E deck took 47 minutes.
- **Before R4 uses any of it,** a legible 1911-12 original should be found. It would check items 4 and 5 (A, B, P and the stern) and the passages' widths. Those are the findings that would move the model.
- **The model's own questions,** for whoever owns them (nothing changed here):
  - wPort and wStbd against the plan's 2.24 and 1.49 m;
  - the stern at E deck (G2);
  - steps in A, B and P.

## 8. Sources

| Kind | What |
|---|---|
| Reference, read | Encyclopedia Titanica, Titanic Deckplans, E Deck, https://www.encyclopedia-titanica.org/titanic-deckplans/e-deck.html (Bruce Beveridge, Titanic The Ship Magnificent, The History Press 2008), on 2026-11-20 in the built-in browser; nothing saved |
| Original, read | The Shipbuilder, Midsummer 1911, plate 4d, via GG Archives, https://www.ggarchives.com/OT/Titanic/25-ImageLibrary/TheShipbuilder-10-Design-SpecialPlates.html; nothing saved |
| Repository | `core/core.js` (BULKHEADS, deckZ, halfBreadth, zoneAt, wPort, wStbd, wMul); `core/readers/rooms.js` (R1); `RESEARCH_lists_bunkers_scotland_road_v1_2026-11-17.md` (the record's widths and doors); `RESEARCH_hull_strength_along_length_v1_2026-11-17.md` (frame spacing and numbering); `RESEARCH_screws_wash_engines_v1_2026-11-17.md` (the after-peak bulkhead at 133A) |
