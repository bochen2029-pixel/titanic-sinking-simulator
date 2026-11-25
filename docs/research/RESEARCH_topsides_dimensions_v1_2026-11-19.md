# Titanic's topsides as built: the Boat deck and the open upper decks, in the ship's frame (v1)

- **Written:** 2026-11-19, 13:12 to 14:05 CST, by a research subagent (Claude Code, Opus 5.5) for lane T of `docs/PLAN_topsides_mesh_and_grand_staircases_v1_2026-11-19.md` (the drawn ship). It finishes the ten-point draft `C:\temp\titanic-topsides-scratch\RESEARCH_topsides_dimensions_draft.md` and supersedes the partial pass `C:\temp\titanic-wt-topsides\docs\research\RESEARCH_topsides_dimensions_v1_2026-11-19.md` (stopped 13:11 CST). Nothing in `core/`, `site/`, `tools/` or `dist/` was changed.
- **Method.** (1) Text: the British Wreck Commissioner's report (`C:\temp\titanic-topsides-scratch\bot_*.txt`, "BWC"), The Shipbuilder's 1911 special number (`shipbuilder.txt`, OCR, "Shipbuilder", line numbers given), and about twenty-five of Bob Read's modelling articles (`pdf\*.txt` and four `*.txt` in the scratch root, "Read, <article>"). (2) Scaling: Bo's four screenshots of the Encyclopedia Titanica plans, measured by script, never by eye alone: the inboard profile (`C:\greenshot\2026-11-19 12_53_26-...png`, "ET profile") fitted to the fifteen bulkheads it marks against the BWC distances (residual rms 0.45 ft, 1.309 px/ft), and the Boat deck plan (`...12_53_36-...png`, "ET Boat deck plan") fitted to Read's ten davit frames (rms 0.39 m, 2.45 px/ft; the 94 ft breadth gives 2.44 px/ft). Scripts and outputs: `C:\temp\titanic-topsides-scratch\v1\` (`px.js`, `segs.js`, `ellipse.js`, `hough.js`, `fit_davits*.js`, `derive.js`, `derive_out.txt`). (3) One colour photograph of the ship leaving Belfast (`...12_44_12-...png`) as a check on rakes. (4) A few web pages (listed under Sources). (5) The viewer and readers read in the repository at `a97a6bd`.
- **Refused or unreadable.** encyclopedia-titanica.org community threads and articles (HTTP 403: "height of structures on boat deck", "titanic frames", "on titanics bridge"); titanic.fandom.com (402); the TRMA rigging diagrams are images only (their pages hold no numbers). Not opened, per the brief: the plan images in the scratch folder over 1500 px (`ref\*`, `boatdeck_plan.png`) and every other image beyond the eight named; I read eleven images (the four plan screenshots, six upscaled crops of them made in `v1\`, one photograph). The ET profile's frame-spacing labels along the keel were too blurred to read with certainty.
- **Rows taken on the partial note's word, tagged [read in the partial note]:** only its reading of `site/app.js:1746-1751` (`applyLook`) and `site/parts/20_night_scene.js:79, 311, 343-346` (emissive handling). Every other row it offered was re-checked against the scratch text or the repository before use (its davits, boats, BWC and Shipbuilder lines, the people reader's stations, the crow's nest code, the Mauretania passage); where I disagree with it the conflict is in section 8.
- **Tags.** [read] stated in a source I opened, with a locator; [scaled] measured off a plan or photograph by script (image, scale basis and accuracy named); [derived] arithmetic on read or scaled numbers, shown or in `derive_out.txt`; [bet] judgement with a range; [search summary] only in a web-search digest; NOT FOUND. In section 10, A = read or derived from read numbers, B = scaled, C = bet.
- **Quotes.** Period sources word for word where it matters; modern authors at most one short phrase, else paraphrased.

### Conventions (the frame every table uses)

- **x**, metres forward of amidships, amidships being the middle of the 850 ft length between perpendiculars: x = (425 ft − distance aft of the FP) × 0.3048. FP +129.54, AP −129.54.
- **y**, metres to port (+) or starboard (−). Every part is symmetric unless a row says otherwise.
- **z**, metres above the moulded baseline (top of keel), the core's datum (`G.deck`). A height h above the 34 ft 7 in design waterline is z = h + 10.44 m: the BWC's heights above that waterline amidships (Boat 58 ft 0 in, A 48 ft 6 in, B 39 ft 6 in, C 30 ft 6 in) sit about 4 in above the moulded heights there (C: 30 ft 6 in + 34 ft 7 in = 65 ft 1 in, against 64 ft 9.5 in from Read's midship-plan depth of 64 ft 6 in on the centreline at the low point plus 3.5 in of sheer to amidships), because the draft is measured to the underside of the keel (a 1-7/16-in plate on a 3-in flat bar, Shipbuilder lines 22590-22592) [derived]. The brief's z = h + 10.54 would put such parts 0.10 m higher; both are given where it matters.
- **Decks.** The core's `G.deck` amidships (Boat 28.12, A 25.22, B 22.48, C 19.74, D 16.54, E 13.79 m) agrees with the sources within 0.01 m at x = 0 (section 4.1). Parts are given as a height above their deck; **the builder should place them on `C.deckZ(deck, x)`** so that they sit on the drawn hull, even where the core's sheer departs from the source (section 4.1, reported, not to be corrected in lane T).
- **Frames.** Frames run outward from amidships with no frame 0: frame nF is at x = (n − ½) × 0.9144 m and nA at −(n − ½) × 0.9144 m wherever the spacing is 36 in. The 36-in spacing holds from 95F (bulkhead C, x +86.4) to 111A (bulkhead O, x −101.0), which contains the whole of the Boat, A and B decks (x −92.2 to +75.4) and most of the forward well. Section 8 gives the alternative (a frame at amidships: every frame 0.457 m farther from amidships) and why I did not take it.

| Region | Frames | Spacing | x of the region's end, m | Source |
|---|---|---|---|---|
| amidships forward | 1F to 95F (bulkhead C at 95F) | 36 in | +86.4 | [read] Shipbuilder 22628 ("3ft. amidships"); [scaled] ET profile keel strip, boundary at C; [derived] C: BWC 142 ft from the FP, less 0.5 ft (section 8) |
| | 95F to about 107F | 33 in | about +96.0 | [scaled] ET profile keel strip, ±0.6 m; labels unreadable, values [bet] from the gradation |
| | about 107F to about 118F | 30 in | about +105.2 | [scaled] as above |
| | about 118F to 134F (bulkhead A) | 27 in | +115.7 | [scaled]; A: BWC 46 ft less 0.5 ft |
| bow | 134F to about 156F at the FP | 24 in | +129.5 | [read] Shipbuilder 22628 ("24in. forward"); 156F or 157F at the FP [search summary: an Encyclopedia Titanica thread; R. Mengot, "Titanic's Blueprints" (157)] |
| amidships aft | 1A to 111A (bulkhead O at 111A) | 36 in | −101.0 | [scaled] boundary at O; [derived] O: BWC 757 ft less 0.5 ft |
| | 111A to about 121A | 33 in | about −109.8 | [scaled] |
| | about 121A to 133A (bulkhead P) | 30 in | −118.4 | [scaled]; P: BWC 814 ft less 0.5 ft |
| stern | 133A to about 148A at the AP | 27 in | −129.5 | [read] Shipbuilder 22628 ("27in. aft"); 148A at the sternpost [read in Mengot, "Titanic's Blueprints"] |

Check: 117A, which Mengot gives as the front of the poop, falls at 331.5 + 6 × 2.75 = 348.0 ft aft = −106.1 m, and the Shipbuilder's 106 ft poop measured from the counter's end (−138.3 m, ET profile) puts the poop front at −106.0 m [derived]. 83F, which he gives as the aft wall of the forward well, is +75.4 m; the ET profile shows that wall at +75.2 m [scaled].

## 0. Summary: the twenty numbers that most change the drawing

| # | What | Record | Drawn today | Tag |
|---|---|---|---|---|
| 1 | Funnel centres at their bases (casing tops), x | +54.9, +19.3, −16.3, −52.3 (±0.5; spacing 35.6-35.9 m) | +45.5, +12.5, −20.5, −53.5 | [scaled] ET plan and profile, three methods averaged; the first three stand over bulkheads E, G, J as The Shipbuilder says |
| 2 | Funnel rake | 2 in in 12 = 9.46° aft from plumb | 0.075 rad = 4.3° | [read] Read, funnel heights article, from the H&W rigging plan |
| 3 | Funnel tops (forward high point), z | 49.89, 50.34, 50.34, 49.89 m (163 ft 8 in, 165 ft 2 in, 165 ft 2 in, 163 ft 8 in) | about 47.0 m plus sheer | [read] Read, funnel heights article |
| 4 | Funnel bases | on boiler casings 2.4 to 2.9 m above the Boat deck (z 31.0, 30.8, 30.8, 30.3) | on the Boat deck | [scaled] ET profile |
| 5 | Black top of the funnels | 18 ft 6 in = 5.64 m deep | 4.2 m | [read] Read, funnel exterior article |
| 6 | Mainmast | passes A deck at x ≈ −87.4 (frames 95A-102A strengthened); top x ≈ −94.9 | foot −108, on the poop | [scaled] ET profile; [read in Mengot] the frames |
| 7 | Foremast | foot at the forecastle deck x ≈ +95.0; top x ≈ +87.4 | foot +93.5 | [scaled] ET profile |
| 8 | Mast rake and tops | ≈ 9.5° aft (profile 10 ± 1°), tops z ≈ 69.1 m (profile) to 73.0 m (The Shipbuilder's "205ft. above the average draught line", datum uncertain) | 0.06 rad = 3.4°; tops 62 and 58 m | [scaled] ET profile, photo; [read] Shipbuilder 32344-32346; rake equal to the funnels' [bet] |
| 9 | Crow's nest | on the foremast at x ≈ +93.4; cage floor z ≈ 35.2 m, rim 37.1 m (profile); BWC "about 95 ft above the waterline" = z ≈ 39.4 m | eye 29.0 m above the night's waterline (z ≈ 38.5) at x ≈ +93.7 | [scaled]; [read] BWC structure |
| 10 | Boat deck extent | x −77.8 to +72.5 (the bridge front; "190 ft. from the bow" gives +72.7); 94 ft = 28.65 m wide (±14.3) | A-deck box −78 to 73.5, ±12.9; houses on it to 73.5 | [scaled] ET plan; [read] BWC accommodation, Shipbuilder 22842 |
| 11 | Davits (both sides) | x +65.72, +55.70, +45.39, +35.07, +24.99; −31.39, −41.74, −51.84, −61.89, −72.13 | not drawn; the people reader's boats at +67, +56, +46, +35, −34, −44, −55, −66 | [read] Read, davit placement article (frames and shifts); [derived] |
| 12 | Officers' house and wheelhouse | house x +36.0 to +64.8, ±6.9 m, roof ≈ 2.4 m; wheelhouse +64.8 to +67.8, ±2.95 m; the bridge at deck level forward to +72.5, wing cabs at +67.6 to +69.6 projecting ≈ 0.4 m beyond the side | one box +56 to +73.5, ±7.5, 2.7 m high, and a "bridge" box above it at +2.7 to +4.6 m | [scaled] ET plan and profile |
| 13 | Forward first-class entrance | house x +26.3 to +35.9, ±8.6 m, roof ≈ 3.9 m; its dome's cover centred at x +31.1, about 6.4 m across | inside the long box | [scaled] |
| 14 | Gymnasium | starboard side of funnel 2's house, x +11.9 to +26.1, y −3.0 to −8.5; 44 × 18 × 9 ft 6 in inside | inside the long box (±5.4) | [read] Shipbuilder 28789-28794; [scaled] |
| 15 | Raised roofs (low, ≈ 1.0 m) | lounge x −14.1 to +5.1, ±8.9 (bays to ±10.0); reading and writing room, port, x +5.1 to +17.0, y +3.1 to +8.9; smoke room x −64.3 to −43.9, ±8.6 | none | [scaled] ET plan and profile; [read] room sizes Shipbuilder 27263, 27282, 27312 |
| 16 | The houses aft | funnel 3 casing −23.0 to −9.0, ±3.0; engine-casing house with the tank room −35.0 to −26.6, ±6.9; aft dome cover −42.4 to −35.1, ±3.2; second-class entrance −72.2 to −65.3, ±2.8 with the lift machinery room on its roof (top ≈ 4.6 m) | one box −70 to +52, ±5.4, 2.6 m | [scaled] |
| 17 | Boat deck sides | steel bulwark from −31.4 to +24.9 (between the boat groups) and from +56.6 to +67.1 (by the cutters, 4 ft high); open 42-in rails in way of the boats and aft | none | [scaled] ET plan's two "STEEL BULWARK P&S" dimension lines; [read] Read, bulwark and railings articles |
| 18 | Expansion joints (Boat and A decks, down to B deck) | x +44.1 (crosses the officers' house) and −25.2 (crosses no house) | none | [scaled] ET plan; [read] Read, expansion joints article |
| 19 | The wells | forward: B deck's front (aft wall of the well) at +75.4, the forecastle's after end at +91.6; aft: B deck's aft end at −92.2, the poop front at −106.1 | core `wellFwd` [76.9, 92.0], `wellAft` [−106.0, −90.8] | [read in Mengot] 83F and 117A; [read] B deck 550 ft (BWC, Shipbuilder), forecastle 128 ft (Shipbuilder); [derived] |
| 20 | Sheer of C deck and above | rises 11 ft 10 in at the FP and 4 ft 0 in at the AP from a low point 24.3 m abaft amidships; the core's sheer stands +0.38 m at the FP, +0.77 m at the AP and −0.21 m at x +43 against it | core `sheerF` 3.9, `sheerA` 1.9 from x = 0 | [read] Read, sheer article (lines plan, Board of Trade note); [derived] |

## 1. The Boat deck plan

Plan scale used throughout this section: ET Boat deck plan (Bo's screenshot `C:\greenshot\2026-11-19 12_53_36-Home - File Explorer.png`, 1277 × 411 px, bow to the right, port at the top): x = −83.234 + 0.12438 × px, fitted to Read's ten davits (residuals −0.89 to +0.54 m; the plan's forward cutter davit is drawn 0.9 m aft of Read's 72F and its other davits nearly equally spaced, so ±0.5 m is the plan's own accuracy); y = (226 − py) × 0.12466 m, from the 94 ft breadth (the plan's centreline dashes lie 3 px off its symmetric centre; the walls were taken as symmetric about py 226). House heights: ET profile (`...12_53_26-...png`), z = (407 − py) × 0.23125 m, each roof against the profile's own Boat deck line (that drawing has less sheer than the lines plan: section 8), ±0.3 m. Script output: `C:\temp\titanic-topsides-scratch\v1\derive_out.txt`.

### 1.1 Extent, breadth and sides

| Part | x aft | x fwd | y | z | Size, notes | Source | Tag |
|---|---|---|---|---|---|---|---|
| Boat deck, overall | −77.8 | +72.6 at the centreline | ±14.33 (94 ft) amidships; ±14.0 at x +65; the aft edge spans ±9.8 at −77.8 and reaches full breadth by −73.3 | `C.deckZ('Boat', x)`; amidships 28.12; "at its lowest point ... about 92 ft. 6 in. above the keel" | 150.4 m = 493 ft long; BWC "about 500 ft" | BWC accommodation (`bot_botRepAccomo.txt` line 15); Shipbuilder 22842 ("increased to 94ft. wide"); ET plan | [read] breadth, [scaled] ends and corners |
| Forward edge (the navigating bridge's front) | | +72.5 on the centreline, curving back to +69.6 at the wing cabs | full width | Boat deck | a shallow arc; the ET profile puts the front of the A and Boat decks at +72.9; "190 ft. from the bow" with the stem's head at +130.6 gives +72.7 | BWC accommodation line 15; ET plan; ET profile | [scaled], [derived] |
| Deck camber | | | | 3 in (0.076 m) higher on the centreline than at the side | | Shipbuilder 22857; Read, sheer article (midship plan: "3 inches in 92 feet") | [read] |
| Open rails, aft group | −77.8 | −31.4 | at the deck edge | top rail 1.07 m (42 in) above the deck | in way of boats 9-16 and the aft end; number of bars not read (the forecastle's are 5-bar) [bet 3 to 5] | Read, forecastle railings article line 79, ventilator article line 27 ("42 inches"); ET plan | [read] height |
| Steel bulwark, amidships | −31.4 | +24.9 | at the deck edge | 1.22 m (4 ft) [bet: as the forward one], teak cap rail | the ET plan's dimension line "STEEL BULWARK P&S" runs exactly from the aft group's 35A davit to the forward group's 28F davit; the aft expansion joint cuts it at −25.2 with a leather sleeve over the gap in the teak caprail | ET plan px 417-869; Read, expansion joints article | [scaled], height [bet 1.07-1.22] |
| Open rails, forward group | +24.9 | +56.6 | at the deck edge | 1.07 m | in way of boats 3-8 | ET plan | [scaled] |
| Steel bulwark, by the cutters | +56.6 | +67.1 | at the deck edge | 1.22 m (48 in) with a teak rail; a stay on every stiffener | the Kelvin sounding machine's opening, 36 × 20 in, top 7.5 in below the rail top, its aft edge 22 in forward of the bulwark's aft end: x +57.13 to +57.64 | ET plan px 1124-1208.5; Read, `olympic_bulwark.txt` lines 75-79, 140-146; Read, collapsible article line 38 ("the 4 ft. bulwark by the #1 emergency cutter") | [read] height, [scaled] ends, [derived] opening |
| Expansion joint, forward | | +44.1 | full width, crossing the officers' house | Boat deck and roof | 2-in gap under an 8-in grooved brass cover; on the house roof the margin planks stand 1 in proud; continues down the superstructure plating to (not through) B deck; outer leather and strips painted white | ET plan (a line across the deck and house at px 1024); Read, expansion joints article | [scaled] x, [read] detail |
| Expansion joint, aft | | −25.2 | full width, crossing no house | Boat deck | passes through the outboard bulwarks (leather over a 2-in gap); on A deck between two narrow (2.5 in) stanchions 12 in apart, closed in by plating on Titanic | ET plan px 467; Read, expansion joints article | [scaled] x, [read] detail |
| Promenade limits (rails across the deck) | | −33.2 (second class / engineers'), −25.2 (engineers' / first class), +44.1 (first class / officers') | from each house to the side | | second class 145 ft at the after end (−77.8 to −33.2 = 146 ft); first class "200ft. long, extending the full width" | ET plan; Shipbuilder 30064-30072 | [scaled], [read] |
| Ladders down to A deck | | −77.4 | about ±3.0 | | "two vertical iron ladders at the after-end of this deck" | BWC accommodation line 17; ET plan px 47 | [read], [scaled] |

### 1.2 Deckhouses, casings and raised roofs on the Boat deck

Heights are above `C.deckZ('Boat', x)` at the part's middle.

| Part | x aft | x fwd | y | Height above the Boat deck | Notes | Source | Tag |
|---|---|---|---|---|---|---|---|
| Navigating bridge, open part | +67.8 | +72.5 (centre) to +69.6 (sides) | full width | at deck level; front bulwark with windows across it | entirely of wood (the compasses); the shelter forward of the wheelhouse had nine windows [read in Wikipedia, "Titanic navigation bridge", through a fetch summary]; roof over the central part and the wing cabs, gray canvas over pine, teak edges | Read, roofs article; Wikipedia "Titanic navigation bridge" [search summary] | [scaled] x, [read] construction |
| Bridge roof (central shelter) | +67.8 | +72.5 | ±4.5 [bet ±3 to ±6] | 2.4 (same line as the officers' house roof in the ET profile; "8 feet" [search summary]) | | ET profile py 272 | [scaled] |
| Wing cabs (2) | +67.6 | +69.6 | from ±12.7 to ±14.3, the outer face ≈ 0.4 m beyond the local deck edge (±13.9) | 2.4 [bet] | roofed, windows on three sides [search summary]; the side lights in them [read in `site/visuals.js` comment, a search summary there] | ET plan px 1213-1229, py 111-124 and 328-342 | [scaled] |
| Wheelhouse | +64.8 | +67.8 | ±2.95 | 2.4 | flat front on Titanic, curved on early Olympic [search summary]; the chart room immediately abaft it | ET plan px 1190-1214, py 202.5-250; BWC accommodation line 15 | [scaled] |
| Officers' house | +36.0 | +64.8 | ±6.9 | 2.4 (2.2 forward to 2.7 aft in the profile) | navigating room, captain's and officers' rooms, the Marconi rooms on the centreline abaft funnel 1's casing; its roof "formed a short deck" carrying collapsibles A and B and the aerial lead-ins; the officers' mess roof is waterproofed wood (medium gray) | BWC accommodation line 15; Read, roofs and Marconi articles; ET plan px 959-1190, py 171-281.5; ET profile py 272.5 | [scaled] |
| Funnel 1's boiler casing (inside the officers' house) | +50.7 | +59.4 | ±3.0 | 2.35 (casing top z 31.0) | the funnel stands on it; fidley gratings and fan housings at its ends (plan labels VENT, FAN, TRUNK) | ET plan; ET profile py 273 | [scaled] |
| Marconi aerial lead-in mast | about +45 [bet] | | 0 [bet] | 1.5 (5 ft) on the roof | square, 10 in a side, on the officers' house roof, Bradfield insulator on top | Read, Marconi article | [read] size, [bet] place |
| Forward first-class entrance | +26.3 | +35.9 | ±8.6 | 3.9 (3.6-4.1) | the grand staircase's top landing; three lifts reach A deck only; minimum stair width 8 ft | ET plan px 881-958, py 157-295; ET profile py 268; BWC accommodation line 15 | [scaled] |
| Its dome's weather cover | +27.9 | +34.3 | ±3.3 (plan circle 6.4 × 6.6 m) | about 1 m above the entrance's roof [bet 0.8-1.5] | the dome "of iron and glass" (Shipbuilder 26581); lane S owns its geometry | ET plan circle, centre px 919.4 | [scaled], height [bet] |
| Funnel 2's house | +11.9 | +26.1 | from +3.05 (port wall) to −8.54 (starboard wall) | 2.7 (casing top z 30.76); the gymnasium's part ≥ 2.9 (9 ft 6 in inside) | asymmetric: the casing in the middle (±3.0), the gymnasium to starboard | ET plan px 765-879; ET profile py 274 | [scaled] |
| Gymnasium (the starboard part of it) | +11.9 | +26.1 | −3.0 to −8.5 | 3.0 [derived: 9 ft 6 in high inside, plus the roof] | "44ft. long, by 18ft. wide, by 9ft. 6in. high ... eight windows of exceptional size", "immediately abaft the forward grand entrance" | Shipbuilder 28789-28794; ET plan py 250-294.5 (18.2 ft) | [read], [scaled] |
| Raised roof over the reading and writing room | +5.1 | +17.0 | port only, +3.1 to +8.9 | 1.0 [derived: the room is 12 ft 3 in high against 9 ft 6 in between A and the Boat deck, plus the roof; scaled ≈ 1.0] | the room 41 × 41 ft on A deck, port side | Shipbuilder 27312-27313; ET plan px 710-806 | [scaled] |
| Raised roof over the lounge | −14.1 | +5.1 | ±8.9; two bays a side to ±10.0 at x −10.0 to −6.2 and −3.6 to 0.0 | 1.0 | the lounge 59 × 63 ft, 12 ft 3 in high; its aft corners run beside funnel 3's casing | Shipbuilder 27263-27264; ET plan px 556-710, py 146-306; ET profile py 282 | [scaled] |
| Compass platform | +0.2 | +4.4 (centre +2.3) | ±2.4 (footprint with its ladders 4.2 × 4.8 m) | the compass "78ft. above the water-line" = z 34.2 (34.3 with h + 10.54), about 6.1 m above the deck; "12ft. above all ironwork"; the platform's floor about 1.2 m below that [bet] | "an isolated brasswork platform in the centre of the ship ... built up from the boat deck"; Kelvin standard compass with azimuth mirror | Shipbuilder 37698-37708; BWC life-saving appliances; ET plan symbol | [read] height, [scaled] place |
| Funnel 3's boiler casing | −23.0 | −9.0 | ±3.0 | 2.9 (casing top z 30.76) | fan housings and trunks at both ends (plan labels VENT, FAN, TRUNK); pipes on the tank room roof aft | ET plan px 484-597, py 202-250; ET profile py 274 | [scaled] |
| Engine-casing house (the reciprocating engine room's light and air shaft, the tank room to port) | −35.0 | −26.6 | ±6.9 | 2.7 (roof z 30.53) | "surmounted by a large skylight"; the tank room's roof dark gray, with a 30-in fan ventilator on its port side and one on the forward starboard face | Shipbuilder 26037-26041; Read, ventilator and water pipes articles; ET plan px 388-455; ET profile py 275 | [scaled] |
| Gap with the stewards' stairway | −26.6 | −23.0 | | | the stairway "between the reciprocating engine casing and the third funnel casing", down to E deck; the aft expansion joint crosses here | BWC accommodation line 18 | [read] |
| Aft first-class dome's cover | −42.4 | −35.1 | +3.1 to −3.3 | 1.1 | the aft staircase runs A deck to C deck only, so on the Boat deck only its dome's cover shows | Shipbuilder 26599-26603; ET plan px 328-387; ET profile py 282 | [scaled] |
| Raised roof over the smoke room | −64.3 | −43.9 | +8.7 to −8.5 | 1.0 | the room 65 × 63 ft, 12 ft 3 in high, at the after end of A deck; funnel 4 rises through the roof's forward part; the davit beams at 57A and 68A stop at this roof | Shipbuilder 27274-27282; Read, davit placement article lines 112-118; ET plan px 152.5-316.5 | [scaled] |
| Funnel 4's casing (the turbine room's shaft) | about −56 | about −49 | ±3.0 [bet] | 2.4 (casing top z 30.29) | the turbine room's ventilator, no smoke | Shipbuilder 26042-26044; ET A deck plan ("TURBINE ENGINE CASING" in the smoke room's forward part); ET profile py 276 | [scaled] x ±1 |
| Dog kennels | about −62 [bet] | about −57 [bet] | 0 [bet] | under a waterproofed wood roof, lighter gray than the steel roof forward of it | "aft of the fourth funnel" | Read, roofs article | [read] that they were there, [bet] the box |
| Second-class entrance | −72.2 | −65.3 | ±2.8 | 2.3 (roof z 30.29) | stair and lift down to F deck; semicircular teak weather covers over its doors | BWC accommodation line 17; Read, roofs article; ET plan px 89-144, py 203.5-248.5; ET profile py 276 | [scaled] |
| Lift machinery room on its roof | −71 | −67 | about ±2.0 [bet] | top 4.6 (z 32.61) | waterproofed wood roof (the wreck shows only its beams) | Read, roofs article; ET profile py 266 | [scaled] x, z |

Not placed (NOT FOUND): the engineers' smoke room and the officers' mess as separate houses (Read names their roofs only), the large cowl ventilators' stations, the four 15-cwt electric boat winches ("in the positions shown in Plate III", Shipbuilder 37688-37690; the plate is not in the OCR text).

## 2. Funnels, masts, rigging

### 2.1 Funnels

The base is where the funnel meets its casing top; the axis is raked 9.46° aft, so x(z) = x_base − (z − z_base) × 0.1667. The top is cut square to the axis: the forward point is the highest, the centre 0.61 m lower [derived: 3.735 m × sin 9.46°; the ET profile shows the top falling 5 to 6 px, 1.2-1.4 m, from forward to aft].

| Funnel | Base centre x | Base z (casing top) | Top, forward high point z | Top centre (x, z) | Spacing | Source | Tag |
|---|---|---|---|---|---|---|---|
| No. 1 (boiler rooms 6 and 5) | +54.9 ±0.5 | 31.0 | 49.89 (163 ft 8 in) | (+51.9, 49.28) | | plan ellipse +55.20; profile +55.17 (top) and +54.44 (edges); bulkhead E (60F) +54.41 | [scaled] x, z base; [read] top |
| No. 2 (rooms 4 and 3) | +19.3 ±0.4 | 30.8 | 50.34 (165 ft 2 in) | (+16.1, 49.73) | 35.6 | plan +19.38; profile +19.33, +18.96; bulkhead G (22F) +19.66 | as above |
| No. 3 (rooms 2 and 1) | −16.3 ±0.5 | 30.8 | 50.34 | (−19.5, 49.73) | 35.6 | plan −16.07; profile −16.23, −17.02; bulkhead J (18A) −16.00 | as above |
| No. 4 (over the turbine room) | −52.3 ±0.5 | 30.3 | 49.89 | (−55.5, 49.28) | 36.0 | profile −52.02, −52.62 | [scaled] |

| Property | Value | Source | Tag |
|---|---|---|---|
| Section | elliptical, 24 ft 6 in × 19 ft 0 in = 7.47 × 5.79 m (long axis fore and aft) | Shipbuilder 24390-24391 | [read] |
| Rake | 2 in aft per 12 in of height, 9.46° from plumb; the ET profile's edges give 9.6 ± 1.5° | Read, funnel heights article lines 42-44 (H&W rigging plan); ET profile | [read], [scaled] |
| Why 1 and 4 are lower | the middle two are 18 in higher so that the row looks level against the sheer | Read, funnel heights article lines 69-73 | [read] |
| Where the uptakes meet | "united immediately above the watertight bulkhead separating the rooms": funnels 1, 2, 3 stand over bulkheads E, G, J | Shipbuilder 24384-24388 | [read] |
| Height above the furnace bars | "average height ... 150ft." | Shipbuilder 24392-24393 | [read] |
| Black top ("smoke band") | about 18 ft 6 in (5.64 m) deep, satin black, from the lower reinforcement band to the top; the base flange black too; the rest White Star buff, flat | Read, funnel exterior article lines 18, 153-156 | [read] |
| Reinforcement bands | lower: flat bar 3/8 × 5 in with a 3.5-in half-round, at the foot of the black band, carries the shrouds' eyes; upper: 3/8 × 7.5 in at the top, 5 painters' line brackets a side | Read, funnel exterior article | [read] |
| Rivet lines | 15 equidistant vertical bands, 5 double horizontal bands | Read, funnel exterior article | [read] |
| Whistles | on the forward face; working sets on funnels 1 and 2 only ("One set has been fitted on each of the two foremost funnels"); 3 and 4 carried dummies of wrought metal | Shipbuilder 26020-26022; Read, whistle article | [read] |
| Steam escape pipes | on every funnel, forward pipe about 17 in, aft pipe about 15 in diameter | Read, funnel exterior article lines 117-118 | [read] |
| Ladder | on the forward face of each funnel | Read, funnel exterior article | [read] |
| Water pipes | loops and overflow pipes on the forward faces of 1, 2, 3, the aft faces of 1, 3, 4 (none on 2's aft face or 4's forward face) | Read, water pipes article | [read] |
| Funnel 4 | a ventilator over the turbine room ("a most valuable adjunct for ventilating purposes"), no smoke | Shipbuilder 26042-26044 | [read] |

### 2.2 Masts

ET profile scale: x = (px − 673.09) × 0.23286, z = (407 − py) × 0.23125; mast lines found by line search through the points where the stays meet the mast (`hough.js`).

| Part | x | y | z | Notes | Source | Tag |
|---|---|---|---|---|---|---|
| Foremast, foot at the forecastle deck | +95.0 ±0.7 | 0 | `C.deckZ('B', 95)` (forecastle deck) | passes through the forecastle deck to C deck ("mast hole under the forecastle ... nearly 4-foot diameter"); steel pole mast stiffened with angles, teak pole at the top | ET profile; Mengot, "Titanic's Blueprints" [read in that page]; BWC structure line 34 | [scaled] |
| Foremast, lower attachment (hounds) | +90.9 | 0 | 47.5 | shrouds (3 a side, the aft two rattled) and the double forestays | ET profile; Read, rigging article | [scaled] |
| Foremast, middle and upper attachments | +89.7, +88.3 | 0 | 56.4, 65.2 | backstays and a single forestay at each | as above | [scaled] |
| Foremast, top | +87.4 | 0 | 69.1 (the ET profile); The Shipbuilder's "205ft. above the average draught line" gives 71.6 (line at 30 ft, the rigging plan's waterline) to 73.0 (line at 34 ft 7 in) | the aerial's halyard block 2 ft above the base of the teak pole | ET profile; Shipbuilder 32344-32346; Read, Marconi and funnel heights articles | [scaled]; [read] the 205 ft, [bet] its datum |
| Mast rake (both) | | | | about 9.5° aft [bet: the funnels' 2 in in 12]; the ET profile gives 9.8-10.0° (foremast) and 10.0° (mainmast, upper part 11°, lower 9.4°), the Belfast photograph both clearly raked aft | | ET profile; photograph `...12_44_12-...png` | [scaled], [bet] |
| Mast diameter | | | | NOT FOUND; [bet] 0.9 m (3 ft) at the deck tapering to 0.6 m at the hounds, the teak pole 0.25-0.3 m | | Mengot's 4-ft mast hole [read in that page] bounds it | [bet] |
| Mainmast, through A deck | −87.4 ±1.0 | 0 | `C.deckZ('A', x)` | the A deck's beams strengthened from 95A to 102A (x −86.4 to −92.8) "around the aft mast"; where it is stepped below NOT FOUND [bet: to C deck, as the foremast] | ET profile; Mengot [read in that page] | [scaled] |
| Mainmast, hounds | −91.0 | 0 | 47.9 | | ET profile | [scaled] |
| Mainmast, middle and upper attachments | −89.4, −86.0 | 0 | 55.6, 65.6 | | ET profile | [scaled] |
| Mainmast, top | −94.9 | 0 | 69.1 (as the foremast) | | ET profile | [scaled] |
| Crow's nest (look-out cage) | +93.4 (on the foremast's axis) | 0 | floor 35.2, rim 37.1 (ET profile); "about 95 ft. above the waterline" = 39.4 (h + 10.44) or 39.5 | steel cage reached by a ladder inside the foremast, openings at C deck and at the cage; size NOT FOUND [bet: 1.5 m across, 1.2 m high] | BWC structure line 35; ET profile (a box on the mast line at py 247-255) | [read], [scaled] |
| Masthead light | +90.0 [derived: on the raked foremast at that height] | 0 | ≈ 54.6 ("about 145 ft above the water", Halpern, as quoted in `site/visuals.js`) | above the hounds: "An iron ladder was fitted on the foremast from the hounds to the masthead light" | BWC structure line 35; `site/visuals.js` line 307 | [read], [derived] |
| Foremast derrick (for motor cars) | heel by the mast's foot (+94.0, z 25.1), head stowed up and aft at (+79.2, z 37.1) | 0 | | | Shipbuilder 32347-32349; ET profile (the heavy diagonal) | [read], [scaled] |
| Masts' colour | | | | "dark mast" (a dark rust brown) | Read, colour guide | [read] |

### 2.3 Standing rigging and the aerial (line segments)

| Line | From (x, y, z) | To (x, y, z) | Notes | Source | Tag |
|---|---|---|---|---|---|
| Foremast shrouds, 3 a side | (+90.9, 0, 47.5) | the ship's side at the forecastle deck, x about +94 to +97, y ±(half-breadth) [bet] | lower ends on padeyes inside the shell; 5.5-in wire (1.75 in diameter); the aft two rattled with steel rods | Read, rigging article | [read] pattern, [bet] ends |
| Foremast backstays, middle and upper, 1 a side each | (+89.7, 0, 56.4), (+88.3, 0, 65.2) | the ship's side about 5-10 m abaft the shrouds [bet] | on special plates | Read, rigging article | [read], [bet] |
| Foremast forestays (2 lower, 1 middle, 1 upper) | the three attachments | padeyes on the forecastle deck near the stem, x +115 to +127 [bet] | forestays end on decks and roofs | Read, rigging article; ET profile | [read], [bet] |
| Mainmast shrouds and backstays | (−91.0, 0, 47.9) and above | the ship's side at B deck aft, x about −92 to −100 [bet] | as the foremast | Read, rigging article | [read], [bet] |
| Mainmast forestays | its three attachments | roofs forward of the mast (the smoke room roof and the A-deck house aft end), x about −60 to −78 [bet] | | Read, rigging article | [bet] |
| Jackstay, foremast | funnel 1's forward face (about +55.5, 0, 45) [bet] | the foremast (about +89, 0, 50) [bet] | for halyards | Read, rigging article lines 159-160 | [read] that it existed, [bet] ends |
| Jackstay, mainmast | the mainmast's upper attachment (−86.0, 0, 65.6) | the poop deck under the docking bridge (about −126, 0, 23.5) | turnbuckle on deck | Read, rigging article lines 153-154 | [read], [scaled] ends |
| Funnel shrouds, 6 a side on each funnel | the lower reinforcement band (the foot of the black top, about 5.6 m below the top centre) | deck eyes beside the funnel, hemp lanyards | 4-in wire; on funnel 1 shrouds 3 and 4 carry the round links for lowering collapsibles A and B | Read, rigging and collapsible articles | [read], [bet] lower ends |
| Aerial flat-top | spreader by the foremast's teak pole (about +87.5, ±1.5, 66 [bet]) | spans to the mainmast, the wires ending forward of funnel 4 (about −45, ±1.5, 64 [bet]) | four 7/19 silicon-bronze wires (The Shipbuilder says "two parallel aerial wires"), ash spreaders, in catenaries, the outer pair lower | Read, Marconi article; Shipbuilder 32248-32256 | [read], [bet] heights |
| Aerial downleads | the flat-top just forward of funnel 2 (about +24 [bet]) | an ebonite strain insulator over the officers' house roof by the aerial mast (about +45, 0, 33 [bet]) | | Read, Marconi article | [read], [bet] |

## 3. Boats and davits

### 3.1 The davits (the same frames on both sides)

| Station | Frame, shift | x (no frame 0) | x (if a frame at amidships) | Davit | Source | Tag |
|---|---|---|---|---|---|---|
| 1 | 72F, 13-37/64 in forward | +65.72 | +66.18 | single frame | Read, davit placement article (shifts; the extracted table's last four rows re-aligned from his printed spans) | [read], [derived] |
| 2 | 61F, 14-61/64 in forward | +55.70 | +56.16 | twin frame, single carling | | |
| 3 | 50F, 5-13/64 in forward | +45.39 | +45.85 | twin frame | | |
| 4 | 39F, 5-13/64 in aft | +35.07 | +35.53 | twin frame | | |
| 5 | 28F, 6-11/64 in aft | +24.99 | +25.45 | single frame, double carlings | | |
| 6 | 35A, 6-11/64 in forward | −31.39 | −31.85 | single frame, double carlings | | |
| 7 | 46A, 5-13/64 in aft | −41.74 | −42.19 | twin frame | | |
| 8 | 57A, 6-51/64 in aft | −51.84 | −52.29 | twin frame, partial beam 12 in aft of the frame | | |
| 9 | 68A, 6-51/64 in aft | −61.89 | −62.35 | twin frame, as 57A | | |
| 10 | 79A, 13-37/64 in aft | −72.13 | −72.58 | single frame | | |

Spans (davit to davit), as printed by Read and reproduced by the arithmetic: 72F-61F 32 ft 10-5/8 in (cutter plus collapsible); 61F-50F 33 ft 9-3/4 in; 50F-39F 33 ft 10-13/32 in; 39F-28F 33 ft 0-31/32 in; 35A-46A 33 ft 11-3/8 in; 46A-57A 33 ft 1-19/32 in; 57A-68A 33 ft; 68A-79A 33 ft 6-25/32 in [read, derived].

| Davit property | Value | Source | Tag |
|---|---|---|---|
| Type | Welin double-acting quadrant davits; the intermediate stations are twin frames carrying "the two quadrants and all the necessary gear for operating the forward and after boat" | Read, davit placement article; Shipbuilder 37650-37686 | [read] |
| Footprint | the davit's frame runs about 2.0 m inboard from the deck edge (the plan's symbol, 16 px) | ET plan | [scaled] |
| Head height above the deck, upright | NOT FOUND; [bet] 3.0-3.7 m (the viewer uses 3.0) | | [bet] |
| Outreach, swung out | NOT FOUND; [bet] a lifeboat's centre 1.6-1.9 m outboard of the deck edge (the viewer uses 1.5) | | [bet] |
| Falls | treble blocks for the lifeboats, double for the cutters, manila, long enough to reach the light waterline | BWC life-saving appliances | [read] |
| Winches | four 15-cwt electric boat winches, positions not in the text | Shipbuilder 37688-37690 | [read], NOT FOUND |

### 3.2 The boats

Odd numbers to starboard, even to port. Boat centres are mid-way between their two davits.

| Boat | Side | x centre | y centre | Keel above the Boat deck | Size (L × B × D) | Stowage | Source | Tag |
|---|---|---|---|---|---|---|---|---|
| Cutter 1, cutter 2 (emergency boats) | S, P | +60.71 (72F-61F) | ±15.4 (swung out: the inboard gunwale against a wood fender under the bulwark's rail) | about +0.2 [bet: the gunwale just under the 4-ft rail] | 25 ft 2 in × 7 ft 2 in and 25 ft 2 in × 7 ft 1 in (which is No. 1 the BWC does not say) × 3 ft 0 in (7.67 × 2.18 or 2.16 × 0.91 m) | always swung out at sea, three rope gripes to the shell below the A-deck screen's windows; no chocks, no covers; a lantern lit at night | BWC life-saving appliances; Read, 25-ft boats article lines 152-199; ET plan (drawn outboard, py 102) | [read], [scaled] y |
| 3, 4 | S, P | +50.55 | ±12.7 | about +0.4 [bet 0.3-0.5] on hinged wood chocks | 30 ft 0 in × 9 ft 1 in × 4 ft 0 in (9.14 × 2.77 × 1.22 m) | fixed position, outboard edge at the deck edge; covered (white canvas) | BWC; Read, 30-ft and movable boats articles; ET plan py 124.5 | [read], [scaled] |
| 5, 6 | S, P | +40.23 | ±12.7 | +0.4 | as above | as above | as above | as above |
| 7, 8 | S, P | +30.03 | ±12.7 | +0.4 | as above | as above | as above | as above |
| 9, 10 | S, P | −36.56 | ±14.0 at sea (keel nearly at the deck edge); ±12.7 in harbour (50 in inboard) | +0.4 | as above | two fixed positions 50 in apart, moved out at sea for promenade room | Read, movable lifeboats article lines 23-34 | [read], [derived] y |
| 11, 12 | S, P | −46.79 | as 9, 10 | +0.4 | as above | as above | as above | as above |
| 13, 14 | S, P | −56.87 | as 9, 10 | +0.4 | as above | as above | as above | as above |
| 15, 16 | S, P | −67.01 | as 9, 10 | +0.4 | as above | as above | as above | as above |
| Collapsible C, D | S, P | +60.7 (abreast the cutters, under their davits) | ±12.4 | folded on deck, about 0.4 high [bet] | Titanic's: 28 ft 0 in overall (27 ft 5 in by the Board of Trade's marks) × 8 ft 6 in × 3 ft 1 in (8.53 × 2.59 × 0.94 m); Olympic's 8 ft broad | on deck, "abreast of the cutters" | BWC; Read, Engelhardt article; ET plan py 126.8 | [read], [scaled] |
| Collapsible A, B | S, P | about +55 (outboard of funnel 1) [bet ±3] | ±5.3 [bet ±0.5: between funnel 1 at ±2.9 and the roof's edge at ±6.9] | on the officers' house roof: deck + 2.4 + 0.4 | as C, D | on the roof, got down by falls hooked to links in funnel 1's shrouds 3 and 4 | BWC; Read, collapsible article lines 8-9, 53-57 | [read] stowage, [bet] x, y |

Boat colours: hulls white, gunwales dark mast, interiors stone, covers white canvas [read Read, colour guide].

## 4. The open decks and their edges

### 4.1 Deck heights, camber and sheer

| Deck | Core `G.deck` at x = 0 | Source at x = 0 | Source | Tag |
|---|---|---|---|---|
| Boat | 28.12 | 28.13 (92 ft 0 in at the low point on the centreline, + 3.5 in of sheer to amidships) | Read, sheer article (C deck 64 ft 6 in on the centreline at the low point, from the midship plan); BWC (B to C 9 ft 0 in, A to B 9 ft 0 in, Boat to A 9 ft 6 in) | [read], [derived] |
| A | 25.22 | 25.23 | as above | [derived] |
| B | 22.48 | 22.49 | as above | [derived] |
| C | 19.74 | 19.75 | as above; BWC registered depth "64ft. 9in." to the top of the beam at the low point | [read] |
| D | 16.54 | 16.55 (10 ft 6 in below C amidships, 9 ft at the bow, 9 ft 6 in at the stern) | BWC accommodation line 23 | [read] |
| E | 13.79 | 13.80 | BWC | [derived] |

The sheer of C deck "and all decks above" (Read's primary curve, PSC) is two parabola-like curves from a low point 79 ft 8-1/8 in (24.29 m) abaft amidships, rising 11 ft 10 in at the FP and 4 ft 0 in at the AP (Read, sheer article lines 57-60, 121-155, from the H&W lines plan and a Board of Trade surveyor's note of 4 November 1910); his table of offsets, converted (`derive.js`):

| x | Rise above the low point, m | Above amidships | Core's sheer (`C.sheer(x)`) | Core − source |
|---|---|---|---|---|
| −129.54 (AP) | 1.22 | 1.13 | 1.90 | +0.77 |
| −118.75 | 1.04 | 0.95 | 1.60 | +0.65 |
| −107.95 | 0.83 | 0.74 | 1.32 | +0.58 |
| −97.16 | 0.65 | 0.56 | 1.07 | +0.51 |
| −86.36 | 0.49 | 0.40 | 0.84 | +0.44 |
| −75.57 | 0.34 | 0.26 | 0.65 | +0.39 |
| −64.77 | 0.22 | 0.13 | 0.47 | +0.34 |
| −53.98 | 0.12 | 0.03 | 0.33 | +0.30 |
| −43.18 | 0.05 | −0.04 | 0.21 | +0.25 |
| −24.29 (low point) | 0.00 | −0.09 | 0.07 | +0.16 |
| 0 | 0.09 | 0.00 | 0.00 | 0.00 |
| +21.59 | 0.33 | 0.24 | 0.11 | −0.13 |
| +43.18 | 0.73 | 0.64 | 0.43 | −0.21 |
| +64.77 | 1.25 | 1.16 | 0.97 | −0.19 |
| +86.36 | 1.93 | 1.84 | 1.73 | −0.10 |
| +107.95 | 2.72 | 2.63 | 2.71 | +0.08 |
| +118.75 | 3.15 | 3.07 | 3.28 | +0.21 |
| +129.54 (FP) | 3.61 | 3.52 | 3.90 | +0.38 |

D deck and below follow a secondary curve 18 in higher at the FP and 12 in higher at the AP (13 ft 4 in and 5 ft 0 in), shared with the primary for 8 of 32 divisions either side of the low point (Read, sheer article lines 64-66, 443-461); the BWC's D and E heights at the bow (33 ft and 24 ft above the waterline against 20 ft and 11 ft amidships) and stern (25 ft and 16 ft) agree [read]. The core's single curve (3.9 m forward, 1.9 m aft, from x = 0) lies between the two curves forward and above both aft. **For the drawing: keep every topside part on `C.deckZ`**; the error this leaves is at most 0.8 m at the stern and 0.4 m at the stem, and changing the core's sheer is not lane T's business.

### 4.2 The forecastle (at the level of B deck)

| Part | x aft | x fwd | y | z | Notes | Source | Tag |
|---|---|---|---|---|---|---|---|
| Forecastle deck | +91.6 (128 ft from the stem's head; +92.5 with the BWC's 125 ft) | +130.6 (the stem's head) | the hull's half-breadth | `C.zTopAt(x)` (the core's B level) | "the gear for working the anchors and cables and for warping"; the machinery itself on C deck below | Shipbuilder 22572; BWC accommodation lines 21-22; ET profile (stem) | [read], [derived] |
| Rails | the sides and the after edge | | at the side | top rail 1.07 m (42 in) above the sheathing | 5-bar, six removable sections a side; the shell stands 7.5 in above the sheathing at the sides; the rail along the after edge is 6-bar (the plating there stands only 3.5 in) | Read, forecastle railings article | [read] |
| No. 1 hatch | about +108 [bet ±4] | | 0 | coaming 0.76 m (30 in) | 14 ft athwart × 12 ft fore and aft (4.27 × 3.66 m); steel cover, four bullseyes, two hinged vents, angled forward face; brackets on its forward and outboard sides | Read, hatches article | [read] size, [bet] place |
| Breakwater | from No. 1 hatch's after corners, outward and aft | | | NOT FOUND [bet 1.0-1.2 m] | the aft face of the hatch coaming abaft the breakwaters white | Read, hatches and coamings colour articles | [read] that it was there |
| Anchor crane | about +125 [bet] | | 0 | | "A strongly built crane is fitted at the centre-line of the forecastle deck for handling the 15½-ton anchor" | Shipbuilder 37528-37536 | [read], [bet] x |
| Centre anchor well | about +128 [bet] | | 0 | | "placed in a well on the deck immediately abaft the stem" | Shipbuilder 37534-37536 | [read], [bet] x |
| Capstans and windlass heads | NOT FOUND | | | | painted green, bronze tops | Read, colour guide | [read] colours |
| Foremast | +95.0 | | 0 | | section 2.2 | | [scaled] |

### 4.3 The forward well (C deck)

| Part | x aft | x fwd | y | z | Notes | Source | Tag |
|---|---|---|---|---|---|---|---|
| Well deck | +75.4 (B deck's front, frame 83F; the ET profile shows +75.2) | +91.6 | the hull's half-breadth | `C.deckZ('C', x)` | 16.2 m (53 ft), "about 50 ft"; a third-class promenade | Mengot [read in that page]; BWC accommodation line 22; ET profile | [read], [derived] |
| Bulwark round the well | the length of the well | | at the side | NOT FOUND [bet: solid, 1.1-1.2 m above the well deck, with a rail] | the well's bulkheads and gangway dadoes dark mast | Read, dark mast article | [bet] |
| No. 2 hatch | about +84.5 [bet ±1.5] | about +89.5 | ±3.05 | coaming 0.76 m | 20 ft athwart × 16 ft 6 in (6.10 × 5.03 m), three hatch beams, locking bars | Read, hatches article | [read] size, [bet] place |
| No. 3 hatch (the bunker hatch) | about +78.7 [bet ±1.5] | about +82.4 | ±3.05 | coaming 0.76 m | 20 × 12 ft (6.10 × 3.66 m); "that near the passengers' quarters" | Read, hatches article; Shipbuilder 32335-32338 | [read] size, [bet] place |
| Two 2.5-ton electric cranes | about +80 [bet] | | about ±5.5 [bet] | on the well deck | serve No. 3 hatch, jibs non-luffing; two 3-ton electric winches there too, three steam winches for Nos. 1 and 2 | Shipbuilder 32335-32338; Read, crane article | [read], [bet] place |

### 4.4 B deck (the bridge deck)

| Part | x aft | x fwd | y | z | Notes | Source | Tag |
|---|---|---|---|---|---|---|---|
| B deck | −92.2 | +75.4 | the hull's half-breadth (the core's `halfBreadth` at B) | `C.deckZ('B', x)` | "continuously for 550 ft."; the top deck of the strong structure, its stringer doubled; the side plating up to it heavy, the two decks above light | BWC accommodation line 20 and structure line 19; Shipbuilder 22568-22569 | [read], [derived] |
| Its sides, B to A | the same | | at the ship's side (flush with the hull) | B to A | on Titanic staterooms (and two private promenades) run out to the shell, lit by rectangular windows; The Shipbuilder's enclosed promenade "over 400ft. long and 13ft. minimum width" describes Olympic | Shipbuilder 30039-30056 (Olympic); "B Deck was the first deck which had squared windows" [search summary, an affidavit on Encyclopedia Titanica] | [read] for Olympic, [bet] for Titanic's window pattern |
| No. 4 hatches, port and starboard | about −92.2 [bet] | about −90.2 | inboard edge about ±11.0, outboard about ±13.7 [bet] | coaming 0.76 m, painted white | 9 ft athwart × 6 ft 6 in (2.74 × 1.98 m), for galley stores; the B deck house forms their forward and inboard sides | Read, hatches and coamings colour articles | [read] size, [bet] place |
| Ladders aft | at the after end | | | | two, down to the after third-class promenade in the well | BWC accommodation line 20 | [read] |

### 4.5 A deck (the promenade deck)

| Part | x aft | x fwd | y | z | Notes | Source | Tag |
|---|---|---|---|---|---|---|---|
| A deck | about −77.8 [bet: as the Boat deck above it] | +72.9 | ±14.33 (94 ft) | `C.deckZ('A', x)` | "about 500 feet"; entirely first class | BWC accommodation line 19; Shipbuilder 22842, 30058-30063 | [read], [scaled] front |
| The house on A deck | about −73.4 (the verandah cafés' after end) | about +72 (the front) | half-width 3.7 to 11.0 m ("varying in width from 24 ft. to 72 ft.") | A to the Boat deck | from forward: 34 staterooms (about ±9.3 at the forward end, scaled), the forward entrance, the reading and writing room (port) and the lounge (±9.6, 63 ft), the narrow part abreast funnel 3's and the engine casings (±3.7 [bet]), the aft entrance, the smoke room (±9.6, 63 ft), two verandah cafés and palm courts 30 × 25 ft "on each side of the deck house immediately abaft the smoking room" | BWC; Shipbuilder 27263, 27282, 27334-27340, 27605; ET A deck plan | [read], [scaled] |
| Promenade | the same | | from the house's side to the bulwark: about 3.3 m (11 ft) at the 72-ft parts, over 9 m where the house is narrow | A deck | "over 500ft. long on each side ... in parts exceeds 30ft. in width. It is covered by the boat deck above, but is open at the sides above the bulwark rail" | Shipbuilder 30060-30063 | [read], [derived] |
| Glazed steel screen (forward) | +14.4 (192 ft from the front) [the ET A deck plan's dimension line ends at +6.1: take +14.4 ±4] | +72.9 | at the ship's side | from the bulwark to the Boat deck | "a steel screen, 192 ft. long, with large windows in it", "below the forward group of boats and for a short distance further aft"; window count and size NOT FOUND [bet: about 1.5 m wide at 2.3-2.7 m spacing] | BWC accommodation line 19; ET A deck plan (`...12_53_46-...png`, scaled by its 94 ft breadth, 2.213 px/ft) | [read] length, [derived] ends |
| Open promenade (aft) | −77.8 | +14.4 | at the side | bulwark NOT FOUND [bet 1.07-1.22 m, teak rail]; open from the rail to the Boat deck | the Boat deck's edge carried on built-up frames "in line with the hull frames, but at wider intervals"; their spacing NOT FOUND [bet 2.74 m, every third frame]; at the aft joint two 2.5-in stanchions 12 in apart | Shipbuilder 22871-22876; Read, expansion joints article | [read], [bet] |
| Coaling outrigger brackets | two groups a side on the A-deck bulwark (Nos. 1-4 forward, 5-9 aft) and a tenth for the galley bunker | | at the bulwark | | ten a side, stowed facing aft, reaching over 4 ft outboard when rigged; their x NOT FOUND | Read, outrigger article | [read] |
| Two small electric cranes | about −76 [bet] | | about ±11.5 [bet] | at the after corners of A deck | 1.5-ton (Read; The Shipbuilder's OCR has "14-ton" for 1½), serving the No. 4 hatches below | Read, crane article line 14; Shipbuilder 32339-32340; ET A deck plan (jibs drawn at both after corners) | [read], [scaled] |

### 4.6 C deck aft, the after well and the poop

| Part | x aft | x fwd | y | z | Notes | Source | Tag |
|---|---|---|---|---|---|---|---|
| Second-class promenade, C deck | about −92.2 | about −66.6 [derived: 84 ft] | at the side | C to B | "a covered-in space 84ft. long, with sliding windows at the side, on the shelter deck abreast the second-class library"; under B deck, so it shows as a row of sliding windows in the hull side | Shipbuilder 30071-30074; BWC accommodation line 22 | [read], [bet] ends |
| After well deck | −106.1 | −92.2 | the hull's half-breadth | `C.deckZ('C', x)` | 13.9 m, "about 50 ft"; the after third-class promenade; two doors from the second-class promenade into it | BWC accommodation line 22; Mengot (117A) [read in that page] | [derived] |
| No. 5 hatch | about −95.9 | about −92.2 (against the C deck house's after bulkhead) | ±2.74 | coaming 0.76 m | 18 × 12 ft (5.49 × 3.66 m), two hatch beams | Read, hatches article | [read], [bet] x |
| No. 6 hatch | about −103.6 [bet ±1.5] | about −100.5 | ±2.74 | coaming 0.76 m | 18 × 10 ft (5.49 × 3.05 m) | Read, hatches article | [read], [bet] x |
| Four 2.5-ton electric cranes | two by B deck's after end (about −92), two by the poop front (about −106) [bet] | | about ±5.5 [bet] | | Nos. 5 and 6 "each served by two 2½-ton cranes and one 3-ton electric winch"; the ET profile labels cranes at −108 to −104 and at about −80 | Shipbuilder 32343-32344; ET profile | [read], [bet] |
| Poop deck | −138.3 (the counter's end) | −106.1 | the hull's half-breadth | `C.zTopAt(x)` (B level) | 106 ft (Shipbuilder) or "about 105 ft." (BWC); the after warping gear; third-class promenade; the steering gear beneath on C deck | Shipbuilder 22572; BWC accommodation lines 21-22; ET profile | [read], [scaled] |
| Docking bridge | −127.0 | −125.6 (centre −126.3 ±1.5) | full width and "several feet" beyond the sides [search summary] | platform about 2.0 m above the poop deck, rail top z ≈ 25.9 [scaled ±0.5] | "a light docking bridge, with telephone, telegraphs, etc."; a compass ("one on the docking bridge aft") | BWC accommodation line 21; BWC life-saving appliances; Shipbuilder 37703-37704; ET profile | [read], [scaled] |
| Poop rails | the sides and the fore edge | | | 1.07 m [bet: as the forecastle] | | | [bet] |

### 4.7 Rails, bulwarks and coamings at a glance

| Where | Kind | Top above the deck | Source | Tag |
|---|---|---|---|---|
| Boat deck, in way of the boats and aft | open rails | 1.07 m (42 in) | Read | [read] |
| Boat deck, −31.4 to +24.9 and +56.6 to +67.1 | steel bulwark, teak rail | 1.22 m (48 in) forward; the same amidships [bet] | Read; ET plan | [read], [bet] |
| Tank room roof and other roofs with rails | rails | 1.07 m (42 in) | Read, ventilator article line 27 | [read] |
| A deck | bulwark with teak rail, the screen above it forward | NOT FOUND [bet 1.07-1.22 m] | | [bet] |
| Forecastle, poop | 5-bar rails (6-bar at the forecastle's break) | 1.07 m | Read, forecastle railings article | [read] |
| Wells | solid bulwark | NOT FOUND [bet 1.1-1.2 m] | | [bet] |
| Hatch coamings | steel, black outside (No. 4 white), white inside | 0.76 m (30 in), corner radius 12 in | Read, hatches and coamings colour articles | [read] |

## 5. The hull's look above water

| Part | Value | Source | Tag |
|---|---|---|---|
| Colours | hull black (faded: a very dark gray); superstructure, deckhouses and boats white; a yellow sheer line between black and white; the name and port in yellow; antifouling below | Read, colour guide | [read] |
| Black to white | the hull's black runs up to B deck's level (the top of the heavy side plating), the white begins above it with B deck's windows: the core's hull top (`C.zTopAt`) is that line, and the viewer's gold line at `zTopF − 0.25` sits where the sheer line belongs | BWC structure line 19 (heavy plating, the top of the strong structure); photograph | [read], [bet] the exact edge |
| Sheer line width | NOT FOUND [bet 0.15-0.25 m]; on Olympic it was moved down onto the black in 1921 | [search summary] | [bet] |
| Black above, antifouling below | the separation is straight through the middle body and curves up from about the wells to the ends: at the bow it crosses strake O about 1 ft below the O/P seam, at the stern the O/P seam, amidships the middle of the condenser discharge in strake Q (the next "out" strake below the lowest ports' strake S) | Read, separation line article | [read] the shape; absolute z NOT FOUND [bet: z 10.3-10.6 amidships, 0.5-1.0 m higher at the ends] |
| Load line | the disc's line 30 ft 9 in below the shelter deck at the side = 34 ft 6 in above the keel baseline (z 10.52), centred between frames 1A and 1F; a deck line marked for each deck up to C | Read, load line article | [read] |
| Side scuttles | round ports on every deck below B; B deck's windows square; the dining saloon's sidelights (D deck, about +17 to −17 [derived: the saloon, 112 ft (BWC) or 114 ft (Shipbuilder) long, "between the second and third funnels"]) "in groups of six and four lights alternately, each light being of large diameter"; counts, spacing and diameters NOT FOUND (one count: 1,116 hull ports and 419 windows [search summary, unverified]) | Shipbuilder 26626-26628, 26721; BWC accommodation line 23 | [read], NOT FOUND |
| Rows to draw | C, D, E and F decks along most of the length (C above the wells too), G deck forward and aft of the machinery; port centres about 1.2 m above their deck [bet, as the viewer] | BWC deck extents; the viewer | [bet] |
| Stem | raked: in the ET profile from x +130.6 at the forecastle deck to +129.2 at the waterline (about 1 in 9); the FP crosses it near E deck's height (z 17.7) | ET profile; the core's `stemRefZ` (58 ft) and `stemRake` (1/12) agree within 0.3 m | [scaled] |
| Counter stern | its after end at x −138.6 above z 20 in the ET profile (the core: −138.94 above z 15) | ET profile | [scaled] |
| Rudder's top | 78 ft 8 in above the keel (z 23.98), already in `site/visuals.js` | `site/visuals.js` line 35 (from The Shipbuilder's figures) | [read in the repository] |
| Anchors | side anchors (7¾ tons) in hawse pipes; positions NOT FOUND [bet: x +121 ±2, about 1 m below D deck]; the 15½-ton centre anchor in its well on the forecastle | Shipbuilder 37515-37541 | [read], [bet] |
| Gangway and side doors | D deck: two close together each side abreast the forward first-class entrance (x about +29 and +32 [bet]); one baggage door to starboard in the forward third-class space [bet x +70 to +80]. E deck: one each side at the forward end of the working passage [bet x about +72], one to port abreast the engine room [bet −35], one each side aft into the forward second-class entrance [bet −62]. Coal doors near the waterline | BWC structure line 27-31; Read, outrigger article | [read] which, [bet] where |
| Rubbing strake, fenders | none known [bet] | | [bet] |

## 6. Small things that carry likeness at a distance

| Part | x | y | z or height | Notes | Source | Tag |
|---|---|---|---|---|---|---|
| Fan housings and trunks at the funnel casings' ends | each casing's fore and aft ends (funnel 1: +50.7, +59.4; funnel 2: +12, +26; funnel 3: −23.0, −9.0) | about ±2.5 | 1.5-2.0 m boxes [bet] | the ET plan labels VENT, FAN, TRUNK at each end; Sirocco fans 30 in | ET plan; Shipbuilder 26046-26050 | [scaled] places, [bet] sizes |
| Standard ventilators | NOT FOUND stations | | | 35-in delivery and 30-in suction types; bases concrete-coloured | Read, ventilator article; colour guide | [read] types |
| Sounding machines (Kelvin, motor-driven, two) | about +57.4 | about ±13.0 | on deck by the bulwark opening | "Adjacent to the navigating bridge"; a sounding spar rigged above the opening | Shipbuilder 37710-37713; Read, bulwark article | [read], [derived] |
| Aerial lead-in mast on the officers' house | about +45 [bet] | 0 | 1.5 m above the roof | 10 in square | Read, Marconi article | [read] size |
| Crow's nest bell | NOT FOUND | | | | | |
| Side lights | +68.6 (the wing cabs) | ±14.4 (the cabs' outer faces) | Boat deck + 1.6 [bet, as the viewer] | red and green light boxes (their insides painted red and green) | ET plan (cabs); Read, colour guide | [scaled] |
| Masthead light | +90.0 | 0 | ≈ 54.6 | on the raked foremast above the hounds | section 2.2 | [derived] |
| Stern light | the docking bridge (−126.3) or the taffrail (−137.7, as the viewer) | 0 | | the 1910 rules required none of a steamer; a bet either way | `site/visuals.js` lines 303-320 | [bet] |
| Telegraphs | the navigating bridge's wings and front; the docking bridge | | | brass | Read, colour guide; BWC | [read] |

## 7. What the viewer draws today against the record

Read in the repository at `a97a6bd`. **The shared working tree moved while this note was written (14:03 CST, uncommitted, another lane):** `core/readers/people.js` already carries boat stations from the partial note's row 14 (+30.49, +40.69, +51.00, +61.17; −37.02, −47.24, −57.32, −67.47, with C and D at +61.17), which is the "frame at amidships" convention; this note's convention puts every one 0.46 m nearer amidships (section 3.1, section 8 item 1). Whichever is kept, the drawn davits and the reader must use the same one. `site/app.js` changed only at lines 1466 and 1951 and `core/core.js` only after line 73, so the lines cited below still hold. Today's topsides are 6 boxes, 4 funnels (face, cap and edges each) and 2 masts: 16 face meshes and 10 edge objects, 26 draw calls in X-ray [derived from `site/app.js:424-464`]. Every box is flat, placed at `C.sheer` of its own middle, so its ends part from the sheer (at x +73 the real A and Boat decks stand 1.2-1.4 m above amidships).

| Viewer part (file:line) | Drawn today | The record (this note) | Correction for lane T | Tag of the record |
|---|---|---|---|---|
| B-to-A block (`site/app.js:439`) | x −90.8 to +76.9, ±13.6, flat | B deck −92.2 to +75.4, its sides flush with the hull, following the sheer | ends 1.4 m aft and 1.5 m aft; follow `C.deckZ('B', x)` | [read], [derived] |
| A-to-Boat block (`:440`) | x −78 to +73.5, ±12.9 | A and Boat decks ±14.33 (94 ft, wider than the hull's ±13.8 at that height); the A-deck house inside (±3.7 to ±11.0) with a promenade outside; the glazed screen +14.4 to +72.9 at the side; open with stanchions aft; front +72.9 | a deck slab at ±14.33 from −77.8 to +72.6, an irregular house below it, screen and stanchions at the side | [read], [scaled] |
| Forward deckhouse (`:441`) | +56 to +73.5, ±7.5, 2.7 m | officers' house +36.0 to +64.8, ±6.9, 2.4 m; wheelhouse +64.8 to +67.8, ±2.95, 2.4 m; open bridge to +72.5 with wing cabs at ±12.7 to ±14.3 | split into house, wheelhouse, bridge and cabs; move aft 20 m at its after end | [scaled] |
| Long deckhouse (`:442`) | −70 to +52, ±5.4, 2.6 m | separate houses: forward entrance, funnel 2's house with the gymnasium, the lounge and reading-room roofs, funnel 3's casing, the engine-casing house, the aft dome's cover, the smoke room's roof with funnel 4, the second-class entrance (section 1.2) | replace by the table of section 1.2 | [scaled] |
| Raised "bridge" (`:443`) | +68 to +73.5 at Boat + 2.7 to + 4.6, ±3.5 | no such structure: the navigating bridge is at the Boat deck's level, its roof about 2.4 m up | remove | [scaled], [search summary] |
| Well marker (`:438`) | a 1-cm box at `G.wellFwd[0]` | | none needed | |
| Funnels (`:444-457`) | x +45.5, +12.5, −20.5, −53.5; base on the Boat deck; 18.9 m long; rake 0.075 rad (4.3°); black cap 4.2 m; section 7.46 × 5.80 | bases at +54.9, +19.3, −16.3, −52.3 on casings at z 31.0, 30.8, 30.8, 30.3; forward high points of the tops 49.89, 50.34, 50.34, 49.89; rake 9.46°; black 5.64 m; the section is right | move +9.4, +6.8, +4.2, +1.2 m; raise their feet onto casings; rake ×2.2 | [read] tops, rake, black; [scaled] stations |
| Masts (`:458-463`) | fore at +93.5 to z 62; main at −108 to z 58; rake 0.06 rad (3.4°); radius 0.45 to 0.35 | fore: foot +95.0 on the forecastle deck, top (+87.4, 69.1); main: through A deck at −87.4, top (−94.9, 69.1); both raked about 9.5° | mainmast 20.6 m forward; both 7 to 11 m taller (69.1, or up to 73.0 by The Shipbuilder); rake ×2.8 | [scaled], [bet] rake |
| Smoke sources (`:1048`) | x +45.5, +12.5, −20.5; 37.1 m above the sea (z ≈ 47.0) | the top centres (+51.9, 49.28), (+16.1, 49.73), (−19.5, 49.73): about 39.4-39.8 m above a 9.9 m waterline | follow the funnels | [derived] |
| Steam jets (`:1075`) | x +49.0, +16.0, −17.0; the smoke height + 1.5 | the escape pipes on the forward faces, at the tops' forward edges: x ≈ +55.6, +19.8, −15.8; their mouths about 1 m above the top [bet] | follow the funnels | [read] pipes, [bet] height |
| Bridge eye (`:1152-1153`) | x +75.2, 1.75 m above the Boat deck | the bridge's front is at +72.5 (+72.9 in the profile): +75.2 is in the air over the well | x ≈ +71.5 behind the front windows [derived] | [scaled] |
| Crow's nest (`site/parts/20_night_scene.js:59-67`) | mast at +93.5, rake 0.06; eye 29.0 m above the night's waterline (z ≈ 38.5, x ≈ +93.7), 1 m forward of the axis | on the foremast's axis at +93.4: cage floor z 35.2, rim 37.1 (ET profile); "about 95 ft. above the waterline" (z ≈ 39.4, BWC) | keep the BWC height; take x from the corrected mast (foot +95.0, rake 9.46°: the same formula gives x ≈ +93.7 at z 38.5, so the eye barely moves) | [read], [scaled] |
| Boat stations, x (`core/readers/people.js:71-90`, drawn at `BP.STATION` by `site/parts/50_boats.js:85-105`) | +67, +56, +46, +35 forward; −34, −44, −55, −66 aft | +60.71, +50.55, +40.23, +30.03; −36.56, −46.79, −56.87, −67.01 (no frame 0; 0.46 m farther out with a frame 0) | the forward boats stand 5.0, 5.4, 5.8, 6.3 m too far forward, the aft ones 2.6, 2.8, 1.9, 1.0 m too near amidships. Moving the reader's x is a core change (people state, `calibrate_people.js`); the part could draw on-deck boats and davits at the sourced x while the reader keeps its own (the partial note's two options) | [read], [derived] |
| Boat stations, y (`people.js:103-104`; `50_boats.js:91-99`) | the deck's edge = the hull's moulded half-breadth at the Boat deck (about ±13.8 amidships); chocked boats at edge − 1.6, cutters at edge + 1.5 (`OUT`), swung-out boats at edge + 1.5 | forward lifeboats ±12.7 (their outboard edge at the deck edge, ±14.1); aft lifeboats ±14.0 at sea; cutters ±15.4; C and D ±12.4; the deck's edge ±14.33 (94 ft) | chocked forward boats fine within 0.5 m; aft boats 1.8 m too far inboard at sea; cutters fine | [read], [scaled] |
| Roof boats A and B (`50_boats.js:92`) | x +64, y ±3.0, deck + 2.7 | x about +55 (outboard of funnel 1), y about ±5.3, the roof (deck + 2.4) + 0.4 | 9 m aft, 2.3 m outboard | [read] stowage, [bet] x, y |
| Collapsibles C and D on deck (`50_boats.js:94`) | at the cutter's x (+67), edge − 2.6 (about ±11.2) | +60.7, ±12.4 | follow the cutters' corrected x | [scaled] |
| Davit head (`50_boats.js:24`) | `HEAD` 3.0 m | NOT FOUND [bet 3.0-3.7] | keep | [bet] |
| Boat sizes (`50_boats.js:23`) | lifeboat 9.14 × 2.77 × 1.22; cutter 7.67 × 2.18 × 0.91; collapsible 8.36 × 2.44 × 0.91 | lifeboat 9.14 × 2.77 × 1.22 ✓; cutters 7.67 × 2.18 and 7.67 × 2.16 × 0.91 ✓; Titanic's collapsibles 8.53 × 2.59 × 0.94 (28 ft × 8 ft 6 in × 3 ft 1 in) | collapsibles 0.17 m longer, 0.15 m broader | [read] |
| Masthead light (`site/visuals.js:311`) | x +94.0, z 53.8 (9.6 + 145 ft) | on the raked foremast at that height: x ≈ +90.0 | x −4.0 | [derived] |
| Side lights (`visuals.js:312-319`) | x +74.6, at the hull's side + 0.45, Boat deck + 1.6 | in the wing cabs, x +67.6 to +69.6 (take +68.6), outer face ±14.3 to ±14.4 | x −6.0 | [scaled] |
| Stern light (`visuals.js:314, 320`) | the taffrail, x −137.7 | the comment's own bet (the docking bridge) would be −126.3 | a bet either way | [bet] |
| Ports and windows (`visuals.js:387-397`) | C, D, E, F rows from −116 to +112 every 2.6 m at deck + 1.2; B windows −88 to +74 every 2.4 m at ±13.65 | B deck's windows from −92.2 to +75.4; D deck's saloon sidelights in groups of six and four between +17 and −17; counts NOT FOUND | extend B's row; group D's saloon lights | [read], [bet] |
| Hull colours (`app.js:341-342`) | red below z 10.3, black above, gold line at the hull's top − 0.25 m | antifouling line straight amidships and rising toward the ends (z NOT FOUND); black to B deck; yellow sheer line at the top of the black | a curved antifouling edge [bet]; the gold line is right | [read] shape |
| Sheer (`core/core.js:40-41, 64-67`, used by every drawn deck) | one curve from x = 0: 3.9 m at the FP, 1.9 m at the AP | C deck and above: from a low point at x −24.3, +3.52 m at the FP and +1.13 m at the AP (above amidships); D and below +3.97 and +1.43 | report only: the core stands +0.38 (FP), +0.77 (AP), −0.21 (x +43) above the upper decks' curve; draw on `C.deckZ` regardless | [read] |
| Wells (`core/core.js:51-52`, the hull's top in `zTopAt`) | forward [+76.9, +92.0], aft [−106.0, −90.8] | forward [+75.4, +91.6], aft [−106.1, −92.2] | report only (the core's top-deck weirs and the drawn hull use them): the B deck's front 1.5 m too far forward, its aft end 1.4 m too far aft | [read in Mengot], [derived] |
| Moulded breadth (`core/core.js:33`) | `G.B` 92.5 ft | 92 ft moulded, 92 ft 6 in extreme (over the butt laps of strake M, frames 1F-12F) | report only (from the partial note, checked: Read, extreme breadth article) | [read] |
| Night look and director (`site/parts/20_night_scene.js:79, 311, 343-346`; `site/app.js:1746-1751`, `:2671`) | take `TitanicApp.deckhouses` by name; colour by `userData.solid` (funnel 0xc78a3d, mast 0xc9a46a, cap 0x111111, white); every face needs `emissive` | | the new meshes must keep the contract | [read in the partial note] for 79, 311, 343-346 and 1746-1751; [read] 2671 |

## 8. Conflicts between sources

1. **Frame 0 (0.46 m on every davit and boat).** For no frame at amidships (frame nF at (n − ½) × 3 ft): R. Mengot, "Titanic's Blueprints" ("There is no 'frame 0', just two 'frame 1s'"), Read's load line article (the mark "centered between frames 1A and 1F"), Read's breadth article (frames 1F-12F lie between stations 13 and 14, that is within 35.4 ft of amidships), and the BWC's bulkhead distances, which all fall half a foot above (n − ½) × 3 ft for whole frames (E 60F 246.5 ft, F 41F 303.5, G 22F 360.5, H 3F 417.5, J 18A 477.5, K 30A 513.5, L 53A 582.5, M 72A 639.5, N 93A 702.5, D 78F 192.5, against the BWC's 247, 304, 361, 418, 478, 514, 583, 640, 703, 193), as rounding would put them. For a frame at amidships: Read's sheer article puts 79.7 ft aft "between frames 26A-27A", and an Encyclopedia Titanica thread speaks of an unnumbered middle frame [search summary]. With n × 3 ft the BWC distances would all be exactly 1 ft short, which rounding does not explain. The ET plan's davits fit a little better with a frame 0 (rms 0.30 against 0.39 m), but its funnel 3 then sits 0.36 m from the profile's instead of 0.02 m (funnel 2 is 0.32 m off either way). I took no frame 0. The other convention is in every davit and boat row as "alt" (section 3.1).
2. **Funnel 4's station.** The earlier draft had −50.5; the ET profile gives −52.0 to −52.6 by two methods, and the spacing (35.6, 35.6, 36.0) supports it. Funnel 3: the plan −16.07, the profile −16.23 (top) and −17.02 (edges): ±0.5 m.
3. **Mast heights.** The ET profile puts both mast tops at z 69.1 (227 ft above the keel). The Shipbuilder's "205ft. above the average draught line" gives 235 ft (71.6) if that line is the rigging plan's 30-ft waterline (Read, funnel heights article) and 239.6 ft (73.0) at 34 ft 7 in. The thin teak poles may be lost at the top of the downscaled profile; I give 69.1 as drawn and 71.6 as the better reading of the text [bet].
4. **Crow's nest.** The profile's cage floor z 35.2 against the BWC's "about 95 ft. above the waterline" (z 39.4 at the design waterline, 38.3 at the night's forward draft of 30 ft 9 in): 3 to 4 m. The viewer's 29.0 m above the night's waterline follows the BWC; the profile's box (on the mast line, below the hounds) is the only drawing I could measure.
5. **Mast rake.** No text gives it. The profile's mast lines (through the stays' attachment points) give 9.8-10.0°; near-vertical lines from the mastheads in the same drawing are shrouds and halyards, not the masts. The viewer's 0.06 rad matches neither.
6. **The ET profile's sheer.** At mid-length its decks agree with the BWC within 0.25 m, but at the bow its forecastle and C-deck lines stand 1.3-1.4 m below Read's curve and at the stern 0.7 m below. Its heights near the ends (the forecastle, the foremast's foot, the docking bridge) are therefore ±1 m; Read's curve rests on the H&W lines plan and agrees with the BWC's D- and E-deck heights at the ends.
7. **The forecastle and poop.** 125 ft and 105 ft (BWC) against 128 ft and 106 ft (Shipbuilder); the wells "about 50 ft" (BWC) against 53 ft and 46 ft from the frames and lengths (section 4).
8. **The A-deck screen's aft end.** 192 ft from the front gives +14.4; the ET A deck plan's dimension line (taken as the screen) ends at +6.1 at that plan's breadth scale. Neither is a drawing of the screen itself.
9. **Collapsibles.** Titanic's 28 ft × 8 ft 6 in × 3 ft 1 in (the builder's order book) against the BWC's 27 ft 5 in × 8 ft × 3 ft (the Board of Trade's length and Olympic's breadth, per Read).
10. **The aerial.** Four wires in the flat-top (Read, from other 5 kW installations) against The Shipbuilder's "two parallel aerial wires".
11. **The B deck promenade.** The Shipbuilder's enclosed promenade over 400 ft long (30039-30056) is Olympic's; Titanic's B deck ran its staterooms to the side. I found no Titanic-specific source for the windows' pattern.
12. **The partial note's open items, closed.** (a) The Shipbuilder's second funnel passage (23 ft 7 in × 16 ft 7 in, 153 ft above the base line, lines 6999-7023) describes Mauretania (Fig. 57's caption names "Mauretania's" boilers). (b) Its scale conflict on the Commons boat-deck plate (one group 11 frames off) does not occur on the ET Boat deck plan: both groups fit one scale (rms 0.39 m), the cutter's davit apart. (c) Its deck heights "at the lowest point of sheer" equal to the core's: the core's values hold at x = 0 (section 4.1), the low point being 0.09 m lower.
13. **Depth at the low point.** BWC 64 ft 9 in ("top of keel to top of beam") against Read's 64 ft 6 in (keel baseline to the top of the beam on the centreline, midship plan): 3 in, below drawing accuracy.
14. **House heights.** The profile gives funnel 2's house 2.7 m against a gymnasium 9 ft 6 in high inside (≥ 2.9 m outside); the officers' house 2.2-2.7 m along its length although its roof is level in the drawing. Heights are ±0.3 m.

## 9. NOT FOUND

- The heights of the Boat deck houses from a primary source (all heights here are scaled from the ET profile or derived from room heights).
- The masts' diameters and where the mainmast is stepped; the crow's nest's size; the crow's-nest bell; the masthead light's exact height on Titanic (Halpern's figure is quoted second hand in `site/visuals.js`).
- The A-deck bulwark's height, the open promenade's stanchion spacing, the screen's window count and size.
- The well decks' bulwark height; the forecastle's capstans and windlass heads (count and places); the breakwater's height; the stations of hatches 1, 2, 3, 5, 6 and of the cargo cranes (sizes are read, places are bets).
- The Welin davits' height and outreach; the four electric boat winches' places.
- The cowl ventilators' stations and sizes; the officers' mess and engineers' smoke room as houses.
- The sheer line's width; the antifouling line's absolute heights.
- Side scuttles: counts, spacing, diameters per row; B deck's window pattern on Titanic.
- The gangway doors' and hawse pipes' exact stations.
- The docking bridge's length, breadth and overhang (only "several feet" beyond the sides, a search summary).
- The frame-spacing labels on the ET keel strip (the boundaries were measured; the values 33, 30, 27 in are a reading of a blur).

## 10. For the builder

The same data once more, one block per group, in the ship's frame (x forward of amidships, y to port, z above the keel, metres). `zOn` names the deck a part stands on; the builder computes `C.deckZ(zOn, x) + h`. Confidence: A read or derived from read numbers, B scaled, C bet.

```js
// Boat deck slab and its edge treatment
const BOAT_DECK = {
  x: [-77.8, 72.6], halfBreadth: 14.33, conf: 'A',              // 94 ft; ends B
  aftEdge: { x: -77.8, halfBreadth: 9.8, fullFrom: -73.3, conf: 'B' },
  front: { xCentre: 72.5, xSide: 69.6, shape: 'arc', conf: 'B' },
  camber: 0.076, conf_camber: 'A',
  sides: [
    { x: [-77.8, -31.4], kind: 'rail', h: 1.07, conf: 'A' },
    { x: [-31.4, 24.9], kind: 'bulwark', h: 1.22, conf: 'B' },  // height C
    { x: [24.9, 56.6], kind: 'rail', h: 1.07, conf: 'A' },
    { x: [56.6, 67.1], kind: 'bulwark', h: 1.22, conf: 'A', opening: { x: [57.13, 57.64], top: 1.03, bottom: 0.11 } },
  ],
  expansionJoints: [{ x: 44.1, conf: 'B' }, { x: -25.2, conf: 'B' }],
};

// Deckhouses, casings and raised roofs on the Boat deck: boxes [x0, x1] x [y0, y1], h above C.deckZ('Boat', x)
const BOAT_HOUSES = [
  { id: 'bridgeRoof',     x: [67.8, 72.5],  y: [-4.5, 4.5],   h: 2.4, roofOnly: true, conf: 'C' },
  { id: 'wingCabP',       x: [67.6, 69.6],  y: [12.7, 14.3],  h: 2.4, conf: 'B' },
  { id: 'wingCabS',       x: [67.6, 69.6],  y: [-14.3, -12.7], h: 2.4, conf: 'B' },
  { id: 'wheelhouse',     x: [64.8, 67.8],  y: [-2.95, 2.95], h: 2.4, conf: 'B' },
  { id: 'officersHouse',  x: [36.0, 64.8],  y: [-6.9, 6.9],   h: 2.4, conf: 'B' },
  { id: 'fwdEntrance',    x: [26.3, 35.9],  y: [-8.6, 8.6],   h: 3.9, conf: 'B' },
  { id: 'fwdDomeCover',   x: [27.9, 34.3],  y: [-3.3, 3.3],   h: 3.9 + 1.0, onRoofOf: 'fwdEntrance', conf: 'C' },
  { id: 'funnel2House',   x: [11.9, 26.1],  y: [-3.0, 3.05],  h: 2.7, conf: 'B' },
  { id: 'gymnasium',      x: [11.9, 26.1],  y: [-8.54, -3.0], h: 3.0, conf: 'B' },   // 44 x 18 x 9.5 ft inside: A
  { id: 'readingRoof',    x: [5.1, 17.0],   y: [3.1, 8.9],    h: 1.0, conf: 'B' },
  { id: 'loungeRoof',     x: [-14.1, 5.1],  y: [-8.9, 8.9],   h: 1.0, bays: [[-10.0, -6.2], [-3.6, 0.0]], bayHalfBreadth: 10.0, conf: 'B' },
  { id: 'compassPlatform', x: [0.2, 4.4],   y: [-2.4, 2.4],   h: 4.9, compassZ: 34.2, conf: 'B' },   // compass height A
  { id: 'funnel3Casing',  x: [-23.0, -9.0], y: [-3.0, 3.0],   h: 2.9, conf: 'B' },
  { id: 'engineCasingHouse', x: [-35.0, -26.6], y: [-6.9, 6.9], h: 2.7, conf: 'B' },  // tank room to port, skylight on top
  { id: 'aftDomeCover',   x: [-42.4, -35.1], y: [-3.3, 3.1],  h: 1.1, conf: 'B' },
  { id: 'smokeRoomRoof',  x: [-64.3, -43.9], y: [-8.5, 8.7],  h: 1.0, conf: 'B' },
  { id: 'funnel4Casing',  x: [-56.0, -49.0], y: [-3.0, 3.0],  h: 2.4, conf: 'C' },
  { id: 'kennels',        x: [-62.0, -57.0], y: [-2.0, 2.0],  h: 2.0, conf: 'C' },
  { id: 'secondEntrance', x: [-72.2, -65.3], y: [-2.8, 2.8],  h: 2.3, conf: 'B' },
  { id: 'liftMachinery',  x: [-71.0, -67.0], y: [-2.0, 2.0],  h: 4.6, conf: 'B' },
];

// Funnels: base on the casing top, axis raked aft at 2 in in 12; top cut square to the axis
const FUNNELS = {
  section: [7.47, 5.79], rake: Math.atan(2 / 12), blackTop: 5.64, conf: 'A',
  list: [
    { n: 1, xBase: 54.9,  zBase: 31.0, zTopFwd: 49.89, whistle: 'working', smoke: true,  conf: 'B' },  // zTopFwd A
    { n: 2, xBase: 19.3,  zBase: 30.8, zTopFwd: 50.34, whistle: 'working', smoke: true,  conf: 'B' },
    { n: 3, xBase: -16.3, zBase: 30.8, zTopFwd: 50.34, whistle: 'dummy',   smoke: true,  conf: 'B' },
    { n: 4, xBase: -52.3, zBase: 30.3, zTopFwd: 49.89, whistle: 'dummy',   smoke: false, conf: 'B' },
  ],
  // derived: top centre = (xBase - (zTopFwd - 0.61 - zBase) * tan(rake), zTopFwd - 0.61): (51.9, 49.28), (16.1, 49.73), (-19.5, 49.73), (-55.5, 49.28)
  escapePipes: { fwdDiameter: 0.43, aftDiameter: 0.38, conf: 'A' },
  shrouds: { perSide: 6, from: 'foot of the black top', conf: 'A' },
};

// Masts, crow's nest, lights: points in the ship's frame
const MASTS = {
  rake: Math.atan(2 / 12), conf_rake: 'C',
  fore: { foot: [95.0, 0, 'B:fcsle'], hounds: [90.9, 0, 47.5], middle: [89.7, 0, 56.4], upper: [88.3, 0, 65.2], top: [87.4, 0, 69.1], conf: 'B' },
  main: { atA: [-87.4, 0, 'A'], hounds: [-91.0, 0, 47.9], middle: [-89.4, 0, 55.6], upper: [-86.0, 0, 65.6], top: [-94.9, 0, 69.1], conf: 'B' },
  topAlt: 71.6,                                   // The Shipbuilder's 205 ft above a 30-ft line: C
  diameter: { deck: 0.9, hounds: 0.6, pole: 0.28, conf: 'C' },
  crowsNest: { x: 93.4, y: 0, floor: 35.2, rim: 37.1, bwcZ: 39.4, diameter: 1.5, conf: 'B' },
  mastheadLight: { x: 90.0, y: 0, z: 54.6, conf: 'B' },
  sideLights: { x: 68.6, y: 14.4, h: 1.6, zOn: 'Boat', conf: 'B' },
  derrick: { heel: [94.0, 0, 25.1], head: [79.2, 0, 37.1], conf: 'B' },
};

// Davits and boats (no frame 0; add 0.457 m away from amidships for the other convention)
const DAVITS_X = [65.72, 55.70, 45.39, 35.07, 24.99, -31.39, -41.74, -51.84, -61.89, -72.13];   // A, both sides
const BOATS = [
  { id: '1',  side: 'S', x: 60.71, y: -15.4, keel: 0.2, dim: [7.67, 2.18, 0.91], swungOut: true, conf: 'A' },  // y B, keel C; 2.18 or 2.16 broad
  { id: '2',  side: 'P', x: 60.71, y: 15.4,  keel: 0.2, dim: [7.67, 2.16, 0.91], swungOut: true, conf: 'A' },  // (the BWC does not say which)
  { id: '3',  side: 'S', x: 50.55, y: -12.7, keel: 0.4, dim: [9.14, 2.77, 1.22], conf: 'A' },
  { id: '4',  side: 'P', x: 50.55, y: 12.7,  keel: 0.4, dim: [9.14, 2.77, 1.22], conf: 'A' },
  { id: '5',  side: 'S', x: 40.23, y: -12.7, keel: 0.4, dim: [9.14, 2.77, 1.22], conf: 'A' },
  { id: '6',  side: 'P', x: 40.23, y: 12.7,  keel: 0.4, dim: [9.14, 2.77, 1.22], conf: 'A' },
  { id: '7',  side: 'S', x: 30.03, y: -12.7, keel: 0.4, dim: [9.14, 2.77, 1.22], conf: 'A' },
  { id: '8',  side: 'P', x: 30.03, y: 12.7,  keel: 0.4, dim: [9.14, 2.77, 1.22], conf: 'A' },
  { id: '9',  side: 'S', x: -36.56, y: -14.0, keel: 0.4, dim: [9.14, 2.77, 1.22], conf: 'A' },  // y: outboard position at sea
  { id: '10', side: 'P', x: -36.56, y: 14.0,  keel: 0.4, dim: [9.14, 2.77, 1.22], conf: 'A' },
  { id: '11', side: 'S', x: -46.79, y: -14.0, keel: 0.4, dim: [9.14, 2.77, 1.22], conf: 'A' },
  { id: '12', side: 'P', x: -46.79, y: 14.0,  keel: 0.4, dim: [9.14, 2.77, 1.22], conf: 'A' },
  { id: '13', side: 'S', x: -56.87, y: -14.0, keel: 0.4, dim: [9.14, 2.77, 1.22], conf: 'A' },
  { id: '14', side: 'P', x: -56.87, y: 14.0,  keel: 0.4, dim: [9.14, 2.77, 1.22], conf: 'A' },
  { id: '15', side: 'S', x: -67.01, y: -14.0, keel: 0.4, dim: [9.14, 2.77, 1.22], conf: 'A' },
  { id: '16', side: 'P', x: -67.01, y: 14.0,  keel: 0.4, dim: [9.14, 2.77, 1.22], conf: 'A' },
  { id: 'C',  side: 'S', x: 60.7, y: -12.4, keel: 0.0, folded: true, dim: [8.53, 2.59, 0.94], conf: 'B' },
  { id: 'D',  side: 'P', x: 60.7, y: 12.4,  keel: 0.0, folded: true, dim: [8.53, 2.59, 0.94], conf: 'B' },
  { id: 'A',  side: 'S', x: 55.0, y: -5.3, zOn: 'officersHouse roof', folded: true, dim: [8.53, 2.59, 0.94], conf: 'C' },
  { id: 'B',  side: 'P', x: 55.0, y: 5.3,  zOn: 'officersHouse roof', folded: true, dim: [8.53, 2.59, 0.94], conf: 'C' },
];
const DAVIT = { footprintInboard: 2.0, head: 3.0, outreach: 1.7, conf: 'C' };

// Deck edges and the open decks (x ranges; zOn names the deck)
const DECKS = {
  forecastle: { x: [91.6, 130.6], zOn: 'B', rail: { h: 1.07, bars: 5 }, conf: 'A' },
  forwardWell: { x: [75.4, 91.6], zOn: 'C', bulwarkH: 1.15, conf: 'A' },          // bulwark C
  bDeck: { x: [-92.2, 75.4], zOn: 'B', sides: 'flush, windows', conf: 'A' },
  aDeck: { x: [-77.8, 72.9], halfBreadth: 14.33, zOn: 'A', conf: 'B' },
  aDeckHouse: { halfBreadth: [3.7, 11.0], aftEnd: -73.4, conf: 'C' },              // widths A, outline C
  aScreen: { x: [14.4, 72.9], conf: 'B' },                                          // length A, aft end +-4 m
  aOpen: { x: [-77.8, 14.4], bulwarkH: 1.15, stanchionPitch: 2.74, conf: 'C' },
  afterWell: { x: [-106.1, -92.2], zOn: 'C', conf: 'A' },
  cDeckSecondPromenade: { x: [-92.2, -66.6], zOn: 'C', slidingWindows: true, conf: 'C' },
  poop: { x: [-138.3, -106.1], zOn: 'B', rail: { h: 1.07 }, conf: 'A' },
  dockingBridge: { x: [-127.0, -125.6], hAbovePoop: 2.0, overhang: 1.0, conf: 'B' },  // overhang C
  hatches: [   // [x0, x1], half-breadth, coaming 0.76 m, corner radius 0.30 m; sizes A, places C
    { n: 1, x: [106.2, 109.8], hb: 2.13, zOn: 'B', steelCover: true },
    { n: 2, x: [84.5, 89.5], hb: 3.05, zOn: 'C' },
    { n: 3, x: [78.7, 82.4], hb: 3.05, zOn: 'C' },
    { n: '4P', x: [-92.2, -90.2], y: [11.0, 13.74], zOn: 'B', white: true },
    { n: '4S', x: [-92.2, -90.2], y: [-13.74, -11.0], zOn: 'B', white: true },
    { n: 5, x: [-95.9, -92.2], hb: 2.74, zOn: 'C' },
    { n: 6, x: [-103.6, -100.5], hb: 2.74, zOn: 'C' },
  ],
  cranes: [   // C: places; capacities A
    { x: 80.0, y: 5.5, t: 2.5 }, { x: 80.0, y: -5.5, t: 2.5 },
    { x: -92.0, y: 5.5, t: 2.5 }, { x: -92.0, y: -5.5, t: 2.5 }, { x: -106.0, y: 5.5, t: 2.5 }, { x: -106.0, y: -5.5, t: 2.5 },
    { x: -76.0, y: 11.5, t: 1.5, zOn: 'A' }, { x: -76.0, y: -11.5, t: 1.5, zOn: 'A' },
  ],
};

// Rows of ports and windows (C: spacings and counts were not found)
const PORT_ROWS = [
  { deck: 'B', kind: 'square windows', x: [-92.2, 75.4], hAboveDeck: 1.4, pitch: 2.4, conf: 'C' },
  { deck: 'C', kind: 'round', x: [-116, 112], hAboveDeck: 1.2, pitch: 2.6, conf: 'C' },
  { deck: 'D', kind: 'round', x: [-116, 112], hAboveDeck: 1.2, pitch: 2.6, saloonGroups: { x: [-17, 17], pattern: [6, 4] }, conf: 'C' },  // groups A
  { deck: 'E', kind: 'round', x: [-116, 112], hAboveDeck: 1.2, pitch: 2.6, conf: 'C' },
  { deck: 'F', kind: 'round', x: [-116, 112], hAboveDeck: 1.2, pitch: 2.6, conf: 'C' },
  { deck: 'A', kind: 'screen windows', x: [14.4, 72.9], hAboveDeck: 1.2, pitch: 2.5, conf: 'C' },
];
```

Counts by confidence, over the parts in these blocks (each object by its main tag, counting each of the ten davits, seven hatches and eight cranes once; an entry tagged A may carry a B or C member, as the comments say): **A 39, B 36, C 33.** The numbers that most need a primary source before the build trusts them: the house heights (B), the masts' tops and rake (B and C), the A-deck screen's after end (B), and everything on the forecastle and in the wells (C).

## Sources

- British Wreck Commissioner's Inquiry, Report: "Description of the Ship", "Detailed Description" (Structure; Decks and Accommodation; Life-saving Appliances), Titanic Inquiry Project, titanicinquiry.org (`C:\temp\titanic-topsides-scratch\bot_botRepTitanic.txt`, `bot_botRepStructure.txt`, `bot_botRepAccomo.txt`, `bot_botRepLSApp.txt`).
- The Shipbuilder, special number "The White Star Liners Olympic and Titanic", 1911, OCR (`C:\temp\titanic-topsides-scratch\shipbuilder.txt`): lines 22560-22660 (structure, frames), 22838-22876 (decks 94 ft, camber), 24382-24395 (funnels), 26020-26050 (whistles, ventilation), 26560-26611 (staircases), 27254-27340 and 27605 (lounge, reading room, smoke room, verandahs), 28789-28800 (gymnasium), 30034-30074 (promenades), 32241-32378 (wireless, cargo, masts, bridge), 37515-37541 (anchors), 37650-37713 (davits, winches, compasses, sounding machines).
- Bob Read, D.M.D., articles from titanic-model.com / the Titanic Research and Modeling Association (texts in `C:\temp\titanic-topsides-scratch\pdf\` and the folder's root): "Plotting Titanic's Sheer Curve"; "A New Understanding of the Positions of the Welin Boat Davits"; "What Height Are Titanic's Funnels?"; "Titanic's Funnels: Exterior Details"; "Water Pipes on Titanic's Funnels"; "Titanic's Mystery Whistles"; "Titanic's Standing Rigging"; "External Components of Titanic's Marconi Wireless System"; "Titanic's Boat Deck Waterproofed Wood Roofs"; "The External Appearance of Titanic's Expansion Joints"; "The Discovery of an Opening in the Forward Outboard Boat Deck Bulwarks"; "Procedures to Launch Collapsible Lifeboats on Titanic's Officers' Quarters Roof"; "The Structure and Function of Titanic's 25 ft. Emergency Boats"; "... 30 ft. Main Lifeboats"; "Alternative Fixed Positions for Lifeboats"; "The Difference in the Principal Dimensions of the Engelhardt Collapsible Boats"; "Titanic's Cargo Hatch Covers"; "The Case for a Change in the Color of Titanic's Cargo Hatch Coamings"; "Operation and Control of Titanic's Electric Cargo Cranes"; "Fixed and Removable Railing Sections Around Titanic's Forecastle Deck"; "A Re-Examination of One of Titanic's Ventilators"; "The Coaling Outrigger System of Titanic"; "Support Stanchions Under the Poop Deck"; "Color Guide for the Olympic Class Ships"; "Separation Line Between Titanic's Hull Black Paint and Antifouling Paint"; "Titanic's Load (Plimsoll) Line"; "The Extreme Breadth Measurement of Titanic"; "An Examination of the Color 'Dark Mast'".
- Encyclopedia Titanica deck plans (Boat deck, A deck, B deck, inboard profile), as captured in Bo's screenshots `C:\greenshot\2026-11-19 12_53_26-...png`, `12_53_36-...`, `12_53_46-...`, `12_53_54-...`; colour photograph of the ship leaving Belfast, `C:\greenshot\2026-11-19 12_44_12-...png`.
- R. Mengot, "Titanic's Blueprints" (TRMA), https://wormstedt.com/RoyMengot/TitanicWreck/TRMA/Titanic%27s%20Blueprints%20[Roy%20Mengot]%20db-09.html (frame numbering, 83F, 117A, 95A-102A, the mast hole).
- Wikipedia, "Titanic navigation bridge", https://en.wikipedia.org/wiki/Titanic_navigation_bridge (nine windows in the shelter); TRMA "Structure" page, https://trmaarchive.com/structure.htm; TRMA rigging reference, https://trmaarchive.com/articles/Rigging/Titanic_Rigging_Reference_MainPage.htm (no numbers in its text).
- Search summaries only (not opened): Encyclopedia Titanica threads on frames, boat-deck heights, portholes and the bridge (403); titanicconnections.com on the bridge wing cabs; titanic.fandom.com on the docking bridge (402).
- The repository at `a97a6bd`: `site/app.js`, `site/visuals.js`, `site/parts/20_night_scene.js`, `site/parts/50_boats.js`, `core/core.js`, `core/readers/people.js`; and the partial note `C:\temp\titanic-wt-topsides\docs\research\RESEARCH_topsides_dimensions_v1_2026-11-19.md`.
