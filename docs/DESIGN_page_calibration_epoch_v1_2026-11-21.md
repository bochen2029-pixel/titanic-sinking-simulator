# DESIGN: the page's side of the calibration epoch: the Evidence tab reads the ledger, and every verdict carries the kept set (v1)

- **Written:** 2026-11-21, 02:02 to 02:03 CST, by Z2 ("Titanic Z2: the deep", session 66ad9a8d, Opus 5.5), at the
  coordinator's ask: "A short design note on the page's side of the calibration epoch (the mainline's 9640b91 on
  wt/epoch-notes, sections 3.3 and 5.4). How should the Evidence tab read the observation ledger (one-sided marks, the
  tonnage), and how does the page show the kept set ('k of 30' beside a verdict, the band of founder times)? It's for
  after Stage A and Stage D, so the page is ready when they land." Docs only: no process was run for it.
- **Status:** advice only; nothing here is a decision. Its decisions are listed at the end.
- **Supersedes:** nothing.
- **Lineage:**
  - the epoch's design, `docs/DESIGN_calibration_epoch_v1_2026-11-21.md` (9640b91, by a Fable subagent of the
    mainline): section 3 (the ledger's schema, its operators, and 3.3, who reads it) and 5.4 (the landed set and the
    kept set);
  - QC_E (E-4: today's `OBS`, row by row).

## The answer in one paragraph

Today the Evidence tab draws every witness as a gold dot, as if each were a two-sided measurement of an angle. Three of
them are lower bounds, one is a level turned into an angle, and Wilding's tonnage stands alone as "the basis of his
12 square feet". After the epoch the tab reads the ledger and draws each row as what it is:
- an angle with its bar, or with an arrow where the row is a bound;
- each tonnage beside the others, styled by its role;
- every row about the sea at a place, as a lane of time: the witness's window, with the model's crossing marked on it.

A ledger table replaces the "Timeline check". It has a column for the landed run and one for this run, and each row's
implausibility as a badge. Each verdict in "Cases the fit never saw" gains "k of 30", and a verdict that flips inside
the kept set is labelled an edge. The trim chart's founder line gains two bands behind it: the kept set's founder times,
and the record's 157 to 160 min.

One condition makes it honest: the page must evaluate a row with the same code as the score. So the ledger's operators
belong in a library that the page and the worker bundle, as `girder.js` and `rooms.js` are, not in `tools/` alone.
It is built in two steps:
- after Stage A, `OBS` as a view of the ledger, with not a pixel moved;
- after Stage D, the rest.

A new browser suite for the tab, which no suite tests today, comes with each step. The envelope behind the run waits, as
the epoch's 5.4 says, but its data's shape is fixed here so that Stage D writes it once.

## 1. What the page shows today

Read in Z2's worktree at de1cd20 (`site/app.js` 2688-2738; `site/index.template.html` 282-313; `core/scenarios.js`
148-160 on `wt/join`).

**The three charts** (`chTrim`, `chList`, `chWater`):
- each draws this run (solid), the forecast (dashed) and the observations;
- each observation is one gold dot (`OBS.trim`, `OBS.list`, and `[[40, OBS.wilding40]]`), drawn the same whatever it is;
- the trim chart marks where the forecast founders ("founders", a dashed line);
- the flood water's hint reads: "Gold point: Wilding's 16,000 tons at 40 minutes, the basis of his '12 square feet'.
  The eyewitness timeline fits a smaller opening".

