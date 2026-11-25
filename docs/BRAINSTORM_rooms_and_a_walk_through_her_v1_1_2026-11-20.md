# Brainstorm: her rooms, and a walk through her while she sinks (v1.1)

- **Written:** 2026-11-20 15:51 CST, by the Z2 session ("Titanic Z2: the deep", 66ad9a8d, Claude Opus 5.5), at Bo's ask. Bo asked for thoughts on v1 ("wait, see this and give thoughts first??") and then: "okay go with your own recommendations for now etc etc even for the brainstorm and for anything actionable that potentially stems from it etc".
- **Status:** a brainstorm. Nothing in it is a decision of Bo's. Bo did tell Z2 to act on its own recommendations, so the first stage below (W0, the walk on the core's water) is being built by Z2, on its own branch, as a part of the page. Every other stage waits for Bo.
- **Supersedes:** `docs/BRAINSTORM_rooms_and_a_walk_through_her_v1_2026-11-20.md` (another session's; unchanged, and still the reference for the sections this version does not repeat).
- **Lineage:** v1 (15:40, the session "Titanic Simulation Review") → Z2's review in chat (15:4x) → this v1.1.

Tags as in v1: [M] measured, [R] read, [D] derived, [B] bet.

## Changes in v1.1

1. **The licence decides before any tracing, not before publishing** (section 2.4). The repository is pushed to a public GitHub, and `wrangler.toml` publishes `dist/` as a site [R]. So a table of rooms traced from the plans becomes a published traced interior the day it is committed, whatever its rows cite. R0 gates R3, and until the terms are read the table lives outside this repository.
2. **The walk comes first, on the core's own water: a new stage W0** (section 9). It needs no new physics, no reader and no plan. The page already holds everything the core knows: each space's water level, the bulkheads with their tops and doors, the decks, and her lights. The independent rooms reader (R1) follows it.
3. **Three conflicts in the page that v1 did not name** (section 6.1): the keys (A, S, D and the arrows are the helm and the telegraph), the director (it cuts views and holds the pace), and the fall's copier (it copies whatever hangs under the ship group).
4. **The cost is per frame, not per step** (section 5.1). At the page's 900x the loop runs about 60 steps a frame, up to 700 at its cap; and the forecast worker runs whole watches on every order.
5. **The walker sees the core's water by default** (section 4.3). Way b stays the research model, and its water is a toggle; its disagreement with the core is shown as a number, never as the world the walker stands in.

## The answer in one paragraph

v1's three corrections stand: the plans are pictures, not CAD; inches are not what the flooding lacks; and 1x is a rule for walking, not for arithmetic. So does its design, the rooms as a one-way reader of the watch. Change the order. First, settle the licence, because this repository and its site are public: nothing traced goes in until the terms are read. Second, build the walk on the core's own water (W0). It is a part of the page with no new physics, it cannot disagree with her trim, and it needs no plan. It can be built now, by Z2, without touching anything queued. Only then build the independent rooms reader (R1), with its water as a toggle in the walk and its disagreement with the core as a number. Then tile by tile from the plans, if the terms allow.

## What stands from v1, unchanged

- 2.1 to 2.3: what the shop sells; inches from her frames; what no deck plan gives.
- 3: inches are not what the sinking lacks; what plans do buy.
- 4.1, 4.2, 4.4, 4.5: the table of numbers as the source; the graph of ponds and its laws; running always; one graph, five users.
- 5's per-step measurements (e71); 7 (Blender and Unreal); 8 (from pictures to numbers).

Read them in v1.

## 2.4 The licence (changed)

- **The repository is public.** It is pushed to a public GitHub, and `wrangler.toml` serves `dist/` as a static site with `npm run deploy` [R]. A table of rooms is a traced interior the moment it is committed, and the walk drawn from it is published with the next deploy. Citing a source on every row does not change that.
- **So R0 gates R3, not just publication.** Before a single tile is traced: read the terms, and decide where the table lives. It goes in this repository only if the terms allow it; otherwise a private store outside it, joined at build time on Bo's machine and never deployed.
- **The pictures** stay outside the repository in every case, as v1 says.
- **Not checked:** whether any plans from 1911 and 1912 (the builders' general arrangement, or the inquiries' exhibits) are free of rights, and could serve instead. That is a question for R0, not settled here [B].

## 4.3 Which water the walker sees (changed)

v1 picks way b (the rooms free, one way). For the research model, keep b: the gap between the two models is its most useful output. But the walker should not see that gap as the world. With b alone, a compartment the core is flooding, which sets her trim, would stand dry where the rooms have no path to it yet, and the walk would look broken exactly where it is most interesting.

- **W0 and the default:** the walker sees the core's own water. At level 0 (a deck in a watertight compartment, a side) that is exact: each such space is a slab of one of the core's 64 spaces, at that space's level [D].
- **From R1:** a toggle shows the rooms' water instead. The difference between the two is a number on the screen, per space, as v1 wants.

## 5.1 What it costs in the page (new)

v1 measured a step; the page runs many steps a frame [R: `site/app.js`, the frame loop].

| Pace | Core steps a frame | 2,500 rooms (33 us) | 12,000 rooms (264 us) |
|---|---|---|---|
| 1x (walking) | about 0.07 | nothing | nothing |
| 900x | about 60 | 2 ms | 16 ms |
| the loop's cap | 700 | 23 ms | 185 ms |

- These are with about a tenth of the rooms wet; late in the night, with most wet, a few times more [D from v1's own note].
- **The forecast worker** runs a copy of the whole watch to her foundering on every order the model owns (`Night.forecastOf`, `Night.forecast`). The readers are bundled into the worker too. The rooms reader feeds nothing back, so it must not be stepped in the forecast's copy, or every forecast costs seconds more [D].
- **Remedies, if needed:** step the rooms every few core steps when the pace is high; or keep only the wet compartments and their neighbours live.

## 6. The walk (changed: W0 first, and the page's conflicts)

### 6.0 W0: the walk on the core's water (new, built first)

Everything it needs is already in the page [R: `site/app.js`, `core/core.js`]:

| Need | Already there |
|---|---|
| each space's water | `sim.level[n]` and `sim.vol[n]` for the 64 spaces: the levels the X-ray look's free surfaces draw |
| the walls | `C.BULKHEADS`: each one's place, the deck its top reaches, its doors by deck; `sim.doorOpen` for whether its doors are open |
| the floors | `C.deckZ(deck, x)`, with her sheer; `C.halfBreadth(x, z)` for the deck's edge |
| her pose | the ship group's matrix (her frame to the page's), as the fall's mapping uses |
| the dark | the plant: her lights out when the dynamos fail |
| a view of a part's own | `TitanicApp.views` and the `camera` hook, as the crow's nest's eye does |

- **The walker** stands on a deck in her frame and moves on it. Down is the world's, so as she trims the deck becomes a hill and the sea tilts in the view.
- **Walls:**
  - the hull's side, by her half-breadth at that deck;
  - a watertight bulkhead, on every deck below its top;
  - its doors on that deck are passable only while the model has them open.
  
  E deck runs over most of the bulkheads' tops, so it is open fore and aft (Scotland Road).
- **The water** is a level sheet in each space at the core's level, seen in every look. Wading and being under water show as such [appearance].
- **Between decks:** a key takes the walker up or down a deck at the same place. The stairs as ramps wait for the rooms [B: an honest stand-in].
- **Pace and end:** the page's pace is held at 1 while walking. At the founder flag the walk ends: the fall is the deep's.
- **Its suite** gets these rows:
  - the keys move the walker and give no order;
  - the hull and a bulkhead stop it;
  - an open door lets it through and a shut one does not;
  - the water under its feet is the core's to a centimetre;
  - the pace is held while walking;
  - the director stands down;
  - a watch's fingerprint is unchanged by the part;
  - no console error.

### 6.1 Three conflicts in the page

- **The keys.** On a watch, A, D and S and the arrows give helm and telegraph orders [R: `site/app.js`, its keydown handler]. While walking, the part takes those keys first (a listener in the capture phase), so walking never gives the ship an order.
- **The director** (`site/parts/80_director.js`) chooses the view and holds the pace. While walking it stands down, or it would take the walker's eye away at its next cut.
- **The fall's copier.** After the flag, the page copies whatever hangs under the ship group and cuts it at the break (Z2's seam). An interior hung there would fall with the pieces, which is a gift later. But 100,000 to 200,000 triangles of walls copied per piece is heavy on a phone [B]. W0 draws its walls in a group of its own, posed by the ship's matrix each frame, and ends at the flag.

