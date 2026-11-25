// Ask the bridge: the crew's own words (docs/DESIGN_ask_the_bridge_v1_2026-11-23.md, sections 3, 7 and 8; stage A). A part
// of the viewer (site/app.js, "parts"), on step 1's order line (site/parts/86_crew.js, TitanicApp.crew). Its words are the
// library site/parts/87_minds_words.js (TitanicMindsWords).
//
//   - The grammar of step 1 reads every line first. Only a line it reads as a question, or does not read, comes here (A.crew
//     .hear), and only while the crew's minds are on: a transport is there and its status says on. Otherwise the page is
//     step 1's page, its answers its own.
//   - Who is spoken to: a name or rank at the start of the line ("Mr Moody, ...") or after its last comma, else the one
//     chosen in the row of names, else the officer of the watch. A man out of reach is not asked: the row says where he is.
//   - The request is built from the facts of the step on which Enter was pressed (the library's one gathering function,
//     never the model's truth). While the answer is awaited the line says he has been asked, and the page's pace is held at
//     her own (TitanicApp.holdPace, owner 'minds'). One question to a man at a time, two awaited at most.
//   - The answer is shown when it comes, with the ship's time then, marked as imagined (a visible mark; data-imagined). A
//     reply that fails reading or the checks is asked for once more with its fault named; then the authored floor line is
//     said. A fault, a timeout or the limit is a notice outside the fiction: a line nobody says, and the page's notice.
//   - An order in a reply is read by step 1's grammar within the man's remit. "Ask before acting" (the default): it is
//     offered, "Give it" or "No" (or "yes", "aye", "aye aye", "do so"; "no", "belay that", typed: no model is asked), and it
//     lapses after a minute of her time. "Act on my word": it is given at once. Either way through TitanicApp.order, with
//     step 1's own answer after it.
//   - The tape (TitanicApp.minds.tape()): one entry a turn, the part's own, never written into the sim, the watch's log or
//     a link: a link replays the orders, with no key.
//   - The bridge speaks (design 14, stage C; a switch of its own, on by default by Bo's word): a report that reaches the bridge by
//     a man is given unasked in a man's own words: his who saw it or brought it, else the officer's who received it
//     (the library's speaker). No line while it is awaited and no hold of the pace: nobody asked. One such line in half
//     a minute of her time at most, none at a fast pace; words that fail the checks, come too late, or find him gone are
//     not shown, and nothing is said of it (the report itself stands where the page shows the reports). An order in
//     such a line is never read.
// The transport is window.titanicMinds, the desktop app's one object (status, set, setKey, clearKey, test, ask, usage, each
// a Promise; app/minds.js), looked up each time it is needed; a test may set another (TitanicApp.minds.useTransport), and
// TitanicApp.minds.fake() is one that answers from the library's fake after a set time of the page's clock (also with
// minds=fake in the address, a test hook as clock=test is). The page reads no wall clock and keeps no timer of its own; it
// places nothing on the stage; it keeps two settings in the page's storage (how far the officers may act, the seat last
// spoken to) and nothing else; a key typed in its field goes once to the transport and the field is cleared at once.
(function () {
  'use strict';
  const A = window.TitanicApp, CW = window.TitanicCrewWords, MW = window.TitanicMindsWords;
  if (!A || !CW || !MW || !A.crew || typeof A.crew.hear !== 'function') return;
  const S = A.state;
  const sec = document.getElementById('crewSec'), talkEl = document.getElementById('crewTalk');
  if (!sec || !talkEl) return;
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
  const KEY_ACT = 'titanic.minds.act', KEY_SEAT = 'titanic.minds.seat';
  const KEY_SPEAKS = 'titanic.minds.speaks';
  // The bridge speaks (design 14, stage C; a switch of its own, on by default): a report that reaches the bridge by a
  // man is given in a man's own words, unasked. Each such line is a question to the model, so they are kept few:
  const SPEAK_GAP = 30;     // s of her time between two such lines at least [design 14]
  const SPEAK_PACE = 4;     // none above this pace: the reports then go by faster than they can be said
  const SPEAK_STALE = 90;   // s of her time: words that come later than this after their report are not shown
  const HOLD = 25;          // s of the page's clock the pace is held at her own while an answer is awaited, renewed each step
  const LAPSE = 60;         // s of her time an offered order stands (design section 3)
  const AWAIT = 90;         // s of the page's clock an answer is awaited at most: the app bounds its own wait (60 s at most),
                            // and the page does not rest on that: a transport that never answers must not hold the pace all night
  const MARK = 'Imagined: these words are not the record\'s. They were written for this night, from what he knew on the bridge.';
  const unstop = (s) => String(s).replace(/[.!?]+$/, '');
  const clip = (s, n) => { s = String(s).replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 3) + '...' : s; };
  const cnt = (x) => (typeof x === 'number' && isFinite(x) && x > 0 ? Math.round(x) : 0);
  const store = {
    get(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* a private window: not kept */ } },
  };

  // ------------------------------------------------------------------ the transport, looked up each time
  let override = null;
  const transport = () => override || window.titanicMinds || null;
  let stat = null;                                          // the transport's last status
  const on = () => !!(transport() && stat && stat.on === true);

  // ------------------------------------------------------------------ the row of names, under the order line
  const who = el('div', 'minds-who'); who.id = 'mindsWho'; who.hidden = true;
  const whoRow = el('div', 'minds-names'); whoRow.setAttribute('role', 'group'); whoRow.setAttribute('aria-label', 'Speak to');
  const whoBtn = {};
  for (const c of MW.CAST) {
    const b = el('button', 'chip minds-name', c.short); b.type = 'button'; b.dataset.seat = c.id; b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', () => choose(c.id));
    whoBtn[c.id] = b; whoRow.appendChild(b);
  }
  const whereLine = el('p', 'hint minds-where'); whereLine.id = 'mindsWhere';
  who.append(el('span', 'crew-cap', 'Speak to'), whoRow, whereLine);
  sec.insertBefore(who, document.getElementById('crewWhy') || talkEl);

  // ------------------------------------------------------------------ an offered order, under the talk
  const offerBox = el('div', 'minds-offer'); offerBox.id = 'mindsOffer'; offerBox.hidden = true;
  const offerText = el('span', 'minds-offer-text'); offerText.id = 'mindsOfferText';
  const giveBtn = el('button', 'chip minds-give', 'Give it'); giveBtn.id = 'mindsGive'; giveBtn.type = 'button';
  const noBtn = el('button', 'chip minds-no', 'No'); noBtn.id = 'mindsNo'; noBtn.type = 'button';
  offerBox.append(offerText, giveBtn, noBtn);
  talkEl.parentNode.insertBefore(offerBox, talkEl.nextSibling);
  giveBtn.addEventListener('click', () => giveOffer());
  noBtn.addEventListener('click', () => declineOffer());

  // ------------------------------------------------------------------ "The crew's minds", folded shut
  const fold = el('details', 'minds-fold mt8'); fold.id = 'mindsFold';
  fold.appendChild(el('summary', null, 'The crew\'s minds'));
  // (what a stranger reads before any key goes in: on the public page here, and in the app at the top of the controls)
  // (the men's own words are their testimony: a line here is a language model's, in character, marked imagined; the red
  // team's row 9 of release candidate 1)
  const none = el('p', 'hint minds-none', 'Optional, and only in the desktop app: there, with a key of your own that stays on your PC, the men on the bridge can answer your questions '
    + 'in words a language model you choose writes for them, in character, each line marked imagined. A web page can neither keep a key nor call such a provider, so here the officer of the watch answers in the bridge\'s own set words.');
  none.id = 'mindsNone';
  const ctl = el('div', 'minds-ctl'); ctl.id = 'mindsCtl';
  const onBox = el('input'); onBox.type = 'checkbox'; onBox.id = 'mindsOn';
  const onLab = el('label', 'check'); onLab.append(onBox, el('span', null, 'The men on the bridge answer (written by a language model, from what each man knows)'));
  const provSel = el('select', 'minds-sel'); provSel.id = 'mindsProvider'; provSel.setAttribute('aria-label', 'The provider');
  const modelIn = el('input', 'minds-in'); modelIn.id = 'mindsModel'; modelIn.type = 'text'; modelIn.autocomplete = 'off'; modelIn.spellcheck = false; modelIn.setAttribute('aria-label', 'The model');
  // the models the provider says it offers ("Try it" with no model named asks it): offered under the model's field
  const modelList = el('datalist'); modelList.id = 'mindsModels'; modelIn.setAttribute('list', 'mindsModels');
  // (of: whose list it is, so that the app's own list of a provider's models is put there once, and one "Try it" brought stays)
  function offerModels(ids, of) {
    modelList.textContent = ''; modelList.dataset.of = of || '';
    for (const id of (Array.isArray(ids) ? ids : []).slice(0, 200)) { if (typeof id !== 'string' || !id || id.length > 100) continue; const o = document.createElement('option'); o.value = id; modelList.appendChild(o); }
  }
  const baseIn = el('input', 'minds-in'); baseIn.id = 'mindsBase'; baseIn.type = 'text'; baseIn.autocomplete = 'off'; baseIn.spellcheck = false; baseIn.setAttribute('aria-label', 'The address of a server that speaks chat completions');
  const keyIn = el('input', 'minds-in'); keyIn.id = 'mindsKey'; keyIn.type = 'password'; keyIn.autocomplete = 'off'; keyIn.spellcheck = false; keyIn.placeholder = 'Your key';
  keyIn.setAttribute('aria-label', 'Your key, read once and cleared');
  const keySave = el('button', 'chip', 'Save'); keySave.id = 'mindsKeySave'; keySave.type = 'button';
  const keyForget = el('button', 'chip', 'Forget'); keyForget.id = 'mindsKeyForget'; keyForget.type = 'button';
  const keyNote = el('p', 'hint minds-keynote'); keyNote.id = 'mindsKeyNote';
  const tryBtn = el('button', 'chip', 'Try it'); tryBtn.id = 'mindsTry'; tryBtn.type = 'button';
  const tryOut = el('span', 'hint minds-tryout'); tryOut.id = 'mindsTryOut';
  const actSeg = el('div', 'seg minds-act'); actSeg.id = 'mindsAct'; actSeg.setAttribute('role', 'group'); actSeg.setAttribute('aria-label', 'How far the officers may act');
  const bAsk = el('button', null, 'Ask before acting'), bAct = el('button', null, 'Act on my word');
  bAsk.type = 'button'; bAct.type = 'button'; bAsk.dataset.act = 'ask'; bAct.dataset.act = 'act';
  actSeg.append(bAsk, bAct);
  const speaksBox = el('input'); speaksBox.type = 'checkbox'; speaksBox.id = 'mindsSpeaks';
  const speaksLab = el('label', 'check mt6'); speaksLab.append(speaksBox, el('span', null, 'They speak up unasked: a report that reaches the bridge is given by the man who brings it, in words the model writes (each one is a question to the model)'));
  const useLine = el('p', 'hint minds-use'); useLine.id = 'mindsUse';
  const limQ = el('input', 'minds-num'); limQ.id = 'mindsLimitQ'; limQ.type = 'number'; limQ.min = '1'; limQ.step = '1'; limQ.setAttribute('aria-label', 'The most questions in a run of the app');
  const limT = el('input', 'minds-num'); limT.id = 'mindsLimitT'; limT.type = 'number'; limT.min = '1000'; limT.step = '1000'; limT.setAttribute('aria-label', 'The most tokens in a run of the app');
  const msg = el('p', 'hint minds-msg'); msg.id = 'mindsMsg';
  const row = (label, ...kids) => { const r = el('div', 'kv mt6 minds-row'); const v = el('span', 'minds-val'); v.append(...kids); r.append(el('span', null, label), v); return r; };
  const provRow = row('Provider', provSel), modelRow = row('Model', modelIn, modelList), baseRow = row('Address', baseIn), keyRow = row('Key', keyIn, keySave, keyForget);
  const tryRow = el('div', 'row mt6'); tryRow.append(tryBtn, tryOut);
  const pair = (field, unit) => { const p = el('span', 'minds-pair'); p.append(field, el('span', 'hint', unit)); return p; };
  const actRow = row('The officers', actSeg), limRow = row('Limit', pair(limQ, 'questions'), pair(limT, 'tokens'));
  const about = el('p', 'hint minds-about', 'Optional, and off each time the app starts. With a key of your own from a language-model provider (Claude, OpenAI, Google Gemini, Cerebras), '
    + 'or with a model running on this PC, which needs no key, the men on the bridge answer your questions in words a language model writes for them, in character, each line marked imagined. '
    + 'Your key is kept on this PC, encrypted by Windows, and is sent '
    + 'only to the provider you choose, who bills you for each answer a man gives. Before anything is sent the app asks you, in a message box of its own.');
  about.id = 'mindsAbout';
  ctl.append(about, onLab, provRow, modelRow, baseRow, keyRow, keyNote, tryRow, actRow, speaksLab, useLine, limRow, msg,
    el('p', 'hint mt6', 'Each line a man says here is imagined, and marked so: the words are a language model\'s, the facts are the bridge\'s as this model has them, and he knows nothing more. Your key stays in the app.'));
  fold.append(none, ctl);
  sec.appendChild(fold);

  // ------------------------------------------------------------------ the settings kept: how far the officers act, whom
  let act = store.get(KEY_ACT) === 'act' ? 'act' : 'ask';
  let chosen = MW.SEATS.indexOf(store.get(KEY_SEAT)) >= 0 ? store.get(KEY_SEAT) : null;
  function setAct(a) { act = a === 'act' ? 'act' : 'ask'; store.set(KEY_ACT, act); paintFold(); }
  function choose(seat) { if (!MW.BY[seat]) return; chosen = seat; store.set(KEY_SEAT, seat); paintWho(); }
  bAsk.addEventListener('click', () => setAct('ask'));
  bAct.addEventListener('click', () => setAct('act'));

  // ------------------------------------------------------------------ the night's turns, its use, its tape
  let night = 0, turnN = 0, tape = [], offer = null, dirty = true, shownFor;
  const awaited = new Map();                               // seat -> the turn awaited from him
  const use = { asked: 0, in: 0, out: 0 };
  // A night taken back (NH4's scrubber, D102; with no TitanicApp.keeper none of this does anything). The page may go
  // back to a kept minute and play the night on from there, its later orders given again by the night's own script.
  // Two rules hold here: a scrub asks no language model for anything by itself, and a line already given for a report
  // is shown again when the night reaches that report again, never written again. So:
  //   - tMax is the furthest moment of this night that has been played. Only past it may a report be asked for: a
  //     moment played before never asks, whatever the switches say now;
  //   - spoke keeps, by the report as it reached the bridge (its time and its words: a night that has since gone another
  //     way simply has no such report), the line it was given with;
  //   - an order given now in a night taken back makes every later moment new again (cutAt).
  const scrubbing = () => typeof A.scrubbing === 'function' && A.scrubbing() === true;
  // (After the review of this: a new order no longer forgets the lines given for the reports after it. The same report,
  // by its time and its words, may well come again whatever the order was, and it was then asked for a second time. A
  // night that has gone another way simply has no such report. tFar is the furthest moment EVER played, which no order
  // moves: up to it a report that comes is looked up, whatever the pace and the switches. And a man's errand is noted
  // again when the night reaches the order by which he went: errandAt, by that order's place in the log.)
  let tMax = -1, tFar = -1, logSeen = 0;
  const spoke = new Map(), SPOKE = 600;
  const errandAt = new Map();
  const repKey = (e) => e.t + '|' + String(e.words);
  function cutAt(t) { if (t < tMax) tMax = t; }
  // The errands a man went on himself, by an order from his own answer ("I will go forward and look"): seat -> the
  // reports reader's keys. While one is out he is away, and is not asked (the reader says only "an officer": the library's
  // reach is told here who it was). A key is dropped when the reader's errand has ended: he is back
  let sent = {};
  function sentNow(view) {
    const out = (view && view.reports && view.reports.errands) || [];
    for (const s of Object.keys(sent)) { sent[s] = sent[s].filter(k => out.indexOf(k) >= 0); if (!sent[s].length) delete sent[s]; }
    return sent;
  }
  const reachOf = (view) => MW.reach(view, sentNow(view));
  // an order has been given that the man of `seat` carries out by going himself (from his own answer, or typed to him
  // by name: "Mr Boxhall, go forward and look"): he is away on that errand
  function gone(seat, order, g) {
    const key = MW.errandOf(order, seat);
    if (key && g && g.done !== false && !(g.rb && g.rb.refused)) {
      (sent[seat] = sent[seat] || []).push(key); dirty = true;
      const w = S.sim && S.sim.night;
      if (w && w.log.length) { errandAt.set(w.log.length - 1, { seat, key, k: w.log[w.log.length - 1].k, type: order.type, value: order.value }); if (errandAt.size > 400) errandAt.delete(errandAt.keys().next().value); }
    }
  }
  // a typed order that names a man: step 1's grammar reads the order and gives it; this part notes who went
  if (typeof A.crew.given === 'function') A.crew.given((text, order, g) => { const a = MW.addressee(text); if (a.seat) gone(a.seat, order, g); });

  // a line nobody says, in the talk and as the page's notice
  function notice(words) { A.crew.note(words, 'notice'); A.toast(words); }
  // the pace is held for an answer the captain asked for, never for a report given unasked (the watch does not wait on those)
  const asked = () => { for (const t of awaited.values()) if (t.kind !== 'report') return true; return false; };
  const hold = () => { A.holdPace(HOLD, 'minds'); };
  const release = () => { if (!asked()) A.holdPace(0, 'minds'); };
  const kNow = () => (S.sim && S.sim.night ? S.sim.night.k : -1);
  const helmNow = () => (S.sim ? MW.gather(S.sim).helm : 0);
  function limitReached() {
    const L = stat && stat.limits, U = stat && stat.used;
    if (!L || !U) return null;
    if (typeof L.questions === 'number' && cnt(U.questions) >= L.questions) return L.questions + ' questions';
    if (typeof L.tokens === 'number' && cnt(U.tokens) >= L.tokens) return L.tokens + ' tokens';
    return null;
  }

  // what wrote a generated line, for its mark: the provider as the app names it, and the model
  function writtenBy() {
    const s = stat, P = s && Array.isArray(s.providers) ? s.providers.find(p => p.id === s.provider) : null;
    const name = P && P.label ? String(P.label) : (s && s.provider ? String(s.provider) : '');
    const model = s && typeof s.modelUsed === 'string' && s.modelUsed ? s.modelUsed : '';
    return name ? ' Written by: ' + clip(name, 90) + (model ? ' (' + clip(model, 60) + ')' : '') + '.' : '';
  }

  // ------------------------------------------------------------------ a line the grammar did not take
  function heard(text) {
    const sim = S.sim;
    if (!S.night || !sim || !sim.night || A.gone(sim)) return false;
    // "yes" or "no" to the man who offered an order: no model is asked. A bare "yes" is a word to the man the captain is
    // speaking with: it gives the offered order only when he is the man who offered it (the second review: Mr Murdoch's
    // offered helm order was given by a "yes" meant for Mr Moody's question). The offer's own buttons always stand.
    if (offer && (MW.addressee(text).seat || chosen || 'murdoch') === offer.turn.seat) {
      const ans = MW.offerAnswer(text, offer.turn.seat);
      if (ans === 'yes') { giveOffer(); return true; }
      if (ans === 'no') { declineOffer(); return true; }
    }
    if (!on()) return false;
    const a = MW.addressee(text);
    if (a.other) { notice(MW.notice(a.line === 'wireless' ? 'wireless' : 'other', a.other)); return true; }
    const seat = a.seat || chosen || 'murdoch', c = MW.BY[seat];
    const view = MW.gather(sim), R = reachOf(view);
    if (!R[seat].in) { notice(R[seat].where); paintWho(R); return true; }
    if (a.seat) choose(a.seat);                               // a name at the start of the line sets who is spoken to, as a click does
    // The captain's question comes first: a report the man was giving unasked gives way to it (his words for it, when
    // they come, are not shown), and so does one of two such reports when both places are taken. Only another QUESTION
    // still awaited makes the captain wait.
    const mine = awaited.get(seat);
    if (mine && mine.kind === 'report') finish(mine, 'dropped: the captain spoke to him');
    else if (mine) { notice(MW.notice('waiting', c.name)); return true; }
    if (awaited.size >= 2) {
      const unasked = [...awaited.values()].find(t => t.kind === 'report');
      if (unasked) finish(unasked, 'dropped: the captain spoke');
      else { notice(MW.notice('two')); return true; }
    }
    const lim = limitReached();
    if (lim) { notice(MW.notice('limit', lim)); return true; }
    ask(seat, view, text);
    return true;
  }
  A.crew.hear(heard);

  function ask(seat, view, words) {
    const sim = S.sim, c = MW.BY[seat], ctx = { convention: A.crew.convention(), helm: view.helm };
    const talk = A.crew.talkLog(MW.KEEP.talk + 1);
    const last = talk[talk.length - 1];
    if (last && last.who === 'You' && last.words === words) talk.pop();         // the captain's words stand apart
    const req = MW.request(seat, view, talk, words, ctx);
    const turn = { n: ++turnN, night, seat, who: c.name, words, k: sim.night.k, t: A.clockOf(sim.t) || '', at: A.now(), facts: MW.hash(MW.facts(view, seat, ctx)),
      req, ctx, attempts: [], order: null, say: null, end: null, kEnd: -1, kGiven: -1, li: null };
    tape.push(turn);
    turn.li = A.crew.note(MW.notice('asked', c.name), 'wait');
    awaited.set(seat, turn);
    hold();
    send(turn, req);
    paintWho();
  }
  function send(turn, req) {
    const T = transport();
    use.asked++;
    if (stat && stat.used) stat.used.questions = cnt(stat.used.questions) + 1;    // as the app counts it, until its own count comes back
    // each request is answered once: by the transport, or by the page's own bound on the wait, whichever comes first
    let once = false;
    // (a fault of the page's own while his answer is read must not leave him awaited for good, with the pace held)
    const done = (res) => {
      if (once) return; once = true;
      try { answered(turn, req, res); } catch (e) {
        console.error('the crew\'s minds failed on an answer:', e);
        try { if (turn.end === null) finish(turn, 'dropped: a fault of the page\'s own', turn.kind === 'report' ? undefined : MW.notice('fault', turn.who, 'the page could not read it')); } catch (e2) { awaited.delete(turn.seat); }
      }
    };
    let p = null;
    try { p = T && typeof T.ask === 'function' ? T.ask({ seat: req.seat, stable: req.stable, changing: req.changing }) : null; } catch (e) { p = null; }
    if (p && typeof p.then === 'function') {
      p.then(done, () => done({ ok: false, kind: 'network', why: 'the call to the app failed' }));
      A.after(AWAIT * 1000, () => done({ ok: false, kind: 'timeout', why: 'no answer came in ' + AWAIT + ' seconds' }));
    } else done(p && typeof p === 'object' ? p : { ok: false, kind: 'network', why: 'there is no app to ask' });
  }
  function answered(turn, req, res) {
    if (turn.end !== null || turn.night !== night) return;           // ended already, or a new run since
    const sim = S.sim, c = MW.BY[turn.seat];
    const at = { k: kNow(), t: sim ? A.clockOf(sim.t) || '' : '', ms: A.now() - turn.at, text: null, fault: null, read: null, check: null };
    turn.attempts.push(at);
    if (turn.kind === 'report') { answeredReport(turn, res, at); return; }   // a report given unasked: its own, quieter, rules
    if (!res || res.ok !== true) {                                   // a fault: off, no-key, budget, timeout, network ... or one not known
      const kind = res && typeof res.kind === 'string' ? clip(res.kind, 20) : 'fault';
      at.fault = kind;
      finish(turn, 'dropped: ' + kind, MW.notice('fault', c.name, unstop(clip(res && typeof res.why === 'string' && res.why ? res.why : 'no answer came', 200))));
      refreshStatus();
      return;
    }
    const u = res.usage || {};
    use.in += cnt(u.in); use.out += cnt(u.out);
    if (stat && stat.used) stat.used.tokens = cnt(stat.used.tokens) + cnt(u.in) + cnt(u.out);
    refreshUsage();
    at.text = typeof res.text === 'string' ? res.text : '';
    if (!sim || !sim.night || A.gone(sim)) { finish(turn, 'dropped: she has gone', MW.notice('gone', c.name)); return; }
    if (!reachOf(MW.gather(sim))[turn.seat].in) { finish(turn, 'dropped: he has left the bridge', MW.notice('left', c.name)); return; }
    const rt = MW.readTurn(at.text);
    at.read = rt.ok ? { ok: true } : { ok: false, fault: rt.fault, why: rt.why };
    // checked against what he was first given (the retry's own words name the fault, and must not make it allowed)
    const ck = rt.ok ? MW.check(rt.say, turn.req.changing, c, turn.ctx) : null;
    if (ck) at.check = { ok: ck.ok, faults: ck.faults.map(f => f.kind + ': ' + f.what) };
    if (!rt.ok || !ck.ok) {
      if (turn.attempts.length < 2) { send(turn, MW.retry(turn.req, rt.ok ? ck.faults : [{ kind: rt.fault, why: rt.why }])); return; }
      // the floor: the authored line, said by him (not imagined); the tape keeps both attempts. The line's own note (its
      // tooltip) says that words were written for him and not shown, and why: a player must be able to tell a man who
      // does not know from an answer that was struck out
      const f = MW.lineOf(turn.seat, MW.FLOOR, 'floor');
      const whyNot = turn.attempts.map(a => (a.check && a.check.faults.length ? a.check.faults.join(', ') : (a.read && a.read.why) || a.fault || '')).filter(Boolean);
      turn.li = A.crew.mark(A.crew.replace(turn.li, f.who, f.words, 'mind'), { floor: true,
        title: 'Words were written for him twice and not shown: they failed the checks on what he may say. ' + clip(whyNot.join(' | '), 300) });
      A.toast(f.who + ': ' + f.words);
      finish(turn, 'none');
      return;
    }
    const line = MW.lineOf(turn.seat, rt.say, 'generated');
    turn.say = line.words;
    // marked as imagined, and the mark says what wrote the words: the provider's name as the app gives it (under the
    // fake, a test hook, that name says it is a table and no model)
    turn.li = A.crew.mark(A.crew.replace(turn.li, line.who, line.words, 'mind'), { imagined: true, title: MARK + writtenBy() });
    A.toast(line.who + ' (imagined): ' + line.words);
    if (rt.order === null) { finish(turn, 'none'); return; }
    const ro = MW.readOrder(rt.order, turn.seat, { convention: turn.ctx.convention, helm: helmNow() });
    turn.order = { said: rt.order, read: ro.ok ? ro.order : null, why: ro.ok ? null : ro.why, refused: false };
    // an order that cannot be read, is not his to give, or whose helm words and her head do not agree: nothing is given,
    // and a line nobody says tells the player so (his words above may have claimed it)
    if (!ro.ok) { finish(turn, 'dropped: ' + ro.why); notice(MW.notice('dropped', c.name, unstop(clip(ro.why, 160)))); return; }
    if (act === 'act') {                                               // "Act on my word": given at once, as a typed order is
      const g = A.crew.giveOrder(ro.order, turn.li);
      turn.kGiven = g ? kNow() : -1; turn.order.refused = !!(g && g.rb.refused);
      gone(turn.seat, ro.order, g);
      finish(turn, g ? 'given' : 'dropped: no watch to take it');
      return;
    }
    if (offer) endOffer('dropped: another order was offered', null);
    offer = { turn, order: ro.order, words: ro.words, t0: sim.t };
    finish(turn, 'offered');
    paintOffer();
  }
  // ------------------------------------------------------------------ the bridge speaks (stage C)
  // On unless the player has switched it off (Bo, 2026-11-23: "yes on by default if you can, since thats already
  // assuming user has provided api keys etc"). It does nothing until the crew's minds themselves are on.
  let speaks = store.get(KEY_SPEAKS) !== '0', feedSeen = -1, lastSpoke = -1e9;
  // (switched ON, it begins with the reports still to come; switched off, the place in the reports is left as it is: a
  // night taken back still shows the lines it was given, whatever this switch says now)
  function setSpeaks(v) { speaks = v === true; store.set(KEY_SPEAKS, speaks ? '1' : '0'); if (speaks) feedSeen = -1; dirty = true; }
  speaksBox.addEventListener('change', () => setSpeaks(speaksBox.checked));
  // Reports have just reached the bridge (the newest lines of the reports reader's feed, as the bridge's view has them).
  // The newest that a man of the cast would give (he saw it, brought it, or received it) is given in his own words, when
  // he is free to, the last such line is half a minute of her time old, and the run's limit allows. One line at most.
  function maybeSpeak(sim, view, fresh, places) {
    if (sim.t - lastSpoke < SPEAK_GAP - 1e-9 || awaited.size >= 2 || limitReached()) return;
    const away = sentNow(view);
    for (let i = fresh.length - 1; i >= 0; i--) {
      const e = fresh[i], sp = MW.speaker(view, e, away);
      if (!sp || awaited.has(sp.seat)) continue;
      const c = MW.BY[sp.seat], ctx = { convention: A.crew.convention(), helm: view.helm };
      const req = MW.requestReport(sp.seat, view, A.crew.talkLog(MW.KEEP.talk), e, sp.how, ctx);
      const turn = { n: ++turnN, night, kind: 'report', rep: repKey(e), fi: places ? places[i] : -1, seat: sp.seat, who: c.name, words: '(a report, ' + sp.how + ') ' + clip(e.words, 200), k: sim.night.k, t: A.clockOf(sim.t) || '', at: A.now(), t0: sim.t,
        facts: MW.hash(MW.facts(view, sp.seat, ctx)), req, ctx, attempts: [], order: null, say: null, end: null, kEnd: -1, kGiven: -1, li: null };
      tape.push(turn); awaited.set(sp.seat, turn); lastSpoke = sim.t;
      send(turn, req);                                          // no line while it is awaited, and no hold: nobody asked
      dirty = true;
      return;
    }
  }
  // His words have come. They are shown as his line, marked as imagined, if they read and pass the checks, he is still
  // there, and they are not stale. Otherwise nothing is shown and nothing is said of it: the report itself stands where
  // the page shows the reports, and an unasked line that failed is no news. One attempt; an order in it is not read.
  function answeredReport(turn, res, at) {
    const sim = S.sim;
    if (!res || res.ok !== true) { at.fault = res && typeof res.kind === 'string' ? clip(res.kind, 20) : 'fault'; finish(turn, 'dropped: ' + at.fault); refreshStatus(); return; }
    const u = res.usage || {};
    use.in += cnt(u.in); use.out += cnt(u.out);
    if (stat && stat.used) stat.used.tokens = cnt(stat.used.tokens) + cnt(u.in) + cnt(u.out);
    refreshUsage();
    at.text = typeof res.text === 'string' ? res.text : '';
    if (!sim || !sim.night || A.gone(sim)) { finish(turn, 'dropped: she has gone'); return; }
    if (sim.t - turn.t0 > SPEAK_STALE) { finish(turn, 'dropped: his words came too late'); return; }
    if (!reachOf(MW.gather(sim))[turn.seat].in) { finish(turn, 'dropped: he has left the bridge'); return; }
    const rt = MW.readTurn(at.text);
    at.read = rt.ok ? { ok: true } : { ok: false, fault: rt.fault, why: rt.why };
    const ck = rt.ok ? MW.check(rt.say, turn.req.changing, MW.BY[turn.seat], turn.ctx) : null;
    if (ck) at.check = { ok: ck.ok, faults: ck.faults.map(f => f.kind + ': ' + f.what) };
    if (!rt.ok || !ck.ok) { finish(turn, 'dropped: his words failed the checks'); return; }
    const line = MW.lineOf(turn.seat, rt.say, 'generated');
    turn.say = line.words;
    if (rt.order !== null) turn.order = { said: rt.order, read: null, why: 'a report gives no order', refused: false };
    const title = MARK + writtenBy();
    turn.li = A.crew.mark(A.crew.say(line.who, line.words, 'mind'), { imagined: true, title });
    // remembered with the report it was given for: a night taken back shows it again there, and asks nobody (NH4)
    if (turn.rep) { spoke.set(turn.rep, { who: line.who, words: line.words, title }); if (spoke.size > SPOKE) spoke.delete(spoke.keys().next().value); }
    finish(turn, 'said');
  }

  // the turn ends (or stands offered): no longer awaited; words, a notice in the place of the awaited line
  function finish(turn, end, words) {
    turn.end = end; turn.kEnd = kNow();
    if (awaited.get(turn.seat) === turn) awaited.delete(turn.seat);
    if (words) { turn.li = A.crew.replace(turn.li, '', words, 'notice'); A.toast(words); }
    release(); dirty = true;
  }

  // ------------------------------------------------------------------ the offer
  function headOf(o) {
    if (o.type !== 'helm') return '';
    const v = o.value;
    if (typeof v === 'number') return v === 0 ? ' (amidships)' : ' (her head to ' + (v < 0 ? 'port' : 'starboard') + ')';
    return v === 'away' ? ' (away from the ice)' : (v === 'reverse' ? ' (the helm to the other side)' : '');
  }
  function paintOffer() {
    const sim = S.sim, watch = !!(S.night && sim && sim.night && !A.gone(sim));
    offerBox.hidden = !(offer && watch);
    if (!offer) return;
    offerText.textContent = offer.turn.who + ' offers: ' + unstop(offer.words) + '.';
    giveBtn.textContent = 'Give it: ' + unstop(offer.words) + headOf(offer.order);
  }
  function endOffer(end, words) {
    const o = offer; if (!o) return;
    offer = null;
    o.turn.end = end; o.turn.kEnd = kNow();
    if (words) notice(words);
    paintOffer();
  }
  function giveOffer() {
    const o = offer; if (!o) return;
    offer = null; paintOffer();
    const g = A.crew.giveOrder(o.order, o.turn.li);
    o.turn.end = g ? 'given' : 'dropped: no watch to take it'; o.turn.kEnd = kNow(); o.turn.kGiven = g ? kNow() : -1;
    if (o.turn.order) o.turn.order.refused = !!(g && g.rb.refused);
    gone(o.turn.seat, o.order, g);
    dirty = true;
  }
  function declineOffer() { if (offer) endOffer('declined', MW.notice('declined', unstop(offer.words))); }

  // ------------------------------------------------------------------ the settings: the transport's own
  function refreshStatus() {
    const T = transport();
    if (!T || typeof T.status !== 'function') { stat = null; dirty = true; return Promise.resolve(null); }
    let p = null;
    try { p = T.status(); } catch (e) { p = null; }
    return Promise.resolve(p).then((s) => { if (transport() === T) { stat = s && typeof s === 'object' && s.ok !== false ? s : null; dirty = true; } return stat; }, () => { stat = null; dirty = true; return null; });
  }
  function refreshUsage() {
    const T = transport();
    if (!T || typeof T.usage !== 'function') return;
    let p = null;
    try { p = T.usage(); } catch (e) { p = null; }
    Promise.resolve(p).then((u) => { if (stat && u && u.ok !== false && u.used && transport() === T) { stat.used = { questions: cnt(u.used.questions), tokens: cnt(u.used.tokens) }; if (u.limits) stat.limits = u.limits; dirty = true; } }, () => {});
  }
  function setT(patch) {
    const T = transport();
    if (!T || typeof T.set !== 'function') return Promise.resolve(null);
    let p = null;
    try { p = T.set(patch); } catch (e) { p = null; }
    return Promise.resolve(p).then((s) => {
      if (s && s.ok === false) { msg.textContent = unstop(clip(s.why || 'The setting was refused', 200)) + '.'; return refreshStatus(); }
      msg.textContent = '';
      if (s && typeof s === 'object') { stat = s; dirty = true; return s; }
      return refreshStatus();
    }, () => refreshStatus());
  }
  function call(name, arg) {                               // setKey, clearKey: their answer is a status, or a fault
    const T = transport();
    if (!T || typeof T[name] !== 'function') return Promise.resolve(null);
    let p = null;
    try { p = arg === undefined ? T[name]() : T[name](arg); } catch (e) { p = null; }
    return Promise.resolve(p).then((s) => { msg.textContent = s && s.ok === false ? unstop(clip(s.why || 'Refused', 200)) + '.' : ''; return refreshStatus(); }, () => refreshStatus());
  }
  onBox.addEventListener('change', () => setT({ on: onBox.checked }));
  provSel.addEventListener('change', () => { offerModels([]); tryOut.textContent = ''; setT({ provider: provSel.value }); });
  modelIn.addEventListener('change', () => setT({ model: modelIn.value.trim() }));
  baseIn.addEventListener('change', () => setT({ base: baseIn.value.trim() }));
  limQ.addEventListener('change', () => { const v = Math.round(+limQ.value); if (v > 0) setT({ limits: { questions: v } }); });
  limT.addEventListener('change', () => { const v = Math.round(+limT.value); if (v > 0) setT({ limits: { tokens: v } }); });
  // the key: read once, passed once to the app, and the field cleared at once; it is never kept in the page
  function saveKey() { const v = keyIn.value; keyIn.value = ''; if (v) call('setKey', v); }
  keySave.addEventListener('click', saveKey);
  keyIn.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); saveKey(); } e.stopPropagation(); });
  keyForget.addEventListener('click', () => { keyIn.value = ''; call('clearKey'); });
  for (const f of [modelIn, baseIn, limQ, limT]) f.addEventListener('keydown', (e) => e.stopPropagation());
  tryBtn.addEventListener('click', () => {
    const T = transport();
    if (!T || typeof T.test !== 'function') return;
    tryOut.textContent = 'Asking...';
    let p = null;
    try { p = T.test(); } catch (e) { p = null; }
    const shown = (r) => {
      if (r && r.ok === true) tryOut.textContent = 'It answered in ' + (cnt(r.ms) / 1000).toFixed(1) + ' s' + (r.model ? ', with ' + clip(r.model, 60) : '') + '.';
      else tryOut.textContent = 'No answer: ' + unstop(clip(r && r.why ? r.why : 'the call failed', 240)) + '.';
      if (r && Array.isArray(r.models)) offerModels(r.models, 'provider');     // no model was named: the provider's own list, to choose from
      refreshStatus();
    };
    if (p && typeof p.then === 'function') p.then(shown, () => shown(null)); else shown(p);
  });

  // ------------------------------------------------------------------ painting
  function paintWho(R0) {
    const sim = S.sim, watch = !!(S.night && sim && sim.night && !A.gone(sim)), show = watch && on();
    who.hidden = !show;
    if (!show) return;
    const R = R0 || reachOf(MW.gather(sim)), cur = chosen || 'murdoch', away = [];
    for (const c of MW.CAST) {
      const b = whoBtn[c.id], r = R[c.id];
      b.setAttribute('aria-pressed', String(cur === c.id));
      b.classList.toggle('minds-out', !r.in); b.classList.toggle('minds-asked', awaited.has(c.id));
      b.dataset.in = r.in ? '1' : '0'; b.dataset.where = r.where; b.title = r.in ? c.name + ': ' + r.where : r.where;
      if (!r.in) away.push(r.where);
    }
    whereLine.textContent = 'Speaking to ' + MW.BY[cur].name + '.' + (away.length ? ' ' + away.join(' ') : '');
  }
  function paintFold() {
    const T = transport();
    none.hidden = !!T; ctl.hidden = !T;
    bAsk.setAttribute('aria-pressed', String(act === 'ask')); bAct.setAttribute('aria-pressed', String(act === 'act'));
    if (!T) return;
    const s = stat;
    for (const f of [onBox, provSel, modelIn, baseIn, keyIn, keySave, keyForget, tryBtn, limQ, limT, speaksBox]) f.disabled = !s;
    speaksBox.checked = speaks;
    if (!s) { useLine.textContent = 'The app does not answer.'; return; }
    onBox.checked = s.on === true;
    const P = Array.isArray(s.providers) ? s.providers : [], ids = P.map(p => p.id).join(',');
    if (provSel.dataset.ids !== ids) {
      provSel.textContent = '';
      for (const p of P) provSel.appendChild(new Option(String(p.label || p.id), String(p.id)));
      provSel.dataset.ids = ids;
    }
    if (s.provider !== undefined) provSel.value = String(s.provider);
    provRow.hidden = !P.length;
    if (document.activeElement !== modelIn) modelIn.value = typeof s.model === 'string' ? s.model : '';
    modelIn.placeholder = typeof s.modelUsed === 'string' && s.modelUsed ? s.modelUsed : 'its name';
    const prov = P.find(p => p.id === s.provider);
    // a provider whose models the app knows by name (Claude's): offered under the model's field, the default first
    if (prov && Array.isArray(prov.models) && prov.models.length && !modelList.dataset.of) offerModels(prov.models, 'app');
    baseRow.hidden = !(prov && prov.fixed === false);
    if (document.activeElement !== baseIn) baseIn.value = typeof s.base === 'string' ? s.base : '';
    keyRow.hidden = s.needsKey === false;
    keyNote.hidden = s.needsKey === false;
    keyNote.textContent = (s.hasKey ? 'A key is kept' + (s.keyKept === 'run' ? ' for this run of the app only.' : ', encrypted by the system\'s own key store on this PC.') : 'No key is kept.')
      + (s.keyElsewhere === true ? ' A key is kept for another address: it is not sent to this one. Enter it again for this address.' : '')
      + ' The system keeps it from other users of this PC, not from your own programs.' + (s.canProtect === false ? ' This PC cannot protect a key: it is kept for the run only.' : '');
    const L = s.limits || {}, U = s.used || {};
    useLine.textContent = 'This night: ' + use.asked + (use.asked === 1 ? ' question' : ' questions') + '; ' + use.in + ' tokens in, ' + use.out + ' out.'
      + (L.questions ? ' This run of the app: ' + cnt(U.questions) + ' of ' + L.questions + ' questions, ' + cnt(U.tokens) + ' of ' + L.tokens + ' tokens.' : '');
    if (document.activeElement !== limQ && L.questions) limQ.value = String(L.questions);
    if (document.activeElement !== limT && L.tokens) limT.value = String(L.tokens);
  }
  function paint() { paintWho(); paintOffer(); paintFold(); }

  // ------------------------------------------------------------------ the model's steps and the page's moments
  A.on('step', (sim) => {
    if (asked()) hold();
    // a moment of this night not played before: only there may a report be asked for (a night taken back plays its
    // moments again, and asks nobody)
    const live = sim.t > tMax;
    if (live) tMax = sim.t;
    const before = sim.t <= tFar;                  // a moment that has been played before, whatever orders have come since
    if (!before) tFar = sim.t;
    // a man's errand, noted again when the night reaches the order by which he went (given again by the night's own script)
    const w = sim.night;
    if (w && w.log.length !== logSeen) {
      for (let i = Math.max(0, logSeen); i < w.log.length; i++) {
        const m = errandAt.get(i), e = w.log[i];
        if (m && e.k === m.k && e.type === m.type && e.value === m.value && !(sent[m.seat] || []).includes(m.key)) { (sent[m.seat] = sent[m.seat] || []).push(m.key); dirty = true; }
      }
      logSeen = w.log.length;
    }
    // the bridge speaks: the reports that have reached the bridge since the last step looked. Not at a fast pace, where
    // they go by faster than they can be said; and after such a stretch it begins with the reports still to come.
    // A report that was given a line once is shown with that line again when it comes again, whatever the pace and the
    // switches say now (it is the night's own, and costs nothing), and is never asked for a second time
    const asking = live && speaks && on() && A.pace() <= SPEAK_PACE, showing = before && spoke.size > 0;
    if (asking || showing) {
      const view = MW.gather(sim), F = view.reports ? view.reports.feed : [];
      if (feedSeen < 0 || feedSeen > F.length) feedSeen = F.length;
      else if (F.length > feedSeen) {
        const base = feedSeen, fresh = F.slice(feedSeen); feedSeen = F.length;
        const rest = [], places = [];
        fresh.forEach((e, j) => {
          const m = spoke.get(repKey(e));
          if (m) { A.crew.mark(A.crew.say(m.who, m.words, 'mind'), { imagined: true, title: m.title }); lastSpoke = sim.t; dirty = true; }
          else { rest.push(e); places.push(base + j); }
        });
        if (asking && rest.length) maybeSpeak(sim, view, rest, places);
      }
    } else feedSeen = -1;
    if (offer) {
      // an offer stands a minute of her time, and only while the man who made it is there to carry it out
      if (sim.t - offer.t0 >= LAPSE - 1e-9) endOffer('lapsed', MW.notice('lapsed', unstop(offer.words)));
      else { const r = reachOf(MW.gather(sim))[offer.turn.seat]; if (!r.in) endOffer('dropped: he has left the bridge', MW.notice('withdrawn', unstop(offer.words), unstop(r.where))); }
    }
    dirty = true;
  });
  A.on('event', (name, data) => {
    if (name === 'foundered') { if (offer) endOffer('dropped: she has gone', null); dirty = true; return; }
    // an order given now (the night's own script gives its orders without this event): in a night taken back, the
    // moments after it are new ones, and what was said for the reports of the old ones is forgotten
    if (name === 'ordersDropped' && data && typeof data.t === 'number') cutAt(data.t);
    if (name === 'order' && S.sim) {
      cutAt(S.sim.t);
      const w = S.sim.night, at = w ? w.log.length - 1 : -1;
      if (at >= 0) for (const k of Array.from(errandAt.keys())) if (k >= at) errandAt.delete(k);
    }
    // an order of the offered order's kind, given meanwhile by the player (typed, or at the page's controls) or on
    // another man's word, overtakes the offer: it is not left standing to be given on top of it. (The offer's own
    // giving clears it first, so this never sees it.)
    if (name === 'order' && offer) {
      const w = S.sim && S.sim.night, e = w && w.log.length ? w.log[w.log.length - 1] : null;
      if (e && e.type === offer.order.type) endOffer('dropped: another order was given first', MW.notice('withdrawn', unstop(offer.words), 'another order of its kind was given first'));
    }
  });
  A.on('reset', () => {
    // a new run, or the night taken back to a kept minute (NH4). Either way nothing stays awaited or offered, and a late
    // answer shows nothing. A night taken back keeps its tape, its count of what was asked, and what it remembers
    const moved = scrubbing(), why = moved ? 'dropped: the watch was moved' : 'dropped: a new run';
    for (const t of awaited.values()) if (t.end === null) { t.end = why; t.kEnd = -1; }
    awaited.clear();
    if (offer) { if (moved) offer.turn.end = why; offer = null; }
    sent = {}; feedSeen = -1; lastSpoke = -1e9;            // (a night taken back: its keeper puts these back, below)
    logSeen = S.sim && S.sim.night ? S.sim.night.log.length : 0;
    if (!moved) { night++; tape = []; use.asked = use.in = use.out = 0; tMax = -1; tFar = -1; spoke.clear(); errandAt.clear(); }
    A.holdPace(0, 'minds');
    dirty = true; paint();
  });
  // what the part holds of a kept minute, and its putting back: who is away on which errand, when a man last spoke up
  // unasked, how much of the reports' feed had been looked at. Plain data; no offer and no awaited turn is ever put back
  if (typeof A.keeper === 'function') {
    A.keeper('minds', {
      // (feedSeen is put back to the place of the earliest report whose line is still awaited at this minute: its line,
      // when it comes, comes after the minute, and a night taken back to here must read that report again to show it)
      keep: () => {
        let seenTo = feedSeen;
        if (seenTo >= 0) for (const t of awaited.values()) if (t.kind === 'report' && Number.isInteger(t.fi) && t.fi >= 0 && t.fi < seenTo) seenTo = t.fi;
        return { sent: JSON.parse(JSON.stringify(sent)), lastSpoke, feedSeen: seenTo, tMax };
      },
      scrub: (sim, st) => {
        sent = {};
        if (st && st.sent && typeof st.sent === 'object') for (const s of MW.SEATS) if (Array.isArray(st.sent[s])) { const ks = st.sent[s].filter(k => typeof k === 'string').slice(0, 20); if (ks.length) sent[s] = ks; }
        lastSpoke = st && typeof st.lastSpoke === 'number' && isFinite(st.lastSpoke) ? st.lastSpoke : -1e9;
        feedSeen = st && Number.isInteger(st.feedSeen) ? st.feedSeen : -1;
        // (a minute kept before a new order was given belongs to the night as it then was: what had been played by then stays played)
        if (st && typeof st.tMax === 'number' && isFinite(st.tMax) && st.tMax > tMax) tMax = st.tMax;
        logSeen = sim && sim.night ? sim.night.log.length : 0;
        dirty = true;
      },
    });
  }
  A.on('frame', () => {
    const T = transport();
    if (T !== shownFor) { shownFor = T; stat = null; refreshStatus(); dirty = true; }
    // switched off, the crew's minds leave nothing standing: an offer made while they were on is withdrawn
    if (offer && stat && stat.on !== true) endOffer('dropped: the crew\'s minds were switched off', MW.notice('withdrawn', unstop(offer.words), 'the crew\'s minds were switched off'));
    if (dirty) { dirty = false; paint(); }
  });

  // ------------------------------------------------------------------ the fake transport (a test hook)
  // A promise-like answer that resolves when the page's clock says so: its callbacks run in that very pass, so that under
  // the virtual clock the answer lands on a step the test can know (a real Promise would wait for the event loop)
  function later() {
    let done = false, value, waiting = [];
    return {
      then(ok) { if (typeof ok !== 'function') return; if (done) ok(value); else waiting.push(ok); },
      resolve(v) { if (done) return; done = true; value = v; const w = waiting; waiting = []; for (const f of w) f(v); },
    };
  }
  // o: { on (false), delay (ms of the page's clock, 1500), table (the library's FAKE), limits: { questions, tokens },
  //      needsKey (false: true shows the key's row, for a test of it; the fake keeps no key, only that one was given) }
  function fake(o) {
    o = o || {};
    const lim = o.limits || {};
    const st = { on: o.on === true, delay: typeof o.delay === 'number' && o.delay >= 0 ? o.delay : 1500, table: Array.isArray(o.table) ? o.table : null, model: 'fake',
      limits: { questions: lim.questions > 0 ? lim.questions : 200, tokens: lim.tokens > 0 ? lim.tokens : 300000 }, used: { questions: 0, tokens: 0 }, hasKey: false, needsKey: o.needsKey === true };
    const requests = [], seen = new Set();
    const status = () => ({ ok: true, available: true, on: st.on, provider: 'fake', model: st.model, modelUsed: st.model, base: '', limits: Object.assign({}, st.limits),
      used: Object.assign({}, st.used), hasKey: st.hasKey, keyKept: st.hasKey ? 'run' : null, canProtect: false, needsKey: st.needsKey, ready: true,
      providers: [{ id: 'fake', label: 'The fake: answers from a table, no model and no network (a test hook)', key: false, fixed: true, ready: true }] });
    return {
      fake: true, requests, options: st,
      status: () => Promise.resolve(status()),
      set(p) {
        if (!p || typeof p !== 'object') return Promise.resolve({ ok: false, kind: 'shape', why: 'The settings are not an object.' });
        if (typeof p.on === 'boolean') st.on = p.on;
        if (typeof p.model === 'string') st.model = p.model;
        if (typeof p.delay === 'number' && p.delay >= 0) st.delay = p.delay;
        if (Array.isArray(p.table)) st.table = p.table;
        if (p.limits && typeof p.limits === 'object') { if (p.limits.questions > 0) st.limits.questions = p.limits.questions; if (p.limits.tokens > 0) st.limits.tokens = p.limits.tokens; }
        return Promise.resolve(status());
      },
      setKey(k) { st.hasKey = typeof k === 'string' && k.length > 0; return Promise.resolve(status()); },   // the fake keeps nothing: it needs no key
      clearKey() { st.hasKey = false; return Promise.resolve(status()); },
      test() { const p = later(); A.after(st.delay, () => p.resolve({ ok: true, text: '{"say": "Yes, sir.", "order": null}', usage: { in: 40, out: 8, cached: 0 }, ms: st.delay, model: 'fake' })); return p; },
      ask(req) {
        const p = later(), r = { seat: req && req.seat, stable: req && req.stable, changing: req && req.changing, at: A.now(), k: kNow() };
        requests.push(r);
        let res;
        if (!st.on) res = { ok: false, kind: 'off', why: 'The crew\'s minds are switched off.' };
        else if (st.used.questions >= st.limits.questions || st.used.tokens >= st.limits.tokens) res = { ok: false, kind: 'budget', why: 'This run\'s limit for the language model is spent.' };
        else {
          st.used.questions++;
          const text = MW.fakeReply(r, st.table), stable = String(r.stable || ''), cached = seen.has(stable);
          seen.add(stable);
          const tin = Math.ceil((stable.length + String(r.changing || '').length) / 4), tout = Math.ceil(text.length / 4);
          st.used.tokens += tin + tout;
          res = { ok: true, text, usage: { in: tin, out: tout, cached: cached ? Math.ceil(stable.length / 4) : 0 }, ms: st.delay, model: st.model };
        }
        A.after(st.delay, () => p.resolve(res));
        return p;
      },
      usage: () => Promise.resolve({ ok: true, used: Object.assign({}, st.used), limits: Object.assign({}, st.limits) }),
    };
  }
  if (/[#&]minds=fake(&|$)/.test(location.hash || '')) override = fake({ on: true });

  // ------------------------------------------------------------------ for the tests (tools/minds_site_test.js) and exploring
  const copyTurn = (t) => JSON.parse(JSON.stringify({ n: t.n, kind: t.kind || 'question', k: t.k, t: t.t, seat: t.seat, who: t.who, words: t.words, facts: t.facts, attempts: t.attempts, say: t.say,
    order: t.order, end: t.end, kEnd: t.kEnd, kGiven: t.kGiven }));
  A.minds = {
    useTransport(obj) { override = obj || null; shownFor = transport(); stat = null; dirty = true; return refreshStatus(); },
    transport, fake, refresh: () => refreshStatus(),
    status: () => (stat ? JSON.parse(JSON.stringify(stat)) : null), on,
    act: () => act, setAct, chosen: () => chosen || 'murdoch', choose, speaks: () => speaks, setSpeaks,
    awaited: () => [...awaited.keys()],
    offer: () => (offer ? { seat: offer.turn.seat, order: Object.assign({}, offer.order), words: offer.words, t0: offer.t0 } : null),
    give: () => giveOffer(), decline: () => declineOffer(),
    tape: () => tape.map(copyTurn), use: () => Object.assign({}, use),
    // a night taken back (NH4): the furthest moment played, and how many reports' lines are remembered
    played: () => tMax, remembered: () => spoke.size,
    reach: () => (S.sim ? reachOf(MW.gather(S.sim)) : null),
    sent: () => JSON.parse(JSON.stringify(sent)),
  };
  paint();
})();
