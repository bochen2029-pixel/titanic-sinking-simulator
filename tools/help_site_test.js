// The calls for help in a real browser (headless Edge or Chrome), through the page's own controls, with nothing beyond
// Node: the panel of site/parts/70_help.js against core/readers/world.js, a rocket fired from it on an exact step,
// "Replay my watch", Carpathia's lights, the watch's fingerprint, a phone.
//   node tools/help_site_test.js [dist] [screenshot dir] [--real]
// The page's clock is virtual (QC C-3, docs/DESIGN_virtual_clock_v1_1_2026-11-21.md): each page is opened with clock=test,
// so only this suite's passes move it (tools/cdp.js's vrun and vframes, 1000/60 ms a pass), and a busy machine changes how
// long the suite takes, never what it sees. Two waits stay on real time: the rocket's burst, because site/parts/70_help.js
// still draws its flight on the wall clock (on tools/clock_tests.js's pending list for its lane), run with the page's clock
// back on real time while the watch is held; and the phone's Run sheet, which slides in as a CSS transition. --real runs it
// all on real time, as before C-3 (four or five minutes), for comparison.
'use strict';
const path = require('path');
const B = require('./cdp');
const REAL = process.argv.includes('--real'), argv = process.argv.slice(2).filter(a => a !== '--real');
const dist = path.resolve(argv[0] || path.join(__dirname, '..', 'dist'));
const shots = argv[1] ? path.resolve(argv[1]) : null;
const OPEN = { virtual: !REAL };                   // each page opened with its clock virtual (clock=test), unless --real
const rows = []; let fails = 0;
function row(what, value, ref, ok) { rows.push([what, value, ref, ok]); if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + what.padEnd(100) + ' ' + String(value).padEnd(70) + ' ' + ref); }

