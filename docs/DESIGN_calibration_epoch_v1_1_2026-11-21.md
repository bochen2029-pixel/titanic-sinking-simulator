# DESIGN: the calibration epoch (G17), v1.1

- **v1.1 written:** 2026-11-21 02:01 CST (clock), by the mainline (Claude Code 74cc0d65, Opus 5.5), at the coordinator's
  correction of 01:5x: "Put nodeAov and the pockets' aov into the epoch's Stage C or D review explicitly, with this
  number, alongside QC A's convergence work."
- **Supersedes:** `DESIGN_calibration_epoch_v1_2026-11-21.md` (9640b91), which stays as written. D77 approved v1; v1.1
  only adds the item below.
- **Written (v1):** 2026-11-21, 01:06 to 01:16 CST (clock read with Get-Date at 01:06, 01:11 and 01:15), by a Fable
  subagent of the mainline session (Claude Code 74cc0d65).
- **The ask:** the coordinator's order of 23:3x CST, 2026-11-20: "After the Carpathia rerun, your next big item is THE
  CALIBRATION EPOCH (QC item 1): a design first, as with G7, and no code before I've seen it." Its items: A-1, A-2, E
  (the ledger, Cd×A, history matching), E-3 with both options for Bo, E-2, and G14, G10 and G2 inside with ONE refit.
  Since then, from G7's landing: G18's doctrine and A-6's syncMass.
- **Reviewed:** by the mainline (Claude Code 74cc0d65, Opus 5.5), 01:16 CST. Its review and its picks for the
  mainline's decisions are the last section. One claim was checked there: Node v26.13.0's V8 has the flag B1's proof
  needs.
- **Status:** advice only; nothing here is a decision.
- **Supersedes:** none.
- **Lineage:** QC_00, QC_A and QC_E (Z2's audits, 2026-11-20); BACKLOG G17, G14, G10, G2, G11; the coordinator's
  ledger D62, D69 to D76; `docs/research/RESULT_G7_ladder_v1_1_2026-11-21.md`; the mainline's handoffs of 23:36 and
  01:05. The repository as read: `C:\temp\titanic-wt-g7` at cbd6e1c (G7's landing, on its way to join 7).
- **Tags:** [measured] with who measured; [read] with where; [derived] with the arithmetic or an abacus receipt;
  [bet]. No run was made for this design: the machine was in join 7's gate. Every number that needs a run names it.

## Changes in v1.1

- **A new item, the full space's virtual over-fill:** M5 in Stage 0, C5 in Stage C, and a risk.
  - The device: a full space (`nodeAov`) or a full pocket (`aov`, `params.bunkerAov` 1.0 m²) is pressed up past its
    capacity by the sea's head over its top, onto a stiff virtual area. The excess is counted as water aboard.
  - Z2's rooms_tests on join 7's core finds G7's tank 82.44 m³ over its 322.65 m³ near her end [measured: Z2, relayed
    by the coordinator, 01:5x]: 1 m² times a head over its top near 80 m as her bow goes deep.
  - Water's compressibility at that depth would give about 0.12 m³ [derived: 1025 × 9.80665 × 82 / 2.2e9 × 322.65 =
    0.121 m³; the units checked, abacus1:4ffffbedd946]. So the device carries about 80 m³ (about 84 t) of counted water
    with no place: about 0.08 % of her water, all at her bow, in her last minutes.
  - The mainline had told the coordinator "about 9 t at most", from a snapshot at another moment. That was wrong.
- **The mirrors' rule stands:** place min(vol, cap), count vol. Z2 has folded it in.

## The answer in one paragraph

Run the epoch as four stages on one branch, and move the frozen references exactly twice. Stage A changes no bit:
`levelRate` with its half-step row, the observation ledger as data with a CHECK-only table, and the noise ensemble.
Stage B is arithmetic only: the model's own `pow` at every `Math.pow` of `core/core.js`, and the one seams refreeze,
made from git ef60334 itself with the new routine, so the reference stays the pre-seams core's. Stage C builds the
physics dark: syncMass through the core's water, G18's doctrine, the hull's ends, the stem and G2, each behind a
switch whose off value is the core before it, to the bit, so the seams gate passes untouched at every commit. Stage D
is the calibration: the score reads the ledger (each witness once, one-sided where the source is), the opening is
fitted as Cd×A, `wMul` leaves the fit, and a history match keeps every parameter set the ledger can't rule out. One
member of the kept set lands, with every switch turned on in the same commit: that is the ONE refit and the second and
last move of the references. The validation table and the Carpathia search then read the kept set, so a verdict is
"k of 30" and not one point. Three things need Bo: the list target (E-3), his word on the seams refreeze, and what the
founder term fits (D76's deferred hand-over question).

## 1. Where the model stands (2026-11-21, cbd6e1c)

- The landed numbers: opening 0.8196 m², `wMul` 1.1 on its bound, `aDown` 0.2786, `fOpen` 0.02087, J 8.23; the preset
  founders at T 158.28, the watch at T 158.95 as it is and T 157.16 with no pumps led [measured: the mainline, the
  ladder note v1.1, section 1].
- The score has 17 terms: 7 trim, 1 founder, 5 list, 3 events on the preset, and the watch's founder
  [read: `tools/calibrate.js:44-58`, `:128`].
- Five known faults, each from the audits:
  1. **Compensating errors (E-1).** On join 6's code the opening that meets the early record is about 1.0 m², and she
     then founders at T 127.3 [measured: auditor E, experiment 1, case 4]. G7's tank is worth +6.9 min at fixed numbers
     [derived: rung 1a's 164.22 less rung 0's 157.33; the ladder note]. So about 23 min of too-fast late flooding may
     remain [bet: 30 less 7; the two were measured on different code and do not simply add]. **The run that replaces
     this bet:** E's experiment 1 on cbd6e1c, five preset runs, about 15 s.
  2. **A fifth parameter set by dt (A-1).** The half-levelling share. The preset founders at 160.67, 157.20, 155.85
     and 155.09 min at dt 0.5, 0.25, 0.125 and 0.0625 s [measured: auditor A, experiment 3, on join 5].
  3. **`Math.pow` in the step (A-2)**, now at `core/core.js:1166` [read], 13.9 weirs a step [measured: auditor A].
  4. **The watch is bimodal at the bit level (G18)** [measured: the mainline; `core/systems.js:298-300` read].
  5. **Water outside `sim.vol` is not in her mass under way (A-6)**: `core/motion.js:354-364` sums `sim.vol` only
     [read]; the tank's 323 m³ from T 22 [measured: the mainline].

## 2. The epoch as an ordered plan

The rule that shapes it: `CLAUDE.md` says of the seams reference "never refreeze it to absorb a physics change". The
epoch respects it in three ways.
- The one refreeze (B1) is made in a commit whose only change is the `pow` routine, with a proof that nothing else
  moved (below).
- Every physics change (stage C) is built behind a switch, and the seams gate's configuration (`GATE_PARAMS`,
  `GATE_SHIP`, `tools/seams.js:34-35`) pins each switch off. So `node tools/seams.js` must PASS, unchanged, on every
  commit of stages C and D. A physics commit that turns it to DIFF is wrong and is mended, never refrozen.
