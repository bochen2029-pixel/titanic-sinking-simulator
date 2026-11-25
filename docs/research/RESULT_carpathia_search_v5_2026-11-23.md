# RESULT: the search for the Carpathia question (W5), v5: each night to its hand-over at the break's onset (G12, evaluation 4)

- **Written:** 2026-11-23 23:34 CST (clock), by the mainline session "Titanic simulator model accuracy" (Claude Code
  74cc0d65, Opus 5.5), from the search's own report of its run, 20:07:18 to 20:47:58 CST.
- **Status:** G12's cascade (D98, Bo, 2026-11-23: "Yes, option (a)"), for join 19.
  - It supersedes v4's figures. v4's nights ran to her flag, the core's foundering. These run to her hand-over, which on
    the 1912 watch is now the break's onset.
  - Nothing here says she could have been saved (D22). The result is its table: past the target on k of N.
  - Advice; nothing decided.
- **Supersedes:** `RESULT_carpathia_search_v4_2026-11-23.md`'s figures; v4 stays as written.
- **Lineage:**
  - v1 (the method, the honesty rule, the guesses), v2, v3, and v4 (D5: the kept set as the robustness models);
  - G12's plan, `docs/DESIGN_G12_the_way_up_at_the_flag_v1_2_2026-11-23.md` (Z1): its step 3, the mainline's lane;
  - D94 (the band of the robustness models), D98 (the hand-over at the onset by default);
  - `BACKLOG.md` W5.
- **Made with:** `tools/carpathia.js` (evaluation 4) on claude/g12-carpathia-v5 at 972b9d7, in `C:\temp\titanic-wt-carp5`.
  - The tree: claude/g12-switch (G12's step 2, the switch, and the mainline's step 3), with U0's efad114 (G24's patch
    A: seaHeads' normals on the ship's own hull; no watch's bits move) and B1+B2's cascade f7bbcb1 merged. The nine files
    the progress name hashes are join 19's, blob by blob (25105b1's message).
  - One run, 2,440 s: 2,020 nights tried within the budget, 2,783 computed with the robustness models' nights and the
    arrivals, none read back.
  - Its progress is `out/gate/carpathia/nights_3ebd229090b5.jsonl`, named since evaluation 4 by the six model files and
    the onset's check's three (`core/readers/onset.js`, `section.js`, `girder.js`). Its report and summary,
    `report_seed1_n6000_v80.txt` and `summary_seed1_n6000_v80.json`, are beside it. All untracked.
  - Six threads, a budget of 6,000 nights, 80 models, the best three, seed 1, warm-started from v4's best night (main's
    `out/carpathia_best.json`, T+168.04 to her flag).
  - The best night replayed from the start in Node gives the same bits: T+161.23, step 38,935, fingerprint `9bb19f14`
    (the tool's own check).
- **Tags:** [measured] a figure of this run; [read] in a source a note read; [derived] arithmetic on those; [bet] no
  source.

## 0. The answer

**Not on this model, nor on any of the 79 models in the kept set's band.**
- The best orders the search found keep the 1912 watch whole 4.8 minutes longer: she breaks 161.23 minutes after the
  touch against 156.46 [measured, on the landed member C].
- By the help reader, Carpathia is alongside 265.1 minutes after the touch as the night went, 213.2 had the distress
  call been made at once, and 193.9 had she also made five miles toward Carpathia. So the watch needed 108.7, 56.7 and
  37.5 more minutes.
- The best night falls 32.7 minutes short of the nearest of the three [derived: 193.91 - 161.23].
- In D22's words, the best night is past the target on 0 of 79 models, whichever target:
  - five miles made good (T+193.9): 0 of 79;
  - the call at once (T+213.2): 0 of 79;
  - the night as it went (T+265.1): 0 of 79.
- The 79 are the robustness models whose own watch, carried on to her flag, founders in the kept set's band, 150 to 170
  min after the touch (D94). One of the 80 is outside it and left out.

That night is v4's orders, refined, with every fire drawn:
- at T+2, boiler room 4's ash-ejector pump put on boiler room 6, and the pumps handed back to the engineers at T+4;
- full astern from T+28 to T+58;
- at T+31, every free pump that can reach boiler room 6, and every one that can reach boiler room 4;
- at T+55, the fires drawn in every boiler room;
- at T+70, the doors in bulkhead F raised by hand;
- at T+90, the other ballast pump in the reciprocating engine room put on boiler room 3.

It pumps 1,581 t against the watch's 896. Her list is at most 8.5 degrees until her last ten minutes (12.1 at T+157.4),
her bridge stays above the sea and her lights burn to her end; her engines can be given nothing from T+155.2, after the
fires are drawn [measured].

**How firm.** Its gain holds (at least half of it) on 56 of 79 models with the guesses moved, and helps at all on 76.
- On the kept set's 30 members alone (all in the band), with its orders her end comes T+148.23 to T+169.69. Its gain is
  +0.09 to +5.83 minutes, median +3.03, and it helps on all 30.
- The longest of them, member 21, still falls 24.2 minutes short of the nearest target [derived: 193.91 - 169.69].
- One guess moved alone breaks it, as in v4: pumps led through the main after 45 minutes rather than 30 (`pumpLent`
  2,700 s). There it keeps +1.63.

**What the hand-over changes.** Every night now ends some minutes earlier than v4's, at the first step where the
girder's load reaches her strength, not at the core's foundering. The orders that help are the same kind: v4's night,
read back as its seven moves, gives T+161.18 here, and the search's own phases found nothing better on their own (section
1). The gain is about what it was (+4.76 against +4.57), and the shortfall grows by the minutes the break comes before
the flag (32.7 against 26.0).

