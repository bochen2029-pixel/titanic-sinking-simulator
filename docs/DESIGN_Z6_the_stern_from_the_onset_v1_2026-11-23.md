# Z6 from the onset: why the stern floats, and what the break must open (v1)

Z1, 2026-11-23, at the coordinator's word (after D98's cascade: "Give the spaces the stern's flooding from the break
... as a what-if under K.air 'spaces' ... A short design note first"). Docs only. The build follows it.

## The finding

e117's spaces timing (member C, five ways, 3,106 s) left the stern afloat at 30 min, 181 m out, in every way. The
record has it under 1.5 to 3 min after the break (R5 5.2 and 10c; trial 13c's band). A five-minute probe of the
default watch, handed over at its onset on member C with `K.air` 'spaces', shows why:

- At the onset all 32 of the stern's spaces are dry (zones 8 to 15; the core's water is all forward of the cut). The
  stern holds 62,289 m3 of air against about 12,000 t in water.
- Through the cut (each space it crosses open to the sea over 0.6 of its section, `K.clear`), only the stern's part of
  boiler room 2 (zone 8) takes water. It sloshes in and out with her pitch, 8 to 42 %. Boiler room 1 (zone 9) reaches
  1 %; zones 10 to 15 stay dry.
- No boundary gives way: nearly level, the heads on her bulkheads stay far below their strengths (`K.headBulkhead` 15 m
  [bet], 8 to 30).
- So the stern rides like an intact ship, within 7 deg of level, its top 20 to 26 m above the sea, for the whole five
  minutes.

The spaces carry her air rightly. What they lack is the break's damage: the stern they are given is a whole ship with a
clean cut at one station.

## What the break must open

Three pieces of physics are missing, in order of their size.

**1. The torn length.** A hull that breaks in hogging fails over a length, not at a plane. B4's hinge yields over
Lh = 20 m [bet] (`S.hinge`, B1+B2). On the bed, the boiler field and the double bottom's pieces lie between the bow and
the stern (R5 1.1): the hull about the break was destroyed, not cut. Within that length her bulkheads and her shell are
open to the sea. On member C the cut is at x -10.93, inside boiler room 2:
- the bulkhead between boiler rooms 2 and 1 (x -16.15) lies 5.2 m aft of the cut, within Lh/2, so boiler room 1 opens;
- the next, between boiler room 1 and the reciprocating engine room (x -27.13), lies 16.2 m aft, outside it.

**2. The joint's pull** (gate 2 of B1+B2's B4 note, `docs/DESIGN_B4_the_joint_from_the_onset_v1_1_2026-11-23.md`).
While the ligament holds, the bow's weight pulls the stern's broken end down:
- her forward spaces go under, and water runs aft over the bulkheads' tops through the core's connections above E deck
  (already the spaces' openings);
- the heads on the next bulkheads rise toward their strengths;
- B1+B2's tear gives the openings to the sea by the joint's angle (`S.hinge(ship, x, 'hog').at(theta).open` and
  `.span`, per space in the core's node order). At 10 deg at the onset's station it is 13.97 m2 a side below E deck and
  36.29 above.

Today `K.air` 'spaces' with the joint throws ("not yet (M2)"). Lifting that is gate 2.

**3. The heads at the onset.** The failure model (`K.fail` 'boundaries', each space giving way once at its weakest link)
is not the gap. It only acts once 1 or 2 tilt her and load the next bulkheads.

## The what-if to build: `K.torn`

`K.torn`, m, default 0. Under it the engine is untouched to the bit: the trials' and night_after's hashes stand.

At a 'break' hand-over under `K.air` 'spaces', the hull within `K.torn`/2 of the cut is open from the hand-over on:
- every boundary of the piece (bulkhead, joiner work, E deck) whose centroid lies within `K.torn`/2 of the cut gives way
  at once, over `K.failShare` of its area, as `failBoundaries` opens one;
- every space of the piece with a box within it opens to the sea, as `failSpaces`' shell does (`shellOpening`);
- each is logged as a 'report' with boundary 'torn', at the hand-over's time.

The bets:
- `K.torn` 20 m, the hinge's Lh, which the debris field supports;
- the band's ends as what-ifs: 10 m, about one boiler room, and 30 m.

The cut's own faces stay as they are.

## The test

Member C from the onset, trial 14's five ways, `K.air` 'spaces', `K.torn` 20 (then 10 and 30):
- the stern's time under in each way, against the record's 1.5 to 3 min (CHECK);
- the default `K.torn` 0 to the bit (MUST: trials 18 and 19's hashes unchanged).

Cost: a spaces fall from the onset to the bed is about 9 CPU-min (e117's timing), so five ways are about 45. One process
at BelowNormal beside a gate, as the coordinator allows.

**If the stern goes under in the band in most ways,** the reduced spaces count (ten members) is worth a slot, as the
coordinator offered. **If not,** the joint with the spaces (gate 2, with B1+B2) is next. In both cases `K.torn` stays a
what-if until the count says otherwise.
