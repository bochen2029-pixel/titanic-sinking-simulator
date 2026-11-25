# One clock for the page, virtual in the tests (QC finding C-3): design v1

- **Written:** 2026-11-21, from about 00:55 CST, by the wake lane (session 8b9ba51f, Claude Opus 5.5), at the coordinator's
  word: "Yes, start C-3's design note (the virtual clock): docs only, versioned, for join 8. Keep night_site real-time as
  the canary, and show how director_site converts."
- **What it answers:** Z2's QC finding C-3, "The wall clock is inside the page's logic and inside the rows: this is why CPU
  load flakes the gate, and why it takes an hour", and its remedy S1, "One clock, owned by the page; virtual in the tests"
  (`QC_C_viewer_build_tests_2026-11-20.md` in the group's notes folder). This is not CLAUDE.md's C3, the step's
  conservation of the water.
- **Status:** a design. Nothing in it is built. Line numbers are those of `7966a23` (join 6's main).
- **Tags:** [M] measured or read here; [B] a bet until built and timed.

## 1. The problem in one paragraph

The model steps on its own clock (dt = 0.25 s) and is deterministic. The page drives it from the wall clock. Each
`requestAnimationFrame` gives a frame's real seconds (`dtReal`, capped at 0.1 s), the pace turns them into her seconds,
and her seconds into steps. Holds, notices, placers and throttles also end by `performance.now()`. So a loaded machine
changes how many steps a frame runs, when a hold ends, whether a caption is still up when a row looks, and whether a
sleep in a suite was long enough. `holdWhen` already fixed the clicks: a part's `step` hook stops the clock on the very
step. But everything that runs between two held steps still runs on real time. The same design makes the suites wait in
real time for a model that could step far faster. Join 5's browser phase took 53.5 of the gate's 61 minutes, mostly
spent waiting [M, the QC's measurement from the gate's log times].

## 2. Every read of the wall clock, and what becomes of it

Grep of `site/` for `performance.now`, `Date.now`, `setTimeout`, `setInterval` and `requestAnimationFrame` [M]:

| Where | What it times | Becomes |
|---|---|---|
| `app.js:2969-2971` | the frame's real seconds, `dtReal` (capped at 0.1 s) | the page clock |
| `app.js:2960-2961` | `holdPace` and `paceHeld`: a hold ends at `performance.now() + 1000 * seconds` | the page clock |
| `app.js:3010` | the old slide with no fall engine (`S.post += dtReal * 14`) | the page clock (through `dtReal`) |
| `app.js:3022-3024` | the readouts every 120 ms, the strip every 66 ms, the charts every second | the page clock |
| `app.js:3016-3020` | the pixel-ratio governor (frame time averaged over 90 frames) | wall clock; off while virtual |
| `app.js:100` | a notice's lifetime (`setTimeout`, 2.6 or 4.2 s) | a timer on the page clock |
| `app.js:1393`, `1423` | a tap against a drag (under 450 ms): the player's hand | wall clock (input) |
| `app.js:1591` | the wait before a forecast is asked (30 or 350 ms) | wall clock (scheduling) |
| `app.js:1613-1645` | the forecast on the main thread when no worker is to be had (slices of 12 ms of work) | wall clock (a CPU budget) |
| `app.js:2709` | the wake's work budget (`wake.frame(..., performance.now())`) | wall clock (a CPU budget) |
| `app.js:3042` | a resize 200 ms after an orientation change | wall clock (layout) |
| `40_night_end.js:150-152` | the end card placed again every 250 ms | the page clock |
| `50_boats.js:197` | the boats' panel drawn at most every 200 ms | the page clock |
| `55_girder.js:92-95` | the gauge's cost measured: a statistic, it changes nothing | wall clock |
| `55_girder.js:101-103` | the gauge read at most every `EVERY` ms | the page clock |
| `60_reports.js:148` | the reports' notice (`setTimeout`, 3.2 s) | a timer on the page clock |
| `60_reports.js:222-223` | the knowledge and orders panels painted at most every 125 ms | the page clock |
| `60_reports.js:91`, `251` | the reports' hold (`HOLD` = 4 s at her own pace), through `holdPace` | the page clock (with `holdPace`) |
| `70_help.js:64` | the help panel drawn at most every 250 ms | the page clock |
| `70_help.js:149`, `227` | a rocket's flight drawn from its launch time | the page clock (the `frame` hook's time) |
| `75_deep.js:315`, `428-432` | the deep's strip placed again every 250 ms, its readouts every 100 ms | the page clock |
| `80_director.js:284`, `300`, `329-333` | a caption's 5 s, and its placer every 250 ms | the page clock |
| `24_wake_field.js:46`, `237-256`, `574-623` | work for up to N ms a frame | wall clock (a CPU budget) |

The rule behind the right-hand column has three parts:

- **The page clock** is for anything that says *when* something happens in the page.
- **The wall clock** stays for anything that only bounds *how much work* a frame does: the forecast's slices and the
  wake's work. It also stays for statistics (the girder's cost), for the player's hand and for layout.
