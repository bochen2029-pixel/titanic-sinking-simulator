# Her systems need each other: the plant (design v1)

2026-11-16, session ab71e668. Built the same evening, at Bo's ask; this note records what was built, the rules, the
numbers and their standing, and what is left out. Code: `core/systems.js`; tests: `tools/systems_tests.js`,
`tools/systems_site_test.js`.

## 1. The ask

Bo, 2026-11-16 evening, in short: systems that depend on each other, so that a failure cascades the way it would have
instead of being painted on. No turning without way on her ("not like a modern cruise ship that has an azipod"); how
fast she turns a function of how fast she goes; how fast she goes a function of the propulsion, which needs coal and
boiler rooms that are neither flooded nor damaged; an engine room flooded stops the engines; without the generators
"the ship goes dark"; the rudder needs power to move; screws in the air push nothing, whatever the telegraph says.
"Not ... fully 100% or study level ... something ... basic where it comes together."

Two corrections to the brief, from the record: her electricity came from steam-driven dynamos in their own room aft
of the turbine room, not from the turbine; and the rudder was moved by steam steering engines, worked from the wheel by
a hydraulic telemotor, with no electricity in the loop.

## 2. The chain

```
coal --> fires (six boiler rooms) --> steam pressure (a store) --+--> reciprocating engines (port, starboard) --> wing screws
                                                                  |        `--> their exhaust --> turbine --> centre screw
                                                                  +--> steering engines <--(telemotor from the wheel)
                                                                  |        `--> rudder
                                                                  `--> dynamos --> every light
