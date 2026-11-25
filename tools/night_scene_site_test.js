// Night, the crow's nest and a boat off her beam (site/parts/20_night_scene.js) in a real browser (headless Edge or
// Chrome), with nothing beyond Node.
//   node tools/night_scene_site_test.js [dist] [screenshot dir]        (about five minutes)
// Through the page's own controls (real clicks, a real drag, a real turn of the mouse wheel) it checks that the Night
// look comes and goes leaving the scene as it was; that the crow's nest is an eye fixed in her frame and the boat an eye
// fixed to the earth; that the berg is drawn only after the bells, from every eye; that her lights keep the 1910 rules
// from the boat; that a port whose section's fuses have blown is dark, in her ports and in the sea, and a lit port under
// the sea is drawn dimmer and glows through it (D97: G1's circuits; U3's lights, version 2); that the part feeds
// nothing back (the 1912 orders watched through it have the model's own fingerprint); and that a phone gets the new
// buttons where the others are. With a screenshot directory it takes the lane's pictures.
'use strict';
const path = require('path');
const B = require('./cdp');
const dist = path.resolve(process.argv[2] || path.join(__dirname, '..', 'dist'));
const shots = process.argv[3] ? path.resolve(process.argv[3]) : null;
const rows = []; let fails = 0;
function row(what, value, ref, ok) { rows.push([what, value, ref, ok]); if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + what.padEnd(100) + ' ' + String(value).padEnd(64) + ' ' + ref); }
const shot = (b, name) => (shots ? b.shot(path.join(shots, name)) : null);

// the page's clock stopped on the step a condition first holds (as tools/night_site_test.js does), and run again
const hold = async (b, cond, what, ms) => {
  await b.ev(`(() => { const A = TitanicApp; window.__held = false; const f = A.on('step', (sim) => { if (${cond}) { A.state.playing = false; window.__held = true; A.off('step', f); } }); })()`);
  await b.waitFor('window.__held', ms || 240000, what);
};
const run = (b) => b.ev('TitanicApp.state.playing = true');
// n drawn frames: the hooks have run on what was just done
const frames = (b, n) => b.ev(`new Promise(r => { let k = ${n || 4}; const f = () => (--k > 0 ? requestAnimationFrame(f) : r(true)); requestAnimationFrame(f); })`);
// a real drag on the stage, from a point the canvas has (no overlay over it); with the right button if asked (on the page's
// own views a right-drag pans, and turns Follow off)
async function drag(b, x0, y0, dx, dy, right) {
  const top = await b.ev(`(() => { const e = document.elementFromPoint(${x0}, ${y0}); return e ? e.id : ''; })()`);
  if (top !== 'gl') throw new Error('the drag would start on #' + top + ', not on the stage');
  const button = right ? 'right' : 'left', buttons = right ? 2 : 1;
  await b.page.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: x0, y: y0, button, buttons, clickCount: 1 });
  for (let i = 1; i <= 12; i++) await b.page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x0 + dx * i / 12, y: y0 + dy * i / 12, button, buttons });
  await b.page.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: x0 + dx, y: y0 + dy, button, buttons: 0, clickCount: 1 });
}
// Follow, and the page's own camera: Follow on or off (the state and its button), and the orbit's angles and distance
const FOLLOW = `(() => { const A = TitanicApp; return { follow: A.state.follow, pressed: document.getElementById('bFollow').getAttribute('aria-pressed'), theta: A.ctl.theta, phi: A.ctl.phi, r: A.ctl.r, yaw: A.nightScene.look.nest.yaw, view: A.state.view }; })()`;
// the scene as a signature: every object's visibility and draw order, its material and that material's state, every
// light (sprites left out: her navigation lights follow the camera, not the look)
const SIGNATURE = `(() => { const A = TitanicApp, out = [];
  A.scene.traverse(o => { if (o.isSprite) return;
    let s = o.uuid + ':' + o.visible + ':' + o.renderOrder; const m = o.material;
    if (m && !Array.isArray(m)) s += ':' + m.uuid + ':' + m.transparent + ':' + m.depthWrite + ':' + (typeof m.opacity === 'number' ? m.opacity.toFixed(5) : '') + ':' + (m.emissive ? m.emissive.getHexString() : '') + ':' + (m.color ? m.color.getHexString() : '');
    if (o.isLight) s += ':' + o.intensity + ':' + o.color.getHexString();
    out.push(s); });
  return { n: out.length, sig: out.join('|'), xray: A.state.xray, pressed: document.getElementById('bXray').getAttribute('aria-pressed') }; })()`;
