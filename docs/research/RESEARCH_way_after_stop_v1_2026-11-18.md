# Her way after "Stop": what a stopped screw drags, what a reciprocating engine does on Stop, and what the record says of her way after the collision

Written 2026-11-18 08:40 CST by the builder agent of lane "stopway" (Opus 5.5) for the coordinating session; public web sources and the repository's own notes. Status: v1. It answers backlog M7 (her way after "Stop") and the part of M5 that concerns a screw stopped by "Stop"; the law it supports is `SHIP.stopped` in `core/motion.js` (M7).

Tags: **[read]** = read in the source opened (question number, table or section named); **[derived]** = computed here from read figures, the method stated; **[bet]** = a guess, its range given; **[search summary]** = seen only in a search engine's summary of a page that could not be opened; **[repo]** = read in an existing note of this repository, which names its own source. Scripts and raw tables are in the lane's scratch folder, not in the repository.

## 0. The answer

1. **The cause** [measured]. Before M7 a wing screw at rest after "Stop" gave no force at all: `screwThrust` in `core/motion.js` returned 0 for n = 0 outside a reversal's dead time. Her way after "Stop" was the hull's resistance alone, plus the centre screw's free-trailing drag (3.6 to 3.8 % of the hull's). A quadratic drag gives v = v0 / (1 + t / tau), tau = m_eff / (c v0): 5.5 minutes from 22.5 knots. On the 1912 orders she made 5.98 knots 15 minutes after the touch, 3.46 at 30, 1.88 at an hour, and ran on 6.83 nm through the water.
2. **What the sources support** [read, derived]. A stopped screw drags. Held (standing), its drag is C_D = -C_T*(90 deg) on its disc at the advance speed: 0.65 for the B4-70 screw of pitch ratio 1.4 (MARIN's four-quadrant series), about 0.30 for Titanic's narrow three-bladed wing screws, the model's own held screw (the reversal's dead time since M4) 0.537. Turned freely by the water it drags 0.045 of that; turned against the engine's friction, between the two, and held below the speed at which the water's torque on the held screw falls under that friction.
3. **Which state on "Stop"** [read, derived]. The engine-room witnesses say the engines stood between the orders after the collision (Dillon, Scott). Below about 4 to 10 knots no likely friction of the engine (3 to 10 % of its full torque [bet]) lets the water turn a held wing screw [derived]. The law (M7) holds a wing screw stopped by "Stop" (or by want of steam) and keeps the trailing and free states for what-ifs. The centre screw keeps its free-trailing law (M4).
4. **The result** [measured]. On the 1912 orders: 3.53 knots 15 minutes after the touch (was 5.98), 2.73 at 20 (4.82), 1.88 at 30 (3.46), 0.99 at an hour (1.88); she runs on 4.29 nm through the water (6.83) and founders 4.22 nm from her place at the touch (6.76). From a steady 22.5 knots the coast to 1 knot takes 58.6 minutes (118.1).
5. **What it does not do**. No stopped-screw law stops her within 15 to 20 minutes of the touch on today's orders (Stop 60 s after it): the drag stays quadratic in her speed, so the coast is still v0 / (1 + t / tau); the most the sources allow (held at 0.65) takes tau to 2.4 minutes, and quadratic drag never brings a ship to rest. The record's "stopped" needs the engine movements the witnesses give: a minute or two astern took her to "four to six knots" a few minutes after the collision (Lightoller), and the "stopped" of the bridge wing, of a passenger and of Californian's watchers 5 to 10 miles off is not 0 knots. Section 9 measures each witness's sequence on the mended model.
6. **Bo's decision**: which engine sequence the 1912 night carries (today: Stop 60 s after the touch, `ORDERS_1912` in `core/night.js`). Section 9 says which the sources best support and what adopting it would move.

## 1. The model before M7, measured

The standalone motion model from a steady run, engines rung Stop at t = 0, helm amidships, no ice [measured]:

