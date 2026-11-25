# Titanic's tanks, counter-flooding and the watertight-door schedule: what existed, what was done on 14-15 April 1912, what could have been done, and what the analyses say it would have bought (v1)

- **Written:** 2026-11-17, 15:50 to 16:40 CST (skeleton 15:50, research to 16:28, text 16:28 to 16:40), by a research subagent of session ab71e668 (Claude Code desktop, Opus 5.5), for the design stage "the whole night".
- **Method:** web search and WebFetch only (about 40 searches, about 55 fetches). No browser pane; nothing downloaded; no other file in the repository touched. The session's shared web-search budget ran out at about 16:25; after that only pages already known were fetched, and the gaps a further search might have closed are listed in section 9.
- **Refused or unreadable:** encyclopedia-titanica.org refused the fetch tool (HTTP 403) on the forum thread "Slowing Titanic's flooding" and on "An Analysis of Titanic's Vertical and Lateral Watertight Doors" (which holds the door-size chart); gutenberg.org (503, the British Report as a book); web.archive.org and its mirror (refused; an older Wikipedia text on the open-doors theory); titanicconnections.com (500, the double-bottom tour); titanic.fandom.com (402, "Titanic: Secrets Revealed"); a Reddit mirror (SSL error); LiveScience (no article text in the page). Not attempted, being PDFs or Word files: J. David Rogers's "Nine Ways the Titanic Might Have Been Saved" (abstract and lecture notes, web.mst.edu), Halpern's "A Matter of Stability and Trim" (titanicology PDF), the MAIB's 1992 Californian reappraisal (gov.uk PDF), the Marine Forensic Panel's papers (trmaarchive PDFs), Erik Wood's symposium paper (.doc). Not online in any form I found: Hackett and Bedford (RINA 1996), Garzke et al. (SNAME 1997).
- **Tags:** [read] = in a page I opened, asked for verbatim text or the explicit figure; [search summary] = only in a search-result digest, or in a fetched secondary page that paraphrases the original; [derived] = my arithmetic, shown; [bet] = no source, my judgement.
- **Tool caveat:** WebFetch passes each page through a small model. For the load-bearing lines I asked for verbatim text with the question wording, twice where it mattered (Wilding BI 20030-20045, 20226-20232, 20441-20456, 20996-20999; Dillon BI 3745-3806; Scott BI 5620-5642; the bridge notice). Punctuation may be normalised.
- **Quotes:** at most one short phrase per source, under 15 words; everything else is paraphrase.
- **Conventions:** 1 long ton (LT) = 1.01605 t; sea water 1.025 t/m3, so 1 LT of sea water = 0.9913 m3; 1 ft = 0.3048 m. Tank capacities are long tons of sea water at 35 cu ft a ton; Halpern's fresh-water figures are at 36 cu ft a ton (his ratio 71/69 = 1.029 = 36/35 [derived]). Times are ship's time; T = minutes after the collision at 11:40 p.m. "BI nnnn" = British Inquiry question; "US" = US Senate Inquiry, by day and witness. Boiler rooms (BR) are numbered from aft (BR6 forward, BR1 aft). Bulkheads A to P from forward (no I). **x** = metres forward of amidships, amidships taken at 425 ft abaft the forward perpendicular (half of 850 ft between perpendiculars); bulkhead positions are the running sums of the Report's compartment lengths, and the Report's own anchor, "K (90 ft. abaft amidships)", falls 1 ft from mine [read + derived]. **z** = metres above the keel.
- **Read with:** `RESEARCH_pumps_bilge_ballast_v1_2026-11-17.md` (the pumps, the mains and the night's pumping: not repeated here) and `RESEARCH_ship_systems_plant_v1_2026-11-16.md` §4 (the boiler rooms), §7 (the doors' mechanism), §8. `RESEARCH_lists_bunkers_scotland_road_v1_2026-11-17.md` (another subagent, in progress at this writing) takes the bunkers, E deck and the gangway door as causes of list; this note takes them as openings the crew controlled. `RESEARCH_breach_inflow_at_speed_v1_2026-11-16.md` holds the physics of inflow under way.

## 0. Summary

1. **The tanks (high).** Under the tank top and in the peaks, 46 watertight compartments behind 17 transverse divisions [read]. The double bottom was 63 in deep (78 in under the reciprocating engines), ran from bulkhead A to about 20 ft before P, and rose to 7 ft at the sides over the 447 ft amidships [read]. **Total water ballast 5,754 LT (5,846 t; 5,704 m3)**, peaks and the fresh-water tanks included; **fore peak 190 LT, after peak 115 LT** (Wilding, BI 20996-20999) [read]. Halpern's tank-by-tank table sums exactly to Wilding's total [read + derived]. HANDOFF §7's "the after peak holds about 800 t" is wrong by a factor of seven: 115 LT, 117 t.
2. **What each tank was for (high for the rule, medium for which).** Tanks under the boiler rooms were for sea water only, most others for fresh water (Wilding BI 20037) [read]; six double-bottom compartments were fresh water only (Halpern: tanks 10-12 under the engine rooms; Wilding BI 20472 names the tanks outside the machinery space: a conflict, section 8). Above the double bottom, seven fresh-water tanks of 962 LT [read]. No deep tank: the peaks were the trimming tanks [read].
3. **What they held on the night (low).** No source says. Wilding: every fresh-water tank full at departure and drawn down on the voyage; salt water was put into some salt-water tanks to keep the stability [read, as practice]. The forepeak tank was holed by the ice [read]. Wilding's draught estimate for 14 April (32 ft 3 in mean, about 4,026 LT lighter than at load) is consistent with no ballast taken since Southampton [search summary + derived], but it was itself an estimate.
4. **Filling and emptying (medium).** A 10-in ballast main fore and aft, a branch to each tank (8, 6 or 5 in), and sea filling pipes on the main "at intervals for trimming purposes": tanks filled by gravity from the sea; the five 250-LT/h ballast pumps emptied them [read]. Wilding: the pipe arrangements for flooding a bottom space "act comparatively slowly" (BI 20230) [read]. My estimate: about an hour from the order to have 800 t in the after tanks [derived + bet].
5. **What counter-flooding the tanks could do (derived).** The six after tanks that can take sea water (836 t, centroid 75 m abaft amidships) trim her about 0.6 to 0.7 m by the stern, lift the forefoot about 0.2 m, and leave the tops of bulkheads E and F within 4 cm of where they were: those bulkheads lie near the pivot, and the 836 t sinks her 0.15 m. Taking 389 t of fresh water out of tanks 1-3 would have raised them 13 to 16 cm, but those valves were in the firemen's passage, flooded at T 5. Correcting the late port list was the one job the tanks could do: about 490 t in the starboard wing tanks corrects 8 to 12 degrees [derived], given about an hour.
6. **The night (high for the absence).** No witness, no counsel and no page of either report mentions ballast, trimming or counter-flooding on the night. Below, the engineers shut the dampers, closed and later reopened doors, worked the pumps, drew the fires in BR6, BR5 and partly BR4, let the boilers blow off through their safety valves, stopped the fans and kept the dynamos to the end [read].
7. **The doors (high for the arrangement).** Twelve vertical doors at the tank top, two of them in series at D; E to J at the end of 9-ft passages through the cross-bunkers; K to O on the bulkheads [read]. One switch on the bridge dropped them all after a 10-s bell; they fell in 25 to 30 s against an oil cataract [read]; a float under each room's floor released them when water stood 18 in to 2 ft over the tank top; a lever at each door released it by hand; they could be raised only by hand and only after the bridge switch was off [read]. There was no door indicator on the bridge (Olliver) [read]. Twenty-two horizontal doors, 12 on F deck and 9 on E deck abaft K plus one on the orlop at N, were worked by hand at the door or from the deck above with a box spanner; no floats, no bridge control [read].
8. **The 1912 schedule (medium).** All twelve vertical doors closed at T 0 to 3. G, H, J and K were raised by hand from about T 30 on the chief engineer's order, so the engineers could reach the pumps and valves; O was raised 2 ft at about T 30-35 to free the tunnel greaser; L, M, N and O were raised fully at about T 60-65 to fetch the 10-in suction pipe; none was closed again by hand as far as anyone knows; D, E and F stayed shut. On F deck the doors at C and D were found open at T 5-10, Wheat closed the two by the Turkish baths (bulkhead F, my reading) at about T 15-21, and orders to close the between-deck doors went round at about T 7 (the boatswain) and T 15 (all F-deck doors, the second steward). On E deck aft, door No. 23 was still open after T 130 [read + derived].
9. **What the literature says might have been done.** Doors left open: life "lengthened somewhat" (the Court); a 1998 documentary is reported to have found she would capsize about 30 minutes early [search summary]; this model gives 22 minutes longer. F-deck doors: 5 to 10 minutes either way (Wilding). Counter-flooding aft: 4 to 4.5 hours (Rogers, a lecture abstract I could not read) against my arithmetic, which finds the tanks cannot do it. Moving everyone aft: 165 t, 24 s of inflow (DTU). Collision mat: none carried that anyone mentions, and 300 ft of scattered damage could not be covered. Steaming ahead after the collision: some extra inflow (Brown, Patten), no number; by my arithmetic under 8 % while under way. Steaming for the light: 17 to 20 miles by the MAIB's principal finding [search summary], beyond her reach.
10. **Doctrine.** Close the doors from the bridge after the bell; sound the ship; engineers to the pumps and valves; keep steam up, draw fires as the water rises; boats. Counter-flooding was a naval idea against list (Makarov, Krylov), and Harland & Wolff discouraged cross-flooding fittings in merchant ships (Wilding) [read].

## 1. The tanks

### 1.1 The arrangement

