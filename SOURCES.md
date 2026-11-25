# Sources and credits

What this simulator takes from each source, and where in the repository it is used. The research notes in
`docs/research/` give the exact passage, page or question for every figure, and tag each as **read** (in the source),
**derived** (arithmetic on read figures) or **bet** (no source: a modelling choice, named as one).

Not every source was read at first hand. Where a work is known to us only through another work, a compilation, a
digest or a press report, its entry here says so, and the notes tag its figures the same way. This page names the
sources the model's numbers rest on; the notes cite more.

This is an independent project. It is not affiliated with any other Titanic project, museum, society or company.

## The 1912 inquiries and the record of the night

- **The British Wreck Commissioner's Inquiry (1912): its transcript and its Report.**
  - The Report:
    - her compartments' lengths and the decks her bulkheads reached;
    - her structure, machinery, pumping arrangements and electrical installation (the watertight doors released by
      electric magnets from the bridge);
    - its account of her end ("Final Effect"): her lights burning almost to the last, and her going at 2:20.
  - The testimony:
    - Wilding of Harland and Wolff:
      - the area of the damage, about 12 square feet, from about 16,000 tons in about 40 minutes (question 20422);
      - her bulkheads' scantlings, the doors and the double bottom, with his depositions of 1915 in the limitation of
        liability case.
    - Barrett: the water in boiler room 6, and the bunker and the rush of water in boiler room 5.
    - Scott and Dillon: the after doors raised by hand. A door fully raised stood "just over 6 feet" (Scott).
    - Symons, Lee, Robinson, Poingdestre, Wheat, Boxhall, Rowe, Dillon, Cavell and Bride: the water at named places
      and times, and her list.
    - Lightoller, Joughin, Dillon, Symons, Ranger and Scott: her last hour, the break and the stern's last minutes.
    - Bride: the wireless.
- **The United States Senate Inquiry (1912): its transcript.**
  - The bridge's night, the wireless (Bride) and the lifeboats.
  - Hichens: the captain read her list on the commutator, 5 degrees to starboard, five to ten minutes after the
    collision (Day 5). His British evidence gives no figure.
  - Pitman: she went at "2.20 exactly, ship's time", by his own watch (Day 4).
  - The stern's last minutes: Evans's "about four or five minutes", Buley's "about five minutes" and Etches's 20
    seconds.
- **How the testimony was read.**
  - In the transcripts at titanicinquiry.org.
  - For much of the break and the stern's last minutes, in Bill Wormstedt's compilation, "The Facts - What Did the
    Survivors See of the Breakup of the Titanic?", which gives each witness's question or page.
  - The notes say which, row by row.
- **What we built from them:**
  - the observation ledger, `RECORD_1912` in `core/scenarios.js` (every row a witness, a source and what was seen);
  - the bridge's orders and their times on the 1912 watch;
  - the reports to the bridge (`core/readers/reports.js`);
  - the doors' schedule (the engineers' doors);
  - the break's band, 2:15 to 2:19:40. It is derived from the witnesses' accounts: nobody timed the break itself;
  - the time she was gone (2:20).
- **The lifeboats:**
  - Wormstedt, Fitch and Behe, with Halpern and Layton, "Titanic: The Lifeboat Launching Sequence Re-Examined" (*The
    Titanic Commutator* No. 155, 2001; revised online to 2023): the launch times;
  - Wormstedt and Fitch, "Titanic Lifeboat Occupancy Totals" (2011): who was in the boats;
  - both for the boats' fit (`tools/calibrate_people.js`).
- **The first-class passengers' staterooms: the Cave list.**
  - It is the White Star Line's printed first-class passenger list for her sailing of 10 April 1912: a "Third Proof",
    with cabin numbers set against the names, found on the body of saloon steward Herbert Cave.
  - The original is held by the Nova Scotia Archives (Medical Examiner, City of Halifax, RG 41 vol. 76 no. 218). It
    was transcribed by hand from the Archives' scan, and checked against the public data set titanic3.
  - It says who was booked into which stateroom when it was printed, not where anyone was that night
    (`data/rooms/occupants_1912.json`).

## Reconstructions and later works

- **Samuel Halpern:**
  - *Lifeboats, Launch Times, List and Trim*, Part II (2023): her trim and list against time, the eyewitness
    reconstruction in the Evidence tab.
  - With Weeks, *Angles of Trim and Heel* (revised 2017): where the witnesses stood along her.
  - *Titanic's Hidden Deck* (2005): her tanks under her rooms, and the double bottom's centre keelson and side
    bulkheads.
  - *Collision Point* (2007): her heading, and the time of the collision.
  - His articles on the ships' clocks, among them "12:35 A.M. Apparent Time Carpathia" (2010): the clocks' offsets
    from New York time.
  - "Where Did That Water Come From?" and "Somewhere About 12 Square Feet": the water in boiler room 4 against the
    pumps, and Wilding's area.
  - *A Matter of Stability and Trim*: Harland and Wolff's hydrostatic figures for her, as he gives them. The notes
    know it through digests, not at first hand.
  - With Weeks, in *Report into the Loss of the SS Titanic: A Centennial Reappraisal* (2011): the tonnage aboard at
    12:25 and her fall to the bed, each through a digest.
