# G12 reopened: the way up at the flag, the options (v1)

Z1, 2026-11-23, for the coordinator to put to Bo. Docs only. This note is the choice laid out: the fact, three options
with what each moves and costs, a recommendation, and the one measurement that would decide it. Background:
`docs/DESIGN_G12_the_break_side_v1_1_2026-11-21.md` (B1+B2: the onset as the faithful hand-over, what the switch moves,
decisions D(G12-a) to (e)), BACKLOG G12 (reopened at join 15) and G19.

## The fact

On stage D's landing (member C, Prohaska's a = 0.660), the way up depends on where the watch is handed over
(`tools/fall_trials.js`, trial 14, in five ways: as she is, heave rate x0.85 and x1.18, roll 3 deg to port and to
starboard):

- **At the flag (rule H1).** She is handed over at 68.8 deg by the head and 80.2 deg of list, on her beam ends.
  - The bow lands upside down in all five ways, about 1,600 m out, on the preset and on the watch alike.
  - The stern lands upright, about 215 m out.
  - It is a knife edge. With GM0 or the preset's build put back, the bow lands upright (e115). With the air placed
    where it lay at the flag (`K.airAt` 'flag'), the watch's bow lands upright in all five ways.
  - On a = 0.40 the watch's bow was upright as she is and upside down in 2 of 5. Before the landing both pieces were
    upright.
- **At B2's onset (the what-if 'onset').** She is handed over at 6.9 deg by the head and 3.8 deg of list, at x -10.93
  (boiler room 2).
  - Both pieces land upright in all five ways, under both placements of the air: the bow 1,470 to 1,490 m out (1,205 to
    1,211 with 'flag'), the stern 44 to 45 m.
- **Against the record's break**, T 157.0 to 158.6, 2:17 to 2:18:36 (the ledger's break_onset band):
  - the onset is T 156.46 on the watch (0.5 min before the band) and T 159.41 on the preset (0.8 min after it);
  - the flag is T 163.47 and T 165.70, 4.9 and 7.1 min after the band.
- **The wreck:** both pieces lie upright, the bow 772 m and the stern 148 m from the point under the break (R5 1.1,
  10a).

## The options

**(a) G19's switch: the onset as the default hand-over** (D(G12-a): joined on the onset's own step, with the flag as
the what-if and the fallback).
- *What moves* (B1+B2's list, section 1.3):
  - The watch ends at the break, 7.0 min before the flag on the watch, with its final fingerprint and its readers' last
    word. The readers end with the same counts.
  - The page's end card reads the break.
  - Carpathia's end and score: minutes to the break or the flag, whichever comes first (D(G12-d)), with
    `EVAL_VERSION` raised and the search run again, about 90 min.
  - The export's end and its fall.
  - The presets' hand-over.
  - Every pin of the 1912 watch's final fingerprint (systems, night_site, reports, people, world, export, carpathia,
    night_after), the fall's trials 12 and 13, the deep's and the end card's site suites, and the User Guide's
    pictures and its account of the night.
- *Already built and gated as the what-if:*
  - the onset as the watch's own check (D(G12-b), join 8);
  - the page's one `gone(sim)` and Bo's words, "She broke", "Breaking", "Breaks at" (B-4, join 13);
  - the fall from the onset, with its joint (B4's milestone 1);
  - her lights through it (G2, join 16);
  - the onset's rows in night_after_tests and onset_site.
- *What does not move:* the core's step to the onset, to the bit. Bo's word on G19 also holds: "the end term fits the
  founder, the onset a check". The history match keeps fitting the founder, with its watches kept on the flag
  (`handover: 'flag'`), and nothing fits the onset. The page then shows the break, which nothing fits, and no longer
  shows the founder the fit aims at. Her last moment becomes the stern going under, about 0.7 min after the onset on
  C. The record has the stern afloat 1.5 to 3 min after the break; that is Z6's milestone 2.
- *Cost:* one cascade, like stage D's, after D5. It edits `core/night.js` (the default), one of the six files D5
  hashes, so it cannot ride join 16. About a day of the lanes' work: the mainline, U0 for the export, Z2 for the page,
  the guide.

**(b) Z9: the core's last-minute roll.** After the onset the core carries one hull on to 69 deg by the head, and in her
last minute its roll runs to its clamp, 80.2 deg (W6 measured it; its design v1, sections 1, 2 and 5). That is why the
flag hands her over on her beam ends. From there the way up is a threshold in the list: at join 7 the bow righted
itself up to 82.7 deg and turned over beyond 83.0, a margin the landing's small moves have crossed.
- *What moves:* `core/core.js`, so this is class C: the 1912 watch's last minute, the founder the history match fits
  (so a refit), systems_tests' fingerprint, the references, and Carpathia (D5's hashed files).
- *Against it:*
  - D(G12-c), the coordinator's: "left as it is, labelled, after the break".
  - W6 (D61) called that phase "physics of a ship that did not exist": mending it makes a wrong hand-over less wrong,
    not right.
  - The physics of her last-minute roll is unsourced work.
- *Cost:* the largest of the three, and the most uncertain.

**(c) Leave it a CHECK, and say so in the page's words.** Trial 14's five-way rows stay CHECK rows, and G12 stays open.
The page names the reason where the bow comes to rest. A draft for Z2's deep part, Bo's words to approve: "The bow
rests upside down here: the model hands her to the fall on her beam ends at its flag. The wreck lies upright, and
handed over where she breaks, both pieces land upright."
- *What moves:* the words in the page and the guide only. Nothing in the model moves.
- *Cost:* minutes. But the default night keeps showing a wrong wreck, with an apology.

## Recommendation

**(a), in its own cascade right after D5 (join 17), with (c)'s words in the page until it lands; not (b)
(D(G12-c) stands).**

On member C the onset is the better hand-over on every count this note can measure:
- it is the nearer of the two to the record's break;
- it is the attitude she broke at, give or take her trim (the record's 10 to 17 deg, the model's 7);
- both pieces land upright from it, robustly, where the flag's way up is a knife edge;
- the switch's long parts are already built.

The flag survives as the what-if and the fallback for a watch that never reaches an onset.

## The one measurement that would decide it

**The way up from the onset across the history match's kept set.** Hand each kept member of `out/kept_1912.json` over
at its own onset, five ways and under both placements of the air, and count the members whose pieces both land upright:
k of N, in D85's words.
- **N of N:** the onset's way up is the model's, not one member's, and (a) settles G12.
- **Fewer:** the onset is a knife edge too. Then the fix is the pieces' own righting, the solids where the items are
  (D(G12-e)) and the air space by space (Z6), not the hand-over, and (c) holds until then.

Its cost: about ten minutes on six threads, or an hour on one. It is run after D5 (about 14:30) and needs no change to
any file.

## Sources

- `out/fall_trials.txt` on main cc96b35 (trials 12 to 14); `docs/research/experiments/results_2026-11-23/e115_d4_c_fall_attribution.txt`.
- `out/night_after_tests.txt` (the 'onset' rows); `out/ledger_1912.txt` (break_onset).
- `docs/DESIGN_G12_the_break_side_v1_1_2026-11-21.md` (sections 1.1, 1.3, 5 and 7).
- BACKLOG G12 and G19 on main.
- W6's design v1 (`docs/DESIGN_W6_the_lists_v1_2026-11-20.md`, sections 1, 2 and 5).
- R5, the wreck's survey (1.1, 10a).
