# K6: the wave field's method against a bulb-less benchmark hull's tank measurements (the Series 60, CB 0.60), v1

- **Written:** 2026-11-20, 19:13 CST, by the wake lane (Claude Code, "Titanic simulator model accuracy (fork 2)", branch `wt/wake`).
- **Follows:** `RESULT_k6_kcs_benchmark_v1_1_2026-11-20.md`, whose section 6 named this benchmark. The KCS's bulbous bow kept it from setting her bow's bet.
- **Why:** K6 moved to published tank data on Bo's word, "Yes, switch then". Bo supplied the report.
- **Status:** the wave profile along the hull at six Froude numbers, at her length and at its own. Nothing in the library moves.

## 1. The questions

1. Does the bow's bet (`CFG.bowPile` 3.5, dying away over `CFG.bowReach` 22 m) match what a real plumb, bulb-less bow does?
2. How high are the field's waves along a hull, against a tank?

## 2. The hull and the measurements

- **The source:** Kim, Y.H. and Jenkins, D. (1981), "Trim and sinkage effects on wave resistance with Series 60, CB = 0.60", DTNSRDC/SPD-1013-01, David W. Taylor Naval Ship Research and Development Center (DTIC ADA105972). It is approved for public release, distribution unlimited.
  - A 6.1 m model in the deep-water basin.
  - The data used here were taken with the model fixed at zero trim and sinkage, the condition thin-ship theory assumes.
- **The hull:** Table 1's particulars and Table 2's offsets, both from Todd (1953).
  - Lpp 121.92 m, LWL 123.96 m, beam 16.25 m, draught 6.50 m, CB 0.60, half-angle of entrance 7.0 degrees.
  - A plumb stem at the F.P., and no bulb.
  - Built from the offsets by `tools/s60_compare.js`:
    - volume 7,638 m3 against Table 1's 7,739 m3 of sea water (-1.3 %). Interpolating straight between the offsets' waterlines cuts the bilge's round;
    - waterplane 1,399.9 m2 against 1,398.7 m2.
  - Table 2 stops at the A.P. The waterline runs 2.04 m past it (LWL less Lpp), and is closed straight over that length [bet].
- **The measurements:**
  - **Table 3:** the wave profile along the hull with the model fixed, as zeta / (U^2 / 2g) (the report's equation 1).
    - 24 stations from the stem to the stern, at Fn 0.22, 0.25, 0.28, 0.30, 0.32 and 0.35.
    - Fn is on the waterline's length.
    - One value cannot be read in the scan (station 17 at Fn 0.32) and is left out.
  - **Table 6:** the wave resistance with the model fixed, from longitudinal wave cuts.
    - Cw = 0.176, 0.230, 1.011, 1.375, 1.316 and 1.780 x 10^-3 at those Froude numbers.
    - The report notes that the wave-cut method contains viscous effects implicitly.
  - **The gain's own uncertainty:** the residuary resistance less a form drag (CR - k CF, with k 0.10, from Table 6) gives 0.160 and 0.342 x 10^-3 at Fn 0.22 and 0.25. That is -9 % and +49 % on Cw, so -5 % and +22 % on the gain.

## 3. The method

It is the library's own, unchanged, as for the KCS.

- Michell's integral from the offsets (`hullGrid`, `michell`). The gain is sqrt(measured wave resistance / Michell's), given through `createWake`'s `o.scale`.
- The field is run steady for 150 s after the library's lead-in.
- The sea against the plating is read as the page reads it (`alongside`): linear, and with the bow's pile.
- **At her length.** The bet's lengths (the 22 m reach, the 3 m read-off) and the field's grids (4 m and 12 m cells) are hers.
  - So the hull is Froude-scaled to her waterline: 258.42 m at her mean draught, the library's own hull. That is 2.0847 times the Series 60's.
  - Every length goes with it, at the same Froude numbers.
  - Michell's integral scales exactly: the gains agree with the run at its own length to three figures.
  - `--own` runs it at its own 123.96 m as well (section 4.4).
