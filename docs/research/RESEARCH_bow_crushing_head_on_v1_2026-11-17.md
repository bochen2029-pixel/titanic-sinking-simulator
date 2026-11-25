# Head-on bow crushing: the force of her bow against a berg (BACKLOG S1)

Written 2026-11-17 02:30 CST by a research subagent (Opus 5.5) for the lead session; public web sources only. Status: v1. Items 1 to 4 answered, with the gaps listed as NOT FOUND (section 7). Everything computed for this ship is derived and marked so (section 3).

Tags used below: **[quoted]** = read in the source opened (equation, table or figure named); **[derived]** = computed here, method stated; **[secondary]** = seen only in a search summary or reproduced in another source; **[from repo]** = taken from the simulator's own files (read, not run). Scripts and intermediate files are in the scratchpad (`bow_work`), not in the repo.

## Summary: what the model should use, and why

1. **Keep `bowF = 120 MN` as the central value, and cite it.** It is Wilding's estimate turned into a force: 80 to 100 ft of crushed bow at 22.5 knots means a mean force of 108 to 141 MN against a fixed face [derived]. The section-based crushing laws applied to her own bow, with the strain-rate strengthening of mild steel, give mean forces of 100 to 152 MN [derived]: Amdahl 100, Paik and Pedersen 112, Minorsky counting frames 115, Zhang and Pedersen 152. A constant 120 MN also stops her in 4.7 to 5.0 s, inside the 3 to 5 s of pressure Wilding described.
2. **Do not take the modern whole-ship formulas at face value.** Pedersen et al. (1993), which IABSE and Eurocode adopted, and Pedersen, Chen and Zhu (2020) give her a peak bow force of 489 and 376 MN and a crush of 11 to 14 m [derived]. They were fitted to welded bulbous-bow cargo ships of 5,800 to 70,000 DWT at up to 8 m/s, and the 1993 law to ships with high ice class. Her impact energy (Ebar = 2.42) is almost twice the largest in the 2020 fit (1.30). Her fine, transversely framed riveted bow carries much less steel for her length than those bows. AASHTO's formula needs a deadweight, and hers was NOT FOUND.
3. **The one finite-element study of a head-on strike by Titanic is a low outlier.** Paik, Kim and Thomas (2025) ran her bow into a rigid berg: 52.5 m of indentation at 22 knots, 33.3 m at 15 and 24.7 m at 10 [quoted]. Read from their force-indentation figure, the force rises from about 27 MN in the forepeak (18 MN averaged over its whole length, which includes 5 m before first contact) to about 88 MN in hold 3, a mean of about 62 MN over the contact [derived]. Their riveted joints were given reduced, tension-based yield stresses (joint efficiencies 0.17 to 0.98), which they call conservative. Take about 60 MN as the low end of the range.
4. **What-if range: 60 to 150 MN.** At 22.5 knots against a fixed face that crushes 57 m (into hold 3) down to 23 m [derived]. A 100,000-t berg free to move (50 % added mass) takes about 26 % less energy: the crush at 120 MN falls from 28.7 m to 21.4 m [derived].
5. **The constant is weakest at low speed.** At 10 knots, 120 MN crushes 5.7 m. The section-based laws give 5.5 to 17 m, and the finite-element study 24.7 m [derived and quoted]. If slow strikes matter in play, use the depth law of section 6 (option B or C).
6. **Ice side.** Whether the berg's face crushes first depends on the ice pressure-area law at contact areas of 100 to 500 m2. That is outside ISO 19906's calibrated range (about 10 to 30 m2). A 120 MN bow would push into the ice before crushing by about 5 m (Daley-type exponent -0.1), 15 m (ISO mean, pressure held below 50 m2), or 37 m (the model's own `p0/sqrt(A)` law) [derived]. The 1879 Arizona crushed 6 m of bow and carried 200 t of wedged ice home [quoted], so both bow and ice gave way. The current law, like the 2025 study, treats the berg's face as rigid in a stem strike; keep that, but write it down as a bet.
7. **`bowZ` is too low.** The centroid of the crushed section's longitudinal steel, the line of action of the crushing force, lies 12.6 to 14.2 m above the keel, not 5 m [derived]. This bears on the about-20-degree heel noted in `BACKLOG.md` under S1.
8. **Riveting.** The sources say riveted joints do worse than welded ones under impact: rivets lose their heads and seams part. Her rivets were wrought iron with three times the normal slag, and her steel was brittle at -2 C. None quantifies the effect on axial bow crushing except Paik et al.'s equivalent-yield model. The effect points toward a lower crushing force than the same scantlings welded, which is the 60 MN end.

## 1. Sources and figures

### 1a. Empirical laws for a whole bow against a rigid obstacle

| Figure | Value | SI | Source (author, title, URL) | Short quote | Confidence |
|---|---|---|---|---|---|
| Bow force of ice-strengthened ships, Pedersen et al. (1993), eq. 4.12 | P_bow = P0 Lbar [Ebar + (5.0 - Lbar) Lbar^1.6]^0.5 if Ebar >= Lbar^2.6; P_bow = 2.24 P0 (Ebar Lbar)^0.5 otherwise; P0 = 210 MN | MN | Pedersen, Chen, Zhu, "Design of bridges against ship collisions", Marine Structures 74 (2020) 102810, peer-reviewed version https://backend.orbit.dtu.dk/ws/portalfiles/portal/218275168/Design_of_bridges_against_Ship_Collisions.pdf (eqs. 4.12-4.14 read from the PDF's equation objects) | "highly conservative for normal ships, especially for larger vessels" | High; reproduces their Table 3 to the digit (70,000 DWT at 6 m/s: 497 MN, 5.86 m) [derived check] |
| Its symbols | Lbar = L_pp / 275 m; Ebar = E_imp / 1425 MJ; E_imp = 1/2 m V0^2, m with 5 % added mass | - | same, p. 19 | - | High |
| Its crush and duration, eqs. 4.13-4.14 | S_max = (pi/2) E_imp / P_bow; T0 = 1.67 S_max / V0 | m, s | same | - | High |
| Its fitted range | six ships, all with high ice class (sizes not given there); adopted by IABSE and Eurocode for all ships | - | same, p. 19-20 | - | High for the statement; ship sizes NOT FOUND |
| Bow force of ordinary (not ice-class) merchant ships, eq. 4.8 | P_bow = P_r Lbar^0.45 [Ebar + (1.5 - Lbar^-0.1) Lbar^3.6]^0.5 if Ebar >= Lbar^3.5; P_bow = 1.22 P_r (Ebar Lbar)^0.5 otherwise; P_r = 230 MN | MN | same (eq. 4.8 and the line after it) | - | High; reproduces Table 3 (5,800 DWT at 6.5 m/s: 49.2 MN; 12,800 DWT at 8 m/s: 112 MN; 70,000 DWT at 6 m/s: 314 MN) [derived check] |
| Its force against crush, eq. 4.9 | m s'' + P_bow (s / S_max)^0.5 = 0, i.e. P(s) = P_bow sqrt(s / S_max) | - | same | - | High |
| Its crush and duration, eqs. 4.10-4.11 | S_max = 1.5 E / P_bow; T = 1.53 S_max / V0 | m, s | same | - | High for the formulas; their Table 3's S_max differs from 1.5 E/P by up to 15 % [derived] |
| Its fitted range | six merchant ships, 5,800 to 70,000 DWT, L 88 to 280 m, full load, V 2.6 to 8 m/s; largest Ebar = 1.30 [derived from Table 3]; forces from Amdahl's and Yang and Caldwell's methods with Cowper-Symonds rates | - | same, section 4.2 and Table 3 | - | High |
| AASHTO (US Guide) bow force, eq. 4.15 | P_bow = 0.12 V sqrt(DWT), independent of loading | MN, V in m/s, DWT in t | same | - | High (as printed there; AASHTO itself not opened) |
| AASHTO against the 2020 analysis | acceptable for small ships (5,800 DWT); too small for large ones | - | same, p. 20 | - | High |
| Woisin's tests (basis of AASHTO) | seagoing-ship hull impacts on rigid objects with measured force histories, Hamburg (GKSS), 1976 (model scale not stated there); the peak is brief, and the mean over the impact is about half the peak | - | Gasser, Kunz, Boros, Holst, "Probabilistic Background of Eurocode Ship Impact Forces...", engrXiv preprint https://engrxiv.org/preprint/download/7686/12520/10813 | "the force maximum occurs only briefly" | Medium (secondary account of Woisin 1976) |
| Minorsky (1959) | E = 47.2 R_T + 32.7, E in MJ, R_T = destroyed material volume of both ships in m3 | MJ | Liu, Pedersen, Zhu, Zhang, "Review of experiments and calculation procedures for ship collision and grounding damage", Marine Structures 59 (2018) 105-121, https://backend.orbit.dtu.dk/ws/files/163083287/Bin_Liu_Review_BLPTPLZSZ_20Jun2017.pdf | "this empirical formula has been widely used in ship collision and grounding analyses" | High for the SI form |
| Minorsky's range | full-scale collisions; held suitable only for high-energy collisions | - | Prabowo et al., "The effectiveness of thin-walled hull structures against collision impact", Lat. Am. J. Solids Struct. 14 (2017) 1345-1360, https://lajss.org/index.php/LAJSS/article/download/3895/2296/13248 | "considered only suitable for high-energy collisions" | Medium |
| Minorsky against modern bows | gives much less energy than computed for the six 2020 bows | - | Pedersen, Chen, Zhu 2020, Fig. 13 text | - | High |
| Zhang and Pedersen's revision of Minorsky (their simplified method) | E1 = 0.77 eps_f sigma0 R1 (members in tension); E2 = 3.50 (t/b)^0.67 sigma0 R2 (members crushed and folded); E = sum E1 + sum E2 | J | Liu et al. 2018 (above), section 3.2; same form in Pedersen, Chen, Zhu 2020, eqs. 4.16-4.17 | - | High |
| Its mean crushing force | F_m = 3.5 (t/b)^0.67 sigma0 A_m; for the six 2020 bows the mean stress is 118 MPa | N | Pedersen, Chen, Zhu 2020, eq. 4.17 and p. 24 | - | High |
| Its validation | 20 model tests from the literature, absolute deviations under 10 % | - | Liu et al. 2018, section 3.2 | - | Medium (their summary) |
| Newest head-on bow law | crushing force and bow damage as functions of an impact strength, calibrated on Woisin's and Minorsky's data and full-scale crushing analyses | - | Zhang and Pedersen, "Ship bow impact force in head-on collision", Marine Structures 106 (2026) 103940, record https://orbit.dtu.dk/en/publications/ship-bow-impact-force-in-head-on-collision/ | "crushing force and bow damage as a function of an impact strength" | Formulas NOT FOUND (full text embargoed to 2027-12-09) |

### 1b. Section-based (analytical) crushing laws

| Figure | Value | SI | Source (author, title, URL) | Short quote | Confidence |
|---|---|---|---|---|---|
| Amdahl (1983), mean axial crushing force | P_m = 2.42 sigma0 A (N_LT t^2 / A)^(2/3) {0.87 + 1.27 [(N_X + 0.31 N_T) / N_LT] [A / ((N_X + 0.31 N_T) t^2)]^(1/4)}^(2/3) | N | Yamada and Pedersen, "A benchmark study of procedures for analysis of axial crushing of bulbous bows", Marine Structures 21 (2008) 257-293, preprint https://backend.orbit.dtu.dk/ws/files/3299698/preprint.pdf (eq. 6); the same with exponents 0.67 and 0.25 in Pedersen, Chen, Zhu 2020, eq. 4.4 | - | High (two sources agree) |
| Its symbols | sigma0 = flow stress = (sigma_y + sigma_u)/2; A = sectional area of steel; t = mean plate thickness; N_X = cruciform (X) elements, N_T = T elements, N_LT = angle and T elements; effective crushing distance 0.85 of the fold (transversely stiffened) or 0.75 (longitudinally stiffened) | - | Pedersen, Chen, Zhu 2020, p. 15; Yamada and Pedersen 2008, eq. 5 | - | High |
| Its basis | bow models collapsed axially, quasi-static; Amdahl ran six straight-bow model tests | - | Yamada and Pedersen 2008, p. 6; Liu et al. 2018, p. 13 | - | High |
| Paik and Pedersen (1995), plate unit method | fix-fix plate (mode II): sigma_m / sigma0 = (1/eta) (1.425 / beta^0.5 + 0.2672 / beta), i.e. P_m = (sigma0/eta)(1.425 b^0.5 t^1.5 + 0.2672 t^2); fix-free (mode I): (1/eta)(1.007/beta^0.5 + 0.1334/beta); beta = b/t | - | Yamada and Pedersen 2008, eqs. 41-45 | - | High |
| Zhang (1999), L, T and X elements | a plate-unit formula with plane-strain flow stress (about 15 % higher); published form NOT reproduced here (eq. 48 lost its layout in extraction) | - | Yamada and Pedersen 2008, section 2.3 (8) | - | Form NOT FOUND |
| Yamada and Pedersen benchmark on large-scale bulbous bow tests | Yang and Caldwell (1988) best; Amdahl, Wang and Ohtsubo, Paik and Pedersen, Endo and Yamada fairly good; most methods overestimate longitudinally stiffened bows and slightly underestimate less closely stiffened ones (curved plates); eta = 2/3 is a fair default | - | Yamada and Pedersen 2008, Conclusions (1)-(4) | "Yang & Caldwell's method gives relatively good predictions of the experimental crushing force" | High |
| Strain rate, Cowper-Symonds | sigma_d / sigma0 = 1 + (eps_dot / C)^p, eps_dot = V / u (V ship speed, u frame spacing); mild steel C = 40.4 s-1, p = 0.2 | - | Pedersen, Chen, Zhu 2020, eqs. 4.6-4.7; the same constants (C = 40.4, q = 5) in Paik, Kim, Thomas 2025, eqs. 3-4 | - | High |

### 1c. Titanic and other ships striking ice head-on

| Figure | Value | SI | Source (author, title, URL) | Short quote | Confidence |
|---|---|---|---|---|---|
| Wilding: crush in a head-on strike | 80 or perhaps 100 ft of bow crushed; she would stop before the second bulkhead was damaged; a pressure lasting 3 to 5 s; question put as 50,000 tons at 22 to 22.5 knots; Arizona cited as precedent (Q20266-20284) | 24.4-30.5 m | British Wreck Commissioner's Inquiry, day 19, Edward Wilding, https://www.titanicinquiry.org/BOTInq/BOTInq19Wilding02.php (Q20276) | "crushed in the bows for 80 or perhaps 100 feet" | High as testimony (an estimate, not a calculation shown) |
| Paik, Kim and Thomas (2025): head-on finite-element runs | rigid berg; maximum indentation 52.461 m at 22 kn, 33.281 m at 15 kn, 24.734 m at 10 kn, measured from the forecastle deck tip; four compartments open at 22 kn (forepeak, holds 1-3), bulkhead D intact | m | Paik, Kim, Thomas, "The digital reconstruction and resurrection of the RMS Titanic's sinking", Ships and Offshore Structures (2025), doi 10.1080/17445302.2025.2603417; open copy at UCL Discovery https://discovery.ucl.ac.uk/id/eprint/10219524/ (the PDF there is filed under an unrelated file name) | "the bow indentation extended to Hold 3" | High as their result; see the caveats in rows below and section 3.5 |
| Same: their energy and mass | 49,075 t (48,300 long tons), added mass coefficient 0.1, 22 kn: E = 3.457 GN m | 3.457 GJ | same, section 6.1 | - | High |
| Same: speed limits to confine the crush | 6.2 kn (forepeak), 12.3 kn (hold 1), 18.9 kn (hold 2), 25.5 kn (hold 3); initial energy 0.278, 1.075, 2.538, 4.645 GN m; bulkheads at 14.783, 28.880, 44.272, 59.817 m from the forecastle deck tip | - | same, Table 19 | - | High |
| Same: riveted joints | hull modelled as welded with equivalent (reduced) yield stresses; 17 riveted joint cases by FE in tension: efficiency 0.165 to 0.980 (e.g. single-riveted 0.35 in deck plating 0.200, 48.9 MPa; quadruple-riveted 1.00 in side shell 0.626, 153.4 MPa; base yield 245 MPa); rivet clamping and friction left out, so joint strength likely higher than modelled | MPa | same, section 4 and Table 4 | - | High as stated |
| Same: sensitivity to how the reduced yield is applied | indentation 57.845 m with the equivalent yield over whole plates (case 1), 52.461 m with it only near the joints (case 2) | m | same, section 13.3 | - | High |
| Same: shell scantlings of her forward body | strakes 0.60-0.70 in near the stem, 0.70-0.84 in over the holds, 0.84-0.90 in toward boiler room 6; bottom 14/20 to 21/20 in | 15-23 mm | same, Fig. 51 (my reading of the shell expansion) | - | Medium (read off a drawing) |
| Same: the berg | rigid in the head-on runs, chosen as the conservative case; in the side runs 101.6 x 120.0 m, 18.6 m above and 84.1 m below the water | - | same, sections 5.6 and 13.2 | - | High |
| Her steel | yield 262 and 280 MPa, tensile 430 and 432 MPa, elongation 29 and 30.9 % (plates recovered 1996 and 1991); ductile-brittle transition +40 C (longitudinal) and +70 C (transverse) against -15 C for modern A36 | MPa | Foecke, "Metallurgy of the RMS Titanic", NIST-IR 6118 (1998), Table 1, https://nvlpubs.nist.gov/nistpubs/Legacy/IR/nistir6118.pdf | "the steel possessed a ductile-to-brittle transition temperature that was very high" | High |
| Her rivets | wrought iron, 9.3 % slag (about 3 times normal); slag stringers turned across the axis at the inner head; rivets pop under impact; over 50 rivets missing round Olympic's 1911 Hawke damage | - | same, pp. 13-15 | - | High |
| Experts' view of a head-on strike | she would likely have stayed afloat, damage confined to the bow (no figure) | - | NIST news, https://www.nist.gov/node/1227956 | - | Medium (press summary) |
| SS Arizona, 7 Nov 1879: a liner bow-on into a berg | iron, L 137.2 m, B 13.8 m, D 10.9 m, 5,147 gross; about 14 kn (15.5 mph in the text); bow driven in 20 ft, collision bulkhead held, no water past the first compartment; 200 t of wedged ice removed from the bow at St. John's | 6 m | NRC Canada, Institute for Ocean Technology, Ship-Iceberg Collision Incident Report "Arizona", https://newicedata.com/wp-content/uploads/2021/11/Arizona.pdf | "Bows driven in 20' (6 m) but collision bulkhead held." | Medium (database compilation; mass not given) |

### 1d. Ice crushing against a ship's bow

| Figure | Value | SI | Source (author, title, URL) | Short quote | Confidence |
|---|---|---|---|---|---|
| ISO 19906:2019 A.8.2.4.3.5, global pressure from ship ramming tests (used for iceberg impacts) | P_G = C_P A_N^D_P; C_P lognormal, mean 3.0 MPa, s.d. 1.5; D_P normal, mean -0.4, s.d. 0.2; A_N = nominal contact area | MPa, m2 | Fuglem, Stuckey, Shayanfar, Ralph, Thijssen, "A Review of Global and Local Ice Pressure Models for Application to FPSO Design for Iceberg-Impacts", POAC'23, https://poac.com/Papers/2023/pdf/Paper19_Fuglem.pdf | "a lower bound cut-off for the pressure-area curve should be considered" | High as their account of the standard (ISO itself not opened) |
| Its range and practice | calibrated up to about 10 m2, some data to 30 m2; C-CORE limits the exponent to -1 to 0.1 and C to 6 MPa, and holds the pressure constant beyond 50 m2; speed has little effect above 2 m/s | - | same, pp. 4, 12-13 | - | High |
| Ice failure at the contact | load carried by high-pressure zones on about 10 % of the area; over 70 MPa on 0.0001 m2; nominal pressures about 1 MPa on 1 m2 and more; iceberg ice at high strain rate possibly a third of laboratory ice strength | - | same, p. 1 | - | Medium-high |
| ISO 19906 local pressure | p = 7.40 A^-0.70 for about 0.1 to 10 m2, thick massive ice | MPa | [secondary: search summary of a POAC paper; not opened] | - | Medium-low |
| Daley (1999), the Popov-Daley energy method behind the IACS polar rules | normal kinetic energy = ice crushing energy; P_avg = P0 A_n^ex, ex = -0.1, P0 class-dependent (1.25 MPa in a light ice-class study) | MPa | Sadeghi, Quinton, Moakler, Smith, Veitch, "Evaluating the Structural Response of Light Ice-Class Ships Under Ice Loads", POAC'25, https://www.poac.com/Papers/2025/pdf/POAC25_paper_7.pdf (eqs. 1-8) | "ex is the empirical ice crushing constant and is assumed to be -0.1" | Medium (secondary account; Daley's own paper unreachable) |
| Who deforms | strength design (ice dissipates most energy), ductile design (structure dissipates it), shared-energy design (both); the weaker deforms at each instant; shared energy likely for rare, severe events; about 670 ship strikes on bergs, growlers and bergy bits 1619-2004 | - | Kim, "Experimental and numerical studies related to the coupled behavior of ice mass and steel structures during accidental collisions", PhD thesis, NTNU 2014, https://www.ntnu.edu/documents/20587845/701457412/2014+Kim.pdf/6a981752-0fa0-435b-83b6-a46d00881920 (pp. 1-14) | "At any instant, the weaker structure (or ice) will deform." | High |
| What matters most in rule ice loads | the pressure-area relation, edge spalling, viscosity and the strength of crushed ice | - | Kim and Amdahl, "Discussion of assumptions behind rule-based ice loads due to crushing", Ocean Engineering 119 (2016) 249-261, https://ntnuopen.ntnu.no/ntnu-xmlui/handle/11250/2465081 | - | Medium [secondary: abstract via search] |
| The model's own ice law | p = p0 / sqrt(A), p0 = 6 MPa [bet] | MPa | [from repo] `core/encounter.js`, `ICE.p0` | - | - |

