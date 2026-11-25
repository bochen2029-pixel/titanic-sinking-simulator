// The ship heard (site/parts/30_sound.js) in a real browser (headless Edge or Chrome), with nothing beyond Node.
//   node tools/sound_site_test.js [dist] [--real]
// A test cannot hear. It checks what the part asks of its audio nodes: that each level is its stated function of the
// model's number (her wind and the sea her speed squared, the engines the wing shafts' revolutions, the ice the force of
// each step of the contact, the water the inflow), that her bell strikes the half hours by the ship's clock in pairs,
// that her structure creaks as her trim moves and as often as its law says, where the listener stands, that it is
// silent when it should be, and that it feeds nothing back: the 1912 orders with the sound on keep the fingerprint of
// the model alone. The sound is woken by real clicks, as a player's would wake it.
// The page's clock is virtual (QC C-3, docs/DESIGN_virtual_clock_v1_1_2026-11-21.md): each page is opened with clock=test,
// so only this suite's passes move it (tools/cdp.js's vrun and vframes, 1000/60 ms a pass), and a busy machine changes how
// long the suite takes, never what it sees. What is checked is what the part asks, a pass at a time, of the model's
// numbers: the bell and the creaks are struck on the model's steps, the levels asked each frame. The audio clock itself
// (the sound's own time, printed beside the plunge) runs on real time and is checked nowhere. No row measures real time.
// --real runs it all on real time, as before C-3 (about three minutes), for comparison.
'use strict';
const path = require('path');
const B = require('./cdp');
const REAL = process.argv.includes('--real'), argv = process.argv.slice(2).filter(a => a !== '--real');
const dist = path.resolve(argv[0] || path.join(__dirname, '..', 'dist'));
const OPEN = { virtual: !REAL };                   // each page opened with its clock virtual (clock=test), unless --real
const rows = []; let fails = 0;
function row(what, value, ref, ok) { rows.push([what, value, ref, ok]); if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + what.padEnd(104) + ' ' + String(value).padEnd(64) + ' ' + ref); }
const KEYS = ['wind', 'sea', 'engines', 'ice', 'water', 'creaks', 'bells'], BEDS = ['wind', 'sea', 'engines', 'ice', 'water'];
const near = (a, b, rel) => Math.abs(a - b) <= rel * Math.max(Math.abs(a), Math.abs(b));
const f4 = (v) => (v === 0 ? '0' : v.toFixed(4));
const levelsTxt = (L, keys) => (keys || KEYS).map(k => k + ' ' + f4(L[k])).join(', ');

