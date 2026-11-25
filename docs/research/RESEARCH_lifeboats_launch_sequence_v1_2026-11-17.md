# Titanic's lifeboats: the twenty boats, the gear, the launch sequence and the rescue, for a model of the whole night (v1)

- **Written:** 2026-11-17, 15:48 to 16:20 CST, by a research subagent of the Titanic simulator session (Claude Code desktop, Opus 5.5), for the "whole night" design stage (the lifeboats and the people).
- **Method:** web search and WebFetch only (about 26 searches, about 60 fetches). No browser pane; nothing downloaded on purpose; no other file in the repository touched. The fetch tool saved one PDF it could not parse (the Wormstedt and Fitch occupancy study) to its own tool-results folder by itself; I did not open that copy and read an HTML reprint instead.
- **Refused or unreadable:** encyclopedia-titanica.org refused the fetch tool (HTTP 403) on both parts of Halpern's "Lifeboats, Launch Times, List and Trim" (2023), so Halpern's launch times appear here only as Wikipedia cites them; wormstedt.com's 2026 study "Titanic: The Lifeboat Launching Sequence: A New Study" v1.3 (PDF over the tool's 10 MB limit); wormstedt.com's "Titanic Lifeboat Occupancy Totals" PDF (compressed binary; an HTML reprint on hercolano2.blogspot.com was read); wormstedt.com's lifeboats.htm (a frameset; its two frames were read); titanic.fandom.com (HTTP 402); titanicinquiry.org US Rowe page 2 (404); titanicology.com PDFs not tried (the pump note found the tool cannot parse them). Wilding's loaded-boat test, Ray's account of boat 13, Olliver's half ahead, the modern LSA rules and the cold-water tables are search digests only.
- **Tags:** [read] = in a page I opened; [search summary] = only in a search-result digest, or in a fetched secondary page that paraphrases the original; [derived] = my arithmetic, shown; [bet] = no source, my judgement.
- **Tool caveat:** WebFetch passes each page through a small model; I asked for verbatim text on the key lines. Punctuation may be normalised.
- **Quotes:** at most one short phrase per source, under 15 words; everything else is paraphrase.
- **Conventions:** times are ship's time (Titanic's clocks, about 2 h 02 min ahead of New York time on the night, the usual reading); T = minutes after the collision at 11:40 p.m. 14 April 1912, so 12:00 = T 20, 1:00 = T 80, 2:00 = T 140, 2:20 = T 160. "BI nnnn" = British Inquiry question; "US" = US Senate Inquiry, with the witness and day. 1 ft = 0.3048 m. Starboard boats carry odd numbers, port boats even; the collapsibles are A to D.
- **Read with:** `README.md` (the model), `RESEARCH_pumps_bilge_ballast_v1_2026-11-17.md` (the pattern for this note).

## 0. Summary

