// NH1, the witness timeline (site/parts/78_ledger.js): the observation ledger in the Evidence tab, in a real browser
// (headless Edge or Chrome), with nothing beyond Node.
//   node tools/evidence_site_test.js [dist]        (a browser suite: take a turn)
// Checks that the Evidence tab shows every row of core/scenarios.js RECORD_1912, in its order. On the 1912 damage preset
// run to her end, every figure the page writes is tools/ledger_tests.js's table's (out/ledger_1912.txt), row by row, to
// its printed digits. A row read before her end keeps its reading to the end. On the 1912 watch the rows are read from
// the touch, its founder row the watch's own; the watch has the model's own fingerprint (the part feeds nothing back).
// Another run has no reading.
// The page's clock is virtual (QC C-3, docs/DESIGN_virtual_clock_v1_1_2026-11-21.md): each page is opened with
// clock=test, so only this suite's passes move it (tools/cdp.js's vrun and vframes), its bounds in the page's own time.
'use strict';
const fs = require('fs');
const path = require('path');
const B = require('./cdp');
const SC = require('../core/scenarios.js');
const dist = path.resolve(process.argv[2] || path.join(__dirname, '..', 'dist'));
const OPEN = { virtual: true };
const rows = []; let fails = 0;
function row(what, value, ref, ok) { rows.push([what, value, ref, ok]); if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + what.padEnd(96) + ' ' + String(value).padEnd(60) + ' ' + ref); }
const f = (x, n) => (x === null || x === undefined || Number.isNaN(x) ? 'n/a' : (+x).toFixed(n === undefined ? 2 : n));
const IDS = SC.RECORD_1912.map(r => r.id);
// the tool's table: its first block of rows, one line each, in RECORD_1912's order
const TABLE = (() => {
  const t = fs.readFileSync(path.join(__dirname, '..', 'out', 'ledger_1912.txt'), 'utf8').split(/\r?\n/), i0 = t.findIndex(l => /^(in|out) +CHECK /.test(l));
  return i0 < 0 ? [] : t.slice(i0, i0 + IDS.length);
})();
// what the tab shows, row by row: each row's state and the figures in its spans; and the part's own account of them
const SHOWN = `(() => { const A = TitanicApp, li = [...document.querySelectorAll('#ldList .ld-row')], q = (e, c) => { const x = e.querySelector(c); return x ? x.textContent : null; };
  return { mode: A.ledger.mode(), done: A.ledger.done(), samples: A.ledger.samples(), sum: document.getElementById('ldSum').textContent, visible: !document.querySelector('[data-pane="evidence"]').hidden,
    dom: li.map(e => ({ id: e.dataset.id, state: e.dataset.state, verdict: q(e, '.ld-verdict'), record: q(e, '.ld-record'), model: q(e, '.ld-model'), miss: q(e, '.ld-miss'), reaches: q(e, '.ld-reaches'), late: q(e, '.ld-late'), who: q(e, '.ld-who'), source: q(e, '.ld-source') })),
    shown: A.ledger.shown(), lines: A.ledger.lines() }; })()`;
// the shown figures are the spans' text: each read row's five figures, and its state
function domAgrees(s) {
  const bad = [];
  s.dom.forEach((d, i) => {
    const x = s.shown[i];
    if (!x || d.id !== x.id) { bad.push((d.id || i) + ': no account'); return; }
    if (x.verdict === 'wait') { if (d.state !== 'wait' || d.verdict !== 'to come') bad.push(d.id + ': shown ' + d.state + ' while it waits'); return; }
    if (d.state !== x.verdict) bad.push(d.id + ': state ' + d.state + ', not ' + x.verdict);
    for (const k of ['record', 'model', 'miss', 'reaches', 'late']) if (d[k] !== x[k]) bad.push(d.id + ': ' + k + ' "' + d[k] + '", not "' + x[k] + '"');
  });
  return bad;
}

