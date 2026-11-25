# The break: how she splits by her own loads, and how two parts live on (investigation and design, v1)

Written 2026-11-19 13:50 CST. Bo's order: "investigate how to make the Titanic split in half and break apart instead of going down in one piece. It needs to be at least somewhat math and physics accurate; the code must reflect that dynamic splitting, not canned or scripted; and how to show it in 3D. When it is split into two parts, each part is its own physics."

**Status: investigation and design. Nothing in `core/`, `site/` or `tools/` was changed by this.** Two scratch experiments were added under `docs/research/experiments/` (`e40`, `e41`) with their output. Revisions are new files (`..._v2_...`).
Tags: [M] measured this session, [R] read (file and line), [D] derived, [B] bet.

**Read this first: another session is working in this checkout.** `core/core.js`, `core/readers/people.js`, `site/app.js` and three tools are modified and uncommitted (grand staircases, by a Claude Code desktop session), and it is writing the descent's research and prototypes (`e25` to `e34`). Every number below was therefore measured on a clean worktree of the committed tree, `a97a6bd` (`C:\temp\titanic-wt-stairs`), not on this checkout's working files. Where the working tree gave a different answer it is said.

## 1. The answer in one page

1. **The trigger already exists and is honest.** `core/readers/girder.js` computes the hull's bending moment at every station from her weight curve, the water in her and her buoyancy at that instant, and compares it with what the hull can bear (4.0 to 5.4 GN m from the studies). It breaks nothing today; it is a gauge. Making it break her is: evaluate it in the step, and act when demand reaches capacity. It is pure and cheap enough: 37,665 calls changed no bit of the run and cost about 0.14 ms each [M: `e41`].
2. **On this model she breaks by her own loads, in the record's minutes, with no script.** With the list held (see 4): capacity 4.6 GN m gives the break at T 155.1 min and 8.2 degrees of trim; 5.0 gives T 156.1 and 9.5 degrees; 5.4 gives T 156.8 and 11.2 degrees. The record: T 157 to 158.6, at 11 to 17 degrees. A hull as strong as solid plate (8.5 GN m) never breaks and founders whole [M: `e40`].
3. **Two bodies run on the core as it is.** A prototype cut the ship's own columns in two, gave each part its mass, centre and inertia from the gauge's weight curve, the parent's water and motion, and an open end, and stepped each with the core's unchanged `C.step`. The bow goes under in 40 to 70 seconds. The stern falls back toward level within five seconds, then floods from its open end, rises and goes. That is the witnesses' sequence, and nothing told it to [M: `e40`].
4. **Four things the prototype says must be built, not assumed:**
   - *Where* she breaks needs a capacity that varies along the hull. With one capacity for every station she breaks amidships (x about -0.5 to -6 m), not between the third and fourth funnels (x -22 to -25) [M].
   - *The stern's time* depends on how much of it is torn open. Cut through boiler room 1 with bulkhead K standing, the stern floats for good. Cut through the engine room it takes 7 to 12 minutes on the committed tree; the record is 2 to 3 [M].
   - *The roll fault decides whether she breaks at all.* As the model is, she rolls to 80 degrees to port in her last two minutes, and with capacity 5.4 she founders before the moment gets there [M].
   - *The core's attitude limit is hit by both parts.* Trim is clamped at 77.3 degrees; both fragments reach it [M]. Parts that stand on end need an attitude without that limit.
5. **The picture needs no animation of the break.** If each part is drawn under its own computed pose, the gap opens, the stern falls back and the bow slides away because the physics moved them. What is drawn that is not a number from the model is the torn edge's shape and the debris.

## 2. What is already in the repository

