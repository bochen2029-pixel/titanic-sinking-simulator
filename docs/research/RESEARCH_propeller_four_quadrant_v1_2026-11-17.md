# Four-quadrant open-water data for the wing screws: thrust and torque astern, locked and windmilling

Written 2026-11-17 00:36 CST by a research subagent (Opus 5.5) for the lead session; public web sources only. Status: v1, complete for items 1 to 3; item 4 (measured stops from several speeds) mostly NOT FOUND beyond what the repo already holds.

Tags used below: **[quoted]** = read in the source opened (table, figure or equation named); **[derived]** = computed here from quoted data, method stated; **[secondary]** = seen reproduced in another source; **[from repo]** = taken from an existing file in `docs/research/`. Scripts and intermediate files are in the scratchpad (`r4q_work`), not in the repo.

## Summary: what the model should use, and why

1. **Real four-quadrant data exist and are public.** MARIN's 1984 harmonic analysis (30-term Fourier series in beta for 14 Wageningen B-series screws, thrust and torque) is reprinted in full in Roddy, Hess and Faller (2006), NSWCCD-50-TR-2006/004, Appendix B, "Approved for Public Release; Distribution Unlimited". I extracted all 14 tables from the PDF's text layer and evaluated them. The evaluation reproduces three independent checks: Tabaczek and Bugalski's (2014) table of CT* and CQ* at beta = 90 deg (13 of 14 exact to 4 decimals, the 14th off by a typo in Roddy's Table B2); the 146 symbols of Roddy's Figure 9 and the six curves of his Figure B1, read off the PDF's vector graphics (rms 0.0012-0.0016); and the independent Oosterveld and van Oossanen open-water polynomial (bollard K_T within 1-6 %, zero-thrust J within 0-3 %).
2. **Closest screw: B4-70 at P/D 1.4** (pitch 1.40 against the wing screw's 1.49). Its zero-thrust advance ratio is J0 = 1.469 and its ahead bollard K_T is 0.593 [derived from the series], which match the model's own J0 = 1.48 and a = 0.58 within 1-2 %. The normalised second-quadrant shape is insensitive to blade area (B4-40 to B4-100) and blade number (B3-65 to B5-75) and depends mainly on pitch [derived].
3. **The astern thrust grows about quadratically with J, not linearly.** For n < 0, Va > 0 (crash-back, beta 90-180 deg), B4-70 P/D 1.4 gives K_T(J)/K_T(0) = 0.94-0.97 for J = 0.25-0.5, then 1.97 at J = 1, 3.04 at 1.5, 4.35 at 2 and 8.56 at 3. A one-parameter fit 1 + 0.85 J^2 has rms 0.11 on J = 0..3. The model's guess 1 + J/1.48 gives 1.68, 2.01, 2.35 and 3.03 at those J: too weak above J of about 0.8, too strong below 0.6. The data's Va^2 term turns a reversed screw into a quadratic brake at speed, which is the direction the historical record wants (a weaker dependence of stopping distance on speed).
4. **Locked screw (n = 0) drag** as a drag coefficient on disc area and advance speed, C_D = -CT*(90 deg): 0.65 for B4-70 P/D 1.4, 0.67 for B3-65 P/D 1.0 [quoted]. Titanic's wing screws had a blade area of 160 sq ft (Harland and Wolff, via Chirnside), EAR 0.37 if that is developed area: then C_D is about 0.30 (two independent derivations: 0.30 from the series with a blade-area correction, 0.32 from Tabaczek and Bugalski's eq. 7). **Windmilling** (free shaft, zero torque) happens just beyond zero thrust, J = 1.51 for B4-70 P/D 1.4, with C_D of about 0.03: about 5 % of the locked drag (frictionless shaft).
5. **Recommended implementation:** carry CT*(beta) and CQ*(beta) as a table (or the 61 Fourier terms of Table B15, given below) and compute T = CT* (pi/8) rho D^2 (Va^2 + (0.7 pi n D)^2), Q = CQ* (pi/8) rho D^3 (Va^2 + (0.7 pi n D)^2). This one form covers all four quadrants, is continuous through n = 0 (locked) and through Va = 0 (bollard), and needs no special cases. Keep the model's own polynomial for 0 <= J <= J0 (MARIN's advice, via Roddy: the open-water polynomial is much better there than the four-quadrant series). A drop-in alternative for the present code is given in "For the model".
6. **Main caveats.** The B-series screws are modern (1930s-1970s) sections; Titanic's 1911 three-bladed bronze screws differ in sections, blade outline and boss. The 1912 screw has P/D 1.49, just beyond the series (P/D <= 1.4). The open-water data say nothing about the hull: behind the hull, with the screw reversed, the flow is not the open-water flow (one MMG data set, Esso Osaka, shows a different low-J shape). Treat the numbers as the best available shape, not as Titanic's screw.

## 1. Sources found, with the key figures

