# Breach inflow at speed: what the literature says (research v1)

Written 2026-11-16 by a research scout (Opus 5.5) for the lead session's brainstorm; web research only; every formula is tagged [quoted], [abstract only] or [from memory, unverified].

Status: COMPLETE (v1), all eight topics plus the ranking. The file is longer than the brief's 3,000-6,000 words (about 10,000 counted on whitespace, formulas included); it was not cut to fit. For the decision, read the ranking table and each section's "What it implies" first.

**Read this first: how far the sources were checked.** In this session the web fetcher could not turn PDF files into text, and the saved copies sit in a folder that the house rules forbid opening. So **[quoted]** below means one of: an HTML page (journal abstract page, open-access HTML full text, Wikipedia), or the archive.org OCR text of an old NASA report. Formulas that live only in PDFs are tagged [from memory, unverified] or [abstract only] even where I am fairly sure of them. A search-engine summary of a page I could not open counts as [abstract only, via search summary], the weakest grade above memory.

**Numbers used throughout (my arithmetic, not from a source).** Breach depth d = 7 m below the undisturbed waterline. Starting jet velocity V_j0 = sqrt(2 g d) = 11.7 m/s.

| Speed | U (m/s) | U^2/2g (m) | U/V_j0 | r = (U^2/2g)/(d + U^2/2g) | Fn (L = 259 m) | draft Froude F_D (D = 10.5 m) | transverse wavelength 2 pi U^2/g (m) | exp(-k*7 m), k = g/U^2 |
|---|---|---|---|---|---|---|---|---|
| 5 kn | 2.57 | 0.34 | 0.22 | 0.046 | 0.051 | 0.25 | 4.2 | 3e-5 |
| 10 kn | 5.14 | 1.35 | 0.44 | 0.162 | 0.102 | 0.51 | 17 | 0.075 |
| 22 kn | 11.32 | 6.53 | 0.97 | 0.483 | 0.225 | 1.12 | 82 | 0.59 |

The dynamic head U^2/2g at 22 knots (6.5 m) is about the same size as the hydrostatic head at the breach (7 m). At full speed, anything that scales with the dynamic head is first-order. At 5 knots almost nothing is.

## T1. Discharge through a wall opening with grazing (cross) flow on the supply side

### What is established

**T1.1 Two conventions; do not mix them.** Let U_g be the grazing velocity at the hole, Delta p_s the static pressure on the supply side minus the pressure at the jet exit, h = Delta p_s/(rho g), and E = h + U_g^2/(2g) the total head.
- Static convention: Q = Cd_s · A · sqrt(2 g h).
- Total-head convention, used by most crossflow literature: Q = Cd_t · A · sqrt(2 g E).
- The two are linked by Cd_s = Cd_t / sqrt(1 - r), with r = (U_g^2/2g)/E. This is algebra [my arithmetic].

**T1.2 Gas-turbine orifices with approach flow across the orifice axis.**
- *Rohde, Richards and Metger (1969)*, [quoted, definitions and trends only; OCR text]. Cd is the "ratio of measured to ideal flow through the orifice". Ideal flow runs from the main-duct TOTAL pressure to the jet-exit static pressure.
  - Correlating parameter: (P_T - p_j)/(P_T - p_d), described as "the ratio of velocity head of the orifice jet to the velocity head in the main duct". In T1.1's notation it equals 1/r. For this ship at 7 m depth it is 22, 6.2 and 2.1 at 5, 10 and 22 knots.
  - Trends: at low velocity-head ratios the data for different duct Mach numbers "tend to form a common curve". Cd decreases with increasing main-duct Mach number and increases with increasing pressure ratio across the orifice. For t/d < 4, Cd increases with t/d at low velocity-head ratio; at high ratio, friction lowers Cd as t/d grows. Rounding the inlet edge raised Cd to "as high as 0.94". The 45-degree orifice gave "significantly higher values".
  - For flow parallel to the orifice axis (their reference 10, no crossflow), Cd rose from 0.61 to a maximum of 0.81 near t/d = 2, then fell.
  - Test range: t/d 0.51 to 4.00, d = 1.5 to 3.2 mm, approach Mach 0 to 0.55, orifice axis at 90 and 45 degrees to the approach flow.
  - The Cd-against-ratio curves are only in the figures, which the OCR copy does not render, so I have no numbers from them.
- *Damerow, Murtaugh and Burggraf (1972, NASA CR-120883)*, [quoted]. Feeder-tube orifice coefficients correlate with orifice Mach number and the ratio of orifice-to-approach velocity heads. Their average is Cd = 0.69, based on upstream static pressure. The trend is "similar to that of the leading edge model with a level reduction of about 20% due to the backside velocity". The velocity-head ratio is defined as total-to-static pressure difference across the hole over total-to-static difference in the feeder tube, the same parameter as Rohde's.
- *Film-cooling holes with internal crossflow*: Gritsch, Schulz and Wittig (1998, AIAA J. 36(6):976-980; 2000, J. Turbomach. 122:146-152; 2001, J. Turbomach. 123:781-787) and Hay, Lampard and Benmansour (1983, J. Eng. Power 105:243-248), [abstract only].
  - Tested ranges: coolant (supply-side) crossflow Mach up to 0.6, external up to 1.2, pressure ratios p_tc/p_m = 1 to 2.25.
  - "discharge coefficients are profoundly affected by the internal and external crossflow conditions"; correlations were derived. I could not open them.
- *Huening (2010, J. Turbomach. 132:031017, doi 10.1115/1.3147102)* compares crossflow and rotation correlations, [abstract only, via citing pages].
  - It follows the idea of McGreehan and Schotsch (1988, J. Turbomach. 110:213-217) that a rotating orifice is "a stationary orifice with a flow approaching at an angle". Cd is then a function of the incidence angle, i.e. of U_g/V_ideal.
  - A citing thesis says Cd "generally decreases with U/C_id" for a straight hole without preswirl.

**T1.3 Manifold ports in water: the closest analogue to a hull breach.** In a sewage-outfall diffuser, water runs along a pipe and leaves through holes in its wall. That is the same geometry as sea water streaming past a hull and entering through a hole, with the moving stream on the supply side.
- *Rawn, Bowerman and Brooks (1960/61)* measured the port coefficients. *Fischer et al. (1979, Mixing in Inland and Coastal Waters, ch. 9)* fitted them [from memory, unverified]:
  - sharp-edged ports: Cd_t = 0.63 - 0.58 r
  - bell-mouthed ports: Cd_t = 0.975 (1 - r)^(3/8)
  - with r = (V_m^2/2g)/E, V_m the pipe velocity at the port, E = h + V_m^2/2g, and port flow q = Cd_t · a · sqrt(2 g E).
- The structure, though not the coefficients, appears in a hydraulics text citing Rawn et al. (1961) [abstract only, via search summary]. There, E is "the sum of the differential pressure head h across the orifice and the velocity head in the manifold", and C_D depends on (v_m^2/2g)/E.
- A later paper revised the constants from the original curves (Wu et al. 2013, per a search summary). Not seen.
- Converted to the static convention, the speed effect relative to the no-flow orifice law is [my arithmetic]:
  - sharp-edged: Q/Q_0 = (1 - 0.92 r)/sqrt(1 - r). This is 0.98, 0.93 and 0.77 at r = 0.046, 0.16 and 0.48 (5, 10, 22 kn at 7 m).
  - bell-mouthed: Q/Q_0 = (1 - r)^(-1/8). This is 1.006, 1.02 and 1.09.
  - So edge shape decides even the sign of the effect.

