---
contents: coal to steam to screws; the lights and the doors; the pumps and the orders to them; the stokehold
---

# Her systems

:::lede
Her machinery depends on itself, so a failure spreads. The {{Systems}} tab shows each link and its state now: green
when it works, amber when it is short, red when it has failed, grey when it is idle.
:::

Coal feeds the fires in six boiler rooms. Their steam drives the two reciprocating engines and the wing screws. The
engines' exhaust drives the turbine and the centre screw. The same steam works the steering engines that move the
rudder, the dynamos that light her, and the pumps. Water breaks the chain where it reaches: at a room's furnaces, at an
engine's crankshafts, at the dynamo flat. As her stern rises, the screws and then the rudder leave the water.

:::gen chain
coal | Coal in the bunkers | The bunkers run empty
fires | Coal, and a dry stokehold | Water reaches a room's furnaces; the bunkers run dry; the stokers draw them
steam | The fires | Fewer fires burn than she uses; the steam mains break as she rises steeply
engines | Steam, and a dry engine room | Water reaches the crankshafts; the steam falls below what they need
turbine | The engines' exhaust: ahead, at Half or Full, both engines above 40 rpm | Its room floods
screws | The engines, and water round the blades | Her stern rises and lifts them out
way | The screws: water moving past the rudder | She stops; the rudder then has nothing to work on
steering | Steam, way on her, and the blade under water | No steam: the rudder stays where it is
dynamos | Steam, and a dry dynamo flat | She goes dark; the emergency dynamos on D deck keep her emergency lights a while
doors | Current, for the bridge's switch | In the dark only their floats and levers drop them
pumps | Steam; no current | The room a pump stands in floods; the steam fails
:::

## The boiler rooms

:::gen rooms
:::

{{Draw}} beside a room orders its stokers to draw the fires; {{Draw every fire}} orders all of them. A room's fires take
about @@plant.drawTime@@ minutes to draw: the source says room 5's thirty furnaces took fifteen to twenty men about
twenty minutes. The steam already raised carries the load a while longer. Then, as the pressure falls, the engines stop
first, then the dynamos, then the steering gear. On a watch the order goes in the log with the helm's and the
telegraph's.

Her smoke shows her fires. Each of her three working funnels took the uptakes of two boiler rooms: the first 6 and 5,
the second 4 and 3, the third 2 and 1. So each funnel's smoke is drawn from its two rooms' share of the steam her fires
raise. It thins as the stokers bank them, and stops as their fires are drawn or put out by the sea. How the smoke looks
is appearance; how much each funnel sends follows the model.

![The Systems tab on the 1912 watch](img/systems.png "The Systems tab seven and a half minutes after the touch on the 1912 orders. Boiler room 6 has flooded, so the fires burn in four of the five rooms lit; the telegraph has stopped the engines; the pumps: @@watch.pumps@@."){.side}

## Coal in her bunkers

{{As loaded}} gives her the coal of the night, about @@plant.coalAboard@@ tons: worked out from what she took aboard at
Southampton and what she burned on the way. {{2 h left}} and {{15 min left}} give her that long at full firing, about
@@plant.coalPerDay@@ tons a day. The choice applies when the run restarts, and to the next watch. With a room's
bunkers empty its fires burn down in about @@plant.burnOut@@ minutes (a guess).

## Her lights and the doors

Her lights are the dynamos' output, not a clock. Water at the dynamo flat, or too little steam, puts the main sets out.
Two small emergency dynamos on D deck then keep about @@plant.lights@@ % of her light (a guess), until the sea reaches
D deck where they stand. When the main dynamos stop, so does the current that drops the watertight doors from the
bridge: in the dark the bridge's switch does nothing, and only each door's float, or its lever worked by hand, will drop
it.

The sea puts her lights out piece by piece before that. As a greaser agreed at the British inquiry, flooding blows the
fuses. The model divides her lighting into 250 sections, each a deck's space in one compartment, on one side, with a
main circuit and an emergency circuit. How her mains were in fact divided is not known, so the sections are a guess.
When the sea inside a section reaches its switches, its fuses go, for good, whatever the dynamos are doing. The model
takes the switches as 1.2 m over the floor, a guess too. Her lights' node in the graph below turns amber with the first
section dark, while the dynamos still run, and says how many are dark: for example "40 of 250 sections dark: the sea in
them has blown their fuses". Her ports follow the same circuits. A port the sea has covered burns on, drawn dimmer,
until its section's fuses blow or her dynamos stop.

On the 1912 watch, after she touches the ice, her engineers raise doors by hand, as a trimmer and a greaser who
worked them told the British inquiry. Thirty minutes after the touch they raise the doors in bulkheads G, H, J and K,
to reach the pumps and valves, on the chief engineer's order. Sixty-two minutes after it they raise those in L, M, N and O, to
fetch the 10-inch suction pipe. On the 1912 orders that is 12:10 am and 12:42 am. A door is raised only while the
rooms on both sides of it are dry, and the bridge's switch is put off for it, as raising a door by hand needed. Its
float stays armed, so the sea drops it again as it comes. This is the engineers' own work, not an order of the
bridge's: it goes in no log, and no report of it reaches the bridge, which had nothing to show which doors stood
open. On the {{Systems}} tab the {{:Doors}} link names the doors they raised, with the ship's time, why, and its
source in the record; on the {{Bulkheads}} tab, pointing at such a door's {{Open}} says the same. On the 1912 orders
the night is the same as without them, bit for bit, up to where she breaks, and there the doors in J to O still
stand open into dry rooms. The damage presets and the drawn nights carry no such schedule.

