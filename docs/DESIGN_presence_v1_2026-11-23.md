# Presence: where everyone is, and who can reach whom. The design (v1)

2026-11-23 CST, fork 2 ("the BYOK lane"). It is the first part of "the watch of named men", after
`BRAINSTORM_byok_living_crew_v1_4_2026-11-23.md` (sections 26 to 32). Bo's word on its decision 10, whether to show
each named person on the page: "Yes, show them". **Status: a design. Nothing of it is built. It needs no key.**

Tags: [read] = read today in the code or the repository's research notes; [derived]; [bet] = a judgement to test or
a figure to source.

## 1. What it is

A reader that knows, at every step of a watch, where each named person is: at a place, or on his way between two.
From that it answers three questions:

1. Where is he? (For the page's marks, and later for what he can see.)
2. Can these two speak now? (Face to face within earshot, or by a line that is up.)
3. How long would word take from one to the other, and by what? (A voice, a telephone, a man on foot.)

It decides nothing about the flooding, the plant or the boats, and no fingerprint moves. Minds come later and stand
on it: a person's facts (the brainstorm's section 29) and his typed turns (section 30) need his place first.

## 2. The rules it keeps

- It is a reader like the others [read: CLAUDE.md]: attached to every watch, stepped after the model, its state
  (`sim.where`) plain data, neutral to the fingerprint, anything random drawn from the night's seed.
- It reads the model and the other readers. It writes only its own state.
- A person moved by the player or by an officer's decision moves by a logged order, so the night replays.
- It changes none of the six core files, and no other reader. Where another reader already times a journey (a man
  sent forward is back in 8 minutes), this reader shows that same journey: it never re-times it.
- A person or place with no source is tagged [bet] in the table, as the rooms' and the topsides' tables are.

## 3. The data

Three small sourced tables, inside the reader's file (the page cannot load `data/rooms` at run time). A test holds
each to its source.

### 3.1 Places

About forty named places. Each: an id, a name, a deck, a point (x forward of amidships, y to port, in metres), the
row of the rooms' tables it stands in, and its tag.

| Group | Places | Source |
|---|---|---|
| The bridge | the wheelhouse; the open bridge; the two wings; the chart room; the captain's rooms; the officers' cabins | `Bt-12`, `Bt-11`, `Bt-10`, `Bt-09` [read]; the open bridge and its wings have no row [bet] |
| The wireless | the Marconi room | inside `Bt-10` [bet: its place within the row] |
| The boat deck | the four groups of boats, port and starboard, forward and aft; the roof where A and B lay; the compass platform; the rocket socket | the boats' own x and side in `people.js` [read]; the platform between funnels 2 and 3 [read: the bridge note] |
| The staircases | the forward grand staircase's landings, Boat deck to E; the after one's, to C | `Bt-08`, `A-025`, `B-029`, `C-054`, `D-027`, `E-050`; `A-008`, `B-013`, `C-029` [read] |
| The working ways | Scotland Road, by sections; the crew stairs down from it; the firemen's spiral stairs and passage | `E-SR1` to `E-SR8`; `E-043`, `E-065`, `E-075`; `D-007` down to `G-007` [read] |
| Forward | the mail room and the post office; the forecastle; the crow's nest | `O-010`, `G-018`; `C-076` [read]; the nest has no row [bet, from the topsides' mast] |
| The machinery | each stokehold, 6 to 1; the engine room; the turbine room | `O-013` to `O-023`; `O-024`; `O-025` [read] |
| Aft | the poop and its docking bridge; the steering engine room | no row for the poop [bet]; `C-001` [read] |

- **The bridge has three places in the code today** [read]: x 75.2 for the bridge's eye in `site/app.js`, x 72 for
  its front in `core/readers/world.js`, and 64.6 to 66.9 for the wheelhouse in the rooms' table. This reader takes
  the wheelhouse from the table and puts the open bridge forward of it. It changes neither of the other files: it
  prints the three in a CHECK row, and the difference goes to the BACKLOG.
