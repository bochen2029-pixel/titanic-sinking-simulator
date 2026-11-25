// Ask the bridge, stage A: the crew's own words (site/parts/88_minds.js, its words site/parts/87_minds_words.js) in a real
// browser (headless Edge or Chrome), with the fake transport and nothing beyond Node.
//   node tools/minds_site_test.js [dist] [screenshot dir] [--real]
// docs/DESIGN_ask_the_bridge_v1_2026-11-23.md, section 13, the second list:
//   1. off by default: the page is step 1's page (no transport: the folded section says the desktop app is needed; a
//      transport switched off changes nothing either); the watch's fingerprint is the model's
//   2. a question to a man in reach: awaited (the pace held at her own), then answered in the page's time, marked as
//      imagined, with the facts of the step it was asked on
//   3. an offer, given: the order is in the watch's log on that step, step 1's answer after it; the link replays the night
//      with no transport
//   4. "Act on my word": given at once
//   5. a reply that fails a check: asked once more with its fault named, then the authored line; the tape holds both
//   6. a man out of reach: no request is made, and the row says where he is
//   7. the limit: past it no request is made, and the notice says so
//   8. nothing on the stage; no error in the console; tools/clock_tests.js still passes
// The transport is the part's own fake (TitanicApp.minds.fake), which answers from a table after a set time of the page's
// clock: each page is opened with clock=test (QC C-3), so only this suite's passes move it and an answer lands on a pass
// this suite can count. The questions are typed as a person types them (a real click on the line, the words through the
// browser's own text input, Enter); the buttons are real clicks. --real runs it on real time, for comparison.
'use strict';
const path = require('path');
const { spawnSync } = require('child_process');
const B = require('./cdp');
const REAL = process.argv.includes('--real'), argv = process.argv.slice(2).filter(a => a !== '--real');
const dist = path.resolve(argv[0] || path.join(__dirname, '..', 'dist'));
const shots = argv[1] ? path.resolve(argv[1]) : null;
const OPEN = { virtual: !REAL };                   // each page opened with its clock virtual (clock=test), unless --real
const CLOCK = REAL ? '' : '&clock=test';           // what open() adds to an address
const WARP = 6;                                    // the watch's real time until the ice is passed, multiplied (a test hook)
const DELAY = 2000;                                // ms of the page's clock the fake takes to answer
const rows = []; let fails = 0;
function row(what, value, ref, ok) { rows.push([what, value, ref, ok]); if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + what.padEnd(96) + ' ' + String(value).padEnd(60) + ' ' + ref); }
const seen = (log) => JSON.stringify(log.map(o => [o.k, o.type, o.value, o.arg === undefined ? null : o.arg]));
// the fake's table for this suite: each row by the seat and a piece of the captain's words; the last answers anything
const TABLE = [
  { seat: 'murdoch', when: 'what did you see', replies: [{ say: 'Ice, sir, close ahead and dark, and she went by it on the starboard side.', order: null }] },
  { seat: 'murdoch', when: 'what would you do', replies: [{ say: 'I would put her half astern, sir.', order: 'half astern' }] },
  { seat: 'murdoch', when: 'what now', replies: [{ say: 'Yes, sir. Stop her.', order: 'stop' }] },
  { seat: 'murdoch', when: 'how is she', replies: [{ say: 'Okay, sir: there are 37 feet of water in her.', order: null }] },
  { replies: [{ say: 'All right, sir.', order: null }] },
];

