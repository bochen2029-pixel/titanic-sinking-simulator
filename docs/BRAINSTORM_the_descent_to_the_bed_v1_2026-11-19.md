# Brainstorm: after she goes under, all the way down (v1)

Written 2026-11-19 13:15 CST. Bo's order: "after the Titanic sinks it is like a toy model in a shallow swimming pool; it does not sink to the bottom of the Atlantic and gets stuck halfway. I have a similar sim for a submarine, `C:\fathom`, that goes miles deep. Reference it and brainstorm how the Titanic can sink to a realistic depth; write it up."

**This is a brainstorm. No code was changed.** Revisions are new files (`..._v2_...`).
Tags: [M] measured this session, [R] read (file and line, or a linked page), [D] derived (arithmetic shown), [B] bet.

## 1. What happens today, and why it looks fake

1. **The model stops at an angle, not at the bottom.** `core/core.js:731` declares "Foundered" when the hull's top is 0.5 m under, *or* the trim passes 1.2 rad (68.8 degrees), *or* nothing is displaced. On the 1912 run the trim rule fires first [M]:

| At "Foundered" (T 156.94 min) | Value [M] |
|---|---|
| trim | 69.0 degrees by the head |
| list | 80.2 degrees to port (on her beam ends) |
| stern's top | 58.7 m **above** the sea |
| stem's top | 187.7 m below it |
| sinking rate | 1.2 m/s |
| floodable volume still holding air | 53,113 of 107,597 m3 (49 %), all of it aft of boiler room 5 |
| net buoyancy | about 23,000 t still to spare [D: 49,021 t of ship + 55,846 t of water that fits in her, against 125,019 m3 x 1.025 = 128,144 t the hull would displace] |

   So the page says "Foundered" while the model ship is still afloat by 23,000 tonnes with a third of her standing out of the sea.
2. **Then the page slides the frozen ship down 140 m and stops.** `site/app.js:2601`: `if (sim.foundered && S.post < 140) S.post += dtReal * 14;` and `:2419-2436` subtract `S.post` from her height. That is a rigid slide of the frozen pose at 14 m/s for ten seconds [R]. No physics runs after "Foundered" (`site/app.js:2566`: the page steps only while `!sim.foundered`). The camera's target is held above 60 m down (`:2485`). There is no sea bed in the scene at all.
3. **The core cannot simply be run on.** Three things in it are surface physics only:
   - the spaces are ponds with a free surface, freely vented: no air is modelled, so nothing is ever "trapped";
   - a full space is "pressed up" by a stiff virtual head (`core/core.js:498-500`, `:669-675`): at "Foundered" the model holds 69,480 t of water in spaces that can hold 55,846 t [M], which is harmless at the surface and wrong under it;
   - the trim is clamped at 1.35 rad and the roll at 1.4 rad (`:691-694`), and the damping is fitted to a floating ship.
4. **She is one piece.** The hull girder's gauge reads the bending (`core/readers/girder.js`) but nothing breaks (BACKLOG W7 is open: "the break and the stern's three minutes"). The real ship went down as two.

## 2. What really happened below the surface (the target)

