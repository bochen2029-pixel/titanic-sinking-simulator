# RESULT: the search for the Carpathia question (W5), v4: rerun on the landed member C with the kept set (the calibration epoch's D5)

- **Written:** 2026-11-23 14:36 CST (clock), by the mainline session "Titanic simulator model accuracy" (Claude Code
  74cc0d65, Opus 5.5), from the search's own reports of its two runs, 13:28 to 14:13 and 14:18 to 14:34 CST.
- **Status:** the calibration epoch's D5 (the coordinator's sequencing, 2026-11-23), for join 16.
  - It supersedes v3's figures, and the remeasure of v3's best night on C (c7c9212).
  - Nothing here says she could have been saved (D22). The result is its table: past the target on k of N.
  - Advice; nothing decided.
- **Supersedes:** `RESULT_carpathia_search_v3_2026-11-21.md`'s figures; v3 stays as written.
- **Lineage:**
  - v1 (the method, the honesty rule, the guesses), v2, and v3 with its Remeasured block;
  - the epoch's design v1.1, section 5.5 (D5);
  - D94 (the band of the robustness models);
  - `BACKLOG.md` W5.
- **Made with:** `tools/carpathia.js` (evaluation 3) on claude/d5-carpathia, in `C:\temp\titanic-wt-d5`.
  - The tree: join 15's main cc96b35, with claude/plant-f1-g3 and claude/nh5-gallery. The six model files the progress
    file hashes are join 16's.
  - The search's first run, 13:28 to 14:13 CST (2,726 s), tried 1,615 nights; its best was T+165.33 (+1.86).
  - The rerun with `--warm` took v3's best night, as main's `out/carpathia_best.json` held it after the remeasure. It
    ran 14:18 to 14:34 (960 s) and tried 1,751 nights: 2,298 read back from the first run's progress, 493 computed.
  - Its progress is `out/gate/carpathia/nights_2da6a6233432.jsonl`. Its report and summary,
    `report_seed1_n6000_v80.txt` and `summary_seed1_n6000_v80.json`, are beside it. All untracked.
  - Six threads, a budget of 6,000 nights, 80 models, the best three, seed 1.
  - The best night replayed from the start in Node gives the same bits: T+168.04, step 40,570, fingerprint `22bffd3f`
    (the tool's own check).
- **Tags:** [measured] a figure of these runs; [read] in a source a note read; [derived] arithmetic on those; [bet] no
  source.

## 0. The answer

**Not on this model, nor on any of the 79 models in the kept set's band.**
- The best orders the search found keep the 1912 watch afloat 4.6 minutes longer: she founders 168.04 minutes after
  the touch against 163.47 [measured, on the landed member C].
- By the help reader, Carpathia is alongside 265.1 minutes after the touch as the night went, 213.2 had the distress
  call been made at once, and 194.0 had she also made five miles toward Carpathia. So the watch needed 101.7, 49.7 and
  30.6 more minutes.
- The best night falls 26.0 minutes short of the nearest of the three [derived: 194.05 - 168.04].
- In D22's words, the best night is past the target on 0 of 79 models, whichever target:
  - five miles made good (T+194.0): 0 of 79;
  - the call at once (T+213.2): 0 of 79;
  - the night as it went (T+265.1): 0 of 79.
- The 79 are the robustness models whose own watch founders in the kept set's band, 150 to 170 min after the touch
  (D94). One of the 80 is outside it and left out.

That night is v3's orders, refined, with one more pump:
- at T+1, boiler room 4's ash-ejector pump put on boiler room 6, and the pumps handed back to the engineers at T+4;
- full astern from T+28 to T+58;
- at T+31, every free pump that can reach boiler room 6, and every one that can reach boiler room 4;
- at T+70, the doors in bulkhead F raised by hand;
- at T+89, the other ballast pump in the reciprocating engine room put on boiler room 3.

It pumps 1,651 t against the watch's 933. Her list is at most 12.2 degrees until her last ten minutes, and she stays lit
until T+166.3 [measured].

**How firm.** Its gain holds (at least half of it) on 58 of 79 models with the guesses moved, and helps at all on 74.
- On the kept set's 30 members alone (all in the band), with its orders she founders T+154.28 to T+175.27. Its gain is
  -0.50 to +5.99 minutes, median +3.21, and it helps on 28 of 30.
- The longest of them, member 21, still falls 18.8 minutes short of the nearest target [derived: 194.05 - 175.27].
- One guess moved alone breaks it: pumps led through the main after 45 minutes rather than 30 (`pumpLent` 2,700 s).
  There it keeps +1.39.

**How it was found: the warm start.**
- The search's own first run found T+165.33 (+1.86): half astern from T+55 to T+85, and door F at T+137.
- On C every pump order alone costs time (section 3). So the search's beam, which combines only the orders that gain
  alone, took door F and the engines astern, and never tried pumps with them.
- v3's orders, remeasured on C, gave T+165.99 (+2.52): better than anything the first run found.
- So the search now takes a warm start (`--warm FILE`). v3's best night is read back into the search's own moves
  (exact, to the step), refined to T+166.33, and polished with one more order to T+168.04.
- A search never publishes a night worse than one already known (the coordinator, 2026-11-23).

**What moved since v3.**
- v3's +6.04 was join 7's model. The calibration epoch landed member C (D90).
- The watch with no order now founders T+163.47, not 158.95. Its engineers' rules (G18's graded lead) pump 933 t, where
  join 7's pumped 687.
