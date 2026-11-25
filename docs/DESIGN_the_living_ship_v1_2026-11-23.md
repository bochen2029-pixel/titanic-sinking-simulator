# The living ship: her systems' graph as built, the gaps, and a nervous-system view (NH15), v1

- **Written:** 2026-11-23, 11:10 CST, by the U0 lane (Claude Code, Opus 5.5; worktree u0-export-af54fe), from the
  coordinator's brief (`COORD_brief_U0_living_ship_2026-11-23.md`) on Bo's go ("Yes, task U0"). Bo's ask, in his
  words: "make it a living breathing ship ... if all the coal boiler rooms flooded then its not making steam, if its
  not making steam then the engine room is not turning turbines if that isn't happeneing then the dynamios etc are not
  making enough electric power, if that isn't happening then the most of the ship lights go dark, and maybe morse code
  doesn't work, and so on ... the interplay and systems logic of it all, the dependancies ... if the props are out of
  the water and in the air, then no matter how it spins or what speed is being commanded then the ship gets no
  propoulsion".
- **Status:** advice only, a design. Nothing here is built or decided. Parts 4 and 7 are proposals for the
  coordinator and Bo.
- **Supersedes:** none (the first version).
- **Lineage:** the plant's design, `docs/DESIGN_ship_systems_v1_2026-11-16.md` and v1.1 (Y1 to Y4, all built since);
  its sources, `docs/research/RESEARCH_ship_systems_plant_v1_2026-11-16.md`, the pumps', the bridge's, the wireless's
  and the break's research notes; `docs/BRAINSTORM_the_next_horizon_v1_1_2026-11-23.md` (NH14, the simulator as a
  flooding dynamics model); QC C-3 (the page's one clock), QC C-4 (the stage's one layout) and D84 (desktop first).
- **How it was made:** three read-only agents traced the code and the repository's sources on a plain copy of main
  `960782e`, and two of their findings were checked by hand (F1, F2). Every `file:line` below is at `960782e`.

## The answer in one paragraph

Most of Bo's chain is built and tested (`tools/systems_tests.js` makes each link fail and checks what follows). Water at
a boiler room's furnaces puts its fires out. The fires raise the steam. The pressure drives the engines, the turbine
through their exhaust, the steering engines, the pumps and the dynamos. The dynamos light her and run the stokehold
fans and the doors' switch, and a screw or the rudder out of the water does nothing. Where it is thin is electricity
and men:
- one light level for the whole ship (1, 0.15 or 0), with no circuits;
- the emergency dynamos on the main pressure, though they had a steam line of their own;
- the wireless's 5 kW motor is not a load on the plant;
- the crew are fixed rules, not a state;
- the break is a 20-degree stand-in, and the lights stand frozen through the fall.

The design proposes three steps:
- a nervous-system view: a page part showing every node green, amber or red with its reason and time, on the graph
  as it stands and neutral to the watch;
- a set of reader and page fixes, all neutral;
- the plant's own gaps (the crew, the fans' stop, an electrical load, the emergency dynamos' steam), which move the
  watch and so belong to the epoch's next refit.

## 1. The graph as built

Short names:

| Short | File |
|---|---|
| S | `core/systems.js` |
| M | `core/motion.js` |
| K | `core/core.js` |
| N | `core/night.js` |
| W | `core/readers/world.js` |
| PE | `core/readers/people.js` |
| R | `core/readers/reports.js` |
| A | `site/app.js` |
| P/ | `site/parts/` |
| T/ | `tools/` |

Heights are metres above the keel. Tags are as the code writes them; "[derived here]" is this design's.