- **The stem.** A station reads the 0.05 m cell at or just abaft it, so the stem reads as the page draws the water just abaft her stem.
  - The pile acts only abaft the stem, and the stem's nearest cell may lie forward of it.
  - A first scratch run read the nearest cell, 0.05 m forward of the stem, and so found the stem unpiled.
- **The fits.** The pile multiplies the crests by 1 + (P - 1) exp(-d / R), d metres abaft the stem.
  - P is fitted by least squares on stations 0 to 3, the bow's crest: 0 to 38 m abaft the stem at her length.
  - It is fitted twice: with R held at 22 m, and with both free (R from 2 to 120 m).
  - Pooled over the six Froude numbers, the fit is made in the table's own units, zeta / (U^2 / 2g), so each Froude number counts alike.

To reproduce: `node tools/s60_compare.js` (about 30 s; with `--own`, about 100 s).

## 4. Results [M]

### 4.1 At her length, Froude number by Froude number

| Fn | U | Michell over measured | Gain | Correlation, linear / piled | The field's height over the tank's: midbody (stations 4-17) / stern (18-20) | The bow's crest (stations 0-2): measured / linear / piled | The pile fitted at 22 m |
|---|---|---|---|---|---|---|---|
| 0.22 | 11.08 m/s | 3.0 | 0.573 | 0.89 / 0.93 | 0.58 / 0.97 | 1.72 / 0.95 / 2.29 m | 2.84 |
| 0.25 | 12.59 m/s | 4.2 | 0.487 | 0.88 / 0.97 | 0.65 / 0.89 | 2.51 / 0.95 / 2.12 m | 5.17 |
| 0.28 | 14.10 m/s | 3.8 | 0.516 | 0.89 / 0.92 | 0.73 / 0.60 | 2.64 / 1.27 / 2.42 m | 4.40 |
| 0.30 | 15.10 m/s | 2.4 | 0.645 | 0.87 / 0.91 | 0.84 / 0.69 | 3.05 / 1.78 / 3.19 m | 3.62 |
| 0.32 | 16.11 m/s | 1.8 | 0.749 | 0.92 / 0.95 | 0.93 / 0.49 | 3.44 / 2.24 / 4.01 m | 3.37 |
| 0.35 | 17.62 m/s | 2.0 | 0.715 | 0.95 / 0.98 | 0.89 / 0.80 | 4.10 / 2.31 / 4.13 m | 3.65 |

- "The field's height over the tank's" is the rms of the linear field over the rms of the measured, on those stations.
- Her own Froude number at 22.5 kn is 0.23, between the first two rows.
- Michell's own height (the field divided by the gain) overshoots instead: the midbody by 1.01 to 1.42 times, the stern by up to 1.83 times.

### 4.2 The bow's pile, all six together

The rms of the profile's error over stations 0 to 3, in units of U^2 / 2g:

| Pile | Error |
|---|---|
| None | 0.144 |
| The bet: 3.5 over 22 m | 0.060 |
| Fitted at 22 m: 3.69 | 0.059 |
| Fitted with the reach free: 4.66 over 13.5 m | 0.053 |

### 4.3 The profile at Fn 0.22, in metres at her length

| Station | Measured | Linear | Piled |
|---|---|---|---|
| 0 (stem) | 1.72 | 0.34 | 1.19 |
| 0.5 | 1.72 | 0.68 | 1.96 |
| 1 | 1.59 | 0.95 | 2.29 |
| 2 | 0.66 | 0.73 | 1.31 |
| 3 | 0.00 | 0.16 | 0.23 |
| 5 | -0.40 | -0.48 | -0.48 |
| 8 | -0.93 | -0.35 | -0.35 |
| 9 | -1.06 | -0.45 | -0.45 |
| 11 | -0.26 | -0.28 | -0.28 |
| 14 | -1.19 | -0.51 | -0.51 |
| 15 | -1.06 | -0.58 | -0.58 |
| 18 | 0.13 | 0.13 | 0.13 |
| 19 | 0.53 | 0.57 | 0.57 |
| 20 (A.P.) | 1.06 | 1.04 | 1.04 |

