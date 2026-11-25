# R3: her openings as the deck plans write them, v1.1: D deck, and E deck's bow counted

- **Written:** 2026-11-21, 05:35 to 05:50 CST, by the B1+B2 lane (Claude Code, Opus 5.5), in the worktree
  `b1b2-strength-85bc79`. R3 rests, so the coordinator gave this pass to this lane.
- **v1 stands as written:** `RESEARCH_rooms_openings_v1_2026-11-20.md` (R3, 2026-11-20). This version does what its
  section 7 left:
  - "D deck is not done";
  - "a finer count of E deck's bow".
- **The coordinator's word** (05:3x; BACKLOG G20, its other half):
  - D deck's sidelights, and the counts at E deck's bow (84F forward, sized but not counted), into
    `data/rooms/openings.json` by R3's method, each group tagged as it was had;
  - rows in `tools/rooms_table_tests.js`;
  - this note.
  - It feeds the mainline's C4 (G11's doors and R3's WINDOWS) on `wt/epoch-c`.
- **The rules:** R0 v1.1: Encyclopedia Titanica's free plans read on the page, nothing saved, facts only. Nothing in the
  model changes.

## 1. What was made

| Item | What |
|---|---|
| D deck | 58 rows, 29 a side: 195 openings to port and 193 to starboard; 37.9 and 37.6 m² of clear area; all to the weather |
| E deck's bow | R3's four uncounted rows (O-181 to O-184) replaced by 18 counted rows, one per room as R3's counted rows are: 21 openings a side (ten 12 in, eleven 10 in) |
| The rows' ids | the new rows are O-185 to O-260; O-181 to O-184 are gone (nothing reads the table yet) |
| `tools/rooms_table_tests.js`, two new rows | a group counted opening by opening has as many positions as its count, each inside its frames, none twice (184 groups); and on each deck the sidelights and windows counted in her side agree to port and to starboard within a tenth or 3, a check of the counting: C 128/126, B 55/58, E 129/135, D 193/191. The suite has 78 rows, all PASS; its table was rewritten with the gate's `--write` |
| The whole table | 1,351 openings counted, 552 m², of which 1,317 and 533 m² are to the weather (v1 with E deck: 921 and 474 m²) |

## 2. How they were had

**R3's method** (v1, sections 2 and 7), with R3's own page helpers and D and E decks' calibrations, in the built-in
browser:
- **The profile.** Her side's outer line is traced along her, both sides. A window or Utley's sidelight shows as a bar
  filling the band between the side's two lines; a round sidelight as a ring, a bump outward of the line's running
  median; a door as its swing.
