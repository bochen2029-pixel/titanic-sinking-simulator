# W6's bunker of the fire: its burst head, from its structure and the record (research note v1)

- **Written:** 2026-11-21, 04:34 to 05:14 CST, by the B1+B2 lane (Claude Code, Opus 5.5), in the worktree
  `b1b2-strength-85bc79`, on main `5e4d3cd` (join 7) plus this branch's D76 (b), inert here.
- **The ask** (the coordinator, 04:3x). The mainline's Morris screen (e103, `wt/epoch-a` `394db47`) puts W6's burst
  head second only to the opening, the largest unsourced lever in the model: across 9 to 17 m it moves the founder by
  35 min and her change of side to port by 56 min. A research note, with a first-order calculation, docs only:
  1. the bunker's bulkhead as built (plating, stiffeners, spacing; the watertight bulkhead E itself, or a lighter
     bunker bulkhead);
  2. the head at which that plating and its stiffeners yield or tear, as a range with its assumptions;
  3. what the record says of the bunker's collapse;
  4. which range the history match should sample, each end with its source.
- **The model** (`core/core.js`, W6): the pocket is the empty starboard half of boiler room 5's forward bunker, from
  bulkhead E aft 9 ft, from the tank top to G deck, from the centreline to the shell (260 m3). The hull's openings
  inside it fill it. It leaks to the stokehold through its door (`bunkerLeak` 0.005 m2) and gives way when the head of
  its own water over its floor reaches `bunkerBurst`, 13.0 m [bet: "the head the 1912 damage puts on it at T 60"].
- **What it rests on:**
  - the 1912 inquiries' transcripts and the British Report (public domain), read for this note;
  - the repository's earlier notes on the bunker and boiler room 5: `RESEARCH_lists_bunkers_scotland_road_v1`,
    `RESEARCH_pumps_bilge_ballast_v1`, `RESEARCH_br5_damage_extent_G6_v1`, `RESEARCH_room_by_room_flooding_record_v1`,
    and W6's design v1.3;
  - **e104** (this note's): `docs/research/experiments/e104_bunker_burst_head.js` and its output,
    `results_2026-11-21/e104_bunker_burst_head.txt`. It runs in about 13 s and changes nothing;
  - abacus (certified arithmetic) for the key figures, its receipts cited where used.

## The answers

1. **As built.** The wall that gave way was the bunker's after wall, facing the stokehold: one of "a number of
   non-watertight bulkheads forming the cross bunker ends", with its coal door at the stokehold level (The Shipbuilder,
   1911).
   - It was not bulkhead E. "The watertight bulkheads dividing the boiler rooms being placed at the centre of the
     cross bunkers" (The Shipbuilder; Barrett, BI 2067), bulkhead E is the bunker's forward wall. Barrett's "dinged"
     plating is bulkhead E's, from the fire (BI 2304-2307).
   - The end wall's own plating, stiffeners and door are in no open source. The yard's scantling drawings of the
     bunkers are listed by National Museums NI, not online.
   - The period's rule for such a wall (Lloyd's 1911-12, section 22, par. 12): plating at least .30 in; stiffeners an
     inch shallower than a watertight bulkhead's (bulb angles about 9 1/2 x 3 1/2 x .56 in at this height), up to two
     frame spaces apart, heels on double-riveted lugs.
   - Her watertight bulkheads were far heavier: 0.56 in at the tank top, stiffeners at about 30 in, 75 to 100 % over
     Lloyd's (Wilding).
2. **The head at which it fails** (e104, mild steel at 262 MPa), in metres of water over the bunker's floor:
   - **the wall**, built to that rule, from the floor to G deck, its stiffeners in plastic collapse: **4.5 to 6.0 m**
     (stiffeners at two frames or at every frame). Stiffened as far over the rule as her bulkheads were, 7.9 to 8.5 m
     [bet]. Its lugs' rivets hold, and its plating is not the weak part;
   - **the coal door**, a plate between its guides, in plastic bending: from 4.5 m to over 40 m, since a door goes as
     t²/b² and both dimensions are unknown. 6.6 m at 1/4 in over 24 in, 13.6 m at 3/8 in over 24 in (both certified by
     abacus);
   - **the Report has the door the weaker**, so the burst head is at most the wall's: **4.5 to 8.5 m**;
   - **13 m lies above any bunker wall.** It falls between a watertight bulkhead at Lloyd's minimum (10.9 m, bracketed)
     and her own bulkheads (16 to 18 m).
