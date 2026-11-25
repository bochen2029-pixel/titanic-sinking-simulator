# BRAINSTORM: the ship under way (engine orders, rudder, motion, and what motion does to the flooding), v1

- **Written:** 2026-11-16, 13:35 to 13:54 CST, session ab71e668 (Claude Code desktop, Fable 5.2), at Bo's ask: "build upon
  the titanic existing repo base and first add the ability to steer/sail, control the titanic, so the speed settings of the
  ship, and along with rudder position should be a minimum ... right now the titanic is static, it should be able to move
  about the water, and turn ... and this should have a realistic dynamic/impact/effect on its sinking or water entering rate
  IF the hull was breached in any way ... brainstorm"; and "use abacus as a tool for sessions for hard physics/math".
- **Status:** advice only; nothing here is a decision. No file of the simulator was changed: `core/`, `web/`, `site/`,
  `tools/`, `out/` and `dist/` are as they were. What was added is listed in section 12.
- **Supersedes:** nothing; this is the first version.
- **Lineage:** `README.md` ("Omissions: ... no forward speed, which matters for Britannic"), `HANDOFF.md` section 4f
  ("Forward speed"), `PORTING.md`, `CLAUDE.md` of this repository; three research notes and five experiments made today
  (section 12).
- **Tags:** [measured] = run on this laptop today; [read] = read in a named source today; [derived] = worked here from
  measured or read inputs; [bet] = my judgement or a number from memory, to be tested. A receipt `abacus1:...` certifies
  the arithmetic of a number, never its inputs.

## 0. The answer in one paragraph

Add the horizontal plane as a second, separate model beside the flooding core, and join the two through four narrow
seams. The core today has no position, no heading and no speed: `XO` and `YO` are constants and the pose is heave, pitch
and roll only. Because the sea is a flat plane, yaw and horizontal travel don't change any hydrostatic number, so a
surge, sway and yaw model (engine orders, three shafts, one rudder, hull forces) can live in a new `core/motion.js` and
leave the calibrated flooding physics alone. The coupling is four things: the outside water head at each hull opening
(pressure from speed, the ship's own wave), a factor on an opening's discharge coefficient (the water outside is moving
past the hole), the loads motion puts on heave, pitch and roll (heel in a turn above all), and, later, the tilt of
flood water under acceleration; going the other way, the pose and the flood water change the hull, propeller and rudder
forces and the steam available. I tested the seam idea today on a patched copy of the core: with the seams neutral it
is bit-identical to the original at every one of 107,561 steps over three scenarios, so the 1912 calibration and the
validation table can't move. On the physics: a first prototype with textbook formulas turns and stops the ship at the
right order of magnitude with no tuning. Two polynomial coefficient sets disagree by a factor of 2.5 on this hull's
turning circle and bracket the trial value; the one published model written the way this ship needs it (no division
by speed, cross-flow drag by strips) lands 16 % wide of the trial circle untuned. So the plan is that form plus a
small fit to the 1911-12 trial record, which a research pass today pinned to primary testimony. On the flooding: measured on the patched core, the 1912
sinking barely cares about speed (a crash stop, a coast-down, or 20 minutes of slow ahead move the foundering time by
0.1 to 2 minutes), while holding 22.5 knots moves it by anything from 69 minutes sooner to 40 minutes later depending
on one number, the pressure coefficient at the breach, and a Britannic-style case with open ports near the waterline
loses 5 to 10 minutes of 51 to half an hour of steaming and turning. So the controls are the feature, the pressure
field at the openings is the hard physics, and Abacus is the tool that keeps every unit, closed form and steady state
honest: 75 certified answers are on file from today.

## 1. What was asked, and what "done" means

1. **Controls, as a minimum:** speed settings (the engine-order telegraph) and rudder position.
2. **The ship moves:** she gathers way, coasts, stops, backs, and turns, on a sea that until now she only floated in.
3. **Motion matters to the sinking:** if the hull is breached, speed and turning change the rate at which water comes in,
   realistically.
4. **Abacus** is the sessions' tool for the hard physics and math.

"Done" for a first release, in my reading: a Bridge panel in the viewer (telegraph, wheel, speed, heading, shaft
revolutions, rudder angle, a track), a headless motion model that passes acceptance tests taken from the ship's own
trials, the 1912 run unchanged when the ship is at rest, and a first, bounded model of the outside pressure at the
openings. Section 9 has the build order.

## 2. Where the repository stands (read today)

- **The state has no horizontal plane.** `createSim` sets `sim.XO` and `sim.YO` once; `poseFrame` builds
  `R = Ry(pitch) * Rx(roll)`; the rigid body integrates `zO`, `pitch`, `roll` and their rates. There is no yaw, no
  position, no speed. [read: `core/core.js`]
- **The sea is a plane at rest.** A sea-side connection takes the outside level as the literal `0`
  (`const ha = a < 0 ? 0 : hEff[a]`), and the flow is `Cd * A * sqrt(2 g dh)`. [read]
- **The gap is already on the list.** README: "no forward speed, which matters for Britannic". HANDOFF 4f: "Add a ram
  head ½ρv² to openings that face forward and a factor on side openings. The model already gives 50 min against the
  real 55 without speed, so adding it will overshoot". [read]
- **Rules that bind this work** [read: `CLAUDE.md`, `PORTING.md`]: the JavaScript core is the oracle; a port and a
  physics change never share a change; `dt = 0.25 s`; fixed-order sums; the viewer reads snapshots only, and the
  snapshot is also the tree-search state.
- **This laptop reproduces the oracle for 72 minutes, then drifts in the last bit.** [measured, `e0_golden.js`,
  Node v26.13.0] The 1912 run founders at 9,440.5 s (157.34 min), the same as `out/golden_titanic.json`; 72 of the
  158 minute samples are bit-identical, the first difference is at t = 4,320 s, and the largest differences are 0.043
  (metres or radians) in pose and 8.4 m³ in a space. That fits the `Math.pow` caveat the README describes: the step's
  only `Math.pow` is the submerged-weir factor, first called at 8.4 minutes and about 23,000 times by minute 70
  [measured with a counting wrapper]. Any bit-for-bit test here must compare against a run made here, not against the
  frozen file.
- **Numbers the motion model inherits from the core** [measured]: mass 49,020.7 t; KG 10.799 m; KB 5.296 m;
  BM 6.302 m; GM 0.80 m; centre of gravity 3.20 m abaft amidships; waterplane 5,627 m²; initial pose 0.2° by the
  stern and 2.0° to port.
- **The folder is a download, not a clone:** there is no `.git`. See decision D9.

## 3. The shape of the solution

### 3.1 Two planes, one ship

| | Vertical plane (exists) | Horizontal plane (new) |
|---|---|---|
| Motions | heave, pitch, roll | surge, sway, yaw |
| Physics | hydrostatics over 4,408 columns, 64 flooded spaces, 290 flow paths | hull, propeller and rudder forces; shaft and steering-gear dynamics |
| State | `zO`, `pitch`, `roll`, 3 rates, `vol[64]` | `u`, `v`, `r`; `X`, `Y`, `psi`; 3 shaft speeds; rudder angle; orders |
| Time constants | minutes (flooding), 26 s (the roll period from the core's own parameters) | 10 to 400 s |
| Calibrated to | the eyewitness trim curve, the foundering time | the 1911-12 trials (section 4.7) |

Yaw and horizontal travel leave every hydrostatic quantity unchanged, because the sea surface is a horizontal plane:
the buoyancy and level integrals use only the third row of the rotation matrix and the heave. So the existing code
keeps computing in a level frame that travels and turns with the ship, and never needs to know where she is. The
velocities `u`, `v`, `r` are defined in that same level frame (the usual "horizontal body axes" of four-degree-of-freedom
manoeuvring models), which keeps them meaningful at 10° of trim.

### 3.2 The seams (the whole coupling)

From motion into the flooding core:

| Seam | What it carries | Neutral value | Section |
|---|---|---|---|
| S1 `hx[c]` | the outside piezometric level at sea-side connection `c`, metres above the calm sea: speed pressure, the ship's own wave | 0 | 5.1-5.2 |
| S2 `cm[c]` | a multiplier on the discharge coefficient of that opening: the loss from water moving past the hole | 1 | 5.3 |
| S3 `xFz`, `xMth`, `xMph` | loads from motion on heave, pitch and roll: heel in a turn, rudder heel, sinkage and trim under way | 0 | 4.6, 5.5 |
| S4 apparent gravity | the tilt of the flood water's free surfaces under the ship's horizontal acceleration | (0, 0, 1) | 5.6 |

From the flooding core into motion:

| Feed | What it carries |
|---|---|
| R1 pose | draft, trim and heel at every station, so the hull, rudder and propeller forces follow the sinking ship (section 4.6) |
| R2 flood state | total mass and its centre (31,500 t of water forward moves the centre of gravity tens of metres), and which boiler and engine rooms still work (section 4.3) |
| R3 inflow | the momentum the ship gives to the water she takes in, `rho * Q * u` (section 5.6) |

### 3.3 The invariant: at rest, nothing changes, to the last bit

A seam is neutral when the ship is at rest, and a neutral seam must leave the arithmetic identical: `x + 0` and
`x * 1` are exact in IEEE arithmetic, so this is achievable, and it is testable.

**Tested today** [measured, `docs/research/experiments/e1_invariance.js`]. `xcore.js` writes a patched copy of
`core/core.js` (into a scratch folder, never into the repository) with seams S1, S2 and S3 added by nine one-line
replacements, each required to match exactly once. With the seams neutral, the patched core was compared with the
original after every step, all 64 volumes, the pose, the rates and the inflow, with `Object.is`:

| Scenario | Steps compared | Result |
|---|---|---|
| Titanic 1912 (to foundering, 157.34 min) | 37,762 | all bit-identical |
| Britannic preset (to foundering, 50.83 min) | 12,199 | all bit-identical |
| Olympic-Hawke (4 h, afloat) | 57,600 | all bit-identical |

So the seam change is not a physics change in the sense of the repository's rules: the four fitted parameters, the
validation table and the golden trace stay valid, and the C++ build can take the same nine lines and remain bit for
bit. This test should become a permanent gate (`tools/seams.js`), run before any commit that touches the core.

### 3.4 Where the code goes

- **`core/core.js`:** the seams only. Nine lines today; S4 adds a second frame for the internal level solve
  (section 5.6), also neutral at rest.
- **`core/motion.js` (new):** headless, deterministic, flat typed arrays, no DOM, the same module pattern as the core.
  `Motion.step(sim)` does three things: (1) from the motion state and the pose at time t it computes the forces and
  fills the seams; (2) it calls `C.step(sim)`; (3) it integrates `u`, `v`, `r`, the position, the shafts and the
  rudder. The two planes exchange values one step (0.25 s) apart. Both use the core's own update order, velocities
  first and then positions from the new velocities (semi-implicit Euler). Roll stays inside the core's update: an
  explicit step would add about a fifth to a roll's amplitude every period [read: M10].
- **`core/shipdata.js` (new):** the machinery and steering numbers of section 4, each with its source and its Abacus
  receipt in a comment, converted once at the edge as the repository's convention asks.
- **`core/scenarios.js`:** a scenario gains an optional `orders` timeline (`{t, telegraph, helm}`), so the historical
  orders of 14 April are data, and the forecast worker can run "the orders as they stand".
- **Tools that call `C.step` directly** (`validate.js`, `calibrate.js`, `golden.js`) keep working unchanged and keep
  their numbers. New tools call `Motion.step`: `tools/trials.js` (the acceptance table of section 4.7),
  `tools/calibrate_motion.js`, `tools/golden_motion.js`.
- **Snapshots:** `Motion.serialize` wraps `C.serialize` and adds about 14 doubles. The viewer, the forecast worker and
  the tree search keep one boundary.

### 3.5 Frames and signs (the trap to avoid)

The core's frame is x forward, y to PORT, z up, right-handed; roll is positive starboard down, pitch positive bow
down. A yaw in that frame is positive to PORT, so the compass heading is `-psi`. The manoeuvring literature (MMG,
Kijima, Clarke, Fossen) uses x forward, y to STARBOARD, z down, with yaw rate and rudder angle positive to starboard
[read: research note M1]. Both frames are right-handed with x forward, so the mapping is a change of sign on `y`, `v`,
`r`, `psi` and `delta`; the hull polynomials are odd in `(v, r)` and carry over unchanged; anything asymmetric
(propeller side force, the port and starboard values of the flow-straightening coefficient) does not, and must be
mapped by hand. Keep the core's frame inside the code, and put the literature's formulas through one documented
mapping in `motion.js`.

One more sign: in 1912 helm orders were tiller orders. "Hard-a-starboard" put the tiller to starboard, the rudder to
port, and the ship's head to port. The Bridge panel should offer both ways of speaking and store the rudder angle.

### 3.6 Determinism

The new module follows the core's rules and adds three of its own: no `Math.pow` (the source of last-bit drift the
README measured; write `x * Math.sqrt(x)` for a power of 1.5, `Math.exp(p * Math.log(x))` for an odd one), no
`Math.hypot` (write `Math.sqrt(u*u + v*v)`: `sqrt` is correctly rounded everywhere), and no division by the speed
(section 4.2), so that rest and sternway need no special cases. Angles the
formulas seem to need can usually be avoided: the rudder's inflow angle enters as
`U_R^2 sin(alpha_R) = U_R (u_R sin(delta) - v_R cos(delta))`, which needs no `atan2`.

## 4. The horizontal-plane model

### 4.1 Equations

Surge, sway and yaw about the midship point, total mass `m` (ship plus flood water) with its centre at `x_G`, added
masses `m_x`, `m_y`, `J_z` [read: MMG standard method, Yasukawa and Yoshimura 2015, Eq. 4, in research note M1]:

    (m + m_x) u' - (m + m_y) v r - x_G m r^2 = X
    (m + m_y) v' + (m + m_x) u r + x_G m r' = Y
    (I_zG + x_G^2 m + J_z) r' + x_G m (v' + u r) = N
    X = X_hull + X_propellers + X_rudder - rho Q u,   Y = Y_hull + Y_rudder,   N = N_hull + N_rudder