| Fact | Value | Tag |
|---|---|---|
| Depth of the bed at the wreck | about 3,770 to 3,790 m: a current meter 2 m above the bed, a little north of the bow, stood at 3,770 m, at 41 deg 43.97' N, 49 deg 56.73' W | [R: [EGU 2004 abstract](https://mirrors.iao.ru/egu/data/EGU04-A-00557.html)]; the usual figure of 12,415 ft (3,784 m) is [B: from memory] |
| The two parts on the bed | bow and stern about 600 m apart | [R: [Encyclopedia Titanica, geology of the site](https://www.encyclopedia-titanica.org/the-geology-of-the-titanic-site-and-vicinity.html)]; [Britannica](https://www.britannica.com/question/When-did-the-Titanic-sink) says "some 2,000 feet (610 m)" |
| Debris field | about 1,700 m north to south by 875 m east to west | [R: the same Encyclopedia Titanica page] |
| The bow's fall | about 30 mph (13 m/s), about six minutes to the bed; Britannica words it as what "reports would later speculate" | [R: [Britannica](https://www.britannica.com/question/When-did-the-Titanic-sink); an [Encyclopedia Titanica thread](https://www.encyclopedia-titanica.org/community/threads/how-long-till-she-hit-the-bottom.9396/) gives the same order: about 30 mph, five to six minutes] |
| The bow on the bed | the prow in the sediment up to the base of the starboard anchor | [R: a search summary of a Biodiversity Heritage Library document on the 1985-86 expeditions; the document itself was not opened] |
| Pressure at the bed | about 38.6 MPa, 381 atmospheres, 5,600 psi | [D: 1,040 kg/m3 x 9.81 x 3,784 m] |
| The break and the end at the surface | lights out and the hull breaks at 2.17 am (T 157 min); she is gone at 2.20 am (T 160); Symons saw her split "abaft the after expansion plate" | [R: `C:\temp\titanic-stairs-scratch\PART_A_staircases_geometry_and_evidence.md`, a partial note of this session, citing Halpern and the British Inquiry 11510-11525]; the angle of the break is disputed, 15 to 45 degrees [B: from memory] |
| The staircases as evidence of the fall | the forward staircase's woodwork is gone from the wreck (floated out, blown out when the bow struck, or decayed: three untested theories); pieces of the aft dome and balustrade lie in the debris field, so the aft staircase came apart at the break | [R: the same partial note, from Wikipedia only] |
| The stern's fall: air in it; it burst or was crushed in the first few hundred metres, turned as it fell, and landed wrecked; the bow, already full, planed forward and landed whole | | [B: from memory; no number here is sourced yet] |
| Five single-ended boilers fell straight from the break and mark where she broke up | | [B: from memory] |

**The honest state of the record:** the depth, the separation and the debris field are measured. Everything about the fall itself (speeds, angles, when the stern failed) is reconstruction from the wreck, not observation. A research note has to sort the reconstructions before a model is tuned to any of them (section 8, R5).

## 3. What Fathom already has that this needs

Fathom was built on this repository's pattern (its `CLAUDE.md:5` says so): the same module shape, dt = 0.25 s, plain-data sim, seeded streams, the same gate. Both are Bo's (MIT). The catch is the frame: Fathom's z is DOWN and y is to starboard; here z is up and y is to port. The mapping must be written once, as `core/motion.js` does for MMG.

| Fathom | What it does | Use here |
|---|---|---|
| `core/ocean.js:25-33`, `:37-53`, `:62-94` | a water column to 6,000 m: temperature and salinity profiles (one is "ice-edge water"), density with the water's own compression (`+4.5e-3 kg/m3` a metre), the speed of sound; the default depth is already 3,800 m | the sea she falls through: density 1,028 at the surface to about 1,046 at the bed [D: `1027 x (1 + 1.7e-4 x 10.5) + 4.5e-3 x 3800`], temperature for the people and the look |
| `core/ocean.js:84-87`, `:117-121` | the bed: a depth, with four long swells of relief drawn from the seed; three bottom types (sand, mud, rock) | the bed she lands on, at 3,784 m, mud |
| `core/systems.js:33` | `pAt`: absolute pressure at a depth, bar | the pressure on every space |
| `core/systems.js:92-103` | flooding through a hole against the air in a closed room: the air is squeezed as the water rises, and the room is "full" when the two pressures meet (`full = vol x (1 - ATM / ps)`) | exactly the missing piece: trapped air in the after spaces, compressed as she goes down (Boyle) |
| `core/systems.js:160-162`, `core/boat.js:95-97` | the hull works and is heard below test depth (`creak`), and fails at its own collapse depth, drawn per hull | the after spaces that still hold air giving way; the sounds part already has creaks |
| `core/motion.js:118-167` | six degrees of freedom under water: weight against buoyancy in the local density (`net = W - Bu`), cross-flow drag, added masses solved with the velocities, kick then drift | the form of the falling body's step; her coefficients would be ours, not a submarine's |
| `core/patrol.js:180-188` | striking the bed: the speed of the hit, a `grounded` event, damage from it | the landing |
| `site/app.js:22-23`, `:1351` | the scene's origin is the boat and the earth is moved past her, "so that numbers stay small 30 km from the start" | the single most useful viewer idea: keep the ship at the origin and move the sea and the bed; no jitter at 3.8 km |
| `site/app.js:124`, `:128` | a logarithmic depth buffer, a far plane of 400 km | ship (269 m) and column (3,784 m) in one picture |
| `site/app.js:132-137`, `:1354` | the water all round as a sphere that darkens with depth (`exp(-depth / 260)`) | the light going as she falls [appearance] |
| `site/app.js:140-185` | a grid plane on the surface with 100 m and 1 km squares; the bed as a wire net laid again as the boat moves | the scale cues, in the X-ray look's own language |

## 4. The physics of going down

### 4.1 The weight she falls with
Fully flooded, what the sea still holds up is only her solid matter: the hull's envelope less its floodable space, 125,019 - 107,597 = 17,422 m3 [M], or 17,858 t of buoyancy. Her weight in water is then 49,021 - 17,858 = **31,163 t**, 3.06e8 N [D]. (The model's permeabilities stand in for the solids; a weight budget by material, steel 0.87 of its weight in water, coal about 0.2, wood negative, would refine it [B].)

### 4.2 The air
At "Foundered" she holds 53,113 m3 of air [M]. She needs 30,400 m3 of it to stay up [D: 31,163 / 1.025]. Air that cannot get out is squeezed: `V(z) = V0 x p0 / p(z)`, with p rising one atmosphere every 10 m. So:

| Depth of the air | Air left of 53,113 m3 | Lift | She is |
|---|---|---|---|
| 0 m | 53,113 m3 | 54,400 t | afloat by 23,000 t |
| 7.5 m | 30,400 m3 | 31,160 t | just awash: neutral [D: p / p0 = 1.747] |
| 100 m | 4,870 m3 | 5,000 t | 26,000 t heavy |
| 1,000 m | 525 m3 | 540 t | 30,600 t heavy |
| 3,784 m | 139 m3 | 143 t | 31,000 t heavy |

Two things follow. Trapped air cannot hold her once the air is a few metres under: this is why a ship goes, and keeps going. And there are three fates for each pocket of air, which the model must tell apart: it **vents** (bubbles out through whatever is above it as she tilts), it is **squeezed** in a space open at the bottom, or it sits in a **tight** space at one atmosphere until the steel round it gives way (ordinary ship plating fails at a head of tens of metres [B]), which is the stern's "implosion".

### 4.3 The fall
A body of weight in water W' reaches `v = sqrt(2 W' / (rho Cd A))`:

| Attitude | Area A | Cd | Terminal speed [D] | Time to 3,784 m |
|---|---|---|---|---|
| whole ship, flat (keel or side down) | about 6,000 m2 | 1.2 | 9 m/s | 7 min |
| whole ship, end on | about 500 m2 | 0.9 | 36 m/s | under 2 min |
| the record's bow | | | about 13 m/s | about 6 min |

The record sits between flat and end-on, which is what a long flooded hull does: it planes. So the body must have lift and a changing attitude, not one drag number. The cheap way to get that, with the geometry the core already has: every 3 m slice of the hull (`cols.slices`) feels a cross-flow drag from the water's speed square to it and a small skin drag along it; summing the slices gives the force and the turning moment together, so she noses over, planes, and can fall like a leaf, with no coefficients borrowed from a submarine. Added mass in each direction (about the displaced water's mass across her, a few per cent along her) goes into the step the way Fathom's does.

### 4.4 The bed
She arrives with about 0.5 x 31,000 t x (13 m/s)^2 = 2.6 GJ [D] and the water behind her still moving. The mud takes it: a bearing strength rising with depth of penetration gives how far the prow buries (the record: to the base of the starboard anchor) and how hard she stops. Then the following water: the "down-blast" that is said to have flattened the bow's decks is a reconstruction [B] and would be appearance at most.

## 5. Ways to build it

Each rung stands on the one before. S, M, L are the backlog's sizes.

**A. The pool gets a bottom (S, viewer only).** Replace the 140 m slide with a fall at a stated speed to a bed at 3,784 m; the camera follows; a depth readout; the water darkens; a wire bed; "On the bed at 2.26 am, 3,784 m" on the end card. Marked [appearance] throughout: the depth and the time are right, the motion is drawn, not computed. No model fingerprint moves. It stops looking like a pool in a day; it is still a toy, with a longer string.

**B. One body, computed (M).** A new module, `core/descent.js`, takes the sim at "Foundered" and steps it on in three phases:
1. *going under*: the core's own buoyancy of the part below the surface, the flooding continued with the air law of 4.2 in place of the free vent, until she is heavy and wholly under;
2. *the fall*: the strip drag of 4.3, weight in water from 4.1, air squeezed or lost by 4.2, the water column from a port of Fathom's `ocean.js`;
3. *the bed*: contact with the relief, penetration, rest.
   Because it starts only after `sim.foundered`, every number before that stays to the bit: the calibration, the 1912 fingerprint (`3810e155`), the Carpathia search, the sweeps. **No cascade.** Tests set causes: a brick of known weight and area reaches the closed-form terminal speed; with no air she leaves the surface at once; energy is accounted for; the 1912 night reaches the bed within a band taken from the research note; the watch's fingerprint at "Foundered" is unchanged; a replay reaches the same bed position to the bit. What it gets wrong, knowingly: she is one piece, so the 600 m between bow and stern cannot be reproduced, and she starts from the model's last pose (section 6, item 1).

**C. She breaks, and two bodies fall (L; needs W7).** The girder's gauge already knows where and when the bending passes her strength. The break makes two bodies with their own weight, air and slices: the bow, full, planes away; the stern, with nearly all the air, floats for its minutes, goes under, and its tight spaces fail on the way down; the boilers of boiler room 1 fall free. Now the record can judge the model: 600 m apart, the debris field's 1,700 by 875 m, the bow whole and the stern wrecked, the boilers under the break point. This is the first rung that is true to the wreck, and the only one whose result is a finding rather than a picture.

**D. The wreck and the hours after (M, after C).** Debris as bodies with their own fall speeds (coal, plates, the boilers) laid as a field; the bottom current's drift on the slow pieces; the bed's plume [appearance]; the wreck as found in 1985 as an end view, with the survey's plan laid over the model's; the clock running on to Carpathia with the readers (BACKLOG W17).

**Wild ones, not costed.** Fathom's ocean and this one are the same water: a Fathom patrol could be at 41 deg 44' N on 15 April 1912 and hear her go (her failing spaces as sources in Fathom's sonar), or a boat of Fathom's classes could follow her down as far as its own collapse depth, 730 m, a fifth of the way (`core/boat.js:97`). A falling ship is also a ready-made seat for Fathom's port: frames out, no orders in.

## 6. What stands in the way (said now, not found later)

1. **The last two minutes of the surface model are wrong, and they are the fall's starting point.** She rolls to 43 and then 80 degrees to port in the last two minutes [M: this session's run]; the record has about 10 degrees. And "Foundered" is declared by trim with the stern 59 m in the air. Rung B inherits both. Either rung B starts from that pose and says so, or the end of the surface model is mended first, and that *is* a cascade (the fingerprint, the wreck's position in `core/readers/world.js`, the boats' fit, the Carpathia search).
2. **What "Foundered" means has to stay put.** Everything downstream keys on `sim.foundered` and `founderT`: the forecast, the calibration's score, the readers, the director, the end card, the Carpathia search. The descent should add a later state (`sim.descent`, with its own events: "wholly under", "the after spaces give way", "on the bed") and leave the old flag alone.
3. **The clock after the sinking.** The page stops time at "Foundered". A fall of six minutes needs the watch to step on: the readers go on (the boats, the wireless falling silent, Carpathia), the forecast worker must not copy the descent, and a replay must still be seed plus orders.
4. **The 80 degree roll, the clamps and the pressed-up water** (section 1, item 3) mean the handover from the core to `descent.js` has to rebuild her state honestly: water capped at what each space holds, the rest counted as air.
5. **Seeing it.** Below about 200 m there is no daylight and her own lights are out. Either the X-ray look carries the whole fall (it is self-lit, and Fathom's grid and wire bed are in its language), or the Night look gets a stated, artificial light [appearance]. The scale needs a cue: the ship is one fourteenth of the column. A strip down the side of the page with the whole water column to scale, the ship a mark on it, and a few true depths beside it (daylight's end, Fathom's boat's collapse depth, the bed) would do more than any camera.
6. **Pace.** Six minutes of falling in real time is long; at the page's higher paces it is seconds. The director should own it.

## 7. Recommendation

1. **Do A now** (a day): it removes the pool, and nothing in the model moves. Take Fathom's floating origin, depth buffer, darkening water and wire bed for it.
2. **Write the research note (R5 below) while A is built**, so that B and C are tuned to sources and not to memory.
3. **Then choose between B and "W7 then C".** My pick is to skip a polished B: build B's falling body as the engine (it is needed by C anyway), but spend the effort on the break (W7), because one body cannot be checked against the wreck and two can. B alone would be a better toy; C is a result.
4. **Mend the model's last two minutes before C, not before A.** It costs a cascade, and C's starting point depends on it.

## 8. What is not known yet (the research this needs)

- **R5, a note on the fall and the wreck:** the bed's depth at bow and stern; the positions and headings of both parts; the break's place by frame; each reconstruction of the fall with its speeds, angles and times, and what it rests on (Ballard 1987; Garzke and others, SNAME 1997; the 2010 survey and the 2012 "Final Word" analysis; Stettler and Thomas 2013); the stern's failure depth; the bow's burial; the boilers' position; the bed's sediment and its strength; the bottom current.
- The sea that night as a column: surface temperature (about -2 deg C by the survivors' accounts [B]), the profile below it, for Fathom's "ice-edge water" or a new one.
- A weight budget by material, for 4.1.
- Which after spaces were tight (refrigerated holds, tanks, the shaft tunnels) and which were open, for 4.2.

## 9. Rows this would add to BACKLOG.md (not added: nothing starts until Bo picks it)

| # | Item | Size | Test |
|---|---|---|---|
| Z1 | The fall, drawn: to a bed at 3,784 m, the camera, the depth, the dark, the wire bed (rung A) | S | a browser suite: the hull's keel within 1 m of the bed at the end; the depth readout equal to the pose; the watch's fingerprint the same with the part as without |
| R5 | The research note on the fall and the wreck | S | the note, with conflicts listed |
| Z2 | `core/descent.js`: one falling body with air, drag by slices, the water column, the bed (rung B) | M | closed-form terminal speed; no air, no float; energy; fingerprint at "Foundered" unchanged; replay to the bit |
| Z3 | Two bodies after the break (rung C; after W7) | L | bow and stern 600 m apart within a stated band; the bow whole, the stern's spaces failed; the boilers under the break |
| Z4 | The last two minutes of the surface model: the roll to 80 degrees, "Foundered" by trim | M | list within the record's band to the end; a cascade, said so |
| Z5 | The debris field, the wreck as found, the hours after (rung D) | M | the field's extent against 1,700 by 875 m |
