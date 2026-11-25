# Brainstorm: her rooms, and a walk through her while she sinks (v1)

Written 2026-11-20 15:40 CST. Bo's ask, with a picture of a $5 deck plan in a shop's basket:

> "say i get actual cad schematics of titanic with room, inch level accuracy, and then have sessions using mcp blender mcp unreal engine etc ... or even still threejs without unreal but using blender for the 'cad' ... to have a 3d titanic that is accurate to a few inches both outside and inside ... for the purpose of having a much more accurate (real time only) sinking calculation ... leave it in shaded/wireframe view but give it a first person perspective ... walk around the entire ship, external and interiors, while the ship is sinking in real time (1x) ... the big picture is still based on my EXISTING sim, but in FPS mode it does the granular calculations deck by deck, room by room"

**Status: a brainstorm. Nothing is built.** This session added this note and one cost sketch, `docs/research/experiments/e71_room_graph_cost.js`. Neither is committed. Revisions are new files.

Tags: [M] measured in this session, [R] read (file or page named), [D] derived, [B] bet.

## 0. The take

The walk is a good idea and it is cheap. The room-by-room model is a good idea and it is cheap to run. Three parts of the ask are wrong as stated, and each has a better form.

- **"Inch-level CAD" is not what is on sale, and inches are not what the sinking lacks.** The plans are pictures, and the flooding's errors come from openings nobody has counted, not from rooms an inch too wide (sections 2 and 3).
- **"Only in real time" is not a limit the computer sets.** A room model of the whole ship steps in tens of microseconds. It can run all the time, at any pace, and the walk is then just a camera (section 5).
- **Blender and Unreal are the wrong first tools.** The source of her rooms should be a table of numbers, as her topsides already are. The walk in wireframe needs nothing beyond the three.js page (section 7).

What I would build: her rooms as a **reader** of the watch. It takes her pose and her holes from the existing core, floods room by room on its own, and shows how far the two models disagree. It can be walked from the first day with no plan bought, and it sharpens deck by deck as plans are turned into numbers (sections 4 and 9).

## 1. The idea, restated

| Part | What Bo asked | In this repository's terms |
|---|---|---|
| The big picture | stays the existing sim: what has flooded, her pitch, roll and heave | `core/core.js`, 64 spaces (16 compartments, two sides, below and above E deck); unchanged, to the bit |
| The fine picture | deck by deck and room by room | a new reader, `core/readers/rooms.js`, with state `sim.rooms` |
| The ship to walk | outside and inside, shaded or wireframe | a part of the page, built from the same table as the reader |
| The pace | 1x when walking | the page's pace held by the part (`TitanicApp.holdPace`) |

## 2. The plans: what is on sale, and what "inches" can mean

### 2.1 What the shop sells

