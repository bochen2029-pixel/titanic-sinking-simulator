# Screws' stations, the wash's jet law, the engines' cranks: facts (v1)

- **Written:** 2026-11-17, 03:36 to 03:55 CST, after about 45 minutes of research, by a research subagent of session
  ab71e668 (Claude Code desktop, Opus 5.5), for backlog items R2, R3 and V8 (`BACKLOG.md` section 1).
- **Supersedes nothing.** Builds on `RESEARCH_stern_gear_wake_lights_v1_2026-11-16.md` and its `v1_1` (R1).
- **Method:** web search and WebFetch only: no browser pane, no downloads, about 45 minutes. Nothing in the repository
  was run or changed except this new file.
- **What "read" means here:** a page opened today with WebFetch. WebFetch hands the page to a summarising model, so
  the quotes and equations below are as that model returned them: one step weaker than R1's pixel readings.
  "Search summary" means the search tool's digest of a page that was not opened: lower confidence, marked so.
- **Limits met:** WebFetch could not read PDFs (two tried: one compressed, one scanned) or images (one JPEG tried: it
  came back as bytes). Five sites refused it (HTTP 403): encyclopedia-titanica.org (all forum threads and articles),
  mdpi.com, e3s-conferences.org, sciencedirect.com, patreon.com; Springer redirected to a login. So no plan or
  photograph could be measured (R2), and none of the jet law's own papers could be read (R3).
- **Arithmetic** marked [derived] was done by hand or in PowerShell outside the repository. It is not certified with
  Abacus.

## 0. Summary

**R2, the screws' stations fore and aft: NOT FOUND.** No text gives the wing screws' distance ahead of the rudder's
stock or the after perpendicular, or the centre screw's place in the aperture. A forum post (search summary only)
puts the after peak bulkhead at frame 133 aft, but no frame spacing or frame of the after perpendicular was found to
turn that into a station. Three photographs with the gear in place are located (section 1.2). Measuring them needs
the browser pane, as R1 did, which this brief excluded. **Keep the bet.**

**R3, the wash's jet law: found as a 2024 review tabulates it, not in its own papers.** The German method, after
Fuehrer, Pohl and Römisch (1987; the literature also cites Fuehrer and Römisch 1977 for it) has three parts:
- the efflux velocity is V0 = 1.59 n Dp sqrt(Ct);
- the maximum velocity is flat to x = 2.6 Dp;
- beyond that, Vmax / V0 = 2.6 (x / Dp)^-1.0.

The drawing's law has this form with 2.5 in place of 2.6. Its efflux, sqrt(2T / (rho A)), is 1.596 n D sqrt(K_T)
[derived], the same within 0.4 %. Blaauw and van de Kaa (1978) give 2.8 (x / D)^-1.0, where D may be the contracted
jet's diameter (0.707 Dp). Hamill gives an efflux 17 % lower (1.33). **Put `WASH.zone` = 2.6.**

**V8, the engines: crank angles found (one source); the connecting rod's length NOT FOUND.** Samuel Halpern gives the
sequence: HP at top dead centre, then the IP 106 degrees later, the forward LP 100 degrees after that, the aft LP 54
degrees after that, and the HP again 100 degrees later. A balance check [derived] supports the angles:
- the crank star is symmetric;
- the primary forces cancel exactly if the HP and IP reciprocating parts weigh the same, each 1.48 times an LP's;
- the secondary forces are left at about a third of one LP's.

**Put `cranks: [154, 0, 254, 100]`. Keep the rod at 4.5 cranks [bet].**

## 1. R2: the screws' stations fore and aft

### 1.1 Findings

