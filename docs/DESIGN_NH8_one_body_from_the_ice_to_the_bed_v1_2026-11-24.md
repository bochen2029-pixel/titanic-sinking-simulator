# NH8: one body from the ice to the bed (design v1)

Z1, 2026-11-24, 01:5x CST (the clock), at the coordinator's word (01:55: "YES to NH8's design v1 (docs) while the window
lasts"). The next horizon gives NH8 to Z1 and B1+B2 (`docs/BRAINSTORM_the_next_horizon_v1_2026-11-23.md`, NH8). Docs
only.

## The answer in one paragraph

Today three models carry her, one after another.
- `core/motion.js` drives the horizontal plane (MMG).
- `core/core.js` drives the vertical plane, as a rigid body for small angles.
- `core/readers/fall.js` takes over at a hand-over: six degrees of freedom to the bed.

NH8 makes the fall's body the one body from the collision on:
- The core keeps the flooding: where the water goes, at the pose it is given.
- The body takes all six degrees of freedom from the core's water and its own hydrodynamics. MMG's forces are its
  horizontal loads while she has way on and floats upright.
- The break is the joint's live event at the onset (B4, gates 1 to 6). There is no hand-over of her motion.

It lands dark, behind `params.oneBody` 0, until an epoch. With it off, the seams gate, the headway reference and the 1912
fingerprint hold to the bit.

## Why

**Her last minutes would emerge** instead of being handed over: the bow's dive, the stern's rise and fall, the break.

**The hand-over's mismatch goes**, and it is not small. The swing probe of 11-24 (Z1 with B1+B2, member C at the onset):
- The fall finds the joint's moment 2.5 % under the core's gauge at t0, with the pocket at 'flag'.
- Where the pocket is placed at the hand-over moves the joint's first peak by 1.5 % of Mu.
- That is more than the 0.2 % on which 7 of the 30 kept members break or sink joined.
- B1+B2's gate 3 on the mend: 23 of 30 part at the surface with 'flag', 13 of 30 with 'centre'.

So today the hand-over's own modelling decides whether she breaks at the surface. One body removes that choice.

## What exists