(async () => {
  const b = await B.launch({ dist });
  // stop the page's clock on the first step where `cond` holds (page code on `sim`), running its passes until then
  const holdWhen = async (cond, what, ms) => {
    await b.ev(`(() => { const A = TitanicApp; window.__held = false; const f = A.on('step', (sim) => { if (${cond}) { A.state.playing = false; window.__held = true; A.off('step', f); } }); A.state.playing = true; })()`);
    await b.vrun('window.__held', { maxMs: ms || 240000, held: false, what });
  };
  const waitPage = (cond, ms, what) => b.vrun(cond, { maxMs: ms, held: false, what });
  try {
    row('the tool\'s table is there: out/ledger_1912.txt, a line for each row of RECORD_1912', TABLE.length + ' lines for ' + IDS.length + ' rows', IDS.length + '', TABLE.length === IDS.length && TABLE.every((l, i) => l.includes(' CHECK ' + IDS[i] + ' ')));

    // ---- 1. the 1912 damage preset: the tab's rows, each waiting until the run reaches it; at T 60; to her end
    await b.open('#scenario=titanic', OPEN);
    await b.clickSel('[data-tab="evidence"]');
    await b.vframes(3);
    const s0 = await b.ev(SHOWN);
    const read0 = s0.shown.filter(x => x.verdict !== 'wait').map(x => x.id);
    row('the Evidence tab gains the ledger: every row of RECORD_1912, in its order, each with its witness and source; at her start only the row at T 0 read, the rest to come',
      `${s0.dom.length} rows (${s0.mode}), tab ${s0.visible ? 'shown' : 'HIDDEN'}; read: ${read0.join(', ') || 'none'}; ${s0.dom.filter(d => d.who && d.source).length} with witness and source; "${s0.sum}"`,
      IDS.length + ' in order; trim_at_touch; all',
      s0.visible && s0.mode === 'preset' && s0.dom.length === IDS.length && s0.dom.every((d, i) => d.id === IDS[i]) && read0.join() === 'trim_at_touch' && s0.dom.every(d => d.who && d.source) && domAgrees(s0).length === 0);
    await b.ev('TitanicApp.state.speed = 900');
    await holdWhen('sim.t >= 3600', 'T 60 on the preset');
    await b.vframes(70);                           // the tab is drawn once a second of the page's clock
    const s60 = await b.ev(SHOWN);
    await holdWhen('sim.foundered', 'her foundering');
    await b.vframes(3);
    const sEnd = await b.ev(SHOWN);
    const same = sEnd.lines.filter((l, i) => l === TABLE[i]).length, diff = sEnd.lines.map((l, i) => [l, TABLE[i], IDS[i]]).filter(p => p[0] !== p[1]);
    const domBad = domAgrees(sEnd);
    row('on the 1912 preset to her end, every figure the tab writes is the tool\'s table\'s, row by row, to its printed digits (out/ledger_1912.txt)',
      `${same} of ${IDS.length} lines equal; ${sEnd.samples} samples; the tab's spans ${domBad.length ? 'DIFFER: ' + domBad.slice(0, 3).join('; ') : 'the same strings'}${diff.length ? '; first differing: ' + diff[0][2] + ' "' + (diff[0][0] || 'unread').trim() + '" against "' + (diff[0][1] || '').trim() + '"' : ''}; "${sEnd.sum}"`,
      'all ' + IDS.length + '; 1990 samples (one every 5 s and the flag\'s)',
      sEnd.done && same === IDS.length && domBad.length === 0 && sEnd.samples === 1990);
    const kept = s60.shown.map((x, i) => [x, sEnd.shown[i]]).filter(p => p[0].verdict !== 'wait');
    const moved = kept.filter(p => ['verdict', 'record', 'model', 'miss'].some(k => p[0][k] !== p[1][k]) || (p[0].reaches !== 'not yet' && p[0].reaches !== p[1].reaches) || (p[0].reaches !== 'not yet' && p[0].late !== p[1].late));
    const notYet = kept.filter(p => p[0].reaches === 'not yet').map(p => p[0].id + ' -> ' + p[1].reaches);
    row('a row read before her end keeps its reading to the end (at T 60: the rows whose time had passed; a first time at the witness\'s level "not yet" until it comes)',
      `${kept.length} read at T 60 (${s60.shown.filter(x => x.verdict === 'wait').length} to come), ${moved.length} changed${moved.length ? ': ' + moved.map(p => p[0].id).join(', ') : ''}; "not yet" then: ${notYet.join(', ') || 'none'}; ${domAgrees(s60).length} shown otherwise`,
      'none changed; the tab as its account',
      kept.length >= 8 && moved.length === 0 && domAgrees(s60).length === 0 && s60.shown.some(x => x.verdict === 'wait'));

    // ---- 2. the 1912 watch with its orders: read from the touch; its founder row the watch's own; the fingerprint the model's.
    // The founder is the flag's: since G12's cascade (D98) the default watch is handed over at the break's onset, so this
    // session runs the what-if handed over at her flag (handover=flag: today's watch to the bit), as the ledger's founder
    // row is read; the model alone in the page is made the same way
    await b.open('#night=1912&handover=flag', OPEN);
    await b.click('bAuto');
    await waitPage('TitanicApp.state.night.mode === "auto" && TitanicApp.state.sim.night.k < 20', 10000, 'the 1912 orders');
    await b.clickSel('[data-tab="evidence"]');
    await b.vframes(3);
    const w0 = await b.ev(SHOWN);
    await b.ev('TitanicApp.state.warp = 6');
    await waitPage('TitanicApp.state.sim.night.tClear >= 0', 180000, 'the end of the encounter');
    await b.ev('TitanicApp.state.speed = 900');
    await holdWhen('sim.foundered', 'the watch\'s foundering');
    await b.vframes(3);
    const wEnd = await b.ev(SHOWN);
    const wf = await b.ev('(() => { const s = TitanicApp.state.sim; return { k: s.night.k, fp: TitanicNight.fingerprint(s), T: (s.founderT - s.night.tTouch) / 60, onset: s.onset && s.onset.found ? (s.onset.found.t - s.night.tTouch) / 60 : null }; })()');
    const bare = await b.ev(`(() => { const N = TitanicNight, s = N.create(TitanicCore.buildShip(), N.spec(1912), { auto: true, handover: 'flag' }); while (s.night.k < ${wf.k}) N.step(s); return N.fingerprint(s); })()`, 300000);
    const fo = wEnd.shown[IDS.indexOf('founder')], bo = wEnd.shown[IDS.indexOf('break_onset')], wWant = 'T ' + f(wf.T, 1);
    row('on the 1912 watch the rows are read from the touch: none before it; at her end every row read, the founder row the watch\'s own time after the touch, the onset its reader\'s',
      `before the touch: ${w0.mode}, ${w0.samples} samples; at the end ${wEnd.shown.filter(x => x.verdict !== 'wait').length} of ${IDS.length} read, ${wEnd.samples} samples; founder "${fo.model}", the onset "${bo.model}"; "${wEnd.sum}"`,
      `none, 0; all; "${wWant}"; "${wf.onset === null ? 'the end' : 'T ' + f(wf.onset, 1)}"`,
      w0.mode === 'watch' && w0.samples === 0 && wEnd.done && wEnd.shown.every(x => x.verdict !== 'wait') && fo.model === wWant && (wf.onset === null || bo.model === 'T ' + f(wf.onset, 1)) && domAgrees(wEnd).length === 0);
    row('the part feeds nothing back: the 1912 watch read by it has the model\'s own fingerprint',
      `page ${wf.fp} at step ${wf.k}`, `the model alone in the page: ${bare}`, wf.fp === bare);

    // ---- 3. another run: no reading
    await b.open('#scenario=four', OPEN);
    await b.clickSel('[data-tab="evidence"]');
    await b.ev('TitanicApp.state.speed = 900');
    await b.vframes(120);
    const s4 = await b.ev(SHOWN);
    row('another run (four compartments open) has no reading: the rows are the 1912 night\'s, and the tab says so',
      `${s4.mode === null ? 'no run read' : 'READ as ' + s4.mode}; ${s4.shown.filter(x => x.verdict !== 'wait').length} read; "${s4.sum}"`, 'none; the 1912 night\'s',
      s4.mode === null && s4.samples === 0 && s4.shown.every(x => x.verdict === 'wait') && /1912 night/.test(s4.sum));

    row('no error in the page\'s console through all of it', b.errors.length ? b.errors.slice(0, 3).join(' | ') : 'none', 'none', b.errors.length === 0);
    console.log(fails ? `FAIL: ${fails} row(s)` : `PASS: all ${rows.length} rows`);
  } catch (e) {
    fails++; console.log('FAIL the test could not finish: ' + e.message); if (b.errors.length) console.log('page errors: ' + b.errors.slice(0, 5).join(' | '));
  } finally {
    await b.close();
    process.exit(fails ? 1 : 0);
  }
})();