(async () => {
  const b = await B.launch({ dist });
  // the page's clock stopped on the first step where cond holds (page code on `sim`; tools/crew_site_test.js)
  const holdWhen = async (cond, what, ms) => {
    await b.ev(`(() => { const A = TitanicApp; window.__held = false; const f = A.on('step', (sim) => { if (${cond}) { A.state.playing = false; window.__held = true; A.off('step', f); } }); })()`);
    if (REAL) await b.waitFor('window.__held', ms || 180000, what);
    else await b.vrun('window.__held', { maxMs: ms || 180000, held: false, what });
  };
  const waitPage = (cond, ms, what) => (REAL ? b.waitFor(cond, ms, what) : b.vrun(cond, { maxMs: ms, held: false, what }));
  const settle = (ms) => (REAL ? B.sleep(ms) : b.vrun(null, { maxMs: ms, held: false }));
  const picture = async (name) => { if (!shots) return; if (!REAL) await b.vframes(1, { render: true }); await b.shot(path.join(shots, name)); };
  const go = () => b.ev('TitanicApp.state.playing = true');
  const press = async (key, code, vk, text) => {
    await b.page.send('Input.dispatchKeyEvent', Object.assign({ type: 'keyDown', key, code, windowsVirtualKeyCode: vk }, text ? { text, unmodifiedText: text } : {}));
    await b.page.send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: vk });
  };
  // a line typed as a person types it: a real click on the line, the words as typed, Enter
  const type = async (text) => { await b.clickSel('#crewLine'); await b.page.send('Input.insertText', { text }); await press('Enter', 'Enter', 13); };
  const talk = () => b.ev('TitanicApp.crew.lines()');
  const last = async (n) => (await talk()).slice(-(n || 1));
  const asked = () => b.ev('(TitanicApp.minds.transport() && TitanicApp.minds.transport().requests || []).length');
  // the page's time until no answer is awaited (the clock may be stopped: the page's clock runs on all the same)
  const answers = async (what) => (REAL ? (await b.waitFor('TitanicApp.minds.awaited().length === 0', 30000, what), { ms: null })
    : b.vrun('TitanicApp.minds.awaited().length === 0', { maxMs: 30000, held: false, what }));
  const FACTS = (seat) => `TitanicMindsWords.facts(TitanicMindsWords.gather(TitanicApp.state.sim), '${seat}', { convention: TitanicApp.crew.convention() })`;
  try {
    // ---- 1. off by default: no transport. The folded section says the desktop app is needed; a question gets step 1's
    // own answer; nothing of the part on the stage
    await b.open('#night=1912', OPEN);
    await b.ev(`TitanicApp.state.warp = ${WARP}`);
    const ui = await b.ev(`(() => { const f = document.getElementById('mindsFold'), n = document.getElementById('mindsNone'), w = document.getElementById('mindsWho'), c = document.getElementById('mindsCtl');
      return { part: !!TitanicApp.minds, transport: !!TitanicApp.minds && TitanicApp.minds.transport() !== null, inRun: !!f && !!f.closest('#crewSec') && !!f.closest('#panel') && !!f.closest('[data-pane="run"]'), open: !!f && f.open,
        none: !!n && !n.hidden && /desktop app/.test(n.textContent), ctl: !!c && c.hidden, who: !!w && w.hidden, on: TitanicApp.minds.on() }; })()`);
    row('1. no transport: "The crew\'s minds" folded in the order line\'s section, saying the desktop app is needed', `${ui.inRun ? 'in the Run tab\'s section' : 'NOT IN THE SECTION'}${ui.open ? ', OPEN' : ', folded'}; ${ui.none ? 'the desktop app named' : 'NO WORD OF THE APP'}; transport ${ui.transport}; on ${ui.on}`,
      'folded; the app needed; no transport; off', ui.part && !ui.transport && ui.inRun && !ui.open && ui.none && ui.ctl && ui.who && !ui.on);
    await b.click('bAuto');
    await waitPage('TitanicApp.state.night.mode === "auto" && TitanicApp.state.sim.night.k < 20', 10000, 'the 1912 orders');
    await b.ev(`TitanicApp.state.warp = ${WARP}`);
    await holdWhen('sim.night.tTouch >= 0 && sim.t >= sim.night.tTouch + 120', 'two minutes after the touch');
    await type('Mr Murdoch, what did you see?');
    const s1 = await last(2);
    row('  a question with no transport gets step 1\'s own answer, and nothing else', s1.map(l => l.who + ': ' + l.words + ' (' + l.kind + ')').join(' / '), 'You: Mr Murdoch, what did you see? / The officer of the watch: I couldn\'t say, sir.',
      s1[0].who === 'You' && s1[1].who === 'The officer of the watch' && s1[1].words === 'I couldn\'t say, sir.' && s1[1].kind === 'no' && (await b.ev('TitanicApp.minds.tape().length')) === 0);
    // a transport there but switched off (the fake's own default) changes nothing either
    await b.ev(`TitanicApp.minds.useTransport(TitanicApp.minds.fake({ on: false, delay: ${DELAY}, table: ${JSON.stringify(TABLE)}, needsKey: true })).then(() => true)`);
    // "They speak up unasked" is on by default (row 7b holds it): switched off here for the rows that count the questions
    const speaks0 = await b.ev('(() => { const d = TitanicApp.minds.speaks(), kept = localStorage.getItem("titanic.minds.speaks"); TitanicApp.minds.setSpeaks(false); return { d, kept }; })()');
    await settle(50);
    await type('Mr Murdoch, what did you see?');
    const s1b = await last(1), n1 = await asked();
    const off = await b.ev(`({ on: TitanicApp.minds.on(), who: document.getElementById('mindsWho').hidden, ctl: document.getElementById('mindsCtl').hidden, none: document.getElementById('mindsNone').hidden })`);
    row('  a transport switched off (the default): the controls in the fold, still step 1\'s answer, no request', `on ${off.on}; the controls ${off.ctl ? 'HIDDEN' : 'shown'}; "${s1b[0].who}: ${s1b[0].words}"; ${n1} requests`,
      'off; shown; The officer of the watch: I couldn\'t say, sir.; 0', !off.on && !off.ctl && off.none && off.who && s1b[0].who === 'The officer of the watch' && n1 === 0);
    const fp1 = await b.ev(`(() => { const s = TitanicApp.state.sim, k = s.night.k, NN = TitanicNight, m = NN.create(TitanicCore.buildShip(), NN.spec(1912), { auto: true, readers: false });
      while (m.night.k < k) NN.step(m); return { k, fp: NN.fingerprint(s), alone: NN.fingerprint(m), mode: TitanicApp.state.night.mode }; })()`);
    row('  the 1912 orders\' watch, questions typed and none taken, has the fingerprint of the model alone', `step ${fp1.k}: ${fp1.fp}; ${fp1.mode}`, `the model alone in the page: ${fp1.alone}`, fp1.fp === fp1.alone && fp1.mode === 'auto');

    // ---- 2. on (a real click on the switch, the fold opened first); a question to the officer of the watch
    await b.clickSel('#mindsFold > summary');
    await b.clickSel('#mindsOn');
    await b.ev('TitanicApp.minds.refresh().then(() => true)');
    await settle(50);
    const on2 = await b.ev(`({ on: TitanicApp.minds.on(), who: !document.getElementById('mindsWho').hidden, chosen: TitanicApp.minds.chosen(), names: [...document.querySelectorAll('#mindsWho button[data-seat]')].map(x => x.dataset.seat) })`);
    row('2. switched on by a real click: the row of names shows the cast, the officer of the watch spoken to', `on ${on2.on}; ${on2.names.join(', ')}; ${on2.chosen}`, 'on; murdoch, moody, boxhall, hichens, andrews, bell; murdoch',
      on2.on && on2.who && on2.chosen === 'murdoch' && on2.names.join() === 'murdoch,moody,boxhall,hichens,andrews,bell');
    // the fold open, with a provider whose name is far longer than the panel is wide (the fake's): nothing in it is laid
    // wider than the panel (the first look at the page showed the panel scrolling sideways under the provider's box)
    const wide2 = await b.ev(`(() => { const p = document.getElementById('panel'), s = document.getElementById('mindsProvider'), c = document.getElementById('mindsCtl'), pr = p.getBoundingClientRect();
      const out = [...c.querySelectorAll('*')].filter(e => e.getClientRects().length && e.getBoundingClientRect().right > pr.right + 1).map(e => e.id || e.className || e.tagName);
      return { over: p.scrollWidth - p.clientWidth, label: s.options[s.selectedIndex] ? s.options[s.selectedIndex].text.length : 0, sel: Math.round(s.getBoundingClientRect().width), panel: Math.round(pr.width), out: out.slice(0, 4) }; })()`);
    row('  the fold open: nothing in it is wider than the panel, a provider\'s long name cut in its box', `the panel scrolls sideways by ${wide2.over} px; the provider's box ${wide2.sel} px of ${wide2.panel} for a name of ${wide2.label} letters; past the edge: ${wide2.out.join(', ') || 'none'}`,
      '0 px; within the panel; none', wide2.over <= 1 && wide2.out.length === 0 && wide2.sel < wide2.panel && wide2.label > 40);
    await b.ev('TitanicApp.state.speed = 30');
    const F2 = await b.ev(FACTS('murdoch')), k2 = await b.ev('TitanicApp.state.sim.night.k');
    await type('Mr Murdoch, what did you see?');
    await go();
    const w2 = await b.ev(`(() => { const L = TitanicApp.crew.lines(), r = TitanicApp.minds.transport().requests; return { line: L[L.length - 1], n: r.length, req: r[r.length - 1], awaited: TitanicApp.minds.awaited(), pace: TitanicApp.pace() }; })()`);
    row('  asked: one request, built from the facts of the step it was asked on; the line says he has been asked', `${w2.n} request at step ${w2.req.k} (asked on ${k2}); "${w2.line.words}" (${w2.line.kind}); awaited ${w2.awaited.join()}`,
      '1 at the step; "Mr Murdoch has been asked." (wait); murdoch', w2.n === 1 && w2.req.k === k2 && w2.req.seat === 'murdoch' && w2.req.changing.indexOf(F2 + '\n\n') === 0 && w2.line.words === 'Mr Murdoch has been asked.' && w2.line.kind === 'wait' && w2.line.who === '' && w2.awaited.join() === 'murdoch');
    row('  while it is awaited the page\'s pace is held at her own', `pace ${w2.pace} (the player\'s 30)`, 'pace 1', w2.pace === 1);
    const r2 = await answers('the answer');
    const a2 = await b.ev(`(() => { const L = TitanicApp.crew.lines(), li = document.querySelector('#crewTalk li:last-child'), m = li && li.querySelector('.crew-mark'), t = TitanicApp.minds.tape();
      return { line: L[L.length - 1], dataset: li ? li.dataset.imagined : null, mark: m ? m.textContent : null, title: m ? m.title : '', now: TitanicApp.clockOf(TitanicApp.state.sim.t), prev: TitanicApp.clockOf(TitanicApp.state.sim.t - 0.25), tape: t, pace: TitanicApp.pace(),
        hash: TitanicMindsWords.hash(${JSON.stringify(F2)}), use: document.getElementById('mindsUse').textContent }; })()`);
    row('  answered after the fake\'s time of the page\'s clock, with the ship\'s time then, marked as imagined', `${a2.line.who}: "${a2.line.words}" at ${a2.line.t}; ${r2.ms === null ? 'real time' : Math.round(r2.ms) + ' ms'}; data-imagined ${a2.dataset}; mark "${a2.mark}"`,
      `Mr Murdoch, at the ship\'s time; ${DELAY} ms; 1; "imagined"`, a2.line.who === 'Mr Murdoch' && a2.line.kind === 'mind' && a2.line.imagined === true && a2.dataset === '1' && a2.mark === 'imagined' && /Imagined/.test(a2.title)
      && a2.line.words === TABLE[0].replies[0].say && (a2.line.t === a2.now || a2.line.t === a2.prev) && (r2.ms === null || (r2.ms >= DELAY - 1e-6 && r2.ms < DELAY + 40)));
    const t2 = a2.tape[0] || {};
    row('  the tape: the step, the seat, the words, the hash of THE FACTS, the attempt and its checks, how it ended', `step ${t2.k}, ${t2.seat}, facts ${t2.facts}, ${(t2.attempts || []).length} attempt, ${t2.end}`,
      `step ${k2}, murdoch, ${a2.hash}, 1, none`, a2.tape.length === 1 && t2.k === k2 && t2.seat === 'murdoch' && t2.words === 'Mr Murdoch, what did you see?' && t2.facts === a2.hash && t2.attempts.length === 1 && t2.attempts[0].read.ok && t2.attempts[0].check.ok && t2.end === 'none');
    // (another part may hold the pace for a few seconds of its own when the answer comes, the reports' for a report brought:
    // the row waits for the player's pace, bounded, and says so)
    let paceBack = a2.pace;
    if (paceBack !== 30) { try { await waitPage('TitanicApp.pace() === 30', 8000, 'the pace given back'); } catch (e) { /* the row says it */ } paceBack = await b.ev('TitanicApp.pace()'); }
    row('  the hold ends with the answer; this night\'s use is shown', `pace ${paceBack}${paceBack === a2.pace ? '' : ' (another part held it at ' + a2.pace + ' as the answer came)'}; "${a2.use.slice(0, 60)}"`, 'pace 30; This night: 1 question', paceBack === 30 && /^This night: 1 question;/.test(a2.use));
    await picture('minds-answer.png');

    // ---- 3. an offer, given by a real click (the clock stopped, so the order lands on a known step)
    await b.ev('TitanicApp.state.playing = false');
    const n3 = await b.ev('TitanicApp.state.sim.night.log.length');
    await type('Mr Murdoch, what would you do?');
    await answers('the offer');
    const o3 = await b.ev(`(() => { const box = document.getElementById('mindsOffer'); return { offer: TitanicApp.minds.offer(), shown: !box.hidden, give: document.getElementById('mindsGive').textContent, text: document.getElementById('mindsOfferText').textContent,
      n: TitanicApp.state.sim.night.log.length, end: TitanicApp.minds.tape().slice(-1)[0].end }; })()`);
    row('3. an order in his answer is offered, "Give it" and "No", and nothing is given yet', `"${o3.text}" [${o3.give}] [No]; the log ${o3.n - n3} more; ${o3.end}`, '"Mr Murdoch offers: Half astern." [Give it: Half astern]; 0; offered',
      !!o3.offer && o3.shown && o3.give === 'Give it: Half astern' && o3.text === 'Mr Murdoch offers: Half astern.' && o3.n === n3 && o3.end === 'offered');
    const k3 = await b.ev('TitanicApp.state.sim.night.k');
    await b.clickSel('#mindsGive');
    const g3 = await b.ev(`(() => { const L = TitanicApp.state.sim.night.log, e = L[L.length - 1], T = TitanicApp.minds.tape().slice(-1)[0], C = TitanicApp.crew.lines(); return { e, n: L.length, end: T.end, kGiven: T.kGiven, said: C.slice(-2).map(l => l.kind + ': ' + l.words), mode: TitanicApp.state.night.mode, offer: TitanicApp.minds.offer() }; })()`);
    row('  given: in the watch\'s log on that step, through TitanicApp.order, step 1\'s answer after it', `${g3.e.type} ${g3.e.value} at step ${g3.e.k} (held on ${k3}); "${g3.said.join('" / "')}"; ${g3.end}`,
      `telegraph half astern at step ${k3}; the watch yours; "yes: Half astern, sir. The engine room answers."; given`, g3.n === n3 + 1 && g3.e.type === 'telegraph' && g3.e.value === 'half astern' && g3.e.k === k3 && g3.end === 'given' && g3.kGiven === k3
      && g3.mode === 'you' && g3.said[1] === 'yes: Half astern, sir. The engine room answers.' && g3.offer === null);

    // ---- 4. "Act on my word" (a real click): given at once, on the step the answer came
    await b.clickSel('#mindsAct button[data-act="act"]');
    const act4 = await b.ev(`({ act: TitanicApp.minds.act(), kept: localStorage.getItem('titanic.minds.act') })`);
    const n4 = await b.ev('TitanicApp.state.sim.night.log.length');
    await type('Mr Murdoch, what now?');
    await answers('the order given at once');
    const g4 = await b.ev(`(() => { const L = TitanicApp.state.sim.night.log, e = L[L.length - 1], T = TitanicApp.minds.tape().slice(-1)[0]; return { e, n: L.length, end: T.end, kGiven: T.kGiven, k: TitanicApp.state.sim.night.k, offer: TitanicApp.minds.offer(), said: TitanicApp.crew.lines().slice(-1)[0] }; })()`);
    row('4. "Act on my word": the order given at once when the answer comes, with no offer', `${act4.act} (kept "${act4.kept}"); ${g4.e.type} ${g4.e.value} at step ${g4.e.k}; ${g4.end}; "${g4.said.words}"`,
      'act; telegraph stop on the answer\'s step; given; Stop, sir. The engine room answers.', act4.act === 'act' && act4.kept === 'act' && g4.n === n4 + 1 && g4.e.type === 'telegraph' && g4.e.value === 'stop'
      && g4.end === 'given' && g4.kGiven === g4.e.k && g4.e.k === g4.k && g4.offer === null && g4.said.words === 'Stop, sir. The engine room answers.');
    await b.clickSel('#mindsAct button[data-act="ask"]');

    // ---- 4b. an offer answered in words (the review of stage A: untested). "yes" to another man answers nothing, and
    // the offer stands; "no" declines it; nothing is given either way
    const n4b = await b.ev('TitanicApp.state.sim.night.log.length'), q4b = await asked();
    await type('Mr Murdoch, what would you do?');
    await answers('a second offer');
    await type('Mr Phillips, yes');
    const still = await b.ev('({ offer: !!TitanicApp.minds.offer(), line: TitanicApp.crew.lines().slice(-1)[0] })');
    await type('no');
    const d4 = await b.ev(`({ offer: TitanicApp.minds.offer(), end: TitanicApp.minds.tape().slice(-1)[0].end, n: TitanicApp.state.sim.night.log.length, line: TitanicApp.crew.lines().slice(-1)[0], shown: !document.getElementById('mindsOffer').hidden })`);
    row('  an offer answered in words: "yes" to another man answers nothing and it stands; "no" declines it; nothing is given', `"Mr Phillips, yes": the offer ${still.offer ? 'stands' : 'GONE'} ("${still.line.words}"); "no": ${d4.end}, "${d4.line.words}"; the log ${d4.n - n4b} more; ${(await asked()) - q4b} request`,
      'stands (he has no line to the bridge); declined, "Not given: Half astern."; 0 more; 1', still.offer && still.line.who === '' && still.line.kind === 'notice' && /no line to the bridge/.test(still.line.words) && d4.offer === null && !d4.shown && d4.end === 'declined'
      && d4.line.words === 'Not given: Half astern.' && d4.n === n4b && (await asked()) === q4b + 1);

    // ---- 4c. a line that looks like a key, pasted into the order line by mistake: not said, not kept, not sent
    const q4c = await asked();
    await type('sk-test-0123456789abcdefghijklmnopqrstuv');
    const k4 = await b.ev(`(() => { const L = TitanicApp.crew.lines(), K = 'sk-test-0123456789'; return { line: L[L.length - 1], kept: TitanicApp.crew.kept().some(x => x.indexOf(K) >= 0), shown: document.getElementById('crewSec').textContent.indexOf(K) >= 0,
      tape: JSON.stringify(TitanicApp.minds.tape()).indexOf(K) >= 0, sent: JSON.stringify(TitanicApp.minds.transport().requests).indexOf(K) >= 0, box: document.getElementById('crewLine').value }; })()`);
    row('  a line that looks like a key is not said, not kept for the up arrow and not sent: a notice nobody says tells why', `"${k4.line.words.slice(0, 44)}..." (${k4.line.kind}); kept ${k4.kept}, shown ${k4.shown}, on the tape ${k4.tape}, sent ${k4.sent}; ${(await asked()) - q4c} requests`,
      'a notice; false, false, false, false; 0', k4.line.who === '' && k4.line.kind === 'notice' && /looks like a key/.test(k4.line.words) && !k4.kept && !k4.shown && !k4.tape && !k4.sent && k4.box === '' && (await asked()) === q4c);

    // ---- 5. a reply that fails its checks (a word not of 1912, a figure he was not given): asked once more, then the floor
    const q5 = await asked();
    await type('Mr Murdoch, how is she?');
    await answers('the second attempt');
    const f5 = await b.ev(`(() => { const r = TitanicApp.minds.transport().requests, T = TitanicApp.minds.tape().slice(-1)[0], L = TitanicApp.crew.lines(), li = document.querySelector('#crewTalk li:last-child');
      return { n: r.length, again: r[r.length - 1].changing.split('\\n').pop(), attempts: T.attempts.map(a => a.check ? a.check.faults.join(', ') : a.read && a.read.why), end: T.end, line: L[L.length - 1], floor: li ? li.dataset.floor : null, tip: li ? li.title : '' }; })()`);
    row('5. a reply that fails a check is asked for once more, its fault named', `${f5.n - q5} requests; "${f5.again.slice(0, 70)}..."`, '2; YOUR LAST ANSWER COULD NOT BE USED: ...',
      f5.n === q5 + 2 && /^YOUR LAST ANSWER COULD NOT BE USED: /.test(f5.again) && /figure 37/.test(f5.again) && /"Okay"/.test(f5.again));
    row('  failing again, the authored line is his, not marked as imagined; the tape holds both attempts', `"${f5.line.who}: ${f5.line.words}" (imagined ${f5.line.imagined}, floor ${f5.floor}); ${f5.attempts.map(a => '[' + a + ']').join(' ')}; ${f5.end}`,
      'Mr Murdoch: I couldn\'t say, sir.; [number: 37, world: Okay] twice; none', f5.line.who === 'Mr Murdoch' && f5.line.words === 'I couldn\'t say, sir.' && f5.line.imagined === false && f5.floor === '1'
      && f5.attempts.length === 2 && f5.attempts.every(a => /number: 37/.test(a) && /world: Okay/.test(a)) && f5.end === 'none'
      // and the line's own note says that words were written for him and struck out, and why
      && /written for him twice and not shown/.test(f5.tip) && /number: 37/.test(f5.tip));

    // ---- 6. men out of reach: Mr Andrews before his estimate, Mr Boxhall gone forward on his own (the readers' own times)
    const q6 = await asked();
    await type('Mr Andrews, how long has she got?');
    const a6 = await last(1);
    await type('Mr Boxhall, what did you see?');
    const b6 = await last(1);
    const row6 = await b.ev(`(() => { const r = TitanicApp.minds.reach(), btn = (s) => document.querySelector('#mindsWho button[data-seat="' + s + '"]');
      return { andrews: { out: btn('andrews').classList.contains('minds-out'), where: btn('andrews').dataset.where }, boxhall: { out: btn('boxhall').classList.contains('minds-out'), where: btn('boxhall').dataset.where },
        line: document.getElementById('mindsWhere').textContent, reach: [r.andrews.in, r.boxhall.in], chosen: TitanicApp.minds.chosen() }; })()`);
    row('6. a man out of reach is not asked: the talk says where he is, as a notice nobody says', `${(await asked()) - q6} requests; "${a6[0].words}" (${a6[0].kind}); "${b6[0].words}" (${b6[0].kind})`,
      '0; Mr Andrews is not on the bridge.; Mr Boxhall has gone forward to look.', (await asked()) === q6 && a6[0].who === '' && a6[0].kind === 'notice' && a6[0].words === 'Mr Andrews is not on the bridge.'
      && b6[0].who === '' && b6[0].kind === 'notice' && b6[0].words === 'Mr Boxhall has gone forward to look.' && row6.chosen === 'murdoch');
    row('  the row of names says where each is', `andrews ${row6.andrews.out ? 'out' : 'IN'}: "${row6.andrews.where}"; boxhall ${row6.boxhall.out ? 'out' : 'IN'}: "${row6.boxhall.where}"`, 'both out, each with where he is',
      row6.andrews.out && row6.boxhall.out && row6.andrews.where === a6[0].words && row6.boxhall.where === b6[0].words && row6.line.indexOf(a6[0].words) >= 0 && row6.line.indexOf(b6[0].words) >= 0 && !row6.reach[0] && !row6.reach[1]);

    // ---- 7. the limit: the transport's limit reached, no request is made and the notice says so
    await b.ev('(() => { const T = TitanicApp.minds.transport(); return T.set({ limits: { questions: T.options.used.questions } }).then(() => TitanicApp.minds.refresh()).then(() => true); })()');
    const q7 = await asked();
    await type('Mr Murdoch, anything more?');
    const l7 = await b.ev(`({ line: TitanicApp.crew.lines().slice(-1)[0], toast: document.getElementById('toast').textContent, awaited: TitanicApp.minds.awaited().length })`);
    row('7. past the limit no request is made, and the notice says so (in the talk, by nobody, and as the page\'s notice)', `${(await asked()) - q7} requests; "${l7.line.words}" (${l7.line.kind})`, '0; The crew\'s minds: this run\'s limit is reached ...',
      (await asked()) === q7 && l7.line.who === '' && l7.line.kind === 'notice' && /limit is reached/.test(l7.line.words) && l7.toast === l7.line.words && l7.awaited === 0);
    await b.ev('(() => { const T = TitanicApp.minds.transport(); return T.set({ limits: { questions: 200 } }).then(() => TitanicApp.minds.refresh()).then(() => true); })()');

    // ---- 7b. the bridge speaks (stage C): switched on by a real click, the next report a man brings to the bridge is
    // given unasked in his own words (on the 1912 night: Mr Boxhall, back from forward, nine minutes after the touch)
    const c0 = await b.ev(`({ was: TitanicApp.minds.speaks(), n: TitanicApp.state.sim.reports.feed.length })`);
    await b.clickSel('#mindsSpeaks');
    await b.ev('TitanicApp.state.speed = 4');
    await go();
    await holdWhen(`sim.reports.feed.length > ${c0.n} && sim.reports.feed[sim.reports.feed.length - 1].ch === 'runner'`, 'a report brought to the bridge by a man', 900000);
    const c1 = await b.ev(`(() => { const F = TitanicApp.state.sim.reports.feed, e = F[F.length - 1], T = TitanicApp.minds.tape().filter(t => t.kind === 'report'), r = TitanicApp.minds.transport().requests;
      return { on: TitanicApp.minds.speaks(), who: e.who, words: e.words, turns: T.length, last: T[T.length - 1] || null, cue: (r[r.length - 1].changing || '').split('\\n').slice(-2)[0], awaited: TitanicApp.minds.awaited(), pace: TitanicApp.pace() }; })()`);
    await answers('his words for the report');
    const c2 = await b.ev(`(() => { const L = TitanicApp.crew.lines(), l = L[L.length - 1], li = document.querySelector('#crewTalk li:last-child'), T = TitanicApp.minds.tape().filter(t => t.kind === 'report'); return { line: l, mark: li && li.querySelector('.crew-mark') ? li.querySelector('.crew-mark').textContent : null, end: T[T.length - 1].end }; })()`);
    // (the pace is printed, not held to a figure: the reports' own part may hold it a few seconds for a report brought;
    // that this part asks for no hold is tools/minds_part_tests.js's row)
    row('7b. "They speak up unasked" is on by default (switched off for the rows above); switched on again by a real click, the next report a man brings is asked of him with no question typed',
      `by default ${speaks0.d} (kept: ${speaks0.kept}); off for the rows: ${!c0.was}; on: ${c1.on}; "${String(c1.words).slice(0, 40)}" (${c1.who}) -> ${c1.last ? c1.last.seat : 'NOBODY'}; awaited ${c1.awaited.join()}; pace ${c1.pace}`, 'true (kept: null); off; on; the Fourth Officer\'s report -> boxhall; awaited',
      speaks0.d === true && speaks0.kept === null && c0.was === false && c1.on === true && c1.who === 'The Fourth Officer' && !!c1.last && c1.last.seat === 'boxhall' && /^YOU HAVE JUST COME TO THE CAPTAIN WITH THIS: /.test(c1.cue) && c1.cue.indexOf(c1.words) > 0 && c1.awaited.indexOf('boxhall') >= 0);
    row('  his words come as his own line in the talk, marked as imagined', `"${c2.line.who}: ${c2.line.words}" (${c2.mark}); ${c2.end}`, 'Mr Boxhall, the report in his words; imagined; said',
      c2.line.who === 'Mr Boxhall' && c2.line.imagined === true && c2.line.kind === 'mind' && c2.mark === 'imagined' && c2.end === 'said' && c2.line.words === c1.words.replace(/[.!?]+$/, '') + ', sir.');
    await b.clickSel('#mindsSpeaks');
    await b.ev('TitanicApp.state.playing = false; TitanicApp.state.speed = 30');

    // ---- 8 (part). a key typed in its field (the review of stage A: none ever was): read once, the field cleared at once,
    // passed to the transport, and nowhere in the page or its storage. Then: nothing of the part on the stage, and its
    // storage holds its two settings and nothing else
    const KEY8 = 'test-key-0123456789-not-a-secret';
    await b.clickSel('#mindsKey');
    await b.page.send('Input.insertText', { text: KEY8 });
    const typed8 = await b.ev('document.getElementById("mindsKey").value.length');
    await b.clickSel('#mindsKeySave');
    await b.ev('TitanicApp.minds.refresh().then(() => true)');
    await settle(50);
    const key8 = await b.ev(`(() => { const K = ${JSON.stringify(KEY8)}, k = document.getElementById('mindsKey'); return { field: k.type + ':' + k.value.length, has: TitanicApp.minds.status().hasKey, note: document.getElementById('mindsKeyNote').textContent,
      inPage: document.documentElement.outerHTML.indexOf(K) >= 0, stored: Object.keys(localStorage).some(x => String(localStorage.getItem(x)).indexOf(K) >= 0) || Object.keys(sessionStorage).some(x => String(sessionStorage.getItem(x)).indexOf(K) >= 0),
      status: JSON.stringify(TitanicApp.minds.status()).indexOf(K) >= 0, talk: JSON.stringify(TitanicApp.crew.lines()).indexOf(K) >= 0 }; })()`);
    row('8. a key typed in its field goes once to the transport: the field is cleared at once, and the key is nowhere in the page, its status or its storage', `typed ${typed8} characters; then the field ${key8.field}; a key kept: ${key8.has}; in the page ${key8.inPage}, stored ${key8.stored}, in the status ${key8.status}, in the talk ${key8.talk}`,
      KEY8.length + '; password:0; true; false, false, false, false', typed8 === KEY8.length && key8.field === 'password:0' && key8.has === true && /^A key is kept/.test(key8.note) && !key8.inPage && !key8.stored && !key8.status && !key8.talk);
    const st8 = await b.ev(`(() => { const all = [...document.querySelectorAll('[id^="minds"], .minds-who, .minds-offer, .minds-fold')]; return { onStage: all.filter(e => e.closest('#stage')).length, inSec: all.filter(e => e.closest('#crewSec')).length, n: all.length,
      keys: Object.keys(localStorage).filter(k => /minds/.test(k)).sort(), key: (() => { const k = document.getElementById('mindsKey'); return k ? k.type + ':' + k.value.length : null; })() }; })()`);
    row('  nothing of the part on the stage: all of it in the order line\'s section; its storage, its three settings and no other', `${st8.onStage} on the stage, ${st8.inSec} of ${st8.n} in the section; ${st8.keys.join(', ')}; key field ${st8.key}`,
      '0; all; titanic.minds.act, titanic.minds.seat, titanic.minds.speaks; password:0', st8.onStage === 0 && st8.inSec === st8.n && st8.n > 10 && st8.keys.join() === 'titanic.minds.act,titanic.minds.seat,titanic.minds.speaks' && st8.key === 'password:0');
    await picture('minds-section.png');

    // ---- 3 (end). the link of the night replays it, with no transport: the same orders at the same steps, one fingerprint
    await go();
    await holdWhen('true', 'a step to stand on');
    const mine = await b.ev(`(() => { const A = TitanicApp, s = A.state.sim; return { link: A.nightEnd.link(), k: s.night.k, fp: TitanicNight.fingerprint(s), log: s.night.log.map(o => ({ k: o.k, type: o.type, value: o.value, arg: o.arg })) }; })()`);
    const hash = mine.link.slice(mine.link.indexOf('#'));
    await b.open(hash, OPEN);
    const opened = await b.ev('({ opened: TitanicApp.nightEnd.opened, mode: TitanicApp.state.night.mode, hash: location.hash, transport: TitanicApp.minds.transport() !== null, tape: TitanicApp.minds.tape().length })');
    // (row 7b took the watch nine minutes past the touch: the replay runs there at thirty times her pace once the ice is
    // passed, and is given the page's time for it; at her own pace it ran out of this row's bound on its first run)
    await b.ev(`TitanicApp.state.warp = ${WARP}; TitanicApp.state.speed = 30`);
    await holdWhen(`sim.night.k >= ${mine.k}`, 'the replay to reach the same step', 900000);
    const again = await b.ev(`(() => { const s = TitanicApp.state.sim; return { k: s.night.k, fp: TitanicNight.fingerprint(s), log: s.night.log.map(o => ({ k: o.k, type: o.type, value: o.value, arg: o.arg })) }; })()`);
    // the orders his answers gave: half astern (offered, then given) and stop (on his word), after the question of row 2
    const minds = mine.log.filter(o => o.k >= k2 && o.type === 'telegraph' && (o.value === 'half astern' || o.value === 'stop')).length;
    row('  the link of the night replays it with no transport: the same orders at the same steps, one fingerprint', `${opened.opened}, ${opened.mode}, transport ${opened.transport}; step ${again.k}: ${again.fp}; ${again.log.length} orders (${minds} from his answers)`,
      `replay; step ${mine.k}: ${mine.fp}; ${mine.log.length} orders`, opened.opened === 'replay' && opened.mode === 'replay' && !opened.transport && opened.tape === 0 && opened.hash === hash + CLOCK
      && again.k === mine.k && again.fp === mine.fp && seen(again.log) === seen(mine.log) && minds === 2);

    // ---- 8. the page's clock rules still hold (the part reads no wall clock); no error in the console
    const ck = spawnSync(process.execPath, [path.join(__dirname, 'clock_tests.js')], { encoding: 'utf8' });
    const ckLast = (ck.stdout || '').trim().split(/\r?\n/).pop();
    row('8. tools/clock_tests.js still passes with the part (no wall clock read, no timer of its own)', ckLast, 'PASS: all 3 rows', ck.status === 0 && /^PASS/.test(ckLast));
    row('  no error in the page\'s console through all of it', b.errors.length ? b.errors.slice(0, 3).join(' | ') : 'none', 'none', b.errors.length === 0);
    console.log(fails ? `FAIL: ${fails} row(s)` : `PASS: all ${rows.length} rows`);
  } catch (e) {
    fails++; console.log('FAIL the test could not finish: ' + e.message); if (b.errors.length) console.log('page errors: ' + b.errors.slice(0, 5).join(' | '));
  } finally {
    await b.close();
    process.exit(fails ? 1 : 0);
  }
})();
