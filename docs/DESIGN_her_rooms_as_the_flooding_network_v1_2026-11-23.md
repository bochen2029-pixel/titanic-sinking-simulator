# Her rooms as the flooding network (NH6): design v1

- **Written:** 2026-11-23, 19:05 CST, by NH2's side session of the coordinator ("Titanic simulator model accuracy
  (fork)"), on its word of 18:42 ("NH6's DESIGN v1 ... stage 1 is the one to design in full").
- **Status:** design v1, with no earlier version. Its stage 1 came out clean, so it is built on the same branch
  (`claude/nh6-rooms-network`): `core/readers/roomnet.js` and `tools/roomnet_tests.js`.
- **Lineage:** NH6 in `docs/BRAINSTORM_the_next_horizon_v1_2026-11-23.md`, section 3, unchanged in v1.1. The rooms
  brainstorm's way (b) in `docs/BRAINSTORM_rooms_and_a_walk_through_her_v1_1_2026-11-20.md`. R1 (`core/readers/rooms.js`),
  R3 (`data/rooms`) and NH2 (`core/readers/cabins.js`).
- **Tags:**
  - **[read]** a number read in a source, which is named;
  - **[derived]** a number computed here from sources or from the repository's data, the method stated;
  - **[bet]** a number no source gives;
  - **[stand-in]** a rule that holds the place of data that is missing.

## 0. In brief

1. **Stage 1 is a neutral library, as rooms.js and cabins.js are.** Inside each of the core's 64 spaces it shares the
   space's own water among the space's rooms. The rooms are R3's rows, cut by the model's zones, sides and decks, plus
   each deck's rest (what no row covers). They are joined by the openings the plans give: the doors a row names, and the
   stairs, hatches, lifts, trunks and casings that pass a deck. The core is untouched, and no fingerprint moves.
2. **The law is hydrostatic and history-free.** The space's water fills its rooms from the lowest up. A room joins the
   water when the level reaches the lowest opening by which the water can reach it. Where the plans give no opening, a
   named stand-in does.
3. **It is exact where it must be:**
   - every space's water is shared to the last m³ (2.6e-16 of capacity) [derived];
   - the rooms of every column piece hold exactly the piece (1.1e-15) [derived];
   - with every opening open, it gives rooms.js's own slabs (5.3e-14 of a slab) [derived], so the open floor is its
     limit and its first test.
4. **What it changes.** On the 1912 preset (member C), 23 of 250 slabs first take water later than on the open floor,
   by up to 13.3 min, and none earlier [derived]. The water must climb by the plans' stairs and hatches, or wait until
   the deck under it is pressed full. Of the staterooms' 228 room pieces, 13 move by more than a minute [derived].
5. **What it cannot say:**
   - timing inside a space (it has no flow law);
   - which way the water came in;
   - trapped air;
   - water held behind a sill when the level falls;
   - the doors' states.

   Ruponen (2007) is the method for all of these. They are stage 2's, with NH7's air.
6. **What "water at a cabin's door" may claim:** "by 1:58 am the water could stand at this block's door, if her doors
   stood open and her rooms filled from the bottom of the compartment". The uncertainty: section 7.

## 1. Where it sits

- **The core** has 64 spaces: 16 zones, two sides, and two layers split at E deck. Each space has one water volume
  (`sim.vol`) and one level. Its connections between spaces carry the flows: doors in the bulkheads, the overflow over
  the bulkheads' tops at E deck, two stand-in openings a side through E deck (`aDown`, fitted), and the weather openings
  and breaches. Each connection has a place and a flow per step (`sim.conn`).
- **rooms.js (R1)** cuts each space at her decks into 250 slabs, and shares a space's water among them at the space's one
  level (the open floor [stand-in]).
- **cabins.js (NH2)** maps R3's rows onto those slabs. It gives a row's first-wet time and the depth at its place, in the
  words "water on C deck between bulkheads K and L, port side".
- **NH6 stage 1, this note,** refines the inside of a space: which of its rooms hold its water, and at what level. It
  reads the core's water and pose, and feeds nothing back. The core's flows still see one level per space.
- **NH6 stage 2** makes the rooms the core's nodes: an epoch with one refit, sharing NH7's epoch (air per space). NH14
  (the dynamics model for other projects) asks for stage 1 first ("the openings with their sills, areas and strengths",
  the next horizon v1.1).

## 2. Ruponen (2007): the method, and what carries over