**wet(k, h)** (S:186-190) is the plant's test of a room: true when any of zone k's four spaces holds more than
0.5 m3 and its level stands at or above `worldZ` of (zone's mid-x, y 0, floor + h). It reads `sim.vol` and
`sim.level` only, never the pockets. The floor is the tank top, 5.25 ft = 1.60 m (K:570, K:1327).

**The step's order.** On a watch `Sys.step` runs before the encounter, motion and core step (N:321-323), so the limits
come from the previous step's state. On a preset it runs after `C.step` (A:3432).

### 1.1 Coal, fires, steam, pressure

| From | To | Law | Numbers | Where |
|---|---|---|---|---|
| coal aboard | each room's bunkers | at attach, `coal[k] = coalAboard * lit_k / 48`; `opts.coal` overrides; `coalFor(h) = h * 750 / 24` | 3,050 t [derived]; rooms 6 to 2 hold 508, 635, 635, 635, 635 t; room 1 0 | S:80, 143-145, 470; rooms S:27-31 [read: The Shipbuilder] |
| water at the furnaces | a room's fires | `out[k]` latches at wet(zone, furnaceAbove); then `fires -= dt / quench` | furnaceAbove 1.0 m over the tank top (2.60 m) [bet]; quench 45 s [bet] | S:32-33, 207-210 |
| an order | a room's fires | `drawFires` latches `drawn`; `fires -= dt / drawTime`; fires never come back | drawTime 1,200 s [read] | S:34, 208, 463-468; N:210; A:2457 |
| empty bunkers | a room's fires | `fires -= dt / burnOut` | burnOut 900 s [bet] | S:35, 209 |
| the fires | supply | `gen = sum of lit * fires`; 0 once `broken` | boiler room 1 has lit 0, never tested | S:205-215 |
| main dynamos (last step) | the stokehold fans, supply | without main power `gen *= natDraught` | natDraught 0.65 [bet]; the 12 fans are one factor | S:58-60, 217 |
| demand (last step) | the stokers' firing | idle past bankDelay: firing relaxes to clamp(bankMargin * demand / cap, 0.05, 1) | idle 0.1, bankDelay 600 s, bankTau 1,200 s, raiseTau 300 s, bankMargin 1.2 [bets]; the 0.05 floor inline | S:61-68, 220-224 |
| the engines' revolutions | demand | `demand = aux + (1 - aux) * (abs(nP) nP^2 + abs(nS) nS^2) / (2 nSteam^3)` | aux 0.04, constant [bet]; nSteam 78 rpm [read] | S:37-40, 226-227 |
| supply less demand | pressure p | `p += (can - demand) * dt / store`, clamped to [0, 1] | store 300 s [bet]; 215 psi [read]; event `p80` under 0.8 | S:36, 81, 229-230 |
| her trim | the steam mains | trim over breakTrimDeg latches `broken`; gen 0; p falls with breakTau | 20 degrees, 10 s [bets] | S:74-75, 203, 215, 229 |
| pressure, demand | steam raised `gen` | at p >= 1 with the engines working, what she uses; else what the fires can raise | Y1b | S:233 |
| steam raised | coal | `burn = min(gen, demand) * 750 / 86,400 * dt` t, shared by `lit * fires / gen` (see F1) | 750 t a day at full power [derived] | S:79, 239-240 |

### 1.2 Pressure, engines, screws; exhaust, turbine

| From | To | Law | Numbers | Where |
|---|---|---|---|---|
| pressure | the engines' limit `nMax` | `pe = (p - 0.35) / 0.65`; `nMax = 80 cbrt(pe)`, 0 at pe <= 0, 80 at pe >= 1; 0 once `re`; both shafts alike | pEngine 0.35 (75 psi) [bet]; 80 rpm [read: 78 normal, 83 recorded] | S:38, 41-43, 261-263 |
| `nMax` | the wing shafts | `limited()` clamps the order's magnitude, ahead and astern; shaft rates | down 5, up 1, astern 1.5 rpm/s, dead time 5 s [bet: Cone via Halpern] | M:90, 333-337 |
| no steam | a stopped wing screw | drags as held (`SHIP.stopped`, M7) | | M:84-85, 280-282 |
| the wing engines | the turbine, the centre screw | in when both orders >= 50 and nP, nS > 40 (inline) and the turbine room dry; `nC` goes to 0.5 (nP + nS) * 2.2 over 10 s; out, to 0 over 30 s and a drag Cdw 0.10 | turbineRatio 2.2 [Thearle]; Cdw 0.10 [bet]; the 50 [Fleming, Wilding] | M:49-50, 175, 284, 338-341 |
| the turbine | demand | none: the turbine adds no demand | | S:227 |
| `nMax` | events | `slow` under the order; `nosteam` at 0 | | S:264-266 |

### 1.3 Pressure, steering, rudder

| From | To | Law | Numbers | Where |
|---|---|---|---|---|
| pressure | the steering engines | `steerRate = clamp((p - 0.25) / (100/215 - 0.25), 0, 1)`; `steer = steerRate > 0` | full rate from 100 psi [read]; the 54 psi floor [bet] | S:44, 268-269 |
| steering | the rudder | rate 4 deg/s x steerRate, at most 40 deg; without steam the command freezes at the angle it has | 4 deg/s [bet] | M:52, 343-345 |

### 1.4 Dynamos, light, fans, the doors' switch

| From | To | Law | Numbers | Where |
|---|---|---|---|---|
| water at the dynamo flat (zone 12) | the main sets | `el` latches at wet(12, dynamoFlat) | 1.0 m over the floor (2.60 m) [bet] | S:46-47, 244 |
| pressure, `el` | main power | `power = !el && p > 0.3`, recomputed each step (not latched) | pDynamo 0.3 (64.5 psi) [bet] | S:45, 245 |
| the sea at D deck in zone 11 | the emergency sets | `emWet` latches; `emergency = !emWet && p > 0.3`: the main sets' pressure | about 16.9 m (54.25 ft and the sheer) | S:69-73, 247-248; K:574, 600-604 |
| power, emergency | her lights | `lights` = 1 on main power, 0.15 on the emergency sets alone, else 0; events `mainDark`, `dark` | 0.15 [bet] | S:249-252 |
| main power | the fans | the factor in 1.1 | | S:217 |
| main power | the doors' switch | the bridge's switch releases the doors only with main power; else `doorsDead` | | S:175-181 |

### 1.5 The pumps

- **Pressure to pumpScale:** `clamp((p * 215 - 30) / 50, 0, 1)`, from 30 to 80 psi [bet] (S:114, 254). The pumps
  need no dynamo [read] (S:85).
- **The core's law:** each running pump draws `q * pumpScale` from the layer-0 spaces down to pumpStrum. It stops for
  good when its room's water stands more than pumpAbandon over the lowest point. pumpStrum 0.1 m and pumpAbandon 2.3 m
  are both [bet] (K:1035-1038, 2263-2285).
- **The 1912 preset's schedule:** room 5's 250 LT/h at 10 min; room 4's own 150 and room 3's 195 through the main at
  30 min (core/scenarios.js:92-96).
- **The engineers' rules:**
  - On when not scripted and she is under way (S:152). Off at the bridge's first pump order, on again with the order
    `engineers` (S:395, 399-404).
  - A room's own pumps start pumpOwn after water is first seen there: at least 1 m3, read from `sim.vol` only. pumpOwn
    300 s [bet]; the pumps' table [read: British Report; Wilding] (S:86-97, 102, 287, 309-318).
  - Pumps are led through the main once, pumpLent after first water. Rule 0 skips a room that is lost at that instant;
    rule 1, dark until the epoch's landing, judges each room once by its inflow against its pumps (S:101-103, 112-113,
    289-303, 320-335).
  - leadRule, pumpLent and leadRatio are the epoch's: G18, D90.
- **Bridge orders:** `pumpOrder` (S:390-460, through N:213) refuses an order when:
  - there is no steam (S:423);
  - the pump is in a peak, or in a hold after the firemen's passage has flooded (S:371-372);
  - its room is lost, its suctions or the main are full, or no pump is free.
- **The firemen's passage:** water in hold 2 or 3 above 4.6 m latches `passageT` (S:257; K:1022).

### 1.6 The watertight doors

- **The floats:** at attach, every shut `low` door is armed, 11 bulkheads D to O (S:162, 173; K:824-834). Doors a
  scenario holds open stay unarmed. A float releases its door when either neighbour's layer-0 water stands more than
  floatDepth 0.5 m [bet] over the lowest point (K:2192-2198, 1032).
- **The bridge's switch:** needs main power; it releases every low bulkhead's doors (S:175-181; N:209; A:2150).
- **A released door:** falls for doorFall 25 s [bet], then shuts (K:2176-2190, 1032). One open flag per bulkhead
  drives all its door connections (K:1540-1550, 2172), so the switch also shuts the F, E and G-deck doors of
  bulkheads D to O.
- **By hand:** `openDoor` turns the switch off and opens a door at once; `releaseDoor` closes one (S:182-183; N:207).

### 1.7 Flooding's knock-outs