### 1e. Riveted 1911 construction against the welded ships the laws were fitted to

| Figure | Value | SI | Source (author, title, URL) | Short quote | Confidence |
|---|---|---|---|---|---|
| Riveted joints under impact | much weaker than welded joints under impact or dynamic load; quality varied with hand work; Olympic's 1911 collision with HMS Hawke detached rivets and opened the hull | - | Paik, Kim, Thomas 2025, section 4 | - | High as their statement |
| How they modelled it | equivalent (reduced) yield stresses from tension tests of 17 joint models; the case using them only near joints crushed 52.5 m, the whole-plate case 57.8 m | - | same, Table 4 and section 13.3 | - | High |
| What the fitted laws assume | plates fold plastically with intact intersections (Amdahl; Yang and Caldwell; Paik and Pedersen; Zhang); all were fitted to welded steel models or modern bows | - | Yamada and Pedersen 2008; Pedersen, Chen, Zhu 2020 | - | High |
| Riveted ships among Minorsky's cases | construction of the 1959 cases | - | - | - | NOT FOUND |
| Tests of riveted against welded bows in axial crushing | - | - | - | - | NOT FOUND |

## 2. The formulas, with every symbol

Whole-ship empirical laws (Pedersen, Chen and Zhu 2020; units as there):

```
Lbar = L_pp / 275 m          Ebar = E_imp / 1425 MJ          E_imp = 1/2 m V0^2   (m: mass with 5 % added mass, 1e3 t; V0 m/s)

Pedersen et al. 1993 (ice class; IABSE, Eurocode):
  P_bow = 210 MN * Lbar * [Ebar + (5.0 - Lbar) Lbar^1.6]^0.5        if Ebar >= Lbar^2.6
  P_bow = 2.24 * 210 MN * (Ebar Lbar)^0.5                            if Ebar <  Lbar^2.6
  S_max = (pi/2) E_imp / P_bow          T0 = 1.67 S_max / V0

Pedersen, Chen, Zhu 2020 (ordinary merchant ships):
  P_bow = 230 MN * Lbar^0.45 * [Ebar + (1.5 - Lbar^-0.1) Lbar^3.6]^0.5    if Ebar >= Lbar^3.5
  P_bow = 1.22 * 230 MN * (Ebar Lbar)^0.5                                  if Ebar <  Lbar^3.5
  m s'' + P_bow (s / S_max)^0.5 = 0      S_max = 1.5 E / P_bow      T = 1.53 S_max / V0      (mean force = P_bow / 1.5)

AASHTO:  P_bow = 0.12 V sqrt(DWT)   (MN; V m/s; DWT t)
Minorsky 1959:  E = 47.2 R_T + 32.7   (MJ; R_T m3 of destroyed material, both ships)
```