| From | to 5 kn | to 3 kn | to 2 kn | to 1 kn | 0.5 kn | speed at 15 / 30 / 60 min |
|---|---|---|---|---|---|---|
| 22.5 kn | 20.6 min, 3.32 nm | 37.1 min, 4.37 nm | 57.4 min, 5.20 nm | 118.1 min, 6.60 nm | not in 150 min | 6.39 / 3.64 / 1.92 kn |
| 15 kn | 17.9 min, 2.50 nm | 34.5 min, 3.56 nm | 54.7 min, 4.38 nm | 115.4 min, 5.78 nm | not in 150 min | 5.65 / 3.37 / 1.84 kn |
| 10 kn | 13.2 min, 1.53 nm | 29.7 min, 2.58 nm | 49.9 min, 3.41 nm | 110.7 min, 4.81 nm | not in 150 min | 4.66 / 2.98 / 1.72 kn |

The force on her in the coast [measured]: the hull's resistance (cR u^2 g(u)), the centre screw's drag 3.6 to 3.8 % of it, the wing screws exactly 0 once their shafts stand (15 s after the order at the model's 5 rpm a second). On the 1912 watch the momentum of the inflow adds to the hull's resistance 4 % at the touch, 12 % at T+15 and 24 % at T+60, while the flood water's mass (49.0 thousand t at the touch, 63.5 at T+60) slows the decay. The coordinator's check of the same arithmetic: c about 13,700 N s^2/m^2, tau about 322 s from 22.5 knots, 3.85 knots at 26 minutes, 1.85 at an hour: the model's own figures, so the coast was pure quadratic drag.

## 2. What a stopped screw drags

| Figure | Value | Source | Tag |
|---|---|---|---|
| Locked (held) screw, drag on the disc at the advance speed Va: C_D = -C_T*(90 deg) | 0.6545 for B4-70 P/D 1.4; 0.666 for B3-65 P/D 1.0 | MARIN's 30-term four-quadrant series (1984) as reprinted in Roddy, Hess and Faller, NSWCCD-50-TR-2006/004, Table B15; Tabaczek and Bugalski, TransNav 8(3) 2014, Table 1 (computed from the same series) | [repo]: RESEARCH_propeller_four_quadrant_v1, sections 1, 6 |
| The same for Titanic's wing screws (3 blades, 23 ft 6 in, pitch 35 ft, blade area 160 sq ft: EAR 0.37 if developed) | about 0.30 (two derivations: 0.30 and 0.32), 0.42 if the 160 sq ft is projected; plus or minus 0.08 | the series with a blade-area correction; Tabaczek and Bugalski's eq. 7 | [repo], section 5, 6 |
| The model's held screw (the reversal's dead time, M4: the B4-70 shape at x = 90 scaled by fA as its astern law) | C_D 0.537; its torque coefficient 0.112 | a = 0.6033 and fA = 0.6501 give 0.821 of the B4-70's astern bollard pull; 0.821 x 0.6545 and 0.821 x 0.1364 | [derived] |
| Hold torque of a locked screw, C_Q = -C_Q*(90 deg) | 0.1364 (B4-70 P/D 1.4); about 0.052 for Titanic's | as the first row | [repo], section 6 |
| Free (frictionless) screw: turns at zero torque | J_w = 1.51, C_D 0.029 on Va: 0.045 of held | the series' first quadrant, B4-70 P/D 1.4 | [repo], section 6 |
| A screw turned by the water against a friction torque Q_f | between the two: at the beta where the series' torque equals Q_f. Its drag over the held drag is close to Q_f over the held screw's torque (0.48 at 0.45, 0.64 at 0.60, 0.78 at 0.75, 0.91 at 0.91; 0.31 at 0.26, 0.08 at 0.03) | the series, B4-70 P/D 1.4, beta 34.4 to 65 deg (C_T*/sin^2 and C_Q*/sin^2 over their values at 90 deg) | [derived] from the repo's section 3 table |
| So the trailing screw's drag above the speed uB at which it breaks away | about constant, the held drag at uB (it rises slowly above it, 1.2 times at twice uB); below uB it stands and drags as held | the row above | [derived] |
| The centre screw (P/D 0.85, the turbine cut out) | trails free; M4's Cdw 0.10 on its disc (0.03 at P/D 1.4, 0.10 at P/D 1.0) | the series' drag at zero torque | [repo]; kept |

