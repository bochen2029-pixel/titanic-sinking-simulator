// The director: one switch, and the camera tells the night. A part of the viewer (site/app.js, "parts").
//
//   - The switch "Director", first of the display toggles beside the view buttons. On, the part chooses the view at the
//     night's moments through TitanicApp.setView (never by moving the camera itself: every view keeps its own
//     behaviour) and, where a moment deserves it, holds the page at her own pace for a few seconds
//     (TitanicApp.holdPace), after which the player's pace goes on. Off, nothing of it acts. A view button the player
//     presses turns it off: the player has taken the camera, and a notice says so.
//   - The cut list (CUTS, below) is data: what triggers each cut (a count of the model's state, read each step: the cut
//     comes on the step the count goes up), the view, the seconds held at her own pace, the least time before the next
//     cut, a weight, whether it survives a very fast pace, how long it may wait for its turn, and its words.
//   - The rules (cut() and the 'step' hook): never two cuts within the least gap; never a cut during a hold, unless a
//     heavier row cuts into a lighter one's; at a very fast pace only the rows marked fast. Every choice is made on the
//     model's steps and the player's inputs (the switch, the pace, the Night look), never on the wall clock, so the same
//     watch gives the same cuts at the same steps.
//   - A caption, small and plain, for a few seconds at each cut: the ship's time, the moment, and the eye it is seen
//     from. It stands in the stage's aside (C-4), clear of every other overlay, and is the first to give way where the
//     readouts, the view buttons, the end card, the Bridge or the damage diagram need its room.
// It reads the model's state and gives no order: a watch has the same fingerprint with it as without
// (tools/director_site_test.js). Everything it chooses is [appearance]: which eye, when, for how long, the words.
(function () {
  'use strict';
  const A = window.TitanicApp, C = window.TitanicCore;
  if (!A || !A.setView || !A.holdPace || !A.pace) return;
  const S = A.state, $ = (id) => document.getElementById(id);
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };

  // ---------------------------------------------------------------- the cut list [appearance]
  //   run     'watch' (a night on the bridge), 'preset' (a damage preset: no watch) or 'any'
  //   when    a count of the model's state (COUNT, below); the cut comes on the step it goes up. nth: which of them cut
  //           (1: the first only; 'later': the second and after; none: each)
  //   view    the eye; day: the eye instead when the Night look is off (site/parts/20_night_scene.js). A list is taken
  //           in turn, one eye for each occurrence the row cuts at. An eye this build has not got gives way to day, then
  //           to Quarter. The row 'on' (the switch) takes the eye where the night stands: the view of the last row, in
  //           this order, that has happened and may be stood on (stand)
  //   hold    seconds of her time held at her own pace from the cut ('end': until she founders, at most END_HOLD); never
  //           less than the gap, so that the gap passes at her own pace (found on the 1912 damage at 240x: water over
  //           bulkhead H, a cut with no hold, kept her last minutes and her lights off with a gap that ran sixteen
  //           minutes of her time)
  //   gap     the least seconds of the player's time before the next cut (never under MIN_GAP). The player's time runs
  //           at her own pace while the watch is at the ice or a hold is on, and at the player's pace otherwise
  //   weight  a heavier row may cut during a lighter one's hold; its own hold then runs on to the later of the two ends
  //   fast    it cuts when the player's pace is very fast (FAST and over); the other rows are passed over then
  //   wait    seconds of the player's time a cut kept off by a hold or a gap may wait for its turn (0: then or never)
  //   stand   false: a passing moment, never the eye the switch starts on
  const CUTS = [
    { id: 'on', run: 'any', when: 'switch', view: null, hold: 0, gap: 3, weight: 1, fast: true, wait: 0, stand: false, say: 'the director has the camera' },
    // a watch
    { id: 'begins', run: 'watch', when: 'run', view: 'bridge', hold: 0, gap: 4, weight: 2, fast: true, wait: 0, say: 'the watch begins' },
    { id: 'bells', run: 'watch', when: 'bells', view: 'nest', hold: 6, gap: 4, weight: 6, fast: true, wait: 2, say: 'three bells: ice right ahead' },
    { id: 'touch', run: 'watch', when: 'touch', view: 'quarter', hold: 10, gap: 4, weight: 8, fast: true, wait: 2, say: 'she touches the ice' },
    { id: 'grind', run: 'watch', when: 'grind', view: 'bridge', hold: 0, gap: 4, weight: 3, fast: true, wait: 6, say: 'the ice has passed' },
    { id: 'missed', run: 'watch', when: 'missed', view: 'astern', hold: 4, gap: 4, weight: 6, fast: true, wait: 4, say: 'she passes clear of the ice' },
    { id: 'steam', run: 'watch', when: 'steam', view: 'profile', hold: 4, gap: 4, weight: 3, fast: false, wait: 2, say: 'her safety valves lift: steam roars from the funnels' },
    { id: 'report', run: 'watch', when: 'report', nth: 1, view: 'bridge', hold: 6, gap: 4, weight: 4, fast: false, wait: 4, say: 'the first report reaches the bridge' },
    { id: 'designer', run: 'watch', when: 'designer', view: 'profile', hold: 6, gap: 4, weight: 4, fast: false, wait: 4, say: 'the builder\'s man gives his reckoning' },
    { id: 'boat', run: 'watch', when: 'lowered', nth: 1, view: 'boat', day: 'quarter', hold: 8, gap: 5, weight: 6, fast: true, wait: 6, say: 'the first boat is lowered' },
    { id: 'rocket1', run: 'watch', when: 'rocket', nth: 1, view: 'plan', hold: 6, gap: 4, weight: 5, fast: true, wait: 1, stand: false, say: 'the first rocket' },
    { id: 'rocket', run: 'watch', when: 'rocket', nth: 'later', view: ['quarter', 'profile', 'boat'], day: ['quarter', 'profile', 'astern'], hold: 4, gap: 4, weight: 3, fast: false, wait: 1, stand: false, say: 'the {nth} rocket' },
    // a damage preset: the flooding itself
    { id: 'flooding', run: 'preset', when: 'run', view: 'quarter', hold: 0, gap: 4, weight: 2, fast: true, wait: 0, say: 'the sea comes in' },
    { id: 'over1', run: 'preset', when: 'over', nth: 1, view: 'profile', hold: 4, gap: 4, weight: 5, fast: true, wait: 4, say: 'water over bulkhead {bulkhead}' },
    { id: 'over', run: 'preset', when: 'over', nth: 'later', view: 'profile', hold: 0, gap: 4, weight: 3, fast: false, wait: 1, say: 'water over bulkhead {bulkhead}' },
    // either: the end
    { id: 'fcastle', run: 'any', when: 'fcastle', view: 'boat', day: 'profile', hold: 6, gap: 4, weight: 5, fast: false, wait: 4, say: 'her forecastle head goes under' },
    { id: 'last', run: 'any', when: 'last', view: 'boat', day: 'profile', hold: 'end', gap: 4, weight: 8, fast: true, wait: 30, say: '{last}' },
    { id: 'lights', run: 'any', when: 'dark', view: 'boat', day: 'profile', hold: 8, gap: 4, weight: 9, fast: true, wait: 30, say: '{lights}' },
    // G12's cascade (D98): a watch handed over at the break's onset ends there, her lights still burning, so it has no
    // 'lights' cut; it cuts as she breaks, on the hand-over's own step (the page's 'foundered' event then ends the hold)
    { id: 'break', run: 'watch', when: 'broke', view: 'boat', day: 'profile', hold: 0, gap: 4, weight: 10, fast: true, wait: 0, say: 'she breaks' },
  ];
  const FAST = 900;        // the player's pace from which only the rows marked fast cut (the page's fastest button)
  const MIN_GAP = 3;       // s of the player's time: never two cuts closer
  const END_HOLD = 240;    // s of her time: the longest hold 'end' asks for (1912: 186 s from the bridge to the end)
  const QUIET = 3;         // s of her time without contact after the touch: the grind is over
  const CAPTION = 5;       // s of the page's clock a caption stands (real time, but for a test's virtual frames) [appearance]

  // ---------------------------------------------------------------- the counts: the model's state, read each step
  const ch = { feed: null, len: -1, brought: 0, designer: 0 };     // the reports' feed, counted once per new line
  function feed(sim) {
    const R = sim.reports;
    if (!R) return ch;
    if (ch.feed !== R.feed || ch.len !== R.feed.length) {
      ch.feed = R.feed; ch.len = R.feed.length; ch.brought = 0; ch.designer = 0;
      for (const e of R.feed) {
        if (e.kind !== 'routine' && (e.ch === 'runner' || e.ch === 'phone' || e.ch === 'voice')) ch.brought++;   // brought by a man
        if (e.rule === 'designer') ch.designer++;
      }
    }
    return ch;
  }
  const COUNT = {
    switch: () => 0,
    run: () => 1,
    bells: (s) => (s.night && s.night.tBells >= 0 ? 1 : 0),
    touch: (s) => (s.night && s.night.tTouch >= 0 ? 1 : 0),
    grind: (s) => {                                // the contact over: QUIET s without it after the touch, or the ice passed
      const w = s.night; if (!w || w.tTouch < 0) return 0;
      if (w.tClear >= 0) return 1;
      return s.enc && s.enc.tLast >= 0 && s.t - s.enc.tLast >= QUIET ? 1 : 0;
    },
    missed: (s) => (s.night && s.night.tClear >= 0 && s.night.tTouch < 0 ? 1 : 0),
    steam: (s) => (s.night && s.night.tTouch >= 0 && s.plant && s.plant.events && s.plant.events.blowoff !== undefined ? 1 : 0),
    report: (s) => feed(s).brought,
    designer: (s) => feed(s).designer,
    lowered: (s) => { const P = s.people; if (!P) return 0; let n = 0; for (const b of P.boats) if (b.tLower >= 0) n++; return n; },
    rocket: (s) => (s.world ? s.world.rockets.fired : 0),
    over: (s) => { const o = s.overT; if (!o) return 0; let n = 0; for (let b = 0; b < o.length; b++) if (o[b] >= 0) n++; return n; },
    fcastle: (s) => (s.markT && s.markT.fcastle >= 0 ? 1 : 0),
    bridge: (s) => (s.markT && s.markT.bridge >= 0 ? 1 : 0),
    // her last minutes: the water at the bridge, or, on a watch handed over at the break's onset (G12's cascade), the
    // onset check's own worst ratio at NEAR of her strength, whichever comes first. On a flag watch and a preset there is
    // no onset check, so 'last' is the bridge's alone, as before
    last: (s) => (COUNT.bridge(s) || nearBreak(s) ? 1 : 0),
    dark: (s) => (s.plant && s.plant.lights < 1 ? 1 : 0),
    broke: (s) => (A.broke && A.broke(s) ? 1 : 0),
  };
  // the onset check's worst ratio (core/readers/onset.js: the girder's moment or shear over her strength at the worst
  // station, 1 at the onset), the night's own check on every watch handed over at the onset (sim.night.onset.peak.r)
  const NEAR = 0.8;   // [appearance] where her last minutes begin: on the 1912 watch passed at T 153.92, 152 s before the break at T 156.46 (a Node probe, 2026-11-23; 0.9 at 68 s, 0.98 at 24 s)
  function nearBreak(s) { const o = s.night && s.night.handover === 'onset' ? s.night.onset : null; return !!(o && o.peak && o.peak.r >= NEAR); }

  // ---------------------------------------------------------------- words
  const ORD = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth'];
  const nth = (n) => ORD[n - 1] || (n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th')));
  function newestBulkhead(sim) {
    const o = sim.overT; let b = -1;
    for (let i = 0; i < o.length; i++) if (o[i] >= 0 && (b < 0 || o[i] > o[b])) b = i;
    if (b < 0 || !C || !C.BULKHEADS) return '';
    return C.BULKHEADS[b].id + (sim.bulkTop && sim.bulkTop[b] ? ', at ' + sim.bulkTop[b] + ' deck' : '');
  }
  function words(r, n, sim) {
    if (r.say === '{lights}') return sim.plant && sim.plant.lights > 0 ? 'her main lights fail: only the emergency lights burn' : 'her lights go out';
    if (r.say === '{last}') return COUNT.bridge(sim) ? 'water reaches the bridge: her last minutes' : 'her hull near breaking: her last minutes';
    return r.say.replace('{nth}', nth(n)).replace('{bulkhead}', () => newestBulkhead(sim));
  }
  function labelOf(view) {
    const b = document.querySelector('[data-view="' + view + '"]');
    return b ? b.textContent.trim() : view;
  }

  // ---------------------------------------------------------------- the switch
  const bDir = el('button', null, 'Director'); bDir.id = 'bDirector'; bDir.setAttribute('aria-pressed', 'false');
  bDir.title = 'Director: the camera tells the night. It chooses the view at each moment and holds her own pace where it matters; any view button gives the camera back to you';
  const xr = $('bXray');
  if (A.addButton && A.addButton('display', bDir, { before: '#bXray' })) { /* C-4: the bar's */ }
  else if (xr && xr.parentElement) xr.parentElement.insertBefore(bDir, xr);
  else { const v = document.querySelector('.views .seg'); if (v) v.appendChild(bDir); }

  // ---------------------------------------------------------------- the caption [appearance]
  const cap = el('div', 'dir-cap'); cap.id = 'dirCaption'; cap.hidden = true; cap.setAttribute('role', 'status'); cap.setAttribute('aria-live', 'polite');
  const capT = el('span', 'dir-t'), capW = el('span', 'dir-w'), capV = el('span', 'dir-v');
  cap.append(capT, capW, capV);
  // in the stage's aside (C-4), last: at the right above the Bridge (above the damage diagram on a preset; above the
  // Bridge on a phone), under the walk's pad. The layout keeps it clear of every other overlay, and it is the first to
  // give way where the readouts, the bar, the end card, the Bridge or the diagram need the room
  if (!(A.slot && A.slot('aside', cap, { order: 2, last: true })) && $('stage')) $('stage').appendChild(cap);
  let capUntil = 0;

  // ---------------------------------------------------------------- state
  let on = false;
  const st = { sim: S.sim, rows: [], seen: {}, k: 0, vt: 0, hold: { to: -1, w: 0 }, gapTo: -Infinity, pending: null, cuts: [], passed: [] };
  const dtOf = (sim) => (sim && sim.params && sim.params.dt) || 0.25;
  const stepOf = (sim) => (sim.night ? sim.night.k : Math.round(sim.t / dtOf(sim)));
  const busyOf = (sim) => !!(sim.night && sim.night.tClear < 0);
  const rowsFor = () => CUTS.filter(r => r.id !== 'on' && (r.run === 'any' || r.run === (S.night ? 'watch' : 'preset')));
  const ON = CUTS[0];
  function viewOf(r, n) {
    const night = !!(A.nightScene && A.nightScene.on), ok = (v) => !!v && (v === 'bridge' || !!(A.views && A.views[v]));
    const i = Math.max(0, (n || 1) - (r.nth === 'later' ? 2 : 1)), pick = (v) => (Array.isArray(v) ? v[i % v.length] : v);
    const v = pick(night || !r.day ? r.view : r.day), day = pick(r.day);
    return ok(v) ? v : (ok(day) ? day : 'quarter');
  }
  function fresh(sim) {
    st.sim = sim; st.rows = rowsFor(); st.seen = {}; st.vt = 0; st.k = sim ? stepOf(sim) : 0;
    st.hold = { to: -1, w: 0 }; st.gapTo = -Infinity; st.pending = null; st.cuts = []; st.passed = [];
  }
  // a moment that did not cut, and why: 'fast' (the pace is very fast and the row is not marked fast), 'hold' or 'gap'
  // (kept off and not waiting), 'waited' (it waited its time out), 'outweighed' (a heavier moment took the step)
  function pass(x, k, why) { if (st.passed.length < 400) st.passed.push({ step: k, trigger: x.r.id, n: x.n, at: x.k, why }); }
  // what went up on this step: the heaviest row that may cut at this pace (ties: the earlier in the list)
  function evaluate(sim, k, busy) {
    const fastNow = !busy && (S.speed || 1) >= FAST;
    let best = null;
    for (const r of st.rows) {
      const c = COUNT[r.when](sim), was = st.seen[r.id] || 0;
      if (!(c > was)) continue;
      st.seen[r.id] = c;
      if ((r.nth === 1 && was > 0) || (r.nth === 'later' && c < 2)) continue;
      const x = { r, n: c, k };
      if (fastNow && !r.fast) { pass(x, k, 'fast'); continue; }
      if (!best || r.weight > best.r.weight) { if (best) pass(best, k, 'outweighed'); best = x; } else pass(x, k, 'outweighed');
    }
    return best;
  }
  const may = (w, k) => st.vt >= st.gapTo - 1e-9 && (k > st.hold.to || w > st.hold.w);
  // The boat's eye is fixed on the earth where it was laid (site/parts/20_night_scene.js), and she drifts: laid at the
  // first boat, at 12:41 am, it watches her last minutes from over two kilometres. So a cut to the Boat from another eye,
  // or one on it when she lies more than half as far again as it was laid, lays it off her beam again, as the Boat button
  // pressed a second time does (that part's placeBoat, the one way it has; a hook the part could give for this is named
  // in the lane's report)
  function relayBoat(sim, fromOther) {
    const N = A.nightScene; if (!N || typeof N.placeBoat !== 'function' || !N.boat) return;
    const m = S.night && sim.mo ? sim.mo : null, X = m ? m.X : 0, Y = m ? m.Y : 0;
    if (fromOther || Math.hypot(N.boat.N - X, N.boat.E - Y) > 1.5 * (N.boat.dist || 300)) N.placeBoat();
  }
  function cut(sim, x, k, view) {
    const r = x.r, same = view === S.view, inHold = k <= st.hold.to, dt = dtOf(sim);
    if (!same) A.setView(view);
    if (view === 'boat') relayBoat(sim, !same);
    const n = Math.round((r.hold === 'end' ? END_HOLD : Math.max(r.hold || 0, MIN_GAP, r.gap || 0)) / dt);
    if (n > 0) st.hold = { to: Math.max(inHold ? st.hold.to : -1, k + n), w: r.weight };
    else if (inHold) st.hold.w = r.weight;          // a heavier moment inside a lighter hold: the hold runs on as its own
    st.gapTo = st.vt + Math.max(MIN_GAP, r.gap || 0);
    st.cuts.push({ step: k, t: sim.t, clock: A.clockOf(sim.t) || null, trigger: r.id, n: x.n, view, beat: same, hold: n, holdTo: st.hold.to,
      weight: r.weight, vt: st.vt, gapTo: st.gapTo, late: k - x.k, interrupts: inHold });
    caption(sim, r === ON ? ON.say : words(r, x.n, sim), view);
  }
  // the page held at her own pace while a hold of the director's is on (after the ice; at a pace above her own): asked
  // at the cut, and again whenever the page is found running at the player's pace inside the hold (another part's
  // shorter hold replaced it; frames too slow for the steps; a pause). The wall clock sets only the page's pace here,
  // never a cut
  function keepPace(sim, k) {
    if (k >= st.hold.to || busyOf(sim) || !((S.speed || 1) > 1) || !S.playing || A.gone(sim)) return;
    if (A.pace() !== 1) A.holdPace((st.hold.to - k) * dtOf(sim), 'director');   // its own hold (C-4 step 3, QC C-7): no other part's release ends it
  }

  A.on('step', (sim) => {
    if (!on || sim !== st.sim) return;
    const k = stepOf(sim), busy = busyOf(sim), dt = dtOf(sim);
    st.vt += dt / (busy || k <= st.hold.to ? 1 : Math.max(1, S.speed || 1));
    st.k = k;
    let x = evaluate(sim, k, busy);
    const p = st.pending;
    if (p && st.vt > p.until + 1e-9) { pass(p, k, 'waited'); st.pending = null; }
    if (st.pending && (!x || st.pending.r.weight > x.r.weight)) { if (x) pass(x, k, 'outweighed'); x = st.pending; }
    if (x) {
      if (may(x.r.weight, k)) {
        if (st.pending && st.pending !== x) pass(st.pending, k, 'outweighed');
        st.pending = null; cut(sim, x, k, viewOf(x.r, x.n));
      } else if (x !== st.pending) {
        if (x.r.wait > 0 && (!st.pending || x.r.weight >= st.pending.r.weight)) { if (st.pending) pass(st.pending, k, 'outweighed'); st.pending = Object.assign({}, x, { until: st.vt + x.r.wait }); }
        else pass(x, k, k <= st.hold.to ? 'hold' : 'gap');
      }
    }
    keepPace(sim, k);
  });

  // ---------------------------------------------------------------- on and off
  function turnOn() {
    if (on || !S.sim) return;
    on = true; bDir.setAttribute('aria-pressed', 'true');
    const sim = S.sim; fresh(sim);
    let stand = null, standN = 1;
    for (const r of st.rows) {                       // what has happened is past: only what comes next cuts
      const c = COUNT[r.when](sim); st.seen[r.id] = c;
      if (c > 0 && r.stand !== false && !(r.nth === 'later' && c < 2)) { stand = r; standN = c; }
    }
    const k = stepOf(sim);
    cut(sim, { r: ON, n: 1, k }, k, stand ? viewOf(stand, standN) : (S.night ? 'bridge' : 'profile'));
    keepPace(sim, k);
  }
  function turnOff() {
    if (!on) return;
    on = false; bDir.setAttribute('aria-pressed', 'false');
    if (st.k < st.hold.to) A.holdPace(0, 'director');   // its own hold ends with it
    st.hold = { to: -1, w: 0 }; st.pending = null;
    hideCaption();
  }
  bDir.addEventListener('click', () => { if (on) turnOff(); else turnOn(); });   // the button and the caption say which
  // a view button pressed by the player (a click on any [data-view], the parts' own included): the director is off. The
  // notice that button gave (the boat's, the crow's nest's) is kept after the director's own
  let clicking = false, heard = null;
  const viewButton = (e) => (e.target && e.target.closest ? e.target.closest('[data-view]') : null);
  document.addEventListener('click', (e) => { if (on && viewButton(e)) { clicking = true; heard = null; } }, true);
  document.addEventListener('click', (e) => {
    if (!clicking) return;
    clicking = false;
    if (!viewButton(e)) return;
    turnOff();
    A.toast('The director is off: the camera is yours.' + (heard ? ' ' + heard : ''));
  });

  A.on('reset', (sim) => {
    fresh(sim); hideCaption();
    if (!on || !sim || (A.scrubbing && A.scrubbing())) return;   // a scrub's reset (NH4): its kept state comes back next, no first cut
    const k = stepOf(sim), x = evaluate(sim, k, busyOf(sim));   // the run's own first cut: the watch begins on the bridge
    if (x && may(x.r.weight, k)) cut(sim, x, k, viewOf(x.r, x.n));
  });
  // NH4, the scrubber: its state kept with each minute of the run as plain data (st without its sim, and without its
  // rows, which the scrub's reset makes again from the list) and put back at a scrub, so its cuts from a kept minute on
  // are the unbroken run's. It decides nothing; on or off stays the player's
  if (A.keeper) A.keeper('director', {
    keep: () => { const o = {}; for (const k in st) if (k !== 'sim' && k !== 'rows') o[k] = st[k]; return o; },
    scrub: (sim, kept) => { Object.assign(st, kept, { sim }); },
  });
  A.on('event', (name, data) => {
    if (name === 'notice' && clicking && data) heard = data.text;
    else if (name === 'foundered' && on) { if (st.k < st.hold.to) A.holdPace(0, 'director'); st.hold = { to: -1, w: 0 }; st.pending = null; }
  });

  // ---------------------------------------------------------------- the caption
  // Where it stands is the layout's (C-4: the aside, last), so it follows the end card and the readouts as they grow in
  // the same pass that moves them, and keeps its place while it fades out (join 5's gate, 2026-11-20, had found one left
  // where the card had been, under a placer that ran four times a second)
  function caption(sim, text, view) {
    const clock = A.clockOf ? A.clockOf(sim.t) : null;
    capT.textContent = clock ? clock + ':' : ''; capT.hidden = !clock;
    capW.textContent = clock ? text : text.charAt(0).toUpperCase() + text.slice(1);
    capV.textContent = labelOf(view);
    cap.hidden = false; cap.classList.add('on');
    capUntil = A.now() + CAPTION * 1000;           // the page's clock (QC C-3): the frames' time, which runs while the watch is paused
    if (A.layoutNow) A.layoutNow();               // where there is no room for it, it gives way before it is ever drawn
  }
  function hideCaption() { cap.hidden = true; cap.classList.remove('on'); capUntil = 0; }
  // it fades out at its time and is hidden once faded
  A.on('frame', () => {
    if (cap.hidden) return;
    const now = A.now();
    if (now > capUntil + 400) { hideCaption(); return; }
    if (now > capUntil) cap.classList.remove('on');
  });

  // for the tests (tools/director_site_test.js) and for exploring: read-only in spirit
  A.director = {
    on: () => on,
    cuts: () => st.cuts.map(c => Object.assign({}, c)),
    passed: () => st.passed.map(c => Object.assign({}, c)),
    list: CUTS,
    FAST, MIN_GAP, END_HOLD, QUIET, CAPTION,
    state: () => ({ k: st.k, vt: st.vt, hold: Object.assign({}, st.hold), gapTo: st.gapTo, pending: st.pending ? { id: st.pending.r.id, k: st.pending.k, until: st.pending.until } : null }),
    // shown: on the screen; gaveWay: one is up, but the layout has taken its room for the musts (C-4: 'last')
    caption: () => {
      const r = cap.getBoundingClientRect(), vis = !cap.hidden && r.width > 0;
      return { shown: vis, text: cap.textContent, rect: vis ? [r.left, r.top, r.right, r.bottom] : null, gaveWay: !cap.hidden && cap.style.display === 'none' };
    },
  };
})();
