// NH4, the scrubber (site/app.js: the kept minutes and TitanicApp.scrub; site/parts/82_scrub.js: its bar), in a real
// browser (headless Edge or Chrome), with nothing beyond Node: docs/DESIGN_NH4_the_scrubber_v1_2026-11-23.md, section 7.
//   node tools/scrub_site_test.js [dist]        (a browser suite: take a turn)
// On the page's virtual clock (QC C-3: clock=test; tools/cdp.js's vrun), it checks that
//   - the 1912 watch on its orders (the director on) is kept every minute; run on from minute M to her end (the hand-over
//     at the break's onset, the default since G12's cascade), then scrubbed back to M by the bar (a real change of it) and
//     played on to her end again, it ends the same: the fingerprint and the step, every cut of the director step for step,
//     the notices the page gives on the model's own steps (her lights going out, her end) step for step (those the page
//     paces, at the readouts' refresh, the frame's lights or the help's frames, a CHECK), and the marks;
//   - the unbroken run has the model's own fingerprint (the part and the keeper feed nothing back);
//   - scrubbed back and given a new order, the watch drops its later orders and kept minutes, once said, and is the
//     player's;
//   - scrubbed back and holed by hand (G27's `hole`, no man's order: it takes nothing over), the watch drops the minutes
//     kept after the hole, once said, and its later orders still come; played on to her end it is the night of its log;
//   - the 1912 preset scrubbed back to minute 60 founders as it did, to the bit (the core's state at her flag);
//   - and what keeping costs: the minutes kept, and a scrub's time on this machine (CHECK).
'use strict';
const path = require('path');
const B = require('./cdp');
const dist = path.resolve(process.argv[2] || path.join(__dirname, '..', 'dist'));
const rows = []; let fails = 0;
function row(what, value, ref, ok) { rows.push([what, value, ref, ok]); if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + what.padEnd(100) + ' ' + String(value).padEnd(64) + ' ' + ref); }
function check(what, value, ref) { rows.push([what, value, ref, true]); console.log('CHECK ' + what.padEnd(99) + ' ' + String(value).padEnd(64) + ' ' + ref); }
const WARP = 6;                                    // the watch's real time at the ice, multiplied (a test hook, as in the other suites)
const SPEED = 240;                                 // the player's pace after the ice: fast, and every director's row cuts
const OPEN = { virtual: true };