Section-based laws (sigma0 = (sigma_y + sigma_u)/2, Pa; t, b in m; A in m2):

```
Zhang and Pedersen:   E1 = 0.77 eps_f sigma0 R1      E2 = 3.50 (t/b)^0.67 sigma0 R2      F_m = 3.5 (t/b)^0.67 sigma0 A_m
Amdahl 1983:          P_m = 2.42 sigma0 A (N_LT t^2/A)^(2/3) {0.87 + 1.27 (N_X + 0.31 N_T)/N_LT [A/((N_X + 0.31 N_T) t^2)]^(1/4)}^(2/3)
Paik, Pedersen 1995:  P_m = (sigma0/eta) (1.425 b^0.5 t^1.5 + 0.2672 t^2) per fix-fix plate unit of breadth b
Cowper-Symonds:       sigma_d = sigma0 [1 + (V/u / 40.4)^0.2]        (u = frame spacing, m)
```

## 3. Worked numbers for this ship [derived]

Inputs: L_pp 259 m, 49,000 t, 22.5 kn = 11.575 m/s, berg 100,000 t with the model's added mass 0.5. The hull form is a port of `halfBreadth`, `xFwd` and `deckZ` from `core/core.js` [from repo]. The crushed section at depth s is cut at a vertical plane s metres aft of the stem head, at the forecastle deck, 130.27 m forward of amidships. Structure bets (no source gave her forward deck scantlings or frame spacing):
- Shell 0.64 in up to 15 m, 0.72 in to 30 m, 0.80 in to 45 m, 0.84 in beyond (Paik et al. Fig. 51).
- Decks: forecastle (B level) 0.55 in, C and D 0.45 in, E, F and G 0.35 in, each with a 1 m stringer plate of 0.60 in at each side; orlop (0.35 in), tank top (0.60 in) and four double-bottom side girders only aft of bulkhead A (14.8 m). Amidships thicknesses from Paik et al. Table 4.
- Keel, centre girder and stem 0.06 m2.
- Frames 9 x 3.5 x 3.5 x 0.5 in channels at 27 in (a guess from their 685 mm coarse mesh); deck beams 6 in2.
- Flow stress 346 MPa, from NIST Table 1 (1996 plate: 262 and 430 MPa).