3. **The record.**
   - The bunker held, then let go all at once: "a rush of water came through the pass" (BI 2038), "a wave of green foam
     come tearing through between the boilers" (US, Day 18). It did not come over the top (BI 2056). Before that its
     leak was "a stream about the size of a deck hose" (the Report; BI 2255), and boiler room 5's plates stayed dry
     with its pumps on (BI 2109).
   - The time: "about an hour after the collision" (the Report; T 60), consistent with Barrett's own sequence (BI 2053);
     or 1:10 as counsel put it to him (BI 2349; T 90).
   - Barrett did not see what gave way (BI 2328). The Report infers the door, "weaker than the bunker bulkhead",
     burst once the water "rose high enough".
4. **The range.** The burst head and the bunker's fill are one lever (section 4).
   - The model fills its bunker in 10 minutes through 0.085 m2, at about 12 times the record's hose. From then its head
     is the sea's, and only 13.2 to 14.3 m places the burst in the record's T 60 to 90.
   - e103's 9 to 17 m spans T 10 to T 158.
   - With the record's own fill, a hose into the bunker, T 60 to 90 asks only 3.5 to 8 m. That is what a bunker end wall
     could bear, at 4.5 to 8.5 m.
   - **Recommended:** sample the head over 3.5 to 14.3 m jointly with the bunker's own opening (0.003 to 0.085 m2), and
     let the ledger's rush row and dry-plates row decide. Failing that, 13.2 to 14.3 m at today's fill, labelled as the
     model's need, not a strength.
   - **Also found:** on join 7 Barrett's 1:10 is within a head's reach (14.2 to 14.3 m). W6's comment from e76
     ("out of a head's reach") is stale.

## 1. The bunker's wall as built

Read for this note by a research agent (public sources only), checked against the repository's notes. The Shipbuilder's
three sentences below were checked word for word in a browser at 05:1x.

**What the bunker was:**
- **Cross bunkers.** The 'tween deck bunkers "on each side of the ship between the lower and middle decks" fed "the
  cross bunkers extending the full width of the vessel in each boiler room" (The Shipbuilder 1911, "Propelling
  Machinery: Bunker Arrangements", https://www.encyclopedia-titanica.org/the-propelling-machinery.html) [read].
- **The doors and the bulkhead:**
  - "The stokers obtain the coal from doors in the cross bunker end bulkheads at the stokehold level immediately
    opposite the furnaces" (the same) [read].
  - "No watertight doors are required in the bunker ends, as each set of boilers has the necessary coal supply provided
    in the same watertight compartment, the watertight bulkheads dividing the boiler rooms being placed at the centre of
    the cross bunkers" (the same) [read].
- **The end walls:** "The transverse strength is also maintained by the watertight bulkheads, of which there are
  fifteen in all, and a number of non-watertight bulkheads forming the cross bunker ends" (The Shipbuilder 1911,
  "Building of the Hulls: Structural Design", https://www.encyclopedia-titanica.org/building-of-the-hulls.html) [read].
- **Bulkhead E runs through the middle of the cross bunker.** Barrett says the same: a watertight compartment runs
  through the centre of the bunker (BI 2067) [read].
  - So the bunker of the fire (W) is the cross bunker's after part, in boiler room 5, and bulkhead E is its forward
    wall.
  - Counsel described bulkhead E as not running fair across the ship, with an angle running back for the bunker (near
    BI 20627) [read].
- **The wall that let go** was not bulkhead E but the bunker's after wall, facing the stokehold: a non-watertight end
  bulkhead with its coal door at the stokehold plates.
  - Barrett's "dinged" plating is bulkhead E's, from the fire (BI 2304-2307).
- **The division into halves.**
  - Counsel, reading from the plan: "a coal bunker on the starboard side and another on the port side", with the
    watertight passage between them (BI 2100-2102) [read].
  - The passage runs about 9 ft through the bunker (the Report, "Watertight Compartments",
    https://www.titanicinquiry.org/BOTInq/BOTReport/botRepWC.php) [read]. It is "only just the height of the
    watertight door" (Wilding, BI 20676) [read], and offset to starboard (Payne, Encyclopedia Titanica, after
    Beveridge's redrawings of the yard's plans) [secondary].
  - Whether a wall divides the halves above the passage: NOT FOUND. Above the door's height the halves may be one
    bunker, the port half full of coal.
- **Its height:** the tank top to G deck.
  - The side bunkers lay "between the lower and middle decks" (G to F), and The Shipbuilder's Plate VI labels the
    cross bunkers' coal below the G deck line [read; the scan too coarse to measure]. The model takes the same.
