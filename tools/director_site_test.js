// The director (site/parts/80_director.js) in a real browser (headless Edge or Chrome), with nothing beyond Node.
//   node tools/director_site_test.js [dist] [screenshot dir] [--real]
// The page's clock is virtual (QC C-3, docs/DESIGN_virtual_clock_v1_1_2026-11-21.md): the page is opened with clock=test,
// so only this suite's own passes move it (tools/cdp.js's vrun and vframes, 1000/60 ms a pass), and a busy machine changes
// how long the suite takes, never what it sees. One row stays in real time, a hold's seconds (row 3), so that the wall
// clock is still shown to drive a hold; row 3b is a hold in the page's time, exactly; row 3c shows that a caption fades on
// time with the watch paused (the clock is the frames', not the watch's). --real runs every row on real time, as before
// C-3 (about eight minutes: the last minutes are held), for comparison.
// Through the page's own controls (real clicks) it checks that the switch turns the director on and off; that on the
// 1912 orders the cuts at the bells and at the touch fall on those very steps with the views the list names; that a
// cut's hold is her own pace and ends; that no cut falls in a hold it does not outweigh nor within the list's least gap;
// that the part feeds nothing back (the 1912 orders watched through it have the model's own fingerprint); that the same
// watch gives the same cuts at the same steps; that a view button pressed by the player turns it off and no cut
// follows; that at a very fast pace the rows not marked fast are passed over; and that the caption covers neither the
// readouts, the Bridge nor the end card, on a desktop and on a phone (where the layout takes its room for them, it is
// hidden by design: C-4's step 2).
// Every read and click that must land on a step stops the page's clock on that step first (hold), as
// tools/night_site_test.js does. With a screenshot directory it takes the lane's pictures.
'use strict';
const path = require('path');
const B = require('./cdp');
const REAL = process.argv.includes('--real'), argv = process.argv.slice(2).filter(a => a !== '--real');
const dist = path.resolve(argv[0] || path.join(__dirname, '..', 'dist'));
const shots = argv[1] ? path.resolve(argv[1]) : null;
const OPEN = { virtual: !REAL };                   // each page opened with its clock virtual (clock=test), unless --real
let live = REAL;                                   // the page's clock on real time now: always with --real, else in row 3 only
const rows = []; let fails = 0;
function row(what, value, ref, ok) { rows.push([what, value, ref, ok]); if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + what.padEnd(100) + ' ' + String(value).padEnd(64) + ' ' + ref); }
const shot = (b, name) => (shots ? b.shot(path.join(shots, name)) : null);
const SPEED = 240;                                 // the player's pace after the ice: fast, not very fast (every row cuts)
const WARP = 6;                                    // the watch's real time at the ice, multiplied (a test hook)

// the page's clock run to the step a condition first holds and stopped on it (a part's 'step' hook, registered after the
// director's, so the director has made that step's cut); the hook is in place before the clock runs. The page runs on
// its own passes (vrun) with the bound in its own time, or, live, on real time with the bound on the wall clock
const until = async (b, cond, what, ms) => {
  await b.ev(`(() => { const A = TitanicApp; window.__held = false; const sim = A.state.sim;
    if (sim && sim.foundered && (${cond})) { window.__held = true; return; }      // she has gone: no step will come
    const f = A.on('step', (sim) => { if (${cond}) { A.state.playing = false; window.__held = true; A.off('step', f); } }); A.state.playing = true; })()`);
  if (live) await b.waitFor('window.__held', ms || 300000, what);
  else await b.vrun('window.__held', { maxMs: ms || 300000, held: false, what });
};
// a page expression waited for: on the page's own passes (a card shown on a pass after the flag), or live on real time
const waitPage = (b, cond, ms, what) => (live ? b.waitFor(cond, ms, what) : b.vrun(cond, { maxMs: ms, held: false, what }));
const run = (b) => b.ev('TitanicApp.state.playing = true');
const frames = (b, n) => (live ? b.ev(`new Promise(r => { let k = ${n || 4}; const f = () => (--k > 0 ? requestAnimationFrame(f) : r(true)); requestAnimationFrame(f); })`) : b.vframes(n || 4));
// the page let play for ms of its own time (live: of real time), stopped, and its picture taken, drawn on its last pass
const play = async (b, ms, pic) => {
  await run(b);
  if (live) await B.sleep(ms); else await b.vrun(null, { maxMs: ms, held: false });
  await b.ev('TitanicApp.state.playing = false');
  if (!live && pic && shots) await b.vframes(1, { render: true });
  await shot(b, pic);
};
// a click that must take: click, look, and click again if it did not (the choice is the same however often it is made).
// Under the virtual clock the look runs the page's own passes (up to 1 s of its time), because whether a control takes a
// click can wait on a pass: the pace's buttons stay locked until the readouts' next refresh after the ice (120 ms of the
// page's time), and no pass runs while the suite waits on the wall clock
const clickUntil = async (b, sel, cond, what) => {
  for (let n = 1; ; n++) {
    await b.clickSel(sel);
    if (live) { try { await b.waitFor(cond, 3000, what); return n; } catch (e) { if (n >= 5) throw e; } }
    else if ((await b.vrun(cond, { maxMs: 1000, held: false })).done) return n;
    else if (n >= 5) throw new Error('the page\'s time ran out waiting for ' + what);
  }
};
// where things stand on the screen, and the caption against the readouts, the Bridge and the end card
const LAYOUT = `(() => { const A = TitanicApp, d = A.director.caption(), r = (id) => { const e = document.getElementById(id); if (!e || e.hidden) return null; const q = e.getBoundingClientRect(); return q.width > 0 ? [q.left, q.top, q.right, q.bottom] : null; };
  return { cap: d, readout: r('readout'), bridge: r('bridge'), card: r('endCard'), device: A.device(), w: innerWidth, h: innerHeight }; })()`;
