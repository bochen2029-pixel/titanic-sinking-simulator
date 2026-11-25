# K6: the wave field's method against Wigley's hull, and what two bulb-less benchmarks say about her bow, v1.1

- **Written:** 2026-11-20, 20:08 CST, by the wake lane (Claude Code, "Titanic simulator model accuracy (fork 2)", branch `wt/wake`).
- **Supersedes:** `RESULT_k6_wigley_benchmark_v1_2026-11-20.md` (committed in `f60b28c`), which is left unchanged.
  - v1 left a factor of two open in the unit of the Wigley table, and so bracketed the bet at 2.8 or 6.3.
  - Bo then supplied three sources: Noblesse and others (2008), the 17th ITTC's Resistance Committee report (1984), and the preprint arXiv 2610.14027. They settle it (section 2.1).
  - Read so, Wigley's hull agrees with the Series 60. **The bet stands for both, and v1's qualification of the Series 60 note's section 5.1 is withdrawn.**
  - Also changed from v1:
    - the bow-wave relation is now the published one, read (section 3);
    - the local flow does not help on Wigley's hull (section 4.4);
    - where the crests stand (section 4.3).
- **Why:** K6 moved to published tank data on Bo's word, "Yes, switch then".
- **Status:** the bet stands on both benchmark hulls, and the relation it was set by holds on both.
  - Her own waterline angle at the stem, measured from Bob Read's plans of Olympic (section 4.5), is blunter than the model's hull: about 21 to 24 degrees, against 16.6.
  - By that relation her bow wave is then 1.3 to 1.5 times the bet's (section 5.6).
  - Nothing in the library moves in this note. Raising the bet is the next step, with the page looked at.

## 1. The questions

1. Does Wigley's hull, a second bulb-less benchmark, agree with the Series 60 about the bow's bet (`CFG.bowPile` 3.5, dying away over `CFG.bowReach` 22 m)?
2. Does the bow-wave relation the bet was set by hold on both hulls?
3. Is the field's shallow midbody on the Series 60 (that note's 5.4) the hull's missing local flow?

## 2. The hull and the measurements

- **The source:** Kajitani, H., Miyata, H., Ikehata, M., Tanaka, H., Adachi, H., Namimatsu, M. and Ogiwara, S. (1983), "The summary of the cooperative experiment on Wigley parabolic model in Japan", for the 17th ITTC's Resistance Committee, Varna (DTIC ADP003037).
- **The hull** (its section 1): y = (B/2)(1 - (2x/L)^2)(1 - (z/D)^2), with L/B 10 and L/D 16.
  - Its waterline meets the stem at a half-angle of 11.3 degrees, against the Series 60's 7.0.
  - The wetted surface at rest is S = 0.661 L (2D + B).
  - Michell's integral on it at Fn 0.25 is Cw 1.063 x 10^-3. Peri's published value is 1.064 (`tools/wake_tests.js` row 1).
- **The profile:** Table 1, the wave elevation on the Ship Research Institute's 4.0 m model, held fixed at zero sinkage and trim.
  - At 21 places from the bow (2x/L = -1) to the stern (1), and at Fn 0.250, 0.267, 0.289 and 0.316.
  - Read from the scanned page at three times its print size, cell by cell.
- **The wave resistance:** the paper gives it only as Figure 2 (the same model, fixed). It was read from the figure: the circles' centres found on the page's pixels, and the axes on its gridlines (284.5 px to 10^-3).
  - The wave pattern's Cwp: 0.650, 0.576, 0.910 and 1.427 x 10^-3. The gain uses these.
  - The towing test's Cw (form factor 0.095): 0.594 (the mean of two runs), 0.596, 0.891 and 1.355 x 10^-3.

### 2.1 The table's unit, settled