## The pumps

Her steam pumps reach the bilges of the boiler rooms and the engine rooms, and of the holds while their valves can be
worked: the valves stood in the firemen's passage, lost once it floods, about five minutes after the collision in 1912.
The peaks have no suctions.

:::gen pumps
:::

That is @@pumps.main@@ tons an hour from the ballast and bilge pumps, and @@pumps.all@@ with the two ash ejectors (an
estimate of Wilding's). All of them run on steam; none needs the dynamos. They give nothing below
@@plant.pumpPsiLow@@ psi and their full rate above @@plant.pumpPsiFull@@ psi (a guess at direct-acting pumps).

On a watch the engineers work them as the model guesses they would: a room's own pumps go on @@plant.pumpOwn@@ minutes
after water comes in, and pumps from rooms still dry are led to it through the bilge main @@plant.pumpLent@@ minutes
later. A pump stops for good when the room it stands in floods @@pumps.abandon@@ m deep: its crew has gone. The 1912
damage preset carries the night's own schedule instead: boiler room 5's pump from @@pumps1912.br5@@ minutes, and boiler
room 4's from @@pumps1912.br4@@. Against the 1912 damage they put about @@e22.pumped@@ tons overboard and keep her
afloat @@e22.asWorked@@ minutes longer; every pump able to reach the bilges, never abandoned, would buy
@@e22.everySuction@@ minutes (the repository's experiment e22). Against a small leak they can hold a room dry.

### Orders to the pumps

![Three rooms of the Pumps section after two orders](img/pumps.png "Boiler rooms 5, 4 and 3 in the Pumps section, three minutes after the touch on the 1912 orders, just after Every pump that can reach it on boiler room 4 and then on boiler room 5: each lists the pumps now on it and when each will be at work. Boiler room 3, still dry, is in the quieter form."){.side}

The section {{:Pumps}} on the {{Systems}} tab says who has the pumps, and lists each room with water in it or pumps on
it: its water, what its pumps put out, and each pump on it, at work or at work in so many minutes. On a watch it lists
every other room an order can draw from as well, dry and in a quieter form, so that pumps can be put on a room before
the water reaches it; and it takes your orders:

- {{Its own pumps}} puts a room's own pumps on it, at work @@plant.pumpOwn@@ minutes after the order.
- {{Every pump that can reach it}} adds every free pump that can, those standing elsewhere led to it through the bilge
  main, at work @@plant.pumpLent@@ minutes after the order.
- {{One pump…}} opens a list of the free pumps, each with its rate and when it would be at work.
- {{Off}} beside a pump, or {{All off}} for a room, takes pumps off at once.
- {{Back to the engineers}} hands the pumps back to their rules, which go on from where the pumps stand.

An order takes the pumps from the engineers, who then wait for yours. A room's suctions and the two mains limit what
can be drawn from it; none works without steam, and a pump stops when the room it stands in floods. An order that
cannot be carried out changes nothing and says why. Every order goes in the watch's log, and the forecast runs the
watch on with it.

On the 1912 orders, {{Every pump that can reach it}} on boiler room 4, still dry, and then on boiler room 5,
@@pumpOrder.at@@ minutes after the touch, moves the forecast from @@pumpOrder.before@@ to @@pumpOrder.after@@ minutes
after the touch: @@pumpOrder.change@@. What the best orders a search found buy is in chapter
@@ch.after-the-ice@@, under "The Carpathia question".

:::note Blowing off
When the engines stop with every fire lit, the safety valves lift and steam roars from the escape pipes on her funnels,
until the stokers bank the fires. On the 1912 orders it starts soon after the telegraph rings Stop. With the sound on,
you hear it; in the 3D view, the steam rises from her funnels.
:::

## Her nervous system

![Her nervous system on the Systems tab](img/nerves.png "The Systems tab as the bunker of the fire gives way on the 1912 watch, about an hour after the touch: her nervous system, with boiler room 5's fires pointed at, and the line under the graph saying why they stand as they do."){.side}

Under {{:Her nervous system}}, the {{Systems}} tab draws all of her machinery as one graph. Each of these is a node:

- the coal and the fires of each of her six boiler rooms, the stokehold fans, the steam, her two engines, her turbine
  and her three screws;
- the steering engines and the rudder, the pumps;
- the main dynamos and the emergency sets, her lights and the doors' switch;
- the wireless, the Morse lamp, the telephones and the boats' work.

Lines run from what each node needs to what needs it.

Each node takes the colour of its state: green working; amber working short, or on a stand-by; red failed; grey not
here, or not in use. Point at a node, or move to it with the keyboard, for its full name and the reason in words. Where
the model marks one, it also gives the time the node took that state: on a watch T+ and the minutes after the touch
("T+56"), on a preset the ship's clock. Under the graph, the nodes that are not working are listed in words, so what has
failed reads at a glance; the graph's lines show what hangs on it. A node that changes is marked for a few seconds. On
a phone the graph gives way to the list of every node.

The states, their reasons and their times are the model's own, read from its fields by fixed rules that copy no law of
their own. The places of the nodes, their short names and their colours are appearance.
