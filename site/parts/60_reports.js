// Reports to the bridge: the feed, the night that comes to the player, and the bridge's view. A part of the viewer
// (site/app.js, "parts"). It shows what core/readers/reports.js (TitanicReports) holds on the watch, gives that
// reader's orders through the page's one way to give an order (TitanicApp.order: the watch taken over as by the wheel;
// logged, so they replay), and feeds nothing back to the model.
//
//   - The feed, on the Run tab: each report as a line with the ship's time, who brought it and how, newest first; a short
//     toast as each arrives.
//   - The night comes to the player: when a report arrives while the clock runs fast (one brought by a man or a
//     telephone, or felt; not the bells, and not the commutator or her trim by eye, which the bridge has in view), the
//     page's clock drops to her own pace for a few seconds, then picks up the pace the player chose (a setting; the
//     page's pace only, never the model).
//   - "As the bridge knew it": the readouts nobody on the bridge had (tons aboard, tons a minute, the drafts, the forecast
//     line, the water in the damage diagram; and the status, the log and the watch's verdict, which name what the ice
//     opened) are covered, and the bridge's knowledge shown in their place: the compartments as reported, the list from
//     the commutator, the trim in words. X-ray is the instrument's view and this the bridge's: turning one on turns the
//     other off. Off, the page is as it was.
//   - The orders: an officer to look at a part of the ship, the carpenter to sound, a note to the engine room.
// The words are the reader's; what is drawn here that is not the model's (the pace's few seconds, the colours) is
// [appearance].
(function () {
  'use strict';
  const A = window.TitanicApp, NT = window.TitanicNight, RP = window.TitanicReports, C = window.TitanicCore;
  if (!A || !NT || !RP || !C) return;
  const S = A.state, root = document.documentElement, $ = (id) => document.getElementById(id);
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
  const list = (a) => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
  const HOLD = 4;                                  // s of real time at her own pace when a report comes [appearance]
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v === '1'; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, v ? '1' : '0'); } catch (e) { /* private window: not kept */ } },
  };

  // ---------------------------------------------------------------- the section on the Run tab
  const sec = el('div', 'sec rp-sec'); sec.id = 'rpSec'; sec.hidden = true;
  const viewBox = el('input'); viewBox.type = 'checkbox'; viewBox.id = 'rpView';
  const viewLab = el('label', 'check'); viewLab.append(viewBox, el('span', null, 'As the bridge knew it: cover what nobody on the bridge could read (the water aboard, the inflow, the drafts, the forecast, the water in the diagram) and show what has been reported'));
  const slowBox = el('input'); slowBox.type = 'checkbox'; slowBox.id = 'rpSlow';
  const slowLab = el('label', 'check mt6'); slowLab.append(slowBox, el('span', null, 'When a report comes, the clock slows to her own pace for a few seconds'));
  const orders = el('div', 'rp-orders');
  const LOOK = [['forward', 'Forward'], ['mailroom', 'Mail room'], ['boilers', 'Boiler rooms'], ['engines', 'Engine rooms'], ['aft', 'Aft']];
  const lookRow = el('div', 'rp-row'), lookBtn = {};
  for (const [part, label] of LOOK) { const b = el('button', 'btn rp-look', label); b.id = 'rpLook-' + part; b.dataset.part = part; lookRow.appendChild(b); lookBtn[part] = b; }
  const row2 = el('div', 'rp-row');
  const bSound = el('button', 'btn', 'Have the carpenter sound'); bSound.id = 'rpSound';
  const bAsk = el('button', 'btn', 'Ask the engine room'); bAsk.id = 'rpAsk';
  row2.append(bSound, bAsk);
  const outLine = el('p', 'hint rp-out'); outLine.id = 'rpOut';
  orders.append(el('div', 'rp-cap', 'Send an officer to look'), lookRow, row2, outLine);
  const feedList = el('ol', 'rp-feed'); feedList.id = 'rpFeed'; feedList.setAttribute('aria-label', 'Reports to the bridge, newest first');
  sec.append(el('h3', null, 'Reports to the bridge'), viewLab, slowLab, orders, feedList,
    el('p', 'hint mt6', 'Nothing on the bridge measured water. Each line is a fact of the model, seen by a man placed to see it and brought up in the time that took, in his words. The rules and their sources: core/readers/reports.js.'));
  const watchSec = $('watchSec');
  if (watchSec && watchSec.parentNode) watchSec.parentNode.insertBefore(sec, watchSec.nextSibling);

  // ---------------------------------------------------------------- the bridge's view: what it puts in place of what
  const stats = document.querySelector('#readout .stats');
  const stat = (id, k) => { const d = el('div', 'stat rp-k'), v = el('div', 'v'); v.id = id; d.append(el('div', 'k', k), v); return d; };
  if (stats) stats.append(stat('rpTrim', 'Trim, by eye'), stat('rpList', 'Commutator'), stat('rpKnown', 'Reported'));
  const pill = el('span', 'pill idle rp-pill'); pill.id = 'rpStatus';
  if ($('status')) $('status').insertAdjacentElement('afterend', pill);
  const line = el('div', 'forecast-line rp-line'); line.id = 'rpLine';
  if ($('fcLine')) $('fcLine').insertAdjacentElement('afterend', line);
  const strip = document.querySelector('.strip');
  const cells = el('div', 'rp-strip'), cellEl = [];
  cells.id = 'rpStrip';
  for (let k = 15; k >= 0; k--) {                  // stern to bow, left to right, as the damage diagram draws her
    const c = el('div', 'rp-cell'); c.dataset.k = String(k); c.dataset.state = 'unknown'; c.style.flexGrow = String(A.ship.zones[k].len.toFixed(2));
    c.append(el('b', null, C.ZONES[k].short), el('span', null, '?'));
    cells.appendChild(c); cellEl[k] = c;
  }
  const cap = el('div', 'cap'); cap.id = 'rpCap';
  const legend = el('span', 'rp-legend');
  for (const [st, w] of [['unknown', 'not known'], ['dry', 'dry'], ['water', 'water'], ['lost', 'flooded']]) { const i = el('i'); i.dataset.state = st; legend.append(i, el('span', null, w)); }
  cap.append(el('span', null, 'As the bridge knew it: each compartment as reported'), legend);
  if (strip) strip.append(cells, cap);
  const toastEl = el('div', 'toast rp-toast'); toastEl.id = 'rpToast'; toastEl.setAttribute('role', 'status'); toastEl.setAttribute('aria-live', 'polite');
  // in the stage's notice area (C-4), where the page's own notice stands, which the bridge's view covers
  if (!(A.slot && A.slot('notice', toastEl, { order: 1 })) && $('stage')) $('stage').appendChild(toastEl);
  const wtext = el('p', 'rp-wtext'); wtext.id = 'rpWatchText';
  if ($('watchText')) $('watchText').insertAdjacentElement('afterend', wtext);
  const logSec = $('logBody') ? $('logBody').closest('.sec') : null;
  if (logSec) logSec.classList.add('rp-cover');

  // ---------------------------------------------------------------- the page's pace, held for a few seconds
  // The page holds its pace at her own (TitanicApp.holdPace) while the hold lasts; the player's choice (state.speed and
  // its buttons) stands, and the page runs at it again after. A report inside a hold starts it again
  let holdUntil = 0;
  let slow = store.get('titanic.reports.slow', true), view = store.get('titanic.reports.view', false);
  slowBox.checked = slow; viewBox.checked = view;
  function hold() {
    if (!slow || !S.night || !S.sim || NT.busy(S.sim) || !(S.speed > 1)) return;
    holdUntil = A.holdPace(HOLD, 'reports');          // its own hold (C-4 step 3, QC C-7): its release ends no other part's
  }
  function release() { if (holdUntil) { A.holdPace(0, 'reports'); holdUntil = 0; } }
  slowBox.addEventListener('change', () => { slow = slowBox.checked; store.set('titanic.reports.slow', slow); if (!slow) release(); });

  // ---------------------------------------------------------------- the view's switch, and X-ray
  let colsYielded = false, wasOn = false;
  const onWatch = () => !!(S.night && S.sim && S.sim.reports);
  // What the scene shows of the damage, which nobody on the bridge saw: the marks the ice left on her plating and the
  // markers of her openings (TitanicApp.marks: site/app.js shows the dents on a watch and the openings always). Claimed
  // hidden of the page while the view is on, let go when it is off: the page shows them again unless another part
  // claims them too (the Night look does), so neither undoes the other (QC C-5). The water X-ray and the columns, which
  // nobody on the bridge had either, the same way (C-4 step 3): claimed off while the view is on, never switched off and
  // back by clicks, so X-ray comes back as the player last chose it when the last claim on it goes
  const marks = A.marks || {};
  function apply() {
    const on = view && onWatch();
    root.classList.toggle('rp-bridge', on);
    if (marks.claim) { marks.claim('openings', 'bridge', on); marks.claim('dents', 'bridge', on); }
    if (A.claim) { A.claim('look.xray', 'bridge', on ? false : null); A.claim('look.cols', 'bridge', on && !colsYielded ? false : null); }
    if (!on) colsYielded = false;
    wasOn = on;
  }
  function setView(on) {
    view = on; viewBox.checked = on; store.set('titanic.reports.view', on);
    apply(); paint(true);
  }
  viewBox.addEventListener('change', () => setView(viewBox.checked));
  // the player's own X-ray or columns while the view is on: their later choice (the page tells the claimant, C-4 step 3).
  // X-ray ends the view (as its button did before the claims); the columns are let go and the view stays
  A.on('event', (name, data) => {
    if (name !== 'overruled' || !data || data.owner !== 'bridge') return;
    if (data.key === 'look.xray') setView(false);
    else if (data.key === 'look.cols') { colsYielded = true; apply(); }
  });

  // ---------------------------------------------------------------- the orders
  const PART = { forward: 'forward', mailroom: 'to the mail room', boilers: 'to the boiler rooms', engines: 'to the engine rooms', aft: 'aft' };
  function give(type, value, said, refused) {
    const sim = S.sim;
    if (!S.night || !sim || !sim.reports || A.gone(sim)) return;
    const ok = A.order(type, value);               // the watch, now the player's, logs it with the step; the reader carries it out
    say(ok ? said : refused);
    paintOrders(sim);
  }
  for (const part in lookBtn) lookBtn[part].addEventListener('click', () => give('report:look', part, 'An officer goes ' + PART[part] + ' to look.', 'An officer is already on his way ' + PART[part] + '.'));
  bSound.addEventListener('click', () => give('report:sound', 'wells', 'The carpenter is sent to sound the wells.', 'The carpenter is already sounding.'));
  bAsk.addEventListener('click', () => give('report:ask', 'engine room', 'A note goes down to the chief engineer.', 'A note is already on its way to the engine room.'));

  // ---------------------------------------------------------------- what is shown
  let toastTimer = 0;
  function say(text) {                              // a short toast: the page's, or in the bridge's view this part's own
    if (!root.classList.contains('rp-bridge')) { A.toast(text); return; }
    toastEl.textContent = text; toastEl.classList.add('on');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('on'), 3200);
  }
  function lineEl(e) {
    const li = el('li', 'rp-' + e.kind); li.dataset.n = String(e.n);
    li.append(el('span', 'rp-t', A.clockOf(e.t) || ''), el('span', 'rp-who', e.who + ', ' + e.by), el('span', 'rp-w', e.words));
    if (e.tFact !== e.t) li.title = 'Seen at ' + A.clockOf(e.tFact);
    return li;
  }
  const ERRAND = { 'look:forward': 'an officer forward', 'look:mailroom': 'an officer to the mail room', 'look:boilers': 'an officer to the boiler rooms', 'look:engines': 'an officer to the engine rooms', 'look:aft': 'an officer aft', sound: 'the carpenter sounding', ask: 'a note to the engine room' };
  function paintOrders(sim) {
    const R = sim && sim.reports, off = !R || R.done || A.gone(sim);
    for (const part in lookBtn) lookBtn[part].disabled = off || !!R.errands['look:' + part];
    bSound.disabled = off || !!R.errands.sound; bAsk.disabled = off || !!R.errands.ask;
    const out = R ? Object.keys(R.errands).map(k => ERRAND[k]).filter(Boolean) : [];
    const txt = off ? (R && R.done ? 'The bridge is gone.' : '') : (out.length ? 'Out now: ' + list(out) + '.' : 'No one is out.');
    if (outLine.textContent !== txt) outLine.textContent = txt;
  }
  function sentence(sim, K) {
    const w = sim.night;
    if (w.tTouch < 0) return w.tClear >= 0 ? 'She has passed the ice untouched.' : 'Nothing has been reported.';
    const lost = K.zones.filter(z => z.state === 'lost').map(z => z.name), wet = K.zones.filter(z => z.state === 'water').map(z => z.name);
    const out = [];
    if (lost.length) out.push('Reported flooded: ' + list(lost) + '.');
    if (wet.length) out.push('Water reported in ' + list(wet) + '.');
    if (!lost.length && !wet.length) out.push('No water has been reported.');
    out.push('The commutator: ' + K.list.words + '. By eye: ' + K.trim.words + '.');
    if (K.estimate) out.push('The builder\'s man, at ' + A.clockOf(K.estimate.tKnown) + ': ' + K.estimate.words.charAt(0).toLowerCase() + K.estimate.words.slice(1));
    return out.join(' ');
  }
  function paintKnowledge(sim) {
    const K = RP.knowledge(sim), w = sim.night;
    if (!K) return;
    const set = (id, t) => { const e = $(id); if (e && e.textContent !== t) e.textContent = t; };
    set('rpTrim', K.trim.words);
    set('rpList', K.list.words);
    const nWet = K.zones.filter(z => z.state === 'water').length, nLost = K.zones.filter(z => z.state === 'lost').length, nDry = K.zones.filter(z => z.state === 'dry').length;
    set('rpKnown', nWet + nLost ? [nWet ? nWet + ' water' : '', nLost ? nLost + ' flooded' : ''].filter(Boolean).join(', ') : (nDry ? nDry + ' dry' : 'nothing'));
    for (const z of K.zones) {
      const c = cellEl[z.k], txt = z.state === 'unknown' ? '?' : (z.state === 'dry' ? 'dry' : (z.state === 'water' ? 'water' : 'lost'));
      if (c.dataset.state !== z.state) c.dataset.state = z.state;
      if (c.lastChild.textContent !== txt) c.lastChild.textContent = txt;
      const title = z.name + ': ' + (z.state === 'unknown' ? 'nothing reported' : z.words + ' (' + z.who.toLowerCase() + ', ' + A.clockOf(z.tKnown) + ')');
      if (c.title !== title) c.title = title;
    }
    // the status: the watch's own moments until the touch; then what the bridge knows
    let cls = 'idle', txt = 'No report';
    if (A.gone(sim)) { cls = 'crit'; txt = A.broke(sim) ? 'Breaking' : 'Foundered'; }   // QC B-4: "Breaking" on an onset watch
    else if (w.tTouch < 0) { if (w.tBells < 0) txt = 'On watch'; else if (w.tClear < 0) { cls = 'warn'; txt = 'Ice ahead'; } else { cls = 'ok'; txt = 'Clear'; } }
    else if (K.sinking >= 0) { cls = 'crit'; txt = 'Sinking'; }
    else if (nWet + nLost) { cls = 'warn'; txt = 'Making water'; }
    else if (w.tClear < 0) { cls = 'crit'; txt = 'On the ice'; }
    else txt = 'No damage known';
    if (pill.className !== 'pill ' + cls + ' rp-pill') pill.className = 'pill ' + cls + ' rp-pill';
    if (pill.textContent !== txt) pill.textContent = txt;
    const last = sim.reports.feed.filter(e => e.kind !== 'routine').pop();
    const lt = K.estimate ? 'The builder\'s man, at ' + A.clockOf(K.estimate.tKnown) + ': ' + K.estimate.words.charAt(0).toLowerCase() + K.estimate.words.slice(1) : (last ? A.clockOf(last.t) + ', ' + last.who.toLowerCase() + ': ' + last.words : 'No report yet.');
    if (line.textContent !== lt) line.textContent = lt;
    const st = sentence(sim, K);
    if (wtext.textContent !== st) wtext.textContent = st;
  }
  let shown = 0, seen = 0, lastPaint = 0;
  function paint(force) {
    const sim = S.sim, R = sim && sim.reports, hide = !onWatch();
    if (sec.hidden !== hide) sec.hidden = hide;
    apply();
    if (!R) return;
    if (R.feed.length > shown) {                    // new lines: newest first, and a toast for the newest
      for (let i = shown; i < R.feed.length; i++) feedList.insertBefore(lineEl(R.feed[i]), feedList.firstChild);
      const e = R.feed[R.feed.length - 1], bridge = root.classList.contains('rp-bridge');
      // in the instrument's view the page toasts the touch itself, and the bells are only in the feed
      if (bridge || (e.kind !== 'routine' && e.rule !== 'touch')) say(e.who + ': ' + e.words);
      shown = R.feed.length;
      force = true;
    }
    const now = performance.now();
    if (force || now - lastPaint > 125) { lastPaint = now; paintKnowledge(sim); paintOrders(sim); }
  }

  // ---------------------------------------------------------------- the hooks
  A.on('reset', (sim) => {
    shown = 0; seen = 0; holdUntil = 0; feedList.textContent = ''; outLine.textContent = '';   // (a new run ends the page's hold itself)
    // NH4, a scrub's run: its feed as it stood at the kept minute, drawn again quietly (no toast, no hold of the pace: those
    // reports were news when they came, not now); news only from here on, as the page's own log at a scrub
    if (A.scrubbing && A.scrubbing() && sim && sim.reports) {
      for (const e of sim.reports.feed) feedList.insertBefore(lineEl(e), feedList.firstChild);
      shown = seen = sim.reports.feed.length;
    }
    paint(true);                                    // (apply: the view's claims follow the new run, a watch or not)
  });
  // a report has come (brought by a man, a telephone, or felt: not the routine, and not the bridge's own instruments, the
  // commutator and her trim by eye, which are always in view): the page's clock to her own pace, from this step
  const brought = (e) => e.kind !== 'routine' && e.ch !== 'instrument';
  A.on('step', (sim) => {
    const R = sim.reports; if (!R) return;
    if (R.feed.length > seen) { for (let i = seen; i < R.feed.length; i++) if (brought(R.feed[i])) { hold(); break; } seen = R.feed.length; }
  });
  A.on('frame', () => paint(false));
  // In the bridge's view the page's own notice is covered, so every one of them is said here (D78), and the watch's
  // moments in the bridge's words. In the page only: nothing goes into sim.reports or its feed
  A.on('event', (name, data) => {
    if (!root.classList.contains('rp-bridge')) return;
    const sim = S.sim;
    if (name === 'notice') { if (data && data.text) say(data.text); }
    else if (name === 'bells') { const ev = sim.events.filter(e => e.id === 'bells').pop(); say(ev ? ev.label.replace(/ Range.*$/, '') : 'Three bells from the crow\'s nest'); }
    else if (name === 'clear' && sim && !sim.openings.length) say(NT.verdict(sim));
    else if (name === 'foundered') say(A.broke(S.sim) ? 'She breaks.' : 'She founders.');   // QC B-4: on an onset watch, the break
  });

  // for the tests (tools/reports_site_test.js) and for exploring
  A.reports = {
    view: () => view, setView, slow: () => slow, setSlow: (on) => { slowBox.checked = !!on; slowBox.dispatchEvent(new Event('change')); },
    holding: () => !!(holdUntil && performance.now() < holdUntil), chosenSpeed: () => S.speed, HOLD,
    holdEnds: () => holdUntil,                      // its own hold's end on the page's clock (ms), 0 since a reset or a release
                                                    // (tools/scrub_site_test.js: nothing held at a scrub)
    lines: () => [...feedList.children].reverse().map(li => ({ n: +li.dataset.n, t: li.querySelector('.rp-t').textContent, who: li.querySelector('.rp-who').textContent, words: li.querySelector('.rp-w').textContent })),
  };
  paint(true);
})();