(async () => {
  const b = await B.launch({ dist });
  try {
    // the page's clock stopped on the step a condition first holds (as tools/night_site_test.js does): a click then lands
    // on that very step however busy the machine is; `sim` is the watch in the condition
    // The page runs on its own passes until then (vrun, the bound in its own time), or with --real on real time
    let live = REAL;                                 // the page's clock on real time now: always with --real, else for the burst only
    const holdWhen = async (cond, what, ms) => {
      await b.ev(`(() => { const A = TitanicApp; window.__held = false; const f = A.on('step', (sim) => { if (${cond}) { A.state.playing = false; window.__held = true; A.off('step', f); } }); A.state.playing = true; })()`);
      if (live) await b.waitFor('window.__held', ms || 300000, what);
      else await b.vrun('window.__held', { maxMs: ms || 300000, held: false, what });
    };
    // a page expression waited for on the page's own passes (live, on real time); at once if it already holds
    const waitPage = (cond, ms, what) => (live ? b.waitFor(cond, ms, what) : b.vrun(cond, { maxMs: ms, held: false, what }));
    // the page let run for ms of its own time (live, of real time), as a sleep let it before
    const settle = (ms) => (live ? B.sleep(ms) : b.vrun(null, { maxMs: ms, held: false }));
    const atT = (min) => `sim.night.tTouch >= 0 && sim.t - sim.night.tTouch >= ${min} * 60 - 1e-9`;
    const order = async (id, type) => {                 // a real click, seen in the watch's log
      const n0 = await b.ev('TitanicApp.state.sim.night.log.length');
      await b.click(id);
      await waitPage(`TitanicApp.state.sim.night.log.length > ${n0}`, 5000, 'the order in the watch\'s log');
      return b.ev(`(() => { const L = TitanicApp.state.sim.night.log, o = L[L.length - 1]; return { n: L.length, type: o.type, value: o.value, k: o.k, kNow: TitanicApp.state.sim.night.k, mode: TitanicApp.state.night.mode }; })()`);
    };
    // a picture; under the virtual clock drawn on a pass of its own first
    const shot = async (name) => { if (!shots) return; if (!live) await b.vframes(1, { render: true }); await b.shot(path.join(shots, name)); };
    // the watch alone, in the page: the same orders less this reader's, no reader attached, to the same step
    const bare = (k) => b.ev(`(() => { const N = TitanicNight, L = TitanicApp.state.sim.night.log.filter(o => !/^help:/.test(o.type)); const s = N.create(TitanicApp.ship, N.spec(1912), { readers: false, script: L.map(o => ({ k: o.k, type: o.type, value: o.value, arg: o.arg })) }); while (s.night.k < ${k}) N.step(s); return N.fingerprint(s); })()`);

    // ---- 1. the 1912 orders, given by hand on the steps the script gives them (so that the watch is the player's and
    // "Replay my watch" is offered): the wheel 20.5 s after the bells, reversed at the touch, Stop and Midships a minute
    // later. Then the panel against the reader.
    await b.open('#night=1912', OPEN);
    await b.ev('TitanicApp.state.warp = 6');
    const hand = async (cond, ids, what) => { await holdWhen(cond, what); for (const id of ids) { if (id[0] === '#' || id[0] === '.') { const n0 = await b.ev('TitanicApp.state.sim.night.log.length'); await b.clickSel(id); await waitPage(`TitanicApp.state.sim.night.log.length > ${n0}`, 5000, id + ' in the log'); } else await order(id); } };
    await hand('sim.night.tBells >= 0 && sim.t - sim.night.tBells >= 20.5 - 1e-9', ['bHardPort'], 'the step of the order');
    await hand('sim.night.tTouch >= 0', ['bHardStbd'], 'the touch');
    await hand('sim.night.tTouch >= 0 && sim.mo.t >= sim.night.tTouch + 60', ['#telegraph button[data-order="stop"]', 'bMidships'], 'a minute after the touch');
    const drill = await b.ev(`TitanicApp.state.sim.night.log.map(o => o.type + ':' + (typeof o.value === 'number' ? Math.round(o.value) : o.value) + '@' + o.k).join(' ')`);
    const auto = await b.ev(`(() => { const N = TitanicNight, s = N.create(TitanicApp.ship, N.spec(1912), { auto: true, readers: false }); while (s.night.k < 600) N.step(s); return s.night.log.map(o => o.type + ':' + (typeof o.value === 'number' ? Math.round(o.value) : o.value) + '@' + o.k).join(' '); })()`);
    row('the 1912 orders by hand, each a real click on the step the script gives it', drill, auto + ' (the script\'s log)', drill === auto);
    await b.ev('TitanicApp.state.speed = 120');
    await holdWhen(atT(70), 'T 70 on the 1912 orders');
    await b.ev('TitanicApp.help.render()');
    const p = await b.ev(`(() => { const r = TitanicWorld.readouts(TitanicApp.state.sim), H = TitanicApp.help, set = document.getElementById('helpSet'), rk = document.getElementById('helpRockets');
      return { T: r.T, setText: set.textContent, setWant: H.setWords(r), working: set.dataset.working === String(r.set.working), reach: +set.dataset.reach === Math.round(r.set.reach),
        rkText: rk.textContent, rkWant: H.rocketWords(r), left: +rk.dataset.left, rLeft: r.rockets.left, fired: r.rockets.fired,
        ships: [...document.querySelectorAll('#helpShips li[data-ship]')].map(li => ({ id: li.dataset.ship, state: li.dataset.state, eta: li.dataset.eta, text: li.textContent })),
        want: r.ships.filter(H.known).map(s => ({ id: s.id, state: s.state, eta: s.etaT === null ? undefined : s.etaT.toFixed(2), text: H.shipWords(s) })),
        carp: r.ships.find(s => s.id === 'carpathia'), visible: !document.getElementById('helpSec').hidden }; })()`);
    const shipsSame = JSON.stringify(p.ships) === JSON.stringify(p.want), carpLi = p.ships.find(s => s.id === 'carpathia');
    row('on the 1912 orders (held at T ' + p.T.toFixed(2) + ') the panel says what TitanicWorld.readouts says', p.setText + ' | ' + p.rkText + ' | ' + (carpLi ? carpLi.text : 'no Carpathia'),
      'the same words and numbers: calling on the main dynamos, 1 rocket fired and 35 left, Carpathia coming and expected at ' + p.carp.eta,
      p.visible && p.setText === p.setWant && p.working && p.reach && p.rkText === p.rkWant && p.left === p.rLeft && p.fired === 1 && p.left === 35 && shipsSame && !!carpLi && carpLi.state === 'coming' && carpLi.text.indexOf(p.carp.eta) >= 0 && /reach about 1,500 miles/.test(p.setText));

    // ---- 2. a rocket from the panel on an exact step: logged, drawn, sounded; Replay my watch gives the same world
    const o = await order('bHelpRocket');
    row('a rocket from the panel (a real click on the held step): in the watch\'s log', o.type + ':' + o.value + ' at step ' + o.k + ' (the page on step ' + o.kNow + '); the watch now ' + o.mode, 'help:rocket socket on the held step; the bridge yours', o.type === 'help:rocket' && o.value === 'socket' && o.k === o.kNow && o.mode === 'you');
    await b.ev(`TitanicApp.setView('astern')`);
    await holdWhen('sim.world.rockets.fired >= 2', 'the rocket to go up');
    const rk = await b.ev(`(() => { const r = TitanicWorld.readouts(TitanicApp.state.sim); return { fired: r.rockets.fired, times: r.rockets.times, mine: r.rockets.mine, k: TitanicApp.state.sim.night.k }; })()`);
    // the burst comes 2.4 s after the streak starts [appearance], on the wall clock (70_help.js draws the flight on it until
    // its lane puts it on the page's clock): so in real time, the page's clock back on real time meanwhile, the watch held
    if (!live) { await b.virtual(false); live = true; }
    await B.sleep(2900);
    await shot('help-rocket.png');
    if (!REAL) { await b.virtual(true); live = false; }
    const drawn = await b.ev('TitanicApp.help.rockets()');
    row('  ... it goes up at once (the box is on the bridge since T 66) and is drawn, its report through the sound switch', 'fired ' + rk.fired + ' at T ' + rk.times.map(t => t.toFixed(2)).join(', ') + '; drawn ' + drawn.drawn + ', in the air ' + drawn.live + ', reports ' + drawn.reports,
      'two fired, the second on the step after the click; both drawn; one report at least', rk.fired === 2 && Math.abs(rk.times[1] - 70) < 0.02 && drawn.drawn === 2 && drawn.live >= 1 && drawn.reports >= 1);
    // the world and the fingerprint at a later step, then the replay to that step
    await holdWhen(atT(80), 'T 80');
    const before = await b.ev(`(() => { const s = TitanicApp.state.sim; return { k: s.night.k, fp: TitanicNight.fingerprint(s), lines: JSON.stringify(s.world.lines), ships: JSON.stringify(TitanicWorld.readouts(s).ships), log: s.night.log.length }; })()`);
    const bareFp = await bare(before.k);
    row('the watch\'s fingerprint in the page is the model\'s alone (its orders less the reader\'s, no reader, the same step)', 'page ' + before.fp + ', the model alone ' + bareFp + ' (step ' + before.k + ')', 'equal, bit for bit', before.fp === bareFp);
    await b.click('bReplay');
    await waitPage('TitanicApp.state.night.mode === "replay" && TitanicApp.state.sim.night.k < 60', 10000, 'the replay');
    await b.ev('TitanicApp.state.warp = 6; TitanicApp.state.speed = 120');
    await holdWhen(`sim.night.k >= ${before.k}`, 'the replay to reach step ' + before.k);
    const after = await b.ev(`(() => { const s = TitanicApp.state.sim; return { k: s.night.k, fp: TitanicNight.fingerprint(s), lines: JSON.stringify(s.world.lines), ships: JSON.stringify(TitanicWorld.readouts(s).ships), log: s.night.log.length, n: s.world.lines.length }; })()`);
    row('"Replay my watch" gives the same world: line for line, every ship, the same fingerprint', 'step ' + after.k + '; ' + after.n + ' lines ' + (after.lines === before.lines ? 'equal' : 'DIFFER') + '; ships ' + (after.ships === before.ships ? 'equal' : 'DIFFER') + '; ' + after.fp + ' / ' + before.fp,
      'equal at step ' + before.k, after.k === before.k && after.lines === before.lines && after.ships === before.ships && after.fp === before.fp && after.log === before.log);

    // ---- 3. the call at once: Carpathia comes up, and her lights are drawn on her bearing
    await b.open('#night=1912', OPEN);
    await b.click('bAuto');
    await waitPage('TitanicApp.state.night.mode === "auto" && TitanicApp.state.sim.night.k < 60', 10000, 'the 1912 orders');
    await b.ev('TitanicApp.state.warp = 6; TitanicApp.state.speed = 240');
    await holdWhen(atT(5), 'T 5');
    const whose = `({ mode: TitanicApp.state.night.mode, replay: !document.getElementById('bReplay').disabled, over: TitanicApp.state.night.over, n: TitanicApp.state.sim.night.log.length })`;
    const w0 = await b.ev(whose);
    const oc = await order('bHelpCall');
    const w1 = await b.ev(whose);
    row('the call from the panel, given after the ice on the 1912 orders (a real click on the held step), makes the watch the player\'s, is in the log, and enables "Replay my watch" (S2, Y8)',
      `mode ${w0.mode} -> ${w1.mode}; ${oc.type}:${oc.value} on step ${oc.k} (the page on ${oc.kNow}); Replay ${w0.replay ? 'enabled' : 'disabled'} -> ${w1.replay ? 'enabled' : 'disabled'}`, 'auto -> you; help:call cqd on the held step; disabled -> enabled',
      w0.over && w0.mode === 'auto' && !w0.replay && w1.mode === 'you' && w1.replay && oc.type === 'help:call' && oc.value === 'cqd' && oc.k === oc.kNow && w1.n === w0.n + 1);
    await holdWhen(atT(148), 'T 148', 400000);
    const li = await b.ev(`(() => { const r = TitanicWorld.readouts(TitanicApp.state.sim), c = r.ships.find(s => s.id === 'carpathia'), L = TitanicApp.help.lights().find(x => x.id === 'carpathia'); return { T: r.T, c, L, heard: c.heardT }; })()`);
    const dB = li.L ? Math.abs(((li.L.drawnBrg - li.c.brg) % 360 + 540) % 360 - 180) : null;
    row('the distress call from the panel at T 5 (a real click): Carpathia hears at once; at T 148 she is near and her lights are drawn on her true bearing', 'ordered ' + oc.type + ' at step ' + oc.k + '; heard T ' + (li.heard === null ? 'never' : li.heard.toFixed(2)) + '; at T ' + li.T.toFixed(1) + ' ' + li.c.nm.toFixed(1) + ' nm, bearing ' + li.c.brg.toFixed(1) + '°; drawn ' + (li.L && li.L.visible ? 'at ' + li.L.drawnBrg.toFixed(2) + '°' : 'no'),
      'heard T 5; in sight within 17 nm [bet]; drawn within 0.5° of her bearing', oc.type === 'help:call' && li.heard !== null && Math.abs(li.heard - 5) < 0.02 && li.c.inSight && !!li.L && li.L.visible && dB !== null && dB < 0.5);
    // look along her bearing from the bridge, for the picture
    await b.ev(`(() => { const A = TitanicApp, r = TitanicWorld.readouts(A.state.sim), c = r.ships.find(s => s.id === 'carpathia'); A.setView('bridge'); A.bridge.yaw = c.rel * Math.PI / 180; A.bridge.pitch = -0.01; })()`);
    await settle(1200);
    await shot('help-carpathia-lights.png');
    const fp3 = await b.ev('(() => { const s = TitanicApp.state.sim; return { k: s.night.k, fp: TitanicNight.fingerprint(s) }; })()');
    const bare3 = await bare(fp3.k);
    row('  ... and the fingerprint of that watch is the model\'s alone', 'page ' + fp3.fp + ', the model alone ' + bare3 + ' (step ' + fp3.k + ')', 'equal, bit for bit', fp3.fp === bare3);

    // ---- 4. a phone: the panel's three orders on the screen, sized for a finger
    await b.page.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 780, deviceScaleFactor: 2, mobile: true });
    await b.page.send('Emulation.setTouchEmulationEnabled', { enabled: true });
    await b.open('#night=1912', OPEN);
    await waitPage('TitanicApp.device() === "phone" && !document.getElementById("helpSec").hidden', 10000, 'the phone and the panel');
    await b.clickSel('.tab[data-tab="run"]');
    await B.sleep(500);                                    // the sheet slides in: a CSS transition, on real time either way
    await b.ev(`document.getElementById('helpSec').scrollIntoView({ block: 'end' })`);
    await B.sleep(400);                                    // the scroll and the layout: the browser's, on real time either way
    const ph = await b.ev(`(() => { const ids = ['bHelpCall', 'bHelpRocket', 'bHelpLamp'], r = ids.map(id => document.getElementById(id).getBoundingClientRect()), P = document.getElementById('panel');
      const overlap = r.some((a, i) => r.some((c, j) => j > i && a.left < c.right && c.left < a.right && a.top < c.bottom && c.top < a.bottom));
      const hit = ids.every((id, i) => { const e = document.elementFromPoint(r[i].left + r[i].width / 2, r[i].top + r[i].height / 2); return e && (e.id === id || e.closest('#' + id)); });
      return { device: TitanicApp.device(), w: innerWidth, h: innerHeight, open: P.classList.contains('open'), boxes: r.map(x => [x.left, x.top, x.width, x.height].map(Math.round)), inside: r.every(x => x.left >= 0 && x.right <= innerWidth && x.top >= 0 && x.bottom <= innerHeight), minH: Math.round(Math.min(...r.map(x => x.height))), overlap, hit }; })()`);
    await shot('help-phone.png');
    row('on a phone (390 x 780, touch), the Run sheet open: the three orders on the screen, apart, at least 44 px tall, each the element at its own centre', ph.device + '; sheet ' + (ph.open ? 'open' : 'shut') + '; ' + ph.boxes.map(x => x.join(',')).join(' | ') + '; ' + ph.minH + ' px',
      'phone; inside ' + ph.w + ' x ' + ph.h + '; no overlap; 44 px or more', ph.device === 'phone' && ph.open && ph.inside && !ph.overlap && ph.minH >= 44 && ph.hit);
    const tapped = await order('bHelpLamp');
    row('  ... and a tap on one gives its order', tapped.type + ':' + tapped.value, 'help:lamp cqd', tapped.type === 'help:lamp' && tapped.value === 'cqd');

    row('no error in the page\'s console through all of it', b.errors.length ? b.errors.slice(0, 3).join(' | ') : 'none', 'none', b.errors.length === 0);
    console.log(fails ? `FAIL: ${fails} row(s)` : `PASS: all ${rows.length} rows`);
  } catch (e) {
    fails++; console.log('FAIL the test could not finish: ' + e.message); if (b.errors.length) console.log('page errors: ' + b.errors.slice(0, 5).join(' | '));
  } finally {
    await b.close();
    process.exit(fails ? 1 : 0);
  }
})();