- **Her frames** were 3 ft apart amidships, with web frames 30 in deep at every third frame in the boiler rooms; the
  double bottom 5 ft 3 in deep (The Shipbuilder, "Structural Design") [read].

**Its scantlings: NOT FOUND in any open source.** Nothing gives the end wall's plating, stiffeners, spacing or end
connections, nor the coal door's size, kind or fastening.
- The yard's own drawings exist. National Museums NI's index of the digitised Olympic and Titanic plans lists
  HOYFM.2010.73.143 "Coal bunkers forward" and HOYFM.2010.73.60 "Bunker plan / bunkers aft" as scantling drawings, not
  online (https://cms.nationalmuseumsni.org/sites/default/files/2022-09/Digitised-Olympic-and-Titanic-Ship-Plans.pdf)
  [read: the index].

**The period's rule** (Lloyd's Register, Rules for the Construction and Classification of Steel Vessels, 1911-12,
https://archive.org/details/HECRAR1912; the same rows in the 1909-10 and 1913-14 editions) [read from the page images]:
- **Section 22, paragraph 12 (p. 40)**, the one rule for "straight bunker sides or casings" (where beams rest on them
  instead of pillars):
  - plating not less than .30 in;
  - stiffeners no more than two frame spaces apart, and one inch shallower than a middle-line bulkhead's (Table 10,
    from the inner bottom to the lowest deck);
  - heels fixed to the inner bottom by double-riveted lugs, heads riveted to the beams.
- **Table 10** (pp. 180-184, footnotes dated 16 June 1910), for a bulkhead 24 to 26 ft deep and a stiffener span of 25
  to 26 ft (the bunker's 7.81 m is 25.6 ft):
  - plating .34 in at the floor and .30 at the top;
  - stiffeners 30 in apart: bulb angles 10 1/2 x 3 1/2 x .56 in, channels 10 x 3 1/2 x 3 1/2 x .48, or flanged plates
    14 x 4;
  - bracketed at heads and heels (section 19, par. 7).
- **No rule for coal doors** in these editions.
- The 1891 Bulkheads Committee (read into the British Inquiry, Day 21): a watertight door with coal against it is not
  to count as part of the bulkhead. Its scantling table is not reproduced there.

**Her own watertight bulkheads**, for comparison [read]:
- Bulkhead D, 44 ft from the tank top, plated 0.56 in at the tank top and 0.30 in between E and F decks, its
  stiffeners about 29 7/8 in apart (Wilding, BI 20627-20643, Day 19).
- Its plating 10 to 20 % and its stiffening "75 to 100 percent" over Lloyd's new rules (BI 20660-20662; the Limitation
  of Liability deposition, wilding03).
- "Very large stiffeners of specially rolled sections", "elaborately bracketed at top and bottom" (wilding02).
- All her bulkheads "constructed on the same footing for scantlings" (BI 25328-25331, Day 27).

**The answer to item 1:** the bunker's side that gave way was a lighter, non-watertight bunker end bulkhead, not
bulkhead E. Its own scantlings are in no open source; the yard's drawings hold them. The period's rule for such a wall
asks for 0.30 in plating and stiffeners an inch shallower than a watertight bulkhead's, up to two frames apart, on
lugs. Section 2 sizes it so.

## 2. What the door and the wall can bear

e104's part C. Every figure is a head of water over the bunker's floor, in metres, with the stokehold side dry (pumped,
as the record has it). Mild steel at 262 MPa, the lower of her recovered hull plate's two yields (NIST-IR 6118, as
`section.js` takes it) [read there]. The door's and the wall's own steel is NOT FOUND.

**The coal door** (C1): a plate spanning between its two guides, in plastic bending (p = 2 sY t²/b², simply supported
at the guides, which hold its edges from moving out but not from turning) [derived: the plate-strip collapse load].
Its sill is at the stokehold plates, 2 ft over the bunker's bottom (BI 2096). It is 2 ft tall, so its centre is 3 ft
up [bet: its size NOT FOUND].

| Plate t \ span b | 18 in | 21 in | 24 in | 27 in | 30 in |
|---|---|---|---|---|---|
| 1/4 in | 11.0 | 8.3 | **6.6** | 5.4 | 4.5 |
| 5/16 in | 16.6 | 12.5 | 9.7 | 7.9 | 6.6 |
| 3/8 in | 23.5 | 17.5 | **13.6** | 11.0 | 9.1 |
| 7/16 in | 31.7 | 23.5 | 18.2 | 14.6 | 12.0 |
| 1/2 in | 41.1 | 30.5 | 23.5 | 18.8 | 15.4 |