| | `motion.js` | `core.js` | `fall.js` |
|---|---|---|---|
| Freedoms | surge, sway, yaw | heave, pitch, roll | all six |
| Frame | MMG's, y to starboard (the mapping at its top) | her frame, y to port | her frame, a quaternion |
| Inertia | her mass with Clarke's mx, my, Jz | her mass with added fractions (`addedHeave`, `addedPitch`, `addedRoll`) and radii (`kPitch`, `kRoll`), plus the water aboard | Kirchhoff's added mass summed over 3 m slices (Munk's moment with no coefficient), plus her water and air |
| Damping | MMG's hull forces, fitted (`SHIP.fit`) | linear by critical ratios on the intact hydrostatics (`zeta*`), plus quadratic | cross-flow drag slice by slice |
| Integrator | its own step, about `C.step` | semi-implicit Euler, dt 0.25 s | midpoint, `K.sub` 8 sub-steps |
| Range | at speed, small heel and drift | small angles; clamped at 77 deg of pitch and 80 deg of roll | any attitude, to the bed |
| Held by | the headway reference; the trials (`calibrate_motion`) | the seams gate; the history match | fall_trials; the wreck's places (trial 7) |

**The couplings today.**
- `motion.js` gives the core the sea's head at each opening (`conn.hx`, `seaHeads`) and the turn's roll moment (seam S3,
  `sim.xMph`).
- The core gives back her water: the motion's mass, its centre and its yaw inertia follow the water aboard
  (`syncMass`, through `C.eachWater` since the epoch's C1). It reads her roll only for a readout.
- At the hand-over (the flag, H1; or B2's onset, D98) the fall is placed at the core's pose and rates. From then on it
  carries her alone.

## The invariants

1. **Off, to the bit.** `params.oneBody` 0 is the core and the motion as today: the seams gate (`out/seams_reference.json`),
   the headway reference (`out/headway_reference.json`), the 1912 fingerprint, golden, every pin.
2. **Deterministic.** Fixed-order sums. One engine gives the same bits, and the forecast's copy equals the watch.
3. **Plain data.** The body's state lives in `sim` as plain data (the forecast clones it), and the page reads it through
   `serialize()` and `sim.fall` only.
4. **The oracle.** The JS core stays the oracle until the C++ build matches. NH8 is a physics change, so it lands with or
   after the port's owner, never inside the port.
5. **One state from the collision to the bed.** `sim.fall`'s contract becomes v: 4: her pose readable from the collision
   on, not from a hand-over.

## The design

### 1. The state

`sim.body` is the fall's body, kept from the collision:
- one piece until the onset, two joined from it, two free after the release;
- momenta, place and attitude (P, L, X, q, nu), as `fall.eng.bodies` holds them today.

When `params.oneBody` is 1, her pose comes from it: the core's `zO`, `pitch` and `roll`, and the motion's x, y, psi, u,
v and r are read from the body, not integrated.

### 2. The forces, partitioned once (no load counted twice)

**Her weight and her water:** the core's. The water's mass and its distribution by space are the flooding's output. The
body takes them as the fall's hand-over does today (`waterBySlice`, the pockets through `C.pocketPoints`, C5's
weighed volume), every step, not once.

**Buoyancy:** the body's own slices, at the in-situ density.
- Afloat they must agree with the core's columns, the calibrated reading.
- fall_trials already holds the hand-over's water, read slice by slice, to `C.weighedWater`, and trial 18 the air's two
  readings within 0.1 %. Neither tests buoyancy over a whole night: stage 0 measures that.

**Radiation and added mass:**
- the vertical plane (heave, pitch, roll) takes the slices' Kirchhoff mass, in place of the core's fractions;
- the horizontal plane keeps MMG's mx, my and Jz while she has way on and floats upright, so the manoeuvring the trials
  fitted is unchanged. Kirchhoff's cross terms between the planes are kept;
- the hand-off between MMG's and the slices' horizontal masses follows her heel and immersion, over a stated band [bet].

**Damping:**
- The fall has no free-surface radiation, and at the surface it matters, above all in roll. So the core's linear terms
  (`zeta*` on the intact hydrostatics) carry over, fading as the waterplane closes [bet: by the waterplane's area over
  her intact one].
- The fall's cross-flow drag acts throughout. At small amplitude it is small, so it does not double the core's linear
  term.

**MMG's hull, propeller and rudder forces:** the body's horizontal loads, in her frame, with the same partition and fade.
They are calibrated for small heel and drift: past that band they fade [bet], and the slices' cross-flow drag carries
her.

**The seams:**
- `conn.hx` (the sea's head at each opening, from her motion) stays, computed from the body's velocities.
- `sim.xFz`, `xMth` and `xMph` become the body's own loads and are no longer inputs.

### 3. The flooding stays the core's until the onset

The core's level solve and flows run at the body's pose (`poseFrame` from X and q).
- Its columns are good at the angles the night reaches before the onset: about 7 deg of trim and 4 deg of list on
  member C.
- Past the onset the fall's spaces carry the water (Z6, `K.air` 'spaces' with D108's 'held'), exact at any attitude.

So the water is handed over at the onset, as `stateOf` does today, but her motion is not. Running the spaces from the
collision would be exact but costly: an implicit solve per space per sub-step over 37,000 steps. It is a later
what-if, measured in stage 0 first.

### 4. The break, live

At B2's onset (its check already runs each step: `sim.night.onset`), the one body becomes two, joined at the onset's
station in its sense: B4's joint with gate 5's mended step (`cf233ac`).
- Each piece's state is the body's own at that instant, split by mass. Nothing is re-placed, so there is no swing from a
  mismatch.
- The release, the spaces, the floats (`961b407`) and the bed follow as today.

### 5. The step

- The core steps the flooding at dt 0.25 s at the body's pose.
- The body steps its midpoint sub-steps over the same 0.25 s, on the core's water of that step.
- The coupling is explicit, step by step, as the core's rigid body is coupled to its own flows today. It is
  deterministic.

## Stages and their tests

| Stage | What | Its rows |
|---|---|---|
| 0, a measurement | the **shadow body**: from the collision the body is stepped beside the core on the core's water, fed nothing back; its pose against the core's every step | the pose apart over the 1912 watch (trim, list, draught) while upright and afloat; the loads apart (buoyancy, the water's moments); the cost per step. A Z1 experiment |
| 1, dark | `params.oneBody` 1: the body's pose drives the core and the motion | off, to the bit: seams, headway, fingerprint (MUST). On: the 1912 watch's founder against the kept set's band (CHECK); the encounter's track against the headway reference (CHECK, within a stated distance) |
| 2, no hand-over | the onset splits the body; `sim.fall` v: 4; the page reads her pose throughout (Z2) | the joined fall continuous at the onset to the bit (no re-placement); the joint's first peak against the hand-over's (the swing's mismatch gone); deep_site and onset_site |
| 3, the epoch | the history match reruns with `oneBody` 1; Carpathia, the ensemble and gallery, the guide | as stage D's cascade (D90) |

## Risks

- **The calibration moves.** The founder and the night's trim depend on her vertical dynamics, so the history match must
  rerun. That makes it an epoch, not a join.
- **The cost.** The fall's slices each sub-step over the whole watch may be 5 to 20 times the core's rigid body, in the
  forecast worker and the page alike. Stage 0 measures it before anything else.
- **MMG's range.** Its fit holds for small heel and drift. The fade past that is a bet, and stage 1's CHECK on the track
  says whether it costs the encounter anything (the 1912 collision happens upright and at speed, inside MMG's range).
- **The surface.** The fall was built for the deep. Radiation, waves and the free surface's effect on the slices' added
  mass are carried by the `zeta` terms only [bet].
- **The port.** The C++ build must follow NH8's physics, which means a new oracle and the port's own match.

## The owners (a proposal)

- **Z1:** the body from the collision (stages 0 to 2), the partition of the forces, the step.
- **B1+B2:** the break live, the joint at the onset (gates 1 to 6), and the girder's loads from the body.
- **The mainline:** the core's switch, MMG's partition with Z1, the epoch (stage 3).
- **Z2:** the page reads her pose throughout (contract v: 4). **U0:** the export's record of it.

## Decisions needed

- **Bo:** whether NH8 rides the next epoch (with NH6's stage 2, NH7 and NH15's class C, as D106 put NH7) or one of its
  own. It moves the founder.
- **The coordinator:** stage 0, the shadow body, as Z1's next measurement after join 20. It needs no switch and moves
  nothing.