| Figure | Value | SI | Source (author, title, URL) | Short quote | Confidence |
|---|---|---|---|---|---|
| The centre screw's place | On the centre line, directly ahead of the rudder; no distance given | - | S. Halpern, "Titanic's Prime Mover: An Examination of Propulsion and Power" (rev. 31 Jan 2011), https://www.titanicology.com/Titanica/TitanicsPrimeMover.htm (read) | paraphrase (this source's one quote is in section 3) | High for the arrangement; no number |
| The sterntubes | The centre shaft's sterntube ran from the boss in the stern frame's aperture to the after peak bulkhead at frame 133 aft; each wing shaft's sterntube lay between its after and forward shaft brackets | - | Encyclopedia Titanica forum, "Propeller Shafts", https://www.encyclopedia-titanica.org/community/threads/propeller-shafts.17356/ (search summary; the site refused WebFetch) | - | Low-medium: a forum post citing plans. It gives a frame number, not a station |
| Two sets of boss arms per wing shaft | An after and a forward bracket on each wing shaft, cast steel, in halves bolted together on the ship | - | Titanic: Honor and Glory, "Brackets, Bulkheads, & Beams!", https://www.patreon.com/titanichg/posts/brackets-beams-96017555 (search summary; 403); The Shipbuilder (1911) Figs. 18 and 19 captions, "After propeller brackets" (read, GG Archives page below) | - | Medium |
| **NOT FOUND** | The wing screws' distance ahead of the rudder's stock or of the after perpendicular | - | searched in section 4 | - | - |
| **NOT FOUND** | The centre screw's distance ahead of the stock, its place in the aperture (the drawing: 1.9 m [bet]) | - | - | - | - |
| **NOT FOUND** | The frame spacing at the stern, and the frame number of the after perpendicular or the rudder's stock (with these, "frame 133 aft" would become a station) | - | - | - | - |
| **NOT FOUND** | A dimensioned or scaled profile in text form (H&W plans, The Shipbuilder's plates, Beveridge's plans) | - | - | - | - |

### 1.2 Located, not measurable under this brief

These figures are listed on The Shipbuilder (1911) page "Building the Hulls" as reproduced by GG Archives,
https://www.ggarchives.com/OceanTravel/Titanic/25-ImageLibrary/TheShipbuilder-03-BuildingTheHulls.html (read: the
captions only). The URLs below are the 500-pixel versions it links. R1's full-size files had the same names without
`-500` (not checked for these).

| Figure | What it should show | URL |
|---|---|---|
| Fig. 35, "Stern of the Olympic immediately before launching" | the stern gear fitted, from below and astern | https://www.ggarchives.com/CVimages/OT/Titanic/TheShipbuilder/1911-Midsummer/37-SternOfTheOlympicImmediatelyBeforeLaunching-500.jpg |
| Plate XV, "View at stern of ship about ready to launch" (Modern Shipbuilding Terms, 1918), with labelled parts | the same, labelled | https://www.ggarchives.com/CVimages/OT/ModernShipbuildingTerms/1918/PlateXV-ViewAtSternOfShipAboutReadyToLaunch-500.jpg |
| Fig. 42, "The Olympic in graving dock" | the hull in dock; the stern may be too small | https://www.ggarchives.com/CVimages/OT/Titanic/TheShipbuilder/1911-Midsummer/41b-TheOlympicInGravingDock-500.jpg |

None of the GG Archives captions is a profile or longitudinal section. The engines page refers to "Plate VII", an
elevation of the engines, which is not reproduced there.

### 1.3 For the model

**Keep the bet** (`STERN.clearance` 0.15; the centre screw 1.9 m ahead of the stock). No station was read, and the
done-when needs a figure with a scale. The notes do not record the wing station that `wingStation()` computes at
load; the brainstorm had x = -122 m, 7.5 m ahead of the after perpendicular.

The next step is a measuring session like R1's, in the browser pane:
- measure Fig. 35 or Plate XV at full size;
- use two scales, the wing screw's 23 ft 6 in (7.163 m) and the rudder's 15 ft 3 in (4.648 m);
- these are photographs from an angle, so expect R1's 4 % between scales, or worse;
- an H&W profile plan at full size would do better.

## 2. R3: the wash's jet law

### 2.1 Findings

Unless marked otherwise, the equations are as tabulated, with attributions, by Kadir, Istadi, Subagio and others
(2024), "Ship Propeller Rotation Threshold to Prevent Erosion and Sedimentation in Coastal Waters", *Journal of Marine
Science and Application* 23(4): 798-811, https://html.rhhz.net/jmsa/html/20240408.htm (read). It is a secondary
source. Its reference list gives:
- Fuehrer M., Pohl H., Römisch K. (1987), "Propeller jet erosion and stability criteria for bottom protection of
  various constructions", PIANC Bulletin 58;
- Hamill G. A. (1988), "The scouring action of the propeller jet produced by a slowly manoeuvring ship", PIANC
  Bulletin 62: 85-110;