- The calibration (stage D) moves numbers the gate does not run (`GATE_PARAMS` and `GATE_AREA` carry their own).

Sizes are S, M, L as the BACKLOG's [bet]; clock times are for this machine, alone.

### Stage 0. Measure before any code (read-only runs in a scratch copy of join 7's main)

| Run | What it settles | Cost |
|---|---|---|
| M1: auditor E's experiment 1 on join 7's code | water at T 45, Poingdestre's and Robinson's marks, the founder at the early-record opening: the budget | 5 preset runs, about 15 s |
| M2: the preset at dt 0.125 and 0.0625 with the allowance held per second | whether A's 3.9 s and 0.015° still hold with the tank and the pockets | 3 runs, about 15 s |
| M3: `C.pow` (U0's port) against `node --no-use-std-math-pow`'s `Math.pow`, 10 million inputs in the four forms the core uses | whether B1's refreeze can be made from ef60334 itself | seconds |
| M4: Morris screening of about 25 inputs on the ledger's rows (auditor E's S4) | which inputs the history match samples, and which are frozen | about 260 preset runs, 9 min [derived: 260 × 2 s] |

| M5 (v1.1): the virtual over-fill over the 1912 run, the preset and the watch | the total of every full space's `vol - nodeVmax` and every pocket's `vol - cap` against time, its largest, and where it stands | 2 runs, seconds |

M4's inputs: the opening, `wMul`, `aDown`, `fOpen`, `CdBreach`, `CdDoor`, `Cweir`, the six shares, the permeabilities
and `MU_UP`, `zMergeHold` (D64), `axHold`, `axOpen`, the door areas, `bunkerBurst` and `bunkerLeak`, the peak tank's
vent, the pumps' starts, the coal list, GM, `levelRate` at 1 and 2.

### Stage A. No bit moves (each commit: `seams` PASS, `golden` byte-equal, `gate.js --quick` PASS)

**A1. `levelRate` (A-1).** S.
- Changes: `params.levelRate: 2` (per second) and `share = Math.min(0.5, p.levelRate * dt) / deg` at both sites,
  `core/core.js:1183` and `:1202` (the pocket's door) [read].
- Bit-identical: everything. At dt 0.25, `2 * 0.25` is 0.5 exactly, and `0.5 / deg` is the expression as it is.
- Test: section 8's half-step MUST row, in `tools/stairs_tests.js` (beside the staircases' rows, where auditor A
  put it).
- `GATE_PARAMS` needs nothing: the default is the old step.

**A2. Small arithmetic hygiene (A-12).** S. `x * x` for the two `** 2` in `core/core.js` and the one in
`core/encounter.js` [read: grep, 3 uses]; a load check `fsin(1) === 0.8414709848078965`. Auditor A measured `x ** 2`
equal to `x * x` on this runtime, so no bit should move; the commit proves it by `seams`, `golden` and
`astern_tests`. It is here because B1's proof runs old code under another `pow`, where `**` would follow the flag.

**A3. The ledger as data, CHECK only.** M. Section 3. A table `RECORD_1912`, its operators (`tools/ledger.js`), a suite
`tools/ledger_tests.js` writing `out/ledger_1912.txt`, every row CHECK. `OBS` stays, so the score, the page and the
guide do not move. The held-out table and the budget row ("founder at the early-record opening") are printed from
now on, so each later step shows its effect before anything is fitted.

**A4. The noise ensemble and the margins (A's S-4, E-2's remedy 2, E-9).** S to M. `tools/validate.js` prints, for the
1912 case: the founder with `CdBreach`, `aDown` and `GM0` moved one unit in the last place and the opening by a
thousandth (auditor A's experiment 4); and for each floating case its margin to the next bulkhead top or opening. The
table moves, so the gate says STALE: meant, `--write` for `validate` only. `tools/calibrate.js` prints J by group
(trim, founder, list, events). No score changes.

### Stage B. Arithmetic, not physics (one commit, its own gate)

**B1. The model's own `pow` (A-2).** M. It waits for U0's E2a (join 8), which adds `C.pow`, called nowhere.
- Changes: every `Math.pow` of `core/core.js` calls the model's: `:243` and `:247` (the hull form), `:1166` (the
  submerged weir, both powers), `:1431-1432` [read: grep]. `tools/engine_tests.js` bans `Math.pow` in `core/core.js`.
  The other files' uses (12 matches of `Math.pow` or a non-square `**` across `motion.js`, `section.js`, `fall.js`
  and `core.js` [read: grep, not classified]) are listed by the scan and go with E2.
- Both powers of the weir use `C.pow`, not `r * Math.sqrt(r)` for the 1.5: the proof below needs the one routine.
  Cost of a JS `pow`: about 28 calls a step against an 80 µs step [measured: auditor A]; a few percent [bet].
- **Refreezes, named, once:** `out/seams_reference.json`. Also moved, as meant: the headway reference
  (`astern_tests --freeze`), the 1912 fingerprint (`systems_tests`' BASE, `carpathia_tests`' copy), `golden`, and the
  tables the gate then calls STALE. Every lane's pins move here, and again only at D4.
- **The proof that it is arithmetic.** If M3 shows `C.pow` equal to V8's own `pow` bit for bit:
  1. make the new reference from git ef60334 itself, in a scratch worktree, with
     `node --no-use-std-math-pow tools/seams.js --freeze`. The reference is then still "frozen from ef60334", with
     the routine named;
  2. MUST: the epoch's code, under plain Node, passes `seams` against it;
  3. MUST: the commit before B1, run under the flag, passes `astern_tests`, `systems_tests`' fingerprint and
     `golden` against B1's new references. Old code with the new routine equals new code: nothing else moved.
- If M3 fails (V8's own `pow` is not fdlibm's), the weaker evidence of auditor A stands in: the same step counts in
  the three seams runs (37,762 and 12,199 on titanic and britannic [measured: auditor A]), the 1912 founder within the
  noise floor (A measured 2.75 s against 3.5 s), and the validation table unchanged in its printed digits.
- `CLAUDE.md` gains the rule: "a change of arithmetic, not of physics" names its routine, carries this proof, and is
  the only kind of change that may refreeze the seams reference.
- Cost: one full gate (about an hour), since every browser table that quotes a founder to the second may move.

### Stage C. Physics, built dark (each behind a switch, default off until D4; `seams` PASS unchanged)

Each item lands with its switch off, so the tracked references stand through stage C. Its own suite runs it on. Each
is then measured alone as a rung at G7's numbers, as G7's ladder did: the founders, the budget row, the held-out
table.

