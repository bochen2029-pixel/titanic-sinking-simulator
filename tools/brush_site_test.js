// G27: the damage brush on a watch (docs/DESIGN_G27_the_brush_on_a_watch_v1_2026-11-24.md) in a real browser (headless
// Edge or Chrome), on the page's virtual clock (QC C-3: each page opened with clock=test; --real runs it on real time).
//   node tools/brush_site_test.js [dist] [--real]
//   1. on the 1912 watch, held at T+10, a hole made by the brush's own path (TitanicApp.holeAt, which a tap on the hull
//      calls) is the watch's `hole` order with the rounded place and area; the watch keeps its own orders (it is not
//      taken over: no man on the bridge gave it); she has one more opening
//      and a watch holed by hand is not the recorded night: the kept set's bands give way to the run alone (keptRun)
//   2. on a watch neither "Remove all openings" nor a hole's x takes anything away (the x disabled, with the same words)
//   3. run on to her end: the page's watch is the model alone in this page with the same log, to the bit, and within 5 s
//      of Node's replay of that log
//   4. the bridge learns of the holed room's water by the reports (boiler room 1 named in the feed)
//   5. the watch's link opens as a replay, the hole accepted, and ends on the same step with the same fingerprint
//   6. no error in the page's console
'use strict';
const path = require('path');
const B = require('./cdp');
const C = require('../core/core.js');
const N = require('../core/night.js');
const REAL = process.argv.includes('--real'), argv = process.argv.slice(2).filter(a => a !== '--real');
const dist = path.resolve(argv[0] || path.join(__dirname, '..', 'dist'));
const OPEN = { virtual: !REAL };
const rows = []; let fails = 0;
function row(what, value, ref, ok) { rows.push([what, value, ref, ok]); if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + what.padEnd(96) + ' ' + String(value).padEnd(60) + ' ' + ref); }