- Blaauw H. G., van de Kaa E. J. (1978), "Erosion of bottom and sloping banks caused by the screw race of manoeuvring
  ships", Delft Hydraulics Laboratory.

n is in revolutions per second, Dp is the screw's diameter, Ct (K_T) is the thrust coefficient and x is the distance
astern of the screw.

| Figure | Value | SI | Source (author, title, URL) | Short quote | Confidence |
|---|---|---|---|---|---|
| Efflux velocity, German method | V0 = 1.59 n Dp sqrt(Ct) | 1.59 = sqrt(8 / pi) = 1.5958 of momentum theory [derived] | Fuehrer, Pohl and Römisch (1987), Eq. (1) in Kadir et al. 2024 (read) | - | Medium-high: it is momentum theory |
| Efflux velocity, Hamill | V0 = 1.33 n Dp sqrt(Ct) | 0.834 of momentum theory [derived] | Hamill (1988), Eq. (2) in Kadir et al. (read). A search summary gives the same 1.33 to Hamill and Johnston (1993) | - | Medium |
| Where the decay starts, German method (end of the zone of flow establishment) | x / Dp = 2.6; the maximum velocity is constant at V0 before it | 18.62 m for a wing screw (D 7.163 m) [derived] | Kadir et al., citing Fuehrer et al. (1987) and Blaauw and van de Kaa (1978) (read) | "from the centre of the propeller axis to the point x/Dp = 2.6" | Medium |
| Decay beyond it, German method | Vmax / V0 = 2.6 (x / D)^-1.0 | It equals 1 at x = 2.6 D, so the law is continuous where the flat part ends [derived] | Fuehrer et al. (1987), Eq. (12) in Kadir et al. (read). A review table gives Fuehrer and Römisch (1977) a branch for x / Dp >= 2.6: "Recent advances in understanding propeller jet flow and its impact on scour" (authors not seen), https://www.researchgate.net/publication/344671885 (search summary; its coefficients came back garbled) | - | Medium |
| Decay, Dutch method | Vmax / V0 = 2.8 (x / D)^-1.0 | If D is the contracted jet's D0 = 0.707 Dp, this is 1.98 (x / Dp)^-1 [derived] | Blaauw and van de Kaa (1978), Eq. (13) in Kadir et al. (read). D0 = 0.707 Dp attributed to them in the abstract of "Axial Velocity Distribution at the Efflux of a Stationary Unconfined Ship's Propeller Jet" (OMAE 2010), https://asmedigitalcollection.asme.org/OMAE/proceedings-abstract/OMAE2010/49118/837/345915 (search summary) | - | Medium for the form; low for which diameter it uses |
| Contraction of the jet | Fuehrer and Römisch (1977), Bergh and Cederwall (1981) and Hamill (1987) held it insignificant | - | search summary; the page it came from was not identified | - | Low-medium |
| Decay, Verhey | Zone ends at x / Dp = 2.77; Vmax / V0 = 1.275 (x / D)^-0.7 for x / D > 1.5 | - | Verhey (1983), Eq. (7) in Kadir et al. (read) | - | Medium |
| Decay, Berger | Vmax / V0 = 1.025 (x / D)^-0.6 | - | Berger and others (1981), PIANC 25th Congress, Eq. (15) in Kadir et al. (read) | - | Medium |
| Measured decay inside the zone (Belfast school) | Lam and others (2011): Vmax / V0 = 1 - 0.1592 x / D, zone to x / Dp = 3.25. Stewart: 1.0172 - 0.1835 x / D in the zone, 0.543 - 0.0281 x / D beyond. Hashmi (1993): 0.638 e^(-0.097 x / D) | - | Eqs. (6), (8), (16), (17) in Kadir et al. (read) | - | Medium |
| The zone, Hamill and Kee (2016) | Between 3 and 3.5 Dp; the maximum velocity decays inside it, against the earlier assumption | - | Hamill and Kee, "Predicting axial velocity profiles within a diffusing marine propeller jet", Ocean Engineering 124 (2016) 104-112, https://pureadmin.qub.ac.uk/ws/files/81370503/Gerard.pdf (search summary; WebFetch could not read the PDF) | - | Low-medium |
| The zone, Hamill (1987) | 2.5 Dp in one citing paper, 2 Dp in another | - | search summaries only, conflicting (one of them is probably where the drawing's 2.5 came from) | - | Low |
| PIANC (2015) | Its "German method" follows Führer and Römisch's work | - | Hawkswood and Groom, "Berth Scour Protection for Single and Twin Propellers" (title from the file's name), PIANC World Congress 2018, https://proserveltd.co.uk/wp-content/uploads/2020/07/2018-Paper-Berth-Scour-Protection-for-Single-and-Twin-Propellers-Hawkswood-Groom-2018.pdf (search summary; PDF not opened) | - | Medium for the naming |
| **NOT FOUND** | Fuehrer and Römisch (1977), PIANC 24th Congress, Leningrad: the paper's own text | - | the congress is catalogued (marineinfo.org, search summary); no readable copy | - | - |
| **NOT FOUND** | Hamill (1987), PhD thesis, Queen's University Belfast: own text | - | - | - | - |
| **NOT FOUND** | PIANC (2015), Report 180, "Guidelines for protecting berthing structures from scour caused by ships": own text and constants | - | a paid report; not online in readable form | - | - |
| **NOT FOUND** | Blaauw and van de Kaa (1978), Delft Hydraulics Laboratory: own text, so which diameter goes with the 2.8 | - | - | - | - |