| Piece | Where | What it gives |
|---|---|---|
| The record of the break, the studies, the structure's numbers, a weight curve, what should happen after | `docs/research/RESEARCH_breakup_hull_girder_v1_2026-11-17.md` (334 lines; section 9 is "for the model") | break station x -23 (range -16 to -27); capacity 4.6 central, 4.0 to 5.4; trim 11 to 17 degrees; the stern settles, rises, hangs, goes in about three minutes; two readings of the hinge |
| The gauge | `core/readers/girder.js` | `weight(sim)`: her weight per metre in layers, closed to the model's mass and centre exactly; `moment(sim)`: moment and shear at every slice edge, hogging positive, relieved by her inertia; `capacity(x)` |
| The gauge's finding on 1912 | `out/gate/girder.txt` ("THE FINDING") | 0.88 GN m at rest, 3.2 at T 100, 4.6 at T 154.4, peak 5.385 at T 156.0 and 22 degrees of trim [R] |
| A scripted stand-in for the break | `core/systems.js:70`, `:189` | `breakTrimDeg: 20`: past 20 degrees "her boilers and steam mains give way". That is a canned trigger; the real break's event should replace it |
| The calibration's target | `core/scenarios.js:116` | `OBS.founder: 160, breakup: 157`: the record's break time is already there, unused |

## 3. What was measured

All on `a97a6bd`. `e40`: `node docs/research/experiments/e40_break_two_bodies_prototype.js <capacity GN m> <held|free> <cut x> [openK]`; output in `docs/research/experiments/results_2026-11-19/e40_break_two_bodies_prototype.txt`.

### 3.1 When and where the model's own moment reaches capacity

| Capacity (GN m) | List | Break at T (min) | Clock | Trim (deg) | List then (deg) | Largest moment along the hull |
|---|---|---|---|---|---|---|
| 4.0 | held | 151.75 | 2:11:45 | 6.6 | -2 | 4.22 at x -0.5 |
| 4.6 | held | 155.09 | 2:15:05 | 8.2 | -2 | 4.87 at x -0.5 |
| 5.0 | held | 156.07 | 2:16:04 | 9.5 | -2 | 5.31 at x -0.5 |
| 5.4 | held | 156.75 | 2:16:45 | 11.2 | -2 | 5.73 at x -0.5 |
| 8.5 | held | never: founders whole at T 158.87; peak 6.2 at 21.9 deg | | | | |
| 4.6 | free | 154.39 | 2:14:23 | 8.6 | -34.7 | 4.77 at x -3.1 |
| 5.0 | free | 155.25 | 2:15:15 | 11.2 | -48.9 | 5.16 at x -5.7 |
| 5.2 | free | 155.63 | 2:15:38 | 14.4 | -66.8 | 5.35 at x -5.7 |
| 5.4 | free | never: founders whole at T 156.94; peak 5.385 at 21.9 deg | | | | |

"Capacity" here is tested at the gauge's governing station in its band (bulkhead J, x -16.15). "Held" freezes the roll from the start, as a what-if; "free" is the model as it is.

Read with the record (T 157 to 158.6; 11 to 17 degrees): the model breaks one to two minutes early and at a slightly lower trim for the same capacity. That is the surface model's last minutes running fast (its trim reaches 10 degrees at T 155 and 22 at T 156), not the break's rule.

**Where.** The moment along the hull at the break (capacity 5.0, held) [M]:

| x (m) | -87 | -54 | -38 | -22 | -6 | +11 | +28 | +46 |
|---|---|---|---|---|---|---|---|---|
| M (GN m) | 1.03 | 2.93 | 3.90 | 4.78 | 5.26 | 5.15 | 4.26 | 2.98 |

The peak is amidships. At x -22 the moment is 9 % under the peak, so the gauge's optional 10 % knock-down at the aft expansion joint puts the break there in the free runs (ratio 1.04 to 1.05 at x -24.4) and leaves it amidships in the held ones (1.06 at x -0.5). It is a coin's edge. The place of the break is decided by how the hull's strength varies along her length, and that curve does not exist yet (section 4.2).

### 3.2 Two bodies after the break (capacity 5.0, list held)

| Cut | Bow wholly under | Stern in the first seconds | Stern afterwards |
|---|---|---|---|
| x -21.6, boiler room 1; bulkhead K stands | 47 s | trim falls from 9.5 to -1.4 deg in 8 s | **floats for good**, level, 1,100 t of water in the open stub of boiler room 1 |
| the same, K's doors open and its top cut down | 47 s | the same | still afloat at 20 min, trim 12.9 deg and rising |
| x -29.8, through the engine room | 56 s | trim falls to 3.6 deg in 5 s | rises to the 77 deg limit at 619 s; wholly under at 719 s (T 168.1) |
| the same, list free (capacity 5.0) | 48 s | 3.5 deg in 5 s | under at 427 s (T 162.4) |

