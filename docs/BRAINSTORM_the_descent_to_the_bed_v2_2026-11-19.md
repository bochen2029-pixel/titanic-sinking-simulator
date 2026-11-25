# After she goes under, all the way down: the plan (v2)

- **Written:** 2026-11-19, 13:21 to 14:12 CST, session ec239ade (Claude Code desktop, Claude Fable 5.2; a fork of "Titanic simulator model accuracy"), at Bo's ask: "right now after the titanic sinks, it is like a stupid toy model in a shallow swimming pool and doesn't even sink all the way down to the bottom of atlantic, and it gets stuck halfway, which is fake as hell... i have a similiar sim for a submarine C:\fathom\ that goes miles deep if needed; reference this and brainstorm how the titanic can sink to realistic depth etc; after it goes under, write this up too... see this brainstorm, improve upon it and give me your sharpest most detailed plan".
  And at 14:00 CST, pointing at the break's design: "also related but see this ... so really deepthink all this".
- **Status:** advice only; nothing here is a decision. No model or page code was changed and nothing was committed. New files: this note; five experiment scripts with their outputs (`docs/research/experiments/e30` to `e34`, `results_2026-11-19/`); two research notes by this session's agents (R5, finished; R6, its last sections still being written: section 11).
- **Supersedes:** `BRAINSTORM_the_descent_to_the_bed_v1_2026-11-19.md` (13:15 CST, another fork; left unchanged).
- **Lineage:** v1 -> v2. v1's diagnosis of the page, its air table and its Fathom list are kept where they held; section 0 says what changed.
- **Read with:** `DESIGN_the_break_and_two_bodies_v1_2026-11-19.md` (13:50 CST, another fork: how she breaks by her own loads, and two parts on the core). It is not superseded. Section 5.6 joins the two into one order of work and says where I would change it.
- **Baseline:** every measurement is on the committed tree `a97a6bd`, exported, because another session is changing `core/core.js`, `site/app.js`, `tools/seams.js` and `tools/trials.js` in this checkout today (the grand staircases). Line numbers of this repository are `a97a6bd`'s. Fathom is read at `C:\fathom`, HEAD `11ea82b`; `C:\code\fathom` is an older copy with no git and was not used.
- **Tags:** [M] measured this session (the experiment is named); [R] read (file and line); [R5], [R6] in this session's research notes, which carry their own tags for each source; [D] derived (arithmetic shown); [B] bet.

## 0. Changes in v2