**Which year?** Kadir et al. give the German equations to Fuehrer, Pohl and Römisch (1987). The wider literature, and
the backlog, cite Fuehrer and Römisch (1977) for the same 1.6 n D sqrt(K_T). Both are PIANC publications by the same
group. Which paper first printed the 2.6 could not be checked.

### 2.2 The laws side by side [derived]

Vmax / V0 at distances astern of the screw, in screw diameters. 17 D (121.8 m for a wing screw) is about the distance
from the wing screws (x = -122 m, the brainstorm's [bet]) to amidships. Each law is used as published. The Belfast laws
were fitted over limited ranges: Stewart's goes negative past 19 D.

| x / D | the drawing now (2.5 / x) | German, Fuehrer (2.6 / x) | Dutch as tabulated (2.8 / x) | Dutch with D0 (1.98 / x) | Berger | Verhey | Hashmi | Stewart |
|---|---|---|---|---|---|---|---|---|
| 2.6 | 0.962 | 1.000 | 1.000 | 0.762 | 0.578 | 0.653 | 0.496 | 0.470 |
| 5 | 0.500 | 0.520 | 0.560 | 0.396 | 0.390 | 0.413 | 0.393 | 0.403 |
| 10 | 0.250 | 0.260 | 0.280 | 0.198 | 0.257 | 0.254 | 0.242 | 0.262 |
| 17 | 0.147 | 0.153 | 0.165 | 0.116 | 0.187 | 0.175 | 0.123 | 0.065 |
| 25 | 0.100 | 0.104 | 0.112 | 0.079 | 0.149 | 0.134 | 0.056 | out of range |

At 10 D every law but the Dutch one with D0 is within 8 % of the German law. At 17 D they spread from 0.07 to 0.19 V0.
So the time at which the wash reaches amidships is uncertain by more than the 2.5 / 2.6 question, whichever law is
used.

### 2.3 For the model

- **`WASH.zone`: 2.6** (was 2.5). Tag it [read, as tabulated by Kadir et al. 2024 from Fuehrer, Pohl and Römisch
  1987: Vmax / V0 = 2.6 (x / D)^-1 beyond 2.6 D].
- **`washSpeed` keeps its form.** It is V0 to 2.6 D, then V0 times 2.6 D / s, which is the German law exactly. The
  comment's [bet] on joining the two at the zone's end can go: the published constant makes the law continuous there
  [derived].
- **The efflux stays as it is:** sqrt(2 |T| / (rho A)) = 1.596 n D sqrt(K_T) [derived], the German 1.59 within 0.4 %.
  Hamill's 1.33 would make the wash 17 % slower. It is an empirical efflux, and pairing it with the German decay would
  mix two methods.
- **Effect [derived]:**
  - beyond the zone the wash runs 4 % faster;
  - far out, its reach at a given time grows by about 2 % (there s^2 grows as 2 V0 xe t, so s scales as sqrt(xe));
  - it dies at 0.3 m/s 4 % farther out.

  The crash-stop rows of `tools/visuals_tests.js` (ahead of the screws at 67 s, amidships at 239 s) may move by a few
  seconds: re-run them.
- **Why not another law:**
  - The German method is the one PIANC's guidelines carry under that name.
  - It pairs with a momentum-theory efflux like the model's.
  - Beyond 10 D the alternatives scatter both ways (section 2.2).
- **R3 stays open in part:** the law is quoted from a review that tabulates it, not from Fuehrer and Römisch's own
  paper, and PIANC (2015)'s own figure (the drawing's 2.5 is credited to it) was not seen.