- The paper defines its unit as g zeta / U^2 (its section 4, and the table's head). Three independent readers took the same numbers as 2 g zeta / U^2, that is zeta / (U^2 / 2g), the Series 60's unit:
  1. **The 17th ITTC's Resistance Committee** (Report, Gothenburg 1984, Fig. 8, "The wave profile for all hulls"). This was the committee that ran the cooperative experiment.
     - It plots these numbers (Wigley fixed, SRI and Tokyo, Fn 0.25: -0.16 at 2x/L -0.6, 0.22 at the stern, the crest about 0.42) on one "zeta" axis with the Series 60's fixed-model profiles.
     - The Series 60's, from DTNSRDC and four other tanks, crest at 0.26 to 0.30 with a stern of 0.17 to 0.28. Those are Kim and Jenkins's (1981) own values, and their unit is zeta / (U^2 / 2g).
  2. **The preprint** "SIREN: A nonlinear Rankine-source boundary element solver for the stationary motion of a marine vehicle in calm water" (arXiv 2610.14027, Fig. 2). It converts the same SRI data to zeta / L as 2 g zeta / U^2.
     - Its measured crest at Fn 0.25 is 0.0138 L, which is 0.440 x Fn^2 / 2. The same holds at the stem (0.006) and at Fn 0.289 and 0.316 (0.0170).
     - Its own linear solver puts the crest at about g zeta / U^2 = 0.115. The field here gives 0.107: two independent linear methods agree, at about half of the crest so read.
  3. **Noblesse and others' bow-wave relation** (section 3) gives 1.02 to 1.17 of the crest so read. Read as printed, the crest would stand at 0.68 to 0.88 of the Bernoulli limit (g zeta / U^2 = 1/2). The paper's own regime boundary (its eq. 5.3) puts a bow this fine (2 alpha_E = 22.6 degrees, F_D near 1) far from that limit.
- Noblesse and others used these same SRI and Tokyo data, and needed "an effective draught D and an effective waterline entrance angle" to bring them into "fair agreement". That fits taking the printed unit at its word.
- `tools/wigley_compare.js` now reads the table as 2 g zeta / U^2. `--stated` reads it as printed; v1's numbers are those.

## 3. The method

It is the same as the Series 60's (`tools/wigley_compare.js`, on the pattern of `tools/s60_compare.js`).

- The library's method is unchanged.
- The hull is run at her length: its length made her waterline's, 258.42 m, with a beam of 25.84 m and a draught of 16.15 m.
- Each place reads the 0.05 m cell at or just abaft it.
- The bow's fits use 2x/L -1 to -0.7 (0 to 39 m abaft the stem, the Series 60's stations 0 to 3).
- **The bow-wave relation, now read:** Noblesse, F., Delhommeau, G., Guilbaud, M., Hendrix, D. and Yang, C. (2008), "Simple analytical relations for ship bow waves", *J. Fluid Mech.* 600, 105-132.
  - Its eq. (4.1): Z_b g / U^2 = (2.2 / (1 + F_D)) tan(alpha_E) / cos(alpha_E). This is exactly what research note R8 recalled, so R8's open item B2 is closed. F_D = U / sqrt(g D), and alpha_E is the waterline's half-angle of entrance.
  - Its eq. (6.2) caps that at the Bernoulli limit, 1/2.
  - Its eq. (7.1): the crest stands T_b = (U^2 / g) 1.1 cos^7(alpha_E) / (1 + F_D) abaft the stem.
  - Its range: non-bulbous, wedge-shaped bows with small flare. Her plumb, unflared stem is inside it.
  - Both tools print both relations beside the tank's crest.
- **The hull's local flow** (`tools/local_flow.js`, `--local`): the double-body flow from the same thin-ship sources, checked against the 2D thin strut to 0.49 %.

To reproduce:

- `node tools/wigley_compare.js` (about 25 s; `--cw`, `--local`, `--stated`);
- `node tools/s60_compare.js` (`--local`);
- `node tools/local_flow.js`.

## 4. Results at her length [M]

### 4.1 Wigley's hull, Froude number by Froude number

| Fn | U | Michell over measured | Gain | Correlation, linear / piled | The field's height over the tank's: midbody / stern | The bow's crest: measured / linear / piled | Noblesse's crest (over the measured) | The pile fitted at 22 m |
|---|---|---|---|---|---|---|---|---|
| 0.250 | 12.59 m/s | 1.64 | 0.782 | 0.83 / 0.89 | 1.07 / 0.22 | 3.55 / 1.73 / 4.13 m | 3.62 m (1.02) | 2.59 |
| 0.267 | 13.44 m/s | 1.69 | 0.769 | 0.89 / 0.95 | 0.96 / 0.70 | 3.61 / 1.78 / 4.04 m | 4.00 m (1.11) | 2.58 |
| 0.289 | 14.55 m/s | 2.18 | 0.677 | 0.90 / 0.93 | 0.78 / 0.50 | 4.40 / 1.80 / 3.73 m | 4.49 m (1.02) | 3.49 |
| 0.316 | 15.91 m/s | 1.28 | 0.883 | 0.90 / 0.97 | 0.94 / 1.31 | 4.39 / 2.55 / 5.19 m | 5.11 m (1.17) | 2.66 |

- The midbody is 2x/L -0.6 to 0.7, and the stern 0.8 to 1.
- The measured crest is 0.34 to 0.44 of U^2 / 2g.