- **A finer profile at her bows** (rings of 2 px and up; R3's floor was 6 px), where the rings are drawn small on a
  curved line. On D deck it agrees with the eye; on E deck it does not (section 4).
- **The plans' words** were read by eye at 0.75 to 1:1 on the page, one view at a time. No image was saved.
- **The rooms:** each opening goes to the room of that deck's table at her side, that side, that covers its frame.
  Where no room covers it, it goes to the nearest within 2.5 m (R3's rule).
  - Four places at her bow fall in a gap between the rooms at her side, where the table has stairs or a hatch on the
    centreline: D deck 103.4F to 109.5F and 116F to 121F, E deck to starboard 104F to 108.5F.
  - A row there names the room beyond the gap as well, so that its rooms span it (R3's rows name several rooms), and
    its `serves` says why.

## 3. D deck, her side, aft to forward

The same on both sides unless the table says otherwise.

| Stretch | What the plan writes | Count, port and starboard | How |
|---|---|---|---|
| Her stern, about 148A to 126A | 12 IN. SIDELIGHTS; 3RD CLASS PERMANENT | 9 and 9 | pixel profile; on her stern's curve the rings are small, and port's were counted by eye too: 9 |
| About 125A to 94A | 15 IN. SIDELIGHTS; 2ND CLASS | 17 and 17 | pixel profile; four rings faint on one side stand where the other side's are clear, and count on both. By eye about 16 between 121A and 95A |
| About 92A to 72A (the second-class saloon) | 24 IN. X 19 IN. UTLEY'S PIVOTING SIDELIGHTS | 12 and 12 | pixel profile (bars) |
| About 71A to 65A | SINGLE OPENING LIGHT 17 IN. DIA. | 3 and 3 | pixel profile |
| About 65A to 38F (the first-class saloon, its pantries, the galley) | TOP LIGHTS 17" DIA TO OPEN, BOTTOM LIGHTS 19 3/4" DIA NOT TO OPEN; bay by bay, the top lights to hinge forward, or from the bottom | 53 and 52 positions, each a top light and a bottom light: 106 and 104 lights | pixel profile; one row for the top lights and one for the bottom, room by room. Two rings run together (23 px, at 51.5A starboard) count as two, at 52A and 51A on both sides. The sides differ by the galley's and the pantries' walls |
| About 40F to 45F (the reception room's entrance) | SHELL DOORS P & S 6'-0" X 4'-5" CLEAR OPENING; UTLEY'S VERTICAL SLIDING WINDOWS TWO EACH DOOR 20" X 12" | 2 doors and 4 windows a side | the doors by their swings, checked by eye; the windows printed, two in each door |
| About 47F to 83F | UTLEY'S PIVOTING SIDELIGHTS 24" X 19"; 1ST CLASS STATEROOMS | 19 and 19 | pixel profile (bars) |
| About 84F to 108F (the third-class open space) | round sidelights; the plan prints no size, only the arrow over the group | 12 and 12 | finer profile, every second frame; by eye 12 to port. The size is about 14 in by the drawn ring, between the 15 in ones aft and the 12 in ones forward [bet] |
| About 110F to 139F (the firemen's quarters) | 12" DIAMETER SIDELIGHTS WITH SHUTTERS | 11 and 11 | finer profile on her bow's curve; by eye about 9 between 116F and 139F to port |

**Features left as R3 would leave them:**
- **Counted as sidelights:**
  - Three bumps to starboard (26.5A, 8.5A, 5.5F) are large enough to read as swings, but port has plain sidelights
    at the same frames.
  - So does one at 96F to starboard: the third-class group's ring there, with a bump over it.

## 4. E deck's bow: the counts v1 could not make

| Stretch | What the plan writes (v1) | Count, port and starboard | How |
|---|---|---|---|
| About 84F to 110F | 12" SIDELIGHTS WITH SHUTTERS, a vent mark over each | 10 and 10 | by eye on the page at 1:1, to port; each one's frame read off the page to about a frame |
| About 111F to 138F | 10" UTLEY'S VENTILATING SIDELIGHTS WITH SHUTTERS | 11 and 11 | the same |

- **Why by eye:** both profiles miscount here. R3's finds about half (v1). A finer one finds more bumps than rings,
  because the vent mark over each and the cabin walls' ends make bumps too, and its positions wander from the rings
  the eye sees.
- **Starboard is taken as port's** [bet], as v1 took her stern's at E deck. The two sides' finer profiles give about
  the same totals (11 to 13 entries aft of 110F, 10 to 12 forward of it).
- **R3's door-like swing at 85.5F** (both sides, no label read) stays out, as v1 left it.

## 5. What it gives C4 (the mainline's WINDOWS)

- **Most of D deck's openings are small sidelights** of 12 to 17 in. Nearly half of them are in the saloon's pairs.
  - There the bottom lights (19 3/4 in) do not open: they would let the sea in only once broken.
  - The top lights (17 in) open, and the plan notes how they hinge.
- **Large openings:** the two shell doors a side at the reception room (6 ft by 4 ft 5 in clear), and the Utley's
  pivoting sidelights of the staterooms and the second-class saloon (24 by 19 in).
- **The heights over the deck** are not given by the plan (`height_note`), as on the other decks.

## 6. Sources and effort

- Encyclopedia Titanica's free deck plans, D and E decks (`titanic-deckplans/d-deck.html`, `e-deck.html`), read on
  the page in the built-in browser, nothing saved. Not checked against a 1912 original (v1's note: too small at
  1000 px).
- R3's page helpers and builder (`C:\temp\titanic-wt-r3\_r3_tools\`, untracked in R3's worktree; read, not changed).
  This pass's builder is a scratch script in this lane's scratchpad that follows R3's, with the gap rule of section 2.
- **Effort, by the clock:** 05:35 to 05:50 CST.
  - The profiles took about 6 minutes in the page.
  - The labels and the eye counts took about 4.
  - The rows, the suite and this note took about 5.
