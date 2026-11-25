---
contents: what it is and is not, the run against the eyewitness record, and the validation cases
---

# The evidence

:::lede
The {{Evidence}} tab opens on what the simulator is and what it is not, then sets the run beside the record: her trim
by the head, her list and the water aboard, against the eyewitness reconstruction, with the forecast to the end. Below
them come the timeline check, the witnesses row by row, the gallery of what-ifs and the validation cases that bound
the fit.
:::

![The Evidence tab at 2:09 am](img/evidence.png "The Evidence tab at 2:09 am on the 1912 damage: its first section, What this is, and what it is not, and under it the three charts. Blue: this run; dashed: the forecast; gold: the eyewitness reconstruction (Halpern, 2023), and in the last chart Wilding's 16,000 tons at 40 minutes."){.side}

The first section, {{:What this is, and what it is not}}, says it in two paragraphs. The simulator is in early access,
a work in progress. It is a physics model of her flooding, her trim, list and sinking, her machinery and pumps, the
encounter with the berg and her fall to the bed, each computed step by step and set against the 1912 record in the
charts and tables under it. Where the record is silent the model makes a bet, and its code and notes name every one.
It is not a record of the night. The people aboard are counted, not followed. The words of the crew's minds, in the
desktop app with a key of your own, are a language model's, not the men's. Her break is the moment her hull reaches
its strength, where the model hands her to her fall, not the tearing itself. Every time and figure on the page is the
model's, and this tab sets them against the record. The sources are listed in the repository's SOURCES.md, and the
simulator is not affiliated with any other Titanic project. On the {{Run}} tab, {{:Start here}} links to this section:
{{the Evidence tab}}.

On the 1912 damage as built and the 1912 watch on its recorded orders, each chart also carries a pale band behind its
lines. It runs from the least to the most of the kept set's @@ensemble.members@@ members still afloat, every five
minutes: the sets of the calibration's numbers kept because they pass the record's tests (chapter @@ch.playing-a-watch@@, the
forecast). Point at a chart for the band's figures at that moment and how many members are still afloat. On any other
run the chart has no band. Its colour is appearance.

## Trim by the head

Halpern's reconstruction of her trim from the eyewitnesses (core/scenarios.js), against the model's calibrated run of
the 1912 damage (out/validation.json):

:::gen trim
:::

The reconstruction is itself an estimate: Halpern read her trim from what survivors said they saw, the rows of ports
going under and the well deck awash, at times they gave. The history match does not score it: it scores the ledger's
rows marked for the fit, the witnesses' own sightings among them (below).

## The list

The model's list begins as the coal list of the evening, about 1.6° to port as calibrated (Halpern estimated 2°). The
sea then comes first into the empty starboard
half of boiler room 5's forward bunker, and on the calibrated run she lists @@list.5@@ five minutes after the
collision, and little by 11:50 pm, where witnesses saw 5° to starboard. Once the bunker gives way, about an hour after
the collision, the coal list and the free surface of the water in her take her to port: @@list.130@@ at 1:50 am and
@@list.145@@ at 2:05 am, where witnesses saw 10° to 15° to port. On a watch the commutator reads that list, a few
degrees short of what the officers reported. The candidates for the rest are worked out in the repository's design
notes for her list: water running aft along Scotland Road, and the port gangway door ordered open.

## The timeline check

The record's events against the times the model gives for them, as the {{Evidence}} tab lists them. For the events
and the trim, the record's times are Halpern's reconstruction from what the witnesses said; for the water down the
stair to F deck, Wheat's own answer gives a range:

:::gen timeline
:::

Wilding told the inquiry that 16,000 tons came in during the first 40 minutes, and from that he put the opening at
12 square feet. The model reaches 16,000 tons only after @@val.titanic.wilding@@ minutes: this model's fit to the record
takes a smaller opening, @@area.sqft@@ square feet (@@area.m2@@ m²) in member C.

## The ledger

The repository also keeps the record as a ledger of @@ledger.rows@@ observations, each one witness's sight of one
thing at one time: the sea at a hatch or a stair, the water in a room, a sounding, her list, the tons aboard, an event.
Each is read against the run of the 1912 damage. The history match scores the rows marked for the fit; others are
held out to judge that fit, and some are only reported. The repository's own table of the ledger prints every row as a
check. At this edition's numbers @@ledger.inBand@@ of the @@ledger.rows@@ lie in their band. The largest misses are her
list changing sides, which the model has @@ledger.sideChange@@ minutes after the collision and the record between
@@ledger.sideChangeFrom@@ and @@ledger.sideChangeTo@@; the water aboard @@ledger.tonnageT@@ minutes after it,
@@ledger.tonnageShort@@ short of Weeks and Halpern's reconstruction, @@ledger.tonnageRecord@@ tons; and the sea at Poingdestre's
quarters, which reaches the mark he saw @@ledger.poingdestreLate@@ minutes late. The whole ledger is
`out/ledger_1912.txt`.

