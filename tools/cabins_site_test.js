// NH2, her rooms and when the water came (site/parts/79_cabins.js), in a real browser (headless Edge or Chrome), with
// nothing beyond Node.
//   node tools/cabins_site_test.js [dist]        (a browser suite: take a turn)
// Checks:
//   - The Damage tab gains her rooms: R3's tables fetched as their own asset when the tab opens. "C 102" typed (real key
//     events) finds its row, Enter picks it, its card says each piece is dry at her start, it is marked on the damage
//     diagram, and "Walk from here" (a real click) starts the walk on its deck at its place.
//   - NH2's names: "C 22" shows whom the Cave list (1912, first class) booked there, as printed, with the list's caveat;
//     "Allison", no room's name, finds the people of that name and their room.
//   - On the 1912 preset to her end, every slab's first wet time the page keeps is at most 0.75 s after a record taken on
//     every step (the part observes on her whole seconds), never before it, and wet and dry alike.
//   - The card's words are the library's at the page's clock.
//   - The 1912 watch with the part reading it has the model's own fingerprint.
//   - Olympic's hull is not tracked.
// The page's clock is virtual (QC C-3): each page is opened with clock=test, so only this suite's passes move it; the
// tables' fetch is the browser's own and is waited for on the wall clock.
// At the join where it meets NH13's packaged app, this suite also runs against Titanic.exe (TITANIC_APP, as D3b runs
// night_site), so that the page's one fetch, of its own rooms' asset, is proved under the app's scheme and policy too.
'use strict';
const path = require('path');
const B = require('./cdp');
const dist = path.resolve(process.argv[2] || path.join(__dirname, '..', 'dist'));
const OPEN = { virtual: true };
const rows = []; let fails = 0;
function row(what, value, ref, ok) { rows.push([what, value, ref, ok]); if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + what.padEnd(96) + ' ' + String(value).padEnd(60) + ' ' + ref); }