### 3.1 Energies

| Case | Effective mass | Energy to absorb |
|---|---|---|
| Fixed face, no ship added mass (as the repo comment) | 49,000 t | 3,283 MJ |
| Fixed face, 5 % (Pedersen) | 51,450 t | 3,447 MJ |
| Fixed face, 10 % (Paik et al.) | 53,900 t | 3,611 MJ |
| Free 100,000 t berg (+50 %), ship +0 / +5 / +10 % | reduced mass 36,935 / 38,310 / 39,652 t | 2,474 / 2,566 / 2,656 MJ |

Method: E = 1/2 mu V^2, mu = m_s M / (m_s + M); head-on through the berg's centre, all relative energy into crushing.

### 3.2 Whole-ship laws applied

Lbar = 259/275 = 0.94182; Lbar^2.6 = 0.8557; Lbar^3.5 = 0.8107.

| Law | Fixed face (Ebar = 3447/1425 = 2.4187) | Free berg (Ebar = 1.8010) |
|---|---|---|
| Pedersen 1993: 210 x 0.94182 x [2.4187 + 4.0582 x 0.9085]^0.5 | P = 489 MN; S_max = 11.1 m | P = 463 MN; S_max = 8.7 m |
| Pedersen 2020: 230 x 0.97339 x [2.4187 + 0.49399 x 0.80590]^0.5 | P = 376 MN, mean 250 MN; S_max = 13.8 m | P = 332 MN, mean 221 MN; S_max = 11.6 m |
| AASHTO, DWT unknown: 0.12 x 11.575 x sqrt(DWT) | 139 / 158 / 176 MN for DWT 10,000 / 13,000 / 16,000 t (assumed); crush 24.8 / 21.8 / 19.6 m | - |
| Wilding, 80 to 100 ft | implied mean 135-141 MN (80 ft) and 108-113 MN (100 ft); 4.2 to 5.3 s at constant deceleration | - |
| The model's 120 MN | 27.4 m (no added mass), 28.7 m (5 %), 30.1 m (10 %); 5.0 s | 20.6 / 21.4 / 22.1 m |