const meets = (a, b) => !!(a && b && a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1]);
const px = (q) => (q ? q.map(Math.round).join(',') : 'none');
function clearOf(L) { return !meets(L.cap.rect, L.readout) && !meets(L.cap.rect, L.bridge) && !meets(L.cap.rect, L.card); }
// a caption the layout has hidden is not a fault: it is the last of the overlays and gives way where the musts need its
// room (C-4's step 2; the stage's aside)
const sayL = (name, L) => `${name}: caption ${L.cap.shown ? px(L.cap.rect) : (L.cap.gaveWay ? 'hidden, by design (its room given to the musts)' : 'not shown')}; readouts ${px(L.readout)}, Bridge ${px(L.bridge)}, card ${px(L.card)}`;
const lastCut = (b) => b.ev('(() => { const c = TitanicApp.director.cuts(); return c[c.length - 1] || null; })()');
// the eye the list names for a row's n-th occurrence, with the Night look on or off (a list of eyes is taken in turn)
function named(r, n, night) {
  const i = Math.max(0, (n || 1) - (r.nth === 'later' ? 2 : 1)), pick = (v) => (Array.isArray(v) ? v[i % v.length] : v);
  return pick(night || !r.day ? r.view : r.day);
}
// a cut as the same watch must give it again: its step, trigger and view (whether it was a beat, the eye unchanged, also
// depends on the eye the page had before the run began)
const CUTLINE = (c) => `${c.step} ${c.trigger}${c.n > 1 ? ' ' + c.n : ''} ${c.view}`;

// The rules, checked again from the list's own numbers (not from what the director says of itself): the player's time
// re-counted step by step (her own pace at the ice and in a hold, the player's pace otherwise), each cut's hold and gap
// laid down as the list gives them; a cut may not fall within the last cut's gap, nor in a hold unless it is heavier
function rules(cuts, list, kClear, kSpeed, speed, dt, END, MIN) {
  const R = {}; for (const r of list) R[r.id] = r;
  let vt = 0, k0 = cuts.length ? cuts[0].step : 0, hold = { to: -1, w: 0 }, gapTo = -Infinity, worst = 0;
  const bad = [];
  cuts.forEach((c, i) => {
    for (let j = k0 + 1; j <= c.step; j++) vt += dt / (j < kClear || j <= hold.to || j <= kSpeed ? 1 : speed);
    k0 = c.step;
    const r = R[c.trigger], w = r.weight;
    if (i > 0 && vt < gapTo - 1e-9) bad.push(`${c.trigger} at ${c.step}: within the gap`);
    if (i > 0 && c.step <= hold.to && !(w > hold.w)) bad.push(`${c.trigger} at ${c.step}: in a hold of weight ${hold.w}`);
    worst = Math.max(worst, Math.abs(vt - c.vt));
    const n = Math.round((r.hold === 'end' ? END : Math.max(r.hold, MIN, r.gap)) / dt);    // a hold is never shorter than the gap
    if (n > 0) hold = { to: Math.max(c.step <= hold.to ? hold.to : -1, c.step + n), w };
    else if (c.step <= hold.to) hold.w = w;
    gapTo = vt + Math.max(MIN, r.gap);
  });
  return { bad, worst };
}

