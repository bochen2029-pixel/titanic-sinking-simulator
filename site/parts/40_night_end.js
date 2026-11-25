// The end of a watch, and a watch you can hand on. A part of the viewer (site/app.js, "parts").
//
//   - When she founders, lies steady with water aboard, or has passed the ice untouched, a card says what happened in
//     plain words. Every figure on it is read from the model at that moment.
//   - "Copy a link to this watch" puts the night's seed and the orders given into the address. A night is its seed and
//     its orders (core/night.js), so the link replays the same watch: bit for bit on the same JavaScript engine, to
//     about nine digits on another (README, the Math.pow caveat). In the desktop app the link is the address's fragment
//     alone (#night=...&log=...), which Titanic.exe --open= takes.
//   - An address that carries orders (#night=1912&log=...) opens as that replay. The orders are checked before they
//     reach the model: an address is something a stranger may have written.
//
// It reads the model's state and feeds nothing back. The words are this file's; the numbers are the model's.
(function () {
  'use strict';
  const A = window.TitanicApp, NT = window.TitanicNight, C = window.TitanicCore, Mo = window.TitanicMotion, SY = window.TitanicSystems, SC = window.TitanicScenarios;
  if (!A || !C) return;
  const S = A.state;
  const APP = location.protocol === 'titanic:';    // the page inside the desktop app (app/main.js)
  const hm = (s) => { const m = Math.round(s / 60); return m < 60 ? m + ' min' : Math.floor(m / 60) + ' h ' + String(m % 60).padStart(2, '0') + ' min'; };
  const tons = (v) => Math.round(v).toLocaleString('en-US');

  // ------------------------------------------------------------------ the orders in an address
  // [step, type, value, arg] for each order, as JSON, in the URL's own base64. Only the orders core/night.js knows, with
  // values it accepts: anything else and the whole log is refused (a wrong order would throw inside the model's step).
  // A module that owns orders of its own (a reader: core/night.js) says itself which of them it would accept, with a
  // `valid(type, value, arg)` of plain checks; an order nobody vouches for is refused.
  const ROOMS = SY ? SY.PLANT.rooms.length : 6;
  function validOrder(o) {
    if (!Array.isArray(o) || o.length < 2 || o.length > 4) return false;
    const k = o[0], type = o[1], v = o[2], arg = o[3];
    if (!Number.isInteger(k) || k < 0 || k > 500000 || typeof type !== 'string') return false;
    // the wheel: degrees inside the stops (a "reverse" is logged as the angle it gave, which may be 40 and a rounding)
    if (type === 'helm') return (typeof v === 'number' && isFinite(v) && Math.abs(v) <= 40 + 1e-9) || v === 'away' || v === 'toward' || v === 'reverse';
    if (type === 'telegraph') return ((typeof v === 'number' && isFinite(v) && Math.abs(v) <= 83) || (!!Mo && typeof v === 'string' && Object.prototype.hasOwnProperty.call(Mo.TELEGRAPH, v))) && (arg == null || arg === 'port' || arg === 'starboard');
    if (type === 'door') return Number.isInteger(v) && v >= 0 && v < C.BULKHEADS.length && (arg === true || arg === false);
    if (type === 'doors') return v === 'bridge' && arg == null;
    if (type === 'fires') return Number.isInteger(v) && v >= -1 && v < ROOMS && arg == null;
    // the pumps (Y6): a room, or -1 for none; a pump's number, or one of the order's own words
    if (type === 'pump') return Number.isInteger(v) && v >= -1 && v < 16 && ((Number.isInteger(arg) && arg >= 0 && arg < 32) || arg === 'own' || arg === 'all' || arg === 'off' || arg === 'engineers');
    // G27: a hole made by hand on a watch, within the bounds the model itself holds (Night.validHole, no state)
    if (type === 'hole') return !!(NT && NT.validHole) && NT.validHole(v, arg === null ? undefined : arg);
    const owner = NT && NT.READERS ? NT.READERS.find(r => r.orders && Object.prototype.hasOwnProperty.call(r.orders, type)) : null;
    return !!(owner && typeof owner.valid === 'function' && owner.valid(type, v, arg === null ? undefined : arg) === true);
  }
  const b64 = (s) => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const unb64 = (s) => atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  function encodeLog(log) { return b64(JSON.stringify(log.map(o => (o.arg === undefined ? [o.k, o.type, o.value] : [o.k, o.type, o.value, o.arg])))); }
  function decodeLog(text) {
    let raw;
    try { raw = JSON.parse(unb64(String(text))); } catch (e) { return null; }
    if (!Array.isArray(raw) || !raw.length || raw.length > 600 || !raw.every(validOrder)) return null;
    for (let i = 1; i < raw.length; i++) if (raw[i][0] < raw[i - 1][0]) return null;     // in the order they were given
    return raw.map(o => ({ k: o[0], type: o[1], value: o[2], arg: o[3] === null ? undefined : o[3] }));
  }
  function linkOf() {
    const n = S.night, sim = S.sim;
    if (!n || !sim || !sim.night) return null;
    let h = '#night=' + n.seed + (n.kn !== 22.5 ? '&kn=' + n.kn : '') + (n.level && n.level !== 'hard' ? '&level=' + n.level : '') + (n.coal && n.coal !== 'loaded' ? '&coal=' + n.coal : '');
    if (sim.night.handover !== 'onset') h += '&handover=flag';    // G12's cascade: the what-if (a flag watch has no field) goes with the watch
    if (sim.night.log.length) h += '&log=' + encodeLog(sim.night.log);
    // in the desktop app (titanic://app/, app/main.js) the page's own address opens nowhere else: the link is the fragment
    // alone, which the app takes as Titanic.exe --open=... (design v2 of the app, section 5). The web page is unchanged
    return (APP ? '' : location.href.split('#')[0]) + h;
  }
  // an address with orders in it: open that night as a replay of them. Returns 'replay', 'refused' or null (no orders)
  function openFromAddress() {
    const h = location.hash || '', m = /night=(\d{1,10})/.exec(h), l = /[#&]log=([^&]*)/.exec(h);
    if (!NT || !m || !l) return null;
    const log = /^[A-Za-z0-9_-]{1,60000}$/.test(l[1]) ? decodeLog(l[1]) : null;
    if (!log) { A.toast('The orders in this address could not be read. The night opens without them.', true); return 'refused'; }
    const kn = /kn=([\d.]+)/.exec(h), lv = /level=([a-z0-9]+)/.exec(h), coal = /coal=(2h|15m)/.exec(h);
    A.loadNight(+m[1], { kn: kn && [22.5, 18, 15, 10].includes(+kn[1]) ? +kn[1] : 22.5, level: lv && NT.LEVELS && NT.LEVELS[lv[1]] ? lv[1] : 'hard', coal: coal ? coal[1] : undefined, mode: 'replay', log, fromHash: true });
    A.toast('A watch from a link: its ' + log.length + ' order' + (log.length === 1 ? ' is' : 's are') + ' on the bridge. Touch the wheel or the telegraph to take over.');
    return 'replay';
  }

  // ------------------------------------------------------------------ the card
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
  const card = el('div', 'endcard'); card.id = 'endCard'; card.hidden = true; card.setAttribute('role', 'status');
  const title = el('b', 'endcard-title'), body = el('div', 'endcard-body'), actions = el('div', 'endcard-actions');
  const bCopy = el('button', 'btn primary', 'Copy a link to this watch'), bAgain = el('button', 'btn', 'This night again'), bClose = el('button', 'btn', 'Close');
  bCopy.id = 'endCopy'; bAgain.id = 'endAgain'; bClose.id = 'endClose';
  const linkBox = el('input', 'endcard-link'); linkBox.id = 'endLink'; linkBox.readOnly = true; linkBox.hidden = true; linkBox.setAttribute('aria-label', 'A link to this watch');
  // RC2: on a short stage (780 px and under) the Bridge gives way while the card is up (site/styles.css, D5); after a miss
  // or while she floats the watch goes on, so the card says how to have the bridge again. Its CSS shows it only there
  const bridgeNote = el('p', 'endcard-bridge', 'Close this card to take the wheel and the telegraph again.'); bridgeNote.id = 'endBridge';
  actions.append(bCopy, bAgain, bClose); card.append(title, body, bridgeNote, actions, linkBox);
  // in the stage's stack (C-4), under the boats' count: the layout keeps it clear of the readouts, the deep's strip and
  // the Bridge, whatever lines they have, and it scrolls in the room the stack has
  const stage = document.getElementById('stage');
  if (!(A.slot && A.slot('stack', card, { order: 2 })) && stage) stage.appendChild(card);
  let shown = null;                                // what the card is showing: 'foundered' | 'broke' | 'afloat' | 'clear' | null
  function hide() { card.hidden = true; linkBox.hidden = true; shown = null; }
  bClose.addEventListener('click', () => { card.hidden = true; });
  bAgain.addEventListener('click', () => { if (S.night) A.loadNight(S.night.seed, { kn: S.night.kn, level: S.night.level }); else A.loadScenario(S.scen); });
  bCopy.addEventListener('click', () => {
    const url = linkOf(); if (!url) return;
    const fallback = () => { linkBox.hidden = false; linkBox.value = url; linkBox.focus(); linkBox.select(); A.toast('The link is in the box: copy it from there'); };
    const copied = APP ? 'This watch\'s address is copied: give it to Titanic.exe as --open=' : 'A link to this watch is copied';
    try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(() => A.toast(copied), fallback); else fallback(); } catch (e) { fallback(); }
  });

  // what happened, each sentence from the model's own figures
  function sentences(sim, why) {
    const out = [], n = S.night, r = C.readouts(sim);
    if (why === 'afloat') out.push('She floats: ' + tons(r.waterT) + ' t of water aboard, ' + Math.abs(r.trimDeg).toFixed(1) + '° by the ' + (r.trimDeg >= 0 ? 'head' : 'stern') + ', ' + Math.abs(r.listDeg).toFixed(1) + '° to ' + (r.listDeg >= 0 ? 'starboard' : 'port') + ', and no more coming in than goes out.');
    if (n && sim.night) {
      const w = sim.night, s = NT.summary(sim), log = w.log;
      // QC B-4: on a watch handed over at the break's onset (a what-if) she is gone when it breaks, at goneT; the card says
      // so and leaves out the founder's words and the record's figure, which belong to her foundering
      if (why === 'broke') {
        const T = A.goneT(sim);
        out.push('She broke at ' + A.clockOf(T) + (w.tTouch >= 0 ? ', ' + hm(T - w.tTouch) + ' after she touched the ice.' : '.'));
        // RC1's words audit (D22): on the 1912 watch the card says that this is the model's time, and gives the record's
        // beside it. The witnesses' break is RECORD_1912's break_onset band (2:15 to 2:19:40, the mainline's ruling of
        // 2026-11-24: worked out from the times they gave, since nobody timed the break itself, so the card says "from
        // the times witnesses gave"; that some saw her break and her officers said she went down whole is on the Evidence
        // tab, with the row's source), and her going is OBS.founder (2:20, Pitman's watch and the Report), each counted
        // from her touch
        const RB = SC && SC.RECORD_1912 ? SC.RECORD_1912.find(r => r.id === 'break_onset') : null;
        if (n.seed === 1912 && w.tTouch >= 0 && RB && RB.sigma && SC.OBS && SC.OBS.founder) {
          out.push('That is the model\'s time. From the times witnesses gave, on the night itself she broke between about ' + A.clockOf(w.tTouch + RB.sigma[0] * 60) + ' and ' + A.clockOf(w.tTouch + RB.sigma[1] * 60) + ', and she was gone at ' + A.clockOf(w.tTouch + SC.OBS.founder * 60) + '.');
        }
      }
      if (why === 'foundered') {
        out.push('She foundered at ' + A.clockOf(sim.founderT) + (w.tTouch >= 0 ? ', ' + hm(sim.founderT - w.tTouch) + ' after she touched the ice.' : '.'));
        // the record's own figure [read: README, "Calibration": foundered 2:20; core/scenarios.js OBS.founder]
        out.push('On the night of 14 April 1912 she went down ' + hm(((SC && SC.OBS && SC.OBS.founder) || 160) * 60) + ' after the collision.');
      }
      out.push((A.verdict ? A.verdict(sim) : NT.verdict(sim)) + '.');   // RC2: as the page says it, kept from the ice's end
      if (n.mode === 'auto') out.push('The 1912 orders were on the bridge.');
      else if (s.reaction !== null) out.push((n.mode === 'replay' ? 'The first order came ' : 'Your first order came ') + s.reaction.toFixed(1) + ' s after the bells, the ice ' + Math.max(0, s.aheadOrder).toFixed(0) + ' m ahead.');
      else out.push(w.tBells >= 0 ? 'No order was given to the wheel or the engines after the bells.' : 'The lookout never rang.');
      if (log.length) {
        const c = { helm: 0, telegraph: 0, door: 0, doors: 0, fires: 0 }, other = log.filter(o => !(o.type in c)).length;
        for (const o of log) if (o.type in c) c[o.type]++;
        const parts = [[c.helm, 'to the wheel'], [c.telegraph, 'to the engines'], [c.door + c.doors, 'to the watertight doors'], [c.fires, 'to the stokehold'], [other, 'besides']].filter(p => p[0] > 0).map(p => p[0] + ' ' + p[1]);
        out.push(log.length + (log.length === 1 ? ' order' : ' orders') + ' in the watch\'s log: ' + parts.join(', ') + '.');
      }
    } else if (why === 'foundered') {
      const clock = A.clockOf(sim.founderT);
      out.push('She foundered ' + (clock ? 'at ' + clock + ', ' : '') + hm(sim.founderT) + ' into the run.');
    }
    // her steam and her lights, each at the plant's own time (site/app.js records them on their steps: lightsOut), in the
    // order they came. NH15 F8: her boilers and steam mains giving way as she rose (the plant's event 'break'); the
    // emergency stage, her main dynamos lost while the emergency sets on D deck still lit her (a what-if: on the 1912 night
    // both stop on one step); and her lights when she broke, on a watch handed over at the break's onset
    const P = sim.plant, at = (t) => 'at ' + (A.clockOf(t) || hm(t) + ' in'), em = S.lightsMainT > 0 ? 'emergency ' : '', told = [];
    // RC2 (the red team's row 25): "her boilers and steam mains gave way" read as the 1912 story of boilers breaking
    // loose, which the wreck does not bear out. It is the plant's rule (core/systems.js, PLANT.breakTrimDeg [bet]), and
    // the card says so
    const brk = SY && SY.PLANT && SY.PLANT.breakTrimDeg ? SY.PLANT.breakTrimDeg : null;
    if (P && P.events && P.events.break !== undefined) told.push([P.events.break, 'Her steam failed ' + at(P.events.break) + ', as she rose' + (brk ? ' (the model\'s rule: her boilers and steam mains give way past ' + brk + ' degrees of trim)' : '') + '.']);
    if (em) told.push([S.lightsMainT, (S.lightsMainWhy === 'the main dynamos flooded' ? 'Water reached her main dynamos ' : 'Her main dynamos stopped ') + at(S.lightsMainT) + ': only her emergency lights burned after.']);
    if (S.lightsFailT > 0) told.push([S.lightsFailT, 'Her ' + em + 'lights went out ' + at(S.lightsFailT) + (S.lightsFailWhy ? ' (' + S.lightsFailWhy + ').' : '.')]);
    told.sort((a, b) => a[0] - b[0]).forEach(x => out.push(x[1]));
    if (!(S.lightsFailT > 0) && P && why === 'foundered') out.push('Her ' + em + 'lights burned to the end.');
    else if (!(S.lightsFailT > 0) && P && why === 'broke') out.push('Her ' + em + 'lights were burning when she broke.');
    if (r.pumpedT > 1) out.push('Her pumps put ' + tons(r.pumpedT) + ' t of water back over the side.');
    if (n && sim.night) out.push('Watch ' + NT.fingerprint(sim) + ', step ' + sim.night.k + '.');
    return out;
  }
  function show(why) {
    const sim = S.sim; if (!sim || shown === why) return;
    shown = why;
    title.textContent = why === 'foundered' ? 'Foundered' : (why === 'broke' ? 'She broke' : (why === 'afloat' ? 'She floats' : 'Clear of the ice'));
    body.textContent = '';
    for (const t of sentences(sim, why)) body.appendChild(el('p', null, t));
    bCopy.hidden = !(S.night && sim.night);
    bridgeNote.classList.toggle('on', !!(S.night && sim.night) && (why === 'clear' || why === 'afloat'));   // the watch goes on
    bAgain.textContent = S.night ? 'This night again' : 'This run again';
    linkBox.hidden = true;
    card.hidden = false;
  }

  A.on('reset', () => { hide(); win = []; nextT = 0; });
  A.on('event', (name, data) => {
    if (name === 'foundered') show(A.broke(S.sim) ? 'broke' : 'foundered');   // the page's 'foundered': she has gone (QC B-4)
    else if (name === 'clear' && S.sim && !S.sim.openings.length) show('clear');
  });
  // Steady with water aboard: over ten minutes of her time the water aboard has not changed by more than 15 t (or two
  // parts in a thousand of it), nor her trim by a hundredth of a degree, nor her list by two. Not "no inflow": a holed
  // ship lying at rest breathes a few tons in and out through her openings for as long as she floats (the four-
  // compartment case shows 5 to 20 t a minute each way, for hours, around 8,978 t), so the core's own test for a run
  // at rest never ends that run.
  let win = [], nextT = 0;
  A.on('step', (sim) => {
    if (shown || A.gone(sim) || !sim.openings.length || (sim.night && sim.night.tClear < 0)) { win = []; nextT = 0; return; }
    if (sim.t < nextT) return;
    nextT = sim.t + 60;
    const r = C.readouts(sim);
    win.push([r.waterT, r.trimDeg, r.listDeg]);
    if (win.length > 11) win.shift();
    if (win.length < 11 || !(r.waterT > 1)) return;
    const span = (k) => { let lo = Infinity, hi = -Infinity; for (const w of win) { if (w[k] < lo) lo = w[k]; if (w[k] > hi) hi = w[k]; } return hi - lo; };
    if (span(0) < Math.max(15, 0.002 * r.waterT) && span(1) < 0.01 && span(2) < 0.02) show('afloat');
  });
  window.addEventListener('hashchange', () => { if (/[#&]log=/.test(location.hash || '')) openFromAddress(); });

  // for the tests (tools/night_end_site_test.js) and for exploring
  A.nightEnd = { link: linkOf, encode: encodeLog, decode: decodeLog, open: openFromAddress, shown: () => (card.hidden ? null : shown), sentences: () => [...body.querySelectorAll('p')].map(p => p.textContent), opened: openFromAddress() };
})();
