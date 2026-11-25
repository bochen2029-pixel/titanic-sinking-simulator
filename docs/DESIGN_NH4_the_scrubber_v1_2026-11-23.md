# NH4, the scrubber: scrub the night to any kept minute and play on exactly (design v1)

- **Written:** 2026-11-23, 19:0x CST, by the Z2 lane (Claude Code, Opus 5.5), at the coordinator's ask of 18:41, for
  Bo's roadmap item NH4 ("on the roadmap", Bo, 2026-11-23). The ask: "a short design v1 first (what a snapshot holds:
  serialize() and the readers' states; where they are kept and how many; what scrubbing back does to a watch's log and
  its link; the virtual clock; desktop first), then build it as a part on its own branch for a later join, with its
  suite".
- **Status:** a design for review. Section 9 lists the decisions it needs.
- **Supersedes:** none.
- **Lineage:** BACKLOG 2k, NH4 (docs/BRAINSTORM_the_next_horizon_v1_2026-11-23.md, section 5).

## 1. The answer in one paragraph

The page keeps a snapshot of the whole run every simulated minute. A snapshot is the sim as plain data without the ship:
the core's state, the night's (its seed's draws, its log, its script), every reader's state, and the fall's once it
runs. It is the same structured clone the forecast already makes, except that the readers' states are kept. Each part
with a history of its own (the director's cuts, the ledger's samples, the cabins' track, the deep's run, the charts)
gives its own plain state at the same minute through a new hook.

Scrubbing to minute M restores the snapshot at M, or the nearest one before it, stepped on to M with no frames drawn.
Each part restores its own state, and the page plays on from there. A watch's orders after M stay in a queue and are
given again at their steps. So playing on from M without touching anything gives the unbroken run, to the bit and cut
for cut: NH4's test. A new order after scrubbing back drops the queued orders after it, the watch becomes the player's,
and the link is the new log.

Measured (scratchpad probe, the 1912 watch in Node with its readers):
- a snapshot is about 1.06 MB as a structured clone: the encounter's state 765 KB, the connections 192 KB, the
  staircases' openings 53 KB; the readers' states are a few KB;
- a clone takes 2 to 4 ms, and two clones stepped on a minute give the same fingerprint;
- the encounter's state does not change once she is clear of the ice, so one copy serves every later minute: about
  300 KB a minute, 50 MB for a whole night on a desktop.

## 2. What a snapshot holds

- **The sim, without the ship:** `structuredClone` of every key but `ship`, as `Night.forecastOf` copies it, but
  keeping the readers' states (`sim.people`, `sim.reports`, `sim.world`, `sim.circuits`, `sim.onset`, `sim.fall`).
  - The readers' rule already makes them plain data, and the fall's `eng` is part of `sim.fall`.
  - `C.serialize()` is the viewer's snapshot of the core alone, not enough to resume a watch, so it is not used here.
- **The page's own run state** that the step loop keeps: the charts' history (`S.hist`, kept whole, its view cut at
  M), the lights' and the dynamos' times (`lightsFailT`, `lightsMainT` and their reasons), the screws' turns, and the
  wake's, smoke's and steam's anchors. The last three are [appearance] and may be reset.
- **Each part's own state**, through a new hook pair: `TitanicApp.on('keep', (sim) => plainState)` at each kept
  minute, and `on('scrub', (sim, kept) => ...)` after a restore. A part with no history registers neither.
  - The director: its cuts so far, its hold, its count of the player's time, its last cut's step.
  - The ledger (78): its samples. The cabins (79): its slab track. The deep (75): its run (lines, first rest, under
    times).
  - The sound: its creaks' process state. The night's end card: whether it is shown, and with what.
  - Nothing more is needed by the parts that read the sim afresh every frame: the nerves view, the girder, the ports
    (D97 marks them from the circuits' record), the gallery, the boats' count, the reports' feed (in the sim).

## 3. Where they are kept, and how many

- In the page's memory, keyed by minute: an array of snapshots from minute 0 of the run (a preset's start, or a
  watch's) to the furthest minute played.
- Every simulated minute on a desktop. The encounter's state is held once its last change is behind (sim.night.tClear
  past): a later snapshot points at it rather than copying it, and a restore clones it again.
- On a phone (the page's own device class): every fifth minute. A minute between is reached by stepping on from the
  one before, at most four minutes (960 steps, about 0.3 s at the page's 0.2 to 0.3 ms a step).
- A new run (a new watch, a preset's restart, "This night again") drops them all.
- A scrub never goes past the furthest minute played: the bar ends there.
- A watch scrubbed back keeps the snapshots after M until a new order makes them a future that will not happen; then
  they go.

## 4. Scrubbing back on a watch: its log and its link

- **Playing on from M with no new order:** the orders after M (the 1912 orders' script, or the player's own logged
  orders) are given again on their steps through the night's own script (`Night.act` on the step, as a replay's script
  does). The watch's fingerprint at any later step is then the unbroken run's. The mode stays what it was ('auto' or
  'replay'); a 'you' watch scrubbed back plays as a replay of itself until a new order.
- **A new order after scrubbing back:** it goes through `TitanicApp.order`, as every order does. The queued orders
  after it are dropped, with one notice ("Your orders after 1:15 am are dropped: this night now goes your new way").
  The watch becomes the player's ('you', Y8), and the snapshots after it are dropped.
- **The link:** always the watch's log as it now stands (the end card's "Copy a link"). A scrubbed-back watch with no
  new order keeps its whole log, so its link is the whole night's. A link to a minute (`&at=95`: opened, run to minute
  95 at full pace, paused) is a small follow-up, not in v1.
- **A preset** has no log. Scrubbing back past a change made on the Damage tab (a hole added, a door shut) restores
  the run before it; the notice says so. Bulkhead and coal choices start a new run anyway.

## 5. The page's clock (QC C-3)

- A scrub is one task on the page's clock: restore the snapshot, step on to M with no frame drawn (the step loop's
  own work, as under load), call the 'scrub' hook, ask for a new forecast. The page's clock (`TitanicApp.now()`) only
  goes forward; nothing in a scrub reads the wall clock.