**"Timeline check, Titanic run":** `OBS.events`, plus three rows (the trim at 2:15, foundered, Wilding's 16,000 tons).
Each is witnessed against the baked landed run (`VAL.titanic`, from `out/validation.json`, which `tools/build_site.js`
bakes as `window.TitanicValidation`). Not against this run.

**"Cases the fit never saw":** eleven what-ifs, each with the record's verdict and the landed run's.

**The text:** "Four flow parameters were fitted to the eyewitness timeline; everything in the table above is a
prediction." This is public text.

**No browser suite tests the tab** (a grep of `tools/*_site_test.js` for its ids finds none). The User Guide reads the
same data (`tools/build_guide.js:451-460`) and photographs the tab.

**What it inherits from `OBS` (E-4, the epoch's 3.4):**
- the lower bounds (Symons at T 15, Robinson at T 30, Poingdestre at T 45) are drawn as points;
- Symons's ports at T 100 are a level, drawn as an angle;
- three witnesses are drawn twice, as a point and as an event (Wheat, Bride and Phillips, Lightoller);
- Wilding's tonnage is drawn alone, without Weeks and Halpern's 13,717 t at T 45.

## 2. What the epoch gives the page

Read from 9640b91.
- **`RECORD_1912`,** the ledger, as plain objects in `core/scenarios.js` (already in the page and the worker). One row is
  one thing one witness saw: `id`, `witness`, `source`, `group`, `kind`, `place`, `value`, `unit`, `t`, `tLo`, `tHi`,
  `sided` (two, lower, upper, interval), `sigma`, `disc`, `role` (fit, held, report), `tag`, `was`.
- **`OBS` becomes a view** of the ledger (D1). Its 3.3 says of the tab: "first `OBS` as a view of the ledger (no pixel
  moves); later the rows drawn as what they are: a lower bound as a mark with an arrow, Weeks and Halpern's tonnage
  beside Wilding's".
- **The operators,** in `tools/ledger.js`, one per kind (`sea_at`, `water_in`, `sounding`, `angle`, `event`, `tonnage`,
  `end`), working on a run sampled every 5 s with her pose and the 64 levels.
- **The kept set:** `out/kept_1912.json`, 30 members, each with its numbers, its own area constant, both founders and
  its implausibilities, named by a hash of `core/` and the ledger. It is a gate table. The landed set is one of the 30.
  `out/validate.txt` prints the landed verdict and "k of 30", and "a verdict that flips inside the kept set is labelled
  an edge, with its margin".
- **"The Evidence tab can later draw the kept set's envelope behind the run. Not in this epoch."**

## 3. The design

### 3.1 One evaluator for a row, shared by the score and the page

The page's "model" column has to be the score's own number. Otherwise the tab can show a row as met that the fit counts
as missed. So:
- **The operators go in a library the page bundles:** `core/readers/ledger.js`, as `girder.js` and `rooms.js` are (no
  state, no reader registered, nothing stepped). `tools/ledger.js` and `tools/calibrate.js` call it. The build bundles
  `core/readers/` into the page and the forecast's worker already. (Decision P-D1, the mainline's.)
