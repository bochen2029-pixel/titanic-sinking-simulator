# The physics of a hull falling 3,800 m: forces at any angle, falling regimes, trapped air, the water column, the bed, debris (v1)

- **Written:** 2026-11-19, 13:24 to 14:05 CST, by a research subagent (Claude Code desktop, Opus 5.5) of the coordinating session that is writing the build plan for the descent; "the brief" below is that session's request to this agent. It serves `docs/BRAINSTORM_the_descent_to_the_bed_v1_2026-11-19.md`, section 4 (the physics sketch) and rungs B and C. The wreck and the historical record are R5's, a parallel note by another agent; this note quotes the record only where a physical number needs a check.
- **Method:** web search and WebFetch only: 15 searches and 31 fetches. Nothing was downloaded on purpose and no file in the repository was touched except this note. The arithmetic is in small Node scripts in `C:\temp\titanic-descent-scratch\r6\`:
  - `column.js`: EOS-80, Saunders and Mackenzie;
  - `lamb.js`: spheroid added mass;
  - `fall.js`: terminal speeds, regime numbers, the Munk balance and a glide polar;
  - `pitchplane.js`: a 2-D strip prototype of the fall;
  - `air.js`: Boyle, venting and collapse heads;
  - `bed.js`: the penetration example and closed forms (`bed_debug.js` is its trace);
  - `debris.js`: debris speeds.

  Each result in the note names its script.
- **Refused or unreadable:**
  - PDFs came back as compressed binary. The fetch tool kept copies of three of them in its own tool-results folder by itself, and I did not open them:
    - Chu's `hydro_mine.pdf` at faculty.nps.edu;
    - the EGU 2004 abstract `EGU04-J-00557.pdf` at mirrors.iao.ru, whose HTML page is only a frameset;
    - NACA TN 3038 at ntrs.nasa.gov.
  - Refusals by site:
    - calhoun.nps.edu (IMPACT35, the 2005 experiment) renders as an empty "DSpace" shell;
    - eprints.soton.ac.uk/7897 gave 403;
    - apps.dtic.mil citations gave 403;
    - science.gc.ca (node 417) gave 404;
    - pmc.ncbi.nlm.nih.gov showed a browser check;
    - bvbvf1.bib-bvb.de failed on DNS;
    - RINA's Derbyshire article is for members only.
  - PANGAEA 961181's text file exceeds the tool's 10 MB limit, and its HTML preview stops at 252 m.
  - Not attempted, because they are PDFs:
    - the Hoerner (1965) PDF on a Norwegian university server, which also carries a copyright notice;
    - the Cornell, Cambridge, typeset.io, DTIC and Aalto PDFs;
    - the FLOODSTAND final report.
- **Tags:** [read] = in a page I opened, asked for the explicit figure or formula; [read in X] = in a page I opened that quotes or compiles the original, the original not opened; [search summary] = only in a search digest; [textbook] = a standard result stated from memory, with the textbook where it stands; [derived] = my arithmetic, shown (scripts in `C:\temp\titanic-descent-scratch\r6\`); [bet] = my judgement, no source; [repo] = in this repository's or Fathom's own files; NOT FOUND.
- **Tool caveat:** WebFetch passes each page through a small model. For the figures that matter I asked for the explicit number or formula; punctuation and symbols may be normalised.
- **Quotes:** at most one short phrase per source, under 15 words; everything else is paraphrase.
- **Conventions:** SI throughout, the source's own units beside them. Sea water 1,025 kg/m3 at the surface unless the column (section 5) says otherwise; g = 9.81 m/s2. "Weight in water" W' = (m - rho V) g. The body frame here is the model's ship frame (x forward, y to port, z up); "beam-on" = flow along y, "keel-on" or "deck-on" = flow along z, "end-on" = flow along x. Cd is referred to the area named beside it (frontal, plan or side projected area); a 2-D section coefficient Cd_2D is per unit length, referred to the section's width normal to the flow. Added-mass coefficients k are fractions of the displaced fluid mass rho V (3-D) or of the reference sectional mass (2-D, named).
- **Read with:**
  - the brainstorm above (its section 4);
  - the parallel note on the wreck and the historical record (R5, written by another agent the same day);
  - `RESEARCH_hull_strength_along_length_v1_2026-11-17.md` section 4, for the plating and frame spacing used in section 4.3 here;
  - `RESEARCH_downflooding_stairwells_glazing_v1_2026-11-19.md`, in progress the same afternoon, for the collapse of joiner work and glazing under a head and for air in stairwells;
  - `RESEARCH_handling_consensus_v1_2026-11-16.md`, for the hull's resistance at the surface (`SHIP.resist`);
  - Fathom's `core/ocean.js` and `core/motion.js`, for the column and the 6-DOF step that may be ported.

## 0. Summary

- **She falls flat.** The Munk moment, (k2 - k1) rho V U^2 sin alpha cos alpha, turns any long body broadside to its motion [textbook]; for her pieces it does so from an end-on dive with an e-folding time of 5-12 s at 10 m/s [derived]. In experiments with density ratios from 1.12 to 4.5, elongated cylinders fall broadside, steadily or rocking 10-70 deg about level; only the densest (4.5) tumbled [read: Letessier, Roig and Ern 2025, a confined cell, citing the unconfined Toupoint and others 2019]. Her flooded pieces are 1.24-1.30 times as dense as the water [derived]. A 2-D strip prototype released from 45-80 deg bow down levels every piece within about 30 s and lands it level at 9.3-10.4 m/s, 6.0-6.6 min after leaving the surface [derived]. **Where her weight in water sits along her length (d) does not hold her nose down. It gives her a level glide toward the heavy end**, about 0.3 m/s and 120 m of travel per 1 % of length for the bow piece [derived]. The mine-drop experiments also find the centre of mass's position the governing variable [search summary].
- **The strip forces.** Cross-flow drag on h(n) dx with Cd 0.9 beam-on (0.6-1.2), 1.1 keel-on (0.8-1.4), 1.3 deck-on (1.0-1.6). The surface model's own fitted sway cross-flow coefficient is 0.72 [repo; derived]. Axial Cd 0.25 with a faired end leading (Hoerner's base drag gives 0.17 behind the torn end), 0.95 with the torn end leading. ITTC-57 friction (Cf 1.2-1.45e-3) plus 0.2-0.6e-3. Added mass by strips from 2-D rectangles: 522 t/m in sway and 915 t/m in heave for a 28 x 20 m section. Totals for the whole hull: 133 kt in sway and 234 kt in heave, against her 159 kt with her water. Surge k1 is 0.02-0.17 [textbook (DNV as remembered); Lamb's coefficients computed and tabled]. Kirchhoff's terms carry the Munk moments; they are written out in section 10.2.
- **Speeds against the record.** Flat she falls at 7.4-10.7 m/s (6-8.5 min); on her side 9.5-14.7 m/s; end-on 23-77 m/s (1-3 min) [derived]. The record has the bow striking at about 10 m/s and burying its prow about 20 m (Halpern and Weeks 2011, via Wikipedia) [read in]. That fits the flat fall. The record's "45 deg" and "1 ft in 6" do not describe one steady state (C1).
- **Air** is squeezed by Boyle (V/V0 = 0.091 at 100 m isothermal, 0.18 adiabatic). Her 53,113 m3 stop floating her at 7.5-11.9 m [derived]. A pocket vented above loses tens of m3/s per m2 of opening; through a single opening (counter-current) it is 30-100 times slower [textbook; derived]. Non-watertight doors give at 1.0-3.5 m of head (FLOODSTAND) [search summary]. Decks loaded from below give at about 2-10 m, watertight bulkheads at 8-30 m and the shell at 20-60 m [derived from her plating, bets on her stiffeners]. A tight space failing releases about dp V: 0.3 GJ for 1,000 m3 at 30 m [derived].
- **The column** (EOS-80, checked to 5e-9 against UNESCO's values): in-situ density runs from 1,026.3 kg/m3 at the surface to 1,045.3 at 3,784 m, close to 1,026.3 + 4.97e-3 z. The bed's pressure is 38.47 MPa gauge (3,847 dbar). Sound speed runs from 1,446 to 1,522 m/s [derived]. The temperature profile is a bet; a real deep CTD at the bow exists, PANGAEA 961181 [read].
- **The bed:** s_u = 2 + 1.8 z kPa (s_u0 1-5, k 1.2-2.5), anchored by about 25 kPa at 10-16 m at the site [search summary]. The force law is q = R_f N_c s_u + 0.5 C_d rho_s v^2, with N_c 7.5-9, R_f = 1 + 0.1 log10(gamma_dot / 1e-5), C_d 0.8. **Worked example:** a 16,000 t bow falling at 10 m/s, pitched 15 deg bow down, buries its prow 14 m in the middle case (9-23 m over the ranges). It settles 2-4 deg bow down in 4-5 s at about 0.5 g peak [derived]. The record's 20 m sits in the soft half of the range.
- **Debris:** boilers fall at 7-8.5 m/s and land within about 100 m of the point under the break. Plates fall at 1.7 m/s flat; they tumble (I* 0.19) and glide. Coal falls at 0.55-1.3 m/s, china and shoes at about 0.37 m/s (nearly 3 hours). A 0.05-0.2 m/s current spreads the slow classes over 0.5-2 km [derived; currents a bet].
- **Not found:** the regime maps' numbers, the mine-drop formulas, Hoerner's and DNV's tables, True's constants, other wrecks' descent speeds, and the volumes of her closed spaces (section 9). Most were PDFs the fetch tool returns as binary.

## 1. Forces on a long hull moving through water at any angle (fully submerged)

The fall is deep and slow enough for the water to be unbounded and incompressible: no free surface after the first hull length or so (the wave terms of the surface model are gone), Mach number below 0.03, Reynolds numbers 1e8 to 1e10. Two kinds of force act, and a strip model needs both: **viscous** forces (cross-flow drag, skin friction, end pressure, base drag), quadratic in the relative speed and taken strip by strip; and **inertial (potential-flow)** forces (added mass, and from it the Munk moment and the slender-body lift), which come from the added-mass matrix.

### 1.1 The principles, with their sources

| Quantity | Value or formula (units) | Source | Tag |
|---|---|---|---|
| Cross-flow (independence) principle | the force normal to a long body's axis is set by the velocity component normal to it: per unit length f_n = 0.5 rho Cd_n h V_n abs(V_n), h = the section's width normal to V_n; the axial component adds only friction and end pressure | Hoerner, Fluid-Dynamic Drag (1965), ch. 3, inclined cylinders; Allen and Perkins (1951), NACA Rep. 1048 | [textbook] (neither opened) |
| Finite length | multiply Cd_n by eta(L/h): for circular cylinders about 0.6 at L/h 5, 0.65-0.7 at 10-20, 0.8 at 40, 1 at infinity (subcritical); for a flat plate normal to the flow the 3-D Cd is 1.28 against 1.98-2.05 for the 2-D plate (eta about 0.63) | Allen and Perkins (1951) as reproduced in Jorgensen (1977), NASA TR R-474 and Hoerner (1965); the plate figures from https://en.wikipedia.org/wiki/Drag_coefficient | [textbook] for eta; [read] for the plate's 1.28 and 1.98-2.05 |
| Normal force at any angle of attack | C_N = (A_b / A_ref) sin 2alpha cos(alpha / 2) + eta Cd_n (A_p / A_ref) sin^2 alpha: a potential term plus a viscous cross-flow term (A_b base area, A_p plan area) | Jorgensen (1977), NASA TR R-474 (the method adds "a semi-empirical term representing viscous-separation crossflow" to the potential term, valid to 180 deg) | [read] for the method (https://ntrs.nasa.gov/citations/19770026166); [textbook] for the formula |
| Slender-body (potential) normal force | per unit length f = -(d/dt - U d/dx)(m'(x) w(x)), m' = sectional added mass, w = local normal velocity; steady, at small alpha, the net force is N = m'(x_base) U^2 alpha, acting where m' grows (the nose); zero for a body closed at both ends | Munk (1924); Jones (1946), NACA Rep. 835; Newman, Marine Hydrodynamics (1977), the chapter on slender bodies (section numbers from memory, not given) | [textbook] |
| Low-aspect-ratio lift | C_L = (pi/2) AR alpha on plan area, AR = span^2 / area; for the hull falling flat and moving along her axis, span = B, AR = B / L = 0.10 (whole), 0.20 (bow), 0.25 (stern): 0.16 to 0.40 per radian, small beside the cross-flow term above 10 deg | Jones (1946) | [textbook]; [derived] for the numbers |
| Munk moment | M = (m22 - m11) U^2 sin alpha cos alpha = (k2 - k1) rho V U^2 sin alpha cos alpha, turning the body **broadside** to its motion (destabilising end-on motion; it is why airships need fins) | Munk (1924), NACA Rep. 184; Lamb, Hydrodynamics (1932), the chapter on the motion of solids through a liquid; Newman (1977) ch. 4 | [textbook] |
| The same, in a 6-DOF step | written as M_A nu_dot + C_A(nu_r) nu_r with the Coriolis-centripetal added-mass matrix C_A, whose moment rows hold u w, u v and v w times differences of the added masses (written out with their signs in section 10.2): the Munk moments appear by themselves if C_A is kept | Fossen, Handbook of Marine Craft Hydrodynamics and Motion Control (2011), sec. 6.3 | [textbook] |
| Skin friction | ITTC-57: Cf = 0.075 / (log10 Re - 2)^2, Re = U L / nu; nu of sea water about 1.75e-6 m2/s at 2 deg C (1.19e-6 at 15 deg C); roughness allowance for a 1912 riveted, painted hull about 0.2-0.6e-3 [bet], for example Bowden-Davison dCf = (105 (k_s / L)^(1/3) - 0.64) e-3 gives 0.22e-3 with k_s 150 um | ITTC 1957; ITTC 7.5-02-01-03 (water properties) | [textbook] |
| Base drag behind a blunt (torn) end | C_Db = 0.029 / sqrt(C_Df), both on the base area, C_Df = the forebody's friction drag on that area | Hoerner (1965), ch. 3 (bodies of revolution with blunt bases) | [textbook]; for the bow piece moving bow first: C_Df = 1.31e-3 x 11,400 m2 / 500 m2 = 0.030, so C_Db = 0.17 [derived] |
| Flat end first | a flat-faced cylinder end-on: Cd 0.8-0.9 for L/D 2 to 7; flat disc 1.17; hollow hemisphere, concave side forward, 1.42 (a cup: the torn, open end is between the flat face and the cup) | Hoerner (1965), ch. 3 | [textbook] |
| Vortex shedding | Strouhal number about 0.1-0.2 for bluff rectangles; fluctuating side force coefficient 0.3-1 [bet]; at 9 m/s on a 20-28 m section, about 0.04-0.09 Hz (a period of 10-25 s) [derived] | Bearman and Trueman (1972), J. Fluid Mech.; Blevins, Flow-Induced Vibration (1990) | [textbook] |

**The 2-D sections.** A ship section is a rectangle with two rounded corners (the bilges) and two square ones (the deck edges), with deckhouses on top. Sharp-edged rectangles have drag almost independent of Reynolds number, rising from about 2.0-2.2 when the along-flow side equals the cross-flow side to a peak near 2.8-3.0 when the along-flow side is about 0.6 of it, and falling to about 1.5-1.7 at 1.4 and about 1.2-1.3 at 3 [textbook: Nakaguchi, Hashimoto and Muto 1968; Bearman and Trueman 1972; Hoerner 1965, ch. 3; Delany and Sorensen 1953, NACA TN 3038 for rounded corners]. Rounding the leading corners lowers it strongly at high Reynolds number (a square with a corner radius of a sixth of its side falls from about 1.2 to well under 1 through the critical range) [textbook, same sources]. The **surface model already carries a fitted cross-flow drag coefficient for her hull in sway: 0.72 on L x d** (`core/motion.js:126`, Yoshimura 2009's strip form, `(-0.0591 L/d + 1.848) x fit.cd` with L/d = 259.08 / 9.83 and fit.cd = 2.4774) [repo; derived]. Near the surface the free surface acts as a mirror, so that is a double body of height 2d = 19.7 m and beam 28.2 m, close to the fully submerged hull below its upper decks: it anchors the beam-on value.

### 1.2 Coefficients for the hull's strips (the values to use)

Reference widths: beam-on h = H (keel to the highest continuous deck, the brief's 20 m, plus deckhouses where they stand); keel-on and deck-on h = B (28 m). Each value is the effective (finite-length) coefficient, eta included, so it is used directly in sum(0.5 rho Cd h dx V_n abs(V_n)).

| Strip term | Value | Range | Basis | Tag |
|---|---|---|---|---|
| Cd beam-on (flow across, from the side) | 0.9 | 0.6-1.2 | 2-D rounded-bilge rectangle with along/cross 28/20 = 1.4: 1.2-1.7; times eta 0.65-0.7; the surface model's fitted 0.72 at the low end | [bet], anchored by [repo] |
| Cd keel-on (falling flat, upright: bilges leading) | 1.1 | 0.8-1.4 | 2-D along/cross 20/28 = 0.71, near the sharp-edged peak (2.4-2.8), but with the leading corners rounded: 1.2-2.0; times eta 0.65 | [bet] |
| Cd deck-on (falling flat, capsized: deck edges and deckhouses leading) | 1.3 | 1.0-1.6 | sharp leading corners, the deckhouses as spoilers: 2.0-2.6 x eta | [bet] |
| Cd at a cross-flow direction phi between them | interpolate on the projected width: h(phi) = H abs(cos phi) + B abs(sin phi), Cd(phi) by a smooth blend of the three (for example a Fourier fit through beam-on, keel-on and deck-on) | | the same form the surface model uses for sway | [bet] |
| Axial, faired end first (bow first, or the intact stern first), torn or square end aft | Cd_x = 0.15-0.35 on the section area (0.02 forebody pressure + 0.17 base + friction on top) | | Hoerner base drag (above) | [textbook]; [derived] |
| Axial, torn end first | Cd_x = 0.8-1.1 on the section area, plus friction | | flat face to cup (above) | [textbook]; [bet] for the ragged end |
| Axial, whole hull, either end first | 0.1-0.25 on the midship section, plus friction | | two faired ends; the stern is a counter with screws and rudder, not a streamlined tail | [bet] |
| Skin friction | Cf (ITTC-57) + 0.2-0.6e-3 on the wetted envelope (about 0.85 x 2 (B + H) L) | | at Re 1.5e9-1e10: Cf 1.18e-3 to 1.45e-3 | [textbook]; [derived] |
| Slender-body normal force | m'(x) of the section in the cross-flow direction, through the C_A matrix or the strip form f = -(d/dt - U d/dx)(m' w) | | gives the Munk moment and the lift at a torn trailing end | [textbook] |
| Vortex-shedding side force | optional: C_L' 0.3-1 at St 0.1-0.2, random phase from the seed | | appearance-grade unless validated | [bet] |

### 1.3 Added mass in unbounded water

Lamb's coefficients for a prolate spheroid, computed from the closed forms (alpha0, beta0 of the eccentricity e; k1 = alpha0 / (2 - alpha0), k2 = beta0 / (2 - beta0), k' = e^4 (beta0 - alpha0) / ((2 - e^2)(2 e^2 - (2 - e^2)(beta0 - alpha0)))) [textbook: Lamb 1932, the table of inertia coefficients for prolate spheroids; Newman 1977 ch. 4; the closed form for alpha0 is quoted in arXiv 2007.06228 [search summary]]; they reproduce Lamb's printed table as I remember it (for example 0.210 / 0.704 / 0.240 at L/D 2 and 0.021 / 0.960 / 0.883 at L/D 10) [derived: `C:\temp\titanic-descent-scratch\r6\lamb.js`]:

| L/D | k1 (axial) | k2 (transverse) | k' (rotation) | k2 - k1 (Munk) |
|---|---|---|---|---|
| 2 | 0.210 | 0.704 | 0.239 | 0.494 |
| 4 | 0.082 | 0.860 | 0.608 | 0.778 |
| 5 | 0.059 | 0.894 | 0.700 | 0.835 |
| 6 | 0.045 | 0.917 | 0.762 | 0.872 |
| 7 | 0.036 | 0.933 | 0.807 | 0.897 |
| 8 | 0.029 | 0.945 | 0.839 | 0.916 |
| 9 | 0.024 | 0.954 | 0.864 | 0.929 |
| 10 | 0.021 | 0.960 | 0.884 | 0.940 |
| 12 | 0.016 | 0.970 | 0.911 | 0.954 |

The three bodies, as spheroids of the same section area (a 28 x 20 m box section is 560 m2, D_eq = 26.7 m) [derived]: whole hull L/D_eq 10.1: k1 0.020, k2 0.961, k' 0.885; bow piece 5.2: 0.055, 0.901, 0.717; stern piece 4.1: 0.078, 0.865, 0.621.

A hull is not a spheroid: its sections are rectangles and its torn ends are blunt. Use **strip theory with 2-D rectangle coefficients and the spheroid's k2 as the end correction**:

| Mode | Per metre (or total) | Value for a 28 x 20 m section | Source | Tag |
|---|---|---|---|---|
| 2-D rectangle, motion normal to the side 2a, other side 2b | m' = C_A rho pi a^2; C_A = 1.00 (a/b infinite, a flat plate), 1.14 (10), 1.21 (5), 1.36 (2), 1.51 (1), 1.70 (0.5), 1.98 (0.2), 2.23 (0.1) | | DNV-RP-C205 (2010), Table A-1, after Wendel (1956) | [textbook]: I could not open DNV's document; values as I remember them |
| Sway, beam-on (2a = H = 20, 2b = B = 28, a/b 0.71) | C_A about 1.62; m'_22 = 1.62 rho pi 10^2 | 522 t/m = 0.91 rho A_section | the above | [derived] |
| Heave, keel-on or deck-on (2a = B = 28, 2b = H = 20, a/b 1.4) | C_A about 1.45; m'_33 = 1.45 rho pi 14^2 | 915 t/m = 1.59 rho A_section | the above | [derived] |
| End correction for the whole length | multiply by about the spheroid's k2: 0.96 (whole), 0.90 (bow), 0.87 (stern) | | Lamb, above | [bet]: the usual strip-theory correction |
| Whole hull, totals | m_22 about 133,000 t (1.04 rho V_env); m_33 about 234,000 t (1.83 rho V_env); against her own 159,300 t with the water inside her | | | [derived] |
| Surge (axial) | k1: 0.02-0.07 whole (spheroid to square-ended prism), 0.05-0.13 bow, 0.08-0.17 stern; the square-ended prism values (a x a x b, along b) are about 0.68 (b/a 1), 0.36 (2), 0.24 (3), 0.19 (4), 0.15 (5), 0.13 (6), 0.11 (7), 0.08 (10), on rho a^2 b | | DNV-RP-C205, Table A-2 (as remembered) | [textbook]; the surface model uses 4 % (`core/motion.js:117`) [repo] |
| Pitch and yaw | I_a = integral of m'_33(x) x^2 dx (pitch) and of m'_22(x) x^2 dx (yaw), about the centre, times k'/k2 of the spheroid | | strip theory | [textbook] |
| Roll | about 0.2-0.3 rho pi (B/2)^4 per metre for a rounded rectangle; small beside her own roll inertia with the water in her | | | [bet] |
| Near the bed | the heave added mass of a flat body grows as the gap h closes, to about rho B^3 / (12 h) per metre when h is much less than B (squeeze flow) | | lubrication theory | [textbook]; see section 6.4 |

**Two consequences for the step.** (1) With her water inside her and the water outside, a hull falling flat carries about three times the displaced water's mass (1.24 + 1.83 rho V_env for the whole hull): her acceleration from rest is W' / (M + m_33) = 0.08 g, so she reaches 95 % of terminal speed in about 20 s and 100-150 m [derived]. (2) The added masses differ by a factor of 40-90 between surge and heave, so the C_A terms (the Munk moments) are large: section 2.2.

## 2. How long bodies fall: steady, fluttering, tumbling, gliding

### 2.1 What the regime maps say

| Body family | Control parameters | Regimes, in order of increasing inertia | Source | Tag |
|---|---|---|---|---|
| Disks | dimensionless moment of inertia I* = pi rho_s h / (64 rho_f d) and Reynolds number | steady descent (low Re), periodic fluttering, chaotic, tumbling | Willmarth, Hawk and Harvey (1964), Phys. Fluids 7: the first such phase diagram; Field, Klaus, Moore and Nori (1997), Nature 388 | [search summary] for the regimes (via the Andersen et al. digest); [textbook] for the I* formula; the map's numbers NOT FOUND (abstract pages only) |
| 2-D plates ("falling cards") | I* (about rho_s h / (rho_f l), proportional to the plate's moment of inertia over a fluid cylinder's), thickness ratio h / l, Re | fluttering (side-to-side oscillation) gives way to tumbling (rotation with sideways drift) as I* rises; in a quasi-steady force model the change is a heteroclinic bifurcation with a period diverging logarithmically at it | Andersen, Pesavento and Wang (2005), J. Fluid Mech. 541: 65-90 and 91-104; Belmonte, Eisenberg and Moses (1998), Phys. Rev. Lett. 81: flutter to tumble as the thickness-to-width ratio grows | [read] (JFM abstract page; https://dragonfly.tam.cornell.edu/falling_paper.html); the threshold numbers NOT FOUND |
| The forces on such plates | circulation dominated by a term proportional to the angular velocity, not the translational velocity; torque one to two orders smaller than on a glider at a fixed angle | | Andersen et al. (2005a) | [read] (abstract) |
| Elongated cylinders (L/d 3-20, density ratio 1.12-4.5, Ar 75-720) | elongation, density ratio, Archimedes number | **they fall broadside** (released with the axis horizontal, they stay near it; an end-first release is not reported): rectilinear with the axis horizontal and normal to the path; fluttering with the axis rocking about the horizontal by 10 to 70 deg; an apparently chaotic regime; tumbling only for titanium cylinders (density ratio 4.5) at L/d 5 and 7. Horizontal velocity amplitude reaches the mean fall speed for L/d above 7 | Letessier, Roig and Ern (2025), J. Fluid Mech. 1002 A46 (a confined thin-gap cell), and the unconfined studies it cites: Toupoint, Ern and Roig (2019), J. Fluid Mech. 866; Marchildon et al. (1964); Chow and Adams (2011) | [read] (https://www.cambridge.org/core/product/DFBFE4D0EC293F26B0A7E55BF26805C8/core-reader) |
| The same: frequency of the rocking | f_theta = C sqrt((drho / rho_c) g / L), C about 0.13 in the confined cell, 0.126 for unconfined cylinders at Re 200-6,000 (Marchildon et al.; Chow and Adams) | | same | [read] |
| Mines (cylinders falling through air, water and sediment) | the centre of mass's offset from the centre of volume, L/d, release angle and speed | six observed patterns: straight, spiral, flip, flat, seesaw and combination; **the position of the centre of mass has the largest influence** | Chu, Gilles and Fan (2005), Exp. Therm. Fluid Sci. 29: 555-568; Fan and Chu (2006) (IMPACT35), J. Appl. Mech. 73: 300-314; Chu (2009), Appl. Mech. Rev. 62 | [search summary]; the papers are PDFs I could not read (section "Refused or unreadable"); their coefficient formulas NOT FOUND |

### 2.2 The axes evaluated for her

[derived: `C:\temp\titanic-descent-scratch\r6\fall.js`; rho_f 1,035 kg/m3; the bodies' figures are the brief's rough ones, envelope volumes for the pieces a bet.] Mass with the water in her: M = W' / g + rho V_env.

| | (a) whole hull | (b) bow piece | (c) stern piece |
|---|---|---|---|
| L x B x H (m) | 269 x 28 x 20 | 140 x 28 x 20 | 110 x 28 x 20 |
| W' (t) | 31,163 | 16,000 | 15,000 |
| V_env (m3) | 125,019 [repo] | 60,000 [bet] | 48,000 [bet] |
| M with her water (t) | 159,300 | 77,500 | 64,200 |
| mean density / water's | 1.241 | 1.258 | 1.302 |
| L / D_eq (D_eq 26.7 m) | 10.1 | 5.2 | 4.1 |
| plate I* in the pitch plane (rho_b / rho_f x H / L) | 0.092 | 0.180 | 0.237 |
| plate I* in the roll plane (x H / B) | 0.89 | 0.90 | 0.93 |
| Re of the fall (8-12 m/s on 20-28 m) | about 1e8 | about 1e8 | about 1e8 |
| rocking period, 1 / (0.126 sqrt(drho / rho_c x g / L)) | 94 s | 66 s | 55 s |
| Munk divergence time from end-on at 10 m/s, sqrt(I_total / ((k2 - k1) rho V U^2)) | 11.6 s | 6.2 s | 5.0 s |
| offset of W' along the axis that balances the Munk moment at 10 m/s, alpha 45 deg | 19.9 m (7.4 % L) | 16.7 m (11.9 % L) | 13.3 m (12.1 % L) |

What it means:
- **Density ratio 1.24-1.30 lies between the lightest cylinders tested (1.12 and 1.4), well below the one density (4.5) at which any tumbled; all fell broadside, steadily or rocking** [read; the application to her is my extrapolation from Re about 1e3 to 1e8, a bet]. Tumbling about the long axis is not expected either: the roll-plane I* (about 0.9) is high, but in roll she is a thick body whose potential moment, (m'_33 - m'_22) U^2 sin phi cos phi per metre, turns her broad face (keel or deck) to the flow, and her weight sits low (the loaded ship's KG is 10.8 m, `core/motion.js:29` [repo]), which picks keel-down.
- **End-on is unstable, fast**: from an end-on dive the Munk moment rotates her broadside with an e-folding time of 5-12 s at 10 m/s. Holding a 45 deg attitude steadily would need her weight in water to sit 12-20 m (7-12 % of her length) ahead of her centre of volume against the Munk moment alone [derived].
- **A prototype**: a 2-D strip model of the pitch plane (`C:\temp\titanic-descent-scratch\r6\pitchplane.js`: cross-flow drag by 2 m strips, axial drag, constant added masses with the Kirchhoff terms, the gravity couple, released from rest; no vortex shedding, no circulation, no roll or yaw) [derived]:

| Body, start | W' offset d (% L, + toward the leading end) | first half-minute | At the bed (3,784 m) | Fall | Horizontal travel |
|---|---|---|---|---|---|
| whole hull, from 69 deg bow-down (the model's "Foundered" trim) | -2 / 0 / +2 | dives to 25 m/s nose-down in 20 s, swings through level by 30 s (overshoot to +9 to +15 deg), level after | level, 9.3 m/s vertical | 6.4-6.5 min | -157 / +189 / +533 m |
| bow piece, from 45 or 80 deg bow-down | -5 / 0 / +5 / +10 / +20 | level within about 30 s, overshoot to +17 deg from 80 deg | level, 9.6 m/s vertical, forward drift 1.5 m/s per 5 % L | 6.2-6.6 min | -507 / +47 / +604 / +1,144 / +2,132 m (from 45 deg) |
| stern piece, torn end leading, from 80 or 30 deg down | 0 / +5 / +10 | level within 20-30 s | level, 10.4 m/s vertical | 6.0-6.2 min | about 20 / 450-480 / 860-910 m |

  So in this physics a flooded piece **ends up falling flat at 9-10.5 m/s whatever its starting attitude**, and the offset of its weight in water fixes a forward drift (a level glide held by the Munk moment: u = W' d / ((m_33 - m_11) w), about 0.3 m/s per 1 % of L for the bow piece). The steady glide is level because the axial drag is small beside the normal force: in a steady fall tan(pitch) = C_A / C_N, and C_A / C_N is below 0.1 above 10 deg of angle of attack [derived]. **The quasi-steady model damps the rocking out; real bluff bodies keep rocking** (10-70 deg in the experiments [read]); for her, a mean level attitude with rocking of a few tens of degrees at periods of about one minute is my expectation [bet].
- **A glide polar** for the flat attitude (normal force (pi/2)(B/L) sin alpha cos alpha + 1.1 sin^2 alpha, axial (0.25 A_end + Cf S) / (L B) cos^2 alpha, both on plan area) gives the same picture: at angles of attack of 75-90 deg the path is 75-90 deg below the horizontal at 8.4-9.2 m/s; at 20-30 deg it would glide 6-8 km at 26-34 deg below the horizontal [derived: `fall.js`]. The record's figure of about 1 ft forward for 6 ft down for the bow (below) is a path about 80 deg below the horizontal: the high-alpha, near-flat branch, a W' offset of about 5 % of L in the prototype [derived].

## 3. Sinking speeds of real ships and large objects (checks)

| Case | What is known | Source | Tag | Use as a check |
|---|---|---|---|---|
| Titanic, bow | about 140 m (470 ft) long; went down at about 45 deg, drifting about 1 ft forward for every 6 ft of descent; struck the bottom at about 20 knots (10 m/s); dug about 60 ft (20 m) into the mud, up to the base of the anchors | Wikipedia, "Wreck of the Titanic", citing Halpern and Weeks (2011), p. 127; the article does not say how the speed was estimated | [read in] https://en.wikipedia.org/wiki/Wreck_of_the_Titanic | impact 10 m/s; path about 80 deg below the horizontal (1 in 6); burial 20 m. The "45 deg" and the "1 in 6" are not one steady glide in section 2's physics: one is an attitude, the other a path. R5 should find what Halpern and Weeks computed |
| Titanic, bow (popular) | about 30 mph (13 m/s), about six minutes to the bed, worded as what reports "would later speculate" | Britannica, via the brainstorm (section 2 there) | [read in] the brainstorm | a band, not a measurement |
| Titanic, stern | about 350 ft (105 m); the 2010 sonar survey showed it "rotated like a helicopter blade" as it sank; the rudder swung to about 30-45 deg so the stern followed a tight spiral (Pellegrino 2012, p. 107); the rudder is buried to about 50 ft (15 m) (Pellegrino, p. 108); trapped air imploding as the pressure rose and explosions heard about 10 s after the stern went under are both marked "citation needed" there | same Wikipedia article | [read in] | the stern buries about 15 m too; a yaw rotation (autorotation) during the fall |
| Titanic, the field | the two pieces about 600 m apart; the boilers about 600 ft (180 m) east of the stern; two debris fields each 600-800 m long trailing south-west from bow and stern (Ballard 1987); water at the wreck about 1-2 deg C (Butler 1998); the site swept by the western boundary current, eddies across the wreck (Gannon 1995) | same | [read in] | the drift budget of section 7 |
| USS Scorpion (1968) | broke in two at an estimated 470 m (1,530 ft) (the 1969 Structural Analysis Group) or about 610 m (2,000 ft) (a Naval Ordnance Laboratory study, uncited there); then fell about 2,700 m (9,000 ft); wreck about 3,000 m; the engine room telescoped about 15 m forward into the hull at the cone-to-cylinder junction; Craven's simulation put the collapse at 90 s against a 91 s acoustic record (uncited) | https://en.wikipedia.org/wiki/USS_Scorpion_(SSN-589) | [read in]; the damage section is uncited there | a closed hull fails in seconds at a few hundred metres and is wrecked internally; descent time NOT FOUND |
| USS Thresher (1963) | collapse at about 730 m (2,400 ft), by Bruce Rule's 2013 reading of SOSUS records (the 1963 estimate 400-610 m); the collapse took about 0.1 s; the wreck lies at about 2,600 m in five main sections; debris field about 134,000 m2 | https://en.wikipedia.org/wiki/USS_Thresher_(SSN-593) | [read in] | implosion is fast (0.1 s) once it starts; descent speed NOT FOUND |
| MV Derbyshire (1980) | wreck at about 4 km, debris over about 1.3 km; the hull twisted and torn apart by implosion and explosion as the pressure rose; her hatch covers were designed for under 2 m of static water (17.1 kPa) against an estimated 20 m (201 kPa) of green water (Smith 2007, which the article flags as perhaps unreliable); RINA's summary: she descended like a submarine and the outside pressure at depth caused a massive implosion | https://en.wikipedia.org/wiki/MV_Derbyshire; RINA, https://www.rina.org.uk/Lessons-from-MV-Derbyshire (members only: search digest) | [read in]; [search summary] for RINA | a hatch cover's design head is 2 m; the depth of the implosion and the descent speed NOT FOUND (the assessors' reports are PDFs) |
| SS El Faro, Bismarck, ARA San Juan, Titan, scuttled reef ships | | | NOT FOUND (not reached within the budget) | |
| DNV-RP-F107 (dropped objects on pipelines) | objects classed by shape (slender or flat; box or round) and weight (under 2 t, 2-8 t, over 8 t); terminal speed sqrt(2 (m - rho V) g / (rho Cd A)); the landing point spread as a normal distribution whose standard deviation is the depth times the tangent of a class "angular deviation", the excursion within which 68 % of a class lands | DNV-RP-F107 (2010), as summarised in search digests; the document needs a DNV login | [search summary] for the 68 % excursion; [bet: from memory] for the rest; its coefficient tables NOT FOUND | the debris classes of section 7 |

**Section 2's numbers against the record:** 9.3-10.4 m/s vertical for the three flooded bodies falling flat, 6.0-6.6 min to the bed [derived], against 10 m/s at impact (Halpern and Weeks via Wikipedia) and "about 13 m/s, about six minutes" (the popular figure). Flat on her side (beam-on, Cd 0.6-1.2) she would fall at 9.5-14.7 m/s; end-on at 23-77 m/s (1-3 min), which no account supports.

## 4. Air in a sinking ship

### 4.1 Compression

| Quantity | Value or formula | Source | Tag |
|---|---|---|---|
| A pocket open at the bottom (its water surface at depth z) | p V^n = constant, p = p_atm + p_gauge(z) (section 5); n = 1 isothermal, 1.4 adiabatic; a pocket squeezed in a minute exchanges little heat at first (n near 1.4), one held for many minutes against cold steel and water tends to n = 1 | ideal gas | [textbook]; the choice of n is a [bet] |
| Air density in a pocket | rho_a = p / (R T), R = 287.05 J/(kg K): 1.3 kg/m3 at the surface, 14 at 100 m, 129 at 1,000 m, 485 at the bed (isothermal, 2 deg C) | | [derived] |
| Lift of a pocket | (rho_w - rho_a) g V_air: the air's own weight is 0.1 % of its lift at the surface, 1.4 % at 100 m, 12.5 % at 1,000 m and 46 % at the bed, where little air is left. Above about 200 bar (2,000 m) air is no longer an ideal gas (compressibility factor about 1.1-1.2 near 400 bar); immaterial, because by then the pockets hold under 1 % of their surface volume | real-gas tables | [derived]; the compressibility factor [textbook] |

V / V0 for a pocket carried down from the surface [derived: `C:\temp\titanic-descent-scratch\r6\air.js`, constant 1,030 kg/m3 column]:

| z (m) | p_abs (kPa) | isothermal | adiabatic |
|---|---|---|---|
| 0 | 101 | 1.000 | 1.000 |
| 7.5 | 177 | 0.572 | 0.671 |
| 10 | 202 | 0.501 | 0.610 |
| 20 | 303 | 0.334 | 0.457 |
| 50 | 607 | 0.167 | 0.279 |
| 100 | 1,112 | 0.091 | 0.181 |
| 500 | 5,153 | 0.020 | 0.060 |
| 1,000 | 10,206 | 0.0099 | 0.037 |
| 3,784 | 38,336 | 0.0026 | 0.014 |

The brainstorm's neutral depth (her 53,113 m3 of air squeezed to the 30,400 m3 that float her) is 7.5 m isothermal; adiabatic it is 11.9 m [derived: (30,400 / 53,113)^1.4 = 0.458 of the surface pressure]. Either way the conclusion stands: trapped air cannot hold a heavy hull once it is ten metres or so down.

### 4.2 Venting and filling

| Process | Formula (SI) | Numbers [derived: `air.js`, Cd 0.6, A = 1 m2] | Source | Tag |
|---|---|---|---|---|
| One-way venting through an opening above the pocket (water enters elsewhere, below) | dp = rho_w g h (h = height of the air above the opening's outside water level); incompressible: Q = Cd A sqrt(2 dp / rho_a), at pocket pressure; compressible: m_dot = Cd A sqrt(2 rho_i p_i (gamma / (gamma - 1)) (r^(2/gamma) - r^((gamma + 1)/gamma))), r = p_o / p_i; choked below r = 0.528: m_dot = Cd A sqrt(gamma rho_i p_i (2 / (gamma + 1))^((gamma + 1)/(gamma - 1))) | at the surface, h = 2 m: 88 m3/s; h = 10 m: choked, 116 m3/s; at 50 m, h = 2-10 m: 42-83 m3/s (260-580 m3/s of free air); at 500 m, h = 5 m: 23 m3/s; the incompressible form is within 10 % except near the surface with h above about 5 m | isentropic nozzle flow; Ruponen (2007) treats air in flooding the same way (ideal gas, Bernoulli across openings with discharge coefficients) [search summary] | [textbook] |
| Filling through the same single opening (air out, water in: counter-current) | Wallis: sqrt(j_g*) + m sqrt(j_f*) = C, j_k* = j_k sqrt(rho_k / (g D drho)), m about 1, C 0.7-1.0 | for equal volumes each way: through a 1 m x 1 m opening 1.0-2.2 m3/s at the surface, 0.6-1.2 m3/s at 1,000 m; through 2 m x 2 m, 3-13 m3/s | Wallis (1969), One-dimensional Two-phase Flow | [textbook]; applying it to a ship's hatch is a [bet] |
| Leakage of "closed" structure | leakage grows with head as doors deform; guideline leakage-area ratios exist for typical ship structures | | Jalonen, Ruponen and others (2017), Marine Structures, "A study on leakage and collapse of non-watertight ship doors under floodwater pressure" (FLOODSTAND) | [search summary]; the ratios NOT FOUND |

So a space's fate depends on its openings: **one opening above and one below**: it vents and floods in about a minute for every few thousand m3 per m2 of opening; **one opening only**: counter-current, 30-100 times slower; **none**: it holds air at about one atmosphere until a boundary fails, the "tight" case.

### 4.3 Failure heads

[derived: `air.js`: a long plate clamped on its long edges collapses plastically (three hinges) at p_c = 4 sigma_y (t/b)^2 and first yields at the edges at half that; a stiffener or beam at spacing s and span l at p_c = 16 M_p / (s l^2) clamped, 8 M_p / (s l^2) simply supported, M_p = Z_p sigma_y [textbook: e.g. Hughes, Ship Structural Design; Jones, Structural Impact]; sigma_y 240 MPa for her mild steel [bet]; membrane action carries a plate two to five times past p_c before it tears [textbook]. Plating and spacing from `RESEARCH_hull_strength_along_length_v1_2026-11-17.md` section 4: shell 1 in (25.4 mm), 0.6-0.7 in at the ends; bulkheads about 0.56 in (14.2 mm, Wilding from memory); frames 24 in at the bow, 27 in at the stern, up to 36 in amidships [repo]. Stiffener and beam sections are bets.]

| Boundary | Collapse head (m of sea water) | Range for a model | Basis | Tag |
|---|---|---|---|---|
| Non-watertight doors (cabin, fire, cold-room) | 1.0-3.5 m (the cold-room door the strongest) | 1-3.5 | full-scale tests and FE, FLOODSTAND (Jalonen et al. 2017) | [search summary] |
| Hatch covers of a 1960s bulk carrier | design load under 2 m (17.1 kPa) | 2-6 (a safety margin over design) | Derbyshire (Wikipedia, citing Smith 2007) | [read in]; the margin a [bet] |
| Deck plating loaded from below (9.5-12.7 mm on beams at 0.91 m) | plate: 10-19 m; but the beams: 1-4 m (Z_p 150 cm3, spans 4-7 m) | 2-10 (pillars and girders shorten the spans) | the formulas above | [derived]; [bet] for the sections |
| Watertight bulkhead (14.2 mm on stiffeners at 0.76 m) | plate 33 m; stiffeners 4-16 m (Z_p 400 cm3, spans 3.5-5 m, simply supported to clamped) | 8-30; loaded from the "wrong" side, with the stiffeners' free flanges in compression, 0.6-0.8 of that | same | [derived]; [bet] |
| Tank top (15.9 mm on floors at 0.91 m) | plate 29 m | 15-30 | same | [derived]; [bet] |
| Shell (25.4 mm on frames at 0.91 m; 16 mm on 0.61 m at the ends) | plate 65-73 m; side frames 14-28 m (Z_p 600 cm3, span 3 m) | 20-60 | same | [derived]; [bet] |
| The design head of her watertight bulkheads | to the bulkhead deck (a head of roughly 10-20 m at the bulkheads) | | Board of Trade practice of the day | [bet]; the 1912 rule's figure NOT FOUND |

### 4.4 Implosion

| Quantity | Value or formula | Source | Tag |
|---|---|---|---|
| Energy released when a tight space of volume V fails at a head difference dp | E about dp V (the work the sea does in filling it; the gas's own share is small at these ratios) | | [textbook] |
| Examples | 100 m3 at 10 m: 10 MJ (2 kg TNT); 1,000 m3 at 30 m: 0.3 GJ (72 kg); 5,000 m3 at 30 m: 1.5 GJ (360 kg); 10,000 m3 at 50 m: 5 GJ (1.2 t) [TNT 4.184 MJ/kg] | | [derived]; compare the bow's 3.9 GJ of motion at the bed (section 6) |
| Duration | about 0.1 s for Thresher's hull | Wikipedia, citing Rule (2013) | [read in] |
| What it does | Scorpion's engine room telescoped about 15 m into the next space | Wikipedia | [read in] |

### 4.5 Which of her after spaces could hold air

From the brief's list; the structure is from the repo's notes and the record, the verdicts are mine. **No source gave volumes (NOT FOUND)**.

| Space | Openings it would have had | Fate in the model | Tag |
|---|---|---|---|
| Refrigerated provision rooms and cargo hold (G deck, orlop, aft), insulated, with heavy doors | doors only; insulation and cork are buoyant solids as well | tight until the doors give: the cold-room door is the strongest non-watertight door (1-3.5 m) | [bet], with the door head [search summary] |
| Shaft tunnels | a watertight door forward, the escape trunk | tight if both were shut: fails with the tunnel's plating and stiffeners (tens of metres) | [bet] |
| After peak tank | a closed tank (vents and sounding pipes) | holds what was in it; if empty, air at 1 atm behind tank plating: 15-30 m | [bet] |
| Double-bottom tanks | closed tanks, vented by small pipes | as the after peak; the small vents (a few cm) let air out slowly | [bet] |
| Boilers (if any lie in the stern piece) | closed pressure vessels; corrugated furnaces built against outside pressure | the strongest closed volumes: hundreds of metres [bet]; steam condensing in cold water lowers their inside pressure | [bet] |
| Main condensers, low-pressure turbine casing | built for vacuum inside (one atmosphere outside) | fail within the first tens of metres once their connections hold | [bet] |
| Upper 'tween decks, cabins, public rooms | doors, ports, stairwells, skylights | vent and flood as she tilts; joiner work gives at 1-3.5 m | [search summary] for the head; [bet] |

## 5. Sea water with depth at 41.7 N 49.9 W in April

### 5.1 The laws, and where they stand

| Quantity | Value or formula (units) | Source | Tag |
|---|---|---|---|
| In-situ density | EOS-80: rho(S, t, p) = rho(S, t, 0) / (1 - p / K(S, t, p)), p in bar, K the secant bulk modulus (bar); rho(S, t, 0) = SMOW(t) + (b0 + b1 t + b2 t^2 + b3 t^3 + b4 t^4) S + (c0 + c1 t + c2 t^2) S^1.5 + d0 S^2; t on IPTS-68 = 1.00024 x ITS-90. All 41 coefficients copied into `C:\temp\titanic-descent-scratch\r6\column.js` | UNESCO (1983), Fofonoff and Millard, Tech. Pap. Mar. Sci. 44, eqs. 13-19, as coded in python-seawater (`eos80.py`, `library.py`): https://raw.githubusercontent.com/pyoceans/python-seawater/main/seawater/eos80.py and `.../library.py` | [read]; my code reproduces all six UNESCO check values (for example rho(35, 0, 10,000 dbar) = 1,070.95838408 kg/m3) to 5e-9 kg/m3 [derived] |
| TEOS-10 | supersedes EOS-80 (2010); differences in in-situ density of a few hundredths of a kg/m3 over this range, far below what a falling hull can feel | IOC/SCOR/IAPSO 2010 | [textbook]: not opened |
| Pressure from depth | p (dbar) = [(1 - C1) - sqrt((1 - C1)^2 - 8.84e-6 z)] / 4.42e-6, C1 = 5.92e-3 + 5.25e-3 sin^2(lat), z in m | Saunders (1981), J. Phys. Oceanogr. 11, 573-574, as coded in python-seawater `pres` | [read]; reproduces its check value pres(7321.45 m, 30 deg) = 7,500.0065 dbar [derived]; within 1.3 dbar (0.03 %) of my hydrostatic integral of the EOS-80 column at 3,784 m [derived] |
| Absolute pressure | p_abs = 101.325 kPa + 10 kPa x p(dbar) | definition | [textbook] |
| Sound speed | c = 1448.96 + 4.591 T - 5.304e-2 T^2 + 2.374e-4 T^3 + 1.340 (S - 35) + 1.630e-2 D + 1.675e-7 D^2 - 1.025e-2 T (S - 35) - 7.139e-13 T D^3 (m/s; T deg C, S ppt, D m; valid 2-30 deg C, 25-40 ppt, 0-8,000 m; s.e. 0.07 m/s) | Mackenzie (1981), J. Acoust. Soc. Am. 70, 807, as already coded in Fathom `core/ocean.js:24-27` | [repo]; [textbook]. The surface water here (about 0 deg C) is just below the formula's range: use UNESCO (Chen and Millero 1977) if a listener's numbers there matter [bet] |
| Light | sunlight's useful band (the euphotic zone, 1 % of surface light) ends at about 100-200 m in clear open ocean; practically no sunlight below about 1,000 m. Irrelevant at 2.20 am, true depths for a scale strip | standard oceanography (for example Thurman, Introductory Oceanography, ch. on light) | [textbook] |

### 5.2 The column for an April night (the profile is a bet; the density is computed)

The temperature and salinity nodes are my judgement for the place and the season, anchored where marked: the sea surface cold and fresh (Labrador Current water; the record's own surface temperature is in the R5 note); Labrador Sea Water near 3.3-3.6 deg C and 34.9 between 1,000 and 2,000 m and deep water below, cooling to the bed [bet, from the standard picture of the north-west Atlantic]; the bed at 1-2 deg C, as Wikipedia gives for the wreck, citing Butler (1998) p. 214 ([read in] https://en.wikipedia.org/wiki/Wreck_of_the_Titanic). A real deep profile at the bow exists: the CTD that rode the submersible Titan to 3,853 m on seven dives in June-July 2022, published as PANGAEA dataset 10.1594/PANGAEA.961181 (Cleland and others, 2023; bow at 41.733 N 49.946 W, 3,816 m water depth) [read: the dataset's page]. Its full text file exceeds the fetch tool's 10 MB limit and its HTML preview stops at 252 m (summer surface water, 12.6 deg C at 9 m, 7.8 deg C at 200 m [read]); the deep part was not reached. It is the right source for the deep nodes, and the abstract warns that its salinity is uncorrected.

| z (m) | p (dbar), integral | p (dbar), Saunders | T (deg C) [bet] | S [bet] | rho at p = 0 (kg/m3) | rho in situ (kg/m3) | c (m/s), Mackenzie |
|---|---|---|---|---|---|---|---|
| 0 | 0.0 | 0.0 | 0.0 | 32.80 | 1,026.33 | 1,026.33 | 1,446.0 |
| 10 | 10.1 | 10.1 | 0.0 | 32.84 | 1,026.36 | 1,026.41 | 1,446.2 |
| 50 | 50.3 | 50.4 | 0.0 | 33.00 | 1,026.49 | 1,026.73 | 1,447.1 |
| 100 | 100.7 | 100.9 | 1.0 | 33.60 | 1,026.92 | 1,027.40 | 1,453.3 |
| 200 | 201.4 | 201.8 | 3.5 | 34.40 | 1,027.36 | 1,028.30 | 1,466.9 |
| 500 | 504.1 | 504.7 | 4.2 | 34.90 | 1,027.69 | 1,030.02 | 1,475.4 |
| 1,000 | 1,009.7 | 1,010.6 | 3.6 | 34.90 | 1,027.75 | 1,032.41 | 1,481.1 |
| 2,000 | 2,024.6 | 2,025.8 | 3.1 | 34.93 | 1,027.82 | 1,037.09 | 1,495.9 |
| 3,000 | 3,044.3 | 3,045.6 | 2.5 | 34.93 | 1,027.87 | 1,041.71 | 1,510.4 |
| 3,784 | 3,847.2 | 3,848.5 | 2.0 | 34.90 | 1,027.89 | 1,045.28 | 1,521.8 |
| 3,800 | 3,863.6 | 3,864.9 | 2.0 | 34.90 | 1,027.89 | 1,045.35 | 1,522.1 |

[derived: `C:\temp\titanic-descent-scratch\r6\column.js`, 1 m steps, midpoint density, normal gravity at 41.73 deg plus the free-air gradient.]

- **Pressure at the bed (3,784 m): 3,847 dbar = 38.47 MPa gauge, 38.57 MPa absolute (381 atm)** [derived]. The brainstorm's 38.6 MPa (constant 1,040 kg/m3) is within 0.3 % of it.
- **Sensitivity of the bed's density to the bet:** T 1.0 to 2.5 deg C and S 34.88 to 34.96 move it between 1,045.17 and 1,045.50 kg/m3 [derived]: plus or minus 0.02 %. The surface layer's bet (S 32.8 against 35) moves rho there by about 1.7 kg/m3 (0.17 %). For the fall, **in-situ density = 1,026.3 + 4.97e-3 z kg/m3 (z in m) is within 0.5 kg/m3 of the table everywhere below 50 m** [derived: (1,045.28 - 1,026.33) / 3,784 = 5.0e-3 per metre]; Fathom's `density()` (`core/ocean.js:32`) uses 4.5e-3 per metre, 1.8 kg/m3 (0.17 %) lighter at the bed, and would serve.
- **What depth does to the forces.** Drag and added mass scale with rho: 1.8 % more at the bed than at the surface. Buoyancy of the solids scales with rho too, so a body's weight in water falls by about 1.8 % x rho V g as it goes down: for the whole hull's 17,422 m3 of solids that is 330 t less weight in water at the bed than at the surface [derived: 17,422 x (1.04528 - 1.02633)], 1 % of 31,000 t. Steel is also compressed (bulk modulus about 160 GPa, so 0.024 % volume at 38.5 MPa): negligible [derived]. The air is everything (section 4).

## 6. Striking and entering the bed

### 6.1 The bed at the wreck

| Quantity | Value | Source | Tag |
|---|---|---|---|
| Water depth at the bow | 3,816 m at 41.733 N 49.946 W (the 2022 CTD dataset's position for the bow) | PANGAEA 10.1594/PANGAEA.961181 | [read] |
| The usual depth | about 3,800 m (12,500 ft) | Wikipedia, "Wreck of the Titanic", infobox | [read in] |
| Sediment strength at the site | a characteristic undrained shear strength of about 25 kPa between 10 and 16 m below the seafloor, from a 1998 sample near the wreck | a search digest; the probable source, a University of Southampton record (eprints.soton.ac.uk/7897), refused the fetch (403) | [search summary] |
| The ground | 1991 cores put the wreck on the eastern wall of a canyon that is a landslide scar, where the sediment is very dense; sand waves and ripples where the current meets the wreckage; "undulating, gently sloping"; deep silt inside the wreck | a search digest (a Government of Canada science page, which answered 404 when fetched); Wikipedia (Lynch and Marschall 2003) | [search summary]; [read in] |
| Burial on the record | the bow about 20 m (60 ft) into the mud, to the base of the anchors (Halpern and Weeks 2011); the stern's rudder buried to about 15 m (50 ft) (Pellegrino 2012) | Wikipedia | [read in] |
| Typical deep-water clays elsewhere | s_u = s_u0 + k z with s_u0 about 0.5-5 kPa and k about 1-2 kPa/m for normally consolidated clay (s_u / sigma'_v 0.2-0.3, submerged unit weight 4-7 kN/m3); bulk density 1,450-1,750 kg/m3 | Randolph and Gourvenec, Offshore Geotechnical Engineering (2011) | [textbook] |
| **Profile for the model** | **s_u = 2 + 1.8 z kPa** (z in m), range s_u0 1-5 kPa and k 1.2-2.5 kPa/m; bulk density 1,600 kg/m3 (1,450-1,750) | 25 kPa at 13 m fixes the middle [derived from the search summary and the textbook range] | [bet] |

### 6.2 The force law

Per unit area of a face moving into the soil at normal speed v_n, at depth d below the mudline:

q = R_f(gamma_dot) N_c s_u(d) + 0.5 C_d rho_s v_n^2 + gamma' d (the last only while the face bears), plus adhesion alpha s_u on faces sliding along the soil.

| Term | Value | Range | Source | Tag |
|---|---|---|---|---|
| N_c, bearing factor | 9 for a deep penetrator (a narrow prow); 5.14 (1 + 0.2 d / B)(1 + 0.2 B / L) up to 7.5-9 for a wide, shallow footing (the flat of her bottom) | 5.14-9 | Skempton (1951); the deep-penetration value 9 as in True (1976) and the penetrometer literature | [textbook] |
| R_f, strain-rate factor | 1 + lambda log10(gamma_dot / gamma_dot_ref), gamma_dot = v / D (D the face's width), gamma_dot_ref about 1e-5 s^-1 (laboratory); lambda 0.1 | lambda 0.05-0.2 (5-20 % per decade; one T-bar study 9 %); or the power law (gamma_dot / gamma_dot_ref)^beta, beta 0.034-0.14; True's hyperbolic form caps the factor near 4 | search digests of a T-bar study and of a free-fall ball penetrometer patent; True (1976), NCEL, as cited | [search summary]; True's constants NOT FOUND (his reports are PDFs) |
| At her speeds | v 10 m/s on a 5-20 m face: gamma_dot 0.5-2 s^-1, so R_f 1.2-2.0 (lambda 0.05-0.2) | | | [derived] |
| C_d, soil inertial drag | 0.7-1 (0.8) | | the penetrometer literature | [textbook] |
| alpha, side adhesion | 0.3-0.5 (1 / sensitivity, remoulded) | | | [textbook] |
| Added mass of the water at the moment of striking | 0 to the full heave added mass (about 1e8 kg for the bow piece): the water moving with her either follows her into the impact or flows out sideways | | | [bet] |

**The energy check, closed form.** A flat-ended penetrator of constant area A, mass M (with its water) and weight in water W', striking at v0 into s_u = s_u0 + k z with a constant R_f and no soil inertia, stops at z where 0.5 M v0^2 + W' z = A N_c R_f (s_u0 z + k z^2 / 2), a quadratic [textbook]. The whole bow piece landing flat on about 3,000 m2 of bottom at 10 m/s (R_f 1.5, s_u = 2 + 1.8 z): 12.9 m (N_c 7.5) to 16.6 m (5.14) with M = 77,500 t; 18.6-23.5 m with 100,000 t of added mass on top [derived: `C:\temp\titanic-descent-scratch\r6\bed.js`].

### 6.3 The worked example: a 16,000 t bow at 10 m/s, 15 deg nose-down

A 2-D rigid body in the pitch plane (`bed.js`): the bow piece as a straight keel 140 m long with a flat of bottom tapering from 26 m to nothing over the forward 60 m [bet], M = 77,500 t, pitch inertia M (0.27 L)^2; the soil law above on every 1 m strip of keel that is below the mudline, pressure only while a strip moves into the soil, adhesion on the bottom and embedded sides, a ploughing pressure on the largest embedded section when she moves along her axis; the water's drag held equal to W' at the arrival speed (she arrives in steady fall). N_c 7.5 on the bottom and 9 on the ploughing face, C_d 0.8, rho_s 1,600, alpha 0.4 [derived; each choice a bet].

| She arrives | Soil (s_u0 + k z, kPa) | lambda | Added mass | Prow below the mudline | Torn end below the mudline | Final pitch | Stops in | Peak deceleration | Slides |
|---|---|---|---|---|---|---|---|---|---|
| falling vertically, pitched 15 deg | 1 + 1.2 z (soft) | 0.05 / 0.1 / 0.2 | no | 19.5 / 18.0 / 15.7 m | 9.0 / 8.3 / 7.5 m | -4.3 / -4.0 / -3.4 deg | 4.3-4.8 s | 0.41-0.45 g | 1 m |
| same | 1 + 1.2 z | 0.1 | yes | 23.1 m | 15.6 m | -3.1 deg | 5.5 s | 0.38 g | -2 m |
| **same** | **2 + 1.8 z (the middle)** | **0.1** | **no / yes** | **14.4 / 18.9 m** | 6.6 / 12.3 m | -3.2 / -2.7 deg | 4.1 / 4.9 s | 0.48 / 0.44 g | 1 / -2 m |
| same | 2 + 1.8 z | 0.05 / 0.2 | no | 15.8 / 12.3 m | 7.1 / 5.9 m | -3.6 / -2.6 deg | 3.9-4.3 s | 0.47-0.52 g | 1 m |
| same | 5 + 2.5 z (stiff) | 0.05 / 0.1 / 0.2 | no | 12.4 / 11.1 / 9.1 m | 5.4 / 5.0 / 4.5 m | -2.9 to -1.9 deg | 3.6-3.9 s | 0.53-0.62 g | 0-1 m |
| same | 5 + 2.5 z | 0.1 | yes | 15.5 m | 9.6 m | -2.4 deg | 4.4 s | 0.49 g | -2 m |
| moving along her axis (path 15 deg below horizontal) | 2 + 1.8 z | 0.1 | no / yes | 10.8 / 7.2 m | 6.0 / 9.3 m | -2.0 / +0.9 deg | 10.6 s | 0.39 / 0.20 g | 45 / 49 m |
| same | 1 + 1.2 z to 5 + 2.5 z | 0.05-0.2 | no | 5.6-16.2 m | 4.1-8.1 m | -3.3 to -0.6 deg | 10-11.5 s | 0.29-0.50 g | 43-47 m |

**Answer: the prow goes 14 m down in the middle case (9-23 m over the ranges), the torn end 5-16 m, and she ends almost level (2-4 deg bow down) within about 4-5 s, at a peak of about half a g.** The record's 20 m at the prow (to the anchors) sits in the soft half of the range, or the middle with the water's added mass carried in: the burial depth is a usable check on the soil's strength gradient, which is the least known input. Her kinetic energy at the bed, 3.9 GJ (8.6 GJ with the added mass), is of the order of the implosion energies of section 4.4.

### 6.4 The cushion and the following water

| Effect | Estimate | Source | Tag |
|---|---|---|---|
| The squeeze film under a flat body near the bed | heave added mass per metre grows to about rho B^3 / (12 h) at a gap h much less than B (B = 28 m: equal to the open-water value, 915 t/m, at h of about 2 m); the water escapes sideways at about v B / (2 h): 56 m/s at 8 m/s and h = 2 m, a pressure of order 0.5 rho (v B / 2h)^2 = 1.6 MPa before the hull touches | lubrication theory | [textbook]; [derived] |
| What it does | most of the deceleration of a flat landing happens in the last 2-5 m of water, the water's momentum going into the bed around her (scour, a plume) as much as into her | | [bet] |
| The following water ("down-blast") | the water dragged behind a bluff body (added mass plus the separated wake, several times the added mass) runs on when she stops: a stagnation pressure 0.5 rho v^2 = 52 kPa (about 5 m head) at 10 m/s on the decks from above | | [derived]; enough to collapse joiner work (1-3.5 m) and light decks loaded from the wrong side (2-10 m), section 4.3: a mechanism for the "down-blast" [bet] |

## 7. Debris

The formula is the same for every piece: **v = sqrt(2 W' / (rho Cd A))**, W' = (rho_s - rho) V g, A the area normal to the fall in the attitude it holds, with the falling regime of section 2 deciding which attitude and Cd [textbook]. A piece's fall time over the column is t = integral dz / v(z) (rho changes by 1.8 %, so v by 0.9 %), and its drift in a current U(z) is x = integral U(z) dz / v(z): slow pieces travel far, fast pieces land under the break. That sorting is the usual "ballistic" reading of a debris field: given the pieces' fall speeds, the field's spread by class gives the current and the place of the break-up [textbook; how far the Titanic literature has applied it NOT FOUND].

[derived: `C:\temp\titanic-descent-scratch\r6\debris.js`; rho 1,035; v at the middle Cd; drift for a uniform current, the depth-mean being what matters.]

| Piece | W' | Cd (range) | v (m/s) | Re | Fall | Drift at 0.05 / 0.1 / 0.2 m/s | Regime and note | Tag |
|---|---|---|---|---|---|---|---|---|
| coal, 0.05 m lump (density 1,350) | 0.4 N | 1.0 (0.8-1.2) | 0.55 (0.50-0.61) | 1.6e4 | 115 min | 350 / 690 / 1,390 m | tumbles irregularly; Cd a bet | [derived]; [bet] |
| coal, 0.10 m lump | 3.1 N | 1.0 | 0.77 (0.71-0.86) | 4.4e4 | 82 min | 250 / 490 / 980 m | | [derived] |
| coal, 0.30 m lump | 83 N | 1.0 | 1.34 (1.22-1.50) | 2.3e5 | 47 min | 140 / 280 / 570 m | | [derived] |
| steel plate 1 x 2 m x 25 mm, flat | 3.3 kN | 1.17 (1.1-1.2) | 1.66 | 9.5e5 | 38 min | 110 / 230 / 460 m | **it will not stay flat**: I* (card form rho_s h / (rho_f l)) = 0.19, in the tumbling range of falling cards [bet on the threshold]; a tumbling or gliding plate falls faster than flat and moves sideways by a glide of the order of its fall height or less [bet] | [textbook] for Cd |
| the same plate, edge first | 3.3 kN | 1-2 on the edge, plus friction | 10-13 | 1.6e5 | 5.5 min | 17 / 33 / 66 m | unstable (the Munk moment turns it flat); the upper bound | [derived] |
| Scotch boiler, 4.8 m x 3.6 m, 57 t of steel, flooded, axis vertical | 485 kN | 1.0 (0.9-1.15) | 7.2 (6.7-7.6) | 2e7 | 8.8 min | 26 / 53 / 105 m | a short cylinder end-on (Cd about 1.15 at L/D near 1, falling toward 0.9 as it lengthens) | [derived]; [textbook] for Cd (Hoerner 1965) |
| the same boiler, axis horizontal | 485 kN | 0.75 (0.6-0.9) | 8.5 (7.8-9.5) | 2e7 | 7.4 min | 22 / 44 / 89 m | lands within about 100 m of the point under the break: the record's boilers mark the break [read in] | [derived]; [bet] for Cd |
| a piece of double bottom 10 x 5 x 1.6 m, 20 t of steel | 170 kN | 1.2 (1.0-1.4) | 2.3 (2.2-2.6) | 7e6 | 27 min | 80 / 160 / 320 m | cellular; falls flat or rocks | [bet] |
| china plate, 0.25 m, 6 mm (density 2,400) | 3.9 N | 1.17 (1.0-1.3) | 0.36 (0.35-0.39) | 5e4 | 173 min | 520 / 1,040 / 2,080 m | disk I* = pi rho_s h / (64 rho_f d) = 0.0027: the fluttering, not tumbling, side of the disk maps [bet on the boundary]; a fluttering disk's mean speed is close to the flat value [bet] | [derived] |
| cast-iron bathtub, 150 kg, open side down | 1.3 kN | 1.4 (1.2-1.6) | 1.3 (1.2-1.4) | 5e5 | 49 min | 150 / 290 / 590 m | cup-like | [bet] |
| leather shoe, waterlogged (density about 1.2) | 2.4 N | 1.1 | 0.38 | 5e4 | 167 min | 500 / 1,000 / 2,000 m | the shoes on the bed are the slowest class that survives | [bet] |
| wood (planks, furniture, panelling) | negative | | rises | | | | floats unless waterlogged or held; it is not in the debris field unless it was held down | [textbook] |

**Currents for the drift.** No measured profile for the night was found (NOT FOUND). The surface layer is the Labrador Current's water [R5's domain]; the bed is "swept by the western boundary current" with eddies across the wreck (Gannon 1995, via Wikipedia) [read in], and a 2024 modelling study (Schulzki and others, Deep-Sea Research I) says the large-scale bathymetry shields the site from a strong mean flow while mesoscale eddies can speed the deep flow up considerably [search summary]. A depth-mean current of 0.05-0.2 m/s is my range [bet]: with it the slow classes (china, shoes, small coal) spread over 0.5-2 km and the boilers within about 100 m, which is the order of the record's 1,700 by 875 m field.

## 8. Conflicts

| # | Between | What | My reading |
|---|---|---|---|
| C1 | Halpern and Weeks (2011), as Wikipedia reports them, and themselves | the bow "at about 45 deg" and "about 1 ft forward for every 6 ft of descent" (a path about 80 deg below the horizontal) | in section 2's physics a steady fall has tan(pitch) = C_A / C_N: a 45 deg attitude goes with an end-on dive at 40-50 m/s, and an 80 deg path with a near-level hull. Either the 45 deg is a starting or striking attitude and the 1 in 6 the mean path, or the two are not one state. For R5 to read in the book |
| C2 | Halpern and Weeks (10 m/s at the bed) and the popular figure (about 13 m/s, six minutes) | the bow's speed | the flat-falling physics gives 9.3-10.4 m/s and 6.0-6.6 min; on her side 9.5-15 m/s. The 10 m/s is the consistent one |
| C3 | the 1969 Structural Analysis Group (470 m) and a Naval Ordnance Laboratory study (about 610 m), both via Wikipedia | Scorpion's break-up depth | not resolvable here |
| C4 | the 1963 estimate (400-610 m) and Rule (2013, 730 m) | Thresher's collapse depth | Rule's is the later, acoustic one |
| C5 | the brainstorm's flat fall (6,000 m2, Cd 1.2, 9 m/s, 7 min) and this note's (7,532 m2 of plan, Cd 1.1, 8.4 m/s, 7.5 min; the prototype 9.3 m/s, 6.5 min) | the whole hull's terminal speed | the same band. The prototype is faster because it scales her breadth to her envelope's volume (125,019 m3 over 20 m of height is a mean breadth of 23 m, after the bilges, the fine ends and the narrower deckhouses), so its plan area is about 6,250 m2, near the brainstorm's 6,000. The model should take the areas from its own sections |
| C6 | isothermal (the brainstorm) and adiabatic compression | the depth at which her air stops holding her up | 7.5 m against 11.9 m; immaterial to the fall, material to the last seconds at the surface |
| C7 | Fathom's `density()` and EOS-80 | the column | Fathom: 1,027 at the surface, +4.5e-3 per m; EOS-80 here: 1,026.3 (fresher surface water) and +5.0e-3 per m below 50 m; 1,045.3 at the bed against the brainstorm's 1,046. All within 0.1 % |
| C8 | the cylinder experiments (Re 1e2-1e4) and her (Re 1e8) | whether the regime maps carry over | an extrapolation over four decades of Re; the broadside tendency rests on the Munk moment, which is inviscid and does carry over; the rocking amplitude may not |

## 9. NOT FOUND

- The mine-drop group's coefficient formulas (drag Cd1 and Cd2 against Re, lift against attack angle, the torque terms), its sediment model's constants, and the conditions (centre-of-mass offset, L/d, release angle) for each of its six trajectory patterns: the papers are PDFs the fetch tool returned as binary, and the Naval Postgraduate School repository's pages render as an empty shell.
- The numerical boundaries of the regime maps (Willmarth 1964; Field and others 1997; Belmonte and others 1998; Andersen and others 2005): abstract pages only.
- Hoerner's figures for rectangles with rounded corners and for inclined cylinders; Delany and Sorensen's Table I (NACA TN 3038; its NTRS PDF returned binary); Allen and Perkins' eta curve; Jorgensen's formula itself (the NTRS page gives the method in words).
- DNV-RP-F107's and DNV-RP-C205's tables (behind a DNV login): the added-mass values in section 1.3 are as I remember them.
- True's (1976) strain-rate constants and the O'Loughlin and others (2013) energy formula for dynamically installed anchors.
- Descent speeds and implosion depths for Derbyshire, El Faro, Bismarck, ARA San Juan and Titan; descent times of ships scuttled as reefs; any published hydrodynamic computation of Titanic's bow or stern fall other than the figures quoted from Halpern and Weeks.
- Ruponen's (2007) equations as printed; FLOODSTAND's leakage-area ratios and door-by-door collapse heads.
- The volumes of her after body's closed spaces (refrigerated rooms, shaft tunnels, after peak, tanks, condensers); the 1912 Board of Trade design head for her bulkheads.
- Measured near-bed current speeds at the wreck (only qualitative statements were found); the deep temperature and salinity at the bow from the 2022 CTD (the dataset exists, PANGAEA 10.1594/PANGAEA.961181, but its 10 MB text file is beyond the fetch tool; a person can download it).

## 10. For the model

Frame: the model's ship frame (x forward, y to port, z up; right-handed). All forces below are on the body, in body axes, from the body's velocity relative to the water nu_r = (u, v, w, p, q, r) (the current U(z), if any, subtracted). Origin of the hydrodynamic terms: the envelope's centroid C. The attitude must be singularity-free (a quaternion): a falling piece passes through 90 deg of pitch in the first half-minute (section 2), beyond the core's clamps (1.35 rad trim, 1.4 rad roll) and Fathom's Euler step (pitch clamped at 1.4 rad, `C:\code\fathom\core\motion.js:158`) [repo].

### 10.1 One strip in a general relative flow

Strip i: length dx_i, at x_i from C; section height H_i (keel to the highest continuous deck there, plus deckhouses), width B_i, section area A_i, perimeter P_i. Its velocity relative to the water: c_i = (v + r x_i, w - q x_i) in (y, z) (plus p times the offset of the strip's centre from C if that offset is kept), u_i = u.

| Term | Formula | Value | Range | Source / tag |
|---|---|---|---|---|
| Cross-flow drag | F_i = -0.5 rho(z) Cd(n) h(n) dx_i abs(c_i) c_i, n = c_i / abs(c_i) = (n_y, n_z) | h(n) = H_i abs(n_y) + B_i abs(n_z); Cd(n) = Cd_beam n_y^2 + Cd_vert n_z^2, Cd_vert = Cd_keel if n_z < 0 (moving keel first) else Cd_deck | | the cross-flow principle [textbook]; the blend [bet] |
| Cd_beam (beam-on) | | 0.9 | 0.6-1.2 | section 1.2: 2-D 1.2-1.7 x eta 0.65-0.7; the surface model's fitted 0.72 [repo]; [bet] |
| Cd_keel (falling flat, upright) | | 1.1 | 0.8-1.4 | [bet] |
| Cd_deck (falling flat, capsized) | | 1.3 | 1.0-1.6 | [bet] |
| Axial pressure drag | X_p = -0.5 rho Cd_x A_x abs(u) u, A_x = the largest section (about 500 m2 for her) | Cd_x = 0.25 with a faired end leading (bow first; the whole ship either way: 0.15); 0.95 with a torn end leading | 0.15-0.35; 0.8-1.1 | Hoerner base drag 0.029 / sqrt(C_Df) = 0.17 for the bow piece; flat face to cup [textbook]; [derived] |
| Skin friction | X_f = -0.5 rho (Cf + dCf) S_wet abs(u) u; S_wet about 0.85 sum(P_i dx_i); Cf = 0.075 / (log10(abs(u) L / nu) - 2)^2, nu = 1.75e-6 m2/s | Cf about 1.2-1.45e-3; dCf 0.4e-3 | dCf 0.2-0.6e-3 | ITTC-57 [textbook]; dCf [bet] |
| Lift (potential) | included through the added-mass terms of 10.2 (the Munk moment) for closed ends; for a torn end trailing, add N = m'(x_end) U^2 sin alpha cos alpha normal to the axis, in the plane of the cross-flow, applied at the forward end's taper (where m' grows) | for the bow piece moving bow first, m'_33(end) about 915 t/m | Jones's low-AR lift (pi/2) AR alpha is the same term in coefficient form; small beside the cross-flow term above about 10 deg | slender-body theory [textbook]; optional [bet] |
| Vortex-shedding side force (optional) | +/- 0.5 rho C_L' h abs(c) c rotated 90 deg, at f = St abs(c) / h, phase from the seed | C_L' 0.5, St 0.15 | 0.3-1; 0.1-0.2 | [textbook] ranges; appearance-grade until tested [bet] |

### 10.2 Added mass (unbounded water), and the terms that carry the Munk moment

| Coefficient | Formula | Whole hull | Bow piece | Stern piece | Range / source |
|---|---|---|---|---|---|
| m'_22 (sway, beam-on), per metre | 1.62 rho pi (H_i / 2)^2 for a 28 x 20 section (C_A from the 2-D rectangle table at a/b = H / B) | 522 t/m | same | same | C_A of rectangles: DNV-RP-C205 Table A-1 as remembered [textbook]; +/- 10 % [bet] |
| m'_33 (heave, keel-on), per metre | 1.45 rho pi (B_i / 2)^2 (a/b = B / H) | 915 t/m | same | same | same |
| End correction J | multiply the strip sums by the spheroid's k2 | 0.96 | 0.90 | 0.87 | Lamb (section 1.3) [derived] |
| m22 = J sum(m'_22 dx), m33 = J sum(m'_33 dx) | | 133 kt / 234 kt | about 66 kt / 115 kt | about 50 kt / 88 kt | [derived]; the pieces' sums scale with their lengths and tapers |
| m11 (surge) | k1 rho V_env | k1 0.04 (0.02-0.07) | 0.08 (0.05-0.13) | 0.12 (0.08-0.17) | spheroid to square-ended prism (section 1.3); the surface model's 4 % [repo] |
| I55, I66 (pitch, yaw) | J' sum(m'_33 x_i^2 dx), J' sum(m'_22 x_i^2 dx), J' = k' / k2 | J' 0.92 | 0.80 | 0.72 | [derived] |
| I44 (roll) | sum(0.25 rho pi (B_i / 2)^4 dx) | | | | 0.2-0.3 [bet]; small beside her own |
| Near the bed (heave) | m'_33(h) = max(m'_33, rho B^3 / (12 h)) for gap h | | | | lubrication [textbook]; [bet] as a model |

With M_A = diag(m11, m22, m33, I44, I55, I66), P = (m11 u, m22 v, m33 w), L = (I44 p, I55 q, I66 r), the potential-flow force and moment on the body are (Kirchhoff's equations) **F_A = -M_A[0:3] nu_dot[0:3] - omega x P** and **M_A = -M_A[3:6] nu_dot[3:6] - omega x L - v x P** [textbook: Lamb 1932; Fossen 2011 writes the same as C_A(nu_r)]. Written out:
- X_A = -m11 u_dot + m22 v r - m33 w q; Y_A = -m22 v_dot + m33 w p - m11 u r; Z_A = -m33 w_dot + m11 u q - m22 v p
- K_A = -I44 p_dot + (m22 - m33) v w + (I55 - I66) q r; **M_A = -I55 q_dot + (m33 - m11) u w + (I66 - I44) r p; N_A = -I66 r_dot + (m11 - m22) u v + (I44 - I55) p q** (the bold u w and u v terms are the Munk moments; they turn her broadside). Put the -M_A nu_dot parts on the left with her own mass matrix and solve the 6 x 6 system each step, as Fathom does for its 2 x 2 blocks (`C:\code\fathom\core\motion.js:149-154`) [repo].

### 10.3 Weight, buoyancy and what decides her attitude

| Quantity | Formula | Note | Tag |
|---|---|---|---|
| Her mass | M = sum of solids + water inside (+ air, negligible) | moves with her as one body if the spaces are subdivided | [bet] |
| Buoyancy | rho(z) g V_env at C (V_env the envelope: every space counted full) | then her water inside is weighed in M | [textbook] |
| Net weight and its point | W' = (M - rho V_env) g acting at G' = (m_s G_s - rho V_s B_s) / (m_s - rho V_s): the solids' weight in water and its centroid | the couple W' x (G' - C) is the gravity moment | [derived] in section 2 |
| **The deciding number** | d = the offset of G' from C along her axis, as a fraction of L | 0: she falls level and straight down; each +1 % of L (toward an end) gives a level glide toward that end of about 0.3 m/s (bow piece) and about 120 m of horizontal travel over the fall; it does not hold her nose down | [derived: prototype] |
| Air | rho g V_air at the air's centroid, for each pocket | a pocket aft lifts that end until it is squeezed (the first 10-100 m) | section 4 |

### 10.4 The falling regime, by body (the arithmetic is in section 2.2; redo it with the model's own V_env, W' and d)

| Body | Mean density / water's | L / D_eq | Expected regime | Vertical speed, flat | Fall to 3,784 m | Rocking period (if any) |
|---|---|---|---|---|---|---|
| (a) whole hull, 269 x 28 x 20 m, 31,163 t in water | 1 + 31,163 / (1.035 x 125,019) = 1.241 | 269 / 26.7 = 10.1 | broadside (level), after an end-on dive of at most 20-30 s from her founder trim; flutter about level | 8.4 m/s (Cd 1.1 on 7,532 m2; 7.5-9.9); prototype 9.3 | 6.4-7.5 min | 94 s |
| (b) bow piece, 140 x 28 x 20 m, 16,000 t in water | 1 + 16,000 / (1.035 x 60,000) = 1.258 | 5.2 | broadside within about 30 s from 45-80 deg bow down; a level glide toward the bow if her weight sits forward | 8.4 (7.4-9.8); prototype 9.6 | 6.2-7.5 min | 66 s |
| (c) stern piece, 110 x 28 x 20 m, 15,000 t in water | 1.302 | 4.1 | broadside within 20-30 s; the shortest and densest, the likeliest to rotate about a vertical axis (the record's "helicopter blade") | 9.2 (8.1-10.7); prototype 10.4 | 6.0-6.9 min | 55 s |

Expected for all three: **broadside, not end-on, not tumbling; level glide set by the weight's offset; rocking of a few tens of degrees about level at about one-minute periods if the unsteady terms are modelled** (density ratio 1.24-1.30 lies between the lightest cylinders tested, 1.12 and 1.4, which fell broadside; only those at 4.5 tumbled [read]; the rest [derived] or [bet]).

### 10.5 The air law

| Item | Formula | Values | Tag |
|---|---|---|---|
| State of a pocket j | air mass m_j, temperature T (2-10 deg C), pressure p_j = p_atm + p_water at its free surface level (open at the bottom) or its own (tight) | V_j = m_j R T / p_j (n = 1); for n = 1.4 track p V^1.4 instead | [textbook]; n a [bet] (1.0-1.4) |
| Venting (open above) | m_dot = Cd A sqrt(2 rho_j dp), dp = rho_w g h_j (h_j the air's height above the opening's outside level), Cd 0.6; the compressible and choked forms of section 4.2 only near the surface | 1 m2 at 50 m with h = 2-10 m: 42-83 m3/s at pocket pressure | [textbook] |
| One opening only (counter-current) | sqrt(j_g*) + sqrt(j_f*) = C, C 0.7-1.0 | 1 m x 1 m: 0.6-2.2 m3/s each way | Wallis [textbook]; [bet] for a hatch |
| A tight space fails | when p_out - p_in exceeds rho g h_fail: floods at once (a "space gives way" event); energy dp V | h_fail by boundary: joiner work and non-watertight doors 1-3.5 m [search summary]; hatches and light decks 2-10 m; watertight bulkheads 8-30 m (x 0.6-0.8 from the wrong side); tank tops 15-30 m; shell 20-60 m; closed boilers hundreds of metres [derived and bet, section 4.3] | each failure head a [bet] with the range given |
| Neutral depth of her surface air | V_air(z) x rho g = W' | 7.5 m (n = 1) to 11.9 m (n = 1.4) for 53,113 m3 against 31,163 t | [derived] |

### 10.6 The water column

Use section 5.2's table, or **rho(z) = 1,026.3 + 4.97e-3 z kg/m3** (within 0.5 kg/m3 below 50 m), **p(z) = Saunders' formula** (3,847 dbar at 3,784 m), T from the table for the readouts, c from Mackenzie (1,446 m/s at the surface, 1,522 at the bed). A port of Fathom's `ocean.js` with a new "April at the wreck" profile (section 5.2's nodes) is the same thing [repo].

### 10.7 The bed

| Item | Value | Range | Tag |
|---|---|---|---|
| Depth at the bow | 3,816 m (2022 CTD's position); the brainstorm's 3,784 m | 3,770-3,816 | [read] |
| Strength | s_u = 2 + 1.8 z kPa | s_u0 1-5, k 1.2-2.5 | [bet], anchored by 25 kPa at 10-16 m [search summary] |
| Bulk density | 1,600 kg/m3 | 1,450-1,750 | [textbook] |
| Pressure on a face moving in at v_n | q = R_f N_c s_u(d) + 0.5 C_d rho_s v_n^2 (+ gamma' d), zero while it moves out; adhesion alpha s_u on faces sliding | | [textbook] |
| N_c | 7.5 on the flat of the bottom; 9 on a narrow prow or ploughing face | 5.14-9 | [textbook] |
| R_f | 1 + 0.1 log10((v / D) / 1e-5), cap 4 | lambda 0.05-0.2 | [search summary]; [bet] |
| C_d, alpha | 0.8; 0.4 | 0.7-1; 0.3-0.5 | [textbook] |
| The water's added mass at the strike | not carried in | carried in fully | [bet]; a switch |
| Worked example | bow piece, 16,000 t in water (77,500 t with her water), 10 m/s vertical, 15 deg bow down: **prow 14.4 m below the mudline (middle soil), 9-23 m over the ranges; torn end 5-16 m; settles 2-4 deg bow down in 4-5 s at about 0.5 g peak** | | [derived: `bed.js`] |
| Step | the strike lasts 4-11 s with decelerations near 0.5 g: sub-step the bed phase (the script used 0.002 s; 25-100 sub-steps of the 0.25 s step, fixed order) | | [bet] |

### 10.8 Debris classes (v = sqrt(2 W' / (rho Cd A)))

| Class | Cd, attitude | v (m/s) | Fall | Drift at 0.1 m/s |
|---|---|---|---|---|
| boilers (57 t steel, 4.8 x 3.6 m) | 0.75 broadside, 1.0 end-on | 7.2-8.5 | 7.4-8.8 min | about 50 m |
| large structure (double bottom, 20 t / 50 m2) | 1.2 flat | 2.3 | 27 min | 160 m |
| plates (1 x 2 m x 25 mm) | 1.17 flat; tumbling faster, gliding sideways | 1.7 flat (to 10-13 edge first) | 6-38 min | 30-230 m plus glide |
| bathtubs and fittings (150 kg, cup) | 1.4 | 1.3 | 49 min | 290 m |
| coal lumps (density 1,350, 0.05-0.3 m) | 1.0 | 0.55-1.34 | 47-115 min | 280-690 m |
| china, shoes (density 1.2-2.4, light and flat) | 1.1-1.17 | 0.36-0.38 | 2.8-2.9 h | about 1,000 m |
| wood | floats | | | |

### 10.9 Tests to hold a new module to

| # | Case | Expected | Source |
|---|---|---|---|
| T1 | a rigid box of known Cd and area, quadratic drag, constant rho, released from rest | v(t) = v_t tanh(a t / v_t), z(t) = (v_t^2 / a) ln cosh(a t / v_t), a = W' / (M + m_a); for her flat: v_t 8.4 m/s, a 0.778 m/s2, 95 % of v_t at 19.8 s and 106 m | closed form [textbook]; numbers [derived] |
| T2 | a steel sphere, 20 mm, Cd 0.47, in sea water | 1.91 m/s (Re 2.2e4) | [derived] |
| T3 | a spheroid of L/D 5 held at alpha = 30 deg in a steady stream of 10 m/s, no viscous terms | moment (k2 - k1) rho V U^2 sin alpha cos alpha = 0.835 rho V x 100 x 0.433 (N m), turning it broadside; zero net force | Munk [textbook] |
| T4 | a constant-area penetrator into s_u = s_u0 + k z, constant R_f, no soil inertia | 0.5 M v0^2 + W' z = A N_c R_f (s_u0 z + k z^2 / 2); 1,000 kg (W' 8.5 kN), 0.2 m flat tip, 10 m/s, N_c 9, R_f 1.5, s_u 2 + 1.8 z: z = 25.25 m | closed form [textbook]; [derived] |
| T5 | a uniform flooded piece (d = 0) released end-on | turns broadside in tens of seconds and lands level; with d = +5 % L a level glide of about 1.5 m/s toward the heavy end (bow piece) | section 2.2's prototype [derived] |
| T6 | the 1912 bow | at the bed in 5-7 min at 8-11 m/s; prow buried 10-25 m (the record: about 10 m/s and 20 m, Halpern and Weeks 2011 via Wikipedia) | [read in]; the band a [bet] |
| T7 | a cylinder of L/d 10 and density ratio 1.4 (lab scale), if rocking is modelled | rocking at f = 0.126 sqrt((drho / rho_c) g / L) | Marchildon 1964; Toupoint 2019 [read in Letessier 2025] |

### 10.10 The bets that remain, with the range a model should allow

| Bet | Middle | Range |
|---|---|---|
| Cross-flow Cd, beam-on / keel-on / deck-on | 0.9 / 1.1 / 1.3 | 0.6-1.2 / 0.8-1.4 / 1.0-1.6 |
| Axial Cd, faired end first / torn end first | 0.25 / 0.95 | 0.15-0.35 / 0.8-1.1 |
| Roughness allowance dCf | 0.4e-3 | 0.2-0.6e-3 |
| 2-D added-mass coefficients (DNV as remembered) | 1.62 sway, 1.45 heave | +/- 10 % |
| Surge added mass k1 | 0.04 whole, 0.08 bow, 0.12 stern | 0.02-0.17 |
| The pieces' envelopes | bow 60,000 m3, stern 48,000 m3 | 55,000-65,000; 45,000-52,000 (take the model's own) |
| W' offset d | from the core's weights | -5 to +20 % of L |
| Polytropic index of her air | 1.0 | 1.0-1.4 |
| Failure heads | section 10.5 | as given there |
| Rocking amplitude and period (not in a quasi-steady model) | 20 deg, 1 min | 10-70 deg; 55-95 s |
| Vortex-shedding side force | C_L' 0.5 at St 0.15 | 0.3-1; 0.1-0.2 |
| Bed: s_u0, k | 2 kPa, 1.8 kPa/m | 1-5; 1.2-2.5 |
| Bed: N_c, lambda, C_d, alpha, rho_s | 7.5 (9 at a prow), 0.1, 0.8, 0.4, 1,600 | 5.14-9; 0.05-0.2; 0.7-1; 0.3-0.5; 1,450-1,750 |
| Added mass carried into the strike | none | none to all |
| Depth-mean current for the debris | 0.1 m/s | 0.05-0.2 m/s |
| The column's T and S | section 5.2 | rho +/- 0.5 kg/m3 at depth, +/- 1.7 at the surface |

## 11. Sources

Opened (read):
- python-seawater, EOS-80 and Saunders as code with UNESCO's check values: https://raw.githubusercontent.com/pyoceans/python-seawater/main/seawater/eos80.py and https://raw.githubusercontent.com/pyoceans/python-seawater/main/seawater/library.py (Fofonoff and Millard 1983, UNESCO Tech. Pap. Mar. Sci. 44; Millero and Poisson 1981; Saunders 1981).
- PANGAEA, Cleland and others (2023), CTD at the RMS Titanic wreck, summer 2022: https://doi.pangaea.de/10.1594/PANGAEA.961181 (the page and its HTML preview to 252 m).
- Wikipedia, "Wreck of the Titanic": https://en.wikipedia.org/wiki/Wreck_of_the_Titanic (the first 100,000 of 214,925 characters), citing Halpern and Weeks (2011), Pellegrino (2012), Ballard (1987), Butler (1998), Gannon (1995), Gibson (2012), Lynch and Marschall (2003).
- Wikipedia, "USS Scorpion (SSN-589)": https://en.wikipedia.org/wiki/USS_Scorpion_(SSN-589); "USS Thresher (SSN-593)": https://en.wikipedia.org/wiki/USS_Thresher_(SSN-593); "MV Derbyshire": https://en.wikipedia.org/wiki/MV_Derbyshire; "Drag coefficient": https://en.wikipedia.org/wiki/Drag_coefficient; "Slender-body theory" (Stokes flow only; nothing used): https://en.wikipedia.org/wiki/Slender-body_theory.
- Letessier, Roig and Ern (2025), "Fluttering motion of a confined cylinder falling freely in fluid at rest", J. Fluid Mech. 1002 A46 (open, HTML reader): https://www.cambridge.org/core/product/DFBFE4D0EC293F26B0A7E55BF26805C8/core-reader (the first 100,000 of 144,866 characters).
- Andersen, Pesavento and Wang (2005), "Unsteady aerodynamics of fluttering and tumbling plates", J. Fluid Mech. 541, abstract page: https://www.cambridge.org/core/journals/journal-of-fluid-mechanics/article/abs/unsteady-aerodynamics-of-fluttering-and-tumbling-plates/1FC26E817B4D5B91714C9875F070CF8D; Wang's group page: https://dragonfly.tam.cornell.edu/falling_paper.html.
- Jorgensen (1977), NASA TR R-474, NTRS record: https://ntrs.nasa.gov/citations/19770026166.
- Schulzki, Henry, Roberts, Rakka, Ross and Biastoch (2024), "Mesoscale ocean eddies determine dispersal and connectivity of corals at the RMS Titanic wreck site", Deep-Sea Res. I 213, 104404, record: https://oceanrep.geomar.de/id/eprint/60808/.
- CORDIS, FLOODSTAND final report summary (no numbers): https://cordis.europa.eu/project/id/218532/reporting.
- Aerossurance, "Loss of MV Derbyshire" (summary only): https://aerossurance.com/safety-management/loss-of-mv-derbyshire/.
- Fathom's `core/ocean.js` and `core/motion.js`, this repository's `core/motion.js`, `docs/BRAINSTORM_the_descent_to_the_bed_v1_2026-11-19.md`, `docs/research/RESEARCH_hull_strength_along_length_v1_2026-11-17.md` [repo].

Search digests only (not opened):
- Chu, Gilles and Fan (2005), Exp. Therm. Fluid Sci. 29: 555-568; Fan and Chu (2006), J. Appl. Mech. 73: 300-314; Chu (2009), Appl. Mech. Rev. 62 (records at calhoun.nps.edu and faculty.nps.edu/pcchu).
- Jalonen, Ruponen and others (2017), Marine Structures, "A study on leakage and collapse of non-watertight ship doors under floodwater pressure" (FLOODSTAND).
- A 1998 geotechnical sample at the wreck (about 25 kPa at 10-16 m), probably https://eprints.soton.ac.uk/7897 (403).
- A T-bar rate study (9 % per decade; 5-20 % in the literature it cites) and a free-fall ball penetrometer patent (beta 0.034-0.14), in a search on strain-rate factors.
- RINA, "Lessons from MV Derbyshire": https://www.rina.org.uk/Lessons-from-MV-Derbyshire (members only).
- DNV-RP-F107 summaries (the 68 % excursion).
- The closed form for Lamb's alpha0, arXiv 2007.06228 (appendix).

Textbooks and papers stated from memory, not opened: Hoerner, Fluid-Dynamic Drag (1965); Lamb, Hydrodynamics (6th ed., 1932); Newman, Marine Hydrodynamics (1977); Munk (1924), NACA Rep. 184; Jones (1946), NACA Rep. 835; Allen and Perkins (1951), NACA Rep. 1048; Delany and Sorensen (1953), NACA TN 3038; Nakaguchi, Hashimoto and Muto (1968); Bearman and Trueman (1972), J. Fluid Mech.; Fossen, Handbook of Marine Craft Hydrodynamics and Motion Control (2011); DNV-RP-C205 (2010); DNV-RP-F107 (2010); ITTC (1957) and ITTC 7.5-02-01-03; Wallis, One-dimensional Two-phase Flow (1969); Skempton (1951); True (1976), NCEL; Randolph and Gourvenec, Offshore Geotechnical Engineering (2011); Hughes, Ship Structural Design; Jones, Structural Impact; Mackenzie (1981), J. Acoust. Soc. Am. 70; Saunders (1981), J. Phys. Oceanogr. 11; Willmarth, Hawk and Harvey (1964), Phys. Fluids 7; Field, Klaus, Moore and Nori (1997), Nature 388; Belmonte, Eisenberg and Moses (1998), Phys. Rev. Lett. 81; Marchildon and others (1964); Toupoint, Ern and Roig (2019), J. Fluid Mech. 866; Ruponen (2007), doctoral thesis, Helsinki University of Technology.