On this checkout's working tree (the other session's staircases in the core) the engine-room cut put the stern under in 111 s (T 157.9), inside the record's two to three minutes. I do not rest anything on that number, since that code is not committed; it shows the direction: more ways for the sea into the stern, a shorter stern.

What the prototype leaves out: a hinge (the parts separate at once), any touch between the parts, sideways motion, air, and a cut anywhere but a slice edge. Its damping for a part is formed as the core forms the whole ship's [B].

## 4. The design

### 4.1 Demand: what the hull is asked to carry
The gauge's `moment(sim)`, every step from the first water aboard: at each of the roughly 100 slice edges the moment and the shear of every load aft of it (weight by layer at its height, flood water at its centroid, buoyancy at its centre), about the section's neutral axis, relieved by her rigid-body acceleration so that both ends close. Nothing new is needed here, only its place in the step.

### 4.2 Capacity: what the hull can carry, along her whole length
This is the piece to build, and it is where "not canned" is won or lost. A number typed in for one station is a script with a formula in front of it.

- **The section as elements.** At a station the hull's cross-section is a set of longitudinal elements: keel and bottom shell, tank top, side strakes, the decks up to B, the doubled sheer strake. Each has an area, a height, and a load-shortening curve: in tension it carries up to its riveted joint's efficiency times yield (the research note has 153 MPa for the best side seam and 49 MPa for a single-riveted deck joint); in compression up to its buckling stress between floors 0.914 m apart (the note derives about 155 MPa for the 1 in bottom shell and 55 to 90 MPa for the tank top), then sheds load.
- **Smith's method.** Impose a curvature, find the neutral axis where the section's net force is zero, sum the moments: the result is a moment against curvature curve with a peak (the ultimate moment) and a falling branch after it. It is the standard progressive-collapse method for a hull girder, it is a few dozen elements and a one-dimensional root-find, and it needs no finite elements.
- **Along the hull.** Run it at every slice edge with that station's elements: the breadth and depth there, the deck openings (the engine casing and hatch open the decks over the engine rooms; the boiler casings do the same forward), the double bottom's change of depth at frame 25A (x -22.4), the superstructure cut by the aft expansion joint at frame 28A (x -25.1). The result is `Mu(x)` in hogging and in sagging, and `Vu(x)` in shear.
- **Checks that keep it honest.** Its elastic modulus amidships must give the panel's 30.5 m3 at B deck and 36.5 m3 at the keel and the neutral axis at 10.1 m [R: the note, section 3]. Its ultimate moment amidships must land in 4.0 to 5.4 GN m without being tuned to. If it does not, the element data are wrong, and that is found before anything breaks.
- **What it settles that a typed number cannot:** where she breaks; whether the deck or the bottom goes first (the note's unresolved "top-down or bottom-up"), which decides where the hinge is; and that a different ship or a different flooding breaks somewhere else or not at all.

### 4.3 Failure as a process, not an instant
1. **Onset.** At the first step where `M(x) / Mu(x)` (with shear: `(M/Mu)^2 + (V/Vu)^2`) reaches 1 at some station x*, a hinge forms there. The station, the time and the sense (hogging or sagging) are whatever the loads made them.
2. **The hinge.** From then on the ship is two rigid bodies joined at x*. The joint carries the moment the section still can: the falling branch of Smith's curve against the angle between the bodies, so the resistance dies as the parts rotate. The hinge's height is the side that failed last: the keel if the decks tore first, B deck if the bottom buckled first.
3. **The tear.** A state `c` from 0 to 1 is the share of the section gone. It grows as the hinge angle grows along the curve; the work done, the integral of moment over angle, is the energy the steel took, and its rate is what the sound part is given (the record: a crash, sharp reports, a roar of 15 to 20 seconds).
4. **Release.** When the remaining ligament's strength in tension and shear is less than the force the joint is carrying, the parts are free. No timer, no fixed angle.
5. **Again.** Each part keeps its own gauge. The stern standing on end, or the bow striking the bed, can break again by the same rule (the wreck's bow is bent in two places).

### 4.4 Two bodies
- **A part is a sim.** `split(sim, x*)` returns two sims, each on its own share of the parent's columns, still in the parent's ship coordinates, so that the hull's form, the decks and the picture's shaders need no change. The prototype shows the core's flooding, levels and loads run on such a part unchanged.
- **What each part inherits, exactly:** its mass, centre and inertia from the weight curve over its own length (the two sum to the parent to the last digit, because the curve closes to the parent); the water in its spaces; the parent's position, attitude and rates at that step, so that momentum is carried across the split. A test holds each of these to 1e-9.
- **The cut zone** is split between the parts by column, its water with it. If the cut falls inside a slice the columns are divided, not snapped to an edge as the prototype did.
- **The open ends.** Each face of the cut is open to the sea over its whole section, by height (the prototype used a 1 m strip of orifice every metre: 641 m2 in all). While the hinge holds and the faces are close, the two faces exchange with each other and the sea through the gap that the hinge angle has opened.
- **How much is torn** is not one plane. The wreck is missing about 18 m of her middle, with bulkhead K and the engine bedplates in the pieces [R: the note, 1.3]. The stations that passed their ultimate moment before release are the torn zone; their columns go to neither part and become debris. This is what the stern's lifetime turned out to depend on (3.2), so it must come from the failure process, with the 18 m as the record to be judged against, not as an input.
- **The joint between the bodies** is solved exactly each step (two bodies, one pin, a closed-form impulse), not by a spring: at dt 0.25 s a spring stiff enough to hold 30,000 t would not be stable.
- **Degrees of freedom.** The core gives a body heave, pitch and roll. Parts also need to move along and across (the bow leaves) and to pass 77 degrees (both parts did, 3.1 and 3.2), which the core's pitch and roll angles and their clamps cannot carry. A part's attitude should be a rotation matrix or quaternion from the split on. This is the same body the descent needs (`e33` of the other session is one in the vertical plane), so the break should hand its parts to that module's state, not invent a second one.
- **Air.** Left out at the surface as today. The stern's trapped air belongs to the descent.

### 4.5 What stays as it is
`sim.foundered` and `founderT` keep their meaning for a ship that never breaks. For one that does, the parent sim ends at the split with an event; each part has its own "wholly under". The readers (boats, reports, the wireless) read the parent before and the stern after, which is where the people were.

## 5. The code, under the repository's rules

- **Where.** The capacity (section elements, Smith's method) is a library beside the gauge (`core/readers/girder.js` already holds `capacity(x)`). The test in the step, the hinge and the split are core physics: a new `core/break.js` driven from the core's step through one seam, off when a sim says so.
- **Neutral when off.** With the break off (or the capacity at the plate's 8.5 GN m) every bit is as before: `tools/seams.js` and the 1912 fingerprint hold. The seams gate opts out, as it does for the pumps.
- **It is a physics change when on.** The 1912 night ends differently, so the cascade of `CLAUDE.md` runs once: the calibration's score (it can now use `OBS.breakup: 157`), the fingerprint, the wreck's position, the boats' fit, the reports' constant, the Carpathia acceptance and search. In that search the capacity belongs among the robustness guesses, with its range 4.0 to 5.4.
- **Determinism and plain data.** The parts are plain sims in `sim.parts`; the hinge's state is numbers. A night is still its seed and its orders, and replays to the bit. The forecast worker's copy carries the parts.
- **`core/systems.js`.** The break event cuts the steam mains and the dynamos' leads where they cross x*; `breakTrimDeg` goes. The lights then go out because the ship parted, at the step she parted.
- **Tests that set causes:**
  1. A hull given a capacity above anything the loads reach founders whole, to the bit of today's run.
  2. The four-compartment preset never breaks (she floats).
  3. Raising the capacity never makes the break earlier.
  4. Across the split: mass, water, momentum and total buoyancy are the parent's.
  5. A cut hull with no hole floats as two hulls at the draughts hydrostatics gives.
  6. The 1912 night: break station in x -16 to -27, trim 10 to 17 degrees, T 157 to 158.6, the stern under 1 to 5 minutes later. These are the record's bands; a row that fails means the model is wrong, and the bands do not move.
  7. A replay reaches the same parts in the same places to the bit.

## 6. Showing it

- **Each part is a group under its own pose.** The hull's mesh is drawn twice, once per part. Its shaders already carry the ship-frame position of every fragment, so each part discards what lies beyond the tear: `x < x* + tear(y, z)` for the bow and the reverse for the stern. `tear` is one seeded jagged function used by both, so the two edges mate exactly while joined [appearance: the edge's shape; its place is the model's].
- **The break is not animated.** The gap, the stern falling back, the bow sliding off and the hinge opening are the two computed poses. If the physics is wrong the picture is wrong, which is the point.
- **The cut face.** A cap at each end showing the decks and the double bottom in section, built from the same deck heights the core uses. In the X-ray look the flood water of each part is drawn by that part's levels, so the stern's engine room is seen filling.
- **The upper works.** Every deckhouse, funnel and mast belongs to the part its x lies in. What straddles the torn zone (the third funnel's casing, the aft "tower") goes with the debris. The funnels' falling is its own small physics or stays out; it should not be faked beside a computed break.
- **Debris.** The torn zone's columns, the double-bottom pieces and boiler room 1's five boilers are bodies for the descent module if they are to be believed, particles if not, and marked which.
- **Lights and sound.** The lights go at the event (5). The sound's level is the tear's energy rate (4.3); its timbre is appearance, as that part's rule already says.
- **The page.** `site/app.js` reads one `S.sim` in about 2,700 lines. It needs a list of bodies to draw (`sim.parts || [sim]`), two sets of level uniforms and water surfaces, and readouts that name the part (trim of the bow, trim of the stern). The director gets cuts for the onset and the release from the model's events.

## 7. Order of work

| Stage | What | Size | Done when |
|---|---|---|---|
| B0 | The roll to 80 degrees in the model's last minutes found and mended (it decides whether she breaks: 3.1) | M, a cascade | list within the record's band to the end |
| B1 | The section's elements from the plans and the note; Smith's method; `Mu(x)`, `Vu(x)` | M | the panel's moduli and neutral axis reproduced; ultimate moment amidships inside 4.0 to 5.4 untuned |
| B2 | The test in the step; onset as an event only (no split yet): the gauge that says "she would break here, now" | S | tests 1 to 3; the 1912 station and time printed against the record |
| B3 | `split`: two sims, exact inheritance, open ends, instant release (the prototype made exact) | M | tests 4, 5, 7 |
| B4 | The hinge and the tear: falling branch, release by strength, the torn zone | M | test 6's stern time without a typed opening |
| B5 | Parts with free attitude and sideways motion, shared with the descent's body | M | both parts past 77 degrees with no clamp; handed to the fall |
| B6 | The picture: parts, tear, caps, lights, sound, readouts, the director | M | a browser suite; the fingerprint the same with the part as without |
| B7 | The cascade and the papers | M, mostly machine time | `GATE: PASS`; the Guide rebuilt |

B1 and B2 can start now and move no number. B0 is first in importance and is the one that costs a cascade by itself. B3 onward should wait for the other session's core changes to be committed or dropped, because both edit `core/core.js`.

## 8. What is not known

- The scantlings by station: deck and shell thicknesses, the openings' widths, the double bottom aft of frame 25A. The note has the midship section's totals and a few thicknesses; `Mu(x)` needs the rest (the plans; Mengot's drawings; Paik et al. 2025, which the earlier session could not open).
- Whether the deck or the bottom failed first. The design computes it; the literature is split.
- Why the model rolls to 80 degrees (B0). Not looked into here.
- Whether the parts touch after release. The prototype did not check.
- The damping of a part alone, and added mass for a short, open-ended hull.
- How fast the tear runs. The record gives 15 to 20 seconds of noise; nothing gives a law.
