# K6: the wave field's method against a benchmark hull's tank measurements (the KCS), v1.1

- **Written:** 2026-11-20, 18:44 CST, by the wake lane (Claude Code, "Titanic simulator model accuracy (fork 2)", branch `wt/wake`).
- **Supersedes:** `RESULT_k6_kcs_benchmark_v1_2026-11-20.md`, which is unchanged. This version adds the wave cuts away from the hull (section 4.1, section 5 item 4), from Kuhl (2020), which Bo supplied. It also names the two bulb-less benchmarks Bo supplied (section 6).
- **A correction to v1:** its header says it was written at 18:55 CST, a time not read from the clock. It was committed at 18:34 (`2353ae9`) and written just before.
- **Why:** K6 moved here on Bo's word, "Yes, switch then". It had been a FluidX3D towing tank, retired the same day (`docs/runbooks/K6_tank_on_the_rtx_machine.md` says why).
- **Status:** two comparisons: the wave profile along the hull (section 4) and the three wave cuts away from it (section 4.1).

## 1. The question

The wave field (`site/parts/24_wake_field.js`) builds her waves from Michell's thin-ship theory, scaled to a measured or estimated wave resistance. It piles her bow wave up near the stem by a bet (`CFG.bowPile` 3.5, dying away over `CFG.bowReach` 22 m).

Neither the method nor the bet had been checked against a tank. This note runs the method unchanged on a hull that has been measured, and compares.

## 2. The hull and the measurements

- **The hull:** the KCS (KRISO container ship), 230 m between perpendiculars, beam 32.2 m, draught 10.8 m, with a bulbous bow and a transom stern.
  - Its geometry is the Tokyo 2015 workshop's IGES (t2015.nmri.go.jp, `KCS_hull_SVA.zip`, "same data as G2010 and SIMMAN2014"). It is tabulated to half-breadths by `tools/iges_offsets.js`.
  - Against the published particulars: the volume under 10.8 m is 51,822 m3 (published 52,030, -0.4 %); the waterline 233.2 m (232.5); the beam 32.24 m.
  - **The geometry, and anything made from it, stays outside this repository.**
- **The measurements:** Kim, W.J., Van, S.H. and Kim, D.H. (2001), "Measurement of flows around modern commercial ship models", *Experiments in Fluids* 31, 567-578.
  - **Fig. 6:** the wave elevation along the hull at Fn 0.26 (24 kn at full scale), read from photographs by three people and averaged.
    - Its 22 markers were digitised for this note from the figure's pixels and axis ticks. One pixel is 7e-5 of her length.
    - The figure's own uncertainty is not stated.
  - **Section 3.1:** at the design speed, the residuary resistance coefficient is 0.725e-3 and the frictional one (ITTC 1957) 2.832e-3. Both were measured at zero trim and sinkage, the condition thin-ship theory assumes.
  - **A cross-check, from another tank:** Wang, Qiu, Wang and Wan (2020), ISOPE PACOMS, pp. 434-440 (CSSRC, 1:52.67). It puts the bow wave at Fn 0.26 at "roughly 13m" above the baseline at ship scale: about 2.2 m above the waterline, against Fig. 6's 2.46 m.

## 3. The method

It is the library's own, unchanged.

