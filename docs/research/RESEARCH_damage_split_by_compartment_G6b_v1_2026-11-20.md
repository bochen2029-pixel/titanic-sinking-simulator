# The 1912 damage shared out by compartment: what the sources give, and what the model needs (G6b, v1)

- **Written:** 2026-11-20 19:19 CST (clock) onward, by the mainline session ("Titanic simulator model accuracy", Claude
  Code 74cc0d65, Opus 5.5). It is G6b's research note, which the coordinator agreed at 18:48 CST should come before any
  code. It is drawn from four Fable research agents' reports (18:34 to 19:17 CST), from two spot checks, and from the
  mainline's own probes and refits on wt/split.
- **Status:** research. The coordinator decided on it (D70 to D73, received at 20:16 CST; W6's design v1.3, section
  7): Hackett and Bedford's split for the preset and the watch, at the refit point "A-kept", lands with G6 and W6 as
  join 6's core. G6b's mechanism is committed on wt/split (ea1d4f8, off by default); the landing follows.
- **Lineage:**
  - G6's note: `docs/research/RESEARCH_br5_damage_extent_G6_v1_2026-11-20.md`.
  - W6's design v1.2: `docs/DESIGN_W6_the_lists_v1_2_2026-11-20.md`, on wt/g6w6-preview.
  - The record room by room: `docs/research/RESEARCH_room_by_room_flooding_record_v1_2026-11-20.md`, on this branch.
  - The experiments: e82 to e88.
- **Conventions:** T is minutes after the touch. Shares are of the opened area, in per cent. Each claim is tagged as
  [checked] (re-read by the mainline or a spot check), [read] (read by a research agent) or [derived] (worked out here).

## The answer in one paragraph

The 1912 damage preset's split is not Hackett and Bedford's, although its comment says so:
- **Hackett and Bedford's own areas** (JOM 1998, Table I [checked]) are 0.056, 0.139, 0.288, 0.307, 0.260 and
  0.121 m², from the forepeak to boiler room 5. That is 4.8, 11.9, 24.6, 26.2, 22.2 and 10.3 %, 1.171 m² in all
  (12.6 sq ft).
- **The preset's split** (4, 13, 21, 24, 32, 6) has the shape of the water each room held: boiler room 6 held 34.5 % of
  Weeks and Halpern's 13,500 tons at 12:25 [read].
- **The encounter's split** on the 1912 watch, with G6, is 10.5, 19.8, 20.1, 22.8, 23.4 and 3.4. Its dents stand at
  the ice's crushing depth (0.25 m) the whole way along, so every torn metre opens alike, and the split is just the
  length the tear crosses in each compartment (e88).
- **Against Hackett and Bedford,** the encounter is right in boiler room 6 (23 against 22) and too heavy forward (the
  forepeak and hold 1, 30 against 17). It is too light in holds 2 and 3 (43 against 51) and in boiler room 5 (3 against
  10). The finite-element study (Paik, Kim and Thomas 2025) is heavy forward like the encounter [read].

The record's firmest early figure favours the encounter's and Hackett and Bedford's boiler room 6 over the preset's. The
Report has 8 ft above the double bottom there after ten minutes [checked]. The encounter's 23 % reaches that at
T 9.3 to 10.0 in the model; the preset's 32 % reaches it at T 6.5 (e87).

What decides her timeline is where the area lies:
- In the forepeak and hold 1 it does little: they fill within minutes and then take little.
- In holds 2 and 3, boiler room 6, and boiler room 5 once its bunker goes, it carries her last hour.
- With one split for the preset and the watch, the two founder within 0.4 to 2.6 minutes of each other.

The recommendation: one damage for both, Hackett and Bedford's Table I, and one refit with the opening's total area
free, against D69. The encounter's openings are scaled per compartment to that split; the factors are fitted bets, as
G6's tearAlong is.

Section 5 has the candidates' refits. At "A-kept" all five of D69's conditions hold:
- the 11 validation verdicts are unchanged;
- the preset founders at T 157.27 and the watch at T 157.00;
- the flow numbers move 6 to 15 %, and the area 6 %;
- J is 7.44, against today's 9.39.

## A finding in its own right: the timeline leaned on two early rooms

