// Her wake, computed. A part of the viewer (site/app.js, "parts"); the wave field itself is site/parts/24_wake_field.js.
//
//   - On a watch, each step of the model is read here once (her place, heading, surge, sway, yaw rate, the three
//     shafts' thrust and revolutions) and handed to the library, which keeps the sea round her as two windows of waves and
//     the white water on it. Nothing is fed back: a watch has the same fingerprint with this part as without
//     (tools/wake_site_test.js).
//   - What is the model's: where the waves are and how high (her hull's own thin-ship waves, scaled to the energy her
//     resistance spends on waves); where the white water is made (where that sea is too steep to stand, off her bows, in
//     her screws' races) and how long it lasts. Every strength and lifetime is a bet, listed in the library's CFG.
//   - [appearance]: how it is drawn. The waves as a sheen on the slopes that face one side and a shade on the others,
//     and in the X-ray look as lines of equal height besides; the white water as foam whose edges are broken by a pattern
//     fixed to the sea (from a fixed seed), pushed about by eddies the more the older it is; the colours of the three
//     looks (LOOK below). Between two refreshes of the sea the picture rides with her (the pattern of a ship on a steady
//     course does), so that it does not stutter at the model's four steps a second.
//   - It lays two meshes on the page's earth, takes the page's drawn ribbon, bow wave and Kelvin lines out of sight while
//     its own are shown (the order marks stay), and puts them back when it is switched off, when time runs faster than
//     the field can follow (over PACE_MAX times her own), and while the field is being made (a watch's first seconds).
//   - The work is taken a piece at a time (BUDGET ms a frame): tools/wake_site_test.js times it.
(function () {
  'use strict';
  const A = window.TitanicApp, WF = window.TitanicWakeField, T3 = window.THREE;
  if (!A || !WF || !T3 || !A.state || !A.earth || !A.wake || !A.renderer) return;
  const S = A.state, CFG = WF.CFG, E0 = A.E0, old = A.wake;
  const PACE_MAX = 8;                                 // times her own pace: faster than this the field is let go [stated]
  const BUDGET = 4, BUDGET_MAKING = 9;                // ms of a drawn frame for the field: up with her, and while it is being made [stated]
  const REFRESH = 0.5;                                // s of hers between refreshes of the sea at her own pace; at most six a second of ours
  // [appearance] the three looks: the breakers' and the races' foam, the sheen on a slope, and k = [the slope that gives
  // full sheen, the shade's depth, the height lines' strength, the foam's opacity]; the height between lines in the X-ray look
  const LOOK = {
    solid: { colB: [0.88, 0.94, 0.98], colW: [0.58, 0.74, 0.82], colS: [0.11, 0.24, 0.32], k: [0.14, 0.50, 0.0, 0.96] },
    xray: { colB: [0.80, 0.91, 0.98], colW: [0.48, 0.68, 0.82], colS: [0.07, 0.17, 0.24], k: [0.16, 0.35, 0.45, 0.82] },
    night: { colB: [0.36, 0.39, 0.43], colW: [0.21, 0.24, 0.28], colS: [0.020, 0.027, 0.038], k: [0.16, 0.30, 0.0, 0.90] },
  };
  const LINE_STEP = 0.25, LIGHT = [-0.45, -0.89], EDDY = 11, TILE = 256;   // m between height lines; where the sheen's light comes from (north, east); m an old race is pushed about; the pattern's tile
  const W = WF.createWake();
  const n = W.n, sizeN = n * W.near.dx, sizeF = n * W.far.dx;

  // ------------------------------------------------------------------ textures
  function dataTex(data, format, mip) {
    const t = new T3.DataTexture(data, n, n, format, T3.UnsignedByteType);
    t.magFilter = T3.LinearFilter; t.minFilter = mip ? T3.LinearMipmapLinearFilter : T3.LinearFilter; t.generateMipmaps = !!mip;
    t.wrapS = t.wrapT = T3.ClampToEdgeWrapping; t.anisotropy = Math.min(4, A.renderer.capabilities.getMaxAnisotropy()); t.needsUpdate = true;
    return t;
  }
  const texNear = dataTex(W.texNear, T3.RGBAFormat, true), texRace = dataTex(W.texRace, T3.LuminanceFormat, true), texFar = dataTex(W.texFar, T3.RGBAFormat, true);
  // her waterline's half-breadth along her length, for her hull in the picture (the library's fieldY, in the shader)
  const HB = 16, hullTex = (() => {
    const m = 256, d = new Uint8Array(m * 4), h = W.hull;
    for (let i = 0; i < m; i++) { const b = WF.waterline(h, h.x0 + (h.x1 - h.x0) * (i + 0.5) / m); d[i * 4] = Math.round(255 * Math.min(1, b / HB)); d[i * 4 + 3] = 255; }
    const t = new T3.DataTexture(d, m, 1, T3.RGBAFormat, T3.UnsignedByteType); t.magFilter = t.minFilter = T3.LinearFilter; t.generateMipmaps = false; t.wrapS = t.wrapT = T3.ClampToEdgeWrapping; t.needsUpdate = true;
    return t;
  })();
  // [appearance] a pattern that tiles, from a fixed seed: r, g break the foam's edges (each spread evenly over 0..1, so
  // that foam of strength c whitens about c of the sea); b, a are the eddies that push old foam about
  const noiseTex = (() => {
    const N = 256, d = new Uint8Array(N * N * 4); let s = 1912;
    const rnd = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const gauss = () => Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(2 * Math.PI * rnd());
    const re = new Float64Array(N * N), im = new Float64Array(N * N), idx = new Uint32Array(N * N);
    for (let ch = 0; ch < 4; ch++) {
      // random waves of every direction (so the pattern has no grain), k0 to k1 of them across the tile, their strength
      // falling as their number to the power p: fine and broken for the foam's edges, broad for the eddies
      const k0 = ch < 2 ? 3 : 2, k1 = ch < 2 ? 100 : 9, p = ch < 2 ? 1.25 : 1.0;
      for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) {
        const ka = a < N / 2 ? a : a - N, kb = b < N / 2 ? b : b - N, k = Math.sqrt(ka * ka + kb * kb), o = a * N + b, amp = k >= k0 && k <= k1 ? Math.pow(k, -p) : 0;
        re[o] = amp * gauss(); im[o] = amp * gauss();
      }
      WF.fft2(re, im, N, true);
      for (let i = 0; i < N * N; i++) idx[i] = i;
      idx.sort((u, v) => re[u] - re[v]);
      for (let i = 0; i < N * N; i++) d[idx[i] * 4 + ch] = Math.floor(256 * i / (N * N));
    }
    const t = new T3.DataTexture(d, N, N, T3.RGBAFormat, T3.UnsignedByteType); t.magFilter = T3.LinearFilter; t.minFilter = T3.LinearMipmapLinearFilter; t.generateMipmaps = true;
    t.wrapS = t.wrapT = T3.RepeatWrapping; t.needsUpdate = true;
    return t;
  })();

  // ------------------------------------------------------------------ the two layers
  const U = {                                         // shared by both
    uFar: { value: texFar }, uNoise: { value: noiseTex }, uSizeF: { value: sizeF }, uHmaxF: { value: 1 }, uSlopeFull: { value: CFG.slopeFull }, uFoamMax: { value: CFG.foamMax },
    uSlide: { value: new T3.Vector2() }, uLight: { value: new T3.Vector2(LIGHT[0], LIGHT[1]) }, uFade: { value: 0 }, uStep: { value: LINE_STEP }, uEddy: { value: EDDY }, uNight: { value: 0 },
    uColB: { value: new T3.Vector3() }, uColW: { value: new T3.Vector3() }, uColS: { value: new T3.Vector3() }, uK: { value: new T3.Vector4() },
  };
  const VERT = 'uniform float uSize; varying vec2 vP; void main(){ vP = position.xz * uSize; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
  const FRAG = `
    uniform sampler2D uFar; uniform sampler2D uNoise;
    uniform float uSizeF; uniform float uHmaxF; uniform float uSlopeFull; uniform float uFoamMax; uniform float uFade; uniform float uStep; uniform float uEddy; uniform float uNight;
    uniform vec2 uSlide; uniform vec2 uLight; uniform vec2 uNoiseOff; uniform vec2 uShip; uniform vec2 uHead; uniform vec2 uRamp; uniform vec3 uCam;
    uniform vec3 uColB; uniform vec3 uColW; uniform vec3 uColS; uniform vec4 uK;
    varying vec2 vP;
    #ifdef NEAR
    uniform sampler2D uWave; uniform sampler2D uRace; uniform sampler2D uHull;
    uniform float uSizeN; uniform float uHmaxN; uniform vec2 uFarOff; uniform vec3 uHullX;
    #else
    uniform vec4 uNearRect;
    #endif
    // a place (m north, m east of a window's corner) in that window's texture: its rows run north, its columns east
    vec2 at(vec2 p, float size){ return p.yx / size; }
    vec2 slopeOf(vec4 t){ return (t.rg * 255.0 - 128.0) * (uSlopeFull / 127.0); }
    float heightOf(vec4 t, float hm){ return (t.b * 255.0 - 128.0) * (hm / 127.0); }
    // slope and height of the sea, the breakers' foam and the races', a place in the pattern -> premultiplied colour
    vec4 shade(vec2 slope, float h, float fb, float fw, vec2 nuv, float away){
      float lace = 0.55 * texture2D(uNoise, nuv).r + 0.45 * texture2D(uNoise, nuv * 4.0).g;
      float cb = clamp(fb, 0.0, 1.0), cw = clamp(fw, 0.0, 1.0);
      float ab = smoothstep(1.0 - cb - 0.20, 1.0 - cb + 0.20, lace) * clamp(cb * 6.0, 0.0, 1.0) * (0.45 + 0.55 * cb);
      float aw = smoothstep(1.0 - cw - 0.36, 1.0 - cw + 0.36, lace) * clamp(cw * 8.0, 0.0, 1.0) * (0.20 + 0.62 * cw);
      float a = 1.0 - (1.0 - ab) * (1.0 - aw);
      vec3 foam = uColB * ab + uColW * (0.78 + 0.44 * lace) * aw * (1.0 - ab);
      // by night her own lamps light the white water about her; farther off the calm sea mirrors the sky and the foam
      // does not, so it shows as a darker road (research note R9, 5.2)
      float lit = uNight > 0.5 ? exp(-away / 110.0) : 1.0;
      foam *= lit; a *= mix(0.5, 1.0, lit);
      if (!gl_FrontFacing) return vec4(foam * 0.55, a * 0.45) * uFade;            // from under the water: the white water only
      // the sheen: a slope shows light where it leans away from the eye (it mirrors the sky low down) and dark where it
      // faces it; seen from straight above there is no such side, and a fixed light takes over
      vec2 toEye = uCam.xy - vP; float along = length(toEye), obl = along / sqrt(along * along + uCam.z * uCam.z);
      float rel = clamp(dot(slope, normalize(mix(uLight, toEye / max(along, 1.0), obl * obl))) / uK.x, -1.0, 1.0);
      vec3 add = uColS * max(rel, 0.0);
      if (uK.z > 0.0) {                                                          // lines of equal height (the X-ray look): half a step above and below the still sea, then every step
        float q = h / uStep, w = fwidth(q);
        float line = (1.0 - min(abs(fract(q) - 0.5) / max(w, 1e-5), 1.0)) * clamp(1.6 - 2.4 * w, 0.0, 1.0);
        add += (h > 0.0 ? vec3(0.34, 0.62, 0.80) : vec3(0.16, 0.32, 0.50)) * line * uK.z;
      }
      float dark = uK.y * max(-rel, 0.0), fa = a * uK.w;
      return vec4(add * (1.0 - fa) + foam * uK.w, 1.0 - (1.0 - dark) * (1.0 - fa)) * uFade;
    }
    void main(){
      vec2 d = vP - uShip;
      float x = d.x * uHead.x + d.y * uHead.y, y = -d.x * uHead.y + d.y * uHead.x;   // her frame: forward, to starboard
      vec2 f = vP;
    #ifdef NEAR
      // her hull in the picture: a place beside her is read in the field nearer her centre line (the library's fieldY)
      float hu = (x - uHullX.x) * uHullX.y;
      float b = (hu > 0.0 && hu < 1.0) ? texture2D(uHull, vec2(hu, 0.5)).r * uHullX.z : 0.0;
      float q2 = y * y - b * b;
      if (q2 < 0.0) discard;
      float y0 = sign(y) * sqrt(q2);
      f = uShip + vec2(x * uHead.x - y0 * uHead.y, x * uHead.y + y0 * uHead.x);
    #else
      if (uNearRect.z > uNearRect.x && vP.x > uNearRect.x && vP.x < uNearRect.z && vP.y > uNearRect.y && vP.y < uNearRect.w) discard;
    #endif
      // since the sea was last refreshed she has moved on: the waves ride with her; the white water is left where it lies,
      // and only round her (where it is being made) keeps her company
      float away = length(vec2(max(abs(x) - 135.0, 0.0), y));
      vec2 pw = f - uSlide, pf = f - uSlide * (1.0 - smoothstep(200.0, 600.0, away));
      vec2 nuv = f / ${TILE.toFixed(1)} + uNoiseOff;
      vec2 eddy = (texture2D(uNoise, nuv).ba - 0.5) * 2.0 * uEddy * smoothstep(160.0, 900.0, away);
      vec2 e2 = min(vP, vec2(SIZE) - vP);
      float edge = smoothstep(uRamp.x, uRamp.x + uRamp.y, min(e2.x, e2.y));
    #ifdef NEAR
      vec4 wn = texture2D(uWave, at(pw, uSizeN)), wf = texture2D(uFar, at(pw + uFarOff, uSizeF));
      float fb = texture2D(uWave, at(pf, uSizeN)).a * uFoamMax * edge;
      float fw = mix(texture2D(uFar, at(pf + eddy + uFarOff, uSizeF)).a, texture2D(uRace, at(pf + eddy, uSizeN)).r, edge) * uFoamMax;
      gl_FragColor = shade(slopeOf(wn) + slopeOf(wf), heightOf(wn, uHmaxN) + heightOf(wf, uHmaxF), fb, fw, nuv, away);
    #else
      vec4 wf = texture2D(uFar, at(pw, uSizeF));
      float fw = texture2D(uFar, at(pf + eddy, uSizeF)).a * uFoamMax * edge;
      gl_FragColor = shade(slopeOf(wf), heightOf(wf, uHmaxF), 0.0, fw, nuv, away);
    #endif
    }`;
  function layer(near) {
    const g = new T3.BufferGeometry();
    g.setAttribute('position', new T3.BufferAttribute(new Float32Array([0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 1]), 3)); g.setIndex([0, 2, 1, 1, 2, 3]);
    const size = near ? sizeN : sizeF, dx = near ? W.near.dx : W.far.dx;
    const u = Object.assign({
      uSize: { value: size }, uNoiseOff: { value: new T3.Vector2() }, uShip: { value: new T3.Vector2() }, uHead: { value: new T3.Vector2(1, 0) }, uCam: { value: new T3.Vector3(0, 0, 100) },
      uRamp: { value: new T3.Vector2(CFG.dead * dx, CFG.ramp * dx) },
    }, near ? { uWave: { value: texNear }, uRace: { value: texRace }, uHull: { value: hullTex }, uSizeN: { value: sizeN }, uHmaxN: { value: 1 }, uFarOff: { value: new T3.Vector2() }, uHullX: { value: new T3.Vector3(W.hull.x0, 1 / (W.hull.x1 - W.hull.x0), HB) } }
      : { uNearRect: { value: new T3.Vector4(0, 0, -1, -1) } }, U);
    const mat = new T3.ShaderMaterial({
      uniforms: u, vertexShader: VERT, fragmentShader: (near ? '#define NEAR\n' : '') + '#define SIZE ' + size.toFixed(1) + '\n' + FRAG,
      transparent: true, depthWrite: false, side: T3.DoubleSide, extensions: { derivatives: true },
      blending: T3.CustomBlending, blendEquation: T3.AddEquation, blendSrc: T3.OneFactor, blendDst: T3.OneMinusSrcAlphaFactor, premultipliedAlpha: true,
    });
    const m = new T3.Mesh(g, mat); m.frustumCulled = false; m.renderOrder = near ? 2.06 : 2.03; m.visible = false; m.scale.set(size, 1, size); m.name = near ? 'wake-near' : 'wake-far';
    A.earth.add(m); return m;
  }
  const far = layer(false), near = layer(true);

  // ------------------------------------------------------------------ the page's own drawn wake, out of sight while ours shows
  let theirsHidden = false;
  function hideTheirs() {
    if (old.ribbon) old.ribbon.visible = false;
    if (old.bow) old.bow.visible = false;           // the page shows it again each frame it draws (site/app.js, wake.frame)
    if (old.lines && old.marks) {                   // Kelvin's arms and crests go; the order marks, laid last, stay
      const r = old.lines.geometry.drawRange, total = r.start + r.count, keep = Math.min(total, 2 * old.marks.length);
      if (isFinite(total)) old.lines.geometry.setDrawRange(total - keep, keep);
    }
    theirsHidden = true;
  }
  function showTheirs() {
    if (!theirsHidden) return;
    if (old.ribbon) old.ribbon.visible = true;
    if (old.lines) { const r = old.lines.geometry.drawRange; if (isFinite(r.count)) old.lines.geometry.setDrawRange(0, r.start + r.count); }   // the page lays them again within 66 ms
    theirsHidden = false;
  }

  // ------------------------------------------------------------------ reading the model, and each frame
  let on = A.device() !== 'phone', fade = 0, seq = 0, shownAt = null, lastT = 0, uploads = 0;
  A.on('reset', () => { WF.reset(W); seq = 0; shownAt = null; fade = 0; near.visible = far.visible = false; U.uFade.value = 0; showTheirs(); });
  A.on('step', (sim) => {
    const m = sim.mo; if (!S.night || !m) return;
    WF.push(W, { t: sim.t, X: m.X, Y: m.Y, psi: m.psi, u: m.u, v: m.v, r: m.r, TP: m.TP, TS: m.TS, TC: m.TC, nP: m.nP, nS: m.nS, nC: m.nC, del: m.del });
  });
  function lookNow() { return A.nightScene && A.nightScene.on ? LOOK.night : (S.xray ? LOOK.xray : LOOK.solid); }
  A.on('frame', (t) => {
    const dt = Math.min(0.1, Math.max(0, t - lastT)); lastT = t;
    const sim = S.sim, watch = !!(S.night && sim && sim.mo && A.earth.visible);
    if (!on) { if (fade > 0 || near.visible) { fade = 0; near.visible = far.visible = false; } showTheirs(); return; }
    const pace = A.pace(), ok = pace <= PACE_MAX;
    W.auto = Math.max(REFRESH, pace / 6);
    const up = W.caught && W.rec.length - W.cur <= 12;   // up with her: a step or two behind still is, the work being taken a piece a frame
    // under the page's virtual clock (QC C-3) the field is worked only on a pass that draws, and then to the end (budget 0):
    // what a picture shows is the same on every run, and the passes that are not drawn cost the field nothing
    const virt = A.test && A.test.virtual ? A.test.virtual() : false, draws = A.drawing ? A.drawing() : true;
    if ((watch || !W.ready) && (!virt || draws)) WF.work(W, virt ? 0 : (up || !W.ready ? BUDGET : BUDGET_MAKING), watch ? ok : true);
    const s = W.shown;
    if (s && s !== shownAt) {                       // the sea was refreshed: its three textures to the card, the layers to their places
      seq = s.seq; shownAt = s; uploads++;
      texNear.needsUpdate = true; texRace.needsUpdate = true; texFar.needsUpdate = true;
      const nx = s.nearX0 - 0.5 * W.near.dx, ny = s.nearY0 - 0.5 * W.near.dx, fx = s.farX0 - 0.5 * W.far.dx, fy = s.farY0 - 0.5 * W.far.dx;   // each layer's corner: a cell's centre is half a cell in
      near.position.set(nx - E0.x, 0.05, ny - E0.y); far.position.set(fx - E0.x, 0.045, fy - E0.y);
      near.userData.corner = [nx, ny]; far.userData.corner = [fx, fy];
      const un = near.material.uniforms, uf = far.material.uniforms, mod = (v) => ((v % TILE) + TILE) % TILE / TILE;
      un.uHmaxN.value = s.hNear; U.uHmaxF.value = s.hFar; un.uFarOff.value.set(nx - fx, ny - fy);
      un.uNoiseOff.value.set(mod(nx), mod(ny)); uf.uNoiseOff.value.set(mod(fx), mod(fy));
      uf.uNearRect.value.set(nx - fx, ny - fy, nx - fx + sizeN, ny - fy + sizeN);
    }
    const show = watch && ok && W.caught && !W.stale && W.rec.length - W.cur <= 12 && shownAt !== null && s !== null && !W.empty;
    fade += ((show ? 1 : 0) - fade) * Math.min(1, dt * (show ? 2.5 : 6)); if (fade < 0.004 && !show) fade = 0; if (fade > 0.996) fade = 1;
    near.visible = far.visible = fade > 0 && shownAt !== null;
    if (fade > 0.5) hideTheirs(); else showTheirs();
    if (!near.visible) return;
    // her place as the page draws her this frame, read back from the earth it has just placed (site/app.js, updateWatchScene)
    const e = A.earth, psi = e.rotation.y, c = Math.cos(psi), sn = Math.sin(psi), Xd = E0.x - e.position.x * c + e.position.z * sn, Yd = E0.y - e.position.x * sn - e.position.z * c;
    const L = lookNow(), un = near.material.uniforms, uf = far.material.uniforms;
    U.uFade.value = fade; U.uSlide.value.set(Xd - shownAt.X, Yd - shownAt.Y);
    U.uColB.value.fromArray(L.colB); U.uColW.value.fromArray(L.colW); U.uColS.value.fromArray(L.colS); U.uK.value.fromArray(L.k); U.uNight.value = L === LOOK.night ? 1 : 0;
    un.uShip.value.set(Xd - near.userData.corner[0], Yd - near.userData.corner[1]); uf.uShip.value.set(Xd - far.userData.corner[0], Yd - far.userData.corner[1]);
    un.uHead.value.set(c, sn); uf.uHead.value.set(c, sn);
    // the eye, in each layer's own metres (north, east of its corner, and its height): the world to the earth by hand, as
    // the earth's own matrix is a frame old here
    const cam = A.camera.position, wx = cam.x - e.position.x, wz = cam.z - e.position.z, cn = wx * c - wz * sn, ce = wx * sn + wz * c;
    un.uCam.value.set(cn - near.position.x, ce - near.position.z, cam.y); uf.uCam.value.set(cn - far.position.x, ce - far.position.z, cam.y);
  });

  // ------------------------------------------------------------------ the switch
  const bWake = document.createElement('button');
  bWake.id = 'bWake'; bWake.textContent = 'Wake'; bWake.setAttribute('aria-pressed', String(on));
  bWake.title = 'Her wake computed from her own hull and motion: the waves, and the white water where they break, off her bows and in her screws\' races. Off: the drawn ribbon and lines';
  const after = document.getElementById('bNight') || document.getElementById('bXray');
  if (!(A.addButton && A.addButton('display', bWake, { after: after ? '#' + after.id : null })) && after) after.insertAdjacentElement('afterend', bWake);   // C-4: the bar's
  function set(v) {
    on = !!v; bWake.setAttribute('aria-pressed', String(on));
    if (!on) { fade = 0; near.visible = far.visible = false; showTheirs(); }
  }
  bWake.addEventListener('click', () => {
    set(!on);
    A.toast(on ? 'Her wake as a field of waves made by her own hull, and the white water where they break and in her screws\' races. Its strengths are estimates' : 'Her wake as drawn: a ribbon from her stern and Kelvin\'s lines');
  });

  // for the tests (tools/wake_site_test.js) and for exploring
  A.wakeField = {
    W, near, far, LOOK, PACE_MAX, BUDGET, set, get on() { return on; }, get fade() { return fade; }, get uploads() { return uploads; },
    // for the wake in the page's other pieces (site/parts/26_wake_seams.js): the textures as last uploaded, the sizes, the
    // sea as last refreshed (its time and her place then) and each layer's corner (m north, m east)
    tex: { near: texNear, far: texFar, hull: hullTex }, sizes: { near: sizeN, far: sizeF, hull: HB }, get shown() { return shownAt; },
    corner: (which) => (which === 'near' ? near : far).userData.corner,
    status: () => ({ on, fade, ready: W.ready, live: W.live, stale: W.stale, empty: W.empty, samples: W.rec.length, behind: W.rec.length - W.cur, seq, theirsHidden, visible: near.visible, look: lookNow() === LOOK.night ? 'night' : (lookNow() === LOOK.xray ? 'xray' : 'solid') }),
    cost: () => Object.assign({}, W.cost),
  };
})();