- **A short reading of the plans is wanted** for the places with no row or only a shared one: the open bridge and
  its wings, the rooms inside the officers' house one by one, the nest, the poop, the boat deck's open spaces, and
  the ladder from the bridge to A deck that the fourth officer used. It is the rooms' own method, on the same plans.

### 3.2 Ways

The ways between places, as a graph: each way has its two ends, its length along the deck, the decks it climbs, the
watertight door it passes if any, and the model's spaces it runs through.

- Along a deck, a way's length is measured between its ends' points [derived]. Between decks it runs by a named
  stair from the rooms' tables (82 stair rows exist; this table names the dozen that matter, by their row ids).
- **Paces** [bet, to source]: 1.4 m/s on a level deck; 10 s a deck by a stair; half as long again in a hurry.
- **A way is shut** while the model says so: its watertight door is down, or the water in a space it runs through
  stands above the deck there by more than half a metre. The route finder then goes round, or says there is no way.
- **A check against the model's own minutes** [read: `reports.js`]: a man sent forward is there in 4 minutes, to the
  mail room in 3.5, to the boiler rooms in 5, to the engine rooms in 6, aft in 7; the carpenter sounds in 6; the note
  to the chief engineer takes 4. The route's time for each must fit inside those minutes, with time left to look.

### 3.3 The watch bill

Each named person: his rank, where he is at 11:40, and the rules that move him. Every row cites its line of the
bridge note or the boats' note.

| Person | At 11:40 [read] | What moves him |
|---|---|---|
| Captain Smith | his quarters, "just inside" | the touch (on the bridge within a minute); his own visits to the wireless room; the boats |
| Murdoch | the open bridge, officer of the watch | the boats on his side, forward then aft |
| Moody | the wheelhouse, at the nest's telephone | the boats aft |
| Boxhall | coming out of the officers' quarters | every errand the bridge sends him on; the rockets and the lamp |
| Hichens | at the wheel | relieved at about T 43 |
| Olliver | the compass platform | sent for the carpenter; the note to the engine room |
| Rowe | the poop, by the docking bridge | the rockets, carried forward |
| Fleet and Lee | the nest | relieved at about T 20 |
| Lightoller, Pitman, Lowe, Wilde | their bunks, off watch | called when the officers are called; then their boats |
| Phillips | at the key | stays, until released |
| Bride | asleep beside the wireless room | wakes; carries messages to the captain |
| The carpenter | the working alleyway, sounding | the forecastle; the ladder to the bridge |
| Barrett | boiler room 6 | through to boiler room 5 as the door falls |
| Thomas Andrews; Chief Engineer Bell | not placed by the notes | [bet] his cabin; the engine room. Andrews's inspection is a journey of its own |

- **Events move people, not the clock.** The record's times are how the 1912 night went. On another night the same
  rules fire when their causes do: the touch, an errand ordered, the boats uncovered, the call ordered, a rocket
  ordered. The 1912 times are then a CHECK table, as the ledger's rows are: the reader's place for each person at
  each recorded moment, against the record's.
- **Where another reader already holds the journey, this one follows it** [read]:
  - an errand in the reports reader (`{who, t0, due, part}`): out at `t0`, looking at `due`, back when its line is
    delivered;
  - the boats' two parties, one a side, each at the boat it is working: the officer of that side stands there;
  - the rockets: a man aft for the box (10 minutes [bet] in the world reader), then at the socket.

## 4. Earshot and the lines

**Earshot.** Two people can speak when they are at the same place and near enough.
- In a room or the wheelhouse: across it.
- On an open deck: about 10 m [bet].
- While the steam blows off (`sim.plant.blow` above its threshold, the roar the page already plays): at arm's length
  on the boat deck [read: orders there "were shouted into the ear or given by hand"].
- In a stokehold or the engine room under way: close to [bet].

**The lines** [read: the bridge note].

| Line | Between | Up while |
|---|---|---|
| Telephones | the wheelhouse and the forecastle, the nest, the engine room, the poop | the lighting circuit has current, or their battery holds (`sim.reports.phone`, in join 16), and a man is at each end |
| Telephones | the chief engineer's cabin and the engine room; the engine room and each stokehold | the same |
| Engine telegraphs | the bridge and the engine room | always, but answered only with a man there and steam to obey |
| Bells, rockets, the lamp | one way | as the model has them |
| The wireless | to other ships only | as the model has it. Nothing joins the Marconi room to the bridge but a man on foot |

