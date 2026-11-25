# BRAINSTORM: the whole night, v1: the two hours and forty minutes after the ice, played, and then searched

- **Written:** 2026-11-17, 16:20 to 16:46 CST, session bbb32357 (Claude Code desktop, Fable 5.2), at Bo's word of 15:44 CST:
  "go, start step 0 and the brainstorm note, also keep doing some implementation and dev if you can ... making more
  progress and focusing on all aspects of titanic to make it more immersive and alive as a simulator".
- **Status:** advice only; nothing here is a decision. What was built the same afternoon is in `CHANGELOG.md`; section 12
  says which lanes were running when this was written.
- **Lineage:** `BRAINSTORM_ship_under_way_v1_2026-11-16.md` (its section 8, "What this opens up") and `v1_1` (the last row of
  its loop: "Aftermath: the player keeps the bridge"); `HANDOFF.md` sections 4 (the physics still missing) and 7 (the
  Carpathia question); six research notes of this afternoon, each written by a research subagent of this session and
  named in section 13.
- **Tags** as in the earlier brainstorms: [measured] run today; [read] in a source or a research note that cites one;
  [derived] arithmetic on those; [bet] judgement, no source.

## 0. The answer in one paragraph

The minute before the ice is played now: the damage is whatever the player's orders and the ice make of each other.
The two hours and forty minutes after it are still mostly watched. Three things are missing, and they are one piece of
work. **The moves:** her officers and engineers had pumps to direct, doors to raise and drop, tanks to flood, boats to
lower, a wireless, rockets, and engines that still turned; today the player has the doors, the telegraph and one order
to the stokehold. **A measure:** minutes afloat are not what mattered that night; lives were, and lives hung on the
boats, which hung on her list, her trim, her lights and whether she had way on, all of which the model already
computes. **The answer:** this repository was begun to ask whether any orders could have kept her afloat until
Carpathia came. With every move a logged order, a search can try orders the way a player does and hand back its best
night as a watch anyone can replay. The rule that keeps it honest is the one the ship under way was built on: a new
module either changes no bit of what exists until it is used, or only reads the model; each is fitted to the record,
then checked against what it was not fitted to; every guess is named.

## 1. The night as it stands

| Part of the night | Ship's time | What the player does today | What the model computes | What is missing |
|---|---|---|---|---|
| Before the ice | 11:39 to the touch, about a minute | the wheel, the telegraph | her motion, the lookout's sighting, the contact, the damage | the 1912 point's sensitivity (P3e): a quarter second in reversing the wheel is half an hour of her life [measured today, section 12] |
| The first hour | 11:40 to about 12:40 | the watertight doors, the telegraph, one order to the stokehold | the flooding, the plant, the pumps by the engineers' rules, the sea's pressure at the openings while she moves | the player's pump orders (Y6, being built today), the doors as they were really worked, counter-flooding, her list, and reports in place of knowledge nobody had |
| The boats | about 12:40 to 2:05 | nothing | trim, list, the lights | the boats and the people; the wireless, the rockets, the other ships |
| The end | 2:05 to 2:20 | nothing | a rolling plunge | the break, and the stern's three minutes |
| After | to about 4:10 | nothing | nothing | the boats on a flat sea, and Carpathia |

## 2. The shape of it

### 2.1 One log

"A night is its seed and its orders" (`core/night.js`). Every move added below is one more order type in that log. Three
things follow for nothing. A watch with boats and rockets replays bit for bit, as a watch with helm orders does. A link
carries it: since today the end-of-watch card puts the seed and the orders in the address (`site/parts/40_night_end.js`).
And a search's output is a log, so the best night a search finds is a watch a person can open and watch.

### 2.2 Three kinds of module, three rules

| Kind | Examples | Where | The rule | The proof |
|---|---|---|---|---|
| Physics the flooding feels | pumps, doors, tanks, coal bunkers, the hull girder | `core/core.js`, or behind its seams | neutral until used; a change that moves the 1912 calibration is done on purpose, as one cascade (refit, validation table, sweeps) | the seams gate, the headway reference, the validation table before and after |
| Readers | the boats and the people; the other ships and the wireless; the reports to the bridge; the hull girder's gauge | new files in `core/readers/`, each registering itself with `core/night.js` (attached to every watch, stepped after the model, owning its own order types in the log); their state in `sim.people`, `sim.world`, `sim.reports` | they read the model every step and never write into the flooding, the motion, the ice or the plant | a watch has one fingerprint with them and without, as `tools/systems_tests.js` shows for an intact plant |
| Appearance | the night look, the eyes, the sounds, the card | `site/parts/*.js` | they draw and sound what the model says; what is theirs is marked [appearance] | each part's own browser suite, and the watch's fingerprint in the page |