**C1. syncMass through the core's water (A-6).** S.
- Changes: `core/motion.js:354-364` counts the pockets' water in `m.mass`, `m.xG` and `m.IzG`. `C.spaceWater` gives a
  volume and no centre [read: `core/core.js:816-822`], and `xG` needs one: either the pocket's own centre beside it,
  or auditor A's `C.eachWater(sim, fn)`. The mainline picks.
- Moves: the watch only (a preset has no `sim.mo`). Switch: a field of `SHIP` in `motion.js`, off = today's sum.
- Test: `pocket_tests`: `sim.mo.mass - sim.ms` equals 1025 times `C.readouts(sim).waterM3` at T 30 (MUST, on).

**C2. G18's doctrine.** S to M. Section 6. Moves the watch only. Its test is section 6's sweep.

**C3. The hull: G14's ends, G10's stem, G2.** L. The largest item and the largest risk.
- Changes: `halfBreadth` above the load waterline at both ends from R3's per-frame numbers
  (`docs/research/RESEARCH_rooms_hull_ends_v1_2026-11-20.md`, join 7): the flare forward, the counter's full
  sections aft; the stem's waterline angle into the plans' 21 to 24° band (G10); G2's deck items (the wells' ends,
  the sheer of C deck and above, the moulded breadth).
- Switch: an option of `C.buildShip` (as `tiers` and `peakTank` are), off in `GATE_SHIP`. Off, the ship is today's to
  the bit: `seams` shows it, and a `pocket_tests`-style row holds the off ship to a frozen digest of join 7's.
- Must hold: the hydrostatic targets at the two level draughts (README: the hull was fitted to them). G14 and G2 are
  above the load waterline, so they should hold by construction [read: BACKLOG G2]; G10 changes the waterline's
  entrance and needs the hull's fit run again with the targets kept.
- Its cascade, from `CLAUDE.md` and G14's row: `stairs_tests`; `girder_tests` and `strength_tests` (`girder.js` and
  `fall.js` mirror the core's columns); `fall_trials`; `topsides_tests` (the drawn shell must never lie inside the
  model's hull); `rooms` tables (R3 compares against the model's side); the export's manifest; the wake's bake
  (`wake_spectrum.js --bake`, the wake lane); and the encounter.
- **The encounter is the cost.** G10 changes the plating's angle where the ice touches. That needs
  `calibrate_encounter.js`, the encounter and night suites, and probably the geometry's re-search (`GEOM_1912`, e17's
  method) [bet: `CLAUDE.md` asks for the re-search after a handling change; a stem change is not named there].
  B1+B2's e95 found the ends hardly move the onset (0.4 min at most) [measured: B1+B2, on join 5].
- What it should buy: about 1,700 m³ of buoyancy forward while dry, where she goes under [read: R3's note]. That
  slows her last half hour, which is the direction E-1 needs. How many minutes is M-rung C3's to measure.
- Not in the epoch: G11's stepped bulkheads (B, A, P). One `x` a bulkhead is read by 21 files across five lanes
  [read: auditor E, B-2]; it needs its own design.

**C5 (v1.1). The full space's virtual over-fill (`nodeAov` and the pockets' `aov`).** S to M. It is reviewed with A1's
convergence work (`levelRate`), because both set how stiff a full space's level is.
- **The device** [read: `core/core.js:1243-1248` for the pockets, `pocketHead` at `:785-788`; the spaces' `nodeAov` in
  the level solve]. Once full, a space's or pocket's water may rise past its capacity by `aov` times the sea's head
  over its top. Its level is then the top plus the excess over `aov`. The excess is counted in `readouts`, `loads` and
  `C.spaceWater`. `pocketPoints` weighs a pocket's excess at its own centre; the spaces' excess is weighed as the
  level solve places it.
- **Why it is there.** It keeps a full space's head a smooth function of its volume, so the level solve treats a full
  space as stiff, not rigid. A rigid one would be a constraint, and the step has no solver for constraints.
- **What it costs.** M5's number. G7's tank alone holds 82.44 m³ near her end, against 0.12 m³ by compressibility
  (Changes in v1.1).
- **Options, measured as a rung at the same numbers:**
  - (a) Weigh only min(vol, cap) and carry the excess as pressure state only. `loads`, `readouts` and the mirrors
    count the placed water. It moves the end a little, and it is physics.
  - (b) A smaller `aov` (stiffer). The excess goes with `aov`, but the level then swings faster per cubic metre, which
    meets dt and `levelRate`: A1's half-step row must still pass.
  - (c) Leave it, and state it as a [bet] with its size in the README's known gaps.
- **Test:** M5's total printed by `conserve_tests` as a CHECK, and under the option taken a MUST: either no weighed
  excess (a), or the excess under a stated bound at every step (b). The founder's move under it is measured and said in
  words. If (a), the girder, the fall and U0's record follow the same count.
- **Advice:** (a). Its excess is pressure, not water, and the mirrors already place min(vol, cap). The landing's
  numbers then absorb its small move in the ONE refit.

**C4 (the coordinator's choice). The rest of G11 that is one line each:** no watertight door on F deck in E and G,
nor on G deck in N [read: BACKLOG G11]. Sourced, small, and it moves the doors-open what-if and the Carpathia search.
`aDown` as R3's table of stairs with one multiplier (E-8, item 3) is offered as a rung, taken only if M1's budget
still stands after C3.

### Stage D. The calibration (the ONE refit)

**D1. The score reads the ledger.** M. `tools/calibrate.js`'s `score()` sums the fitted rows by the ledger's
operators; `OBS` becomes a view of the ledger for the page. E-3's option decides the list rows (section 3.4).

**D2. The parameters.** Section 4 (Cd×A) and:
- **`wMul` leaves the fit (E-2, A-3).** `KEEP_B` is deleted (`tools/calibrate.js:113`): its reason went with D75. With
  G11's widths in, `wMul` is 1, a multiplier on sourced widths. Its uncertainty is the plans' own: Scotland Road 2.24 m
  clear against 2.63 m over its walls [read: BACKLOG G11], so 1.0 to 1.17 [derived: 2.63 / 2.24 = 1.174] as an input
  of the history match, not a fitted number. If M4 shows the ledger holds it after all, it stays free: say so then.
- **D69 (3)'s half-value bounds go** (section 9). They hold the numbers near values fitted while boiler room 5 flooded
  from T 4 [read: auditor E, E-6].
- **`watchFounders`' two branches go** once C2 is in: one watch, one term.

**D3. The history match.** Section 5.

**D4. The landing.** One commit turns every stage C switch on and lands the chosen member's numbers. Then the cascade
`CLAUDE.md` names, once:
- `calibrate_encounter.js` and the area constant; `astern_tests --freeze` (meant: say so);
- `systems_tests`' 1912 fingerprint and `carpathia_tests`' copy (meant: say so);
- `golden`, `validate`, `conserve_tests`, `pocket_tests`, `stairs_tests`, the encounter and night suites;
- `WRECK_1912` (`world_tests` prints it), `calibrate_people.js`, `reports_tests` (its one fitted constant);
- `gate.js --write` for the meant tables, `build_site.js`, the browser suites in the mainline's turn;
- the validation table in the commit message, with "k of 30" beside each verdict.
- Cost: one full gate, one browser turn; then the Carpathia rerun (D5).

**D5. The Carpathia search on the kept set.** Section 5.5. About 90 min, in its own turn, for the join after.

**D6. The papers.** README's Calibration (no longer "four parameters ... nothing else is tuned": the fitted numbers,
`levelRate` as a bet with its worth, the kept set), the validation table in two parts (binding, reported), the
Cd×A sentence, `CLAUDE.md`'s rules (the arithmetic rule; the mirrors; "the score reads the ledger"; the kept set's
file), BACKLOG, CHANGELOG, and U0's guide (chapter 9 calls `OBS` the fit's main evidence).

