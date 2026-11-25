---
contents: the flooding, the handling, the ice, speed, the wake, the pumps, the readers, her strength, her fall, her as numbers
---

# How the model works, briefly

:::lede
Each piece below is a model with numbers in it. Where a number comes from a source the code names the source; where it
had to be guessed the code says so. This chapter says which is which.
:::

## Flooding

Her hull is a shape fitted to the builder's hydrostatics, cut into 4,852 vertical columns. Every quarter of a second the
model adds up her buoyancy and the water in her over those columns, at the pose she has at that moment, and moves her
as one rigid body in rise, trim and list. Water moves between the 64 spaces and the sea through orifice and weir laws:
through holes, doors and deck openings, and over the tops of the bulkheads. The two halves of an open space share one
water surface.

Above B deck stand the three tiers of her superstructure. They belong to the spaces above E deck, so they hold her up
while they are dry. Their windows, and the entrance doors and domes of the two grand staircases, keep the sea out until
the water on them reaches their strength: about a metre at the sill of a wooden door, a metre and a half on a window,
half a metre on a dome's glazed cover. A dome goes sooner than that, from below: once the doors of its stair hall are
under water, the air shut in under it lifts the cover's panes. On the 1912 damage the first dome gives way at
@@dome.clock@@, minutes before she founders at @@preset.founderClock@@. No survivor saw a dome give way; it is a reconstruction, in the model as in
the paintings and the film.

![A grand staircase's dome given way](img/dome.jpg "The 1912 damage on the step the first of her grand staircases' domes gives way, seen from her quarter; the page's notice names it.")

The flooding model's uncertain inputs are calibrated by a history match against an observation ledger of the 1912
record (chapter @@ch.the-evidence@@): @@ensemble.members@@ sets of them that pass the record's tests are kept, and one
of them (member C) is the model's defaults. The fit is bounded so that it keeps the verdicts the record gives for
Wilding's four and five compartments, Olympic after the Hawke collision and Britannic in 1916, and it held the
reconstructed watch, run on to her foundering, to 150 to 170 minutes after the touch. The inputs it samples include
the total area of the iceberg's damage (@@area.m2@@ m² in member C, about @@area.sqft@@ square feet, shared out over
six compartments as Hackett and Bedford give its openings: 4.8, 11.9, 24.6, 26.2, 22.2 and 10.3 % from the forepeak
aft, in the table of Felkins, Leighly and Jankovic, 1998), two of the water's paths (down through E deck, and through
the deck above once it is under water), the bunker's opening and the head it bears, her stability and her list before
the collision. Its runs of the 1912 night include the pumps as they were worked, and the superstructure with its
windows and staircases. Along E deck, over the bulkheads that stop there, the water runs aft by two passages at
their widths on the deck plans, which a number fitted before the history match, and held by it, multiplies: Scotland
Road to port, 2.24 m between its walls, and the passage to starboard, 1.40 to 1.49 m.

Two spaces hold smaller ones. With her coal list to port, the empty starboard half of boiler room 5's forward bunker
is a pocket of its own: the openings the ice made inside it fill it, its door leaks into the stokehold, and it gives
way once the water in it stands high enough, emptying into boiler room 5, on the 1912 damage about an hour after the
collision. Until then the stokehold's plates stay dry, as the leading stoker Barrett, who was there, told the inquiry.
At her bow, the forepeak's lowest part, from the keel to the orlop deck's watertight flat, is her peak tank, a pocket
that never gives way: the ice's openings there fill it, and the sea rises into the forepeak above only by the tank's
vent, a 4-inch pipe led to G deck (its size is a bet). So the forepeak stays dry for its first minutes, as the
British inquiry's report has it and as the lamp trimmer Hemming found its stores soon after the jar; on the 1912 watch
the tank is full some 22 minutes after the collision, and the water comes up its vent from then on.

