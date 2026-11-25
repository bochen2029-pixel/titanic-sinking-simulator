# B4's joint from the onset: what must hold before it is the default (v1)

2026-11-23, by the B1+B2 lane (the break's owner), at the coordinator's ask of 18:42. This is a review, docs only.

## Context

- G12's switch (D98, Bo: "Yes, option (a)") makes the default watch hand her to the fall at the break's onset. The
  flag stays as the named what-if.
- This lane's G12 note asked for "the onset, joined" (`docs/DESIGN_G12_the_break_side_v1_1_2026-11-21.md`, D(G12-a)).
  The switch lands the onset without the joint: the fall still begins cut.
- This note says what must be true before B4's joint becomes the default from the onset, and what it costs.

## 1. The joint as it stands

- **The law.** `S.hinge(ship, x, sense)` (`core/readers/section.js`) is the elastic-plastic hinge at a station. It gives:
  - against the angle between the parts, the joint's moment M(theta), the torn share, the work W, and the openings to
    the sea by space (`open`, `span`);
  - the ligament still holding: its tension capacity Nt and its shear capacity Vs.
  - The release rule: the joint carries min(its demand, M(theta)) and lets go at the first step where the force across
    it passes Nt (along her) or Vs (across her).
- **The engine.** `begin(sim, { hinge })` and `join(fall, hinge)` in `core/readers/fall.js` (Z6 inside B4, milestone 1)
  pin the two pieces at the break while the ligament holds. The constraint's force is solved at each sub-step's middle
  (e68). Without a hinge every fall is as before, to the bit (trial 13).
- **Trial 13.** Handed over at the onset on the 1912 orders, the joint lets go by shear 15.0 s after the onset with the
  onset's own air (Z1's step 1, `K0.airAtBreak`); it was 27.3 s before.
- **The coin's edge.** Whether it lets go in shear or in tension lies inside the model's uncertainty.
  - Join 7's figures: the double bottom's webs carry Vs 20.34 MN, against 19.61 MN of shear at the onset.
  - Britannic's 3/4 in girders give 19.93 MN (the girders' research, `18b4082`).
  - The side girders' count and riveting move it more than either.
  - This lane's standing rule, the coordinator's ledger of 2026-11-20: B4 prints the margin and the sense at release,
    runs the as-built ligament and the sourced alternatives as what-ifs, and never picks the sense that matches the
    record.

## 2. What must hold first: six gates

1. **One station and one sense.** The hinge stands at the onset's own station and sense (`found.x`, `found.sense`: on
   member C, x -10.93 in boiler room 2, hogging). The fall's cut must stand there too.
   - Today `begin()` cuts at the girder's X_BREAK, -23.0 (H1, an interim rule).
   - A joint at one station with a cut at another is two models of one break. Gate: on the onset hand-over the cut moves
     to `found.x`, or the joint is not built.
2. **One tear.** The flooding of both pieces through the break, Z1's next what-if, reads the joint's own openings,
   `h.at(theta).open` and `.span`. On member C at 10 deg that is 14.0 m2 a side below E deck and 36.3 above. It must not
   use a second estimate. While the joint holds, its angle sets the openings; once it lets go, the tear's last openings
   stand until the pieces part far enough for it no longer to matter.
3. **The release across the kept set.** On each of the 30 kept members (`out/kept_1912.json`), take the default watch to
   its onset, then the fall with the joint. For each member:
   - the release time after the onset, its sense (tension or shear), and the margin at release, each force over its
     capacity, both senses;
   - all as "k of N" with bands (D22).
   A member whose pieces never part before the bed is a finding to report, not a failure. The default stands only if
   the release happens in every member, or the exceptions are named and explained.
4. **The as-built ligament first, the sourced alternatives as what-ifs**, on member C at least. Each prints its release
   time, sense and margin:
   - the double bottom's girders by count and riveting (the girders' research, including Britannic's 3/4 in);
   - the joints at Stoney's period strengths;
   - the hinge's length Lh at 20 m [bet], against a web frame's spacing (9 ft) and a frame's (36 in);
   - the side shell's parting strain.
   The default is the as-built ligament, whatever sense it gives. No alternative is chosen because its sense or its
   pieces' landing matches the wreck.
5. **The release converges.** Halving the fall's sub-step moves the release by less than one sub-step and never flips
   its sense. That is e68's solver proof, repeated on the default path's loads; trial 13's form is enough.
6. **Nothing feeds back.** Past the hand-over the model stands still, so the joint moves only `sim.fall`: the watch's
   fingerprint, the onset and Carpathia's score at the break are untouched. The flag what-if keeps the cut fall, to the
   bit.

## 3. What it costs

- **Z1:**
  - on the onset hand-over, the fall begins joined: `begin(sim, { hinge: S.hinge(ship, found.x, found.sense) })`, cut
    at `found.x`;
  - trial 13 becomes the default path; trials 4, 7, 10 and 14 are rerun (the joint changes how the pieces fall
    together);
  - a kept-set sweep for gate 3: 30 members, each the watch to its onset (about 20 s) and the fall to the bed (about
    30 s). That is about 25 min on one thread, about 5 on six.
- **B1+B2:** gate 4's what-if table on member C (one experiment, about an hour) and the margin row in strength_tests.
- **Z2:** the deep part's readout says "joined" until the release, then the release's time and sense. The pieces are
  drawn as today, each at its own pose. deep_site.
- **U0:** the record's fall (`--fall`) carries the joint's state if the export wants it; the contract's version goes up
  only if it does.
- **The mainline:** none in core. `night.js` already hands over at the onset; the reader passes `found` to `begin`.
- **The join:** one full gate. The guide's chapters 06 and 10 change: ch. 10 says "The page does not use it yet".
- **Risk:** the shear's coin's edge can make the sense bimodal across the kept set, as G18 made the founder. Then the
  published fall carries two outcomes, each "k of N", never one.

## 4. Recommendation

- Make the joint the default from the onset only once gates 1 to 5 pass, in one join with Z1's flooding of the pieces
  through the break. Both read one tear, so they land together.
- Until then the default fall from the onset stays cut, labelled as such, with the joint the named what-if.
- Gate 1 comes first: until the cut stands at the onset's station, neither the joint nor the tear's openings belong to
  the break the onset found.
