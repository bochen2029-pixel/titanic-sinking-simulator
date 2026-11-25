# Hull strength along her length: rivets, seams, plating and frames (BACKLOG P3b, last part)

Written 2026-11-17 03:45 CST by a research subagent (Opus 5.5) for the lead session, from public web sources only (WebSearch and WebFetch). Status: v1. Time-boxed: about 20 minutes of searching, then written. Items 1 to 4 are answered as far as public HTML sources reach, and the gaps are listed as NOT FOUND (section 6). The primary PDFs could not be read by WebFetch in this session (section 8): NIST-IR 6118, the SNAME Marine Forensics Panel breakup paper, the 2007 infocus article and Paik et al. 2025. Their figures come from the earlier note in this folder, whose author read two of them when they were reachable, and are tagged [from repo].

Tags used below:
- **[quoted]**: read in the source opened. Rows with no tag are of this kind.
- **[secondary]**: seen only in a search-engine summary of a page that could not be opened, or in a press account of the primary work.
- **[from repo]**: taken from the simulator's own files (read, not run). This includes `docs/research/RESEARCH_bow_crushing_head_on_v1_2026-11-17.md`, the earlier note, which read NIST-IR 6118 and Paik, Kim and Thomas (2025).
- **[derived]**: computed here, with the method stated.

Short quotes are given only from public-domain sources (1885, 1911, 1912 and 1915 texts, and NIST pages), plus one from a copyrighted press source. Other copyrighted sources are paraphrased.

## Summary

1. **Her rivets came in two kinds along her length.** In the middle three-fifths the rivets were mild steel, closed by hydraulic machines. In the front and rear fifths they were wrought iron, closed by hand. The hydraulic riveters could not work where the hull curved sharply. The iron was ordered as No. 3 bar ("best"), not the No. 4 ("best-best") usual for rivets. This is McCarty and Foecke's archival finding (2008). It reached this note through Corfield (Physics World 2012), the New York Times, AP and the Independent; the book itself was not opened.
   - Wilding (1915) confirms that hydraulic riveting was used wherever it was possible, which leaves hand riveting elsewhere.
   - The Shipbuilder (1911) says hydraulic riveting covered nearly all of the double bottom, including the bottom shell up to the turn of the bilge, and the topsides.
   - **Confidence:** medium-high that the ends were hand-riveted iron and the middle hydraulic steel; low on where the boundary lies.
2. **No source opened gives the boundary as a frame number.** Two readings conflict:
   - Read literally, the front fifth puts the forward boundary at 0.2 L = 51.8 m aft of the forward perpendicular (FP). That is model x = +77.7 m, inside No. 3 hold [derived].
   - The New York Times says the 1912 damage ended near the change from iron to steel. That pulls the boundary aft toward boiler room 5: bulkhead E is at x = +54.3 m, and the model's tear ends at x = +29 m [from repo].
   - Derived frame number for the 0.2 L point: about 85F, and at least that, if every frame from amidships forward to it is at 36 in (the only spacing given for the midbody). No source gives frame numbers for this boundary.
3. **Seam riveting.** At the site of impact the seams were double-riveted. Garzke of the SNAME Marine Forensics Panel said, through AP, that the builders used two where three would have been stronger. The midbody was triple-riveted according to a forum post attributing this to Garzke, which the poster calls unsubstantiated. Some landings and butts were quadruple-riveted (Titanic Historical Society; Chirnside's straps; Paik et al.'s 1.00 in side-shell joint).
   - **Confidence:** medium for double riveting at the bow, low for the rest of the pattern.
4. **Strength.**
   - **Rivet shear (period tests, Stoney 1885):** iron rivets 18.7-19.8 tons/in2 (289-306 MPa); steel rivets 21.0-24.6 (325-380 MPa). Denny's rule for ship riveting was 19 for iron against 22 for steel. Iron rivets in steel plates carried about 16.5 (255 MPa).
   - **Heads:** an iron rivet's heads pull off at about 7 tons a rivet (70 kN).
   - **Slip:** machine riveting gives about twice the friction of hand riveting. Hand-driven joints slipped at 2.5-3.5 tons a rivet, machine-driven ones at about 7-10 tons.
   - **Slag in her recovered rivets:** about 9 %, against the normal 2-3 % (9.3 % in NIST-IR 6118). In the heads, the slag stringers are turned across the rivet's axis.
   - **Replica rivets (press account):** a No. 4 iron rivet held 9,000 kg, and a slag-laden No. 3 rivet popped at 4,000 kg, a ratio of 0.44 [derived].
   - **Strength of her own rivets or seams, measured:** NOT FOUND.
