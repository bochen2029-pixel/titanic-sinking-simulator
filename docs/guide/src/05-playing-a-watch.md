---
contents: the bells, the outcomes, the forecast, the same berg another way, the end of a watch and its link, seeds
---

# Playing a watch

## The bells and your reaction time

The lookout rings three bells when the ice comes within the night's sighting range. On the 1912 night that is about
500 yards; in this build the bells ring with the ice @@watch.bellsRange@@ m off. Your reaction time runs from the bells
to your first order to the wheel or the engines. An order given before the bells is logged, but it is not a reaction:
nobody had seen anything yet, so the panel calls it hindsight. Orders to the doors, the stokehold, the pumps, the boats
and the wireless do not count.

## The four outcomes

![Three seconds after the touch on the 1912 orders](img/watch-touch.jpg "Holed: the 1912 orders, three seconds after the touch, the wheel reversed as on the night. The damage diagram shows the seams opening.")
![A stem strike on night 16](img/stem-strike.jpg "Stem into the ice: night 16, no order given, three seconds after her stem met the ice. The red marks are her crushed bow.")

When the encounter is over (the ice is abaft the beam and out of reach, or she has stopped, or she has lain against it
for ten seconds), the {{Run}} tab and a notice give the outcome in one sentence:

| Outcome | What happened |
|---|---|
| Clear of the ice | She passed it. The sentence says how far off her side it went. |
| Clear, but dented | She touched it. Plating dented, no seam opened, no water. |
| Holed | Seams opened along her side, compartment by compartment: the 1912 kind of damage. The sentence gives the area open and the compartments. |
| Stem into the ice | She struck it head on. Her bow crushes and the compartments in it open to the sea. Wilding told the inquiry she would have come in with her bow crushed 80 to 100 feet. |

Once she is past the ice the verdict is kept: after a miss, the line under the readouts still gives it while she
circles past the berg again, and on a laptop's screen the card says "Close this card to take the wheel and the
telegraph again".

On the 1912 orders the sentence is *@@watch.verdict@@*. Night 16 with no order ends *@@stem.verdict@@*.

When she is holed and the clock still runs at her own pace, {{1×}}, the notice gives her opening first, then where to
run the clock faster: "Run the clock faster under Time, on the Run tab, to see what the water does". The compartments
holed are in the line under the readouts and on the {{Run}} tab.

## After the ice: the forecast

Once the encounter is over, the clock is free: run it faster with the speed buttons under {{:Time}}, at the top of the
{{Run}} tab. The page then runs a copy of the
whole watch on to the end, in the background: her plant, the engineers' rules, every order given and the scripted
orders still to come all go with it, and the line under the readouts gives the forecast. Its time is the watch's own,
and it runs to where she breaks: on the 1912 orders it reads *@@watch.forecast@@*, and she breaks @@end.forecastMin@@
minutes after the touch in the forecast and @@end.founderMin@@ when the watch is run to her end. Where she would
founder before her own loads reach her strength, it says when she founders instead. An order to the ship given after
the ice (to the pumps, say) brings a new forecast. An order to the boats, the reports or the wireless changes nothing
in the model and brings none, unless it ends the 1912 orders before their Stop. If she will float, the forecast says
so, with her final trim and the water aboard.

The model is one calibration, and the record allows others. The calibration's history match kept
@@ensemble.members@@ sets of its numbers that pass the record's tests: the kept set. They sample what the record does
not rule out, and are not the whole of it. Each was run through the 1912
night, and the paragraph under {{:Forecast}} on the {{Run}} tab says how they end. On the 1912 orders,
@@ensemble.watchBreakN@@ of @@ensemble.members@@ break, between @@ensemble.watchBreakLo@@ and
@@ensemble.watchBreakHi@@, @@ensemble.watchBreakMed@@ in the middle. The landed member, the model's own defaults and
this watch's, breaks at @@ensemble.watchBreakLanded@@. The kept set ran two runs only: this
watch on its recorded orders at 22½ knots, and the 1912 damage as built. So once you give an order of your own, or on
any other night, the page shows your run alone. A result is told as k of N, never as one model's word.

![The 1912 watch forty minutes after the touch](img/watch-flooding.jpg "The 1912 watch at @@at40.clock@@, forty minutes after the touch, in the quarter view with the X-ray hull: @@at40.trim@@ of trim, @@at40.water@@ of water aboard. The forecast is under the readouts; steam blows off at her funnels."){.stage}