The two figures in bold are certified by abacus: 6.569 m (`abacus1:83cfdbb76e23`) and 13.637 m
(`abacus1:9b38c107f8ad`).
- A door goes as t²/b², so its strength is as uncertain as its two unknown dimensions: from about 4.5 m to over 40 m.
- The model's 13.0 m is a 3/8 in door spanning about 24 in. A 1/4 in door of the same span gives half of it.
- Not counted: the guides' own lips and their rivets, which may let go first; and a door that rides up or out of its
  guides as it bends. Both lower the head.

**The wall's plating** (C2), at the floor, where the load is greatest: a strip clamped at the stiffeners
(p = 4 sY t²/s²). Membrane action is left out, so these are lower bounds.

| Plate t \ spacing s | 24 in | 27 in | 30 in | 33 in | 36 in |
|---|---|---|---|---|---|
| 1/4 in | 11.3 | 8.9 | 7.2 | 6.0 | 5.0 |
| 0.30 in | 16.3 | 12.9 | 10.4 | 8.6 | 7.2 |
| 0.35 in | 22.2 | 17.5 | 14.2 | 11.7 | 9.9 |
| 0.40 in | 29.0 | 22.9 | 18.5 | 15.3 | 12.9 |

The plating is never the weak part: past these heads it carries the load as a membrane, until its seams' rivets go.

**The wall's stiffeners** (C3): plastic collapse of a vertical stiffener with its plating, from the floor to G deck
(7.81 m, the model's own height of the bunker), under the water's triangular or trapezoidal load.
- The sizes are the period's rule (section 1). A bulb angle is taken as a plain angle, its bulb left out (a little low).
- On lugs the stiffener is simply supported; bracketed, hinges form at the ends and inside.
- At mid-span the plating is taken on the pressure side, in compression, at Faulkner's effective width [bet: which side
  the stiffeners stood on is NOT FOUND].
- The heel's reaction at collapse is set against 7/8 in rivets in single shear at 300 MPa, 116 kN each [bet: the
  rivets' strength].