- **The boats (high).** 20 boats for 1,178 persons: 14 wood lifeboats of 65 (30 ft), 2 cutters of 40 (25 ft 2 in, kept swung out at sea), 4 Engelhardt collapsibles of 47 [read]. Odd numbers starboard, even port, numbered from forward: on each side a cutter and three lifeboats in the forward group just abaft the bridge (1, 3, 5, 7 and 2, 4, 6, 8), four lifeboats in the after group (9 to 15 and 10 to 16); C and D on deck abreast the cutters, A and B on the officers' house roof [read]. No frame numbers found; station metres in §1.2 are placements [bet].
- **The gear (high).** Welin double-acting quadrant davits, 16 sets built for two or three boats each, worked by one crank each; manila falls through treble blocks (double for the cutters), lowered by hand round bitts; Murray's disengaging gear [read]. Four 15-cwt electric boat winches on the boat deck, 100 ft a minute, on the emergency circuit: hoisting gear, not used to lower on the night [read; use: conflict].
- **The drop (high).** 65 ft from the boat deck to the water at the start (the Court) [read]; about 69 ft at the after port boat 14 at about T 105 (Lowe) [read]; 10 to 15 ft at collapsible D at T 145, with the starboard deck edge about 26 ft and the port about 10 ft up for a list of about 10 degrees [read]. The boat deck is about 92 ft 6 in above the keel at its lowest [read].
- **Times (medium-high).** Uncovering ordered at about T 20 to 25 (the Captain); Lightoller: 15 to 20 minutes to uncover a boat and get its falls out [read]. Lowering 60 ft took 5 to 6 minutes (0.05 to 0.06 m/s) [read + derived]; loading 10 to 15 minutes (an estimate) [read]. The first boat (7) went at T 60, the last from the davits (D) at T 145; A and B floated off at about T 155 [read].
- **Sequence (medium-high).** Wormstedt, Fitch and Behe (2001, revised to 2023): 7, 5, 3, 8, 1, 6, 16, 14, 12 and 9, 11, 13 and 15, 2, 10 and 4, C, D, then B and A [read]. The British Inquiry's 1912 table differs mainly in 6 before 8, the after port boats in reverse (10 first), and C 20 minutes earlier; Halpern (2023) sides with the Inquiry on 6 and 8 and with the re-examination on 10 and C [read; Halpern via Wikipedia]. A 2026 study by Fitch, Layton and Wormstedt fine-tunes the timings; not readable here.
- **How full (medium).** 671 in the 18 lowered boats by Wormstedt and Fitch (62 % of 1,084 places), 854 by the Court (an overcount: 712 were saved) [read + derived]. Early boats (T 60 to 90) 43 % full, the middle group (T 100 to 121) 76 %, the last 63 % [derived]. Starboard took men when no women were near (36 men passengers in the Court's count), port did not (7) [read]. Reasons: passengers would not go; officers feared the boats or falls would fail under a full load, a fear the Court called unfounded; boats were meant to be filled from gangway doors that were never opened [read].
- **Attitude (medium).** Little list until about T 90, when Wilde sent passengers to starboard and the ship righted; pronounced port list by T 130: a 2.5 to 3 ft gap at boat 10; at T 140 collapsible C, on the high side, caught its strake on the rivets all the way down (five minutes to lower, 5 to 6 degrees of list); boat 4 waited at A deck for the windows; the forward well deck was awash as C left, the forward boat deck under water as B and A came down [read].
- **Way on (high).** She was dead in the water by about 11:57 (T 15 to 20), forty minutes before the first boat; no boat was lowered with way on [read + derived]. Today's design limit is 5 knots; a later manual calls launching with way on dangerous for inexperienced crews [read; search summary].
- **Light and cold (high for the facts, medium for survival).** The emergency circuit lit the boat deck and kept lit practically to the end; no moon, flat calm; air 32 to 33 F, sea about 31 F at 8 pm [read]. Death in the water within minutes to half an hour; Lowe's boat 14, the only boat to go back, 1.5 to 2 hours later, found 4 alive (1 died); about 55 to 65 of the saved had been in the sea, most of them on collapsibles A and B [read + derived].
- **Carpathia (medium).** Stopped at 4:05; boat 2 first at 4:10 (T 270); boat 12 last at about 8:30 (T 530; the Court says all by 8:00); per-boat times for 15 of 18 boats in §8 [read]; none found for 1, 7 and 16.
- **For the model (§11):** a table of the 20 boats and about 25 parameters, each tagged. The firm part is the record of what happened when; the gap, rubbing, trim and speed limits are physics with guessed thresholds. The flooding model's late list is too small (`README.md`), which will understate the attitude effects unless the record's list is fed in.

## 1. The twenty boats

### 1.1 Types, sizes, capacities, totals

| Figure | Value | Source (author, title, URL) | Short quote | Tag; confidence |
|---|---|---|---|---|
| Number of boats | 20: 14 wood lifeboats, 2 wood cutters (the "emergency boats"), 4 Engelhardt collapsibles | British Wreck Commissioner's Report (1912), "Life-Saving Appliances", https://www.titanicinquiry.org/BOTInq/BOTReport/botRepLSApp.php | (paraphrase) | [read]; high |
| Lifeboats (14) | 30 ft x 9 ft 1 in x 4 ft deep, 655.2 cu ft, 65 persons each | same | (paraphrase) | [read]; high |
| Cutters (2) | 25 ft 2 in x 7 ft 2 in x 3 ft, 326.6 cu ft, and 25 ft 2 in x 7 ft 1 in x 3 ft, 322.1 cu ft; 40 persons each (the Report does not say which cutter was which) | same | (paraphrase) | [read]; high |
| Engelhardt collapsibles (4) | 27 ft 5 in x 8 ft x 3 ft, 376.6 cu ft, 47 persons each; wood bottom, cork and kapok, canvas sides raised before use | same; Wikipedia, "Lifeboats of the Titanic", https://en.wikipedia.org/wiki/Lifeboats_of_the_Titanic | (paraphrase) | [read]; high |
| Total capacity | 11,327.9 cu ft for 1,178 persons; check: 14 x 65 + 2 x 40 + 4 x 47 = 910 + 80 + 188 = 1,178 | Report, "Life-Saving Appliances" | "Or a total of 11327·9 cubic ft. for 1,178 persons." | [read] + [derived]; high |
| Total capacity, US figure | 1,176 persons | US Senate Report, "Abandoning Ship", https://www.titanicinquiry.org/USInq/USReport/AmInqRep07.php | (paraphrase) | [read]; the 2 is the Senate's rounding or slip, use 1,178 |
| Capacity of the 18 boats that were lowered from davits | 1,178 - 2 x 47 = 1,084 | - | - | [derived] |
| Weight of a lifeboat, empty | NOT FOUND in any page I opened | - | - | - |
| Lifebelts; lifebuoys | 3,560 lifebelts; 48 lifebuoys | Report, "Life-Saving Appliances" | (paraphrase) | [read]; high |
| Boat equipment | compass, sails, cover, sea anchor, provision tank and water beaker per boat (lamps, plugs and water were missing or short in several boats on the night: Wikipedia's boat 7 left without its plug) | Report; Wikipedia | (paraphrase) | [read]; high for the outfit, medium for what was missing |

### 1.2 Stations on the boat deck

The Report places the lifeboats in groups of three at the forward end and four at the after end of the boat deck on each side, with the cutters forward of the group of three, immediately abaft the navigating bridge, fitted to lash outboard as emergency boats; collapsibles C and D stowed abreast the cutters, A and B on top of the officers' house, also immediately abaft the bridge [read: Report, "Life-Saving Appliances"]. The Report's boats section adds the numbering: odd numbers to starboard, even to port, starting forward with the cutters 1 and 2 [read: Report, "The Boats", https://www.titanicinquiry.org/BOTInq/BOTReport/BOTRepBoats.php]. A period description reproduced by GG Archives puts the forward group alongside the officers' quarters and the first-class entrance, the after group alongside and immediately forward of the second-class entrance house, the bridge 190 ft from the bow, and the boat deck about 500 ft long [read: GG Archives, "The Decks of the Titanic", https://www.ggarchives.com/OT/Titanic/01-PlanningBuildingLaunching/Decks-ComprehensiveDetails.html]. No page I could open gives frame numbers for the davits. The distances below are my placement from those landmarks.

| Boat | Type | Persons | Side | Group | Order in group (from forward) | Stowage | Distance from the bow, ft [bet] | x from amidships, m [bet; amidships taken 425 ft abaft the bow] |
|---|---|---|---|---|---|---|---|---|
| 1 | cutter | 40 | starboard | forward | 1st | swung out at sea, in davits | 205 | +67 |
| 3 | lifeboat | 65 | starboard | forward | 2nd | in davits, inboard chocks | 240 | +56 |
| 5 | lifeboat | 65 | starboard | forward | 3rd | same | 275 | +46 |
| 7 | lifeboat | 65 | starboard | forward | 4th (aftmost of the group) | same | 310 | +35 |
| 9 | lifeboat | 65 | starboard | after | 1st | same | 535 | -34 |
| 11 | lifeboat | 65 | starboard | after | 2nd | same | 570 | -44 |
| 13 | lifeboat | 65 | starboard | after | 3rd | same | 605 | -55 |
| 15 | lifeboat | 65 | starboard | after | 4th (aftmost) | same | 640 | -66 |
| 2 | cutter | 40 | port | forward | 1st | swung out at sea | 205 | +67 |
| 4 | lifeboat | 65 | port | forward | 2nd | in davits | 240 | +56 |
| 6 | lifeboat | 65 | port | forward | 3rd | same | 275 | +46 |
| 8 | lifeboat | 65 | port | forward | 4th | same | 310 | +35 |
| 10 | lifeboat | 65 | port | after | 1st | same | 535 | -34 |
| 12 | lifeboat | 65 | port | after | 2nd | same | 570 | -44 |
| 14 | lifeboat | 65 | port | after | 3rd | same | 605 | -55 |
| 16 | lifeboat | 65 | port | after | 4th | same | 640 | -66 |
| C | collapsible | 47 | starboard | forward | on deck abreast boat 1; launched from boat 1's davits | folded on deck | 205 | +67 |
| D | collapsible | 47 | port | forward | on deck abreast boat 2; launched from boat 2's davits | folded on deck | 205 | +67 |
| A | collapsible | 47 | starboard | roof of the officers' house | meant for boat 1's davits after C | about 8 ft above the boat deck (Wikipedia) | 215 | +64 |
| B | collapsible | 47 | port | roof of the officers' house | meant for boat 2's davits after D | same | 215 | +64 |

How the placements were made [bet]: cutters just abaft the bridge front (190 ft); about 35 ft between boat centres in a group (a 30 ft boat plus the twin davit standard and clearance; one davit frame carried the after arm of one boat and the forward arm of the next [read: Wikipedia; The Shipbuilder's twin-frame standards]); the after group's after boat a little forward of the second-class entrance house near the after end of a 500 ft deck. Uncertainty about +/-10 m. The order within the groups is certain [read]; the metres are not.

### 1.3 People aboard and saved

| Figure | Value | Source | Short quote | Tag; confidence |
|---|---|---|---|---|
| Aboard; saved (British Inquiry) | 2,201; 711 (32.3 %); crew 885 aboard, 212 saved; passengers 1,316 aboard, 499 saved | Report, "Numbers Saved", https://www.titanicinquiry.org/BOTInq/BOTReport/botRepSaved.php | "Total on board saved 711 out of 2,201" | [read]; high as the Court's count |
| Deck department | 66 aboard, 43 saved | same | (paraphrase) | [read]; high. The whole deck department (quartermasters, lookouts, able seamen and the rest; whether the Court counted the officers in it is not stated on the page): the pool of men who knew boats |
| Saved (US Senate) | 706 | US Senate Report, "Abandoning Ship" | (paraphrase) | [read] |
| Taken aboard Carpathia (British Inquiry) | 712, one of whom died shortly afterwards | Report, "The Rescue by the S.S. Carpathia", https://www.titanicinquiry.org/BOTInq/BOTReport/botRepRescue.php | (paraphrase) | [read] |
| Saved, modern figure | 712 (the commonly cited range is 705 to 712) | Wormstedt, Fitch and Behe, "Lifeboat Survivor Totals", https://wormstedt.com/Titanic/totals.html | (paraphrase) | [read]; high |
| Aboard, modern figures | 2,207 (Wikipedia's lifeboat article); 2,224 is also widely used | Wikipedia, "Lifeboats of the Titanic" | (paraphrase) | [read] for 2,207; 2,224 [search summary] |
| Dead | 1,490 in the Court's finding (2,201 - 711) | Report, contents page, https://www.titanicinquiry.org/BOTInq/BOTReport/botRep01.php | "the loss of 1,490 lives" | [read] |

## 2. The gear: davits, falls, winches, heights, times and hands

### 2.1 Davits, falls, blocks, winches

| Figure | Value | Source | Short quote | Tag; confidence |
|---|---|---|---|---|
| Davits | Welin double-acting quadrant davits, 16 sets, each designed to handle two or, if desired, three boats | The Shipbuilder (1911), "Working Arrangements", via GG Archives, https://www.ggarchives.com/OT/Titanic/25-ImageLibrary/TheShipbuilder-08-WorkingArrangements.html | "The davits are of the Welin double-acting type" | [read]; high |
| Davit capacity in all | 32 to 48 boats on The Shipbuilder's figure [derived: 16 x 2 to 3]; Wikipedia says the davits could take 64 boats | The Shipbuilder; Wikipedia | (paraphrase) | [read] + [derived]; the 64 is Wikipedia's, unexplained |
| Davit mechanism | a single crank handle drives a pinion on a swing bar that works either screw independently; the screw drives the quadrant, which swings the arm from fully inboard (over the inboard boat of a double bank) to fully outboard; twin-frame standards carry the gear for the boat ahead and the boat astern | The Shipbuilder; M. Darrah, "The Welin Quadrant Davit for Double-Banked Boats", Engineering, 1 July 1910, via TRMA, https://trmaarchive.com/db/db-01/db_06.html | (paraphrase) | [read]; high |
| Blocks | treble blocks for the lifeboats, double for the cutters; elm, lignum vitae roller sheaves, iron bound, swivel eyes | Report, "Life-Saving Appliances" | (paraphrase) | [read]; high |
| Falls | manila rope, long enough to lower the boats to the water at the ship's light draft and, with the boats lowered, to reach the boat winches on the boat deck | same | (paraphrase) | [read]; high |
| Release gear | Murray's disengaging gear, both ends freed together if required | same | (paraphrase) | [read]; high. On the night boats 12, 13 and 14 still had trouble at the falls: Poingdestre cut 12's, 13's were cut, Lowe let 14 drop the last few feet (§5) |
| How a boat was lowered | by hand: each fall belayed round a bitt and paid out round it; the falls could be led across the deck so that several men could work them; ideally 8 to 10 men a boat | Wikipedia, "Lifeboats of the Titanic" | (paraphrase) | [read]; medium (secondary) |
| Electric boat winches | four, 15 cwt each, by the Sunderland Forge and Engineering Co., on the boat deck; each lifts 15 cwt at 100 ft a minute; connected to the emergency circuit by change-over switches | Report, "Electrical Installation", https://www.titanicinquiry.org/BOTInq/BOTReport/botRepElec.php; The Shipbuilder, "Electrical Equipment", via GG Archives, https://www.ggarchives.com/OT/Titanic/25-ImageLibrary/TheShipbuilder-07-ElectricalEquipment.html; The Electrician, 4 Aug 1911, p. 659, via GG Archives | "each capable of lifting a load of 15 cwt. at a speed of 100 ft. per minute" (Report) | [read]; high. 15 cwt = 762 kg; 100 ft/min = 0.51 m/s [derived] |
| What the winches were for | The Shipbuilder says they were for hoisting and lowering the boats; Wikipedia says they could only haul boats back up out of the water. The Report makes the falls long enough to reach the winches with the boats lowered: hoisting | The Shipbuilder; Wikipedia; Report | (paraphrase) | [read]; conflict. Nobody on the night describes a winch used to lower a boat: treat them as hoisting gear only [bet] |
| Stowage | lifeboats on hinged wood chocks, the inboard chock hinged so the boat could swing free; locating pins for an inboard and a half-outboard position | Report; B. Read, "The Titanic 30 ft. Main Lifeboats", TRMA, https://www.trmaarchive.com/db/db-02/br-db-2-lb.html | (paraphrase) | [read]; high |
| Boat drill | at Southampton before sailing two starboard lifeboats were lowered with boats' crews, rowed round and hoisted back: about half an hour in all | Fifth Officer Lowe, US Inquiry Day 5, https://www.titanicinquiry.org/USInq/AmInq05Lowe02.php | "Half an hour; quite correct. sir." | [read]; high |

### 2.2 Height of the boat deck above the water

| Figure | Value | Source | Short quote | Tag; confidence |
|---|---|---|---|---|
| Boat deck above the keel | about 92 ft 6 in at its lowest point (28.2 m) | GG Archives, "The Decks of the Titanic" | "about 92 feet 6 inches above the keel" | [read]; medium-high (a period description, no plan opened) |
| Drop from the boat deck to the water, at the start | about 65 ft (19.8 m) | Report, "The Boats" | "there was a drop of 65 feet from the Boat deck to the water" | [read]; high as the Court's figure |
| Same, from the drafts | 92.5 ft less the mean draft of 32.25 ft (30 ft 9 in forward, 33 ft 9 in aft, `README.md`) = 60.3 ft at the deck's lowest point; more at the ends by the sheer | - | - | [derived]; the sheer of the boat deck NOT FOUND |
| Boat 14 at about 1:25 to 1:30 (T 105 to 110), port after group | Lowe was about 64 ft below the deck when he let the boat drop about 5 ft: about 69 ft (21 m) | Lowe, BI 15842-15844 (Day 13), https://www.titanicinquiry.org/BOTInq/BOTInq13Lowe01.php | "I must have been about 64 feet below that deck." | [read]; medium (an estimate in the dark) |
| A lifeboat lowered 60 ft | the authors' working figure | Wormstedt, Fitch and Behe, "The Lifeboat Launching Sequence Re-Examined" (rev. to 2023), https://www.wormstedt.com/Titanic/lifeboats/lifeboatarticle.htm | (paraphrase) | [read]; medium |
| About 2:00 to 2:05 (T 140 to 145) | survivors' estimates: about 26 ft from the boat deck to the water on the starboard side, about 10 ft on the port side, for a list of about 10 degrees; collapsible D dropped only 10 to 15 ft | same | (paraphrase) | [read]; medium |
| Wikipedia's 90 ft | a boat described as hanging 90 ft above the sea: this is about the keel figure, not the drop | Wikipedia | "hovering 90 feet above the freezing ocean" | [read]; reject as a drop |

How the height changed [derived]: the drop at a boat station is the deck's height above the keel at that station less the ship's local draft there, which the model already has from heave, pitch and roll. Bow down by theta, a station x metres forward of the centre of flotation comes down by about x tan(theta); with list phi to port, a port station b metres off the centreline comes down by about b sin(phi) and a starboard station rises by as much. With the forward group's middle at about +50 m (§1.2) and the after group's at about -50 m, the 1912 trims of 1.8, 3.2, 4.0 and 10 degrees (`README.md`, 12:10, 12:55, 1:20, 2:15) lower the forward group against the after group by about 3.1, 5.6, 7.0 and 17.6 m (100 m x tan theta), on top of the bodily sinkage. With the boat deck about 28 m (92 ft) wide [bet; the hull beam], a 10 degree list puts the starboard edge about 4.9 m (16 ft) above the port edge, which fits the survivors' 26 against 10 ft.

### 2.3 Time to uncover, swing out, load and lower

| Step | Figure | Source | Short quote | Tag; confidence |
|---|---|---|---|---|
| Uncover one boat and get its falls out | 15 to 20 minutes (Lightoller, of boat 4: at most 15 or 20 minutes from stripping it to swinging it out) | Lightoller, BI 13828 and 13853 (Day 12), https://www.titanicinquiry.org/BOTInq/BOTInq12Lightoller01.php; also WFB | (paraphrase) | [read]; high |
| Uncover, swing out and lower one boat | about 20 minutes (Lowe, US Inquiry, as WFB give it) | WFB; also quoted by titanicofficers.com | (paraphrase) | [read] in WFB; [search summary] for the US wording; the US pages I opened did not hold it |
| Whole boat out and in the water | under ten minutes (Lowe, of one boat, as WFB quote him) | WFB | (paraphrase) | [read] in WFB; medium |
| Swing out a boat already cleared | 2 to 3 minutes | WFB | (paraphrase) | [read]; medium |
| Load a boat already swung out | 10 to 15 minutes (the authors' estimate) | WFB | (paraphrase) | [read]; medium (an estimate) |
| Lower 60 ft | 5 to 6 minutes | WFB | "another 5 to 6 minutes would be needed to lower it 60 feet" | [read]; medium |
| Boat 12 | about 5 minutes to lower (AB Evans) | WFB | (paraphrase) | [read] in WFB |
| Boat 1 | about 10 minutes to reach the water once lowering began | WFB | (paraphrase) | [read] in WFB |
| Collapsible C | about five minutes (QM Rowe), slowed by the port list (§5) | Rowe, US Day 7; WFB | (quoted in §5) | [read] |
| Boat 4 to A deck | 7 to 8 minutes (Lightoller), the lowering from the boat deck to A deck only | WFB | (paraphrase) | [read] in WFB |
| Boat 7, the whole operation (a passenger) | 20 minutes or more, a tedious job | WFB, quoting Chevre | (paraphrase) | [read] in WFB |
| Fill and get away (a seaman) | about 20 minutes | WFB, quoting Nichols | (paraphrase) | [read] in WFB |
| Lowering speed implied | 60 ft in 5 to 6 min = 18.3 m in 300 to 360 s = 0.05 to 0.06 m/s; boat 1, about 19 m in 10 min = 0.03 m/s | - | - | [derived] |
| For comparison, today's rule | lowering speed at least 0.4 + 0.02 H m/s (H = davit head to waterline, m), at most 1.3 m/s fully loaded; since 2026 the minimum is the lesser of that and 1.0 m/s. For H = 20 m: 0.8 m/s, about 15 times the 1912 rate | IMO LSA Code 6.1.2.8 and MSC.554(108), via search digest | (paraphrase) | [search summary]; high for the rule, irrelevant to 1912 except as a ceiling |

### 2.4 Hands, and the order to uncover

| Figure | Value | Source | Short quote | Tag; confidence |
|---|---|---|---|---|
| Deck hands per boat on the night | the crew reached the deck gradually; on average not more than three deck hands to each boat | Report, "The Boats" | (paraphrase) | [read]; high |
| Hands to lower a boat | ideally 8 to 10 men | Wikipedia | (paraphrase) | [read]; medium (secondary) |
| Hands sent away in boats | Lightoller was soon down to sending one seaman away with each boat | WFB | (paraphrase) | [read] in WFB |
| Officers who worked the boats | Wilde (chief), Murdoch (first), Lightoller (second), Pitman (third, left in boat 5), Boxhall (fourth, rockets, then left in boat 2), Lowe (fifth), Moody (sixth); Captain Smith at the forward port boats | WFB, "Revised Launch Times", https://wormstedt.com/Titanic/revised.html | (paraphrase) | [read]; high |
| Order to uncover the boats: when | about 12:05 (T 25) the order to uncover the 14 boats under davits; 12:20 (T 40) swing out; about 12:30 (T 50) women and children into the boats; about 12:45 (T 65) Murdoch's order to lower No. 7 | Report, "The Boats" | (paraphrase) | [read]; medium (the Court calls all its times after the collision unreliable) |
| Same, modern | by Captain Smith, about midnight and not earlier (T 20); women and children ordered in about 12:25 (T 45) | WFB, lifeboatarticle.htm | (paraphrase) | [read]; medium-high |
| Same, Halpern | about 15 to 20 minutes after the collision, close to 11:57 by Titanic's clock, when she was dead in the water | S. Halpern, "Collision Point", https://www.titanicology.com/Titanica/CollisionPoint.htm | (paraphrase) | [read]; medium |
| Same, Lightoller | the Chief Officer told him to start taking the covers off the boats almost at once after he came on deck (about half an hour after the collision, by his estimate of time in his bunk) | Lightoller, BI 13800-13802, 13860 | (paraphrase) | [read]; medium |

## 3. The launch sequence with times

### 3.1 The British Inquiry's table (1912)

The Court printed its table with the warning that every time the witnesses gave after the collision is unreliable [read: Report, "The Boats"]. Its numbers are the lowest estimate for each boat [read: WFB totals page]. A first reading of the port column misaligned four rows; the version below is the one whose column sums equal the Report's printed totals (port: 37 crew, 7 men, 349 women and children, 393; starboard: 70, 36, 355, 461) and whose totals match the WFB totals page [derived check].

| Side | Boat | Time | T | Crew | Men passengers | Women and children | Total | Capacity |
|---|---|---|---|---|---|---|---|---|
| S | 7 | 12:45 | 65 | 3 | 4 | 20 | 27 | 65 |
| S | 5 | 12:55 | 75 | 5 | 6 | 30 | 41 | 65 |
| S | 3 | 1:00 | 80 | 15 | 10 | 25 | 50 | 65 |
| S | 1 | 1:10 | 90 | 7 | 3 | 2 | 12 | 40 |
| S | 9 | 1:20 | 100 | 8 | 6 | 42 | 56 | 65 |
| S | 11 | 1:25 | 105 | 9 | 1 | 60 | 70 | 65 |
| S | 13 | 1:35 | 115 | 5 | 0 | 59 | 64 | 65 |
| S | 15 | 1:35 | 115 | 13 | 4 | 53 | 70 | 65 |
| S | C | 1:40 | 120 | 5 | 2 | 64 | 71 | 47 |
| S | A | floated off when she sank; used as a raft | - | - | - | - | - | 47 |
| P | 6 | 12:55 | 75 | 2 | 2 | 24 | 28 | 65 |
| P | 8 | 1:10 | 90 | 4 | 0 | 35 | 39 | 65 |
| P | 10 | 1:20 | 100 | 5 | 0 | 50 | 55 | 65 |
| P | 12 | 1:25 | 105 | 2 | 0 | 40 | 42 | 65 |
| P | 14 | 1:30 | 110 | 8 | 2 | 53 | 63 | 65 |
| P | 16 | 1:35 | 115 | 6 | 0 | 50 | 56 | 65 |
| P | 2 | 1:45 | 125 | 4 | 1 | 21 | 26 | 40 |
| P | 4 | 1:55 | 135 | 4 | 0 | 36 | 40 | 65 |
| P | D | 2:05 | 145 | 2 | 2 | 40 | 44 | 47 |
| P | B | floated off when she sank; used as a raft | - | - | - | - | - | 47 |

Source: Report, "The Boats", https://www.titanicinquiry.org/BOTInq/BOTReport/BOTRepBoats.php [read]. Boat 1's men passengers were read as 8 by the tool, which does not sum to 12; the starboard total of 36 men requires 3 [derived]. The four port rows 12, 14, 16 and 2 were rebuilt from the column totals and the WFB totals page (12: 42, 14: 63, 16: 56, 2: 26) [read + derived]; the per-class split within those four rows is my reconstruction [derived], their totals are firm. In all: 854 in 18 boats (461 starboard, 393 port), against 711 saved: the Court's per-boat figures are too high by about 140 to 180 (§9).

### 3.2 The modern re-examination (Wormstedt, Fitch and Behe), with Halpern's 2023 times beside it

Wormstedt, Fitch and Behe published in The Titanic Commutator No. 155 (2001); the online version is revised in 2009, 2010, 2012, 2022 and 2023, with contributions by Halpern and Layton [read: lifeboatarticle.htm]. Their Table 2 [read: https://www.wormstedt.com/Titanic/lifeboats/lifeboattable2.htm], the "Revised Launch Times" and "Crew in Charge" pages [read: https://wormstedt.com/Titanic/revised.html, https://wormstedt.com/Titanic/crewcharge.html] and the occupancy study [read in an HTML copy: B. Wormstedt and T. Fitch, "Titanic Lifeboat Occupancy Totals" (2011), reposted at https://hercolano2.blogspot.com/2012/04/t-i-t-n-ic-life-b-o-t-o-c-c-up-n-cy-t-o.html] give the table below. Halpern's 2023 times ("Lifeboats, Launch Times, List and Trim", Encyclopedia Titanica, March 2023) are as Wikipedia's lifeboat article cites them (its note 28) [read on Wikipedia; Halpern's pages refused]. In 2026 Fitch, Layton and Wormstedt published a further study that, by the authors' note on the older article, fine-tunes some of the timings and leaves the basic findings standing; I could not read it (§10).

| Order (WFB) | Boat | Side, group | WFB time | T | Halpern 2023 (via Wikipedia) | BI time | Loading officers (WFB) | In charge in the boat (WFB) | Aboard at lowering (Wormstedt & Fitch 2011) | BI total | Capacity |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 7 | S fwd | 12:40 | 60 | about 12:45 | 12:45 | Murdoch, Lowe | lookout Hogg | 28 | 27 | 65 |
| 2 | 5 | S fwd | 12:45 (Pitman's 12:43) | 63-65 | 12:43 | 12:55 | Murdoch, Lowe, Pitman | Third Officer Pitman | 36 | 41 | 65 |
| - | rockets | - | first fired 12:47 | 67 | - | - | (QM Rowe among those firing, US Day 7) | - | - | - | - |
| 3 | 3 | S fwd | 12:55 | 75 | 1:00 | 1:00 | Murdoch, Lowe | AB Moore | 32 | 50 | 65 |
| 4 | 8 | P fwd | 1:00 | 80 | 1:10 | 1:10 | Lightoller, Wilde, Smith | AB Jones | 25 | 39 | 65 |
| 5 | 1 | S fwd | 1:05 | 85 | 1:10 | 1:10 | Murdoch, Lowe | lookout Symons | 12 | 12 | 40 |
| 6 | 6 | P fwd | 1:10 | 90 | 12:55 | 12:55 | Lightoller (Smith) | QM Hichens | 23 | 28 | 65 |
| 7 | 16 | P aft | 1:20 | 100 | about 1:25 | 1:35 | Moody | master-at-arms Bailey | 53 | 56 | 65 |
| 8 | 14 | P aft | 1:25 | 105 | about 1:30 | 1:30 | Lowe, Wilde, Lightoller | Fifth Officer Lowe | 40 (Lowe: 58 at the US inquiry, about 64 at the British) | 63 | 65 |
| 9 | 12 | P aft | 1:30 | 110 | 1:35 | 1:25 | Wilde, Lightoller | AB Poingdestre | 42 | 42 | 65 |
| 10 | 9 | S aft | 1:30 | 110 | 1:20 | 1:20 | Murdoch (Moody?) | boatswain's mate Haines | 40 | 56 | 65 |
| 11 | 11 | S aft | 1:35 | 115 | 1:37 | 1:25 | Murdoch | AB Humphreys | 50 (about 70 in other estimates) | 70 | 65 |
| 12 | 13 | S aft | 1:40 | 120 | 1:43 | 1:35 | Murdoch (Moody on A deck?) | leading fireman Barrett | 55 | 64 | 65 |
| 13 | 15 | S aft | 1:40 (1:41) | 120-121 | 1:45 | 1:35 | Murdoch (Moody on A deck?) | fireman Dymond | 68 | 70 | 65 |
| 14 | 2 | P fwd | 1:45 | 125 | about 1:45 | 1:45 | Wilde, Smith | Fourth Officer Boxhall | 17 | 26 | 40 |
| 15 | 10 | P aft | 1:50 | 130 | about 1:50 | 1:20 | Murdoch | AB Buley | 57 | 55 | 65 |
| 16 | 4 | P fwd | 1:50 | 130 | 1:50 | 1:55 | Lightoller | QM Perkis | 30 (about 34 in Wikipedia's text) | 40 | 65 |
| - | rockets | - | ceased about 1:50 (1:52) | 130-132 | - | - | - | - | - | - | - |
| 17 | C | S fwd | 2:00 (began lowering about 2:00, away 2:05) | 140 | 2:00 | 1:40 | Murdoch, Wilde | QM Rowe | 43 | 71 | 47 |
| 18 | D | P fwd | 2:05 | 145 | 2:05 | 2:05 | Lightoller, Wilde | QM Bright | 20 | 44 | 47 |
| 19 | B | P, roof | 2:15, washed off upside down | 155 | washed off 2:15 | floated off | Lightoller | none (Lightoller took charge on the hull) | 28 to 30 on the hull by morning | (A and B: 60 together in the BI's notes) | 47 |
| 20 | A | S, roof | 2:15 to 2:20, washed off swamped | 155-160 | washed off 2:15 | floated off | Murdoch, Moody | none | 12 to 13 alive when boat 14 reached them | - | 47 |

Sums [derived]: Wormstedt and Fitch's 18 lowered boats carried 671 of 1,084 places (62 %); the BI's 854 (79 %). Their recovered total is 726 less 4 who died, 722 against the true 712: their per-boat numbers are "estimates only" [read].

### 3.3 Cadence: who launched what, and how fast

From the WFB times [derived]:
- **Starboard forward (Murdoch and Lowe):** 7 at T 60, 5 at T 63-65, 3 at T 75, 1 at T 85: one boat every 5 to 10 minutes once the first was away.
- **Port forward (Lightoller, Wilde, Smith):** 8 at T 80, 6 at T 90; then a gap of 35 minutes while the officers worked aft and the port boats waited for passengers; 2 at T 125, 4 at T 130 (boat 4 had hung at A deck since before 8 and 6 were loaded, Lightoller's first boat, waiting for the windows, §5), D at T 145.
- **Port after (Moody, Lowe, Wilde, Lightoller):** 16 at T 100, 14 at T 105, 12 at T 110, 10 at T 130: every 5 minutes, then 20 minutes for boat 10.
- **Starboard after (Murdoch, Moody, Purser McElroy; in WFB's conclusion no officer was working the after starboard boats until Murdoch came aft):** 9 at T 110, 11 at T 115, 13 at T 120, 15 at T 121; C forward at T 140; A at T 155-160.
- **Overall:** 18 boats from davits between T 60 and T 145; the after groups started 40 to 50 minutes after the forward ones. The pace was set by the officers' moving from group to group, not by the gear: within a group, with the boats already uncovered and swung out, boats went every 1 to 10 minutes.

### 3.4 Where the British table and the re-examination disagree

| Boat(s) | British Inquiry | Wormstedt, Fitch and Behe | Halpern 2023 | Note |
|---|---|---|---|---|
| 7 and 5 | 12:45, 12:55 | 12:40, 12:45 | about 12:45, 12:43 | All agree 7 was first and 5 second (Lowe, BI 15817: No. 5 went after No. 7) [read]; Wikipedia's rendering of Halpern puts 5 two minutes before 7, which I read as a citation slip [bet] |
| 6 and 8 | 6 first (12:55), 8 at 1:10 | 8 first (1:00), 6 at 1:10 | 6 first (12:55), 8 at 1:10 | The main port-forward dispute. WFB (rev. 2010, 2022) read the eyewitnesses as 8 before 6; Halpern keeps the BI order |
| 16, 14, 12, 10 | 10 first (1:20), then 12, 14, 16 (1:25 to 1:35) | 16, 14, 12 (1:20 to 1:30), 10 last (1:50) | 16, 14, 12 (about 1:25 to 1:35), 10 about 1:50 | BI reversed the order; both modern studies put 10 last of the after port boats |
| 9 against 14 | 9 at 1:20, 14 at 1:30 | 14 (1:25) before 9 (1:30) | 9 (1:20) before 14 (1:30) | Disputed between the modern studies |
| 9, 11, 13, 15 | 1:20 to 1:35 | 1:30 to 1:41 | 1:20 to 1:45 | Same order, different clocks |
| C | 1:40 | 2:00 to 2:05 | 2:00 | The BI's C is 20 to 25 minutes early on both modern readings |
| 4 | 1:55 | 1:50 | 1:50 | Agree within 5 minutes |
| D | 2:05 | 2:05 | 2:05 | Agree |
| Numbers | 854 in 18 boats | 671 lowered, 722 recovered | - | The BI's numbers are the lowest estimates of witnesses who overcounted; they sum to 143 more than were saved |

My choice for the model: WFB's times (the most worked, revised against more eyewitnesses than any other) and Wormstedt and Fitch's occupancy at lowering; the BI table as a second 1912 case [bet].

## 4. Loading policy and how full the boats were

### 4.1 The order and the two readings of it

| Figure | Value | Source | Short quote | Tag; confidence |
|---|---|---|---|---|
| The Captain's order | asked whether to put women and children in, Captain Smith answered yes, and to lower away; Lightoller took it as a general order (the Chief Officer had first said no) | Lightoller, BI 13872-13880 (Day 12), https://www.titanicinquiry.org/BOTInq/BOTInq12Lightoller01.php | "Yes, put the women and children in and lower away." | [read]; high |
| Port side (Lightoller) | women and children only: boats went with empty seats when no women were waiting | Wikipedia, "Sinking of the Titanic", citing Barczewski (2006), p. 21, https://en.wikipedia.org/wiki/Sinking_of_the_Titanic | (paraphrase) | [read]; high (it is in every account) |
| Starboard side (Murdoch) | women and children first: men were let in once the women near the boat were in | same | (paraphrase) | [read]; high |
| The difference in the boats | men passengers in the boats by the Court's count: 36 in the starboard boats, 7 in the port boats | Report, "The Boats" | (paraphrase) | [read] + [derived from the column sums]; high as a ratio |
| Fill by side (Wormstedt and Fitch, at lowering) | starboard (1, 3, 5, 7, 9, 11, 13, 15, C): 364 of 542 places, 67 %; port (2, 4, 6, 8, 10, 12, 14, 16, D): 307 of 542, 57 % | from §3.2 | - | [derived]; medium (the per-boat numbers are estimates) |
| Same, the Court's numbers | starboard 461 of 542 (85 %), port 393 of 542 (73 %) | from §3.1 | - | [derived] |

### 4.2 Why the early boats left part-full

| Reason | Evidence | Source | Short quote | Tag |
|---|---|---|---|---|
| Passengers would not go | many, women especially, refused to leave the deck; they feared the 65 ft drop; many thought the ship safer than the boats; some wives would not leave their husbands | Report, "The Boats" | (paraphrase) | [read] |
| Same | Astor: safer aboard than in a little boat | Wikipedia, "Sinking of the Titanic" | "We are safer here than in that little boat" | [read] (a reported remark) |
| Officers feared the boats or the gear would fail | Lightoller did not think the boats would carry a full load without structural damage; AB Poingdestre, read to him: the falls would carry no more | Lightoller, BI 13887; BI 2958 as read at 13887ff., https://www.titanicinquiry.org/BOTInq/BOTInq12Lightoller01.php | (paraphrase) | [read] |
| Same, the Court | officers feared the boats might buckle when full; the Court found the fear unfounded | Report, "The Boats" | (paraphrase) | [read] |
| Same, modern | fear that the boats or davits would buckle under the load | Wikipedia, citing Halpern (2011), p. 164 | (paraphrase) | [read] |
| The test that answered it | on Olympic at the fitting-out wharf, about May 1911, a boat loaded with half-hundredweight weights for its full number, a little over, was lifted by the electric winch to test the winch; the boat stood it "Perfectly" | Wilding, British Inquiry, as found by search (page not located among those I opened) | (paraphrase) | [search summary]; medium |
| To be filled from the gangway doors | Lightoller ordered the E-deck gangway doors opened and sent the boatswain and six men below to do it: lower the boats part-full and fill them from the doors by pilot ladders; neither he nor the Court knew the order to have been carried out; the men were not seen again | Lightoller, BI 13896, 13913, 14222-14230 (https://www.titanicinquiry.org/BOTInq/BOTInq12Lightoller04.php); Report, "The Boats" (the doors were never opened); WFB | "that was the best means of putting the people into the boat" (BI 14230) | [read] |
| No system | no direction as to the number to be carried in each boat, and no system of loading | US Senate Report, "Abandoning Ship" | "There was no system adopted for loading the boats." | [read] |

### 4.3 How full against time (Wormstedt and Fitch at lowering; places in brackets)

| Phase | Boats | Aboard / places | Fill [derived] |
|---|---|---|---|
| T 60 to 90 (12:40 to 1:10) | 7, 5, 3, 8, 1, 6 | 156 / 365 | 43 % |
| T 100 to 121 (1:20 to 1:41) | 16, 14, 12, 9, 11, 13, 15 | 348 / 455 | 76 % |
| T 125 to 145 (1:45 to 2:05) | 2, 10, 4, C, D | 167 / 264 | 63 % (C 91 %, 10 88 %; 2, 4 and D 42 to 46 %) |

Reading [derived + bet]: fill rose sharply once the trim could be seen from the deck (about T 90 to 100, 3 to 4 degrees by the head, `README.md`); the last port boats stayed part-full because Lightoller kept to women and children only and the women still aboard were not where the boats were.

## 5. How the ship's attitude affected launching

| T (ship's time, WFB clock) | Attitude | What happened at the boats | Source | Tag |
|---|---|---|---|---|
| T 10 (11:50) | 5 degrees to starboard on the wheelhouse inclinometer (Halpern's table; `README.md`) | before the boats | Halpern 2023 Part II, as summarised by search; `README.md` | [search summary] |
| about T 90 (1:10, boat 6) | Lightoller first noticed her down by the head and a list to port at boat 6; Wilde ordered all passengers to the starboard side; Lightoller: the list very little, and the ship "got a righting movement and maintained it" | the port list was corrected by moving people | Lightoller, BI 13852, 13864-13867, 13939-13943, https://www.titanicinquiry.org/BOTInq/BOTInq12Lightoller01.php and https://www.titanicinquiry.org/BOTInq/BOTInq12Lightoller02.php | [read] |
| T 60 to 90, starboard forward boats | trim about 2 to 3 degrees (`README.md`) | boats 3, 5 and 7 came down in jerks: the falls stuck in freshly painted blocks | Wikipedia, "Lifeboats of the Titanic" | [read] |
| about T 105 (boat 14) | down by the head (Lowe: yes) | a fall fouled; Lowe let the boat drop the last 5 ft | Lowe, BI 15823-15844 | [read] |
| about T 110 to 121 (boats 13, 15) | trim about 4 degrees at 1:20 (`README.md`) | boat 13 was stopped near the water short of a large discharge from the ship's side and pushed off with oars; its falls were cut; boat 15 came down almost onto it | F. Ray, US Day 9, https://www.titanicinquiry.org/USInq/AmInq09Ray02.php (search digest); Wikipedia; WFB | [search summary] for Ray; [read] for Wikipedia and WFB |
| about T 50 to 130 (boat 4) | - | Lightoller's first boat: he lowered boat 4 to A deck to load from the promenade, found the A-deck windows up, countermanded and moved on; the boat hung there until the windows were opened; it was loaded through the windows with deck chairs as steps, and its keel caught on the sounding spar, which was cut away; Lightoller's lowering to A deck alone took 7 to 8 minutes | Lightoller, BI 13834-13862, 13937-13954; Wikipedia; WFB | [read] |
| T 130 (1:50, boat 10) | pronounced port list: the first heavy list described is at boats 4 and 10 | a gap of about 2.5 to 3 ft between the ship and the boat at the deck; a woman's jump fell short and she was pulled in from A deck; children were thrown in | Evans, US Day 8, https://www.titanicinquiry.org/USInq/AmInq08EvansF01.php; WFB; Wikipedia | [read] |
| T 140 (2:00, collapsible C) | 5 to 6 degrees to port as C went down (Rowe); bow down, the forward well deck awash when C left | C's rubbing strake caught on the rivets all the way down; "a good five minutes" to lower | Rowe, US Day 7, https://www.titanicinquiry.org/USInq/AmInq07Rowe01.php | [read] |
| T 145 (2:05, collapsible D) | about 10 degrees to port (survivors' 26 ft against 10 ft, WFB); 10 to 15 degrees at 1:50 to 2:05 in Halpern's reconstruction (`README.md`) | D dropped about 10 ft (Lightoller) or 10 to 15 ft (WFB); A deck forward was under water | Lightoller, BI 14013-14023, https://www.titanicinquiry.org/BOTInq/BOTInq12Lightoller02.php; WFB | [read] |
| T 150 to 160 (B, A) | the water on the boat deck forward; the bridge under at about 2:15 (`README.md`) | B was slid off the officers' house on oars and landed upside down on the deck, then floated off; A reached the deck right side up and was being hooked to boat 1's falls when the sea took it, its canvas sides not raised | Lightoller, BI 14036 (the water then on the boat deck); Wikipedia | [read] |

**The geometry behind it [derived, with bets marked].** A boat hangs plumb. With the ship listed phi to port:
- a port boat at its loading deck stands off the ship by g = g0 + L sin(phi), where L is the length of fall between the davit head and the boat (about 3 m at the boat deck, about 6 m at A deck, 9.5 ft lower [bet]) and g0 is the stand-off with no list (about 0.3 m [bet]). At phi = 10 degrees, g = 0.3 + 3 x 0.174 = 0.82 m (2.7 ft) at the boat deck: Evans's 2.5 to 3 ft at boat 10. At A deck the same list gives 0.3 + 6 x 0.174 = 1.3 m (4.4 ft).
- a starboard boat swings in toward the ship's side, and touches it once L sin(phi) exceeds the davits' outreach beyond the shell, r (about 0.5 to 1 m [bet]): at phi = 5 degrees for L above 6 to 11 m, so over the last half or more of a 15 to 20 m drop. That is Rowe's account of C rubbing all the way down.
- bow down by theta, the two davits of one boat differ in height by about s sin(theta), s the davit spacing (about 9 m [bet]): 0.6 m at 4 degrees, 1.6 m at 10 degrees. The falls must be paid out unequally to keep the boat level; that is a slow job by hand, and where it went wrong boats hung by one end (14) [read for 14].

## 6. Way on the ship

| Figure | Value | Source | Short quote | Tag; confidence |
|---|---|---|---|---|
| Engines after the collision | ran on for a minute or two, were backed slowly to take the way off, and stopped; later restarted ahead for a very short time (Scott, Dillon, Beesley, Olliver, Carter) and stopped for the last time | S. Halpern, "Collision Point", https://www.titanicology.com/Titanica/CollisionPoint.htm | (paraphrase) | [read]; medium-high |
| Dead in the water | close to midnight; for practical purposes at 11:57 by Titanic's clock, near the time of the order to uncover the boats | same | "dead in the water for all practical purposes" | [read]; medium. Halpern writes the collision as 11:45 in that article, so 11:57 is T 12 on his clock and T 17 on the usual 11:40 |
| All engines stopped | about five minutes after the collision | Wikipedia, "Sinking of the Titanic", citing Halpern (2011), p. 94 | (paraphrase) | [read] |
| Half ahead | QM Olliver heard the Captain telegraph half ahead after the collision, with the ship almost stopped, for a short time | Olliver, US Day 7, https://www.titanicinquiry.org/USInq/AmInq07Olliver02.php (search digest) | (paraphrase) | [search summary] |
| Speed through the water | 4 to 6 knots, which Halpern says Lightoller observed, in his account of the minutes after the first stop | "Collision Point" | (paraphrase) | [read]; the context in the article is not clear to me: I take it as the speed soon after the collision, not during the launching |
| Way on at the first launch (T 60) | none: she had been stopped for about 40 minutes | - | - | [derived]; high |
| Seamanship (US, Second World War) | dangerous for inexperienced seamen to launch a lifeboat with way on; boats were swamped, torn away or capsized; one veteran liked to lower at about five knots | How to Abandon Ship, ch. 5, "Lowering", at HyperWar, https://ibiblio.org/hyperwar/USN/ref/AbandonShip/Abandon-5.html | "dangerous for inexperienced seamen to launch a lifeboat where there is way on" | [read]; medium (a later manual) |
| Modern design rule | lifeboats must be capable of being launched and towed with the ship making 5 knots in calm water; IMO calls it a design maximum, not a drill condition | IMO LSA Code and Resolution A.624(15), via search digest | (paraphrase) | [search summary]; high for the rule |

No testimony I found speaks of a Titanic boat lowered with way on.

## 7. Light and cold; the people in the water

### 7.1 Light on the boat deck

| Figure | Value | Source | Short quote | Tag; confidence |
|---|---|---|---|---|
| Emergency lamps | a separate installation of 500 lamps throughout passenger, crew and machinery spaces, at the ends of passages, near stairways, and on the Boat deck | Report, "Electrical Installation", https://www.titanicinquiry.org/BOTInq/BOTReport/botRepElec.php | (paraphrase) | [read]; high |
| Their supply | two 30 kW engine-dynamo sets on a platform in the turbine engine room casing at saloon deck level, 20 ft above the waterline, with their own steam pipe from boiler rooms 2, 3 and 5; also on that circuit: five arc lamps, seven cargo and gangway lanterns, the Marconi set, the navigation lights, the bridge, and the four boat winches by change-over switches | same | (paraphrase) | [read]; high |
| How long the lights lasted | practically until the last (Lee, Pearcey): steam was up for the dynamos to about 2:17 (T 157) | Report, "Final Effect", as read for `RESEARCH_pumps_bilge_ballast_v1_2026-11-17.md` §2 | "they kept alight practically until the last" | [read in the pump note] |
| Rockets | first fired about 12:47 (T 67), last about 1:50 to 1:52 (T 130 to 132) (WFB); QM Rowe fired distress signals until about 1:25 by his own clock, which WFB move to about 1:50; aboard: 36 socket signals and 12 ordinary rockets | WFB Table 2; Rowe, US Day 7; Report, "Life-Saving Appliances" | (paraphrase) | [read] |
| The sky | no moon; stars; perfectly clear; flat calm | Report, "The Weather Conditions", https://www.titanicinquiry.org/BOTInq/BOTReport/botRepWeather.php | "There was no moon, the stars were out" | [read]; high |

### 7.2 The cold

| Figure | Value | Source | Short quote | Tag; confidence |
|---|---|---|---|---|
| Air | 33 F (0.6 C) by about 7:30 pm, falling to 32 F (0 C) | Report, "The Weather Conditions" | (paraphrase) | [read]; high |
| Sea, measured | 31 or 31.5 F (-0.6 to -0.3 C) at 8 pm, taken by QM Hichens with a small paint tin on a line over the lee side, a duty every two hours; the answer itself does not say "water", but the method is the sea-water bucket | Hichens, US Day 5, https://www.titanicinquiry.org/USInq/AmInq05Hichens02.php | "the thermometer was down at 31 at 8 o'clock on Sunday evening" | [read]; medium-high |
| Sea, as usually quoted | 28 F (-2.2 C); found only in Beesley's later description and in secondary sources | search digest | (paraphrase) | [search summary]; low as a measurement |
| Survival in water near 0 C | exhaustion or unconsciousness in under 15 minutes; expected survival under 15 to 45 minutes (the standard hypothermia table for 32.5 F); critics note such tables ignore cold shock and drowning, which come sooner | cold-water survival tables (Mustang manual; boating safety pages; coldwatersafety.org), via search digest | (paraphrase) | [search summary]; medium |
| On the night | almost all in the water died within minutes, of cold shock and hypothermia | Wikipedia, "Sinking of the Titanic" | (paraphrase) | [read] (uncited lead sentence) |
| In a boat | the night was very cold, but those in Rowe's boat were well wrapped and did not suffer | Rowe, US Day 7 | (paraphrase) | [read] |

### 7.3 Taken from the water, and who went back

| Boat | Taken from the water | Source | Tag |
|---|---|---|---|
| 4 | about 8 (Wormstedt and Fitch); six or seven men who swam to it near the ship (Wikipedia); Wormstedt and Fitch count 4 rescued people in all who died after rescue and were buried from Carpathia, without naming the boats in the part I read | Wormstedt and Fitch (2011) via the HTML copy; Wikipedia | [read] |
| 14 | went back with volunteers 1.5 to 2 hours after leaving the ship (Lowe), having shared his 53 passengers among four boats (10, 12, a collapsible and one other, by his account; 4, 12 and D in Wormstedt and Fitch); picked up 4, of whom 1 (W. F. Hoyt) died in the boat; he waited because going sooner would have swamped the boat | Lowe, US Day 5, https://www.titanicinquiry.org/USInq/AmInq05Lowe06.php | [read] |
| A (by boat 14, towing D) | Lowe: about 20 men and 1 woman taken off, 3 bodies left; Evans: 20 to 25, 3 dead left; Wormstedt and Fitch: 12 to 13 alive | Lowe and Evans, US; Wormstedt and Fitch | [read]; conflict (§9) |
| B (upside down) | about 28 to 30 men on the hull by morning, taken into boats 4 and 12 | Wormstedt and Fitch; Wikipedia | [read] |
| D | 3 from the water (Wormstedt and Fitch); Wikipedia names Frederick Hoyt, who went into the sea after his wife's boat and was hauled into D by Woolner and Bjornstrom-Steffansson (a different Hoyt from the one who died in 14) | Wormstedt and Fitch; Wikipedia | [read] |
| All boats | about 40 rescued from the water by nearby boats (Wikipedia); with the men of A and B, about 55 to 65 of those alive at the rescue had been in the sea [derived: 8 (4) + 3 (14) + 3 (D) + 13 to 21 (A) + 28 to 30 (B)] | Wikipedia | [read] + [derived] |
| Did not go back | 5 (Pitman wanted to; the women objected), 6 (Hichens refused), 1 (no support), 7 (Hogg shouted down), 8 (Jones: three agreed) | Wikipedia, "Lifeboats of the Titanic" | [read] |
| Dead in the water | 150 to 200 bodies around the wreck when 14 went back (Evans) | Evans, US Day 8 | [read] |

## 8. Carpathia's pickup

Carpathia stopped at 4:05 am and picked up No. 2 at 4:10 (T 270); the boats were spread over four to five miles; she took aboard 13 lifeboats, the two cutters and two collapsibles and abandoned the rest; the Court says all were picked up by 8 am [read: Report, "The Rescue by the S.S. Carpathia", https://www.titanicinquiry.org/BOTInq/BOTReport/botRepRescue.php]. Most other sources put the last boat (No. 12) at about 8:30 [read: Wikipedia, citing Wormstedt and Fitch (2011), p. 144; a 1912 newspaper summary of Rostron, search digest].

| Order (by time) | Boat | Alongside | T | Source | Tag |
|---|---|---|---|---|---|
| 1 | 2 | 4:10 | 270 | Report; Wikipedia (W&F 2011, p. 144) | [read]; high |
| 2? | 1 | about half an hour after 2 (about 4:40) | about 300 | G. Jacub, "The order Titanic's lifeboats reached the Carpathia. Maybe." (2015, rev. 2016), https://titanicsecrets.blogspot.com/2015, from Moloney (2011) and survivors | [read]; low (the blogger's own caveat) |
| - | C | 5:45 | 365 | Wikipedia (no footnote); Rowe: about the ninth boat unloaded | [read]; conflict with Rowe |
| - | 5 | about 6:00 | 380 | Wikipedia (W&F) | [read] |
| - | 7 | about 20 minutes after 5 (Jacub) | about 400 | Jacub | [read]; low |
| - | 9 | about 6:15 | 395 | Wikipedia (W&F) | [read] |
| - | 13 | about 6:30 | 410 | Wikipedia (W&F, p. 140) | [read] |
| - | 11 | about 7:00 | 440 | Wikipedia (W&F) | [read] |
| - | 14 (towing D) | about 7:15 | 455 | Wikipedia (W&F) | [read] |
| - | D | 7:15 | 455 | Wikipedia (W&F) | [read] |
| - | 3 | about 7:30 | 470 | Wikipedia (W&F) | [read] |
| - | 8 | 7:30 | 470 | Wikipedia (W&F) | [read] |
| - | 15 | about 7:30 | 470 | Wikipedia (W&F) | [read] |
| - | 16 | NOT FOUND (Jacub: among the last group, before 8) | - | Jacub | [read]; low |
| - | 4 | 8:00 | 500 | Wikipedia (W&F, pp. 141, 144) | [read] |
| - | 6 | 8:00 | 500 | Wikipedia (W&F) | [read] |
| - | 10 | 8:00 (second to last) | 500 | Wikipedia (W&F) | [read] |
| last | 12 (with the men of B) | about 8:30 (8:15 elsewhere in the same article) | 530 (515) | Wikipedia (W&F); 1912 newspaper summary of Rostron | [read]; the BI's 8 a.m. conflicts |
| - | A | not picked up: its people went into 14 | - | Lowe | [read] |
| - | B | not picked up: its men went into 4 and 12 | - | Wormstedt and Fitch | [read] |

## 9. Conflicts between sources

| Question | Sources and values | Which I would use, and why |
|---|---|---|
| Launch times | British Inquiry (1912) against Wormstedt, Fitch and Behe (2001, rev. to 2023) against Halpern (2023), §3.4: 6 and 8 swapped; 10 first or last of the after port boats; 9 before or after 14; C at 1:40 or 2:00 | WFB: revised against the most testimony, and agreeing with Halpern on 10 and C. Run the BI table as a second case |
| First boat | all: 7 first, 5 second; Wikipedia's rendering of Halpern has 5 at 12:43 and 7 at about 12:45 | 7 first (Lowe, BI 15817) |
| Numbers in the boats | BI 854 (the lowest witness estimates, still 143 above the 711 saved); Gracie 795; Wormstedt and Fitch 671 lowered, 722 recovered against 712 | Wormstedt and Fitch for occupancy; the BI as an upper bound |
| Boat 14 | Lowe: 58 (US) or about 64 (BI); Wormstedt and Fitch 40; BI 63 | 40 to 58: take 50 for a single number [bet]; the record cannot settle it |
| Collapsible C | Rowe 39 plus 4 found at daylight (43); Wormstedt and Fitch 43; BI 71; Gracie 39 | 43 |
| Collapsible A at the rescue | Wormstedt and Fitch 12 to 13 alive; Lowe about 20 men and 1 woman; Evans 20 to 25; both say 3 dead left | 14, Wikipedia's figure for those alive when boat 14 came: between the named-survivor count and the two eyewitnesses' round numbers, which were given for men taken off a swamped boat at dawn [bet] |
| Aboard and saved | BI 2,201 and 711; US 706 saved; modern 712 saved, 2,207 to 2,224 aboard | 2,208 plus or minus 15 aboard, 712 saved |
| Capacity | BI 1,178; US 1,176 | 1,178 (it is the sum of the boats) |
| Electric boat winches | The Shipbuilder: for hoisting and lowering; Wikipedia: only to haul boats back up | Hoisting only on the night; no witness used one to lower |
| Davit capacity | The Shipbuilder: 16 sets, two or three boats each (32 to 48); Wikipedia: 64 boats | The Shipbuilder (the contemporary trade description) |
| Order to uncover | BI about 12:05 (T 25); WFB about midnight, by the Captain (T 20); Halpern about 11:57 (T 12 to 17); Lightoller: the Chief Officer told him to strip the covers almost at once after he came on deck | T 20, the order the Captain's |
| Collision time | 11:40 (BI and nearly all); 11:45 in Halpern's "Collision Point" | 11:40; Halpern's intervals carried over as intervals |
| Last boat at Carpathia | BI: all by 8 a.m.; Wormstedt and Fitch (via Wikipedia), Rostron (1912 newspaper summary): 8:30; the same Wikipedia article also says 8:15 | 8:30 for boat 12 |
| Collapsible C at Carpathia | Wikipedia 5:45, the first collapsible; Rowe: about the ninth boat unloaded | Unresolved: 5:45 with the caveat |
| Sea temperature | Hichens 31 to 31.5 F at 8 pm; 28 F in later and secondary accounts | -1 C plus or minus 1 C for the night; the difference matters little against survival times of minutes |
| Rowe's clock | Rowe left the bridge for C at 1:25 by his account; WFB put C at about 2:00 and have him at the rockets until after 1:50 | WFB; Rowe's own times look early throughout [bet] |
| The list | Lightoller: very little at boat 6 (T 90), corrected by moving passengers to starboard; pronounced, in WFB's word, at 4 and 10 (T 130); Rowe 5 to 6 degrees at C (T 140); survivors' 26 against 10 ft, about 10 degrees, at T 145; Halpern 10 to 15 degrees at 1:50 to 2:05 (`README.md`) | 5 to 10 degrees port at T 130 to 145 for the boats; the model's own list is low there (`README.md`, Known gaps), which will understate the port gap and the starboard rubbing |
| Drop to the water | BI 65 ft; WFB 60 ft; Lowe about 69 ft at boat 14 (T 105, after group, where trim by the head raises the deck); Wikipedia 90 ft (the keel figure) | 60 to 65 ft forward at T 60, about 69 ft aft at T 105: check the model's pose against both |
| Engines after the collision | Olliver: half ahead; Boxhall (search digest): full astern; Halpern: ran on, backed slowly, stopped, briefly ahead, stopped; Wikipedia (Halpern 2011): all stopped about five minutes after | stopped and dead in the water by T 15 to 20; it does not touch the boats |

## 10. NOT FOUND

- **Davit frame numbers and the sheer of the boat deck.** No HTML source I could open gives the davits' frames or the deck's height at each station; §1.2's metres are placements from landmarks (bridge 190 ft from the bow, deck about 500 ft long, the deckhouses).
- **An empty lifeboat's weight; the size of the manila falls.**
- **Halpern's "Lifeboats, Launch Times, List and Trim", Parts I and II (2023)**, read only through Wikipedia's citations and the repository's `README.md`; his tables of list and trim against each launch were not opened.
- **The 2026 study** "Titanic: The Lifeboat Launching Sequence: A New Study" by Fitch, Layton and Wormstedt (wormstedt.com, PDF, v1.3): too large for the fetch tool, and no search digest describes its changes. Its predecessor's own note says the new work fine-tunes some timings and leaves the substance standing.
- **Wilding's account of the loaded-boat test** on Olympic: found only in a search digest; the page was not among the four I opened.
- **Lowe's estimate of about 20 minutes a boat, in the US transcript:** quoted by WFB and a secondary site; not on the three US pages I opened.
- **Carpathia's pickup times for boats 1, 7 and 16.**
- **Any 1912 rule, testimony or Board of Trade guidance on lowering boats with way on.** Only a Second World War manual and today's rule.
- **Which deck lights on the boat deck were on the emergency circuit** beyond the Report's general statement, and whether the main circuit's deck lights burned to the end (the record says the lights burned practically to the last).
- **Survival-time research specific to Titanic** (cold-shock studies applied to the night): only general tables and Wikipedia's summary.
- **Whether any electric boat winch was used on the night.**
- **The number of seamen at each boat, boat by boat:** only the Court's average of three.

## 11. For the model

### 11.1 The twenty boats

Station x is metres forward of amidships (the model's frame), placed from landmarks [bet, +/-10 m]; the order within each group is [read]. Launch T is minutes after 11:40 pm on Wormstedt, Fitch and Behe's times (the BI's in brackets); occupancy is Wormstedt and Fitch's number at lowering (the BI's in brackets). "In boat" is the crew the Court counted in each boat [read]; "to lower" is what a boat needs on deck [bet from §2.4: two men on the falls at least, an officer or quartermaster to give the orders, four to eight for a smooth job].

| id | side | group, order | x (m) | capacity | launch T (BI) | aboard (BI) | crew in boat (BI) | to lower (min / good) | to man in the water |
|---|---|---|---|---|---|---|---|---|---|
| 7 | S | fwd, 4 | +35 | 65 | 60 (65) | 28 (27) | 3 | 3 / 8 | 4 |
| 5 | S | fwd, 3 | +46 | 65 | 64 (75) | 36 (41) | 5 | 3 / 8 | 4 |
| 3 | S | fwd, 2 | +56 | 65 | 75 (80) | 32 (50) | 15 | 3 / 8 | 4 |
| 8 | P | fwd, 4 | +35 | 65 | 80 (90) | 25 (39) | 4 | 3 / 8 | 4 |
| 1 | S | fwd, 1 | +67 | 40 | 85 (90) | 12 (12) | 7 | 3 / 6 | 3 |
| 6 | P | fwd, 3 | +46 | 65 | 90 (75) | 23 (28) | 2 | 3 / 8 | 4 |
| 16 | P | aft, 4 | -66 | 65 | 100 (115) | 53 (56) | 6 | 3 / 8 | 4 |
| 14 | P | aft, 3 | -55 | 65 | 105 (110) | 40 (63) | 8 | 3 / 8 | 4 |
| 12 | P | aft, 2 | -44 | 65 | 110 (105) | 42 (42) | 2 | 3 / 8 | 4 |
| 9 | S | aft, 1 | -34 | 65 | 110 (100) | 40 (56) | 8 | 3 / 8 | 4 |
| 11 | S | aft, 2 | -44 | 65 | 115 (105) | 50 (70) | 9 | 3 / 8 | 4 |
| 13 | S | aft, 3 | -55 | 65 | 120 (115) | 55 (64) | 5 | 3 / 8 | 4 |
| 15 | S | aft, 4 | -66 | 65 | 121 (115) | 68 (70) | 13 | 3 / 8 | 4 |
| 2 | P | fwd, 1 | +67 | 40 | 125 (125) | 17 (26) | 4 | 3 / 6 | 3 |
| 10 | P | aft, 1 | -34 | 65 | 130 (100) | 57 (55) | 5 | 3 / 8 | 4 |
| 4 | P | fwd, 2 | +56 | 65 | 130 (135) | 30 (40) | 4 | 3 / 8 | 4 |
| C | S | fwd, on boat 1's davits | +67 | 47 | 140 (120) | 43 (71) | 5 | 4 / 8 (sides raised, hooked on) | 3 |
| D | P | fwd, on boat 2's davits | +67 | 47 | 145 (145) | 20 (44) | 2 | 4 / 8 | 3 |
| B | P | officers' house roof | +64 | 47 | floated off upside down, T 155 | 28 to 30 on the hull | - | 6 to 10 to get it down, no gear | - |
| A | S | officers' house roof | +64 | 47 | floated off swamped, T 155 to 160 | 13 to 21 alive at the rescue | - | same | - |

Sums [derived]: 18 boats from the davits, 671 aboard of 1,084 places (BI 854); first at T 60, last at T 145; A and B never lowered.

### 11.2 Parameters for a simple launch model

| Parameter | Proposed value | Basis | Tag |
|---|---|---|---|
| Order to uncover | T 20 (1912); any time in a what-if | §2.4 | [read] |
| Uncover and clear the falls, per boat | 15 to 20 min with 2 or 3 hands; all 14 davit lifeboats in parallel by the deck crew; the cutters 1 and 2 are already swung out | Lightoller BI 13828, 13853; BI times 12:05 to 12:20 | [read]; well supported |
| Swing out | 2 to 3 min a boat | WFB | [read]; medium |
| Women and children ordered in | T 45 to 50 | §2.4 | [read] |
| Ready to load, 1912 | about T 45 for every davit boat [derived: T 20 + 20 + 3]; the first boat went at T 60 | §2.4, §3 | [derived] |
| Collapsibles C and D | unfold and raise the sides 15 to 20 min (can be done early: D was prepared by two seamen long before it went); hook on to the cutter's davits once the cutter has gone, then load and lower as a lifeboat | WFB; Wikipedia | [bet] for the minutes |
| Collapsibles A and B | get them down from the officers' house roof: 10 to 20 min with 6 to 10 men and improvised ramps of oars; on the night neither reached the falls before the water did | Wikipedia; Lightoller | [bet] for the minutes |
| Load rate with people waiting at the boat | 3 to 6 persons a minute (a boat in 10 to 15 min); from A deck through the windows about half that | WFB's 10 to 15 min; boat 4 | [derived]; medium |
| Who comes to the boat | the fill is the model's choice, not the gear's: 1912 calibration, fill 43 % of places at T 60 to 90, 76 % at T 100 to 121, 63 % at T 125 to 145; the jump comes as the trim passes about 3.5 degrees (3.2 at 12:55, 4.0 at 1:20). Drive willingness by the computed trim, not by the clock | §4.3; `README.md` trims | [derived] for the 1912 numbers; [bet] for the coupling |
| Policy | port: women and children only (men passengers about 2 % of those in port boats); starboard: women and children first, men to fill (about 8 %) | BI men counts 7 of 393 and 36 of 461 | [read] + [derived] |
| Lowering speed by hand | 0.055 m/s (60 ft in 5 to 6 min); 0.03 m/s when jerking or hung up (boat 1); a minute more to release and clear; never above 0.1 m/s on the night | WFB, Evans, boat 1 | [derived]; medium |
| Lowering with the electric winches | not on the night; if a what-if uses them: 100 ft/min = 0.51 m/s, four winches, hoisting gear | Report, "Electrical Installation" | [read]; the use for lowering is a [bet] |
| Cadence within a group, boats ready | one boat every 5 to 10 min per working team; 1 min at the fastest (13 and 15) | §3.3 | [derived]; well supported for 1912 |
| Teams | four groups, each worked by one or two officers moving between groups (7 officers, the Captain at the forward port boats); the after starboard boats had no officer until Murdoch came aft at about T 105 | WFB | [read] + [derived] |
| Hands | 66 in the deck department in all; an average of 3 deck hands at each boat; 107 crew went away in the 18 boats (about 6 a boat) | Report | [read] + [derived] |
| Gap to a port boat at its loading deck | g = 0.3 + L sin(phi) m, L = 3 m at the boat deck, 6 m at A deck; load at full rate while g < 0.6 m (phi below about 6 degrees at the boat deck), at half rate to g = 1.0 m (phi about 14 degrees), by jumping only beyond. 1912 check: boat 10 at T 130, g about 0.8 m, still took 57 | §5; Evans | [derived]; the thresholds are [bet] |
| Starboard boats with a port list | the boat bears on the side below L* = r / sin(phi), r = 0.5 to 1 m; lowering speed halved over that part; no lowering once phi exceeds about 15 degrees | §5; Rowe (five minutes for about 8 m at T 140: 0.027 m/s, half the normal rate) | [derived] for the halving; [bet] for the 15 degrees |
| Trim | the two falls differ by about 9 m x sin(theta); add 10 % to the lowering time for each degree beyond 5 [bet]; no hard limit while the deck at the station is above the water | §5 | [bet] |
| Deck at the station too low | a boat cannot be launched from davits once its station's boat deck is within about 2 m of the water; a boat still on the deck then floats off (A swamped, B upside down) | Lightoller BI 14020-14036; Wikipedia | [bet] for the 2 m; [read] for what happened |
| Drop to check the pose against | forward stations about 18 to 20 m at T 60 (BI 65 ft); after port station about 21 m at T 105 (Lowe); boat deck to water about 3 to 4.5 m at the forward port station at T 145 (D, 10 to 15 ft); starboard deck edge about 8 m and port about 3 m at T 145 (26 and 10 ft) | §2.2 | [read]; these are tests for the flooding model's pose, not inputs |
| Way on | 1912: none (stopped by T 15 to 20). What-ifs: launching normal at 1 knot or less, slower and at risk of swamping to 3 knots, not at all above 5 knots (today's design limit for gear built for it; dangerous for inexperienced crews in any way) | §6 | [read] for the 5 knots and the warning; [bet] for 1 and 3 knots |
| Capacity | 65, 40, 47; full boats were safe on the gear (Wilding's test; the Court); allow up to 1.08 x capacity (boat 15, about 70 of 65) | §1, §4 | [read] + [derived] |
| In the water | cold shock in the first minutes, then incapacity within 15 to 45 min at about 0 C; take survival as exp(-t / tau), tau about 15 to 20 min, so that a few in a thousand are alive at 2 hours (Lowe found 4, one dying) | §7 | [search summary] for the table; [bet] for tau |
| Rescue | Carpathia stopped at T 265; first boat T 270, last T 530 (BI: T 500); about one boat every 15 min | §8 | [read] + [derived] |

### 11.3 What is well supported and what is a bet

- **Well supported:** the 20 boats, their capacities (1,178), sides, groups and order on deck; the order of launching within each group; the times within about 10 minutes (WFB), with the BI table as the official alternative; the occupancy within about 10 % for most boats (Wormstedt and Fitch); the uncovering at about T 20 and Lightoller's 15 to 20 minutes a boat; the first launch at T 60 and the last from the davits at T 145; the ship stopped by T 15 to 20; the 65 ft drop at the start and about 10 ft at the forward port station at T 145; the 2.5 to 3 ft gap at boat 10; 5 to 10 degrees of port list at T 140 to 145; the electric winches' rating and their place on the emergency circuit; air 32 to 33 F and sea about 31 F.
- **Moderate:** the lowering speed (0.03 to 0.06 m/s, from four estimates); the load time (the authors' estimate); the crew per boat; the cadence per team; the survival table.
- **Bets:** the station metres (+/-10 m); the gap and rubbing thresholds and the 15-degree limit; the trim penalty; the collapsibles' preparation times; the speed limits of 1 and 3 knots; driving the fill by trim; tau for survival; Carpathia's times for 1, 7 and 16.
- **A warning for the coupling:** the flooding model's list is 2 to 6 degrees where the record has 10 to 15 at 1:50 to 2:05 (`README.md`, Known gaps). A launch model driven by the computed list will understate the gap at the late port boats and the rubbing of C; until the list is fixed, either accept that or let the launch model read the record's list.

## 12. Sources

Primary (1911-15), at the Titanic Inquiry Project (titanicinquiry.org):
- British Wreck Commissioner's Report (1912): contents, https://www.titanicinquiry.org/BOTInq/BOTReport/botRep01.php; "Life-Saving Appliances", https://www.titanicinquiry.org/BOTInq/BOTReport/botRepLSApp.php; "Electrical Installation", https://www.titanicinquiry.org/BOTInq/BOTReport/botRepElec.php; "The Weather Conditions", https://www.titanicinquiry.org/BOTInq/BOTReport/botRepWeather.php; "The Boats", https://www.titanicinquiry.org/BOTInq/BOTReport/BOTRepBoats.php; "The Rescue by the S.S. Carpathia", https://www.titanicinquiry.org/BOTInq/BOTReport/botRepRescue.php; "Numbers Saved", https://www.titanicinquiry.org/BOTInq/BOTReport/botRepSaved.php.
- British Inquiry transcripts: Lightoller, Day 12, https://www.titanicinquiry.org/BOTInq/BOTInq12Lightoller01.php, https://www.titanicinquiry.org/BOTInq/BOTInq12Lightoller02.php, https://www.titanicinquiry.org/BOTInq/BOTInq12Lightoller04.php; Lowe, Day 13, https://www.titanicinquiry.org/BOTInq/BOTInq13Lowe01.php; Wilding, Day 19, https://www.titanicinquiry.org/BOTInq/BOTInq19Wilding05.php, and Day 20, https://www.titanicinquiry.org/BOTInq/BOTInq20Wilding01.php (both opened; the boat test is not on them).
- US Senate Inquiry: Report, "Abandoning Ship", https://www.titanicinquiry.org/USInq/USReport/AmInqRep07.php; Lowe, Day 5, https://www.titanicinquiry.org/USInq/AmInq05Lowe02.php, https://www.titanicinquiry.org/USInq/AmInq05Lowe03.php, https://www.titanicinquiry.org/USInq/AmInq05Lowe04.php, https://www.titanicinquiry.org/USInq/AmInq05Lowe05.php, https://www.titanicinquiry.org/USInq/AmInq05Lowe06.php; Hichens, Day 5, https://www.titanicinquiry.org/USInq/AmInq05Hichens02.php; Rowe, Day 7, https://www.titanicinquiry.org/USInq/AmInq07Rowe01.php; Evans, Day 8, https://www.titanicinquiry.org/USInq/AmInq08EvansF01.php; Olliver, Day 7, https://www.titanicinquiry.org/USInq/AmInq07Olliver02.php, and Ray, Day 9, https://www.titanicinquiry.org/USInq/AmInq09Ray02.php (both search digests only).
- Limitation of Liability hearings, Wilding's deposition, https://www.titanicinquiry.org/lol/depositions/wilding05.php and https://www.titanicinquiry.org/lol/depositions/wilding06.php (opened; no boat test there).
- The Shipbuilder (1911), via GG Archives: "Working Arrangements", https://www.ggarchives.com/OT/Titanic/25-ImageLibrary/TheShipbuilder-08-WorkingArrangements.html; "Electrical Equipment", https://www.ggarchives.com/OT/Titanic/25-ImageLibrary/TheShipbuilder-07-ElectricalEquipment.html.
- The Electrician, 23 June and 4 August 1911, via GG Archives, https://www.ggarchives.com/OceanTravel/Titanic/25-ImageLibrary/TheElectrician.html.
- M. Darrah, "The Welin Quadrant Davit for Double-Banked Boats", Engineering, 1 July 1910, via TRMA, https://trmaarchive.com/db/db-01/db_06.html.
- GG Archives, "The Decks of the Titanic" (a period description, unattributed), https://www.ggarchives.com/OT/Titanic/01-PlanningBuildingLaunching/Decks-ComprehensiveDetails.html.

Researchers and secondary:
- B. Wormstedt, T. Fitch and G. Behe, with S. Halpern and J. K. Layton, "Titanic: The Lifeboat Launching Sequence Re-Examined" (The Titanic Commutator 155, 2001; online revisions 2009 to 2023): frameset https://www.wormstedt.com/Titanic/lifeboats/lifeboats.htm; article https://www.wormstedt.com/Titanic/lifeboats/lifeboatarticle.htm; Table 2 https://www.wormstedt.com/Titanic/lifeboats/lifeboattable2.htm; "Revised Launch Times" https://wormstedt.com/Titanic/revised.html; "Crew in Charge of Lifeboat" https://wormstedt.com/Titanic/crewcharge.html; "Lifeboat Survivor Totals" https://wormstedt.com/Titanic/totals.html; index https://wormstedt.com/titanic/.
- B. Wormstedt and T. Fitch, "Titanic Lifeboat Occupancy Totals" (2011, rev. 2016): PDF https://www.wormstedt.com/Titanic/lifeboats/occupancy.pdf (unreadable); HTML reprint, 18 April 2012, https://hercolano2.blogspot.com/2012/04/t-i-t-n-ic-life-b-o-t-o-c-c-up-n-cy-t-o.html (read). Also B. Wormstedt and T. Fitch, "An Account of the Saving of Those on Board", in S. Halpern (ed.), Report into the Loss of the SS Titanic: A Centennial Reappraisal (The History Press, 2011), cited by Wikipedia for occupancy and Carpathia times (not opened).
- T. Fitch, J. K. Layton, B. Wormstedt, "Titanic: The Lifeboat Launching Sequence: A New Study" (2026), https://wormstedt.com/titanic/TITANIC_THE%20LIFEBOAT%20LAUNCHING%20SEQUENCE_A%20NEW%20STUDY_v.%201.3.pdf (too large to read).
- S. Halpern, "Lifeboats, Launch Times, List and Trim", Parts 1 and 2 (Encyclopedia Titanica, 2023), https://www.encyclopedia-titanica.org/lifeboats-launch-times-list-and-trim-1.html and https://encyclopedia-titanica.org/lifeboats-launch-times-list-and-trim-part-2.html (refused); PDFs https://www.titanicology.com/Titanica/LifeboatLaunchTimesList%26TrimPart1.pdf and https://www.titanicology.com/Titanica/LifeboatLaunchTimesList%26TrimPart2.pdf (not tried).
- S. Halpern, "Collision Point", https://www.titanicology.com/Titanica/CollisionPoint.htm; list of his publications, https://www.titanicology.com/MyOnlinePublications.html.
- Wikipedia, "Lifeboats of the Titanic", https://en.wikipedia.org/wiki/Lifeboats_of_the_Titanic (launch times after Halpern 2023; occupancy and Carpathia times after Wormstedt and Fitch 2011); "Sinking of the Titanic", https://en.wikipedia.org/wiki/Sinking_of_the_Titanic (Ballard 1987, Lord 1976, Barczewski 2006, Halpern 2011, Halpern and Weeks 2011 as cited there).
- B. Read, "The Titanic 30 ft. Main Lifeboats", TRMA, https://www.trmaarchive.com/db/db-02/br-db-2-lb.html.
- G. Jacub, "The order Titanic's lifeboats reached the Carpathia. Maybe." (3 Aug 2015, rev. 15 Jul 2016), https://titanicsecrets.blogspot.com/2015 (after S. Moloney, "A chronology of rescue", Voyage 75, 2011).
- How to Abandon Ship, ch. 5, "Lowering" (US, Second World War era), at HyperWar, https://ibiblio.org/hyperwar/USN/ref/AbandonShip/Abandon-5.html.
- Search digests only: IMO LSA Code 6.1.2.8 and MSC.554(108) on lowering speed (Hong Kong Marine Department and IMO pages); IMO Resolution A.624(15) and the LSA Code on launching at 5 knots; cold-water survival tables (Mustang Survival manual; coldwatersafety.org; boating safety pages); Wilding's Olympic boat test (British Inquiry); Ray's account of boat 13 (US Day 9); Olliver's half ahead (US Day 7); a 1912 newspaper summary of Rostron (8:30 last boat).
- In this repository: `README.md` (the trim and list record the model is fitted to); `docs/research/RESEARCH_pumps_bilge_ballast_v1_2026-11-17.md` (the pattern; the lights to the last).
