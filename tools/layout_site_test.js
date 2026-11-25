// The stage's layout at six sizes, in ten states of a night (QC C-4's step 0; docs/DESIGN_page_layout_authority_v1_2026-11-21.md,
// section 3; D78): tools/layout_check.js evaluated in a real browser (headless Edge or Chrome), with nothing beyond Node.
//   node tools/layout_site_test.js [dist] [picture dir]     (about ten minutes; a picture of every state when a folder is given)
// Step 0 measured and moved nothing: every fault was a CHECK row. Since C-4's step 2 (the parts' overlays in the grid's
// areas) each state is a MUST row: no fault (D78). The list of states and what each shows is the table
// out/layout_site_test.txt (tracked, without pixel counts: when it changes, the gate says STALE, so a lane sees what it
// moved). What fails the suite: a fault in any state; a state not reached; the check not finding the faults planted to
// test it at each size; an error in the page's console.
// The sizes (D78): a phone upright (390 x 780) and on its side (844 x 390), and a tablet (820 x 1180), all three with touch
// (coarse pointers: the page's own device classes); a narrow desktop (1024 x 700), the gate's desktop (1400 x 860), a wide
// desktop (1920 x 1080). Touch sizes at two device pixels to the CSS pixel: the layout is in CSS pixels, and a higher ratio
// would only cost the software renderer time.
// The states, in two runs at each size, each on an exact step (a part's 'step' hook stops the page's clock; never polling):
// the 1912 preset running, foundered (the end card) and its pieces at rest (the deep's strip); the 1912 watch on the bridge
// before the ice, in the reports' view ("As the bridge knew it"), in the Night look, on a walk, after the ice (the boats'
// count), at the break (G12's cascade: the default watch's end, "She broke"), and at rest; at the wide size the end card at
// rest has its room (G28). A notice is given in every state (the page's; in the reports' view their own, as their
// say() shows it), so that the table does not hang on how long a notice lasts; the director's caption is given (the
// director turned on, then off again) in every state but the walk (it would end the walk) and the reports' view. The
// toggles are set through the elements' own click() or change event: the controls themselves are other suites' business,
// and on a phone some sit in the closed sheet.
'use strict';
const fs = require('fs');
const path = require('path');
const B = require('./cdp');
const L = require('./layout_check');
const outFile = require('./outdir');
const dist = path.resolve(process.argv[2] || path.join(__dirname, '..', 'dist'));
const shots = process.argv[3] ? path.resolve(process.argv[3]) : null;

const SIZES = [
  { id: 'phone', w: 390, h: 780, dpr: 2, touch: true, say: 'a phone upright' },
  { id: 'phone-side', w: 844, h: 390, dpr: 2, touch: true, say: 'a phone on its side' },
  { id: 'tablet', w: 820, h: 1180, dpr: 2, touch: true, say: 'a tablet' },
  { id: 'narrow', w: 1024, h: 700, dpr: 1, touch: false, say: 'a narrow desktop' },
  { id: 'desktop', w: 1400, h: 860, dpr: 1, touch: false, say: 'the gate\'s desktop' },
  { id: 'wide', w: 1920, h: 1080, dpr: 1, touch: false, say: 'a wide desktop' },
];
// a notice of the length the page's own have (the model's news at the flag, a view button's), given in every state
const NOTICE = 'Foundered at 2:20 am, 2 h 40 min after the touch: a notice as long as the page\'s own, given for the layout';

const rows = []; let fails = 0;
function row(what, value, ref, ok) { rows.push([what, value, ref, ok]); if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + what.padEnd(100) + ' ' + String(value).padEnd(70) + ' ' + ref); }
const table = [], pictures = [];
let checks = 0, faultCount = 0;

