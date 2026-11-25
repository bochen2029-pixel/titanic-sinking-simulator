# NH8: one body from the ice to the bed (design v1.1)

Z1, 2026-11-24, 02:0x CST (the clock). This is v1.1 of the design of the same night
(`docs/DESIGN_NH8_one_body_from_the_ice_to_the_bed_v1_2026-11-24.md`, which stays beside it). It takes B1+B2's four
corrections (02:0x), three of them to the break, and the coordinator's word on stage 0 (01:59). Everything in v1 not
named here stands.

## What changes from v1

### 1. The onset judges the body's own moment (B1+B2)

**v1's gap.** In v1, under NH8 the body carries its own slices' buoyancy and Kirchhoff mass, but B2's onset (`onset.js`,
through `girder.js`) still judges (M/Mu)² + (V/Vu)² on the gauge's moment. That moment comes from the core's loads: its
columns' buoyancy at the pose, the water as the core weighs it, and inertia relief from the core's accelerations. So
the trigger and the joint would read two different moments. The 2.5 % found at t0 tonight (the joint's M0 against the
gauge: 0.971 to 0.977 across the kept set) is that very difference.

**v1.1:**
- Under NH8 the onset's check, and the girder's gauge on the page, read the body's own sectional moment and shear: at
  each station, its slices' loads less their mass times their acceleration, summed from her end. `jointDemand` already
  does this at one station.
- The engine gives the slices' loads, not only their six sums: an interface such as `F.sectionLoads(body, xs)` giving
  `{ M, V, N }` at each station. It serves the onset, the gauge and gate 1's station alike.
- With one moment the joint is built at its own Mu, and it yields at once (`hingeLaw`'s thY 0). The seven members' 0.2 %
  edge goes with the gap.
- This is "the girder's loads from the body": B1+B2's with Z1.

### 2. At the split her motion is kept, her loads are not (B1+B2)

**v1 overstated it.** v1's section 4 said "nothing is re-placed". That holds for her motion only. At the onset her water
and air still change representation:
- the core's columns become the spaces' boxes (section 3);
- today the lumped pocket goes to 'flag' or 'centre'.

The pocket's place alone is worth 1.5 % of Mu (the swing probe).

**v1.1:**
- The split runs under `K.air` 'spaces', with D108's 'held' and the floats (`961b407`). Each space's air then stands in
  its own place, and the 'flag' against 'centre' choice goes away: the choice that decides 23 of 30 against 13 of 30
  (17 then sink joined).
- **Stage 2's new row:** the station's internal moment across the split, on the core's water just before it and on the
  spaces' just after, within a stated tolerance.

### 3. Stage 0 adds the moment over boiler room 1 (B1+B2) and the hand-over's error budget (the coordinator)

**The coordinator (01:59):** stage 0 is reported as the hand-over's error budget. It gives how far the shadow body's pose,
rates and air at the onset differ from what the fall is handed today, on member C and across the kept set. That is what
decides 23 of 30 against 13 of 30. It also needs a row holding the watch's fingerprint the same with the shadow and
without it.

**B1+B2:**
- Stage 0 also reports the internal moment over boiler room 1 (x -27 to -10), the body's against the gauge's, over the
  whole watch and not only at t0.
- **How much it matters** (B1+B2 measured it, 02:0x, correcting their first figure). On member C's watch the gauge at the
  onset's station climbs M/Mu:
  - 0.8265 at T 146.46, 0.8429 at 150.46, 0.8618 at 152.46;
  - 0.9010 at 154.46, 0.9468 at 155.46, and 0.9875 at the onset (156.46), where (M/Mu)² + (V/Vu)² = 1.0001 with V/Vu
    0.158.

  That is 4 to 4.5 % of Mu a minute in the last two minutes (0.3 to 0.4 % ten minutes before). So a 2.5 % gap between
  the gauge's loads and the body's moves the onset by about half a minute. The sensitive end is the joint's, surface or
  joined (0.2 % of Mu), not the onset's time. The row says how big the gap is all night.

### 4. Gate 1's station is reported, never tuned (B1+B2)

Today every kept member's onset falls at x -10.93 (gate 3's table: all 30). If the body's moment governs the onset, the
station may move. Stage 2 reports it beside the record's x -16 to -27, as `strength_tests` does, and never tunes it.

### Small corrections

- **B4's gates 1 to 6 are on the joint's line:** gate 1 (`e6d1071`), gate 2 the spaces with the joint (`42e6911`), gate
  5's mend (`cf233ac`). Section 4 leans on gate 2.
- **Why:** "13 of 30 with 'centre'" reads "13 of 30 with 'centre' (17 sink joined)".

## Stage 0, as it will be built

The shadow body, a measurement on `claude/z1-nh8-stage0` (from `961b407`); nothing of it lands before its numbers are read.
- **Where:** a whole body (`begin`'s pieces 1, the default pocket air), beside member C's watch from a start before the
  onset (10 minutes, then the collision once the cost is known).
- **What it is fed:** the core's water every step, as `begin` reads it at a hand-over, its own motion kept (place,
  attitude, velocities; its momenta made again from its new mass). Nothing goes back.
- **What it needs of the engine:**
  - the water renewed without re-placing (a small interface beside `begin`);
  - `begin`'s write of `sim.fall` held off;
  - the slices' loads (`F.sectionLoads`, item 1).
- **Rows:**
  - the watch's fingerprint the same with the shadow and without it (MUST);
  - at the onset: the pose, rates and air apart from what the fall is handed today (the error budget, member C, then the
    kept set);
  - the moment over boiler room 1, the body's against the gauge's, all night;
  - the cost per step.
