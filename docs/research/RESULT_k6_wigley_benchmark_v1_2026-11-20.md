# K6: the wave field's method against Wigley's hull, and what two bulb-less benchmarks say about her bow, v1

- **Written:** 2026-11-20, 19:38 CST, by the wake lane (Claude Code, "Titanic simulator model accuracy (fork 2)", branch `wt/wake`).
- **Follows:** `RESULT_k6_series60_benchmark_v1_2026-11-20.md`. **It qualifies that note's section 5.1** ("the bow's bet stands"). That holds for a bow as fine as the Series 60's. For a blunter bow such as hers, this note's answer is that the bet is bracketed, not confirmed (section 5).
- **Why:** K6 moved to published tank data on Bo's word, "Yes, switch then". Bo supplied the report.
- **Status:** the wave profile along Wigley's hull at four Froude numbers, at her length. The bow-wave relation the bet was set by is tested against both bulb-less hulls, and so is the hull's local flow. Nothing in the library moves.

## 1. The questions

1. Does Wigley's hull, a second bulb-less benchmark, agree with the Series 60 about the bow's bet (`CFG.bowPile` 3.5, dying away over `CFG.bowReach` 22 m)?
2. Does the bow-wave relation the bet was set by (research note R8, section 5) hold on both hulls?
3. Is the field's shallow midbody (the Series 60 note's 5.4) the hull's missing local flow?

## 2. The hull and the measurements

- **The source:** Kajitani, H., Miyata, H., Ikehata, M., Tanaka, H., Adachi, H., Namimatsu, M. and Ogiwara, S. (1983), "The summary of the cooperative experiment on Wigley parabolic model in Japan", for the 17th ITTC's Resistance Committee, Varna (DTIC ADP003037).
- **The hull** (its section 1): y = (B/2)(1 - (2x/L)^2)(1 - (z/D)^2), with L/B 10 and L/D 16.
  - Its waterline meets the stem at a half-angle of 11.3 degrees, against the Series 60's 7.0.
  - The wetted surface at rest is S = 0.661 L (2D + B).
  - Michell's integral on it at Fn 0.25 is Cw 1.063 x 10^-3. Peri's published value is 1.064 (`tools/wake_tests.js` row 1).
- **The profile:** Table 1, the wave elevation on the hull of the Ship Research Institute's 4.0 m model, held fixed at zero sinkage and trim.
  - At 21 places from the bow (2x/L = -1) to the stern (1), and at Fn 0.250, 0.267, 0.289 and 0.316.
  - **The unit:** the paper defines it as g zeta / U^2, in its section 4 and in the table's head. It is read so here, so zeta = value x U^2 / g. That is half of the Series 60's unit, zeta / (U^2 / 2g). Section 5.3 says why the factor of two is still a question.
  - The table was read from the scanned page at three times its print size, cell by cell. Its text layer is unusable.
- **The wave resistance:** the paper gives it only as Figure 2 (the same model, fixed). It was read from the figure for this note.
  - The wave pattern's Cwp (Newman-Sharma): 0.650, 0.576, 0.910 and 1.427 x 10^-3.
  - The towing test's Cw (form factor 0.095): 0.594 (the mean of two runs, 0.631 and 0.557), 0.596, 0.891 and 1.355 x 10^-3.
  - How they were read: the circles' centres were found on the page's pixels, and the axes calibrated on its gridlines, 284.5 px to 10^-3.
  - The gain uses Cwp, as the Series 60's used its wave-cut Cw. With Cw the pooled pile changes from 6.33 to 6.45.

## 3. The method

It is the same as the Series 60's (`tools/wigley_compare.js`, on the pattern of `tools/s60_compare.js`).

- The library's method is unchanged.
- The hull is run at her length: its length made her waterline's, 258.42 m, with a beam of 25.84 m and a draught of 16.15 m, at the same Froude numbers.
- Each place reads the 0.05 m cell at or just abaft it.
- The pile is fitted over 2x/L -1 to -0.7, which is 0 to 39 m abaft the stem: the Series 60's stations 0 to 3.
- The midbody is 2x/L -0.6 to 0.7 and the stern 0.8 to 1, the Series 60's stations 4 to 17 and 18 to 20.
- Two new pieces:
  - **The bow-wave relation**, as research note R8 recalled it (section 5 there; a bet, its paper not read): Z_b = (U^2/g)(2.2 / (1 + F_D)) tan(a) / cos(a), with F_D = U / sqrt(g D) and a the waterline's half-angle at the stem. Both tools now print it beside the measured crest.
  - **The hull's local flow** (`tools/local_flow.js`): the double-body flow from the same thin-ship sources, with the water's surface held flat. Its surface falls where the water speeds up and rises where it slows, in proportion to U^2 / 2g at every speed.
    - The module checks itself against two-dimensional thin-strut theory, to within 0.49 % amidships.
    - Both tools take `--local`.

