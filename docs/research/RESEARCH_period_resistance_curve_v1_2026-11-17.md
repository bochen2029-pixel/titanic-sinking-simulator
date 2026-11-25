# A resistance curve of her own period (M6): research note (v1)

Written 2026-11-17 02:27 CST by a research scout (Opus 5.5) for the lead session (the ship under way, `BACKLOG.md` M6). Public web pages only, read with a fetch tool or the Internet Archive's own full-text search; nothing downloaded; no search carried personal or company information. No file in the repository was changed except this new one, and nothing in it was run.

Lineage: answers M6. Builds on e16 (`docs/research/experiments/e16_resistance_shape.js` and `results_2026-11-17/e16_resistance_shape.txt`), the handling consensus (`RESEARCH_handling_consensus_v1_2026-11-16.md`, sections 5 and 8.4, consensus row 25) and the v1 fact sheet (`RESEARCH_olympic_class_steering_propulsion_trials_v1_2026-11-16.md`, section 8).

Status: COMPLETE for v1, with one gap. The Taylor-Gertler coefficients were located but not read: they exist only as charts, which a text-only reader cannot read (section 2.2). Section 2.3 says where they are, and turns eight readings on one chart into a verdict.

## 0. Summary

**Bottom line: keep Holtrop's shape (`SHIP.resist` as built).** Everything of her period that could be checked is consistent with it: the roughness allowance of a clean, painted, riveted hull, the share of skin friction, and the power-speed exponents near service speed. The 1910 friction law itself (V^1.83) falls faster with speed than the modern line, and using it would make the low-speed checks worse, not better. The 60-rpm misfit (18.18 kn against 17.3-18.0) is not a hull-shape problem. The band's draft correction is too large. Any resistance shape that fixes 60 rpm breaks Slow 30, unless R/u^2 has a local hump near 17-18 kn, and no source shows one.

1. **Taylor Standard Series, Gertler 1954 (DTMB Report 806).** The report is on the Internet Archive with its OCR (item `DTIC_AD0224171`, 310 leaves).
   - Its residuary coefficients are on about 200 chart pages: one chart per beam-draft ratio and prismatic, with one curve per volumetric coefficient.
   - No digitized table or regression of them was found anywhere. **The values for this hull: NOT READ.**
   - The charts this hull needs are located: B/H 3.00 with Cp 0.68-0.70, at full-text pages about 195-199; B/H 2.25, at about 121-125.
   - Section 2.3 gives the friction columns, the 2D-to-3D correction, and three inequalities that decide keep or replace. They need eight readings on one chart (B/H 3.00, Cp 0.68: two volumetric curves at four Froude numbers); the B/H 2.25 and Cp 0.70 charts serve as checks.
2. **Olympic class: no hull data is public.** No model test, trial power curve, Biles transcript, or modern CFD or tank study of her hull was found.
   - What exists:
     - Biles's 165 tons at 21 kn, second-hand.
     - The design power: 46,000 hp at 75 rpm, for 21 kn.
     - One service figure: about 59,000 hp at 83 rpm, near 24 kn.
     - Wax models of Olympic and Hawke, tested at the NPL in late 1911 for the suction case. No resistance result from them was found.
   - Titanic II's tank tests at HSVA (2013; 9.3-m model, up to 23 kn): no results found in public.
3. **Liners of 1907-1914.** No progressive-trial table could be read; those of Lusitania and Mauretania exist in archives.
   - Two-point estimates of the power exponent (shaft power, taken as proportional to effective power; low confidence): about 3.8 for Lusitania (23-25.6 kn) and about 3.5 for Mauretania (25-26 kn).
   - Holtrop gives this hull 3.55 at 18-21 kn and 3.70 at 21-22.5 kn. That is consistent: she ran at a lower speed-length ratio.
   - Taylor (1910) puts skin friction at about 64 % of the total for the fastest liners at top speed. Holtrop gives this hull 70-74 % (flat plate plus allowance) at 21-22.5 kn. Also consistent.
4. **Riveted, lapped plating.** It adds a roughness allowance, and that allowance does not change the verdict.
   - Period friction for a clean, painted iron hull (Froude, Tideman) equals the 1947 ATTC line plus 0.0004 at 500 ft [derived].
   - The ATTC's own 0.0004 was introduced for hull roughness in the riveted era [search summary].
   - Both match Holtrop's own allowance for this length, 0.00037.
   - An allowance is independent of Reynolds number, so more of it flattens the shape. Even 0.0008 moves 60 rpm by only -0.07 kn.
