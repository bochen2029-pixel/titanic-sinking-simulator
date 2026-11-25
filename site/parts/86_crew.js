// The spoken bridge, step 1: the order line. A part of the viewer (site/app.js, "parts"). The words are the library
// site/parts/85_crew_words.js (TitanicCrewWords); the design is docs/DESIGN_spoken_bridge_v1_2026-11-23.md, section 5.
//
//   - On the Run tab, under the watch's own section: one line, "Give an order", and under it the bridge's talk, the last
//     eight lines of what was said and answered. Enter gives the order; the up and down arrows bring back the last ones.
//     While the line has the focus, the page's own keys (the wheel's, the telegraph's, the walk's) do nothing.
//   - Each order goes through the page's one way to give an order (TitanicApp.order): the watch is taken over as by the
//     wheel, the order is logged with its step, and the watch's link replays it. Nothing else is fed back to the model.
//   - The answer is said by someone on the bridge (TitanicCrewWords.readback), in the talk and as the page's own notice
//     (TitanicApp.toast), which the stage places. A refusal is the model's own reason.
//   - The orders the night's own script gives, and those of the wheel, the telegraph and the other tabs, are captioned in
//     the talk in the bridge's words, with who gave them (the script: the officer of the watch; the page's controls: you).
//   - The helm's convention: "1912 helm orders" (the side the tiller goes, the default) or "modern" (the rudder's side),
//     kept in the page's storage as the sound's volume is.
//   - On a preset, or once she has gone, the line is disabled and says why.
//   - Two hooks for site/parts/88_minds.js (the crew's own words): a line the grammar reads as a question, or does not read
//     at all, is offered to its listener first (A.crew.hear); and the part adds, replaces and marks lines of the talk
//     (A.crew.say, note, replace, mark), gives an order as a typed one is given (A.crew.giveOrder) and reads what was
//     said (A.crew.talkLog). With no listener, or one that does not take the line, the page is step 1's.
//   - A night taken back (NH4's scrubber, where the page has one: TitanicApp.keeper, TitanicApp.scrubbing): the talk is
//     kept with each kept minute and put back with it, and an order of the player's that the night then reaches again
//     is shown with the lines it was first shown with. Without the page's scrubber none of it does anything.
// It adds nothing to the stage and keeps no timer: it acts on keys, on the page's events and on the model's steps.
(function () {
  'use strict';
  const A = window.TitanicApp, NT = window.TitanicNight, CW = window.TitanicCrewWords;
  if (!A || !NT || !CW) return;
  const S = A.state, Mo = window.TitanicMotion, WD = window.TitanicWorld, SY = window.TitanicSystems;
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
  const KEY = 'titanic.crew.convention', TALK = 8, KEEP = 20;
  const OOW = 'The officer of the watch', YOU = 'You';
  const TOOK = 'You have the bridge: the night\'s own orders are no longer followed.';

  // ------------------------------------------------------------------ the section on the Run tab
  const sec = el('div', 'sec crew'); sec.id = 'crewSec';
  const line = el('input', 'crew-input'); line.id = 'crewLine'; line.type = 'text'; line.placeholder = 'Give an order';
  line.maxLength = 160; line.autocomplete = 'off'; line.spellcheck = false;
  line.setAttribute('aria-label', 'Give an order to the bridge'); line.setAttribute('enterkeyhint', 'send'); line.setAttribute('autocapitalize', 'off');
  const bGive = el('button', 'chip crew-give', 'Give'); bGive.id = 'crewGive'; bGive.type = 'button';
  const row = el('div', 'crew-line'); row.append(line, bGive);
  const why = el('p', 'hint crew-why'); why.id = 'crewWhy';
  const seg = el('div', 'seg crew-conv'); seg.id = 'crewConv'; seg.setAttribute('role', 'group'); seg.setAttribute('aria-label', 'Helm orders');
  const b1912 = el('button', null, '1912 helm orders'), bModern = el('button', null, 'Modern');
  b1912.type = 'button'; bModern.type = 'button'; b1912.dataset.conv = '1912'; bModern.dataset.conv = 'modern';
  seg.append(b1912, bModern);
  const convRow = el('div', 'kv mt8 crew-convrow'); convRow.append(el('span', null, 'Helm orders'), seg);
  const convLine = el('p', 'hint crew-convline'); convLine.id = 'crewConvLine';
  const talkCap = el('div', 'crew-cap', 'The bridge\'s talk');
  const talk = el('ol', 'crew-talk'); talk.id = 'crewTalk'; talk.setAttribute('aria-label', 'The bridge\'s talk, the newest last'); talk.setAttribute('aria-live', 'polite');
  const hint = el('p', 'hint crew-hint', 'Say it as the bridge would: "hard a-starboard", "full astern", "close the watertight doors", "uncover the boats", '
    + '"send the call for assistance". Several orders in one line are given in the order said; a line not understood whole gives none.');
  // What a newcomer reads first, and three orders to try. A chip writes its words into the line and gives nothing: the
  // captain gives an order himself, with Enter or "Give". And while nothing has been said, the talk says where the
  // answers will come (the stylesheet shows that line only while the talk is empty)
  const intro = el('p', 'hint crew-intro', 'You are the captain. Type an order as you would say it and press Enter: the officer of the watch answers below and carries it out. '
    + 'The order line itself needs no key and sends nothing anywhere.');
  intro.id = 'crewIntro';
  const tries = el('div', 'crew-try'); tries.id = 'crewTry';
  tries.appendChild(el('span', 'hint', 'Try'));
  for (const words of ['Hard a-starboard', 'Stop', 'Close the watertight doors']) {
    const b = el('button', 'chip crew-try-chip', words); b.type = 'button'; b.dataset.words = words;
    b.addEventListener('click', () => { if (line.disabled) return; line.value = words; line.focus(); });
    tries.appendChild(b);
  }
  const empty = el('p', 'hint crew-empty', 'Nothing has been said yet. Your orders and the officers\' answers come here, the newest last.'); empty.id = 'crewEmpty';
  sec.append(el('h3', null, 'Orders to the bridge'), intro, row, tries, why, convRow, convLine, talkCap, talk, empty, hint);
  const watchSec = document.getElementById('watchSec');
  if (watchSec && watchSec.parentNode) watchSec.parentNode.insertBefore(sec, watchSec.nextSibling);

  // ------------------------------------------------------------------ the helm's convention, kept
  let convention = '1912';
  try { const v = window.localStorage.getItem(KEY); if (v === '1912' || v === 'modern') convention = v; } catch (e) { /* no storage */ }
  function paintConvention() {
    b1912.setAttribute('aria-pressed', String(convention === '1912')); bModern.setAttribute('aria-pressed', String(convention === 'modern'));
    convLine.textContent = convention === '1912' ? 'In force: 1912 helm orders. "Hard a-starboard" turns her head to port.'
      : 'In force: modern helm orders. "Hard a-starboard" turns her head to starboard.';
  }
  function setConvention(c) {
    convention = c === 'modern' ? 'modern' : '1912';
    try { window.localStorage.setItem(KEY, convention); } catch (e) { /* private window: not kept */ }
    paintConvention();
  }
  b1912.addEventListener('click', () => setConvention('1912'));
  bModern.addEventListener('click', () => setConvention('modern'));

  // ------------------------------------------------------------------ the bridge's talk
  // a line: the ship's time, who said it, what was said. kind: you, yes, no, script; a caption of the player's helm follows
  // the one before it while the wheel turns (each step of the wheel is an order in the log). Besides the lines shown, the
  // talk keeps the last lines said (a note is nobody's: not kept) for a part that must know what was said on the bridge
  // (site/parts/88_minds.js: a man's request holds the talk)
  const said = [], SAID = 24, saidOf = new WeakMap();
  // (n0: a line's own number, when it is one put back or shown again; a new line takes the next. The numbers run on
  // through a night taken back, so that a line is known for the same line wherever it is shown again)
  let lineN = 0;
  function build(who, words, kind, cls, t0, n0) {
    const sim = S.sim, t = typeof t0 === 'string' ? t0 : (sim ? (A.clockOf(sim.t) || '') : '');
    const li = el('li', cls);
    const n = Number.isInteger(n0) && n0 > 0 ? n0 : ++lineN; if (n > lineN) lineN = n;
    li.dataset.who = who; li.dataset.words = words; li.dataset.kind = kind; li.dataset.t = t; li.dataset.n = String(n);
    if (t) li.appendChild(el('span', 'crew-t', t));
    if (who) li.append(el('b', 'crew-who', who + ':'), document.createTextNode(' ' + words));
    else li.appendChild(document.createTextNode(words));
    return li;
  }
  function keep(li) {
    const who = li.dataset.who;
    if (!who) return;
    if (li.dataset.kind === 'wheel' && said.length && said[said.length - 1].kind === 'wheel') said.pop();
    const e = { t: li.dataset.t, who, words: li.dataset.words, kind: li.dataset.kind, imagined: false };
    said.push(e); saidOf.set(li, e);
    while (said.length > SAID) said.shift();
    // a part may hear each line as it is said on the bridge (89: the bridge heard). A notice is nobody's: it never comes here
    if (saidHook) { try { saidHook({ t: e.t, who: e.who, words: e.words, kind: e.kind }); } catch (err) { console.error('the order line\'s listener failed:', err); } }
  }
  let saidHook = null;
  const trim = () => { while (talk.children.length > TALK) talk.removeChild(talk.firstElementChild); };
  function say(who, words, kind, t0, n0) {
    const last = talk.lastElementChild;
    if (kind === 'wheel' && last && last.dataset.kind === 'wheel') talk.removeChild(last);
    const li = build(who, words, kind, 'crew-' + kind, t0, n0);
    talk.appendChild(li); keep(li); trim();
    return li;
  }
  // a line nobody says: what the page did (the watch taken over); or a part's own (kind 'wait', 'notice')
  function note(words, kind, t0, n0) {
    const k = kind || 'note';
    const li = build('', words, k, 'crew-note' + (k === 'note' ? '' : ' crew-' + k), t0, n0);
    talk.appendChild(li); trim();
    return li;
  }
  // for a part (88): a line put in the place of another (an awaited answer's), or at the end if that one has gone by; a
  // line marked (imagined: a language model's words, with a visible mark; floor: an authored line in their place)
  function replace(li, who, words, kind) {
    const fresh = build(who, words, kind, who ? 'crew-' + kind : 'crew-note crew-' + kind);
    if (li && li.parentNode === talk) talk.replaceChild(fresh, li); else { talk.appendChild(fresh); trim(); }
    keep(fresh);
    return fresh;
  }
  function mark(li, o) {
    if (!li || !o) return li;
    if (o.imagined) {
      li.dataset.imagined = '1'; li.classList.add('crew-imagined');
      const m = el('span', 'crew-mark', o.text || 'imagined'); if (o.title) m.title = o.title;
      li.appendChild(m);
      li.dataset.markText = o.text || 'imagined'; li.dataset.markTitle = o.title || '';
      const e = saidOf.get(li); if (e) e.imagined = true;
    }
    if (o.floor) { li.dataset.floor = '1'; li.classList.add('crew-floor'); if (o.title) li.title = o.title; li.dataset.floorTitle = o.title || ''; }
    return li;
  }

  // ------------------------------------------------------------------ a night taken back (NH4's scrubber, D102)
  // The page may keep the whole run every minute and go back to a kept minute (TitanicApp.keeper, TitanicApp.scrub;
  // with neither, none of this does anything). Then the talk is put back as it stood at that minute, and the later
  // orders are given again on their steps by the night's own script: this part sees them as it sees a link's replay,
  // the log growing. An order the player gave is then shown again with the lines it was first shown with (his own
  // words and the answer, or the words of the man on whose word it was given), not as an order of the officer of the
  // watch: the lines are remembered by the order's place in the log. Nothing is asked of anyone by any of it.
  const scrubbing = () => typeof A.scrubbing === 'function' && A.scrubbing() === true;
  const snap = (li) => ({ t: li.dataset.t || '', who: li.dataset.who || '', words: li.dataset.words || '', kind: li.dataset.kind || '', imagined: li.dataset.imagined === '1', floor: li.dataset.floor === '1',
    markText: li.dataset.markText || '', markTitle: li.dataset.markTitle || '', floorTitle: li.dataset.floorTitle || '', n: +li.dataset.n || 0 });
  const str = (x, n) => (typeof x === 'string' ? x.slice(0, n) : '');
  // a line as it was, from its record: built again with its own time and its own marks
  function again(s, quiet) {
    if (!s || typeof s !== 'object') return null;
    const who = str(s.who, 80), words = str(s.words, 600), kind = str(s.kind, 20) || (who ? 'yes' : 'note'), t = str(s.t, 12);
    let li;
    const n0 = Number.isInteger(s.n) && s.n > 0 ? s.n : undefined;
    if (quiet) { li = build(who, words, kind, who ? 'crew-' + kind : 'crew-note' + (kind === 'note' ? '' : ' crew-' + kind), t, n0); talk.appendChild(li); }
    else li = who ? say(who, words, kind, t, n0) : note(words, kind, t, n0);
    if (s.imagined === true) mark(li, { imagined: true, text: str(s.markText, 40) || 'imagined', title: str(s.markTitle, 400) });
    if (s.floor === true) mark(li, { floor: true, title: str(s.floorTitle, 600) });
    return li;
  }
  const memo = new Map(), MEMO = 4000;            // an order's place in the log -> { type, value, arg, lines }
  function remember(i, e, lis) {
    if (!e || !(i >= 0)) return;
    // an order given now: whatever was remembered from this place on belongs to a night that is no more
    for (const k of Array.from(memo.keys())) if (k >= i) memo.delete(k);
    memo.set(i, { k: e.k, type: e.type, value: e.value, arg: e.arg, lines: lis.filter(Boolean).map(snap).filter(s => s.kind !== 'wait') });
    if (memo.size > MEMO) memo.delete(memo.keys().next().value);
  }

  // ------------------------------------------------------------------ the line, on a watch only
  const onWatch = () => { const sim = S.sim; return !!(S.night && sim && sim.night && !A.gone(sim)); };
  // who has the bridge, as the last frame saw it: an order that changes it to 'you' has taken the watch over
  let shown = '', modeSeen = S.night ? S.night.mode : null, took = false;
  function refresh() {
    modeSeen = S.night ? S.night.mode : null;
    const sim = S.sim, on = onWatch();
    const state = on ? 'on' : (S.night && sim && sim.night ? (A.broke && A.broke(sim) ? 'broke' : 'gone') : 'preset');
    if (state === shown) return;
    shown = state;
    line.disabled = !on; bGive.disabled = !on;
    why.hidden = on;
    why.textContent = state === 'preset' ? 'Orders are given on a watch: open the watch of 14 April 1912, or another night, on this tab.'
      : (state === 'broke' ? 'She has broken in two: no one is left on the bridge to take an order.' : (state === 'gone' ? 'She has gone: no one is left on the bridge to take an order.' : ''));
    const watch = state !== 'preset';
    convRow.hidden = !watch; convLine.hidden = !watch; talkCap.hidden = !watch; talk.hidden = !watch; hint.hidden = !watch;
    intro.hidden = !watch; tries.hidden = !on; empty.hidden = !watch;
    sec.dataset.state = state;
  }

  // the rudder now ordered, degrees (+ to starboard), as "ease" and the quartermaster's answer read it
  const helmNow = (sim) => (sim && sim.mo && Mo ? Math.round(sim.mo.delCmd / Mo.DEG * 1e6) / 1e6 : 0);
  // the way on her, as the quartermaster feels it at the wheel: ahead, astern, or none (under a quarter of a metre a
  // second, about half a knot [bet]); his answer names where her head goes only with headway
  const wayNow = (sim) => { const u = sim && sim.mo ? sim.mo.u : 1; return u > 0.25 ? 'ahead' : (u < -0.25 ? 'astern' : 'none'); };
  // would an order to draw the fires change anything: a room with fires alight, not flooded and not drawn already
  // (core/systems.js, drawFires). Read before the order is given, for the answer
  function firesToDraw(sim, k) {
    const P = sim && sim.plant, R = SY && SY.PLANT && SY.PLANT.rooms;
    if (!P || !R || !P.fires || !P.out || !P.drawn) return true;
    for (let j = 0; j < R.length; j++) if ((k < 0 || j === k) && R[j].lit > 0 && P.fires[j] > 0 && !P.out[j] && !P.drawn[j]) return true;
    return false;
  }
  // the model's own reason for a refusal where the order's return holds none: the doors' switch says it in the log, the
  // boats keep theirs, the Morse lamp's is the wireless room's last line; the others follow their readers' rules
  function reasonOf(sim, o, done) {
    if (done !== false || !sim) return null;
    const t = o.type;
    if (t === 'doors') { for (let i = sim.events.length - 1; i >= 0; i--) if (/^plant:doorsDead@/.test(sim.events[i].id || '')) return sim.events[i].label; return null; }
    if (/^boats:/.test(t) && sim.people) { const r = sim.people.refused[sim.people.refused.length - 1]; return r && r.type === t ? r.why : null; }
    if (t === 'help:lamp' && sim.world) { const l = sim.world.lines[sim.world.lines.length - 1]; return l && l.kind === 'order' && /lamp/i.test(l.text) ? l.text : null; }
    if (t === 'help:call' && sim.world) return 'The call has gone out already, sir';
    if (t === 'help:rocket' && sim.world) {
      const R = sim.world.rockets, left = WD && WD.ROCKETS ? WD.ROCKETS.stock - R.fired - R.pending : 1;
      return left <= 0 ? 'Every rocket has gone up, or is ready to go, sir' : 'The bridge is awash, sir: no rocket can be fired from it';
    }
    if (/^report:/.test(t) && sim.reports && sim.reports.done) return 'The bridge is gone, sir';
    return null;
  }
  let giving = false, seen = S.sim && S.sim.night ? S.sim.night.log.length : 0, tookLi = null;
  const kept = []; let back = -1;
  // one order through TitanicApp.order, answered on the bridge (CW.readback, with the model's own reason for a refusal);
  // null off a watch. lead: the line it was given on (the captain's typed words, or a man's own), remembered with it
  function giveOne(o, lead) {
    const sim = S.sim;
    if (!onWatch()) return null;
    const first = o.type === 'help:rocket' && !!(sim.world && !sim.world.rockets.mine && sim.world.rockets.fired === 0);
    const nothing = o.type === 'fires' && !firesToDraw(sim, o.value);
    const i0 = sim.night.log.length;
    let done;
    giving = true; tookLi = null;
    try { done = A.order(o.type, o.value, o.arg); } finally { giving = false; }
    const rb = CW.readback(o, done, { convention, helm: helmNow(S.sim), why: reasonOf(S.sim, o, done), first, way: wayNow(S.sim), nothing });
    const li = say(rb.who, rb.words, rb.refused ? 'no' : 'yes');
    const w = S.sim && S.sim.night;
    if (w && w.log.length > i0) remember(i0, w.log[i0], [lead, tookLi, li]);
    tookLi = null;
    return { done, rb };
  }
  // a line the grammar reads as a question or does not read at all ('question', 'unknown'; never 'unclear') is offered to
  // a part's listener first (site/parts/88_minds.js: the crew's minds), which returns true if it took the line; else the
  // answer is step 1's own
  let hearer = null, givenHook = null;
  // A line that looks like a key, pasted here by mistake (a key has its own field, under "The crew's minds"). It is not
  // said, not kept for the up arrow and not passed on: a part may send the captain's words to a language model's provider
  // (the review of stage A). No word of English is thirty-two letters and digits long with both among them.
  // (The second review: a key followed by a full stop, in quotes or brackets, or after "key=" was not seen.)
  const KEYISH = /(?:^|[\s"'`(\[{<=:,;])(sk-[A-Za-z0-9_-]{16,}|[A-Za-z0-9_-]{32,})(?=[\s"'`)\]}>.,;:!?]|$)/;
  const KEY_NOTE = 'That looks like a key, not words for the bridge: it was not said, kept or sent. A key goes in its own field, under "The crew\'s minds".';
  function keyLike(text) { const m = KEYISH.exec(text); return !!m && (/^sk-/.test(m[1]) || (/[0-9]/.test(m[1]) && /[A-Za-z]/.test(m[1]))); }
  // a line given: read whole by the grammar, then each order through TitanicApp.order, each answered on the bridge
  function give(text) {
    text = String(text === undefined || text === null ? '' : text).trim();
    if (!text) return null;
    if (keyLike(text)) { back = -1; refresh(); if (onWatch()) note(KEY_NOTE, 'notice'); A.toast(KEY_NOTE); return null; }
    if (kept[kept.length - 1] !== text) { kept.push(text); if (kept.length > KEEP) kept.shift(); }
    back = -1;
    refresh();
    if (!onWatch()) return null;
    const r = CW.parse(text, { convention, helm: helmNow(S.sim) });
    let mine = say(YOU, text, 'you');
    if (!r.ok) {
      if ((r.kind === 'question' || r.kind === 'unknown') && hearer) {
        let taken = false;
        try { taken = hearer(text, r) === true; } catch (e) { console.error('the order line\'s listener failed:', e); }
        if (taken) { refresh(); return r; }
      }
      say(r.who, r.why, 'no'); A.toast(r.who + ': ' + r.why); return r;
    }
    const answers = [];
    took = false;
    for (const o of r.orders) {
      const g = giveOne(o, mine);
      mine = null;                                  // the captain's words stand with the first of the orders they gave
      if (!g) break;
      answers.push(g.rb.who + ': ' + g.rb.words);
      // a part may note a typed order as it is given (88: a man named in the line, who goes on the errand himself)
      if (givenHook) { try { givenHook(text, { type: o.type, value: o.value, arg: o.arg }, g); } catch (e) { console.error('the order line\'s listener failed:', e); } }
    }
    // the page's own notice for a watch taken over ("You have the bridge") would be covered by this one: it says both
    if (answers.length) A.toast((took ? 'You have the bridge. ' : '') + answers.join(' '));
    refresh();
    return r;
  }
  // for a part (88): one order given as a typed one is, with step 1's own answer in the talk and as the notice. lead:
  // the line of the talk on which it is given (the man's own words), remembered with the order
  function giveOrder(o, lead) {
    refresh();
    took = false;
    const g = o && typeof o.type === 'string' ? giveOne({ type: o.type, value: o.value, arg: o.arg }, lead && lead.dataset ? lead : null) : null;
    if (g) A.toast((took ? 'You have the bridge. ' : '') + g.rb.who + ': ' + g.rb.words);
    refresh();
    return g;
  }
  line.addEventListener('keydown', (e) => {
    if (e.isComposing) return;
    if (e.key === 'Enter') { e.preventDefault(); const t = line.value; line.value = ''; give(t); }
    else if (e.key === 'ArrowUp') { if (kept.length) { back = back < 0 ? kept.length - 1 : Math.max(0, back - 1); line.value = kept[back]; e.preventDefault(); } }
    else if (e.key === 'ArrowDown') { if (back >= 0) { back++; if (back >= kept.length) { back = -1; line.value = ''; } else line.value = kept[back]; e.preventDefault(); } }
    else if (e.key === 'Escape') { line.value = ''; back = -1; }
    e.stopPropagation();                            // the page's keys and the walk's stay out of the line
  });
  bGive.addEventListener('click', () => { const t = line.value; line.value = ''; give(t); line.focus(); });

  // ------------------------------------------------------------------ the orders it did not give, captioned
  function caption(e, who) {
    const words = CW.phrase(e, { convention }), lis = [];
    lis.push(say(who, who === YOU ? words + '.' : words + '!', who === YOU ? (e.type === 'helm' ? 'wheel' : 'you') : 'script'));
    if (e.refused) { const rb = CW.readback(e, { ok: false, why: e.refused }, { convention }); lis.push(say(rb.who, rb.words, 'no')); }
    return lis;
  }
  function catchUp(upTo) {
    const w = S.sim && S.sim.night; if (!w) return;
    const n = Math.min(upTo, w.log.length);
    for (let i = seen; i < n; i++) {
      // an order of the player's that a night taken back reaches again: the lines it was first shown with. Any other
      // (the night's own script, a link's replay) is the officer of the watch's, in the bridge's words
      const e = w.log[i], m = memo.get(i);
      if (m && m.k === e.k && m.type === e.type && m.value === e.value && m.arg === e.arg) {
        // (a line that already stands in the talk is not shown twice: a man's own words on which the order was given,
        // said before the kept minute, are there already)
        const here = new Set(Array.from(talk.children).map(li => li.dataset.n));
        for (const s of m.lines) if (!(s.n && here.has(String(s.n)))) again(s);
      }
      else caption(e, OOW);
    }
    if (n > seen) seen = n;
  }
  A.on('event', (name, data) => {
    if (name === 'order') {                         // every order given through TitanicApp.order: the page's and the parts'
      const w = S.sim && S.sim.night; if (!w) return;
      catchUp(w.log.length - 1);
      // the order took the watch over (the page's wheel does too): the talk says so, once, before the order's own line
      // (a typed order's line is there already: the note stands between it and its answer)
      const takes = modeSeen !== 'you' && !!S.night && S.night.mode === 'you';
      let noted = null;
      if (takes) { noted = note(TOOK); took = true; if (giving) tookLi = noted; }
      if (!giving && w.log.length > seen) { const i = w.log.length - 1; remember(i, w.log[i], [noted].concat(caption(w.log[i], YOU))); }
      seen = w.log.length;
      modeSeen = S.night ? S.night.mode : null;
    } else if (name === 'ordersDropped') {          // NH4: a new order in a night taken back dropped the later ones
      const i = data && typeof data.index === 'number' ? data.index : -1;
      if (i >= 0) for (const k of Array.from(memo.keys())) if (k >= i) memo.delete(k);
    } else if (name === 'foundered') refresh();
  });
  A.on('step', (sim) => { const w = sim.night; if (w && w.log.length > seen) catchUp(w.log.length); });
  A.on('reset', () => {
    seen = S.sim && S.sim.night ? S.sim.night.log.length : 0; talk.textContent = ''; said.length = 0; shown = ''; took = false; tookLi = null;
    if (!scrubbing()) memo.clear();                 // a new run: nothing of the old one is remembered
    refresh();
  });
  A.on('frame', refresh);
  // the talk at a kept minute, and its putting back (NH4). keep is plain data; scrub decides nothing
  if (typeof A.keeper === 'function') {
    A.keeper('crew', {
      keep: () => ({ lines: Array.from(talk.children).map(snap).filter(s => s.kind !== 'wait'), said: said.map(e => Object.assign({}, e)), seen, took, modeSeen }),
      scrub: (sim, st) => {
        talk.textContent = ''; said.length = 0;
        if (!st || typeof st !== 'object') return;
        if (Array.isArray(st.lines)) for (const s of st.lines.slice(-TALK)) again(s, true);
        if (Array.isArray(st.said)) for (const e of st.said.slice(-SAID)) if (e && typeof e === 'object') said.push({ t: str(e.t, 12), who: str(e.who, 80), words: str(e.words, 600), kind: str(e.kind, 20), imagined: e.imagined === true });
        const w = sim && sim.night;
        seen = w ? Math.min(Number.isInteger(st.seen) && st.seen >= 0 ? st.seen : w.log.length, w.log.length) : 0;
        took = st.took === true; modeSeen = typeof st.modeSeen === 'string' ? st.modeSeen : (S.night ? S.night.mode : null);
        shown = ''; refresh();
      },
    });
  }

  // for the tests (tools/crew_site_test.js) and for exploring; and for a part that speaks on the bridge (88: hear, say,
  // note, replace, mark, giveOrder, talkLog)
  A.crew = {
    give, keyLike, convention: () => convention, setConvention, enabled: () => !line.disabled, why: () => why.textContent, kept: () => kept.slice(),
    lines: () => [...talk.children].map(li => ({ t: li.dataset.t, who: li.dataset.who, words: li.dataset.words, kind: li.dataset.kind, imagined: li.dataset.imagined === '1', floor: li.dataset.floor === '1' })),
    hear: (fn) => { hearer = typeof fn === 'function' ? fn : null; },
    given: (fn) => { givenHook = typeof fn === 'function' ? fn : null; },
    onSaid: (fn) => { saidHook = typeof fn === 'function' ? fn : null; },
    say: (who, words, kind) => say(String(who), String(words), kind || 'mind'), note: (words, kind) => note(String(words), kind), replace, mark, giveOrder,
    // the last n lines said on the bridge (oldest first), the ones shown and those that have scrolled out
    talkLog: (n) => said.slice(-(n > 0 ? n : SAID)).map(e => Object.assign({}, e)),
    // the places in the log whose lines are remembered for a night taken back (NH4), for the tests
    remembered: () => Array.from(memo.keys()),
    // read-only, for a part that gives a line it did not type (89, the ears: a transcript tried without its commas): does
    // the grammar read this line whole as one or more orders, as give() would read it now? Gives nothing, logs nothing
    reads: (text) => { const t = String(text === undefined || text === null ? '' : text).trim(); return !!t && !keyLike(t) && CW.parse(t, { convention, helm: helmNow(S.sim) }).ok === true; },
  };
  paintConvention();
  refresh();
})();
