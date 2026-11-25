// Reports to the bridge in a real browser (headless Edge or Chrome), with nothing beyond Node: site/parts/60_reports.js
// over core/readers/reports.js, through the page's own controls.
//   node tools/reports_site_test.js [dist] [screenshot dir] [--real]
// Checks that the feed in the page is the model's, line for line; that "As the bridge knew it" covers every readout
// nobody on the bridge had and shows knowledge(sim) in their place, and that off the page is as before; that an order
// from the part's controls (a real click on a chosen step) is in the watch's log and its report comes after its delay;
// that the page's clock drops to her own pace when a report comes at 60 times and picks up again; that the watch's
// fingerprint in the page is the model's alone; that the controls fit on a phone; and that the console stays clean.
// The page's clock is virtual (QC C-3, docs/DESIGN_virtual_clock_v1_1_2026-11-21.md): each page is opened with clock=test,
// so only this suite's passes move it (tools/cdp.js's vrun and vframes, 1000/60 ms a pass), and a busy machine changes how
// long the suite takes, never what it sees. One section stays on real time, the reports' hold (section 3: the page's clock
// at her own pace for HOLD s, measured against real milliseconds, and the part's holding(), still on the wall clock: on
// tools/clock_tests.js's pending list for its lane): the page's clock is put back on real time for it. Where a row reads
// what the part paints at most every 125 ms of the wall clock (its knowledge and orders, the same pending list), the
// virtual run gives that wall time and then a few passes, the watch held. --real runs it all on real time, as before C-3.
'use strict';
const path = require('path');
const B = require('./cdp');
const C = require('../core/core.js');
const N = require('../core/night.js');
const RP = require('../core/readers/reports.js');
const REAL = process.argv.includes('--real'), argv = process.argv.slice(2).filter(a => a !== '--real');
const dist = path.resolve(argv[0] || path.join(__dirname, '..', 'dist'));
const shots = argv[1] ? path.resolve(argv[1]) : null;
const OPEN = { virtual: !REAL };                   // each page opened with its clock virtual (clock=test), unless --real
const rows = []; let fails = 0;
function row(what, value, ref, ok) { rows.push([what, value, ref, ok]); if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + what.padEnd(100) + ' ' + String(value).padEnd(64) + ' ' + ref); }
const shot = (b, name) => shots ? b.shot(path.join(shots, name)) : null;
const clockOf = (sp, t) => { const s = (((sp.clock0 + t) % 86400) + 86400) % 86400; let h = Math.floor(s / 3600); const m = Math.floor(s % 3600 / 60), ap = h >= 12 ? 'pm' : 'am'; h = h % 12; if (h === 0) h = 12; return h + ':' + String(m).padStart(2, '0') + ' ' + ap; };
// the elements the bridge's view must cover, and whether a person could read each now (displayed, visible, with a size)
const COVERED = ['sTrim', 'sList', 'sWater', 'sIn', 'sDraft', 'status', 'fcLine', 'profile', 'toast', 'watchText', 'logBody'];
const readable = `((id) => { let e = document.getElementById(id); if (!e) return null; const r = e.getBoundingClientRect(); if (!r.width || !r.height) return false;
  for (; e; e = e.parentElement) { const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0 && e.id !== 'toast') return false; } return true; })`;
// the scene's marks of the damage (site/app.js): the ice's marks on her plating (dentPts) and the markers of her openings
// (holeGroup): shown on a watch, hidden in the bridge's view. null when one is not found
const dentsShown = `(() => { const G = TitanicApp.shipGroup.children, d = G.find(o => o.isPoints && o.material && o.material.depthTest === false && o.material.vertexColors),
  h = G.find(o => o.isGroup && o.children.some(c => c.isMesh && c.geometry && c.geometry.type === 'SphereGeometry' && c.material && c.material.depthTest === false));
  return d && h ? (d.visible ? 'marks shown' : 'marks hidden') + ', ' + (h.visible ? 'openings shown' : 'openings hidden') : 'not found'; })()`;

