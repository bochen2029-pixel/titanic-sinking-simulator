// The deep (site/parts/75_deep.js) and the page's fall (site/app.js, "the fall") in a real browser (headless Edge or
// Chrome), with nothing beyond Node: Z2's suite of docs/BRAINSTORM_the_descent_to_the_bed_v2_2026-11-19.md (section 6).
//   node tools/deep_site_test.js [dist] [picture dir]     (the pictures: node tools/deep_site_test.js dist docs/evidence/deep)
// On a preset the fall here is a test feed: tools/fall_stub.js, a drawn fall to the plan's contract (sim.fall, its 5.1),
// evaluated in the page after it has loaded, in place of whatever engine the page has. It is never shipped: the build
// bundles core/, site/ and their parts only. A page that bundles the engine (Z1's core/readers/fall.js gives
// window.TitanicFall) runs it after the flag; so the rows with no engine set it aside before the flag, and the preset's
// sessions with the stub replace it before the flag. On a watch the fall is the night's own since Z3 (the engine as a
// reader of the night, begun on the first step past the hand-over: the break's onset by default since G12's cascade, D98;
// the watch steps on through it, her clock with it), so the
// watch's sessions (4 and 5) run the real engine, and session 6 runs it on the presets: the 1912 one falls to the bed in
// the preset's sea; Britannic and Olympic with Hawke, with no sea, keep the page as it was before the fall.
// What is checked: without an engine the page is as before (the 140 m slide);
// with one, the fall begins at the flag and runs at the page's pace; each piece is drawn at its pose by the stated mapping
// (at the flag, the core's own pose); each piece's keel within 1 m of the bed at rest, as the model has it; the depth
// readout the model's to 0.1 m, and the other readouts from the sea's own tables; the strip's marks at the right fractions
// of its height, and a tap on a mark taking that piece's view; the four views placed as stated; the camera's limits lifted
// while she falls; the lamp and the darkening water in the Night look only; at the page's fastest pace every event still
// fires; the card's two lines, and D98's word about a bow upside down at rest after a hand-over at the flag, there only
// then; the survey's outlines at rest, their words clear of each other, and Bow down and Stern down
// at rest each holding its piece and the survey's outline of it; her topsides on the pieces (no funnel from the first
// frame, the foremast laid back on the bow at rest, no mainmast on the stern at rest: Z1's note q23 on the record); the
// depth column headed Depth (a piece's lowest point); a watch's fingerprint the same with the part as without (the
// fall feeds nothing back); the strip clear of the readouts, the Bridge and the card on a desktop and a phone; what the
// frame costs with two pieces; no error in the console. The clock is stopped on exact steps (the model's: 'step'; the
// fall's: the page's event 'fallStep') wherever a reading or a click must land on one.
// QC C-3 (docs/DESIGN_virtual_clock_v1_1_2026-11-21.md): each page opens with its clock virtual (clock=test), so only
// this suite's passes move it (tools/cdp.js's vrun and vframes, 1000/60 ms a pass), and a busy machine changes how long
// the suite takes, never what it sees. The holds, the waits on the model's and the fall's state, the camera coming to a
// view, the old slide and the notices (on the page's clock) all run on the page's passes, the bounds in its own time;
// each picture is a drawn pass. What stays on real time: what a frame costs (the two cost rows measure real frames, the
// page's clock put back on real time for them, the watch held), the notice's CSS fade before a picture and the phone
// sheet's CSS slide. --real runs it all on real time, as before C-3, for comparison:
//   node tools/deep_site_test.js [dist] [picture dir] [--real]
'use strict';
const fs = require('fs');
const path = require('path');
const B = require('./cdp');
const C = require('../core/core.js');
const REAL = process.argv.includes('--real'), argv = process.argv.slice(2).filter(a => a !== '--real');
const dist = path.resolve(argv[0] || path.join(__dirname, '..', 'dist'));
const shots = argv[1] ? path.resolve(argv[1]) : null;
const OPEN = { virtual: !REAL };                   // each page opened with its clock virtual (clock=test), unless --real
const STUB = fs.readFileSync(path.join(__dirname, 'fall_stub.js'), 'utf8');
const rows = []; let fails = 0;
function row(what, value, ref, ok) { rows.push([what, value, ref, ok]); if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + what.padEnd(100) + ' ' + String(value).padEnd(70) + ' ' + ref); }
const pictures = [];
const f1 = (v) => v.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const f0 = (v) => Math.round(v).toLocaleString('en-US');
const mss = (s) => { s = Math.max(0, Math.floor(s + 1e-6)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const colAt = (sea, key, z) => { const a = sea[key], f = Math.max(0, z) / (sea.dz || 5), i = Math.floor(f); return i >= a.length - 1 ? a[a.length - 1] : a[i] + (a[i + 1] - a[i]) * (f - i); };
const bedDepth = (sea, X, Y) => { let d = sea.depth + (sea.slope ? sea.slope[0] * X + sea.slope[1] * Y : 0); for (const w of sea.relief || []) d += w.a * Math.sin(w.kx * X + w.ky * Y + w.ph); return d; };
// the mapping, written again here from its statement (site/app.js, "the fall"): a point p of a piece's frame is at
// r + R(q) p in the fall's frame, and three.js takes (x, y, z) as (x, z, -y)
const rotq = (q, v) => { const [w, x, y, z] = q, [a, b, c] = v; return [(1 - 2 * (y * y + z * z)) * a + 2 * (x * y - w * z) * b + 2 * (x * z + w * y) * c, 2 * (x * y + w * z) * a + (1 - 2 * (x * x + z * z)) * b + 2 * (y * z - w * x) * c, 2 * (x * z - w * y) * a + 2 * (y * z + w * x) * b + (1 - 2 * (x * x + y * y)) * c]; };
const toThree = (p, s) => { const v = rotq(p.q, s); return [p.r[0] + v[0], p.r[2] + v[2], -(p.r[1] + v[1])]; };
const X_AFT = C.G.xAP - C.G.sternOverhang, X_FWD = C.xFwd(C.zTopAt(C.G.xFP));
const probes = (p) => { const a = Math.max(p.x0, X_AFT) + 1, b = Math.min(p.x1, X_FWD) - 1; return [[a, 0, 1], [(a + b) / 2, 10, 5], [b, -9, 20]]; };

// what the page holds for the readings: the fall as plain data, the pieces as drawn, the probes through their matrices
// D98 (Bo's choice of G12's option (a), 2026-11-23): Z1's words on the card for a bow upside down at rest after a
// hand-over at the flag, until the watch hands her over at the break's onset by default
const D98_NOTE = 'The bow rests upside down here: the model hands her to the fall on her beam ends at its flag. The wreck lies upright, and handed over where she breaks, both pieces land upright.';
const FALL = `(() => { const A = TitanicApp, s = A.state.sim, f = s.fall; return f ? { t: f.t, t0: f.t0, k: f.k, done: f.done, rule: f.rule, at: f.at, sea: f.sea, founderT: s.founderT, v: f.v, breakAt: f.breakAt,
  pieces: f.pieces.map(p => ({ id: p.id, x0: p.x0, x1: p.x1, r: p.r, q: p.q, depth: p.depth, speed: p.speed, state: p.state })), events: f.events } : null; })()`;
const drawnAt = (pts) => `(() => { const A = TitanicApp, T = THREE, out = {}; for (const p of A.pieces()) out[p.id] = ${JSON.stringify(pts)}[p.id].map(s => new T.Vector3(s[0], s[2], -s[1]).applyMatrix4(p.group.matrix).toArray());
  out.core = ${JSON.stringify(pts)}.bow.concat(${JSON.stringify(pts)}.stern).map(s => new T.Vector3(s[0], s[2], -s[1]).applyMatrix4(A.shipGroup.matrix).toArray()); return out; })()`;
const rect = (sel) => `(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e || e.hidden || !e.getClientRects().length) return null; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 ? [r.left, r.top, r.right, r.bottom] : null; })()`;
const meets = (a, b) => !!(a && b && a[0] < b[2] - 0.5 && a[2] > b[0] + 0.5 && a[1] < b[3] - 0.5 && a[3] > b[1] + 0.5);
const inside = (a, b) => !!(a && b && a[0] >= b[0] - 0.5 && a[1] >= b[1] - 0.5 && a[2] <= b[2] + 0.5 && a[3] <= b[3] + 0.5);
// her topsides on the pieces (TitanicApp.fallTops()): the mast `id` drawn on the piece `piece`
const mastOf = (tp, piece, id) => { const p = (tp || []).find(q => q.id === piece); return p ? p.masts.find(m => m.id === id) || null : null; };
// the survey's words in the picture (TitanicApp.deep.words(): boxes -1 to 1): no two overlap. A word the part marks
// `stuck` found no line inside the picture clear of the words before it and of the overlays (eight lines each way) and
// lies on the inside line it overlaps least (Z2, 11-21, after 10b2): every check of where the words lie excuses it by
// that mark, never by where it happens to land, and each row says how many it excused (`marked`)
const marked = (...lists) => { const n = lists.reduce((t, l) => t + l.filter(w => w.box && w.stuck).length, 0); return n ? `; ${n} word${n > 1 ? 's' : ''} marked stuck (no clear line), excused` : ''; };
const wordsClear = (words) => { const bx = words.filter(w => w.box && !w.stuck).map(w => w.box); for (let i = 0; i < bx.length; i++) for (let j = i + 1; j < bx.length; j++) if (bx[i][0] < bx[j][2] && bx[i][2] > bx[j][0] && bx[i][1] < bx[j][3] && bx[i][3] > bx[j][1]) return false; return true; };
// and clear of the deep's strip at the stage's right edge (turn 6b of 11-21: they ran under it): each word's right end left
// of the strip's left edge (in the picture, -1 to 1), unless it is already drawn wholly left of its anchor (shift 1)
const STRIP_NDC = `(() => { const e = document.getElementById('deepStrip'); if (!e || e.hidden) return null; const c = TitanicApp.renderer.domElement.getBoundingClientRect(), s = e.getBoundingClientRect(); return s.width > 0 ? 2 * (s.left - c.left) / c.width - 1 : null; })()`;
const wordsOffStrip = (words, xs) => xs === null || words.every(w => !w.box || w.box[2] <= xs + 0.005 || w.shift >= 0.999);
// and off every overlay of the stage (C-4's step 1: "boilers: under the break" started under the readouts), each overlay a
// box in the picture with 4 px about it (the part keeps 6), unless the part marked the word stuck (above)
const OVERLAYS_NDC = `(() => { const c = TitanicApp.renderer.domElement.getBoundingClientRect(), out = [];
  for (const sel of ['#readout', '.views', '#boatsChip', '#endCard', '#bridge', '.strip', '.walk-pad', '#deepStrip', '#rpToast']) {
    const e = document.querySelector(sel); if (!e || e.hidden || !e.getClientRects().length) continue; const r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
    out.push([2 * (r.left - 4 - c.left) / c.width - 1, 1 - 2 * (r.bottom + 4 - c.top) / c.height, 2 * (r.right + 4 - c.left) / c.width - 1, 1 - 2 * (r.top - 4 - c.top) / c.height]); }
  return out; })()`;
const wordsOffOverlays = (words, boxes) => words.every(w => !w.box || w.stuck || boxes.every(q => !(w.box[0] < q[2] && w.box[2] > q[0] && w.box[1] < q[3] && w.box[3] > q[1])));
// a point of the picture (-1 to 1) behind an overlay (U0's guide picture of 11-21: the stern at rest lay behind the readouts)
const behind = (p, boxes) => boxes.some(q => p[0] > q[0] && p[0] < q[2] && p[1] > q[1] && p[1] < q[3]);
// at rest, in a view: where the piece `id` (its middle, 10 m over its keel) and the survey's outline of it (its middle, 6 m
// over the bed) stand in the picture (-1 to 1), the words, and the part's numbers for the view
const restView = (id) => `(() => { const A = TitanicApp, c = A.camera, f = A.state.sim.fall, S = A.deep.survey(), s = S.at.find(q => q.id === ${JSON.stringify(id)}), p = A.pieces().find(q => q.id === ${JSON.stringify(id)});
  const x = (Math.max(p.x0, ${X_AFT}) + Math.min(p.x1, ${X_FWD})) / 2, m = new THREE.Vector3(x, 10, 0).applyMatrix4(p.group.matrix).project(c);
  const o = new THREE.Vector3(s.XY[0], -A.deep.bedDepth(f.sea, s.XY[0], s.XY[1]) + 6, -s.XY[1]).project(c);
  return { view: A.state.view, model: [m.x, m.y, m.z], survey: [o.x, o.y, o.z], words: A.deep.words(), strip: ${STRIP_NDC}, over: ${OVERLAYS_NDC}, rest: A.deep.rest(), d: c.position.distanceTo(A.ctl.target) }; })()`;
const inPicture = (p) => Math.abs(p[0]) < 0.92 && Math.abs(p[1]) < 0.92 && p[2] < 1;
const xy = (p) => p[0].toFixed(2) + ', ' + p[1].toFixed(2);

(async () => {
  let b = null;
  const errors = [];                                // the page's console errors, over every session
  const open = async () => { b = await B.launch({ dist }); };
  const close = async () => { if (!b) return; errors.push(...b.errors); await b.close(); b = null; };
  // QC C-3: a page expression waited for on the page's own passes (with --real, on real time), the bound in its own time;
  // the page let run for ms of its own time (with --real, of real time); and the same with every pass drawn
  const waitPage = (cond, ms, what) => (REAL ? b.waitFor(cond, ms, what) : b.vrun(cond, { maxMs: ms, held: false, what }));
  const settleMs = (ms) => (REAL ? B.sleep(ms) : b.vrun(null, { maxMs: ms, held: false }));
  const settleDraw = (ms) => (REAL ? B.sleep(ms) : b.vrun(null, { maxMs: ms, held: false, render: true }));
  // a picture of the page; scale < 1 for a device with two pixels to the CSS pixel (a phone): at most 1,400 px wide
  const shot = async (name, what, scale) => {
    if (!shots) return;
    // the page's last notice gone first (a notice lasts 2.6 s, a big one 4.2: the Night button's, the model's own news at
    // the flag; on the page's clock, so waited out on its passes); every picture is taken with the clock stopped, so the
    // wait changes nothing else
    for (let i = 0; i < 40 && await b.ev(`document.getElementById('toast').classList.contains('on')`); i++) await settleMs(200);
    await B.sleep(400);                            // and its fade (0.25 s): the phone's picture of 11-21 caught one half gone
    if (!REAL) await b.vframes(1, { render: true });   // under the virtual clock only a test's pass draws: the picture's own
    const p = path.join(shots, name), m = await b.ev('({ w: innerWidth, h: innerHeight })');
    const r = await b.page.send('Page.captureScreenshot', Object.assign({ format: 'png' }, scale ? { clip: { x: 0, y: 0, width: m.w, height: m.h, scale } } : {}));
    const buf = Buffer.from(r.data, 'base64');
    fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, buf);
    pictures.push([path.relative(path.join(__dirname, '..'), p).replace(/\\/g, '/'), what, buf.readUInt32BE(16), buf.readUInt32BE(20)]);
  };
  // the clock stopped on the step where cond holds: the model's ('step') or the fall's ('fallStep'). The hook is in place
  // before the clock runs on at the given pace, in the same evaluation: at 900x the flag can come in the next frame
  const hold = async (kind, cond, what, speed, ms) => {
    const on = kind === 'model' ? `A.on('step', (sim) => { if (${cond}) {` : `A.on('event', (name, sim) => { if (name === 'fallStep' && (${cond})) {`;
    await b.ev(`(() => { const A = TitanicApp; window.__held = false; const f = ${on} A.state.playing = false; window.__held = true; A.off(${kind === 'model' ? "'step'" : "'event'"}, f); } });
      A.state.speed = ${speed}; A.state.playing = true; })()`);
    await waitPage('window.__held', ms || 240000, what);
  };
  const holdModel = (cond, what, speed, ms) => hold('model', cond, what, speed, ms);
  const holdFall = (cond, what, speed, ms) => hold('fall', cond, what, speed, ms);
  const go = (speed) => b.ev(`TitanicApp.state.speed = ${speed}; TitanicApp.state.playing = true`);
  const cardClosed = () => b.ev(`(() => { const e = document.getElementById('endClose'); if (e && e.getClientRects().length && e.getBoundingClientRect().width > 0) e.click(); return true; })()`);   // the Foundered card shut, if it shows
  const stub = () => b.ev(STUB + '\n;typeof TitanicFall.begin === "function"');
  const recordEvents = () => b.ev(`(() => { window.__fallEv = []; TitanicApp.on('event', (n, d) => { if (n === 'fall') window.__fallEv.push(d.id + ':' + d.piece + ':' + d.t); }); })()`);
  const settle = async (view) => {                  // a view chosen and the camera come to it (the clock may stand)
    await b.ev(`TitanicApp.setView(${JSON.stringify(view)})`);
    await waitPage('TitanicApp.ctl.goal === null', 15000, 'the camera to come to ' + view);
    await settleMs(300);
  };
  // what a frame costs: the page's draw calls, the time between frames and in the render call; and how many of her own
  // objects are drawn (the ship group's, or the pieces' copies of it). It measures real frames, so the page's clock is put
  // back on real time for it and virtual again after (QC C-3; both calls are made with the watch held)
  const cost = async (secs) => { if (!REAL) await b.virtual(false); const got = await b.ev(`new Promise((res) => { const A = TitanicApp, r = A.renderer, orig = r.render, t = [], calls = [], ft = []; let last = performance.now();
    const drawn = (root) => { let n = 0; root.traverseVisible(o => { if (o.isMesh || o.isLine || o.isPoints || o.isSprite) n++; }); return n; };
    const own = A.pieces().length ? A.pieces().reduce((s, p) => s + drawn(p.group), 0) : drawn(A.shipGroup);
    r.render = function (s, c) { const t0 = performance.now(); orig.call(r, s, c); t.push(performance.now() - t0); calls.push(r.info.render.calls); const n = performance.now(); ft.push(n - last); last = n; };
    setTimeout(() => { r.render = orig; const m = (a) => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length); res({ frames: t.length, render: m(t), frame: m(ft.slice(1)), calls: Math.round(m(calls)), own }); }, ${secs * 1000}); })`);
    if (!REAL) await b.virtual(true);
    return got; };
  try {
    // ================================================================== 1. the 1912 preset with no fall engine: as before
    await open();
    await b.open('#scenario=titanic', OPEN);
    // a page that bundles the engine (Z1's core/readers/fall.js) has one from its load: set aside here, before the flag
    const engine = await b.ev(`(() => { const had = !!window.TitanicFall; delete window.TitanicFall; if (window.TitanicFall) window.TitanicFall = undefined; return { had, now: !!window.TitanicFall }; })()`);
    await go(900);
    await waitPage('TitanicApp.state.sim.foundered', 240000, 'the flag (no engine)');
    await settleMs(11000);                            // the old slide: 14 m a second of the frames' time (the page's clock) to 140 m
    for (let i = 0; i < 4; i++) await b.page.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 500, y: 430, deltaX: 0, deltaY: 600 });
    await settleMs(300);
    const none = await b.ev(`(() => { const A = TitanicApp, S = A.state; return { fall: !!S.sim.fall, post: S.post, playing: S.playing, play: document.getElementById('bPlay').textContent, strip: !document.getElementById('deepStrip').hidden, pieces: A.pieces().length, ship: A.shipGroup.visible, near: A.camera.near, far: A.camera.far, r: A.ctl.r, pace: A.pace(), deep: A.deep.shown(), founderT: S.sim.founderT }; })()`);
    row('with no fall engine the page is as before: at the flag the clock stops and she slides 140 m and stops; nothing of the deep', `engine at load: ${engine.had ? 'one, set aside before the flag' : 'none'}; fall ${none.fall}, slid ${none.post.toFixed(1)} m, playing ${none.playing}, "${none.play}", pace ${none.pace}; strip ${none.strip}, pieces ${none.pieces}, ship group ${none.ship}`,
      'no engine at the flag; no sim.fall; 140 m (and the one frame\'s 14 m a second that passes it, as always); stopped; "Foundered"; no strip, no pieces, the ship group drawn', !engine.now && !none.fall && none.post >= 140 && none.post < 141.4 && !none.playing && none.play === 'Foundered' && none.pace === 0 && !none.strip && none.pieces === 0 && none.ship && !none.deep);
    row('  and the camera as before: near 0.5 m, far 9 km, the wheel stops at 2.2 km', `near ${none.near}, far ${none.far}; after four turns of the wheel out: ${none.r.toFixed(0)} m`, '0.5, 9000; 2200', none.near === 0.5 && none.far === 9000 && Math.abs(none.r - 2200) < 1e-6);

    // ================================================================== 2. the same preset with the test feed: the fall
    await b.open('#scenario=titanic', OPEN);
    await stub(); await recordEvents();
    await holdModel(`sim.t >= ${none.founderT - 16}`, '16 s before the flag (the preset\'s own, from the run with no engine)', 900);
    await b.clickSel('[data-view="profile"]'); await waitPage('TitanicApp.ctl.goal === null', 15000, 'the profile view');
    const whole = await cost(3);
    await holdFall('sim.fall.k === 0', 'the flag: the fall\'s first state', 900);
    await settleMs(400);
    const at0 = await b.ev(FALL);
    const st0 = await b.ev(`(() => { const A = TitanicApp, S = A.state; return { post: S.post, ship: A.shipGroup.visible, pieces: A.pieces().map(p => p.id), play: document.getElementById('bPlay').textContent, falling: A.falling() }; })()`);
    row('with a fall engine, at the flag the fall begins: on the flag\'s own step, at her time then; no slide; her pieces drawn', `t0 ${at0.t0} s (flag ${at0.founderT} s), k ${at0.k}; slid ${st0.post} m; ship group ${st0.ship}; pieces ${st0.pieces.join(', ')}; "${st0.play}"`,
      't0 = the flag\'s time, k 0; 0 m; hidden; bow, stern; "Play" (stopped here by the test; falling)', at0.t0 === at0.founderT && at0.k === 0 && st0.post === 0 && !st0.ship && st0.pieces.join() === 'bow,stern' && st0.falling && st0.play === 'Play');
    // her topsides on the pieces (site/app.js, "her topsides on her pieces"; Z1's note q23, B.6): from the first frame
    const tp0 = await b.ev('TitanicApp.fallTops()'), f0m = mastOf(tp0, 'bow', 'fore'), m0m = mastOf(tp0, 'stern', 'main');
    row('her topsides from the fall\'s first frame: no funnel above its flange and no aerial kept on either piece (in any look); the foremast standing on the bow and the mainmast on the stern, each with its stays (the record: none of the four funnels stands on the wreck)',
      tp0.map(p => `${p.id}: funnels ${p.funnels}, aerial ${p.aerial}, flanges ${p.flanges}, stowed boats ${p.boats ? 'DRAWN' : 'none'}; ` + p.masts.map(q => `${q.id}mast ${q.shown ? 'standing' : 'gone'} ${q.fromUpright.toFixed(1)} deg, stays ${q.stays}`).join(', ')).join('; '),
      'funnels 0, aerial 0, flanges kept, no stowed boat (the preset draws twenty on her deck: none rides down); the foremast on the bow and the mainmast on the stern, one each, at their rake (under 12 deg), with stays',
      tp0.length === 2 && tp0.every(p => p.funnels === 0 && p.aerial === 0 && p.flanges > 0 && !p.boats && p.masts.length === 1) && !!f0m && !!m0m && f0m.shown && m0m.shown && f0m.laid === 0 && f0m.fromUpright < 12 && m0m.fromUpright < 12 && f0m.stays && m0m.stays);
    const pts = { bow: probes(at0.pieces[0]), stern: probes(at0.pieces[1]) };
    const d0 = await b.ev(drawnAt(pts));
    let worst = 0, worstCore = 0;
    at0.pieces.forEach(p => pts[p.id].forEach((s, i) => { const w = toThree(p, s), g = d0[p.id][i]; worst = Math.max(worst, Math.hypot(w[0] - g[0], w[1] - g[1], w[2] - g[2])); }));
    pts.bow.concat(pts.stern).forEach((s, i) => { const g = d0[i < 3 ? 'bow' : 'stern'][i % 3], c = d0.core[i]; worstCore = Math.max(worstCore, Math.hypot(c[0] - g[0], c[1] - g[1], c[2] - g[2])); });
    row('  each piece drawn at its pose by the stated mapping (r + R(q) p; three.js (x, z, -y)), and at the flag at the core\'s own pose', `the furthest of six points of hers: ${worst.toExponential(2)} m from the mapping, ${worstCore.toExponential(2)} m from the core's pose`, 'both under 1e-6 m', worst < 1e-6 && worstCore < 1e-6);
    const two = await cost(3);
    row('what the frame costs with two pieces: draw calls and time (the Profile view, X-ray, the clock stopped; headless, software GL)', `whole ship ${whole.calls} calls (${whole.own} of her objects), ${whole.frame.toFixed(1)} ms a frame, render ${whole.render.toFixed(1)} ms; two pieces ${two.calls} calls (${two.own} objects), ${two.frame.toFixed(1)} ms, render ${two.render.toFixed(1)} ms`,
      'measured; two pieces at most 2.5 times the whole ship\'s calls [stated] (the free surfaces stay behind)', whole.frames > 10 && two.frames > 10 && two.calls <= 2.5 * whole.calls);

    // ---- mid-fall: the readouts, the strip, the poses, the views, the camera, the light
    await b.click('endClose');
    await holdFall('sim.fall.k === 400', 'the fall\'s step 400 (100 s after the flag)', 60);
    await waitPage('TitanicApp.deep.shownK() === TitanicApp.state.sim.fall.k', 5000, 'the readouts at the stopped step');
    const m = await b.ev(FALL), ro = await b.ev('TitanicApp.deep.readouts()');
    const want = m.pieces.map(p => { const u = m.events.find(e => e.id === 'under' && e.piece === p.id), pr = colAt(m.sea, 'p', p.depth) / 101325;
      return { id: p.id, depth: f1(p.depth) + ' m', speed: p.speed.toFixed(1) + ' m/s · ' + (p.speed / 0.514444).toFixed(1) + ' kn', pressure: (pr >= 100 ? f0(pr) : pr.toFixed(1)) + ' atm', water: colAt(m.sea, 'T', p.depth).toFixed(1) + ' °C', under: u ? mss(m.t - u.t) : 'afloat' }; });
    const same = (k) => want.every(w => { const g = ro.find(r => r.id === w.id); return g && g[k] === w[k]; });
    const hd = await b.ev(`(() => { const h = document.querySelector('#deepReadout .k:nth-child(2)'); return h ? { t: h.textContent, title: h.title } : null; })()`);
    row('the depth readout is the model\'s to 0.1 m (each piece\'s lowest point, at the stopped step), its column headed Depth, not Keel (a piece upside down has its deck lowest)', ro.map(r => r.id + ' ' + r.depth).join('; ') + ` at step ${m.k}; headed "${hd ? hd.t : '-'}"`, want.map(w => w.id + ' ' + w.depth).join('; ') + '; "Depth"', same('depth') && !!hd && hd.t === 'Depth' && /lowest point/.test(hd.title));
    row('  its speed in m/s and knots, the sea\'s pressure and temperature there (the sea\'s own tables in sim.fall), the time since it went under', ro.map(r => `${r.id} ${r.speed}, ${r.pressure}, ${r.water}, ${r.under}`).join('; '), 'the same from sim.fall: ' + want.map(w => `${w.speed}, ${w.pressure}, ${w.water}, ${w.under}`).join('; '), same('speed') && same('pressure') && same('water') && same('under'));
    const mk = await b.ev('TitanicApp.deep.marks()');
    const fr = mk.map(k => { const p = m.pieces.find(q => q.id === k.id); return { id: k.id, got: (k.y - k.colTop) / k.colH, want: p.depth / m.sea.depth, px: Math.abs(k.y - (k.colTop + k.colH * p.depth / m.sea.depth)) }; });
    row('the strip\'s marks at the right fractions of its height: the depth over the sea\'s depth', fr.map(x => `${x.id} ${x.got.toFixed(4)} (${x.px.toFixed(2)} px off)`).join('; '), fr.map(x => `${x.id} ${x.want.toFixed(4)}`).join('; ') + '; within 1 px', fr.length === 2 && fr.every(x => x.px <= 1));
    const pm = { bow: probes(m.pieces[0]), stern: probes(m.pieces[1]) }, dm = await b.ev(drawnAt(pm));
    let wm = 0; m.pieces.forEach(p => pm[p.id].forEach((s, i) => { const w = toThree(p, s), g = dm[p.id][i]; wm = Math.max(wm, Math.hypot(w[0] - g[0], w[1] - g[1], w[2] - g[2])); }));
    row('  mid-fall, each piece drawn at its pose by the mapping (the clock stopped: nothing carried between steps)', `step ${m.k}: furthest point ${wm.toExponential(2)} m off; bow ${m.pieces[0].depth.toFixed(1)} m, stern ${m.pieces[1].depth.toFixed(1)} m down`, 'under 1e-6 m', wm < 1e-6);
    // the cut: one mechanism for whatever hangs under the ship group (a shader's cut copy, its uniforms the original's own
    // objects; clipping planes for three.js's own materials), the hull's copy cut at the piece's ends, its cut end closed
    const cut = await b.ev(`(() => { const A = TitanicApp, out = [];
      for (const p of A.pieces()) {
        let shader = 0, clipped = 0, whole = 0;
        p.group.traverse(o => { if (o === p.group || !o.material || !o.visible) return;
          for (const m of (Array.isArray(o.material) ? o.material : [o.material])) { if (m.uniforms && m.uniforms.uCutX) shader++; else if (m.clippingPlanes && m.clippingPlanes.length) clipped++; else whole++; } });
        const h = p.hull.material, w = p.drawnWith, keys = Object.keys(w.uniforms || {});
        out.push({ id: p.id, shader, clipped, whole, cutAt: h.uniforms && h.uniforms.uCutX ? [h.uniforms.uCutX.value.x, h.uniforms.uCutX.value.y] : null, x: [p.x0, p.x1],
          shared: keys.length > 0 && keys.every(k => h.uniforms[k] === w.uniforms[k]), sameText: h.fragmentShader.indexOf(w.fragmentShader.slice(-200)) >= 0 });
      }
      return out; })()`);
    row('each copy that crosses a cut is cut by one mechanism, whatever draws it; the hull\'s copy shares its uniforms by reference', cut.map(c => `${c.id}: ${c.shader} shader copies cut, ${c.clipped} clipped, ${c.whole} whole; hull cut at ${c.cutAt ? c.cutAt.map(v => v.toFixed(2)).join(' to ') : 'nothing'}, uniforms shared ${c.shared}`).join('; '),
      'the hull cut at each piece\'s own x0 and x1; its uniforms the original\'s objects; its shader the original\'s text with the cut put in', cut.length === 2 && cut.every(c => c.cutAt && c.cutAt[0] === c.x[0] && c.cutAt[1] === c.x[1] && c.shared && c.sameText && c.shader > 0 && c.clipped > 0));
    const hu = await b.ev(`(() => { const A = TitanicApp, u = { value: 0.5 }; A.hullUniform('uZ2Probe', u); return { page: A.hull.material.uniforms.uZ2Probe === u, copies: A.pieces().map(p => p.hull.material.uniforms.uZ2Probe === u) }; })()`);
    await b.ev(`(() => { const m = TitanicApp.hull.material; window.__fs = m.fragmentShader; m.fragmentShader = m.fragmentShader + '\\n// z2 probe'; m.needsUpdate = true; })()`);
    await settleDraw(500);
    const rb = await b.ev(`(() => { const A = TitanicApp, m = A.hull.material, r = A.pieces().map(p => p.hull.material.fragmentShader.indexOf('// z2 probe') >= 0 && p.hull.material.uniforms.uZ2Probe === m.uniforms.uZ2Probe && p.hull.material.uniforms.uLevels === m.uniforms.uLevels); m.fragmentShader = window.__fs; m.needsUpdate = true; return r; })()`);
    await settleDraw(500);
    row('  TitanicApp.hullUniform puts one uniform object on her hull\'s material and every piece\'s copy; a copy is made again when its original\'s text changes', `the page's ${hu.page}, the copies' ${hu.copies.join('/')}; after a change to the hull shader's text the copies carry it, and the same uniforms: ${rb.join('/')}`,
      'true; true/true; true/true', hu.page && hu.copies.every(Boolean) && rb.length === 2 && rb.every(Boolean));
    // the views
    const midOf = (id) => `(() => { const p = TitanicApp.pieces().find(q => q.id === ${JSON.stringify(id)}), x = (Math.max(p.x0, ${X_AFT}) + Math.min(p.x1, ${X_FWD})) / 2; return new THREE.Vector3(x, 8, 0).applyMatrix4(p.group.matrix); })()`;
    const viewAt = async (id) => b.ev(`(() => { const A = TitanicApp, c = A.camera, v = ${midOf(id)}, fit = Math.min(1.8, Math.max(1, 0.95 / Math.max(0.3, c.aspect))); return { d: c.position.distanceTo(v), want: 400 * fit, view: A.state.view }; })()`);
    await b.clickSel('#deepStrip [data-view="deep"]'); await waitPage('TitanicApp.ctl.goal === null', 15000, 'Bow down');
    const vb = await viewAt('bow');
    await b.clickSel('#deepStrip [data-view="sternfall"]'); await waitPage('TitanicApp.ctl.goal === null', 15000, 'Stern down');
    const vs = await viewAt('stern');
    row('the views Bow down and Stern down (buttons heading the strip): each with its piece, 400 m off', `Bow down ${vb.d.toFixed(2)} m from the bow's middle; Stern down ${vs.d.toFixed(2)} m from the stern's`, `${vb.want.toFixed(0)} m (400 m, the page's portrait fit ${(vb.want / 400).toFixed(2)}), to 1 m`, vb.view === 'deep' && vs.view === 'sternfall' && Math.abs(vb.d - vb.want) < 1 && Math.abs(vs.d - vs.want) < 1);
    await settle('deep');
    await b.clickSel('#deepStrip .deep-mark.stern');
    await waitPage('TitanicApp.ctl.goal === null', 15000, 'the stern\'s view after the tap');
    const tap = await viewAt('stern');
    row('  a tap on the stern\'s mark in the strip takes the stern\'s view', `from Bow down: "${tap.view}", ${tap.d.toFixed(2)} m from the stern`, '"sternfall", 400 m', tap.view === 'sternfall' && Math.abs(tap.d - tap.want) < 1);
    await b.clickSel('#deepStrip [data-view="bed"]'); await settleMs(500);
    const bed = await b.ev(`(() => { const A = TitanicApp, c = A.camera, f = A.state.sim.fall, p = A.pieces().find(q => q.id === 'bow'), x = (Math.max(p.x0, ${X_AFT}) + Math.min(p.x1, ${X_FWD})) / 2, v = new THREE.Vector3(x, 10, 0).applyMatrix4(p.group.matrix);
      const bd = A.deep.bedDepth(f.sea, c.position.x, -c.position.z), n = v.clone().project(c); return { view: A.state.view, up: c.position.y + bd, off: Math.hypot(c.position.x - v.x, c.position.z - v.z), ndc: [n.x, n.y, n.z], fov: c.fov }; })()`);
    row('the view Bed: an eye on the bed under her, looking up at her as she comes down', `${bed.view}: the eye ${bed.up.toFixed(2)} m above the bed, ${bed.off.toFixed(2)} m off the point under the bow; the bow at (${bed.ndc[0].toFixed(2)}, ${bed.ndc[1].toFixed(2)}) on the screen; fov ${bed.fov}`,
      '40 m; 150 m; inside the picture (-1 to 1); 58', bed.view === 'bed' && Math.abs(bed.up - 40) < 0.01 && Math.abs(bed.off - 150) < 0.01 && Math.abs(bed.ndc[0]) < 1 && Math.abs(bed.ndc[1]) < 1 && bed.ndc[2] < 1 && bed.fov === 58);
    await b.clickSel('#deepStrip [data-view="column"]'); await settleMs(500);
    const col = await b.ev(`(() => { const A = TitanicApp, c = A.camera, f = A.state.sim.fall, B = A.deep.breakPoint(), bd = A.deep.bedDepth(f.sea, B[0], B[1]), st = document.getElementById('stage').getBoundingClientRect(), dd = document.querySelector('.strip').getBoundingClientRect();
      const px = (v) => { const n = v.clone().project(c); return [n.x, n.y, st.top + (1 - n.y) / 2 * st.height]; };
      const top = px(new THREE.Vector3(B[0], 0, -B[1])), foot = px(new THREE.Vector3(B[0], -bd, -B[1]));
      const ps = A.pieces().map(p => px(new THREE.Vector3((Math.max(p.x0, ${X_AFT}) + Math.min(p.x1, ${X_FWD})) / 2, 10, 0).applyMatrix4(p.group.matrix)));
      return { view: A.state.view, top, foot, ps, ddTop: dd.top, dist: c.position.distanceTo(new THREE.Vector3(B[0], c.position.y, -B[1])) }; })()`);
    const inPic = (p) => Math.abs(p[0]) < 1 && Math.abs(p[1]) < 1;
    row('the view Column: the whole sea in one picture, the surface to the bed above the damage diagram, both pieces in it', `${col.view}, ${(col.dist / 1000).toFixed(2)} km off: surface at y ${col.top[1].toFixed(2)}, bed at ${col.foot[1].toFixed(2)} (${col.foot[2].toFixed(0)} px; the diagram from ${col.ddTop.toFixed(0)} px); pieces at ${col.ps.map(p => p[1].toFixed(2)).join(', ')}`,
      // 5 to 10 km off: since C-4 the column is framed under the view bar, in the stage's free part, so the eye stands
      // farther off than the 6 km it had over the whole stage
      'all inside (-1 to 1); the bed above the diagram; 5 to 10 km off', col.view === 'column' && inPic(col.top) && inPic(col.foot) && col.ps.every(inPic) && col.foot[2] < col.ddTop && col.dist > 5000 && col.dist < 10000);
    if (shots) { await b.click('bNight'); await settleMs(1500); await shot('deep_column.png', 'the Column view in the Night look 100 s after the flag: the sea from the surface to the bed, the two pieces near 1 km, the strip at the right'); await b.click('bXray'); await settleMs(500); }
    // the camera's limits, in a view of the page's own: the wheel out
    await settle('profile');
    for (let i = 0; i < 8; i++) await b.page.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 500, y: 430, deltaX: 0, deltaY: 600 });
    await settleMs(400);
    const lim = await b.ev(`(() => { const A = TitanicApp, c = A.camera, f = A.state.sim.fall; return { r: A.ctl.r, near: c.near, far: c.far, toBed: c.position.y + f.sea.depth, camY: c.position.y, tgtY: A.ctl.target.y }; })()`);
    row('while she falls the camera\'s limits are lifted: the wheel goes out to 6.5 km, near and far by distance, no floor under the eye\'s target', `the wheel out: ${lim.r.toFixed(0)} m; near ${lim.near.toFixed(2)} m, far ${(lim.far / 1000).toFixed(1)} km; the target ${lim.tgtY.toFixed(0)} m (her depth)`,
      '6500 m; near above 0.5, far past the bed; the target below 60 m down', Math.abs(lim.r - 6500) < 1e-6 && lim.near > 0.5 && lim.far > lim.r + lim.toBed && lim.tgtY < -600);
    // light: the lamp and the darkening water in the Night look, the X-ray look as it is
    await settle('deep');
    if (shots) await shot('deep_bow_xray.png', 'Bow down in the X-ray look, 100 s after the flag: the bow cut at x -23 (its torn end flat), the stern above it, specks in the water; readouts and strip');
    await b.click('bNight'); await settleMs(600);
    const nl = await b.ev(`(() => { const A = TitanicApp, D = A.deep, L = D.lamp(), W = D.water(), v = ${midOf('bow')}; return { lamp: L, water: W, specks: D.specks().visible, camY: A.camera.position.y, off: Math.hypot(L.at[0] - v.x, L.at[2] - v.z), up: L.at[1] - v.y - 2, night: !!A.nightScene.on }; })()`);
    row('the Night look under the sea: a lamp 150 m off her that falls off with distance, her hull in its light, the water darkening with depth, specks', `night ${nl.night}: lamp ${nl.lamp.intensity} at ${nl.off.toFixed(1)} m off the bow's middle, ${nl.up.toFixed(1)} m above it; hull in its light ${nl.lamp.hull.join('/')}; water: drawn ${nl.water.visible}, night ${nl.water.night}, ${nl.water.depth.toFixed(0)} m deep (eye at ${(-nl.camY).toFixed(0)} m); specks ${nl.specks}`,
      'on: 1.8, 150 m, 40 m; true/true; drawn, 1, the eye\'s depth; specks', nl.night && nl.lamp.intensity === 1.8 && Math.abs(nl.off - 150) < 0.5 && Math.abs(nl.up - 40) < 0.5 && nl.lamp.hull.every(Boolean) && nl.water.visible && nl.water.night === 1 && Math.abs(nl.water.depth + nl.camY) < 1e-6 && nl.specks);
    if (shots) await shot('deep_bow_night.png', 'Bow down in the Night look: the bow lit by the lamp 150 m off her (appearance), black water, specks; the stern above');
    await b.click('bXray'); await settleMs(600);
    const xl = await b.ev(`(() => { const A = TitanicApp, D = A.deep; return { lamp: D.lamp(), water: D.water(), page: A.pieces().map(p => p.drawnWith === A.hull.material), xray: A.state.xray }; })()`);
    row('  the X-ray look carries the fall as it is: no lamp, its own colours under the sea, her hull in the page\'s own material', `x-ray ${xl.xray}: lamp ${xl.lamp.intensity}; water night ${xl.water.night}; hull the page's ${xl.page.join('/')}`, 'lamp 0; 0; true/true', xl.xray && xl.lamp.intensity === 0 && xl.water.night === 0 && xl.page.every(Boolean));
    // the last of the fall: the bed's eye as the bow nears the bed
    if (shots) {
      await b.click('bNight'); await b.clickSel('#deepStrip [data-view="bed"]');
      await holdFall('sim.fall.pieces[0].depth >= 3690', 'the bow 100 m above the bed', 60);
      await settleMs(800); await shot('deep_bed_near.png', 'the Bed view in the Night look, the bow 100 m above the bed: the lamp on her, the 50 m net coming up out of the dark');
      await b.click('bXray'); await settleMs(300);
    }
    // ---- to the bed
    await go(900);
    await waitPage('TitanicApp.state.sim.fall.done', 120000, 'both pieces on the bed');
    await settleMs(600);
    const end = await b.ev(FALL);
    const keel = await b.ev('TitanicApp.deep.keel()');
    row('each piece\'s keel within 1 m of the bed at rest, as the model has it', keel.map(k => `${k.id}: drawn ${k.drawn.toFixed(3)} m, model ${k.model.toFixed(3)} m, the bed under it ${k.bed.toFixed(3)} m`).join('; '), 'drawn within 1 m of the model\'s depth and of the bed',
      keel.length === 2 && keel.every(k => Math.abs(k.drawn - k.model) <= 1 && Math.abs(k.drawn - k.bed) <= 1));
    const fin = await b.ev(`(() => { const A = TitanicApp; return { play: document.getElementById('bPlay').textContent, playing: A.state.playing, pace: A.pace(), clock: document.getElementById('shipTime').textContent, want: A.clockOf(A.state.sim.fall.t), lines: A.deep.lines(), card: A.nightEnd.sentences(), survey: A.deep.survey(), net: A.deep.net(), shown: A.nightEnd.shown() }; })()`);
    row('  once both are at rest: the clock stops, "On the bed", her time the fall\'s', `"${fin.play}", playing ${fin.playing}, pace ${fin.pace}; clock ${fin.clock}`, `"On the bed", false, 0; ${fin.want}`, fin.play === 'On the bed' && !fin.playing && fin.pace === 0 && fin.clock === fin.want);
    // the card's lines, from the model's numbers: the rest events' times and depths; each piece's middle against the point under the break
    const F = end.pieces.map(p => ({ p, e: end.events.find(e => e.id === 'rest' && e.piece === p.id) })).sort((a, c) => a.e.t - c.e.t);
    const B0 = fin.survey.B, clockAt = await b.ev(`[${F.map(x => x.e.t).join(',')}].map(t => TitanicApp.clockOf(t))`);
    const away = (p) => { const xm = (Math.max(p.x0, X_AFT) + Math.min(p.x1, X_FWD)) / 2, v = rotq(p.q, [xm, 0, 0]), d = Math.hypot(p.r[0] + v[0] - B0[0], p.r[1] + v[1] - B0[1]); return d < 1000 ? f0(d) + ' m' : (d / 1000).toFixed(1) + ' km'; };
    const gap = F[1].e.t - F[0].e.t, later = gap < 90 ? Math.round(gap) + ' s' : Math.round(gap / 60) + ' min';
    // RC2 (the red team's row 19): on the 1912 night each line sets the wreck beside the model's figure, in the page's own words
    const W = await b.ev('TitanicApp.deep.WRECK_SAYS');
    const wantLines = [`The ${F[0].p.id} is on the bed at ${clockAt[0]}, ${f0(F[0].e.depth)} m down, ${away(F[0].p)} from where she broke${W[F[0].p.id] || ''}.`, `The ${F[1].p.id} followed at ${clockAt[1]}, ${later} later, ${f0(F[1].e.depth)} m down, ${away(F[1].p)} from where she broke${W[F[1].p.id] || ''}.`];
    row('two lines added to the Foundered card as the pieces land, each from the model\'s numbers, the wreck beside them on the 1912 night', fin.card.filter(t => fin.lines.includes(t)).map(t => '"' + t + '"').join(' '), wantLines.map(t => '"' + t + '"').join(' '),
      fin.lines.join('|') === wantLines.join('|') && wantLines.every(t => fin.card.includes(t)) && fin.card[1] === wantLines[0] && fin.card[2] === wantLines[1] &&
      /about 0\.8 km/.test(W.bow || '') && /not fitted/.test(W.bow || '') && /about 150 m/.test(W.stern || ''));
    // RC2 (the first ten minutes played cold): the wreck is set beside the figure only on the night it came from (the
    // kept set's own test, TitanicApp.keptRun). A run changed by hand is told without it: here the bulkheads' tops, as
    // keptRun reads them, changed for the one call and put back
    const wh = await b.ev(`(() => { const A = TitanicApp, S = A.state, was = S.bh; const kept = A.keptRun(), here = A.deep.wreckHere(); S.bh = 'D'; const changed = A.deep.wreckHere(); S.bh = was; return { kept, here, changed }; })()`);
    row('  the wreck beside the figure only on the night it came from (TitanicApp.keptRun): this 1912 preset as built, and not once the run is changed',
      `as built: ${wh.here ? 'beside' : 'NOT BESIDE'} (keptRun "${wh.kept}"); the bulkheads' tops changed: ${wh.changed ? 'STILL BESIDE' : 'not beside'}`, 'beside ("preset"); not beside',
      wh.kept === 'preset' && wh.here === true && wh.changed === false);
    // the survey: laid from the point under the break by the record's offsets, turned by her heading at the flag
    const S0 = fin.survey, ps = S0.psi, site = (E, N) => [B0[0] + N * Math.cos(ps) + E * Math.sin(ps), B0[1] + N * Math.sin(ps) - E * Math.cos(ps)];
    const wantS = { bow: site(0, 772), stern: site(148 * Math.sin(309 * Math.PI / 180), 148 * Math.cos(309 * Math.PI / 180)), boilers: B0 };
    const sOff = S0.at.map(s => Math.hypot(s.XY[0] - wantS[s.id][0], s.XY[1] - wantS[s.id][1]));
    row('at rest the survey\'s outlines on the bed, laid from the point under the break: the bow 772 m north, the stern 148 m at 309 degrees, the boilers at it', `shown ${S0.visible}; ` + S0.at.map((s, i) => `${s.id} (${s.XY.map(v => v.toFixed(1)).join(', ')}), ${sOff[i].toFixed(2)} m from the record's`).join('; '),
      'shown; each within 25 m of the record\'s place (its positions are E, N to the metre; the stern\'s 148 m at 309 rounds them); the point under the break the contract\'s breakAt (v2)',
      S0.visible && sOff.every(o => o < 25) && end.v >= 2 && Array.isArray(end.breakAt) && Math.hypot(B0[0] - end.breakAt[0], B0[1] - end.breakAt[1]) < 1e-9);
    const mids = end.pieces.map(p => { const xm = (Math.max(p.x0, X_AFT) + Math.min(p.x1, X_FWD)) / 2, v = rotq(p.q, [xm, 0, 10]); return [p.r[0] + v[0], p.r[1] + v[1]]; });
    const nc = [(mids[0][0] + mids[1][0]) / 2, (mids[0][1] + mids[1][1]) / 2], nOff = Math.hypot(fin.net.cx - nc[0], fin.net.cy - nc[1]);
    row('  the bed: a net of 50 m squares about her and 500 m squares beyond', `${fin.net.step.join(' and ')} m squares, ${fin.net.near} and ${fin.net.far} lines, ${fin.net.half.map(h => '±' + f0(h)).join(' and ')} m about (${fin.net.cx.toFixed(0)}, ${fin.net.cy.toFixed(0)}), ${nOff.toFixed(0)} m from her pieces' middle; shown ${fin.net.visible}`,
      '50 and 500; laid again within 300 m of her pieces\' middle', fin.net.step.join() === '50,500' && fin.net.visible && nOff <= 300);
    // QC B-5: the two parts of the gap, in words at rest: the model's bow on along her heading at the flag from the point
    // under the break (its middle, 10 m over its keel, by the mapping), and that heading; the survey's bow put the same way
    const gp = await b.ev('TitanicApp.deep.gap()'), bw = end.pieces.find(p => p.id === 'bow'), xmB = (Math.max(bw.x0, X_AFT) + Math.min(bw.x1, X_FWD)) / 2, vB = rotq(bw.q, [xmB, 0, 10]);
    const wantAlong = bw.r[0] + vB[0] - B0[0], wantHdg = ((S0.psi * 180 / Math.PI) % 360 + 360) % 360;
    row('at rest the deep gives the two parts of the gap (QC B-5): the model\'s bow on along her heading at the flag from the point under the break, and that heading; beside the survey\'s bow put the same way (772 m on, her head about north)',
      gp ? `${f0(gp.along)} m on (${f0(gp.across)} m across), her head at the flag ${f0(gp.hdg)} deg` : 'none', `${f0(wantAlong)} m on, ${f0(wantHdg)} deg (to a metre and a degree)`,
      !!gp && Math.abs(gp.along - wantAlong) < 1 && Math.abs(gp.hdg - wantHdg) < 1);
    // her topsides at rest: the foremast laid back on the bow, the stern without its mainmast (Ballard 1987, p. 204, through
    // Z1's note q23; the laying and its moment are the page's bets)
    const tpR = await b.ev('TitanicApp.fallTops()'), fR = mastOf(tpR, 'bow', 'fore'), mR = mastOf(tpR, 'stern', 'main');
    row('at rest the foremast lies on the bow, laid back across the well deck onto the bridge\'s front a little to port, its crow\'s nest on it and its derrick along it, its stays gone; the stern has no mainmast; still no funnel',
      fR && mR ? `foremast laid ${fR.laid}, ${fR.fromUpright.toFixed(1)} deg from her upright, foot (${fR.foot.map(v => v.toFixed(1)).join(', ')}), top (${fR.top.map(v => v.toFixed(1)).join(', ')}), the nest ${fR.nest[2].toFixed(1)} m over her keel, the derrick ${fR.derrickFromUpright.toFixed(1)} deg, stays ${fR.stays}; mainmast ${mR.shown ? 'STANDING' : 'gone'}, stays ${mR.stays}; funnels ${tpR.map(p => p.funnels).join('/')}` : 'a mast missing',
      'laid 1, 60 to 80 deg; its top aft of the bridge\'s front (x under 72), to port, over the Boat deck (z over 29); the nest under the bridge\'s roof (31.7); the derrick within 1 deg of the mast; no stays; the mainmast gone; 0/0',
      !!fR && !!mR && fR.laid === 1 && fR.fromUpright > 60 && fR.fromUpright < 80 && fR.top[0] < 72 && fR.top[1] > 0 && fR.top[2] > 29 && fR.nest[2] < 31.7 && Math.abs(fR.derrickFromUpright - fR.fromUpright) < 1 && !fR.stays && !mR.shown && !mR.stays && tpR.every(p => p.funnels === 0));
    // the two views at rest: each with its piece and the survey's outline of it (U0's look at guide 1.5); the words clear
    await settle('deep'); const bvR = await b.ev(restView('bow'));
    await settle('sternfall'); const svR = await b.ev(restView('stern'));
    row('at rest Bow down and Stern down each hold its piece and the survey\'s outline of it in one picture, from above; the survey\'s words clear of each other and of the strip',
      `Bow down: the bow at (${xy(bvR.model)}), the outline at (${xy(bvR.survey)}), ${f0(bvR.rest.deep.gap)} m apart, ${f0(bvR.d)} m off; Stern down: the stern at (${xy(svR.model)}), the outline at (${xy(svR.survey)}), ${f0(svR.rest.sternfall.gap)} m apart, ${f0(svR.d)} m off; words ${wordsClear(bvR.words) && wordsClear(svR.words) ? 'clear' : 'OVERLAP'}, ${wordsOffStrip(bvR.words, bvR.strip) && wordsOffStrip(svR.words, svR.strip) ? 'off the strip' : 'UNDER THE STRIP'}, ${wordsOffOverlays(bvR.words, bvR.over) && wordsOffOverlays(svR.words, svR.over) ? 'off the overlays' : 'UNDER AN OVERLAY'}${marked(bvR.words, svR.words)}`,
      'both inside the picture (-0.92 to 0.92) in each view; no two words\' boxes overlap; none under the strip or another overlay (a word marked stuck excused)',
      bvR.view === 'deep' && svR.view === 'sternfall' && inPicture(bvR.model) && inPicture(bvR.survey) && inPicture(svR.model) && inPicture(svR.survey) && wordsClear(bvR.words) && wordsClear(svR.words) && wordsOffStrip(bvR.words, bvR.strip) && wordsOffStrip(svR.words, svR.strip) && wordsOffOverlays(bvR.words, bvR.over) && wordsOffOverlays(svR.words, svR.over));
    if (shots) {                                    // close on the bow at rest (the test feed lays it upright): her topsides
      await cardClosed();
      await b.click('bXray');                       // the solid look: the drawn ship in her colours
      await b.click('bFollow');
      await b.ev(`(() => { const A = TitanicApp, p = A.pieces().find(q => q.id === 'bow'), M = p.group.matrix, t = new THREE.Vector3(70, 28, 0).applyMatrix4(M), e = new THREE.Vector3(122, 64, -82).applyMatrix4(M);
        const d = e.clone().sub(t), fit = Math.min(1.8, Math.max(1, 0.95 / Math.max(0.3, A.camera.aspect)));
        A.ctl.goal = null; A.ctl.target.copy(t); A.ctl.r = d.length() / fit; A.ctl.phi = Math.acos(Math.max(-1, Math.min(1, d.y / d.length()))); A.ctl.theta = Math.atan2(d.x, d.z); })()`);
      await settleMs(1500);
      await shot('deep_bow_rest_tops.png', 'the bow at rest, close to, in the solid look (laid upright by the test feed): no funnel on it, only the black of their bases; the foremast laid back across the well deck onto the bridge\'s front, its crow\'s nest on it (Ballard 1987, p. 204; how and when it is laid are the page\'s bets)');
      await b.click('bXray'); await b.click('bFollow');
    }
    await close();

    // ================================================================== 3. the fastest pace: every event fires
    await open();
    await b.open('#scenario=titanic', OPEN);
    await stub(); await recordEvents();
    await go(900);
    await waitPage('TitanicApp.state.sim.fall && TitanicApp.state.sim.fall.done', 240000, 'the bed at 900x');
    const ev = await b.ev(`({ got: window.__fallEv, want: TitanicApp.state.sim.fall.events.map(e => e.id + ':' + e.piece + ':' + e.t), speed: TitanicApp.state.speed, seen: TitanicApp.deep.events() })`);
    const count = (id) => ev.got.filter(e => e.startsWith(id + ':')).length;
    row('at the page\'s fastest pace (900x) every event of the fall still fires, once and in order, to the parts', `${ev.got.length} fired at ${ev.speed}x: under ${count('under')}, report ${count('report')}, strike ${count('strike')}, rest ${count('rest')}; the part heard ${ev.seen.length}`,
      `sim.fall.events (${ev.want.length}), in order: 2, 4, 2, 2`, ev.speed === 900 && ev.got.join('|') === ev.want.join('|') && count('under') === 2 && count('report') === 4 && count('strike') === 2 && count('rest') === 2 && ev.seen.length === ev.want.length);
    await close();

    // ================================================================== 4. the 1912 watch on a desktop: through its fall (Z3), the layout
    // the watch's fall is the night's (its reader), so no test feed here: the page's own engine, as a player has it
    await open();
    await b.open('#night=1912', OPEN);
    await b.click('bAuto');
    await waitPage('TitanicApp.state.night.mode === "auto" && TitanicApp.state.sim.night.k < 20', 10000, 'the 1912 orders');
    await b.ev('TitanicApp.state.warp = 6');
    await waitPage('TitanicApp.state.sim.night.tClear >= 0', 240000, 'the end of the encounter');
    await recordEvents();
    // the clock stopped on the hand-over's own step (the model's): the fall begins on the next, the first step past it. Since
    // G12's cascade (D98) a watch is handed over at the break's onset by default (TitanicApp.gone, goneT), not at its flag
    await holdModel('TitanicApp.gone(sim)', 'the hand-over on the watch (the break\'s onset)', 900, 300000);
    // the watch as the page holds it; the core's state without her clock, which the watch carries on past the hand-over
    const WATCH = `(() => { const A = TitanicApp, s = A.state.sim, d = TitanicCore.serialize(s), t = d.t; d.t = 0; return { fp: TitanicNight.fingerprint(s), k: s.night.k, t, snap: JSON.stringify(d), goneT: A.goneT(s), broke: A.broke(s),
      fall: s.fall ? { k: s.fall.k, t: s.fall.t, t0: s.fall.t0, done: s.fall.done, events: s.fall.events.map(e => e.id + ':' + e.piece + ':' + e.t), pose: JSON.stringify(s.fall.pieces.map(p => [p.r, p.q])) } : null,
      play: document.getElementById('bPlay').textContent, playing: A.state.playing, got: window.__fallEv.slice() }; })()`;
    const w0 = await b.ev(WATCH);
    await go(900);
    await waitPage('TitanicApp.state.sim.fall && TitanicApp.state.sim.fall.done', 120000, 'the watch\'s pieces on the bed');
    await settleMs(1200);
    const w1 = await b.ev(WATCH);
    // the same watch by the model alone in the page (its readers, the fall among them; no viewer, no frames), to the same step
    const bare = await b.ev(`(() => { const N = TitanicNight, s = N.create(TitanicCore.buildShip(), N.spec(1912), { auto: true }); while (s.night.k < ${w1.k}) N.step(s);
      return { fp: N.fingerprint(s), fall: s.fall ? { k: s.fall.k, done: s.fall.done, pose: JSON.stringify(s.fall.pieces.map(p => [p.r, p.q])) } : null }; })()`);
    const wn = (id) => w1.got.filter(e => e.startsWith(id + ':')).length;
    row('a watch played past the hand-over to the bed (Z3): handed over at the break\'s onset (the default), her fall begins on the first step past it, at its time; its clock is the watch\'s; "On the bed"',
      `at the hand-over: step ${w0.k}, ${w0.broke ? 'she broke' : 'NOT at the onset'}, ${w0.fall ? 'a fall already' : 'no fall yet'}; on the bed: step ${w1.k}, the fall's step ${w1.fall ? w1.fall.k : '-'} from t0 ${w1.fall ? w1.fall.t0 : '-'} s (the hand-over ${w1.goneT} s); her clock ${w1.t} s, the fall's ${w1.fall ? w1.fall.t : '-'} s; "${w1.play}", playing ${w1.playing}`,
      'she broke; no fall at the hand-over; the fall\'s steps the watch\'s past it; t0 the hand-over\'s; the two clocks equal; "On the bed", stopped',
      w0.broke && !w0.fall && !!w1.fall && w1.fall.done && w1.fall.k === w1.k - w0.k && w1.fall.t0 === w1.goneT && w1.t === w1.fall.t && w1.play === 'On the bed' && !w1.playing);
    row('  every event of the watch\'s fall fires to the parts, once and in order (900x)', `${w1.got.length} fired: under ${wn('under')}, report ${wn('report')}, strike ${wn('strike')}, rest ${wn('rest')}`,
      `sim.fall.events (${w1.fall ? w1.fall.events.length : 0}), in order`, !!w1.fall && w1.got.length > 0 && w1.got.join('|') === w1.fall.events.join('|') && wn('rest') === 2);
    row('a watch keeps its fingerprint through its fall, and the model alone in the page has it and the same fall at the same step: the fall and the part feed nothing back',
      `the watch: ${w0.fp} at the hand-over (step ${w0.k}), ${w1.fp} on the bed (step ${w1.k}); the core's state on the bed ${w1.snap === w0.snap ? 'is' : 'is NOT'} its state at the hand-over, but for her clock; the pieces' poses ${bare.fall && w1.fall && bare.fall.pose === w1.fall.pose ? 'the same' : 'DIFFER'}`,
      `the model alone in the page at step ${w1.k}: ${bare.fp}; its fall on the bed ${bare.fall ? bare.fall.done : 'none'}, step ${bare.fall ? bare.fall.k : '-'}; the poses to the bit`,
      w1.fp === bare.fp && w0.fp === w1.fp && w1.snap === w0.snap && !!bare.fall && !!w1.fall && bare.fall.done && bare.fall.k === w1.fall.k && bare.fall.pose === w1.fall.pose);
    const lay = async () => b.ev(`({ strip: ${rect('#deepStrip')}, readout: ${rect('#readout')}, bridge: ${rect('#bridge')}, card: ${rect('#endCard')}, chip: ${rect('#boatsChip')}, views: ${rect('.views')}, diagram: ${rect('.strip')}, stage: ${rect('#stage')}, device: TitanicApp.device(), vw: innerWidth, doc: document.documentElement.scrollWidth, card2: TitanicApp.nightEnd.shown() })`);
    const L1 = await lay(), clear = (L) => ['readout', 'bridge', 'card', 'chip', 'views', 'diagram'].filter(k => meets(L.strip, L[k]));
    const chipRo = (L) => (L.chip ? `the boats' count ${meets(L.chip, L.readout) || meets(L.chip, L.views) ? 'MEETS' : 'clear of'} the readouts and the view buttons (count ${L.chip.map(Math.round).join(',')}; readouts ${L.readout ? L.readout.map(Math.round).join(',') : 'none'}; buttons ${L.views ? L.views.map(Math.round).join(',') : 'none'})` : 'no boats\' count');
    row('the strip clear of the readouts, the Bridge and the card on a desktop (the 1912 watch at rest, the card showing)', `${L1.device}: strip ${L1.strip.map(Math.round).join(',')}; card ${L1.card ? L1.card.map(Math.round).join(',') : 'none'}; bridge ${L1.bridge ? L1.bridge.map(Math.round).join(',') : 'none'}; covers ${clear(L1).join(', ') || 'nothing'}; ${chipRo(L1)}`,
      'covers none of the readouts, the Bridge, the card, the boats\' count, the view buttons, the damage diagram; inside the stage; the boats\' count, moved left of it, clear of the readouts and the view buttons', !!L1.strip && !!L1.bridge && !!L1.card && clear(L1).length === 0 && inside(L1.strip, L1.stage) && !meets(L1.chip, L1.readout) && !meets(L1.chip, L1.views));
    // the card closed (its lines are read above, and the phone's picture shows them); Bow down at rest on the watch (the
    // real engine, whichever way up the bow lies): the bow and the survey's outline of it in one picture, the words clear
    await cardClosed();
    await b.clickSel('#deepStrip [data-view="deep"]'); await waitPage('TitanicApp.ctl.goal === null', 15000, 'Bow down at rest'); await settleMs(300);
    const wvR = await b.ev(restView('bow')), tpW = await b.ev('TitanicApp.fallTops()'), fW = mastOf(tpW, 'bow', 'fore'), mW = mastOf(tpW, 'stern', 'main');
    row('  the watch at rest (the real engine): Bow down holds the bow and the survey\'s outline of it, neither behind an overlay, the words clear of each other and of the strip; the foremast laid back on the bow in its own frame, no mainmast on the stern, no funnel',
      `the bow at (${xy(wvR.model)})${behind(wvR.model, wvR.over) ? ' BEHIND AN OVERLAY' : ''}, the outline at (${xy(wvR.survey)})${behind(wvR.survey, wvR.over) ? ' BEHIND AN OVERLAY' : ''}, ${f0(wvR.rest.deep.gap)} m apart, ${f0(wvR.d)} m off; words ${wordsClear(wvR.words) ? 'clear' : 'OVERLAP'}, ${wordsOffStrip(wvR.words, wvR.strip) ? 'off the strip' : 'UNDER THE STRIP'}, ${wordsOffOverlays(wvR.words, wvR.over) ? 'off the overlays' : 'UNDER AN OVERLAY'}${marked(wvR.words)}; foremast ${fW ? `laid ${fW.laid}, ${fW.fromUpright.toFixed(1)} deg` : 'MISSING'}; mainmast ${mW ? (mW.shown ? 'STANDING' : 'gone') : 'MISSING'}; funnels ${tpW.map(p => p.funnels).join('/')}`,
      'both inside the picture and clear of the overlays; clear; none under the strip or another overlay (a word marked stuck excused); laid 1, 60 to 80 deg from her upright; gone; 0/0',
      inPicture(wvR.model) && inPicture(wvR.survey) && !behind(wvR.model, wvR.over) && !behind(wvR.survey, wvR.over) && wordsClear(wvR.words) && wordsOffStrip(wvR.words, wvR.strip) && wordsOffOverlays(wvR.words, wvR.over) && !!fW && fW.laid === 1 && fW.fromUpright > 60 && fW.fromUpright < 80 && !!mW && !mW.shown && tpW.every(p => p.funnels === 0));
    if (shots) await shot('deep_bow_rest.png', 'the 1912 watch at rest, Bow down: the model\'s bow and the survey\'s outline of it in one picture, the words clear of each other; the strip, the Bridge. The gap is the model\'s answer: where its pieces fell, and her heading where she broke (the hand-over), which is the motion\'s (the survey is laid by true bearings; QC B-5 puts about half the gap on the heading)');
    // and Stern down at rest on the watch: U0's guide picture of 11-21 (09:36) had the boilers' word under the damage
    // diagram there, kept moving down past the overlays above it; now it looks up too, and stays inside the picture
    await b.clickSel('#deepStrip [data-view="sternfall"]'); await waitPage('TitanicApp.ctl.goal === null', 15000, 'Stern down at rest'); await settleMs(300);
    const wvS = await b.ev(restView('stern')), seen = (w) => w.box && w.box[1] > -1 && w.box[3] < 1;
    row('  ... and Stern down at rest: the stern and the survey\'s outline of it, neither behind an overlay, the words clear of each other, of the strip and of every overlay, and inside the picture',
      `the stern at (${xy(wvS.model)})${behind(wvS.model, wvS.over) ? ' BEHIND AN OVERLAY' : ''}, the outline at (${xy(wvS.survey)})${behind(wvS.survey, wvS.over) ? ' BEHIND AN OVERLAY' : ''}; words ${wordsClear(wvS.words) ? 'clear' : 'OVERLAP'}, ${wordsOffStrip(wvS.words, wvS.strip) ? 'off the strip' : 'UNDER THE STRIP'}, ${wordsOffOverlays(wvS.words, wvS.over) ? 'off the overlays' : 'UNDER AN OVERLAY'}; ${wvS.words.filter(seen).length} of ${wvS.words.filter(w => w.box).length} inside the picture${marked(wvS.words)}`,
      'both inside the picture and clear of the overlays; clear; none under the strip or another overlay; every word inside (a word marked stuck excused)',
      inPicture(wvS.model) && inPicture(wvS.survey) && !behind(wvS.model, wvS.over) && !behind(wvS.survey, wvS.over) && wordsClear(wvS.words) && wordsOffStrip(wvS.words, wvS.strip) && wordsOffOverlays(wvS.words, wvS.over) && wvS.words.filter(w => w.box && !w.stuck).every(seen));
    if (shots) {
      // the wreck from above: the eye over the middle of the model's pieces and the survey's outlines, far enough off to
      // hold them all
      await b.clickSel('[data-view="plan"]'); await waitPage('TitanicApp.ctl.goal === null', 15000, 'the Plan view');
      await b.click('bFollow');
      // the points to hold: each survey outline (its middle, 80 m about it; the ring's edge) and each piece's two ends
      await b.ev(`(() => { const A = TitanicApp, S = A.deep.survey(), f = A.state.sim.fall, at = (X, Y) => [X, -A.deep.bedDepth(f.sea, X, Y), -Y], pts = [];
        for (const s of S.at) { const d = s.id === 'boilers' ? 100 : 80; for (const [u, w] of [[d, 0], [-d, 0], [0, d], [0, -d]]) pts.push(at(s.XY[0] + u, s.XY[1] + w)); }
        for (const p of A.pieces()) for (const x of [Math.max(p.x0, ${X_AFT}), Math.min(p.x1, ${X_FWD})]) pts.push(new THREE.Vector3(x, 10, 0).applyMatrix4(p.group.matrix).toArray());
        const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cz = pts.reduce((s, p) => s + p[2], 0) / pts.length;
        window.__pts = pts; A.ctl.goal = null; A.ctl.target.set(cx, pts[0][1], cz); A.ctl.r = 3000; A.ctl.phi = 0.3; A.ctl.theta = 0; })()`);
      // then, three times: the points' box on the screen brought into the middle of the stage's free part (clear of the
      // readouts, the boats' count, the view buttons, the Bridge and the strip), at 85 % of it [appearance: the framing]
      for (let i = 0; i < 3; i++) {
        await settleMs(500);
        await b.ev(`(() => { const A = TitanicApp, c = A.camera, R = (e) => (e && !e.hidden && e.getClientRects().length ? e.getBoundingClientRect() : null);
          const sr = R(document.getElementById('stage')), ro = R(document.getElementById('readout')), br = R(document.getElementById('bridge')), st = R(document.getElementById('deepStrip')), bc = R(document.getElementById('boatsChip')), vw = R(document.querySelector('.views'));
          const x0 = (ro ? ro.right : sr.left) + 10, x1 = (st ? st.left : sr.right) - 10, y0 = Math.max(bc ? bc.bottom : sr.top, vw ? vw.bottom : sr.top) + 10, y1 = (br ? br.top : sr.bottom) - 10;
          let a = Infinity, z = -Infinity, u = Infinity, d = -Infinity;
          for (const p of window.__pts) { const v = new THREE.Vector3(p[0], p[1], p[2]).project(c), X = sr.left + (v.x + 1) / 2 * sr.width, Y = sr.top + (1 - v.y) / 2 * sr.height; a = Math.min(a, X); z = Math.max(z, X); u = Math.min(u, Y); d = Math.max(d, Y); }
          const per = sr.height / (2 * A.ctl.r * Math.tan(c.fov * Math.PI / 360));
          A.ctl.target.x += ((a + z) / 2 - (x0 + x1) / 2) / per; A.ctl.target.z += ((u + d) / 2 - (y0 + y1) / 2) / per;
          A.ctl.r *= Math.max((z - a) / (x1 - x0), (d - u) / (y1 - y0)) / 0.85; })()`);
      }
      await settleMs(1500);
      const wP = await b.ev('TitanicApp.deep.words()'), xsP = await b.ev(STRIP_NDC), ovP = await b.ev(OVERLAYS_NDC);
      // each word inside the picture too (10b2's tables: the model's bow's word lay at line -8 here, four fifths above the
      // picture's top, a sliver showing, and this row did not ask)
      row('  from above at rest (the picture\'s framing), the survey\'s words clear of each other, of the strip and of every overlay, and inside the picture', wP.map(w => w.box ? `(${w.box.map(v => v.toFixed(2)).join(', ')}) ${w.down} down${w.stuck ? ', stuck' : ''}` : 'out').join('; ') + `; the strip from ${xsP === null ? '-' : xsP.toFixed(2)}; ${wordsOffOverlays(wP, ovP) ? 'off the overlays' : 'UNDER AN OVERLAY'}; ${wP.filter(seen).length} of ${wP.filter(w => w.box).length} inside the picture${marked(wP)}`, 'no two overlap; none under the strip or another overlay; each word inside the picture (a word marked stuck excused)', wordsClear(wP) && wordsOffStrip(wP, xsP) && wordsOffOverlays(wP, ovP) && wP.filter(w => w.box && !w.stuck).every(seen));
      await shot('deep_rest_watch.png', 'the 1912 watch on the bed (X-ray, from above): the two pieces where the engine laid them, the survey\'s outlines of the bow, the stern and the boiler field laid from the point under the break, their words inside the picture and clear of each other (a word with no clear line laid where it overlaps least, marked), the 50 and 500 m nets; the Bridge, the strip');
    }
    await close();

    // ================================================================== 5. the watch on a phone: the strip clear of everything
    await open();
    await b.page.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 780, deviceScaleFactor: 2, mobile: true });
    await b.page.send('Emulation.setTouchEmulationEnabled', { enabled: true });
    await b.open('#night=1912', OPEN);                    // the watch's own fall (Z3): no test feed
    await b.clickSel('.tab[data-tab="run"]');
    await waitPage(`document.getElementById('panel').classList.contains('open')`, 8000, 'the sheet open');
    await B.sleep(600);                            // the sheet slides open (a CSS transition, on real time either way)
    await b.click('bAuto');
    await waitPage('TitanicApp.state.night.mode === "auto"', 30000, 'the 1912 orders on the phone');
    await b.click('sheetClose'); await B.sleep(500);   // the sheet slides shut (CSS, real time)
    await b.ev('TitanicApp.state.warp = 6');
    await waitPage('TitanicApp.state.sim.night.tClear >= 0', 240000, 'the end of the encounter on the phone');
    await holdFall('sim.fall.k === 160', 'the fall on the phone', 900, 300000);
    await settleMs(1000);
    const L2 = await lay();
    // on a short stage (a phone's) the Bridge gives way while the end card is up (C-4's step 2: no room for both)
    row('  and on a phone (390 x 780, touch; the watch 40 s into its fall, the card showing, the Bridge given way to it)', `${L2.device}: strip ${L2.strip.map(Math.round).join(',')}; card ${L2.card ? L2.card.map(Math.round).join(',') : 'none'}; bridge ${L2.bridge ? L2.bridge.map(Math.round).join(',') : 'given way'}; covers ${clear(L2).join(', ') || 'nothing'}; ${chipRo(L2)}; page ${L2.doc} px in ${L2.vw}`,
      'the same; the Bridge given way; the page no wider than the screen', L2.device === 'phone' && !!L2.strip && !L2.bridge && !!L2.card && clear(L2).length === 0 && inside(L2.strip, L2.stage) && !meets(L2.chip, L2.readout) && !meets(L2.chip, L2.views) && L2.doc <= L2.vw);
    const fitRo = await b.ev(`(() => { const e = document.getElementById('deepReadout'), r = e.getBoundingClientRect(), ro = document.getElementById('readout').getBoundingClientRect(); return { r: [r.left, r.right], ro: [ro.left, ro.right], over: e.scrollWidth > e.clientWidth + 1 }; })()`);
    row('  the readouts\' lines fit in the readouts on the phone', `lines ${fitRo.r.map(Math.round).join(' to ')} in readouts ${fitRo.ro.map(Math.round).join(' to ')}; overflow ${fitRo.over}`, 'inside; none', fitRo.r[0] >= fitRo.ro[0] - 0.5 && fitRo.r[1] <= fitRo.ro[1] + 0.5 && !fitRo.over);
    // G9's guard (BACKLOG G9; 4 px to spare when it was answered on 11-21): the director's caption against the fullest end
    // card on the bed, on the phone. The clock stopped on the first strike; the director on (a real tap: it cuts at once, a
    // caption for 5 s of the page's time); on at 900x until both rest lines are on the card, read at once
    await holdFall(`sim.fall.pieces.some(p => p.state === 'striking' || p.state === 'at rest')`, 'the first strike on the phone', 900, 300000);
    await b.clickSel('#bDirector'); await settleMs(200);
    await go(900);
    await waitPage('TitanicApp.deep.lines().length >= 2', 60000, 'both rest lines on the phone'); await settleMs(300);
    const g9 = await b.ev(`(() => { const d = TitanicApp.director.caption(), r = (id) => { const e = document.getElementById(id); if (!e || e.hidden || !e.getClientRects().length) return null; const q = e.getBoundingClientRect(); return q.width > 0 ? [q.left, q.top, q.right, q.bottom] : null; };
      return { cap: d && d.shown ? d.rect : null, gave: !!(d && d.gaveWay), card: r('endCard'), readout: r('readout'), bridge: r('bridge'), lines: TitanicApp.deep.lines().length }; })()`);
    const gap9 = g9.cap && g9.card ? Math.round(Math.max(g9.card[1] - g9.cap[3], g9.cap[1] - g9.card[3])) : null;
    // since C-4's step 2 the layout keeps it clear by construction (the stage's aside), or takes its room for the musts
    row('  G9: on the phone the director\'s caption keeps clear of the fullest end card on the bed (both rest lines), the readouts and the Bridge, or gives way by design',
      `caption ${g9.cap ? g9.cap.map(Math.round).join(',') : (g9.gave ? 'hidden, by design (its room given to the musts)' : 'not shown')}; card ${g9.card ? g9.card.map(Math.round).join(',') : 'none'} (${g9.lines} rest lines); ${gap9 === null ? '-' : gap9 + ' px apart'}`,
      'shown and clear of all three, or hidden by design', (!!g9.cap || g9.gave) && !!g9.card && g9.lines >= 2 && !meets(g9.cap, g9.card) && !meets(g9.cap, g9.readout) && !meets(g9.cap, g9.bridge));
    await b.clickSel('#bDirector');                 // the director off again, as the rest of the session had it
    if (shots) {                                    // on to the bed: the card with its two new lines, on the phone
      await go(900); await waitPage('TitanicApp.state.sim.fall.done', 120000, 'the bed on the phone'); await settleMs(1500);
      await shot('deep_phone_rest.png', 'a phone (390 x 780): the 1912 watch on the bed, the Foundered card with its two new lines (when each piece came to rest, how deep, how far from where she broke), the strip at the right edge clear of the readouts, the card and the Bridge', 0.5);
    }
    await close();

    // ================================================================== 6. the presets on the real engine (Z3)
    // the page's own engine, no test feed: on a preset with a sea (core/scenarios.js: the 1912 site) the fall begins at the
    // flag and runs to the bed; on one without, the page is as it was before the fall
    await open();
    await b.open('#scenario=titanic', OPEN);
    await recordEvents();
    await holdFall('sim.fall.k === 0', 'the flag: the engine\'s first state', 900);
    const e0 = await b.ev(FALL);
    await go(900);
    await waitPage('TitanicApp.state.sim.fall.done', 120000, 'the bed (the real engine)');
    await settleMs(600);
    const e1 = await b.ev(FALL), ek = await b.ev('TitanicApp.deep.keel()');
    const ep = await b.ev(`({ play: document.getElementById('bPlay').textContent, playing: TitanicApp.state.playing, got: window.__fallEv.slice(), sea: TitanicScenarios.PRESETS.titanic.sea })`);
    const ewant = e1.events.map(e => e.id + ':' + e.piece + ':' + e.t), en = (id) => ep.got.filter(e => e.startsWith(id + ':')).length;
    row('the 1912 preset on the real engine: the fall begins at the flag, at her time then, in the preset\'s sea, and runs to the bed; every event once and in order (900x); "On the bed"',
      `t0 ${e0.t0} s (flag ${e0.founderT} s), k ${e0.k}; the sea ${e1.sea.depth} m (the preset's ${ep.sea ? ep.sea.depth : 'none'}); ${ep.got.length} events fired of ${ewant.length}: under ${en('under')}, report ${en('report')}, strike ${en('strike')}, rest ${en('rest')}; "${ep.play}", playing ${ep.playing}`,
      't0 the flag\'s, k 0; 3790 m; sim.fall.events, in order, two rests; "On the bed", stopped',
      e0.t0 === e0.founderT && e0.k === 0 && !!ep.sea && e1.sea.depth === ep.sea.depth && ep.sea.depth === 3790 && e1.done && ewant.length > 0 && ep.got.join('|') === ewant.join('|') && en('rest') === 2 && ep.play === 'On the bed' && !ep.playing);
    // at rest the engine's pieces lie in the mud (R6's bearing law), not on it as the test feed lays them; and a piece at
    // rest upside down has the tiers above B deck lowest, which the model's envelope carries and the drawn hull does not
    const ept = { bow: probes(e1.pieces[0]), stern: probes(e1.pieces[1]) }, ed = await b.ev(drawnAt(ept));
    let eWorst = 0;
    e1.pieces.forEach(p => ept[p.id].forEach((s, i) => { const w = toThree(p, s), g = ed[p.id][i]; eWorst = Math.max(eWorst, Math.hypot(w[0] - g[0], w[1] - g[1], w[2] - g[2])); }));
    const upright = (id) => { const q = e1.pieces.find(p => p.id === id).q; return 1 - 2 * (q[1] * q[1] + q[2] * q[2]) > 0; };   // her z axis up
    row('  at rest each piece drawn at the model\'s pose (the mapping); an upright piece\'s keel at the model\'s depth to 1 m; each in the mud, as the model has it (the real engine)',
      ek.map(k => `${k.id} ${upright(k.id) ? 'upright' : 'upside down'}: drawn ${k.drawn.toFixed(3)} m, model ${k.model.toFixed(3)} m, the bed under it ${k.bed.toFixed(3)} m (${(k.model - k.bed).toFixed(1)} m into the mud)`).join('; ') + `; the furthest of six points ${eWorst.toExponential(2)} m from the mapping`,
      'the mapping under 1e-6 m; upright: drawn within 1 m of the model\'s depth; every piece\'s lowest point at or below the bed (upside down, the model\'s lowest point is its tiers, which the drawn hull does not carry)',
      ek.length === 2 && eWorst < 1e-6 && ek.every(k => (!upright(k.id) || Math.abs(k.drawn - k.model) <= 1) && k.model >= k.bed - 1));
    // her topsides at rest on the real engine: the masts in each piece's own frame, whichever way up it lies
    const tp6 = await b.ev('TitanicApp.fallTops()'), f6 = mastOf(tp6, 'bow', 'fore'), m6 = mastOf(tp6, 'stern', 'main');
    row('  and her topsides at rest on the real engine: no funnel on either piece; the foremast laid back on the bow (its own frame), the stern without its mainmast',
      `bow ${upright('bow') ? 'upright' : 'upside down'}, stern ${upright('stern') ? 'upright' : 'upside down'}; funnels ${tp6.map(p => p.funnels).join('/')}; foremast ${f6 ? `laid ${f6.laid}, ${f6.fromUpright.toFixed(1)} deg from her upright, top (${f6.top.map(v => v.toFixed(1)).join(', ')})` : 'MISSING'}; mainmast ${m6 ? (m6.shown ? 'STANDING' : 'gone') : 'MISSING'}`,
      '0/0; laid 1, 60 to 80 deg, its top aft and to port; gone',
      tp6.every(p => p.funnels === 0) && !!f6 && f6.laid === 1 && f6.fromUpright > 60 && f6.fromUpright < 80 && f6.top[0] < 72 && f6.top[1] > 0 && !!m6 && !m6.shown);
    // D98 (Bo's choice of G12's option (a), the coordinator 2026-11-23): until the watch hands her to the fall at the
    // break's onset by default, the card tells the truth about the bow at rest. Z1's words are shown when sim.fall says
    // the bow lies upside down at rest after a hand-over at the flag (here: the real engine on member C), and not
    // otherwise (session 2's test feed: its bow lies upright at rest, at the flag)
    const c6 = await b.ev(`(() => { const A = TitanicApp, n = document.querySelector('#endCard p.deep-note'); return { lines: A.deep.lines(), card: A.nightEnd.sentences(), note: n ? n.textContent : null, page: A.deep.UPSIDE }; })()`);
    const bow6 = c6.lines.findIndex(t => /^The bow (is on the bed|followed) /.test(t)), at6 = c6.lines.indexOf(D98_NOTE), n6 = c6.lines.filter(t => t === D98_NOTE).length;
    const upFeed = (() => { const q = end.pieces.find(p => p.id === 'bow').q; return 1 - 2 * (q[1] * q[1] + q[2] * q[2]) > 0; })();
    row('D98: after a hand-over at the flag a bow upside down at rest is told so on the card, in Z1\'s words, once, right after the bow\'s line; not when it lies upright (the test feed)',
      `the real engine: rule ${e1.rule}, the bow ${upright('bow') ? 'upright' : 'upside down'}; the words ${at6 < 0 ? 'NOT SHOWN' : `line ${at6 + 1} of ${c6.lines.length} (the bow's ${bow6 + 1}), ${n6} time(s), on the card ${c6.card.includes(D98_NOTE)}, styled as a note ${c6.note === D98_NOTE}`}; the test feed: rule ${end.rule}, the bow ${upFeed ? 'upright' : 'upside down'}, the words ${fin.lines.includes(D98_NOTE) ? 'SHOWN' : 'not shown'} (${fin.lines.length} lines)`,
      'shown once after the bow\'s line, on the card as a note; not shown on the test feed\'s run',
      c6.page === D98_NOTE && e1.rule === 'flag' && !upright('bow') && at6 >= 0 && at6 === bow6 + 1 && n6 === 1 && c6.card.includes(D98_NOTE) && c6.note === D98_NOTE &&
      end.rule === 'flag' && upFeed && !fin.lines.includes(D98_NOTE));
    // Britannic (119 m in the Kea Channel) and Olympic with Hawke (1911, and she never founders here) have no sea
    await b.open('#scenario=britannic', OPEN);
    await go(900);
    await waitPage('TitanicApp.state.sim.foundered', 240000, 'Britannic\'s flag');
    await settleMs(1500);
    const brit = await b.ev(`(() => { const A = TitanicApp, S = A.state; return { engine: !!(window.TitanicFall && TitanicFall.begin), sea: !!TitanicScenarios.PRESETS.britannic.sea, fall: !!S.sim.fall, falling: A.falling(), post: S.post, playing: S.playing, play: document.getElementById('bPlay').textContent, pieces: A.pieces().length, ship: A.shipGroup.visible, t: S.sim.founderT }; })()`);
    await b.open('#scenario=hawke', OPEN);
    await holdModel('sim.t >= 3600 || sim.foundered', 'an hour after Hawke\'s blow', 900);
    const hawke = await b.ev(`(() => { const A = TitanicApp, S = A.state; return { engine: !!(window.TitanicFall && TitanicFall.begin), sea: !!TitanicScenarios.PRESETS.hawke.sea, fall: !!S.sim.fall, foundered: S.sim.foundered, t: S.sim.t, water: TitanicCore.readouts(S.sim).waterT }; })()`);
    row('Britannic and Olympic with Hawke have no sea: the page is as before the fall (Britannic founders, stops and slides; Olympic stays afloat), the engine in the page all the while',
      `Britannic: foundered at ${(brit.t / 60).toFixed(1)} min; fall ${brit.fall}, falling ${brit.falling}; slid ${brit.post.toFixed(1)} m, playing ${brit.playing}, "${brit.play}", pieces ${brit.pieces}, ship group ${brit.ship ? 'drawn' : 'hidden'}; Hawke: ${(hawke.t / 60).toFixed(0)} min, ${Math.round(hawke.water).toLocaleString('en-US')} t aboard, foundered ${hawke.foundered}, fall ${hawke.fall}; the engine ${brit.engine && hawke.engine}`,
      'no sea, no sim.fall; Britannic stopped at "Foundered", sliding, her ship group drawn; Hawke afloat; the engine there',
      brit.engine && !brit.sea && !brit.fall && !brit.falling && brit.post > 0 && !brit.playing && brit.play === 'Foundered' && brit.pieces === 0 && brit.ship &&
      hawke.engine && !hawke.sea && !hawke.fall && !hawke.foundered && hawke.t >= 3600);
    await close();
    row('no error in the page\'s console through all of it (five sessions)', errors.length ? errors.slice(0, 3).join(' | ') : 'none', 'none', errors.length === 0);
    if (shots) row('eight pictures taken (each to be looked at)', pictures.map(p => path.basename(p[0]) + ' ' + p[2] + 'x' + p[3]).join(', '), 'eight, at most 1,400 px wide and 1,500 tall', pictures.length === 8 && pictures.every(p => p[2] <= 1400 && p[3] <= 1500));
    console.log(fails ? `FAIL: ${fails} row(s)` : `PASS: all ${rows.length} rows`);
  } catch (e) {
    fails++; console.log('FAIL the test could not finish: ' + e.message); if (b && b.errors.length) console.log('page errors: ' + b.errors.slice(0, 5).join(' | '));
  } finally {
    await close();
    if (shots && pictures.length) fs.writeFileSync(path.join(shots, 'PICTURES.txt'), pictures.map(p => p[0] + '\n  ' + p[1]).join('\n') + '\n');
    process.exit(fails ? 1 : 0);
  }
})();
