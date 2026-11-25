# The calibration epoch, v1.2: stage D as Bo answered it, and the landing step by step

- **Written:** 2026-11-21 12:20 CST, by the mainline (Claude Code 74cc0d65, Opus 5.5), after Bo's answers to stage D's
  questions (11:2x, through the coordinator) and his "B1 NOW, then D's design".
- **Status:** a plan. Bo decided the four answers it records. The coordinator sequences the joins. Nothing here is
  turned on until D4's commit.
- **Supersedes:** `docs/DESIGN_calibration_epoch_v1_1_2026-11-21.md` only where this file says so. v1.1 stands
  otherwise (its sections 3 to 9), and stays unchanged.
- **Lineage:** v1 and v1.1 (2026-11-21, D77). B1 is `wt/epoch-b1` 7a22b31, join 12. The harness is `wt/epoch-d`
  2ea5e52.

## Changes in v1.2

1. **Bo's answers** (his words are in the coordinator's ledger):
   - E-3 is option 1.
   - B1 is a go.
   - The end term is the founder, with the onset as a check, fitted LOOSELY: "It doesn't have to be precise to the
     minute ... It's more about the physics and the dynamics and the invariants themselves ... historically, we only
     have one exact data point".
   - `levelRate` is a named bet at 2 a second.
   - The public words: yes, at D's landing.
   - D84: desktop first.
