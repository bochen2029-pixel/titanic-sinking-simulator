# Z3, the join: the fall engine on the watch and on the page (a design, v1)

- **Written:** 2026-11-20, 09:55 CST, by the Z1 session (Claude Code 7fe8d708, Opus 5.5).
- **Asked for by:** the coordinator (local_5ca1b235), "yes, design Z3 on paper now", under six constraints. Sections 1 to 6 answer them in order.
- **Supersedes:** a draft of 09:50, written before those constraints (not carried).
- **Status:** design only. Nothing is built and no tree is changed.
- **Accepted** by the coordinator (about 10:00), with its answers:
  - 'onset' is in Z3, as a what-if and a CHECK row;
  - the director's cuts and the sounds are Z3b;
  - Z3 edits `deep_site` after Z2 has landed;
  - the boats stay frozen at the flag;
  - the surface minute plays at the player's pace.

  Section 8 (each preset's sea) was added at 10:25, at its decision.
- **Carried into the repository** at the coordinator's request, from the app's shared notes folder (`Z1_design_Z3_the_join_2026-11-20.md`). The text is as accepted, with two changes:
  - "`sim.fall.t` equals `sim.t`" is qualified "until the fall is done", as the prototype showed;
  - section 9 is new: the design's riskiest rows, proved at 10:45 to 10:47 on a prototype in a scratch copy.
- **Built:** by Z1's session as step 3 of plan v2.1, after step 2 (the four lanes landed, one full gate).
- **Trees read** (line numbers below are as of these):
  - `core/` on `a97a6bd`, the same as the main checkout's working tree except `people.js`, whose lines here are the main checkout's;
  - `site/app.js` and `75_deep.js` in Z2's worktree (uncommitted, read-only), with its `CONTINUATION.md`;
  - `onset.js` in B1+B2's worktree (read-only).

  The joins will shift the lines. The function names hold.

## 0. In one paragraph

The fall becomes a reader of the night. Past the hand-over, the night's step does only four things: it runs the orders that are due, counts the step, advances `sim.t` and steps the readers. The model, the plant, the ice and the night's hash are never touched, so the watch's fingerprint is unchanged and holds through the fall.

- **The fall reader** begins the fall lazily, on the first step past the hand-over. It takes `t0` from the hand-over's state and advances once, so `sim.fall.t` equals `sim.t` from then on, until the fall is done; then the fall's clock stays where it stopped while the watch's runs on. A suite that stops at the flag therefore meets nothing new.
- **On a watch** the page steps the night past the flag, not the engine. On a preset it keeps Z2's seam. Nothing is stepped twice.
- **The readers** run on:
  - the boats stay as they were left on the water;
  - the wireless goes silent (`world.js` needs the one guard it lacks);
  - Carpathia keeps on her way.
- **The moment is an option**, `handover: 'flag' | 'onset'`. 'flag' is the default (D54 (c)); 'onset' is a what-if behind a seam that is the identity under 'flag'.
- **What moves:** no fit, no frozen reference and no fingerprint. Only the tables of the suites that gain rows move, and only by those rows.

## 1. The moment: `handover: 'flag' | 'onset'`

**The option.**
- It is set as `Night.create(ship, spec, { handover: 'onset' })`. It is stored as `sim.night.handover` only when it is 'onset', so a default watch's `sim.night` keeps its shape.
- A replay carries it (`replay`, `resume` and `snapshot` pass the create options); a snapshot records it.
- It is part of a night's identity beside its seed and orders, and the trials and the page label it.

**'flag'** (the default, D54 (c)):
- The hand-over is the core's founder flag, cut at `TitanicGirder.X_BREAK`.
- The contract gives `rule: 'flag'`.
- It is labelled as an interim rule, in the trials and on the page: "the break is taken at the flag (the record: about T 157); her pose there is the model's, not hers".

**'onset'** (a what-if, never the default before B4's cascade). It reads B2's `sim.onset.found`, the reader B1+B2 registers as 'onset' (`onset.js` 126 to 131): `{ k, t, T, x, where, sense, ..., exact }`.

What happens to the core under 'onset', exactly:
1. **On the step B2 finds the onset (`k_o`)** the model steps as on any step, and B2's reader records `found` afterwards.
2. **From step `k_o + 1` the night takes the post-hand-over branch.** The core is no longer stepped: no `C.step` (through the encounter's step), no plant, no ice, no hash.
3. **The watch's end moves** from the flag (T 157.23 on the mainline's tree) to the onset (B2's T, about T 155 to 156 there).
4. **`sim.foundered` never becomes true:** the model never reaches its trim rule.
5. **The watch's final fingerprint** is its hash at `k_o`, not at the flag. That is a different number, and is labelled as the what-if's.
6. **Everything that ends at the flag must end at the hand-over.** That is why 'onset' needs one seam, `Night.over(sim)`, used where the code tests `sim.foundered` to mean "she is gone":

   `over(sim) = sim.foundered || (sim.night && sim.night.handover === 'onset' && !!(sim.onset && sim.onset.found))`

   Under 'flag' it returns `sim.foundered` itself, so the default's bits stay untouched (each site in section 2's table).
7. **The forecast runs without readers.** So under 'onset' it still forecasts the model's flag: the forecast is of the model, and the copy has no `sim.onset`. The page shows the onset when it comes. This is a stated limit, not a bug.
8. **The preset path** (no watch) has no `sim.onset`; the girder part keeps B2's state outside the sim. Z3 offers 'onset' on a watch only, and a preset hands over at the flag.

If the coordinator prefers, 'onset' can be left out of Z3 entirely with the seam still put in. The default does not depend on it.

## 2. The files it touches, with their regions

| File (tree read) | Region | Change | Under 'flag' |
|---|---|---|---|
| `core/night.js` (`a97a6bd`) | `create()` 165 to 185 | `if (opts.handover === 'onset') sim.night.handover = 'onset'` | not set: the same |
| | `step()` 297 to 305 | at the top: `if (over(sim)) { if (w.script) runScript(sim, w); w.k++; sim.t += sim.params.dt; readers; return; }` | runs only past the flag, where nothing ran before |
| | `sink()` 357 to 364 | `!sim.foundered` becomes `!over(sim)` | identical |
| | exports 434 | `over` | new name only |
| | `forecastOf` 386 to 391 | none: the reader names its state `fall`, which is dropped | — |
| | `forecaster.go()` 402 | none: the forecast is of the model | — |
| `core/readers/fall.js` (Z1's branch) | the UMD header, 98 to 103 | take `night.js` as people does (`require('../night.js')`; `root.TitanicNight`) | — |
| | after `step()`, about 1147 | the reader: `if (N && N.reader) N.reader({ name: 'fall', state: 'fall', step: onStep })`; `onStep` in section 3 | a watch that stops at the flag never meets it |
| | `begin()` 1102 to 1146 | accept `opts.t0` (the hand-over's own time; today `sim.t`) and `opts.rule` ('flag' or 'break') | the page's preset call is unchanged |
| `core/readers/world.js` (`a97a6bd`) | `step()` 379 to 391 | once `N.over(sim)`: the set silent ("she has gone", one line), no calls, no rockets; `shipsStep` goes on, so Carpathia keeps her course | before the flag: identical |
| `core/readers/people.js` (main's tree) | `observe` 190 | `o.foundered = !!sim.foundered` becomes `!!N.over(sim)` | identical |
| | `step` 224 | none: the boats are left on the water at the hand-over (`founder`, `count`); their hours after are W17 | — |
| `core/readers/reports.js` (`a97a6bd`) | `step` 547 | `sim.foundered` becomes `N.over(sim)` | identical |
| `site/app.js` (Z2's worktree) | the model's loop, 2753 | `!sim.foundered` becomes `!NT.over(sim)` (a watch) | identical |
| | the flag's branch, 2784 | on a watch, leave the fall to the night: no `fallBegin` here. Under 'onset': its own toast, "She broke at ..." | a preset: as now |
| | `fallBegin` 2572 to 2576 | on a watch, never call `E.begin`; once the night has begun it, `fallTell` its first events | a preset: as now |
| | `fallSteps` 2577 to 2590 | on a watch, `NT.step(sim)` in place of `E.step(sim)`, no `step` hook fired; `fall.prev` and `fallTell` as now | a preset: as now |
| | `syncPlay`, `togglePlay`, `falling`, 1693 to 1694 and about 2568 | `sim.foundered` becomes `NT.over(sim)` where it means "she is gone" | identical |
| `site/parts/75_deep.js` (Z2's) | the card's lines, 476 to 493 | none: it already writes them from `sim.fall.events` and the pieces against `breakAt`. Under 'onset' the first line reads "from where she broke", as for 'flag' | — |
| `core/scenarios.js` (`a97a6bd`) | `PRESETS`, 59 to 110 | a `sea` field on each preset whose fall may run (section 8) | data on the preset, not in `build()`'s output: no run moves |
| `site/app.js` (Z2's worktree) | `fallEngine`, about 2567; `fallBegin` 2572 to 2576 | on a preset, the engine runs only where `SC.PRESETS[S.scen].sea` is set, and `begin` is given `{ sea }` (section 8) | a preset without one: the old slide |
| `tools/*` | section 5 | rows | — |

Nothing in `core/core.js`, `motion.js`, `encounter.js`, `systems.js` or any part other than the two above changes.

## 3. The clock after the hand-over, and the fall as a reader

**The night's branch** (section 2):
- It runs the script's due orders (a reader's orders stay replayable, and the model's own are idle: the model is not stepped) and counts the step.
- It advances `sim.t` by `dt` and steps the readers in their order.
- It never calls the encounter, the plant or `observe`, so `w.hash` is frozen at the hand-over's step, and `fingerprint(sim)` is the same at the flag and on the bed.

**The fall reader's step (`onStep`):**

```
if (sim.fall) { if (!sim.fall.done) advance(sim.fall); return; }
if (!N.over(sim)) return;                          // before the hand-over: nothing, not even a read
const onset = !sim.foundered, tHand = onset ? sim.onset.found.t : sim.founderT;
if (!(sim.t > tHand)) return;                      // the hand-over's own step: the model stepped on it, and the
                                                   // night's branch has not yet run; begin on the next
// the first step past the hand-over: the core's state is the hand-over's, untouched since
if (!onset) begin(sim, { t0: tHand });                                                  // 'flag'
else begin(sim, { any: true, cut: sim.onset.found.x, rule: 'break', t0: tHand });       // 'onset'
advance(sim.fall);                                 // so that sim.fall.t equals sim.t from this step on, until done
```

Under 'onset', if B2 finds no onset before the flag, `over` is `sim.foundered` and she is handed over at the flag with `rule: 'flag'`. The test `sim.t > tHand` does not depend on the order in which the readers step. It holds whether `fall.js` steps before or after `onset.js`, and in Node, where that order is the order of the requires.

**Why lazily, on the first step past the hand-over, and not on the flag's own step:**
1. **Order:** the page bundles the readers in name order, so `fall.js` steps before `onset.js`; on the onset's own step the fall could not see it. On the flag's own step `over` is already true (the model's step set the flag), but `sim.t` is still the flag's. Beginning there and advancing would put the fall one step ahead of the watch's clock.
2. **Cost:** a watch that stops at the flag (every suite, the search, the forecast) never builds the pieces.
3. **Bits:** "begin at t0, then advance" equals "begin at the flag's step, advance at the next", because nothing moves the core's state between the two.

So on a watch, `sim.fall` appears on the first step past the flag. On a preset, Z2's seam begins it on the flag's own step, as now. The two falls are equal to the bit (section 5, row 3).

**The forecast** (`forecastOf`) drops `sim.fall` by its state key, and the copy runs without readers. `forecaster.go()` stops at `sim.foundered` as now.

## 4. The page

- **A watch.**
  - Before the flag: as now.
  - At the flag: the toast and the `foundered` event as now. No `fallBegin`: the night begins the fall on its next step.
  - After the flag: `fallSteps` calls `NT.step(sim)` at the page's pace, at most 700 steps a frame (Z2's cap).
    - Each step advances her clock, the readers and the fall together.
    - `fallTell` fires the fall's events to the parts once and in order, and `fallStep` every step.
    - The `step` hook is not fired: parts hooked on it read the model, which no longer moves.
  - "On the bed" as now (`syncPlay`), when `sim.fall.done`.
- **A preset:** Z2's seam as it is. `E.begin` at the flag, then `E.step` at the page's pace.
- **Nothing is stepped twice:** on a watch only `NT.step` advances the fall, and on a preset only the page's `E.step` does.
- **`tOf(sim)`:** on a watch `sim.fall.t` equals `sim.t`, so it returns `sim.t`; on a preset it returns the fall's, as now.
- **The cost of a step past the flag on a watch** is the fall's advance (e66): 0.5 to 1.5 ms under water and 2 to 5 ms in the first minute with both pieces. At 32x that is 0.1 to 0.2 s of every second under water and up to about 0.6 s at the surface. Z2's 700-step cap bounds a frame.

## 5. The tests

| # | Suite | Row | Kind |
|---|---|---|---|
| 1 | `night_tests` | **The fingerprint unchanged.** The 1912 watch (auto) stepped to the bed: `fingerprint` equals the one at the flag at every step past it, and equals the tracked value (`611be326`, or its rebased value). | MUST |
| 2 | `night_tests` | **A replay to the bed, to the bit.** `snapshot` taken on the bed, `resume`d: every piece's `r`, `q`, `v`, `om` and the events, bit for bit. Also a snapshot taken mid-fall, resumed and run on to the bed. | MUST |
| 3 | `fall_trials` | **The watch's fall equals the preset path's.** On the watch's state at the flag: `begin` at the flag and step, against the reader's lazy begin and advance, to the bed, to the bit. | MUST |
| 4 | `fall_trials` | **Readers off, or a forecast copy:** no `sim.fall` is made, and the copy has none. | MUST |
| 5 | `systems_tests` (the forecast) | **The forecast still equal to the watch:** the existing row, unchanged. Plus: a watch carried past the flag does not change what a forecast taken before the flag says. | MUST |
| 6 | `people_tests` | **Ten minutes past the flag:** the boats as they were left (launched, lost, in the water), unchanged; nothing thrown. | MUST |
| 7 | `reports_tests` | **Ten minutes past the flag:** done, its final unchanged; nothing new in the feed. | MUST |
| 8 | `world_tests` | **Ten minutes past the flag:** the wireless silent from the flag (one line), no call or rocket after it; Carpathia's distance still falling at her speed; nothing thrown. | MUST |
| 9 | `deep_site` (Z2's suite, now Z3's to change) | **The real engine in place of the stub,** on a watch: the page plays from "Foundered" to "On the bed"; each event reaches the parts once and in order; the fall's clock equals the watch's; the card's two lines appear on the `rest` events with the engine's own clock, depth and distance. The stub's rows stay as the fast feed, marked as the stub's. | MUST |
| 10 | `fall_trials` | **'onset', a what-if:** the 1912 watch with `handover: 'onset'` hands over at B2's step, and the core is not stepped after it. Its fingerprint is the hash at `k_o`, printed and labelled the what-if's. The pieces cut at B2's x land where they land, printed. | CHECK (prints) |
| 11 | the gate | **One full gate after Z3,** in the browser's turn. | — |

## 6. What moves

- **No fit** moves: the core, the boats' fit, the reports' constant, the encounter's area constant and the motion's fit are not touched.
- **No frozen reference** moves: `out/seams_reference.json`, `out/headway_reference.json`.
- **No fingerprint** moves: the 1912 watch's, the systems suite's and the search's. Each stops at the flag, and the hash is frozen past it.
- **The tracked tables of the suites that gain rows move, by those rows only:**
  - `out/fall_trials.txt` (rows 3, 4 and 10);
  - the tables of `night_tests`, `people_tests`, `reports_tests`, `world_tests` and `deep_site`, if they print the new rows into them.

  Each is written with `gate.js --write`, with the reason in the commit. No existing row changes; the gate's STALE check proves it line by line.
- **`dist/`** is rebuilt.
- **The User Guide** goes stale by design: a chapter for the descent, caught by `--release`, not the everyday gate.

## 7. Size, order, and what to settle first

**Size: M**, about a day for 'flag':
- about 80 lines of code in seven files: night 10, fall 25, world 10, people 1, reports 1, app 25, scenarios 6;
- twelve test rows in seven suites (row 12 in section 8);
- one full gate.

'onset' adds about 20 lines (the seam's sites are already counted) and one CHECK row.

**Order:**
1. `night.js` with `over`;
2. `fall.js`'s reader, with rows 1 to 4;
3. the readers, with rows 6 to 8;
4. the page, with row 9;
5. 'onset', with row 10;
6. the gate.

**To settle before starting:**
1. **'onset' in Z3, or after it?** It is ready as designed and costs the default nothing.
2. **The director's cuts and the sounds after the flag** (plan 5.4): Z3b, after Z3. Its suite is a browser suite, and its cut list is data with rules of its own.
3. **Who changes `deep_site`.** Z3, since Z2's context is near compaction. Z2's lane report should say its stub rows stay.

The coordinator settled these at about 10:00: 'onset' goes in Z3 as a what-if and a CHECK row; the director and the sounds are Z3b; Z3 edits `deep_site`, on the joining branch after Z2 has landed.

## 8. Each preset's sea (added at 10:25, at the coordinator's decision of about 10:24)

The joined page runs the engine on every preset that founders, because `window.TitanicFall` is in the bundle. Z1 checked this headless at 10:22: titanic, five and britannic fall to rest at about 3.8 km with no throw. But the sea's depth is the 1912 sea's for all of them. The coordinator lists that as a known gap of the joined page until Z3. Z3 closes it so that the fall begins only where a preset has a sea.

**`core/scenarios.js`:** a field `sea` on each preset in `PRESETS`. It is data on the preset object, not in `build()`'s output, so no run of the core moves and no fingerprint or seam is touched. `fall.js`'s `sea(spec)` merges the 1912 sea's defaults (`SEA_1912`), so a depth alone is enough.

| Preset | `sea` | Why |
|---|---|---|
| titanic | `{ depth: 3790 }` | the 1912 site, 3,790 m to the bed [R5 10a; D38] |
| four, five | `{ depth: 3790 }` | the night's what-ifs, at the same place (four never founders; five falls at T 133.53) |
| blank | `{ depth: 3790 }` | the hole tool's hull, at the same place, said so on the card |
| hawke | none | 1911, in shallow water near the Isle of Wight; she never founders in the model anyway |
| britannic | none | 1916, in 119 m in the Kea Channel. Her bow is below 119 m long before the core's trim flag, and the core has no bed. She keeps the old 140 m slide until Z8 (other seas) can carry a ship longer than the water is deep. |

**The page:**
- On a preset, `fallEngine()` returns the engine only where `SC.PRESETS[S.scen].sea` is set, and `fallBegin` calls `E.begin(sim, { sea: SC.PRESETS[S.scen].sea })`. A preset with none keeps the slide, as with no engine.
- On a watch the fall reader uses the fall's own 1912 sea: every watch is the 1912 site (`GEOM_1912`), so the night's spec needs no field until Z8.
- **`fall.js`** does not change for this.

**Row 12** (`deep_site`, or a headless row in `fall_trials` if the page's `fallEngine` is exported for the test):
- britannic and hawke: no `sim.fall` after the flag, and the slide;
- titanic: the fall to the bed at its preset's depth (the bed's depth under her within the slope's metres of 3,790).

## 9. Proved on a prototype (2026-11-20, 10:45 to 10:47 CST)

Before Z3 is built on the joining branch, its riskiest rows were proved on a prototype. The prototype is a scratch copy of `wt/join` at `f9bbd82`, with B1+B2's `onset.js` and `section.js` copied into it read-only. Twelve edits, each an exact anchor found once:
- `night.js`: `over()`, the branch past the hand-over, `sink()` on `over()`, the export;
- `fall.js`: the reader, with its lazy begin, and `begin`'s `opts.t0` and `opts.rule`;
- `world.js`: the guard;
- `people.js` and `reports.js`: `over()`.

No branch was touched. On the 1912 watch (auto orders, every reader on: girder, section, onset, people, reports, world, fall), 20 rows, all PASS, in 54 s:

| # | Row | Result |
|---|---|---|
| 1 | No `sim.fall` on the flag's own step | the reader begins lazily |
| 2 | The first step past the flag | `sim.fall` begun, `t0 = founderT`, `sim.fall.t = sim.t = founderT + dt` |
| 3 | Ten minutes past the flag | `sim.fall.t` equals `sim.t` at every step until the fall is done (+7.91 min) |
| 4 | Once done | the fall's clock stays where it stopped while the watch's runs on |
| 5 | Ten minutes past the flag | the fingerprint is the flag's at every step, `611be326` (step 38,100) |
| 6 | The clock | 2,400 steps: `sim.t` and `w.k` advanced |
| 7 | The wireless | silent from the flag's own step, because the readers step after the model on it; one line, "she has gone" |
| 8 | Rockets | no rocket after the flag |
| 9 | Carpathia on her way | 24.34 to 22.08 nm in ten minutes |
| 10 | The boats | as they were left at the flag |
| 11 | The reports | done |
| 12 | To the bed | done, the fingerprint still `611be326` |
| 13 | A snapshot on the bed, resumed | the fall to the bit, and the same fingerprint |
| 14 | Resumed mid-fall (150 s past the flag) and run on | the same bits |
| 15 | The page's eager begin (at the flag's step, then `step`) | the reader's fall to the bit, over 1,898 steps |
| 16 | `forecastOf` after the flag | leaves `sim.fall` behind |
| 17 | Readers off | no `sim.fall`, and the same fingerprint |
| 18 | 'onset': the core | never stepped after the hand-over; its fingerprint held; she never foundered |
| 19 | 'onset': the fall | its rule is `break`, `t0` the onset's time |
| 20 | 'onset': both pieces | at rest |

**'onset' on the 1912 watch, a what-if:**
- **The onset:** B2's, at step 37,565 (exact), T 155.52 after the touch, x −10.93 (boiler room 2), trim 9.5, list 3.7.
- **The watch** stops there, with fingerprint `51fe6da3`: the what-if's, labelled as such.
- **The bow** (x −10.9 to 130.3) is under in 15.5 s and at rest at +6.94 min, upright (roll −1.1), 1,492 m from `breakAt`.
- **The stern** is under in 56.0 s and at rest at +8.10 min, upright (roll −0.7), 138 m from `breakAt`.

What the prototype did not test:
- the page's half: `fallSteps` stepping the night, and `deep_site` on the real engine;
- row 12's seas;
- the replay through the page.

Those wait for Z3 on the joining branch, after Z2 has landed.
