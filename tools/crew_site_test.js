// The spoken bridge, step 1: the order line (site/parts/86_crew.js, its words site/parts/85_crew_words.js) in a real
// browser (headless Edge or Chrome), with nothing beyond Node.
//   node tools/crew_site_test.js [dist] [screenshot dir] [--real]
// docs/DESIGN_spoken_bridge_v1_2026-11-23.md, section 6, the second list:
//   1. the 1912 drill TYPED in the order line, each order on the step tools/night_site_test.js clicks it: the night's own
//      damage, and the page's watch and Node's replay of the page's log the same
//   2. a typed order is in the watch's log on that step with its value; the answer is shown and names her head's way
//   3. a refused order: the model's reason in the bridge's talk, and the refusal in the watch's log
//   4. with the part and nothing typed (the 1912 orders), the watch has the fingerprint of the model alone in the page
//   5. the link of a typed night replays it: the same orders at the same steps, one fingerprint
//   6. on a preset the line is disabled; while the line has the focus, a "d" types a d and does not move the wheel
//   7. the 1912 script's helm order is captioned in the bridge's words on its own step
//   8. no error in the console; the part puts nothing on the stage (what tools/layout_site_test.js measures);
//      tools/clock_tests.js still passes
// and the helm's convention: "modern" turns "hard a-starboard" into the rudder to starboard, kept in the page's storage.
// The orders are typed as a person types them: a real click on the line, the words through the browser's own text input
// (Input.insertText), then the Enter key. The page's clock is virtual (QC C-3, docs/DESIGN_virtual_clock_v1_1_2026-11-21.md):
// each page is opened with clock=test, so only this suite's passes move it (tools/cdp.js's vrun and vframes), and a busy
// machine changes how long the suite takes, never what it sees. Every order that must land on a step stops the page's clock
// on that step first (holdWhen, as tools/night_site_test.js does). --real runs it all on real time, for comparison.
'use strict';
const path = require('path');
const { spawnSync } = require('child_process');
const B = require('./cdp');
const C = require('../core/core.js');
const N = require('../core/night.js');
const REAL = process.argv.includes('--real'), argv = process.argv.slice(2).filter(a => a !== '--real');
const dist = path.resolve(argv[0] || path.join(__dirname, '..', 'dist'));
const shots = argv[1] ? path.resolve(argv[1]) : null;
const OPEN = { virtual: !REAL };                   // each page opened with its clock virtual (clock=test), unless --real
const CLOCK = REAL ? '' : '&clock=test';           // what open() adds to an address
const WARP = 6;                                    // the watch's real time until the ice is passed, multiplied (a test hook)
const rows = []; let fails = 0;
function row(what, value, ref, ok) { rows.push([what, value, ref, ok]); if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + what.padEnd(96) + ' ' + String(value).padEnd(60) + ' ' + ref); }
const seen = (log) => JSON.stringify(log.map(o => [o.k, o.type, o.value, o.arg === undefined ? null : o.arg]));