- **A CPU budget** changes how soon a drawn thing is complete, never what the model does. A row that reads one waits for
  it to be complete, as `wake_site`'s pixel rows already do (budget 0, both pictures in one call).

## 3. The design

### 3.1 One clock

`site/app.js` keeps the page's time in one place:

```js
// the page's time in ms: the wall clock's plus how far the virtual frames have run ahead of it. It only goes forward
const clock = { t: performance.now(), off: 0, virtual: false };
TitanicApp.now = () => clock.t;
function loop(ts) {
  if (!clock.virtual) { clock.t = ts + clock.off; framePass(true); }
  requestAnimationFrame(loop);
}
```

- `framePass(render)` is today's `frame(now)`, without the `requestAnimationFrame` at its end, and it reads `clock.t`
  where it read `now`. `dtReal` is `Math.min(0.1, (clock.t - last) / 1000)` as before.
- In real mode `TitanicApp.now()` is the rAF time plus an offset. The offset is 0 until a test has run virtual frames,
  so a page no test touches runs exactly as today.
- Leaving virtual mode sets `clock.off = clock.t - performance.now()`. The page's time then goes on from where the
  virtual frames left it, with no jump back. Any deadline set in either mode (a hold, a caption, a timer) stays right.
- The rAF loop keeps running while the clock is virtual and does nothing. The page stays alive, the compositor runs, and
  CSS transitions go on in real time (see 4.2).

### 3.2 Timers on the page clock

`TitanicApp.after(ms, fn)` queues `fn` at `now() + ms`. `framePass()` runs the due timers first, in the order they were
set.
The page's notice (`app.js:100`) and the reports' notice (`60_reports.js:148`) use it in place of `setTimeout`.

- In real mode a notice then ends on the first frame after its time, at most one frame late.
- In a hidden tab rAF stops, so a notice waits for the player to come back.
- Under the virtual clock a notice lasts its seconds of page time, so the director's caption, which keeps clear of the
  notice, is placed the same way on every run.

### 3.3 The parts

Every part in the table above that times *when* something happens reads `TitanicApp.now()`, or the time the `frame`
hook already passes it (`fire('frame', now / 1000, dtReal)`), in place of `performance.now()`. `holdPace` and `paceHeld`
use the clock, so the director's and the reports' holds are on it at once. No part keeps its own clock.

### 3.4 The test entry

`TitanicApp.test` is a test hook, as `state.warp` is. It is inert until called, and shipped:

```js
TitanicApp.test = {
  // the clock virtual (true) or real (false); the page's time only goes forward either way
  virtual(on) { ... },
  // one pass of the frame loop, the clock advanced by ms (at most 100: the frame cap)
  frame(ms, o) { clock.t += ms; framePass(!!(o && o.render)); },
  // virtual frames until stop() holds or the clock is stopped (a part's or a test's step hook set playing false), or
  // maxMs of page time have passed. Yields to the event loop about every 30 ms of real time, so that the forecast
  // worker's messages and the page's own slices get through. Returns { done, frames, ms }
  async run({ stop, frameMs = 100, maxMs, render = false }) { ... },
};
```