Her rooms are not yet part of the flooding. The model can cut each of its 64 spaces at her decks into 250 slabs, one
deck's space in one compartment on one side, and share a space's water out among them by its own rule. Her rooms
themselves are read from Bruce Beveridge's deck plans, as Encyclopedia Titanica publishes them free, into tables of facts, @@rooms.rows@@ rows on all nine decks from
the orlop to the Boat deck, each with its source and its check against a 1912 original where one could be reached
(*The Shipbuilder*'s plates). The flooding does not use them yet, nor does the walk draw them: inside a space her
decks are open floor. The page reads them to find a room and say when the water came to it, and the Cave list of 1912
puts names on the first-class staterooms it booked (chapter @@ch.scenarios-and-what-ifs@@). What the tables find
against the model, such as two of her bulkheads standing a little aft of the model's and her hull too narrow at her
ends above E deck, is the next work for her rooms.

## Handling

A standard manoeuvring model (the MMG model) with her hull, three screws and one rudder. Four numbers are fitted to the
trial record the three sister ships share: Olympic's two points of turn in about 37 seconds, Titanic's turning circle
of 3,850 feet, circles that barely change with speed, and the crash stop of about 3,000 feet, run as the trial was,
with the engines reversed more slowly than usual. Her resistance follows Holtrop's method, and her screws going astern
follow the Wageningen B-series' measurements. The screws' places were measured on a side plan of 1911.

## The iceberg

The berg is a free body of ice. Where her side presses into it, the plating dents against the ice's crushing pressure,
and the riveted seams open once a dent passes a set depth. The opened area is fitted so that the 1912 watch makes the
same opening as the calibrated damage, shared out over her compartments the same way: one fitted factor for each, since
the contact opens every torn metre alike. Head on, her bow crushes at a force that rises with the depth already crushed,
from crushing laws for ship sections. The berg's face stays rigid in a stem strike.

These are the least certain numbers in the simulator: the plating's strength, the berg's mass, the seam gap for each
metre of dent and the crushing force are all guesses with a physical meaning. And the 1912 point grazes the edge of a
stem strike: a metre either way changes the damage a good deal.

Where the tear ends aft is fitted to the record. On the 1912 orders it ends inside boiler room 5's starboard forward
bunker, about two feet abaft the bulkhead, where the British inquiry and the leading stoker Barrett put that room's
damage, and the stokehold's own side stays whole. The rule covers that room's side only and rests on the 1912 record:
on any other night it is a bet. Farther aft, on every night tried, the ice only dents her plating
(`docs/research/RESEARCH_br5_damage_extent_G6_v1_2026-11-20.md`).

## Flooding at speed

While she moves, the sea's level at each hole is raised by the share of her speed that strikes it head on, and near
the stem by her bow wave. Stopped, it adds nothing. The 1912 damage is mostly slits along the flow, so for the night as
it happened speed changes little: about a third of a minute. A bow crushed head on faces the flow, and takes the whole
of it. The shares are guesses: nobody measured the pressures on this hull.

## Her wake

Her wake is the sea's answer to her hull. The hull is a sheet of sources on her centre plane (Michell's thin ship),
driven by her speed, her drift and her turning; the sea answers as linear waves on deep water, each wave travelling at
its own exact speed, in two squares of sea that follow her, about 3 km across for the long waves and 1 km for the
short. Thin-ship theory makes her waves too high, so their heights are scaled until the energy they carry away is what
Holtrop's method, the one her resistance follows, spends on making waves. The white water is laid where that sea is too
steep to stand, off her bows and in her screws' races, and left where it was made. How much each cause makes and how
long it lasts are guesses. The wake reads her motion and feeds nothing back: a watch has the same fingerprint with it as
without.

![Her wake in the X-ray look](img/wake-lines.jpg "From astern in the X-ray look when the encounter on the 1912 orders is over: lines of equal height every quarter of a metre across her waves.")