All latch for good, tested at the zone's mid-x.

| What | Zone | Height (m above the keel) | Tag | Where |
|---|---|---|---|---|
| a boiler room's fires (rooms 6 to 2) | 4 to 8 | 2.60 (1.0 over the tank top) | [bet] | S:32, 207 |
| the reciprocating engine room (`re`) | 10 | 3.80 (crank) | [R1 measured] | S:46, 242 |
| the turbine room (`te`) | 11 | 4.82 (turbine axis) | [R1 measured] | S:46, 243 |
| the dynamo flat (`el`) | 12 | 2.60 | [bet] | S:46-47, 244 |
| the emergency sets (`emWet`) | 11 | about 16.9 (D deck) | [bet] | S:73, 247 |
| the firemen's passage (`passageT`) | 2, 3 | 4.6 | | S:257 |

### 1.8 Her pose: the screws and the rudder

- **The screws:** each screw's immersed share is the part of its disc under the sea: `immersed(d, R)`, d the depth of
  its centre (S:192-195, 271). The discs [measured] (S:52-53):
  - the wing screws at x -119.82, y +/-6.0, z 3.80, R 3.58;
  - the centre screw at x -126.51, z 3.75, R 2.59.
- **Their thrust** is multiplied by `imm` [bet: no ventilation law] (M:285-286). Events fire at sums of immersion
  under 2.9, 1.5 and 0.05 (S:273-275).
- **The rudder:** its waterline is the sea at x -129.54 less a heel and a slack. heel 0.3 m and slack 0.5 m are both
  [bet]; the trace is [measured] (S:57, 127-139, 277-279). Its force is multiplied by `rudImm` with headway and with
  sternway (M:299, 317).

### 1.9 The safety valves and the roar

- **Blow-off:** `blow = gen - demand` at p >= 1 with steam to spare (S:235), which in effect needs demand under 0.1
  (S:233).
- **Events:** `blowoff` fires past 0.25 (blowEvent, untagged), `banked` under firing 0.5 (S:68, 236-237).
- **The escape pipes** are appearance only: the page's jets and roar (A:1390-1438, 2314).
- **When the valves lift:** 9.25 s after the order to stop (BACKLOG:58).

### 1.10 The readers

The readers read the plant and write nothing back. A watch's fingerprint is the same with them as without.

**The wireless, the Morse lamp and the rockets** (W; it writes nothing into the plant: W:7-8):
- **The bus:** main, then emergency, then none. The change-over to the emergency sets leaves 2 min without current
  (changeover 2 [bet]) (W:89, 248, 252).
- **Pressure to voltage:** 100 V at p >= 0.5, 0 V at p <= 0.3, 70 to 100 V linear between. vBus is [derived]; pFull
  and vSpark are [bet] (W:76, 81-85, 235-239, 249).
- **Voltage to reach:** 1,500 nm [read] at 90 V or more; proportional from 70 to 90 V; no spark below 70 V
  (W:84-86, 240, 253).
- **The battery:** thrown in 2 min after the set is found dead with a call due, if the wireless room is dry. 150 nm
  [bet] for 6 h [read] (W:87-88, 256-257).
- **The wireless room:** dead for good once the Boat deck at x 50 [bet] is under the sea (W:80, 230, 245, 260).
- **What needs a working set:** every message, and the other ships' replies. A ship hears the call while she is
  within reach and her operator is on watch (W:274-280, 336, 344-356).
- **What the plant sets in the messages:**
  - `blow > 0.02` at the first call plus 11 min gives "Sinking; cannot hear for the noise of steam" (W:282-284);
  - `out[3]` gives "Engine room flooded", and 14 min later "Come as quickly as possible" (W:288-289; see F2).
- **The Morse lamp:** works while `lights > 0` and the bridge is dry. Its tag says "on the emergency circuit's
  change-over [read]", but no change-over delay is applied (W:106, 232, 430-437; F9).
- **Rockets:** need no power. 36 carried [read], seen within the horizon's reach (W:96-111, 295-310).
- **No load edge:** the 5 kW motor-generator (W:81) is never added to the plant's demand (S:37, 227; F10).
- **At the flag** the set falls silent for good (W:381-386).

**The boats** (PE):
- **Light:** lit if `lights > 0`; the emergency light counts as lit [read] (PE:193).
- **The dark** halves the work (x 0.5 [bet]): uncovering, hooking, the parties' walk, loading and lowering (PE:140,
  217, 256, 268, 310, 337, 340, 376).
- **Her trim and list:**
  - trim sets the passengers' willingness to come forward [fitted] (PE:147, 159, 201, 279, 300);
  - trim beyond 5 degrees slows the lowering by 10 % a degree [bet] (PE:135, 376);
  - list sets the boarding gap on the low side (PE:131-132, 327-339);
  - list over 15 degrees away from a boat stops its lowering (PE:134, 353, 377-378).
- **Her drop to the sea** at each davit sets when a boat is lowered, when a station stops, and when a boat floats off
  (PE:105, 141-142, 195, 237-241, 350-352, 380-381).
- **Her speed** limits the lowering (PE:136, 192, 333).
- **The davits** are worked by hand, with no plant edge (PE:130).

**The reports to the bridge** (R):
- **The only plant field it reads** is `pumpT[k] >= 0`, for "its pumps on it" (R:77, 103, 285-289).
- **The rest is water, pose and men:**
  - the sounding past pumpAbandon: "its men have left";
  - first water, with its delays;
  - the mail clerk and the steward;
  - the commutator;
  - the forecastle head's freeboard.
  (R:48, 115-138, 288-294, 426-475).
- **The telephones** have no power edge. After the designer's estimate, a call goes unanswered with probability 0.3
  [bet] (R:139-140, 503-505).
- **The designer's forecast** is a restored copy stepped by `C.step` alone, without the plant (R:189, 396-412).

### 1.11 The page, its parts and U3

**The page's lights:**
- `lights` fades to 1, 0.15 or 0 over 3 s of model time [appearance] (A:1333-1345).
- `lightsOut` records the time and the cause (A:1350-1356, 3413, 3432):
  - "the dynamos flooded";
  - "the steam mains broken";
  - "no steam for the dynamos".