### 3.3 Her bow section

| s from stem head (m) | Frontal area (m2) | Longitudinal steel A (m2) | of which shell | Smeared frames and beams (m2 per m) |
|---|---|---|---|---|
| 5 | 57 | 1.15 | 0.85 | 0.49 |
| 10 | 125 | 1.35 | 0.86 | 0.60 |
| 15 | 187 | 1.87 | 0.98 | 0.74 |
| 20 | 243 | 2.09 | 1.00 | 0.85 |
| 30 | 340 | 2.62 | 1.16 | 1.04 |
| 40 | 420 | 2.97 | 1.20 | 1.20 |
| 50 | 483 | 3.32 | 1.31 | 1.33 |

Intersections for Amdahl: N_L = 2 (forecastle gunwales), N_T = 11 forward of bulkhead A, 23 aft of it; N_X = 0, then 1. The mean plate thickness is 14 to 16 mm.

### 3.4 Section-based laws applied

Static force (flow stress 346 MPa) against crush depth, MN:

| s (m) | Minorsky (plates) | Minorsky (+ frames, beams) | Zhang and Pedersen | Amdahl | Paik and Pedersen (eta 0.75) | Paik et al. FE, compartment mean |
|---|---|---|---|---|---|---|
| 5 | 54 | 78 | 77 | 39 | 43 | 18 (forepeak; 27 in contact) |
| 10 | 64 | 92 | 80 | 39 | 48 | 18 (27) |
| 15 | 88 | 123 | 101 | 69 | 76 | 52 (hold 1) |
| 20 | 99 | 139 | 103 | 70 | 80 | 52 |
| 30 | 124 | 173 | 113 | 78 | 94 | 80 (hold 2) |
| 40 | 140 | 197 | 115 | 80 | 99 | 80 |
| 50 | 157 | 220 | 120 | 85 | 107 | 88 (hold 3) |