| Set | Mp (kN m) | Head (m) | Heel reaction (kN) | Rivets it takes |
|---|---|---|---|---|
| **Lloyd's bunker side** (section 22, par. 12) at its widest: bulb angles 9 1/2 x 3 1/2 x .56 in at 72 in (two frames), plate .30 in, on lugs | 167 | **4.5** | 151 | 1.3 |
| the same stiffeners at every frame, 36 in | 165 | **6.0** | 124 | 1.1 |
| the same at 36 in, stiffened as far over the rule as the yard stiffened its bulkheads (x 1.75 and x 2; Wilding's 75 to 100 %, a bet for this wall) | 288, 329 | **7.9, 8.5** | 190, 211 | 1.6, 1.8 |
| Lloyd's middle-line (watertight) bulkhead (Table 10): bulb angles 10 1/2 x 3 1/2 x .56 in at 30 in, plate .34 in, on lugs | 201 | 7.2 | 137 | 1.2 |
| the same, bracketed at heads and heels (section 19, par. 7) | 201 | 10.9 | 247 | 2.1 |
| her own watertight bulkheads: that set x 1.75 and x 2 (Wilding) | 351, 401 | 16.2, 17.9 | 406, 458 | 3.5, 3.9 |

- **A bunker end wall built to the rule gives way at 4.5 to 6.0 m of head.** Stiffened as far over the rule as her
  bulkheads were, it gives way at 7.9 to 8.5 m. A double-riveted lug has the rivets to hold the heel in every case, so
  the stiffener yields first.
- **13 m lies above any bunker wall.** It falls between a watertight bulkhead at Lloyd's minimum (10.9 m, bracketed)
  and her own bulkheads (16 to 18 m). A wall built to hold coal was never asked to bear it: coal's own pressure on a
  7.8 m wall is about 2.4 m of water at its foot [derived: 0.85 t/m3, a lateral ratio of 0.4].
- **The Report's "door weaker than the bunker bulkhead"** then caps the burst head at the wall's own strength: 4.5 to
  8.5 m.
- **Not counted:** the fire's damage, and plating torn at the door's frame. Barrett's "dinged" is bulkhead E's, the
  bunker's forward wall, not the wall facing the stokehold.

## 3. What the record says of the collapse

Read for this note from the Titanic Inquiry Project's transcripts (public domain). "BI" is the British Inquiry's
question number; "US" the Senate Inquiry, Day 18, which numbers no questions. T is minutes after the collision at
11:40 p.m.

| Point | What was said | Where |
|---|---|---|
| **When** | The bunker door burst "about an hour after the collision" (T 60) | the Report, "Gradual Effect of the Damage", https://www.titanicinquiry.org/BOTInq/BOTReport/botRepGradEff.php [read] |
| | Counsel: "You have told us that was about ten minutes past one, I think?" Barrett: "That is as near as I can recollect." (1:10, T 90) | BI 2349, https://www.titanicinquiry.org/BOTInq/BOTInq04Barrett02.php [read] |
| | Asked whether a quarter of an hour passed before the rush: "After the fires were drawn." His sequence puts the fires drawn by about 12:25 to 12:30, so about T 60 to 65 [derived in the pumps note] | BI 2053, https://www.titanicinquiry.org/BOTInq/BOTInq03Barrett02.php [read] |
| **How it came** | "A rush of water came through the pass - the forward end." The pass: "a space between the boilers where we walk through." | BI 2038, 2039 [read] |
| | "I do not see how it could come over the top." | BI 2056 [read] |
| | "a wave of green foam come tearing through between the boilers"; "It never came above the plates, until all at once" | US, Day 18, https://www.titanicinquiry.org/USInq/AmInq18Barrett01.php [read] |
| | "a greater rush than a fire hose" (counsel's words, put to him) | BI 2354 [read] |
| **What gave way** | He did not see it: whether it was the door or part of the bulkhead, "No." | BI 2328; also 2074, 2322 [read] |
| | "Something that had been holding the water back gave way?" "That is my idea, my Lord." | BI 2060 [read] |
| | "Could it have been a bunker bulkhead that gave way?" "I have no idea on that, but that is the bunker that was holding the water back." | BI 2062 [read] |
| | **The Report's inference:** "This would cause the water to be retained in the bunker until it rose high enough to burst the door which was weaker than the bunker bulkhead." | the Report, "Gradual Effect" [read] |
| **The bunker** | Empty at the collision, the only empty bunker forward, "a-fire" | BI 2091, 2293-2294, 2299 [read] |
| | Its door: "I dropped the bunker door"; not a watertight door | BI 2065, 2343-2344 [read] |
| | The sea came through the ship's side about 2 ft above the plates and 2 ft abaft the bulkhead; the bunker's bottom about 2 ft below the plates; "holes" | BI 2094-2098, 2105, 2312 [read] |
| | The leak: "a continual pour of water ... the very same as an ordinary fire hose"; the Report: "a stream about the size of a deck hose" | BI 2254-2255; the Report, "Gradual Effect" [read] |
| | "There is a watertight compartment running right through the centre of the bunker" (bulkhead E, through the cross bunker); its bottom "dinged" by the fire | BI 2067, 2304-2307 [read] |
| **The stokehold** | No water over the plates in boiler room 5 until the rush; the engineers had the pumps on | BI 1964, 1968-1969, 2007, 2037, 2108-2111 [read] |

What this fixes and what it leaves:
- **Fixed:**
  - the bunker held for a long time, then let go all at once, into the stokehold through the pass at its forward end,
    not over the top;
  - its early leak was small, a hose's stream;
  - the stokehold stayed dry until then, with its pumps on.
- **Not fixed:**
  - which part gave way: the Report's door is an inference, though the only one on record;
  - the time, within T 60 (the Report; Barrett's own sequence, BI 2053) to T 90 (1:10, BI 2349).
- The repository's earlier notes read the same answers the same way (the pumps note's conflict 4; the room-by-room
  note: "the rush through the pass at T 60 or at 1:10, T 90").

## 4. The burst head and the bunker's fill are one lever

e104's parts A, B and D. The head over the bunker's floor that the burst test reads is, while the bunker fills, its
water's level, and once it is full and pressed up, the sea's own head over its floor.

**The model's fill** (part A):
- **The inflow.** The hull openings inside the pocket are 0.0847 m2 on the preset and 0.0576 m2 on the watch: boiler
  room 5's share of the opening (Hackett and Bedford's 10.3 %, G6b), all of it inside the bunker, where G6's tear
  ends. On the preset they bring in 0.61 m3/s at the start.
- **It is full at T 10 on the preset and T 15 on the watch.**
- **After that its head is the sea's**, rising with her trim. On the preset: 9.6 m at T 12, 11.2 at T 30, 12.6 at T 50,
  and the burst at T 56.3 at 13.05 m. The watch bursts at T 55.3 at 13.10 m.
- **So the model's burst time is set by the sea's rise.** The head maps one-to-one onto the minute. It is read off a run
  with the bunker held for good, which is the same run as any other up to its burst:

  | Burst head (m) | 10 | 11 | 12 | 12.5 | 13 | 13.5 | 14 | 14.5 | 15 | 16 | 17 |
  |---|---|---|---|---|---|---|---|---|---|---|---|
  | T, the preset (min) | 16.3 | 27.1 | 40.1 | 47.7 | 56.3 | 66.6 | 79.8 | 103.3 | 131.5 | 147.4 | 158.4 |
  | T, the watch (min after the touch) | 16.4 | 27.0 | 39.7 | 47.0 | 55.3 | 65.4 | 78.5 | 103.6 | 124.4 | 138.5 | 149.3 |

  So e103's 9 to 17 m spans bursts from T 10 to T 158, and that is why the head moves the founder so much.
- **A correction to W6's comment.** W6's e76 (on `wt/w6`, before G6b's refit) found that, held for good, the head
  peaked at 13.72 m at T 73, which put Barrett's 1:10 out of a head's reach. On join 7 it does not peak.
  - Held for good, the preset's head is 13.19 m at T 60, 13.75 at T 73, 14.24 at T 90, 14.44 at T 100, 14.77 at T 120
    and 15.49 at T 140; she founders at T 184.6. The watch's is 13.25 at T 60, 14.28 at T 90, and it founders at
    T 175.0.
  - So Barrett's 1:10 is within a head's reach: 14.2 to 14.3 m.
  - `core/core.js`'s comment ("out of a head's reach (e76)") is stale; the mainline owns it.

**The record's fill** (part B):
- **The record's inflow.** "A stream about the size of a deck hose" means a 2.5 to 3 in stream. A 3 in stream at the
  start's 6.44 m over Barrett's hole brings 0.0513 m3/s [abacus, `abacus1:a3f52babfb69`]. The model's inflow is
  11.9 times that [`abacus1:5aaff100915e`].
- **The fill is run against the preset's own sea at the hole**, into the pocket's half bunker (260 m3 by the hull's
  form) and into a whole cross bunker (NOT FOUND whether the halves were divided).

| Case | T 30 | T 45 | T 60 | T 75 | T 90 | Full at |
|---|---|---|---|---|---|---|
| 3 in, half bunker, no leak | 3.38 | 4.87 | 6.25 | 7.55 | (full) 14.29 | T 78.1 |
| 3 in, half bunker, the model's door leak (0.005 m2) | 2.80 | 3.82 | 4.71 | 5.50 | 6.21 | not by T 100 |
| 2.5 in, half bunker, no leak | 2.47 | 3.62 | 4.71 | 5.75 | 6.74 | not by T 100 |
| 3 in, whole cross bunker, no leak | 1.84 | 2.74 | 3.60 | 4.43 | 5.23 | not by T 100 |
| two 3 in streams, half bunker, no leak | 5.83 | 12.37 | 13.24 | 13.88 | 14.29 | T 43.3 |

(The level over the floor in metres, then the sea's head once the bunker is full. The sea is the preset's with the
bunker held.)

- **With the record's fill, the burst time is set by the fill.**
  - A burst at T 60 means a head of 3.6 to 6.3 m.
  - A burst at T 90 means 5.2 to 7.8 m.
  - If the half bunker fills first (T 78, one 3 in stream, no leak), any head from its height, 7.8 m, up to the sea's,
    about 14 m, bursts it the moment it is full. That holds only if its top was tight [bet]: open coal hatches would
    let the water rise on into G deck's spaces, slowly.
- **That is the Report's own picture**: the water retained "until it rose high enough to burst the door".
- **So the two are one lever.**
  - The model fills its bunker about twelve times faster than the record describes, and needs 13 m to hold it until
    T 56.
  - The record's fill needs about 4 to 8 m to give the same minute.
  - A head and an inflow chosen apart can each look sourced and still contradict each other.

## 5. The range for the history match

e103 sampled 9 to 17 m. With the model's own fill that range spans bursts from T 10 to T 158 (section 4). The record's
time alone rules most of it out:
- **Below about 13.2 m** the model's bunker bursts before T 60, the Report's "about an hour" and Barrett's own sequence
  (BI 2053). At 12.5 m it bursts at T 48; at 9 m, at T 10.
- **Above about 14.3 m** it bursts after T 90, the latest the record allows (1:10, BI 2349). At 15 m it bursts at
  T 131; at 17 m, at T 158, just before she founders.

So the range depends on which fill the epoch keeps:

| | Keep the model's fill (the bunker's openings at Hackett and Bedford's boiler room 5 share) | Give the bunker the record's fill (its own openings sized as the deck hose) |
|---|---|---|
| **Sample** | **13.2 to 14.3 m** | **3.5 to 8 m** |
| Low end | 13.2 m: the head at T 60, "about an hour after the collision" (the Report), also Barrett's own sequence (BI 2053) [measured: e104, 13.19 m on the preset, 13.25 on the watch] | 3.6 m: a whole cross bunker's level at T 60 under one 3 in stream, the Report's "deck hose" (the halves' division NOT FOUND) [measured: e104 B] |
| High end | 14.3 m: the head at T 90, Barrett's 1:10 as counsel put it to him (BI 2349) [measured: e104, 14.24 preset, 14.28 watch] | 7.8 m: the half bunker's height to G deck. Above it the burst comes when the bunker is full (T 78 for one 3 in stream, no leak), whatever the head, if its top was tight |
| What the structure says | Nothing to support it: 13 to 14 m lies above any bunker end wall (4.5 to 8.5 m) and needs a watertight bulkhead's stiffening and a door of 3/8 in over at most 24 in (section 2) | Consistent: a bunker end wall by Lloyd's rule gives way at 4.5 to 6.0 m (7.9 to 8.5 stiffened as her bulkheads were), and the door was the weaker (the Report) |
| The burst's minute | set by the sea's rise | set by the fill |
| The ledger's rows that bind it | the rush into boiler room 5 at T 60 to 90 (the Report; BI 2053, 2349); boiler room 5's plates dry until then (BI 2109) | the same two |

**Recommended:**
- Sample the burst head **together with the bunker's inflow**, not alone:
  - the bunker's own opening from one deck-hose stream (about 0.003 m2) to Hackett and Bedford's share (0.085 m2);
  - the burst head over **3.5 to 14.3 m**.
- Let the ledger's two rows above decide the pairs.
- The structure's range (section 2) is what keeps the low end. The model's fill is what puts the high end in play.
- If the epoch keeps today's fill and samples the head alone, use 13.2 to 14.3 m, about a seventh of e103's 8 m. Say
  that the structure does not support it: it is the head the model needs to place the burst in the record's hour, not
  one a coal bunker of 1912 could bear.

## 6. For the coordinator and the mainline

- **D(W6-a), the range:** sample `bunkerBurst` over 3.5 to 14.3 m jointly with the bunker's own opening area (0.003 to
  0.085 m2), with the ledger's rush row (T 60 to 90) and boiler room 5's dry-plates row. Failing that, 13.2 to 14.3 m
  with today's fill, labelled as the model's need. Advice: the joint sample.