(async () => {
  const b = await B.launch({ dist });
  // the page's clock stopped on the first step where cond holds (page code on `sim`; tools/night_site_test.js)
  const holdWhen = async (cond, what, ms) => {
    await b.ev(`(() => { const A = TitanicApp; window.__held = false; const f = A.on('step', (sim) => { if (${cond}) { A.state.playing = false; window.__held = true; A.off('step', f); } }); })()`);
    if (REAL) await b.waitFor('window.__held', ms || 180000, what);
    else await b.vrun('window.__held', { maxMs: ms || 180000, held: false, what });
  };
  const waitPage = (cond, ms, what) => (REAL ? b.waitFor(cond, ms, what) : b.vrun(cond, { maxMs: ms, held: false, what }));
  const endOf = (w) => (w.foundered ? w.founderT : (w.night.onset && w.night.onset.found ? w.night.onset.found.t : -1));
  const atEnd = `(() => { const A = TitanicApp, s = A.state.sim; return { t: A.goneT(s), broke: A.broke(s), k: s.night.k, fp: TitanicNight.fingerprint(s),
    log: s.night.log.map(o => ({ k: o.k, type: o.type, value: o.value, arg: o.arg })), feed: s.reports ? s.reports.feed.map(e => e.who + ': ' + e.words) : [], link: A.nightEnd.link(), opened: A.nightEnd.opened }; })()`;
  try {
    const bx = C.zoneBounds(), K = 9, X = +(0.5 * (bx[K] + bx[K + 1])).toFixed(2);   // boiler room 1, starboard, 4 m up, 0.5 m2
    // ---- 1. the brush on the 1912 watch at T+10
    await b.open('#night=1912', OPEN);
    await b.click('bAuto');
    await waitPage('TitanicApp.state.night.mode === "auto" && TitanicApp.state.sim.night.k < 20', 10000, 'the 1912 orders');
    await b.ev('TitanicApp.state.warp = 6');
    await waitPage('TitanicApp.state.sim.night.tClear >= 0', 120000, 'the end of the encounter');
    await b.ev('TitanicApp.state.speed = 60');            // ten minutes of her time in ten seconds of the page's; held on the step
    await holdWhen('sim.night.tTouch >= 0 && sim.t - sim.night.tTouch >= 600', 'T+10', 300000);
    const before = await b.ev(`(() => { const s = TitanicApp.state.sim; return { n: s.openings.length, mode: TitanicApp.state.night.mode, kept: TitanicApp.kept.run() }; })()`);
    const got = await b.ev(`TitanicApp.holeAt(${X}, 4.004, -1, 0.50004)`);
    const after = await b.ev(`(() => { const s = TitanicApp.state.sim, L = s.night.log, l = L[L.length - 1]; return { n: s.openings.length, mode: TitanicApp.state.night.mode, last: [l.type, l.value, l.arg], script: !!s.night.script, kept: TitanicApp.kept.run() }; })()`);
    row('1. the brush on the 1912 watch at T+10: a `hole` order in its log, rounded; the watch keeps its own orders (not taken over); one more opening',
      `${JSON.stringify(after.last)}, mode ${after.mode}${after.script ? ', its script still running' : ', SCRIPT DROPPED'}, openings ${before.n} -> ${after.n}`, `["hole",[${X},4,-1],0.5], auto`,
      !!got && after.last[0] === 'hole' && JSON.stringify(after.last[1]) === JSON.stringify([X, 4, -1]) && after.last[2] === 0.5 && after.mode === before.mode && after.script && after.n === before.n + 1);
    row('  ... and a watch holed by hand is not the recorded night: the kept set\'s bands and sentence give way to this run alone',
      `kept run before the hole "${before.kept}", after it ${JSON.stringify(after.kept)}`, '"watch", then null', before.kept === 'watch' && after.kept === null);
    // ---- 2. "Remove all openings" and a hole's x on a watch: neither takes anything away (the coordinator's ruling, 02:27)
    await b.ev(`document.getElementById('bClear').click()`);
    const xRow = await b.ev(`(() => { const x = document.querySelector('#holeBody button.x'); if (!x) return null; const d = x.disabled, t = x.title; x.click(); return { disabled: d, title: t, n: TitanicApp.state.sim.openings.length }; })()`);
    const kept = await b.ev('TitanicApp.state.sim.openings.length');
    row('2. on a watch neither "Remove all openings" nor a hole\'s x takes anything away (the x disabled, with the same words)',
      `${kept} openings; the x ${xRow ? (xRow.disabled ? 'disabled' : 'ENABLED') + ', "' + xRow.title + '"' : 'NOT FOUND'}`, `${after.n}; disabled, "On a watch the holes are part of the night. ..."`,
      kept === after.n && !!xRow && xRow.disabled && /part of the night/.test(xRow.title) && xRow.n === after.n);
    // ---- 3 and 4. on to her end
    await b.ev('TitanicApp.state.speed = 900');
    await b.ev('TitanicApp.state.playing = true');
    await holdWhen('TitanicApp.gone(sim)', 'her end', 300000);
    const end = await b.ev(atEnd);
    const alone = await b.ev(`(() => { const NN = TitanicNight, log = ${JSON.stringify(end.log)};
      const w = NN.create(TitanicCore.buildShip(), NN.spec(1912), { script: log, readers: false });
      NN.sink(w); return { t: w.foundered ? w.founderT : (w.night.onset && w.night.onset.found ? w.night.onset.found.t : -1), k: w.night.k, fp: NN.fingerprint(w) }; })()`);
    const node = N.replay(C.buildShip(), N.spec(1912), end.log, end.k), tNode = endOf(node);
    row('3. on to her end: the page\'s watch is the model alone in this page with the same log, to the bit, and within 5 s of Node\'s',
      `the page T ${end.t} s (${end.broke ? 'broke' : 'foundered'}), ${end.fp} at step ${end.k}; alone ${alone.t} s, ${alone.fp} at ${alone.k}; Node ${tNode} s`, 'the same to the bit; Node within 5 s',
      end.t === alone.t && end.fp === alone.fp && end.k === alone.k && Math.abs(end.t - tNode) <= 5);
    const heard = end.feed.filter(s => /boiler room 1\b/i.test(s));
    row('4. the bridge learns of the holed room\'s water by the reports', heard.length ? `"${heard[0]}"` : 'NOT HEARD (' + end.feed.length + ' reports)', 'boiler room 1 named in the feed', heard.length > 0);
    // ---- 5. its link replays it
    const frag = end.link.slice(end.link.indexOf('#'));
    await b.open(frag, OPEN);
    await b.ev('TitanicApp.state.warp = 25');
    await waitPage('TitanicApp.state.sim.night.tClear >= 0', 120000, 'the end of the encounter, replayed');
    await b.ev('TitanicApp.state.speed = 900');
    await holdWhen('TitanicApp.gone(sim)', 'the replay\'s end', 300000);
    const rep = await b.ev(atEnd);
    const holes = rep.log.filter(o => o.type === 'hole').length;
    row('5. the watch\'s link opens as a replay, the hole accepted, and ends on the same step with the same fingerprint',
      `${rep.opened}; ${holes} hole in its log; ${rep.fp} at step ${rep.k}`, `replay; 1 hole; ${end.fp} at step ${end.k}`, rep.opened === 'replay' && holes === 1 && rep.fp === end.fp && rep.k === end.k);
    row('6. no error in the page\'s console through all of it', b.errors.length ? b.errors.slice(0, 3).join(' | ') : 'none', 'none', b.errors.length === 0);
    console.log(fails ? `FAIL: ${fails} row(s)` : `PASS: all ${rows.length} rows`);
  } catch (e) {
    fails++; console.log('FAIL the test could not finish: ' + e.message); if (b.errors.length) console.log('page errors: ' + b.errors.slice(0, 5).join(' | '));
  } finally {
    await b.close();
    process.exit(fails ? 1 : 0);
  }
})();