The Cowper-Symonds factor (eps_dot = V/0.686 m) is 1.84 at 11.6 m/s and 1.71 at 5 m/s. In the dynamic runs it is applied at the speed reached at each depth (d(1/2 m v^2)/ds = -F). It is not applied to Minorsky, whose law is empirical from real collisions.

Crush depth (m) and mean force (MN), 22.5 kn:

| Law | Fixed face, 3,447 MJ | Free 100,000 t berg, 2,566 MJ |
|---|---|---|
| Minorsky, plates only | 37.8 m, 91 MN | 31.1 m, 83 MN |
| Minorsky with frames and beams | 30.0 m, 115 MN | 24.5 m, 105 MN |
| Zhang and Pedersen, static / with rate | 36.4 m, 95 MN / 22.7 m, 152 MN | 28.6 m, 90 MN / 17.9 m, 144 MN |
| Amdahl, static / with rate | 52.4 m, 66 MN / 34.3 m, 100 MN | 41.9 m, 61 MN / 27.8 m, 92 MN |
| Paik and Pedersen, static / with rate | 45.8 m, 75 MN / 30.7 m, 112 MN | 37.0 m, 69 MN / 24.9 m, 103 MN |
| Paik et al. FE curve (section 3.5) | 58.4 m from stem head (contact from 5.0 m), about 62 MN | 48.1 m |
| Constant 120 MN (the model) | 28.7 m | 21.4 m |
| Wilding | 24.4-30.5 m | - |
| Pedersen 2020 / 1993 (peak forces) | 13.8 / 11.1 m | 11.6 / 8.7 m |

The Minorsky intercept (32.7 MJ) is left out: it is 1 % of the energy.

### 3.5 Paik, Kim and Thomas (2025) read off their figures

Their Figure 60 (resultant force against maximum indentation, 10, 15 and 22 kn) is vector art. I took its curves from the PDF's paths, with the axes calibrated on the tick marks, and integrated them [derived].

For the 22-kn run:
- Contact starts at 5.0 m, with a first peak of about 68 MN at 6 m.
- Mean force by compartment: forepeak 17.7 MN over its whole 14.8 m (26.7 MN over the 9.8 m in contact), hold 1 51.5, hold 2 79.5, hold 3 87.5; peak 148 MN.
- Energy under the curve: 150 MJ to 10 m, 261 MJ to bulkhead A (14.8 m), 986 MJ to B (28.9 m), 2,210 MJ to C (44.3 m), 2,927 MJ at the end (52.46 m).