The model's 160-minute timeline has leaned on two rooms that flood early against the record. The coordinator asked
(in a message received at 19:21 CST by the clock) that this stand as a finding:
- **Boiler room 5,** torn through its stokehold's side from T 4 (G6's finding). The Report and Barrett keep its plates
  dry until the rush, at T 60 to 90.
- **The forepeak,** flooded whole from T 0. The Report keeps it dry above the peak tank until it fills from the top
  through the deck scuttle. Held to its tank, main's watch founders at T 173.7 instead of 157.7 [read]. The coordinator
  has opened this as G7, after G6b.

With both early rooms the calibrated opening came out at 8.1 sq ft, below every source's figure:
- Wilding's 12 (9 to 15);
- Hackett and Bedford's 12.6, or 9.53 at their first discharge coefficient;
- Halpern's 8.7.

With boiler room 5 following the record, the refits want about 8.5 sq ft (section 5). With the forepeak following it
too, they want about 9 to 9.5 sq ft [read: the research agent's what-ifs, 0.829 m² for the preset at T 159.8 and
0.878 m² for the watch at T 160.0]. Each correction moves the area toward the sources.

## 1. The sources, compartment by compartment

| Compartment | Hackett and Bedford, m² (%) [checked] | Paik, Kim and Thomas 2025, m² (%) [read] | The 1996 sonar survey [read] | The Report, the first ten minutes [checked] |
|---|---|---|---|---|
| Forepeak | 0.056 (4.8) | 0.2156 (12.5) | "a minor area of damage" | "not flooded above the Orlop deck" |
| Hold 1 | 0.139 (11.9) | 0.3332 (19.3; 12.0 after its discharge coefficient of 0.30) | slits of 1.2 and 1.5 m | "In No. 1 hold there was 7 ft. of water" |
| Hold 2 | 0.288 (24.6) | 0.4704 (27.3) | 4.6 m across holds 1 and 2 | water in the firemen's passage within five minutes [read] |
| Hold 3 | 0.307 (26.2), their largest | 0.4704 (27.3; its coefficient 0.38) | about 10 m across holds 2 and 3 | the mail room filled soon after [read] |
| Boiler room 6 | 0.260 (22.2) | 0.196 (11.4, with two bunkers; the agent's grouping) | the longest opening, 36 to 45 ft by source | "water to the height of 8 feet above the double bottom", ten minutes after |
| Boiler room 5 | 0.121 (10.3; 1.30 sq ft) | 0.0392 (2.3) | | at the ship's side, 2 ft from the bulkhead: "Water poured in at that place as it would from an ordinary fire hose" |
| Boiler room 4 | none | none | none | no damage in the early stages |
| **Total** | 1.171 (12.6 sq ft) | 1.7248 (18.6 sq ft) | 11.35 sq ft in a later table, not independent (below) | |

What each source is worth:
- **Hackett and Bedford (1996, RINA and IESIS).**
  - **What they are:** opening areas inferred by a flooding computation from the Report's times. JOM 1998 tabulates
    them as "computer calculations" [checked].
  - **The total:** to reach Wilding's 12 sq ft they cut the discharge coefficient from 0.61 to 0.485. Before that they
    had 9.53 sq ft (Halpern, "Somewhere About 12 Square Feet", citing H&B section 4.5) [checked].
  - **So** their shares are another model's reading of the same record: a reference, not a measurement. Their paper
    itself (points C1 to C7 on their trim curve) was not reached; the agent found only C4 and C5, in Halpern.
- **Paik, Kim and Thomas (2025).**
  - **What they are:** twenty breaches from a finite-element collision, most of them "smaller than the area of an A4
    sheet of paper" [read].
  - **The catch:** its flooding run needed tuned discharge coefficients (hold 1 0.30, hold 3 0.38, the rest 0.60), and
    it calls itself "one plausible reconstruction among several" [read].
  - **Already in the repository:** `core/encounter.js` cites the same study for the bow's crushing.
- **The 1996 sonar survey (SNAME 1997).**
  - **What it gives:** lengths and places only. The openings' width "was below the resolving power of the sub-bottom
    profiler" [read, via Halpern 2008].
  - **The 11.35 sq ft:** a later table of 11.35 sq ft divides Hackett and Bedford's areas by those lengths, so it is
    not independent [read].
  - **Its lengths:** the agent found them only in a teaching guide and a forum (low).
- **Wilding (BI 20422; the 1915 deposition, via Halpern).**
  - **What he gives:** an aggregate only, "somewhere about 12 square feet" [checked]. In 1915 he put it at "more than
    9 and less than 15" [checked, via Halpern].
  - **How he got it:** from 16,000 tons in about 40 minutes under a 25 ft head. The head assumed the damage 2 ft above
    the stokehold plates, which stood "a little over 2 feet above the ship's tank top" (Halpern) [checked].
- **The Report's boiler room 5.** The flooding page compares it to "an ordinary fire hose" [checked]. The agent's "deck
  hose pipe about 3 inches in diameter" (0.05 sq ft, 0.4 % of 12 sq ft) is not on that page: [read], not re-found.
  Either way it is far below Hackett and Bedford's 1.30 sq ft.

Where the sources disagree:
- **Boiler room 6:** 11 to 22 % of the area by the flooding computations and the finite elements, against about a third
  by the water held or by the sonar's length.
- **Boiler room 5:** from 0.4 % (the Report's hose) to 10 % (Hackett and Bedford).
- **The total:** from 8.7 sq ft (Halpern 2008) to 18.6 (Paik).

## 2. The model's two splits [derived]

- **The preset** (`TITANIC_SPLIT`, `core/scenarios.js`): "Fractions follow the flooded capacities (Hackett & Bedford)".
  The fractions are not Hackett and Bedford's areas (section 1). No capacities table of theirs was found. The shape is
  that of the water held.
- **The encounter** (`core/encounter.js`, on wt/split with G6), measured by e88 and a probe of its dents:
  - **Every torn station has the same dent,** 0.250 m, where the ice crushes back (p0 / q = 6 MPa / 24 MPa per m).
    That is 0.05 m beyond the tearing dent (0.2 m), so every torn metre opens alike.
  - **Only the top band tears:** 61 stations in the forepeak, then 110, 124, 125, 131, and 22 in boiler room 5's bunker.
  - **The berg's taper does not change this,** at any value from 0.02 to 0.08.
  - **So the split is the tear's length in each compartment,** and nothing in the contact law can make one
    compartment's opening per metre differ from another's.

## 3. The record's early depths against the two splits (e87, on main 4bf604e)

| The record | The watch (encounter, BR6 23 %) | The preset (BR6 32 %) |
|---|---|---|
| Boiler room 6, 8 ft above the double bottom ten minutes after (the Report) [checked] | 8 ft over the tank top at T 10.0 | T 6.5 |
| Boiler room 6, 8 ft above the plates on Barrett's return, "just on ten minutes" (BI 1926-37) [checked], the plates about 2 ft up (Halpern) [checked]: 10 ft over the tank top | T 12.5 | T 8.5 |
| Hold 1, 7 ft, in the first ten minutes (the Report) [checked] | T 3.1 | T 4.3 |
| The forepeak, not flooded above the Orlop deck (the Report) [checked] | the whole forepeak floods from T 0 | the same |

- **The Report's 8 ft above the double bottom** fits the encounter's share, and Hackett and Bedford's (22 %). The
  preset's 32 % is 3.5 minutes early.
- **Barrett's 8 ft above the plates** lies between the two.

## 4. Where the area acts (two research agents' what-ifs, in memory, on the preview's watch) [read]

- **The deficit.** G6 with W6 lags main by 21 minutes, made between T 40 and T 115. To T 80 nine tenths of it is boiler
  room 5's water. Main's 0.0629 m² there ran free into an empty room until about T 100. The bunker's holding is worth only
  1.8 of the 21 minutes.
- **Place matters more than size.**
  - 0.109 m² more in hold 3 or boiler room 6 brings the watch to T 160.1; the same in the forepeak and hold 1 gives
    T 170.9.
  - Every opening 15 % larger gives T 159.1 to 160.3.
  - About 13 minutes per 10 % of area.
- **No inside path is missing.**
  - E deck's paths times 4 move her by half a minute.
  - The ways down into boiler rooms 5 and 4 times 20 move her by 2.1 minutes.
  - The weirs over the bulkhead tops times 10 move her by half a minute.
  - The weather deck can bring her in only with a ten-minute plunge, against the record's forty.
- **The forepeak.** The model floods all 689 m³ of it below E deck from T 0. The Report keeps it dry above the peak tank
  (188 m³) until water "flowed in from the top through the deck scuttle". Held to its tank, main's watch founders at
  T 173.7 instead of 157.7. That is a second early room, like boiler room 5, and not part of G6b (section 6).
- **Open sidelights forward,** reached as she sank (Joughin BI 6310-17; Ryerson's ports open at T 135), could add late
  water. Four on E deck from T 70 give T 157.2. Their number below D deck was not found.

## 5. The candidates (e88 and its probes on wt/split; the refits)

One split for the preset and the watch, the watch's openings scaled per compartment to it (`ICE.openAlong`), and the
area constant refound (the encounter opens 0.7506 m²):

| | The split, % (FP, H1, H2, H3, BR6, BR5) | Today's numbers at 0.7506 m²: preset / watch | e83's free-area numbers at 0.8014 m²: preset / watch |
|---|---|---|---|
| A: Hackett and Bedford | 4.8 / 11.9 / 24.6 / 26.2 / 22.2 / 10.3 | T 164.18 / 163.74 | T 154.66 / 154.37 |
| B: theirs forward, boiler room 5 the encounter's | 5.2 / 12.8 / 26.5 / 28.3 / 23.9 / 3.4 | T 170.57 / 172.22 | T 159.88 / 162.49 |
| C: the encounter's own for both | 10.5 / 19.8 / 20.1 / 22.8 / 23.4 / 3.4 | T 177.33 / 178.67 | T 166.59 / 166.53 |
| (the preset's present split, for the watch too) | 4 / 13 / 21 / 24 / 32 / 6 | T 167.03 / 168.78 | T 156.88 / 158.89 |

Factors on the watch's openings:
- A: 0.454, 0.600, 1.222, 1.151, 0.949 and 3.047.
- B: 0.490, 0.647, 1.317, 1.240, 1.022 and 1.

### The refits (e89, `docs/research/experiments/e89_g6b_refit.js` on wt/split)

How e89 refits:
- **The score** is e83's: tools/calibrate.js's score for the preset, plus the watch's founder against 160 min,
  ((T - 160) / 4)².
- **The method** is Nelder-Mead, 45 iterations, with the opening's total area free.
- **The bounds:** "free" means e83's wide bounds. "D69" holds each flow number within half its present value; the area
  may move between 0.7506 m² and Wilding's 1.115 m². "Band" also holds both founders to 157 to 160 min, by a steep
  penalty outside it.

The flow numbers today are wMul 1.036, aDown 0.2815 and fOpen 0.02068. Today's preset scores J 9.39.

| Candidate, bounds | Area, m² (sq ft) | wMul | aDown | fOpen | Preset J | Preset T | Watch T |
|---|---|---|---|---|---|---|---|
| A, free | 0.7936 (8.54) | 1.919 (+85 %) | 0.2595 (-8 %) | 0.01842 (-11 %) | 7.52 | 157.1 | 157.0 |
| A, D69 | 0.8392 (9.03) | 1.164 (+12 %) | 0.1552 (-45 %) | 0.01224 (-41 %) | 6.40 | 157.32 | 160.27 |
| **A, D69 and band** | **0.83983 (9.04)** | **1.397 (+35 %)** | **0.1545 (-45 %)** | **0.01278 (-38 %)** | **6.23** | **157.00** | **159.86** |
| B, D69 and band | 0.88528 (9.53) | 1.209 (+17 %) | 0.1816 (-35 %) | 0.01445 (-30 %) | 16.49 | 156.73 | 160.38 |
| C, D69 and band | 0.85785 (9.23) | 1.554 (+50 %, its bound) | 0.2709 (-4 %) | 0.0212 (+3 %) | 9.94 | 157.00 | 158.98 |
| **A-kept: A, D69 and band, wMul at most 1.1 and aDown at least 0.24** | **0.79554 (8.56)** | **1.1 (+6 %)** | **0.24 (-15 %)** | **0.01879 (-9 %)** | **7.44** | **157.22** | **157.01** |
| A', a hand point | 0.78 (8.40) | 1.036 (0) | 0.25 (-11 %) | 0.02068 (0) | 10.17 | 159.10 | 158.78 |

- **A-kept** is the recommendation: all five of D69's conditions hold there (W6's design v1.3, section 4).
- **At A's best J** validate.js's "all bulkheads to B deck" what-if flips from afloat to foundering at 6 h. It sits on a
  knife edge in wMul and aDown. A-kept is the refit held to the region where it stays afloat.

- **The free run** stopped in a worse local minimum than the bounded ones: the score is nearly flat in wMul (core.js),
  and different starts led to different minima.
- **A with D69 and the band** meets D69's (2), (3) and (4). Conditions (1) and (5) are checked in W6's design v1.3,
  section 4.
- **B fails (4).** With boiler room 5 at 3.4 % the preset lists too far to port (13 degrees at T 100), and the water
  passes over bulkhead F at T 66 against 75. Boiler room 5's share is not a detail: Hackett and Bedford's 10 % fits the
  record's list and events far better than the encounter's 3 %, whatever the Report's fire hose says of the jet Barrett
  saw.

## 6. Not in G6b

- **The forepeak held to its tank** until it fills from the top: the Report's account. It slows her by about 16 minutes
  on main. It is a pocket like W6's, and a candidate for W6's next part, or for its own item.
- **Open sidelights forward:** their count below D deck is not found.
- **Boiler room 5's opening:** the Report's hose against Hackett and Bedford's 1.3 sq ft. Candidate B holds the
  encounter's own share there.
- **The early rate.** The model has about 9,900 t aboard at T 40, against Wilding's 16,257 and Halpern and Weeks's
  13,717 at T 45 [read]. No candidate here closes that.

## 7. Decisions (the coordinator, received at 20:16 CST, on Bo's word)

The full text is in W6's design v1.3, section 7.

- **D70:** A-kept: Hackett and Bedford's split for the preset and the watch, area 0.7955 m², wMul 1.1, aDown 0.24,
  fOpen 0.01879.
  - B fails D69's (4).
  - C fits worse than A, with wMul at its bound.
  - A's best J flips the knife-edge B-deck what-if (e90).
- **D71:** G6, G6b and W6 land now, with this refit. G7, the forepeak held to its tank, is next, with its own refit.
- **D72:** W6's band A is a CHECK until D64's tunnel height is settled.
- **D73:** calibrate.js carries the watch's founder and the bounds that keep every verdict, so that `node
  tools/calibrate.js 45` reproduces the landed numbers.
- **The preset's comment** is corrected in the landing: its fractions become Hackett and Bedford's own, cited to JOM
  1998, Table I.

## Risks

- **The split is fitted.** The factors on the watch's openings are fitted to one night's split, which is itself another
  model's inference. On other nights they shape the damage too: 0.45 to 0.6 forward, and 3.0 inside boiler room 5's
  bunker (A).
- **Boiler room 5's share** moves the timeline a great deal (A against B: 6 to 8 minutes).
- **The forepeak** (section 6) would move the area again once it follows the record.

## Sources

- JOM 1998 (Felkins, Leighly and Jankovic), Table I, "A Summary of Damaged Areas in Hull by Compartment": read in the
  browser pane, 2026-11-20, tms.org/pubs/journals/jom/9801/felkins-9801.html.
- S. Halpern, "Somewhere About 12 Square Feet" (titanicology.com): read in the browser pane, 2026-11-20.
- The British Report's flooding section: titanicinquiry.org/BOTInq/BOTReport/botRepFlooding.php, spot-checked
  2026-11-20.
- [read] by the research agents, not re-read here:
  - Paik, Kim and Thomas, Ships and Offshore Structures (2025), doi 10.1080/17445302.2025.2603417;
  - Halpern's "Angles of Trim and Heel" and "Flooding in BR4";
  - the sonar's lengths (vliz.be teaching guide, encyclopedia-titanica);
  - Weeks and Halpern, a digest on titanicconclusions.blogspot.com.
- The model: wt/split (G6 c52a121 and W6 1563f01 carried onto main 4bf604e), e82, e87, e88, and the probes named in
  section 5.
