// Her wake in the page's other pieces (K4): the Night look's sea, and her hull's waterline. A part of the viewer
// (site/app.js, "parts"); the wake itself is site/parts/24_wake_field.js and 25_wake.js.
//
//   - The Night look's sea, the stars' reflections in it and her lit ports' reflections all take the sea's tilt from one
//     function, slope(p), in site/parts/20_night_scene.js. That function adds wakeSlope(p), which is nought until this
//     part puts the wake's own in its place: the slopes of the field round her, where 25_wake.js last uploaded them,
//     carried with her between refreshes and read round her hull as 25_wake.js reads them. Her waves then show by
//     night as a starlit sea does show them: in the sky they mirror and the points of light they break up.
//   - Her hull's shaders (site/app.js: the X-ray and solid hulls; the Night look's hull) find the sea against her plating
//     through seaZ(x, ys), nought until this part puts its own in place: the sea's height at 256 stations along each side
//     (the library's alongside), with her bow wave piled up about her stem. The waterline's glow, the water's tint on her
//     and the eye looking through the water then follow her own waves: the crest at her stem, the trough abaft it.
//   - Both are drawing only. They read what 25_wake.js keeps and feed nothing back; with the wake off or flat both give
//     exactly the page without them (tools/wake_site_test.js compares a frame).
//   - The uniforms reach the night's three materials through the Night look's shared uniforms (TitanicApp.nightScene.U),
//     and every hull material and every per-piece copy of one through TitanicApp.hullUniform; the GLSL is this part's,
//     put in place of the marked default in each shader's text (/* wake: ... */ to /* wake end */).
(function () {
  'use strict';
  const A = window.TitanicApp, WF = window.TitanicWakeField, T3 = window.THREE;
  if (!A || !WF || !T3 || !A.wakeField || !A.wakeField.tex) return;
  const WP = A.wakeField, W = WP.W, CFG = WF.CFG;
  const N_SIDE = 256, SIDE_FULL = 5.0;                 // stations along her; m of sea at a byte's full scale
  const MARK = /\/\* wake: (\w+) \*\/[\s\S]*?\/\* wake end \*\//;

  // ------------------------------------------------------------------ the sea along her sides, as a texture
  const sideBuf = new Float32Array(2 * N_SIDE), sideBytes = new Uint8Array(4 * N_SIDE);
  const sideTex = new T3.DataTexture(sideBytes, N_SIDE, 1, T3.RGBAFormat, T3.UnsignedByteType);
  sideTex.magFilter = sideTex.minFilter = T3.LinearFilter; sideTex.generateMipmaps = false; sideTex.wrapS = sideTex.wrapT = T3.ClampToEdgeWrapping; sideTex.needsUpdate = true;
  const h = W.hull;
  const uSeaSide = { value: sideTex }, uSeaSideX = { value: new T3.Vector4(h.x0, 1 / (h.x1 - h.x0), SIDE_FULL, 0) };
  function fillSide() {
    WF.alongside(W, N_SIDE, sideBuf);
    const q = 127 / SIDE_FULL;
    for (let i = 0; i < N_SIDE; i++) {
      const p = 128.5 + sideBuf[2 * i] * q, s = 128.5 + sideBuf[2 * i + 1] * q;
      sideBytes[4 * i] = p < 1 ? 1 : (p > 255 ? 255 : p); sideBytes[4 * i + 1] = s < 1 ? 1 : (s > 255 ? 255 : s); sideBytes[4 * i + 2] = 128; sideBytes[4 * i + 3] = 255;
    }
    sideTex.needsUpdate = true;
  }
  // the hull's GLSL: ys >= 0 is to port (the core's frame, site/app.js: three's local (x, z, -y))
  const GLSL_SEAZ = `/* wake: seaZ */
    uniform sampler2D uSeaSide; uniform vec4 uSeaSideX;
    float seaZ(float x, float ys){
      if (uSeaSideX.w <= 0.0) return 0.0;
      float u = (x - uSeaSideX.x) * uSeaSideX.y;
      if (u <= 0.0 || u >= 1.0) return 0.0;
      vec4 t = texture2D(uSeaSide, vec2(u, 0.5));
      return ((ys >= 0.0 ? t.r : t.g) * 255.0 - 128.0) * (uSeaSideX.z / 127.0) * uSeaSideX.w;
    }
    /* wake end */`;

  // ------------------------------------------------------------------ the night sea's slope
  // the scene's frame to the field's: her drawn place is the scene's origin on a watch (site/app.js, updateWatchScene),
  // the earth turned by her heading psi; a scene point p (x, z) is (p.x c - p.y s, p.x s + p.y c) m north and east of her.
  // The layers' corners are taken from where she was when the sea was last refreshed (the field rides with her between).
  const GLSL_SLOPE = `/* wake: slope */
    uniform sampler2D uWakeN; uniform sampler2D uWakeF; uniform sampler2D uWakeHull;
    uniform vec4 uWakeT;   // cos psi, sin psi, her place in the scene (x, z)
    uniform vec4 uWakeO;   // the near and the far layer's corners: m north, m east of where she was at the last refresh
    uniform vec4 uWakeS;   // the near and far layers' sizes (m); the slope at a byte's full scale; on (0 to 1: the wake's fade)
    uniform vec3 uWakeHX;  // her waterline's half-breadth along her: x0, 1 / length, full scale (m)
    vec2 wakeAt(sampler2D t, vec2 ne, float size){ vec2 uv = ne.yx / size; if (any(lessThan(uv, vec2(0.0))) || any(greaterThan(uv, vec2(1.0)))) return vec2(0.0); return (texture2D(t, uv).rg * 255.0 - 128.0) * (uWakeS.z / 127.0); }
    vec2 wakeSlope(vec2 p){
      if (uWakeS.w <= 0.0) return vec2(0.0);
      float c = uWakeT.x, s = uWakeT.y; vec2 q = p - uWakeT.zw;
      vec2 ne = vec2(q.x * c - q.y * s, q.x * s + q.y * c);                      // m north, m east of her
      float x = ne.x * c + ne.y * s, y = -ne.x * s + ne.y * c;                   // her frame: forward, to starboard
      float hu = (x - uWakeHX.x) * uWakeHX.y;
      float b = (hu > 0.0 && hu < 1.0) ? texture2D(uWakeHull, vec2(hu, 0.5)).r * uWakeHX.z : 0.0;
      float q2 = y * y - b * b; if (q2 < 0.0) return vec2(0.0);                // under her: her hull hides it
      float y0 = sign(y) * sqrt(q2);
      ne = vec2(x * c - y0 * s, x * s + y0 * c);                                 // read nearer her centre line, as the near layer does
      vec2 g = wakeAt(uWakeN, ne - uWakeO.xy, uWakeS.x) + wakeAt(uWakeF, ne - uWakeO.zw, uWakeS.y);   // d(height)/d(north), d/d(east)
      return uWakeS.w * vec2(g.x * c + g.y * s, -g.x * s + g.y * c);            // in the scene's (x, z)
    }
    /* wake end */`;

  // ------------------------------------------------------------------ putting the GLSL in place
  const done = new WeakSet(), originals = new Map();   // a material's own text, kept so that the tests can put it back
  let held = false;                                   // the tests' switch: the defaults back in place, nothing installed
  function install(mat, glsl, name, uniforms) {
    if (held || !mat || !mat.isShaderMaterial || done.has(mat)) return false;
    const src = mat.fragmentShader, vsrc = mat.vertexShader, m = MARK.exec(src), mv = MARK.exec(vsrc || '');
    let ok = false;
    if (m && m[1] === name) { mat.fragmentShader = src.replace(MARK, glsl); ok = true; }
    if (mv && mv[1] === name) { mat.vertexShader = vsrc.replace(MARK, glsl); ok = true; }   // the stars' and ports' reflections take the slope in their vertex shaders
    if (ok) { originals.set(mat, [src, vsrc]); if (uniforms) for (const k in uniforms) mat.uniforms[k] = uniforms[k]; mat.needsUpdate = true; done.add(mat); }
    return ok;
  }
  function uninstall() {                              // the defaults back: the page as it is without this part (for the tests)
    for (const [mat, [f, v]] of originals) { mat.fragmentShader = f; mat.vertexShader = v; mat.needsUpdate = true; done.delete(mat); }
    originals.clear(); held = true;
  }
  // the night's uniforms on its shared U (site/parts/20_night_scene.js), filled here
  const NS = A.nightScene, NU = NS && NS.U;
  if (NU && NU.uWakeS) {
    NU.uWakeN.value = WP.tex.near; NU.uWakeF.value = WP.tex.far; NU.uWakeHull.value = WP.tex.hull;
    NU.uWakeHX.value.set(h.x0, 1 / (h.x1 - h.x0), WP.sizes.hull); NU.uWakeS.value.set(WP.sizes.near, WP.sizes.far, CFG.slopeFull, 0);
    installNight();                                   // the same uniform objects on the three: one set
  }
  // the hull's uniforms on every hull material and per-piece copy (site/app.js: TitanicApp.hullUniform)
  const hullOK = typeof A.hullUniform === 'function';
  if (hullOK) { A.hullUniform('uSeaSide', uSeaSide); A.hullUniform('uSeaSideX', uSeaSideX); }
  const hullMats = () => [A.hull && A.hull.material, NS && NS.hullMat].filter(Boolean);

  // ------------------------------------------------------------------ each frame
  let seen = null, onNight = 0, onHull = 0;
  A.on('reset', () => { seen = null; uSeaSideX.value.w = 0; if (NU && NU.uWakeS) NU.uWakeS.value.w = 0; });
  A.on('frame', () => {
    // a hull material put on her since (a look switched, a part's piece) gets the GLSL; its copies follow it
    if (hullOK) for (const m of hullMats()) install(m, GLSL_SEAZ, 'seaZ');
    const s = WP.shown, fade = WP.on && WP.near.visible ? WP.fade : 0;
    if (s && s !== seen) {                           // the sea was refreshed: the sides' heights, and the layers' corners against her place then
      seen = s; fillSide();
      if (NU && NU.uWakeO) { const cn = WP.corner('near'), cf = WP.corner('far'); NU.uWakeO.value.set(cn[0] - s.X, cn[1] - s.Y, cf[0] - s.X, cf[1] - s.Y); }
    }
    onHull = hullOK && s ? fade : 0; uSeaSideX.value.w = onHull;
    if (NU && NU.uWakeS) {
      onNight = s && NS.on ? fade : 0; NU.uWakeS.value.w = onNight;
      const psi = A.earth.rotation.y; NU.uWakeT.value.set(Math.cos(psi), Math.sin(psi), 0, 0);
    }
  });

  // the night's three materials: installed now, and again after the tests have put the defaults back
  function installNight() { if (!(NU && NU.uWakeS)) return; const wakeU = {}; for (const k of Object.keys(NU)) if (k.startsWith('uWake')) wakeU[k] = NU[k]; for (const m of [NS.sea && NS.sea.material, NS.starRefl && NS.starRefl.material, NS.portRefl && NS.portRefl.material]) install(m, GLSL_SLOPE, 'slope', wakeU); }
  // for the tests (tools/wake_site_test.js)
  A.wakeSeams = {
    uninstall, reinstall: () => { held = false; installNight(); },   // the hulls follow on the next frame
    // one frame drawn now and read back (RGBA bytes of the whole canvas): to compare the page with and without
    grab: () => { const r = A.renderer, gl = r.getContext(); r.render(A.scene, A.camera); const w = gl.drawingBufferWidth, hgt = gl.drawingBufferHeight, px = new Uint8Array(w * hgt * 4); gl.readPixels(0, 0, w, hgt, gl.RGBA, gl.UNSIGNED_BYTE, px); return { w, h: hgt, px }; },
    sides: () => Array.from(sideBuf), SIDE_FULL, N_SIDE, u: { seaSideX: uSeaSideX, wakeS: NU ? NU.uWakeS : null },
    status: () => ({ night: !!(NU && NU.uWakeS), hull: hullOK, onNight, onHull, nightInstalled: NS ? [NS.sea, NS.starRefl, NS.portRefl].map(o => !!(o && done.has(o.material))) : [], hullInstalled: hullMats().map(m => done.has(m)) }),
  };
})();
