# G7's ladder: the forepeak's tank, G11's widths and G6's switch, one rung at a time (v1.1)

- **Written:** 2026-11-21 00:20 CST (clock), by the mainline session ("Titanic simulator model accuracy", Claude Code
  74cc0d65, Opus 5.5), at G7's landing on wt/g7 for join 7.
- **Status:** a result. Rung 2b lands (the coordinator, 00:0x CST: "Rung 2b is approved, as you propose").
- **Supersedes:** `RESULT_G7_ladder_v1_2026-11-20.md`, which stays as written. Its sections 2.1 to 2.4 (which change
  moved what, rungs 0 to 3) still hold. Its answer and its rung 2 do not: rung 2 does not land (section 2 below).
- **Lineage:** v1; the coordinator's messages of 23:4x to 00:0x CST (G18, rung 2b); BACKLOG G18 (join 7's papers);
  `tools/calibrate.js` (watchFounders); e92's results for rung 2b and rung 2b as landed.

## Changes in v1.1

- **G18, found at the landing.** The 1912 watch is bimodal at the bit level. Rung 2's numbers, as they landed, put her
  founder on the watch at T 156.60, outside D73's band. The 157.95 of v1 was the other branch.
- **Rung 2b replaces rung 2.** The refit holds both branches inside the band, and lands with a margin.
- **The validation table and the forepeak's numbers** are those of the landed numbers.
- **v1's vent numbers came from a watch run with join 6's area constant**, because e92's forepeak check reads
  encounter.js's alpha. The landed ones are in section 4.

## The answer in one paragraph

The tank alone delays her end by about seven minutes, which a refit takes back (v1, sections 2.1 and 2.2). G11's
widths cost the fit nothing. G6's switch, off, moves no bit. The landing found a knife edge in the plant's doctrine
(G18). At pumpOwn + 30 min the engineers decide once whether to lead more pumps to boiler room 4 through the main.
At G7's numbers that room sits on the decision's threshold at T about 105, so a last-bit change moves her founder on
the watch by about 1.35 min. Rung 2b holds both branches inside the band:
- the numbers: the opening 0.8196 m² (8.82 sq ft, landed 0.13 % below the refit's 0.8207), wMul 1.1 on its bound,
  aDown 0.2786, fOpen 0.02087, J 8.23;
- the founders: the preset at T 158.28, the watch at T 158.95 as it is, and T 157.16 with no pumps led through the
  main at all.

Every binding verdict is kept, the D deck's among them (2h46m). The bulkheads to B deck now founder at 5h20m, which
agrees with Wilding; they are reported, not binding.

## 1. The rungs

| Rung | What changed | Opening m² (sq ft) | wMul | aDown | fOpen | Founders: preset; watch as it is, no pumps led | J |
|---|---|---|---|---|---|---|---|
| 0 | join 6 (17712b2) | 0.7853 (8.45) | 1.1 | 0.2647 | 0.02189 | 157.33; 157.03 | 7.92 |
| 1a | the tank, join 6's numbers | 0.7853 (8.45) | 1.1 | 0.2647 | 0.02189 | 164.22; 164.45 | 18.85 |
| 1 | the tank, refitted | 0.8266 (8.90) | 1.1 | 0.2544 | 0.02277 | 157.03; 157.84 (v1) | 6.71 |
| 2 | with G11's widths, refitted | 0.8286 (8.92) | 1.1 | 0.256 | 0.0214 | 157.13; 156.60 landed (157.95 in the refit), 155.95 | 6.67 |
| 2b | rung 2 refitted with both branches held (G18) | 0.8207 (8.83), optimum | 1.1 | 0.2786 | 0.02087 | 158.09; 158.78, 156.96 | 8.02 |
| 2b, landed | the opening 0.13 % below the optimum | **0.8196 (8.82)** | **1.1** | **0.2786** | **0.02087** | **158.28; 158.95, 157.16** | **8.23** |
| 3 | G6's switch present and off | rung 2b's, to the bit | | | | | |

- J is the preset's score as `tools/calibrate.js` reads it (D69 (4): no more than 11.27).
- The watch's term in the refit is taken on the run with no pumps led (0.50 at the landing).
- The refit itself scored 7.96 at its unrounded optimum, with the run with no pumps led at 157.01, on the band's wall.
  Rounded, that run founders at 156.96. The opening was then scanned at 0.8207, 0.8204, 0.8200, 0.8196 and 0.8192.
  The run with no pumps led founders at 156.96, 157.04, 157.09, 157.16 and 157.21 there, and J is 8.02, 8.06, 8.18,
  8.23 and 8.37. 0.8196 is the first with a margin well over QC A-3's noise floor (about 0.06 min for a last-bit
  change).
- The moves against D69's base at the landing: wMul +6 %, aDown −1 %, fOpen +1 %, each within half.

## 2. G18: the watch's two branches

**What decides it** [measured, wt/g7]. `core/systems.js:298-310`: at its own pumps' time plus `PLANT.pumpLent` (30
min) the engineers lead pumps standing in dry rooms to a flooding room through the bilge main. They do it once: the
flag `pumpLed[k]` is set before the check, and if `roomLost(sim, k)` holds at that instant, the room never gets them.

