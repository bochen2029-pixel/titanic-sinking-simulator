# Brainstorm: her wake, computed from her speed, her turn and her hull (v1)

Written 2026-11-19 14:05 CST. Bo's order: "When James Cameron made Titanic in 1997 he spent a lot of CGI on a realistic wake. Today we have CFD (`C:\code\FluidX3D`) and other tools (`C:\code\abacus`). Search online, use whatever math is needed, and brainstorm how to make realistic wake shapes for the Titanic dynamically, from her speed, a turn or a straight run, and so on."

**This is a brainstorm. No code was changed.** Revisions are new files (`..._v2_...`).
Tags: [M] measured this session, [A] certified by Abacus this session (`docs/research/abacus/results_wake_computed_2026-11-19.jsonl`, the line given), [R] read (file and line, or a linked page), [D] derived, [B] bet, including formulas written from memory that must be checked before they are coded.

## 1. What the page draws today

`site/visuals.js:200-301` [R: read on the committed tree `a97a6bd`]:

- Every half second of ship's time a sample of her state is laid on the sea: position, heading, surge, sway, yaw rate, thrust (`wakeTake`, `:218`).
- From those samples Kelvin's construction places the waves: a wave made tau seconds ago, travelling at angle theta to her course, now sits at half its phase speed's reach from where it was made (`kelvinPoint`, `:251`). The two cusp arms, 14 transverse crests and the divergent crests out to 72 degrees are drawn from it as **lines**.
- The white wake is a ribbon from the screws, 21 m wide at the stern, widening as (1 + s/L)^0.2.

What is right about it: the geometry is the real one, and because each wave is placed from where and how fast she was when she made it, a turn bends the pattern and a change of speed changes the wavelengths with no special case.

What it lacks, and what the eye reads as fake:

| Missing | Today |
|---|---|
| How high each wave is | one made-up strength, (U / 11.6)^2, the same in every direction (`:265`, `:285`) |
| A surface | lines on a flat sea: nothing to reflect the stars or her lights |
| Her hull | one point source at the bow; no stern system, so no interference along her length |
| The near field | no bow wave, no wave profile along her side, no quarter wave |
| The turn's own effect | the path bends the wake, but a hull moving partly sideways makes no different waves from one moving straight |
| Fading | crests die in 150 s [appearance]. Real waves of this length do not die; they spread |

## 2. The numbers that set her wake

| Quantity | Value | Tag |
|---|---|---|
| Froude number at 22.5 kn (on 850 ft between perpendiculars) | 0.2296 | [A: line 1] |
| at 18, 10 and 5 kn | 0.1837, 0.1021, 0.0510 | [A: 2-4] |
| Transverse wavelengths along her hull at 22.5 kn | 3.02 | [A: 5] |
| at 18 and 10 kn | 4.72, 15.3 | [A: 6-7] |
| Wavelength at the cusp, 22.5 kn | 57.2 m (the transverse waves: 85.8 m) | [A: 8]; the 85.8 from the 16 November batch |
| Cusp waves: phase speed, and the speed their energy travels | 9.45 m/s, 4.73 m/s | [A: 9-10] |
| Half-angle of the wedge | 19.47 degrees | certified on 16 November (`requests_stern_gear_wake_lights_2026-11-16.jsonl`) |
| A boat 500 m off her track is reached by the cusp | 122 s after she passes | [A: 11] |
| White wake's width 1 km and 5 km astern, by the page's law | 28.6 m, 38.1 m | [A: 12-13] |
| Depth over the transverse wavelength | 44: deep water in every sense | [A: 17] |
| Heading change along her own length in a turn of 587 m radius | 25 degrees | [D: 259 / 587 rad]; the radius is [B: half of a tactical diameter of about 3,850 ft, from memory; `core/motion.js` has the fitted one] |

Three readings:

- **She is a classic Kelvin ship.** Fast boats make narrow wakes: above a Froude number of about 0.5 the visible angle shrinks as 1/Fr ([Darmon, Benzaquen and Raphael, JFM 2014](https://www.cambridge.org/core/journals/journal-of-fluid-mechanics/article/abs/kelvin-wake-pattern-at-large-froude-numbers/6F9009238F6CA9E1221B0636B987361A), after Rabaud and Moisy). At 0.23 that law would give 50 degrees [A: 18], far outside the 19.47 limit, so it does not apply: her wedge is the full one at every speed she can make.
- **About three waves fit along her at full speed, fifteen at 10 knots.** The bow's wave system and the stern's add or cancel depending on that count. This is why a ship's wave-making does not rise smoothly with speed, and why the wake at 18 knots is not a scaled copy of the wake at 22.
- **Over her own length, in a hard turn, the water meets her bow and her stern from directions 25 degrees apart.** A turning hull is not a straight hull on a curved path.

## 3. The physics to add, in order of what it buys

### 3.1 How high each wave is: her own hull's wave spectrum
Far behind a ship moving steadily the surface is a sum of plane waves, one for every direction theta, each with the wavelength that lets it keep station with her:

`zeta(x, y) = Re of the integral over theta from -90 to 90 degrees of A(theta) exp(-i k0 sec^2(theta) (x cos(theta) + y sin(theta)))`, with `k0 = g / U^2`.

`A(theta)` is the ship's free-wave spectrum. Michell's thin-ship theory (1898) gives it from the hull's shape alone: an integral over her centre plane of the hull's slope dy/dx, weighted by `exp(k0 z sec^2(theta))` in depth and `exp(i k0 x sec(theta))` along her length, times `sec^3(theta)` [B: the form and its constants are from memory; check against Newman's "Marine Hydrodynamics" or Tuck's notes before coding]. The model already has her shape as a function, `C.halfBreadth(x, z)`, so this is a double integral per direction, done once per speed and tabulated.

What comes out of it for free:
- the bow and stern systems and their interference (section 2's three waves), so the pattern changes character with speed;
- the right balance between the long transverse waves and the short divergent ones (at low Froude number the divergent ones dominate what is seen);
- **a test that is not about looks:** the same spectrum gives her wave resistance, `Rw = (pi / 2) rho U^2 times the integral of |A|^2 cos^3(theta)` (Havelock) [B: constant from memory]. The motion model already carries a wave resistance (Holtrop's, `SHIP.resist` in `core/motion.js`). The two must agree within the known error of thin-ship theory, about a factor of 1.5 for a hull this full [B]. Abacus's `num.integrate` certifies the integral. If the wake's energy and the engine's drag disagree by ten, one of them is wrong.

Spreading replaces fading. From stationary phase, a wave's height falls as distance^(-1/2) inside the wedge and as distance^(-1/3) along the cusp lines [B: standard result, from memory], which is why the cusps are what a far observer sees. Viscosity does nothing to 57 m waves in any time that matters, so `tauWaves: 150` should go.

### 3.2 A surface, not lines
The sum above is a height field. With heights come slopes, and slopes are what the eye uses: the stars' reflections wobble, her own lights lay broken paths on the water, the crests catch the foam. On the night of 14 April the sea was flat calm, so her wake was the only relief on it for miles, which makes this more visible in this simulator than it would be in any other.

### 3.3 The turn
Three separate effects, all from numbers `core/motion.js` already has (surge u, sway v, yaw rate r, rudder angle, shaft speeds):

1. **The path bends the far wake.** Already there.
2. **The hull moves partly sideways.** At station x along her the water meets her at the local drift angle `atan((v + r x) / u)`. Each section then acts as a source of strength set by the hull's slope, as before, plus a cross-flow term set by that drift. The side toward which the water pushes throws the bigger wave: in a turn to port the starboard bow wave grows and the port one shrinks, and the stern, swinging outward, throws its wave to the outside. This is what makes a turning ship's wake look lopsided rather than merely curved.
3. **The white wake starts where the stern is, pointed where the screws and rudder send it.** The stern runs outside the path of her middle. The race from the screws leaves along the shafts and is turned by the rudder. The inner screw in a turn works in slower water. The page already lays its samples at the screws; the deflection and the per-screw strength are new.

Also from speed alone: she loses speed in a turn, so the waves made in the turn are shorter than those made before it, and the pattern shows the turn's history as a change of texture.

### 3.4 The near field
- **Bow wave.** A simple published relation gives its height from speed, draught and the bow's entrance angle (Noblesse and others, JFM 2008) [B: recalled as `Zb = (2.2 / (1 + Fd)) (tan a / cos a) U^2 / g` with Fd the Froude number on draught]. With a 12 degree half-angle [B] at 22.5 kn it gives about 3 m [D]. It rises with speed squared and collapses below about 10 knots.
- **The profile along her side:** a crest at the bow, about three troughs and crests along her at full speed, a crest at the quarter. It moves the waterline the hull shader draws.
- **Breaking.** Where the bow wave is steeper than a wave can stand it breaks into foam along her forward shoulders: the "bone in her teeth". A threshold on steepness, not a painted strip.

### 3.5 The white wake
- Width: the page's one-fifth power law. A search summary of a wake study gives the total width of a twin-screw wake reaching unity at about four ship lengths, about 1 km [R: search summary, [IAEA INIS record](https://inis.iaea.org/records/twkrs-e9s83/files/DE20K1694.pdf?download=1); not opened].
- Its length is set by bubbles: they are carried down in the screws' race and rise again; one study finds the bubbly wake's length proportional to the screws' rate of turning [R: search summary, ["Le sillage de bulles des navires", HAL](https://hal.science/hal-03362142v1/preview/bitstream_22958.pdf)]. So the white wake should be driven by the shafts' rpm from the plant, not by speed: a ship coasting with stopped engines leaves waves but little white water, and one going astern throws it forward along her sides.
- Its edges roll up into eddies; inside it the short ripples are damped, leaving the smooth slick that outlasts the foam by many minutes.

### 3.6 Things only this simulator has
- **The iceberg.** Her waves reach the berg, reflect and wrap round it; on a flat calm night that is the only water breaking at its foot.
- **After the collision.** She runs on for minutes, down by the head: a deeper, blunter bow at falling speed. The spectrum of 3.1 can be recomputed for the trimmed waterline.
- **Stop and astern.** When she stops, the waves she made keep coming and pass her. The sample method already allows it.
- **The boats.** A wave field with heights could rock a lifeboat or be felt by one; that would be a reader, not appearance.

## 4. Ways to compute it at run time

| | Method | What it handles | Cost | Verdict |
|---|---|---|---|---|
| A | **Heights on today's lines.** Keep the construction; give each crest point the height from `A(theta)` and the spreading law | straight, turns, speed changes; no near field, no berg | small: a table lookup per point | the first step; a day or two |
| B | **Wave packets.** Each step every stretch of hull emits small packets of waves, one set per direction, with the spectrum's amplitude; each packet travels at its own group speed carrying its phase; the surface is their sum, splatted into a height and slope texture ([Jeschke and Wojtan, "Water Wave Packets", 2017](https://history.siggraph.org/wp-content/uploads/2022/06/2017-Real-time-Live-Wojtan_LARGE-SCALE-INTERACTIVE-WATER-SIMULATION-WITH-DIRECTIONAL-WAVES.pdf) showed it live with a thousand boats) | everything in A, plus the hull as a line of sources (interference), drift in a turn, reflection off the berg, stop and astern | thousands of packets: fine in JavaScript; plain data, so deterministic and testable headless | **my pick for the page** |
| C | **A grid in Fourier space.** A square of sea that moves with her; each step every Fourier mode is turned by its own exact frequency (`omega^2 = g k`), and the hull presses on the surface as a moving pressure patch | all linear effects at once, near field included | a 256 x 256 transform per step, a few ms; edges need absorbing; a fixed window of about 2 km | a good cross-check of B; heavier to make deterministic across engines |
| D | **CFD in the loop** | everything, breaking included | not real time on this machine or any laptop | no |

Dispersion matters in all of these: a shallow-water solver (the usual game water) gives waves that all travel at one speed and therefore no Kelvin wedge at all. [Jeschke and Wojtan's 2023 paper](https://research-explorer.ista.ac.at/download/14240/14725/2023_ACMToG_Jeschke.pdf) is about exactly that gap.

## 5. Where FluidX3D fits: offline, as the measuring tank

FluidX3D is on this machine with a built `bin\FluidX3D.exe`. Its `SURFACE` extension is a free surface (volume of fluid), with moving boundaries and a subgrid turbulence model; its shipped setups include breaking waves and a river, but no ship [R: `C:\code\FluidX3D\src\setup.cpp` headers].

**Use: a numerical towing tank, run once, to make and check the run-time model.**

1. Export her hull from `C.halfBreadth` as an STL (the simulator's own form, so the tank and the page agree).
2. Tow it at matched Froude number through a box about 2.5 ship lengths long. Matrix: five speeds (5 to 22.5 kn), drift angles 0, 3, 6, 10 degrees, two or three turn rates, two trims (level, and down by the head as after the ice). Thirty to sixty runs.
3. Take from each run: the wave height map near the hull, a wave cut alongside (from which the real `A(theta)` can be read back, the towing tank's standard "wave cut" method), the bow wave's height, the white wake's width.
4. Use them twice: to **correct** Michell's spectrum where thin-ship theory is weak (a hull this full, and any drift), and to **supply** the near field as a small set of height maps the page blends by speed and drift, joined to the far field of method B.

Limits, said now:
- **The GPU here is an Intel Arc 140V, integrated, sharing the laptop's 16 GB** [M: `Win32_VideoController`]. FluidX3D runs on Arc (its v2.6 notes patch Arc's memory reporting [R: `README.md:59-60`]). At roughly 50 bytes a cell with half-precision storage and the surface [B: from the project's documentation as I recall it], 8 GB holds about 160 million cells: a box of 1024 x 384 x 384 puts 400 cells on her length, 0.65 m each, and 88 cells on a cusp wavelength. Enough for the near field and the first ship length of wake. Each run is hours on this chip [B]; the matrix is days of machine time, unattended.
- **Reynolds number is the model's, not the ship's.** The wave pattern is a gravity effect and scales by Froude number, so it carries over. The boundary layer and the turbulent wake's width do not carry over exactly, as in any towing tank.
- **The licence** [R: `C:\code\FluidX3D\LICENSE.md`]: public research, education or personal use; no commercial use; if results from an altered source are published, the altered source must be published too. So: keep FluidX3D's code out of this MIT repository (a setup file kept beside it, in FluidX3D's own tree or published as the licence asks), and treat the height maps as data made for a personal project. If this simulator is ever sold, the maps have to be remade another way. Fathom's `CLAUDE.md` already says the same of this tool: ideas and numbers, never code.

## 6. Where Abacus fits

- Certified constants and conversions, as in section 2 (18 requests, all enclosed).
- `num.integrate` for the spectrum's integrals and the wave resistance, so the comparison with Holtrop's figure rests on a certified number, not on a quadrature someone eyeballed.
- `root.real` for the stationary-phase points (which waves reach a given spot behind a curved track): every root, with the count certified. That is the hard part of placing crests behind a turn exactly.
- `units.check` on each new formula before it is coded.

## 7. What Cameron had

Cinefex 72 (the Titanic issue) says of one wide day shot, "a high-angle day shot of the ship in a big ocean, with a trail of smoke streaming out and a big wake", that the real ship Lane Victory was filmed and then covered with the CG Titanic, "retaining the wake and water from the original plate" [R: search summary of the [Cinefex 72 scan](https://ia800407.us.archive.org/6/items/cinefex-021/Cinefex%20Magazine%20PDF/Cinefex-072.pdf); the issue itself was not opened]. So at least some of the film's wake was a real ship's, photographed. For the fully synthetic ocean shots Digital Domain used a commercial ocean-rendering package [B: Arete's, from memory; not verified today]. Either way it was rendered offline, shot by shot, for a ship on a fixed course. The thing asked for here, a wake that answers the helm and the telegraph live, is something the film did not need and did not have.

## 8. Tests (causes, not looks)

1. The spectrum's wave resistance against the motion model's, across 5 to 22.5 kn (3.1).
2. Energy: the wave field's energy carried away per second equals `Rw x U`.
3. The cusp at 19.47 degrees and the wavelengths of section 2 measured from the height field, not from the construction that made it.
4. Count the crests along her side at 22.5, 18 and 10 kn: 3, 5, 15.
5. A straight run and its mirror give mirror wakes; a turn does not.
6. Method B against method C on the same manoeuvre.
7. The near-field maps against FluidX3D's runs at speeds and drifts not used to make them.
8. A photograph: Olympic at speed from the air or the quarter, for the bow wave's place and the wedge. One picture judged by measurement, not taste.
9. The watch's fingerprint is the same with the wake as without (it is a viewer's part: it reads and feeds nothing back).

## 9. Recommendation

1. **A now:** Michell's spectrum from her own hull, heights on the existing construction, spreading instead of fading, and test 1. It moves no model number and replaces the one made-up strength with her hull.
2. **Then B** as a new part beside the existing wake, with the surface rendered as slopes: this is the step that makes it look real, and it brings the turn, the berg and the stop for the same price.
3. **Start the FluidX3D matrix in the background as soon as the hull is exported.** It is machine time, not attention, and its results are needed only when B's near field is built.
4. Leave C as the cross-check, and D out.

## 10. Not known

- The constants of the two formulas quoted from memory (3.1, 3.4), and the size of thin-ship theory's error for a hull of her fullness.
- Her bow's entrance angle from the lines plan.
- How fast FluidX3D's free surface runs on this Arc chip, and whether 0.65 m cells hold a 3 m bow wave without smearing it.
- The wake's look by starlight: what a lookout or a man in a boat could in fact see of it. A question for the record, not for CFD.
- What the 1997 film's synthetic water was made with, from the Cinefex issue itself.