(async () => {
  let b = null;
  const errors = [];
  const open = async (sz) => {
    b = await B.launch({ dist, width: sz.touch ? 1400 : sz.w, height: sz.touch ? 860 : sz.h });
    await b.page.send('Emulation.setDeviceMetricsOverride', { width: sz.w, height: sz.h, deviceScaleFactor: sz.dpr, mobile: !!sz.touch });
    if (sz.touch) await b.page.send('Emulation.setTouchEmulationEnabled', { enabled: true });
  };
  const close = async () => { if (!b) return; errors.push(...b.errors); await b.close(); b = null; };
  const frames = (n) => b.ev(`new Promise(r => { let k = ${n || 3}; const f = () => (--k > 0 ? requestAnimationFrame(f) : r(true)); requestAnimationFrame(f); })`);
  const page = async (hash) => { await b.open(hash); await b.ev('document.fonts.ready.then(() => true)'); await frames(4); };
  // the clock stopped on the step where cond holds (a part's 'step' hook, in place before the clock runs on at speed)
  const holdWhen = async (cond, what, speed, ms) => {
    await b.ev(`(() => { const A = TitanicApp; window.__held = false; const f = A.on('step', (sim) => { if (${cond}) { A.state.playing = false; window.__held = true; A.off('step', f); } });
      A.state.speed = ${speed || 900}; A.state.playing = true; })()`);
    await b.waitFor('window.__held', ms || 240000, what);
  };
  const toBed = async (what) => {
    await b.ev('TitanicApp.state.speed = 900; TitanicApp.state.playing = true');
    await b.waitFor('TitanicApp.state.sim.fall && TitanicApp.state.sim.fall.done', 240000, what);
  };
  const tap = (sel) => b.ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false; e.click(); return true; })()`);
  const director = (on) => b.ev(`(() => { const d = document.getElementById('bDirector'); if (!d || !TitanicApp.director) return null; if (TitanicApp.director.on() !== ${on}) d.click(); return TitanicApp.director.on(); })()`);
  const rpView = (on) => b.ev(`(() => { const v = document.getElementById('rpView'); if (!v) return null; v.checked = ${on}; v.dispatchEvent(new Event('change')); return document.documentElement.classList.contains('rp-bridge'); })()`);
  const shot = async (name, sz) => {
    if (!shots) return;
    // in CSS pixels, at most 1,400 wide (the page's own size: what the eye judges a layout by)
    const scale = Math.min(1, 1400 / sz.w) / sz.dpr;
    const r = await b.page.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: sz.w, height: sz.h, scale } });
    const p = path.join(shots, name), buf = Buffer.from(r.data, 'base64');
    fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, buf);
    pictures.push([path.relative(path.join(__dirname, '..'), p).replace(/\\/g, '/'), buf.readUInt32BE(16), buf.readUInt32BE(20)]);
  };
  // G28: on a large monitor (the wide size) the end card at rest, on the preset and the watch, whether it scrolls
  const g28 = [];
  // one state measured: the layout given time to settle (its fit pass runs a frame after any change), a notice and the
  // caption given, then the check; the caption taken back after. A MUST row: no fault
  const check = async (sz, state, expect, o) => {
    o = o || {};
    await frames(3); await B.sleep(1200);
    let cap = null;
    if (o.caption) cap = await director(true);
    if (o.rp) await b.ev(`(() => { const t = document.getElementById('rpToast'); if (!t) return false; t.textContent = ${JSON.stringify(NOTICE)}; t.classList.add('on'); return true; })()`);
    else await b.ev(`(() => { TitanicApp.toast(${JSON.stringify(NOTICE)}); return true; })()`);
    await frames(3); await B.sleep(700);        // the notice's fade (0.25 s), the caption's (0.35 s) and its placer
    const r = await b.ev(L.expr({ expect }));
    if (shots) await shot(sz.id + '_' + state.replace(/[^a-z]+/gi, '_').replace(/_+$/, '').toLowerCase() + '.png', sz);
    if (o.caption) await director(false);
    if (o.rp) await b.ev(`(() => { const t = document.getElementById('rpToast'); if (t) t.classList.remove('on'); return true; })()`);
    checks++; faultCount += r.faults.length;
    const tag = sz.id + ' / ' + state;
    const notes = r.notes.map(n => n.kind + ' ' + n.a + L.size(n));
    if (sz.id === 'wide' && / at rest$/.test(state)) g28.push({ tag, scrolls: r.notes.some(n => n.kind === 'scrolls' && n.a === 'card') });
    row(tag + ': no overlay overlaps another, none outside the stage or cut, each the state shows there',
      (r.faults.length ? r.faults.length + ' fault(s): ' + r.faults.map(f => L.say(f) + L.size(f)).join('; ') : 'no fault')
      + (notes.length ? '; notes: ' + notes.join('; ') : '') + '; stage ' + r.stage.join(' x ') + ' (' + r.device + '), ' + r.free + ' % free' + (o.caption && cap !== true ? '; the director did not come on' : ''),
      'no fault', r.faults.length === 0);
    table.push(tag);
    for (const f of r.faults) table.push('  ' + L.say(f));
    for (const n of r.notes) table.push('  note: ' + n.kind + ' ' + n.a);
    return r;
  };
  // the check's own test at each size: two planted boxes that meet, one past the stage's edge, one whose text it cuts, and
  // an overlay asked for that is not there: exactly those four faults, with the overlap's size
  const planted = async (sz) => {
    await b.ev(`(() => { const st = document.getElementById('stage'), mk = (id, css, text) => { const d = document.createElement('div'); d.id = id; d.style.cssText = 'position:absolute;z-index:9;background:#c33;' + css; if (text) d.textContent = text; st.appendChild(d); };
      mk('lcA', 'left:20px;top:20px;width:60px;height:40px'); mk('lcB', 'left:50px;top:30px;width:60px;height:40px'); mk('lcC', 'right:-25px;top:80px;width:50px;height:20px');
      mk('lcD', 'left:20px;top:120px;width:40px;height:16px;overflow:hidden;white-space:nowrap;font-size:12px', 'a line far too long for its box'); return true; })()`);
    const r = await b.ev(L.expr({ only: true, extra: [['A', '#lcA'], ['B', '#lcB'], ['C', '#lcC'], ['D', '#lcD']], expect: ['E'] }));
    await b.ev(`(() => { for (const id of ['lcA', 'lcB', 'lcC', 'lcD']) { const e = document.getElementById(id); if (e) e.remove(); } return true; })()`);
    const got = r.faults.map(f => L.say(f) + L.size(f)).join('; ');
    const want = 'clipped: D (its content); missing: E; outside: C (right) by 25 px; overlap: A x B 30 x 30 px';
    row(`${sz.say} (${sz.w} x ${sz.h}): the check finds the faults planted to test it, and only those`, got, want, got === want);
  };

  // what a watch always shows; on a phone on its side the diagram gives way while the Bridge shows (D78, D5: C-4's
  // template for that shape), so it is not asked for there; on a short stage (780 px and under: every size here but the
  // two desktops) the Bridge gives way while the end card is up and while walking (C-4's step 2: no room for both), so
  // it is not asked for there once she is gone (at the break, on a watch), nor on a walk
  const watchShows = (sz) => (sz.id === 'phone-side' ? ['readouts', 'views', 'bridge'] : ['readouts', 'views', 'diagram', 'bridge']);
  const watchOver = (sz) => (sz.id === 'desktop' || sz.id === 'wide' ? watchShows(sz) : watchShows(sz).filter(n => n !== 'bridge'));
  try {
    for (const sz of SIZES) {
      const W = watchShows(sz), WO = watchOver(sz);
      await open(sz);
      // ============================================================== the 1912 preset: running, foundered, at rest
      await page('#scenario=titanic');
      await planted(sz);
      await holdWhen('sim.t >= 1200', 'twenty minutes after the damage (' + sz.id + ')', 900);
      await check(sz, 'preset running', ['readouts', 'views', 'diagram', 'notice'], { caption: true });
      await holdWhen('sim.foundered', 'the flag on the preset (' + sz.id + ')', 900);
      await check(sz, 'preset foundered', ['readouts', 'views', 'diagram', 'notice', 'card', 'deep'], { caption: true });
      await toBed('the bed on the preset (' + sz.id + ')');
      await check(sz, 'preset at rest', ['readouts', 'views', 'diagram', 'notice', 'card', 'deep'], { caption: true });
      // ============================================================== the 1912 watch, with the 1912 orders
      await page('#night=1912');
      await tap('#bAuto');
      await b.waitFor('TitanicApp.state.night && TitanicApp.state.night.mode === "auto" && TitanicApp.state.sim.night.k < 20', 15000, 'the 1912 orders (' + sz.id + ')');
      await b.ev('TitanicApp.state.warp = 25');
      await holdWhen('sim.night.k >= 40', 'ten seconds into the watch (' + sz.id + ')', 1);
      await check(sz, 'watch on the bridge', W.concat('notice'), { caption: true });
      const rpOn = await rpView(true);
      await check(sz, 'watch, the bridge\'s view', W.concat('rpNotice'), { rp: true });
      await rpView(false);
      await tap('#bNight');
      await check(sz, 'watch, the Night look', W.concat('notice'), { caption: true });
      await tap('#bNight');
      await tap('[data-view="walk"]');
      const walking = await b.ev('!!(TitanicApp.walk && TitanicApp.walk.on())');
      // on a short stage the Bridge gives way to the walk's pad too (C-4's step 2): not asked for there
      await check(sz, 'watch, on a walk', WO.concat('notice', 'walkPad'));
      await tap('[data-view="walk"]');
      await holdWhen('sim.night.tClear >= 0', 'the end of the encounter (' + sz.id + ')', 1);
      // the boats' count is not asked for: since C-4's step 2 it is 'last', as the caption is (it gives way where the musts
      // need its room, and the check notes it hidden); boats_site shows it where it stands
      await check(sz, 'watch after the ice', W.concat('notice'), { caption: true });
      // her end on a watch: since G12's cascade (D98) the default watch is handed over at the break's onset, where the core
      // stops (it never founders), and the card says she broke
      await holdWhen('TitanicApp.gone(sim)', 'her end on the watch: the break\'s onset (' + sz.id + ')', 900);
      await check(sz, 'watch at the break', WO.concat('notice', 'card'), { caption: true });
      await toBed('the bed on the watch (' + sz.id + ')');
      await check(sz, 'watch at rest', WO.concat('notice', 'card', 'deep'), { caption: true });
      row(`${sz.say}: every state reached, the reports' view and the walk taken`, `10 states; the bridge's view ${rpOn}; walking ${walking}`, '10; true; true', rpOn === true && walking === true);
      await close();
    }
  } catch (e) {
    row('the run went through every size and state', String(e && e.message || e).slice(0, 200), 'no error', false);
  } finally {
    await close();
  }
  // G28 (the coordinator, 2026-11-23): on a large monitor the end card has its room. At rest, on the preset and the watch,
  // it shows whole: the fit pass (site/app.js, the stage's one layout) widens a scrolling overlay in the stack there
  row('G28: on a large monitor (the wide size) the end card at rest shows whole, on the preset and the watch: it does not scroll there',
    g28.map(g => g.tag + ' ' + (g.scrolls ? 'SCROLLS' : 'whole')).join('; ') || 'not measured', 'both whole', g28.length === 2 && g28.every(g => !g.scrolls));
  row('no error in the page\'s console', errors.length ? errors.slice(0, 3).join(' | ').slice(0, 300) : 'none', 'none', errors.length === 0);

  const head = ['The stage\'s layout: the faults tools/layout_check.js finds, size by size and state by state (QC C-4; MUST',
    'since its step 2, D78: none), and the notes, which are not faults. No pixel counts here: the printed rows give them.',
    'Sizes: ' + SIZES.map(s => s.id + ' ' + s.w + 'x' + s.h + (s.touch ? ' (touch)' : '')).join(', ') + '.', ''];
  fs.writeFileSync(outFile('layout_site_test.txt'), head.concat(table).join('\n') + '\n');
  if (pictures.length) fs.writeFileSync(path.join(shots, 'PICTURES.txt'), pictures.map(p => p[0] + '  ' + p[1] + ' x ' + p[2]).join('\n') + '\n');
  console.log('\n' + checks + ' states measured at ' + SIZES.length + ' sizes: ' + faultCount + ' fault(s) (the table: out/layout_site_test.txt)');
  console.log((fails ? 'FAIL' : 'PASS') + ': layout_site: ' + (fails ? fails + ' row(s) failed' : checks + ' states at ' + SIZES.length + ' sizes reached with no fault, the planted faults found at each'));
  process.exit(fails ? 1 : 0);
})();