## 3. What a reciprocating engine does on "Stop"

| Figure | Value | Source | Tag |
|---|---|---|---|
| Where Dillon was | "In the engine room where the main engines are" | Trimmer Thomas Dillon, BI 3713 (Day 5), https://www.titanicinquiry.org/BOTInq/BOTInq05Dillon01.php | [read] |
| The engines after the shock | "They stopped." (3720) "About a minute and a half" after the shock (3721); stopped "About half a minute" before slow astern (3723) | Dillon, BI 3720-3723 | [read] |
| The engines between Stop and Slow ahead | asked whether they stopped before Slow ahead: "Oh, yes" (5617-5618); "They cannot stop the engines at once" (5621), "they are bound to let the steam get out of the cylinder first" (5622) | Greaser Frederick Scott, BI 5617-5622 (Day 6), https://www.titanicinquiry.org/BOTInq/BOTInq06Scott01.php | [read] |
| Felt from his bunk | "feeling the engines had stopped I got up" (13743); "I did" feel they had stopped (13746) | Second Officer Lightoller, BI 13743, 13746 (Day 11), https://www.titanicinquiry.org/BOTInq/BOTInq11Lightoller03.php | [read] |
| Felt from his cabin | the engines "had stopped dead" | Lawrence Beesley, The Loss of the SS Titanic (1912), ch. III, https://www.tota.world/article/3704 | [read] |
| The water's torque on a held wing screw, Q = C_Q 0.5 rho Va^2 (pi/4) D^3, Va = 0.85 u, against the engine's full torque (15,000 ihp at 75 rpm: 1.424 MN m) | at 15 kn 0.71 MN m (50 %) with C_Q 0.112, 0.33 (23 %) with 0.052; at 10 kn 22 % / 10 %; at 5 kn 5.6 % / 2.6 % | the rows of section 2; the design rating (Halpern, "Titanic's Prime Mover") | [derived] |
| The engine's and shafting's losses at full power | "the efficiencies of the propeller and of the engine and shafting being about 65 and 80% respectively": about 20 % of the indicated power at full power | Encyclopaedia Britannica 1911, "Shipbuilding" (Propulsion), https://en.wikisource.org/wiki/1911_Encyclop%C3%A6dia_Britannica/Shipbuilding | [read] |
| The part of it that stays with no load (the "initial friction" of Froude's analysis) | 3 to 10 % of the full torque | not found as a figure; the method (the indicated power at zero revolutions) is described in a Sydney engineering paper seen in a search summary | [bet] |
| So the speed below which a stopped wing screw stands whatever the engineers do | 3.7 to 9.8 kn (3.7, 4.7, 5.6, 6.7 kn for 3, 5, 7, 10 % with C_Q 0.112; 5.4, 7.0, 8.2, 9.8 kn with 0.052) | the rows above | [derived from the bet] |
| A motor ship's propeller after the fuel is cut | "In spite of fuel cut off, propeller continues to turn due to headway of the ship" (compressed air then stops the engine before it goes astern) | knowledgeofsea.com, "Stopping distance, turning circle, ship's manoeuvring", https://knowledgeofsea.com/?p=2121 (crash stop section; no source given) | [read] |
| A turbine liner's wing screws | Lusitania and Mauretania's wing (ahead-only) turbines kept turning ahead "quite a time" after the order to go astern | Chirnside, "Lusitania & Mauretania 'Full Astern'" (a Cunard memo of 7 February 1911) | [repo]: RESEARCH_olympic_class_steering_propulsion_trials_v1, section 11 |

**Reading.** Above the speed in the last-but-two row the water's torque on a held screw is larger than any likely friction, so a wing screw left to itself after "Stop" would turn, slowly, against its engine (trailing), as a motor ship's does and as the Cunarders' wing turbines did; below it, it stands. The witnesses who were with the engines say the engines stood between the orders after the collision, at speeds of 10 knots and more (Dillon's half minute at about 1.5 to 2 minutes after the shock, when she still made about 15 knots [derived: the model's watch makes 15.9 knots 1.5 minutes after the touch]; Scott's long first stop), which needs more than friction: the engineers' handling (the valve gear, a check of steam) or the cylinders' own compression. Neither is in a source opened here. The model takes **held**: it is what the witnesses describe, it is certain at the speeds where her way is judged gone, it is the upper bound of the stopped screw's drag, and it needs no new number. **Trailing** with uB = 6 kn [bet] is the alternative (section 8).

## 4. The record of her way after the collision

| Witness | Where | What he says, with its question | Tag |
|---|---|---|---|
| Leading Fireman Barrett | boiler room 6 | the red "Stop" on the stokehold indicator just before the crash; "Shut all dampers" (BI 1860-1867) | [repo]: steering sheet section 7 |
| Fourth Officer Boxhall | the bridge, just after the impact | telegraph bells "Just a moment before" the impact (15346-15348); both telegraphs at "Full speed astern" (15350), immediately after the impact (15351); Murdoch to the captain: "I hard-a-starboarded and reversed the engines" (15355); later "I forget when it was I noticed the engines were stopped, but I did notice it" (15419). BI Day 13, https://www.titanicinquiry.org/BOTInq/BOTInq13Boxhall01.php | [read] |
| Trimmer Dillon | the engine room, at the main engines (3713) | telegraph rang about two seconds before the shock (3716-3717); the engines stopped about a minute and a half after it (3720-3721), stood about half a minute (3723), went slow astern about two minutes (3722, 3724-3725), stopped (3726), went ahead again about two minutes (3727-3728), stopped (3729). No speed for the ahead, no time between the second stop and it | [read] |
| Greaser Scott | the engine room | Stop, then Slow ahead "For ten minutes" (5609, 5611), then Stop, then astern "about five minutes" (5609-5612, 5626), then Stop, the last order (5614); Stop to Slow ahead "about 10 minutes or a quarter of an hour" (5620); Stop to slow astern "about four or five minutes" (5625); the whole "just over the half-hour" (5630). The Commissioner set it against Dillon's 3718-3720 | [read] |
| Quartermaster Olliver | the bridge, on errands | "The captain telegraphed half speed ahead"; "I reckon the ship was almost stopped" when he did; backed before? "He must have done so, unless it was hitting the iceberg stopped the way of the ship"; how long: "Not very long, sir"; "The ship was stopped when we took to the boats". US Senate Inquiry Day 7, https://www.titanicinquiry.org/USInq/AmInq07Olliver01.php and ...Olliver02.php | [read] |
| Second Officer Lightoller | from his bunk, then the deck, "a few moments, it might have been a few minutes" after (13743) | "She was proceeding slowly, a matter of perhaps six knots or something like that" (13757); "four to six knots" when he looked over the side (13760); did not feel the engines go full astern (13759); "only six knots" (13775). US Day 5: not stopped, "apparently going slowly"; "All they could do was to take the way off the ship and close the doors". BI Day 11 (BOTInq11Lightoller03.php); US Day 5, https://www.titanicinquiry.org/USInq/AmInq05Lightoller04.php | [read] |
| Lawrence Beesley | passenger, on deck and below | the engines "had stopped dead"; later "The ship had now resumed her course, moving very slowly through the water with a little white line of foam on each side"; then "the engines had stopped again and the Titanic lay peacefully on the surface of the sea" (no clock times for these) | [read] |
| Able Seaman Scarrott | (asked as a seaman) | with the engines stopped and not reversed, "a laden ship will carry her way for a very considerable distance"; reversing stops her "in a much shorter time" (BI 357-358, Day 2), https://www.titanicinquiry.org/BOTInq/BOTInq02Scarrott01.php | [read] |
| Samuel Halpern's reconstruction | - | engines ran on a minute or two, then "backed slowly to take the way off the ship before they stopped again"; then 4 to 6 kn (Lightoller); a short restart ahead (Scott, Dillon, Beesley, Olliver, Carter), perhaps to move away from ice, shortly before the boats were uncovered (15 to 20 minutes after the collision); "dead in the water for all practical purposes" by about 11:57 her time, from Californian's watch (Groves saw the steamer stopped at about 11:40 Californian time, Lord about five minutes later). "Collision Point", http://www.titanicology.com/Titanica/CollisionPoint.htm | [read] |
| Greaser Ranger, via Halpern | the turbine room | the changeover valves' arms lift about 2 minutes after the collision (the turbine cut out: the engines reversed) | [repo] |

**What "stopped" meant.** Each "stopped" above is one of three things [derived]: the engines (Dillon, Scott, Lightoller in his bunk, Beesley "stopped dead": the vibration ceased); her way as seen from on board on a flat calm, moonless night with no reference but the water at her side (Olliver's "almost stopped", Beesley's "lay peacefully"); and her lights as seen from Californian, 5 to 10 miles off, where 1 to 2 knots moves her by a degree or less of bearing in five minutes. None is a measured 0 knots; Halpern's own words are "for all practical purposes". At 1 knot she moves half a metre a second, a ship's length in nine minutes.

## 5. Trials, other stops, and coasting with the engines merely stopped

| Figure | Value | Source | Tag |
|---|---|---|---|
| Titanic's trial stop | about 18 kn (60 rpm), both engines full astern, helm amidships: way off in about 3 min 15 s, "just over 3,000 feet"; Olympic from about 22 kn about the same | Wilding, BI 25295; LoL 1915 | [repo] |
| Lightoller's estimate of a full-astern stop from 21 kn | "about a minute and a half", "about a quarter of a mile"; the way off is "when the ship is not going through the water" | US Senate Inquiry Day 5 (Senator Bourne's question) | [read]; far shorter than the trial |
| Coasting with the engines merely stopped, for any Olympic-class ship or comparable liner | NOT FOUND | - | [repo] and here |
| Rules of thumb for an inertia stop (engines stopped, no astern) | the distance 10 to 50 % of the speed in knots, in nautical miles; from 10 (knots, unit not stated): fine-lined fast ship 1 nm, 145 m cargo ship 2 nm, 220,000 t tanker 4.5 nm | knowledgeofsea.com (as above); no source, no end speed given | [read] |
| The same | warships about a tenth of the speed in knots, in miles; laden tankers more than half | maritimesa.org, Nautical Science grade 11, https://maritimesa.org/nautical-science-grade-11/?p=485; no source | [read] |
| A loaded motor ship of about 14,000 t from about 14 kn | "still be moving ahead at 2 to 3 knots ... fifteen minutes after the 'Stop' order" | a ship-handling training handout on Scribd, not opened | [search summary] |

