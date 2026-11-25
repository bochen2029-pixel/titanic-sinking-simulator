// NH3's bands and NH5's gallery in the page (site/app.js's kept set; site/parts/81_gallery.js), in a real browser
// (headless Edge or Chrome), with nothing beyond Node.
//   node tools/gallery_site_test.js [dist]        (a browser suite: take a turn)
// Against the tables in out/ (read here in Node, so the build's inlining is held too):
//   - On the 1912 damage preset as built:
//     - the table applies, and this run's forecast founder is the landed member's;
//     - the forecast's paragraph gives the kept set's founder (least, middle, most, n of N) at her clock;
//     - the Evidence tab's trim, list and water charts carry the kept set's bands, each point the table's.
//   - On a changed run (the bulkheads to D deck) the table does not apply: no words, no bands.
//   - On the 1912 watch on its recorded orders, after the ice: the same from the touch, and the watch's fingerprint is the
//     model's alone.
//   - The gallery: the watch as recorded and every what-if card, in the table's order, each title and sentence the table's.
// The page's clock is virtual (QC C-3): each page is opened with clock=test. The forecasts come from the page's worker on
// the wall clock, and are waited for there.
'use strict';
const fs = require('fs');
const path = require('path');
const B = require('./cdp');
const dist = path.resolve(process.argv[2] || path.join(__dirname, '..', 'dist'));
const OPEN = { virtual: true };
const ENS = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'out', 'ensemble_1912.json'), 'utf8'));
const GAL = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'out', 'gallery_1912.json'), 'utf8'));
const rows = []; let fails = 0;
function row(what, value, ref, ok) { rows.push([what, value, ref, ok]); if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + what.padEnd(96) + ' ' + String(value).padEnd(60) + ' ' + ref); }

