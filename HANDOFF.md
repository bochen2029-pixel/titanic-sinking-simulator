# Handoff notes for the desktop build

Written at the end of the browser session, 7 October 2026. `README.md` says what the model is and how well it fits; `PORTING.md` has the kernel plan. This file is the rest: what to do first, what I am unsure of, the physics still missing, and the ideas that need a GPU.

## 1. Order of work

1. **Freeze the oracle.** `node tools/golden.js` writes `out/golden_titanic.json`: the 1912 run sampled every 60 s (t, pose, rates, all 64 volumes). Commit it with `out/validation.json`. The port must match it.
2. **Port to C++ on the CPU first**, double precision, same dt, same order of operations. Match the golden trace to 1e-6 before touching CUDA. A port and a physics change in the same diff cannot be debugged.
3. **CUDA second.** Compare against the CPU build, not the JS.
4. **Only then change physics.** Every physics change invalidates the four fitted parameters. Rerun the calibration (seconds in C++, four minutes in JS) and the validation table, and keep the before/after in the commit message.
5. Consider compiling the C++ core to WebAssembly (Emscripten). Then the browser viewer runs the same source as the GPU, and the JS core becomes a test fixture instead of a second implementation.

## 2. Things the JS core does that are easy to lose in a port

- An empty space has no head (level = -∞). It must neither push nor pull water.
- Stability limiter: a flow may move at most `0.5/deg` of the volume that would level its two ends, where `deg` is the number of active connections touching the node that step. Without it, side-to-side sloshing capsizes her in 80 minutes.
- A full space gets a virtual free-surface area `Aov = max(1, 3% of footprint)`, so its level rises above its top when pressed from below. The cap: no space is pressed above sea level; the excess goes back to the sea.
- Villemonte factor for a submerged weir: `(1 − (H2/H1)^1.5)^0.385`.
- Port and starboard halves of an open space share one free surface (`solvePair`). Holds 2 and 3 stay split under the firemen's tunnel until both sides pass `zMergeHold`.
- Free-surface solve: 6 bracketed Newton iterations per step, 40 at equilibration.
- Roll is clamped at ±80° and pitch at ±77°. The founder flag ends the physics; everything after it is a plunge animation.
- Tonnes are m³ × 1.025. The sources quote long tons.

## 3. GPU layout, beyond PORTING.md

- Gather, don't scatter. Build a node→connections CSR and let each node sum its own flows in a fixed order. `atomicAdd` gives run-to-run drift that will confuse both calibration and MCTS.
- One block per simulation, 256 threads: 17 columns per thread, two warps for the 64-node level solve. Column geometry in constant or texture memory; every simulation shares it.
- float32 for geometry, float64 accumulators for volumes and moments.
- Keep dt = 0.25 s for the golden tests. A semi-implicit flow update would allow dt of 1–2 s and 4–8× cheaper rollouts; do it as a flagged variant and recalibrate.
- Debug asserts: `Σvol − ∫inflow dt` within 1e-6 of ΣVmax; no NaN; `vol ≤ cap`.

## 4. Physics gaps, highest payoff first

### 4a. The initial starboard list (5° at 11:50)

Halpern's mechanism (*Titanic's Initial List to Starboard*): asymmetric flooding of holds 2–3, split by the firemen's tunnel, plus free surface in boiler room 6. The JS model reaches +1° and flips to port after 7 minutes.

The missing piece is probably the coal bunkers. The transverse bunkers against bulkheads D–J were full width, about 9 ft long, tank top to G deck, and in practice split port/starboard by the coal (the two in boiler rooms 5–6 held 365 and 307 tons). The damage ran into the starboard side of the forward bunker of boiler room 5 (Barrett). Model each bunker as a pair of sub-nodes, permeability about 0.45 when coal-filled, fed from the hull and draining into the boiler room through a small door area. 300 t of water 8 m off the centreline is 2,400 t·m, and 2,400 / (49,000 × 0.80) ≈ 0.06 rad ≈ 3.5°; the hold asymmetry supplies the rest. Also check `zMergeHold` (4.6 m now; take the tunnel height from the plans) and `axHold` (0.05 m²).

### 4b. The port list (10° at 1:50, 15° at 2:05)

Three candidates. Test each in the JS before porting.

- **Angle of loll.** A 35 m strip of E deck flooded across the beam has a free-surface inertia of about 35 × 28³ / 12 ≈ 64,000 m⁴, a GM loss of about 1.3 m, more than the 0.8 m she had. With GM slightly negative, a wall-sided hull lolls to `tan φ = √(−2·GM/BM)`: GM −0.1 m gives 10°, −0.3 m gives 17°, to whichever side is already favoured. The model holds GM near 0.5 m through 2:00 (`gmNow()`); find out why. Suspects: the pressed-up rule removes the free surface of any space that fills to the top; the upper layer's capacity and permeability; whether the loss of waterplane as the forecastle submerges reaches the buoyancy integral (it should, since columns stop at the deck).
- **Scotland Road.** The port-side working alley on E deck ran most of the ship's length; the starboard side was cabins. Water topping a bulkhead goes port first. The test is `upperSplit: 1` with `wStbd` near 0 and a small `axUp`. My quick try changed little, which itself suggests the upper layer is not producing the free-surface moment it should.
- **The forward port gangway door on D deck**, open on the wreck. Lightoller sent the bosun's mate and six men to open "the port lower-deck gangway door abreast of No. 2 hatch" around 12:30–12:45; none were seen again. The core supports time-activated openings (`tOpen`). My test, 2.4 m² at D deck, x = 85 m, opened at 50 min, sank her at 1:30 am, so try smaller, later, or further aft (x ≈ 60–70 m, below the bridge).

