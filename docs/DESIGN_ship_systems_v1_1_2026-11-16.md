# Her systems need each other: the plant (design v1.1)

2026-11-16, session ab71e668. Lineage: v1 (`DESIGN_ship_systems_v1_2026-11-16.md`, the same evening) left two numbers
pending research. v1.1 takes them, and the facts that bear on the plant's links, from
`docs/research/RESEARCH_ship_systems_plant_v1_2026-11-16.md`. Nothing in the chain or its rules changed; v1's sections 1,
2, 3 and 5 stand and are not repeated. Code: `core/systems.js`; tests: `tools/systems_tests.js`,
`tools/systems_site_test.js`. The same evening the handling was refitted to the sisters' consensus (M2, `CHANGELOG.md`);
the plant's tests ran again under it.

## 1. What the record changed

| Number | v1 | v1.1 | Standing |
|---|---|---|---|
| Boiler room 6 | five double-ended boilers | four double-ended boilers (24 furnaces, 8 ends) | read (The Shipbuilder 1911, via the research note) |
| Lit on 14 April | rooms 6 to 2, room 1 cold [pending] | the 24 double-ended boilers lit; room 1's five single-ended cold. Two or three in room 2 were lit at about 8 a.m. that Sunday and needed 12 hours to connect | read |
| Drawing a room's fires | 600 s [bet] | 1,200 s: room 5's 30 furnaces took 15-20 men about 20 minutes | read |
| Coal aboard on the night | 3,400 t [pending] | 3,050 t: 5,892 tons at Southampton less about 4.5 days at 620-700 tons a day | derived |
| Coal at full firing | 650 t a day [pending] | 750 t a day: Olympic 629 tons a day at 21.4 knots, so Titanic about 700 at 22 knots, which asks 95 % of full firing | derived |

Every other number in v1's table stands with its standing.

## 2. Facts that confirm the links

- **Dynamos.** Four steam-driven sets of 400 kW at 100 V, at the bottom of the electric engine room aft of the turbine
  room, on steam from rooms 1, 2 and 4 by pipes of their own. The plant's dynamos on the boilers' pressure, and dark
  when their flat floods, stand.
- **Steering.** The steering engines ran on the auxiliary steam line and were worked hydraulically from the wheelhouse.
  The only electric part was the rudder-angle indicator. The plant's steering on steam stands.
- **Engines and turbine.** Unchanged: the engines on steam, the turbine on their exhaust.
- **The boilers blew off steam loudly through the first hour** after the engines stopped: the surplus the plant holds at
  the safety valves (BACKLOG Y1).
- **The propellers were seen clear of the water** before the final plunge by three witnesses. The plant's screws leave
  the water as her stern rises: on the 1912 watch the tips break the surface at 12:19 am and the discs are clear before
  she goes.
- **The lights** burned until about 2:17-2:18; witnesses disagree on whether they faded or went out at once. The plant:
  2:16:24 am, the steam mains broken as she rises.

## 3. Links the record adds, not built

- **Emergency dynamos** (BACKLOG Y4): two 30 kW sets on D deck in the turbine room's casing, about 20 ft above the
  waterline, on steam from rooms 2, 3 and 5. They ran every night after sunset; the wireless fell back on them.
- **Stokehold fans** (BACKLOG Y5): the 12 fans that blew air to the stokeholds were electric. The dark would feed back
  into the steam. All 45 running fans were stopped by order within about the first hour.
- **Watertight doors** (BACKLOG Y2): 12 doors released from the bridge by electromagnets, so the bridge needs current;
  a float under each compartment and a lever at each door could also drop them.
- **Pumps** (BACKLOG Y3): all steam-driven, 1,700 tons an hour together; room 5 was kept dry by pumping until about
  12:40 to 1:10. The model floods room 5 at 11:56 pm because it has no pumps.

## 4. What it does now (measured, under M2's handling)

| Case | Result |
|---|---|
| At rest, engines stopped, hard over two minutes | heading 0, rate 0 |
| Hard over at Slow, Half, Full | rate rising with speed |
| Intact at 22.5 kn for an hour | 215 psi throughout; never limited |
| Boiler rooms 6 to 4 flooded at Full | three rooms out; the engines settle where the steam made equals the steam used |
| Reciprocating engine room flooded | engines and turbine stop; she coasts; the rudder still answers |
| Every fire drawn at Half | the engines stop, then the dynamos, then the steering gear; the wheel then moves nothing |
| The 1912 damage | dark at 2:16:24 am (the steam mains broken; witnesses about 2:18) |
| The 1912 damage, every fire drawn at once | dark at about 1:27 am: 20 minutes to draw the fires, then the auxiliaries' steam runs down |
| Four compartments open | lit after four hours |

The figures for each row are in `tools/systems_tests.js`'s and `tools/systems_site_test.js`'s output.