## The same berg, another watch

![The same berg, another watch, on the Run tab](img/run-watch.png "The table on the Run tab after the 1912 orders. The row nearest your own order is marked."){.side}

After every watch the {{Run}} tab works out the same drill on the same berg with the order given 0, 5, 10 and up to
30 seconds after the bells. The drill is the one of 1912: the helm hard over away from the ice, reversed at the touch,
the engines stopped a minute later. Only the moment of the order changes, so the table shows how much the seconds
mattered.

The repository's own tests run the same drill on the 1912 berg, each order half a second later than the page's:

:::gen window
:::

## When a watch ends

When she breaks, lies steady with water aboard, or has passed the ice untouched, a card on the stage says what
happened, in plain words, the model's figures read at that moment: when she broke and how long after the touch; what
the ice did; when the first order came; what her pumps put back over the side; and the watch's fingerprint. On the
night of 1912 the line after the time she broke says that this is the model's time, and sets the record's beside it:
when, by the witnesses' accounts, she broke, and when she was gone. Where she founders instead, as on a watch handed over at the
flag (a what-if: `handover=flag` in the address), the card says when she foundered, beside the record's own time. Her
steam and her lights get lines of their own, each at the plant's own time and in the order they came:

- her boilers and steam mains giving way as she rose;
- where her main dynamos stopped before her emergency sets, the time only her emergency lights burned after (on the
  1912 night both stop on one step);
- her lights going out; or, where they never did, still burning when she broke, as on the 1912 orders, or burning to
  her end where she founders.

As her two pieces fall, the card gains a line as each comes to rest on the bed (chapter @@ch.after-the-ice@@).

![The card at the end of the 1912 watch](img/end-card.png "The card at the end of the 1912 orders: under the time she broke, the witnesses' times beside the model's. On the stage it stands below the boats' count."){.side}

:::gen endcard
:::

{{This night again}} starts the same night afresh; {{Close}} puts the card away. {{Copy a link to this watch}}
copies an address that holds the night's seed and every order given, for example `@@end.linkStart@@`. A night is its
seed and its orders, so whoever opens the link sees the same watch, bit for bit on the same browser. Orders that arrive
in an address are checked before they reach the model: an order the model does not have, a rudder angle past the stops,
a door that is not there, a hole where none can be made, or more than 600 orders, and the night opens without them.
If the browser will not copy, the link appears in a box on the card to be copied by hand.

## Nights, seeds and levels

- **A night is its seed and its orders.** Every order is logged with the step of the model it was given at, so
  {{Replay my watch}} plays a watch again exactly. Any order makes the watch yours and lets it be replayed, as the
  wheel does: on the 1912 orders, those still to come are dropped. A hole made with the damage brush is the one
  exception: it is logged and replayed like any order, but the night's own orders go on (chapter
  @@ch.scenarios-and-what-ifs@@). The watch's fingerprint is made from her state at every step. The {{Run}} tab
  stamps it once, on the step the encounter ends, at the end of its sentence about the watch ("Watch …, step …"),
  and the card gives it again at her end. The same seed and orders give the same fingerprint
  on the same browser. Across engines the model computes its own functions, so the page reaches the end of the 1912
  encounter with Node's own fingerprint; past it, where the power function is still the engine's, two engines may part
  in the last bit (chapter @@ch.how-it-works@@).
- **{{Another night}}** draws a berg from a seed: its size, its depth, where it lies off her track, and how far off
  the lookout sees it. To choose one, type a seed in {{Night (seed)}} and press {{Go}} or Enter. Seed 1912 is the
  night of 1912.
- **{{:The ice on a drawn night}}** sets how hard the next drawn night is: {{Seen early}}, {{Any night}} (the
  default), or {{Like 1912}}, seen late and close to her track. It never changes the 1912 watch.
- **{{:Her speed, knots}}** sets the speed of the next watch: {{22½}}, {{18}}, {{15}} or {{10}}.
- **The address carries the night**, for example `#night=1912`, with `&kn=18` or `&level=early` when they are not
  the defaults, and `&log=` with the orders when it came from the card.

## How hard is it?

The repository runs the 1912 drill on two hundred drawn nights at each level, with the order at the bells and later:

:::gen sweeps
:::

With no order at all, on the default level, she meets the ice stem first on @@sweep.hard.none.stem@@ % of nights;
with the order at the bells, on @@sweep.hard.0.stem@@ %.