(async () => {
  const b = await B.launch({ dist });
  const holdWhen = async (cond, what, ms) => {
    await b.ev(`(() => { const A = TitanicApp; window.__held = false; const f = A.on('step', (sim) => { if (${cond}) { A.state.playing = false; window.__held = true; A.off('step', f); } }); A.state.playing = true; })()`);
    await b.vrun('window.__held', { maxMs: ms || 240000, held: false, what });
  };
  const waitPage = (cond, ms, what) => b.vrun(cond, { maxMs: ms, held: false, what });
  // what the page shows of the kept set now: where the table applies, the forecast's words, each chart's band
  const KEPT = `(() => { const A = TitanicApp, f = A.state.forecast, k = document.getElementById('fcKept');
    return { run: A.kept.run(), shown: k ? k.textContent.trim() : null, sentence: A.kept.sentence(), band: { trim: A.kept.band('trim'), list: A.kept.band('list'), water: A.kept.band('water') },
      founderT: f && f.foundered ? f.founderT : null, overT: f && f.over && !f.foundered ? f.overT : null, touch: A.state.sim.night ? A.state.sim.night.tTouch : 0, inlined: !!window.TitanicEnsemble }; })()`;
  // the table's words for one run, at the page's clock (the words site/app.js keepSentence writes): when the kept set
  // founders, or, on a watch handed over at the break's onset (the default since G12's cascade, D98), when it breaks
  const wantWords = (kr, onset) => b.ev(`(() => { const E = ${JSON.stringify({ founder: ENS.founder, onset: ENS.onset, landed: ENS.landed, members: ENS.members })}, kr = '${kr}', on = ${!!onset}, A = TitanicApp, t0 = A.state.sim.night ? A.state.sim.night.tTouch : 0;
    const at = (T) => A.clockOf(t0 + T * 60) || 'T+' + Math.round(T), F = (on ? E.onset : E.founder)[kr];
    return 'The kept set (the ' + E.members + ' members of the calibration the record could not rule out): ' + (on ? 'she breaks' : 'she founders') + ' in ' + F.n + ' of ' + E.members + ', between ' + at(F.lo) + ' and ' + at(F.hi) + ', ' + at(F.med) + ' in the middle; the landed member, the model\\'s defaults, at ' + at(E.landed[kr][on ? 'onset' : 'founder']) + '.'; })()`);
  const bandsEqual = (got, kr, shift) => ['trim', 'list', 'water'].every(key => {
    const want = ENS.bands[kr].filter(x => x[key] && x[key].lo !== null && x[key].hi !== null).map(x => [x.T + shift, x[key].lo, x[key].hi, x[key].n]);
    return got[key].length === want.length && got[key].every((p, i) => p.every((v, j) => Math.abs(v - want[i][j]) < 1e-9));
  });
  try {
    // ---- 1. the 1912 damage preset as built
    await b.open('#scenario=titanic', OPEN);
    await b.waitFor('!!(TitanicApp.state.forecast && TitanicApp.state.forecast.founderT)', 120000, 'the preset\'s forecast');
    await b.vframes(2);
    const p0 = await b.ev(KEPT), w0 = await wantWords('preset');
    row('on the 1912 preset as built the kept set\'s table applies: this run\'s forecast founder is the landed member\'s, and the forecast\'s paragraph gives the kept set\'s founder at her clock',
      `${p0.run}; the forecast T ${p0.founderT === null ? '-' : (p0.founderT / 60).toFixed(4)} against the landed ${ENS.landed.preset.founder}; "${p0.shown}"`, `preset; equal to 4 decimals; "${w0}"`,
      p0.inlined && p0.run === 'preset' && p0.founderT !== null && Math.abs(p0.founderT / 60 - ENS.landed.preset.founder) < 1e-4 && p0.shown === w0 && p0.sentence === w0);
    row('  and the Evidence tab\'s trim, list and water charts carry its bands, each point the table\'s (every 5 min, least to most of those afloat)',
      `${p0.band.trim.length}, ${p0.band.list.length}, ${p0.band.water.length} points`, `${ENS.bands.preset.length} each, equal`, bandsEqual(p0.band, 'preset', 0));
    // ---- 2. a changed run: the bulkheads to D deck
    await b.ev("TitanicApp.state.bh = 'D'; TitanicApp.loadScenario('titanic')");
    await b.waitFor('!!(TitanicApp.state.forecast && TitanicApp.state.forecast.founderT !== undefined && TitanicApp.state.forecast.seq !== undefined)', 120000, 'the changed run\'s forecast');
    await b.vframes(2);
    const p1 = await b.ev(KEPT);
    row('on a changed run (the bulkheads to D deck) the table does not apply: no words of it, no bands', `${p1.run === null ? 'not applied' : 'APPLIED (' + p1.run + ')'}; words ${p1.shown === null ? 'none' : '"' + p1.shown + '"'}; bands ${p1.band.trim.length + p1.band.list.length + p1.band.water.length} points`, 'not applied; none; 0',
      p1.run === null && p1.shown === null && p1.band.trim.length + p1.band.list.length + p1.band.water.length === 0);
    await b.ev("TitanicApp.state.bh = 'built'");
    // ---- 3. the gallery in the Evidence tab
    await b.clickSel('[data-tab="evidence"]');
    await b.vframes(2);
    const cards = await b.ev('TitanicApp.gallery.cards()');
    const want = [{ id: 'baseline', title: GAL.baseline.title, say: GAL.baseline.say }].concat(GAL.cards.map(c => ({ id: c.id, title: c.title, say: c.say })));
    const bad = want.filter((w, i) => !cards[i] || cards[i].id !== w.id || cards[i].title !== w.title || cards[i].say !== w.say).map(w => w.id);
    row('the gallery in the Evidence tab: the watch as recorded and every what-if, in the table\'s order, each title and sentence the table\'s (D22\'s words)',
      `${cards.length} cards: ${cards.map(c => c.id).join(', ')}${bad.length ? '; DIFFERENT: ' + bad.join(', ') : ''}`, `${want.length}: ${want.map(w => w.id).join(', ')}`, cards.length === want.length && bad.length === 0);
    // RC2 (the first ten minutes played cold): each card's counts in the table's own words. Where every run it counts ends
    // as she breaks (the default watch since D98: t.breaks of t.founders), they say "breaks", never "founders", as the
    // card's own sentence above them does
    const allBreak = [{ id: 'baseline', table: GAL.baseline.table }].concat(GAL.cards.map(c => ({ id: c.id, table: c.table })))
      .filter(c => c.table && c.table.founders > 0 && c.table.breaks === c.table.founders);
    const nb = allBreak.map(c => ({ id: c.id, t: c.table, got: (cards.find(x => x.id === c.id) || {}).nums || '' }))
      .filter(c => !(c.got.indexOf('Breaks in ' + c.t.founders + ' of ' + c.t.N) === 0 && /; she breaks T \d+ \(\d+ to \d+\)/.test(c.got) && !/^Founders in|she founders T/.test(c.got)));
    const base = (cards.find(x => x.id === 'baseline') || {}).nums || '';
    row('the gallery\'s counts in the table\'s own words: where every run counted ends as she breaks, "breaks", never "founders"',
      `${allBreak.length} such cards${nb.length ? '; WRONG: ' + nb.map(c => c.id + ' "' + c.got + '"').join('; ') : ''}; the watch as recorded: "${base}"`, '"Breaks in N of N; she breaks T ..." on each',
      allBreak.length > 0 && nb.length === 0);
    // ---- 4. the 1912 watch on its recorded orders: from the touch; the fingerprint the model's. Since G12's cascade (D98)
    // the watch is handed over at the break's onset by default: the forecast says when she breaks, and the table's words
    // and its landed member are the onset's
    await b.open('#night=1912', OPEN);
    await b.click('bAuto');
    await waitPage('TitanicApp.state.night.mode === "auto" && TitanicApp.state.sim.night.k < 20', 10000, 'the 1912 orders');
    await b.ev('TitanicApp.state.warp = 6');
    await waitPage('TitanicApp.state.sim.night.tClear >= 0', 180000, 'the end of the encounter');
    await b.waitFor('!!(TitanicApp.state.forecast && TitanicApp.state.forecast.by === "watch" && TitanicApp.state.forecast.seq === TitanicApp.state.fcSeq)', 120000, 'the forecast after the ice');
    await b.vframes(2);
    const q0 = await b.ev(KEPT), wq = await wantWords('watch', true);
    row('on the 1912 watch on its recorded orders the table applies from the touch: handed over at the break\'s onset (the default), the forecast\'s onset the landed member\'s, its words ("she breaks") and its bands the table\'s',
      `${q0.run}; the forecast's onset T ${q0.overT === null ? '-' : ((q0.overT - q0.touch) / 60).toFixed(4)} against ${ENS.landed.watch.onset}; "${q0.shown}"; ${q0.band.list.length} points of list`, `watch; equal to 4 decimals; "${wq}"; ${ENS.bands.watch.length}`,
      q0.run === 'watch' && q0.overT !== null && q0.founderT === null && Math.abs((q0.overT - q0.touch) / 60 - ENS.landed.watch.onset) < 1e-4 && q0.shown === wq && bandsEqual(q0.band, 'watch', q0.touch / 60));
    await b.ev('TitanicApp.state.speed = 900');
    await holdWhen('TitanicApp.gone(sim)', 'the watch\'s end (the break\'s onset)');
    const wf = await b.ev('({ k: TitanicApp.state.sim.night.k, fp: TitanicNight.fingerprint(TitanicApp.state.sim), onset: TitanicApp.state.sim.onset && TitanicApp.state.sim.onset.found ? (TitanicApp.state.sim.onset.found.t - TitanicApp.state.sim.night.tTouch) / 60 : null })');
    const bare = await b.ev(`(() => { const N = TitanicNight, s = N.create(TitanicCore.buildShip(), N.spec(1912), { auto: true }); while (s.night.k < ${wf.k}) N.step(s); return N.fingerprint(s); })()`, 300000);
    // the table's landed member is measured at both ends (tools/ensemble.js, handed over at the flag): its onset is the
    // watch's end now, before its founder's step
    row('nothing fed back: the 1912 watch has the model\'s own fingerprint, and ends at the table\'s landed member\'s onset, before its founder\'s step',
      `page ${wf.fp} at step ${wf.k}, the onset T ${wf.onset === null ? '-' : wf.onset.toFixed(4)}`, `the model alone in the page: ${bare}; the table: the onset T ${ENS.landed.watch.onset}, the founder at step ${ENS.landed.watch.k}`,
      wf.fp === bare && wf.onset !== null && Math.abs(wf.onset - ENS.landed.watch.onset) < 1e-4 && wf.k < ENS.landed.watch.k);

    row('no error in the page\'s console through all of it', b.errors.length ? b.errors.slice(0, 3).join(' | ') : 'none', 'none', b.errors.length === 0);
    console.log(fails ? `FAIL: ${fails} row(s)` : `PASS: all ${rows.length} rows`);
  } catch (e) {
    fails++; console.log('FAIL the test could not finish: ' + e.message); if (b.errors.length) console.log('page errors: ' + b.errors.slice(0, 5).join(' | '));
  } finally {
    await b.close();
    process.exit(fails ? 1 : 0);
  }
})();