**Where it bites.** On the 1912 watch at G7's numbers, boiler room 4's own pumps go on at about T 75, so the decision
falls due at about T 105, with the room on `roomLost`'s threshold.
- Two watches at rung 2's numbers, alphas 2.6e-5 apart, agree within 2 m³ of water until T 105.
- Then one leads the pumps (T 105.23) and founders at T 157.95. The other never does and founders at T 156.60.
- On the landed tree, alpha ± 2e-14 is enough: 156.597 against 157.947.
- Over alpha × (1 ± 1e-6, 1e-4, 1e-3) both branches turn up with no order.
- The later lead to boiler room 3 (T about 137) is worth another 0.65 min.

**What the fit does about it (rung 2b, `tools/calibrate.js`).** `watchFounders` runs the watch as it is and with
`Sys.PLANT.pumpLent` set to Infinity, in the tool only.
- D73's term is taken on the second; the band is held on both.
- The second run is the never-led branch with boiler room 3's lead also off. So it lies 0.65 min below the true
  never-led branch, a conservative bound.
- At the landing the true branches are about 157.8 and 158.95, and the bound is 157.16. The frozen fingerprint (1a1bd179,
  founding at 9,597.25 s) is the 158.95 branch. e92 prints 158.96 for it, because it takes calibrate.js's own fixed
  point of the area constant, a last bit away from encounter.js's.

**What stays open.** The doctrine's knife edge itself is BACKLOG G18. The coordinator's test, and the epoch's
robustness ensemble (QC), will list it first. Its fix belongs to the calibration epoch, since it is physics. Until
then a last-bit change anywhere, U0's E2a included if it moved a bit, flips the watch between its two branches.
Both are now inside the band.

## 3. The validation table under D75, as refined (the landed numbers)

| Case | Record | Binds | Join 6 | G7 landed (rung 2b) |
|---|---|---|---|---|
| Titanic 1912 (calibrated) | 2:20 am (band 157 to 160) | yes | 2h37m | 2h38m (T 158.28) |
| Four forward compartments | Wilding: floats | yes | floats, 2.04°, 0.96 m below D's top | floats, 2.06°, 0.94 m below D's top |
| Five forward compartments | Wilding: sinks | yes | 2h14m | 2h28m |
| Olympic and Hawke, 1911 | reached port | yes | floats, −0.74° | floats, −0.74° |
| Britannic 1916, approx. | about 55 min | yes | 0h49m | 0h49m |
| Britannic, ports shut | floats | yes | floats, 8.53° | floats, 8.01° |
| Without the BR5 seam | Wilding: sinks, slower | yes | 3h08m | 3h11m |
| Stopping at hold 3 | floats | yes | floats, 2.04° | floats, 2.06° |
| Bulkheads to D deck | Wilding: no help | yes | 2h46m | 2h46m |
| Bulkheads to B deck | Wilding: still sinks; Britannic's claim: floats | no | floats, 8.53° | 5h20m |
| Doors left open | debated | no | 2h51m | 2h50m |

The papers' wording for the B deck, from the coordinator's (rung 1's 5h16m then): "On the B-deck what-if she now
founders at 5h20m (about 5:00 am), about an hour after Carpathia's arrival (about 4:00 am; her first boat taken up at
about 4:10). Before G7 she was afloat at the 8-hour check, at 8.5 degrees by the head. This now agrees with Wilding
("still sinks"). It is reported and does not bind the fit, because its sources disagree."

Other numbers at the landing:
- 16,000 tons aboard at 75.0 min (12:55; Wilding assumed 40 min);
- water over bulkhead F at 12:57 (Wheat: 12:55);
- the bridge under at 2:16 (the record: 2:15);
- the forward dome gives way at 2:17;
- foundering at 2:18;
- the pumps as worked are worth 3.7 min (479 t pumped), and every suction at its limit, never abandoned, 19 min (e22,
  not written);
- her list on the preset: 3 to 8 degrees to port from T 85.

## 4. The forepeak and its vent (the landed numbers, the watch)

- the forepeak's own space dry above the orlop for the first ten minutes (0.000 m³ by T 10; the Report);
- the tank (323 m³) full at T 22.1;
- water up its vent from T 22.3, 14.40 m³ by T 30, after Hemming found the stores dry soon after the jar.

The vent's area (0.008 m², a 4-inch pipe) is a bet.

## Decisions taken, and needed

- **Taken:**
  - rung 2b (the coordinator, 00:0x CST), including its two conditions: the never-led run as the bound, and both runs
    in the band;
  - G18 into join 7's BACKLOG;
  - the doctrine's fix in the epoch, not here.
- **Needed:** none for G7.

## Risks

- **G18.** Any last-bit change flips the watch's branch. The fit keeps both inside the band, by 0.16 min at its
  lower edge.
- **wMul is on its bound** (QC E-2: the epoch frees it).
- **syncMass leaves the tank's water out of her mass under way** (about 330 t from T 22; QC A-6). This is the epoch's.
- **The vent's area is a bet.**

## Sources

e92's results (`docs/research/experiments/results_2026-11-21/e92_g7_ladder.txt`, rung 2b and rung 2b as landed);
the scan of the opening and the branch probes (scratch scripts of the mainline, their outputs quoted here);
`core/systems.js:298-310` (read); e22 (run at the landed numbers, not written); v1 for rungs 0 to 3.