(async () => {
  const b = await B.launch({ dist });
  let live = REAL;                                 // the page's clock on real time now: always with --real, else in section 3 only
  const holdWhen = async (cond, what, ms) => {     // the page's clock stopped on the first step where cond holds (tools/night_site_test.js)
    await b.ev(`(() => { const A = TitanicApp; window.__held = false; const f = A.on('step', (sim) => { if (${cond}) { A.state.playing = false; window.__held = true; A.off('step', f); } }); })()`);
    if (live) await b.waitFor('window.__held', ms || 240000, what);
    else await b.vrun('window.__held', { maxMs: ms || 240000, held: false, what });
  };
  // a page expression waited for on the page's own passes (live, on real time); at once if it already holds
  const waitPage = (cond, ms, what) => (live ? b.waitFor(cond, ms, what) : b.vrun(cond, { maxMs: ms, held: false, what }));
  // before a read of what the page paints: live, a sleep of ms as before; under the virtual clock, enough of the wall clock
  // for the part's 125 ms throttle to lapse, then three of the page's passes to paint
  const refresh = async (ms) => { if (live) { await B.sleep(ms); return; } await B.sleep(Math.min(ms, 300)); await b.vframes(3); };
  const sp = N.spec(1912), ship = C.buildShip();
  try {
    // ---- 1. the 1912 orders on the bridge (a real click); the section and its defaults
    await b.open('#night=1912', OPEN);
    await b.click('bAuto');
    await waitPage('TitanicApp.state.night.mode === "auto" && TitanicApp.state.sim.night.k < 20', 15000, 'the 1912 orders');
    await b.ev('TitanicApp.state.warp = 6');
    const s0 = await b.ev(`({ sec: !document.getElementById('rpSec').hidden, n: document.querySelectorAll('#rpFeed li').length, view: TitanicApp.reports.view(), slow: TitanicApp.reports.slow(), cls: document.documentElement.classList.contains('rp-bridge'), buttons: document.querySelectorAll('#rpSec button').length })`);
    row('a watch: the section "Reports to the bridge" on the Run tab, its feed empty, the bridge\'s view off, the pace setting on', JSON.stringify(s0), 'shown; 0 lines; off; on; 7 orders', s0.sec && s0.n === 0 && !s0.view && s0.slow && !s0.cls && s0.buttons === 7);

    // ---- 2. an order from the part's controls, a real click on the step two minutes after the touch
    await holdWhen('sim.night.tTouch >= 0 && sim.t - sim.night.tTouch >= 120 - 1e-9', 'two minutes after the touch');
    const whose = `({ mode: TitanicApp.state.night.mode, replay: !document.getElementById('bReplay').disabled, over: TitanicApp.state.night.over })`;
    const at = await b.ev('({ k: TitanicApp.state.sim.night.k, t: TitanicApp.state.sim.t, tTouch: TitanicApp.state.sim.night.tTouch })'), w0 = await b.ev(whose);
    await b.clickSel('#rpLook-mailroom');
    await waitPage('TitanicApp.state.sim.night.log.some(o => o.type === "report:look")', 8000, 'the order in the watch\'s log');
    await refresh(150);                            // the orders' buttons painted (the watch held)
    const lg = await b.ev(`TitanicApp.state.sim.night.log.filter(o => o.type.indexOf('report:') === 0).map(o => ({ k: o.k, type: o.type, value: o.value }))`);
    const dis = await b.ev(`document.getElementById('rpLook-mailroom').disabled`), w1 = await b.ev(whose);
    row('"Mail room" clicked on the step 2 min after the touch: the order is in the watch\'s log at that step; the button waits for him', JSON.stringify(lg) + '; button disabled ' + dis, `[{"k":${at.k},"type":"report:look","value":"mailroom"}]; true`, lg.length === 1 && lg[0].k === at.k && lg[0].value === 'mailroom' && dis === true);
    row('  ... and, given after the ice on the 1912 orders, it makes the watch the player\'s and enables "Replay my watch" (S2, Y8)', `mode ${w0.mode} -> ${w1.mode}; Replay ${w0.replay ? 'enabled' : 'disabled'} -> ${w1.replay ? 'enabled' : 'disabled'}`, 'auto -> you; disabled -> enabled',
      w0.over && w0.mode === 'auto' && !w0.replay && w1.mode === 'you' && w1.replay);
    await b.ev('TitanicApp.state.playing = true');
    await waitPage('TitanicApp.state.sim.night.tClear >= 0', 180000, 'the end of the encounter');
    await b.ev('TitanicApp.state.speed = 60');
    await waitPage(`TitanicApp.state.sim.reports.feed.some(e => e.by === 'back from the mail room')`, 300000, 'his report from the mail room');
    const rep = await b.ev(`(() => { const e = TitanicApp.state.sim.reports.feed.find(e => e.by === 'back from the mail room'); return { t: e.t, tFact: e.tFact, who: e.who, words: e.words, inPage: [...document.querySelectorAll('#rpFeed li')].some(li => li.querySelector('.rp-w').textContent === e.words) }; })()`);
    row('  ... his report comes 7 min after the order (PARTS.mailroom), from what he saw at 3.5 min: the mail room dry, the water below it', `+${((rep.t - at.t) / 60).toFixed(3)} min, seen +${((rep.tFact - at.t) / 60).toFixed(2)}: ${rep.who}: "${rep.words}"; in the page's feed ${rep.inPage}`, '+7.000 min; "The mail room is dry."; true', Math.abs(rep.t - at.t - 420) < 1e-6 && rep.tFact - at.t >= 210 && rep.tFact - at.t < 210.5 && rep.words === 'The mail room is dry.' && rep.inPage);

    // ---- 3. the night comes to the player: a report at 60 times (chosen with a real click) holds the clock at her own pace
    // for a few seconds; a second report inside the hold starts it again, so the hold ends HOLD s after the last of them.
    // On real time (QC C-3: the suite's one real-time section): the page's clock back on the wall clock for it, going on
    // from where its own time was, and virtual again after it
    if (!REAL) { await b.virtual(false); live = true; }
    await b.clickSel('#speedSeg button[data-speed="60"]');
    await b.ev(`(() => { const A = TitanicApp; window.__pace = []; window.__arr = []; const n0 = A.state.sim.reports.feed.length; let seen = n0;
      A.on('step', (sim) => { const F = sim.reports.feed; for (; seen < F.length; seen++) if (F[seen].kind !== 'routine' && F[seen].ch !== 'instrument') window.__arr.push({ t: sim.t, at: performance.now(), words: F[seen].words }); });
      const f = () => { const s = A.state; window.__pace.push([performance.now(), s.sim.t, A.pace(), A.reports.holding()]); if (window.__pace.length < 4000) requestAnimationFrame(f); }; requestAnimationFrame(f); })()`);
    await b.waitFor('window.__arr.length > 0', 300000, 'a report at 60 times');
    await B.sleep((4 + 6) * 1000);
    const pc = await b.ev('({ arr: window.__arr, pace: window.__pace, hold: TitanicApp.reports.HOLD, chosen: TitanicApp.reports.chosenSpeed(), pressed: document.querySelector("#speedSeg button[aria-pressed=true]").dataset.speed })');
    const rate = (a, z) => { const s = pc.pace.filter(p => p[0] >= a && p[0] <= z); return s.length < 2 ? null : (s[s.length - 1][1] - s[0][1]) / ((s[s.length - 1][0] - s[0][0]) / 1000); };
    const H = pc.hold * 1000, a0 = pc.arr[0].at;
    let end = a0 + H; for (const a of pc.arr) if (a.at < end) end = Math.max(end, a.at + H);   // the hold, restarted by reports inside it
    const inHold = pc.arr.filter(a => a.at < end);
    // after the hold: the next two seconds (at 60x the next report on the night is minutes of her time, seconds of ours, away)
    const before = rate(a0 - 3000, a0 - 50), during = rate(a0 + 300, end - 300), after = rate(end + 300, end + 2300);
    const spd = pc.pace.filter(p => p[0] > a0 + 100 && p[0] < end - 100).map(p => p[2]), spdAfter = pc.pace.filter(p => p[0] > end + 200 && p[0] < end + 2000).map(p => p[2]);
    row('a report at 60 times (chosen with a click): the page\'s clock drops to her own pace for ' + pc.hold + ' s from the last report, then picks up again', `${inHold.length} report(s) in the hold ("${inHold.map(a => a.words.slice(0, 24)).join('", "')}"), ${((end - a0) / 1000).toFixed(2)} s; before ${before === null ? 'n/a' : before.toFixed(1)}x, holding ${during === null ? 'n/a' : during.toFixed(2)}x (the page's pace ${[...new Set(spd)].join(',')}), after ${after === null ? 'n/a' : after.toFixed(1)}x (${[...new Set(spdAfter)].join(',')}); chosen ${pc.chosen}, button ${pc.pressed}`,
      'holding about 1x (the page\'s pace 1: TitanicApp.holdPace); after it well above (60x, less what a loaded machine can step); the choice and its button kept: 60',
      during !== null && during <= 1.6 && spd.length > 0 && spd.every(v => v === 1) && after !== null && after > 4 * Math.max(1, during) && spdAfter.length > 0 && spdAfter.every(v => v === 60) && pc.chosen === 60 && pc.pressed === '60');
    if (!REAL) { await b.virtual(true); live = false; }

    // ---- 4. the feed in the page, line for line the model's (in the page, and replayed in Node from the page's log)
    await b.ev('TitanicApp.reports.setSlow(false); TitanicApp.state.speed = 240');
    // held on the first step twenty-six minutes after the touch, by a step hook, not on a pass or a poll after it: section 3
    // left the watch at a step that turns on the machine's load, so only the hook stands every run on the same step (and
    // gives the same feed, knowledge and fingerprint below)
    await holdWhen('sim.t - sim.night.tTouch >= 26 * 60', 'twenty-six minutes after the touch (the builder\'s man has spoken)', 600000);
    await refresh(400);
    const pg = await b.ev(`(() => { const A = TitanicApp, s = A.state.sim; return { lines: A.reports.lines(), model: TitanicReports.feed(s).map(e => ({ n: e.n, t: A.clockOf(e.t), who: e.who + ', ' + e.by, words: e.words })), k: s.night.k, fp: TitanicNight.fingerprint(s), log: s.night.log.map(o => ({ k: o.k, type: o.type, value: o.value, arg: o.arg })) }; })()`);
    const sameInPage = JSON.stringify(pg.lines) === JSON.stringify(pg.model);
    const nodeSim = N.replay(ship, sp, pg.log, pg.k), nodeFeed = RP.feed(nodeSim).map(e => ({ n: e.n, t: clockOf(sp, e.t), who: e.who + ', ' + e.by, words: e.words }));
    const sameInNode = JSON.stringify(nodeFeed) === JSON.stringify(pg.model);
    row('on the 1912 orders the feed in the page is the model\'s, line for line (to T 26: the time, who brought it and how, the words)', `${pg.lines.length} lines in the page, ${pg.model.length} in the model: ${sameInPage ? 'the same' : 'DIFFERENT'}; first "${(pg.lines[0] || {}).words}"`, 'the same, newest first on the page', sameInPage && pg.lines.length >= 10);
    row('  ... and the page\'s log replayed in Node gives the same feed, word for word', `${nodeFeed.length} lines: ${sameInNode ? 'the same' : 'DIFFERENT: ' + JSON.stringify(nodeFeed.find((e, i) => JSON.stringify(e) !== JSON.stringify(pg.model[i])))}; Node ${N.fingerprint(nodeSim)}, page ${pg.fp}`, 'the same words and times (the two engines\' maths agree to the foot and the minute)', sameInNode);
    if (shots) { await b.ev(`document.getElementById('rpSec').scrollIntoView({ block: 'start' })`); await refresh(500); if (!live) await b.vframes(1, { render: true }); await shot(b, 'reports-feed-desktop.png'); }

    // ---- 5. "As the bridge knew it" (a real click): the readouts nobody on the bridge had are covered; knowledge(sim) shown
    const r0 = await b.ev(`(() => { const f = ${readable}; return { read: ${JSON.stringify(COVERED)}.map(id => [id, f(id)]), xray: TitanicApp.state.xray }; })()`);
    await b.clickSel('#rpView');
    await refresh(700);
    const cov = await b.ev(`(() => { const f = ${readable}; return { read: ${JSON.stringify(COVERED)}.map(id => [id, f(id)]), mine: ['rpTrim', 'rpList', 'rpKnown', 'rpStatus', 'rpLine', 'rpStrip', 'rpWatchText'].map(id => [id, f(id)]), xray: TitanicApp.state.xray, view: TitanicApp.reports.view(), dents: ${dentsShown} }; })()`);
    const readNow = cov.read.filter(r => r[1]).map(r => r[0]);
    row('"As the bridge knew it" (a real click): none of the covered readouts can be read; the bridge\'s own are shown; X-ray off; the scene\'s marks of the damage hidden', `readable: ${readNow.length ? readNow.join(', ') : 'none'} of ${COVERED.length}; shown ${cov.mine.filter(r => r[1]).length} of ${cov.mine.length}; X-ray ${cov.xray}; ${cov.dents}`, 'none; all 7; false; marks hidden, openings hidden (before: ' + r0.read.filter(r => r[1]).length + ' readable, X-ray ' + r0.xray + ')',
      cov.view && readNow.length === 0 && cov.mine.every(r => r[1]) && cov.xray === false && cov.dents === 'marks hidden, openings hidden' && r0.read.filter(r => r[1] && r[0] !== 'toast').length >= COVERED.length - 2);
    const kn = await b.ev(`(() => { const s = TitanicApp.state.sim, K = TitanicReports.knowledge(s);
      return { trim: [document.getElementById('rpTrim').textContent, K.trim.words], list: [document.getElementById('rpList').textContent, K.list.words],
        cells: [...document.querySelectorAll('#rpStrip .rp-cell')].map(c => [+c.dataset.k, c.dataset.state]).sort((a, b) => a[0] - b[0]).map(c => c[1]), zones: K.zones.map(z => z.state),
        estimate: K.estimate ? K.estimate.words : null, line: document.getElementById('rpLine').textContent, pill: document.getElementById('rpStatus').textContent }; })()`);
    row('  ... and what it shows is knowledge(sim): the compartments as reported, the commutator, the trim in words, the estimate', `trim "${kn.trim[0]}", list "${kn.list[0]}", cells ${kn.cells.join(' ')}; "${kn.pill}"; "${kn.line.slice(0, 70)}"`, `"${kn.trim[1]}", "${kn.list[1]}", ${kn.zones.join(' ')}`,
      kn.trim[0] === kn.trim[1] && kn.list[0] === kn.list[1] && JSON.stringify(kn.cells) === JSON.stringify(kn.zones) && (!kn.estimate || kn.line.indexOf(kn.estimate.charAt(0).toLowerCase() + kn.estimate.slice(1)) >= 0));
    if (shots) { await b.ev(`TitanicApp.setView('quarter')`); if (live) await B.sleep(1500); else await b.vrun(null, { maxMs: 1500, held: false }); if (!live) await b.vframes(1, { render: true }); await shot(b, 'reports-bridge-view-desktop.png'); }
    // D78 (C-4's step 2): in the view the page's own notice is covered, so the part says every one in its own; in the page
    // only. The clock is stopped (section 4's hold), so the reader's state, its feed above all, must be the same with the
    // notice as without it, at once and after the frames that follow
    const RL = 'A notice of the page, said in the bridge\'s view';
    const rl0 = await b.ev(`(() => { const A = TitanicApp, s = A.state.sim; window.__rl = { feed: JSON.stringify(s.reports.feed), all: JSON.stringify(s.reports), k: s.night.k };
      A.toast(${JSON.stringify(RL)}); const t = document.getElementById('rpToast');
      return { text: t.textContent, on: t.classList.contains('on'), feed: JSON.stringify(s.reports.feed) === window.__rl.feed, n: s.reports.feed.length, held: !A.state.playing }; })()`);
    await refresh(400);
    const rl1 = await b.ev(`(() => { const s = TitanicApp.state.sim, t = document.getElementById('rpToast'), r = t.getBoundingClientRect();
      return { feed: JSON.stringify(s.reports.feed) === window.__rl.feed, all: JSON.stringify(s.reports) === window.__rl.all, k: s.night.k === window.__rl.k, shown: r.width > 0 && r.height > 0 }; })()`);
    row('  ... and in the view a notice of the page is said in its own notice (D78, C-4), in the page only: sim.reports and its feed the same with it as without',
      `"${rl0.text}"${rl0.on ? ' shown' : ' NOT SHOWN'} (on the screen ${rl1.shown}); the feed (${rl0.n} lines) the same at once ${rl0.feed}, after the frames ${rl1.feed}; sim.reports the same ${rl1.all}; the clock held ${rl0.held && rl1.k}`,
      'the notice\'s words, shown; true, true; true; true',
      rl0.text === RL && rl0.on && rl1.shown && rl0.feed && rl1.feed && rl1.all && rl0.held && rl1.k);
    await b.clickSel('#rpView');
    await refresh(700);
    const off = await b.ev(`(() => { const f = ${readable}; return { read: ${JSON.stringify(COVERED)}.map(id => [id, f(id)]), mine: ['rpTrim', 'rpList', 'rpKnown', 'rpStatus', 'rpLine', 'rpStrip', 'rpWatchText'].map(id => [id, f(id)]), xray: TitanicApp.state.xray, cls: document.documentElement.classList.contains('rp-bridge'), dents: ${dentsShown} }; })()`);
    // the page's own notice left out: since C-4's step 2 it is on the stage only while a notice is on (the row above gave one)
    const noToast = (L) => JSON.stringify(L.filter(r => r[0] !== 'toast').map(r => r[1]));
    const same = noToast(off.read) === noToast(r0.read);
    row('  ... off again: the page is as before (the same readouts readable, the bridge\'s hidden, X-ray back on, the scene\'s marks shown)', `${off.read.filter(r => r[1]).length} readable as before: ${same}; the bridge's shown: ${off.mine.filter(r => r[1]).length}; X-ray ${off.xray}; ${off.dents}`, `${r0.read.filter(r => r[1]).length}, true; 0; ${r0.xray}; marks shown, openings shown`, same && off.mine.every(r => !r[1]) && off.xray === r0.xray && !off.cls && off.dents === 'marks shown, openings shown');
    // QC C-5 (11-20): the view and the Night look each claim the marks of the page and neither undoes the other. The view
    // on, Night on, the view off: the night stays (X-ray is not put back over it) and the marks stay hidden (the night's
    // claim alone); Night off: the marks shown again. Real clicks throughout
    await b.clickSel('#rpView'); await refresh(700);
    await b.click('bNight'); await refresh(700);
    await b.clickSel('#rpView'); await refresh(700);
    const c1 = await b.ev(`({ night: !!(TitanicApp.nightScene && TitanicApp.nightScene.on), xray: TitanicApp.state.xray, claims: TitanicApp.marks.claims(), dents: ${dentsShown} })`);
    await b.click('bNight'); await refresh(700);
    const c2 = await b.ev(`({ night: !!(TitanicApp.nightScene && TitanicApp.nightScene.on), claims: TitanicApp.marks.claims(), dents: ${dentsShown} })`);
    if (!(await b.ev('TitanicApp.state.xray'))) { await b.click('bXray'); await refresh(500); }   // X-ray on again, as the rows below had it
    row('  ... the view and the Night look together (QC C-5): the view on, Night on, the view off: the night stays, the marks stay hidden; Night off: the marks shown',
      `the view off, the night on: night ${c1.night}, X-ray ${c1.xray}, claims ${JSON.stringify(c1.claims)}, ${c1.dents}; the night off: night ${c2.night}, claims ${JSON.stringify(c2.claims)}, ${c2.dents}`,
      'true, false, the night\'s alone, hidden; false, none, shown',
      c1.night && !c1.xray && c1.claims.openings.join() === 'night' && c1.claims.dents.join() === 'night' && c1.dents === 'marks hidden, openings hidden' && !c2.night && c2.claims.openings.length === 0 && c2.claims.dents.length === 0 && c2.dents === 'marks shown, openings shown');

    // ---- 6. the watch's fingerprint in the page is the model's alone (no reader, no part, no viewer), to the same step
    const bare = await b.ev(`(() => { const N = TitanicNight, s = N.create(TitanicCore.buildShip(), N.spec(1912), { auto: true, readers: false }); while (s.night.k < ${pg.k}) N.step(s); return N.fingerprint(s); })()`);
    const pgFp = await b.ev('TitanicNight.fingerprint(TitanicApp.state.sim)');
    row('the watch\'s fingerprint in the page (with the reader, its order and the part) is the model\'s alone, run in the page without the reader', `page ${pgFp} at step ${pg.k}; the model alone ${bare}`, 'equal, bit for bit', pgFp === bare && pgFp === pg.fp);

    // ---- 7. a phone (390 x 780, touch): the controls fit and can be pressed; the bridge's view on the small stage
    await b.page.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 780, deviceScaleFactor: 2, mobile: true });
    await b.page.send('Emulation.setTouchEmulationEnabled', { enabled: true });
    await b.open('#night=1912', OPEN);
    await b.clickSel('.tab[data-tab="run"]');
    await b.waitFor(`document.getElementById('panel').classList.contains('open')`, 8000, 'the sheet open');
    await B.sleep(600);                            // the sheet slides open (.22 s, a CSS transition, on real time either way): click once it lies still
    await b.click('bAuto');
    await waitPage('TitanicApp.state.night.mode === "auto"', 30000, 'the 1912 orders on the phone');
    await b.ev('TitanicApp.state.warp = 6');
    await b.ev(`document.getElementById('rpSec').scrollIntoView({ block: 'start' })`);
    await refresh(500);
    const ph = await b.ev(`(() => { const ids = ['rpLook-forward', 'rpLook-mailroom', 'rpLook-boilers', 'rpLook-engines', 'rpLook-aft', 'rpSound', 'rpAsk', 'rpView', 'rpSlow'];
      const r = ids.map(id => { const e = document.getElementById(id), q = (e.type === 'checkbox' ? e.parentElement : e).getBoundingClientRect(); return [id, Math.round(q.left), Math.round(q.right), Math.round(q.height)]; });
      return { device: TitanicApp.device(), w: innerWidth, r, scroll: document.documentElement.scrollWidth }; })()`);
    const bad = ph.r.filter(x => x[1] < 0 || x[2] > ph.w || (x[0].indexOf('rp') === 0 && x[0] !== 'rpView' && x[0] !== 'rpSlow' && x[3] < 40));
    if (shots) { if (!live) await b.vframes(1, { render: true }); await shot(b, 'reports-phone-sheet.png'); }
    row('on a phone (390 x 780) the orders and the switches fit the width, the buttons at least 40 px tall', `${ph.device}; ${ph.r.length} controls; outside or short: ${bad.length ? JSON.stringify(bad) : 'none'}; page ${ph.scroll} px wide`, 'phone; none; 390', ph.device === 'phone' && bad.length === 0 && ph.scroll <= ph.w);
    await b.clickSel('#rpView');
    await b.clickSel('#sheetClose');
    await waitPage('TitanicApp.state.sim.night.tTouch >= 0 && TitanicApp.state.sim.t - TitanicApp.state.sim.night.tTouch >= 20', 240000, 'the touch on the phone');
    await refresh(800);
    const pv = await b.ev(`(() => { const f = ${readable}, q = (id) => document.getElementById(id).getBoundingClientRect(); const st = document.getElementById('rpStrip').getBoundingClientRect(), ro = q('readout');
      return { cls: document.documentElement.classList.contains('rp-bridge'), read: ${JSON.stringify(COVERED)}.filter(id => f(id)), strip: [Math.round(st.left), Math.round(st.right), Math.round(st.height)], readout: Math.round(ro.right), w: innerWidth }; })()`);
    if (shots) { if (!live) await b.vframes(1, { render: true }); await shot(b, 'reports-phone-bridge-view.png'); }
    row('  ... and the bridge\'s view on the phone\'s stage: nothing covered can be read; the compartments row inside the screen', `covered readable: ${pv.read.length ? pv.read.join(', ') : 'none'}; row ${pv.strip.join(',')} in ${pv.w}; readout to ${pv.readout}`, 'none; inside 390', pv.cls && pv.read.length === 0 && pv.strip[0] >= 0 && pv.strip[1] <= pv.w && pv.strip[2] > 30 && pv.readout <= pv.w);
    await b.clickSel('.tab[data-tab="run"]');
    await b.clickSel('#rpView');                   // left off for whoever opens the page next (the setting is kept per viewer)

    row('no error in the page\'s console through all of it', b.errors.length ? b.errors.slice(0, 3).join(' | ') : 'none', 'none', b.errors.length === 0);
    console.log(fails ? `FAIL: ${fails} row(s)` : `PASS: all ${rows.length} rows`);
  } catch (e) {
    fails++; console.log('FAIL the test could not finish (after ' + rows.length + ' rows): ' + e.message); if (b.errors.length) console.log('page errors: ' + b.errors.slice(0, 5).join(' | '));
  } finally {
    await b.close();
    process.exit(fails ? 1 : 0);
  }
})();