The last term of `X` is the momentum of the ingested water (section 5.6). The roll moment that goes through seam S3 is
the sum of each lateral force times its height below the centre of gravity (section 4.6).

### 4.2 Hull forces: a sectional model anchored to the trials, not a regression

The standard form writes the hull forces as polynomials in `v/U` and `r L/U` with coefficients from regressions on the
ship's proportions. Three reasons not to stop there:

1. **This hull is outside every fitted family.** Kijima's 1990 set was fitted on 13 merchant ships with L/B from 4.5
   to 6.9; this ship's is 9.19. Applied to an 85 m trawler the same set over-predicted advance, transfer and tactical
   diameter by 43, 55 and 50 %. [read: research note M2]
2. **Measured today, the polynomial sets disagree by a factor of 2.5 here.** [measured, `e2_mmg.js` run 2] With the
   same rudder and propellers, a cubic set (Yoshimura and Masumoto's, its constants from memory) gives a tactical
   diameter of 2,561 ft and Kijima's 1990 set 6,377 ft; the trial value is about 3,850 ft. The linear terms are solid
   (three reproductions of Kijima's agree, and Clarke's independent regression is within 5 to 7 % on the three that set
   course stability [read: M2, M10]); the nonlinear damping is not.
3. **The form breaks where this ship lives.** `v/U` and `r L/U` are 0/0 at rest. The published trim corrections are
   linear in trim over draft and come from tests with trim by the stern; 2° by the head is already 0.9 of the draft,
   the factors change sign near 1.25 to 1.5, and this ship ends 10° down by the head with her rudder in the air. "No
   published regression covers this; the corrections must be clamped or replaced." [read: M5]

**Recommendation.** Use the published form that was written for exactly this, Yoshimura, Nakao and Ishibashi's
"unified" model for ocean and harbour manoeuvring (2009) [read: M10, quoted from the paper's text], and take its strip
integral over the same 97 stations the column builder already has, with the local draft at the current pose:

    Y_H = 1/2 rho L d [ Y'_v v |u| + (Y'_r - m'_x) L r u ]  -  1/2 rho C_D  Int d(x) |v + C_rY r x| (v + C_rY r x) dx
    N_H = 1/2 rho L^2 d [ N'_v v u + N'_r L r |u| ]         -  1/2 rho C_D  Int d(x) |v + C_rN r x| (v + C_rN r x) x dx

The linear coefficients are Kijima's (`Y'_v = -(pi k / 2 + 1.4 Cb B/L)`, `Y'_r - m'_x = 0.5 Cb B/L`, `N'_v = -k`,
`N'_r = -0.54 k + k^2`, `k = 2d/L`), slender-body terms that stretch sensibly to this ship's proportions. The paper's
own regressions give `C_D = 0.29`, `C_rY = 3.72` and `C_rN = 1.66` for her at the night's draft, all extrapolated
beyond its ships (L/B 4.8 to 6.9). In the paper the draft is one number; putting the local draft `d(x)` inside the integral, and scaling
the linear terms with the local drafts as slender-body theory says they scale (the stern's draft carries the lift,
which is where the published trim corrections come from), is this note's extension and a [bet]; the research note
proposes the same on its own (M5). `d(x)` costs one extra accumulation in the buoyancy pass the core already makes.

This form has no division by speed, works at rest and astern, follows any trim, sinkage and heel, uses arithmetic the
core's rules like, and leaves three numbers (`C_D`, `C_rY`, `C_rN`) for the trial record to settle. Untuned, with the
extrapolated coefficients, it gives a tactical diameter of 4,483 ft against the trial's 3,800 to 3,900 [measured,
run 2]. It is the same move the repository made for buoyancy: integrate over the columns at the actual attitude, no
lookup tables.

Dimensions of every formula in this section were checked: receipts `abacus1:3df3617ceec0` (sway force),
`abacus1:022156e6ffaf` (yaw moment), `abacus1:e2caea7544b6` (the strip).

### 4.3 Propulsion: three shafts, one telegraph, and steam that drowns

What the record gives [read: fact sheet sections 2 to 4; every figure there has its source and a quotation]:

| Item | Value | Source in the fact sheet |
|---|---|---|
| Wing screws | 23 ft 6 in (7.163 m), 3 blades, pitch 35 ft (P/D 1.49), 160 sq ft, outward-turning, on the reciprocating engines | Harland and Wolff notebook via Chirnside |
| Centre screw (Titanic) | 17 ft (5.182 m), 3 blades, pitch 14 ft 6 in, 120 sq ft, on the turbine; Olympic 1911 had 16 ft 6 in and 4 blades | same |
| Power | 15,000 ihp each (11,185 kW, `abacus1:047c3859df01`) at 75 rpm; turbine about 16,000 shp at 165 rpm (the turbine's builder told the Board of Trade 17,000 at 170); 59,000 hp at 83 rpm | Halpern, "Titanic's Prime Mover"; the Pigott notebook via Chirnside |
| The turbine | no throttle of its own; in only at Half or Full ahead; reversing the engines cuts it out; it cannot go astern; it turns at about 2.22 times the engines' speed | Fleming (Hawke inquiry); Wilding 1915 |
| Speed and revolutions | 60 rpm about 18 kn, 74 rpm about 21.5 kn (Wilding); 75 rpm 22.06 kn averaged on the voyage; 79 rpm 22.82 kn | British Inquiry 25292, 25295; Halpern, "Speed and Revolutions" |
| Orders, open water | Full about 75 rpm; Half 50 rpm, about 15 kn; Slow 30 rpm, 8 to 9 kn | Captain Smith, Hawke inquiry |
| Orders, closed water | Full 65, Half 55, Slow 35, Dead Slow 20 to 25 rpm | engineer McKimm |
| Reversing | 10 to 20 s from the order until the engines stop and start to reverse, 30 to 50 s more until backing hard | a US Navy estimate of 1912, not a measurement |
| Resistance | 165 tons at 21 knots (1.644 MN, `abacus1:3446a659ab80`), for about 53,000 tons | Prof. Biles's estimate, Hawke inquiry |

The model: each shaft has a speed that follows its order through a rate limit, a dead time for reversing the valve
gear, and a torque balance; thrust is `rho n^2 D^4 K_T(J)` (`abacus1:4527819663b8`) with a four-quadrant `K_T`,
because crash stops and sternway run the screws backwards through water moving ahead; a stopped screw is a drag; the
centre screw follows the turbine rule above. A torque balance is worth its few lines here: a reciprocating engine at
a fixed throttle gives about the same torque at any speed, so the shaft finds the speed at which the screw absorbs
it, and that is what changes when the ship slows in a turn or a screw breaks the surface [read: M8]. Until the
four-quadrant data are found, a published tanker model's thrust in `u n` and `|n| n` works across a reversal [read:
M8, Van Berlekom and Goddard 1972].
From Biles's figure the hull drag constant is 14,086 kg/m at 53,850 t and 13,231 kg/m at the night's 49,021 t
(`abacus1:434deb023bbe`, `abacus1:4cefc0a23470`; the displacement scaling is a [bet]). That is 1,890 kN at 22.5
knots at the deeper draft; a Holtrop-Mennen estimate with assumed form coefficients gives about 1,600 kN before
appendages [read: M6]. The two agree within a sixth, which is as well as the record lets them.

Three things follow from having three shafts and not one:

- **Steering by engines comes free.** The yaw moment of the wing screws is half their spacing times the difference
  of their thrusts. The second trial circle was made with the starboard engine full astern, and Britannic was turned
  with her screws when her steering gear failed [read: fact sheet section 5; T6]. The Bridge panel can start with one
  handle and offer three.
- **The data that matter most are missing.** Thrust with the screws turning astern while the ship still moves ahead
  (the "four-quadrant" curves) decides the crash stop, and no open source for it was reached today; the open-water
  polynomials are on file but stop at a pitch ratio of 1.40, and the wing screws' is 1.49 [read: M7]. The wing
  shafts' distance off the centreline and the drag of a stopped screw were not found either.
- **The rudder formula needs one rewrite.** The standard inflow expression divides by the centre screw's speed; the
  same momentum theory written with the thrust, `u_inf = sqrt(u_P^2 + 8 T / (rho pi D^2))`, is finite when the screw
  stops [read: M7]. With the centre screw running astern no formula is valid, and the model should say so.

**Steam that drowns** (feed R2, second tier). The boilers sit in the six boiler rooms the flooding core already
tracks: 24 double-ended and 5 single-ended [read: fact sheet section 3]. A room's boilers are lost when the water
reaches the furnaces, the reciprocating engines when their room floods, the lights when the dynamos do. So a "keep
steaming" what-if runs out of steam by itself: in the 1912 run the water stands 1.9 m over the tank top of boiler
room 6 after 5 minutes and 3.5 m after 10 [measured].

### 4.4 The rudder, and the turbine question

One unbalanced rudder of 401.63 sq ft (37.31 m², `abacus1:2b8bb87f9a58`; 1.37 % of length times draft,
`abacus1:e83bd1138941`) stands directly behind the centre screw [read: fact sheet section 1]. Its force follows the MMG
rudder model: a normal force `1/2 rho A_R U_R^2 f_alpha sin(alpha_R)` in an inflow that is partly the centre screw's
race [read: M1, Eqs. 18 to 25]. The hard-over angle is 40°, in the helmsman's own answer to the Inquiry ("What is it,
35 degrees? - Forty degrees.", question 998) [read: fact sheet section 1]. The one thing the record does not give is the
rudder rate: there is no measurement, and the estimates run from 40° in 5 s to 40° in 18 s. The fit must supply it.

The model answers a famous question by construction. With the centre screw stopped, as "full astern" or "stop" make
it, the rudder loses the race: in the prototype the time to turn two points rises by 23 to 24 % (55.5 to 68.8 s in
the unified form) and the circle grows by 22 to 28 % across the three hull sets [measured, `e2_mmg.js` run 2,
first-guess rudder and propeller numbers, so the sizes are a bet and the direction is not].

### 4.5 What the prototype says

`docs/research/experiments/e2_mmg.js` is a 3-degree-of-freedom MMG model written today with first-guess coefficients,
to answer one question: do textbook formulas and the ship's particulars land near the trial record with no tuning?
[measured]

| | Trial record [read] | Cubic set (constants from memory) | Kijima 1990 | Unified form, 2009 (sourced; coefficients extrapolated) |
|---|---|---|---|---|
| Tactical diameter, full speed, helm hard over | 3,800 to 3,900 ft | 2,561 ft | 6,377 ft | 4,483 ft |
| Advance | about 2,100 ft (Wilding); 2,540 ft in Halpern's model | 2,931 ft | 4,422 ft | 3,674 ft |
| Time to turn two points at 21.5 kn | 37 s from the order (Olympic, 1912) | 50.5 s | 60.3 s | 55.5 s |
| Speed in the steady turn, share of the approach speed | 0.76 (Halpern's model, not a measurement) | 0.63 | 0.78 | 0.74 |
| Heel in the steady turn | about 5.4° (a calculation) | 5.5° | 3.0° | 4.0° |
| Step of 0.25 s against 0.01 s | | tactical diameter 780.72 against 780.62 m | | |

The runs are at 20.5 kn (21.5 kn for the two-point turn), 40° of rudder, the rudder's 37 m² and a normal-force
coefficient capped at 1.3 (run 2; the first run's output is kept beside it: it used a coefficient for the speed loss
in a turn that I remembered wrongly, and the research note's sourced formula replaced it).

Three readings. The structure is sound and the step is accurate enough (0.01 % on the tactical diameter). The
unified form is the one to build on: 16 % wide on the circle and right on the speed loss before any fitting, where
the polynomial sets are a third tight and two thirds wide. And every set is too slow into the turn, 50 to 60 s for
the two points against 37: the yaw acceleration the record implies (`abacus1:5799e6b1dced` and the rudder's lag on
top of it) needs about twice the rudder force these first guesses give, which is what a published estimate of 423
tons at 22.5 knots also says [read: fact sheet section 1]. That is one number, the inflow the centre screw's race
gives the rudder, and the 37 s pins it.

The surge balance does better, because it needs fewer guesses. With Biles's resistance, a stopped centre screw's drag
and 2.2 MN of astern thrust from the two wing engines [bet inputs], the closed-form crash stop is 730 m in 174 s from
18 knots and 854 m in 187 s from 20 knots (`abacus1:c1cc143eee39`, `abacus1:7e2fcb4ffc9d`, `abacus1:9af2bb8e62e6`,
`abacus1:ca0bd6637b20`), before any allowance for the time the engines took to reverse. Wilding's figures for the trial
are "just over 3,000 feet" (914.4 m) in 3 min 15 s. A coast-down from 22.5 to 10 knots on hull drag alone takes 412 s
and 3,094 m (`abacus1:25f7c9f0d450`, `abacus1:0b028e29d56a`): the ship does not stop when the telegraph does, which
matters for section 5.

### 4.6 The ship that the flooding changes

- **Heel in a turn** (seam S3) is first-order on this ship because her GM was 0.80 m. The roll moment is each lateral
  force times its distance below the centre of gravity, plus the inertia of the flood water at its own height. In
  Halpern's steady turn (17.1 kn on a 1,925 ft radius) the quasi-static heel with the core's own KG and GM is 5.65°
  outward (`abacus1:d062b88f0e09`); Hackett and Bedford's published figure is about 5.4° [read: fact sheet section 8].
  The lever is from the centre of gravity down to where the hull's side force acts: mid-draft in the textbook form,
  nearer 0.35 of the draft below the waterline in the one fully published four-degree-of-freedom model, a fast
  container ship with a GM of 0.3 m [read: M4]. The core then does what it already does with a heel: flood water runs
  to the low side and the free surfaces amplify it. By the stability code's lever the research note gets about 4° at
  this GM and about 11° at a GM of 0.3 m [read: M4]: as flooding eats the GM, the same turn heels her far more.
- **Trim by the head eats her course stability.** For the bare hull the regressions don't even agree on the sign as
  she sailed: Kijima's index is -0.0005 and Clarke's +0.0008, and with the published trim factors Kijima's crosses
  zero at 0.111 of the draft by the stern (`abacus1:1e1b7aabf173`), about 1.1 m, where she sailed at 0.91 m. The
  rudder, acting as a fin, makes both clearly stable (about +0.007 with an assumed rudder) [read: M9]. So she steered
  well as built; every foot the bow goes down takes margin away; and the margin goes altogether when the stern lifts
  the rudder out. [bet: the regressions are outside their range here; the direction is standard, the threshold is not
  established]
- **Screws and rudder come out.** The core already marks the moment the centre screw breaks the surface. Thrust
  falls with the immersion of the shaft centre `h` over the screw's radius `R`: Minsaas's fit is
  `1 - 0.675 (1 - 0.769 h/R)^1.258` below `h/R = 1.3`, which is 0.89 with the tip at the surface and 0.325 with the
  shaft at the surface (appendix A, lines 72 to 74); torque falls as that factor to the power 0.8, so an unloaded
  screw races [read: T8]. The rudder's force goes with its immersed area and loses the hull's end-plate effect when
  its top comes out [bet]. Both powers are written without `Math.pow` (section 3.6).
- **Mass and its centre move.** At 2:09 am there are 31,500 t of water in the forward third. The equations of 4.1 take
  the total mass and its centre each step.
- **A listing, holed ship steers herself, and the sources don't agree which way.** The one published
  four-degree-of-freedom model has a heeled ship turning toward her high side; a 2026 computation of a damaged naval
  hull under power has her circling toward the damaged side; and the same literature finds that resistance rises with
  flooding mainly through sinkage [read: M4; T2, abstracts]. These are behaviours for the model to show and for a test
  to check, not ones to build in.

### 4.7 Calibration targets, and validation kept apart

The research pass today went to the primary testimony (the British Inquiry and Wilding's 1915 deposition). It corrects
two numbers that are repeated everywhere, and that I started with: the stopping distance and the speed of the turning
trial.

| Measurement | Value [read] | Note |
|---|---|---|
| Titanic turning, 2 April 1912, full speed, helm hard over | tactical diameter "between 4 and 4½ lengths", "between 3800 and 3900" ft; forward travel "about 2100 feet" | speed 18 to 20 kn by Inquiry answer 25291; the popular 20.5 kn is secondary |
| Titanic stopping, same day, both engines reversed | way off in "about three minutes and 15 seconds"; "just over 3,000 feet"; about 60 rpm, about 18 kn (1912) or "about twenty knots" (1915) | **the popular "850 yards" disagrees with Wilding's own figure** |
| Olympic, 1912, helm hard over at about 74 rpm, 21.5 kn | two points (22.5°) in 37 s "from the time the order was given"; 1,200 to 1,300 ft run | the 1915 deposition says both engines were also reversed (struck out as hearsay) |
| Olympic stopping, 1911, about 22 kn | "just about the same distance; rather less" | no number |
| Speed against revolutions | section 4.3 | several independent points |
| Heel in a full-speed turn | about 5.4° (Hackett and Bedford) | a calculation, not a measurement |
| After the collision | still 4 to 6 kn after a minute or two of running on and a minute or two slow astern; dead in the water about 17 min after the impact | Halpern's reconstruction: a soft target |
| Britannic, 1916 | the captain saw the water come in faster while she moved ahead, and slower when he stopped the engines | second-hand; the one direct observation of what section 5 models |

Two traps in the record [read: fact sheet, "Conflicts and doubts"]: Wilding's forward travel of 2,100 ft against a
tactical diameter of 3,850 ft is a ratio of 0.55, low for a ship turning from speed, so he may have measured from
another starting point (Halpern's model gives 2,540 ft); and the Olympic turn of 37 s may have been made with both
engines reversed as well. Run that test both ways.

**Fit** (as the repository fitted four flow parameters): the cross-flow drag level and its fore-and-aft split, the
rudder's effective inflow (one factor), the rudder rate, and the astern thrust level. Five numbers against six or seven
measurements, some of them ranges. **Validate, and never fit:** the speeds at Half and Slow, the Olympic stop from
22 knots, Wilding's remark that a lower speed changes the circle "only by a very small amount", the heel, the speed
left after the collision, and the second trial circle (helm hard over with the starboard engine full astern), whose
dimensions are in the Inquiry's exhibits but not in the transcript.

## 5. How motion changes the flooding

### 5.1 The outside pressure at an opening when the ship moves

In the ship's frame the flow is steady, and Bernoulli gives the pressure on the hull at a point `p` as the calm-water
hydrostatic pressure plus `C_p(p) * 1/2 rho U^2`. So the only change the orifice law needs is the outside level:

    outside piezometric level at the opening:  hx = C_p * U^2 / (2 g)          (metres above the calm sea)
    flow:                                       Q = cm * Cd * A * sqrt(2 g (dh_static + hx))

(`abacus1:a1af0c294053`, `abacus1:82be9a3d1f59` for the dimensions.) `C_p` is 1 on plating that faces the flow
squarely (a stem crushed head-on, a hole torn open so that it scoops), about 0 on plating the flow slides along, and
slightly negative where the flow speeds up around the body. The scale is the dynamic head:

| Speed | U²/2g | Receipt |
|---|---|---|
| 5 kn | 0.337 m | `abacus1:f00d9a8ef2ea` |
| 10 kn | 1.349 m | `abacus1:5a6579dac754` |
| 22.5 kn | 6.829 m | `abacus1:3f7d4ef081a5` |

against a static head of about 7 m at the 1912 damage. At 22.5 knots the dynamic head equals the static one; at 5
knots it is a twentieth of it.

### 5.2 What the pressure coefficient is on this hull

- **The double-body part** (the flow around the hull with no waves). A prolate spheroid of the hull's fineness (9.85
  for the double body [derived, with a midship coefficient of 0.98]) has an exact solution: its lowest pressure
  coefficient, amidships, is -0.0429
  (`abacus1:312426f2fef1`; the surge added-mass coefficient is 0.0212, `abacus1:dca82148b455`), and
  `C_p = 1 - (1 + k1)^2 cos^2(slope)` along it. The waterlines at the height of the 1912 damage make 6° to 9° with the
  centreline [derived from `halfBreadth`], so by that analogy the coefficient along the damage is between -0.03 and
  -0.015: a slight suction, not a ram. A spheroid has no shoulders and a hull does: typical values for real forms of
  this fullness, as the research note recalls them, are +0.2 to +0.5 just abaft the stem and -0.1 to -0.3 at the
  forward shoulder, the bilge worst [bet: T3.1, from memory]. The 1912 damage runs from one region into the other, so
  its two ends may feel effects of opposite sign, and it must be treated opening by opening, as the core already does.
  Only a panel calculation on this hull settles the numbers.
- **Sinkage cancels the mean.** The same suction lowers the ship in the water until the pressures balance her weight
  again, so the average change of pressure on the bottom is exactly zero; what an opening feels is the difference
  between its local coefficient and the hull's mean. The ends sit slightly above the mean and the middle slightly
  below. [derived] A table of `C_p` and the sinkage and trim it implies must come from one calculation, or the model
  will count the effect twice.
- **The ship's own wave.** At 22.5 knots the Froude number is 0.2296 (`abacus1:9d3969f65fe4`) and the transverse
  wavelength 85.8 m (`abacus1:9c3d7437c9f1`). The wave profile along the hull, in units of U²/2g, is the pressure
  coefficient at the waterline, so one table serves both. The bow wave is the large term: by the published
  wedge-bow relation, as the research note and I both remember it, about 3 to 4.5 m at 22 knots and about 1 m at 10
  for an entrance half-angle of 13° to 18° (the core's fitted waterline enters at 16.5°) [bet: T3.2; the paper was
  seen as an abstract only]. The transverse waves' pressure at 7 m depth is 0.60 of its surface value at 22.5 knots
  (`abacus1:0ed6ff4438ff`) and 0.07 of it at 10 [derived].
- **In a turn** one side of the bow becomes the pressure side and the other the suction side, and the bow wave grows
  on one side and shrinks on the other. Forward of the pivot point the cross-flow is small; aft it is not. For a
  breach on the bow's side in a hard turn at 20 knots the research note bounds the cross-flow term at 0.3 to 1.0 m of
  head and the turn's heel at 0.5 to 1.2 m, with signs that can cancel [bet: T5]: about 8 % of the inflow either way.
- **Sinkage under way** in deep water is about 0.06 of U²/2g, 0.4 m at 22 knots, with a tenth of a degree of trim
  [bet: T4, from memory]. Flooding moves the bow by metres within minutes, so this is a refinement.

### 5.3 Water moving past the hole

At 22.5 knots the water outside passes the opening at 11.6 m/s while the jet through it, under 7 m of head, runs at
11.7 m/s (`abacus1:f040f57cfb1e`): the ratio is 0.99 (`abacus1:b6dcb8eb0747`). What that does depends on the shape of
the opening [read: research note T1]:

- **A compact, sharp-edged hole** fed by a stream moving across it passes less than one fed from still water, because
  the stream has to turn into it and separates at the upstream edge. The closest measured analogue is a port in the
  wall of a pipe carrying water (sewage-outfall diffusers). With `r` the share of the stream's velocity head in the
  total head at the hole, the classic sharp-edged fit is `Cd = 0.63 - 0.58 r` on the total head, which in this core's
  static-head form is a factor `(1 - 0.92 r) / sqrt(1 - r)`: 0.98, 0.93 and 0.77 at 5, 10 and 22.5 knots for a hole
  7 m down (appendix A, lines 64 to 66). The loss grows as the space fills and the static head falls. [bet: the fit
  is quoted from memory, by the research note and by me; the source is Fischer and others 1979, after Rawn, Bowerman
  and Brooks, and must be read before it is coded]
- **A rounded or bell-mouthed opening** gains slightly instead (a factor of 1.09 at 22 knots by the companion fit,
  equally from memory). Edge shape decides even the sign.
- **A long slit aligned with the flow**, which is what the 1912 damage was, is a different problem. The water keeps its
  speed along the slit and enters across it under the static pressure difference alone, so to first order there is
  no correction at all. [bet: the swept-wing independence principle applied to a slot; theory, not a test]
- **The uncertainty of the discharge coefficient at rest**, 15 to 30 % from plate thickness, torn edges and lapped
  seams, is as large as the whole speed effect at 10 knots.

So seam S2 is 1 for the 1912 seams, the fitted factor for compact holes (a mine, a ram, the viewer's hole tool), and
never a reason to change the calibrated coefficient at rest. The experiments today used a placeholder (0.82 at full
speed), which is near the compact-hole value and too pessimistic for the 1912 slits.

### 5.4 Measured: what speed does to the 1912 sinking

[measured, `e1_speed.js` on the patched core; the outside head is `C_p U(t)²/2g` at the 1912 openings; baseline
foundering 157.34 min]

| What the ship does after the collision | Assumed at the openings | Foundering | Change |
|---|---|---|---|
| Crash stop from 22.5 kn in 3 min 15 s | C_p +0.10 / -0.10 | 157.29 / 157.41 min | -0.05 / +0.07 |
| Coasts down from 22.5 kn, no astern power | C_p +0.10 / -0.10 | 157.02 / 157.67 | -0.32 / +0.33 |
| Stops, then 8 kn ahead from +10 to +30 min | C_p +0.10 | 157.13 | -0.22 |
| The same | full ram, C_p 1 | 155.22 | -2.12 |
| Holds 22.5 kn for 30 min, then stops | bow profile (mostly slight suction) | 158.03 | +0.68 |
| Holds 22.5 kn to the end | C_p +0.10 | 141.47 | -15.87 |
| Holds 22.5 kn to the end | C_p -0.10 | 182.01 | +24.67 |
| Holds 22.5 kn to the end | bow profile with the placeholder loss of 5.3 | 197.50 | +40.16 |
| Holds 22.5 kn to the end | full ram, C_p 1 (an upper bound) | 88.62 | -68.72 |
| Holds 10 kn to the end | full ram | 130.13 | -27.21 |

Three readings:

1. **For the night as it happened, speed is a second-order effect.** Any plausible account of the engine orders moves
   the foundering time by seconds to two minutes. One published reconstruction argues that about 20 minutes of steaming
   after the collision forced the water in [read: fact sheet section 7, Brown]; in this model that costs 0.2 minutes
   with side openings and 2.1 minutes even if every opening scooped. What this model does not have is that
   reconstruction's other mechanism, the swamping of pumps.
2. **For a ship that keeps her speed, one coefficient decides between 69 minutes sooner and 40 minutes later.** That
   is the hard physics of this feature, and the reason section 5.2 and the third research note exist. For the 1912
   damage itself my reading is the middle of that range: slits along the flow, pressure a little above the mean near
   the stem and a little below it at the shoulder, the ship's sinkage cancelling the mean. But the coefficients
   recalled for real hull forms span +0.4 to -0.3 along that damage, and no published study measures inflow against
   speed for a side breach at all [read: T2], so this stays a bet until the hull's own table is computed.
3. **Forward-facing damage is different in kind.** A head-on stem, a mine hole with the plating bent outward, a user's
   hole on the bow: full ram at 10 knots takes 27 minutes off.

### 5.5 Measured: openings near the waterline, and turning

[measured, `e1_heel.js`; the Britannic preset founders at 50.83 min at rest; "4°" means a roll moment that would heel
the intact ship 4°]

| Britannic preset, what is added | Foundering | List when the turn ends | First water through a port |
|---|---|---|---|
| nothing | 50.83 min | | 8.0 min |
| a 15 min turn, 4° moment toward the damage | 50.60 | 3.7° | 3.6 min |
| a 30 min turn, 4° moment | 46.26 | 8.7° | 3.6 min |
| 30 min at 15 kn: ports see +0.2 U²/2g, breaches C_p +0.1, 4° moment | 41.16 | 17.6° | 1.0 min |

Here motion is first-order: half an hour of steaming and turning costs 10 of 51 minutes and builds a heavy list. These
rows measure sensitivity; they are not a reconstruction. The record says she was at full speed, about 21 knots, when
the mine exploded; that her captain turned to starboard for Kea, stopped the engines when he saw the water coming in
faster while she moved, and started them again later; that the forward E-deck ports were under within 15 minutes; and
that she listed to starboard throughout [read: fact sheet section 9]. A turn to starboard heels a ship to port, away
from her damage, so the real run needs the motion model, not a guessed moment. The experiment also sharpens the warning
in HANDOFF 4f: the preset already sinks faster than the ship did (50.8 against 55 minutes), so adding her run for Kea
will push it further off, and the preset's guessed door and port areas are where to look. The 1912 preset barely
notices the same moment (157.21 and 157.63 min for 15 minutes each way): its openings are deep.

### 5.6 Smaller terms, sized

| Term | Size on this ship | Receipt | Tier |
|---|---|---|---|
| Momentum of ingested water, `rho Q u` | 62.5 kN at 324 t/min and 22.5 kn; hull resistance there is about 1,800 kN | `abacus1:8baaee00324a` | 1 (one line) |
| Tilt of flood-water surfaces in a turn, `atan(a/g)` | 0.4° in the trial circle at 12 kn; 0.77° at 17 kn, which is 0.4 m across the beam | `abacus1:33fa6031b0b1`; line 71 | 2 (seam S4) |
| Sloshing | first transverse mode of a 28 m space under 3 m of water is about 10 s (`sqrt(g k tanh(k h))`, `abacus1:126ebba0e231` for the form); the ship's accelerations change over tens of seconds to minutes, so the level, tilted surface holds | | not modelled |
| Reaction of the jets through the hull | about 12 kN for 0.75 m² at 7 m | | not modelled |
| Thrust and drag couple on trim | about 2 MN m against a pitch stiffness of 2.1e11 N m/rad | | not modelled |

Seam S4 in one line: the internal level solve uses a frame whose "up" is `(a_x, a_y, g)` normalised, while the sea
outside stays level; with zero acceleration that frame is the present one exactly. The tilt is small, but it acts at
the weir crests (bulkhead tops, deck edges), where the flow goes as the head to the power 1.5.

One consequence of seam S1 that is easy to miss [read: T7]: under way, a space with one hole fills to the pressure
level at that hole, not to the waterline, and a space with two holes at different points of the hull carries a flow
through it, driven by the difference of their pressure coefficients (0.3 of the dynamic head is 2 m at 22 knots). That
is why `hx` is per opening and not one sea level.

### 5.7 The tiers

| Tier | Outside head `hx` | Discharge factor `cm` | Loads S3 | When |
|---|---|---|---|---|
| 0 | stagnation by the plating's angle to the local flow (1 head-on, about 0.02 along the 1912 damage), plus a bow-wave rise with depth decay | by the opening's shape: 1 for a slit along the flow, the sharp-edged port fit for a compact hole | heel in a turn | first release |
| 1 | a table `C_p(x, z)` and a wave profile against Froude number, computed offline for this hull, with the matching sinkage and trim | the same, by opening shape | plus sinkage and trim | when a what-if at speed matters |
| 2 | plus the side-to-side difference in a turn | | plus apparent gravity (S4) | with the collision work |

Tier 0 is enough for the night as it happened; the tables of Tier 1 are what the high-speed what-ifs need, and the
exact spheroid of section 5.2 is the test their generator must pass first. The research note closes with its own
ranking of thirteen effects at 5, 10 and 22 knots, made without sight of the experiments here; it reaches the same
order: at 5 knots nothing but a ram opening exceeds 2 %, and at 22 knots the hull's pressure field, the opening's
shape and, near the waterline, the bow wave are first-order and of like size.

## 6. Where Abacus fits

**What it is** [read and run today]. A catalogue of 29 deterministic, certified math commands in C++, one binary,
JSON in and out, a grade on every answer (exact, enclosed, and so on) and a SHA-256 receipt that replays. It was
unpacked from `Downloads\abacus.7z` to `C:\code\abacus` (the main tree, 82.7 MB of the archive's 7.5 GB); on this
laptop `selftest` passes 20 of 20 and its MCP server answers. `docs/ABACUS.md` is the how-to for sessions here.

**What it did today.** 75 answers, in `docs/research/abacus/`: 44 exact, 30 enclosed, and 1 refuted on purpose (a
planted wrong formula, to show the check can fail); all 75 replay.

**What it is for in this project:**

1. **Units at the edge.** The sources speak in feet, knots, long tons, horsepower and revolutions per minute. Every
   constant in `core/shipdata.js` gets one exact conversion with its receipt.
2. **Dimensions before code.** Every new formula goes through `check.units` first. Eleven did today.
3. **Certified steady states as test oracles.** The time stepper must settle where the algebra says: the speed at
   which thrust equals resistance for each engine order (one real root, certified unique: `abacus1:6be17bc8ef06` is
   the pattern), the three unknowns of a steady turn (`check.root`), the trim at which stability changes sign. These
   tests don't depend on the integrator, so the JavaScript core, the C++ build and the CUDA build can all be held to
   them.
4. **Closed-form oracles for the generators.** The spheroid's exact pressure for the `C_p` table; later, exact strip
   integrals for the sectional model (`num.integrate`).
5. **Bits.** `float.eval` and `float.sweep` answer whether a `Math.pow`-free rewrite changes the last bit, which this
   repository has reason to care about.

**What it is not.** It doesn't integrate equations of motion, solve the flow around a hull, or fit anything. And a
certified number built on a guessed coefficient is a guess with a receipt; the tags in this document say which is
which.

**Gaps found** (for Bo, as its owner): no long ton and no horsepower among the units; `rpm` carries an angle dimension,
so it converts to rad/s and not to Hz. Workarounds are in `docs/ABACUS.md`.

## 7. The viewer

- **A Bridge tab:** the telegraph (Full, Half, Slow, Dead Slow, Stop; ahead and astern; one handle for all engines,
  with the turbine following its rule), the wheel (rudder order to ±40°), and readouts: speed, heading, rate of turn,
  three shaft speeds, rudder angle, heel.
- **A treadmill, not a moving ship.** Keep the hull at the scene's origin and move the sea texture, the wake and the
  track under her; every camera and the X-ray hull keep working, and precision never degrades with distance run.
- **A chart inset:** the track, the heading, and later the ice.
- **Time.** At 900× a ship at 22 knots covers 10 km a second. Steering by hand needs 1× to 30×; above that the
  scenario's order timeline does the steering.
- **The forecast** runs the orders as they stand, and says so.

## 8. What this opens up (later, and only if wanted)

- **The collision as an event.** With a moving ship and a fixed iceberg the damage can be made by the contact instead
  of given: where the side meets the ice, for how long, how much plating per metre. Then "port around", "head on" and
  "at 15 knots" become runs, not presets. The head-on case has period numbers to test against: the US Navy's
  hydrographer put the blow at 21 knots at 1,173,200 foot-tons (3.18 or 3.56 GJ, by the short or the long ton), and
  Wilding said "I feel sure the ship would come in" [read: fact sheet section 12]; the core's mass carries 2.86 GJ at
  21 knots and 3.28 GJ at 22.5 (appendix A, lines 67 to 70).
- **The Carpathia question gains moves.** Steaming toward the rescuer, against the boats that could not be lowered
  while she had way on, and the steam that drowned.
- **Britannic's run for Kea, and other ships** (HANDOFF 4g: Lusitania sank with way on in 18 minutes).

## 9. Build order, each step with its test

| Step | What | Acceptance test |
|---|---|---|
| P0 | The seams S1 to S3 in `core/core.js`; `tools/seams.js`; a golden trace regenerated on the machine that will use it | the patched core equals the unpatched one bit for bit on three scenarios (107,561 steps today); `node tools/validate.js` prints the same table |
| P1 | Surge only: `core/shipdata.js`, telegraph, three shafts, resistance, stopped-screw drag, astern thrust | steady speeds at Full, Half, Slow within 0.5 kn of the record; the stopping trial within 15 % in distance and time; each steady speed equal to its certified root |
| P2 | Sway, yaw and rudder with the sectional hull model; `tools/trials.js`; the fit | the trial circle, the advance and the two points in 37 s inside their recorded ranges; the validation rows of 4.7 reported, not fitted |
| P3 | The ship the flooding changes: heel in a turn through S3, local drafts into the hull model, immersion of screws and rudder, total mass and centre | steady heel within a degree of the certified quasi-static value; at rest, still bit-identical |
| P4 | Flooding coupling, Tier 0: `hx` and `cm`; the 1912 orders as a scenario timeline; Britannic re-run with her speed and turn | at rest bit-identical; the 1912 foundering time moves by less than 2 minutes under the recorded orders (today's measurement is the expectation); the Britannic result reported with its misfit |
| P5 | The Bridge tab, the treadmill, the chart inset, the forecast with orders | the device matrix of `tools/site_test.js` plus one scripted manoeuvre per device |
| Later | Steam that drowns; Tier 1 tables; seam S4; the collision event; the C++ and CUDA motion kernel | each with its own |

P0 to P2 are headless and can be judged entirely by numbers. Nothing in the viewer is needed to know whether the
physics is right.

## 10. Decisions needed (who decides)

| # | Decision | Who | My recommendation |
|---|---|---|---|
| D1 | The first release's scope | Bo | P0 to P5 with Tier 0; steam, Tier 1 and the collision later |
| D2 | Where the motion code lives | Bo | `core/motion.js` wrapping `C.step`; the core gets the seams and nothing else |
| D3 | Is a bit-identical-at-rest test enough to change the oracle file under the "never port and change physics together" rule? | Bo | Yes: make it a permanent gate, and give the C++ build the same nine lines |
| D4 | Hull-force model | Bo | The sectional model of 4.2, fitted to the trials; the regressions supply the linear terms only |
| D5 | Which trial figures are the targets where the record conflicts | Bo | Wilding's own testimony: "just over 3,000 feet" for the stop, 18 to 20 kn for the circles; the 37 s as "from the order", run with and without the engines reversed; the 2,100 ft advance held back until its starting point is settled |
| D6 | The rudder rate, which nothing in the record gives | Bo | A fitted number between 2.2 and 8 °/s (40° in 18 to 5 s); the hard-over angle is 40° on the helmsman's testimony |
| D7 | Tier 0 pressure in the first release, or controls first and pressure after | Bo | Tier 0 in: it is small, bounded, and the reason for the feature |
| D8 | Abacus for sessions here: `.mcp.json` in this repository with its own journal (set up today), or user scope on this machine | Bo | Keep it in the repository; note that `.mcp.json` holds machine paths, so decide before it is published |
| D9 | This folder has no git history | Bo | Before any implementation: bring the clone, or `git init` here, so every step of section 9 is a commit |
| D10 | When the C++ and CUDA build (sinksim) follows | Bo | Seams with P0; the motion kernel after P2's fit is frozen |
| D11 | Britannic: refit the preset's guessed areas once she has speed? | Bo | Report the misfit first; refit only with better data on her ports and doors |

## 11. Risks

1. **The fit has little to hold on to.** Six or seven trial numbers, two of them in conflict between sources, on a hull
   outside every regression's range. The validation rows of 4.7 are thin. Mitigation: fit few numbers, publish the
   misfits, keep the second trial circle as a target to recover from the Inquiry's exhibits.
2. **The pressure at the openings is the least certain physics here, and at speed the answer hangs on it** (69 minutes
   sooner to 40 later). The research found no published measurement of inflow against speed for a side breach, and
   only one direct observation, second-hand, from Britannic's bridge. Mitigation: Tier 0 is bounded and honest about
   its range; Tier 1 gets a generator that must reproduce an exact solution first; the viewer says which tier
   produced a number.
3. **Last-bit drift.** The oracle already differs between machines after 72 minutes. A motion model adds calls.
   Mitigation: the rules of 3.6, and golden traces made on the machine that consumes them.
4. **Two models to keep in step.** The JavaScript core and the C++ build must take the seams together.
5. **Formulas from memory.** Yoshimura and Masumoto's 2012 constants in the prototype could not be found online
   today and are from memory; so are the sharp-edged port fit of 5.3, the aligned-slit argument, and the
   Oltmann-Sharma and Hooft attribution in 4.2. The web tools could not read PDFs today, so several papers were seen
   only as abstracts. Nothing from memory goes into `core/` without its source.
6. **Scope.** Wind, waves, shallow water, currents and other ships are out. The night of 14 April was flat calm.
7. **Abacus here is a copy.** It runs, but can't be rebuilt on this laptop until the rest of the archive is unpacked,
   and a newer build elsewhere may answer differently; `abacus replay` on the results file is the check.
8. **Playability.** Steering needs slow time and the sinking needs fast time. The order timeline is the bridge between
   them; it needs design care.

## 12. Sources, and what was added today

**Read in this repository:** `README.md`, `HANDOFF.md`, `PORTING.md`, `CLAUDE.md`, `CHANGELOG.md`, `core/core.js`
(whole), `core/scenarios.js` (whole), `tools/validate.js`, `tools/golden.js`, `tools/titanic.js`,
`site/worker-glue.js`, the function list of `site/app.js`. **Not read:** `web/`, the rest of `site/app.js`, the other
tools, `dist/`.

**Read in Abacus:** `README.md`, `HANDOVER.md`, `CONVENTIONS.md`, `contracts/envelope.md`, `contracts/journal.md`,
`contracts/num.eval.contract.md`, the output of `abacus describe`. **Not read:** its source, designs and the other
contracts.

**Added today, all under `docs/` except the last:**

| File | What it is |
|---|---|
| `docs/BRAINSTORM_ship_under_way_v1_2026-11-16.md` | this note |
| `docs/ABACUS.md` | how sessions here use Abacus |
| `docs/research/RESEARCH_olympic_class_steering_propulsion_trials_v1_2026-11-16.md` | the sourced fact sheet (a research agent's; I spot-checked it against my own figures, not against the web pages) |
| `docs/research/RESEARCH_mmg_hull_rudder_propeller_models_v1_2026-11-16.md` | the manoeuvring formulas with sources and tags |
| `docs/research/RESEARCH_breach_inflow_at_speed_v1_2026-11-16.md` | inflow at speed, hull pressure, the ship's wave (see the status line below) |
| `docs/research/experiments/*.js` and `results_2026-11-16/*.txt` | the five experiments and their outputs; none writes into the repository |
| `docs/research/abacus/requests_...jsonl`, `results_...jsonl` | the 75 requests and their certified answers |
| `.mcp.json` | registers Abacus for sessions started in this folder |

**Status of the research notes when this was written:** see the addendum at the end.

**Not checked:** I did not open the web sources myself; the research notes quote and link them. The prototype's
coefficients are first guesses. No number in section 5.4 or 5.5 comes from a validated pressure model: they measure
the flooding core's sensitivity to an assumed outside head.

## Appendix A. The certified numbers

Request `n` is line `n` of `docs/research/abacus/requests_ship_under_way_v1_2026-11-16.jsonl`; its answer is line `n`
of the results file. Inputs marked [bet] make the result a bet with certified arithmetic.

| Line | What | Value | Grade | Receipt |
|---|---|---|---|---|
| 1 | 22.5 kn | 11.575 m/s | exact | `abacus1:6d40f953596d` |
| 4, 5 | 850 ft; 92.5 ft | 259.08 m; 28.194 m | exact | `abacus1:e71dadaed8ae`, `abacus1:e686c8fb738c` |
| 6, 7 | 3,850 ft; 2,100 ft | 1,173.48 m; 640.08 m | exact | `abacus1:1d8bb72e5f40`, `abacus1:9df2ede665db` |
| 8, 45 | 850 yd; 3,000 ft | 777.24 m; 914.4 m | exact | `abacus1:e6cd80139ce3`, `abacus1:e512cea366ef` |
| 9 | 52,310 long tons | 53,149.41 t | exact | `abacus1:a96cc4c62f34` |
| 10, 11 | 15,000 hp; 16,000 hp | 11,185.50 kW; 11,931.20 kW | exact | `abacus1:047c3859df01`, `abacus1:ff3ef936431b` |
| 12 | 75 rpm | 7.85398163397 rad/s | enclosed | `abacus1:78d07c7e4fd3` |
| 13, 48 | 23.5 ft; 17 ft | 7.1628 m; 5.1816 m | exact | `abacus1:9abf6bc9bc41`, `abacus1:43da660cc423` |
| 15-17 | U²/2g at 22.5, 10, 5 kn (g = 9.81) | 6.8287780; 1.3488944; 0.33722361 m | exact | `abacus1:3f7d4ef081a5`, `abacus1:5a6579dac754`, `abacus1:f00d9a8ef2ea` |
| 18 | Froude number at 22.5 kn | 0.22959877 | enclosed | `abacus1:9d3969f65fe4` |
| 19 | transverse wavelength at 22.5 kn | 85.812956 m | enclosed | `abacus1:9c3d7437c9f1` |
| 20 | wave pressure at 7 m depth, share of the surface value | 0.59897418 | enclosed | `abacus1:0ed6ff4438ff` |
| 21, 22 | jet speed under 7 m; ship speed over jet speed at 22.5 kn | 11.719215 m/s; 0.98769414 | enclosed | `abacus1:f040f57cfb1e`, `abacus1:b6dcb8eb0747` |
| 23, 24 | spheroid of fineness 9.85: k1; lowest C_p | 0.021200892; -0.042851261 | enclosed | `abacus1:dca82148b455`, `abacus1:312426f2fef1` |
| 29, 30 | heel and surface tilt in the trial circle at 12.3 kn [bet: the speed] | 2.93°; 0.40° | enclosed | `abacus1:8ff84326c4b5`, `abacus1:33fa6031b0b1` |
| 31 | momentum of 324 t/min at 22.5 kn | 62,505 N | exact | `abacus1:8baaee00324a` |
| 32-41 | ten formulas' dimensions | hold | exact | in the results file |
| 42 | a planted wrong formula | refuted | exact | `abacus1:6c6235d50bec` |
| 43 | steady speed, wings at 50 rpm, centre screw stopped [bet inputs] | 6.650323872437 m/s, the only root | enclosed | `abacus1:6be17bc8ef06` |
| 44 | trim over draft at which Kijima's stability index is zero [bet inputs] | 0.11138218176331 by the stern | enclosed | `abacus1:1e1b7aabf173` |
| 47 | 401.63 sq ft | 37.3126479552 m² | exact | `abacus1:2b8bb87f9a58` |
| 50 | 165 long tons-force | 1.6440627 MN | exact | `abacus1:3446a659ab80` |
| 51, 52 | hull drag constant from it at 21 kn; scaled to 49,021 t [bet: the scaling] | 14,086.491; 13,231.178 kg/m | exact; enclosed | `abacus1:434deb023bbe`, `abacus1:4cefc0a23470` |
| 53 | rudder area over length times draft | 0.0136958 | exact | `abacus1:e83bd1138941` |
| 54-57 | crash stop from 18 and from 20 kn: distance, time [bet inputs] | 729.98 m, 174.49 s; 854.26 m, 187.21 s | enclosed | `abacus1:c1cc143eee39`, `abacus1:7e2fcb4ffc9d`, `abacus1:9af2bb8e62e6`, `abacus1:ca0bd6637b20` |
| 58, 59 | coast from 22.5 to 10 kn on hull drag: time, distance | 412.07 s; 3,094.31 m | exact; enclosed | `abacus1:25f7c9f0d450`, `abacus1:0b028e29d56a` |
| 60 | heel in a steady turn at 17.1 kn on 586.74 m | 5.6483746° | enclosed | `abacus1:d062b88f0e09` |
| 61-63 | 22.5° in 37 s: mean rate; the constant yaw acceleration it needs; distance at 21.5 kn | 0.608108 °/s; 0.00057370209 rad/s²; 409.24 m | exact; enclosed; exact | `abacus1:9977c18b24a3`, `abacus1:5799e6b1dced`, `abacus1:1355b3db8701` |
| 64-66 | cross-flow factor of a compact sharp hole 7 m down at 5, 10, 22.5 kn [bet: the fit] | 0.980484; 0.929664; 0.766556 | enclosed | `abacus1:1323731c701a`, `abacus1:cd5e79f8a369`, `abacus1:2137bea02211` |
| 67, 68 | kinetic energy of 49,020.667 t at 21 and 22.5 kn | 2.86065; 3.28391 GJ | exact | `abacus1:cf9f23599045`, `abacus1:db6a4f61fbc0` |
| 69, 70 | 1,173,200 foot-tons, by the long ton and by the short ton | 3.5630; 3.1813 GJ | exact | `abacus1:59fea25f3b68`, `abacus1:ca2dc3f8067b` |
| 71 | surface tilt in a steady turn at 17.1 kn on 586.74 m | 0.770284° | enclosed | `abacus1:d3eb71ac1feb` |
| 72-74 | Minsaas's thrust factor at h/R = 1, 0.5, 0 | 0.893162; 0.633434; 0.325000 | enclosed | `abacus1:22f3676b660e`, `abacus1:9840c14ea3b8`, `abacus1:95524bbbccce` |
| 75 | the cross-flow factor is dimensionless | holds | exact | `abacus1:40a784e00d26` |

Lines 25 to 28 used a first-guess drag constant (11,196 kg/m) and are superseded by lines 54 to 59.

## Appendix B. To reproduce

    node docs/research/experiments/e0_golden.js .
    node docs/research/experiments/e1_invariance.js . <any scratch folder>
    node docs/research/experiments/e1_speed.js . <any scratch folder>
    node docs/research/experiments/e1_heel.js . <any scratch folder>
    node docs/research/experiments/e2_mmg.js
    C:\code\abacus\dist\bin\abacus.exe batch --in docs\research\abacus\requests_ship_under_way_v1_2026-11-16.jsonl --out <a new file>

The scratch folder receives the patched copy of the core (`core_x.js`). Nothing is written into the repository.

## Addendum. The research notes when this version closed (13:54 CST)

Three research agents (Opus 5.5) wrote the notes from the web while the experiments ran. Their web tools could not
turn PDFs into text today, so anything that exists only as a PDF was seen as an abstract or not at all; each note
tags every formula with how it was seen and lists what was not reached.

| Note | State at 13:54 | Used here |
|---|---|---|
| Olympic-class steering, propulsion and trials | complete: 12 items, 21 conflicts, 10 ranked validation targets | sections 1 to 9, 11 and 12 |
| Breach inflow at speed | complete: eight topics, a ranking of thirteen effects, a not-found list | T1 to T8 and the ranking |
| Manoeuvring, rudder and propeller models | complete: M1 to M10, a minimal model with its inputs, the sign traps | M1 to M10 |

The last note arrived after a first close at 13:45 and before anything was delivered. It corrected one coefficient of
the prototype (run 2), supplied the sourced hull model of section 4.2, and changed the course-stability paragraph of
4.6. From here a revision is a v1.1; this file will not be edited.

The single most useful check to make next, in the notes' own judgement and mine: read Fischer and others (1979) for
the port coefficients of section 5.3, and find the four-quadrant propeller data of section 4.3.