(async () => {
  const b = await B.launch({ dist });
  try {
    // the page's clock run, on its own passes, to the step a condition first holds, and stopped there (a part's step hook)
    const until = async (cond, what, ms) => {
      await b.ev(`(() => { const A = TitanicApp; window.__held = false; const sim = A.state.sim;
        if (sim && (${cond})) { window.__held = true; return; }
        const f = A.on('step', (sim) => { if (${cond}) { A.state.playing = false; window.__held = true; A.off('step', f); } }); A.state.playing = true; })()`);
      await b.vrun('window.__held', { maxMs: ms || 900000, held: false, what });
    };
    const clickUntil = async (sel, cond, what) => {
      for (let n = 1; ; n++) {
        await b.clickSel(sel);
        if ((await b.vrun(cond, { maxMs: 1000, held: false })).done) return n;
        if (n >= 5) throw new Error('the page\'s time ran out waiting for ' + what);
      }
    };
    // the notices from now on, each with the step it came on
    const record = () => b.ev(`(() => { const A = TitanicApp; window.__notes = []; if (!window.__noted) { window.__noted = true; A.on('event', (n, d) => { if (n === 'notice' && window.__notes) { const s = A.state.sim; window.__notes.push((s.night ? s.night.k : Math.round(s.t / s.params.dt)) + ' ' + (d && d.text)); } }); } return true; })()`);
    // the crew's parts (fork 2's 86_crew.js and 88_minds.js), where their keepers are in the build (claude/byok-scrub-keepers):
    // the talk's lines, and the minds' furthest moment played, lines remembered, turns awaited, offer, and the fake
    // transport's requests (#minds=fake in the address: D102's "a scrub asks a model for nothing by itself")
    const CREW = `(() => { const A = TitanicApp, M = A.minds, K = A.crew, T = M && typeof M.transport === 'function' ? M.transport() : null;
      return { keepers: !!(M && typeof M.played === 'function' && K && typeof K.remembered === 'function'), talk: K && K.lines ? JSON.stringify(K.lines()) : null,
        played: M && M.played ? M.played() : null, remembered: M && M.remembered ? M.remembered() : null, awaited: M && M.awaited ? M.awaited().length : null,
        offer: M && M.offer ? !!M.offer() : null, req: T && T.requests ? T.requests.length : null }; })()`;
    const END = `(() => { const A = TitanicApp, s = A.state.sim; return { fp: TitanicNight.fingerprint(s), k: s.night.k, t: s.t, broke: A.broke(s), mode: A.state.night.mode,
      cuts: A.director.cuts().map(c => c.step + ' ' + c.trigger + (c.n > 1 ? ' ' + c.n : '') + ' ' + c.view), notes: window.__notes.slice(), marks: JSON.stringify(s.markT), logN: s.night.log.length, crew: ${CREW} }; })()`;

    // ---- 1. the 1912 watch on its orders, the director on (a real click); kept every minute. The crew's minds on the fake
    // transport, which counts what is asked of it
    await b.open('#night=1912&minds=fake', OPEN);
    await b.click('bDirector');
    await b.click('bAuto');
    await b.vrun('TitanicApp.state.night.mode === "auto" && TitanicApp.state.sim.night.k < 20', { maxMs: 2000, held: false, what: 'the 1912 orders' });
    await b.ev(`TitanicApp.state.warp = ${WARP}`);
    await until('sim.night.tClear >= 0', 'the ice passed');
    await b.vframes(4);
    await clickUntil(`#speedSeg button[data-speed="${SPEED}"]`, `TitanicApp.state.speed === ${SPEED}`, 'the pace chosen');
    const tTouch = await b.ev('TitanicApp.state.sim.night.tTouch'), M = Math.floor((tTouch + 3600) / 60);
    await until(`sim.t >= ${M * 60}`, 'minute ' + M + ' (an hour after the touch)');
    const atM = await b.ev(`(() => { const A = TitanicApp, s = A.state.sim; return { k: s.night.k, t: s.t, logN: s.night.log.length, kept: A.keptMinutes(), state: A.keptState(), bar: document.getElementById('scrubBar').max }; })()`);
    row('the watch is kept every minute of her time as it plays, the bar from the first to the furthest',
      `at minute ${M} (step ${atM.k}): ${atM.state.n} minutes kept (${atM.kept[0]} to ${atM.state.furthest}), every ${atM.state.every} s; the bar to ${atM.bar}`,
      `a minute each, to ${M}`, atM.state.every === 60 && atM.state.furthest === M && atM.kept.every((m, i) => i === 0 || m === atM.kept[i - 1] + 1) && Number(atM.bar) === M);
    await record();
    await until('TitanicApp.gone(sim)', 'her end (the unbroken run)');
    const ref = await b.ev(END);
    const bare = await b.ev(`(() => { const N = TitanicNight, s = N.create(TitanicCore.buildShip(), N.spec(1912), { auto: true }); while (s.night.k < ${ref.k}) N.step(s); return N.fingerprint(s); })()`, 300000);
    row('the unbroken run (kept every minute, the bar shown) has the model\'s own fingerprint at her end',
      `${ref.broke ? 'she broke' : 'her end'} at step ${ref.k}: page ${ref.fp}, the model alone ${bare}`, 'equal, bit for bit', ref.fp === bare && ref.broke);

    // ---- 2. scrubbed back to minute M by the bar, and played on to her end
    await record();                                   // what the scrub itself says (nothing: its log and reports are drawn quietly)
    const t0 = Date.now();
    const back = await b.ev(`(() => { const e = document.getElementById('scrubBar'); e.value = '${M}'; const w0 = performance.now(); e.dispatchEvent(new Event('change')); const ms = performance.now() - w0; const s = TitanicApp.state.sim;
      return { k: s.night.k, t: s.t, playing: TitanicApp.state.playing, gone: TitanicApp.gone(s), queued: TitanicApp.keptState().queued, ms }; })()`);
    const wallMs = Date.now() - t0;
    // its later orders are queued where the unbroken run gave any after minute M (the 1912 orders give theirs within the
    // first hour, so there may be none)
    const later = ref.logN > atM.logN;
    row('scrubbed back by the bar (a real change of it): the watch as it was at minute ' + M + ', paused; its later orders queued where there were any',
      `step ${back.k} (kept ${atM.k}), t ${back.t} s; playing ${back.playing}, gone ${back.gone}, queued ${back.queued} (orders after minute ${M}: ${ref.logN - atM.logN})`,
      `step ${atM.k}; not playing; not gone; queued ${later}`, back.k === atM.k && back.t === atM.t && !back.playing && !back.gone && back.queued === later);
    check('a scrub\'s time on this machine (the page\'s own work, then the call\'s wall time)', `${back.ms.toFixed(1)} ms in the page; ${wallMs} ms the call`, 'under 500 ms');
    const crewBack = await b.ev(CREW);
    const crewRow = (what, value, ref, ok) => (ref0.keepers ? row(what, value, ref, ok) : check(what + ' (the crew\'s keepers are not in this build)', value, ref));
    const ref0 = ref.crew;
    crewRow('D102, at the scrub: the crew\'s minds wait for nothing and offer nothing, and nothing has been asked of the model by the scrub',
      `awaited ${crewBack.awaited}, an offer ${crewBack.offer}; the fake transport's requests ${crewBack.req} (at her end ${ref0.req})`,
      `none; none; ${ref0.req}`, crewBack.awaited === 0 && crewBack.offer === false && crewBack.req === ref0.req);
    // RC1: the reports' feed comes back as it stood, drawn quietly (site/parts/60_reports.js): no report said again as news,
    // and none holding the page at her own pace on the first steps played on (before, its reset counted the whole feed new)
    const quietScrub = await b.ev('window.__notes.slice()');
    const paceAfter = await b.ev(`(() => { const A = TitanicApp, F = () => (A.state.sim.reports ? A.state.sim.reports.feed.length : 0), f0 = F();
      A.state.playing = true; A.test.frame(1000 / 60); A.test.frame(1000 / 60);
      const r = { held: A.reports && A.reports.holdEnds ? A.reports.holdEnds() : null, f0, f1: F(), pace: A.pace(), speed: A.state.speed }; A.state.playing = false; return r; })()`);
    row('at the scrub nothing is said again and nothing holds the pace: the reports\' feed as it stood at minute ' + M + ', drawn quietly',
      `notices during the scrub: ${quietScrub.length ? quietScrub.join(' / ') : 'none'}; the reports' own hold on its first two frames played on: ${paceAfter.held ? 'HELD' : 'none'} (the feed ${paceAfter.f0} -> ${paceAfter.f1}); the pace ${paceAfter.pace} (the player's ${paceAfter.speed})`,
      'none; none (unless a report came)', quietScrub.length === 0 && paceAfter.f0 > 0 && (paceAfter.held === 0 || paceAfter.f1 > paceAfter.f0));
    await record();
    await until('TitanicApp.gone(sim)', 'her end (played on from minute ' + M + ')');
    const again = await b.ev(END);
    const cutsSame = again.cuts.join('|') === ref.cuts.join('|');
    // the notices, of two kinds. The page gives two on the model's own steps, in its step loop: her lights going out
    // (lightsOut, after every step) and her end ("She broke at ...", on the hand-over's step). They are held step for step.
    // The others the page paces: a model event's notice at the readouts' next refresh (every 120 ms of the page's clock,
    // the last of its kind since the refresh before), her main dynamos lost at the frame's lights (lightsFade), a wireless
    // line's on the help's frames, throttled by the wall clock (site/parts/70_help.js, pending in tools/clock_tests.js).
    // Their steps, their order, and even which of them are given before the suite reads follow those phases, which a scrub
    // cannot give back (the page's clock only goes forward) and which differ between two unbroken runs too ("Carpathia:
    // coming" before "Boiler room 5 flooded" in one, after it in the next; "The wireless is silent: she has gone." at her
    // very end in one and not yet in the next): a CHECK below
    const txt = (s) => s.slice(s.indexOf(' ') + 1), OWN = /^(She broke|Foundered|Her lights go out)\b/, END_NOTE = /^(She broke|Foundered)\b/;
    const own = (s) => OWN.test(txt(s)), paced = (s) => !own(s);
    const ownA = again.notes.filter(own), ownR = ref.notes.filter(own), ownSame = ownA.join('|') === ownR.join('|');
    const nd = (() => { for (let i = 0; i < Math.max(ownA.length, ownR.length); i++) if (ownA[i] !== ownR[i]) return 'the first that differs: played on "' + (ownA[i] || '-') + '", unbroken "' + (ownR[i] || '-') + '"'; return ''; })();
    row('played on from minute ' + M + ' it ends as the unbroken run did: the fingerprint and the step, every cut of the director and the notices given on the model\'s own steps (her lights going out, her end: step for step), the marks',
      `${again.fp} at step ${again.k} (the unbroken: ${ref.fp} at ${ref.k}); cuts ${again.cuts.length} ${cutsSame ? 'the same' : 'DIFFER'}; those notices ${ownA.length} ${ownSame ? 'the same' : 'DIFFER'} (${ownR.join(' / ')})${nd ? ' [' + nd + ']' : ''}; marks ${again.marks === ref.marks ? 'the same' : 'DIFFER'}`,
      'all the same', again.fp === ref.fp && again.k === ref.k && again.t === ref.t && cutsSame && ownSame && ownR.some(s => END_NOTE.test(txt(s))) && again.marks === ref.marks && again.broke);
    { const pA = again.notes.filter(paced).map(txt).sort(), pR = ref.notes.filter(paced).map(txt).sort(), same = pA.join('|') === pR.join('|');
      let first = ''; for (let i = 0; i < Math.max(pA.length, pR.length) && !first; i++) if (pA[i] !== pR[i]) first = 'played on "' + (pA[i] || '-') + '", unbroken "' + (pR[i] || '-') + '"';
      check('the notices the page paces (a model event\'s at the readouts\' refresh, the dynamos\' at the frame\'s lights, a wireless line\'s on the help\'s frames), played on against the unbroken run',
        `${pA.length} (${pR.length}): ${same ? 'the same ones' : 'others; the first that differs, sorted: ' + first}`, 'any: a refresh sooner or later'); }
    const c1 = again.crew;
    crewRow('D102, played on to her end: the crew\'s talk is the unbroken run\'s, line for line; the lines already given shown again; the model asked nothing up to the furthest moment played',
      `talk ${c1.talk === ref0.talk ? 'the same' : 'DIFFERENT'} (${ref0.talk ? JSON.parse(ref0.talk).length : 0} lines); remembered ${c1.remembered} (${ref0.remembered}); played to ${c1.played} (${ref0.played}); requests ${c1.req} (${ref0.req})`,
      'the same; the same; the same; unchanged', c1.talk === ref0.talk && c1.remembered === ref0.remembered && c1.played === ref0.played && c1.req === ref0.req);

    // ---- 3. scrubbed back again and given a new order: the later orders and minutes dropped, once said; the player's watch
    await b.ev(`TitanicApp.scrubBar.go(${M})`);
    await record();
    const ord = await b.ev(`(() => { const A = TitanicApp, s = A.state.sim, k = s.night.k, n0 = s.night.log.length; window.__drops = [];
      A.on('event', (n, d) => { if (n === 'ordersDropped') window.__drops.push(d); });
      const r = A.order('helm', -40); const L = s.night.log, o = L[L.length - 1];
      return { k, n0, n1: L.length, last: o ? [o.k, o.type, o.value] : null, mode: A.state.night.mode, script: !!s.night.script, state: A.keptState(), notes: window.__notes.slice(), drops: window.__drops.slice(), r: String(r) }; })()`);
    row('scrubbed back and given a new order: the queued orders dropped, the minutes after it dropped, said once and told the parts (ordersDropped at the new order\'s index); the watch the player\'s',
      `the order at step ${ord.k}: the log ${ord.n0} -> ${ord.n1}, its last ${JSON.stringify(ord.last)}; mode ${ord.mode}, script ${ord.script}; kept to minute ${ord.state.furthest}, queued ${ord.state.queued}; ordersDropped ${JSON.stringify(ord.drops)}; "${ord.notes.join(' / ')}"`,
      `the log one longer, ending with the order; you; none; to ${M}; not queued; once, at index ${ord.n0}; one notice of the dropped orders`,
      ord.n1 === ord.n0 + 1 && ord.last && ord.last[0] === ord.k && ord.last[1] === 'helm' && ord.last[2] === -40 && ord.mode === 'you' && !ord.script &&
      ord.state.furthest === M && !ord.state.queued && ord.drops.length === 1 && ord.drops[0].index === ord.n0 && ord.notes.filter(t => /are dropped/.test(t)).length === 1);
    // a new order is kept once (fork 2's review, 2026-11-24): back again to minute M after it, and on to her end, the queue
    // replaces the script, never adds to it, so the log holds the new order once and no order twice
    await b.ev(`TitanicApp.scrubBar.go(${M})`);
    await until('TitanicApp.gone(sim)', 'her end (back again after the new order)');
    const once = await b.ev(`(() => { const L = TitanicApp.state.sim.night.log, keys = L.map(o => o.k + ' ' + o.type + ' ' + JSON.stringify(o.value) + ' ' + JSON.stringify(o.arg === undefined ? null : o.arg));
      return { n: keys.length, uniq: new Set(keys).size, mine: L.filter(o => o.type === 'helm' && o.value === -40 && o.k === ${ord.k}).length }; })()`);
    row('back again to minute ' + M + ' after the new order and on to her end: the new order given once more on its step, never twice; no order in the log twice',
      `the new order (step ${ord.k}) ${once.mine} time(s); ${once.n} orders, ${once.uniq} different`, 'once; all different', once.mine === 1 && once.uniq === once.n);

    // ---- 3b. holed by hand after a scrub back (G27's `hole`: logged, the model's own, no man's order, so it takes nothing
    // over; the coordinator's ruling, 2026-11-24 02:27): back to minute M - 1, before the new order of 3, a hole in boiler
    // room 1 (as tools/brush_site_test.js makes it). The minutes kept after it are dropped, once said, and the parts told
    // (ordersDropped, by 'hole'); the night's later orders still come (the new order of 3 among them). Played on to her end
    // it is the night of its log: the model alone in this page with the same log, to the bit
    const MH = M - 1;
    await b.ev(`TitanicApp.scrubBar.go(${MH})`);
    await record();
    const hole = await b.ev(`(() => { const A = TitanicApp, s = A.state.sim, w = s.night, k = w.k, n0 = w.log.length, mode0 = A.state.night.mode; window.__drops = [];
      const undone = () => (w.script || []).filter((o, i) => !w.did[i]).map(o => [o.k, o.type, o.value]);
      const later = undone(), bx = TitanicCore.zoneBounds(), X = +(0.5 * (bx[9] + bx[10])).toFixed(2);
      const got = A.holeAt(X, 4.004, -1, 0.50004); const L = w.log, o = L[L.length - 1];
      return { k, n0, n1: L.length, last: o ? [o.k, o.type] : null, got: !!got, mode0, mode: A.state.night.mode, later, after: undone(),
        state: A.keptState(), notes: window.__notes.slice(), drops: window.__drops.slice() }; })()`);
    const laterHas = hole.later.some(o => o[0] === ord.k && o[1] === 'helm' && o[2] === -40);
    row('holed by hand after a scrub back (no man\'s order): the minutes kept after it dropped, said once, the parts told (ordersDropped, by "hole"); its later orders still to come; not taken over',
      `the hole at step ${hole.k} (minute ${MH}): the log ${hole.n0} -> ${hole.n1}, its last ${JSON.stringify(hole.last)}; mode ${hole.mode0} -> ${hole.mode}; the later orders ${JSON.stringify(hole.later)} -> ${JSON.stringify(hole.after)}; kept to minute ${hole.state.furthest}, queued ${hole.state.queued}; ordersDropped ${JSON.stringify(hole.drops)}; "${hole.notes.join(' / ')}"`,
      `one more, the hole; the mode as it was; the same (the new order of 3 among them); to ${MH}; not queued; once, at index ${hole.n0}, by hole; one notice of the dropped minutes`,
      hole.got && hole.n1 === hole.n0 + 1 && !!hole.last && hole.last[0] === hole.k && hole.last[1] === 'hole' && hole.mode === hole.mode0 &&
      JSON.stringify(hole.after) === JSON.stringify(hole.later) && laterHas && hole.state.furthest === MH && !hole.state.queued &&
      hole.drops.length === 1 && hole.drops[0].index === hole.n0 && hole.drops[0].by === 'hole' && hole.notes.filter(t => /are dropped/.test(t)).length === 1);
    await until('TitanicApp.gone(sim)', 'her end (holed after the scrub)');
    const holed = await b.ev(`(() => { const A = TitanicApp, s = A.state.sim; return { fp: TitanicNight.fingerprint(s), k: s.night.k,
      log: s.night.log.map(o => ({ k: o.k, type: o.type, value: o.value, arg: o.arg })), state: A.keptState() }; })()`);
    const alone = await b.ev(`(() => { const NN = TitanicNight, w = NN.create(TitanicCore.buildShip(), NN.spec(1912), { script: ${JSON.stringify(holed.log)}, readers: false });
      NN.sink(w); return { fp: NN.fingerprint(w), k: w.night.k }; })()`, 300000);
    const afterHole = holed.log.slice(hole.n0 + 1).map(o => [o.k, o.type, o.value]);
    row('holed after a scrub back and played on to her end: the night of its log (the model alone in this page with the same log, to the bit), its later orders given after the hole on their steps, minutes kept again past ' + MH,
      `${holed.fp} at step ${holed.k} (alone: ${alone.fp} at ${alone.k}); the log's place ${hole.n0} ${holed.log[hole.n0] ? holed.log[hole.n0].type : '-'}, then ${JSON.stringify(afterHole)}; kept to minute ${holed.state.furthest}`,
      `the same; hole, then ${JSON.stringify(hole.later)}; past ${MH}`,
      holed.fp === alone.fp && holed.k === alone.k && !!holed.log[hole.n0] && holed.log[hole.n0].type === 'hole' && JSON.stringify(afterHole) === JSON.stringify(hole.later) && holed.state.furthest > MH);

    // ---- 4. the 1912 preset: scrubbed back to minute 60, it founders as it did (the core's state at her flag, to the bit)
    await b.open('#scenario=titanic', OPEN);
    const HASH = `(() => { const s = TitanicApp.state.sim, j = JSON.stringify(TitanicCore.serialize(s)); let h = 2166136261; for (let i = 0; i < j.length; i++) { h ^= j.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return { h: h.toString(16), t: s.t, f: s.founderT, n: j.length, lights: s.plant ? s.plant.lights : null }; })()`;
    const LIGHTS = /^(The main dynamos are lost|Her lights go out)/;
    await b.ev('TitanicApp.state.speed = 900');
    await record();                                   // the whole run's notices, her dynamos' and her lights' among them
    await until('sim.foundered', 'the preset\'s flag (the unbroken run)');
    const p0 = await b.ev(HASH), n0 = (await b.ev('window.__notes.slice()')).map(s => s.slice(s.indexOf(' ') + 1)).filter(s => LIGHTS.test(s));
    await b.ev('TitanicApp.scrubBar.go(60)');
    await record();
    const p60 = await b.ev('({ t: TitanicApp.state.sim.t, gone: TitanicApp.gone(TitanicApp.state.sim), lights: TitanicApp.state.sim.plant ? TitanicApp.state.sim.plant.lights : null })');
    await b.vframes(5);                               // the page's frames, paused there: her lights' fade is drawn on them
    const quiet = await b.ev('window.__notes.slice()');
    await until('sim.foundered', 'the preset\'s flag (played on from minute 60)');
    const p1 = await b.ev(HASH), n1 = (await b.ev('window.__notes.slice()')).map(s => s.slice(s.indexOf(' ') + 1)).filter(s => LIGHTS.test(s));
    row('the 1912 preset scrubbed back to minute 60 founders as it did: the core\'s state at her flag the same, to the bit',
      `back to t ${p60.t} s (gone ${p60.gone}); the flag at ${p1.f} s (the unbroken ${p0.f} s), its state ${p1.h} (${p0.h}), ${p1.n} characters`,
      'equal', p60.t === 3600 && !p60.gone && p1.f === p0.f && p1.h === p0.h && p1.n === p0.n);
    // G32: scrubbed back from her end (her lights out) to minute 60 (lit), her lights are as they were there, with no
    // notice: the page's fade (lightsFade, drawn on its frames) would otherwise take the change back for news and say "The
    // main dynamos are lost". Her lights going out (on its own step) is said once more as she plays on. Whether her
    // dynamos' line is said on the way down is the frames' (it is drawn there): printed, not held
    const outs = (L) => L.filter(s => /^Her lights go out/.test(s)).length, dyn = (L) => L.filter(s => /^The main dynamos are lost/.test(s)).length;
    row('G32: scrubbed back from her end (her lights out) to minute 60 (lit), her lights as they were there with no notice; played on, her lights going out said once more',
      `her light at the flag ${p0.lights}, at minute 60 ${p60.lights}; in 5 frames after the scrub: ${quiet.length ? quiet.join(' / ') : 'no notice'}; played on: her lights out said ${outs(n1)} time(s) (unbroken ${outs(n0)}), her dynamos' line ${dyn(n1)} (${dyn(n0)})`,
      'dark, then lit; no notice; once (once)',
      p0.lights !== null && p60.lights !== null && p0.lights < p60.lights && !quiet.some(s => LIGHTS.test(s.slice(s.indexOf(' ') + 1))) && outs(n1) === outs(n0) && outs(n0) === 1);
    const cost = await b.ev('TitanicApp.keptState()');
    check('what keeping costs: the minutes kept of the preset to her flag', `${cost.n} minutes, every ${cost.every} s`, 'one a minute');

    // RC2 (NH13's find): the 1912 preset restarted by the page's own Restart (a real click), nothing changed by hand, is the
    // preset as built: its coal list (member C's 1.598, the box ticked) and its pumps' schedule; it founders on the same
    // step, its state at her flag the same to the bit. Before, a restart set the list at 2.0 and lost the pumps
    const asBuilt = await b.ev(`(() => { const s = TitanicScenarios.PRESETS.titanic.build({}); return { coal: s.coalListDeg, pumps: (s.pumps || []).length }; })()`);
    await b.click('bReset');
    const rs = await b.ev(`(() => { const s = TitanicApp.state.sim; return { t: s.t, coal: s.params.coalListDeg, pumps: (s.pumpSched || []).length, box: document.getElementById('coal').checked }; })()`);
    await until('sim.foundered', 'the restarted preset\'s flag');
    const p2 = await b.ev(HASH);
    row('the 1912 preset restarted (Restart, nothing changed by hand) is the preset as built: its coal list and its pumps; it founders on the same step, to the bit',
      `at the restart t ${rs.t} s, the list ${rs.coal} deg (built ${asBuilt.coal}, the box ${rs.box ? 'ticked' : 'clear'}), ${rs.pumps} pumps scheduled (built ${asBuilt.pumps}); the flag at ${p2.f} s (as built ${p0.f} s), its state ${p2.h} (${p0.h})`,
      'the same list and pumps; the same flag and state',
      rs.t === 0 && rs.coal === asBuilt.coal && rs.box && asBuilt.pumps > 0 && p2.f === p0.f && p2.h === p0.h && p2.n === p0.n);   // lost pumps would move the flag and the state

    // ---- 4b. G32: the preset scrubbed back to minute 60 and changed by hand ("Remove all openings": a preset logs nothing).
    // The minutes kept after it are dropped, once said in the click's own notice, and the parts told (ordersDropped, by
    // 'hand', index null). Played on two minutes, the minutes kept again are the new run's: back to minute 61 she has no
    // opening, where the old run's minute 61 had the ice's
    await b.ev('TitanicApp.scrubBar.go(60)');
    await record();
    const hand = await b.ev(`(() => { const A = TitanicApp, s = A.state.sim, n0 = s.openings.length; window.__drops = [];
      if (!window.__dropsOn) { window.__dropsOn = true; A.on('event', (n, d) => { if (n === 'ordersDropped' && window.__drops) window.__drops.push(d); }); }
      document.getElementById('bClear').click();
      return { t: s.t, n0, n1: s.openings.length, state: A.keptState(), notes: window.__notes.slice(), drops: window.__drops.slice() }; })()`);
    await until(`sim.t >= ${62 * 60}`, 'two minutes on from the change by hand');
    const on = await b.ev(`(() => { const A = TitanicApp; A.scrubBar.go(61); const s = A.state.sim; return { t: s.t, open: s.openings.length, furthest: A.keptState().furthest }; })()`);
    row('G32: the 1912 preset scrubbed back and changed by hand ("Remove all openings"): the minutes kept after it dropped, said once in its own notice, the parts told (by "hand"); the minutes kept again the new run\'s',
      `at t ${hand.t} s: openings ${hand.n0} -> ${hand.n1}; kept to minute ${hand.state.furthest}, queued ${hand.state.queued}; ordersDropped ${JSON.stringify(hand.drops)}; "${hand.notes.join(' / ')}"; two minutes on, back to minute 61: ${on.open} openings (t ${on.t} s), kept to ${on.furthest}`,
      'none left; to 60; not queued; once, by hand, index null; one notice, the click\'s; 0 openings at 61, kept to 62',
      hand.t === 3600 && hand.n0 > 0 && hand.n1 === 0 && hand.state.furthest === 60 && !hand.state.queued && hand.drops.length === 1 && hand.drops[0].by === 'hand' && hand.drops[0].index === null &&
      hand.notes.length === 1 && /^\d+ All openings removed\./.test(hand.notes[0]) && /are dropped/.test(hand.notes[0]) && on.t === 3660 && on.open === 0 && on.furthest === 62);

    row('no error in the page\'s console through all of it', b.errors.length ? b.errors.slice(0, 3).join(' | ') : 'none', 'none', b.errors.length === 0);
    console.log(fails ? `FAIL: ${fails} row(s)` : `PASS: all ${rows.length} rows`);
  } catch (e) {
    fails++; console.log('FAIL the test could not finish: ' + e.message); if (b.errors.length) console.log('page errors: ' + b.errors.slice(0, 5).join(' | '));
  } finally {
    await b.close();
  }
  process.exit(fails ? 1 : 0);
})();
