// QC B-4 (Z2, 2026-11-21), and G12's cascade (D98, 2026-11-23): the page on a watch handed over at the break's onset, the
// default since the cascade (core/night.js, D76 b: the night carries B2's check itself and Night.over says she is gone
// when it finds the onset). handover=flag in the address is the what-if, handed over at her flag as before; an old link's
// handover=onset is the default. The page knows she is gone by TitanicApp.gone(sim) (Night.over on a watch, the core's
// flag on a preset), never by the flag alone; Bo's words for it (11-21, "Go with yes"): the end card "She broke", the pill
// "Breaking", the forecast "Breaks at [time]".
//   node tools/onset_site_test.js [dist] [picture dir]
// On the 1912 orders, on the page's virtual clock (QC C-3: clock=test; tools/cdp.js's vrun), it checks that
//   - a watch is one handed over at the onset by default, an old link's handover=onset gives the default, and
//     handover=flag gives the what-if, kept in the address; the 1912 orders taken are handed over at the onset;
//   - after the ice the forecast says when she breaks, to the step she does;
//   - she is gone at the onset with the core's flag still down (gone, goneT, broke): the pill "Breaking", the page's
//     notice and the end card "She broke" at goneT after the touch, without the founder's words; the page's 'foundered'
//     event once;
//   - nothing more is ordered once she has gone, and the walk will not start; the link to the watch is the default's;
//   - past the onset the night steps on and her fall begins at the onset's time, to the bed ("On the bed"), the event
//     still once, the card still "She broke";
//   - the page feeds nothing back: the watch has the fingerprint, and the same fall, of the model alone in the page made
//     the same way.
// The flag what-if's end (the founder's words, the plant's last minute) is the other suites' where they read it
// (night_end_site, nerves_site, evidence_site and others open handover=flag). With a picture directory it takes one
// picture, at the onset (onset_broke.png).
'use strict';
const path = require('path');
const B = require('./cdp');
const dist = path.resolve(process.argv[2] || path.join(__dirname, '..', 'dist'));
const shots = process.argv[3] ? path.resolve(process.argv[3]) : null;
const rows = []; let fails = 0;
function row(what, value, ref, ok) { rows.push([what, value, ref, ok]); if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + what.padEnd(100) + ' ' + String(value).padEnd(64) + ' ' + ref); }
const WARP = 6;                                    // the watch's real time at the ice, multiplied (a test hook, as in the other suites)
const SPEED = 900;                                 // the player's pace after the ice: the fastest button

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
    // a click that must take: click, run the page's passes up to 1 s of its time, and again if it has not (the pace's
    // buttons unlock at the readouts' next refresh after the ice)
    const clickUntil = async (sel, cond, what) => {
      for (let n = 1; ; n++) {
        await b.clickSel(sel);
        if ((await b.vrun(cond, { maxMs: 1000, held: false })).done) return n;
        if (n >= 5) throw new Error('the page\'s time ran out waiting for ' + what);
      }
    };

    // ---- 1. the what-if from the address (handover=flag), kept when the 1912 orders are taken; an old link's
    // handover=onset, the default now, given nothing; and the default watch, on the 1912 orders, handed over at the onset
    const AT = `({ handover: TitanicApp.state.handover || null, night: TitanicApp.state.sim.night.handover || null, onset: !!TitanicApp.state.sim.night.onset, mode: TitanicApp.state.night.mode, hash: location.hash })`;
    await b.open('#night=1912&handover=flag', { virtual: true });
    const f0 = await b.ev(AT);
    await b.click('bAuto');
    await b.vrun('TitanicApp.state.night.mode === "auto" && TitanicApp.state.sim.night.k < 20', { maxMs: 2000, held: false, what: 'the 1912 orders (the what-if)' });
    const f1 = await b.ev(AT);
    row('the what-if from the address (handover=flag): the page\'s, and the watch made from it, handed over at her flag (no onset field), again on the 1912 orders, the address keeping it',
      `the page's ${f0.handover}, the watch's ${f0.night || 'none'} (${f0.mode}); the 1912 orders: the watch's ${f1.night || 'none'} (${f1.mode}); the address now ${f1.hash}`,
      'flag, none; none, auto; handover=flag kept',
      f0.handover === 'flag' && f0.night === null && f1.night === null && f1.mode === 'auto' && /[#&]handover=flag(&|$)/.test(f1.hash));
    await b.open('#night=1912&handover=onset', { virtual: true });
    const a0 = await b.ev(AT);
    await b.click('bAuto');
    await b.vrun('TitanicApp.state.night.mode === "auto" && TitanicApp.state.sim.night.k < 20', { maxMs: 2000, held: false, what: 'the 1912 orders' });
    await b.ev(`(() => { window.__gone = 0; window.__notes = []; TitanicApp.on('event', (n, d) => { if (n === 'foundered') window.__gone++; if (n === 'notice') window.__notes.push(d.text); }); })()`);
    const a1 = await b.ev(AT);
    row('the default watch is handed over at the break\'s onset: an old link\'s handover=onset gives the default (the page passes nothing), and the 1912 orders taken carry the onset\'s check; the address drops the parameter',
      `the old link: the page's ${a0.handover || 'none'}, the watch's ${a0.night} (${a0.mode}); the 1912 orders: the watch's ${a1.night}, its onset check ${a1.onset ? 'carried' : 'MISSING'} (${a1.mode}); the address now ${a1.hash}`,
      'none, onset; onset, carried, auto; no handover in the address',
      a0.handover === null && a0.night === 'onset' && a1.night === 'onset' && a1.onset && a1.mode === 'auto' && !/handover=/.test(a1.hash));

    // ---- 2. after the ice: the forecast says when she breaks
    await b.ev(`TitanicApp.state.warp = ${WARP}`);
    await until('sim.night.tClear >= 0', 'the end of the encounter');
    if (await b.ev('!!(document.getElementById("rpSlow") && document.getElementById("rpSlow").checked)')) await clickUntil('#rpSlow', '!document.getElementById("rpSlow").checked', 'the reports\' slowing off');
    await clickUntil(`#speedSeg [data-speed="${SPEED}"]`, `TitanicApp.state.speed === ${SPEED}`, 'the pace at ' + SPEED + 'x');
    await b.waitFor('!!(TitanicApp.state.forecast && TitanicApp.state.forecast.by === "watch" && TitanicApp.state.forecast.seq === TitanicApp.state.fcSeq)', 120000, 'the forecast after the ice');
    await b.vframes(10);
    const fc = await b.ev(`(() => { const f = TitanicApp.state.forecast; return { over: f.over, overT: f.overT, foundered: f.foundered, line: document.getElementById('fcLine').textContent, want: 'Breaks at ' + TitanicApp.clockOf(f.overT) }; })()`);
    row('after the ice the forecast says when she breaks: "Breaks at", its time the onset\'s on the watch run on (the night\'s forecaster stops at Night.over)',
      `over ${fc.over}, foundered ${fc.foundered}, at ${fc.overT} s; "${fc.line}"`, `true, false; "Forecast: ${fc.want}, ..."`,
      fc.over === true && fc.foundered === false && fc.overT > 0 && fc.line.startsWith('Forecast: ' + fc.want + ', ') && /after the touch$/.test(fc.line));

    // ---- 3. the onset: she is gone, the flag still down
    await until('TitanicApp.gone(sim)', 'the onset of the break', 1200000);
    await b.vframes(10);                           // the readouts' next refresh (the pill), the card and the notice on their passes
    const g = await b.ev(`(() => { const A = TitanicApp, s = A.state.sim, o = s.night.onset, T = A.goneT(s);
      return { gone: A.gone(s), broke: A.broke(s), flag: s.foundered, T, oT: o && o.found ? o.found.t : null, t: s.t, touch: s.night.tTouch, clock: A.clockOf(T),
        pill: document.getElementById('status').textContent, play: document.getElementById('bPlay').textContent, card: A.nightEnd.shown(), title: document.querySelector('#endCard h2, #endCard .endcard-title') ? document.querySelector('#endCard h2, #endCard .endcard-title').textContent : null,
        lines: A.nightEnd.sentences(), notes: window.__notes.slice(), ev: window.__gone, k: s.night.k, fall: !!s.fall, link: A.nightEnd.link() }; })()`);
    const hm = (s) => { const m = Math.round(s / 60); return m < 60 ? m + ' min' : Math.floor(m / 60) + ' h ' + String(m % 60).padStart(2, '0') + ' min'; };
    row('at the onset she is gone with the core\'s flag still down: gone and broke, goneT the onset\'s time (the step\'s own), the page\'s \'foundered\' event once',
      `gone ${g.gone}, broke ${g.broke}, the flag ${g.flag}; goneT ${g.T} s, the onset found at ${g.oT} s, her clock ${g.t} s (step ${g.k}); the event ${g.ev} time(s); the forecast's ${fc.overT} s`,
      'true, true, false; goneT = the onset\'s = her clock; once; the forecast\'s time to the step',
      g.gone && g.broke && !g.flag && g.T === g.oT && g.T === g.t && g.ev === 1 && Math.abs(fc.overT - g.T) < 0.26);
    const card = g.lines.join(' '), first = g.lines[0] || '', wantFirst = `She broke at ${g.clock}, ${hm(g.T - g.touch)} after she touched the ice.`;
    const note = g.notes.find(t => /^She broke/.test(t)) || '';
    row('Bo\'s words: the pill "Breaking", the end card "She broke" at goneT after the touch with no founder\'s words, the page\'s notice "She broke at"',
      `pill "${g.pill}"; card ${g.card}, "${g.title}": "${first}"; ${/founder|went down/i.test(card) ? 'FOUNDER WORDS ON IT' : 'no founder words'}; notice "${note}"`,
      `"Breaking"; broke, "She broke": "${wantFirst}"; none; "She broke at ${g.clock}, ..."`,
      g.pill === 'Breaking' && g.card === 'broke' && g.title === 'She broke' && first === wantFirst && !/founder|went down/i.test(card) && note.startsWith('She broke at ' + g.clock + ', '));
    // NH15 F8: the card says what her lights were doing when she broke: still burning (on this night her dynamos stop only
    // as her steam mains give way, after the onset), or out at the plant's own time
    const lt = await b.ev(`(() => { const A = TitanicApp, P = A.state.sim.plant; return { lights: P.lights, failT: A.state.lightsFailT, clock: A.state.lightsFailT > 0 ? A.clockOf(A.state.lightsFailT) : null, mainT: A.state.lightsMainT }; })()`);
    const lightL = g.lines.find(l => /lights/.test(l)) || '', wantL = lt.failT > 0 ? null : (lt.mainT > 0 ? 'Her emergency lights were burning when she broke.' : 'Her lights were burning when she broke.');
    row('NH15 F8: the card says what her lights were doing when she broke: burning, or out at the plant\'s own time',
      `"${lightL}" (her lights at ${lt.lights}${lt.failT > 0 ? ', out at ' + lt.failT + ' s' : ''})`,
      wantL ? `"${wantL}"` : `"Her lights went out at ${lt.clock} (...)"`,
      wantL ? lightL === wantL && lt.lights > 0 : (lightL.startsWith('Her lights went out at ' + lt.clock) || lightL.startsWith('Her emergency lights went out at ' + lt.clock)));
    if (shots) { await b.vframes(1, { render: true }); await b.shot(path.join(shots, 'onset_broke.png')); }

    // ---- 4. nothing more is ordered once she has gone; the walk will not start; the link is the default watch's (no
    // handover in it: the onset is the default since G12's cascade)
    const o = await b.ev(`(() => { const A = TitanicApp, s = A.state.sim, n0 = s.night.log.length, r = A.order('helm', 10); return { r: r === undefined ? 'undefined' : String(r), n0, n1: s.night.log.length }; })()`);
    // the walk's own refusal among the notices raised since the click, not the last of them: on a pass after the onset
    // another part's notice may come after it (join 13's gate: the wireless's "silent" notice on the same passes)
    const nBefore = await b.ev('window.__notes.length');
    await b.clickSel('button[data-view="walk"]'); await b.vframes(3);
    const wk = await b.ev(`(() => { const since = window.__notes.slice(${nBefore}), want = 'She has gone: there is no deck to walk';
      return { view: TitanicApp.state.view, walking: TitanicApp.walk.on(), note: since.includes(want) ? want : (since.join(' / ') || 'none') }; })()`);
    row('once she has gone no order is given (the page\'s one way, TitanicApp.order) and the walk will not start; the link to this watch is the default\'s, with no handover in it',
      `order: ${o.r}, the log ${o.n0} -> ${o.n1}; the walk: view ${wk.view}, "${wk.note}"; the link ${/handover=/.test(g.link || '') ? 'WITH ' + (/handover=[a-z]+/.exec(g.link) || [''])[0] : 'without a handover'}`,
      'nothing given, the log unchanged; not walking, "She has gone: there is no deck to walk"; without',
      o.n1 === o.n0 && (o.r === 'undefined' || o.r === 'false') && wk.view !== 'walk' && !wk.walking && wk.note === 'She has gone: there is no deck to walk' && !!g.link && !/handover=/.test(g.link));

    // ---- 5. past the onset the night steps on and her fall begins at the onset's time, to the bed
    // D97: on the way, each piece's ports at its own supply (core/readers/fall.js's lights, G2), held 3 s and 12 s into her
    // fall (a fall step's event: the page's step hooks stop at the hand-over), each piece's ports' light against its supply
    // then; a supply gone fades over 3 s of her time, as the ship's lights do
    const holdFall = async (dt, what) => {
      await b.ev(`(() => { const A = TitanicApp; window.__held = false; const f = A.on('event', (name, sim) => { if (name === 'fallStep' && sim && sim.fall && sim.fall.t >= sim.fall.t0 + ${dt}) { A.state.playing = false; window.__held = true; A.off('event', f); } }); A.state.playing = true; })()`);
      await b.vrun('window.__held', { maxMs: 600000, held: false, what });
      await b.vframes(3);
      return b.ev(`(() => { const s = TitanicApp.state.sim, L = s.fall.lights; return { on: TitanicApp.fallPortsOn(), level: L ? L.level.slice() : null, dark: L ? L.dark.slice() : null, t: s.fall.t, t0: s.fall.t0 }; })()`);
    };
    const l3 = await holdFall(3, '3 s into her fall'), l12 = await holdFall(12, '12 s into her fall');
    const pieceOk = (l) => !!l.level && l.on.length === l.level.length && l.on.every((v, i) => (l.level[i] > 0 ? v === l.level[i] : (l.dark[i] >= 0 ? v <= Math.max(0, 1 - (l.t - l.dark[i]) / 3) + 1e-9 : v === 0)));
    const words = (l) => l.on.map((v, i) => 'piece ' + i + ' ' + (v === null ? '-' : v.toFixed(2)) + ' (supply ' + (l.level ? l.level[i] : '-') + (l.dark && l.dark[i] >= 0 ? ', gone at +' + (l.dark[i] - l.t0).toFixed(2) + ' s' : '') + ')').join(', ');
    row('D97: in her fall each piece\'s ports at its own supply (sim.fall.lights): 3 s past the break one piece lit and one dark, by 12 s both dark as their supplies went',
      `+3 s: ${words(l3)}; +12 s: ${words(l12)}`, 'each at its supply, a supply gone faded within 3 s',
      pieceOk(l3) && pieceOk(l12) && l3.on.some(v => v > 0) && l3.on.some(v => v === 0) && l12.on.every(v => v === 0));
    await b.ev('TitanicApp.state.playing = true');
    await b.vrun('!!(TitanicApp.state.sim.fall && TitanicApp.state.sim.fall.done)', { maxMs: 900000, held: false, what: 'the bed' });
    await b.vframes(10);
    const e = await b.ev(`(() => { const A = TitanicApp, s = A.state.sim, f = s.fall; return { k: s.night.k, t: s.t, flag: s.foundered, t0: f ? f.t0 : null, done: f ? f.done : false, ft: f ? f.t : null,
      play: document.getElementById('bPlay').textContent, playing: A.state.playing, pill: document.getElementById('status').textContent, card: A.nightEnd.shown(), ev: window.__gone,
      fp: TitanicNight.fingerprint(s), pose: f ? JSON.stringify(f.pieces.map(p => [p.r, p.q])) : null }; })()`);
    row('past the onset the night steps on (Z3) and her fall begins at the onset\'s time, to the bed: "On the bed"; the flag never raised; the card still "She broke", the event still once',
      `the fall from ${e.t0} s (the onset ${g.T} s), ${e.done ? 'on the bed' : 'NOT AT REST'} at step ${e.k}, its clock ${e.ft} s, hers ${e.t} s; "${e.play}", playing ${e.playing}; the flag ${e.flag}; pill "${e.pill}", card ${e.card}; the event ${e.ev} time(s)`,
      't0 the onset\'s; on the bed; the two clocks equal; "On the bed", stopped; false; "Breaking", broke; once',
      e.t0 === g.T && e.done && e.ft === e.t && e.play === 'On the bed' && !e.playing && !e.flag && e.pill === 'Breaking' && e.card === 'broke' && e.ev === 1);
    const bare = await b.ev(`(() => { const N = TitanicNight, s = N.create(TitanicCore.buildShip(), N.spec(1912), { auto: true }); while (s.night.k < ${e.k}) N.step(s);
      return { fp: N.fingerprint(s), pose: s.fall ? JSON.stringify(s.fall.pieces.map(p => [p.r, p.q])) : null, done: !!(s.fall && s.fall.done) }; })()`);
    row('the page feeds nothing back on an onset watch: the watch has the fingerprint and the fall of the model alone in the page, made the same way, at the same step',
      `the page: ${e.fp}; the model alone: ${bare.fp}, its fall ${bare.done ? 'on the bed' : 'NOT AT REST'}, the poses ${bare.pose === e.pose ? 'the same to the bit' : 'DIFFER'}`,
      'the same fingerprint; the same poses', e.fp === bare.fp && bare.done && !!e.pose && bare.pose === e.pose);

    const errs = b.errors ? b.errors.filter(x => !/favicon/i.test(x)) : [];
    row('no error in the page', errs.length ? errs.slice(0, 3).join(' | ') : 'none', 'none', errs.length === 0);
  } catch (err) {
    console.error(err && err.stack || err);
    fails++;
  } finally {
    await b.close();
  }
  console.log(fails ? `FAIL: ${fails} row(s)` : `PASS: all ${rows.length} rows`);
  process.exitCode = fails ? 1 : 0;
})();
