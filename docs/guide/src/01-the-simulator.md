---
contents: what it is, what it models, what it does not
---

# The simulator in one page

:::lede
You stand the watch on the bridge of RMS Titanic at 11:39 pm on 14 April 1912. She makes 22½ knots on a course of
266°. Somewhere ahead is ice. What you order, and when, decides what the ice does to her. The flooding model then
decides whether she sinks, and how. After the ice the night goes on: reports reach the bridge, the boats go down, the
wireless calls for help. When she breaks, the page follows her two pieces down to the sea bed. Early access, a work in
progress: the simulator is playable in its core loop, and it will change.
:::

:::note This edition
Since edition 1.13, the page says more plainly what is the model's and what is the record's: the {{Evidence}} tab's
tables give the record in its own words, each witness's row its source in plain words, and its last section says
where the model misses. In the desktop app a man who went away in a boat leaves the bridge when the model lowers her.
A phone's first screen says where to begin, a room picked under her rooms comes into view with the credit for the deck
plans, and a restart of the 1912 damage keeps her pumps and her list. Edition @@edition@@ describes the model as it
stood on @@date@@ (the repository at @@repo.commit@@). Before it, 1.13 made the simulator public, in early access, as
version 0.3.0, at [https://bochen.xyz/titanic/](https://bochen.xyz/titanic/), with a plainer first minute; 1.12 let you
speak to the bridge in the desktop app; 1.11 had her engineers raise the doors aft of boiler room 4 by hand and named
the first-class passengers booked into her rooms; 1.10 added the bar back to any minute played; 1.9 ended a watch where
she breaks; 1.8 let the men answer in the desktop app, in words a language model writes for them; 1.7 calibrated the
model by a history match and added the app for Windows.
:::

The simulator computes the sinking instead of animating it. A model of her hull and compartments works out, a quarter
of a second at a time, where the water goes and how she floats with it. The 3D view only draws what the model says;
the same model runs without it, in Node, for the tests (chapter @@ch.reference@@).

## What it models

- **Flooding.** Sixteen watertight compartments, each split port and starboard and above and below E deck: 64 spaces,
  joined by 290 water paths. The paths are the holes in her shell, the watertight doors, the openings in the decks and
  the tops of the bulkheads.
- **How she floats.** Her rise and fall, her trim and her list, as one rigid body, starting from her drafts on the night.
- **How she handles.** Her turning and her stopping, fitted to the trial record of the three sister ships.
- **The iceberg.** A body of ice she can miss, graze, dent or run her stem into. The contact makes the damage. No hole
  is painted on.
- **Her machinery.** Coal, the fires in six boiler rooms, steam, two engines and a turbine, the steering engines, the
  dynamos, the watertight doors and the bilge pumps. Each fails when water reaches it, and what depends on it fails
  after it. The pumps take your orders.
- **Flooding at speed.** While she moves, the sea presses harder at an opening that faces the flow, and her bow wave
  raises the water near the stem.
- **Her wake.** On a watch, the waves her hull raises as it moves, and the white water where they break and in the
  races of her screws (chapter @@ch.the-screen@@).
- **The rest of the night.** Four readers of the watch follow it without changing it: the reports that reach the
  bridge, late and in words; the twenty boats, uncovered, filled and lowered; the wireless, the rockets and the other
  ships; and a gauge of the bending of her hull, which marks the moment her own loads reach what her hull could bear.
  Chapter @@ch.after-the-ice@@ takes them in turn.
- **Her fall to the bed.** After she breaks (on a damage preset, after she founders), her bow and her stern as two
  bodies of their own, carried 3,790 m down to the sea bed by their weight, the water and the air in them, and the sea
  about them. The wreck as surveyed is laid on the bed beside them.
- **How it looked and sounded.** A Night look, the lookouts' eye in the crow's nest and the eye of someone in a boat
  off her beam; the ship heard, each sound following a number in the model (chapter @@ch.the-screen@@); and her decks
  walked while she sinks, on the model's own water (chapter @@ch.after-the-ice@@).

## What it is fitted to

The flooding's uncertain inputs are calibrated by a history match against an observation ledger of the 1912 record:
@@ensemble.members@@ sets of them that pass the record's tests are kept, and one of them (member C) is the model's
defaults. They sample what the record does not rule out, and are not the whole of it. The fit is bounded so that it keeps the verdicts the record gives for Wilding's four and five compartments,
Olympic after the Hawke collision and Britannic in 1916. Chapter @@ch.the-evidence@@ shows those cases, and sets the
run beside Halpern's eyewitness reconstruction of her trim (2023). A few other constants are fitted in their own
files, each named there: her handling, the encounter's area constant, the boats (@@boats.fitted@@ numbers, to the
launch record of 1912), the reports and the wake's scale.