The method has been run unchanged on three hulls whose waves were measured in tanks. On the KRISO container ship its
waves fall where they were measured, along the hull and in two cuts out to 35 m from its side, at about two-thirds of
their height, and farther out they arrive early. On two hulls without a bulb, the Series 60 and Wigley's, the waves
along the hull are again where they were measured; the Series 60's troughs amidships come out shallower than its
tank's, about 0.6 as deep at her speed. Her bow wave against her plating follows a law: the height Noblesse and others
(2008) give for a stem of her half-angle, 21°, measured on Bob Read's plans of Olympic. It replaced a fixed factor that
no one value could make right (the Series 60 wanted 3.69, Wigley's hull 2.76, her stem about 7), and at full speed it
raises her crest from 3.1 m to 5.7 m. The white water keeps a factor of its own. The notes are
`docs/research/RESULT_k6_kcs_benchmark_v1_1_2026-11-20.md` and the Series 60 and Wigley results beside it.

## The pumps and the doors

The pumps run on steam, at rates from the British inquiry's report, from the bottoms of the rooms with suctions. When
the engineers started them on the night, and which they led where, is a guess for each room. The watertight doors fall
shut over @@doors.fall@@ seconds once released, by the bridge's switch, by their floats or by hand. On the 1912 watch
the engineers raise the doors aft of boiler room 4 by hand, at about the times and for the reasons the British
inquiry heard (chapter @@ch.her-systems@@).

## The readers of the night

The boats, the reports, help and the hull gauge are readers: modules that read the watch after each step of the model
and keep an account of their own beside it. None writes into the flooding, the motion, the ice or the plant, so a
watch has the same fingerprint with every reader and with none, and the repository's suites hold each of them to that.

- **The boats** move places and minutes, fitted to the launch record of 1912 with @@boats.fitted@@ numbers: how readily
  people came forward below and above a trim of about @@boats.jumpTrim@@ degrees, and the minutes a party gives a boat before it lowers
  her. The hands' rates are the record's; the rest are named guesses.
- **The reports** follow rules: who could see a fact of the model, from where, and how long his news took to reach the
  bridge. One constant is fitted, to the builder's man's estimate of an hour to an hour and a half.
- **Help** places the other ships where the research found them, with their speeds, their operators' hours and the time
  each took to get under way. The wireless is a load on her plant: it needs the dynamos, or the battery.
- **The hull gauge** weighs her along her length, layer by layer, to the model's own mass and centre, and takes the
  bending moment of her hull at the pose and the water of the moment. Her hull's own steel is laid out as Prohaska's
  trapezoid, its ends at 0.66 of her mean weight per metre and its middle third at 1.17. That is its one fitted number,
  fitted to the Marine Forensics Panel's bending moment of 4.64 GN m with 35,000 t of water aboard. It was refitted
  once: when her ends above E deck were restored, and her water came to be weighed as the model's own loads weigh it.
  The 0.40 before had stood in for the buoyancy her missing ends would have given. Her fall weighs its two pieces by the
  same curve. The range it is read against is the studies'.
  Beside it the onset holds the gauge's bending and shear at every station against her strength there (below), and
  marks the first step at which, somewhere along her, the two together reach it. On a watch that step is her end: the
  night hands her to her fall there. The mark itself writes nothing into the model.

## Her strength along her length

What her hull could bear is worked out from her cross-section at each station: the keel and the bottom, the side
plating, the double bottom, and B and C decks, which carried her strength, each plate with its thickness and each
riveted joint with its strength, from the sources the code names (Mengot, Walker in 1912, Halpern, Wilding, the Marine
Forensics Panel, among others), with the funnels' uptakes cut out of the decks. Smith's method of progressive collapse
then bends the section further and further, adding up what each plate still carries, until the whole gives way.
Amidships her hull could bear about 5.3 GN m with her ends bending down, inside the studies' range, and its bottom
gives way first. One figure no source gives, C deck's plating against B deck's, is fitted to the panel's section;
nothing was fitted to her strength itself.

## Her fall to the bed

On a watch the fall takes over from the flooding model at the onset, where she breaks, and her hull is cut clean in two
at the onset's station (how it tore is not modelled). On a damage preset, and on a watch handed over at the flag (a
what-if), it takes over at the flag, and her hull is cut over boiler room 1 (a rule for now). Each piece is a rigid
body built from the model's own slices: its steel, the water in it (the pockets' water with it), and the air still in
it, one pocket that the sea squeezes as it goes down. Since edition 1.12 the fall weighs the water in her peak tank,
some 330 t at her stem, as the flooding model and the hull gauge weigh it, where before it took the tank's room as
solid and left its water out; and each slice's cross-section is the model's whole column profile, where before it was
thinned to about twelve points a side. Handed over where she breaks, nearly upright, the pocket's lift
acts where her air lay then, kept fixed in her as she turns; handed over at the flag, on her beam ends, it acts, slice
by slice, through the middle of the part the sea can fill. Each moves in all six ways a body can, its attitude free to
pass through any angle. The water acts on it slice by slice: the mass of water it must move with it, the drag of the
flow across it and along it, a lift where the flow leaves a torn end, and buoyancy at the density of an April column of
sea, which grows with depth. On the bed the mud bears it up until it lies still. The coefficients come from
experiments and textbooks, each named in the code; the one number the trials fit, where her weight acts along her, is
not used on the page, and the time to the bed is checked against the reconstructions, not fitted to them. So the page
shows what the model computes: on the 1912 orders her bow comes to rest about 1.6 km from the point under the break,
some 0.4 km farther than in edition 1.11, and her stern about 50 m from it, where the wreck's bow lies about 0.8 km
and its stern about 150 m from it.

