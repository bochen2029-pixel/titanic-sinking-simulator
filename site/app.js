// Titanic Sinking Simulator, viewer v2 (site build).
// Reads the headless core's state and draws it; never touches the physics. Changes from v1 (web/app.js):
//   - proper document, viewport and phone layout (a bottom sheet) driven by html[data-device]
//   - the forecast worker is a real file (no blob URL), so a strict CSP works
//   - a machine without WebGL still gets the model: readouts, damage diagram, evidence
//   - validation data arrives as a global from the build instead of an inline JSON script
//   - sprite labels rebuild once the vendored fonts have loaded
//   - keyboard: Space pauses, R restarts; the scenario is kept in the URL hash
//   - a pixel-ratio governor steps the render resolution down on slow devices
//   - removed hole markers release their materials
(function () {
  'use strict';
  if (!window.THREE) {
    const el = document.getElementById('nogl');
    if (el) { el.hidden = false; const why = document.getElementById('noglWhy'); if (why) why.textContent = 'three.js did not load.'; }
    return;
  }
  const C = window.TitanicCore, SC = window.TitanicScenarios;
  const G = C.G;
  const $ = (id) => document.getElementById(id);
  const VAL = window.TitanicValidation || {};
  const VERSION = window.TitanicSiteVersion || 'dev';
  const rootEl = document.documentElement;

  // ===================================================================== device class
  // phone: coarse pointer and a short side under 600 px (portrait or landscape); tablet: other coarse pointers.
  function classifyDevice() {
    const coarse = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    const short = Math.min(window.innerWidth, window.innerHeight);
    const d = coarse && short < 600 ? 'phone' : (coarse ? 'tablet' : 'desktop');
    if (rootEl.dataset.device !== d) rootEl.dataset.device = d;
    return d;
  }
  // the visible viewport height in pixels: on Android the address bar makes 100vh taller than the
  // screen that is actually visible, so the stage would run under the bottom sheet (seen on a real phone)
  function setViewportVar() {
    const h = (window.visualViewport && window.visualViewport.height) || window.innerHeight;
    if (h > 0) rootEl.style.setProperty('--app-h', Math.round(h) + 'px');
  }
  setViewportVar();
  window.addEventListener('resize', setViewportVar);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', setViewportVar);
  classifyDevice();
  const isPhone = () => rootEl.dataset.device === 'phone';

  // ===================================================================== state
  const ship = C.buildShip();
  const S = {
    scen: 'titanic', sim: null, speed: 60, playing: true, acc: 0,
    tool: 'look', holeArea: 0.0624, xray: true, cols: false, follow: true, view: 'quarter',
    hist: [], histNext: 0, forecast: null, fcSeq: 0,
    bh: 'built', logShown: 0, post: 0, openVersion: -1, lastUi: 0, lastStrip: 0, lastChart: 0,
  };
  const DT = C.DEFAULT_PARAMS.dt;
  const NN = C.NN;

  // ===================================================================== helpers
  const fmt = (v, d) => (v === undefined || v === null || isNaN(v)) ? '–' : v.toFixed(d);
  const fmtInt = (v) => Math.round(v).toLocaleString('en-US');
  function hms(t) {
    t = Math.max(0, Math.floor(t));
    const h = Math.floor(t / 3600), m = Math.floor(t / 60) % 60, s = t % 60;
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  function hm(t) { const m = Math.round(t / 60); return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min`; }
  function clockOf(t) {
    const c = SC.PRESETS[S.scen].clock;
    if (!c) return null;
    let mins = c.h * 60 + c.m + t / 60;
    mins = ((mins % 1440) + 1440) % 1440;
    let h = Math.floor(mins / 60), m = Math.floor(mins % 60);
    const ap = h >= 12 ? 'pm' : 'am';
    h = h % 12; if (h === 0) h = 12;
    return `${h}:${String(m).padStart(2, '0')} ${ap}`;
  }
  let toastTimer = 0;
  function toast(msg) {
    const el = $('toast'); el.textContent = msg; el.classList.add('on');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('on'), 2600);
  }
  // ship frame (x fwd, y port, z up)  ->  three local (x, z, -y)
  const SX = (x, y, z) => new THREE.Vector3(x, z, -y);

  // ===================================================================== three.js
  const canvas = $('gl');
  let renderer = null;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  } catch (e) { renderer = null; }
  const perf = { sum: 0, n: 0, pr: Math.min(2, window.devicePixelRatio || 1) };
  if (renderer) {
    renderer.setPixelRatio(perf.pr);
    renderer.setClearColor(0x04080e, 1);
  } else {
    canvas.hidden = true;
    $('nogl').hidden = false;
  }
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.5, 9000);
  scene.add(new THREE.HemisphereLight(0x9fb7d0, 0x0a1420, 0.75));
  const sun = new THREE.DirectionalLight(0xffffff, 0.75); sun.position.set(-200, 300, 250); scene.add(sun);

  // ---- sky and stars (clear, moonless night)
  {
    const skyGeo = new THREE.SphereGeometry(5000, 32, 16);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'varying vec3 vP; void main(){ float h = normalize(vP).y; vec3 hor = vec3(0.055,0.10,0.15); vec3 zen = vec3(0.012,0.022,0.04); vec3 below = vec3(0.01,0.03,0.05); vec3 c = h > 0.0 ? mix(hor, zen, pow(h, 0.45)) : mix(hor, below, pow(-h, 0.3)); gl_FragColor = vec4(c,1.0); }',
    });
    const sky = new THREE.Mesh(skyGeo, skyMat); sky.renderOrder = -10; scene.add(sky);
    const n = 1400, pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < n; i++) {
      const u = rnd(), v = rnd() * 0.92 + 0.06;
      const th = u * Math.PI * 2, ph = Math.acos(v);
      pos[i * 3] = 4500 * Math.sin(ph) * Math.cos(th); pos[i * 3 + 1] = 4500 * Math.cos(ph); pos[i * 3 + 2] = 4500 * Math.sin(ph) * Math.sin(th);
      const b = 0.45 + 0.55 * rnd() * rnd(); col[i * 3] = b * 0.92; col[i * 3 + 1] = b * 0.96; col[i * 3 + 2] = b;
    }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); sg.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const stars = new THREE.Points(sg, new THREE.PointsMaterial({ size: 1.6, sizeAttenuation: false, vertexColors: true, depthWrite: false }));
    stars.renderOrder = -9; scene.add(stars);
    S.sky = sky; S.stars = stars;
  }

  // ---- shared GLSL
  const xMinT = G.xAP - G.sternOverhang - 0.5, xMaxT = C.xFwd(C.zTopAt(G.xFP)) + 0.5, zMaxT = 32, HB_SCALE = 15.0;
  const GLSL_COMMON = `
    const float XFP = ${G.xFP.toFixed(4)};
    const float DECKE = ${G.deck.E.toFixed(4)};
    const float DECKD = ${G.deck.D.toFixed(4)};
    const float DECKC = ${G.deck.C.toFixed(4)};
    const float DECKB = ${G.deck.B.toFixed(4)};
    const float TANK = ${G.tankTop.toFixed(4)};
    float sheer(float x){ float s = x / XFP; return x >= 0.0 ? ${G.sheerF.toFixed(3)} * s * s : ${G.sheerA.toFixed(3)} * s * s; }
    float zTopF(float x){ bool w = (x > ${G.wellFwd[0].toFixed(2)} && x < ${G.wellFwd[1].toFixed(2)}) || (x > ${G.wellAft[0].toFixed(2)} && x < ${G.wellAft[1].toFixed(2)}); return (w ? DECKC : DECKB) + sheer(x); }
  `;
  const bulkX = C.BULKHEADS.map(b => b.x);

  // ---- half-breadth texture for clipping free surfaces to the hull
  const hbTex = (() => {
    const W = 512, H = 128, data = new Uint8Array(W * H * 4);
    for (let j = 0; j < H; j++) {
      const z = (j / (H - 1)) * zMaxT;
      for (let i = 0; i < W; i++) {
        const x = xMinT + (i / (W - 1)) * (xMaxT - xMinT);
        const b = z <= C.zTopAt(x) + 0.3 ? C.halfBreadth(x, Math.min(z, C.zTopAt(x))) : 0;
        const k = (j * W + i) * 4;
        data[k] = Math.max(0, Math.min(255, Math.round(b / HB_SCALE * 255))); data[k + 1] = 0; data[k + 2] = 0; data[k + 3] = 255;
      }
    }
    const t = new THREE.DataTexture(data, W, H, THREE.RGBAFormat, THREE.UnsignedByteType);
    t.minFilter = THREE.LinearFilter; t.magFilter = THREE.LinearFilter; t.generateMipmaps = false;
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.needsUpdate = true;
    return t;
  })();

  // ---- sea
  const seaMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uCam: { value: new THREE.Vector3() } },
    extensions: { derivatives: true },
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `
      uniform float uTime; uniform vec3 uCam; varying vec3 vW;
      void main(){
        vec2 p = vW.xz / 20.0;
        vec2 g = abs(fract(p - 0.5) - 0.5) / fwidth(p);
        float line = 1.0 - min(min(g.x, g.y), 1.0);
        float d = length(vW.xz - uCam.xz);
        float fade = exp(-d / 700.0);
        float shimmer = 0.5 + 0.5 * sin(vW.x * 0.07 + uTime * 0.6) * sin(vW.z * 0.05 - uTime * 0.4);
        vec3 col;
        float a;
        if (gl_FrontFacing) {
          col = vec3(0.015, 0.06, 0.10) + line * fade * vec3(0.06, 0.17, 0.24) + shimmer * fade * 0.012;
          a = 0.70;
        } else {
          col = vec3(0.06, 0.20, 0.30) + line * fade * vec3(0.05, 0.12, 0.16);
          a = 0.42;
        }
        gl_FragColor = vec4(col, a);
      }`,
  });
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000, 1, 1).rotateX(-Math.PI / 2), seaMat);
  sea.renderOrder = 1; scene.add(sea);

  // ---- ship group (pose from the core every frame)
  const shipGroup = new THREE.Group(); shipGroup.matrixAutoUpdate = false; scene.add(shipGroup);

  // ---- hull mesh from the same half-breadth function the physics integrates
  function profileBottom(x) {
    const zt = C.zTopAt(x);
    for (let z = 0; z <= zt; z += 0.05) if (C.halfBreadth(x, z) > 0.02) return z;
    return null;
  }
  const NZ = 40, ND = 8;
  function hullRing(x) {
    const zlo = profileBottom(x); if (zlo === null) return null;
    const zt = C.zTopAt(x);
    const pts = [[x, 0, zlo]];
    const lev = [];
    for (let j = 0; j <= NZ; j++) { const u = 0.5 * (1 - Math.cos(Math.PI * j / NZ)); lev.push(zlo + (zt - zlo) * u); }
    for (let j = 0; j <= NZ; j++) pts.push([x, -C.halfBreadth(x, lev[j]), lev[j]]);
    const bt = C.halfBreadth(x, zt - 0.001);
    for (let d = 1; d < ND; d++) pts.push([x, -bt + 2 * bt * d / ND, zt]);
    for (let j = NZ; j >= 0; j--) pts.push([x, C.halfBreadth(x, lev[j]), lev[j]]);
    return pts;
  }
  const hullStations = [];
  {
    const xs = [];
    for (let x = xMinT + 0.5; x <= xMaxT - 0.5; x += 1.0) xs.push(x);
    for (const w of [G.wellFwd, G.wellAft]) { xs.push(w[0] - 0.04, w[0] + 0.04, w[1] - 0.04, w[1] + 0.04); }
    xs.sort((a, b) => a - b);
    for (const x of xs) { const r = hullRing(x); if (r) hullStations.push(r); }
  }
  const hullGeo = (() => {
    const K = hullStations[0].length, M = hullStations.length;
    const pos = new Float32Array(K * M * 3);
    for (let i = 0; i < M; i++) for (let k = 0; k < K; k++) {
      const p = hullStations[i][k], o = (i * K + k) * 3;
      pos[o] = p[0]; pos[o + 1] = p[2]; pos[o + 2] = -p[1];
    }
    const idx = [];
    for (let i = 0; i < M - 1; i++) for (let k = 0; k < K; k++) {
      const k2 = (k + 1) % K, a = i * K + k, b = i * K + k2, c = (i + 1) * K + k, d = (i + 1) * K + k2;
      idx.push(a, c, b, b, c, d);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setIndex(idx); g.computeVertexNormals();
    // make normals point outward (check a starboard side vertex at mid-height, amidships)
    const mid = Math.floor(M / 2), probe = mid * K + 1 + Math.floor(NZ / 2);
    if (g.attributes.normal.getZ(probe) < 0) {
      for (let t = 0; t < idx.length; t += 3) { const s = idx[t + 1]; idx[t + 1] = idx[t + 2]; idx[t + 2] = s; }
      g.setIndex(idx); g.computeVertexNormals();
    }
    return g;
  })();

  const levelUniform = { value: new Float32Array(NN).fill(-1e4) };
  const hullXray = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { uLevels: levelUniform, uBulk: { value: bulkX }, uCamY: { value: 10 }, uTime: { value: 0 } },
    vertexShader: `
      varying vec3 vL; varying vec3 vW; varying vec3 vN; varying vec3 vV;
      void main(){ vL = position; vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); vV = normalize(cameraPosition - w.xyz); gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: GLSL_COMMON + `
      uniform float uLevels[64]; uniform float uBulk[15]; uniform float uCamY; uniform float uTime;
      varying vec3 vL; varying vec3 vW; varying vec3 vN; varying vec3 vV;
      void main(){
        float x = vL.x; float zs = vL.y; float ys = -vL.z;
        int k = 0; for (int i = 0; i < 15; i++) { if (x < uBulk[i]) k = i + 1; }
        float eD = DECKE + sheer(x);
        int side = ys >= 0.0 ? 0 : 1; int layer = zs < eD ? 0 : 1;
        int n = (k * 2 + side) * 2 + layer;
        float lev = -1e4; for (int i = 0; i < 64; i++) { if (i == n) lev = uLevels[i]; }
        float fl = (k == 0 || k == 15) ? 0.0 : TANK;
        float rim = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2);
        vec3 col = vec3(0.58, 0.74, 0.86) * (0.14 + 0.62 * rim);
        float a = 0.09 + 0.34 * rim;
        if (zs < fl) { col *= 0.6; }
        if (zs > fl && vW.y < lev) { col = mix(col, vec3(0.10, 0.55, 0.95), 0.75); a = max(a, 0.42); }
        float deckLine = smoothstep(0.09, 0.0, abs(zs - eD));
        float dLine = smoothstep(0.07, 0.0, abs(zs - (DECKD + sheer(x))));
        col += vec3(0.88, 0.69, 0.35) * deckLine * 0.8 + vec3(0.56, 0.83, 0.79) * dLine * 0.45;
        a = max(a, deckLine * 0.55);
        float wl = exp(-abs(vW.y) * 3.2);
        col += vec3(0.30, 0.88, 1.0) * wl * 1.1; a = max(a, wl * 0.75);
        bool through = (uCamY > 0.0 && vW.y < 0.0) || (uCamY < 0.0 && vW.y > 0.0);
        if (through) { float dep = clamp(abs(vW.y) / 40.0, 0.0, 1.0); col = mix(col, vec3(0.03, 0.12, 0.19), 0.45 + 0.4 * dep); a *= (0.9 - 0.45 * dep); }
        gl_FragColor = vec4(col, a);
      }`,
  });
  const hullSolid = new THREE.ShaderMaterial({
    uniforms: { uCamY: { value: 10 }, uSun: { value: new THREE.Vector3(-0.45, 0.7, 0.55).normalize() } },
    vertexShader: `varying vec3 vL; varying vec3 vW; varying vec3 vN; void main(){ vL = position; vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: GLSL_COMMON + `
      uniform float uCamY; uniform vec3 uSun; varying vec3 vL; varying vec3 vW; varying vec3 vN;
      void main(){
        float zs = vL.y; float x = vL.x;
        vec3 base = zs < 10.3 ? vec3(0.42, 0.10, 0.07) : vec3(0.035, 0.037, 0.04);
        if (abs(zs - (zTopF(x) - 0.25)) < 0.12) base = vec3(0.75, 0.6, 0.3);
        float l = 0.35 + 0.65 * max(dot(normalize(vN), uSun), 0.0);
        vec3 col = base * l + vec3(0.02, 0.03, 0.04);
        if (vW.y < 0.0) { float dep = clamp(-vW.y / 40.0, 0.0, 1.0); col = mix(col, vec3(0.01, 0.06, 0.09), 0.25 + 0.6 * dep); }
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const hullMesh = new THREE.Mesh(hullGeo, hullXray); hullMesh.renderOrder = 6; shipGroup.add(hullMesh);

  // ---- line work: sections at the bulkheads and every 20 m, keel and sheer
  const lineMat = new THREE.LineBasicMaterial({ color: 0x5fa8d0, transparent: true, opacity: 0.22, depthWrite: false });
  {
    const segs = [];
    const addRing = (r) => { for (let k = 0; k < r.length; k++) { const a = r[k], b = r[(k + 1) % r.length]; segs.push(a[0], a[2], -a[1], b[0], b[2], -b[1]); } };
    for (let x = -120; x <= 120; x += 20) { const r = hullRing(x); if (r) addRing(r); }
    const along = (fn) => { let prev = null; for (let x = xMinT + 0.5; x <= xMaxT - 0.5; x += 1.5) { const p = fn(x); if (p && prev) segs.push(prev[0], prev[1], prev[2], p[0], p[1], p[2]); prev = p; } };
    for (const sd of [1, -1]) along((x) => { const zt = C.zTopAt(x); const b = C.halfBreadth(x, zt - 0.001); return b > 0.05 ? [x, zt, -sd * b] : null; });
    along((x) => { const z = profileBottom(x); return z === null ? null : [x, z, 0]; });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(segs, 3));
    const lines = new THREE.LineSegments(g, lineMat); lines.renderOrder = 7; shipGroup.add(lines);
    S.hullLines = lines;
  }

  // ---- bulkheads
  const bulkMeshes = [], bulkTopLines = [], bulkLabels = [];
  function bulkCrest(b) { return C.deckZ(S.sim ? S.sim.bulkTop[b] : C.BULKHEADS[b].top, C.BULKHEADS[b].x); }
  function makeLabel(text, color) {
    const cv = document.createElement('canvas'); cv.width = 96; cv.height = 96;
    const g = cv.getContext('2d');
    g.font = '600 62px "IBM Plex Sans Condensed", "Arial Narrow", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = color; g.fillText(text, 48, 52);
    const tex = new THREE.CanvasTexture(cv); tex.minFilter = THREE.LinearFilter;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false }));
    sp.scale.set(5, 5, 1); sp.renderOrder = 9;
    return sp;
  }
  const bulkMatBase = {
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: 'varying vec3 vL; varying vec3 vW; void main(){ vL = position; vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: GLSL_COMMON + `
      uniform vec4 uF; uniform vec4 uA; uniform float uCamY; uniform float uFloor;
      varying vec3 vL; varying vec3 vW;
      void main(){
        float zs = vL.y; float ys = -vL.z; float eD = DECKE + sheer(vL.x);
        vec4 L = gl_FrontFacing ? uF : uA;
        float lev = ys >= 0.0 ? (zs < eD ? L.x : L.z) : (zs < eD ? L.y : L.w);
        vec3 col = vec3(0.62, 0.74, 0.84) * 0.22; float a = 0.13;
        if (zs > uFloor && vW.y < lev) { col = vec3(0.12, 0.55, 0.92); a = 0.48; }
        bool through = (uCamY > 0.0 && vW.y < 0.0) || (uCamY < 0.0 && vW.y > 0.0);
        if (through) { float dep = clamp(abs(vW.y) / 45.0, 0.0, 1.0); col = mix(col, vec3(0.02, 0.10, 0.16), 0.3 + 0.4 * dep); a *= 0.85; }
        gl_FragColor = vec4(col, a);
      }`,
  };
  function buildBulkheads() {
    for (const m of bulkMeshes) { shipGroup.remove(m); m.geometry.dispose(); m.material.dispose(); }
    for (const l of bulkTopLines) { shipGroup.remove(l); l.geometry.dispose(); l.material.dispose(); }
    for (const s of bulkLabels) { shipGroup.remove(s); if (s.material.map) s.material.map.dispose(); s.material.dispose(); }
    bulkMeshes.length = 0; bulkTopLines.length = 0; bulkLabels.length = 0;
    C.BULKHEADS.forEach((bh, b) => {
      const x = bh.x, zlo = profileBottom(x), zc = Math.min(bulkCrest(b), C.zTopAt(x));
      const pos = [], idx = [];
      const N = 26;
      for (let j = 0; j <= N; j++) {
        const z = zlo + (zc - zlo) * j / N, w = C.halfBreadth(x, z);
        pos.push(x, z, w, x, z, -w);    // three local: z = -y  (w -> starboard side first)
        if (j < N) { const a = j * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      const mat = new THREE.ShaderMaterial(Object.assign({}, bulkMatBase, {
        uniforms: { uF: { value: new THREE.Vector4(-1e4, -1e4, -1e4, -1e4) }, uA: { value: new THREE.Vector4(-1e4, -1e4, -1e4, -1e4) }, uCamY: { value: 10 }, uFloor: { value: G.tankTop } },
      }));
      const m = new THREE.Mesh(g, mat); m.renderOrder = 3; shipGroup.add(m); bulkMeshes.push(m);
      const wc = C.halfBreadth(x, zc - 0.001);
      const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute([x, zc, -wc, x, zc, wc], 3));
      const top = S.sim ? S.sim.bulkTop[b] : bh.top;
      const line = new THREE.Line(lg, new THREE.LineBasicMaterial({ color: top === 'E' ? 0xe0b15a : (top === 'D' ? 0x8fd3c9 : 0xdbe6ef), transparent: true, opacity: 0.95, depthWrite: false }));
      line.renderOrder = 8; line.userData.base = line.material.color.getHex(); shipGroup.add(line); bulkTopLines.push(line);
      const lab = makeLabel(bh.id, top === 'E' ? '#e0b15a' : (top === 'D' ? '#8fd3c9' : '#dbe6ef'));
      lab.position.set(x, zc + 3.2, 0); shipGroup.add(lab); bulkLabels.push(lab);
    });
  }

  // ---- superstructure, funnels, masts (visual only)
  const superGroup = new THREE.Group(); shipGroup.add(superGroup);
  const superFaces = [], superEdges = [];
  {
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x7fb2d4, transparent: true, opacity: 0.32, depthWrite: false });
    const box = (x0, x1, z0, z1, hw, color) => {
      const g = new THREE.BoxGeometry(x1 - x0, z1 - z0, hw * 2);
      g.translate((x0 + x1) / 2, (z0 + z1) / 2 + C.sheer((x0 + x1) / 2), 0);
      const face = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color, transparent: true, opacity: 0.05, depthWrite: false }));
      face.renderOrder = 5; superGroup.add(face); superFaces.push(face);
      const e = new THREE.LineSegments(new THREE.EdgesGeometry(g), edgeMat); e.renderOrder = 7; superGroup.add(e); superEdges.push(e);
      face.userData.solid = color;
    };
    const D = G.deck;
    box(G.wellFwd[0], G.wellFwd[0] + 0.01, D.B, D.B + 0.01, 0.1, 0xffffff);
    box(-90.8, 76.9, D.B, D.A, 13.6, 0xf2efe6);
    box(-78, 73.5, D.A, D.Boat, 12.9, 0xf2efe6);
    box(56, 73.5, D.Boat, D.Boat + 2.7, 7.5, 0xf2efe6);
    box(-70, 52, D.Boat, D.Boat + 2.6, 5.4, 0xf2efe6);
    box(68, 73.5, D.Boat + 2.7, D.Boat + 4.6, 3.5, 0xf2efe6);
    const fun = (x) => {
      const h = 18.9, g = new THREE.CylinderGeometry(1, 1, h, 28, 1);
      g.scale(3.73, 1, 2.9); g.translate(0, h / 2, 0);
      const grp = new THREE.Group();
      const face = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color: 0xc78a3d, transparent: true, opacity: 0.14, depthWrite: false }));
      face.renderOrder = 5; face.userData.solid = 0xc78a3d; superFaces.push(face); grp.add(face);
      const capG = new THREE.CylinderGeometry(1.02, 1.02, 4.2, 28, 1); capG.scale(3.73, 1, 2.9); capG.translate(0, h - 2.1, 0);
      const cap = new THREE.Mesh(capG, new THREE.MeshLambertMaterial({ color: 0x111111, transparent: true, opacity: 0.0, depthWrite: false }));
      cap.renderOrder = 5; cap.userData.solid = 0x111111; cap.userData.capOnly = true; superFaces.push(cap); grp.add(cap);
      const e = new THREE.LineSegments(new THREE.EdgesGeometry(g, 30), edgeMat); e.renderOrder = 7; grp.add(e); superEdges.push(e);
      grp.position.set(x, D.Boat + C.sheer(x), 0); grp.rotation.z = 0.075;
      superGroup.add(grp);
    };
    [45.5, 12.5, -20.5, -53.5].forEach(fun);
    const mast = (x, top) => {
      const z0 = C.zTopAt(x), g = new THREE.CylinderGeometry(0.35, 0.45, top - z0, 8, 1); g.translate(0, (top - z0) / 2, 0);
      const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color: 0xc9a46a, transparent: true, opacity: 0.35, depthWrite: false }));
      m.position.set(x, z0, 0); m.rotation.z = 0.06; m.renderOrder = 5; m.userData.solid = 0xc9a46a; superFaces.push(m); superGroup.add(m);
    };
    mast(93.5, 62); mast(-108, 58);
  }

  // ---- free surfaces of the flood water (one quad per space, clipped to the hull in the shader)
  const fsMat = (n) => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: {
      uInv: { value: new THREE.Matrix4() }, uHB: { value: hbTex }, uTime: { value: 0 }, uCamY: { value: 10 },
      uXa: { value: 0 }, uXf: { value: 0 }, uSide: { value: (n >> 1) & 1 }, uLayer: { value: n & 1 }, uFloor: { value: 0 },
    },
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: GLSL_COMMON + `
      uniform mat4 uInv; uniform sampler2D uHB; uniform float uTime; uniform float uCamY;
      uniform float uXa; uniform float uXf; uniform float uSide; uniform float uLayer; uniform float uFloor;
      varying vec3 vW;
      void main(){
        vec3 L = (uInv * vec4(vW, 1.0)).xyz;
        float x = L.x; float zs = L.y; float ys = -L.z;
        if (x < uXa || x > uXf) discard;
        if ((uSide < 0.5 && ys < -0.05) || (uSide > 0.5 && ys > 0.05)) discard;
        float eD = DECKE + sheer(x);
        if (uLayer < 0.5) { if (zs < uFloor - 0.05 || zs > eD + 0.05) discard; }
        else { if (zs < eD - 0.05 || zs > zTopF(x) + 0.05) discard; }
        float hb = texture2D(uHB, vec2((x - (${xMinT.toFixed(3)})) / ${(xMaxT - xMinT).toFixed(3)}, zs / ${zMaxT.toFixed(1)})).r * ${HB_SCALE.toFixed(1)};
        if (abs(ys) > hb) discard;
        float rip = 0.5 + 0.5 * sin(vW.x * 0.9 + uTime * 1.7) * sin(vW.z * 1.3 - uTime * 1.3);
        vec3 col = mix(vec3(0.10, 0.52, 0.90), vec3(0.45, 0.86, 1.0), 0.25 + 0.25 * rip);
        float a = 0.62;
        bool through = (uCamY > 0.0 && vW.y < -0.05) || (uCamY < 0.0 && vW.y > 0.05);
        if (through) { col = mix(col, vec3(0.05, 0.25, 0.4), 0.3); a = 0.5; }
        gl_FragColor = vec4(col, a);
      }`,
  });
  const fsMeshes = [];
  for (let n = 0; n < NN; n++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), fsMat(n));
    const k = n >> 2, Z = ship.zones[k];
    m.material.uniforms.uXa.value = Z.xa; m.material.uniforms.uXf.value = Z.xf; m.material.uniforms.uFloor.value = Z.floor;
    m.renderOrder = 4; m.visible = false; m.frustumCulled = false; scene.add(m); fsMeshes.push(m);
  }

  // ---- physics column proxies (what the core actually integrates)
  const colMesh = (() => {
    const n = ship.entCol.length;
    const m = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, depthWrite: false }), n);
    m.renderOrder = 4; m.visible = false; m.frustumCulled = false;
    const c = new THREE.Color();
    for (let i = 0; i < n; i++) m.setColorAt(i, c.setHex(0x3cc3ff));
    shipGroup.add(m);
    return m;
  })();

  // ---- hull openings
  const holeGroup = new THREE.Group(); shipGroup.add(holeGroup);
  const holeGeo = new THREE.SphereGeometry(1, 12, 8);
  const jetGeo = new THREE.ConeGeometry(0.5, 1, 12, 1, true).translate(0, 0.5, 0);
  const holeObjs = new Map();
  function syncHoles() {
    const sim = S.sim;
    const ids = new Set(sim.openings.map(o => o.id));
    for (const [id, o] of holeObjs) if (!ids.has(id)) { holeGroup.remove(o.dot); holeGroup.remove(o.jet); o.dot.material.dispose(); o.jet.material.dispose(); holeObjs.delete(id); }
    for (const o of sim.openings) {
      if (holeObjs.has(o.id)) continue;
      const color = o.kind === 'breach' ? 0xff5d3d : 0xffb547;
      const dot = new THREE.Mesh(holeGeo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95, depthTest: false }));
      const r = 0.35 + Math.sqrt(o.area) * 0.9; dot.scale.set(r, r, r);
      dot.position.copy(SX(o.x, o.y, o.z)); dot.renderOrder = 9;
      const jet = new THREE.Mesh(jetGeo, new THREE.MeshBasicMaterial({ color: 0x8fe1ff, transparent: true, opacity: 0.0, depthWrite: false, side: THREE.DoubleSide }));
      jet.position.copy(dot.position);
      const inward = SX(0, o.y > 0 ? -1 : 1, 0).normalize();
      jet.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), inward); jet.renderOrder = 9;
      holeGroup.add(dot); holeGroup.add(jet);
      holeObjs.set(o.id, { dot, jet, rec: o });
    }
  }

  // ===================================================================== camera control
  const ctl = { target: new THREE.Vector3(0, 8, 0), r: 420, theta: 0.77, phi: 1.33, goal: null };
  const VIEWS = {
    quarter: { r: 380, theta: 0.80, phi: 1.30 },
    profile: { r: 400, theta: 0.0, phi: 1.52 },
    below: { r: 330, theta: 0.55, phi: 1.98 },
    plan: { r: 430, theta: 0.0, phi: 0.12 },
  };
  function setView(name) {
    S.view = name; ctl.goal = Object.assign({}, VIEWS[name]);
    document.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === name)));
  }
  function applyCamera() {
    if (ctl.goal) {
      const g = ctl.goal, k = 0.08;
      let dth = g.theta - ctl.theta; while (dth > Math.PI) dth -= 2 * Math.PI; while (dth < -Math.PI) dth += 2 * Math.PI;
      ctl.theta += dth * k; ctl.phi += (g.phi - ctl.phi) * k; ctl.r += (g.r - ctl.r) * k;
      if (Math.abs(dth) < 1e-3 && Math.abs(g.phi - ctl.phi) < 1e-3 && Math.abs(g.r - ctl.r) < 0.5) ctl.goal = null;
    }
    const fit = Math.min(1.8, Math.max(1, 0.95 / Math.max(0.3, camera.aspect)));   // portrait screens need more distance
    const sp = new THREE.Spherical(ctl.r * fit, ctl.phi, ctl.theta);
    camera.position.setFromSpherical(sp).add(ctl.target);
    camera.lookAt(ctl.target);
  }
  const pointers = new Map();
  let drag = null;
  canvas.addEventListener('pointerdown', (e) => {
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* some browsers refuse capture for synthetic pointers */ }
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) drag = { x0: e.clientX, y0: e.clientY, t0: performance.now(), moved: 0, button: e.button, shift: e.shiftKey, scrape: S.tool === 'scrape' && e.button === 0, lastHole: null, stroke: 0 };
    else if (drag) drag.scrape = false;
    if (drag && drag.scrape) scrapeAt(e);
  });
  canvas.addEventListener('pointermove', (e) => {
    const p = pointers.get(e.pointerId); if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    if (pointers.size === 1 && drag) {
      drag.moved += Math.abs(dx) + Math.abs(dy);
      if (drag.scrape) { scrapeAt(e); return; }
      if (drag.button === 2 || drag.shift) pan(dx, dy);
      else { ctl.goal = null; ctl.theta -= dx * 0.006; ctl.phi = Math.min(3.05, Math.max(0.06, ctl.phi - dy * 0.006)); }
    } else if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (drag && drag.pinch) { ctl.r = Math.min(2200, Math.max(25, ctl.r * drag.pinch / Math.max(d, 1))); pan(dx / 2, dy / 2); }
      if (drag) drag.pinch = d; else drag = { pinch: d, moved: 99 };
      ctl.goal = null;
    }
  });
  const endPointer = (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    if (pointers.size === 0 && drag) {
      const quick = performance.now() - drag.t0 < 450 && drag.moved < 7;
      if (quick && S.tool === 'hole' && drag.button === 0) punchAt(e);
      if (drag.scrape && drag.stroke > 0) { toast(`Scrape: ${drag.stroke} punctures added`); onDamageChanged(); }
      drag = null;
    } else if (pointers.size === 1 && drag) { drag.pinch = null; }
  };
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  canvas.addEventListener('wheel', (e) => { e.preventDefault(); ctl.goal = null; ctl.r = Math.min(2200, Math.max(25, ctl.r * Math.exp(e.deltaY * 0.0012))); }, { passive: false });
  function pan(dx, dy) {
    S.follow = false; $('bFollow').setAttribute('aria-pressed', 'false');
    const s = ctl.r * 0.0016;
    const right = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 0);
    const up = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 1);
    ctl.target.addScaledVector(right, -dx * s).addScaledVector(up, dy * s);
  }

  // ===================================================================== damage placement
  const ray = new THREE.Raycaster();
  function hullHit(e) {
    const rect = canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObject(hullMesh, false);
    if (!hits.length) return null;
    const h = hits[0];
    const local = hullMesh.worldToLocal(h.point.clone());
    return { world: h.point, x: local.x, y: -local.z, z: local.y, nUp: h.face ? Math.abs(h.face.normal.y) : 0 };
  }
  function validate(h) {
    if (!h) return 'Missed the hull.';
    if (h.world.y > -0.3) return 'Only the hull below the waterline can be holed.';
    if (h.nUp > 0.92 && h.z > 3) return 'That is a deck. Aim at the side shell below the waterline.';
    const k = C.zoneAt(h.x);
    const floor = ship.zones[k].floor;
    if (h.z < floor + 0.25) return 'That is the double bottom. Titanic\'s 5 ft inner bottom would contain it; aim higher on the side.';
    return null;
  }
  function addHole(h, area) {
    const yOut = h.y >= 0 ? Math.max(h.y, 0.3) : Math.min(h.y, -0.3);
    return C.addOpening(S.sim, { x: h.x, y: yOut, z: h.z, area, kind: 'breach', label: 'user' });
  }
  function punchAt(e) {
    const h = hullHit(e); const why = validate(h);
    if (why) { toast(why); return; }
    const o = addHole(h, S.holeArea);
    const Z = ship.zones[o.zone];
    toast(`Hole in ${Z.name}, ${o.side ? 'starboard' : 'port'}, ${fmt(-h.world.y, 1)} m below the waterline · ${fmt(S.holeArea * 10.764, 1)} sq ft`);
    onDamageChanged();
  }
  function scrapeAt(e) {
    const h = hullHit(e); if (validate(h)) return;
    if (drag.lastHole && Math.hypot(h.x - drag.lastHole.x, h.z - drag.lastHole.z) < 2.6) return;
    if (drag.stroke >= 80) return;
    addHole(h, S.holeArea); drag.lastHole = h; drag.stroke++;
    syncHoles();
  }

  // ===================================================================== simulation management
  function buildScenario(key) {
    const scen = SC.PRESETS[key].build({});
    applyBulkheadChoice(scen);
    return scen;
  }
  function applyBulkheadChoice(scen) {
    if (S.bh === 'built') return;
    scen.bulkTop = scen.bulkTop || {};
    for (const b of C.BULKHEADS) {
      const cur = scen.bulkTop[b.id] || b.top;
      if (S.bh === 'B') scen.bulkTop[b.id] = 'B';
      else if (S.bh === 'D' && cur === 'E') scen.bulkTop[b.id] = 'D';
    }
  }
  function startSim(sim) {
    S.sim = sim; S.hist = []; S.histNext = 0; S.acc = 0; S.post = 0; S.logShown = 0; S.forecast = null;
    $('logBody').textContent = '';
    buildBulkheads(); syncHoles(); renderBulkheadTable(); renderHoleTable();
    $('coal').checked = sim.params.coalListDeg > 0;
    updateHeader(); requestForecast(true);
  }
  function loadScenario(key, fromHash) {
    S.scen = key;
    document.querySelectorAll('#scenCards .card').forEach(c => c.setAttribute('aria-checked', String(c.dataset.key === key)));
    startSim(C.createSim(ship, {}, buildScenario(key)));
    S.playing = true; syncPlay();
    if (!fromHash && window.history && history.replaceState) {
      try { history.replaceState(null, '', key === 'titanic' ? location.pathname + location.search : '#scenario=' + key); } catch (e) { /* file: URLs may refuse */ }
    }
  }
  function restart() {
    const old = S.sim;
    const scen = {
      openings: old.openings.map(o => ({ x: o.x, y: o.y, z: o.z, area: o.area, kind: o.kind, tOpen: o.tOpen, label: o.label })),
      doorsOpen: C.BULKHEADS.filter((b, i) => old.doorOpen[i]).map(b => b.id),
      bulkTop: Object.fromEntries(C.BULKHEADS.map((b, i) => [b.id, old.bulkTop[i]])),
      coalListDeg: $('coal').checked ? 2.0 : 0,
    };
    startSim(C.createSim(ship, {}, scen));
    S.playing = true; syncPlay();
  }
  function onDamageChanged() { syncHoles(); renderHoleTable(); updateHeader(); requestForecast(); }

  // ===================================================================== forecast worker
  let worker = null, fcTimer = 0;
  const workerURL = window.TitanicWorkerURL || null;
  function requestForecast(now) {
    clearTimeout(fcTimer);
    $('fcLine').textContent = 'Forecasting…';
    fcTimer = setTimeout(runForecast, now ? 30 : 350);
  }
  function runForecast() {
    const seq = ++S.fcSeq;
    const state = C.serialize(S.sim);
    if (worker) { worker.terminate(); worker = null; }
    if (workerURL && window.Worker) {
      try {
        worker = new Worker(workerURL);
        worker.onmessage = (e) => { if (e.data.seq === S.fcSeq) { S.forecast = e.data; renderForecast(); } };
        worker.onerror = () => { worker = null; fallbackForecast(seq, state); };
        worker.postMessage({ seq, state });
        return;
      } catch (e) { worker = null; }
    }
    fallbackForecast(seq, state);
  }
  function fallbackForecast(seq, state) {
    // same computation, sliced on the main thread
    const sim = C.restore(ship, state);
    const hist = []; let next = sim.t; const tMax = sim.t + 6 * 3600; let calm = 0;
    const slice = () => {
      if (seq !== S.fcSeq) return;
      const t0 = performance.now();
      while (performance.now() - t0 < 12 && sim.t < tMax && !sim.foundered) {
        if (sim.t >= next) { const r = C.readouts(sim); hist.push({ t: sim.t, trim: r.trimDeg, list: r.listDeg, water: r.waterT }); next += 30; }
        C.step(sim);
        if (sim.t > 1800) { calm = (Math.abs(sim.inflow) < 0.02 && Math.abs(sim.wth) < 1e-5) ? calm + DT : 0; if (calm > 1200) break; }
      }
      if (sim.t < tMax && !sim.foundered && calm <= 1200) { setTimeout(slice, 0); return; }
      S.forecast = { seq, hist, foundered: sim.foundered, founderT: sim.founderT, final: C.readouts(sim), events: sim.events.slice(), endT: sim.t };
      renderForecast();
    };
    slice();
  }
  function forecastSentence() {
    const f = S.forecast; if (!f) return null;
    if (f.foundered) {
      const clock = clockOf(f.founderT);
      return { short: `Founders${clock ? ' at ' + clock : ''}, ${hm(f.founderT)} after the damage`, lead: 'Forecast:' };
    }
    const r = f.final;
    if (S.sim.openings.length === 0) return { short: 'Intact. Add damage on the Damage tab', lead: '' };
    return { short: `Stays afloat: settles ${fmt(Math.abs(r.trimDeg), 1)}° by the ${r.trimDeg >= 0 ? 'head' : 'stern'} with ${fmtInt(r.waterT)} t aboard`, lead: 'Forecast:' };
  }
  function renderForecast() {
    const s = forecastSentence(); if (!s) return;
    const el = $('fcLine'); el.textContent = '';
    if (s.lead) { const b = document.createElement('b'); b.textContent = s.lead + ' '; el.appendChild(b); }
    el.appendChild(document.createTextNode(s.short));
    const f = S.forecast;
    const p = $('fcText'); p.textContent = '';
    p.appendChild(document.createTextNode(s.short + '.'));
    const ev = f.events.filter(e => e.t >= S.sim.t - 1 && /bulkhead|bridge|well|Forecastle|Founder/.test(e.label)).slice(0, 7);
    if (ev.length) {
      const tbl = document.createElement('table'); tbl.style.marginTop = '8px';
      for (const e of ev) {
        const tr = document.createElement('tr');
        const a = document.createElement('td'); a.className = 'num'; a.textContent = clockOf(e.t) || 'T+' + hm(e.t);
        const b = document.createElement('td'); b.textContent = e.label;
        tr.append(a, b); tbl.appendChild(tr);
      }
      p.appendChild(tbl);
    }
    S.lastChart = 0;
  }

  // ===================================================================== UI wiring
  // scenarios
  const SCEN_ORDER = ['titanic', 'four', 'five', 'hawke', 'britannic', 'blank'];
  {
    const box = $('scenCards');
    for (const key of SCEN_ORDER) {
      const p = SC.PRESETS[key];
      const b = document.createElement('button'); b.className = 'card'; b.dataset.key = key; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', 'false');
      const t = document.createElement('b'); t.textContent = p.title; const s = document.createElement('span'); s.textContent = p.blurb;
      b.append(t, s); b.addEventListener('click', () => { loadScenario(key); if (isPhone()) sheetOpen(false); });
      box.appendChild(b);
    }
  }
  // tabs and the phone sheet
  const panel = $('panel');
  function selectTab(name) {
    document.querySelectorAll('.tab').forEach(x => x.setAttribute('aria-selected', String(x.dataset.tab === name)));
    document.querySelectorAll('.pane').forEach(p => { p.hidden = p.dataset.pane !== name; });
    if (name === 'evidence') S.lastChart = 0;
  }
  function sheetOpen(open) {
    panel.classList.toggle('open', open);
    $('sheetClose').setAttribute('aria-expanded', String(open));
    if (open) panel.scrollTop = 0;
    S.lastChart = 0;
  }
  document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
    const already = t.getAttribute('aria-selected') === 'true';
    if (isPhone() && already && panel.classList.contains('open')) { sheetOpen(false); return; }
    selectTab(t.dataset.tab);
    if (isPhone()) sheetOpen(true);
  }));
  $('sheetClose').addEventListener('click', () => sheetOpen(false));
  // transport
  function syncPlay() { $('bPlay').textContent = S.playing ? 'Pause' : (S.sim && S.sim.foundered ? 'Foundered' : 'Play'); }
  function togglePlay() { if (S.sim.foundered) return; S.playing = !S.playing; syncPlay(); }
  $('bPlay').addEventListener('click', togglePlay);
  $('bReset').addEventListener('click', restart);
  document.querySelectorAll('#speedSeg button').forEach(b => b.addEventListener('click', () => {
    S.speed = +b.dataset.speed;
    document.querySelectorAll('#speedSeg button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  }));
  window.addEventListener('keydown', (e) => {
    const tag = (e.target && e.target.tagName) || '';
    if (/INPUT|SELECT|TEXTAREA|BUTTON|A/.test(tag) || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
    else if (e.key === 'r' || e.key === 'R') restart();
  });
  // view
  document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => setView(b.dataset.view)));
  $('bXray').addEventListener('click', () => { S.xray = !S.xray; $('bXray').setAttribute('aria-pressed', String(S.xray)); applyLook(); });
  $('bCols').addEventListener('click', () => { S.cols = !S.cols; $('bCols').setAttribute('aria-pressed', String(S.cols)); colMesh.visible = S.cols; if (S.cols) toast('Each box is one column the core integrates: water below the free surface, per space'); });
  $('bFollow').addEventListener('click', () => { S.follow = !S.follow; $('bFollow').setAttribute('aria-pressed', String(S.follow)); });
  function applyLook() {
    hullMesh.material = S.xray ? hullXray : hullSolid;
    hullMesh.renderOrder = S.xray ? 6 : 0;
    S.hullLines.visible = S.xray;
    for (const m of bulkMeshes) m.visible = S.xray;
    for (const l of bulkTopLines) l.visible = S.xray;
    for (const l of bulkLabels) l.visible = S.xray;
    for (const m of fsMeshes) m.userData.allowed = S.xray;
    for (const f of superFaces) {
      f.material.opacity = S.xray ? (f.userData.capOnly ? 0.0 : (f.userData.solid === 0xc9a46a ? 0.35 : (f.userData.solid === 0xc78a3d ? 0.14 : 0.05))) : 1.0;
      f.material.transparent = S.xray; f.material.depthWrite = !S.xray; f.material.needsUpdate = true;
      f.renderOrder = S.xray ? 5 : 0;
    }
    for (const e of superEdges) e.visible = S.xray;
  }
  // tools
  document.querySelectorAll('#toolSeg button').forEach(b => b.addEventListener('click', () => {
    S.tool = b.dataset.tool;
    document.querySelectorAll('#toolSeg button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    canvas.className = 'tool-' + S.tool;
    if (S.tool !== 'look' && !S.xray) { S.xray = true; $('bXray').setAttribute('aria-pressed', 'true'); applyLook(); }
    if (S.tool === 'hole') toast('Tap the hull below the waterline. Drag still orbits.');
    if (S.tool === 'scrape') toast('Drag along the hull below the waterline. Two fingers orbit and zoom.');
    if (S.tool !== 'look' && isPhone()) sheetOpen(false);
  }));
  const holeFromSlider = (v) => 0.02 * Math.pow(250, v / 100);
  function syncHoleSize() {
    const a = holeFromSlider(+$('holeSize').value); S.holeArea = a;
    const sheets = a / SC.A4;
    let label;
    if (sheets < 0.8) label = 'smaller than a sheet of paper';
    else if (sheets < 1.3) label = 'about one A4 sheet';
    else if (a < 0.5) label = `about ${Math.round(sheets)} A4 sheets`;
    else if (a < 1.5) label = 'a torn plate';
    else label = 'a ram or mine';
    $('holeLabel').textContent = label;
    $('holeVal').textContent = `${fmt(a, a < 0.1 ? 3 : 2)} m² · ${fmt(a * 10.764, 1)} sq ft`;
  }
  $('holeSize').addEventListener('input', syncHoleSize);
  $('bClear').addEventListener('click', () => {
    for (const o of S.sim.openings.slice()) C.removeOpening(S.sim, o.id);
    toast('All openings removed. Water already aboard stays.');
    onDamageChanged();
  });
  $('coal').addEventListener('change', () => toast('Applies when you restart from the collision'));
  // doors and bulkheads
  $('bDoorsClose').addEventListener('click', () => { C.BULKHEADS.forEach((b, i) => C.setDoor(S.sim, i, false)); renderBulkheadTable(); requestForecast(); toast('All watertight doors closed'); });
  $('bDoorsOpen').addEventListener('click', () => { C.BULKHEADS.forEach((b, i) => C.setDoor(S.sim, i, true)); renderBulkheadTable(); requestForecast(); toast('All watertight doors open'); });
  document.querySelectorAll('#bhSeg button').forEach(b => b.addEventListener('click', () => {
    S.bh = b.dataset.bh;
    document.querySelectorAll('#bhSeg button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    const preset = SC.PRESETS[S.scen].build({}).bulkTop || {};
    C.BULKHEADS.forEach((bh, i) => {
      let top = preset[bh.id] || bh.top;
      if (S.bh === 'B') top = 'B'; else if (S.bh === 'D' && top === 'E') top = 'D';
      C.setBulkheadTop(S.sim, i, top);
    });
    buildBulkheads(); applyLook(); renderBulkheadTable(); requestForecast();
    toast(S.bh === 'built' ? 'Bulkheads as built' : `Bulkheads raised to ${S.bh} deck`);
  }));

  function renderBulkheadTable() {
    const body = $('bhBody'); body.textContent = '';
    C.BULKHEADS.forEach((bh, i) => {
      const tr = document.createElement('tr');
      const td = (t, cls) => { const d = document.createElement('td'); if (cls) d.className = cls; if (t !== undefined) d.textContent = t; tr.appendChild(d); return d; };
      td(bh.id);
      td(`${ship.zones[i].short} | ${ship.zones[i + 1].short}`);
      const top = S.sim.bulkTop[i];
      const tg = document.createElement('span'); tg.className = 'tag ' + top.toLowerCase(); tg.textContent = top; td().appendChild(tg);
      const dcell = td();
      if (bh.doors.length) {
        const chip = document.createElement('button'); chip.className = 'chip';
        const open = S.sim.doorOpen[i] === 1;
        chip.setAttribute('aria-pressed', String(open)); chip.textContent = open ? 'Open' : 'Closed';
        chip.addEventListener('click', () => { C.setDoor(S.sim, i, !open); renderBulkheadTable(); requestForecast(); });
        dcell.appendChild(chip);
      } else dcell.textContent = 'none';
      const ot = S.sim.overT[i];
      td(ot >= 0 ? (clockOf(ot) || 'T+' + hm(ot)) : '–', 'num');
      tr.dataset.b = i;
      body.appendChild(tr);
    });
  }
  const holeRows = new Map();
  function renderHoleTable() {
    const body = $('holeBody');
    const groups = new Map();
    const S2 = S.sim.conn;
    const F = C.frameOf(S.sim);
    let total = 0;
    for (const o of S.sim.openings) {
      const key = `${o.zone}|${o.side}|${o.kind}`;
      const g = groups.get(key) || { key, zone: o.zone, side: o.side, kind: o.kind, n: 0, area: 0, q: 0, depth: -1e9, ids: [] };
      g.n++; g.area += o.area; g.ids.push(o.id);
      if (o.conn >= 0 && o.conn < S2.n) g.q += S2.q[o.conn];
      g.depth = Math.max(g.depth, -C.worldZ(F, o.x, o.y, o.z));
      groups.set(key, g); total += o.area;
    }
    $('totArea').textContent = `${fmt(total, 2)} m² · ${fmt(total * 10.764, 1)} sq ft`;
    // empty state
    let empty = body.querySelector('tr.empty');
    if (!groups.size) {
      for (const [, r] of holeRows) r.tr.remove(); holeRows.clear();
      if (!empty) {
        empty = document.createElement('tr'); empty.className = 'empty';
        const td = document.createElement('td'); td.colSpan = 6; td.className = 'hint';
        td.textContent = 'No openings. Choose Punch hole or Scrape above, then tap the hull.'; empty.appendChild(td); body.appendChild(empty);
      }
      return;
    }
    if (empty) empty.remove();
    for (const [key, r] of holeRows) if (!groups.has(key)) { r.tr.remove(); holeRows.delete(key); }
    const sorted = [...groups.values()].sort((a, b) => a.zone - b.zone || a.side - b.side);
    for (const g of sorted) {
      let r = holeRows.get(g.key);
      if (!r) {
        const tr = document.createElement('tr');
        const cells = [0, 1, 2, 3, 4].map((i) => { const d = document.createElement('td'); if (i >= 2) d.className = 'num'; tr.appendChild(d); return d; });
        const x = document.createElement('button'); x.className = 'x'; x.textContent = '×'; x.setAttribute('aria-label', 'Remove these openings');
        const d = document.createElement('td'); d.appendChild(x); tr.appendChild(d);
        r = { tr, cells, x, ids: [] };
        x.addEventListener('click', () => { for (const id of r.ids) C.removeOpening(S.sim, id); onDamageChanged(); });
        holeRows.set(g.key, r);
      }
      r.ids = g.ids;
      r.cells[0].textContent = `${ship.zones[g.zone].short}${g.kind !== 'breach' ? ' ports' : ''}${g.n > 1 ? ' ×' + g.n : ''}`;
      r.cells[1].textContent = g.side ? 'stbd' : 'port';
      r.cells[2].textContent = g.depth > 0 ? fmt(g.depth, 1) + ' m' : 'above';
      r.cells[3].textContent = fmt(g.area * 10.764, 1);
      r.cells[4].textContent = fmtInt(Math.max(0, g.q) * 1.025 * 60);
      body.appendChild(r.tr);
    }
  }

  // ===================================================================== HUD
  function updateHeader() {
    const p = SC.PRESETS[S.scen];
    const parts = p.title.split(',');
    $('scenName').textContent = S.scen === 'titanic' ? 'RMS Titanic' : (S.scen === 'britannic' ? 'HMHS Britannic' : (S.scen === 'hawke' ? 'RMS Olympic' : parts[0]));
    $('scenSub').textContent = S.scen === 'titanic' ? '14–15 April 1912' : (S.scen === 'britannic' ? '21 November 1916' : (S.scen === 'hawke' ? '20 September 1911' : 'What-if'));
  }
  function updateHud() {
    const sim = S.sim, r = C.readouts(sim);
    const clock = clockOf(sim.t);
    $('shipTime').textContent = clock || hms(sim.t);
    $('elapsed').textContent = clock ? 'T+' + hms(sim.t) : 'after damage';
    const trim = r.trimDeg, list = r.listDeg;
    $('sTrim').textContent = `${fmt(Math.abs(trim), 1)}° ${trim >= 0.05 ? 'head' : (trim <= -0.05 ? 'stern' : '')}`.trim();
    $('sList').textContent = `${fmt(Math.abs(list), 1)}° ${list >= 0.05 ? 'stbd' : (list <= -0.05 ? 'port' : '')}`.trim();
    $('sWater').textContent = `${fmtInt(r.waterT)} t`;
    $('sIn').textContent = `${fmtInt(Math.max(0, r.inflowTpm))} t/min`;
    $('sDraft').textContent = sim.foundered ? 'under' : `${fmt(r.draftF, 1)} / ${fmt(r.draftA, 1)} m`;
    const st = $('status');
    let cls = 'idle', txt = 'Intact';
    const overNow = C.BULKHEADS.map((b, i) => sim.overflow[i] > 0.05 ? b.id : null).filter(Boolean);
    if (sim.foundered) { cls = 'crit'; txt = 'Foundered'; }
    else if (overNow.length) { cls = 'crit'; txt = `Over bulkhead ${overNow[overNow.length - 1]}`; }
    else if (r.inflowTpm > 1) { cls = 'warn'; txt = 'Flooding'; }
    else if (sim.openings.length || r.waterT > 1) { cls = 'ok'; txt = 'Afloat'; }
    st.className = 'pill ' + cls; st.textContent = txt;
    syncPlay();
    // log
    const ev = sim.events;
    if (ev.length > S.logShown) {
      const body = $('logBody');
      for (let i = S.logShown; i < ev.length; i++) {
        const tr = document.createElement('tr');
        const a = document.createElement('td'); a.className = 'num'; a.textContent = clockOf(ev[i].t) || 'T+' + hm(ev[i].t);
        const b = document.createElement('td'); b.textContent = ev[i].label;
        tr.append(a, b); body.insertBefore(tr, body.firstChild);
      }
      if (ev.slice(S.logShown).some(e => e.id && e.id.startsWith('over'))) renderBulkheadTable();
      S.logShown = ev.length;
    }
    renderHoleTable();
  }

  // ===================================================================== damage diagram strip
  const prof = $('profile');
  const profOutline = (() => {
    const top = [], bot = [];
    for (let x = xMinT + 0.5; x <= xMaxT - 0.5; x += 1) { const z = profileBottom(x); if (z === null) continue; top.push([x, C.zTopAt(x)]); bot.push([x, z]); }
    return { top, bot };
  })();
  function drawStrip() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = prof.clientWidth, H = prof.clientHeight;
    if (!W || !H) return;
    if (prof.width !== Math.round(W * dpr) || prof.height !== Math.round(H * dpr)) { prof.width = Math.round(W * dpr); prof.height = Math.round(H * dpr); }
    const g = prof.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    const sim = S.sim, F = C.frameOf(sim);
    const padL = 4, padR = 4, padT = 14, padB = 12;
    const zLo = -1.5, zHi = 27.5;
    const sx = (W - padL - padR) / (xMaxT - xMinT);
    const sz = Math.min(sx * 1.8, (H - padT - padB) / (zHi - zLo));
    const X = (x) => padL + (x - xMinT) * sx;
    const Zp = (z) => H - padB - (z - zLo) * sz;
    // hull silhouette
    g.beginPath();
    profOutline.top.forEach((p, i) => (i ? g.lineTo(X(p[0]), Zp(p[1])) : g.moveTo(X(p[0]), Zp(p[1]))));
    for (let i = profOutline.bot.length - 1; i >= 0; i--) g.lineTo(X(profOutline.bot[i][0]), Zp(profOutline.bot[i][1]));
    g.closePath(); g.fillStyle = '#0e1b29'; g.fill(); g.strokeStyle = '#3c5a76'; g.lineWidth = 1; g.stroke();
    // water per space, level plane cut at the centreline
    const planeZ = (h, x) => (h - F.tz - F.R20 * x) / F.R22;
    g.save(); g.clip();
    for (let k = 0; k < 16; k++) {
      const Z = ship.zones[k];
      for (let L = 0; L < 2; L++) {
        const nP = C.nodeIndex(k, 0, L), nS = C.nodeIndex(k, 1, L);
        const v = sim.vol[nP] + sim.vol[nS]; if (v < 0.5) continue;
        const full = v >= 0.995 * (ship.nodeVmax[nP] + ship.nodeVmax[nS]);
        const h = sim.vol[nP] > 0 && sim.vol[nS] > 0 ? 0.5 * (sim.level[nP] + sim.level[nS]) : (sim.vol[nP] > 0 ? sim.level[nP] : sim.level[nS]);
        g.beginPath();
        const N = 8;
        for (let i = 0; i <= N; i++) {
          const x = Z.xa + (Z.xf - Z.xa) * i / N;
          const e = C.deckZ('E', x), top = C.zTopAt(x);
          const lo = L ? e : Z.floor, hi = L ? top : e;
          const zz = full ? hi : Math.max(lo, Math.min(hi, planeZ(h, x)));
          i ? g.lineTo(X(x), Zp(zz)) : g.moveTo(X(x), Zp(zz));
        }
        for (let i = N; i >= 0; i--) { const x = Z.xa + (Z.xf - Z.xa) * i / N; g.lineTo(X(x), Zp(L ? C.deckZ('E', x) : Z.floor)); }
        g.closePath(); g.fillStyle = L ? 'rgba(60,195,255,0.55)' : 'rgba(33,150,210,0.85)'; g.fill();
      }
    }
    g.restore();
    // E deck line
    g.setLineDash([3, 3]); g.strokeStyle = 'rgba(224,177,90,0.45)'; g.beginPath();
    for (let x = xMinT + 2; x < xMaxT - 2; x += 2) { const p = [X(x), Zp(C.deckZ('E', x))]; x === xMinT + 2 ? g.moveTo(p[0], p[1]) : g.lineTo(p[0], p[1]); }
    g.stroke(); g.setLineDash([]);
    // bulkheads
    g.font = '600 10px "IBM Plex Sans Condensed", "Arial Narrow", sans-serif'; g.textAlign = 'center';
    C.BULKHEADS.forEach((bh, i) => {
      const top = sim.bulkTop[i], zc = Math.min(C.deckZ(top, bh.x), C.zTopAt(bh.x));
      const over = sim.overflow[i] > 0.05;
      g.strokeStyle = over ? '#ff6b6b' : (top === 'E' ? '#e0b15a' : (top === 'D' ? '#8fd3c9' : '#dbe6ef'));
      g.lineWidth = over ? 2 : 1.2;
      g.beginPath(); g.moveTo(X(bh.x), Zp(profileBottom(bh.x) || 0)); g.lineTo(X(bh.x), Zp(zc)); g.stroke();
      g.fillStyle = '#7187a0'; g.fillText(bh.id, X(bh.x), padT - 3);
    });
    // compartment names
    g.fillStyle = '#a8bbcb'; g.font = '500 9.5px "IBM Plex Sans Condensed", "Arial Narrow", sans-serif';
    for (const Z of ship.zones) { const w = (Z.xf - Z.xa) * sx; if (w > 18) g.fillText(Z.short, X(Z.xm), H - 1); }
    // sea surface in the ship's frame
    g.strokeStyle = '#3cc3ff'; g.lineWidth = 1.6; g.beginPath();
    const x0 = xMinT, x1 = xMaxT;
    g.moveTo(X(x0), Zp(planeZ(0, x0))); g.lineTo(X(x1), Zp(planeZ(0, x1))); g.stroke();
    // openings
    for (const o of sim.openings) { g.fillStyle = o.kind === 'breach' ? '#ff5d3d' : '#ffb547'; g.beginPath(); g.arc(X(o.x), Zp(o.z), 2.3, 0, Math.PI * 2); g.fill(); }
  }

  // ===================================================================== charts
  function chart(id, cfg) {
    const wrap = $(id), cv = wrap.querySelector('canvas'), tip = wrap.querySelector('.tip');
    const st = { cfg, geom: null };
    function draw(hover) {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const W = cv.clientWidth, H = cv.clientHeight; if (!W) return;
      if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
      const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
      g.fillStyle = '#0c1622'; g.fillRect(0, 0, W, H);
      const d = st.cfg.data();
      const padL = 40, padR = 10, padT = 10, padB = 24;
      const tMax = Math.max(d.tMax, 30);
      const [y0, y1] = d.yRange;
      const X = (t) => padL + (t / tMax) * (W - padL - padR);
      const Y = (v) => padT + (1 - (v - y0) / (y1 - y0)) * (H - padT - padB);
      st.geom = { X, Y, tMax, padL, padR, W, H };
      // grid
      g.strokeStyle = '#1a2a3b'; g.lineWidth = 1; g.font = '500 10.5px "IBM Plex Mono", ui-monospace, monospace'; g.fillStyle = '#7187a0';
      g.textAlign = 'right'; g.textBaseline = 'middle';
      for (const v of d.yTicks) { const y = Math.round(Y(v)) + 0.5; g.beginPath(); g.moveTo(padL, y); g.lineTo(W - padR, y); g.stroke(); g.fillText(d.yFmt(v), padL - 6, y); }
      g.textAlign = 'center'; g.textBaseline = 'alphabetic';
      const step = tMax > 240 ? 60 : (tMax > 120 ? 30 : 15);
      for (let t = 0; t <= tMax + 0.1; t += step) g.fillText(d.xFmt(t), X(t), H - 7);
      // forecast (dashed), run (solid)
      const line = (pts, dash, alpha) => {
        if (pts.length < 2) return;
        g.save(); g.strokeStyle = '#2196d2'; g.globalAlpha = alpha; g.lineWidth = 2; g.lineJoin = 'round'; g.lineCap = 'round'; if (dash) g.setLineDash([5, 4]);
        g.beginPath(); let started = false;
        for (const p of pts) { if (p[0] > tMax) break; const x = X(p[0]), y = Y(Math.max(y0, Math.min(y1, p[1]))); started ? g.lineTo(x, y) : g.moveTo(x, y); started = true; }
        g.stroke(); g.restore();
      };
      line(d.forecast, true, 0.75); line(d.run, false, 1);
      // observations
      for (const o of d.obs) { const x = X(o[0]), y = Y(o[1]); g.beginPath(); g.arc(x, y, 6, 0, 7); g.fillStyle = '#0c1622'; g.fill(); g.beginPath(); g.arc(x, y, 4, 0, 7); g.fillStyle = '#bd8a30'; g.fill(); }
      if (d.endMark) { g.strokeStyle = '#7187a0'; g.setLineDash([2, 3]); const x = Math.round(X(d.endMark.t)) + 0.5; g.beginPath(); g.moveTo(x, padT); g.lineTo(x, H - padB); g.stroke(); g.setLineDash([]); g.fillStyle = '#a8bbcb'; g.textAlign = x > W - 80 ? 'right' : 'left'; g.fillText(d.endMark.label, x + (x > W - 80 ? -4 : 4), padT + 9); }
      // crosshair
      if (hover !== undefined && hover !== null) {
        const x = Math.round(X(hover)) + 0.5; g.strokeStyle = '#4a6782'; g.beginPath(); g.moveTo(x, padT); g.lineTo(x, H - padB); g.stroke();
      }
    }
    function nearest(pts, t) { let best = null; for (const p of pts) { if (!best || Math.abs(p[0] - t) < Math.abs(best[0] - t)) best = p; } return best && Math.abs(best[0] - t) < 6 ? best : null; }
    cv.addEventListener('pointermove', (e) => {
      if (!st.geom) return;
      const rect = cv.getBoundingClientRect(), px = e.clientX - rect.left;
      const { X, tMax, padL, W, padR } = st.geom;
      const t = Math.max(0, Math.min(tMax, (px - padL) / (W - padL - padR) * tMax));
      draw(t);
      const d = st.cfg.data();
      const run = nearest(d.run, t), fc = nearest(d.forecast, t), ob = nearest(d.obs, t);
      tip.textContent = '';
      const head = document.createElement('div'); head.style.color = '#a8bbcb'; head.textContent = d.xFmt(t, true); tip.appendChild(head);
      const row = (v, label, color, dash) => {
        const r = document.createElement('div'); const s = document.createElement('span'); s.className = 'val'; s.textContent = d.yFmt(v, true);
        const k = document.createElement('i'); k.style.cssText = `display:inline-block;width:12px;height:0;border-top:2px ${dash ? 'dashed' : 'solid'} ${color};margin:0 6px 3px 0`;
        const l = document.createElement('span'); l.style.color = '#a8bbcb'; l.textContent = ' ' + label;
        r.append(k, s, l); tip.appendChild(r);
      };
      if (run) row(run[1], 'this run', '#2196d2'); else if (fc) row(fc[1], 'forecast', '#2196d2', true);
      if (ob) row(ob[1], 'witnessed', '#bd8a30');
      tip.style.display = 'block';
      const left = Math.min(px + 12, cv.clientWidth - 150); tip.style.left = Math.max(0, left) + 'px'; tip.style.top = '8px';
    });
    cv.addEventListener('pointerleave', () => { tip.style.display = 'none'; draw(); });
    st.draw = draw;
    return st;
  }
  const isTitanic = () => S.scen === 'titanic';
  const minutesFmt = (t, long) => { const c = clockOf(t * 60); return long ? (c ? `${c} · T+${Math.round(t)} min` : `T+${Math.round(t)} min`) : (c && S.scen === 'titanic' ? c.replace(' am', '').replace(' pm', '') : `${Math.round(t)}m`); };
  function chartData(key, yr, ticks, fmtY, obs) {
    return () => {
      const run = S.hist.map(h => [h.t / 60, h[key]]);
      const f = S.forecast; const fc = f ? f.hist.map(h => [h.t / 60, h[key]]) : [];
      const tEnd = Math.max(f ? f.endT / 60 : 0, S.sim.t / 60, isTitanic() ? 165 : 30);
      const endMark = f && f.foundered ? { t: f.founderT / 60, label: 'founders' } : null;
      return { run, forecast: fc, obs: isTitanic() ? obs : [], tMax: Math.min(tEnd, 480), yRange: yr(run, fc), yTicks: ticks, yFmt: fmtY, xFmt: minutesFmt, endMark };
    };
  }
  const chTrim = chart('chTrim', { data: chartData('trim', () => [-1, 12], [0, 2, 4, 6, 8, 10, 12], (v, l) => `${v.toFixed(l ? 1 : 0)}°`, SC.OBS.trim.filter(o => o[0] > 0)) });
  const chList = chart('chList', { data: chartData('list', () => [-20, 10], [-20, -10, 0, 10], (v, l) => `${v.toFixed(l ? 1 : 0)}°`, SC.OBS.list) });
  const chWater = chart('chWater', { data: chartData('water', () => [0, 45000], [0, 15000, 30000, 45000], (v, l) => l ? `${fmtInt(v)} t` : `${v / 1000}k`, [[40, SC.OBS.wilding40]]) });

  function renderEvidence() {
    // timeline check against the baked calibrated run (stable) plus the current run when it is Titanic
    const body = $('evBody'); body.textContent = '';
    const evs = (VAL.titanic && VAL.titanic.events) || [];
    const idMatch = (id, label) => ({ overF: /bulkhead F/, ports: /Second row/, well: /well deck/, fcastle: /Forecastle/, bridge: /bridge/ })[id].test(label);
    const find = (id) => { const e = evs.find(e => e.label && idMatch(id, e.label)); return e ? e.t : null; };
    const rows = SC.OBS.events.map(o => [o.label, o.t, find(o.id)]);
    rows.push(['Trim at 2:15 am', '10.0°', VAL.titanic ? (VAL.titanic.hist.find(h => h[0] >= 155) || [0, 0])[1].toFixed(1) + '°' : '–']);
    rows.push(['Foundered (stern under)', 160, VAL.titanic ? VAL.titanic.founderMin : null]);
    rows.push(['16,000 tons aboard (Wilding)', 40, VAL.titanic ? VAL.titanic.wildingMin : null]);
    for (const r of rows) {
      const tr = document.createElement('tr');
      const a = document.createElement('td'); a.textContent = r[0];
      const b = document.createElement('td'); b.className = 'num'; b.textContent = typeof r[1] === 'number' ? clockAt(r[1]) : r[1];
      const c = document.createElement('td'); c.className = 'num'; c.textContent = typeof r[2] === 'number' ? clockAt(r[2]) : (r[2] || '–');
      tr.append(a, b, c); body.appendChild(tr);
    }
    const vb = $('valBody'); vb.textContent = '';
    const V = VAL;
    const out = (k) => { const r = V[k]; if (!r) return '–'; return r.foundered ? `Founders in ${hm(r.founderMin * 60)}` : `Floats, ${Math.abs(r.trim).toFixed(1)}° by the ${r.trim >= 0 ? 'head' : 'stern'}`; };
    const vrows = [
      ['Titanic, 1912 (the fit)', 'Sank in 2 h 40 min', out('titanic')],
      ['Forepeak + holds 1–3 open', 'Wilding: would float', out('four')],
      ['Add boiler room 6', 'Wilding: sinks', out('five')],
      ['Olympic and Hawke, 1911', 'Two compartments flooded, reached port', out('hawke')],
      ['Britannic, 1916 (approx.)', 'Sank in about 55 min', out('britannic')],
      ['Britannic, portholes shut', 'Built to float with six flooded', out('britannicClosed')],
      ['Titanic, no damage in BR5', 'Wilding: still sinks, slower', out('titanicNoBR5')],
      ['Titanic, bulkheads to D deck', 'Wilding: would not save her', out('titanicD')],
      ['Titanic, bulkheads to B deck', 'Wilding: she would still go down', out('titanicB') + ' (disagrees)'],
      ['Titanic, doors left open', 'Debated', out('titanicDoors')],
    ];
    for (const r of vrows) { const tr = document.createElement('tr'); for (const c of r) { const td = document.createElement('td'); td.textContent = c; tr.appendChild(td); } vb.appendChild(tr); }
  }
  function clockAt(min) { const c = SC.PRESETS.titanic.clock; let m = c.h * 60 + c.m + min; m = ((m % 1440) + 1440) % 1440; let h = Math.floor(m / 60); const mm = Math.round(m % 60); const ap = h >= 12 ? 'pm' : 'am'; h = h % 12 || 12; return `${h}:${String(mm).padStart(2, '0')} ${ap}`; }

  // ===================================================================== frame loop
  const tmpM = new THREE.Matrix4(), invM = new THREE.Matrix4();
  function poseMatrix(sim, extraDown) {
    const F = C.frameOf(sim);
    tmpM.set(F.R00, F.R02, -F.R01, F.tx,
      F.R20, F.R22, -F.R21, F.tz - (extraDown || 0),
      -F.R10, -F.R12, F.R11, -F.ty,
      0, 0, 0, 1);
    return { M: tmpM, F };
  }
  const v3 = new THREE.Vector3();
  function updateScene(time) {
    const sim = S.sim;
    const { M, F } = poseMatrix(sim, S.post);
    shipGroup.matrix.copy(M); shipGroup.matrixWorldNeedsUpdate = true;
    shipGroup.updateMatrixWorld(true);
    invM.copy(M).invert();
    // levels (three world y = physical Z)
    const lv = levelUniform.value;
    for (let n = 0; n < NN; n++) lv[n] = sim.vol[n] > 1e-3 ? sim.level[n] - S.post : -1e4;
    const camY = camera.position.y;
    hullXray.uniforms.uCamY.value = camY; hullXray.uniforms.uTime.value = time; hullSolid.uniforms.uCamY.value = camY;
    seaMat.uniforms.uTime.value = time; seaMat.uniforms.uCam.value.copy(camera.position);
    sea.position.set(camera.position.x, 0, camera.position.z);
    // bulkheads: show the water on each face
    C.BULKHEADS.forEach((bh, b) => {
      const u = bulkMeshes[b].material.uniforms;
      const L = (k) => [C.nodeIndex(k, 0, 0), C.nodeIndex(k, 1, 0), C.nodeIndex(k, 0, 1), C.nodeIndex(k, 1, 1)].map(n => lv[n]);
      u.uF.value.fromArray(L(b)); u.uA.value.fromArray(L(b + 1)); u.uCamY.value = camY;
      const over = sim.overflow[b] > 0.05;
      bulkTopLines[b].material.color.setHex(over ? 0xff6b6b : bulkTopLines[b].userData.base);
    });
    // free surfaces
    for (let n = 0; n < NN; n++) {
      const m = fsMeshes[n];
      const V = sim.vol[n], vmax = ship.nodeVmax[n];
      const show = S.xray && V > 0.5 && V < vmax * 0.998;
      m.visible = show; if (!show) continue;
      const k = n >> 2, Z = ship.zones[k];
      const y = lv[n];
      // world-space footprint of the zone at this level
      let minX = 1e9, maxX = -1e9, minZ = 1e9, maxZ = -1e9;
      for (const xx of [Z.xa, Z.xf]) for (const yy of [-15, 15]) for (const zz of [0, 26]) {
        v3.set(xx, zz, -yy).applyMatrix4(M);
        if (v3.x < minX) minX = v3.x; if (v3.x > maxX) maxX = v3.x; if (v3.z < minZ) minZ = v3.z; if (v3.z > maxZ) maxZ = v3.z;
      }
      m.position.set((minX + maxX) / 2, y, (minZ + maxZ) / 2);
      m.scale.set(maxX - minX + 2, 1, maxZ - minZ + 2);
      const u = m.material.uniforms; u.uInv.value.copy(invM); u.uTime.value = time; u.uCamY.value = camY;
    }
    // holes and jets
    if (S.openVersion !== sim.openings.length) { syncHoles(); S.openVersion = sim.openings.length; }
    const Sc = sim.conn;
    for (const [, o] of holeObjs) {
      const c = o.rec.conn; const q = c >= 0 && c < Sc.n ? Sc.q[c] : 0;
      const len = q > 0 ? 2 + 9 * Math.sqrt(q) : 0;
      o.jet.visible = len > 0.1 && S.xray;
      if (o.jet.visible) { const w = 0.8 + 0.8 * Math.sqrt(o.rec.area); o.jet.scale.set(w, len, w); o.jet.material.opacity = 0.35 + 0.2 * Math.sin(time * 9 + o.rec.id); }
      const wz = C.worldZ(F, o.rec.x, o.rec.y, o.rec.z);
      o.dot.material.opacity = wz < 0 ? 0.95 : 0.4;
    }
    // physics columns
    if (S.cols) updateColumns(F);
    // camera follow
    if (S.follow) {
      v3.set(0, 8, 0).applyMatrix4(M);
      ctl.target.lerp(new THREE.Vector3(v3.x, Math.max(-60, v3.y * 0.6), v3.z), 0.06);
    }
  }
  const colTmp = new THREE.Matrix4(), colCol = new THREE.Color();
  function updateColumns(F) {
    const sim = S.sim, c = ship.cols; let n = 0;
    const iR = 1 / F.R22;
    for (let node = 0; node < NN; node++) {
      if (sim.vol[node] <= 1e-3) continue;
      const h = sim.level[node];
      const full = sim.vol[node] >= ship.nodeVmax[node] * 0.999;
      const s0 = ship.nodeStart[node], s1 = s0 + ship.nodeCount[node];
      colCol.setHex(node & 1 ? 0x6fd6ff : 0x2196d2);
      for (let j = s0; j < s1; j++) {
        const i = ship.entCol[j], a = ship.entA[j], b = ship.entE[j];
        const zp = full ? b : (h - (F.R20 * c.x[i] + F.R21 * c.y[i] + F.tz)) * iR;
        if (zp <= a + 0.02) continue;
        const L = Math.min(b, zp) - a;
        colTmp.makeScale(c.dx[i] * 0.86, L, c.dy * 0.8); colTmp.setPosition(c.x[i], a + L / 2, -c.y[i]);
        colMesh.setMatrixAt(n, colTmp); colMesh.setColorAt(n, colCol); n++;
      }
    }
    colMesh.count = n; colMesh.instanceMatrix.needsUpdate = true; if (colMesh.instanceColor) colMesh.instanceColor.needsUpdate = true;
  }

  let last = performance.now();
  function frame(now) {
    const dtReal = Math.min(0.1, (now - last) / 1000); last = now;
    const sim = S.sim;
    if (S.playing && !sim.foundered) {
      S.acc += dtReal * S.speed;
      let steps = Math.floor(S.acc / DT);
      if (steps > 700) { steps = 700; S.acc = 0; } else S.acc -= steps * DT;
      for (let i = 0; i < steps; i++) {
        if (sim.t >= S.histNext) {
          const r = C.readouts(sim);
          S.hist.push({ t: sim.t, trim: r.trimDeg, list: r.listDeg, water: r.waterT });
          S.histNext = sim.t + 10;
        }
        C.step(sim);
        if (sim.foundered) { S.playing = false; toast(`Foundered ${clockOf(sim.t) ? 'at ' + clockOf(sim.t) : ''}, ${hm(sim.t)} after the damage`); renderBulkheadTable(); break; }
      }
    }
    if (sim.foundered && S.post < 140) S.post += dtReal * 14;
    if (renderer) {
      updateScene(now / 1000);
      applyCamera();
      renderer.render(scene, camera);
      // pixel-ratio governor: a device that cannot hold 25 fps at this resolution gets a lower one, one step at a time
      perf.sum += dtReal; perf.n++;
      if (perf.n >= 90) {
        const avg = perf.sum / perf.n; perf.sum = 0; perf.n = 0;
        if (avg > 0.04 && perf.pr > 1 && !document.hidden) { perf.pr = Math.max(1, perf.pr - 0.25); renderer.setPixelRatio(perf.pr); resize(); }
      }
    }
    if (now - S.lastUi > 120) { S.lastUi = now; updateHud(); }
    if (now - S.lastStrip > 66) { S.lastStrip = now; drawStrip(); }
    if (now - S.lastChart > 1000 && !document.querySelector('[data-pane="evidence"]').hidden) { S.lastChart = now; chTrim.draw(); chList.draw(); chWater.draw(); }
    requestAnimationFrame(frame);
  }

  // ===================================================================== sizing and boot
  const stage = $('stage');
  function resize() {
    classifyDevice();
    const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return;
    if (renderer) renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    S.lastStrip = 0; S.lastChart = 0;
  }
  if (window.ResizeObserver) new ResizeObserver(resize).observe(stage); else window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => setTimeout(resize, 200));
  resize();
  syncHoleSize();
  const hashScen = (() => { const m = /scenario=([a-z]+)/.exec(location.hash || ''); return m && SC.PRESETS[m[1]] ? m[1] : 'titanic'; })();
  loadScenario(hashScen, true);
  setView('quarter');
  ctl.theta = VIEWS.quarter.theta; ctl.phi = VIEWS.quarter.phi; ctl.r = VIEWS.quarter.r;
  applyLook();
  renderEvidence();
  // sprite labels were drawn before the vendored fonts arrived; redraw them once
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (S.sim) { buildBulkheads(); applyLook(); } }).catch(() => {});
  requestAnimationFrame(frame);
  // console handle for exploring the live model: TitanicApp.state.sim, TitanicCore.gmNow(TitanicApp.state.sim)
  window.TitanicApp = {
    state: S, ship, camera, renderer, version: VERSION,
    device: () => rootEl.dataset.device,
    project(x, y, z) {
      const p = SX(x, y, z).applyMatrix4(shipGroup.matrix).project(camera);
      const r = canvas.getBoundingClientRect();
      return { x: r.left + (p.x + 1) / 2 * r.width, y: r.top + (1 - p.y) / 2 * r.height };
    },
  };
})();