- **Hackett and Bedford**, *The Sinking of S.S. Titanic, Investigated by Modern Techniques* (RINA, 1996): the
  flooding's analysis.
  - We know it through Halpern, and through Felkins, Leighly and Jankovic's paper in *JOM* (1998). Its Table I, "A
    Summary of Damaged Areas in Hull by Compartment", gives their opening areas, which are the 1912 damage's split.
  - Her metacentric height on the night, 2 ft 7.5 in, is theirs.
- **Paik, Kim and Thomas**, "The digital reconstruction and resurrection of the RMS Titanic's sinking", *Ships and
  Offshore Structures* (2025):
  - the strength of her riveted joints against her plate's, for her strength along her length;
  - the one finite-element study of a head-on strike, a check on the bow's crushing.
- **The Marine Forensics Panel** of the Society of Naval Architects and Marine Engineers (Garzke, Brown and others),
  "Titanic, The Anatomy of a Disaster" (*SNAME Transactions*, 1997): the midship section's properties, and the bending
  moment the weight curve is fitted to. Known to us through digests and secondary accounts.
- **Roy Mengot**, and Mengot and Woytowich on the break-up: her structure, the bow as it lies and where she parted.
  Partly read, partly through secondary accounts.
- **J. Bernard Walker**, *An Unsinkable Titanic* (1912): her keel, and her doubled plating amidships.
- **Mark Chirnside:** her displacement from the builder's records ("How Much Did Titanic Weigh?"), her screws' blade
  area, and the stress her hull was designed to.
- **Archibald Gracie**, *The Truth about the Titanic* (1913): the forward staircase's last minutes, and no suction as
  she went. **Lawrence Beesley**'s account of 1912: the stern's last minutes, through quotations of it.
- **Californian's distance:**
  - the 1992 reappraisal by the Marine Accident Investigation Branch. Its two inspectors differed: the first held that
    she was within sight of Titanic, and the Deputy Chief Inspector put her 17 to 20 miles off, most likely about 18.
    We know it through press reports and summaries, not the report itself. The model's default is 18 nautical miles;
  - the British Court of 1912: "not more than eight to ten miles". Nine is a setting;
  - the two also disagree about what she could have done, and the model takes no side: its readers move no one from the
    water into a ship.

## Her plans and dimensions

- **Her deck plans.** Her rooms' positions and names were read from the deck plans drawn by Bruce Beveridge for
  *Titanic: The Ship Magnificent* (The History Press, 2008), as published by Encyclopedia Titanica. No drawing is
  reproduced, and any error in the tables is ours.
  - What was taken, for her rooms (`data/rooms/`, 572 rows over nine decks, the orlop to the Boat deck):
    - each room's place, by the frame numbers its walls stand at and their distance from the centreline;
    - its name as the plan labels it;
    - its doors, and where each leads.
  - What was taken, for her openings (`data/rooms/openings.json`, 256 rows): the sidelights, windows and doors in her
    side and in her houses as the plans write them: what kind, what size as printed, and how many.
  - What the flooding model itself uses of that reading, as numbers only:
    - her outer line at her ends on the plans of E, D, C and B deck, which gives her hull its ends above the
      waterline;
    - the openings in her side on D and E deck, which let the sea in there;
    - the widths of the two passages along E deck, where water runs aft over the bulkheads;
    - which watertight doors the plans show. Three the model once had, on F and G deck, are left out because the plans
      show none there.
  - Her fall uses one more: how much of her upper works' sides is open, from the openings on B, A and the Boat deck.
  - What was not taken: no image, no drawing and no part of one, no tracing and no file. The plans were read on the
    page, and nothing was saved. The pictures in `docs/evidence/rooms/` are our tables drawn over the model's own deck
    outline.
  - How far it was checked: 28 rows, all on E deck, against *The Shipbuilder*'s plate of 1911. The other 544 say "not
    checked against an original", because the plates as reproduced were too small to read room by room. Those rest on
    Mr Beveridge's work alone.
  - The rules we read them under are in `docs/research/RESEARCH_rooms_plans_licence_v1_1_2026-11-20.md`. Encyclopedia
    Titanica's terms were read on 2026-11-24; what they mean for this use is in `THIRD_PARTY_NOTICES.md`.
- ***The Shipbuilder***, Midsummer 1911 special number, "The White Star Liners Olympic and Titanic":
  - its deck plates, the 1911 original each room's row is checked against where it could be read;
  - the ventilation, the staircases, the boilers, the forepeak's watertight flat, the electrical equipment and the
    places of her stern gear.
