# Down-flooding through a stairwell, and when glazing and joiner work give way under a head of water (the physics, v1)

- **Written:** 2026-11-19, 13:11 to 14:01 CST, by a research subagent (Claude Code desktop, Opus 5.5) for lane S of `docs/PLAN_topsides_mesh_and_grand_staircases_v1_2026-11-19.md` (the grand staircases and their domes in the flooding model). This is the physics half; `RESEARCH_grand_staircases_domes_record_v1_2026-11-19.md` is the record half (geometry, witnesses), written by another agent at the same time. No geometry of Titanic's domes, windows or doors is assumed here beyond placeholders: put the record half's sizes into the formulas of section 10.
- **Method:** web search (about 30 searches) and WebFetch (about 55 fetches, HTML only after the first few PDFs failed); archive.org's full-text search found the period glass tests. Two scratch scripts, run with Node: `C:\temp\titanic-stairs-scratch\hydraulics\plate_vk.js` (small- and large-deflection plate, validated against Roark) and `well_flow.js` (the flow law, the worked example, the air limits), with their outputs beside them. The flow laws of `core/core.js` were read at main `a97a6bd` (lines 258-300, 368-428, 608-679). Nothing in the repository was changed except this note.
- **Refused or unreadable:** ScienceDirect (403: Jalonen et al. 2017; Ruponen et al. 2017; Wells et al. 2019 full text); ResearchGate (403); MDPI (403: the 2024 flooding-methods review, J. Mar. Sci. Eng. 12(2):251; the Estonia re-study, 14(5):503); Taylor & Francis (403: Ruponen et al. 2019); Aalto's repository (403: Ruponen's thesis PDF, Peltola's thesis); floodstand.aalto.fi (TLS certificate mismatch; the Wayback Machine is closed to the tool), so FLOODSTAND's deliverables D2.1a/b, D2.2a/b, D2.6 were not read; FLARE D4.1 (404); DOAJ, CORE (403); ADS (405); HathiTrust (403); the Illinois brittle-books text server (connection refused); the Dutch government's copy of MSC.362(92) (403); Saint-Gobain's "strength of glass" page and Engineering Toolbox (404); the Princeton glossary (403); Semantic Scholar's API (429). PDFs: the fetch tool could not decode compressed PDFs (CORDIS's FLOODSTAND final report, an INL flooding-fragility report, NRC Canada's window-glass paper, a JMSE paper from iris.unina.it), and it saved their bytes automatically in this session's tool-results folder under the Claude projects directory; I did not open those files, and stopped fetching PDFs. What each would have given is said where it is cited.
- **Tags:** [read] = in a page I opened, with the verbatim words or the table asked for; [read in X] = in a page that quotes the original X; [search summary] = only in a search-result digest; [derived] = my arithmetic, shown (scratch scripts in `C:\temp\titanic-stairs-scratch\hydraulics\`, inputs and outputs given); [memory] = a figure I know but could not find again in this session; [bet] = my judgement, with a range; NOT FOUND.
- **Tool caveat:** WebFetch passes each page through a small model. For the figures that matter I asked for the verbatim words or the table; punctuation and layout may be normalised.
- **Quotes:** at most one short phrase per source, under 15 words; everything else is paraphrase.
- **Conventions:** SI. g = 9.81 m/s2; sea water rho = 1,025 kg/m3, so 1 m of sea water = 10.06 kPa and 1 kPa = 0.0995 m; 1 m3/s of sea water = 61.5 t/min. h = depth of water standing over an opening's sill or rim (m); H = energy head (m); A = open area (m2); P = wetted perimeter of a rim (m); D = diameter or short side (m); Q = volume flow (m3/s). "Head of sea water" in failure tables = p / (rho g). The core's laws are quoted from `core/core.js` at main `a97a6bd`.

## 0. Summary

- **Flow law (high confidence in the form, medium in the coefficients).** A horizontal opening is a weir round its rim at small head and an orifice over its area at large head; take the lesser, and let the head below drown both: Q = min( Cw P H1^1.5 (1 - (H2/H1)^1.5)^0.385 , Cd A sqrt(2 g (H1 - H2)) ), Cd 0.60 (0.50 to 0.70), Cw 1.77 m^0.5/s (1.55 to 1.85) (HEC-22 [read], the core's own constants, Villemonte). It is continuous everywhere. The regimes cross at h* = 1.5 A/P (0.375 D for a circle; the literature 0.3 to 0.5 D) [derived]. A large well stays weir-controlled over the heads that matter: a 5 m x 4 m well is a weir up to 1.7 m of head and takes 11 m3/s (690 t/min) at 0.5 m, 32 m3/s (1,960 t/min) at 1 m, 75 m3/s (4,620 t/min) at 2 m, against the collision's 400 t/min (section 10.4).
- **Failure heads (m of sea water; low confidence for (a) and (b), medium for (c) and (d)).** (a) leaded decorative dome **0.2 m** (0.1 to 0.4), derived from lead cames as a tension net: no test exists that I could find; (b) plate or wired-glass skylight in iron bars **0.5 m** (0.2 to 1.2), the bars and fixings governing over the glass; (b') any pane resting on its rebate, loaded from inside, **0.05 m** (0.02 to 0.2); (c) deckhouse windows of 1911 **1.5 m** (0.5 to 3.5), from plate theory with period glass strength; (d) wooden doors **1.0 m** of water at the sill (0.7 to 1.5), which on a 2 m door is only 0.25 m of head at its middle, on US tests of wooden doors (0.71 to 0.99 m [read]) and FLOODSTAND's joiner work [search summary]. Glazing heads are taken at the pane's middle, door heads at the sill (10.2).
- **Glass of 1911 is today's glass** at the surface: Plympton's 1891 plate glass broke at 31 to 46 MPa within minutes and 25 to 31 MPa under held loads; 1923 polished plate at 42 to 48 MPa [read]; modern annealed glass at a mean 41 MPa, 23 MPa at 8 in 1,000 [read]. Membrane action matters for thin large panes; I solved the large-deflection plate (section 2.2) [derived].
- **Air (medium).** Ignore it for the wells and domes if the spaces they feed have other vents of at least 10 % of the well's area (IMO MSC.362(92)'s rule [search summary]; 0.1 m of back-pressure at 50 m3/s through 10 % [derived]); if the well is a space's only vent, cap the flow at about 0.37 m/s over the well's area (7 to 14 m3/s for 20 m2) [derived from memory correlations]. Trapped air is the likeliest thing to open a dome: once the hall fills through its doors, the air above the highest open entry presses the cover's panes off their rebates at a few centimetres of head (section 10.2), so the dome usually goes from below, about when the sea passes the lintels of the entrance doors, close to Bo's `'wet'` rule.
- **What the core's laws miss (section 10.7).** Its deck openings have no weir regime, its top-deck openings no orifice regime, and its doors are point orifices at mid-height that pass nothing until the water reaches it. Its weir constant and Villemonte's factor agree with the literature.
- **Full scale (high for Estonia).** Estonia's broken superstructure windows let in 18,000 t in about 15 minutes, 20 t/s through 5 to 10 m2, and she was gone within minutes [read]. A TU Hamburg simulation found Titanic would have rolled over once her superstructure flooded but for the passageway walls [read]: the core's free upper layer may explain its 80-degree roll at the end.

## 1. Collapse and leakage of non-watertight structure under a head of water

The only full-scale measurements of ship structures under a head of water that the literature cites are FLOODSTAND's (EU FP7, 2009-2012; tests at CTO, Gdansk; non-linear finite elements by MEC, Tallinn). Every paper and deliverable that holds the tables refused the fetch tool (ScienceDirect, ResearchGate, Aalto's server, the FLOODSTAND site, CORDIS's PDF), so the FLOODSTAND rows below are search digests, cross-checked against each other where two digests agree. They are modern steel fire doors and steel-faced mineral-wool joiner panels, not 1911 joinery; the closest analogue to Titanic's wooden doors is a set of US tests on hollow-core wooden doors, which I could read at abstract level.

| Figure | Value | Source (URL) | Short quote | Tag |
|---|---|---|---|---|
| Onset of leakage | every tested door leaked practically from the moment it was immersed | Jalonen, Ruponen, Weryk, Naar, Vaher (2017), "A study on leakage and collapse of non-watertight ship doors under floodwater pressure", Marine Structures 51, 188-201, doi 10.1016/j.marstruc.2016.10.010, https://www.sciencedirect.com/science/article/abs/pii/S0951833916302520 | "leakage started practically immediately when immersed" (as digested) | [search summary] |
| Structures tested | a cold-room wall and door, a B-class cabin wall, an A-60 hinged double-leaf fire door; collapse heads also computed by non-linear FE | same; FLOODSTAND D2.1b (Jakubowski and Bieniek 2010, "Experiments with leaking and collapsing structures") | (paraphrase) | [search summary] |
| Collapse heads, range | 1.0 to 3.5 m of water over the sill; the cold-room door highest | same | (paraphrase) | [search summary]; two independent digests agree |
| A-class fire doors | leak significantly; collapse between 1.0 and 3.5 m depending on type; an A-class sliding door collapsed, unexpectedly, at about 1.0 m; hinged A-class doors at about 2.0 m | papers citing Jalonen et al. (Ruponen et al. 2017, 2019), as digested | (paraphrase) | [search summary] |
| B-class walls and doors | leak "very extensively" at about 1 m of head; the B-class wall's collapse head about 2.5 m in the test, about 2.0 m by FE | same | (paraphrase) | [search summary] |
| Leakage area ratio a = A_leak / A_submerged | grows about linearly with head for some doors; for others it levels off at about 0.03 above about 1 m; one door practically constant at 0.025 | same | (paraphrase) | [search summary] |
| Direction of loading | hinged doors leak less when the water presses the leaf into its frame; FLOODSTAND's simulation guidance nevertheless takes one collapse head for both directions | FLOODSTAND report as digested | (paraphrase) | [search summary] |
| Test caveat | the doors discharged freely into air; a counter-head on the far side was not tested | same | (paraphrase) | [search summary] |
| What simulations use | three inputs per door: leakage head HLEAK, leakage area ratio ARATIO, collapse head HCOLL (defaults zero; replace per door type); A_leak applies only while the door stands; collapse opens it fully | FLARE D4.1, "Modelling of flooding process" (2019-2022), https://flare-project.eu/images/Modelling_of_flooding_process.pdf (now 404); FLOODSTAND report as digested | (paraphrase) | [search summary] |
| Sensitivity | the collapse head had the most visible effect on how the flooding proceeds; later studies draw collapse heads at random inside the measured range | FLOODSTAND report; Ruponen, Lindroth, Routi, Aartovaara (2017), "On the effects of non-watertight doors on progressive flooding in a damaged passenger ship", Ocean Engineering 130, 115-125 (figure "random collapsing pressures") | (paraphrase) | [search summary] |
| Hollow-core wooden doors (US, 2019) | six tests in a rising-water tank: failure at 0.71 to 0.99 m of water; an industrial steel door, inward-swinging, failed at up to about 2.05 m | Wells, Ryan, Savage, Tahhan, Suresh, Muchmore, Smith, Pope (2019), "Non-watertight door performance experiments and analysis under flooding scenarios", Results in Engineering 3, 100031, doi 10.1016/j.rineng.2019.100031 (abstract read through the OpenAlex record, https://api.openalex.org/works/doi:10.1016/j.rineng.2019.100031) | "the lowest failure water depth was 0.71 m (28 in.)" | [read] (abstract) |
| Same tests: direction and mode | inward- and outward-orientation doors failed at about the same depth; water pressing the door into its frame cut the leakage before failure; one failure at the latch engagement | INL/EXT-17-43439 (FY-2017 report), https://lwrs.inl.gov/content/uploads/11/2024/03/Nuclear_Power_Plant_Mechanical_Component_Flooding_Fragility_Experiments_FY-2017_Report.pdf (PDF unreadable), as digested | (paraphrase) | [search summary] |
| Ship windows, modern standards | ISO 3254 (toughened panes for rectangular windows): allowable head H = 4000 t^2 / (beta b^2) (H m, t and b mm); design heads by the IACS UR S3 deckhouse formula h = a (b f - y) c, at least 8.2 + L/100 ft on unprotected lowest-tier fronts; no trend of failures of windows built to the standards | Ingram, Greenwald, Hagy (ABS for the US Coast Guard, 1988), "Investigation of the Validity of Existing Standards Concerning the Use of Glass Windows on Ships", CG-D-06-89 (DTIC ADA210249), full text at https://archive.org/stream/DTIC_ADA210249/DTIC_ADA210249_djvu.txt, pp. 27-28, 38 | (paraphrase; the OCR garbles the fraction) | [read] |
| Same, what it implies | the ISO 3254 constant is an allowable stress of 4000 x rho g = 40 MPa in toughened glass | sigma = beta p b^2 / t^2 with p = 10.06 H kPa gives 40.2 MPa for any pane | - | [derived] |
| Ship windows, class rule | toughened glass at least 6 mm or t = 0.005 b sqrt(beta p) (t, b mm; p kN/m2), beta = -0.17 + 0.54 A_R - 0.078 A_R^2 for A_R <= 3, 0.75 above (a fit to Roark's simply supported coefficient); structural test at 4 p | Lloyd's Register, Rules for Special Service Craft (July 2022), Pt 3 Ch 4 Sec 7, https://www.imorules.com/SSC_PT3_CH4_7.html (formula an image; the forum copy of it at https://www.boatdesign.net/threads/how-thick-for-window-glass.1907/) | (paraphrase) | [read] for the rule's text and beta (sign lost in extraction); [search summary] for the 0.005 |
| Same, what it implies | allowable stress 1 / 0.005^2 = 40,000 kN/m2 = 40 MPa again; a window that must stand the 4 p test breaks at four or more times its design head | - | - | [derived] |
| Estonia, 1994: fire doors | on deck 2, water entered the staircases through the slots around the fire doors | Joint Accident Investigation Commission (JAIC), Final Report on the capsizing of MV Estonia (1997), section 13.2.6, HTML at https://www.multi.fi/estonia/estorap.html | "water entered the staircases through the slots around the fire doors" | [read] |
| Estonia: windows | large windows of decks 4 and 5, "of heavy construction", broke under wave impact once the list reached about 40 degrees; the JAIC judged that no reasonable strength of window would have sufficed | same, 13.6 | "When some of the large windows on decks 4 and 5 broke" | [read] |
| SOLAS explanatory notes (MSC.429(98)) on windows and joiner work in time-domain simulation | NOT FOUND (not opened) | - | - | NOT FOUND |

What this section gives the model: (1) closed non-watertight doors leak from the start, with a leak area of a few per cent of their submerged area; (2) modern steel fire doors and B-class joiner walls give way at 1 to 3.5 m of water, typically about 2 m; (3) light wooden doors give way at 0.7 to 1.0 m of water standing at their sill, whichever way they open; (4) modern ship windows are designed to an allowable 40 MPa in toughened glass, with design heads of about 2 m on upper tiers to about 5 m on an unprotected lowest-tier front at Titanic's length (8.2 + 852/100 = 16.7 ft = 5.1 m [derived]), and they break at four or more times that: far stronger than anything fitted in 1911 (section 2).

## 2. Strength of the glass, as fitted about 1911

### 2.1 What glass breaks at

Glass breaks at its surface flaws, so its strength is a property of the surface and the edges, not of the composition: polished plate of 1891 and float glass of today test alike (rows below). Strength falls with the time a load is held (stress corrosion), with the area under stress, and with weathering.

| Figure | Value | SI | Source (URL) | Short quote | Tag |
|---|---|---|---|---|---|
| Annealed glass, mean modulus of rupture, short load (under a minute), new, four-side support | about 6,000 psi; design value 2,800 psi for 8 breakages in 1,000 | 41 MPa; 19 MPa | Glass Association of North America (GANA), FM05-12 (2023), "Physical and mechanical properties of typical soda lime float glass", https://www.glass.org/sites/default/files/2023-07/FM05-12_2023_Physical_Mechanical_Properties_Typical_Soda_Lime_Float_Glass.pdf | (paraphrase) | [search summary] (PDF) |
| Annealed glass, 3 s uniform load, 8 in 1,000 | about 3,380 psi at the surface; about 2,400 psi at the edge | 23.3 MPa; 16.5 MPa | "Thermal Stress, Part Two", Architects' Guide to Glass and Metal, 4 Aug 2009, https://glassguides.com/2009/08/thermal-stress-part-two/ | "a stress of approximately 3,380 psi will yield a probability" | [read] |
| Same, heat-strengthened and tempered | about 6,750 and 13,500 psi | 46.5; 93 MPa | same | (paraphrase) | [read] |
| Characteristic strength (5 % fractile), European | float glass 45 MPa; patterned and drawn 24 to 25 MPa | 45; 24-25 MPa | EN 572-1, as given in a Saint-Gobain table and a Guardian excerpt (search digests) | (paraphrase) | [search summary] |
| Scatter | a Weibull fit to 107 tests of new window glass at the Ontario Research Foundation: modulus m = 7, characteristic strength 40 MPa | m = 7; 40 MPa | Dalgliesh and Taylor, "The strength and testing of window glass", NRC Canada, https://nrc-publications.canada.ca/eng/view/ft/?id=30b79413-1738-4253-b4e2-b5ac235ad70b (PDF unreadable) | (paraphrase) | [search summary] |
| Weathered glass | up to 50 % weaker than new; strength also falls as the pane's area grows | - | Texas Tech work, in Ingram et al. 1988 (DTIC ADA210249), pp. 16-17, 24 | (paraphrase) | [read] |
| Working stresses, annealed | 1,000 psi long-term, 2,000 psi short-term (recommended limits) | 6.9; 13.8 MPa | Ingram et al. 1988, p. 39 | (paraphrase) | [read] |
| Period test 1: polished plate glass from Holland, strips 2 in wide, 0.29 to 0.345 in thick, 18 in span, centre load | coefficient C = W L / (b d^2) of 3,000 to 4,450 lb/in2 when broken within minutes; 2,412 to 3,000 when the load was held 1 min to 4 h 20 min; a strip held 52 h at over half its breaking load recovered fully | modulus of rupture R = 1.5 C (centre load): 4,500 to 6,680 psi (31 to 46 MPa) quick; 3,600 to 4,500 psi (25 to 31 MPa) held; mean of the six quick tests 5,610 psi (38.7 MPa), of the three held 4,020 psi (27.7 MPa) | G. W. Plympton, "Some Experiments on the Transverse Breaking Strain of Plate Glass", Trans. ASCE 25 (1891), pp. 223-227, with discussion by J. C. Trautwine Jr.; https://archive.org/stream/transactionsofam25amer/transactionsofam25amer_djvu.txt | "The specimens tried came from Holland." | [read] (OCR garbled; the constant C checked against exp. 1: 46 lb x 18 / (2 x 0.315^2) = 4,173, printed 4,176) + [derived] (R = 1.5 C) |
| Period test 2: Millville rough flooring glass, 1868 | C = 2,040, load held nearly a minute | R about 3,060 psi (21 MPa) | J. C. Trautwine Sr.'s notebook, in Trautwine Jr.'s discussion of Plympton, same pages | (paraphrase) | [read] + [derived] |
| Period test 3 (US, about 1923): moduli of rupture of building glasses, diamond-cut edges | polished plate 6,027-6,997 psi; plain rough rolled 5,500-8,625; ribbed rolled 4,671-5,714; plain rough wire glass 5,640-7,900; ribbed rolled wire glass 5,220-7,320; polished wire glass 5,569-7,470; clear sheet (window) glass 6,111-12,775; thin glass stronger per unit thickness than thick | polished plate 41.6-48.2 MPa; wired 38-54 MPa; ribbed 32-39 MPa | "Modulus of rupture and elasticity of non-scatterable glass" (author's name illegible in the OCR; a running head reads "Williams"), Journal of the American Ceramic Society 6 (1923), Table II, archive.org item journalofameri06amer1918, page 1062 of the scan, https://archive.org/details/journalofameri06amer1918 | "Stress strain relations indicate a truly elastic body" | [read] |
| Wired glass, modern view | about half as strong as annealed glass (a vendor of the alternative); a four-point bending study found it "considerably weaker" than unwired glass | - | SAFTI, https://safti.com/articles/shattering-myth-wired-glass/; a bending-test abstract, as digested | (paraphrase) | [search summary] |
| Plate glass, period practice | Kawneer (1913), from its own experiments, "safe wind pressure" on polished plate squares: 36 in 192 lb/ft2; 48 in 144; 60 in 90; 72 in 54; 96 in 26; thickness not tied to the rows (polished plate listed from 3/16 in) | 9.2, 6.9, 4.3, 2.6, 1.2 kPa (0.92, 0.69, 0.43, 0.26, 0.12 m of sea water) | Kawneer Manufacturing Co., "Kawneer store fronts" (1913), https://archive.org/stream/KawneerManufacturingCoKawneerstorefronts19130001/KawneerManufacturingCoKawneerstorefronts19130001_djvu.txt | "shows the relative strength of plate glass when subjected to wind" | [read] |
| Window systems under fluctuating wind (modern, full scale) | the governing failure was the glass pulling through its frame, at a mean 4.218 kPa (coefficient of variation 0.23), not the glass breaking | 0.43 m of sea water | "Glass breakage tests under fluctuating wind loads", https://www.researchgate.net/publication/245492012_Glass_Breakage_Tests_under_Fluctuating_Wind_Loads, and a Western University thesis, "Behaviour of glass plates under wind loads" | "the governing mode of failure for the window system was the pull-through failure" (as digested) | [search summary]: the frame and the glazing's retention, not the glass, can govern |
| Lead (cames) | tensile strength 12 to 17 MPa; yield about 11 MPa, ultimate 14 MPa, elongation at fracture about 0.5, E 14 GPa (Callister); creeps at room temperature at low stress | - | materials text and the Princeton MAE 324 glossary citing Callister, as digested | (paraphrase) | [search summary] |
| Wrought iron | elastic limit about 25,000 psi, ultimate 48,000 to 50,000 psi | about 170; 330-345 MPa | - | - | [memory] (period handbooks such as Kent's carry these; not re-found in this session) |

Load duration: a dome or skylight is loaded as the sea climbs over it in seconds to minutes, so the short-load values apply. The 3 s, 8-in-1,000 value (23.3 MPa) is a low-end strength, the 41 MPa mean a central one; Plympton's held-load tests (25 to 31 MPa) say that a pane loaded over a minute or two sits between them; weathering hardly applies to glass fitted in 1911-12 and only days at sea, but putty-bedded panes with cut edges are not the polished surfaces of the tests. I take **34 MPa** as the central strength of Titanic's annealed plate under a load held for tens of seconds, with a range of 20 to 45 MPa [bet, on the rows above].

### 2.2 The plate formula

A pane bedded in putty or a rebate, or held in a came, is simply supported on four sides: it can rotate at its edges and slide inward a little. Small-deflection theory (Roark, 7th edition; Timoshenko), uniform pressure q, short side b, long side a, thickness t:

- maximum stress, at the centre: sigma_max = beta q b^2 / t^2
- maximum deflection: y_max = alpha q b^4 / (E t^3)
- so the failure pressure is p_fail = sigma_f t^2 / (beta b^2), and the head of sea water H_fail = p_fail / (1025 x 9.81).

| a/b | 1.0 | 1.2 | 1.4 | 1.6 | 1.8 | 2.0 | 3.0 | 4.0 | 5.0 | infinite |
|---|---|---|---|---|---|---|---|---|---|---|
| beta (simply supported, nu 0.3) | 0.2874 | 0.3762 | 0.4530 | 0.5172 | 0.5688 | 0.6102 | 0.7134 | 0.7410 | 0.7476 | 0.7500 |
| alpha | 0.0444 | 0.0616 | 0.0770 | 0.0906 | 0.1017 | 0.1110 | 0.1335 | 0.1400 | 0.1417 | 0.1421 |

Source: Roark's Formulas for Stress and Strain, 7th ed., all edges simply supported, uniform load, as tabulated at https://engineersedge.com/calculators/flat_rectangular_plate_with_all_edges_simply_supported_15090.htm [read]. All edges clamped (a pane gripped hard in a frame), stress at the middle of the long edge: beta1 = 0.3078, 0.3834, 0.4356, 0.4680, 0.4872, 0.4974 for a/b = 1.0 to 2.0, and 0.5000 for infinite [memory: Roark's table, not re-found]; clamping moves the peak stress to the edges and changes it by under 20 % (7 % higher at a/b = 1, 18 % lower at 2), and putty does not clamp, so simple support is the case to use.

Thin panes deflect more than their thickness before they break, and then carry part of the load as a membrane, so small-deflection theory understates their strength. I solved the large-deflection (von Karman) plate by finite differences for a pane simply supported with its edges free to slide (glass in a rebate), nu = 0.22, E = 70 GPa: `C:\temp\titanic-stairs-scratch\hydraulics\plate_vk.js`, output in `plate_vk_out.txt` (16 intervals on the short side; at small load it gives beta = 0.2865 and alpha = 0.0443 at a/b = 1 and 0.6092, 0.1108 at a/b = 2, against Roark's 0.2874, 0.0444, 0.6102, 0.1110) [derived]. The response depends only on a/b and the load parameter Q* = q b^4 / (E t^4); membrane action starts to matter at about Q* = 10 (deflection half the thickness) and halves the effective beta by Q* of about 150; above Q* of about 100 the peak tensile stress moves from the centre to the corners [derived].

**Failure heads of single panes** (m of sea water; large-deflection result, with the small-deflection value in brackets where they differ by more than 10 %) [derived]:

| t (mm) | b (m) | a/b = 1, 41 MPa | a/b = 1, 23.3 MPa | a/b = 2, 41 MPa | a/b = 2, 23.3 MPa |
|---|---|---|---|---|---|
| 3 | 0.25 | 2.21 | 1.22 | 1.01 | 0.56 |
| 3 | 0.40 | 1.17 (0.85) | 0.53 | 0.49 (0.38) | 0.24 |
| 3 | 0.60 | 0.73 (0.38) | 0.33 (0.22) | 0.40 (0.17) | 0.14 (0.10) |
| 3 | 0.90 | 0.37 (0.17) | 0.19 (0.10) | 0.21 (0.08) | 0.11 (0.04) |
| 5 | 0.25 | 5.93 | 3.39 | 2.72 | 1.54 |
| 5 | 0.40 | 2.38 | 1.32 | 1.10 | 0.61 |
| 5 | 0.60 | 1.31 (1.05) | 0.62 | 0.56 (0.47) | 0.28 |
| 5 | 0.90 | 0.86 (0.47) | 0.37 (0.27) | 0.41 (0.21) | 0.16 (0.12) |
| 6.35 | 0.25 | 9.60 | 5.49 | 4.38 | 2.49 |
| 6.35 | 0.40 | 3.74 | 2.12 | 1.73 | 0.97 |
| 6.35 | 0.60 | 1.79 | 0.95 | 0.81 | 0.44 |
| 6.35 | 0.90 | 1.10 (0.76) | 0.48 (0.43) | 0.46 (0.34) | 0.21 |
| 9.5 | 0.25 | 21.7 | 12.4 | 9.79 | 5.57 |
| 9.5 | 0.40 | 8.38 | 4.79 | 3.83 | 2.17 |
| 9.5 | 0.60 | 3.72 | 2.11 | 1.72 | 0.97 |
| 9.5 | 0.90 | 1.78 | 0.95 | 0.81 | 0.44 |

Cross-check with the period record [derived]: by the same solver, 1/4-in plate (6.35 mm) breaks at a mean of about 11 kPa as a 36-in square and about 7.8 kPa as a 48-in square; Kawneer's 1913 "safe" pressures for those squares, 9.2 and 6.9 kPa, are 0.8 to 0.9 of that. So either Kawneer's rows assumed thicker plate or "safe" meant little margin; either way the formula and the period's practice agree within a factor of about 1.5.

Scatter on one pane [derived from m = 7]: the stress at 5 % and 95 % probability of breakage is 0.69 and 1.23 times the median; in head, the same for thick panes and about 0.6 to 1.4 for thin panes deep in the membrane range (where p grows roughly as sigma^1.5).

### 2.3 Leaded lights

I found no load test of a leaded panel, in English or German, and no failure pressure from the church-window wind literature (NOT FOUND, section 9); conservation guidance only says that panels bulge under wind and must be tied to saddle bars at intervals. So the leaded case is derived from the materials [derived, inputs bet]:

- A leaded light is a net of glass pieces (side s, 0.05 to 0.15 m) joined by H-section lead cames (leaves about 6 mm by 1 mm on each face, heart about 1 mm). Its bending strength is negligible: one came's leaf in tension (6 x 1 mm2 x 14 MPa = 84 N) on a lever arm of about 4.5 mm is 0.38 N m, so about 4 N m per metre at s = 0.1 m, and a 0.5 m span between saddle bars carries q = 8 M / L^2 = 120 Pa in bending.
- Under more load the panel bulges and works as a net in tension: per metre, about 1/s cames each carrying about 15 mm2 x 14 MPa = 210 N, so T = 2.1 kN/m at s = 0.1 m. A net cannot stretch much: its glass pieces are rigid, so it lengthens only by tearing and drawing the lead at the joints, say 0.5 to 1 mm a joint over L/s joints. At L = 0.5 m that is about 3.75 mm, allowing a sag delta = sqrt(3 L dL / 8) = 27 mm, and the net then carries q = 8 T delta / L^2 = 1.8 kPa one-way, perhaps twice that two-way.
- So a flat leaded panel between saddle bars about 0.5 m apart gives way at **about 1 to 4 kPa: 0.1 to 0.4 m of sea water, central 0.2 m**. The mechanism is ductile: it bulges, the cement and putty crack and leak first, then pieces drop out and the net tears. A domed leaded light loaded on its convex face works partly in compression and can be stronger until it snaps through; loaded on its concave face (from inside the dome) it is the flat case [bet].
- A check on the order of magnitude: wind design pressures for windows are about 0.5 to 1.5 kPa, and leaded panels are known to bulge under them over the years; a panel that survives 1 kPa repeatedly but slowly creeps is plausibly torn by a few kPa held for a minute [bet].

### 2.4 Iron glazing bars and frames

A skylight or a dome's frame fails before its glass when its bars are long. One worked case [derived, inputs bet]: a wrought-iron tee 38 x 38 x 6 mm (section modulus about 2,080 mm3 to the web's tip), elastic limit about 175 MPa (25,000 psi), gives a yield moment of about 365 N m; with panes 0.45 m wide on each bar, a bar spanning 1.8 m yields at q = 8 M / (s L^2) = 2.0 kPa (0.2 m of sea water) and collapses plastically at about 3.4 kPa (a tee's shape factor about 1.7); spanning 1.0 m it yields at 6.5 kPa (0.65 m). The glass of such a skylight (6.35 mm, long panes 0.45 m wide, a/b about 2) is good for about 0.8 to 1.4 m between the 23 and 41 MPa columns (table above), so in a skylight with long bars the bars, the fixings of the frame to its coaming and the putty govern, at **0.2 to 1 m** of sea water. A frame is the weakest where it was meant only to keep the rain out: hold-down bolts and the coaming-to-frame joint were sized for wind and self-weight.

### 2.5 Dynamic loads: water running or falling onto glazing

[derived] A stream of speed v stopping on a surface gives the stagnation head v^2 / 2g: 0.46 m at 3 m/s, 1.27 m at 5 m/s, 3.26 m at 8 m/s. Green-water and slamming impacts peak higher, at about rho v^2 (twice the stagnation head: 0.92, 2.55, 6.52 m), for milliseconds [bet: an impact coefficient of 2; the green-water literature gives 1 to several]. Water running aft along a deck as the bow goes down moves at about the shallow-water speed sqrt(g h): 3.1 m/s at 1 m deep, 4.4 m/s at 2 m [derived], so a forward-facing window or a deckhouse door met by it sees 0.5 to 2 m of effective head before the still water reaches it. Glass under a load held for milliseconds is about 1.5 times as strong as under a 3 s load (strength going as t^(-1/16), the stress-corrosion exponent of 16 used in the European and ASTM glass models: 1000^(1/16) = 1.54 [memory for the exponent; derived]), so an impact of that size breaks thin and large panes, not thick small ones.

## 3. Flow down through a horizontal opening

A horizontal opening with water standing h over its rim and air below has two controls. At small h the water falls over the rim as a nappe, critical depth forms at the edge, and the flow goes as the perimeter: a weir. At larger h the nappes from opposite sides meet, the whole area runs full, and the flow goes as the area: an orifice. Once the space below is full and pressed up above the rim, the opening is drowned and only the difference of heads drives it.

| Figure | Value | Source (URL) | Short quote | Tag |
|---|---|---|---|---|
| Weir control, horizontal inlet | Q_w = C_w P h^1.5, P = perimeter of the clear opening; C_w = 1.66 (SI; 3.0 English) | Texas DOT Hydraulic Design Manual, ch. 10, "Design procedure for grate inlets in sag configurations" (after FHWA HEC-22), https://www.txdot.gov/manuals/des/hyd/chapter-10--storm-drains/section-6--gutter-and-inlet-equations/design-procedure-for-grate-inlets-in-sag-configura.html | (equations are images; coefficients in text) | [read] |
| Orifice control | Q_o = C_o A sqrt(2 g h), A = clear area; C_o = 0.67 | same | (paraphrase) | [read] |
| Which governs | compute both and take the lower | same; Bentley StormCAD help: "the minimum flow calculated from weir and orifice conditions" | (paraphrase) | [read] (TxDOT); [search summary] (Bentley) |
| Crossing head | h* = C_o A sqrt(2g) / (C_w P) = 1.79 A / P with HEC-22's constants; for a circle (A/P = D/4) h* = 0.45 D; with C_d = 0.6 and C_w = (2/3)(0.6) sqrt(2g) = 1.77, h* = 1.5 A / P = 0.375 D | - | - | [derived] |
| Rahm (1953), vertical drain pipes | transition from weir to orifice control at h/D = 0.3 | Padulano and Del Giudice (2018), "Vertical drain and overflow pipes: literature review and new experimental data", J. Irrig. Drain. Eng., doi 10.1061/(ASCE)IR.1943-4774.0001311 | (paraphrase) | [search summary] |
| Vented drop shaft with a sharp-edged intake | weir flow at low head; a transitional regime (head oscillating between weir and full flow) for h between about 1 and 2 D; full pipe flow above about 2 D | Padulano et al., "Transitional and weir flow in a vented drop shaft with a sharp-edged intake" (CORE record refused) | (paraphrase) | [search summary]: this is pipe control by a long shaft, not an opening into a room |
| Vertical shaft spillway study | weir flow for H/D < 0.5, orifice flow above (one digest states the reverse) | "Flow characteristics in vertical shaft spillway with varied inlet shapes and submergence states" (academia.edu, ResearchGate) | (paraphrase) | [search summary]; conflicting digests |
| Barrier grates | weir up to about 0.4 ft (0.12 m), then a gradual transition | Iowa DOT Design Manual 4A-8 | (paraphrase) | [search summary] |
| Morning-glory crests | the crest coefficient falls as H/R_s grows and the crest drowns at about H/R_s 0.45 to 1 (h/D about 0.22 to 0.5); a design H/R_s of 0.3 is recommended | USBR, Design of Small Dams (1987); Harza chapter on spillways (Scribd copy), as digested | (paraphrase) | [memory] for 0.45 to 1; [search summary] for 0.3 |
| Broad-crested weir | Q = C_d 1.705 b H^1.5 (H energy head; 1.705 = (2/3)^1.5 sqrt(g)); C_d corrects for friction, curvature, velocity profile | USBR Water Measurement Manual, ch. 2 sec. 13, https://www.usbr.gov/tsc/techreferences/mands/wmm/chap02_13.html ("a coefficient of Cd must be added"); Manchester OCF lab notes | (paraphrase) | [read] (USBR, form); [search summary] (1.705) |
| Sharp-crested weir | Q = (2/3) C_d b sqrt(2g) h^1.5, C_d about 0.61 + 0.08 h/p (Rehbock), so C_w about 1.80 to 1.85 | - | - | [memory] |
| The core's weir | q = 0.60 x w x (2/3) sqrt(2g) H1^1.5 x Villemonte: C_w = 1.77 | `core/core.js:266, 643-648` | - | [read] |
| Villemonte, drowned weir | Q / Q_free = (1 - (H2/H1)^n)^0.385, n = 1.5 for a rectangular weir; as in the core | Villemonte, J. R. (1947), "Submerged-weir discharge studies", Engineering News-Record 139, 866-869; `core/core.js:647` | - | [memory] for the paper; [read] for the core |
| Honma's overflow formula (Japanese inundation practice, used for street water going down into underground spaces) | complete overflow q = 0.35 h sqrt(2 g h) (C_w = 1.55); drowned q = 0.91 h2 sqrt(2 g (h1 - h2)) | - | - | [memory]; not found again (search digests named the formula's use, not its constants) |
| Ship flooding codes | Bernoulli's equation through every opening with a discharge coefficient; FLOODSTAND measured coefficients "for various typical openings" | Ruponen (2007), "Progressive flooding of a damaged passenger ship", TKK Dissertations 94, abstract at https://research.aalto.fi/en/publications/progressive-flooding-of-a-damaged-passenger-ship; CORDIS final report summary, https://cordis.europa.eu/project/id/218532/reporting | "Experimental discharge coefficients that take into account the pressure losses" (CORDIS) | [read] (abstracts); the coefficients themselves NOT FOUND |
| Default C_d in practice | 0.6 for a sharp-edged opening of unknown detail; 0.6 to 0.8 for doors and hatches with frames | - | - | [memory] |
| Stair flights and balustrades in a well | no measured C_d found | - | - | NOT FOUND |

What it means for a stair well [derived]: because h* scales with A/P, a large well stays in the weir regime over the heads that matter. A 5 m x 4 m well (A/P = 1.11 m) is weir-controlled up to h* = 1.7 to 2.0 m; a 1 m x 1 m hatch only to 0.4 to 0.45 m; the core's E-deck openings (0.14 m2 each, about 0.37 m square) to about 0.15 m. Below h* the orifice law overstates the flow by exactly Q_o/Q_w = h*/h: at h = 0.5 m over the 5 x 4 m well, by a factor of 3.3.

Obstructions [bet]: a stair flight inside the well is a sloping floor, not a lid: water falling onto it runs down it, so it hardly reduces the clear area for the orifice regime; it does reduce the effective rim (water reaching the rim at a flight's head goes down the flight as a chute, which carries it as well as a free fall does, so leave the rim whole). Balustrades and newels block a few per cent. Take A as the clear plan area of the well less solid landings that lie across it, P as its full rim, C_d = 0.6 (0.5 to 0.7).

## 4. Water going down stairs

The measured cases are urban floods running down subway and basement stairs (Japan, Korea): full-size stair models with 0.2 to 0.4 m of water on the street. I found no ship test of water down a stair.

| Figure | Value | Source (URL) | Short quote | Tag |
|---|---|---|---|---|
| Real-size stair and door models | water 0.3 to 0.4 m deep at the top makes escape up the stairs or through a door critical | Baba, Ishigaki, Toda et al. (2011), "Experimental studies on difficulty of evacuation from underground spaces under inundated situations using real scale models", J. JSCE (ADS record refused the fetch); Ishigaki et al. (2005), Annuals DPRI Kyoto Univ. 48B, 639-649 | (paraphrase) | [search summary] |
| Flow on the flight | surface velocities measured at several steps for 0.2, 0.3 and 0.4 m of water flowing into a long straight stair; a Korean re-computation of the 0.3 m case gives about 4.2 m/s at the foot | same; Korean Society of Safety, "Inundation simulation of underground space using critical dry depth scheme" (koreascience) | (paraphrase) | [search summary] |
| Criteria used | 0.3 m depth with v^2 h = 1.2 m3/s2 (Ishigaki et al.); 0.5 m with 1.5 m3/s2 (Inoue et al. 2003); passage impossible when the overflow reaches 0.5 m | as digested; JSCE hydraulic model test of the Kyoto Oike underground space | (paraphrase) | [search summary] |
| How the inflow is computed | by overflow (weir) formulas at the top of the stair, which ignore the flow's momentum; a 3-D RANS study fits a Manning roughness for the flight | J. JSCE B1 (2025?) article, https://www.jstage.jst.go.jp/article/jscejj/81/16/81_24-16048/_article/-char/en | (paraphrase) | [search summary] |
| Straight-stair experiments (Hakata station) | an empirical formula for the discharge into the stair; a step up at the entrance cuts the inflow | Tada, Inoue, Honda, Furumoto (2001), "Experimental study on the evaluation on discharge of inundating water flowed over straight stair to underground space", Proc. Hydraulic Eng. 45, 901-906, https://www.jstage.jst.go.jp/article/prohe1990/45/0/45_0_901/_article | "has an effect on the mitigation of inundation flow" | [read] (abstract; the formula is not in it) |
| Kyoto city flood model | simulations were poor where water entered underground spaces, because a drop-flow equation was used and the entrances were not represented | Proc. Hydraulic Eng. 48 (2004), https://www.jstage.jst.go.jp/article/prohe1990/48/0/48_0_571/_article | (paraphrase) | [search summary] |

[derived] What a stair carries: the inflow is set at the head of the stair, where the water passes critical depth, so per metre of stair width q = C_w h^1.5 with C_w 1.55 to 1.77: q = 0.29 m2/s at h = 0.3 m, 1.77 m2/s at h = 1 m, 5.0 m2/s at h = 2 m. A flight at 30 to 40 degrees is a steep stepped chute; it runs supercritical, at 3 to 5 m/s (the measured 4.2 m/s at 0.3 m), so its depth on the flight is only q / v, 0.1 to 0.4 m: **the flight never chokes**, and neither does the well. A grand staircase's flight about 3 m wide under 1 m of water on its landing carries about 5 m3/s (330 t/min); the open well beside it takes what spills over the landing's edge as a free nappe (the weir of section 3 along that edge).

[bet] For a lumped model the stair's own capacity is therefore never the limit: what limits the flow down is the entry at the top (the dome, the doors at the top landing) and, deck by deck, the rim of the well where water spills from a flooded landing into the well. Because the core lumps E to B deck into one space per zone, the flow down inside that span needs no law of its own; only the entries above B deck, and the existing E-deck openings, do.

## 5. Air

Every cubic metre of water that goes down a well puts a cubic metre of air out of the space below. Two cases: the air leaves by another way (co-current: the well carries only water), or the well is the space's only vent (counter-current: water down and air up through the same hole).

| Figure | Value | Source (URL) | Short quote | Tag |
|---|---|---|---|---|
| Exchange flow through a hole in a horizontal partition (brine above, fresh water below) | four regimes as the partition's thickness over the hole's diameter L/D grows (0.01 to 10 tested); the exchange rate independent of viscosity, so one Froude-number correlation in L/D, with a peak where two regimes compete | Epstein, M. (1988), "Buoyancy-driven exchange flow through small openings in horizontal partitions", J. Heat Transfer 110(4a), 885-893, doi 10.1115/1.3250589; abstract at https://www.osti.gov/biblio/5475252 | "independent of viscosity" | [read] (abstract) |
| Its thin-partition value | Q = 0.055 sqrt(g' D^5), g' = g drho / rho_mean, for L/D below about 0.15 | Epstein (1988) | - | [memory]; a Boussinesq result (small drho), so for water over air it is an order of magnitude, not a law |
| Large-tube counter-current flooding limit | Ku_g^0.5 + Ku_f^0.5 = C^0.5, Ku = j rho^0.5 / (g sigma drho)^0.25, C about 3.2 (Pushkina and Sorokin); valid for D sqrt(g drho / sigma) well over 30, as here (about 1,500 for D = 4 m) | Wallis, One-dimensional two-phase flow (1969); Pushkina and Sorokin (1969) | - | [memory] |
| Air back-pressure in IMO practice | if the total air-pipe area is at least 10 % of the cross-flooding area, the air's back-pressure may be neglected; below that, an equivalent friction coefficient combining the water and air paths is used | IMO Res. MSC.362(92), Revised recommendation on a standard method for evaluating cross-flooding arrangements (2013), sec. 3, https://wwwcdn.imo.org/localresources/en/KnowledgeCentre/IndexofIMOResolutions/MSCResolutions/MSC.362(92).pdf (PDF; read through digests of it and of MSC.245(83)) | (paraphrase) | [search summary] |
| Air in ship flooding codes | flooding can compress air where ventilation is restricted, because the air pipes are relatively small; the method solves the counter-pressure and the air flows | Ruponen (2007), abstract (as above) | "due to the relatively small air pipes" | [read] |
| Same, full scale | in full-scale tests on a decommissioned fast attack craft, air compression in a tank with small air pipes changed the flooding rates significantly | Ruponen, Kurvinen, Saisto, Harras (2010), Trans. RINA 152 A197-A207; (2013) "Air compression in a flooded tank of a damaged ship", Ocean Engineering | (paraphrase) | [search summary] |
| Titanic, at the end | Lightoller, carried under at the forward end of the boat deck, was held against the grating of the forward blower (the stokehold ventilator in front of the first funnel) by "the water rushing down this blower", then blown clear by a rush of air from below | British Inquiry, Day 12, BI 14054-14061, https://www.titanicinquiry.org/BOTInq/BOTInq12Lightoller02.php | "there seemed to be a rush of air from down below" | [read] |
| Same, US Inquiry | the force came through the blower, air with a great force behind it, which he put down to the boilers | US Senate Inquiry, Day 5, https://www.titanicinquiry.org/USInq/AmInq05Lightoller03.php | (paraphrase) | [search summary] |
| A hatch blown off on the wreck | a forum argument that a heavy hatch cover blew off when the bow struck the seabed, and that air trapped under decks was pressurised | Encyclopedia Titanica forum, "The last 10 minutes" | (paraphrase) | [search summary]; forum quality, not evidence |
| Lusitania, Britannic, Empress of Ireland, Andrea Doria: hatches or deckhouses lifted by air | NOT FOUND | - | - | NOT FOUND |

Worked numbers for the placeholder well, 20 m2 (equivalent diameter 5.05 m) [derived; `well_flow.js`, output in `well_flow_out.txt`]:

- Counter-current, if the well were the only vent: Epstein's 0.055 sqrt(g D^5) gives 9.9 m3/s (606 t/min), or 13.9 m3/s with g' = 2g (drho over the mean density); the Kutateladze limit with C = 3.2 gives j = 0.37 m/s each way, 7.4 m3/s (456 t/min). So a sealed space below would cap the well at about **7 to 14 m3/s, 0.35 to 0.7 m/s over its area**, against 32 m3/s for the free weir at 1 m of head and 75 m3/s for the orifice at 2 m: the air would cut the flow by a factor of 3 to 10.
- Co-current, the air leaving by a separate vent of area A_v at the water's flow Q: back-pressure dp = (rho_air / 2) (Q / (0.6 A_v))^2. At Q = 50 m3/s: A_v = 2 m2 (10 % of the well) gives 1.0 kPa (0.10 m of sea water); A_v = 0.5 m2 gives 16.7 kPa (1.7 m), with the air near 170 m/s, where compressibility makes it worse. So MSC.362(92)'s 10 % rule holds here too: at 10 % the air costs about a tenth of a metre of head against heads of 1 to 2 m.

Bursting a skylight from below [derived]: when a stair hall fills through its doors and windows, the air above the highest of them is trapped under the dome and the skylight. Its pressure is the water's at the air-water interface, so the net outward pressure on the skylight is rho g (Z_sea - z_i) while the skylight is still above the sea (z_i the interface, near the lintel of the highest open entry), and rho g (z_top - z_i), the height of the air pocket, once the sea is over it. Loaded from inside, glazing is weaker than from outside: a pane resting on its rebate lifts at little more than its own weight and its putty or clips (0.02 to 0.2 m; 6.35 mm glass weighs 0.16 kPa), a leaded light tears at about 0.2 m, and a whole skylight lifts when the pressure passes its weight per area (0.5 to 1 kPa, 0.05 to 0.1 m [bet]). So a pocket a few centimetres to a few tenths of a metre high is enough, unless the skylight's opening lights or ventilators let the air out first. Because the hall's doors and windows are lower than its roof, the sea reaches them first: if any of them lets water in, this is the likelier way for a staircase's dome and its cover to go, from below, by air, after the hall has filled; the sea pressing on the outside of the cover is the way only if every entry holds [bet on the order of events; the mechanics derived].

## 6. Spreading along a deck from the stair hall

| Figure | Value | Source (URL) | Short quote | Tag |
|---|---|---|---|---|
| Doorway, water below the lintel | a weir over the sill: Q = C_w b h1^1.5, Villemonte when the far side rises above the sill; broad-crested sill C_w = 1.70 C_d, sharp sill 1.77 to 1.85 | as section 3 | - | [read]/[memory] as there |
| Doorway, water over the lintel (height h_d over the sill), far side below the sill | Q = (2/3) C_d b sqrt(2g) [h1^1.5 - (h1 - h_d)^1.5], the orifice law integrated over the door's height; equals the weir at h1 = h_d | - | - | [derived] (standard large-orifice integral) |
| Doorway, both sides over the lintel | Q = C_d b h_d sqrt(2 g (h1 - h2)) | - | - | [derived] |
| Any state, one formula (levels h1 > h2 >= 0 over the sill; h_top = min(h1, h_d)) | strip by strip, free above the far level and drowned below it: Q = C_d b sqrt(2g) { (2/3) [ (h1 - h2)^1.5 - (h1 - h_top)^1.5 ] if h2 < h_top, else 0 } + C_d b sqrt(2g) min(h2, h_d) sqrt(h1 - h2). It gives the weir (h2 = 0, h1 < h_d), the large orifice (h1 > h_d), and the drowned door (h2 > h_d), and it is continuous in h1 and h2 | Ruponen (2007) integrates Bernoulli over the opening's height in the same way | - | [derived]; [memory] for Ruponen's method |
| Closed joiner doors and partitions | leak from the start (a = 0.025 to 0.03 of the submerged area for steel fire doors); modern B-class walls leak very extensively at about 1 m and collapse at 2 to 2.5 m; light wooden doors fail at 0.7 to 1.0 m | section 1 | - | [search summary]; [read] (wooden doors) |
| Titanic's accommodation walls as a brake | a time-domain simulation of Titanic (explicit method) found she might have capsized once the superstructure flooded, had the floodwater not been obstructed by the side walls of the passageways in the accommodation | TU Hamburg, Institute of Ship Safety, "RMS Titanic" (Dankowski 2013, "A fast and explicit method for simulating flooding and sinkage scenarios of ships", Schriftenreihe Schiffbau 668), https://www.tuhh.de/ssi/en/marine-casualty-simulations/rms-titanic | "if the floodwater would have not been obstructed by the side walls of the passage ways" | [read] |

How fast a deck fills from a stair hall [derived]: two doorways 1 m wide with 0.5 m standing at their sills pass 2 x 1.77 x 0.5^1.5 = 1.25 m3/s; into 500 m2 of deck behind them that is a rise of 2.5 mm/s, 0.5 m in about 3.3 minutes. A well whose landing is fed at 30 m3/s (section 10.4) therefore floods its own hall quickly and its decks slowly: most of what comes down the well goes on down it, to the lowest deck that is open, until the water stands in the well itself.

Joiner work of 1911 [bet]: cabin doors were panelled wood on small hinges with a latch, and the partitions wood panelling on light framing. Take them to leak from the start (a = 0.02 to 0.05: undercut doors, panel joints, ventilation grilles) and to give way at 0.5 to 1.5 m of water standing at their sills, central 1.0 m; a door that opens away from the water fails at the latch, one pressed into its stop at the panel or frame, at about the same depth (the US tests). A watertight door is another matter and is already in the core.

## 7. Full-scale checks

| Ship, year | Path that set the end | Times | Flows the investigators computed | Source (URL) | Tag |
|---|---|---|---|---|---|
| Estonia, 1994 | bow visor lost, ramp opened, car deck flooded; at about 40 degrees of list the large windows of decks 4 and 5 broke under wave impact and the accommodation flooded, then the compartments below the car deck from above; on deck 2 water came into the staircases round the fire doors | visor off about 01:15; engines stopped about 01:20; bridge partly flooded at about 80 degrees shortly after 01:30; gone about 01:50; progressive flooding of deck 4 began 5 to 15 minutes after the first inflow through the ramp | ramp inflow 300 to 600 t/min (2 to 3 times more once 1,800 t were aboard); 18,000 t aboard in about 15 minutes after the windows broke: about 20 t/s, "feasible through openings which have a total area of 5-10 m2"; about 2,000 t on the car deck brought the first flooding points (aft windows of deck 4) to the water | JAIC Final Report (1997), 12.6, 13.2.6, 13.6, https://www.multi.fi/estonia/estorap.html | [read] |
| Estonia, later studies | SSPA (2008) took the upper decks' windows to break at a pressure of about 5 m of head; the 2024 HSVA-led re-study replaced the window strength with new data, the 2008 window modelling having been known to be "problematic" | - | - | Research Study on the Sinking Sequence of MV Estonia (SSPA, 2008); "Revisiting the MV Estonia accident using numerical simulations with a statistical approach", J. Mar. Sci. Eng. 14(5):503 (MDPI refused) | [search summary] |
| Titanic, simulated (TU Hamburg) | water over the transverse bulkheads as the trim grew; in the final stage after 2 1/2 h she broke in two; she might have capsized once the superstructure flooded, but for the passageway walls | 2 1/2 h | - | https://www.tuhh.de/ssi/en/marine-casualty-simulations/rms-titanic; Dankowski (2013) | [read] |
| Titanic, witnessed | water rushing down the forward stokehold blower, then air blown out of it, as the bridge went under | about 2:15 | - | BI 14057-14059 (section 5) | [read] |
| Britannic, 1916 | mine forward; open portholes on the lower decks forward (opened by the nurses against orders) went under within minutes; the door between boiler rooms 6 and 5 did not close; under way to beach her, which increased the flooding | 55 minutes (08:12 to 09:07) | - | Wikipedia, "HMHS Britannic", https://en.wikipedia.org/wiki/HMHS_Britannic | [read in Wikipedia]; the core gives 50 min (`README.md`) |
| Lusitania, 1915 | torpedo and a second explosion; 15 degrees of list to starboard; portholes open across the ship | 18 minutes | an expert: a porthole three feet under water lets in four tons a minute | Wikipedia, "Sinking of the RMS Lusitania", https://en.wikipedia.org/wiki/Sinking_of_the_RMS_Lusitania | [read in Wikipedia]; [derived] the orifice law gives 0.6 x A x sqrt(2 g x 0.914) = 2.54 A m3/s: four tons a minute (0.065 m3/s) fits a clear opening of 0.026 m2, a port of about 7 in; an 18-in port would pass about 26 t/min |
| Empress of Ireland, 1914 | collision; open portholes added to the flooding as she listed | 14 minutes (01:56 to 02:10) | "60,000 imperial gallons ... of water per second" (273 m3/s, about 16,800 t/min) | Wikipedia, "RMS Empress of Ireland", https://en.wikipedia.org/wiki/RMS_Empress_of_Ireland | [read in Wikipedia]; the figure's origin unknown |
| Herald of Free Enterprise, 1987 | bow door open; water accumulated on the vehicle deck until her stability vanished | minutes after leaving Zeebrugge | - | https://www.tuhh.de/ssi/en/marine-casualty-simulations | [read] (path); times [memory] |
| Sewol, 2014 | a door into the vehicle deck went under and the vehicle deck flooded | - | - | same | [read] |
| Costa Concordia, 2012 | five compartments open to port; cross-flooding brought her upright; water then reached starboard spaces through open or not fully closed doors and gave the starboard heel she capsized with | - | the investigators' flooding simulation (MIT report 4.7.9) not opened | https://www.tuhh.de/ssi/en/marine-casualty-simulations/costa-concordia | [read] |
| Andrea Doria, 1956 | asymmetric flooding after the collision | about 11 h | - | `HANDOFF.md` 4g | [memory] |

Sanity tests these give [derived]: (1) Estonia's 20 t/s (19.5 m3/s) through 5 to 10 m2 needs 0.54 m (10 m2) to 2.15 m (5 m2) of head on an orifice with C_d 0.6, 0.96 m at 7.5 m2, so a model's broken windows should pass tonnes per second at heads of a metre, not tens of tonnes a minute; (2) once windows or doors at the top of a superstructure go, the end comes in minutes (Estonia: about 15 to 20 minutes from window failure to the end); (3) the accommodation's joiner walls matter for the list at the end (TU Hamburg): water that spreads freely across a superstructure can roll her over, and Titanic did not roll over.

## 8. Conflicts

1. **Wired glass.** The 1923 tests put plain rough wired glass (5,640 to 7,900 psi) level with plain rough rolled (5,500 to 8,625) and polished wired level with polished plate; modern sources call it about half as strong as annealed. Small cut strips (1923) against whole panes with wire-glass interfaces (modern) may explain it. For 1911 skylights allow 0.5 to 1.0 of plate's strength.
2. **Where weir control ends.** Rahm: h/D = 0.3. HEC-22's constants with the minimum rule: 0.45. The core's own constants: 0.375. One shaft-spillway digest puts weir flow below H/D 0.5, another digest of the same paper says the reverse. The vented drop shaft's transitional band of 1 to 2 D is pipe control and does not apply to an opening into a room. I take h* = 1.2 to 2.0 A/P, central 1.5.
3. **FLOODSTAND's range.** Digests give 1.0 to 3.5 m for the collapse heads and, in one place, 2.0 to 3.5 m; the sliding door's 1.0 m is the low end. The B-class wall's 2.5 m (test) against 2.0 m (FE).
4. **A porthole's inflow.** The Lusitania expert's four tons a minute through a port three feet under is a sixth of the orifice law's figure for an 18-in port (26 t/min). Either the port was small, partly open, or the figure low; a model using Cd 0.6 on a port's full area runs about six times the expert.
5. **Empress of Ireland's 60,000 gallons a second** (273 m3/s) would need, by the orifice law, about 32 m2 under 10 m of head or 75 m2 under 2 m. The figure's origin is unknown; treat it as popular, not computed.
6. **Annealed glass at 8 in 1,000**: 2,800 psi (GANA, loads under a minute) against 3,380 psi (Glass Guides, 3 s). The difference is the load's duration and the reference area; both are inside my 20 to 45 MPa range.
7. **Kawneer's "safe" pressures** (1913) are 0.8 to 0.9 of my computed mean breaking pressure for 1/4-in plate of the same size: either the rows assumed thicker plate, or "safe" was near breaking.
8. **The plan's dome estimate.** `docs/PLAN_..._v1` 2.3 takes a 30 m2 opening under 1 m to pass 80 m3/s (orifice). By the weir law it passes about 40 m3/s at that head (a 6 x 5 m rim): the orifice figure is right only above h* of about 2 m.
9. **How the dome goes.** The plan has the dome fail when the outside head reaches its failure head. The physics says the likelier first failure is from inside, by the air trapped under it once the hall has filled through its doors (section 5, 10.2); the outside path applies only if every entry of the hall holds.
10. **The final roll.** The TU Hamburg simulation says a superstructure whose floodwater can cross freely would have rolled her over, and that the passageway walls stopped it. The core's default (`upperSplit: 0`, one free surface above E deck in each zone) is the free case, and the core rolls to 43 and then 80 degrees in its last two minutes (`docs/PLAN_..._v1` 2.3). Not a conflict with the literature but a likely explanation, relevant to decision D5.

## 9. NOT FOUND

- FLOODSTAND's own tables (D2.1a, D2.1b, D2.2a, D2.2b) and Jalonen et al. (2017) in full: per-door leakage area ratio against head and collapse heads with scatter; only digests reached me.
- Any load test of a leaded light, or a failure pressure from the church-window wind-load literature (English and German searches).
- Measured discharge coefficients for a stair well, a dome or an opening obstructed by stair flights; Ruponen's model-test coefficients; Stening's and Katayama's measured Cd.
- Measured discharge per metre of stair width against depth (Ishigaki and others): only the evacuation criteria and velocities.
- What the SOLAS explanatory notes (MSC.429(98)) or MSC.245(83) assume for windows and large glazed areas; ISO 21005 and ISO 11336 formulas (ISO 3254 and LR's rule used instead).
- Hatch covers, skylights or deckhouses lifted by escaping air on Lusitania, Britannic, Empress of Ireland or Andrea Doria.
- The investigators' computed flow rates for Herald of Free Enterprise, Sewol and Costa Concordia.
- Estonia's window design or test pressures (the JAIC text says only "of heavy construction"); SSPA's 5 m assumption reached me only as a digest.
- Re-found sources for these [memory] figures: wrought iron's strength, Roark's clamped coefficients, Epstein's 0.055, the Kutateladze constant 3.2, Honma's 0.35 and 0.91, Villemonte's paper, the USBR morning-glory criterion, the stress-corrosion exponent 16, the usual Cd 0.6 to 0.8 of ship-flooding codes.

## 10. For the model

### 10.1 The flow law for a horizontal opening (a well, a hatch, a broken dome or skylight)

Inputs: the rim's height z_r in the world frame (Z_r = R20 x + R21 y + R22 z + tz, as the core does for every connection), the level above eta_a (the sea's `hx` or the upper space's level) and the level below eta_b (the lower space's effective level: its free surface, or its pressed-up head when it is full, `hEff` in the core), the clear area A and the rim's perimeter P.

```
h1 = max(0, eta_a - Z_r)            depth standing over the rim above   (m)
h2 = max(0, eta_b - Z_r)            head of the space below over the rim: 0 while its level is below the rim (free fall)
H1 = max(h1, h2);  H2 = min(h1, h2);  s = +1 if h1 >= h2 (down), -1 (up)
Q  = s * min( Cw * P * H1^1.5 * (1 - (H2/H1)^1.5)^0.385 ,      weir round the rim, Villemonte when drowned
              Cd * A * sqrt(2 g (H1 - H2)) )                    orifice over the area, drowned by the head below
Q  = 0 when H1 = 0
```

- **Regimes.** Free weir (h2 = 0, h1 < h*), free orifice (h2 = 0, h1 > h*), drowned (h2 > 0: both branches shrink and both reach zero as h2 -> h1). The crossing head is h* = Cd A sqrt(2g) / (Cw P), = 1.5 A/P with the central pair below, 0.375 D for a circle and 0.375 a for a square; the literature's criterion is 0.3 to 0.5 D (Rahm 0.3; HEC-22's constants 0.45; drop-shaft work 0.4 to 0.5) [derived; sources in section 3].
- **Continuity.** The minimum of two continuous functions is continuous in h1, h2, A and P; the drowned branches reach zero together at h2 = h1, so a lower space that fills and presses up joins smoothly. The orifice branch needs the core's existing regularisation near zero head (`d / sqrt(max(|d|, 0.01))`) so its slope stays finite; the weir branch is smooth. If a smooth join is wanted, Q = (Qw^-4 + Qo^-4)^(-1/4) lies 16 % below the minimum at the crossing and within 2 % of it where one branch is twice the other [derived]; the drop-inlet literature describes the transition as unsteady and, if anything, below both laws [search summary], so the softened form is not worse physics.
- **Coefficients** (central, range, source):
  - Cd = **0.60**, 0.50 to 0.70: sharp-edged opening; the core's `CdDoor`, `CdBreach`; HEC-22's grate orifice 0.67 [read]; the usual ship-flooding default 0.6 [memory]. Use the clear plan area of the well less solid landings across it.
  - Cw = **1.77 m^0.5/s** = (2/3)(0.60) sqrt(2g), 1.55 to 1.85: the core's `Cweir` [read]; HEC-22 1.66 [read]; broad-crested theory 1.705 [search summary]; Honma 1.55 [memory]; sharp crest 1.80 to 1.85 [memory]. Use the full rim of the opening (a flight's head counts: the flight carries what reaches it).
  - Villemonte exponent 0.385 with n = 1.5 [memory for the paper; as in the core].
- **In series** (an opened dome over a stair hall over the well): compute each element with the same law and let the lowest-capacity element at the current heads control; when every element runs full as an orifice, 1/(Cd A)eq^2 = sum of 1/(Cd A)i^2 [derived], which is the plan's A_eq rule.
- **Vertical entries** (the entrance doors, broken windows) want the height-integrated door law of section 6, not a point orifice: it starts flowing the moment the sea passes the sill, as a weir, and becomes the large orifice above the lintel.

### 10.2 The failure law for glazed openings and doors

Heads are metres of sea water, net of any water standing on the other side, H = p / (1025 x 9.81), and they are measured in two ways, which matter:

- **Glazing, (a) to (c):** the head at the middle of the pane or the dome, which is the uniform pressure the plate formulas take (the mean pressure on a pane in still water).
- **Doors, (d):** the depth of water standing at the sill, which is what the door tests measured. A model that takes the head at a door's middle must convert with the same force on the door: H_mid = d^2 / (2 h_d) while the depth d at the sill is under the door's height h_d, and H_mid = d - h_d / 2 above it [derived]. On a 2 m door, 1.0 m at the sill is **0.25 m at the middle** (0.7 to 1.5 m at the sill is 0.12 to 0.56 m at the middle).

| Opening | Central | Range | Rests on | How it fails |
|---|---|---|---|---|
| (a) Leaded decorative dome, loaded on its face | **0.2 m** | 0.1 to 0.4 m | a lead-came net (cames of about 15 mm2, lead 12 to 17 MPa) spanning about 0.5 m between ribs or saddle bars: membrane capacity 1 to 4 kPa (section 2.3) [derived, inputs bet]; no test of a leaded panel found | ductile and progressive: putty and cement crack and leak first (a = 0.01 to 0.03 of its area from first wetting [bet]), then pieces drop out and the net tears |
| (b) Plate or wired-glass weather skylight in iron bars, loaded from outside | **0.5 m** | 0.2 to 1.2 m | the lesser of the glass (6.35 mm plate or 1/4-in wired in long panes 0.45 to 0.6 m wide, a/b 2 to 3: about 0.4 to 1.4 m between the 23 and 41 MPa columns of 2.2) and the bars and fixings (a 38 mm iron tee spanning 1.0 to 1.8 m: 0.2 to 0.65 m at yield, section 2.4) [derived, inputs bet]; wired glass taken as rough-rolled plate (1923 tests) to half of it (modern view) | the frame bends or a bar yields and panes fall out together; or panes break one by one |
| (b') The same skylight, or any pane resting on its rebate, loaded from inside (air or water under it) | **0.05 m** | 0.02 to 0.2 m | the pane's own weight (6.35 mm glass: 0.16 kPa) and its putty or clips; a whole light lifts when the net pressure exceeds its weight per area, 0.5 to 1 kPa [bet] | panes pop off their rebates; this is the path by which a trapped air pocket opens a dome cover (section 5) |
| (c) Deckhouse and entrance-house windows of about 1911 (polished plate in wood or brass frames, beaded) | **1.5 m** | 0.5 to 3.5 m | plate 6.35 to 12.7 mm, panes about 0.6 m wide, a/b about 1.5, glass at 34 MPa (20 to 45): by the plate formula with beta = 0.466 (a/b = 1.5, nu 0.22; membrane action adds under 5 % at these sizes), about 0.85 m for 6.35 mm, 1.8 m for 9.5 mm, 3.3 m for 12.7 mm [derived]; the thicknesses and sizes are bets until the record half gives them | brittle, each pane at once; a row of panes goes one by one as the head over each passes its strength (scatter m = 7: 10 % to 90 % of panes between 0.76 and 1.19 of the median head [derived]) |
| (d) Wooden entrance doors and joiner doors (closed) | **1.0 m** at the sill | 0.7 to 1.5 m | hollow-core wooden doors failed at 0.71 to 0.99 m in either orientation [read]; modern B-class joiner work leaks very extensively at about 1 m and collapses at 2 to 2.5 m [search summary]; solid panelled doors are stronger than hollow-core, latches and hinges no stronger [bet] | leaks from immersion (a = 0.02 to 0.05 of the submerged area [bet]; FLOODSTAND's steel doors 0.025 to 0.03), then all at once at the latch, the hinges or a panel; a glazed light in the door goes first, at about 0.3 to 1 m by the pane table |

Water running at the openings adds its stagnation head v^2/2g (0.46 m at 3 m/s, 1.27 m at 5 m/s), or about twice that for a breaking front's impact [derived; bet on the factor]: the forward faces of the houses see it when the bow plunges and water runs aft along the boat deck.

**Recommended form** (implementable, irreversible, logged as an event when an opening first passes its threshold):

```
H     = net head on the opening (m of sea water) as defined above: glazing at its middle, doors as the depth at the sill
A_eff = A * f(H),  and f never decreases (an opening that has opened stays open)
loaded from inside (b'):    f = 1 once the net outward head passes H_air (0.05 m; 0.02 to 0.2)
glass, many panes (b, c):   f = 0 below 0.75*H50; linear to 1 at 1.20*H50          (Weibull m = 7 spread)
leaded (a):                 f = a_leak from first wetting; linear from a_leak to 1 between 0.5*H50 and 1.5*H50
doors (d):                  f = a_leak * (submerged fraction of the door) below H_coll; f = 1 at H_coll (FLOODSTAND's form)
a_leak: 0.02 (leaded), 0.03 (doors; 0.02 to 0.05), 0 (bedded plate)
```

Glass needs no time constant at dt = 0.25 s (it breaks in milliseconds); a leaded panel tearing out could be ramped over 5 to 10 s [bet], which hardly matters next to the minutes the sea takes to climb a metre over the houses.

**Which way the dome goes** [derived, section 5]: on a sinking ship the sea reaches the entrance's doors and windows before it reaches the roof of the entrance house. If an entry lets water in, the hall fills, the air above the highest open entry is trapped under the dome and its cover, and the cover's panes lift off their rebates (b') once the sea stands 0.02 to 0.2 m above that entry's lintel: the dome is then open from below and the sea comes in over it as soon as the sea reaches it. If every entry holds, the cover is loaded from outside, (b), and then the inner dome, (a). So the model's rule can be: the dome and its cover open at the first of (i) the sea standing H_air = 0.05 m (0.02 to 0.2) above the lintel of the highest open entry of the hall (the air path), or (ii) the sea standing H50 of (b) over the cover (the outside path). Bo's `'wet'` rule (the dome goes when its well takes water) is close to path (i), and the difference between the two is the minute or so the sea takes to climb from the lintel to the roof.

### 10.3 Air

For the domes and the stair wells of a superstructure, a lumped model may ignore air, on two conditions: the spaces the well feeds keep other openings to the air above the water (other stairs, lift trunks, ventilators, doors and broken windows, the second staircase), together at least a tenth of the well's area, and the well is not the only way out for the air of a space that is filling from below. Then the air's back-pressure is a tenth of a metre against heads of metres (MSC.362(92)'s 10 % rule [search summary]; 1.0 kPa at 50 m3/s through 2 m2 [derived]). In Titanic's last minutes neither condition is sure, and the model already omits trapped air. If a space's only vent is the well, cap the flow down the well at the counter-current exchange limit, with the air taken as rising through the same opening:

```
Q_ex = j_lim * A,  j_lim = Ku_lim * (g sigma (rho_w - rho_a))^0.25 / sqrt(rho_a),
Ku_lim = ( sqrt(C) / (1 + (rho_w/rho_a)^0.25) )^2,  C = 3.2                       [memory: Wallis; Pushkina and Sorokin]
       = 0.37 m/s for sea water and air (0.3 to 0.75 m/s with Epstein's 0.055 sqrt(g' D^5) as the other bound)   [derived]
Q_down = min(Q from 10.1, Q_ex)
```

and if a space vents through a separate small opening A_v, add the back-pressure dp = (rho_a / 2) (Q / (0.6 A_v))^2 to the lower space's head (in metres of sea water: dp / (rho_w g)) [derived]. The other effect of air, the trapped pocket that lifts a dome's cover, is in 10.2.

### 10.4 Worked example (PLACEHOLDER GEOMETRY: a well of 5 m x 4 m, A = 20 m2, P = 18 m; free fall below)

From `C:\temp\titanic-stairs-scratch\hydraulics\well_flow.js` (central Cd 0.60, Cw 1.77; low Cd 0.50 with Cw 1.55; high Cd 0.70 with Cw 1.85) [derived]:

| Head over the rim | Weir (m3/s) | Orifice (m3/s) | Law: the lesser (m3/s) | t/min | Against 400 t/min | Low to high (t/min) |
|---|---|---|---|---|---|---|
| 0.5 m | 11.3 | 37.6 | **11.3** (weir) | **693** | 1.7 x | 607 to 724 |
| 1 m | 31.9 | 53.2 | **31.9** (weir) | **1,961** | 4.9 x | 1,716 to 2,048 |
| 2 m | 90.2 | 75.2 | **75.2** (orifice) | **4,623** | 11.6 x | 3,852 to 5,393 |
| 4 m | 255.1 | 106.3 | **106.3** (orifice) | **6,538** | 16.3 x | 5,448 to 7,628 |

The crossing is at h* = 1.67 m (central; 1.59 to 1.99 m across the sets). Drowned at h1 = 2 m by a full space below: 65 m3/s at h2 = 0.5 m, 53 at 1 m, 38 at 1.5 m, 17 at 1.9 m, 0 at 2 m. With the space below sealed but for the well, the air would hold the flow to about 7 to 14 m3/s (456 to 857 t/min) at any head. For scale: an open well of this size under a metre of water takes in five times the ship's original collision inflow; the plan's figure of 80 m3/s for 30 m2 under 1 m (orifice only) is, by the weir law, about 40 m3/s for a 6 m x 5 m opening at that head (P = 22 m: 1.77 x 22 x 1 = 39 m3/s) [derived].

### 10.5 Sanity tests from full scale

| Test | Expect | Source |
|---|---|---|
| Broken windows totalling 5 to 10 m2 under 0.5 to 2 m of head | about 20 t/s (Estonia: 18,000 t in about 15 min) | JAIC 13.6 [read] |
| Time from failure of the superstructure's windows to the end | minutes (Estonia: about 15 to 20) | JAIC 13.2.6, 13.6 [read] |
| A large opening in the top of the hull under a metre of head | thousands of t/min; the end within a few minutes of it | 10.4 [derived] |
| A porthole 3 ft under water | 4 t/min by the Lusitania expert; 26 t/min by the orifice law for an 18-in port | Wikipedia [read in Wikipedia]; [derived] |
| Titanic's final list | about 10 degrees to port, not a capsize: a flooded superstructure without the passageway walls' obstruction rolls her over in the TU Hamburg simulation | TUHH [read]; `docs/PLAN_...` 2.3 (the core rolls to 43, then 80 degrees) |
| Britannic, open ports, under way | 55 min (the core: 50 min stopped) | Wikipedia [read in Wikipedia]; `README.md` |

### 10.6 The bets that remain, with the range a model should allow

| Bet | Central | Range to allow | Why it is a bet |
|---|---|---|---|
| Cd of a well or broken dome | 0.60 | 0.50 to 0.70 | no measurement for stair wells or domes found |
| Cw round a rim | 1.77 | 1.55 to 1.85 | crest shape of a coaming, a balustrade or a broken frame unknown |
| Leaded dome's failure head | 0.2 m | 0.1 to 0.4 m | no load test of a leaded panel found; derived from lead's strength and the net's geometry |
| Skylight from outside | 0.5 m | 0.2 to 1.2 m | sizes of bars, spans and fixings unknown; frame likely governs |
| Skylight pane from inside | 0.05 m | 0.02 to 0.2 m | how the panes were held (putty, clips, beads) unknown |
| Deckhouse windows | 1.5 m | 0.5 to 3.5 m | thickness and pane size of Titanic's windows not in this note (the record half) |
| Wooden doors | 1.0 m at the sill (0.25 m at the middle of a 2 m door) | 0.7 to 1.5 m at the sill (0.12 to 0.56 m at the middle) | tests are of hollow-core doors; Titanic's were heavier; which way they opened unknown |
| Leak ratio of closed doors and leaded lights | 0.03 | 0.01 to 0.05 | FLOODSTAND's steel doors 0.025 to 0.03; wood and lead leakier |
| Glass strength in service, held tens of seconds | 34 MPa | 20 to 45 MPa | period tests 21 to 46 MPa; weathering; load duration |
| Air ignored | yes, if vents are at least 10 % of the well | cap at 0.37 m/s (0.3 to 0.75) over the well's area if it is the only vent | the vent area of Titanic's upper decks in her last minutes is unknown |
| Stagnation and impact on forward faces | v^2/2g | 1 to 2 times it | the speed of water running aft along the boat deck (3 to 5 m/s at 1 to 2 m deep [derived]) |

### 10.7 Where the core's existing laws differ from the literature

1. **Openings in a horizontal deck have no weir regime** (`K_DOWN`, `core/core.js:401-405`: orifice at all heads). The literature says weir below h* = 1.5 A/P; for the core's E-deck openings (0.14 m2, about 0.37 m square) h* is only about 0.15 m, so this costs little there, but for a stair well or a dome it overstates the flow by h*/h at small head (3.3 times at 0.5 m over a 5 x 4 m well).
2. **Openings in the top deck have no orifice regime** (`K_TOP`, `core/core.js:414-419`: a weir of fitted width at all heads). A horizontal opening's flow goes as h^0.5 above h*, so the weir law, growing as h^1.5 without limit, overstates the flow as the sea climbs metres over B deck (2.4 times at 4 m over a 5 x 4 m opening). `fOpen` is fitted, so the level is calibrated; the shape against head is not. If the domes and doors become explicit, `K_TOP` is the place where the same min law belongs, and changing it is a physics change that needs the refit.
3. **Doors are point orifices at a fixed height** (`K_DOOR`, z = deck + 1.0 m or floor + 0.85 m). A real door starts to pass water as a weir the moment the water passes its sill; the point orifice passes nothing until the water reaches mid-door, then the whole area's orifice flow. For the watertight doors this rarely matters (they are shut); for open-door what-ifs and for any new entrance doors, the height-integrated law of section 6 is the one in the literature.
4. **Villemonte's factor and `Cweir` 0.60** agree with the literature (n = 1.5, exponent 0.385; Cw 1.77 inside the published 1.55 to 1.85).
5. **No trapped air**: consistent with the literature for large, well-vented spaces; not for the last minutes, when the decks' vents go under, and not for a dome's cover, which trapped air is the likeliest thing to open.

### 10.8 Against the S1 draft found in the working tree

While I wrote this, `core/core.js` in the main working tree gained an uncommitted S1 draft (staircases, tiers, windows; `git diff`, read at 13:57 CST; not my change). Read against this note:

1. `lawUpright` is the height-integrated door law of section 6 term for term. Agrees.
2. `lawLevel` is the minimum of weir and orifice of 10.1 with the drowning applied to the orifice branch only. That is continuous too; with Villemonte on the weir branch as well (10.1), a shallow drowned flow comes out lower (at h1 = 0.5 m, h2 = 0.4 m over the 5 x 4 m well: 7.0 against 11.3 m3/s). Either is defensible; the difference matters only when the space under a dome is full.
3. **`hDoor` = 1.5 m, compared with the sea's head at the door's middle (`zc`), makes a door about six times as strong as the door tests say.** The wooden doors failed with 0.71 to 0.99 m standing at the sill; on a 2 m door that is 0.13 to 0.25 m at its middle by equal force (10.2). In the draft's convention, take `hDoor` about 0.25 m (0.12 to 0.56); 1.5 m at the middle is 2.5 m at the sill, beyond even FLOODSTAND's steel fire doors' usual 2 m.
4. `hDome` = 0.5 m and `hWin` = 1.5 m match (b) and (c) here. The dome's air path, (b') and the rule at the end of 10.2, is in the draft only as the `domeWet` what-if.
5. `leakWin` = 0.02 against 0 for bedded plate here: immaterial beside the windows' failure.

## 11. Sources

Opened and read (in part or whole):

- JAIC, Final Report on the capsizing of MV Estonia (1997), HTML: https://www.multi.fi/estonia/estorap.html (12.6, 13.2.6, 13.6) [read]
- Ingram, Greenwald, Hagy (1988), Investigation of the Validity of Existing Standards Concerning the Use of Glass Windows on Ships, USCG CG-D-06-89, DTIC ADA210249: https://archive.org/stream/DTIC_ADA210249/DTIC_ADA210249_djvu.txt [read]
- Plympton (1891), "Some Experiments on the Transverse Breaking Strain of Plate Glass", Trans. ASCE 25, 223-227, with Trautwine Jr.'s discussion: https://archive.org/stream/transactionsofam25amer/transactionsofam25amer_djvu.txt (offset 600,000) [read]
- "Modulus of rupture and elasticity of non-scatterable glass", J. Am. Ceram. Soc. 6 (1923), Table II: https://archive.org/details/journalofameri06amer1918 (scan pages 1061 to 1063, read through the BookReader text service) [read]
- Kawneer Manufacturing Co. (1913), Kawneer store fronts, "Wind pressure for plate glass": https://archive.org/stream/KawneerManufacturingCoKawneerstorefronts19130001/KawneerManufacturingCoKawneerstorefronts19130001_djvu.txt [read]
- "Thermal Stress, Part Two", Architects' Guide to Glass and Metal (2009): https://glassguides.com/2009/08/thermal-stress-part-two/ [read]
- Roark's Formulas for Stress and Strain, 7th ed., simply supported plate, via EngineersEdge: https://engineersedge.com/calculators/flat_rectangular_plate_with_all_edges_simply_supported_15090.htm [read]
- Lloyd's Register, Rules for Special Service Craft (July 2022), Pt 3 Ch 4 Sec 7: https://www.imorules.com/SSC_PT3_CH4_7.html [read]
- Wells et al. (2019), Results in Engineering 3, 100031, via OpenAlex: https://api.openalex.org/works/doi:10.1016/j.rineng.2019.100031 [read, abstract]
- Texas DOT Hydraulic Design Manual, grate inlets in sag: https://www.txdot.gov/manuals/des/hyd/chapter-10--storm-drains/section-6--gutter-and-inlet-equations/design-procedure-for-grate-inlets-in-sag-configura.html [read]
- USBR Water Measurement Manual, ch. 2 sec. 13: https://www.usbr.gov/tsc/techreferences/mands/wmm/chap02_13.html [read]
- Epstein (1988), abstract: https://www.osti.gov/biblio/5475252 [read]
- Ruponen (2007), abstract: https://research.aalto.fi/en/publications/progressive-flooding-of-a-damaged-passenger-ship [read]
- FLOODSTAND final report summary, CORDIS: https://cordis.europa.eu/project/id/218532/reporting [read]
- MEC (Tallinn), FLOODSTAND page: https://mec.ee/r-d/floodstand [read; no figures]
- Tada, Inoue, Honda, Furumoto (2001), abstract: https://www.jstage.jst.go.jp/article/prohe1990/45/0/45_0_901/_article [read]
- British Inquiry, Day 12, Lightoller, BI 14054-14061: https://www.titanicinquiry.org/BOTInq/BOTInq12Lightoller02.php [read]
- TU Hamburg, Institute of Ship Safety, casualty simulations: https://www.tuhh.de/ssi/en/marine-casualty-simulations, .../rms-titanic, .../costa-concordia, .../mv-estonia [read]
- TU Hamburg window projects: https://tuhh.de/skf/research/research-projects/ultimate-strength-of-window-structures-in-areas-relevant-for-damage-stability-and-safety; https://www.tuhh.de/skf/research/research-projects/load-carrying-behaviour-of-window-structures [read; no figures]
- Wikipedia: "HMHS Britannic", "Sinking of the RMS Lusitania", "RMS Empress of Ireland", "Strength of glass", "Glugging" [read in Wikipedia]
- OSTI records of the INL flooding-fragility reports: https://www.osti.gov/biblio/1467486, https://www.osti.gov/biblio/1376902 [read; no door figures]

Known only through search digests (tagged [search summary] where used): Jalonen et al. 2017 (Marine Structures); Ruponen et al. 2017 (Ocean Engineering) and 2019 (Ship Technology Research); FLOODSTAND D2.1b, D2.6; FLARE D4.1; Ruponen et al. 2010 (Trans. RINA) and 2013 (Ocean Engineering); GANA FM05-12; EN 572-1 tables; Dalgliesh and Taylor (NRC Canada); SAFTI on wired glass; lead's properties (Callister via Princeton); Padulano and Del Giudice 2018; Rahm 1953; Iowa DOT 4A-8; Bentley StormCAD help; the Harza spillway chapter; Ishigaki et al. 2005, Baba et al. 2011, Inoue et al. 2003; the Korean stair re-computation; IMO MSC.362(92); the US Senate Inquiry, Day 5 (Lightoller); the Encyclopedia Titanica forum thread; SSPA 2008 and the 2024 Estonia re-study; the window pull-through tests.