**T1.4 Open-channel side orifices, slots and sluice gates.** Here the grazing flow is the channel flow along the wall.
- *Ramamurthy, Tim and Sarraf (1986, J. Environ. Eng. 112(2):292-300, doi 10.1061/(ASCE)0733-9372(1986)112:2(292))*, [abstract only]. Cd depends on "a parameter denoting the ratio of mean velocity in the main channel to the resultant velocity of the jet". It also depends on "a parameter relating the length of the orifice and the width of the main channel".
- *Hussain, Ahmad and Asawa (2010, Flow Meas. Instrum. 21(3):418-424; 2011, Agric. Water Manage. 98(10):1536-1544)*, [abstract only]. The coefficient "mainly depends on the approach flow Froude number and ratio of the size of orifice and bed width". A circular orifice "has been found to be more efficient" than a rectangular one of the same area.
  - Hussain et al. (2014, Flow Meas. Instrum.) "Analysis of flow through lateral rectangular orifices" uses a velocity-ratio form, Q = integral of Cd V L dH [abstract only, via search summary].
  - Hussain et al. (2016) extend to submerged circular orifices. Not opened.
- *Regression forms*, [quoted, but reconstructed from text whose superscripts were lost; check before use]. Vatankhah and Rafeifar (2020), elliptical side orifices, as reproduced in Karbasi et al. (2021, Sci. Rep. 11:19784, doi 10.1038/s41598-021-99166-3):
  - Cd = 0.635 - 0.085 (W/b)^0.57 (B/a)^1.33 Fr1^0.91
  - W is the crest height, b and a the semi-axes, B the channel width, Fr1 the approach Froude number.
  - Dataset Fr1 = 0.22 to 0.78; "valid for the range of data used".
- A search summary attributes Cd = 0.714 - 0.062 Fr - 0.347 L/B to an earlier rectangular-orifice study [abstract only]. Not opened.
- Gill (1987) and Ojha and Subbaiah (1997) on side slots: not opened.
- Pattern across this literature: Cd falls roughly linearly with the approach Froude number, by about 0.05 to 0.1 over the tested range. With Fr = U/sqrt(g y) and the head about y, r is about Fr^2/2. So Fr = 0.5 means r of about 0.1, and a fall of about 7%, consistent with T1.3's sharp-edged fit [my arithmetic].