(async () => {
  const b = await B.launch({ dist });
  // the page's clock stopped on the first step where cond holds (page code on `sim`; tools/night_site_test.js). The hook is
  // registered after the part's own, so the part has seen that step. The page runs on its own passes until then
  const holdWhen = async (cond, what, ms) => {
    await b.ev(`(() => { const A = TitanicApp; window.__held = false; const f = A.on('step', (sim) => { if (${cond}) { A.state.playing = false; window.__held = true; A.off('step', f); } }); })()`);
    if (REAL) await b.waitFor('window.__held', ms || 180000, what);
    else await b.vrun('window.__held', { maxMs: ms || 180000, held: false, what });
  };
  const waitPage = (cond, ms, what) => (REAL ? b.waitFor(cond, ms, what) : b.vrun(cond, { maxMs: ms, held: false, what }));
  const settle = (ms) => (REAL ? B.sleep(ms) : b.vrun(null, { maxMs: ms, held: false }));
  const picture = async (name) => { if (!shots) return; if (!REAL) await b.vframes(1, { render: true }); await b.shot(path.join(shots, name)); };
  const go = () => b.ev('TitanicApp.state.playing = true');
  // a key as a person presses it (with its text, a key that types a character types it into the focused field)
  const press = async (key, code, vk, text) => {
    await b.page.send('Input.dispatchKeyEvent', Object.assign({ type: 'keyDown', key, code, windowsVirtualKeyCode: vk }, text ? { text, unmodifiedText: text } : {}));
    await b.page.send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: vk });
  };
  // an order typed: a real click on the line, the words as typed, Enter; then the orders it gives, seen in the watch's log
  const type = async (text, n, what) => {
    const n0 = await b.ev('TitanicApp.state.sim.night.log.length');
    await b.clickSel('#crewLine');
    await b.page.send('Input.insertText', { text });
    await press('Enter', 'Enter', 13);
    if (n) await waitPage(`TitanicApp.state.sim.night.log.length >= ${n0 + n}`, 5000, what || 'the typed order in the watch\'s log');
    return n0;
  };
  const talk = () => b.ev('TitanicApp.crew.lines()');
  const last = async (n) => (await talk()).slice(-(n || 1)).map(l => l.who + ': ' + l.words);
  const watchOf = () => b.ev(`(() => { const s = TitanicApp.state.sim, w = s.night, u = TitanicNight.summary(s); return { k: w.k, fp: u.fingerprint, kind: u.kind, area: u.area, clearance: u.clearance, bow: u.bow.crush, reaction: u.reaction,
    log: w.log.map(o => ({ k: o.k, type: o.type, value: o.value, arg: o.arg, refused: o.refused })), seed: w.spec.seed, kn: w.spec.speedKn }; })()`);
  const ship = C.buildShip();
  const replayed = (w) => N.summary(N.replay(ship, N.spec(w.seed, { speedKn: w.kn }), w.log.map(o => ({ k: o.k, type: o.type, value: o.value, arg: o.arg })), w.k));
  // equal to six digits, not to the bit: the hull form calls Math.pow, whose last bit differs between engines (README;
  // tools/night_site_test.js), so a browser's watch and Node's part in about the ninth digit of the damage
  const same = (w, r) => w.kind === r.kind && Math.abs(w.area - r.area) < 1e-6 * Math.max(1, r.area) && Math.abs(w.bow - r.bow.crush) < 1e-6 && (w.kind !== 'miss' || Math.abs(w.clearance - r.clearance) < 1e-6);
  // the night's own orders in Node: their steps and their damage
  const own = N.run(N.create(ship, N.spec(1912), { auto: true })), ownLog = own.night.log, ownSum = N.summary(own);
  try {
    // ---- 1 and 2. the 1912 drill, typed: "hard a-starboard" 20.5 s after the bells, "hard a-port" at the touch
    await b.open('#night=1912', OPEN);
    await b.ev(`TitanicApp.state.warp = ${WARP}`);
    // ---- 0. what a newcomer meets (the public release): the order line in a sentence, three orders to try, and where the
    // answers will come. A chip is clicked for real: it writes its words into the line and gives nothing
    const new0 = await b.ev(`(() => { const g = (id) => document.getElementById(id), shown = (e) => !!e && !e.hidden && getComputedStyle(e).display !== 'none';
      return { intro: shown(g('crewIntro')) && /needs no key and sends nothing anywhere/.test(g('crewIntro').textContent), chips: [...document.querySelectorAll('#crewTry button')].map(x => x.textContent), tries: shown(g('crewTry')),
        empty: shown(g('crewEmpty')), log: TitanicApp.state.sim.night.log.length }; })()`);
    await b.clickSel('#crewTry button[data-words="Stop"]');
    const new1 = await b.ev(`({ line: document.getElementById('crewLine').value, focused: document.activeElement === document.getElementById('crewLine'), log: TitanicApp.state.sim.night.log.length, talk: TitanicApp.crew.lines().length })`);
    await b.ev('document.getElementById("crewLine").value = ""; true');
    row('0. a newcomer\'s first view of the order line: what it is in a sentence, three orders to try, where the answers will come; a chip writes its words into the line and gives nothing',
      `intro ${new0.intro ? 'shown' : 'HIDDEN'}; try: ${new0.chips.join(' | ')}; "nothing said yet" ${new0.empty ? 'shown' : 'HIDDEN'}; a click on Stop wrote "${new1.line}" (focused ${new1.focused}), the log ${new1.log - new0.log} more`,
      'shown; Hard a-starboard | Stop | Close the watertight doors; shown; "Stop", 0 more', new0.intro && new0.tries && new0.chips.join('|') === 'Hard a-starboard|Stop|Close the watertight doors' && new0.empty && new1.line === 'Stop' && new1.focused && new1.log === new0.log && new1.talk === 0);
    const ui = await b.ev(`(() => { const s = document.getElementById('crewSec'), l = document.getElementById('crewLine'); return { here: !!s && !!s.closest('#panel') && !!s.closest('[data-pane="run"]'),
      after: !!s && s.previousElementSibling === document.getElementById('watchSec'), enabled: !!l && !l.disabled, placeholder: l ? l.placeholder : '', conv: TitanicApp.crew.convention(), onStage: document.querySelectorAll('#stage .crew, #stage #crewSec, #stage #crewLine').length }; })()`);
    row('on a watch: the order line in the Run tab, under the watch\'s own section, ready; nothing of it on the stage', `${ui.here ? 'in the panel\'s Run tab' : 'NOT IN THE RUN TAB'}${ui.after ? ', under the watch' : ''}; "${ui.placeholder}", ${ui.enabled ? 'enabled' : 'disabled'}; ${ui.conv}; ${ui.onStage} on the stage`,
      'the Run tab; "Give an order", enabled; 1912 (the default); 0', ui.here && ui.after && ui.enabled && ui.placeholder === 'Give an order' && ui.conv === '1912' && ui.onStage === 0);
    await holdWhen(`sim.night.tBells >= 0 && sim.t - sim.night.tBells >= 20.5 - 1e-9`, 'the step of the order');
    const kOrder = await b.ev('TitanicApp.state.sim.night.k');
    await type('Hard a-starboard', 1);
    const o1 = await b.ev(`(() => { const L = TitanicApp.state.sim.night.log, o = L[L.length - 1]; return { o, k: TitanicApp.state.sim.night.k, toast: document.getElementById('toast').textContent, line: document.getElementById('crewLine').value }; })()`);
    const said1 = await last(2);
    row('2. typed on that step, the order is in the watch\'s log on it with its value; the quartermaster\'s answer names her head\'s way',
      `${o1.o.type} ${o1.o.value} at step ${o1.o.k} (held on ${kOrder}); "${said1.join('" / "')}"`, `helm -40 at step ${kOrder} (the 1912 orders give it at ${ownLog[0].k}); "You: Hard a-starboard" / "The quartermaster: Hard a-starboard, sir. Her head goes to port."`,
      o1.o.type === 'helm' && o1.o.value === -40 && o1.o.k === kOrder && kOrder === ownLog[0].k && said1[0] === 'You: Hard a-starboard' && said1[1] === 'The quartermaster: Hard a-starboard, sir. Her head goes to port.' && o1.line === '');
    row('  the answer is also the page\'s own notice, which the stage places', `"${o1.toast}"`, '"The quartermaster: Hard a-starboard, sir. Her head goes to port."', o1.toast === 'The quartermaster: Hard a-starboard, sir. Her head goes to port.');
    await go();
    await holdWhen('sim.night.tTouch >= 0 || sim.night.tClear >= 0', 'the touch');
    const kTouch = await b.ev('TitanicApp.state.sim.night.k');
    await type('Hard a-port.', 1);
    await go();
    await holdWhen('sim.night.tClear >= 0', 'the end of the encounter');
    const w = await watchOf(), r = replayed(w);
    // the night's own orders (helm -40 at the order's step, reversed at the touch; the stop falls after the ice is passed),
    // run by the model alone in this page's engine to the same step: the typed night must be that night, to the bit
    const ownFp = await b.ev(`(() => { const NN = TitanicNight, m = NN.create(TitanicCore.buildShip(), NN.spec(1912), { auto: true, readers: false }); while (m.night.k < ${w.k}) NN.step(m); return NN.fingerprint(m); })()`);
    await picture('crew-drill-typed.png');
    row('1. the 1912 drill typed (each order on the step the clicked drill gives it): the night\'s own damage and fingerprint', `${w.kind}, ${w.area.toFixed(6)} m2, the order ${w.reaction.toFixed(2)} s after the bells; orders at steps ${w.log.map(o => o.k).join(', ')}; ${w.fp} at step ${w.k}`,
      `holed, ${ownSum.area.toFixed(6)} m2 as the 1912 orders give; steps ${ownLog[0].k}, ${ownLog[1].k}; the 1912 orders in this page: ${ownFp}`, w.kind === 'holed' && Math.abs(w.area - ownSum.area) < 1e-6 && Math.abs(w.reaction - 20.5) < 1e-9 && w.log.length === 2 && w.log[0].k === ownLog[0].k && w.log[1].k === ownLog[1].k && kTouch === ownLog[1].k && w.log[1].value === 40 && w.fp === ownFp);
    row('  the page and Node agree on that watch, replayed in Node from the page\'s log', `page ${w.fp}, Node ${r.fingerprint}; ${w.area.toFixed(9)} against ${r.area.toFixed(9)} m2`, 'the same outcome; the same fingerprint when the two engines\' maths agree', same(w, r));

    // ---- 3. a refused order: boiler room 1 has no pump of its own (core/systems.js pumpOrder)
    await type('start the pumps in boiler room one', 1);
    const ref = await b.ev(`(() => { const L = TitanicApp.state.sim.night.log; return L[L.length - 1]; })()`);
    const said3 = await last(1);
    row('3. a refused order: the model\'s own reason in the bridge\'s talk, and the refusal in the watch\'s log', `log: ${ref.type} ${ref.value} ${ref.arg}, refused "${ref.refused}"; talk: "${said3[0]}"`,
      'pump 9 own, refused with the model\'s reason; the junior officer gives it, the engine room\'s by telephone', ref.type === 'pump' && ref.value === 9 && ref.arg === 'own' && typeof ref.refused === 'string' && ref.refused.length > 0
      && said3[0] === 'The junior officer: The engine room, by telephone: ' + ref.refused + '.');
    // the up arrow brings back the last order
    await b.clickSel('#crewLine');
    await press('ArrowUp', 'ArrowUp', 38);
    const back = await b.ev(`document.getElementById('crewLine').value`);
    await press('Escape', 'Escape', 27);
    row('  the up arrow brings back the last order given', `"${back}"`, '"start the pumps in boiler room one"', back === 'start the pumps in boiler room one');

    // ---- 5. the link of the typed night replays it
    await go();
    await holdWhen('true', 'a step to stand on');
    const mine = await b.ev(`(() => { const A = TitanicApp, s = A.state.sim; return { link: A.nightEnd.link(), k: s.night.k, fp: TitanicNight.fingerprint(s), log: s.night.log.map(o => ({ k: o.k, type: o.type, value: o.value, arg: o.arg })) }; })()`);
    const hash = mine.link.slice(mine.link.indexOf('#'));
    await b.open(hash, OPEN);
    const opened = await b.ev('({ opened: TitanicApp.nightEnd.opened, mode: TitanicApp.state.night.mode, hash: location.hash })');
    await b.ev(`TitanicApp.state.warp = ${WARP}`);
    await holdWhen(`sim.night.k >= ${mine.k}`, 'the replay to reach the same step');
    const again = await b.ev(`(() => { const s = TitanicApp.state.sim; return { k: s.night.k, fp: TitanicNight.fingerprint(s), log: s.night.log.map(o => ({ k: o.k, type: o.type, value: o.value, arg: o.arg })), refused: s.night.log.filter(o => o.refused).length }; })()`);
    row('5. the link of the typed night replays it: the same orders at the same steps, one fingerprint', `${opened.opened}, ${opened.mode}; step ${again.k}: ${again.fp}; ${again.log.length} orders, ${again.refused} refused again`,
      `replay; step ${mine.k}: ${mine.fp}; ${mine.log.length} orders`, opened.opened === 'replay' && opened.mode === 'replay' && again.k === mine.k && again.fp === mine.fp && seen(again.log) === seen(mine.log) && again.refused === 1 && opened.hash === hash + CLOCK);
    const cap5 = (await talk()).filter(l => l.kind === 'script').map(l => l.words);
    row('  the replayed orders are captioned in the bridge\'s words, given by the officer of the watch', cap5.join(' / '), 'Hard a-starboard! / Hard a-port! / Start the pumps in boiler room one!',
      cap5.join(' / ') === 'Hard a-starboard! / Hard a-port! / Start the pumps in boiler room one!');

    // ---- 7 and 4. the 1912 orders (a real click): the script's helm order captioned on its step; nothing typed, the
    // watch's fingerprint is the model's alone in the page
    await b.open('#night=1912', OPEN);
    await b.click('bAuto');
    await waitPage('TitanicApp.state.night.mode === "auto" && TitanicApp.state.sim.night.k < 20', 10000, 'the 1912 orders');
    await b.ev(`TitanicApp.state.warp = ${WARP}`);
    await holdWhen('sim.night.log.length >= 1', 'the script\'s first order');
    const cap = await b.ev(`(() => { const s = TitanicApp.state.sim, L = TitanicApp.crew.lines(); return { line: L[L.length - 1], k: s.night.k, e: s.night.log[0], t: TitanicApp.clockOf(s.t) }; })()`);
    row('7. the 1912 script\'s helm order, captioned in the bridge\'s words on its own step', `${cap.line ? cap.line.who + ': ' + cap.line.words + ' (' + cap.line.kind + ', ' + cap.line.t + ')' : 'no line'}; log: helm ${cap.e.value} at step ${cap.e.k}, the clock held on ${cap.k}`,
      `The officer of the watch: Hard a-starboard! (script, ${cap.t}); helm -40 at step ${ownLog[0].k}`, !!cap.line && cap.line.who === 'The officer of the watch' && cap.line.words === 'Hard a-starboard!' && cap.line.kind === 'script' && cap.line.t === cap.t && cap.e.value === -40 && cap.e.k === ownLog[0].k && cap.k === cap.e.k + 1);
    await go();
    await holdWhen('sim.night.tClear >= 0', 'the end of the encounter');
    const pg = await b.ev(`(() => { const s = TitanicApp.state.sim, k = s.night.k, NN = TitanicNight, m = NN.create(TitanicCore.buildShip(), NN.spec(1912), { auto: true, readers: false });
      while (m.night.k < k) NN.step(m); return { k, fp: NN.fingerprint(s), alone: NN.fingerprint(m), typed: TitanicApp.crew.lines().filter(l => l.kind === 'you').length }; })()`);
    const nodeAt = (() => { const m = N.create(ship, N.spec(1912), { auto: true }); while (m.night.k < pg.k) N.step(m); return N.fingerprint(m); })();
    row('4. with the part and nothing typed, the 1912 orders\' watch has the fingerprint of the model alone in the page', `step ${pg.k}: ${pg.fp}; nothing typed (${pg.typed} lines of yours)`, `the model alone in the page: ${pg.alone}, to the bit (Node: ${nodeAt})`, pg.fp === pg.alone && pg.typed === 0);
    // a typed order takes the watch over, as the wheel does: the bridge's talk and the notice both say so (the page's own
    // "You have the bridge" would be covered by the answer's notice)
    await type('Stop', 1);
    const tk = await b.ev(`({ mode: TitanicApp.state.night.mode, toast: document.getElementById('toast').textContent, lines: TitanicApp.crew.lines().slice(-3).map(l => l.kind + ': ' + l.words) })`);
    row('  a typed order takes the watch over, as the wheel does: the talk and the notice say so', `${tk.mode}; ${tk.lines.join(' / ')}; notice "${tk.toast}"`, 'you; you: Stop / note: You have the bridge ... / yes: Stop, sir. The engine room answers.',
      tk.mode === 'you' && tk.lines[0] === 'you: Stop' && /^note: You have the bridge/.test(tk.lines[1]) && tk.lines[2] === 'yes: Stop, sir. The engine room answers.' && /^You have the bridge\. /.test(tk.toast) && /The engine room answers\.$/.test(tk.toast));

    // ---- 6. a preset: the line disabled; a watch: a "d" in the line types a d and does not move the wheel
    await b.open('#scenario=titanic', OPEN);
    await settle(300);
    const pre = await b.ev(`({ enabled: TitanicApp.crew.enabled(), disabled: document.getElementById('crewLine').disabled, why: TitanicApp.crew.why() })`);
    row('6. on a preset the line is disabled, and says why', `${pre.disabled ? 'disabled' : 'ENABLED'}: "${pre.why}"`, 'disabled: orders are given on a watch', pre.disabled && !pre.enabled && /on a watch/.test(pre.why));
    await b.open('#night=1912', OPEN);
    await settle(300);
    await b.clickSel('#crewLine');
    const k0 = await b.ev('({ del: TitanicApp.state.sim.mo.delCmd, n: TitanicApp.state.sim.night.log.length })');
    await press('d', 'KeyD', 68, 'd');
    await press('a', 'KeyA', 65, 'a');
    await press('ArrowLeft', 'ArrowLeft', 37);
    await settle(300);
    const k1 = await b.ev(`({ del: TitanicApp.state.sim.mo.delCmd, n: TitanicApp.state.sim.night.log.length, value: document.getElementById('crewLine').value, focus: document.activeElement && document.activeElement.id })`);
    await press('Escape', 'Escape', 27);
    row('  while the line has the focus, "d", "a" and the left arrow type or move in it, and do not move the wheel', `the line "${k1.value}" (focus ${k1.focus}); rudder ordered ${k0.del} -> ${k1.del}; orders ${k0.n} -> ${k1.n}`,
      'the line "da"; the rudder and the log unchanged', k1.value === 'da' && k1.focus === 'crewLine' && k1.del === k0.del && k1.n === k0.n);

    // ---- the convention: "modern" by a real click; "hard a-starboard" is then the rudder to starboard; kept; set back
    await b.clickSel('#crewConv button[data-conv="modern"]');
    const mod = await b.ev(`({ conv: TitanicApp.crew.convention(), kept: localStorage.getItem('titanic.crew.convention'), line: document.getElementById('crewConvLine').textContent })`);
    await type('hard a-starboard', 1);
    const om = await b.ev(`(() => { const L = TitanicApp.state.sim.night.log; return L[L.length - 1]; })()`);
    const saidM = await last(1);
    await b.clickSel('#crewConv button[data-conv="1912"]');
    const back1912 = await b.ev('TitanicApp.crew.convention()');
    row('the helm\'s convention: "modern" (a real click) makes "hard a-starboard" the rudder to starboard, and is kept', `${mod.conv}, kept "${mod.kept}"; helm ${om.value}; "${saidM[0]}"; back to ${back1912}`,
      'modern; helm +40; "The quartermaster: Hard to starboard, sir. Her head goes to starboard."', mod.conv === 'modern' && mod.kept === 'modern' && /starboard\.$/.test(mod.line) && om.type === 'helm' && om.value === 40
      && saidM[0] === 'The quartermaster: Hard to starboard, sir. Her head goes to starboard.' && back1912 === '1912');

    // ---- 8. the page's clock rules still hold (the part reads no wall clock); no error in the console
    // (once something has been said, the line "Nothing has been said yet" is gone)
    const said9 = await b.ev(`({ talk: TitanicApp.crew.lines().length, empty: getComputedStyle(document.getElementById('crewEmpty')).display })`);
    row('  once a line has been said, "Nothing has been said yet" is no longer shown', `${said9.talk} lines in the talk; the line's display: ${said9.empty}`, 'some lines; none', said9.talk > 0 && said9.empty === 'none');
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