## 6. The law (M7, `SHIP.stopped` in `core/motion.js`)

A wing screw whose shaft is at rest, outside a reversal's dead time, with its order at Stop as far as the plant can carry it out (Stop rung, or no steam, or water at the engines), drags by its state:

- **held** (the default): the drag of the held screw of the dead time, C_D 0.537 on the disc at the advance speed [derived]; with sternway the series' locked screw at 270 deg, 0.5985 / 0.6545 = 0.914 of it [repo, section 3 table].
- **trail**: held below uB, 6 kn [bet: 3.7 to 9.8 kn, section 3]; above it the share of the held drag at r = (uB / u)^2 from the pairs [r, share] of section 2 (0, 0.045), (0.0334, 0.079), (0.2555, 0.307), (0.4516, 0.478), (0.6047, 0.638), (0.7484, 0.777), (0.9081, 0.907), (1, 0.998) [derived].
- **free**: 0.045 of held [derived].

Neutral everywhere else: a turning shaft, a reversal's dead time and the step at its end, the centre screw, and her at rest (exactly 0) keep their bits. It needs no new state in the motion's snapshot. Its effect on the tracked tables is in the lane's report.

## 7. Not found, and not opened

| Item | What was tried | Status |
|---|---|---|
| Whether a large triple-expansion engine trailed (was turned by its screw) on "Stop" with the ship under way, and its friction with no load | searches for period engineering texts and for Liberty-ship practice; EB1911 "Shipbuilding" (only the 80 % of engine and shafting); D. W. Taylor, The Speed and Power of Ships (1910), as archive.org's text (only its first 100,000 characters were reached: not its propeller chapters) | NOT FOUND: the state is read from the witnesses (section 3), the friction is a bet |
| Measured drag of a ship's screw turned by the water, free or against friction | as the four-quadrant note | NOT FOUND; the series' estimate (section 2) |
| A coasting trial (engines stopped, no astern) of any Olympic-class ship or comparable liner | as the steering sheet, section 11 | NOT FOUND |
| Modern inertia-stop figures with their ship and end speed | IMO and ISO material, a Journal of Navigation paper on giant vessels, ship-handling handouts | PDFs or paywalls; only rules of thumb read (section 5) |
| Non-driven propellers of multi-screw ships turning their stopped engines (Gdynia, kones.eu 2012) | its PDF | NOT OPENED: seen in a search summary only ("the propeller works like a water turbine and drives the stopped engine") |
| Any PDF | the fetch tool returns the raw file here (TransNav 0664 tried) | none read; every source above is a web page or a repository note |
| Encyclopedia Titanica's forum threads on Titanic's propulsion and her speed after the collision | fetched | refused (HTTP 403) |
| Beesley at Project Gutenberg | fetched | refused (HTTP 503); read at tota.world instead |
| Carter's, Ranger's and the Californian officers' own words on the restart and the stop | not fetched (Halpern's reading of them is used) | NOT CHECKED |