const LOOK = `(() => { const A = TitanicApp, N = A.nightScene, hull = A.shipGroup.children.find(o => o.isMesh && o.material && o.material.uniforms && o.material.uniforms.uFront);
  return { on: N.on, pressed: document.getElementById('bNight').getAttribute('aria-pressed'), grid: A.sea.visible, nightSea: N.sea.visible, stars: N.stars.visible,
    solid: !hull.material.transparent && !A.state.xray, xray: A.state.xray }; })()`;
// the eye in her frame (x forward, y to port, z up from the keel) and its line of sight there
const EYE_SHIP = `(() => { const A = TitanicApp, inv = A.shipGroup.matrix.clone().invert(), p = A.camera.position.clone().applyMatrix4(inv);
  const d = new THREE.Vector3(0, 0, -1).applyQuaternion(A.camera.quaternion).transformDirection(inv);
  return { x: p.x, y: -p.z, z: p.y, ahead: d.x, world: A.camera.position.toArray(), fov: A.camera.fov, view: A.state.view, nest: A.nightScene.NEST, t: A.state.sim.t,
    trim: TitanicCore.readouts(A.state.sim).trimDeg }; })()`;
// the eye on the earth: on a watch through the page's earth group (north, east from the model's origin), and her place
const EYE_EARTH = `(() => { const A = TitanicApp, p = A.camera.position.clone().applyMatrix4(A.earth.matrixWorld.clone().invert()), m = A.state.sim.mo;
  return { N: p.x + A.E0.x, E: p.z + A.E0.y, up: p.y, X: m.X, Y: m.Y, t: A.state.sim.t, kn: Math.hypot(m.u, m.v) / TitanicMotion.KN, view: A.state.view }; })()`;
// the eye seen from her amidships (a damage preset: she lies at the scene's origin): distance, angle off her bow, side
const EYE_OFF_HER = `(() => { const A = TitanicApp, M = A.shipGroup.matrix.elements, c = A.camera.position, dx = c.x - M[12], dz = c.z - M[14], d = Math.hypot(dx, dz);
  const fx = M[0], fz = M[2], f = Math.hypot(fx, fz), sx = M[8], sz = M[10];
  return { d, off: Math.acos((dx * fx + dz * fz) / (d * f)) * 180 / Math.PI, port: dx * sx + dz * sz < 0, up: c.y, view: A.state.view }; })()`;