- The ports and windows share one `uOn`, 7 in 10 lit [appearance] (A:954-955, 1316-1324; site/visuals.js:388-403).
- **A port under the sea is still lit, drawn at 40 % and blue-green; it is never put out** (A:1323-1324; F6).
- The navigation lights follow the fade (A:951-959, 2072).
- In the Night look:
  - the reflections share `uOn`;
  - a port under the sea glows through for about 5.6 m;
  - the deckhouse windows glow with no sea test.
  (P/20_night_scene.js:49, 229-243, 294-297, 350-367).

**Steam, smoke and sound:**
- `blow > 0.02` draws jets from the escape pipes and the roar, its gain 0.06 x min(1, blow) [appearance]
  (A:1408-1438, 2314).
- **The page's smoke ignores the plant:** three funnels every second, always, placed by her pose (A:1377-1385; F7).
- Funnel 1 falls when the sea reaches its seat (A:677, 721).
- The engine beat follows `mo.nS`, which the plant limits (A:1460, 3415-3418).
- In P/30_sound.js, which reads no plant field (lines 37-56, 106, 206, 310-343):
  - the engines follow `nP` and `nS`, limited by the plant;
  - the water follows the inflow;
  - the creaks follow pitch;
  - the bell is struck by the clock;
  - everything is silent when she has gone.

**The readouts and the other parts:**
- The steam line and the Systems tab read `SY.readouts` (A:2355-2451).
- The plant's events become toasts (A:2295-2307).
- The help part disables the Morse lamp at lights 0 (P/70_help.js:80).
- The walker carries a lamp at lights 0 (P/76_walk.js:44-49, 295, 397).
- The director cuts to "steam" on `blowoff` and to "lights" under 1 (P/80_director.js:53, 66, 99, 107, 120).
- **The end card** says "Her lights went out at ... (why)" or "Her lights burned to the end". It says nothing of the
  emergency stage or of the steam, and nothing about the lights when she broke (P/40_night_end.js:124-126; F8).

**U3:**
- `tools/u3_lights.js` puts each light out at the record's `plant:mainDark` and `plant:dark`, or when the sea
  reaches it, and never relights it (lines 4-8, 25-29, 39-78).
- `tools/u3_smoke.js` gives steam while `blow > 0.02`, and smoke from `gen` and `fires`. Its rows: the fires never
  rise again, and a flooded room's fires are out within 45 s (lines 4-8, 24-71).

### 1.12 At the break and at the flag

- **The plant's own "break"** is trim over 20 degrees [bet]. The steam is gone in 10 s, and the whole ship goes dark
  at once ("the steam mains broken") (S:74-75, 203, 215, 229, 245-251; A:1354). On the 1912 watch she goes dark at
  2:18 am and founders at 2:18 (docs/guide/shots.json:314, 319).
- **At the founder flag** neither the watch nor the page steps the plant (N:315-319; A:3401, 3438). Her lights and
  power stand frozen through the fall, and the pieces' copied materials share `uOn` (A:3109-3127).
- **The break design** would cut "the steam mains and the dynamos' leads where they cross x*"
  (docs/DESIGN_the_break_and_two_bodies_v1_2026-11-19.md:115). It is not built.

### 1.13 What the plant writes, and who reads it