The engine can also keep the two pieces joined at the break, on a hinge that bends, tears and lets go when the force
across it passes what is left to hold it. That joint is a what-if: no default run uses it, and the page cuts her
clean. A watch hands her to the fall at the onset by default: the night carries the onset's check itself, so the
watch's forecast and every copy of it meet the same onset. Handing a watch over at the flag, as before edition 1.9, is
the what-if (`handover=flag` in the page's address).

## Her as numbers: Blender and Unreal

The model can hand her to another program.

- `node tools/export_ship.js` writes the ship as numbers in one file. It is built from the model's own tables and
  functions and from the drawn ship's, with nothing placed by hand and every source named.
- `node tools/record_night.js 1912 auto` writes a watch, every step of it. Every reader of the watch is attached, as
  the page attaches them, and `--fall` carries it on to the bed.

Both files have a fixed form: two runs give the same bytes. A second viewer then draws what the model computed. Its
look (colours, light) is its own, and marked as such. Blender scripts in the repository do this:

- one builds her hull and topsides from the export and checks them against it (U1);
- another builds the model's 64 spaces as named volumes, each against its capacity;
- a third builds, from a recorded night at three moments after the touch: the water inside her, with the pockets' own
  (the bunker of the fire and the forepeak tank); her lights, each going out when the sea inside its section blows its
  fuses; her steam; and her smoke. It then reads them back (U3).

They need Blender 5.2, so they are not in the gate. The same two files are meant for Unreal.

![Ninety minutes after the touch, square to her side, built in Blender](img/blender-section-t90.jpg "Ninety minutes after the touch, square to her starboard side, as Blender builds her from the recorded 1912 night (U3; the hull a pale ghost, the sea behind her). The water runs from her stem to about her second funnel: 19,129 m³ in 28 spaces. Rows of lights forward burn on under the sea where their sections are still dry inside."){.half}

![The same moment from a boat off her bow, at night](img/blender-night-t90.jpg "The same moment from a boat off her starboard bow, 5 m above the sea at night: her paint and her lights, 3.7° by the head and 5.2° to port."){.half}

Both were rendered on 2026-11-23 in Blender 5.2.3 LTS (EEVEE), from the recorded 1912 night of the calibrated model
(member C, fingerprint 48b71712), by the repository's U3 tools at commit 2a9f79e, with her hull and the drawn ship
carrying her ends, and committed in 4928220. They are not retaken with this edition's pictures. What they show is the
record's; the views, the colours and the light are appearance.

## Same night, same result

The model steps a quarter of a second at a time and adds its sums in a fixed order, so a night replays bit for bit on
the same JavaScript engine. It computes its own sine and cosine, exponential and logarithms, tangent and arc tangents,
hyperbolic tangent, arc sine and arc cosine, cube root and the length of a vector: fdlibm's routines (V8's for the
length) in plain arithmetic, the same in every engine that keeps the IEEE 754 standard and equal to Node's on every
value tried. So a browser reckons the night as Node does: in the repository's test the page in Edge reaches the end
of the 1912 encounter with Node's own fingerprint, and her fall to the bed takes the model's own functions as well. The
power function is the exception, which the model still takes from the engine because changing it moves the
calibration. Where two engines part, they part in the last digit, and the night can carry it: a
change in the last bit moves the 1912 damage's foundering by up to @@val.titanic.noise@@ s (the validation table
prints that floor). The forecast after the ice is
a copy of the watch run on, so it gives the watch's own end. Her fall to the bed is reckoned the same way:
the same hand-over gives the same fall, bit for bit.

:::note Where it is least certain
The ice: its crushing pressure over a large area of contact, its mass, the plating's strength, and the 1912 point
itself. Then the list late in the night, which the model does not reproduce. Then the engineers' practice with the
pumps, and how readily people came forward to the boats. Then her fall: the air in her pieces, and the moment and the
pose in which they are let go. Every guess is marked [bet] in the code, with its reasoning in
the research notes under `docs/research/`.
:::
