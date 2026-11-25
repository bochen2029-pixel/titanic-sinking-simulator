# K6: her bow wave against her plating becomes a law (Noblesse and others 2008), v1

- **Written:** 2026-11-20, 20:37 CST, by the wake lane (Claude Code, "Titanic simulator model accuracy (fork 2)", branch `wt/wake`).
- **Decided by** the wake lane and the coordinator, on Bo's word: "You can decide with coordinator, I advised I'm fine either way so it's up to coordinator and yourself".
- **Follows:** `RESULT_k6_wigley_benchmark_v1_1_2026-11-20.md`. Its section 5.6 found the fixed factor low for her, and its section 6 named this step.
- **What changes:** in `site/parts/24_wake_field.js`, `alongside` sets her drawn waterline's bow crest by Noblesse and others' relation, where a fixed factor (`CFG.bowPile` 3.5) set it before. The white water keeps its own factor, unchanged.

## 1. Why a law, not a new number

1. **The fixed factor did not draw what its comment said.**
   - The comment reckoned "3.5 times the field's 1.26 m at 22.5 kn is 4.4 m".
   - But the factor dies away over 22 m from the stem, and the field's own crest stands 15 m abaft it.
   - So the page drew her crest at 3.06 m, 11 m abaft her stem (`tools/wake_tests.js` row 14, before this change).
2. **No one factor suits every hull.** On the same field method at her length:
   - the Series 60 (a 7 degree stem) wants 3.69;
   - Wigley's hull (11.3 degrees) wants 2.76;
   - her stem, measured on Bob Read's plans at 21 to 24 degrees, wants about 7.
3. **The relation the factor was meant to stand for holds on both benchmark hulls:** within about a sixth, at ten Froude numbers (the Wigley note's sections 4.1 and 4.2).

So the relation is applied directly, and the factor becomes what it solves for.

## 2. The law

- **Z_b = (u^2 / g) min(2.2 tan a / cos a / (1 + u / sqrt(g T)), 1/2).**
  - Noblesse, Delhommeau, Guilbaud, Hendrix and Yang (2008), *J. Fluid Mech.* 600, eq. (4.1), capped at the stagnation height by its eq. (6.2).
  - u is her speed through the water, and T the draught of the wake's hull.
  - a is her waterline's half-angle at the stem: **21 degrees** (`CFG.bowAngle`) [measured: the lower bound read on Bob Read's plans of Olympic, CC BY-NC-ND 4.0, the Wigley note's section 4.5]. The model's hull has 16.6.
- **At each refresh,** `alongside` finds by halving, to 0.1 %, the factor that brings the highest crest of the field's within three reaches abaft her stem, on either side, to Z_b.
  - Only crests are piled up, the factor dying away over `CFG.bowReach` (22 m) [bet: the factor's shape along her].
  - The factor is capped at `CFG.bowPileMax` (12) [bet], for a field still too small to carry it.
- **Other hulls** (K6) give their own angle through `createWake`'s `o.bowAngle`. One without an angle has none piled up.
- **`alongside(W, n, out, o)`** takes `o.linear` (the field alone) and `o.pile` (a fixed factor), for K6's tools.
- **`bowCrest(W, u)`** is exported.
- **The white water's factor** is now its own, `CFG.bowFoam` 3.5, the value it always had [bet, set by eye].
  - The foam rows of `tools/wake_tests.js` are unchanged to the digit.

## 3. Results [M]

`tools/wake_tests.js`, all 42 rows PASS, two of them new:

| Her speed | The law's crest | Her drawn crest | The factor |
|---|---|---|---|
| 10 kn | 1.35 m | 0.73 m (the factor at its cap) | 12.0 |
| 14 kn | 3.16 m | 3.16 m | 9.5 |
| 18 kn | 4.07 m | 4.07 m | 8.2 |
| 22.5 kn | 5.67 m | 5.67 m, 8 m abaft her stem | 7.0 (6.95) |

- At 22.5 kn the field alone gives 1.26 m there.
- Below about 15.5 kn she is under the relation's regime boundary for her stem (its eq. 5.3), where no steady overturning bow wave exists. There the law's height is an upper bound, and the cap governs at 10 kn.
- **Through K6's tools,** at each hull's own angle (Series 60 7.0 degrees, Wigley 11.3) and at her length, the law's drawn crest over the tank's:
  - **the Series 60:** 1.01, 0.83, 0.90, 0.88, 0.86 and 0.83 at Fn 0.22 to 0.35 (pooled error 0.071, against the fixed 3.5's 0.060);
  - **Wigley's hull:** 1.01, 1.09, 1.02 and 1.17 at Fn 0.25 to 0.316 (pooled error 0.042, against 0.044).
  - The row in `wake_tests` takes one Froude number on each hull: 1.73 against 1.72 m, and 3.60 against 3.55 m.
- **`tools/kcs_compare.js` keeps the fixed 3.5:** the KCS's bulb is outside the law's range. It reproduces its notes' numbers to the digit.
- **Moved in `wake_tests`' table, as meant:**
  - row 14 itself: 3.06 m became 5.67 m;
  - two new rows (the speeds, the benchmark hulls);
  - three rows of section 14 that read the same sea against her plating, all still passing:
    - port against starboard on a straight course: 8.3e-7 became 1.9e-6 m;
    - the crests' spacing at 22.5 kn: 81 became 84 m;
    - the turn's difference between her sides: 0.36 became 0.51 m rms.

## 4. What the page shows

- Her drawn waterline at the bow (K4, `site/parts/26_wake_seams.js`) rises from about 3.1 m to 5.7 m at 22.5 kn. The night sea's slopes, which follow the field, do not change. Nor does the white water.
- `tools/wake_site_test.js` and its six pictures are run in a browser turn and looked at before they are committed.
- The User Guide catches it at version 1.6 (the coordinator).

## 5. Open

- **Where the crest stands.** The law draws her crest 8 m abaft the stem, where the field's shape puts it. Noblesse's eq. (7.1) puts it 4.3 m abaft, and the tanks' crests stand nearer the stem than the field's. A shorter reach would follow them (the Wigley note's 5.4).
- **Below 15.5 kn,** the unsteady regime: the law's height is an upper bound there.
- **The model's hull at the stem** (16.6 degrees against the plans' 21 to 24) is BACKLOG G10, for the hull's owner. The field itself is still made from the model's hull.
