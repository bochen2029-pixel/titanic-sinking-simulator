// NH1, the witness timeline (docs/BRAINSTORM_the_next_horizon_v1_2026-11-23.md, section 3; BACKLOG section 2k). A part
// of the viewer (site/app.js, "parts").
//
// The Evidence tab gains the observation ledger. Every row of core/scenarios.js RECORD_1912 goes on her timeline: who
// saw it, where it is in the inquiries, what they saw and when, and the model's reading of this run by the ledger's own
// operator (core/readers/ledger.js), its figures written as tools/ledger_tests.js writes them.
//   - The run it reads is the page's own: the 1912 damage preset from its start, or a watch of the 1912 night from the
//     touch (the ledger's times are minutes after the touch).
//   - It samples the run as tools/ledger_tests.js samples the preset: her state at the start, every 20 steps (5 s of her
//     time) and on the step she is gone. The onset of the break is looked at after every step (core/readers/onset.js; on
//     a watch, its reader's own state).
//   - So on the 1912 preset at its defaults every figure here is the tool's table's (out/ledger_1912.txt), to its
//     printed digits (tools/evidence_site_test.js).
//   - A row is read once the run has passed its time; until then it waits. Its first time at the witness's level is
//     "not yet" until she has gone, when it is the table's. An event row is read when the event comes; the end rows when
//     she has gone.
//   - Any other run has no reading: the rows are the 1912 night's.
//   - After stage D, the kept set's band goes beside each row (NH3, with its tracked table); not yet.
// It reads the model's state and feeds nothing back: a sample is plain data copied from the sim (the ledger's sample).
// The words are this file's; the figures are the ledger's and the model's.
(function () {
  'use strict';
  const A = window.TitanicApp, C = window.TitanicCore, SC = window.TitanicScenarios, L = window.TitanicLedger, O = window.TitanicOnset;
  if (!A || !C || !SC || !L || !SC.RECORD_1912) return;
  const pane = document.querySelector('[data-pane="evidence"]');
  if (!pane) return;
  const S = A.state, ROWS = SC.RECORD_1912, EVERY = 20, DT = C.DEFAULT_PARAMS.dt;

  // ------------------------------------------------------------------ the figures, as tools/ledger_tests.js writes them
  const f = (x, n) => (x === null || x === undefined || Number.isNaN(x) ? 'n/a' : (Object.is(+(+x).toFixed(n === undefined ? 2 : n), -0) ? (0).toFixed(n === undefined ? 2 : n) : (+x).toFixed(n === undefined ? 2 : n)));
  const sg = (x, n) => (x === null || x === undefined || Number.isNaN(x) ? 'n/a' : (x > 0 ? '+' : '') + f(x, n));
  const isTime = (row) => row.kind === 'event' || row.kind === 'end';
  const digits = (row) => (row.unit === 't' ? 0 : 2);
  function bandText(row) {
    const d = digits(row);
    if (row.sided === 'interval') return f(row.sigma[0], d) + ' to ' + f(row.sigma[1], d);
    const w = typeof row.sigma === 'number' ? ' +/- ' + f(row.sigma, d) : '';
    return (row.sided === 'lower' ? 'at least ' : (row.sided === 'upper' ? 'at most ' : '')) + f(row.value, d) + w;
  }
  const when = (row) => (row.tLo === null || row.tLo === row.tHi ? 'T ' + f(row.t, 0) : 'T ' + f(row.tLo, 0) + ' to ' + f(row.tHi, 0));
  const recordText = (row) => (isTime(row) ? 'T ' : '') + bandText(row) + ' ' + row.unit + (isTime(row) ? '' : ', ' + when(row));
  // one row's figures from its reading r (L.evaluate's): final once she has gone; before, a level row's first time at the
  // witness's level is "not yet" while it has not come
  function figures(row, r, final) {
    const d = digits(row), lvl = !isTime(row), ang = row.kind === 'angle';
    const out = {
      verdict: r.inRange ? 'in' : 'out', record: recordText(row),
      model: isTime(row) ? 'T ' + f(r.model, 1) : f(r.model, d) + ' at T ' + f(row.t, 0),
      miss: lvl ? sg(r.miss, d) : '',
      reaches: !lvl || ang ? '' : (r.reach === null ? (final ? 'never' : 'not yet') : 'T ' + f(r.reach, 1)),
      late: r.late === null || ang ? '' : (r.late === 0 ? 'in time' : sg(r.late, 1) + ' min'),
      note: final ? (r.note || '') : '',
    };
    // the tool's own line (tools/ledger_tests.js, line()), for the test: the same strings as are shown
    out.line = (r.inRange ? 'in   ' : 'out  ') + 'CHECK ' + row.id.padEnd(22) + row.kind.padEnd(9) + row.role.padEnd(7) + (row.band || '-').padEnd(3) + (isTime(row) ? 'T ' : '') + (bandText(row) + ' ' + row.unit + (isTime(row) ? '' : ', ' + when(row))).padEnd(40) +
      out.model.padEnd(22) + out.miss.padEnd(10) + out.reaches.padEnd(9) + out.late.padEnd(12) + out.note;
    return out;
  }

  // ------------------------------------------------------------------ the run read: sampled as the tool samples it
  let mode = null, run = null, onset = null, base = 0, k0 = 0, done = false, endWhy = null, changed = true;
  const which = () => (S.scen === 'titanic' && !S.night ? 'preset' : (S.scen === 'watch' && S.night ? 'watch' : null));
  const stepOf = (sim) => (sim.night ? sim.night.k - k0 : Math.round(sim.t / DT));
  function take(sim) { const s = L.sample(sim); s.t -= base; run.samples.push(s); changed = true; }
  function begin(sim) {                            // the run's first sample: t = 0 on a preset, the touch on a watch
    base = sim.night ? sim.night.tTouch : 0; k0 = sim.night ? sim.night.k : 0;
    run = L.start(sim);
    take(sim);
    if (!sim.night && O) { onset = O.start(); O.look(sim, onset); }
  }
  const onsetT = (sim) => { const st = sim.night ? sim.onset : onset; return st && st.found ? st.found.t - base : null; };
  function finish(sim) {                           // she has gone: the run closed as the tool closes it, its times the ledger's
    L.close(run, sim, { onsetT: null });
    run.events = run.events.map(e => ({ t: e.t - base, id: e.id }));
    if (run.founderT !== null) run.founderT -= base;
    run.endT -= base; run.onsetT = onsetT(sim);
    done = true; endWhy = A.broke && A.broke(sim) ? 'broke' : 'foundered'; changed = true;
  }
  function reset(sim) {
    mode = which(); run = null; onset = null; base = 0; k0 = 0; done = false; endWhy = null; changed = true;
    if (mode === 'preset' && sim) begin(sim);
  }
  A.on('reset', reset);
  // NH4, the scrubber: the run read so far, kept with each minute of it as plain data and put back at a scrub (the
  // scrub's reset began it afresh at that minute)
  if (A.keeper) A.keeper('ledger', {
    keep: () => ({ run, onset, base, k0, done, endWhy }),
    scrub: (sim, s) => { mode = which(); run = s.run; onset = s.onset; base = s.base; k0 = s.k0; done = s.done; endWhy = s.endWhy; changed = true; },
  });
  A.on('step', (sim) => {
    if (!mode || done || sim !== S.sim) return;
    if (!run) { if (mode === 'watch' && sim.night && sim.night.tTouch >= 0) begin(sim); return; }
    if (onset) O.look(sim, onset);
    const gone = A.gone(sim);
    if (stepOf(sim) % EVERY === 0 || gone) take(sim);
    if (gone) finish(sim);
  });

  // the readings now: every row once she has gone; before, the rows the run has passed
  function readings() {
    const sim = S.sim;
    if (!run || !sim) return ROWS.map(() => null);
    if (done) return L.evaluateAll(ROWS, run).map((r, i) => figures(ROWS[i], r, true));
    const last = run.samples[run.samples.length - 1].t, now = { samples: run.samples, pockets: run.pockets, founderT: null, onsetT: null, endT: last,
      events: sim.events.filter(e => e.t >= base).map(e => ({ t: e.t - base, id: e.id })) };
    return ROWS.map(row => {
      if (row.kind === 'end') return null;
      if (row.kind === 'event') {
        if (row.place.mark === 'toPort') { if (last < 150 * 60) return null; }
        else if (!now.events.some(e => e.id === row.place.mark)) return null;
      } else if (last < 60 * (row.tHi === null ? row.t : row.tHi)) return null;
      return figures(row, L.evaluate(row, now), false);
    });
  }

  // ------------------------------------------------------------------ the section in the Evidence tab
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
  const sec = el('div', 'sec ld-sec'); sec.id = 'ldSec';
  const head = el('h3', null, 'The witnesses, row by row');
  const lead = el('p', 'hint ld-lead', 'Every row of the observation ledger: who saw what, when, and where it stands in the inquiries. A few rows are a later reconstruction or an estimate, not a sighting, and say so. Beside each is the model\'s reading of this run, by the ledger\'s own rule. A level is in metres over the place the witness named (+ up); T is minutes after the touch.');
  const sum = el('p', 'ld-sum'); sum.id = 'ldSum';
  const SVG = 'http://www.w3.org/2000/svg', strip = document.createElementNS(SVG, 'svg');
  strip.setAttribute('class', 'ld-strip'); strip.setAttribute('aria-hidden', 'true'); strip.id = 'ldStrip';
  const list = el('ol', 'ld-list'); list.id = 'ldList';
  sec.append(head, lead, sum, strip, list);
  // after the timeline check (the baked run's), before the other cases' table
  const check = document.getElementById('evBody'), host = check && check.closest ? check.closest('.sec') : null;
  if (host && host.parentNode) host.parentNode.insertBefore(sec, host.nextSibling); else pane.appendChild(sec);

  // T (minutes after the touch) as the 1912 night's clock: the touch at 11:40 pm (core/scenarios.js, the preset's clock)
  const CLK = SC.PRESETS && SC.PRESETS.titanic && SC.PRESETS.titanic.clock ? SC.PRESETS.titanic.clock : { h: 23, m: 40 };
  function clockT(T) { let m = Math.round(CLK.h * 60 + CLK.m + T); m = ((m % 1440) + 1440) % 1440; const h = Math.floor(m / 60); return (h % 12 || 12) + ':' + String(m % 60).padStart(2, '0') + (h >= 12 ? ' pm' : ' am'); }
  const SEEN = { sea_at: 'The sea outside, over ', water_in: 'The water inside, over ', sounding: 'A sounding: ', tonnage: 'The water aboard', event: 'When: ', end: 'Her end: ' };
  // a row's part in the calibration (its `role`), and what kind of knowledge each of its tags is, in plain words
  const ROLE_WORDS = { fit: 'In the calibration\'s score.', held: 'Not in the calibration\'s score: the model is read against it.', report: 'Reported only.' };
  function tagKind(tag) {
    const s = String(tag || ''), m = /^\[(read|checked|derived|bet)/.exec(s);
    if (!m) return 'not tagged';
    if (m[1] === 'bet') return 'our own choice (a bet)';
    if (m[1] === 'derived') return 'worked out from what was read';
    return /OBS|secondary|\bvia\b/.test(s) ? 'read at second hand' : 'read in the source';
  }
  function seen(row) {
    if (row.kind === 'angle') return row.place.what === 'trim' ? 'Her trim (+ by the bow)' : 'Her list (+ to starboard)';
    if (row.kind === 'tonnage') return SEEN.tonnage;
    return SEEN[row.kind] + (row.place.what || row.place.mark || '');
  }
  const items = ROWS.map(row => {
    const li = el('li', 'ld-row'); li.dataset.id = row.id; li.dataset.state = 'wait';
    const top = el('div', 'ld-top'), whenEl = el('span', 'ld-when', when(row) + ' · ' + (row.tLo === null || row.tLo === row.tHi ? clockT(row.t) : clockT(row.tLo) + ' to ' + clockT(row.tHi))), verdict = el('span', 'ld-verdict', 'to come');
    top.append(whenEl, verdict);
    const who = el('div', 'ld-who', row.witness), what = el('div', 'ld-what', seen(row));
    const nums = el('div', 'ld-nums');
    const cell = (k, cls) => { const w = el('span', 'ld-f'), lab = el('span', 'ld-k', k), v = el('span', cls); w.append(lab, v); nums.appendChild(w); return [w, v]; };
    const [, rec] = cell('the record', 'ld-record'), [, model] = cell('the model', 'ld-model'), [wMiss, miss] = cell('miss', 'ld-miss'), [wReach, reach] = cell('reaches', 'ld-reaches'), [wLate, late] = cell('late', 'ld-late');
    rec.textContent = recordText(row);
    // RC2 (the red team's row 22): the page gives each row's source in plain words (the row's `cite`), its part in the
    // calibration, and each tag as its kind alone. The row's working source, tags, allowance and notes
    // (core/scenarios.js) name the project's own audits and decisions: they stay in the code and are not shown
    const src = el('details', 'ld-src'), sm = el('summary', null, 'Source and tags');
    const tags = ['What was seen: ' + tagKind(row.tag.value), 'where: ' + tagKind(row.tag.place)].concat(row.tag.time ? ['when: ' + tagKind(row.tag.time)] : []);
    src.append(sm, el('p', 'ld-source', row.cite || row.source), el('p', 'ld-tags', (ROLE_WORDS[row.role] ? ROLE_WORDS[row.role] + ' ' : '') + tags.join(' · ') + '.'));
    const note = el('div', 'ld-note');
    li.append(top, who, what, nums, note, src);
    list.appendChild(li);
    return { row, li, verdict, model, miss, reach, late, note, wMiss, wReach, wLate };
  });

  // her timeline: each row's time window on a lane of its own, in the order of their times, coloured by its reading; the
  // model's own time (an event's, or when it is first at the witness's level) a tick on the lane; the run's now a line
  const order = ROWS.map((r, i) => i).sort((a, b) => (ROWS[a].tLo === null ? ROWS[a].t : ROWS[a].tLo) - (ROWS[b].tLo === null ? ROWS[b].t : ROWS[b].tLo) || a - b);
  const W = 360, LANE = 7, TOP = 4, AX = 18, H = TOP + LANE * ROWS.length + AX, TMAX = 170;
  strip.setAttribute('viewBox', '0 0 ' + W + ' ' + H); strip.setAttribute('preserveAspectRatio', 'none');
  const X = (T) => 6 + (W - 12) * Math.max(0, Math.min(1, T / TMAX));
  const svg = (tag, attrs) => { const e = document.createElementNS(SVG, tag); for (const a in attrs) e.setAttribute(a, attrs[a]); return e; };
  const axis = svg('g', { class: 'ld-axis' });
  for (let T = 0; T <= TMAX; T += 30) {
    axis.appendChild(svg('line', { x1: X(T), x2: X(T), y1: TOP, y2: H - AX + 3, class: 'ld-grid' }));
    const tx = svg('text', { x: X(T), y: H - 4, 'text-anchor': T === 0 ? 'start' : 'middle', class: 'ld-tick' }); tx.textContent = clockT(T).replace(/ (am|pm)$/, ''); axis.appendChild(tx);
  }
  strip.appendChild(axis);
  const lanes = order.map((i, j) => {
    const row = ROWS[i], y = TOP + LANE * j + LANE / 2, lo = row.tLo === null ? row.t : row.tLo, hi = row.tHi === null ? row.t : row.tHi;
    const g = svg('g', { class: 'ld-lane wait' });
    g.appendChild(hi > lo ? svg('line', { x1: X(lo), x2: X(hi), y1: y, y2: y, class: 'ld-win' }) : svg('circle', { cx: X(lo), cy: y, r: 2.2, class: 'ld-dot' }));
    const tick = svg('line', { x1: 0, x2: 0, y1: y - 3, y2: y + 3, class: 'ld-mt' }); tick.style.display = 'none'; g.appendChild(tick);
    strip.appendChild(g);
    return { i, g, tick };
  });
  const nowLine = svg('line', { x1: 0, x2: 0, y1: TOP, y2: H - AX + 3, class: 'ld-now' }); nowLine.style.display = 'none'; strip.appendChild(nowLine);

  let shown = [], drawnAt = -1e9;
  function draw() {
    changed = false;
    const R = mode && run ? readings() : ROWS.map(() => null);
    shown = R;
    const nIn = R.filter(x => x && x.verdict === 'in').length, nRead = R.filter(Boolean).length;
    if (!mode) sum.textContent = 'The ledger is the 1912 night\'s: open the 1912 damage preset or the 1912 watch to read it against a run.';
    else if (!run) sum.textContent = 'Read on this watch from the touch: none of it yet.';
    else if (!done) sum.textContent = 'Read on this run (' + (mode === 'preset' ? 'the 1912 damage preset' : 'the 1912 watch, from the touch') + '), at T ' + f(run.samples[run.samples.length - 1].t / 60, 1) + ': ' + nRead + ' of ' + ROWS.length + ' rows so far, ' + nIn + ' in range.';
    else sum.textContent = 'Read on this run to her end: she ' + (endWhy === 'broke' ? 'broke at T ' + f((run.endT) / 60, 2) : (run.founderT !== null ? 'founders at T ' + f(run.founderT / 60, 2) : 'ends at T ' + f(run.endT / 60, 2))) + '; the onset of the break at T ' + (run.onsetT === null ? 'none' : f(run.onsetT / 60, 2)) + '; ' + run.samples.length + ' samples, one every 5 s. In range: ' + nIn + ' of ' + ROWS.length + ' (fit ' + ROWS.filter((r, i) => r.role === 'fit' && R[i] && R[i].verdict === 'in').length + ' of ' + ROWS.filter(r => r.role === 'fit').length + '). Every row is a check: none is tuned to be in range.';
    items.forEach((it, i) => {
      const x = R[i], state = x ? x.verdict : 'wait';
      it.li.dataset.state = state;
      it.verdict.textContent = x ? (x.verdict === 'in' ? 'in range' : 'out of range') : 'to come';
      it.model.textContent = x ? x.model : '–';
      it.miss.textContent = x ? x.miss : ''; it.reach.textContent = x ? x.reaches : ''; it.late.textContent = x ? x.late : '';
      it.wMiss.hidden = !(x && x.miss); it.wReach.hidden = !(x && x.reaches); it.wLate.hidden = !(x && x.late);
      it.note.textContent = x ? x.note : ''; it.note.hidden = !(x && x.note);
    });
    lanes.forEach(ln => {
      const x = R[ln.i], row = ROWS[ln.i];
      ln.g.setAttribute('class', 'ld-lane ' + (x ? x.verdict : 'wait'));
      const T = !x ? null : (isTime(row) ? parseFloat(x.model.slice(2)) : (/^T /.test(x.reaches) ? parseFloat(x.reaches.slice(2)) : null));
      if (T === null || !isFinite(T)) ln.tick.style.display = 'none';
      else { ln.tick.setAttribute('x1', X(T)); ln.tick.setAttribute('x2', X(T)); ln.tick.style.display = ''; }
    });
    if (run && !done) { const xn = X(run.samples[run.samples.length - 1].t / 60); nowLine.setAttribute('x1', xn); nowLine.setAttribute('x2', xn); nowLine.style.display = ''; } else nowLine.style.display = 'none';
  }
  // drawn while the tab shows, at most once a second of the page's clock, and at once when she has gone
  A.on('frame', (t) => {
    if (!changed || pane.hidden) return;
    if (done || t * 1000 - drawnAt >= 1000) { drawnAt = t * 1000; draw(); }
  });

  reset(S.sim);                                    // the page's first run began before this part was loaded (at t = 0)
  // for the tests (tools/evidence_site_test.js) and for exploring: what is shown, row by row, and the tool's line of each
  // row (null while it waits); draw() puts the run's latest into the tab at once
  A.ledger = {
    mode: () => mode, done: () => done, samples: () => (run ? run.samples.length : 0), draw,
    shown: () => shown.map((x, i) => (x ? Object.assign({ id: ROWS[i].id }, x) : { id: ROWS[i].id, verdict: 'wait' })),
    lines: () => shown.map(x => (x ? x.line : null)),
  };
})();
