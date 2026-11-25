# After she goes under, all the way down: the plan (v2.1)

- **Written:** 2026-11-20, 09:25 to 09:50 CST, by the coordinating session ("Titanic simulator model accuracy (fork)", Claude Code desktop, Opus 5.5), at Bo's word of the morning: "please wake and communicate with other sessions and continue where yall left off ... together as a group coordinate and move forwards", and twice since: "keep going, coordinate with the others".
- **Status:** advice only; nothing here is a decision. The decisions waiting on Bo are section 4.
- **Supersedes:** `BRAINSTORM_the_descent_to_the_bed_v2_2026-11-19.md`, which stays unchanged; read it for the physics, the contract and the tests. This version records what the lanes found on 19 and 20 November and changes the order of work.
- **Read with:** `DESIGN_the_break_and_two_bodies_v1_2026-11-19.md` (the break); `DESIGN_free_body_air_by_space_v1_2026-11-20.md` (Z1's design for Z6, landing with its lane); the lanes' reports.
- **Tags:** [M] measured; [M: lane] measured by that lane, its table in the notes folder named in section 6; [D] derived; [B] bet.

## 1. Changes in v2.1

1. **Her roll at the break is mended, by the mainline's S1.** S1 puts the tiers above B deck into the core as buoyant spaces with windows, plus the grand staircases, refitted. On the 1912 damage preset [M: the mainline's working tree after its last core change, 19 November 14:40; its own run of 20 November agrees row by row]:

   | T (min) | Trim (deg) | List (deg, to port) | Girder moment (GN m) |
   |---|---|---|---|
   | 150.0 | 6.7 | 3.4 | 4.0 |
   | 154.65 | 8.9 | 2.5 | 4.6 |
   | 155.40 | 10.6 | 5.8 | 5.0 |
   | 155.73 | 12.5 | 7.1 | 5.4 |

   On the committed tree the same moments came with 35 to 67 degrees of list. Her trim reaches 11 degrees at T 155.50 and 17 at T 156.13. The roll still runs away in the last minute: 20 degrees at T 156.26 and 80 (the core's clamp) at T 156.70. The flag, still by the trim rule, is at T 157.23. On the watch she founders 157.75 min after the touch, step 38,100, fingerprint `611be326`.
   - v2's Z4 is therefore done by S1. The break's design B0 ("the roll fault decides whether she breaks at all") is answered for the moment that matters, the break; the last minute is not.
2. **The lanes of 19 November are built and green, uncommitted except Z1:**
   - **Z1, the free body** (`core/readers/fall.js`, `tools/fall_trials.js`): 27 of 27 MUST trials on `a97a6bd`; full gate PASS. Committed on its own branch as `253f919`, on Bo's "commit it locally".
   - **Z2, the deep** (`site/parts/75_deep.js`, three seams in `site/app.js`): 30 of 30 rows of `deep_site` with a stub engine, on today's ship and on the mainline's redrawn one. On 20 November it was reworked so that each piece copies whatever hangs under the ship group and cuts it at the break by one mechanism. The copies share the hull materials' uniforms, and `TitanicApp.hullUniform` adds one to all of them for the wake's K4.
   - **B1 and B2, her strength and the break's onset** (`core/readers/section.js`, `onset.js`, the girder's part):
     - Her ultimate hogging moment amidships, untuned, is **5.31 GN m**, inside the studies' 4.0 to 5.4; sagging is 4.52. The bottom fails first: the tank top's lapped butts, then the double bottom.
     - The elastic check: the neutral axis is 0.40 m off the panel's, which misses the 0.3 m tolerance; the moduli are within 2 and 3 %.
     - On `a97a6bd` the 1912 onset falls at T 154.85, x −10.9, trim 9.6, list 40.7: outside the record's x −16 to −27, and two minutes early.
     - **On S1** (B1+B2's `strength_tests.js` run by the coordinator on a clean export of `dfd3970`, its three files laid over it, 10:05 CST):
       - with her list free, T 155.01, step 37202, x −10.93 (boiler room 2), trim 9.45, list 3.6;
       - with the list held, T 155.40, the same station, list 2.0;
       - on the watch, T 155.52 after the touch.
     - So the tiers fixed her list at the break, and the place did not move. The demand peaks amidships, and the computed strength does not fall off aft enough to move the break into the record's band. That is a finding, and nothing is to be tuned to change it.
     - Two MUST rows of the lane fail on S1, both the lane's to settle at its rebase: one pins the old fingerprint, and one judges how fast the ratio grows after the onset.
   - **The wake's K1 to K3** (another lane): built. Bo: "yes K4 next after the join".
   - The contract is now v: 2: `sim.fall.breakAt` is the point under the break, which the page reads.
3. **D50 is answered by the tiers.** Wholly flooded, the hull at B deck was top-heavy: her weight in water acted 0.66 m above her envelope's centre, and from the flag both pieces landed upside down. With the tiers it acts 2.27 m below (bow 2.65, stern 1.71); her centre of mass with its water lies 0.36 m below that centre [M: Z1].
4. **The tiers must stay out of the water's push (D52).** With them in the section the free body sees her 31 m tall against 28 m of beam. Her sway added mass then exceeds her heave added mass (223,623 t against 181,440 for the whole), and every release lands on its side, roll 89.5 degrees [M: Z1].
   - With the hydrodynamic section taken to the hull's own top (`cols.zhiH`), keeping the tiers' weight, solids and water, she lands upright and 26 of 27 MUST trials pass.
   - The one that fails is trial 6, the time to the bed: 7.14 to 7.19 min against 4.5 to 7.0, from the reconstructions.
   - The reason is physics, not a fit. The tiers' windows give way at 1.5 m of head and the fall puts about 5 m on them; the A-deck promenade is open; the Boat deck's houses are narrower than her beam; the wreck's superstructure was stripped on the way down.
5. **Untuned, from a release under water at the record's trim:**
   - the bow lands 821 to 936 m from the point under the break (the survey: 772), and the stern 82 to 138 m (148);
   - her weight's lever, the one fitted number (D49), moves −0.32 m for the bow and +0.40 m for the stern, against a limit of 3 m [M: Z1].
6. **Handed over at the surface, the stern is robust and the bow is not** [M: Z1; nine moments from T 155.25 to the flag, cut at x −23].
   - The stern lands 82 to 152 m from the break point. It is upright from every moment up to T 156.75, and upside down from T 157.0 and from the flag, where it inherits the core's 80 degrees of list.
   - The bow lands 1,279 to 1,562 m off, twice the survey. Its bearing swings forward, aft or sideways with the quarter-minute. Freed at the surface it stands on its nose within 10 s, and which way it tips decides the rest.
   - Handed over at the onset itself (T 155.01, step 37202), the result holds whether the cut is at the onset's own x −10.93 or at −23 [M: Z1, e61 and e62 with `--cut`].
     - Both pieces land upright.
     - The stern rests about 145 m aft and is under in 52 to 56 s.
     - The bow lands 1,367 to 1,484 m dead ahead.
     - The cut's place moves the bow about 120 m; the air decides the rest.
7. **The air is the lever** [M: Z1, the bow from T 155.5 three ways]:
   - With its air removed at the hand-over, the bow never stands up. It is flat within 30 s and lands 724 m dead ahead, upright, untuned (792 m from T 156.0).
   - With the engine's one lumped pocket it dives nearly end-on at up to 31 m/s and lands 1.47 km off.
   - The pocket is about what floats her: with the vent shut she floats on end from T 156.0.
8. **One pocket cannot give both pieces** [M: Z1, the cut as a vent]. Letting the air out through the torn section (758 m²) lands the bow 737 to 808 m dead ahead, and the pair 679 to 763 m apart (the survey: 689). But the freed stern settles back cut end up, and its one pocket empties in 9 s, where the witnesses saw 1.5 to 3 minutes. No smaller opening gives both.
   - The stern's air must be held space by space, behind its bulkheads: the open engine room floods first, pulls the cut end down and stands it up, while the spaces aft keep their air.
   - **That is Z6, now designed** (`DESIGN_free_body_air_by_space_v1_2026-11-20.md`): the core's 64 spaces cut at the break, each with its water and air, its openings from the core's own table plus the cut, exchange laws that know which fluid is on each side (Wallis's limit for counter-flow), failure heads from R6 4.3 as events with Δp·V.
   - Size L: about 1,000 to 1,400 lines and 400 of trials, two to four days. No fitted number moves.
   - Its largest doubt is how the torn section passes air and water at once: between "two openings" and "counter-flow" the bow moves from about 740 to about 1,000 m.
9. **The hinge (B4) and Z6 are one piece of work.** While the bow hangs by her bottom, the tear vents its after spaces. Once Z6 removes the air as the confounder, the bow's distance tests the hinge:
   - let go at once: about 750 m;
   - let go standing: about 1.4 km;
   - the survey's 772 m speaks for an early release.
   - The stern's minutes test the torn zone's length. Reaching past bulkhead K, it opens the engine room from the first second, as on the wreck.
10. **The machine:** five sessions' gates ran at once this morning, and two browser suites timed out under the load. One session at a time now runs browser suites or a full gate (`C:\temp\titanic-browser-turn.txt`), and nobody stops another session's process.

## 2. What is not changed

v2's physics (its section 4), the contract's fields (5.1, now v: 2), the rules (5.5), the tests (6) and the research (R5, R6) stand. So do the break's design, with v2's seven changes to it (v2 5.6), and D36 to D49. D49, the lever as the one fitted number, has been used once and passes.

## 3. The order of work now

| Step | What | Who | Cascade | Waits on |
|---|---|---|---|---|
| 1 | Commit 1 (S1, the redrawn ship, the Carpathia search's v2), commit 2 (the User Guide 1.4), commit 3 (the descent, break and wake notes) | the mainline | made, by S1 | **done 2026-11-20 09:48 as `de74ca4`, `700f543`, `dfd3970`.** Rewritten at about 10:20, before the push to origin, as `8c7142e`, `5279f41`, `a221c43`. The rewrite took out two overlay pictures that reproduce Encyclopedia Titanica's drawings and reworded one line that the leak scan hit; it changes no code, so measurements on `dfd3970` hold for `a221c43` |
| 2 | The lanes rebase onto `dfd3970`, each running its own suites on its turn. The coordinator then merges them, in the order the review Bo forwarded asks for (the page's lanes first: the wake, T1, Z2, then B1+B2, then Z1), onto one joining branch and runs ONE full gate. The BACKLOG rows go in with them | each lane; the coordinator | none: each lane leaves every fingerprint as it was | **done 2026-11-20, 13:30 CST.** Joined on `wt/join` with `--no-ff` (the wake, T1, Z1, Z2, B1+B2, and four follow-ups the joint gates called for); joint gate 3 passed 34 of 35, and `director_site` alone after its test's fix (G4); `main` fast-forwarded by the coordinator (D58) |
| 3 | Z3, the join: the engine in place of Z2's stub; the clock after the hand-over in `core/night.js`; the readers stepped past it; the card's lines. Not new physics | Z1's session (its design is being written) | per D54 | step 2 |
| 4 | **C3**: the core makes a little water (1.8 m³ on the 1912 run), a fault of conservation, mended before any new physics, as the review asks | the mainline | small, if any | Bo's pick |
| 5 | **The lists and her last minute (W6, Z9)**: about 1 degree to starboard early where the record has 5, and the roll to the clamp after trim 20 | the mainline | yes | Bo's pick |
| 6 | Z6 inside B4: the air space by space, the hinge and the tear, on the free body; then the break into the watch | a new lane | one, for the break | steps 3 to 5; Bo's pick |
| 7 | The wake's K4, after the join | its session | none | Bo: "yes K4 next after the join" |
| 8 | Z5 (the bed takes her), Z7 (the debris field), Z8 (other seas) | | none | Bo |

## 4. Decisions needed (who decides)

| | Decision | Pick | Who |
|---|---|---|---|
| D52 | The superstructure's share of the water's push in the fall | **Decided by Bo, 10:12 CST ("Yes to both"): none.** The hull's own section, with the tiers' weight, solids and water kept; item 4's reasons. | Bo |
| D53 | Trial 6, the time to the bed, against the reconstructions' 4.5 to 7.0 min | **Decided by Bo, the same answer: a CHECK, the band unchanged.** R5 calls those times reconstructions and says to check against them (its 10d, item 10). The miss of 8 to 11 s stays printed. | Bo |
| D54 | Where the join (Z3) hands her to the free body | **Decided by Bo, 10:30 CST ("yes to both, proceed at your best recommendation"): (c)**, below. Z3 also carries 'onset' as a what-if, which leaves the default's bits untouched (Z1's design of Z3) | Bo |
| D55 | Z6 inside B4, size L, two to four days | **Decided by Bo, the same answer: yes, after Z3 and after C3 and the lists** (section 3). It is what the bow's place and the stern's minutes wait on. | Bo |
| D56 | A backup of the repository today: `main` is 43 commits ahead of `origin` | **Decided by Bo, 10:00 CST: "Bundle it locally".** Made at 09:59: `C:\code\titanic-sinking-simulator-backups\titanic-sinking-simulator_2026-11-20_0959.bundle`, every branch, verified. It sits on the same disk, so it guards against a bad git command but not against the disk; the lanes' uncommitted work is not in it. Pushing stays Bo's call | Bo |
| D57 | The wireless lane (W11, `wt/ether`), two of three steps built and untouched since 18 November | **Decided by the coordinator on Bo's standing word (10:35 CST: "for everything else you can decide on my behalf ... i'm fine with either /any choices"): parked.** Its uncommitted work is committed on its own branch as `7e630a3`, its tests marked unverified, so the backup holds it. It waits for Bo to take it up again | the coordinator, for Bo |
| D58 | Who moves `main` to the joined lanes (step 2's "his go") | **Decided by the coordinator on the same standing word: the coordinator fast-forwards `main` to `wt/join` once the joint gate passes**, then bundles again. Pushing stays Bo's: it needs his own sign-in | the coordinator, for Bo |
| D59 | The two browser suites that read the page after the flag as it was before the fall (`sound_site`: "she founders: the page stops"; `night_end_site`: the card's second line, which the deep part fills once the bow rests) | **Decided by the coordinator, on Z2's reading of every browser suite: until Z3 they set the engine aside once the page has loaded** (one line each, Z2's patch). Their assertions are about the night up to her foundering, and the fall after it is `deep_site`'s. Z3 brings them back onto the real engine | the coordinator |
| D60 | W7c, "which moment breaks her", left for Bo since 17 November | **Decided by the coordinator on Bo's standing word, at B1+B2's suggestion: closed as computed, not chosen.** B1 computes her capacity at every station from the scantlings (5.31 GN m hogging amidships, 4.94 over the third funnel's uptakes; the aft joint cuts nothing at or below B deck), and B2's onset marks where her own loads reach it. Nothing is tuned to move it (risk 1, below) | the coordinator, for Bo |

D54's three ways:
- **(a) At the flag, as built.** No cascade: no fingerprint, wreck position or fit moves. But the stern starts on the core's 80 degrees of list and lands upside down, and the bow lands about 1.4 km off. Both shown as known faults, with the break taken at the flag as an interim rule.
- **(b) At the onset, now:** the break by her own loads, cut where B2 says. The stern lands upright. But the watch's end moves earlier: with today's stand-in air the stern is gone about 50 s after the break, so she is gone near T 156.3, against the record's T 160 and today's flag at T 157.2. The boats, the wreck's place, the reports and the Carpathia search are refitted for that, and refitted again when Z6 lands.
- **(c), my pick: (a) now, then the break with Z6 and B4 in ONE cascade.** The pool is gone with Z3, at no cost to anything fitted. The dynamic break is already on the page as B2's mark on the girder's gauge, "she would break here, now". It lands complete, with the air that sets its minutes, once, rather than twice.

## 5. Risks

- **The onset's place.** On `a97a6bd` B2 puts the break at x −10.9, outside the record's band, because the demand peaks amidships and the computed strength falls off too slowly aft. If the tiers do not move it into the band, the place stays a finding. No element is to be tuned to move it (the break design, 4.2; v2 5.6, item 6).
- **The core's last minute.** The roll still runs to the clamp after trim 20. Any hand-over after T 156.75 inherits it, and so does the flag.
- **The cut's exchange law** (Z6's first doubt) decides the bow's place to within about 250 m.
- **The stand-in vent has a units slip** (found by Z1 while designing Z6). It reads the core's top-deck opening, a weir crest in metres (`fOpen` × length), as an orifice's area in m². So every minute afloat in items 6 and 8 is the stand-in's, not physics. Z6 retires the stand-in; the code is left as it is until then, and the slip is logged in Z1's lane report.
- **Five sessions, one machine, one checkout.** The joins rebase onto a moving main. Every lane's `site/app.js` edits must be merged by hand, never `dist/`.

## 6. Sources

- **The mainline's measurements:** `docs/research/experiments/results_2026-11-19/e30_last_minutes_on_the_mainline_working_tree_1440.txt`, and its message of 20 November with its events list.
- **Z1's tables of 20 November**, in the app's shared notes folder for this session. They land in the repository with Z1's lane as `docs/research/experiments/e60` to `e67`, which reproduce every number below, with outputs in `results_2026-11-20/`: e60 the trials both ways, e61 the three moments, e62 the nine-moment sweep, e63 the bow three ways, e64 the cut as a vent, e65 its rates, e66 the step's cost, e67 the spaces at the hand-off.
  - `Z1_dry_run_on_the_tiers_2026-11-20_0830.txt` (share 1) and `..._hull_sections_...` (share 0);
  - `Z1_handoff_three_moments_share0_...` and `Z1_handoff_sweep_share0_...`;
  - `Z1_bow_three_ways_share0_...`;
  - `Z1_cut_as_vent_share0_...` and `..._rates_...`, with the what-if's patch.
- **The lanes' reports:** `LANE_REPORT.md` at the top of each lane's worktree, and copies in the notes folder.
- **Z1's design for Z6:** `Z1_design_Z6_air_by_space_2026-11-20.md` in the notes folder, to land as `docs/DESIGN_free_body_air_by_space_v1_2026-11-20.md`.
- **Not checked by this session:** the lanes' numbers are their own runs, read in their reports and messages and not rerun here; B1+B2's onset on the tiers was not in when this was written.