To reproduce:

- `node tools/wigley_compare.js` (about 25 s); `--cw` for the towing test's gain, `--local`, and `--half` (section 5.3).
- `node tools/s60_compare.js --local`.
- `node tools/local_flow.js`.

## 4. Results at her length [M]

### 4.1 Wigley's hull, Froude number by Froude number (the profile read as its paper states)

| Fn | U | Michell over measured | Gain | Correlation, linear / piled | The field's height over the tank's: midbody / stern | The bow's crest (2x/L -1 to -0.8): measured / linear / piled | The relation's crest (over the measured) | The pile fitted at 22 m |
|---|---|---|---|---|---|---|---|---|
| 0.250 | 12.59 m/s | 1.64 | 0.782 | 0.83 / 0.89 | 0.54 / 0.11 | 7.11 / 1.73 / 4.13 m | 3.62 m (0.51) | 5.89 |
| 0.267 | 13.44 m/s | 1.69 | 0.769 | 0.89 / 0.95 | 0.48 / 0.35 | 7.22 / 1.78 / 4.04 m | 4.00 m (0.55) | 5.94 |
| 0.289 | 14.55 m/s | 2.18 | 0.677 | 0.90 / 0.93 | 0.39 / 0.25 | 8.81 / 1.80 / 3.73 m | 4.49 m (0.51) | 7.82 |
| 0.316 | 15.91 m/s | 1.28 | 0.883 | 0.90 / 0.97 | 0.47 / 0.66 | 8.77 / 2.55 / 5.19 m | 5.11 m (0.58) | 6.27 |

- Read so, the measured crest is 0.68 to 0.88 of the stagnation height U^2 / 2g.
- All four together (the error's rms over the bow, in g zeta / U^2):
  - none 0.198;
  - the bet, 3.5 over 22 m: 0.116;
  - fitted at 22 m: 6.33 (0.058);
  - with the reach free: 7.62 over 15.5 m (0.051).

### 4.2 The bow-wave relation on the Series 60 (`tools/s60_compare.js`, half-angle 7.0 degrees)

| Fn | 0.22 | 0.25 | 0.28 | 0.30 | 0.32 | 0.35 |
|---|---|---|---|---|---|---|
| The relation's crest over the measured | 1.01 | 0.84 | 0.94 | 0.90 | 0.87 | 0.83 |
| The measured crest, of U^2 / 2g | 0.28 | 0.31 | 0.26 | 0.26 | 0.26 | 0.26 |

### 4.3 The hull's local flow (`--local`)

The rms of (measured - field), averaged over the Froude numbers, before and after taking away the local flow read on the hull's surface:

| Hull | The bow | The midbody | The stern |
|---|---|---|---|
| Series 60, zeta / (U^2/2g) | 0.137, then 0.109 | 0.040, then 0.032 | 0.050, then 0.103 |
| Wigley, g zeta / U^2 | 0.196, then 0.176 | 0.050, then 0.037 (0.032 on the centre plane) | 0.053, then 0.111 |

- On Wigley's smooth hull, the centre plane (thin-ship theory's own reading) does about as well. On the Series 60 it fails: its offsets kink at every station, and there the centre-plane value is singular.
- Close to the stern, the local flow is what the tank shows: on Wigley's hull at 2x/L 0.95, 0.049 against 0.050. At the stern itself it overshoots.
- At the bow's crest (2x/L -0.95 to -0.85) it gives 0.05 to 0.00, against a gap of 0.33 to 0.17.

### 4.4 Wigley's profile at Fn 0.25, in metres at her length

| 2x/L | -1 (stem) | -0.95 | -0.9 | -0.85 | -0.8 | -0.6 | -0.5 | 0 | 0.4 | 0.9 | 0.95 | 1 (stern) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Measured | 3.10 | 7.11 | 5.94 | 4.01 | 1.68 | -2.58 | -1.94 | -0.90 | -1.42 | 0.39 | 1.29 | 3.62 |
| Linear | 0.57 | 1.21 | 1.73 | 1.52 | 1.11 | -1.11 | -1.24 | -0.07 | -0.60 | -0.23 | -0.31 | -0.02 |
| Piled | 2.00 | 3.45 | 4.13 | 3.09 | 1.96 | -1.11 | -1.24 | -0.07 | -0.60 | -0.23 | -0.31 | -0.02 |

