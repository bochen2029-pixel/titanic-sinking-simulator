# BRAINSTORM: the Titanic simulator as a portable Electron client, the mainline's take (v1)

- **Written:** 2026-11-20 14:15 CST, by the mainline session "Titanic simulator model accuracy" (Claude Code desktop,
  Opus 5.5), at Bo's ask: "see and read all this and give me your thoughts on how (as brainstorm) the current titanic
  sinking sim repo could be made to be electron client etc etc".
- **Status:** advice only; nothing here is a decision. Bo's one decision so far, quoted in the design v2: "i do want to
  have electron client so it can be packaged as portable for windows pc and as a zip etc; without needing to mess with
  browsers, ports, etc".
- **Supersedes:** none. It is a second opinion beside `docs/DESIGN_electron_desktop_client_v2_2026-11-20.md` (another
  session's), which it does not replace.
- **Lineage:** that design v2 (read whole); `tools/cdp.js` (read: how the browser suites start and address the page);
  `CLAUDE.md`'s rules on the seams gate and the gate; the mainline's work on the core today (C3).
- **Tags:** [M] measured, [R] read, [D] derived, [B] bet.

## The answer in one paragraph

Build it the way v2 says: Fathom's shell copied, the page served from its own `titanic://app/` scheme, no port, no
network, no `preload.js`, settings in `data/` beside the exe, a zip written by `tar.exe`. v2 is sound and I would not
redesign it. I would change three things.
- **Order.** Put the core's own sine and cosine in first (v2's E1). It moves no bit under Node, so it costs no refreeze
  and no cascade, and it makes the tools, the page and the app one engine for the first time. Then build the app. Then
  port the other 56 calls one function at a time.
- **Testing.** Test the app with the browser suites we already have, not a bespoke self-test. `tools/cdp.js` can drive
  the app as it drives Edge.
- **The runtime.** Treat it as a pinned input that this repository owns, not a folder in another project's
  `node_modules`.

## 1. What I would keep from v2 as it stands

- **The shell:** the scheme of its own, every network request cancelled, sandboxed, context-isolated, no Node in the
  window. Also: new windows denied, one instance, `--open=<fragment>` with the page's own grammar, not throttled in
  the background.
- **Portability:**
  - `data/` beside the exe, with the system's place as the fallback;
  - the locales trimmed (about 140 MB zipped);
  - `runtime.json` with the exe's sha256;
  - the README that says "unzip first".
- **The page's four small changes**, each behind a check of the address, so the web page is untouched.
- **The finding that `Math.pow` was never the cause** [M in v2]. The three places that blame it (`tools/seams.js`'s
  header, the README, backlog X1) should be corrected in the same commit as E1, so the record and the fix arrive
  together.

## 2. The engine: E1 first, now; E2 by function; E3 as the test

What E1 buys, in plain terms. Today the browser suites cannot compare the page with the tools' pins, so they compare it
with "the model alone in the page". Edge and Node part in the last bits (X1: the 1912 watch founders at 9,492.5 s in
Node, 9,493.75 s in Edge). v2 measured why: `sin` and `cos`, about 3.5 % of angles, one unit in the last place.

- **Inside the zip** every PC runs the same V8, so a night replays the same on every PC with or without the port. That
  is v2's own point (section 6.3), and it is why the app need not wait for E2.
- **Between the zip, the tools and the page** the port is what makes them agree. That lets:
  - the gate's pins hold in the app;
  - Carpathia's published best night replay to the same bits there;
  - a log made in the web page replay identically in the app.

E1 is cheap and checkable:

- **Small:** four calls a step in `poseFrame`, plus `scenarios.js`.
- **Self-proving:** it must move no bit under Node, and the gate already proves that, with the seams reference, the
  headway reference, the golden trace, the systems fingerprint and every table that the stale check watches. If any of
  them moves, stop: the port is not Node's on some input the night uses.
- **No conflict:** it doesn't collide with C3, which changes `step` and not `poseFrame`, and it moves no bit, so it can
  land before or after C3 without a cascade.

E2 (the other 56 calls in eight files) needs care, not speed:

- **One function at a time**, each checked as e70 checks `sin` and `cos`: the port against Node's own over a million
  inputs, then the gate unchanged.
- **A port that is not Node's stays native** and is recorded in X1. A refreeze to adopt it would be a separate decision,
  Bo's. That keeps E2 cascade-free by construction.
- **The viewer can keep `Math.*`:** drawing feeds nothing back. The readers and `night.js` are the model's side and go
  with E2.

E3 is then X1's own test: a watch's fingerprint equal in Node, in the app and in Edge, as a gate row.