- The KCS's half-breadths go into `hullGrid`, and Michell's integral is computed by `michell`.
- The gain is sqrt(measured wave resistance / Michell's), given through `createWake`'s `o.scale` (`db26b45`).
  - The wave resistance is the residuary less the form drag: Cw = Cr - k Cf.
  - The form factor k is taken from 0.05 to 0.15, since the paper gives none.
- The field is run steady at 12.35 m/s for 150 s, after the library's lead-in.
- The sea against her plating is read as the page reads it: `alongside`, 3 m off the plating, on the port side, the side KRISO measured. It is read twice: linear, and with the bow's pile.

To reproduce:

```
node tools/iges_offsets.js <KCS_hull_SVA.igs> 10.8 <a path outside the repository>/kcs_offsets.json
node tools/kcs_compare.js <the same>/kcs_offsets.json
```

## 4. Results [M]

| Form factor k | Cw | Measured wave resistance | Michell's over it | Gain | Linear: rms, correlation | With the bow's pile: rms, correlation | First crest at X -0.475, linear / piled (measured 2.46 m) |
|---|---|---|---|---|---|---|---|
| 0.05 | 0.583e-3 | 429.8 kN | 6.2 | 0.402 | 0.65 m, 0.80 | 0.46 m, 0.91 | 0.49 / 1.44 m |
| 0.10 | 0.442e-3 | 325.5 kN | 8.2 | 0.350 | 0.68 m, 0.80 | 0.50 m, 0.91 | 0.43 / 1.25 m |
| 0.15 | 0.300e-3 | 221.2 kN | 12.1 | 0.288 | 0.72 m, 0.80 | 0.57 m, 0.91 | 0.35 / 1.03 m |

Michell's wave resistance for the KCS at Fn 0.26 is 2,665 kN, a Cw of 3.62e-3. It has converged:
- a hull grid twice as fine (0.25 m, 41 levels) gives 2,706 kN (+1.5 %);
- waves down to 0.26 m (kMax 24) add nothing;
- a grid twice as coarse (1 m, 11 levels) gives 2,529 kN (-5 %);
- cutting away the bulb forward of the waterline's stem changes it by 4 %.

So Michell's 6 to 12 times the measured wave resistance is thin-ship theory on a full, beamy, bulbous hull, not the integral's numbers. To the theory the bulb is only a little more volume, not a canceller of waves.

The profile at k = 0.10, in metres at full scale (X from -0.5, the F.P., to 0.5, the A.P.):

| X | Measured (Fig. 6) | Linear | With the bow's pile |
|---|---|---|---|
| -0.475 | 2.46 | 0.43 | 1.25 |
| -0.450 | 1.94 | 0.39 | 0.98 |
| -0.400 | 1.28 | 0.42 | 0.79 |
| -0.300 | -0.36 | 0.16 | 0.21 |
| -0.200 | -1.20 | -0.77 | -0.77 |
| -0.150 | -1.26 | -0.81 | -0.81 |
| -0.100 | -0.83 | -0.58 | -0.58 |
| 0.050 | 0.07 | 0.27 | 0.28 |
| 0.150 | -0.43 | -0.14 | -0.14 |
| 0.249 | -1.04 | -0.70 | -0.70 |
| 0.350 | -0.32 | -0.64 | -0.64 |
| 0.450 | 0.48 | 0.11 | 0.11 |
| 0.499 | 0.77 | 0.98 | 0.98 |

The tool prints all 22 points.

### 4.1 The wave cuts away from the hull [M]

- **The measurements:** KRISO's longitudinal cuts at y/Lpp 0.0741, 0.1509 and 0.4224, from the same 2001 measurements.
  - They are as plotted by Kuhl, J. (2020), "Cahn-Hilliard Navier-Stokes simulations for marine free-surface flows", arXiv 2002.04885, Fig. 13 (markers "Kim et. al (2001)").
  - 58, 59 and 60 markers were digitised from the figure's vector rendering, over x1/Lpp from -0.4 to 1.4.
  - The paper's convention: 0 at the A.P., 1 at the F.P.
  - The same cuts appear in Ozdemir et al. (2016), *Brodogradnja* 67(2), Fig. 13, as lines under their CFD.
- **The field:** read on her port side as the page reads it (y0^2 = y^2 - b^2). The bow's pile acts only against her plating, not here.

| Cut, y/Lpp | Correlation | The field's rms over the measured, k 0.05 / 0.10 / 0.15 | rms difference at k 0.10 |
|---|---|---|---|
| 0.0741, just off her side | 0.83 | 0.83 / 0.72 / 0.60 | 0.37 m |
| 0.1509, 35 m out | 0.82 | 0.69 / 0.60 / 0.50 | 0.25 m |
| 0.4224, 97 m out | 0.45 | 0.47 / 0.41 / 0.34 | 0.15 m |

## 5. What it says

1. **The method's wave system is in the right places.**
   - Along the hull, the crests and troughs fall where KRISO measured them: troughs at X -0.15 and 0.25, a crest at 0.05, a rise to the stern.
   - That spacing is her transverse wave, 2 pi Fn^2 = 0.425 of her length.
   - The linear field correlates 0.80 with the measured profile, whatever the form factor.
2. **One gain from the wave resistance leaves the midbody's waves at about two-thirds of their measured height:** -0.81 against -1.26 m at X -0.15, and -0.70 against -1.04 m at 0.25. Michell's integral gives this hull 6 to 12 times its measured wave resistance. The bulb is shaped to cancel waves, which thin-ship theory knows nothing of. So one gain that brings the energy right takes the midbody's waves down with the bow's.
3. **The bow's pile-up helps and is not too high.**
   - With it, the correlation rises to 0.91 and the rms falls by about a third.
   - The measured first crest is about 5.7 times the linear field's at 5.75 m abaft the F.P. (k 0.10). The bet gives 2.9 times there: 1 + 2.5 exp(-5.75 / 22).
   - For this hull the bet is low, not high.
4. **Off her side, the same holds as along the hull, and fails far out.**
   - In the near and middle cuts (17 and 35 m out) the field's waves are in the measured places: correlation 0.82 and 0.83.
   - Their height is again about two-thirds of measured: 0.60 to 0.83 of the measured rms, with the form factor.
   - In the far cut, 97 m out, the correlation is 0.45 and the height under half. The field's outermost wave arrives about 0.15 of her length too early there.
   - The field's wedge near the ship is wider than Kelvin's 19.47 deg and closes on it only far astern (`tools/wake_tests.js` row 4: about 21 deg at 600 m). The KCS's measured cusp is already at Kelvin's angle at 1.2 lengths behind her bow.
5. **What does not transfer.** The KCS has a bulbous bow, and Titanic a plumb stem with no bulb.
   - The bulb's interference is what makes Michell's integral so high here, and it shapes the KCS's bow crest.
   - So this sets no value for her `bowPile`. It shows only that 3.5 is not above what a real bow does at a similar Froude number (hers at 22.5 kn is 0.23).

## 6. Not done, and next

- **The far cut's lag:** the field's wedge near the ship (section 5, item 4). It belongs to the field's method, not to the KCS, and is worth its own look.
- **A bulb-less benchmark** to set her `bowPile`. Bo has supplied both, and both give tabulated data:
  - Kim and Jenkins (1981), DTNSRDC/SPD-1013-01 (DTIC ADA105972): the Series 60 with Cb 0.60, with its offsets and its wave profiles along the hull, fixed and free, at six Froude numbers from 0.15 to 0.35;
  - Kajitani, Miyata and others (1983), the cooperative experiment on Wigley's model in Japan (DTIC ADP003037): the wave elevation on the hull, tabulated for three model sizes.
- **The measured profile's own uncertainty:** it was read from photographs, and the paper states no band.
- **Nothing in the library moves on this note.** `CFG.bowPile` stays 3.5 until a bulb-less benchmark has been run. Then the bet's method is the comparison, not a fit by eye.
