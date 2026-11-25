# Z6 from the onset: why the stern floats, and what the break must open (v1.1)

Z1, 2026-11-23. v1.1 of the note of the same day (`docs/DESIGN_Z6_the_stern_from_the_onset_v1_2026-11-23.md`, which
stays beside it). This version adds the first build, `K.torn`, its result, and what it shows is still missing.

## What v1 found, in short

Handed over at the onset on member C with `K.air` 'spaces', the stern is a dry, intact ship:
- all 32 of its spaces are dry, holding 62,289 m3 of air against about 12,000 t in water;
- only its share of boiler room 2 takes water through the cut, sloshing in and out;
- no boundary gives way, and it rides within 7 deg of level.

The record has it under 1.5 to 3 min after the break (R5 5.2 and 10c).

## The build: `K.torn`

`core/readers/fall.js`, `tornOpen`. At a two-piece hand-over under the spaces, the hull within `K.torn`/2 of the cut is
open from the hand-over on:
- each boundary whose centroid lies there gives way over `K.failShare` of its area;
- each space with a box there opens its shell to the sea;
- the counts are kept in `b.spc.torn`.

`K.torn` 0, the default, is the engine to the bit. `core/readers/spaces.js` now exports `shellOpening`.

## Its result: member C from the onset, as she is, `K.torn` 20

At the hand-over the stern's torn length opens 6 boundaries and 8 shells; the bow's opens 2 and 4.

| After the break | The stern's pitch (broken end down) | Its top above the sea | Its air | Flooded (by zone) |
|---|---|---|---|---|
| 15 s | 4 deg | 22 m | 58,800 m3 | boiler rooms 2 and 1, about 37 % |
| 60 s | 17 deg | 28 m | 38,500 m3 | both boiler rooms full; the reciprocating engine room 83 % |
| 4 min | 37 deg | 40 m | 30,900 m3 | the engine room full; the turbine room 58 % |
| 5 min | 67 deg | 51 m | 28,900 m3 | the turbine room 73 % |
| 9 min | 85 deg | 45 m | 25,600 m3 | the turbine room 83 %; zone 12, 29 % |
| 15 min | 86 deg | 31 m | 20,700 m3 | zone 12, 65 %; zones 13 to 15 still dry |

So the torn length does what the witnesses saw, in their order. The stern's forward compartments flood one after
another, its broken end goes down, and it stands up to near vertical.

But it then hangs there:
- at 15 min it is still afloat, its top sinking about 2 m a minute;
- its after compartments (zones 13 to 15) stay dry and sealed;
- the record's 1.5 to 3 min is not met.

The time is also slower than the record's while it stands up: 5 min to 67 deg.

## What is still missing

1. **Her venting as she stands.** A real stern that stands up lets its air out at the top and the sea in from below:
   - the engine rooms' skylights and the fourth funnel's casing over them;
   - the after hatches and the staircases.

   The spaces hold the core's openings, and the core has none of these over her machinery spaces. So her after
   compartments keep their air sealed, and she hangs. This is the next physics, and it needs its sources first (the
   skylights' and the casing's areas, from the deck plans: R3's reading).
2. **The joint's pull** (gate 2, with B1+B2). B1+B2's sweep (`out/joint_kept_1912.json`): in 24 of 30 kept members the
   joint lets go at 0.5 to 0.75 deg (14 to 15.3 s), nearly straight; in 6 it holds to 45 to 49 deg (about 28 s), folded.
   While it holds, the bow's weight drags the broken end down, which would shorten the stern's stand-up. The tear's
   openings by angle are B1+B2's (`S.hinge(...).at(theta).open`).
3. **The heads at the vertical.** Standing, the stern's bulkheads carry the flooded compartments' water over the dry
   ones. At the band's `K.headBulkhead` 15 m [bet] they held here: zones 13 to 15 stayed dry. The loads they carried
   were not printed: the next run prints them. The band's ends (8 and 30 m) are this build's next what-if, to say
   whether her after bulkheads give way as she stands.

## What follows

- `K.torn` stays a what-if, default 0. The design's own rule holds: the stern does not go under in the band, so the
  reduced spaces count does not yet earn its slot.
- Next, cheapest first:
  - (3) the heads' band at `K.torn` 20: two runs, about 10 CPU-min each;
  - then (1), her venting, once R3's plans give the openings;
  - (2) with B1+B2, as gate 2.