## 3. The observation ledger

### 3.1 The schema

One row is one thing one witness saw. `RECORD_1912`, an array of plain objects in `core/scenarios.js` beside `OBS`
(no new file in the build; the page and the worker already bundle it).

| Field | Meaning |
|---|---|
| `id` | short and stable, e.g. `poingdestre_quarters` |
| `witness`, `source` | who; the Inquiry's question numbers or the paper, and the research note that read it |
| `group` | independence group: rows that rest on the same sighting or the same derivation share one |
| `kind` | `sea_at` (the sea outside at a place), `water_in` (the water inside a space at a place), `sounding`, `angle` (read on an instrument), `event`, `tonnage`, `end` |
| `place` | ship frame x, y, z in metres, with the deck and frames it came from and who placed it |
| `value`, `unit` | what was seen: a level, an angle, a mass |
| `t`, `tLo`, `tHi` | minutes after the touch, and the time's own looseness |
| `sided` | `two`, `lower` (the truth is at or above), `upper`, or `interval` |
| `sigma` | the observation's uncertainty in its own unit; with `interval`, the interval |
| `disc` | the model's allowance on this row (section 5.2), with its reason |
| `role` | `fit`, `held` (printed before and after every refit, never fitted) or `report` |
| `tag` | [read], [derived] or [bet], for the value and for the place separately |
| `was` | the `OBS` entry it replaces, if any |

### 3.2 The operators (the model's geometry)

Each kind has one operator, in `tools/ledger.js`, working on a run sampled every 5 s with her pose and the 64 levels:
- `sea_at`: the first time `worldZ` of the place is under the sea, and the level there at the witness's time;
- `water_in`: the same against `sim.level` of the space the place lies in;
- `sounding`: depth of water over the space's floor at the place;
- `angle`: trim or list at the time; `event`: the core's own marks (`MARKS`); `tonnage`: `readouts().waterM3`;
- `end`: the founder flag, and the onset from `core/readers/onset.js` as a second row.

A witness who looked down a hatch or a stair is a `sea_at` row, not `water_in`: the trunk stood at the sea's level
before the rooms beside it filled [read: auditor E, E-12]. The reports reader and e85/e87 hold most of these already
(`sound`, `toG` in `tools/reports_tests.js:44-46` [read: auditor E]).

### 3.3 Who reads it

| Reader | Today | After |
|---|---|---|
| The score (`tools/calibrate.js:39-61`) | `OBS.trim`, `OBS.list`, `OBS.founder`, three events | the rows with `role: fit`, one-sided where `sided` says, one term a group |
| The suite (`tools/ledger_tests.js`, new) | none | every row, CHECK; `out/ledger_1912.txt` in the gate from A3 |
| The Evidence tab (`site/app.js:2592-2602`) | `OBS.trim`, `OBS.list`, `OBS.wilding40`, `OBS.events` | first `OBS` as a view of the ledger (no pixel moves); later the rows drawn as what they are: a lower bound as a mark with an arrow, Weeks and Halpern's tonnage beside Wilding's. That is a page change with its browser suites: the coordinator's slot, U0's guide |
| The guide (`tools/build_guide.js:451-460`) | `OBS.events`, `OBS.trim` | the ledger's table, with source and role columns |
| `tools/titanic.js:13`, `tools/validate.js:23`, `site/parts/40_night_end.js:98` | `OBS` | unchanged until the view is retired |

### 3.4 What is wrong with today's `OBS` (E-4), row by row

[read: `core/scenarios.js:148-160`, `tools/calibrate.js:44-58`; the witnesses are auditor E's reading of Halpern's
Part II, not opened again for this design]

| `OBS` entry | Witness | Fault | In the ledger |
|---|---|---|---|
| trim 0.8 at T 15 | Symons | a lower bound scored two-sided at sigma 0.3° | `sea_at` No. 1 hatch, `lower` |
| trim 1.8 at T 30 | Robinson | the same | `sea_at` the mail stairs, six steps below E deck, `lower` |
| trim 2.6 at T 45 | Poingdestre | the same | `sea_at` the seamen's quarters, 3 ft over E deck, `lower` |
| trim 3.2 at T 75 and event `overF` at 75 | Wheat | counted twice | one row, one group |
| trim 4.0 at T 100 | Symons | a level turned into an angle | `sea_at` the ports under the name; `ports` at 100 is the same sighting, unscored today |
| trim 5.5 at T 130 and event `well` at 130 | Bride and Phillips | counted twice, and the two cannot both be met: the model's well deck is awash at 4.80° [measured: auditor E]; a floor of about 0.9 in J | one `sea_at` row at the well deck |
| trim 10 at T 155 and event `bridge` at 155 | Lightoller | counted twice | one row; the mark's place to be checked against where he stood |
| founder 160, preset and watch (D73) | the record's end | one observation, two configurations | one group, two rows |
| list -15 at T 145 | Halpern, from boat D's waterline and his own trim trend | an angle that depends on another fitted curve | its primary: the sea 10 ft below the Boat deck, port side at boat D |
| list +5, +2, 0, -10 | Hichens; Symons; Halpern's estimates | E-3 | section 3.5 |
| absent | Rowe, about 6° to port at T 120 | band A's only number for the port list is not in the score | a row |
| `wilding40` (chart only) | Wilding's assumption | 16,257 t at T 40 means about 3.35° of trim, against 2.6° witnessed [derived: auditor E] | `report`; Weeks and Halpern's 13,717 t at T 45 beside it |

