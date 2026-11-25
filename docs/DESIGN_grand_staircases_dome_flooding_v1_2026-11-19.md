# The grand staircases, their domes and the tiers above B deck in the flooding model (S1, v1)

- **Written:** 2026-11-19, 13:10 to 14:20 CST, by the session Bo opened at 13:01 (Claude Code desktop, Fable 5.2), with three research agents (Opus 5.5). Revisions of this note are new files (`..._v2_...`), never edits in place.
- **Asked for** (Bo, 19 November, about 12:58): "there are two grand staircase, if water leaks into either of them the dome busts and its rapid entry of water via the grand staircase ... fan out subagent to do research and then model it mathematically so that in the sim this is added".
- **Facts and their sources:** `docs/research/RESEARCH_grand_staircases_domes_record_v1_2026-11-19.md` ("the record"), `docs/research/RESEARCH_downflooding_stairwells_glazing_v1_2026-11-19.md` ("the physics") and `docs/research/RESEARCH_topsides_dimensions_v1_2026-11-19.md` ("the plan"). This note does not repeat their sources; it says which of their figures the model uses.
- **Tags:** [read], [scaled], [derived], [bet] as in those notes; [M] measured on the model in this session (the script is named).
- **The code:** `core/core.js` (`TIER`, `tierTop`, `STAIRS`, `WINDOWS`, `weatherOpenings`, `stairsStep`, `lawUpright`, `lawLevel`), `tools/stairs_tests.js`, the experiments `docs/research/experiments/e25_grand_staircases.js` and `e26_superstructure_buoyancy.js` with their outputs in `results_2026-11-19/`.

## 0. Summary

- **Built:** the three tiers above B deck as buoyant, floodable space; the windows in their sides; and the two grand staircases' own openings: forward the D-deck gangway doors, the Boat-deck entrance doors and the dome; aft the A-deck entrance doors and the dome. Each opening holds until the head of sea on it reaches its strength and is then open for good. Two flow laws from the literature carry the water: a door or window by the pressure summed over its height, a dome's well as the smaller of a weir round its rim and an orifice through it.
- **The dome goes from below.** Once a door of the stair hall has given way and the sea has passed its lintel, the air shut in under the dome lifts its cover's panes off their beds. Bo's rule, "if water leaks into either of them the dome busts", is what the physics note found.
- **On the 1912 damage** the forward dome gives way at 155.8 minutes (2:16 am), 5 s after the port Boat-deck door, 1.2 minutes after the sea reaches the bridge and 1.4 before she founders; the after dome at 156.5. The staircases then carry up to 17,200 t a minute, forty times the ice's inflow, 5,800 t in all.
- **No witness saw a dome give way.** It is a reconstruction (paintings, the 1997 film), and a fair one. The record's own trim puts the sea at the forward dome at 2:16 to 2:18.
- **What decides her end is the tiers, not the staircases.** With the tiers she is nearly upright as the bridge goes under (2.5° to port; 29° before; the record about 10°), and the refitted model founders at 157.2 minutes with the bridge under at 154.7 (156.9 and 153.9 before; the record 160 and 155). Take the staircases out and she founders two seconds later; hold the domes shut and one second later. The 44,000 t that come in by B deck's and A deck's broken windows swamp them.
- **Why, and what would change it.** In this model each compartment's decks above E deck are one space, so water that comes in at a window is at once on every deck below it: the way down that a staircase's well gives is taken for granted everywhere. Spaces by deck, joined by the wells (backlog S1c), are where the staircases would do what Bo meant. S1 had to come first: before it there was nothing above B deck to flood.
- **Kept:** every validation verdict; the seams gate, to the bit, on the hull that stops at B deck. **Refitted:** wMul 1.036, aDown 0.2815, fOpen 0.02068 (J 9.39 against 9.56). **Moved on purpose:** the 1912 watch's fingerprint, the girder's record figures, three tables in `out/`.
- **The two guesses that matter:** how strong the tiers' windows are (1.5 m of sea; 0.5 to 3.5 moves her foundering from 155.8 to 160.3 minutes) and whether the D-deck gangway doors leak (held tight; leaking like fire doors they would be a second hole from 1:17 am and sink her three minutes sooner).