5. **The 60-rpm check, revisited** [derived, with the model's own screws].
   - The band's light-draft correction assumed equal thrust (speed as displacement to the -1/3).
   - At equal rpm, the screws give more thrust as the ship slows, so the correction is only 0.9-1.4 %. "About 18 kn" on trial is therefore **17.8 kn at the night**, not 17.5-17.7. The model's 18.18 is 0.4 kn (2 %) above it, within "about".
   - Scaling Holtrop's residual down until 60 rpm reaches 18.0 kn takes Slow 30 to about 8.06 kn (below 8.2).
   - Of the shapes tried, only one with a local hump in R/u^2 near 17-18 kn meets all five bands, and the hump must be at least 5.6 % of the resistance. That is 1.55 times Holtrop's wave resistance there.
6. **For the model (section 9).** Keep the as-built cubic.
   - The ready alternative is "HB": Holtrop's bare hull, plus the 19 % between it and Biles's level carried as a u^2 term (appendages, air, riveted roughness).
   - HB's cubic fits within 0.41 % and gives 22.15 / 21.89 / 18.11 / 15.23 / 8.20 kn (4 of 5, as now).
   - Adopt HB only if the shape is reopened anyway (after the Taylor charts are read, or in M5): any change to `SHIP.resist` brings the refits that `CLAUDE.md` lists.

## 1. Method, conventions and this hull's numbers

**Tags**
- [O]: I opened the page (or the Internet Archive's OCR or full-text search of the item) and read the passage.
- [S]: seen only in a search engine's result summary. Either I did not open it, or the site refused the fetch (403, 404).
- [R]: taken from this repository's files.
- [D]: derived by me; how is stated in the row.

**Quotes.** Each quote is under 15 words, at most one per source. Modern works are paraphrased.

**Computation.** Stand-alone Node scripts, kept outside the repository (the session's scratchpad, folder `m6_research`).
- They copy e16's `holtrop()` and `speeds()` and the constants of `core/core.js` and `core/motion.js`.
- Check: they reproduce e16's printed shape to four decimals, and the as-built speeds (22.15, 21.90, 18.18, 15.31, 8.25 kn) to 0.01 kn.
- Every speed below is computed as `derive()` does: the screws recalibrated at 75 rpm = 22.15 kn against the shape, with the centre screw trailing at Cdw 0.10 (as built).

**The shape.** g(u) = (R(u)/u^2) / (R(21 kn)/(21 kn)^2).
- In a Froude-type method, R = 0.5 rho S V^2 (C_F + dC_F + C_R).
- So S cancels: g = (C_F + dC_F + C_R) at u, divided by the same at 21 kn.

| Quantity (the model's hull on the night) | Value | How |
|---|---|---|
| Length between perpendiculars | 259.08 m (850 ft) | `core.js` |
| Beam | 28.194 m (92.5 ft) | `core.js` |
| Mean draft | 9.830 m (32 ft 3 in) | (30 ft 9 in + 33 ft 9 in) / 2, `core.js` |
| Displacement | 49,021 t = 48,246 long tons | `motion.js` |
| Volume | 47,825 m^3 | /1025 |
| Block coefficient | 0.666 | [D] |
| Prismatic coefficient | 0.683 with C_M 0.975 (assumed, as e16) | [D] |
| Volumetric coefficient vol/L^3 | 2.750 x 10^-3 | [D]; lies between Gertler's 2.5 and 3.0 x 10^-3 curves |
| Displacement-length ratio, long tons / (L/100 ft)^3 | 78.6 | [D]; slightly below the 80-90 that the brief gives |
| B/T, L/B | 2.87, 9.19 | [D]; B/T is between Gertler's 2.25 and 3.00, 82 % of the way to 3.00 |
| V/sqrt(L) and Fn at 21 kn | 0.720 and 0.2143 | [D] |
| V/sqrt(L) and Fn at 22.5 kn | 0.772 and 0.2296 | [D] |
| Wetted surface | 9,145 m^2 (Holtrop's formula, e16); Taylor's period formula S = 15.4 sqrt(D L) gives 9,162 m^2 | [R]; [D]: 15.4 x sqrt(48,246 x 850) = 98,620 ft^2 |
| Holtrop at 21 kn | R 1,298.7 kN: flat plate 58.1 %, form (k1 = 0.132) 7.7 %, allowance (C_A 0.00037) 15.4 %, wave 18.8 % | [D], with e16's formulas |

## 2. The Taylor Standard Series, as reanalysed by Gertler (1954)

### 2.1 What was found

| Figure | Value | SI | Source (author, title, URL) | Short quote | Confidence |
|---|---|---|---|---|---|
| The report | M. Gertler, "A Reanalysis of the Original Test Data for the Taylor Standard Series", David Taylor Model Basin Report 806, March 1954, 307 pages; reprinted by SNAME in 1998 | - | Internet Archive item `DTIC_AD0224171` (DTIC's copy, 310 leaves, Tesseract OCR), https://archive.org/details/DTIC_AD0224171 [O]; Royal Museums Greenwich catalogue (307 p.) [S]; SNAME reprint [S] | - | High |
| Text access | The OCR exists and the item's full-text search works. The prose is badly garbled ("best available copy"). The data pages are charts | - | same [O] | - | High |
| Presentation | Figures 6-8: volumetric coefficient against Cp and L/B, for B/H 2.25, 3.00 and 3.75, all with midship coefficient 0.925. Figure 16 (search page 43): C_R against Cp for equal volumetric coefficients, at B/H 2.25 and V/sqrt(L) 1.0. Then charts labelled "B/H = x, Cp = y" on search pages 86-290, one per beam-draft ratio and prismatic. The OCR shows axis labels "Froude Number" and "Speed-Length Ratio", and ticks such as 0.15-0.29 | - | same, full-text searches for "Figure", "Cp", "speed-length ratio" [O] | "all forms having a midship section coefficient of 0.925" | High for the layout. That each chart holds one curve per volumetric coefficient is inferred from the labels and captions, not seen |
| Where this hull's charts are | **B/H 3.00:** "Cp = 0.69" labelled on search page 197. Pages run about two per 0.01 of Cp (0.64 on 187, 0.73 on 205), so Cp 0.68 is near 195 and 0.70 near 199. **B/H 2.25:** "Cp = 0.72" on 129, so 0.68-0.70 is near 121-125. Read the curves for volumetric coefficients 2.5 and 3.0 x 10^-3 and interpolate to 2.75 | - | same [O]; positions between labels [D], by interpolation | - | Medium: plus or minus two pages |
| Taylor's original series (1910) | Parent: longitudinal (prismatic) coefficient 0.5554, midship 0.926, displacement-length ratio 106.95. 80 models; B/H 2.25 and 3.75; displacement-length ratio 26.6-199.5; Cp 0.48-0.80. Results as residuary resistance in lb per ton (Figs. 81-120) | - | D. W. Taylor, *The Speed and Power of Ships* (Wiley, 1910), https://archive.org/details/speedpowerofship00tayluoft [O, OCR] | - | High for the book; medium for OCR'd digits |
| Displacement effect at V/sqrt(L) 0.75 | Residuary resistance per ton is about constant as displacement grows. So at her service speed the interpolation in volumetric coefficient matters little | - | Taylor 1910, section 14.7 [O] | - | Medium |
| Parallel middle body | Taylor also tested Cp 0.68, 0.74 and 0.80 with a parallel middle body (C_M 0.96, B/H 2.5). Its best length was 9-36 % of L at Cp 0.68, and was most useful at low speed. The standard-series lines (no parallel body) were slightly better | - | Taylor 1910, section 14.10 [O] | - | Medium. This matters because Olympic had a long parallel body, and the series' full forms have none |
| The parent's identity | Commonly said to be a cruiser of the period (HMS Leviathan) | - | NOT CONFIRMED in the pages read | - | - |
| C_R for Cp 0.68-0.70, B/H about 2.9, vol/L^3 2.75 x 10^-3 | **NOT FOUND**, see 2.2 | - | - | - | - |

### 2.2 Why the numbers are not here

- **The curves cannot be read by text.** A fetch of a page image returns binary, and the OCR holds only the axis labels and captions.
- **No digitized form was found.** Tried:
  - Gabor and Karafiath, "Analytical Ship Residuary Resistance Prediction" (DTNSRDC, 1977; `DTIC_ADA051322`) [O]. It uses Taylor-series ships, but prints no usable C_R for this range.
  - An NPS trimaran thesis built on the Taylor series and Series 64 (1995; `DTIC_ADA305816`) [S]. Slender forms only.
  - J. K. E. Tunaley, "An Examination of the Taylor Standard Series of Hull Forms" [S]. It reproduces Gertler's curves, but the host's certificate has expired and the mirror does not resolve.
  - R. D. Moody, "Preliminary power prediction during early design stages of a ship" (Cape Technikon, 1996) [S]. It compares Taylor-Gertler with Fisher's and UCL's regressions, but the PDF would not parse.
  - HathiTrust's catalogue (403). Course and homework pages: only Cp 0.60 found.
- **Taylor's 1910 plates** have the same problem.

### 2.3 The worksheet, for when the charts are read

**Arithmetic.**
- Shape: g_TG(u) = (C_F,ATTC(u) + dC_F + C_R,3D(Fn)) / (C_F,ATTC(21 kn) + dC_F + C_R,3D(0.2143)).
- Friction: the 1947 ATTC (Schoenherr) line, 0.242 / sqrt(C_F) = log10(Re C_F), solved by Newton's method.
  - Re = u L / nu, with nu = 1.19 x 10^-6 m^2/s (sea water at 15 C, the ATTC standard 59 F).
  - At 21 kn: u = 10.803 m/s and Re = 2.352 x 10^9, so C_F = 1.3812 x 10^-3. Plus dC_F 0.0004, that is 1.7812 x 10^-3.
- **dC_F = 0.0004**: period practice for a clean painted hull (section 5).
- **2D to 3D.** C_R,3D = C_R,Gertler - k (C_F,model - C_F,ship).
  - Gertler's C_R is model total minus Schoenherr friction at model scale, so it carries the model's form drag at model Reynolds number.
  - k = 0.132 (Holtrop's k1 for this hull).
  - Models assumed 20 ft long [bet: the usual Model Basin length; Taylor's 1910 worked example uses one; not confirmed for the series], in fresh water at 59 F.
  - Used straight (the 2D method of 1954), C_R would flatten the low-speed shape by about 3 % at 8 kn.
- **Check.** Putting Holtrop's own equivalent C_R into the formula returns Holtrop's shape: g(18) = (1.8065 + 0.3746) / (1.7812 + 0.5930) = 0.9187.

All columns are x 10^-3. Every number is [D]; the C_R column is to be filled in.

| kn | V/sqrt(L) | Fn | C_F ATTC (15 C) | C_F + 0.0004 | 2D-to-3D correction k(C_F,m - C_F,s) | Holtrop's equivalent C_R (C_T - C_F - 0.0004) | Gertler C_R (to read) |
|---|---|---|---|---|---|---|---|
| 8 | 0.274 | 0.0816 | 1.5518 | 1.9518 | 0.261 | 0.172 | - |
| 10 | 0.343 | 0.1020 | 1.5098 | 1.9098 | 0.248 | 0.169 | - |
| 12 | 0.412 | 0.1225 | 1.4766 | 1.8766 | 0.239 | 0.178 | - |
| 14 | 0.480 | 0.1429 | 1.4494 | 1.8494 | 0.231 | 0.210 | - |
| 16 | 0.549 | 0.1633 | 1.4264 | 1.8264 | 0.225 | 0.274 | - |
| 18 | 0.617 | 0.1837 | 1.4065 | 1.8065 | 0.220 | 0.375 | - |
| 20 | 0.686 | 0.2041 | 1.3891 | 1.7891 | 0.215 | 0.511 | - |
| 21 | 0.720 | 0.2143 | 1.3812 | 1.7812 | 0.213 | 0.593 | - |
| 22 | 0.755 | 0.2245 | 1.3736 | 1.7736 | 0.211 | 0.679 | - |
| 22.5 | 0.772 | 0.2296 | 1.3700 | 1.7700 | 0.210 | 0.722 | - |
| 23 | 0.789 | 0.2347 | 1.3665 | 1.7665 | 0.209 | 0.765 | - |
| 24 | 0.823 | 0.2449 | 1.3597 | 1.7597 | 0.207 | 0.858 | - |

**Verdict rules** [D].
- Fitted to the speed solver with the as-built screws. They agree with the solver within 0.01 kn on Holtrop's shape, on the 1910 composite of section 6, and on the quadratic:
  - 60 rpm ~ 17.72 + 4.17 (1 - g(18)/g(22.15)) kn
  - Half 50 ~ 14.77 + 3.68 (1 - g(15.3)/g(22.15)) kn
  - Slow 30 ~ 7.95 + 2.13 (1 - g(8.2)/g(22.15)) kn
- In C_R,3D terms (dC_F 0.0004):
  - **60 rpm at or under 18.0 kn needs C_R(Fn 0.184) >= 0.933 C_R(Fn 0.226) - 0.153 x 10^-3.** Holtrop has 0.375 against 0.492 needed, so it fails (18.20).
  - **Slow 30 at or over 8.2 kn needs C_R(Fn 0.226) >= 0.434 x 10^-3 + 1.133 C_R(Fn 0.084).** Holtrop has 0.692 against 0.628, so it passes.
  - Half 50 at or over 14.9 kn needs C_R(Fn 0.226) >= 0.129 x 10^-3 + 1.037 C_R(Fn 0.156). Holtrop has 0.692 against 0.385, so it passes.
- If a Gertler reading meets all three, the period curve beats Holtrop's: replace the shape with g_TG, fitted as a cubic as in section 9. If it fails the first rule as Holtrop does, keep Holtrop's.
- Below Fn 0.15 the charts may not reach. Hold C_R at its lowest-speed value there, which is standard practice.

## 3. Olympic-class resistance, power and speed

| Figure | Value | SI | Source (author, title, URL) | Short quote | Confidence |
|---|---|---|---|---|---|
| Biles's resistance, Hawke case (1911) | 165 tons at 21 kn and 46,000 IHP, for about 53,000 tons displacement (Olympic) | 1,644 kN at 10.80 m/s; 34.3 MW; 53,850 t | S. Halpern, "Titanic's Prime Mover" (rev. 31 Jan 2011), note 2, crediting M. Chirnside, https://www.titanicology.com/Titanica/TitanicsPrimeMover.htm [O]; the repo's fact sheet, section 8 [R] | (paraphrase) | Medium: an expert's estimate in litigation, second-hand |
| Biles: effective power | EHP 23,820 hp; EHP/IHP 0.518 | 17.76 MW | [D] 1,644 kN x 10.80 m/s | - | Medium (follows the row above) |
| Biles against Holtrop's bare hull | Biles scaled to the night (the model's cR x (21 kn)^2) is 1,544 kN. Holtrop's bare hull (e16) is 1,299 kN. The gap, 245 kN = 18.9 % of Holtrop, equals an extra allowance of 0.00045 on Holtrop's 9,145 m^2 | - | [D] 0.5 rho S V^2 at 21 kn: 0.5 x 1025 x 9145 x 10.803^2 = 547 MN | - | Medium |
| What the gap may hold | Still-air drag about 49 kN (3.8 % of Holtrop) [D: 840 m^2 x Cd 0.8, both bets]. Period figure: air about 4 % of the power of a large Atlantic liner at 25 kn. The rest would be appendages (bossings, shafts, rudder) and the plating's roughness above Holtrop's allowance | 49 kN | EB1911, "Shipbuilding" (Philip Watts), https://en.wikisource.org/wiki/1911_Encyclop%C3%A6dia_Britannica/Shipbuilding [O] | - | Low-medium |
| Biles's full evidence | **NOT FOUND**: no transcript online. The 1912 USNI Proceedings discussion of the case refused the fetch | - | https://www.usni.org/magazines/proceedings/1912/march/discussion [S] | - | - |
| Suction tests for the Hawke case | Olympic and Hawke modelled in wax at the National Physical Laboratory, Teddington, late 1911, in the new William Froude tank (G. S. Baker). **Resistance results NOT FOUND** | - | Paul Lee, newspaper extracts, https://www.paullee.com/titanic/BL/index.php [O, caption only]; Grace's Guide on the NPL and on Baker [S] | "replicated in yellow wax" | Medium that the models existed |
| Taylor's suction experiments, applied to the case | US Model Basin models of equal displacement, made after the Prinzess Irene and Parima incident of 1908. No Olympic resistance given | - | Scientific American, 28 Oct 1911, https://doi.org/10.1038/scientificamerican10281911-389 [O] | - | Medium; not about resistance |
| Model tests of the Olympic-class hull form, 1907-1911 (Harland & Wolff, Haslar or elsewhere) | **NOT FOUND**. The one design model described is a half-model, made for the appearance of the hull | - | The Shipbuilder (1911), via search summary [S] | - | - |
| Design power | 2 x 15,000 IHP at 75 rpm, plus a 16,000-SHP turbine at 165 rpm, for 21 kn. Registered 50,000 hp. Normal full 78 rpm, a little over 22.5 kn | 34.3 MW; 37.3 MW | Halpern, "Titanic's Prime Mover" [O] | (paraphrase) | Medium: design figures, not measurements |
| High-power point | About 59,000 hp (turbine about 18,000) at 83 rpm, close to 24 kn. Olympic, from her engineers Fleming and McKimm via Chirnside | 44.0 MW; about 12.3 m/s | same, note 3 [O] | - | Medium-low: IHP and SHP mixed; speed approximate |
| Power exponent from these | n = ln(59/46) / ln(V83/V75): 2.89 with Halpern's 21.83 and 23.79 kn; 2.00 with 21.0 kn | - | [D] | - | **Unusable**: 46,000 is a design rating, not a measurement at 75 rpm |
| Halpern's speed law | V = 0.563 R^0.8472 kn for Olympic; Titanic x 1.0145. The exponent comes from Wilding's 60 rpm / 18 kn (Titanic, trial, light) and 74 rpm / 21.5 kn (Olympic in service); K from Haws's 79 rpm / 22.82 kn | - | Halpern, "Speed and Revolutions" (rev. 16 Oct 2015), https://www.titanicology.com/Titanica/SpeedandRevolutions.htm [O] | (paraphrase) | Medium; mixes drafts |
| The same law with power as rpm^3 (his assumption) | P ~ V^3.54 | - | [D] 3 / 0.8472 | - | Low-medium; circular for M6 (anchored on the 60-rpm point) |
| Olympic's 1911 trials | Speed, power and consumption not made public at the time. "21 3/4 kn" in one unsourced account | 11.19 m/s | the consensus, section 5 [R] | - | Low |
| Titanic II, HSVA, 9-12 Sep 2013 | 9.3-m wooden model in HSVA's 300-m tank. Resistance, open-water and self-propulsion tests up to 23 kn (HSVA's 5,000th model). Its director called modern passenger ships unsuitable references for the hull. **Results NOT FOUND in public.** The hull was a modern derivative; its dimensions are not given in the pages read | 11.8 m/s | Cruise & Ferry, "First Titanic II model tested", https://www.cruiseandferry.net/articles/first-titanic-ii-model-tested [O]; MarineLink, https://www.marinelink.com/news/getting-serious-titanic359038 [O] | (paraphrase) | High that the tests ran |
| CFD or tank study of Titanic's own hull form, with curves | **NOT FOUND**. One ResearchGate preprint on flat-plate pressure drag meshes Titanic's hull and quotes a resistance at 21 kn. It was not read: the site refuses fetches | - | [S] | - | - |
| SNAME Marine Forensic Panel papers (Marine Technology 1996; Transactions 1997) | Metallurgy and break-up. **No speed-power analysis found** | - | SNAME Marine Forensics Committee page [S] | - | - |
| Holtrop 1984 for this hull (the model's shape) | g(12) 0.865, g(18) 0.919, g(22.5) 1.050. Wave 18.8 % of R at 21 kn, 23.1 % at 22.5 kn | - | e16 [R] | - | Medium: a 1984 regression on later hulls |

## 4. Large liners of 1907-1914: speed and power on trial

| Figure | Value | SI | Source (author, title, URL) | Short quote | Confidence |
|---|---|---|---|---|---|
| Lusitania, trials, July 1907 | 68,000 hp recorded on trial; 25.6 kn on the measured mile; 22 kn on the trial cruise round Ireland | 50.7 MW; 13.17 m/s | New Zealand Times, 16 Sep 1907 (London dispatch of 2 Aug), https://paperspast.natlib.govt.nz/newspapers/NZTIM19070916.2.60 [O]; Evening Post, 31 Jul 1907 (25 3/5 kn), https://paperspast.natlib.govt.nz/newspapers/EP19070731.2.71 [O] | (paraphrase) | Medium: press |
| Lusitania, first crossing, Sep 1907 | 23.01 kn Queenstown to Sandy Hook. The engines averaged about two-thirds of their maximum | 11.84 m/s | New Zealand Times as above [O]; The Spectator, 21 Sep 1907, https://archive.spectator.co.uk/article/21st-september-1907/12/the-litsitania [S] | - | Low-medium |
| Lusitania: exponent | n ~ ln(1.5) / ln(25.6/23.01) = 3.8 (shaft power; trial against service, different displacement and sea) | - | [D] | - | Low |
| Lusitania's progressive trial, Skelmorlie, 27 Jul 1907 | A table of revolutions, speed and vacuum at 37,080 tons exists (a Marine Review page). **Numbers NOT READ**: the site refused the fetch | 37,675 t | Maritime History of the Great Lakes, https://images.maritimehistoryofthegreatlakes.ca/124900/page/16 [S] | - | - |
| Mauretania, Skelmorlie mile, 6 Nov 1907 | Swan Hunter's curve sheet of 10 runs: about 26 kn at about 78,030 shp and 188 rpm, coal about 49.9 tons an hour. Design about 68,000 shp for 25 kn. A 1932 press account gives 26.04 kn at 79,600 shp | 13.4 m/s; 58.2 MW; 50.7 MW | Newcastle University, "Highlights MAURETANIA", https://www.ncl.ac.uk/mediav8/engineering/files/Highlights-MAURETANIA.pdf (404 today) [S]; press [S] | - | Low-medium (summaries only) |
| Mauretania: exponent | n ~ ln(78,030/68,000) / ln(26/25) = 3.5 (trial maximum against design rating) | - | [D] | - | Low |
| Aquitania, trials, May 1914 | 24 kn, about a knot more than expected; about 59,000 shp (some give 62,000). Progressive data **NOT FOUND** | 12.35 m/s; 44 MW | fact and photo pages, e.g. https://maritimequest.com/liners/aquitania_data.htm [S] | - | Low |
| Olympic | No usable pair (section 3) | - | - | - | - |
| Period rule: Admiralty coefficient | Assumes power as V^3, which holds only if resistance goes as V^2 | - | EB1911, "Shipbuilding" [O] | - | High, as a description of practice |
| Period rule: slow vessels | Up to 11 or 12 kn, IHP goes about as V^3 (little residuary) | - | Taylor 1910 [O] | - | Medium |
| Period figure: friction share of the fastest liners | Skin friction about 64 % of the total, at top speed in smooth water | - | Taylor 1910, section 4.1 [O] | "about 64 per cent of the total resistance" | Medium-high (period expert) |
| The same share for this hull, Holtrop | Flat plate plus allowance: 73.6 % at 21 kn, 69.7 % at 22.5 kn (Fn 0.214-0.230, against Lusitania's 0.27 at 25 kn). Consistent | - | [D] | - | Medium |
| Period figure: speed index | Destroyer types: speed index 3.0-3.1 at 14-16 kn, 4.9-5.3 at 22-23 kn (another hull type) | - | EB1911, "Shipbuilding" [O] | - | Medium |
| This hull, Holtrop: effective-power exponent | 2.92 (8-12 kn), 3.04 (12-15), 3.27 (15-18), 3.55 (18-21), 3.70 (21-22.5), 3.77 (22.5-24) | - | [D] n = 3 + ln(g2/g1) / ln(u2/u1), e16's shape | - | Follows Holtrop |

## 5. Riveted, lapped plating: does it change the shape?

| Figure | Value | SI | Source (author, title, URL) | Short quote | Confidence |
|---|---|---|---|---|---|
| Her plating | Hull plates joined at their edges by riveted lap joints. Hydraulic riveting for the double bottom and the bottom shell to the bilge, and for the topside shell and stringers. About three million rivets | - | T. Foecke, *Metallurgy of the RMS Titanic*, NIST-IR 6118 (1998), full-text search, https://archive.org/details/metallurgyofrmst6118foec [O]; The Shipbuilder (1911) via GG Archives, https://www.ggarchives.com/OceanTravel/Titanic/25-ImageLibrary/TheShipbuilder-03-BuildingTheHulls.html [O] | (paraphrase) | Medium-high for the lap joints. The butt arrangement and the outer rivet heads (countersunk or not): **NOT FOUND** |
| In-and-out strakes; strapped butts | The period's usual practice: "in" strakes riveted to the frames, "out" strakes over liners. Lusitania's butts were strapped. Titanic's arrangement is disputed on forums | - | Encyclopedia Titanica forum and a TRMA model-building article, search summaries [S] | - | Low |
| Froude's friction law | R = f S V^n, with n = 1.83 for a varnished surface, which Froude took as equal to a freshly painted ship | - | EB1911, "Shipbuilding" [O] | "1·83 for a varnished surface equivalent to the freshly painted hull of a ship" | High as period practice |
| Tideman's constants | For "iron bottom, clean and well painted": slightly above Froude's, exponent 1.829 (the US Model Basin used 1.83). Rough surfaces: n = 2.00 | - | Taylor 1910 [O] | - | High as period practice |
| Taylor's worked example | A 500-ft ship, 39,000 ft^2, at 20 kn: Froude gives 82,495 lb, Tideman 84,745 lb | 152.4 m; 3,623 m^2; 10.29 m/s; 367 kN, 377 kN | Taylor 1910 [O] | - | High (the arithmetic checks) |
| The example against the 1947 ATTC line | As coefficients: Froude 1.866, Tideman 1.917, Schoenherr 1.480 (all x 10^-3, at Re 1.32 x 10^9). **Period practice for a clean painted hull = the ATTC line + 0.00039 to 0.00044** | - | [D] q = 0.5 x 1.989 slug/ft^3 x (33.76 ft/s)^2 x 39,000 ft^2; Schoenherr at Re = 33.76 ft/s x 500 ft / 1.2817 x 10^-5 ft^2/s | - | Medium |
| Fouling | Three to four months out of dock in cool water: skin resistance up 20 % or more | - | Taylor 1910 [O] | - | Medium. Titanic was new; Olympic's 1912 figures were in service |
| The 1947 ATTC allowance | The Schoenherr line was adopted in 1947 with +0.0004 for new hulls, introduced for hull roughness. All-welded long ships later needed C_A of about 0 or below. US Navy practice later: 0.0005 for all sizes. Popular statement: +0.0004 for a new ship | - | ScienceDirect topic pages "Schoenherr" and "Hull roughness" (403) [S]; US Navy correlation 1982-1995, ATTC 1995, https://onepetro.org/snameattc/proceedings-abstract/ATTC95/ATTC95/D021S005R005/509430 [S]; Bright Hub Engineering [O] | - | Medium |
| Riveted against welded | Overlapping plate edges and rivet heads made riveted hulls rough, and welding removed them | - | Bright Hub Engineering, "Roughness Of Hull Surface Explained", https://www.brighthubengineering.com/naval-architecture/60585-surface-roughness-of-a-hull/ [O] | (paraphrase) | Medium (a popular source) |
| Allan and Cutland (1958) | Structural roughness of all-riveted and all-welded shells. The computed saving from removing it agreed with ship trials, and differed with ship size. **Numbers NOT READ** | - | International Shipbuilding Progress 5(45), 212-223, https://content.iospress.com/articles/international-shipbuilding-progress/isp5-45-02 (403) [S] | - | - |
| Kempf (1937), Todd (1951): increments for rivets, laps and butts | **NOT FOUND** in an open source | - | - | - | - |
| Holtrop's own allowance for this length | C_A = 0.00037 (his 1984 formula at L = 259 m) | - | [R] e16; [D] | - | - |
| How an allowance acts | It is independent of Reynolds number (fully rough flow): a u^2 term. Raising it lifts g below 21 kn and lowers it above | - | standard; [D] below | - | High |
| Its effect here | Allowance 0.0004: 60 rpm 18.20 kn (no change). 0.0006: 18.16. 0.0008: 18.13. 0.0010: 18.11, but Slow 30 drops out (8.19) | - | [D] section 6 | - | Medium |

**Verdict for item 4.**
- Riveted, lapped plating adds a Reynolds-independent term. It raises the friction share, from 74 % to 78 % at 21 kn with an allowance of 0.0008.
- Its effect on the shape is a slight flattening, too small to matter: 60 rpm moves -0.04 to -0.07 kn for allowances of 0.0006 to 0.0008.
- Period practice assigned a clean, painted riveted hull about the allowance Holtrop already uses.

## 6. The worked shapes, side by side

g(u) = (R/u^2) / (R/u^2 at 21 kn). All [D] except the first column, which is e16's [R]; my replica gives the same numbers.
- **HB** is Holtrop's bare hull plus the 245-kN gap to Biles's level (section 3), carried as a u^2 term.
- **1910 practice** is the Froude-Tideman friction law (V^1.829, set equal to the ATTC line + 0.0004 at 21 kn) plus Holtrop's equivalent residual.
- **Taylor-Gertler**: not read (section 2).

| kn | Fn | Holtrop, as built (e16) | Holtrop, ATTC 1947 line | ATTC + dC_F 0.0004 | ATTC + dC_F 0.0008 | HB | 1910 practice | Taylor-Gertler | friction only, Froude-Tideman | friction only, ATTC + 0.0004 | quadratic |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 8 | 0.082 | 0.8944 | 0.8940 | 0.8955 | 0.9104 | 0.9112 | 0.9571 | not read | 1.1794 | 1.0958 | 1 |
| 10 | 0.102 | 0.8755 | 0.8753 | 0.8770 | 0.8946 | 0.8953 | 0.9228 | not read | 1.1353 | 1.0722 | 1 |
| 12 | 0.123 | 0.8653 | 0.8653 | 0.8671 | 0.8860 | 0.8867 | 0.9004 | not read | 1.1004 | 1.0536 | 1 |
| 14 | 0.143 | 0.8672 | 0.8672 | 0.8691 | 0.8877 | 0.8883 | 0.8923 | not read | 1.0718 | 1.0383 | 1 |
| 16 | 0.163 | 0.8845 | 0.8845 | 0.8861 | 0.9023 | 0.9029 | 0.9012 | not read | 1.0476 | 1.0254 | 1 |
| 18 | 0.184 | 0.9187 | 0.9187 | 0.9198 | 0.9312 | 0.9316 | 0.9280 | not read | 1.0267 | 1.0143 | 1 |
| 20 | 0.204 | 0.9690 | 0.9690 | 0.9694 | 0.9738 | 0.9739 | 0.9719 | not read | 1.0084 | 1.0045 | 1 |
| 21 | 0.214 | 1 | 1 | 1 | 1 | 1 | 1 | not read | 1 | 1 | 1 |
| 22 | 0.225 | 1.0330 | 1.0330 | 1.0325 | 1.0279 | 1.0277 | 1.0302 | not read | 0.9921 | 0.9958 | 1 |
| 22.5 | 0.230 | 1.0495 | 1.0494 | 1.0487 | 1.0418 | 1.0416 | 1.0454 | not read | 0.9883 | 0.9937 | 1 |
| 23 | 0.235 | 1.0661 | 1.0661 | 1.0652 | 1.0559 | 1.0556 | 1.0607 | not read | 0.9846 | 0.9918 | 1 |
| 24 | 0.245 | 1.1026 | 1.1026 | 1.1012 | 1.0868 | 1.0863 | 1.0947 | not read | 0.9774 | 0.9880 | 1 |

What the table says [D]:
- The friction line (ITTC 1957 or ATTC 1947) makes no difference: the first two columns agree to 0.0004.
- The allowance flattens the curve a little.
- The 1910 friction law (V^1.83) falls faster with speed than the modern line, so it raises g at low speed.
- The night's cold water (nu 1.83 x 10^-6 at -2 C) moves g by under 1 %: 60 rpm 18.18, Slow 8.23.

Steady speeds (kn) with each shape. Screws recalibrated at 75 rpm = 22.15 kn; Cdw 0.10. The bands are 21.75-22.3, 21.4-21.9, 17.3-18.0, 14.9-15.9 and 8.2-9.2.

| Shape | Full 75 | 74 | 60 | Half 50 | Slow 30 (turbine out) | In band |
|---|---|---|---|---|---|---|
| As built (the cubic) | 22.15 | 21.90 | **18.18** | 15.31 | 8.25 | 4/5 |
| Holtrop, direct | 22.15 | 21.90 | 18.20 | 15.34 | 8.25 | 4/5 |
| ATTC + 0.0004 | 22.15 | 21.90 | 18.20 | 15.33 | 8.25 | 4/5 |
| ATTC + 0.0006 | 22.15 | 21.89 | 18.16 | 15.29 | 8.23 | 4/5 |
| ATTC + 0.0008 | 22.15 | 21.89 | 18.13 | 15.25 | 8.20 | 4/5 |
| ATTC + 0.0010 | 22.15 | 21.89 | 18.11 | 15.22 | **8.19** | 3/5 |
| HB, direct | 22.15 | 21.89 | 18.13 | 15.25 | 8.20 | 4/5 |
| HB, cubic (section 9) | 22.15 | 21.89 | 18.11 | 15.23 | 8.20 | 4/5 |
| HB with the gap split: air as u^2, the rest viscous (like friction) | 22.15 | 21.89 | 18.12 | 15.23 | **8.17** | 3/5 |
| 1910 practice | 22.15 | 21.89 | 18.15 | 15.26 | **8.11** | 3/5 |
| Friction only, ATTC + 0.0004 | 22.15 | 21.85 | 17.63 | **14.63** | **7.76** | 3/5 |
| Friction only, Froude-Tideman | 22.15 | 21.84 | 17.55 | **14.52** | **7.59** | 3/5 |
| Quadratic (before M3) | 22.15 | 21.85 | 17.72 | **14.77** | **7.95** | 3/5 |

## 7. The 60-rpm check, revisited

**The trial was at fixed rpm, not at fixed thrust** [D].
- Consensus row 25 (17.6 kn, 17.3-18.0) scaled Wilding's 18 kn from the trial's 44,400 tons to the night's 48,246 as displacement to the -1/3. That gives 18 x 0.9727 = 17.51 kn.
- That law holds at equal thrust. At equal rpm the model's screws give more thrust as the ship slows: thrust goes as 1 - J/J0, with J/J0 about 0.74 for the wing screws at 60 rpm.
- With the model's own screws, the trial ship's resistance scaled by (displacement ratio)^(2/3), and the screws calibrated at the night:

| Trial displacement | Resistance factor | Shape | 60 rpm, night | 60 rpm, trial | "18 kn" on trial is, at the night |
|---|---|---|---|---|---|
| 44,000 tons | 0.9404 | Holtrop | 18.20 | 18.43 (+1.24 %) | 17.78 |
| 44,000 tons | 0.9404 | quadratic | 17.72 | 17.97 (+1.43 %) | 17.75 |
| 44,400 tons | 0.9461 | Holtrop | 18.20 | 18.41 (+1.12 %) | 17.80 |
| 44,400 tons | 0.9461 | ATTC + 0.0008 | 18.13 | 18.34 (+1.14 %) | 17.80 |
| 45,000 tons | 0.9546 | Holtrop | 18.20 | 18.37 (+0.94 %) | 17.83 |
| 44,400 tons at 30 ft, Holtrop recomputed (R ratio 0.956-0.962) | - | Holtrop | 18.20 | 18.35 | 17.86 |

- So the night's equivalent of Wilding's "about 60 revolutions, corresponding to a speed of about 18 knots" (BI 25295) is **17.8 kn** (17.75-17.86).
- If "about" means the nearest knot, the band is 17.3-18.3 kn and the model's 18.18 is in it. If it means the nearest quarter knot, the band is 17.55-18.05, and the model is 0.13 kn over.
- The J0 values behind this (1.48 and 0.95) are bets in `motion.js`. A screw law with less J-dependence moves the answer back toward 17.5.

**Flattening the shape does not fix it** [D].
- The test family is C_T = C_F,ATTC + 0.0004 + alpha x (Holtrop's equivalent residual).

| alpha | 60 rpm | Half 50 | Slow 30 |
|---|---|---|---|
| 1.0 (Holtrop) | 18.20 | 15.34 | 8.25 |
| 0.8 | 18.12 | 15.23 | 8.17 |
| 0.6 | 18.02 | 15.11 | 8.08 |
| 0.4 | 17.91 | 14.97 | 7.98 |
| 0.2 | 17.79 | 14.81 | 7.87 |
| 0 (friction only) | 17.63 | 14.63 | 7.76 |

- 60 rpm = 18.0 kn needs alpha 0.55, which puts Slow 30 at about 8.06. 60 rpm = 17.8 needs alpha 0.22, which puts Half at 14.83 and Slow at 7.9 (both interpolated in the table).

**What would satisfy all five bands** [D].
- A local hump in R/u^2 added to Holtrop's shape, a Gaussian centred at 18 kn with a half-width of 1.5 kn:
  - 5.6 % of R there gives 60 rpm 18.00, Half 15.33, Slow 8.25: 5 of 5.
  - For 17.8 kn the hump must be 11.5 %.
  - Wider (2.5 kn), or centred at 17 kn: 6.0-7.2 % for 18.0, and 12.3-13.3 % for 17.8.
- Holtrop's wave resistance at 18 kn is 10.2 % of R, so a 5.6 % hump means 55 % more wave resistance near Fn 0.18.
- A minor interference hump near Fn 0.18 is not impossible for a form with a long parallel body. Only the Taylor charts (section 2.3) or a tank test could show one, and nothing found does.
- **Otherwise the misfit belongs to the propulsion side.** For example, the turbine's share at part load: the model holds it at 16/46 at every rpm; a smaller share at 50-60 rpm would slow 60 rpm and Half, and leave Slow alone. That is M5's ground. This is a hypothesis, not a finding.

## 8. NOT FOUND

| Figure | Value | SI | Source (where tried) | Short quote | Confidence |
|---|---|---|---|---|---|
| Gertler's C_R for Cp 0.68-0.70, B/H about 2.9, vol/L^3 2.75 x 10^-3 | NOT FOUND (charts located, not read) | - | Internet Archive `DTIC_AD0224171`, search pages about 121-125 and 195-199 | - | - |
| A digitized Taylor-Gertler table or regression | NOT FOUND | - | DTIC and Internet Archive (Gabor and Karafiath 1977; NPS 1995), Tunaley (unreachable), Moody 1996 (PDF unreadable), HathiTrust (403), general web | - | - |
| The Taylor parent's identity (Leviathan) | NOT CONFIRMED | - | Taylor 1910 OCR | - | - |
| Olympic-class model tests for resistance (Harland & Wolff, Haslar, NPL) | NOT FOUND | - | general web; Taylor 1910; International Marine Engineering 1907, 1911 (Internet Archive) | - | - |
| Results of the NPL's 1911 wax models of Olympic and Hawke | NOT FOUND | - | newspaper extracts; Scientific American 1911 | - | - |
| Olympic or Titanic trial power against speed (IHP, SHP) | NOT FOUND | - | Halpern, Chirnside (TRMA), International Marine Engineering July 1911, The Shipbuilder (not published in 1911) | - | - |
| Biles's full evidence in the Hawke case | NOT FOUND | - | USNI 1912 (403), newspaper archives, general web | - | - |
| Modern CFD or tank study of Titanic's hull, with curves | NOT FOUND | - | general web; one unread preprint | - | - |
| Titanic II's HSVA results (2013) | NOT FOUND (unpublished) | - | Cruise & Ferry, MarineLink, Deltamarin | - | - |
| SNAME Marine Forensics speed-power analysis | NOT FOUND | - | SNAME pages; search | - | - |
| Progressive-trial tables: Lusitania 1907, Mauretania 1907, Olympic 1911, Aquitania 1914 | NOT FOUND in readable form (Lusitania's and Mauretania's exist: 403 and 404 today) | - | Maritime History of the Great Lakes; Newcastle University; International Marine Engineering 1907-1908; Papers Past | - | - |
| Riveted-hull roughness increments (Kempf 1937, Todd 1951, Allan and Cutland 1958 numbers) | NOT FOUND | - | IOS Press (403), ScienceDirect (403), general web | - | - |
| Olympic-class butts and outer rivet heads (countersunk or snap) | NOT FOUND | - | NIST-IR 6118; The Shipbuilder via GG Archives; forums (403) | - | - |

## 9. For the model

**Keep Holtrop's shape: `SHIP.resist` as built.** The reasons:
1. No curve of her period could be read (section 2). The evidence that could be checked agrees with Holtrop:
   - the roughness allowance of a clean, painted, riveted hull (section 5);
   - friction share at service speed (section 4);
   - power exponents near service speed (sections 3 and 4).
2. The 60-rpm band was derived with an equal-thrust correction. At equal rpm the trial's 18 kn is 17.8 kn at the night, and 18.18 is within "about 18" (section 7). Re-deriving consensus row 25 is the lead's call: 17.8 kn, with 17.3-18.3 if "about" is the nearest knot.
3. Within the shape, fixing 60 rpm costs Slow 30, unless there is a hump near 17-18 kn that no source shows (section 7).

As-built cubic, for the record [R and D]:
- g = [1.0822331610460612, -0.69099582864974440, 0.48388570807433345, 0.12487695952934966] in x = u / (21 kn), held at its values at 3 and 25 kn.
- Fit error against Holtrop's shape: 0.49 % before the renormalisation to g(1) = 1 (e16's figure), **0.84 % after it** [D].
- At 3 / 8 / 12 / 18 / 21 / 22.15 / 22.5 / 25 kn: 0.9938, 0.8961, 0.8687, 0.9241, 1, 1.0383, 1.0510, 1.1561.

**The ready alternative, "HB"**, if the shape is reopened anyway (after the Taylor charts are read, or in M5). It is Holtrop's bare-hull shape with the 18.9 % between it and Biles's level carried as a u^2 term: still air, appendages and the riveted plating's roughness, which Biles's total includes and Holtrop's bare hull does not. It is the physically consistent reading of e16's own premise: Biles's level, Holtrop's shape.

- g = [1.0691114007612996, -0.58073518068275376, 0.40667315554909511, 0.10495062437235900]. x = u / (21 kn), valid 3-25 kn, held outside. Fitted as e16 (least squares, 89 points), then renormalised so that g(1) = 1.
- Fit error: 0.41 % before the renormalisation, 0.70 % after [D].
- At 3 / 8 / 12 / 18 / 21 / 22.15 / 22.5 / 25 kn: 0.9948, 0.9127, 0.8896, 0.9362, 1, 1.0322, 1.0428, 1.1312.
- Speeds: 22.15 / 21.89 / **18.11** / 15.23 / 8.20 kn, 4 of 5 as now. 60 rpm is 0.07 kn better; Slow 30 sits on its band's edge.
- If the gap's non-air part is treated as viscous (scaling like friction) instead of u^2, Slow 30 falls to 8.17. That treatment is in the table of section 6.
- Per `CLAUDE.md`, any change to `SHIP.resist` means the handling refit, a new search of the 1912 geometry, a refit of the area constant, a refrozen headway reference, and Abacus's certified speeds again. A 0.07-kn gain does not pay for that alone.

**To close M6 as `BACKLOG.md` words it ("a period resistance curve read"):**
1. Read eight numbers from one of Gertler's charts with a page viewer:
   - the chart for B/H 3.00 and Cp 0.68 (search page about 195);
   - the curves for volumetric coefficients 2.5 and 3.0 x 10^-3, interpolated to 2.75;
   - at Fn 0.08 (or the chart's lowest), 0.156, 0.184 and 0.226.
   As checks, read the same on the Cp 0.70 chart (about 199) and the B/H 2.25 charts (about 121-125); B/T 2.87 takes 82 % of B/H 3.00. Then apply the three inequalities of section 2.3.
   - If the period curve passes the first, it beats Holtrop at 60 rpm: fit its cubic exactly as in section 9.
   - If it fails like Holtrop, keep Holtrop and close M6.
2. Separately, re-derive the 60-rpm band at fixed rpm (section 7).

## 10. Observed-content note

Every page read was treated as data. None contained instructions addressed to a reader of this kind. Several sites refused the fetch tool (403: Encyclopedia Titanica, ResearchGate, ScienceDirect, IOS Press, HathiTrust, Maritime History of the Great Lakes, USNI), or were gone (404: Newcastle University's Mauretania PDF). Those rows are tagged [S] or NOT FOUND accordingly.
