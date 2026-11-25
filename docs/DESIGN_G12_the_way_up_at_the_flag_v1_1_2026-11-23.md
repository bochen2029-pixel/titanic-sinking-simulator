# G12 reopened: the way up at the flag, the options (v1.1)

Z1, 2026-11-23, for the coordinator to put to Bo. Docs only. v1.1 of the note of the same day
(`docs/DESIGN_G12_the_way_up_at_the_flag_v1_2026-11-23.md`, which stays beside it). This version adds v1's one
measurement, run (e117), and revises the recommendation by it.

## What changed from v1

The measurement ran (e117, 14:16 to 14:22, six jobs, on main 29c4786's model). From the onset, both pieces land upright
in all five ways in 26 of 30 kept members with the default placement of the air ('centre'), and in 30 of 30 with the
air where it lay at the hand-over ('flag'). By v1's own rule, the onset alone does not settle G12: what turns the bow
from the onset is where the air sits, not the member. The recommendation becomes (a) with the onset's own air.

## The fact (v1's, in short)

- At the flag (68.8 deg by the head, 80.2 deg of list, on her beam ends), member C's bow lands upside down in all five
  of trial 14's ways, on the preset and the watch. It is a knife edge: GM0 or the build put back rights it (e115).
- At B2's onset, member C's pieces land upright in all five ways, under both placements of the air.
- On C the onset is the nearer of the two to the record's break (T 157.0 to 158.6): it falls 0.5 min before it on the
  watch and 0.8 min after it on the preset. The flag falls 4.9 and 7.1 min after it.

## The measurement (e117)

`docs/research/experiments/e117_g12_onset_way_up_kept_set.js`; its results are in
`results_2026-11-23/e117_g12_onset_way_up_kept_set.txt`.

**How.** Each of the 30 kept members of `out/kept_1912.json` is run as `tools/history_match.js` runs its 1912 watch: its
configuration, its params, the kept area constant and its split, its bunker opening and its coal list. It is handed over
at its own onset and let fall in trial 14's five ways, under both placements of the air. The reconstruction was checked
on m00: with D89's trace off (the step the match ran) its watch reaches its flag at the kept T 163.4471 to the bit. On
today's model, with the trace on, it reaches it 0.5 s later.

**The onsets.**
- Every member's is at x -10.93 (boiler room 2, hogging), 6.8 to 7.6 deg by the head, with 0.9 to 11.4 deg of list to
  port.
- They come at T 147.0 to 163.9 after the touch: 1 of the 30 inside the record's band, 17 before it, 12 after it.

**The way up.**
- The default air ('centre'): 26 of 30 members have both pieces upright in all five ways. Four bows turn:
  - m02: down in 1 of 5 (roll 3 deg to port);
  - m06: on her side in 4, down in 1;
  - m16: down in 3, on her side in 2;
  - m27: down in 4.
- Member C, run as the match ran it (m19; its split is 0.08, where the landing holds it at 0, D85), is upright in all
  five ways.
- The air where it lay at the hand-over ('flag'): 30 of 30.
- The stern is upright in all 300 falls.
- Where they land:
  - the bow 1,170 to 1,290 m out with 'flag', and 329 to 1,600 m with 'centre' (the 329 is m06's bow on her side);
  - the stern 3 to 141 m;
  - the wreck's: 772 and 148 m.
  The places are the untuned lever's (D49, which trial 7 fits), not this note's question.

**What it says.** From the onset the bow's way up turns on where the air sits. Both placements are stand-ins for Z6's
spaces: one point fixed in her, right at one attitude only (fall.js, trial 14's note).
- 'centre' carries the pocket's lift through each slice's floodable centre, near her middle height, close to her centre
  of mass. So the air rights her only weakly. It became the default at join 7 for the hand-over at the flag,
  where she lies on her beam ends and the air at the flag sits low in her section, so freezing it there turned her over.
- At the onset she is near upright (about 7 deg by the head, 1 to 11 deg of list). There her air lies in the tops of her
  dry spaces, which is where 'flag' puts it, high in her, and it rights her firmly; 'centre' is the one that misplaces it.
- The choice follows the hand-over's attitude, not the record, and Z6's spaces, right at any attitude, will replace both
  stand-ins.

## The options (v1's, with (a) amended)

- **(a) G19's switch: the onset as the default hand-over, now with the onset's own air.** For an onset hand-over the
  fall takes `K.airAt` 'flag'; 'centre' stays for the flag what-if.
  - What moves: as v1 lists it (B1+B2's section 1.3): the watch's end, the page's end card, Carpathia's end and score
    with its rerun (D(G12-d)), the export, the presets, the references and the guide. To that list add the fall's
    default air at the onset, which moves no fingerprint: the fall comes after the hand-over.
  - Cost: one cascade after join 16. It edits `core/night.js`, one of D5's hashed files.
- **(b) Z9, the core's last-minute roll.** As v1: class C, against D(G12-c), the largest cost and the least certain.
- **(c) Leave it a CHECK, with the page's words.** As v1, with its draft line for Z2.

## Recommendation (revised)

**(a) with the onset's own air, in its own cascade after join 16 and the guide; (c)'s words until it lands; not (b).**

By e117, (a) with the air where the hand-over has it settles G12 across the kept set: 30 of 30 members with both pieces
upright in all five ways. With the default air it would not: 26 of 30.

## The next measurement: the physics' own check

Run the same kept set from the onset with Z6's spaces (`K.air` 'spaces': the air space by space, right at any attitude;
it supports the cut-clean hand-over).
- If it also counts 30 of 30, the stand-in and the physics agree, and (a) can land with either.
- If it counts fewer, the spaces' own way up is the next question, and (a) lands with 'flag' as the labelled stand-in.

Its cost is to be timed on one member first: the spaces cost several times the pocket a step. It runs after join 16's
gate.

## Sources

- e117 and its results (above); v1 of this note, with its sources.
- `out/fall_trials.txt` on main (trial 14) and e115's results (the flag's knife edge).
- `docs/DESIGN_G12_the_break_side_v1_1_2026-11-21.md` (what the switch moves; D(G12-a) to (e)).
- BACKLOG G12 and G19.