## 1. What the record says, and what is cinema

- **The forward staircase** ran from the Boat deck down to E deck, with a plainer flight on to F deck; "over 60ft. in height and 16ft. wide" (The Shipbuilder, 1911) [read]. It stands between the first and second funnels, just abaft bulkhead F, over boiler room 4 [read: the flight from E to F deck is "just aft" of the bulkhead; scaled: its dome's cover is centred 31.1 m forward of amidships on the Boat-deck plan]. Three lifts in one trunk stand immediately forward of it, from E deck to A deck [read].
- **The after staircase** served A deck to C deck only, between the third and fourth funnels, over the reciprocating engine room, just abaft where she broke [read]; its dome's cover is centred 38.8 m abaft amidships on the plan [scaled].
- **Each dome had two glazings:** the dome "of iron and glass" seen from below, and over it on the roof a glazed weather cover (rectangular panes, a round scuttle at the centre, hinged sidelights in its sides, a duct to a fan trunk) [read: Bob Read's articles]. The forward cover stood on the roof of the entrance house, the after one on the Boat deck itself.
- **The ways in before the dome** (forward): four steel gangway doors into the D-deck reception room, two close together on each side, which the British Report says were "closed by lever handles but had no rubber" [read]; the hall's vestibules on A deck, which open onto the promenade inside its 192 ft steel screen; the vestibules and arched windows on the Boat deck. Side doors on B and C deck appear in some accounts and not in the Report's own list.
- **The night.** Water was running down the stair's flight from E to F deck at about 12:45 to 12:55 (Wheat) [read]. The sea reached the bridge at about 2:15, the forward funnel fell at about 2:17, she was gone at 2:20 [read]. On the record's trim and list the sea stood at the port D-deck doors from about 1:30 to 1:50 and reached the forward dome last, at about 2:16 to 2:18, in the minute of the break [derived in the record note].
- **No witness saw or heard a dome break.** The record note read every survivor who was on the forward Boat deck at the end, and searched Gracie's compilation: nobody mentions a dome, a skylight or glass. "The dome implodes and the sea pours down the staircase" is a reconstruction (Marschall's paintings; the 1997 film, whose set did flood that way). It is a fair reconstruction: the physics note finds no way for a glazed cover to hold more than about half a metre of sea, and a good reason for it to go sooner (section 3.4). The wreck agrees with it as far as it can: the forward stair is an empty well, and the dome's opening is how the vehicles go in.

## 2. What the model lacked

1. **Its hull stopped at B deck** (`zTopAt`). The three tiers above it, B to A deck, A deck to the Boat deck and the houses on the Boat deck, held no water and gave no buoyancy: the sea passed through them (README, "Known gaps"). They enclose about 25,500 m3 [M: `tools/stairs_tests.js`].
2. **Everything that lets the sea in from above was one fitted number**: `fOpen`, a weir at B deck 1.4 % of each compartment's length wide, about a quarter of a metre for a boiler room. It stood for every hatch, door, window, stairway and dome.
3. **So her end came early and upside down.** The 1912 run foundered at 156.9 minutes with the sea at the bridge at 153.9, where the record has 160 and 155, and it rolled 29 degrees to port by the time the bridge went under and 80 by the end, where the record has about 10 degrees and no capsize [M].

An experiment made before any of this was built (e26: the tiers' buoyancy put on the old core from outside, through its seams, each stretch flooding through its windows by a simple law) moved the foundering from 156.9 to 159.8 to 161.4 minutes, and the list at 2:15 from 43 degrees to between 12 and 4, for windows that break under half a metre to a metre and a half of sea. That is why S1 is the tiers and the staircases together: a staircase with nothing dry around it has nothing to flood.

## 3. The model

### 3.1 The tiers are space

A ship is built with her tiers (`C.buildShip()`; `C.buildShip({ tiers: 0 })` is the hull that stops at B deck). Every column of the hull that reaches B deck goes on up to the top of whatever is shut in over it (`tierTop(x, y)`): A deck where only the bridge deck's house stands over it; the Boat deck inside the promenade's screen forward and inside the house on A deck abaft it; the roof of a house on the Boat deck. Nothing else changes: the same columns give the hull's buoyancy and each space's volume, so the tiers are buoyant while they are dry and hold water as the decks under them do. Each compartment's space "above E deck" now runs from E deck to that top.

That keeps the model's own abstraction: within a compartment the decks above E deck have always been one space, as if water passed freely down through them. Where a grand staircase stands, that is what its well does; elsewhere it is the smaller stairs and the lift trunks. So a staircase adds no space of its own to this model. It adds its openings to the weather, and its dome.

What the tiers do not have is a way for the sea to pass through their sides, until a window breaks.

### 3.2 The openings to the weather

Each is a connection from the sea to the space above E deck of the compartment it stands over (the port or starboard half; a dome feeds both), switched off until the sea first stands at it.

| Opening | Where | Size | Kind |
|---|---|---|---|
| Forward staircase: D-deck gangway doors, each side | x 31.1, the ship's side, sill at D deck | two doors of 1.43 m, 2.85 m wide in all, 1.87 m high [read: the door raised from the wreck] | steel: leaks, never gives way |
| Forward staircase: Boat-deck entrance, each side | x 31.1, 8.6 m off the centreline, sill 0.1 m over the Boat deck | 0.85 m by 2.0 m [bet; the vestibules are read] | wood: leaks, then gives way |
| Forward dome | x 31.1, the centreline, 4.9 m over the Boat deck (the entrance's roof 3.9 m [scaled], the cover 1.0 m [scaled; a lead gives 6 ft]) | the smaller of the cover's glass (an ellipse 6.6 by 6.4 m [scaled], 33 m2) and the well's free plan (28 m2 [bet: the flights' footprint, 24 to 34 m2]); rim 20.4 m | a level opening once its cover has gone |
| After staircase: A-deck entrance, each side | x -38.75, 9.6 m off the centreline, sill 0.1 m over A deck | 0.85 m by 2.0 m [bet] | wood |
| After dome | x -38.75, the centreline, 1.1 m over the Boat deck [scaled] | as the forward one [bet: "exactly like" it in one source, "much smaller" in a search snippet] | a level opening once its cover has gone |
| The tiers' windows: B deck, A deck, the Boat deck's houses | two stations in each compartment on each side, in the tier's side, sills 0.9 m over the deck | 0.25, 0.30 and 0.15 m2 of glass to each metre of side [bets: about one window of half a square metre to every 2.4 m on B deck; the plan note found no count] | plate glass: tight, then breaks |

The forward hall's vestibules on A deck open inside the screen, so they are no way in from the sea; the screen's windows are, among the tiers' windows. The B and C deck side doors are left out until a source settles whether she had them.

### 3.3 The two flow laws

Both are written as the discharge over `Cd sqrt(2g)`; H1 is the higher of the two levels over the opening's sill or plane, H2 the lower (0 while it stands under it).

**An upright opening** of width b and height h (a door, a window), the pressure summed over its height: the part under the lower level runs drowned, the part above it as over a weir.

    d = min(H2, h)
    Q = Cd b sqrt(2g) [ d sqrt(H1 - H2) + (2/3) ( (H1 - d)^1.5 - max(0, H1 - h)^1.5 ) ]

It is a weir, (2/3) Cd b sqrt(2g) H1^1.5, while the sea is under its top with nothing behind it; an orifice, Cd b h sqrt(2g (H1 - H2)), once both levels are over its top; continuous between; nothing at equal levels. This is the law the flooding literature uses for a door [the physics note, sections 6 and 10.1]; the core's own bulkhead doors are point orifices, which is left alone (section 8).

**A level opening** of area A and rim P (a dome that has gone, over its well): a weir round its rim while the water on it is shallow, an orifice through it when it is deep, the smaller of the two.

    Q = Cd sqrt(2g) min( (2/3) P H1^1.5 , A sqrt(H1 - H2) )

They cross with 1.5 A / P of water on it: 2.1 m for the dome as sized. With Cd 0.60 the weir's constant is 1.77 m^0.5/s, inside the published 1.55 to 1.85, and the crossing inside the published 0.3 to 0.5 of the diameter [the physics note, 10.1]. One difference from that note's form: its weir branch carries Villemonte's factor when drowned; here the orifice branch alone falls with the level below. The two differ only while a full space under the opening is pressed up, by at most about a fifth, and there the core's stability limit rules the flow anyway.

Cd is 0.60 for every such opening (`CdStair`; 0.50 to 0.70).

### 3.4 Holding, leaking, giving way

Each opening is in one of three states (`sim.stairSt`): dry; the sea at it, holding (and leaking a stated share of its area); given way, for good. It gives way on the step the head on it reaches its strength, the head being the sea's less that of any water standing behind it at the same point:

| Opening | Strength (m of sea) | Range | Leaks while it holds | Rests on [the physics note, 10.2] |
|---|---|---|---|---|
| Wooden entrance door (`hDoor`, `leakDoor`) | 1.0 at its sill | 0.7 to 1.5 | 0.03 of its area | tests of wooden doors, which failed with 0.71 to 0.99 m against them [read] |
| Steel gangway door (`leakShell`) | none: it holds | | 0.002 of its area [bet: a gap of under a millimetre; 0 to 0.03] | the Report's "no rubber" against the conservators' gasket |
| Window (`hWin`, `leakWin`) | 1.5 at the middle of the pane | 0.5 to 3.5 | nothing | plate theory with the glass of the time (25 to 46 MPa in tests of 1891 and 1923) for panes 6 to 13 mm thick |
| Dome's cover, from above (`hDome`) | 0.5 on it | 0.2 to 1.2 | nothing | its iron bars and fixings before its glass; the leaded dome under it holds less (0.2) |
| Dome's cover, from below (`hAir`) | the sea 0.05 over the lintel of every door of its staircase that has given way | 0.02 to 0.2 | | the air shut in under the dome lifts the cover's panes off their beds: only their weight and their putty hold them down |

**The dome goes from below, as Bo said.** Once a door of the hall has given way and the sea has passed its lintel, the hall fills and the air above is shut in under the dome; a pane resting on its bed lifts at a few centimetres of head. So the cover is open before the sea reaches it, and when the sea does reach it, it runs straight in. "If water leaks into either of them the dome busts" is the physics note's own finding. With `hAir` negative the dome waits for the sea to stand half a metre on it instead; section 6 gives the difference, which is seconds.

A row of windows is two openings in each compartment on each side, and a row's panes go together at the strength of the middling pane. In the ship they would go one by one between about 0.75 and 1.2 of it.

Until the sea first stands at one of these openings nothing in the step changes: a run that never brings the sea to them has the same bits with them as without (`tools/stairs_tests.js`).

### 3.5 What it leaves out

- **Air**, except for the one rule above. The physics note's criterion: air can be ignored for the flow down a well while the spaces it feeds keep other vents of a tenth of its area. In her last minutes that is not sure.
- **The decks inside a space.** Water that comes in at a B-deck window is in the compartment's one space above E deck at once. In the ship it must find a stairwell to go down by; where the grand staircases stand it has one, elsewhere it would lie on its deck longer. This is the model's old abstraction, now carrying more (HANDOFF 4e, "More deck layers").
- **The break.** The after staircase stood at the break; in the ship it was probably torn apart rather than flooded.
- **Water running along the decks.** A wave running aft along the Boat deck adds its speed's head to the forward faces of the houses (half a metre at 3 m/s): not modelled; the strengths' ranges cover it.
- **The passage walls.** Above E deck each space is open from side to side; in the ship the cabins' fore-and-aft walls held water to one side for a while. The physics note cites a simulation in which she rolls over when her superstructure floods unless those walls are there. This is the list's lane (backlog W6), and section 5 shows what the tiers do to it.

## 4. The tiers' numbers

`TIER` in `core/core.js`, from the plan note (its sections 0 and 1.2), [scaled] off the Boat-deck plan and the profile within about half a metre unless marked.

| Part | From (m forward of amidships) | To | Half breadth | Top |
|---|---|---|---|---|
| The bridge deck's house (B to A deck) | -90.8 | 76.9 | the ship's side | A deck. Its ends are this hull's wells; the plan note has them at -92.2 and 75.4 (backlog G2) |
| The promenade deck, inside the screen | 14.1 [read: the screen is 192 ft long] | 72.6 | the ship's side | the Boat deck |
| The house on A deck abaft the screen | -77.8 | 14.1 | 9.6 m [read: the lounge and the smoke room are 63 ft wide; the house is "24 to 72 ft wide"] | the Boat deck |
| The wheelhouse | 64.8 | 67.8 | 2.95 | 2.4 m over the Boat deck |
| The officers' house | 36.0 | 64.8 | 6.9 | 2.4 |
| The forward first-class entrance | 26.3 | 36.0 | 8.6 | 3.9 |
| The second funnel's house and the gymnasium | 11.9 | 26.3 | 5.8 [bet: the plan has the gymnasium to starboard only; the same area put on the centreline] | 2.8 |
| The lounge's raised roof | -14.1 | 5.1 | 8.9 | 1.0 |
| The engine casing's house and the tank room | -35.0 | -26.6 | 6.9 | 2.7 |
| The smoke room's raised roof | -64.3 | -43.9 | 8.6 | 1.0 |
| The second-class entrance | -72.2 | -65.3 | 2.8 | 2.3 |

The boiler casings are left out: they are open to the boiler rooms. With the tiers, the fitted top-deck openings (`fOpen`) stand on the weather deck over them (the Boat deck, or A deck at the ends of the bridge deck's house) instead of at B deck, and a bulkhead carried to B deck in a what-if stops there, with the tiers over it open fore and aft.

## 5. What it does

### 5.1 The refit

Every physics change invalidates the fitted flow parameters (HANDOFF section 1), so they were refitted as Y3 did it, the opening held: `node tools/calibrate.js 45 "[0.7506,2.735,0.280,0.01411]" --fix-area`.

| | wMul | aDown | fOpen | J | Trim at 2:15 (10°) | Bridge (155) | Founders (160) |
|---|---|---|---|---|---|---|---|
| Before S1 | 2.735 | 0.280 | 0.01411 | 9.56 | 10.1° | 153.9 | 156.9 |
| S1 on those values | | | | 12.5 | 7.3° | 157.6 | 160.2 |
| S1 refitted (in force) | 1.036 | 0.2815 | 0.02068 | 9.39 | 9.4° | 154.7 | 157.2 |

J is scored with the values as rounded here; at the fit's own unrounded values it prints 9.28. The fit weighs the trim at 2:15 (within 1.5°) above the minute she founders (within 4 minutes), so it spends the time the tiers bought her on reaching 10° at 2:15: she then founders two and a half minutes later, where the record has five, with the break between. The score is nearly flat in wMul: a second refit from these values ended at 0.726 with the same score, one made with other staircase sizes at 3.0. At 1.036 the port path along E deck is 3.1 m wide, where it was 8.2 m and Scotland Road itself is 2.6 to 2.7 m.

### 5.2 The 1912 damage, minute by minute [M: `tools/stairs_tests.js`, `out/stairs_tests.txt`]

Minutes after the collision; the ship's clock in brackets.

| What | When |
|---|---|
| The sea stands at the port D-deck gangway doors of the forward staircase (they hold) | 96.7 (1:17) |
| ... and at the starboard ones | 146.1 (2:06) |
| The first windows of B deck break | 152.1 (2:12) |
| The sea reaches the bridge | 154.7 (2:15) |
| The first windows of A deck break | 154.7 |
| The first windows of the Boat deck's houses break | 155.3 |
| Forward staircase: the port Boat-deck door gives way (the sea was at its sill 5 s before) | 155.7 |
| **The forward dome gives way**, by the air, 5 s after that door; the sea reaches its cover 13 s later | **155.8 (2:16)** |
| Forward staircase: the starboard Boat-deck door | 155.9 |
| After staircase: the port A-deck door, and one second later the after dome | 156.5 |
| She founders | 157.2 (2:17) |

On the 1912 watch (the night with its ice and its orders; minutes after the touch): B deck's first windows at 152.5, the bridge 155.2, the forward dome 156.3, the after dome 157.0, foundered 157.75 (157.24 before S1).

Of the 100,850 t aboard at the end (the old hull, stopping at B deck, ended with 69,500 t), 5,800 t came down the two staircases, at up to 17,200 t a minute, forty times the ice's 400; 44,000 t came by the tiers' windows.

**Her list** as the sea reaches the bridge is 2.5° to port; before S1 it was 29°, and the record has about 10°. The tiers' buoyancy on the low side rights her. She still rolls over in her last minute, once the windows have gone (section 3.5, the passage walls).

**The hull girder's gauge** reads more with the tiers (the dry tiers lift her forward part late): 5.11 and 5.87 GN m as her trim reaches 11° and 17°, where it read 4.98 and 5.28; it now passes the top of the studies' range (5.4 GN m) at 12.5°, at 2:15:44, so every capacity in that range breaks her, between 6.6° and 12.5° (backlog W7c).

### 5.3 What the staircases themselves are worth: the honest answer

| The 1912 damage with | Bridge | Forward dome | Founders |
|---|---|---|---|
| the tiers, their windows and the staircases (S1) | 154.66 | 155.82 | 157.23 |
| the same, the domes never giving way | 154.66 | never | 157.25 |
| the same without the staircases | 154.66 | | 157.26 |
| the tiers and the staircases, the windows never breaking | 158.05 | 164.62 | 166.49 |
| the tiers with their sides whole, no staircase | 158.05 | | 166.93 |
| the old hull to B deck with the staircases | 151.26 | 151.72 | 153.78 |
| the old hull to B deck without them (same parameters) | 151.26 | | 154.02 |

In this model the staircases bring her end forward by two seconds, and the domes by one. They do carry what Bo described, 17,000 t a minute at their greatest; but they pour it into a space that B deck's and A deck's broken windows are already filling at several times that rate: about 90 window openings, 44,000 t. If the windows held, the staircases would matter more and still not much (half a minute in ten). What decides her last minutes here is the glass in the tiers' sides.

That is partly the ship and partly the model. In the ship, water that comes in at a B-deck window lies on B deck until it finds a way down, and the great ways down are the two wells: there the staircase is what floods the decks below quickly, as Bo meant. In the model every compartment's decks above E deck are one space, so that way down is taken for granted everywhere and at once. To see the staircases do their own work the decks must be spaces of their own, with the wells joining them (backlog S1c, the "more deck layers" of HANDOFF 4e). S1 is the half of the job that had to come first: before it there was nothing above B deck to flood.

### 5.4 The validation cases [M: `tools/validate.js`, `out/validate.txt`]

| Case | Before S1 | With S1 |
|---|---|---|
| Titanic 1912 | founders 2 h 36 min | 2 h 37 min |
| Four forward compartments (Wilding: floats) | afloat, 2.0° | afloat, 2.0° |
| Five forward compartments (Wilding: sinks) | 2 h 12 min | 2 h 13 min |
| Olympic and Hawke | afloat | afloat |
| Britannic (about 55 min) | 50 min | 49 min |
| Britannic, ports shut | afloat, 8.8° | afloat, 8.5° |
| Titanic damage without the BR5 seam | 3 h 09 min | 3 h 08 min |
| Titanic damage stopping at hold 3 | afloat | afloat |
| Bulkheads to D deck | 2 h 46 min | 2 h 49 min |
| Bulkheads to B deck | afloat, 8.1° | afloat, 8.5° |
| Doors left open | 2 h 59 min | 2 h 57 min |

Every verdict is kept. Two of them rest on a bet: the two cases that float deep by the head (bulkheads to B deck; Britannic with her ports shut) lie for hours with the forward staircase's D-deck gangway doors 5 m under the sea. Held tight (`leakShell` 0, the default), she floats; leaking by a millimetre's gap (0.002), she founders after 7 h 40 min and 2 h 03 min (backlog S1d).

## 6. What each guess is worth [M: e25, `results_2026-11-19/e25_grand_staircases.txt`]

The 1912 damage, one guess moved at a time across its range, the flow parameters held (a refit would take some of each back).

| Guess | Range | Founders (in force: 157.23) | Forward dome (155.82) |
|---|---|---|---|
| A window's strength, 1.5 m | 0.5, 1.0, 2.5, 3.5 m | 155.83, 156.50, 158.70, 160.27 | 154.41 to 158.87 |
| The windows' area | half, twice | 158.98, 155.89 | 157.42, 154.60 |
| The discharge coefficient, 0.60 | 0.50, 0.70 | 157.66, 156.90 | 156.21, 155.52 |
| A wooden door's strength, 1.0 m | 0.7, 1.5 m | 157.23, 157.23 | 155.82, 155.82 |
| A dome's cover's strength, 0.5 m | 0.2, 1.2 m | 157.23, 157.23 | 155.82, 155.82 (the air opens it first) |
| No air path (the dome goes by the sea on it) | | 157.23 | 156.07 |
| The wells' free plan, 28 m2 | 24, 34 m2 | 157.23, 157.23 | 155.82 |
| The D-deck gangway doors' leak, 0 | 0.002, 0.03 | 157.02, 154.00 | 155.60, 152.57 |
| One staircase alone | forward, after | 157.24, 157.25 | |

Two guesses matter: how strong the windows are and how much glass there is; and whether the gangway doors leak like fire doors, which would be a second hole in her side from 1:17 on. The staircases' own numbers (door, dome, well) do not matter to when she founders; they set when each gives way, within seconds.

## 7. Tests, and what stays exact

`node tools/stairs_tests.js` (in the gate, quick; its print is tracked in `out/stairs_tests.txt`): 18 MUST rows.

- The two laws as functions: the upright one against a direct sum over its height (a midpoint rule), against a weir under its top and an orifice over it, continuous across its top, nothing at equal levels, more for more head; the level one the smaller of rim and area, equal at 1.5 A / P.
- The step carries them: one opening forced open on an undamaged ship set down until the sea stands a known head over it gives the law's flow to 1e-9, for a door, a dome and a row of windows; and what came in on that step is what the step reports, to 1e-9 m3.
- The tiers: what they enclose by the columns against a fine sum of the plan (within 2 %); every hull column where it was and none lower; wholly under water she displaces the hull and the tiers; every window in its tier's side.
- Neutral until wet: the openings' connections come after every other and start switched off; a ship the sea never brings to them (Olympic and Hawke) has the same bits with them as without, at every step; the 1912 damage has the same bits until the first is wet.
- Each opening gives way once and for good and says so once; saved and restored half way, the openings and their connections are as they were; the same damage twice gives the same bits; the water aboard is the inflow summed to one part in 10,000.

**What stays exact.** `C.buildShip({ tiers: 0 })` with `stairs: 0` is the core before S1, to the bit: the seams gate (`tools/seams.js`) and the coupled trial (`tools/trials.js`) run her so (`GATE_SHIP`, `GATE_PARAMS`), against the same frozen reference, and pass. The level solver's tolerance is set by what a space holds up to the hull's own top (`nodeVtol`), so the tiers do not loosen it.

**What moved, on purpose**, with the 1912 night's last minutes: the systems suite's fingerprint of the 1912 watch and the Carpathia acceptance's copy of it; the girder's record figures; in `out/` the golden trace, the validation table, the encounter's two tables (her sinking after the 1912 encounter, 156.4 minutes where it was 155.9) and the staircase suite's new table. The boats' fit, the reports' constant, the wreck's place, the night's and the trials' tables did not move.

## 8. Left open

In `BACKLOG.md`, section 2e: the decks above E deck as spaces of their own, with the wells the way down (S1c: where the staircases would do what Bo meant); the gangway doors' tightness (S1d); the windows' number, size and one-by-one breaking (S1e); air in her last minutes (S1f); the side doors of B and C deck (S1g); the tiers' plan in the core against the drawn one (S1h). The water in the tiers is drawn in the X-ray look, and each dome's cover is drawn where the core has its staircase and shown broken once it has given way (the topsides lane, the same day). Found on the way: the step makes a little water (C3); the core's older flow laws against the literature (K1); the hull's decks against the plan (G2).

Not run again yet: the Carpathia search (`tools/carpathia.js`, about 90 minutes). Its note of 18 November (the best orders buy 12.1 minutes; she needed 35 to 108) was made on the hull that stopped at B deck; its acceptance suite passes on the new model, its figures are to be made again before they are quoted.