Rows the ledger adds from the room-by-room record, all `held` at first (auditor E's table): the mail room within 2 ft
of G deck (Boxhall, T 10 to 20); hold 1's 7 ft (the carpenter, about T 10); boiler room 6's 8 ft (Barrett, about
T 10); boiler room 5's plates dry to T 60; boiler room 4's first foot, from below (Dillon, Cavell, T 95 to 100).

The count after: about 8 independent groups for the fore-and-aft problem [read: auditor E, E-6], against 16 terms
today. Fewer terms, honestly counted, is the point.

### 3.5 E-3: the list's rows. Two options; Bo picks

D62, as decided: "band A, as MUST: Hichens +3 to +7 early, Rowe -3 to -9 at T 120, the change of side between T 85
and 110. B and C are reported beside it, never fitted to" [read: the coordinator's ledger, 18:3x 2026-11-20]. D72 made
band A a CHECK until D64 is settled. The score fits Halpern's five points, three of them band C, at weight 0.25 and
sigma 3° [read: `tools/calibrate.js:51-54`]; they were 57 % of join 6's J [measured: auditor E].

| | Option 1: the score follows D62 | Option 2: D62 is amended; C is fitted |
|---|---|---|
| Fitted list rows | Rowe -3 to -9 at T 120 (`interval`); the change of side between T 85 and 110 (`interval` on a time) | Halpern's +2, 0, -10 as today, Rowe added, and boat D's waterline in place of -15 |
| Held or reported | Hichens +3 to +7 (CHECK by D72, until D64); Halpern's 0, -10, -15; boat D's waterline | Hichens as in option 1 |
| J's list share | small: two interval rows, zero inside their bands | stays the largest group |
| What steers `aDown` and `fOpen` | the trim rows, the levels, the end | partly the late list: fewer ways down hold water on E deck, which runs to the low side [measured: auditor E's probe: `aDown` 0.10, `fOpen` 0.008 give -10.8° and -13.8°] |
| D62's text | stands | changes: "C is fitted at weight w", and why |
| D69 (4), "J at most 1.2 × 9.39" | cannot carry over: J is another sum (section 9) | cannot carry over either: the terms change |
| Risk | the late list stays a known gap (README) with nothing pulling on it | a vertical-flow number tuned by a reconstruction of a list, itself drawn from a fitted trim |
| In its favour | evidence runs from primary sightings to the model; the kept set is wider and says so | the probe says the list comes with a larger opening and fewer ways down, which E-1 wants anyway |

Advice, for what it is worth: option 1, with Halpern's points and boat D's waterline printed as held-out rows on
every refit. If the kept set of option 1 already leans to the record's late list, that is evidence; under option 2
the same agreement would be the fit.

## 4. Cd×A

An orifice's flow goes with the product: `q = coef * area * sqrt(2 g) * ...` [read: `core/core.js:1160`]. So the
opening and `CdBreach` are one number to the flow, and sources must be compared as products.

| Source | Raw area | Coefficient | Cd×A, m² | Receipt |
|---|---|---|---|---|
| Hackett and Bedford, first figure | 9.53 sq ft | 0.61 | 0.540 | abacus1:83ac56dd4fd5 |
| Hackett and Bedford, final | 12.6 sq ft (1.171 m²) | 0.485 | 0.568 | abacus1:4e4ef1434f74 (auditor E) |
| The model, join 6 | 0.7853 m² | 0.60 | 0.471 | auditor E |
| The model, G7 landed | 0.8196 m² | 0.60 | 0.492 | abacus1:a10220845e42 |
| The tool's upper bound, `AREA_MAX` | 1.115 m² | 0.60 | 0.669, 1.178 of H and B's | abacus1:ba39b6862d0b |
| Wilding | 12 sq ft | not found | not comparable until his coefficient is read | not checked |

- G7's opening is 0.866 of Hackett and Bedford's as a product: 13 % under, where join 6's was 17 % under
  [derived: abacus1:4ce3448c66ee]. Their opening in the model's terms is 0.947 m² [derived: abacus1:3badcca14f95].
- **The auditors' 0.54 to 0.60, checked.** Its lower end is Hackett and Bedford's first figure and their final one
  lies inside it: sourced. Its upper end, 0.60, is not a source's: it is auditor E's probe at 1.0 m², which met the
  early record on join 6's code. With G7's tank the forepeak takes less early water at the same opening, so the
  opening that meets the early record has probably risen [bet]; M1 measures it. So 0.54 to 0.57 is the sources' band
  and the upper end is the model's own statement, to be remeasured.
- **What the epoch fits:** Cd×A as the parameter, printed as an area at `CdBreach` 0.60 and as a product beside the
  sources'. Searched over 0.47 to 0.67 m² (the area 0.78 to 1.115 m² at 0.60), today's range. The sources' band is
  not a bound: the early rows of the ledger (the tonnage at T 45, Robinson's and Poingdestre's marks) are what hold
  it, and they are `lower` rows, so they pull the right way.
- **One trap:** `icebergDamage` makes `round(a / A4)` holes in each compartment and sets each hole's height by its
  index [read: `core/scenarios.js:50-65`]. A change of area changes the count, so the response has small steps in the
  opening. It is one source of the noise floor; the history match's `sigma` carries it (section 5.2).
- The blurb and the README compare 8.8 sq ft with Wilding's 12 as like with like [read: `core/scenarios.js:91`,
  `README.md:275`]. D6 rewrites both as products. The blurb is public text: Bo's.

## 5. History matching

### 5.1 What "keep every parameter set the ledger can't rule out" means here

A parameter set x is a point in the inputs M4 leaves free: expected Cd×A, `aDown`, `fOpen`, and the unfitted inputs
with sourced ranges (`wMul` 1.0 to 1.17; `zMergeHold` 3.4 to 6.0 by D64; `bunkerBurst`; the tank's vent; whichever of
the permeabilities and coefficients the screen ranks high). About eight [bet].

For each fitted row i with observed value z_i and model value f_i(x), the implausibility is

    I_i(x) = d_i(x) / sqrt(sigma_i^2 + disc_i^2 + noise_i^2)

where d_i is the miss: `|z_i - f_i|` for a two-sided row; `max(0, z_i - f_i)` for a lower bound; the distance outside
the interval for an interval row. For a row whose looseness is in time, the same in minutes: when the model reaches
the level against when the witness saw it. Rows of one group count once, by their largest.

x is **kept** if its largest I over the fitted groups is at most 3 (the three-sigma rule the method uses for any
unimodal error), and its second largest at most 2.5 [bet: a guard against a set that passes by one gross row].
No emulator: the preset costs 2 s, and the model's thresholds are what an emulator would smooth away.

### 5.2 The three variances

- `sigma_i`: the observation's, from the ledger. Auditor E puts the early witnesses' times at 5 to 10 min each.
- `noise_i`: the model's own, from A4's ensemble: 3.5 s of founder for a last bit, about 0.06 min [measured: auditor
  A], and the steps of section 4's trap.
- `disc_i`: what the model is known to get wrong on that row, stated, with its source. Two are measured already:
  - the end: `levelRate` doubled moves the founder 1.35 min sooner, halved 3.5 min later [measured: auditor A]. The
    founder's `disc` is 1.35 min [bet: taking the smaller, since the law's own limit lies that way];
  - the holds as one tank from the tank top to E deck: `water_in` rows forward are 14 to 24 min late where the sea
    outside is in time [measured: auditor E]. Those rows are `held`, not fitted, until S1c.

### 5.3 The runs