## 3. V8: the engines' crank angles and connecting rods

### 3.1 Findings

| Figure | Value | SI | Source (author, title, URL) | Short quote | Confidence |
|---|---|---|---|---|---|
| Crank sequence | HP at top dead centre (TDC); then the IP 106 degrees later; the forward LP 100 degrees after that; the aft LP 54 degrees after that; the HP again 100 degrees after that (sum 360) | 1.850, 1.745, 0.942, 1.745 rad | S. Halpern, "Titanic's Prime Mover: An Examination of Propulsion and Power" (rev. 31 Jan 2011), https://www.titanicology.com/Titanica/TitanicsPrimeMover.htm (read; the page's degree signs came back garbled; the passage cites no source) | "HP at TDC, then a 106° rotation for the IP to TDC" | Medium: one researcher, uncited, but the angles balance as such an engine should (rows 6 to 8) |
| The cranks were not at 90 degrees | Same page: the throws were not 90 degrees apart; vibration was reduced through the crank angles and their sequence | - | Halpern (same page; paraphrased, one quote per source) | - | Medium-high |
| The system's principle | Four cranks at angles somewhat off 90 degrees; piston weights and spacing adjusted with them; balance is approached, not reached | - | J. A. Ewing, "Steam Engine", Encyclopaedia Britannica, 11th ed. (1911), section 86, https://en.wikisource.org/wiki/1911_Encyclop%C3%A6dia_Britannica/Steam_Engine (read) | "selecting suitable angles for the relative positions of the cranks (differing somewhat from 90°)" | High for the principle |
| LP cylinders at both ends because of the balancing | Order from forward: LP, HP, IP, LP | - | The Shipbuilder (1911), "Propelling Machinery", GG Archives, https://www.ggarchives.com/OT/Titanic/25-ImageLibrary/TheShipbuilder-04-PropellingMachinery.html (read) | "as is usual with the balancing system adopted" | High |
| Crank positions, measured behind the HP in the turning sense | HP 0, IP 106, forward LP 206, aft LP 260 degrees | - | [derived] from row 1 | - | as row 1 |
| A symmetric crank star | The HP and IP sit at +-53 degrees about one line; the two LPs at +-27 degrees about the opposite line | - | [derived] | - | derived |
| Primary forces | With the two LPs' reciprocating weights equal (their cylinders are), balance requires the HP's and the IP's to be equal, each 1.4805 times an LP's (= cos 27 / cos 53) | - | [derived] (PowerShell) | - | derived. Equal HP and IP weights are a natural design choice, and a symmetric star (the two 100-degree gaps) is what a design with matched end cylinders gives: this supports row 1 |
| Primary couples | Balanced if the LP centres are 2.60 times as far from the engine's middle as the HP and IP centres (weights as above; spacing symmetric about the middle) | - | [derived] | - | derived on assumptions |
| Secondary forces | Not balanced: the residual is 0.36 of one LP's secondary force | - | [derived] | - | derived: consistent with Ewing, for whom the system approaches balance |
| An elevation of the engines exists | "Plate VII" of The Shipbuilder (1911), not reproduced on the GG Archives page | - | The Shipbuilder (1911), same page (read) | - | High that it exists; not seen |
| Earlier forum reasoning | With the HP crank at 0, an LP at 120 degrees (a poster's reasoning, disputed in the same thread) | - | Encyclopedia Titanica forum, "Triple expansion engines" (v1; search summary) | - | None: superseded by row 1 |
| **NOT FOUND** | The connecting rods' length (centre to centre) | - | The Haynes "RMS Titanic Owners' Workshop Manual" (de Kerbrech and Hutchings) gives rod and piston diameters, per an Encyclopedia Titanica thread, https://www.encyclopedia-titanica.org/community/threads/engine-specifications-as-per-the-engineering-notebook.38577/page-3 (search summary; 403). Whether it gives the length is not known | - | - |
| Period examples of rod to crank | 3.5 cranks in Ewing's worked figure (section 83, read); 5 cranks in Burgh's marine-engine example (e-rara scan, search summary); "3.5 to 4.5" for vertical engines on a modern commercial page (search summary, not a period source) | 3.5 cranks = 3.33 m, 5 cranks = 4.76 m here [derived] | as stated | - | Low: examples, not her engines |
| **NOT FOUND** | Which way Halpern's sequence runs: going ahead is assumed below [bet] | - | - | - | - |

### 3.2 For the model

- **`ENGINE.cranks`: `[154, 0, 254, 100]`** for `cyl` [LP forward, HP, IP, LP aft]. Tag it [read: Halpern 2011,
  uncited; the turning sense taken as ahead, bet]. Derivation [derived]:
  - `site/app.js` draws `a = th + crank`, with `th` growing going ahead (the starboard set) and the piston at TDC
    when a = 0;
  - so crank k reaches TDC at th = -crank_k;
  - Halpern's TDC times (HP 0, IP 106, forward LP 206, aft LP 260) give the offsets 0, 254, 154 and 100;
  - check: at th = 106 the IP is at 106 + 254 = 360.

  If the sequence runs astern, the offsets are the negatives, `[206, 0, 106, 260]`. The balance is the same either
  way; only the order in which the pistons rise differs.
- **The port set (a change in `app.js`, not in `visuals.js`).** `app.js` turns it with th = -theta. With the same
  offsets its pistons therefore rise in the reverse order (HP, aft LP, forward LP, IP). Twin-screw engines were
  usually built as mirror images [bet]. If these were, the port set should take the negated offsets, so that both
  engines run the same sequence going ahead. The present `[0, 180, 90, 270]` already has the same reversal; nobody
  can see it.
- **`ENGINE.rod`: keep 4.5 cranks [bet].** No source gives the length. 4.5 x 37.5 in = 168.75 in = 4.286 m [derived],
  inside the period examples (3.5 to 5).
- **`ENGINE.pitch`: keep 4.4 m, even [bet].** The couple check (row 8) suggests a wider gap between the HP and the IP
  than between each LP and its neighbour. On the drawing's 13.2 m span that would be about 4.06, 5.08 and 4.06 m
  [derived]. It rests on assumed weights, so it is not adopted.
- **V8's done-when** ("the balanced engines' crank angles from a source") is met at medium confidence by one source.
  The rod's bet stands, with the search recorded here.

## 4. Search log

| Item | What was tried | Result |
|---|---|---|
| R2 | Searches: wing propellers' distance forward of the centre propeller or the rudder; the wreck's propellers; frame and sterntube positions; TRMA and model plans | Nothing with a station. Opened: Roy Mengot's stern analysis (wormstedt.com, no positions); Currell's Olympic machinery pages (no dimensions); The Shipbuilder's hull and engine pages on GG Archives (captions, no stations); Halpern (above). Refused: Encyclopedia Titanica threads 17356 and 38577, Patreon. One GG Archives JPEG came back unreadable |
| R3 | Searches for Fuehrer and Römisch, Hamill, Blaauw and van de Kaa, PIANC 2015, the German and Dutch methods | Read: Kadir et al. 2024 (rhhz.net, HTML). Unreadable PDFs: Hamill and Kee 2016 (QUB), an ICCE paper (scanned). Refused: MDPI (J. Mar. Sci. Eng. 8(12) 1025), E3S, ScienceDirect topics; Springer asked for a login. The EFDC+ propwash page (eemodelingsystem.com) names Fuehrer and Römisch (1977) for the efflux and Hamill for the profiles, without equations |
| V8 | Searches for the crank angles, Yarrow-Schlick-Tweedy, rod length, the Workshop Manual | Read: Halpern's "Prime Mover" (angles), Britannica 1911 "Steam Engine" sections 83 to 86, The Shipbuilder's engine page, TRMA's "Titanic's Engine Rooms" (no angles or rods). Refused: Encyclopedia Titanica |

WebFetch kept its own copies of the three binary files it could not read (two PDFs, one JPEG) in the session's
tool-results folder. They were not opened.
