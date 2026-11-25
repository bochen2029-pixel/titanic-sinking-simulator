# RESULT: the search for the Carpathia question (W5), rerun on join 7's model, v3 (join 7's snapshot)

- **Written:** 2026-11-21 03:05 CST (clock), by the mainline session "Titanic simulator model accuracy" (Claude Code
  74cc0d65, Opus 5.5), from the search's own report of the rerun of 02:18 to 03:03 CST.
- **Status:** join 7's snapshot (D77, the coordinator, 01:1x CST). It supersedes v2's figures.
  - The search is v1's (evaluation 2, unchanged); the model under it changed (joins 6 and 7).
  - The calibration epoch's stage D5 reruns the search on the kept set of parameter sets, and replaces these numbers
    (`docs/DESIGN_calibration_epoch_v1_1_2026-11-21.md`, section 5.5).
  - Nothing here says she could have been saved (D22). Advice; nothing decided.
- **Superseded, 2026-11-23,** by `RESULT_carpathia_search_v4_2026-11-23.md` (the epoch's D5). That search, warm-started
  from these orders, found T+168.04 on C; past no target on any of the 79 models in the kept set's band.
- **Remeasured, 2026-11-23** (the coordinator's ask, for join 15; by the mainline): every figure below is join 7's.
  - The same orders on C (D90: the calibration epoch's landing, dbb3276), replayed from the start by
    `tools/carpathia.js --remeasure`, founder at T+165.99 (10,019.5 s, step 40,078, fingerprint `cc4934b9`), against
    that model's own watch at T+163.47 (step 39,473, `48b71712`). That is 2.5 minutes longer, where join 7's model gave
    6.0 [measured].
  - `out/carpathia_best.json` holds the remeasured night, with join 7's figures in `was`.
  - Only the night was replayed. The targets, the robustness rerun and the what-ifs below were not rerun on C.
  - The epoch's D5 reruns the search on the kept set and replaces all of it.
- **Supersedes:** `RESULT_carpathia_search_v2_2026-11-20.md`'s figures; v2 stays as written.
- **Lineage:**
  - v1 (the method, the honesty rule, the guesses) and v2;
  - `docs/research/RESULT_G7_ladder_v1_1_2026-11-21.md` (G7 and G18);
  - the epoch's design (D5);
  - `BACKLOG.md` W5 and G18.
- **Made with:**
  - `tools/carpathia.js` (evaluation 2, unchanged) on join 7's main 5e4d3cd, in a clean worktree
    (`C:\temp\titanic-wt-carpathia3`);
  - its progress is `out/gate/carpathia/nights_a6a1b143ac3c.jsonl`, and its report `report_seed1_n6000_v40.txt` beside
    it (both untracked);
  - the run: a budget of 6,000 nights, six threads, 40 models, the best three, seed 1, 02:18 to 03:03 CST (2,744 s);
    3,667 nights of the search, 4,001 computed with the robustness rerun and the what-ifs.
  - The best night replayed from the start in Node gives the same bits: T+164.99, step 39,838, fingerprint
    `fc279dec`, no order refused (the tool's own check). The page's replay is night_end_site's row, in join 8's gate.
- **Tags:** [measured] a figure of this run; [read] in a source a note read; [derived] arithmetic on those; [bet] no
  source.

## 0. The answer

**Not on this model, and by a wider margin than v2.**
- The best orders the search found keep the 1912 watch afloat 6.0 minutes longer: she founders 164.99 minutes after
  the touch against 158.95 [measured, on join 7's model; the same orders on C (D90): 165.99 against 163.47].
- By the help reader, Carpathia is alongside 265.1 minutes after the touch as the night went, 213.2 had the distress
  call been made at once, and 194.0 had she also made five miles toward Carpathia. So the watch needed 106.2, 54.2 and
  35.0 more minutes.
- The best night falls 29.0 minutes short of the nearest of the three [derived: 193.96 - 164.99].

That night is pumps, the engines astern for half an hour, and one door:
- at T+1, boiler room 4's ash-ejector pump put on boiler room 6, and the pumps handed back to the engineers at T+4;
- full astern from T+28 to T+58;
- at T+31 every free pump that can reach boiler room 6, and at T+32 every one that can reach boiler room 4;
- at T+68 the doors in bulkhead F raised by hand.

It pumps 1,643 t against the watch's 687. Her list is at most 7.4 degrees until her last ten minutes, and she stays lit
until T+164.1 [measured].

**Why the gain is less than half of v2's.** The engineers' own rules now do much of what v2's best night did.
- Since join 6, boiler room 5 is holed only inside its bunker, which holds the stokehold dry for its pump until it gives
  way (W6).
- The watch with no order now pumps 687 t, where v2's pumped 264 [measured]. So orders have less to add [derived].
- No single order buys more than 1.5 minutes (section 3). Moving a pump from the room it stands in early costs up to
  4.9 minutes.

**How firm.**
- Its gain holds (at least half of it) on 34 of 40 models with the guesses moved, and helps at all on 40.
- One guess moved alone breaks it: pumps never abandoned (`pumpAbandon` 99 m). There the baseline itself lasts to
  T+166.01, and the night adds 2.56.
- On the ten models with every guess drawn at once it keeps 1.1 to 6.1 minutes [measured].

The Court found that the pumps "could not have prolonged her life appreciably". This model's answer is that no single
order buys more than about a minute and a half, and everything a crew could order together about six.

**G18 (D77).** The 1912 watch is bimodal at the bit level.
- The engineers' one-shot lead of pumps to boiler room 4 through the main, at about T+105, meets `roomLost` at its
  threshold. A last-bit change moves her founder by about 1.35 minutes, and the later lead to boiler room 3 by about
  0.65 more (`BACKLOG.md` G18).
- Every night the search tries is a bit-level perturbation of the watch, and may fall on either branch. The baseline
  here is on the branch where pumps are led (T+158.95).
- So a gain under about 1.5 minutes in the one-order table (section 3) may be a branch, not an order's effect. The best
  night's 6.04 is well above it.
- The epoch's stage C mends the doctrine, and its D5 reruns this search on the kept set.

**Outside the orders.** Every watertight door held open against its float lasts to T+175.89 (+16.94). It is past no
target on any of the 40 models. v2's same what-if reached T+195.28 and passed the nearest target on 34 of 40, so the
doors held open are now a much smaller lever (section 6).

## 1. What changed since v2: the model, not the search

**The model.**
- Join 6 (2026-11-20):
  - G6: boiler room 5 holed only inside its forward bunker;
  - G6b: the preset and the watch on one damage split, Hackett and Bedford's;
  - W6: the bunker of the fire as a pocket that holds until its strength;
  - and the refit D73.
- Join 7 (2026-11-21):
  - G7: the forepeak held to its tank;
  - G11: the plans' E-deck widths;
  - and rung 2b's refit: the opening 0.8196 m², wMul 1.1, aDown 0.2786, fOpen 0.02087.
- The 1912 watch with no order after the ice now founders at T+158.95 (step 38,389, fingerprint `1a1bd179`, 687 t
  pumped), against v2's 157.75 [measured].

**The search.** Unchanged: evaluation 2, the same orders, the same score, the same budget and seed, and the same method,
cheapest first.
- It ran on six threads, where v2 ran five. The table is the same on any number of threads (`tools/carpathia_tests.js`).
- Its phases [measured]:
  1. One order at a time, at ten moments each: the table of section 3.
  2. The handful that matter, together: every pump that can reach boiler room 6; every pump that can reach boiler room
     4; full astern for half an hour; door F; the pumps handed back.
     - One to five orders: 124, 611, 461, 306 and 185 nights, the best at 160.43, 163.08, 163.71, 164.00 and 164.00.
     - Its best three refined to the minute: 164.20, 164.47, 163.91.
  3. Random restarts from the seed: 400 nights; the best four refined: 161.62, 161.81, 160.33, 160.43.
  4. The best night so far with one more order: 164.47 to 164.99.

**What moved** [measured]:

| | v2 (2026-11-20) | v3 (this note) |
|---|---:|---:|
| The watch, no order after the ice | T+157.75 | T+158.95 |
| The best night | T+171.38 (+13.63) | T+164.99 (+6.04) |
| Nights of the search | 5,004 | 3,667 |
| Carpathia alongside: as the night went / call at once / and five miles | 265.15 / 213.17 / 193.98 | 265.14 / 213.16 / 193.96 |
| The best night short of the nearest target | 22.6 min | 29.0 min |
| Pumped: the best night / the watch | 2,828 t / 264 t | 1,643 t / 687 t |
| Its gain holds (half of it) / helps at all, of 40 models | 33 / 40 | 34 / 40 |
| Guesses that break it, moved alone | 0 | 1 (`pumpAbandon`) |
| Every door held open from T+1 (not an order) | T+195.28 | T+175.89 |

## 2. The targets: Carpathia alongside, from the help reader

From `core/readers/world.js`, on the 1912 watch [measured]:

| What is done differently | Carpathia alongside (T) | She must last this much longer than 158.95 |
|---|---:|---|
| nothing (1912) | 265.14 | 106.2 |
| the call made at once | 213.16 | 54.2 |
| the call at once, and five miles made good toward her | 193.96 | 35.0 (that night founders at T+158.84) |

On the best night the help reader brings Carpathia alongside at T+247.23, on her own track with the call as made in
1912.

## 3. One order at a time: what matters at all

Minutes gained over the baseline, each order alone at its best moment, the most first [measured]:
- every pump that can reach boiler room 4, at T+45: +1.48;
- every pump that can reach boiler room 6, at T+45: +0.82;
- full astern for half an hour, from T+30: +0.73;
- the doors in bulkhead F raised by hand, at T+60: +0.57;
- a single engine-room or boiler-room pump led to boiler room 4, at T+60: +0.17 to +0.18;
- astern for ten or thirty minutes, around T+45 to T+60: +0.07 to +0.14.

Most orders cost time:
- moving boiler room 5's own pump to boiler room 4 or 3 at T+1: -4.9;
- moving it to boiler room 6: -4.5;
- every pump onto the holds forward in the first minutes: -1.2 to -1.8 (refused from T+5, once the holds' suctions are
  under water);
- full ahead for half an hour: up to -2.2.

These orders change no bit of the night at any moment tried:
- raising the doors in bulkheads H, J, N and O;
- boiler rooms 6's and 5's own pumps (already on);
- drawing the fires of any one boiler room.

**Read with G18.** Every figure under about 1.5 minutes in this list may be the watch taking its other branch at about
T+105, not the order's own effect. The ranking among the small ones is not to be leaned on.

## 4. The best nights

| # | Minutes | Gain | Orders |
|---|---:|---:|---|
| 1 | 164.99 | +6.04 | T+1 boiler room 4's ash-ejector pump on boiler room 6; T+4 the pumps handed back; T+28 full astern; T+31 every free pump that can reach boiler room 6; T+32 every free pump that can reach boiler room 4; T+58 stop; T+68 door F raised |
| 2 | 164.86 | +5.90 | the same pumps from T+1 and T+4; T+31 boiler room 6's; T+32 full astern; T+35 boiler room 4's; T+62 stop; T+67 door F |
| 3 | 164.67 | +5.72 | T+29 full astern; T+31 boiler room 6's; T+35 boiler room 4's; T+59 stop; T+60 a bilge pump of the engine room on boiler room 3; T+66 door F |
| 4 | 164.64 | +5.69 | as 3, without the bilge pump; T+120 every free pump that can reach boiler room 3 |
| 5 | 164.56 | +5.61 | as 4, boiler room 5 for boiler room 3 at T+120 |

Each pumps 1,605 to 1,663 t; her list stays at 7.0 to 7.4 degrees until her last ten minutes. Each replays from the
start in Node to its own bits (fingerprints `fc279dec`, `38905554`, `ee356adf` for the first three) [measured].

## 5. How firm: the best nights on forty models

**Night 1 (+6.04):**
- its gain holds (at least half of it, and half a minute) on 34 of 40 models;
- it lasts as long (within half a minute) on 29;
- it helps at all on 40.
- One guess moved alone breaks it: `pumpAbandon` 99 m, the pumps never given up. The baseline then lasts to T+166.01
  by itself, and the night adds 2.56.
- Nights 2 and 3 are the same: 34 of 40, 40 of 40, broken alone by `pumpAbandon` only.

The guesses that move it most [measured]:
- the pumps' suctions at 0.8 and 1.2 times: +4.09 and +6.95;
- pumps led through the main after 45 minutes (`pumpLent` 2,700 s) rather than 30: +3.85;
- the pumps' rate at 0.7 times: +5.16;
- the bow's crushed length at 20 m: +5.64.
- On the ten models with every guess drawn at once it keeps +1.09 to +6.14.

## 6. Outside the orders

Watertight doors held open against their floats (the floats disarmed in a copy; no order on a watch can do it, so
this is not a night to publish) [measured]:

| What is held open | She founders | Her list | Dark | Over the 40 models |
|---|---|---|---|---|
| every door, C to O, from T+1 | T+175.89 (+16.94) | 21.1 degrees at T+83 | T+119.9 | gain +0.8 to +27.8, median +16.9; past no target on any |
| every door from T+30, when the engineers began raising them in 1912 | T+176.88 (+17.92) | 21.0 at T+85 | T+130.4 | +3.3 to +28.4, median +17.9; past no target |
| D, E and F only, from T+1 | T+125.38 (-33.57) | 3.4 at T+8 | T+124.6 | -35.0 to -31.1 |
| G to O from T+30 (the doors raised in 1912, held) | T+157.21 (-1.74) | 11.7 at T+146 | T+156.4 | -2.0 to -0.0 |

`doorLowA` (the tank-top doors' area) is the guess that halves the first two's gain when moved alone, as in v2.

## 7. What was not searched, and why

As in v1 and v2 (v1, section 7): no order holds a door against its float; the ice is never met again (a night that
puts her back on the berg is shown and never taken as a best night: none this time); the lifeboats and the readers are
not orders of the flooding.

## 8. The guesses

As in v2's section 8, unchanged in this run. The epoch adds two:
- `calib`, a member of the kept set, so that the search runs on every parameter set the ledger can't rule out (D5);
- the vent of G7's peak tank, its area and its outlet (the epoch's C5 review).

## 9. To rerun it

`node tools/carpathia.js --nights 6000 --jobs 6 --variants 40` on join 7's main (about 46 minutes here on six
threads, alone).
- Its progress is named by a hash of `core/`'s files and the evaluation (`nights_a6a1b143ac3c.jsonl`), so a rerun on
  the same code reads it back.
- Its report and summary are `report_seed1_n6000_v40.txt` and `summary_seed1_n6000_v40.json` in
  `out/gate/carpathia/`.
- The best night is `out/carpathia_best.json`; its address opens it as a replay on the page.
- The epoch's D5 reruns it on the kept set, with `EVAL_VERSION` bumped.