**Reach.** For any two people the reader lists how word could pass now, each with its time: a voice (none); a
telephone, if both ends are manned and the line is up; a messenger, by the route's time, plus a search if the man
sought is not at his post.

## 5. Orders

Two order types, the reader's own, logged like any other:

| Order | Value | Arg | What |
|---|---|---|---|
| `where:go` | a person | a place | He walks there by the best open way. Refused if there is no way, or he is not aboard |
| `where:fetch` | a person | | A messenger from the bridge goes to find him and brings him. The answer names the time it should take |

- Neither touches the model. They move people, and people's places decide who can speak.
- The orders other readers own (`report:look`, `help:call`, `boats:uncover`) keep their effects and their timing
  exactly. Presence shows the man going; it does not delay what the model already does.
- Whether the player himself must walk, send and wait as his character would is the brainstorm's decision 11, still
  Bo's. Until then the player's orders are given from the bridge whatever the marks show.

## 6. What the page shows

Bo's decision 10: the people are shown.

- **A list, "Who is where",** in the crew's part of the side panel: each person, his place, and where he is going
  with the time left.
- **Marks on the damage diagram:** each person a small labelled mark at his place along her and at his deck. The hook
  is the one the cabins' part brings in join 16 (`TitanicApp.diagramMark`), asked to carry many marks.
- **In the walk:** a plain figure with a name where a person stands on the walker's deck [appearance], and a line
  saying whether he is in earshot.
- **Not yet:** a plan view of each deck. The page has none today; it would serve the rooms and the cabins as well.

## 7. Tests

`tools/whereabouts_tests.js` (headless), every row a MUST unless marked:
1. **Neutral.** The 1912 watch has the same fingerprint with the reader and without, at every step. The forecast
   leaves its state behind.
2. **One place each.** At every step every person is at one place or on one way; nobody moves faster than the pace;
   nobody passes a door that is down or water over the limit.
3. **It follows the other readers.** A man sent is out at the errand's `t0`, looking at its `due`, back when its line
   is delivered, to the step.
4. **The tables hold to their sources.** Every place with a row lies inside that row's x and y on its deck. Every
   named stair is a stair row linking those decks. The [bet] places are listed.
5. **The model's minutes** (CHECK): each errand's route time against `reports.js`'s minutes.
6. **The 1912 night against the record** (CHECK): each person's place at each recorded moment.
7. **Earshot and the lines.** Quiet against the roar. The telephones with current, on their battery, and dead (the
   dynamo flat flooded by hand). A line with nobody at one end.
8. **Orders.** `where:go` and `where:fetch` accepted and refused as they should be; a night replayed from its log
   puts everyone where they were.
9. **The bridge's three places** (CHECK): the three values printed, until they are one.

`tools/whereabouts_site_test.js` (a browser): three people's marks at the right pixels at three times; the list
agrees with the reader; a figure stands in the walk on the walker's deck; the fingerprint and the layout unchanged.

## 8. The order of building

1. The three tables, the route finder and their tests (4, 5, 9). No state yet.
2. The reader: stations, the journeys it follows, the rules that move people, the two orders (1, 2, 3, 6, 8).
3. Earshot, the lines and reach (7).
4. The page: the list, the diagram's marks, the walk's figures.
5. Then, as their own designs: each person's facts with their provenance, and the minds.

## 9. Open, and not in this design

- **The paintbrush test** (Bo, 2026-11-23): a hole punched anywhere should reach the crew only by the model's own
  chain. The damage brush works on a preset today, and the readers attach to a watch. Either the readers come to
  every run, or a brushed hole becomes a logged event on a watch. That touches `core/night.js`, so it is a change to
  agree with the coordinator, not part of this design.
- **The plans' short reading** (section 3.1).
- **Crowds and passengers,** the list's and trim's effect on a man's pace: later.
- **Decision 11,** the player's own body (section 5).