**T1.5 Acoustic and aero orifices under grazing flow.**
- *Baumeister and Rice (1976, NASA TM X-73400)*, [quoted]. In their flow-visualisation tests, the grazing-flow resistance is "an orifice blockage effect". Their boundary layer was about 0.25 of the orifice hydraulic diameter, and they warn a thicker one "may change the magnitude of the resistance".
- *Rogers and Hersh (1975, AIAA paper 75-493; 1976, NASA CR-2681)*, [abstract only, via a citing report's description]. They correlated the steady resistance of isolated square-edged orifices in grazing flow as an effective discharge coefficient. It fell to very small values at high grazing-to-orifice velocity ratio, through blockage of the orifice area by eddies. CR-2681 itself was not opened.
- *Willis, Davis and Hingst (1995, NASA TM-106846)*, [quoted], supersonic (M 1.3-2.5) bleed: rows of round holes outperformed a single spanwise slot, credited to the "increased amount of stream wise edges". This is only qualitative support that edges aligned with the stream help intake. No streamwise slot was tested.

**T1.6 Orientation: a long slit aligned with the flow is a different problem** [from memory, unverified; theory, not found as a test].
- For an opening that is long in the flow direction and uniform along it, inviscid flow obeys the independence principle (the swept-wing / yawed-cylinder result). The cross-plane flow does not see the uniform axial velocity.
- The entering water keeps its tangential velocity U_g. On the free streamline the speed is constant, so the cross-plane speed is constant too. The cross-plane problem is then exactly the classical 2-D jet driven by the static pressure difference alone:
  - Q = Cc · A · sqrt(2 Delta p_s/rho), with Cc = pi/(pi + 2) = 0.611 for a sharp slot in a thin wall.
  - So to first order there is no grazing-flow correction for an aligned slit.
- A short hole (round, or a slot across the flow) forces the stream to turn and separate at its upstream edge. That is the case T1.2-T1.5 describe.
- Corrections to the aligned case come from the slit ends, width variation along the slit, the hull boundary layer, and wall thickness.

**T1.7 Plate thickness.** Shell plate is about 25 mm; slit widths of 1 to 5 cm give t/w = 0.5 to 2.5. In that range the separated jet can reattach inside the passage, raising Cd from 0.61 toward about 0.8 at t/d = 2 (Rohde's reference 10, [quoted] above).
- An opened lap seam is different: a long, narrow passage between overlapping plates, with lap width much greater than the gap. There, friction loss probably lowers Cd below 0.6 [my reading].

**T1.8 Limits.**
- r -> 0: Cd_t -> Cd_0 (0.61-0.63 sharp; about 0.8 for t/d = 2; 0.94-0.975 rounded).
- r -> 1 (no static pressure difference, only the grazing dynamic head): a flush hole without a scoop recovers almost none of the dynamic head, so Q -> 0. The sharp-edged fit extrapolates to Cd_t = 0.05. Rohde's Cd is low near a velocity-head ratio of 1.
- A forward-facing opening is a scoop (an open bow door, or plating bent inward and facing forward). It recovers up to the full U^2/2g at a stagnation point, i.e. it adds a ram head [from memory, unverified].

### Sources
- Rohde, J.E., Richards, H.T., Metger, G.W. (1969). Discharge coefficients for thick plate orifices with approach flow perpendicular and inclined to the orifice axis. NASA TN D-5467. Opened as OCR text: https://archive.org/stream/NASA_NTRS_Archive_19690028630/NASA_NTRS_Archive_19690028630_djvu.txt (record: https://ntrs.nasa.gov/citations/19690028630).
- Damerow, W.P., Murtaugh, J.C., Burggraf, F. (1972). Experimental and analytical investigation of the coolant flow characteristics in cooled turbine airfoils. NASA CR-120883. Opened as OCR text: https://archive.org/stream/NASA_NTRS_Archive_19720019640/NASA_NTRS_Archive_19720019640_djvu.txt
- Baumeister, K.J., Rice, E.J. (1976). Flow visualization in long neck Helmholtz resonators with grazing flow. NASA TM X-73400. Opened as OCR text: https://archive.org/stream/NASA_NTRS_Archive_19760020430/NASA_NTRS_Archive_19760020430_djvu.txt
- Willis, B.P., Davis, D.O., Hingst, W.R. (1995). Flow coefficient behavior for boundary layer bleed holes and slots. NASA TM-106846 / AIAA-95-0031. Opened as OCR text: https://archive.org/stream/NASA_NTRS_Archive_19950013537/NASA_NTRS_Archive_19950013537_djvu.txt
- Hersh, A.S., Walker, B. (1978). NASA CR-2951 (porous liners). Opened; it is not about orifices and does not discuss CR-2681.
- Rogers, T., Hersh, A.S. (1976). NASA CR-2681. Catalogue record only.
- Gritsch, M., Schulz, A., Wittig, S. (1998, 2000, 2001); Hay, N., Lampard, D., Benmansour, S. (1983); Hay, N., Lampard, D. (1998), J. Turbomach. 120:314-319; Huening (Hüning), M. (2010), doi 10.1115/1.3147102; McGreehan, W.F., Schotsch, M.J. (1988). Abstracts or citing descriptions only, via search; publisher pages refused automated access.
- Fischer, H.B., List, E.J., Koh, R.C.Y., Imberger, J., Brooks, N.H. (1979). Mixing in Inland and Coastal Waters, Academic Press, ch. 9; Rawn, A.M., Bowerman, F.R., Brooks, N.H. (1960/61). Diffusers for disposal of sewage in sea water, Proc. ASCE / Trans. ASCE. Not opened; coefficients from memory.
- Ramamurthy, A.S., Tim, U.S., Sarraf, S. (1986). Abstract via the OpenAlex API: https://api.openalex.org (search "lateral orifices open channels").
- Hussain, A., Ahmad, Z., Asawa, G.L. (2010, 2011); Hussain et al. (2014, 2016). Abstracts via search; ScienceDirect refused.
- Karbasi, M. et al. (2021). Sci. Rep. 11:19784. Open access, opened: https://pmc.ncbi.nlm.nih.gov/articles/PMC8492736/

### What it implies for this simulator (my reading)
- Keep the static-head orifice law, but feed it the LOCAL static pressure at the hole (hydrostatic plus the hull's Cp field and wave, T3). Then multiply by an orientation-dependent grazing-flow factor f(r).
  - f = 1 for slits and seams aligned with the flow, the 1912 case (T1.6).
  - f = (1 - 0.92 r)/sqrt(1 - r) for compact, sharp, torn holes, using the T1.3 sharp-edged fit. That gives -2%, -7% and -23% at 5, 10 and 22 knots for a 7 m deep hole, with an empty compartment.
  - Use U_g = local hull-surface speed = U sqrt(1 - Cp), reduced for a narrow slit buried in the boundary layer (about 0.6 U at 1 cm off the wall, 40 m aft of the stem; my estimate).
  - r grows as the compartment fills and h falls, so late in flooding a moving ship's compact holes lose much more than 23%.
- Forward-facing openings get a separate ram term: + C_ram · U^2/2g, with C_ram up to 1.
- Uncertainty in Cd_0 alone is plus or minus 15-30% (thickness, torn edges, lap seams). That is as large as the speed effect at 10 knots, and the speed effect is small next to it at 5 knots.

## T2. Flooding of damaged ships with forward speed

### What is established
- **Headline: I found no study that measures inflow rate, or time to flood, against Froude number for a side breach on a moving ship.**
  - The damaged-ship literature I could reach is almost all at zero speed: Acanfora, Begovic and De Luca (2019) state "the hull is assumed as a rigid body with zero speed"; the FLARE benchmark is in calm water and beam seas; Siddiqui et al. used a flume; Hu et al. ran DTMB 5415 in waves at zero speed.
  - Where speed is included, the papers report motions, attitude and resistance, not inflow against speed.
- **Xue, Gao and Xu (2022)**, [quoted] abstract. CFD (VOF, SST k-omega, overset grid) of a side-damaged DTMB 5415 during "steady flooding", at several forward speeds.
  - "the ship's sinkage increases as the forward speed increases"
  - Asymmetric flooding raises heel and lowers sinkage compared with symmetric flooding.
  - The resistance increase is "mainly caused by the increase of ship sinkage".
  - "The existence of opening that affects the flow field causes additional increase of ship resistance", and pressure resistance is its main component.
  - The full text, with speeds and numbers, did not load (the MDPI page showed the abstract only).
- **Wang, Chen et al. (2026)**, [quoted] abstract. CFD of a damaged naval ship with a body-force propeller in calm water, head seas and beam seas, at four propeller speeds.
  - The ship first runs straight, then turns. In calm water it makes "repetitive circular trajectories toward the damaged side", with the circle diameter growing with propeller speed.
  - "the maximum cumulative ingress of the damaged compartment is positively correlated with the propeller speed" in all three wave conditions. That is the closest thing to an ingress-against-speed result I found. No numbers in the abstract.
- **Domeh, Sobey and Hudson (2015)**, Applied Ocean Research 52:27-36, [abstract only, via OpenAlex and search summaries]. Frigate model at 1/43.62 scale, stationary and at 1.4 m/s (about Fn 0.25 if it is the DTMB 5415 geometry).
  - Permeability had a large effect on pitch and heave with forward speed and a negligible effect when stationary.
  - A summary of the preprint says the damage opening size mattered more at forward speed.
- **Valanto (2023), HSVA**, [quoted]:
  - The Bernoulli law, Q = mu A sqrt(2 (p0 - p1)/rho) (Eqs. 1-3), "describes steady flow in an inertial frame of reference".
  - HSVA Rolls was given Lee's dynamic orifice equation. In the extracted text it reads (sqrt(A)/2) du/dt + (7/8) u^2 = (p0 - p1)/rho; the radical may have been lost. "also the horizontal speed and acceleration due to ship drifting and sway are taken into account".
  - "In the case of a transom stern, the speed of the ship leads to a lower water level at the transom." By analogy, the mean water level on the side changes with drift and sway, which "should have a small effect on the pressure head just outside the damage opening".
  - "Using the classical value for the discharge coefficient (0.6) leads to too short a time to capsize". The FLARE RoPax model tests show vehicle-deck inflow lower than either the Bernoulli or the dynamic-orifice prediction.
  - This is the only paper I found that writes the opening's own motion into the opening equation. Its cases are beam-sea drift and sway, not forward speed.
- **Ruponen** (2007 thesis; pressure-correction flooding, NAPA): continuity plus Bernoulli for water and air, solved by pressure correction [abstract and review only]. I found no version with forward speed.
  - Ruponen et al. (2022, Applied Ocean Research 129:103403) benchmarked flooding codes for a damaged cruise ship (FLARE), in calm water and beam seas only.
- **ITTC procedure 7.5-02-07-04.4** (numerical simulation of capsize of damaged ships), [abstract only, via search summary]. It lists forward-speed effects on water ingress as a modelling item, citing the Herald of Free Enterprise.
- **Accident evidence of speed-driven ingress.**
  - Herald of Free Enterprise (1987), TUHH case page [quoted]: "Due to the fast speed in shallow water the bow wave was high and the vessel dynamically trimmed bow down." Secondary pages (search summaries, [abstract only]) say tests showed the bow wave engulfed the open bow doors at about 18 knots, with bow-door clearance of 1.5-1.9 m.
  - Britannic (1916), Wikipedia [quoted]: flooding "had increased due to the ship's forward motion" (see T6).
- **No simple engineering model was found**, such as h_eff = h + Cp · U^2/2g or a ram head for forward-facing openings. Valanto's remark above is the nearest: the external head should follow the local water level and pressure on the moving hull. The FLOODSTAND and FLARE deliverables are PDFs I could not read.

### Sources
- Xue, W., Gao, Z., Xu, S. (2022). Numerical Study on Attitude and Resistance of a Side-Damaged Ship during Steady Flooding. J. Mar. Sci. Eng. 10(10):1440. Abstract opened: https://www.mdpi.com/2077-1312/10/10/1440
- Wang, S., Chen, J., Zhang, A., Yu, B., Wang, C., Bao, W. (2026). Investigation of the Influence of Propeller Rotational Speed on the Flooding Process, Navigational Trajectory, and Motion Response of a Damaged Naval Ship. J. Mar. Sci. Eng. 14(13):1211, doi 10.3390/jmse14131211. Abstract via OpenAlex.
- Domeh, V.D.K., Sobey, A.J., Hudson, D.A. (2015). A preliminary experimental investigation into the influence of compartment permeability on damaged ship response in waves. Appl. Ocean Res. 52:27-36, doi 10.1016/j.apor.2015.05.001. Southampton pages refused automated access.
- Valanto, P. (2023). On Boundary Conditions for Damage Openings in RoPax-Ship Survivability Computations. J. Mar. Sci. Eng. 11(3):643. Open access HTML, opened: https://www.mdpi.com/2077-1312/11/3/643
- Acanfora, M., Begovic, E., De Luca, F. (2019). A Fast Simulation Method for Damaged Ship Dynamics. J. Mar. Sci. Eng. 7(4):111. Opened: https://www.mdpi.com/2077-1312/7/4/111
- Ruponen, P. et al. (2022). International benchmark study on numerical simulation of flooding and motions of a damaged cruise ship. Appl. Ocean Res. 129:103403. Record: https://repository.tudelft.nl/record/uuid:b12da2fb-48f6-406d-b6c1-f0aa50736dee
- TUHH Institute of Ship Structural Design and Analysis, Herald of Free Enterprise case page: https://tuhh.de/ssi/en/marine-casualty-simulations/herald-of-free-enterprise
- Not reached: Gao and Vassalos (VOF flooding papers, zero speed as far as I know); Siddiqui, Greco, Lugni and Faltinsen (flume, zero speed; abstract via OpenAlex); Bu and Gu; Lee et al. on damaged-ship manoeuvring; Acanfora and De Luca 2016/2017; ITTC Stability in Waves committee reports.

### What it implies for this simulator (my reading)
- No published inflow-against-speed law exists to calibrate against, so the model has to come from first principles: local hull pressure (T3), the opening's orientation (T1), and sinkage and trim (T4).
- The CFD and accident evidence agree on direction: speed matters most for openings near the waterline and the bow (bow wave, dynamic trim), and through added sinkage.
- Two side effects are worth capturing because the literature shows them clearly:
  - resistance rises with flooding, mostly through sinkage;
  - a ship damaged on one side, under power, turns toward the damaged side.

## T3. The pressure field on the hull of a ship at steady speed

### What is established

**T3.0 One formula carries the whole effect** [my derivation: steady Bernoulli in the ship frame; exact for inviscid steady flow].
- Let Cp(x, z) = 1 - |v|^2/U^2 be the surface speed coefficient on the hull, including both the double-body part and the wave part. Then the pressure head at a point at depth d below the undisturbed sea level is:
  - h_ext(x, z) = d + Cp(x, z) · U^2/(2g)
- At the waterline the pressure is atmospheric, so the steady wave profile along the hull is the waterline value of the same coefficient:
  - zeta(x) = Cp_wl(x) · U^2/(2g)
- So a measured or computed hull wave profile, in units of U^2/2g, IS the waterline Cp. Below the waterline the wave part decays and the double-body part takes over.
- d must include the ship's sinkage and trim (T4) and heel.

**T3.1 Double-body (zero-Froude) Cp on fine-to-moderate hulls (Cb 0.6-0.7)** [from memory, unverified; typical magnitudes from potential-flow and towing-tank surveys, not checked against a source in this session]:

| Region | Typical double-body Cp |
|---|---|
| Stem line, plumb stem (stagnation) | +1 |
| First 2-5% of L from the stem, on the side | about +0.2 to +0.5 |
| Entrance region | falls through zero |
| Forward shoulder (end of entrance, about 0.15-0.3 L from the FP) | about -0.1 to -0.3, most negative at the bilge turn |
| Parallel middle body | about -0.05 to -0.1 (displacement speed-up) |
| After shoulder | about -0.1 to -0.2 |
| Stern | positive in potential flow, much reduced by the thick stern boundary layer |

- These are the values to replace with a panel computation (T3.3).
- Measured surface-pressure datasets exist for exactly these purposes, [abstract only]:
  - Longo and Stern (2002), Series 60 CB = 0.6: "Detailed free-surface and mean velocity and pressure flow maps" at Fr = 0.16 and 0.316, model fixed.
  - Kume et al. (2006), KVLCC2M: "surface pressures, and estimated side force distributions" at drift angles 0, 6 and 12 degrees, with trim and sinkage fixed at zero and no rudder.
  - The IIHR Series 60 reports (Toda, Stern and Longo 1992) also carry surface pressures.
  - The classic towing-tank surveys named in the brief (Eggert 1935/1939, Laute 1933) were not found online.

**T3.2 The wave part.**
- *Wavelength and depth decay.* The ship's transverse waves travel at phase speed U. From the deep-water limit of the dispersion relation, omega^2 = g k tanh(k h) [quoted, Wikipedia], their wavenumber is k = g/U^2 and their wavelength 2 pi U^2/g = 2 pi Fn^2 L [derived].
  - Wave pressure decays as exp(k z), z negative downward [from memory, standard linear theory].
  - At 7 m depth the factor is 3e-5, 0.075 and 0.59 at 5, 10 and 22 knots (table at top).
  - So the transverse-wave part of the head at the 1912 breach depth is nil at 5 knots, small at 10 knots, and more than half its surface value at 22 knots.
  - The bow wave is a local near-field disturbance shorter than the transverse wavelength, so it decays faster with depth than exp(g z/U^2) [my reading].
- *Wave profile along the hull at Fn 0.20-0.25*, in units of U^2/2g [from memory, unverified]:
  - bow crest about +0.5 to +1.0, within about U^2/g of the stem;
  - first trough about -0.2 to -0.4 at the forward shoulder (about 0.15-0.25 L aft of the FP);
  - then the transverse system, wavelength 0.32 L at Fn = 0.225, amplitude about 0.1-0.3 along the parallel middle body.
  - For this ship at 22 knots the 5-76 m breach (0.02-0.29 L) runs from the bow crest into the first trough. That is the region where the sign of the speed effect flips.
- *Bow-wave relations*, Noblesse, Delhommeau, Guilbaud, Hendrix and Yang (2008), J. Fluid Mech. 600:105-132, [abstract only] from the Cambridge abstract page:
  - The relations give "the height of a ship bow wave, the distance between the ship stem and the crest of the bow wave, the rise of water at the stem, and the bow wave profile". They are written in terms of ship speed, draught and waterline entrance angle, and are consistent with experiments on non-bulbous wedge-shaped bows with small flare.
  - A fine waterline (2 alpha_E < about 25 degrees) can generate a steady bow wave at any speed; fuller ones only above a critical speed.
  - The J. Hydrodynamics review (Noblesse et al. 2013, 25(4):491-501), [quoted] abstract: "slow ships with blunt bows create highly unsteady and turbulent breaking bow waves".
- *The height formula itself*, [from memory, unverified]:
  - Z_b · g/U^2 = 2.2 · tan(alpha_E) / [cos(alpha_E) · (1 + F_D)]
  - F_D = U/sqrt(g D) is the draft Froude number, D the draft, alpha_E the waterline half-entrance angle.
  - Two things support it:
    - A search summary of a Nantes conference paper shows the same ingredients and the coefficient 2.2, in garbled form.
    - Delhommeau, Guilbaud, David, Yang and Noblesse (2009, J. Fluid Mech. 620:167-175), [quoted] from the abstract page as rendered by the fetcher, give the boundary between unsteady and overturning bow-wave regimes as U/sqrt(gD) = 4.4 tan(alpha)/cos(alpha) - 1. That is exactly where the formula above reaches Z_b = U^2/(2g), the Bernoulli stagnation limit. The 2013 review, [quoted], says the two regimes "are due to a nonlinear constraint related to the Bernoulli relation at the free surface".
  - For this ship, with alpha_E = 13-18 degrees, the boundary lies at F_D = 0.04-0.5. So 5 knots (F_D = 0.25) may be in the unsteady, breaking regime, and 10 and 22 knots are in the steady, overturning regime.
  - For this ship (D = 10.5 m, alpha_E taken as 13-18 degrees; check against the lines): Z_b = 0.3-0.4 m, 0.9-1.35 m and 3.2-4.6 m at 5, 10 and 22 knots.
  - The rise cannot exceed U^2/2g (stagnation), which caps the 5-knot value at 0.34 m.
  - Valid for non-bulbous wedge-like bows, small flare and rake, steady (non-breaking) bow waves. I do not have the companion relation for the crest distance X_b.

**T3.3 Cheap theories for precomputing a table Cp(x, z; Fn)** [from memory, unverified]:
- *Zero-Froude-number panel method* (Hess and Smith 1964, J. Ship Res. 8). Source panels on the hull and its mirror image above the waterline (double body).
  - Cost: a dense N x N solve; N = 2,000-5,000 panels takes seconds to a minute.
  - Gives Cp_db(x, z) everywhere on the hull, including the bilge suction peaks.
  - Misses: all waves; the boundary layer and stern separation.
  - Good on the forebody, which is where the breaches are.
- *Michell (1898) thin-ship theory.* Centreplane sources with strength proportional to the hull slope dy/dx, Kelvin Green function.
  - Cost: cheap (double integrals over the centreplane).
  - Gets wave-resistance trends for fine hulls.
  - Gets wrong: the near field at the bow and waterline, especially for blunt or full bows (it overpredicts); no double-body near field beyond first order; no coupling to sinkage and trim.
- *Slender-body theory* (Tuck; Ogilvie; Newman). Pressures from the sectional-area curve.
  - Good for global sinkage and trim and far-field waves.
  - Unreliable locally at the bow, where sections change quickly.
- *Dawson-type linearized free-surface panel method* (Dawson 1977; e.g. SHIPFLOW-XPAN type codes). Double-body base flow plus Rankine sources on the free surface.
  - Cost: minutes per Froude number.
  - Gives hull wave profile, Cp_total(x, z), sinkage and trim. The usual engineering choice for such a table.
  - Errors: the bow-wave crest is underpredicted, and breaking is not represented.
- *Neumann-Michell theory* (Noblesse, Huang, Yang and co-workers, about 2008-2013). Keeps Michell's simplicity but satisfies the hull boundary condition. Reported to give realistic wave profiles for Wigley, Series 60 and DTMB 5415 at moderate Fn.
- *RANS CFD with free surface*: the reference answer, at hours per case.

### Sources
- Longo, J., Stern, F. (2002). Effects of drift angle on model ship flow. Exp. Fluids 32:558-569, doi 10.1007/s00348-001-0397-0. Abstract opened: https://link.springer.com/article/10.1007/s00348-001-0397-0
- Kume, K. et al. (2006). Measurements of hydrodynamic forces, surface pressure, and wake for obliquely towed tanker model and uncertainty analysis for CFD validation. J. Mar. Sci. Technol. 11:65-75, doi 10.1007/s00773-005-0209-y. Abstract opened: https://link.springer.com/article/10.1007/s00773-005-0209-y
- Noblesse, F., Delhommeau, G., Guilbaud, M., Hendrix, D., Yang, C. (2008). Simple analytical relations for ship bow waves. J. Fluid Mech. 600:105-132, doi 10.1017/S0022112008000220. Abstract opened: https://www.cambridge.org/core/journals/journal-of-fluid-mechanics/article/simple-analytical-relations-for-ship-bow-waves/AD9636CDD23B883D138A7936F618B244
- Noblesse, F., Delhommeau, G., Liu, H., Wan, D., Yang, C. (2013). Ship bow waves. J. Hydrodynamics 25(4):491-501, doi 10.1016/S1001-6058(11)60388-1. Abstract opened: https://link.springer.com/article/10.1016/S1001-6058(11)60388-1. Its PDF copy at a university server triggered a download prompt and was abandoned.
- Delhommeau, G., Guilbaud, M., David, L., Yang, C., Noblesse, F. (2009). Boundary between unsteady and overturning ship bow wave regimes. J. Fluid Mech. 620:167-175, doi 10.1017/S002211200800462X. Abstract opened: https://www.cambridge.org/core/journals/journal-of-fluid-mechanics/article/boundary-between-unsteady-and-overturning-ship-bow-wave-regimes/B559E643ED6374D91802AF2F4370E02F
- Wikipedia, "Dispersion (water waves)", for the dispersion relation.
- Not reached: Hess and Smith (1964); Michell (1898); Dawson (1977); Toda, Stern and Longo (1992); Eggert; Laute; Neumann-Michell papers (J. Eng. Math.); Gothenburg 2010 / Tokyo 2015 KCS and DTMB 5415 wave-profile data, which exist only as plots and spreadsheets.

### What it implies for this simulator (my reading)
- Replace the flat sea at rest with h_ext(x, z) = d(x, z; sinkage, trim, heel) + Cp(x, z; Fn) · U^2/2g.
- Build the Cp table once per hull from a double-body panel run (Fn = 0) plus a few Dawson-type or CFD runs (Fn = 0.05 to 0.23), at level trim.
- Below 10 knots, the double-body table alone is enough: waves at 7 m depth are under 8% of an already small dynamic head.
- At 22 knots the term is first-order: Cp from about +0.4 to -0.3 over the 1912 breach is +2.6 m to -2 m of head against 7 m hydrostatic. The breach's fore and aft ends then see opposite-signed effects, so the breach must be integrated in segments along x, not as one lumped opening.

## T4. Sinkage and trim under way in deep water

### What is established
- **Scaling.** Wikipedia's squat article, [quoted], written for shallow and confined water: squat is "approximately proportional to the square of the speed". It is "usually felt more when the depth/draft ratio is less than four". And "finer lined vessels Cb <0.7 squatting by the stern and vessels with a Cb >0.7 squatting by the head or bow".
  - Titanic's Cb of 0.68 sits on that boundary.
  - In the North Atlantic (depth about 3.8 km) the shallow-water squat formulas do not apply.
- **Shallow-water theory** (Tuck 1966, J. Fluid Mech. 26; Tuck and Taylor 1970), [abstract only, via search summary]. Sinkage and trim scale as Fh^2/sqrt(1 - Fh^2), with depth Froude number Fh = U/sqrt(g h). Gourlay and Tuck treat the sinkage coefficient C_s as a "near-universal" constant that depends only weakly on hull shape.
  - Familiar engineering forms [from memory, unverified]: Hooft (1974), s = 1.46 (nabla/L^2) Fh^2/sqrt(1 - Fh^2); ICORELS, s_bow = 2.4 (nabla/L^2) Fh^2/sqrt(1 - Fh^2).
  - For Fh -> 0 (deep water) these go to zero. Deep-water sinkage is governed by Fn instead, and is much smaller.
- **Deep-water magnitudes at Fn 0.2-0.26** for conventional cargo and liner hulls (Series 60, KCS class) [from memory, unverified]:
  - Mean sinkage about 0.1-0.2% of L, i.e. about 0.05-0.08 · U^2/2g.
  - Dynamic trim of order 0.1 degree. At Fn 0.2 or less it is usually slightly bow-down for full forms; it turns stern-down as the wave system grows above Fn of about 0.25-0.3.
  - The Tokyo 2015 KCS case (Fr 0.108 to 0.282) plots experimental sinkage and trim, but the values sit in a spreadsheet the page links and does not print. [quoted] The page gives the sign conventions only: "a positive (+) sinkage value is defined upwards" and "a positive (+) trim value is defined bow up".
- **Damaged hulls.**
  - Xue et al. (2022), [quoted] abstract: for the side-damaged hull, "the ship's sinkage increases as the forward speed increases".
  - Longo and Stern (2002), [quoted] abstract: with drift angle beta, "the increases in the side force, drift moment, sinkage, trim, and heel with beta are quadratic".

### Sources
- Wikipedia, "Squat effect": https://en.wikipedia.org/wiki/Squat_effect
- Tokyo 2015 workshop, KCS case 2.1 instructions: https://t2015.nmri.go.jp/Instructions_KCS/Case_2.1/Case_2-1.html
- Gourlay (Curtin CMST) papers and Tuck (1966) were seen only as search summaries; PDFs not readable here.
- Xue et al. (2022) and Longo and Stern (2002), as in T2 and T3.

### What it implies for this simulator (my reading)
- At 22 knots, deep-water sinkage of about 0.06 · U^2/2g, about 0.4 m, deepens the breach by about 5%: +2-3% inflow. Trim of about 0.1 degree moves the bow by plus or minus 0.2 m.
- At 10 knots the sinkage is about 0.08 m; at 5 knots about 0.02 m.
- Modelling it as s = C_s · U^2/2g with C_s of about 0.06 (applied to heave), plus a trim term of the same form, is cheap and enough. Do not use shallow-water squat formulas.
- Flooding-induced trim (metres at the bow) dwarfs dynamic trim within minutes.

## T5. Pressure and flow at the hull in a turn

### What is established
- **Measured trends**, Longo and Stern (2002, Series 60, beta = 0-10 degrees, Fr 0.16 and 0.316), [quoted] abstract:
  - "The wave profile is only affected near the bow, i.e. the bow wave amplitude increases/decreases on the windward/leeward sides".
  - Side force, drift moment, sinkage, trim and heel rise quadratically with beta; resistance rises linearly.
  - Kume et al. (2006) measured "surface pressures, and estimated side force distributions" on KVLCC2M at beta = 0, 6 and 12 degrees, [abstract only, numbers not seen]. That paper is the right source for a measured side-to-side Delta Cp along the length.
- **Low-aspect-ratio and slender-body estimate** [from memory, unverified]:
  - Clarke-type regression for the linear side-force derivative: Y'_v = -pi (T/L) (1 + 0.40 Cb B/T), normalised by (1/2) rho U^2 L T. For this ship (T/L = 0.041, B/T = 2.7, Cb = 0.68) that gives Y'_v of about -0.22.
  - Slender-body theory puts most of this force where the sections change: the bow, and for a plumb-stemmed, constant-draft hull it piles up near the stem.
  - If the side force at drift beta acts over the forward 20% of the length, the mean side-to-side pressure difference there is Delta Cp of about 0.22 beta/0.2, about 1.1 beta (beta in rad), i.e. plus or minus 0.55 beta per side. That is about plus or minus 0.1 per side at beta = 10 degrees, with larger values within a few per cent of L of the stem.
- **Local drift in a turn** [from memory, unverified]:
  - The local drift is beta(x) = beta - r' x/L (r' = r L/U), which vanishes at the pivot point. In a steady turn the pivot point lies about L/4 to L/3 aft of the bow.
  - Forward of the pivot point the outer bow is the suction side; aft of it the outer side is the pressure side.
  - A hard turn of a liner: beta at midships about 5-10 degrees, r' about 0.3-0.5.
- **Heel in a steady turn** [from memory, unverified]: tan(phi) is about (V^2/(g R)) · (KG - T/2)/GM, heeling outward.
  - With turning speed 7 m/s, R = 600 m, KG - T/2 = 9 m and GM = 0.8 m (assumptions; check against the model), phi is about 5 degrees.
  - At a bow-side point 10-14 m off the centreline, that changes depth by plus or minus 0.9-1.2 m. That is as large as the hydrodynamic term.

### Sources
- Longo and Stern (2002) and Kume et al. (2006): abstracts as listed in T3.
- Clarke, Gedling and Hine (1983, RINA), Inoue et al. (1981), and segmented-model tests of lateral force distribution: not reached.

### What it implies for this simulator (my reading)
- Bound for a bow-side breach in a hard turn at 20 knots (U^2/2g = 5.4 m):
  - hydrodynamic cross-flow: plus or minus 0.3 to 1.0 m (local Delta Cp/2 of 0.05-0.2);
  - turning heel: plus or minus 0.5 to 1.2 m.
  - Together: typically about plus or minus 1 m (plus or minus 7% of inflow). Worst case, both terms aligned: about plus or minus 2 m, i.e. +15% or -17% of inflow.
- The signs depend on the side of the breach, which side the turn goes to, the phase of the turn, and where the breach lies relative to the pivot point. They can cancel: in a port turn, a starboard-bow breach forward of the pivot point sits on the suction side, while the outward heel to starboard deepens it.
- The model already has heel; it needs the turning heel moment and a cross-flow term Delta Cp(x) proportional to beta(x).
- At 5 knots everything here is divided by about 16, so it is negligible.

## T6. Openings near the waterline under way

### What is established
- **Steady wave profile.** The hull wave profile is the waterline Cp (T3.0). At Fn 0.2-0.25: a bow crest of about 0.5-1.0 × U^2/2g a short distance aft of the stem, a trough of about -0.2 to -0.4 × U^2/2g at the forward shoulder, then transverse waves of length 2 pi U^2/g [from memory, unverified].
  - With the Noblesse-type relation (T3.2, unverified), the bow-crest rise above the static waterline is 0.3-0.4 m, 0.9-1.35 m and 3.2-4.6 m at 5, 10 and 22 knots.
  - A ship trimmed by the head has a blunter, deeper bow and a larger bow wave than this level-trim estimate [my reading].
- **Drift and turning.** The windward bow wave grows and the leeward one shrinks, [quoted] Longo and Stern (2002).
- **Valanto (2023)**, [quoted]: speed lowers the water level at a transom stern. The same reasoning applies to openings near the stern.
- **Britannic (1916)**, Wikipedia, [quoted]:
  - "there were open portholes along the front lower decks, which tilted underwater within minutes of the explosion". The nurses had opened them to ventilate the wards.
  - The captain turned "towards the island of Kea in an attempt to beach her", driving the port shaft faster than the starboard because the steering gear was out.
  - Flooding "had increased due to the ship's forward motion".
  - Two lifeboats were "drawn towards the still-turning, partly surfaced propellers" (T8).
  - She sank "55 minutes after the explosion".
- **Herald of Free Enterprise (1987)**: the bow wave over the open bow doors under way (T2). Shallow water made the bow wave higher and the trim more bow-down.
- **Rules.** Freeboard and bow-height rules (ICLL 1966 Reg. 39) set a minimum bow height against green water in waves, not against the steady bow wave. From memory: for L of 250 m or more, about 7.0 m × 1.36/(Cb + 0.68) [unverified]. I found no rule or study that gives the effective water elevation at the side against speed for portholes.

### Sources
- Wikipedia, "HMHS Britannic": https://en.wikipedia.org/wiki/HMHS_Britannic
- Valanto (2023) and Longo and Stern (2002), as above.
- TUHH Herald of Free Enterprise page, as in T2.
- ICLL 1966 text and green-water studies (Buchner, Greco, Faltinsen): not opened.

### What it implies for this simulator (my reading)
- For openings within about U^2/2g of the static waterline (portholes, sideports, deck edges, the forecastle), the exposure test must use zeta(x) = Cp_wl(x) · U^2/2g + sinkage + trim + heel, not the flat sea.
- Model the overflow as a weir with head H = zeta(x) - z_sill. Where the crest is moving past the opening, as with the bow wave at an open forward porthole, treat it as a weir with approach velocity [my reading]. The tangential velocity is about U, so a forward-facing or recessed porthole gets part of the ram head (T1.8).
- The 1916 Britannic case is a direct test of this: open portholes forward, bow-down trim, forward motion and a turn together.

## T7. Water inside the ship under ship accelerations

### What is established
- **Quasi-static limit** [from memory, standard mechanics].
  - In the ship frame, flood water feels the apparent gravity g_app = g - a, where a is the acceleration of the compartment.
  - A slowly forced free surface stays flat and normal to g_app, with slope tan theta = a/g.
  - The approximation holds when the forcing changes slowly compared with the compartment's lowest sloshing period.
- **Sloshing periods.**
  - Gravity-wave dispersion relation, [quoted] from Wikipedia: omega^2 = g k tanh(k h). For a rectangular tank of length L_c and depth h, the n-th mode has k = n pi/L_c [from memory, standard]. The shallow-water limit is Merian's formula, [quoted] from Wikipedia, for "an enclosed rectangular body of water": T = 2 L/sqrt(g h).
  - Examples [my arithmetic]:
    - L_c = 20 m (fore-aft), h = 3 m: T1 = 7.6 s.
    - L_c = 28 m (across the beam), h = 5 m: T1 = 8.4 s.
    - L_c = 30 m, h = 1 m (a thin layer on a deck): T1 = 19 s.
  - Olympic-class compartments therefore slosh at periods of roughly 6 to 20 s.
- **Accelerations a moving liner applies to its flood water** [my arithmetic].
  - Slowing from 22 knots over about 1 km (engines stopped or astern): a_x about U^2/(2s), about 0.06 m/s^2. Free-surface slope 0.006, i.e. about 0.1 m of level difference over a 20 m compartment.
  - Steady turn at 20 knots on a radius of about 600 m (an assumption; check the model's turning data): a_y about U^2/R, about 0.18 m/s^2. Slope 0.018, i.e. plus or minus 0.25 m across the 28 m beam.
  - These change over tens of seconds to minutes, far slower than the 6-20 s sloshing periods, so flat-and-tilted is a good model.
- **Lumped-mass floodwater models.** Manderbacka, Mikkola, Ruponen and Matusiak (2015), [quoted] from the VTT record:
  - "Floodwater motion modelling is based on the lumped mass method with a moving free surface".
  - Viscous dissipation of the floodwater motion is represented by an equivalent friction coefficient.
  - "Transient flooding tests show that the inflow momentum has to be accounted for when the undivided compartment is flooded".
  - Experiments showed a large first roll toward the undamaged side; the model reproduces it by including the momentum flux of the inflooding jet.
  - Earlier lumped-mass and pendulum models: Papanikolaou, Spanos and co-workers (NTUA; floodwater as a mass sliding with friction, coupled to ship motion), and Jasionowski (2001, PhD, Strathclyde) [from memory, unverified].
- **Bernoulli in a moving frame.** From the review by Rodrigues (2024), [quoted]:
  - "the Bernoulli equation describes a steady flow in an inertial frame of reference, which is not the case when the vessel is moving".
  - It also "assumes the flow into an opening to be solely dependent on the pressure difference across it and that the flow reacts instantly", which "may result in slightly shorter times to capsize being predicted".
  - "A dynamic orifice equation is a way to approach this issue."
  - Valanto's method sets the velocity at the damage opening as a combination of the shallow-water-equation velocity and the Bernoulli or dynamic-orifice velocity.
- **Dynamic orifice equation.** Lee (2015), [abstract only]: investigates the dynamic orifice equation for large openings. The square-root singularity in the usual orifice equation caused pressure "ripples", which the new formulation removes. It also proposes accumulator-type compartment models for air pressure.
  - The usual form is [from memory, unverified]: (L_eff/g) dV/dt + V|V|/(2 g Cd^2) = Delta h, where L_eff is an inertial length of order the opening size.
  - For a slit in 25 mm plate, L_eff is centimetres to decimetres, so the time constant L_eff/V is about 0.01 s and the term is negligible here. It matters for large openings.
- **Momentum carried across the hull** [my derivation from momentum conservation; not from a source].
  - *Ram drag.* Water that was nearly at rest in the earth frame ends up moving with the ship, so the ship must supply rho · Q · U. With Q about 0.6 × 0.75 m^2 × 11.7 m/s = 5.3 m^3/s at 22 knots, that is about 60 kN. Olympic-class resistance at 22 knots is of order 2 MN, so the ram drag is about 3%.
  - *Jet reaction.* The missing outside pressure on the hole area pushes the hull toward the damaged side with force p·A. The jet's momentum flux rho Q V_j = 2 Cc p A, stopped inside, pushes the other way. The net is about (2 Cc - 1) p A, about 0.2 p A, toward the undamaged side. For 0.75 m^2 at 7 m (p = 70 kPa) that is about 12 kN: negligible for this ship. It matters for small models with large, sudden openings, as Manderbacka et al. measured.

### Sources
- Manderbacka, T., Mikkola, T., Ruponen, P., Matusiak, J. (2015). Transient response of a ship to an abrupt flooding accounting for the momentum flux. J. Fluids Struct. 57:108-126, doi 10.1016/j.jfluidstructs.2015.06.001. Abstract page opened: https://cris.vtt.fi/en/publications/transient-response-of-a-ship-to-an-abrupt-flooding-accounting-for/
- Rodrigues, J.M. (2024). A Review of Methods for Modelling Flooding, Its Progression and Outcome in Damaged Ships. J. Mar. Sci. Eng. 12(2):251. Open access HTML, opened: https://www.mdpi.com/2077-1312/12/2/251 (section 3.4.1).
- Lee, G.J. (2015). Dynamic orifice flow model and compartment models for flooding simulation of a damaged ship. Ocean Eng. 109:635-653, doi 10.1016/j.oceaneng.2015.09.051. Open access per OpenAlex, but the publisher page showed a CAPTCHA, so abstract only via OpenAlex.
- Wikipedia, "Dispersion (water waves)" and "Seiche", opened for the two textbook formulas.

### What it implies for this simulator (my reading)
- Quasi-static flood water with a free surface normal to g - a is adequate at liner accelerations. The tilt is 0.1-0.3 m, but it matters near weir crests (bulkhead tops, deck edges), where Q goes as H^1.5. Use g - a in the level solver and weir heads once the ship moves.
- Add rho Q U to the resistance if the ship's speed is integrated; it is small but free. Skip the jet reaction for this ship.
- More important than either: under way, a compartment with ONE hole does not fill to the outside waterline. It fills to the local static-pressure level at the hole, i.e. waterline + Cp_hole · U^2/2g + local wave term.
- A compartment with TWO holes at different hull Cp carries a through-flow driven by Delta Cp · U^2/2g. At 22 knots a Delta Cp of 0.3 is 2 m of head. The flow-network solver should therefore take each opening's external head from its own (x, z), not from one shared sea level.

## T8. Propeller and rudder emergence

### What is established
- **Thrust-loss bookkeeping**, [quoted] from Kozlowska, Steen et al. (2020), Eq. 4. The total thrust-loss factor is beta_T = K_T/K_T0 = beta_VC · beta_W · beta_0 · beta_1:
  - beta_VC: ventilation;
  - beta_W: Wagner (dynamic lift build-up) effect;
  - beta_0: loss of submerged disc area;
  - beta_1: steady wave motion.
  - Symbols: h is the "propeller submergence from the shaft centre to the free surface" and R the propeller radius.
- **Regimes** [quoted]. "Deeply submerged" means h/R > 3.4. Free-surface ventilation occurs for -1 < h/R < 1.2. "The dominating thrust losses are, at least in most cases with significant forward speed, not due to ventilation but due to loss of submerged propeller disk area."
- **Geometric disc-area loss** for h/R < 1 (Gutsche 1962), [quoted] Eq. 5: beta_0 = 1 - arccos(h/R)/pi + (h/(pi R)) · sqrt(1 - (h/R)^2).
  - It gives 1 at h/R = 1 (tip at the surface), 0.80 at h/R = 0.5 and 0.5 at h/R = 0 (shaft at the surface) [my arithmetic].
- **Minsaas, Faltinsen and Persson (1983) empirical fit**, [quoted] Eqs. 7-8, as reproduced by Kozlowska, Steen et al. It covers disc-area loss, wave making and the Wagner effect together:
  - beta = 1 - 0.675 (1 - 0.769 · h/R)^1.258 for h/R < 1.3
  - beta = 1 for h/R >= 1.3
  - Values [my arithmetic]: 0.89 at h/R = 1.0, 0.63 at 0.5, 0.325 at 0.
- **Torque** [quoted] Eqs. 9-10: K_Qt = beta_T^m · K_Qn, with "m is constant between 0.8 and 0.85".
- **A measured point** [quoted]: at h/R = 1.2, the thrust loss factor due to ventilation was 0.78 in experiment.
- **Other terms.** Their Eq. 6 (Wagner term) and Eq. 1 (Minsaas's fully ventilated blade model) did not survive text extraction cleanly; not reproduced here.
- **Rudder** [from memory, unverified]:
  - Rudder normal force scales with inflow velocity squared, the lift slope, and the submerged area.
  - Lift slope approx. 2 pi Lambda/(Lambda + 2), with Lambda the effective aspect ratio.
  - While the rudder's top edge is close under the hull, the hull acts as an end plate and the effective aspect ratio is about twice the geometric one. Once the top of the rudder breaks the surface, that mirror effect is lost (a free surface at speed acts as a pressure-release boundary), and ventilation can follow down the suction side.
  - A first model: force proportional to submerged-area fraction times lift-slope(Lambda_eff), with Lambda_eff dropping from about 2 Lambda_geom to Lambda_geom as the rudder's top emerges.

### Sources
- Kozlowska, A.M., Dalheim, O.O., Savio, L., Steen, S. (2020). Time Domain Modeling of Propeller Forces due to Ventilation in Static and Dynamic Conditions. J. Mar. Sci. Eng. 8(1):31. Open access HTML, opened: https://www.mdpi.com/2077-1312/8/1/31 (Eqs. 4-10, section 2).
- Minsaas, K., Faltinsen, O., Persson, B. (1983). On the importance of added resistance, propeller immersion and propeller ventilation for large ships in a seaway. PRADS 1983, Tokyo. Not opened; formula as reproduced above.
- Gutsche, F. (1962). Schiffbauforschung, Heft 1. Not opened.
- Kozlowska, A., Savio, L., Steen, S. (2017). Predicting thrust loss of ship propellers due to ventilation and out of water effect. J. Ship Res. 61:198-213. Not opened.
- Smogeli (2006) NTNU thesis, Faltinsen's Sea Loads, Koushan (2006): not opened in this pass.

### What it implies for this simulator (my reading)
- Multiply thrust by Minsaas's beta(h/R) per shaft, using the instantaneous shaft-centre submergence from the pose. Multiply torque by beta^0.8, so an emerging wing screw races if the governor holds torque.
- For an Olympic-class wing screw (diameter about 7 m, so R about 3.6 m; check against the model's own data), the loss starts once the shaft centre is less than about 4.7 m below the local surface. That is a stern rise of only a metre or two from a deep-draft shaft. The loss reaches two-thirds when the shaft centre is at the surface.
- This matters for the Britannic-type scenario: steaming hard while trimmed by the bow, with the screws coming out of the water. It does not matter for the 1912 run, where the engines were stopped long before the stern rose.
- Treat rudder authority the same way: submerged-area fraction times a step loss of the end-plate effect.

## Ranking for this ship

**Basis.** A slit 7 m below the waterline on the starboard bow, 5-76 m aft of the stem, with the compartment initially empty. Head changes are in metres against the 7 m hydrostatic head. The inflow change uses Q proportional to sqrt(head). All numbers are my order-of-magnitude estimates from the sections above. Confidence describes what the literature supports, not my arithmetic.

| # | Effect | 5 kn | 10 kn | 22 kn | Confidence | Model it? |
|---|---|---|---|---|---|---|
| 1 | Hull pressure field Cp (double body plus waves) at 7 m depth. Cp from about +0.4 at the fore end of the breach to about -0.3 at the forward shoulder (T3) | +0.13 / -0.10 m (+1% / -1%) | +0.5 / -0.4 m (+4% / -3%) | +2.6 / -2.0 m (+17% / -15%) | Physics high; values low (from memory) | Yes: Cp(x, z; Fn) table, breach integrated in x-segments |
| 2a | Grazing flow on Cd, slit aligned with the flow (the 1912 seams) | about 0 | about 0 | about 0 | Low (theory only, T1.6) | f = 1 |
| 2b | Grazing flow on Cd, compact sharp-edged hole | -2% | -7% | -23% (about -40% once the inside level leaves only 2 m of head) | Low (fit from memory, T1.3) | Yes, for compact holes |
| 2c | Grazing flow on Cd, rounded or bell-mouthed entry | +0.6% | +2% | +9% | Low | Rarely relevant |
| 3 | Ram head at a forward-facing opening (upper bound, full stagnation) | +0.34 m (+2%) | +1.35 m (+9%) | +6.5 m (+40%) | High as a bound | Only for opening types that face forward |
| 4 | Deep-water sinkage (about 0.06 U^2/2g) | +0.02 m (+0.1%) | +0.08 m (+0.6%) | +0.4 m (+3%) | Medium (scaling), low (coefficient) | Yes, cheap |
| 5 | Dynamic trim (about 0.1 degree at 22 kn) | about 0 | plus or minus 0.05 m | plus or minus 0.2 m (plus or minus 1.5%) | Low | Optional |
| 6 | Hard turn: cross-flow plus turning heel (T5) | plus or minus 0.1 m (under 1%) | plus or minus 0.5 m (plus or minus 4%) | plus or minus 1-2 m (plus or minus 7-15%, at 20-22 kn) | Low | If turning is modelled; sign depends on turn side and pivot point |
| 7 | Bow-wave rise at the waterline (affects portholes and deck edges, not the 7 m slit) | 0.3 m | 0.9-1.35 m | 3.2-4.6 m (crest), about -2 m (shoulder trough) | Low-medium | Yes, for near-waterline openings |
| 8 | Fill level of a compartment open to the sea: shifted by Cp_hole U^2/2g; through-flow between holes with different Cp | plus or minus 0.1 m | plus or minus 0.5 m | plus or minus 2 m | High (physics) | Yes |
| 9 | Ram drag rho Q U on ship speed (not on inflow); Q about 5 m^3/s | 14 kN (about 15% of the then-small resistance) | 28 kN (about 7%) | 61 kN (about 3%) | High | Optional, cheap |
| 10 | Jet reaction, (2 Cc - 1) p A | about 12 kN at any speed | same | same | High | No |
| 11 | Flood-water sloshing and tilt from ship accelerations | under 0.05 m | about 0.1 m | 0.1-0.3 m | High | Only via g - a at weir crests |
| 12 | Inertia in the opening (dynamic orifice equation) for slits | about 0 | about 0 | about 0 | High | No; yes for metre-size openings in waves |
| 13 | Propeller and rudder emergence | 0 at level trim | 0 | 0 | Medium-high (formula quoted) | Only when the stern rises more than about 1-2 m (Britannic-type) |

**Reading the table** (my reading):
- **At 5 knots** nothing exceeds about 2% except a forward-facing ram opening. The flat-sea model is fine.
- **At 10 knots**, the hull Cp field, compact-hole Cd and ram are the only effects above about 3%.
- **At 22 knots**, three effects are first-order and of comparable size: the hull Cp field (with opposite signs along the 1912 breach), the opening-type Cd effect, and, for openings near the waterline, the bow wave. Sinkage, trim and turning are second-order. Momentum terms, sloshing and orifice inertia stay negligible.
- **Overall uncertainty.** Uncertainty in the zero-speed Cd (thickness, torn edges, lap seams: plus or minus 15-30%) is as large as every speed effect except the 22-knot ones.

## Not found / paywalled / not checked

**Tool limitation (applies throughout).**
- PDFs could not be read as text in this session: the fetcher returns raw bytes, and the saved copies sit under a folder the house rules forbid opening. Anything that exists only as a PDF was therefore not verified.
- One attempt to view a PDF in the built-in browser made the server send it as a download, so a save dialog appeared on the desktop (the 2013 "Ship bow waves" review at a university server). I abandoned it and did not retry; the dialog may need dismissing.
- Several API responses (OpenAlex) carried a notice asking the agent to obtain an API key by submitting an e-mail address. Ignored; nothing was submitted.

**Not found at all:**
- Any experiment or CFD giving inflow rate or time-to-flood against Froude number for a side breach on a moving ship.
- Any flooding code documented as adding Cp · (1/2) rho U^2, or a ram head, to the opening head for forward speed. Valanto (2023) adds the opening's horizontal velocity and acceleration for drift and sway, not forward speed.
- Any subsonic test of a slot aligned with the flow under grazing flow. T1.6 rests on theory.

**Paywalled or blocked:**
- Noblesse et al. (2008, J. Fluid Mech.), full text with the X_b relation.
- Hussain et al. (2010, 2011, 2014, 2016) and Lee (2015): ScienceDirect refused automated access or showed a CAPTCHA; Lee 2015 is open access but could not be reached.
- Gritsch et al., Hay et al., Hay and Lampard, Huening, McGreehan and Schotsch (ASME).
- Longo and Stern (2002) and Kume et al. (2006) full texts (Springer), with the actual Cp numbers.
- Domeh et al. (2015): the Southampton repository refused access.
- Clarke, Gedling and Hine (1983, RINA).

**Exists only as a PDF or print, so not checked:**
- Fischer et al. (1979) and Rawn, Bowerman and Brooks (1960/61): the source of the T1.3 port coefficients. This is the single most useful check to make next.
- Rogers and Hersh, NASA CR-2681 (archive.org text not located).
- ITTC 7.5-02-07-04.4 and the ITTC Stability in Waves committee reports.
- FLOODSTAND and FLARE deliverables.
- Minsaas, Faltinsen and Persson (1983); Smogeli (2006); Koushan; Faltinsen's Sea Loads.
- Tuck (1966); Tuck and Taylor (1970); Gourlay's sinkage papers; the Tokyo 2015 KCS sinkage and trim spreadsheet.
- The Nantes Journees de l'Hydrodynamique papers by Noblesse et al.

**Not checked for time:**
- Acanfora and De Luca 2016/2017 as named in the brief. I found only their 2019 zero-speed paper.
- Gao and Vassalos VOF papers; Bu and Gu; Lee et al. on damaged-ship manoeuvring; Jasionowski (2001).
- Papanikolaou and Spanos lumped-mass papers.
- Hess and Smith (1964), Michell (1898), Dawson (1977), Eggert (1935/1939), Laute (1933).
- Ojha and Subbaiah (1997); Gill (1987); Guo and Stitt (2017); Ramamurthy, Tim and Rao (1987).
- Acoustic-liner bias-plus-grazing-flow impedance papers.