water past the rudder (her way) --> the rudder's force           core/motion.js: already the physics
water in a room --> that room's machinery out                    read each step from core/core.js's levels
her pose --> a screw or the rudder out of the water              read each step from core/core.js's frame
```

`core/systems.js` reads the flooding core each step and writes what the machinery can do into `sim.mo.plant`
(revolutions available, turbine allowed, steering rate, each screw's immersion, the rudder's immersion);
`core/motion.js` obeys it. `core/night.js` attaches and steps it on every watch (before the encounter and motion step);
`site/app.js` attaches it to every preset and steps it after the core. Without the motion model (the presets) it still
runs the fires, the steam and the dynamos, so her lights are an outcome there too.

## 3. The rules

Each step, dt = 0.25 s:

1. **Fires.** A room's fires go out for good when water stands `furnaceAbove` over its plates (in 45 s, `quench`),
   when its stokers are ordered to draw them (`drawTime`, 600 s), or when its bunkers are empty (`burnOut`, 900 s).
   The steam made is `gen` = the lit furnace ends still burning over all lit at the start (1 when intact).
2. **Demand.** `demand = aux + (1 - aux) * (|nP|^3 + |nS|^3) / (2 * nSteam^3)`: the engines' power as the cube of
   their revolutions, the auxiliaries (dynamos, steering, pumps) a fixed share.
3. **Pressure.** `p += (gen - demand) * dt / store`, held at 1 (the safety valves) and 0. Past 20 degrees of trim the
   boilers and mains give way and `p` falls to nothing in `breakTau`.
4. **Engines.** Revolutions available `nMax = 80 * cbrt((p - pEngine) / (1 - pEngine))`, 0 below `pEngine`, 0 when
   water reaches the crankshafts. An order within `nMax` passes untouched (the intact case, to the bit).
5. **Turbine.** On the engines' exhaust as before (Half or Full ahead, both engines above 40 rpm), and only while its
   room is dry at its axis.
6. **Steering.** The steering engines move the rudder at `(p - 0.25) / (100/215 - 0.25)` of their rate, full from
   100 psi, nothing below 25 % of working pressure: then the rudder stays where it is.
7. **Dynamos.** Running while `p > pDynamo` and their flat is dry: her lights.
8. **Screws.** Each screw's thrust times the share of its disc under water (a disc cut by the surface).
9. **Rudder.** Its force times its area under water over its area at the night's draft aft, through the outline traced
   in R1, once her stern has risen `slack` above that draft.

As the pressure falls the main engines drop out first (`pEngine` 0.35), then the dynamos (0.30), then the steering
gear (0.25): the big consumers go first, as the engineers kept the lights to the end on the night.

## 4. The numbers

| Number | Value | Standing |
|---|---|---|
| Boiler rooms | six; 6 to 2 five double-ended boilers each, room 1 five single-ended | read (The Shipbuilder 1911) |
| Lit on the night | rooms 6 to 2 all ends; room 1 cold | PENDING RESEARCH |
| Working pressure | 215 psi | read (fact sheet section 3) |
| Service maximum | 78 rpm (83 recorded) | read (fact sheet section 3) |
| Revolutions at full pressure | 80 rpm | bet |
| Store | 300 s of full demand | bet |
| Auxiliaries | 4 % of full steam | bet |
| Steering engines | full rate from 100 psi | read (steering fact sheet); the 25 % floor a bet |
| Engines' floor, dynamos' floor | 35 %, 30 % of working pressure | bets |
| Furnaces | 1 m over the plates; out in 45 s | bets |
| Crankshafts, turbine axis | 3.80 m, 4.82 m above the keel | measured (R1) |
| Dynamo flat | 1 m over the electric engine room's floor | bet |
| Coal aboard, burn | 3,400 t; 650 t a day at full firing | PENDING RESEARCH |
| Drawing fires, burning out | 600 s, 900 s | bets |
| Rudder slack | 0.5 m | bet |
| Break-up | 20 degrees of trim, steam gone in 10 s | bets |

## 5. Neutral when intact

With nothing failed the plant must change nothing, so that no calibration moves:
- an order within the revolutions available passes as the very same number (`limited()` returns its argument);
- a screw is `1` exactly until a blade tip breaks the surface;
- the rudder's share is `1` exactly until her stern has risen half a metre over the night's draft aft;
- full steam holds 78 rpm, above the watch's 76.2.

`tools/systems_tests.js` runs 20 minutes of turns, astern, ahead and one shaft alone with the plant and without: the
same bits. `tools/astern_tests.js` still matches the 1912 watch's frozen digest (d2fcfe1c at 387 steps). The 1912 watch
with and without the plant first parts at 7.8 minutes, when her rising stern has taken 0.003 % of the rudder's area.

## 6. What it does (measured)

| Case | Result |
|---|---|
| At rest, engines stopped, hard over two minutes | heading 0, rate 0 |
| Hard over at Slow, Half, Full | 0.23, 0.51, 0.76 degrees a second |
| Intact at 22.5 kn for an hour | 215 psi throughout; never limited |
| Boiler rooms 6 to 4 flooded at Full | three rooms out; 124 psi; 56 rpm; 16.6 kn |
| Reciprocating engine room flooded at Full | engines and turbine stop at 1.6 min; she coasts; the rudder still answers (32 degrees in 8 s) |
| Every fire drawn at Half | engines stop, then dark at 21.5 min, steering lost at 27.8 min; the wheel then moves nothing |
| The 1912 run at 157 min, Full ahead | screws 0 % under water; no thrust |
| The 1912 damage | dark at 2:16:24 am, the mains broken as she rises (witnesses: about 2:18) |
| The 1912 damage, every fire drawn at once | dark at 1:18 am for want of steam |
| Four compartments open | lit after four hours |
| The 1912 watch | screw tips at the surface 12:19 am (1.9 degrees); half out 1:31; clear 1:57 |
| Coal for 15 minutes of full firing at 22.5 kn | bunkers empty at 16.1 min; the engines short at 20.9 min |

## 7. The viewer

A Systems tab (between Bulkheads and Evidence): each link with a state dot and what it is doing now; the boiler rooms
with their fires and coal and a Draw button each; Draw every fire; the coal option. Under the Bridge's revolutions, the
steam: "215 psi", "186 psi · short" when she cannot make the order, "too low", "no steam". The plant's losses are news
on the bridge (a room flooded, the engines short, the steering gone, the screws breaking the surface). Her lights go out
when the dynamos stop, with the reason.

## 8. Left out

In `BACKLOG.md` section 2b: Y1 blowing off at the safety valves (the roar after the engines stopped); Y2 the watertight
doors' electric release from the bridge, and their floats; Y3 the pumps; Y4 the emergency dynamos. Also left out: the
turbine's condensers and vacuum, the feed water, a boiler bursting as cold water reaches it, and the fire in the
bunker between rooms 6 and 5.