(async () => {
  const b = await B.launch({ dist });
  // n frames: the part asks for its levels once a frame, after the model's steps of that frame (the page's own passes
  // under the virtual clock; with --real, drawn frames)
  const frames = (n) => (REAL ? b.ev(`new Promise(r => { let k = ${n}; const f = () => (--k <= 0 ? r(true) : requestAnimationFrame(f)); requestAnimationFrame(f); })`) : b.vframes(n));
  // stop the page's clock on the step on which cond holds (a part's 'step' hook, as tools/night_site_test.js does); the
  // page runs on its own passes until then (vrun, the bound in its own time), or with --real on real time
  const holdWhen = async (cond, what) => {
    await b.ev(`(() => { const A = TitanicApp; window.__held = false; const f = A.on('step', (sim) => { if (${cond}) { A.state.playing = false; window.__held = true; A.off('step', f); } }); })()`);
    if (REAL) await b.waitFor('window.__held', 240000, what);
    else await b.vrun('window.__held', { maxMs: 240000, held: false, what });
  };
  // a page expression waited for on the page's own passes (with --real, on real time); at once if it already holds
  const waitPage = (cond, ms, what) => (REAL ? b.waitFor(cond, ms, what) : b.vrun(cond, { maxMs: ms, held: false, what }));
  // the page let run for ms of its own time (with --real, of real time), as a sleep let it before
  const settle = (ms) => (REAL ? B.sleep(ms) : b.vrun(null, { maxMs: ms, held: false }));
  const now = () => b.ev(`(() => { const A = TitanicApp, s = A.state.sim, m = s.mo; return { L: A.sound.levels(), master: A.sound.master(), view: A.sound.view(), pace: A.sound.pace(), t: s.t, U: m ? Math.sqrt(m.u * m.u + m.v * m.v) : 0, kn: m ? Math.sqrt(m.u * m.u + m.v * m.v) / TitanicMotion.KN : 0, n: m ? 0.5 * (Math.abs(m.nP) + Math.abs(m.nS)) : 0, tpm: TitanicCore.readouts(s).inflowTpm, counts: A.sound.counts(), playing: A.state.playing, ct: A.audio() ? A.audio().currentTime : -1 }; })()`);
  try {
    // ---- 1. the 1912 watch from the address; "This night again" (a real click) wakes the page's sound
    await b.open('#night=1912', OPEN);
    if (!(await b.ev('!!(TitanicApp.sound && TitanicApp.sound.levels)'))) throw new Error('TitanicApp.sound is missing: is site/parts/30_sound.js in dist/? (node tools/build_site.js)');
    await b.click('bSameNight');
    await waitPage('TitanicApp.state.sim.night.k < 8 && !!TitanicApp.audio()', 10000, 'the watch again, with its sound');
    await b.ev('TitanicApp.state.warp = 1');
    await waitPage('TitanicApp.state.sim.t >= 1.5', 20000, 'a second and a half of the watch');
    await frames(2);
    const a = await now(), ctl = await b.ev(`(() => { const r = document.getElementById('sndVol'), s = document.getElementById('snd'); return { has: !!r, after: !!(r && s && (s.compareDocumentPosition(r) & Node.DOCUMENT_POSITION_FOLLOWING)), ctx: TitanicApp.audio() ? TitanicApp.audio().state : 'none', bells: TitanicApp.state.sim.night.tBells }; })()`);
    row('the 1912 watch at 22.5 knots before the bells (a real click wakes the sound): wind and sea above zero, ice and water at zero',
      `${a.kn.toFixed(2)} kn; ${levelsTxt(a.L, BEDS)}; bus ${f4(a.master)}; context ${ctl.ctx}`, 'wind, sea > 0; ice, water = 0; the bus > 0',
      a.L.wind > 0 && a.L.sea > 0 && a.L.ice === 0 && a.L.water === 0 && a.master > 0 && ctl.bells < 0 && Math.abs(a.kn - 22.5) < 0.01);
    // the volume control the part adds beside the page's sound switch: a real click at its middle
    await b.click('sndVol');
    await frames(2);
    const vo = await b.ev(`({ v: +document.getElementById('sndVol').value, m: TitanicApp.sound.master(), vol: TitanicApp.sound.volume() })`);
    row('the volume control beside the sound switch (a real click at its middle): the bus follows it', `slider ${vo.v}, bus ${f4(vo.m)}`, 'the bus = slider / 100, about 0.5',
      ctl.has && ctl.after && vo.v > 30 && vo.v < 70 && vo.m === vo.v / 100 && vo.vol === vo.m);

    // ---- 2. where the listener is: the view buttons (real clicks, the night part's Crow's nest and Boat among them); a
    // name no view has is set directly
    const at = async (view, click) => {
      if (click) await b.clickSel(`[data-view="${view}"]`); else await b.ev(`TitanicApp.state.view = ${JSON.stringify(view)}`);
      await frames(2);
      return b.ev('({ L: TitanicApp.sound.levels(), v: TitanicApp.sound.view() })');
    };
    const br = await at('bridge', true), bl = await at('below', true), cr = await at('nest', true), bo = await at('boat', true), un = await at('toString'), as = await at('astern', true);
    row('the listener: on the Bridge the wind is louder than below, and the engines the other way round',
      `Bridge wind ${f4(br.L.wind)}, engines ${f4(br.L.engines)}; Below wind ${f4(bl.L.wind)}, engines ${f4(bl.L.engines)}`, 'wind Bridge > Below; engines Below > Bridge',
      br.v.mix === 'bridge' && bl.v.mix === 'below' && br.L.wind > bl.L.wind && bl.L.engines > br.L.engines);
    const faint = KEYS.every(k => bo.L[k] <= 0.25 * un.L[k] + 1e-15);
    row('  the crow\'s nest as the Bridge for wind and bell; a lifeboat 300 m off: all faint; a view not named (even "toString"): the default mix',
      `nest ${cr.v.mix} wind ${f4(cr.L.wind)}; boat ${bo.v.mix} ${levelsTxt(bo.L, BEDS)}; "toString" ${un.v.mix}`, 'nest = Bridge (wind); boat each <= 1/4 of the default; an unknown name as Astern',
      cr.v.mix === 'nest' && near(cr.L.wind, br.L.wind, 1e-9) && cr.L.bells === br.L.bells && bo.v.mix === 'boat' && faint && un.v.mix === 'default' && KEYS.every(k => near(un.L[k], as.L[k], 1e-9) || un.L[k] === as.L[k]));

    // ---- 3. the engines: Stop on the telegraph (a real click); the rumble follows the wing shafts down
    await b.ev('TitanicApp.state.warp = 2');
    await b.clickSel('#telegraph [data-order="stop"]');
    const eng = [];
    for (let i = 0; i < 4; i++) { await settle(1200); const s = await now(); eng.push({ n: s.n, e: s.L.engines, t: s.t }); }
    await waitPage('TitanicApp.state.sim.mo.nP === 0 && TitanicApp.state.sim.mo.nS === 0', 60000, 'the wing shafts stopped');
    await frames(2);
    const e0 = await now();
    const run = eng.filter(x => x.n > 0), ratio = run.map(x => x.e / x.n);
    const falling = run.every((x, i) => i === 0 || (x.n < run[i - 1].n && x.e < run[i - 1].e));
    row('Stop on the telegraph (a real click): the engines\' rumble comes down with the wing shafts\' revolutions, to nothing',
      run.map(x => x.n.toFixed(1) + ' rpm ' + f4(x.e)).join('; ') + `; stopped: ${f4(e0.L.engines)}`, 'level / revolutions the same at each moment (1e-9), falling, 0 when they stop',
      run.length >= 2 && falling && ratio.every(r => near(r, ratio[0], 1e-9)) && e0.L.engines === 0 && e0.n === 0);

    // ---- 4. her own wind at 10 knots: the same watch from #night=1912&kn=10
    await b.open('#night=1912&kn=10', OPEN);
    await b.click('bSameNight');
    await waitPage('TitanicApp.state.sim.night.k < 8 && !!TitanicApp.audio()', 10000, 'the watch at 10 knots, with its sound');
    await b.ev('TitanicApp.state.warp = 1');
    await waitPage('TitanicApp.state.sim.t >= 1.5', 20000, 'a second and a half at 10 knots');
    await frames(2);
    const c = await now();
    const want = a.L.wind * (10 / 22.5) * (10 / 22.5), wantSea = a.L.sea * (10 / 22.5) * (10 / 22.5);
    row('her own wind follows the square of her speed: the same watch at 10 knots (#night=1912&kn=10)',
      `${c.kn.toFixed(3)} kn: wind ${f4(c.L.wind)}, sea ${f4(c.L.sea)}`, `22.5 knots' ${f4(a.L.wind)} and ${f4(a.L.sea)} x (10/22.5)^2 = ${f4(want)} and ${f4(wantSea)}, within 5 %`,
      c.view.name === a.view.name && near(c.L.wind, want, 0.05) && near(c.L.sea, wantSea, 0.05) && c.L.wind > 0);

    // ---- 5. the 1912 orders (a real click): the ice and the water through the encounter, recorded frame by frame
    await b.open('#night=1912', OPEN);
    await b.click('bAuto');
    await waitPage('TitanicApp.state.night.mode === "auto" && TitanicApp.state.sim.night.k < 8 && !!TitanicApp.audio()', 10000, 'the 1912 orders, with their sound');
    await b.ev(`(() => { const A = TitanicApp, R = window.__rec = { frames: [] };
      R.f = A.on('frame', () => { const s = A.state.sim, L = A.sound.levels(); R.frames.push([s.t, L.ice, L.water, s.openings.length]); });
      A.state.warp = 6; })()`);
    await waitPage('TitanicApp.state.sim.night.tClear >= 0', 180000, 'the end of the encounter');
    await frames(2);
    const enc = await b.ev(`(() => { const A = TitanicApp, s = A.state.sim, w = s.night, e = s.enc, R = window.__rec; A.off('frame', R.f);
      return { frames: R.frames, tTouch: w.tTouch, tClear: w.tClear, tFirst: e.tFirst, tLast: e.tLast, Fmax: e.Fmax, ice: A.sound.ice(), L: A.sound.levels(), k: w.k, fp: TitanicNight.fingerprint(s) }; })()`);
    // a frame holds the strongest step it drew; a slow frame (0.1 s at most) takes up to three steps at this warp, so
    // the window after the last contact step is a second wide
    const F = enc.frames, dt = 0.25, slack = 1.0;
    const before = F.filter(f => f[0] < enc.tFirst), during = F.filter(f => f[0] >= enc.tFirst && f[0] <= enc.tLast + slack), after = F.filter(f => f[0] > enc.tLast + slack);
    const peak = F.reduce((p, f) => (f[1] > p[1] ? f : p), [0, 0]);
    row('the ice: nothing before the touch, a grinding through the contact, nothing once she is clear; its peak inside the contact',
      `${before.length} frames before: max ${f4(Math.max(0, ...before.map(f => f[1])))}; ${during.length} during: max ${f4(peak[1])} at ${peak[0].toFixed(2)} s; ${after.length} after: max ${f4(Math.max(0, ...after.map(f => f[1])))}`,
      `0; > 0, its peak in the contact (${enc.tFirst.toFixed(2)} to ${enc.tLast.toFixed(2)} s); 0`,
      before.length > 10 && before.every(f => f[1] === 0) && during.some(f => f[1] > 0) && after.length > 10 && after.every(f => f[1] === 0) && enc.L.ice === 0 && peak[0] >= enc.tFirst && peak[0] <= enc.tLast + slack);
    row('  the grinding follows the force of each step: its strongest step against the model\'s own peak (the summary\'s Fmax, a sub-step\'s)',
      `${(enc.ice.peakF / 1e6).toFixed(2)} MN in the step to ${enc.ice.peakT.toFixed(2)} s`, `${(enc.Fmax / 1e6).toFixed(2)} MN at most; above 0.8 of it`,
      enc.ice.peakF <= enc.Fmax * (1 + 1e-9) && enc.ice.peakF > 0.8 * enc.Fmax && enc.ice.peakT >= enc.tFirst && enc.ice.peakT <= enc.tLast + dt);
    const bare1 = await b.ev(`(() => { const N = TitanicNight, s = N.create(TitanicCore.buildShip(), N.spec(1912), { auto: true }); while (s.night.k < ${enc.k}) N.step(s); return N.fingerprint(s); })()`);
    const firstHole = F.find(f => f[3] > 0), dry = F.filter(f => f[3] === 0);

    // ---- 6. the ship's bell: run fast to 11:59:50 pm, then her own pace through midnight; the water read there too
    const water = [];
    const bellAt = async (holdT, endT, speed, label) => {
      await b.ev(`TitanicApp.state.speed = ${speed}; TitanicApp.state.playing = true`);
      await holdWhen(`sim.t >= ${holdT}`, label);
      const c0 = await b.ev('TitanicApp.sound.counts()');
      await b.ev('TitanicApp.state.speed = 1; TitanicApp.state.playing = true');
      await waitPage(`TitanicApp.state.sim.t >= ${endT}`, 60000, label + ' and the bell');
      await frames(2);
      const s = await now(), log = await b.ev('TitanicApp.sound.bells()'), clock = await b.ev(`TitanicApp.clockOf(${holdT}, true)`);
      water.push(s);
      return { c0, s, log, clock };
    };
    const mid = await bellAt(1250, 1262, 30, '11:59:50 pm');
    const lm = mid.log[mid.log.length - 1] || {}, gaps = (lm.at || []).slice(1).map((x, i) => x - lm.at[i]);
    const pairs = gaps.length === 7 && gaps.every((g, i) => (i % 2 === 0 ? near(g, gaps[0], 1e-9) : g > gaps[0] * 1.5));
    row('eight bells at midnight by the ship\'s clock (fast to 11:59:50 pm, then her own pace): eight strokes asked, in pairs',
      `held at ${mid.clock}; "${lm.clock}": ${mid.s.counts.strokes - mid.c0.strokes} strokes asked at ${(lm.at || []).map(x => x.toFixed(1)).join(', ')} s`, '12:00:00 am, 8 strokes, two by two',
      lm.clock === '12:00:00 am' && lm.n === 8 && lm.struck && mid.s.counts.strokes - mid.c0.strokes === 8 && pairs && mid.s.L.bells > 0);
    const half = await bellAt(3050, 3062, 60, '12:29:50 am');
    const lh = half.log[half.log.length - 1] || {};
    row('one bell at 12:30', `held at ${half.clock}; "${lh.clock}": ${half.s.counts.strokes - half.c0.strokes} stroke asked`, '12:30:00 am, 1 stroke',
      lh.clock === '12:30:00 am' && lh.n === 1 && lh.struck && half.s.counts.strokes - half.c0.strokes === 1 && half.log.length === mid.log.length + 1);

    // ---- the water: nothing until she is holed, then the rush follows the inflow (the two moments at her own pace)
    const law = await b.ev('({ full: TitanicApp.sound.FULL.water, ref: TitanicApp.sound.LAW.waterTpm })');
    const expect = (s) => law.full * s.view.gains.water * Math.sqrt(Math.min(1, Math.max(0, s.tpm) / law.ref));
    row('the water: nothing until she is holed, then the rush following the inflow: two moments against the model\'s own figures',
      `${dry.length} frames intact at 0; first holed ${firstHole ? firstHole[0].toFixed(2) + ' s' : 'never'}; ` + water.map(s => `${s.tpm.toFixed(1)} t/min -> ${f4(s.L.water)}`).join('; '),
      water.map(s => f4(expect(s))).join(' and ') + ': the full scale x the view x sqrt(inflowTpm / ' + law.ref + '), to 1e-9',
      dry.length > 10 && dry.every(f => f[2] === 0) && !!firstHole && water.length === 2 && water.every(s => s.pace === 1 && s.tpm > 0 && near(s.L.water, expect(s), 1e-9)) && water[0].L.water !== water[1].L.water);

    // ---- 7. silent when it should be: the switch off, paused, and at 60 times her pace (real clicks)
    const allZero = (L) => KEYS.every(k => L[k] === 0);
    await b.click('snd');
    await frames(3);
    const off = await now(), offChecked = await b.ev(`document.getElementById('snd').checked`);
    await b.click('snd');
    await frames(3);
    const on = await now();
    row('the sound switch off (a real click): every level and the bus at zero; on again, back',
      `off: ${levelsTxt(off.L)}, bus ${f4(off.master)}; on: water ${f4(on.L.water)}, bus ${f4(on.master)}`, 'all 0; then the water and the bus again',
      !offChecked && allZero(off.L) && off.master === 0 && on.master > 0 && on.L.water > 0);
    await b.click('bPlay');
    await frames(3);
    const pz = await now();
    row('paused (a real click on Pause): every level and the bus at zero', `playing ${pz.playing}: ${levelsTxt(pz.L)}, bus ${f4(pz.master)}`, 'all 0',
      !pz.playing && allZero(pz.L) && pz.master === 0);
    await b.click('bPlay');
    await b.clickSel('#speedSeg button[data-speed="60"]');
    await frames(3);
    const f60 = await now();
    row('at 60 times her pace (a real click): the beds gone, and the struck sounds with them', `pace ${f60.pace}: ${levelsTxt(f60.L)}; bus ${f4(f60.master)}`, 'all 0 (beds gone by 8 times, struck sounds above 1.6); the bus on',
      f60.pace === 60 && allZero(f60.L) && f60.master > 0);

    // ---- 8. her structure, and nothing fed back: the model alone in the page, to the same step, with the same seed
    await b.ev('TitanicApp.state.playing = false');
    await frames(2);
    const st = await b.ev(`(() => { const A = TitanicApp, s = A.state.sim; return { k: s.night.k, t: s.t, fp: TitanicNight.fingerprint(s), counts: A.sound.counts(), seed: A.sound.seed(), K: A.sound.LAW.creaksPerDeg }; })()`);
    const bare2 = await b.ev(`(() => { const N = TitanicNight, s = N.create(TitanicCore.buildShip(), N.spec(1912), { auto: true }), P = TitanicApp.sound.creakProcess(${st.seed}, s.pitch);
      let d = 0, p = s.pitch; while (s.night.k < ${st.k}) { N.step(s); P.step(s.pitch); d += Math.abs(s.pitch - p) * 180 / Math.PI; p = s.pitch; }
      return { fp: N.fingerprint(s), creaks: P.count, deg: d }; })()`);
    const X = st.K * bare2.deg;
    row('her structure creaks as her trim moves: the count against its law, and the same count from the model alone with the same seed',
      `${st.counts.creaks} creaks (${st.counts.creaksStruck} struck at her pace) in ${bare2.deg.toFixed(3)} deg of trim to ${(st.t / 60).toFixed(1)} min; replayed: ${bare2.creaks}`,
      `${st.K} a degree: ${X.toFixed(1)} +- ${(3 * Math.sqrt(X)).toFixed(1)}; the replay equal`,
      st.counts.creaks === bare2.creaks && Math.abs(st.counts.creaks - X) <= 3 * Math.sqrt(X) + 2 && st.counts.creaksStruck <= st.counts.creaks && X > 20);
    row('the part feeds nothing back: the 1912 orders with the sound on have the fingerprint of the model alone in the page',
      `end of the encounter (step ${enc.k}): ${enc.fp} / ${bare1}; ${(st.t / 60).toFixed(1)} min (step ${st.k}): ${st.fp} / ${bare2.fp}`, 'equal, bit for bit, at both',
      enc.fp === bare1 && st.fp === bare2.fp);

    // ---- 9. the plunge at her own pace: the creaks crowd in; then she is gone and the sound stops with her: since G12's
    // cascade (D98) the default watch is handed over at the break's onset (TitanicApp.gone, goneT, broke), 68 s of her
    // time after 9,380 s. Since Z3 the watch steps on past the hand-over (her fall, a reader of the night,
    // core/readers/fall.js): the page plays on through it, and the part, whose levels need her afloat, is silent there;
    // on the bed the page stops
    await b.ev('TitanicApp.state.speed = 240; TitanicApp.state.playing = true');
    await holdWhen('sim.t >= 9380', 'the plunge');
    const p0 = await now();
    await b.ev('TitanicApp.state.speed = 1; TitanicApp.state.playing = true');
    await settle(6000);
    const p1 = await now();
    row('the plunge at her own pace (6 s from 2:15 am): her structure creaks as the trim runs away, struck and not only counted',
      `${p0.t.toFixed(0)} -> ${p1.t.toFixed(0)} s (sound clock +${(p1.ct - p0.ct).toFixed(1)} s): ${p1.counts.creaks - p0.counts.creaks} creaks, ${p1.counts.creaksStruck - p0.counts.creaksStruck} struck; water ${f4(p1.L.water)}; creaks level ${f4(p1.L.creaks)}`,
      'creaks struck (> 0); the water at full scale x the view',
      p1.counts.creaksStruck - p0.counts.creaksStruck > 0 && p1.counts.creaksStruck - p0.counts.creaksStruck <= p1.counts.creaks - p0.counts.creaks && p1.L.creaks > 0 && p1.L.water > 0);
    await b.ev('TitanicApp.state.speed = 60');
    await waitPage('TitanicApp.gone(TitanicApp.state.sim)', 120000, 'her end (the break\'s onset)');
    await frames(3);
    const end = await now(), endFall = await b.ev('(() => { const A = TitanicApp, s = A.state.sim; return { falling: A.falling(), k: s.fall ? s.fall.k : -1, goneT: A.goneT(s), broke: A.broke(s) }; })()');
    row('she breaks (the default watch, handed over at the break\'s onset): every level and the bus go to 0 with her, while the page plays on through her fall (Z3)', `${endFall.broke ? 'broke' : 'NOT broken'} at ${(endFall.goneT / 60).toFixed(1)} min: ${levelsTxt(end.L)}, bus ${f4(end.master)}; playing ${end.playing}, falling ${endFall.falling} (the fall's step ${endFall.k})`, 'broke; all 0; playing, falling',
      endFall.broke && allZero(end.L) && end.master === 0 && end.playing && endFall.falling);
    await b.ev('TitanicApp.state.speed = 900');
    await waitPage('TitanicApp.state.sim.fall && TitanicApp.state.sim.fall.done', 120000, 'the bed');
    await frames(3);
    const bed = await now(), bedPlay = await b.ev(`document.getElementById('bPlay').textContent`);
    row('  on the bed the page stops, and the sound is still silent', `"${bedPlay}", playing ${bed.playing}: ${levelsTxt(bed.L)}, bus ${f4(bed.master)}`, '"On the bed", stopped; all 0',
      bedPlay === 'On the bed' && !bed.playing && allZero(bed.L) && bed.master === 0);
    row('no error in the page\'s console through all of it', b.errors.length ? b.errors.slice(0, 3).join(' | ') : 'none', 'none', b.errors.length === 0);
    console.log(fails ? `FAIL: ${fails} row(s)` : `PASS: all ${rows.length} rows`);
  } catch (e) {
    fails++; console.log('FAIL the test could not finish: ' + e.message); if (b.errors.length) console.log('page errors: ' + b.errors.slice(0, 5).join(' | '));
  } finally {
    await b.close();
    process.exit(fails ? 1 : 0);
  }
})();
