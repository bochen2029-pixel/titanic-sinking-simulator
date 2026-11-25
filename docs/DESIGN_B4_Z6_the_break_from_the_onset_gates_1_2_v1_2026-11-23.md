# The break from the onset: the joint and the flooding through it, B4's gates 1 and 2 (v1)

Z1, 2026-11-23, at the coordinator's word: "Gate 1 ... and gate 2 ... are yours and are the same physics as Z6 from the
onset: design them as one note. Work it with B1+B2 directly." Docs only.

It goes with:
- B1+B2's plan, accepted for join 20: `docs/DESIGN_B4_the_joint_from_the_onset_v1_1_2026-11-23.md` (gates 1 to 6);
- Z6 from the onset: `docs/DESIGN_Z6_the_stern_from_the_onset_v1_1_2026-11-23.md`.

## Where things stand

- **Since D98** the 1912 watch hands over at B2's onset, and the fall reader cuts there: `begin(sim, { any: true, cut:
  found.x, rule: 'break', t0 })`. The pieces fall apart from the first sub-step, cut clean, with the onset's own air.
- **The joint (B4's milestone 1)** already runs as a what-if from the onset: trial 13, released at +15.0 s by shear on
  member C. B1+B2's sweep (gate 3, `out/joint_kept_1912.json`) shows it lets go in all 30 kept members, all by shear, in
  two modes:
  - 24 early, at 0.5 to 0.75 deg (14 to 15.3 s), nearly straight;
  - 6 late, at 45 to 49 deg (about 28 s), folded.
- **The spaces** (`K.air` 'spaces') cannot run with the joint: `begin()` and `join()` throw "not yet (M2)". From the
  onset, cut clean, they leave the stern a dry intact ship that rides level. With `K.torn` 20 it floods, stands up and
  then hangs on its sealed after compartments (Z6 v1.1).

## Gate 1: one station and one sense

- **The change.** One line in the reader's onset branch (`onStep`), behind a switch of the fall's own,
  `K0.jointOnset`. It is 0 until join 20, then 1:

  ```js
  begin(sim, { any: true, cut: found.x, rule: 'break', t0, hinge: K0.jointOnset ? { sense: found.sense === 'sagging' ? 'sag' : 'hog', Lh: 20 } : undefined })
  ```

  `begin()` already joins the hinge at the cut, since `join` takes its `x` from it. The flag hand-over keeps X_BREAK and
  no joint (rule H1, the what-if). Nothing in `core/night.js` changes: the night passes nothing to `begin()`.
- **Its rows** (`night_after_tests`, the default section, with `K0.jointOnset` 1):
  - `fall.eng.joint.xb === found.x`;
  - the joint's sense is the onset's;
  - the fingerprint through the fall is unchanged (gate 6).
- With `K0.jointOnset` 0, today's cut fall, to the bit.

## Gate 2: one tear

The pieces' flooding through the break reads the joint's own openings and nothing else: "It must not use a second
estimate" (gate 2's words). Under the spaces this needs four changes:

1. **The spaces step with the joint.** `subStepPair` steps each joined body's pocket but not its spaces. It takes
   `subStep`'s spaces call for each body, at its own pose, before the pair's iteration: `spacesStep(b, sp, R0, h)`,
   its air then the pocket over the sub-step. Both throws go.
2. **While the joint holds, the broken compartment opens only through the tear.**
   - The cut's faces (`openingsOf`'s ops at the cut) stand shut: the hull is still joined.
   - Each piece's half of each of the four spaces at the cut (port and starboard, below and above E deck) gets one opening
     to the sea: B1+B2's `S.hinge(ship, found.x, sense).at(theta).open`, by the joint's angle each sub-step, over the
     span `.span`.
   - Its area is shared between the halves by their share of the space's room [bet: B1+B2's "your call"], so the two
     halves together take the whole gap.
   - On member C at 10 deg that is 13.97 m2 a side below E deck and 36.29 above. Past the curve's end it grows linearly:
     1.42 and 3.63 m2 a degree.
3. **At the release** the cut's faces open, each piece's broken end to the sea as today's cut-clean fall has it, and
   the tear's last openings stand beside them ("until the pieces part far enough for it no longer to matter").
4. **`K.torn` stays a named what-if.** It opens the bulkheads and shell within its length about the cut, so it is a
   second estimate of the break's damage, beyond the tear's plane. It is not the default and not gate 2's.

**The default pocket.** With the pocket, today's default air, the pieces' air still leaves by milestone 1's stand-in
vent (labelled). Gate 2 is the spaces' path. Which air model becomes the fall's default is D(G12-e)'s own question, not
this one's.

**Its rows** (`fall_trials`, trial 13's form):
- under the spaces with the joint, every space's water within its room and its air not below 0 at every sub-step;
- the tear's openings equal `S.hinge`'s at the joint's angle, to rounding;
- the cut's faces shut while joined and open from the release;
- run twice, the same bits.

## Gate 5, Z1's: the release converges

Halving the fall's sub-step (`K.sub` x2, `K.subBed` x2) moves the release by less than one sub-step and never flips its
sense. That is trial 13's form, on the default path's loads, in `fall_trials`.

## What it then measures

Member C from the onset, the joint and the spaces, trial 14's five ways:
- the stern's time under against the record's 1.5 to 3 min (CHECK);
- both pieces' way up (MUST once the joint is the default, as G12's rows are today);
- in the six late members, the folded release: the bow's weight dragging the broken end down before it lets go, the
  joint's pull that Z6 v1.1 found missing.

If the stern still hangs, the cause is her venting (NH7, `docs/DESIGN_NH7_air_in_every_space_v1_2026-11-23.md`). That is
named, and kept out of join 20.

## Order of work, and who

| Step | Who | Done when |
|---|---|---|
| Gate 1's switch and rows (`K0.jointOnset` 0) | Z1 | its rows pass at 1; the default to the bit at 0 |
| Gate 2's spaces with the joint (the four changes) | Z1 | its rows pass; the spaces with no joint to the bit |
| Gate 5's convergence row | Z1 | it passes on member C |
| Gates 3 and 4 | B1+B2 | done: 0aa3310, 456f42a |
| The flip, `K0.jointOnset` 1, with trials 13, 4, 7, 10 and 14 rerun and the tables written | Z1, in join 20 | the gate, as B1+B2's v1.1 lists it |
| The deep part's "joined" readout | Z2 | deep_site |