| Wave | What | Runs | Time, one thread | Six threads |
|---|---|---|---|---|
| 1 | a Latin hypercube over the eight inputs, the preset | 2,000 | 67 min [derived: 2,000 × 2 s] | about 12 min |
| 2 | the same inside the box of wave 1's kept sets | 2,000 | 67 min | about 12 min |
| 3 | the watch on up to 200 kept sets: the area constant's fixed point (`alphaFor`), then one watch | 200 | about 40 min [bet: 12 s each] | about 8 min |
| 4 | `tools/validate.js` on 30 of them | 30 × 11 cases | about 30 min [bet: about a minute a table] | about 6 min |

At BelowNormal beside another session's suite, allow twice these. A wave stops the matching when it keeps more than a
fifth of its points. The 30 are chosen from the kept, watch-checked sets by a maximin design, so they span the kept
region and do not crowd its middle.

**If nothing is kept**, that is the result: the tool prints which group empties the set. Today the list would
(auditor E, S3). Under option 1 the early +5° is a CHECK, so it cannot; under option 2 the late list may.

### 5.4 The landed set and the kept set

- **The kept set** is tracked: `out/kept_1912.json`, 30 members, each with its numbers, its own area constant, both
  founders and its implausibilities, named by a hash of `core/`'s files and of the ledger (as the Carpathia progress
  is named). It is a gate table: a physics change makes it STALE.