v1's sections 6 (moving, the slope, the water, the lights, sound, entering, doors) stand for the walk on the rooms (R2 on).

## 9. Stages, each with its test (changed order)

| Stage | What | Done when |
|---|---|---|
| R0 | The terms read. Where the table of rooms may live decided: in this repository only if the terms allow, otherwise outside it. Then the $40 package bought, its pictures kept out | a note with what the terms allow, and Bo's decision on where the table lives |
| **W0** | **The walk on the core's water** (6.0), a part of the page. No plan, no reader, no new physics | its browser suite (6.0's rows) and its gate row |
| R1 | Level 0 as a reader, free and one way, not stepped in the forecast's copy | v1's tests, and the cost at 900x and at the cap measured in the page |
| R2 | The walk shows R1's water as a toggle, and the gap between the two as a number | its rows in the walk's suite |
| R3 to R6 | As v1, after R0 | as v1 |

## 10. Doubts (added to v1's)

- **W0's stand-ins:** a key for stairs, doors placed by count where the model gives no place. Each is marked in the code, not hidden.
- **A walk at 1x is long** (v1). W0 enters at any minute of any watch, as v1 wants.

## 11. Decisions

Bo told Z2 to act on its own recommendations. Z2's calls, made on that word:

1. **W0 starts now, by Z2,** as a part of the page on its own branch. It touches no file another lane holds, apart from its gate row.
2. **Nothing is bought, and nothing traced, before R0.** Then the $40 package, as v1 says.
3. **Way b for the research reader (R1), with the core's water shown in the walk by default.**

Bo's still:
- R0: where the table of rooms may live, once the terms are read.
- Whether R1 and onward are wanted at all after W0 has been walked.

## 12. Sources

- **Read:**
  - v1 and its summary;
  - `site/app.js`: the keydown handler; the free surfaces' levels from `sim.level`; the `camera` hook; the frame loop's 700-step cap;
  - `core/core.js`: `deckZ`, `halfBreadth`, `BULKHEADS` with tops and doors, `nodeIndex`;
  - `wrangler.toml`; `CLAUDE.md` (the forecast worker and the readers).
- **Derived:** the per-frame costs, from v1's per-step measurements.
- **Not checked:** the plans' terms; the status of the 1911 and 1912 plans; W0's drawing cost on a phone (its suite will measure it).
