# G12, the way up: the cascade for option (a) (v1.2)

Z1, 2026-11-23. v1.2 of the options note (v1 and v1.1 stay beside it). Docs only: the plan for the cascade Bo chose.

**D98 (Bo, 2026-11-23, the ledger 14:27).** Asked: "For G12, go with Z1's option (a): hand her to the fall at the
break's onset?" Bo answered: "Yes, option (a)". This is G19's switch with the onset's own air:
- the 1912 watch hands over at B2's onset by default;
- the fall takes `K.airAt` 'flag' for an onset hand-over;
- 'centre' stays for the flag what-if.

It is its own cascade, after join 17 (the guide). Bo's three goals for the week come first, so no code before then.

**What it moves, on member C.** The watch ends at the break: T 156.46 after the touch (about 2:16:28), not the flag at
T 163.47 (about 2:23:28). From there both pieces land upright, in all five of trial 14's ways. Across the kept set that
holds for 30 of 30 members with the onset's own air (e117).

## The commits, in order

Each step is a branch of its lane. Each is gated on its own suites before the joint gate.

**0. The flag made explicit where the founder is wanted.** Owners: the mainline (night.js, the calibration's tools),
NH3/NH5's owner (the ensemble). These are neutral: no bit moves, and they can land before the switch, in join 17.
- `core/night.js` accepts `handover: 'flag'` explicitly. It is the default today.
- The harnesses that fit or measure the founder pass it, so the switch never reaches them (Bo's word on G19: "the end
  term fits the founder, the onset a check"):
  - `tools/history_match.js`, its watch;
  - `tools/calibrate.js`, `watchFounder(s)`;
  - `tools/ensemble.js`, which measures each member's founder and onset both.
- Test: their tables are unchanged to the byte (`history_match_tests`, the ensemble's table), and the gate is green.

**1. The fall's air at the onset (Z1).** `core/readers/fall.js`: a 'break' hand-over (the onset) takes `K.airAt` 'flag';
'centre' stays for the flag (rule H1). An explicit `K.airAt` still wins.
- It moves only the onset what-if's falls, and no fingerprint.
- Tests:
  - `fall_trials`: trial 13's and trial 14's onset rows, written;
  - `night_after_tests`: its 'onset' rows, written;
  - e117's count as a row: the watch's own onset, upright in all five ways.

**2. The switch (the mainline).** `core/night.js`: `handover` defaults to 'onset'; 'flag' is the what-if. Every watch
carries B2's check (`sim.night.onset`, D76 b), so it costs the onset's look on every watch.
- `Night.over`, the forecast's stop and `TitanicApp.gone(sim)` already read it.
- A watch that never reaches an onset hands over at its flag, as Z3's `over` already does.
- Tests: `night_tests` (the acceptance rows, re-read at the hand-over); `seams` and the core's suites unchanged (the
  core's step to the onset is the same, to the bit).

**3. The lanes, on the switch, side by side.**

| Lane | What changes | Its test |
|---|---|---|
| Z1 | `fall_trials`: trial 14's MUST is the watch's own fall at its onset, with the onset's own air. G12's row becomes a MUST: both pieces upright in all five ways at the watch's onset. The flag's five-way rows stay CHECK rows, the what-if's knife edge in sight. `night_after_tests`: the default section is the onset and the what-if section the flag, with G2's rows swapped with them. | both suites written; G12's MUST passes |
| B1+B2 | `strength_tests`: the onset table's watch rows are the default's, the flag's the what-if. `onset_site_test`: the default watch is the onset watch, and the address `handover=flag` gives the what-if. | both suites; onset_site in a browser slot |
| Z2 | The page: the end card's "She broke", the pill's "Breaking" and the forecast's "Breaks at" are the default (B-4's words are built; `gone(sim)` is built). `handover=flag` in the address gives the old end. The deep part, the director and the walk end on the hand-over. D97's ports follow `sim.fall.lights` from the break (G2). | night_end, deep, onset, director, walk, sound, systems, boats, reports and help site suites; layout_site (the end card's states) |
| The mainline | `systems_tests`: the 1912 fingerprint "at the end of her sinking" refrozen at the onset, as meant; the plant's last-minute rows (the 20-degree rule, the dark) read the 'flag' what-if. `night_site_test`: the canary's end, its fingerprint and the end card's clock (the hard-coded "2:2x am" strings: grep `tools/`). `world_tests`, `reports_tests`, `people_tests` and `calibrate_people` at the hand-over: each reader's end and counts, its fitted constant checked, refitted only if it moves. Carpathia (D(G12-d)): `tools/carpathia.js` ends on `N.over` and scores minutes to the hand-over (the break, or the flag where there is none), with `EVAL_VERSION` up, the search rerun (about 45 min at six threads, as D5's) and its note; `carpathia_tests` (its baseline is the watch's own end); night_end_site's Carpathia row. The gallery (`tools/gallery.js`): its outcome by `N.over` ("breaks at T", or "founders"), its rescue gap from the hand-over, the table rerun. | each suite written, its move named in the commit |
| U0 | `tools/record_night.js` ends on `N.over` and records the night's own fall from the break (rule 'break', the onset's air). `export_tests`: the record's end, fingerprint and fall. U3's tools (`u3_lights`, `u3_water`, `u3_smoke`) on the record's new end. | export_tests written; U3's checks |

**4. The joint gate (the coordinator).** The full gate, with `--write` only for the tables meant to move. The
refreezes are named in the commit: systems' fingerprint, night_site's, the export's, Carpathia's baseline. The papers:
- CLAUDE.md's fall paragraph: the watch hands over at B2's onset (D98), and the flag is the what-if;
- G12 and G19 in the BACKLOG, done;
- the CHANGELOG.

**5. The guide** (its owner). The pictures retaken (`guide_shots`), the account of the night ending at the break, and
the build.

## What stays the what-if

`handover: 'flag'`, in a watch's options and in the page's address, is today's watch, to the bit:
- the core carried on to its flag (rule H1), with 'centre' air;
- the plant's last minute (its 20-degree rule, the dark);
- Z9's roll, labelled, after the break (D(G12-c)).

Also on the flag:
- the calibration's harnesses (step 0);
- `fall_trials`' trial 12 (the preset at its flag) and trial 14's flag rows (CHECK);
- `night_after`'s flag section, with G2's flag rows;
- every preset: in this cascade a preset still hands over at its flag, and the page keeps (c)'s line for it. A preset's
  onset is a follow-up: B2's plain functions give it, and the girder part already holds it.

## Open points, with a proposal each

- **Joined or cut clean?** D(G12-a) proposed the onset joined (B4's milestone 1). e117 measured it cut clean, the
  reader's hand-over today. Proposal: cut clean by default, as measured. The joint stays the what-if until Z6's air goes
  with it.
- **The onset look's cost on every watch.** B2 looks every step only near the onset. Measure it once in step 2: one
  1912 watch's wall time against today's.
- **The physics' own check.** e117 with Z6's spaces (`--spaces`), after join 16's gate. If it falls short of 30 of 30,
  step 1 still lands, with 'flag' named as the stand-in until Z6.

## Done when

- The 1912 watch hands over at its onset by default.
- Both pieces lie upright in all five ways from it (a MUST in `fall_trials`).
- The forecast equals the watch to its end.
- Carpathia's baseline is the watch's own end.
- The page's end card reads the break.
- The export and U3 end at the break.
- The guide shows it.
- `handover: 'flag'` gives today's watch to the bit, and the calibration still fits the founder.
