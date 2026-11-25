// The end of a watch and the link that replays it (site/parts/40_night_end.js), in a real browser (headless Edge or
// Chrome), with nothing beyond Node.
//   node tools/night_end_site_test.js [dist] [screenshot dir] [--real]
// Checks that the card's figures are the model's, that a link carries a watch's seed and orders and replays it to the
// same fingerprint, that orders a stranger wrote into an address are refused before they reach the model, and that the
// card comes for each ending: clear of the ice, foundered, afloat. And that the best night of the first search for the
// Carpathia question (tools/carpathia.js, W5) opens from its address in out/carpathia_best.json and replays to the
// model's own time. With the fall engine in the page (Z3): the card keeps what it said at the flag while she falls, and
// gains a line for each piece at rest. Under load (G3): when one frame's steps carry her from the dark to the flag, the
// card still says when her lights went out. NH15 F8: the card says when her steam mains gave way, and, where her main
// dynamos are lost before the emergency sets (a what-if: an opening at their compartment), that stage at its own time.
// The page's clock is virtual (QC C-3, docs/DESIGN_virtual_clock_v1_1_2026-11-21.md): each page is opened with clock=test,
// so only this suite's passes move it (tools/cdp.js's vrun and vframes, 1000/60 ms a pass), and a busy machine changes how
// long the suite takes, never what it sees. Every wait on the page's own frames runs its passes with the bound in its own
// time; the wait after "Copy a link" stays on the wall clock (the browser's clipboard answers in its own time). G3's row is
// exact under it: the frame given 120 s of her time at once is one pass. No row measures real time. --real runs it all on
// real time, as before C-3, for comparison.
'use strict';
const fs = require('fs');
const path = require('path');
const B = require('./cdp');
const REAL = process.argv.includes('--real'), argv = process.argv.slice(2).filter(a => a !== '--real');
const dist = path.resolve(argv[0] || path.join(__dirname, '..', 'dist'));
const shots = argv[1] ? path.resolve(argv[1]) : null;
const OPEN = { virtual: !REAL };                   // each page opened with its clock virtual (clock=test), unless --real
const CLOCK = REAL ? '' : '&clock=test';           // what open() adds to an address
const rows = []; let fails = 0;
function row(what, value, ref, ok) { rows.push([what, value, ref, ok]); if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + what.padEnd(92) + ' ' + String(value).padEnd(60) + ' ' + ref); }
const hm = (s) => { const m = Math.round(s / 60); return m < 60 ? m + ' min' : Math.floor(m / 60) + ' h ' + String(m % 60).padStart(2, '0') + ' min'; };
const b64 = (s) => Buffer.from(s, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

(async () => {
  const b = await B.launch({ dist });
  // stop the page's clock on the first step where `cond` holds (page code on `sim`); see tools/night_site_test.js. Since
  // Z3 a watch steps on past the flag (her fall, a reader of the night): its step and clock move on while she falls, so
  // what is read at her foundering is read with the clock stopped on the flag's own step
  // The page runs on its own passes until then (vrun, the bound in its own time), or with --real on real time
  const holdWhen = async (cond, what, ms) => {
    await b.ev(`(() => { const A = TitanicApp; window.__held = false; const f = A.on('step', (sim) => { if (${cond}) { A.state.playing = false; window.__held = true; A.off('step', f); } }); })()`);
    if (REAL) await b.waitFor('window.__held', ms || 180000, what);
    else await b.vrun('window.__held', { maxMs: ms || 180000, held: false, what });
  };
  // a page expression waited for on the page's own passes (with --real, on real time); at once if it already holds
  const waitPage = (cond, ms, what) => (REAL ? b.waitFor(cond, ms, what) : b.vrun(cond, { maxMs: ms, held: false, what }));
  // the page let run for ms of its own time (with --real, of real time), as a sleep let it before
  const settle = (ms) => (REAL ? B.sleep(ms) : b.vrun(null, { maxMs: ms, held: false }));
  // a picture, drawn on a pass of its own under the virtual clock
  const picture = async (name) => { if (!shots) return; if (!REAL) await b.vframes(1, { render: true }); await b.shot(path.join(shots, name)); };
  try {
    // ---- 1. a watch that clears the ice: the card, with the model's own figures
    await b.open('#night=1912', OPEN);
    await b.ev('TitanicApp.state.warp = 6');
    const before = await b.ev('({ shown: TitanicApp.nightEnd.shown(), hidden: document.getElementById("endCard").hidden })');
    await holdWhen('sim.night.tBells >= 0 && sim.t - sim.night.tBells >= 6.5 - 1e-9', 'the step of the order');
    await b.click('bHardPort');
    await waitPage('TitanicApp.state.sim.night.log.length === 1', 5000, 'the order in the log');
    await b.ev('TitanicApp.state.playing = true');
    await waitPage('TitanicApp.state.sim.night.tClear >= 0', 120000, 'the end of the encounter');
    await settle(300);
    const clear = await b.ev(`(() => { const A = TitanicApp, s = A.state.sim, u = TitanicNight.summary(s); return { shown: A.nightEnd.shown(), title: document.querySelector('.endcard-title').textContent, lines: A.nightEnd.sentences(), verdict: TitanicNight.verdict(s), reaction: u.reaction, ahead: u.aheadOrder, fp: u.fingerprint, k: s.night.k, copy: !document.getElementById('endCopy').hidden }; })()`);
    row('no card until something has ended; then, clear of the ice, a card with the model\'s verdict and the first order\'s time', `before: ${before.shown}; then "${clear.title}": ${clear.lines.length} lines; "${clear.lines[1]}"`, `"Clear of the ice"; the verdict; "Your first order came 6.5 s after the bells, the ice ${Math.max(0, clear.ahead).toFixed(0)} m ahead."`,
      before.shown === null && before.hidden && clear.shown === 'clear' && clear.title === 'Clear of the ice' && clear.lines[0] === clear.verdict + '.' && clear.lines[1] === `Your first order came 6.5 s after the bells, the ice ${Math.max(0, clear.ahead).toFixed(0)} m ahead.` && clear.copy);
    await picture('night_end_clear.png');

    // ---- 2. the link: the seed and the orders; it replays the same watch to the same fingerprint at the same step
    await holdWhen('true', 'a step to stand on');
    const mine = await b.ev(`(() => { const A = TitanicApp, s = A.state.sim; return { link: A.nightEnd.link(), k: s.night.k, fp: TitanicNight.fingerprint(s), log: s.night.log.map(o => [o.k, o.type, o.value]), round: JSON.stringify(A.nightEnd.decode(A.nightEnd.encode(s.night.log))) === JSON.stringify(s.night.log.map(o => ({ k: o.k, type: o.type, value: o.value, arg: o.arg }))) }; })()`);
    const hash = mine.link.slice(mine.link.indexOf('#'));
    await b.open(hash, OPEN);
    const opened = await b.ev('({ opened: TitanicApp.nightEnd.opened, mode: TitanicApp.state.night.mode, hash: location.hash })');
    await b.ev('TitanicApp.state.warp = 6');
    await holdWhen(`sim.night.k >= ${mine.k}`, 'the replay to reach the same step');
    const again = await b.ev(`(() => { const s = TitanicApp.state.sim; return { k: s.night.k, fp: TitanicNight.fingerprint(s), log: s.night.log.map(o => [o.k, o.type, o.value]), mode: TitanicApp.state.night.mode }; })()`);
    row('the link carries the night\'s seed and the orders, and the encoding gives them back', `${hash.slice(0, 44)}${hash.length > 44 ? '...' : ''} (${hash.length} characters); round trip ${mine.round}`, '#night=1912&log=...; the same orders back', /^#night=1912&log=[A-Za-z0-9_-]+$/.test(hash) && mine.round);
    row('opened, the link replays that watch: the same orders at the same steps, one fingerprint', `${opened.opened}, ${opened.mode}; step ${again.k}: ${again.fp} (the watch itself ${mine.fp}); orders ${JSON.stringify(again.log)}`, `replay; step ${mine.k}: ${mine.fp}; orders ${JSON.stringify(mine.log)}`,
      opened.opened === 'replay' && opened.mode === 'replay' && again.k === mine.k && again.fp === mine.fp && JSON.stringify(again.log) === JSON.stringify(mine.log) && opened.hash === hash + CLOCK);

    // ---- 3. orders a stranger wrote: anything the model does not know is refused whole, and the night opens without them
    const bad = [
      ['not base64 JSON', 'AAAA'],
      ['an order the model does not have', b64(JSON.stringify([[10, 'scuttle', 1]]))],
      ['a rudder angle past the stops', b64(JSON.stringify([[10, 'helm', 400]]))],
      ['a telegraph order that is not on the dial', b64(JSON.stringify([[10, 'telegraph', 'warp nine']]))],
      ['orders out of their own sequence', b64(JSON.stringify([[50, 'helm', 10], [10, 'helm', -10]]))],
      ['a door that is not there', b64(JSON.stringify([[10, 'door', 99, true]]))],
    ];
    const refused = [];
    for (const [what, log] of bad) {
      await b.open('#night=1912&log=' + log, OPEN);
      const r = await b.ev(`({ opened: TitanicApp.nightEnd.opened, mode: TitanicApp.state.night.mode, n: TitanicApp.state.sim.night.log.length, script: !!TitanicApp.state.sim.night.script, toast: document.getElementById('toast').textContent })`);
      if (!(r.opened === 'refused' && r.mode === 'you' && r.n === 0 && !r.script && /could not be read/.test(r.toast))) refused.push(what + ': ' + JSON.stringify(r));
    }
    row('an address with orders the model does not know, or that are not orders at all: refused whole, the night opens fresh', refused.length ? refused.join(' | ') : bad.length + ' of ' + bad.length + ' refused, each night opened with an empty log', 'all refused; nothing reaches the model', refused.length === 0);
    const none = await b.ev(`(() => { location.hash = '#night=1912'; return TitanicApp.nightEnd.open(); })()`);
    row('an address with no orders is left to the page', String(none), 'null', none === null);

    // ---- 4. the 1912 orders to the end: she founders, and the card's times are the model's. Since G12's cascade (D98) the
    // default watch is handed over at the break's onset ("She broke": tools/onset_site_test.js holds that card); this
    // section and 4a read her foundering, the plant's last minute and the bed after the flag, so they run the what-if
    // handed over at her flag (handover=flag: today's watch to the bit)
    await b.open('#night=1912&handover=flag', OPEN);
    await b.click('bAuto');
    await waitPage('TitanicApp.state.night.mode === "auto" && TitanicApp.state.sim.night.k < 20', 10000, 'the 1912 orders');
    await b.ev('TitanicApp.state.warp = 6');
    await waitPage('TitanicApp.state.sim.night.tClear >= 0', 180000, 'the end of the encounter');
    await b.ev('TitanicApp.state.speed = 900');
    await holdWhen('sim.foundered', 'the foundering', 240000);
    await settle(400);
    const fo = await b.ev(`(() => { const A = TitanicApp, s = A.state.sim, r = TitanicCore.readouts(s); return { shown: A.nightEnd.shown(), title: document.querySelector('.endcard-title').textContent, lines: A.nightEnd.sentences(), founderT: s.founderT, tTouch: s.night.tTouch, clock: A.clockOf(s.founderT), pumped: r.pumpedT, lights: A.state.lightsFailT, lightsClock: A.clockOf(A.state.lightsFailT), dark: s.plant && s.plant.events.dark !== undefined ? s.plant.events.dark : null, fp: TitanicNight.fingerprint(s), k: s.night.k }; })()`);
    const want0 =`She foundered at ${fo.clock}, ${hm(fo.founderT - fo.tTouch)} after she touched the ice.`;
    row('the 1912 orders run to the end: "Foundered", at the model\'s time after the touch', `"${fo.lines[0]}"`, `"${want0}" (the watch: ${((fo.founderT - fo.tTouch) / 60).toFixed(1)} min after the touch)`, fo.shown === 'foundered' && fo.title === 'Foundered' && fo.lines[0] === want0 && (fo.founderT - fo.tTouch) / 60 > 150 && (fo.founderT - fo.tTouch) / 60 < 170);   // to 170 at D4 (C: 163.47; was 165)
    const pumpLine = fo.lines.find(l => /pumps put/.test(l)) || '', lightLine = fo.lines.find(l => /lights/.test(l)) || '';
    row('  and the rest from the model: the record\'s own time beside it, whose orders, her lights, her pumps, the watch\'s fingerprint', `"${fo.lines[1]}" | "${fo.lines.find(l => /1912 orders/.test(l)) || ''}" | "${lightLine}" | "${pumpLine}" | "${fo.lines[fo.lines.length - 1]}"`, `2 h 40 min; the 1912 orders; lights out at ${fo.lightsClock}; ${Math.round(fo.pumped).toLocaleString('en-US')} t pumped; watch ${fo.fp}, step ${fo.k}`,
      /went down 2 h 40 min after the collision/.test(fo.lines[1]) && fo.lines.includes('The 1912 orders were on the bridge.') && lightLine.includes('went out at ' + fo.lightsClock) && pumpLine.includes(Math.round(fo.pumped).toLocaleString('en-US') + ' t') && fo.lines[fo.lines.length - 1] === `Watch ${fo.fp}, step ${fo.k}.`);
    // NH15 F8: her steam's end on the card, at the plant's own time (its event 'break': her boilers and steam mains give way
    // as she rises), in its place among her lights' lines; on this night both sets of dynamos stop on one step (the
    // mainline's G3), so no emergency stage is told
    const st = await b.ev(`(() => { const A = TitanicApp, E = A.state.sim.plant.events; return { brk: E.break === undefined ? null : E.break, clock: E.break === undefined ? null : A.clockOf(E.break), main: E.mainDark === undefined ? null : E.mainDark, mainT: A.state.lightsMainT, deg: window.TitanicSystems.PLANT.breakTrimDeg }; })()`);
    const steamLine = fo.lines.find(l => /steam mains/.test(l)) || '', wantSteam = `Her steam failed at ${st.clock}, as she rose (the model's rule: her boilers and steam mains give way past ${st.deg} degrees of trim).`;
    row('  NH15 F8: her steam\'s end on the card at the plant\'s own time, the line before her lights went out; no emergency stage on this night (both sets stop on one step)',
      `"${steamLine}" (the plant's break at ${st.brk} s, her lights out at ${fo.lights} s); the main sets lost first: ${st.main === null ? 'never' : 'at ' + st.main + ' s'}`,
      `"${wantSteam}", the line before her lights'; never`,
      st.brk !== null && steamLine === wantSteam && st.brk <= fo.lights && fo.lines.indexOf(steamLine) === fo.lines.indexOf(lightLine) - 1 && st.main === null && st.mainT < 0 && !fo.lines.some(l => /emergency/.test(l)));
    await picture('night_end_foundered.png');
    // on to the bed (Z3: the watch steps on through her fall): the card keeps what it said at the flag, the watch's id among
    // it, and the deep part adds a line for each piece as it comes to rest, after the first, and D98's word when the bow
    // lies upside down at rest after the hand-over at the flag (site/parts/75_deep.js; deep_site holds when it shows);
    // the fingerprint is the flag's
    await b.ev('TitanicApp.state.playing = true');
    await waitPage('TitanicApp.state.sim.fall && TitanicApp.state.sim.fall.done', 120000, 'the bed');
    await settle(400);
    const bed = await b.ev(`(() => { const A = TitanicApp, s = A.state.sim; return { shown: A.nightEnd.shown(), lines: A.nightEnd.sentences(), deep: A.deep ? A.deep.lines() : [], upside: A.deep ? A.deep.UPSIDE : null, fp: TitanicNight.fingerprint(s), k: s.night.k, t: s.t, ft: s.fall.t, play: document.getElementById('bPlay').textContent }; })()`);
    const nd = bed.deep.length, nUp = bed.deep.filter(l => l === bed.upside).length;
    row('  played on to the bed: the card as at the flag (its watch id the flag\'s), a line for each piece at rest after the first (and D98\'s word if the bow lies upside down); the fingerprint the flag\'s, her clock the fall\'s',
      `"${bed.play}"; ${bed.lines.length} lines (${fo.lines.length} at the flag, the deep's ${nd}${nUp ? ', D98\'s word among them' : ''}): "${bed.lines[1]}" "${bed.lines[2]}"; last "${bed.lines[bed.lines.length - 1]}"; watch ${bed.fp} at step ${bed.k}; clock ${bed.t} s, the fall's ${bed.ft} s`,
      `"On the bed"; ${fo.lines.length} and the deep's 2 (3 with D98's word); "Watch ${fo.fp}, step ${fo.k}." still; ${fo.fp}, past step ${fo.k}; equal`,
      bed.shown === 'foundered' && bed.play === 'On the bed' && nd === 2 + nUp && nUp <= 1 && bed.lines.length === fo.lines.length + nd && bed.lines[0] === fo.lines[0] &&
      bed.lines.slice(1, 1 + nd).join('|') === bed.deep.join('|') && bed.lines.slice(1 + nd).join('|') === fo.lines.slice(1).join('|') &&
      /^The (bow|stern) is on the bed at /.test(bed.deep[0]) && bed.deep.filter(l => /^The (bow|stern) followed at /.test(l)).length === 1 && bed.fp === fo.fp && bed.k > fo.k && bed.t === bed.ft);
    // the 1912 orders' own log must survive the address: its "reverse" is logged as an angle that is 40 and a rounding
    // (read here, while the watch that foundered is still the page's: "This night again", below, starts it afresh)
    const auto = await b.ev(`(() => { const A = TitanicApp, log = A.state.sim.night.log, back = A.nightEnd.decode(A.nightEnd.encode(log)); return { n: log.length, back: back ? back.length : -1, same: !!back && JSON.stringify(back) === JSON.stringify(log.map(o => ({ k: o.k, type: o.type, value: o.value, arg: o.arg }))), kinds: [...new Set(log.map(o => o.type))].join(',') }; })()`);
    // the card's own buttons: a link (copied, or shown in its box where the browser will not copy), and the night again
    await b.click('endCopy'); await B.sleep(400);           // the clipboard's answer: the browser's, on real time either way
    const cp = await b.ev(`({ box: !document.getElementById('endLink').hidden, value: document.getElementById('endLink').value, link: TitanicApp.nightEnd.link(), toast: document.getElementById('toast').textContent })`);
    await b.click('endAgain');
    await waitPage('TitanicApp.state.sim.night.k < 20 && !TitanicApp.state.sim.foundered', 10000, 'the night again');
    const ag = await b.ev('({ shown: TitanicApp.nightEnd.shown(), hidden: document.getElementById("endCard").hidden, seed: TitanicApp.state.night.seed })');
    row('the 1912 orders\' own log goes into an address and comes back whole', `${auto.n} orders (${auto.kinds}); ${auto.back} back; the same ${auto.same}`, 'every order back, the same', auto.n >= 3 && auto.back === auto.n && auto.same);
    row('"Copy a link" gives the link (copied, or in its box); "This night again" restarts the night and the card goes', `${cp.box ? 'in its box' : 'copied'} (${cp.toast}); again: night ${ag.seed}, card ${ag.shown}`, 'the link, one way or the other; night 1912, no card', ((cp.box && cp.value === cp.link) || /copied/.test(cp.toast)) && ag.seed === 1912 && ag.shown === null && ag.hidden);

    // ---- 4a. under load (G3). With the 1912 orders her lights fail 51 s of her time before the flag, about 200 steps: at
    // 900 times her pace a frame carries 15 s of it, but a busy machine's frame (0.1 s, the most frame() takes) carries 90 s,
    // and then the dark and the flag fall in one frame's steps. The card is written on the flag's step, before that frame
    // is drawn, so the page must record the dark on its own step (site/app.js, lightsOut), not when it draws it. Made
    // deterministic: the same watch held 10 s of her time before her lights fail, then one frame given 120 s of her time
    // at once through the step loop's own store (state.acc), as a busy machine's frame gives it; the frames are counted.
    // The dark and the flag come after the break's onset: the what-if handed over at her flag, as in 4 (G12's cascade)
    await b.open('#night=1912&handover=flag', OPEN);
    await b.click('bAuto');
    await waitPage('TitanicApp.state.night.mode === "auto" && TitanicApp.state.sim.night.k < 20', 10000, 'the 1912 orders again');
    await b.ev('TitanicApp.state.warp = 6');
    await waitPage('TitanicApp.state.sim.night.tClear >= 0', 180000, 'the end of the encounter, again');
    await b.ev('TitanicApp.state.speed = 900');
    await holdWhen(`sim.t >= ${fo.dark - 10}`, 'ten seconds of her time before her lights fail', 240000);
    await b.ev(`(() => { const A = TitanicApp; window.__frames = 0; window.__darkF = -1; window.__flagF = -1;
      window.__fr = A.on('frame', () => { window.__frames++; });
      window.__st = A.on('step', (sim) => { if (window.__darkF < 0 && sim.plant.lights === 0) window.__darkF = window.__frames; if (window.__flagF < 0 && sim.foundered) window.__flagF = window.__frames; });
      A.state.acc = 120; A.state.playing = true; })()`);
    await waitPage('window.__flagF >= 0', 60000, 'the flag, under load');
    await settle(400);
    const ld = await b.ev(`(() => { const A = TitanicApp, s = A.state.sim; A.off('frame', window.__fr); A.off('step', window.__st);
      return { darkF: window.__darkF, flagF: window.__flagF, shown: A.nightEnd.shown(), lines: A.nightEnd.sentences(), dark: s.plant.events.dark, lights: A.state.lightsFailT }; })()`);
    const ldLine = ld.lines.find(l => /lights/.test(l)) || '';
    row('  under load (G3): one frame carries her from 10 s before her lights fail to the flag; the card, written on the flag\'s step before that frame is drawn, still says when they went out',
      `the dark in frame ${ld.darkF}, the flag in frame ${ld.flagF}; "${ldLine}"; recorded at ${ld.lights} s (the plant: ${ld.dark} s)`,
      `one frame; "${lightLine}", as at her pace; the plant's own time, ${fo.dark} s`,
      fo.dark !== null && ld.darkF >= 0 && ld.darkF === ld.flagF && ld.shown === 'foundered' && /went out at /.test(ldLine) && ldLine === lightLine && ld.lights === ld.dark && ld.dark === fo.dark);

    // ---- 4b. the best night of the first search for the Carpathia question (tools/carpathia.js, W5; the note
    // docs/research/RESULT_carpathia_search_v2_2026-11-20.md). Its address, as out/carpathia_best.json carries it, opens as a
    // replay, every order in it one the address check accepts (its pump orders among them); run on, she founders at the time
    // the model alone gives for the same log in this page's engine, to the bit, and within 5 s of Node's (two engines part in
    // the last bits, backlog X1: with no order the 1912 watch founders at 9,492.5 s in Node and 9,493.75 s in Edge); and the
    // card says the minutes after the touch that the file gives, to the minute. Since 2026-11-23 the file is the v3 search's
    // best orders remeasured on C (D90) (tools/carpathia.js --remeasure): T+165.99. Since D5 (RESULT_carpathia_search_v4,
    // 2026-11-23) it is the search's best night on C, warm-started from those orders: T+168.04 (v3's T+164.99 was join 7's).
    // G12 (D98, evaluation 4): a night ends at its hand-over, the break's onset by default, so the record's night ends
    // there (endT, broke) and the page's card says "She broke"; NOTE_MIN is the note's figure for it (RESULT v5)
    const NOTE_MIN = 161.23;
    const best = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'out', 'carpathia_best.json'), 'utf8'));
    const bestLog = best.log.map(o => [o.k, o.type, o.value, o.arg === undefined ? null : o.arg]);
    await b.open(best.address, OPEN);
    const bo = await b.ev(`(() => { const A = TitanicApp, l = /[#&]log=([^&]*)/.exec(location.hash), back = l ? A.nightEnd.decode(l[1]) : null;
      return { opened: A.nightEnd.opened, mode: A.state.night.mode, seed: A.state.night.seed, chars: location.hash.length, back: back ? back.map(o => [o.k, o.type, o.value, o.arg === undefined ? null : o.arg]) : null }; })()`);
    await b.ev('TitanicApp.state.warp = 25');
    await waitPage('TitanicApp.state.sim.night.tClear >= 0', 120000, 'the end of the encounter, replayed');
    await b.ev('TitanicApp.state.speed = 900');
    await holdWhen('TitanicApp.gone(sim)', 'the best night to its end', 300000);
    await settle(400);
    const bs = await b.ev(`(() => { const A = TitanicApp, s = A.state.sim; return { t: A.goneT(s), broke: A.broke(s), tt: s.night.tTouch, k: s.night.k, fp: TitanicNight.fingerprint(s), clock: A.clockOf(A.goneT(s)),
      given: s.night.log.map(o => [o.k, o.type, o.value, o.arg === undefined ? null : o.arg, o.refused || null]), shown: A.nightEnd.shown(), title: document.querySelector('.endcard-title').textContent, lines: A.nightEnd.sentences() }; })()`);
    // the same log given by the model alone, in this page (no viewer, no reader): the same engine, so the same bits
    const alone = await b.ev(`(() => { const NN = TitanicNight, log = ${JSON.stringify(best.log)};
      const w = NN.create(TitanicCore.buildShip(), NN.spec(${best.seed}), { script: log.map(o => ({ k: o.k, type: o.type, value: o.value, arg: o.arg })), readers: false });
      NN.sink(w); return { over: NN.over(w), t: w.foundered ? w.founderT : (w.night.onset && w.night.onset.found ? w.night.onset.found.t : -1), tt: w.night.tTouch, k: w.night.k, fp: NN.fingerprint(w), refused: w.night.log.filter(o => o.refused).length }; })()`);
    const noteMin = hm(best.minutes * 60), wantLine = (best.broke ? 'She broke at ' : 'She foundered at ') + `${bs.clock}, ${noteMin} after she touched the ice.`;
    const mins = (t, tt) => ((t - tt) / 60).toFixed(2) + ' min';
    row('the best night the search found (out/carpathia_best.json): its address opens as a replay, every order accepted; it ends (her hand-over) at the time the model alone gives in this page, to the bit, within 5 s of Node\'s; the card gives the note\'s minutes',
      `${bo.opened}, ${bo.mode}, night ${bo.seed}; ${bo.back ? bo.back.length : 'NO'} of ${bestLog.length} orders accepted from ${bo.chars} characters; the page: ${mins(bs.t, bs.tt)} after the touch (${bs.t} s, ${bs.fp} at step ${bs.k}), ${bs.given.filter(o => o[4]).length} refused; "${bs.lines[0]}"`,
      `the model alone in the page: ${mins(alone.t, alone.tt)} (${alone.t} s, ${alone.fp} at step ${alone.k}), to the bit; Node: ${best.minutes.toFixed(2)} min (${best.endT !== undefined ? best.endT : best.founderT} s, ${best.fingerprint} at step ${best.k}), within 5 s; the note's best night: T+${NOTE_MIN}, "${noteMin}" (v4's at the flag T+168.04; v3's orders on C T+165.99; v3 on join 7's model T+164.99; v2 T+171.38)`,
      bo.opened === 'replay' && bo.mode === 'replay' && bo.seed === best.seed && !!bo.back && JSON.stringify(bo.back) === JSON.stringify(bestLog) &&
      JSON.stringify(bs.given.map(o => o.slice(0, 4))) === JSON.stringify(bestLog) && bs.given.every(o => !o[4]) &&
      alone.over && alone.refused === 0 && bs.t === alone.t && bs.k === alone.k && bs.fp === alone.fp && Math.abs(bs.t - (best.endT !== undefined ? best.endT : best.founderT)) <= 5 &&
      bs.broke === !!best.broke && bs.shown === (best.broke ? 'broke' : 'foundered') && bs.title === (best.broke ? 'She broke' : 'Foundered') && bs.lines[0] === wantLine && noteMin === hm(NOTE_MIN * 60));
    await picture('night_end_carpathia_best.png');

    // ---- 5. a damage preset that floats (Wilding's four compartments): "She floats", once she lies steady
    await b.open('#scenario=four', OPEN);
    await b.ev('TitanicApp.state.speed = 900');
    await waitPage('TitanicApp.nightEnd.shown() === "afloat"', 240000, 'her lying steady');
    const fl = await b.ev(`(() => { const A = TitanicApp, s = A.state.sim, r = TitanicCore.readouts(s); return { title: document.querySelector('.endcard-title').textContent, lines: A.nightEnd.sentences(), trim: r.trimDeg, water: r.waterT, foundered: s.foundered, t: s.t, copy: !document.getElementById('endCopy').hidden, again: document.getElementById('endAgain').textContent }; })()`);
    row('four forward compartments open (Wilding: she floats): "She floats", with her trim and the water aboard, within the hour', `"${fl.title}": "${fl.lines[0]}" after ${hm(fl.t)}`, 'She floats: ... t of water aboard, about 2.0° by the head (the validation table), once she has lain steady ten minutes (the forepeak above its tank fills only through the tank\'s 4-in vent [bet], G7: at rest by about 2 h 30; join 6: about 30 min)', fl.title === 'She floats' && /^She floats: [\d,]+ t of water aboard, 2\.0° by the head/.test(fl.lines[0]) && !fl.foundered && !fl.copy && fl.again === 'This run again' && fl.t < 180 * 60);

    // ---- 5b. NH15 F8: the emergency stage on the card. A what-if: the undamaged hull holed low in her side in the main
    // dynamos' compartment (core/systems.js PLANT.rooms2.el; an opening as the page's hole tool makes one), so that the sea
    // reaches her main dynamos while the emergency sets on D deck stay dry with the steam up: the plant lights her at its
    // emergency share. She settles and floats, and the card says when her main dynamos were lost, at the plant's own time
    await b.open('#scenario=blank', OPEN);
    await b.ev(`(() => { const A = TitanicApp, C = TitanicCore, Y = TitanicSystems, sim = A.state.sim, Z = sim.ship.zones[Y.PLANT.rooms2.el], x = 0.5 * (Z.xa + Z.xf), z = 2.5;
      C.addOpening(sim, { x, y: -(C.halfBreadth(x, z, sim.ship.hull) + 0.02), z, area: 0.5, kind: 'breach', label: 'user' }); })()`);
    await b.ev('TitanicApp.state.speed = 900');
    await waitPage('TitanicApp.nightEnd.shown() === "afloat"', 240000, 'her lying steady on her emergency lights');
    const ef = await b.ev(`(() => { const A = TitanicApp, s = A.state.sim, P = s.plant; return { title: document.querySelector('.endcard-title').textContent, lines: A.nightEnd.sentences(), mainDark: P.events.mainDark === undefined ? null : P.events.mainDark, dark: P.events.dark === undefined ? null : P.events.dark, lights: P.lights, mainT: A.state.lightsMainT, why: A.state.lightsMainWhy, failT: A.state.lightsFailT, clock: P.events.mainDark === undefined ? null : A.clockOf(P.events.mainDark), t: s.t }; })()`);
    const wantEm = `Water reached her main dynamos at ${ef.clock || hm(ef.mainDark) + ' in'}: only her emergency lights burned after.`;
    row('NH15 F8: the emergency stage on the card: her main dynamos flooded (an opening at their compartment, a what-if), she floats on her emergency lights, and the card says when, at the plant\'s own time',
      `"${ef.title}": "${ef.lines.find(l => /dynamos/.test(l)) || ''}" (the plant: the main sets lost at ${ef.mainDark} s, the page's record ${ef.mainT} s, "${ef.why}"; her lights at ${ef.lights}${ef.dark === null ? ', never dark' : ', dark at ' + ef.dark + ' s'}) after ${hm(ef.t)}`,
      `"She floats": "${wantEm}"; her lights at the emergency share, not out`,
      ef.title === 'She floats' && ef.mainDark !== null && ef.mainT === ef.mainDark && ef.why === 'the main dynamos flooded' && ef.lights > 0 && ef.lights < 1 && ef.dark === null && ef.failT < 0 && ef.lines.includes(wantEm) && !ef.lines.some(l => /went out|burned to the end/.test(l)));

    // ---- 6. a phone: the card inside the stage
    await b.page.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 780, deviceScaleFactor: 2, mobile: true });
    await b.page.send('Emulation.setTouchEmulationEnabled', { enabled: true });
    await b.open('#scenario=titanic', OPEN);
    await b.ev('TitanicApp.state.speed = 900');
    // read on the bed (the titanic preset has a sea: core/scenarios.js), where the card is at its fullest, with the deep's lines
    await waitPage('TitanicApp.state.sim.foundered && TitanicApp.nightEnd.shown() === "foundered" && !!TitanicApp.state.sim.fall && TitanicApp.state.sim.fall.done', 240000, 'the preset\'s foundering and her fall');
    await settle(400);
    const ph = await b.ev(`(() => { const c = document.getElementById('endCard').getBoundingClientRect(), s = document.getElementById('stage').getBoundingClientRect(), bs = [...document.querySelectorAll('#endCard .btn')].filter(x => !x.hidden).map(x => x.getBoundingClientRect().height); return { device: TitanicApp.device(), card: [c.left, c.top, c.right, c.bottom].map(Math.round), stage: [s.left, s.top, s.right, s.bottom].map(Math.round), btn: Math.round(Math.min(...bs)), lines: TitanicApp.nightEnd.sentences() }; })()`);
    row('on a phone (390 x 780) the card lies inside the stage, its buttons 40 px tall, on the bed with the deep\'s two lines; a preset\'s card gives the time into the run', `${ph.device}; card ${ph.card.join(',')} in stage ${ph.stage.join(',')}; buttons ${ph.btn} px; ${ph.lines.length} lines; "${ph.lines[0]}"`, 'phone; inside; at least 40 px; "She foundered at 2:25 am, 2 h 46 min into the run." (2:18 before D4, the calibration epoch landed with member C; 2:17 before G7, the forepeak held to its tank, and its refit; 2:16 before S1)',
      ph.device === 'phone' && ph.card[0] >= ph.stage[0] && ph.card[2] <= ph.stage[2] && ph.card[1] >= ph.stage[1] && ph.card[3] <= ph.stage[3] && ph.btn >= 40 && ph.lines[0] === 'She foundered at 2:25 am, 2 h 46 min into the run.' && ph.lines.some(l => /^The (bow|stern) is on the bed at /.test(l)));
    await picture('night_end_phone.png');
    row('no error in the page\'s console through all of it', b.errors.length ? b.errors.slice(0, 3).join(' | ') : 'none', 'none', b.errors.length === 0);
    console.log(fails ? `FAIL: ${fails} row(s)` : `PASS: all ${rows.length} rows`);
  } catch (e) {
    fails++; console.log('FAIL the test could not finish: ' + e.message); if (b.errors.length) console.log('page errors: ' + b.errors.slice(0, 5).join(' | '));
  } finally {
    await b.close();
    process.exit(fails ? 1 : 0);
  }
})();