(async () => {
  const b = await B.launch({ dist });
  try {
    const N = 'TitanicNight';
    // ---- 1. the switch: on (a real click) cuts to where the night stands; off again (a real click). This watch runs on to
    // her foundering in 4, through the cuts of her last minutes and her lights, which come after the break's onset: since
    // G12's cascade (D98) the default watch is handed over there, so it is the what-if handed over at her flag
    // (handover=flag: today's watch to the bit)
    await b.open('#night=1912&handover=flag', OPEN);
    await until(b, 'sim.night.k >= 3', 'the watch under way');
    const s0 = await b.ev(`({ on: TitanicApp.director.on(), pressed: document.getElementById('bDirector').getAttribute('aria-pressed'), view: TitanicApp.state.view, k: TitanicApp.state.sim.night.k, next: document.getElementById('bDirector').nextElementSibling.id })`);
    await b.click('bDirector'); await frames(b, 2);
    const s1 = await b.ev(`({ on: TitanicApp.director.on(), pressed: document.getElementById('bDirector').getAttribute('aria-pressed'), view: TitanicApp.state.view, cuts: TitanicApp.director.cuts(), cap: TitanicApp.director.caption() })`);
    await b.click('bDirector'); await frames(b, 2);
    const s2 = await b.ev(`({ on: TitanicApp.director.on(), pressed: document.getElementById('bDirector').getAttribute('aria-pressed'), cap: TitanicApp.director.caption() })`);
    const c1 = s1.cuts[0] || {};
    row('the switch (real clicks): on, it cuts at once to where the night stands (before the bells: the Bridge), with a caption; off again',
      `${s0.on} -> ${s1.on} -> ${s2.on} (pressed ${s0.pressed}/${s1.pressed}/${s2.pressed}); cut ${c1.trigger} at step ${c1.step} (held ${s0.k}) to ${s1.view}; caption "${s1.cap.text}" then ${s2.cap.shown ? 'shown' : 'gone'}`,
      'false -> true -> false; on at the held step, Bridge; the caption gone with it',
      !s0.on && s1.on && !s2.on && s0.pressed === 'false' && s1.pressed === 'true' && s2.pressed === 'false' && s1.cuts.length === 1 && c1.trigger === 'on' && c1.step === s0.k && c1.view === 'bridge' && s1.view === 'bridge' && s1.cap.shown && !s2.cap.shown && s0.next === 'bXray');

    // ---- 2. the 1912 orders with the director on, in the Night look; the player's pace 240x after the ice
    await b.click('bNight');
    await b.click('bDirector');
    await b.click('bAuto');
    await b.waitFor('TitanicApp.state.night.mode === "auto" && TitanicApp.state.sim.night.k < 20', 10000, 'the 1912 orders');
    await until(b, 'sim.night.k >= 8', 'step 8');
    // the reports' own few seconds at her pace (site/parts/60_reports.js) off: the holds in this run are the director's
    if (await b.ev('document.getElementById("rpSlow").checked')) await clickUntil(b, '#rpSlow', '!document.getElementById("rpSlow").checked', 'the reports\' slowing off');
    const list = await b.ev('TitanicApp.director.list'), L = {}; for (const r of list) L[r.id] = r;
    const consts = await b.ev('({ FAST: TitanicApp.director.FAST, END: TitanicApp.director.END_HOLD, MIN: TitanicApp.director.MIN_GAP, dt: TitanicApp.state.sim.params.dt, night: TitanicApp.nightScene.on })');
    await b.ev(`TitanicApp.state.warp = ${WARP}`);
    await until(b, 'sim.night.tBells >= 0', 'the bells');
    const bells = await b.ev(`({ k: TitanicApp.state.sim.night.k, kB: Math.round(TitanicApp.state.sim.night.tBells / TitanicApp.state.sim.params.dt), view: TitanicApp.state.view })`);
    const cB = await lastCut(b), layB = await b.ev(LAYOUT);
    await play(b, 1500, 'director-1912-bells-nest.png');
    await until(b, 'sim.night.tTouch >= 0', 'the touch');
    const touch = await b.ev(`({ k: TitanicApp.state.sim.night.k, kT: Math.round(TitanicApp.state.sim.night.tTouch / TitanicApp.state.sim.params.dt), view: TitanicApp.state.view })`);
    const cT = await lastCut(b), layT = await b.ev(LAYOUT);
    await play(b, 1500, 'director-1912-touch.png');
    row('on the 1912 orders the cuts at the bells and at the touch fall on those very steps, with the views the list names',
      `bells: cut ${cB.trigger} at step ${cB.step} (the bells' step ${bells.kB}), ${cB.view}, the page on ${bells.view}; touch: cut ${cT.trigger} at ${cT.step} (step ${touch.kT}), ${cT.view}, the page on ${touch.view}`,
      `bells ${bells.kB} ${L.bells.view}; touch ${touch.kT} ${L.touch.view}`,
      cB.trigger === 'bells' && cB.step === bells.k && cB.step === bells.kB && cB.view === L.bells.view && bells.view === L.bells.view && cB.late === 0
      && cT.trigger === 'touch' && cT.step === touch.k && cT.step === touch.kT && cT.view === L.touch.view && touch.view === L.touch.view && cT.late === 0);
    // the player's pace, chosen on the step the ice is passed (the page locks its buttons until then)
    await until(b, 'sim.night.tClear >= 0', 'the ice passed');
    await frames(b, 4);
    await clickUntil(b, `#speedSeg button[data-speed="${SPEED}"]`, `TitanicApp.state.speed === ${SPEED}`, 'the pace chosen');
    const kSpeed = await b.ev('TitanicApp.state.sim.night.k');      // the steps after this one run at the player's pace

    // ---- 3. the hold: the first boat lowered, held at her own pace; the pace read on the step of the cut, and after. In
    // real time (QC C-3: the suite's one real-time row): the page's clock goes back to the wall clock for it, going on
    // from where its own time was, and is virtual again after it
    await until(b, 'TitanicApp.director.cuts().some(c => c.trigger === "boat")', 'the first boat lowered');
    const cBoat = await lastCut(b), layBoat = await b.ev(LAYOUT);
    if (!REAL) { await b.virtual(false); live = true; }
    const p0 = await b.ev('(() => { TitanicApp.state.playing = true; return { pace: TitanicApp.pace(), speed: TitanicApp.state.speed, k: TitanicApp.state.sim.night.k }; })()');
    const tHold0 = Date.now();
    await B.sleep(2500); await b.ev('TitanicApp.state.playing = false'); await shot(b, 'director-1912-first-boat.png');
    const pMid = await b.ev('(() => { TitanicApp.state.playing = true; return TitanicApp.pace(); })()');
    await until(b, `sim.night.k >= ${cBoat.holdTo + 1}`, 'the end of the hold');
    const held = { k: await b.ev('TitanicApp.state.sim.night.k'), s: (Date.now() - tHold0) / 1000 };
    await run(b);
    const tEnd = Date.now(); let p1 = 0;
    for (;;) { p1 = await b.ev('TitanicApp.pace()'); if (p1 === SPEED || Date.now() - tEnd > 4000) break; await B.sleep(100); }
    const after = (Date.now() - tEnd) / 1000;
    row('the hold is her own pace and ends: the first boat\'s cut holds the page at 1x (TitanicApp.pace()) for its steps, then the player\'s pace again',
      `cut ${cBoat.trigger} at step ${cBoat.step} to ${cBoat.view}, hold ${cBoat.hold} steps; pace ${p0.pace} at the cut, ${pMid} inside; ${held.k - cBoat.step} steps in ${held.s.toFixed(1)} s; then ${p1} ${after.toFixed(1)} s after its last step`,
      `1 inside the hold (${L.boat.hold} s), ${SPEED} after it within 1.5 s`,
      cBoat.view === named(L.boat, 1, consts.night) && p0.pace === 1 && p0.speed === SPEED && pMid === 1 && cBoat.hold === Math.round(L.boat.hold / consts.dt) && p1 === SPEED && after < 1.5 && held.s > 0.6 * L.boat.hold);
    if (!REAL) { await b.ev('TitanicApp.state.playing = false'); await b.virtual(true); live = false; }

    // ---- 4. on to her foundering: the cuts of the whole night, the rules, the fingerprint, the caption and the card. On
    // the way, under the virtual clock: the first later cut with a hold is timed in the page's own time (row 3b), and at
    // the next cut the watch is paused while the page's frames run on (row 3c)
    const pics = shots ? { rocket1: 'director-1912-rocket-1.png', rocket: 'director-1912-rocket-2.png', last: 'director-1912-last-minutes.png', lights: 'director-1912-lights-out.png' } : {};
    const PAGE_NOW = '({ t: TitanicApp.now(), k: TitanicApp.state.sim.night.k, cap: TitanicApp.director.caption().shown })';
    let r3b = null, r3c = null;
    for (;;) {
      const n0 = await b.ev('TitanicApp.director.cuts().length');
      await until(b, `TitanicApp.director.cuts().length > ${n0} || sim.foundered`, 'the next cut', 600000);
      const st = await b.ev('({ f: TitanicApp.state.sim.foundered, c: TitanicApp.director.cuts() })');
      if (st.f) break;
      const c = st.c[st.c.length - 1];
      let pic = pics[c.trigger];
      if (!REAL && !r3c && r3b && r3b.c.step !== c.step) {
        // 3c: the clock is the frames', not the watch's. The watch held on the cut's step; the page's frames run on 4.9 s,
        // then 0.6 s more (a caption stands 5 s and fades over 0.4 s)
        const s0 = await b.ev(PAGE_NOW);
        await b.vrun(null, { maxMs: 4900, held: false }); const s1 = await b.ev(PAGE_NOW);
        await b.vrun(null, { maxMs: 600, held: false }); const s2 = await b.ev(PAGE_NOW);
        r3c = { c, s0, s1, s2 }; pic = null;                // its picture, if any, waits for the next cut of its kind
      }
      if (!REAL && !r3b && c.hold > 0 && c.holdTo > c.step && c.trigger !== 'last') r3b = { c, s0: await b.ev(PAGE_NOW) };
      if (pic) { delete pics[c.trigger]; await play(b, /rocket/.test(c.trigger) ? 3300 : 2500, pic); }
      if (r3b && r3b.c.step === c.step && !r3b.s1) {
        // 3b: to the first step after the hold, then the pace with the clock let go
        await until(b, `sim.night.k >= ${c.holdTo + 1}`, 'the end of the timed hold');
        r3b.s1 = await b.ev(PAGE_NOW);
        r3b.pace = await b.ev('(() => { TitanicApp.state.playing = true; const p = TitanicApp.pace(); TitanicApp.state.playing = false; return p; })()');
      }
    }
    if (!REAL) {
      const fm = 1000 / 60, dtMs = consts.dt * 1000;
      if (r3b && r3b.s1) {
        const want = (r3b.c.holdTo - r3b.c.step) * dtMs, got = r3b.s1.t - r3b.s0.t;
        row('3b, under the page\'s own clock: a hold lasts its seconds of the page\'s time exactly, then the player\'s pace at once',
          `cut ${r3b.c.trigger} at step ${r3b.c.step}, hold ${r3b.c.holdTo - r3b.c.step} steps: step ${r3b.s1.k} came ${(got / 1000).toFixed(3)} s of the page's time after the cut (the hold: ${(want / 1000).toFixed(3)} s); the pace then ${r3b.pace}`,
          `${(want / 1000).toFixed(3)} s to within one frame (${fm.toFixed(1)} ms); ${SPEED}`,
          r3b.s1.k === r3b.c.holdTo + 1 && got >= want - 1 && got <= want + fm + 1 && r3b.pace === SPEED);
      } else row('3b, under the page\'s own clock: a hold lasts its seconds of the page\'s time exactly', 'no later cut with a hold before her foundering', 'one', false);
      if (r3c) {
        const { s0, s1, s2 } = r3c;
        row('3c, under the page\'s own clock: a caption fades on time with the watch paused (the clock is the frames\', not the watch\'s)',
          `cut ${r3c.c.trigger} at step ${r3c.c.step}: caption ${s0.cap ? 'shown' : 'not shown'} at the cut, ${s1.cap ? 'shown' : 'gone'} ${((s1.t - s0.t) / 1000).toFixed(2)} s later, ${s2.cap ? 'still shown' : 'gone'} at ${((s2.t - s0.t) / 1000).toFixed(2)} s; the watch at step ${s0.k}, ${s1.k}, ${s2.k}`,
          'shown, shown at 4.9 s, gone by 5.5 s; the same step throughout',
          s0.cap && s1.cap && !s2.cap && s0.k === s1.k && s1.k === s2.k && s0.k === r3c.c.step);
      } else row('3c, under the page\'s own clock: a caption fades on time with the watch paused', 'no cut after 3b\'s before her foundering', 'one', false);
    }
    const end = await b.ev(`(() => { const s = TitanicApp.state.sim, u = ${N}.summary(s); return { k: s.night.k, fp: u.fingerprint, t: s.t, clock: TitanicApp.clockOf(s.t), kClear: Math.round(s.night.tClear / s.params.dt), card: TitanicApp.nightEnd.shown(), view: TitanicApp.state.view, night: TitanicApp.nightScene.on }; })()`);
    const cuts1 = await b.ev('TitanicApp.director.cuts()');
    console.log('\nthe cuts of the 1912 orders (the Night look on, ' + SPEED + 'x after the ice): step, ship\'s time, trigger, view, hold');
    for (const c of cuts1) console.log('  ' + String(c.step).padStart(6) + '  ' + String(c.clock).padEnd(9) + ' ' + (c.trigger + (c.n > 1 ? ' ' + c.n : '')).padEnd(11) + ' ' + c.view.padEnd(8) + (c.beat ? ' (beat)' : '        ') + '  hold ' + (c.hold * consts.dt) + ' s' + (c.late ? ', ' + c.late + ' steps late' : '') + (c.interrupts ? ', into a lighter hold' : ''));
    console.log('');
    const allNamed = cuts1.every(c => c.trigger === 'on' || c.view === named(L[c.trigger], c.n, consts.night));
    const order = ['begins', 'bells', 'touch', 'grind', 'boat', 'rocket1', 'last', 'lights'].every(id => cuts1.some(c => c.trigger === id));
    row('the whole night: the rows of the list cut, each to the view the list names (the Night look on), and the end card is left alone',
      `${cuts1.length} cuts: ${cuts1.map(c => c.trigger + (c.n > 1 ? c.n : '')).join(' ')}; foundered at ${end.clock}, card "${end.card}"`,
      'begins, bells, touch, grind, the first boat, the first rocket, the last minutes, her lights among them; no cut at the end',
      allNamed && order && end.card === 'foundered' && cuts1[0].trigger === 'begins' && cuts1[0].step === 0 && cuts1[cuts1.length - 1].step < end.k);
    const ru = rules(cuts1, list, end.kClear, kSpeed, SPEED, consts.dt, consts.END, consts.MIN);
    row('no cut in a hold it does not outweigh, and none within the list\'s least gap (the player\'s time re-counted from the list)',
      ru.bad.length ? ru.bad.slice(0, 3).join('; ') : `${cuts1.length} cuts, all clear; the director's own count of the player's time within ${ru.worst.toExponential(1)} s`,
      'none; the counts agree', ru.bad.length === 0 && ru.worst < 1e-6);
    const bare = await b.ev(`(() => { const N = ${N}, s = N.create(TitanicCore.buildShip(), N.spec(1912), { auto: true, handover: 'flag' }); while (s.night.k < ${end.k}) N.step(s); return N.fingerprint(s); })()`);
    row('the part feeds nothing back: the 1912 orders watched with the director on have the model\'s own fingerprint, to her foundering',
      `page ${end.fp}, model alone ${bare}, at step ${end.k}`, 'equal, bit for bit', end.fp === bare);
    // the caption with the end card up: the director off and on (real clicks) puts one there
    await b.click('bDirector'); await b.click('bDirector'); await frames(b, 3);
    const layEnd = await b.ev(LAYOUT);
    await shot(b, 'director-1912-end-card.png');
    row('desktop (1400 x 860): the caption covers neither the readouts, nor the Bridge, nor the end card (at the bells, the touch, the first boat; the card up)',
      [sayL('bells', layB), sayL('touch', layT), sayL('boat', layBoat), sayL('end', layEnd)].join('; '),
      'no overlap; shown at the cuts',
      [layB, layT, layBoat, layEnd].every(clearOf) && layB.cap.shown && layT.cap.shown && layBoat.cap.shown && !!layEnd.card);

    // ---- 5. the same watch again: the same cuts at the same steps (to the third rocket); then the player takes the camera
    await b.click('bAuto');
    await b.waitFor('TitanicApp.state.night.mode === "auto" && TitanicApp.state.sim.night.k < 20', 10000, 'the 1912 orders again');
    await b.ev(`TitanicApp.state.warp = ${WARP}`);
    await until(b, 'sim.night.tClear >= 0', 'the ice passed again');
    await frames(b, 4);
    await clickUntil(b, `#speedSeg button[data-speed="${SPEED}"]`, `TitanicApp.state.speed === ${SPEED}`, 'the pace chosen');
    const r3 = cuts1.filter(c => c.trigger === 'rocket1' || c.trigger === 'rocket')[2];
    const K2 = r3 ? r3.step + 2 : cuts1[Math.min(8, cuts1.length - 1)].step + 2;
    await until(b, `sim.night.k >= ${K2}`, 'step ' + K2);
    const cuts2 = await b.ev('TitanicApp.director.cuts()');
    const a1 = cuts1.filter(c => c.step <= K2).map(CUTLINE), a2 = cuts2.map(CUTLINE);
    row('the same watch run twice gives the same cuts at the same steps (the 1912 orders again, to the third rocket)',
      a1.join('; ') + (a1.join('|') === a2.join('|') ? '' : '  AGAINST  ' + a2.join('; ')),
      `${a1.length} cuts, equal`, a1.length > 6 && a1.join('|') === a2.join('|'));
    // a view button pressed by the player (a real click on Plan), inside the third rocket's hold
    const pv = await b.ev('(() => { TitanicApp.state.playing = true; return TitanicApp.pace(); })()');
    await b.ev('TitanicApp.state.playing = false');
    await b.clickSel('[data-view="plan"]'); await frames(b, 2);
    const off = await b.ev(`({ on: TitanicApp.director.on(), pressed: document.getElementById('bDirector').getAttribute('aria-pressed'), view: TitanicApp.state.view, toast: document.getElementById('toast').textContent, n: TitanicApp.director.cuts().length, cap: TitanicApp.director.caption() })`);
    const pAfter = await b.ev('(() => { TitanicApp.state.playing = true; return TitanicApp.pace(); })()');
    const next = cuts1.find(c => c.step > K2 + 4);
    const K3 = next ? next.step + 40 : K2 + 2000;
    await until(b, `sim.night.k >= ${K3}`, 'step ' + K3);
    const later = await b.ev(`({ n: TitanicApp.director.cuts().length, view: TitanicApp.state.view, rockets: TitanicApp.state.sim.world.rockets.fired })`);
    row('a view button pressed by the player (a real click on Plan, inside a hold) turns it off, with a notice; no cut follows',
      `on ${off.on} (pressed ${off.pressed}), view ${off.view}; notice "${off.toast}"; pace ${pv} -> ${pAfter}; ${off.n} cuts, ${later.n} at step ${K3} (past run 1's ${next ? next.trigger + ' at ' + next.step : 'last'}), view ${later.view}`,
      'off; Plan; a notice; the hold released; no more cuts',
      !off.on && off.pressed === 'false' && off.view === 'plan' && /director is off/i.test(off.toast) && pv === 1 && pAfter === SPEED && later.n === off.n && later.view === 'plan' && !off.cap.shown);
    // a very fast pace: the director on again (a real click), then 900x (a real click), on past her forecastle
    await b.click('bDirector');
    await clickUntil(b, '#speedSeg button[data-speed="900"]', 'TitanicApp.state.speed === 900', 'the fastest pace');
    const fc = cuts1.find(c => c.trigger === 'fcastle'), K4 = (fc ? fc.step : K3 + 10000) + 40;
    await until(b, `sim.night.k >= ${K4}`, 'step ' + K4);
    const fast = await b.ev('({ cuts: TitanicApp.director.cuts(), passed: TitanicApp.director.passed() })');
    await b.click('bDirector');
    const was = cuts1.filter(c => c.step > K3 && c.step <= K4), tag = (c) => c.trigger + (c.n > 1 ? ' ' + c.n : '');
    const passedFast = fast.passed.filter(p => p.why === 'fast').map(tag);
    row('at a very fast pace (900x, a real click) the rows not marked fast are passed over (run 1, at 240x, cut them)',
      `run 1 cut here: ${was.map(tag).join(', ')}; at 900x: ${fast.cuts.map(tag).join(', ')}; passed over as not fast: ${passedFast.join(', ')}`,
      'the switch\'s cut only; each of run 1\'s passed over',
      fast.cuts.length === 1 && fast.cuts[0].trigger === 'on' && was.length >= 3 && was.every(c => !L[c.trigger].fast && passedFast.includes(tag(c))));

    // ---- 5b. a damage preset (the 1912 damage: no watch, the X-ray look): the shorter list, from the flooding itself
    await b.open('#scenario=titanic', OPEN);
    await until(b, 'sim.t >= 1', 'the preset under way');
    await b.click('bDirector');
    await b.clickSel('#scenCards .card[data-key="titanic"]');   // the preset's card: its run begins with the director on
    await b.waitFor('(() => { const c = TitanicApp.director.cuts()[0]; return !!c && c.trigger === "flooding" && c.step === 0; })()', 10000, 'the run begun again');
    await until(b, 'sim.t >= 1', 'the preset under way again');
    await clickUntil(b, `#speedSeg button[data-speed="${SPEED}"]`, `TitanicApp.state.speed === ${SPEED}`, 'the pace chosen');
    await until(b, 'sim.markT.fcastle >= 0 && sim.t >= sim.markT.fcastle + 10', 'her forecastle under', 300000);
    const pr = await b.ev(`({ cuts: TitanicApp.director.cuts(), xray: TitanicApp.state.xray, night: TitanicApp.nightScene.on, over: Array.from(TitanicApp.state.sim.overT).filter(t => t >= 0).length, view: TitanicApp.state.view })`);
    await b.click('bDirector');                     // off before her last minutes: their hold is the watch's row above
    const dayView = (c) => named(L[c.trigger], c.n, false);
    row('on a damage preset (no watch; the 1912 damage, X-ray) the list is the flooding\'s: the sea comes in, water over the bulkheads, her forecastle',
      pr.cuts.map(c => `${c.step} ${c.trigger}${c.n > 1 ? ' ' + c.n : ''} ${c.view}${c.beat ? ' (beat)' : ''}`).join('; ') + `; ${pr.over} bulkheads over by then`,
      'flooding at step 0, over1, over, fcastle; each to the list\'s view without the Night look',
      pr.xray && !pr.night && pr.cuts[0].trigger === 'flooding' && pr.cuts[0].step === 0 && ['over1', 'over', 'fcastle'].every(id => pr.cuts.some(c => c.trigger === id))
      && pr.cuts.every(c => c.view === dayView(c)) && pr.cuts.every(c => L[c.trigger].run !== 'watch'));

    // ---- 5c. G12's cascade (D98): the default watch is handed over at the break's onset. Her last minutes cut when the
    // onset check's ratio reaches the director's NEAR, before the break and before the water reaches the bridge; a cut as
    // she breaks, on the hand-over's own step; no cut for her lights, which burn at the onset. The 1912 orders, the
    // director on (a real click), the player's pace after the ice
    await b.open('#night=1912', OPEN);
    await b.click('bDirector');
    await b.click('bAuto');
    await b.waitFor('TitanicApp.state.night.mode === "auto" && TitanicApp.state.sim.night.k < 20', 10000, 'the 1912 orders (the default watch)');
    await b.ev(`TitanicApp.state.warp = ${WARP}`);
    await until(b, 'sim.night.tClear >= 0', 'the ice passed (the default watch)');
    await frames(b, 4);
    await clickUntil(b, `#speedSeg button[data-speed="${SPEED}"]`, `TitanicApp.state.speed === ${SPEED}`, 'the pace chosen (the default watch)');
    await until(b, 'TitanicApp.gone(sim)', 'the break (the default watch)', 600000);
    const dw = await b.ev(`(() => { const A = TitanicApp, s = A.state.sim; return { cuts: A.director.cuts(), k: s.night.k, t: s.t, broke: A.broke(s), handover: s.night.handover || null, bridge: !!(s.markT && s.markT.bridge >= 0) }; })()`);
    await b.click('bDirector');
    const dLast = dw.cuts.find(c => c.trigger === 'last'), dBreak = dw.cuts.find(c => c.trigger === 'break');
    row('G12\'s cascade: on the default watch (handed over at the break\'s onset) her last minutes cut before the break, by the onset check\'s ratio (the bridge still dry); a cut as she breaks, on the hand-over\'s own step; none for her lights',
      `${dw.handover}; ${dw.cuts.map(c => c.trigger + (c.n > 1 ? ' ' + c.n : '')).join(' ')}; last at step ${dLast ? dLast.step : '-'}${dLast ? ' (' + ((dw.t - dLast.t) / 60).toFixed(2) + ' min before the break)' : ''}, break at step ${dBreak ? dBreak.step : '-'} (the hand-over ${dw.k}); the bridge ${dw.bridge ? 'UNDER' : 'dry'}; she ${dw.broke ? 'broke' : 'DID NOT BREAK'}`,
      'onset; last 1 to 5 min before the break; break on the hand-over\'s step, the last cut; no lights; the bridge dry',
      dw.handover === 'onset' && dw.broke && !!dLast && !!dBreak && dBreak.step === dw.k && dLast.step < dw.k && dw.t - dLast.t > 60 && dw.t - dLast.t < 300 && !dw.bridge &&
      !dw.cuts.some(c => c.trigger === 'lights') && dw.cuts[dw.cuts.length - 1].trigger === 'break');

    // ---- 6. a phone (390 x 780, touch): the caption at the bells; a damage preset's end card with a caption
    await b.page.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 780, deviceScaleFactor: 2, mobile: true });
    await b.page.send('Emulation.setTouchEmulationEnabled', { enabled: true });
    await b.open('#night=1912', OPEN);
    await until(b, 'sim.night.k >= 3', 'the watch under way on the phone');
    await b.clickSel('#bDirector');
    await b.ev(`TitanicApp.state.warp = ${WARP}`);
    await until(b, 'sim.night.tBells >= 0', 'the bells on the phone');
    const phB = await b.ev(LAYOUT), phCut = await lastCut(b);
    await shot(b, 'director-phone-bells.png');
    await b.open('#scenario=titanic', OPEN);
    // the pace's buttons are in the phone's sheet: the Run tab opens it (a real tap), and its close button shuts it. The
    // tab is a toggle, so it is tapped once and waited on (G4): a second tap on a slow load shut the sheet the first opened
    await b.clickSel('.tab[data-tab="run"]');
    await b.waitFor('document.getElementById("panel").classList.contains("open")', 20000, 'the sheet open');
    // the sheet slides up over 0.22 s: a click where the button was read mid-slide lands on the tab bar, and a tab there
    // can hide the Run pane (joint gate 3, 2026-11-20). So wait until the button stands still
    await b.waitFor(`(() => { const e = document.querySelector('#speedSeg button[data-speed="900"]'); if (!e) return false; const r = e.getBoundingClientRect(), k = [r.left, r.top, r.width].map(Math.round).join(','), was = window.__at900; window.__at900 = k; return r.width > 0 && was === k; })()`, 20000, 'the sheet settled');
    await clickUntil(b, '#speedSeg button[data-speed="900"]', 'TitanicApp.state.speed === 900', 'the fastest pace');
    await clickUntil(b, '#sheetClose', '!document.getElementById("panel").classList.contains("open")', 'the sheet shut');
    // the director on (a real tap) 40 s of her time after her lights go out, a few seconds before her end; on a phone the
    // card, once up, lies over the view buttons and the switch with them
    await until(b, 'sim.plant && sim.plant.lights === 0 && sim.plant.events.dark !== undefined && sim.t >= sim.plant.events.dark + 40', 'her last seconds', 240000);
    await b.clickSel('#bDirector');
    await until(b, 'sim.foundered', 'the preset\'s foundering', 120000);
    await waitPage(b, '!!TitanicApp.nightEnd.shown()', 10000, 'the end card'); await frames(b, 3);
    const phEnd = await b.ev(LAYOUT), phOn = await lastCut(b);
    await shot(b, 'director-phone-preset-end.png');
    row('phone (390 x 780): the caption covers neither the readouts, nor the Bridge, nor the end card (the bells on a watch; a preset foundered, the card up)',
      `${phB.device}; ${sayL('bells (' + (phCut && phCut.trigger) + ')', phB)}; ${sayL('end (' + (phOn && phOn.trigger) + ' ' + (phOn && phOn.view) + ')', phEnd)}`,
      'no overlap; shown at the bells; at the end shown, or hidden by design',
      phB.device === 'phone' && clearOf(phB) && clearOf(phEnd) && phB.cap.shown && phCut && phCut.trigger === 'bells' && !!phEnd.card);
    row('no error in the page\'s console through all of it', b.errors.length ? b.errors.slice(0, 3).join(' | ') : 'none', 'none', b.errors.length === 0);
    console.log(fails ? `FAIL: ${fails} row(s)` : `PASS: all ${rows.length} rows`);
  } catch (e) {
    fails++; console.log('FAIL: the test could not finish: ' + e.message); if (b.errors.length) console.log('page errors: ' + b.errors.slice(0, 5).join(' | '));
  } finally {
    await b.close();
    process.exit(fails ? 1 : 0);
  }
})();
