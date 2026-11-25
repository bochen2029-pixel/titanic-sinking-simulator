# RESULT: the first search for the Carpathia question (W5), v1

- **Written:** 2026-11-18, 01:20 to 03:44 CST, by the builder agent of lane "search" (Claude Code desktop, Opus 5.5),
  from the coordinating session's brief for W5; the page's replay of the best night added at 04:12, on main `42f2cb1`.
- **Status:** what one model with named guesses gives, and how firm that is. Nothing here says she could have been
  saved (decision D22). Advice; nothing decided.
- **Lineage:** `docs/BRAINSTORM_the_whole_night_v1_2026-11-17.md`, sections 6.3 (the targets) and 8 (the method, the
  score, the honesty rule), and D22; `BACKLOG.md` W5; `HANDOFF.md` section 7 (the question as first put).
- **Made with:** `tools/carpathia.js` (evaluation 2) on main `e817bc2` with this lane's files only (nothing under
  `core/` or `site/` changed); its acceptance is `tools/carpathia_tests.js`. The run: `--nights 6000 --jobs 4`, then 6
  after 03:00 CST, `--variants 40 --robust 3 --seed 1`, from 02:09 to 03:39 CST on this laptop, shared with two other
  lanes; 4,683 nights of the search (the refinements converged before the budget ran out), 160 of the robustness
  rerun, 160 of the what-ifs outside the orders, and the help reader's arrivals. Rebased onto main `42f2cb1`, whose only
  change under `core/` is an export added to `night.js`: 83 of the run's nights recomputed there (the baseline, the three
  best, every 120th of the search, the robustness rows of eight models, the four what-ifs) are the same to the bit.
- **Tags:** [measured] a figure of this run; [read] in a source a research note read; [derived] arithmetic on those;
  [bet] no source.

## 0. The answer

**Not on this model, and not by a near margin.** The best orders the search found keep the 1912 watch afloat 12.1
minutes longer: she founders 169.3 minutes after the touch against 157.2 [measured]. By the help reader, Carpathia is
alongside 265.2 minutes after the touch as the night went, 213.2 had the distress call been made at once, and 192.5
had she also made five miles toward Carpathia, so the watch needed 107.9, 56.0 and 35.3 more minutes. The best night
falls 23.2 minutes short of the nearest of the three.

That night is all pumps, put where the water was coming in before the rooms that hold them flooded: every pump that can
reach No. 2 and No. 3 holds a minute after the touch, before the firemen's passage floods; every pump that can reach
boiler room 6 at 9 minutes and boiler room 5 at 26, which sends the engine rooms' pumps, the ones that work to the end,
to the bow; boiler room 3's pump moved to boiler room 4 at 61 minutes, just before its water comes. It pumps 2,545 t
against the watch's 269. She stays lit and her engines can turn until her last minute, and her list stays under 7.4
degrees until her last ten.

It is a firm few minutes, not a firm twelve. Its gain holds (at least half of it) on 29 of 40 models with the guesses
moved, and helps at all on 36. It falls to 5.8 minutes if the holds' valves were lost at once, and to 4.4 if the pumps
ran on unattended, because then the engineers' own pumps already buy 9.8 with no order. On four of the ten models with
every guess drawn at once it is lost: there the pumps run on, and the engineers' rules do better than the bridge's
orders. The Court found that the pumps "could not have prolonged her life appreciably". This model's answer is that
no single order buys more than about two minutes, and everything a crew could order together, about twelve.

Outside the orders the model has one large lever: every watertight door held open against its float. She then lasts to
T+196.9, past the third target on 36 of 40 models, but she lies over 20 to 26 degrees for an hour and is dark for her
last seventy minutes; and with the tank-top doors at the one size this repository has seen (Empress of Ireland's, 1.0
m2) she falls short of it. No order on a watch can hold a door, and nobody in 1912 is recorded doing it (section 6.1).

## 1. What was searched, and how

**The night.** Seed 1912 on its own orders: the reconstructed watch, helm hard over 20.5 s after the bells, reversed
at the touch, Stop and the helm amidships a minute after it. With no order after the ice she founders 157.21 minutes
after the touch (step 37,970, fingerprint `9546a25c`), as the systems suite holds [measured].

**Where the search starts.** At the first step at which the encounter is over and the 1912 orders have all been given:
step 482, T+1.0 (T: minutes after the touch). The watch there is copied whole (`Night.forecastOf`, the structured clone
the page's forecast uses) and each candidate runs on from the copy with its orders given on their steps through
`Night.act`, as a replay's script gives them. A night forked so equals the same night replayed from the start, to the
bit: for orders of every kind, under way, and when she is put back onto the ice (`tools/carpathia_tests.js`).

**What it may order** (only what the model has):

| Order | In the model | Searched as |
|---|---|---|
| A watertight door raised by hand | `door b true` (`Sys.openDoor`): open at once; its float drops it when water stands half a metre on either side | each bulkhead with doors, C to O, raised once; also raised and dropped by hand 10 or 30 minutes later |
| A door dropped by hand | `door b false` (`C.releaseDoor`): it falls in 25 s | after a raise |
| The bridge's switch | `doors` (`Sys.bridgeDoors`): releases every raised tank-top door, if the dynamos give current | in the random restarts |
| Pumps put on a room | `pump room 'all'`, `'own'` or one pump (`Sys.pumpOrder`): a room's own pumps work 5 minutes later, pumps led through the main 30 minutes later, to the room's suctions and the mains; the engineers then wait for orders | every room with suctions, 'all' and 'own'; one pump from anywhere on each boiler room from 6 to 2 and on the engine rooms |
| The pumps handed back | `pump -1 'engineers'` | after any pump order |
| The engines | `telegraph`: Slow, Half or Full, ahead or astern, then Stop 5 to 60 minutes later; the helm stays amidships | six orders, five durations |
| A boiler room's fires drawn | `fires k` (`Sys.drawFires`): 20 minutes to draw | each lit room, and every room |

An order the model refuses (a pump with no steam, a hold whose valves are lost in the firemen's passage, a room whose
pumps are on it already) is logged with its reason and changes nothing: the night is scored as the night it leaves, and
the order is not counted as carried out. An order with nothing to do (a door dropped that was shut, fires drawn that
were out) is not counted either. The best nights are published with the orders carried out only, and replay to the
same bits.

**The score.** Minutes afloat after the touch, to the core's own foundering (her highest point half a metre under, or
her trim past 68.75 degrees, or no buoyancy left), or "afloat" if she lies steady after four hours or is afloat at
eight, as `Night.sink` runs a watch. Beside it every night reports her greatest list and when, the minute the main
dynamos stopped, the minute she went dark, and the minute her engines were lost for good (the plant could give them
nothing). Every foundering ends at a list of 80.2 degrees, where the core stops a roll, so the nights the report shows
are run once more for their greatest list from T+5 to ten minutes before the end, and the minute her bridge went under.
A night in which an order backs her onto the berg, so that the contact opens her anew, ranks after every night that
does not, whatever its minutes: a second collision is no remedy (section 6 says what such nights gain).