- **The landed set** is one member: the one whose largest implausibility is smallest, then rounded as G7's was and
  run again. It must stand at least 0.2 min inside each wall of the founder band [derived: three times the 0.06 min
  noise floor] and have no number on a bound. It gives the page's numbers and every frozen reference.
  `tools/calibrate.js` must reproduce it (D73's principle): the Nelder-Mead stays as a polish from that member.
- **Every published number that is a what-if carries the kept set's reading:** `out/validate.txt` prints the landed
  verdict and "k of 30"; a verdict that flips inside the kept set is labelled an edge, with its margin (A4).
- The Evidence tab can later draw the kept set's envelope behind the run. Not in this epoch.

### 5.5 The Carpathia search and D22 (E-7)

Today `GUESSES` moves fifteen guesses about doors, pumps and the bow wave and holds the calibration fixed
[read: `tools/carpathia.js:61-77`; the v2 note's section 8, by auditor E].
- A new entry in `GUESSES`, as `CLAUDE.md` asks: `calib`, a member of `out/kept_1912.json`, its range's source the
  file. A member changes the damage from T 0, so each needs its own fork at the end of the encounter (30 watches to
  the encounter's end; seconds each). `EVAL_VERSION` is bumped.
- The forty robustness models become: the landed set; each guess at each end on the landed set, as now; and draws of
  (member, guesses) together.
- A model whose own baseline founders outside 157 to 160 is flagged in the table and left out of the count (auditor
  E's remedy 3). Kept members are inside by construction; drawn guesses may leave.
- D22's rule then reads: the best night, found on the landed set, with its margin on every model, stated as "past
  the target on k of N", never on one point. Its wording is the coordinator's.
- G18: until C2 is in, every searched night is a bit-level perturbation of the watch and may fall on either branch.
  The rerun that follows join 7 should say so; the epoch's rerun no longer needs to.

## 6. G18's doctrine

**The fault** [read: `core/systems.js:298-300`]: at `pumpT[k] + PLANT.pumpLent` the rule sets `pumpLed[k]` and then
asks `roomLost(sim, k)`: the water's depth against `pumpAbandon` (2.3 m) at one instant. Yes or no, for good. A state
compared with a threshold at a fixed time is a step in every input. A threshold crossed at a moving time is not: the
core's own stop of a pump whose room floods (`core/core.js:1569`) shifts smoothly.

| Option | The rule | Continuous? | 1912's engineers | Sourced? |
|---|---|---|---|---|
| a. Re-check each minute until lost | lead as soon as the room is not lost | no: a room on the threshold and rising is lost a minute later too; the yes-or-no stays | plausible | bet |
| b. A hysteresis band | two thresholds, up and down | no: hysteresis stops chatter; this is one decision, not a chatter | - | bet |
| c. Led pumps stop when the room is lost | pumped water = rate × (time lost - time due), which goes to 0 at the edge | yes | no: a strum under water draws; the preset's own record has boiler room 3's pump on 4 through the main throughout | against the record |
| d. A graded lead | at the due time the capacity led is `cap × g(depth)`, g falling from 1 to 0 over a band below `pumpAbandon` | yes: the slope is 1.35 min over the band | fair: the deeper the water over the plates, the fewer of the room's suction valves a man can reach | the band is a bet |
| e. Decide when the work begins | the room is judged at `pumpT + pumpOwn`, when its own pumps start; the led pumps start at `pumpT + pumpLent` as now, whatever the room is then | only where the room is far from lost at that moment | best: Wilding's half hour is "from decision to start" [read: the comment at `core/systems.js:322`]; the suction valve in the flooding room is opened first, while it can be reached | the half hour is read; the moment of decision is a bet |
| **e with d** | judged at `pumpT + pumpOwn`, graded by the depth then | yes, everywhere | as e | as e and d |

Advice: **e with d.** On the 1912 watch boiler room 4 is judged at about T 80 [derived: led at T 105.23 today, less
`pumpLent`, plus `pumpOwn`], 25 minutes before it stands on the threshold [bet: its depth at T 80 needs the run], and
the led pumps still start at about T 105. The grade keeps the rule continuous for a room that floods fast: boiler room 6 has 8 ft at T 8.4
[measured: auditor E], so at its own `pumpT + pumpOwn` (about T 5) it may stand near 2.3 m [bet: needs the run], and
e alone would only move the knife edge there. The band is a bet: 0.5 m below `pumpAbandon`, and it joins `GUESSES`
with `pumpLent` and `pumpAbandon`.

Two more yes-or-no tests in the same rule, to look at with the same sweep: a pump counts as idle if its room holds
under 1 m³ at that instant (`:303`), and which room a pump serves is first come (`:291`, `:307`). Neither has shown a
knife edge. The later lead to boiler room 3 (worth 0.65 min) follows the first decision's branch [measured: the
mainline].

**The test** (rows in `tools/systems_tests.js`, the 1912 watch, the switch on):
- the area constant alpha × (1 ± e) for e = 1e-12, 1e-10, 1e-8, 1e-6, 1e-4: ten watches and the base, about a minute
  [derived: 11 × 5 s];
- MUST: no founder differs from the base by more than 0.1 min for e up to 1e-6. (0.1 min is just over the 0.06 min a
  last bit is worth, so the row tests the doctrine and not the noise);
- MUST: every founder of the eleven inside 157 to 160;
- CHECK: the same with `CdBreach`, `aDown` and `GM0` moved by one unit in the last place (A4's ensemble on the
  watch).

It moves the 1912 watch's fingerprint, which `CLAUDE.md` lets move "only with a physics change that is meant to move
it": say so in D4's commit. With no order from the bridge the rules still run alone; `Night.pump`'s path is untouched.

Beside it, auditor A's A-7: the preset pumps by the night's record (boiler room 4 from T 30) and the watch by the
rules (from about T 105, today and under e). They are fitted together as one night. The epoch should at least
print both schedules beside the two founders; whether the 1912 watch should carry the night's own schedule is the
mainline's, and a larger change than G18.

## 7. A-6, A-7 and what else rides the epoch

- A-6 is C1.
- A-10's deleted film (`solvePair`) and A-11's residual read-out are small core changes that move a bit where they
  fire. They are cheapest inside D4. The mainline's choice; not ordered.
- The golden trace as a quick gate row (A-8): the coordinator's.

## 8. The half-step row and the noise floor in the epoch's acceptance

**The half-step MUST row (A-1), from A1 on** (`tools/stairs_tests.js`; two preset runs, about 6 s):
- the 1912 preset at dt 0.125 with `levelRate` 2 founders within 10 s of the tracked run at dt 0.25;
- its trim at T 30, 75, 100, 130 and 150 agrees within 0.02°.
- Auditor A measured 3.9 s and 0.015° on join 5 with the same switch. M2 measures it on join 7's code before the row
  is written; if G7's pockets or the tiers have a second dependence on the step, the row will show it, and that is a
  finding to bring back, not a tolerance to widen.
- CHECK beside it: dt 0.0625 (about 8 s), and the 1912 watch at dt 0.125 (the motion and the plant take dt too:
  `core/systems.js:190` [read]; not expected to pass yet).
- What the row does not claim: that the model is converged in `levelRate`. From 2 to 8 a second her end still moves
  2.1 min, 0.75 of it in the last doubling [measured: auditor A]. `levelRate` is a fifth number. A physical reading
  exists: two neighbouring spaces cannot level faster than a gravity wave crosses one, sqrt(g h) / L, about 0.3 to
  0.5 a second for 15 m of length and 2 to 5 m of water [derived: sqrt(9.81 × 2) / 15 = 0.30; sqrt(9.81 × 5) / 15 =
  0.47], and the model's rate a connection is `levelRate / deg`, 0.3 to 0.7 a second for 3 to 6 connections. So 2 a
  second is of the right order, as a bet. The epoch keeps it at 2, names it in the README, and carries its worth as
  the founder's `disc` (section 5.2). It is not fitted: the end is the only observation that would hold it.

**The noise floor (A-3) is used in four places:**
1. differences in J under 0.05 are not reported as gains, and never choose between two candidates;
2. `noise_i` in the implausibility;
3. the landed set stands 0.2 min inside the band's walls;
4. the opening is quoted to three figures, not four: a thousandth of it moves the founder by 6 to 11 s
   [measured: auditor A].

## 9. D69's landing conditions as they would read after the epoch

D69, as decided, with D75 as refined [read: the coordinator's ledger]. A proposal for the coordinator's wording:

1. **The binding verdicts hold on the landed set**: the 1912 founder; four compartments float; five sink; Olympic and
   the Hawke; Britannic 1916 and her ports-shut claim; without boiler room 5's seam, slower; stopping at hold 3; the
   bulkheads to D deck, no help (Wilding). Each is printed with "k of 30" on the kept set, and with its margin. A
   binding verdict that flips inside the kept set is an edge: reported in words, and the coordinator decides. **The
   bulkheads to B deck and the doors left open are reported the same way and do not bind** (D75).
2. **Both founders within 157 to 160**, the landed set 0.2 min inside; one watch, not two branches; section 6's sweep
   and section 8's row PASS.
3. **No fitted number on a bound, and each inside a range with a source.** This replaces "no flow number moves more
   than half its value", which held the numbers to an older compensation.
4. **The landed set's largest implausibility over the fitted rows is at most 3.** This replaces "J at most
   1.2 × 9.39": J is another sum once the score reads the ledger. J is still printed, by group.
5. **Her last hour's water goes somewhere physical**, now set against the record's rows (boiler room 4 from below; no
   water aft before the break), not against main's shares.
6. **New: the held-out table is printed before and after, and no held-out row gets worse by more than its `sigma`.**
   With it the budget row: the founder at the early-record opening, which should close on the calibrated founder as
   the physics is mended.

README's heading "Validation: the cases that bound the fit" stays true under (1).

## Decisions needed (who decides)

**Bo, in the morning:**
1. **E-3:** option 1 (the score follows D62) or option 2 (D62 amended, band C fitted). Section 3.5.
2. **His word on the one seams refreeze** (B1), named "arithmetic, not physics". The coordinator has ordered it; the
   reference is one `CLAUDE.md` protects, and the BACKLOG's own C3 row asked for "Bo's word first" on the like.
3. **What the end term fits** (D76's deferred G12-a and G12-d: "they change what the calibration fits"). The record
   has the break at 2:17 (T 157) and the stern gone at 2:20 (T 160). The model has no break, and its flag follows a
   plunge at 80° of list. Advice: this epoch keeps the flag in 157 to 160 as the fitted row and adds the onset's time
   as a held-out row. `CLAUDE.md` says nothing is tuned to move the onset into the record's band; fitting the
   flooding to it would be that.
4. **Public words:** the blurb's and the README's "8.8 sq ft (Wilding estimated 12)" as Cd×A; "four parameters"
   becoming four and a named bet; the kept set on the page.
5. **`levelRate`** (auditor A's question 1): a bet at 2 a second, named (this design's advice), or a fitted number,
   or a smaller step and a refit.
6. Hackett and Bedford's RINA paper and Wilding's flooding figures, if they can be had (auditor E, S5): the first
   tests no fitted number can touch.

**The coordinator:**
1. The joins: stage A can ride join 8; B1 needs U0's E2a first and its own gate; C and D are one landing.
2. Whether C4 (G11's doors) and the stairs' table are inside the epoch.
3. D69's new wording (section 9), and D22's (section 5.5).
4. The lanes the hull change touches: the wake (the bake), R3 (the rooms tables), B1+B2 (girder, section), Z1 (the
   fall's mirror), U0 (the export, the guide), Z2 (the walk reads `halfBreadth`).
5. Whether the Carpathia rerun after join 7 is published as "join 7's snapshot", given D5 reruns it.
6. The Evidence tab's change (one-sided marks, the tonnage) and its browser suites: in the epoch or after.

**The mainline:**
1. G18: e with d, or another row of section 6's table; the band's width.
2. `C.eachWater` or a centre beside `C.spaceWater` (C1).
3. `C.pow` for both of the weir's powers (this design) or `r * sqrt(r)` for the 1.5 (auditor A).
4. The history match's inputs after M4, the `disc` of each row, the cut-offs 3 and 2.5.
5. Whether the encounter's geometry is searched again after G10.
6. A-7 (two pump schedules), A-10, A-11.

## Risks

- **The kept set is empty.** Then the ledger and the model disagree somewhere no parameter reaches. It is a finding,
  and it stops the landing until the coordinator says which row is `held`.
- **The structure does not find the minutes.** If C3 buys little of M1's budget, the refit pays with the opening
  again. The budget row will say so; the remainder is then S1c's (the holds by deck).
- **G10 moves the encounter more than the flooding.** A geometry re-search is hours and its own risk. It can be cut:
  G14 and G2 without G10 leave the waterline's entrance alone.
- **R3's numbers are from Encyclopedia Titanica's plans and Bob Read's (CC BY-NC-ND), not a 1911-12 original**
  [read: R3's note, "Not checked"]. Numbers only go in; a later original may move them, and a hull change is dear to
  repeat.
- **B1's proof rests on M3.** If V8's own `pow` is not the port's, the refreeze has the weaker evidence only.
- **Two moves of every lane's pins** (B1 and D4), each with an hour's gate and a browser turn. A third would mean a
  step was not built dark.
- **A long branch.** Stage C lives off main for a day or more while other lanes land. Stage A and B land early to
  keep it short; the ledger's CHECK table shows progress without a landing.
- **The virtual over-fill (C5, v1.1)** carries about 80 m³ of counted water with no place near her end, from the
  tank alone. The spaces' share is M5's to measure. If it is large, C5 moves the end more than a small item should,
  and the refit must absorb it.
- **`levelRate` stays a bet** worth more than the band's width. The epoch names it and does not remove it.
- **One-sided rows loosen the fit.** A lower bound cannot say "too much". The tonnage at T 45 and the end hold the
  other side; if the kept set runs to the upper bound of Cd×A, say so and look for an upper row.
- **The history match's choices are bets**: the cut-offs, each `disc`, the ranges. They are written before the runs,
  as the Carpathia search's were.

## Sources

Read whole:
- `QC_00_SYNTHESIS_2026-11-20.md`, `QC_A_flooding_core_2026-11-20.md`, `QC_E_accuracy_vs_record_2026-11-20.md`,
  `R3_note_hull_ends_E_D_C_2026-11-20_2306.md`, `MAINLINE_HANDOFF_2026-11-20_2336.md` and `_2026-11-21_0105.md`
  (the group's notes folder).
- In `C:\temp\titanic-wt-g7` (cbd6e1c): `tools/calibrate.js`, `core/scenarios.js`,
  `docs/research/RESULT_G7_ladder_v1_1_2026-11-21.md`, `CLAUDE.md` (as given in the brief).

Read in part:
- `core/core.js` 412-501, 806-825, 1140-1219, and greps for `Math.pow`, `**`, `dt`; `core/systems.js` 120-349;
  `core/motion.js` 350-390; `tools/seams.js` 1-60; `tools/carpathia.js` 54-81 and a grep of `GUESSES`.
- `BACKLOG.md` rows G2 to G17, S1c, S1d, C3 (G18 and G19 are in join 7's papers, not in this tree);
  `README.md` 243-352; `CHANGELOG.md` 1-70.
- `COORD_note_next_join_2026-11-20_1335.md` 1-60 and 252-281 (D62, D69, D75, D76);
  `COORD_HANDOFF_2026-11-20_1906.md` 100-219.
- A grep of `OBS.` over the tree (who reads it).

Arithmetic: abacus1:a10220845e42, abacus1:4ce3448c66ee, abacus1:3badcca14f95, abacus1:83ac56dd4fd5,
abacus1:ba39b6862d0b (this design); abacus1:4e4ef1434f74 and the auditors' other receipts as they cite them.

Not checked:
- Nothing was run: every [measured] is someone else's, named. The auditors' runs were on join 5 and join 6, before
  G7; M1 and M2 repeat the ones this design leans on.
- Halpern's Part II, Hackett and Bedford's paper, Weeks and Halpern, and Wilding's evidence were not opened: the
  witnesses, places and times in section 3.4 are auditor E's reading and the repository's notes'.
- `docs/research/RESEARCH_rooms_hull_ends_v1_2026-11-20.md` (join 7; R3's report of it was read instead).
- Whether V8's own `pow` is fdlibm's (M3), and U0's e97 results.
- Which of the 12 `Math.pow` or `**` matches outside the step are in a hot path.
- The time of `C.buildShip` with a changed hull, and of `alphaFor`'s fixed point: wave 3's and wave 4's times are bets.
- The W6 design, the pumps note and the room-by-room note behind sections 3 and 6.
- The Evidence tab's browser suites and the guide's chapter 9, beyond the lines that read `OBS`.

## The mainline's review (2026-11-21 01:16 CST)

**The plan stands as written.** Four stages; the references moved twice, at B1 and D4; physics built dark behind
switches the seams gate pins off; measurements first. Seen against CLAUDE.md, it keeps the seams rule as it is meant:
the only refreeze is arithmetic, it carries a proof, and every physics commit must pass `seams` unchanged.

**Checked here:**
- `node --v8-options` on this machine (Node v26.13.0) lists "--use-std-math-pow (use std::pow instead of our custom
  implementation)", default on. B1's `node --no-use-std-math-pow` therefore exists [measured: the mainline].
- Whether V8's own implementation equals U0's `C.pow` bit for bit is still M3's to show.

**The mainline's picks**, for the decisions this design leaves to it:
1. **G18: e with d.** Judge the room when its own pumps start, and grade the led capacity by its depth then, over a
   0.5 m band below `pumpAbandon`. The band joins `GUESSES`. The sweep of section 6 is the test.
2. **C1:** `C.eachWater(sim, fn)`, auditor A's accessor, giving each body of water's volume and centre (the 64 spaces,
   then the pockets).
   - `C.spaceWater` stays for the mirrors that want a space's total.
   - `loads`, `readouts`, syncMass, the girder and the fall then read one iterator.
   - `loads` and `readouts` keep their present order of summation, so that A's change to them is bit-neutral.
3. **`C.pow` for both of the weir's powers**, as this design says. The proof needs the one routine.
4. **The history match:**
   - its inputs, `disc` and cut-offs as written, as bets set down before the runs;
   - M4 decides the inputs;
   - wMul is an input over 1.0 to 1.17, not a fitted number. This is how "the epoch frees it" (E-2) reads once G11's
     widths are sourced.
5. **After G10, search the encounter's geometry again only if `calibrate_encounter.js` moves the tear's extent or the
   contact's stations.** If only the area constant moves, its refit is enough. G14 and G2 can go first without G10
   (the risks' cut).
6. **A-7:** print both pump schedules beside the two founders from stage A on. Whether the watch takes the night's own
   schedule is for after the epoch, because it changes what the watch is.

**Sequencing.** The Carpathia rerun on join 7's main comes first, as ordered. Its note says that G18 makes every
searched night a bit-level perturbation (section 5.5). Stage 0's four measurements then run in a scratch copy of the
same main (about 10 minutes, one turn), before any code. Stage A can be ready for join 8. B1 waits for U0's E2a.