Source: P. Ruponen, *Progressive Flooding of a Damaged Passenger Ship*, doctoral dissertation, Helsinki University of
Technology, Ship Laboratory, TKK Dissertations 94, Espoo 2007 (ISBN 978-951-22-9013-0, PDF). Read in the Aalto
repository's copy; page numbers are the printed ones.

- **Rooms and openings.**
  - Each room is one cell, with one flat water level parallel to the sea and no sloshing (§2.2.3, p. 29; §3.2, p. 36).
  - Water passes only through defined openings: points, vertical lines for doors, pipes (§4.4, pp. 58-68).
  - A room must be near convex vertically, or it can hold two levels or an air pocket and must be split (§4.5, pp.
    68-69).
  - Stairs, escape trunks and a lift shaft are rooms of permeability 0.95 [read: Table 6.2, p. 108].
  - A whole trunk as one room gave the same result, much faster, and he recommends it for staircases in slow
    down-flooding (Fig. 6.17, p. 113).
  - Lumping cabins together is valid only at small heel and trim (p. 103).
- **The flow.**
  - Bernoulli with a discharge coefficient: dQ = sign·Cd·√(2gΔh)·dA, integrated over a tall opening's wetted height
    (eqs 2.4-2.7, p. 31; eq. 4.13, p. 62).
  - Cd is 0.6 for damage and internal openings [read: pp. 32, 102, 108].
  - "Sill" does not appear in the thesis. An opening's own lowest point does the work: water adds no head until it
    stands above it (eq. 3.3, p. 38).
- **The solver.**
  - A pressure correction each time step, implicit in time, with a mass residual per room under a tolerance (§3, pp.
    44-55).
  - The time step is 1.0 s on the ship [read: p. 109].
- **Air.**
  - An isothermal ideal gas (eq. 3.13, p. 40).
  - It matters for fast flooding of poorly vented rooms and always for tanks (pp. 25-26).
  - Vents of 10 % of the duct area matched IMO A.266's equalization [read: pp. 97-100]; the ship case runs fully vented
    (p. 104).
  - The repository's own note agrees: air can be ignored where the vents are at least 10 % of a well's area
    (`docs/research/RESEARCH_downflooding_stairwells_glazing_v1_2026-11-19.md`, lines 319-325).
- **Doors** (after IMO SLF47/INF.6; estimates, not tests, p. 108):

  | Door | Leak head | Collapse head | Leak area ratio |
  |---|---|---|---|
  | B-class joiner door | 0 | 1.5 m | 0.2 |
  | A-class fire door | 0 | 2.0 m | 0.1 |

  [read: Table 6.3, p. 109.] Closed watertight doors do not leak.
- **Validation:** a box barge with eight rooms in model tests (Table 5.1, p. 72; pp. 75-94), and a 193 m demonstration
  ship of 67 rooms and 81 connections (pp. 96-109).

**What stage 1 takes from him:**
- the room as one flat level;
- the opening's lowest point as its sill;
- a trunk or stair as one vertical room passing its decks;
- permeability by room.

**What stage 1 leaves to stage 2:** the flow law and its Cd, the doors' leak and collapse, air, and the time step.

**Why stage 1 is his resting state, and only that.** With equal air pressures his flow through an opening stops when
both levels stand below it, or level with each other (eq. 3.3). A fill from the bottom by the openings' heights is
therefore his state at rest, if:
- the rooms are vented;
- the openings are open;
- equalization inside a space is fast against the inflow.

That rest state is not unique. A room whose water stands under all its openings keeps whatever it holds, so which
pockets hold water depends on where it came in. That is the history a stateless library cannot carry (section 5).

## 3. The room graph from R3: what is there, what is missing

The counts below are [derived] from `data/rooms` at main f3b2373 by the measuring scripts of this lane. The scout
briefing of R3's notes is cited by file and line.

**What is there:**
- **Rows:** 572 rows on nine decks, 208 of them blocks of rooms between passages. Of 1,157 pieces, 1,155 lie on a slab of
  rooms.js. The exceptions are C-002 and C-003 (no piece) and two of Bt-04's, all tagged 'beyond the model'.
- **Doors:** 609 door objects.
  - 453 name a row of their own deck.
  - 156 name a place: "D deck and F deck", "the sea (ash door in the shell)", "the aft well deck (open)".
  - 28 are watertight doors: 12 on E, 14 on F, 2 on the orlop.
  - Each door is written once, on one row's list. E-SR1 lists 4, while 26 rows name it. The graph has to be made
    two-way.