| Figure | Value | SI | Source (author, title, URL) | Short quote | Confidence |
|---|---|---|---|---|---|
| Four-quadrant Fourier coefficients, 14 B-series screws (B4-70 at P/D 0.5, 0.6, 0.8, 1.0, 1.2, 1.4; B4-40, -55, -85, -100, B3-65, B5-75, B6-80, B7-85 at P/D 1.0) | 31 rows k = 0..30 of A_T, B_T, A_Q, B_Q per screw (Tables B2-B15, PDF pp. 39-52) | - | Roddy, Hess, Faller, "Neural Network Predictions of the 4-Quadrant Wageningen Propeller Series", NSWCCD-50-TR-2006/004 (April 2006), https://apps.dtic.mil/sti/tr/pdf/ADA455497.pdf (DTIC was down; read the Internet Archive copy https://archive.org/details/DTIC_ADA455497) | "the open water results obtained with the coefficients in Reference 14 are substantially better" | High (data, verified three ways, sections 2-3) |
| Origin of the coefficients | MARIN report 60482-1-MS (1984), limited distribution; the coefficients are MARIN's | - | Same report, reference 15; also Roddy et al. 2007 below | - | High |
| Series form and conversions | CT* = (1/100) sum A_T cos(k beta) + B_T sin(k beta); CQ* = -(1/1000) sum (same with A_Q, B_Q); K_T = CT* (pi/8)(J^2 + (0.7 pi)^2) | - | Roddy 2006 Appendix B (PDF p. 38) and Roddy, Hess, Faller, "A Tool to Predict the Four-Quadrant Performance of the Wageningen B-Screw Series for Ship Performance Simulations", Ship Technology Research 54(3):103-113 (2007), doi 10.1179/str.2007.54.3.002, eqs. 1-6, read at https://fenix.tecnico.ulisboa.pt/downloadFile/1970943312401367/A%20Tool%20to%20Predict%20the%20Four%20Quadrant%20Performance%20of%20the%20Wageningen%20B%20Screw%20Series%20for%20Ship%20Performance%20Simulations.pdf | "this information must be supplemented with four-quadrant thrust and torque performance" | High |
| Quadrant names in beta | Q1 0-90 ahead; Q2 90-180 crash-back (n < 0, Va > 0); Q3 180-270 backing; Q4 270-360 crash-ahead | - | Roddy 2007, Table II; Roddy 2006, Table 3 | - | High |
| Typo in Roddy Table B2 (B4-100) | T-B(29) printed 3.14610E+00; 3.14610E-01 reproduces Tabaczek and Bugalski's CT*(90) = -1.0363 exactly and moves J0 from 1.148 to 1.050 (polynomial: 1.024) | - | [derived] from Roddy Table B2 and Tabaczek Table 1 | - | High (does not touch B3-65 or B4-70) |
| Possible small inconsistency, B4-70 P/D 0.6 torque | Roddy's Figure B1 -10CQ* curve differs from Table B12 by rms 0.017 (all other curves 0.002-0.003) | - | [derived], section 2 | - | Medium; irrelevant to the wing screw |
| van Lammeren et al. 1969 20-term series | Not used: some of its coefficients do not reproduce its own curves | - | Tabaczek and Bugalski 2014 (below), section 3 | - | Medium [secondary] |
| CT*, CQ* at beta = 90 deg (locked), all 14 screws | B4-70 P/D 1.4: -0.6545, -0.1364; B4-70 P/D 1.0: -0.7719, -0.1155; B3-65 P/D 1.0: -0.6660, -0.0962; B4-40 P/D 1.0: -0.3550, -0.0442 (full list in section 6) | C_D = 0.65, 0.77, 0.67, 0.36 | T. Tabaczek, T. Bugalski, "Drag and Torque on Locked Screw Propeller", TransNav 8(3):441-447 (2014), doi 10.12716/1001.08.03.16, Table 1, https://www.transnav.eu/files/Drag+and+Torque+on+Locked+Screw+Propeller,528.pdf | "approximated values of drag and torque may be overestimated by up to 30%" | High (computed by them from the same 30-term series) |
| Locked-screw regression, eq. (7) | CT* = z {4.28 x^2 - 2.61 x + 0.13} (-0.31 P/D + 1.31); CQ* = z {0.796 x^2 - 0.453 x + 0.026} (-0.30 (P/D)^2 + 1.35 P/D - 0.05); x = (AE/A0)/z; valid P/D 0.6-1.6, x 0.10-0.25; drag D = -0.125 CT* rho Va^2 pi D^2 | - | Tabaczek and Bugalski 2014, eqs. 4-7 | (quote above: 2-3 bladed may be overestimated up to 30 %; moderately skewed underestimated, +16 % allowance) | Medium |
| Titanic wing screws (maiden voyage) | 3 blades, diameter 23 ft 6 in, pitch 35 ft, blade area 160 sq ft; centre 3 blades, 17 ft, pitch 14 ft 6 in, 120 sq ft | D = 7.163 m, P/D = 1.489, A_blade = 14.86 m^2 | M. Chirnside, "Titanic: The Three-Blade Centre Propeller Dossier", https://markchirnside.co.uk/titanic-the-three-blade-centre-propeller-dossier/ (figures from a Harland and Wolff engineering notebook) | "Blade Area 160 square feet" | Medium-high for the figures; whether "blade area" is developed or projected is not stated |
| Titanic wing-screw blade-area ratio | 160 / (pi/4 x 23.5^2) = 0.369 if developed area; about 0.46 if 160 sq ft is projected area (projected/developed about 0.8 at P/D 1.5, my assumption) | EAR 0.37 (0.46) | [derived] | - | Medium (developed area is the usual meaning of "blade area" in builders' particulars, not verified for H&W) |
| Olympic's later screws | March 1913: wing 22 ft 9 in, pitch 36 ft, 165 sq ft | - | Chirnside dossier (as above) | - | Medium |
| MMG propeller-reversal thrust (n < 0, u >= 0) | X_P = rho n^2 D^4 (C6 + C7 J_s) if J_s >= C10, else rho n^2 D^4 C3; J_s = u/(n D) (no wake factor; negative here); t_P = 0 for n < 0 | - | R. Sawada et al., "Perspective on the Marine Simulator for Autonomous Vessel Development", J. Mar. Sci. Technol. (2024), arXiv 2407.19673, appendix Eq. 45, https://arxiv.org/html/2407.19673 ; same in Y. Miyauchi, A. Maki, N. Umeda, D. M. Rachman, Y. Akimoto, "System parameter exploration of ship maneuvering model for automatic docking/berthing using CMA-ES", J. Mar. Sci. Technol. 27 (2022), arXiv 2111.06124, Eq. 11, https://arxiv.org/html/2111.06124 | - (read through a summarising fetch; no verbatim quote) | Medium for the form |
| Basis of that form | Captive model tests; Sawada et al. cite K. Hasegawa, T. Fukutomi, MCMC'94, pp. 197-210 (1994) | - | Sawada et al. 2024, refs [117], [113]-[115] | - | Medium; primary not opened |
| Values for the Esso Osaka 3 m model | C3 = -0.251, C6 = -0.175, C7 = 0.33, C10 = -0.233 (forward K_T = 0.3278 - 0.3323 J - 0.156 J^2; P/D 0.7151; D 0.084 m) | - | NAOE-5thLab, mmg-1p1r-simulator, `mmg_module/input_csv/MMG_params.csv` (params_init) and `principal_particulars.csv`, https://github.com/NAOE-5thLab/mmg-1p1r-simulator (LICENSE file: CC BY-NC-SA 4.0) | - | High as data read; low applicability to the liner (see section 7) |
| MMG standard method | Forward operation only (n > 0, u > 0); K_T = k2 J^2 + k1 J + k0 | - | Yasukawa and Yoshimura 2015 [from repo: RESEARCH_mmg_hull_rudder_propeller_models_v1, M1] | - | High |
| Quadratic-form thrust across reversal (tanker) | thrust = T_uu u^2/L + T_un u n + L T_nn abs(n) n; T_uu = -0.00695, T_un = -0.00063, T_nn = 0.0000354 (bis units) | - | van Berlekom and Goddard 1972 via Fossen's MSS `tanker.m` [from repo: RESEARCH_mmg_hull_rudder_propeller_models_v1, M8] | - | Medium [secondary] |
| Stopping distance model, straight track | S = A ln(1 + B) + C, ship lengths; A from mass over resistance coefficient (cargo 5-8, ferry 8-9, VLCC 14-16); B = resistance before the stop over astern thrust at rest (diesel 0.6-1.0, steam turbine 1.0-1.5); C = half the distance run while reversing (0.8-2.3 at 15 kn, 60 s) | - | IMO MSC/Circ.1053 (2002), Annex, Appendix 3, paras 3-12, Tables A3-1 to A3-3, read at https://www.traficom.fi/files/media/regulation/22701-MSC_1-Circ_1053_-_tulkinta_ship_manoeuvrability.pdf | "essentially a function of the ratio of astern power to ship displacement" | High (as the IMO's illustrative model) |
| Stop from half the speed (another, smaller ship) | 19 to 9.5 kn cut the distance only to 80-85 % | - | Wilding 1915 [from repo: RESEARCH_olympic_class_steering_propulsion_trials_v1, rows 123, 202] | (in that file) | Medium |
| Titanic and Olympic trial stops | Titanic about 18 kn, just over 3,000 ft, 3 min 15 s; Olympic about 22 kn, about the same distance or less | 914 m, 195 s | Wilding, BI 25295 and 1915 [from repo: same file, section 11] | (in that file) | High as testimony |

## 2. Formula used, and the checks

**Definitions** [quoted, Roddy 2007 eqs. 1-6; Roddy 2006 Appendix B]:

    beta = atan2(Va, 0.7 pi n D)                         (deg; 0 at ahead bollard, 90 locked, 180 astern bollard)
    CT*  = T / (0.5 rho (Va^2 + (0.7 pi n D)^2) (pi/4) D^2)
    CQ*  = Q / (0.5 rho (Va^2 + (0.7 pi n D)^2) (pi/4) D^3)
    CT*(beta) =  (1/100)  * sum_{k=0..30} [ A_T(k) cos(k beta) + B_T(k) sin(k beta) ]
    CQ*(beta) = -(1/1000) * sum_{k=0..30} [ A_Q(k) cos(k beta) + B_Q(k) sin(k beta) ]
    K_T = T/(rho n^2 D^4) = CT* (pi/8) (J^2 + (0.7 pi)^2),   K_Q = CQ* (pi/8) (J^2 + (0.7 pi)^2),   J = Va/(n D)

Sign convention [derived from the data]: T > 0 pushes the ship ahead; Q > 0 is the torque the engine must supply to turn the screw ahead. At beta = 90 deg both are negative: the locked screw is a drag, and the water drives it ahead (the shaft must hold it with astern torque).

**Checks** [derived]:

| Check | Result |
|---|---|
| CT*(90), CQ*(90) for all 14 screws against Tabaczek and Bugalski Table 1 (computed by them from the same 30-term series) | 13 of 14 CT* and 14 of 14 CQ* identical to 4 decimals; B4-100 CT* -1.0080 here against -1.0363: the Table B2 typo above |
| Roddy Figure 9 (PDF p. 21): the 146 symbols for B3-65 P/D 1.0, read from the PDF's vector paths with the axes calibrated on the grid lines | CT*: 73 points, rms 0.0012, max 0.003; -10CQ*: 73 points, rms 0.0016, max 0.0045. Examples: beta 120: plot -0.806, series -0.806; beta 180: plot -0.209, series -0.210 |
| Roddy Figure B1 (PDF p. 53): the six B4-70 curves | CT* rms 0.0016 (max 0.006) for all six pitches; -10CQ* rms 0.002-0.003 except P/D 0.6 (0.017). P/D 1.4 examples: beta 90: plot -0.654, series -0.654; beta 120: plot -0.759, series -0.758; beta 150: plot -0.474, series -0.471 |
| Independent open-water polynomial (Oosterveld and van Oossanen, Rn 2e6; Roddy Table A1) at the ahead bollard and zero thrust | B4-70 P/D 1.4: K_T(0) 0.593 series / 0.624 polynomial; J0 1.469 / 1.490. B3-65 P/D 1.0: 0.414 / 0.442; 1.056 / 1.056. B4-70 P/D 1.0: 0.450 / 0.455; 1.030 / 1.062 |
| First quadrant J = 0..1.4, B4-70 P/D 1.4 | K_T within -6 % to +15 %; the series runs low near the bollard (0.562 against 0.600 at J 0.1) and high near J0 (0.1014 against 0.0883 at J 1.3) |

What the checks prove: the series as printed and my evaluation of it are right, and the Fourier fit agrees with the separately fitted open-water data. The plot checks are against plots generated from the same MARIN coefficients (Roddy's "measured data" symbols are the reference-15 data), so they verify the evaluation, not the experiment. Measured raw four-quadrant points were not reached (MARIN 1984 is limited distribution; van Lammeren 1969 not opened).

## 3. Evaluated CT*(beta) and CQ*(beta), 5-degree steps, 0-360 deg

[derived] Evaluated from Roddy Tables B15 (B4-70 P/D 1.4), B14 (P/D 1.2), B4 (P/D 1.0) and B7 (B3-65 P/D 1.0) with the formula of section 2. Same series as the checks above.

| beta (deg) | B4-70 P/D 1.4 CT* | B4-70 P/D 1.4 CQ* | B4-70 P/D 1.2 CT* | B4-70 P/D 1.2 CQ* | B4-70 P/D 1.0 CT* | B4-70 P/D 1.0 CQ* | B3-65 P/D 1.0 CT* | B3-65 P/D 1.0 CQ* |
|---|---|---|---|---|---|---|---|---|
| 0 | 0.3125 | 0.0671 | 0.2734 | 0.0499 | 0.2369 | 0.0348 | 0.2182 | 0.0340 |
| 5 | 0.2820 | 0.0628 | 0.2435 | 0.0457 | 0.2015 | 0.0324 | 0.1922 | 0.0299 |
| 10 | 0.2462 | 0.0539 | 0.2027 | 0.0388 | 0.1637 | 0.0269 | 0.1626 | 0.0244 |
| 15 | 0.2024 | 0.0446 | 0.1530 | 0.0303 | 0.1104 | 0.0189 | 0.1031 | 0.0175 |
| 20 | 0.1571 | 0.0342 | 0.1053 | 0.0213 | 0.0595 | 0.0124 | 0.0514 | 0.0115 |
| 25 | 0.0997 | 0.0223 | 0.0483 | 0.0110 | 0.0014 | 0.0031 | 0.0050 | 0.0029 |
| 30 | 0.0463 | 0.0117 | -0.0061 | 0.0009 | -0.0624 | -0.0062 | -0.0377 | -0.0057 |
| 35 | -0.0170 | -0.0015 | -0.0755 | -0.0110 | -0.1304 | -0.0174 | -0.1171 | -0.0179 |
| 40 | -0.0829 | -0.0144 | -0.1514 | -0.0237 | -0.2114 | -0.0301 | -0.2057 | -0.0292 |
| 45 | -0.1563 | -0.0308 | -0.2359 | -0.0391 | -0.2963 | -0.0436 | -0.2840 | -0.0430 |
| 50 | -0.2451 | -0.0484 | -0.3291 | -0.0571 | -0.3956 | -0.0588 | -0.3740 | -0.0580 |
| 55 | -0.3412 | -0.0685 | -0.4249 | -0.0765 | -0.4993 | -0.0739 | -0.4824 | -0.0733 |
| 60 | -0.4453 | -0.0929 | -0.5393 | -0.0980 | -0.6044 | -0.0906 | -0.6051 | -0.0914 |
| 65 | -0.5465 | -0.1142 | -0.6517 | -0.1173 | -0.7023 | -0.1057 | -0.7172 | -0.1073 |
| 70 | -0.6415 | -0.1297 | -0.7403 | -0.1313 | -0.7817 | -0.1202 | -0.8351 | -0.1277 |
| 75 | -0.7223 | -0.1392 | -0.8058 | -0.1400 | -0.8480 | -0.1306 | -0.9329 | -0.1298 |
| 80 | -0.7734 | -0.1468 | -0.8371 | -0.1435 | -0.8692 | -0.1295 | -0.9253 | -0.1103 |
| 85 | -0.7376 | -0.1483 | -0.7873 | -0.1370 | -0.8340 | -0.1228 | -0.7894 | -0.1010 |
| 90 | -0.6545 | -0.1364 | -0.7092 | -0.1237 | -0.7719 | -0.1155 | -0.6660 | -0.0962 |
| 95 | -0.6305 | -0.1234 | -0.6895 | -0.1172 | -0.7329 | -0.1110 | -0.6435 | -0.0931 |
| 100 | -0.6347 | -0.1239 | -0.6887 | -0.1173 | -0.7299 | -0.1083 | -0.6395 | -0.0930 |
| 105 | -0.6543 | -0.1297 | -0.7041 | -0.1196 | -0.7402 | -0.1078 | -0.6458 | -0.0934 |
| 110 | -0.6907 | -0.1355 | -0.7295 | -0.1253 | -0.7559 | -0.1105 | -0.6812 | -0.0993 |
| 115 | -0.7228 | -0.1463 | -0.7505 | -0.1341 | -0.7550 | -0.1142 | -0.7536 | -0.1088 |
| 120 | -0.7579 | -0.1535 | -0.7614 | -0.1393 | -0.7313 | -0.1161 | -0.8064 | -0.1185 |
| 125 | -0.7601 | -0.1555 | -0.7118 | -0.1332 | -0.6812 | -0.1094 | -0.7773 | -0.1194 |
| 130 | -0.7100 | -0.1484 | -0.6458 | -0.1200 | -0.6202 | -0.0968 | -0.7137 | -0.1081 |
| 135 | -0.6332 | -0.1296 | -0.5832 | -0.1046 | -0.5592 | -0.0832 | -0.6223 | -0.0906 |
| 140 | -0.5760 | -0.1127 | -0.5212 | -0.0903 | -0.4918 | -0.0727 | -0.5422 | -0.0775 |
| 145 | -0.5290 | -0.0978 | -0.4767 | -0.0806 | -0.4391 | -0.0663 | -0.4635 | -0.0672 |
| 150 | -0.4723 | -0.0887 | -0.4220 | -0.0734 | -0.3826 | -0.0589 | -0.3792 | -0.0565 |
| 155 | -0.4180 | -0.0846 | -0.3725 | -0.0666 | -0.3285 | -0.0513 | -0.3352 | -0.0511 |
| 160 | -0.3310 | -0.0698 | -0.2921 | -0.0537 | -0.2648 | -0.0396 | -0.2562 | -0.0396 |
| 165 | -0.2479 | -0.0550 | -0.1978 | -0.0406 | -0.1764 | -0.0278 | -0.1666 | -0.0262 |
| 170 | -0.2262 | -0.0559 | -0.1838 | -0.0390 | -0.1486 | -0.0257 | -0.1555 | -0.0264 |
| 175 | -0.2397 | -0.0613 | -0.2103 | -0.0437 | -0.1719 | -0.0304 | -0.1997 | -0.0340 |
| 180 | -0.2515 | -0.0632 | -0.2192 | -0.0479 | -0.1792 | -0.0333 | -0.2095 | -0.0351 |
| 185 | -0.2421 | -0.0608 | -0.2043 | -0.0448 | -0.1591 | -0.0291 | -0.1681 | -0.0298 |
| 190 | -0.2072 | -0.0517 | -0.1645 | -0.0365 | -0.1155 | -0.0221 | -0.1263 | -0.0248 |
| 195 | -0.1559 | -0.0420 | -0.1134 | -0.0280 | -0.0637 | -0.0140 | -0.0798 | -0.0165 |
| 200 | -0.1103 | -0.0293 | -0.0633 | -0.0166 | -0.0129 | -0.0059 | -0.0405 | -0.0089 |
| 205 | -0.0551 | -0.0156 | -0.0085 | -0.0059 | 0.0354 | 0.0029 | 0.0273 | 0.0006 |
| 210 | 0.0037 | -0.0034 | 0.0479 | 0.0064 | 0.0987 | 0.0137 | 0.0972 | 0.0123 |
| 215 | 0.0606 | 0.0117 | 0.1089 | 0.0192 | 0.1739 | 0.0236 | 0.1447 | 0.0228 |
| 220 | 0.1361 | 0.0249 | 0.1918 | 0.0325 | 0.2585 | 0.0368 | 0.2191 | 0.0371 |
| 225 | 0.2064 | 0.0424 | 0.2777 | 0.0499 | 0.3471 | 0.0508 | 0.3038 | 0.0501 |
| 230 | 0.2893 | 0.0612 | 0.3735 | 0.0667 | 0.4375 | 0.0664 | 0.4268 | 0.0687 |
| 235 | 0.3743 | 0.0818 | 0.4697 | 0.0847 | 0.5381 | 0.0822 | 0.5209 | 0.0843 |
| 240 | 0.4661 | 0.1036 | 0.5632 | 0.1020 | 0.6283 | 0.0970 | 0.6233 | 0.0982 |
| 245 | 0.5722 | 0.1196 | 0.6737 | 0.1223 | 0.7310 | 0.1137 | 0.7577 | 0.1179 |
| 250 | 0.6644 | 0.1452 | 0.7654 | 0.1427 | 0.8217 | 0.1261 | 0.8509 | 0.1320 |
| 255 | 0.8038 | 0.1666 | 0.8828 | 0.1626 | 0.9154 | 0.1472 | 0.9876 | 0.1561 |
| 260 | 0.8435 | 0.1964 | 0.9234 | 0.1847 | 0.9843 | 0.1483 | 0.9008 | 0.1459 |
| 265 | 0.6947 | 0.2112 | 0.7621 | 0.1602 | 0.8540 | 0.1112 | 0.6439 | 0.0986 |
| 270 | 0.5985 | 0.1549 | 0.6396 | 0.1146 | 0.6951 | 0.0957 | 0.6185 | 0.0902 |
| 275 | 0.5902 | 0.1216 | 0.6423 | 0.1128 | 0.6827 | 0.0998 | 0.6292 | 0.0952 |
| 280 | 0.5960 | 0.1342 | 0.6567 | 0.1171 | 0.6936 | 0.0999 | 0.6274 | 0.0946 |
| 285 | 0.6341 | 0.1328 | 0.6971 | 0.1202 | 0.7256 | 0.1063 | 0.6985 | 0.1026 |
| 290 | 0.6696 | 0.1420 | 0.7365 | 0.1292 | 0.7690 | 0.1106 | 0.7459 | 0.1062 |
| 295 | 0.7083 | 0.1500 | 0.7803 | 0.1334 | 0.8064 | 0.1188 | 0.7986 | 0.1159 |
| 300 | 0.7671 | 0.1594 | 0.8150 | 0.1463 | 0.8243 | 0.1228 | 0.8284 | 0.1229 |
| 305 | 0.7919 | 0.1736 | 0.7787 | 0.1393 | 0.7782 | 0.1098 | 0.8060 | 0.1156 |
| 310 | 0.7606 | 0.1622 | 0.7330 | 0.1200 | 0.7301 | 0.0975 | 0.7480 | 0.1041 |
| 315 | 0.7144 | 0.1405 | 0.6943 | 0.1136 | 0.6795 | 0.0904 | 0.6762 | 0.0952 |
| 320 | 0.6692 | 0.1265 | 0.6464 | 0.1051 | 0.6190 | 0.0832 | 0.6081 | 0.0872 |
| 325 | 0.6237 | 0.1203 | 0.6075 | 0.0991 | 0.5699 | 0.0769 | 0.5566 | 0.0791 |
| 330 | 0.5700 | 0.1102 | 0.5469 | 0.0895 | 0.5038 | 0.0696 | 0.5076 | 0.0726 |
| 335 | 0.5116 | 0.1026 | 0.4922 | 0.0801 | 0.4424 | 0.0620 | 0.4397 | 0.0653 |
| 340 | 0.4192 | 0.0854 | 0.4026 | 0.0687 | 0.3649 | 0.0521 | 0.3598 | 0.0551 |
| 345 | 0.2922 | 0.0543 | 0.2625 | 0.0453 | 0.2475 | 0.0361 | 0.2385 | 0.0370 |
| 350 | 0.2750 | 0.0574 | 0.2447 | 0.0421 | 0.1988 | 0.0296 | 0.1990 | 0.0302 |
| 355 | 0.3270 | 0.0713 | 0.2932 | 0.0519 | 0.2356 | 0.0348 | 0.2427 | 0.0366 |
| 360 | 0.3125 | 0.0671 | 0.2734 | 0.0499 | 0.2369 | 0.0348 | 0.2182 | 0.0340 |

Notes on the table [derived]: the wiggle near beta 165-175 (CT* -0.248, -0.226, -0.240 for P/D 1.4) is at the level of the 30-term series' ripple (about 0.02) and of the vortex-ring region near the astern bollard; do not read physics into it. The deeper minimum near beta 75-85 (CT* -0.77 at 80 for P/D 1.4, against -0.65 at 90) is in the plotted MARIN data too: a screw turning slowly ahead in a fast stream has slightly more drag than a locked one.

### Fourier coefficients of the recommended screw, B4-70 P/D 1.4

[quoted, Roddy 2006 Table B15, parsed from the PDF text and checked against the printed page]. Use with the formula of section 2 (beta in any angle unit, as long as k beta is in the same unit).

| k | A_T(k) | B_T(k) | A_Q(k) | B_Q(k) |
|---|---|---|---|---|
| 0 | 1.8891 | 0 | -6.273 | 0 |
| 1 | 28.033 | -65.683 | -59.067 | 137.18 |
| 2 | 1.886 | -0.23066 | 3.4811 | -0.060201 |
| 3 | 0.59973 | 7.4446 | -4.3989 | -20.555 |
| 4 | -1.0858 | -1.2398 | -0.4052 | 3.3632 |
| 5 | -6.4362 | 4.7921 | 11.843 | -8.9586 |
| 6 | -0.15631 | 0.71695 | 3.086 | -2.6638 |
| 7 | 5.0311 | 0.034276 | -13.137 | -0.9819 |
| 8 | -0.063924 | -0.29434 | -1.4057 | 2.2511 |
| 9 | -2.0315 | 2.0101 | 5.6834 | -0.87269 |
| 10 | 0.60866 | 0.27097 | 0.26129 | -3.1696 |
| 11 | 1.8917 | 0.1648 | -4.5913 | -3.3156 |
| 12 | -0.41935 | -0.17983 | -0.58107 | 2.1286 |
| 13 | 0.67181 | 1.0989 | -0.12353 | -1.0776 |
| 14 | 0.6423 | -0.16326 | -1.6486 | -1.3561 |
| 15 | 0.72715 | -1.3135 | -4.3524 | 2.0842 |
| 16 | -0.17483 | -0.0030559 | 0.95606 | 2.0193 |
| 17 | 0.17548 | 0.46619 | 2.0063 | 0.33011 |
| 18 | 0.3548 | -0.39988 | -0.67764 | -1.0371 |
| 19 | 0.0797 | -0.74616 | -2.086 | 1.3432 |
| 20 | -0.099109 | 0.018552 | 0.10021 | 1.2629 |
| 21 | 0.22019 | -0.091938 | 1.4317 | 0.39292 |
| 22 | -0.04753 | -0.41697 | -0.40246 | -0.15316 |
| 23 | -0.52461 | -0.30539 | -0.34768 | 1.2626 |
| 24 | 0.053469 | 0.14211 | 1.1234 | 1.106 |
| 25 | 0.09951 | 0.063486 | 1.822 | -0.76676 |
| 26 | -0.16191 | -0.27402 | -0.34224 | -0.71063 |
| 27 | -0.34163 | 0.0092732 | -0.67856 | 0.078099 |
| 28 | 0.025212 | 0.11064 | 0.8999 | 0.70479 |
| 29 | 0.0046286 | -0.017769 | 0.8462 | -0.66394 |
| 30 | -0.20432 | 0.0064717 | -0.084567 | -0.61846 |

The other 13 tables are on PDF pages 39-51 of the report (Tables B2-B14). Provenance for the repo's MIT licence: the numbers are MARIN's, published in a U.S. Government report cleared for unlimited public release; credit both if the table is embedded in code.

## 4. Effect of blade area, blade number and pitch on the crash-back shape

[derived] From the series: astern bollard K_T, ahead bollard K_T, their ratio, CT*(90), the one-parameter fit c2 of K_T(J)/K_T(0) = 1 + c2 J^2 on J = 0..3, and the ratio at J = 0.5, 1, 1.5, 2, 3.

| Screw | K_T(0) astern | K_T(0) ahead | astern/ahead | CT*(90) | c2 | ratio at J 0.5 / 1 / 1.5 / 2 / 3 |
|---|---|---|---|---|---|---|
| B4-40 P/D 1.0 | -0.252 | 0.384 | 0.66 | -0.355 | 1.23 | 0.93 / 2.31 / 4.19 / 6.63 / 11.09 |
| B4-55 P/D 1.0 | -0.294 | 0.418 | 0.70 | -0.579 | 1.21 | 1.04 / 2.18 / 3.69 / 5.89 / 11.57 |
| B4-70 P/D 1.0 | -0.340 | 0.450 | 0.76 | -0.772 | 1.08 | 0.90 / 2.18 / 3.53 / 5.32 / 10.63 |
| B4-85 P/D 1.0 | -0.367 | 0.467 | 0.79 | -0.963 | 1.07 | 0.94 / 2.22 / 3.55 / 5.32 / 10.51 |
| B4-100 P/D 1.0 (typo corrected) | -0.370 | 0.517 | 0.72 | -1.036 | 1.11 | 0.96 / 2.28 / 3.89 / 5.71 / 10.71 |
| B3-65 P/D 1.0 | -0.398 | 0.414 | 0.96 | -0.666 | 1.04 | 0.76 / 1.90 / 3.15 / 5.01 / 10.43 |
| B5-75 P/D 1.0 | -0.355 | 0.476 | 0.75 | -0.854 | 1.06 | 0.84 / 2.14 / 3.42 / 5.21 / 10.54 |
| B4-70 P/D 1.2 | -0.416 | 0.519 | 0.80 | -0.709 | 0.90 | 0.87 / 2.02 / 3.14 / 4.56 / 9.06 |
| **B4-70 P/D 1.4** | **-0.478** | **0.593** | **0.81** | **-0.654** | **0.85** | **0.97 / 1.97 / 3.04 / 4.35 / 8.56** |

Reading: the normalised shape moves little with blade area or blade number (c2 1.04-1.23 at P/D 1.0) and falls with pitch (0.85 at P/D 1.4). The locked drag CT*(90) scales almost with blade area (0.36 at EAR 0.40, 1.04 at EAR 1.00). The astern bollard thrust is 0.66-0.96 of the ahead bollard thrust at the same rpm.

## 5. A Titanic wing-screw estimate (derived)

Geometry: Z = 3, D = 7.163 m, P/D = 1.489, blade area 160 sq ft, EAR 0.369 if developed (section 1).

**Open water, first quadrant** [derived, Oosterveld and van Oossanen polynomial, P/D 1.489 slightly beyond its 1.4 limit]: K_T(0) = 0.496, J0 = 1.626, 10 K_Q(0) = 1.019 for EAR 0.369 (EAR 0.45: K_T(0) 0.544, J0 1.610; EAR 0.55: 0.602, 1.590). The model's a = 0.58 and J0 = 1.48 sit between this and B4-70 P/D 1.4; they were fitted to trial data, so keep them.

**Crash-back quadrant with a blade-area correction** [derived]: CT*_est(beta) = CT*_{B4-70, P/D 1.4}(beta) x [CT*_{B4-40, 1.0}(beta) / CT*_{B4-70, 1.0}(beta)], and the same for CQ*. In 90-180 deg none of the three curves crosses zero, so the ratio is well defined. It ignores the blade-number effect (B3-65 against B4-70 at P/D 1.0 differs by up to about 15 % across beta) and assumes the EAR effect at P/D 1.0 carries to P/D 1.4.

| beta | CT* B4-70 1.4 | EAR factor | CT* est | CQ* B4-70 1.4 | EAR factor (Q) | CQ* est |
|---|---|---|---|---|---|---|
| 90 | -0.6545 | 0.460 | -0.3010 | -0.1364 | 0.383 | -0.0522 |
| 95 | -0.6305 | 0.498 | -0.3137 | -0.1234 | 0.425 | -0.0525 |
| 100 | -0.6347 | 0.526 | -0.3338 | -0.1239 | 0.478 | -0.0593 |
| 105 | -0.6543 | 0.544 | -0.3558 | -0.1297 | 0.519 | -0.0673 |
| 110 | -0.6907 | 0.565 | -0.3899 | -0.1355 | 0.548 | -0.0743 |
| 115 | -0.7228 | 0.600 | -0.4339 | -0.1463 | 0.573 | -0.0838 |
| 120 | -0.7579 | 0.657 | -0.4976 | -0.1535 | 0.605 | -0.0929 |
| 125 | -0.7601 | 0.748 | -0.5684 | -0.1555 | 0.690 | -0.1073 |
| 130 | -0.7100 | 0.831 | -0.5904 | -0.1484 | 0.807 | -0.1198 |
| 135 | -0.6332 | 0.895 | -0.5669 | -0.1296 | 0.922 | -0.1196 |
| 140 | -0.5760 | 0.927 | -0.5342 | -0.1127 | 0.973 | -0.1096 |
| 145 | -0.5290 | 0.885 | -0.4680 | -0.0978 | 0.950 | -0.0930 |
| 150 | -0.4723 | 0.848 | -0.4004 | -0.0887 | 0.916 | -0.0813 |
| 155 | -0.4180 | 0.791 | -0.3307 | -0.0846 | 0.856 | -0.0725 |
| 160 | -0.3310 | 0.758 | -0.2507 | -0.0698 | 0.872 | -0.0609 |
| 165 | -0.2479 | 0.789 | -0.1956 | -0.0550 | 0.821 | -0.0452 |
| 170 | -0.2262 | 0.704 | -0.1593 | -0.0559 | 0.703 | -0.0393 |
| 175 | -0.2397 | 0.710 | -0.1702 | -0.0613 | 0.782 | -0.0479 |
| 180 | -0.2515 | 0.740 | -0.1860 | -0.0632 | 0.782 | -0.0495 |

Results: astern bollard K_T = -0.353 (0.71 of the polynomial's ahead 0.496); locked CT*(90) = -0.301, which agrees with Tabaczek and Bugalski's independent eq. (7) for z = 3, P/D 1.489, EAR 0.369 (-0.321); K_T(J)/K_T(0) = 0.89, 1.00, 1.41, 2.09, 2.81, 3.60, 4.55, 5.42, 6.28, 7.22, 8.15, 8.92 at J = 0.25 ... 3 (c2 fit 0.97). Confidence: medium-low (two corrections stacked, EAR itself uncertain).

## 6. Locked and windmilling screw

**Locked (n = 0, beta = 90 deg).** Drag D = C_D x 0.5 rho Va^2 (pi/4) D^2 with C_D = -CT*(90); torque needed to hold the shaft Q_hold = -CQ*(90) x 0.5 rho Va^2 (pi/4) D^3 (astern torque) [quoted definitions, Tabaczek eqs. 3 and final formulae].

| Screw | C_D = -CT*(90) | -CQ*(90) | Source |
|---|---|---|---|
| B4-70 P/D 0.5 / 0.6 / 0.8 / 1.0 / 1.2 / 1.4 | 0.782 / 0.794 / 0.796 / 0.772 / 0.709 / 0.655 | 0.058 / 0.069 / 0.095 / 0.116 / 0.124 / 0.136 | [quoted] Tabaczek Table 1; identical here |
| B4-40 / B4-55 / B4-85 / B4-100 P/D 1.0 | 0.355 / 0.580 / 0.963 / 1.036 | 0.044 / 0.073 / 0.144 / 0.151 | [quoted] same |
| B3-65 / B5-75 / B6-80 / B7-85 P/D 1.0 | 0.666 / 0.854 / 0.890 / 0.923 | 0.096 / 0.126 / 0.126 / 0.126 | [quoted] same |
| Eq. (7), z = 3, P/D 1.489, EAR 0.369 / 0.45 / 0.55 / 0.65 | 0.321 / 0.420 / 0.521 / 0.597 | 0.069 / 0.093 / 0.118 / 0.135 | [derived] from Tabaczek eq. 7; may be up to 30 % high for 3 blades |
| Titanic wing estimate (section 5) | 0.30 | 0.052 | [derived] |
| Eq. (7) check against the data | B3-65: 0.704 vs 0.666 (+6 %); B4-70 P/D 1.4: 0.686 vs 0.654 (+5 %) | - | [derived] |

Dimensional example, one Titanic wing screw locked at 18 kn [derived; w = 0.10 for a wing screw is an assumption from the repo's MMG note; rho = 1025]: Va = 8.33 m/s, 0.5 rho Va^2 (pi/4) D^2 = 1.43 MN. Drag 0.43 MN with C_D 0.30 (0.93 MN with the B4-70 P/D 1.4 value 0.65). Hold torque 0.53 MN m with -CQ* 0.052 (1.40 MN m with 0.136). For scale, a wing engine at 15,000 ihp and 75 rpm indicates about 1.4 MN m: at full speed it takes a good fraction of the engine's torque merely to stop the screw.

**Windmilling (free shaft, zero torque)** [derived from the series]: the first-quadrant zero of CQ*, just beyond the zero of CT*.

| Screw | beta at K_T = 0 (J0) | beta at K_Q = 0 (J_w) | CT* there | C_D on Va = -CT*/sin^2(beta) |
|---|---|---|---|---|
| B4-70 P/D 1.4 | 33.7 (1.469) | 34.4 (1.508) | -0.0094 | 0.029 |
| B4-70 P/D 1.2 | 29.5 (1.243) | 30.4 (1.291) | -0.0111 | 0.044 |
| B4-70 P/D 1.0 | 25.1 (1.030) | 26.6 (1.102) | -0.0196 | 0.098 |
| B3-65 P/D 1.0 | 25.6 (1.056) | 26.8 (1.111) | -0.0089 | 0.044 |

So a frictionless windmilling wing screw turns at about Va/(1.51 D), roughly 46 rpm at 18 kn, and drags about 5 % of the locked value. Shaft and engine friction move the operating point toward the locked state; the drag between the two follows the first-quadrant table beyond J0 in section 10.3 (C_D rises steeply from 0.02 at J 1.5 to 0.25 at J 2 and 0.49 at J 3).

## 7. How MMG-type models write the second quadrant

1. **MMG standard (Yasukawa and Yoshimura 2015)**: no reversal model; forward only [from repo].
2. **Japanese harbour-manoeuvring MMG (Osaka University line)** [form quoted via summary of Sawada et al. 2024 Eq. 45 and Miyauchi et al. 2022 Eq. 11; values quoted from the NAOE-5thLab CSV]:

       n < 0, u >= 0:  X_P = rho n^2 D^4 (C6 + C7 J_s)   if J_s >= C10
                       X_P = rho n^2 D^4 C3              if J_s <  C10,      J_s = u/(n D) (negative), t_P = 0
       Esso Osaka 3 m model (P/D 0.715): C3 = -0.251, C6 = -0.175, C7 = 0.33, C10 = -0.233

   With J = abs(J_s) this is K_T(J)/K_T(0) = 1 + 1.886 J up to J = 0.233, then a constant 1.434 [derived]. Side force and yaw moment are piecewise linear in J_s with breaks at -0.35 and -0.06. It is a captive-test fit behind the hull over the small J of berthing; the plateau is the end of the tested range, not physics at high J. It disagrees with the open-water shape at low J (open water: 0.93-0.97 at J 0.25 for the B4-70 family, a slight dip): the hull changes the reversed screw's inflow. Its licence (CC BY-NC-SA 4.0) matters if the numbers were ever embedded in code.
3. **Quadratic form across the reversal (van Berlekom and Goddard 1972)**: thrust = T_uu u^2/L + T_un u n + L T_nn abs(n) n [from repo, M8]. The fit in section 10.1 is exactly this form for the second quadrant, so the model can carry the B-series shape in three numbers.
4. **Four-quadrant open-water tables**: the general practice for crash-stop simulation (Roddy et al. 2007 make the point that open-water curves alone do not suffice for manoeuvring simulation). The beta form in section 10.5 is that practice.
5. Not reached: Yoshimura and Nomoto 1978 (propeller idling, boosting and reversing; J. SNAJ 144), Yasukawa and Kose 2003 (stopping of a tanker, Trans. West-Japan SNA 106), Hasegawa and Fukutomi 1994, Kitagawa et al. 2015 (third-quadrant rudder inflow), Ueno, Hachii.

## 8. Measured stopping from several initial speeds

Found nothing new beyond the repo's Wilding evidence (19 to 9.5 kn cut the distance only to 80-85 %; Olympic from about 22 kn about the same as Titanic from about 18 kn). See NOT FOUND for the sources tried.

What the IMO model says about speed dependence [derived from MSC/Circ.1053 Appendix 3]. With constant astern thrust T_a and resistance k V^2, S = A ln(1 + B) + C with B = k V0^2 / T_a and C proportional to V0. Halving V0 divides B by 4, so S(V0/2)/S(V0) = ln(1 + B/4)/ln(1 + B) for the A term: 0.32 at B = 1, 0.43 at B = 4, 0.59 at B = 20, 0.71 at B = 100; the C term alone gives 0.5. So 0.80-0.85 needs B of the order of thousands: a stop dominated by a V^2 brake, ending at a small residual speed rather than at zero. For a pure V^2 brake judged stopped at V_end, S(V0/2)/S(V0) = ln(V0/(2 V_end))/ln(V0/V_end): 0.77 for 19 kn and V_end = 1 kn, 0.81 for 0.5 kn.

What the B-series data add [derived]: in the crash-back quadrant at constant astern rpm, T = -T_a (1 + c1 J + c2 J^2) with c2 about 0.85, so the screw contributes c2 T_a (1 - w)^2/(n D)^2 to the V^2 coefficient (it acts like extra hull resistance), and that share grows when the engine can reach only a low astern rpm at high speed (larger J). The CQ* data quantify exactly that limit: the astern torque needed rises as about 0.8 J^2 (section 10.2). A torque-limited steam engine therefore puts a fast ship's stop deep into the drag-like regime and a slow ship's stop near the bollard regime. That is the mechanism by which the record's weak speed dependence can arise; whether it reaches 0.80-0.85 must be tested in the model with its own engine law.

## 9. NOT FOUND

| Item | What was tried | Status |
|---|---|---|
| van Lammeren, van Manen, Oosterveld 1969 (SNAME Trans. 77) Fourier tables | Searches; no open copy | NOT FOUND; superseded by MARIN 1984 for this purpose (Tabaczek: its coefficients do not all reproduce its curves) |
| Oosterveld 1970 thesis | Not searched to the end | NOT FOUND |
| MARIN report 60482-1-MS (1984) itself | Limited distribution | NOT FOUND (coefficients reached through Roddy 2006) |
| Raw measured four-quadrant points (not series-generated) | Roddy's plots carry series-generated "data" | NOT FOUND |
| Carlton, "Marine Propellers and Propulsion", four-quadrant chapter | Book, no open copy | NOT FOUND |
| Fossen's MSS four-quadrant B-series data | Not checked in this pass (from memory: MSS carries the first-quadrant K_T, K_Q polynomial only; unverified) | NOT CHECKED |
| Open-source code with B-series four-quadrant coefficients | GitHub searches: only first-quadrant polynomial libraries | NOT FOUND |
| B-series four-quadrant data at Z = 3, P/D 1.4-1.5 or EAR 0.35-0.40 | The 14 screws are the whole tested set; the neural-network program of Roddy 2006 that interpolates them is distributed on request, not online | NOT FOUND (estimate in section 5) |
| Drag of a windmilling screw, measured | Tabaczek notes the locked-versus-windmilling debate; no data found | NOT FOUND (series estimate in section 6) |
| Values of the MMG reversal coefficients for any full-scale merchant ship or liner | Only the Esso Osaka model-scale set | NOT FOUND |
| Yoshimura and Nomoto 1978; Yasukawa and Kose 2003; Hasegawa and Fukutomi 1994; Kitagawa 2015; Ueno; Hachii | Searches; Japanese journals not open as text | NOT FOUND |
| Measured crash stops of one ship from several speeds (Mariner/Compass Island, Morse and Price 1961, DTIC AD0271369; Esso Osaka 1977 trials; Harvald; Hooft; Clarke 1971; France's 1991 trials data to the IMO) | DTIC under maintenance; Internet Archive returned 503 for AD0271369; others not open | NOT FOUND |

## 10. For the model

All numbers in this section are [derived] from the MARIN series unless marked. J = Va/(abs(n) D) with Va the advance speed at the screw (after wake).

### 10.1 Thrust for n < 0, Va > 0 (crash-back), relative to J = 0

K_T(J)/K_T(0) at constant abs(n); K_T(0) is the astern bollard value (negative thrust).

| J | B4-70 P/D 1.4 | Titanic est. (sec. 5) | B4-70 P/D 1.2 | B4-70 P/D 1.0 | B3-65 P/D 1.0 | fit A, P/D 1.4 | fit B, P/D 1.4 | model now, 1 + J/1.48 |
|---|---|---|---|---|---|---|---|---|
| 0 | 1.000 | 1.00 | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 |
| 0.25 | 0.944 | 0.89 | 0.939 | 0.932 | 0.899 | 1.062 | 1.053 | 1.169 |
| 0.5 | 0.966 | 1.00 | 0.867 | 0.900 | 0.757 | 1.227 | 1.211 | 1.338 |
| 0.75 | 1.366 | 1.41 | 1.360 | 1.520 | 1.235 | 1.496 | 1.476 | 1.507 |
| 1.0 | 1.969 | 2.09 | 2.016 | 2.176 | 1.899 | 1.869 | 1.846 | 1.676 |
| 1.25 | 2.463 | 2.81 | 2.522 | 2.791 | 2.366 | 2.346 | 2.322 | 1.845 |
| 1.5 | 3.036 | 3.60 | 3.139 | 3.532 | 3.149 | 2.926 | 2.903 | 2.014 |
| 1.75 | 3.656 | 4.55 | 3.780 | 4.326 | 4.066 | 3.611 | 3.590 | 2.182 |
| 2.0 | 4.346 | 5.42 | 4.558 | 5.320 | 5.014 | 4.399 | 4.383 | 2.351 |
| 2.25 | 5.232 | 6.28 | 5.528 | 6.486 | 6.202 | 5.290 | 5.282 | 2.520 |
| 2.5 | 6.290 | 7.22 | 6.587 | 7.736 | 7.568 | 6.286 | 6.286 | 2.689 |
| 2.75 | 7.420 | 8.15 | 7.743 | 9.103 | 8.974 | 7.385 | 7.396 | 2.858 |
| 3.0 | 8.555 | 8.92 | 9.058 | 10.631 | 10.426 | 8.589 | 8.612 | 3.027 |
| 4 | 12.86 | - | 15.00 | 17.77 | 16.48 | - | - | 3.70 |
| 5 | 17.52 | - | 20.95 | 26.08 | 21.58 | - | - | 4.38 |
| 7 | 29.75 | - | 36.44 | 46.49 | 35.02 | - | - | 5.73 |
| 10 | 55.19 | - | 68.49 | 88.76 | 66.13 | - | - | 7.76 |

Fits (least squares on J = 0, 0.25, ..., 3; value 1 at J = 0 fixed):

| Fit | Form | Coefficients | rms | worst point |
|---|---|---|---|---|
| A, B4-70 P/D 1.4 | 1 + c1 J + c2 J^2 | c1 = 0.039, c2 = 0.830 | 0.106 | +0.26 at J 0.5 (27 %), the low-J dip |
| B, B4-70 P/D 1.4 (recommended) | 1 + c2 J^2 | c2 = 0.846 | 0.107 | +0.25 at J 0.5 |
| B, Titanic estimate | 1 + c2 J^2 | c2 = 0.97 | - | - |
| B, band over P/D 1.0-1.4, EAR 0.40-1.00, Z 3-5 | 1 + c2 J^2 | c2 = 0.85 to 1.23 | - | - |
| A, B3-65 P/D 1.0 | 1 + c1 J + c2 J^2 | c1 = -0.392, c2 = 1.194 | 0.123 | 46 % at J 0.5 |
| Model now | 1 + J/1.48 | - | 2.47 (against P/D 1.4) | -5.5 at J 3 |

Residuals of fit A for P/D 1.4 (fit minus data), J = 0.25 ... 3: +0.117, +0.261, +0.130, -0.100, -0.117, -0.109, -0.045, +0.053, +0.058, -0.004, -0.034, +0.033. Fit B: +0.109, +0.245, +0.110, -0.124, -0.141, -0.133, -0.066, +0.037, +0.050, -0.004, -0.023, +0.057.

In the model's dimensional form (n < 0, Va > 0) [derived]:

    T = - rho D^4 K_Ta ( n^2 + c1 abs(n) Va / D + c2 Va^2 / D^2 ),   K_Ta = abs(K_T(0)) astern,  c1 = 0, c2 = 0.85 (P/D 1.4; 0.97 Titanic estimate)

which replaces the present (n^2 + abs(n) Va/(D J0)). At n = 0 the J^2 form leaves T = -rho D^2 K_Ta c2 Va^2. With the B4-70 P/D 1.4 numbers that is 0.40 rho D^2 Va^2, against the locked value (pi/8) 0.655 rho D^2 Va^2 = 0.26 rho D^2 Va^2: the J-fit overstates the n -> 0 limit by about 55 % because it was fitted on J <= 3. Either blend to the locked value for J > 3 (abs(n) small) or use the beta form (10.5), which needs no blend. If the model refits fA with this law, the B-series astern/ahead bollard ratio at equal rpm (0.66-0.96; 0.81 for P/D 1.4; 0.71 for the Titanic estimate) is the sanity range: a fitted fA far below about 0.6 points at the engine's astern rpm or reversal time, not at the screw.

### 10.2 Torque for n < 0, Va > 0, relative to J = 0

K_Q(J)/K_Q(0), B4-70 P/D 1.4 (K_Q(0) astern = -0.1201): J = 0 ... 3 in steps of 0.25: 1.000, 0.961, 0.893, 1.154, 1.596, 1.851, 2.223, 2.794, 3.462, 4.280, 5.220, 6.153, 7.012; J 4, 5, 7, 10: 10.38, 14.00, 23.24, 43.51. Fit 1 + c1 J + c2 J^2: c1 = -0.334, c2 = 0.792, rms 0.078, worst 15 % (residuals J = 0.25 ... 3: +0.005, +0.138, +0.041, -0.138, -0.030, +0.058, +0.048, +0.039, -0.020, -0.103, -0.080, +0.116). Other screws: c1, c2 = -0.388, 0.882 (P/D 1.2); -0.372, 1.022 (P/D 1.0); -0.627, 1.168 (B3-65). Dimensional: Q = -rho D^5 K_Qa (n^2 + c1 abs(n) Va/D + c2 Va^2/D^2), the astern torque the engine must give; at n = 0 use the locked hold torque of section 6.

### 10.3 Thrust for n > 0 beyond zero thrust (J > J0, up to beta = 90 deg)

B4-70 P/D 1.4, K_T(0) = 0.593 ahead, J0 = 1.469:

| J | beta | CT* | K_T | K_T(J)/K_T(0) | C_D on Va = -CT*/sin^2 beta |
|---|---|---|---|---|---|
| 1.469 (J0) | 33.7 | 0 | 0 | 0 | 0 |
| 1.5 | 34.3 | -0.0075 | -0.0208 | -0.035 | 0.024 |
| 1.75 | 38.5 | -0.0635 | -0.1971 | -0.332 | 0.164 |
| 2.0 | 42.3 | -0.1142 | -0.3961 | -0.668 | 0.252 |
| 2.5 | 48.7 | -0.2206 | -0.9604 | -1.618 | 0.391 |
| 3.0 | 53.8 | -0.3164 | -1.7190 | -2.897 | 0.486 |
| 4.0 | 61.2 | -0.4700 | -3.8460 | -6.481 | 0.612 |
| 5.0 | 66.3 | -0.5713 | -6.6938 | -11.280 | 0.682 |
| 7.0 | 72.6 | -0.6848 | -14.478 | -24.40 | 0.752 |
| 10 | 77.6 | -0.7557 | -31.112 | -52.43 | 0.792 |
| 20 | 83.7 | -0.7561 | -120.21 | -202.6 | 0.765 |
| infinite (n = 0) | 90 | -0.6545 | - | - | 0.655 |

Fit for J0 <= J <= 5: K_T(J)/K_T(0) = -(0.908 x + 0.650 x^2), x = J - J0; rms 0.014, worst 0.027 (J 1.75: data -0.332, fit -0.307; J 3: -2.897 against -2.914; J 5: -11.28 against -11.31). Beyond J = 5 switch to the table or the beta form: the fit's x^2 term would give C_D 0.98 at infinite J against the true 0.655. The same rows for the other screws (P/D 1.2, 1.0, B3-65) were computed and follow the same pattern: C_D on Va reaches 0.80-0.99 near J 7-10 before falling to the locked value.

### 10.4 Locked and windmilling, in one line each

- Locked: D = C_D 0.5 rho Va^2 (pi/4) D^2; C_D = 0.65 for the B4-70 P/D 1.4 shape; **0.30 for Titanic's wing screws if 160 sq ft is developed area** (about 0.42 if projected), uncertainty about plus or minus 0.08. Hold torque coefficient 0.136 and 0.052 respectively.
- Windmilling (frictionless): J_w = 1.51 (P/D 1.4), C_D = 0.03; with friction, between that and the locked value along the 10.3 table.

### 10.5 Recommended implementation

1. Table CT*(beta), CQ*(beta) for B4-70 P/D 1.4 (section 3, 73 rows) with linear interpolation, or the 61 Fourier terms of Table B15 summed directly (31 cosines and 30 sines: cheap and smooth).
2. beta = atan2(Va, 0.7 pi n D) in 0-360 deg; T = CT* (pi/8) rho D^2 (Va^2 + (0.7 pi n D)^2); Q = CQ* (pi/8) rho D^3 (same). No division by n anywhere, so n = 0 and Va = 0 need no special case.
3. In the first quadrant up to J0 keep the model's fitted polynomial (a = 0.58, J0 = 1.48) and blend into the table over a few degrees of beta beyond J0 (Roddy 2006 did the same blend, their Figure 5).
4. Scale for Titanic: either use the table as is (B4-70 shape, EAR 0.70), or multiply its second-quadrant values by the EAR factor column of section 5 (0.46 at 90 deg rising to 0.70-0.93 at 130-180 deg). One scalar then remains to fit to the 914 m crash stop, in place of fA.
5. Acceptance checks for the new law: (a) at n = 0 the force equals the locked drag; (b) with the shaft free, the screw settles near J = 1.5 and the drag is a few per cent of locked; (c) J(T = 0) = J0; (d) the crash-stop distance ratio from about 9.5 and 19 kn moves toward the record's 0.80-0.85 (it cannot be expected to reach it from the screw law alone; see section 8).

### 10.6 Confidence

- Series and evaluation: high. Shape for a B-series screw of P/D 1.4: high. Applicability to a 1911 three-bladed screw of P/D 1.49 and EAR about 0.37: medium for the normalised crash-back shape (insensitive to EAR and Z in the data), medium-low for absolute levels and the locked drag (EAR uncertain, section-shape differences, behind-hull effects ignored).
- The low-J dip (J 0.25-0.5) is in every B-series curve but is opposite to the one behind-hull MMG set found (Esso Osaka rises linearly there). For a crash stop the J range that matters is about 0.5-2 (wing screw astern at roughly 40-60 rpm and 8-9 m/s advance speed gives J of about 1.2-1.8; my arithmetic), where the open-water data are firm.