| Field | Read by (beside the page's readouts and the suites) |
|---|---|
| `mo.plant.nMax`, `turbine`, `steer`, `steerRate`, `imm`, `rudImm` | M:280-345 (the shafts, the turbine, the rudder); T/carpathia.js:167 |
| `lights` | PE:193; W:232; A:1338-1352 (ports, navigation lights, the Night look); P/70_help.js:80; P/76_walk.js:397; P/80_director.js:107, 120; P/40_night_end.js:124; T/record_night.js:110 (U3) |
| `power`, `emergency` | S:177, 217 (the doors' switch, the fans); W:248; A:2419-2422; T/record_night.js:110 |
| `p` | W:249 (the wireless's voltage); A:2360-2389; T/record_night.js:110 |
| `gen`, `blow`, `firing`, `fires` | W:283; A:1409-1411, 2314; T/record_night.js:110-112 (U3's smoke and steam) |
| `out`, `re`, `te`, `el`, `emWet`, `broken` | W:288 (`out[3]`); A:1354, 2359-2452; T/carpathia.js:127 |
| `pumpT` | R:289 |
| `events` | A:1339, 1353, 2307; P/80_director.js:99; the suites |

### 1.14 Findings in the graph as built

These need an owner's look. They are listed again with the gaps in part 3.

- **F1, the coal share (S:239-240):** checked by hand.
  - **What the code does:** the coal burnt is shared out by `lit * fires / gen`, after `gen` has been multiplied by the
    firing and, without main power, by natDraught (S:217, 223). The shares then sum to 1 / (firing * natDraught), so a
    banked or natural-draught step burns up to twenty times its steam's coal.
  - **Its effect:** harmless to the night [derived here]. At the auxiliaries' demand about 2.5 t becomes about 50 t of
    3,050, and no bunker empties. The bunker readouts are still wrong, and `tools/systems_tests.js` pins the coal "to
    the bit".
- **F2, "Engine room flooded" (W:288):** checked by hand. The wireless sends it when `out[3]` is set: boiler room 3's
  fires out (S:27-31). The engine room's own flag is `re`. The record's next message speaks of the engine room
  "filling up to the boilers", so boiler room 3 may be a meant stand-in. The comment does not say.
- **F3, the emergency sets' steam:** they share the main pressure (S:248). The British Report gives them a steam line
  of their own above E deck, with branches from boiler rooms 2, 3 and 5 (RESEARCH_ship_systems_plant_v1:133). So
  today the break stops both sets on the same step.
- **F4, bulkhead C's F-deck door** is never switched or floated (K:824-834, 1540-1550).
- **F5, the doors' interlock** ("Doors cannot ... be operated mechanically whilst switch is on") is not enforced:
  opening a door by hand just turns the switch off (S:170-171, 182).
- **F6, the page's ports under the sea stay lit,** drawn dimmer (A:1323-1324). U3's go out (`tools/u3_lights.js:25-29`).
- **F7, the page's smoke** ignores the fires and the steam (A:1377-1385). U3's follows `gen` (`tools/u3_smoke.js:4`).
- **F8, the end card** says nothing of the emergency stage, of the steam, or of the lights at the break
  (P/40_night_end.js:124-126).
- **F9, the Morse lamp's change-over** is tagged [read] but not applied (W:106).
- **F10, the wireless's motor-generator** (5 kW on the 100 V bus) is not on the plant's demand; aux 0.04 is
  constant (S:37, 227; W:81).
- **F11, "Twelve" tank-top doors** in the comment (S:166); the table has 11 (K:824-834).
- **F12, the steering engines' own flooding** is not mentioned anywhere; their steam pipe's route aft is BACKLOG's
  Y11.
- **F13, the turbine** adds no demand (S:227), and the screws have no ventilation law (M:285).

## 2. Bo's list

| His link | Status | Where | What is missing |
|---|---|---|---|
| "all the coal boiler rooms flooded then its not making steam" | Built | 1.1, 1.7; systems_tests "boiler rooms 6, 5, 4 flooded at Full ahead" | The crew: fires drawn by men, per the record (G4) |
| "not making steam then the engine room is not turning turbines" | Built | 1.2: pressure limits the wing engines; the turbine runs on their exhaust above 40 rpm; the engine rooms flood out at the crank and the turbine's axis | The turbine's own demand (F13) |
| "the dynamos etc are not making enough electric power" | Built, all or nothing | 1.4: the main sets need 0.3 of pressure and a dry flat | An electrical load (G6); the emergency sets' own steam (G3, F3) |
| "the most of the ship lights go dark" | Partly | 1.4, 1.11: one level for the whole ship (1, 0.15, 0) | Lights by circuit, the sea shorting them (G1); the break (G2); the page's ports under the sea (F6) |
| "maybe morse code doesn't work" | Built | 1.10: the wireless's voltage follows the pressure, with the change-over, the battery and the flooded room; the Morse lamp needs light and a dry bridge | The motor's load (F10); the lamp's change-over (F9) |
| "and so on ... the interplay ... the dependancies" | Mostly built | 1.3 to 1.6, 1.10: steering on pressure; pumps on pressure (30 to 80 psi); doors' switch and fans on the main sets; boats slower in the dark; the wireless's messages on the steam and the flooding | The crew (G4), the fans' stop (G5), telephones and signals (G7) |
| "if the props are out of the water ... no propoulsion" | Built | 1.8: each screw's thrust times its immersed share; the rudder's force times its own | A ventilation law (F13: a bet today) |

## 3. The gaps

Each gap has its sources (from the repository's notes; short names as above, notes in `docs/research/`), what the
model does, a proposal, and the questions it would have to settle.

### G1. Lights by circuit: the sea shorts a section before the dynamos fail

- **Sources:**
  - About 10,000 lamps on the main circuit, and 500 on the emergency circuit (British Report,
    RESEARCH_ship_systems_plant_v1:135-136).
  - The main switchboard gallery at orlop level (ibid.:128).
  - Barrett's stokehold lights were out about 10 min while the alleyway's burned. His guess: "changing over to the
    other engine" (ibid.:102).
  - Ranger agreed that flooding blows the fuses (ibid.:144).
  - Not found: how the mains were divided, and which boat-deck lamps were on the emergency circuit.
- **Model:** one level for the whole ship (S:249-252). U3 alone puts out each light the sea reaches.
- **Proposal:** a circuit table as data, by deck and compartment and side. It is [bet] where the sources are silent,
  and each circuit is named main or emergency. A reader keeps each circuit's state:
  - lit while its supply has current and the sea has not reached its section;
  - out once the sea reaches it, a fuse blown, for good.

  The plant keeps the supply. The page and U3 draw lamp by lamp from the circuits. The next horizon's NH14 asks for
  the same in the contract: "a light group per deck follows the dynamos" (BRAINSTORM_the_next_horizon_v1_1:98).
- **Questions:**
  - Is a circuit a deck, a compartment, a side, or main against emergency only?
  - Does a short drag down the supply, or only blow its fuse? The sources point to the fuse.
  - Do the emergency lamps outlive the main lamps in a flooded section?

### G2. The lights at the break, and through the fall

- **Sources:**
  - "They burnt practically until she disappeared" (Lee; plant note:143).
  - The witnesses differ (RESEARCH_breakup_hull_girder_v1:176): as the bow went under (Ryerson, Symons); as the stern
    stood up (Jewell); forward first (Crawford); all together (Andrews).
  - Beesley: "went out suddenly, came on again for a single flash, then went out altogether" (plant note:144).
  - Ranger: the stern's lights burned until it went under (ibid.:144).
  - Virginian, at the last call: "ended very abruptly, as if power suddenly switched off"
    (RESEARCH_wireless_ether_v1:462).
  - The break lay in boiler room 1; both dynamo sets stood aft of it, and every lit boiler forward of it. So the break
    cuts the dynamos' steam as well as the cables forward [derived].
- **Model:** the 20-degree stand-in darkens the whole ship at once (1.12). Through the fall the lights stand frozen.
- **Proposal:** after the flag, the fall's reader carries the light piece by piece:
  - the forward piece dark at the break (its cables cut);
  - the stern lit for as long as its dynamos run down [bet: seconds, Beesley's flash];
  - each piece's lamps out where the sea reaches them, as G1's circuits would put them out.

  The plant's 20-degree rule stays the steam's loss before the flag. When B4 builds the break, the same reader takes
  its moment (DESIGN_the_break_and_two_bodies_v1:115).
- **Questions:**
  - Which comes first: the steam, the flooding, or the cut cables?
  - How can "forward first" and "all together" both stand?
  - Is the stern still lit after the break, and on what steam?

### G3. The emergency dynamos' own steam (F3)

- **Sources:**
  - Two 30 kW sets on a platform in the turbine room's casing at saloon deck level, 20 to 21 ft above the waterline
    (plant note:131-132).
  - Their steam came by a pipe above E deck, with branches from boiler rooms 2, 3 and 5 (ibid.:133), which also fed
    the engine room's bilge pumps (RESEARCH_pumps_bilge_ballast_v1:47).
  - Ranger saw "the emergency light engine was running" at about 12:40 or later (plant note:142).
  - They fed the 500 lamps, the Marconi set, the navigation, bridge and Morse lamps, and four boat winches
    (ibid.:135).
- **Model:** the main sets' pressure (S:248), and 0.15 of the light [bet], where 500 of about 10,000 lamps is about
  5 % [derived].
- **Proposal:**
  - an emergency pressure fed while any of boiler rooms 2, 3 and 5 has fires and steam, and the pipe above E deck is
    dry;
  - their share of the light from the lamp count, or from G1's emergency circuits;
  - their loads named (the wireless, the navigation and Morse lamps, the winches).
- **Questions:** how the pipe's pressure falls as those rooms' fires go; the oil-engine wireless set some sources
  name (wireless ether note:158, 249).

### G4. The crew as part of the machine

- **Sources:**
  - Dillon: "Keep steam up", and later to draw the fires "as much as possible" (plant note:113).
  - Boiler room 6: left at once, or its fires drawn (Beauchamp; ibid.:98).
  - Boiler room 5: 15 to 20 men drew 30 fires in about 20 min ("There were 30 furnaces to pull", Barrett), and its
    boilers were blown dry (ibid.:103-104).
  - Boiler room 4: the fires partly drawn, and the men left at about a foot of water, about 1:20 (Cavell,
    ibid.:111).
  - "All the engineers were working in the stokehold"; the chief electrician stood by the main lighting engines; no
    engineer survived (ibid.:114).
  - Scott saw the circulating pumps still running at 1:20 (pumps note:73).
  - Who kept the steam to the end: no witness says; rooms 2 and 3 are inferred (plant note:116).
- **Model:**
  - drawing a room's fires is an order (S:462-467);
  - the 1912 script holds only helm and telegraph orders (N:124-135), so no fires are drawn on the watch [derived];
  - the pumps' crews leave at 2.3 m (K:1035-1038);
  - "the engineers kept the lights to the end" is only an ordering of thresholds: the engines stop at 0.35 of
    pressure, the dynamos at 0.30 (S:41-45).
- **Proposal:** a crew state per room, as plain data: men present or gone, with when and why. It would drive:
  - drawing fires, from the record's times in the 1912 script, or by a doctrine;
  - the stokers leaving at a height of water [bet];
  - the engineers keeping the dynamos' room and the pumps to the end.

  The view shows it (part 5).
- **Questions:**
  - Do untended fires burn down, or count as drawn?
  - Does the drawing of boiler rooms 5 and 4 belong in the 1912 orders?
  - The plates' height over the tank top: 6 ft or 3 ft (plant note:248).

### G5. The fans

- **Sources:**
  - "natural draught, assisted by fans" (plant note:41).
  - "12 electrically driven fans for supplying air to the stokeholds", and 76 ventilating fans taking 5,250 A
    (ibid.:136).
  - Ranger, from about 11:55 and for about 45 min, was told "to go and stop all the electric fans, the stokehold fans
    first": "There were 45 working" (pumps note:74).
- **Model:** the fans run while the main sets do; without them the fires give 0.65 [bet] (S:58-60, 217). No order
  stops them.
- **Proposal:**
  - the fans' stop as an event on the 1912 night: the stokehold fans first, at Ranger's times [read];
  - natDraught then applies, with its own source or bet;
  - the fans' load (about 525 kW [derived], plant note:136) is taken off the dynamos (G6).

### G6. The electrical load

- **Sources:** about 10,000 lamps, 76 fans at 5,250 A, the wireless's 5 kW, four lifts on the main circuit, and four
  boat winches on the emergency circuit (plant note:136; boats note:97-98, 405).
- **Model:** aux 0.04, constant, covers the dynamos, steering and pumps (S:37). Nothing that runs changes it (F10).
- **Proposal:** a power budget on the dynamos, the loads named, as readouts first: the view shows the load against
  the sets' 4 x 400 kW [to be sourced]. Feeding the dynamos' steam into the demand would follow only if the numbers
  show it matters.

### G7. What works without power

- **Sources:**
  - **The telephones:** a motor-generator on the lighting circuit, with a stand-by battery that switched in by itself
    (RESEARCH_the_night_on_the_bridge_v1:56; plant note:137). Hogg's call went unanswered; Rowe's was answered
    (bridge note:96, 105).
  - **The stokehold telegraphs and stoking indicators** were electric: "Five indicators are provided in each
    stokehold" (plant note:44).
  - **The whistles:** "electrically actuated on the Willett Bruce system", one set on each of the two foremost
    funnels (bridge note:58; topsides note:132). No use on the night was found.
  - **Steering:** steam and a hydraulic telemotor; only the rudder indicator was electric (plant note:154-155).
  - "Everything about water came by a man or a telephone" (bridge note:66).
- **Model:**
  - the telegraph orders always arrive, and steam and water limit them (N:205; S:261-266);
  - the telephones are not gated on current (R:139-140);
  - the whistles are only drawn (`site/topsides.js:183-186`).
- **Proposal:** in the reports reader, the telephones die with the lighting circuit after their battery's hours
  [bet]. The stokehold indicators go dark with the main sets. The whistles stay silent unless a source is found.

### G8. The steam's sounds and their end

- **Sources:**
  - The roar from the escape pipes from about T 10, with orders given by hand signals (bridge note:222).
  - "cannot hear for noise of steam" (plant note:117).
  - Barrett on boiler room 5: "With the ship blowing off it had blown it out" (ibid.:103).
  - When the roar ended: not found. A digest says orders could be heard by about 1 a.m. (bridge note:249).
  - Silent blow-offs to the condensers (plant note:50).
- **Model:** the valves lift and the stokers bank the fires (S:61-68, 218-237). The roar dies with the banking.
- **Proposal:** keep the law. Show its state in the view, and the record's account beside it.

### G9. The findings (1.14) as work

F1 to F13 are each a small piece of work, classed in part 4.

## 4. The classes

- **A: a reader or the page.** Neutral to the watch's fingerprint, no refit. Its own suite holds the fingerprint.
- **B: the plant's code, still neutral to the fingerprint.** It moves only readouts or readers' outputs: the boats,
  the wireless, the reports. `systems_tests` and the readers' suites are run; a reader's fitted constant is refitted
  if it moves (`calibrate_people.js`, `reports_tests.js`).
- **C: the plant itself.** It moves the watch, so it belongs to an epoch's refit under the repo's rules:
  - `systems_tests`' 1912 fingerprint updated as meant;
  - the headway reference only if headway moves;
  - the history match (the calibration since D4);
  - `carpathia_tests` and the Carpathia rerun.

| Item | Class | Why |
|---|---|---|
| The view (part 5) | A | a part: it reads, writes nothing |
| G1 lights by circuit (fuses blow; the supply stands) | A | a reader and the page and U3; the plant's `lights` stays the supply |
| G2 the lights through the fall | A | the fall's reader; the watch stands still past the flag |
| G3 the emergency sets' own steam (F3) | B | only `emergency` moves; it feeds the lights alone (S:248-252), so the boats' work in the dark, the wireless and the Morse lamp |
| G4 the crew (fires drawn by the record) | C | the fires feed the pressure, the pumps and the engines |
| G5 the fans' stop | C | natDraught lowers the steam |
| G6 the load, as readouts | A | the view shows it |
| G6 the load, fed back into the demand | C | the pressure moves |
| G7 the telephones and indicators | A | the reports reader (rerun `reports_tests.js`: one constant is fitted to the watch) |
| G8 the steam's sounds | A | the page and the sound part |
| F1 the coal share | B | no bunker empties on the night, so nothing else moves; `systems_tests` pins the coal "to the bit", updated as meant |
| F2, F9 the wireless's trigger and the lamp's change-over | A | the world reader |
| F4 bulkhead C's F-deck door | C | the flooding's paths |
| F5 the doors' interlock | C, in what-ifs only | the 1912 watch opens no door by hand |
| F6, F7, F8 ports, smoke, end card | A | the page |
| F10 the motor's load (as G6) | A or C | as G6 |
| F12 the steering engines' flooding | C | the rudder freezes |
| F13 the turbine's demand, the screws' ventilation | C | the pressure, the thrust |

## 5. The nervous-system view, for Z2

A page part that shows the ship's graph live, every node coloured by its state, with its reason and its time. It is
neutral: it reads the model and writes nothing.

- **Its place (QC C-4):** `site/parts/77_nerves.js` with its `.css`.
  - A display button, "Systems", "Nerves" or Bo's word, through `TitanicApp.addButton('display', ...)`.
  - An overlay put into the stage's grid through `TitanicApp.slot('aside', el, { order })`. It is not marked `last`:
    opened by the player, it holds its room.
  - Inside its overlay it lays out on the `layout` hook, and never positions itself on the stage.
- **Desktop first (D84):**
  - On the desktop template it is the whole graph, about 520 x 560 px, nodes and edges.
  - On the narrow and phone templates it is a list: one row a node, its dot and its reason, in the panel's sheet.
- **Its clock (QC C-3):**
  - The times it shows are the model's: T plus minutes after the touch on a watch, the ship's clock on a preset.
  - Its animations (a pulse along an edge when its source changes state) run on `TitanicApp.now()` and
    `TitanicApp.after()`, never on the wall clock. `tools/clock_tests.js` holds that.
- **Its data:** read on the `step` hook, drawn on `frame`, cleared on `reset`. It reads:
  - `sim.plant` and `sim.mo.plant`;
  - `sim.world` (the wireless, the Morse lamp);
  - `sim.people` (the boats' work in the dark);
  - the plant's events in `sim.events` (`plant:*`, each with its time and its words: "Boiler room 5 flooded: its fires
    are out").
- **The graph:** the nodes' places as a data table (`NODES`), the chain from left to right:
  - coal, by room, to fires, by room, to steam (pressure);
  - from steam:
    - the engines (port, starboard) to their screws;
    - the turbine to the centre screw;
    - steering to the rudder;
    - the pumps, by room;
    - the main dynamos, and from them the lights, the fans (an edge back to the fires), the doors' switch, the
      wireless and the Morse lamp;
  - the emergency dynamos to the emergency lights and the wireless;
  - the water, as a source of red edges into the rooms it knocks out;
  - her pose, into the screws and the rudder.
- **Its rules, as data (`RULES`):** each node's state a pure function of the model's fields, so its test can import
  the same table.

| Node | Green | Amber | Red | Grey |
|---|---|---|---|---|
| A room's fires | `fires` 1 | being drawn (`drawn`, fires > 0); banked (`firing` < 0.5); natural draught | `out` (flooded), or fires 0 | boiler room 1 (never lit) |
| A room's coal | coal > 0 | | empty | |
| Steam | p >= 0.8 (with psi) | 0.35 <= p < 0.8 | p < 0.35 (the engines stop), or `broken` | |
| An engine | `nMax` >= its order | `nMax` < its order ("slow") | `re` (flooded), or `nMax` 0 ("no steam") | |
| The turbine | in | out with the wings under 50 | `te` (flooded) | |
| A screw | `imm` 1 | 0 < `imm` < 1 | `imm` about 0: "in the air" | |
| Steering and the rudder | `steerRate` 1 and `rudImm` 1 | partial | no steam, or `rudImm` 0 | |
| Main dynamos | `power` | | not: "flooded", "no steam" or "the steam mains broken", by its cause | |
| Emergency dynamos | `emergency` | | not, by its cause | |
| Lights | 1 | 0.15: "emergency lights only" | 0 | |
| Fans | `power` | natural draught | | |
| Doors' switch | available (power) | | dead (no main power) | |
| A room's pumps | at pumpScale 1 | pumpScale < 1 | abandoned, or the room lost | none there |
| The wireless | working, reach 1,500 nm | reduced reach, or the battery | dead (flooded, or no current) | |
| The Morse lamp | lit | | dark, or the bridge under | |

- **The record beside the model:** each node can carry a line from a small sourced table in the part. For example:
  "Boiler room 5: fires drawn by 15 to 20 men in about 20 min (Barrett, plant note:104)", beside the model's
  "Boiler room 5: fires out, T+56, flooded at the furnaces". The two are always labelled, and never merged: the
  record says what was seen, the model what it computes.
- **Its builder and its suite:**
  - Z2 builds the part.
  - U0 can write `RULES` and its headless test (part 6), so that the part draws from a table already proved against
    the plant.

## 6. A test for each item

| Item | Test, by the repository's rules |
|---|---|
| The view: the rules | `tools/nerves_tests.js` (headless, seconds): each rule of `RULES` against hand-made plant states, one row a node and colour; and every `plant:*` event's text found by the node it belongs to |
| The view: the page | `tools/nerves_site_test.js` (a browser suite, on the virtual clock, with `--real` for comparison): a watch with the view open has the model's fingerprint; at held steps (T+30, the bunker's give-way, the dark, the flag), each node's colour, reason and time equal the rules applied to the page's own sim; desktop shows the graph and a phone the list; no wall-clock read (`clock_tests.js`) |
| The view: the layout | `tools/layout_site_test.js` with the view open, at its six sizes: no overlay over another, none outside the stage |
| G1 lights by circuit | the circuit reader's suite: neutrality; each circuit out on the step the sea reaches its section and never relit; with no sea, the circuits' sum the plant's `lights`; U3's `u3_lights` reads the circuits |
| G2 the lights through the fall | `tools/night_after_tests.js` rows: the forward piece dark at the break, the stern lit until its own rule; the fingerprint through the fall unchanged |
| G3 the emergency sets' steam | `systems_tests`: boiler rooms 2, 3 and 5 out, so the emergency pressure falls and its lights go; the main sets' flat flooded, so the emergency sets burn on while their pipe has steam; the 1912 fingerprint unchanged (class B); `world_tests` and `people_tests` rerun |
| G4 the crew | `systems_tests`: the record's drawing in boiler rooms 5 and 4 at its times; the steam and the pumps after it; the engineers' rooms last; then the epoch's refit (class C) |
| G5 the fans | `systems_tests`: the fans' stop on the 1912 night at Ranger's times; the steam's fall under natural draught; refit (C) |
| G6 the load | readouts: `systems_tests` rows that the budget's sum is the named loads; fed back: refit (C) |
| G7 the telephones | `reports_tests`: a telephone report after the lighting circuit's battery is gone goes by a man, or is lost; the fitted constant checked |
| G8 the sounds | `sound_site_test.js`: the roar's level is blow's function, as today |
| F1 the coal share | `systems_tests`: banked for an hour, the coal burnt equals the steam raised at 750 t a day, to 1e-9; the coal's pins updated as meant |
| F2, F9 | `world_tests`: "Engine room flooded" on the flag the record means; the Morse lamp dark during the change-over |
| F4, F5 | `systems_tests` and the core's suites (conserve, pocket, seams untouched), then the refit for F4 |
| F6, F7, F8 | `night_scene_site_test.js` and `visuals_site_test.js` (a port under the sea dark); the page's smoke following `gen` (`visuals_site`); `night_end_site_test.js` (the emergency stage on the card) |

## 7. The order and the owners (a proposal)

1. **Now, all class A, no refit.**
   - The view: `RULES` and `nerves_tests.js` by U0, then the part and its suite by Z2.
   - The page's fixes F6, F7 and F8: Z2.
   - The readers' fixes F2, F9 and G7: the world and reports readers' owner, or U0 if the coordinator gives them to
     it.
   - G1's circuits as a reader, then the page and U3: U0 (the reader, the export and U3) and Z2 (the page).
   - G2, the lights through the fall: Z1 (the fall's reader) and Z2 (the page).
2. **The plant's class B, before the next refit.** G3, the emergency sets' own steam, and F1, the coal share: the
   mainline (`core/systems.js`), with `systems_tests`, `world_tests` and `people_tests`.
3. **The plant's class C, in the epoch's next refit** (after D5 and the next guide):
   - G4, the crew;
   - G5, the fans' stop;
   - G6's feedback;
   - F4, bulkhead C's door;
   - F12, the steering engines' flooding;
   - F13, the turbine's demand and the screws' ventilation.

   The owners: the mainline, with the break's steam through B4 (B1+B2 and Z1). Each item is one switch, dark until
   the refit, as stage C was built (D81).

## Decisions needed (who decides)

- **Bo:**
  - whether the plant's class C items wait for an epoch's refit together, or go one at a time with a refit each;
  - whether the crew becomes a state of the model (G4);
  - the view's name and place (an overlay in the stage's `aside`, or a page of the Systems tab).
- **The coordinator:** the owners and the order in part 7; whether U0 takes the readers' fixes.
- **The mainline:** whether F1 is a fault (this design reads it as one), and F2's meaning (boiler room 3 as the
  record's "engine room", or `re`).

## Risks

- **G1's circuits have no source for how the mains were divided,** so they would rest on bets. Keep them a reader,
  neutral, until a source is found.
- **Every class C item moves the 1912 watch.** Each brings its refit and its references, so they belong together in
  an epoch, not one by one.
- **The view must never pass the model off as the record.** The record's line and the model's stay labelled apart.
- **The view's room on a smaller desktop,** against the readouts and the Bridge: the layout's MUST rows guard it.
- **Rule drift between the plant and the view** if the rules are copied. Hence `RULES` as one table, tested headless
  against the plant's own fields.

## Sources

- **The code at `960782e`:**
  - `core/systems.js`, `core/motion.js`, `core/core.js` (the pumps, doors and levels the plant touches), `core/night.js`;
  - `core/readers/world.js`, `people.js`, `reports.js`;
  - `site/app.js` and `site/parts/` 20, 30, 40, 70, 76 and 80;
  - `tools/u3_lights.js`, `u3_smoke.js`, `record_night.js`, `systems_tests.js`.
- **The repository's notes, in `docs/research/`:**
  - RESEARCH_ship_systems_plant_v1_2026-11-16, RESEARCH_pumps_bilge_ballast_v1_2026-11-17;
  - RESEARCH_the_night_on_the_bridge_v1_2026-11-17, RESEARCH_breakup_hull_girder_v1_2026-11-17;
  - RESEARCH_tanks_counterflooding_door_schedule_v1_2026-11-17;
  - RESEARCH_wireless_rockets_ships_clock_v1_2026-11-17, RESEARCH_wireless_ether_v1_2026-11-18;
  - RESEARCH_lifeboats_launch_sequence_v1_2026-11-17, RESEARCH_topsides_dimensions_v1_2026-11-19;
  - RESEARCH_olympic_class_steering_propulsion_trials_v1_2026-11-16, RESEARCH_grand_staircases_domes_record_v1_2026-11-19.
- **The designs:** `docs/DESIGN_ship_systems_v1_1_2026-11-16.md`,
  `docs/DESIGN_the_break_and_two_bodies_v1_2026-11-19.md`, `docs/BRAINSTORM_the_next_horizon_v1_1_2026-11-23.md`,
  and BACKLOG.
- **Not checked:**
  - the inquiries' transcripts themselves (every quote here is the repository's notes' own);
  - the main dynamos' rating (4 x 400 kW is written above as [to be sourced]);
  - the stage D landing's numbers: this design reads main `960782e`, before the landing. The landing turns
    `leadRule` 1 on and moves the plant's numbers, but none of the graph's edges.
