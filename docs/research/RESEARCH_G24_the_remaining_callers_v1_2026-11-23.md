# G24's remainder: the callers of C.halfBreadth without the ship's hull (v1)

**Written:** 2026-11-23 18:44 CST, the U0 lane (Claude Code 07ff25ee, Opus 5.5), at the coordinator's ask of 18:41:
"G24's REMAINDER: the encounter, motion, scenarios and the people reader still call C.halfBreadth without ship.hull.
For each: pass ship.hull, or show with a test row that it only reads below 11.0 m, where the two agree. Tests and a note
first; any edit to core/encounter.js or core/motion.js goes to the mainline as a patch for its word."
**Status:** findings and proposals. The test is `tools/g24_callers_tests.js`; no file of core/ is changed here.
**Lineage:** G24 in the BACKLOG; its export and STL half (U0, a4e8c0d and 2a9f79e) and its topsides half (Z2, 088fd31)
landed in join 16.

## The answer in one paragraph

Since the calibration epoch's landing her ends above 11.0 m are on (C3, `hullEnds` 1), and `C.halfBreadth` takes them
only through its third argument. A test that wraps it and watches every call made without a hull, on the 1912 watch, five
drawn nights and every preset, finds: the encounter and motion read only at or below 11.0 m on every watch, so they agree
with the hull to the bit; core.js's two pockets too. Three things read above it: a hole the player makes above 11.0 m (its
normal in `seaHeads`, 0.39 degrees off at E deck's ports forward), Britannic's open ports (9 of 27 placed up to 1.04 m
inside her hull), and the people reader's boat stations (16 of 20 up to 0.37 m inside the Boat deck's edge, which the
drawn ship now has with her ends). The first two are core's: patches below, for the mainline's word. The third is a
reader's: U0 mends it.

## What each caller reads (measured, `tools/g24_callers_tests.js`)

| Caller | What it reads | Seen | Verdict |
|---|---|---|---|
| `core/encounter.js:181` `bandStations` | her side at the berg's three bands, 5.75 to 7.75 m under her waterline | 38,754 calls on six watches (with :389 and :403-404), the highest z 5.07 m; none differ | below 11.0 m, by the bands' depths: a MUST row |
| `core/encounter.js:389` the ice's openings | the opening's place on her side, at its band's mean height | (above) | below 11.0 m: MUST |
| `core/encounter.js:403-404` the crushed bow | her side at z 3.0 m | (above) | below 11.0 m: MUST |
| `core/motion.js:398` `seaHeads` | the plating's slope at each hull opening, for its outward normal | 292 calls at the ice's openings, the highest z 4.19 m; none differ | below 11.0 m on every watch: MUST. A hole made by hand above 11.0 m (the page's hole tool) gets a normal 0.39 degrees off (x 95, z 16.99): a CHECK, patch A |
| `core/scenarios.js:91` `icebergDamage` | the 1912 preset's openings, 2 to 6 m up | none differ | below 11.0 m: MUST |
| `core/scenarios.js:101` `zoneHole` | the presets' holes at 3.0 to 8.0 m | none differ | below 11.0 m: MUST |
| `core/scenarios.js:160` Britannic's ports | about 25 open ports 1.1 m over F and E deck, z up to 15.17 m | 9 of 27 differ, the most 1.040 m (x 90.14, z 14.19) | above 11.0 m where her ends widen her: a CHECK, patch B |
| `core/readers/people.js:105` `STATION` | the Boat deck's edge at each davit, z about 26 to 29 m | 16 of 20 differ, the most 0.369 m (x 60.71) | above: a CHECK; U0 mends it (below) |
| `core/core.js:1424` `bunkerPocket`, `:1449` `peakPocket` | the pockets' capacities, from their floors to G deck and the orlop | the tops at 9.41 and 9.84 m | below 11.0 m: MUST |

## Patch A, for the mainline: `core/motion.js`, `seaHeads`' normals

```js
const hx = (C.halfBreadth(o.x + 0.5, o.z, sim.ship.hull) - C.halfBreadth(o.x - 0.5, o.z, sim.ship.hull)), nn = Math.sqrt(hx * hx + 1);
```

Every watch's openings (the ice's) lie below 11.0 m, so no watch's bits move: the 1912 watch keeps 48b71712, and the
headway reference and the seams gate (whose ship has `hullEnds` 0, `GATE_SHIP`) are untouched. Only a hole the player
makes above 11.0 m at her ends changes, by its normal. Its proof is the test's CHECK row turning green and
`astern_tests`, `night_tests` and `seams` unchanged.

## Patch B, for the mainline: `core/scenarios.js`, Britannic's ports

A preset's build has no ship. Two ways: the build takes the hull from the scenario's caller, or the scenarios take the
default ship's hull once (`C.buildShip().hull`, as `site/topsides.js`'s `useHull` does by default):

```js
openings.push({ x, y: side * (C.halfBreadth(x, z, defaultHull()) + 0.02), z, area: pt, kind: 'porthole' });
```

It moves the Britannic preset's openings' places outward by up to 1.04 m at her ends, so that preset's bits move a
little (its validation case, `tools/validate.js`). It is the mainline's to weigh with the validation table, or to leave
with this note as a named stand-in.

## U0's mend: the people reader's stations

`STATION` (the Boat deck's edge at each davit) is computed at load from the hull without her ends, while the drawn
ship's deck edge (`TS.deckEdge`) has them since Z2's 088fd31: 16 of the 20 boats stand up to 0.37 m inboard of the deck
they hang from. The mend: `STATION` from the default ship's hull, built once when first asked (as `site/topsides.js`
does), so it is the same object a page or a watch of the default ship carries. A reader: no fingerprint moves. What may:
each boat's drop to the sea (`o.drop`, the station's world height), so its lowering by a step or so; the record's boats
and the export's stations (pins rewritten as meant); the page's boats and davits, which stand on `STATION` (Z2's
`50_boats.js`, `site/topsides.js`). Its suites: `people_tests` (and `calibrate_people`'s constant, checked), 
`topsides_tests`, `export_tests`, and `boats_site` and `topsides_site` in a browser slot.

## Sources

- `core/core.js` `halfBreadth` (lines 669-675) and C3's `ENDS_READ`/`ENDS_BET` (the readings and the bets, z0 11.0 m).
- The callers as listed, read at main f3b2373.
- The measured rows: `node tools/g24_callers_tests.js`, 2026-11-23 18:4x CST on f3b2373 (9 s).
- Not checked: tools/ callers (they sample on purpose, e.g. `export_tests`' probe points), and site/ callers (G24's
  topsides half, Z2's).
