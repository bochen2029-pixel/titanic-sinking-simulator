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
// The watch (P4 of the ship under way): a night from core/night.js is stepped instead of the bare core; the Bridge
// overlay gives helm and telegraph orders through Night.helm and Night.telegraph; the ship stays at the scene's origin
// and the sea, the berg and her track move past her (an earth-fixed group turned by her heading).
(function () {
  'use strict';
  if (!window.THREE) {
    const el = document.getElementById('nogl');
    if (el) { el.hidden = false; const why = document.getElementById('noglWhy'); if (why) why.textContent = 'three.js did not load.'; }
    return;
  }
  const C = window.TitanicCore, SC = window.TitanicScenarios;
  const Mo = window.TitanicMotion, EN = window.TitanicEncounter, NT = window.TitanicNight;   // the ship under way, the ice, the watch
  const VS = window.TitanicVisuals;               // shapes and constructions for the stern gear, the wake, the lights (site/visuals.js)
  const TS = window.TitanicTopsides;              // her topsides as sourced numbers and builders (site/topsides.js)
  const SY = window.TitanicSystems || null;       // the ship's plant: coal, fires, steam, engines, steering, dynamos (core/systems.js)
  const TAU = 2 * Math.PI, D2R = Math.PI / 180;
  const G = C.G;
  const $ = (id) => document.getElementById(id);
  const VAL = window.TitanicValidation || {};
  const ENS = window.TitanicEnsemble || null;     // NH3: the kept set's bands (out/ensemble_1912.json, inlined by the build)
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
  if (TS && TS.useHull) TS.useHull(ship.hull);    // G24: the drawn shell stands on this ship's hull, her ends with it
  const S = {
    scen: 'titanic', sim: null, speed: 60, playing: true, acc: 0,
    tool: 'look', holeArea: 0.0624, xray: true, cols: false, xrayChoice: true, colsChoice: false, follow: true, view: 'quarter',
    hist: [], histNext: 0, forecast: null, fcSeq: 0, fcAsked: 0,   // fcAsked: how many times a forecast was asked for (the tests count)
    bh: 'built', logShown: 0, post: 0, openVersion: -1, lastUi: 0, lastStrip: 0, lastChart: 0,
    // the watch: null, or { seed, kn, spec, mode: 'you' | 'auto' | 'replay', bells, touched, over, nOpen, rows, mine }
    night: null, nightKn: 22.5, nightLevel: 'hard', lastWatch: null, warp: 1,
    // the stern gear: revolutions turned by each shaft (port, centre, starboard), summed step by step from the model
    screwRev: [0, 0, 0], simDtFrame: 0, lights: true, sternLight: true,
    lightsFailT: -1, lightsFailWhy: null, gongs: 0, beats: 0, lastRev: 0,   // her lights' failing; sound counters (for the tests)
    lightsMainT: -1, lightsMainWhy: null,         // NH15 F8: her main dynamos lost while the emergency sets still light her
    coal: 'loaded',                               // the coal in her bunkers on the next run: 'loaded' | '2h' | '15m' (Systems tab)
  };
  const DT = C.DEFAULT_PARAMS.dt;
  const NN = C.NN;

  // ---- the page's clock (QC C-3; docs/DESIGN_virtual_clock_v1_1_2026-11-21.md): the time each frame runs at, in ms. In
  // real mode it is the animation frame's time plus an offset that stays 0 until a test has run virtual frames; in virtual
  // mode (TitanicApp.test, or clock=test in the address) only a test's frames advance it. It is the frames' clock, not the
  // watch's: it runs while the watch is paused or held. It only goes forward. Whatever says when something happens in the
  // page reads it; the wall clock stays for CPU budgets, statistics, the player's hand and layout (tools/clock_tests.js
  // holds the list)
  const clock = { t: performance.now(), off: 0, virtual: /[#&]clock=test(&|$)/.test(location.hash || '') };
  const clockNow = () => clock.t;
  // timers on the page's clock: fn runs on the first frame at or after now() + ms, in the order they were set
  const timers = [];
  function after(ms, fn) { const t = { at: clock.t + (+ms || 0), fn }; timers.push(t); return t; }
  function cancelAfter(t) { const i = timers.indexOf(t); if (i >= 0) timers.splice(i, 1); }
  function runTimers() {
    for (let i = 0; i < timers.length;) {
      const t = timers[i];
      if (clock.t >= t.at) { timers.splice(i, 1); try { t.fn(); } catch (e) { console.error(e); } } else i++;
    }
  }
  // the pace's holds, one for each owner (holdPace, under "the page's pace")
  const holds = new Map();
  // whether the pass running now draws (TitanicApp.drawing): always in real mode; in virtual mode only when a test asks
  let passDraws = true;

  // ===================================================================== helpers
  const fmt = (v, d) => (v === undefined || v === null || isNaN(v)) ? '–' : v.toFixed(d);
  const fmtInt = (v) => Math.round(v).toLocaleString('en-US');
  function hms(t) {
    t = Math.max(0, Math.floor(t));
    const h = Math.floor(t / 3600), m = Math.floor(t / 60) % 60, s = t % 60;
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  function hm(t) { const m = Math.round(t / 60); return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min`; }
  // ship's time at sim time t; a watch counts from its own start and can show the seconds
  function clockOf(t, secs) {
    let base;
    if (S.night) base = S.night.spec.clock0;
    else { const p = SC.PRESETS[S.scen], c = p && p.clock; if (!c) return null; base = c.h * 3600 + c.m * 60; }
    const s = (((base + t) % 86400) + 86400) % 86400;
    let h = Math.floor(s / 3600);
    const m = Math.floor(s % 3600 / 60), ss = Math.floor(s % 60);
    const ap = h >= 12 ? 'pm' : 'am';
    h = h % 12; if (h === 0) h = 12;
    return secs ? `${h}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')} ${ap}` : `${h}:${String(m).padStart(2, '0')} ${ap}`;
  }
  let toastTimer = null;
  function toast(msg, big) {
    const el = $('toast'); el.textContent = msg; el.classList.add('on'); el.classList.toggle('big', !!big);
    // where it stands is the layout's (C-4): it rides just above the helm's area, the Bridge's on a watch
    cancelAfter(toastTimer); toastTimer = after(big ? 4200 : 2600, () => el.classList.remove('on'));   // on the page's clock
    // the page's notices open to the parts (S2): a part that shows notices its own way (the bridge's view of
    // site/parts/60_reports.js covers this one) hears each; one it gives from inside the hook is not heard again
    if (!toast.telling) { toast.telling = true; try { fire('event', 'notice', { text: msg, big: !!big }); } finally { toast.telling = false; } }
  }
  // ship frame (x fwd, y port, z up)  ->  three local (x, z, -y)
  const SX = (x, y, z) => new THREE.Vector3(x, z, -y);

  // ---- parts: optional modules bundled after this file (site/parts/*.js) hook the frame, the model's steps and the
  // moments of a run through TitanicApp.on(kind, fn). Like the rest of the viewer they read the model's state and draw
  // or sound it; they never feed anything back to it. With none registered each call below is an empty loop. A part
  // that throws is reported once on the console and dropped, and the page carries on.
  //   'reset' (sim)         a run has been loaded or restarted
  //   'step'  (sim)         the model has taken one step (0.25 s of her time)
  //   'frame' (t, dt)       once a drawn frame, the scene posed and not yet rendered: seconds of real time
  //   'event' (name, data)  bells, touch, clear, foundered (she has gone: TitanicApp.gone, QC B-4; on an onset watch at the
  //                         break's onset, TitanicApp.broke); helm, telegraph, doors, door, fires, pump; order (every
  //                         order given on a watch, the page's and a part's: { type, value, arg, done }); log (a line of
  //                         the model's own log); notice (the page's notices: { text, big }); view (a camera chosen);
  //                         scrub (NH4: the page went back to a kept minute, { m, t }); ordersDropped (NH4: in a night
  //                         taken back, a new order or a hole made by hand makes the night a new one from the log's place
  //                         index and the time t on, { index, t, by }: what a part remembered from there on is of a night
  //                         that is no more; by 'order', the later orders dropped; by 'hole', they still come, each one
  //                         place further on in the log; by 'hand', a preset's change by hand, index null: G32)
  //   'camera' (view)       asked every frame before the camera is placed: a part that returns true has placed it itself
  //                         (a view of its own: it adds the name to TitanicApp.views first, so setView knows it)
  //   'layout' (rects)      after the stage's layout has changed (C-4): each area's rectangle, { name: [x, y, w, h] }; a
  //                         part lays out the inside of its own overlay here, never on a timer
  // A part's overlay stands in an area of the stage's grid (TitanicApp.slot(area, el, { order, last })), its buttons in
  // the view bar (TitanicApp.addButton(row, el, { after, before })): it never places them by hand.
  // What a part may call besides (S2, N2; window.TitanicApp at the end of this file): order(type, value, arg), the one way
  // to give an order on a watch (takeOver, then Night.act); takeOver(); holdPace(seconds, owner) and pace(); the views'
  // flags (look, fov, keep: VIEWS below); the scene's pieces by name (hull, deckhouses, berg(), smoke, steam, wake, track,
  // course, marks). It reads them. What it changes of the page's that has a key it claims (C-4 step 3: claim(key, owner,
  // value, rank); the marks, X-ray, the columns) and never saves and gives back; whatever else it changes for its own look
  // it restores.
  const HOOKS = { reset: [], step: [], frame: [], event: [], camera: [], layout: [] };
  function fire(kind, a, b) {
    const L = HOOKS[kind];
    for (let i = 0; i < L.length; i++) { try { L[i](a, b); } catch (e) { console.error('a viewer part failed in "' + kind + '" and was dropped:', e); L.splice(i--, 1); } }
  }

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
  const xMinT = G.xAP - G.sternOverhang - 0.5, xMaxT = C.xFwd(C.zTopAt(G.xFP)) + 0.5, zMaxT = 36, HB_SCALE = 15.0;
  // the tiers above B deck that the flooding model carries (core/core.js TIER, tierTop; a ship built with them): the water
  // standing in them is drawn as the model has it (its level in each compartment: the same uLevels the hull reads), up to
  // what is shut in over each point, and inside each tier's sides (the half-breadth texture below)
  const TIER = ship.tiers && C.TIER ? C.TIER : null, f2 = (v) => v.toFixed(3);
  const GLSL_TIER = TIER ? `
    float tierTopF(float x, float y){
      if (!(x > ${f2(TIER.B[0])} && x < ${f2(TIER.B[1])})) return zTopF(x);
      if (!(x > ${f2(TIER.A[0])} && x < ${f2(TIER.A[1])}) || (x <= ${f2(TIER.screen)} && y > ${f2(TIER.houseA)})) return ${f2(G.deck.A)} + sheer(x);
      ${TIER.houses.map(h => `if (x > ${f2(h.x0)} && x <= ${f2(h.x1)} && y <= ${f2(h.hw)}) return ${f2(G.deck.Boat + h.h)} + sheer(x);`).join('\n      ')}
      return ${f2(G.deck.Boat)} + sheer(x);
    }` : 'float tierTopF(float x, float y){ return zTopF(x); }';
  const GLSL_COMMON = `
    const float XFP = ${G.xFP.toFixed(4)};
    const float DECKE = ${G.deck.E.toFixed(4)};
    const float DECKD = ${G.deck.D.toFixed(4)};
    const float DECKC = ${G.deck.C.toFixed(4)};
    const float DECKB = ${G.deck.B.toFixed(4)};
    const float TANK = ${G.tankTop.toFixed(4)};
    float sheer(float x){ float s = x / XFP; return x >= 0.0 ? ${G.sheerF.toFixed(3)} * s * s : ${G.sheerA.toFixed(3)} * s * s; }
    float zTopF(float x){ bool w = (x > ${G.wellFwd[0].toFixed(2)} && x < ${G.wellFwd[1].toFixed(2)}) || (x > ${G.wellAft[0].toFixed(2)} && x < ${G.wellAft[1].toFixed(2)}); return (w ? DECKC : DECKB) + sheer(x); }
  ` + GLSL_TIER;
  // a tier's side at (x, z) over the hull's top: B deck's house her full breadth, A deck's the screen's or its house's, a
  // Boat-deck house its own (core/core.js's own rule for where the water stands; 0 where nothing is shut in)
  function tierHB(x, z) {
    if (!TIER || !(x > TIER.B[0] && x < TIER.B[1])) return 0;
    if (z <= C.deckZ('A', x)) return C.halfBreadth(x, z, ship.hull);
    if (x > TIER.A[0] && x < TIER.A[1] && z <= C.deckZ('Boat', x)) return x > TIER.screen ? C.halfBreadth(x, z, ship.hull) : TIER.houseA;
    for (const h of TIER.houses) if (x > h.x0 && x <= h.x1 && z <= C.deckZ('Boat', x) + h.h) return h.hw;
    return 0;
  }
  const bulkX = C.BULKHEADS.map(b => b.x);

  // ---- half-breadth texture for clipping free surfaces to the hull: the model's own (C.halfBreadth), where the water is;
  // not the drawn shell's round stern (site/topsides.js hullDraw), which is wider aft above the waterline. Under the
  // counter's knuckle the drawn shell is the narrower (T1): there the water is clipped to it, so none shows outside her
  const hbTex = (() => {
    const W = 512, H = 128, data = new Uint8Array(W * H * 4);
    const hbWater = (x, z) => { const m = C.halfBreadth(x, z, ship.hull); return TS ? Math.min(m, TS.hullDraw(x, z)) : m; };
    for (let j = 0; j < H; j++) {
      const z = (j / (H - 1)) * zMaxT;
      for (let i = 0; i < W; i++) {
        const x = xMinT + (i / (W - 1)) * (xMaxT - xMinT);
        const b = z <= C.zTopAt(x) + 0.3 ? Math.max(hbWater(x, Math.min(z, C.zTopAt(x))), tierHB(x, z)) : tierHB(x, z);
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
    // uPsi, uPos, uPosG: the ship's heading and her place on the earth (and that place modulo the 20 m grid, so the
    // lines keep their sharpness far from the start). With all three zero the sea is the ship-fixed grid it always was.
    uniforms: { uTime: { value: 0 }, uCam: { value: new THREE.Vector3() }, uPsi: { value: 0 }, uPos: { value: new THREE.Vector2() }, uPosG: { value: new THREE.Vector2() } },
    extensions: { derivatives: true },
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `
      uniform float uTime; uniform vec3 uCam; uniform float uPsi; uniform vec2 uPos; uniform vec2 uPosG; varying vec3 vW;
      void main(){
        float cs = cos(uPsi), sn = sin(uPsi);
        vec2 rel = vec2(vW.x * cs - vW.z * sn, vW.x * sn + vW.z * cs);      // north and east of her, in metres
        vec2 e = rel + uPos;
        vec2 p = (rel + uPosG) / 20.0;
        vec2 g = abs(fract(p - 0.5) - 0.5) / fwidth(p);
        float line = 1.0 - min(min(g.x, g.y), 1.0);
        float d = length(vW.xz - uCam.xz);
        float fade = exp(-d / 700.0);
        float shimmer = 0.5 + 0.5 * sin(e.x * 0.07 + uTime * 0.6) * sin(e.y * 0.05 - uTime * 0.4);
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

  // ---- hull mesh from the same half-breadth function the physics integrates, but for her stern above the waterline:
  // there the drawn shell is site/topsides.js's hullDraw (the deck plan's round stern, Bo's correction of 2026-11-19),
  // never narrower than the model's; below her load waterline and forward of x -75 it is the model's own. The drawn
  // water stays clipped to the model's hull (hbTex above): the difference is the drawn shell's, as the screw's aperture is
  const hullHB = TS ? TS.hullDraw : C.halfBreadth;
  function profileBottom(x) {
    const zt = C.zTopAt(x);
    for (let z = 0; z <= zt; z += 0.05) if (hullHB(x, z) > 0.02) return z;
    return null;
  }
  const NZ = 40, ND = 8;
  function hullRing(x) {
    const zlo = profileBottom(x); if (zlo === null) return null;
    const zt = C.zTopAt(x);
    const pts = [[x, 0, zlo]];
    const lev = [];
    // her after body (T1, abaft x -112) takes one set of heights from the keel, each ring's clipped at its own bottom: the
    // rows then run level across the stern post and the counter's rising underside, with no seam and no bulge
    const z0 = TS && TS.STERN.kFwd && x < TS.STERN.kFwd ? 0 : zlo;
    for (let j = 0; j <= NZ; j++) { const u = 0.5 * (1 - Math.cos(Math.PI * j / NZ)); lev.push(Math.max(zlo, z0 + (zt - z0) * u)); }
    for (let j = 0; j <= NZ; j++) pts.push([x, -hullHB(x, lev[j]), lev[j]]);
    const bt = hullHB(x, zt - 0.001);
    for (let d = 1; d < ND; d++) pts.push([x, -bt + 2 * bt * d / ND, zt]);
    for (let j = NZ; j >= 0; j--) pts.push([x, hullHB(x, lev[j]), lev[j]]);
    return pts;
  }
  const hullStations = [];
  {
    const xs = [];
    for (let x = xMinT + 0.5; x <= xMaxT - 0.5; x += 1.0) xs.push(x);
    for (const w of [G.wellFwd, G.wellAft]) { xs.push(w[0] - 0.04, w[0] + 0.04, w[1] - 0.04, w[1] + 0.04); }
    // close in on the round stern's end (its edge meets the end athwartships: stations every few centimetres there)
    { const xe = C.xAft(C.zTopAt(G.xAP - G.sternOverhang)); for (const d of [0.012, 0.03, 0.06, 0.1, 0.16, 0.25, 0.37, 0.52, 0.72]) xs.push(xe + d); }
    // the stern post (T1): her run closes into it below the counter's knuckle, the counter open abaft it
    if (TS && TS.STERN.post) xs.push(TS.STERN.post - 0.02, TS.STERN.post + 0.02);
    xs.sort((a, b) => a - b);
    for (const x of xs) { const r = hullRing(x); if (r) hullStations.push(r); }
    // the round end closed: a ring of no breadth on the counter's end, where the shell's last ring would leave a slit
    const r0 = hullStations[0], xe = C.xAft(C.zTopAt(G.xAP - G.sternOverhang));
    if (TS && r0[0][0] < G.xAP) hullStations.unshift(r0.map(p => [xe, 0, p[2]]));
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
  // the core's pockets holding water (W6's bunker, G7's tank) for the X-ray tint: each one's walls in her frame (x0, x1,
  // z0, z1), its side (0 port, 1 starboard, 2 both) and its own level in the world (-1e4: none, and the tint is as it is
  // without pockets), set each frame (updateScene, with the pockets' other drawings). Four, as POCKETS below
  const PK_TINT = 4;
  const pkTint = { box: { value: Array.from({ length: PK_TINT }, () => new THREE.Vector4()) }, side: { value: new Float32Array(PK_TINT) }, lev: { value: new Float32Array(PK_TINT).fill(-1e4) } };
  const frontUniform = { value: 1e6 };            // ship x forward of which the bow is crushed away (a stem strike)
  // the aperture in the stern frame where the centre screw turns: cut out of the drawn shell only (the physics hull,
  // fitted to her hydrostatics, has none)
  const AP = VS.STERN.aperture, apUniform = { value: new THREE.Vector4(AP.x0, AP.x1, AP.z0, AP.z1) };
  const hullXray = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { uLevels: levelUniform, uBulk: { value: bulkX }, uCamY: { value: 10 }, uTime: { value: 0 }, uFront: frontUniform, uAp: apUniform,
      uPkBox: pkTint.box, uPkSide: pkTint.side, uPkLev: pkTint.lev },
    vertexShader: `
      varying vec3 vL; varying vec3 vW; varying vec3 vN; varying vec3 vV;
      void main(){ vL = position; vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); vV = normalize(cameraPosition - w.xyz); gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: GLSL_COMMON + `
      uniform float uLevels[64]; uniform float uBulk[15]; uniform float uCamY; uniform float uTime; uniform float uFront; uniform vec4 uAp;
      uniform vec4 uPkBox[${PK_TINT}]; uniform float uPkSide[${PK_TINT}]; uniform float uPkLev[${PK_TINT}];
      varying vec3 vL; varying vec3 vW; varying vec3 vN; varying vec3 vV;
      /* wake: seaZ */ float seaZ(float x, float ys){ return 0.0; } /* wake end */
      void main(){
        float x = vL.x; float zs = vL.y; float ys = -vL.z;
        float sz = seaZ(x, ys);                                             // the sea against her here (site/parts/26_wake_seams.js; nought without it)
        if (x > uFront) discard;
        if (x > uAp.x && x < uAp.y && zs > uAp.z && zs < uAp.w) discard;   // the aperture the centre screw turns in
        int k = 0; for (int i = 0; i < 15; i++) { if (x < uBulk[i]) k = i + 1; }
        float eD = DECKE + sheer(x);
        int side = ys >= 0.0 ? 0 : 1; int layer = zs < eD ? 0 : 1;
        int n = (k * 2 + side) * 2 + layer;
        float lev = -1e4; for (int i = 0; i < 64; i++) { if (i == n) lev = uLevels[i]; }
        // inside the walls of a pocket that holds water, its own level, not its space's (G7, W6: the core keeps its water
        // apart); a pocket with none leaves the space's
        for (int j = 0; j < ${PK_TINT}; j++) {
          vec4 pb = uPkBox[j]; float ps = uPkSide[j];
          if (uPkLev[j] > -1e3 && x >= pb.x && x <= pb.y && zs >= pb.z && zs <= pb.w && (ps > 1.5 || abs(ps - float(side)) < 0.5)) lev = uPkLev[j];
        }
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
        float wl = exp(-abs(vW.y - sz) * 3.2);
        col += vec3(0.30, 0.88, 1.0) * wl * 1.1; a = max(a, wl * 0.75);
        bool through = (uCamY > 0.0 && vW.y < sz) || (uCamY < 0.0 && vW.y > sz);
        if (through) { float dep = clamp(abs(vW.y - sz) / 40.0, 0.0, 1.0); col = mix(col, vec3(0.03, 0.12, 0.19), 0.45 + 0.4 * dep); a *= (0.9 - 0.45 * dep); }
        gl_FragColor = vec4(col, a);
      }`,
  });
  // her paint (site/topsides.js N.strake, N.sheerLine, N.boot): the antifouling under a line straight amidships and
  // rising to the ends [bet], the black, the yellow sheer line under her white top strake [bet: its depth], her decks'
  // planking on the hull's top (the forecastle, B deck, the wells, the poop) [read: unpainted yellow pine]
  const HULL_PAINT = `
    const float STRAKE = ${TS.N.strake.toFixed(3)}; const float SLW = ${TS.N.sheerLine.toFixed(3)};
    const float BOOTZ = ${TS.N.boot.z.toFixed(3)}; const float BOOTRISE = ${TS.N.boot.rise.toFixed(3)}; const float BOOTFROM = ${TS.N.boot.from.toFixed(2)};
    float bootZ(float x){ return BOOTZ + BOOTRISE * smoothstep(BOOTFROM, XFP, abs(x)); }
    float sheerLineZ(float x){ return DECKB + sheer(x) - STRAKE; }
  `;
  const hullSolid = new THREE.ShaderMaterial({
    uniforms: { uCamY: { value: 10 }, uSun: { value: new THREE.Vector3(-0.45, 0.7, 0.55).normalize() }, uFront: frontUniform, uAp: apUniform },
    vertexShader: `varying vec3 vL; varying vec3 vW; varying vec3 vN; void main(){ vL = position; vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: GLSL_COMMON + HULL_PAINT + `
      uniform float uCamY; uniform vec3 uSun; uniform float uFront; uniform vec4 uAp; varying vec3 vL; varying vec3 vW; varying vec3 vN;
      /* wake: seaZ */ float seaZ(float x, float ys){ return 0.0; } /* wake end */
      void main(){
        float zs = vL.y; float x = vL.x;
        float sz = seaZ(x, -vL.z);                                          // the sea against her here (site/parts/26_wake_seams.js; nought without it)
        if (x > uFront) discard;
        if (x > uAp.x && x < uAp.y && zs > uAp.z && zs < uAp.w) discard;
        float line = sheerLineZ(x);
        vec3 base = zs < bootZ(x) ? vec3(0.42, 0.10, 0.07) : vec3(0.035, 0.037, 0.04);
        if (zs > line + 0.5 * SLW) base = vec3(0.86, 0.85, 0.81);
        else if (zs > line - 0.5 * SLW) base = vec3(0.78, 0.62, 0.24);
        if (zs > zTopF(x) - 0.03) base = vec3(0.62, 0.53, 0.38);
        float l = 0.35 + 0.65 * max(dot(normalize(vN), uSun), 0.0);
        vec3 col = base * l + vec3(0.02, 0.03, 0.04);
        if (vW.y < sz) { float dep = clamp((sz - vW.y) / 40.0, 0.0, 1.0); col = mix(col, vec3(0.01, 0.06, 0.09), 0.25 + 0.6 * dep); }
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
    for (const sd of [1, -1]) along((x) => { const zt = C.zTopAt(x); const b = hullHB(x, zt - 0.001); return b > 0.05 ? [x, zt, -sd * b] : null; });
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
        const z = zlo + (zc - zlo) * j / N, w = C.halfBreadth(x, z, ship.hull);
        pos.push(x, z, w, x, z, -w);    // three local: z = -y  (w -> starboard side first)
        if (j < N) { const a = j * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      const mat = new THREE.ShaderMaterial(Object.assign({}, bulkMatBase, {
        uniforms: { uF: { value: new THREE.Vector4(-1e4, -1e4, -1e4, -1e4) }, uA: { value: new THREE.Vector4(-1e4, -1e4, -1e4, -1e4) }, uCamY: { value: 10 }, uFloor: { value: G.tankTop } },
      }));
      const m = new THREE.Mesh(g, mat); m.renderOrder = 3; shipGroup.add(m); bulkMeshes.push(m);
      const wc = C.halfBreadth(x, zc - 0.001, ship.hull);
      const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute([x, zc, -wc, x, zc, wc], 3));
      const top = S.sim ? S.sim.bulkTop[b] : bh.top;
      const line = new THREE.Line(lg, new THREE.LineBasicMaterial({ color: top === 'E' ? 0xe0b15a : (top === 'D' ? 0x8fd3c9 : 0xdbe6ef), transparent: true, opacity: 0.95, depthWrite: false }));
      line.renderOrder = 8; line.userData.base = line.material.color.getHex(); shipGroup.add(line); bulkTopLines.push(line);
      const lab = makeLabel(bh.id, top === 'E' ? '#e0b15a' : (top === 'D' ? '#8fd3c9' : '#dbe6ef'));
      lab.position.set(x, zc + 3.2, 0); shipGroup.add(lab); bulkLabels.push(lab);
    });
  }

  // ---- her topsides: the Boat deck and its houses, A and B decks, the wells, forecastle and poop, funnels, masts,
  // rigging, davits and the dome covers, from site/topsides.js (sourced numbers; its builders' typed arrays). Visual only:
  // nothing here is read by the model. One mesh per colour class (their userData.solid the colour, userData.kind what it
  // is; the funnels' black tops capOnly as before), the windows and the davits' arms instanced, the edges (X-ray), rails
  // and rigging as three sets of lines. The davits' arms swing out with the boats (sim.people, read only) and a dome's
  // glass is gone once the model says it has given way (C.stairState, read only).
  const superGroup = new THREE.Group(); shipGroup.add(superGroup);
  const superFaces = [], superEdges = [];
  const topsides = (() => {
    const T = TS.built(), K = TS.COLORS;
    const local = (p) => { const o = new Float32Array(p.length); for (let i = 0; i < p.length; i += 3) { o[i] = p[i]; o[i + 1] = p[i + 2]; o[i + 2] = -p[i + 1]; } return o; };   // ship frame -> three local
    const geoOf = (d) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(local(d.pos), 3)); g.setIndex(new THREE.BufferAttribute(d.idx, 1)); g.computeVertexNormals(); return g; };
    const face = (geo, color, kind, opts) => {
      const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial(Object.assign({ color, transparent: true, opacity: 0.05, depthWrite: false }, opts || {})));
      m.userData.solid = color; m.userData.kind = kind; m.renderOrder = 5; superGroup.add(m); superFaces.push(m);
      return m;
    };
    const faces = {};
    for (const [k, kind] of [['white', 'house'], ['deck', 'deck'], ['grey', 'roof'], ['dark', 'roof'], ['black', 'black'], ['buff', 'funnel'], ['cap', 'cap'], ['mast', 'mast']]) {
      if (!T.faces[k].idx.length) continue;
      faces[k] = face(geoOf(T.faces[k]), K[k], kind);
    }
    if (faces.cap) faces.cap.userData.capOnly = true;
    // the windows: one quad instanced at each [appearance: dark glass; lit at night by the Night look's glow]
    const NW = T.windows.length / 7, win = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshLambertMaterial({ color: K.window, transparent: true, opacity: 0.05, depthWrite: false }), NW);
    {
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3(), z1 = new THREE.Vector3(0, 0, 1), n = new THREE.Vector3();
      for (let i = 0; i < NW; i++) {
        const w = T.windows.subarray(i * 7, i * 7 + 7);
        p.set(w[0], w[2], -w[1]); n.set(w[3], 0, -w[4]).normalize(); q.setFromUnitVectors(z1, n); s.set(w[5], w[6], 1);
        win.setMatrixAt(i, m4.compose(p, q, s));
      }
      win.instanceMatrix.needsUpdate = true;
    }
    win.userData.solid = K.window; win.userData.kind = 'window'; win.renderOrder = 5; superGroup.add(win); superFaces.push(win);
    // the davits' arms: two to each boat under davits, instanced; swung out with her (the people reader's states)
    const BPp = window.TitanicPeople, armGeo = (() => { const a = TS.davitArm(); const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(local(a.pos), 3)); g.setIndex(new THREE.BufferAttribute(a.idx, 1)); g.computeVertexNormals(); return g; })();
    const armBoats = [];                            // { i (the reader's boat), type, x (her davits), side, pivot }
    if (BPp) BPp.BOATS.forEach((b, i) => {
      if (b.type !== 'lifeboat' && b.type !== 'cutter') return;
      const dv = TS.davitsOf(BPp.STATION[i].x), side = b.side === 'P' ? 1 : -1;
      for (const [x, dx] of [[dv.fwd, -0.16], [dv.aft, 0.16]]) {   // a twin frame carries two quadrants, one each way [read]
        const d = T.davits.find(q => Math.abs(q.x - x) < 1e-9 && q.side === side);
        armBoats.push({ i, type: b.type, side, pivot: [d.pivot[0] + dx, d.pivot[1], d.pivot[2]] });
      }
    });
    const arms = new THREE.InstancedMesh(armGeo, new THREE.MeshLambertMaterial({ color: K.arm, transparent: true, opacity: 0.05, depthWrite: false, side: THREE.DoubleSide }), Math.max(1, armBoats.length));
    arms.count = armBoats.length; arms.userData.solid = K.arm; arms.userData.kind = 'davit'; arms.renderOrder = 5; superGroup.add(arms); superFaces.push(arms);
    let armsKey = '';
    const mA = new THREE.Matrix4(), mR = new THREE.Matrix4(), mS = new THREE.Matrix4();
    function setArms(sim) {                         // only when a boat's arms change: in, or swung out
      const P = sim && sim.people, key = armBoats.map(a => TS.armsOut(a.type, P ? P.boats[a.i].state : 'covered') ? 1 : 0).join('');
      if (key === armsKey) return; armsKey = key;
      armBoats.forEach((a, k) => {
        const out = key[k] === '1', ang = (out ? TS.ARM.outDeg : TS.ARM.inDeg) * D2R;
        // the arm reaches along +y (to port) in its frame, three local -z: mirrored for starboard; leant outboard (to port,
        // three local -z, by turning about her x axis the negative way) by its angle
        mS.makeScale(1, 1, a.side > 0 ? 1 : -1); mR.makeRotationX(a.side > 0 ? -ang : ang);
        mA.makeTranslation(a.pivot[0], a.pivot[2], -a.pivot[1]).multiply(mR).multiply(mS);
        arms.setMatrixAt(k, mA);
      });
      arms.instanceMatrix.needsUpdate = true;
    }
    setArms(null);
    // her twenty boats stowed as they lay at 11:40 pm, drawn when there is no watch (a damage preset: site/parts/50_boats.js
    // draws none there); on a watch the part's own boats are hers and these are hidden, so none is ever drawn twice. The
    // part's shapes and sizes [appearance: a half-ellipsoid hull, white, a canvas cover at the gunwale; a folded
    // collapsible a canvas-coloured slab], at the people reader's stations (site/topsides.js stowedBoats)
    const stowed = (() => {
      const g = new THREE.Group(); superGroup.add(g);
      const list = BPp ? TS.stowedBoats(BPp) : [];
      const hull = new THREE.SphereGeometry(1, 18, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2); hull.scale(0.5, 1, 0.5); hull.translate(0, 1, 0);
      const cover = new THREE.CircleGeometry(1, 24); cover.rotateX(-Math.PI / 2); cover.scale(0.485, 1, 0.485); cover.translate(0, 1, 0);
      const merged = (() => {                     // the unit boat (length, depth and beam 1; keel at 0): hull and cover, coloured by vertex
        const parts = [[hull, 0xe9e4d8], [cover, 0x9c8a66]], c = new THREE.Color();
        let nv = 0, ni = 0; for (const [gg] of parts) { nv += gg.attributes.position.count; ni += gg.index.count; }
        const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), col = new Float32Array(nv * 3), idx = new Uint32Array(ni);
        let ov = 0, oi = 0;
        for (const [gg, hex] of parts) {
          const n = gg.attributes.position.count, I = gg.index.array; c.setHex(hex);
          pos.set(gg.attributes.position.array, ov * 3); nor.set(gg.attributes.normal.array, ov * 3);
          for (let i = 0; i < n; i++) { col[(ov + i) * 3] = c.r; col[(ov + i) * 3 + 1] = c.g; col[(ov + i) * 3 + 2] = c.b; }
          for (let i = 0; i < I.length; i++) idx[oi + i] = I[i] + ov;
          ov += n; oi += I.length;
        }
        const out = new THREE.BufferGeometry();
        out.setAttribute('position', new THREE.BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
        out.setAttribute('color', new THREE.BufferAttribute(col, 3)); out.setIndex(new THREE.BufferAttribute(idx, 1));
        return out;
      })();
      const open = list.filter(b => !b.folded), fold = list.filter(b => b.folded);
      const mB = new THREE.InstancedMesh(merged, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), Math.max(1, open.length));
      const mF = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), new THREE.MeshLambertMaterial({ color: 0xb5a37c }), Math.max(1, fold.length));
      const m4 = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3();
      open.forEach((b, k) => mB.setMatrixAt(k, m4.compose(p.set(b.x, b.z, -b.y), q, s.set(b.L, b.D, b.B))));
      fold.forEach((b, k) => mF.setMatrixAt(k, m4.compose(p.set(b.x, b.z, -b.y), q, s.set(b.L, 0.32, b.B))));
      mB.count = open.length; mF.count = fold.length; mB.instanceMatrix.needsUpdate = mF.instanceMatrix.needsUpdate = true;
      g.add(mB); g.add(mF);
      return { group: g, list, open: mB, folded: mF };
    })();
    // her name and her port across the counter: TITANIC over LIVERPOOL, in the yellow of her sheer line [read: colour
    // guide; the photographs of her stern; appearance: the letters' face, size and place, on the black just under the
    // line], on a strip laid on the drawn shell round the stern; not drawn in the X-ray look
    const lettering = (() => {
      const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 256;
      const g2 = cv.getContext('2d'); g2.fillStyle = '#d0a640'; g2.textAlign = 'center'; g2.textBaseline = 'middle';
      g2.font = '700 116px Georgia, "Times New Roman", serif'; g2.fillText('T I T A N I C', 512, 74);
      g2.font = '700 70px Georgia, "Times New Roman", serif'; g2.fillText('L I V E R P O O L', 512, 192);
      const tex = new THREE.CanvasTexture(cv); tex.anisotropy = 4;
      const zl = TS.sheerLineZ(G.xAP - G.sternOverhang), z0 = zl - 2.15, z1 = zl - 0.25, L = 13.0, xe = C.xAft(z1);
      const ds = []; for (let k = 0; k <= 60; k++) ds.push(9 * Math.pow(k / 60, 2));            // dense at the end
      const zm = (z0 + z1) / 2, side = ds.map(d => [xe + d, TS.hullDraw(xe + d, zm)]);
      const arc = side.slice(1).reverse().map(([x, y]) => [x, y]).concat([[xe, 0]]).concat(side.slice(1).map(([x, y]) => [x, -y]));   // port to starboard
      const s = [0]; for (let i = 1; i < arc.length; i++) s.push(s[i - 1] + Math.hypot(arc[i][0] - arc[i - 1][0], arc[i][1] - arc[i - 1][1]));
      const sc = s[arc.findIndex(p => p[1] === 0)], pos = [], uv = [], idx = [];
      const at = (x, yS, z) => { const y = Math.sign(yS) * (TS.hullDraw(x, z) + 0.03); return [x, z, -y]; };   // three local
      let n = 0;
      for (let i = 0; i < arc.length; i++) {
        const u = (s[i] - sc) / L + 0.5; if (u < -0.02 || u > 1.02) continue;
        const [x, y] = arc[i], yy = y === 0 ? 0 : y;
        const pb = yy === 0 ? [xe - 0.03, z0, 0] : at(x, yy, z0), pt = yy === 0 ? [xe - 0.03, z1, 0] : at(x, yy, z1);
        pos.push(...pb, ...pt); uv.push(u, 0, u, 1);
        if (n) { const a = (n - 1) * 2; idx.push(a, a + 2, a + 3, a, a + 3, a + 1); }
        n++;
      }
      // and her name on each bow, under the sheer line abaft the anchors [read: colour guide; appearance: its place and
      // size]: the canvas's upper line only; reading from forward to aft on the port side, aft to forward to starboard
      for (const sg of [1, -1]) {
        const xa = 113.0, xb = 121.0, zb0 = TS.sheerLineZ(117) - 1.35, zb1 = TS.sheerLineZ(117) - 0.2, base = pos.length / 3, K = 16;
        for (let k = 0; k <= K; k++) {
          const t = k / K, x = sg > 0 ? xb + (xa - xb) * t : xa + (xb - xa) * t;
          const yb = sg * (TS.hullDraw(x, zb0) + 0.03), yt = sg * (TS.hullDraw(x, zb1) + 0.03);
          pos.push(x, zb0, -yb, x, zb1, -yt); uv.push(t, 0.52, t, 1);
          if (k) { const a = base + (k - 1) * 2; idx.push(a, a + 2, a + 3, a, a + 3, a + 1); }
        }
      }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: tex, transparent: true, opacity: 0.05, alphaTest: 0.25, depthWrite: false, side: THREE.DoubleSide }));
      m.userData.solid = 0xd0a640; m.userData.kind = 'lettering'; m.renderOrder = 5; superGroup.add(m); superFaces.push(m);
      return m;
    })();
    // the dome covers where the model has its staircases (C.STAIRS: one source of truth): their glass one mesh, each
    // dome a range of its triangles, emptied when the model says that dome has given way (its curb and frame stay)
    const glass = T.glass.idx.length ? face(geoOf(T.glass), K.glass, 'glass') : null, glassIdx = glass ? glass.geometry.index.array.slice() : null;
    const domes = T.domes.map(d => Object.assign({ broken: false }, d));
    // lines: the X-ray look's edges; rails and stanchions (and the domes' frames); the rigging
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x7fb2d4, transparent: true, opacity: 0.32, depthWrite: false });
    const lineGeo = (a) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(local(a), 3)); return g; };
    const edges = new THREE.LineSegments(lineGeo(T.edges), edgeMat); edges.renderOrder = 7; superGroup.add(edges); superEdges.push(edges);
    const rails = new THREE.LineSegments(lineGeo(T.rails), new THREE.LineBasicMaterial({ color: K.rail, transparent: true, opacity: 0.85, depthWrite: false }));
    const rigging = new THREE.LineSegments(lineGeo(T.rigging), new THREE.LineBasicMaterial({ color: K.rigging, transparent: true, opacity: 0.8, depthWrite: false }));
    rails.renderOrder = rigging.renderOrder = 6; superGroup.add(rails); superGroup.add(rigging);
    // ---- funnel 1 at the surface (G15; Z1's note q23, B.1 and B.6). It "collapsed under its own weight" into the sea as
    // the water reached its base and the bridge went under, about 02:15 to 02:17, minutes before the break (Fitch, Layton
    // and Wormstedt 2012, pp. 232-233, and Barczewski 2006, through Wikipedia; Mengot: "inundated and collapsed";
    // Lightoller) [read]. Here it goes on the first frame the model's sea stands at its seat's forward edge, her own pose
    // saying when (C.worldZ) [derived: the moment], falling forward and to starboard [read: the usual reading; port is
    // also argued] over ONE.fall s of her time and out of sight [appearance: the falling]; its smoke and steam stop with
    // it; a new run stands it again. Its triangles and lines are built.parts.funnels[0]'s (above its flange, with its
    // shrouds and jackstay), emptied from her sets as a dome's glass is, and drawn falling by a group of their own.
    const ONE = { fall: 12, tilt: 80 * D2R, drop: 8 };
    const one = (() => {
      const Pf = T.parts && T.parts.funnels[0], f1 = T.funnels[0], Nf = TS.N.funnel;
      if (!Pf || !f1) return null;
      const sets = Object.assign({}, faces, { edges, rigging }), saved = {};
      const subOf = (o, ranges) => {             // the set's own attributes, drawn by an index of these ranges alone
        const src = o.geometry, g = new THREE.BufferGeometry(), idx = [], a = src.index ? src.index.array : null;
        for (const name in src.attributes) g.setAttribute(name, src.attributes[name]);
        for (const [p, q] of ranges) for (let t = p; t < q; t++) { if (o.isLineSegments) idx.push(2 * t, 2 * t + 1); else idx.push(a[3 * t], a[3 * t + 1], a[3 * t + 2]); }
        g.setIndex(idx); return g;
      };
      // where it falls from: its seat's forward-starboard point; the axis it turns about (her frame to three's: (x, z, -y))
      const c = Math.SQRT1_2, sx = f1.x + Nf.a * c, sy = -Nf.b * c, sz = f1.seatZ, fx = f1.x + Nf.a, at = new THREE.Vector3(sx, sz, -sy);
      const axis = new THREE.Vector3(c, 0, -c).normalize();   // up x (forward, to starboard), in three's axes
      const pv = new THREE.Group(); pv.position.copy(at); pv.visible = false; superGroup.add(pv);
      const objs = [];
      for (const k of ['buff', 'cap']) if (sets[k] && Pf.at[k]) {   // the falling funnel: its faces (its shrouds part from it)
        const o = sets[k], ob = new THREE.Mesh(subOf(o, Pf.at[k]), o.material);
        ob.position.copy(at).negate(); ob.frustumCulled = false; ob.renderOrder = o.renderOrder; pv.add(ob); objs.push({ ob, o });
      }
      const st = { sim: null, t0: null, gone: false };
      function empty(on) {                       // its triangles and lines out of her sets (on), or back as built
        for (const k in Pf.at) {
          const o = sets[k]; if (!o) continue;
          if (o.isLineSegments) {                // a line set has no index: its segments folded onto their first ends
            const pa = o.geometry.attributes.position, a = pa.array;
            if (!saved[k]) saved[k] = a.slice();
            for (const [p, q] of Pf.at[k]) for (let s = p; s < q; s++) for (let j = 0; j < 3; j++) a[6 * s + 3 + j] = on ? a[6 * s + j] : saved[k][6 * s + 3 + j];
            pa.needsUpdate = true;
          } else {
            const ia = o.geometry.index, a = ia.array;
            if (!saved[k]) saved[k] = a.slice();
            for (const [p, q] of Pf.at[k]) for (let t = 3 * p; t < 3 * q; t++) a[t] = on ? 0 : saved[k][t];
            ia.needsUpdate = true;
          }
        }
        st.gone = on;
      }
      return {
        down: () => st.t0 !== null,
        state: () => ({ fell: st.t0, gone: st.gone, falling: pv.visible, seat: [fx, 0, sz] }),
        frame(sim) {
          if (sim !== st.sim) { if (st.gone) empty(false); st.sim = sim; st.t0 = null; pv.visible = false; }
          if (!sim) return;
          if (st.t0 === null && !gone(sim) && C.worldZ(C.frameOf(sim), fx, 0, sz) - (S.post || 0) <= 0) { st.t0 = sim.t; empty(true); }
          if (st.t0 === null) return;
          const u = Math.min(1, Math.max(0, (sim.t - st.t0) / ONE.fall)), e = u * u;   // it leans, then goes
          pv.visible = u < 1;
          pv.quaternion.setFromAxisAngle(axis, ONE.tilt * e);
          pv.position.copy(at); pv.position.y -= ONE.drop * e;
          for (const { ob, o } of objs) { ob.material = o.material; ob.visible = o.visible; }
        },
      };
    })();
    // the lines' colours in each look: faint in X-ray, painted in the solid look, starlit in the Night look [appearance]
    const LOOK = { xray: { rail: [0x7fb2d4, 0.16], rig: [0x7fb2d4, 0.22] }, solid: { rail: [K.rail, 0.85], rig: [K.rigging, 0.8] }, night: { rail: [0x262a2f, 0.7], rig: [0x15181b, 0.6] } };
    let lineLook = '';
    function setLineLook(look) {
      if (look === lineLook) return; lineLook = look;
      const L = LOOK[look] || LOOK.xray;
      rails.material.color.setHex(L.rail[0]); rails.material.opacity = L.rail[1];
      rigging.material.color.setHex(L.rig[0]); rigging.material.opacity = L.rig[1];
    }
    function frame(sim) {                           // per frame: the arms from the boats, the domes from the model, funnel 1
      setArms(sim);
      if (one) one.frame(sim);
      stowed.group.visible = !(sim && sim.night);   // on a watch the boats part draws hers

      if (glass && C.stairState) {
        const st = sim && sim.stairOps ? C.stairState(sim) : [];
        let changed = false;
        for (const o of domes) {
          const s = st.find(q => q.id === o.id), br = !!(s && s.state === 2);
          if (br === o.broken) continue;
          o.broken = br; changed = true;
          const a = glass.geometry.index.array; for (let i = o.t0 * 3; i < o.t1 * 3; i++) a[i] = br ? 0 : glassIdx[i];
        }
        if (changed) glass.geometry.index.needsUpdate = true;
      }
    }
    return { T, faces, win, arms, armBoats, stowed, glass, domes, edges, rails, rigging, one, setLineLook, lineLook: () => lineLook, frame };
  })();

  // ---- free surfaces of the flood water (one quad per space, clipped to the hull in the shader)
  const fsMat = (n) => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: {
      uInv: { value: new THREE.Matrix4() }, uHB: { value: hbTex }, uTime: { value: 0 }, uCamY: { value: 10 },
      uXa: { value: 0 }, uXf: { value: 0 }, uSide: { value: (n >> 1) & 1 }, uLayer: { value: n & 1 }, uFloor: { value: 0 },
      uTop: { value: 1e4 },                        // a pocket's top (G7); a space's is E deck (1e4: no clip of its own)
    },
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: GLSL_COMMON + `
      uniform mat4 uInv; uniform sampler2D uHB; uniform float uTime; uniform float uCamY;
      uniform float uXa; uniform float uXf; uniform float uSide; uniform float uLayer; uniform float uFloor; uniform float uTop;
      varying vec3 vW;
      void main(){
        vec3 L = (uInv * vec4(vW, 1.0)).xyz;
        float x = L.x; float zs = L.y; float ys = -L.z;
        if (x < uXa || x > uXf) discard;
        if ((uSide < 0.5 && ys < -0.05) || (uSide > 0.5 && uSide < 1.5 && ys > 0.05)) discard;   // 2: both sides (a pocket)
        float eD = DECKE + sheer(x);
        if (uLayer < 0.5) { if (zs < uFloor - 0.05 || zs > min(eD, uTop) + 0.05) discard; }
        else { if (zs < eD - 0.05 || zs > tierTopF(x, abs(ys)) + 0.05) discard; }   // up into the tiers over her, where the model has them
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
  // The core's pockets (W6's bunker, G7's tank) keep their water apart from sim.vol and from every space's level; it is
  // counted in their spaces by C.spaceWater. The page draws each where it stands, never spread over its space (G7's
  // adopters; QC B-3): a free surface of its own while it fills, over its own footprint, at the core's own law for its
  // level (pocketHead's: from its floor up in proportion to vol / cap, the world's level through its middle); a box of
  // its own among the columns; its own fill in its compartment on the damage diagram. pkDrawn: what was drawn (the tests)
  const POCKETS = 4;
  const pkFs = [], pkDrawn = { surfaces: [], columns: [], diagram: [] };
  for (let j = 0; j < POCKETS; j++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), fsMat(0));
    m.renderOrder = 4; m.visible = false; m.frustumCulled = false; scene.add(m); pkFs.push(m);
  }
  const pocketFill = (k) => k.z0 + (k.z1 - k.z0) * Math.min(1, k.vol / k.cap);   // its fill's height in her frame (the core's law)

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
  // a pocket among the columns: one box over its footprint, as wide as makes its full height hold its capacity, so that
  // the box's volume is the water it holds (a pocket is no column of the core's: its law is its fill)
  const pkCol = new THREE.Group(); pkCol.visible = false; shipGroup.add(pkCol);
  const pkBoxes = [];
  for (let j = 0; j < POCKETS; j++) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0x9fe3ff, transparent: true, opacity: 0.55, depthWrite: false }));
    b.renderOrder = 4; b.visible = false; b.frustumCulled = false; pkCol.add(b); pkBoxes.push(b);
  }

  // ---- hull openings
  const holeGroup = new THREE.Group(); shipGroup.add(holeGroup);
  const holeGeo = new THREE.SphereGeometry(1, 12, 8);
  const jetGeo = new THREE.ConeGeometry(0.5, 1, 12, 1, true).translate(0, 0.5, 0);
  const holeObjs = new Map();
  function clearHoles() {                         // a new simulation numbers its openings from 1 again: start clean
    for (const [, o] of holeObjs) { holeGroup.remove(o.dot); holeGroup.remove(o.jet); o.dot.material.dispose(); o.jet.material.dispose(); }
    holeObjs.clear();
  }
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

  // ---- the stern gear: three screws turned by the model's shafts, the rudder at the model's angle, the bossings and
  // shafts. Shapes and places from site/visuals.js (the builder's figures; R1's measurements; the bets it names).
  const stern = (() => {
    const g = new THREE.Group(); shipGroup.add(g);
    const meshOf = (d, mat) => {
      const bg = new THREE.BufferGeometry();
      bg.setAttribute('position', new THREE.BufferAttribute(d.pos, 3)); bg.setIndex(new THREE.BufferAttribute(d.idx, 1)); bg.computeVertexNormals();
      return new THREE.Mesh(bg, mat);
    };
    const steel = new THREE.MeshLambertMaterial({ color: 0x7d8a94 });
    const screw = (spec, x, y, z, left) => {
      const geo = VS.propeller(spec), mat = new THREE.MeshPhongMaterial({ color: 0xb48c50, specular: 0x6a4c28, shininess: 50, side: THREE.DoubleSide });
      const spin = new THREE.Group();
      spin.add(meshOf(geo, mat));
      spin.add(new THREE.Mesh(new THREE.LatheGeometry(VS.hubProfile(geo).map(([r, a]) => new THREE.Vector2(r, a)), 28).rotateZ(-Math.PI / 2), mat));
      const disc = new THREE.Mesh(new THREE.RingGeometry(geo.rHub, geo.R, 64, 1).rotateY(Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0xd2ad74, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
      disc.visible = false;
      const holder = new THREE.Group(); holder.add(spin); holder.add(disc);
      if (left) holder.scale.z = -1;                 // a left-handed screw is the mirror image of a right-handed one
      holder.position.copy(SX(x, y, z)); g.add(holder);
      return { holder, spin, disc, mat, geo, left, fade: 1 };
    };
    const W = VS.STERN.wing, Cn = VS.STERN.centre, R = VS.STERN.rudder;
    // port (left-handed: outward turning), centre (right-handed [bet]), starboard (right-handed)
    const screws = [screw(W, W.x, W.y, W.z, true), screw(Cn, Cn.x, 0, Cn.z, false), screw(W, W.x, -W.y, W.z, false)];
    const rudderMat = new THREE.MeshLambertMaterial({ color: 0x62211a, side: THREE.DoubleSide });
    const rudder = new THREE.Group(); rudder.position.copy(SX(R.x, 0, R.heel)); g.add(rudder);
    const rg = VS.rudderGeometry(); rudder.add(meshOf(rg, rudderMat));
    const stockLen = R.top - rg.top + 1;
    const stock = new THREE.Mesh(new THREE.CylinderGeometry(R.stockR, R.stockR, stockLen, 16), rudderMat);
    stock.position.y = rg.top - 1 + stockLen / 2; rudder.add(stock);
    // bossings: see-through in the X-ray hull, painted like her bottom in the solid one (applyLook)
    const bossX = new THREE.MeshBasicMaterial({ color: 0x9fc6e0, transparent: true, opacity: 0.10, depthWrite: false, side: THREE.DoubleSide });
    const bossS = new THREE.MeshLambertMaterial({ color: 0x5f1c13, side: THREE.DoubleSide });
    const hubFwd = VS.hubProfile(screws[0].geo)[0][1];
    const bossings = [1, -1].map(sgn => { const m = meshOf(VS.bossing(sgn, hubFwd), bossX); m.renderOrder = 5; g.add(m); return m; });
    const shaft = (a, b, r) => {
      const A = SX(a[0], a[1], a[2]), B = SX(b[0], b[1], b[2]), d = B.clone().sub(A), len = d.length();
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 14), steel);
      m.position.copy(A).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
      g.add(m); return m;
    };
    const shafts = [
      shaft([W.xEngine, W.yEngine, W.z], [W.x + 0.3, W.y, W.z], VS.STERN.shaftR.wing),
      shaft([Cn.xTurbine, 0, Cn.zTurbine], [Cn.x + 0.3, 0, Cn.z], VS.STERN.shaftR.centre),
      shaft([W.xEngine, -W.yEngine, W.z], [W.x + 0.3, -W.y, W.z], VS.STERN.shaftR.wing),
    ];
    return { g, screws, rudder, bossings, bossX, bossS, shafts };
  })();
  // per frame: each screw at the revolutions its shaft has turned, plus the part of a step not yet taken (smooth at 1x);
  // a screw turning more than about 40 degrees a frame cannot be drawn honestly, so its blades fade into a disc
  const theta = [0, 0, 0];                        // the shafts' angles drawn this frame [port, centre, starboard], rad
  function updateStern(sim) {
    const m = sim.mo, lag = S.playing && !gone(sim) ? S.acc : 0, n = m ? [m.nP, m.nC, m.nS] : [0, 0, 0];
    for (let k = 0; k < 3; k++) {
      const sc = stern.screws[k], om = n[k] * TAU / 60;
      theta[k] = (S.screwRev[k] - Math.floor(S.screwRev[k])) * TAU + om * lag;
      sc.spin.rotation.x = theta[k];
      const perFrame = Math.abs(om * S.simDtFrame) / D2R, op = Math.max(0, Math.min(1, (50 - perFrame) / 20));
      if (op !== sc.fade) {
        const was = sc.mat.transparent; sc.fade = op;
        sc.mat.transparent = op < 0.999; sc.mat.opacity = op; sc.mat.depthWrite = op >= 0.999;
        if (was !== sc.mat.transparent) sc.mat.needsUpdate = true;
        sc.disc.visible = op < 0.999; sc.disc.material.opacity = 0.5 * (1 - op);
      }
    }
    stern.rudder.rotation.y = m ? m.del : 0;      // + = to starboard: the trailing edge to starboard
    if (engines.g.visible) engines.update(theta);
  }

  // ---- navigation lights, by the 1910 rules: each shows only to an eye inside its arc (site/visuals.js), so what the
  // camera sees is the rule: red, green and white from ahead, green and white from her starboard bow, the stern light
  // alone from astern, nothing of her own from her bridge
  const glowTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64; const g2 = c.getContext('2d');
    const gr = g2.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.16, 'rgba(255,255,255,0.9)'); gr.addColorStop(0.42, 'rgba(255,255,255,0.22)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g2.fillStyle = gr; g2.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  })();
  const navLights = VS.LIGHTS.map(L => {
    const mk = (size) => {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: L.color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: false }));
      s.scale.set(size, size, 1); s.renderOrder = 11; s.visible = false; return s;
    };
    const glow = mk(0.05), core = mk(0.013), streak = mk(1);
    glow.position.copy(SX(L.at[0], L.at[1], L.at[2])); core.position.copy(glow.position);
    shipGroup.add(glow); shipGroup.add(core);
    streak.center.set(0.5, 1); streak.scale.set(0.006, 0.085, 1); scene.add(streak);   // its reflection, hanging from the sea under it
    return { L, glow, core, streak, factor: 0, bearing: 0 };
  });
  const camLocal = new THREE.Vector3(), lightW = new THREE.Vector3();
  let lightsLive = () => true;                    // the dynamos: replaced when the lights can fail
  function updateLights() {
    camLocal.copy(camera.position).applyMatrix4(invM);       // the eye in the ship's frame: x forward, y to port = -z
    const fade = S.lights && lightsLive() ? lightsFade(S.sim) : 0;
    ports.mark(circuitsOut(S.sim));                // D97: the ports whose sections' fuses have blown, from the circuits' record
    ports.mat.uniforms.uOn.value = lightsFade(S.sim);
    ports.mat.uniforms.uScale.value = renderer.domElement.height / (2 * Math.tan(camera.fov * D2R / 2));
    for (const o of navLights) {
      const b = VS.bearingFrom(o.L, camLocal.x, -camLocal.z), on = fade > 0 && (!o.L.optional || S.sternLight);
      const f = on ? VS.lightFactor(o.L, b) * fade : 0;
      o.bearing = b; o.factor = f;
      o.glow.visible = o.core.visible = f > 0.002;
      o.glow.material.opacity = 0.85 * f; o.core.material.opacity = f;
      o.glow.getWorldPosition(lightW);
      o.streak.visible = f > 0.002 && lightW.y > 0.5 && camera.position.y > 0.5;
      if (o.streak.visible) { o.streak.position.set(lightW.x, 0.02, lightW.z); o.streak.material.opacity = 0.3 * f; }
    }
  }

  // ---- the watch: what lies on the sea (the berg, her track) and what the ice did to the plating
  // An earth-fixed group: its local x is north and z east, in metres from E0 (the berg's first place). Every frame
  // it is turned by her heading and moved by her position, so the ship can stay at the scene's origin.
  const earth = new THREE.Group(); earth.visible = false; scene.add(earth);
  const E0 = { x: 0, y: 0 };
  const TRACK_N = 3000, trackPos = new Float32Array(TRACK_N * 3);
  const trackGeo = new THREE.BufferGeometry(); trackGeo.setAttribute('position', new THREE.BufferAttribute(trackPos, 3)); trackGeo.setDrawRange(0, 0);
  const track = new THREE.Line(trackGeo, new THREE.LineBasicMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0.55, depthWrite: false }));
  track.frustumCulled = false; track.renderOrder = 2; earth.add(track);
  const courseGeo = new THREE.BufferGeometry(); courseGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
  const course = new THREE.Line(courseGeo, new THREE.LineBasicMaterial({ color: 0xe0b15a, transparent: true, opacity: 0.30, depthWrite: false }));
  course.frustumCulled = false; course.renderOrder = 2; earth.add(course);
  let trackN = 0, trackLast = null;
  let berg = null;                                // { group, above, under, edge, crushed, depths, out, R }
  function disposeBerg() {
    if (!berg) return;
    earth.remove(berg.group);
    berg.group.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    berg = null;
  }
  // The berg. Above the water its shape is drawn from the night's seed and is appearance only; below, the three rings
  // of the spur are the outline the physics uses (core/encounter.js), redrawn when the hull crushes them.
  function buildBerg(sim) {
    disposeBerg();
    const e = sim.enc, sp = sim.night.spec, R = e.Rmax, NB = 360, P = e.P;   // drawn segments; the physics' outline is finer (P3c)
    const rnd = NT.rng((Math.imul(((sp.berg && sp.berg.seed) || 1) >>> 0, 2654435761) ^ 0x5bd1e995) >>> 0);
    const amp = [], ph = [];
    for (let n = 0; n < 4; n++) { amp.push(0.045 * rnd() / (1 + 0.6 * n)); ph.push(rnd() * 6.2832); }
    const out = (th) => { let s = 0; for (let n = 0; n < 4; n++) s += amp[n] * Math.cos((n + 2) * th + ph[n]); return 0.9 * R * (1 + s); };
    const H = (sp.berg && sp.berg.h) || 20, th0 = rnd() * 6.2832, k1 = 0.18 + 0.22 * rnd(), th1 = th0 + 2.2 + 1.6 * rnd();
    const c1 = [k1 * R * Math.cos(th0), k1 * R * Math.sin(th0)], c2 = [0.4 * R * Math.cos(th1), 0.4 * R * Math.sin(th1)], s1 = 0.36 * R, s2 = 0.27 * R, low = 0.35 + 0.3 * rnd();
    const hgt = (x, z, rho) => {
      const p1 = Math.exp(-((x - c1[0]) * (x - c1[0]) + (z - c1[1]) * (z - c1[1])) / (2 * s1 * s1));
      const p2 = low * Math.exp(-((x - c2[0]) * (x - c2[0]) + (z - c2[1]) * (z - c2[1])) / (2 * s2 * s2));
      return (2.5 + (H - 2.5) * Math.max(p1, p2)) * (1 - Math.pow(rho, 10)) * (0.9 + 0.2 * rnd());
    };
    const group = new THREE.Group();
    // above the water
    {
      const NA = 56, rings = [1, 0.96, 0.84, 0.66, 0.46, 0.26, 0.1], pos = [], idx = [];
      for (let i = 0; i < rings.length; i++) for (let j = 0; j < NA; j++) {
        const th = j / NA * 6.2832, r = rings[i] * out(th), x = r * Math.cos(th), z = r * Math.sin(th);
        pos.push(x, i === 0 ? -0.6 : hgt(x, z, rings[i]), z);
      }
      pos.push(0.5 * c1[0], hgt(0.5 * c1[0], 0.5 * c1[1], 0), 0.5 * c1[1]);
      const apex = rings.length * NA;
      for (let i = 0; i < rings.length - 1; i++) for (let j = 0; j < NA; j++) {
        const a = i * NA + j, b = i * NA + (j + 1) % NA, c = a + NA, d = b + NA;
        idx.push(a, c, b, b, c, d);
      }
      for (let j = 0; j < NA; j++) idx.push((rings.length - 1) * NA + j, apex, (rings.length - 1) * NA + (j + 1) % NA);
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      const mat = new THREE.MeshLambertMaterial({ color: 0xa9bfce, emissive: 0x111c26, flatShading: true, side: THREE.DoubleSide, transparent: true, opacity: 0 });
      const mesh = new THREE.Mesh(g, mat); mesh.renderOrder = 2; group.add(mesh);
      berg = { group, above: mesh };
    }
    // below the water: the body, then the spur's three bands (the physics' own outline), then the foot
    {
      const draft = P.mass / (C.RHO * Math.PI * R * R), d = P.depths, hB = 0.5 * P.h;
      const nR = 2 + 2 * d.length + 2, pos = new Float32Array((nR * NB + 1) * 3), idx = [];
      for (let i = 0; i < nR - 1; i++) for (let j = 0; j < NB; j++) {
        const a = i * NB + j, b = i * NB + (j + 1) % NB, c = a + NB, dd = b + NB;
        idx.push(a, c, b, b, c, dd);
      }
      for (let j = 0; j < NB; j++) idx.push((nR - 1) * NB + j, nR * NB, (nR - 1) * NB + (j + 1) % NB);
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
      const mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0x4fa6cc, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
      mesh.renderOrder = 2; mesh.frustumCulled = false; group.add(mesh);
      const eg = new THREE.BufferGeometry(); eg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NB * 3), 3));
      const edge = new THREE.LineLoop(eg, new THREE.LineBasicMaterial({ color: 0x9fe4ff, transparent: true, opacity: 0, depthWrite: false }));
      edge.renderOrder = 3; edge.frustumCulled = false; group.add(edge);
      Object.assign(berg, { under: mesh, edge, crushed: -1, out, R, draft, depths: d, hB, nR, NB });
    }
    earth.add(group);
    updateBergRings(sim);
  }
  function updateBergRings(sim) {
    const e = sim.enc; if (!berg || berg.crushed === e.crushed) return;
    berg.crushed = e.crushed;
    const NB = berg.NB, pos = berg.under.geometry.attributes.position.array, ep = berg.edge.geometry.attributes.position.array, d = berg.depths, R = berg.R;
    // each drawn segment shows the least radius of the physics' nodes it covers (the outline is far finer than drawn)
    const step = Math.max(1, Math.floor(e.rIce[0].length / NB));
    const rAt = (arr, j) => { let r = Infinity; for (let q = j * step, q1 = Math.min(arr.length, q + step); q < q1; q++) if (arr[q] < r) r = arr[q]; return r; };
    for (let j = 0; j < NB; j++) {
      const a = (j + 0.5) / NB * 6.283185307179586 - Math.PI, ca = Math.cos(a), sa = Math.sin(a), ro = berg.out(a);
      const put = (i, r, y) => { const o = (i * NB + j) * 3; pos[o] = r * ca; pos[o + 1] = y; pos[o + 2] = r * sa; };
      put(0, ro, 0); put(1, ro, -(d[0] - berg.hB));
      for (let k = 0; k < d.length; k++) { const r = rAt(e.rIce[k], j); put(2 + 2 * k, r, -(d[k] - berg.hB)); put(3 + 2 * k, r, -(d[k] + berg.hB)); }
      const dl = d[d.length - 1] + berg.hB, rl = Math.min(rAt(e.rIce[d.length - 1], j), 0.8 * R);
      put(2 + 2 * d.length, rl, -(dl + 0.3 * Math.max(1, berg.draft - dl))); put(3 + 2 * d.length, 0.5 * R, -Math.max(berg.draft, dl + 2));
      const r0 = rAt(e.rIce[0], j); ep[j * 3] = r0 * ca; ep[j * 3 + 1] = -(d[0] - berg.hB); ep[j * 3 + 2] = r0 * sa;
    }
    const o = berg.nR * NB * 3; pos[o] = 0; pos[o + 1] = -Math.max(berg.draft, d[d.length - 1] + berg.hB + 2); pos[o + 2] = 0;
    berg.under.geometry.attributes.position.needsUpdate = true; berg.edge.geometry.attributes.position.needsUpdate = true;
  }
  // dents that let no water in (amber) and the stations whose seams opened (red), one point per metre of hull
  const dentGeo = new THREE.BufferGeometry();
  dentGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(1800 * 3), 3));
  dentGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(1800 * 3), 3));
  dentGeo.setDrawRange(0, 0);
  const dentPts = new THREE.Points(dentGeo, new THREE.PointsMaterial({ size: 4, sizeAttenuation: false, vertexColors: true, depthTest: false, transparent: true, opacity: 0.9 }));
  dentPts.renderOrder = 9; dentPts.frustumCulled = false; shipGroup.add(dentPts);
  let dentSeen = -2;
  function updateDents(sim) {
    const e = sim.enc;
    if (dentSeen === e.tLast) return;
    dentSeen = e.tLast;
    const pos = dentGeo.attributes.position.array, col = dentGeo.attributes.color.array, xFront = e.xStem - e.bow;
    let n = 0;
    for (let sd = 0; sd < 2; sd++) {
      const D = sd === 0 ? e.stbd : e.port;
      for (let k = 0; k < e.bands.length; k++) {
        const B = e.bands[k], dn = D[k].dent;
        for (let i = 0; i < B.n && n < 1800; i++) {
          if (dn[i] <= 0.005 || B.xs[i] > xFront) continue;
          const y = sd === 0 ? -(B.hb[i] + 0.05) : B.hb[i] + 0.05, o = n * 3, open = dn[i] > (B.dt ? B.dt[i] : e.P.dTear);   // P3b: each station's tearing dent
          pos[o] = B.xs[i]; pos[o + 1] = B.zs[i]; pos[o + 2] = -y;
          col[o] = 1; col[o + 1] = open ? 0.36 : 0.71; col[o + 2] = open ? 0.24 : 0.28;
          n++;
        }
      }
    }
    dentGeo.setDrawRange(0, n); dentGeo.attributes.position.needsUpdate = true; dentGeo.attributes.color.needsUpdate = true;
  }
  function resetWatchScene(sim) {                 // a new watch: the earth's origin at the berg, an empty track, her course drawn
    const m = sim.mo, b = sim.enc.berg, c = Math.cos(m.psi), s = Math.sin(m.psi), cp = courseGeo.attributes.position.array;
    E0.x = b.X; E0.y = b.Y; trackN = 0; trackLast = null; trackGeo.setDrawRange(0, 0);
    cp[0] = m.X - E0.x; cp[1] = 0.12; cp[2] = m.Y - E0.y; cp[3] = m.X + 4000 * c - E0.x; cp[4] = 0.12; cp[5] = m.Y + 4000 * s - E0.y;
    courseGeo.attributes.position.needsUpdate = true;
    dentSeen = -2; dentGeo.setDrawRange(0, 0); frontUniform.value = 1e6;
    buildBerg(sim);
    wake.reset(); washFx.reset(); smoke.reset(); steam.reset();
    earth.visible = true;
  }

  // ---- the wake, laid on the sea where she was (site/visuals.js): the white ribbon from her stern (from her bow when she
  // goes astern), Kelvin's arms and crests constructed from her bow's own path, a mark where each order was given, and
  // the bow wave. What is a law and what is only appearance: docs/BRAINSTORM_screws_rudder_wake_lights_v1, section 3.6.
  const wake = (() => {
    const W = VS.WAKE, CAP = W.keep, buf = VS.wakeBuffer();
    const T_FULL = 2.02e6;                          // total thrust at Full ahead, N (the model's: 2 x 0.659 + 0.703 MN)
    // the ribbon: three vertices a sample (port edge, centre, starboard edge); position = (north, side, east); the width
    // grows and the foam fades in the shader, so a laid sample is never touched again
    const rgeo = new THREE.BufferGeometry();
    const rpos = new Float32Array(CAP * 9), racr = new Float32Array(CAP * 6), rbirth = new Float32Array(CAP * 3), rspd = new Float32Array(CAP * 3), rstr = new Float32Array(CAP * 3);
    const ridx = new Uint32Array(CAP * 12);
    rgeo.setAttribute('position', new THREE.BufferAttribute(rpos, 3)); rgeo.setAttribute('aA', new THREE.BufferAttribute(racr, 2));
    rgeo.setAttribute('aBirth', new THREE.BufferAttribute(rbirth, 1)); rgeo.setAttribute('aSpeed', new THREE.BufferAttribute(rspd, 1));
    rgeo.setAttribute('aStr', new THREE.BufferAttribute(rstr, 1)); rgeo.setIndex(new THREE.BufferAttribute(ridx, 1)); rgeo.setDrawRange(0, 0);
    const rmat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,   // seen from above or below, whichever way she turns
      uniforms: { uTime: { value: 0 }, uW0: { value: W.halfWidth }, uL: { value: G.LBP }, uLife: { value: W.life }, uSlick: { value: W.slickLife }, uExp: { value: W.widthExp } },
      vertexShader: `
        attribute vec2 aA; attribute float aBirth; attribute float aSpeed; attribute float aStr;
        uniform float uTime; uniform float uW0; uniform float uL; uniform float uLife; uniform float uSlick; uniform float uExp;
        varying float vA; varying float vSide;
        void main(){
          float age = max(0.0, uTime - aBirth);
          float w = uW0 * pow(1.0 + age * aSpeed / uL, uExp);
          vec3 p = vec3(position.x + aA.x * position.y * w, 0.05, position.z + aA.y * position.y * w);
          vA = aStr * (exp(-age / uLife) + 0.22 * exp(-age / uSlick)) * step(aBirth, uTime + 0.01);
          vSide = position.y;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }`,
      fragmentShader: `
        varying float vA; varying float vSide;
        void main(){ float a = vA * (1.0 - abs(vSide)); gl_FragColor = vec4(vec3(0.58, 0.74, 0.88) * a * 0.55, 1.0); }`,
    });
    const ribbon = new THREE.Mesh(rgeo, rmat); ribbon.frustumCulled = false; ribbon.renderOrder = 2; earth.add(ribbon);
    let nIdx = 0, laid = 0, dirty = false;
    function put(i) {                               // write sample i's three vertices, and the quads joining it to i - 1
      const astern = buf.u[i] < 0, x = astern ? W.xBow : W.xStern, P = VS.pointAt(buf, i, x), Vv = VS.velAt(buf, i, x);
      const U = Math.sqrt(Vv[0] * Vv[0] + Vv[1] * Vv[1]) || 1, ax = -Vv[1] / U, ay = Vv[0] / U;
      const T = buf.T[i], str = Math.min(1, 0.5 * Math.min(1, (U / 11.6) * (U / 11.6)) + 0.5 * Math.min(1, Math.abs(T) / T_FULL * (T < 0 ? 0.7 : 1)));
      for (let s = 0; s < 3; s++) {
        const v = i * 3 + s;
        rpos[v * 3] = P[0] - E0.x; rpos[v * 3 + 1] = s - 1; rpos[v * 3 + 2] = P[1] - E0.y;
        racr[v * 2] = ax; racr[v * 2 + 1] = ay; rbirth[v] = buf.t[i]; rspd[v] = U; rstr[v] = str;
      }
      if (i > 0 && buf.seg[i] === buf.seg[i - 1]) {
        const a = (i - 1) * 3, b = i * 3;
        for (const q of [a, b, a + 1, a + 1, b, b + 1, a + 1, b + 1, a + 2, a + 2, b + 1, b + 2]) ridx[nIdx++] = q;
      }
    }
    function rebuild() { nIdx = 0; for (let i = 0; i < buf.n; i++) put(i); laid = buf.n; dirty = true; }
    function flush() {
      const at = rgeo.attributes;
      for (const k of ['position', 'aA', 'aBirth', 'aSpeed', 'aStr']) at[k].needsUpdate = true;
      rgeo.index.needsUpdate = true; rgeo.setDrawRange(0, nIdx);
    }
    // Kelvin's arms and crests, and the order marks: line segments, recomputed a few times a second
    const LCAP = 7000, lpos = new Float32Array(LCAP * 6), lcol = new Float32Array(LCAP * 6), lgeo = new THREE.BufferGeometry();
    lgeo.setAttribute('position', new THREE.BufferAttribute(lpos, 3)); lgeo.setAttribute('color', new THREE.BufferAttribute(lcol, 3)); lgeo.setDrawRange(0, 0);
    const lines = new THREE.LineSegments(lgeo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    lines.frustumCulled = false; lines.renderOrder = 2; earth.add(lines);
    const marks = [];                               // [X0, Y0, X1, Y1, kind]
    let marksSeen = 0, lastWaves = -1, arms = null, crest = [];
    function drawWaves(tNow) {
      let k = 0;
      const seg = (a0, a1, b0, b1, s, c) => {
        if (k >= LCAP || s < 0.01) return; const o = k * 6;
        lpos[o] = a0 - E0.x; lpos[o + 1] = 0.07; lpos[o + 2] = a1 - E0.y; lpos[o + 3] = b0 - E0.x; lpos[o + 4] = 0.07; lpos[o + 5] = b1 - E0.y;
        for (let j = 0; j < 2; j++) { lcol[o + 3 * j] = c[0] * s; lcol[o + 3 * j + 1] = c[1] * s; lcol[o + 3 * j + 2] = c[2] * s; }
        k++;
      };
      if (buf.n > 2) {
        arms = VS.kelvinArms(buf, tNow, arms);
        for (const side of ['port', 'stbd']) { const p = arms[side]; for (let i = 1; i < p.length; i++) if (p[i][3] === p[i - 1][3]) seg(p[i - 1][0], p[i - 1][1], p[i][0], p[i][1], 0.5 * (p[i][2] + p[i - 1][2]) * 0.6, [0.55, 0.78, 0.95]); }
        for (let n = 1; n <= W.crests; n++) {
          crest = VS.kelvinCrest(buf, tNow, n, 48, crest);
          for (let j = 1; j < crest.length; j++) { const a = crest[j - 1], b = crest[j]; if (a && b) seg(a[0], a[1], b[0], b[1], 0.5 * (a[2] + b[2]) * 0.42, [0.45, 0.68, 0.88]); }
        }
      }
      for (const mk of marks) seg(mk[0], mk[1], mk[2], mk[3], 0.9, mk[4] === 'helm' ? [0.88, 0.69, 0.35] : [0.56, 0.83, 0.79]);
      lgeo.setDrawRange(0, k * 2); lgeo.attributes.position.needsUpdate = true; lgeo.attributes.color.needsUpdate = true;
    }
    // the bow wave: white water each side of the stem, longer and brighter with her speed squared [appearance]
    const NBW = 12, bpos = new Float32Array(2 * (NBW + 1) * 2 * 3), bcol = new Float32Array(bpos.length), bgeo = new THREE.BufferGeometry(), bidx = [];
    for (let s = 0; s < 2; s++) for (let k = 0; k < NBW; k++) { const a = (s * (NBW + 1) + k) * 2; bidx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    bgeo.setAttribute('position', new THREE.BufferAttribute(bpos, 3)); bgeo.setAttribute('color', new THREE.BufferAttribute(bcol, 3)); bgeo.setIndex(bidx);
    const bow = new THREE.Mesh(bgeo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    bow.frustumCulled = false; bow.renderOrder = 2; bow.visible = false; scene.add(bow);
    const bv = new THREE.Vector3();
    function drawBow(sim, M, F) {
      const m = sim.mo, U = Math.sqrt(m.u * m.u + m.v * m.v), q = m.u > 0 ? Math.min(1.3, (U / 11.6) * (U / 11.6)) : 0;
      bow.visible = q > 0.01; if (!bow.visible) return;
      const Lb = 0.16 * G.LBP * q, wb = 3.2 * q;
      for (let s = 0; s < 2; s++) for (let k = 0; k <= NBW; k++) {
        const x0 = C.xFwd(9) - 0.4 - Lb * k / NBW, zw = -(F.R20 * x0 + F.tz) / F.R22, hb = C.halfBreadth(x0, Math.max(0.5, zw), ship.hull) + 0.15, sg = s ? -1 : 1;
        for (let e = 0; e < 2; e++) {
          const y = sg * (hb + e * wb * Math.pow(1 - k / NBW, 0.7)), o = ((s * (NBW + 1) + k) * 2 + e) * 3;
          bv.set(x0, zw, -y).applyMatrix4(M); bpos[o] = bv.x; bpos[o + 1] = 0.06; bpos[o + 2] = bv.z;
          const a = q * (1 - k / NBW) * (e ? 0.25 : 0.8); bcol[o] = 0.85 * a; bcol[o + 1] = 0.93 * a; bcol[o + 2] = a;
        }
      }
      bgeo.attributes.position.needsUpdate = true; bgeo.attributes.color.needsUpdate = true;
    }
    return {
      buf, marks,
      reset() { buf.n = 0; for (const k of ['t', 'X', 'Y', 'psi', 'u', 'v', 'r', 'T', 'seg']) buf[k].length = 0; buf.lastT = -1e9; buf.segId++; nIdx = 0; laid = 0; dirty = false; marks.length = 0; marksSeen = 0; rgeo.setDrawRange(0, 0); lgeo.setDrawRange(0, 0); lastWaves = -1; bow.visible = false; },
      afterStep(sim) {                                // called after each step of a watch
        const before = buf.n;
        if (VS.wakeTake(buf, sim)) {
          if (buf.n < before) rebuild();              // the record dropped its older half: lay it all again
          else { put(buf.n - 1); laid = buf.n; dirty = true; }
        }
        const log = sim.night.log;
        while (marksSeen < log.length) {
          const o = log[marksSeen++], m = sim.mo, c = Math.cos(m.psi), s = Math.sin(m.psi), x = m.u < 0 ? W.xBow : W.xStern;
          if (o.type === 'telegraph') { S.gongs++; gong(); }   // the engine room answers every engine order
          const X = m.X + x * c, Y = m.Y + x * s, hw = 1.7 * W.halfWidth;
          marks.push([X + hw * s, Y - hw * c, X - hw * s, Y + hw * c, o.type]);
        }
      },
      frame(sim, tNow, M, F, now) {
        rmat.uniforms.uTime.value = tNow;
        if (dirty) { flush(); dirty = false; }
        if (now - lastWaves > 66) { lastWaves = now; drawWaves(tNow); }
        drawBow(sim, M, F);
      },
      hide() { bow.visible = false; },
      ribbon, lines, bow,
    };
  })();

  // ---- the wash a wing screw throws forward when it goes astern (V4: site/visuals.js), a foam strip along each side
  // from the screw to where the wash has crept
  const washFx = (() => {
    const st = [VS.washState(), VS.washState()], NS = 16, D = VS.STERN.wing.D;   // port, starboard
    const pos = new Float32Array(2 * (NS + 1) * 2 * 3), col = new Float32Array(pos.length), idx = [], geo = new THREE.BufferGeometry();
    for (let s = 0; s < 2; s++) for (let k = 0; k < NS; k++) { const a = (s * (NS + 1) + k) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.setIndex(idx);
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    mesh.frustumCulled = false; mesh.renderOrder = 2; mesh.visible = false; scene.add(mesh);
    const v = new THREE.Vector3(), front = [0, 0];
    return {
      st, front,
      reset() { st[0] = VS.washState(); st[1] = VS.washState(); this.st = st; front[0] = front[1] = 0; mesh.visible = false; },
      afterStep(sim) { const m = sim.mo; VS.washStep(st[0], sim.t, DT, m.u, m.TP, D); VS.washStep(st[1], sim.t, DT, m.u, m.TS, D); },
      frame(sim, M, F) {
        let any = false;
        for (let s = 0; s < 2; s++) {
          const [fr, str] = VS.washFront(st[s], D), sg = s ? -1 : 1, x0 = VS.STERN.wing.x, x1 = Math.min(C.xFwd(9) - 2, x0 + fr);
          front[s] = fr; if (fr > 1) any = true;
          for (let k = 0; k <= NS; k++) {
            const x = x0 + (x1 - x0) * k / NS, zw = -(F.R20 * x + F.tz) / F.R22, hb = C.halfBreadth(x, Math.max(0.5, zw), ship.hull) + 0.3;
            for (let e = 0; e < 2; e++) {
              const y = sg * (hb + e * (2.5 + 2.5 * (1 - k / NS))), o = ((s * (NS + 1) + k) * 2 + e) * 3;
              v.set(x, zw, -y).applyMatrix4(M); pos[o] = v.x; pos[o + 1] = 0.07; pos[o + 2] = v.z;
              const a = fr > 1 ? str * (0.3 + 0.7 * (1 - k / NS)) * (e ? 0.25 : 0.85) : 0;
              col[o] = 0.72 * a; col[o + 1] = 0.86 * a; col[o + 2] = a;
            }
          }
        }
        mesh.visible = any;
        if (any) { geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true; }
      },
    };
  })();

  // ---- the engines and the turbine, in the X-ray hull (V5): cranks, connecting rods, crossheads, piston rods and
  // pistons at the shafts' own angles; the turbine's rotor with the centre shaft (site/visuals.js ENGINE)
  const UPV = new THREE.Vector3(0, 1, 0), pinV = new THREE.Vector3(), xhV = new THREE.Vector3(), dV = new THREE.Vector3();
  const engines = (() => {
    const E = VS.ENGINE, g = new THREE.Group(); shipGroup.add(g);
    const steel = new THREE.MeshLambertMaterial({ color: 0x9aa6b0 }), dark = new THREE.MeshLambertMaterial({ color: 0x55606a });
    const glass = new THREE.MeshBasicMaterial({ color: 0x9fc6e0, transparent: true, opacity: 0.13, depthWrite: false, side: THREE.DoubleSide });
    const r = E.stroke / 2, L = E.rod * r, len = 4 * E.pitch + 1.2;
    const sets = [1, -1].map(sgn => {             // port (y > 0), starboard
      const y = sgn * E.y, z3 = -y, parts = [];
      const bed = new THREE.Mesh(new THREE.BoxGeometry(len, 0.9, 3.4), dark); bed.position.copy(SX(E.xMid, y, E.zShaft - 1.1)); g.add(bed);
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, len, 12).rotateZ(Math.PI / 2), steel); shaft.position.copy(SX(E.xMid, y, E.zShaft)); g.add(shaft);
      E.cyl.forEach((cy, k) => {
        const x = E.xMid + (1.5 - k) * E.pitch, R = cy.bore * 0.0254 / 2;
        const zc0 = E.zShaft + (L - r) + E.pistonRod - 0.4, zc1 = E.zShaft + (L + r) + E.pistonRod + 0.5;
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.08, R + 0.08, zc1 - zc0, 28, 1, true), glass); barrel.position.copy(SX(x, y, (zc0 + zc1) / 2)); barrel.renderOrder = 5; g.add(barrel);
        const mk = (geo, mat) => { const m = new THREE.Mesh(geo, mat); g.add(m); return m; };
        parts.push({
          x, z3, crank: E.cranks[k] * D2R, name: cy.name,
          piston: mk(new THREE.CylinderGeometry(R * 0.96, R * 0.96, 0.3, 28), steel), prod: mk(new THREE.CylinderGeometry(0.12, 0.12, E.pistonRod, 8), steel),
          xhead: mk(new THREE.BoxGeometry(0.55, 0.4, 0.7), dark), crod: mk(new THREE.BoxGeometry(0.24, L, 0.34), steel), web: mk(new THREE.BoxGeometry(0.4, r + 0.7, 1.1), dark),
        });
      });
      return { y, sgn, parts };
    });
    const T = E.turbine, rotor = new THREE.Group(); rotor.position.copy(SX(T.x, 0, T.z)); g.add(rotor);
    rotor.add(new THREE.Mesh(new THREE.CylinderGeometry(T.rotorD / 2, T.rotorD / 2, T.rotorL, 36).rotateZ(Math.PI / 2), steel));
    for (let i = 0; i < 12; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(T.rotorL * 0.96, 0.12, 0.3), dark), a = i / 12 * TAU; s.position.set(0, (T.rotorD / 2 + 0.03) * Math.cos(a), (T.rotorD / 2 + 0.03) * Math.sin(a)); s.rotation.x = a; rotor.add(s); }
    const casing = new THREE.Mesh(new THREE.CylinderGeometry(T.rotorD / 2 + 0.75, T.rotorD / 2 + 0.75, T.rotorL + 1.2, 32, 1, true).rotateZ(Math.PI / 2), glass);
    casing.position.copy(rotor.position); casing.renderOrder = 5; g.add(casing);
    function update(theta) {                      // theta: the shafts' angles [port, centre, starboard], rad, + ahead
      for (const set of sets) {
        const th = set.sgn > 0 ? -theta[0] : theta[2];   // looking forward the starboard engine turns clockwise, the port engine the other way
        for (const p of set.parts) {
          // the port set is the starboard's mirror image (V8): its crank offsets negated, so its pistons rise in the same order
          const a = th + (set.sgn > 0 ? -p.crank : p.crank), hx = E.zShaft + VS.pistonLift(a);
          pinV.set(p.x, E.zShaft + r * Math.cos(a), p.z3 + r * Math.sin(a)); xhV.set(p.x, hx, p.z3);
          p.xhead.position.copy(xhV); p.prod.position.set(p.x, hx + E.pistonRod / 2, p.z3); p.piston.position.set(p.x, hx + E.pistonRod, p.z3);
          p.crod.position.copy(pinV).add(xhV).multiplyScalar(0.5); p.crod.quaternion.setFromUnitVectors(UPV, dV.copy(xhV).sub(pinV).normalize());
          p.web.position.set(p.x, E.zShaft + 0.5 * r * Math.cos(a), p.z3 + 0.5 * r * Math.sin(a)); p.web.rotation.x = a;
        }
      }
      rotor.rotation.x = theta[1];
    }
    return { g, sets, rotor, update };
  })();

  // ---- her ports and windows, and their going out (V6: site/visuals.js). Points in her own frame. D97 (the coordinator's
  // ruling, 2026-11-23; U3's lights, version 2): a port is lit at the plant's level (uOn, lightsFade) while its section's
  // circuit holds. A section is one of G1's (core/readers/circuits.js: rooms.js's slabs; Circuits.sectionOf). A port goes
  // dark for good:
  //   - when its section's fuses blow, the sea inside the section (aOut, marked from the circuits' own record, with the
  //     time they blew);
  //   - when the dynamos stop (uOn);
  //   - in the fall, by its piece's own supply (fallFrame: sim.fall.lights).
  // The sea outside does not put it out: under the sea a lit port is drawn dimmer and blue-green [appearance], as the page
  // drew it before NH15's F6. The circuits: on a watch the reader keeps them (sim.circuits); on a preset the page steps its
  // own (Circuits.start and step, one state a run: circ)
  const CI = window.TitanicCircuits || null;
  let circ = null;
  const ports = (() => {
    const P = VS.portholes(), n = P.length, arr = new Float32Array(n * 3), out = new Float32Array(n), outT = new Float64Array(n).fill(-1);
    const sec = Int32Array.from(P.map(p => (CI && CI.sectionOf ? CI.sectionOf(ship, p[0], p[1], p[2]) : -1)));   // each port's section, -1 in none
    P.forEach((p, i) => { arr[i * 3] = p[0]; arr[i * 3 + 1] = p[2]; arr[i * 3 + 2] = -p[1]; });
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(arr, 3)); geo.setAttribute('aOut', new THREE.BufferAttribute(out, 1));
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uOn: { value: 1 }, uScale: { value: 400 } },
      vertexShader: 'attribute float aOut; uniform float uScale; varying float vUnder; varying float vLit; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vUnder = w.y < 0.0 ? 1.0 : 0.0; vLit = aOut > 0.5 ? 0.0 : 1.0; vec4 mv = viewMatrix * w; gl_PointSize = clamp(0.9 * uScale / -mv.z, 1.2, 6.0); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform float uOn; varying float vUnder; varying float vLit; void main(){ vec2 d = gl_PointCoord - 0.5; float a = smoothstep(0.5, 0.0, length(d)); vec3 c = mix(vec3(1.0, 0.82, 0.5), vec3(0.25, 0.45, 0.55), vUnder); gl_FragColor = vec4(c * a * uOn * vLit * (1.0 - 0.6 * vUnder) * vec3(1.0, 0.4 + 0.6 * uOn, 0.25 + 0.75 * uOn), 1.0); }',
    });
    const pts = new THREE.Points(geo, mat); pts.renderOrder = 10; pts.frustumCulled = false; shipGroup.add(pts);
    let nOut = 0;
    return {
      pts, mat, n,
      reset() { out.fill(0); outT.fill(-1); nOut = 0; geo.attributes.aOut.needsUpdate = true; },
      // the circuits' record (outOf(j): when section j's fuses blew, or -1 while they hold): each port whose section has
      // blown is marked out, with that time
      mark(outOf) {
        if (!outOf || nOut >= n) return;
        let k = 0;
        for (let i = 0; i < n; i++) { if (out[i] || sec[i] < 0) continue; const t = outOf(sec[i]); if (t >= 0) { out[i] = 1; outT[i] = t; k++; } }
        if (k) { nOut += k; geo.attributes.aOut.needsUpdate = true; }
      },
      // for the tests (tools/visuals_site_test.js): how many are out, when each went, each one's section, the circuits marked
      outCount: () => nOut, outAt: (i) => outT[i], sectionOf: (i) => sec[i],
      circuits: () => (circ ? { out: circ.out, outs: circ.sections.map(s => s.out) } : null),
    };
  })();
  // the circuits' record in force: past the hand-over the fall's (its sections, kept on as her pieces flood; on a watch with
  // G1's reader), on a watch the reader's, on a preset the page's own
  function circuitsOut(sim) {
    const L = sim && sim.fall && sim.fall.lights;
    if (L && L.sections && L.sections.out) return (j) => L.sections.out[j];
    if (sim && sim.circuits && sim.circuits.sections) return (j) => sim.circuits.sections[j].out;
    if (circ && circ.sections) return (j) => circ.sections[j].out;
    return null;
  }
  // her lights burn while the dynamos run (core/systems.js: steam to drive them, and their flat dry); once they have
  // stopped they stay stopped; the lights go over three seconds
  // (Y4) the level follows the dynamos: all her light with the main sets, the emergency lights' share with the
  // emergency sets on D deck alone, none without either; each change fades over three seconds
  function lightsFade(sim) {
    const P = sim.plant;
    if (!P) return 1;
    if (S.lightsSim !== sim) { S.lightsSim = sim; S.lightsFrom = 1; S.lightsTo = 1; S.lightsT = -1e9; }
    const cur = S.lightsFrom + (S.lightsTo - S.lightsFrom) * Math.min(1, Math.max(0, (sim.t - S.lightsT) / 3));
    if (P.lights !== S.lightsTo) {
      const t0 = P.lights === 0 ? (P.events.dark !== undefined ? P.events.dark : sim.t) : (P.events.mainDark !== undefined ? P.events.mainDark : sim.t);
      S.lightsFrom = cur; S.lightsTo = P.lights; S.lightsT = t0;
      if (P.lights === 0) lightsOut(sim);          // recorded on its own step already, unless she went dark off frame()'s steps
      else toast('The main dynamos are lost: only her emergency lights burn', true);
    }
    return S.lightsFrom + (S.lightsTo - S.lightsFrom) * Math.min(1, Math.max(0, (sim.t - S.lightsT) / 3));
  }
  // her lights' failure, recorded on the step it happens (G3), at the plant's own time: frame() calls this after every
  // step of the model, before the parts' step hooks. The end card reads it, and is written on the founder flag's step,
  // before that frame is drawn: under load one frame's steps can carry her from the dark to the flag, so the drawing
  // (above) cannot be what records it
  function lightsOut(sim) {
    const P = sim.plant;
    if (!P) return;
    // NH15 F8: the emergency stage (Y4), recorded the same way: her main dynamos lost while the emergency sets on D deck
    // still light her (they share the steam, so only water at the main sets parts them: core/systems.js)
    if (P.lights > 0 && P.lights < 1 && S.lightsMainT < 0) {
      S.lightsMainT = P.events.mainDark !== undefined ? P.events.mainDark : sim.t;
      S.lightsMainWhy = P.el ? 'the main dynamos flooded' : 'the main dynamos stopped';
    }
    if (P.lights !== 0 || S.lightsFailT >= 0) return;
    S.lightsFailT = P.events.dark !== undefined ? P.events.dark : sim.t;
    S.lightsFailWhy = P.el && P.emWet ? 'the dynamos flooded' : (P.broken ? 'the steam mains broken' : 'no steam for the dynamos');
    toast('Her lights go out: ' + S.lightsFailWhy, true);
  }
  lightsLive = () => lightsFade(S.sim) > 0;

  // ---- funnel smoke (V7), laid on the air where she was: it trails her track, rising and spreading [appearance; the
  // night was calm, so the only wind is her own speed]. The fourth funnel was a ventilator: three smoke.
  // NH15 F7: each puff carries its funnel's share of the steam her fires raise (core/systems.js: P.gen, the coal burning,
  // the smoke's cause, shared among her boiler rooms as their lit furnaces burn, PLANT.rooms[k].lit x P.fires[k]). Each
  // funnel took the uptakes of two boiler rooms: the first 6 and 5, the second 4 and 3, the third 2 and 1 [read: Halpern,
  // core/readers/section.js]. A puff is drawn as dense as three times that share (a third of full firing draws as before)
  // [appearance]; a funnel whose share is under MIN sends none. Without a plant every funnel draws at a third, as before
  const smoke = (() => {
    const CAP = 900, MIN = 0.005, pos = new Float32Array(CAP * 3), birth = new Float32Array(CAP).fill(-1e9), dense = new Float32Array(CAP), geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('aBirth', new THREE.BufferAttribute(birth, 1)); geo.setAttribute('aDense', new THREE.BufferAttribute(dense, 1));
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, uniforms: { uTime: { value: 0 }, uScale: { value: 400 } },
      vertexShader: 'attribute float aBirth; attribute float aDense; uniform float uTime; uniform float uScale; varying float vA; void main(){ float age = max(0.0, uTime - aBirth); vec3 p = position + vec3(0.0, 0.45 * age, 0.0); vA = 0.22 * aDense * exp(-age / 110.0) * smoothstep(0.0, 4.0, age) * step(aBirth, uTime); vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_PointSize = clamp((6.0 + 0.35 * age) * uScale / -mv.z, 1.0, 120.0); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); float a = vA * smoothstep(0.5, 0.1, d); gl_FragColor = vec4(vec3(0.11, 0.105, 0.10), a); }',
    });
    const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.renderOrder = 3; earth.add(pts);
    let n = 0, last = -1e9, latest = null;
    const funnels = topsides.T.smoke;             // the three working funnels' top centres (site/topsides.js), ship frame
    const sent = [0, 0, 0];                       // puffs sent by each funnel this run (for the tests)
    function shares(sim) {                        // each funnel's share of the steam raised, from the plant's own figures
      const P = sim.plant, d = [0, 0, 0];
      if (!P || !SY) return [1 / 3, 1 / 3, 1 / 3];
      const R = SY.PLANT.rooms; let tot = 0;
      for (let k = 0; k < R.length; k++) { const v = R[k].lit * P.fires[k]; tot += v; d[k >> 1] += v; }
      for (let j = 0; j < 3; j++) d[j] = tot > 0 ? P.gen * d[j] / tot : 0;
      return d;
    }
    return {
      points: pts,                                  // what is drawn (N2: a part's look may recolour it, and restores it)
      funnels, MIN,
      count: () => Math.min(n, CAP),
      // for the tests (tools/visuals_site_test.js): the newest puffs (when, each funnel's share, which sent one and where it
      // is in the buffer) and each funnel's puffs this run
      latest: () => latest, sent: () => sent.slice(),
      reset() { birth.fill(-1e9); dense.fill(0); n = 0; last = -1e9; latest = null; sent.fill(0); geo.attributes.aBirth.needsUpdate = true; geo.attributes.aDense.needsUpdate = true; },
      afterStep(sim) {
        if (sim.t - last < 1 - 1e-9) return; last = sim.t;
        const m = sim.mo, c = Math.cos(m.psi), s = Math.sin(m.psi), F = C.frameOf(sim), gone1 = !!(topsides.one && topsides.one.down()), d = shares(sim);
        const rec = { t: sim.t, share: d, sent: [false, false, false], at: [-1, -1, -1] };
        funnels.forEach((f, j) => {                 // funnel 1 (the first) smokes no more once it has gone (G15)
          if ((j === 0 && gone1) || !(d[j] >= MIN)) return;
          const i = n % CAP; pos[i * 3] = m.X + f.x * c - E0.x; pos[i * 3 + 1] = C.worldZ(F, f.x, 0, f.z); pos[i * 3 + 2] = m.Y + f.x * s - E0.y; birth[i] = sim.t; dense[i] = Math.min(1.5, 3 * d[j]); n++;
          rec.sent[j] = true; rec.at[j] = i; sent[j]++;
        });
        latest = rec;
        geo.attributes.position.needsUpdate = true; geo.attributes.aBirth.needsUpdate = true; geo.attributes.aDense.needsUpdate = true;
      },
      frame(tNow) { mat.uniforms.uTime.value = tNow; mat.uniforms.uScale.value = renderer ? renderer.domElement.height / (2 * Math.tan(camera.fov * D2R / 2)) : 400; },
    };
  })();

  // ---- blowing off (Y1): while the safety valves lift (core/systems.js, P.blow: the steam made and not used) steam
  // jets from the escape pipes on the forward faces of the three working funnels [appearance: their place and the look]
  const steam = (() => {
    const CAP = 1600, pos = new Float32Array(CAP * 3), birth = new Float32Array(CAP).fill(-1e9), geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('aBirth', new THREE.BufferAttribute(birth, 1));
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, uniforms: { uTime: { value: 0 }, uScale: { value: 400 } },
      vertexShader: 'attribute float aBirth; uniform float uTime; uniform float uScale; varying float vA; void main(){ float age = max(0.0, uTime - aBirth); vec3 p = position + vec3(0.0, 2.6 * age - 0.04 * age * age, 0.0); vA = 0.35 * exp(-age / 9.0) * step(aBirth, uTime); vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_PointSize = clamp((2.5 + 0.9 * age) * uScale / -mv.z, 1.0, 90.0); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); float a = vA * smoothstep(0.5, 0.05, d); gl_FragColor = vec4(vec3(0.86, 0.9, 0.95), a); }',
    });
    const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.renderOrder = 3; earth.add(pts);
    let n = 0, last = -1e9;
    const pipes = topsides.T.steam;               // the escape pipes' mouths on the three working funnels (site/topsides.js)
    return {
      points: pts,
      pipes,
      count: () => Math.min(n, CAP),
      reset() { birth.fill(-1e9); n = 0; last = -1e9; geo.attributes.aBirth.needsUpdate = true; },
      afterStep(sim) {
        const P = sim.plant, m = sim.mo; if (!P || !m || !(P.blow > 0.02)) return;
        if (sim.t - last < 0.5 - 1e-9) return; last = sim.t;
        const c = Math.cos(m.psi), s = Math.sin(m.psi), k = 1 + Math.floor(3 * Math.min(1, P.blow)), F = C.frameOf(sim), gone1 = !!(topsides.one && topsides.one.down());
        pipes.forEach((f, q) => {                   // funnel 1's pipes (the first) blow no more once it has gone (G15)
          if (q === 0 && gone1) return;
          const z = C.worldZ(F, f.x, 0, f.z); for (let j = 0; j < k; j++) { const i = n % CAP; pos[i * 3] = m.X + f.x * c - E0.x; pos[i * 3 + 1] = z; pos[i * 3 + 2] = m.Y + f.x * s - E0.y; birth[i] = sim.t - 0.12 * j; n++; }
        });
        geo.attributes.position.needsUpdate = true; geo.attributes.aBirth.needsUpdate = true;
      },
      frame(tNow) { mat.uniforms.uTime.value = tNow; mat.uniforms.uScale.value = renderer ? renderer.domElement.height / (2 * Math.tan(camera.fov * D2R / 2)) : 400; },
    };
  })();
  // the roar of it: band-passed noise, its loudness following the steam blown off, under the sound switch
  let roarNode = null;
  function roar(level) {
    if (!audio) return;
    const on = $('snd').checked && S.playing && level > 0.02;
    try {
      if (!roarNode) {
        if (!on) return;
        const len = audio.sampleRate * 2, buf = audio.createBuffer(1, len, audio.sampleRate), d = buf.getChannelData(0);
        let seed = 12345; for (let i = 0; i < len; i++) { seed = (Math.imul(seed, 1103515245) + 12345) & 0x7fffffff; d[i] = seed / 0x3fffffff - 1; }
        const src = audio.createBufferSource(); src.buffer = buf; src.loop = true;
        const bp = audio.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 650; bp.Q.value = 0.6;
        const g = audio.createGain(); g.gain.value = 0;
        src.connect(bp); bp.connect(g); g.connect(audio.destination); src.start();
        roarNode = { src, g, level: 0 };
      }
      roarNode.level = on ? 0.06 * Math.min(1, level) : 0;
      roarNode.g.gain.setTargetAtTime(roarNode.level, audio.currentTime, 0.4);
    } catch (e) { /* no sound */ }
  }

  // ---- sound (V7): the telegraph's gong on every engine order, the engines' beat once a revolution while time runs
  // at about her own pace; all under the page's sound switch
  function gong() {
    if (!audio || !$('snd').checked) return;
    try {
      const t0 = audio.currentTime + 0.02;
      for (let i = 0; i < 2; i++) for (const [f, g, d] of [[660, 0.18, 1.1], [1320, 0.06, 0.6]]) {
        const o = audio.createOscillator(), v = audio.createGain(), t = t0 + i * 0.32;
        o.type = 'sine'; o.frequency.value = f; v.gain.setValueAtTime(0.0001, t); v.gain.exponentialRampToValueAtTime(g, t + 0.005); v.gain.exponentialRampToValueAtTime(0.0001, t + d);
        o.connect(v); v.connect(audio.destination); o.start(t); o.stop(t + d + 0.05);
      }
    } catch (e) { /* no sound */ }
  }
  function thump() {
    if (!audio || !$('snd').checked) return;
    try {
      const t = audio.currentTime + 0.01, o = audio.createOscillator(), v = audio.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(62, t); o.frequency.exponentialRampToValueAtTime(38, t + 0.18);
      v.gain.setValueAtTime(0.0001, t); v.gain.exponentialRampToValueAtTime(0.05, t + 0.01); v.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      o.connect(v); v.connect(audio.destination); o.start(t); o.stop(t + 0.25);
    } catch (e) { /* no sound */ }
  }

  // ===================================================================== camera control
  const ctl = { target: new THREE.Vector3(0, 8, 0), r: 420, theta: 0.77, phi: 1.33, goal: null, tx: 0 };
  // The page's orbiting views. A part adds its own (N2), placed by its 'camera' hook, and may give it three flags:
  //   look: true   it is looked about from, as the Bridge is: a drag turns the part's eye (the part's own handlers), and
  //                the page neither orbits nor pans nor zooms its idle camera, so Follow stays on
  //   fov: deg     its field of view, set when it is chosen (the page's own are 36 degrees)
  //   near: m      its camera's near plane while it is chosen (the page's own is 0.5 m; the fall sets its own)
  //   keep: true   a new watch keeps it, as it keeps the Bridge, where any other view is turned astern
  // and while she falls (the fall, fallFocus) two more: piece: the id of the piece it is with; focus(): a point of the
  // scene it is with instead, while that gives one (null: its piece)
  const VIEWS = {
    quarter: { r: 380, theta: 0.80, phi: 1.30 },
    profile: { r: 400, theta: 0.0, phi: 1.52 },
    below: { r: 330, theta: 0.55, phi: 1.98 },
    plan: { r: 430, theta: 0.0, phi: 0.12 },
    // from her starboard quarter, 14 degrees up, looking where she is going: with the offset in resize() the stage shows
    // her whole length above the Bridge and the sea out to 650 m ahead below the readouts (the farthest sighting is 595 m)
    astern: { r: 950, theta: -Math.PI / 2 + 0.16, phi: 1.331, tx: 200 },
    // the screws and the rudder: under water off her starboard quarter, looking at the stern gear
    stern: { r: 52, theta: -0.95, phi: 1.70, tx: -124, tz: 4.5 },
  };
  // the bridge: an eye on the navigating bridge, 1.75 m above the boat deck; dragging looks about
  const BRIDGE = { x: 75.2, yaw: 0, pitch: -0.035, fov: 58 };
  function setView(name) {
    S.view = name;
    if (name === 'bridge') { ctl.goal = null; BRIDGE.yaw = 0; BRIDGE.pitch = -0.035; }
    else { ctl.goal = Object.assign({}, VIEWS[name]); ctl.tx = VIEWS[name].tx || 0; ctl.tz = VIEWS[name].tz; }
    const fov = name === 'bridge' ? BRIDGE.fov : (VIEWS[name] && VIEWS[name].fov) || 36;
    if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
    document.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === name)));
    fire('event', 'view', name);
  }
  const eyeV = new THREE.Vector3(), lookV = new THREE.Vector3();
  function applyCamera() {
    for (let i = 0; i < HOOKS.camera.length; i++) {
      try { if (HOOKS.camera[i](S.view) === true) return; } catch (e) { console.error('a viewer part failed in "camera" and was dropped:', e); HOOKS.camera.splice(i--, 1); }
    }
    if (S.view === 'bridge') {
      eyeV.copy(SX(BRIDGE.x, 0, C.deckZ('Boat', BRIDGE.x) + 1.75)).applyMatrix4(shipGroup.matrix);
      const cp = Math.cos(BRIDGE.pitch);
      lookV.set(cp * Math.cos(BRIDGE.yaw), Math.sin(BRIDGE.pitch), cp * Math.sin(BRIDGE.yaw)).transformDirection(shipGroup.matrix);
      camera.position.copy(eyeV); camera.lookAt(lookV.multiplyScalar(200).add(eyeV));
      return;
    }
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
  // a part's view that is looked about from (VIEWS: look): the part turns its own eye; the page keeps its hands off
  const lookedFrom = () => !!(VIEWS[S.view] && VIEWS[S.view].look);
  canvas.addEventListener('pointermove', (e) => {
    const p = pointers.get(e.pointerId); if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    const eye = lookedFrom();
    if (pointers.size === 1 && drag) {
      drag.moved += Math.abs(dx) + Math.abs(dy);
      if (drag.scrape) { scrapeAt(e); return; }
      if (S.view === 'bridge') { BRIDGE.yaw = Math.min(2.6, Math.max(-2.6, BRIDGE.yaw - dx * 0.004)); BRIDGE.pitch = Math.min(0.7, Math.max(-0.7, BRIDGE.pitch + dy * 0.004)); }
      else if (eye) { /* the part's eye turns (its own handlers): no orbit, no pan, and Follow stays on */ }
      else if (drag.button === 2 || drag.shift) pan(dx, dy);
      else { ctl.goal = null; ctl.theta -= dx * 0.006; ctl.phi = Math.min(3.05, Math.max(0.06, ctl.phi - dy * 0.006)); }
    } else if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (drag && drag.pinch && !eye) { ctl.r = Math.min(zoomOut(), Math.max(25, ctl.r * drag.pinch / Math.max(d, 1))); pan(dx / 2, dy / 2); }
      if (drag) drag.pinch = d; else drag = { pinch: d, moved: 99 };
      if (!eye) ctl.goal = null;
    }
  });
  const endPointer = (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    if (pointers.size === 0 && drag) {
      const quick = performance.now() - drag.t0 < 450 && drag.moved < 7;
      if (quick && S.tool === 'hole' && drag.button === 0) punchAt(e);
      if (drag.scrape && drag.stroke > 0) { toast(`Scrape: ${drag.stroke} punctures added` + (drag.dropped ? '. ' + drag.dropped : '')); onDamageChanged(); }
      drag = null;
    } else if (pointers.size === 1 && drag) { drag.pinch = null; }
  };
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  canvas.addEventListener('wheel', (e) => { e.preventDefault(); if (lookedFrom()) return; ctl.goal = null; ctl.r = Math.min(zoomOut(), Math.max(25, ctl.r * Math.exp(e.deltaY * 0.0012))); }, { passive: false });
  const zoomOut = () => (fall.list.length ? 6500 : 2200);   // the farthest the zoom goes: 6.5 km while she falls (the fall)
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
  // G27 (docs/DESIGN_G27_the_brush_on_a_watch_v1_2026-11-24.md): on a watch a hole is an order of the model's own,
  // Night's `hole` (logged, replayed from a link, forecast), rounded so that the log's numbers alone place it. It is no
  // man's on the bridge, so it does not take the watch over: the night's own orders (the 1912 orders, a replay's) go on,
  // no part hears it as an order, and the bridge learns of the water by the reports (core/readers/reports.js)
  const r2 = (v) => Math.round(v * 100) / 100, r4 = (v) => Math.round(v * 1e4) / 1e4;
  const WATCH_HOLES = 'On a watch the holes are part of the night. Start the watch again to have none.';
  // NH4 with G27 (the coordinator's ruling, 2026-11-24 02:27): a hole made in a night scrubbed back (behind the furthest
  // kept minute) makes the night a new one from here, as a new order does: the minutes kept after it are dropped, once,
  // and said once (`dropped`, the words; a caller that toasts the hole itself passes quiet and says them in its own
  // notice), and the parts hear 'ordersDropped' { index, t, by: 'hole' }. The hole takes nothing over, so the night's
  // later orders still go on (its script stands, and the next scrub takes them as this night's), one place further on
  function holeOnWatch(h, area, quiet) {
    const sim = S.sim, n = S.night;
    if (!n || !sim || !sim.night || gone(sim)) return null;
    const v = [r2(h.x), r2(h.z), h.y >= 0 ? 1 : -1], a = r4(area);
    if (!NT.validHole(v, a)) return null;
    const from = sim.night.log.length;
    NT.act(sim, 'hole', v, a);
    let dropped = null;
    if (keptNewWay()) {
      dropped = 'The minutes kept after ' + (clockOf(sim.t) || 'this minute') + ' are dropped: the night goes on with the hole, its later orders as before';
      if (!quiet) toast(dropped);
      fire('event', 'ordersDropped', { index: from, t: sim.t, by: 'hole' });
    }
    if (n.over) { requestForecast(); n.nLog = sim.night.log.length; }
    return { zone: C.zoneAt(v[0]), side: v[2] > 0 ? 0 : 1, dropped };
  }
  function punchAt(e) {
    const h = hullHit(e); const why = validate(h);
    if (why) { toast(why); return; }
    const o = S.night ? holeOnWatch(h, S.holeArea, true) : addHole(h, S.holeArea);
    if (!o) { toast(gone(S.sim) ? 'She is gone: nothing more can be holed.' : 'That place cannot be holed here.'); return; }
    const Z = ship.zones[o.zone], d = S.night ? o.dropped : presetNewWay();   // G32: a preset scrubbed back goes a new way too
    toast(`Hole in ${Z.name}, ${o.side ? 'starboard' : 'port'}, ${fmt(-h.world.y, 1)} m below the waterline · ${fmt(S.holeArea * 10.764, 1)} sq ft` + (d ? '. ' + d : ''));
    if (S.night) { syncHoles(); renderHoleTable(); updateHeader(); } else onDamageChanged();
  }
  function scrapeAt(e) {
    const h = hullHit(e); if (validate(h)) return;
    if (drag.lastHole && Math.hypot(h.x - drag.lastHole.x, h.z - drag.lastHole.z) < 2.6) return;
    if (drag.stroke >= 80) return;
    if (S.night) { const o = holeOnWatch(h, S.holeArea, true); if (!o) return; if (o.dropped) drag.dropped = o.dropped; renderHoleTable(); }
    else { addHole(h, S.holeArea); const d = presetNewWay(); if (d) drag.dropped = d; }
    drag.lastHole = h; drag.stroke++;
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
    S.sim = sim; S.hist = []; S.histNext = 0; S.acc = 0; S.post = 0; S.logShown = 0; S.forecast = null; S.openVersion = -1;
    S.lightsFailT = -1; S.lightsFailWhy = null; S.lightsMainT = -1; S.lightsMainWhy = null; S.lastRev = 0;
    keepReset();                                  // NH4: a new run keeps its own minutes
    ports.reset();                                // D97: every port lit again for the new run, until its section's fuses blow
    circ = !sim.night && sim.plant && CI && CI.start ? CI.start(sim) : null;   // a preset's circuits, stepped by the page (a watch's reader keeps its own)
    endHolds();                                   // every part's hold of the pace ends with the run it was for
    $('logBody').textContent = '';
    // the look is applied to the bulkheads just built: without it a new run with X-ray off drew them, their tops and
    // their letters over the solid hull (found by the night lane, 2026-11-17)
    clearHoles(); buildBulkheads(); applyLook(); syncHoles(); renderBulkheadTable(); renderHoleTable();
    $('coal').checked = sim.params.coalListDeg > 0;
    updateHeader();
    if (S.night) { clearTimeout(fcTimer); S.fcSeq++; $('fcLine').textContent = ''; } else requestForecast(true);
  }
  function setSpeed(v) {
    S.speed = v;
    document.querySelectorAll('#speedSeg button').forEach(x => x.setAttribute('aria-pressed', String(+x.dataset.speed === v)));
  }
  function setHash(h) {
    if (window.history && history.replaceState) { try { history.replaceState(null, '', h || (location.pathname + location.search)); } catch (e) { /* file: URLs may refuse */ } }
  }
  function loadScenario(key, fromHash) {
    const wasNight = !!S.night;
    S.scen = key; S.night = null;
    showWatch(false);
    if (wasNight) { setSpeed(60); if (S.view === 'astern' || S.view === 'bridge') setView('quarter'); }
    document.querySelectorAll('#scenCards .card').forEach(c => c.setAttribute('aria-checked', String(c.dataset.key === key)));
    startSim(attachPlant(C.createSim(ship, {}, buildScenario(key))));
    S.playing = true; syncPlay();
    if (!fromHash) setHash(key === 'titanic' ? '' : '#scenario=' + key);
    fire('reset', S.sim);
  }
  // the ship's plant on every run (core/systems.js), with the coal option of the Systems tab when it is not as loaded
  const COAL_HOURS = { '2h': 2, '15m': 0.25 };
  const plantOpts = (coal) => (SY && COAL_HOURS[coal] ? { coal: SY.coalFor(COAL_HOURS[coal]) } : undefined);
  function attachPlant(sim) { if (SY) SY.attach(sim, plantOpts(S.coal)); return sim; }
  // ---- the watch: a night from its seed. o: { mode: 'you' | 'auto' | 'replay', log, kn, level, fromHash }
  function loadNight(seed, o) {
    o = o || {};
    if (!NT) { toast('This build has no watch (the night module is missing).'); return; }
    seed = (Math.floor(Math.abs(+seed)) || 1) >>> 0;
    const kn = o.kn || S.nightKn, level = o.level || S.nightLevel, spec = NT.spec(seed, { speedKn: kn, level }), mode = o.mode || 'you', coal = o.coal || S.coal;
    const po = plantOpts(coal); if (po) spec.plant = Object.assign({}, spec.plant, po);   // part of the night: a replay gets the same bunkers (D112: the night's own plant, the engineers' doors, kept)
    S.scen = spec.kind === '1912' ? 'watch' : 'night';
    S.night = { seed, kn, level: spec.level || 'hard', coal, spec, mode, bells: false, touched: false, over: false, nOpen: 0, rows: null, winSeq: 0 };
    beckon(false);                                  // RC2: a watch is open, so the phone's Run tab no longer beckons
    document.querySelectorAll('#scenCards .card').forEach(c => c.setAttribute('aria-checked', String(c.dataset.key === S.scen)));
    const how = mode === 'auto' ? { auto: true } : (mode === 'replay' ? { script: o.log.map(e => ({ k: e.k, type: e.type, value: e.value, arg: e.arg })) } : {});
    if (S.handover) how.handover = S.handover;     // G12's cascade: 'flag', the what-if, from the address (the onset is the default)
    const sim = NT.create(ship, spec, how);
    if (S.bh !== 'built') C.BULKHEADS.forEach((bh, i) => { const top = S.bh === 'B' ? 'B' : (bh.top === 'E' ? 'D' : bh.top); C.setBulkheadTop(sim, i, top); });
    startSim(sim);
    resetWatchScene(sim);
    setSpeed(1); showWatch(true);
    if (S.view !== 'bridge' && !(VIEWS[S.view] && VIEWS[S.view].keep)) setView('astern');   // the Bridge, and a part's view that keeps (N2), stay
    S.follow = true; $('bFollow').setAttribute('aria-pressed', 'true');
    $('seedIn').value = String(seed);
    $('bReplay').disabled = !(S.lastWatch && S.lastWatch.seed === seed && S.lastWatch.kn === kn && S.lastWatch.coal === coal && S.lastWatch.level === S.night.level);
    $('debrief').hidden = true; $('winBody').textContent = '';
    S.playing = true; syncPlay(); renderWatch();
    if (!o.fromHash) setHash('#night=' + seed + (kn !== 22.5 ? '&kn=' + kn : '') + (S.night.level !== 'hard' ? '&level=' + S.night.level : '') + (S.handover ? '&handover=' + S.handover : ''));
    if (mode !== 'you') toast(mode === 'auto' ? 'The 1912 orders are on the bridge. Touch the wheel or the telegraph to take over.' : 'Replaying your watch. Touch the wheel or the telegraph to take over.');
    fire('reset', S.sim);
  }
  function showWatch(on) {
    $('bridge').hidden = !on; $('watchSec').hidden = !on; $('startHere').hidden = on;   // RC1: "Start here" while no watch is open
    $('stage').classList.toggle('watch', on);
    earth.visible = on; dentPts.visible = on;
    if (!on) { wake.reset(); washFx.reset(); smoke.reset(); steam.reset(); S.screwRev = [0, 0, 0]; }
    if (!on) { disposeBerg(); frontUniform.value = 1e6; seaMat.uniforms.uPsi.value = 0; seaMat.uniforms.uPos.value.set(0, 0); seaMat.uniforms.uPosG.value.set(0, 0); if (S.stars) S.stars.rotation.y = 0; }
    $('bReset').textContent = on ? 'Restart this watch' : 'Restart from collision';
    $('speedSeg').classList.toggle('locked', false);
    if (!on) $('speedHint').firstChild.nodeValue = '60× plays the 2 h 40 min sinking in under three minutes. ';
    resize();                                     // the view's centre moves with the Bridge overlay
    S.lastStrip = 0;
  }
  function restart() {
    if (S.night) { loadNight(S.night.seed, { kn: S.night.kn, level: S.night.level }); return; }
    const old = S.sim;
    // RC2 (NH13's find, the coordinator's ask): the preset as built (its pumps' schedule, its own coal list and whatever
    // else its build gives), with the player's own edits over it: its openings, its doors, its bulkheads' tops, and the
    // coal box. Before, a restart kept only those four and set the list at 2.0 degrees, so a 1912 preset restarted was not
    // the history match's member C (1.598) and had lost its pumps
    const base = buildScenario(S.scen);
    const scen = Object.assign(base, {
      openings: old.openings.map(o => ({ x: o.x, y: o.y, z: o.z, area: o.area, kind: o.kind, tOpen: o.tOpen, label: o.label })),
      doorsOpen: C.BULKHEADS.filter((b, i) => old.doorOpen[i]).map(b => b.id),
      bulkTop: Object.fromEntries(C.BULKHEADS.map((b, i) => [b.id, old.bulkTop[i]])),
      coalListDeg: $('coal').checked ? (base.coalListDeg > 0 ? base.coalListDeg : C.DEFAULT_PARAMS.coalListDeg) : 0,
    });
    startSim(attachPlant(C.createSim(ship, {}, scen)));
    S.playing = true; syncPlay();
    fire('reset', S.sim);
  }
  function onDamageChanged() { syncHoles(); renderHoleTable(); updateHeader(); requestForecast(); }

  // ===================================================================== forecast worker
  let worker = null, fcTimer = 0;
  const workerURL = window.TitanicWorkerURL || null;
  function requestForecast(now) {
    S.fcAsked++;
    clearTimeout(fcTimer);
    $('fcLine').textContent = 'Forecasting…';
    fcTimer = setTimeout(runForecast, now ? 30 : 350);
  }
  function runForecast() {
    const seq = ++S.fcSeq;
    const state = C.serialize(S.sim);
    // Y6: a watch is forecast by running a copy of it on (core/night.js, forecast), so that the plant, the engineers' later
    // orders, the bridge's orders and the scripted ones still to come go with it: what the watch does when left alone.
    // The core alone from its snapshot stays for the presets (and if the copy cannot be made)
    let night = null;
    if (S.night && NT && NT.forecastOf) { try { night = NT.forecastOf(S.sim); } catch (e) { night = null; } }
    if (worker) { worker.terminate(); worker = null; }
    if (workerURL && window.Worker) {
      try {
        worker = new Worker(workerURL);
        worker.onmessage = (e) => { if (e.data.seq === S.fcSeq) { S.forecast = e.data; renderForecast(); } };
        worker.onerror = () => { worker = null; fallbackForecast(seq, state, night); };
        worker.postMessage({ seq, state, night });
        return;
      } catch (e) { worker = null; }
    }
    fallbackForecast(seq, state, night);
  }
  function fallbackForecast(seq, state, night) {
    // the same computations, sliced on the main thread
    if (night) {
      const f = NT.forecaster(ship, night);
      const slice = () => {
        if (seq !== S.fcSeq) return;
        const t0 = performance.now();
        let done = false;
        while (!done && performance.now() - t0 < 12) done = f.go(40);
        if (!done) { setTimeout(slice, 0); return; }
        const r = f.result();
        S.forecast = { seq, hist: r.hist, foundered: r.foundered, founderT: r.founderT, over: r.over, overT: r.overT, final: r.final, events: r.events, endT: r.endT, by: 'watch' };
        renderForecast();
      };
      slice();
      return;
    }
    coreForecast(seq, state);
  }
  function coreForecast(seq, state) {
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
  // when the damage was done: the collision is t = 0 in the presets; on a watch it is the first touch of the ice
  const damageT = () => (S.night && S.sim.night.tTouch > 0 ? S.sim.night.tTouch : 0);
  function forecastSentence() {
    const f = S.forecast; if (!f) return null;
    if (f.over && !f.foundered) {                  // an onset watch (QC B-4): she breaks before the flag (Bo, 11-21: "Breaks at")
      const clock = clockOf(f.overT);
      return { short: `Breaks${clock ? ' at ' + clock : ''}, ${hm(f.overT - damageT())} after the touch`, lead: 'Forecast:' };
    }
    if (f.foundered) {
      const clock = clockOf(f.founderT);
      return { short: `Founders${clock ? ' at ' + clock : ''}, ${hm(f.founderT - damageT())} after the ${S.night ? 'touch' : 'damage'}`, lead: 'Forecast:' };
    }
    const r = f.final;
    if (S.sim.openings.length === 0) return { short: S.night ? 'No water aboard' : 'Intact. Add damage on the Damage tab', lead: '' };
    return { short: `Stays afloat: settles ${fmt(Math.abs(r.trimDeg), 1)}° by the ${r.trimDeg >= 0 ? 'head' : 'stern'} with ${fmtInt(r.waterT)} t aboard`, lead: 'Forecast:' };
  }
  // NH3, one model, many histories (tools/ensemble.js, out/ensemble_1912.json): the kept set's spread beside this run where
  // its table applies: the 1912 damage preset as built (no hole of the player's, bulkheads as built, coal as loaded) and the
  // 1912 watch on its recorded orders at her speed. Anywhere else the page shows this run alone
  function keptRun() {
    const sim = S.sim;
    if (!ENS || !sim) return null;
    if (!S.night) return S.scen === 'titanic' && S.bh === 'built' && S.coal === 'loaded' && !sim.openings.some(o => o.label === 'user') ? 'preset' : null;
    const n = S.night;
    // G27: a watch whose log holds a hole made by hand is not the recorded night, whatever its orders
    return S.scen === 'watch' && n.mode === 'auto' && n.seed === 1912 && n.kn === 22.5 && (!n.coal || n.coal === 'loaded') && !(sim.night && sim.night.log.some(o => o.type === 'hole')) ? 'watch' : null;
  }
  // its words in the forecast's paragraph: when the kept set founders (or breaks, on a watch handed over at the onset), its
  // least, middle and most at her clock, and the landed member's own (the defaults: this run, where nothing is changed)
  function keptSentence() {
    const kr = keptRun(); if (!kr) return null;
    const onset = kr === 'watch' && !!(S.sim.night && S.sim.night.handover === 'onset'), B = (onset ? ENS.onset : ENS.founder)[kr], me = ENS.landed[kr][onset ? 'onset' : 'founder'];
    if (!B || !(B.n > 0)) return null;
    const at = (T) => clockOf(damageT() + T * 60) || 'T+' + Math.round(T);
    return 'The kept set (the ' + ENS.members + ' members of the calibration the record could not rule out): ' + (onset ? 'she breaks' : 'she founders') + ' in ' + B.n + ' of ' + ENS.members +
      ', between ' + at(B.lo) + ' and ' + at(B.hi) + ', ' + at(B.med) + ' in the middle; the landed member, the model\'s defaults, at ' + at(me) + '.';
  }
  function renderForecast() {
    const s = forecastSentence(); if (!s) return;
    const el = $('fcLine'); el.textContent = '';
    if (s.lead) { const b = document.createElement('b'); b.textContent = s.lead + ' '; el.appendChild(b); }
    el.appendChild(document.createTextNode(s.short));
    const f = S.forecast;
    const p = $('fcText'); p.textContent = '';
    p.appendChild(document.createTextNode(s.short + '.'));
    const ks = keptSentence();
    if (ks) { const k = document.createElement('span'); k.id = 'fcKept'; k.className = 'fc-kept'; k.textContent = ' ' + ks; p.appendChild(k); }
    const ev = f.events.filter(e => e.t >= S.sim.t - 1 && (/bulkhead|bridge|well|Forecastle|Founder/.test(e.label) || /^dome/.test(e.id || ''))).slice(0, 7);   // S1: and each staircase's dome
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
  const WATCH_CARDS = {
    watch: { title: 'The watch, 14 April 1912', blurb: 'You have the bridge at 11.39 pm: 22½ knots, course 266°. When the lookout rings three bells, the wheel and the telegraph are yours. The ice makes the damage.' },
    night: { title: 'Another night', blurb: 'A berg somewhere ahead, drawn from a seed: its size, its place, how far off it is seen. The same seed gives the same night.' },
  };
  const randomSeed = () => 100000 + Math.floor(Math.random() * 900000);
  {
    const box = $('scenCards');
    const card = (key, p, go) => {
      const b = document.createElement('button'); b.className = 'card'; b.dataset.key = key; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', 'false');
      const t = document.createElement('b'); t.textContent = p.title; const s = document.createElement('span'); s.textContent = p.blurb;
      b.append(t, s); b.addEventListener('click', () => { go(); if (isPhone()) sheetOpen(false); });
      box.appendChild(b);
    };
    if (NT) {
      card('watch', WATCH_CARDS.watch, () => { primeAudio(); loadNight(1912); });
      card('night', WATCH_CARDS.night, () => { primeAudio(); loadNight(randomSeed()); });
    }
    for (const key of SCEN_ORDER) card(key, SC.PRESETS[key], () => loadScenario(key));
  }

  // ---- the watch: orders, the bell, and what the panel says
  let audio = null;
  function primeAudio() {                         // browsers start sound only from a tap or a key
    try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); if (audio.state === 'suspended') audio.resume(); } catch (e) { audio = null; }
  }
  // The sound wakes with the player's first tap or key anywhere on the page, if the switch is on. Until 2026-11-17 only
  // the watch's cards and buttons woke it, so a watch opened from its address and steered by the wheel alone was
  // silent, the lookout's bell included.
  const wakeSound = () => {
    if (!$('snd').checked) return;
    primeAudio();
    if (audio) { window.removeEventListener('pointerdown', wakeSound, true); window.removeEventListener('keydown', wakeSound, true); }
  };
  window.addEventListener('pointerdown', wakeSound, true); window.addEventListener('keydown', wakeSound, true);
  function bell(n) {                              // the crow's nest bell: three strokes for an object ahead
    if (!audio || !$('snd').checked) return;
    try {
      const t0 = audio.currentTime + 0.05;
      for (let i = 0; i < n; i++) for (const [f, g, d] of [[1174, 0.30, 1.5], [2349, 0.12, 0.9], [3136, 0.07, 0.6]]) {
        const o = audio.createOscillator(), v = audio.createGain(), t = t0 + i * 0.72;
        o.type = 'sine'; o.frequency.value = f;
        v.gain.setValueAtTime(0.0001, t); v.gain.exponentialRampToValueAtTime(g, t + 0.006); v.gain.exponentialRampToValueAtTime(0.0001, t + d);
        o.connect(v); v.connect(audio.destination); o.start(t); o.stop(t + d + 0.05);
      }
    } catch (e) { /* no sound */ }
  }
  // A hand on the bridge ends the scripted orders (the 1912 orders, or a replay's), and the watch is the player's from
  // then on. Y8: after the ice that makes it a watch "Replay my watch" replays, a watch begun on the 1912 orders too (at the
  // ice the page keeps only a watch already the player's: onWatchOver). The forecast after the ice ran the scripted orders
  // still to come: if one the model would carry out is dropped here (on the 1912 orders the Stop comes a minute after the
  // touch, 23 s after the ice is passed), she will do otherwise, and a new forecast is asked for. Returns whether it asked
  function takeOver() {
    const w = S.sim.night, n = S.night;
    let asked = false;
    // NH4: a watch scrubbed back (behind the furthest kept minute, with or without later orders queued) takes a new way
    // here: its later orders and kept minutes are dropped. The parts hear it as the event 'ordersDropped' { index, t, by:
    // 'order' }: index is the log's length now, where this new order goes, so every logged order from index on is the new
    // way's (fork 2's memos are cut there). A hole made by hand drops the minutes only (holeOnWatch)
    const from = w.log.length, back = keptNewWay();
    const dropWords = 'the orders and minutes kept after ' + (clockOf(S.sim.t) || 'this minute') + ' are dropped, and the night goes your new way';
    if (w.script) {
      const dropped = w.script.some((o, i) => !w.did[i] && NT.owns(o.type) && !(o.unless === 'touch' && w.tTouch >= 0));
      w.script = null; w.did = null; n.mode = 'you';
      toast(back ? 'You have the bridge: ' + dropWords : 'You have the bridge');
      if (dropped && n.over) { requestForecast(); asked = true; }
    } else if (back) { n.mode = 'you'; toast('A new way: ' + dropWords); }
    if (back) fire('event', 'ordersDropped', { index: from, t: S.sim.t, by: 'order' });
    if (n.over) $('bReplay').disabled = false;
    return asked;
  }
  // The one way to give an order on a watch (S2): the page's wheel, telegraph, doors, stokehold and pumps, and a part's
  // orders (TitanicApp.order: the boats, the reports, help). The watch is taken over as by the wheel, the order is given
  // through the night (Night.act: logged with its step, so that it replays), the parts hear it ('order'), and after the
  // ice a new forecast is asked for only if the order is one the model carries out itself (Night.owns): a reader's order
  // (a boat, a report, a rocket) changes nothing in the model. Returns what the order returned (a pump order's
  // { ok, why }, the doors' switch false without current, a reader's answer); undefined when there is no watch to take it
  function order(type, value, arg) {
    const sim = S.sim;
    if (!S.night || !sim || !sim.night || gone(sim)) return undefined;
    if (!NT.owns(type) && !NT.READERS.some(r => r.orders && Object.prototype.hasOwnProperty.call(r.orders, type))) throw new Error('TitanicApp.order: no such order: ' + type);
    const n = S.night, w = sim.night, asked = takeOver();
    const done = NT.act(sim, type, value, arg);
    if (n.over) {                                 // asked for here, at once (the clock may be stopped); the frame loop has seen it
      if (!asked && NT.owns(type)) requestForecast();
      n.nLog = w.log.length;
    }
    if (type === 'helm' || type === 'telegraph') syncBridge();
    fire('event', 'order', { type, value, arg, done });
    return done;
  }
  function orderHelm(deg) {                       // + = rudder to starboard: her head goes to starboard
    if (!S.night || gone(S.sim)) return;
    const d = Math.max(-40, Math.min(40, deg));
    order('helm', d);
    fire('event', 'helm', d);
  }
  function orderEngines(o) {
    if (!S.night || gone(S.sim)) return;
    order('telegraph', o);
    fire('event', 'telegraph', o);
  }
  const TEL = ['full astern', 'half astern', 'slow astern', 'stop', 'slow ahead', 'half ahead', 'full ahead'];
  const telIndex = () => { const m = S.sim.mo; let best = 3, d = 1e9; TEL.forEach((o, i) => { const e = Math.abs(Mo.TELEGRAPH[o] - 0.5 * (m.setP + m.setS)); if (e < d) { d = e; best = i; } }); return best; };
  function syncBridge() {                         // the wheel and the telegraph show the orders in force
    if (!S.night) return;
    const m = S.sim.mo, cmd = Math.round(m.delCmd / Mo.DEG), ti = telIndex(), exact = m.setP === m.setS && Mo.TELEGRAPH[TEL[ti]] === m.setP;
    if (document.activeElement !== $('wheel')) $('wheel').value = String(cmd);
    $('bHardPort').setAttribute('aria-pressed', String(cmd <= -40)); $('bHardStbd').setAttribute('aria-pressed', String(cmd >= 40));
    document.querySelectorAll('#telegraph button').forEach((b, i) => b.setAttribute('aria-pressed', String(exact && i === ti)));
  }
  $('bHardPort').addEventListener('click', () => orderHelm(-40));
  $('bHardStbd').addEventListener('click', () => orderHelm(40));
  $('bMidships').addEventListener('click', () => orderHelm(0));
  $('wheel').addEventListener('input', () => orderHelm(+$('wheel').value));
  $('wheel').addEventListener('change', () => $('wheel').blur());
  document.querySelectorAll('#telegraph button').forEach(b => b.addEventListener('click', () => orderEngines(b.dataset.order)));
  $('bSameNight').addEventListener('click', () => { primeAudio(); if (S.night) loadNight(S.night.seed, { kn: S.nightKn, level: S.night.level }); });
  $('bNewNight').addEventListener('click', () => { primeAudio(); loadNight(randomSeed()); });
  $('bAuto').addEventListener('click', () => { primeAudio(); if (S.night) loadNight(S.night.seed, { kn: S.night.kn, level: S.night.level, mode: 'auto' }); });
  // RC1, the first minute ("Start here", on the Run tab while no watch is open): the watch's card, its 1912 orders, and
  // where the page says what it is and is not (the Evidence tab's first section). The same calls as those controls make
  $('bStartWatch').addEventListener('click', () => { primeAudio(); loadNight(1912); if (isPhone()) sheetOpen(false); });
  $('bStartAuto').addEventListener('click', () => { primeAudio(); loadNight(1912, { mode: 'auto' }); if (isPhone()) sheetOpen(false); });
  $('bStartAbout').addEventListener('click', () => { selectTab('evidence'); const a = $('evAbout'); if (a) a.scrollIntoView({ block: 'start' }); else panel.scrollTop = 0; });
  $('bReplay').addEventListener('click', () => {
    primeAudio();
    // a watch still on the bridge is replayed as it stands now, with every order given since the ice
    if (S.night && S.night.mode === 'you' && S.sim.night.log.length) S.lastWatch = { seed: S.night.seed, kn: S.night.kn, level: S.night.level, coal: S.night.coal, log: S.sim.night.log.map(o => Object.assign({}, o)) };
    const L = S.lastWatch; if (L) loadNight(L.seed, { kn: L.kn, level: L.level, coal: L.coal, mode: 'replay', log: L.log });
  });
  const seedGo = () => { primeAudio(); const v = parseInt($('seedIn').value, 10); if (v > 0) loadNight(v); else toast('A seed is a whole number, such as 1912'); };
  $('bSeedGo').addEventListener('click', seedGo);
  $('seedIn').addEventListener('keydown', (e) => { if (e.key === 'Enter') { seedGo(); $('seedIn').blur(); } });
  document.querySelectorAll('#knSeg button').forEach(b => b.addEventListener('click', () => {
    S.nightKn = +b.dataset.kn;
    document.querySelectorAll('#knSeg button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    toast(`The next watch starts at ${b.textContent.trim()} knots`);
  }));
  // G1: how hard the drawn nights are (core/night.js LEVELS); applies to the next night drawn, not to the 1912 watch
  document.querySelectorAll('#levelSeg button').forEach(b => b.addEventListener('click', () => {
    S.nightLevel = b.dataset.level;
    document.querySelectorAll('#levelSeg button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    toast(`The next drawn night: ${b.textContent.trim().toLowerCase()}`);
  }));
  // RC2 (the coordinator's ruling, 2026-11-24 07:57): the encounter's verdict as it stood at the ice's end (onWatchOver),
  // so that the line under the readouts, the Run tab and the end card agree while she circles past the berg again: a
  // miss's verdict reads her side from where the ice is now and its gap from the closest pass so far, so it moves as she
  // does. A later contact that changes what happened (a miss turned into a holing) gives the verdict anew
  function verdictNow(sim) {
    const n = S.night, v = n && n.verdict;
    if (!v || !sim || !sim.night) return NT.verdict(sim);
    return NT.summary(sim).kind === v.kind ? v.text : NT.verdict(sim);
  }
  // what the Run tab says about the watch, and the table of other watches on the same berg
  function watchSentence() {
    const sim = S.sim, w = sim.night, n = S.night;
    const who = n.mode === 'auto' ? 'The 1912 orders. ' : (n.mode === 'replay' ? 'Your watch, replayed. ' : '');
    if (w.tBells < 0) return who + (w.hindsight ? 'An order was given before anything was seen.' : `${n.spec.kind === '1912' ? 'Sunday 14 April 1912. ' : 'Night ' + n.seed + '. '}You have the bridge; nothing is in sight. When the bells ring, turn her, slow her, or do neither.`);
    const s = NT.summary(sim);
    const react = s.reaction === null ? (w.hindsight ? 'An order was given before the bells: nobody had seen anything yet.' : 'No order has been given.') : `First order ${fmt(s.reaction, 1)} s after the bells, the ice ${fmt(Math.max(0, s.aheadOrder), 0)} m ahead.` + (w.hindsight ? ' (There was also an order before the bells.)' : '');
    if (w.tClear < 0) return who + `Ice ${fmt(Math.max(0, w.range), 0)} m off. ` + react;
    // the watch's id, as stamped on the step the encounter ended (onWatchOver), with that step, as the end card gives its
    // own: not the fingerprint of whatever step the tab is drawn again on (a row of the other watches coming in) (G5)
    const id = n.id || { fp: s.fingerprint, k: w.k };
    return who + verdictNow(sim) + '. ' + react + (s.headOn ? ' Wilding told the inquiry she would have come in with her bow crushed 80 to 100 feet.' : '') + ` Watch ${id.fp}, step ${id.k}.`;
  }
  function renderWatch() {
    if (!S.night) return;
    $('watchText').textContent = watchSentence();
    const rows = S.night.rows, body = $('winBody');
    $('debrief').hidden = !rows;
    if (!rows) return;
    const mine = S.night.mine;
    let best = -1, bd = 1e9;
    if (mine !== null && mine !== undefined) rows.forEach((r, i) => { const d = Math.abs(r.reaction - mine); if (d < bd) { bd = d; best = i; } });
    body.textContent = '';
    rows.forEach((r, i) => {
      const tr = document.createElement('tr'); if (i === best) tr.className = 'mine';
      const a = document.createElement('td'); a.className = 'num'; a.textContent = r.reaction + ' s' + (i === best ? ' (nearest yours)' : '');
      const b = document.createElement('td'); b.textContent = r.text;
      tr.append(a, b); body.appendChild(tr);
    });
  }
  let winWorker = null;
  function requestWindow() {                      // the same berg, another watch: seven encounters in the background
    const n = S.night; if (!n || !workerURL || !window.Worker) return;
    if (winWorker) { winWorker.terminate(); winWorker = null; }
    const seq = ++n.winSeq, rows = [];
    try {
      winWorker = new Worker(workerURL);
      winWorker.onmessage = (e) => {
        if (e.data.type !== 'window' || !S.night || S.night !== n || e.data.seq !== n.winSeq) return;
        rows.push(e.data.row); n.rows = rows.slice(); renderWatch();
        if (e.data.last) { winWorker.terminate(); winWorker = null; }
      };
      winWorker.onerror = () => { winWorker = null; };
      winWorker.postMessage({ type: 'window', seq, seed: n.seed, kn: n.kn, level: n.level, times: [0, 5, 10, 15, 20, 25, 30] });
    } catch (e) { winWorker = null; }
  }
  // the watch's moments, called from the frame loop on the step they happen
  function onBells() { bell(3); const ev = S.sim.events[S.sim.events.length - 1]; toast(ev ? ev.label.replace(/ Range.*$/, '') : 'Three bells: ice ahead', true); renderWatch(); fire('event', 'bells', S.sim); }
  function onTouch() { const ev = S.sim.events.filter(e => e.id === 'touch').pop(); toast(ev ? ev.label : 'She touches the ice', true); renderWatch(); fire('event', 'touch', S.sim); }
  function onWatchOver() {
    const sim = S.sim, n = S.night, s = NT.summary(sim);
    n.id = { fp: s.fingerprint, k: sim.night.k };   // the watch's id, stamped once, on the step the encounter ended (G5)
    n.verdict = { kind: s.kind, text: NT.verdict(sim) };   // RC2: the verdict as it stands now, which verdictNow keeps
    n.mine = s.reaction;
    if (n.mode === 'you') { S.lastWatch = { seed: n.seed, kn: n.kn, level: n.level, coal: n.coal, log: sim.night.log.map(o => Object.assign({}, o)) }; $('bReplay').disabled = false; }
    // RC1: holed, and still at her own pace, a newcomer is told in the verdict's own notice where the clock runs faster (on
    // a phone the pace is in the closed sheet, and nothing on the stage says it)
    // RC2 (the first ten minutes played cold): there the notice gives the verdict's first clause (her opening and its
    // side), then the pointer. A big notice stands 4.2 s, and on a long scrape the whole verdict (every compartment, as a
    // stranger's own night gave nine) put the pointer past what can be read in that time. The whole verdict stays in the
    // line under the readouts and in the Run tab
    const slow = sim.openings.length > 0 && S.speed <= 1;
    toast(slow ? n.verdict.text.split(', ')[0] + '. Run the clock faster under Time, on the Run tab, to see what the water does' : n.verdict.text, true);
    n.nOpen = sim.openings.length; n.nLog = sim.night.log.length;
    // a miss: the line under the readouts says the kept verdict at once (it stood blank until the readouts' next refresh)
    if (sim.openings.length) requestForecast(true); else { S.forecast = null; $('fcLine').textContent = n.verdict.text; }
    renderWatch(); requestWindow();
    fire('event', 'clear', sim);
  }
  // tabs and the phone sheet
  const panel = $('panel');
  function selectTab(name) {
    document.querySelectorAll('.tab').forEach(x => x.setAttribute('aria-selected', String(x.dataset.tab === name)));
    document.querySelectorAll('.pane').forEach(p => { p.hidden = p.dataset.pane !== name; });
    if (name === 'evidence') S.lastChart = 0;
    if (name === 'systems') renderSystems();
  }
  function sheetOpen(open) {
    panel.classList.toggle('open', open);
    $('sheetClose').setAttribute('aria-expanded', String(open));
    if (open) panel.scrollTop = 0;
    S.lastChart = 0;
  }
  // RC2 (the first ten minutes played cold): on a phone the first screen is the ship, the sheet closed, and nothing on it
  // said where to begin ("Start here" is in the closed sheet). Until the Run tab is first opened or a watch is, its tab
  // reads "Start" and beckons (the pulse is [appearance], site/styles.css); a desktop's panel shows "Start here" already
  const runTab = document.querySelector('.tab[data-tab="run"]');
  function beckon(on) {
    if (!runTab || runTab.classList.contains('beckon') === on) return;
    runTab.classList.toggle('beckon', on); runTab.textContent = on ? 'Start' : 'Run';
  }
  document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
    if (t === runTab) beckon(false);
    const already = t.getAttribute('aria-selected') === 'true';
    if (isPhone() && already && panel.classList.contains('open')) { sheetOpen(false); return; }
    selectTab(t.dataset.tab);
    if (isPhone()) sheetOpen(true);
  }));
  $('sheetClose').addEventListener('click', () => sheetOpen(false));
  // transport
  function syncPlay() { const s = S.sim; $('bPlay').textContent = S.playing ? 'Pause' : (gone(s) ? (s.fall && s.fall.done ? 'On the bed' : (falling(s) ? 'Play' : (broke(s) ? 'She broke' : 'Foundered'))) : 'Play'); }
  function togglePlay() { if (gone(S.sim) && !falling(S.sim)) return; S.playing = !S.playing; syncPlay(); }
  $('bPlay').addEventListener('click', togglePlay);
  $('bReset').addEventListener('click', restart);
  document.querySelectorAll('#speedSeg button').forEach(b => b.addEventListener('click', () => {
    S.speed = +b.dataset.speed;
    document.querySelectorAll('#speedSeg button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  }));
  window.addEventListener('keydown', (e) => {
    const tag = (e.target && e.target.tagName) || '';
    if (e.metaKey || e.ctrlKey || e.altKey || /^(INPUT|SELECT|TEXTAREA)$/.test(tag)) return;
    // the bridge's keys work wherever the focus was left, a button included: the card that began the watch has it
    if (S.night) {
      const k = e.key.toLowerCase(), cmd = Math.round(S.sim.mo.delCmd / Mo.DEG);
      let did = true;
      if (k === 'a') orderHelm(-40);
      else if (k === 'd') orderHelm(40);
      else if (k === 's') orderHelm(0);
      else if (e.key === 'ArrowLeft') orderHelm(cmd - 5);
      else if (e.key === 'ArrowRight') orderHelm(cmd + 5);
      else if (e.key === 'ArrowUp') orderEngines(TEL[Math.min(TEL.length - 1, telIndex() + 1)]);
      else if (e.key === 'ArrowDown') orderEngines(TEL[Math.max(0, telIndex() - 1)]);
      else did = false;
      if (did) { e.preventDefault(); return; }
    }
    if (/^(BUTTON|A)$/.test(tag)) return;         // Space and Enter belong to a focused button
    if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
    else if (e.key === 'r' || e.key === 'R') restart();
  });
  // view
  document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => setView(b.dataset.view)));
  // X-ray and the columns: the player's choice, the later one over a part's claim (C-4 step 3, the claims below)
  $('bXray').addEventListener('click', () => choose('look.xray', !S.xray));
  $('bCols').addEventListener('click', () => { choose('look.cols', !S.cols); if (S.cols) toast('Each box is one column the core integrates: water below the free surface, per space'); });
  $('bFollow').addEventListener('click', () => { S.follow = !S.follow; $('bFollow').setAttribute('aria-pressed', String(S.follow)); });
  $('bLights').addEventListener('click', () => { S.lights = !S.lights; $('bLights').setAttribute('aria-pressed', String(S.lights)); });
  $('sternLight').addEventListener('change', () => { S.sternLight = $('sternLight').checked; });
  // the rudder indicator's ticks: every 10 degrees to 40 each side
  {
    const t = $('helmTicks'), ns = 'http://www.w3.org/2000/svg';
    for (let d = -40; d <= 40; d += 10) {
      const a = d * D2R, l = document.createElementNS(ns, 'line'), r0 = d % 20 === 0 ? 34 : 37;
      l.setAttribute('x1', String(r0 * Math.sin(a))); l.setAttribute('y1', String(-r0 * Math.cos(a)));
      l.setAttribute('x2', String(40 * Math.sin(a))); l.setAttribute('y2', String(-40 * Math.cos(a))); t.appendChild(l);
    }
  }
  function needle(id, deg, len) { const a = Math.max(-45, Math.min(45, deg)) * D2R, el = $(id); el.setAttribute('x2', String(len * Math.sin(a))); el.setAttribute('y2', String(-len * Math.cos(a))); }
  const X_OPACITY = { mast: 0.35, funnel: 0.14, cap: 0, window: 0, glass: 0.12, lettering: 0 };   // the X-ray look's opacity by kind; the rest 0.05
  // the hull's material: the look's own (X-ray or solid), unless a part claims another (material.hull, C-4 step 3: the
  // Night look's), so that the look applied again under a claim never takes the claimed material away
  let hullLook = null;
  function applyHull() { const m = claimValue('material.hull') || hullLook; if (m && hullMesh.material !== m) hullMesh.material = m; }
  function applyLook() {
    hullLook = S.xray ? hullXray : hullSolid; applyHull();
    hullMesh.renderOrder = S.xray ? 6 : 0;
    S.hullLines.visible = S.xray;
    for (const m of bulkMeshes) m.visible = S.xray;
    for (const l of bulkTopLines) l.visible = S.xray;
    for (const l of bulkLabels) l.visible = S.xray;
    for (const m of fsMeshes) m.userData.allowed = S.xray;
    // her topsides: faint in X-ray (the masts and funnels a little less; the funnels' black tops and the windows not
    // drawn at all), painted in the solid look; the masts their X-ray buff or their "dark mast" (site/topsides.js COLORS)
    for (const f of superFaces) {
      const k = f.userData.kind, op = S.xray ? (f.userData.capOnly ? 0.0 : (X_OPACITY[k] !== undefined ? X_OPACITY[k] : 0.05)) : 1.0;
      f.material.opacity = op; f.visible = op > 0;
      f.material.transparent = S.xray; f.material.depthWrite = !S.xray; f.material.needsUpdate = true;
      f.renderOrder = S.xray ? 5 : 0;
      if (k === 'mast') f.material.color.setHex(S.xray ? TS.COLORS.mastXray : TS.COLORS.mast);
    }
    for (const e of superEdges) e.visible = S.xray;
    topsides.setLineLook(S.xray ? 'xray' : 'solid');
    for (const b of stern.bossings) { b.material = S.xray ? stern.bossX : stern.bossS; b.renderOrder = S.xray ? 5 : 0; }
    for (const sh of stern.shafts) sh.visible = S.xray;
    engines.g.visible = S.xray;
  }
  // tools
  document.querySelectorAll('#toolSeg button').forEach(b => b.addEventListener('click', () => {
    S.tool = b.dataset.tool;
    document.querySelectorAll('#toolSeg button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    canvas.className = 'tool-' + S.tool;
    if (S.tool !== 'look' && !S.xray) choose('look.xray', true);   // a damage tool needs X-ray: the player's later choice
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
    // G27: on a watch every hole is part of the night (the ice's and the hand's alike), in its log: none is taken away
    if (S.night) { toast(WATCH_HOLES); return; }
    const n0 = S.sim.openings.length;
    for (const o of S.sim.openings.slice()) C.removeOpening(S.sim, o.id);
    const d = n0 ? presetNewWay() : null;           // G32: an opening taken away by hand, in a run scrubbed back
    toast('All openings removed. Water already aboard stays.' + (d ? ' ' + d : ''));
    onDamageChanged();
  });
  $('coal').addEventListener('change', () => toast('Applies when you restart from the collision'));
  // doors and bulkheads. Y2: the bridge's switch drops the doors at the tank top and needs current from the dynamos; at a
  // door, a lever drops it and a pump handle raises it. On a watch each is an order in the log, and ends the scripted
  // orders as the wheel does (core/night.js).
  // (on a watch the forecast is order()'s to ask for: after the ice only, as for every order of the model's own)
  function orderDoors() {
    const sim = S.sim; if (gone(sim)) return;
    let done;
    if (S.night) done = order('doors', 'bridge');
    else if (SY && sim.plant) done = SY.bridgeDoors(sim);
    else { C.BULKHEADS.forEach((b, i) => C.releaseDoor(sim, i, 'from the bridge')); done = true; }
    const d = done && !S.night ? presetNewWay() : null;   // G32: on a preset scrubbed back, the doors by hand go a new way
    renderBulkheadTable(); if (!S.night) requestForecast();
    if (done) toast(`From the bridge: the watertight doors drop, shut in about ${sim.params.doorFall} s` + (d ? '. ' + d : ''));
    else toast('No current on the bridge: the switch releases nothing. Each door\'s float still drops it when water reaches it, and its lever works by hand', true);
    fire('event', 'doors', !!done);
  }
  // quiet: the caller says G32's words in its own notice (the doors raised together); returns them, or null
  function orderDoor(i, open, quiet) {
    const sim = S.sim; if (gone(sim)) return null;
    let d = null;
    if (S.night) order('door', i, !!open);
    else {
      if (open) { if (SY && sim.plant) SY.openDoor(sim, i); else C.setDoor(sim, i, true); }
      else C.releaseDoor(sim, i, 'by hand');
      d = presetNewWay();
      if (d && !quiet) toast(d);
    }
    renderBulkheadTable(); if (!S.night) requestForecast();
    fire('event', 'door', { i, open: !!open });
    return d;
  }
  $('bDoorsClose').addEventListener('click', orderDoors);
  $('bDoorsOpen').addEventListener('click', () => {
    let d = null;
    C.BULKHEADS.forEach((b, i) => { if (b.doors.length && !S.sim.doorOpen[i]) { const x = orderDoor(i, true, true); if (x) d = x; } });
    toast('By hand: the watertight doors raised' + (d ? '. ' + d : ''));
  });
  document.querySelectorAll('#bhSeg button').forEach(b => b.addEventListener('click', () => {
    S.bh = b.dataset.bh;
    document.querySelectorAll('#bhSeg button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    const preset = (SC.PRESETS[S.scen] && SC.PRESETS[S.scen].build({}).bulkTop) || {};
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
        const open = S.sim.doorOpen[i] === 1, falling = open && S.sim.doorFall && S.sim.doorFall[i] >= 0;
        chip.setAttribute('aria-pressed', String(open)); chip.textContent = falling ? 'Falling' : (open ? 'Open' : 'Closed');
        chip.title = falling ? 'Released: it falls shut by its own weight. Click to raise it again by hand' : (open ? 'Click to drop it by hand (its lever)' : 'Click to raise it by hand');
        // D112: a door the engineers raised by hand on the night says so, with when and why (the record's schedule)
        const eng = S.sim.plant && S.sim.plant.raised ? S.sim.plant.raised.find(r => r.id === bh.id) : null;
        if (eng && open && !falling) chip.title = `Raised by the engineers by hand at ${clockOf(eng.t) || 'T+' + hm(eng.t - damageT())}, ${eng.why} (the record: the door note, section 8). ` + chip.title;
        chip.addEventListener('click', () => orderDoor(i, !open || falling));
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
        // G27: on a watch no opening is taken away (the ice's and the hand's alike are the night's, in its log or its
        // encounter): the x is disabled there, with the words "Remove all openings" gives, and refuses if reached
        x.addEventListener('click', () => { if (S.night) { toast(WATCH_HOLES); return; } for (const id of r.ids) C.removeOpening(S.sim, id); const d = presetNewWay(); if (d) toast(d); onDamageChanged(); });
        holeRows.set(g.key, r);
      }
      r.ids = g.ids;
      r.x.disabled = !!S.night; r.x.title = S.night ? WATCH_HOLES : '';
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
    if (S.night) {
      $('scenName').textContent = 'RMS Titanic';
      $('scenSub').textContent = S.night.spec.kind === '1912' ? '14 April 1912 · the watch' : `Night ${S.night.seed}` + (S.night.kn !== 22.5 ? ` · ${S.night.kn} kn` : '');
      return;
    }
    const p = SC.PRESETS[S.scen];
    const parts = p.title.split(',');
    $('scenName').textContent = S.scen === 'titanic' ? 'RMS Titanic' : (S.scen === 'britannic' ? 'HMHS Britannic' : (S.scen === 'hawke' ? 'RMS Olympic' : parts[0]));
    $('scenSub').textContent = S.scen === 'titanic' ? '14–15 April 1912' : (S.scen === 'britannic' ? '21 November 1916' : (S.scen === 'hawke' ? '20 September 1911' : 'What-if'));
  }
  function updateHud() {
    const sim = S.sim, r = C.readouts(sim), tNow = tOf(sim);   // her time: the fall's once it runs on past the flag
    const clock = clockOf(tNow, !!S.night);
    $('shipTime').textContent = clock || hms(tNow);
    $('elapsed').textContent = S.night ? (sim.night.tTouch > 0 ? 'touch +' + hms(tNow - sim.night.tTouch) : (sim.night.tBells >= 0 ? 'bells +' + fmt(sim.t - sim.night.tBells, 0) + ' s' : 'on watch')) : (clock ? 'T+' + hms(tNow) : 'after damage');
    const trim = r.trimDeg, list = r.listDeg;
    $('sTrim').textContent = `${fmt(Math.abs(trim), 1)}° ${trim >= 0.05 ? 'head' : (trim <= -0.05 ? 'stern' : '')}`.trim();
    $('sList').textContent = `${fmt(Math.abs(list), 1)}° ${list >= 0.05 ? 'stbd' : (list <= -0.05 ? 'port' : '')}`.trim();
    $('sWater').textContent = `${fmtInt(r.waterT)} t`;
    $('sIn').textContent = `${fmtInt(Math.max(0, r.inflowTpm))} t/min`;
    $('sDraft').textContent = gone(sim) ? 'under' : `${fmt(r.draftF, 1)} / ${fmt(r.draftA, 1)} m`;
    const st = $('status');
    let cls = 'idle', txt = 'Intact';
    const overNow = C.BULKHEADS.map((b, i) => sim.overflow[i] > 0.05 ? b.id : null).filter(Boolean);
    if (gone(sim)) { cls = 'crit'; txt = broke(sim) ? 'Breaking' : 'Foundered'; }   // QC B-4: "Breaking" on an onset watch
    else if (overNow.length) { cls = 'crit'; txt = `Over bulkhead ${overNow[overNow.length - 1]}`; }
    else if (r.inflowTpm > 1) { cls = 'warn'; txt = 'Flooding'; }
    else if (sim.openings.length || r.waterT > 1) { cls = 'ok'; txt = 'Afloat'; }
    if (S.night && !gone(sim)) {                  // the watch has its own states until the ice is astern
      const w = sim.night;
      if (w.tBells < 0) { cls = 'idle'; txt = 'On watch'; }
      else if (w.tClear < 0) { cls = w.tTouch >= 0 ? 'crit' : 'warn'; txt = w.tTouch >= 0 ? 'On the ice' : 'Ice ahead'; }
      else if (!sim.openings.length) { cls = 'ok'; txt = 'Clear'; }
    }
    st.className = 'pill ' + cls; st.textContent = txt;
    if (S.night) updateBridge(r);
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
        fire('event', 'log', ev[i]);
      }
      if (ev.slice(S.logShown).some(e => e.id && /^(over|door|shut)/.test(e.id))) renderBulkheadTable();
      // on a watch, what the machinery loses is news on the bridge (her lights going out has its own word: lightsOut)
      if (S.night) { const big = ev.slice(S.logShown).filter(e => e.id && /^plant:(re|te|steer|screws|screwsHalf|screwsOut|break|slow|nosteam|flood\d|coal\d)$/.test(e.id)).pop(); if (big) toast(big.label, true); }
      // S1: a staircase's dome giving way is news on a watch and on a preset alike
      { const dome = ev.slice(S.logShown).filter(e => e.id && /^dome/.test(e.id)).pop(); if (dome) toast(dome.label, true); }
      S.logShown = ev.length;
    }
    renderHoleTable();
    if (!sysPane.hidden) renderSystems();
    roar(S.night && S.sim.plant && !gone(S.sim) ? S.sim.plant.blow : 0);   // the safety valves' roar (Y1), none once she has gone
  }

  // the bridge's instruments, eight times a second
  let watchShown = '';
  function updateBridge() {
    const sim = S.sim, w = sim.night, m = Mo.readouts(sim), busy = NT.busy(sim);
    $('gKn').textContent = fmt(m.knots, 1) + ' kn' + (m.surgeKn < -0.05 ? ' astern' : '');
    $('gHdg').textContent = String(Math.round(m.heading) % 360).padStart(3, '0') + '°';
    $('gRud').textContent = Math.abs(m.rudder) < 0.5 ? 'midships' : `${fmt(Math.abs(m.rudder), 0)}° ${m.rudder < 0 ? 'port' : 'stbd'}`;
    needle('helmOrder', sim.mo.delCmd / D2R, 38); needle('helmActual', m.rudder, 34);   // the order, and the rudder following it at 4 degrees a second
    $('gRpm').textContent = `${Math.round(m.rpmPort)} · ${Math.round(m.rpmCentre)} · ${Math.round(m.rpmStbd)}`;
    steamLine();
    const ice = $('gIce'), box = ice.parentElement;
    let txt, cls = '';
    if (w.tBells < 0) txt = w.tClear >= 0 ? 'The ice was never seen' : 'Nothing in sight';
    else if (w.tClear < 0) {
      const b = w.bearing, where = Math.abs(b) < 2 ? 'right ahead' : `${fmt(Math.abs(b), 0)}° to ${b > 0 ? 'starboard' : 'port'}`;
      // on the ice: the hull and the ice pressed on each other within the step just taken (the contact stamps the
      // sub-step it acted in, before her clock moves on: comparing for equality, as this did, was never true)
      const onIce = sim.enc.tLast >= 0 && sim.mo.t - sim.enc.tLast <= sim.params.dt * 1.0001;
      txt = onIce ? 'On the ice' : `Ice ${fmt(Math.max(0, w.range), 0)} m, ${where}`;
      cls = w.tTouch >= 0 ? 'struck' : 'alarm';
    } else txt = NT.summary(sim).kind === 'miss' ? 'Clear of the ice' : 'The ice is astern';
    if (ice.textContent !== txt) ice.textContent = txt;
    box.className = 'stat ice' + (cls ? ' ' + cls : '');
    $('speedSeg').classList.toggle('locked', busy);
    const hint = busy ? 'The watch runs in real time until the ice is passed. ' : 'The ice is astern: run the clock faster to see what the water does. ';
    if ($('speedHint').firstChild.nodeValue !== hint) $('speedHint').firstChild.nodeValue = hint;
    syncBridge();
    // before a forecast exists the line under the readouts carries the watch
    if (!S.forecast || !sim.openings.length) {
      const line = w.tClear >= 0 ? verdictNow(sim) : (w.tBells >= 0 ? `Bells ${fmt(sim.t - w.tBells, 0)} s ago` + (w.tOrder >= 0 ? `, first order after ${fmt(w.tOrder - w.tBells, 1)} s` : ', no order yet') : `${fmt(m.knots, 1)} knots, course ${String(Math.round(m.heading) % 360).padStart(3, '0')}°`);
      if ($('fcLine').textContent !== line) $('fcLine').textContent = line;
    }
    const sentence = w.tClear >= 0 ? 'over' : (w.tBells >= 0 ? 'bells' + Math.floor(sim.t) + (w.tOrder >= 0 ? 'o' : '') : 'watch');
    if (sentence !== watchShown) { watchShown = sentence; renderWatch(); }
  }
  // the revolutions the bridge has ordered (the larger shaft's)
  const ordered = (sim) => (sim.mo ? Math.max(Math.abs(sim.mo.setP), Math.abs(sim.mo.setS)) : 0);
  // under the revolutions: the steam behind them (core/systems.js)
  function steamLine() {
    const el = $('gSteam'), P = S.sim.plant && SY ? SY.readouts(S.sim) : null;
    let txt = '', cls = 'sub';
    if (P) {
      if (!P.engines) { txt = 'engine room flooded'; cls += ' crit'; }
      else if (P.psi < 1) { txt = 'no steam'; cls += ' crit'; }
      else if (P.nMax <= 0) { txt = `${fmtInt(P.psi)} psi · too low`; cls += ' crit'; }                // below what the engines need
      else if (P.nMax < ordered(S.sim) - 0.5) { txt = `${fmtInt(P.psi)} psi · short`; cls += ' warn'; }   // she cannot make the order
      else txt = `${fmtInt(P.psi)} psi`;
    }
    if (el.textContent !== txt) el.textContent = txt;
    if (el.className !== cls) el.className = cls;
  }

  // ===================================================================== the Systems tab: what depends on what, now
  const sysPane = document.querySelector('[data-pane="systems"]');
  const pct = (v) => Math.round(100 * v) + ' %';
  const rpmTxt = (n) => Math.abs(n) < 0.5 ? '0' : fmtInt(Math.abs(n)) + (n < 0 ? ' astern' : '');
  function chainRow(k, cls, text) {
    const li = sysPane.querySelector(`li[data-k="${k}"]`); if (!li) return;
    if (li.className !== cls) li.className = cls;
    const sp = li.lastElementChild; if (sp.textContent !== text) sp.textContent = text;
  }
  let sysRoomsFor = null;
  function renderSystems() {
    const sim = S.sim, P = sim.plant && SY ? SY.readouts(sim) : null, body = $('sysRooms');
    if (!P) { chainRow('coal', '', 'This build has no plant model.'); return; }
    const PL = SY.PLANT, m = sim.mo ? Mo.readouts(sim) : null, none = 'not running: this preset is the damage alone';
    // coal and fires
    const hrs = P.hoursLeft, left = isFinite(hrs) && hrs < 72 ? (hrs < 1 ? `, ${fmt(hrs * 60, 0)} min at this rate` : `, ${fmt(hrs, 1)} h at this rate`) : '';
    chainRow('coal', P.coal <= 0 ? 'crit' : (hrs < 1 ? 'warn' : 'ok'), P.coal <= 0 ? 'the bunkers are empty' : `${fmtInt(P.coal)} t in the bunkers${left}`);
    const lit = P.rooms.filter(r => r.lit > 0), burning = lit.filter(r => r.fires > 0.5).length;
    chainRow('fires', P.can <= 0 ? 'crit' : (P.can < 0.999 ? 'warn' : 'ok'), `burning in ${burning} of the ${lit.length} rooms lit`);   // what they can raise (Y1b)
    chainRow('steam', P.broken || P.p < PL.pDynamo ? 'crit' : (P.p < 0.95 ? 'warn' : 'ok'),
      P.broken ? `the mains are broken: ${fmtInt(P.psi)} psi and falling` : `${fmtInt(P.psi)} psi; making ${pct(P.gen)}, using ${pct(P.demand)}`);
    // engines, turbine, screws
    if (!P.engines) chainRow('engines', 'crit', 'stopped: their room is flooded');
    else if (!m) chainRow('engines', '', none);
    else if (P.nMax <= 0) chainRow('engines', 'crit', 'no steam to turn them');
    else if (P.nMax < ordered(sim) - 0.5) chainRow('engines', 'warn', `steam for ${fmtInt(P.nMax)} rpm at most; turning ${rpmTxt(m.rpmPort)} · ${rpmTxt(m.rpmStbd)}`);
    else if (Math.abs(m.rpmPort) + Math.abs(m.rpmStbd) < 0.5) chainRow('engines', '', 'stopped');
    else chainRow('engines', 'ok', `turning ${rpmTxt(m.rpmPort)} · ${rpmTxt(m.rpmStbd)} rpm`);
    if (!P.turbineRoom) chainRow('turbine', 'crit', 'stopped: its room is flooded');
    else if (!m) chainRow('turbine', '', none);
    else if (m.turbine && m.rpmCentre > 1) chainRow('turbine', 'ok', `${fmtInt(m.rpmCentre)} rpm on the engines' exhaust`);
    else if (m.rpmCentre > 1) chainRow('turbine', '', `running down, ${fmtInt(m.rpmCentre)} rpm`);
    else chainRow('turbine', '', 'idle: ahead only, at Half or Full, both engines above 40 rpm');
    if (!P.screws) chainRow('screws', '', none);
    else {
      const s = P.screws, sum = s[0] + s[1] + s[2];
      if (sum > 2.997) chainRow('screws', 'ok', 'all three under water');
      else chainRow('screws', sum < 0.15 ? 'crit' : 'warn', `under water: port ${pct(s[0])}, centre ${pct(s[1])}, starboard ${pct(s[2])}`);
    }
    // the rudder: water past it, steam to move it, and the blade under water
    if (!m) { chainRow('way', '', 'none: the presets lie stopped'); chainRow('steering', '', none); }
    else {
      if (m.knots < 0.3) chainRow('way', 'warn', 'none: the rudder has no water to work on');
      else if (m.surgeKn < -0.3) chainRow('way', 'warn', `${fmt(m.knots, 1)} kn astern: the rudder works the other way, and weakly`);
      else chainRow('way', 'ok', `${fmt(m.knots, 1)} kn: water past the rudder`);
      if (P.steer <= 0) chainRow('steering', 'crit', 'no steam: the rudder stays where it is');
      else if (P.steer < 0.999) chainRow('steering', 'warn', `low steam: the gear moves at ${pct(P.steer)} of its rate`);
      else if (P.rudder < 0.9) chainRow('steering', 'warn', `the gear answers; only ${pct(P.rudder)} of the rudder is under water`);
      else chainRow('steering', 'ok', 'the steering engines answer the wheel' + (P.rudder < 0.999 ? `; the rudder ${pct(P.rudder)} under water` : ''));
    }
    chainRow('dynamos', P.power ? 'ok' : (P.lights > 0 ? 'warn' : 'crit'), P.power ? 'running: her lights burn' : (P.lights > 0 ? 'the main sets flooded: the emergency dynamos on D deck keep her emergency lights' : (P.dynamosFlooded ? 'flooded: she is dark' : (P.broken ? 'stopped, the steam mains broken: she is dark' : 'stopped for want of steam: she is dark'))));
    // the watertight doors at the tank top (Y2): the bridge drops them with current; floats and levers without
    const D = P.doors.filter(d => d.low), nOpen = D.filter(d => d.open && !d.falling).length, nFall = D.filter(d => d.falling).length;
    // D112: the doors the engineers raised by hand on the night, as the record has them (the door note, section 8)
    const byWhy = [];
    for (const r of P.raised || []) { const g = byWhy.find(x => x.why === r.why && x.t === r.t); if (g) g.ids.push(r.id); else byWhy.push({ why: r.why, t: r.t, ids: [r.id] }); }
    const raisedWords = byWhy.length ? '; raised by the engineers by hand: ' + byWhy.map(g => g.ids.join(', ') + ' at ' + (clockOf(g.t) || 'T+' + hm(g.t - damageT())) + ', ' + g.why).join('; ') + ' (the record: the door note, section 8)' : '';
    chainRow('doors', nOpen + nFall === 0 ? 'ok' : (P.power ? 'warn' : 'crit'), (nOpen + nFall === 0 ? 'all shut at the tank top' : `${nOpen} open${nFall ? `, ${nFall} falling` : ''} at the tank top`) + (P.power ? '; the bridge\'s switch has current' : '; no current on the bridge: only their floats and levers drop them') + raisedWords);
    // the pumps (Y3): at work against the water while there is steam; each stops when the room it stands in floods; on
    // a watch the bridge can take them from the engineers (Y6: the Pumps section below)
    const pu = P.pumps, so = (pu.pumpedT >= 1 ? `; ${fmtInt(pu.pumpedT)} t put overboard` : '') + (pu.who === 'bridge' ? '; on your orders' : '');
    if (pu.running > 0) chainRow('pumps', pu.scale < 0.999 ? 'warn' : 'ok', `${pu.running} at work, ${fmt(pu.tpm, 1)} t a minute${pu.scale < 0.999 ? `, slowed by low steam to ${pct(pu.scale)}` : ''}${pu.waiting ? `; ${pu.waiting} being rigged` : ''}${so}`);
    else if (pu.waiting > 0) chainRow('pumps', 'warn', `${pu.waiting} being rigged${so}`);
    else if (pu.stopped > 0) chainRow('pumps', 'crit', (pu.scale <= 0 ? 'stopped: no steam' : `all ${pu.stopped} stopped: their rooms flooded`) + so);
    else chainRow('pumps', '', (pu.taken ? 'idle: taken off' : 'idle: no water to pump') + so);
    renderPumps(P);
    // the boiler rooms
    if (sysRoomsFor !== sim) {
      sysRoomsFor = sim; body.textContent = '';
      PL.rooms.forEach((r, k) => {
        const tr = document.createElement('tr');
        for (let c = 0; c < 5; c++) { const td = document.createElement('td'); if (c === 1 || c === 3) td.className = 'num'; tr.appendChild(td); }
        tr.cells[0].textContent = r.name.replace('Boiler room ', 'No. ');
        tr.cells[1].textContent = `${r.lit} of ${r.boilers * r.ends}`;
        const b = document.createElement('button'); b.className = 'chip'; b.dataset.room = String(k); b.textContent = 'Draw';
        b.setAttribute('aria-label', 'Draw the fires in ' + r.name.toLowerCase()); tr.cells[4].appendChild(b);
        body.appendChild(tr);
      });
    }
    P.rooms.forEach((r, k) => {
      const tr = body.rows[k]; if (!tr) return;
      const st = r.lit === 0 ? 'cold' : (r.flooded ? (r.fires > 0 ? 'flooded, dying' : 'flooded') : (r.drawn ? (r.fires > 0 ? `being drawn, ${pct(1 - r.fires)}` : 'drawn')
        : (r.coal <= 0 ? (r.fires > 0 ? 'no coal, burning down' : 'out of coal') : 'burning')));
      if (tr.cells[2].textContent !== st) tr.cells[2].textContent = st;
      const c = r.lit > 0 ? fmtInt(r.coal) : '–'; if (tr.cells[3].textContent !== c) tr.cells[3].textContent = c;
      tr.cells[4].firstChild.disabled = !(r.lit > 0 && r.fires > 0 && !r.flooded && !r.drawn);
    });
    $('bDrawAll').disabled = !P.rooms.some(r => r.lit > 0 && r.fires > 0 && !r.flooded && !r.drawn);
  }
  // an order to the stokehold; on a watch it is logged with the others (and ends the scripted orders, as the wheel does)
  function drawFires(k) {
    const sim = S.sim; if (!sim.plant || !SY || gone(sim)) return;
    let d = null;
    if (S.night) order('fires', k); else { SY.drawFires(sim, k); d = presetNewWay(); }   // G32
    toast((k < 0 ? 'To the stokehold: draw every fire' : `To ${SY.PLANT.rooms[k].name.toLowerCase()}: draw the fires`) + (d ? '. ' + d : ''));
    renderSystems();
    fire('event', 'fires', k);
  }
  $('sysRooms').addEventListener('click', (e) => { const b = e.target.closest('button[data-room]'); if (b && !b.disabled) drawFires(+b.dataset.room); });
  $('bDrawAll').addEventListener('click', () => drawFires(-1));
  // ---- the pumps (Y6): each room with water or with pumps on it, what is on it and what it puts out (on a watch every
  // room an order can draw from too, dry or not: pumpRoomsOf); on a watch the bridge's orders: a room's own pumps, every
  // free pump that can reach it, or one pump, put on it; a pump or all of them taken off; the pumps handed back to the
  // engineers. Each order goes in the watch's log (Night.pump), refused or not
  let pumpKey = '';
  const elt = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
  const setText = (node, text) => { if (node && node.textContent !== text) node.textContent = text; };
  function pumpChip(label, room, which, aria) {
    const b = elt('button', 'chip', label); b.dataset.proom = String(room); b.dataset.pwhich = String(which);
    if (aria) b.setAttribute('aria-label', aria);
    return b;
  }
  function pumpLine(p, k) {
    const PP = SY.PLANT.pumps;
    const name = p.i >= 0 ? `${PP[p.i].name}${p.room !== k ? ', through the main' : ''}, ${fmtInt(p.LTh)} t/h` : p.label.charAt(0).toUpperCase() + p.label.slice(1);
    const st = p.state === 'working' ? 'at work' : (p.state === 'rigging' ? `at work in ${Math.max(1, Math.ceil((p.t0 - S.sim.t) / 60))} min` : `stopped: ${C.ZONES[p.room].name.toLowerCase()} flooded`);
    return `${name}: ${st}`;
  }
  // The rooms the section lists: those the plant lists (water in them, or pumps on them: core/systems.js), and on a watch
  // every other room an order can draw from as well, dry and in a quieter form, so that pumps can be put on a room before
  // the water reaches it (Y6's what-if: every pump on boiler rooms 4 and 5 three minutes after the touch, when boiler room 4
  // is still dry). What an order draws from a room is the plant's own rule (its suctionFor): nothing from a peak; a hold's
  // suctions only while the firemen's passage stands; any other room's own. A room with none is listed only when the plant
  // lists it, and then says why
  function pumpRoomsOf(pu, can) {
    if (!can) return pu.rooms;
    const PL = SY.PLANT, listed = new Map(pu.rooms.map(r => [r.k, r])), out = [];
    for (let k = 0; k < C.ZONES.length; k++) {
      if (listed.has(k)) { out.push(listed.get(k)); continue; }
      const lth = C.ZONES[k].peak ? 0 : (PL.holdSuction[k] > 0 ? (pu.passageT >= 0 ? 0 : PL.holdSuction[k]) : PL.suction[k]);
      if (lth > 0) out.push({ k, name: C.ZONES[k].name, waterT: 0, depth: 0, lost: false, suction: lth, why: '', tpm: 0, own: PL.pumps.some(p => p.room === k), pumps: [], dry: true });
    }
    return out;
  }
  function renderPumps(P) {
    const pu = P.pumps, box = $('pumpRooms'), sim = S.sim; if (!pu.rooms) return;
    const can = !!S.night && !gone(sim), PL = SY.PLANT, rig = (s) => Math.round(s / 60) + ' min', rooms = pumpRoomsOf(pu, can);
    const free = pu.each.filter(p => p.state === 'free'), on = (p) => p.i >= 0 && p.state !== 'stopped';
    setText($('pumpWho'), ({ engineers: `The engineers have the pumps: a room's own pumps on it ${rig(PL.pumpOwn)} after water comes in, more led to it through the main ${rig(PL.pumpLent)} later.`,
      bridge: 'You have the pumps: the engineers wait for your orders.', night: 'The pumps as they were worked on the night: boiler room 5\'s, then boiler room 4\'s.',
      none: 'Nobody works the pumps on this preset.' })[pu.who] || '');
    $('bPumpsBack').hidden = !S.night; $('bPumpsBack').disabled = !(can && pu.who === 'bridge');
    // rebuilt when the rooms, what is on them or the free pumps change (an open "One pump" list stays open); texts in place
    const key = [can, pu.who, free.map(p => p.i).join('.'), rooms.map(r => r.k + (r.dry ? 'd' : '') + (r.suction > 0 ? '+' : '-') + (r.lost ? 'L' : '') + r.pumps.map(p => (p.i >= 0 ? p.i : p.label) + (on(p) ? '' : 's')).join(',')).join('|')].join('/');
    if (key !== pumpKey) {
      pumpKey = key;
      const open = new Set([...box.querySelectorAll('details[open]')].map(d => d.dataset.proom));
      box.textContent = '';
      if (!rooms.length) box.appendChild(elt('p', 'hint', 'No water in any room, and no pump at work.'));
      for (const r of rooms) {
        const div = elt('div', r.dry ? 'proom dry' : 'proom'); div.dataset.proom = String(r.k);
        const head = elt('div', 'kv'); head.append(elt('b', '', r.name), elt('span', 'v')); div.appendChild(head);
        const ul = elt('ul');
        for (const p of r.pumps) {
          const li = elt('li'); li.appendChild(elt('span'));
          if (can && on(p)) li.appendChild(pumpChip('Off', -1, p.i, 'Take ' + PL.pumps[p.i].name.toLowerCase() + ' off'));
          ul.appendChild(li);
        }
        div.appendChild(ul);
        const row = elt('div', 'row');
        if (can && r.suction > 0) {
          const lname = r.name.toLowerCase();
          if (!r.lost && pu.each.some(p => p.room === r.k && p.on !== r.k && p.state !== 'lost')) row.appendChild(pumpChip('Its own pumps', r.k, 'own', 'Put the pumps of ' + lname + ' on it'));
          row.appendChild(pumpChip('Every pump that can reach it', r.k, 'all', 'Put every free pump that can reach ' + lname + ' on it'));
        }
        if (can && r.pumps.some(on)) row.appendChild(pumpChip('All off', r.k, 'off', 'Take every pump off ' + r.name.toLowerCase()));
        if (row.childNodes.length) div.appendChild(row);
        if (can && r.suction > 0 && free.length) {
          const d = elt('details'); d.dataset.proom = String(r.k); if (open.has(String(r.k))) d.open = true;
          d.appendChild(elt('summary', '', 'One pump…'));
          const opts = elt('div', 'row opts');
          for (const p of free) opts.appendChild(pumpChip(`${p.name}, ${fmtInt(p.LTh)} t/h, ${p.room === r.k ? 'its own: in ' + rig(PL.pumpOwn) : 'through the main: in ' + rig(PL.pumpLent)}`, r.k, p.i));
          d.appendChild(opts); div.appendChild(d);
        }
        if (r.suction <= 0) div.appendChild(elt('p', 'hint', r.why));
        box.appendChild(div);
      }
    }
    rooms.forEach((r, n) => {
      const div = box.children[n]; if (!div || div.dataset.proom !== String(r.k)) return;
      const work = r.pumps.some(p => p.state === 'working');
      const out = work ? (r.depth <= sim.params.pumpStrum + 0.02 ? ' · pumped down to the strum' : ` · ${fmt(r.tpm, 1)} t a minute out`) : '';
      setText(div.querySelector('.kv .v'), r.dry ? 'dry' : `${fmtInt(r.waterT)} t of water${out}`);
      const lis = div.querySelectorAll('ul li');
      r.pumps.forEach((p, j) => { if (lis[j]) setText(lis[j].firstChild, pumpLine(p, r.k)); });
    });
  }
  // an order to the pumps, on a watch: logged with the others (and it ends the scripted orders, as the wheel does); after
  // the ice order() asks for a new forecast and takeOver() offers "Replay my watch", as for every order since Y8
  function orderPump(room, which) {
    const sim = S.sim; if (!S.night || !sim.plant || !SY || gone(sim)) return null;
    const r = order('pump', room, which);
    toast(r.ok ? r.short : r.why);                  // one line; the log has it all
    pumpKey = ''; renderSystems();
    fire('event', 'pump', { room, which, ok: !!r.ok });
    return r;
  }
  $('pumpRooms').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-pwhich]'); if (!b || b.disabled) return;
    const w = b.dataset.pwhich; orderPump(+b.dataset.proom, /^\d+$/.test(w) ? +w : w);
  });
  $('bPumpsBack').addEventListener('click', () => orderPump(-1, 'engineers'));
  document.querySelectorAll('#coalSeg button').forEach(b => b.addEventListener('click', () => {
    S.coal = b.dataset.coal;
    document.querySelectorAll('#coalSeg button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    toast(S.coal === 'loaded' ? 'Her bunkers as loaded, from the next restart' : `${b.textContent.replace(' left', '')} of coal at full firing, from the next restart`);
  }));

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
    // water per space, level plane cut at the centreline. A space's floor is its zone's, but the forepeak's below E deck
    // begins at the orlop where the ship has G7's peak tank under it (buildShip's peakTank: the core's columns start there)
    const planeZ = (h, x) => (h - F.tz - F.R20 * x) / F.R22;
    const floorAt = (k, x) => (ship.peakTank && k === 0 ? C.deckZ('orlop', x) : ship.zones[k].floor);
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
          const lo = L ? e : floorAt(k, x), hi = L ? top : e;
          const zz = full ? hi : Math.max(lo, Math.min(hi, planeZ(h, x)));
          i ? g.lineTo(X(x), Zp(zz)) : g.moveTo(X(x), Zp(zz));
        }
        for (let i = N; i >= 0; i--) { const x = Z.xa + (Z.xf - Z.xa) * i / N; g.lineTo(X(x), Zp(L ? C.deckZ('E', x) : floorAt(k, x))); }
        g.closePath(); g.fillStyle = L ? 'rgba(60,195,255,0.55)' : 'rgba(33,150,210,0.85)'; g.fill();
      }
    }
    // the core's pockets, each its own fill in its own place in its compartment: from its floor to its level (the core's
    // law, the level cut at the centreline as above), to its top once full (G7's tank: the orlop's flat)
    pkDrawn.diagram = [];
    (sim.pockets || []).forEach((k, j) => {
      if (j >= POCKETS || k.state !== 0 || !(k.cap > 0) || !(k.vol > 0.5)) return;
      const full = k.vol >= k.cap * 0.998, h = C.worldZ(F, k.xc, k.yc, pocketFill(k));
      const topAt = (x) => (k.deck ? C.deckZ(k.deck, x) : k.z1), zAt = (x) => (full ? topAt(x) : Math.max(k.z0, Math.min(topAt(x), planeZ(h, x))));
      g.beginPath();
      const N = 6;
      for (let i = 0; i <= N; i++) { const x = k.x0 + (k.x1 - k.x0) * i / N; i ? g.lineTo(X(x), Zp(zAt(x))) : g.moveTo(X(x), Zp(zAt(x))); }
      g.lineTo(X(k.x1), Zp(k.z0)); g.lineTo(X(k.x0), Zp(k.z0));
      g.closePath(); g.fillStyle = 'rgba(33,150,210,0.85)'; g.fill();
      pkDrawn.diagram.push({ j, name: k.name, x0: k.x0, x1: k.x1, full, z: zAt(0.5 * (k.x0 + k.x1)) });
    });
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
    // a watch: plating the ice dented without opening it (amber), and the bow if her stem went in
    if (S.night && sim.enc) {
      const e = sim.enc; g.fillStyle = '#ffb547';
      for (const D of [e.stbd, e.port]) for (let k = 0; k < e.bands.length; k++) {
        const B = e.bands[k], dn = D[k].dent;
        for (let i = 0; i < B.n; i++) if (dn[i] > 0.005 && dn[i] <= (B.dt ? B.dt[i] : e.P.dTear)) g.fillRect(X(B.xs[i]) - 1, Zp(B.zs[i]) - 1, 2, 2);
      }
      if (e.bow > 0.05) { g.fillStyle = 'rgba(255,93,61,0.30)'; g.fillRect(X(e.xStem - e.bow), padT, X(e.xStem) - X(e.xStem - e.bow), H - padT - padB); }
    }
    // the parts' marks (diagramMark): a place a part names, in her frame (x forward, z up from the keel), drawn last as a
    // box with its label over it [appearance]
    stripMarks.forEach((m) => {
      const xa = X(Math.min(m.x0, m.x1)), xb = X(Math.max(m.x0, m.x1)), za = Zp(Math.max(m.z0, m.z1)), zb = Zp(Math.min(m.z0, m.z1)), col = m.color || '#f5d76e';
      g.strokeStyle = col; g.lineWidth = 1.6; g.strokeRect(xa - 1, za, Math.max(3, xb - xa) + 2, Math.max(3, zb - za));
      if (m.label) { g.fillStyle = col; g.font = '600 10px "IBM Plex Sans Condensed", "Arial Narrow", sans-serif'; g.textAlign = 'center'; g.fillText(m.label, Math.min(W - 24, Math.max(24, 0.5 * (xa + xb))), Math.max(padT + 9, za - 3)); }
    });
  }
  // a part's mark on the damage diagram: diagramMark(owner, { x0, x1, z0, z1, label, color }) puts it (one an owner),
  // diagramMark(owner, null) takes it away; drawn at the strip's next refresh
  const stripMarks = new Map();
  function diagramMark(owner, m) {
    const who = String(owner);
    if (m && [m.x0, m.x1, m.z0, m.z1].every(v => typeof v === 'number' && isFinite(v))) stripMarks.set(who, { x0: m.x0, x1: m.x1, z0: m.z0, z1: m.z1, label: m.label ? String(m.label) : '', color: m.color || null });
    else stripMarks.delete(who);
    S.lastStrip = 0;
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
      // NH3: the kept set's band, least to most, behind the lines [appearance: its colour]
      if (d.band && d.band.length > 1) {
        const bx = (b) => X(Math.min(b[0], tMax)), by = (v) => Y(Math.max(y0, Math.min(y1, v)));
        g.save(); g.fillStyle = 'rgba(33,150,210,0.16)'; g.beginPath();
        d.band.forEach((b, i) => (i ? g.lineTo(bx(b), by(b[2])) : g.moveTo(bx(b), by(b[2]))));
        for (let i = d.band.length - 1; i >= 0; i--) g.lineTo(bx(d.band[i]), by(d.band[i][1]));
        g.closePath(); g.fill(); g.restore();
      }
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
      const bd = nearest(d.band || [], t);         // NH3: the kept set's band at the nearest of its 5-minute points
      if (bd) { const r = document.createElement('div'); r.style.color = '#a8bbcb'; r.textContent = 'the kept set ' + d.yFmt(bd[1], true) + ' to ' + d.yFmt(bd[2], true) + ' (' + bd[3] + ' afloat)'; tip.appendChild(r); }
      tip.style.display = 'block';
      const left = Math.min(px + 12, cv.clientWidth - 150); tip.style.left = Math.max(0, left) + 'px'; tip.style.top = '8px';
    });
    cv.addEventListener('pointerleave', () => { tip.style.display = 'none'; draw(); });
    st.draw = draw;
    return st;
  }
  // the eyewitness points belong to the 1912 damage: the preset, and the 1912 watch (there they count from the touch)
  const isTitanic = () => S.scen === 'titanic' || S.scen === 'watch';
  const minutesFmt = (t, long) => { const c = clockOf(t * 60); return long ? (c ? `${c} · T+${Math.round(t)} min` : `T+${Math.round(t)} min`) : (c && isTitanic() ? c.replace(' am', '').replace(' pm', '') : `${Math.round(t)}m`); };
  function chartData(key, yr, ticks, fmtY, obs) {
    return () => {
      const run = S.hist.map(h => [h.t / 60, h[key]]);
      const f = S.forecast; const fc = f ? f.hist.map(h => [h.t / 60, h[key]]) : [];
      const tEnd = Math.max(f ? f.endT / 60 : 0, S.sim.t / 60, isTitanic() ? 165 : 30);
      const endMark = f && f.over && !f.foundered ? { t: f.overT / 60, label: 'breaks' } : (f && f.foundered ? { t: f.founderT / 60, label: 'founders' } : null);   // QC B-4
      const shift = S.night ? (S.sim.night.tTouch > 0 ? S.sim.night.tTouch : 60) / 60 : 0;
      // NH3: the kept set's band of this quantity (least to most of the members still afloat, every 5 min), where its table
      // applies (keptRun), its time counted from the touch as the record's points are
      const kr = keptRun(), band = kr ? ENS.bands[kr].filter(b => b[key] && b[key].lo !== null && b[key].hi !== null).map(b => [b.T + shift, b[key].lo, b[key].hi, b[key].n]) : [];
      return { run, forecast: fc, obs: isTitanic() ? obs.map(o => [o[0] + shift, o[1]]) : [], band, tMax: Math.min(tEnd, 480), yRange: yr(run, fc), yTicks: ticks, yFmt: fmtY, xFmt: minutesFmt, endMark };
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
    // RC2 (the red team's row 21): the middle column is the record as the model holds it, and for the five events and
    // the trim that is Halpern's reconstruction from the witnesses (2023), not sightings with a clock: the header says "The
    // record" and a line under the table says whose it is. Wheat's own answer for the water down the stair is about
    // 12:45, where the reconstruction has 12:55, so that row gives both (the ledger's row wheat_stair_f). Wilding's
    // 16,000 tons was his working assumption, and the row says so
    const wheat = SC.RECORD_1912 ? SC.RECORD_1912.find(r => r.id === 'wheat_stair_f') : null;
    const rows = SC.OBS.events.map(o => [o.label, o.id === 'overF' && wheat && Array.isArray(wheat.sigma) ? clockAt(wheat.sigma[0]) + ' to ' + clockAt(wheat.sigma[1]) : o.t, find(o.id)]);
    rows.push(['Trim at 2:15 am (Halpern\'s reconstruction)', '10.0°', VAL.titanic ? (VAL.titanic.hist.find(h => h[0] >= 155) || [0, 0])[1].toFixed(1) + '°' : '–']);
    rows.push(['Foundered (stern under)', 160, VAL.titanic ? VAL.titanic.founderMin : null]);
    rows.push(['16,000 tons aboard (Wilding\'s assumption)', 40, VAL.titanic ? VAL.titanic.wildingMin : null]);
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
      // RC2 (the red team's row 6; B1+B2's reading of 2026-11-24): the record is divided here, and on nearby cases only,
      // so the row gives both and passes no verdict. The Court's Report ("Effect of Additional Subdivision upon
      // Floatation") never considers every bulkhead to B deck: it has her afloat with the bulkhead abaft No. 5 boiler room
      // carried to C deck, or with a watertight bulkhead deck, on the damage certainly known, and lost if No. 4 flooded
      // too unless the bulkhead abaft it also went to D deck. Wilding: "No possible vertical extension of the existing
      // bulkheads" would save her with No. 4 flooded (BI 20956; in 1915, "No height of bulkhead") [read: the Report's page
      // at titanicinquiry.org; Wilding through Chirnside's page]. The model's what-if keeps No. 4 dry
      ['Titanic, bulkheads to B deck', 'Divided, on nearby cases. The Court\'s Report: afloat if No. 4 boiler room stayed dry. Wilding: lost once it flooded', out('titanicB')],
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
  // ---- claims (QC C-4 step 3; docs/DESIGN_page_layout_authority_v1_1_2026-11-21.md, section 4). What a part changes of
  // the page's it claims, and never saves and gives back: claim(key, owner, value, rank) stands until that owner releases
  // it (value undefined or null), and when the last claim goes the page's own is back; claims(key) lists them in the
  // order made ({ owner, value, rank, n }). Each key has one rule (RULES):
  //   any      in force while any claim stands (the marks of the damage hidden)
  //   rank     the highest rank's value; between equal ranks the earlier claim (by n, never by the clock)
  //   player   the player's choice unless claimed (then as rank); the player's input while a claim stands is the later
  //            choice: the page tells each claimant ('event' 'overruled', { key, owner }), and the claimant decides
  // (the pace keeps holdPace's own form: a hold per owner, the page held while any runs). The page applies a key at once
  // when its claims change; the marks are applied every frame (updateScene)
  const RULES = { 'marks.openings': 'any', 'marks.dents': 'any', 'look.xray': 'player', 'look.cols': 'player', 'material.hull': 'rank', 'material.pieces': 'rank' };
  const claimed = new Map();                       // key -> [{ owner, value, rank, n }], in the order made
  let claimN = 0;
  function claims(key) { return (claimed.get(key) || []).map(c => Object.assign({}, c)); }
  function claimValue(key) {                       // the claims' value under the key's rule; undefined while none stands
    const L = claimed.get(key); if (!L || !L.length) return undefined;
    if (RULES[key] === 'any') return true;
    let best = L[0]; for (const c of L) if (c.rank > best.rank) best = c;
    return best.value;
  }
  function claim(key, owner, value, rank) {
    if (!RULES[key]) throw new Error('TitanicApp.claim: no such key: ' + key);
    const who = String(owner), was = claimed.get(key) || [], old = was.find(c => c.owner === who), r = +rank || 0;
    const L = was.filter(c => c.owner !== who);
    if (value !== undefined && value !== null) {
      L.push({ owner: who, value, rank: r, n: old && old.value === value && old.rank === r ? old.n : ++claimN });   // restated: its place kept
      L.sort((a, b) => a.n - b.n);
    }
    claimed.set(key, L);
    applyKey(key);
  }
  function applyKey(key) {
    if (key === 'look.xray') resolveXray(); else if (key === 'look.cols') resolveCols();
    else if (key === 'material.hull') applyHull();
    else if (key === 'material.pieces') { fall.look = claimValue('material.pieces') || null; hullSeen(fall.look); }   // over the hull's own, cut for each piece
  }
  // X-ray and the columns, player-first: S.xray and S.cols are what is shown (the claims' value, else the player's own
  // choice, S.xrayChoice and S.colsChoice), so whatever reads them reads the look as it is. The player's click, or a
  // damage tool's need of X-ray, is the later choice (choose): each claimant of another value is told, and decides
  function resolveXray() {
    const v = claimValue('look.xray'), want = v === undefined ? S.xrayChoice : !!v;
    if (want === S.xray) return;
    S.xray = want; $('bXray').setAttribute('aria-pressed', String(S.xray)); applyLook();
  }
  function resolveCols() {
    const v = claimValue('look.cols'), want = v === undefined ? S.colsChoice : !!v;
    if (want === S.cols) return;
    S.cols = want; $('bCols').setAttribute('aria-pressed', String(S.cols)); colMesh.visible = S.cols; pkCol.visible = S.cols;
  }
  function choose(key, on) {
    if (key === 'look.xray') S.xrayChoice = on; else if (key === 'look.cols') S.colsChoice = on; else return;
    for (const c of claims(key)) if (c.value !== on) fire('event', 'overruled', { key, owner: c.owner });
    applyKey(key);
  }
  // the marks of the damage (the markers of her openings; the dents and opened seams) by the page's own rule (the
  // openings always; the dents with a watch's scene) unless a part claims them hidden (marks.openings, marks.dents: a
  // part's look or view claims them while it is on, TitanicApp.marks.claim(kind, who, on) being another name for it),
  // and no part saves and gives back another's visibility (QC C-5: the bridge's view and the Night look undid each other)
  function claimMarks(kind, who, on) { if (RULES['marks.' + kind]) claim('marks.' + kind, who, on ? true : null); }
  function updateScene(time) {
    const sim = S.sim;
    holeGroup.visible = claimValue('marks.openings') === undefined;
    dentPts.visible = earth.visible && claimValue('marks.dents') === undefined;
    const { M, F } = poseMatrix(sim, S.post);
    shipGroup.matrix.copy(M); shipGroup.matrixWorldNeedsUpdate = true;
    shipGroup.updateMatrixWorld(true);
    invM.copy(M).invert();
    fallFrame(sim);                               // the fall: her pieces, each at its own pose (none before the flag)
    // levels (three world y = physical Z)
    const lv = levelUniform.value;
    for (let n = 0; n < NN; n++) lv[n] = sim.vol[n] > 1e-3 ? sim.level[n] - S.post : -1e4;
    // and each pocket holding water, for the X-ray tint: its walls, its side, its own level in the world (the core's law
    // for its fill, through its middle, as its free surface below), full ones too; -1e4 for one that holds none, has
    // given way, or is not there
    {
      const pks = sim.pockets || [], pb = pkTint.box.value, ps = pkTint.side.value, pl = pkTint.lev.value;
      pkDrawn.tint = [];
      for (let j = 0; j < PK_TINT; j++) {
        const k = pks[j], on = !!(k && k.state === 0 && k.cap > 0 && k.vol > 0.5);
        pl[j] = on ? C.worldZ(F, k.xc, k.yc, pocketFill(k)) - S.post : -1e4;
        if (on) { pb[j].set(k.x0, k.x1, k.z0, k.z1); ps[j] = k.side < 0 ? 2 : k.side; pkDrawn.tint.push({ j, name: k.name, lev: pl[j], x0: k.x0, x1: k.x1, z0: k.z0, z1: k.z1, side: k.side }); }
      }
    }
    const camY = camera.position.y;
    hullXray.uniforms.uCamY.value = camY; hullXray.uniforms.uTime.value = time; hullSolid.uniforms.uCamY.value = camY;
    seaMat.uniforms.uTime.value = time; seaMat.uniforms.uCam.value.copy(camera.position);
    sea.position.set(camera.position.x, 0, camera.position.z);
    if (S.night) updateWatchScene(sim);
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
      const show = S.xray && V > 0.5 && V < vmax * 0.998 && !fall.list.length;
      m.visible = show; if (!show) continue;
      const k = n >> 2, Z = ship.zones[k];
      const y = lv[n];
      // world-space footprint of the zone at this level
      let minX = 1e9, maxX = -1e9, minZ = 1e9, maxZ = -1e9;
      for (const xx of [Z.xa, Z.xf]) for (const yy of [-15, 15]) for (const zz of [0, TIER ? 34 : 26]) {
        v3.set(xx, zz, -yy).applyMatrix4(M);
        if (v3.x < minX) minX = v3.x; if (v3.x > maxX) maxX = v3.x; if (v3.z < minZ) minZ = v3.z; if (v3.z > maxZ) maxZ = v3.z;
      }
      m.position.set((minX + maxX) / 2, y, (minZ + maxZ) / 2);
      m.scale.set(maxX - minX + 2, 1, maxZ - minZ + 2);
      const u = m.material.uniforms; u.uInv.value.copy(invM); u.uTime.value = time; u.uCamY.value = camY;
    }
    // the pockets' free surfaces (each while it fills, holding: one that gave way put its water into its space)
    pkDrawn.surfaces = []; pkDrawn.columns = [];
    const pks = sim.pockets || [];
    for (let j = 0; j < POCKETS; j++) {
      const m = pkFs[j], k = pks[j];
      const show = !!(k && S.xray && k.state === 0 && k.cap > 0 && k.vol > 0.5 && k.vol < k.cap * 0.998 && !fall.list.length);
      m.visible = show; if (!show) continue;
      const y = C.worldZ(F, k.xc, k.yc, pocketFill(k)) - S.post;
      let minX = 1e9, maxX = -1e9, minZ = 1e9, maxZ = -1e9;
      for (const xx of [k.x0, k.x1]) for (const yy of [-15, 15]) for (const zz of [k.z0, k.z1]) {
        v3.set(xx, zz, -yy).applyMatrix4(M);
        if (v3.x < minX) minX = v3.x; if (v3.x > maxX) maxX = v3.x; if (v3.z < minZ) minZ = v3.z; if (v3.z > maxZ) maxZ = v3.z;
      }
      m.position.set((minX + maxX) / 2, y, (minZ + maxZ) / 2);
      m.scale.set(maxX - minX + 2, 1, maxZ - minZ + 2);
      const u = m.material.uniforms; u.uInv.value.copy(invM); u.uTime.value = time; u.uCamY.value = camY;
      u.uXa.value = k.x0; u.uXf.value = k.x1; u.uSide.value = k.side < 0 ? 2 : k.side; u.uFloor.value = k.z0; u.uTop.value = k.z1;
      pkDrawn.surfaces.push({ j, name: k.name, y, x0: k.x0, x1: k.x1, side: k.side });
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
      if (S.night) { const rr = 0.35 + Math.sqrt(o.rec.area) * 0.9; o.dot.scale.set(rr, rr, rr); }   // seams open wider as the ice works
    }
    // physics columns
    if (S.cols) updateColumns(F);
    // camera follow
    if (S.follow) {
      const fp = fallFocus();                     // she falls: the piece the view is with, held exactly, with no floor
      if (fp) ctl.target.copy(fp);
      else if (ctl.tz !== undefined) { v3.set(ctl.tx, ctl.tz, 0).applyMatrix4(M); ctl.target.lerp(v3, 0.12); }   // a view of one part of her: that point exactly
      else { v3.set(ctl.tx, 8, 0).applyMatrix4(M); ctl.target.lerp(new THREE.Vector3(v3.x, Math.max(-60, v3.y * 0.6), v3.z), 0.06); }
    }
    updateStern(sim);
    topsides.frame(sim);                            // the davits' arms with the boats; a dome's glass gone when the model says so
    if (S.night) {
      const tNow = sim.t + (S.playing && !gone(sim) ? S.acc : 0);
      wake.frame(sim, tNow, M, F, clock.t); washFx.frame(sim, M, F); smoke.frame(tNow); steam.frame(tNow);
    }
  }
  // the watch: turn and move the earth under her, put the berg where the model has it, lay her track
  function updateWatchScene(sim) {
    const m = sim.mo, w = sim.night, e = sim.enc;
    // her place drawn where she is now, between steps: the last step's state carried on by the part of a step not yet
    // taken (the model steps 4 times a second; at 22 knots that is 3 m, which the sea and the wake would show as a stutter)
    const lag = S.playing && !gone(sim) ? S.acc : 0, c0 = Math.cos(m.psi), s0 = Math.sin(m.psi);
    const Xd = m.X + (m.u * c0 - m.v * s0) * lag, Yd = m.Y + (m.u * s0 + m.v * c0) * lag, psi = m.psi + m.r * lag;
    const c = Math.cos(psi), s = Math.sin(psi), dx = Xd - E0.x, dy = Yd - E0.y;
    earth.rotation.y = psi; earth.position.set(-(dx * c + dy * s), 0, dx * s - dy * c);
    const u = seaMat.uniforms;
    u.uPsi.value = psi; u.uPos.value.set(Xd, Yd); u.uPosG.value.set(Xd % 20, Yd % 20);
    if (S.stars) S.stars.rotation.y = psi;
    // the berg: unseen until the bells, then looming out of the dark over two seconds
    if (berg) {
      berg.group.position.set(e.berg.X - E0.x, 0, e.berg.Y - E0.y);
      berg.group.rotation.y = -(e.berg.PSI || 0);      // the berg's own heading (it turns only if ICE.turns)
      const seen = w.tBells < 0 ? 0 : Math.min(1, (sim.t - w.tBells) / 2 + 0.15);
      berg.group.visible = seen > 0;
      berg.above.material.opacity = seen;
      berg.under.visible = berg.edge.visible = S.xray;
      berg.under.material.opacity = 0.30 * seen; berg.edge.material.opacity = 0.85 * seen;
      updateBergRings(sim);
    }
    updateDents(sim);
    frontUniform.value = e.bow > 0.05 ? e.xStem - e.bow : 1e6;
    // her track, a point every 6 m; when the buffer is full the older half is dropped
    if (!trackLast || (m.X - trackLast[0]) * (m.X - trackLast[0]) + (m.Y - trackLast[1]) * (m.Y - trackLast[1]) > 36) {
      if (trackN >= TRACK_N) { trackPos.copyWithin(0, (TRACK_N / 2) * 3); trackN = TRACK_N / 2; }
      trackPos[trackN * 3] = dx; trackPos[trackN * 3 + 1] = 0.15; trackPos[trackN * 3 + 2] = dy; trackN++;
      trackLast = [m.X, m.Y];
      trackGeo.setDrawRange(0, trackN); trackGeo.attributes.position.needsUpdate = true;
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
    // the pockets among them: a box each, its volume the water it holds, min(vol, cap). A full pocket's over-fill stands
    // for the sea's head over its top, not for water with a place: it is counted (the Water readout), never drawn (the
    // mainline's rule for every mirror)
    const pks = sim.pockets || [];
    for (let j = 0; j < POCKETS; j++) {
      const b = pkBoxes[j], k = pks[j];
      const on = !!(k && k.state === 0 && k.cap > 0 && k.vol > 1e-3);
      b.visible = on; if (!on) continue;
      const len = k.x1 - k.x0, ht = k.z1 - k.z0, w = k.cap / (len * ht), h = pocketFill(k) - k.z0;
      const yc = k.side < 0 ? 0 : (k.side === 1 ? -w / 2 : w / 2);   // side 1: starboard, y < 0
      b.scale.set(len, h, w); b.position.set(0.5 * (k.x0 + k.x1), k.z0 + h / 2, -yc);
      pkDrawn.columns.push({ j, name: k.name, vol: len * h * w, x0: k.x0, x1: k.x1, side: k.side });
    }
  }

  // ===================================================================== the fall: her pieces, each at its own pose (Z2)
  // After the flag a fall engine, where the page has one (window.TitanicFall: begin(sim) once, then step(sim) a step at the
  // page's pace until sim.fall.done), keeps sim.fall, the contract of docs/BRAINSTORM_the_descent_to_the_bed_v2 (5.1):
  // pieces of her, each between x0 and x1 of her own frame, each at a pose of the core's own form. The world is the frame
  // C.frameOf(sim) poses her in at the flag (x along her heading, y to port, z up, the sea at z = 0); a point p of her
  // frame is at r + R(q) p, q = [w, x, y, z]; three.js takes (x, y, z) as (x, z, -y), as poseMatrix does. Each piece is
  // drawn as a copy of whatever hangs under the ship group, without what lies beyond its x0 and x1 (fallCopy, cutOf); the
  // marks of the flooding (openings, dents, columns, free surfaces) are the core's at the flag and stay behind, and the
  // water drawn in her is the core's at the flag, at the levels it left. The engine's events reach the parts as 'event'
  // ('fall', each event of sim.fall.events, once and in order) and every step as 'event' ('fallStep', sim). With no
  // engine none of this runs, and she slides 140 m and stops, as before.
  const CUT_WHOLE = 12;                           // m along her [appearance]
  // look: a part's material for her pieces' hull (pieceLook); hullMats: every material seen on her hull; hullU: the
  // uniforms given to them all (hullUniform)
  const fall = { list: [], ids: '', kids: [], prev: null, seen: 0, broken: false, look: null, hullMats: new Set(), hullU: {} }, fallV = new THREE.Vector3();
  // Z3: a preset's fall runs only where the preset has a sea (core/scenarios.js); a watch is at the 1912 site, where it always
  // runs, and there the night steps it (its reader), not the page
  const presetSea = () => (SC.PRESETS[S.scen] && SC.PRESETS[S.scen].sea) || null;
  const fallEngine = () => { const E = window.TitanicFall; return !fall.broken && E && typeof E.begin === 'function' && typeof E.step === 'function' && (S.night || presetSea()) ? E : null; };
  // she is gone (QC B-4): on a watch the night's own word, Night.over (the core's flag, or, on a watch handed over at the
  // break's onset, the what-if of D76 b, the onset B2's check found); on a preset the core's flag. On every default watch
  // and every preset it is the flag itself. goneT: when (the flag's time, or the onset's); broke: gone by the onset with
  // the flag still down, where the page says she broke (Bo, 11-21: "Go with yes")
  function gone(sim) { return !!(sim && (sim.night && NT ? NT.over(sim) : sim.foundered)); }
  function goneT(sim) {
    if (!gone(sim)) return null;
    if (sim.foundered) return sim.founderT;
    const o = sim.night.onset || sim.onset; return o && o.found ? o.found.t : sim.t;
  }
  function broke(sim) { return gone(sim) && !sim.foundered; }
  const falling = (sim) => !!(sim && gone(sim) && (sim.fall ? !sim.fall.done : fallEngine()));
  const tOf = (sim) => (sim.fall && sim.fall.t > sim.t ? sim.fall.t : sim.t);   // her time: the fall's, once it runs on past the flag
  function fallTry(f) { try { f(); return true; } catch (e) { fall.broken = true; console.error('the fall engine failed and was dropped:', e); return false; } }
  function fallTell(sim) { const ev = sim.fall.events || []; while (fall.seen < ev.length) fire('event', 'fall', ev[fall.seen++]); fire('event', 'fallStep', sim); }
  function fallBegin(sim) {
    const E = fallEngine(); if (!E || sim.fall) return;
    fall.seen = 0; fall.prev = null;
    if (sim.night) return;                        // Z3: on a watch the night's reader begins it, on its first step past the flag
    if (fallTry(() => E.begin(sim, { sea: presetSea() })) && sim.fall) fallTell(sim);
  }
  function fallSteps(sim, dt) {                   // the engine's steps as the model's are taken in frame(): at most 700 a frame
    if (!sim.fall) fallBegin(sim);
    const E = fallEngine(); if (!E || (!sim.fall && !sim.night)) return;
    S.acc += dt;
    let steps = Math.floor(S.acc / DT);
    if (steps > 700) { steps = 700; S.acc = 0; } else S.acc -= steps * DT;
    for (let i = 0; i < steps && !(sim.fall && sim.fall.done); i++) {
      fall.prev = sim.fall ? sim.fall.pieces.map(p => ({ r: p.r.slice(), q: p.q.slice() })) : null;   // to draw between steps as the step went
      if (sim.night) { if (!fallTry(() => NT.step(sim))) return; }   // Z3: the watch steps on: her clock, the readers and the fall (its reader)
      else if (!fallTry(() => E.step(sim))) return;
      if (!sim.fall) continue;                    // a watch's first step past the flag begins it
      fallTell(sim);
      if (sim.fall.done) { S.playing = false; syncPlay(); }
      if (!S.playing) break;                      // done, or a part (or a test) stopped the clock on this very step
    }
  }
  function fallMatrix(i, p, lag, out) {           // the mapping, once; lag: seconds past the step, carried on as it went
    let X = p.r[0], Y = p.r[1], Z = p.r[2], w = p.q[0], x = p.q[1], y = p.q[2], z = p.q[3];
    const o = lag > 0 && fall.prev && fall.prev[i];
    if (o) {
      const f = lag / DT, s = w * o.q[0] + x * o.q[1] + y * o.q[2] + z * o.q[3] < 0 ? -1 : 1;
      X += (X - o.r[0]) * f; Y += (Y - o.r[1]) * f; Z += (Z - o.r[2]) * f;
      w += (w - s * o.q[0]) * f; x += (x - s * o.q[1]) * f; y += (y - s * o.q[2]) * f; z += (z - s * o.q[3]) * f;
    }
    const n = 1 / Math.sqrt(w * w + x * x + y * y + z * z); w *= n; x *= n; y *= n; z *= n;
    return out.set(1 - 2 * (y * y + z * z), 2 * (x * z + w * y), -2 * (x * y - w * z), X,
      2 * (x * z - w * y), 1 - 2 * (x * x + y * y), -2 * (y * z + w * x), Z,
      -2 * (x * y + w * z), -2 * (y * z - w * x), 1 - 2 * (x * x + z * z), -Y, 0, 0, 0, 1);
  }
  // A piece is a copy of each object under the ship group, its geometry shared. What crosses a cut is cut, by one
  // mechanism in her frame, whatever draws it: a shader material (the page's or a part's) by a copy of it whose uniforms
  // are the original's own objects plus the piece's cut, with two lines put in at copy time, never by editing its text
  // (uCutX, uCutM: a fragment beyond x0 or x1 is discarded), made again whenever its text changes; one of three.js's own
  // by clipping planes from the piece's pose. Anything instanced is cut; anything else shorter than CUT_WHOLE goes whole,
  // with the piece its middle lies in. Where a cut crosses her hull it is closed flat with the section there of whatever
  // hull is drawn [appearance: the torn end]. A part may draw the pieces' hull with a material of its own (pieceLook), and
  // put a uniform on every hull material and every copy of one at once (hullUniform).
  const CUT_MAIN = /void\s+main\s*\(\s*\)\s*\{/;
  function cutOf(P, m, hull) {                    // the piece's cut copy of the material m, its look as the page sets m's
    let c = P.cuts.get(m);
    if (c && m.isShaderMaterial && (c.userData.vs !== m.vertexShader || c.userData.fs !== m.fragmentShader)) { P.from.delete(c); c.dispose(); c = null; }
    if (!c) {
      c = m.clone();
      if (m.isShaderMaterial) {
        c.uniforms = Object.assign({}, m.uniforms, { uCutX: P.cut, uCutM: P.inv });
        // D97: a piece's ports, and their reflections in the Night look (on the same uOn), at its own supply (fallFrame)
        if (m.uniforms.uOn && m.uniforms.uOn === ports.mat.uniforms.uOn) c.uniforms.uOn = P.portOn || (P.portOn = { value: ports.mat.uniforms.uOn.value, last: ports.mat.uniforms.uOn.value });
        c.vertexShader = m.vertexShader.replace(CUT_MAIN, (s) => 'uniform mat4 uCutM; varying float vCutX;\n' + s + ' vCutX = (uCutM * modelMatrix * vec4(position, 1.0)).x;');
        c.fragmentShader = m.fragmentShader.replace(CUT_MAIN, (s) => 'uniform vec2 uCutX; varying float vCutX;\n' + s + ' if (vCutX < uCutX.x || vCutX > uCutX.y) discard;');
        c.userData.vs = m.vertexShader; c.userData.fs = m.fragmentShader;
      } else c.clippingPlanes = P.planes;
      c.userData.hull = !!hull;
      P.cuts.set(m, c); P.from.set(c, m);
    }
    c.opacity = m.opacity; c.depthWrite = m.depthWrite; c.visible = m.visible;
    if (m.color && c.color) c.color.copy(m.color);
    if (m.emissive && c.emissive) c.emissive.copy(m.emissive);
    if (c.transparent !== m.transparent) { c.transparent = m.transparent; c.needsUpdate = true; }
    return c;
  }
  function capOf(geo, xc, out) {                  // the section of geo (her frame) at x = xc, closed flat facing out (-1, 1)
    const pa = geo.attributes.position, ix = geo.index ? geo.index.array : null, n = ix ? ix.length : pa.count, v = [0, 1, 2].map(() => new THREE.Vector3()), pts = [];
    for (let t = 0; t + 2 < n; t += 3) {
      for (let k = 0; k < 3; k++) v[k].fromBufferAttribute(pa, ix ? ix[t + k] : t + k);
      for (let k = 0; k < 3; k++) { const a = v[k], b = v[(k + 1) % 3]; if ((a.x - xc) * (b.x - xc) < 0) { const f = (xc - a.x) / (b.x - a.x); pts.push([a.y + (b.y - a.y) * f, a.z + (b.z - a.z) * f]); } }
    }
    if (pts.length < 3) return null;
    let cy = 0, cz = 0; for (const p of pts) { cy += p[0]; cz += p[1]; } cy /= pts.length; cz /= pts.length;
    pts.sort((p, q) => Math.atan2(p[1] - cz, p[0] - cy) - Math.atan2(q[1] - cz, q[0] - cy));   // round her section (it is star-shaped about its middle)
    const pos = [xc, cy, cz], idx = [];
    for (const p of pts) pos.push(xc, p[0], p[1]);
    for (let k = 0; k < pts.length; k++) { const i = 1 + k, j = 1 + (k + 1) % pts.length; if (out > 0) idx.push(0, i, j); else idx.push(0, j, i); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    return g;
  }
  // ---- her topsides on her pieces (Z1's sources, its note q23, B.6: the record first, then the rendering). No funnel
  // stands on either piece of the wreck [measured], so none is drawn on a falling piece from the fall's first frame [read:
  // No. 1 and No. 2 fell at the surface, No. 3 at the break, No. 4 at the latest in the fall's first seconds, a bet], nor
  // its shrouds (Lynch 1992, through Wikipedia), nor the aerial, which spanned the break [appearance]; each funnel's black
  // base flange stays where it stood [appearance: the base; read, through Z1's note: Mengot has the No. 2 uptake's
  // structure sunk into her, and only small remains of the funnels themselves; the X-ray look draws no flange at all]. The
  // foremast lies on the bow at the bed, laid back across
  // the well deck onto the port side of the bridge, its crow's nest on it (Ballard 1987, p. 204; the 1985 and 1986
  // photographs): here it turns about its foot from the bow's strike on the bed over TOPS.lay s of her fall [bet: when; the
  // record has the end state only] until its axis rests on the front edge of the drawn bridge's roof (site/topsides.js,
  // N.bridge), TOPS.port of the roof's half-breadth to port (3 m) [bet: where on "the port bridge area"]. The angle that
  // gives, 72 degrees from her upright, is this drawing's, not a measurement: the wreck's bridge front was pushed down where
  // the mast fell on it, so there it lies a little lower. Its derrick is laid along it [appearance], its stays gone
  // [appearance]. No part of the wreck has the
  // mainmast: it leaves the stern at the stern's strike [bet: when], with its stays. The ranges of each are site/topsides.js's
  // (parts); a piece draws the topsides' sets with an index of its own that leaves them out, and each mast apart, turned
  // about its foot. A mast is drawn on the piece its foot is on.
  const TOPS = { lay: 2.5, port: 2 / 3 };
  let topsFall = null;
  function topsOf() {                             // once: the geometries the pieces draw her topsides with (null: none)
    if (topsFall !== null) return topsFall;
    const Pt = topsides.T && topsides.T.parts;
    if (!Pt) return (topsFall = false);
    const sets = Object.assign({}, topsides.faces, { edges: topsides.edges, rigging: topsides.rigging });
    const isLine = (k) => k === 'edges' || k === 'rigging';
    const count = (k) => (isLine(k) ? sets[k].geometry.attributes.position.count / 2 : sets[k].geometry.index.count / 3);
    const geoOf = (k, ranges) => {                // the set's own attributes, drawn by an index of these ranges alone
      const src = sets[k].geometry, g = new THREE.BufferGeometry(), idx = [], a = src.index ? src.index.array : null;
      for (const name in src.attributes) g.setAttribute(name, src.attributes[name]);
      for (const [p, q] of ranges) for (let t = p; t < q; t++) { if (isLine(k)) idx.push(2 * t, 2 * t + 1); else idx.push(a[3 * t], a[3 * t + 1], a[3 * t + 2]); }
      g.setIndex(idx);
      if (!src.boundingSphere) src.computeBoundingSphere();
      g.boundingSphere = src.boundingSphere;     // the whole set's: a kept copy is culled as the set is
      return g;
    };
    const drop = {}, out = (at) => { for (const k in at) if (sets[k]) for (const r of at[k]) (drop[k] = drop[k] || []).push(r); };
    for (const f of Pt.funnels) out(f.at);
    out(Pt.aerial.at); out(Pt.nest.at); out(Pt.derrick.at);
    for (const m of Pt.masts) { out(m.at); out({ rigging: m.stays }); }
    const keep = (k) => { const r = drop[k].slice().sort((p, q) => p[0] - q[0]), o = []; let a = 0; for (const [p, q] of r) { if (p > a) o.push([a, p]); a = Math.max(a, q); } if (a < count(k)) o.push([a, count(k)]); return o; };
    const kept = new Map(); for (const k in drop) kept.set(sets[k], geoOf(k, keep(k)));
    const V = (p) => new THREE.Vector3(p[0], p[2], -p[1]);
    const partsOf = (...ats) => { const o = []; for (const at of ats) for (const k in at) if (sets[k]) o.push({ orig: sets[k], geo: geoOf(k, at[k]) }); return o; };
    // where the foremast comes to lie: its axis through a point on the front edge of the bridge's roof, the mast's radius
    // over it (N.mastR.hounds)
    const br = TS.N.bridge, yb = TOPS.port * br.hw, xb = TS.frontX(yb) - 0.1, onto = V([xb, yb, C.deckZ('Boat', xb) + br.h + TS.N.mastR.hounds]);
    const masts = Pt.masts.map(m => {
      const foot = V(m.foot), axis = V(m.top).sub(foot).normalize(), lay = m.id === 'fore';
      const o = { id: m.id, footX: m.foot[0], foot, axis, length: V(m.top).distanceTo(foot), parts: partsOf(m.at, lay ? Pt.nest.at : {}), stays: m.stays.length ? geoOf('rigging', m.stays) : null, lay, leaves: !lay, q: null, derrick: null };
      if (lay) {
        const to = onto.clone().sub(foot).normalize();
        o.q = new THREE.Quaternion().setFromUnitVectors(axis, to);
        const heel = V(Pt.derrick.heel), dAxis = V(Pt.derrick.head).sub(heel).normalize(), ns = topsides.T.nest;
        o.derrick = { heel, axis: dAxis, parts: partsOf(Pt.derrick.at), q: new THREE.Quaternion().setFromUnitVectors(dAxis, to) };
        o.nest = V([ns.x, 0, (ns.floor + ns.rim) / 2]);
      }
      return o;
    });
    return (topsFall = { kept, masts, funnels: Pt.funnels, aerial: Pt.aerial, sets });
  }
  function topsPivot(g, at, parts) {              // a group turned about `at` (three's), drawing these parts of the sets
    const pv = new THREE.Group(); pv.position.copy(at); g.add(pv);
    const objs = parts.map(({ orig, geo }) => { const ob = orig.isLineSegments ? new THREE.LineSegments(geo, orig.material) : new THREE.Mesh(geo, orig.material); ob.position.copy(at).negate(); ob.frustumCulled = false; pv.add(ob); return { ob, orig }; });
    return { pv, objs };
  }
  function topsCopy(P) {                          // the piece's topsides: the sets less what falls apart; its masts
    const TP = topsOf(); if (!TP) return;
    for (const [o, c] of P.pairs) { const k = TP.kept.get(o); if (k) c.geometry = k; }
    P.tops = TP.masts.filter(m => m.footX >= P.x0 && m.footX < P.x1).map(m => {
      const T = Object.assign({ m, u: 0, shown: true }, topsPivot(P.g, m.foot, m.parts));
      if (m.derrick) T.derrick = topsPivot(P.g, m.derrick.heel, m.derrick.parts);
      if (m.stays) { T.stays = new THREE.LineSegments(m.stays, topsides.rigging.material); T.stays.frustumCulled = false; P.g.add(T.stays); }
      return T;
    });
  }
  const struckAt = (f, p) => {                    // her fall's time when the piece p struck the bed; -Infinity if it did with no event; null
    for (const e of f.events || []) if (e.id === 'strike' && e.piece === p.id) return e.t;
    return p.state === 'striking' || p.state === 'at rest' ? -Infinity : null;
  };
  const QI = new THREE.Quaternion();
  function topsFrame(P, f, p, lag) {              // each frame: the masts as her fall has them; drawn as the page draws her sets
    // no boat rides down on her chocks: on a damage preset the page draws her twenty boats stowed (no watch, so no
    // launching), and as she went under any boat still aboard floated off [read: collapsibles A and B floated off her
    // deck; appearance: the rest]; on a watch the boats part draws hers and these are hidden already
    const sb = topsides.stowed && P.copyOf.get(topsides.stowed.group); if (sb) sb.visible = false;
    if (!P.tops) return;
    const t0 = struckAt(f, p), since = t0 === null ? -1 : f.t + lag - t0;
    const look = (o, ob) => { const c = P.copyOf.get(o); ob.material = c ? c.material : o.material; ob.visible = !!c && c.visible; ob.renderOrder = c ? c.renderOrder : o.renderOrder; };
    // a piece at rest with her deck down (its z axis pointing down in the world) has its laid mast under it, in the mud:
    // not drawn there (QC B-Z2-6)
    const down = P.g.matrix.elements[5] < 0, rest = p.state === 'at rest';
    for (const T of P.tops) {
      const m = T.m, struck = since >= 0;
      // laid by the time the piece rests, even if the fall's clock stops sooner (it stops when the last piece rests: QC B-Z2-3)
      if (m.lay) { const u = rest ? 1 : (struck ? Math.min(1, since / TOPS.lay) : 0); T.u = u * u * (3 - 2 * u); T.pv.quaternion.copy(QI).slerp(m.q, T.u); if (T.derrick) T.derrick.pv.quaternion.copy(QI).slerp(m.derrick.q, T.u); }
      T.buried = !!(m.lay && rest && down);
      T.shown = !(m.leaves && struck) && !T.buried;
      T.pv.visible = T.shown;
      if (T.derrick) T.derrick.pv.visible = T.shown;
      for (const { ob, orig } of T.objs) look(orig, ob);
      if (T.derrick) for (const { ob, orig } of T.derrick.objs) look(orig, ob);
      if (T.stays) { look(topsides.rigging, T.stays); T.stays.visible = T.stays.visible && !struck; }
    }
  }
  function fallCopy(p) {                          // a copy of the ship group for the piece p
    const x0 = p.x0, x1 = p.x1, g = new THREE.Group(); g.matrixAutoUpdate = false; scene.add(g);
    const local = [new THREE.Plane(new THREE.Vector3(1, 0, 0), -x0), new THREE.Plane(new THREE.Vector3(-1, 0, 0), x1)];
    const P = { id: p.id, x0, x1, g, local, planes: local.map(l => l.clone()), cut: { value: new THREE.Vector2(x0, x1) }, inv: { value: new THREE.Matrix4() },
      cuts: new Map(), from: new Map(), pairs: [], caps: [], hull: null, copyOf: new Map(), tops: null };
    const inv = new THREE.Matrix4().copy(shipGroup.matrixWorld).invert(), rel = new THREE.Matrix4(), box = new THREE.Box3();
    const skip = new Set([holeGroup, dentPts, colMesh, pkCol]);
    (function walk(o, into) {
      for (const ch of o.children) {
        if (skip.has(ch)) continue;
        const c = ch.clone(false);
        if (ch === hullMesh) P.hull = c;
        if (ch.isInstancedMesh) c.userData.cut = true;
        else if (ch.geometry) {
          let lo = -Infinity, hi = Infinity;
          try { rel.multiplyMatrices(inv, ch.matrixWorld); if (!ch.geometry.boundingBox) ch.geometry.computeBoundingBox(); box.copy(ch.geometry.boundingBox).applyMatrix4(rel); lo = box.min.x; hi = box.max.x; } catch (e) { /* no extent: cut */ }
          if (hi - lo < CUT_WHOLE) c.userData.out = !((lo + hi) / 2 >= x0 && (lo + hi) / 2 < x1);
          else if (hi <= x0 || lo >= x1) c.userData.out = true;
          else c.userData.cut = lo < x0 || hi > x1;
        }
        into.add(c); P.pairs.push([ch, c]); P.copyOf.set(ch, c); walk(ch, c);
      }
    })(shipGroup, g);
    topsCopy(P);
    const hb = hullMesh.geometry.boundingBox || (hullMesh.geometry.computeBoundingBox(), hullMesh.geometry.boundingBox);
    for (const [xc, out] of [[x0, -1], [x1, 1]]) {
      const geo = xc > hb.min.x + 0.01 && xc < hb.max.x - 0.01 ? capOf(hullMesh.geometry, xc, out) : null;
      if (geo) { const cap = new THREE.Mesh(geo, hullMesh.material); g.add(cap); P.caps.push(cap); }
    }
    renderer.localClippingEnabled = true;
    return P;
  }
  function fallClear() { for (const P of fall.list) { scene.remove(P.g); for (const c of P.cuts.values()) c.dispose(); for (const cap of P.caps) cap.geometry.dispose(); } fall.list = []; fall.ids = ''; fall.kids = []; }
  function hullSeen(m) { if (!m || fall.hullMats.has(m)) return; fall.hullMats.add(m); if (m.uniforms) Object.assign(m.uniforms, fall.hullU); }
  function pieceLook(m, owner) { claim('material.pieces', owner || 'deep', m || null); }   // C-4 step 3: a claim (the deep's lamp)
  function hullUniform(name, u) {                 // one uniform object on every hull material and every piece's copy of one
    fall.hullU[name] = u;
    for (const m of [hullXray, hullSolid, hullMesh.material]) hullSeen(m);
    for (const m of fall.hullMats) if (m.uniforms) m.uniforms[name] = u;
    for (const P of fall.list) for (const c of P.cuts.values()) if (c.userData.hull && c.uniforms) c.uniforms[name] = u;
    return u;
  }
  function fallFrame(sim) {                       // each frame, once the ship group is posed: her pieces posed, drawn like her
    hullSeen(hullMesh.material);
    const f = sim.fall, on = !!(f && f.pieces && f.pieces.length), kids = shipGroup.children;
    const ids = on ? f.pieces.map(p => p.id + ':' + p.x0 + ':' + p.x1).join() : '';
    if (ids !== fall.ids || (on && (kids.length !== fall.kids.length || kids.some((k, i) => k !== fall.kids[i])))) {
      fallClear();
      if (on) { fall.list = f.pieces.map(fallCopy); fall.ids = ids; fall.kids = kids.slice(); }
    }
    shipGroup.visible = !on;
    if (!on) return;
    const lag = S.playing && falling(sim) ? S.acc : 0, hm = fall.look || hullMesh.material;
    fall.list.forEach((P, i) => {
      fallMatrix(i, f.pieces[i], lag, P.g.matrix); P.g.matrixWorldNeedsUpdate = true;
      P.inv.value.copy(P.g.matrix).invert();
      for (let j = 0; j < 2; j++) P.planes[j].copy(P.local[j]).applyMatrix4(P.g.matrix);
      for (const [o, c] of P.pairs) {             // the look, the lights and the moving parts as the page sets them on her
        c.visible = o.visible && !c.userData.out; c.renderOrder = o.renderOrder;
        c.position.copy(o.position); c.quaternion.copy(o.quaternion); c.scale.copy(o.scale);
        if (!o.material) continue;
        const m = o === hullMesh ? hm : o.material;
        c.material = !c.userData.cut ? m : (Array.isArray(m) ? m.map(x => cutOf(P, x, false)) : cutOf(P, m, o === hullMesh));
      }
      for (const cap of P.caps) { cap.material = hm; cap.visible = hullMesh.visible; cap.renderOrder = hullMesh.renderOrder; }
      if (P.portOn) P.portOn.value = pieceOn(sim, i, P.portOn);
      topsFrame(P, f, f.pieces[i], lag);
    });
  }
  // D97: a piece's ports in the fall at its own supply (core/readers/fall.js's lights, G2: 1, the emergency share or 0,
  // and when it ended), fading over three seconds of her time as the ship's do; without the fall's lights, the ship's
  function pieceOn(sim, i, u) {
    const L = sim.fall && sim.fall.lights;
    if (!L || !L.level || L.level[i] === undefined) return ports.mat.uniforms.uOn.value;
    const lv = L.level[i];
    if (lv > 0) { u.last = lv; return lv; }
    const d = L.dark ? L.dark[i] : -1;
    return d >= 0 ? u.last * Math.min(1, Math.max(0, 1 - (tOf(sim) - d) / 3)) : 0;
  }
  function fallTops() {                           // for the tests: what each piece draws of her topsides
    const TP = topsOf(); if (!TP) return null;
    const drawnOf = (P, orig, ranges) => {        // how many of these triangles (segments) of the set orig the piece's copy keeps, in any look (the X-ray look hides the 'cap' set whole)
      const c = P.copyOf.get(orig); if (!c || !ranges || !ranges.length) return 0;
      const line = !!orig.isLineSegments, w = line ? 2 : 3, src = orig.geometry.index ? orig.geometry.index.array : null, mine = c.geometry.index ? c.geometry.index.array : null;
      const key = (a, t) => (line ? a[2 * t] + ',' + a[2 * t + 1] : a[3 * t] + ',' + a[3 * t + 1] + ',' + a[3 * t + 2]);
      let n = 0;
      if (!mine) { for (const [p, q] of ranges) n += q - p; return n; }
      const have = new Set(); for (let t = 0; t < mine.length / w; t++) have.add(key(mine, t));
      for (const [p, q] of ranges) for (let t = p; t < q; t++) if (have.has(line ? (2 * t) + ',' + (2 * t + 1) : key(src, t))) n++;
      return n;
    };
    const sum = (P, at) => { let n = 0; for (const k in at) n += drawnOf(P, TP.sets[k], at[k]); return n; };
    const her = (v) => [v.x, -v.z, v.y];          // three's (x, y, z) to her frame's
    const flanges = topsides.T.solids.filter(s => / flange$/.test(s.name)).map(s => [s.t0, s.t1]);   // each funnel's base, which stays
    return fall.list.map(P => ({
      id: P.id,
      funnels: TP.funnels.reduce((s, fu) => s + sum(P, fu.at), 0), aerial: sum(P, TP.aerial.at), flanges: drawnOf(P, topsides.faces.cap, flanges),
      boats: (() => { const c = topsides.stowed && P.copyOf.get(topsides.stowed.group); return !!(c && c.visible); })(),
      masts: (P.tops || []).map(T => {
        const m = T.m, up = (v) => Math.acos(Math.max(-1, Math.min(1, her(v)[2]))) * 180 / Math.PI, dir = m.axis.clone().applyQuaternion(T.pv.quaternion);
        const top = m.foot.clone().addScaledVector(dir, m.length), nest = m.nest ? m.nest.clone().sub(m.foot).applyQuaternion(T.pv.quaternion).add(m.foot) : null;
        return { id: m.id, shown: T.shown && T.pv.visible, buried: !!T.buried, drawn: T.objs.some(o => o.ob.visible), laid: T.u, fromUpright: up(dir), foot: her(m.foot), top: her(top),
          nest: nest ? her(nest) : null, stays: !!(T.stays && T.stays.visible), derrickFromUpright: T.derrick ? up(m.derrick.axis.clone().applyQuaternion(T.derrick.pv.quaternion)) : null };
      }),
    }));
  }
  // what the camera follows while she falls: the piece the view is with (VIEWS: piece, by id; else the first), held
  // exactly; a view of one part of her (tz) on the piece that part is in; a part's own point for its view while it gives
  // one (VIEWS: focus(), a point of the scene or null: site/parts/75_deep.js at rest)
  function fallFocus() {
    if (!fall.list.length) return null;
    const V = VIEWS[S.view] || {};
    if (typeof V.focus === 'function') { let p = null; try { p = V.focus(); } catch (e) { p = null; } if (p) return fallV.copy(p); }
    let P = ctl.tz !== undefined ? fall.list.find(Q => ctl.tx >= Q.x0 && ctl.tx < Q.x1) : null, x = ctl.tx, z = ctl.tz;
    if (!P) { P = fall.list.find(Q => Q.id === V.piece) || fall.list[0]; x = (Math.max(P.x0, xMinT) + Math.min(P.x1, xMaxT)) / 2; z = 8; }
    return fallV.set(x, z, 0).applyMatrix4(P.g.matrix);
  }
  function fallCamera() {                         // the camera's planes by its distance while she falls (Fathom's page)
    let near = (VIEWS[S.view] && VIEWS[S.view].near) || 0.5, far = 9000;   // the page's own, or the view's (VIEWS: near)
    if (fall.list.length && S.sim.fall) {
      let d = Infinity;
      for (const P of fall.list) d = Math.min(d, fallV.setFromMatrixPosition(P.g.matrix).distanceTo(camera.position));
      near = Math.max(0.5, Math.min(d, 2000) / 400);
      far = Math.max(9000, 3 * (d + ((S.sim.fall.sea && S.sim.fall.sea.depth) || 4000) + Math.abs(camera.position.y)));
    }
    if (camera.near !== near || camera.far !== far) { camera.near = near; camera.far = far; camera.updateProjectionMatrix(); }
  }

  // ---- the page's pace (S2): her seconds for each second of the page's clock, as the loop below runs them. A part may hold
  // it at her own for a while (site/parts/60_reports.js does when a report is brought to the bridge): the player's choice
  // (state.speed and its buttons) stands, and the page runs at it again when the hold ends. Each owner holds on its own
  // (QC C-7, finished when the parts pass their owners): the page is held while any owner's hold runs; a later hold
  // replaces that owner's; 0 ends that owner's; a new run ends every hold. A call with no owner is the anonymous owner's,
  // so a caller that passes none keeps the one hold it had. Returns when that owner's hold ends (the page's clock, ms), or 0
  function holdPace(seconds, owner) {
    const k = owner === undefined || owner === null ? '' : String(owner);
    if (seconds > 0) { const to = clock.t + 1000 * seconds; holds.set(k, to); return to; }
    holds.delete(k); return 0;
  }
  function endHolds() { holds.clear(); }
  const paceHeld = () => { for (const to of holds.values()) if (clock.t < to) return true; return false; };

  // ---- NH4, the scrubber (docs/DESIGN_NH4_the_scrubber_v1_2026-11-23.md). The whole run is kept every minute of her
  // time while the model steps (before she is gone: her fall is not kept in v1), so the page can go back to a kept minute
  // and play on from there exactly. A kept minute is:
  //   - the sim as plain data without the ship (the forecast's structured clone, with the readers' states);
  //   - the page's own run state;
  //   - each keeper's (TitanicApp.keeper: a part with a history of its own).
  // The encounter's state is kept once while it stands (it changes only at a contact; her berg's drift is kept each
  // minute). A watch scrubbed back gives its later orders again on their steps (the night's own script), so playing on is
  // the unbroken run; a new order drops them and the minutes after it (takeOver)
  const KEEP = { every: 60, phone: 300 };          // s of her time between kept minutes: every minute, every fifth on a phone
  const kept = { list: [], next: 0, rest: null, restT: null, logAll: null, scriptAll: null, histAll: null, queued: false, keepers: [], scrubbing: false, broken: false };
  function keepReset() { kept.list = []; kept.next = 0; kept.rest = null; kept.restT = null; kept.logAll = null; kept.scriptAll = null; kept.histAll = null; kept.queued = false; }
  const keepEvery = () => (isPhone() ? KEEP.phone : KEEP.every);
  function keepNow(sim) {
    const every = keepEvery();
    kept.next = (Math.floor(sim.t / every + 1e-9) + 1) * every;
    if (kept.broken) return;
    // a minute past the furthest kept: this run is the furthest again (its later orders all given, its history its own)
    if (kept.logAll || kept.histAll) { kept.queued = false; kept.logAll = null; kept.scriptAll = null; kept.histAll = null; }
    const o = {}; for (const k in sim) if (k !== 'ship' && k !== 'enc') o[k] = sim[k];
    let enc = null, berg = null;
    if (sim.enc) {
      if (sim.night && sim.night.tClear >= 0) {    // the ice behind her: its state stands until another contact, but for her berg's drift
        if (!kept.rest || kept.restT !== sim.enc.tLast) { const r = {}; for (const k in sim.enc) if (k !== 'berg') r[k] = sim.enc[k]; kept.rest = structuredClone(r); kept.restT = sim.enc.tLast; }
        berg = structuredClone(sim.enc.berg);
      } else enc = structuredClone(sim.enc);
    }
    let snap;
    try { snap = structuredClone(o); } catch (e) { kept.broken = true; console.error('the scrubber cannot keep this run (not plain data):', e); return; }
    const n = S.night, parts = {};
    for (const K of kept.keepers) { try { parts[K.name] = structuredClone(K.keep(sim)); } catch (e) { parts[K.name] = null; } }
    kept.list.push({ m: Math.round(sim.t / 60), t: sim.t, k: sim.night ? sim.night.k : Math.round(sim.t / DT), sim: snap, enc, rest: enc ? null : kept.rest, berg,
      logN: sim.night ? sim.night.log.length : 0,
      page: { histN: S.hist.length, histNext: S.histNext, lightsFailT: S.lightsFailT, lightsFailWhy: S.lightsFailWhy, lightsMainT: S.lightsMainT, lightsMainWhy: S.lightsMainWhy,
        screwRev: S.screwRev.slice(), lastRev: S.lastRev, beats: S.beats, circ: circ ? structuredClone(circ) : null,
        night: n ? { mode: n.mode, bells: n.bells, touched: n.touched, over: n.over, nOpen: n.nOpen, nLog: n.nLog } : null },
      parts });
  }
  // the kept minute at or before m
  function keptAt(m) { let e = null; for (const x of kept.list) { if (x.m <= m) e = x; else break; } return e; }
  function dropKeptAfter(t) { kept.list = kept.list.filter(x => x.t <= t + 1e-9); const every = keepEvery(); kept.next = (Math.floor(t / every + 1e-9) + 1) * every; }
  // a run scrubbed back (behind the furthest kept minute) goes a new way from here, by a new order (takeOver) or a hole
  // made by hand (holeOnWatch): the minutes kept after now are dropped, and the next scrub takes this run's own orders,
  // script and history as the furthest run's. Says whether it was scrubbed back
  function keptNewWay() {
    if (!(kept.logAll || kept.histAll)) return false;
    kept.queued = false; kept.logAll = null; kept.scriptAll = null; kept.histAll = null; dropKeptAfter(S.sim.t);
    return true;
  }
  // G32: a preset logs nothing, so what is done by hand in a run scrubbed back (a hole, an opening taken away, a door, the
  // fires) makes the run a new one from here: the minutes kept after now are dropped, once. The words are returned for the
  // caller's own notice, so a gesture gives one, and the parts hear 'ordersDropped' { index: null, t, by: 'hand' }
  function presetNewWay() {
    if (S.night || !S.sim || !keptNewWay()) return null;
    fire('event', 'ordersDropped', { index: null, t: S.sim.t, by: 'hand' });
    return 'The minutes kept after ' + (clockOf(S.sim.t) || 'T+' + hm(S.sim.t)) + ' are dropped: the run goes on its new way';
  }
  // to minute m (the kept minute at or before it): the run as it was there, paused; null when none is kept
  function scrub(m) {
    const sim = S.sim, e = keptAt(m);
    if (!sim || !e) return null;
    const w0 = sim.night;
    if (w0 && !kept.logAll) {                        // the furthest run's orders, and its script's entries still to come
      kept.logAll = w0.log.map(o => ({ k: o.k, type: o.type, value: o.value, arg: o.arg }));
      kept.scriptAll = w0.script ? w0.script.filter((o, i) => !w0.did[i]).map(o => Object.assign({}, o)) : [];
    }
    if (!kept.histAll) kept.histAll = S.hist;
    kept.scrubbing = true;
    try {
      S.playing = false;
      for (const k of Object.keys(sim)) if (k !== 'ship') delete sim[k];
      Object.assign(sim, structuredClone(e.sim));
      if (e.enc) sim.enc = structuredClone(e.enc);
      else if (e.rest) sim.enc = Object.assign(structuredClone(e.rest), { berg: structuredClone(e.berg) });
      const p = e.page;
      S.hist = kept.histAll.slice(0, p.histN); S.histNext = p.histNext; S.acc = 0; S.post = 0;
      S.lightsFailT = p.lightsFailT; S.lightsFailWhy = p.lightsFailWhy; S.lightsMainT = p.lightsMainT; S.lightsMainWhy = p.lightsMainWhy;
      // G32: her lights as they stood at the kept minute, with no fade and no notice. lightsFade would otherwise take the
      // change from the furthest run's light back to this minute's for news ("The main dynamos are lost")
      if (sim.plant) { S.lightsSim = sim; S.lightsFrom = S.lightsTo = sim.plant.lights; S.lightsT = -1e9; }
      S.screwRev = p.screwRev.slice(); S.lastRev = p.lastRev; S.beats = p.beats; circ = p.circ ? structuredClone(p.circ) : null;
      if (S.night && p.night) Object.assign(S.night, p.night);
      if (sim.night) {                               // the later orders again, on their steps: the night's own script
        const fut = kept.logAll.slice(e.logN).concat(kept.scriptAll).map(o => Object.assign({}, o));
        sim.night.script = fut.length ? fut : null; sim.night.did = fut.length ? new Uint8Array(fut.length) : null;
        kept.queued = fut.length > 0;
      }
      const last = kept.list[kept.list.length - 1];
      kept.next = last.t + keepEvery();             // the minutes up to the furthest are kept already
      // the log as it stood at the kept minute, drawn again quietly: those events were news when they came, not now (no
      // notice, no 'log' event to the parts; the log renderer goes on from here)
      S.forecast = null;
      { const body = $('logBody'); body.textContent = '';
        for (const ev of sim.events) { const tr = document.createElement('tr'), a = document.createElement('td'), b = document.createElement('td');
          a.className = 'num'; a.textContent = clockOf(ev.t) || 'T+' + hm(ev.t); b.textContent = ev.label; tr.append(a, b); body.insertBefore(tr, body.firstChild); }
        S.logShown = sim.events.length; }
      ports.reset(); endHolds();
      wake.reset(); washFx.reset(); smoke.reset(); steam.reset();
      fire('reset', sim);                            // every part as at a run begun here; the keepers' own history next
      for (const K of kept.keepers) { const st = e.parts[K.name]; if (st != null) { try { K.scrub(sim, structuredClone(st)); } catch (err) { console.error('a keeper failed to scrub (' + K.name + '):', err); } } }
      renderBulkheadTable(); syncPlay();
      if (!sim.night || sim.night.tClear >= 0) requestForecast();
    } finally { kept.scrubbing = false; }
    fire('event', 'scrub', { m: e.m, t: e.t });
    return { m: e.m, t: e.t };
  }
  // a watch runs in real time until the ice is passed (S.warp is a test hook: it multiplies that real time); 0 when paused,
  // and once she has gone (gone(): foundered, or broken on an onset watch), unless she is falling (the fall: the player's
  // pace, as after the ice)
  function pace() {
    const sim = S.sim;
    if (!S.playing || !sim || (gone(sim) && !falling(sim))) return 0;
    return S.night && !gone(sim) && NT.busy(sim) ? S.warp : (paceHeld() ? 1 : S.speed);
  }
  // the frame loop: one pass a frame, at the page's clock. In real mode each animation frame sets the clock and runs a pass;
  // in virtual mode the passes come only from a test (TEST, below), and a pass draws only when asked to
  clock.t = Math.max(clock.t, performance.now());
  let last = clock.t;
  function loop(ts) {
    if (!clock.virtual) { clock.t = Math.max(clock.t, ts + clock.off); framePass(true); }
    requestAnimationFrame(loop);
  }
  function framePass(render) {
    const now = clock.t;
    passDraws = !!render;
    runTimers();
    const dtReal = Math.min(0.1, (now - last) / 1000); last = now;
    const sim = S.sim, n = S.night, rate = pace();
    S.simDtFrame = dtReal * rate;
    if (S.playing && !gone(sim)) {
      S.acc += dtReal * rate;
      let steps = Math.floor(S.acc / DT);
      if (steps > 700) { steps = 700; S.acc = 0; } else S.acc -= steps * DT;
      for (let i = 0; i < steps; i++) {
        if (sim.t >= S.histNext) {
          const r = C.readouts(sim);
          S.hist.push({ t: sim.t, trim: r.trimDeg, list: r.listDeg, water: r.waterT });
          S.histNext = sim.t + 10;
        }
        if (n) {
          NT.step(sim);
          lightsOut(sim);
          if (HOOKS.step.length) fire('step', sim);
          const mo = sim.mo; S.screwRev[0] += mo.nP / 60 * DT; S.screwRev[1] += mo.nC / 60 * DT; S.screwRev[2] += mo.nS / 60 * DT;
          wake.afterStep(sim); washFx.afterStep(sim); smoke.afterStep(sim); steam.afterStep(sim);
          const rv = Math.floor(S.screwRev[2]);   // the starboard engine's beat, once a revolution, while time runs near her own pace
          if (rv !== S.lastRev) { S.lastRev = rv; S.beats++; if (S.simDtFrame <= 1.6 * dtReal) thump(); }
          const w = sim.night;
          if (!n.bells && w.tBells >= 0) { n.bells = true; onBells(); }
          if (!n.touched && w.tTouch >= 0) { n.touched = true; onTouch(); }
          if (!n.over && w.tClear >= 0) { n.over = true; onWatchOver(); break; }       // the rest of this frame's steps wait: time may now run faster
          // the forecast again when the damage changes, or (Y6) when an order of the model's own is given after the ice: the
          // scripted orders still to come were in the last one already, and a reader's order (a boat, a report, a rocket)
          // changes nothing in the model (S2). The page's orders and the parts' come through order(), which asks at once
          // and marks the log as seen; this catches any other (Night.act called from the console)
          if (n.over && (sim.openings.length !== n.nOpen || w.log.length !== n.nLog)) {
            let fresh = sim.openings.length !== n.nOpen;
            if (!w.script) for (let j = n.nLog; j < w.log.length && !fresh; j++) fresh = NT.owns(w.log[j].type);
            n.nOpen = sim.openings.length; n.nLog = w.log.length; if (fresh) requestForecast();
          }
        } else { C.step(sim); if (sim.plant) { SY.step(sim); lightsOut(sim); } if (circ) CI.step(sim, circ); if (HOOKS.step.length) fire('step', sim); }
        // she has gone (QC B-4: on an onset watch at the break's onset, where the page says she broke): the event keeps its
        // name, 'foundered', for the parts, which ask TitanicApp.broke(sim) for the words
        if (gone(sim)) { const E = fallEngine(); if (!E) S.playing = false; toast(`${broke(sim) ? 'She broke' : 'Foundered'} ${clockOf(sim.t) ? 'at ' + clockOf(sim.t) : ''}, ${hm(sim.t - damageT())} after the ${n ? 'touch' : 'damage'}`); renderBulkheadTable(); fire('event', 'foundered', sim); if (E) fallBegin(sim); break; }
        if (sim.t >= kept.next) keepNow(sim);       // NH4: a kept minute, after the step's hooks
        if (!S.playing) break;                      // a part (or a test) stopped the clock on this very step
      }
    } else if (S.playing && falling(sim)) fallSteps(sim, dtReal * rate);
    if (gone(sim) && !sim.fall && S.post < 140) S.post += dtReal * 14;   // with no fall engine: the old slide, 140 m
    if (renderer) { updateScene(now / 1000); applyCamera(); fallCamera(); updateLights(); }
    fire('frame', now / 1000, dtReal);
    if (renderer && render) {
      renderer.render(scene, camera);
      // pixel-ratio governor: a device that cannot hold 25 fps at this resolution gets a lower one, one step at a time (not
      // while the clock is virtual: a test's frame says nothing of the device)
      if (!clock.virtual) {
        perf.sum += dtReal; perf.n++;
        if (perf.n >= 90) {
          const avg = perf.sum / perf.n; perf.sum = 0; perf.n = 0;
          if (avg > 0.04 && perf.pr > 1 && !document.hidden) { perf.pr = Math.max(1, perf.pr - 0.25); renderer.setPixelRatio(perf.pr); resize(); }
        }
      }
    }
    if (now - S.lastUi > 120) { S.lastUi = now; updateHud(); }
    if (now - S.lastStrip > 66) { S.lastStrip = now; drawStrip(); }
    if (now - S.lastChart > 1000 && !document.querySelector('[data-pane="evidence"]').hidden) { S.lastChart = now; chTrim.draw(); chList.draw(); chWater.draw(); }
  }
  // QC C-3's test entry: a test hook, as state.warp is, inert until called.
  //   virtual(on)        the clock virtual or real; the page's time goes on from where it was either way. virtual(): only
  //                      whether it is
  //   frame(ms, { render })   one pass, the clock advanced by ms (at most 100: a frame's cap)
  //   run({ stop, frameMs, maxMs, render, held })   passes of frameMs (1000/60 unless given) until stop() holds, or (held,
  //                      the default) the clock is stopped (a part's or a test's step hook set playing false), or maxMs of
  //                      the page's time (600 s unless given) have passed; it yields to the event loop about every 30 ms of
  //                      real time, so that the forecast's worker and the page's slices get through. { done, frames, ms }:
  //                      done is false when maxMs ran out
  const TEST = {
    virtual(on) {
      if (on === undefined) return clock.virtual;
      if (on && !clock.virtual) clock.virtual = true;
      else if (!on && clock.virtual) { clock.virtual = false; clock.off = clock.t - performance.now(); }
      return clock.virtual;
    },
    frame(ms, o) {
      if (!clock.virtual) throw new Error('TitanicApp.test.frame: the clock is not virtual (TitanicApp.test.virtual(true))');
      clock.t += Math.max(0, Math.min(100, +ms || 0));
      framePass(!!(o && o.render));
      return clock.t;
    },
    async run(o) {
      o = o || {};
      if (!clock.virtual) throw new Error('TitanicApp.test.run: the clock is not virtual (TitanicApp.test.virtual(true))');
      const frameMs = Math.max(1, Math.min(100, +o.frameMs || 1000 / 60)), maxMs = +o.maxMs > 0 ? +o.maxMs : 600000;
      const stop = typeof o.stop === 'function' ? o.stop : null, held = o.held !== false, render = !!o.render, t0 = clock.t;
      let frames = 0, wall = performance.now();
      for (;;) {
        if ((stop && stop()) || (held && !S.playing)) return { done: true, frames, ms: clock.t - t0 };
        if (clock.t - t0 >= maxMs) return { done: false, frames, ms: clock.t - t0 };
        clock.t += frameMs; framePass(render); frames++;
        if (performance.now() - wall > 30) { await new Promise((r) => setTimeout(r, 0)); wall = performance.now(); }
      }
    },
  };

  // ===================================================================== sizing and boot
  const stage = $('stage');
  // ---- the stage's one layout (C-4; docs/DESIGN_page_layout_authority_v1_1_2026-11-21.md). The overlays stand in the
  // areas of one grid (#hud; styles.css), named by role. A part hands its overlay to an area (slot) and its buttons to the
  // view bar (addButton), and never places them. After any change of layout (a ResizeObserver on the grid, its areas
  // and what stands in them) one fit pass runs, on the page's clock (after(0): the wake's rule, so that a test's virtual
  // frames run it too):
  // - an overlay marked 'last' stands only where it cuts no must short: the pass lays the stage out with it and without
  //   it, in the same task (nothing is drawn between, so nothing flickers), and keeps it only if the musts lose nothing
  //   by it (shortfall, below). A part that has just shown one asks for the pass at once (layoutNow), before the frame
  //   is drawn;
  // - the 3D view's centre goes on the free part of the stage (under the view bar, over the helm or the diagram, left of
  //   the rail), where the scene can be seen;
  // - the parts hear 'layout', with each area's rectangle.
  const hudEl = $('hud');
  const areaEl = (name) => (hudEl ? hudEl.querySelector('[data-area="' + name + '"]') : null);
  const free = { x: 0, y: 0, w: 0, h: 0 };          // the free part of the stage, px from its top left (0 wide: none yet)
  let fitObs = null, fitQueued = false;
  function slot(area, el, o) {
    const a = areaEl(area); if (!a || !el) return false;
    o = o || {};
    el.style.order = String(o.order || 0);
    if (o.last) el.dataset.kind = 'last';
    if (o.name) el.dataset.name = o.name;
    a.appendChild(el);
    if (fitObs) fitObs.observe(el);
    queueFit();
    return true;
  }
  function addButton(row, el, o) {
    o = o || {};
    const seg = hudEl && hudEl.querySelector('.views .seg[aria-label="' + (row === 'camera' ? 'Camera' : 'Display') + '"]');
    if (!seg || !el) return false;
    const before = o.before ? seg.querySelector(o.before) : null, behind = o.after ? seg.querySelector(o.after) : null;
    if (before) seg.insertBefore(el, before); else if (behind) behind.insertAdjacentElement('afterend', el); else seg.appendChild(el);
    return true;
  }
  function areaRects() {
    const o = {}; if (!hudEl) return o;
    for (const a of hudEl.querySelectorAll('[data-area]')) { const r = a.getBoundingClientRect(); o[a.dataset.area] = [r.left, r.top, r.width, r.height]; }
    return o;
  }
  // the scene's centre drawn at the free part's: the view's window moved by the difference (a free part higher than the
  // stage's middle draws the scene higher, as the Bridge's 12 % did before)
  function applyViewOffset() {
    const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return;
    const cx = free.w > 0 ? free.x + free.w / 2 : w / 2, cy = free.h > 0 ? free.y + free.h / 2 : h / 2;
    const dx = Math.round(w / 2 - cx), dy = Math.round(h / 2 - cy);
    if (dx || dy) camera.setViewOffset(w, h, dx, dy, w, h); else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  }
  // how far the overlays are cut short, in px: in each area, how far its items run past the area's box at either end (an
  // area packs them at its foot or its head, so they may run out of either: the helm's Bridge runs out of its head,
  // which scrollHeight never counts), those out of the flow aside, a 'last' one counted too (one that runs out of its
  // own area, the boats' count on the tablet after the ice, is as much a fault as a must cut short: turn 8d); and the
  // grid past the stage. An area given way whole (a phone on its side's diagram on a watch) counts nothing
  function shortfall() {
    let px = Math.max(0, hudEl.scrollHeight - hudEl.clientHeight - 1);
    for (const a of hudEl.querySelectorAll('[data-area]')) {
      if (!a.getClientRects().length) continue;
      let top = Infinity, bottom = -Infinity;
      for (const el of a.children) {
        if (el.hidden || !el.getClientRects().length) continue;
        const pos = getComputedStyle(el).position; if (pos === 'absolute' || pos === 'fixed') continue;   // a notice that is off
        const q = el.getBoundingClientRect(); if (q.height < 1) continue;
        top = Math.min(top, q.top); bottom = Math.max(bottom, q.bottom);
      }
      if (bottom > top) { const r = a.getBoundingClientRect(); px += Math.max(0, r.top - top - 1) + Math.max(0, bottom - r.bottom - 1); }
    }
    return px;
  }
  // G28: on a large stage (a desktop's monitor) an overlay in the stack that scrolls (the end card at rest, its lines
  // grown) is given the width it needs to show whole, in steps, up to a share of the stage: the stack's column takes it
  // from the readouts' (which keep their floor). A smaller stage keeps the CSS width, and the card scrolls in its room as
  // before. The pass alone sets it, and clears it first every time, so the CSS width stands wherever no more is needed.
  // The stack's size is contained (it never asks for room by its content), so its column is widened by the area's own
  // least width, beside the overlay's
  const LARGE = { w: 1280, h: 900, step: 40, max: 720, share: 0.45 };   // px of the stage; the steps and the cap [appearance]
  function widenStack(sr) {
    const stack = areaEl('stack'); if (!stack) return;
    if (sr.width < LARGE.w || sr.height < LARGE.h) return;
    const cap = Math.min(LARGE.max, LARGE.share * sr.width);
    for (const el of stack.children) {
      if (el.hidden || el.style.display === 'none' || !el.getClientRects().length) continue;
      let w = el.getBoundingClientRect().width;
      while (el.scrollHeight > el.clientHeight + 1 && w + LARGE.step <= cap) {
        w += LARGE.step; el.style.width = w + 'px'; el.dataset.widened = '1';
        if (stack.getBoundingClientRect().width < w) { stack.style.minWidth = w + 'px'; stack.dataset.widened = '1'; }
      }
    }
  }
  function unwidenStack() {                         // the CSS widths again (G28)
    const stack = areaEl('stack'); if (!stack) return;
    if (stack.dataset.widened) { stack.style.minWidth = ''; delete stack.dataset.widened; }
    for (const el of stack.children) if (el.dataset.widened) { el.style.width = ''; delete el.dataset.widened; }
  }
  function fitPass() {
    fitQueued = false;
    if (!hudEl) return;
    const sr = stage.getBoundingClientRect(); if (!sr.width || !sr.height) return;
    unwidenStack();                                 // G28: the CSS widths first, every pass
    const lasts = [];
    for (const a of hudEl.querySelectorAll('[data-area]')) for (const el of a.children) {
      if (el.dataset.kind !== 'last') continue;
      if (el.hidden) { el.style.display = ''; continue; }   // the part's own choice: shown again, it is tried again
      lasts.push(el);
    }
    for (let i = lasts.length - 1; i >= 0; i--) {    // the last first: each tried with and without
      const el = lasts[i];
      el.style.display = ''; const withIt = shortfall();
      el.style.display = 'none'; const without = shortfall();
      if (withIt <= without) el.style.display = '';
    }
    widenStack(sr);                                 // G28: on a large stage, a scrolling overlay in the stack its width
    const vb = areaEl('views').getBoundingClientRect(), hm = areaEl('helm').getBoundingClientRect(), dg = areaEl('diagram').getBoundingClientRect(), rl = areaEl('rail').getBoundingClientRect();
    const top = Math.max(sr.top, vb.bottom), bottom = Math.min(sr.bottom, hm.height > 1 ? hm.top : (dg.height > 1 ? dg.top : sr.bottom));
    const right = rl.width > 1 ? rl.left : sr.right;
    free.x = 0; free.y = top - sr.top; free.w = Math.max(1, right - sr.left); free.h = Math.max(1, bottom - top);
    applyViewOffset();
    if (HOOKS.layout.length) fire('layout', areaRects());
  }
  function queueFit() { if (!fitQueued) { fitQueued = true; after(0, fitPass); } }
  if (hudEl && window.ResizeObserver) {
    fitObs = new ResizeObserver(queueFit); fitObs.observe(hudEl);
    for (const a of hudEl.querySelectorAll('[data-area]')) { fitObs.observe(a); for (const el of a.children) fitObs.observe(el); }
  }
  function resize() {
    classifyDevice();
    const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return;
    if (renderer) renderer.setSize(w, h, false);
    camera.aspect = w / h;
    applyViewOffset();                            // the free part as it last was; the fit pass that follows makes it new
    queueFit();
    S.lastStrip = 0; S.lastChart = 0;
  }
  if (window.ResizeObserver) new ResizeObserver(resize).observe(stage); else window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => setTimeout(resize, 200));
  resize();
  syncHoleSize();
  // the desktop app (app/main.js) serves this page as titanic://app/ and opens no other window, so a link out of it would
  // open nowhere: there the footer's links (the guide, GitHub Issues, the source) are hidden (design v2 of the app, section
  // 5), and its early access mark stands alone, as in the app's About (F1). The web page is unchanged.
  if (location.protocol === 'titanic:') { const f = $('footSource'); if (f) f.hidden = true; }
  const hashScen = (() => { const m = /scenario=([a-z]+)/.exec(location.hash || ''); return m && SC.PRESETS[m[1]] ? m[1] : 'titanic'; })();
  const hashNight = (() => { const m = /night=(\d{1,10})/.exec(location.hash || ''), k = /kn=([\d.]+)/.exec(location.hash || ''), l = /level=([a-z0-9]+)/.exec(location.hash || ''); return m && NT ? { seed: +m[1], kn: k && [22.5, 18, 15, 10].includes(+k[1]) ? +k[1] : 22.5, level: l && NT.LEVELS && NT.LEVELS[l[1]] ? l[1] : 'hard' } : null; })();
  // G12's cascade (D98): a watch is handed over at the break's onset by default (core/night.js: she is gone when B2's check
  // finds the onset, and the page says she broke). handover=flag in the address makes every watch of this page the
  // what-if, handed over at her flag as before D98. An old link's handover=onset is the default now, so it gives nothing,
  // and only 'flag' is ever passed to the night
  if (/[#&]handover=flag(&|$)/.test(location.hash || '')) S.handover = 'flag';
  setView('quarter');
  ctl.theta = VIEWS.quarter.theta; ctl.phi = VIEWS.quarter.phi; ctl.r = VIEWS.quarter.r;
  if (hashNight) {
    S.nightKn = hashNight.kn; S.nightLevel = hashNight.level;
    document.querySelectorAll('#knSeg button').forEach(x => x.setAttribute('aria-pressed', String(+x.dataset.kn === hashNight.kn)));
    document.querySelectorAll('#levelSeg button').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.level === hashNight.level)));
    loadNight(hashNight.seed, { fromHash: true });
    ctl.theta = VIEWS.astern.theta; ctl.phi = VIEWS.astern.phi; ctl.r = VIEWS.astern.r;
  } else {
    loadScenario(hashScen, true);
    if (isPhone()) beckon(true);                    // RC2: a phone's first screen says where to begin (the Run tab, "Start")
  }
  applyLook();
  renderEvidence();
  // sprite labels were drawn before the vendored fonts arrived; redraw them once
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (S.sim) { buildBulkheads(); applyLook(); } }).catch(() => {});
  requestAnimationFrame(loop);
  // console handle for exploring the live model: TitanicApp.state.sim, TitanicCore.gmNow(TitanicApp.state.sim)
  window.TitanicApp = {
    state: S, ship, camera, renderer, version: VERSION,
    loadNight, loadScenario, setView,             // TitanicApp.loadNight(1912): the same calls the cards make
    stern, wake, navLights, ctl, washFx, engines, ports, smoke, steam, roarLevel: () => (roarNode ? roarNode.level : 0),   // for the tests (tools/visuals_site_test.js) and for exploring
    plant: () => (S.sim && S.sim.plant && SY ? SY.readouts(S.sim) : null), drawFires, orderPump, selectTab,   // the Systems tab (tools/systems_site_test.js)
    device: () => rootEl.dataset.device,
    // for the parts (site/parts/*.js): the hooks, the scene's groups, the sound's context and switch, a few helpers
    on(kind, fn) { if (!HOOKS[kind] || typeof fn !== 'function') throw new Error('TitanicApp.on: no such hook: ' + kind); HOOKS[kind].push(fn); return fn; },
    off(kind, fn) { const L = HOOKS[kind] || [], i = L.indexOf(fn); if (i >= 0) L.splice(i, 1); },
    // C-4: the stage's one layout: an overlay into an area of its grid, a button into the view bar; the free part of the
    // stage (px from its top left) the 3D view is centred on; the fit pass at once, for a part that has just shown an
    // overlay marked 'last' (it is then settled before the frame is drawn)
    slot, addButton, layoutFree: () => Object.assign({}, free), layoutNow: () => fitPass(),
    scene, earth, shipGroup, sea, seaMat, canvas, E0, SX, views: VIEWS, bridge: BRIDGE, clockOf, toast,
    audio: () => audio, soundOn: () => !!audio && $('snd').checked, primeAudio,
    // S2: orders and the pace. order(type, value, arg) gives any order of the watch's (the model's own, or a reader's) the
    // way the wheel does and returns what it returned; takeOver() ends the scripted orders; holdPace(s, owner) holds the
    // page at her own pace for s seconds of the page's clock (0 ends that owner's hold; no owner: the anonymous one); pace()
    // is the pace the page runs at now
    order, takeOver: () => { if (S.night && S.sim && S.sim.night && !gone(S.sim)) takeOver(); }, holdPace, pace,
    // G27: the brush's hole on a watch at a place given in the ship's frame (y's sign the side), as a tap there gives it:
    // for the suites, which cannot aim a pointer at the hull reliably (null if not on a watch or out of bounds)
    holeAt: (x, z, side, area) => { const o = holeOnWatch({ x, z, y: side }, area); if (o) { syncHoles(); renderHoleTable(); updateHeader(); } return o; },
    // QC B-4: she is gone (gone(sim): Night.over on a watch, the core's flag on a preset), when (goneT), and whether by
    // the break's onset on an onset watch (broke): the parts ask these, never sim.foundered, whether she has gone
    gone, goneT, broke,
    // RC2: the encounter's verdict as the page says it, kept from the ice's end while what happened stands (verdictNow);
    // the end card says it so, as the line under the readouts and the Run tab do
    verdict: verdictNow,
    // RC2 (the first ten minutes): which run this is of those the kept set's tables describe ('preset': the 1912 damage as
    // built; 'watch': the 1912 watch on its recorded orders; else null). A part sets the record beside a figure only there
    keptRun,
    // NH4, the scrubber: to a kept minute (the one at or before m), paused there; a part's own history kept with each
    // minute (keep(sim) gives it as plain data, scrub(sim, state) puts it back and decides nothing); the minutes kept;
    // and whether the page is scrubbing now (a part's 'reset' is then a scrub's)
    scrub,
    keeper(name, K) { if (!name || !K || typeof K.keep !== 'function' || typeof K.scrub !== 'function') throw new Error('TitanicApp.keeper: a name, keep(sim) and scrub(sim, state)'); kept.keepers.push({ name, keep: K.keep, scrub: K.scrub }); },
    keptMinutes: () => kept.list.map(x => x.m),
    keptState: () => ({ n: kept.list.length, every: keepEvery(), furthest: kept.list.length ? kept.list[kept.list.length - 1].m : null, queued: kept.queued, broken: kept.broken }),
    scrubbing: () => kept.scrubbing,
    // NH3: where the kept set's table applies to this run ('preset', 'watch' or null), its words in the forecast's paragraph,
    // and the band a chart draws ('trim', 'list', 'water': [t, least, most, afloat] in the chart's minutes)
    kept: { run: keptRun, sentence: keptSentence, band: (key) => ({ trim: chTrim, list: chList, water: chWater })[key].cfg.data().band },
    // QC C-3: the page's clock (now(): ms, the frames' time), timers on it (after(ms, fn), cancelAfter), whether the pass
    // running now draws (drawing(): always in real mode), and the test entry (test: a test hook, as state.warp is;
    // docs/DESIGN_virtual_clock_v1_1_2026-11-21.md)
    now: clockNow, after, cancelAfter, drawing: () => passDraws, test: TEST,
    // N2: the scene's pieces by name, for a part's look: her hull (its material is the look's: applyLook), her deckhouses,
    // funnels and masts (userData.solid is each one's colour), the berg on a watch (rebuilt for each: ask each time), her
    // track and course on the earth, and the marks of the damage (the markers of her openings; the dents and opened seams)
    hull: hullMesh, deckhouses: superFaces, track, course,
    // her topsides (site/topsides.js): the group, the built arrays, the line sets and their look (a part's look sets
    // 'night' and gives back the page's look), the windows, the davits' arms, the domes
    // (faces: the mesh of each colour class by its bucket's name, for a part that draws a range of them: built.parts)
    topsides: { group: superGroup, data: TS, built: topsides.T, faces: topsides.faces, lines: [topsides.rails, topsides.rigging], lineLook: (look) => topsides.setLineLook(look),
      look: () => topsides.lineLook(), windows: topsides.win, arms: topsides.arms, armBoats: topsides.armBoats, glass: topsides.glass, domes: topsides.domes, edges: topsides.edges,
      stowed: topsides.stowed,                      // her boats as they lay at 11:40 pm, drawn on a damage preset (no watch)
      one: topsides.one ? { state: () => topsides.one.state() } : null },   // funnel 1 at the surface (G15): when it fell, gone, falling, its seat
    berg: () => (berg ? { group: berg.group, above: berg.above, under: berg.under, edge: berg.edge } : null),
    // the marks, and their claims (a part hides them by claim(kind 'openings' or 'dents', its name, true), and lets go
    // with false; claims() for the tests)
    marks: { openings: holeGroup, dents: dentPts, claim: claimMarks, claims: () => ({ openings: claims('marks.openings').map(c => c.owner), dents: claims('marks.dents').map(c => c.owner) }) },
    // C-4 step 3: claim(key, owner, value, rank) and claims(key), by the keys' rules (RULES: the marks, look.xray and
    // look.cols); a part told 'overruled' ({ key, owner }) decides whether to let its claim go
    claim, claims,
    // the core's pockets as the page last drew them (G7's adopters; tools/visuals_site_test.js): the free surfaces (the
    // X-ray look's), the boxes among the columns, the fills on the damage diagram
    pocketsDrawn: () => JSON.parse(JSON.stringify(pkDrawn)),
    // a part's mark on the damage diagram (NH2's room; diagramMark(owner, null) takes it away), and the marks standing
    diagramMark, diagramMarks: () => [...stripMarks].map(([owner, m]) => Object.assign({ owner }, m)),
    project(x, y, z) {
      const p = SX(x, y, z).applyMatrix4(shipGroup.matrix).project(camera);
      const r = canvas.getBoundingClientRect();
      return { x: r.left + (p.x + 1) / 2 * r.width, y: r.top + (1 - p.y) / 2 * r.height };
    },
    // the fall (Z2): whether she is falling; her pieces as drawn (each one's id, x0, x1, the group posed each frame by the
    // mapping, the copy of her hull and the material it is drawn with, before its cut); pieceLook(material or null): a
    // part's material for the pieces' hull, cut as the page's is, until it gives null; hullUniform(name, uniform): that
    // uniform object on every material her hull has had and on every piece's copy of one (a shader that uses it is the
    // part's to give: a copy is made again whenever its original's text changes)
    falling: () => falling(S.sim), pieceLook, hullUniform,
    pieces: () => fall.list.map(P => ({ id: P.id, x0: P.x0, x1: P.x1, group: P.g, hull: P.hull, drawnWith: P.hull ? (P.from.get(P.hull.material) || P.hull.material) : null })),
    // for the tests (tools/deep_site_test.js): what each piece draws of her topsides (its funnels' triangles and lines, the
    // aerial's, and each mast drawn on it: shown, how far laid, its angle from her upright, its foot, top and nest)
    fallTops,
    // D97 (tools/onset_site_test.js): each piece's ports' light now, in sim.fall.pieces' order (null before its copy draws a port)
    fallPortsOn: () => fall.list.map(P => (P.portOn ? P.portOn.value : null)),
  };
})();