## 8. The coast-down after M7 against the sources

The standalone model from a steady 22.5 knots, Stop rung at t = 0, helm amidships, no ice [measured]; the held rows at C_D 0.30 and 0.65 are the sources' range for a held screw (section 2), run as what-ifs:

| Stopped wing screws | 15 min | 20 min | 30 min | 60 min | to 3 kn | to 2 kn | to 1 kn | to 0.5 kn |
|---|---|---|---|---|---|---|---|---|
| none (before M7) | 6.39 kn | 5.12 | 3.64 | 1.92 | 37.1 min, 4.37 nm | 57.4, 5.20 | 118.1, 6.60 | not in 150 min |
| free (0.045 of held) | 6.17 | 4.93 | 3.49 | 1.84 | 35.4, 4.18 | 54.8, 4.96 | 112.9, 6.30 | not in 150 min |
| trailing, uB 6 kn [bet] | 4.34 | 3.20 | 2.10 | 1.03 | 21.3, 2.83 | 31.4, 3.24 | 61.7, 3.94 | 122.4, 4.64 |
| held at C_D 0.30 (Titanic's blade area) | 4.41 | 3.45 | 2.39 | 1.24 | 23.4, 2.76 | 36.4, 3.29 | 75.3, 4.19 | not in 150 min |
| **held at C_D 0.537 (M7, the model's held screw)** | **3.55** | **2.75** | **1.89** | **0.98** | **18.1, 2.15** | **28.2, 2.56** | **58.6, 3.26** | **119.2, 3.96** |
| held at C_D 0.65 (B4-70 P/D 1.4) | 3.25 | 2.51 | 1.72 | 0.89 | 16.4, 1.95 | 25.5, 2.32 | 53.0, 2.95 | 107.9, 3.59 |

The same from 15 knots: 3.29 knots at 15 minutes (5.65 before M7); from 10 knots: to 1 knot in 55.0 minutes and 2.37 nm (110.7 and 4.81).

Against what the sources give for a ship's way with her engines merely stopped [the misfit, derived]:

| Source's figure | The model (M7) | Misfit |
|---|---|---|
| Distance 10 to 50 % of the speed in knots, in nm (knowledgeofsea; no end speed given) | from 22.5 kn: 2.56 nm to 2 kn (11 %), 3.26 nm to 1 kn (14 %), 3.96 to 0.5 kn (18 %); before M7 5.20, 6.60 nm (23, 29 %) | inside, at the low end (before M7: inside, in the middle) |
| Warships about a tenth of the speed (maritimesa) | 11 to 18 % | a fine-lined liner, not a warship: no misfit to claim |
| A fine-lined fast ship from 10 (knots) about 1 nm (knowledgeofsea) | from 10 kn: 0.74 nm to 5 kn, 1.26 to 3 kn, 1.67 to 2 kn, 2.37 to 1 kn | 1.3 to 2.4 times, if "stopped" is 1 to 3 kn; the rule names no ship, length or end speed |
| A loaded motor ship of 14,000 t from about 14 kn: 2 to 3 kn fifteen minutes after Stop [search summary] | from 15 kn: 3.29 kn at 15 min (5.65 before M7) | 0.3 to 1.3 kn above it, from 1 kn more speed and a ship 3.5 times heavier |
| Titanic, the record: "dead in the water for all practical purposes" by about T 17 (Halpern), after a short astern | on today's orders (no astern): 3.53 kn at T+15, 2.73 at T+20 (section 9 for the witnesses' orders) | not met; quadratic drag cannot meet it (section 0) |
| Scarrott, BI 357-358: with the engines only stopped "a laden ship will carry her way for a very considerable distance" | 3.26 nm to 1 knot from 22.5 | agrees in kind |

No coasting trial of this ship or her sisters exists to fit to (section 7): the law is not fitted, and its one modelling choice, held, is the upper end of what the sources allow for her own screws (0.30 at her blade area, 0.42 if projected) and the middle of the series' (0.65).

## 9. The witnesses' engine movements as what-ifs on the mended model

The 1912 watch with today's helm orders and each witness's telegraph orders, given through the watch's own script (or, for an order that waits on her speed, through `Night.telegraph`), never through `ORDERS_1912`; run to her foundering [measured]. Speeds through the water, knots, after the touch; "end" is where she founders against where today's 1912 watch founders before M7 (2,143 m N, 13,000 m W of her start); the bearings are true.

| Sequence (minutes after the touch) | T+5 | T+10 | T+15 | T+20 | T+30 | T+60 | under 1 kn | under 0.5 kn | runs on (water) | end from today's end | founders | the ice |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Today, before M7: Stop at T+1 (`ORDERS_1912`) | 11.14 | 7.81 | 5.98 | 4.82 | 3.46 | 1.88 | T+120.5 | not by her end | 6.83 nm | 0 | T+157.2 | 0.7506 m2, contact 9.9 s |
| **Today, M7** | 8.29 | 4.97 | **3.53** | **2.73** | **1.88** | **0.99** | T+59.6 | T+132.7 | 4.29 | 2.54 nm, 101 deg | T+157.2 | the same |
| Boxhall (BI 15346-15351): full astern at the touch, Stop when her headway is gone [bet] (T+2.7) | 0.58 | 0.52 | 0.47 | 0.44 | 0.39 | 0.31 | T+5.0 | T+11.7 | 1.33 | 7.13 nm, 98 deg | T+198.5 | 0.6719 m2: the order acts in the contact |
| **Dillon (BI 3720-3729): Stop (standing at T+1.5), slow astern T+2 to 4, Stop; half ahead (Olliver) T+12 to 14 [bet: time], Stop** | 7.01 | 4.45 | 7.65 | 4.82 | 2.75 | 1.22 | T+72.6 | T+148.9 | 5.17 | 1.66 nm, 100 deg | T+157.2 | the same as today |
| Dillon without the ahead | 7.01 | 4.45 | 3.25 | 2.56 | 1.80 | 0.97 | T+57.7 | T+130.1 | 4.10 | 2.73 nm, 101 deg | T+157.2 | the same |
| Dillon, the ahead slow (Scott) | 7.01 | 4.45 | 4.72 | 3.42 | 2.21 | 1.09 | T+65.4 | T+140.6 | 4.54 | 2.29 nm, 101 deg | T+157.2 | the same |
| Scott (BI 5609-5626): Stop at the touch, slow ahead T+10 to 20, Stop, slow astern T+24.5 to 29.5, Stop | 6.85 | 4.39 | 6.73 | 7.65 | 0.35 | 0.29 | T+28.8 | T+29.4 | 3.74 | 3.18 nm, 111 deg | T+198.5 | 0.6719 m2: the order acts in the contact |
| Olliver (US Day 7): today's Stop, half ahead for 2 min [bet] once she makes under 2 kn [bet] (T+28.1), Stop | 8.29 | 4.97 | 3.53 | 2.73 | 6.70 | 1.76 | T+93.3 | T+156.1 | 5.82 | 1.02 nm, 98 deg | T+157.2 | the same |

What the table says [derived]:

1. **No witness's sequence stops her by T 15 to 20.** The record's "stopped" there is three things (section 4), none of them 0 knots. On the mended model, the sequences without a restart leave her at 2.5 to 3.5 knots at T+15 to 20; the restarts (Dillon's two minutes, Scott's ten, Olliver's half ahead) put 3 to 5 knots back. Only a last astern takes the way off (Scott's five minutes of slow astern: under 1 knot at T+28.8), and only an order at the touch stops her within minutes (Boxhall's full astern).
2. **Lightoller's "four to six knots"** a few minutes after the collision (BI 13757-13760) against Dillon's sequence: 7.0 knots at T+5, 6.3 at T+6: at the top of his range, a minute or two late. On today's orders: 8.3 at T+5.
3. **The ice.** Boxhall's and Scott's first order falls at the touch, while she is still on the ice: the shafts run down in the contact and the damage changes (0.6719 m2 of seams against 0.7506; she floats 198.5 minutes). Adopting either would move the 1912 encounter itself (its geometry and the area constant are fitted with the engines going through the contact). No sequence carries her back onto or along the ice after it: the least gap between her hull and the berg after the encounter is the 78.5 to 79.4 m of the moment it ends, in every row.
4. **Where she ends.** Today's mended model puts her end 2.54 nm east of today's; the sequences 1.0 to 3.2 nm (7.1 for Boxhall's); the world reader places the other ships from where she ends (`WRECK_1912`), so whichever sequence is adopted moves Carpathia with her.

**Which sequence the sources best support** [derived]: Dillon's. He was among the main engines (3713) and gives the whole sequence with its durations; it agrees with Lightoller (the engines felt stopped, then four to six knots), with Olliver's ahead rung by the captain when she was "almost stopped", with Beesley's "moving very slowly ... a little white line of foam", and with Halpern's reading of all of them (and Ranger's turbine valves). Scott's timings are long and his order of ahead and astern is the reverse of Dillon's (the Commissioner set the two against each other); Boxhall saw the telegraphs, not the engines, and the engine room heard Stop. Dillon leaves two numbers open: the ahead's telegraph (Olliver: half; Scott: slow) and when it came (Olliver: "almost stopped"; Halpern: shortly before the boats were uncovered, T 15 to 20). On the model she is not "almost stopped" at T+12 (3.9 knots).

**What adopting it would move** (Dillon's, the half ahead at T+12; measured on the mended model, nothing committed):

- The 1912 watch's fingerprint at her end: 3810e155 at step 37979 -> ff1c5382 at step 37977 (she founders at T+157.2 either way), and every frozen print that reaches past T+1.25 (the night suite's 700-step digest of the 1912 watch; not the headway reference's 387 steps).
- The boats: with the rule at 3 knots the fit goes to { kLo: 0.00118, kHi: 0.0454, pace: 7.91 }, 14 of 18 within ten minutes, 665 in them (on today's orders { 0.002, 0.04, 8 }, 14, 661); with the note's 1 knot { 0.00195, 0.0421, 8.38 }, 12 of 18: the restart keeps her over 1 knot until T+72.6.
- `WRECK_1912`: 4.22 nm from her place at the touch -> 5.09 nm (1,648 m N, 9,286 m W). The other ships are placed from it, so Carpathia still comes alongside at about T 265 by construction; what moves is the geometry of the what-ifs that steam toward her.
- The Carpathia search: its fork is taken when the encounter is over and every scripted order given, so it would move from T+1 to T+14, after the restart; its baseline is the new watch's T+157.2.
- Not moved: the encounter and its area constant (the sequence begins after the contact), the reports' constant (the forecast from T 12 leaves her 131.3 minutes, as today: 0.57), the sweeps (the drawn nights keep `ORDERS_1912`), if the sequence goes to the 1912 night's own spec and not to `ORDERS_1912`.