My order: **E1 → the app (v2's D1 to D5) → E2, a function at a time → E3.** v2 leaves the order open (its decision 7);
I would not block the app on E2, and I would not build the app before E1. E1 is too cheap to skip, and without it the
app's tests start out unable to compare with the tools.

## 3. Test the app with the suites we already have

v2's D3 writes `tools/app_test.js`, a bespoke self-test. I would get most of its value for less.

- **`tools/cdp.js` already takes `BROWSER`** (line 14) and drives a page over the DevTools protocol, which Electron also
  speaks [R].
- **It needs an app mode:** with `APP=<path to Titanic.exe>` it would
  - start the exe with `--remote-debugging-port=N` and a throwaway profile;
  - serve nothing (the app has its own files);
  - navigate to `titanic://app/index.html#...` in place of `http://127.0.0.1:<port>/index.html#...` (line 63).

  `--headless=new` is Chrome's and does nothing in Electron, so the shell takes a `--hidden` flag for a window that is
  never shown.
- **Then every browser suite runs inside the real app unchanged:** `APP=... node tools/night_site_test.js`, and likewise
  `night_end_site`, `systems_site`, `topsides_site` and the rest. Twelve suites written for Edge become the app's
  acceptance at no cost but the app mode.
- **A gate row `app`**, outside `--quick`, reruns a chosen few inside the app (the watch, its end, Systems, the drawn
  ship). After E2 it adds the row only an app can have: the 1912 watch's fingerprint in the app equals the pin in
  `tools/systems_tests.js`.
- **v2's `--smoke` stays** for one job: the check a person runs on another PC ("run `Titanic.exe --smoke`"), where no
  Node and no repo are present.

## 4. The runtime is an input; pin it

v2 copies Electron 45.2.3 from `C:\code\ATC\apps\desktop\node_modules\electron\dist`. That folder belongs to another
project: an `npm install` there changes or removes it, and the app's packaging silently changes engine with it.

- **Copy it once into a place this repository owns,** outside git: for example
  `C:\code\titanic-sinking-simulator-backups\runtime\electron-45.2.3-win-x64\`, or `release/runtime/` (git-ignored).
- **Record every file's sha256 in a tracked `app/runtime.json`.** The packager refuses a runtime that does not match.
  v2 records only the exe's.
- **A new Electron is a deliberate change of that file,** with the app's suites rerun: until E2 is done, a new V8 can
  move bits.

## 5. The shell's security, beyond v2

- **The scheme's handler must stay inside `dist/`.** It should normalise the requested path and refuse `..` and absolute
  paths. Otherwise `titanic://app/../../...` reads any file the user can read.
- **Refuse every permission request** (`setPermissionRequestHandler`): camera, microphone, place, notifications. The
  page asks for none.
- **The headers from `dist/_headers`** (v2, item 1) carry the content policy. Check that the bundle has no inline script
  that `script-src 'self'` would stop. three.js r128 needs no `eval` [B].
- **`ELECTRON_RUN_AS_NODE`:** any Electron exe becomes a full Node when that variable is set. The fix is Electron's
  "RunAsNode" fuse, flipped at packaging, which needs a tool from npm. It belongs with signing and an installer (v2's
  option C), not the first zip.

## 6. Where it lives in the repository

- `app/main.js` (about 90 lines, v2 section 4) and `app/package.json` (name, version, main; no dependencies).
- `tools/package_app.js`: refuses a stale `dist/` (`node tools/build_site.js --check`), checks the runtime against
  `app/runtime.json`, writes `release/Titanic-win-x64/`, and with `--zip` the zip and its sha256.
- The app mode in `tools/cdp.js` (section 3) and the `app` gate row.
- `.gitignore`: `release/`. `CLAUDE.md`: one rule and the commands, which makes the User Guide stale, so it is rebuilt
  in the same commit. A paragraph in the guide's quick start.

## 7. Later, what only a desktop app adds

1. **A watch saved to a file and opened from one** (seed and log as JSON). After E2 a file made anywhere replays to the
   same bits anywhere, so this is where determinism pays the user directly.
2. **The Carpathia search from inside the app,** with its progress on screen. It wants Node's worker threads, which the
   app has in its main process, so a PC with no Node could run it.
3. The User Guide's PDF from a Help menu, offline.
4. A night recorded to a video file (a web page could do this too).
5. The engine in a worker (v2 section 8): a refactor of the page, not an app matter. Agreed.

## 8. Alternatives considered, and why not

- **Edge in an app window, or an installed web app:** no runtime to ship, but it depends on the browser on that PC and
  on that browser's engine, the thing Bo asked to be rid of ("without needing to mess with browsers").
- **A small C++ host on the system's WebView2, or Tauri:** a far smaller zip, but the engine is again the system's
  Edge, which differs between PCs and over time. Each also needs a toolchain this laptop doesn't use for the project.
- So **Electron is right for the reason Bo gave**: it freezes the engine inside the zip. The same fact is why E1 and E2
  are about agreeing with the tools and the page, not about agreeing between PCs.

## Decisions needed (who decides)

1. **E1 now** (my recommendation), and E2 by function after the app. It is backlog X1, a change to the core: Bo's, or
   the coordinator's under Bo's standing word ("for everything else you can decided on my behalf"), since it crosses
   the lanes' pins only if it moves a bit, which it must not.
2. **Who builds D1 to D5:** v2's author or a new lane. The coordinator assigns.
3. **The runtime's home** (section 4): Bo picks the folder.

## Risks

- **E2's bet** that fdlibm's other routines are Node's: handled per function, since a function that isn't stays native.
- **A path escape** in the scheme handler (section 5): one check, with a test row that asks for `../`.
- **A managed laptop** may refuse an unsigned exe [B]. The app is a personal project; check the policy before
  putting it on one.
- **The runtime drifting** under another project's `npm install` (section 4).
- **Graphics:** the page in Electron on integrated graphics is unmeasured (v2 section 10).

## Sources

- Read: `docs/DESIGN_electron_desktop_client_v2_2026-11-20.md` (whole); `tools/cdp.js` lines 1 to 63 (`findBrowser`,
  `launch`, `open`); `CLAUDE.md`.
- Taken from v2 as read there, not checked here: the e70 measurements, Fathom's `C:\fathom\app\main.js`, the ATC
  runtime folder, the sizes.
- Not read: the design v1, e70's code.
- Not run: anything in Electron.
