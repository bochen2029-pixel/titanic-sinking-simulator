// NH15, the nervous-system view (site/parts/77_nerves.js) in the Systems tab, in a real browser (headless Edge or
// Chrome), with nothing beyond Node (the design's part 6: docs/DESIGN_the_living_ship_v1_2026-11-23.md).
//   node tools/nerves_site_test.js [dist]        (a browser suite: take a turn)
// Checks, against core/readers/nerves.js (U0's NODES, EDGES and RULES, held to the plant by tools/nerves_tests.js):
//   - On a desktop the Systems tab shows the graph: every node and every edge, and under it, in words, the nodes that
//     are not working.
//   - On the 1912 watch, at four held steps (T+30, the bunker of the fire giving way, the dark, the flag), each node's
//     colour, reason and time are the rules' on the page's own sim, its time in the page's way (T plus minutes after
//     the touch).
//   - The watch with the view open has the model's own fingerprint: the part feeds nothing back.
//   - On a phone the view is the list of every node, not the graph.
// The page's clock is virtual (QC C-3): each page is opened with clock=test, so only this suite's passes move it.
'use strict';
const path = require('path');
const B = require('./cdp');
const dist = path.resolve(process.argv[2] || path.join(__dirname, '..', 'dist'));
const OPEN = { virtual: true };
const rows = []; let fails = 0;
function row(what, value, ref, ok) { rows.push([what, value, ref, ok]); if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + what.padEnd(96) + ' ' + String(value).padEnd(60) + ' ' + ref); }
// what the view shows against the rules on the page's own sim, node by node
const AGAINST = `(() => { const A = TitanicApp, NV = TitanicNerves, sim = A.state.sim, st = NV.stateOf(sim), shown = A.nerves.shown(), bad = [], count = {};
  for (const x of shown) {
    const s = st[x.id]; count[s.state] = (count[s.state] || 0) + 1;
    if (x.state !== s.state || x.item !== s.state) bad.push(x.id + ': ' + x.state + ' for ' + s.state);
    if (x.why !== s.why) bad.push(x.id + ': "' + x.why + '" for "' + s.why + '"');
    if (x.t !== A.nerves.timeText(s.t)) bad.push(x.id + ': time "' + x.t + '" for "' + A.nerves.timeText(s.t) + '"');
  }
  const T = sim.night && sim.night.tTouch >= 0 ? (sim.t - sim.night.tTouch) / 60 : null, red = shown.filter(x => x.state === 'red').map(x => x.id);
  return { n: shown.length, bad, count, T, red, k: sim.night ? sim.night.k : null }; })()`;