5. **Plating and frames.**
   - **Plating:** the shell is 1 in amidships (Wilding: 20/20ths of an inch, and 10-20 % above Lloyd's). It tapers to 0.7 and 0.6 in toward the ends (Mengot, from the builder's plans). In the forward body it runs 0.60-0.70 in near the stem, 0.70-0.84 in over the holds and 0.84-0.90 in toward boiler room 6 (Paik et al. Fig. 51) [from repo].
   - **Frames:** 36 in amidships, 24 in at the very bow and 27 in at the stern. Where the spacing changes is NOT FOUND.
   - **Bow structure:** the forward end was strengthened against panting and harbour ice (Wreck Commissioner's Report).
6. **How a seam fails under impact.** The heads of the slag-laden rivets break off and the plates part along the seams. Sonar found six thin openings of about 1 m2 in all. Olympic's 1911 collision with HMS Hawke left dozens of empty rivet holes (NIST).
7. **For the model (section 7; every factor derived, none sourced).** No source gives the dent or strain at which a seam opens, for either kind.
   - **dTear:** a factor of **0.7 (range 0.4 to 0.9, low confidence)** for the iron, hand-riveted ends against the steel, hydraulically riveted midbody.
   - **q:** **1.0 (range 0.8 to 1.3, low confidence)**. Thinner plating and closer frames at the ends pull in opposite directions, and no source supports a change.
   - **Refit needed:** `ICE.alpha` (and `q`) were fitted to the 1912 damage with a uniform `dTear = 0.2` m, which is itself a bet. Under the 0.2 L reading, half of that damage lies in the iron region. A regional law therefore means a refit with `tools/calibrate_encounter.js` (not run here).

## 1. Rivet material and riveting method, by region

| Figure | Value | SI | Source (author, title, URL) | Short quote | Confidence |
|---|---|---|---|---|---|
| Steel and iron rivets along the hull | steel rivets only on the central hull, where stresses were expected to be greatest; iron rivets at the bow and stern; six seams opened in the bow plates; 48 rivets examined from the wreck | - | W. J. Broad, New York Times, 15 Apr 2008, reprinted by Sail-World, https://www.sail-world.com/-44076 | "ended close to where the rivets transition from iron to steel" (of the damage) | Medium-high (a press account of McCarty and Foecke; read in a reprint) |
| The middle three-fifths, and why | steel rivets usable only in the middle three-fifths of her length, because the hydraulic presses could not work where the hull's curvature was too sharp; the front and rear fifths had "best" iron rivets (not "best-best"), inserted by hand; slag made them vulnerable to shear; in lab tests such heads popped off | 0.6 L = 155.4 m amidships; each end fifth 51.8 m [derived, L = L_pp = 259.08 m] | R. Corfield, "The perfect storm", Physics World (2012), https://physicsworld.com/a/the-perfect-storm/ | - | Medium (a journalist's account of the authors' book, which was not opened) |
| Iron grade ordered | No. 3 bar ("best") was bought, not No. 4 ("best-best"), which shipbuilders then used for rivets; part of the supply came from smaller forges; the board discussed the shortage of riveters at nearly every meeting from late 1911 to April 1912 | - | NYT 2008 text as reproduced at https://bayesianheresy.blogspot.com/2008/05/what-really-sank-titanic-new-forensic.html | - | Medium |
| Same, by Foecke | four-bar iron is wanted for rivets, and some orders were for three-bar; steel rivets where the greatest stress was expected, iron ones at the bow and stern | - | AP, "Some rivets on Titanic were substandard...", Dawn, 19 Apr 2008, https://www.dawn.com/news/298729/ | - | Medium |
| A naval architect's view | a retired Harland and Wolff naval architect (Livingstone) thinks iron was used at the ends because a crane-mounted hydraulic riveter could not reach them, and that the iron rivets were made wider to make up for their lower strength | - | same (AP, Dawn) | - | Medium (his opinion; no rivet sizes given) |
| Hydraulic riveting, builder's evidence | hydraulic riveting adopted to an unusual extent, wherever it was possible, so that the rivets were thoroughly closed; slow and expensive | - | E. Wilding (Harland and Wolff), deposition, Limitation of Liability hearings (1915), https://www.titanicinquiry.org/lol/depositions/wilding02.php | "riveting was the weak point in big ships" | High as testimony (does not say where hand riveting was used) |
| Hydraulic riveting, by part of the hull | used whenever possible; nearly all of the double bottom was hydraulic-riveted, the bottom shell up to the turn of the bilge, and the topside shell, stringer plates and doublings | - | The Shipbuilder, Olympic and Titanic special number (Midsummer 1911), text reproduced by GG Archives, https://www.ggarchives.com/OceanTravel/Titanic/25-ImageLibrary/TheShipbuilder-03-BuildingTheHulls.html | "including the bottom shell plating up to the turn of the bilge" | Medium-high (the reproduction's wording looks modernised in places; the original pages were not opened) |
| Doubling riveted hydraulically | the shell doubling between C and B decks and the doubled B-deck stringer were hydraulic-riveted | - | Wreck Commissioner's Report (1912), "Structure", https://www.titanicinquiry.org/BOTInq/BOTReport/botRepStructure.php | - | High |
| How many rivets, and their size | about 3 million rivets, about 1,200 tons; half a million in the double bottom, about 270 tons; the largest 1 1/4 in | 31.75 mm | The Shipbuilder (1911), via GG Archives (above) | - | High for the figures (the material of each region is not given) |
| Same, as NIST puts it | NIST's page calls all 3 million rivets wrought iron, which contradicts the steel midbody | - | NIST, "NIST reveals how tiny rivets doomed Titanic vessel", https://www.nist.gov/pao/nist-reveals-how-tiny-rivets-doomed-titanic-vessel | - | Low for the material of the count |
| Seams at the impact site: double | Garzke (SNAME Marine Forensics Panel): the fault was the design of the riveted joints, not the rivets' metal; only two rivets (read here as two rows) where three would have added strength | - | AP, Dawn (above) | - | Medium (a remark reported by the press; reading the reported two rivets as two rows is mine) |
| Triple inside the middle three-fifths, double outside | the claim is attributed to Garzke | - | Encyclopedia Titanica forum, "Wrought Iron and Steel Rivets which type where", https://encyclopedia-titanica.org/community/threads/wrought-iron-and-steel-rivets-which-type-where.17507 | - | Low [secondary: search summary; the page returned 403; the poster calls it unsubstantiated] |
| Quadruple riveting | in some places the hull was quadruple-riveted (places not named); the same article calls all her rivets mild steel | - | Titanic Historical Society, "Titanic's 'Brittle' Steel?", https://titanichistoricalsociety.org/?p=146 | - | Low-medium |
| Quadruple-riveted landings at the straps | the one-inch side straps the article describes (frames 63-81, and 50-73) made the landing quadruple-riveted, with an extra row of holes | 25.4 mm | M. Chirnside, "Olympic and Titanic: 'Straps' and Other Changes", TRMA, https://trmaarchive.com/articles/markchirnside2/index.shtml | - | Medium |
| Her joints in a finite-element study | 17 riveted joint cases; efficiency 0.165-0.980; a single-riveted 0.35 in deck joint 0.200 (48.9 MPa); a quadruple-riveted 1.00 in side-shell joint 0.626 (153.4 MPa); base yield 245 MPa | MPa | Paik, Kim, Thomas, "The digital reconstruction and resurrection of the RMS Titanic's sinking", Ships and Offshore Structures (2025), doi 10.1080/17445302.2025.2603417, Table 4 [from repo] | - | Medium-high (via the earlier note; not re-opened: UCL Discovery and Taylor and Francis returned 403) |
| Period rules for large steamers | in larger vessels, treble riveting over the middle half of the length and double in smaller ones; butts of strakes wider than 44 in treble-riveted; rule texts also define a midship zone of three-fifths of the length, with full scantlings | - | an OCR'd handbook at e-rara.ch (https://www.e-rara.ch/ebs/content/pagetext/31193979) and a rules text at https://boatregister.net/Library/Maritime%20History/NavalArchitecture_Shipbuilding.pdf | - | Low-medium [secondary: search summaries; the pages were behind a browser check or were PDFs WebFetch could not read]. The 3/5 zone of the rules may be why the authors speak of three-fifths |

## 2. Strength numbers

| Figure | Value | SI | Source (author, title, URL) | Short quote | Confidence |
|---|---|---|---|---|---|
| Slag in her recovered rivets | about 9 %, against the normal 2-3 %; 48 rivets tested | - | AP, Dawn (above) | - | Medium |
| Same, in the NIST report | 9.3 % slag (about three times normal); in the inner head the slag stringers turn across the axis | - | T. Foecke, "Metallurgy of the RMS Titanic", NIST-IR 6118 (1998), pp. 13-15, https://nvlpubs.nist.gov/nistpubs/Legacy/IR/nistir6118.pdf [from repo] | - | High (via the earlier note; the PDF was unreadable here) |
| Same, NIST's press summary | three times today's allowable slag; brittle in very cold water; heavy slag in the head area | - | NIST page (above) | - | Medium-high |
| Slag orientation | the forming of the rivet may turn the slag stringers across the strong tensile axis | - | Philosophical Society of Washington, minutes of Foecke's talk, 6 Nov 1998, https://pswscience.org/meeting/forensic-metallurgy-of-the-rms-titanic/ | - | Medium (a secretary's summary) |
| Scatter of slag between rivets | 35 rivets mosaicked by image analysis; slag content and shape very variable, most of all in her rivets; local behaviour predicted with the Generalized Method of Cells (the predicted strengths were not seen) | - | J. Hooper, T. Foecke, L. Graham, T. Weihs, "Metallurgical Analysis of Wrought Iron From the RMS Titanic", Marine Technology 40(2) 73-81 (2003); listing https://www.nist.gov/publications/metallurgical-analysis-wrought-iron-rms-titanic | - | Medium [secondary: abstract via search] |
| Share of rivets with high slag | 19 of 48 rivets had elevated slag | - | Prototype (Memorial University), https://journals.library.mun.ca/index.php/prototype/article/download/400/505/2071 | - | Low-medium [secondary: search summary] |
| Peaks | slag up to 20 % in some regions of a rivet (one summary), up to 40 % in some rivets (another) | - | search summaries of NIST and JHU pages | - | Low [secondary] |
| The authors' own claim | the rivets' quality may have been an important factor in the plates' opening | - | J. H. McCarty, T. P. Weihs, T. Foecke, "Microscopic analysis of wrought iron recovered from the wreck of RMS Titanic", infocus 7 (Sept 2007), doi 10.22443/rms.inf.1.26, https://www.rms.org.uk/resource/infocus--7-sep-2007-microscopic-analysis-of-wrought-iron-recovered-from-the-wreck-of-rms-titanic-pdf.html (abstract page) | - | Medium (the abstract; the PDF was unreadable) |
| Replica rivets, made to the 1912 specifications | the No. 4 (four-bar) rivets held 9,000 kg in the laboratory; those with slag popped at 4,000 kg | 88 kN against 39 kN; ratio 0.44 [derived] | The Independent, reprinted by NZ Herald, 16 Apr 2008, https://nzherald.co.nz/world/riveting-reason-for-sinking/N6L44OZ3CCA4FYIYRT5E3VVSAM | - | Low-medium (a press account; geometry, loading and number of tests NOT FOUND) |
| Iron rivets in shear | single-riveted lap, drilled holes 18.70, punched 19.80; double-riveted 18.98; recommended at most 19 (punched), 18-18.5 (drilled) | 289-306 MPa [derived: 1 ton/in2 = 15.44 MPa] | B. B. Stoney, The Strength and Proportions of Riveted Joints (Spon, 1885), Tables II-IV and Art. 2, text at https://distantreader.org/stacks/trust/uc2/uc2_ark+=13960=t4mk66834.txt | - | High (1880s tests, not her rivets) |
| Steel rivets in shear | single-riveted lap: 21.0-23.2; double shear: mean 24.6; Denny: assume no more than 22 for steel against 19 for iron in ship riveting; Board of Trade 23 | 325-380 MPa | Stoney (above), Tables XIX-XXIV and Art. 16 | - | High (period) |
| Iron rivets in steel plates | about 16.5 tons/in2, against 19.5 in iron plates (Admiralty experience) | 255 against 301 MPa | Stoney (above), Art. 2 | - | Medium-high |
| Rivet bar in tension | iron 22-26.4; steel about 27-32 (Board of Trade 28-32) | 340-408 and 417-494 MPa | Stoney (above), Table I and Arts. 15-16 | - | High (period) |
| Rivet steel in 1911 | 25-30 tons/in2, 25 % elongation over 8 diameters | 386-463 MPa | Encyclopaedia Britannica (1911), "Shipbuilding", wikisource mirror page 1028 | - | Medium [secondary: search summary] |
| Iron rivet heads in tension | the heads pull off at about 7 tons a rivet (12.32 tons/in2 of rivet area); a rivet's own contraction can do it | 70 kN; 190 MPa | Stoney (above), Art. 12 and section 20 | - | Medium-high |
| Slip, hand against machine riveting | Kennedy: friction twice as great with machine riveting; slip per rivet, hand-driven single-riveted 2.5 tons, double 3.0-3.5, machine-driven about 7-10; Wildish (Pembroke): hand 6.4-9.04 tons for 1 in rivets, machine 9.6 | 25-35 kN hand against 70-100 kN machine | Stoney (above), section 20 and Table XXXVII | "the friction with machine riveting was twice as great as with hand riveting" | Medium (the table's columns are partly garbled in the text copy) |
| Joint efficiency (joint strength over solid plate, iron) | single-riveted lap 45-50 %; double-riveted lap 60 % (58-64.5); double-cover butt 55 % single, 66 % double; triple or quadruple 70-80 %, hardly above 80 | - | Stoney (above), Art. 13, Tables XIV, XVI, XVII | - | High (period) |
| Seam strength a metre, steel triple-riveted amidships | 7.6-8.7 MN/m | MN/m | [derived: 25.4 mm x 430 MPa (her plate's UTS, NIST-IR 6118 [from repo]) x efficiency 0.70-0.80 (Stoney)] | - | Low |
| Seam strength a metre, iron double-riveted at the bow | 3.3-4.9 MN/m | MN/m | [derived: 17.8 mm (0.70 in) x 430 MPa x efficiency 0.58-0.645 (Stoney), times 0.75-1.0 if the iron rivets' shear governs] | - | Low |
| Their ratio | 0.4-0.65 | - | [derived from the two rows above] | - | Low |
| Same from the FE efficiency | 3.9 MN/m at the joint's equivalent yield (quadruple-riveted 1.00 in side shell) | MN/m | [derived: 0.626 x 245 MPa x 25.4 mm, Paik et al. Table 4 [from repo]] | - | Low-medium |
| Her hull steel | yield 262 and 280 MPa; UTS 430 and 432 MPa; elongation 29 and 30.9 %; ductile-brittle transition +40 C (longitudinal), +70 C (transverse) | MPa | NIST-IR 6118, Table 1 [from repo] | - | High (via the earlier note) |
| Measured shear or tensile strength of her own rivets, iron or steel | - | - | - | - | NOT FOUND |

## 3. How a riveted seam fails under impact

| Figure | Value | SI | Source (author, title, URL) | Short quote | Confidence |
|---|---|---|---|---|---|
| Mechanism at the berg | the collision broke rivet heads off, the rivets were pushed out of their holes, and water came in between the plates | - | NIST page (above) | "caused rivet heads to break off" | Medium-high (NIST calls it strongly suggested, not proven) |
| The opening | sonar: six thin openings on the starboard side, about 1 m2 (12 ft2) in all | 1 m2 | NIST page (above) | - | Medium-high |
| Same | six separate plate separations spanning six compartments | - | PSW minutes (above) | - | Medium |
| The panel's reading | the damage was the parting of seams, not a gash | - | SNAME Marine Forensics Panel, as summarised by Professional Mariner, https://professionalmariner.com/marine-forensics-deep-revelations/ | - | Medium [secondary: search summary] |
| Where most of it was | most of the cracks in the iron-riveted forward part | - | The Independent, NZ Herald (above) | - | Low-medium |
| A sister's precedent | Olympic, 1911 collision with HMS Hawke: dozens of empty holes where rivets had popped; over 50 rivets missing round the damage | - | NIST page (above); NIST-IR 6118 [from repo] | - | Medium-high |
| Joint behaviour before failure | a riveted joint slips (plates slide, caulking breaks) at a fraction of its ultimate load, and hand-closed rivets slip at about half the load of machine-closed ones; flat heads curled up and leaked (Webb); iron heads pull off at about 7 tons | - | Stoney (above), sections 17-23 | - | Medium (period boiler and girder tests, not ship impact) |
| Foecke's count | six compartments flooded; with better rivets five, and with four she might have reached Halifax | - | AP, Dawn (above) | - | Low-medium (a claim, not a calculation shown) |
| Riveted against welded joints under impact | riveted joints are much weaker under impact; the quality of hand work varied | - | Paik et al. 2025, section 4 [from repo] | - | Medium-high |

## 4. Shell plating and frames

| Figure | Value | SI | Source (author, title, URL) | Short quote | Confidence |
|---|---|---|---|---|---|
| Shell plating, nominal | 20/20ths of an inch (1 in), doubled where he had said earlier that day (the Report puts the doubling between C and B decks) | 25.4 mm | Wilding, Limitation of Liability deposition, https://www.titanicinquiry.org/lol/depositions/wilding07.php | - | High as testimony |
| Against the rules | plating 10-20 % thicker than Lloyd's would require; Lloyd's had no rules for ships of 800 ft (they stopped near 650 ft) | - | Wilding, British Inquiry, Q20660-20661, https://www.titanicinquiry.org/BOTInq/BOTInq19Wilding06.php | "between 10 and 20 percent in excess of Lloyd's requirements" | High as testimony |
| Bulkhead plating | about 0.56 in (from memory, he said) | 14.2 mm | Wilding, deposition (wilding07, above) | - | Medium |
| Thinner toward the ends | the sides were not uniformly 1 in; fore and aft of the funnels the side plates taper to 0.7 and even 0.6 in; strakes lettered A to X from the keel to B deck; sheer strake and B-deck stringer of doubled 1 in plate | 15-18 mm at the ends | R. Mengot, "Titanic's Blueprints" (TRMA; from the builder's plans brought to the 1996 expedition), https://wormstedt.com/RoyMengot/TitanicWreck/TRMA/Titanic%27s%20Blueprints%20[Roy%20Mengot]%20db-09.html | - | Medium-high (read from the plans by the author; no table by strake) |
| Forward body, by region | strakes 0.60-0.70 in near the stem, 0.70-0.84 in over the holds, 0.84-0.90 in toward boiler room 6; bottom 14/20 to 21/20 in | 15-23 mm (sides), 18-27 mm (bottom) | Paik et al. 2025, Fig. 51 [from repo] | - | Medium (read off a drawing in the earlier note) |
| Forward end strengthened | framing and plating strengthened against panting and harbour ice | - | Wreck Commissioner's Report, "Structure" (above) | "damage when meeting thin harbour ice" | High |
| Double bottom | floor at every frame; 63 in deep at the centreline (78 in under the reciprocating engines); up the side to 7 ft above the keel over about half her length, lower forward and aft; bilge keel about 300 ft by 25 in amidships | 1.60 m (1.98 m); 2.13 m; 91 m x 0.64 m | Wreck Commissioner's Report, "Structure" (above) | - | High |
| Plate sizes | plates generally 6 ft x 30 ft, 2.5-3.5 tons; the largest 6 ft x 36 ft | 1.8 x 9.1 m | Titanic Historical Society (above) | - | Medium |
| Frame spacing at the ends | 2 ft at the very bow, 27 in at the stern | 0.610 m; 0.686 m | Mengot (above) | - | Medium-high |
| Frame spacing amidships | 36 in in one area, the widest anywhere in the ship; the area is the straps' region (frames 50-81) as I read the article | 0.914 m | Chirnside (above) | - | Medium-high |
| Same, another account | up to 36 in amidships, as close as 24 in at the bow and 27 in at the stern; plates about 1 in, thinning toward the ends; ends and turns of the hull closed by hand where hydraulic riveting was impossible | - | Titanic Connections, https://titanicconnections.com/tag/construction-of-the-titanic/ | - | Medium [secondary: search summaries; the site returned 500] |
| Frame numbering | from the middle of the ship, 1 to 157 forward and 1 to 148 aft, with no frame 0 (two frame 1s); the aft wall of the forward well deck at 83 fwd; the front of the poop at 117 aft | - | Mengot (above) | - | Medium-high |
| Same, other counts | 1 to 154 forward and 302 frames between perpendiculars (a forum post citing Beveridge's plans); or 156F at the FP | - | Encyclopedia Titanica forum and a search summary | - | Low [secondary] |
| Where the spacing changes, and frame sections at the bow | - | - | - | - | NOT FOUND |

## 5. Her frame numbers against the model's x (all derived)

Method: distance from the FP d; model x = 129.54 m - d [from repo: `G.xFP`, the brief]. The bulkhead positions are the model's own (`BULKHEADS[].dFP` in `core/core.js`, feet from the FP; x = (425 - dFP) x 0.3048) [from repo]. Frame number ≈ |x| / 0.9144 m + 0.5, rounded, assuming every frame from amidships to the point is at 36 in. It is a **lower bound** wherever closer spacing lies between amidships and the point. H&W's midship frame need not coincide with the model's x = 0.

| Point | From FP | Model x | Frame [derived] |
|---|---|---|---|
| FP | 0 | +129.54 | 154-157F (counts in section 4) |
| Bulkhead A (forepeak / hold 1) | 46 ft = 14.0 m | +115.5 | not derived (closer frames) |
| Bulkhead B (hold 1 / hold 2) | 91 ft = 27.7 m | +101.8 | not derived |
| Bulkhead C (hold 2 / hold 3) | 142 ft = 43.3 m | +86.3 | 95F or more |
| 0.2 L, the end of the front fifth | 170 ft = 51.8 m | +77.7 | 85F or more |
| Bulkhead D (hold 3 / boiler room 6) | 193 ft = 58.8 m | +70.7 | 78F |
| Bulkhead E (boiler room 6 / 5) | 247 ft = 75.3 m | +54.3 | 60F |
| Bulkhead F (boiler room 5 / 4) | 304 ft = 92.7 m | +36.9 | 41F |
| The model's 1912 tear, aft end | 100.5 m | +29 | 32F |
| Bulkhead M | 640 ft = 195.1 m | -65.5 | 72A |
| 0.8 L, the start of the rear fifth | 680 ft = 207.3 m | -77.7 | 85A or more |
| Bulkhead N | 703 ft = 214.3 m | -84.7 | 93A or more |
| AP | 850 ft = 259.1 m | -129.54 | not derived (27 in aft) |

## 6. NOT FOUND

| Figure | Value | SI | Source (author, title, URL) | Short quote | Confidence |
|---|---|---|---|---|---|
| Frame numbers or distances where the iron rivets give way to steel, forward and aft | NOT FOUND (only the front and rear fifths, and the press account that the damage ended near the change) | - | - | - | - |
| Rivet material in the bottom shell at the ends, which was hydraulic-riveted up to the turn of the bilge over nearly all the double bottom | NOT FOUND | - | - | - | - |
| Riveting of seams and butts by strake and region (single, double, triple, quadruple) from The Shipbuilder, the plans or the Marine Forensics Panel | NOT FOUND (apart from Garzke's remark on two rows where three were wanted, and the secondary claims above) | - | - | - | - |
| Rivet diameter and pitch in the bow seams | NOT FOUND (largest rivets 1 1/4 in; the iron ones said to be wider) | - | - | - | - |
| Measured shear or tensile strength of her recovered rivets, and of a riveted seam a metre, iron or steel | NOT FOUND | - | - | - | - |
| Rivet strength as a function of slag content or stringer angle (the 2003 micromechanical predictions) | NOT FOUND | - | - | - | - |
| McCarty's thesis (Johns Hopkins, 2003): title, tests, numbers | NOT FOUND (PhD 2003, adviser Weihs, about 45 rivets, per search summaries; the JHU page returned 403) | - | - | - | - |
| The Marine Forensics Panel papers' riveting and plating data (Garzke et al. 1996; the 1997 report; the breakup paper) | NOT FOUND (TRMA's copy of the breakup paper, https://trmaarchive.com/articles/breakup/MFPBreakupPaper.pdf, came back as unreadable binary) | - | - | - | - |
| A dent or strain at which an iron, hand-riveted seam opens against a steel, hydraulically riveted one, or their ratio | NOT FOUND (section 7 derives one) | - | - | - | - |
| Frame-spacing schedule (where 24, 27 and 36 in apply) and frame sections at the bow | NOT FOUND | - | - | - | - |
| A table of plating by strake from the stem to boiler room 5, with the strakes at the damage's depth | NOT FOUND (ranges only, from Paik et al. Fig. 51 [from repo]) | - | - | - | - |

## 7. For the model

The model today [from repo, `core/encounter.js`]: `q = 24e6` N per m2 per m of dent, `dTear = 0.2` m and `alpha = 0.2071` m2 per m per m are uniform along the hull. `q` and `alpha` were fitted to the 1912 damage, and `dTear` is a bet. The bands lie 5.75-7.75 m below the waterline. The 1912 tear runs from x = +127 to +29 m.

### 7.1 Regions

Every extent and factor in this section is [derived]. The extents come from 0.2 L and 0.8 L with L = 259.08 m, and from the model's own bulkhead positions [from repo]. The factors come from sections 7.2 and 7.3.

| Region | Extent from the FP | Model x | What the sources say | Factor on dTear | Factor on q | Confidence |
|---|---|---|---|---|---|---|
| Forward iron, hand-riveted | from the stem to 51.8 m (0.2 L) | stem (about +129 to +130, by height) to +77.7 | wrought iron ("best") rivets closed by hand; seams double-riveted at the impact site; plating 0.60-0.84 in; frames 24 in at the very bow; strengthened against panting | **0.7** (0.4-0.9) | **1.0** (0.8-1.3); forepeak alone 1.0-1.5 as a what-if | Low for the numbers; medium-high that this region is weaker |
| Forward transition | 43.3-58.8 m (bulkhead C to D, No. 3 hold), centred on 51.8 m | +86.3 to +70.7 | no frame number found; a ramp is safer than a step | linear 0.7 to 1.0 | 1.0 | Low |
| Same, what-if per the New York Times | boundary at 75.3 m (bulkhead E) | +54.3 | the press account that the damage ended near the change | 0.7 forward of it | 1.0 | Low |
| Midbody, steel, hydraulic | 51.8-207.3 m (0.2 L to 0.8 L) | +77.7 to -77.7 | mild steel rivets, hydraulically closed; seams triple-riveted (unsubstantiated) with quadruple landings and butts in places; plating 1 in; frames 36 in | **1.0** (reference) | **1.0** | Medium |
| Aft transition | 195.1-214.3 m (bulkhead M to N, the electric engine room) | -65.5 to -84.7 | as forward | linear 1.0 to 0.7 | 1.0 | Low |
| Aft iron, hand-riveted | 207.3 m (0.8 L) to the stern (AP at 259.1 m, plus the overhang) | -77.7 to -129.5 and beyond | as forward; frames 27 in | **0.7** (0.4-0.9) | **1.0** (0.8-1.3) | Low |

If L is taken as her length overall (882.75 ft = 269.1 m) from the stem, the fifths move about 2 m [derived]. That is well inside the uncertainty.

### 7.2 Where the dTear factor comes from (derived)

Five ratios of the end region's seam against the midbody's, each from section 2:

| Ratio | Value | Basis |
|---|---|---|
| a. Rows (double against triple), when the rivets' shear governs | 2/3 = 0.67 | AP/Garzke; the forum claim |
| b. Rivet shear, iron against steel | 0.75-0.94 (Denny's 19/22 = 0.86; iron in steel plates 16.5/22 = 0.75) | Stoney |
| c. Joint efficiency, double against triple or quadruple, when the plate between holes governs | 0.60 / (0.70-0.80) = 0.75-0.86 | Stoney |
| d. Heads with slag (replica rivets) | 4,000 / 9,000 = 0.44 | Independent (press) |
| e. Slip, the onset of leaking: hand against machine | (2.5-3.5) / (7-10) = 0.25-0.50; Kennedy's factor of two gives 0.5 | Stoney |

Seam strength ratio S:
- rivet-limited (a x b): 0.50-0.63;
- plate-limited (c): 0.75-0.86;
- head-limited (d): 0.44;
- leak-limited (e): 0.25-0.50.

A central S is about 0.5.

From strength to dent: a dent of depth d over a span L stretches the shell by about ε = 2 (d/L)^2. That is two straight legs, with elongation 2 sqrt((L/2)^2 + d^2) - L ≈ 2 d^2 / L.

While the seam's load grows in proportion to the stretch, as in an elastic membrane or as rivets slip against friction, the seam opens at d = L sqrt(ε_open / 2). That is proportional to sqrt(S). So the factor on dTear is about sqrt(S):
- 0.71-0.79 rivet-limited;
- 0.87-0.93 plate-limited;
- 0.66 head-limited;
- 0.50-0.71 leak-limited.

**Central 0.7, range 0.5-0.9.** I widen the low end to 0.4 for the next reason.

**Order-of-magnitude check:** a seam that opens at 200-320 MPa of membrane stress opens at ε ≈ 0.10-0.15 % (E = 207 GPa). Over an illustrative span of L = 10 m (my assumption, not sourced), that is a dent of 0.22-0.28 m: the order of the model's dTear = 0.2 m.

**Low end:** suppose the steel seam (efficiency about 0.75, so about 320 MPa) is stronger than the plate's yield (262-280 MPa) while the iron seam (about 160-215 MPa) is weaker. Then the steel seam holds until the plate has stretched plastically by a few per cent, and the iron one opens near 0.1 %. The dent ratio can then fall to 0.2-0.4. Paik et al.'s FE efficiency for a quadruple-riveted 1 in side seam (0.626 on yield) argues against this case: there even the best seam gives way below the plate's yield. So 0.2-0.4 stays a what-if, at very low confidence.

**Two things this leaves out:**
- **Plate thickness.** To first order it cancels: the seam's capacity and the membrane force for a given stretch both scale with t. The ends' thinner plating does not by itself change dTear.
- **Frame spacing.** If the dent were local between frames (L = frame spacing), the bow's 24 in against 36 in would scale dTear by a further 0.67. The model's dent is a hull-side displacement spanning many frames, so I do not apply it (bet).

### 7.3 The q factor (derived; sources do not support a change)

- **Plating:** the end plating is 0.60-0.84 of the midbody's 1 in, and the plating's share of the resistance scales with t.
- **Frames:** the very bow has 1.5 times as many frames a metre (24 against 36 in). Spacing over the holds and frame sections are NOT FOUND.
- **Bow structure:** panting strengthening forward (Wreck Commissioner's Report).

Net 0.8-1.3, central 1.0. **Keep q uniform.** The forepeak (x +129.5 to +115.5) at 1.0-1.5 is a what-if only. `alpha` has no source either way: keep it uniform.

### 7.4 How it could go into `core/encounter.js` (advice; nothing changed or run)

1. **Per-station factor.** Give each station a factor on dTear, f(x):
   - 0.7 for x >= +86.3 and for x <= -84.7;
   - 1.0 for +70.7 >= x >= -65.5;
   - linear ramps across No. 3 hold (+86.3 to +70.7) and the electric engine room (-65.5 to -84.7).
   - A plain step at x = +/-77.7 is the simpler alternative.
2. **Refit.** The fitted 1912 point depends on today's uniform values.
   - Under this layout about half the 1912 tear (x +127 to +77.7, 49 of its 98 m) is in the iron region and half in the steel region [derived].
   - So either keep `dTear` = 0.2 m as the midbody value (0.14 m at the ends), or search for the midbody value that keeps the 1912 timing. Then refit `alpha` with `node tools/calibrate_encounter.js` and run the encounter and night tests.
   - Expect the opened area to move forward: more in the holds, less in boiler rooms 6 and 5. Check that against P3b's test: 157 minutes within 5, and the split within a few points of Hackett and Bedford's.
3. **Depth.** The Shipbuilder's hydraulic riveting of the bottom shell up to the turn of the bilge, over nearly all the double bottom, suggests the end factor belongs to the side shell above the bilge. At the bow the model's three bands are side shell, so applying the factor at all three bands is the fair bet. The rivet material of the end bottoms is NOT FOUND.
4. **What would firm this up.** In order:
   - McCarty and Foecke's book and McCarty's 2003 thesis (the boundary frame, the rivet and joint tests);
   - the Marine Forensics Panel papers (the riveting pattern);
   - the builder's shell expansion (strake thicknesses, seam riveting);
   - Paik et al.'s Table 4 read in full (efficiencies for her actual bow and midbody joints, which would replace ratios a to c).

## 8. Sources tried and not readable here

- **NIST-IR 6118.** The archive.org, UNT web-archive and nvlpubs copies came back to WebFetch as compressed binary. The figures above are the earlier note's reading [from repo].
- **SNAME Marine Forensics Panel breakup paper (TRMA PDF), and the 2007 infocus PDF.** Both came back as binary.
- **Returned 403:**
  - Paik et al. 2025 (UCL Discovery, UCL figure set, Taylor and Francis);
  - Encyclopedia Titanica (forum threads and the "RMS Titanic: A Metallurgical Problem" article);
  - the JOM 1998 Felkins et al. page;
  - JHU Engineering magazine;
  - The Scotsman;
  - Instron;
  - the Great Lakes rules page.
- **Other failures:**
  - e-rara.ch was behind a browser check;
  - Titanic Connections returned 500;
  - Project Gutenberg returned 503;
  - a US DOT rivet report (rosap.ntl.bts.gov) came back as binary;
  - the APS slide deck by Foecke did not resolve.
- **WebFetch copies of unreadable PDFs.** WebFetch saved them under the user profile's `.claude\projects` folder. Per the estate's rules they were not opened.