### 4.2 The bow's pile on both hulls, all Froude numbers together

The rms of the profile's error over the bow, in each table's own unit:

| Pile | Series 60 (zeta / (U^2/2g), six Fn) | Wigley (g zeta / U^2, four Fn) |
|---|---|---|
| None | 0.144 | 0.072 |
| **The bet: 3.5 over 22 m** | **0.060** | **0.044** |
| Fitted at 22 m | 3.69: 0.059 | 2.76: 0.035 |
| With the reach free | 4.66 over 13.5 m: 0.053 | 3.90 over 11.0 m: 0.027 |

- With the towing test's gain, Wigley's fit at 22 m is 2.82.
- As printed, it would be 6.33.

### 4.3 Where the bow's crest stands, metres abaft the stem

| Hull | Noblesse (7.1) | The tank's highest place | The field's highest place |
|---|---|---|---|
| Series 60, Fn 0.22 to 0.35 | 6.7 to 13.1 | 0 to 25 (its places are 12.7 m apart) | 12.7 to 38 |
| Wigley, Fn 0.25 to 0.316 | 7.7 to 10.9 | 6.5 | 12.9 to 19.4 |

### 4.4 The hull's local flow

The rms of (measured - field), averaged over the Froude numbers, then less the local flow read on the hull's surface:

| Hull | The bow | The midbody | The stern |
|---|---|---|---|
| Series 60 | 0.137, then 0.109 | 0.040, then 0.032 | 0.050, then 0.103 |
| Wigley | 0.071, then 0.102 | 0.012, then 0.016 | 0.026, then 0.137 |

### 4.5 Her waterline at the stem, from the plans of Olympic

- **The plans:** Bob Read's plan sheets of Olympic, "Olympic 1" (her starboard profile, as delivered by Harland and Wolff, 31 May 1911) and P3 (her underbody, ends and overhead). Copyright 2010 by Bob Read, licensed CC BY-NC-ND 4.0. Bo supplied them.
  - **Nothing from them enters this repository:** neither the drawings nor anything traced from them. The angles below are measurements, cited.
- **No sheet draws her waterlines,** so the plating does instead:
  - In the underbody view (her plan seen from below), every plating seam that reaches the stem meets the centre line where the stem stands at that seam's height.
  - Near the stem each seam runs nearly level, so its angle there approximates the waterline's at its height.
  - The profile sheet gives each seam's height: its draught marks, every foot from 13 to 42 ft, stand on the stem.
  - It also gives where the stem stands at that height, since the stem rakes aft going down: 1.19 m abaft the top at 36 ft, 1.28 m at 32.5 ft. Those are where the seams meet the centre line in plan.
- **How they were read:** the vector pages were rendered at high zoom, each seam's meeting point and angle found by scoring rays on the pixels, and the seam traced aft. The drawing's scales agree with her length and beam (269 m and 28.3 m). The method's scripts are in the lane's scratch folder, with the plans.
- **The seams' half-angles, as chords from the stem:**

| The seam's height at the stem | 1 m | 3 m | 6 m |
|---|---|---|---|
| about 27 ft | 22.3 deg | 20.8 deg | 19.8 deg |
| about 32.5 ft | 25.1 deg | 22.3 deg | 20.7 deg |
| about 36 ft | 28.1 deg | 24.2 deg | 21.8 deg |

- **Her waterline lies between the 32.5 and 36 ft seams:** 32.25 ft on the night, the model's mean draught of 9.83 m, or about 34.5 ft leaving Southampton.
  - Her half-angle is therefore about 22 to 24 degrees over the first 3 m, and 21 to 22 over 6 m.
  - Each seam rises a little toward the stem, about 4 degrees in profile. On a bow whose sections widen upward, that makes a seam's angle in plan smaller than the waterline's, so these are lower bounds.
- **The model's hull** (`C.halfBreadth`) is a straight 16.6 degree wedge at the stem: at the 9.83 m draught, 16.4 degrees as a chord at 3 m and 15.8 at 10 m (much the same at 10.54 m).

### 4.6 Wigley's profile at Fn 0.25, in metres at her length

| 2x/L | -1 (stem) | -0.95 | -0.9 | -0.85 | -0.8 | -0.6 | -0.5 | 0 | 0.4 | 0.9 | 0.95 | 1 (stern) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Measured | 1.55 | 3.55 | 2.97 | 2.00 | 0.84 | -1.29 | -0.97 | -0.45 | -0.71 | 0.19 | 0.65 | 1.81 |
| Linear | 0.57 | 1.21 | 1.73 | 1.52 | 1.11 | -1.11 | -1.24 | -0.07 | -0.60 | -0.23 | -0.31 | -0.02 |
| Piled | 2.00 | 3.45 | 4.13 | 3.09 | 1.96 | -1.11 | -1.24 | -0.07 | -0.60 | -0.23 | -0.31 | -0.02 |