One exception to "readers never write" is named now so that it is a decision and not an accident: a boat lowered takes
its people's weight off the ship. Seven hundred people are about 50 t [derived: 75 kg each], against some 49,000 t; the
model leaves it out, and says so.

### 2.3 Truth and knowledge

The readouts at the top of the screen show tons of water aboard and tons a minute coming in. Nobody on that bridge ever
knew either number. What they knew came up the stairs on foot: an officer sent to look, who at first found nothing; the
carpenter; a mail clerk; the ship's own designer with a figure in his head [read: the bridge note; nothing on the
bridge measured water, and no report from the engine room is on record that was not asked for]. The model can do the
same thing honestly, because it has the truth to
report from: a **report** is a fact of the model (water over the plates in boiler room 6), noticed by someone who was
placed to notice it, and carried to the bridge in the time that took. Two views of one night, then: the instrument's
(X-ray, every number, as today) and the bridge's (what has been seen, sounded and reported, late and partial). The
player chooses; the search always works from the truth. Section 7 has the build.

### 2.4 Time

The first minute runs in real time. The rest cannot: at her own pace it is two hours and forty minutes. Today the
player picks a speed and events flash past. Better: the night comes to the player. The clock runs fast between events
and slows to her own pace, or stops, when a report reaches the bridge or an order falls due. The frame loop can stop on
an exact step since today (the parts' `step` hook), so this needs no change to the model.

## 3. The aftermath as orders

Each is one more order in the watch's log. With none given, nothing changes, to the bit.

| Order | What it does in the model | Who carries it out, and what it needs | Facts | State |
|---|---|---|---|---|
| The pumps (Y6) | puts named pumps on a room, takes them off, or hands them back to the engineers' rules | the engineers: a room's own pump within minutes, a pump led through the main after the time to rig it; steam; each room's suctions | the pumps note | being built (section 12) |
| The doors as they were worked | the 1912 night gains its own schedule [read]: all twelve dropped within half a minute of the bridge's switch; G, H, J and K raised by hand from about 30 minutes for the engineers; L to O at 60 to 65 for the suction pipe; none shut again; D, E and F never raised | hands at each door: a lever to drop it, four or five minutes at a pump handle to raise it, and the bridge's switch off | the tanks-and-doors note (its door table); the plant note, section 7 | the order types exist (Y2); the schedule is data to add, and it will move the 1912 calibration a little |
| The gangway door | a timed opening forward on the port side: the door men were sent to open so that boats could load from it. Which door it was, and whether it was ever opened, is in dispute (section 4.2) | a boatswain's party, ten to twenty minutes [bet there] | `HANDOFF.md` 4b; the lists note | the core has taken timed openings since October |
| A tank | floods a ballast tank or pumps it out: counter-flooding aft to bring her head up, or to one side to hold her upright for the boats | the engineers: the tanks fill by gravity through the ten-inch ballast main and are emptied by the five 250-ton pumps; the forward tanks' valves stood in the firemen's passage and were under water in five minutes [read] | the tanks-and-doors note (its tank table) | new |
| The engines after the ice | exists; P5 gave it a price in minutes of her life | | | built |
| The stokehold | "draw the fires" exists. To add: keep steam for the dynamos and the pumps as long as possible, which is what her engineers did | | | built in part |

**How the core takes a tank.** A tank is not a flooded space: it has a fixed capacity and no path onward. The core's
seams already take an outside force and two moments every step (`sim.xFz`, `sim.xMth`, `sim.xMph`; the ship under way
uses them for her heel in a turn). A tank's water is the same thing, a weight at a place, added to those seams by the
plant. The seams gate holds it: with every tank as it stood on the night, nothing changes.

**What a tank is worth, before any is built** (`docs/research/RESEARCH_tanks_counterflooding_door_schedule_v1_2026-11-17.md`):

- She carried 5,754 long tons of water ballast in forty-four double-bottom tanks and the two peaks [read: Wilding's
  sworn total, and a tank-by-tank table that sums to it]. The after peak holds 115 tons. `HANDOFF.md` section 7
  supposed about 800: wrong by a factor of seven.
- About an hour from the order to 800 tons in the after tanks, by gravity [derived there].
- By the note's arithmetic, every ton that could be put aft lifts her forefoot about 0.2 m and moves the tops of the
  bulkheads that decided the night by centimetres [derived there, with assumed hydrostatics; the model will give its
  own]. Counter-flooding aft buys next to nothing. One published claim of four hours and more rests on an abstract
  nobody here could open.
- The one tank order that pays is against the list: some 490 tons in the starboard wing tanks rights 8° to 12°, if
  ordered by about 65 minutes [derived there]. That is an order for the boats' sake, and the model cannot test it until
  it has the list (section 4.2).
- Nothing of the kind was tried on the night: no witness and no report mentions ballast [read, as an absence].

So tanks are worth building for two reasons, neither of them minutes afloat: to let the model say plainly that
counter-flooding aft would not have saved her, and for the list.

What the search makes of these orders is section 8's business. What the player makes of them is the first hour of
the night as an engineer had it: where to put 1,700 tons an hour, which doors to give up, and whether her head can be
held up long enough to matter.

## 4. Her last physics: the lists and the break

Two gaps the README has named since October. Both move the oracle, so each is its own calibration cascade.

### 4.1 The break

Facts: `docs/research/RESEARCH_breakup_hull_girder_v1_2026-11-17.md`.

- **That she broke**, where, and when [read]: fourteen survivors said so and four denied it; both inquiries believed
  the four; the wreck settled it. Centred in boiler room 1, between bulkheads J and K: x = -23 m in the model's frame
  (-16 to -27). At 2:17 to 2:18 and a half; the stern gone at 2:20, by Pitman's watch.
- **At what trim** [read, and contested]: 10° to 15° in two studies, 14.35° at 158.6 minutes in the 2025 simulation,
  about 17° for the forensic panel's later work, 23° in one study of 2012. Whether the deck parted first or the
  bottom buckled first is argued too.
- **What she could bear** [derived there]: about 4.6 GN m in hogging at that station, between 4.0 and 5.4. The upper
  end is firm in logic: she broke, so her capacity was below the largest moment any study has computed for her.

The model does not have to take a side on the mechanism. It needs a moment and a capacity.

**What it has:** her buoyancy on every column at her actual pose, every quarter second, and the water in every
space. **What it lacks:** her weight along her length. None is published. The note builds one: the machinery by room
from the boiler counts and the engines' weights [read], the rest a standard trapezoid closed to the model's own mass
and centre [bet].

**Step 7a, the gauge** (`core/readers/girder.js`, a library of pure functions that works on any run, a damage preset
as well as a watch): buoyancy less weight less flood water, per metre, summed twice
along her length; the hogging moment at the break station, as a share of what she could bear. A gauge on the screen
that climbs through the night. It needs no fitting, and it answers at once a question the studies disagree on: in this
model, at what trim does the moment peak?

**Step 7b, the break:** an event when the moment at the station passes the capacity. After it the bow is gone from
the sums and the stern is a body of its own: its mass, centre and inertia from the weight curve aft of the station
with the water it holds, and one new opening the size of her section at its forward end. The core then runs on as it
always has, until the stern founders. The record gives it two times to meet where the model has one today: the break
at 157 to 158.6 minutes and the end at 160 (`core/scenarios.js` already holds both, `breakup: 157` and `founder: 160`).
One new fitted number, the capacity, held inside its range. The plant's `breakTrimDeg` (the steam mains giving way
past 20° of trim, a bet) becomes the event itself.

