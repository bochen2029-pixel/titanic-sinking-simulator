# G26: her named places as one table, and the walk between two (design v1, 2026-11-24 01:41 CST)

NH2's side session wrote this at the coordinator's word (2026-11-24 01:24): "G26 is yours (her named places as one table,
and the distance between two along her decks and stairs over roomnet's graph)". The need is fork 2's: what the crew's
parts need from the model
(`BYOK_FORK2_g26_g27_what_the_crew_needs_2026-11-23.md`, in the coordinator's notes):

> A table of her named places in `core/` (a library with no state, as `cabins.js` is), each from R3's row: name -> x, y,
> z, deck and compartment ... and the distance between two of them along her decks and stairs.

They need it for who is in earshot of whom, and for how long a man takes to come with a report. Today `reports.js`'s
route delays are typed minutes, and the crew's cards say only "on the bridge".

## 1. What it is

`core/readers/places.js` is a library, like `cabins.js` and `girder.js`. It keeps no state, registers no reader, writes
nothing into a sim, and moves no fingerprint. It is bundled with the readers, so the page and every reader may read it.

- `PLACES`: the table, baked into the file, because core reads no data file at run time. Each place has:
  - `key`, `name`;
  - `deck`, `x`, `y`, and `z`, the height a man stands at in the ship frame (`C.deckZ`, or the nest's floor);
  - `zone`, `side` (`C.zoneAt`), and the compartment's words (`cabins.js`'s `compartment`);
  - `row`, the R3 row it stands in (or null);
  - `src` and `tag`: [read], [scaled], [derived] or [bet], with the reason.
- `place(key)` gives a place. `walk(a, b)` gives `{ m, climb }` from `WALK`, a baked matrix over the named places:
  metres along her decks and stairs, and the height climbed or descended.
- `tools/places_table.js --write` derives the numbers that come from R3's rows and the matrix, and rewrites the two
  baked blocks between their markers. `tools/places_tests.js` holds them, with a gate row in `--quick`. Its table is
  `out/places_1912.txt`: every place, and every walk with the rooms it passes.

No reader is changed. The disagreements below are printed, not settled. Moving `world.js`'s numbers, `site/app.js`'s or
`reports.js`'s typed minutes onto the table is the mainline's call, as fork 2 says: it may move fitted figures.

## 2. The places and their sources

| key | place | where | source | tag |
|---|---|---|---|---|
| `bridge` | the navigating bridge's front, centreline | Boat deck, x +72.5 | the topsides note: the front +72.5 on the centreline, curving to +69.6 at the cabs; BWC "190 ft. from the bow" gives +72.7 | [scaled] |
| `wing.port`, `wing.stbd` | the bridge's wing cabs | x +68.6 (cab +67.6 to +69.6), y about ±14.7 (0.4 m beyond the side) | the topsides note | [scaled] |
| `wheelhouse` | the wheelhouse | R3 Bt-12, its centroid | R3; the note gives +64.8 to +67.8 | [read] |
| `chartroom` | the chart room | about x +63, centreline | the note: "immediately abaft" the wheelhouse | [bet] |
| `wireless` | the Marconi room (and the silent room) | in R3 Bt-10, about x +48 | Bt-10 names them; the note puts them "abaft funnel 1's casing" (casing +50.7 to +59.4) | [bet] |
| `nest` | the crow's nest's floor | the foremast at the nest's height | `site/topsides.js`'s `nestOf` (the eye 29.0 m over her waterline, BWC "about 95 ft.") | [derived] |
| `socket.stbd` | the rocket socket, starboard | by emergency boat No. 1 (davits +65.7 to +66.2) | Boxhall, via `world.js` [read]; the davits, Read's davit article via the note | [bet] place |
| `socket.port` | a socket, port | by emergency boat No. 2 (+55.7 to +56.2) | a socket a side | [bet] |
| `lamp` | the Morse lamp | the starboard wing cab | NOT FOUND | [bet] |
| `platform` | the reciprocating engines' starting platform | the forward end of R3 O-024 (x -48.2 to -27.1), centreline, its floor | O-024 names "its platforms" | [bet] place |
| `switchboard` | the main switchboard platform | in R3 O-025 | O-025 names it | [bet] place |
| `stokehold.1` to `.6` | each boiler room's stokehold floor | R3 O-013 to O-023, their centroids | R3 | [read] |
| `mailroom`, `postoffice` | the mail room and the post office over it | R3 O-010 and G-018 | R3 | [read] |

These numbers disagree today (fork 2's row), and the table prints them beside its own:
- the bridge's front: 75.2 in `site/app.js` and 72 in `world.js`, against +72.5;
- the wireless room: 50 in `world.js` [bet], against about +48. Bride's "at the after end of the officers' deckhouse"
  would put it near +36 to +40;
- the rocket socket: 62 in `world.js`, against boat No. 1's davits at +65.7.

## 3. The walk

roomnet's graph shares a space's water. Its doors join rooms only within one slab, its stairs stop at E deck ("two
spaces, the core's own"), and nothing in it crosses a bulkhead or her centreline. A walk needs all of those.

**Nodes:** roomnet's rooms, unchanged: R3's row pieces in `rooms.js`'s slabs, and each slab's rest, each with its
centroid and floor.

**Edges:** roomnet's own walkable edges (doors, and stair rows' overlaps inside a space), plus the walk's own:
- a row's own pieces, joined to each other: a passage that crosses a bulkhead or the centreline is one room in R3;
- R3's doors between rows in different slabs: the nearest pair of their pieces;
- stairs and lifts across E deck: `overlaps(I)`, kinds `stair` and `lift`;
- each slab's rest joined to its neighbour's on the same deck, across a bulkhead above that bulkhead's `top`, and
  across the centreline (no longitudinal bulkhead but the bunkers');
- below a bulkhead's top, only through its watertight doors (`C.BULKHEADS[i].doors`).

**Not walkable:** casings, hatches, trunks and bunkers.

**Costs:**
- across a room, the plan distance between the points it is entered and left by (straight, a lower bound) [bet];
- a stair: its rise x 1.6 (a 38-degree stair's walking length) [bet];
- a door: nothing more.

Each place is a node at its own point, joined to the room it stands in. The nest is joined to the forecastle deck by
the foremast's ladder (its rise x 1.0) [bet].

**Answer:** Dijkstra over the graph at level 0. Nothing in the walk reads the water: a man walking through a flooded
passage is the readers' business.

## 4. What it does not do

- It gives no times. A reader turns metres and climb into minutes at its own pace. Fork 2's man "with a report" walks
  briskly, and a stoker's ladder is slower.
- It gives no earshot. A reader can set its own radius on the same table.
- It moves no fingerprint, and it changes no reader.

## 5. The suite (MUST)

1. Every place is inside her, on its deck (`z` equal to `C.deckZ`, but the nest), and inside the R3 row it names.
2. The baked numbers equal the tool's: the places drawn from R3, and `WALK`.
3. A walk exists between every pair, it is symmetric, and it is no shorter than the straight line.
4. Known walks, within 10 %:
   - the bridge to the wheelhouse is a few metres;
   - the bridge to the wireless room along the Boat deck is about 24 m;
   - a stokehold to the bridge climbs from the tank top to the Boat deck (about 19 m).
5. It is neutral: the library is pure, and a watch read with it has the fingerprint of one never read.

CHECK rows print the disagreements in section 2.

## 6. Open

- The wireless room's place: R3's Bt-10 is a strip. A better source (Bride's or Read's Marconi article) would settle +48
  against +36 to +40.
- The Morse lamp: NOT FOUND.
- Whether the escapes and ladders in the boiler rooms count as stairs: they are R3 `stair` rows where R3 has them.