- ***Engineering*:** its number of 27 February 1914, on Britannic (the double bottom's girders), and M. Darrah's
  article of 1 July 1910 on the Welin davit, through a reproduction.
- **Bob Read:**
  - his plan sheets of Olympic (licensed CC BY-NC-ND 4.0): one number measured from them, her stem's half-angle, and
    no drawing copied;
  - his articles on Titanic: the davits, the hatches' sizes, the funnels, the rigging, the domes' weather covers and
    the topsides' dimensions (`site/topsides.js`).
- **Harland and Wolff's hydrostatic figures** for her at two drafts, as Halpern and Wilding give them: the hull
  form's fit (`tools/fit_hull.js`).
- **Lloyd's Register's Rules, 1911-12**, Table 10: the bulkhead stiffeners, for her bulkheads' strength.
- Her midship scantlings: the sources above, gathered in `docs/research/RESEARCH_midship_scantlings_v1_2026-11-19.md`.

## The wreck

The page sets her fall against three numbers from the wreck. Each rests on this:

- **The point under the break** is the centre of the boiler field, the five boilers of boiler room 1 and the wreckage
  round them: Ballard's position from the surveys of 1985 and 1986 (*The Discovery of the Titanic*, 1987, p. 199), as
  Wikipedia's note cites it.
- **The bow, 772 m from that point, her head about north.** Its position is quoted by a fan site that names no source,
  and Britannica gives the same; set against Ballard's boiler field it is 772 m north. No source says which point of the
  bow section the position marks, so our note takes 540 to 950 m as the band. Read it as about 0.8 km.
- **The stern, 148 m from that point.** The same fan site's position, tied to Ballard's through the 1992 reappraisal's
  figure as Halpern quotes it.

The other surveys and studies the notes use:

- **Uchupi, Ballard and Lange**, "Resting in Pieces: New Evidence About Titanic's Final Moments", *Oceanus* 29(3),
  1986: the depth, and five to six minutes for each piece's fall, as Wikipedia cites it. The model's bed is at 3,790 m;
  the sources give 3,772 to 3,810 m.
- **Uchupi, Muck and Ballard**, "The geology of the Titanic site and vicinity", *Deep-Sea Research* (1988): the first
  map of the site.
- **The sonar map of the 2010 expedition**, through the Associated Press's report of it (2012) and NOAA's page of the
  expedition's results: bow and stern about half a mile apart, the wreckage east of the bow, and about 21 m of her
  length broken up between them.
- **Best, Powrie, Hayward and Barton**, "Geotechnical investigation of the 'Titanic' wreck site", *Marine Georesources
  and Geotechnology* 18(4), 2000: the bow's speed at the bed, from how deep it is buried.
- We have not used the full scan of 2022 and 2023.
- Every figure, with its source and its tag: `docs/research/RESEARCH_the_fall_and_the_wreck_v1_2026-11-19.md`.

## Methods

- **The ship's handling:** the MMG method, a hull, rudder and propeller model (Yasukawa and Yoshimura, 2015;
  Yoshimura, Nakao and Ishibashi, 2009), fitted to the Olympic-class trials.
  - Her resistance: its level from Biles's figure at the Hawke inquiry, its shape from Holtrop's method (1984).
  - Her screws: the Wageningen B-series (Bernitsas, Ray and Kinley, 1981) and, turning astern, MARIN's four-quadrant
    data as Roddy, Hess and Faller reprint it (2006).
- **Her bow against the ice:** section-based crushing laws (Amdahl; Minorsky, 1959; Paik and Pedersen; Zhang and
  Pedersen), with Wilding's 80 to 100 feet at full speed beside them.
- **Her wake:** Michell's thin-ship waves (1898) scaled to Holtrop's wave resistance.
  - Her bow wave: the height law of Noblesse, Delhommeau, Guilbaud, Hendrix and Yang (2008).
  - Checked against tank measurements of public hulls: the Series 60 (Kim and Jenkins, 1981), Wigley's hull (Kajitani
    and others, 1983) and KRISO's KCS (Kim, Van and Kim, 2001; that geometry is kept outside this repository).
- **Her strength:** Smith's progressive-collapse method for her ultimate moment; Prohaska's weight curve.
- **Her fall:** Kirchhoff's equations with the added mass summed over her slices (Lamb, *Hydrodynamics*, 1932; Munk,
  1924); the sea's density down the column by UNESCO's equation of state (Fofonoff and Millard, 1983).
- **The model's sine, cosine and the rest:** fdlibm's routines (with V8's own changes), so that every engine gives the
  same bits.

## Credits

- Made by Bo Chen, with Claude (Anthropic) sessions writing and checking the code, the research notes and the guide.
- A companion analysis of the stern's last minutes, by another team of sessions (November 2026), supplied witness rows
  word for word from the transcripts and the sources behind her openings' sizes.
- The arithmetic the notes call "certified" was checked with abacus, Bo's toolkit for exact and enclosed arithmetic.
- The software the page and the app are built with (three.js, the fonts, Electron, the Anthropic SDK) is listed with
  its licences in the third-party notices.

## Licence

MIT (see `LICENSE`). The record's quotations are short, attributed, and from public inquiry transcripts.