**Seen and heard** [read]: the stern settling back, rising, hanging, going; a crash, then two to four sharp reports,
then a roar of fifteen to twenty seconds. From the boat's eye.

### 4.2 The lists

Facts: `docs/research/RESEARCH_lists_bunkers_scotland_road_v1_2026-11-17.md`.

**The record** [read there; its section 9.1 has the table]: a slight list to port before the collision (coal taken from
the starboard side of a bunker that had been on fire; the model's 2° fits); 5° to starboard on the captain's own
indicator some minutes after it; upright at about 90 to 105 minutes; then to port, "about six degrees" by a witness at
120 minutes, heavy in the last quarter hour with no figure from anyone who was there. The 10° and 15° usually quoted
for the end are a modern reconstruction's, which the note could not open. The model gives 2° to 6° to port throughout.

| Minutes after the collision | List the note proposes to fit | How well held |
|---|---|---|
| before | 2° port | low to medium |
| 10 | 5° starboard | medium |
| 80 | 2° starboard | medium |
| 100 | upright | medium to low |
| 120 | 6° port | medium |
| 130 | 9° port | low to medium |
| 145 | 13° port | low to medium |

**Why, in the builder's own words to the inquiry** [read there]: to starboard first, because the mail room and baggage
room in hold 3 flooded early and cabin partitions held the water back on the port side of G deck; to port later,
because the crew's working alleyway along E deck on the port side was an easy road aft, where the starboard passage
had one stair and a heavy door at its forward end.

**What that asks of the model:**

- **The bunkers** (`HANDOFF.md` 4a): each about 2.7 m long, the ship's breadth, from the tank top to G deck; some 380
  to 450 tons of coal each; permeability 0.40 full of coal [read: the Board of Trade's own figure] and 0.95 empty. The
  forward starboard bunker of boiler room 5 was empty, and the ice opened it. As sub-spaces appended to the core's 64
  (D19), port and starboard, each draining to its boiler room through a door.
- **The paths along E deck:** the port alleyway is 2.6 to 2.7 m wide [read]. The fit today gives the port side an
  effective 8.2 m (3.0 m times the fitted 2.74): three times the corridor. That number was called weakly held when it
  was refitted with the pumps; here is a reason. The starboard passage is narrower and choked by a door [bet there].
- **The gangway door:** which door is itself in dispute (E deck in the officer's evidence of 1912, D deck on the
  wreck). The note proposes testing the E-deck forward port door first: opened at 80 to 95 minutes, meeting the sea
  at about the time she changed sides. The core has taken timed openings since October.

**The cascade:** refit with the trim curve and the list table together. Done when her list is within 2° of the table
at four of its times, the trim fit is no worse, and every validation verdict is kept or its change explained.

**One thing to check before any refit.** The note reports that the witness behind one of the fit's three timeline
events (water coming down a stairway at 12:55, which the fit takes as water over bulkhead F) was, in the transcript,
speaking of a stairway by the racquet court, with the questions about bulkhead D. If so, a target of the October
calibration sits on the wrong bulkhead. It is recorded in `BACKLOG.md` (C1) and must be settled first.

## 5. The people

Facts: `docs/research/RESEARCH_lifeboats_launch_sequence_v1_2026-11-17.md` (its section 11 is written for a program).

### 5.1 What the record gives to fit to

- Twenty boats with 1,178 places: fourteen lifeboats of 65, two cutters of 40, four collapsibles of 47. About 2,200
  aboard; 711 saved [read].
- The order to uncover at about 20 minutes after the collision; fifteen to twenty minutes to uncover a boat and clear
  its falls; the first boat away at 60 minutes, the last from the davits at 145; two collapsibles floated off as the
  boat deck went under at about 155 [read: the re-examined launch sequence, good to about ten minutes a boat].
- 671 people in the eighteen boats lowered, 62 % of their places. The fill was 43 % in the boats of the first half
  hour, 76 % in the middle, 63 % at the end [derived there]. The gear was sound; the boats went part empty because
  people would not get in early, and because the officers feared for the davits (the Court found the fear unfounded).
- Her attitude mattered at the end: a gap of nearly a metre at the last port boats, and a starboard collapsible that
  rubbed down her side taking five minutes over eight metres [read].
- She was stopped within twenty minutes of the collision, so no boat was lowered with way on [read].

### 5.2 The model: seats and minutes, not persons

`core/readers/people.js`, a reader. A boat is a state (covered, cleared, swung out, loading, lowering, away, or lost with
the deck), a place on the boat deck and a number aboard. Teams of hands move between groups of boats, as the officers
did. Each step it reads from the model: the list and the trim (the gap at a port boat is 0.3 m plus the davit's reach
times the sine of the list; a starboard boat bears on the side once the list is enough), the height of that boat's
station above the sea (the drop, and so the minutes to lower at 0.055 m/s by hand), whether the emergency circuit
has light, and her speed through the water. The note gives every rate and names each as read, derived or bet.

What is fitted, and to what: how readily people come to the boats, as a function of her trim (the note's suggestion:
the fill jumped as the trim passed about 3.5°), and the teams' pace, so that the 1912 night gives the recorded launch
times within ten minutes a boat and about 671 in the boats. What is then checked and was not fitted: the drops the
witnesses gave (about 20 m forward at 60 minutes, 3 to 4.5 m at the forward port station at 145), which test the
flooding model's pose from an angle it was never fitted from.

What the player orders, each logged: when to uncover; whether the port side loads "women and children only" or
"first"; how full a boat must be before it is lowered; which group a team works next. What the model refuses and
says why: lowering at more than a few knots; a boat whose station is under water.

What it leaves out, on purpose: persons. Nobody is named or drawn choosing. The model counts places and minutes.

### 5.3 The dependence that orders the build

The model's list late in the night is 2° to 6° where the record has 10° to 15° (`README.md`, "Known gaps"). Only the
last half hour of the boats hangs on that list: three of the eighteen, by the note's table. So the boats need not wait
for the list (step 8 can start before step 6). They read the model's own list from the start, never the record's:
a night other than 1912 has no record to read. The fit is made on what does not depend on the list, and the late port
boats' misfit is reported as what it is, a measure of the list gap that step 6 then has to close.

### 5.4 The measure

Lives, counted three ways and shown together: in boats that got away; aboard when help is alongside (all of them, if
she floats that long, which no 1912 night does); and in the water. For the water the note offers a survival curve with
a time constant of 15 to 20 minutes at that temperature [bet there, on general cold-water tables]; the page should
show the count without dwelling on it.

## 6. Help

Facts: `docs/research/RESEARCH_wireless_rockets_ships_clock_v1_2026-11-17.md` (its section 10 is written for a program).

### 6.1 What the record gives

- **The call** [read]: the captain's order at about 25 minutes; the first distress call at 47 by the clock most
  modern authors use (35 by the British Report's); the corrected position at 57. Her set ran on her own dynamos
  almost to the end and faded in the last quarter of an hour; its battery was never used.
- **Carpathia** [read, derived there]: heard at 57, under way at 60, stopped among the boats at 265. Not the 58 miles
  at 17½ knots of the story: the wreck lies 13 miles from the position sent, so she ran about 46½ miles at a mean of
  about 13.6 knots. Her one operator was about to turn in: a call much after 65 minutes would probably have missed her.
- **Californian** [read]: stopped in the ice to the north, her one operator off watch within minutes of the collision.
  Her officers saw eight white rockets and did not act. How far off she lay is the whole dispute: 8 to 10 miles (the
  Court, 1912) or 17 to 20 (the 1992 reappraisal).
- **The rockets** [read]: about eight of the thirty-six carried, from 66 minutes, one every nine minutes or so.

### 6.2 The model

`core/readers/world.js`, a reader. Each other ship is a place, a speed, an operator's hours and a rule: when she
hears, she turns, and arrives after her distance over her speed. The earth frame the watch already has (the ship's
track, the berg's place) holds them. The wireless is a load on the plant: it works while a dynamo has steam or the
battery is thrown in, and its reach falls with the voltage [bet there]; so a flooded dynamo flat or a stokehold with
no fires silences it, by the same chain that puts her lights out. A rocket is an order; so is the call; so is the
lamp. Seeing a rocket is not answering it: Californian's watch saw all eight.

Fitted to: Carpathia alongside at 265 on the 1912 orders. Then checked: a call so many minutes sooner brings her that
many sooner, and the plant's failure silences the set when the model says the power went.

### 6.3 What it says before anything is built

The note's arithmetic [derived there] sets the size of the task for the search of section 8:

| What is done differently | Carpathia alongside, minutes after the collision | She must stay afloat this much longer than she did |
|---|---|---|
| nothing (1912) | 265 | 105 |
| the call made at once | 213 | 53 |
| the call at once, and five miles made good toward her | 191 | 31 |
| those, and Carpathia at the 17½ knots her captain claimed | 150 | she arrives first |

And for Californian, in the note's words, the dispute about her distance is the whole of the dispute about whether
she could have helped: at 9 miles and acting on the first rocket she is there before the end; at 18 she is not. So
she is a setting, with history as its default (D21).

### 6.4 The hours after

When she is gone the night is not over for the boats. The clock can run on from the boat's eye: the dark, Carpathia's
rockets to the south-east as she comes up, the dawn, the first boat alongside at 4:10 and the last at 8:30 [read: the
lifeboat note]. No model is needed for it beyond the arrival clock; it is the end the night had.

## 7. The night made present

Bo's word for this stage is "immersive and alive". The simulator is an instrument today: an X-ray hull on a grid sea,
seen from outside, with every number on show. That stays; it is how the physics is read. Beside it, the same night as
a person met it. Each item below draws or sounds a number the model already has, or a fact from a research note; what
is neither is marked [appearance] in its file.

| Piece | What the player gets | Rests on | State on 17 November |
|---|---|---|---|
| The end of a watch | when she founders, floats or clears the ice, a card says what happened in plain words; a link replays that watch | the model's own figures; the order log | built (`site/parts/40_night_end.js`) |
| The night look | a second look beside X-ray: a black calm sea, stars to the horizon, a lit ship, a berg that is a dark shape with no white water at its foot | [read] moonless, clear, flat calm; the rest [appearance] | a lane is building it |
| Two eyes | the crow's nest (the lookouts' eye) and a lifeboat lying 300 m off, fixed to the earth while she goes on or goes down | the foremast's place; survivors' accounts | the same lane |
| Sound that follows the model | the wind of her own 22 knots that dies when the engines stop; the sea along her side; the engines; the ice grinding with the contact's force; water coming in; the ship's bell on the half hour | speed, revolutions, contact force, inflow, the ship's clock | a lane is building it |
| Reports to the bridge | the damage learned as it was learned: a line for each report, with who brought it and when; a switch, "As the bridge knew it", that covers every readout nobody on the bridge had | section 2.3; the bridge note's script and delays | a lane is building it (step 3) |
| The routine | the bells, the reliefs at midnight, the quartermaster's repeats of each helm order | the bridge note | the same lane |
| Her hull's stress | a gauge that climbs through the night: the share of what her hull can bear, and where | the break-up note; section 4.1 | a lane is building it (step 7a) |
| The boats | sixteen boats under davits and four collapsibles, where they were; uncovered, swung out, lowered and pulling away as the people model says | the lifeboat note; section 5 | a lane is building it (step 8) |
| Rockets and the lamp | a rocket as an order: the burst, the report, the light on the water; the Morse lamp | the wireless note | proposed (step 9) |
| After she is gone | the clock runs on from the boat's eye: the dark, the boats, Carpathia's rockets to the south-east, the dawn | the wireless note's times | proposed (step 9) |
| Voice | the orders spoken ("Hard a-starboard") and answered | speech in and out, with an offline fallback | later |

Two cautions. The night look and the sounds are judged by eye and ear, and no agent has either: each lane must look at
its own pictures, and Bo listens. And the people of section 5 were real people: the boats are drawn, the count is
given, and nothing is staged for effect.

## 8. The search: the Carpathia question on this laptop

`HANDOFF.md` section 7 put the question: could any orders have kept her afloat until Carpathia was alongside, about
4 h 20 min after the impact, against 2 h 37 min? It planned a tree search on a GPU port. The port (sinksim) now trails
this model by everything built since October, and it is not on this laptop. The question does not need it.

**What a night costs.** [measured today] One whole 1912 watch with its sinking takes 5.4 s in Node on this laptop, 1.7 s
of it the encounter; the damage preset alone sinks in 2.0 s. With eight cores that is about 5,000 nights an hour by
plain replay. A night could also be forked rather than replayed: `core/night.js` says "resuming is replaying", which is
exact but pays for the first minute every time. If the state is plain data (to be checked; the ship's geometry is
shared and stays out of the copy), a deep copy forks a night at any step for nothing. The same copy would give the
page's forecast the watch's own future, plant and pumps and orders included, which is half of what Y6 asks.

**The orders to search.** After the 1912 damage: each of the twelve doors at the tank top, raised or dropped, and when;
which pumps on which room, and when (Y6); which tanks flooded, and when (section 3); the engines ahead or astern, and
for how long (P5 makes that cost or buy minutes); the fires. Later the boats and the wireless (sections 5 and 6).

**The method, cheapest first.** Not a tree search to begin with. The problem has structure, and the Court's finding
that the pumps "could not have prolonged her life appreciably" says most single orders do nothing:

1. One order at a time, at a few moments each: a table of what matters at all. A few hundred nights, minutes.
2. The handful that matter, together: times on a five-minute grid, a beam of the best few kept, then refined to the
   minute. A few thousand nights.
3. Random restarts, to catch what steps 1 and 2 would miss: two orders that help only together.
4. A tree search with the log as its state only if step 3 finds such pairs often.

A budget of 20,000 nights is four hours of this laptop, overnight.

**The score.** First, minutes afloat after the touch (step 5 of section 9). "Afloat" must not reward a capsize or a
dark hulk, so each night also reports her list against time, the minute her lights went out and the minute her
engines stopped. Then lives (step 10): people in boats that got away, and everyone aboard if she floats until help is
alongside.

**Honesty.** The answer hangs on guesses: the doors' sills and areas (`HANDOFF.md` section 6 lists them as the
author's least sure numbers), P5's pressure coefficients, how far each pump could reach. A search finds whatever the
model rewards, its errors included. So a best night is published with its robustness: the same orders run on some
tens of models with each guess moved inside its range, and the table says in how many she still lasts. A night that
wins on one side of a guess only is not a finding, and the note that reports it says so.

**What comes out.** `tools/carpathia.js` writes its best log to `out/` and prints the table. The log opens in the page
from a link like any shared watch. Later a tab sets three nights side by side on one clock: 1912 as it went, the
best night found, and Carpathia's arrival.

**What to expect.** The baseline is 2 h 37 min. With every door left open the model gives 2 h 59 min, with every pump
on every suction and never abandoned 21 minutes more [read: README, validation table]. Section 6.3 gives the targets:
105 minutes more than she had as the night went, 53 if the call had been made at once, 31 if she had also made five
miles toward Carpathia. Flooding control alone is unlikely to find the first; `HANDOFF.md` expected as much and called
the size of the gap "the interesting number". The second and third are within sight of what the doors and pumps are
already worth in this model, and that is new. It is also the reason for the second score: the same search, asked
about lives, has more to work with (the boats left with some 470 places empty [read: the lifeboat note]).

## 9. Build order, each step with its test

Sizes as in `BACKLOG.md`: S like the seams, M like the motion model, L like the watch.

| Step | What | Size | Done when |
|---|---|---|---|
| 0 | Ship what exists: the gate, the viewer's parts, the guide built by script, the end-of-watch card and its link; then the push and the deploy | S | `node tools/gate.js` ends in PASS; the guide's own check passes; the live site has the watch (this last waits on Bo's sign-in) |
| 1 | The player's pump orders (Y6) | S | the backlog row's own test: a logged order that replays bit for bit; the forecast and the watch agreeing on a pumped night |
| 2 | The night look, the two eyes, and sound | M | each part's browser suite; its pictures looked at; Bo has listened |
| 3 | Reports to the bridge, the bridge's view, the routine | M | on the 1912 orders every report in the bridge note's script reaches the bridge within five minutes of the time it has there; with the bridge's view on, no readout shows a number nobody has reported; the watch's fingerprint is unchanged |
| 4 | The aftermath's other orders: the doors as they were worked, the gangway door; the tanks once step 6 has given her a list to correct | M | each replays; with none given nothing changes, to the bit; the 1912 night gains its real door schedule, and the validation table is given before and after |
| 5 | First search: minutes afloat | M | the best log replays in Node and in the page; the one-order table and the robustness table are in a note |
| 6 | The lists: the bunkers and the paths along E deck (a calibration cascade) | L | her list within 2° of the record at four times of the night; the trim fit no worse; every validation verdict kept, or its change explained |
| 7 | The hull girder: a gauge first, then the break and the stern's three minutes (a cascade) | L | at the 1912 attitude the gauge reads a moment inside the range the studies give; on the 1912 run she breaks between 155 and 159 minutes and the stern is gone by 162; no validation case that floats ever breaks |
| 8 | The boats | L | section 5.2's fit (launch times within ten minutes a boat, about 671 in the boats) and its check (the drops) |
| 9 | Help: the wireless, the rockets, the other ships, and the hours after | M | the 1912 night brings Carpathia alongside at her recorded time; a call made so many minutes sooner brings her that many sooner; the wireless falls silent when the plant says it must |
| 10 | Second search: lives; the tab that sets the nights side by side | M | as step 5, on lives |
| 11 | The encounter's edge and the handling's last gaps (P3e with P3d and M5 as one cascade); the pressure table (P5b) once a search starts to steam | M each | their rows in `BACKLOG.md` |
| 12 | One engine everywhere: X1, the port, a WebAssembly core | L | a watch's fingerprint equal in Node, in two browsers and in the port |

Steps 1 and 2 were started the day this was written, and so, once the notes were in, were step 3, step 7's gauge and
step 8 (section 12): none of the three changes any physics, step 3 gives the most life for its size, and step 8 does
not have to wait for step 6 (section 5.3). Step 5 can follow steps 1 and 4 at once.

## 10. Decisions needed (who decides)

The earlier brainstorms' D1 to D15 stand. These are new.

| # | Decision | Who | My recommendation |
|---|---|---|---|
| D16 | Is the night scored in lives as well as minutes? | Bo | Yes. The boats as a reader module fitted to the launch record, its guesses named, its wording plain |
| D17 | Which view does a first watch open in: the instrument's, or the bridge's with reports? | Bo | The instrument's, as now, until the reports are good; then offer the bridge's on the watch's card and let the address carry the choice |
| D18 | Counter-flooding and the tanks as orders | Bo | In, but late: the tanks note's arithmetic says tanks aft buy nothing and tanks against the list buy the boats their launching. The first is worth showing because people ask it; the second needs the list (step 6) first |
| D19 | How the core takes coal bunkers and, later, more decks | Bo | Sub-spaces appended after the 64, absent unless a scenario asks, so every golden trace keeps its 64 columns; decks later by the same route |
| D20 | After the break: simulate the stern as its own body? | Bo | Yes: the model then has the three minutes the record has, and the calibration can aim at the break and at the end separately. The bow is drawn going, not computed |
| D21 | Californian | Bo | History by default (her operator asleep). "Her operator awake" as a what-if with its own label, never the default |
| D22 | How a search's result is published | Bo | The best night with its robustness table (section 8), in a note, before it reaches the page. Never "she could have been saved" on one model |
| D23 | Voice | Bo | After step 9, and only with an offline fallback |
| D24 | When the live site is updated | Bo | After step 0 (it waits on Bo's sign-in), then after each step that passes the gate |
| D25 | The user guide | Bo | Rebuilt by script with every step; its check fails when the guide names a control the page no longer has |

## 11. Risks

1. **Scope.** This is months of work for one lane. Lanes in parallel make it weeks only while each stays small,
   keeps to its own files and passes the gate: code is written faster than anyone can review it. The gate proves
   invariants. It does not prove taste: someone has to look and listen.
2. **Soft models.** The boats are fitted to one night. Their what-ifs are as good as their guesses, and those guesses
   are about people. Every figure on the screen that comes from them says so.
3. **Two calibration cascades.** The lists (section 4) and the break both move the oracle. One at a time, each with
   its validation table before and after, and the hull's trim fit must not get worse to buy a better list.
4. **A search exploits errors.** Section 8's robustness table is not optional.
5. **The 1912 point is on an edge** (P3e). Until it is moved off it, every what-if near it should say so, and the page
   does. A search that starts after the damage is done is not affected.
6. **The port.** sinksim matched this model in October and matches less of it each week. Port after the physics of
   sections 3 and 4 has settled, not before; a WebAssembly build of the core would then serve the page and the search.
7. **One laptop.** Eight cores, shared with other work. The gate takes ten minutes or more when the machine is full,
   and the encounter suite is most of that; its cases are independent and could run in threads.
8. **Nothing is backed up.** Everything since 8 October is in one folder until the push that waits on Bo's sign-in.

## 12. What was built and started on the day this was written

Built in the main line that afternoon (details in `CHANGELOG.md`):

- **Step 0's tools.** The gate; the check that `dist/` is current; the tools writing their tables where they are told,
  so that a check never rewrites a tracked one; the sweep and the encounter suite sharing their runs among threads.
- **The viewer's parts** (`site/app.js`, `tools/build_site.js`): the seam the lanes below hang on.
- **The watch's browser suite made independent of the machine's load.** [measured] On a busy laptop the hand-clicked
  1912 drill gave 0.667, 0.705 and 0.671 m2 on one commit, where the night's own orders give 0.7506, and the forecast
  moved from 2:16 am to 2:51 and 2:32. The suite's clicks now land on exact steps. The sensitivity itself is P3e's.
- **The end of a watch and its link** (`site/parts/40_night_end.js`).
- **P5's browser suites**, left unrun at its commit: they pass.

Started that afternoon, each in its own git worktree, each with a written acceptance test, none merged when this was
written:

| Lane | What | Its test |
|---|---|---|
| Pumps (Y6) | a logged pump order; the forecast carrying the plant and the orders forward; the Systems tab's controls | new rows in `tools/systems_tests.js` and `tools/systems_site_test.js`; every old fingerprint unchanged with no order given |
| Guide | the user guide built from Markdown by a script, its pictures retaken from the built site, its facts pulled from the repository | `tools/guide_check.js`: a control the guide names must exist in the page; no figure past a page's edge |
| Night | the night look; the crow's nest's eye and a lifeboat's | `tools/night_scene_site_test.js`; six pictures looked at |
| Sound | wind, sea, engines, ice, water, the bell, each level a stated function of a number in the model | `tools/sound_site_test.js` |
| Reports (step 3) | `core/readers/reports.js`: reports that arrive late and in words, the routine, what the bridge knows; a feed and the bridge's view in the page | `tools/reports_tests.js` (the 1912 feed against the bridge note's script, row by row), `tools/reports_site_test.js` |
| Girder (step 7a) | `core/readers/girder.js`: her weight along her length and the bending moment at any instant; a gauge in the page. No break | `tools/girder_tests.js` (the curve closes to the model's mass and centre; when and at what trim the moment passes each capacity), `tools/girder_site_test.js` |
| Boats (step 8) | `core/readers/people.js`: twenty boats by places and minutes, fitted to the launch record; drawn in the page | `tools/people_tests.js` (eighteen launch times against the record; the drops, not fitted), `tools/boats_site_test.js` |

The last three hang on a second seam built that afternoon, in the model this time (`core/night.js`, "readers"): a
module registers itself, is attached to every watch and stepped after it, owns its own orders in the log, and changes
nothing: a watch has the same fingerprint with it and without.

Not started: steps 4, 5, 6, 7's break, 9 (its brief is written), 10, 11 and 12.

## 13. Sources

- This repository: `README.md` (the validation table, "Known gaps"), `HANDOFF.md` sections 4, 6 and 7, `BACKLOG.md`,
  `CLAUDE.md`, the two brainstorms of 16 November, `core/night.js`, `core/systems.js`, `tools/encounter_tests.js`.
- Measured today: one 1912 watch with its sinking in 5.4 s, the damage preset in 2.0 s (Node 26, eight cores); the
  hand-clicked 1912 drill at 0.667, 0.705 and 0.671 m2 on a loaded machine against 0.7506 on exact steps; the
  encounter suite at more than twenty minutes of one core.
- Six research notes of 17 November, in `docs/research/`, each by a research subagent of this session working from
  the web by search and page fetch only (no PDF could be read; each note lists what it could not open):
  - `RESEARCH_lifeboats_launch_sequence_v1_2026-11-17.md` (sections 5 and 6.4)
  - `RESEARCH_wireless_rockets_ships_clock_v1_2026-11-17.md` (sections 6 and 8)
  - `RESEARCH_breakup_hull_girder_v1_2026-11-17.md` (section 4.1)
  - `RESEARCH_the_night_on_the_bridge_v1_2026-11-17.md` (sections 2.3, 2.4 and 7)
  - `RESEARCH_lists_bunkers_scotland_road_v1_2026-11-17.md` (section 4.2)
  - `RESEARCH_tanks_counterflooding_door_schedule_v1_2026-11-17.md` (section 3)
- Not read by me: any of the notes' own sources. Every figure above that is tagged [read] is read in a note, and the
  note says where it read it.