// D97: her ports alone, drawn from the page's own eye into a target of their own, with the page's ports' material and
// with this part's reflections in the sea (the same geometry, its aOut the page's mark of each port whose section's fuses
// have blown): those out, the lit ones above the sea and the lit ones under it apart, the pixels each lights with their
// red, green and blue summed; how many of those out the eye has in view; and each mark against the page's own circuits
const PORTS_FROM_EYE = `(() => { const A = TitanicApp, C = TitanicCore, sim = A.state.sim, n = A.ports.n, pg = A.ports.pts.geometry, g = pg.attributes.position.array, o = pg.attributes.aOut.array, ci = A.ports.circuits();
  const F = C.frameOf(sim), M = A.shipGroup.matrixWorld, v = new THREE.Vector3(), gone = [], up = [], under = []; let inView = 0, wrong = ci ? 0 : n;
  const W = 800, H = 450, R = A.renderer, rt = new THREE.WebGLRenderTarget(W, H), buf = new Uint8Array(W * H * 4), cam = A.camera.clone();
  cam.aspect = W / H; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  for (let i = 0; i < n; i++) {
    const out = o[i] > 0.5, s = A.ports.sectionOf(i);
    if (ci && out !== (s >= 0 && ci.outs[s] >= 0)) wrong++;
    if (out) { gone.push(i); v.set(g[i * 3], g[i * 3 + 1], g[i * 3 + 2]).applyMatrix4(M).project(cam); if (Math.abs(v.x) <= 1 && Math.abs(v.y) <= 1 && v.z > -1 && v.z < 1) inView++; }
    else if (C.worldZ(F, g[i * 3], -g[i * 3 + 2], g[i * 3 + 1]) < 0) under.push(i); else up.push(i);
  }
  const draw = (idx, mat) => {
    const geo = new THREE.BufferGeometry(), p = new Float32Array(idx.length * 3), a = new Float32Array(idx.length);
    idx.forEach((i, j) => { p[j * 3] = g[i * 3]; p[j * 3 + 1] = g[i * 3 + 1]; p[j * 3 + 2] = g[i * 3 + 2]; a[j] = o[i]; });
    geo.setAttribute('position', new THREE.BufferAttribute(p, 3)); geo.setAttribute('aOut', new THREE.BufferAttribute(a, 1));
    const sc = new THREE.Scene(), her = new THREE.Group(); her.matrixAutoUpdate = false; her.matrix.copy(M); sc.add(her);
    const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; her.add(pts);
    const was = R.getRenderTarget(), cc = R.getClearColor(new THREE.Color()), ca = R.getClearAlpha();
    R.setRenderTarget(rt); R.setClearColor(0x000000, 1); R.clear(); R.render(sc, cam); R.readRenderTargetPixels(rt, 0, 0, W, H, buf);
    R.setRenderTarget(was); R.setClearColor(cc, ca); geo.dispose();
    const s = { k: 0, r: 0, g: 0, b: 0 };
    for (let q = 0; q < W * H; q++) if (buf[q * 4] + buf[q * 4 + 1] + buf[q * 4 + 2] > 6) { s.k++; s.r += buf[q * 4]; s.g += buf[q * 4 + 1]; s.b += buf[q * 4 + 2]; }
    return s;
  };
  const refl = A.nightScene.portRefl.material;
  const r = { lights: sim.plant ? sim.plant.lights : null, n, sections: ci ? ci.out : null, out: gone.length, nUp: up.length, nUnder: under.length, inView, wrong,
    gone: draw(gone, A.ports.mat), goneRefl: draw(gone, refl), up: draw(up, A.ports.mat), upRefl: draw(up, refl), under: draw(under, A.ports.mat), underRefl: draw(under, refl) };
  rt.dispose(); return r; })()`;