| Figure | Value | SI | Source (author, title, URL) | Short quote | Confidence |
|---|---|---|---|---|---|
| Divisions | 17 transverse watertight divisions, including those bounding the fore and aft peaks, and a centre and two longitudinal bulkheads, making 46 compartments [read] | - | British Wreck Commissioner's Report (1912), "Pumping Arrangements", https://www.titanicinquiry.org/BOTInq/BOTReport/botRepPumping.php | (paraphrase) | High |
| Depth | 63 in at the centre line; 78 in under the reciprocating machinery; over about half the length the double bottom rose up the side to 7 ft above the keel; forward and aft of the machinery space, to a lesser height [read] | 1.60 m; 1.98 m; 2.13 m | Report, "Structure", https://www.titanicinquiry.org/BOTInq/BOTReport/botRepStructure.php | (paraphrase) | High |
| Extent | tank top about 5 ft above the keel, full breadth, from bulkhead A to 20 ft before bulkhead P [read]; Wilding: it stops at the after end of the forepeak and two-thirds of the way between O and P (19 ft before P [derived]) (BI 20031-20034) [read] | 1.52 m; ends at x = +115.5 and x = -112.8 m [derived] | Report, "Detailed Description", https://www.titanicinquiry.org/BOTInq/BOTReport/botRepTitanic.php; Wilding, BI 20031-20034 (Day 18), https://www.titanicinquiry.org/BOTInq/BOTInq18Wilding02.php | (paraphrase) | High |
| Divisions across | four watertight compartments across the breadth amidships; before and abaft the machinery space a centre-line division only, except the foremost and aftermost tanks (single) [read]. Centre keelson about 670 ft (B to O); side bulkheads 447 ft (D to M) about 30 ft from the centre line [read] | 204 m; 136 m; 9.1 m out | Report, "Structure" and "Detailed Description"; Samuel Halpern, "Titanic's Hidden Deck" (Titanic Research, Encyclopedia Titanica, 8 April 2005), as reposted at https://hercolano2.blogspot.com/2012/04/titanic-double-bottom.html | (paraphrase) | High |
| Transverse divisions | practically at the main bulkheads, plus one under the middle of the reciprocating engine room (K-L) [read] | - | Report, "Detailed Description" | (paraphrase) | High |
| Between compartments | no sluice valves or other means of letting water from one compartment to another [read]; Wilding: sluice valves are found in some warships, not in Harland & Wolff merchant practice (BI 20375-20379) [read] | - | Report, "Detailed Description"; Wilding, BI 20375-20379 (Day 19), https://www.titanicinquiry.org/BOTInq/BOTInq19Wilding03.php | "There were no sluice valves" | High |
| Suctions | 14 compartments with 8-in suctions, 23 with 6-in, 3 with 5-in, all on the 10-in ballast main; 6 used only for fresh water, with 4-in suctions to the fresh-water pumps [read]. 14 + 23 + 3 = 40 = 46 - 6, so both peak tanks are on the ballast main [derived] | 203, 152, 127 mm; 102 mm | Report, "Pumping Arrangements"; Wilding, BI 20472 (Day 19), https://www.titanicinquiry.org/BOTInq/BOTInq19Wilding04.php | (paraphrase) | High (the peaks' connection is my arithmetic) |
| Total water ballast | 5,754 tons, including the peak tanks and the double-bottom tanks usually used for fresh water, which could take water ballast if required (BI 20996-20998) [read] | 5,846 t; 5,704 m3 [derived] | Edward Wilding (Harland & Wolff), BI 20994-20999 (Day 20), https://www.titanicinquiry.org/BOTInq/BOTInq20Wilding03.php | (paraphrase; Wilding's one quote is in item 4 of the summary) | High |
| Peak tanks | fore peak 190 tons, after peak 115 tons (BI 20999) [read] | 193.0 t, 188 m3; 116.8 t, 114 m3 | Wilding, BI 20999 | (paraphrase) | High |
| Peaks' role and extent | "Forepeak tank - not used except for trimming ship" (hold level, bow to A); after peak tank for trimming ship (hold and orlop to G deck, P to stern) [read]; the orlop in the forepeak tank and G deck in the after peak were watertight flats [read]; no inner bottom in the peaks: the peak tank goes down to the shell (Wilding BI 20032) [read] | fore peak tank z 0 to the orlop, about 7.3 m (the orlop in hold 3 is 24 ft above the keel [read: Report, "Flooding"]); after peak tank z 0 to G deck, about 9.8 m [bet] | Report, "Watertight Compartments", https://www.titanicinquiry.org/BOTInq/BOTReport/botRepWC.php; "Structure"; Wilding BI 20032 | (table wording, given above) | High for the role; the deck heights are bets |
| Use of the bottom tanks | for ballast and fresh water; those in the way of the boiler rooms for sea water only; most of the others available for fresh water (BI 20035-20037) [read] | - | Wilding, BI 20035-20037 | (paraphrase) | High |
| Deep and trimming tanks | none besides the peaks; hold 3 (C-D) was the bunker hold, alternatively coal and cargo [read]. Caution: a search digest put a 1,950-ton deep ballast tank in "No. 3 hold"; that is the Empress of Ireland's inquiry (Hillhouse), not Titanic [search summary] | - | Report, "Watertight Compartments"; titanicinquiry.org, Empress of Ireland inquiry, https://www.titanicinquiry.org/eoi/08hillhouse2.php (seen only in a digest) | (paraphrase) | High |
| The 44 + 2 | 44 tanks in the double bottom, numbered 1 to 15 from forward with port, starboard and wing (WT) tanks, plus the two peaks; a capacity table "[P&S totals]" whose 25 entries sum to 5,754 LT [read; sum derived]. The two peaks "could be used to adjust longitudinal trim" by shifting ballast [read] | - | Halpern, "Titanic's Hidden Deck" (reposted, above); his sources include the Report, The Shipbuilder (1911), Engineering (26 May 1911) and a Harland & Wolff drawing-office notebook | "These tanks could be used to adjust longitudinal trim" | High: the table's total equals Wilding's sworn figure, so it is almost certainly the builder's capacity list |
| Tanks to rooms | tank 5 under BR5; tanks 6 to 9 under BR4, BR3, BR2, BR1; tank 10 under the reciprocating engine room [read]; so tanks 1-3 under holds 1-3 and 4 under BR6, and 11-15 aft as in 1.2 [derived from the count and the extra K-L division] | - | Halpern, "Titanic's Hidden Deck" | (paraphrase) | High for 5 to 10, medium-high for the rest |

### 1.2 Tank by tank

Capacities are Halpern's, port and starboard together; x is the midpoint of the bounding bulkheads [derived]; tonnes and cubic metres [derived]. Content: WB = water ballast (sea water), FW = fresh water.

| Tank | Under | Bounded by | x centre (m) | LT | t | m3 | Usual content (Halpern) | Compartments (P/S/wing) |
|---|---|---|---|---|---|---|---|---|
| Fore peak | forepeak (no double bottom) | forward perpendicular to A, shell to orlop | +122.5 (volume centroid probably nearer A, about +121 [bet]) | 190 | 193.0 | 188.3 | WB, trimming only | 1 |
| 1 | hold 1 | A-B | +108.7 | 71 | 72.1 | 70.4 | WB or FW (69 FW) | 1 |
| 2 | hold 2 | B-C | +94.0 | 113 | 114.8 | 112.0 | WB or FW (110 FW) | 2 |
| 3 | hold 3 | C-D | +78.5 | 210 | 213.4 | 208.2 | WB or FW (204 FW) | 2 |
| 4 | BR6 | D-E | +62.5 | 314 | 319.0 | 311.3 | WB | 2 |
| 4 wings | BR6 | D-E | +62.5 | 122 | 124.0 | 120.9 | WB | 2 |
| 5 | BR5 | E-F | +45.6 | 408 | 414.5 | 404.4 | WB | 2 |
| 5 wings | BR5 | E-F | +45.6 | 164 | 166.6 | 162.6 | WB | 2 |
| 6 | BR4 | F-G | +28.2 | 445 | 452.1 | 441.1 | WB | 2 |
| 6 wings | BR4 | F-G | +28.2 | 186 | 189.0 | 184.4 | WB | 2 |
| 7 | BR3 | G-H | +10.8 | 456 | 463.3 | 452.0 | WB | 2 |
| 7 wings | BR3 | G-H | +10.8 | 198 | 201.2 | 196.3 | WB | 2 |
| 8 | BR2 | H-J | -7.0 | 482 | 489.7 | 477.8 | WB | 2 |
| 8 wings | BR2 | H-J | -7.0 | 200 | 203.2 | 198.3 | WB | 2 |
| 9 | BR1 | J-K | -21.6 | 272 | 276.4 | 269.6 | WB | 2 |
| 9 wings | BR1 | J-K | -21.6 | 98 | 99.6 | 97.1 | WB | 2 |
| 10 | reciprocating engine room, forward half | K to mid K-L | -32.4 | 304 | 308.9 | 301.3 | FW only | 2 |
| 11 | reciprocating engine room, after half | mid K-L to L | -42.9 | 338 | 343.4 | 335.0 | FW only | 2 |
| 10-11 wings | reciprocating engine room | K-L | -37.7 | 182 | 184.9 | 180.4 | WB | 2 |
| 12 | turbine room | L-M | -56.9 | 360 | 365.8 | 356.9 | FW only | 2 |
| 12 wings | turbine room | L-M | -56.9 | 100 | 101.6 | 99.1 | WB | 2 |
| 13 | electric engine room | M-N | -75.1 | 271 | 275.3 | 268.6 | WB or FW (263 FW) | 2 |
| 14 | shaft tunnel | N-O | -93.0 | 118 | 119.9 | 117.0 | WB or FW (114 FW) | 2 |
| 15 | after shaft tunnel | O to two-thirds of O-P | -107.0 | 37 | 37.6 | 36.7 | WB or FW (36 FW) | 1 |
| After peak | after peak | P to the stern, shell to G deck | -124.1 | 115 | 116.8 | 114.0 | WB, trimming only | 1 |
| **Total** | | | | **5,754** | **5,846.4** | **5,703.8** | | **46** |

Groups [derived]: sea water only (4-9 and all wings) 3,627 LT; dual (1-3, 13-15) 820 LT; fresh water only (10-12) 1,002 LT; peaks 305 LT. The compartment count (1 + 2 + 2 + 24 + 6 + 4 + 2 + 2 + 1 + 2 peaks = 46) matches the Report.

Vertical centres [derived for the centre tanks, bet for the rest]: centre tanks z = 0.8 m (half of 1.60 m; 1.0 m for tanks 10 and 11 under the 78-in floors); wing tanks, where the margin rises to 2.13 m, about 1.1 m; fore peak tank about 4.5 m (a V-shaped space from the keel to the orlop puts its centroid above mid-height); after peak about 6 m. Wing tanks lie outboard of the side bulkheads about 30 ft (9.1 m) out [read]; their centroid about 11 m from the centre line [bet].

### 1.3 Fresh-water and feed tanks

| Figure | Value | SI | Source | Tag | Confidence |
|---|---|---|---|---|---|
| Double-bottom fresh water only | tanks 10, 11, 12 (Halpern): 1,002 LT as sea water, about 974 LT of fresh water | about 990 t of fresh water [derived] | Halpern, "Hidden Deck" | [read + derived] | Medium-high (Wilding names other tanks: section 8) |
| Dual tanks | 1, 2, 3, 13, 14, 15: 796 LT of fresh water if all held it | 809 t | Halpern | [read + derived] | Medium-high |
| Above the double bottom | three pairs beside the electric engine room, 155, 149 and 92 LT a side from forward (792 LT); one just aft of bulkhead C, up to the orlop, 170 LT: seven tanks, 962 LT [read]. The Report: the structure round the electric machinery formed six separate watertight compartments used for fresh water [read] | 805 t at x about -69, -75, -82 m (three equal lengths of M-N [bet]); 173 t at about x = +83 m [bet] | Halpern; Report, "Structure" | [read] | High |
| Feed tanks | the air pumps discharged to two feed tanks in the turbine room [read]; capacity NOT FOUND. Three evaporators, 60 tons of distilled water a day each (plant sheet §9) [read]. Some bottom tanks held fresh water for the boilers (TRMA) [read] | - | Report, "Machinery", https://www.titanicinquiry.org/BOTInq/BOTReport/botRepMach.php; TRMA, "Titanic's Double Bottom" (Tech Feature, June 2005), https://trmaarchive.com/articles/tech/TechFeatureJune2005.htm | [read] | Medium. Which tanks were the boilers' reserve feed is not said; tanks 10-12, beside the feed pumps, are my guess [bet] |
| Fresh-water capacity, all | up to about 2,730 LT if every dual tank held fresh water | about 2,800 t | sum of the above | [derived] | - |