- **Boot.** A page opened with `clock=test` in its address (`#night=1912&clock=test`) starts with the clock virtual,
  before its first frame. No real frame ever steps a watch in a converted suite. Switching after load would let a
  load-dependent number of steps run first (the watch plays from its first frame).
- **Rendering.** A virtual frame runs everything that a real one does except `renderer.render(scene, camera)` and the
  pixel-ratio governor:
  - `updateScene`, the camera, the lights, every hook and the DOM all run, so the scene's per-frame pieces (the wake,
    the wash, the smoke, the steam) are where a real run's would be;
  - `{ render: true }` draws as well. A row that looks at pixels runs its last frame or frames rendered.
  - The governor stays off because it would read a 100 ms virtual frame as a slow device and lower the resolution.
- **The frame's size.** `frameMs` = 100 by default: the page's own cap, so the page runs as it already does on a 10 fps
  device. A suite whose rows are about per-frame behaviour may run at 1000/60.
  - At 240x a 100 ms frame runs 96 steps (the cap is 700). At 900x it runs 360. At her own pace it runs 0.4 steps a
    frame on average, which is why holds become cheap.
- **Bounds.** `maxMs` is in page time, so a wait that fails, fails the same way on every run. The CDP call around it
  keeps its wall-clock deadline (G16, `tools/cdp.js`) as protection against a hang only.

### 3.5 What the virtual clock guarantees, and what it does not

**Guaranteed:** with the same clicks at the same steps and the same `frameMs`, every run has the same frames, the same
steps in each frame, the same hook order, the same holds, notices, captions and placements, whatever the machine's load.
Load changes only how long the suite takes. This ends C-3's family of flakes:

- the dark and the founder flag in one frame (`CHANGELOG.md:150-153`);
- a watch read a frame late (`860-861`);
- a click lost on a loaded machine (`967-970`).

These are their lines at `7966a23`. The QC cited older ones, and the changelog grows at the top.

It also makes running two suites at once safe by construction (C-11's switch still applies).

**Not guaranteed:**

- How soon a CPU budget's work is complete: the wake's drawn field, and the forecast's arrival. Rows that read one wait
  for it to finish, as today.
- Anything in real time: CSS transitions, and the browser's own composition.
- That the page keeps real-time pace. That is the canary's job (section 5).

## 4. In the suites

### 4.1 Helpers in `tools/cdp.js`

- `b.vrun(stopExpr, { frameMs, maxMs, render, ms })` evaluates `TitanicApp.test.run(...)` with `stop` taken from an
  expression. `ms` is the CDP deadline (G16), which only catches a hang.
- `b.vframes(n, { render })` runs n virtual frames.
- `b.open(hash, { virtual: true })` appends `&clock=test`.

A suite's step-hook wait (`until` in `director_site_test.js`, `holdWhen` in `night_site_test.js`) keeps its hook as it
is. Only "then let the page run" changes, from `state.playing = true` plus a wall-clock poll, to `vrun` on the held flag.

### 4.2 The conversion rule

A wall-clock wait in a suite is one of three kinds:

1. **It waits on the page's own frames** (a step reached, a hold over, a card shown after a frame): it becomes `vrun`
   with a page-time bound.
2. **It waits on something outside the page's clock** (a click's own handler, the worker's table of other watches, a CSS
   transition): it stays a `waitFor` on the wall clock.
3. **It is a sleep to let the page play before a picture:** it becomes `vrun` for those milliseconds of page time,
   rendered.