(async () => {
  const b = await B.launch({ dist });
  try {
    // ---- 1. the 1912 watch, its clock held early: the Night look on and off (real clicks), the scene as it was
    await b.open('#night=1912');
    await hold(b, 'sim.t >= 3', 'the watch under way');
    await frames(b, 6);
    const s0 = await b.ev(SIGNATURE);
    await b.click('bNight'); await frames(b, 6);
    const on1 = await b.ev(LOOK);
    await b.click('bNight'); await frames(b, 6);
    const s1 = await b.ev(SIGNATURE), off1 = await b.ev(LOOK);
    await b.click('bXray'); await frames(b, 4);           // the solid look first, then Night on and off again
    const s2 = await b.ev(SIGNATURE);
    await b.click('bNight'); await frames(b, 6);
    const on2 = await b.ev(LOOK);
    await b.click('bNight'); await frames(b, 6);
    const s3 = await b.ev(SIGNATURE);
    row('the Night button (a real click) turns the look on: the grid sea hidden, the night sea and its stars shown, the hull solid',
      `grid ${on1.grid}, night sea ${on1.nightSea}, stars ${on1.stars}, solid ${on1.solid}; pressed ${on1.pressed}`, 'false, true, true, true; pressed', !on1.grid && on1.nightSea && on1.stars && on1.solid && on1.on && on1.pressed === 'true' && !on2.grid && on2.nightSea && on2.solid);
    row('  and off again: the scene as it was, object by object, and the X-ray switch as it found it (on, then off)',
      `${s1.n} objects ${s1.sig === s0.sig ? 'the same' : 'CHANGED'}, X-ray ${s1.xray}; ${s3.n} ${s3.sig === s2.sig ? 'the same' : 'CHANGED'}, X-ray ${s3.xray}`, 'the same, true; the same, false',
      s1.sig === s0.sig && s0.xray && s1.xray && s1.pressed === 'true' && s3.sig === s2.sig && !s2.xray && !s3.xray && s3.pressed === 'false' && !off1.on && !off1.nightSea && off1.grid);
    await b.click('bXray'); await frames(b, 3);           // X-ray as the page starts, then the night for the rest of the watch
    await b.click('bNight'); await frames(b, 3);

    // ---- 2. the berg is not drawn before the bells, in the Night look or from either eye: every draw of it counted
    await b.ev(`(() => { window.__berg = 0; const g = TitanicApp.earth.children.find(o => o.isGroup); g.children[0].onBeforeRender = () => { window.__berg++; }; })()`);
    await run(b);
    await b.clickSel('[data-view="nest"]');
    await hold(b, 'sim.t >= 11', 'the step before the bells are due');
    const nestA = await b.ev(EYE_SHIP);
    // N2: a right-drag from the crow's nest (a view looked about from): the eye turns, the page neither pans nor orbits its
    // own camera, and Follow stays on (it went off: the page panned, as on its own views)
    const rd0 = await b.ev(FOLLOW);
    await drag(b, 760, 300, -150, 20, true);
    await frames(b, 4);
    const rd1 = await b.ev(FOLLOW);
    await b.clickSel('[data-view="nest"]'); await frames(b, 3);   // the eye looking ahead again (a view chosen resets its look)
    await b.clickSel('[data-view="boat"]'); await frames(b, 6);
    await b.clickSel('[data-view="astern"]'); await frames(b, 6);
    const pre = await b.ev(`({ drawn: window.__berg, visible: TitanicApp.earth.children.find(o => o.isGroup).visible, bells: TitanicApp.state.sim.night.tBells, t: TitanicApp.state.sim.t })`);
    await b.clickSel('[data-view="nest"]');
    await run(b);
    await hold(b, 'sim.night.tBells >= 0 && sim.t - sim.night.tBells >= 2 - 1e-9', 'two seconds after the bells');
    await frames(b, 6);
    const postNest = await b.ev('({ drawn: window.__berg, visible: TitanicApp.earth.children.find(o => o.isGroup).visible })');
    await shot(b, 'night-crows-nest-bells-plus-2s.png');
    await b.clickSel('[data-view="bridge"]'); await frames(b, 8);
    await shot(b, 'night-bridge-bells-plus-2s.png');
    // from the boat: the berg lies ahead of her, out of the boat's first view; a real drag turns the eye to it
    await b.clickSel('[data-view="boat"]'); await frames(b, 4);
    const turn = await b.ev(`(() => { const A = TitanicApp, g = A.earth.children.find(o => o.isGroup), w = new THREE.Vector3().setFromMatrixPosition(g.matrixWorld), c = A.camera.position;
      const d = new THREE.Vector3(0, 0, -1).applyQuaternion(A.camera.quaternion); let a = Math.atan2(w.z - c.z, w.x - c.x) - Math.atan2(d.z, d.x);
      while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return { a, drawn: window.__berg }; })()`);
    const dxUsed = Math.max(-600, Math.min(600, -turn.a / 0.004));     // the stage holds the pointer (pointer capture) past its edge
    await drag(b, 760, 300, dxUsed, 0);
    await frames(b, 6);
    const postBoat = await b.ev('({ drawn: window.__berg, yaw: TitanicApp.nightScene.look.boat.yaw })');
    row('before the bells the berg is not drawn: the Night look from astern, the crow\'s nest and the boat (every draw counted)', `${pre.drawn} draws; shown ${pre.visible}; bells ${pre.bells < 0 ? 'not yet' : 'rung'} at ${pre.t.toFixed(2)} s`, '0 draws; not shown; the bells to come', pre.drawn === 0 && !pre.visible && pre.bells < 0);
    row('  after them it is: drawn from the crow\'s nest, and from the boat once a real drag turns its eye to it', `nest ${postNest.drawn} draws; boat +${postBoat.drawn - turn.drawn} after a drag of ${dxUsed.toFixed(0)} px (the eye turned ${(postBoat.yaw * 180 / Math.PI).toFixed(1)} deg; the berg was ${(turn.a * 180 / Math.PI).toFixed(1)} deg off)`, 'more than 0 from each; the turn 0.004 rad a pixel, as on the Bridge', postNest.visible && postNest.drawn > 0 && postBoat.drawn > turn.drawn && Math.abs(postBoat.yaw + dxUsed * 0.004) < 0.01);

    // ---- 3. the crow's nest: an eye fixed in her frame at the foremast, carried by her pose, looking ahead
    const N = nestA.nest;
    const offA = Math.max(Math.abs(nestA.x - N.x), Math.abs(nestA.y - N.y), Math.abs(nestA.z - N.z));
    // ---- 4. the boat: fixed to the earth over ten seconds of her at 22.5 knots (the button again lays it off her beam)
    await run(b);
    await b.clickSel('[data-view="boat"]'); await frames(b, 4);
    const e0 = await b.ev(EYE_EARTH);
    await b.waitFor(`TitanicApp.state.sim.t >= ${e0.t + 10}`, 60000, 'ten seconds of the watch');
    await frames(b, 2);
    const e1 = await b.ev(EYE_EARTH);
    const moved = Math.max(Math.abs(e1.N - e0.N), Math.abs(e1.E - e0.E), Math.abs(e1.up - e0.up)), ran = Math.hypot(e1.X - e0.X, e1.Y - e0.Y);
    row('the boat\'s eye is fixed to the earth: ten seconds of the watch at 22.5 knots, its place on the earth unmoved',
      `moved ${moved.toExponential(1)} m in ${(e1.t - e0.t).toFixed(2)} s while she ran ${ran.toFixed(1)} m at ${e0.kn.toFixed(2)} kn; eye ${e1.up.toFixed(3)} m up`, 'under 1e-6 m; she runs more than 100 m; 1.2 m up',
      moved < 1e-6 && ran > 100 && Math.abs(e0.kn - 22.5) < 0.05 && Math.abs(e1.up - 1.2) < 1e-9 && e1.view === 'boat');
    // the wheel (a real turn) brings the boat nearer her
    const near0 = await b.ev(`(() => { const A = TitanicApp, m = A.state.sim.mo, B = A.nightScene.boat; return Math.hypot(B.N - m.X, B.E - m.Y); })()`);
    await b.page.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 760, y: 300, deltaX: 0, deltaY: -400 });
    await frames(b, 4);
    const near1 = await b.ev(`(() => { const A = TitanicApp, m = A.state.sim.mo, B = A.nightScene.boat; return { d: Math.hypot(B.N - m.X, B.E - m.Y), up: A.camera.position.y }; })()`);
    row('  the mouse wheel (a real turn) brings the boat nearer her, the eye still 1.2 m above the sea', `${near0.toFixed(0)} m -> ${near1.d.toFixed(0)} m; ${near1.up.toFixed(3)} m up`, 'nearer by about 40 % (exp(-0.48)); 1.2 m', near1.d < 0.75 * near0 && near1.d > 0.5 * near0 && Math.abs(near1.up - 1.2) < 1e-9);

    // ---- 5. the damage preset: the boat about 300 m off her port beam; her lights from it by the 1910 rules
    await b.open('#scenario=titanic');
    await b.clickSel('[data-view="boat"]'); await frames(b, 6);
    const off = await b.ev(EYE_OFF_HER);
    row('on the 1912 damage preset (stopped at the origin) the boat lies about 300 m off her beam, 1.2 m up', `${off.d.toFixed(2)} m off, ${off.off.toFixed(2)} deg off her bow, ${off.port ? 'port' : 'starboard'} side, ${off.up.toFixed(3)} m up`, '300 m, 90 deg (abeam), 1.2 m', Math.abs(off.d - 300) < 3 && Math.abs(off.off - 90) < 2 && Math.abs(off.up - 1.2) < 1e-9 && off.view === 'boat');
    const lt = await b.ev('TitanicApp.navLights.map(o => [o.L.id, +o.factor.toFixed(3), +o.bearing.toFixed(1)])');
    const f = Object.fromEntries(lt.map(r => [r[0], r[1]])), brg = Object.fromEntries(lt.map(r => [r[0], r[2]]));
    row('her lights from the boat\'s eye keep the 1910 rules: abeam to port, the masthead and the red light, no stern light, no green', lt.map(r => `${r[0]} ${r[1]} at ${r[2]} deg`).join('; '), 'masthead and port 1; starboard and stern 0',
      f.masthead > 0.99 && f.port > 0.99 && f.starboard === 0 && f.stern === 0 && brg.masthead < -90 && brg.masthead > -112.5);
    // the preset in the Night look at 900x: 2:05 am (the boat's picture, the crow's nest's eye with her trim), then dark
    await b.click('bNight');
    await b.ev('TitanicApp.state.speed = 900');
    await hold(b, 'sim.t >= 145 * 60', 'about 2:05 am');
    await frames(b, 8);
    await shot(b, 'night-boat-1912-preset-2-05am-lit.png');
    const lit205 = await b.ev('({ on: TitanicApp.ports.mat.uniforms.uOn.value, clock: TitanicApp.clockOf(TitanicApp.state.sim.t), trim: TitanicCore.readouts(TitanicApp.state.sim).trimDeg })');
    // D97: her lights still burning, no port whose section's fuses have blown is drawn or lights the sea; a lit port under
    // the sea is drawn dimmer and blue-green and glows through the water; the lit ones above are drawn and reflected: her
    // ports alone from the boat's eye, the three sets apart, in her ports and in the sea
    const f6 = await b.ev(PORTS_FROM_EYE);
    const mean = (s) => (s.k ? (s.r + s.g + s.b) / s.k : 0);
    row('D97: at 2:05 am from the boat, nothing drawn or in the sea from a port whose section is out; a lit port under the sea drawn dimmer and blue-green, glowing through; the others drawn and reflected',
      `${f6.sections} sections blown, ${f6.out} of ${f6.n} ports out (${f6.inView} in view; ${f6.wrong} marks off the page's circuits), lights ${f6.lights}: ${f6.gone.k} pixels drawn, ${f6.goneRefl.k} in the sea; the ${f6.nUp} lit above the sea ${f6.up.k} drawn, ${f6.upRefl.k} in the sea; the ${f6.nUnder} lit under it ${f6.under.k} drawn (red ${f6.under.r} against blue ${f6.under.b}, ${mean(f6.under).toFixed(0)} a pixel against ${mean(f6.up).toFixed(0)} above), ${f6.underRefl.k} glowing through the sea`,
      'none from those out; above drawn and reflected; under dimmer, blue-green and glowing through',
      f6.lights > 0 && f6.wrong === 0 && f6.out > 50 && f6.inView > 20 && f6.gone.k === 0 && f6.goneRefl.k === 0 && f6.up.k > 50 && f6.upRefl.k > 0 &&
      f6.nUnder > 20 && f6.under.k > 0 && f6.under.b > f6.under.r && mean(f6.under) < mean(f6.up) && f6.underRefl.k > 0);
    await b.clickSel('[data-view="nest"]'); await frames(b, 4);
    const nestB = await b.ev(EYE_SHIP);
    const offB = Math.max(Math.abs(nestB.x - N.x), Math.abs(nestB.y - N.y), Math.abs(nestB.z - N.z));
    const wmove = Math.hypot(nestB.world[0] - nestA.world[0], nestB.world[1] - nestA.world[1], nestB.world[2] - nestA.world[2]);
    row('the crow\'s nest\'s eye stands at the foremast in her frame, carried by her pose (to 1e-6 m), looking ahead',
      `(${N.x.toFixed(2)}, ${N.y.toFixed(2)}, ${N.z.toFixed(2)}) m, ${N.above} m over her waterline; off by ${offA.toExponential(1)} at ${nestA.t.toFixed(0)} s of the watch, ${offB.toExponential(1)} at ${lit205.clock} (trim ${nestB.trim.toFixed(1)} deg, the eye moved ${wmove.toFixed(1)} m); ahead ${nestA.ahead.toFixed(4)}`,
      'the foremast at 93.5 m (raked); under 1e-6; ahead over 0.99',
      Math.abs(N.x - 93.5) < 1.5 && N.y === 0 && offA < 1e-6 && offB < 1e-6 && nestA.ahead > 0.99 && wmove > 1 && nestA.fov === 58 && nestA.view === 'nest');
    row('  a right-drag from the crow\'s nest (a real drag) turns the eye and leaves Follow on: the page neither pans nor orbits (N2: the view is looked about from)',
      `Follow ${rd0.follow} -> ${rd1.follow} (button ${rd1.pressed}); the eye turned ${((rd1.yaw - rd0.yaw) * 180 / Math.PI).toFixed(1)} deg; the page's orbit ${rd1.theta === rd0.theta && rd1.phi === rd0.phi && rd1.r === rd0.r ? 'unmoved' : 'MOVED'}`,
      'on -> on; turned 0.004 rad a pixel; unmoved', rd0.view === 'nest' && rd1.view === 'nest' && rd0.follow && rd1.follow && rd1.pressed === 'true' && Math.abs((rd1.yaw - rd0.yaw) - 150 * 0.004) < 0.01 && rd1.theta === rd0.theta && rd1.phi === rd0.phi && rd1.r === rd0.r);
    await b.clickSel('[data-view="boat"]'); await frames(b, 4);
    await run(b);
    // held on the plant's own step (the page notes the failure only once a frame, and at 900x one frame can run past it
    // to the foundering): four seconds after her dynamos stop, her lights' three-second fade done
    await hold(b, 'sim.plant && sim.plant.lights === 0 && sim.plant.events.dark !== undefined && sim.t >= sim.plant.events.dark + 4', 'her lights out', 240000);
    await frames(b, 8);
    await shot(b, 'night-boat-1912-preset-lights-out.png');
    const dark = await b.ev('({ on: TitanicApp.ports.mat.uniforms.uOn.value, clock: TitanicApp.clockOf(TitanicApp.state.sim.t), refl: TitanicApp.nightScene.portRefl.visible, why: TitanicApp.state.lightsFailWhy })');
    row('the preset in the Night look from the boat: her ports lit at 2:05 am; after her lights fail none, nor their reflections', `${lit205.clock}: lights ${lit205.on}, trim ${lit205.trim.toFixed(1)} deg; ${dark.clock}: lights ${dark.on} (${dark.why}), reflections ${dark.refl ? 'shown' : 'gone'}`, 'lit; then dark, no reflections', lit205.on === 1 && dark.on === 0 && !dark.refl);

    // ---- 6. the part feeds nothing back: the 1912 orders (a real click) watched in the Night look from the boat
    await b.open('#night=1912');
    await b.click('bNight'); await b.clickSel('[data-view="boat"]');
    await b.click('bAuto');
    await b.waitFor('TitanicApp.state.night.mode === "auto" && TitanicApp.state.sim.night.k < 40', 10000, 'the 1912 orders');
    await frames(b, 3);
    // the restart built new bulkheads: in the night none of the X-ray look's parts shows (the bulkheads, their tops, letters)
    const kept = await b.ev(`({ view: TitanicApp.state.view, on: TitanicApp.nightScene.on, xrayParts: TitanicApp.shipGroup.children.filter(o => o.visible && ((o.isSprite && o.renderOrder === 9) || (o.isLine && o.renderOrder === 8) || (o.material && o.material.uniforms && o.material.uniforms.uF))).length })`);
    await b.ev('TitanicApp.state.warp = 6');
    await b.waitFor('TitanicApp.state.sim.night.tClear >= 0', 240000, 'the end of the encounter');
    const w = await b.ev(`(() => { const s = TitanicApp.state.sim, u = TitanicNight.summary(s); return { k: s.night.k, fp: u.fingerprint, kind: u.kind, area: u.area, view: TitanicApp.state.view, on: TitanicApp.nightScene.on }; })()`);
    const bare = await b.ev(`(() => { const N = TitanicNight, s = N.create(TitanicCore.buildShip(), N.spec(1912), { auto: true }); while (s.night.k < ${w.k}) N.step(s); return N.fingerprint(s); })()`);
    row('the part feeds nothing back: the 1912 orders watched in the Night look from the boat have the model\'s fingerprint', `page ${w.fp}, model alone ${bare}; ${w.kind}, ${w.area.toFixed(4)} m2; the eye ${kept.view} -> ${w.view}, Night ${w.on}, X-ray parts shown ${kept.xrayParts}`, 'equal, bit for bit; the boat and the night kept through the restart, nothing of X-ray', w.fp === bare && kept.view === 'boat' && kept.on && kept.xrayParts === 0 && w.view === 'boat' && w.on);
    if (shots) {                                           // under way: the quarter view in both looks, at one moment
      await b.click('bAuto');
      await b.waitFor('TitanicApp.state.night.mode === "auto" && TitanicApp.state.sim.night.k < 40', 10000, 'the 1912 orders again');
      await b.ev('TitanicApp.state.warp = 4');
      await hold(b, 'sim.night.tTouch >= 0 && sim.t - sim.night.tTouch >= 6 - 1e-9', 'six seconds after the touch');
      await b.clickSel('[data-view="quarter"]'); await B.sleep(2500); await frames(b, 4);
      await shot(b, 'night-quarter-under-way-wake.png');
      await b.click('bXray'); await frames(b, 8);           // the X-ray look takes over from the night
      await shot(b, 'xray-quarter-under-way-wake.png');
    }

    // ---- 7. a phone: the new buttons on the screen with the others, 40 px tall; a real tap takes the boat's eye
    await b.page.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 780, deviceScaleFactor: 2, mobile: true });
    await b.page.send('Emulation.setTouchEmulationEnabled', { enabled: true });
    await b.open('#night=1912');
    const ph = await b.ev(`(() => { const r = (el) => { el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); const q = el.getBoundingClientRect(); return { l: q.left, r: q.right, t: q.top, b: q.bottom, h: q.height }; };
      const q = (s) => document.querySelector(s), out = {};
      for (const [k, s] of [['bridge', '[data-view="bridge"]'], ['nest', '[data-view="nest"]'], ['boat', '[data-view="boat"]'], ['xray', '#bXray'], ['night', '#bNight']]) out[k] = r(q(s));
      out.device = TitanicApp.device(); out.w = innerWidth; out.h = innerHeight;
      out.row = q('[data-view="nest"]').parentElement === q('[data-view="bridge"]').parentElement && q('#bNight').parentElement === q('#bXray').parentElement;
      return out; })()`);
    const inside = (k) => ph[k].l >= 0 && ph[k].r <= ph.w && ph[k].t >= 0 && ph[k].b <= ph.h;
    await b.clickSel('[data-view="boat"]'); await frames(b, 4);
    const tapped = await b.ev('TitanicApp.state.view');
    row('on a phone (390 x 780, touch) the new buttons sit with the others, on the screen, 40 px tall; a real tap takes the boat\'s eye',
      `${ph.device}; Crow's nest ${Math.round(ph.nest.h)} px, Boat ${Math.round(ph.boat.h)} px, Night ${Math.round(ph.night.h)} px (Bridge ${Math.round(ph.bridge.h)}, X-ray ${Math.round(ph.xray.h)}); tops ${Math.round(ph.nest.t)}/${Math.round(ph.boat.t)}/${Math.round(ph.night.t)} with ${Math.round(ph.bridge.t)}/${Math.round(ph.xray.t)}; view ${tapped}`,
      'phone; each at least 40 px, inside the screen, in the others\' row; boat',
      ph.device === 'phone' && ph.row && ['nest', 'boat', 'night'].every(k => ph[k].h >= 40 && inside(k)) && Math.abs(ph.nest.t - ph.bridge.t) < 1.5 && Math.abs(ph.boat.t - ph.bridge.t) < 1.5 && Math.abs(ph.night.t - ph.xray.t) < 1.5 && tapped === 'boat');
    row('no error in the page\'s console through all of it', b.errors.length ? b.errors.slice(0, 3).join(' | ') : 'none', 'none', b.errors.length === 0);
    console.log(fails ? `FAIL: ${fails} row(s)` : `PASS: all ${rows.length} rows`);
  } catch (e) {
    fails++; console.log('FAIL the test could not finish: ' + e.message); if (b.errors.length) console.log('page errors: ' + b.errors.slice(0, 5).join(' | '));
  } finally {
    await b.close();
    process.exit(fails ? 1 : 0);
  }
})();