### 1.4 What the tanks held on 14 April

- **No source gives the contents on the night.** The Report, both inquiries' witnesses and the researchers I could read are silent [read, as absence].
- **Practice (Wilding, BI 20038-20040) [read]:** asked whether the tanks were full or empty on this voyage, he said one or two would be full as she neared the end of the voyage; all fresh-water tanks were full when she left and were drawn down on the way; salt water was not put into the fresh-water tanks, but was put into some of the salt-water tanks to keep the stability.
- **Practice (TRMA) [read]:** as coal was burned, sea water was taken in to offset the weight and keep the stability. A secondary page, no source given.
- **Draughts.** Leaving Southampton: 33 ft 8 in forward, 34 ft 4 in aft (the Attorney-General's opening, BI Day 2, https://www.titanicinquiry.org/BOTInq/BOTInq02Header.php) [read]: mean 34 ft 0 in, 8 in by the stern [derived]. On 14 April: Wilding's estimated mean of about 32 ft 3 in, 28 in under the 34 ft 7 in load draught, which at 143.8 LT an inch (Harland & Wolff's "Particulars of Completed Ships", as cited by Halpern) is 4,026 LT consumed; displacement about 48,300 LT [search summary: Halpern's "A Matter of Stability and Trim", PDF not opened]. The model's mass properties use 30 ft 9 in forward, 33 ft 9 in aft (README) [read].
- **What that implies [derived].** At departure she was about 7 in, about 1,000 LT, under her load displacement; 4.5 days of coal (about 2,800 to 3,400 LT, plant sheet §3), water and stores take her to about 32 ft 3 in with nothing added. So Wilding's figure assumes, or shows, no water ballast taken since Southampton. The deepening trim by the stern (8 in at departure, 3 ft in the model) fits fresh water drawn from the forward tanks and coal from the forward bunkers, but no source says so [bet].
- **The forepeak tank** was holed at the bottom and flooded to its top (the orlop), and no further while the bow was up [read: Report, "The Flooding in the first 10 Minutes", https://www.titanicinquiry.org/BOTInq/BOTReport/botRepFlooding.php: "from the hole in the bottom of the peak tank"]. Whatever it held, it was sea water from T 0.
- **Double-bottom tanks under the damaged rooms:** the damage was about 10 ft above the keel (Report, "Extent of the Damage", https://www.titanicinquiry.org/BOTInq/BOTReport/botRepExtent.php) [read], above a 5-ft tank top, so tanks 1 to 5 were probably intact [derived]; Halpern judges damage to the double bottom as far aft as BR4 highly unlikely [read: "Where Did That Water Come From?", https://www.titanicology.com/FloodingInBR4.html]; Brown's grounding reconstruction would breach them [read: plant and steering sheets, Brown 2000]. Wilding's flooding plans assumed the double-bottom tanks of the flooded compartments flooded (BI 20299) [read].
- **For the model [bet]:** sea-water tanks empty at the collision; fresh-water tanks part full, the forward ones (1-3 and the 170-LT tank aft of C) the emptiest. The total is fixed by the model's displacement, so this choice only places weight that the mass properties already hold.

## 2. Filling and emptying

| Figure | Value | Source | Tag | Confidence |
|---|---|---|---|---|
| Ballast main | a 10-in main ballast pipe fore and aft, with separate connections to each tank and "filling pipes from the sea connected at intervals for trimming purposes" | Report, "Machinery" | [read] | High |
| Pumps | the five ballast-and-bilge pumps (250 LT/h each) drew from the ballast main; two of them in the reciprocating engine room, three in pump rooms in BR5, BR3 and BR2 (pumps note §1) | Report, "Machinery"; pumps note | [read] | High |
| Valves | the valves of the forward bilge and ballast suctions were in the firemen's passage (the watertight pipe tunnel from BR6 to the after end of hold 1); valves on the mains were worked from above by rods and wheels at the bulkhead deck | Report, "Pumping Arrangements" | [read] | High |
| The passage | water rushing in at its bottom about 5 minutes after the collision | Report, "Flooding" | [read] | High: from T 5 the forward tanks (1-3, the fore peak, tank 4 probably) could be neither filled nor pumped |
| Speed | the pipe arrangements for flooding a bottom space act comparatively slowly; it would take a long time to correct a list that way; Harland & Wolff had discouraged automatic cross-flooding fittings in recent years (BI 20230-20232) | Wilding, Day 19, https://www.titanicinquiry.org/BOTInq/BOTInq19Wilding01.php | [read] "act comparatively slowly" | High as an expert's statement; no rate given |
| Practice | tanks are usually run up from the sea by gravity and topped off by pumping | an IMarEST paper on bilge and ballast systems, seen only in a digest | [search summary] | Medium (general) |
| Fresh-water tanks | 4-in suctions to the fresh-water pumps; pump capacity NOT FOUND | Report; Wilding BI 20472 | [read] | - |
| Sea filling pipes' size and the sea valves' places | NOT FOUND | - | - | - |

**Rates by gravity [derived, with bets marked].** Flow through a pipe of area A under a head H (the sea level outside above the water in the tank) is Q = A sqrt(2gH/(1+K)), K the loss coefficient of inlet, valves, bends and pipe. Aft, the draught is about 10.3 m and a tank fills from about z = 0.8 m, so H is about 9.5 m and sqrt(2gH) = 13.7 m/s; with K = 3 to 10 [bet], the velocity is 6.8 to 4.1 m/s:

| Pipe | Area (m2) | Flow (m3/s) | Flow (t/h) |
|---|---|---|---|
| 10-in main | 0.0507 | 0.35 to 0.21 | 1,280 to 770 |
| 8-in branch | 0.0324 | 0.22 to 0.13 | 820 to 490 |
| 6-in branch | 0.0182 | 0.12 to 0.075 | 460 to 280 |
| 5-in branch | 0.0127 | 0.087 to 0.052 | 320 to 190 |

(1 m3/s of sea water = 3,690 t/h.) The flow falls as a tank fills, slowly, because the head is 9 m against a tank 1.6 m deep.

**800 t into the after tanks [derived + bet].** The six after tanks that can take sea water (the after peak, the 10-11 and 12 wing tanks, and tanks 13, 14 and 15 once empty of fresh water) hold 836 t (823 LT). Fed through one 10-in main from one or two sea inlets, the main caps the flow at about 770 to 1,280 t/h: **40 to 65 minutes of flow**. Setting the valves (sea valves below, branch valves by rod and wheel from the bulkhead deck) by two or three men: **10 to 20 minutes** [bet]. **About an hour from the order**, consistent with Wilding's "comparatively slowly". The ballast pumps add little: pushing sea water into the same main they meet the same cap [derived]; and they are the same 250s the bilges needed [read: pumps note].

**Emptying [derived].** The five 250s together are 1,270 t/h, but drawing through one 10-in main at 2.5 to 3 m/s they get 470 to 560 t/h [derived]; and only for tanks whose valves can be reached, which after T 5 excludes the forward ones.

**What 836 t aft does to her trim [derived; inputs marked].** Inputs: displacement 49,075 t (48,300 LT [search summary]); tonnes per centimetre 57.5 (143.8 LT an inch [search summary]; waterplane 5,610 m2 [derived]); LCF at x = -5 m [bet]; MCT 880 t.m/cm, range 800 to 960 [bet: longitudinal waterplane inertia from Cwp = 0.768 by two textbook approximations]. Intact-ship hydrostatics; the damaged ship's waterplane is smaller and its pivot further aft, which I checked changes the results below by under 2 cm (LCF -15 m, MCT 700, waterplane 4,600 m2).

| Case | Weight | Moment about amidships | Sinkage | Trim change | Draught change at FP / D / E / F / G / AP (m) |
|---|---|---|---|---|---|
| A: fill the six after tanks that take sea water | +836 t at x = -75.4 m | -63,100 t.m | +0.145 m | 0.67 m by the stern (0.61 to 0.74) | -0.20 / -0.05 / -0.01 / +0.04 / +0.08 / +0.47 |
| B: pump the fresh water out of tanks 1-3, if full | -389 t (383 LT) at x = +88.4 m | -34,400 t.m | -0.068 m | 0.41 m by the stern | -0.28 / -0.19 / -0.16 / -0.14 / -0.11 / +0.13 |
| C: flood both after tunnel compartments and the holds over them, illustrative | +5,000 t at x = -100 m [bet] | -500,000 t.m | +0.87 m | about 5.4 m by the stern (beyond small-angle trim; indicative) | -1.9 / -0.7 / -0.37 / 0.00 / +0.36 / +3.5 |

Reading [derived]: what drowns her is water over the E-deck tops of bulkheads E, F and G as the bow goes down. Those bulkheads lie 20 to 60 m forward of the pivot, where trimming by the stern and sinking under the added weight nearly cancel. Case A changes their freeboard by 1 to 8 cm, the wrong way at F and G; at her late rate of sinking by the head (the trim went from 4 to 10 degrees between 1:20 and 2:15, README: about 0.12 m a minute at bulkhead E) that is well under a minute either way. Case B, with less than half the weight, raises E and F by 13 to 16 cm, which is 1 to 5 minutes depending on the hour (0.12 m a minute late, about 0.03 m a minute between 12:10 and 1:20 [derived]); but it was out of reach (valves in the flooded passage; contents unknown). Case C raises bulkhead E by 0.37 m and leaves F where it was, while it spends the stern's reserve buoyancy, which is what kept her up at the end; and nothing aboard could flood a whole compartment quickly (no sluice valves; the bilge suctions are made to pump out, not to let in [bet]).

**What the tanks could do: the list [derived].** The starboard wing tanks under BR6 to BR1 hold (122 + 164 + 186 + 198 + 200 + 98)/2 = 484 LT, 492 t, about 11 m from the centre line [bet]: 5,400 t.m. With GM 0.8 m (Hackett and Bedford, README) that rights tan(phi) = 5,400/(49,075 x 0.8) = 0.138, about 8 degrees; with GM 0.5 m, about 12 degrees. At 300 to 800 t/h that is 40 to 100 minutes of filling: to meet the port list of 1:50 to 2:05 (T 130 to 145), it must be ordered by about 12:45 (T 65). The weight added low also raises GM by roughly w(KG - z)/displacement, about 0.15 to 0.25 m if KG is 15 m [bet]. The Court said the same in general terms: with longitudinal subdivision she would have floated with a list that water ballast in suitable places could have corrected (Report, "Effect of Additional Subdivision", https://www.titanicinquiry.org/BOTInq/BOTReport/botRepSubdiv.php) [read].

## 3. What was done on the night beyond the pumps

### 3.1 Ballast, trimming and counter-flooding: nothing on record

- **Evidence of absence [read, as absence].** The witnesses from below (Barrett, Beauchamp, Hendrickson, Dillon, Cavell, Ranger, Scott), the officers (Lightoller, Boxhall, Pitman, Lowe, Olliver) and the stewards I read speak of doors, pumps, valves, fires, fans, lights and boats, never of ballast or trimming. The Report's narrative of the night ("Flooding", "Gradual Effect", "Final Effect", "Observations") and the Attorney-General's summing-up (Day 35, https://www.titanicinquiry.org/BOTInq/BOTInq35Arguments02.php) have none. A site-restricted search of titanicinquiry.org for "ballast" returned only Wilding's capacity evidence, the Report's description of the plant and Barrett's pump room [search summary].
- **Why it is unlikely to have happened unrecorded [derived].** The forward valves were under water from T 5; the survivors from below cover the rooms forward of the engine room to about T 100, and none saw it; every engineer died, so what was done aft or after T 100 is unknown; and the one man aboard who knew the tanks, Andrews, gave her under two hours (PBS, "Abandoning the Titanic", 2020) [read], which leaves nothing for an hour-long tank operation to buy.
- **One near miss:** Barrett lifted a manhole plate in BR5 on Harvey's order "to get at the valves" (BI 2024-2026) [read]; the pumps note reads these as bilge-suction valves [bet]. Nothing ties them to ballast.

### 3.2 The engineers' work

| Time (T) | Room | What was done | Witness or source | Tag |
|---|---|---|---|---|
| 0 | BR6 and the others | at the red "Stop", dampers shut to take the wind off the fires | Barrett, BI 1860-1867 (plant sheet §4) | [read] |
| 0-3 | all | tank-top doors dropped from the bridge (section 4) | Boxhall, Olliver, Barrett, Dillon, Scott | [read] |
| 0-15 | BR6 | abandoned at once (Report) or fires drawn for about 15 minutes with water over the plates (Beauchamp, stokehold 10) | Report, "Gradual Effect"; Beauchamp BI 657-680 (plant sheet §4) | [read] |
| 0-60 | BR5 | Barrett dropped the bunker door when water came into the empty starboard bunker; pumps opened by the steam valve in the pump room | Barrett BI 2065, 2108-2111 | [read] |
| about 10-30 | BR5 | boilers blew their water out through the safety valves; 30 fires drawn by 15 to 20 men in about 20 minutes on Second Engineer Harvey's order | Barrett BI 2008-2020; Hendrickson BI 4904-4911 (plant sheet §4) | [read] |
| from about 15 | all | the order to keep steam up, later to draw the fires as far as possible | Dillon BI 3756-3762 | [read] |
| from about 15, for about 45 min | F deck fan rooms | 45 electric fans stopped by order, stokehold fans first | Ranger BI 4008-4023 (plant sheet §5) | [read] |
| 0-60 | all | steam roaring off the boilers through the first hour: the safety valves lifted when the engines stopped with the fires in (no witness says they were lifted by hand); 12:26 wireless "cannot hear for noise of steam" | Lightoller BI 13797-13824; Report, "Means taken" (plant sheet §4) | [read] |
| about 30 | engine room to BR4 | doors K, J, H, G raised by hand (section 4) | Dillon | [read] |
| about 30-35 | tunnel | door O raised 2 ft to free the tunnel greaser | Scott | [read] |
| about 45-60 | BR5 | manhole plate lifted for the valves; Shepherd broke his leg; a rush of water through the pass (the bunker door burst) about T 60 (Report) or 1:10 (Barrett); men sent up | Barrett BI 2024-2062 | [read] |
| about 60-65 | engine rooms aft | doors L, M, N, O raised fully; the 10-in suction pipe fetched from the last tunnel but one, four men to carry it | Scott BI 5584-5605 | [read] |
| to 100 | BR4 | fires partly drawn; water rising slowly from under the plates, about a foot when left at 1:20 | Cavell BI 4214-4265; Dillon BI 3816-3827 | [read] |
| to about 137 (2:17) | BR2, BR3 (inferred), electric engine room | steam kept for the dynamos; lights to the end; the emergency set running | plant sheet §4-5 | [read] + [derived] |
| wreck, 2025 | BR2 | the 3D scan for "Titanic: The Digital Resurrection" (National Geographic) shows a steam valve open and boilers dished as if under steam when they went under | press reports of the documentary | [search summary] |

## 4. The watertight doors as a schedule

### 4.1 The doors and how they worked

| Figure | Value | SI | Source | Short quote | Tag, confidence |
|---|---|---|---|---|---|
| Vertical doors | twelve vertical sliding doors completed bulkheads D to O at the floor of the boiler and engine rooms: one in each of D, E, F, G, H, J, K, L, M, N, O, and a second at the after end of the watertight passage through the bunker just aft of D, so that two doors in series guarded BR6 | - | Report, "Detailed Description" and "Watertight Compartments" (table and footnotes) | (paraphrase) | [read] High |
| Where in E to J | not on the bulkhead but at the end of a watertight passage about 9 ft long leading from the bulkhead through the cross-bunker into the room | 2.74 m | Report, "Watertight Compartments", footnote | (paraphrase) | [read] High. Which room the passage opens into is not said; Barrett and Hesketh came through E into BR5 as it fell |
| Make and weight | Harland & Wolff's own type, working vertically; cast-iron door of heavy section, strongly ribbed; the big ones about 15 cwt; machined faces drawn together by six wedges a side in the last inch | about 760 kg | Report, "Structure"; Wilding BI 20432-20440 | (paraphrase) | [read] High |
| Held open | by a multiple-disc friction clutch, loaded by a weight on a bell-crank lever; anything that lifts the weight frees the door | - | Wilding BI 20448-20449 | (paraphrase) | [read] High |
| Three releases | a solenoid worked from the bridge, through multiplying gear; a float between the tank top and the floor; a hand release at working height beside the door | - | Wilding BI 20450 | (paraphrase) | [read] High |
| Bridge procedure | press the bell for 10 s to give the alarm, then put the switch on and keep it there; no mechanical operation while the switch is on | 10 s | notice on the bridge apparatus, read into the record during Dillon's evidence (Day 5), https://www.titanicinquiry.org/BOTInq/BOTInq05Dillon02.php | "Doors cannot, however, be operated mechanically whilst switch is on." | [read] High |
| Closing time | 25 to 30 seconds, governed by cataracts | 25-30 s | Report, "Structure" | (paraphrase) | [read] High. This sources the plant sheet's "25-30 s, unsourced" |
| Fall profile | slow at first, the cataract's fluid leaking past its piston, so nobody in the doorway is hurt; a bypass frees the last 18 in to 2 ft, which fall quickly | last 0.46-0.61 m fast | Wilding BI 20441-20443 | (paraphrase) | [read] High |
| Against a rush | closes against inflow: on Olympic (Hawke, 1911) door O in the tunnel was released while water came through; 300 or 400 tons came through and put about 3 ft into the next section forward before it shut | 305-406 t; 0.9 m | Wilding BI 20445-20447 | (paraphrase) | [read] High |
| Obstacles | falling free, it knocks a piece of coal aside | - | Wilding BI 20438-20440 | (paraphrase) | [read] High; a hose or pipe across the sill is not discussed |
| Floats | a cylinder about 18 by 12 in, below the plates and above the tank top; it releases the door when water rises 18 in to 2 ft, depending on the room, whatever the bridge has done; a rush does not hinder it | 0.46 x 0.30 m; trips at 0.46-0.61 m over the tank top | Wilding BI 20451-20456 | (paraphrase) | [read] High. The Report: the float acts in whichever of the two rooms is flooding |
| Raising | by hand only, with a pump handle or pump wheel, two or three men; one door at a time; the bridge switch must be off first | about 1.8 m of lift | Dillon BI 3742-3744, 3963-3966; Scott BI 5559-5572; the notice | (paraphrase) | [read] High |
| Time to raise | not stated by a witness. Halpern allows 15 to 20 minutes to crank four doors fully up, walking between them [read; his estimate]; Scott and his mate freed the greaser and were back in the engine room in about 10 minutes (BI 5636) [read] | about 4-5 min a door [derived] | Halpern, "Where Did That Water Come From?"; Scott | (paraphrase) | Medium |
| Raised height | fully up, just over 6 ft: a man walks through without stooping | over 1.83 m | Scott BI 5592-5593, https://www.titanicinquiry.org/BOTInq/BOTInq06Scott01.php | "Just over 6 feet, I think." | [read] High |
| Bridge indication | none: Olliver saw Murdoch turn the lever and never saw an instrument showing the doors' state, though he would have | - | Olliver, US Day 7, https://www.titanicinquiry.org/USInq/AmInq07Olliver01.php | (paraphrase) | [read] Medium-high. The bridge did not know which doors stood open |
| Hand gear from above | each between-deck door and each vertical tank-top door could also be worked by ordinary hand gear from the deck above the bulkhead top; plates on the alleyway sides marked the deck plates; a box spanner for each door hung in clips beside its deck plate | - | titanicology, "Titanic's Watertight Doors and Bulkheads", https://www.titanicology.com/WatertightDoorsAndBulkheads.html; GG Archives, "The Structure of the Titanic" (citing the Congressional Serial Set, 1912, p. 571), https://www.ggarchives.com/OT/Titanic/01-PlanningBuildingLaunching/Structure.html | (paraphrase) | [read] Medium: two secondary pages with the same period wording; the Report's online "Structure" page lacks these sentences |
| Horizontal doors | all doors except those in the engine and boiler rooms slid horizontally, workable by hand at the door and at the deck above; E-deck doors of wrought-steel plate; F-deck doors and the orlop door aft of heavy ribbed cast iron; no doors in the G-deck bulkheads | - | Report, "Detailed Description"; titanicology | (paraphrase) | [read] High |
| Horizontal doors, by bulkhead | F deck (bulkhead between F and E): C 1, D 1, E 1, F 2, G 1, H 2, J 2, M 1, N 1 (12); E deck (between E and D, only in K to O, the bulkheads that rise to D): K 2, L 2, M 2, N 2, O 1 (9); orlop: N 1, to the refrigerated stores (1). A, B and P had no openings | - | Report, "Watertight Compartments", table; "Detailed Description" | (table) | [read] High for the counts; the online table prints "1-" for E and G on F deck, read here as 1 |
| No floats on them | the alleyway doors did not shut by themselves | - | Joughin BI 6335 | (paraphrase) | [read] High |
| E deck forward of K | no watertight doors: bulkheads C to J stop at E deck, so Scotland Road and the alleyways pass over them; a non-watertight iron door closed the forward end of the starboard E-deck alleyway | - | Report, table; Boxhall BI 15761-15763 and Sir Robert Finlay's correction, https://www.titanicinquiry.org/BOTInq/BOTInq13Boxhall03.php; Wilding BI 20248-20249 | (paraphrase) | [read] High |
| Door sizes | NOT FOUND (the ET chart refused the fetch). The vertical doors stood over 6 ft high when raised (Scott) | - | - | - | - |

### 4.2 The 1912 record, door by door

T is minutes after 11:40 p.m. "Floats armed" means the door was up with nothing known to stop its float from dropping it.

| Door | Bulkhead and deck | Between | Kind | Closed | Raised again | Closed again | Witness (question) | Tag |
|---|---|---|---|---|---|---|---|---|
| D1 | D, tank top | firemen's passage (hold 3) and the bunker passage | vertical, bridge | T 0-1, from the bridge | no | - | Boxhall BI 15352-15355; Report, "Gradual Effect" | [read] + [derived: no evidence of reopening forward of BR4] |
| D2 | D, after end of the bunker passage, tank top | bunker passage and BR6 | vertical, bridge | T 0-1 | no | - | as D1 | [read] + [derived] |
| E | E, end of 9-ft bunker passage | BR6 and BR5 | vertical | T 0-1: Barrett and Second Engineer Hesketh jumped through into BR5 as it came down | no | - | Barrett BI 1905-1916, US Day 18 (plant sheet §4) | [read] |
| F | F, end of bunker passage | BR5 and BR4 | vertical | T 0-3 | no: the party stopped at BR4, Dillon supposing too much water in BR5 | - | Dillon BI 3786, 3968-3980; Report, "Observations" (all reopened except those forward of No. 4) | [read] |
| G | G, end of bunker passage | BR4 and BR3 | vertical | T 0-3 | yes, by hand, from about T 30-45 (Dillon's party, last of the four) | no record; floats armed: BR4's water stood about 3.5 ft over the tank top by T 100 (plates about 2.5 ft up, Halpern; a foot over them, Cavell), past the 18-24 in trip, which lies below the plates: so the float would have dropped G before T 100, probably before any water showed over the plates, if nothing held it [derived] | Dillon BI 3790-3800, 3913-3917; Halpern | [read] + [derived] |
| H | H, end of bunker passage | BR3 and BR2 | vertical | T 0-3 | yes, from about T 30-40 | no record; BR3 dry at T 100 | Dillon | [read] |
| J | J, end of bunker passage | BR2 and BR1 | vertical | T 0-3 | yes, from about T 30-35 | no record | Dillon | [read] |
| K | K, tank top | BR1 and reciprocating engine room | vertical | T 0-3 (Dillon: about three minutes; closed from the bridge, he agreed) | yes, from about T 30, first: three men on the pump handle, first just high enough to get under | no record | Dillon BI 3735-3745, 3963-3966 | [read] |
| L | L, tank top | reciprocating engine room and turbine room | vertical | T 0-3, with no bell heard (Scott) | yes, fully up, about T 60-65, on the order of the engineer of the watch | never, as far as Scott knew | Scott BI 5546-5553, 5584-5600 | [read] |
| M | M, tank top | turbine room and electric engine room | vertical | T 0-3 | yes, about T 60-65 (the one on the after side of the turbine room) | never | Scott BI 5586-5599 | [read] |
| N | N, tank top | electric engine room and shaft tunnel (N-O) | vertical | T 0-3 | yes, about T 60-65 | never | Scott BI 5594-5599 | [read] |
| O | O, tank top | shaft tunnel and after tunnel (O-P) | vertical | T 0-3 | about 2 ft at about T 30-35 by Scott and his mate, without orders, to let the tunnel greaser out; then fully at about T 60-65 | never | Scott BI 5554-5580, 5628-5639 | [read] |
| F-deck C | C, F deck, port side | hold 2 and hold 3 spaces on F deck | horizontal, by hand | open at about T 5-10; later unknown | - | - | Boxhall BI 15754-15760 | [read]. Boxhall: "Not then, My Lord." |
| F-deck D | D, F deck, port side | hold 3 and BR6 spaces on F deck | horizontal | open at about T 5-10; later unknown | - | - | Boxhall BI 15754-15760 | [read] |
| F-deck F (2) | F, F deck, starboard, by the Turkish baths | swimming-bath space (over BR5) and Turkish baths (over BR4) | horizontal: the inner one by hand at the door, the outer one from E deck with a key | about T 15-21, by Wheat, with Dodd and Crosby, on his own initiative, no order heard | - | - | Wheat BI 10901, 10922-10941, https://www.titanicinquiry.org/BOTInq/BOTInq09Wheat01.php | [read]; the bulkhead is my reading: the pool lay over BR5 and the baths in the next compartment aft [search summary + derived]. Wheat: "they are closed with a key" |
| F-deck, the rest (E, G, H 2, J 2, M, N) | F deck | passenger and third-class blocks | horizontal | orders to close: the boatswain shouting along a passage at about T 7 (Etches, US Day 9); the second steward's order to close all F-deck doors at about T 15, the third-class chief steward's men sent (Mackay BI 10691-10695); outcome not witnessed; the Attorney-General thought the E and F deck doors "fairly plain" closed | - | - | Etches, https://www.titanicinquiry.org/USInq2/AmInq09Etches01.php; Mackay, https://www.titanicinquiry.org/BOTInq/BOTInq09Mackay01.php; Day 35 arguments | [read] |
| E-deck K to O (9) | K, L, M, N (2 each), O (1), E deck | after accommodation blocks | horizontal | an order in the alleyway to close all watertight doors (Brown BI 10669-10672, as summed up on Day 35); door No. 23 (the crew's skidoo door, for its number), forward of Joughin's room, was open when he last came below, after boat 10 had gone (about T 130 or later), two men setting about it with the large spanner kept in a clip by the door | - | - | Joughin BI 6226-6349, https://www.titanicinquiry.org/BOTInq/BOTInq06Joughin03.php; lifeboats note (boat 10 at about 1:50) | [read] + [derived for the time] |
| Orlop N | N, orlop | refrigerated stores | horizontal | no record | - | - | - | - |

Notes on the schedule:

- **When the bridge dropped them [read].** Boxhall reached the bridge to see Murdoch closing the doors at the lever; Murdoch told the captain he had closed them and had rung the warning bell (BI 15352-15355, https://www.titanicinquiry.org/BOTInq/BOTInq13Boxhall01.php); Olliver saw him at the lever just after she struck (US Day 7). Below, the times given run from instantly (Barrett) through about three minutes (Dillon) to under five (Beauchamp). Rule heard the electric bells in the fidley as the engines went astern; Scott heard none (plant sheet §7). Take T 0.5 for the switch and T 1 for the doors down [derived].
- **When the switch was put off [derived].** Raising by hand needs the switch off (the notice; Scott BI 5571-5572; the Commissioner and Attorney-General on Day 5). Dillon's party began at about T 30, so the bridge had put it off before then; somebody telephoned the bridge (Scott) [read + derived].
- **Dillon's times [read + derived].** About 1 h 40 min from the collision until he came back from BR4 (BI 3913), and 1 h 10 min from leaving the engine room until he started back (BI 3917): he left the engine room at about T 30. The Report: "Half an hour after the collision" the doors from the engine room to the stokeholds were opened as far forward as they could be ("Gradual Effect", https://www.titanicinquiry.org/BOTInq/BOTReport/botRepGradEff.php).
- **Why [read].** Dillon: so the engineers could get forward to the valves and pumps (BI 3800, 3971); Scott: to fetch the big suction pipe, and earlier to free the greaser (BI 5557, 5600). Dillon: "We opened them by hand." (BI 3804).
- **Scott's times [read].** The greaser was let out just over half an hour after the doors came down (BI 5630-5633); the trip took about ten minutes (5636); the order to heave all the doors up came about a quarter to one (5638), which the Attorney-General made 12:40 or 12:45. The Commissioner noted Scott's times ran against Dillon's.
- **Never reclosed by hand [read].** Dillon heard no order to reclose (BI 3921); Scott: never closed (5580, 5600); the Court found no evidence they were closed again, thought it probable the engineers below would have closed them as the water rose, and noted each door's float ("Observations", https://www.titanicinquiry.org/BOTInq/BOTReport/botRepObserv.php). The Attorney-General argued the floats would close the doors before the water rose over the stokehold plates, and that nothing showed they failed (Day 35).
- **The suction pipe across a sill [bet].** If the 10-in pipe was led through G (Halpern: Wilding's account has the portable piping across the BR3-BR4 door) the door would come down on it. A 15-cwt door falling the last 2 ft free would crush a leather or canvas hose but might not seal over it.

## 5. Other openings the crew controlled

| Opening | Where | Who could work it, and how | The 1912 record | Source | Tag |
|---|---|---|---|---|---|
| Coal-bunker doors | the doors from each stokehold into its bunkers | firemen and trimmers, by hand; not watertight | BR5's forward starboard bunker (empty, the old fire's bunker) took the sea 2 ft over the plates; Barrett dropped its door early; it burst about an hour after the collision, the door being weaker than the bunker's bulkhead | Barrett BI 2065, 2343-2344, https://www.titanicinquiry.org/BOTInq/BOTInq03Barrett02.php; Report, "Gradual Effect"; Wilding BI 20233-20234 (no watertight doors in the bunkers) | [read] |
| Firemen's passage | a watertight pipe tunnel from the foot of the firemen's spiral stairs (hold 1) aft through holds 1-3 to BR6, about 3.5 ft inside the shell; the forward bilge and ballast valves in it; a special 3.5-in suction with its valve rod led up above the load line | its after end was shut by D1 and D2 from the bridge; its forward end was the open spiral stair | holed: water rushing in at its bottom at about T 5; it then rose up the stair into the firemen's quarters (Lee BI 2485). Wilding: the Board of Trade would probably have refused a sealed staircase (BI 20386) | Report, "Pumping Arrangements", "Flooding", "Gradual Effect"; Hendrickson BI 4854-4895 (plant sheet §4) | [read] |
| Hatches | Nos. 1 and 2 in the forward well; trunks down through the decks; not watertight | deck crew could cover or trunk them; nothing done | water up No. 1 hatch at midnight (Lee BI 2455, 2479), round it on G deck mostly from starboard (Pitman BI 14962-14965). Wilding: trunking No. 1 hatchway would have made no difference in this case, at most five or ten minutes; trunking to G deck a few minutes (BI 20382-20391) | Report, "Gradual Effect"; Wilding BI 20382-20391 | [read] |
| Ports on E deck and below | side scuttles, opened by stewards and passengers | stewards, by hand, cabin by cabin | often kept open the whole passage on E deck; Joughin's was shut for the cold; no order to close them was given after the accident (BI 6312-6315); open ports seen as the bow went down (Mrs Ryerson's affidavit) [search summary]. The US Senate: the openings through E deck were not made for watertight closing, and flooding over E deck contributed largely to the sinking | Joughin, https://www.titanicinquiry.org/BOTInq/BOTInq06Joughin03.php; US Senate Report, https://www.titanicinquiry.org/USInq/USReport/AmInqRep05.php | [read]. Joughin: "Very, very often we keep them open the whole of the passage." US Report: "The openings through deck E were not designed for watertight closing" |
| Gangway doors | shell doors on D deck (the first-class entrance) and on E deck abreast the forward end of Scotland Road, one each side (Wilding BI 20474-20481) | deck crew, by hand | Lightoller ordered the forward doors opened to fill boats from below (BI 13958-13970); the boatswain went down with a party and was not seen again (Lightoller, US Day 1; Lowe, US); whether opened: no clear evidence (counsel). The wreck's forward port D-deck door stands open; National Geographic: crewmen pushed it open, the port list kept them from shutting it, and by 1:50 the sea was coming in through it | Lightoller, https://www.titanicinquiry.org/BOTInq/BOTInq12Lightoller02.php; Wilding BI 20474-20481; National Geographic Staff, "How the Titanic was lost and found" (22 Aug 2019), https://www.nationalgeographic.com/culture/article/titanic-lost-found | [read]; the wreck's open door [search summary]. NatGeo: "gravity prevented the crew from closing the massive door" |
| Stewards' room and alleyway doors on E deck forward | ordinary doors | anyone | the stewards' room doors were left open as the stewards came out, letting water across to port (Wilding BI 20250) | Wilding, https://www.titanicinquiry.org/BOTInq/BOTInq19Wilding02.php | [read] |

## 6. What might have been done: the literature

| Idea | Who argues it, where | Argument | Number given | Tag |
|---|---|---|---|---|
| Leave the doors open so she settles level | the British Court, "Observations" (1912) | water would have run aft through open doors; the bow kept up a little; the inflow reduced for a time | life "lengthened somewhat"; no figure | [read] |
| (same) | the Court, "Effect of Additional Subdivision" | shutting or not shutting the doors had no appreciable effect on the sinking; door placing to go to the Bulkhead Committee | none | [read] "any appreciable effect upon the sinking" |
| (same) | Wilding, BI 20360 | the scale of the sinking is too coarse to tell whether the doors were shut; shutting the F-deck doors (between E and F decks) changes it by a few minutes | 5 to 10 minutes | [read] |
| (same, popular form) | an older Wikipedia text on the theories: settling on an even keel, perhaps afloat until rescue; the 1998 Discovery documentary "Titanic: Secrets Revealed" reported to show she would instead capsize about 30 minutes before the actual time | the boiler rooms flood one after another along the tank top | capsize about 30 min early | [search summary]; neither the page nor the film opened |
| (same, against) | Tim Maltin, "107 #54" (2019), https://timmaltin.com/2019/04/05/titanic-watertight-doors/ | the reopening did not shorten her life: the floats would have dropped the doors when water reached them, as Wilding's Olympic case shows | none | [read] |
| (same, model) | this repository's README | water spreads aft low instead of tipping the bow | 2 h 59 min against 2 h 37 min (HANDOFF §7: 3 h 02 min) | [read] |
| (same, physics) | this note | a full-breadth slack room 17.4 m long and about 27 m wide has i = 17.4 x 27^3/12 = 28,500 m4, a GM loss of i/V = 28,500/47,900 = 0.6 m against GM 0.8 m; two at once take her past neutral (the boilers break the surface, so less) | - | [derived] |
| Counter-flood aft | J. David Rogers (Missouri S&T), "Nine Ways the Titanic Might Have Been Saved", Sigma Xi lecture abstract (1999-2001), https://web.mst.edu/rogersda/american&military_history/Nine%20Ways%20Titanic%20Might%20Have%20Been%20Saved-Abstract.pdf | counter-flood the after end to slow the intake | about 4.5 hours (an ET forum summary: 4 to 4.5) | [search summary]; method unknown |
| (against) | J. D. Baldwin, Usenet sci.military.naval, 16 Jan 1998, archived at https://www.yarchive.net/mil/titanic.html | would buy far less than two hours, and risky | under 2 h | [read]; forum quality |
| (against) | Wilding, BI 20230-20232 | the flooding arrangements act slowly; cross-flooding fittings were discouraged | - | [read] |
| (against) | this note, section 2 | the tanks hold 836 t aft; at the bulkheads that matter it changes the freeboard by centimetres; whole compartments would raise bulkhead E by about 0.4 m but not F, spend the stern's reserve buoyancy, and had no means of flooding | - | [derived] |
| Correct the list with water ballast | the Court, subdivision section (of a ship with longitudinal bulkheads) | a list from one-sided flooding could have been corrected by water ballast in suitable places | none | [read] |
| Collision mat or canvas over the damage | none in the record. Usenet, 1998: T. Buell asked whether leak sails could have cut the inflow enough to pump; Baldwin: a navy damage-control party would have patched and shored | the damage ran about 300 ft (Report), about 10 ft above the keel, 20-odd ft under water, as a string of openings; a mat is hauled down the side under the hole on hogging lines; Titanic's crew is not recorded with one or trying one. The Titanic Historical Society has crewmen rigging "collision mats" during the New York incident at Southampton, which in a docking near-miss means fenders | - | [read] for the absence and the Report; THS (E. S. Kamuda), https://titanichistoricalsociety.org/titanic-past-present/ [read] |
| (feasibility) | this note | one mat could have covered BR5's single leak (2 ft above the plates, 2 ft abaft E), which the pumps held anyway; nothing could cover the bow's 250 ft | - | [derived] |
| Go astern, or not ahead, to lessen the inflow | Olliver: the captain rang half speed ahead after she struck (US Day 7) [read]; D. G. Brown, "The Last Log of the Titanic" (2000): about 20 minutes of slow way toward Halifax forced water in (steering sheet) [read]; Louise Patten (2010): Ismay's order to go slow ahead sped the flooding (Old Salt Blog, https://oldsaltblog.com/did-a-steering-error-sink-the-titanic/) [search summary]; PBS "Secrets of the Dead: Abandoning the Titanic" (2020): water pressure forced Smith to stop about ten minutes after; a historian says she then moved again, pushing water at the damage [read] | ram pressure at forward-facing openings | none published (breach-inflow note T2) | mixed |
| (size) | this note | stagnation head at 10 kn is v^2/2g = 5.1^2/19.6 = 1.3 m against 7 to 9 m of static head: at most +8 % on the flow through a forward-facing hole while under way; at 3 kn astern, 0.12 m, under 2 % | minutes, not more | [derived] |
| Steam for the light | the MAIB reappraisal (1992): Californian 17 to 20 miles off at the collision (principal investigator's finding); the British Court: Californian could have reached Titanic had she tried when she saw the first rocket | Titanic stopped and sent boats toward the light | 17-20 nm | [search summary]; MAIB PDF not opened |
| (size) | this note | 17-20 nm at the 6 to 10 kn the four remaining lit rooms might give takes 1.7 to 3.3 hours; with the bow down every knot raises the inflow (above) | longer than her life | [derived] |
| Lighten her: move everyone aft | H. O. Kristensen (DTU), Ingeniøren, 20 Jan 2011, https://ing.dk/artikel/kunne-passagerernes-vaegt-have-reddet-titanic, citing Hackett and Bedford | 2,206 people at 75 kg is 165 t, against inflow of about 7 t/s | 24 s of inflow; "et klart NEJ" | [read] |
| Lighten her: jettison coal, anchors, cargo | Baldwin, Usenet 1998 | not enough time or men to shed weight that matters | - | [read]; forum |
| Lighten her: pump fresh water out forward | this note | 389 t from tanks 1-3 would raise bulkheads E and F by 13-16 cm | about 1 to 5 minutes, depending on the hour [derived from the README's trim rate] | [derived]; impossible after T 5 |
| Pumps everywhere | pumps note §3.3 and README | - | about 5 min as worked (2 to 11); 2.5 min in the model; 21 min with every pump on every suction | [derived] |
| Head-on, slower, higher bulkheads (not crew actions) | Wilding BI 20271-20272 (head-on: she would have come in); Paik, Kim and Thomas (2025) via BGR (head-on: four compartments, afloat); Wilding BI 20370-20374 (bulkheads to C deck: saved if BR4 undamaged, otherwise the end delayed perhaps an hour) | - | about an hour | [read] |
| Hackett and Bedford (RINA 1996), Marine Forensic Panel (SNAME 1997), TUHH (Dankowski 2013) | what-ifs on doors, ballast or counter-flooding: NOT FOUND in anything I could open; TUHH's page has none | - | - | - |

## 7. The doctrine of 1912

- **Close the doors at once, from the bridge, after the bell** (the notice on the apparatus) [read]. Murdoch did, within seconds, and reported it with the bell rung (Boxhall BI 15352-15355) [read].
- **Find the damage:** the captain sent the carpenter to sound the ship and went below with Andrews [read: Kamuda, THS; plant sheet]. Boxhall walked F deck looking for damage within minutes (BI 15358-15367) [read].
- **Engineers to their stations at the pumps and valves** (Dillon BI 3732) [read]; keep steam up; draw fires as the water rises so that cold water does not reach hot furnaces and crowns [read: Dillon; Barrett]; keep the dynamos for light and wireless (the pumps note and plant sheet).
- **Close the between-deck doors by hand**, by stewards and seamen with the spanners kept at the doors [read: Etches; Mackay; Wheat; Joughin].
- **Company rules:** White Star's "General Ship's Rules and Uniform Regulations" put the safety of passengers and ship first and had nothing on ice (Report, "The Sailing Orders", https://www.titanicinquiry.org/BOTInq/BOTReport/botRepOrders.php) [read]; a damage procedure from them was NOT FOUND. The Board of Trade approved the pumping plans (Wilding BI 20904-20905) [read].
- **Counter-flooding was a naval idea, aimed at list.** Wikipedia credits Makarov and Krylov with the early-20th-century work on floodability, including flooding undamaged compartments on the other side to right a list or fore and aft to bring the screws down (https://en.wikipedia.org/wiki/Ship_floodability) [read]; Krylov recalled that officials resisted it for decades [search summary]. Sluice valves existed in some warships and not in Harland & Wolff merchant practice; the firm had discouraged automatic cross-flooding because nothing in a coal bunker could be kept in working order; and a one-sided list made the boats on the high side useless (Wilding BI 20227-20232, 20377-20379) [read]. Collision mats were navy gear; Knight's "Modern Seamanship" (US Navy, from 1901) treated steam vessels [search summary]; no merchant manual I could reach covers them.
- **What nobody was trained to do** [derived]: I found no merchant drill of 1912 for trimming a damaged liner with her ballast; the builder's man aboard (Andrews) gave her under two hours (PBS) [read]; an hour-long tank operation had nothing to buy.

## 8. Conflicts

1. **Which double-bottom tanks were fresh water only.** Halpern's table: tanks 10, 11, 12 under the engine rooms (six compartments, matching the Report's six). Wilding, BI 20472: the tanks under holds 1-3 and 4-6, "the tanks outside the machinery space". Wilding's BI 20037 (boiler-room tanks sea water only, most others available for fresh water) fits both. Halpern's table has the builder's total to the ton, so I use it; the model should treat tanks 1-3 and 13-15 as possibly fresh water.
2. **After peak capacity.** 115 LT (Wilding BI 20999, Halpern) against "about 800 t" (HANDOFF §7, no source). Use 115 LT.
3. **The doors aft: when.** Scott: the order to heave up the doors aft at about 12:45 (BI 5638), the greaser freed just over half an hour after the doors fell; the Commissioner noted this runs against Dillon (BI 3718, 3720). Halpern places Dillon's doors at about 12:10 and Scott's at 12:45. Use T 30 forward, T 60-65 aft.
4. **Were the F-deck doors at C and D shut?** Open at T 5-10 (Boxhall); orders to close all F-deck doors from about T 7-15 (Etches, Mackay); the Attorney-General thought them closed. No witness saw them shut. Use: closed by about T 30 [bet], a flag for the model.
5. **How the vertical doors were raised.** Dillon: by hand, with the pump handle; the notice, the Commissioner and Scott: only after the bridge released them. Not a real conflict: the switch was put off first.
6. **The bell.** Murdoch said he rang it (Boxhall); Rule heard it; Scott did not.
7. **Time to close after the impact.** Instantly (Barrett), three minutes (Dillon), under five (Beauchamp), almost immediately (Report). The switch at T 0.5 and 25-30 s of fall fit all of them.
8. **Did reopening matter?** The Court: probably lengthened her life somewhat had they stayed open; Maltin and the Attorney-General: the floats closed them anyway. Both can be true: the doors aft of BR4 met no water until late.
9. **Counter-flooding.** 4 to 4.5 hours (Rogers, abstract only) against under two hours (Baldwin) and my arithmetic for the tanks (minutes). I would not use Rogers's number until his method is seen.
10. **Open doors: longer or capsize.** Lengthened somewhat (Court), capsize 30 min early (a 1998 documentary as reported), 22 min longer (this model). The model's free-surface handling is suspect late in the night (HANDOFF §4b says it holds GM near 0.5 m through 2:00), so its doors-open result may be optimistic.
11. **The bunker door's burst.** About T 60 (Report) against about 1:10, T 90 (Barrett). As in the plant sheet.

## 9. NOT FOUND

- The contents of any tank on 14 April; any ballast log or engineer's statement of the ballast condition at departure.
- The size and position of the sea filling pipes on the ballast main; where the ballast valves (other than the forward ones) were worked from; the fresh-water pumps' number and capacity.
- The feed tanks' capacity; which tanks held the boilers' reserve feed.
- The doors' sizes (the ET chart refused); the horizontal doors' closing time by hand.
- Hackett and Bedford (RINA 1996), the Marine Forensic Panel (SNAME 1997), Paik, Kim and Thomas (2025; the paper refused the fetch for the pumps note, and BGR's report of it has nothing on doors or ballast): any what-if on doors, ballast or counter-flooding.
- Rogers's method for 4.5 hours; the 1998 documentary's door experiment itself.
- A merchant seamanship text of 1912 on what to do after a collision (Gutenberg refused; the search budget ran out).
- Whether Titanic carried a collision mat for leaks.
- A published moment to change trim, LCF or KG for 14 April (I used bets in section 2; the model has its own).
- The MAIB 1992 reappraisal's text (PDF), for the distance to the light.

## 10. For the model

### (a) The tanks as data

x in metres forward of amidships (amidships 425 ft abaft the FP); z the tank's centroid above the keel; capacity in tonnes of sea water; fill by gravity through the 10-in main (cap 770-1,280 t/h for the whole main [derived]) or by its branch (rates in section 2), empty by the ballast pumps (470-560 t/h through the main [derived]). "Valves workable" = can its valves still be reached once the firemen's passage floods at T 5 and the rooms flood in turn.

```
// name       x_m     z_m   cap_t  cap_m3  content on 14 April [bet]   branch_in [bet]  valves workable
FP_PEAK     +121.0   4.5   193.0  188.3   holed at T 0 (Report)        6                 no (passage)
DB1         +108.7   0.8    72.1   70.4   FW, part used                5                 no after T 5
DB2          +94.0   0.8   114.8  112.0   FW, part used                6                 no after T 5
DB3          +78.5   0.8   213.4  208.2   FW, part used                6                 no after T 5
DB4          +62.5   0.8   319.0  311.3   empty (SW only)              8                 no (BR6 flooded by T 10)
DB4_WING     +62.5   1.1   124.0  120.9   empty                        6                 no
DB5          +45.6   0.8   414.5  404.4   empty                        8                 until BR5 floods (T 60-90)
DB5_WING     +45.6   1.1   166.6  162.6   empty                        6                 until BR5 floods
DB6          +28.2   0.8   452.1  441.1   empty                        8                 until about T 100
DB6_WING     +28.2   1.1   189.0  184.4   empty                        6                 until about T 100
DB7          +10.8   0.8   463.3  452.0   empty                        8                 yes
DB7_WING     +10.8   1.1   201.2  196.3   empty                        6                 yes
DB8           -7.0   0.8   489.7  477.8   empty                        8                 yes
DB8_WING      -7.0   1.1   203.2  198.3   empty                        6                 yes
DB9          -21.6   0.8   276.4  269.6   empty                        8                 yes
DB9_WING     -21.6   1.1    99.6   97.1   empty                        6                 yes
DB10         -32.4   1.0   308.9  301.3   FW only, part used           4 (FW pumps)      fresh-water system only
DB11         -42.9   1.0   343.4  335.0   FW only, part used           4 (FW pumps)      fresh-water system only
DB10_11_WING -37.7   1.1   184.9  180.4   empty                        6                 yes
DB12         -56.9   0.8   365.8  356.9   FW only, part used           4 (FW pumps)      fresh-water system only
DB12_WING    -56.9   1.1   101.6   99.1   empty                        6                 yes
DB13         -75.1   0.8   275.3  268.6   FW, part used                8                 yes
DB14         -93.0   0.8   119.9  117.0   FW, part used                6                 yes
DB15        -107.0   0.8    37.6   36.7   FW, part used                5                 yes
AFT_PEAK    -124.1   6.0   116.8  114.0   empty (trimming tank)        5                 yes
FW_ER (6 side tanks, beside the electric engine room)  x -68.7 / -75.1 / -81.5, z 4.5, 155 / 149 / 92 LT a side (805 t)
FW_C (aft of bulkhead C, to the orlop)                 x +83.0, z 4.5, 172.7 t
```

Tags for the block: capacities [read]; x [derived] except the peaks' and the fresh-water side tanks' centroids [bet]; z [derived] for the centre tanks, [bet] otherwise; contents, branches and the hours the valves stay workable [bet]. The branch sizes keep the Report's counts (14 at 8 in, 23 at 6 in, 3 at 5 in [read]): 8 in for the big centre tanks 4-9 and 13 (14 compartments), 5 in for tank 1, tank 15 and the after peak (3), 6 in for the other 23.

Wing tanks sit about 11 m off the centre line [bet]; each wing entry above is P + S: split it in half by side for list.

### (b) Orders the player could give after the collision

| Order | Carried out by | Time to effect | Needs | Realism |
|---|---|---|---|---|
| Close all tank-top doors | the officer of the watch, the bridge switch | 10 s bell + 25-30 s fall | current to the bridge solenoid; otherwise floats or levers | as on the night [read] |
| Release the switch so doors can be raised | the bridge, on a telephone request | immediate | - | [read] |
| Raise a vertical door by hand | 2 or 3 men from that room or the engine room | about 4-5 min a door, one at a time, from the side the handle is on [read + derived] | the switch off; men below; the float re-drops it when water reaches 0.46-0.61 m over the tank top | [read] |
| Hold a door open against its float | engineers (wedging the weight, or the hose across the sill) | minutes | men below; nobody in 1912 is recorded doing it | [bet]; the Court thought engineers would close, not hold, them |
| Close a horizontal door (E or F deck) | stewards or seamen with the spanner at the door or the key from the deck above | 1-3 min a door; a deck's doors in 15-30 min [bet] | hands; no current | [read] for the method |
| Close ports on E and F decks | stewards, cabin by cabin | 30-60 min for a deck [bet] | hands | no order given in 1912 [read] |
| Keep the gangway doors shut (or open them to load boats) | the boatswain's party | 10-20 min to open [bet] | hands; once the port list comes, the forward port door cannot be shut again (National Geographic) [read] | [read] for the 1912 order |
| Fill the after peak and after double-bottom tanks | an engineer at the sea valves and branch valves, the bulkhead-deck rods | valves 10-20 min, then 40-65 min of flow for 836 t [derived] | engine-room access; no steam needed for gravity | [derived]; nobody did it |
| Fill the starboard wing tanks to correct a port list | as above | 40-100 min for about 490 t [derived] | as above | [derived]; the one counter-flood with a real payoff |
| Pump out tanks (any) | an engineer on the ballast pumps | 470-560 t/h through the main [derived] | steam at the pumps (pumps note f(p)); valves reachable: not tanks 1-4 or the fore peak after T 5 | [read] + [derived] |
| Pump fresh water out of forward tanks | engineers on the fresh-water pumps | rate NOT FOUND; 4-in suctions | only before T 5 (valves in the passage) | [bet]; practically impossible |
| Keep steam up / draw fires | leading firemen, on the engineer's order | 20 min to draw a room's fires with 15-20 men [read] | men in the room | [read] |
| Stop, go ahead, go astern | the telegraph | as now | steam, screws in the water | [read]; P5 sets the inflow |
| Lead pumps to a room, fetch the suction pipe | engineers; four men to carry the pipe | doors aft up (15-20 min), then about half an hour to bring it forward and connect (Wilding, via Halpern) [read] | doors L-O raised; G-K raised | [read] |

### (c) The doors as data

```
// id, bulkhead x_m, deck, kind, close_s, float_trip_m_above_tanktop, 1912: [T_closed, T_raised, T_reclosed]
D1   +70.7  tanktop  vertical  25-30  0.46-0.61  [0.5-1, -, -]
D2   +68.0  tanktop  vertical  25-30  0.46-0.61  [0.5-1, -, -]      // after end of 9-ft passage aft of D [derived x]
E    +54.3  tanktop  vertical  25-30  0.46-0.61  [0.5-1, -, -]      // at the end of a 9-ft bunker passage (side not stated)
F    +36.9  tanktop  vertical  25-30  0.46-0.61  [0.5-3, -, -]
G    +19.5  tanktop  vertical  25-30  0.46-0.61  [0.5-3, 40-45, by its float before T 100 (derived)]
H    +2.1   tanktop  vertical  25-30  0.46-0.61  [0.5-3, 35-40, -]
J    -16.2  tanktop  vertical  25-30  0.46-0.61  [0.5-3, 30-35, -]
K    -27.1  tanktop  vertical  25-30  0.46-0.61  [0.5-3, 30, -]
L    -48.2  tanktop  vertical  25-30  0.46-0.61  [0.5-3, 60-65, -]
M    -65.5  tanktop  vertical  25-30  0.46-0.61  [0.5-3, 60-65, -]
N    -84.7  tanktop  vertical  25-30  0.46-0.61  [0.5-3, 60-65, -]
O    -101.2 tanktop  vertical  25-30  0.46-0.61  [0.5-3, 30-35 (0.6 m), 60-65 (full), -]
F-deck: C 1 (open at T 5-10), D 1 (open at T 5-10), E 1, F 2 (closed T 15-21), G 1, H 2, J 2, M 1, N 1: horizontal, by hand, no float; default closed by T 30 [bet]
E-deck: K 2, L 2, M 2, N 2, O 1: horizontal, by hand, no float; door No. 23 open to at least T 130; others unknown [bet: half open]
Orlop: N 1, horizontal, no record
```

The model's `doorFall` (25-30 s) and `doorFloat` (trip at 0.46-0.61 m above the tank top) can now carry sources. In the 1912 schedule, every vertical door from G aft was up by T 65; the floats then decide.

### (d) The what-ifs as testable claims

1. **Doors left open (the Court):** with the tank-top doors held open from T 30, she floats longer than the 1912 schedule, by "somewhat" (a few to a few tens of minutes), with less trim by the head at T 60 [read]. Model now: +22 min. Test it again with the floats disabled and with the free surface of every slack boiler room counted: if her GM goes below zero before 2:00, the 1998 documentary's reported capsize about 30 minutes early [search summary] is the better match.
2. **F-deck doors (Wilding BI 20360):** all F-deck doors shut from T 15 against all open changes the founder time by 5 to 10 minutes [read].
3. **Trunked hatches (Wilding BI 20382-20391):** a trunked No. 1 hatch, at most 5 to 10 minutes; trunking to G deck, a few minutes [read].
4. **Bulkheads to C deck, BR4 damaged (Wilding BI 20373):** delays the end by about an hour; with BR4 dry, she floats [read]. (README already: to D deck 2 h 46 min; to B deck she floats.)
5. **Counter-flooding the after tanks (this note):** 836 t from T 20 changes the founder time by under 2 minutes, either way [derived]. Rogers's 4 to 4.5 hours [search summary] would need thousands of tonnes aft and a means to let them in; the model can try opening its zones 13 and 14 (N-O and O-P) to the sea as a scenario and compare with Case C.
6. **Correcting the list (this note):** about 490 t in the starboard wing tanks, ordered by T 65, removes 8 to 12 degrees of the port list at T 130-145 and raises GM by about 0.2 m [derived].
7. **Moving everyone aft (Kristensen):** 165 t, under a minute [read].
8. **Pumps (pumps note, README):** as worked about +2.5 min in the model (+5, range 2-11, estimated); every pump on every suction from the start, +21 min in the model (+6 to 28 estimated) [derived].
9. **Steaming ahead for 10 min after the collision (Brown, Patten):** inflow up by at most 8 % while under way; founder time earlier by a minute or two at most [derived]. Going astern instead: no measurable gain.
10. **Steaming for the light (MAIB 17-20 nm):** with the inflow rising with speed she founders before covering it [derived].
11. **Doors never reopened (the 1912 reopening undone):** no change before about T 80; the Court and the Attorney-General thought the floats made the reopening harmless [read].

### (e) Well supported, and bets

Well supported [read]: the tank arrangement, the total of 5,754 LT and the peaks' 190 and 115 LT (Wilding under oath; Halpern's table sums to it); the ballast main, its sea filling pipes and the pumps; the forward valves in the firemen's passage and the passage's flooding at T 5; the doors' mechanism, the 25-30 s fall, the float's 18 in to 2 ft, raising by hand only with the switch off; the 1912 sequence for G-K (about T 30) and L-O (about T 60-65); D, E, F never reopened; the F-deck doors at C, D (open early) and F (closed by Wheat); no ballast or counter-flooding on the night; the Court's view on the doors.

Bets: the tanks' contents on the night; the vertical centres of the peaks and wing tanks; the wing tanks' 11 m arm; the loss coefficients and the hour for 800 t; the MCT, LCF and KG used in section 2 (the model should use its own hydrostatics, which is the point); which tanks had which branch; the horizontal doors' closing times and their state after T 30; the float dropping G before T 100; door sizes.

## 11. Sources

Primary (1911-15):
- British Wreck Commissioner's Report (1912), at the Titanic Inquiry Project: "Detailed Description", https://www.titanicinquiry.org/BOTInq/BOTReport/botRepTitanic.php; "Watertight Compartments", https://www.titanicinquiry.org/BOTInq/BOTReport/botRepWC.php; "Structure", https://www.titanicinquiry.org/BOTInq/BOTReport/botRepStructure.php; "Pumping Arrangements", https://www.titanicinquiry.org/BOTInq/BOTReport/botRepPumping.php; "Machinery", https://www.titanicinquiry.org/BOTInq/BOTReport/botRepMach.php; "The Sailing Orders", https://www.titanicinquiry.org/BOTInq/BOTReport/botRepOrders.php; "Extent of the Damage", https://www.titanicinquiry.org/BOTInq/BOTReport/botRepExtent.php; "The Flooding in the first 10 Minutes", https://www.titanicinquiry.org/BOTInq/BOTReport/botRepFlooding.php; "Gradual Effect of the Damage", https://www.titanicinquiry.org/BOTInq/BOTReport/botRepGradEff.php; "Observations", https://www.titanicinquiry.org/BOTInq/BOTReport/botRepObserv.php; "Effect of Additional Subdivision upon floatation", https://www.titanicinquiry.org/BOTInq/BOTReport/botRepSubdiv.php; contents, https://www.titanicinquiry.org/BOTInq/BOTReport/botRep01.php.
- British Inquiry transcripts: the Attorney-General's opening, Day 2, https://www.titanicinquiry.org/BOTInq/BOTInq02Header.php. Barrett, Day 3, https://www.titanicinquiry.org/BOTInq/BOTInq03Barrett02.php, and Day 4, https://www.titanicinquiry.org/BOTInq/BOTInq04Barrett01.php. Dillon, Day 5, https://www.titanicinquiry.org/BOTInq/BOTInq05Dillon01.php and https://www.titanicinquiry.org/BOTInq/BOTInq05Dillon02.php (with the bridge notice). Scott, Day 6, https://www.titanicinquiry.org/BOTInq/BOTInq06Scott01.php. Joughin, Day 6, https://www.titanicinquiry.org/BOTInq/BOTInq06Joughin03.php. Wheat, Day 9, https://www.titanicinquiry.org/BOTInq/BOTInq09Wheat01.php. Mackay, Day 9, https://www.titanicinquiry.org/BOTInq/BOTInq09Mackay01.php. Lightoller, Day 12, https://www.titanicinquiry.org/BOTInq/BOTInq12Lightoller02.php. Boxhall, Day 13, https://www.titanicinquiry.org/BOTInq/BOTInq13Boxhall01.php and https://www.titanicinquiry.org/BOTInq/BOTInq13Boxhall03.php. Wilding, Day 18, https://www.titanicinquiry.org/BOTInq/BOTInq18Wilding02.php; Day 19, https://www.titanicinquiry.org/BOTInq/BOTInq19Wilding01.php, https://www.titanicinquiry.org/BOTInq/BOTInq19Wilding02.php, https://www.titanicinquiry.org/BOTInq/BOTInq19Wilding03.php, https://www.titanicinquiry.org/BOTInq/BOTInq19Wilding04.php; Day 20, https://www.titanicinquiry.org/BOTInq/BOTInq20Wilding01.php, https://www.titanicinquiry.org/BOTInq/BOTInq20Wilding02.php, https://www.titanicinquiry.org/BOTInq/BOTInq20Wilding03.php. Arguments, Day 35, https://www.titanicinquiry.org/BOTInq/BOTInq35Arguments02.php.
- US Senate Inquiry: Olliver, Day 7, https://www.titanicinquiry.org/USInq/AmInq07Olliver01.php; Etches, Day 9, https://www.titanicinquiry.org/USInq2/AmInq09Etches01.php; Wheelton, Day 7, https://www.titanicinquiry.org/USInq/AmInq07Wheelton01.php (a shout of "watertight doors"; a port opened); US Senate Report, https://www.titanicinquiry.org/USInq/USReport/AmInqRep05.php.
- Limitation of Liability hearings: Wilding, https://www.titanicinquiry.org/lol/depositions/wilding05.php (Olympic after 1912 needed more water ballast); Admiral D. W. Taylor, https://www.titanicinquiry.org/lol/depositions/taylor03.php (subdivision; nothing on doors or ballast).
- Period text reproduced: GG Archives, "The Structure of the Titanic", https://www.ggarchives.com/OT/Titanic/01-PlanningBuildingLaunching/Structure.html; The Shipbuilder (1911), "Building the Hulls", https://www.ggarchives.com/OceanTravel/Titanic/25-ImageLibrary/TheShipbuilder-03-BuildingTheHulls.html.

Researchers and secondary:
- Samuel Halpern, "Titanic's Hidden Deck" (Titanic Research, Encyclopedia Titanica, 8 April 2005), as reposted at https://hercolano2.blogspot.com/2012/04/titanic-double-bottom.html.
- "Where Did That Water Come From?" (titanicology.com; Halpern), https://www.titanicology.com/FloodingInBR4.html.
- "Titanic's Watertight Doors and Bulkheads" (titanicology.com, no author), https://www.titanicology.com/WatertightDoorsAndBulkheads.html; "Flooding by Compartment", https://www.titanicology.com/FloodingByCompartment.html.
- Halpern, "A Matter of Stability and Trim", https://www.titanicology.com/Titanica/Stability%26Trim.pdf (search summary only).
- TRMA, "Titanic's Double Bottom" (June 2005), https://trmaarchive.com/articles/tech/TechFeatureJune2005.htm.
- Tim Maltin, "107 #54: Titanic sank more rapidly because her watertight doors were opened again after the collision" (2019), https://timmaltin.com/2019/04/05/titanic-watertight-doors/.
- E. S. Kamuda et al., "Titanic Past and Present", Titanic Historical Society, https://titanichistoricalsociety.org/titanic-past-present/.
- National Geographic Staff, "How the Titanic was lost and found" (22 Aug 2019), https://www.nationalgeographic.com/culture/article/titanic-lost-found.
- PBS, "Secrets of the Dead: Abandoning the Titanic" (2020), https://www.pbs.org/wnet/secrets/abandoning-the-titanic-full-fulm/5590.
- H. O. Kristensen (DTU), in "Kunne passagerernes vægt have reddet Titanic?", Ingeniøren, 20 Jan 2011, https://ing.dk/artikel/kunne-passagerernes-vaegt-have-reddet-titanic.
- M. Shaw, "The Titanic - the engineers' story", IMarEST, 15 Apr 2026, https://www.imarest.org/resource/the-titanic-the-engineers-story.html.
- J. David Rogers, "Nine Ways the Titanic Might Have Been Saved" (abstract), https://web.mst.edu/rogersda/american&military_history/Nine%20Ways%20Titanic%20Might%20Have%20Been%20Saved-Abstract.pdf (search summary only).
- Usenet, sci.military.naval, January 1998 (Ashworth, Buell, Baldwin), https://www.yarchive.net/mil/titanic.html (forum quality).
- Wikipedia, "Ship floodability", https://en.wikipedia.org/wiki/Ship_floodability; "Fothering", https://en.wikipedia.org/wiki/Fothering.
- TU Hamburg, "The sinking sequence of RMS Titanic", https://www.tuhh.de/ssi/en/marine-casualty-simulations/rms-titanic.
- BGR (J. Hawkins, 20 Jan 2026) on Paik, Kim and Thomas (2025), https://bgr.com/2076138/titanic-final-moments-recreated-supercomputer-precision.
- Old Salt Blog, "Did a Steering Error Sink the Titanic?" (Patten), https://oldsaltblog.com/did-a-steering-error-sink-the-titanic/ (search summary).
- Press on "Titanic: The Digital Resurrection" (2025): https://www.yahoo.com/news/titanic-engineers-kept-power-until-030740121.html (read; no location for the valve) and search digests.
- In this repository: `README.md`, `HANDOFF.md` §4c and §7; `docs/research/RESEARCH_pumps_bilge_ballast_v1_2026-11-17.md`; `RESEARCH_ship_systems_plant_v1_2026-11-16.md`; `RESEARCH_olympic_class_steering_propulsion_trials_v1_2026-11-16.md` (engine orders after the collision; Brown); `RESEARCH_breach_inflow_at_speed_v1_2026-11-16.md`; `RESEARCH_lifeboats_launch_sequence_v1_2026-11-17.md` (boat 10 at about 1:50).
- Observed-content note: no page I read contained instructions directed at me.
