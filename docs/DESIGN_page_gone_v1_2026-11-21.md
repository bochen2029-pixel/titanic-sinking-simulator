# DESIGN: the page knows she is gone by one gone(sim), so that the onset hand-over can be shown (QC B-4, v1, on paper)

- **Written:** 2026-11-21, 02:05 to 02:06 CST, by Z2 ("Titanic Z2: the deep", session 66ad9a8d, Opus 5.5), at the
  coordinator's word: "Then B-4's gone(sim) on paper, unbuilt, as you proposed." Docs only: no process was run.
- **Status:** on paper, unbuilt. It is built when the mainline takes up the onset hand-over (G12's first option; join 7
  fixed the upside-down bow with QC B-1's line instead). Nothing here is decided.
- **Supersedes:** nothing.
- **Lineage:**
  - QC_B_fall_and_z2_fix_2026-11-20.md, B-4 ("The page knows she is gone by `sim.foundered` alone; `Night.over` is
    headless only");
  - QC_00_SYNTHESIS, item 8 ("B-4 `gone(sim)` on the page | Z2 | when the onset hand-over is taken up");
  - `core/night.js` 298-299 (`Night.over`) and 182 (`handover: 'onset'`), on `wt/join`.

## The answer in one paragraph

The page asks "is she gone?" 44 times, each time as `sim.foundered`. On a watch made with the onset hand-over that flag
is never set. The watch would step on for ever:
- no end card, and no "On the bed";
- the walk and the director's last hold never end;
- the fall is carried by the night's reader without the page's in-between frames.

One function answers it instead: `gone(sim)`, the night's own `Night.over` on a watch, the flag on a preset. A second,
`goneAt(sim)`, says when and why: the flag's time, or the onset's, with where she breaks. The moment fires one event,
`gone`, with `foundered` kept beside it for one join as the flag's alias. Each of the 44 uses is sorted below by what it
asks.

With the flag, the default, nothing changes: `gone` is the flag on every run the page makes today, so every suite stands
as it is. Only the what-if adds rows. A watch is made with the onset hand-over through a test hook on `loadNight`, and
offered to the player only once the mainline picks it.

## 1. Today (read in Z2's worktree at de1cd20, and `core/` on `wt/join`)

- **`sim.foundered`, 44 uses in `site/`:**
  - `site/app.js`: 32;
  - `site/worker-glue.js`: 2;
  - the parts: 10 (`30_sound` 1, `40_night_end` 1, `60_reports` 3, `70_help` 2, `76_walk` 2, `80_director` 1).
- **The moment** (`app.js:3290`): on the step where the flag is set, the page gives the toast, redraws the bulkhead
  table, fires `event` `foundered`, and begins the fall on a preset. Three parts hear `foundered`:
  - `40_night_end.js:156`, the end card;
  - `80_director.js:273`, its last hold ended;
  - `60_reports.js:244`, its words in the bridge's view.
- **`Night.over(sim)`** (`night.js:299`): `!!sim.foundered`, or, under `sim.night.handover === 'onset'`, the onset that
  B2's reader found (`sim.onset.found`, with its step, time `t`, place `x`, `where` and `sense`; `onset.js:107`). Past
  it, a watch steps on with its clock, its due orders and its readers only (Z3). The forecast's run stops at it already
  (`night.js:368`).
- **Under the onset hand-over the page goes wrong** (QC_B, B-4):
  - the step loop's gate (`app.js:3258`, `S.playing && !sim.foundered`) never closes, so the page keeps stepping the
    watch;
  - so the fall's own turn (`app.js:3293`, `falling()`, `fallSteps` with its in-between frames, 2945-2960) never comes;
  - `foundered` never fires;
  - `pace()` (3250) never stops.

## 2. The design

### 2.1 One question, one time, one cause (`site/app.js`)

```js
// she is gone: on a watch the night's own answer (Night.over: the core's founder flag, or under the 'onset' hand-over
// the onset B2's reader found); on a preset the flag (a preset has no hand-over of its own)
const gone = (sim) => !!sim && (sim.night ? NT.over(sim) : !!sim.foundered);
// when, and why: the flag's time, or the onset's (with where she breaks, onset.js's describe)
const goneAt = (sim) => !gone(sim) ? null : (sim.foundered ? { t: sim.founderT, why: 'flag' }
  : { t: sim.onset.found.t, why: 'onset', where: sim.onset.found.where, sense: sim.onset.found.sense });
```

Both are on `TitanicApp` for the parts (`gone(sim)`, `goneAt(sim)`), and parts never test the flag again.

### 2.2 The moment (`app.js:3290`)

On the first step where `gone(sim)` holds:
1. the toast: the flag's words as now; the onset's from `onset.js`'s `describe` ("She breaks at 2:18 am, 2 h 38 min
   after the touch, at boiler room 1, hogging: the hand-over at the onset of her break, a what-if");
2. the bulkhead table, as now;
3. `fire('event', 'gone', goneAt(sim))`, then `fire('event', 'foundered', sim)` when the cause is the flag (the alias, for
   one join);
4. `fallBegin(sim)`, as now: on a watch the night's reader begins the fall on its next step.

The three parts move from `foundered` to `gone`. The card, the director and the reports each take the cause for their
words.

### 2.3 The 44 uses, by what they ask

| What the use asks | Uses (`app.js` unless named) | Becomes |
|---|---|---|
| Is the model still stepping? (the loop, the pace, play and pause, the fall's turn) | 3250, 3251, 3258, 3290; 2935 (`falling`, which 3293 reads); 1992, 1993 | `gone(sim)` |
| May an order be given? (helm, telegraph, doors, pumps, the plant, takeOver; the reports' and the help's orders) | 1849, 1862, 1868, 2097, 2108, 2406, 2450, 2504, 3360; `60_reports` 133; `70_help` 93 | `gone(sim)` |
| What do the readouts say? (the draft, the pill, the watch's states, the roar; the reports' and the help's states) | 2227, 2231, 2235, 2264; `60_reports` 157, 193; `70_help` 77 | `gone(sim)`, with `goneAt`'s cause for the words |
| Is she still alive to a part? (the sound, the walk, the director's pace, the card's verdict on a clear watch) | `30_sound` 106; `76_walk` 343, 376; `80_director` 205; `40_night_end` 166 | `gone(sim)` |
| Drawn between steps (`S.acc`'s lag while she floats) | 873, 2844, 2853 | `gone(sim)` |
| Funnel 1's fall at the surface (G15) | 682 | `gone(sim)` |
| The forecast, a run ahead | 1717, 1731, 1736, 1737, 1746, 2696; `worker-glue` 19, 24 | the forecast's own answer: `over` and `overT` beside `foundered` and `founderT`, and the line's words by the cause (2.4). The worker's watch forecast stops at `Night.over` already; its result must say which |
| The old slide, with no fall engine | 3294 | unchanged: presets only, so the flag |
| The baked validation (`VAL`) | 2724 | unchanged: not the live run |

That is 7 + 11 + 7 + 5 + 3 + 1 + 8 + 1 + 1 = 44.

### 2.4 The words (the page's, so public: the coordinator's, and Bo's)

- **The end card,** under the onset: titled "She broke", not "Foundered". Its first sentence: "She broke at [time],
  [h min] after she touched the ice, at [where], [sense]: the hand-over at the onset of her break, a what-if". The
  record's line ("went down 2 h 40 min after the collision") and the rest stay as they are. The deep's lines (a piece
  at rest) follow as now.
- **The readouts' pill:** "Breaking" on the hand-over's step, then "Falling" and "On the bed" as now.
- **The forecast's line:** "Breaks at [time], [h min] after the touch" when the forecast's run ends at the onset.

### 2.5 A watch with the onset hand-over (the test hook)

- `TitanicApp.loadNight(seed, { handover: 'onset' })` passes it into `NT.create`'s options (`night.js:182`). It is not a
  control on the page: an address parameter (`&handover=onset`) only once the mainline picks the onset for G12.
- The forecast's copy carries it, since `sim.night.handover` is plain data in `sim.night`, so the worker's forecast stops
  at the onset too.

### 2.6 The rows that prove it

**A new session in `night_end_site`:** the 1912 watch, the 1912 orders, `handover: 'onset'`. Held on the step where
`Night.over` first holds, with `sim.foundered` false:
- the end card shows the onset's words;
- the pill reads "Breaking";
- a helm click gives no order (the log is as it was);
- the walk is refused;
- the director's last hold has ended;
- played on, the fall runs through `fallSteps` (its in-between frames: `fall.prev` set) to the bed;
- "On the bed";
- the fingerprint at the bed is the hand-over's, as `night_after_tests` holds headless.

**Everything else as it is:** with the flag, `gone` is the flag. night_site's fingerprint and table, night_end_site,
deep_site, walk_site, director_site, reports_site, help_site, sound_site and systems_site pass unchanged. That takes a
full gate.

## 3. When, and its size

- **When:** the mainline takes up the onset hand-over for G12. Until then the page's flag is right, because no watch it
  makes uses the onset.
- **Size:** about fifty small edits (the 44 uses, the moment, the event, the hook, the words) in `site/app.js`, six parts
  and the worker's glue. One full gate; a browser turn for night_end_site's new session.
- **Owners told before their files are touched:**
  - `30_sound`, `60_reports` and `70_help` (their lanes);
  - `80_director` (the mainline, Z1, the wake);
  - `40_night_end`.

## 4. Decisions needed (who decides)

1. **The words** (2.4): the coordinator; Bo, for the public text.
2. **The event:** one `gone`, with `foundered` kept as an alias for one join (recommended), or `foundered` renamed at
   once. The coordinator decides.
3. **The forecast's result:** `over` and `overT` from `Night.forecast`'s result (`night.js`'s forecaster, the
   mainline's and Z3's). The page needs them to say "Breaks at". The mainline decides.

## 5. Risks

| Risk | What answers it |
|---|---|
| A use read as "gone" that meant "the flag's time" | 2.3 sorts every use. Times go through `goneAt`, never `sim.founderT` directly |
| Parts of other lanes change | Each owner is told first. With the flag, their suites must pass unchanged |
| The onset found but the flag later set too (she founders after the hand-over) | `goneAt` takes the flag only when it is the cause. Under the onset, `Night.over` holds from the onset on, and the watch's model stands still past it, so the flag is never set (Z3) |

## 6. Sources

**Read:**
- `site/app.js` (2925-2960, the fall's turn; 3244-3300, the pace and the loop) and every use of `.foundered` in
  `site/` (a grep: 44);
- `site/worker-glue.js` (1-30);
- on `wt/join`: `core/night.js` 165-182 (`create`, `handover`), 298-302 (`over`), 368, 391-421 (the forecast), and
  `core/readers/onset.js` 13-19, 85-110 (its state and `found`);
- QC_B's B-4 (76-85).

**Not checked:** how the forecaster's result is built inside (`night.js` 403-421 read only for its names); the
words' fit on a phone's card.
