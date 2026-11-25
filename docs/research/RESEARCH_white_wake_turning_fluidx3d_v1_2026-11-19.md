# Her wake beyond the Kelvin pattern: the white wake, the screws' race, the wake in a turn, FluidX3D as a towing tank, and the wake by starlight (v1)

- **Written:** 2026-11-19, 14:13 to 14:50 CST, by a research subagent (Claude Code desktop, Opus 5.5), for `docs/BRAINSTORM_the_wake_computed_v1_2026-11-19.md` sections 3.3, 3.5, 5 and 10.
- **Method:** web search and WebFetch (18 searches, one of them extended; 46 fetches), plus local reading of FluidX3D's `README.md`, `DOCUMENTATION.md`, `LICENSE.md`, the setup headers in `src\setup.cpp` and, for the memory and units, `src\lbm.cpp`, `src\defines.hpp` and `src\units.hpp` (read-only; nothing run or built), and four of this repository's research notes. Arithmetic in one Node script, `C:\temp\titanic-wake-scratch\r9\arith.js`. Nothing downloaded on purpose; no other file touched.
- **Refused or unreadable:** PDFs that came back as binary (the fetch tool kept the bytes in its own results folder; not opened): Reggiannini (OCEANS 2019) https://iris.cnr.it/bitstream/20.500.14243/360165/1/prod_409307-doc_143869.pdf ; Reed and Milgram (2002), "Ship wakes and their radar images", https://zenodo.org/records/1234971/files/article.pdf ; a EURASIP SAR-wake paper https://www.vliz.be/imisdocs/publications/315096.pdf ; a Canadian Acoustics paper by Trevorrow and Vagle https://jcaa.caa-aca.ca/index.php/jcaa/article/download/1847/1594/1984 . Too large for the tool (over 10 MB): the Chalmers thesis https://research.chalmers.se/publication/539403/file/539403_Fulltext.pdf . HTTP 403: apps.dtic.mil (AD1005153), sciencedirect.com (the 2022 IJNAOE paper on turning ships), mdpi.com (Water 16(12):1647), britannica.com, acnpsearch.tweb-dev.unibo.it (Trevorrow 1994's abstract). Other failures: nap.nationalacademies.org (Benilov et al. 2001: a server error; the other addresses gave only the contents page); iwwwfb.org (connection closed, twice); hal.science (bot guard); link.springer.com (login redirect: Yasukawa and Yoshimura 2015); personal.egr.uri.edu (connection refused: O'Reilly et al. 2015); api.semanticscholar.org (HTTP 429, twice); ar5iv has no HTML of arXiv 1001.3352.
- **Tags:** [read] = in a page or local file I opened, asked for the explicit figure (file and line for local files); [read in X] = in a page I opened that quotes or compiles the original; [search summary] = only in a search digest; [textbook] = a standard result stated from memory; [derived] = my arithmetic, shown; [bet] = my judgement; NOT FOUND.
- **Tool caveat:** WebFetch passes each page through a small model. For the figures that matter I asked for the exact numbers and words.
- **Quotes:** modern authors at most one short phrase per source, under 15 words; the 1912 testimony is public domain and is quoted where the words matter.
- **Conventions:** the ship: 269 m long (882.75 ft overall; 850 ft between perpendiculars = 259.1 m), beam B = 28.2 m, draught T = 10.5 m, 52,000 t; wing screws D = 7.2 m, centre screw D = 5.2 m; 75 rpm at 22.5 kn. 1 kn = 0.5144 m/s. x = distance astern of the stern unless stated.
- **Read with:** `docs/BRAINSTORM_the_wake_computed_v1_2026-11-19.md` (the brainstorm), the wave-theory and film/CG notes of the same day, and `core/motion.js` (the fitted turning circle).

## 0. Summary

- **The white wake is three bands with three lifetimes** (1.1): surface foam (white to the eye, about a minute), a bubble cloud (pale water and a sonar target, 7.5-30 min, once 30-60 min), and a slick and thermal wake (tens of km). The theory's exponents: x^(1/5) for a self-propelled ship (momentumless wake), x^(1/3) coasting with stopped screws (drag wake), a jet close astern or from rest [textbook]. The bubble band's width, **W = 1.9 B^0.8 x^0.2 m** [search summary of Zilman et al. 2004], agrees with three independent sets of measurements (Trevorrow 1994, Nylund 2021, the DRDC trials) [derived]. For her: 84 m at one ship length, 109 m at 1 km, 151 m at 5 km. **The page's ribbon (28.6 m at 1 km) is about four times too narrow for that band**, and about right for the foam close astern. The white is driven by the screws' thrust, not by her speed; its lifetime by bubble size (large bubbles rise in seconds, 50-100 um ones stay 15-60 min), by the depth they are carried to (T to 2 T), by the cold, and by surface films (1.6).
- **The race** (2): the efflux formula's 1.59 is sqrt(8/pi), momentum theory at zero advance [derived]. Under way use `V_race = sqrt(Va^2 + (8/pi) KT n^2 D^2)`: at 22.5 kn the race leaves at about her own speed and nearly stands still over the ground (turbulence and air, not a current); from rest at full revolutions it is a 9-13.5 m/s torrent [derived]. Measured zones of flow establishment are 2.5-3.7 D (the repo's 2.6 D is the short end); decay beyond as x^-1; spread about 0.1 x. How far a rudder turns the race: NOT FOUND; bet 0.6 delta, at most 25 deg, centre screw only.
- **A large ship's steady hard-over turn** (3): radius 1.5-2.5 L; drift 4-14 deg at midship and 15-30 deg at the stern; pivot point L/4-L/3 from the bow (L/8-L/3 by source); speed loss 25-50 %; outward heel 2-10 deg. For her: 5-10 deg, 18-25 deg, 4-10 deg of heel at GM 0.8 m [derived]. The look: the stern skids outward, so the white and the bigger waves go to the outside; a smooth swath (the "knuckle") on the inside; shorter waves after the speed loss. The brainstorm's claim that the outer bow wave grows is reversed: the bow's asymmetry is small and favours the inner bow (Conflicts 9).
- **FluidX3D** (4): SURFACE is a single-phase volume-of-fluid free surface with no air, so **no white wake**. Gravity, inflow, outlet, SUBGRID and force measurement all work with it in its own setups; **a moving hull with the free surface is unstable** (the author, issue #86), so the water must move and turns cannot be run. 67 B/cell (79 with forces); about four times the benchmark's memory traffic per step. The Arc 140V benchmarks 1282 MLUPs/s at FP16S (README.md:1356), so about 326 with SURFACE. **Costed example:** 1035 x 448 x 128 cells (59 M, 3.7 GiB), 13,800 steps per pass, 0.7 h per pass and 1.4 h for the two passes the steady pattern needs; the brainstorm's 1024 x 384 x 384 box does not fit the default 7.9 GiB. Three runs (22.5 kn, 18 kn, 22.5 kn at 6 deg drift) take about 5-8 h. Lattice viscosity must stay at or below 1e-3 with SUBGRID, or the waves die within a pass. No free-surface LBM validated on a ship hull was found. Licence: personal, research or education only, no commercial or military use, altered source published with any published results.
- **By starlight** (5): sky about 2e-4 cd/m^2, about 0.001 lx; dark-adapted threshold 0.06-0.13 for large targets [read, derived]. Seen from her own decks looking down, the foam under her stern stood out at contrast +12; beyond about 100 m, or from any low eye, the glassy sea mirrors the sky near the horizon and outshines the foam (contrast -0.6), so far foam would be a darker stripe, and it is gone within about a kilometre at full speed. Her waves would show as bands in the mirrored sky and as broken star reflections, near threshold. Bioluminescence is plausible in water at -0.2 to 0.8 deg C (Svalbard, Cronin et al. 2016) [read]; no 1912 witness mentioned it in her wake. Lightoller expected "a phosphorescent line round a berg" when a swell breaks (BI 13569) and found the sea "Absolutely flat" (13575); Lee saw "no white appearing until it was just close alongside the ship" (2441) [read].

## 1. The white wake: width, growth, persistence, the slick

### 1.1 Three layers, not one

What the page calls "the white wake" is three things with three lifetimes. The measurements below each see one of them, which is why their widths and lifetimes disagree.

| Layer | What it is | How it is measured | Lifetime |
|---|---|---|---|
| Surface foam | large bubbles (radius above about 0.3 mm) and foam at the surface, from the screws' race, the stern wave and the bow wave breaking | eye, daylight photographs | about a minute [derived, 1.6]; no direct measurement found (NOT FOUND) |
| Bubble cloud | small bubbles (tens to a few hundred micrometres) carried down to about the draught by the race and the hull's turbulence, rising slowly | sonar, ADCP backscatter | 7.5 min to 30-60 min (1.5) |
| Slick, scar, thermal wake | a band where turbulence and redistributed surface films damp the short ripples; also mixed (cooler or warmer) water | SAR (the dark centreline), thermal infrared | tens of minutes to hours; tens of km (1.5) |

### 1.2 Width against distance: the theory

Self-similar turbulent wakes [textbook: Tennekes and Lumley, "A First Course in Turbulence" (1972), ch. 4; Pope, "Turbulent Flows" (2000), ch. 5; from memory]. The width l grows and the velocity defect u_s falls as powers of the distance x:

| Case | Conserved quantity | Width l | Defect u_s | When it applies to her |
|---|---|---|---|---|
| Axisymmetric drag wake | momentum deficit (u_s l^2) | x^(1/3) | x^(-2/3) | coasting with the screws stopped (drag only) |
| Plane (2-D) drag wake | u_s l | x^(1/2) | x^(-1/2) | the same, once the wake is flattened against the surface |
| Axisymmetric momentumless wake | none to first order; the next moment (u_s l^4) | **x^(1/5)** | x^(-4/5) | self-propelled at steady speed: thrust equals drag, so the net momentum is zero |
| Plane momentumless wake | u_s l^3 | x^(1/4) | x^(-3/4) | self-propelled, flattened wake |
| Round jet into still water | momentum flux | x (half-width about 0.094-0.11 x) | x^(-1) | a screw turning with the ship at rest; the race just behind the screw |
| Wake with net thrust (accelerating) or net drag (crash stop) | the net momentum | tends to x^(1/3) far astern, with the defect's sign set by the net | | starting, stopping, going astern |

- The momentumless case was measured behind self-propelled bodies by Naudascher (1965, J. Fluid Mech. 22:625) and, in a density gradient, by Schooley and Stewart (1963, J. Fluid Mech. 15:83) [textbook, citations from memory; not opened].
- A ship's wake lies against the surface and is later flattened by stratification, so it sits between the axisymmetric and plane laws. A search summary of Zilman et al. says exactly that: width grows as x^(1/alpha), "alpha may vary between 4 and 5", with 5 a good fit to experiment [search summary].
- Milgram, Skop, Peltzer and Griffin (1993) found the x^(1/5) law in field measurements [search summary, as cited by Benilov et al.]. Nylund et al. (2023) cite the same paper for a decay rate of -4/5 in the wakes of model-scale self-propelled ships in unstratified water, and measured -0.64 in the field [read in Nylund et al. 2023]. -4/5 is the momentumless defect law of the table.
- Field tests on Navy ships found slopes below 1/5 in seven wakes of eight [search summary, probably Golbraikh et al., arXiv 1001.3352; not opened].
- Ermakov and Kapustin (2010) found the width growing as about t^0.4 in the first stage, with constant depth, which they model as diffusion of a layer of turbulent water from a pulsed source [search summary of the abstract and two EGU abstracts]. So close behind the ship the wake spreads faster than any far-field law: it is still a jet and a breaking stern wave there.

### 1.3 Width: what was measured

| Source | Ship and speed | Width | Depth | Tag |
|---|---|---|---|---|
| Trevorrow, Vagle and Farmer (1994), J. Acoust. Soc. Am. 95(4):1922 | three oceanographic vessels, 10 kn | "typical widths of up to 66 m" | 7-12 m | [search summary of the abstract] |
| DRDC sea trials (Trevorrow, 2004, Bedford Basin) | vessels up to 20 kn | up to 5-10 B | up to 2 T | [search summary] |
| Ermakov and Kapustin (2010) | a vessel; currents from an ADCP towed by a motor boat, bubbles acoustically | typical 40-80 m | constant in the first stage | width [read in Nylund et al. 2021]; depth [search summary] |
| Earlier studies together | many | 10-250 m | mostly 6-12 m, two grey reports 18 m | [read in Nylund et al. 2021] |
| Nylund et al. (2021), Ocean Science 17:1285 | merchant ships, median 13 kn (satellite) | thermal wake median 157.5 m (SD 28.6 m) | bubbles: median 11.5 m (deepest 27.5 m) | [read] |
| Nylund et al. (2023), Front. Mar. Sci. 10 | RoPax and tanker (CFD) | side spread about 10 m and 7 m in 30 s | ADCP median about 10-12 m | [read] |
| Somero, Basovich and Paterson (2018), arXiv 1807.00441 | DTMB 5415 at full scale: L 142 m, B 18.9 m, 13 m/s (CFD) | the persistent circulations span 3-4 B at 5-8 km | | [read] |

### 1.4 A working law, checked

A search summary gives Zilman's relation, for a ship with L/B about 10, as **W = 1.9 B^(4/5) x^(1/5)**, W, B and x in metres [search summary; the paper itself (IEEE TGRS 42(10):2335, 2004) not opened, so the constant's units are my reading]. Equivalently W = 3.0 B (x/L)^(1/5) for L/B = 10 [derived]. Checked against the measurements above [derived, `C:\temp\titanic-wake-scratch\r9\arith.js` section A]:

| Check | Law gives | Measured |
|---|---|---|
| Trevorrow 1994: B 10-14 m, 10 kn, 7.5 min old (2.3 km) | 56-74 m | up to 66 m |
| Nylund 2021 thermal: B 25-32 m, 5-14 km | 137-205 m | median 157.5 m |
| DRDC 2004: at x = 100 B and 1,000 B | 4.8 B and 7.6 B | up to 5-10 B |

Three independent sets agree within their scatter, so I take the law as the **bubble and turbulent wake's** width. For her (B = 28.2 m):

| x astern | 100 m | 269 m (L) | 1 km | 2 km | 5 km | 10 km | 20 km |
|---|---|---|---|---|---|---|---|
| W | 69 m (2.4 B) | 84 m (3.0 B) | 109 m (3.9 B) | 126 m (4.5 B) | 151 m (5.4 B) | 173 m (6.1 B) | 199 m (7.1 B) |
| The page today, 21 (1 + x/L)^0.2 | 22 m | 24 m | 28.6 m | | 38.1 m | | |

- The law reaches 21 m (the span of the screws' races) at 0.26 m astern: its virtual origin is at the stern, so no start-up length is needed for the bubble wake [derived].
- **The page's ribbon is about four times too narrow for the bubble wake** [derived]. It is about right for the surface foam close astern (1.1), whose width was not found measured (NOT FOUND); [bet] the foam starts at the races' span, about 0.75 B, and spreads to 1.5-2 B within one or two ship lengths, where it dies (1.5).
- Ships differ: Nylund et al. (2021) found that vessel speed and size explain little of the variation in wake longevity [read]. The constant 1.9 should carry a scatter of about plus or minus 25 % [bet, from the spread of the checks].

### 1.5 How long it lasts

| Layer | Lifetime | At 22.5 kn that is | Source | Tag |
|---|---|---|---|---|
| Surface foam (white to the eye) | about 0.5-2 min | 0.35-1.4 km | bubble rise (1.6); no measurement found | [derived, bet] |
| Turbulence (dissipation above background) | median 5 min 59 s; 4 min 30 s in the 2023 data | 3.1-4.2 km | Nylund 2021, 2023 | [read] |
| Strong acoustic scatter from bubbles | about 7.5 min | 5.2 km | Trevorrow 1994 | [search summary] |
| Bubble wake, ADCP | median 9 min 59 s; 9 min 45 s; earlier studies 10-20 min | 7 km | Nylund 2021, 2023 | [read] |
| Bubbles seen (sonar) | 10-30 min, 4-10 km at 12 kn | 7-21 km | Soloviev et al. (2010) | [read in Nylund 2021] |
| Bubbles and temperature detectable | 30-60 min | 21-42 km | NDRC (1946) | [read in Nylund 2021] |
| Microbubbles in suspension, 15 kn | up to 45 min | 31 km | US patent 5787048 | [search summary; a patent, low weight] |
| Thermal wake (satellite) | length median 13.7 km, longest 62.5 km | | Nylund 2021 | [read] |
| SAR wake and its surface-film streaks | "tens of kilometers"; about 7 km in their simulation | | Somero et al. 2018 | [read] |

### 1.6 What sets it

- **Bubble size, through rise speed.** A bubble in sea water is contaminated and rises like a rigid sphere. At 0 deg C [derived, Schiller-Naumann drag, `arith.js` section C]:

| Radius | Rise speed | Time to rise 1 m | 3 m | 10 m |
|---|---|---|---|---|
| 1 mm | 18 cm/s | 6 s | 17 s | 55 s |
| 0.5 mm | 9.3 cm/s | 11 s | 32 s | 1.8 min |
| 0.2 mm | 3.1 cm/s | 32 s | 1.6 min | 5.4 min |
| 0.1 mm | 1.0 cm/s | 1.6 min | 4.8 min | 16 min |
| 50 um | 0.29 cm/s | 5.7 min | 17 min | 57 min |

  Large bubbles make the white; they are back at the surface and burst within one to two minutes even from the screws' depth, so the white dies within a minute or two of the turbulence that keeps drawing them down. Bubbles of 50-100 um carried to 10 m stay for 15-60 min, which is the measured bubble-wake lifetime: they make the pale band seen from the air in daylight, and the sonar target, not the white. Trevorrow et al. found relatively more large bubbles (about 100 um and up) near the wake's centre [search summary].
- **Depth of entrainment.** Bubble wakes reach about the draught (7-12 m, up to 2 T, rarely 18-30 m) [1.3]. Her wing screws, 7.2 m across, reach down to about her keel, so her bubble wake should reach 10-20 m [bet].
- **Water temperature and dissolved gas.** Cold water holds more gas, so a bubble dissolves more slowly and lasts longer [textbook]; at -1 to 0 deg C the bubbles of 14 April lasted longer than in the measured, warmer cases [bet].
- **Surface films.** They stabilise foam and are swept by the wake's circulations into the edge streaks that radar sees (the "railroad tracks") [read in Somero et al. 2018, citing Peltzer et al. 1991; Peltzer et al. 1992, J. Geophys. Res. 97(C4):5579, not opened].
- **Stratification and currents** flatten and shift the wake and can end it early [read in Nylund 2021, 2023].
- **The screws.** A thesis digest says the bubbly wake's length is proportional to the screws' rate of turning ("Le sillage de bulles des navires", HAL hal-03362142) [search summary, quoted from the brainstorm; HAL refused the fetch]. The air is drawn down by the race and by the breaking stern wave; the race's strength is its thrust (section 2). So the white scales with the shafts, not with the speed through the water: coasting with stopped screws she leaves waves and a thin drag wake but little white water; going astern she makes white water forward along her sides [bet, from section 2].
- **Ship size and speed** explain little of the variation in longevity in Nylund's sample [read].

### 1.7 The slick that outlasts the foam

- Behind every ship the short ripples are damped in a band along the track: by the wake's turbulence at first, then by surface films swept into it. Radar sees it as the dark centreline, with bright or dark edge streaks [read in Somero et al. 2018].
- It lasts far longer than the foam: the circulations that maintain it, of a few centimetres a second, take minutes to form and persist for kilometres to tens of kilometres; at 5-8 km they spanned 3-4 beams in the DTMB 5415 simulation [read].
- **On a glassy sea there are no ripples to damp.** On 14 April the sea was "absolutely flat" (Lightoller, section 5), so the slick had no rougher water around it to stand out against. [bet] Her turbulent band would then have been *rougher* than the sea around it (boils and small waves made by the turbulence) for the first minutes, and invisible after that. The page should not draw a slick on a flat calm.

## 2. The screws' race

### 2.1 Its speed

- **The efflux formula's 1.59 is momentum theory.** sqrt(8/pi) = 1.5958 is the fully contracted slipstream speed of an actuator disc at zero speed of advance [derived]. Fuehrer and Roemisch (1977) and Blaauw and van de Kaa (1978) use 1.6 [textbook, from memory; neither opened]. A comparison table in an MDPI paper gives 1.33 for Hamill and 1.59 for Lam [search summary; the table was garbled]. **The repo's 1.59 is right for a screw at rest.**
- **Under way it needs the speed of advance.** The same theory gives the race's speed relative to the ship as

  `V_race = sqrt(Va^2 + (8/pi) KT n^2 D^2)`, with Va = U (1 - w),

  which is the efflux formula when Va = 0 [derived]. With the efflux formula alone the race under way is overstated.
- For her (KT, wake fractions and the power behind them are assumptions [bet]; `arith.js` section D):

| Case | n D | J | KT | Thrust | V_race (rel. ship) | Excess over Va | Race over the ground |
|---|---|---|---|---|---|---|---|
| Wing screw, 22.5 kn, 75 rpm, w = 0.10 | 9.0 m/s | 1.16 | 0.19 | 0.82 MN | 12.2 m/s | 1.7 m/s | 0.6 m/s aft |
| Centre screw, 22.5 kn, 165 rpm, w = 0.25 | 14.3 m/s | 0.61 | 0.11 | 0.62 MN | 11.5 m/s | 2.8 m/s | about 0 |
| Wing screw, from rest, 75 rpm | 9.0 m/s | 0 | 0.40 | 1.72 MN | 9.1 m/s | 9.1 m/s | 9.1 m/s aft |
| Centre screw, from rest, 165 rpm | 14.3 m/s | 0 | 0.35 | 1.98 MN | 13.5 m/s | 13.5 m/s | 13.5 m/s aft |
| Wing screw, from rest, 40 rpm | 4.8 m/s | 0 | 0.40 | 0.49 MN | 4.8 m/s | 4.8 m/s | 4.8 m/s aft |

  Check: the thrusts at 22.5 kn sum to about 2.3 MN; 46,000 shp at a propulsive efficiency of 0.6 gives a resistance of 1.78 MN and, with a thrust deduction of 0.2, a thrust of 2.2 MN [derived, bet on the inputs].
- **Reading.** At full speed the race leaves the screws at about the ship's own speed, so over the ground it nearly stands still: it is a band of turbulence, swirl and entrained air, not a current. From rest at full revolutions it is a torrent of 9-13 m/s. That is why a ship getting under way, or going astern, throws far more white water than one steaming steadily.

### 2.2 Its spread and decay

| Quantity | Value | Source | Tag |
|---|---|---|---|
| Zone of flow establishment (ZFE), German method | 2.6 D | the repo's law; Fuehrer and Roemisch (1977) not opened; one search found no 2.6 | unconfirmed |
| ZFE, the initial zone "normally delimited" at | about 2.5 D | a comparison paper | [search summary] |
| ZFE, measured (Hamill and McGarvey 1996) | 3.05 D, two streams still visible | Coastal Eng. Proc. 25 | [search summary] |
| ZFE, measured at bollard pull with LDA (Lam, Hamill, Robinson, Raghunathan, Song 2012) | 3.68 D, where the two-peaked ring merges into one peak | KSCE J. Civ. Eng. 16(4):465 | [read, abstract] |
| Profile inside the ZFE | a ring of high speed round a slow core behind the hub | Lam et al. 2012 | [read] |
| Decay beyond the ZFE | Vmax proportional to (x/D)^-1, the round jet's law | | [textbook] |
| Coefficients of the decay, by method | Albertson 6.17 with exponent 1; "German method" 0.9 with 0.25; Dutch 1.95 with 1 (as listed; the variables are not clear) | a comparison paper | [search summary; see Conflicts] |
| Twin propellers | Vmax/V0 = 1.8 (x/D)^-0.7 | MDPI comparison table | [search summary] |
| Efflux diameter | 0.71 D | Blaauw and van de Kaa (1978) | [textbook, from memory] |
| Spread of a free round jet | half-width 0.094-0.11 x | Pope (2000) | [textbook] |
| Swirl behind a self-propelled ship (DTMB 5415, CFD) | decays as x^-0.65 until the two races merge near 1 km, then x^-2 | Somero et al. 2018 | [read] |

- With the German ZFE of 2.6 D the race keeps half its efflux speed to 5 D, a quarter to 10 D (72 m for the wing screws) [derived]. With Lam's 3.68 D it keeps 0.74 V0 at 5 D and 0.37 V0 at 10 D [derived]. The repo's 2.6 D is the short end of the measured 2.5-3.7 D; [bet] 3 D is the better single value, and the difference matters less than the speed of advance (2.1).
- Under way the race is a weak jet in a moving stream (excess 15-25 % of Va). It spreads and decays far more slowly than a jet into still water, and merges into the momentumless wake of 1.2 within a few ship lengths [textbook, bet]. The white it leaves is set by the air drawn down, not by its speed.

### 2.3 The rudder

- Her single centreline rudder stands behind the centre screw. The wing screws' races pass outboard of it and are not turned by it [bet, from the arrangement].
- A rudder behind a screw splits and turns the race: Hamill and McGarvey (1996) compared the fields with and without a rudder and found the jet circulating round it, with the flow changed more and more with distance [search summary].
- How far it is turned: NOT FOUND as a measured number. [derived, bet] A momentum balance gives the turned race's angle as tan(theta) = F_N cos(delta) / (rho A_R U_R^2), about 0.5 f_alpha sin(alpha_R) cos(delta), which is near delta itself for the slice of the race that passes the blade; but most of the race passes above, below or beside a blade only one race-width across, so the race as a whole turns by about 0.5-0.8 delta at moderate angles, saturating near 20-25 deg at hard over when the blade stalls.
- When the turbine is stopped (it could not go astern), the rudder has no race of its own and her white wake is the two wing races only [bet; the model already has the turbine's rules].

### 2.4 Starting, stopping, astern

- **From rest:** a jet into still water. Each wing race carries white water aft at about 9 m/s at full revolutions, and a quarter to a third of that 72 m (10 D) astern (2.1-2.2) [derived]. The whole stern churns.
- **Going astern with headway (crash stop):** the reversed races are thrown forward against the stream past the hull. The water heaps and boils at the stern and the quarters, and white water runs forward along both sides as long as the races are faster than her speed through the water [bet]. With sternway the races run forward freely along the hull. The repo has its own experiment on this (`docs/research/experiments/e6_stern_wash_astern.js`), not redone here.
- **Coasting with stopped screws:** a drag wake (x^(1/3), 1.2), the boundary layer's turbulence and the stern wave; little white water. A stopped screw dragging (M7) adds a small wake of its own [bet].

## 3. A big ship's wake in a turn

For the Olympic class the repo already holds the turning record (`RESEARCH_olympic_class_steering_propulsion_trials_v1_2026-11-16.md`, `RESEARCH_handling_consensus_v1_2026-11-16.md`); it is used here only for comparison, not redone.

### 3.1 A large ship in a steady turn, hard over

| Quantity | Large merchant ship | Her (repo, or derived from the repo's numbers) | Source | Tag |
|---|---|---|---|---|
| Tactical diameter | typically 3-4 L; IMO limit 5 L, advance 4.5 L (35 deg rudder) | 3,800-3,900 ft, 4-4.5 L | maritimepage.com; IMO MSC.137(76); repo trials note | [read]; [repo] |
| Steady turning radius | about 0.8-0.9 of half the tactical diameter | 470-530 m, 1.8-2.0 L (on 259 m) | | [bet]; [derived] |
| r' = L/R | 0.4-0.7 | 0.49-0.55 | | [derived] |
| Pivot point, steady turn ahead | "roughly one-quarter to one-third of the length from the bow"; about L/4 aft of the forward perpendicular just after the rudder is laid; about L/8 when accelerating | L/6 (Halpern), L/3 (Brown) | maritimepage.com; a shiphandling slideshow; repo handling note | [read]; [search summary]; [repo] |
| Pivot point, theory | fuller hulls put it nearer the bow; in an unresisting medium 0.33-0.40 L from the bow (box barge to Wigley hull) | | Seo (2016), TransNav 10(4), Table 1 | [read] |
| Pivot point, settling | the ratio v/r that fixes it becomes steady long before the turn does | | Tzeng (1998), J. Mar. Sci. Technol. 6(1) | [read, abstract] |
| Drift angle at midship, beta = atan(x_p/R) | 4-14 deg (R 1.5-2.5 L, pivot L/8-L/3) | 5-10 deg; the repo has 8 deg (Halpern), range 5-12 | | [derived]; [repo] |
| Drift angle at the stern, atan((x_p + L/2)/R) | 15-30 deg | 18-25 deg (pivot L/3 to L/6) | | [derived] |
| Drift angle at the stem, inward, atan((L/2 - x_p)/R) | 3-12 deg | 5-10 deg | | [derived] |
| Speed loss | "40 percent or more" with a large drift angle; full-form ships up to about half | the model's own (`core/motion.js`), not redone; [bet] 25-40 % for a fine liner | Britannica; maritimepage.com | [search summary]; [read] |
| Heel | inward at first, then outward, growing with speed and with a tighter turn | tan(phi) = U^2 (KG - T/2) / (g R GM): 4-10 deg outward at 12-18 kn in the turn with GM 0.8 m and KG - T/2 about 8.5 m; 3.6 deg at GM 1.5 m | maritimepage.com; formula from the repo's breach note | [read]; [textbook, unverified]; [derived] |

`arith.js` section E holds the grid of drift angles behind the "4-14 deg" and "15-30 deg".

### 3.2 What the turn does to the water

Over her length the local drift runs from 5-10 deg inward at the stem to 18-25 deg outward at the stern (pivot at L/6 to L/3 from the bow, R about 2 L) [derived]. Forward of the pivot point the outer bow is the suction side; aft of it the outer side is the pressure side [repo: `RESEARCH_breach_inflow_at_speed_v1_2026-11-16.md:293-294`]. So:

- **The outside of the turn gets the big wave and the white water.** The stern skids outward at 18-25 deg, pushing water out: the quarter and stern waves grow on the outside and the race is thrown across the stern's path [derived, bet]. The bow's asymmetry is smaller (5-10 deg of local drift, over the short length forward of the pivot point) and favours the inner bow [derived]; see Conflicts on the brainstorm's 3.3.
- **The white wake is laid by the stern and smeared outward.** The races leave along the shafts while the stern moves at 18-25 deg to them, so the white band is laid on a wider circle than the bow's track and spread across it: a race 100 m long covers a band 30-40 m wider than on a straight run [derived].
- **Inside the turn, a smooth patch.** Seamen call the disturbed but wave-free water left where a turn began the "knuckle" and use it as a mark [textbook, seamanship; NOT FOUND in a source this session]. [bet] It is the swath the skidding hull swept, about L sin(beta_stern), 80-110 m wide, on the inside of the turn.
- **The waves made in the turn are shorter.** Wavelength goes as U^2: a speed loss of 20, 30 and 40 % shortens her transverse waves from 85.8 m to 55, 42 and 31 m [derived]. The pattern records the turn as a change of texture, as the brainstorm said.
- **On 14 April:** Scarrott, on the forward well deck, saw it as the berg went by: "Her stern was slewing off the iceberg", and "the starboard bow was going as if to make a circle round it" (BI 355) [read]. That is the stern's outward skid seen from the ship.

SAR or aerial studies of turning ships' wakes: one exists ("Detection of ships moving in a straight line and turning", Int. J. Nav. Archit. Ocean Eng., 2022), but ScienceDirect refused the fetch; its findings are NOT FOUND here.

## 4. FluidX3D as a towing tank with a free surface

Read locally (nothing run or built): `C:\code\FluidX3D\README.md`, `DOCUMENTATION.md`, `LICENSE.md`, the setup headers in `src\setup.cpp`, and, for the memory per cell, `src\lbm.cpp`, `src\defines.hpp` and `src\units.hpp`.

### 4.1 What SURFACE is

- A free-surface lattice Boltzmann method: volume of fluid, with an analytic PLIC for the curvature, in four kernels beside the main one (README.md:473-477) [read].
- **Single phase.** Cells are fluid, interface or gas; the interface is one cell thick; "Gas cells are not simulated at all and are essentially treated as vacuum" (DOCUMENTATION.md:464) [read]. The FAQ: FluidX3D cannot model water and air at the same time; droplets down to about 3 cells are resolved (README.md:1902) [read].
- Surface tension is a constructor argument, sigma, at most 0.1 in lattice units (DOCUMENTATION.md:464, 527) [read]. At 0.65 m cells it is irrelevant (the capillary length of water is about 2.7 mm) [derived]: sigma = 0.

### 4.2 What works together with it

| Extension | Use for a towed hull | Works with SURFACE? | Evidence | Tag |
|---|---|---|---|---|
| VOLUME_FORCE | gravity | yes | dam break, river, breaking waves, hydraulic jump (`setup.cpp:954, 1014, 1070, 1109`) | [read] |
| MOVING_BOUNDARIES as inflow | the stream past the hull | yes: solid cells with a velocity and a layer of fluid cells beside them | DOCUMENTATION.md:296, 471; hydraulic jump `setup.cpp:997-999` | [read] |
| MOVING_BOUNDARIES as a moving hull | towing the hull through still water | **no**: re-voxelising moving geometry with the free surface "becomes unstable" (the author's answer in GitHub issue #86, 2023, as summarised) | github.com/ProjectPhysX/FluidX3D/issues/86 | [read] |
| EQUILIBRIUM_BOUNDARIES | the outlet | yes | hydraulic jump `setup.cpp:1001-1004`; a working community setup (issue #220): bottom solid, other walls equilibrium, hull fixed, water flowing | [read] |
| SUBGRID | Smagorinsky LES, needed for water's real viscosity; no cost | yes | hydraulic jump; DOCUMENTATION.md:488-494 | [read] |
| FORCE_FIELD | force on the hull | yes | "two colliding droplets in force field" `setup.cpp:1297`; but in highly turbulent flow the computed forces come out up to twice too large without a wall function (DOCUMENTATION.md:455) | [read] |
| PARTICLES | passive tracers (a cheap marker for where foam would go) | not shown with SURFACE; single GPU only (`defines.hpp:25`) | | [read]; [bet] |
| Adaptive refinement | finer cells near the hull | does not exist (README.md:1900) | | [read] |
| Symmetry plane, free-slip wall, wave-absorbing boundary | half-width box, beach | none: the boundary types are periodic, solid, equilibrium and moving solid (README.md:1898) | | [read]; [derived] |

### 4.3 Memory per cell (device), D3Q19

From `src\lbm.cpp:38-50` (`bytes_per_cell_device`) and `src\defines.hpp:5-25` [read]: DDFs 19 x 4 B (FP32) or 19 x 2 B (FP16S, FP16C), plus 17 B for density, velocity and flags; SURFACE adds 12 B, FORCE_FIELD 12 B, TEMPERATURE 32 B (FP32) or 18 B (FP16); VOLUME_FORCE, MOVING_BOUNDARIES, EQUILIBRIUM_BOUNDARIES and SUBGRID add nothing.

| Combination | FP32 storage | FP16S or FP16C storage |
|---|---|---|
| Plain LBM (the benchmark) | 93 B | 55 B |
| + SURFACE (with gravity, inflow, outlet, SUBGRID) | 105 B | **67 B** |
| + SURFACE + FORCE_FIELD | 117 B | **79 B** |
| D3Q27 + SURFACE | 137 B | 83 B |

- Host RAM: 17 B (density, velocity, flags) + 4 B (fill level) + 12 B (force) per cell (`lbm.cpp:25-37`). On an integrated GPU the density, velocity and flags buffers are shared between host and device (README.md:197, which cut 72 to 55 B/cell) [read]; whether the fill level and force are shared too is not stated [bet: assume +16 B/cell of RAM].
- Bandwidth per cell and step (`lbm.cpp:51-72`) [derived from read code]: 77 B for the benchmark at FP16; **303 B** with SURFACE (SURFACE forces UPDATE_FIELDS, `defines.hpp:92-94`, plus neighbour flags and the surface kernels); 315 B with FORCE_FIELD; 453 B at FP32. LBM is bandwidth-bound (README.md:537), so SURFACE costs about four benchmark steps per step.

### 4.4 Speed: the benchmark rows

README.md:1146 gives the table's columns; the benchmark is D3Q19 SRT with no extensions in an empty cube of about 256^3 (README.md:532) [read].

| Device (README line) | FP32 TFLOPs/s | Mem GB | BW GB/s | FP32/FP32 MLUPs/s | FP32/FP16S | FP32/FP16C |
|---|---|---|---|---|---|---|
| **Integrated, Intel** | | | | | | |
| **Arc 140V (Ultra 7 258V)** (1356) | 3.99 | 26 | 137 | 636 (71 %) | **1282 (72 %)** | 773 (44 %) |
| Arc B390 (Ultra X7 358H) (1355) | 7.68 | 26 | 137 | 807 (80 %) | 1512 (76 %) | 1340 (67 %) |
| Graphics (Ultra 9 285K) (1357) | 2.05 | 25 | 90 | 393 (67 %) | 691 (59 %) | 442 (38 %) |
| Arc Graphics (Ultra 9 185H) (1358) | 4.81 | 14 | 90 | 271 (46 %) | 710 (61 %) | 724 (62 %) |
| Iris Xe Graphics (i7-1265U) (1359) | 1.92 | 13 | 77 | 342 (68 %) | 621 (62 %) | 574 (58 %) |
| UHD Graphics Xe 32EUs (1360) | 0.74 | 25 | 51 | 128 (38 %) | 245 (37 %) | 216 (32 %) |
| UHD Graphics 770 (1361) | 0.82 | 30 | 90 | 342 (58 %) | 475 (41 %) | 278 (24 %) |
| UHD Graphics 630 (1362) | 0.46 | 7 | 51 | 151 (45 %) | 301 (45 %) | 187 (28 %) |
| UHD Graphics P630 (1363) | 0.46 | 51 | 42 | 177 (65 %) | 288 (53 %) | 137 (25 %) |
| HD Graphics 5500 (1364) | 0.35 | 3 | 26 | 75 (45 %) | 192 (58 %) | 108 (32 %) |
| HD Graphics 4600 (1365) | 0.38 | 2 | 26 | 105 (63 %) | 115 (35 %) | 34 (10 %) |
| **Integrated, AMD** | | | | | | |
| Radeon 8060S (Max+ 395) (1350) | 29.70 | 15 | 256 | 1231 (74 %) | 2541 (76 %) | 2563 (77 %) |
| Radeon 780M (Z1 Extreme) (1351) | 8.29 | 8 | 102 | 443 (66 %) | 860 (65 %) | 820 (62 %) |
| Radeon Graphics (7800X3D) (1352) | 0.56 | 12 | 102 | 338 (51 %) | 498 (37 %) | 283 (21 %) |
| Radeon Vega 8 (4750G) (1353) | 2.15 | 27 | 57 | 263 (71 %) | 511 (70 %) | 501 (68 %) |
| Radeon Vega 8 (3500U) (1354) | 1.23 | 7 | 38 | 157 (63 %) | 282 (57 %) | 288 (58 %) |
| **Discrete, Intel Arc** | | | | | | |
| Arc Pro B70 (1235) | 22.63 | 32 | 608 | 3366 (85 %) | 6750 (85 %) | 5083 (77 %) |
| Arc Pro B60 (1236) | 12.29 | 24 | 456 | 2540 (85 %) | 5138 (87 %) | 4650 (79 %) |
| Arc B580 LE (1237) | 14.59 | 12 | 456 | 2549 (86 %) | 5153 (87 %) | 4879 (82 %) |
| Arc B570 (1238) | 12.67 | 10 | 380 | 2078 (84 %) | 4186 (85 %) | 4158 (84 %) |
| Arc Pro B50 (1239) | 10.65 | 16 | 224 | 1274 (87 %) | 2559 (88 %) | 2172 (75 %) |
| Arc A770 LE (1240) | 19.66 | 16 | 560 | 2663 (73 %) | 4568 (63 %) | 4519 (62 %) |
| Arc A750 LE (1241) | 17.20 | 8 | 512 | 2555 (76 %) | 4314 (65 %) | 4047 (61 %) |
| Arc A580 (1242) | 12.29 | 8 | 512 | 2534 (76 %) | 3889 (58 %) | 3488 (52 %) |
| Arc Pro A40 (1243) | 5.02 | 6 | 192 | 594 (47 %) | 985 (40 %) | 927 (37 %) |
| Arc A380 (1244) | 4.20 | 6 | 186 | 622 (51 %) | 1097 (45 %) | 1115 (46 %) |
| Iris Xe MAX (1245) | 2.07 | 4 | 68 | 248 (56 %) | 415 (47 %) | 395 (45 %) |

Apple's integrated GPUs are listed at README.md:1341-1349 (M1 GPU 8CU: 384 / 758 / 759).

- The 140V row is this machine's GPU; its 26 GB is the 32 GB part's. The 16 GB parts with the 140V use the same chip and memory bus [bet], so the speed carries over and the memory does not.
- With SURFACE at the benchmark's bandwidth efficiency: 1282 x 77 / 303 = **326 MLUPs/s** [derived]. The surface kernels gather from neighbours and will run less efficiently: [bet] 200-330 MLUPs/s.

### 4.5 The largest grid in 16 GB shared

- The README's own table puts 672^3 cells in 16 GB at FP32/FP16 without extensions (README.md:368) [read].
- Windows lets an integrated GPU use about half the RAM by default [textbook, from memory]: about 7.9 GiB, which holds **127 M cells at 67 B (SURFACE) or 107 M at 79 B (with FORCE_FIELD)** [derived]. If the driver lets it have about 13 GiB: 208 M and 177 M [derived; the 13 GiB is a bet]. The operating system needs the rest; plan on 100 M cells or fewer [bet].
- FluidX3D prints the memory it finds at start and refuses a grid that does not fit, naming the largest that would (`lbm.cpp:789-800`) [read].

### 4.6 SI units when gravity matters

- `units.set_m_kg_s(lbm_length, lbm_velocity, lbm_rho = 1, si_length, si_velocity, si_rho)` fixes the metre, the kilogram and the second (DOCUMENTATION.md:217-224; `units.hpp:9`) [read]. Gravity then enters as a force per volume, `units.f(si_rho, si_g)` (`units.hpp:49`), passed to the constructor as `fz = -lbm_f`, which is what the hydraulic jump setup does (`setup.cpp:977-981, 989`) [read]. `units.hpp` has `Fr()` and `u_from_Fr()` helpers (lines 83, 105) [read].
- **Froude similarity comes free.** Pairing one length and one velocity fixes dx and dt; then g_lbm = g dt^2/dx and u_lbm / sqrt(g_lbm L_lbm) = U / sqrt(g L) [derived]. What must be watched instead are the limits of DOCUMENTATION.md:520-528 [read]: velocity below 0.57 everywhere and ideally about 0.075; viscosity ideally near 1/6, unstable very near 0 unless SUBGRID is on, at most 3; force per volume at most 0.001; sigma at most 0.1. The relaxation time is tau = 3 nu + 1/2 (README.md:314) [read], so in relaxation time the limits read: ideally tau near 1, at most 9.5, and tau close to 0.5 only with SUBGRID [derived].
- For her, 0.65 m cells [derived, `arith.js` section F]: u_lbm = 0.075 gives dt = 4.21 ms and g_lbm = 2.7e-4; u_lbm = 0.1 gives 5.62 ms and 4.8e-4; the force limit allows u_lbm up to about 0.145. Real sea water (1.83e-6 m^2/s) gives nu_lbm = 1.8e-8 and tau = 0.50000005: only SUBGRID keeps that stable.
- **Viscosity kills the waves if chosen for comfort.** A wave's amplitude decays at 2 nu k^2 per step. The community setup of issue #220 used nu_lbm = 0.007 "for stability" [read]; at that value her 57 m cusp waves lose a factor e in about one pass of the box, which erases the Kelvin pattern [derived]. With nu_lbm = 1e-3 (and SUBGRID) they keep it for 7 passes and the 86 m transverse waves for 16; with 1e-4, for 71 and 160 [derived].

### 4.7 The costed example

Her hull at 22.5 kn (11.57 m/s) in a box 2.5 ship lengths long (672.5 m, 1,035 cells) with 0.65 m cells: the hull is 414 cells long, 43 wide and 16 deep; the transverse wave is 132 cells long and the cusp wave 88; the bow wave of about 3 m is 4.6 cells high; a far-field wave 0.5 m high is 0.77 of a cell [derived]. One pass of the box is 58 s of ship time, 13,800 steps at u_lbm = 0.075. The steady pattern fills 2 L behind the bow after about 4 L/U = 93 s (1.6 passes), because the waves' energy falls back at U/2 in the ship's frame [derived]. Water 64 m deep under 19 m of air is deep enough: the transverse wave's pressure is 0.9 % of its surface value at 64 m [derived].

| Box (cells; metres) | Cells | Memory, 67 B / 79 B | s per step at 326 MLUPs/s | One pass | Two passes |
|---|---|---|---|---|---|
| The brainstorm's 1024 x 384 x 384 (666 x 250 x 250) | 151 M | 9.4 / 11.1 GiB: **does not fit 7.9 GiB** | 0.46 | 1.8 h | 3.6 h |
| 1035 x 414 x 128 (673 x 269 x 83) | 54.8 M | 3.4 / 4.0 GiB | 0.17 | 0.65 h | 1.3 h |
| 1035 x 448 x 128 (673 x 291 x 83) | 59.4 M | 3.7 / 4.4 GiB | 0.18 | 0.70 h | 1.4 h |
| 1035 x 585 x 128 (673 x 380 x 83: the whole wedge to the box's end) | 77.5 M | 4.8 / 5.7 GiB | 0.24 | 0.91 h | 1.8 h |

At 200 MLUPs/s every time is 1.6 times longer [derived]. The brainstorm's 250 m of depth bought nothing: 83 m is enough, and the cells are better spent on width.

### 4.8 What it cannot do for this

- **No white wake.** No air, no bubbles, no entrainment (README.md:1902) [read]. Everything in section 1 stays empirical.
- **No moving hull, so no turn.** The hull must stand still in a stream (4.2). A steady turn needs a rotating frame, with centrifugal and Coriolis forces on every cell; FORCE_FIELD can hold a per-cell force, but the Coriolis force depends on each cell's velocity at every step, which means changing the kernels [derived, bet]. Drift angles can be run (the hull yawed in the stream); turns cannot.
- **No trustworthy resistance.** No wall model; forces up to twice too large (DOCUMENTATION.md:455; the author in issue #127) [read]. The waves are gravity's and carry over; the drag does not.
- **Coarse.** No refinement (README.md:1900): divergent waves at 72 deg (8.2 m) get 13 cells, and wave heights under a cell are carried only through the fill level [derived].
- **Reflecting walls.** No absorbing boundary: the wedge reflects off the side walls unless the box is wide enough (the 380 m box) or a damping zone is written into the source [bet].
- **Model-scale turbulence.** The boundary layer and the turbulent wake's width do not scale (brainstorm, section 5).

### 4.9 Published validations of free-surface LBM for ships

- **ELBE** (TU Hamburg; a GPU lattice Boltzmann code with a volume-of-fluid free surface and LES): validated on an advancing surface-piercing hydrofoil against new laboratory measurements (O'Reilly et al., FAST 2015), and coupled to a potential-flow solver for naval hydrodynamics (Nantes 2015/16; ISOPE 2017) [search summary; the PDF host refused the connection]. A paper on GPU grid refinement for free-surface LBM "dedicated to... marine applications" exists [search summary].
- Janssen and Krafczyk, "Free surface flow simulations on GPGPUs using the LBM", Comput. Math. Appl. 61 (2011) [search summary; title only].
- **A free-surface LBM validated on the Wigley hull or the KCS, for wave pattern or wave resistance, with its resolution: NOT FOUND** (two web searches, one arXiv API query with no match; Semantic Scholar refused with HTTP 429).
- For scale: finite-volume CFD validates the KCS's resistance, sinkage and trim routinely (Gatin, Vukcevic and Jasak), and the KVLCC2's waves are under 1 % of Lpp high, a hard test for any free-surface method [search summary, arXiv 2405.20958].
- The author has no ship-hull sample (issue #127) [read].

### 4.10 The licence in three lines

1. Free for public research, education or personal use; no commercial use, sale, or paid service built on it; no military use; no training AI models on its source (LICENSE.md:3-8) [read].
2. If binaries, data or results made with an altered source are published, the altered source must be published too (LICENSE.md:9) [read].
3. Keep the notice; cite the listed papers in any scientific publication; German law applies (LICENSE.md:10-15) [read].

## 5. Seeing her wake at night

### 5.1 The light and the eye

| Quantity | Value | Source | Tag |
|---|---|---|---|
| Illuminance, moonless clear night sky with airglow | 0.002 lx | Wikipedia, "Lux" | [read] |
| Illuminance, moonless overcast night (starlight) | 0.0001 lx | same | [read] |
| Quarter moon; full moon | 0.01 lx; 0.05-0.3 lx | same | [read] |
| Luminance of a truly dark sky | about 2e-4 cd/m^2 (21.83 mag/arcsec^2); the darkest skies about 1.71e-4 (22) | Crumey (2014), "Human contrast threshold and astronomical visibility", arXiv 1405.4209 | [read] |
| mag/arcsec^2 to cd/m^2 | mu_V = -2.5 log10(B) + 12.58 | Crumey | [read] |
| Dark-adapted threshold contrast, large target | 0.069 at 1e-4 cd/m^2; 0.129 at 1e-5 and below (his Eqs. 35, 52); 0.057 at 2e-4 | Crumey | [read]; the last [derived] |
| The night of 14-15 April 1912 | "A clear, starry night overhead", "There was no moon" (Lee, BI 2401-2402) | titanicinquiry.org | [read] |
| The moon | new on 17 April 1912 (the day of a solar eclipse), so a thin crescent rising near dawn | | [textbook] |
| Reflectance of fresh white foam | about 0.5 (0.3-0.6) | Whitlock and others (1982), from memory | [textbook, unverified] |

A uniform sky of 2e-4 cd/m^2 gives pi x 2e-4 = 6.3e-4 lx on a horizontal surface; with the stars and the Milky Way, 0.0006-0.002 lx [derived]. Foam then has a luminance of R E / pi = 1e-4 to 3e-4 cd/m^2, 1.6e-4 for R = 0.5 and E = 0.001 lx [derived].

### 5.2 Foam against a mirror sea

A flat calm sea is a mirror: its luminance is the Fresnel reflectance at the viewing angle times the sky it reflects. Looking steeply down, it reflects a few per cent of the dark zenith; at grazing angles it reflects most of the brighter sky near the horizon. [derived, `arith.js` section G; the sky's brightening toward the horizon, from 2e-4 cd/m^2 above 30 deg to 5e-4 at the horizon, is a bet]:

| Viewpoint | Depression | Fresnel reflectance | Sea, cd/m^2 | Foam, cd/m^2 | Contrast of foam | Seen? |
|---|---|---|---|---|---|---|
| Her after deck, about 15 m up, wake 25 m astern | 31 deg | 0.057 | 1.2e-5 | 1.6e-4 | +12 | plainly, as a grey-white band |
| The same, 100 m astern | 8.5 deg | 0.41 | 1.7e-4 | 1.6e-4 | -0.06 | no: the foam vanishes against the sea |
| Boat deck, about 20 m up, 500 m astern | 2.3 deg | 0.78 | 3.7e-4 | 1.6e-4 | -0.57 | as a darker stripe, if foam were still there |
| Crow's nest, about 29 m up, 2 km astern | 0.8 deg | 0.91 | 4.5e-4 | 1.6e-4 | -0.65 | the same; but the foam is gone by then (1.5) |
| A lifeboat, eye 1 m up, 100-500 m off | 0.1-0.6 deg | 0.94-0.99 | 4.7-4.9e-4 | 1.6e-4 | -0.66 to -0.68 | a dark stripe |

Thresholds are 0.06-0.13 for large targets (5.1), so every row except the crossover near 100 m is above threshold for a large patch of foam. Near her stern the foam was lit by her own lights in any case: the deck lights and hundreds of lit ports put far more light on the water than the 0.001 lx of the sky [bet].

### 5.3 Her waves against a mirror sea

- At a grazing view of 0.6-3 deg, a wave slope of 0.02-0.05 changes the Fresnel reflectance of the facets facing the viewer by a factor 0.74-0.88 and of those facing away by 1.06-1.36 [derived]. That is a contrast of 0.1-0.35 in long bands, above the 0.06-0.13 threshold: **her Kelvin waves would have been visible from a boat or her decks as moving bands of lighter and darker reflected sky, and above all as stars' reflections breaking up and dancing** [derived; whether anyone looked is another matter].
- The witnesses' sea was exactly that mirror: Lightoller, "you could see the stars rising and setting with absolute distinctness" (BI 13616) [read].

### 5.4 Bioluminescence in cold water

- **Plausible at -2 to 0 deg C.** In Kongsfjord, Svalbard, in January, with the water at -0.2 to 0.8 deg C, mechanically stimulated bioluminescence was measured from the surface down: dinoflagellates (*Protoperidinium*) dominated at 1-20 m, the copepod *Metridia longa* at 40 m and below; the potential peaked at 6.2e13 photons per m^3 at 80 m (Cronin et al. 2016, Sci. Rep., PMC5090458) [read]. Berge et al. (2012) first reported zooplankton bioluminescence in the Arctic polar night [search summary]. *Metridia longa* lights when disturbed and lives in the sub-Arctic, the Arctic and the North Atlantic (Wikipedia) [read]. The Labrador Current brings Arctic water and plankton onto the Grand Banks [textbook].
- How bright a stirred wake would be [derived, bet on every input; `arith.js` section H]: with a potential of 1e11, 1e12 or 1e13 photons per m^3 in the top 5-10 m, released within 1-3 s of the screws passing, the surface glows at about 4e-5, 4e-4 or 4e-3 cd/m^2 (scotopic), against a sky of 2e-4. At the middle value the wake would be the brightest thing on the sea.
- **The 1912 record.** Lightoller expected phosphorescence where a swell breaks on ice: "you will always see at nighttime a phosphorescent line round a berg, growler, or whatever it may be" (BI 13569) [read]. So officers on that route knew it well. That night the sea did not break on the berg (5.5), and **no witness who spoke of phosphorescence in her wake, at her bow or round the boats was found** (NOT FOUND; a targeted search of titanicinquiry.org returned none).

### 5.5 What the witnesses said of the water (1912 testimony, public domain)

- Lightoller, British Inquiry, day 11 [read, https://www.titanicinquiry.org/BOTInq/BOTInq11Lightoller02.php]:
  - "No it was calm, perfectly calm." (13571); "Absolutely flat." (13575)
  - "the sea was so absolutely flat that when we lowered the boats down we had to actually overhaul the tackles" (13577)
  - "Yes, quite flat, there is no wind." (13615); the commissioner took "flat calm" to need care, since sailors use it for no wind rather than no swell [search summary of the argument pages].
  - "naturally you would not see the water breaking on it if there were no wind" (13622)
  - ice-blink: a berg will "reflect a certain amount of light" (13570); "the white outline would give us sufficient warning" (13617).
- Lee, lookout, British Inquiry, day 4 [read, https://www.titanicinquiry.org/BOTInq/BOTInq04Lee01.php]:
  - "A clear, starry night overhead, but at the time of the accident there was a haze right ahead." (2401)
  - "And no wind whatever, barring what the ship made herself." (2403); "Quite a calm sea." (2404)
  - "It was a dark mass that came through that haze and there was no white appearing until it was just close alongside the ship, and that was just a fringe at the top." (2441)
- Scarrott, seaman, British Inquiry, day 2: "Her stern was slewing off the iceberg." (355) [read].
- **Her wake or wash: no witness found** (NOT FOUND).

### 5.6 Verdict

- **The white wake close under her stern: yes**, from her own after decks looking down, by starlight alone (contrast about +12) and more so by her own lights.
- **From farther off, no longer white.** At grazing angles the mirror sea outshines the foam, which would show, if at all, as a darker stripe; and the foam was gone within about a kilometre astern at full speed (1.5).
- **Her waves: probably yes for a dark-adapted eye at low height,** as bands in the sky's reflection and as broken star reflections; the lookouts faced ahead, and no one is recorded remarking on it.
- **Bioluminescence: possible, not recorded.** The page should not show it by default.

## 6. Conflicts

1. **The page's white ribbon against the measured wake.** The page draws 21 (1 + x/L)^0.2 m: 28.6 m at 1 km and 38.1 m at 5 km. The bubble and turbulent wake measured by sonar, ADCP and satellite is about 109 m and 151 m there (1.4), four times wider. Resolution [bet]: the page's ribbon is the foam; add the bubble band beside it (8.1).
2. **The exponent.** 1/5 (theory for a momentumless wake; Milgram et al. 1993; Zilman's alpha near 5) against slopes below 1/5 in seven of eight Navy wakes [search summary], t^0.4 in the first stage (Ermakov and Kapustin) [search summary], and a velocity decay of -0.64 measured against Milgram's -4/5 (Nylund 2023) [read]. The 1/5 law fits the three width checks of 1.4, so it stays.
3. **Bubble lifetime:** 7.5 min (Trevorrow 1994) [search summary], median 10 min (Nylund 2021) [read], 10-30 min (Soloviev 2010) [read in], 30-60 min (NDRC 1946) [read in], up to 45 min (a patent) [search summary]. They measure different things (strong scatter, any detectable bubbles, temperature). 8.1 takes 10 min with a range to 30 min.
4. **Zone of flow establishment:** 2.6 D (the repo's German law; not confirmed), about 2.5 D [search summary], 3.05 D (Hamill and McGarvey) [search summary], 3.68 D (Lam et al. 2012, at bollard pull) [read].
5. **The decay law's coefficients.** A search summary lists the "German method" with 0.9 and an exponent of 0.25, against the repo's exponent of -1 beyond 2.6 D. Those may be the German method's seabed-velocity coefficients rather than the axial decay; unresolved (NOT FOUND).
6. **The efflux coefficient:** 1.59-1.6 (momentum theory; Fuehrer and Roemisch; Blaauw and van de Kaa) against 1.33 (Hamill 1987, measured) [search summary]. Momentum theory (2.1) is the defensible choice; Hamill's lower value describes his model propellers' measured maximum on the efflux plane.
7. **The pivot point:** L/4-L/3 (maritimepage.com) [read], about L/4 just after the helm is put over and L/8 when accelerating [search summary], L/6 (Halpern) and L/3 (Brown) [repo], 0.33-0.40 L in an unresisting medium (Seo 2016) [read].
8. **Speed loss:** "40 percent or more" (Britannica) [search summary] against up to about half for full-form ships (maritimepage.com) [read]; consistent if the 40 % is for ships turning with a large drift angle.
9. **The brainstorm's 3.3** says that in a turn to port the starboard bow wave grows and the port one shrinks. With the pivot point at L/6-L/3 from the bow, the stem drifts only 5-10 deg, toward the inside; forward of the pivot point the inner bow is the pressure side [repo breach note, derived]. So the bow's asymmetry is the smaller one and favours the inner (port) bow; the large asymmetry is aft, on the outside, where the stern skids at 18-25 deg. The brainstorm's sentence on the stern ("the stern, swinging outward, throws its wave to the outside") agrees.
10. **The brainstorm's memory figures.** "Roughly 50 bytes a cell with half-precision storage and the surface" and "8 GB holds about 160 million cells" (its section 5): the code gives 67 B/cell (79 with forces), so 7.9 GiB holds 127 M (107 M). Its 1024 x 384 x 384 box (151 M cells) does not fit; a box of 83 m depth does (4.7).
11. **Night illuminance:** 0.002 lx (Wikipedia, moonless clear sky with airglow) [read] against pi x 2e-4 = 6.3e-4 lx from Crumey's representative dark-sky luminance [derived]. The stars and the Milky Way add to the second; 8.5 uses 0.001 lx with the range.

## 7. NOT FOUND

- Milgram, Skop, Peltzer and Griffin (1993): their fitted constants (the paper was not reached; only its exponents, as cited).
- Zilman, Zapolski and Marom (2004): the paper itself, to confirm W = 1.9 B^(4/5) x^(1/5) and its units (the IWWWFB abstract's server closed the connection twice).
- Any measurement of the width or lifetime of the **surface foam** (the white seen by eye) behind a large ship.
- "Le sillage de bulles des navires" (HAL hal-03362142): HAL's bot guard refused the fetch.
- Peltzer et al. (1992), Stanic et al. (2009), Benilov et al. (2001, 23rd Symposium on Naval Hydrodynamics, pp. 687-703): not opened (the NAP reader returned a server error).
- PIANC WG 180 (2015), Fuehrer and Roemisch (1977), Verhey (1983), Hamill (1987): not opened; the German method's 2.6 D and its decay coefficients unconfirmed.
- A measured angle by which a rudder turns a screw's race.
- Principles of Naval Architecture's manoeuvring chapter, Crane's or Barr's turning data, MSC/Circ.1053's notes: not opened; no measured drift angle for a named large ship.
- A written source for the "knuckle" of a turn.
- A SAR or aerial study of a turning ship's wake (the 2022 IJNAOE paper was refused).
- A free-surface LBM validated on the Wigley hull or the KCS, with its resolution.
- How much of the 16 GB this machine's driver gives the GPU (FluidX3D prints it when it starts).
- Any 1912 witness who described her wake or wash, or phosphorescence in her wake or round the boats.
- Beesley's book (not fetched this time; Gutenberg refused it on 17 November).
- A measured reflectance of sea foam (taken from memory).
- Her eye heights (after deck, boat deck, crow's nest): bets, not looked up.

## 8. For the model

Everything here is for the viewer (`site/visuals.js` or a new part); none of it feeds the model. x is the distance along the track astern of where the stern was when the sample was laid; a is the sample's age in seconds; B = 28.2 m, L = 269 m.

### 8.1 The white wake: three bands per sample

| Band | Width | Lifetime (opacity falls as exp(-a/tau)) | Drawn when |
|---|---|---|---|
| **Foam** (white) | `W_foam = max(W_race, 0.5 * W_bub)`; W_race = the races' span at the stern (the page's 21 m, about 0.75 B) | tau_foam = 40 s (range 20-90 s) [bet, from bubble rise, 1.6] | always; this is what the eye sees as white |
| **Bubble band** (pale water) | `W_bub = 1.9 * B^0.8 * x^0.2` metres, plus or minus 25 % (69 m at 100 m, 84 m at L, 109 m at 1 km, 151 m at 5 km) [search summary, checked against three measurements, 1.4] | tau_bub = 600 s (range 450-1,800 s; 30-60 min in one 1946 report) [read] | in daylight or under her own lights; invisible by starlight |
| **Slick** (no ripples) | from W_bub to 3-4 B at 5-8 km [read] | 30 min to hours; tens of km [read] | only when the sea has ripples; never on a flat calm (1.7) |

- Width law by state: steady under power, x^(1/5) as above; coasting with the screws stopped, the drag-wake law x^(1/3), `W = W(x1) * (x/x1)^(1/3)` from the moment the shafts stop, with the foam strength near zero; accelerating or crash-stopping, the near field is a jet (0.1 x half-width, 2.2) and goes over to x^(1/3) [textbook, bet]. Close astern the first stage grows faster (t^0.4, Ermakov and Kapustin) [search summary]; the x^0.2 law already starts at the stern, so no special near law is needed.
- **Strength** (foam opacity at a = 0) from the shafts, not the speed: `S = sum over screws of T_i / T_i,full`, with T_i = rho n_i^2 D_i^4 K_T, so S = 1 at full ahead and 0 with the shafts stopped; add a hull term for the stern wave breaking, `0.2 * (U / 11.6)^2` [bet]. Cap at 1.5 when starting from rest or reversing at full revolutions (the races are 9-13 m/s jets then, 2.1) [bet].
- **Going astern:** lay the foam ahead of the screws, along both quarters, to a distance `(V_race - U_through_water) * a` while the races outrun her; with sternway, along the hull to about midships [bet].
- **Depth** (for any underwater view): T to 2 T [read].

### 8.2 Each screw's race

- Speed relative to the ship: `V_race = sqrt(Va^2 + (8/pi) * KT * n^2 * D^2)`, Va = U (1 - w), w about 0.10 (wings) and 0.25 (centre) [derived from momentum theory; w a bet]. At J = 0 this is the repo's 1.59 n D sqrt(KT).
- Speed over the water behind her: about 0 at steady full speed (the race is turbulence, not a current); 9 m/s (wings) and 13.5 m/s (centre) from rest at full revolutions [derived, 2.1].
- Zone of flow establishment x0 = 3 D (measured 2.5-3.7 D; the repo's 2.6 D is the short end) [read, search summary]; beyond it the excess speed falls as x0 / x [textbook].
- Spread: radius `0.36 D + 0.1 (x - x0)` beyond x0, 0.36 D (the efflux radius) before it [textbook, assembled].
- Rudder: the centre race only, turned by `theta = 0.6 * delta` (0.5-0.8), at most 25 deg [bet]. The wing races go along their shafts; in a turn they are carried outward by the stern's drift. With the turbine stopped there is no centre race.

### 8.3 A large ship's steady hard-over turn

| Quantity | Range | Her, for checking the model (not redone) |
|---|---|---|
| Turning radius | 1.5-2.5 L | 1.8-2.0 L (470-530 m) |
| Drift angle at midship | 4-14 deg | 5-10 deg (the repo: 8) |
| Drift angle at the stern | 15-30 deg | 18-25 deg |
| Drift angle at the stem (inward) | 3-12 deg | 5-10 deg |
| Pivot point from the bow | L/8 (accelerating) to L/3; usually L/4-L/3 | L/6-L/3 |
| Speed loss | 25-50 % (full-form ships up to half) | the model's own |
| Heel, outward (after a brief inward heel) | 2-10 deg | 4-10 deg at 12-18 kn, GM 0.8 m |

Three lines on the look:
1. The stern skids outward at 18-25 deg: the white wake is laid on a wider circle than the bow's track and smeared across it, 30-40 m wider than on a straight run.
2. The outside of the turn gets the bigger quarter and stern waves and the white water; the inside keeps a smooth swath 80-110 m wide where the hull swept (the seaman's "knuckle"); the bow's own asymmetry is smaller and favours the inner bow.
3. She slows, so the waves made in the turn are shorter (U^2): 20-40 % slower means transverse waves of 55-31 m instead of 86 m.

### 8.4 FluidX3D

| | |
|---|---|
| What it is | free-surface LBM, volume of fluid with PLIC, single phase (no air) |
| Works together | gravity (VOLUME_FORCE), inflow (moving solid cells), outlet (equilibrium cells), SUBGRID, FORCE_FIELD, surface tension (not needed): all shown in its own setups |
| Does not | air or bubbles (no white wake); a moving or turning hull with the free surface (unstable); trustworthy drag (up to 2x high, no wall model); refinement; absorbing walls |
| Memory per cell, D3Q19 | 55 B plain FP16 (93 FP32); **67 B with SURFACE**; **79 B with SURFACE and FORCE_FIELD**; FP32: 105 and 117 B |
| Benchmark nearest this machine | Arc 140V: 636 / **1282** / 773 MLUPs/s (FP32 / FP16S / FP16C), 137 GB/s (README.md:1356) |
| With SURFACE | about 4x the traffic per cell: 326 MLUPs/s at the same efficiency, 200-330 expected |
| Largest grid, 16 GB shared | about 127 M cells (67 B) or 107 M (79 B) in the default half of RAM; plan on 100 M or fewer |
| Units | `units.set_m_kg_s(414.0f, u_lbm, 1.0f, 269.0f, 11.57f, 1025.0f)` (the hull's 414 cells are its 269 m), gravity `units.f(1025.0f, 9.81f)` passed as -fz; Froude similarity is automatic; keep u_lbm about 0.075-0.1, g_lbm under 1e-3, nu_lbm at most 1e-3 with SUBGRID (larger values erase the waves) |
| Licence | personal, research or educational use only; no commercial or military use; publish altered source with any published results from it |

**Costed example** (269 m at 22.5 kn; box 2.5 L long; 0.65 m cells): 1,035 x 448 x 128 cells (673 x 291 x 83 m), 59.4 M cells, 3.7 GiB (4.4 with forces); 13,800 steps per pass (u_lbm = 0.075, dt = 4.2 ms, 58 s of ship time per pass); 0.18 s per step at 326 MLUPs/s: **0.7 h per pass, 1.4 h for the two passes the steady pattern needs** (1.1 h and 2.3 h at 200 MLUPs/s). The brainstorm's 1024 x 384 x 384 needs 9.4-11.1 GiB and does not fit.

**The smallest set worth running** (about 5 h of machine time at 326 MLUPs/s, 8 h at 200; unattended):
1. 22.5 kn, straight, level trim, the 380 m wide box (1.8 h): the reference. Take a wave cut alongside at 1-2 B, the bow wave's height, and the surface along 2 L; compare with Michell's spectrum (brainstorm, method A).
2. 18 kn, straight (1.4 h): the change in bow-stern interference (three waves along her becoming five).
3. 22.5 kn at 6 deg drift (1.8 h): the lopsided pattern of a turn, which nothing else here can give.
Below about 15 kn her waves are too short and too low for 0.65 m cells (17 m at 10 kn = 26 cells, heights under a cell); a smaller box with 0.3 m cells would be needed. Turns cannot be run. Keep the setup file outside this MIT repository (brainstorm, section 5).

### 8.5 By starlight

- Foam near the stern, seen from her own decks looking down: visible (contrast about +12 against a threshold of 0.06-0.13), and lit by her own lights anyway.
- Beyond about 100 m, or from any low viewpoint, the calm sea mirrors the sky near the horizon and outshines the foam: draw the far foam (if any is left) **darker** than the sea, not white.
- Her waves: visible as bands in the reflected sky and as broken star reflections, near threshold; draw them through the surface's reflection of the sky and stars, not as lines.
- Default: no bioluminescence; an option at most.
- Numbers to type: sky 2e-4 cd/m^2 at the zenith, rising to about 5e-4 at the horizon [bet]; horizontal illuminance 0.001 lx (0.0006-0.002); foam reflectance 0.5; Fresnel for water with n = 1.34.

### 8.6 The remaining bets

1. The constant 1.9 in W_bub and its units (taken from a search summary; checked against three measurements).
2. The foam band: its width (half the bubble band, never less than the races' span) and its 40 s lifetime; no measurement was found.
3. The strength law (thrust per screw plus a hull term of 0.2 (U/11.6)^2).
4. KT and wake fractions in 2.1 (0.19 and 0.10 for the wings, 0.11 and 0.25 for the centre; 0.35-0.40 at J = 0).
5. ZFE of 3 D; race radius 0.36 D + 0.1 (x - x0).
6. The rudder's deflection of the centre race, 0.6 delta, at most 25 deg.
7. Steady radius 0.8-0.9 of half the tactical diameter; speed loss 25-40 % for a fine liner; KG - T/2 = 8.5 m in the heel formula.
8. The "knuckle" as a swath L sin(beta_stern) wide, and the outside-turn bias of the waves.
9. FluidX3D on this machine: 200-330 MLUPs/s with SURFACE; how much of the 16 GB the driver will give it; a 380 m wide box being wide enough to keep the walls' reflections out of the first 1.5 L of wake.
10. Night: the sky's brightening toward the horizon; foam reflectance 0.5; eye heights (after deck 15 m, boat deck 20 m, crow's nest 29 m).
11. Bioluminescence potential near the surface on the Grand Banks in April (1e11-1e13 photons per m^3).

## 9. Sources

**Local files, read-only** (line numbers as cited in the text):
- `C:\code\FluidX3D\README.md` (59-60, 197, 314, 339-368, 473-477, 482, 530-537, 1146, 1235-1245, 1341-1365, 1898-1906, 1964-1966); `C:\code\FluidX3D\DOCUMENTATION.md` (217-224, 250-254, 280-296, 327-339, 432-455, 462-472, 488-494, 520-528); `C:\code\FluidX3D\LICENSE.md` (1-15); `C:\code\FluidX3D\src\setup.cpp` (setup headers; 954-1010 hydraulic jump, 1014, 1070, 1109, 1297); `C:\code\FluidX3D\src\lbm.cpp` (25-83, 789-800); `C:\code\FluidX3D\src\defines.hpp` (5-25, 71-107); `C:\code\FluidX3D\src\units.hpp` (9, 42-52, 83, 105).
- This repository: `docs/BRAINSTORM_the_wake_computed_v1_2026-11-19.md`; `docs/research/RESEARCH_breach_inflow_at_speed_v1_2026-11-16.md` (288-298); `docs/research/RESEARCH_handling_consensus_v1_2026-11-16.md` (94, 223); `docs/research/RESEARCH_olympic_class_steering_propulsion_trials_v1_2026-11-16.md` (217, 261); `docs/research/RESEARCH_mmg_hull_rudder_propeller_models_v1_2026-11-16.md` (428-429).
- Arithmetic: `C:\temp\titanic-wake-scratch\r9\arith.js` (sections A-H), run with Node.

**Web pages opened** [read]:
- Somero, Basovich and Paterson (2018), "Structure and Persistence of Ship Wakes and the Role of Langmuir-Type Circulations", arXiv 1807.00441: https://ar5iv.labs.arxiv.org/html/1807.00441 (first 100,000 characters)
- Nylund, Hassellov, Tengberg, Bensow, Brostrom, Hassellov and Arneborg (2023), "Hydrographical implications of ship-induced turbulence in stratified waters...", Front. Mar. Sci. 10: https://www.frontiersin.org/articles/10.3389/fmars.2023.1273616/full (first 100,000 characters)
- Nylund, Arneborg, Tengberg, Mallast and Hassellov (2021), "In situ observations of turbulent ship wakes and their spatiotemporal extent", Ocean Sci. 17:1285: https://os.copernicus.org/articles/17/1285/2021/ (Table 1's contents were not in the text)
- Matt, Fujimura, Soloviev, Rhee and Romeiser (2014), Ocean Sci. 10:427 (abstract only): https://os.copernicus.org/articles/10/427/2014/
- Lam, Hamill, Robinson, Raghunathan and Song (2012), "Analysis of the 3D zone of flow establishment from a ship's propeller", KSCE J. Civ. Eng. 16(4):465 (abstract): https://pure.qub.ac.uk/en/publications/analysis-of-the-3d-zone-of-flow-establishment-from-a-ships-propel/
- Hamill and Johnston (1993), "The decay of maximum velocity within the initial stages of a propeller wash", J. Hydraul. Res. (abstract): http://www.iahr.org/library/infor?pid=6234
- Hamill and McGarvey (1996), "Designing for propeller action in harbours", Coastal Eng. Proc. 25 (abstract): https://icce-ojs-tamu.tdl.org/icce/article/view/5562
- Seo (2016), "Safer and More Efficient Ship Handling with the Pivot Point Concept", TransNav 10(4): https://transnav.eu/html,684.html
- Tzeng (1998), "Analysis of the Pivot Point for a Turning Ship", J. Mar. Sci. Technol. 6(1) (abstract): https://jmstt.ntou.edu.tw/journal/vol6/iss1/5
- "Turning Circle of a Ship: Parts, IMO Limits and Key Factors": https://maritimepage.com/turning-circle-of-ship-parts-and-characteristics/
- British Inquiry, 1912: Lightoller, https://www.titanicinquiry.org/BOTInq/BOTInq11Lightoller02.php; Lee, https://www.titanicinquiry.org/BOTInq/BOTInq04Lee01.php; Scarrott, https://www.titanicinquiry.org/BOTInq/BOTInq02Scarrott01.php
- Wikipedia, "Lux": https://en.wikipedia.org/wiki/Lux ; "Metridia longa": https://en.wikipedia.org/wiki/Metridia_longa
- Crumey (2014), "Human contrast threshold and astronomical visibility", arXiv 1405.4209: https://ar5iv.labs.arxiv.org/html/1405.4209 (first 100,000 characters)
- Cronin, Cohen, Berge and others (2016), "Bioluminescence as an ecological factor during high Arctic polar night", Sci. Rep.: https://pmc.ncbi.nlm.nih.gov/articles/PMC5090458
- FluidX3D issues: https://github.com/ProjectPhysX/FluidX3D/issues/86 , /issues/127 , /issues/220 , and the search https://github.com/ProjectPhysX/FluidX3D/issues?q=ship+OR+boat+OR+hull
- arXiv API, two queries for lattice Boltzmann with ship, hull, Kelvin or wave resistance: no relevant entry.

**Search summaries only** (not opened): Zilman, Zapolski and Marom (2004), IEEE TGRS 42(10):2335, doi 10.1109/TGRS.2004.833390, and its IWWWFB 2004 abstract; Milgram, Skop, Peltzer and Griffin (1993), J. Geophys. Res. 98(C4), as cited by Benilov et al.; Trevorrow, Vagle and Farmer (1994), J. Acoust. Soc. Am. 95(4):1922-1930, abstract; the DRDC Bedford Basin trials (Trevorrow, 2004); US patent 5787048; Ermakov and Kapustin (2010), Izvestiya, Atmospheric and Oceanic Physics 46:524-529, doi 10.1134/S0001433810040110, and EGU 2010/2013 abstracts; Golbraikh et al., arXiv 1001.3352 (Navy wakes' slopes); comparison tables of propeller-jet formulas in MDPI papers (https://www.mdpi.com/2073-4441/16/12/1647 and others) and in a German-method comparison; Britannica, "Naval architecture: Maneuverability"; a shiphandling slideshow (pivot point at L/8); Berge et al. (2012), Mar. Biol. 159:231-237; O'Reilly et al. (FAST 2015; ISOPE 2017) on ELBE; Janssen and Krafczyk (2011), Comput. Math. Appl. 61; arXiv 2405.20958 (KVLCC2 wave heights); the British Inquiry's argument pages on "flat calm"; the brainstorm's digest of HAL hal-03362142.

**From memory** [textbook]: Tennekes and Lumley (1972); Pope (2000); Naudascher (1965); Schooley and Stewart (1963); Fuehrer and Roemisch (1977); Blaauw and van de Kaa (1978); actuator-disc momentum theory; the solar eclipse and new moon of 17 April 1912; foam reflectance about 0.5 (Whitlock and others, 1982); Windows' default share of RAM for an integrated GPU.