## The witnesses, row by row

![The witnesses, row by row, on the Evidence tab](img/witnesses.png "The Evidence tab at her foundering on the 1912 damage: the first three of the witnesses' rows, each with what was seen, its source, and the model's reading of this run."){.side}

The {{Evidence}} tab carries the ledger itself, under {{:The witnesses, row by row}}. Every row sits on her timeline
with the witness, what was seen and when, and the model's reading of the run on the page by the ledger's own rule. Under
{{Source and tags}}, each row gives its source in plain words, its part in the calibration, and each of its tags as
its kind.

- **The strip at its top** lays each row's window on a lane of its own across the night: green in range, amber out of
  it, grey still to come. A tick marks the model's own time for that row, and while the run plays a dashed line marks
  its now.
- **The run it reads** is the one on the page: the 1912 damage from its start, or a watch of the 1912 night from the
  touch, since the ledger's times are minutes after the touch. Any other run has no reading, because the rows are the
  1912 night's.
- **When a row is read.** A row waits until the run has passed its time. A row's first time at the witness's level reads
  "not yet" until it comes. A row about an event is read when the event comes, and the rows about her end when she has
  gone.
- **Its figures.** On the 1912 damage at its defaults, every figure is the repository's own table's, to its printed
  digits.

As the section's own summary says, every row is a check, and none is tuned to be in range. The ledger reads the model
and feeds nothing back.

## What if: the counterfactual gallery

![Two of the gallery's cards](img/gallery.png "Two of the gallery's cards on the Evidence tab: the watch as recorded, and the bulkheads carried up to B deck, each in the kept set's own words. The other cards are left out of the picture."){.side}

Under {{:What if: the counterfactual gallery}}, the {{Evidence}} tab answers, one card each, the questions people ask.
First comes the watch as recorded, then each what-if on the 1912 watch. Each was run by every one of the kept set's
@@ensemble.members@@ members, with the landed member (the model's defaults) beside them, not counted. A card gives its
question, its result in the table's own words and its counts; under {{How it was run}}, it says what was changed and
how.

The words keep one rule. A result is its table: how many of the N members show an outcome, with the band of their
figures. It is never "she could have been saved" on one model. The people and the ships rest on their readers' own
guesses, named where they are used. At this edition's numbers the cards read:

:::gen gallery
:::

## Other cases: her sisters, and Wilding's what-ifs

The flooding's uncertain inputs are calibrated by a history match against an observation ledger of the 1912 record:
@@ensemble.members@@ sets of them that pass the record's tests are kept, and one of them (member C) is the model's
defaults. As the note under the page's table says, the first row is the fit, and each kept version of the model had to
give the record's outcome in the next seven: Wilding's four and five compartments, Olympic after the Hawke collision,
Britannic in 1916 and with her portholes shut, no damage in boiler room 5, and the bulkheads to D deck. A set of numbers
that gave any of them another verdict was not kept. The last two, the bulkheads to B deck and the doors left open, were
not required of it, and are shown as they come. The first row is the 1912 damage at member C's numbers:

:::gen validation
titanic | Titanic, 1912 (the fit) | Sank in 2 h 40 min
four | Forepeak and holds 1 to 3 open | Wilding: she would float
five | Add boiler room 6 | Wilding: she sinks
hawke | Olympic and HMS Hawke, 1911 | Two compartments flooded; she reached port
britannic | Britannic, 1916 (approximate) | Sank in about 55 min
britannicClosed | Britannic with her portholes shut | Built to float with six compartments flooded
titanicNoBR5 | Titanic, no damage in boiler room 5 | Wilding: she still sinks, more slowly
titanicD | Titanic, bulkheads to D deck | Wilding: it would not have saved her
titanicB | Titanic, bulkheads to B deck | Divided, on nearby cases. The Court's Report: afloat if No. 4 boiler room stayed dry. Wilding: lost once it flooded
titanicDoors | Titanic, watertight doors left open | Debated
:::

On the B-deck case the record divides, on nearby cases: the Court's Report had her afloat if No. 4 boiler room stayed
dry, and Wilding had her lost once it flooded. The model floats her, as the later design of Britannic claimed for her
own six forward compartments. Britannic's hull is taken
as Titanic's, a little narrower, and which of her bulkheads went to B deck, and where her open ports were, are
assumptions.

The validation table prints, for each case that floats, how far the lowest top of a bulkhead with water on one side
and none on the other stands above the sea. Olympic after the Hawke keeps @@val.hawke.margin@@ m at bulkhead
@@val.hawke.marginAt@@, but two cases float by little: @@val.britannicClosed.margin@@ m at bulkhead
@@val.britannicClosed.marginAt@@ for Britannic with her portholes shut, and @@val.four.margin@@ m at bulkhead
@@val.four.marginAt@@ with the four forward compartments open. Those are edges, not margins: a small change in an
assumption could turn either case.