(async () => {
  const b = await B.launch({ dist });
  const holdWhen = async (cond, what, ms) => {
    await b.ev(`(() => { const A = TitanicApp; window.__held = false; const f = A.on('step', (sim) => { if (${cond}) { A.state.playing = false; window.__held = true; A.off('step', f); } }); A.state.playing = true; })()`);
    await b.vrun('window.__held', { maxMs: ms || 240000, held: false, what });
  };
  const waitPage = (cond, ms, what) => b.vrun(cond, { maxMs: ms, held: false, what });
  try {
    // ---- 1. a desktop: the 1912 watch with its orders, the Systems tab open (a real click): the graph. Its held steps run to
    // the dark and the flag, which come after the break's onset: since G12's cascade (D98) the default watch is handed over
    // there, so this session runs the what-if handed over at her flag (handover=flag: today's watch to the bit)
    await b.open('#night=1912&handover=flag', OPEN);
    await b.click('bAuto');
    await waitPage('TitanicApp.state.night.mode === "auto" && TitanicApp.state.sim.night.k < 20', 10000, 'the 1912 orders');
    await b.clickSel('[data-tab="systems"]');
    await b.vframes(20);
    const g = await b.ev(`(() => { const A = TitanicApp, NV = TitanicNerves, gr = document.getElementById('nvGraph'), items = [...document.querySelectorAll('#nvList li')];
      const shown = items.filter(li => li.getBoundingClientRect().height > 0).map(li => li.dataset.state);
      return { device: A.device(), graph: A.nerves.graphShown(), nodes: gr.querySelectorAll('.nv-node').length, edges: gr.querySelectorAll('.nv-edge').length, N: NV.NODES.length, E: NV.EDGES.length,
        listed: shown.length, listedOk: shown.every(s => s === 'amber' || s === 'red'), notWorking: A.nerves.shown().filter(x => x.state === 'amber' || x.state === 'red').length, place: document.getElementById('nvSec').nextElementSibling === document.getElementById('sysChain').closest('.sec') }; })()`);
    row('on a desktop the Systems tab shows her systems as a graph: every node and edge of core/readers/nerves.js, and under it, in words, those not working',
      `${g.device}; graph ${g.graph ? 'shown' : 'NOT SHOWN'}: ${g.nodes} nodes, ${g.edges} edges (the library's ${g.N}, ${g.E}); listed ${g.listed} (${g.notWorking} not working)${g.listedOk ? '' : ', SOME WORKING'}; before "What depends on what" ${g.place}`,
      `desktop; ${g.N} and ${g.E}; the amber and red ones only`,
      g.device === 'desktop' && g.graph && g.nodes === g.N && g.edges === g.E && g.N > 0 && g.listed === g.notWorking && g.listedOk && g.place);

    // ---- 2. the four held steps: each node's colour, reason and time the rules' on the page's own sim
    await b.ev('TitanicApp.state.warp = 6');
    await waitPage('TitanicApp.state.sim.night.tClear >= 0', 180000, 'the end of the encounter');
    await b.ev('TitanicApp.state.speed = 900');
    const steps = [
      ['T+30', 'sim.night.tTouch >= 0 && sim.t - sim.night.tTouch >= 1800'],
      ['the bunker of the fire gives way', '(sim.pockets || []).some(k => /bunker/i.test(k.name) && k.state !== 0)'],
      ['the dark', 'sim.plant && sim.plant.lights === 0'],
      ['the flag', 'sim.foundered'],
    ];
    const seen = [];
    for (const [what, cond] of steps) {
      await holdWhen(cond, what);
      await b.vframes(20);                         // the view is drawn four times a second of the page's clock
      seen.push([what, await b.ev(AGAINST)]);
    }
    const bad = seen.filter(s => s[1].bad.length);
    row('on the 1912 watch, at T+30, the bunker\'s give-way, the dark and the flag, every node\'s colour, reason and time are the rules\' on the page\'s own sim',
      seen.map(([w, s]) => `${w} (T ${s.T === null ? '-' : s.T.toFixed(2)}): ${s.n} nodes, ${Object.keys(s.count).sort().map(k => s.count[k] + ' ' + k).join(', ')}${s.bad.length ? '; ' + s.bad.slice(0, 2).join('; ') : ''}`).join(' | '),
      'every node as its rule, at each',
      seen.length === 4 && bad.length === 0 && seen.every(s => s[1].n > 0) && seen[3][1].red.length > seen[0][1].red.length);

    // ---- 3. the part feeds nothing back
    const wf = await b.ev('({ k: TitanicApp.state.sim.night.k, fp: TitanicNight.fingerprint(TitanicApp.state.sim) })');
    const bare = await b.ev(`(() => { const N = TitanicNight, s = N.create(TitanicCore.buildShip(), N.spec(1912), { auto: true, handover: 'flag' }); while (s.night.k < ${wf.k}) N.step(s); return N.fingerprint(s); })()`, 300000);
    row('the part feeds nothing back: the 1912 watch with the view open has the model\'s own fingerprint', `page ${wf.fp} at step ${wf.k}`, `the model alone in the page: ${bare}`, wf.fp === bare);

    // ---- 4. a phone: the list of every node, not the graph
    await b.page.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 780, deviceScaleFactor: 2, mobile: true });
    await b.page.send('Emulation.setTouchEmulationEnabled', { enabled: true });
    await b.open('#night=1912', OPEN);
    await b.clickSel('[data-tab="systems"]');      // a real tap: the tab, and the sheet opened (its panes show only open)
    await b.vframes(20);
    const ph = await b.ev(`(() => { const A = TitanicApp, items = [...document.querySelectorAll('#nvList li')];
      return { device: A.device(), graph: A.nerves.graphShown(), list: items.filter(li => li.getBoundingClientRect().height > 0).length, n: TitanicNerves.NODES.length, bad: ${AGAINST}.bad.length }; })()`);
    row('on a phone the view is the list of every node, each with its reason, and no graph',
      `${ph.device}; graph ${ph.graph ? 'SHOWN' : 'hidden'}; ${ph.list} of ${ph.n} nodes listed; ${ph.bad} unlike their rules`, `phone; hidden; all ${ph.n}; none`,
      ph.device === 'phone' && !ph.graph && ph.list === ph.n && ph.bad === 0);
    await b.page.send('Emulation.setTouchEmulationEnabled', { enabled: false });

    row('no error in the page\'s console through all of it', b.errors.length ? b.errors.slice(0, 3).join(' | ') : 'none', 'none', b.errors.length === 0);
    console.log(fails ? `FAIL: ${fails} row(s)` : `PASS: all ${rows.length} rows`);
  } catch (e) {
    fails++; console.log('FAIL the test could not finish: ' + e.message); if (b.errors.length) console.log('page errors: ' + b.errors.slice(0, 5).join(' | '));
  } finally {
    await b.close();
    process.exit(fails ? 1 : 0);
  }
})();