- **W6's comment in `core/core.js` is stale on join 7.** Barrett's 1:10 is within a head's reach (14.2 to 14.3 m), and
  the head no longer peaks at T 73 (section 4). The mainline's to correct when it next touches W6.
- **D(W6-b), the bunker's inflow as its own parameter.** Today boiler room 5's whole share of the opening is inside the
  bunker, where G6's tear ends, so the bunker fills about twelve times faster than the record's hose. Making the bunker's
  openings a parameter of their own is a change to G6b's split: the 10.3 % would be shared between the bunker's side
  and the stokehold's.
  - Note that the record puts all of boiler room 5's damage in the bunker (BI 2105: "only from the ship's side").
  - So the share the record cannot see is the size of the bunker's holes after the rush, not where they were.
  - The mainline's call, inside C or D.
- **D(W6-c), the stokehold's water on the wall's other side** (left out today, W6's comment): with the record's fill
  the burst comes while boiler room 5 is pumped and dry (BI 2109), so leaving it out is right for the burst itself.
- **D(W6-d), the yard's drawings.** National Museums NI's index lists Harland and Wolff's scantling drawings of the
  bunkers: HOYFM.2010.73.143 "Coal bunkers forward" and HOYFM.2010.73.60 "Bunker plan / bunkers aft", not online. They
  would turn section 2's range into a figure: the end wall's stiffeners and spacing, and the coal door's size.
  - A copy is a download or a request, so Bo's word comes first; it is for the morning note.
  - Until then the rule-sized range (4.5 to 8.5 m) stands.
- **For the record** (no decision needed): which part gave way is the Report's inference (the door), and whether the
  bunker's halves were divided above the watertight passage is NOT FOUND (section 1).

## 7. Sources, files and effort

- **Read for this note** (public domain, through the Titanic Inquiry Project):
  - the British Inquiry, Barrett: Day 3, https://www.titanicinquiry.org/BOTInq/BOTInq03Barrett02.php; Day 4,
    https://www.titanicinquiry.org/BOTInq/BOTInq04Barrett01.php and https://www.titanicinquiry.org/BOTInq/BOTInq04Barrett02.php;
  - the US Inquiry, Barrett, Day 18, https://www.titanicinquiry.org/USInq/AmInq18Barrett01.php;
  - the British Report, "Gradual Effect of the Damage", https://www.titanicinquiry.org/BOTInq/BOTReport/botRepGradEff.php,
    "Watertight Compartments" (`botRepWC.php`) and "Structure" (`botRepStructure.php`);
  - Wilding, the British Inquiry: Day 19 (`BOTInq19Wilding05.php`, BI 20627-20643 and 20660-20662; `BOTInq19Wilding06.php`,
    BI 20676) and Day 27 (`BOTInq27Wilding01.php`, BI 25328-25331); his Limitation of Liability depositions
    (https://www.titanicinquiry.org/lol/depositions/wilding02.php and `wilding03.php`);
  - the 1891 Bulkheads Committee's report as read into the British Inquiry, Day 21 (`BOTInq21RepBulCom.php`).
- **Read for this note, period publications** (public domain):
  - The Shipbuilder (1911), "The White Star Liners Olympic and Titanic": "Building of the Hulls: Structural Design" and
    "Propelling Machinery: Bunker Arrangements", as reproduced by Encyclopedia Titanica
    (https://www.encyclopedia-titanica.org/building-of-the-hulls.html,
    https://www.encyclopedia-titanica.org/the-propelling-machinery.html);
  - Lloyd's Register, Rules for the Construction and Classification of Steel Vessels, 1911-12
    (https://archive.org/details/HECRAR1912): section 19, par. 7; section 22, pars. 11 and 12; Table 10, pp. 180-184.
    Checked against the 1909-10 (`HECRAR1910`) and 1913-14 (`HECRAR1914`) editions.
- **Secondary**, for the passage's place only: Brad Payne, Encyclopedia Titanica, "An analysis of Titanic's vertical and
  lateral watertight doors" (after Beveridge's redrawings of the yard's plans); Samuel Halpern, "Titanic's Prime Mover"
  and `FloodingBR4.pdf` (titanicology.com).
- **The yard's drawings' index:** National Museums NI, "Digitised Olympic and Titanic Ship Plans" (PDF, 2022), above.
- **In the repository:**
  - `docs/research/RESEARCH_lists_bunkers_scotland_road_v1_2026-11-17.md` (the bunkers' arrangement, W and Y);
  - `RESEARCH_pumps_bilge_ballast_v1_2026-11-17.md` (boiler room 5's pumps; conflict 4, T 60 against T 90);
  - `RESEARCH_br5_damage_extent_G6_v1_2026-11-20.md` (the damage in the bunker);
  - `RESEARCH_room_by_room_flooding_record_v1_2026-11-20.md`;
  - `docs/DESIGN_W6_the_lists_v1_3_2026-11-20.md`;
  - W6's e76 (`docs/research/experiments/e76_w6_bunker_head.js`, `results_2026-11-20/e76_e78_w6.txt`);
  - `core/core.js` (W6's pocket, `bunkerPocket`, `pocketsStep`).
- **The mainline's e103** (`wt/epoch-a` `394db47`), read for its range and its effects.
- **New:** this note; `docs/research/experiments/e104_bunker_burst_head.js` (reserved 04:41 in
  `C:\temp\titanic-experiment-numbers.txt`); `docs/research/experiments/results_2026-11-21/e104_bunker_burst_head.txt`.
- **Abacus receipts:** `abacus1:9b38c107f8ad` and `abacus1:83cfdbb76e23` (the door at 3/8 and 1/4 in over 24 in),
  `abacus1:a3f52babfb69` (a 3 in stream at 6.44 m), `abacus1:5aaff100915e` (the model's inflow against it).
- **Effort, by the clock:** 04:34 to 05:14 CST.
  - The research agent (sources for section 1) took 32 minutes in the background, the testimony's extraction 2.
  - e104 took six runs of 6 to 13 s, at BelowNormal while join 8's gate held the machine.
  - The note took about 25 minutes.