2. **B1 as built** (v1.1's stage B changed). The design's M3 failed: V8's own pow is not fdlibm's on Node v26.13.0 (4.5 %
   of inputs differ, by one ulp). The proof runs the old code with `C.pow` itself put in `Math.pow`'s place
   (`tools/pow_preload.js`, `node -r`), and every pin frozen from an older commit was refrozen from its own commit that
   way (e107; 7a22b31's message).
3. **The fit is loose** (v1.1's 5.1 to 5.4 changed):
   - every time-like row's sigma is at least 10 min;
   - the watch's founder band is 150 to 170 min after the touch, not D73's 157 to 160;
   - the cut-offs stay 3 and 2.5, and all four are flags of the harness;
   - the invariants are hard filters, not scores: conservation within 1e-5 m3 on every run, and the eight binding
     validation cases on every set whose watch is in the band.
4. **The coal list is sampled** (v1.1's section 4 and M4 changed). `coalListDeg` is 0.5 to 3 [bet]. e103 had read it
   as 0 because it set it in params, which the preset's own 2.0 overrides (the erratum; e103 rerun on the fixed
   script). It is the lever on the change of side: without it nothing was kept.
5. **The polish is dropped** (v1.1's 5.4 and D2 changed). The landed member is not polished by Nelder-Mead. A polish
   chases minutes, which Bo's answer puts second. `tools/calibrate.js` instead checks that the landed numbers are a
   kept set: each group's I, the watch in the band, the invariants. It fits nothing.

## The answer in one paragraph

After join 12 (B1) lands, the history match runs once, with every stage C switch on (`--d4`): 2,000 preset runs over
the whole box, 2,000 in the kept box, the watch on 200 kept sets, the invariants on those in the band. It writes the
kept set, 30 members by maximin. One member is landed: the one with the smallest largest implausibility, from those
whose watch stands at least 0.2 min inside 150 to 170, with no input within 2 % of a bound and with the split near
Hackett and Bedford's. Its numbers are rounded to four figures, and the rounded set is run again and must still be
kept. D4 is then one commit that turns every switch on and writes those numbers, followed by one cascade and one
gate. D5, the Carpathia rerun on the kept set, follows in its own join.

## 1. The run (D3)

- **Where:** a fresh worktree on join 12's main, with 2ea5e52 (the harness) and e103's results on top. The progress
  is named by a hash of `core/` and the ledger, so it must run on the landed core.
- **Command:** `node tools/history_match.js --n1 2000 --n2 2000 --n3 200 --jobs 6 --d4`, at BelowNormal (the harness
  sets it).
  - About 1.8 h on an idle machine; twice that beside a suite.
  - The browser takes virtual-clock suites only while it runs (D83; the coordinator's order).
- **If wave 1 keeps more than a fifth of its sets,** the harness stops there, as v1.1's 5.3 says. The bands are then
  too loose to inform, and the next step is `--tsigma` 5 on the same progress, which costs no runs.
- **If it keeps nothing,** the group table names the ruling group. That goes to Bo before any band is widened.

## 2. The landed member (D4's numbers)

- **Chosen from `out/kept_1912.json`.** The member with the smallest largest I that meets all of:
  - its watch at least 0.2 min inside each wall of 150 to 170 (three times the noise floor);
  - no input within 2 % of its range's ends;
  - `split` at most 0.05.
- **Why the split must be near 0:** a split away from Hackett and Bedford's moves `ICE.openAlong`, and `CLAUDE.md`
  then asks for e89's refit of its factors. The harness's first-order scaling (its B6) is not that refit. If no
  member has a split this small, the landed one takes split 0, is run again, and must still be kept (or the choice
  goes to the coordinator).
- **Rounded:** each number to four significant figures, then the preset, the watch (with its own area constant) and
  the eight cases are run again. It must still be kept, and stay 0.2 min inside the band. If rounding breaks either,
  the next member by I is tried.

## 3. D4: the one commit

Every switch on, and the member's numbers, together:

| What | Where | From | To |
|---|---|---|---|
| syncMass reads every body of water | `core/motion.js` `SHIP.massPockets` | 0 | 1 |
| the engineers' lead by inflow | `core/systems.js` `PLANT.leadRule` | 0 | 1 (`leadRatio` 3 joins GUESSES) |
| a full space weighs its capacity | `params.weighOverfill` | 1 | 0 |
| G11's three doors gone | `params.g11Doors` | 1 | 0 |
| her side's openings | `params.sideOpenings`, `sideStrength` | 0, 1 | 1, landed (joins GUESSES) |
| her hull's ends | `C.buildShip`'s `hullEnds` default | 0 | 1 |
| the flow numbers | `aDown`, `fOpen`, `zMergeHold`, `peakVent`, `GM0` | 0.2786, 0.02087, 4.6, 0.008, 0.80 | landed |
| the bunker | `bunkerBurst`; the preset's and the watch's `bunkerOpen` | 13.0; null | landed, both |
| the opening | `SC.CALIBRATED_AREA`; `ICE.alpha` (calibrate_encounter) | 0.7506 | landed; its fixed point |
| the coal list | `DEFAULT_PARAMS.coalListDeg`, the 1912 preset's build, `night.js`'s spec default, `tools/encounter_run.js`'s default | 2.0 in all four | landed, in all four at once |

Unchanged:
- `wMul` 1.1 and the other frozen inputs (the harness's FROZEN list);
- `levelRate` 2;
- the seams gate's `GATE_PARAMS` and `GATE_SHIP`, which already pin every switch off. `seams` must PASS unchanged on
  D4's commit.

## 4. The cascade, in order (v1.1's D4 list, with what has been learned since)

1. `node tools/calibrate_encounter.js` (the area constant at the landed opening), then the encounter and night
   suites.
2. `node tools/astern_tests.js --freeze`, which is meant: say so.
3. The fingerprints:
   - `systems_tests`' BASE and `carpathia_tests`' copy;
   - `pocket_tests`' and `stairs_tests`' rows that hold today's defaults (not the old-commit pins: those hold their
     commits);
   - `hull_ends_tests`' at-1 rows (the at-0 rows stand).
4. `golden`, `validate` (with "k of 30" beside each verdict), `conserve_tests`, `ledger_tests`.
5. The readers fitted to the watch:
   - `WRECK_1912` (`world_tests` prints it);
   - `node tools/calibrate_people.js`;
   - `reports_tests`' constant;
   - B1+B2's girder `a` refit and RECORD remeasured (`PRE_D4` in `girder_tests` lists what moved);
   - the strength onset table reread.
6. `tools/calibrate.js` as the check of section 5's change, not a fit. `watchFounders`' two branches go (one watch,
   now that C2 is on).
7. `node tools/build_site.js`, then the full gate with `--write`, in the coordinator's browser turn. The browser
   rows that type in the model's numbers move here. Their lists are in the mainline's 11:10 handoff, section 4:
   - systems_site's 215 psi, the coal times, the dark window and BR4's rate;
   - help_site's rocket counts and "1,500 miles";
   - night_end_site's founder bound (150 to 165, which becomes the band) and "2:18 am";
   - sound_site's "plunge" at 9,380 s, which moves with the founder;
   - reports_site's mail-room times and T 26.
8. The page's callers of `C.halfBreadth` without the hull (C3's commit lists them; Z2 and U0) see the ends once
   `hullEnds` is 1. `TS.hullDraw` must not lie inside the model's hull (CLAUDE.md's topsides rule): Z2's step, in the
   same join or the join before.
9. The wake's bake (`node tools/wake_spectrum.js --bake`) after `halfBreadth` changes, then `wake_tests`.

D5 follows in its own turn: the Carpathia search on the kept set, about 90 min, as v1.1's 5.5 describes.

## Decisions needed (who decides)

1. **Whether section 2's split rule stands.** The mainline's advice is yes. The alternative is e89's refit in the
   same landing, about an hour. The coordinator decides, or Bo.
2. **Whether the public words go out at D's landing with "k of 30".** Bo said yes. The wording is the coordinator's.

## Risks

- **The kept set may hug a bound:** the coal list did (B15) until its range was opened. The harness reports it, and
  section 2's 2 % rule keeps the landed member off it.
- **The watch's bimodality is gone only with `leadRule` 1.** The watch's band check therefore assumes `--d4`. Running
  with today's switches keeps G18's branch noise.
- **Two moves of every lane's pins, B1 then D4.** B1's are done. D4's are the cascade above.

## Sources

- v1.1 sections 2, 5 and 9. The harness's header (B1 to B15). e103's results (rerun). e107's results.
- The smoke of 2026-11-21 12:1x: 24 sets on each switch set; 2 and 1 kept.
- The handoffs of 11:10 (section 4's site lists) and 11:30.
