# RESEARCH: Titanic midship scantlings for the Smith model, v1

- **Written:** 2026-11-19. Date only; no clock was read, so there is no time of day.
- **By:** a research subagent of the hull-girder session (worktree `b1b2-strength`), Claude Opus 5.5.
- **Method:** WebSearch and WebFetch only. No downloads on purpose, and no local file touched except this note.
  - WebFetch answers are a small model's digest of the page. For key figures I re-fetched and asked for the sentences verbatim.
  - Tags:
    - **[read]** I opened the page and saw the figure (verbatim where it matters).
    - **[search summary]** The figure appeared only in a search-engine digest of a page I could not open, or in a secondary paraphrase.
    - **[derived]** My arithmetic, shown.
    - **[bet]** My judgement, with no source.
  - Conversions: 1 in = 25.4 mm; 1 long ton/in² = 15.444 MPa; 1 ft·LT = 3,037 N·m; 1 in³ = 1.6387e-5 m³; 1 in⁴ = 4.1623e-7 m⁴.
- **Sites refused or unreadable:**
  - encyclopedia-titanica.org: HTTP 403 on every forum thread, article and attachment, including "Building of the Hulls" (The Shipbuilder's full structure text) and the Stettler-Thomas and Halpern PDFs.
  - tandfonline.com (Paik et al. 2025 full text): 403.
  - ucl.ac.uk and discovery.ucl.ac.uk: 403.
  - usni.org (1996 Naval History article on Hackett and Bedford): 403.
  - titanicconnections.com: HTTP 500 on every page.
  - gutenberg.org: 503. Walker 1912 was read instead on the PGLAF mirror, aleph.pglaf.org.
  - titanic-theshipmagnificent.com: DNS failure.
  - Scribd (1914 *Engineering* article on Britannic): no body returned.
  - **PDFs:** WebFetch returned raw binary, not text, for the MFP breakup paper (wormstedt.com and trmaarchive.com copies) and for Mengot's "Designing of Titanic". The tool saved those bytes under the session's `.claude\projects\...\tool-results` folder. **They were not opened**, per the brief. Everything credited below to the MFP paper therefore comes from search digests.

## Summary (10 lines)
1. **Decks:** only B deck has a figure. Its plating tapers to 3/4 in, with a 1-in plate down each side of the funnel uptakes. Its stringer strake is doubled 1-in plate, tied to the doubled 1-in sheer strake by a 0.9-in angle (Mengot).
2. **C deck** was "specially heavy" and doubled (Walker 1912; *The Shipbuilder*), but no thickness is given. **No open source gives a thickness for D, E, F or G deck.**
3. **Deck extent amidships:** B deck runs 550 ft amidships; C to F run the full length. G deck is only a side shelf beside the machinery, and the orlop is absent there. Mengot says the decks below B are "not continuously riveted" (attached by brackets at each frame).
4. **Bottom:**
   - Keel: 1½-in plate plus a 19½ × 3 in bar. Floors: 15/20 in, tapering to 11/20 in.
   - Tank top: about half the 1-in shell (Mengot), but 0.75 in in the MFP finite-element model.
   - Watertight centre keelson over 670 ft (bulkheads B to O). Five intercostal side girders each side (Halpern), or four (*Anatomy of the Titanic*). Watertight wing longitudinals about 30 ft off the centreline for 447 ft (bulkheads D to M).
   - No girder or margin-plate thickness was found.
5. **Above the bottom:** B to E decks carried four lines of longitudinal girders on round pillars at every third beam (9 ft). Beams and frames were 10-in channels. There were no longitudinal bulkheads (Wilding).
6. **Openings at launch:** 20 × 45 ft uptake holes, a T-shaped 42 × 38 ft engine hole (closed down to 24 × 20) and a 25 × 48 ft turbine hole (closed down to 18 × 20). Funnels 1 to 3 stand over bulkheads E, G and J, about 247, 361 and 478 ft from the FP (derived).
7. **Stairs:** the forward staircase is 16 ft wide, runs from the boat deck to E deck, and has the elevators at about frame 43F. The aft staircase serves A to C decks only, between funnels 3 and 4. The aft joint at 28A (about 508 ft) falls in that span, but no source ties the two together.
8. **Archer's 1912 check:** M = W·L/30, giving 9.9 tons/in² at the B-deck sheer strake. That implies Z ≈ 1.79e6 in³, within 4 % of the MFP's 1.86e6.
9. **MFP stresses:** 22 ksi at B deck and 18.4 ksi at the keel. These imply M ≈ 1.52e6 ft·ton and I ≈ 8.9e8 in⁴ (369 m⁴).
10. **Riveting:** bottom seams double-riveted laps; bottom butts lapped and quadruple-riveted; topside seams treble or quadruple; topside and doubling butts double-strapped. The MFP gives joint efficiencies of 28 % for double and 42 % for triple riveting (search digests).

---

## 1. Deck plating, stringers and doublings

| Figure | Value | SI | Where along her | Source (author, title, URL) | Tag |
|---|---|---|---|---|---|
| Strength deck | B (bridge) deck is the strength deck, the top of the structural hull | — | amidships, the 550-ft bridge deck | Mengot, "Breakup" page, https://wormstedt.com/RoyMengot/TitanicWreck/BREAKUP/Breakup.html ; Mengot, "A Map of the Sections in the Tear Area", https://wormstedt.com/RoyMengot/TitanicWreck/BREAKUP/Center%20Map.html | [read] |
| B and C together | Mengot calls both "B&C decks are the strength decks" taking the tension | — | amidships | Mengot, "Titanic's Blueprints", https://wormstedt.com/RoyMengot/TitanicWreck/TRMA/Titanic%27s%20Blueprints%20[Roy%20Mengot]%20db-09.html | [read] |
| B-deck plating | tapers to 3/4 in, with a 1-in plate down each side of each funnel uptake | 19.05 mm; 25.4 mm | amidships; the taper toward the ends is not located by frame | Mengot, "Breakup" (URL above) | [read] |
| B and C heavy strakes | both decks have a heavier strake alongside the funnel uptakes, thickening toward the side; no figure for C | — | alongside the uptakes | Mengot, "Titanic's Blueprints" (URL above) | [read] |
| B-deck stringer strake | doubled, two 1-in plates | 2 × 25.4 mm | amidships; length not stated | Mengot, "Titanic's Blueprints" | [read] |
| B-deck stringer | the stringer (edge) plate of B deck is doubled; the doubling is hydraulic-riveted | — | — | British Wreck Commissioner's Report, "Structure", https://www.titanicinquiry.org/BOTInq/BOTReport/botRepStructure.php ; GG Archives "Structure", https://www.ggarchives.com/OT/Titanic/01-PlanningBuildingLaunching/Structure.html | [read] |
| B-deck stringer (1915) | Wilding: "the bridge deck stringers being doubled" | — | — | Wilding, Limitation of Liability deposition, https://www.titanicinquiry.org/lol/depositions/wilding01.php | [read] |
| Stringer-to-sheer-strake connection | a 0.9-in angle joins the doubled B-deck stringer to the doubled sheer strake, giving about 3 in of steel at the top edge | 22.9 mm angle; about 76 mm | amidships | Mengot, "Titanic's Blueprints" | [read] |
| B-deck stringer width | **not found** | — | — | — | — |
| B and C deck plating, *Shipbuilder* account | "specially heavy" steel decks on bridge (B) and shelter (C), with the plating of both doubled; no figures | — | amidships | J. B. Walker, *An Unsinkable Titanic* (1912), ch. VI, https://aleph.pglaf.org/4/6/2/1/46219/46219-h/46219-h.htm | [read] |
| Upper-flange design intent | bridge and shelter deck plating and sheer strakes made very thick, with doublings at those points; lower flange stiffened by doubled bilge plating | — | amidships | *The Shipbuilder* (1911), quoted in M. Chirnside, "The Olympic Class's Expansion Joints", https://trmaarchive.com/articles/markchirnside3/index.shtml ; and on Encyclopedia Titanica, "Building of the Hulls" (403 to me) | [read] (Chirnside) / [search summary] (ET) |
| B-deck length | about 550 ft amidships, with a 125-ft forecastle and a 105-ft poop | 167.6 m | amidships | BWC Report, description of the ship, https://www.titanicinquiry.org/BOTInq/BOTReport/botRepTitanic.php | [read] |
| Continuous decks | C, D, E and F run end to end | — | full length | BWC Report (URL above) | [read] |
| Continuous decks (Wilding) | "5 continuous decks", C to G; G "continuous fore and aft" | — | — | Wilding deposition (URL above) | [read] |
| G deck and orlop extent | each about 190 ft forward of the boilers and 210 ft aft of the machinery, so absent over the machinery spaces | — | ends only | BWC Report (URL above) | [read] |
| G deck amidships | only a narrow shelf around the machinery spaces | — | boiler and engine rooms | Mengot, "Center Map" (URL above) | [read] |
| All decks | steel-plated throughout; no thicknesses given | — | — | BWC Report, "Structure" (URL above) | [read] |
| Lower decks' connection | "Decks below that are not continuously riveted"; Mengot says they are attached by brackets at each frame (matters for their effectiveness in the section) | — | below B deck | Mengot, "Breakup" (URL above) | [read] |
| C, D, E, F and G plating thickness | **not found in any open source** | — | — | — | — |
| Wood sheathing | planking laid fore and aft and bolted to the steel deck. Forum claim of 3-in pine and teak; the steel under it was guessed at "about 1/2 in" (a guess, not a source). | — | passenger decks | ET forum "Thickness of Deck Floors…" via search digest | [search summary] |
| Deck camber | 3 in on all decks | 76.2 mm | — | Mengot, "Titanic's Blueprints" | [read] |
| A and boat decks; superstructure sides | "comparatively light scantling" (BWC Report); 1/4-in plate on light studs at 4.5-ft centres (Mengot) | 6.35 mm; 1.37 m | above B deck | BWC Report "Structure"; Mengot "Breakup" and "Blueprints" | [read] |

## 2. Inner bottom, keel and double-bottom longitudinals

| Figure | Value | SI | Where along her | Source (author, title, URL) | Tag |
|---|---|---|---|---|---|
| Keel plate | a single thickness of plating, 1½ in | 38.1 mm | the length of the keel (taper not stated) | Walker 1912, ch. VI (URL above); same words in *The Shipbuilder* via ET, "Building of the Hulls" | [read] / [search summary] |
| Keel bar | flat bar 19½ in wide by 3 in thick (already known; confirmed) | 495 × 76 mm | — | Walker 1912 | [read] |
| Keel plate (variant) | an ET forum post cites *The Shipbuilder* as 1¼ in | 31.75 mm | — | ET forum, via search digest | [search summary] |
| A strake (plates over the keel bar) | 30/20 in, narrowing to 24/20 in | 38.1 → 30.5 mm | amidships → ends | J. K. Layton (Atlantic Liners), "Titanic FAQs: Penny-Pinching…", https://atlanticliners.com/white_star_home/titanic_home/titanic-faqs-penny-pinching-cut-corners-shoddy-ships/ | [read] |
| Keel plate doubled? | Wilding lists the keel plate with the doubled items. This contradicts Walker's "single thickness"; unresolved. | — | — | Wilding deposition (URL above) | [read] |
| Bottom shell amidships | 1 in ("the outer 1" shell plate") | 25.4 mm | amidships | Mengot, "Center Map" | [read] |
| Hull plates, range | 1 to 1.5 in thick; plates mostly 6 ft × 30 ft | 25.4–38.1 mm | — | Wikipedia "RMS Titanic", citing Hutchings and de Kerbrech 2011 p. 44, https://en.wikipedia.org/wiki/RMS_Titanic | [read] |
| Bilge strake | doubled | — | amidships | Wilding deposition; Walker 1912 ("doubling of the plating at the bilges") | [read] |
| Bilge plating | over 1 in thick for 2/5 of her length | >25.4 mm; about 340 ft (104 m) [derived: 0.4 × 850] | amidships | Layton, Atlantic Liners FAQ (URL above) | [read] |
| Tank top, Mengot | "the Tank Top, which was about half as thick" as the 1-in shell, so about 0.5 in | about 12.7 mm [derived] | amidships | Mengot, "Center Map" | [read] |
| Tank top, MFP model | 0.75 in for the tank-top plates and 1 in for all other plates, in the MFP double-bottom finite-element model (a model input, not a stated as-built value) | 19.05 mm | model section | Mengot and Woytowich 2010, MFP paper (PDF not readable; search digest) | [search summary] |
| Tank top, 1914 *Engineering* on Britannic | "only slightly less" in thickness than a neighbouring member; figures lost in the OCR | — | — | Scribd "1914 – Britannic" (no body returned), via search digest | [search summary] |
| "Inner skin 1.25 in" | Wikipedia's Olympic-class page has an unsourced line on a 1.25-in "inner skin above the keel"; likely the keel plate misdescribed. **Do not use.** | 31.75 mm | — | https://en.wikipedia.org/wiki/Olympic-class_ocean_liner | [read] (unsourced) |
| Centre keelson (vertical keel) | watertight, 670 ft long, from bulkhead B to bulkhead O; 63 in high at the centreline, 78 in under the reciprocating engine room | 204.2 m; 1.60 m / 1.98 m | bulkhead B (91 ft) to O (757 ft) [derived from the BWC table, §4] | S. Halpern, "Titanic's Hidden Deck" (ET 2005), reposted at https://hercolano2.blogspot.com/2012/04/titanic-double-bottom.html | [read] |
| Centre keelson thickness | **not found.** The 1914 *Engineering* Britannic text gives the "vertical plate… in. thick" with the value lost in the OCR. | — | — | search digest | — |
| Double-bottom depth, under the engines | 63 in generally. Under the reciprocating engines: 78 in (BWC Report; Halpern), "6 feet 6" (Wilding 1915), 6 ft 3 in (Walker 1912), 75 in (Mengot). Sources split 78 against 75. | 1.60 m; 1.98 or 1.905 m | engine room; Mengot puts the change at frame 25A | Wilding deposition; Walker 1912; Mengot "Breakup" | [read] |
| Side girders | "five intercoastal tank girders amidships on each side of the center"; additional girders under the engine rooms; some "continuous tank girders" also mentioned | — | amidships | Halpern (URL above) | [read] |
| Side girders (variant) | four longitudinal girders each side between keel and margin plate; the MFP counted those four in its midship section | — | — | *Anatomy of the Titanic*, via ET forum "Longitudinal Girders" (403); MFP paper, via search digest | [search summary] |
| Side girder thickness and spacing | **not found** | — | — | — | — |
| Wing (margin) longitudinals | two watertight longitudinals about 30 ft from the centreline, 447 ft long, bulkhead D to M; the double bottom meets the shell over those 447 ft | 9.14 m off the centreline; 136.2 m | bulkhead D (193 ft) to M (640 ft) [derived, §4] | Halpern (URL above) | [read] |
| Double-bottom subdivision | 46 compartments (44 plus the peaks), divided at the centreline and "out at the wings"; double bottom carried "to the top of the curve of the bilge" | — | — | Wilding deposition | [read] |
| Margin plate | continuous, out to the shell. Forward of bulkhead D the tank top stops short of the shell. Aft of D the margin plates drop nearly vertically to the bottom shell. | — | D to M full; narrower fore and aft | Halpern (URL above) [read]; Halpern, "The Grounding of Titanic" (ET, via search digest) | [read] / [search summary] |
| Margin plate thickness | **not found** | — | — | — | — |
| Tank-top width | full width from the dynamo room to No. 6 boiler room; a narrower wedge fore and aft | — | dynamo room to BR 6 | Mengot, "Titanic's Blueprints" | [read] |
| Floors | at every frame; 15/20 in, reducing to 11/20 in toward the ends; heavier and closer under the engines | 19.05 → 13.97 mm | amidships → ends | *Titanic: The Ship Magnificent* vol. 1, quoted in ET forum (search digest); BWC Report (floor at every frame) | [search summary] / [read] |
| Coal-bunker walls | 0.30 in and thicker going down, from the tank top to F deck. These are **transverse** walls, not longitudinal members. | 7.6 mm | boiler rooms | Mengot, "Center Map" | [read] |

## 3. Deck girders, pillars, frames and longitudinal bulkheads

| Figure | Value | SI | Where along her | Source (author, title, URL) | Tag |
|---|---|---|---|---|---|
| Deck girders | "four lines of heavy longitudinal girders, worked in between the beams" on the bridge, shelter, saloon and upper decks (B, C, D, E); no sizes | — | amidships | Walker 1912, ch. VI (URL above) | [read] |
| Pillars | solid round pillars at every third deck beam; in the boiler rooms below F deck, heavy round pillars carry the decks down to the double bottom | 9 ft = 2.74 m [derived: beams on every 3-ft frame] | amidships | Walker 1912 | [read] |
| Pillars (*Shipbuilder*) | deck beams amidships carried by longitudinal girders on round pillars about 9 ft apart | 2.74 m | amidships | ET "Building of the Hulls", via search digest | [search summary] |
| Beams | channel section 10 in deep through the middle of the ship, on every frame at all decks | 254 mm | amidships | Walker 1912; BWC Report "Structure" (beams on every frame) | [read] |
| Beams (variant) | 9-in channel from B deck down, 10 in in the hold spaces | 229 / 254 mm | — | *Titanic: The Ship Magnificent*, via ET forum (search digest) | [search summary] |
| Frames | 10-in channels at 3 ft, from the double bottom to the bridge deck | 254 mm at 914 mm | amidships | Walker 1912 | [read] |
| Web frames | 2½ ft deep at 9 ft in the boiler rooms; deep frames on every second frame (6 ft) in the engine and turbine rooms; up to F (middle) deck | 762 mm deep; 2.74 m / 1.83 m | machinery spaces | Walker 1912 | [read] |
| Longitudinal bulkheads | none. Asked "The Titanic had no longitudinal bulkheads?", Wilding answered "No." | — | — | Wilding deposition, https://www.titanicinquiry.org/lol/depositions/wilding03.php | [read] |
| Olympic after 1912 (**not Titanic**) | inner skin of about 1/2-in plate from the tank top to F deck, 30–36 in inboard of the shell | 12.7 mm | Olympic's machinery spaces only | S. Halpern, "Modifications to Olympic…", https://www.titanicology.com/Modifications_To_Olympic.html | [read] |
| Girder and pillar scantlings | **not found** (the NMNI catalogue lists "Girders under saloon deck" and similar drawings, not their figures) | — | — | — | — |

## 4. Openings through the decks, staircases, elevators and funnels
(Item 4 plus the coordinator's addition of the staircases, light wells, elevators and funnel positions.)

**Bulkhead positions used below.** These are cumulative sums of the BWC Report's compartment table, https://www.titanicinquiry.org/BOTInq/BOTReport/botRepWC.php [read]. The lengths are: Bow–A 46, A–B 45, B–C 51, C–D 51, D–E 54, E–F 57, F–G 57, G–H 57, H–J 60, J–K 36, K–L 69, L–M 57, M–N 63, N–O 54, O–P 57, P–stern 36 ft (sum 850 = LBP).

That gives, in feet from the forward perpendicular [derived]:

| Bulkhead | A | B | C | D | E | F | G | H | J | K | L | M | N | O | P |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ft from FP | 46 | 91 | 142 | 193 | 247 | 304 | 361 | 418 | 478 | 514 | 583 | 640 | 703 | 757 | 814 |

Checks:
- The BWC Report puts K "90 ft. abaft amidships", so amidships is at 424 ft [read].
- An ET door table (search digest) puts D at frame 78F, 192 ft.

Frame to feet: about 424 ∓ 3n ft, valid amidships where frames are 36 in [derived].

| Figure | Value | SI | Where along her | Source (author, title, URL) | Tag |
|---|---|---|---|---|---|
| General | "All the decks had large openings or hatchways in them in each compartment" | — | every compartment | BWC Report, description of the ship (URL §1) | [read] |
| Boiler uptakes at launch | holes 20 × 45 ft for the uptakes of "the first three boiler rooms" (which three, and which way is across, not stated); "through the decks" | 6.10 × 13.72 m | boiler rooms | Mengot, "Titanic's Blueprints" | [read] |
| Reciprocating engine opening at launch | T-shaped, 42 ft long × 38 ft wide, through the decks; afterwards filled in to 24 × 20 ft under the boat-deck tank room | 12.80 × 11.58 m → 7.32 × 6.10 m | K–L, 514–583 ft | Mengot, "Titanic's Blueprints" | [read] |
| Turbine opening at launch | 25 × 48 ft, offset to starboard; filled in to 18 × 20 ft for No. 4 funnel's uptake | 7.62 × 14.63 m → 5.49 × 6.10 m | L–M, 583–640 ft | Mengot, "Titanic's Blueprints" | [read] |
| No. 3 uptake in the wreck | left uniform 6-ft notches in B, C and D decks; B deck broke "around the honeycomb of vent trunks" | 1.83 m | near J (478 ft) | Mengot, "Center Map" | [read] |
| Expansion joint at B deck | "no construct at all on B-deck itself" (a corridor); the joints "go down to the strong deck" (Wilding) | — | 49F and 28A | Mengot, "Center Map"; Wilding, BWC Inquiry Q20922, https://www.titanicinquiry.org/BOTInq/BOTInq20Wilding02.php | [read] |
| Expansion joints and funnels | forward joint just abaft funnel 1, at frame 49F; aft joint between funnels 3 and 4, at 28A | 49F ≈ 277 ft (84 m); 28A ≈ 508 ft (155 m) [derived] | — | Titanic Connections (500 to me), via search digest | [search summary] |
| Funnels 1–3: what they serve | each funnel's uptakes merge "immediately above the watertight bulkheads": E (funnel 1, BR 6 and 5), G (funnel 2, BR 4 and 3), J (funnel 3, BR 2 and 1); funnel 4 is a ventilator over the turbine room | — | — | S. Halpern, "Titanic's Propulsion Plant", https://www.titanicology.com/Titanica/TitanicsPrimeMover.htm | [read] |
| Funnel positions | funnel 1 ≈ 247 ft (≈ frame 59F); funnel 2 ≈ 361 ft (≈ 21F); funnel 3 ≈ 478 ft (≈ 18A); spacing 114 and 117 ft. Rake may put the base on the boat deck a little aft of each bulkhead. | 75.3, 110.0, 145.7 m | — | bulkhead table + Halpern [derived] | [derived] |
| Funnel 4 position | over the turbine room, 583–640 ft; equal spacing would put it about 595 ft | 181 m | — | Halpern [read] + equal spacing [bet] | [bet] |
| Funnel section | elliptical, 24 ft 6 in × 19 ft 0 in, about 70 ft above the casing | 7.47 × 5.79 m | — | Halpern, "Titanic's Propulsion Plant" | [read] |
| Funnel casing size at B and C decks | **not found** (only the launch holes and the 6-ft notch above) | — | — | — | — |
| Forward grand staircase | 1911 brochure: "sixteen feet wide, extends over sixty feet and serves seven decks". Elsewhere (unfootnoted): 20 ft wide, projecting 17 ft from the bulkhead. Boat-deck entrance room 56 ft wide × 33 ft long (Beveridge 2009 p. 202). | 4.88 m (or 6.10 m); room 17.07 × 10.06 m | between funnels 1 and 2 | Wikipedia "Grand Staircase of the Titanic", https://en.wikipedia.org/wiki/Grand_Staircase_of_the_Titanic | [read] |
| Forward staircase: decks pierced | seven levels from the boat deck to E deck (so it pierces A, B, C, D and E); a single flight on to F deck; dome over the A-deck level | — | — | Wikipedia (URL above) | [read] |
| Forward staircase (TTSM) | about 20 ft wide overall; bottom tread 18 ft 9 in; penetrates 57 ft from A deck to F deck | 6.10 m; 5.72 m; 17.37 m | — | *Titanic: The Ship Magnificent*, via ET forum (search digest) | [search summary] |
| First-class elevators | three, just forward of the forward staircase, A to E decks | — | doors at frame 43F (TTSM via forum) ≈ 295 ft [derived], just forward of bulkhead F (304 ft) | Wikipedia [read]; frame from ET forum digest | [read] / [search summary] |
| Forward staircase position | forward end about 42–43F (≈ 295–298 ft), running aft about 33 ft at boat-deck level, so roughly 295–330 ft | ≈ 90–101 m | over BR 5 and 4 | elevator frame + room length | [derived] |
| Aft grand staircase | between funnels 3 and 4; "much smaller"; A, B and C decks only; "at or just aft of the point of rupture" | — | between 478 and about 595 ft | Wikipedia (URL above) | [read] |
| Aft staircase and the 28A joint | forum: on the aft wall of the reciprocating-engine vent shaft. Joint 28A ≈ 508 ft lies inside the stair's funnel 3–4 span, but **no source I could open places the stair across the joint.** | — | — | ET forum via search digest; position [derived] | [search summary] |
| Hatches | No. 3 cargo hatch (the "bunker hatch"); 5-ft-square E-deck trap doors for shipping furnaces; **no hatch dimensions found** | 1.52 m | — | Mengot, "Titanic's Blueprints" | [read] |
| Light wells; 2nd-class elevator; staircase well openings per deck | **not found** | — | — | — | — |

## 5. Hull-girder strength in the record

| Figure | Value | SI | Where along her | Source (author, title, URL) | Tag |
|---|---|---|---|---|---|
| Board of Trade check (Archer, 1912) | bending moment taken as displacement × length / 30, displacement "about 52,000 tons", inputs from "the drawings of the Titanic" | — | midship section | W. D. Archer, BWC Inquiry Q24323–24324, Q24352, https://www.titanicinquiry.org/BOTInq/BOTInq25Archer02.php , …Archer03.php | [read] |
| Archer's stress | "a figure of 9.9 tons per square inch on the shear strake" of the bridge (B) deck, against 12.2 tons/in² for a Lloyd's-rule comparison ship | 152.9 MPa; 188.4 MPa | B-deck sheer strake | Archer Q24356 (Archer03 URL) | [read] |
| Archer's moment and modulus | M = 52,000 × 850 / 30 = 1.47e6 ft·LT. Z = M/σ = 1.47e6 × 12 / 9.9 = **1.79e6 in³**, 4 % under the MFP's 1.86e6. With L = 882.75 ft overall, Z = 1.85e6 in³. 9.9 t/in² = 22.2 ksi, close to the MFP's 22 ksi. | 4.47 GN·m; 29.3 m³ (30.4 m³) | midship | Archer + arithmetic | [derived] |
| Wilding on the joints | "the expansion joints go down to the strong deck", to spare the light upper plating from the stresses | — | — | Wilding, BWC Q20922 (URL §4) | [read] |
| Wilding on design stresses | strength provisions were chiefly the doubling of the plating for longitudinal strength; the designers had "a pretty good idea" of the stresses | — | — | Wilding depositions, https://www.titanicinquiry.org/lol/depositions/wilding02.php , …wilding05.php | [read] |
| MFP 2010 section | Sandiford's simplified midship section (reproduced in Garzke and Woodward), modified to include all double-bottom longitudinals; NA 398 in; Z 1.86e6 (top) and 2.23e6 (keel) | 10.11 m; 30.5 / 36.5 m³ | midship | Mengot and Woytowich, "The Breakup of Titanic", *Marine Technology* 47(1), 2010, https://trmaarchive.com/articles/breakup/MFPBreakupPaper.pdf (binary to me) | [search summary] |
| MFP stresses | 22 ksi tension at B deck and 18.4 ksi compression at the keel, on Bedford and Hackett's flooded loads; maximum moment inside BR 2 | 151.7 / 126.9 MPa | BR 2 (418–478 ft) | MFP paper, via search digest | [search summary] |
| MFP implied moment and inertia | M = 22,000 × 1.86e6 = 4.09e10 lbf·in = **1.52e6 ft·LT** (the keel check gives 4.10e10). I = 2.23e6 × 398 = **8.88e8 in⁴**. Deck height y_B = 398 + 8.88e8 / 1.86e6 = 875 in (72.9 ft), against B deck at 73.75 ft. | 4.62 GN·m; 369 m⁴ | midship | arithmetic | [derived] |
| Stettler and Thomas 2013 | MAESTRO full-ship model; section modulus from ALPS/HULL; maximum moment about 1,780,000 ft·ton at frame 10A (BR 2); maximum stress 32.0 ksi tension in the bridge deck at frame 15A | 5.41 GN·m; 220.6 MPa | 10A ≈ 454 ft; 15A ≈ 469 ft [derived] | "Flooding and structural forensic analysis of the sinking of the RMS Titanic", *Ships and Offshore Structures* (2013), via search digests (ET PDF refused) | [search summary] |
| S&T consistency | 1.78e6 ft·LT ÷ 32 ksi gives Z ≈ 1.50e6 in³ — **20 % under the MFP's.** Either another section or another moment applies at 15A; do not mix them. | 24.5 m³ | — | arithmetic | [derived] |
| Hackett and Bedford 1996 | initial break in B deck between the compass-platform support and funnel 3, around the end of the second expansion joint | — | near 28A | RINA Transactions 1996, as reported by *Naval History* (Oct 1996), via search digest | [search summary] |
| Paik, Kim and Thomas 2025 | LS-DYNA, CFD and MAESTRO-ALPS (Smith-type) collapse, using H&W plate and butt-joint scantlings. Failure starts at the aft expansion joint, where the hogging moment reaches ultimate at about 158 min. A riveted hull has about 62.5–65.6 % of the welded hull's ultimate hogging strength. **No ultimate-moment value retrieved.** | — | aft joint, 28A | *Ships and Offshore Structures* 21(1), doi 10.1080/17445302.2025.2603417 (403), via search digests | [search summary] |
| Mengot | break centred at frame 25A, where the double bottom deepens; Gibbs & Cox's model shows extreme tension over funnel 3 and compression in the engine room | — | 25A ≈ 499 ft [derived] | Mengot, "Breakup" | [read] |
| Garzke et al. 1997 | MFP SD-7 "Titanic, the Anatomy of a Disaster"; **no section figures retrieved** | — | — | NIST catalogue entry (search digest) | [search summary] |

## 6. Riveted joints

| Figure | Value | SI | Where along her | Source (author, title, URL) | Tag |
|---|---|---|---|---|---|
| Bottom-shell seams | double-riveted (laps) | — | bottom | *The Shipbuilder* (1911), ET "Building of the Hulls", via search digest | [search summary] |
| Topside seams | treble- and quadruple-riveted | — | sides | same | [search summary] |
| Bottom-shell butts | overlapped, quadruple-riveted | — | bottom | same | [search summary] |
| Topside and doubling butts | double butt straps | — | sides, sheer strake, doublings | same | [search summary] |
| MFP account | bottom landings double-riveted; butts triple-riveted in the tank top and quadruple in the bottom shell; bottom butts are "butt laps"; efficiency (gross area) 28 % double, 42 % triple (quadruple cut off) | — | double bottom | MFP paper, via search digest | [search summary] |
| Sheer strake | two layers of 1-in plate with "octagonal" triple plates at the butts, heavily riveted (MFP); "diamond-shaped" butt straps (A Quiet Sea) | 2 × 25.4 mm | top 100 in, amidships | MFP and aquietsea.org PDF, via search digests | [search summary] |
| Hydraulic riveting | nearly all the double bottom, the bottom shell to the turn of the bilge, the topside shell, stringer plates and doublings | — | — | *The Shipbuilder*, GG Archives, https://www.ggarchives.com/OceanTravel/Titanic/25-ImageLibrary/TheShipbuilder-03-BuildingTheHulls.html | [read] |
| Rivet counts and size | about half a million in the double bottom (about 270 tons); about 3 million in all (about 1,200 tons); largest 1¼ in | 31.75 mm | — | same | [read] |
| Steel against iron | steel rivets, hydraulically closed, in the middle three-fifths; wrought-iron rivets driven by hand in the bow and stern fifths. A secondary account says triple-riveted (steel) amidships and double (iron) at the ends, which conflicts with the bottom seams being double-riveted. | — | middle 3/5 against the ends | Foecke and McCarty (NIST), via search digests; *Materials Today* (search digest) | [search summary] |
| B-deck butts and seams; rivet pitch and diameter by region | **not found** | — | — | — | — |

---

## NOT FOUND
1. **Plate thickness of C, D, E, F and G decks amidships**, and the width and thickness of each deck's stringer plate (B included), in any source I could open. The figures sit on the H&W midship section (NMNI digitised plans), in *Titanic: The Ship Magnificent* vol. 1, and probably in Paik et al. 2025, all closed to me.
2. **Tank-top thickness as built**: only "about half the shell" (Mengot) and a 0.75-in model input. Also missing: margin-plate thickness, centre-keelson thickness, side-girder thickness and transverse spacing, and the flat keel plate's width.
3. Deck-girder and pillar scantlings (only "four lines" and "every third beam").
4. Opening sizes per deck: casing widths and lengths at B and C for boiler rooms 1–6, the funnel casings through B and C, cargo-hatch sizes, grand-staircase well openings per deck, and light wells. Also the second-class elevator, and confirmation that the aft staircase straddles the 28A joint.
5. Exact funnel positions in frames (only derived, ±10–20 ft); which three boiler rooms had the 20 × 45 ft launch openings.
6. An ultimate hogging or sagging moment from any paper (Paik 2025, Stettler and Thomas 2013), and Stettler and Thomas's section properties.
7. Rivet pitch and diameter by region, butt-strap dimensions, and the B-deck butts and seams.
8. Readable text of the MFP paper itself. Its binary PDF was saved by WebFetch but not opened; a person could read it at the trmaarchive.com URL.

## Sources
- British Wreck Commissioner's Report (1912), "Structure", "Watertight Compartments" and "Description of the ship": https://www.titanicinquiry.org/BOTInq/BOTReport/botRepStructure.php ; …/botRepWC.php ; …/botRepTitanic.php
- W. D. Archer, BWC Inquiry day 25: https://www.titanicinquiry.org/BOTInq/BOTInq25Archer02.php ; …/BOTInq25Archer03.php
- E. Wilding, BWC Inquiry days 19–20: https://www.titanicinquiry.org/BOTInq/BOTInq19Wilding06.php ; …/BOTInq20Wilding02.php ; …/BOTInq20Wilding03.php
- E. Wilding, Limitation of Liability depositions (1915): https://www.titanicinquiry.org/lol/depositions/wilding01.php , wilding02, wilding03, wilding05, wilding06, wilding07
- J. Bernard Walker, *An Unsinkable Titanic* (1912), ch. VI, PGLAF mirror of Project Gutenberg #46219: https://aleph.pglaf.org/4/6/2/1/46219/46219-h/46219-h.htm
- *The Shipbuilder* (1911), "Building the Hulls", GG Archives: https://www.ggarchives.com/OceanTravel/Titanic/25-ImageLibrary/TheShipbuilder-03-BuildingTheHulls.html ; GG "Structure": https://www.ggarchives.com/OT/Titanic/01-PlanningBuildingLaunching/Structure.html ; ET "Building of the Hulls" (403): https://www.encyclopedia-titanica.org/building-of-the-hulls.html
- R. Mengot, "Breakup": https://wormstedt.com/RoyMengot/TitanicWreck/BREAKUP/Breakup.html ; "A Map of the Sections in the Tear Area": https://wormstedt.com/RoyMengot/TitanicWreck/BREAKUP/Center%20Map.html ; "Titanic's Blueprints": https://wormstedt.com/RoyMengot/TitanicWreck/TRMA/Titanic%27s%20Blueprints%20[Roy%20Mengot]%20db-09.html
- R. Mengot and R. Woytowich, "The Breakup of Titanic: A Progress Report from the Marine Forensics Panel (SD-7)", *Marine Technology* 47(1), 2010: https://trmaarchive.com/articles/breakup/MFPBreakupPaper.pdf (also http://www.titanicmodel.net/uploads/4/1/6/0/41607523/mfp_breakup_paper.pdf); search digests only
- S. Halpern, "Titanic's Hidden Deck" (ET 2005), repost: https://hercolano2.blogspot.com/2012/04/titanic-double-bottom.html ; "Titanic's Propulsion Plant": https://www.titanicology.com/Titanica/TitanicsPrimeMover.htm ; "Modifications to Olympic": https://www.titanicology.com/Modifications_To_Olympic.html
- M. Chirnside, "The Olympic Class's Expansion Joints" (TRMA): https://trmaarchive.com/articles/markchirnside3/index.shtml ; "FAQ: Were Olympic, Titanic & Britannic Built to the Same Standard of Strength?": https://markchirnside.co.uk/faq-were-olympic-titanic-britannic-built-to-the-same-strength/
- J. K. Layton, Atlantic Liners, "Titanic FAQs: Penny-Pinching, Cut Corners, & Shoddy Ships?": https://atlanticliners.com/white_star_home/titanic_home/titanic-faqs-penny-pinching-cut-corners-shoddy-ships/
- TRMA, "Basic Titanic Info": https://www.trmaarchive.com/basic_measurements.shtml ; TRMA Tech Feature June 2005: https://trmaarchive.com/articles/tech/TechFeatureJune2005.htm
- Wikipedia: "RMS Titanic", "Olympic-class ocean liner", "Grand Staircase of the Titanic" (en.wikipedia.org)
- J. K. Paik, H. J. Kim, B. Thomas, "The digital reconstruction and resurrection of the RMS Titanic's sinking", *Ships and Offshore Structures* 21(1), doi 10.1080/17445302.2025.2603417 (403; search digests only)
- J. W. Stettler, B. S. Thomas, "Flooding and structural forensic analysis of the sinking of the RMS Titanic", *Ships and Offshore Structures* (2013) (ET PDF 403; search digests only)
- Titanic Connections (expansion joints, 49F and 28A), HTTP 500; search digest only
- titanic-plan.de, list of H&W plans (midship section, shell plating, B-deck plating): http://www.titanic-plan.de/i_HW_plans_e.html ; NMNI digitised-plans catalogue: https://cms.nationalmuseumsni.org/sites/default/files/2022-09/Digitised-Olympic-and-Titanic-Ship-Plans.pdf (not opened; PDF)