**The method, cheapest first** (the brainstorm's section 8; no tree search):

1. One order at a time, at ten moments each (T+1, 3, 5, 10, 20, 30, 45, 60, 90, 120; one pump led to another room at
   T+1, 30, 60, 90): 690 nights, the table of section 3.
2. The handful that matter, together: the best order of each kind of action that buys a quarter of a minute alone
   (pumps by the room they go on, the engines by direction, each door, the fires), eight at most, and the pumps handed
   back. Here: every pump that can reach boiler room 6, boiler room 5, No. 3 hold, No. 2 hold, boiler room 4; door F;
   half astern for half an hour; the pumps handed back. Their times on a five-minute grid (T+1, 5, 10, ... 150); a beam
   of five, kept diverse, widened one order at a time while it improved: 217, 1,075, 924 and 756 nights for one to four
   orders, the best at 159.3, 162.9, 165.4 and 167.8; then its best three refined to the minute (168.05).
3. Random restarts from the seed: 400 nights of two to four orders drawn from every slot, on the grid; the best four
   refined (times moved five minutes and one either way, an order dropped): 164.9 at best.
4. The best night so far with one more order: boiler room 3's pump moved to boiler room 4 at T+61 took 168.05 to 169.33.

The budget counts distinct nights on the model as it stands: phase 1 may take 30 % of it, the beam 60 %, its
refinement 75 %, the restarts 92 %, the polish the rest. The same seed and budget give the same table with one thread
or four (a test row); the progress is kept a night a line, so a run cut off resumes to the same table (a test row).

## 2. The targets: Carpathia alongside, from the help reader

From `core/readers/world.js`, run on the 1912 watch: as the night went; with the distress call made five minutes after
the touch; and with the call made then and five miles made good toward Carpathia from ten minutes (the world suite's
own procedure, `makeGood`), each to her foundering [measured]:

| What is done differently | Carpathia alongside (T) | She must last this much longer than 157.21 |
|---|---|---|
| nothing (1912) | 265.15 | 107.9 |
| the call made at once | 213.22 | 56.0 |
| the call at once, and five miles made good toward her | 192.50 | 35.3 (that night founders at 157.17: the steaming cost her 0.04 minutes) |

The brainstorm's 105, 53 and 31 took 160 minutes for her life; against the model's own 157.21 they are 107.9, 56.0 and
35.3. On the best night the help reader brings Carpathia alongside at T+265.67 (the call as made in 1912).

## 3. One order at a time: what matters at all

690 nights: each order at ten moments (one pump led to another room at four), the gain in minutes over the 157.21 of
the watch as it went [measured]. "0" is the same night to the bit; "=" a changed night within three seconds; "ref" an
order the model refused, so the night is the baseline's; "ICE" an order that backs her onto the berg. Rooms: FP the
forepeak, H1 to H3 the holds, BR6 to BR1 the boiler rooms from forward, RE the reciprocating engine room, TE the turbine
room, EL the electric engine room, T1 and T2 the shaft tunnels. Pumps by where they stand and their tons an hour (RE 250a,
the first of the reciprocating engine room's two 250s).

| Order (one at a time) | T+1 | T+3 | T+5 | T+10 | T+20 | T+30 | T+45 | T+60 | T+90 | T+120 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| raise door C (H2, H3) | = | = | = | = | = | = | = | = | = | = |
| raise door D (H3, BR6) | = | = | = | = | = | = | = | = | = | = |
| raise door E (BR6, BR5) | 0 | 0 | -0.4 | -0.8 | -1.0 | -0.8 | -0.8 | -0.7 | -0.3 | = |
| raise door F (BR5, BR4) | 0 | 0 | 0 | 0 | +1.1 | +1.4 | +1.6 | +0.4 | -0.8 | +0.1 |
| raise door G (BR4, BR3) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| raise door H (BR3, BR2) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| raise door J (BR2, BR1) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| raise door K (BR1, RE) | = | = | = | = | = | = | = | = | = | = |
| raise door L (RE, TE) | = | = | = | = | = | = | = | = | = | = |
| raise door M (TE, EL) | = | = | = | = | = | = | = | = | = | = |
| raise door N (EL, T1) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| raise door O (T1, T2) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| every pump that reaches H1 on it | -0.3 | -0.3 | -0.3 | ref | ref | ref | ref | ref | ref | ref |
| every pump that reaches H2 on it | +0.7 | +0.7 | +0.6 | ref | ref | ref | ref | ref | ref | ref |
| every pump that reaches H3 on it | +0.8 | +0.7 | +0.7 | ref | ref | ref | ref | ref | ref | ref |
| every pump that reaches BR6 on it | +0.7 | +0.7 | +0.7 | +2.1 | +1.8 | +1.5 | +1.0 | +0.5 | +0.4 | = |
| BR6's own pumps on it | ref | ref | ref | ref | ref | ref | ref | ref | ref | ref |
| every pump that reaches BR5 on it | +0.2 | +0.2 | +0.2 | +0.1 | -0.1 | +2.0 | +1.2 | +0.6 | +0.5 | = |
| BR5's own pumps on it | ref | ref | ref | ref | ref | ref | ref | ref | ref | ref |
| every pump that reaches BR4 on it | +0.6 | +0.6 | +0.6 | +0.6 | +0.6 | +0.6 | +0.6 | +0.6 | -0.1 | ref |
| BR4's own pumps on it | -0.5 | -0.5 | -0.5 | -0.5 | -0.5 | -0.5 | -0.5 | -0.5 | ref | ref |
| every pump that reaches BR3 on it | -0.6 | -0.6 | -0.6 | -0.6 | -0.6 | -0.6 | -0.6 | -0.6 | +0.1 | = |
| BR3's own pumps on it | -0.6 | -0.6 | -0.6 | -0.6 | -0.6 | -0.6 | -0.6 | -0.6 | -0.1 | = |
| every pump that reaches BR2 on it | -0.9 | -0.9 | -0.9 | -0.9 | -0.9 | -0.9 | -0.9 | -0.9 | -0.5 | = |
| BR2's own pumps on it | -0.9 | -0.9 | -0.9 | -0.9 | -0.9 | -0.9 | -0.9 | -0.9 | -0.5 | = |
| every pump that reaches BR1 on it | -0.9 | -0.9 | -0.9 | -0.9 | -0.9 | -0.9 | -0.9 | -0.9 | -0.5 | 0 |
| every pump that reaches RE on it | -0.9 | -0.9 | -0.9 | -0.9 | -0.9 | -0.9 | -0.9 | -0.9 | -0.5 | 0 |
| RE's own pumps on it | -0.9 | -0.9 | -0.9 | -0.9 | -0.9 | -0.9 | -0.9 | -0.9 | -0.5 | 0 |
| every pump that reaches TE on it | -0.9 | -0.9 | -0.9 | -0.9 | -0.9 | -0.9 | -0.9 | -0.9 | -0.5 | 0 |
| TE's own pumps on it | -0.9 | -0.9 | -0.9 | -0.9 | -0.9 | -0.9 | -0.9 | -0.9 | -0.5 | 0 |
| every pump that reaches EL on it | -0.9 | -0.9 | -0.9 | -0.9 | -0.9 | -0.9 | -0.9 | -0.9 | -0.5 | 0 |
| every pump that reaches T1 on it | -0.9 | -0.9 | -0.9 | -0.9 | -0.9 | -0.9 | -0.9 | -0.9 | -0.5 | 0 |
| every pump that reaches T2 on it | -0.9 | -0.9 | -0.9 | -0.9 | -0.9 | -0.9 | -0.9 | -0.9 | -0.5 | 0 |
| pump BR5 250 on BR6 | -1.7 |  |  |  |  | ref |  | ref | ref |  |
| pump BR4 150 on BR6 | +0.3 |  |  |  |  | -0.1 |  | -0.5 | -0.9 |  |
| pump BR3 250 on BR6 | +1.1 |  |  |  |  | +1.1 |  | +0.3 | +0.1 |  |
| pump BR2 250 on BR6 | +1.1 |  |  |  |  | +1.1 |  | +0.4 | +0.2 |  |
| pump RE 250a on BR6 | +1.1 |  |  |  |  | +1.1 |  | +0.4 | +0.2 |  |
| pump RE 250b on BR6 | +1.1 |  |  |  |  | +1.1 |  | +0.4 | +0.2 |  |
| pump RE 150a on BR6 | +0.6 |  |  |  |  | +0.3 |  | -0.2 | -0.1 |  |
| pump RE 150b on BR6 | +0.6 |  |  |  |  | +0.3 |  | -0.2 | -0.1 |  |
| pump TE 150 on BR6 | +0.6 |  |  |  |  | +0.3 |  | -0.2 | -0.1 |  |
| pump BR6 150 on BR5 | -1.0 |  |  |  |  | ref |  | ref | ref |  |
| pump BR4 150 on BR5 | +0.2 |  |  |  |  | -0.1 |  | -0.5 | -0.9 |  |
| pump BR3 250 on BR5 | +0.6 |  |  |  |  | +1.4 |  | +0.4 | +0.2 |  |
| pump BR2 250 on BR5 | +0.6 |  |  |  |  | +1.4 |  | +0.5 | +0.2 |  |
| pump RE 250a on BR5 | +0.6 |  |  |  |  | +1.4 |  | +0.5 | +0.2 |  |
| pump RE 250b on BR5 | +0.6 |  |  |  |  | +1.4 |  | +0.5 | +0.2 |  |
| pump RE 150a on BR5 | +0.6 |  |  |  |  | +0.4 |  | -0.1 | -0.1 |  |
| pump RE 150b on BR5 | +0.6 |  |  |  |  | +0.4 |  | -0.1 | -0.1 |  |
| pump TE 150 on BR5 | +0.6 |  |  |  |  | +0.4 |  | -0.1 | -0.1 |  |
| pump BR6 150 on BR4 | -1.0 |  |  |  |  | ref |  | ref | ref |  |
| pump BR5 250 on BR4 | -1.7 |  |  |  |  | ref |  | ref | ref |  |
| pump BR3 250 on BR4 | +0.3 |  |  |  |  | +0.3 |  | +0.3 | -0.1 |  |
| pump BR2 250 on BR4 | +0.4 |  |  |  |  | +0.4 |  | +0.4 | -0.1 |  |
| pump RE 250a on BR4 | +0.4 |  |  |  |  | +0.4 |  | +0.4 | -0.1 |  |
| pump RE 250b on BR4 | +0.4 |  |  |  |  | +0.4 |  | +0.4 | -0.1 |  |
| pump RE 150a on BR4 | -0.2 |  |  |  |  | -0.2 |  | -0.2 | -0.1 |  |
| pump RE 150b on BR4 | -0.2 |  |  |  |  | -0.2 |  | -0.2 | -0.1 |  |
| pump TE 150 on BR4 | -0.2 |  |  |  |  | -0.2 |  | -0.2 | -0.1 |  |
| pump BR6 150 on BR3 | -1.0 |  |  |  |  | ref |  | ref | ref |  |
| pump BR5 250 on BR3 | -1.7 |  |  |  |  | ref |  | ref | ref |  |
| pump BR4 150 on BR3 | -0.9 |  |  |  |  | -0.9 |  | -0.9 | -0.9 |  |
| pump BR2 250 on BR3 | -0.6 |  |  |  |  | -0.6 |  | -0.6 | -0.1 |  |
| pump RE 250a on BR3 | -0.6 |  |  |  |  | -0.6 |  | -0.6 | -0.1 |  |
| pump RE 250b on BR3 | -0.6 |  |  |  |  | -0.6 |  | -0.6 | -0.1 |  |
| pump RE 150a on BR3 | -0.7 |  |  |  |  | -0.7 |  | -0.7 | -0.2 |  |
| pump RE 150b on BR3 | -0.7 |  |  |  |  | -0.7 |  | -0.7 | -0.2 |  |
| pump TE 150 on BR3 | -0.7 |  |  |  |  | -0.7 |  | -0.7 | -0.2 |  |
| pump BR6 150 on BR2 | -1.0 |  |  |  |  | ref |  | ref | ref |  |
| pump BR5 250 on BR2 | -1.7 |  |  |  |  | ref |  | ref | ref |  |
| pump BR4 150 on BR2 | -0.9 |  |  |  |  | -0.9 |  | -0.9 | -0.9 |  |
| pump BR3 250 on BR2 | -0.9 |  |  |  |  | -0.9 |  | -0.9 | -0.5 |  |
| pump RE 250a on BR2 | -0.9 |  |  |  |  | -0.9 |  | -0.9 | -0.5 |  |
| pump RE 250b on BR2 | -0.9 |  |  |  |  | -0.9 |  | -0.9 | -0.5 |  |
| pump RE 150a on BR2 | -0.9 |  |  |  |  | -0.9 |  | -0.9 | -0.5 |  |
| pump RE 150b on BR2 | -0.9 |  |  |  |  | -0.9 |  | -0.9 | -0.5 |  |
| pump TE 150 on BR2 | -0.9 |  |  |  |  | -0.9 |  | -0.9 | -0.5 |  |
| slow ahead for 10 min | = | = | = | = | = | = | = | -0.1 | = | = |
| slow ahead for 30 min | = | = | = | -0.1 | -0.1 | -0.1 | -0.2 | -0.2 | -0.1 | = |
| half ahead for 10 min | = | -0.1 | -0.1 | -0.1 | -0.1 | -0.1 | -0.2 | -0.2 | -0.2 | -0.1 |
| half ahead for 30 min | -0.2 | -0.2 | -0.3 | -0.3 | -0.3 | -0.4 | -0.6 | -0.7 | -0.5 | -0.2 |
| full ahead for 10 min | -0.2 | -0.2 | -0.2 | -0.2 | -0.2 | -0.2 | -0.3 | -0.4 | -0.3 | -0.2 |
| full ahead for 30 min | -0.5 | -0.5 | -0.6 | -0.6 | -0.6 | -0.8 | -1.2 | -1.4 | -0.6 | -0.2 |
| slow astern for 10 min | = | = | +0.1 | = | = | = | = | = | = | = |
| slow astern for 30 min | +0.1 | = | = | = | = | ICE | = | = | = | -0.1 |
| half astern for 10 min | = | = | = | = | = | = | = | = | = | = |
| half astern for 30 min | = | = | = | = | = | = | -0.1 | -0.2 | +0.3 | -0.2 |
| full astern for 10 min | = | = | = | = | = | = | = | -0.1 | -0.1 | -0.1 |
| full astern for 30 min | = | = | = | = | = | = | -0.1 | -0.4 | -0.2 | -0.2 |
| draw every fire | -0.5 | -0.5 | -0.5 | -0.4 | -0.2 | -0.1 | = | 0 | 0 | 0 |
| draw BR6's fires | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| draw BR5's fires | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| draw BR4's fires | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| draw BR3's fires | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| draw BR2's fires | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

What it says [measured]:

- **Pumps on the rooms that are flooding help a little.** Every pump that can reach boiler room 6, ordered ten minutes
  after the touch, buys 2.1 minutes; every pump that can reach boiler room 5, at T+30, 2.0; the holds' (No. 2 and No. 3)
  at T+1 to T+5, before the firemen's passage floods at T+5.2, about 0.7. One pump from a dry room led to boiler room 6
  or 5: up to 1.4.
- **Pumps put on a dry room cost about a minute.** Every pump on boiler room 2 or any room aft of it, ordered at any
  moment to T+60: 0.9 lost. A bridge order takes the pumps from the engineers, whose rules then wait for orders: when
  the water reaches boiler room 4 at T+86 nobody puts its pump on it, nor leads boiler room 3's to it.
- **A door raised where water already stands.** Door F, between boiler rooms 5 and 4, raised at T+20 to T+45: 1.1 to
  1.6 minutes, though its float drops it at once. In the 25 seconds of its fall some water reaches boiler room 4, and
  the engineers' rule (water seen in a room: its own pumps on it five minutes later, more led to it half an hour after)
  then works there from T+50 instead of T+91, and from T+75 instead of T+116: 506 t pumped against 269. It is the
  engineers' rule fired early, not the door; the same pump ordered from the bridge at T+45 loses 0.45 minutes, because
  the bridge then has the pumps and no more are led. Door E (boiler rooms 6 and 5) costs up to a minute: boiler room 6's
  water into 5. Doors G to O, between dry rooms, change no bit of the night: a float trips at half a metre of water,
  below the door's point in the model (0.85 m over the tank top), so the door is down before any water passes it.
- **The engines ahead cost.** At speed the sea stands higher at the bow's openings (P5): half ahead for half an hour,
  up to 0.7 minutes lost; full ahead for half an hour from T+60, 1.4. Astern does next to nothing (the model lends no
  suction where the water leaves the plating: P5, Tier 0), a few seconds either way, with one exception that is no
  remedy: slow astern for half an hour from T+30 backs her onto the berg, and the contact opens 26 new holes.
- **The fires.** Drawing one boiler room's fires changes no bit of the night: with the engines stopped the other rooms
  give the auxiliaries all they ask. Drawing every fire costs up to half a minute: late in the night the steam fails,
  and the pumps with it.

The Court found that the pumps "could not have prolonged her life appreciably". The model's answer, one order at a
time: nothing buys more than about two minutes, and a pump order on the wrong room costs one.

## 4. The best nights

Each set of orders once (the same orders a minute or two apart are one night here); no night that puts her back onto
the ice [measured]:

| # | Minutes | Gain | Orders carried out | List from T+5 to her last 10 min | Bridge under | Dynamos stop | Dark | Engines lost | Pumped |
|---:|---:|---:|---|---|---:|---:|---:|---:|---:|
| 1 | 169.33 | +12.12 | T+1.0 every free pump that can reach No. 2 hold put on it; T+1.0 every free pump that can reach No. 3 hold put on it; T+9.0 every free pump that can reach boiler room 6 put on it; T+26.0 every free pump that can reach boiler room 5 put on it; T+61.0 boiler room 3's ballast-and-bilge pump put on boiler room 4 | 7.4 deg at T+158 | T+166.2 | T+168.4 | T+168.4 | T+168.4 | 2545 t |
| 2 | 169.28 | +12.07 | T+1.0 every free pump that can reach No. 3 hold put on it; T+2.0 every free pump that can reach No. 2 hold put on it; T+9.0 every free pump that can reach boiler room 6 put on it; T+26.0 every free pump that can reach boiler room 5 put on it; T+61.0 boiler room 3's ballast-and-bilge pump put on boiler room 4 | 7.4 deg at T+158 | T+166.2 | T+168.4 | T+168.4 | T+168.4 | 2538 t |
| 3 | 168.80 | +11.59 | T+1.0 every free pump that can reach No. 2 hold put on it; T+1.0 every free pump that can reach No. 3 hold put on it; T+9.0 every free pump that can reach boiler room 6 put on it; T+26.0 every free pump that can reach boiler room 5 put on it; T+60.0 the other ballast pump in the reciprocating engine room put on boiler room 4 | 7.3 deg at T+157 | T+165.7 | T+167.9 | T+167.9 | T+167.9 | 2476 t |
| 4 | 168.53 | +11.32 | T+1.0 every free pump that can reach No. 2 hold put on it; T+1.0 every free pump that can reach No. 3 hold put on it; T+1.0 a bilge pump in the reciprocating engine room put on boiler room 5; T+9.0 every free pump that can reach boiler room 6 put on it; T+26.0 every free pump that can reach boiler room 5 put on it | 6.2 deg at T+157 | T+165.5 | T+167.6 | T+167.6 | T+167.6 | 2390 t |
| 5 | 168.28 | +11.08 | T+1.0 every free pump that can reach No. 2 hold put on it; T+1.0 every free pump that can reach No. 3 hold put on it; T+9.0 every free pump that can reach boiler room 6 put on it; T+26.0 every free pump that can reach boiler room 5 put on it; T+120.0 boiler room 3's own pumps put on it | 5.3 deg at T+157 | T+165.2 | T+167.4 | T+167.4 | T+167.4 | 2387 t |
| 6 | 168.19 | +10.99 | T+1.0 every free pump that can reach No. 2 hold put on it; T+1.0 every free pump that can reach No. 3 hold put on it; T+1.0 a ballast pump in the reciprocating engine room put on boiler room 6; T+9.0 every free pump that can reach boiler room 6 put on it; T+26.0 every free pump that can reach boiler room 5 put on it | 6.3 deg at T+157 | T+165.1 | T+167.3 | T+167.3 | T+167.3 | 2361 t |
| 7 | 168.17 | +10.96 | T+1.0 every free pump that can reach No. 2 hold put on it; T+1.0 every free pump that can reach No. 3 hold put on it; T+1.0 a bilge pump in the reciprocating engine room put on boiler room 6; T+9.0 every free pump that can reach boiler room 6 put on it; T+26.0 every free pump that can reach boiler room 5 put on it | 6.2 deg at T+157 | T+165.1 | T+167.3 | T+167.3 | T+167.3 | 2355 t |
| 8 | 168.14 | +10.93 | T+1.0 every free pump that can reach No. 2 hold put on it; T+1.0 every free pump that can reach No. 3 hold put on it; T+9.0 every free pump that can reach boiler room 6 put on it; T+26.0 every free pump that can reach boiler room 5 put on it; T+90.0 boiler room 4's own pumps put on it | 6.6 deg at T+157 | T+165.1 | T+167.2 | T+167.2 | T+167.2 | 2320 t |

**The best night, in words** (`out/carpathia_best.json`; T in minutes after the touch at 11:40 pm):

1. **T+1.0**: every free pump that can reach No. 2 hold put on it: boiler room 4's ash-ejector pump and the rest of
   the hold's suctions from boiler room 3's 250, led through the main, 196 tons an hour, at work from T+31.
2. **T+1.0**: every free pump that can reach No. 3 hold put on it: boiler room 2's 250, 196 tons an hour, at work from
   T+31 to her last minute. Both hold orders are given before the firemen's passage floods at T+5.2; after it the
   model refuses them.
3. **T+9.0**: every free pump that can reach boiler room 6 put on it: two of the reciprocating engine room's pumps,
   345 tons an hour, at work from T+39 to the end. The engine rooms stay dry, so these pumps never stop.
4. **T+26.0**: every free pump that can reach boiler room 5 put on it: the engine room's two 150s and the turbine
   room's, 367 tons an hour, at work from T+56 to the end.
5. **T+61.0**: boiler room 3's 250 taken off No. 2 hold and led to boiler room 4: at work from T+91, just after its
   water comes at T+86, until boiler room 3 floods at T+158.

The pumps draw 279 t from No. 2 hold, 456 from No. 3, 765 from boiler room 6, 783 from boiler room 5 and 284 from
boiler room 4. She founders at T+169.33 (step 40,879, fingerprint `d17ac988`), lit and with her engines able to turn to
her last minute, her list never past 7.4 degrees before her last ten minutes, her bridge under at T+166.2. The pumps
are never handed back to the engineers. It opens in the page at this address (the end card's encoding, after the
site's own address):

`#night=1912&log=W1sxMzcsImhlbG0iLC00MF0sWzI0MSwiaGVsbSIsNDBdLFs0ODEsInRlbGVncmFwaCIsInN0b3AiXSxbNDgxLCJoZWxtIiwwXSxbNDgyLCJwdW1wIiwyLCJhbGwiXSxbNDgyLCJwdW1wIiwzLCJhbGwiXSxbMjQwMSwicHVtcCIsNCwiYWxsIl0sWzY0ODEsInB1bXAiLDUsImFsbCJdLFsxNDg4MSwicHVtcCIsNiwzXV0`

Opened in the page (headless Edge, `tools/night_end_site_test.js`, row 4b), the address replays as a watch, all nine of its
orders accepted by the address check; run on, she founders at 10,217 s, the time the model alone gives for the same log
in the page's engine, to the bit (fingerprint `4194e79e`, step 40,868), and 2.75 s from Node's 10,219.75 s: two
engines part in the last bits (backlog X1). The end card says "She foundered at 2:29 am, 2 h 49 min after she touched
the ice", this note's T+169.33 to the minute [measured].

Two things in it are bets of the model, and the robustness rerun moves both: that the holds' bilge valves, which stood in
the firemen's passage, could be opened in the first minute and stay open after the passage flooded (the model's rule
refuses an order to a hold only after it floods); and that a pump led through the main works half an hour after the
order (Wilding's half hour for portable pipe; Y7 asks whether the permanent main took minutes).

## 5. How firm: the best nights on forty models

The best three nights (three different sets of orders) and the baseline, on forty models: the model as it stands; each
of the fifteen guesses of section 8 alone at each end of its range (29 models; a door's fall has one end only); and ten
with all fifteen drawn at once from the seed. In brackets each night's gain over that model's own baseline [measured].

| Model | Baseline | Night 1 (gain) | Night 2 (gain) | Night 3 (gain) |
|---|---:|---:|---:|---:|
| as the files have it | 157.21 | 169.33 (+12.12) | 169.28 (+12.07) | 168.80 (+11.59) |
| doorLowA 1 m2 | 157.21 | 169.33 (+12.12) | 169.28 (+12.07) | 168.80 (+11.59) |
| doorLowA 2 m2 | 157.21 | 169.33 (+12.12) | 169.28 (+12.07) | 168.80 (+11.59) |
| doorA 1 m2 | 157.21 | 169.33 (+12.12) | 169.28 (+12.07) | 168.80 (+11.59) |
| doorA 2.2 m2 | 157.21 | 169.33 (+12.12) | 169.28 (+12.07) | 168.80 (+11.59) |
| sill -0.35 m | 157.21 | 169.33 (+12.12) | 169.28 (+12.07) | 168.80 (+11.59) |
| sill 0.45 m | 157.21 | 169.33 (+12.12) | 169.28 (+12.07) | 168.80 (+11.59) |
| floatDepth 0.46 m | 157.21 | 169.33 (+12.12) | 169.28 (+12.07) | 168.80 (+11.59) |
| floatDepth 0.61 m | 157.21 | 169.33 (+12.12) | 169.28 (+12.07) | 168.80 (+11.59) |
| doorFall 30 s | 157.21 | 169.33 (+12.12) | 169.28 (+12.07) | 168.80 (+11.59) |
| bowWave 0.44 | 157.29 | 169.39 (+12.10) | 169.37 (+12.07) | 168.92 (+11.63) |
| bowWave 0.66 | 157.21 | 169.27 (+12.06) | 169.26 (+12.05) | 168.78 (+11.58) |
| bowLen 20 m | 157.43 | 169.55 (+12.12) | 169.54 (+12.11) | 169.04 (+11.61) |
| bowLen 45 m | 157.17 | 169.30 (+12.13) | 169.27 (+12.10) | 168.76 (+11.59) |
| pumpRate 0.7x | 156.89 | 165.00 (+8.11) | 164.98 (+8.09) | 164.18 (+7.29) |
| pumpRate 1.15x | 157.39 | 169.89 (+12.50) | 169.87 (+12.47) | 169.56 (+12.17) |
| suction 0.8x | 157.05 | 166.95 (+9.90) | 166.93 (+9.88) | 166.80 (+9.75) |
| suction 1.2x | 157.37 | 171.74 (+14.37) | 171.69 (+14.32) | 170.93 (+13.56) |
| mains 0.5x | 157.21 | 169.33 (+12.12) | 169.28 (+12.07) | 168.80 (+11.59) |
| mains 1.2x | 157.21 | 169.33 (+12.12) | 169.28 (+12.07) | 168.80 (+11.59) |
| pumpOwn 120 s | 157.39 | 169.50 (+12.11) | 169.49 (+12.10) | 169.03 (+11.64) |
| pumpOwn 600 s | 156.85 | 167.19 (+10.34) | 167.17 (+10.33) | 164.80 (+7.95) |
| pumpLent 600 s | 160.22 | 171.60 (+11.38) | 171.61 (+11.39) | 171.14 (+10.92) |
| pumpLent 2700 s | 157.11 | 167.06 (+9.95) | 167.03 (+9.92) | 166.59 (+9.48) |
| pumpAbandon 1.5 m | 156.26 | 168.41 (+12.15) | 168.38 (+12.13) | 168.01 (+11.75) |
| pumpAbandon 99 m | 167.02 | 171.37 (+4.35) | 171.36 (+4.34) | 170.43 (+3.40) |
| pumpStrum 0.05 m | 157.23 | 169.31 (+12.08) | 169.28 (+12.06) | 168.83 (+11.61) |
| pumpStrum 0.3 m | 157.20 | 169.28 (+12.08) | 169.26 (+12.06) | 168.78 (+11.58) |
| passage -1 min | 157.21 | 163.03 (+5.82) | 163.03 (+5.82) | 164.87 (+7.66) |
| passage 10 min | 157.21 | 169.33 (+12.12) | 169.28 (+12.07) | 168.80 (+11.59) |
| every guess drawn (1) | 158.73 | 163.65 (+4.92) | 163.64 (+4.92) | 163.05 (+4.32) |
| every guess drawn (2) | 163.24 | 162.60 (-0.64) | 162.60 (-0.64) | 162.93 (-0.31) |
| every guess drawn (3) | 168.64 | 166.59 (-2.05) | 166.59 (-2.05) | 167.63 (-1.01) |
| every guess drawn (4) | 156.57 | 161.81 (+5.24) | 161.81 (+5.24) | 163.21 (+6.63) |
| every guess drawn (5) | 162.73 | 162.41 (-0.32) | 162.41 (-0.32) | 163.30 (+0.57) |
| every guess drawn (6) | 164.91 | 162.38 (-2.52) | 162.38 (-2.52) | 163.06 (-1.85) |
| every guess drawn (7) | 168.33 | 172.03 (+3.70) | 171.99 (+3.66) | 170.85 (+2.52) |
| every guess drawn (8) | 157.11 | 162.66 (+5.55) | 162.66 (+5.55) | 163.01 (+5.90) |
| every guess drawn (9) | 157.26 | 167.11 (+9.85) | 167.08 (+9.82) | 166.26 (+9.00) |
| every guess drawn (10) | 164.95 | 168.82 (+3.88) | 168.80 (+3.85) | 168.32 (+3.37) |

What it says [measured]:

- **Night 1's gain holds** (at least half of it, and at least half a minute) **on 29 of the 40 models**; it lasts as
  long as on the model as it stands, within half a minute, on 25; it helps at all on 36. Across the forty its gain runs
  from -2.5 to +14.4 minutes, the median +12.1. Nights 2 and 3 tell the same (29 and 32 of 40).
- **The doors' guesses and the sea's do nothing to it**: it gives no door order and no engine order, and the sea at
  speed moves only her first minute.
- **The pumps' guesses move it**, each alone: their rate at 0.7 of the rating, +8.1; the suctions at 0.8 or 1.2 of the
  model's, +9.9 or +14.4; a room's own pumps at work in ten minutes, +10.3; pumps through the main in ten minutes,
  +11.4 (the baseline itself gains 3.0), in 45 minutes, +10.0.
- **Two guesses, moved alone, break it.** If the holds' valves were lost at once, the two hold orders are refused and
  the gain is 5.8. If the pumps ran on unattended in rooms that flood, the engineers' own pumps keep working: the
  baseline gains 9.8 minutes with no order, and the best night only 4.4 more.
- **On four of the ten models with every guess drawn it is lost** (-0.3 to -2.5): each has the pumps running on in
  flooded rooms (crews leaving at 3.5 to 8.3 m of water, or never), and there the engineers' rules, left alone, pump
  more than the bridge's orders allow. On the other six it keeps 3.7 to 9.9 minutes.

So the finding is not twelve minutes but this: on this model the orders a crew could give buy minutes, of the order of
ten, against the half hour to two hours needed; how many depends on what the pumps could really do, which no source
gives.

## 6. Outside the orders

### 6.1 The doors held open against their floats

The validation table's "doors left open" (2 h 59 min on the 1912 damage preset, 22 minutes longer than its 2 h 37 min)
says that the model's largest lever is the watertight doors. On a watch no order can pull it. A door raised by hand
stays up only until water stands half a metre on either side of it; then its float drops it, as Wilding described and
as the model has it (Y2). Every door raised at T+1, which is all the order does, founders at T+157.20: nothing. Nobody
in 1912 is recorded holding a door against its float (the door note, section 10(b), lists it as a bet), and the model
raises a door at once where by hand it took four or five minutes. So the search does not do it, and no night of section
4 holds a door. What the model says of it, apart from the search, with the floats disarmed in the copy of the watch, on
the forty models [measured]:

| What-if, not an order | Founders | Gain | List, T+5 to her last 10 min | Dynamos stop | Dark | Gain over the 40 models: least, median, most | Lasts past T+192.5 / T+213.2 / T+265.2 |
|---|---:|---:|---|---:|---:|---|---|
| every door, C to O, held open from T+1 | T+196.90 | +39.70 | 26.0 deg at T+92 | T+101.8 | T+125.8 | +21.0, +39.7, +50.5 | 36 / 0 / 0 of 40 |
| every door held open from T+30, when the engineers began raising them in 1912 | T+195.08 | +37.87 | 26.0 deg at T+91 | T+100.6 | T+130.3 | +19.9, +37.9, +48.9 | 36 / 0 / 0 of 40 |
| D, E and F only (the doors between the flooded rooms and boiler room 4) held open from T+1 | T+137.04 | -20.16 | 7.5 deg at T+12 | T+136.1 | T+136.1 | -23.2, -20.2, -17.3 | 0 / 0 / 0 of 40 |
| G to O held open from T+30 (the doors raised in 1912, held) | T+156.69 | -0.52 | 13.5 deg at T+145 | T+155.8 | T+155.8 | -1.2, -0.5, -0.2 | 0 / 0 / 0 of 40 |

With every door held open from T+1 she lasts to T+196.9, past Carpathia with the call made at once and five miles made
good (T+192.5), and so on 36 of the 40 models; past the call made at once (T+213.2), on none. But the minutes are a
hulk's. She lists to port 13 degrees by T+20, 21 by T+60 and 26 at T+92, more than the 10 to 15 the record has at the
very end; the water running aft along the tank top reaches the dynamo flat, the main dynamos stop at T+101.8, and she is
dark from T+125.8, seventy minutes before the end. And the minutes rest on a guess: with the tank-top doors at the one
size this repository has seen, Empress of Ireland's (1.0 m2, HANDOFF section 6; Titanic's are NOT FOUND), she lasts to
T+178.2, short of that target; at 2.0 m2, to T+207.7. The model's free surface late in the night is suspect (HANDOFF section 4b: it holds GM near 0.5 m through
2:00), and a 1998 documentary is reported to have found the open-doors ship capsizing about thirty minutes early (the
door note: a search summary, not seen). Held open from T+30, when the engineers began to raise the doors in 1912, the
figures are much the same (T+195.1). Opening only D, E and F, the doors between the flooded rooms and boiler room 4,
costs 20 minutes: the water fills boiler room 4 and goes no further. The doors raised in 1912, G to O from T+30, held
open, change nothing (T+156.7).

So the model's one large lever is an order it does not have, and a night that pulled it would be a dark ship that lay
over twenty degrees and more for an hour. Whether a crew could have held the doors, and whether the model's free
surface would let her float so with them open, are questions for the model before they are answers (W5b, proposed;
W6).

### 6.2 The ice again: water let in aft

The search met a second collision too. With the helm amidships, half astern for half an hour from T+35 backs her onto
the berg at T+59, and the contact opens 0.15 m2 in the two shaft-tunnel compartments on her port side, 4.4 m above the
keel. About 1,600 t comes in aft, and with every pump that can reach No. 2 hold at T+1, boiler room 6 at T+10 and boiler
room 5 at T+30 she lasts to T+179.4, fourteen minutes longer than the same pumps without it (T+165.2) [measured]. No
remedy, and the search ranks every such night last. But it says that this model rewards water let in aft, where the
tanks note's arithmetic puts 836 t in the after tanks at under two minutes (its section 2; Rogers's 4 to 4.5 hours
unread). The tanks are not in the model (D18);
before a search orders them, the model's answer to water aft deserves a look of its own.

## 7. What was not searched, and why

- **The tanks and counter-flooding.** Not in the model (D18). The tanks note puts 836 t in the after tanks at under two
  minutes either way [derived there]; section 6.2 says the model may disagree.
- **The boats, the wireless, the rockets.** A later search, on lives (W10). The help reader's two what-ifs are the
  targets here, not orders searched; the score is minutes afloat, not Carpathia's arrival.
- **The helm.** Not among the orders of the brief; the engines' orders run with the helm amidships.
- **A door held open against its float.** The model has no such order, and it raises a door at once where by hand it
  took four or five minutes. So the search raises each door at most once: a door raised again each time its float
  drops it would be held open by an order no crew could carry out. Section 6.1 gives what the model says of it.
- **A bulkhead's doors deck by deck.** The model's door order works every door of a bulkhead together (the tank-top door
  and those on F and E decks above it), so the F-deck doors (Wilding's five to ten minutes) are not searched apart.
- **Two orders in one minute, both ways round.** In one minute the search gives them in a fixed order. It matters
  little: every pump on boiler rooms 4 and 5 at T+3 gives 159.40 with boiler room 4's order first (the CHANGELOG's
  figure, reproduced through the fork) and 159.37 the other way.
- **Pumps taken off a room, one pump taken off.** Not searched as orders of their own: they free only pumps standing in
  rooms that flood (boiler room 6's at T+8.7, boiler room 5's at T+25), which no order can save. (A pump moved is taken
  off its room first: the best night's fifth order does that.)
- **One pump at a time on the holds, boiler room 1, the electric engine room and the tunnels.** Their rooms were
  searched with 'all' (and 'own' where they have pumps); they are dry until her last minutes, or holds whose valves
  are lost at T+5.2.
- **The engines port and starboard apart, other durations.** Six orders, durations of 5 to 60 minutes.
- **The first minute after the touch.** The 1912 orders own it; the search begins at T+1.0.
- **The damage.** Held as the 1912 encounter makes it. The search changes nothing before the ice.
- **Her list and her break.** The model lists her 2 to 8 degrees where the record has 10 to 15 at the end (W6), and she
  does not break (W7): a night "afloat" here is afloat on a model with those gaps.
- **Small gains.** A changed night moves the core's threshold events (README: one ulp can move an event 24 s); gains of
  a few seconds in section 3 are that texture, and nothing here rests on them.

## 8. The guesses

**Moved in the robustness rerun** (`GUESSES` in `tools/carpathia.js`; each alone to each end of its range, then all
fifteen drawn together ten times from the seed):

| Guess | Where it lives | In the files | Moved to | Tag | Its range's source |
|---|---|---|---|---|---|
| The tank-top doors' area | `params.doorLowA` | 1.5 m2 | 1.0 and 2.0 m2 | [bet] | the doors' size NOT FOUND (the door note, 4.1); Empress of Ireland's 5 ft 6 in by 2 ft, 1.02 m2, at the low end (HANDOFF section 6); "just over 6 feet" raised (Scott) |
| The F- and E-deck doors' area | `params.doorA` | 1.67 m2 | 1.0 and 2.2 m2 | [bet] | no size found |
| The tank-top doors' sill | `core/core.js` `rebuildConnections`: a door's point 0.85 m over the tank top (code, not a parameter: moved in the copy at the fork) | 0 | -0.35 and +0.45 m | [bet] | a door over 6 ft high with its sill at the tank top has its middle at 0.91 m; a sill at the plates (0.76 m up) puts it higher |
| Where a float trips | `params.floatDepth` | 0.5 m | 0.46 and 0.61 m | [read] | 18 in to 2 ft over the tank top (Wilding BI 20451-20456; the door note, 4.1) |
| A door's fall | `params.doorFall` | 25 s | 30 s | [read] | 25 to 30 s against the oil cataract (the Report) |
| The bow wave at speed (P5) | `core/motion.js` `SEAFLOW.bowWave` | 0.55 | 0.44 and 0.66 | [bet] | 3 to 4.5 m at 22 knots (the ship-under-way brainstorm, 5) |
| How far aft it reaches (P5) | `SEAFLOW.bowLen` | 30 m | 20 and 45 m | [bet] | none |
| The pumps' rates | `core/systems.js` `PLANT.pumps[].LTh`, all scaled | 1 | 0.7 and 1.15 | [read] rated, [bet] delivered | the Report's 250 and 150 tons an hour are ratings; the ash pumps' 150 is Wilding's hedged figure; a press figure of 11.4 t/min is 40 % of the rating, unexplained (the pumps note, 3.1) |
| What a room's suctions take | `PLANT.suction`, `holdSuction`, scaled | 1 | 0.8 and 1.2 | [derived] | the suctions' sizes at 2.5 m/s, the velocity a bet; 3 m/s gives 20 % more (the pumps note, 5.1) |
| What the mains carry | `PLANT.mainLTh`, scaled | 920 t/h | 0.5 and 1.2 times | [derived] | one 10-in main about 460 tons an hour, two 920 (the pumps note, 5.1) |
| A room's own pumps at work | `PLANT.pumpOwn` | 300 s | 120 and 600 s | [bet] | "soon after the collision" (the Court; Barrett BI 2111) |
| Pumps led through the main at work | `PLANT.pumpLent` | 1,800 s | 600 and 2,700 s | [bet] | Wilding's half hour for 500 ft of portable pipe (BI 20684-20685); the permanent main's valves by rods and wheels may have taken minutes (Y7) |
| When a pump's crew leaves | `params.pumpAbandon` | 2.3 m | 1.5 m, and never (99 m) | [bet] | about 1.5 m over the plates (the pumps note, 5.1); "ran on unattended" not ruled out there |
| How low a pump draws a room | `params.pumpStrum` | 0.1 m | 0.05 and 0.3 m | [bet] | none |
| The firemen's passage | `core/systems.js` `passageT`, as an order to a hold reads it | floods at T+5.2 in the model | lost at once; ten minutes longer | [read] about five minutes (the Report), [bet] the rule | the model floods it when hold 2 or 3 stands over the tunnel's top |

**Held fixed here** (each would move every night, the baseline first; none is a guess about an order):

- the damage: the 1912 encounter's geometry (`GEOM_1912`, fitted), the contact law and the area constant (fitted to
  the 157-minute timeline; P3e: the 1912 point grazes the edge of a stem strike);
- the flooding's four fitted parameters (the opening 0.75 m2, `wMul`, `aDown`, `fOpen`) and the permeabilities
  (HANDOFF section 6);
- the engineers' rules themselves (water first seen in a room: its own pumps on it; more led after `pumpLent`; a room
  lost at `pumpAbandon` given up) [bets in `core/systems.js`];
- the plant's other numbers (the stokers' 20 minutes to draw a room [read]; the steam's store, the dynamos' and the
  pumps' pressures [bets]);
- P5's law (the stagnation share of the plating's angle, no suction) [bet: Tier 0];
- the help reader's numbers that set the targets (Carpathia's 46.5 miles at 13.6 knots [derived in the wireless
  note]; her operator's hours [bet]).

## 9. To rerun it

```
node tools/carpathia.js --nights 6000 --jobs 6 --variants 40 --robust 3 --seed 1   # this run; out/gate/carpathia keeps the progress
node tools/carpathia_tests.js                                                       # the acceptance rows (three or four minutes)
```

The run resumes from `out/gate/carpathia/nights_<hash>.jsonl` (the hash names `core/`'s files and the evaluation, so
nothing of another model is mixed in); `--fresh` starts again. It prints the report, writes it beside the progress
(`report_seed1_n6000_v40.txt`, with the same tables as data in `summary_seed1_n6000_v40.json`) and the best night to
`out/carpathia_best.json`.
