# DESIGN G27: the damage brush on a watch (a hole as a logged order, and the reports' second way in), v1

- **Written:** 2026-11-24 00:36 CST, by the mainline session "Titanic simulator model accuracy" (Claude Code 74cc0d65,
  Opus 5.5), at the coordinator's ask of 00:28 for Bo's wish (NH16): "punch a hole with the brush and watch the crew
  react".
- **Status:** a design for the mainline's build after join 19 lands; nothing built. Rides join 20 or 21.
- **Supersedes:** nothing. **Lineage:** fork 2's brief `BYOK_FORK2_g26_g27_what_the_crew_needs_2026-11-23.md` (notes
  folder); BACKLOG G27; the order rules of CLAUDE.md (every order through `Night.act`, logged, replayable; a part's
  orders through `TitanicApp.order`).

## The answer in one paragraph

On a watch the brush gives an order, `hole`. It does not call `C.addOpening` on the live sim, as it does on a preset.
`hole` is the model's own order (`Night.owns`): logged, replayed from a link, forecast. It is in no seat's remit and
never spoken: the bridge learns of the water only as the reports bring it. Its value is the hole's place on her shell,
`[x, z, side]`, and its arg the area. The model works out the shell point from her own half-breadth, so the order needs
no state and replays to the bit. One state-free bounds check, `Night.validHole(value, arg)`, serves both the model and
the page's address check. The reports reader gets a second way in: its routine starts at the first water found when no
touch has come. On the 1912 watch the touch comes first, so its reports are unchanged.

## 1. The order

- **Type `hole`, value `[x, z, side]`, arg `area`.**
  - x and z in metres, ship frame, rounded to 0.01 m before the order is given.
  - side is +1 (port) or -1 (starboard).
  - area in m2, rounded to 0.0001.
  - The page rounds, and the log holds exactly the numbers applied, so a link replays to the bit.
- **`Night.act`:** `y = side * (C.halfBreadth(x, z, sim.ship.hull) + 0.02)`, the shell's outer face as the presets'
  holes have it. Then `C.addOpening(sim, { x, y, z, area, kind: 'breach', label: 'a hole made by hand', tOpen: sim.t })`.
  `OWN.hole = 1`, so `Night.owns('hole')` is true and the page asks for a new forecast. The forecast's copy carries
  `sim.openings`.
- **`Night.validHole(value, arg)`** (exported). It needs no sim and no ship but the default's, and returns true only if:
  - value is an array of three finite numbers, side is +1 or -1, and area is in (0, A_MAX];
  - x lies inside her hull's 16 zones, 1 m clear of each end;
  - z is between her floor in that zone plus 0.25 m (the page's double-bottom rule) and E deck at x (`C.deckZ('E', x)`).
  A_MAX is the brush's largest, `holeFromSlider(100)` = 0.02 x 250 = 5.0 m2 (site/app.js); the suite holds the two
  equal.
- **The page's address check** (`site/parts/40_night_end.js`, `validOrder`): `if (type === 'hole') return
  NT.validHole(v, arg)`. A link whose log has a hole out of bounds is refused whole, as today.
- **A scrape** gives one `hole` order per puncture, on the step of each, up to the stroke's 80. A link holds at most 600
  orders (decodeLog), so about seven full strokes. v1 says so; a polyline order is the remedy if it binds.

## 2. The page

- `punchAt` and `scrapeAt` on a watch call `TitanicApp.order('hole', [x, z, side], area)`. On a preset they call
  `C.addOpening` as today.
  - It takes the watch over as the wheel does (Y8), and asks for the forecast.
  - The Damage tab's openings table lists the watch's holes from `sim.openings` as it does a preset's.
  - The page's own `validate` stays as the click's first check: missed the hull, above the water, a deck, the double
    bottom.
  - "Remove all openings" stays a preset's control. A watch's hole is history: hidden, or refused with a toast, on a
    watch.
- A hole may be made before the ice, or on a night that never meets it.

## 3. The crew: never spoken, learned by reports

- `hole` goes on `tools/crew_tests.js`'s list of types never spoken. The grammar has no phrase for it, no seat's remit
  holds it, and `parse(phrase(o))` is never asked of it.
- Fork 2's fog (`gather`, `site/parts/87_minds_words.js`) leaves `hole` out of "the orders the bridge knows were given".
  That is a one-line filter in fork 2's file; fork 2 reviews it.

## 4. The reports' second way in (`core/readers/reports.js`, the mainline's)

- Today the bridge's routine starts at the touch (line 538): `R.tTouch` set, the "felt" line, and the `UNASKED` tasks
  timed from it. On a night with a hole and no touch it never starts.
- v1: when no touch has come, the routine starts at the first step where water stands 0.3 m [bet] over the floor of any
  compartment's lower space, the depth at which the men in it would see it. That is a float's depth, and the same check
  as the doors' floats (`doorsStep`).
  - The first line is a report from that room ("Water coming in, boiler room 5, starboard side"), by the room's own
    route.
  - The `UNASKED` tasks are timed from that step, as they are from the touch.
- A later touch on the same night is felt and reported as today, but does not restart the routine.
- On the 1912 watch the touch comes first, so the reader's state is the same to the bit: reports_tests PASS with its
  table byte-identical.

## 5. What must hold (the build's rows)

- `tools/night_tests.js`:
  - the default 1912 watch's fingerprint is unmoved (0ae90224 at step 37,792);
  - a watch given holes at T+10 (a punch and a short stroke) replays from its log to the same fingerprint, every step;
  - `validHole` holds its bounds both ways (eight inside, eight outside);
  - a hole on a preset by the old path and by the order gives the same opening.
- `tools/reports_tests.js`:
  - the 1912 watch is unchanged;
  - a night holed before the bells starts the routine at the water, and its first report names the holed room;
  - a later touch on that night does not restart the routine.
- `tools/crew_tests.js`: `hole` is never spoken.
- A browser row (a small `brush_site_test.js` on the virtual clock, its own gate row):
  - the brush on a watch logs `hole` orders;
  - the forecast moves;
  - the link replays to the same fingerprint;
  - the Reports panel shows the water's report.
- The gate: night, reports, crew and the new row. `dist/` is built at the join.

## Decisions needed (who decides)

- The 0.3 m threshold [bet] and the first report's words: the mainline (the reports' owner).
- The fog's filter: fork 2.
- Whether a stroke stays as many orders or becomes one polyline order: the mainline, after v1's limit is seen.
- Where `brush_site_test` runs (alone, or paired on the virtual clock): the coordinator.

## Risks

- `core/night.js` changes, so the Carpathia search's progress name and the tables' `core` hash move at the join. No
  result moves, and the tables are rerun there.
- A hole above the waterline that later goes under: `validHole` allows up to E deck, as the core's lower spaces do. The
  page's click check keeps a player below the waterline at the moment.

## Sources

Read for this design: fork 2's brief; `site/app.js` 1642 to 1681 (`hullHit`, `validate`, `addHole`, `punchAt`,
`scrapeAt`); `core/core.js` 2163 to 2175 (`addOpening`) and 2184 to 2216 (doors and floats); `core/night.js` 149 to 152
(`OWN`, `owns`) and 207 to 245 (`act` and its orders); `site/parts/40_night_end.js` 24 to 51 (`validOrder`,
`decodeLog`'s 600); `core/readers/reports.js` 245 and 538 to 549 (the touch); `site/app.js`'s `holeFromSlider`
(5.0 m2 at its end). Read on join 19's tree (a8064eb) and the cascade branch before it. Not checked: fork 2's
`gather`.
