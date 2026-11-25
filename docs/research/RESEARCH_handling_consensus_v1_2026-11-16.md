# How the Olympic-class liners handled: a consensus for fitting the motion model (v1)

Written 2026-11-16 19:05 CST by a research scout (Opus 5.5) for the lead session (the ship under way, P1 motion model). Public web pages only; nothing downloaded.

Lineage: builds on `RESEARCH_olympic_class_steering_propulsion_trials_v1_2026-11-16.md` (the "v1 fact sheet"; its sections 4 to 12 and its Conflicts list were read first) and on `out/trials.txt` of 2026-11-16 (the model's acceptance table). It does not repeat the v1 fact sheet's rudder, propeller and engine particulars.

Status: COMPLETE for v1.

## 1. Introduction, method and conventions

**Bottom line.**

- Four figures carry a fit. They are:
  - the trial circle, 3,850 ft at about 20 kn;
  - Olympic's two points in 37 s at 74 rpm;
  - the trial crash stop, just over 3,000 ft from 60 rpm;
  - 22.1 kn at 75 rpm.

  Everything else is a check, or too soft to use.
- The 37 s was most probably measured with both engines rung full astern together with the helm (Wilding in 1915: "And reversed both engines."). Reversing cut the turbine out at once. Fit it under that condition (Conflict 1).
- Four of the six OUT rows in `out/trials.txt` are reference problems, not model faults:
  - The advance is compared with a figure whose origin is not the helm order (section 8.2).
  - The steady rate and the heel compare 20-kn runs with Halpern's 22.5-kn numbers. Speed held, rate and heel are one unknown, and nobody measured it (section 8.3).
- Two OUT rows are real:
  - Slow ahead, with Half ahead marginal: the model loses speed too fast as rpm falls.
  - The 11-kn circle, if the trial ran it with the turbine out (Conflict 2).
- No measurement exists, for any Olympic-class ship, of:
  - speed in a turn, rate of turn, drift or heel;
  - coasting with the engines stopped;
  - acceleration from rest;
  - Britannic's trials.

**Method.**

- I re-opened the primary record on titanicinquiry.org:
  - British Inquiry Days 3, 12, 16, 24, 25, 27 and 29;
  - US Senate Inquiry Day 1 (Lightoller) and the Cone letter;
  - Wilding's 1915 deposition, pages 02 to 07.
- Then the published reconstructions: Halpern, Mengot, Currie, Elliott, Maltin, Chirnside, and Eda and Numano.
- Then web searches for anything else. Pages that refused the fetch tool (403) were read in the app's built-in browser. Halpern's PDFs were not opened: reading them would mean downloading the files.
- Every fact carries one of three tags:
  - **[O]**: I opened the page and read the passage.
  - **[S]**: seen only in a search engine's result summary.
  - **[V1]**: taken from the v1 fact sheet (opened by that scout today), not re-opened here.
- Quotes come only from the public record of 1911 to 1915 (the inquiries, the depositions, the 1912 Cone letter and The Shipbuilder of 1911), each under 15 words. Modern works are paraphrased.

**Conventions.**

- Units:
  - 1 ft = 0.3048 m; 1 kn = 0.514444 m/s; 1 nm = 1,852 m (6,076 ft).
  - 1 long ton = 1.01605 t. "tons" means long tons unless "t" is written.
- L = 850 ft (length between perpendiculars) unless stated; 882.75 ft overall.
- Two points = 22.5 deg.
- Advance is the distance along the original course from the helm order to a heading change of 90 deg. Tactical diameter is the transfer at 180 deg.
- Abbreviations:
  - BI nnnnn: a British Inquiry question number.
  - LoL 1915: Edward Wilding's deposition in the Limitation of Liability hearings, New York, May 1915.
  - ET: Encyclopedia Titanica.

**The two conditions.**

- The model (`core/motion.js`) runs at the night's mean draft, 9.83 m (32 ft 3 in), and 49,021 t (48,246 tons).
- The Titanic trials were run at a mean draft of about 30 ft, about 44,400 tons (section 6). That is about 8% lighter.

## 2. Turning: measurements and testimony

| Figure | Value as given | SI | Source (author, title, URL) | Short quote | Confidence |
|---|---|---|---|---|---|
| Titanic trial circle, "full speed", helm hard over: tactical diameter | 4 to 4.5 lengths; asked for her "lateral movement", he first said over 4,000 ft, then "under 4,000 feet; just under; between 3800 and 3900" | 1,158-1,189 m (feet); 4-4.5 L = 1,036-1,211 m | [O] Edward Wilding (Harland & Wolff), LoL 1915, https://www.titanicinquiry.org/lol/depositions/wilding03.php | "between 4 and 4-1/2 lengths of the vessel, in diameter" | High: he superintended the trial; feet and lengths agree; from memory (the plotted diagram was at his home, wilding05.php) |
| Same circle: forward travel | "about 2-1/2 lengths"; confirmed as "her forward movement" | 640 m (2.5 L = 648-673 m) | [O] same page | "It is about 2100 feet, or thereabouts; 700 yards." | Medium as a number; low as an advance from the helm order (origin not stated; section 8.2) |
| Two trial circles handed to the Inquiry, off Belfast Lough | (a) both engines full ahead, hard-a-starboard, head to port; (b) hard-a-port, head to starboard, starboard engine full astern; both 18-20 kn | 9.3-10.3 m/s | [O] Wilding, BI 25291, Day 27 (19 June 1912), https://www.titanicinquiry.org/BOTInq/BOTInq27Wilding01.php | "Both of those curves were at speeds of between 18 and 20 knots." | High that they were measured; the plots were exhibits, their dimensions never read into the record |
| Three circles at different speeds | Engines kept at the same speed ahead, hard-a-starboard, "plotted ... in comparison" | 5.66, 10.03, 11.19 m/s | [O] same, BI 25291 | "the speeds being 11 knots, 19 1/2 knots, and 21 3/4 knots" | High that they exist; the turbine state of the slow circle is not stated |
| Effect of speed on the circle | Lower speed increases the radius, and the forward and sideways distance; lowest circle "about 12 knots", the Titanic herself | - | [O] Wilding, LoL 1915, https://www.titanicinquiry.org/lol/depositions/wilding05.php | "but only by a very small amount" | High as the measurer's statement; not quantified; 12 kn here, 11 kn in 1912 |
| Effect of speed, relayed in 1912 | Circles at "roughly 22 knots" and "broadly speaking, 11 knots" about the same; two points in 37 s at the higher speed, 74 s at the lower, "double as long" | 74 s | [O] Mr Roche (counsel, Marine Engineers' Association), closing argument relaying what Wilding told him, BI Day 29 (24 June 1912), https://www.titanicinquiry.org/BOTInq/BOTInq29Header.php | "the turning circle is about the same at the two speeds" | Medium: counsel's relay. The 74 s is a proportional inference, not a timing. This is Halpern's "Mr. Roche, p. 770" source |
| Condition of the Inquiry's turning diagram | Both engines full ahead, rudder hard over; marked with the position when the crow's-nest bell rang; the Commissioner asked for the one-engine-reversed circle | - | [O] BI Day 25 (17 June 1912), https://www.titanicinquiry.org/BOTInq/BOTInq25Header.php | "Both engines full ahead and the rudder put hard over." | High |
| Olympic two-point turn, after the disaster | About 74 rpm, about 21.5 kn; 37 s from the order to put the helm hard over until two points | 11.06 m/s; 0.61 deg/s mean | [O] Wilding, BI 25292 | "till the vessel had turned two points was 37 seconds" | High as a timing; the engines are not mentioned here (next rows) |
| Distance run in those 37 s | 0.2 nm by log; Wilding's estimate 1,200-1,300 ft | 370 m by log; 366-396 m | [O] BI 25293 | "The distance run by log was given to me as two-tenths of a knot" | High as testimony; a log reads to about 0.1 nm |
| What the Olympic tests reproduced | Run under his direction while he was in court, to find advance and lateral movement over two points under the orders "reported to have been given at the time of the accident". At "say 22 knots", hard-a-starboard; he himself added that both engines were reversed. Advance 440 yd, struck out as hearsay: the senior assistant who ran the tests had died | 11.3 m/s; 402 m | [O] Wilding, LoL 1915, wilding03.php (URL above) | "And reversed both engines." | Medium-high for the condition (he designed the tests). The 440 yd was struck, but 440 yd = 1,320 ft matches the 1,200-1,300 ft of BI 25293, so it is very probably the same run as the 37 s |
| The British Report's use of it | "From various experiments" with Olympic at Titanic's speed: about 37 s for two points after hard-a-starboard; about 466 yd run; iceberg therefore sighted at about 500 yd | 426 m; 457 m | [O] British Wreck Commissioner's Report, "The Collision", https://www.titanicinquiry.org/BOTInq/BOTReport/botRepCollision.php | "In this time the ship would travel about 466 yards" | Medium. 466 yd is 22.5 kn x 37 s, not the measured distance. "Various experiments" is plural |
| An officer's estimate | With the helm hard over and both engines ahead, she could turn "in about three times her length" | 3 L = 777-807 m | [O] C. H. Lightoller, BI 14515-14516 (Day 12), https://www.titanicinquiry.org/BOTInq/BOTInq12Lightoller07.php | "she could turn in about three times her length" | Low: an estimate; speed and measure not stated |
| What the trial circles covered | Turning circles at several helm angles and engine speeds, about five hours; the full-astern stop afterwards took a few minutes | - | [O] Lightoller, US Senate Inquiry Day 1, https://www.titanicinquiry.org/USInq2/AmInq01Lightoller01.php | "seeing in what space the ship will turn under certain helms" | High that circles were run at more than one helm angle; no figures survive |
| Twisting circle on trials | Asked about the port screw astern and the starboard ahead at about full speed; could not give the size in lengths | - | [O] Francis Carruthers (Board of Trade surveyor, Belfast), BI 23988-23998 (Day 24), https://www.titanicinquiry.org/BOTInq/BOTInq24Carruthers02.php | "she made a very small circle, I observed, and it was noticed" | Medium, qualitative; "port astern" is counsel's wording and differs from Wilding's circle (b) |
| Hard over | 40 deg on the night, by the helmsman | 0.70 rad | [O] QM Robert Hichens, BI 998 (Day 3), https://www.titanicinquiry.org/BOTInq/BOTInq03Hichens01.php | "Forty degrees." | Medium-high; the trial's "hard over" is presumably the same stop |
| Handling on trials (qualitative) | Behaved and manoeuvred well | - | [O] Fifth Officer Harold Lowe, deposition (May 1912), quoted on Soliloquism, "Titanic Behaved Splendidly" (2020), https://soliloquism.com/2020/04/10/titanics-sea-trials/ | "on the trials the Titanic behaved splendidly and manoeuvred very well" | Low-medium (second-hand page) |
| Advance and transfer from the helm order; times to 90 and 180 deg; circles at other helm angles | NOT FOUND in any record | - | - | - | - |

## 3. Speed lost in a turn, rate of turn, drift, heel

| Figure | Value as given | SI | Source (author, title, URL) | Short quote | Confidence |
|---|---|---|---|---|---|
| Average speed over the first 37 s of the Olympic turn | 0.2 nm in 37 s = 19.5 kn, 0.90 of 21.5 kn; 1,200-1,300 ft in 37 s = 19.2-20.8 kn, 0.89-0.97 | 10.0 m/s | [O] derived from BI 25292-25293 (my arithmetic) | - | Medium: coarse log; if both engines were reversed, part of the loss is the engines |
| Steady-turn speed, rate, radius | Speed ratio 0.76-0.77 (17.1 kn from 22.5 kn), read from a chart for diameter/length 4.53 and Cb 0.684; rate 0.86 deg/s; radius 1,925 ft | 0.0150 rad/s; 587 m | [O] Samuel Halpern, "Turning in Circles" (slides, rev. 24 Mar 2007), https://slidetodoc.com/turning-in-circles-the-turning-characteristics-of-the/ | (paraphrase) | Low-medium: an empirical relation from a US naval course text, not a measurement |
| Same, 2010 paper | Steady turning speed about 17 kn, drift 8 deg, heel 6 deg | - | [O] Halpern, "She Turned Two Points in 37 Seconds" (TRMA, Jan 2010), ET summary page, https://www.encyclopedia-titanica.org/she-turned-two-points-in-37-seconds.html | (paraphrase) | Low-medium (summary; the paper is a PDF, not read) |
| Drift angle and pivot point | Drift 18 L/R deg = 7.95 deg; pivot point 266 ft ahead of the centre of gravity, about 159 ft from the bow (about L/6) | 81 m; 48 m | [O] Halpern slides (as above) | (paraphrase) | Low: rules of thumb |
| Heel in a full-speed hard turn | 5.4 deg steady, from GM 2.6 ft, lever H 18.6 ft, 48,300 tons, 29 ft/s in the turn, radius 1,925 ft; inputs credited to the "Bedford & Hackett paper" | GM 0.79 m; H 5.67 m; 8.84 m/s | [O] Halpern slides | (paraphrase) | Low-medium: Halpern's calculation with Hackett and Bedford's night-condition stability; never observed |
| Speed through a turn (period, general) | Speed falls through the first 180 deg, fastest between 20 and 90 deg | - | [S] Admiralty, "Handling Ships" (OU 5274, 1934/1941), seen only in a search summary, https://globalmaritimehistory.com/wp-content/uploads/2023/06/OU5274_Handling_Ships_1934_1941_OCRd.pdf | - | Low (generic; not opened) |
| A measured rate of turn, speed in a turn, drift or heel for any Olympic-class ship | NOT FOUND | - | - | - | - |

## 4. Stopping, reversing, coasting

| Figure | Value as given | SI | Source (author, title, URL) | Short quote | Confidence |
|---|---|---|---|---|---|
| Titanic crash stop, trials, 1912 account | About 60 rpm, about 18 kn; helm amidships; both engines reversed; way off in about 3 min 15 s from the order; the engines were reversed more slowly than usual, so the distance is "probably a little on the large side" | 9.26 m/s; 195 s; >= 914 m | [O] Wilding, BI 25295 | "the distance run was just over 3,000 feet" | High: the director of the trial, eleven weeks after it |
| Same trial, 1915 account | About 20 kn ("Not quite full speed"), telegraph at full; signal as the buoy passed under the bridge; Smith rang full astern on both; sextant fixes every 15 s until good sternway; "Rather under half a mile" | 10.3 m/s; < 926 m; about 805 m | [O] Wilding, LoL 1915, wilding03.php and wilding05.php | "I mean a nautical mile; about half a land mile." | Medium-high: the same man, from memory three years later |
| Other stopping tests | None | - | [O] wilding05.php | "No, only at what was called full speed." | High |
| Olympic crash stop, trials May-June 1911 | About 22 kn, same place; engines "rather more smartly handled" | 11.3 m/s | [O] wilding03.php | "she stopped in just about the same distance; rather less" | High as testimony; no number |
| Speed sensitivity (another, smaller ship) | 19 kn cut to 9.5 kn shortened the stop only about 15% | ratio 0.80-0.85 | [O] wilding05.php | "from 100 to somewhere between 80 and 85" | Medium: not an Olympic-class ship |
| Popular figure | 850 yd in 3 min 15 s, full ahead to full astern | 777 m; 195 s | [O] Wikipedia, "Titanic", sea trials, citing Chirnside, The Olympic-Class Ships (2004) pp. 39-40, https://en.wikipedia.org/wiki/Titanic. Also [O] unsourced on Ultimate Titanic, https://ultimatetitanic.com/?p=17, and in an unsourced web text quoted on the ET forum, https://www.encyclopedia-titanica.org/community/threads/optimal-speed-to-avoid-collision.53467/page-2 ("850 yards (unloaded)" from 20 kn) | (paraphrase) | Low: no primary source found (Conflict 5) |
| Duration of the trial's full-astern test | A few minutes | - | [O] Lightoller, US Inquiry Day 1 (URL above) | "That was only the matter of minutes." | Medium; consistent with 195 s |
| Bridge to engine room, trials | Smith moved the telegraph at Wilding's signal | - | [O] wilding03.php | "It was practically instantaneous." | High for the bridge end only |
| Turbine when reversing | Reversing the engines takes the turbine out | - | [O] wilding03.php | "it automatically cuts out the turbine" | High |
| Time to reverse (general) | Bridge-to-engine signal at most 10 s. Halpern reads Cone as 10-20 s to stop and start astern, then 30-50 s more to back hard; the changeover valve about 10 s | - | [O] H. I. Cone (Engineer-in-Chief, US Navy), letter of 8 May 1912 to the US Senate inquiry, https://www.titanicinquiry.org/USInq/AmInq17Cone01.php; [O] Halpern, "Titanic's Prime Mover" (rev. 31 Jan 2011), note 13, http://www.titanicology.com/Titanica/TitanicsPrimeMover.htm | "not to exceed 10 seconds" | Medium: a general naval estimate, not these ships |
| Measured comparator: USS Delaware (reciprocating engines), about 21 kn | Engines started backing 10 s (port) and 22 s (starboard) after the signal; backing hard at 60 s and 52 s; dead in the water in 1 min 52 s | 112 s; mean 0.097 m/s2 | [O] Cone letter (as above) | (table in the letter) | Medium as a measurement. A battleship of about 20,000 tons (my note, not in the letter), far stronger astern for her size |
| Comparator: USS North Dakota (turbines) | Dead in the water in 6 min 56.4 s with "very bad" valves; about 5 min expected | 416 s | [O] Cone letter | - | Low |
| Titanic's astern power | No more than about half the ahead power (the turbine cannot go astern) | - | [O] Cone letter | (paraphrase) | Medium (reasoned, not measured) |
| Rudder while reversing (period rule) | While a ship stops herself by reversing her screw, the rudder loses its usual turning effect | - | [O] Jim Currie, "Hard a starboard" (ET, 21 Jan 2015), https://www.encyclopedia-titanica.org/hard-a-starboard-jim-currie.html, quoting Nicholls's Seamanship, which cites White's Manual of Naval Architecture | (paraphrase) | Medium as a period principle, stated for single-screw ships. Olympic's rudder sat behind the centre screw, which stopped and was not reversed |
| The night, engines | "Stop" before the impact. Engines stopped about 1.5 min after the shock, then slow astern about 2 min, ahead about 2 min (Dillon). About 4-6 kn through the water a few minutes later; dead in the water by about 11:57 p.m. | 2.1-3.1 m/s | [O] Dillon, BI 3721-3728, as quoted on the ET forum, https://www.encyclopedia-titanica.org/community/threads/how-long-did-it-take-to-reverse-titanics-reciprocating-engines.53132/; [O] Halpern, "Collision Point", http://www.titanicology.com/Titanica/CollisionPoint.htm; [V1] Barrett, BI 1860-1867 | "About a minute and a half." | Medium-low; not a crash-stop test |
| Coasting with the engines stopped (no astern) | NOT FOUND for any Olympic-class ship | - | - | - | - |

## 5. Speed against revolutions

| Figure | Value as given | SI | Source (author, title, URL) | Short quote | Confidence |
|---|---|---|---|---|---|
| 75 rpm | Between 21.75 and 22 kn (counsel's figure, Ismay assenting) | 11.19-11.32 m/s | [O] BI 18372 (Day 16), https://www.titanicinquiry.org/BOTInq/BOTInq16Ismay02.php | "75 gives between 21 3/4 and 22 knots" | Medium-high |
| 75 rpm, a day's run | 546 nm in 24 h 45 min, noon 13 to noon 14 April: 22.1 kn over ground (Halpern 22.06) | 11.35 m/s | [O] Halpern, "Keeping Track of a Maiden Voyage" (White Star Journal, Aug 2006), https://www.encyclopedia-titanica.org/keeping-track.html; [O] "Speed and Revolutions" (below) | (paraphrase) | Medium-high (over ground; current) |
| 70 and 72 rpm, days' runs | 70 rpm: 484 nm in 23 h 04 min = 21.0 kn (11-12 April). 72 rpm: 519 nm in 24 h 49 min = 20.9 kn (12-13 April). Both over ground | 10.80; 10.75 m/s | [O] Halpern, "Keeping Track" | (paraphrase) | Low-medium: Halpern himself notes the North Atlantic Drift |
| 74 rpm (Olympic, 1912) | About 21.5 kn | 11.06 m/s | [O] BI 25292 | "She was running at about 74 revolutions" | High |
| 60 rpm (Titanic, trial, about 30 ft draft) | About 18 kn | 9.26 m/s | [O] BI 25295 | "about 60 revolutions, corresponding to a speed of about 18 knots" | High; light draft (section 6) |
| Telegraph orders, Olympic 1911 | "Reduced" full about 75 rpm, about 20 kn; Half 50 rpm, about 15 kn; Slow 30 rpm, 8-9 kn. He called it easy steam, coming in and out of port | 10.3; 7.7; 4.1-4.6 m/s | [O] Capt. E. J. Smith, Hawke case (1911), quoted in Halpern, "Speed and Revolutions" (rev. 16 Oct 2015), http://www.titanicology.com/Titanica/SpeedandRevolutions.htm | "Slow 30 [revolutions] would be 8 to 9 knots." | Medium: the master's words. Olympic's wing pitch was then 33 ft (Titanic 35 ft); his 75 rpm and 20 kn is a coastal figure |
| Turbine use; Slow | Turbine connected only for Ahead Half or Ahead Full; Half = 50 rpm; bypassed astern and when manoeuvring; Slow Ahead 9 kn at 30 rpm | 4.63 m/s | [O] Robert Fleming (Olympic's chief engineer), Hawke case 1911, as relayed by Halpern (same URL) | (paraphrase) | Medium (relayed) |
| Closed-water orders | Full 65, Half 55, Slow 35 rpm; Dead Slow 20-25 rpm | - | [O] Charles McKimm (Olympic engineer), Halpern note 11 | (paraphrase) | Medium |
| Service full speed | 78 rpm, working up to 80; Titanic about 1/8 to 1/4 kn better than Olympic (Ismay, 1915) | - | [O] J. Bruce Ismay, US Inquiry and LoL hearings, quoted by Halpern (same URL) | "The full speed of the ship is 78 revolutions." | Medium-high |
| Maximum | 83 rpm, about 59,000 hp (Fleming) | - | [V1] Halpern, "Titanic's Prime Mover" | - | Medium |
| Titanic's best trial speed | About 23.25 kn for several hours on 3 April, running south; mean draft about 30 ft; rpm not given | 11.96 m/s | [O] Wilding, LoL 1915, https://www.titanicinquiry.org/lol/depositions/wilding06.php | "we obtained a speed of about 23-1/4 knots for several hours" | High as testimony; light draft; rpm unknown |
| 2 April speeds | About 80 nm at an average of 18 kn; maximum just under 21 kn | 9.26; 10.8 m/s | [O] Wikipedia, "Titanic", citing Eaton and Haas (1995) p. 45 | (paraphrase) | Low-medium (book not opened) |
| Olympic 1911 trial speed | The design speed was exceeded (The Shipbuilder; its figures are garbled online). Wikipedia says no speed test was run. A blog gives 21.75 kn maximum, unsourced | - | [O] The Shipbuilder (1911) via GG Archives, https://www.ggarchives.com/OceanTravel/Titanic/25-ImageLibrary/TheShipbuilder-09-OlympicSeaTrials.html; [O] https://en.wikipedia.org/wiki/RMS_Olympic; [O] https://www.marpubs.com/28th-may-1911-olympics-sea-trials | "the designed speed of 21 knots was exceeded" | Low (conflicting; no rpm) |
| Halpern's speed law | Turbine in (50 rpm and up): V = 0.563 R^0.8472 kn for Olympic; Titanic 1.45% faster. Turbine out: V = 0.488 R^0.8472. Titanic: 50 rpm 15.71, 60: 18.33, 70: 20.89, 75: 22.15, 80: 23.39 kn. Turbine out: 30 rpm 8.83, 35: 10.06, 40: 11.27 kn | - | [O] Halpern, "Speed and Revolutions" | (paraphrase) | Medium: three points, one at light draft, plus a power-share assumption for turbine out |
| Wing-screw pitch | Olympic 1911: 33 ft (34 ft 6 in from November 1911). Titanic: 35 ft | 10.06; 10.67 m | [V1] Harland & Wolff notebook, via Mark Chirnside (ET, 2020) | - | High |
| Acceleration from rest | NOT FOUND | - | - | - | - |

## 6. Draft and displacement at each trial

| Figure | Value as given | SI | Source (author, title, URL) | Short quote | Confidence |
|---|---|---|---|---|---|
| Titanic trials, 2-3 April 1912 | Mean draft about 30 ft. Sea fairly smooth, light breeze, sheltered water on 2 April; fine and bright on 3 April | 9.14 m | [O] Wilding, LoL 1915, wilding05.php and wilding06.php | "About 30 feet; she was almost fully coaled." | High |
| Displacement at the trial draft | About 44,400 tons: 52,310 tons at 34 ft 7 in, less 55 in x 143.8 tons per inch | about 45,100 t | Derived. 143.8 tons per inch [S]: an H&W record cited in Halpern, "A Matter of Stability and Trim", https://www.titanicology.com/Titanica/Stability%26Trim.pdf. 52,310 tons at 34 ft 7 in [S], per a search summary of Wilding's British evidence. The 34 ft 7 in load draft [O] wilding02.php | - | Medium (derived; range 44,000-45,000 tons) |
| Departure, Southampton, 10 April | 33 ft 8 in forward, 34 ft 4 in aft, from Wilding's note; mean 34 ft 0 in, about 51,300 tons (derived) | 10.26 / 10.46 m; about 52,100 t | [O] Wilding, LoL 1915, https://www.titanicinquiry.org/lol/depositions/wilding07.php | "33 feet 8 inches forward and 34 feet 4 inches aft" | High |
| The night, 14 April | Mean draft 32 ft 3 in (Wilding's estimate for the Wreck Commission, from Olympic's voyages); 48,300 tons; GM 2 ft 7.5 in (Hackett and Bedford, from Olympic's 1911 data) | 9.83 m; 49,075 t; 0.80 m | [S] Halpern, "A Matter of Stability and Trim" (search summaries); [O] wilding02.php (method); [O] Halpern slides (GM 2.6 ft, 48,300 tons); [O] the model, `core/motion.js` (9.83 m, 49,021 t) | "on the result of the four preceding voyages of the Olympic" | Medium-high; check: 52,310 - 28 in x 143.8 = 48,284 tons |
| Olympic's trials, May 1911 | Draft and displacement NOT FOUND. The Shipbuilder remarks, in general, that the quoted speeds needed a lighter draft | - | [O] The Shipbuilder via GG Archives | (paraphrase) | Low |
| Olympic's 37-s test, May-June 1912 | Draft, displacement and sea state NOT FOUND (the ship was in service) | - | - | - | - |
| Olympic, Hawke case 1911 | About 53,000 tons used by Biles with 165 tons of resistance at 21 kn | 53,850 t | [V1] Halpern, "Prime Mover", note 2 | - | Medium |
| Britannic trials, December 1915 | No primary record known to survive; no measured mile; 20-21 kn on her voyages; wing screws 23 ft 9 in for 77 rpm | - | [O] Mark Chirnside, ET forum "Britannic's Screws" (2002), https://www.encyclopedia-titanica.org/community/threads/britannics-screws.3333/ | (paraphrase) | Medium |

## 7. Published reconstructions (models and estimates, not measurements)

| Figure | Value as given | SI | Source (author, title, URL) | Short quote | Confidence |
|---|---|---|---|---|---|
| Halpern's turning model | Three-phase model fitted to the 37 s and the 3,850-ft circle. Advance 2,540 ft; transfer at 90 deg 1,740 ft; final diameter 3,860 ft; tactical diameter 3,880 ft. Ratio 0.76-0.77; 0.86 deg/s; radius 1,925 ft; drift 7.95 deg; heel 5.4 deg; rudder force 334 tons at 20 kn. He cites 440 yd for two points at 22 kn from Wilding at Ryan v. Oceanic Steam Navigation Co. (1913) and at the 1915 hearings, and 3,850 ft at 20.5 kn with 2,100 ft forward from Eaton and Haas | 774; 530; 1,177; 1,183; 587 m | [O] Halpern, "Turning in Circles" (rev. 24 Mar 2007), slidetodoc URL above | (paraphrase) | Medium: transparent; fitted to the same two numbers as our model; treats the 37 s as a helm-only turn |
| Halpern's 2010 paper | One point (11 deg) turned before the strike, 20-25 s after the order. Steady 17 kn, drift 8 deg, heel 6 deg. The engines played little or no part. Appendices on rudder force, heel and speed loss | - | [O] ET summary page; [O] Halpern's post of 3 Jan 2010, https://www.encyclopedia-titanica.org/community/threads/two-points-in-thirty-seven-seconds.4751/; [S] one search summary of the PDF gives "Advance 2746 ft / Tactical diameter 3860 ft", and that he holds Wilding's 700 yd not to be the advance | (paraphrase) | Medium; the 2,746 ft is unconfirmed (PDF not opened) |
| Hackett and Bedford, "The Sinking of S.S. Titanic - Investigated by Modern Techniques" (RINA, 1996) | GM 2 ft 7.5 in, from Olympic 1911 data; 48,300 tons. The 5.4 deg heel is Halpern's calculation with their inputs, not their result | - | [O] via Halpern's slides; [S] via "A Matter of Stability and Trim"; the paper itself not opened | - | Medium for the inputs |
| Roy Mengot, "Titanic and the Iceberg" (TRMA, undated) | Takes the circle as 3,850 ft at 21.5 kn (an assumption); a full circle in 340 s at constant speed; two points in 25-30 s. He calls the 37 s about 50% slower than the trial implies and suspects the Olympic test reversed the engines. Rudder 60 deg in 5-7 s (unsupported) | 1,174 m; 340 s | [O] https://wormstedt.com/RoyMengot/TitanicWreck/TRMA/Roy%20Mengot.%20Titanic%20and%20the%20Iceberg.html | (paraphrase) | Low: no rudder time, no build-up, no speed loss |
| Haruzo Eda and Masayoshi Numano, "Analysis of Major Marine Disasters: Case Studies of TITANIC and Cruise-Ship-Grounding" (conference proceedings in the Nippon Foundation library, filed under 2003; the year is not printed on the pages read) | Simulation with SL-7 rotating-arm data. At 23.3 kn: turning advance 3.4 L, stopping advance 6 L; full rudder with full astern 3.6 L. At 11.6 kn, rudder with astern 2.1 L. Full astern reduces the rudder's effect on the three-screw, one-rudder ship. Particulars partly wrong (displacement 60,000; four-bladed 16 ft 6 in centre screw) | 3.4 L = 881-915 m; 6 L = 1,554-1,614 m | [O] https://nippon.zaidan.info/seikabutsu/2003/00574/contents/0268.htm and .../0267.htm | (paraphrase) | Low: another hull's hydrodynamics; no trial fit |
| Jim Currie, "Hard a starboard" (ET, 2015) and "Six Seconds to Disaster" (2011) | No zig-zag. Stop and then astern made the rudder nearly useless. Wheel hard over in 4-6 s, about 6 s of swing before the impact [V1] | - | [O] ET URL above; [V1] | (paraphrase) | Low-medium (a master mariner's argument) |
| Richard Elliott, "Could Titanic have survived a head-on impact?" (ET) | Mass 49,075 t at the collision. In many ships the circle is much the same over a wide range of speeds. At about 11.5 kn the turbine would normally not run, so a slow turn may be no tighter | - | [O] https://www.encyclopedia-titanica.org/could-titanic-have-survived-a-head-on-impact.html | (paraphrase) | Low-medium |
| Tim Maltin, "If Titanic had been going more slowly..." (2019) | Quotes the Day 29 passage (37 s and 74 s) as Wilding's own words | - | [O] https://timmaltin.com/2019/03/18/titanic-more-slowly/ | (paraphrase) | Low: it is counsel's relay (section 2) |
| Mark Chirnside | 850-yd crash stop (book, 2004, via Wikipedia). From 1932-33 records: 78 rpm normal, up to 23 kn in good conditions (his estimate). Britannic's trials unrecorded | - | [O] Wikipedia; [O] "The Twenty-One Knot Myth" (TRMA), https://trmaarchive.com/articles/markchirnside/21knots.shtml; [O] ET forum (section 6) | (paraphrase) | Medium for the archival facts; the 850 yd source unknown |
| Eaton and Haas, Titanic: Triumph and Tragedy (2nd ed., 1995) | 3,850 ft at 20.5 kn, 2,100 ft forward (via Halpern); 18 kn average and just under 21 kn maximum on 2 April (via Wikipedia) | - | [O] via Halpern's slides and Wikipedia; book not opened | (paraphrase) | Low-medium: the 3,850 and 2,100 pair is Wilding's 1915 pair, so not independent |
| David G. Brown (2000); Bruce Trinque | Pivot point about L/3 from the bow (a generic rule); no crash stop; the helm hard over only seconds before the impact | - | [V1] | (paraphrase) | Low |

## 8. Consistency checks (my arithmetic on the figures above)

1. **The 37-s run.**
   - At a constant 21.5 kn, 37 s covers 1,343 ft (409 m).
   - The log's 1,215 ft means an average of 0.90 of the approach speed over the first 37 s.
   - The Report's 466 yd is 22.5 kn x 37 s (1,404 ft), not a measurement.
2. **The advance from the helm order cannot be 2,100 ft.** This holds if the 37 s was a helm-only turn and the circle was 3,850 ft.
   - To two points she runs about 1,250 ft, nearly all of it on the original course.
   - From there to a heading of 90 deg, her track turns from about 16 to about 82 deg (heading less a drift of 6-8 deg). On an arc of radius R that adds 0.71 R along the original course.
   - The steady radius is 1,730-1,930 ft (a final diameter of 0.9-1.0 x 3,850 ft). The radius before the steady turn is larger.
   - So the advance is at least 2,450-2,610 ft (750-795 m).
   - Even if the helm-only two points took only 30 s (Conflict 1), the bound is about 2,280 ft.
   - Wilding's "forward movement" fits an origin 10-15 s after the order: the helm hard over, or the swing begun. At 20 kn that adds 340-510 ft, giving 2,440-2,610 ft from the order. That is within 5% of Halpern's 2,540 ft and the model's 2,684 ft.
3. **Rate and heel follow the speed held.**
   - With the circle fixed, the steady rate is k V / R and the steady heel goes as (k V)^2 / R. Here k is the speed held in the turn and V the approach speed.
   - Halpern's 0.86 deg/s and 5.4 deg are for a 22.5-kn approach with k = 0.76. At 20 kn the same k gives 0.76 deg/s and 4.3 deg.
   - The model's k = 0.65 gives about 0.69 deg/s. Halpern's own heel formula (GM 2.6 ft, H 18.6 ft) gives 3.4 deg at the model's 21.9 ft/s and radius of about 1,820 ft. Those are the model's 0.69 deg/s and 3.39 deg.
   - So "speed held", "steady rate" and "heel" are one unknown, and two of those rows compare 20-kn runs with 22.5-kn references.
4. **Draft.**
   - The trials were about 8% lighter than the model's ship (44,400 against 48,246 tons).
   - At equal thrust, speed goes as displacement to the minus one-third (the resistance coefficient goes as displacement^(2/3), and speed as its inverse square root). So 18 kn at 60 rpm on trial is about 17.5-17.7 kn at the model's displacement. The model gives 17.72.
   - The crash-stop distance from the same speed grows about 8% with mass, to about 3,250 ft. The lower speed at the night's draft takes off 2-4%.
   - Wilding's slow reversal, if it was 5-15 s slower than usual at about 30 ft/s, added 150-450 ft.
   - Net: about 2,700-3,050 ft (820-930 m) for a normal reversal at the model's displacement. The model's fitted 914 m with a 17-s reversal is inside.
5. **Pitch.**
   - Smith's and Fleming's 1911 figures were made with Olympic's 33-ft wing pitch.
   - Halpern's Olympic law (34 ft 6 in), scaled by 33/34.5, gives Half 14.8 kn and Slow 8.3 kn (turbine out). That matches "about 15" and "8 to 9".
   - For Titanic (35 ft) at the night's draft (about 2.5% below Halpern's light-draft-anchored law): Half about 15.3 kn, Slow about 8.6 kn.
   - The model is linear between 60 and 75 rpm (exponent 1.0), which the draft-corrected record supports. Below 60 rpm it falls under the officers' figures: 14.77 kn at Half, 7.86 kn at Slow.
6. **The crash stop's shape.**
   - 18 kn to rest in 195 s is a mean of 0.047 m/s2, at an average speed of 9.1 kn (half the initial). That fits a near-constant deceleration after a short delay.
   - Delaware stopped about twice as hard (0.097 m/s2).
7. **Coasting (engines stopped, screws trailing, no astern).**
   - Use the model's own resistance (Biles's 165 tons at 21 kn, scaled, going as V^2), 49,021 t, and about 5% added mass.
   - She would fall from 22 to 5 kn in about 20 min, over about 3.1 nm. Trailing-screw drag shortens both.
   - No record tests this. The night's 4-6 kn after running on and backing is not a coasting test.

## 9. Consensus

| # | Figure (condition) | Best estimate | Range | Sources | Weight | Why |
|---|---|---|---|---|---|---|
| 1 | Tactical diameter: hard over (40 deg), both engines ahead, turbine in, about 20 kn, trial draft | 3,850 ft (1,173 m; 4.5 L) | 3,800-3,900 ft (1,158-1,189 m) | Wilding 1915; BI 25291; Day 25; repeated by Eaton and Haas, Halpern | High: fit | Measured by the builder; feet and lengths agree; hardly depends on the exact speed (row 4) |
| 2 | Two points (22.5 deg) from the helm order: 74 rpm, 21.5 kn, Olympic, probably with both engines rung full astern at the same moment | 37 s | 35-39 s | BI 25292; LoL 1915; British Report | High: fit, under the condition of Conflict 1 | The only timed manoeuvre on record |
| 3 | Distance run in those 37 s | 1,250 ft (381 m) | 1,200-1,320 ft (366-402 m) | BI 25293; LoL 1915 (440 yd, struck) | Medium: check | Log and estimate agree; same run as row 2 |
| 4 | Circle at 11-12 kn divided by circle at 20-22 kn (same helm, engines steady ahead) | 1.03 | 1.00-1.10 | Wilding 1912 and 1915; Roche relaying Wilding | Medium: check | The measurer says "very small" and "about the same"; the turbine state of the slow circle is unrecorded (Conflict 2) |
| 5 | Two points at 11 kn, helm hard over | 70 s | 60-80 s | Roche relaying Wilding | Low: check | A proportional inference, not a timing |
| 6 | Advance from the helm order, about 20 kn | 2,550 ft (777 m) | 2,300-2,900 ft (700-885 m) | Section 8.2; Halpern 2,540 ft; Wilding's 2,100 ft plus 10-15 s; Eda and Numano 3.4 L at the top | Low-medium: check | Never measured from the order; bounded by rows 1-3 |
| 7 | Advance from helm hard over (or first swing) | 2,100 ft (640 m) | 1,900-2,300 ft (580-700 m) | Wilding 1915 ("or thereabouts") | Low-medium: check, against this origin only | The one measured forward distance; its origin is inferred |
| 8 | Transfer at 90 deg | 1,750 ft (533 m) | 1,550-1,900 ft (472-579 m) | Halpern's model | Low: check | Model only |
| 9 | Steady (final) diameter | 3,750 ft (1,143 m) | 3,450-3,900 ft (1,052-1,189 m) | Halpern 3,860 ft; 0.9-1.0 of row 1 | Low: check | No measurement |
| 10 | Speed held in the steady turn, as a share of the approach | 0.74 | 0.65-0.82 | Halpern's chart value 0.76-0.77; 0.90 averaged over the first 37 s (section 3) | Low: check | No measurement. The lower edge is my allowance for the chart's unknown scatter |
| 11 | Steady rate of turn, 20-kn approach | 0.76 deg/s | 0.65-0.88 deg/s | Derived (8.3); Halpern 0.86 at 22.5 kn | Low: check only | Redundant with row 10 |
| 12 | Steady heel, 20-kn approach, night condition (GM 2 ft 7.5 in) | 4.1 deg outward | 3.0-5.5 deg | Derived (8.3); Halpern 5.4 deg at 22.5 kn; GM from Hackett and Bedford | Low: check only | Redundant with row 10; never observed |
| 13 | Drift angle; pivot point | 8 deg; about L/6 from the bow | 5-12 deg; L/6 to L/3 | Halpern; Brown | Too uncertain | Rules of thumb |
| 14 | Time to 90 and to 180 deg, 20-kn approach | 125 s; 240 s | 105-140 s; 215-260 s | Derived from rows 1, 2 and 10 | Too uncertain to fit (redundant) | Never recorded |
| 15 | Twisting circle: hard-a-port, starboard engine full astern, 18-20 kn | Smaller than row 1 | "very small" | Carruthers; BI 25291 | Low: qualitative check | No dimensions survive |
| 16 | Crash-stop distance from 60 rpm (about 18 kn): helm amidships, both full astern | 3,000 ft (914 m) | 2,800-3,100 ft (853-945 m) | BI 25295; LoL 1915 | High: fit | The builder's measured trial; the draft and slow-reversal corrections nearly cancel (8.4) |
| 17 | Crash-stop time to way off | 195 s | 180-210 s | BI 25295; Lightoller ("a few minutes") | Medium-high: check | Same measurement as row 16 |
| 18 | Crash stop from about 22 kn (74-75 rpm) with a prompt reversal | No more than row 16, about 2,900 ft (884 m) | 2,600-3,100 ft (792-945 m) | LoL 1915 (Olympic, 1911) | Low-medium: check | Qualitative and from memory, but the measurer's |
| 19 | Engines turning astern after the order | 15 s | 10-22 s | Cone; Delaware | Medium-low: check | General and comparator figures |
| 20 | Engines backing hard after the order | 55 s | 40-70 s | Cone; Delaware | Low: check | As row 19 |
| 21 | Stop at half speed divided by stop at full | 0.82 | 0.75-0.90 | Wilding 1915 (another ship) | Low: shape check | Not an Olympic-class ship |
| 22 | Coasting, 22 to 5 kn, engines stopped | About 20 min, 3 nm | 12-25 min | Derived only (8.7) | Too uncertain | No record |
| 23 | Full ahead, 75 rpm, night draft | 22.1 kn (11.37 m/s) | 21.75-22.3 kn | BI 18372; day's run 22.06 kn; Halpern 22.15 kn | High: fit | Several independent sources |
| 24 | 74 rpm, Titanic | 21.7 kn | 21.4-21.9 kn | BI 25292 (Olympic 21.5) plus Ismay's 1/8-1/4 kn | Medium-high: check | Measured on Olympic |
| 25 | 60 rpm, night draft | 17.6 kn | 17.3-18.0 kn | BI 25295 at 30 ft, corrected (8.4) | Medium: check | Measured at a light draft |
| 26 | Half ahead, 50 rpm, turbine in | 15.3 kn | 14.9-15.9 kn | Smith; Fleming; Halpern; pitch and draft corrections (8.5) | Medium: check | The master's figure, consistent with Halpern's law |
| 27 | Slow ahead, 30 rpm, turbine out | 8.6 kn | 8.2-9.2 kn | Smith 8-9; Fleming 9; Halpern 8.83; corrections (8.5) | Medium-low: check, or fit the freewheeling centre-screw drag to it | Two officers agree; Olympic 1911 harbour practice |
| 28 | Light-draft top speed | 23.25 kn at about 30 ft | rpm unknown, at most about 83 | Wilding 1915 | Low: check | No rpm |
| 29 | Days' runs at 70 and 72 rpm | 21.0 and 20.9 kn over ground | plus or minus 0.5 kn | Halpern, "Keeping Track" | Low: check | Current-affected |
| 30 | Dead Slow, 20-25 rpm | About 6 kn | 5.5-7 kn | Halpern (derived) | Too uncertain | No measurement |
| 31 | Acceleration from rest | - | - | - | Not found | - |
| 32 | Trial condition (rows 1, 16, 25, 28) | Mean draft 30 ft, about 44,400 tons (45,100 t) | 44,000-45,000 tons | Wilding 1915; 143.8 tons per inch | High as a condition | Run the trial targets at it, or correct for it (8.4) |
| 33 | Night condition | 32 ft 3 in, 48,300 tons, GM 2 ft 7.5 in | - | Wilding via Halpern; Hackett and Bedford | High as a condition | Already the model's |

## 10. Conflicts, resolved

1. **Was the 37-s turn made with the helm only?**
   - For helm only: in 1912 Wilding gave the time from the helm order and did not mention the engines (BI 25292). The Report quotes it as the time after the helm was put hard-a-starboard.
   - For reversed engines:
     - In 1915 he said the tests were meant to reproduce the orders "reported to have been given at the time of the accident".
     - When counsel described the hard-a-starboard order, Wilding himself added "And reversed both engines." The transcript marks those words as his answer.
     - That test's advance (440 yd, struck) equals the 1,200-1,300 ft he gave in 1912 for the 37-s run.
     - The Report itself found that the helm and "Stop. Full speed astern." were given almost together, and used the 37 s for exactly that pair of orders.
   - **Resolution:** the 37 s was most probably run with both engines rung full astern at the helm order, about two chances in three. "Various experiments" leaves room for an unreported helm-only run.
   - Reversing took the turbine out at once, so for most of the 37 s the rudder had no centre-screw slipstream, while the wing engines were still stopping (10-22 s).
   - Fit the 37 s under that condition, and run helm only as the sensitivity.
   - Expected effect: the model's helm-only two points fall to about 30-35 s. How far depends on how much rudder force it draws from the centre screw: it now loses 7.5 s without it, 44.8 s against 37.3 s.
   - This changes the 1912 encounter's miss window, and with it the encounter's fitted area constant.
   - Halpern treats the 37 s as helm only. Mengot suspected the reversal.
2. **Did the circle change with speed?**
   - Wilding (1915): lower speed enlarges radius, advance and transfer only by a very small amount; the lowest circle was about 12 kn.
   - Roche, relaying him in 1912: about the same at about 22 and about 11 kn.
   - **Resolution:** nearly independent of speed; allow up to +10% at 11-12 kn.
   - The open question is the turbine state of the slow circle:
     - Olympic's practice put the turbine in only for Half and Full, and 11 kn is below Half (50 rpm, about 15 kn). In service it would have been out.
     - On a builder's trial it may have been kept in. "Engines being kept at the same speed going ahead" says nothing about it.
     - If it was out, losing the centre screw hardly changed the steady circle, and the model's +36% at 11 kn (+35% with the centre screw stopped at 20 kn) is too strong.
   - Report the 11-kn circle both ways.
3. **3,850 ft, its speed, and "three lengths".**
   - 3,850 ft is the middle of Wilding's 3,800-3,900 ft. Eaton and Haas's 3,850 with 2,100 is the same pair, not an independent measurement.
   - The speed:
     - "full speed" (1915), which that day meant about 20 kn on the telegraph's Full (section 4);
     - 18-20 kn for the Belfast Lough pair;
     - 19.5 and 21.75 kn in the three-speed set;
     - 20.5 kn (Eaton and Haas);
     - 21.5 kn (Mengot, assumed).
   - Because the circle barely depends on speed, fit 3,850 ft at 20 kn and accept 1.5 kn either way.
   - Lightoller's "about three times her length" (2,550-2,650 ft) is an unaided estimate at an unstated speed. Drop it.
4. **Advance: 2,100 ft against 2,540-2,900 ft.**
   - **Resolution (8.2):** with the 37 s and the 3,850-ft circle, the advance from the order cannot fall below about 2,450 ft. Wilding's 2,100 ft fits an origin 10-15 s later.
   - Check the model's advance from the order against 700-885 m, or from the moment the rudder is hard over against 580-700 m.
   - The model's 818 m is from the order if `tools/trials.js` measures it that way. Taking off the 10 s its rudder needs at 4 deg/s leaves about 715 m from hard over: just above the band, and inside it from the first swing.
5. **The crash-stop distance.**
   - The accounts:
     - "just over 3,000 feet" (1912);
     - "rather under half a mile ... about half a land mile" (1915), that is 2,640-3,040 ft;
     - the popular 850 yd (2,550 ft) in 3 min 15 s (Chirnside 2004 via Wikipedia; unsourced elsewhere).
   - **Resolution:** keep 3,000 ft (914 m) from 18 kn, with the trial's slow reversal. The 1915 phrasing brackets it.
   - 850 yd matches no primary statement. It is plausibly the 1915 "half a land mile" (880 yd) joined to the 1912 time (my inference). Do not use it.
6. **The crash-stop speed.** About 18 kn at about 60 rpm (1912), against about 20 kn with the telegraph at Full (1915, from memory). Keep 60 rpm and 18 kn: closer in time, and it carries an rpm. At the night's draft that is about 17.6 kn (8.4).
7. **Slow ahead.**
   - The figures: Smith 8-9 kn and Fleming 9 kn at 30 rpm (Olympic 1911, turbine out, 33-ft pitch); Halpern 8.83 kn (Titanic, derived); the model 7.86 kn.
   - **Resolution:** 8.6 kn (8.2-9.2) for Titanic at the night's draft (8.5).
   - The model is below the band, and Half (14.77 kn) is just below its band too. Its speed falls too fast below 60 rpm.
   - Two candidate causes, both my inference:
     - a purely quadratic resistance, where a wave-making share near full speed would make the speed-rpm law sub-linear as the record suggests;
     - at Slow, the freewheeling centre-screw drag (Cdw, a bet).
   - Use Slow as a check, or as the fit for Cdw.
8. **Speed held, rate, heel.**
   - Halpern: 0.76, 0.86 deg/s, 5.4 deg. The model: 0.65, 0.69 deg/s and 3.39 deg, both at 20 kn.
   - **Resolution (8.3):** these are one unknown, and the rate and heel references are for 22.5 kn. At 20 kn Halpern's own numbers give 0.76 deg/s and 4.3 deg, and his heel formula fed the model's turning speed gives the model's 3.4 deg.
   - No measurement exists. Check speed held against 0.65-0.82 only.
9. **The twisting circle.** Carruthers agreed to counsel's port-astern, starboard-ahead. Wilding, who handed in the curve, says hard-a-port with the starboard engine full astern, turning to starboard. Keep Wilding's: the measurer's account, in which helm and engines turn her the same way.
10. **Mengot's 25-30 s for two points.** Arithmetic on a circle entered at once at full speed, with no rudder time and no build-up. Rejected as a target.
11. **Smith's "reduced full speed" of 75 rpm at about 20 kn** against 21.5-22 kn at 74-75 rpm in open water. It is a coastal "easy steam" figure. Do not use it for Full.
12. **Olympic's 1911 trial speed.** "The designed speed was exceeded" (The Shipbuilder), "no speed test" (Wikipedia), 21.75 kn (an unsourced blog). Irrelevant to the fit.
13. **Eda and Numano's 6 L stop** (about 5,100-5,300 ft from 23.3 kn) against the trial's 3,000 ft (about 3.5 L) from 18 kn. Their hydrodynamics are another ship's (SL-7). Keep the trial.
14. **Halpern's advance:** 2,540 ft (2007 slides) against 2,746 ft (the 2010 PDF, per one search summary, unconfirmed). Both lie inside row 6's band. Fit neither.
15. **How much of the steering came from the centre screw (the "turbine question").**
    - No record measures it. The model makes it large: 7.5 s more for two points, and a circle 35% bigger, without the centre screw.
    - The two records that bear on it point one way:
      - If the 37 s was run with the engines reversed, and the trial's slow circle with the turbine out, then the centre screw mattered little.
      - If the slow circle kept the turbine in, the model's size of effect can stand, but its helm-only turn must then be quicker than 37 s.
    - Either way, a model that loses a lot without the centre screw and still needs 37 s with it is the combination the record supports least.

## 11. Recommended target set

**Fit (four figures):**

1. Tactical diameter 3,850 ft (1,173 m) at 20 kn, hard over, both engines ahead (row 1).
2. Two points in 37 s at 74 rpm (21.5 kn), hard-a-starboard with both engines rung full astern at the same moment, so the turbine is out at once (row 2). Run helm only as the sensitivity; expect 30-37 s.
3. Crash stop 3,000 ft (914 m) from 60 rpm, helm amidships, both engines full astern (row 16).
4. 22.1 kn at 75 rpm (row 23; already fitted at 22.15).

**Check only (bands):**

- Turning:
  - distance in the 37 s, 366-402 m;
  - 11-kn circle no more than 1.10 x the 20-kn circle (report turbine in and out);
  - two points at 11 kn, 60-80 s;
  - advance from the order 700-885 m, or from hard over 580-700 m;
  - speed held 0.65-0.82, with the rate (0.65-0.88 deg/s) and heel (3.0-5.5 deg) compared at the same 20-kn approach;
  - twisting circle smaller than the ahead circle.
- Stopping:
  - time to way off 180-210 s;
  - Olympic-like stop from 75 rpm with a prompt reversal no more than about 945 m;
  - astern turning at 10-22 s, backing hard at 40-70 s;
  - half-speed stop ratio 0.75-0.90.
- Speed:
  - 74 rpm, 21.4-21.9 kn;
  - 60 rpm, 17.3-18.0 kn;
  - Half, 14.9-15.9 kn;
  - Slow, 8.2-9.2 kn;
  - 70 and 72 rpm, 20.4-21.5 kn;
  - 23.25 kn reachable at the trial draft below about 83 rpm.

**Too uncertain to use:**

- turning estimates:
  - Lightoller's three lengths;
  - Mengot's 25-30 s and 340 s;
  - Eda and Numano's 3.4 L and 6 L;
  - Halpern's 2,746 ft;
  - Halpern's zig-zag curve (a generic ship from a naval course text, not Olympic);
  - drift angle and pivot point;
  - times to 90 and 180 deg;
- the 850 yd stop, and the Report's 466 yd;
- coasting; acceleration from rest; Dead Slow;
- anything on Britannic;
- later Olympic events: the 1913 propellers, oil firing, and the Nantucket lightship collision of 1934. In the last, full astern took her from about 10-12 kn to about 3 kn before contact ([O] https://thegreatoceanliners.com/articles/olympic/; [S] Wikipedia, "United States lightship LV-117"); the sighting distance is unknown.

**Against `out/trials.txt` (the model's 2026-11-16 values, the reference recommended here):**

| trials.txt row | Model now | Recommended reference | Band | On the band |
|---|---|---|---|---|
| Slow ahead, 30 rpm, turbine out | 7.86 kn | 8.6 kn | 8.2-9.2 kn | out (0.34 kn below) |
| Half ahead, 50 rpm | 14.77 kn | 15.3 kn | 14.9-15.9 kn | just out (0.13 kn below) |
| 60 rpm | 17.72 kn | 17.6 kn (night draft) | 17.3-18.0 kn | in |
| 74 rpm | 21.85 kn | 21.7 kn | 21.4-21.9 kn | in |
| two points [fitted] | 37.3 s, helm only | 37 s, both engines reversed with the helm | 35-39 s | re-run under that condition |
| distance in the 37 s | 386 m | 381 m | 366-402 m | in |
| advance at 20 kn | 818 m | 777 m from the order | 700-885 m | in |
| speed held | 0.65 | 0.74 | 0.65-0.82 | in (at the edge) |
| steady rate at 20 kn | 0.69 deg/s | 0.76 deg/s | 0.65-0.88 deg/s | in |
| circles at 11, 19.5, 21.75 kn | 1,598, 1,175, 1,175 m | ratio 1.03 | 1.00-1.10 | out at 11 kn with the turbine out (1.36); run it with the turbine in as well |
| heel at 20 kn | 3.39 deg | 4.1 deg | 3.0-5.5 deg | in |
| crash stop distance [fitted] | 914 m | 914 m | 853-945 m | in |
| crash stop time | 190 s | 195 s | 180-210 s | in |
| engines astern after | 17 s | 15 s | 10-22 s | in |
| centre screw out | 44.8 s; 1,591 m | no record; bounded by Conflicts 1 and 2 | - | see Conflict 15 |

## 12. Not found, or not opened

- **Turning.**
  - Not found:
    - any advance, transfer, or time to 90 or 180 deg measured from the helm order;
    - the plotted dimensions of the BI 25291 curves and Wilding's 1915 diagram (exhibits; not online);
    - circles at helm angles other than hard over (Lightoller says they were run);
    - the twisting circle's size;
    - any Olympic 1911 turning figure;
    - the Olympic 1912 tests' date, draft and sea state, and any helm-only run;
    - the transcript of Ryan v. Oceanic Steam Navigation Co. (1913).
- **Speed in a turn, rate, drift, heel:** no measurement for any Olympic-class ship.
- **Stopping:** no numbers for Olympic in 1911; no stopping test at other speeds; no measured reversing time on these ships; no coasting record.
- **Speed against revolutions:** no rpm for the 3 April run; no record of the same rpm with and without the turbine; no acceleration from rest; no Dead Slow speed.
- **Britannic:** no surviving trial record (Chirnside, 2002).
- **Not opened:**
  - Halpern's PDFs: "She Turned Two Points in 37 Seconds", "Brace for Collision!", "Speed and More Speed", "A Matter of Stability and Trim". Reading them would mean downloading the files, and ET's copy of the first returned 403. Their facts here come from the ET summary, Halpern's forum abstract, his 2007 slides, or search summaries, each tagged.
  - Hackett and Bedford (RINA, 1996); Eaton and Haas (1995); Chirnside (2004).
  - The Admiralty's OU 5274 (search summary only).
  - The Shipbuilder's trial figures (garbled in the online copy).

## 13. Observed-content note

No page I read contained instructions directed at me.