From its own page ([titanicplans.com, Digital Plans](https://www.titanicplans.com/digitalplans)) [R]:

| Product | What it is | A pixel on the ship [D] |
|---|---|---|
| "Deck Plan - Single File", $5 (the one in the basket) | one black and white PNG, 7,200 by 10,800 pixels, 1.3 MB, every deck on one sheet, made for phones; "some [text] might be too small to read" | 1 to 1.5 in, if a deck spans the sheet |
| "Digital Plans Package", $40 | 54 PNG files: every deck, profile views, a symbol guide; most 32,000 by 5,132 pixels | about 0.34 in (her 882 ft 9 in over about 31,000 pixels) |
| "Iron Plans", $35 each or $130 | redrafted structural plans with "every original line, dimension, and note"; so far B deck, C deck, the poop and the forecastle | written dimensions |

- **None of it is CAD.** They are pictures. There are no vectors, no layers, no heights, and no list of rooms.
- **The $5 file is the wrong one to buy for this.** It is a phone copy of the $20 "clean plan". The $40 package is the one a session could work from: one deck to a file, at four times the detail, with the profile and the key.
- **A pixel's size is not the plan's accuracy.** The makers call them "recreations", researched from the builders' plans, photographs and the wreck. Where a cabin partition stood is known to some inches at best, and in places it is their judgement.

### 2.2 Where inches really come from

- **Her frames.** They were 3 ft apart amidships, closing to 27 in at the stern and 24 in at the bow, numbered from amidships both ways ([Encyclopedia Titanica's forum](https://www.encyclopedia-titanica.org/community/threads/titanic-frames.35046/); this repository's hull-strength note has the same end spacings) [R]. The plans print the frame numbers along each deck.
- **A wall snapped to its frame is placed to the inch along her length**, whatever the picture's pixel says. That is the way to digitise: read "this bulkhead stands on frame 58 forward", not "this line is at pixel 14,212".
- **Written dimensions**, where the iron plans have them.

### 2.3 What no deck plan gives

- **Heights.** Deck heights come from the profile and from the model (`C.deckZ`). Door heights, sills and coamings are mostly not drawn.
- **What was open.** Which cabin doors stood open that night, which portholes, which fan trunks.
- **How strong things were.** A cabin's wooden partition, a door, a pane.
- **How full a space was.** Cargo, coal, stores, furniture.
- **Her shell.** The model's hull is a fitted form, and backlog G2 lists where it is off: the wells' ends by 1.4 to 1.5 m, the sheer by 0.4 to 0.8 m, the breadth by 6 in, her after body above the waterline by metres [R: `BACKLOG.md`]. Rooms placed to the inch would stick out through a hull that is out by a metre. The hull's lines come first, or the rooms are clipped to the model's hull and marked as a bet.

### 2.4 The licence

The plans are a living team's copyrighted drawings, sold for "examination and study". Reading dimensions off them for a private model is one thing. Publishing a traced interior on a public site or in a zip is another, and needs their terms read, and probably their leave [B: not legal advice]. Two rules follow whatever the terms say:

- the bought pictures stay out of the repository, which is meant to be pushed to GitHub;
- the table of rooms cites its source for every row, as the topsides table does.

## 3. Inches are not what the sinking lacks

This is the part of the ask I would push back on hardest. "Accurate to a few inches" and "a much more accurate sinking calculation" are different things.

What limits the flooding's accuracy today [R: `core/core.js`, `BACKLOG.md`, `CHANGELOG.md`]:

| The unknown | How loose it is |
|---|---|
| The width of the paths along E deck (`wMul`) | refits end anywhere from 0.73 to 3.0 at the same score |
| The top deck's share open to the sea (`fOpen`) | fitted; it moved by 47 % when the tiers went in |
| The windows of B deck and the screen | areas are bets; no count was found (S1e, T2) |
| The gangway doors' tightness | a millimetre of gap sinks two cases that otherwise float (S1d) |
| The lists | about 1 degree where the record has 5, and 2.5 where it has 10 (W6) |
| The 1912 holes themselves | 0.75 m2 in all, held in the fit, split among six compartments by Hackett and Bedford's fractions [R: `HANDOFF.md` section 6] |

Against those, an inch on a room three metres wide is under one per cent of its volume. Inch-true rooms would leave every row of that table where it is.

What plans do buy, and it is worth having:

- **Countable openings in place of fitted ones.** How many windows B deck had. How wide Scotland Road was: 2.6 to 2.7 m, where the fit gave the port path an effective 8.2 m before S1 and 3.1 m after it, the score nearly flat between the two [R: `BACKLOG.md`; the comment at `wMul` in `core/core.js`]. Where the stairs and hatches through E deck really stood, in place of one fitted area a side (`aDown`).
- **Topology.** Which room opens into which, through what, at what height. This is what decides where water goes first, and what the lists need: the coal bunkers, the cross passages, the cabins' fore-and-aft walls (W6).
- **Many more things to check against.** The witnesses spoke in rooms: the mail room, the squash court, the foot of a stair on E deck, Scotland Road, a named cabin. The calibration has eight points; a room model can be scored against dozens. The reports reader already holds some of that script, and one of its misses is exactly this kind: the mail room floods 17 minutes late [R: `BACKLOG.md`, W3].

So the honest claim is: **more detail at once; more accuracy only if the rooms' timetable is tested against the witnesses and the core is then corrected by what that shows.**

## 4. The design: her rooms as a reader

### 4.1 A table of numbers is the source

As `site/topsides.js` is for her topsides. Every row carries its source and its tag.

| Table | A row |
|---|---|
| Spaces | id; deck; watertight compartment; side; its outline in her frame (x by frame number, y in inches from the centreline); floor and deckhead heights; permeability; kind (cabin, passage, hold, bunker, boiler room, stair well, trunk) |
| Openings | the two spaces (or the sea); kind (door, watertight door, stair, hatch, port, window, vent, a partition that can fail); place; sill; width and height; strength; how it stood that night (open, shut, unknown) |

The mesh to walk through is **generated** from the table: walls extruded from outlines, doors cut where the openings are. Nobody models a wall by hand, so the picture and the hydraulics cannot drift apart.

### 4.2 The model

A graph of ponds: each space has a volume and a free surface; each opening carries water by the two levels across it. Almost all of it exists already.

- **The laws** are S1's: an upright opening (`lawUpright`), a level one (`lawLevel`), and "holds until the head reaches its strength, then open for good" (`stairsStep`). A cabin's partition is one more such opening, with a low strength.
- **The cut** that keeps water conserved is C3's.
- **Air** is the new thing rooms make possible: a room flooding from its door traps air above the lintel. That is what Z6 (the fall's air, space by space) has already designed [R: `docs/DESIGN_free_body_air_by_space_v1_2026-11-20.md`].
- **What is unknown is a parameter, drawn from the night's seed:** the share of cabin doors left open, for one. A reader may draw from the seed; the rule is already there.

### 4.3 How it is tied to the existing sim

| | Way | For | Against |
|---|---|---|---|
| a | **Forced.** Each of the core's 64 spaces hands its water down to its rooms; the rooms only share it out | the two always agree in total | water appears in rooms with no path to them; the rooms can never say the core is wrong |
| b | **Free, one way.** The rooms take her pose, the sea's level, her holes, her watertight doors and her pumps from the core, and flood by their own laws. Nothing goes back | every drop in a room came through an opening; the disagreement with the core is a number on the screen; it is a reader, so no fingerprint moves | she may trim faster than her rooms' water explains, where the two disagree |
| c | **Two way.** The rooms replace the core's inside | the real thing (backlog S1c, HANDOFF 4e) | a refit of everything, and every pin moves |

**Pick b.** It is what Bo described, it fits the readers' rule exactly (a reader never writes into the flooding), and its disagreement is the most useful output: where the rooms and the core part, one of them is wrong, and the witnesses say which. A weak pull toward the core's totals can be added later if the gap proves ugly to walk through. Way c is a decision for after the rooms have been scored (section 9, R6).

### 4.4 It should run always, not only on a walk

Bo's sketch has the fine model wake when the walk begins. I would run it on every watch from the first step.

- A model that starts at 1:40 am has to invent what happened before.
- Running always, it is deterministic, replays with the log, and can be tested with no browser.
- It costs nothing that matters (section 5).

The walk is then a view of a state that already exists, and "put me on E deck at 1:40" works on any saved night.

### 4.5 One graph, five users

The same table and reader would serve work already in the backlog:

| Who | What it gets |
|---|---|
| The walk | the ship to walk and the water in it |
| S1c, the decks as spaces | its design, tried as a reader before it touches the core |
| W6, the lists | the bunkers, Scotland Road, the cabins' walls |
| Z6, the fall's air | its spaces |
| The boats and the reports | routes people could take; who could have seen water where, and when |

That is the strongest argument for doing it at all.

## 5. What it costs to run [M]

`e71_room_graph_cost.js` steps a made-up ship of box rooms through a night of 38,400 steps: every wet room's surface solved at her pitch, every opening's flow, the conserving cut. The hydraulics are invented; the count of operations is real.

| Rooms | Openings | Microseconds a step, over the night | At her own pace, of one thread |
|---|---|---|---|
| 2,500 | 6,000 | 33 | 0.01 % |
| 5,000 | 15,000 | 108 | 0.04 % |
| 12,000 | 36,000 | 264 | 0.11 % |

- The existing core costs 57 microseconds a step on the 1912 damage (64 spaces, 392 connections, 4,408 columns) [M].
- In the sketch about a tenth of the rooms were wet at the end (8 to 12 %). With every room wet the cost is a few times higher [D]; at her own pace that is still under one per cent of a thread.
- So the room model could run at 60 times her pace as easily as at 1. **The 1x rule belongs to the walk** (a person cannot walk at 60x), not to the arithmetic.
- How many rooms she has is a bet: 1,500 to 2,500 spaces and 4,000 to 7,000 openings [B]. The table above shows the answer does not hang on it.

Not measured: drawing it. A bet: 2,500 rooms are 100,000 to 200,000 triangles as flat walls, drawn a deck and a few compartments at a time, which a phone can do [B].

## 6. The walk

It is a part of the page (`site/parts/`), in three.js, in the X-ray look's manner: flat faces and edges.

- **Moving:** pointer lock and keys on a desktop, two thumbs on a phone. Collision is two-dimensional, a circle against the walls of the deck one stands on; stairs are ramps between decks.
- **The slope is real.** The eye rides in her frame, so the sea and the stars tilt as she trims. "Down" for the walker is the world's, so a deck at 10 degrees is a hill, and past the angle shoes hold a person slides [B: the angle].
- **The water is the rooms' water:** a level sheet in each room, at that room's own surface, tilted against the floor as she tilts. Wading slows the walker by depth [appearance until a source is found].
- **Her lights are the plant's.** When the dynamos fail, the inside goes dark. This costs nothing and is the scene.
- **Sound** is the sound part's, with one new input: the walker's place.
- **Entering:** "walk from here" on any watch, at any minute, on any deck. The page's pace is held at 1 while walking.
- **Doors:** the walker may open and shut an ordinary door, which changes the rooms model only, as an order the reader owns, so it is logged and replays. A watertight door is the core's, and goes through `Night.door` like every other.
- **In the desktop app** (the Electron design, v2) pointer lock and full screen work as in a browser.

## 7. Blender and Unreal

- **Not as a drawing board.** Driving Blender by hand over MCP to carve 2,000 rooms would be slow, could not be rerun, and would yield triangles with no knowledge of which room is behind which door. The Unreal brainstorm of today found the same of an earlier Unreal project: the work was generators and scripted proofs, and MCP was for looking [R: `docs/BRAINSTORM_titanic_in_unreal_v1_2026-11-20.md`].
- **As generators, later, from the table.** The lane U0 already writes "the ship as numbers" for Blender and Unreal. The rooms table would join that export, and the same interior would appear there.
- **Not needed for this.** A wireframe walk is well inside what the page does now. Unreal earns its place when the ask is photographs, not when it is walls and water levels.

## 8. From pictures to numbers: where the work is

This is the real cost of the idea, not the model and not the walk.

1. **Register** each deck's picture to her frame: the frame numbers printed along it give x; the centreline and the moulded breadth give y.
2. **Find the walls.** Her partitions run almost all fore-and-aft or athwartships, which makes line finding tractable on a clean black and white plan.
3. **Close the rooms** (the faces between walls), **find the doors** (gaps and swing arcs), **read the labels**.
4. **Snap** every wall to a frame or a stated offset, and write the rows.
5. **Check by picture:** the table drawn back over the plan, tile by tile, for a person or a session to look at. Ten decks by sixteen compartments is about 160 tiles.
6. **Check by number:** the rooms of a compartment's deck must sum to the volume the core's own columns give that slab, within a stated band.

Steps 2 to 4 are where sessions help most, and where they will be wrong most. The honest size is several sessions of the large kind, deck by deck [B].

The decks in order of what they buy: E (Scotland Road, the stairs' feet), F and G (the mail room, the squash court, third class forward, the bunkers), D, then the machinery spaces, then C to the Boat deck, where S1's windows are.

## 9. Stages, each with its test

| Stage | What | Done when |
|---|---|---|
| R0 | Bo buys the $40 package (not the $5 file); the terms read; the pictures kept outside the repository | a note with what the terms allow |
| R1 | **Level 0, from the model alone, no plan needed:** every deck in every watertight compartment, a side, as one space (about 300), with the openings the core already knows; the reader, free and one way | a watch has the same fingerprint with it as without; the spaces of a compartment sum to the core's volume; at rest their levels are the core's; the gap between the two models printed through the 1912 night |
| R2 | The walk on level 0: her decks as open floors between the watertight bulkheads, the water, the dark | its browser suite; a watch's fingerprint unchanged by the part |
| R3 | A pilot tile digitised: E deck in way of boiler rooms 6 and 5, Scotland Road and the forward stair's foot | the overlay picture; the tile's rooms sum to their level-0 space; Wheat's water at the stair's foot (T 65 to 70) against the rooms' own time there |
| R4 | The decks, in section 8's order; a space of level 0 is replaced by its rooms as each tile lands | the same two checks a tile; the walk shows rooms where they exist and open deck where they do not |
| R5 | The witnesses' table: every room-level sighting in the research notes against the rooms' timetable | the table, with its misses stated; nothing tuned |
| R6 | Whether the rooms go into the core (S1c), with its refit | Bo's decision, on R5's table |

R1 and R2 can start with nothing bought. They would already let Bo walk her decks while she sinks.

## 10. Doubts

- **Scope.** This is the largest thing proposed for this repository so far, and it arrives while Z3, C3 and the lists are queued. As a reader it moves no pin, so it does not collide with them; but it competes for the same hours.
- **False precision.** A room drawn to the inch with a door whose state is a guess looks more certain than it is. Every bet must show as a bet, in the table and on the screen.
- **The hull.** Until G2, rooms at the shell are clipped to a form that is out by up to a metre aft.
- **The two models disagreeing in front of the walker.** That is the point of way b, and it will sometimes look wrong.
- **The licence** (section 2.4).
- **An hour of walking at 1x is a long time.** The entry at any minute is what makes it usable.

## 11. For Bo to decide

1. Whether to do it, and whether R1 and R2 (no plans, the decks as spaces, the walk) start before the queued physics or after.
2. Which plans to buy. My pick: the $40 package now; the iron plans only for decks being digitised.
3. Way b (free, one way), or another.
4. Whether the interior is ever to be published, which sets how the licence question is handled.

## 12. Not known, and sources

Not known:
- What the plans' terms allow.
- How true the plans are, partition by partition.
- How many rooms and openings she has.
- Whether line finding works on these pictures; R3 is the test.
- The drawing cost on a phone.

Sources:
- Read: the shop's page (above); `BACKLOG.md`, `CHANGELOG.md`, `CLAUDE.md`; `core/core.js` (S1's laws); the heads of `docs/DESIGN_free_body_air_by_space_v1_2026-11-20.md` and `docs/BRAINSTORM_titanic_in_unreal_v1_2026-11-20.md`.
- Measured: `node docs/research/experiments/e71_room_graph_cost.js` (also with `5000 3` and `12000 3`); the core's step on the 1912 preset.
- Not read: the plans themselves (not bought); the shop's terms and FAQ.
