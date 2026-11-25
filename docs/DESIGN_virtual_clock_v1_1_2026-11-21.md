# One clock for the page, virtual in the tests (QC finding C-3): design v1.1

- **Written:** 2026-11-21, about 01:10 CST, by the wake lane (session 8b9ba51f, Claude Opus 5.5).
- **Supersedes:** `docs/DESIGN_virtual_clock_v1_2026-11-21.md` (wt/wake `24b1425`). v1 stands as written; this version
  records what was decided about it in the hour after it was sent, and is the design of record for building.
- **What it answers:** Z2's QC finding C-3 ("The wall clock is inside the page's logic and inside the rows") and its
  remedy S1 (`QC_C_viewer_build_tests_2026-11-20.md` in the group's notes folder). This is not CLAUDE.md's C3, the
  step's conservation of the water.
- **Its neighbour:** Z2's C-4 design, `docs/DESIGN_page_layout_authority_v1_2026-11-21.md` on
  `claude/z2-the-deep-954bd3`. C-4 is built after this design's step 1 lands, rebased onto it.
- **Status:** a design; nothing is built. Line numbers are those of `7966a23` (join 6's main).
- **Tags:** [M] measured or read here; [B] a bet until built and timed.

## 0. What changed since v1

The decisions, with their words:

1. **`clock=test` in the address.** The coordinator: "YES, clock=test in the address, beside state.warp. It changes only
   timing and spares a second dist. Document it in CLAUDE.md's page rules when it lands." The CLAUDE.md text goes to
   the coordinator with step 1.
2. **`frameMs` defaults to 1000/60, not 100.** The coordinator: "frameMs defaults to 1000/60, for fidelity: a suite's
   rows may read what's drawn per frame. A suite may opt into 100 once the page's step cost is measured and its rows
   read only the model's steps. Measure the step cost first."
3. **The headless guard joins step 1.** The coordinator: "YES, the headless guard: no stray performance.now( in site/
   outside the named CPU budgets and input sites. It joins step 1, like engine_tests' scan." It keeps two lists
   (section 3.6).
4. **Who and when.** The coordinator: "Steps 1, 3 and 4 are yours, on a branch from main once join 7 lands... Tell Z2
   before you touch app.js, so your step 1 and C-4 don't collide... Step 1's neutrality is proved by night_site. The
   browser time (step 1's night_site, step 4's director_site timing) comes after join 8's gate. Headless code
   meanwhile."
5. **The director's three timing lines go into step 4.** The coordinator: "fold 80_director.js's three timing lines
   (the caption's 5 s at 284, and its placer at 300 and 329-333) into step 4. director_site can't be converted without
   them. Say so in the commit, and tell Z1... If C-4 takes the placer away first, keep only line 284." Z1, who last
   changed the caption (`c82a6ac`), agreed. Its race fix re-places the caption when the card or the readouts move, and
   reads no clock.
6. **`holdPace` gains an optional owner in step 1, neutral** (agreed with Z2; QC S3's first claim, C-7). See section
   3.5. C-7 is finished in C-4's build, when the parts pass their owners.
7. **The clock runs while the watch is paused** (Z1's question). `TitanicApp.now()` is the clock of the frames, not of
   the watch, so step 4 gains a row for a caption that must fade with the watch held (section 6).
8. **The wake works only on drawn frames under the virtual clock** (section 3.7). Otherwise its per-frame budget would
   cost more than the virtual clock saves.

## 1. The problem in one paragraph

The model steps on its own clock (dt = 0.25 s) and is deterministic. The page drives it from the wall clock. Each
`requestAnimationFrame` gives a frame's real seconds (`dtReal`, capped at 0.1 s), the pace turns them into her seconds,
and her seconds into steps. Holds, notices, placers and throttles also end by `performance.now()`. So a loaded machine
changes how many steps a frame runs, when a hold ends, whether a caption is still up when a row looks, and whether a
sleep in a suite was long enough. `holdWhen` fixed the clicks: a part's `step` hook stops the clock on the very step.
But everything between two held steps still runs on real time, and the suites wait in real time for a model that could
step far faster. Join 5's browser phase took 53.5 of the gate's 61 minutes, mostly spent waiting [M, the QC's
measurement from the gate's log times].

## 2. Every read of the wall clock, and what becomes of it

Grep of `site/` for `performance.now`, `Date.now`, `setTimeout`, `setInterval` and `requestAnimationFrame` [M]. The
last column says which step converts each line, or which list of the guard keeps it (section 3.6).

| Where | What it times | Becomes | When |
|---|---|---|---|
| `app.js:2969-2971` | the frame's real seconds, `dtReal` (capped at 0.1 s) | the page clock | step 1 |
| `app.js:2960-2961` | `holdPace` and `paceHeld`: a hold ends at `performance.now() + 1000 * seconds` | the page clock, with owners | step 1 |
| `app.js:3010` | the old slide with no fall engine (`S.post += dtReal * 14`) | the page clock (through `dtReal`) | step 1 |
| `app.js:3022-3024` | the readouts every 120 ms, the strip every 66 ms, the charts every second | the page clock | step 1 |
| `app.js:3016-3020` | the pixel-ratio governor | wall clock; off while virtual | step 1 (permanent) |
| `app.js:100` | a notice's lifetime (`setTimeout`, 2.6 or 4.2 s) | a timer on the page clock | step 1 |
| `app.js:1393`, `1423` | a tap against a drag (under 450 ms): the player's hand | wall clock | permanent |
| `app.js:1591` | the wait before a forecast is asked (30 or 350 ms) | wall clock (scheduling) | permanent |
| `app.js:1613-1645` | the forecast on the main thread when no worker is to be had (slices of 12 ms) | wall clock (a CPU budget) | permanent |
| `app.js:2709` | the wake's work budget (`wake.frame(..., performance.now())`) | wall clock (a CPU budget) | permanent |
| `app.js:3042` | a resize 200 ms after an orientation change | wall clock (layout) | permanent |
| `40_night_end.js:150-152` | the end card placed again every 250 ms | removed by C-4's build | pending (C-4) |
| `50_boats.js:197` | the boats' panel drawn at most every 200 ms | the page clock | pending (its lane) |
| `55_girder.js:92-95` | the gauge's cost measured: a statistic, it changes nothing | wall clock | permanent |
| `55_girder.js:101-103` | the gauge read at most every `EVERY` ms | the page clock | pending (its lane) |
| `60_reports.js:148` | the reports' notice (`setTimeout`, 3.2 s) | a timer on the page clock | pending (its lane) |
| `60_reports.js:222-223` | the knowledge and orders panels painted at most every 125 ms | the page clock | pending (its lane) |
| `60_reports.js:91`, `251` | the reports' hold (`HOLD` = 4 s), through `holdPace` | on the clock with `holdPace` (step 1); line 251 reads it | 251 pending (its lane) |
| `70_help.js:64` | the help panel drawn at most every 250 ms | the page clock | pending (its lane) |
| `70_help.js:149`, `227` | a rocket's flight drawn from its launch time | the `frame` hook's time | pending (its lane) |
| `75_deep.js:315`, `428-432` | the deep's strip placed every 250 ms (removed by C-4's build), its readouts every 100 ms | the page clock | pending (C-4; Z2) |
| `80_director.js:284`, `300`, `329-333` | a caption's 5 s, and its placer every 250 ms | the page clock | step 4 |
| `24_wake_field.js:46`, `237-256`, `574-623` | work for up to N ms a frame | wall clock (a CPU budget) | permanent |
| `25_wake.js:25`, `213` | the wake's budget, 4 ms a frame (9 while making) | drawn frames only, when virtual | step 4 (section 3.7) |

The rule behind it has three parts:

- **The page clock** is for anything that says *when* something happens in the page.
- **The wall clock** stays for anything that only bounds *how much work* a frame does (the forecast's slices, the
  wake's work), and for statistics, the player's hand and layout.
- **A CPU budget** changes how soon a drawn thing is complete, never what the model does. A row that reads one waits
  for it to be complete, as `wake_site`'s pixel rows already do (budget 0, both pictures in one call).

## 3. The design

### 3.1 One clock

```js
// the page's time in ms: the wall clock's plus how far the virtual frames have run ahead of it. It only goes forward
const clock = { t: performance.now(), off: 0, virtual: false };
TitanicApp.now = () => clock.t;
function loop(ts) {
  if (!clock.virtual) { clock.t = ts + clock.off; framePass(true); }
  requestAnimationFrame(loop);
}
```

- `framePass(render)` is today's `frame(now)` without the `requestAnimationFrame` at its end, reading `clock.t` where it
  read `now`. `dtReal` is `Math.min(0.1, (clock.t - last) / 1000)` as before.
- In real mode `TitanicApp.now()` is the rAF time plus an offset that stays 0 until a test runs virtual frames. A page no
  test touches runs exactly as today.
- Leaving virtual mode sets `clock.off = clock.t - performance.now()`, so the page's time goes on from where the virtual
  frames left it and never jumps back. Every deadline set in either mode (a hold, a caption, a timer) stays right.
- **It is the clock of the frames, not of the watch** (decision 7). It advances on every frame, real or virtual, whether
  the watch is playing, paused, held on a step by a hook, or done ("On the bed"). A paused watch therefore lets a
  caption fade and a placer re-place, as today. In virtual mode only a test's frames advance it. A test that runs no
  frames sees nothing move, which is the point.
- The rAF loop keeps running while the clock is virtual and does nothing. The page stays alive, and CSS transitions go
  on in real time (section 4.2).

### 3.2 Timers on the page clock

`TitanicApp.after(ms, fn)` queues `fn` at `now() + ms`. `framePass()` runs the due timers first, in the order they were
set.

- The page's notice (`app.js:100`) uses it in step 1. C-4 moves the notice's placement into a slot and keeps this
  timer.
- The reports' notice (`60_reports.js:148`) moves with its lane.
- In real mode a notice ends at most one frame late. In a hidden tab it waits for the player to come back.

### 3.3 The parts

A part that times when something happens reads `TitanicApp.now()`, or the time the `frame` hook passes it
(`fire('frame', now / 1000, dtReal)`). Who converts which line is in section 2's last column:

- step 1 for `app.js`;
- step 4 for the director's three lines and the wake's budget;
- each part's own lane, or C-4's build, for the rest.

Until then the guard keeps those lines on its pending list.

### 3.4 The test entry

`TitanicApp.test` is a test hook, as `state.warp` is. It is inert until called, and shipped:

```js
TitanicApp.test = {
  virtual(on) { ... },                                      // the clock virtual or real; time only goes forward
  frame(ms, o) { clock.t += ms; framePass(!!(o && o.render)); },   // one pass, the clock advanced by ms (at most 100)
  // virtual frames until stop() holds, the clock is stopped (a hook set playing false), or maxMs of page time pass;
  // yields to the event loop about every 30 ms of real time (the forecast worker, the page's slices); { done, frames, ms }
  async run({ stop, frameMs = 1000 / 60, maxMs, render = false }) { ... },
};
```

- **Boot.** `clock=test` in the address (`#night=1912&clock=test`) starts the page with the clock virtual, before its
  first frame (decision 1). No real frame ever steps a watch in a converted suite.
- **Rendering.** A virtual frame runs everything a real one does except `renderer.render(scene, camera)`, the
  pixel-ratio governor and the wake's work (section 3.7). `{ render: true }` draws as well, and a row that looks at
  pixels runs its last frame or frames rendered.
- **The frame's size** (decision 2). `frameMs` = 1000/60 by default, a desktop's cadence, because a row may read what is
  drawn per frame.
  - At 240x a frame then runs 16 steps; at 900x, 60; at her own pace, one step in 15 frames.
  - A suite may pass `frameMs: 100` (the page's own frame cap) once the page's step cost is measured and its rows read
    only the model's steps.
- **Bounds.** `maxMs` is in page time, so a wait that fails, fails the same way on every run. The CDP call around it
  keeps its wall-clock deadline (G16) as protection against a hang only.

### 3.5 `holdPace` with an owner (step 1; neutral)

```js
// one hold per owner; the page is held while any owner's hold runs. holdPace(0, owner) ends only that owner's. A call
// with no owner is the anonymous owner's, so today's callers keep today's behaviour: one hold, a later one replaces it,
// 0 ends it. A new run ends every hold. Returns that owner's end, in page time
function holdPace(seconds, owner = '') { ... }
const paceHeld = () => { for (const k in holds) if (clock.t < holds[k]) return true; return false; };
```

- Neutral by construction: no caller passes an owner in step 1, so one anonymous hold behaves as the single hold does
  today.
- C-7 (the reports' release ending the director's hold, and the reverse) is finished in C-4's build. There the parts
  pass their owners (`'director'`, `'reports'`), with C-7's own row. Step 4 passes no owners.

### 3.6 The guard (step 1)

A headless suite, in `tools/engine_tests.js`'s style, scans `site/` for `performance.now(`, `Date.now(`, `setTimeout(`
and `setInterval(` (decision 3). Each hit must be on one of two lists in the suite, by file and the text of the line, so
that moving a line keeps it matched:

- **Permanent:** the CPU budgets, statistics, input and layout lines of section 2.
- **Pending:** the lines still to be converted, each with its owner and the step that removes it. The pending list may
  only shrink. A line added to `site/` that reads the wall clock fails the suite unless it is put on the permanent list
  with its reason.

The suite prints both lists' counts, so the gate's table shows the pending list emptying.

### 3.7 The wake under the virtual clock (step 4)

The wake part works on its field from the `frame` hook within a budget: 4 ms a drawn frame, 9 while the field is being
made (`25_wake.js:25`, `213`).

- **The problem:** a virtual run of 1000/60 frames through the director's 270 s of holds is about 16,200 frames, so at
  4 ms a frame the budget alone would cost about a minute [B]. And the field's progress would still depend on the
  machine.
- **The rule:** under the virtual clock the part works only on frames that are drawn, and then to completion (budget 0:
  "until there is nothing to do", `24_wake_field.js:609-613`). Her motion is still pushed into its record every step
  (`25_wake.js:201-204`), so nothing is lost.
- **The result:** the field a picture shows is the same on every run, and frames that are not drawn cost nothing for
  the wake.
- **To confirm in step 4:** a picture taken after a long virtual run equals one taken after the same steps in real time,
  once that run's field has caught up. Today the field's refreshes are laid from the record's samples, not from frames.
  Section 8 lists this as a risk until shown.

### 3.8 What the virtual clock guarantees, and what it does not

**Guaranteed:** with the same clicks at the same steps and the same `frameMs`, every run has the same frames, the same
steps in each frame, the same hook order, the same holds, notices, captions and placements, whatever the machine's load.
Load changes only how long the suite takes. This ends C-3's family of flakes. Their lines at `7966a23` (the QC cited
older ones):

- the dark and the founder flag in one frame (`CHANGELOG.md:150-153`);
- a watch read a frame late (`860-861`);
- a click lost on a loaded machine (`967-970`).

It makes running two suites at once safe by construction (C-11's switch still applies).

**Not guaranteed:**

- how soon a CPU budget's work is complete (the forecast's arrival, and the wake's field in real mode);
- anything in real time (CSS transitions, the compositor);
- that the page keeps real-time pace. That is the canary's job (section 5).

## 4. In the suites

### 4.1 Helpers in `tools/cdp.js` (step 3)

- `b.vrun(stopExpr, { frameMs, maxMs, render, ms })` evaluates `TitanicApp.test.run(...)`, with `stop` taken from an
  expression. `ms` is the CDP deadline (G16), which only catches a hang.
- `b.vframes(n, { render })` runs n virtual frames.
- `b.open(hash, { virtual: true })` appends `&clock=test`.

A suite's step-hook wait (`until` in `director_site_test.js`, `holdWhen` in `night_site_test.js`) keeps its hook as it
is. Only "then let the page run" changes, from `state.playing = true` plus a wall-clock poll, to `vrun` on the held
flag.

### 4.2 The conversion rule

A wall-clock wait in a suite is one of three kinds:

1. **It waits on the page's own frames** (a step reached, a hold over, a card shown after a frame): it becomes `vrun`
   with a page-time bound.
2. **It waits on something outside the page's clock** (a click's own handler, the worker's table of other watches, a CSS
   transition): it stays a `waitFor` on the wall clock.
3. **It is a sleep to let the page play before a picture:** it becomes `vrun` for those milliseconds of page time, with
   the last frames rendered.

A row whose number is defined in real time (a hold's seconds) stays in real time, once per feature (S1's rule, and the
coordinator's).

## 5. The canary: `night_site` stays real-time

`tools/night_site_test.js` is never converted. It stays the gate's proof that the page keeps real-time pace:

- the rAF loop, `dtReal` and its cap, the warp on real seconds, and `holdWhen` at the page's real pace;
- its table's fingerprints, which depend on no pace (`out/night_site_test.txt`).

It also proves step 1 neutral: its rows and its table must be exactly as on the commit before step 1. One row more is
optional: with no test call, `TitanicApp.now()` follows `performance.now()` with an offset of 0.

Every converted suite keeps one real-time row for each real-time feature it owns:

- `director_site`: a hold's seconds (row 3);
- `reports_site`: the reports' 4 s hold, when its lane converts it.

## 6. `director_site` converted (step 4)

The suite (283 lines; 453 s in join 5's rerun [M]) is the longest in the gate. It is mostly holds at her own pace:
about 270 s over the 1912 night, the last minutes alone 186 s (the QC's derivation from `80_director.js:47-65`,
`END_HOLD` 240). The director chooses its cuts on steps and on the player's time counted step by step, never on the wall
clock (`80_director.js:11-14`, `209-228`). So every cut row converts with no change to what it asserts, and only the
waits change. Step 4 converts three things together, and its commit says why: the suite, `80_director.js`'s three timing
lines (284, 300, 329-333; decision 5), and the wake's budget (section 3.7).

Section by section (suite line numbers):

| Lines | Today | Converted |
|---|---|---|
| 84 | `b.open('#night=1912')` | `b.open('#night=1912', { virtual: true })` |
| 25-30, 85 and every `until(...)` | step hook, then `playing = true`, then a wall-clock poll up to 300 s | the same hook, then `vrun('window.__held', { maxMs })`, the bound in page time |
| 32, 87-89, 123, 174, 187, 200, 268 | `frames(b, n)` counts real rAF callbacks | `b.vframes(n)` |
| 98-101, 104, 124, 183-184, 188, 213, 228-230, 232, 261-262 | a real click, then `waitFor` its effect (up to 10 s) | unchanged: the handler's effect is synchronous (kind 2) |
| 107, 185, 249 | `state.warp = 6`: the ice in real time, 16 s to the clear | unchanged; under `vrun` it costs CPU only [B] |
| 111, 115 | `run`, then sleep 1.5 s, then stop and take a picture | `vrun(null, { maxMs: 1500, render: true })`; with no picture folder, `vframes(1)` |
| 127-143 (row 3) | the first boat's hold measured on the wall clock: `held.s > 0.6 x 8 s`, the pace back `after < 1.5` s | **stays real-time:** `b.virtual(false)` before, `b.virtual(true)` after; the suite's one real-time row (about 12 s) |
| (new) row 3b | none | the same hold under the virtual clock, exactly: 8 s of page time to within one frame; the pace back within one frame of the hold's last step |
| (new) row 3c (Z1) | none | a caption shown at a cut, the watch then paused (`playing = false`), and 5.4 s of page frames run: the caption must be gone, its fade on time. This shows the clock is the frames' and not the watch's (decision 7) |
| 147-154 | `until(next cut or foundered)` at 240x, with sleeps for pictures | `vrun`: the 270 s of holds become about 16,200 frames of 1000/60, with no render and no wake work [B] |
| 170 | the model alone in the page, to the same step | unchanged (no clock) |
| 182-196 (row: the same cuts twice) | two real-time runs that happen to agree | two virtual runs that must agree to the frame: stronger, by construction |
| 205, 215, 227, 231, 233 | `until` at 240x and 900x to her forecastle | `vrun` |
| 244-252 (phone) | a resize to 390 x 780, then the bells | `vrun` for the bells. The sheet's slide (0.22 s, a CSS transition, 258-260) stays a wall-clock `waitFor` (kind 2) |
| 265-268 | `until(lights out + 40 s)`, `until(foundered)`, then `waitFor(end card, 10 s)` | `vrun` for all three; the card's wait gets a page-time bound, because the card comes on a frame after the flag |
| 275 | no console error | unchanged |

**The time it would take** [B, derived; first measure the page's step cost, as the coordinator asks]:

- the browser and four page loads: about 15 s;
- row 3 in real time: about 12 s;
- the model's own steps: about 60 to 90 s. That is roughly 150,000 steps over the suite's runs, at 0.4 to 0.6 ms each.
  0.4 ms is `record_night.js 1912`'s cost in Node, readers included; the page's step hooks add some;
- the frames themselves: at 1000/60, about 16,200 for the holds and as many again for the runs at pace. At 0.3 to 1 ms
  each without render or wake work, that is about 10 to 30 s;
- pictures, when asked: about 5 s.

That makes about 1.7 to 2.5 min against 7.5 today. The floor is the steps' CPU. If the measured step cost is above
0.6 ms, the QC's go/no-go ("under 2") should read "under 3". The suite's opt-in to `frameMs: 100` would save most of the
frames' share, once its rows are shown to read only the model's steps.

## 7. The order of work

Each step is a small commit on a branch from main once join 7 lands. Headless code comes first; the browser time comes
after join 8's gate (decision 4).

1. **`site/app.js` (the wake lane):**
   - the clock, `framePass`, `TitanicApp.now`, `TitanicApp.after` and `TitanicApp.test`;
   - `clock=test` at boot;
   - `holdPace` with owners (neutral);
   - the readouts', strip's and charts' throttles, the governor and the notice on the clock;
   - the guard, as a headless suite with its two lists.

   Neutral in real mode: `night_site` passes with its table unchanged, and every browser suite as before. The
   CLAUDE.md text for `clock=test`, the clock and the guard goes to the coordinator. Z2 has been told what this step
   touches, and C-4 is built on top of it.
2. **The parts (each part's lane, or C-4's build):** the lines on the guard's pending list.
3. **`tools/cdp.js` (the wake lane):** `vrun`, `vframes`, and `open` with `{ virtual }`.
4. **`director_site` converted (the wake lane):**
   - the suite, as in section 6, with rows 3b and 3c added;
   - `80_director.js`'s three timing lines;
   - the wake's work on drawn frames only.

   Then timed against its real-time self on the same machine at the same moment: the same verdicts, and the table of
   cuts identical between two converted runs.
5. **If step 4 meets the go/no-go:** the rest in the order of their cost in the gate (systems_site 406 s, boats_site
   331, help_site 329, night_end_site 276, wake_site 225, sound_site 213, and on). Each keeps one real-time row for each
   real-time feature it owns. `night_site` is never converted.
6. **Then the share trial** (the turn file's item 9) changes meaning: converted suites cannot see each other's load, so
   the browser phase can be sharded. The QC estimates 10 to 12 min for the gate with three shards [B].

Today's smaller cut (C-8: `warp` from 6 to 25 in the eleven suites that set it, 4 to 6 min) is independent of this
design.

## 8. Risks, and what answers each

| Risk | Answer |
|---|---|
| A converted suite no longer proves real-time pacing | `night_site` stays real-time; each suite keeps one real-time row for each real-time feature it owns |
| A long synchronous loop starves the forecast worker and the page's slices | `run` yields about every 30 ms of real time |
| Rendering off hides a fault on the GPU path | picture frames and pixel rows still render; `night_site` renders throughout; the console-error rows stay |
| The wake's field drawn after a long virtual run differs from one stepped in real time | step 4 compares the two pictures once the field has caught up; until then, wake_site's pixel rows stay in real time |
| A part keeps a private `performance.now()` and its timing escapes the clock | the guard (section 3.6): a new wall-clock read fails unless it is listed as permanent, with its reason |
| The page's time runs ahead of the wall clock after a virtual run | it only goes forward (`clock.off`); nothing compares the page's time with `Date.now()` |
| An owner's hold left running by a part that forgets to end it | a new run ends every hold; C-7's row in C-4's build checks that the owners end their own |