## 5. What it says

1. **The waves are in the right places on Wigley's hull too.** The correlation along the hull is 0.83 to 0.90, and 0.89 to 0.97 with the pile.
2. **Noblesse's relation holds on both hulls.** It gives 0.83 to 1.01 of the Series 60's crest (a 7 degree bow) and 1.02 to 1.17 of Wigley's (11.3 degrees). This is the relation the bet was set to: 3.5 times her field's 1.26 m at 22.5 kn makes the relation's 4.4 m.
3. **The bet stands for both hulls.**
   - The pile that fits is 3.69 for the Series 60 and 2.76 for Wigley's hull, with the bet's 3.5 between.
   - The bet's error is barely above the fitted pile's on the Series 60 (0.060 against 0.059), and a quarter above it on Wigley's (0.044 against 0.035).
   - Without a pile the error is 2.4 and 1.6 times the bet's.
4. **The bet's height is right; its shape could be sharper.**
   - The tanks' crests stand where Noblesse's (7.1) puts them, roughly: 6 to 13 m abaft the stem at her length. The field's own crest stands about one place further aft.
   - With the reach free, both hulls want a shorter reach and a higher pile: 4.66 over 13.5 m, and 3.90 over 11.0 m. That gains a tenth (Series 60) to two-fifths (Wigley) on the bow's error.
   - The same factor drives the white water, which was set by eye. Moving it is its own step, with the page looked at (`wake_site`), so it is not taken here.
5. **The shallow midbody is the Series 60's, at low Froude numbers, not the field's in general.**
   - On Wigley's hull the field's midbody is 0.78 to 1.07 of the tank's. On the Series 60 it is 0.58 at Fn 0.22, rising to 0.93 at 0.32.
   - The hull's local flow trims the Series 60's midbody error by a fifth. It makes Wigley's worse everywhere, and doubles or more the error at both sterns.
   - So the local flow is not used. The Series 60's low-speed midbody stays a known shortfall of the field: her troughs are drawn about 0.6 as deep as that hull's tank would show at her Froude number.
6. **Her bow: the bet looks low for her.**
   - The bet was set so that her piled crest equals the relation's height for the model's hull, 16.6 degrees: 4.4 m at 22.5 kn (3.5 times her field's 1.26 m).
   - The plans (4.5) give her waterline about 21 to 24 degrees, which closes R8's open item B3.
   - By Noblesse's relation at 22.5 kn (F_D 1.18 at the model's 9.83 m draught):
     - 21 degrees gives 5.7 m;
     - 22 degrees gives 6.0 m;
     - 24 degrees gives 6.7 m.
     - Its cap (eq. 6.2) is the stagnation height, 6.8 m.
   - That is 1.3 to 1.5 times the bet. Matched on her field at 22.5 kn, the pile would be about 4.5 to 5.3 instead of 3.5.
   - Her bow wave stands just on the steady, overturning side of Noblesse and others' regime boundary (eq. 5.3). The boundary is F_D 0.81 at 21 degrees and 1.14 at 24 degrees, against her 1.18.
   - The two benchmarks say the relation holds to within about a sixth on bows of 7 and 11 degrees. Hers is blunter than either, but inside the relation's own data, which reach 30 degrees (Larrarte's struts).
   - So: the bet is not too high, and is probably low by a third to a half. The model's hull, at 16.6 degrees, is finer at the stem than the plans. That is the model's own geometry (the flooding core's hull), not the wake's, and it goes to the coordinator.

## 6. Not done, and next

- **Raise the bet to her measured angle** (5.6): set the pile so that her crest is the relation's height at about 22 degrees (6.0 m at 22.5 kn).
  - Weigh the shorter reach of 5.4 with it.
  - Check it on the page: `wake_tests`, `wake_site` and its pictures in a browser turn, and the white water looked at, since the same factor drives it.
  - That is the next step, and it changes what the page draws.
- **The model's hull at the stem** (16.6 degrees, against the plans' 21 to 24) is the flooding core's geometry. It is for the coordinator and the core's owners, not this lane.
- **The Series 60's shallow midbody at low speed** (5.5): the field's free waves miss it, and the hull's linear local flow does not mend it.
- **Nothing in the library moves on this note.** `CFG.bowPile` and `CFG.bowReach` stay 3.5 and 22 m.