The tool prints all 24 stations, at Fn 0.22 and 0.25.

### 4.4 At its own length

- The gains are the same. The field is lower: abaft station 3 it is 0.57 to 0.80 of the tank's height, against 0.70 to 0.89 at her length.
  - Its waves are 2.08 times shorter on the same grids.
  - The read 3 m out is twice as far out in its terms.
- The pile fitted at 22 m, pooled, is 3.65, and the bet does as well (0.074 both). With the reach free it is 5.79 over 8.0 m (0.047): 16.7 m at her length.

## 5. What it says

1. **The bow's bet stands.**
   - Pooled over six Froude numbers, the pile that best fits a plumb, bulb-less bow at the bet's 22 m reach is 3.69. The bet's 3.5 does as well: 0.060 against 0.059 in units of U^2 / 2g.
   - Without a pile, the bow's error is 2.4 times as large.
   - Froude number by Froude number the best pile scatters from 2.8 to 5.2. At the two either side of hers it is 2.84 (Fn 0.22) and 5.17 (0.25). There the bet's crest is a third over the tank's at 0.22 and a sixth under it at 0.25.
2. **A better bet would change the bow's shape, not its height.**
   - The tank's crest stands right at the stem (stations 0 and 0.5 at Fn 0.22), while the field's builds up over the first 10 to 15 m.
   - A shorter reach with a higher pile fits better: about 4.7 over 13.5 m, pooled. But it gains only a tenth on the bow's error.
   - That is not enough to move a bet the white water was set against by eye (section 6).
3. **The field's waves are in the right places.**
   - The correlation along the whole hull is 0.87 to 0.95 at all six Froude numbers, and 0.91 to 0.98 with the pile.
   - That is better than on the KCS (0.80), whose bulb thin-ship theory cannot see.
4. **The midbody's troughs are too shallow, most of all at low Froude numbers.**
   - The field's midbody is 0.58 of the tank's at Fn 0.22, rising to 0.93 at 0.32.
   - At her Froude number it is about 0.6. So her waterline is drawn with its troughs about 60 % as deep as a tank would show.
   - The stern's rise is about right at Fn 0.22 and 0.25 (0.97 and 0.89), and low at higher Froude numbers (0.49 to 0.80).
   - **The trend points at a cause (a hypothesis, to be tested next).**
     - The field holds the hull's free waves only.
     - A tank's profile also holds the hull's local flow. The water speeds up past the midbody and its surface falls, in proportion to U^2 / 2g, and it rises at the stem.
     - That part is the same fraction of U^2 / 2g at every Froude number, while the free waves grow faster with speed. So it weighs most at the lowest Froude numbers, as the deficit does.
     - The KCS's midbody, at about two-thirds of the tank's, fits the same picture.
   - Scaling the field up instead does not fit. Michell's own height, unscaled, overshoots the midbody by up to 1.4 times and the stern by up to 1.8.
5. **At its own length the field is lower.** Abaft station 3 it is 0.57 to 0.80 of the tank's height, against 0.70 to 0.89 at hers. There the library is used outside the lengths it was made for. Her length is the honest test of what the page draws.

## 6. Not done, and next

- **The local flow** (the hypothesis in 5.4).
  - Compute the hull's double-body flow (the water's surface held flat) from the same thin-ship sources.
  - Add its fall along the midbody and its rise at the stem to the field, and compare again on the Series 60 and the KCS.
  - If it closes the midbody's deficit, it is a law, not a bet, and the bow's pile could shrink to what the stem alone needs.
  - Any change to `alongside` changes what the page draws (K4's waterline). It needs `wake_tests`, `wake_site` and the coordinator.
- **Wigley's hull** (Kajitani, Miyata and others 1983, DTIC ADP003037). It is symmetric fore and aft, so it separates the stern's viscous losses from the bow's.
- **The pile's shape** (5.2). If the local flow is added, the pile is refitted on top of it, with the white water's bets by eye, since `CFG.bowPile` acts there too.
- **Nothing in the library moves on this note.** `CFG.bowPile` and `CFG.bowReach` stay 3.5 and 22 m.