1. **Her last minutes are measured, not described.** The roll that v1 put in "the last two minutes" starts five and a half minutes before the flag: 10 degrees at T 151.4, 20 at 153.0, 45 at 155.1, 80 at 155.8 (section 1.2).
2. **The cause of the roll is found.** The model's hull stops at B deck. With the envelope carried up to the boat deck she never lists more than 7 degrees; splitting the upper decks' free surface alone only halves it (section 1.3). v1 named the roll as the obstacle and did not say what it was.
3. **"The core cannot simply be run on" is sharpened.** Run on, it takes her wholly under 49 s after the flag, for reasons that are not physics (section 1.1).
4. **The fall is prototyped on the model's own slices.** Flooded, bow and stern both fall flat at 9 to 10 m/s and reach 3,800 m in six and a half to seven minutes. With the model's own weights and no tuning, the bow let go at the record's trim lands 560 to 750 m ahead of the break and the stern 70 to 190 m from it. The surveyed wreck: 772 m and 148 m. But a metre and a half of trim lever moves the bow 600 to 900 m, so her place on the bed is a fit of one number and not a prediction (section 4.4). The wreck can still judge the engine before it is joined to anything.
5. **v1's energy at the bed was a third of the real figure.** What moves is her, the water in her and the water she drags: 7.7 GJ for the bow, four fifths of it water. That is the "down-blast", as a number (section 4.6).
6. **Two of v1's borrowings from Fathom are withdrawn.** No logarithmic depth buffer (this page has 18 hand-written shaders that would each need changing) and no moving of the scene's origin (at 3.8 km a float still resolves a quarter of a millimetre). And one is corrected: Fathom's step cannot carry a falling hull as it stands, because its pitch is clamped at 80 degrees, as ours is (section 3).
7. **The record is corrected from sources** [R5]: the bow lies 772 m due north of the boiler field and the stern 148 m from it; the depth is 3,795 to 3,816 m (v1's 3,784 m was found in no source); the stem is in "to the base of the anchors", both of them, while the bow's after end lies on the mud; the one computed speed at the bed is 5 to 10 m/s (section 2).
8. **The stern's "implosion" gets a mechanism a model can compute:** spaces whose openings are too small for the rate at which she goes down (section 4.3).
9. **The build order is changed.** v1: a drawn fall first, then one computed body, then two. v2: the engine with its trials and the page that shows it are built side by side against one stated contract, and joined at the flag. The drawn fall is dropped as a product: it becomes the page's first test feed. One computed body is dropped as a product: the wreck is two (section 6).
10. **What the model will not tell us is said first** (section 4.8).
11. **The break's design is joined to this one** (section 5.6). The two need each other. It asks why she rolls and does not know: section 1.3 answers it. It asks for a body that can stand on end: that is this plan's engine. And this plan's hand-over waits on its break. One order of work now covers both (section 6).

## The answer in one paragraph

She looks like a toy because three separate things are wrong, and only one of them is the page. "Foundered" is a trim flag: it fires at T 156.94 with her stern 62 m in the air and 23,000 t of buoyancy to spare. After it the page slides the frozen ship 140 m and stops, with no physics and no bed. And the model's last five and a half minutes are not hers: she rolls from 10 to 80 degrees because the model's hull stops at B deck. The fall itself is the tractable part, and the wreck can judge it: a prototype on the model's own 3 m slices, with textbook forces, has the flooded bow and stern falling flat at 9 to 10 m/s, six and a half to seven minutes to a bed at 3,800 m, the bow 560 to 750 m ahead of the break (surveyed: 772 m) and the stern 70 to 190 m from it (148 m), with no tuning. So: build one free body (Z1), which is the fall's engine and also the body the break's two parts need once they stand on end; build the page that draws a list of bodies (Z2) beside it, against one frame contract; join them at the founder flag with an interim break (Z3), which moves no fingerprint. Then earn the true end with one cascade in two refits: first the hull's envelope carried up to the boat deck (Z4, which ends the roll and which the staircase work also needs), then the break itself, by her own loads against a strength computed along her length, with a hinge that tears (the break design's B1 to B4). Fathom gives the water column, the air law, the bed's relief, the look of deep water, the frames idea and the way to test; it does not give the body's motion or a bed that takes a hull.

## 1. What is wrong today (measured on `a97a6bd`, the 1912 damage preset)

### 1.1 The flag and the slide

`core/core.js:731` declares "Foundered" when the hull's top is 0.5 m under, or the trim passes 1.2 rad, or nothing is displaced. The trim rule fires first [M: e30]:

| At the flag, T 156.94 min | Value |
|---|---|
| trim, list | 69.0 degrees by the head; 80.2 degrees to port (the roll's clamp, `:693`) |
| her ends | the taffrail 62 m above the sea, the stem head 189 m below it |
| motion | sinking 1.20 m/s, pitching 0.95 degrees a second |
| displaced | 104,488 of the envelope's 125,019 m3 (84 %) |
| water | 55,846 t that fits in her, plus 13,634 t "pressed over" (water the core holds in spaces already full: `:498-500`) |
| air | 53,113 m3: 12,641 forward of the break station (the lower parts of boiler rooms 4 to 1), 40,472 aft |
| buoyancy to spare | 23,278 t |

Then the page stops stepping (`site/app.js:2566`, `pace()` at `:2558`) and slides the frozen pose down 140 m at 14 m/s (`:2601`, applied at `:2422` and `:2436`). The camera's target is held above 60 m down (`:2485`), its far plane is 9,000 m (`:144`), its zoom stops at 2,200 m (`:1212`, `:1230`). There is no bed.

Run on past the flag, the core has her wholly under 49 s later (T 157.75), at the trim clamp of 77 degrees with 36,404 m3 of air still aboard, and 396 m down at 9.8 m/s a minute after that with 18,651 m3 of air [M: e31]. It gets her under because its spaces vent freely, its full spaces take phantom water and its angles are clamped. The time is about right (the record has her gone at T 160). The reasons are not physics, and nothing below the surface can be built on it.

### 1.2 The last five and a half minutes

| T (min) | Trim | List (to port) | Girder (GN m) | What |
|---|---|---|---|---|
| 144.0 | 5.5 | 6.4 | 3.44 | the record: about 15 to port at T 145 |
| 150.0 | 6.2 | 7.6 | 3.76 | |
| 151.4 | 6.6 | 10.0 | 3.95 | the last moment her list is the record's |
| 151.8 | 6.7 | 11.0 | 4.00 | the girder enters the studies' range (4.0 to 5.4) |
| 153.0 | 7.2 | 20.0 | 4.23 | |
| 153.9 | 8.0 | 30.0 | 4.46 | water reaches the bridge (the record: T 155) |
| 154.4 | 8.6 | 34.8 | 4.60 | the girder's central capacity |
| 155.0 | 10.0 | 43.0 | 4.85 | |
| 155.2 | 11.2 | 49.0 | 5.00 | the record's trim at the break begins (11 to 17) |
| 155.8 | 16.4 | 80.1 | 5.25 | on her beam ends: the clamp |
| 155.8 | 17.9 | 80.2 | 5.31 | the record's trim at the break ends |
| 156.0 | 21.9 | 80.2 | 5.38 | the girder's largest |
| 156.9 | 69.0 | 80.2 | 1.65 | the flag |

[M: e30.] No moment in this table has both the record's trim and the record's list. The only thing the flag has right is its time: T 156.94 against the record's break at about T 157.

### 1.3 Why she rolls

| The model, with no refit [M: e31, e32] | List at trim 11 | List at trim 17 | Founders (min) | List at the flag |
|---|---|---|---|---|
| as committed (the hull's top at B deck) | 48 | 80 | 156.9 | 80 |
| the upper decks' free surface split (`upperSplit: 1`, `axUp: 0.3`) | 27 | 53 | 158.5 | 80 |
| the envelope to A deck over the superstructure (x -78 to +77) | 18 | 17 | 165.0 | 60 |
| to A deck, and split | 8 | 11 | 166.1 | 48 |
| the envelope to the boat deck | 2 | 1 | 170.7 | 2 |

The roll is the missing superstructure: as her bow goes down, the model's waterplane ends where B deck goes under, 50 m aft of where the sea really stood on the boat deck, and its stiffness goes with it. The single free surface above E deck helps it along. With the envelope at the boat deck she goes by the head upright; she then founders 14 minutes late and the water reaches the bridge at T 162 against the record's 155, until the four flow parameters are refitted. The truth lies between the A-deck and boat-deck rows (the A-deck promenade is open, the boat deck's houses are narrow, and none of it is tight). That is a physics change with a refit and the whole cascade: **Z4**. The staircase session reached the same wall from the other side today (`docs/research/experiments/e26_superstructure_buoyancy.js`, 13:42; README "Known gaps"): one refit should serve both (decision D41).

## 2. The target: the wreck as it lies [R5]

Measured. Positions are Ballard's from the 1985-86 transponder net, to one second of arc (31 m by 23 m).

| What | Value | R5 |
|---|---|---|
| The point under the break | the centre of the field of boiler room 1's five single-ended boilers, 41 43' 32" N, 49 56' 49" W (Ballard 1987, p. 199) | 1.1 |
| The bow | 772 m due north of it; points north-north-east; upright, about 5 degrees to port; about 143 m long | 1.1, 1.2 |
| The stern | 148 m from it, bearing 309; faces the opposite way; upright; about 107 m long | 1.1, 1.2 |
| Stern to bow | 689 m, bearing 010 (published as "some 600 m") | 1.1 |
| Between them | about 21 m of ship gone: the source of nearly all the debris | 1.2, 2.3 |
| Depth | 3,795 m (Uchupi, Ballard and Lange 1986) to 3,816 m (the water depth at the bow in the 2022 CTD record [R6 5.2]); R5 takes 3,790 m, band 3,770 to 3,810; v1's 3,784 m was found in no source | 1.2, 10a |
| The bow in the bed | the stem 12 m in (computed from a core) to 15-18 m (to the base of both anchors); its after end on the mud; so about 7 degrees bow down, taken up in two bends (6 to 10 degrees under the well-deck cranes, 4 under the forward expansion joint); mud ploughed and thrown; the No. 1 hatch cover 60 to 100 m ahead of the stem | 2.1 |
| The stern in the bed | rudder first, about 15 m; the hull about 7 m below where its shaft wings stopped; decks pressed to 4 or 5 m in all; bent 10 degrees to starboard; 15 m of poop deck peeled back; plating peeled outward; scour marks to its west, debris to its east | 2.2 |
| The middle | the boilers 150 to 180 m from the stern; two pieces of double bottom, 12 by 27 m each, about 540 m from it | 2.3 |
| Debris | from 600 to 1,200 m south of the bow (1986); 1,700 by 875 m (the 1988 map); most of it within 3 by 5 km (2010); it "rained for several hours" (Ballard) | 3 |
| The bed | silt over thick clay; undrained strength about 25 kPa between 10 and 16 m down (one core); "gently sloping"; bottom current 0.13 to 0.39 m/s in 1986, its direction disputed | 6.1, 6.3 |
| The sea that night | surface -2 deg C; a surface current of 1.1 knots toward 196 degrees; 1 to 2 deg C at the bed | 6.1, 6.2 |

Reconstructed. Nobody saw the fall; every figure here is a reading of the wreck [R5 4, 5].

| What | Value | Kind |
|---|---|---|
| Time to the bed, both parts | 5 to 6 minutes (Uchupi, Ballard and Lange 1986) | estimated |
| The bow's speed at the bed | 5 to 10 m/s, at under 40 degrees (Best, Powrie, Hayward and Barton 2000) | **computed**: the only one |
| | 10.3 to 13.4 m/s (Halpern and Weeks; Ballard; Mengot) | estimated |
| The bow's glide | 1 forward in 6 down (Halpern and Weeks): 630 m. The positions give 1 in 4.9 | estimated; derived |
| The stern | fell nearly straight, turning; its air spaces failed 20 to 60 m down (Mengot; the Marine Forensics Panel); "dragged under before the interior could completely flood" | estimated |
| At the surface | the break at 2:17 to 2:18.6; the stern afloat on its own for one and a half to three minutes, standing nearly on end, turning about its length; gone at 2:20 by Pitman's watch | witnesses |
| Heard | four reports "like the reports of a big gun in the distance", after she was under (Pitman, US Day 4; Scarrott also counts four) | witnesses |

## 3. Fathom: what to take, what to change, what to leave

Fathom (`C:\fathom`) was built on this repository's pattern (its `CLAUDE.md:5`): the same module shape, dt 0.25 s, a plain-data sim, seeded streams, a gate. Its frame differs (z down, y to starboard); the mapping is written once, as `core/motion.js` does for MMG.

| Fathom | What it is | Verdict | Here |
|---|---|---|---|
| `core/ocean.js:33`, `:37-53`, `:62-94` | density by a linear law plus 4.5e-3 kg/m3 a metre; temperature and salinity profiles; a column of 5 m nodes to a depth (3,800 m by default) | take the form, write the column anew | [R6 5.2] computed the column from the full equation of state: 1,026.3 kg/m3 at the surface, 1,045.3 at 3,784 m, a slope of 4.97e-3. Fathom's law is within 2 kg/m3 of it. Its "ice-edge" profile is too cold below (-0.4 deg C at 2,500 m against about 3) |
| `core/systems.js:33` | `pAt`: one atmosphere plus the local density times g times depth | change | 0.9 % high at the bed [D: 1,045.3 against the column's mean 1,036]: integrate the column once, or use Saunders's formula [R6 5.1] |
| `core/systems.js:69-87` | a ballast tank open below: its air in bar m3, the water it holds found from the pressure at its depth | take | every space of hers that is open below and shut above |
| `core/systems.js:92-103` | flooding a shut room through a hole against its own air; full where the pressures meet | take, and add a vent and a strength | the air law of 4.3 |
| `core/systems.js:160-162`, `core/boat.js:95-97`, `core/patrol.js:84` | the hull creaks below test depth and fails at a collapse depth drawn from the seed for each hull | take the shape | for each space, as a pressure difference drawn from the night's seed within its band |
| `core/motion.js:118-167` | six degrees of freedom: forces at t, a kick then a drift, added masses solved with the velocities, weight less buoyancy in the local density | take the form, not the kinematics | its pitch is clamped at 1.4 rad (`:158`) and its tangent guarded (`:156`); a falling hull passes 90 degrees. A quaternion for her attitude, and Kirchhoff's cross terms, which a submarine's coefficient set does not carry |
| `core/patrol.js:181-188` | the bed: she is held at it, a `grounded` event with the speed of the hit | take the event, not the contact | a hull that buries its stem 15 m needs a bed that yields (4.6) |
| `core/ocean.js:84-87`, `:117-121` | the bed's relief: four long swells from the seed | take | "gently sloping": a small amplitude and a slope, from the night's seed |
| `site/app.js:133-137` | the water all round as a sphere that darkens as exp(-depth / 260) | take [appearance] | the look of going down |
| `site/app.js:143-163`, `:165-185` | a grid on the sea's surface; the bed as a wire net laid again as she moves | take, finer | Fathom's net has 750 m squares, wider than she is long: 50 m squares near her, 500 m beyond |
| `site/app.js:546` | the camera's near and far planes scaled by its distance | take | this, in place of the next row |
| `site/app.js:124` | a logarithmic depth buffer | leave | this page has 18 hand-written shaders (10 in `site/app.js`, 8 in `site/parts/20_night_scene.js`); each would need the log-depth chunks or would sort wrongly |
| `site/app.js:22`, `:1351` | the scene's origin is the boat and the earth moves past her | leave | Fathom needs it 30 km out. At 3.8 km a float resolves 0.24 mm [D: 2^-12 m]. Our shaders, water levels and sea all take the sea at y = 0, and `S.post` already carries her down in the scene |
| `core/port.js`, `core/port_fathom.js` | frames out, orders in: the page draws from frames alone | take the idea | `sim.fall` is frames (5.1). Later, a tape of her fall in Fathom's own port form would let a Fathom boat hear her spaces fail: a what-if, not costed |
| its `CLAUDE.md:21`, `tools/trials.js` | "Tests set causes, never conclusions"; bands that carry their sources | take | `tools/fall_trials.js` (section 6) |

## 4. The physics, with numbers

### 4.1 The bodies

From the model's own columns and the girder reader's weight curve, cut at its break station, x -23 m [M: e30, e33]:

| | Whole | Bow (x > -23) | Stern (x < -23) |
|---|---|---|---|
| length (m) | 269 | 152 | 117 |
| plan area (m2) | 6,090 | 3,463 | 2,627 |
| envelope to B deck (m3) | 125,019 | 73,730 | 51,288 |
| structure and load (t) | 49,021 | 29,421 | 19,599 |
| floodable (m3) | 107,597 | 63,911 | 43,685 |
| weight in water, wholly flooded (t) | 31,163 | 18,200 to 19,400 | 11,800 to 12,800 |
| moving mass, with the water in her (t) | 159,845 | 94,181 | 65,664 |
| water she drags across her, as added mass (t) | 126,560 | 72,333 | 54,227 |
| flat fall, closed form, drag coefficient 1.0 (m/s) | 9.8 | 10.0 | 9.6 |

The two figures for a part's weight in water are two ways of sharing the solids either side of the cut. The surveyed parts are 143 and 107 m with 21 m gone between them; where the cut falls and what leaves at it is the break's business (W7).

### 4.2 The weight she falls with

Wholly flooded, the sea holds up only her solid matter. The model's permeabilities make that 17,422 m3, so 31,163 t in water. A budget by material agrees within its bets [D, B]: iron and steel about 33,000 t at 0.869 of their weight, 28,700 t; coal 3,050 t at 0.24, 730 t; cargo 910 t at about half, 450 t; the water in her tanks, nothing; wood, cork and outfit about 4,000 t at a density of 0.65, 2,300 t of lift, which leaves her or is crushed as she goes down. Sum 27,600 t, give or take 2,000. Speed goes as the square root of the weight: 10 % of weight is 5 % of speed. The trials carry both figures.

### 4.3 Air: four fates

At the flag she holds 53,113 m3 of air and needs 30,400 m3 to float [D: 31,163 / 1.026]. v1's table stands: air that cannot get out is squeezed, `V = V0 p0 / p`; 7.5 m under, her air no longer holds her (11.9 m if it is squeezed too quickly to lose its heat [R6 4.1]); at 100 m it is 9 % of its volume. The stern alone weighs about 12,000 t in water and holds 40,472 m3: it is heavy once its air is 22 to 28 m under [D]. So trapped air decides only the first half minute, and what happens to each pocket in that half minute decides what the stern looks like on the bed. Each pocket has one of four fates:

1. **It vents:** there is an opening above the air and another below for the water. Air leaves at about 100 m3/s through each square metre [R6 4.2: 88 under a 2 m head, 116, choked, under 10 m]. To lose the stern's 40,000 m3 in the record's one and a half to three minutes takes 2 to 4.5 m2 of opening above it [D]. A space with one opening only, air out and water in through the same hole, is 30 to 100 times slower [R6 4.2].
2. **It is squeezed:** the space is open below and shut above. Boyle, as Fathom's ballast tanks.
3. **It is tight:** shut all round, at one atmosphere until the steel round it gives way.
4. **It lags:** its openings are too small for the rate at which she goes down. At 10 m/s the sea's pressure rises one atmosphere a second; inside, it rises only as fast as water gets in. The difference loads the decks and bulkheads round the space until they fail. This is Mengot's "dragged under before the interior could completely flood", and it needs no tight space at all.

The law, for each space k (Fathom's, with a vent and a strength added): water W and air a (bar m3); air pressure `a / (V - W)`; through each opening j, of area A_j, water comes in at `Cd A_j sqrt(2 (p_j - p_in) / rho)` where the sea's pressure there is the greater, and air goes out where the opening stands above the water inside and the air's pressure is the greater; the space's boundary fails when the sea outside exceeds the air inside by its strength S_k, and that failure is an event with a depth and an energy, `(p_out - p_air) x V_air`. A space of 500 m3 failing 60 m down gives about 0.3 GJ, 70 kg of TNT [D]: a big gun in the distance. The spaces are the model's own 64 (each compartment below and above E deck, port and starboard), their openings the core's own table (doors, the paths along E deck, `aDown`, `fOpen`) with the cut end added. Strengths, as heads of sea water [R6 4.3: derived from her plating by plastic collapse; the sections of her beams and stiffeners are bets]: doors that are not watertight 1 to 3.5 m; decks loaded from below 2 to 10 m; watertight bulkheads 8 to 30 m, and six to eight tenths of that from the wrong side; tank tops 15 to 30 m; shell 20 to 60 m. So doors and decks go within the first ten metres, bulkheads 10 to 30 m down, the shell below that: Mengot's 20 to 60 m for the stern is the bulkheads' and the shell's range. The five boilers lie whole on the bed [R5 2.3], so a boiler never fails.

### 4.4 The fall

**The equations.** In her own axes, with P and L her linear and angular momentum including the water she drags, Kirchhoff's: `dP/dt = P x w + F`, `dL/dt = L x w + P x v + T`. The term `P x v` is Munk's moment: it comes from the added masses with no coefficient of its own. The added masses are summed over her slices, `c rho pi (B/2)^2` a metre for motion across her beam's plane and the same with her depth for motion sideways, with a few per cent of her displaced mass along her. Each slice then feels, from its own velocity through the water: a cross-flow drag `0.5 rho Cd b |w_n| w_n` (b her breadth or her depth there; Cd by the face that leads: keel, deck or side); along her, form drag on the leading end and skin friction; and where the flow leaves a blunt end, the slender body's lift `u w_n a(end)`, which is the lift of a very low wing. Weight acts slice by slice from the girder's curve, buoyancy on the solids and the air, in the local density. This is Allen and Perkins's and Jorgensen's method for bodies at any angle, written as strips [R6 1.1: Jorgensen 1977, NASA TR R-474, read for the method; the formulas from the textbooks]. Her attitude is a quaternion; the step is Fathom's kick and drift at 0.25 s, sub-stepped.

**The prototype** (`e33`, `e34`: one body in the vertical plane, the model's slices and weights, a bed at 3,784 m). It was run on my first bets, and again on R6's coefficients when they came: cross-flow drag 1.1 keel first, the rectangle's added mass 1.45 with a spheroid's end correction, 0.25 on a faired end and 0.95 on a torn one [R6 1.2, 1.3]. A flat release reaches the closed form within 2 %. The bow, wholly flooded, let go nose down, with the model's own weights:

| Let go at | Ahead of where she was let go: first bets | R6's coefficients | To the bed | Arrives | Fastest on the way |
|---|---|---|---|---|---|
| 11 degrees | 685 m | 563 m | 6.9 min | 9.3 m/s, flat | 11.0 m/s |
| 17 | 749 m | 622 m | 6.9 | 9.3, flat | 12.3 |
| 25 | 841 m | 714 m | 6.9 | 9.3, flat | 14.6 |
| 45 | 1,094 m | 1,009 m | 6.7 | 9.3, flat | 21.8 |
| 69 (the model's flag) | 1,380 m | 1,451 m | 6.0 | 9.3, flat | 32.2 |

The last three columns are R6's coefficients.

| What moves it (the bow let go at 17 degrees) | Ahead | To the bed | Arrives |
|---|---|---|---|
| R6's coefficients as they stand | 622 m | 6.9 min | 9.3 m/s |
| cross-flow drag 0.8 / 1.4, R6's range | 489 / 760 m | 5.9 / 7.7 | 10.8 / 8.2 |
| no lift at the blunt end | 173 m | 6.7 | 9.4 |
| her weight in water moved 1.5 m aft / forward (first bets) | 116 / 1,684 m | 6.4 / 6.8 | 9.9 |
| the same, 3 m aft / forward | 180 m astern / 2,774 m | 6.4 / 7.0 | 9.9 / 10.8 |
| her solids 15 % more / less (first bets) | 1,125 / 453 m | 7.0 / 6.2 | 9.3 / 10.2 |

The stern, wholly flooded, let go with its broken end 45 to 85 degrees down: 71 to 139 m from where it was let go on R6's coefficients (116 to 190 m on the first bets), 6.7 to 6.9 minutes, 9.1 m/s, flat. Its weight moved 3 m aft or forward: 1,087 m astern, or 614 m ahead. The whole ship in one piece from the flag's pose: 6.0 minutes, 517 m, one hull on the bed.

**What it says.**
- **Flat, at 9 to 10 m/s, in six and a half to seven minutes.** Within a minute and a half either part has turned broadside to its fall and stays so. End on is unstable: Munk's moment turns her broadside in 5 to 12 s [R6 2.2]. Experiments on long cylinders of her density find the same: they fall broadside, steady or rocking, and never tumble [R6 2.1: Letessier, Roig and Ern 2025, read]. R6's own prototype, written apart from mine, lands every body level at 9.3 to 10.4 m/s in 6.0 to 6.6 minutes. The speed is the closed form's, `sqrt(2 W' / (rho Cd A))`: 8.2 to 10.8 m/s across the drag's range. Best's computed 5 to 10 m/s takes in most of that; the estimates' 10 to 13 m/s does not. The time sits at the slow edge of the reconstructions' 4.5 to 7 minutes [R5 10b]: if they are right, her drag is nearer 0.8 than 1.1.
- **Where the bow lands is decided by one lever, to the metre.** Her travel is two things. The first 90 s are a dive and a pull-out, 300 to 400 m at the record's trim: fast flow along her, small angles, physics that can be trusted. After that she creeps toward her heavy end for five minutes, and the creep is set by how far her weight in water acts ahead of the middle of her plan: 1.4 m in the model [M: e33]. A metre and a half more puts her 1,700 m off; a metre and a half less, 100 m. The model's own lever, untuned, gives 560 to 750 m against the surveyed 772 m, and 70 to 190 m for the stern against 148 m. That is either the girder's weight curve being right to a metre, or luck, and one run cannot tell which. So the engine is not asked to predict her place. The lever is its one fitted number, the two wrecks are its targets, and the test is that the fit moves the model's own lever by no more than 3 m (trial 7).
- **A steady glide by the head is ruled out by the wreck.** 15 degrees nose down she would run ahead at 16 m/s and land 4 km off [D]; R6's glide polar gives 6 to 8 km [R6 2.2]. 772 m in 3,800 says she fell flat on average. Halpern and Weeks's "about 45 degrees" and "1 ft forward for 6 down" cannot both be one steady state [R6 8].
- **She arrives flat here, and the wreck says stem first.** The prototype's pitching dies in two and a half minutes (17, 11, 6, 4, 2 degrees on successive swings). Real long bodies keep rocking, by 10 to 70 degrees in the experiments [R6 2.1], at a period that the experiments' law puts at 66 s for the bow and 55 s for the stern [R6 2.2]; the prototype rocks at 60 s. A strip model with steady coefficients gets the period and loses the amplitude. Either the engine carries unsteady terms, or her rocking is a stated input (decision D43).
- **The two readings of the hinge leave different marks on the bed.** Let go at the record's trim the bow lands 560 to 750 m off. Let go standing 69 degrees by the head, as it would be if it had hung from the stern by her bottom, 1,400 m. The survey's 772 m leans to an early release at a low angle. It is a lean and not a proof while the lever is a fit (section 5.6, item 3).
- **The stern cannot turn in a plane.** Three dimensions, and an asymmetry the model does not have (4.8).
- **One body is not worth building as a product.** It lands 517 m off as one hull; the wreck is two.

### 4.5 The sea

[R6 5.] Density 1,026.3 kg/m3 at the surface and 1,045.3 at 3,784 m, in a line to within 0.5 kg/m3 below 50 m: `1,026.3 + 4.97e-3 z`. Pressure at 3,784 m: 38.47 MPa, 381 atmospheres absolute. The water about 0 deg C at the surface (the record: -2), 3 to 4 between 200 and 2,000 m, 2 at the bed; sound at 1,446 m/s near the surface and 1,522 at the bed. Depth adds 1.8 % to every drag and takes 330 t off the whole hull's weight in water. The column's temperatures are a bet; a measured one exists and was not reached (the CTD carried on seven dives in 2022, PANGAEA 961181).

Currents [R5 6.1]. At the surface 0.57 m/s toward 196 degrees that night: she, her boats and her wreckage all ride it, so it moves nothing relative to them until a piece is below it. At the bed 0.13 to 0.39 m/s. Six and a half minutes in a quarter of a metre a second moves a hull under 100 m [D]; an hour moves a plate 900 m. The hulls show where she broke. The debris shows the current.

### 4.6 The bed

Strength with depth `s_u = 2 + 1.9 z` kPa [D: a line through Best's 25 kPa at 10 to 16 m; the value at the mud line is a bet]. Each slice in the mud is resisted by `(Nc s_u R + 0.5 rho_s C v^2)` on its bearing area: a bearing factor Nc of about 7.5, a rate factor R of 1.5 to 2, mud of 1,500 kg/m3 [R6 6: the form is True's of 1976; his rate constants were not found, so these stay bets].

- **At rest** the bow's weight in water on her plan is 52 kPa [D: 1.79e8 N / 3,463 m2]: she would lie about 3 m in.
- **Landing flat at 9.6 m/s** she brings 2.9e7 J for every metre of her length (her 620 t a metre with the water in her). The mud's work on a bottom 28 m wide is `420 z + 200 z^2` kJ a metre [D], so she would go 11 m in along her whole flat bottom, 6 to 8 m with the rate factor. The wreck: the stem 12 to 18 m in and her after end lying on the mud. So she did not land flat. Her stem took the blow, and her after body came down afterwards about the buried stem, slowly, bending her twice on the way. That is what the engine with a yielding bed must show, slice by slice: burial along her length, and the bending the landing puts on her, read by the girder's gauge against its capacity.
- **Landing stem first** [R6 6.3: a worked case]: a bow of 16,000 t in water arriving at 10 m/s, 15 degrees by the head, on mud of `2 + 1.8 z` kPa, puts her stem 14.4 m in (9 to 23 across the ranges; 18.9 if the water moving with her is carried into the blow), and she settles to 2 to 4 degrees by the head in 4 to 5 s at about half a g. Its torn end goes 5 to 16 m in, where the wreck's lies on the mud. Neither R6's model nor mine explains that yet; Z5's trial is expected to fail on it until the after body's landing about the buried stem is in.
- **The following water, as a number.** The bow's own 29,400 t is a fifth of what is moving. The water in her is 65,100 t and the water she drags 72,300 t [M: e33]: 7.7 GJ in all at 9.6 m/s, 6.3 GJ of it water. When the hull stops, the water in her does not. It stagnates on her decks at 48 to 96 kPa [D: half rho v^2 to rho v^2], on decks built to carry about 5 [B]. The "down-blast" is one author's word for it [R5 2.1]; the pressure is plain arithmetic, and v1's 2.6 GJ counted only her weight in water.

### 4.7 The rest of her

Whatever leaves her at the break falls at its own speed, `sqrt(2 W' / (rho Cd A))` [D]:

| Piece | Falls at | To the bed | Carried by 0.1 m/s of current |
|---|---|---|---|
| the bow or the stern | 9.6 m/s | 6.5 min | 40 m |
| a single-ended boiler (about 52 t in water, 17 m2) | 7.6 m/s (R6: 7 to 8.5) | 8 min | 50 m |
| a hull plate, 2 by 1 m by 25 mm, flat | 1.6 m/s | 39 min | 230 m |
| a lump of coal, 10 cm | 0.84 m/s | 75 min | 450 m |
| a dinner plate, flat | 0.28 m/s (R6: 0.37) | 3 to 4 h | 1,000 to 1,350 m |

Two things fall out of it. The boilers reach the bed after the two hulls, not before, and the point they mark is good to about 100 m [R6 7], not to one. And the slowest things take hours, which is Ballard's "rained for several hours" [R5 3]: the field is a spectrometer, each class laid out at the current's speed times its own time of fall. A field is therefore cheap to lay: each piece's place and time are closed forms from the break, with no stepping.

### 4.8 What the model will not tell us

1. **Which way up she is rocking when she reaches the bed.** The wreck says stem first. The model can give how much she rocks; the phase at 3,800 m is chance.
2. **The stern's heading.** It lies turned end for end. A body that is the same on both sides does not turn; what turned it (a rudder swung over, the peeled deck, the torn side) is not in the model. And a stern that stood on end has no heading to keep: a twist about its own length while it stands, which Thayer and Beesley saw, decides which way it faces when it levels out [R5 10d]. Left out, or a seeded what-if (decision D42).
3. **What tore.** The fall knows spaces and their strengths. It has no plating.
4. **The 21 m that came apart.** Declared at the break (W7), not computed.
5. **Her speed to better than a tenth.** The weight in water and the drag are each good to about that.

## 5. The design

### 5.1 The pieces, and the contract between them

| File | What | New? |
|---|---|---|
| `core/readers/fall.js` | the engine: the sea's column and the bed; a piece built from the model (its slices, the girder's weights, its spaces with their water, air and openings); the step; and its registration as a reader of the night (state `sim.fall`) | new |
| `tools/fall_trials.js` | its trials, headless; a row of the gate (`fall`) | new |
| `site/parts/75_deep.js`, `.css` | the page's part: the views, the strip, the light, the bed, the sounds' hooks | new |
| `tools/deep_site_test.js` | its browser suite; a row of the gate (`deep_site`) | new |
| `core/night.js` | one branch at the top of `step()` (5.3) | 6 lines |
| `site/app.js` | three seams (5.4) | about 40 lines |
| `core/scenarios.js` | a depth for each preset's sea (1912: 3,800 m; Britannic: 119 m) | a field |

It lives under `core/readers/` because it is one: it reads the night's last state, keeps a state of its own, writes nothing back, and is bundled after `core/night.js` beside `girder.js`, which it needs. On a damage preset, where there is no watch, the page calls it directly.

**The contract** (`sim.fall`, plain data; the page reads this and nothing else of the fall):

```
sim.fall = {
  v: 1, rule: 'flag' | 'break', t0, k, t, done,
  sea: { depth, ... },                       // the column's tables and the bed's relief
  at: { X, Y, psi },                         // her place and heading when it began (0 on a preset)
  pieces: [{ id: 'bow' | 'stern' | 'whole', x0, x1,
             r: [X, Y, Z], q: [w, x, y, z], v: [u, v, w], om: [p, q, r],
             state: 'afloat' | 'under' | 'falling' | 'striking' | 'at rest',
             depth, speed, air, bury: Float64Array }],      // bury: metres in the mud, slice by slice
  debris: [{ cls, X, Y, tDown }],            // closed forms: where and when each lands
  events: [{ t, id: 'under' | 'report' | 'strike' | 'rest', piece, depth, energy, speed }]
}
```

Z1 writes it and Z2 reads it, so the two can be built at once. Z2's first feed is a stub that fills it with a flat fall at 9.7 m/s: that is v1's "drawn fall", kept as a test feed and never shipped.

### 5.2 The hand-over, in three stages

| Stage | When | Her pose | Costs | The bow's 772 m |
|---|---|---|---|---|
| H1 (Z3) | at the flag, T 156.94; she is cut in two there | the model's: 69 degrees, on her beam ends | nothing: no fingerprint moves | fails, about 1,400 m [M: e34], and says why |
| H2 (after Z4) | at the flag | upright, by the head | Z4's cascade | to be measured |
| H3 (after the break is in the model: B3, B4) | at the break, by her own loads against her own strength; both parts are free bodies from that step (5.6) | the record's kind | the break's refit | the trial that counts |

At any stage the hand-over rebuilds her state honestly: the water in each space capped at what it holds (13,634 t of phantom water dropped), the rest counted as air; her pose and rates from the core; on a watch her place, heading and way from `sim.mo`. H1 is an interim rule and is labelled as one on the page and in the trials: "the break is taken at the flag (the record: T 157); her pose there is the model's, not hers". It happens to give the witnesses' picture of the stern: at the flag the cut is 47 m under and the taffrail 62 m up [M: e30], so the stern stands as a spar on its own air until that air finds its way out, then slides under.

### 5.3 The clock after the flag

Today nothing steps after the flag. One branch at the top of `Night.step()`: once `sim.foundered`, run the script's orders that are due, count the step, advance `sim.t`, step the readers, return. The model, the plant, the ice and the watch's hash are never touched after the flag, so a foundered watch's fingerprint is what it is today (`3810e155` for 1912). The suites and the forecast all stop at the flag already (`while (!sim.foundered)`; `forecaster.go`), and `forecastOf` drops a reader's state by its key. The fall reader begins the fall on the first such step.

The other readers then run on, which they must for the hours after anyway (BACKLOG W17): the boats on the water, the wireless silent, Carpathia on her way to T 265. They guard on the flag already (`people.js:222`, `reports.js:547`); none has been stepped past it, so each suite gets a row for a watch stepped ten minutes on. On a preset the page's own loop steps the fall. The page runs while the fall does, and "Foundered" on the Play button becomes "On the bed" when it is done.

### 5.4 The page

Three seams in `site/app.js`: the loop goes on while `sim.fall` is running, and the slide at `:2601` goes; each piece is drawn at its own pose (the hull is one object today: two copies, each clipped at the cut [appearance: the torn ends drawn as flat cuts]); the camera's limits are lifted for the fall (the target's floor at `:2485`, the zoom to 6 km, near and far by distance). Everything else is the part's.

What a night's end will look like with Z1 to Z3 in:

1. **2:17 am.** "Foundered", as today, and the card. The picture no longer stops. From the Boat's eye the stern stands on end against the stars with the air roaring out of her.
2. **The bow is already gone.** The eye goes with it. A strip down the right edge shows the whole 3,800 m to scale and two marks leaving the top. The sea's surface draws away overhead as a grid; it is dark within 200 m.
3. **2:19 to 2:20.** The stern slides under. Within the minute, dull reports as its spaces give way: how many and how deep are the model's.
4. **The long fall.** 9.6 m/s: the depth runs a kilometre every 104 s. Specks standing in the water go by, so that the speed can be seen. She rocks slowly.
5. **The bed** comes up out of the dark as a net of 50 m squares. She strikes; the mud goes up [appearance]; the eye stays.
6. **At rest.** The whole column in one picture, then the plan: the model's two pieces where they lie, and over them the survey's outlines of the bow, the stern and the boiler field, so that the model's answer and the wreck are seen together.

The part, in detail:
- **Views:** `deep` (with the bow, 400 m off), `sternfall`, `bed` (an eye on the bed where she will come down, looking up), `column` (all 3.8 km, from 6 km).
- **The strip:** the column to scale with true depths beside it: 200 m, where daylight ends by day; 730 m, where Fathom's boat is crushed (`C:\fathom\core\boat.js:97`); each thousand; the bed. Her pieces are marks with their speed. A tap takes that piece's view.
- **Readouts:** depth of keel, speed in m/s and knots, the sea's pressure in atmospheres and its temperature, the time since she went under.
- **Light:** the X-ray look lights itself and carries the fall as it is. The Night look gets a lamp 150 m off her that falls off with distance, "a lamp that was not there" [appearance], and Fathom's darkening water.
- **The card:** the Foundered card stands as today. Two lines are added as the pieces land: "The bow is on the bed at 2:24 am, 3,800 m down, 1.4 km from where she broke. The stern followed at 2:27."
- **The director:** new cuts after the flag, by the model's events alone: `under` (the Boat's eye, her own pace for 20 s), the first `report`, the fall (the player's pace), the last 150 m to the bed (the bed's eye, her own pace), `rest`.
- **Sound:** three laws, each a stated function of a number in the model: the air leaving (its volume flow), a report (the logarithm of its energy, heard after its distance over the speed of sound in the column), the strike (from the deep eyes only). Timbres are appearance.
- **A phone:** the strip covers neither the readouts nor the Bridge nor the card.

### 5.5 The rules it keeps

No fingerprint moves until Z4: the seams gate, the headway reference, the 1912 watch, the sweeps. The step is deterministic: sums in a fixed order, any draw from a stream named by the night's seed. The state is plain data. The page reads and never writes. A change to `dist/` needs its build, and the User Guide goes stale by design until its new chapter is written. Tests set causes, never conclusions; a band is not moved to fit the model.

### 5.6 The break before it: how this joins `DESIGN_the_break_and_two_bodies_v1`

That design answers Bo's other order: she must split by her own loads and not by a script, each part must then be its own physics, and the picture must show it. I have read it whole and I agree with its spine. The trigger is the girder's own moment against a strength. The strength is computed along her length from the section's plates and joints (Smith's method). Failure is a process (onset, hinge, tear, release) and not an instant. Each part inherits its share of mass, water and momentum exactly. The picture is two computed poses and no animation. Its prototype (`e40`) shows two parts stepping on the unchanged core.

What "not canned" comes to, once both documents are built:

| Computed, each step | Stated, with a band and a source | Drawn [appearance] |
|---|---|---|
| when she breaks (demand against strength); where (the station where their ratio first reaches 1); which side goes first (Smith's curve); how the joint dies (its falling branch); when it lets go (the ligament's strength against the joint's force); what each part then does, afloat, on end, under, falling, on the bed | the joints' strengths and the plating's buckling stresses; the hinge's length; each space's openings and strength; the drag and added-mass coefficients; the bed's strength | the tear's shape; the mud; the lamp; the specks in the water |

Where the two documents meet:

| Its stage | This plan | Note |
|---|---|---|
| B0, the roll to 80 degrees ("not looked into") | Z4 | the cause is section 1.3: the hull stops at B deck. Its own table shows what is at stake: with the list held she breaks at T 155.1 to 156.8 and 8 to 11 degrees of trim; free, she breaks lying 35 to 67 degrees over, or never |
| B1, the strength along her length; B2, "she would break here, now" as an event | as they stand | neither moves a number; both can start now |
| B3, the split; B4, the hinge and the tear | as they stand, but on the free body | items 1 to 3 below |
| B5, parts with a free attitude, "the same body the descent needs" | Z1 | one module, not two |
| B6, the picture | Z2 | the page draws a list of bodies from one contract (5.1) |
| B7, the cascade | with Z4's | two refits, one run of the long suites |

Seven places where I would change it or go further:

1. **Air cannot be left to the descent** (its 4.4 does). The stern on end is a spar standing on air trapped under its after bulkheads. That air is why it stood for between 20 seconds and five minutes, and why it then went with its spaces unflooded and was wrecked (section 4.3). On the core its stern lasts 7 to 12 minutes because the core's small openings between compartments do, for the wrong reason, what trapped air does in fact. So the two parts' minutes at the surface belong to the free body, with air. Parts on the core (its B3) are a test rig and a stepping stone, not where the stern should live.
2. **One free body, and a way to keep the core's hydrostatics at any angle.** The core integrates the hull as columns standing along the ship's own z, so its water levels fail as that axis lies down: hence the clamps at 77 and 80 degrees, which both of its parts hit. Build the same columns three times, along the ship's x, y and z, and at each step use the set whose axis stands most upright in the world, with a margin so that she does not flick between sets. The factor that blows up then never passes 1.73 [D: 1 / cos 54.7 degrees], and `hydroPass`, `nodePass` and `solveLevels` run as they are, at any attitude. With a quaternion for her attitude, and section 4.4's forces in place of the core's fitted damping, that is the body both documents need.
3. **The hinge is not a detail: it decides the stern's minutes, and the bed can test it.** With her bottom still joined, the bow hangs from the stern. The pull is large: 18,000 to 19,400 t in water once the bow is flooded, on a stern that can carry 33,000 t before it is under [M: e30]. That stands the stern on end and takes it down with its spaces dry, in the record's two or three minutes, where a stern let go at once must first flood itself. A double bottom of about 1.5 m2 of steel carries 20,000 to 35,000 t in tension [B], so it can hold that long. The joint therefore belongs in the free body as a constraint whose force is computed every step and compared with the ligament's strength, as the design says. And section 4.4 gives the check: a bow let go from a standing stern lands twice as far off as the survey has it.
4. **The stern's time has four causes, and only one is "how much is torn".** Where the cut falls: the wreck's stern begins in the engine room, so its largest space is open from the first second. How open she is fore and aft above the bulkhead deck: the model's overflow paths were fitted to E deck's corridors forward, 16 m of weir in all, where the decks aft are open across her beam. Whether the bow still hangs on her (item 3). And her air (item 1). Each is an input with a source and a band; the record's one and a half to three minutes is the test of all four together.
5. **The torn zone can come from the hinge's own length.** A hinge in a girder is about as long as the girder is deep [B: the usual rule]: 20 m here. The wreck is missing 21 m, and the bottom of that length came out as two pieces of 12 m [R5 2.3]. Let the hinge's length be a stated number, let the torn zone follow from it, and keep the 21 m as the check.
6. **Where she breaks will stay a coin's edge, and should be tested as one.** The demand is within 9 % of its peak over 30 m of her length (its 3.1), and both the weight curve behind the demand and any computed strength are good to about a tenth. Smith's method is still the right tool, because it is what makes the place a consequence. But the test is the record's band (x -16 to -27), the strength's scale belongs among the Carpathia search's guesses, as the design says, and no figure is nudged until the place comes out right.
7. **Nothing of the break should be shown before Z4.** At its onset today she lies 35 to 49 degrees over. Until the roll is mended, a picture of the break is a picture of the fault. The interim hand-over therefore stays at the flag (5.2, H1), and B2's event appears only as a mark on the girder's gauge.

**What the page needs for the break**, beyond 5.4: one list of bodies in place of the single `S.sim` the page reads today, each body with its own 64 water levels, free surfaces and readouts. The hull is drawn once for each body, each copy discarding what lies beyond a shared, seeded tear (the design's `tear(y, z)`: its place is the model's, its shape is appearance). A cap on each cut face shows the decks and the double bottom in section. Every house, funnel and mast belongs to the body its x lies in, and those across the torn zone go to the debris. The lights go out at the event, because her mains were cut there: that replaces `breakTrimDeg: 20` (`core/systems.js:70`), which is a script today. The sound's level is the rate of the tear's work, about 1 GJ in all [D: 5 GN m through a fifth of a radian]. The director cuts on the onset and on the release, both the model's events.

## 6. Build order, each step with its test

Sizes are the backlog's. "Cascade" means the 1912 night moves and everything fitted to it is refitted.

| Id | Step | Size | Needs | Cascade | Done when |
|---|---|---|---|---|---|
| R5 | The research note on the wreck and the fall | S | - | no | done: its section 10 gives the bands below |
| R6 | The research note on the physics | S | - | no | done: its coefficients are run in `e34` |
| **Z1** (the break design's B5) | **The free body, headless** (`core/readers/fall.js`, `tools/fall_trials.js`): any attitude, section 4.4's forces, the bed in its simplest form | M | - | no | the trials table below |
| **Z2** (its B6, first half) | **The deep:** the page draws a list of bodies from the contract; the views, the strip, the light, the bed; fed by the stub and then by Z1 | M | 5.1 | no | its browser suite below |
| **B1, B2** (the break design's) | **Her strength along her length** by Smith's method; the onset as an event, and a mark on the girder's gauge | M, S | - | no | that design's tests 1 to 3; the panel's moduli and neutral axis reproduced; the ultimate moment amidships inside 4.0 to 5.4 GN m untuned |
| **Z3** | **The join:** the hand-over at the flag (H1), the branch in `night.js`, the page's loop, the readers stepped on, the card's lines | S to M | Z1, Z2 | no | below |
| Z4 (its B0) | The envelope carried up to the boat deck: the tiers above B deck buoyant and leaking; with the staircases | L | D41 | **yes: the first refit** | her list no more than 15 degrees to the end; the girder reaching 4.0 to 5.4 GN m at 8 to 17 degrees of trim; the flag within 5 minutes of T 160; every validation verdict kept or explained |
| B3, B4 (W7 in BACKLOG) | The split, the hinge and the tear, on the free body; the hand-over at the break (H3); W7c is Bo's | L | Z4, Z1, Z6, B1 | **yes: the second refit** | that design's tests 4 to 7 (the station in x -16 to -27, trim 10 to 17, T 157 to 158.6, the stern under 1 to 5 minutes later); and the 1912 night's own row of the fall's trials |
| B7 | The long suites, once, after both refits: the Carpathia search, the sweeps, the Guide | M, machine time | Z4, B4 | - | `GATE: PASS` |
| Z5 | The bed takes her: slices in the mud, burial along her length, the landing's bending on the girder's gauge, the following water as a pressure | M | Z1, R6 | no | below |
| Z6 | Air, and any attitude at the surface: the four fates for each space; the columns built along three axes (5.6, item 2) | M | Z1 | no | below |
| Z7 | The debris field, and the wreck as found drawn over the model's | M | Z3 | no | below |
| Z8 | Other seas: a depth for each preset | S | Z3 | no | below |

**Z1's trials** (MUST unless marked; each band carries its source):

| | Cause set | Outcome | Band |
|---|---|---|---|
| 1 | a sphere and a flat plate of known weight, let go | terminal speed | the closed form within 1 %, the closed form certified by Abacus as the trials' steady speeds are |
| 2 | any piece with no air, let go from rest | drag's work plus the mud's equals the potential lost less the kinetic kept | to 1e-6 |
| 3 | a space open below, taken to 100 m | the air's volume | 9.1 % of its volume at the surface [D] |
| 4 | the stern with all its air kept and no vent; then with none | floats; leaves the surface at once and never rises | - |
| 5 | each part let go end on; a spheroid held at 30 degrees in a stream | she turns broadside and lands level; the spheroid feels Munk's moment `(k2 - k1) rho V U^2 sin a cos a` and no net force [R6 10.9]. CHECK: if she rocks, it is near the experiments' frequency, `0.126 sqrt(drho / rho x g / L)` [R6 2.1] | the moment to 1 % |
| 6 | the bow, flooded, let go at rest at 11 to 25 degrees by the head, listing 0 to 10 | time to the bed | 4.5 to 7 min [R5 10b: reconstructions] |
| 7 | the same, and the stern let go broken end 45 to 85 degrees down, with each part's lever fitted so that the bow lands 772 m ahead of the point under the break and the stern 148 m from it | the size of the fit | no more than 3 m from the model's own lever, for either part. CHECK, printed beside it: where each lands untuned (the prototype: 560 to 750 m and 70 to 190 m), and the bow's dive and creep apart |
| 8 | the same | speed at the bed | 5 to 10 m/s (Best and others, computed); 10 to 13.4 is the outer band |
| 9 | CHECK: a bow let go standing 69 degrees by the head | where it lands | reported against 772 m: the mark of a late release (5.6, item 3) |
| 10 | 7's pair | bow to stern | 550 to 800 m [R5 10b] |
| 11 | the same spec twice; a fall saved half way and taken up again | the bed's place and time | the same bits |
| 12 | CHECK: the 1912 preset's state at the flag | the bow's place | reported against 772 m; expected about 1,400 m until Z4, and the row says so |

**Z2's suite:** each piece's keel within 1 m of the bed at rest, as the model has it; the depth readout the model's to 0.1 m; the strip's marks at the right fractions of its height; the watch's fingerprint the same with the part as without; at the page's fastest pace every event still fires; the strip clear of the readouts, the Bridge and the card on a desktop and a phone; no error on the console; six pictures taken and looked at.

**Z3:** the systems suite's 1912 fingerprint and the page's replay fingerprint unchanged; a watch stepped to the bed and replayed from its log lands both pieces in the same place to the bit; every reader's suite green with a watch stepped ten minutes past the flag; the forecast still equals the watch; `node tools/gate.js` ends `GATE: PASS`.

**Z5:** the bow let go as in trial 6 and arriving 5 to 40 degrees by the head: its stem 12 to 20 m in and its after end under 2 m [R5 10b]; arriving flat: under 9 m anywhere (a what-if that shows why the wreck is not that). The stern arriving rudder first: the rudder 10 to 17 m in. A penetrator of constant area stops where the energy balance says, 25.25 m in R6's case [R6 10.9]. CHECK: the landing's bending moment against the girder's capacity at the two stations where the wreck is bent.

**Z6:** a part's water levels and buoyancy agree across the three sets of columns to a stated tolerance at 45 degrees, and nothing jumps when the set in use changes. With her vents and the water's way in as stated bets, the stern let go afloat is under in one and a half to three minutes (the witnesses); its first space fails within a minute of that, between 18 and 305 m down (Mengot; the panel; Ballard [R5 10b]). CHECK: the number of reports (Pitman's four). No space of the bow fails.

**Z7:** the field's long axis lies down the current; its heavy end is at the break and its light end downstream; the last piece lands more than two hours after her (Ballard's "several hours"); its extent is reported against 1,700 by 875 m.

**Z8:** CHECK: Britannic's preset with the sea 119 m deep: her stem touches the bed while her stern is still above the sea [R5 7: a digest].

## 7. Decisions needed (who decides)

Numbered on from the ether brainstorm's D35. My pick is first in each; silence is not consent here, since nothing starts until Bo picks it.

| | Decision | Pick | Who |
|---|---|---|---|
| D36 | What is built first | **Three lanes at once: Z1, Z2, and the break design's B1 with B2; then Z3.** The other way is v1's drawn fall alone: a day, and thrown away | Bo |
| D37 | Before W7, does she break at the flag? | **Yes, in two at x -23, labelled as an interim rule.** Or she falls whole | Bo |
| D38 | The sea's depth for 1912 | **3,790 m** (R5's central figure; band 3,770 to 3,810), with a slope of half a degree drawn from the night's seed. This note says 3,800 where it rounds; v1's 3,784 is dropped | Bo |
| D39 | What is seen in the dark | **The X-ray look as it is, and a drawn lamp in the Night look**, labelled appearance. Or the X-ray look only | Bo |
| D40 | The fall's pace | **Her own pace for three moments (the stern going under, the first report, the last 150 m and the strike); the player's pace between.** Or all six and a half minutes at her own pace | Bo |
| D41 | The envelope to the boat deck (Z4) | **Done with the staircases, in one refit: tell that session now.** Two cascades a week apart would cost the Carpathia search and the sweeps twice | Bo |
| D42 | The stern's turning | **Left out, and said so.** Or a what-if turned by one number drawn from the seed | Bo |
| D43 | Her rocking as she falls | **Computed from the published plate terms if R6 finds them and trial 5 passes;** else one stated amplitude, labelled a bet | Bo |
| D44 | Which moment breaks her (W7c, open since 17 November) | **Measure it again after Z4:** today's figures (4.0 GN m at trim 6.7, 5.3 at 17.9) are taken with her on her beam ends | Bo |
| D45 | The survey's outlines over the model's wreck at the end | **Yes** | Bo |
| D46 | One free body for the break's two parts and for the fall, with her columns built along three axes | **Yes: one module (Z1, Z6), and the break design's B5 is it.** Or the break keeps its parts on the core and hands them over when they go under, clamps and all | Bo |
| D47 | The hinge | **In the free body, as a joint whose force is computed each step. Both readings are run (let go at once; hanging by her bottom) and judged by the stern's minutes and the bow's place on the bed.** Or instant release only | Bo |
| D48 | When the break is first shown on the page | **After Z4. Before it, only a mark on the girder's gauge.** Or as soon as B3 runs, lying 35 to 49 degrees over | Bo |
| D49 | Her weight's lever as the fall's one fitted number (trial 7) | **Yes, declared, and limited to 3 m.** Or no fit, and her place on the bed is reported as it comes | Bo |

## 8. Risks

- **Her place on the bed hangs on a lever of a metre or two** (4.4). The agreement with the survey today may be luck. Trial 7 is built as a fit with a limit for that reason. If the three-dimensional engine needs more than 3 m, the weight curve or the forces are wrong, and that is a finding too.
- **Four documents and three sessions want the same physics.** The staircase work is in `core/core.js` now and measured the superstructure today (`e26`); the break design wants the core's step and its own `core/break.js`; this plan wants the envelope. Z4 done apart from the staircases means two refits and a merge in the core's step. The break built on the core and again on the free body means building it twice (D46).
- **The free body is the largest piece here** and carries the most: any attitude, air, a joint, the fall, the bed. Z1 and Z6 split it so that the fall can ship before the stern's minutes do, but its design has to be right for both from the first line.
- **The strip model damps her rocking**, so it will arrive flat where the wreck says stem first, until D43 is settled. Z5's burial depends on it.
- **The record is thinner than it reads.** One sediment core. One computed speed. No measured time of fall. The positions are good to 40 m; the boilers mark the break to tens of metres more (4.7).
- **Readers have never been stepped past the flag** (5.3). Each may hold a surprise.
- **The cut hull is drawn, not modelled.** Two clipped copies of the hull double its draw calls; a phone may feel it.
- **Six kilometres of view** is new to a page whose camera has never been 2.2 km from her: the sea's plane, the stars and the fog were tuned for near.
- **R6's coefficients are ranges from textbooks, most of them remembered and not opened** (it says so, row by row). Hoerner's and DNV's tables, True's rate constants and the mine-drop papers' formulas were not found. They are better bets than mine, and still bets.

## 9. Rows this would add to BACKLOG.md (not added: nothing starts until Bo picks it)

| Id | Item | Size | Done when |
|---|---|---|---|
| R5, R6 | The two research notes | S | done 2026-11-19 |
| Z1 | The free body, headless: the fall's engine, and the body the break's parts need | M | its twelve trials (section 6) |
| Z2 | The deep: the page's part | M | its browser suite |
| Z3 | The join at the flag | S to M | no fingerprint moved; a watch replays to the bed to the bit |
| Z4 | The envelope carried up to the boat deck (a cascade; with the staircases) | L | her list within the record's to the end; the validation table |
| Z5 | The bed takes her | M | the stem 12 to 18 m in, her after end on the mud |
| Z6 | Air and reports | M | the stern under in one and a half to three minutes; its first space gone within the next |
| Z7 | The debris field and the wreck as found | M | the field down the current, the last piece hours after her |
| Z8 | A depth for each preset's sea | S | Britannic's stem on the bed with her stern in the air |

The break design's stages B1 to B4 and B7 are its own rows. Its B0 is Z4, its B5 is Z1, and its B6 is Z2. W7 in BACKLOG is its B3 and B4, with one more line in the test: the 1912 night's own row of the fall's trials.

## 10. The pick, in five lines

1. **Three lanes at once, today.** None moves a number and no two share a file: **Z1** (the free body and its trials), **Z2** (the page draws a list of bodies; the deep), and **B1 with B2** (her strength along her length; the onset as an event).
2. Join the first two with **Z3**. From that day the pool is gone: she goes to the bed in two pieces, on physics, and the page says plainly that the break is taken at the flag and that her pose there is not yet hers.
3. Tell the staircase session about **Z4** now (D41). It is the one thing here that another lane is already half way into, and it is what both the break and the hand-over wait on.
4. After Z4's refit, put the break into the model on the free body (**B3, B4**, with **Z6**'s air and three sets of columns), refit once more, and run the long suites once (**B7**).
5. Z5, Z7 and Z8 as Bo picks them. Each is its own finding: how she lies in the mud, the field, Britannic.

## 11. Sources, and what was not checked

Read in this repository at `a97a6bd`: `core/core.js` (whole), `core/scenarios.js`, `core/night.js:230-420`, `core/readers/girder.js:1-370`, `core/readers/world.js` (the wreck's place), `site/app.js` (`:1126-1197`, `:2404-2503`, `:2552-2607`, and its uses of the flag), `site/parts/80_director.js:40-71`, `tools/gate.js` (the suites), `tools/titanic.js`, `HANDOFF.md`, `BACKLOG.md`, `CHANGELOG.md:1-70`, v1 of this note.

Read in `C:\fathom` at `11ea82b`: `CLAUDE.md`, `core/ocean.js`, `core/systems.js`, `core/motion.js` (all three whole), `core/patrol.js:150-209`, `site/app.js:118-189`, and the lines the table in section 3 names.

Measured (scripts in `docs/research/experiments/`, outputs in `results_2026-11-19/`): `e30_last_minutes_and_the_flag`, `e31_core_run_on_and_upper_split`, `e32_envelope_to_the_boat_deck`, `e33_fall_prototype`, `e34_fall_prototype_whatifs`. Each takes the tree to run on as its argument; today's outputs are `a97a6bd`'s.

Research notes of this session's two agents (Opus 5.5), both finished:
- **R5**, `docs/research/RESEARCH_the_fall_and_the_wreck_v1_2026-11-19.md` (433 lines; finished 13:50 CST): read here in sections 1 to 7 and 10. Its positions for the bow and the stern come from an unsourced page that agrees with Ballard's boiler field and the MAIB's stern; Best and others (2000) was read as an abstract only; Encyclopedia Titanica and Britannica refused.
- **R6**, `docs/research/RESEARCH_falling_hull_physics_v1_2026-11-19.md` (450 lines; finished 14:03 CST): read here in sections 1 to 5; its sections 6 (the bed), 7 (debris) and 10 (for the model) are taken from its closing report and were not read line by line. Most of its coefficients are textbook ranges stated from memory, and it marks them so.

Read, and joined in section 5.6: `docs/DESIGN_the_break_and_two_bodies_v1_2026-11-19.md` (another fork, 13:50 CST), whole. Its experiments `e40` and `e41` were not run again here; its figures are quoted as it gives them.

Corrected on the way: `e34`'s first table of her weight's lever (13:44 CST) put the weights back before the run and so measured nothing; it was mended, run again and is not in the results. The lever's real effect is the opposite of what that void table suggested (section 4.4).

Not checked: the 1912 watch (motion, plant and ice) as opposed to the damage preset, whose flag is 2.25 s later; her heading at the flag on a watch; any browser; whether the readers run cleanly past the flag; the working tree as the staircase session has it now; Smith's method on her section (nothing here computes a strength). The prototype is two-dimensional, and section 5.6's three sets of columns, its joint and its air are designs with no code behind them yet. They show what to build and what to test it for, and prove nothing about the wreck.