- **Its input is what the page has live:** her pose and the 64 levels at each step. A row's value is taken as the run
  passes the row's window (`t − tLo` to `t + tHi`), by a step hook; each row's result is kept in a small table beside
  the run (`S.ledger`: per row, the model's value or crossing time, its miss, its I). Nothing goes into the sim, so no
  fingerprint can move.
- **The forecast** (the worker's copy of the run ahead) returns the same table for its own run, so a row not yet passed
  shows the forecast's value, dashed, as the charts do.
- **The baked landed run** gains the table as computed by `tools/validate.js` through the same library
  (`VAL.titanic.ledger`). That is the stable column.

**The implausibility:** `I = d / sqrt(sigma² + disc² + noise²)`, by the epoch's 5.1.
- d is `|z − f|` for a two-sided row, `max(0, z − f)` for a lower bound, the mirror for an upper one, and the distance
  outside an interval.
- A row loose in time takes its miss in minutes.
- The group's I is its largest row's.
- `noise` is the epoch's ensemble figure, read from the kept set's file, not written into the page.

### 3.2 The marks drawn as what they are

| `kind` | Where | The mark |
|---|---|---|
| `angle` (trim, list) | the trim and list charts | `two`: a dot with a bar of ±sigma. `lower`: a dot with an arrow up (the truth is at or above it). `upper`: an arrow down. `interval`: a bar between its bounds, at its time |
| `tonnage` | the flood water chart | one mark a row, each labelled by its witness: Wilding's 16,000 tons at T 40 (`report`) beside Weeks and Halpern's 13,717 t at T 45 |
| `sea_at`, `water_in`, `sounding`, `event` | a new chart, "The sea at the places they saw": one lane a group, in time | the witness's window (`tLo` to `tHi`) as a bar; a `lower` row's end as an arrow ("by then, at least"); the model's crossing as a tick (the landed run's solid, this run's hollow); the bar's colour by the group's I (inside, within 3, beyond 3) |
| `end` | the trim chart's founder bands (3.4), and the last lane | the record's band and the kept set's band |

**Roles:** `fit` is solid gold; `held` (printed before and after every refit, never fitted) is hollow gold; `report` is
grey.

**The legend** reads: "What witnesses saw: solid, fitted; hollow, held out; grey, reported. An arrow is a bound".

**The tip** (hover) gives the row's witness, what was seen and where, its source, its sidedness, sigma and allowance,
its role, and its I against the landed run and this one.

**A lane is not an angle.** A sighting of the sea at a place is drawn as a time against a place. It is never converted
to a trim, which is the fault E-4 removes from the score. The lane chart has one line a group (about eight groups for
the fore-and-aft problem, the epoch's 3.4), so it is short enough for the 384 px panel and the phone's sheet.

### 3.3 The ledger table (in place of "Timeline check")

- **Columns:** Witness · What was seen (the row's place in words) · Witnessed (a time or a value, with its side:
  "by 12:10 am, at least") · Model, the landed run · This run · I (a badge).
- **Rows** are grouped by `group`, rows of one group together, the group's badge its largest I. By default it shows the
  fitted groups; "Show the held and reported rows" opens the rest.
- **The end row:** the landed founder time and the kept set's band ("2:18 am; 2:16 to 2:20 on the kept set"), against
  the record's "2:20 am, 157 to 160 min".
- **On a watch** the rows count from the touch, as the charts do today; the model columns are the watch's own.

### 3.4 The kept set on the page

**The data.** One source: `tools/validate.js` writes each case's kept-set reading into `out/validation.json`, which
the build already bakes. So:
- `VAL.kept = { n: 30, hash, founderMin: [the 30 founder times], noise }`;
- per case, `VAL.<case>.kept = { founders: k, floats: n − k, founderMin: [lo, hi], trim: [lo, hi], edge: bool,
  margin }`.

A separate bake of `out/kept_1912.json` would be a second copy to keep in step. (Decision P-D2.)

**"k of 30"** in "Cases the fit never saw": the Model column shows the landed verdict, then its count. For example:
- "Founders in 2 h 38 min · 30 of 30 founder";
- "Floats, 3.2° by the head · 13 of 30 float: an edge, margin 0.4°" (the bulkheads-to-B-deck what-if is today's knife
  edge, e90).

An edge's row is marked, and its tip gives the margin.

**The founder bands** on the trim chart:
- behind the landed run's "founders" line, the kept set's band (its earliest to latest founder) as a shaded strip;
- the record's band (D73's 157 to 160 min) as a bracket along the top edge.

The same pair appears in the ledger table's end row.

**The readouts' forecast line** ("Founders at 2:17 am, ...") stays the page's own run, one set. On the 1912 preset its
tip adds the kept set's band. The readouts are the stage's, and C-4 keeps them lean.

**Later, the envelope** (the epoch's 5.4: "not in this epoch"): behind the run on the trim, list and water charts, the
kept set's least to greatest at each minute, shaded. Its data, fixed now so that Stage D writes it once: each member's
trim, list and water at each minute to her founder (30 × about 165 × 3 numbers, about 100 KB as JSON). It goes in an
asset of its own (`assets/kept_1912.json`, copied by the build) fetched when the Evidence tab first opens, not baked into
the page.

### 3.5 The words (public text: Bo's)

Drafts only; the coordinator routes them to Bo.
- **"How it works",** after D4: "The opening (fitted as Cd×A, its area times its flow coefficient) and two flow numbers
  were fitted to the record's ledger: what each witness saw, where and when, each counted once and as a bound where the
  witness gave one. Thirty parameter sets that the ledger cannot rule out are kept; each verdict below says on how many
  of them it holds."
- **The flood water's hint:** "Wilding's 16,000 tons at 40 minutes was his assumption for his '12 square feet'; Weeks
  and Halpern's 13,717 tons at 45 minutes stands beside it. Openings compare as Cd×A: Hackett and Bedford's 0.57 m², the
  model's [landed] m²."
- **"What it leaves out":** follows E-3's choice (the late list; option 1 or 2).

## 4. When, and in what order

| Step | After | What | Files | Suite |
|---|---|---|---|---|
| P1 | Stage A (A3: the ledger as data, CHECK only) | `OBS` as a view of the ledger. If `core/scenarios.js` makes the view, the page needs no change at all, and not a pixel moves | none, or `site/app.js`'s reads of `SC.OBS` | `evidence_site` (new): the three charts' canvases byte-equal on the preset at a fixed step, before and after; the table's rows as before |
| P2 | Stage D (D1 the score reads the ledger; D4 the landing) | 3.1 to 3.4: the library in the page, `S.ledger`, the marks by kind and side, the lane chart, the ledger table, "k of 30", the founder bands | `site/app.js`, `site/index.template.html`, `site/styles.css`; `core/readers/ledger.js` if P-D1; `tools/build_site.js` only if P-D2 goes the other way | `evidence_site`: each mark's shape against its row's `kind` and `sided`; the table's rows against the ledger's; each model value against the library's on the same run, to 1e-9; "k of 30" against `out/validation.json`; the bands against the kept set's least and greatest founder |
| P3 | later | the envelope | the asset, its fetch, the three charts | `evidence_site`: the band's edges against the asset at three minutes |

- **After P2:** U0's guide, chapter 9 and its pictures (the epoch's D6 names chapter 9).
- **No clash with C-4:** the Evidence tab is in the panel, not on the stage, so C-4's slots don't touch it. The
  forecast line's tip is the readouts', inside the `readouts` slot.

## 5. Decisions needed (who decides)

1. **P-D1. Where the operators live:** a library the page bundles (`core/readers/ledger.js`) rather than
   `tools/ledger.js` alone. Recommended, so that the page and the score evaluate a row by one function. The mainline
   decides, since the epoch is its.
2. **P-D2. How the kept set reaches the page:** through `out/validation.json` (recommended: one source, already baked),
   or a bake of `out/kept_1912.json`. The coordinator decides.
3. **P-D3. The tab's suite:** a new `evidence_site` (recommended: the tab has none, and P2 gives it logic worth a suite),
   or rows in an existing suite. The coordinator decides.
4. **P-D4. The public words (3.5).** Bo decides.
5. **P-D5. Who builds P1 and P2.** Z2 is recommended: the page's lane, and C-4's build leaves the panel alone. U0 takes
   the guide after P2. The coordinator decides.

## 6. Risks

| Risk | What answers it |
|---|---|
| The page shows a row as met that the score counts as missed | P-D1: one function for both, and P2's row compares them on the same run to 1e-9 |
| The ledger's rows are the record's, but a watch's run is not the preset's | Each model column says which run it is; on a watch the rows count from the touch, as today |
| The lane chart crowds the panel | One lane a group (about eight); held and reported rows behind "show"; the phone's sheet scrolls |
| The kept set moves with every physics change | It is a gate table (STALE), and the bake follows `out/` at every build, so the page never holds a kept set of another core |
| "k of 30" reads as a probability | The words say "on how many of the kept sets it holds", never a percentage. The kept set is a span, not a sample (the epoch's maximin choice) |

## 7. Sources

**Read for this note:**
- `docs/DESIGN_calibration_epoch_v1_2026-11-21.md` at 9640b91: the answer, 1, 3.1 to 3.5, 5.1 to 5.5;
- Z2's worktree at de1cd20: `site/app.js` 2600-2738 (the charts, `chartData`, `renderEvidence`) and
  `site/index.template.html` 282-315 (the Evidence pane);
- on `wt/join` (c9ab222): `core/scenarios.js` 146-162 (`OBS`) and `out/validation.json` (its cases and keys);
- a grep of `tools/` for the tab's ids and for `founderMin` and `wildingMin`.

**Not checked:**
- the witnesses themselves (the epoch's own reading, through auditor E);
- how many groups the ledger will have (the epoch says about eight; its rows are not written yet);
- whether `core/readers/` can take a library that reads no night: `girder.js` and `rooms.js` are its precedents.