**Outside the orders.** Every watertight door held open against its float now gains far more than in v4: from T+1 to
T+165.84 (+9.38), from T+30 to T+169.49 (+13.03). Held open from T+1, her end comes within a minute of v4's foundering
of that night (T+166.81), where the watch's comes seven minutes before its own [derived: the even spread of her water
along her would load her girder later; read, not measured]. Neither is past any target on any of the 79 models
(section 6).

## 1. What changed since v4: the hand-over

**The model.** G12's switch (D98): a watch hands her over to her fall at the break's onset by default, the first step
where the girder's moment or shear reaches her strength somewhere along her (B2's check, `core/readers/onset.js`). The
core's foundering flag is the named what-if (`handover: 'flag'`), today's watch to the bit. Past the hand-over the model
stands still. On the landed member C the 1912 watch with no order after the ice is handed over at T+156.46 (step
37,792, fingerprint `0ae90224`, 896 t pumped), where v4's founders at T+163.47 (step 39,473, `48b71712`, 933 t)
[measured].

**The search,** evaluation 4:
- A night ends at its hand-over: the break's onset, or her flag where she founders first. Its score is the minutes from
  the touch to that end. The best night ends at the onset (its record's `broke`).
- The band (D94) is read as before, on each model's own watch carried on to its flag: the same night with the onset's
  check taken out of the copy. A model counts when that founders 150 to 170 min after the touch. The robustness table's
  own baselines are each model's hand-over, so a member counted in the band may break before T+150 (member 10, T+147.01).
- The progress file's name hashes the onset's check's three files as well as the six model files.
- Unchanged: the orders, the robustness models (80: the model as it stands; each guess at each end, 29; each of the 30
  kept members alone; 20 joint draws), the budget and seed, the warm start, and the method, cheapest first.

**Its phases** [measured]:
1. One order at a time: the table of section 3.
2. The handful that matter, together: door F, and half astern for half an hour. 62 and 183 nights, the best at 158.56;
   refined to 158.67 (half astern from T+53 to T+83, door F at T+144).
3. Random restarts from the seed: 400 nights; the best four refined to 157.93 to 159.09.
   - 3b. The warm start: v4's night (T+168.04 where it was measured, to the flag), T+161.18 here; refined to 161.19
     (the first pump order at T+2 rather than T+1).
4. The best night so far with one more order: every fire drawn at T+55, 161.23.

**What moved** [measured]:

| | v4 (C, to the flag) | v5 (C, to the hand-over) |
|---|---:|---:|
| The watch, no order after the ice | T+163.47 (founders) | T+156.46 (breaks) |
| The best night | T+168.04 (+4.57) | T+161.23 (+4.76) |
| v4's best orders on this model | - | T+161.18 (+4.72) |
| Nights of the search | 1,751 | 2,020 |
| Carpathia alongside: as the night went / call at once / and five miles | 265.15 / 213.17 / 194.05 | 265.15 / 213.17 / 193.91 |
| The best night short of the nearest target | 26.0 min | 32.7 min |
| Pumped: the best night / the watch | 1,651 t / 933 t | 1,581 t / 896 t |
| Robustness models / counted (in the band) | 80 / 79 | 80 / 79 |
| Its gain holds (half of it) / helps at all | 58 / 74 of 79 | 56 / 76 of 79 |
| On the 30 members: gain, median; helps | -0.50 to +5.99, +3.21; 28 | +0.09 to +5.83, +3.03; 30 |
| Past any target | 0 of 79 | 0 of 79 |
| Guesses that break it, moved alone | 1 (`pumpLent`) | 1 (`pumpLent`) |
| Every door held open from T+1 / from T+30 (not an order) | +3.34 / +6.99 | +9.38 / +13.03 |

## 2. The targets: Carpathia alongside, from the help reader

From `core/readers/world.js`, on the 1912 watch [measured]. Against v4 only the five miles' night moves (193.91 against
194.05); the reader places the other ships from her wreck, which is now where she lies at her hand-over (`WRECK_1912`,
74 m from her flag's place):

| What is done differently | Carpathia alongside (T) | She must last this much longer than 156.46 |
|---|---:|---|
| nothing (1912) | 265.15 | 108.7 |
| the call made at once | 213.17 | 56.7 |
| the call at once, and five miles made good toward her | 193.91 | 37.5 (that night ends at T+156.32) |

On the best night the help reader brings Carpathia alongside at T+244.96, on her own track with the call as made in
1912.

## 3. One order at a time: what matters at all

Minutes gained over the baseline, each order alone at its best moment, the most first [measured]:
- the doors in bulkhead F raised by hand: +0.87 (at T+120; +0.7 at T+90);
- half astern for half an hour: +0.68 (from T+60);
- full astern for half an hour: +0.57 (from T+60);
- every other order at its best moment: +0.11 or less.

Most orders cost time:
- moving boiler room 5's own pump to boiler room 4, 3 or 2 at T+1: -5.8; to boiler room 6: -5.3;
- every pump that can reach boiler room 2, or any room aft of it, from T+1 to T+30: -3.1;
- every pump put on any one boiler room: down to -3.1 (at best +0.08, boiler room 6's at T+45);
- full ahead for half an hour: up to -2.2;
- every fire drawn, early: -1.3 at T+1, nothing from T+90 (it helps only with the other orders, section 0).

These orders change no bit of the night at any moment tried: raising the doors in bulkheads H to O; boiler rooms 6's
and 5's own pumps (refused: already on); drawing the fires of boiler rooms 6 to 2 one room at a time.

## 4. The best nights

| # | Minutes | Gain | Orders |
|---|---:|---:|---|
| 1 | 161.23 | +4.76 | T+2 boiler room 4's ash-ejector pump on boiler room 6; T+4 the pumps handed back; T+28 full astern; T+31 every free pump that can reach boiler rooms 6 and 4; T+55 every fire drawn; T+58 stop; T+70 door F raised; T+90 the other ballast pump of the reciprocating engine room on boiler room 3 |
| 2 | 161.20 | +4.74 | the same, with the fires drawn at T+58 and that ballast pump at T+89 |
| 3 | 161.19 | +4.73 | the same as 1 without the fires, that ballast pump at T+89 (v4's night, refined) |

Each pumps 1,581 to 1,592 t, and her list stays at 8.5 degrees until her last ten minutes. Each replays from the start
in Node to its own bits: fingerprints `9bb19f14`, `89a06cfe` and `69de7303` [measured].

## 5. How firm: the best nights on eighty models

**Night 1 (+4.76).**
- Of the 79 models in the band:
  - its gain holds (at least half of it, and half a minute) on 56;
  - it lasts as long (within half a minute) on 44;
  - it helps at all on 76.
- It is past no target on any of the 79.
- On the 30 members alone: her end comes T+148.23 to T+169.69; its gain is +0.09 to +5.83, median +3.03; it helps on
  all 30.
- One guess moved alone breaks it: `pumpLent` 2,700 s, where it keeps +1.63.

**Night 2 (+4.74).** Holds on 56 of 79 and helps on 77. On the members it gains +0.17 to +5.88, median +3.03, and helps
on 30. `pumpLent` alone breaks it.

**Night 3 (+4.73).** Holds on 57 of 79 and helps on 77. On the members it gains +0.17 to +5.91, median +3.02, and helps
on 30. `pumpLent` alone breaks it.

The guesses that move night 1 most [measured]:
- pumps led through the main after 45 minutes (`pumpLent` 2,700 s): +1.63;
- the pumps' rate at 0.7 times: +3.37;
- the pumps never given up (`pumpAbandon` 99 m): +3.05, on a baseline that itself lasts to T+162.03;
- pumps led through the main after 10 minutes (`pumpLent` 600 s): +3.55;
- the tank-top doors' point 0.45 m higher (`sill`): +3.84; their size at 1 m2 (`doorLowA`): +3.88.

The 19 joint draws in the band keep -1.01 to +4.35. The flagged model, every guess drawn on member 12, would give
T+170.73 (+2.62). It is outside the band and not counted.

## 6. Outside the orders

These are watertight doors held open against their floats: the floats are disarmed in a copy, and no order on a watch
can do it, so this is not a night to publish [measured]:

| What is held open | Her end | Her list | Dark | Over the 79 models |
|---|---|---|---|---|
| every door, C to O, from T+1 | T+165.84 (+9.38) | 16.7 degrees at T+45 | T+112.2 | gain -16.7 to +24.5, median +9.4; past no target on any |
| every door from T+30, when the engineers began raising them in 1912 | T+169.49 (+13.03) | 14.7 at T+55 | T+128.5 | -10.4 to +27.1, median +13.0; past no target |
| D, E and F only, from T+1 | T+116.83 (-39.63) | 2.3 at T+6 | never | -48.3 to -37.2 |
| G to O from T+30 (the doors raised in 1912, held) | T+153.03 (-3.43) | 13.2 at T+142 | never | -10.5 to -0.6 |

`doorLowA`, the tank-top doors' size, halves the first two's gain when moved alone. Their gains are larger than v4's
(+3.34 and +6.99 to the flag) because the hand-over moves later with them [measured]; why the break comes later with the
doors open is read, not measured (section 0).

## 7. What was not searched, and why

As in v1 to v4 (v1, section 7):
- no order holds a door against its float;
- the ice is never met again: a night that puts her back on the berg is shown and never taken as a best night (none
  this time);
- the lifeboats and the readers are not orders of the flooding;
- nothing past the hand-over: what her pieces do in her fall is not a night's result.

## 8. The guesses

As in v4: v2's fifteen, and the epoch's `calib` (a member of the kept set, alone or drawn with the others; D5). The
break's own strength is not among them: the onset is B2's check on the model's scantlings, untuned (CLAUDE.md, B2), and
B1+B2's what-ifs of the joint (the parting strain, the girders) act after the onset, in the fall.

## 9. To rerun it

Take v5's best night (main's `out/carpathia_best.json` after join 19). Then, on the tree:
`node tools/carpathia.js --nights 6000 --jobs 6 --variants 80 --robust 3 --seed 1 --warm out/carpathia_best.json`.
- It took 41 minutes here on six threads with no progress, beside the coordinator's browser suites and NH13's guide.
- Its progress is named by a hash of the six model files, the onset's check's three, the evaluation (4) and the kept
  set's name (`nights_3ebd229090b5.jsonl`), so a rerun on the same code reads it back.
- Its report and summary are `report_seed1_n6000_v80.txt` and `summary_seed1_n6000_v80.json` in `out/gate/carpathia/`.
- The best night is `out/carpathia_best.json`. Its address opens it as a replay on the page, handed over at the break's
  onset as every default watch is (night_end_site, section 4b: the card "She broke").
- When the model moves before the search is rerun, `node tools/carpathia.js --remeasure LABEL` replays the best night's
  orders on the model as it stands.