The tool prints all 21 places, at Fn 0.25 and 0.289.

## 5. What it says

1. **The waves are in the right places on Wigley's hull too.** The correlation along the whole hull is 0.83 to 0.90, and 0.89 to 0.97 with the pile.
2. **Read as its paper states, Wigley's bow wants nearly twice the bet.**
   - Its crest stands 6.5 m abaft the stem, at 0.68 to 0.88 of the stagnation height. That is about four times the field's.
   - The pile that fits is 6.33 at the bet's 22 m reach, pooled; the bet's error is twice the fitted one's.
   - The relation the bet was set by gives half that crest at every Froude number (0.51 to 0.58 of it).
   - On the Series 60 the same relation gives 0.83 to 1.01 of the crest, and that bow wants 3.69.
   - So, read so, the relation follows the bow's angle too weakly. At Fn 0.25 the tank's crest is about 2.8 times the Series 60's in units of U^2 / 2g, while the relation makes it 1.7 times.
3. **The factor of two is a question this note cannot settle.**
   - Read at half (`--half`, as if the table were 2 g zeta / U^2, the Series 60's unit), everything agrees:
     - the relation gives 1.02 to 1.17 of the crest;
     - the field's midbody is 0.78 to 1.07 of the tank's;
     - the pile that fits is 2.76 at 22 m (the bet's error 0.044 against the fit's 0.035, none 0.072).
   - Read as stated, Wigley's hull disagrees with the Series 60 on all three.
   - The paper's text and table say g zeta / U^2, and that stands until a second publication of these data says otherwise.
   - One outside check: the preprint "SIREN: A nonlinear Rankine-source boundary element solver for the stationary motion of a marine vehicle in calm water" (arXiv 2610.14027, section 7.3) compares its linear and nonlinear computations with the same SRI data. Both fall short of the bow crest "by a roughly constant fraction of its height". Its figures carry no axis label and it gives no crest values, so it does not settle the unit either.
4. **The midbody's troughs are partly the hull's local flow, but its bow crest is not.**
   - Taking the local flow away cuts the midbody's error by a fifth (Series 60) and a quarter to a third (Wigley).
   - It doubles the error at the stern, where the boundary layer takes away the potential flow's rise. Using it would need a bet there.
   - At the bow's crest it explains a tenth to a fifth. The crest is a nonlinear bow wave, which no linear term holds. That is what the pile stands for.
   - So the local flow does not replace the pile, and does not by itself mend the midbody. It is a candidate for later, with a stern bet, and is not used.
5. **Her bow.**
   - Research note R8 put her waterline's half-angle at the stem at about 16.6 degrees on the model's hull (her real one between 12 and 17 degrees: its open item B3). That is blunter than both hulls.
   - The relation gives her crest as 4.4 m at 22.5 kn: 0.64 of U^2 / 2g, 6.8 m. That is what the bet was set to.
   - If Wigley's hull, read as stated, is the guide, a bow blunter than the Series 60's makes about twice the relation's crest. Hers could stand up to the stagnation height, about 6.8 m: up to 1.5 times the bet.
   - If it is read at half, the relation holds on both hulls, and so does the bet.
   - **Decision (the lane's, on Bo's standing word):** the bet stays at 3.5 over 22 m.
     - The Series 60 confirms it for a fine bow.
     - Wigley's hull brackets it at 2.8 or 6.3, on a factor of two not yet settled.
     - It also drives the white water, which was set by eye.
     - It is not above a fine bow's need, and may be below a blunt bow's.

## 6. Not done, and next

Three readings would settle her bow:

- **The unit of Kajitani's Table 1:** a second publication of the SRI fixed-model profiles, with its unit stated. Candidates: the 17th ITTC's Resistance Committee report (Göteborg, 1984), or a validation paper that tabulates these data.
- **Noblesse, Delhommeau, Guilbaud, Hendrix and Yang (2008),** "Simple analytical relations for ship bow waves", *J. Fluid Mech.* 600, 105-132. Its own formula would replace R8's recollection (R8's open item B2). Its data set may include Wigley's hull.
- **Her real waterline at the stem,** from a lines plan of Olympic or Titanic (R8's B3).

Then:

- the pile set from the relation with her real angle, checked on both hulls;
- if the local flow is used, the pile refitted on top of it, with a bet for the stern and the white water looked at again.

**Nothing in the library moves on this note.**