A row whose number is defined in real time (a hold's seconds) stays in real time, once per feature. That is S1's rule,
and the coordinator's.

## 5. The canary: `night_site` stays real-time

`tools/night_site_test.js` is not converted. It stays the gate's proof that the page keeps real-time pace:

- the rAF loop, `dtReal` and its cap, the warp on real seconds, and `holdWhen` at the page's real pace;
- its table's fingerprints, which depend on no pace (`out/night_site_test.txt`).

It also proves the clock is neutral. Step 1 of section 7 (the clock in `app.js`) must leave its rows and its table
exactly as they were on the commit before it. Optionally one row more: with no test call, `TitanicApp.now()` follows `performance.now()` with an
offset of 0.

Every other converted suite keeps one real-time row for each real-time feature it owns:

- `director_site`: a hold's seconds (row 3 below);
- `reports_site`: the reports' 4 s hold.

## 6. `director_site` converted

The suite (283 lines; about 7.5 min alone, 453 s in join 5's rerun [M]) is the longest in the gate. It is mostly holds
at her own pace: about 270 s of holds over the 1912 night, the last minutes alone 186 s. That is the QC's derivation
from the cut list (`80_director.js:47-65`, `END_HOLD` 240). The director chooses its cuts on steps and on the player's
time counted step by step, never on the wall clock (`80_director.js:11-14`, 209-228). So every cut row converts with
no change to what it asserts. Only the waits change.

Section by section (suite line numbers):

| Lines | Today | Converted |
|---|---|---|
| 84 | `b.open('#night=1912')` | `b.open('#night=1912', { virtual: true })` |
| 25-30, 85 and every `until(...)` | step hook, then `playing = true`, then a wall-clock poll up to 300 s | the same hook, then `vrun('window.__held', { maxMs })`, with the page-time bound in her seconds at that pace |
| 32, 87-89, 123, 174, 187, 200, 268 | `frames(b, n)` counts real rAF callbacks | `b.vframes(n)` |
| 98-101, 104, 124, 183-184, 188, 213, 228-230, 232, 261-262 | a real click, then `waitFor` its effect (up to 10 s) | unchanged: the handler's effect is synchronous (kind 2) |
| 107, 185, 249 | `state.warp = 6`: the ice in real time, 16 s to the clear | unchanged; under `vrun` it costs CPU only (about 1 s) [B] |
| 111, 115 | `run`, then sleep 1.5 s, then stop and take a picture | `vrun(null, { maxMs: 1500, render: true })`; with no picture folder, `vframes(1)` |
| 127-143 (row 3) | the first boat's hold measured on the wall clock: `held.s > 0.6 x 8 s`, the pace back `after < 1.5` s | **stays real-time:** `b.virtual(false)` before, `b.virtual(true)` after. This is the suite's one real-time row (about 12 s) |
| (new) row 3b | none | the same hold under the virtual clock, exactly: 8 s of page time to within one frame; the pace back within one frame of the hold's last step |
| 147-154 | `until(next cut or foundered)` at 240x, with sleeps for pictures | `vrun`: the 270 s of holds become about 2,700 virtual frames of 100 ms, a few seconds of CPU [B] |
| 170 | the model alone in the page, to the same step | unchanged (no clock) |
| 182-196 (row: the same cuts twice) | two real-time runs that happen to agree | two virtual runs that must agree to the frame: stronger, by construction |
| 205, 215, 227, 231, 233 | `until` at 240x and 900x to her forecastle | `vrun` |
| 244-252 (phone) | a resize to 390 x 780, then the bells | `vrun` for the bells. The sheet's slide (0.22 s, a CSS transition, 258-260) stays a wall-clock `waitFor` (kind 2) |
| 265-268 | `until(lights out + 40 s)`, `until(foundered)`, then `waitFor(end card, 10 s)` | `vrun` for all three; the card's wait gets a page-time bound, because the card comes on a frame after the flag |
| 275 | no console error | unchanged |

**The time it would take** [B, derived]:

- the browser and four page loads: about 15 s;
- row 3 in real time: about 12 s;
- the model's own steps: about 60 to 90 s. Roughly 150,000 steps over the suite's runs (the 1912 night to her end, the
  second run to her forecastle, the preset twice, the phone's preset), at 0.4 to 0.6 ms each. 0.4 ms is
  `record_night.js 1912`'s cost in Node, readers included; the page's own step hooks add some;
- the holds' frames: about 5 s;
- pictures, when asked: about 5 s.

That makes about 1.6 to 2.1 min against 7.5 today. The floor is the steps' CPU, which no clock removes. The QC's go/no-go
was "if it falls from 7.5 min to under 2, do the rest". So the first measurement to make is the page's step cost:
steps per second at 900x with rendering off, one line in the console. If it is above 0.6 ms, the go/no-go should move to
under 3 min.

## 7. The order of work (each a small commit; nothing starts before it is picked)

1. **`site/app.js`:** the clock, the loop split, `TitanicApp.now`, `TitanicApp.after`, `TitanicApp.test`, and `holdPace`,
   the readouts' and strip's throttles and the governor on the clock. Neutral in real mode: `night_site` passes with its
   table unchanged, and every browser suite as before (the gate).
2. **The parts:** 40, 50, 55 (the throttle only), 60, 70, 75 and 80 on the clock; the two notices on `after`. Each
   part's suite as before.
3. **`tools/cdp.js`:** `vrun`, `vframes`, and `open` with `{ virtual }`.
4. **`director_site` converted** as in section 6, with row 3b added. Timed against its real-time self on the same
   machine at the same moment. Same verdicts; the table of cuts identical between two converted runs.
5. **If step 4 meets the go/no-go,** the rest in the order of their cost in the gate: systems_site (406 s), boats_site
   (331), help_site (329), night_end_site (276), wake_site (225), sound_site (213), and on. Each keeps one real-time row
   for each real-time feature it owns. `night_site` is never converted.
6. **Then the share trial** (the turn file's item 9) changes meaning: converted suites cannot see each other's load, so
   the browser phase can be sharded. QC section 3 estimates the gate at 10 to 12 min with three shards [B].

Owners, as the QC guessed them: the mainline for `site/app.js`; each part's lane for its part and suite; the coordinator
for the order. This lane can do steps 1, 3 and 4 on a branch if the coordinator gives them to it. Today's smaller cut
(C-8: `warp` from 6 to 25 in the eleven suites that set it, 4 to 6 min) is independent of this design and loses nothing
by waiting.

## 8. Risks, and what answers each

| Risk | Answer |
|---|---|
| A converted suite no longer proves real-time pacing | `night_site` stays real-time (section 5); each suite keeps one real-time row for each real-time feature it owns |
| A long synchronous loop starves the forecast worker and the page's slices | `run` yields about every 30 ms of real time |
| Rendering off hides a fault on the GPU path | every suite still renders its picture frames and its pixel rows; `night_site` renders throughout; the console-error rows stay |
| Frames of 100 ms differ from a desktop's 16.7 ms (the hooks see 6 times as many steps per frame) | the page already caps a frame at 0.1 s and must work there; a suite about per-frame behaviour runs at 1000/60 |
| A part keeps a private `performance.now()`, and its timing escapes the clock | a headless check in `tools/engine_tests.js` style: no `performance.now(` in `site/` outside a list of named CPU budgets and input sites |
| The page's time runs ahead of the wall clock after a virtual run | it only goes forward (`clock.off`); nothing compares the page's time with `Date.now()` |

## 9. Open questions for the coordinator

1. Is `clock=test` in the address acceptable as a test hook in the public page, beside `state.warp`? The alternative, a
   test build, means a second dist.
2. `frameMs` of 100 by default, or 1000/60? 100 is about six times cheaper per second of page time. 1000/60 is the
   desktop's cadence.
3. Should the check in section 8 (no stray `performance.now(` in `site/`) join step 1, so that later parts cannot slip
   back?