- Every hold of the pace ends at a scrub, as at a new run (`endHolds`). The director decides again from its restored
  state, and a caption showing is taken down.
- Under `clock=test` a scrub is the suite's own call (`TitanicApp.scrub(minute)`, or a real drag on the bar), and the
  suite runs the page's passes after it as it does after any click (`vrun`).

## 6. Desktop first: where the scrubber stands

- In the Run tab of the side panel, under the charts: a slim bar from minute 0 to the furthest minute played, a notch
  each kept minute, the current minute marked, her clock under it ("1:15 am, T+95").
  - A drag or a click scrubs. Keys while the page has focus: "," and "." for a minute back and on, with Shift for ten.
  - A click on a chart's time axis scrubs to that minute. The charts and the bar share one axis.
- On the stage, nothing new: the status pill says "Scrubbed to 1:15 am" while the run is paused there. The stage's
  layout (C-4) is untouched, so layout_site only gains states, not areas.
- On a phone the bar is in the same tab, full width, with 44 px targets.

## 7. The test (BACKLOG's NH4 row, made exact): `tools/scrub_site_test.js`

On the page's virtual clock:
1. The 1912 watch on its orders, run to minute 60 after the touch, then on to her end, the hand-over at the break's
   onset (the default since G12's cascade). The reference: its fingerprint at the end, the director's cuts, the
   notices and the marks from minute 60 on.
2. Scrubbed back to minute 60 (a real drag) and played on to her end: the same fingerprint, the same cuts, notices and
   marks from minute 60 on, step for step.
3. The same on the 1912 preset to its flag and its fall's rest.
4. Scrubbed back, a new order (a real click on the wheel): the queued orders dropped (the log ends with the new
   order), the mode 'you', the link the new log, the notice once.
5. A minute between kept ones on a phone's spacing: reached by stepping on, the same fingerprint as the unbroken
   run's at that minute.
6. The cost: the snapshots' count and their bytes after the whole night (a bound: under 80 MB on a desktop); a scrub
   within 0.5 s of the wall clock on this machine (a CHECK row, not a MUST).
7. Neutral: a watch with the scrubber idle has the model's own fingerprint; no error in the console.

layout_site gains two states (desktop and phone: the Run tab's bar shown). Its MUST is unchanged.

## 8. How it is built

1. The page (site/app.js): the snapshot keeper (`keep`, every minute), `TitanicApp.scrub(minute)`, the 'keep' and
   'scrub' hooks in the parts' list, the queue of a watch's later orders, the status pill's words.
2. The part, site/parts/82_scrub.js and its CSS: the bar in the Run tab, its keys, the charts' axis click.
3. Each part with a history: its 'keep' and 'scrub' (the director, the ledger, the cabins, the deep, the sound, the
   night's end). Each owner is told the exact lines first: the mainline for the director, the sound and the end card.
4. The suite, and its row in tools/gate.js after deep_site (virtual).

It needs no change to `core/`. A watch's step is the night's own, and a restore is a clone of plain data.

## 9. Decisions needed (who decides)

- Every minute on a desktop (about 50 MB) or every fifth everywhere (about 10 MB, a minute stepped on in 0.3 s):
  proposed, every minute on a desktop and every fifth on a phone. The coordinator, or Bo.
- A new order after scrubbing back drops the later orders (proposed), or keeps them as a branch to go back to (a
  later version). The coordinator.
- The link to a minute (`&at=`): a follow-up after v1 (proposed). The coordinator.

## 10. Risks

- A part that keeps state but registers no 'keep': the cuts or the notices after M would differ. Step 2 of the test
  finds it for the parts it watches (the director, the notices, the marks). Every part's own suite should gain a
  scrub row in time.
- The fall's engine state (`sim.fall.eng`) is large while she falls. Measure it in the build; keep every fifth minute
  in the fall if it is.
- The forecast's worker sees a new sim after a scrub: its old answer must be dropped (the request counter does that
  today).

## 11. Sources

- BACKLOG.md 2k (NH4's row).
- CLAUDE.md: the readers' rule (plain data, state keys), the forecast's copy (`Night.forecastOf`), the page's one
  clock (QC C-3), the parts' hooks and the layout (C-4), the orders' one way (`TitanicApp.order`, Y8).
- A probe of 2026-11-23 (the Z2 lane's scratchpad, probe_nh4_snapshot.js) on claude/z2-g12-page:
  - snapshot sizes by key (v8.serialize);
  - clone times;
  - two clones stepped on a minute, the same fingerprint;
  - 0.26 ms a step in Node with the readers.
- Not checked yet: the parts' own states' sizes, the fall's while she falls, and a scrub's time in the browser.