- **Rows with no door:** 126. On the orlop 27 of 34 and on G 27 of 58 (holds, bunkers, casings, tanks, stores); on C, B
  and A 5 or 6 each.
- **Vertical rows:** 157 rows pass a deck: stairs 69, hatches 30, lifts 4, a trunk, and casings 53. Where they overlap
  a row of the deck below by at least 0.5 m² [bet] in plan, they make 319 vertical links: stair over stair 47, casing
  over casing 59, stair over a cabin block 35, and so on.
  - A stair's door names the next deck, not its landing row, so landings are matched by plan overlap [stand-in].
  - Of the 186 plates inside a space (two slabs of one space), 159 are crossed by a vertical row.
  - The 27 that are not: the peaks (zones 0 and 15), No. 3 hold above E deck, and A deck to the Boat deck over the
    engine rooms.
  - Of the 32 zone-sides, 26 have a vertical row across E deck, the core's layer boundary. The exceptions are zones 0,
    1 and 15.
- **No floor:** R3 says G deck is no floor between bulkheads E and K, and the orlop none between D and M (G deck's and
  the orlop's tables, `how`).
  - The data say the same: on G deck in zones 5 to 9, and on the orlop in zones 4 to 11, every row is a casing, bunker
    or machinery.
  - F deck carries rooms in every zone.
- **Openings to the weather:** `openings.json` (1,351 openings in 256 rows, 552 m² [read: the openings note v1.1])
  names each row's deck and rooms. They are the core's (C4's side openings); stage 1 needs them only to say where water
  came in (section 10).

**What is missing:**
- **Sills, coamings and thresholds.** None is read anywhere, except `sill_in: 6` on two firemen's spiral stairs (E-007,
  E-008) [read: E deck's table].
  - "Door heights, sills and coamings are mostly not drawn" (the rooms brainstorm v1, line 54).
  - No hatch has a coaming height.
  - So every sill is a bet, bounded, with its sensitivity printed.
- **Doors' places and widths.** A door's `at` is words. 412 of the 609 widths are the default 2 ft 3 in [bet: R3, the
  door arcs measure 2 ft 2 in to 2 ft 6 in]; 19 are written on the plan [read].
- **Inside the blocks.** A block is one room in stage 1. Its cabins' own walls and doors are not in the tables.
- **Unread area.** Rows cover under 60 % of 19 slabs above the holds, most of them in zone 1, zone 3's B and A decks,
  the Boat deck's houses and the stern. On the other side, R3's rows overlap past their area on 193 column pieces, by
  107 to 442 m² a deck, beyond the rows' declared `minus`.
- **Checks against an original:** 544 of 572 rows were never checked, because the reachable plate is too small to read
  room by room (the E deck pilot's note, lines 172-190).
- **G11's findings below E deck.** The plans and the model part as follows (BACKLOG G11):
  - bulkhead B steps aft as it rises, and A steps forward above F deck;
  - P stands 4.1 to 4.5 m aft of the model's;
  - F deck is dropped 18 in from frame 21 to 60;
  - there are no watertight doors on F deck in E or G, nor on G deck in N (C4 took them out at the landing);
  - the passages are narrower: Scotland Road is 2.24 m clear against the model's 3.11 [read].

  Stage 1 keeps the model's zones: a room's water belongs to the model's space, and R3 tags the rows the plan and the
  model part on (`zone_note`). F deck's drop and the passages' widths matter to a flow law (stage 2), not to a
  hydrostatic fill.

## 4. Stage 1's rooms and openings

**Rooms.** A room is one R3 row's piece in one slab, or one slab's rest.
- It is built on rooms.js's own column pieces (columns about 3 by 0.5 m, cut at her decks).
- A row takes, from each column piece of its deck's slabs, the share of the column's plan its outline covers: the
  polygon is clipped to the column's rectangle, and the rows it declares inside it (`minus`) are taken out.
- Where R3's rows still cover more than a column's plan, each share is scaled down to fit [stand-in].
- The column's plan no row covers goes to the slab's rest.
- An orlop row holds from the orlop deck up to G deck, wherever the orlop is a floor. The hold under it goes to the
  rest.
- A row's piece under 0.5 m² in a slab goes to the rest [bet].
- So every column piece is shared out whole, and a slab's rooms hold exactly the slab: 1,443 rooms, 1,193 row pieces
  and 250 rests, from 6 to 43 row pieces a space [derived].
- A row whose outline lies where the model has no space of its deck has no room: some promenades on A deck, which the
  model's tiers do not cover.

**Openings,** 2,245 [derived]. Each opening's sill is the world height at which water passes it, at her pose:

| Kind | Count | Where it comes from | Its sill |
|---|---|---|---|
| door | 515 | A row's door to a row of its own deck, in each slab the two share. Two-way | The higher of the two rooms' lowest floor points, plus `sill` (0 m [bet]). The door's place along the wall is not in the tables |
| stair, hatch, lift, trunk, casing | 692 | Where a row passing a deck overlaps a row of the deck below by 0.5 m² [bet] or more, in one space | The upper deck's height at the overlap's centroid (+ `coaming` for a hatch, 0 m [bet]). The orlop's hatches open to the hold under the orlop |
| rest [stand-in] | 790 | Every passage; every row naming no door to a row of its slab; and every room that cannot reach its slab's rest by the slab's own openings (238 of these), so that closed clusters do not climb a stair to reach their own deck | The row's own lowest floor point: the rest is the deck's gaps, all over it, so the opening stands beside the row |
| nofloor [stand-in] | 70 | A deck that is no floor in a zone (all its rows casings, bunkers or machinery): its rows and the slabs either side of it are one volume | Always open |
| plate [stand-in] | 178 | Every plate inside a space, between the two slabs' rests | The plate's highest point. Once the deck under it is pressed full, the water passes it by the openings the plans do not show (scuttles, vents, ladders) |

The core's own connections between spaces (the bulkheads' doors, E deck's overflow, the openings through E deck) stay
the core's. Stage 1 never moves water between spaces.

## 5. The sharing law at level 0, and what it cannot say

**The law** (`pour` in roomnet.js), for one space at her pose:
1. Each room's capacity below a world level h is the core's column cut on its share of each column (rooms.js's
   `cutAt`, on the room's sub-pieces).
2. The water starts in the space's lowest room, r0.
3. Each room's **joining level** λ: over every path from r0, the highest sill on the path; λ is the lowest of those
   (a minimax path, by Dijkstra with max in place of sum). r0's λ is its own lowest point.
4. Rooms join in order of λ. The joined rooms stand at one level h, the space holding Σ cap_r(h) = V (Newton's steps
   in a bracket, as rooms.js).
5. When V stands exactly at a joining level, the joining rooms take what is left, as one pool at a common level under
   it. This is the moment water spills over a sill into a room and fills it from its floor.
6. When every room is full, the excess goes on the highest room, as rooms.js puts a pressed-up space's excess on its
   top slab.

**Its properties:**
- **History-free:** it reads only the space's water and her pose.
- **Deterministic:** its sums are in a fixed order.
- **Conserving:** a last trace goes to the room the surface stands in, as rooms.js does.
- **Monotone in V:** rooms only join as V grows.
- **Open floor in the limit:** with every sill at −∞, every room joins at r0's level, and the law is rooms.js's one
  plane.

**What it cannot say:**
- **Timing inside a space.** There is no flow law. The water stands where it would at rest. Through a closed joiner
  door the real water lags by minutes: Ruponen's B-class door leaks at 0.2 of its area from zero head [read: Table
  6.3]. A door 0.69 m wide [derived: 2 ft 3 in] with a 1 cm gap passes about 0.013 m³/s at 0.5 m of head
  [derived: Cd 0.6 [read], √(2g·0.5)], so a 10 m² cabin rising 0.5 m takes about 6 min.
- **Which way it came.** Water entering high (a window on C deck) runs down to the pool in the end, but not on the way.
- **Trapped air:** NH7.
- **Water held behind a sill when the level falls.** For example, when she changes the side of her list. A stateless
  library drains it at once; a reader with a state could keep it (stage 2).
- **The doors' states:** shut, open, leaking or collapsing. Stage 1 has them open.
- **Rooms filling from the inside out, or out of order,** through openings the plans do not show.

## 6. Consistency with rooms.js and the core

- **To the space.** Over each space, the rooms' water is `sim.vol[n]`, exactly (2.6e-16 of capacity on the 1912 preset
  [derived]). The pockets (W6's bunker, G7's tank) keep their own water, as the core keeps it outside `sim.vol`.
  - A slab's sum adds the pockets' held water (min(vol, cap)) to the space's lowest slab, as rooms.js does.
  - So the rooms and the pockets' over-fill are `C.spaceWater` summed: the readouts' water.
- **To the slab, in the limit.** With the option `open` (every opening at −∞), every slab's sum equals rooms.js's
  `waterOf` to 5.3e-14 of the slab's capacity [derived]. This is the identity test. A change to rooms.js's column cut
  that stage 1 does not follow breaks it.
- **The difference to the slab, by design.** With the plans' openings, a slab's sum differs from rooms.js's, because
  water moves between a space's decks. That difference is what stage 1 adds, and its suite prints it (section 9). The
  core's flows still see the open floor's level, which is the limit of a neutral reader.

## 7. What "water at a cabin's door" may claim

**Claim** (one block, one door; the time is the block's own, from `out/roomnet_1912.txt`): "Water could stand at the door
of C 92 to C 102 by [its time]: C deck between bulkheads K and L, port side, the compartment filling from its bottom with
its doors open (level 0)."
- The door is the block's door to the row it names, usually a passage.
- The time is the first step its room holds 1 cm over its floor [bet, as cabins.js's].
- The depth is the room's level over its deck at its place.

**The uncertainty,** largest first:

| Source | Its size |
|---|---|
| The core's own night | Stage D's kept set spreads the founder by minutes (NH3's bands) |
| Timing inside the space (no flow law) | Minutes per closed joiner door [derived above]; later, never earlier, than a door shut would allow |
| A stateroom's place inside its block | Up to half the block: B-019 runs 3 compartments. Stage 1 cannot place a cabin within its block |
| Sills [bet] | 0 against 0.15 m moves 14 of 228 stateroom pieces by more than a minute, at most 7.8 min [derived] |
| The plate stand-in where no vertical row crosses | The 27 plates; a deck there waits for the one under it to fill |
| R3's walls | About half a frame to two frames (0.5 to 2 m) [read: R3's notes]; the stand-in shell; the unread areas |

So the page may say "could stand ... by", with the level-0 words. It may not say "was at", or name a minute closer than
the core's own band.

## 8. The tests (`tools/roomnet_tests.js`)

**MUST:**
1. **The graph.** Every room's sub-pieces lie in its own slab's column pieces. Every column piece is shared out whole:
   its rooms' and its rest's shares add up to it.
2. **The open-floor identity.** With `open`, every slab's sum equals rooms.js's `waterOf` on the 1912 preset at every
   minute, to 1e-9 of the slab's capacity. This is "conservation to the slab" in the limit.
3. **Conservation to the space.** With the plans' openings, the rooms of each space hold `sim.vol[n]` at every minute,
   to 1e-9 of its capacity. With the pockets, the slabs' sums and the over-fill are `C.spaceWater`.
4. **A hand-worked space.** Two boxes stacked in one space, with a stair at one end, at a trim. The levels and the
   water at five volumes are worked by hand in the suite's comments, and `pour` must give them.
5. **Neutral.** The 1912 watch, read by `share` every 10 s, has the fingerprint and the state of one never read. No
   state of its own is in the sim or the forecast's copy.
6. **The bundle.** Loaded in the page's name order (roomnet.js after cabins.js, before rooms.js; no module), it gives
   Node's shares to the bit.

**CHECK:**
- the graph's facts (rooms per space, openings by kind, plates no vertical row crosses, the closed clusters opened);
- the 1912 preset: each slab's first-wet time against the open floor, and the staterooms' rooms against their slabs;
- the sill's bet at 0.15 m and at 0.3 m;
- the table `out/roomnet_1912.txt`, tracked.

## 9. What it does on the 1912 preset (member C, main f3b2373)

Measured every 10 s; [derived]:
- 23 of 250 slabs first take water more than a minute later than on the open floor, and none earlier. The largest:

  | Slab | Open floor | Stage 1 | Later by |
  |---|---|---|---|
  | D deck over boiler room 6, port | T 105.2 | T 118.5 | 13.3 min |
  | D deck over boiler room 4, port | T 143.3 | T 152.0 | 8.7 min |
  | D deck over boiler room 3, port | T 152.5 | T 160.7 | 8.2 min |

  C deck over the forward compartments moves 5 to 7 min.
- The pattern is the upper decks: there the water must climb a stair, or wait until the deck under it is full.
- Of the staterooms' 228 room pieces, 13 move by more than a minute, at most 13.3 min (D-015 over boiler room 6).
- A 0.15 m sill [bet] moves 14 pieces, at most 7.8 min (E-122).
- `share` of all 64 spaces costs about 5 ms; the graph is built once in about 1.7 s.

## 10. Stage 2: what it needs from stage 1

Stage 2 makes the rooms the core's nodes. It shares NH7's epoch, with one refit; the 64-space model is its limit and its
test. From stage 1 it takes:
- **The rooms and their capacity functions,** as built here: some 1,400, where Ruponen's demonstration ship had 67
  rooms in 1.0 s steps [read: pp. 96-109]. At the core's 0.25 s step a fully coupled solve of twenty times as many may
  be heavy: measure first.
- **The openings, with their places and kinds.** Stage 2 must add what stage 1 lacks:
  - areas: the doors' widths and heights (412 of them default) and the stairs' and hatches' openings;
  - Cd: 0.6 [read: Ruponen];
  - the doors' leak and collapse heads [read: Ruponen's Table 6.3, as bets for her joiner doors];
  - the sills, read where any 1911-12 original can be had.
- **The identity:** with every opening very wide, the rooms' model must give the 64-space model's own flows. Stage 1's
  open limit is that identity's static half.
- **The entries:** the core's connections (`sim.conn`, with places) mapped to rooms. A breach goes into the room it
  opens into, E deck's overflow into Scotland Road's row at the bulkhead, the weather openings into `openings.json`'s
  rooms. Stage 1 does not need them (it fills from the bottom). Stage 2 cannot do without them.
- **A state:** water held behind sills, doors' states and air pressure make stage 2 a reader with a state, or the core
  itself.
- **What R3 still owes:**
  - the 27 plates with no vertical row;
  - the 6 zone-sides with no row across E deck;
  - the unread areas;
  - landing rows for the stairs (a stair names the next deck, not its landing);
  - the doors' places along their walls.

## 11. The decisions and bets of v1

| | Choice | Why |
|---|---|---|
| D1 | Stage 1 is a library, history-free, filling from the bottom | Ruponen's rest state with no state to carry. The coordinator's brief asked for a neutral library |
| D2 | Rooms on rooms.js's columns, shared by plan area | Exact conservation, and the open floor as an identity |
| D3 | Openings on one deck: at the higher of the two rooms' lowest floor points (a door), or at the row's own (to the rest) | The plans give no door's place |
| D4 | Vertical openings: where a passing row overlaps the deck below, at the upper deck's height there | A stair names its deck, not its landing |
| D5 | Plates: open at their highest point | The water passes a pressed-full deck by openings the plans do not show; it never blocks the space |
| D6 | No floor where all a deck's rows in a zone are casings, bunkers or machinery | R3's own words for G deck and the orlop |
| D7 | Sills 0, coamings 0 [bet] | No source. The sensitivity is printed at 0.15 and 0.3 m |
| D8 | The water starts in the space's lowest room | Water inside a space runs down to its lowest place |

**The bets:**
- WET 1 cm (as cabins.js);
- minOverlap 0.5 m²;
- minPiece 0.5 m²;
- sill 0 m;
- coaming 0 m.

## 12. Sources

- **Ruponen, P. (2007).** *Progressive Flooding of a Damaged Passenger Ship.* TKK Dissertations 94, Helsinki University
  of Technology. Aalto repository: https://aaltodoc.aalto.fi/server/api/core/bitstreams/745b4f83-7891-4a64-bf68-25f016159491/content
- **R3's notes:**
  - `docs/research/RESEARCH_rooms_E_deck_pilot_v1_2026-11-20.md`;
  - the F and G, D and orlop, and C to Boat decks notes;
  - `RESEARCH_rooms_openings_v1_1_2026-11-21.md`;
  - `RESEARCH_room_by_room_flooding_record_v1_2026-11-20.md` (the witnesses room by room: stage 1's candidates, for a
    CHECK table later);
  - `RESEARCH_downflooding_stairwells_glazing_v1_2026-11-19.md` (stairs never choke; doors give way at about 1 m at the
    sill [bet there]; air ignorable at 10 % vents).
- **BACKLOG** G11 (the plans below E deck against the model) and G14 (above E deck).
- **The repository's own:** `core/readers/rooms.js`, `core/readers/cabins.js`, `core/core.js` (`rebuildConnections`,
  `solveLevels`, `spaceWater`).
