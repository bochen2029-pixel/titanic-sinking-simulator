# DESIGN: one layout authority for the page, a check that every suite runs, and claims for what parts change (v1)

- **Written:** 2026-11-21, 00:5x to 01:23 CST, by Z2 ("Titanic Z2: the deep", session 66ad9a8d, Opus 5.5), at the
  coordinator's ask: "QC C-4, one layout authority for the page, as a DESIGN NOTE first, with no code tonight." It comes
  from Bo's read-only QC of 2026-11-20 (his words: "a second or third set of eyes ... potential blockers that nobody has
  seen yet because everybody's in their own lane"). Bo's overnight word: work on until noon 11-21.
- **Status:** a design for review. Nothing here is built, and nothing is decided until the coordinator routes it. The
  decisions it needs are in their own section.
- **Supersedes:** nothing; the first version.
- **Lineage:**
  - QC_C_viewer_build_tests_2026-11-20.md (in the group's notes folder): C-4, the four placers; C-5, the marks;
    C-7, the pace; C-9, the near plane; S2, slots; S3, claims;
  - QC_00_SYNTHESIS_2026-11-20.md, item 8;
  - the first two claims already built: the marks (de1cd20, C-5) and a view's near plane (1f2deb0, C-9).
- **Its neighbour:** the wake's `docs/DESIGN_virtual_clock_v1_1_2026-11-21.md` (on `wt/wake`, 24b1425). That design's
  step 1 lands first, and this one is built on top of it (section 6).

## The answer in one paragraph

Today four functions and about twenty fixed pixel offsets place the stage's overlays, and each offset guesses the size of
another overlay. Three of the four functions poll every 250 ms and read each other's rectangles in a chain. Only two of
the page's shapes are ever tested: 1400 × 860, and a phone held upright.

This design gives the stage one authority. A CSS grid lies over the stage, with areas named by role: readouts, views,
stack, rail, aside, helm and diagram. Each area is a flex column. The page and every part hand their overlays into it
(`TitanicApp.slot`); no part sets a position again. Each shape has its own template: a desktop, a narrow stage, a phone
upright, a phone on its side. Container queries on the stage itself choose the template; the window's size no longer
does.

What CSS cannot say is done by one small fit pass, run when a ResizeObserver says something changed:
- it hides an item marked `last` when the musts need its room;
- it aims the 3D view at the free part of the stage;
- it tells the parts through a new `layout` hook.

So no timer places anything.

A check, `layoutCheck()`, reports:
- every pair of overlays that overlap;
- anything outside the stage;
- clipped text.

It lives in `tools/` and runs in a new browser suite at five sizes (390 × 780, 844 × 390, 820 × 1180, 1400 × 860,
1920 × 1080; 1024 × 700 is recommended as a sixth), in eight states of a night. It lands first and alone, as CHECK rows,
so it measures today's faults before anything moves. It becomes MUST once the parts have moved.

Beside it, the marks' claims (de1cd20) become the page's one way for a part to change something shared:
`TitanicApp.claim(key, owner, value, rank)`, with one rule per key. The keys:
- the pace (the wake's `holdPace` with owners);
- the marks;
- the X-ray look;
- the hull's and the pieces' materials;
- the Night look's scene objects;
- the walk's keys.

The camera's planes are already declared per view (C-9).

It is built in four steps, after the wake's clock step 1:
- step 0: the check;
- step 1: the page's own grid;
- step 2: the parts into slots;
- step 3: the claims.

Each step is one commit through a join, with named suites. Z2 builds it, and each part's owner is told before their file
is touched.

## 1. The page today

Lines are this branch's at de1cd20, which join 7 merges. Main 7966a23's lines are earlier in two files:
- `site/app.js`, by about 215 lines past line 2000;
- `site/parts/75_deep.js`, by 72 lines past line 300 (main's `placeStrip` is at 313, where QC_C cited 312-341).

The tags:
- **read:** in the code;
- **derived:** reckoned from what was read;
- **bet:** not yet measured.

### 1.1 The skeleton (read)

- `#app` is a grid: the stage, and a panel 384 px wide (`styles.css:54`).
  - At a window of 900 px and under, the panel goes below the stage (`220-237`).
  - At 520 px and under, the readouts and the view bar stack (`238-245`).
- A phone gets the stage at full height, with the panel as a bottom sheet (`styles.css:247-276`). A phone is a coarse
  pointer with a short side under 600 px (`app.js:35-41`).
- A tablet (any other coarse pointer) has a class but no rule of its own.
- Every overlay is `position: absolute` in `#stage` (`styles.css:55`).
- The readouts and the view bar share one flex row, `.hud` (`64`), and the readouts are at most 520 px wide (`66`). The
  bar is two rows of buttons that never wrap (`92-94`).
- The breakpoints key on the window. Beside the panel (a window over 900 px), though, the stage is the window less
  384 px: at a 901 px window the stage is 517 px wide, narrower than at 900 px, where it takes the full width. No rule
  looks at the stage, at its height, or at the orientation.
- `resize()` draws the 3D view's centre 12 % higher on a watch (3 % on a phone), because the Bridge covers the stage's
  foot (`app.js:3252`). It knows about the Bridge and nothing else.
- The Bridge stays shown through a whole watch, after the flag too (`app.js:1629-1631`: hidden only when the watch is
  left). So whatever stands at the stage's foot on a watch shares it with the Bridge until the end.

### 1.2 Four placers (read)

| Placer | What it places | What it reads | When it runs |
|---|---|---|---|
| `app.js:93-104`, `toast()` | the notice: just above the Bridge on a watch (on a desktop) | `#bridge` | at each notice |
| `40_night_end.js:133-152`, `place()` | the end card, below the boats' count (and, on a phone, below the readouts) | `#readout`, `#boatsChip` | when the card shows, then every 250 ms (`152`) |
| `80_director.js:288-334`, `place()` | the caption: the first of four candidate places that covers nothing, or hidden if there is none | hard: `#readout`, `#bridge`, `#endCard`, `.views`, `.strip`; soft: `#toast`, `#boatsChip`, `#rpToast` (`304-305`) | at each caption; at `foundered` and `clear` (`273-274`); every 250 ms; and whenever the card or the readouts move (`327-334`) |
| `75_deep.js:381-413`, `placeStrip()` | the deep's strip at the stage's right edge, between the bar and readouts above and the Bridge and diagram below. It sets `--deep-w`, `--deep-ro` and `--deep-rob`, which move the count and the end card (`75_deep.css:33-35`, `47-48`) | `.views`, `#readout`, `#bridge`, `.strip` | when the deep shows, every 250 ms (`510`), and on resize (`603`) |

They form a chain. The deep's strip moves the count (through `--deep-rob`); the card follows the count; the caption
follows the card. Each link polls at 250 ms. So a change in the readouts, such as a line the deep adds at the flag, can
take about a second to settle along the chain (derived: four links of up to 250 ms each). Meanwhile the overlays may cover
each other.

Each placer also carries constants copied from the stylesheets:
- `75_deep.js:388`: margins of 8 and 12 px, and widths of 80 and 100 px;
- `40_night_end.js:149`: 46 and 12 px;
- `80_director.js:306`: 380 px.

One gap, read: the caption's hard list names `.strip`, which is the damage diagram, but not the deep's strip
(`.deep-strip`). So nothing keeps the caption off the deep's strip. The inventory listed that pair as unchecked; nothing
places them apart either.

### 1.3 Offsets that guess another's size (read; the guesses derived)

| Offset | What it guesses |
|---|---|
| the Bridge at `bottom: 142px` (`styles.css:109`); 108 px at 900 and under (`232`); 96 px on a phone (`261`) | the damage diagram's height |
| the notice at `bottom: 140px` (`102`); 100 px (`229`); 96 px on a phone (`260`) | the diagram's height |
| the notice on a watch at `350px` (`105`); 282 px (`233`); on a phone `top: 190px` (`262`) | the Bridge's height (on a desktop the placer overrides it, `app.js:95-99`, because the Bridge had outgrown 350 px); on a phone, the readouts' and the bar's |
| the boats' count at `top: 12px + 88px` (`50_boats.css:3`); 196 px on a phone (`18`) | the view bar's two rows; on a phone, the readouts and the bar |
| the end card at `top: 104px` and `max-height: calc(100% - 150px)` (`40_night_end.css:4`); 138 px on a phone (`12`) | the bar's height, and the diagram's |
| the walk's pad at `bottom: 150px` (`76_walk.css:4`); 78 px on a phone (`12`) | the diagram's height. On a phone the diagram is about 91 px tall, so the pad would cover about 13 px of it (derived, never measured) |

There are also safe-area slips:
- the phone's notice adds `--sab` (`styles.css:260`), inside a stage whose foot already leaves it out (`249`), so it is
  counted twice;
- the phone's Bridge does not add it (`261`), which is right there.

### 1.4 The view bar (read; the widths derived)

- The camera row: 7 buttons in the template (`index.template.html:56-62`), plus Nest and Boat
  (`20_night_scene.js:486-489`). Nine.
- The display row: 4 in the template (`65-68`), plus Night (`20_night_scene.js:483-484`), Wake (`25_wake.js:245-249`),
  Director (`80_director.js:128-132`) and Walk (`76_walk.js:339-342`). Eight.
- The deep's four views sit in its own strip (`75_deep.js:113-119`).

At 1400 × 860 the wider row is about 520 to 540 px. That leaves the readouts about 458 px of their 520, as
`styles.css:81-85` records. Join 4 showed that about 45 px less wraps them (`CHANGELOG.md:63-67`, cited by QC_C).

At a 1024 px window the stage is 640 px wide, and the bar leaves the readouts about 80 px (derived; a bet until measured).
The next view button anyone adds breaks the desktop row again.

### 1.5 Layers (read)

| z-index | Elements |
|---|---|
| none | the HUD, the notice, the Bridge, the diagram |
| 2 | the count, the deep's strip |
| 3 | the no-WebGL box, the walk's veil, the caption |
| 4 | the end card |
| 5 | the walk's pad; the phone's sheet |

Where the placers miss, the ladder decides what covers what.

### 1.6 What is tested (read)

Every browser suite runs at 1400 × 860 (`tools/cdp.js`), and twelve add a phone upright at 390 × 780, DPR 2. No suite in
the gate runs:
- a tablet;
- a phone on its side;
- a narrow desktop;
- a window of 900 px and under without touch.

(`tools/site_test.js`, which runs on Playwright outside the gate, has an iPad among its devices.)

The suites' own layout rows, by pixel or by element:

| Suite | Rows |
|---|---|
| boats_site | 94-97, 106-108, 214-221 |
| deep_site | 167-169, 196-220, 356-360, 417-434 |
| director_site | 177-180, 271-274 |
| girder_site | 52-57, 149-161 |
| help_site | 118-124 |
| night_end_site | 193-195 |
| night_scene_site | 211-223 |
| night_site | 292-296 |
| reports_site | 99-117, 150-163 |
| walk_site | 192-200 |
| wake_site | 183-189 |

`out/night_site_test.txt:18` holds the phone's pixel positions, and it is tracked, so any move makes it STALE.

Checked nowhere:
- the notice against the Bridge on a phone;
- `#rpToast`;
- the end card against the Bridge or the diagram;
- the caption against the deep's strip or the walk's pad;
- the walk's pad on a desktop;
- the phone's card against the bar.

### 1.7 Faults on record (read)

- The notice lay under the Bridge: the stylesheet's 350 px had been outgrown (the comment at `app.js:95-97`).
- Join 4's boats_site: the readouts wrapped (`CHANGELOG.md:63-67`).
- Join 5's director_site phone row (`CHANGELOG.md:32-35`).
- A caption left where the end card had been (the comment at `80_director.js:324-326`: join 5's gate).
- G9: on a phone the Foundered card has 4 px to spare (Z2's guard row, 8028360).

## 2. The design: slots in one grid

### 2.1 One layer, with areas named by role

`#stage` keeps only:
- the canvas;
- the modal layers (the no-WebGL box, the walk's veil).

Every other overlay moves into one new layer, `#hud`: a grid over the whole stage, with `pointer-events: none`, so that a
drag on the empty parts still orbits the camera. Its areas are slot containers (`<div class="slot" data-area="stack">`, and so on), each a flex column
with `pointer-events: none`, while their children get `auto`. The areas are named by role, not by place, so each shape's
template can put them anywhere:

| Area | What it holds, in order | Its rule |
|---|---|---|
| `readouts` | the readouts, with every part's lines inside them (the deep's, the girder's) | grows with its lines; it has a floor of width, `--ro-floor` (300 px on a desktop) |
| `views` | the view bar's two rows | its rows wrap when the area is narrower than they are |
| `stack` | the boats' count (1), the end card (2) | a column under the bar. The card gets what is left and scrolls inside it (it already has `overflow-y: auto`) |
| `rail` | the deep's strip | at the stage's right edge, as wide as what is in it: 0, or the strip. The strip fills its height, so `--deep-w`, `--deep-ro` and `--deep-rob` go |
| `aside` | the walk's pad (1), the director's caption (2, marked `last`) | at the right, above the helm |
| `helm` | the Bridge. The notice rides just above it, out of flow (`position: absolute; bottom: calc(100% + 8px)`), as `app.js:95-99` puts it today, so a notice moves nothing else | at the foot, above the diagram |
| `diagram` | the damage diagram, and the reports' strip inside it | the foot |

A part never sets `top`, `left`, `bottom` or `right` on an overlay. It hands the overlay over:

```js
TitanicApp.slot(area, el, { order = 0, last = false })   // el moves into the area, in order; last: the fit pass may hide it
TitanicApp.addButton(row, el)                             // row 'camera' or 'display': a button into the view bar
TitanicApp.on('layout', (rects) => { ... })               // a sixth hook kind: after a layout, each area's rectangle
```

A part may still lay out the inside of its own element (the deep's column and marks, `75_deep.js:409-412` and its
`placeMarks`). It does that on the `layout` hook, or on a ResizeObserver of its own element, never on a timer.

### 2.2 The templates (a first cut; the build tunes them, with the check as the judge)

A desktop, and any stage wider than 520 px that is not a phone on its side:

```css
#stage { container: stage / size; }
#hud { position: absolute; inset: 0; pointer-events: none; display: grid; gap: 8px 12px;
  padding: calc(12px + var(--sat)) calc(12px + var(--sar)) calc(12px + var(--sab)) calc(12px + var(--sal));
  grid-template-columns: minmax(var(--ro-floor), 1fr) minmax(0, max-content) auto;
  grid-template-rows: auto minmax(0, 1fr) auto auto auto;
  grid-template-areas:
    "readouts views   rail"
    "readouts stack   rail"
    ".        aside   rail"
    "helm     helm    rail"
    "diagram  diagram diagram"; }
```

Reckoned at 1400 × 860 on a watch (derived; the heights are today's, measured by eye from the stylesheets):
- **The width.** The stage is 1016 × 860, so the content area is 992 × 836.
  - The bar's column takes its own width, 540 px.
  - The readouts get 440 px (today 458).
  - The Bridge spans both columns and keeps its 580 px.
- **The height.** Rows: the bar 74 px, the caption about 40, the Bridge about 200, the diagram about 123, plus four gaps.
  That leaves about 367 px for the stack.
  - The card fits in that or scrolls.
  - On a preset, with no Bridge, the stack has about 567 px.
- **The deep's strip.** It runs from the top to the diagram, beside the Bridge, as it does today; today it starts under
  the bar, and here it starts at the top. While the deep shows, the bar and the readouts move left by the strip's width
  (about 120 px). The readouts' values then go to a second row whole, as `styles.css:84-85` already allows.

A tablet (820 × 1180: a stage of 820 × 708, the panel below) and a narrow desktop (1024 × 700: a stage of 640 × 700)
use the same template. The readouts keep their floor, and the bar's column gets the rest (484 and 304 px): its rows wrap
(`.seg { flex-wrap: wrap }` once it sits in a column with a limit). That is the yielding side QC_C asked to choose: **the
bar wraps, and the readouts keep a floor.**

A phone upright, or any stage of 520 px and under:

```css
@container stage (max-width: 520px) {
  #hud { grid-template-columns: minmax(0, 1fr) auto;
    grid-template-rows: auto auto minmax(0, 1fr) auto auto auto;
    grid-template-areas:
      "readouts readouts"
      "views    views"
      "stack    rail"
      "aside    rail"
      "helm     helm"
      "diagram  diagram"; } }
```

On a phone the strip starts under the readouts and the bar, and stops above the Bridge, as it does today
(`75_deep.js:394-395`: "never past the Bridge or the damage diagram, however little that is").

A phone on its side (844 × 390: a stage of 844 × 336, the sheet's bar of 54 px below it):

```css
@container stage (orientation: landscape) and (max-height: 420px) {
  #hud { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
    grid-template-rows: auto minmax(0, 1fr) auto auto;
    grid-template-areas:
      "readouts views   rail"
      "stack    aside   rail"
      "stack    helm    rail"
      "diagram  diagram diagram"; }
  #stage.watch #hud > [data-area="diagram"] { display: none; }    /* D5: what a phone on its side gives up */ }
```

The phone on its side is the hardest shape: 336 px of height for the readouts (about 110 px), the Bridge (about 180) and
the diagram (about 80) cannot be stacked (derived). This template puts the Bridge beside the readouts. The right column
then holds the bar (two rows, about 80 px), the caption, and the Bridge: about 316 px of the 320 there are. While the
Bridge shows, the diagram gives way (decision D5).

The phone's touch sizing (40 px targets, smaller type) stays on `html[data-device="phone"]`. The templates key on the
stage. The panel's own media queries (the stacking of `#app` at 900 px and under) stay as they are, because they are
about the window.

Is `container-type: size` safe on `#stage`? Size containment needs the stage's size not to depend on its content. Its
size comes from `#app` (a fixed row at 900 px and under; full height beside the panel), or from fixed insets on a phone
(derived from `styles.css:54`, `221`, `249`). If that were wrong, the stage would collapse to nothing, and the check's
first row would say so.

### 2.3 The fit pass (about forty lines in `app.js`)

It runs from one ResizeObserver, on `#hud`, its areas, and every element handed to `slot()`. Calls are batched into the
next frame. It does three things.

1. **The `last` items.** If any must item is clipped (its area's `scrollHeight` exceeds its `clientHeight` by more than
   1 px), the `last` items are hidden, the last one first. A hidden one shows again once its area has room for the height
   it had when last shown. There is no flicker, because the test uses that remembered height, not a trial show.
   - The musts: the readouts, the bar, the Bridge, the diagram, the end card.
   - Today the only `last` item is the caption.
2. **The 3D view's centre.** The free part of the stage is reckoned from the grid's own tracks
   (`getComputedStyle(hud).gridTemplateRows` and `gridTemplateColumns` give them in pixels):
   - its top: the bar's foot;
   - its bottom: the helm's top, or the diagram's where there is no Bridge;
   - its sides: the stage's left edge and the rail's left edge.

   `camera.setViewOffset` centres the scene there. This replaces `app.js:3252`'s 12 % and 3 %. Reckoned at 1400 × 860 on
   a watch, the centre moves up about 14.5 % (derived), close to today's 12.
3. **The parts.** `fire('layout', rects)`.

There is no timer, so the wake's guard loses three lines from its pending list (section 6).

### 2.4 What changes on screen (for Bo, and for the director's lane)

- **The caption.** It no longer takes the first free place among four. It stands in `aside`, at the right above the
  Bridge's row. On a preset that is just above the diagram; on a phone, above the Bridge. It is hidden when the musts need
  the room, as today's code hides it when no place is free. QC_C named this risk: it reads differently. It is also kept
  off the deep's strip by construction (1.2).
- **A narrow desktop.** The bar's rows wrap, so the readouts no longer go to nothing.
- **A phone on its side** gets a layout of its own (D5).
- **While the deep shows,** the bar and the readouts stand left of its strip on a desktop. Today the strip starts under
  the bar.
- **The notice** stays where it is today: above the Bridge at its left edge on a watch, and centred above the foot
  otherwise.

### 2.5 Why a grid, and not one placer

The coordinator offered either "CSS grid areas (or one placer)". This design takes the grid:

1. **One pass.** The browser lays the overlays out from their true sizes, in the same pass that paints them. Nothing is a
   frame late, nothing polls every 250 ms, and there is no chain.
2. **The order is written once.** "The card under the count" is the order of a column in one stylesheet, not a rectangle
   read and a number written.
3. **Each number lives in one place.** No constant is copied from the CSS into JS.
4. **It costs nothing per frame,** and it works without WebGL. (Today the placers run with no 3D view.)
5. **The wake's guard wants few timers** on the page (DESIGN_virtual_clock v1.1, 3.6), and three of its pending lines are
   the placers.
6. **The reading order.** The template's order becomes the order of the DOM, which is the order a screen reader and the
   Tab key follow. Today that order is the template's history.

One placer in JS would keep reading rectangles that it moves itself, and it would run after layout, a frame late at
best. Its order table would be the same knowledge written in a second language. Its one advantage is choosing among
candidate places, as the caption does today. That is the one thing this design gives up, on purpose: a fixed place with a
rule for hiding is predictable, and testable.

## 3. The check: `layoutCheck()`

### 3.1 What it is

A pure function of the DOM, in `tools/layout_check.js`, which a suite evaluates in the page. No page code needs it, so it
can land before anything moves. The page may expose it later as `TitanicApp.layoutCheck`, for exploring.

```js
// layoutCheck({ sheetOpen }) -> { faults: [ ... ], notes: [ ... ], boxes: { name: [x, y, w, h] } }
// the overlays: every child of a [data-area] slot once step 1 has landed; before it, this fixed list
const BEFORE = ['#readout', '.views', '#boatsChip', '#endCard', '.dir-cap', '.deep-strip', '.walk-pad', '#bridge', '.strip',
  '#toast.on', '#rpToast'];
```

**Shown** means all of:
- in the document and not `hidden`;
- `display` not `none` and `visibility` not `hidden`;
- opacity over 0.05;
- a rectangle of at least 2 × 2 px.

**Left out:**
- the modal layers;
- the phone's sheet while it is open: it is meant to cover, so the check runs with the sheet shut.

**Faults:**
1. **overlap:** two shown overlays whose rectangles meet by more than 1 px both ways (it names the pair and the size of
   the overlap);
2. **outside:** a shown overlay past the stage's edge by more than 0.5 px, or inside a safe-area inset;
3. **clipped:** an overlay whose content is cut by its own box. Its `scrollHeight` or `scrollWidth` exceeds its client
   box by more than 1 px while its `overflow` is not `auto` or `scroll`; or a button's label is wider than the button;
4. **missing:** a must item (the readouts, the bar, the Bridge on a watch, the diagram, the end card once she has
   foundered) hidden or of no size where its state says it shows.

**Notes, not faults:**
- a `last` item the fit pass hid;
- tap targets under 40 px on a touch device (the stylesheet's own floor, `styles.css:268`);
- the free part's share of the stage.

### 3.2 The sizes

| Shape | Window | DPR | Touch | Device class | Stage (derived) |
|---|---|---|---|---|---|
| a phone upright | 390 × 780 | 2 | yes | phone | 390 × 726 |
| a phone on its side | 844 × 390 | 3 | yes | phone | 844 × 336 |
| a tablet | 820 × 1180 | 2 | yes | tablet | 820 × 708 (the panel below) |
| the gate's desktop | 1400 × 860 | 1 | no | desktop | 1016 × 860 |
| a wide desktop | 1920 × 1080 | 1 | no | desktop | 1536 × 1080 |
| (recommended, D2) a narrow desktop | 1024 × 700 | 1 | no | desktop | 640 × 700: where the bar and the readouts meet first |

The phones and the tablet use `tools/cdp.js`'s phone emulation, as the twelve phone suites do, with these sizes. QC_C's
S2 also named 900 × 700 and 520 × 800 (the stacked layout without touch). The tablet covers the stacked layout with
touch, and the narrow desktop covers the bar.

**The states,** at each size. Each is reached by stopping the page's clock on a step (`holdWhen`), never by polling:
1. the 1912 preset running;
2. a watch on the bridge, before the ice;
3. after the ice: the boats' count and a notice;
4. the reports' view ("As the bridge knew it"), with its notice;
5. the Night look, with Nest and Boat in the bar;
6. the walk, with its pad;
7. foundered: the end card, the count, the director's caption;
8. the deep at rest: its strip, its lines in the readouts, the count and the card beside it.

`tools/fall_stub.js` gives state 8 in seconds on a preset, as deep_site does.

**Time:** about ten minutes for six sizes and eight states, a bet. It takes a browser turn.

### 3.3 How it enters the gate

- **Step 0.** `tools/layout_site_test.js` goes in the gate, with every fault as a CHECK row: printed, failing visibly, but
  not failing the suite. Its list of faults is written to `out/layout_site_test.txt`, which is tracked: when the faults
  change, the gate says STALE, and a lane sees what it moved.
  - Today's faults are the baseline. Expected (bets): the phone on its side, for certain; the narrow desktop's bar; the
    walk's pad over the phone's diagram; the caption over the deep's strip at some size.
- **Step 2's commit** turns the rows into MUST and the table into "no faults".
- **Any part's suite** may call the same function in its own states, in one line, so that a lane's change fails in its
  own suite, at every size, before the join.

## 4. Claims for what parts change

### 4.1 The rule

```js
TitanicApp.claim(key, owner, value, rank = 0)   // undefined or null releases the owner's claim
TitanicApp.claims(key)                           // [{ owner, value, rank, n }], n being the claim's order (for the tests)
```

The page resolves every key once a frame, before it draws, by that key's rule in one table (`RULES` in `app.js`). No part
saves or gives back another's value: when the last claim goes, the page's own rule is back. The marks'
`TitanicApp.marks.claim(kind, who, on)` (de1cd20) stays as another name for `claim('marks.' + kind, who, on || null)`.

The four rules:
- **any:** in force while any claim stands (the marks, the pace).
- **rank:** the highest rank's value wins. Between equal ranks the earlier claim wins (by `n`, never by the clock).
- **player-first:** the player's choice, unless claimed. A player's input while a claim stands is the later choice: the
  page tells each claimant (`event` `overruled`, `{ key, owner }`), and the claimant decides. The Night look turns itself
  off, as it does today when X-ray is chosen; the bridge's view turns off. C-5's fix was this rule, made by hand.
- **declared:** the view's own setting (`VIEWS[name]`). Not a claim.

### 4.2 The keys

| Key | Who writes it today (de1cd20) | Rule | Claimants | Step |
|---|---|---|---|---|
| `pace` | `holdPace` (`app.js:3175`: one hold, which a later one replaces); `60_reports.js` 91-93; `80_director.js` 206, 247, 273; `76_walk.js` 322, 331, 350 | any: held at her own pace while any owner's hold runs. The API is the wake's `holdPace(seconds, owner)` (its 3.5) | `'reports'`, `'director'`, `'walk'` | owners arrive neutral in the wake's step 1; the parts pass them in step 3, with C-7's row |
| `marks.openings`, `marks.dents` | built (de1cd20) | any (hidden) | `'night'`, `'bridge'` | done |
| `look.xray` | `applyLook` (`app.js:2018-2037`) on `S.xray`; clicks on `#bXray` from `20_night_scene.js` (306-307, 337, 475) and `60_reports.js` (111, 117, 127); a damage tool sets `S.xray` without a click (`app.js:2046`) | player-first | `'night'` (off), `'bridge'` (off) | 3 |
| `material.hull` | `applyLook` (2019); the Night look's swap (`20_night_scene.js` 360, put back at 327; its comment: "applyLook may have run again") | rank, over the look's own | `'night'` | 3 |
| `material.pieces` | `pieceLook` (`app.js:3087`), from `75_deep.js` 378 and 489 | rank, over the hull's resolved material, cut for each piece | `'deep'` | 3 |
| `scene.*`: the sky, sea, stars, lights and emissives, the track and course, the berg; the page's ribbon, bow wave and Kelvin lines | `20_night_scene.js` saves them and gives them back (358-375, 324-330); `25_wake.js` hides the ribbon, bow wave and lines while its own layers show, and puts them back (CLAUDE.md, the wake) | rank, for each object and property (visible, material) | `'night'`, `'wake'` | 3, after the hull |
| `camera.near`, `camera.far` | `fallCamera` (`app.js:3159-3168`) | declared: `VIEWS.near` (C-9), and the fall's rule by distance while she falls | none | done (1f2deb0) |
| `camera.fov` | `setView` | declared: `VIEWS[name].fov` | none | today |
| `camera.pose` | the camera hooks; each already returns early for a view not its own (`20_night_scene.js:425`, `75_deep.js:521`, `76_walk.js:272`) | declared, by that convention | none | 3: one row that no two hooks place one view |
| `keys` | `76_walk.js`'s keydown (285) takes them first; the page has its own wheel keys | rank: the walk claims its keys while walking, and the page's handlers skip a claimed key | `'walk'` | 3 |

No two parts today claim different values for the same key (read, from the table). The ranks are there for the first
pair that will. QC_C's example was the Night look over the bridge's view.

### 4.3 What proves it

- **One row per key** (in night_site, or in a section of layout_site): claim, claim, then release in both orders. At each
  step the page's state is what the rule says, and with no claim it is the page's own. C-5's row (real clicks) is the
  pattern.
- **C-7's row** (the wake's 3.5): the reports' release does not end the director's hold, nor the other way round.
- **One row for every pair of looks.** It toggles every pair (X-ray, Night, the bridge's view, the walk, the deep's lamp)
  in both orders, and compares the page's flags with where they started (QC_C's S3, its first step).

## 5. The order of the moves

Each step is one commit through a join, with its suites. No step depends on a later one.

| Step | What | Files | Suites | Lands |
|---|---|---|---|---|
| 0 | the check, alone | new: `tools/layout_check.js`, `tools/layout_site_test.js`, `out/layout_site_test.txt`; one line in `tools/gate.js` | layout_site (CHECK rows) | the headless code any time; its first run in a browser turn after join 8's gate |
| 1 | the page's own grid: `#hud` and its areas; the page's overlays moved (the readouts, the bar, the Bridge, the notice, the diagram); the container queries; the fit pass; the 3D view's centre; `slot`, `addButton` and the `layout` hook; the parts' buttons through `addButton` (one line each in four parts) | `site/index.template.html`, `site/styles.css`, `site/app.js`; the button lines of `20_night_scene.js`, `25_wake.js`, `80_director.js`, `76_walk.js` | every browser suite. night_site's `out/` table is rewritten with `--write`, its phone positions moving as meant, and the commit says so | after the wake's step 1 is on main |
| 2 | the parts' overlays into slots, each placer and offset removed (the table below) | the six parts below | layout_site turns MUST; the boats, night_end, director, deep, walk, reports and night_scene suites, each suite's layout rows turned from pixels into relations ("below", "clear of", "inside the stage") | after step 1 |
| 3 | the claims | `app.js` (`RULES`, `claim`, `claims`, the marks' other name); `20_night_scene.js`, `60_reports.js`, `75_deep.js`, `76_walk.js`, `25_wake.js`, `80_director.js` | night_site, night_scene_site, reports_site, deep_site, walk_site, wake_site, director_site; the rows of 4.3 | after step 2, or beside it |

Each part's move:

| Part | Today | It moves to | Step | What goes |
|---|---|---|---|---|
| the page (`app.js`, the template, `styles.css`) | `.hud` as a flex row; `toast()`'s placement (95-99); `resize()`'s 12 % (3252); the offsets of 1.3 | `#hud`; the notice riding above `helm`; the centre from the tracks | 1 | `app.js:95-99`; the guess at 3252; `styles.css`'s overlay offsets (102-109, 229-233, 257-262), while the panel's rules stay |
| `50_boats` | `top: 88px` (`.css:3`), and 196 px on a phone (`:18`) | `stack`, order 1 | 2 | both offsets, and `75_deep.css:47-48`'s moves of it |
| `40_night_end` | `top: 104px` (`.css:4`) and 138 px (`:12`); `place()` every 250 ms (133-152) | `stack`, order 2; its height from the column | 2 | `place()` and its frame hook; both offsets; `75_deep.css:33-35` |
| `80_director` | `place()` among four candidates (288-323), every 250 ms (327-334), and on `foundered` and `clear` (273-274) | `aside`, `last` | 2 | the search and its frame placer. Line 284's five seconds stay, and the wake's step 4 moves them onto `TitanicApp.after` |
| `75_deep` | `placeStrip()` (381-413), every 250 ms (510) and on resize (603); `--deep-w`, `--deep-ro`, `--deep-rob` | `rail`; the column inside it, on `layout` | 2 | lines 385-406's placement and the three properties; `75_deep.css:33-35` and `47-48` |
| `76_walk` | `bottom: 150px` (`.css:4`) and 78 px (`:12`); z-index 5 | `aside`, order 1 | 2 | both offsets |
| `60_reports` | under `html.rp-bridge` it hides parts of the page (`.css:16-22`); its own notice, `#rpToast`; its strip inside the diagram (`.css:27`) | its notice rides above `helm`, as the page's does. The hiding stays a class, now on `#hud` | 2 | its notice's own placement |
| `20_night_scene`, `25_wake`, `80_director`, `76_walk` | they append buttons to the bar's rows | `addButton` | 1 | the direct appends |
| `55_girder`, `70_help` | lines inside the readouts; the help, inside the panel | unchanged: the readouts' area grows by flow | none | nothing |

**Papers for the coordinator,** whose CLAUDE.md is the house's own:
- the `layout` hook in the parts' line;
- `slot`, `addButton` and `claim` in the parts' rules ("a part never places its overlay");
- the check's line and its command;
- the User Guide's pictures, retaken after step 2 (U0's lane).

The size of each step (bets):
- step 0: about 300 lines of tools;
- step 1: about half a day, and the full gate;
- step 2: about half a day, plus re-reading every layout row once;
- step 3: about half a day.

## 6. With the wake's clock, the neighbour

The agreement with the wake (01:0x CST, 11-21), as the wake's design v1.1 records it (its decisions 5 and 6, its 3.5, and
its table of lines):
- `holdPace`'s owner arrives in the wake's step 1, neutral. C-7 is finished in this design's build: the parts pass their
  owners, with C-7's own row.
- The wake's step 4 converts the director's lines 284, 300 and 329-333.
  - This build deletes 300 and 329-333, along with the placer.
  - Line 284, the caption's five seconds, goes with the caption into its slot, as a timer on `TitanicApp.after`.
- night_end's and the deep's 250 ms placers stay on the wake's guard's pending list, owned by this build, which removes
  them.
- The notice keeps the wake's `TitanicApp.after` timer. This build moves only where the notice stands.
- This build comes after the wake's step 1, rebased onto it. The wake tells Z2 before it touches `app.js`.

## 7. Decisions needed (who decides)

1. **The grid with a fit pass, or one placer?** The grid is recommended (2.5). The coordinator decides.
2. **The sizes.** The five asked for, plus a narrow desktop of 1024 × 700, are recommended (3.2). The coordinator
   decides.
3. **Who builds it.** Z2 is recommended: it wrote this, and owns two of the six parts that move. One lane, after the
   wake's step 1, with each part's owner told before their file is touched (the director's lane, the boats', the end
   card's, the reports'). The coordinator decides.
4. **When CHECK becomes MUST.** At step 2's commit is recommended. The coordinator decides.
5. **What a phone on its side gives up while the Bridge shows.** The diagram is recommended. This is Bo's to decide, or
   the coordinator's on his behalf, under his standing word.
6. **The caption.** A fixed place in `aside`, hidden when the musts need the room, is recommended. The coordinator
   decides, with the director's lane told.
7. **The keys and the camera's pose.** Whether they join step 3 or wait. The coordinator decides.

## 8. Risks

| Risk | What answers it |
|---|---|
| Every overlay moves, so pictures and pixel rows change: night_site's tracked phone positions, the User Guide's pictures, the suites' layout rows | Step 1 is a commit of its own, rewriting night_site's table with `--write` and saying why. The rows become relations in step 2. The guide is retaken after step 2 |
| A half-moved page has two authorities | The grid tolerates an overlay that has not moved yet (it stays absolute, above the grid), and the check flags it wherever it overlaps. Step 2 moves all six parts in one commit |
| Lanes edit the parts that move while the build runs | One lane builds it. Each owner is told before their file is touched, and the build is rebased once, onto the join it lands in |
| Container queries and `flex-wrap` in a limited column behave otherwise on a browser the gate never runs | Edge 157 runs all of them (Chromium has had size container queries since 105: read from knowledge, a bet here until step 0 runs). `tools/site_test.js`'s other engines are outside the gate, as they are today |
| The 3D view's centre moves a little (from 12 % to about 14.5 % on a watch at 1400 × 860) | It is appearance, and nothing reads it but the pictures: retaken with step 1 |
| The phone on its side may still not fit when the Bridge shows | The check says so in step 0 before anything moves. Then D5's answer (the diagram gives way) has a row |
| The fit pass hides and shows the caption back and forth | It shows a `last` item again only when its area has room for the height it last had, never by trying |
| A part forgets to release a claim | A new run releases every claim, as a new run ends every hold today. Each rule's row checks that owners release their own |

## 9. Sources

**Read for this note**, in Z2's worktree at de1cd20:
- `site/styles.css` (40-114, 214-277);
- `site/app.js` (30-105, 1622-1633, 3150-3259);
- `site/index.template.html` (35-118);
- `site/parts/75_deep.js` (370-419);
- `site/parts/40_night_end.js` (125-156);
- `site/parts/80_director.js` (180-339);
- the camera hooks in `20_night_scene.js` (424-427), `75_deep.js` (520-523) and `76_walk.js` (271-274);
- every `top`, `bottom`, `max-height` and `z-index` in `site/parts/*.css`;
- the setView and holdPace calls in `site/parts/*.js`;
- main's `placeStrip`, `toast`, `holdPace`, `fallCamera` and `resize` lines, through `git show main:`.

**The inventory.** A read-only Opus subagent (max effort), in this session, from 00:5x CST, gave the inventory: the four
placers, the offsets, the skeleton, the bar, the layers, the shared state, the suites' layout rows and the F items. Its
line numbers were checked by Z2 where this note cites them:
- placeStrip is at 385-413 here, 381 with its comment;
- the 900 px rules begin at line 220.

**The QC:**
- QC_C_viewer_build_tests_2026-11-20.md: C-4 (61-74), S2 (248-252), S3 (254-258);
- QC_00_SYNTHESIS_2026-11-20.md, item 8.

**The neighbour:** `C:\temp\titanic-wt-wake\docs\DESIGN_virtual_clock_v1_1_2026-11-21.md`, grepped for its decisions 5
and 6, 3.5, 3.6, its table of lines, and its steps.

**Not checked:**
- nothing was run in a browser for this note;
- the heights used in 2.2 and 2.3 (the bar 74 px, the Bridge about 200, the diagram about 123, the readouts about 110
  on a phone) are reckoned from the stylesheets, not measured;
- the faults expected in step 0 are bets;
- whether `tools/cdp.js`'s phone emulation takes 844 × 390 at DPR 3 as a coarse pointer was not tried;
- CHANGELOG.md's lines are cited through QC_C, not re-read.