- So orders have less to add [derived].
- G18 no longer makes the watch bimodal: since C2 the founder is continuous in the inputs (systems_tests' G18 rows). A
  small gain in the one-order table is now the order's own effect, not a branch.

**Outside the orders.** Every watertight door held open against its float lasts to T+166.81 (+3.34) from T+1, and to
T+170.46 (+6.99) from T+30. Neither is past any target on any of the 79 models (section 6).

## 1. What changed since v3: the model and the robustness

**The model.** Join 15 (cc96b35) landed the calibration epoch's stage D: member C as the defaults, every stage C switch on
(D90). The tree also has join 16's plant: F1's coal shares, and G3 ruled with no change in logic. The 1912 watch with no
order after the ice founders at T+163.47 (step 39,473, fingerprint `48b71712`, 933 t pumped) [measured].

**The search,** evaluation 3:
- The robustness models (D5; the epoch's design, 5.5). There are 80:
  - the model as it stands;
  - each guess at each end of its range (29);
  - each of the kept set's 30 members alone;
  - 20 draws of every guess together on a drawn member.

  Each member forks its own watch, with its own encounter (`tools/ensemble.js`'s memberIce and memberWatch, as NH3 and
  the gallery run them).
- The band (D94): a model counts when its own watch founders 150 to 170 min after the touch, the kept set's band
  (`out/kept_1912.json`). 79 of the 80 do. The one outside is every guess drawn on member 12, whose own watch founders
  at T+173.53.
- The warm start, `--warm`.
- Unchanged: the orders, the score, the budget and seed, and the method, cheapest first.

**Its phases** [measured]:
1. One order at a time: the table of section 3.
2. The handful that matter, together: door F, and half astern for half an hour. They are the only orders that gain a
   quarter of a minute alone. 62 and 183 nights, the best at 165.31; refined to 165.33, 165.32 and 164.91.
3. Random restarts from the seed: 400 nights; the best four refined to 164.85 to 164.91.
   - 3b. The warm start: v3's night, T+165.99 here, as remeasured; refined to 166.33.
4. The best night so far with one more order: 168.04.

**What moved** [measured]:

| | v3 (join 7's model) | v4 (C, this note) |
|---|---:|---:|
| The watch, no order after the ice | T+158.95 | T+163.47 |
| The best night | T+164.99 (+6.04) | T+168.04 (+4.57) |
| v3's best orders on this model | - | T+165.99 (+2.52) |
| Nights of the search | 3,667 | 1,751 |
| Carpathia alongside: as the night went / call at once / and five miles | 265.14 / 213.16 / 193.96 | 265.15 / 213.17 / 194.05 |
| The best night short of the nearest target | 29.0 min | 26.0 min |
| Pumped: the best night / the watch | 1,643 t / 687 t | 1,651 t / 933 t |
| Robustness models / counted (in the band) | 40 / 40 | 80 / 79 |
| Its gain holds (half of it) / helps at all | 34 / 40 of 40 | 58 / 74 of 79 |
| Past any target | (not counted) | 0 of 79 |
| Guesses that break it, moved alone | 1 (`pumpAbandon`) | 1 (`pumpLent`) |
| Every door held open from T+1 (not an order) | T+175.89 | T+166.81 |

## 2. The targets: Carpathia alongside, from the help reader

From `core/readers/world.js`, on the 1912 watch [measured]:

| What is done differently | Carpathia alongside (T) | She must last this much longer than 163.47 |
|---|---:|---|
| nothing (1912) | 265.15 | 101.7 |
| the call made at once | 213.17 | 49.7 |
| the call at once, and five miles made good toward her | 194.05 | 30.6 (that night founders at T+163.35) |

On the best night the help reader brings Carpathia alongside at T+244.63, on her own track with the call as made in
1912.

## 3. One order at a time: what matters at all

Minutes gained over the baseline, each order alone at its best moment, the most first [measured]:
- the doors in bulkhead F raised by hand, at T+120: +1.04 (at T+90: +0.8);
- half astern for half an hour, from T+60: +0.66;
- full astern for half an hour, from T+60: +0.54;
- every other order at its best moment: +0.11 or less.

Most orders cost time:
- moving boiler room 5's own pump to boiler room 4, 3 or 2 at T+1: -6.2; to boiler room 6: -5.7;
- every pump that can reach boiler room 2, or any room aft of it, from T+1 to T+30: -3.5;
- every pump put on any one boiler room, at any moment tried: -0.3 to -3.5;
- full ahead for half an hour: up to -2.2.

These orders change no bit of the night at any moment tried:
- raising the doors in bulkheads H, J and O;
- boiler rooms 6's and 5's own pumps (refused: already on);
- drawing boiler room 6's fires.

So on C the pumps help only together with the engines astern and door F. That is why the beam missed them, and why the
warm start was needed (section 0).

## 4. The best nights

| # | Minutes | Gain | Orders |
|---|---:|---:|---|
| 1 | 168.04 | +4.57 | T+1 boiler room 4's ash-ejector pump on boiler room 6; T+4 the pumps handed back; T+28 full astern; T+31 every free pump that can reach boiler rooms 6 and 4; T+58 stop; T+70 door F raised; T+89 the other ballast pump of the reciprocating engine room on boiler room 3 |
| 2 | 167.68 | +4.21 | the same pumps from T+1 and T+4; T+31 boiler rooms 6's and 4's; T+70 door F; T+90 that ballast pump on boiler room 3; no engine order |
| 3 | 167.45 | +3.98 | T+28 full astern; T+31 boiler rooms 6's and 4's; T+58 stop; T+70 door F; T+89 that ballast pump on boiler room 3 |

Each pumps 1,549 to 1,651 t, and her list stays at 12.2 degrees until her last ten minutes. Each replays from the start
in Node to its own bits: fingerprints `22bffd3f`, `dd180d1e` and `fd0884f1` [measured].

## 5. How firm: the best nights on eighty models

**Night 1 (+4.57).**
- Of the 79 models in the band:
  - its gain holds (at least half of it, and half a minute) on 58;
  - it lasts as long (within half a minute) on 44;
  - it helps at all on 74.
- It is past no target on any of the 79.
- On the 30 members alone: she founders T+154.28 to T+175.27; its gain is -0.50 to +5.99, median +3.21; it helps on 28.
- One guess moved alone breaks it: `pumpLent` 2,700 s, where it keeps +1.39.

**Night 2 (+4.21).** Holds on 64 of 79 and helps on 76. On the members it gains -0.20 to +6.05, median +3.52, and helps
on 29. `pumpLent` alone breaks it.

**Night 3 (+3.98).** Holds on 51 of 79 and helps on 73. On the members it gains -0.70 to +5.70, median +2.76, and helps on
28. `pumpLent` and `pumpAbandon` each break it alone.

The guesses that move night 1 most [measured]:
- pumps led through the main after 45 minutes (`pumpLent` 2,700 s): +1.39;
- the pumps' rate at 0.7 times: +3.09;
- the pumps never given up (`pumpAbandon` 99 m): +2.68, on a baseline that itself lasts to T+169.21;
- the pumps' suctions at 1.2 times: +3.69, on a baseline of T+165.88.

The 19 joint draws in the band keep -0.60 to +4.50. The flagged model, every guess drawn on member 12, would give
T+176.31 (+2.78). It is outside the band and not counted.

## 6. Outside the orders

These are watertight doors held open against their floats: the floats are disarmed in a copy, and no order on a watch
can do it, so this is not a night to publish [measured]:

| What is held open | She founders | Her list | Dark | Over the 79 models |
|---|---|---|---|---|
| every door, C to O, from T+1 | T+166.81 (+3.34) | 16.7 degrees at T+45 | T+112.2 | gain -23.9 to +20.3, median +3.3; past no target on any |
| every door from T+30, when the engineers began raising them in 1912 | T+170.46 (+6.99) | 14.7 at T+55 | T+128.5 | -16.5 to +23.0, median +7.0; past no target |
| D, E and F only, from T+1 | T+122.30 (-41.17) | 2.3 at T+6 | T+120.5 | -50.3 to -37.6 |
| G to O from T+30 (the doors raised in 1912, held) | T+157.19 (-6.28) | 16.2 at T+146 | T+155.3 | -12.8 to -2.5 |

`doorLowA`, the tank-top doors' area, halves the first two's gain when moved alone (for the first, so do `sill` and
`suction`).

## 7. What was not searched, and why

As in v1 to v3 (v1, section 7):
- no order holds a door against its float;
- the ice is never met again: a night that puts her back on the berg is shown and never taken as a best night (none
  this time);
- the lifeboats and the readers are not orders of the flooding.

## 8. The guesses

v2's fifteen, as before, and now the epoch's `calib`: a member of the kept set, alone or drawn with the others (D5). The
vent of G7's peak tank (the epoch's C5 review) is not yet among them.

## 9. To rerun it

Take v3's night as remeasured on C (main's record from c7c9212 to this note):
`git show cc96b35:out/carpathia_best.json > warm.json`.

Then, on join 16's tree:
`node tools/carpathia.js --nights 6000 --jobs 6 --variants 80 --robust 3 --seed 1 --warm warm.json`.
- It takes about 45 minutes here on six threads with no progress, and 16 with the first run's progress read back.
- Its progress is named by a hash of the six model files, the evaluation (3) and the kept set's name
  (`nights_2da6a6233432.jsonl`), so a rerun on the same code reads it back.
- Its report and summary are `report_seed1_n6000_v80.txt` and `summary_seed1_n6000_v80.json` in `out/gate/carpathia/`.
- The best night is `out/carpathia_best.json`. Its address opens it as a replay on the page (night_end_site, section 4b).
- When the model moves before the search is rerun, `node tools/carpathia.js --remeasure LABEL` replays the best night's
  orders on the model as it stands, as c7c9212 did.