In this build the 1912 damage gives: *@@preset.forecast@@.* The reconstructed watch, on the night's own orders,
breaks at @@end.founderClock@@, @@end.founderMin@@ minutes after she touched the ice. By the witnesses' accounts she
broke between about 2:15 and 2:19 am, and was gone at 2:20, 160 minutes after the collision.

![The 1912 damage at 2:09 am in the X-ray hull](img/preset-0209.jpg "The 1912 damage at 2:09 am, in the quarter view with the X-ray hull. The readouts give @@at0209.trim@@ of trim, @@at0209.list@@ of list, @@at0209.water@@ of water aboard and @@at0209.hull@@ on the hull gauge; the status reads “@@at0209.status@@”. The damage diagram below shows the sea's surface against the bulkhead tops."){.stage}

:::note Read every outcome as an estimate
Several inputs are informed guesses with a physical meaning: the strength of her plating, the berg's mass, the force at
which a bow crushes, how her engineers worked the pumps, how readily people came forward to the boats. The code labels
each of them as a bet. A night's outcome is a well-founded estimate, not a verdict.
:::

## What it does not do

- **The break is a cut.** On a watch the flooding model stops on the first step her own loads reach her strength
  somewhere along her, and the fall takes her from there, cut clean in two at that place. How her hull tore is not
  modelled: the engine has a joint that bends and tears before it lets go, but it is a what-if, and no default run
  uses it. A damage preset runs on to her foundering, where nothing gives way and her last minute is a plunge; only
  then is she cut in two, over boiler room 1, for her fall.
- **The fall is a first model.** Each piece carries its air as one pocket. A watch hands her over where she breaks,
  about 7 degrees by the head and nearly upright, and on the 1912 orders both pieces land upright, as the wreck's do.
  A damage preset, and a watch with `handover=flag` in its address (a what-if), hand her over at the flag instead, far
  down by the head and on her beam ends: there her stern lands upright, but on the 1912 damage and orders her bow lands
  upside down, where the wreck's bow lies upright, and the card at her end says so. The bow lands farther from the
  break than the wreck's bow lies, and the air in her space by space is still to come (chapter @@ch.after-the-ice@@).
- **No trapped air while she floats,** but for one rule: the air shut in under a grand staircase's dome lifts its
  glazed cover once the doors of the stair hall are under water.
- **The decks above E deck are one space** in each compartment, up through the superstructure, which keeps the sea
  out until its windows break. Water that comes in at a window is at once on the decks under it, where in the ship it
  had to find a stairwell first.
- **Speed is rough.** Her speed reaches the holes only roughly: nobody measured the pressures on this hull. The damage
  presets lie stopped.
- **Only the 1912 damage and a watch are pumped.** The other presets lie unpumped.
- **The list.** The model's list to port falls short of the one witnesses saw late in the night, and its list to
  starboard just after the collision is smaller and shorter-lived than the 5° they saw (chapter @@ch.the-evidence@@).
- **People are counted, not drawn.** The boats move places and minutes, and name nobody.