The 10-kn and 15-kn curves follow the same path (627 and 1,230 MJ). Their Figure 56 shows the 22-kn force lasting about 7.7 s. That is longer than Wilding's 3 to 5 s, as a weaker bow should be.

Unresolved: their Table 18 lists, at 22 kn and 10 s, ship energy 0.39 GN m, iceberg energy 2.42 and hull absorption 0.26. The curve's 2.93 GJ fits the hull absorbing most of the energy, so the two printed columns may be swapped. I could not settle this.

### 3.6 Lower speeds, fixed face, 5 % added mass [derived]

| Speed | Energy | 120 MN | Section-based laws, static (with rate) | Paik et al. FE |
|---|---|---|---|---|
| 6.2 kn | 262 MJ | 2.2 m | 3.6-7.5 m (2.3-5.0) | 14.8 m (their forepeak threshold) |
| 10 kn | 681 MJ | 5.7 m | 8.9-16.8 m (5.5-11.5) | 24.7 m |
| 15 kn | 1,532 MJ | 12.8 m | 17.1-28.8 m (11.7-19.9) | 33.3 m |

### 3.7 Check against the Arizona (1879) [derived, mass assumed]

The record gives no displacement. At an assumed 8,000 to 9,000 t and 14 kn, her energy was 210 to 240 MJ. A 6 m crush then means a mean force of 35 to 40 MN. Minorsky's 47.2 MJ/m3 needs about 0.7 m2 of steel in her section for that, which is plausible for a 13.8 m iron bow. Her frontal area at 6 m, about 50 m2, carries 31 to 42 MN of ice crushing by the laws of section 4. Bow and ice were evenly matched, and the 200 t of wedged ice fits that.

## 4. Ship against berg: does the ice crush before the bow? [derived on sourced laws]

The ice carries F_ice = p(A) A, where A is the bow's frontal area at the depth it has pushed into the berg (section 3.3). Until F_ice reaches the bow's crushing force, the ice crushes and the bow does not.

| Ice law | A 120 MN bow first pushes into the ice | Energy the ice absorbs first | A 60 MN bow |
|---|---|---|---|
| The model's p = 6/sqrt(A) MPa | 37.3 m | 3,100 MJ (almost all of it) | 8.1 m, 296 MJ |
| ISO 19906 mean, 3.0 A^-0.4 | 47.3 m | 3,824 MJ (all of it) | 11.8 m, 416 MJ |
| ISO mean held at its 50 m2 value (0.63 MPa), C-CORE practice | 15.4 m | 917 MJ | 7.8 m, 227 MJ |
| Daley-type 3.0 A^-0.1 | 5.2 m | 277 MJ | 2.9 m, 69 MJ |

The answer turns on the pressure-area exponent at 100 to 500 m2. That is beyond the calibration of every source law, and Kim and Amdahl list the pressure-area relation first among the most important assumptions. Nothing here supports a rigid berg or a rigid bow; the shared-energy case is the likely one (Kim 2014), as the Arizona's crushed bow full of ice shows. A berg of 100,000 t is only about 50 m across, so a deep penetration would more likely split it. No source gives a splitting load at this scale.

For the model: the current stem law applies `bowF` without the ice cap that the side law uses, so the berg's face is rigid there. Paik et al. made the same choice. With the model's own `p0/sqrt(A)` the two laws contradict each other: the ice would yield first until about 400 m2 of contact. Keep the rigid face for now, but label it a bet in the comment.

## 5. Riveted construction: what differs

- **Joints.** The laws assume plates fold with intact intersections. Riveted laps and butts carry tension at 17 to 98 % of the plate's strength (Paik et al. Table 4), and they can open before the folds are complete: rivet heads pop, and the slag-laden wrought iron is brittle across its stringers (NIST-IR 6118). In compression a lap still bears plate on plate, so the tension efficiency overstates the loss. Paik et al. say their efficiencies are conservative.
- **Steel.** Her plate is as strong as modern mild steel (yield 262-280 MPa, UTS 430 MPa) but brittle in ice water: transition at +40 to +70 C. Folds may crack instead of folding, which lowers the energy per fold. No source quantifies this for crushing.
- **Framing and form.** She is transversely framed with few longitudinals, has widely spaced decks and thin deck plating (0.35-0.55 in), and a fine, unbulbed bow. That puts less steel and fewer intersections in the section than in the modern bows the empirical laws were fitted to, which is why those laws read 3 to 4 times high for her. Yamada and Pedersen found that the simplified methods slightly underestimate less closely stiffened bows, which nudges the section-based numbers up.
- **Net.** The direction is a weaker bow than the same scantlings welded. The size of the effect is bracketed by the FE study (about 62 MN) and the rate-corrected section-based laws (100-152 MN).

## 6. For the model

**Recommendation: keep the constant, with its citation and range.** Drop-in comment and values for `ICE` in `core/encounter.js`:

```js
    // A stem strike [S1, docs/research/RESEARCH_bow_crushing_head_on_v1_2026-11-17.md]. The bow crushes at a constant
    // force along her axis, 120 MN: Wilding's British Inquiry estimate (Q20276, Q20280: 80 to 100 ft at 22.5 knots, a
    // pressure of 3 to 5 s) is 108-141 MN against a fixed face for 49,000 t. Section-based crushing laws on her own bow
    // with mild-steel rate effects give 100-152 MN (Amdahl 1983; Paik and Pedersen 1995; Zhang and Pedersen 2017;
    // Minorsky 1959 with frames, 115); the one FE study of her (Paik, Kim and Thomas 2025: riveted joints at reduced
    // yield, rigid berg) about 62 MN, rising with depth. What-if range 60e6 to 150e6 (fixed-face crush 57 m to 23 m at
    // 22.5 knots). Modern whole-ship laws (Pedersen 1993, 2020; 376-489 MN) were fitted to welded bulbous bows: not used.
    // The berg's face is rigid in a stem strike [bet]: with p0/sqrt(A) the ice would yield first (section 4 there).
    bowF: 120e6, bowCos0: 0.4, bowCos1: 0.7,
    bowZ: 13.0,             // m above keel: centroid of the crushed section's steel, 12.6-14.2 m over 5-40 m [derived; was 5.0]
```

**Range:** 60 to 150 MN. The fixed-face crush at 22.5 kn is 3,447 MJ divided by the force: 57 m at 60 MN, 28.7 m at 120 MN, 23 m at 150 MN. Against a free 100,000-t berg, multiply by 0.74.

**Optional depth laws** (s = crush from the stem head, m), if slow strikes matter:
- **B, the same full-speed result with a rising force [derived]:** F(s) = 84 MN + 2.5 MN/m x s. This is a least-squares line through the mean of the four static section-based laws (49 + 1.5 s MN) times a rate factor of 1.7. At 22.5 kn it crushes 28.8 m against a fixed face (Wilding) and 22.8 m against the free berg; at 10 kn, 7.3 m.
- **C, a weak riveted bow, as a what-if [derived from Paik et al. Fig. 60]:** 18 MN to 14.8 m, 52 MN to 28.9 m, 80 MN to 44.3 m, 88 MN beyond. The forepeak value is averaged from the stem head, so it carries the 5 m before first contact. At 22.5 kn it crushes about 58 m (four compartments open); at 10 kn about 23 m (their own 10-kn run: 24.7 m); at 6.2 kn the whole forepeak.

**What changes in the repo if adopted:** the constant stays, so nothing moves at the 1912 point, because the 1912 touch never meets the bow law. Changing `bowZ`, or adopting B or C, changes stem-strike nights only; those would need the encounter and night tests rerun. That is the lead session's call.

## 7. NOT FOUND

| Figure | Value | SI | Source (author, title, URL) | Short quote | Confidence |
|---|---|---|---|---|---|
| Hackett and Bedford (1996): a head-on estimate | NOT FOUND; the paper was not reachable, and secondary sources cite it only for flooding and the 12 sq ft area | - | - | - | - |
| Garzke, Woodward or the SNAME Marine Forensics Panel: a head-on estimate | NOT FOUND (only NIST's no-number statement, section 1c) | - | - | - | - |
| Hänninen: a bow crushing law | NOT FOUND under that name | - | - | - | - |
| Zhang (1999) L, T, X element formula as published | NOT FOUND (benchmark's equation layout lost) | - | - | - | - |
| Minorsky's original-unit formula and the 1959 case list (riveted or welded) | NOT FOUND | - | - | - | - |
| Woisin's own coefficient and the GKSS test ships and scales | NOT FOUND (0.88 sqrt(DWT) +-50 % appears attributed to Svensson 1981 [secondary]) | - | - | - | - |
| AASHTO bow damage depth formula | NOT FOUND | - | - | - | - |
| Pedersen et al. (1993): sizes of the six ice-class ships | NOT FOUND | - | - | - | - |
| Titanic's deadweight | NOT FOUND (Chirnside: unloaded she weighed 480 t more than Olympic; no absolute figure), https://markchirnside.co.uk/?p=1417 | - | - | - | - |
| Her forward deck plating, frame spacing, which decks reach the stem | NOT FOUND (amidships values used; section 3 bets) | - | - | - | - |
| Liu, Amdahl and Løset (2011), iceberg against a foreship: findings | NOT FOUND (paywalled; the thesis link did not resolve) | - | - | - | - |
| Daley's class P0 table and his 1999 paper | NOT FOUND (author's server unreachable; the web archive refuses scripts) | - | - | - | - |
| Zhang and Pedersen (2026) head-on formulas | NOT FOUND (embargoed to 2027-12-09) | - | - | - | - |
| Eurocode EN 1991-1-7 text | not opened; its adoption of the 1993 law is per Pedersen, Chen, Zhu 2020 | - | - | - | - |
| Tests of riveted against welded bows in axial crushing | NOT FOUND | - | - | - | - |
| Splitting load of a 100,000 t berg under a bow | NOT FOUND | - | - | - | - |

## 8. Method notes

- **Extraction.** PDF text was extracted with a dependency-free reader (scratchpad `bow_work/pdftext2.js`). Equations pasted from Word were read from their form objects (`pdfform.js`) and rebuilt from glyph positions. Each rebuilt equation was checked by reproducing the paper's own table values (section 1a).
- **Figures.** Paik et al.'s vector figures were rasterized (`formraster.js`) to read them, and their curves taken from the paths (`formcurves.js`, `fig60_integrate.js`).
- **Calculation.** All arithmetic for this ship is in `bowcrush.js`. It ports the repo's hull-form formulas and runs nothing in the repo.
- **What the section-based numbers rest on.** They depend on the structure bets of section 3. Halving the deck thickness lowers them by about 20 to 30 % (decks are 20 to 50 % of the steel), and the rate factor is the largest single term. Read them as a band, not a measurement.
- **Wilding's figure.** It is an expert estimate by her builder's naval architect, who knew her scantlings. It is not a calculation on record, and it stands in for no test.