(async () => {
  const b = await B.launch({ dist });
  const holdWhen = async (cond, what, ms) => {
    await b.ev(`(() => { const A = TitanicApp; window.__held = false; const f = A.on('step', (sim) => { if (${cond}) { A.state.playing = false; window.__held = true; A.off('step', f); } }); A.state.playing = true; })()`);
    await b.vrun('window.__held', { maxMs: ms || 240000, held: false, what });
  };
  const waitPage = (cond, ms, what) => b.vrun(cond, { maxMs: ms, held: false, what });
  try {
    // ---- 1. the 1912 preset: the Damage tab (a real click) fetches her rooms; "C 102" typed and picked
    await b.open('#scenario=titanic', OPEN);
    await b.ev('TitanicApp.state.playing = false');
    await b.clickSel('[data-tab="damage"]');
    await b.vframes(3);
    await b.waitFor('TitanicApp.cabins.ready() || !!TitanicApp.cabins.error()', 20000, 'her rooms\' tables');
    const rd = await b.ev(`(() => { const A = TitanicApp, I = A.cabins.index(), f = A.cabins.fetched ? A.cabins.fetched() : null, u = performance.getEntriesByType('resource').find(e => /assets\\/rooms\\./.test(e.name));
      return { ready: A.cabins.ready(), err: A.cabins.error(), rows: I ? I.rows.length : 0, labels: I ? I.byLabel.size : 0, url: window.TitanicRoomsURL, got: f, timed: !!u }; })()`);
    // the one fetch, as the part kept it: the asset's own address under the page's scheme or the app's (titanic://, where
    // the browser keeps no resource timing), and its length the asset's
    rd.fetched = !!rd.got && rd.got.bytes > 100000 && /\/assets\/rooms\.[0-9a-f]+\.json$/.test(rd.got.url) && rd.got.url.endsWith(String(rd.url).replace(/^\.?\//, ''));
    await b.clickSel('#cbQuery');
    await b.page.send('Input.insertText', { text: 'C 102' });
    await b.vframes(2);
    const h = await b.ev('TitanicApp.cabins.hits()');
    await b.key('Enter', 'Enter', 13);
    await b.vframes(2);
    const c0 = await b.ev('({ picked: TitanicApp.cabins.picked(), card: TitanicApp.cabins.card(), marks: TitanicApp.diagramMarks() })');
    const mk = c0.marks.find(m => m.owner === 'cabins');
    row('the Damage tab gains her rooms: R3\'s tables fetched as their own asset when it opens; "C 102" typed finds its row, Enter picks it, dry at her start, marked on the damage diagram',
      `${rd.ready ? rd.rows + ' rows, ' + rd.labels + ' numbers from ' + rd.url + (rd.fetched ? ` (fetched: ${rd.got.url}, ${Math.round(rd.got.bytes / 1024)} KB${rd.timed ? '' : '; no resource timing under this scheme'})` : ' (NOT FETCHED' + (rd.got ? ': ' + rd.got.url + ', ' + rd.got.bytes + ' bytes' : '') + ')') : 'NOT READY: ' + rd.err}; hits ${h.map(x => (x.label || '') + ' ' + x.id).join(', ')}; picked ${c0.picked ? c0.picked.label + ' ' + c0.picked.id : 'none'}: "${c0.card.title}", ${c0.card.pieces.length} pieces ${c0.card.pieces.map(p => p.state).join('/')}; mark ${mk ? mk.label + ' at x ' + mk.x0.toFixed(1) + ' to ' + mk.x1.toFixed(1) : 'NONE'}`,
      'ready; C 102 first; C 102 picked, every piece dry; its mark',
      rd.ready && rd.fetched && rd.rows > 500 && h.length > 0 && h[0].label === 'C 102' && c0.picked && c0.picked.label === 'C 102' && !c0.card.hidden && /^C 102 · /.test(c0.card.title) &&
      c0.card.pieces.length > 0 && c0.card.pieces.every(p => p.state === 'dry' && /^Dry on C deck between bulkheads [A-P] and [A-P], (port|starboard) side, so far$/.test(p.words)) && !!mk && mk.label === 'C 102');
    // RC2 (the first ten minutes played cold): the room picked, the other matches fold away and the card stands in the
    // panel's view ("C 22" and Enter on a laptop's panel seemed to do nothing: the card stood under eight matches)
    const vis = await b.ev(`(() => { const p = document.getElementById('panel'), pr = p.getBoundingClientRect(), c = document.getElementById('cbCard').getBoundingClientRect();
      return { folded: document.getElementById('cbHits').hidden, top: Math.round(c.top - pr.top), bottom: Math.round(c.bottom - pr.top), h: Math.round(pr.height) }; })()`);
    row('the room picked (Enter), the other matches fold away and its card stands in the panel\'s view',
      `the matches ${vis.folded ? 'folded' : 'STILL SHOWN'}; the card ${vis.top} to ${vis.bottom} px in the panel's ${vis.h} px`, 'folded; the card\'s top within the panel',
      vis.folded && vis.top >= 0 && vis.top < vis.h);
    // RC2 (Bo's ruling on the red team's row 14, D130): the rooms' credit stands with the section, in the README's and
    // SOURCES.md's words
    const CREDIT = 'Her rooms\' positions and names were read from the deck plans drawn by Bruce Beveridge for Titanic: The Ship Magnificent (The History Press, 2008), as published by Encyclopedia Titanica. No drawing is reproduced, and any error in the tables is ours.';
    const cr = await b.ev('TitanicApp.cabins.credit()');
    row('the rooms\' credit stands with the section: Bruce Beveridge\'s deck plans as Encyclopedia Titanica publishes them; no drawing reproduced (D130)',
      `"${cr.text}" ${cr.shown ? '(shown)' : '(NOT SHOWN)'}`, 'shown, in the README\'s words', cr.shown && cr.text === CREDIT);
    // the walk from the room (a real click), then back
    const wf = await b.ev('TitanicApp.cabins.walkFrom()');
    await b.clickSel('#cbWalk');
    await b.vframes(3);
    const ws = await b.ev('(() => { const s = TitanicApp.walk.state(); const r = { on: s.on, deck: s.deck, x: s.x, y: s.y, view: TitanicApp.state.view }; TitanicApp.walk.leave(); return r; })()');
    row('"Walk from here" (a real click) starts the walk on the room\'s deck at its place',
      `${ws.on ? 'walking' : 'NOT WALKING'} on ${ws.deck} deck at (${ws.x.toFixed(2)}, ${ws.y.toFixed(2)}), view ${ws.view}; the room's place (${wf ? wf.x.toFixed(2) + ', ' + wf.y.toFixed(2) : '-'})`,
      'walking, C deck, within 1.5 m of its place (the walk keeps clear of walls)',
      ws.on && ws.deck === 'C' && !!wf && Math.hypot(ws.x - wf.x, ws.y - wf.y) < 1.5 && ws.view === 'walk');

    // ---- 1b. NH2's names on the room's card (the Cave list of 1912, first class; data/rooms/occupants_1912.json): "C 22"
    // typed and picked shows whom the list booked there, as printed, the line under C 22 first, with the list's caveat;
    // "Allison", no room's name, finds the people of that name and the room the list gives them (a real click picks it)
    const typeQuery = async (text) => {
      await b.ev(`(() => { const q = document.getElementById('cbQuery'); q.value = ''; q.dispatchEvent(new Event('input')); return true; })()`);
      await b.clickSel('#cbQuery');
      await b.page.send('Input.insertText', { text });
      await b.vframes(2);
    };
    await b.clickSel('[data-tab="damage"]');
    await b.vframes(2);
    await typeQuery('C 22');
    await b.key('Enter', 'Enter', 13);
    await b.vframes(2);
    const c22 = await b.ev('({ picked: TitanicApp.cabins.picked(), card: TitanicApp.cabins.card() })');
    await typeQuery('Allison');
    const nh = await b.ev('({ hits: TitanicApp.cabins.hits(), status: document.getElementById("cbStatus").textContent })');
    await b.clickSel('#cbHits li:first-child button');
    await b.vframes(2);
    const np = await b.ev('TitanicApp.cabins.picked()');
    const first = c22.card.people[0] || '';
    row('NH2\'s names: "C 22" picked shows whom the Cave list (1912, first class) booked there, as printed, with the list\'s caveat; "Allison", no room\'s name, finds them and their room (a real click picks it)',
      `${c22.picked ? c22.picked.label + ' ' + c22.picked.id : 'none'}: "${c22.card.peopleHead}" ${c22.card.people.length} line(s), the first "${first}"; the caveat ${c22.card.caveat ? 'shown' : 'NONE'}; "Allison": ${nh.hits.length} hit(s), the first ${nh.hits[0] ? '"' + nh.hits[0].who + '" at ' + nh.hits[0].label + ' (' + nh.hits[0].id + ')' : '-'}; clicked: ${np ? np.label + ' ' + np.id : 'none'}`,
      'C 22: the Cave list, the Allisons first (C22, C26), the caveat; the Allisons at C 22, picked',
      !!c22.picked && c22.picked.label === 'C 22' && c22.card.peopleHead === 'Booked here in the Cave list (1912, first class):' && /^Allison, Mr\. H\. J\.;/.test(first) && /\(C22, C26\)$/.test(first) &&
      !!c22.card.caveat && /printed before she sailed/.test(c22.card.caveat) && /nothing of who was in a room that night/.test(c22.card.caveat) &&
      nh.hits.length > 0 && /^Allison, Mr\. H\. J\./.test(nh.hits[0].who || '') && nh.hits[0].label === 'C 22' && !!np && np.label === 'C 22' && np.id === nh.hits[0].id && np.id === c22.picked.id);
    await b.ev('TitanicApp.cabins.pick("C 102")');   // back to C 102, whose card section 2 reads at her end

    // ---- 2. to her end, a record of every step beside the page's: the run made again from t = 0 with both hooks in place
    await b.ev(`(() => { const A = TitanicApp, CB = TitanicCabins, R = window.__ref = { tr: null };
      A.on('reset', (sim) => { R.tr = CB.track(sim.ship); CB.observe(R.tr, sim); R.done = false; });
      A.on('step', (sim) => { if (!R.tr || R.done) return; CB.observe(R.tr, sim); if (A.gone(sim)) R.done = true; });
      A.loadScenario('titanic'); A.state.playing = false; A.state.speed = 900; })()`);
    await holdWhen('sim.foundered', 'her foundering');
    await b.vframes(40);                           // the card is drawn twice a second of the page's clock
    const cmp = await b.ev(`(() => { const A = TitanicApp, P = A.cabins.track(), R = window.__ref.tr; let wet = 0, late = 0, early = 0, worst = 0, split = 0;
      for (let s = 0; s < R.slabs; s++) {
        const a = P.t[s], r = R.t[s];
        if ((a === null) !== (r === null)) { split++; continue; }
        if (a === null) continue;
        wet++; const d = a - r; if (d < -1e-9) early++; if (d > 0.75 + 1e-9) late++; if (d > worst) worst = d;
      }
      return { slabs: R.slabs, wet, late, early, split, worst, calls: P.calls, refCalls: R.calls, t: A.state.sim.t }; })()`);
    row('on the 1912 preset to her end every slab\'s first wet time is at most 0.75 s after a record of every step, never before it, wet and dry alike',
      `${cmp.wet} of ${cmp.slabs} slabs wet; ${cmp.early} early, ${cmp.late} over 0.75 s late (the worst ${cmp.worst.toFixed(2)} s), ${cmp.split} wet in one record and dry in the other; ${cmp.calls} looks against ${cmp.refCalls}`,
      'none early, none late, none split; about a quarter of the looks',
      cmp.wet > 150 && cmp.early === 0 && cmp.late === 0 && cmp.split === 0 && cmp.calls < cmp.refCalls / 3);
    const c1 = await b.ev(`(() => { const A = TitanicApp, CB = TitanicCabins, I = A.cabins.index(), p = A.cabins.picked(), row = CB.lookup(I, p.label).row, P = A.cabins.track();
      const tr = { t: P.t, step: P.step }, want = CB.wetPieces(tr, row).filter(x => !x.outside).map(x => x.t !== null ? CB.words(x, A.clockOf(x.t)) : 'Dry ' + CB.words(x).replace(/^water /, '') + ', to her end');
      return { card: A.cabins.card(), want }; })()`);
    const got = c1.card.pieces.filter(p => p.state !== 'outside').map(p => p.words);
    row('C 102\'s card at her end: each piece\'s words the library\'s at the page\'s clock, with its depth now',
      got.map((w, i) => '"' + w + '"' + (c1.card.pieces[i] && c1.card.pieces[i].depth ? ' (' + c1.card.pieces[i].depth + ')' : '')).join('; '),
      c1.want.map(w => '"' + w + '"').join('; '),
      got.length === c1.want.length && got.every((w, i) => w === c1.want[i]) && c1.card.pieces.some(p => p.state === 'wet' && p.depth));

    // ---- 3. the 1912 watch with the part reading it: the model's own fingerprint
    await b.open('#night=1912', OPEN);
    await b.click('bAuto');
    await waitPage('TitanicApp.state.night.mode === "auto" && TitanicApp.state.sim.night.k < 20', 10000, 'the 1912 orders');
    await b.clickSel('[data-tab="damage"]');
    await b.vframes(3);
    await b.waitFor('TitanicApp.cabins.ready()', 20000, 'her rooms\' tables');
    await b.ev('TitanicApp.cabins.pick("C 102")');
    await b.ev('TitanicApp.state.warp = 6');
    await waitPage('TitanicApp.state.sim.night.tClear >= 0', 180000, 'the end of the encounter');
    await b.ev('TitanicApp.state.speed = 900');
    // her end on the watch: the break's onset by default since G12's cascade (D98), where the core stops; the model alone
    // in the page, made the same way, stands still there too
    await holdWhen('TitanicApp.gone(sim)', 'the watch\'s end (the break\'s onset)');
    const wf2 = await b.ev('({ k: TitanicApp.state.sim.night.k, fp: TitanicNight.fingerprint(TitanicApp.state.sim), wet: TitanicApp.cabins.track().t.filter(v => v !== null).length })');
    const bare = await b.ev(`(() => { const N = TitanicNight, s = N.create(TitanicCore.buildShip(), N.spec(1912), { auto: true }); while (s.night.k < ${wf2.k}) N.step(s); return N.fingerprint(s); })()`, 300000);
    row('the part feeds nothing back: the 1912 watch it reads has the model\'s own fingerprint', `page ${wf2.fp} at step ${wf2.k} (${wf2.wet} slabs wet)`, `the model alone in the page: ${bare}`, wf2.fp === bare && wf2.wet > 50);   // at the break's onset 83 of the 250 slabs are wet on member C (202 at her flag, where this bound was 100)

    // ---- 4. another hull: Olympic's is not hers, and is not tracked
    await b.open('#scenario=hawke', OPEN);
    await b.vframes(3);
    const ol = await b.ev('({ track: TitanicApp.cabins.track(), scen: TitanicApp.state.scen })');
    row('Olympic\'s hull (the Hawke preset) is not hers: her rooms are not tracked on it', `${ol.scen}: ${ol.track ? 'TRACKED' : 'not tracked'}`, 'not tracked', ol.scen === 'hawke' && ol.track === null);

    row('no error in the page\'s console through all of it', b.errors.length ? b.errors.slice(0, 3).join(' | ') : 'none', 'none', b.errors.length === 0);
    console.log(fails ? `FAIL: ${fails} row(s)` : `PASS: all ${rows.length} rows`);
  } catch (e) {
    fails++; console.log('FAIL the test could not finish: ' + e.message); if (b.errors.length) console.log('page errors: ' + b.errors.slice(0, 5).join(' | '));
  } finally {
    await b.close();
    process.exit(fails ? 1 : 0);
  }
})();
