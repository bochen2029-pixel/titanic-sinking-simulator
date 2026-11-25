# RESULT: the search for the Carpathia question (W5), rerun on the model with the tiers and the grand staircases, v2

- **Written:** 2026-11-20, 08:50 to 09:40 CST, by the mainline session "Titanic simulator model accuracy" (Claude Code
  desktop, Opus 5.5), from the search's own report of the rerun of 2026-11-19.
- **Status:** supersedes v1's figures. The search is v1's, unchanged; the model under it changed (S1). Nothing here says
  she could have been saved (decision D22). Advice; nothing decided.
- **Lineage:** `docs/research/RESULT_carpathia_search_v1_2026-11-18.md` (the method, the honesty rule, the guesses);
  `docs/DESIGN_grand_staircases_dome_flooding_v1_2026-11-19.md` (S1: what changed in the model, and the refit);
  `BACKLOG.md` W5.
- **Made with:** `tools/carpathia.js` (evaluation 2, unchanged since v1) on the main checkout's working tree: main
  `a97a6bd` plus the uncommitted S1 (the tiers above B deck, their windows, the two grand staircases, the refit). Its
  progress is `out/gate/carpathia/nights_f99f25a5c088.jsonl` (the hash names `core/`'s files and the evaluation, so
  nothing of v1's model is mixed in). The run: a budget of 6,000 nights, 5 threads, 40 models, the best three, seed 1,
  from 14:35 to 17:06 CST on 2026-11-19 (9,060 s): 5,004 nights of the search (the refinements converged before the
  budget ran out), 5,337 nights computed with the robustness rerun and the what-ifs. The best night replayed from the
  start in Node gives the same bits (checked 2026-11-20 08:58: T+171.38, step 41,371, fingerprint `6608a789`, no order
  refused); in the page, section 4.
- **Tags:** [measured] a figure of this run; [read] in a source a research note read; [derived] arithmetic on those;
  [bet] no source.

## 0. The answer

**Not on this model, and not by a near margin.** The best orders the search found keep the 1912 watch afloat 13.6
minutes longer: she founders 171.4 minutes after the touch against 157.7 [measured]. By the help reader, Carpathia is
alongside 265.1 minutes after the touch as the night went, 213.2 had the distress call been made at once, and 194.0
had she also made five miles toward Carpathia, so the watch needed 107.4, 55.4 and 36.2 more minutes. The best night
falls 22.6 minutes short of the nearest of the three.

That night is pumps, put where the water was coming in before the rooms that hold them flooded, and one door raised
where water already stood: every pump that can reach boiler room 4 a minute after the touch, long before any water
reaches it; every pump that can reach No. 2 and No. 3 holds a minute later, before the firemen's passage floods at
T+5.2; every pump that can reach boiler room 6 at 9 minutes and boiler room 5 at 26, which sends the engine rooms'
pumps, the ones that work to the end, to the bow; and at 56 minutes the doors in bulkhead F, between boiler rooms 5 and
4, raised by hand. Their float drops them at once, and in the 25 seconds of their fall boiler room 5's water reaches
the pumps already waiting in boiler room 4. It pumps 2,828 t against the watch's 264. She stays lit and her engines can
turn until her last minute, and her list is at most 7.4 degrees until her last ten.

It is a firmer night than v1's, and still a matter of minutes. Its gain holds (at least half of it) on 33 of 40 models
with the guesses moved, and helps at all on 40. No guess moved alone breaks it; the nearest are the pumps running on
unattended, where the engineers' own pumps already buy 9.5 minutes with no order and the best night 6.9 more, and the
holds' valves lost at once, 9.6. On the ten models with every guess drawn at once it keeps 0.7 to 9.7 minutes. The
Court found that the pumps "could not have prolonged her life appreciably". This model's answer is that no single order
buys more than about two minutes, and everything a crew could order together, about fourteen.

Outside the orders the model's one large lever is still every watertight door held open against its float: she then
lasts to T+195.3, past the nearest target on 34 of 40 models, but she lies over 20 to 26 degrees for an hour and is
dark for her last seventy minutes; with the tank-top doors at the one size this repository has seen (Empress of
Ireland's, 1.0 m2) she falls short of it. No order on a watch can hold a door (section 6.1).

## 1. What changed since v1: the model, not the search

**The model.** S1 gave the ship the tiers above B deck (buoyant while dry, holding water like the decks below them), the
tiers' windows and the two grand staircases' doors and domes, each holding until the head on it reaches its strength;
and the four flow parameters were refitted with them (`wMul` 1.036, `aDown` 0.2815, `fOpen` 0.02068; the opening's
0.7506 m2 held). Until the sea reaches the first opening above B deck (the forward D-deck gangway doors, at T+96.7 on
the damage preset) S1 changes nothing in the step; the refit moves every flow a little from the first minute. The
1912 watch with no order after the ice now founders at T+157.75 (step 38,100, fingerprint `611be326`, as the systems
suite holds), against v1's 157.21. The firemen's passage still floods at T+5.2 [measured].

**The search.** Unchanged: evaluation 2, the same orders, the same score, the same budget and seed, the same method
cheapest first (v1, section 1). Its phases this time [measured]:

1. One order at a time, at ten moments each (one pump led to another room at four): 690 nights, the table of section 3.
2. The handful that matter, together: every pump that can reach boiler room 6, boiler room 5, No. 3 hold, No. 2 hold
   and boiler room 4; door F; the pumps handed back. (v1's half astern for half an hour no longer buys a quarter of a
   minute alone.) One to five orders: 186, 920, 768, 613 and 462 nights, the best at 159.76, 163.20, 165.76, 167.99 and
   169.57; its best three refined to the minute: 169.92, 169.76, 169.04.
3. Random restarts from the seed: 400 nights; the best four refined: 165.11, 160.04, 159.79, 162.19.
4. The best night so far with one more order: the doors in bulkhead F raised at T+56 took 169.92 to 171.38.

**What moved** [measured]:

| | v1 (2026-11-18) | v2 (this note) |
|---|---:|---:|
| The watch, no order after the ice | T+157.21 | T+157.75 |
| The best night | T+169.33 (+12.12) | T+171.38 (+13.63) |
| Nights of the search | 4,683 | 5,004 |
| Carpathia alongside: as the night went / call at once / and five miles | 265.15 / 213.22 / 192.50 | 265.15 / 213.17 / 193.98 |
| The best night short of the nearest target | 23.2 min | 22.6 min |
| Pumped: the best night / the watch | 2,545 t / 269 t | 2,828 t / 264 t |
| Its gain holds (half of it) / helps at all, of 40 models | 29 / 36 | 33 / 40 |
| Guesses that break it, moved alone | 2 | 0 |
| Every door held open from T+1 (not an order) | T+196.90 | T+195.28 |

## 2. The targets: Carpathia alongside, from the help reader

From `core/readers/world.js`, run on the 1912 watch: as the night went; with the distress call made five minutes after
the touch; and with the call made then and five miles made good toward Carpathia from ten minutes (the world suite's own
procedure, `makeGood`), each to her foundering [measured]:

| What is done differently | Carpathia alongside (T) | She must last this much longer than 157.75 |
|---|---:|---|
| nothing (1912) | 265.15 | 107.4 |
| the call made at once | 213.17 | 55.4 |
| the call at once, and five miles made good toward her | 193.98 | 36.2 (that night founders at 157.61: the steaming cost her 0.14 minutes) |

On the best night the help reader brings Carpathia alongside at T+265.46 (the call as made in 1912).

## 3. One order at a time: what matters at all

690 nights: each order at ten moments (one pump led to another room at four), the gain in minutes over the 157.75 of
the watch as it went [measured]. "0" is the same night to the bit; "=" a changed night within three seconds; "ref" an
order the model refused, so the night is the baseline's; "ICE" an order that backs her onto the berg. Rooms: FP the
forepeak, H1 to H3 the holds, BR6 to BR1 the boiler rooms from forward, RE the reciprocating engine room, TE the turbine
room, EL the electric engine room, T1 and T2 the shaft tunnels. Pumps by where they stand and their tons an hour (RE
250a, the first of the reciprocating engine room's two 250s).

| Order (one at a time) | T+1 | T+3 | T+5 | T+10 | T+20 | T+30 | T+45 | T+60 | T+90 | T+120 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| raise door C (H2, H3) | = | = | = | = | = | = | = | = | = | = |
| raise door D (H3, BR6) | = | = | = | = | = | = | = | = | = | = |
| raise door E (BR6, BR5) | 0 | 0 | -0.4 | -0.8 | -1.0 | -0.8 | -0.8 | -0.7 | -0.3 | = |
| raise door F (BR5, BR4) | 0 | 0 | 0 | 0 | +1.1 | +1.4 | +1.6 | +0.4 | -1.3 | -0.2 |
| raise door G (BR4, BR3) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| raise door H (BR3, BR2) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| raise door J (BR2, BR1) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| raise door K (BR1, RE) | = | = | = | = | = | = | = | = | = | = |
| raise door L (RE, TE) | = | = | = | = | = | = | = | = | = | = |
| raise door M (TE, EL) | = | = | = | = | = | = | = | = | = | = |
| raise door N (EL, T1) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| raise door O (T1, T2) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| every pump that reaches H1 on it | -0.4 | -0.4 | -0.4 | ref | ref | ref | ref | ref | ref | ref |
| every pump that reaches H2 on it | +0.7 | +0.6 | +0.6 | ref | ref | ref | ref | ref | ref | ref |
| every pump that reaches H3 on it | +0.7 | +0.7 | +0.6 | ref | ref | ref | ref | ref | ref | ref |
| every pump that reaches BR6 on it | +0.7 | +0.6 | +0.6 | +2.0 | +1.7 | +1.4 | +0.9 | +0.4 | +0.3 | = |
| BR6's own pumps on it | ref | ref | ref | ref | ref | ref | ref | ref | ref | ref |
| every pump that reaches BR5 on it | +0.1 | +0.1 | = | = | -0.2 | +1.8 | +1.1 | +0.5 | +0.4 | = |
| BR5's own pumps on it | ref | ref | ref | ref | ref | ref | ref | ref | ref | ref |
| every pump that reaches BR4 on it | +0.6 | +0.6 | +0.6 | +0.6 | +0.6 | +0.6 | +0.6 | +0.6 | -0.1 | ref |
| BR4's own pumps on it | -0.5 | -0.5 | -0.5 | -0.5 | -0.5 | -0.5 | -0.5 | -0.5 | ref | ref |
| every pump that reaches BR3 on it | -0.8 | -0.8 | -0.8 | -0.8 | -0.8 | -0.8 | -0.8 | -0.8 | -0.1 | = |
| BR3's own pumps on it | -0.8 | -0.8 | -0.8 | -0.8 | -0.8 | -0.8 | -0.8 | -0.8 | -0.2 | -0.2 |
| every pump that reaches BR2 on it | -1.0 | -1.0 | -1.0 | -1.0 | -1.0 | -1.0 | -1.0 | -1.0 | -0.5 | = |
| BR2's own pumps on it | -1.0 | -1.0 | -1.0 | -1.0 | -1.0 | -1.0 | -1.0 | -1.0 | -0.5 | = |
| every pump that reaches BR1 on it | -1.0 | -1.0 | -1.0 | -1.0 | -1.0 | -1.0 | -1.0 | -1.0 | -0.5 | = |
| every pump that reaches RE on it | -1.0 | -1.0 | -1.0 | -1.0 | -1.0 | -1.0 | -1.0 | -1.0 | -0.5 | 0 |
| RE's own pumps on it | -1.0 | -1.0 | -1.0 | -1.0 | -1.0 | -1.0 | -1.0 | -1.0 | -0.5 | 0 |
| every pump that reaches TE on it | -1.0 | -1.0 | -1.0 | -1.0 | -1.0 | -1.0 | -1.0 | -1.0 | -0.5 | 0 |
| TE's own pumps on it | -1.0 | -1.0 | -1.0 | -1.0 | -1.0 | -1.0 | -1.0 | -1.0 | -0.5 | 0 |
| every pump that reaches EL on it | -1.0 | -1.0 | -1.0 | -1.0 | -1.0 | -1.0 | -1.0 | -1.0 | -0.5 | 0 |
| every pump that reaches T1 on it | -1.0 | -1.0 | -1.0 | -1.0 | -1.0 | -1.0 | -1.0 | -1.0 | -0.5 | 0 |
| every pump that reaches T2 on it | -1.0 | -1.0 | -1.0 | -1.0 | -1.0 | -1.0 | -1.0 | -1.0 | -0.5 | 0 |
| pump BR5 250 on BR6 | -1.8 |  |  |  |  | ref |  | ref | ref |  |
| pump BR4 150 on BR6 | +0.2 |  |  |  |  | -0.2 |  | -0.6 | -1.0 |  |
| pump BR3 250 on BR6 | +1.0 |  |  |  |  | +1.0 |  | +0.2 | = |  |
| pump BR2 250 on BR6 | +1.0 |  |  |  |  | +1.0 |  | +0.2 | +0.1 |  |
| pump RE 250a on BR6 | +1.0 |  |  |  |  | +1.0 |  | +0.2 | +0.1 |  |
| pump RE 250b on BR6 | +1.0 |  |  |  |  | +1.0 |  | +0.2 | +0.1 |  |
| pump RE 150a on BR6 | +0.5 |  |  |  |  | +0.2 |  | -0.3 | -0.1 |  |
| pump RE 150b on BR6 | +0.5 |  |  |  |  | +0.2 |  | -0.3 | -0.1 |  |
| pump TE 150 on BR6 | +0.5 |  |  |  |  | +0.2 |  | -0.3 | -0.1 |  |
| pump BR6 150 on BR5 | -1.0 |  |  |  |  | ref |  | ref | ref |  |
| pump BR4 150 on BR5 | +0.1 |  |  |  |  | -0.1 |  | -0.6 | -1.0 |  |
| pump BR3 250 on BR5 | +0.5 |  |  |  |  | +1.2 |  | +0.3 | +0.1 |  |
| pump BR2 250 on BR5 | +0.5 |  |  |  |  | +1.2 |  | +0.3 | +0.1 |  |
| pump RE 250a on BR5 | +0.5 |  |  |  |  | +1.2 |  | +0.3 | +0.1 |  |
| pump RE 250b on BR5 | +0.5 |  |  |  |  | +1.2 |  | +0.3 | +0.1 |  |
| pump RE 150a on BR5 | +0.5 |  |  |  |  | +0.3 |  | -0.2 | -0.1 |  |
| pump RE 150b on BR5 | +0.5 |  |  |  |  | +0.3 |  | -0.2 | -0.1 |  |
| pump TE 150 on BR5 | +0.5 |  |  |  |  | +0.3 |  | -0.2 | -0.1 |  |
| pump BR6 150 on BR4 | -1.0 |  |  |  |  | ref |  | ref | ref |  |
| pump BR5 250 on BR4 | -1.8 |  |  |  |  | ref |  | ref | ref |  |
| pump BR3 250 on BR4 | +0.4 |  |  |  |  | +0.4 |  | +0.4 | -0.1 |  |
| pump BR2 250 on BR4 | +0.4 |  |  |  |  | +0.4 |  | +0.4 | = |  |
| pump RE 250a on BR4 | +0.4 |  |  |  |  | +0.4 |  | +0.4 | = |  |
| pump RE 250b on BR4 | +0.4 |  |  |  |  | +0.4 |  | +0.4 | = |  |
| pump RE 150a on BR4 | -0.2 |  |  |  |  | -0.2 |  | -0.2 | -0.1 |  |
| pump RE 150b on BR4 | -0.2 |  |  |  |  | -0.2 |  | -0.2 | -0.1 |  |
| pump TE 150 on BR4 | -0.2 |  |  |  |  | -0.2 |  | -0.2 | -0.1 |  |
| pump BR6 150 on BR3 | -1.0 |  |  |  |  | ref |  | ref | ref |  |
| pump BR5 250 on BR3 | -1.8 |  |  |  |  | ref |  | ref | ref |  |
| pump BR4 150 on BR3 | -1.0 |  |  |  |  | -1.0 |  | -1.0 | -1.0 |  |
| pump BR2 250 on BR3 | -0.8 |  |  |  |  | -0.8 |  | -0.8 | -0.2 |  |
| pump RE 250a on BR3 | -0.8 |  |  |  |  | -0.8 |  | -0.8 | -0.2 |  |
| pump RE 250b on BR3 | -0.8 |  |  |  |  | -0.8 |  | -0.8 | -0.2 |  |
| pump RE 150a on BR3 | -0.9 |  |  |  |  | -0.9 |  | -0.9 | -0.3 |  |
| pump RE 150b on BR3 | -0.9 |  |  |  |  | -0.9 |  | -0.9 | -0.3 |  |
| pump TE 150 on BR3 | -0.9 |  |  |  |  | -0.9 |  | -0.9 | -0.3 |  |
| pump BR6 150 on BR2 | -1.0 |  |  |  |  | ref |  | ref | ref |  |
| pump BR5 250 on BR2 | -1.8 |  |  |  |  | ref |  | ref | ref |  |
| pump BR4 150 on BR2 | -1.0 |  |  |  |  | -1.0 |  | -1.0 | -1.0 |  |
| pump BR3 250 on BR2 | -1.0 |  |  |  |  | -1.0 |  | -1.0 | -0.5 |  |
| pump RE 250a on BR2 | -1.0 |  |  |  |  | -1.0 |  | -1.0 | -0.5 |  |
| pump RE 250b on BR2 | -1.0 |  |  |  |  | -1.0 |  | -1.0 | -0.5 |  |
| pump RE 150a on BR2 | -1.0 |  |  |  |  | -1.0 |  | -1.0 | -0.5 |  |
| pump RE 150b on BR2 | -1.0 |  |  |  |  | -1.0 |  | -1.0 | -0.5 |  |
| pump TE 150 on BR2 | -1.0 |  |  |  |  | -1.0 |  | -1.0 | -0.5 |  |
| slow ahead for 10 min | = | = | = | = | = | = | = | = | = | = |
| slow ahead for 30 min | -0.1 | = | -0.1 | = | -0.1 | -0.1 | -0.1 | -0.1 | -0.1 | = |
| half ahead for 10 min | -0.1 | -0.1 | -0.1 | -0.1 | -0.1 | -0.1 | -0.1 | -0.2 | -0.2 | -0.1 |
| half ahead for 30 min | -0.2 | -0.2 | -0.2 | -0.3 | -0.3 | -0.4 | -0.5 | -0.6 | -0.4 | -0.2 |
| full ahead for 10 min | -0.2 | -0.2 | -0.2 | -0.2 | -0.2 | -0.2 | -0.2 | -0.3 | -0.2 | -0.1 |
| full ahead for 30 min | -0.5 | -0.5 | -0.5 | -0.5 | -0.5 | -0.7 | -1.1 | -1.3 | -0.6 | -0.2 |
| slow astern for 10 min | = | = | = | = | = | = | = | = | = | = |
| slow astern for 30 min | = | = | = | = | = | = | ICE | = | = | -0.1 |
| half astern for 10 min | = | = | = | = | = | = | ICE | = | -0.1 | = |
| half astern for 30 min | = | = | = | = | = | = | -0.1 | -0.2 | +0.1 | -0.3 |
| full astern for 10 min | = | = | = | = | = | = | = | = | -0.1 | = |
| full astern for 30 min | = | = | = | = | = | = | -0.1 | -0.3 | -0.5 | -0.2 |
| draw every fire | -0.6 | -0.5 | -0.5 | -0.4 | -0.2 | -0.1 | = | 0 | 0 | 0 |
| draw BR6's fires | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| draw BR5's fires | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| draw BR4's fires | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| draw BR3's fires | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| draw BR2's fires | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

What it says [measured]. It is v1's table to a tenth or two in nearly every cell; the model's change moved the night's
end, not its first hours.

- **Pumps on the rooms that are flooding help a little.** Every pump that can reach boiler room 6, ordered ten minutes
  after the touch, buys 2.0 minutes; every pump that can reach boiler room 5, at T+30, 1.8; the holds' (No. 2 and No. 3)
  at T+1 to T+5, before the firemen's passage floods at T+5.2, 0.6 to 0.7; every pump that can reach boiler room 4,
  ordered at any moment to T+60, 0.6. One pump from a dry room led to boiler room 6 or 5: up to 1.2.
- **Pumps put on a dry room cost about a minute.** Every pump on boiler room 2 or any room aft of it, ordered at any
  moment to T+60: 1.0 lost; on boiler room 3, 0.8. A bridge order takes the pumps from the engineers, whose rules then
  wait for orders (v1, section 3).
- **A door raised where water already stands.** Door F, between boiler rooms 5 and 4, raised at T+20 to T+45: 1.1 to
  1.6 minutes, v1's figures to the tenth, though its float drops it at once; v1 traced it to the engineers' rule fired
  early in boiler room 4 by the water that passes in the door's fall (not traced again here). At T+90 it costs 1.3. Door
  E (boiler rooms 6 and 5) costs up to a minute. Doors G to O, between dry rooms, change no bit of the night.
- **The engines ahead cost.** Half ahead for half an hour, up to 0.6 minutes lost; full ahead for half an hour from
  T+60, 1.3. Astern does next to nothing, a few seconds either way, except that slow astern for half an hour or half
  astern for ten minutes from T+45 backs her onto the berg (section 6.2).
- **The fires.** Drawing one boiler room's fires changes no bit of the night; drawing every fire costs up to 0.6
  minutes.

The Court found that the pumps "could not have prolonged her life appreciably". The model's answer, one order at a
time: nothing buys more than about two minutes, and a pump order on the wrong room costs one.

## 4. The best nights

Each set of orders once (the same orders a minute or two apart are one night here); no night that puts her back onto
the ice [measured]:

| # | Minutes | Gain | Orders carried out | List from T+5 to her last 10 min | Bridge under | Dynamos stop | Dark | Engines lost | Pumped |
|---:|---:|---:|---|---|---:|---:|---:|---:|---:|
| 1 | 171.38 | +13.63 | T+1.0 every free pump that can reach boiler room 4 put on it; T+2.0 every free pump that can reach No. 2 hold put on it; T+2.0 every free pump that can reach No. 3 hold put on it; T+9.0 every free pump that can reach boiler room 6 put on it; T+26.0 every free pump that can reach boiler room 5 put on it; T+56.0 raise the doors in bulkhead F by hand | 7.4 deg at T+159 | T+168.8 | T+170.5 | T+170.5 | T+170.5 | 2828 t |
| 2 | 171.36 | +13.61 | T+1.0 every free pump that can reach boiler room 4 put on it; T+2.0 every free pump that can reach No. 3 hold put on it; T+3.0 every free pump that can reach No. 2 hold put on it; T+9.0 every free pump that can reach boiler room 6 put on it; T+26.0 every free pump that can reach boiler room 5 put on it; T+54.0 raise the doors in bulkhead F by hand | 7.4 deg at T+159 | T+168.8 | T+170.5 | T+170.5 | T+170.5 | 2818 t |
| 3 | 170.02 | +12.28 | T+1.0 boiler room 2's ballast-and-bilge pump put on boiler room 6; T+1.0 every free pump that can reach boiler room 4 put on it; T+2.0 every free pump that can reach No. 2 hold put on it; T+2.0 every free pump that can reach No. 3 hold put on it; T+9.0 every free pump that can reach boiler room 6 put on it; T+26.0 every free pump that can reach boiler room 5 put on it | 7.5 deg at T+158 | T+167.5 | T+169.2 | T+169.2 | T+169.2 | 2651 t |
| 4 | 170.02 | +12.28 | T+1.0 a ballast pump in the reciprocating engine room put on boiler room 6; T+1.0 every free pump that can reach boiler room 4 put on it; T+2.0 every free pump that can reach No. 2 hold put on it; T+2.0 every free pump that can reach No. 3 hold put on it; T+9.0 every free pump that can reach boiler room 6 put on it; T+26.0 every free pump that can reach boiler room 5 put on it | 7.5 deg at T+158 | T+167.5 | T+169.2 | T+169.2 | T+169.2 | 2651 t |
| 5 | 170.01 | +12.27 | T+1.0 boiler room 3's ballast-and-bilge pump put on boiler room 6; T+1.0 every free pump that can reach boiler room 4 put on it; T+2.0 every free pump that can reach No. 2 hold put on it; T+2.0 every free pump that can reach No. 3 hold put on it; T+9.0 every free pump that can reach boiler room 6 put on it; T+26.0 every free pump that can reach boiler room 5 put on it | 7.5 deg at T+158 | T+167.4 | T+169.2 | T+169.2 | T+169.2 | 2651 t |
| 6 | 170.01 | +12.26 | T+1.0 a bilge pump in the reciprocating engine room put on boiler room 6; T+1.0 every free pump that can reach boiler room 4 put on it; T+2.0 every free pump that can reach No. 2 hold put on it; T+2.0 every free pump that can reach No. 3 hold put on it; T+9.0 every free pump that can reach boiler room 6 put on it; T+26.0 every free pump that can reach boiler room 5 put on it | 7.5 deg at T+157 | T+167.4 | T+169.2 | T+169.2 | T+169.2 | 2646 t |
| 7 | 169.98 | +12.23 | T+1.0 a bilge pump in the reciprocating engine room put on boiler room 5; T+1.0 every free pump that can reach boiler room 4 put on it; T+2.0 every free pump that can reach No. 2 hold put on it; T+2.0 every free pump that can reach No. 3 hold put on it; T+9.0 every free pump that can reach boiler room 6 put on it; T+26.0 every free pump that can reach boiler room 5 put on it | 7.5 deg at T+158 | T+167.4 | T+169.1 | T+169.1 | T+169.1 | 2611 t |
| 8 | 169.92 | +12.18 | T+1.0 every free pump that can reach boiler room 4 put on it; T+2.0 every free pump that can reach No. 2 hold put on it; T+2.0 every free pump that can reach No. 3 hold put on it; T+9.0 every free pump that can reach boiler room 6 put on it; T+26.0 every free pump that can reach boiler room 5 put on it | 7.5 deg at T+158 | T+167.4 | T+169.1 | T+169.1 | T+169.1 | 2624 t |

**The best night, in words** (`out/carpathia_best.json`; T in minutes after the touch at 11:40 pm; the pumps' spans
from the replay of 2026-11-20 [measured]):

1. **T+1.0**: every free pump that can reach boiler room 4 put on it: its own ash-ejector pump, ready from T+6, and
   boiler room 3's 250 led through the main, ready from T+31. No water reaches boiler room 4 until T+56; they wait for it.
2. **T+2.0**: every free pump that can reach No. 2 hold put on it: boiler room 2's 250 through the main, at work from
   T+32 to her last minutes.
3. **T+2.0**: every free pump that can reach No. 3 hold put on it: one of the reciprocating engine room's ballast pumps,
   at work from T+32 to her last minute. Both hold orders are given before the firemen's passage floods at T+5.2; after
   it the model refuses them.
4. **T+9.0**: every free pump that can reach boiler room 6 put on it: the engine room's other ballast pump and one of
   its bilge pumps, at work from T+39 to her last minute. The engine rooms stay dry until then.
5. **T+26.0**: every free pump that can reach boiler room 5 put on it: the engine room's other bilge pump and the
   turbine room's, at work from T+56 to the end.
6. **T+56.0**: the doors in bulkhead F raised by hand. The float drops them at once (T+56.01; shut at T+56.42), and in
   the fall 163 m3 of boiler room 5's water passes into boiler room 4. The pumps of order 1 have it out by T+85, before
   the sea comes over bulkhead F at E deck (T+91.6). On the watch with no order boiler room 4's first water comes at
   T+86.7, over the bulkhead; the door gives its pumps half an hour of work they would not otherwise have had.

The pumps draw 459 t from No. 2 hold, 460 from No. 3, 778 from boiler room 6, 666 from boiler room 5 and 465 from
boiler room 4, 2,828 t in all. She founders at T+171.38 (step 41,371, fingerprint `6608a789`), lit and with her engines
able to turn until 0.8 minutes before the end, her list never past 7.4 degrees before her last ten minutes, her bridge
under at T+168.8. The pumps are never handed back to the engineers. It opens in the page at this address (the end
card's encoding, after the site's own address):

`#night=1912&log=W1sxMzcsImhlbG0iLC00MF0sWzI0MSwiaGVsbSIsNDBdLFs0ODEsInRlbGVncmFwaCIsInN0b3AiXSxbNDgxLCJoZWxtIiwwXSxbNDgyLCJwdW1wIiw2LCJhbGwiXSxbNzIxLCJwdW1wIiwyLCJhbGwiXSxbNzIxLCJwdW1wIiwzLCJhbGwiXSxbMjQwMSwicHVtcCIsNCwiYWxsIl0sWzY0ODEsInB1bXAiLDUsImFsbCJdLFsxMzY4MSwiZG9vciIsNSx0cnVlXV0`

Opened in the page (headless Edge, `tools/night_end_site_test.js`, row 4b, run 2026-11-20 at 09:40 CST), the address
replays as a watch, all ten of its orders accepted by the address check; run on, she founders at 10,341.25 s, the time
the model alone gives for the same log in the page's engine, to the bit (fingerprint `3111f3a5`, step 41,365), and
1.5 s from Node's 10,342.75 s: two engines part in the last bits (backlog X1). The end card says "She foundered at 2:31
am, 2 h 51 min after she touched the ice", this note's T+171.38 to the minute [measured].

Two things in it are bets of the model, as in v1: that the holds' bilge valves could be opened in the first minutes and
stay open after the passage flooded; and that a pump led through the main works half an hour after the order (Y7). A
third is new: that a door raised by hand is up at once and falls in 25 seconds, so that the bridge can let a measured
slug of water through a bulkhead to pumps waiting behind it. By hand a door took four or five minutes to raise (v1,
section 7), and nobody in 1912 is recorded doing this.

## 5. How firm: the best nights on forty models

The best three nights (three different sets of orders) and the baseline, on forty models: the model as it stands; each
of the fifteen guesses of v1's section 8 alone at each end of its range (29 models; a door's fall has one end only); and
ten with all fifteen drawn at once from the seed (the same ten as v1's: the draw is the seed's). In brackets each
night's gain over that model's own baseline [measured].

| Model | Baseline | Night 1 (gain) | Night 2 (gain) | Night 3 (gain) |
|---|---:|---:|---:|---:|
| as the files have it | 157.75 | 171.38 (+13.63) | 171.36 (+13.61) | 170.02 (+12.28) |
| doorLowA 1 m2 | 157.75 | 170.91 (+13.17) | 170.91 (+13.16) | 170.02 (+12.28) |
| doorLowA 2 m2 | 157.75 | 171.69 (+13.94) | 171.67 (+13.92) | 170.02 (+12.28) |
| doorA 1 m2 | 157.75 | 171.38 (+13.63) | 171.36 (+13.61) | 170.02 (+12.28) |
| doorA 2.2 m2 | 157.75 | 171.38 (+13.63) | 171.36 (+13.61) | 170.02 (+12.28) |
| sill -0.35 m | 157.75 | 171.43 (+13.68) | 171.38 (+13.63) | 170.02 (+12.28) |
| sill 0.45 m | 157.75 | 171.23 (+13.48) | 171.21 (+13.46) | 170.02 (+12.28) |
| floatDepth 0.46 m | 157.75 | 171.38 (+13.63) | 171.36 (+13.61) | 170.02 (+12.28) |
| floatDepth 0.61 m | 157.75 | 171.38 (+13.63) | 171.36 (+13.61) | 170.02 (+12.28) |
| doorFall 30 s | 157.75 | 171.56 (+13.81) | 171.54 (+13.80) | 170.02 (+12.28) |
| bowWave 0.44 | 157.81 | 171.47 (+13.66) | 171.46 (+13.65) | 170.07 (+12.25) |
| bowWave 0.66 | 157.73 | 171.36 (+13.63) | 171.34 (+13.61) | 170.03 (+12.30) |
| bowLen 20 m | 157.95 | 171.61 (+13.66) | 171.61 (+13.66) | 170.25 (+12.30) |
| bowLen 45 m | 157.72 | 171.34 (+13.62) | 171.28 (+13.56) | 169.98 (+12.26) |
| pumpRate 0.7x | 157.43 | 164.79 (+7.36) | 164.81 (+7.38) | 164.31 (+6.88) |
| pumpRate 1.15x | 157.91 | 172.08 (+14.16) | 172.06 (+14.14) | 170.72 (+12.81) |
| suction 0.8x | 157.58 | 168.90 (+11.32) | 168.90 (+11.32) | 167.65 (+10.07) |
| suction 1.2x | 157.92 | 169.88 (+11.96) | 169.80 (+11.88) | 168.37 (+10.45) |
| mains 0.5x | 157.75 | 171.38 (+13.63) | 171.36 (+13.61) | 170.02 (+12.28) |
| mains 1.2x | 157.75 | 171.38 (+13.63) | 171.36 (+13.61) | 170.02 (+12.28) |
| pumpOwn 120 s | 157.92 | 171.57 (+13.65) | 171.52 (+13.60) | 170.22 (+12.30) |
| pumpOwn 600 s | 157.37 | 170.12 (+12.75) | 170.09 (+12.72) | 168.76 (+11.40) |
| pumpLent 600 s | 160.64 | 173.46 (+12.82) | 173.38 (+12.74) | 172.11 (+11.47) |
| pumpLent 2700 s | 157.52 | 169.66 (+12.13) | 169.62 (+12.10) | 168.37 (+10.85) |
| pumpAbandon 1.5 m | 156.71 | 170.52 (+13.81) | 170.48 (+13.78) | 169.24 (+12.53) |
| pumpAbandon 99 m | 167.29 | 174.23 (+6.94) | 174.25 (+6.96) | 172.92 (+5.63) |
| pumpStrum 0.05 m | 157.76 | 171.38 (+13.62) | 171.35 (+13.58) | 170.03 (+12.27) |
| pumpStrum 0.3 m | 157.75 | 171.34 (+13.60) | 171.30 (+13.55) | 169.99 (+12.24) |
| passage -1 min | 157.75 | 167.38 (+9.63) | 167.32 (+9.58) | 166.12 (+8.37) |
| passage 10 min | 157.75 | 171.38 (+13.63) | 171.36 (+13.61) | 170.02 (+12.28) |
| every guess drawn (1) | 159.23 | 165.72 (+6.49) | 165.71 (+6.48) | 164.80 (+5.57) |
| every guess drawn (2) | 163.67 | 165.22 (+1.55) | 165.22 (+1.55) | 164.07 (+0.40) |
| every guess drawn (3) | 168.89 | 170.49 (+1.60) | 170.48 (+1.59) | 169.25 (+0.36) |
| every guess drawn (4) | 157.01 | 165.06 (+8.06) | 165.28 (+8.27) | 164.18 (+7.18) |
| every guess drawn (5) | 163.13 | 167.46 (+4.32) | 167.43 (+4.30) | 166.16 (+3.02) |
| every guess drawn (6) | 165.23 | 165.91 (+0.67) | 165.93 (+0.70) | 164.48 (-0.75) |
| every guess drawn (7) | 168.56 | 175.11 (+6.55) | 175.09 (+6.53) | 173.96 (+5.39) |
| every guess drawn (8) | 157.66 | 167.38 (+9.72) | 167.43 (+9.77) | 166.03 (+8.38) |
| every guess drawn (9) | 157.82 | 166.40 (+8.58) | 166.32 (+8.50) | 165.98 (+8.16) |
| every guess drawn (10) | 165.22 | 171.45 (+6.23) | 171.43 (+6.20) | 170.06 (+4.83) |

What it says [measured]:

- **Night 1's gain holds** (at least half of it, and at least half a minute) **on 33 of the 40 models**; she lasts at
  least as long as on the model as it stands, to within half a minute, on 25; it helps at all on all 40. Across the
  forty its gain runs from +0.7 to +14.2 minutes, the median +13.5. Nights 2 and 3 tell the same (33 and 32 of 40).
- **The doors' guesses and the sea's move it by under half a minute.** It now raises a door, so the doors' guesses
  touch it: the tank-top doors at 1.0 or 2.0 m2, +13.2 or +13.9; the door's point moved, +13.5 to +13.7; a 30-second
  fall, +13.8.
- **The pumps' guesses move it**, each alone: their rate at 0.7 of the rating, +7.4; the suctions at 0.8 or 1.2 of the
  model's, +11.3 or +12.0; a room's own pumps at work in ten minutes, +12.8; pumps through the main in ten minutes,
  +12.8 (the baseline itself gains 2.9), in 45 minutes, +12.1.
- **No guess, moved alone, breaks it** (two did in v1). If the pumps ran on unattended in rooms that flood, the
  engineers' own pumps keep working and the baseline gains 9.5 minutes with no order; the best night gains 6.9 more,
  just over half its gain. If the holds' valves were lost at once, the two hold orders are refused and the gain is 9.6:
  the pumps on boiler room 4 and the door, which v1's night did not have, carry the rest.
- **On all ten models with every guess drawn it keeps something**, 0.7 to 9.7 minutes. The four on which v1's night
  was lost (2, 3, 5 and 6, where the pumps run on in flooded rooms) are again its weakest, +0.7 to +4.3; there the
  engineers' rules, left alone, do nearly as well as the bridge's orders. Night 3 loses 0.75 minutes on model 6.

So the finding is not fourteen minutes but this: on this model the orders a crew could give buy minutes, of the order of
ten, against the half hour to two hours needed; how many depends on what the pumps could really do, which no source
gives.

## 6. Outside the orders

### 6.1 The doors held open against their floats

As in v1 (section 6.1 there): no order on a watch can hold a door open against its float, nobody in 1912 is recorded
doing it, and the model raises a door at once where by hand it took four or five minutes. So the search does not do it,
and no night of section 4 holds a door. What the model says of it, apart from the search, with the floats disarmed in
the copy of the watch, on the forty models [measured]:

| What-if, not an order | Founders | Gain | List, T+5 to her last 10 min | Dynamos stop | Dark | Gain over the 40 models: least, median, most | Lasts past T+194.0 / T+213.2 / T+265.1 |
|---|---:|---:|---|---:|---:|---|---|
| every door, C to O, held open from T+1 | T+195.28 | +37.53 | 25.7 deg at T+92 | T+101.9 | T+125.6 | +19.0, +37.5, +48.7 | 34 / 0 / 0 of 40 |
| every door held open from T+30, when the engineers began raising them in 1912 | T+193.43 | +35.68 | 25.7 deg at T+90 | T+100.6 | T+130.2 | +18.0, +35.7, +47.1 | 10 / 0 / 0 of 40 |
| D, E and F only (the doors between the flooded rooms and boiler room 4) held open from T+1 | T+136.47 | -21.28 | 7.5 deg at T+11 | T+135.7 | T+135.7 | -24.2, -21.3, -18.3 | 0 / 0 / 0 of 40 |
| G to O held open from T+30 (the doors raised in 1912, held) | T+155.70 | -2.05 | 12.0 deg at T+144 | T+154.9 | T+154.9 | -2.6, -2.0, -0.5 | 0 / 0 / 0 of 40 |

With every door held open from T+1 she lasts to T+195.3, past Carpathia with the call made at once and five miles made
good (T+194.0), and so on 34 of the 40 models; past the call made at once (T+213.2), on none. The minutes are a hulk's,
as in v1: she lies over 25.7 degrees at T+92, the main dynamos stop at T+101.9, and she is dark from T+125.6, seventy
minutes before the end. And they rest on a guess: with the tank-top doors at the one size this repository has seen,
Empress of Ireland's (1.0 m2; Titanic's are NOT FOUND), she lasts to T+176.7, short of that target; at 2.0 m2, to
T+206.5. Held open from T+30 the figures are much the same (T+193.4), but the nearest target has moved 1.5 minutes
later, so she passes it on only 10 of 40 models. Opening only D, E and F costs 21 minutes; G to O, the doors raised in
1912, held open from T+30, cost two. The model's free surface late in the night is still suspect (W6), and the tiers
and staircases of S1 work only in her last minutes; whether a crew could have held the doors, and whether the model
would let her float so with them open, are still questions for the model before they are answers (W5b, W6).

### 6.2 The ice again

Two orders back her onto the berg (ICE in section 3): slow astern for half an hour and half astern for ten minutes,
each from T+45. The contact opens 25 and 11 new holes, and she lasts 0.75 and 0.76 minutes longer [measured]. No remedy;
the search ranks every such night last. v1's night of water let in aft (its section 6.2) was not rerun.

## 7. What was not searched, and why

As v1, section 7, with one line moved: **her list and her break.** The model, with S1, lists her 2 to 7.6 degrees from
T+5 to her last ten minutes where the record has 10 to 15 at the end (W6), and she does not break (W7): a night "afloat"
here is afloat on a model with those gaps.

## 8. The guesses

The same fifteen, moved as in v1, section 8 (`GUESSES` in `tools/carpathia.js`, unchanged). Held fixed, as there, and
two more:

- the flooding's four fitted parameters, now the S1 refit: the opening 0.7506 m2, `wMul` 1.036, `aDown` 0.2815,
  `fOpen` 0.02068;
- S1's strengths and laws: the wooden doors' head (`hDoor`, 1.0 m), the steel D-deck doors that never give way, the
  domes by the air rule, the windows' heads, the two flow laws (`lawUpright`, `lawLevel`) [bets and derivations in the
  S1 design note]. They work only in her last minutes on the watch and on every night of section 4 (on the best
  night the first opening above B deck, the B-deck windows, goes at T+166.2, five minutes before she founders).

## 9. To rerun it

```
node tools/carpathia.js --nights 6000 --jobs 5 --variants 40 --robust 3 --seed 1   # this run; out/gate/carpathia keeps the progress
node tools/carpathia_tests.js                                                       # the acceptance rows (three or four minutes)
```

The same seed and budget give the same table with any number of threads (a test row of `tools/carpathia_tests.js`).
The run resumes from `out/gate/carpathia/nights_<hash>.jsonl`; `--fresh` starts again. It prints the report, writes it
beside the progress (`report_seed1_n6000_v40.txt`, with the same tables as data in `summary_seed1_n6000_v40.json`) and
the best night to `out/carpathia_best.json`.