### 4c. Pumps and the door schedule

Pumping capacity, as usually cited, was about 1,700 t/h (28 t/min) against an initial inflow of about 400 t/min, so pumps don't change the outcome. They do change boiler room 5: the model's seam there admits about 20 t/min, which the pumps could hold, matching Barrett's account that BR5 stayed workable until a rush of water came through around 1:10 (usually read as the flooded bunker letting go). Add pump capacity per compartment as a negative source. The engineers also reopened doors aft of BR5 to lead suction pipes forward, so "doors closed from the bridge" is not the historical schedule either; build the schedule from testimony as a scenario.

### 4d. Hull girder and the break

Everything needed for a still-water bending moment is already computed per column: buoyancy per unit length minus weight per unit length (approximate the weight as the intact buoyancy distribution plus concentrated machinery). Integrate twice along x each step, show the hogging moment, and break when it exceeds the capacity. Recent work puts the break at a low trim angle, roughly 10–15°, not the film's 45°; the model reaches 10° at 2:15, which fits. After the break the bow is a free body: keep the column machinery, split the column set at the break station, run two rigid bodies.

### 4e. More deck layers

The node scheme (zone, side, layer) generalises. Layers {below G, G–F, F–E, E–D, D–C, above C} extend `nodeVmax`, the CSR slices and the "down" connections (hatches, stairs) without changing the step. This is the "individual decks" step from the March spec.

### 4f. Forward speed

Britannic kept steaming while Bartlett tried to beach her. Add a ram head `½ρv²` to openings that face forward and a factor on side openings. The model already gives 50 min against the real 55 without speed, so adding it will overshoot; something else is too fast, probably my porthole or failed-door areas.

### 4g. Real hull lines, other ships

`halfBreadth()` is a parametric fit. The column builder only needs a function (x, z) → half-breadth, so a rasterised watertight mesh (ray-cast per column) drops in and nothing else changes. The same route gives other ships: Lusitania (18 min, heavy list, speed), Empress of Ireland (14 min), Andrea Doria (11 h, pure asymmetric flooding, the best test of a list model), Costa Concordia (grounding, modern data).

## 5. Better data to fetch

- Hackett & Bedford, *The Sinking of S.S. Titanic, Investigated by Modern Techniques*, RINA Transactions 1996: flooding conditions C1–C7 with drafts forward and aft at times. A stronger calibration target than my eight eyewitness points.
- Halpern, *Titanic's Initial List to Starboard* (titanicology.com).
- SNAME Marine Forensics Committee papers on the break-up (2022), for 4d.
- The 2025 UCL/Paik flooding simulation from *Titanic: The Digital Resurrection*, if its numbers are published.
- Britannic: which six bulkheads went to B deck, and the count and positions of the open ports (Chirnside).

## 6. Parameters I am least sure of

| Parameter | Value | Note |
|---|---|---|
| `doorLowA` / `doorA` | 1.5 / 1.67 m² | Door sizes and sills are guesses. Empress of Ireland's were 5'6" × 2'. |
| `wPort` / `wStbd` | 3.0 / 2.0 m (× 1.18) | E-deck overflow widths. Take them from the E-deck plan. |
| Permeability | holds 0.95, boiler rooms 0.85 | Holds carried cargo; boiler rooms are solid with boilers low down. Make it height-dependent. |
| Zone floors | tank top, 1.6 m | Peaks at 0. The double bottom is otherwise ignored. |
| Breach split | H&B fractions | 6 compartments, z 2.3–3.2 m, paper-sized holes. |
| Britannic | `scenarios.js` | Hull = Titanic's; bulkheads D, E, F, G, H, K to B deck; doors D, E failed; 25 ports × 0.10 m². |
| Added mass, damping | ζ 0.6 heave and pitch, 0.12 roll | Only affects how fast she settles, not where. |

## 7. The Carpathia question (MCTS)

- **State:** `vol[64]` + pose + rates, about 140 doubles, through `serialize` / `restore`.
- **Actions:** the 15 doors (a door closed from the bridge could be reopened only by hand from the deck above); pump allocation, 1,700 t/h among compartments; counter-flooding (the after peak holds about 800 t; the double-bottom tanks a few thousand). Nothing else matters: 2,200 people weigh 150 t.
- **Reward:** time until founder, or until the first deck edge submerges.
- **Baseline:** 2 h 37 min. Doors open: 3 h 02 min in the current model. Carpathia alongside: about 4 h 20 min after impact.

I expect no policy reaches Carpathia, but the size of the gap is the interesting number, and the doors-open result deserves scrutiny on its own: it contradicts the common belief, and it depends on door areas and sills I guessed.

## 8. Tools in this package

- `tools/golden.js`: writes the golden trace.
- `tools/shot.js`: Playwright screenshot harness, so Claude Code can look at the viewer and drive it (needs `npm i playwright three@0.128.0` and `npx playwright install chromium`).
- `window.TitanicApp` in the viewer: `state`, `state.sim`, `project(x, y, z)`, for driving the page from the console or from `shot.js`.
- `CLAUDE.md`: frames, invariants and rules, so every session starts from the same conventions.
