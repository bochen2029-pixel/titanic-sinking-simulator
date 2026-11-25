// The deep: her fall to the bed, seen. A part of the viewer (site/app.js, "parts"; the rule in CLAUDE.md).
//
// When a fall engine runs on after the flag (site/app.js, "the fall": window.TitanicFall keeps sim.fall, the contract of
// docs/BRAINSTORM_the_descent_to_the_bed_v2_2026-11-19.md, 5.1), this part shows it. Without one it shows nothing and
// changes nothing. It reads sim.fall and the page's drawn pieces (TitanicApp.pieces()) and never writes into the model.
//   Views     Bow down ('deep': with the bow, 400 m off), Stern down ('sternfall': with the stern), Bed ('bed': an eye on the
//             bed under her, looking up at her as she comes down) and Column ('column': the whole sea from the surface to
//             the bed in one picture, from about 6 km). The first two are the page's orbiting views, each following its
//             piece (a drag turns them, the wheel zooms); the last two are placed here and looked about from (a drag turns
//             the bed's eye, or the column's bearing). Their buttons head the strip.
//   The strip down the right edge of the stage, in its rail (C-4): the whole column to scale with its true depths (200 m, where daylight
//             ends by day; 730 m, where Fathom's boat is crushed; each thousand; the bed), each piece a mark at its depth
//             with its speed in m/s; a tap on a mark takes that piece's view.
//   Readouts  in the page's readouts, a line for each piece: its depth (its lowest point's, sim.fall's own: the keel only
//             while it lies upright), its speed in m/s and knots, the sea's
//             pressure there in atmospheres and the water's temperature (the sea's own tables in sim.fall), and the time
//             since it went under (its event 'under').
//   Light     the X-ray look carries the fall as it is: its own colours round her under the sea. The Night look gets a lamp
//             LAMP.off m off her that falls off with distance, "a lamp that was not there", and water that darkens with
//             depth as Fathom's page draws it. Specks stand in the water so that her speed is seen.
//   The bed   a net of 50 m squares about her and 500 m squares beyond, laid over the bed's relief as sim.fall gives it.
//   At rest   the survey's outlines of the bow, the stern and the boiler field laid on the bed from the point under the
//             break (docs/research/RESEARCH_the_fall_and_the_wreck_v1_2026-11-19.md, 10a), so that the model's answer and
//             the wreck are seen together, their words kept clear of each other on the screen; Bow down and Stern down
//             then hold each piece and the survey's outline of it in one picture (REST).
//   The card  as each piece comes to rest, a line on the Foundered card (site/parts/40_night_end.js): when, how deep, and how
//             far from where she broke. D98 (Bo's choice of G12's option (a), 2026-11-23): until the watch hands her to
//             the fall at the break's onset by default, a bow that lies upside down at rest after a hand-over at the
//             flag is told so, in Z1's words, right after the bow's line (UPSIDE).
// What is drawn that is not a number of the model's is marked [appearance]: the lamp, the water's colour, the specks, the
// net's look and reach, the outlines' shapes, the views at rest, every colour and place on the screen. Her funnels and
// masts on the falling pieces are the page's (site/app.js, "her topsides on her pieces").
// What it reads of sim.fall: t, done, rule, sea (depth, dz, rho, T, p, slope, relief), at.psi, pieces (id, x0, x1, state,
// depth, speed, r and q, the latter two also through the page's drawing), events (t, id, piece, depth). Nothing else.
(function () {
  'use strict';
  const A = window.TitanicApp, C = window.TitanicCore, THREE = window.THREE;
  if (!A || !C || !A.state || typeof A.pieces !== 'function' || !A.views) return;
  const S = A.state, G = C.G, D2R = Math.PI / 180, KN = 0.514444, ATM = 101325;
  const gl = !!(THREE && A.renderer && A.scene && A.camera);
  const $ = (id) => document.getElementById(id);
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const f1 = (v) => v.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const f0 = (v) => Math.round(v).toLocaleString('en-US');
  const mss = (s) => { s = Math.max(0, Math.floor(s + 1e-6)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const X_AFT = G.xAP - G.sternOverhang, X_FWD = C.xFwd(C.zTopAt(G.xFP));   // her hull's ends

  // =================================================================== the numbers
  const LAMP = { off: 150, up: 40, range: 650, power: 1.8, color: 0xfff1df };   // [appearance] a lamp that was not there
  const WATER = { fade: 260, see: 700 };          // [appearance] Fathom's page: light from above as exp(-depth / 260 m); how far she is seen at night
  const SPECKS = { n: 1400, box: 180, size: 0.16 };   // [appearance] specks in the water: how many, in what cube about the eye, how big
  const NET = { near: 50, nearHalf: 1200, far: 500, farHalf: 10000, fadeX: 3200, fadeN: 1100, again: 300 };   // m [appearance: the reach and fade]
  const BED_EYE = { off: 150, up: 40, fov: 58 };  // [appearance] the bed's eye: 150 m off the point under her, 40 m above the bed
  const COLUMN = { fill: 0.92, fov: 36 };         // [appearance] the column view: the sea's depth over 92 % of the picture's height
  // the strip's depths: [metres, label, what it is] (a label too near a weightier one is not shown on a short strip)
  const DEPTHS = [[200, '200 m', 'where daylight ends, by day', 1], [730, '730 m', 'where Fathom\'s boat is crushed', 1],
    [1000, '1 km', '', 2], [2000, '2 km', '', 2], [3000, '3 km', '', 2], [4000, '4 km', '', 2], [5000, '5 km', '', 2]];
  const NAMES = { bow: 'bow', stern: 'stern', whole: 'ship' };
  // D98: the truth about the bow at rest until the watch hands her over at the break's onset by default (G12's option (a),
  // its own cascade after join 17). Z1's words, on the card when sim.fall says the bow lies upside down at rest (its z axis
  // pointing down) after a hand-over at the flag (sim.fall.rule 'flag'); not otherwise
  const UPSIDE = 'The bow rests upside down here: the model hands her to the fall on her beam ends at its flag. The wreck lies upright, and handed over where she breaks, both pieces land upright.';
  const upsideDown = (p) => { const q = p.q; return 1 - 2 * (q[1] * q[1] + q[2] * q[2]) < 0; };
  // at rest Bow down and Stern down hold the piece and its surveyed outline together (U0's look at guide 1.5: from 400 m
  // the surveyed bow was out of the picture): the middle between them, from PHI off the vertical, turned so that the line
  // between them crosses the picture, as far off as both lengths and the gap need, with MARGIN to spare [appearance]
  const REST = { phi: 1.0, margin: 1.35, least: 400, most: 6000 };
  // the wreck as surveyed: east and north of the boiler field, metres; heading true, degrees (R5, 10a); the boiler field is
  // the point under the break, good to about 100 m (the plan, 4.7)
  const SURVEY = [
    { id: 'bow', E: 0, N: 772, hdg: 10, len: 143, beam: 28, say: 'the bow, as surveyed' },
    { id: 'stern', E: -115, N: 93, hdg: 190, len: 107, beam: 28, say: 'the stern, as surveyed' },
    { id: 'boilers', E: 0, N: 0, r: 100, say: 'the boilers: under the break' },
  ];

  // =================================================================== the sea, from sim.fall's own tables
  function bedDepth(sea, X, Y) {                  // m under the surface at (X, Y) of the fall's frame
    let d = sea.depth + (sea.slope ? sea.slope[0] * X + sea.slope[1] * Y : 0);
    if (sea.relief) for (const w of sea.relief) d += w.a * Math.sin(w.kx * X + w.ky * Y + w.ph);
    return d;
  }
  function colAt(sea, key, z) {                   // a table of the column at depth z, linear between its nodes
    const a = sea[key]; if (!a || !a.length) return null;
    const f = Math.max(0, z) / (sea.dz || 5), i = Math.floor(f);
    return i >= a.length - 1 ? a[a.length - 1] : a[i] + (a[i + 1] - a[i]) * (f - i);
  }
  function pressureAt(sea, z) {                   // Pa: the column's own table, or its density summed down to z
    const p = colAt(sea, 'p', z); if (p !== null) return p;
    if (!sea.rho || !sea.rho.length) return null;
    const dz = sea.dz || 5; let s = ATM, zz = 0;
    while (zz < z - 1e-9) { const h = Math.min(dz, z - zz); s += C.GRAV * h * (colAt(sea, 'rho', zz) + colAt(sea, 'rho', zz + h)) / 2; zz += h; }
    return s;
  }

  // =================================================================== the run's fall, as this part keeps it
  const run = { sim: null, B: null, whole: false, seen: [], lines: [], first: null, tUnder: {}, k: -1, shownK: -1, uiAt: 0, laid: null, drawn: null, rest: null };
  function middleX(p) { return (Math.max(p.x0, X_AFT) + Math.min(p.x1, X_FWD)) / 2; }
  function fresh(sim) {
    run.sim = sim; run.B = null; run.whole = false; run.seen = []; run.lines = []; run.first = null; run.tUnder = {}; run.k = -1; run.shownK = -1; run.laid = null;
    run.rest = null; run.restSet = false; run.reframe = false; run.word = null; restViews(null);
    const f = sim && sim.fall; if (!f) return;
    // the point under the break: her cut, 10 m above her keel, where it was at the flag (the core's pose there:
    // C.frameOf(sim), which no longer moves). The cut is where one piece begins and the next ends (with more than one
    // cut, their middle); with one piece, her amidships
    const F = C.frameOf(sim), cuts = f.pieces.map(p => p.x0).sort((a, b) => a - b).slice(1);
    const xc = cuts.length ? cuts.reduce((s, x) => s + x, 0) / cuts.length : 0;
    run.whole = f.pieces.length < 2;
    // the contract's own point under the break (v2: breakAt, in the pieces' frame), else this part's derivation
    run.B = f.v >= 2 && Array.isArray(f.breakAt) && f.breakAt.length >= 2 ? [f.breakAt[0], f.breakAt[1]] : [F.R00 * xc + F.R02 * 10 + F.tx, F.R10 * xc + F.R12 * 10 + F.ty];
    for (const e of f.events || []) if (e.id === 'under' && run.tUnder[e.piece] === undefined) run.tUnder[e.piece] = e.t;
  }
  const focusId = () => { const v = A.views[S.view]; return v && v.piece ? v.piece : 'bow'; };
  const pieceOf = (list, id) => list.find(p => p.id === id) || list[0];

  // =================================================================== the controls: the strip with its views
  const stage = $('stage');
  const strip = el('div', 'deep-strip'); strip.id = 'deepStrip'; strip.hidden = true;
  strip.setAttribute('role', 'group'); strip.setAttribute('aria-label', 'Her fall: the sea from the surface to the bed, to scale, with her pieces');
  const vseg = el('div', 'deep-views'); vseg.setAttribute('role', 'group'); vseg.setAttribute('aria-label', 'Views of her fall');
  const VB = [['deep', 'Bow', 'With the bow as it falls, 400 m off'], ['sternfall', 'Stern', 'With the stern as it falls, 400 m off'],
    ['bed', 'Bed', 'An eye on the bed under her, looking up as she comes down'], ['column', 'Column', 'The whole sea, from the surface to the bed, in one picture']];
  for (const [v, t, ti] of VB) {
    const b = el('button', null, t); b.setAttribute('data-view', v); b.setAttribute('aria-pressed', 'false'); b.title = ti;
    b.addEventListener('click', () => A.setView(v)); vseg.appendChild(b);
  }
  const colEl = el('div', 'deep-col'), surf = el('div', 'deep-lab deep-surf', '0');
  surf.title = 'The surface';
  strip.append(vseg, colEl, surf);
  const labs = DEPTHS.map(([d, t, why, w]) => { const e = el('div', 'deep-lab', t); e.title = d.toLocaleString('en-US') + ' m' + (why ? ': ' + why : ''); const k = el('i', 'deep-tick'); strip.append(k, e); return { d, e, k, w }; });
  const bedLab = el('div', 'deep-lab deep-bed', ''), bedTick = el('i', 'deep-tick deep-bedtick'); strip.append(bedTick, bedLab);
  const marks = {};                               // by piece id: { at: its tick on the column, chip: the button }
  function markFor(id) {
    if (marks[id]) return marks[id];
    const at = el('i', 'deep-at ' + id), chip = el('button', 'deep-mark ' + id), n = el('b', null, (NAMES[id] || id).replace(/^./, c => c.toUpperCase())), v = el('span', null, '–');
    const view = id === 'stern' ? 'sternfall' : 'deep';   // its piece's view (a ship that falls whole: the bow's, which takes her)
    chip.append(n, v); chip.dataset.piece = id; chip.setAttribute('data-view', view); chip.setAttribute('aria-pressed', String(S.view === view));
    chip.addEventListener('click', () => A.setView(view));
    strip.append(at, chip);
    return (marks[id] = { at, chip, v });
  }
  // in the stage's rail (C-4): at its right edge, the height the layout gives it (from the top to the damage diagram on a
  // desktop, beside the Bridge; between the bar and the Bridge on a phone), the readouts, the bar, the stack and the aside
  // standing to its left
  if (!(A.slot && A.slot('rail', strip)) && stage) stage.appendChild(strip);

  // the readouts: a line for each piece, in the page's readouts above its forecast line
  const ro = $('readout'), fc = $('fcLine');
  const box = el('div', 'deep-ro'); box.id = 'deepReadout'; box.hidden = true; box.setAttribute('role', 'group'); box.setAttribute('aria-label', 'Her pieces as they fall');
  // 'Depth' is sim.fall's own depth: the piece's lowest point, its keel only while it lies upright (a piece upside down has
  // its deck lowest: Z1's check, 2026-11-20; it was headed 'Keel')
  for (const t of ['', 'Depth', 'Speed', 'Pressure', 'Water', 'Under']) { const h = el('span', 'k', t); if (t === 'Depth') h.title = 'How deep each piece is: its lowest point under the sea (its keel while it lies upright)'; box.appendChild(h); }
  const rows = {};                                // by piece id: its cells
  function rowFor(id) {
    if (rows[id]) return rows[id];
    const cells = ['n', 'd', 'v', 'p', 'T', 'u'].map(c => el('span', c === 'n' ? 'n ' + id : 'v'));
    cells[0].textContent = (NAMES[id] || id).replace(/^./, c => c.toUpperCase());
    for (const c of cells) box.appendChild(c);
    return (rows[id] = { n: cells[0], d: cells[1], v: cells[2], p: cells[3], T: cells[4], u: cells[5] });
  }
  if (ro) { if (fc && fc.parentNode === ro) ro.insertBefore(box, fc); else ro.appendChild(box); }

  // =================================================================== the views
  // Bow down and Stern down are the page's orbiting views with a piece to follow (site/app.js, the fall: VIEWS' piece):
  // off her port bow and her starboard quarter, a little above her [appearance]. Bed and Column are placed here.
  A.views.deep = Object.assign({}, A.views.quarter, { r: 400, theta: 2.25, phi: 1.47, piece: 'bow' });
  A.views.sternfall = Object.assign({}, A.views.quarter, { r: 400, theta: -0.85, phi: 1.47, piece: 'stern' });
  A.views.bed = Object.assign({}, A.views.quarter, { look: true, fov: BED_EYE.fov, piece: 'bow' });
  A.views.column = Object.assign({}, A.views.quarter, { look: true, fov: COLUMN.fov });
  const look = { bed: { yaw: 0, pitch: 0 }, column: { az: 0 } };
  // at rest (REST): each of the two views with its piece and the survey's outline of it; as she falls, with its piece
  const FALLING = { deep: { r: 400, theta: 2.25, phi: 1.47 }, sternfall: { r: 400, theta: -0.85, phi: 1.47 } };
  const SURVEYED = { deep: 'bow', sternfall: 'stern' };
  function restViews(rest) {                      // the two views' numbers: at rest (rest[view]) or falling (null)
    for (const v in FALLING) Object.assign(A.views[v], rest && rest[v] ? rest[v].at : FALLING[v]);
  }
  // the point each is with: eased from its piece to the middle as the page eases its distance (QC B-Z2-5: it jumped)
  for (const v in FALLING) A.views[v].focus = () => { const R = run.rest && run.rest[v]; if (!R) return null; R.eased.lerp(R.mid, 0.08); return R.eased; };

  // =================================================================== the scene's pieces of this part (WebGL only)
  const T3 = gl ? {} : null;
  if (gl) {
    const scene = A.scene;
    // the water all round the eye under the sea [appearance]. X-ray: the page's own sky colours, as its look has them round
    // her under the sea. Night: Fathom's darkening water, a little lighter towards the surface (a moonless night: very
    // little), black below
    T3.water = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, depthTest: false, uniforms: { uDepth: { value: 0 }, uNight: { value: 0 } },
      vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform float uDepth; uniform float uNight; varying vec3 vP;
        void main(){ float h = normalize(vP).y;
          vec3 hor = vec3(0.055, 0.10, 0.15), zen = vec3(0.012, 0.022, 0.04), below = vec3(0.01, 0.03, 0.05);
          vec3 xr = h > 0.0 ? mix(hor, zen, pow(h, 0.45)) : mix(hor, below, pow(-h, 0.3));
          float lit = exp(-uDepth / ${WATER.fade.toFixed(1)});
          vec3 up = mix(vec3(0.004, 0.008, 0.012), vec3(0.016, 0.045, 0.06), lit), nh = mix(vec3(0.003, 0.006, 0.009), vec3(0.009, 0.024, 0.034), lit), dn = vec3(0.002, 0.003, 0.005);
          vec3 nt = h > 0.0 ? mix(nh, up, pow(h, 0.6)) : mix(nh, dn, pow(-h, 0.45));
          gl_FragColor = vec4(mix(xr, nt, uNight), 1.0); }`,
    }));
    T3.water.renderOrder = -8; T3.water.frustumCulled = false; T3.water.visible = false; scene.add(T3.water);
    // specks standing in the water, so that her speed is seen [appearance]: a cube of them about the eye, each fixed in the
    // water (the cube wraps as the eye moves)
    {
      const n = SPECKS.n, pos = new Float32Array(n * 3); let seed = 1912; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      for (let i = 0; i < n * 3; i++) pos[i] = rnd() * SPECKS.box;
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      T3.specks = new THREE.Points(g, new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        uniforms: { uCam: { value: new THREE.Vector3() }, uBox: { value: SPECKS.box }, uScale: { value: 400 }, uA: { value: 0.5 } },
        vertexShader: `uniform vec3 uCam; uniform float uBox; uniform float uScale; varying float vA;
          void main(){ vec3 p = uCam + mod(position - uCam + 0.5 * uBox, uBox) - 0.5 * uBox;
            vA = 1.0 - smoothstep(0.3 * uBox, 0.5 * uBox, length(p - uCam)); vec4 mv = viewMatrix * vec4(p, 1.0);
            gl_PointSize = clamp(${SPECKS.size.toFixed(2)} * uScale / -mv.z, 1.0, 3.0); gl_Position = projectionMatrix * mv; }`,
        fragmentShader: 'uniform float uA; varying float vA; void main(){ float a = vA * uA * smoothstep(0.5, 0.15, length(gl_PointCoord - 0.5)); gl_FragColor = vec4(vec3(0.62, 0.70, 0.74) * a, 1.0); }',
      }));
      T3.specks.frustumCulled = false; T3.specks.renderOrder = 3; T3.specks.visible = false; scene.add(T3.specks);
    }
    // the bed: two nets laid over its relief, fading with distance from the eye [appearance]
    const netMat = (col, a) => new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, uniforms: { uCol: { value: new THREE.Color(col) }, uA: { value: a }, uFade: { value: NET.fadeX } },
      vertexShader: 'varying float vD; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vD = length(w.xyz - cameraPosition); gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: 'uniform vec3 uCol; uniform float uA; uniform float uFade; varying float vD; void main(){ gl_FragColor = vec4(uCol, uA * exp(-vD / uFade)); }',
    });
    T3.near = new THREE.LineSegments(new THREE.BufferGeometry(), netMat(0xc9a46a, 0.55)); T3.far = new THREE.LineSegments(new THREE.BufferGeometry(), netMat(0xb08d57, 0.40));
    for (const o of [T3.near, T3.far]) { o.frustumCulled = false; o.renderOrder = 2; o.visible = false; scene.add(o); }
    // the lamp [appearance]: added to the scene the first time a fall is seen, so that a page with no fall keeps its lights
    T3.lamp = new THREE.PointLight(LAMP.color, 0, LAMP.range, 2); T3.lampIn = false;
    // her hull in the lamp's light, in the Night look under the sea [appearance]: the page's solid colours (site/app.js
    // hullSolid), lit by the lamp alone, fading into the water with distance from the eye
    const U = A.hull && A.hull.material && A.hull.material.uniforms, f4 = (v) => v.toFixed(4);
    T3.hullMat = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms: { uFront: U && U.uFront ? U.uFront : { value: 1e6 }, uAp: U && U.uAp ? U.uAp : { value: new THREE.Vector4(0, 0, 0, 0) },
        uLamp: { value: new THREE.Vector3() }, uI: { value: 0 }, uR: { value: LAMP.range }, uSee: { value: WATER.see }, uWater: { value: new THREE.Vector3(0.004, 0.008, 0.012) } },
      vertexShader: 'varying vec3 vL; varying vec3 vW; varying vec3 vN; void main(){ vL = position; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: `
        const float XFP = ${f4(G.xFP)}; const float XAP = ${f4(G.xAP)}; const float DB = ${f4(G.deck.B)}; const float DC = ${f4(G.deck.C)};
        float sheer(float x){ float s = x >= 0.0 ? x / XFP : x / XAP; return (x >= 0.0 ? ${f4(G.sheerF)} : ${f4(G.sheerA)}) * s * s; }
        float zTopF(float x){ bool w = (x > ${f4(G.wellFwd[0])} && x < ${f4(G.wellFwd[1])}) || (x > ${f4(G.wellAft[0])} && x < ${f4(G.wellAft[1])}); return (w ? DC : DB) + sheer(x); }
        uniform float uFront; uniform vec4 uAp; uniform vec3 uLamp; uniform float uI; uniform float uR; uniform float uSee; uniform vec3 uWater;
        varying vec3 vL; varying vec3 vW; varying vec3 vN;
        void main(){
          float x = vL.x; float zs = vL.y;
          if (x > uFront) discard;
          if (x > uAp.x && x < uAp.y && zs > uAp.z && zs < uAp.w) discard;
          float top = zTopF(x);
          vec3 base = zs < 10.3 ? vec3(0.42, 0.10, 0.07) : vec3(0.035, 0.037, 0.04);
          if (zs > top - 0.03) base = vec3(0.30, 0.26, 0.20);
          else if (abs(zs - (top - 0.25)) < 0.12) base = vec3(0.75, 0.6, 0.3);
          vec3 L = uLamp - vW; float d = length(L), k = pow(clamp(1.0 - d / uR, 0.0, 1.0), 2.0), c = abs(dot(normalize(vN), L / d));
          vec3 col = base * (0.05 + uI * k * (0.35 + 0.65 * c)) + vec3(0.07, 0.08, 0.09) * uI * k * pow(c, 6.0);
          col = mix(uWater, col, exp(-length(cameraPosition - vW) / uSee));
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    // the survey's outlines on the bed, and the column's line in the Column view [appearance: shapes, colours, words]
    T3.survey = new THREE.Group(); T3.survey.visible = false; scene.add(T3.survey); T3.words = [];
    T3.column = new THREE.Group(); T3.column.visible = false; scene.add(T3.column);
    T3.tags = {};                                 // the pieces' names in the Column view, by piece id
  }
  function label(text, color, h) {                // a word that keeps its size on the screen [appearance]
    const cv = document.createElement('canvas'), g = cv.getContext('2d'), px = 30, font = '600 ' + px + 'px "IBM Plex Sans Condensed", "Arial Narrow", sans-serif';
    g.font = font; cv.width = Math.ceil(g.measureText(text).width) + 12; cv.height = px + 12;
    g.font = font; g.textBaseline = 'middle'; g.fillStyle = color; g.fillText(text, 6, cv.height / 2 + 1);
    const tex = new THREE.CanvasTexture(cv); tex.minFilter = THREE.LinearFilter;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false, sizeAttenuation: false }));
    h = h || 0.02; sp.scale.set(h * cv.width / cv.height, h, 1); sp.center.set(0, 0.5); sp.renderOrder = 12;
    return sp;
  }
  function clearGroup(g) { for (const o of g.children.slice()) { g.remove(o); if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } } }
  // three.js (x, y, z) of a point of the fall's frame (X, Y, Z): (X, Z, -Y), as the page maps it
  const at3 = (X, Y, Z) => new THREE.Vector3(X, Z, -Y);
  // the survey: east and north of the point under the break, turned into the fall's frame by her heading at the flag
  // (x along it, y to port: a point north and east of it lies N cos psi + E sin psi ahead and N sin psi - E cos psi to port)
  function siteToFall(E, N, psi, B) { return [B[0] + N * Math.cos(psi) + E * Math.sin(psi), B[1] + N * Math.sin(psi) - E * Math.cos(psi)]; }
  function layOutlines(f) {
    const g = T3.survey, sea = f.sea, psi = (f.at && f.at.psi) || 0, B = run.B, brass = 0xe0b15a;
    clearGroup(g); T3.words = [];
    const loop = (pts, dashed) => {
      const v = pts.map(([X, Y]) => at3(X, Y, -bedDepth(sea, X, Y) + 0.8));
      const geo = new THREE.BufferGeometry().setFromPoints(v.concat([v[0]]));
      const line = new THREE.Line(geo, dashed ? new THREE.LineDashedMaterial({ color: brass, dashSize: 12, gapSize: 8, transparent: true, opacity: 0.9, depthWrite: false })
        : new THREE.LineBasicMaterial({ color: brass, transparent: true, opacity: 0.95, depthWrite: false }));
      if (dashed) line.computeLineDistances();
      line.renderOrder = 11; line.frustumCulled = false; g.add(line);
    };
    for (const s of SURVEY) {
      const c = siteToFall(s.E, s.N, psi, B);
      if (s.r) {                                   // the boiler field: a ring, and a cross at the point under the break
        const pts = []; for (let i = 0; i < 48; i++) { const a = i / 48 * 2 * Math.PI; pts.push([c[0] + s.r * Math.cos(a), c[1] + s.r * Math.sin(a)]); }
        loop(pts, true); loop([[c[0] - 12, c[1]], [c[0] + 12, c[1]]], false); loop([[c[0], c[1] - 12], [c[0], c[1] + 12]], false);
      } else {                                     // a section's plan, pointed at the bow, its broken end square [appearance]
        const h = s.hdg * D2R, ax = Math.cos(h - psi), ay = Math.sin(psi - h), L = s.len / 2, W = s.beam / 2;
        const shape = s.id === 'bow' ? [[-L, -W], [L - 30, -W], [L, 0], [L - 30, W], [-L, W]] : [[L, -W], [-L + 18, -W], [-L, -W / 2], [-L, W / 2], [-L + 18, W], [L, W]];
        // along (ax, ay); to port of it (-ay, ax)
        loop(shape.map(([u, w]) => [c[0] + u * ax - w * ay, c[1] + u * ay + w * ax]), false);
      }
      const sp = label(s.id === 'bow' ? BOW_SAYS : s.say, '#e0b15a', 0.018); sp.position.copy(at3(c[0], c[1], -bedDepth(sea, c[0], c[1]) + 6)); g.add(sp);
      if (s.id === 'bow') withShort(sp, BOW_SHORT, '#e0b15a', g);
      T3.words.push(sp);
    }
  }
  // a word's short form, for a picture too narrow for the whole of it between the stage's left edge and the strip (a
  // phone's): laid where the word lies, shown in its place by clearWords [appearance]
  function withShort(sp, text, color, g) {
    const alt = label(text, color, 0.018); alt.position.copy(sp.position); alt.visible = false; alt.userData.short = true; g.add(alt);
    sp.userData.alt = alt;
  }
  const wordShown = (sp) => (sp.userData.alt && !sp.visible ? sp.userData.alt : sp);   // the form on the screen
  // at rest the two parts of the gap between the model's bow and the wreck's (QC B-5): how far on along her heading at the
  // flag the model's bow lies from the point under the break, and that heading; beside the survey's bow, put the same way
  // (the record: 772 m on, "in the direction she was heading", her head then about north: 335 to 020 degrees, Halpern,
  // through docs/research/RESEARCH_the_fall_and_the_wreck_v1_2026-11-19.md, 10b and 10c) [appearance: the words]
  // RC2 (the red team's row 26): the words round the survey's figure as its source allows: the bow's place is a published
  // position that names no source, its note's band 540 to 950 m. SURVEY's 772 m stays the drawing's place
  const BOW_SAYS = 'the bow, as surveyed: about 0.8 km on, her head about north', BOW_SHORT = 'the bow, as surveyed: about 0.8 km on';
  function layModelWord(f, list) {
    const P = list.find(p => p.id === 'bow'); if (!P || run.whole || !run.B) return;
    const v = mid3(P, new THREE.Vector3()), X = v.x, Y = -v.z, psi = (f.at && f.at.psi) || 0;
    const hdg = ((psi / D2R) % 360 + 360) % 360, along = X - run.B[0], across = Y - run.B[1];
    run.word = { along, across, hdg };
    // her heading at the hand-over: the flag's on a preset and the what-if, where she broke on a default watch (G12's cascade)
    const sp = label('the model\'s bow: ' + f0(along) + ' m on, her head ' + (f.rule === 'flag' ? 'at the flag ' : 'where she broke ') + f0(hdg) + ' deg', '#dbe6ef', 0.018);
    sp.position.copy(at3(X, Y, -bedDepth(f.sea, X, Y) + 6)); T3.survey.add(sp);
    withShort(sp, 'the model\'s bow: ' + f0(along) + ' m on, ' + f0(hdg) + ' deg', '#dbe6ef', T3.survey);
    T3.words.push(sp);
  }
  // the survey's words kept clear of each other on the screen (U0: they overlapped at rest), each in its turn, the bow's,
  // the stern's, the boilers' (clearWords, below). A word keeps its size on the screen (label): its box there is the
  // projection matrix's scale times the sprite's [appearance]
  const vW = gl ? new THREE.Vector3() : null;
  function wordBox(sp, cy) {                      // [left, bottom, right, top] of the sprite in the picture (-1 to 1), its anchor at height cy
    const P = A.camera.projectionMatrix.elements, w = P[0] * sp.scale.x, h = P[5] * sp.scale.y;
    vW.copy(sp.position).project(A.camera);
    return vW.z > 1 ? null : [vW.x - sp.center.x * w, vW.y - cy * h, vW.x + (1 - sp.center.x) * w, vW.y + (1 - cy) * h];
  }
  // a box covers another where they share some area; boxes that only meet, to rounding, do not (Z2, turn 10d of 11-21: a
  // word drawn left to end at the strip's margin met the strip's box there, and an ulp past it blocked every line of it)
  const covers = (a, b) => a[0] < b[2] - 1e-9 && a[2] > b[0] + 1e-9 && a[1] < b[3] - 1e-9 && a[3] > b[1] + 1e-9;
  // the strip's left edge in the picture (-1 to 1), 6 px short of it, or null while it is not shown
  function stripLeft() {
    if (strip.hidden || !A.renderer) return null;
    const c = A.renderer.domElement.getBoundingClientRect(), s = strip.getBoundingClientRect();
    return c.width > 0 && s.width > 0 ? 2 * (s.left - 6 - c.left) / c.width - 1 : null;
  }
  // the stage's overlays as they stand, as boxes in the picture (-1 to 1), 6 px about each: the words keep off them (C-4)
  const OVERLAYS = ['#readout', '.views', '#boatsChip', '#endCard', '#bridge', '.strip', '.walk-pad', '#deepStrip', '#rpToast'];
  function overlayBoxes() {
    if (!A.renderer) return [];
    const c = A.renderer.domElement.getBoundingClientRect(); if (!(c.width > 0 && c.height > 0)) return [];
    const out = [];
    for (const sel of OVERLAYS) {
      const e = document.querySelector(sel); if (!e || e.hidden || !e.getClientRects().length) continue;
      const r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
      out.push([2 * (r.left - 6 - c.left) / c.width - 1, 1 - 2 * (r.bottom + 6 - c.top) / c.height, 2 * (r.right + 6 - c.left) / c.width - 1, 1 - 2 * (r.top - 6 - c.top) / c.height]);
    }
    return out;
  }
  // Each word is first kept clear of the strip at the stage's right edge: one whose right end would run under it is drawn
  // to the left of its anchor, as far as that takes and at most its whole length (Z2, turn 6b of 11-21: at rest the
  // survey's words ran under the strip). A word too long to lie between the stage's left edge and the strip so drawn takes
  // its short form where it has one (8d's phone picture: the model's bow's words ran out of the stage at the left). Then
  // it stands on the first line, from its own and then down and up (at most eight each way), that lies inside the picture
  // and is clear of the words placed before it and of every overlay of the stage (C-4: "boilers: under the break" started
  // under the readouts); else on the line inside the picture that it overlaps least, and the word is marked as having
  // found no clear line (userData.noLine, on both its forms; TitanicApp.deep.words() gives it as `stuck`), so that a suite
  // excuses it by its mark rather than by where it lands. A word none of whose lines lies wholly inside the picture (its
  // subject far out of it) is not drawn, and takes no room from the words after it: laid outside, it showed as a sliver
  // when a line straddled the edge (join 11's gate, 11:56: with Z1's M2 the stern rests elsewhere, and in Stern down at
  // rest one word's lines all lay out of the framed picture); TitanicApp.deep.words() gives it no box, as a word behind
  // the eye. The search once took a clear line anywhere before overlapping
  // ("unseen, but over nothing"): 10b2's tables show it laid the model's bow's word, from above at rest, at line -8, four
  // fifths above the picture's top with a sliver showing; the coordinator (11-21, 10:40): a sliver at the edge reads as a
  // glitch, a marked word over an overlay is honest and stays with its subject. 10b2 also: on the test feed's crowded
  // rest one word found no clear line (the old search's last resort, eight lines down, had been excused by that line
  // alone). 9c (join 9's scene): searched down only, a word stayed eight lines down over another; U0 (09:36): the
  // boilers' word ended under the damage diagram at the picture's foot
  const LINES = [0, 1, 2, 3, 4, 5, 6, 7, 8, -1, -2, -3, -4, -5, -6, -7, -8];
  function clearWords() {
    const placed = [], xs = stripLeft(), over = overlayBoxes();
    const blocked = (b) => placed.some(q => covers(b, q)) || over.some(q => covers(b, q));
    const inside = (b) => b[1] > -1 && b[3] < 1;
    const overlap = (b) => {                       // the area it shares with the words placed and the overlays
      let a = 0;
      for (const q of placed.concat(over)) { const x = Math.min(b[2], q[2]) - Math.max(b[0], q[0]), y = Math.min(b[3], q[3]) - Math.max(b[1], q[1]); if (x > 0 && y > 0) a += x * y; }
      return a;
    };
    const offStrip = (sp) => {                     // drawn left of its anchor as far as the strip asks; its box
      sp.center.x = 0;
      let r = wordBox(sp, 0.5);
      if (r && xs !== null && r[2] > xs) { sp.center.x = Math.min(1, (r[2] - xs) / (r[2] - r[0])); r = wordBox(sp, 0.5); }
      return r;
    };
    for (const w of T3.words) {
      const alt = w.userData.alt;
      let sp = w, r;
      w.visible = true; if (alt) alt.visible = false;  // drawn again each pass unless found out of the picture below
      r = offStrip(sp);
      if (alt && r && r[0] < -0.995) { w.visible = false; alt.visible = true; sp = alt; r = offStrip(sp); }
      let k = 0, stuck = false, out = false;
      if (r) {
        const lines = LINES.map(j => [j, j === 0 ? r : wordBox(sp, 0.5 + 1.15 * j)]).filter(([, b]) => b);
        const within = lines.filter(([, b]) => inside(b));
        if (!within.length) out = true;            // no line of it inside the picture: not drawn
        else {
          let pick = within.find(([, b]) => !blocked(b));
          // else the first of least overlap; lines wholly under the same overlay tie, so a later one wins only by more
          // than a hair, lest rounding move a stuck word from line to line as the eye moves
          if (!pick) { stuck = true; pick = within.reduce((m, e) => (overlap(e[1]) < overlap(m[1]) - 1e-9 ? e : m)); }
          k = pick[0]; r = pick[1];
        }
      }
      w.userData.noLine = stuck; if (alt) alt.userData.noLine = stuck;
      sp.center.y = 0.5 + 1.15 * k;
      if (out) { sp.visible = false; r = null; }
      if (r) placed.push(r);
    }
  }
  // the band of the stage clear of the overlays at its head and its foot, px from the stage's top left: below the
  // readouts, the view bar and the boats' count, above the Bridge or the damage diagram, left of the deep's strip; and
  // the free part's middle, where the page centres the view (TitanicApp.layoutFree). Null without a layout
  function clearBand() {
    const fr = A.layoutFree ? A.layoutFree() : null; if (!stage || !fr || !(fr.w > 1 && fr.h > 1)) return null;
    const sr = stage.getBoundingClientRect(), rect = (e) => (e && !e.hidden && e.getClientRects().length ? e.getBoundingClientRect() : null);
    let top = fr.y, bottom = fr.y + fr.h;
    for (const e of [$('readout'), document.querySelector('.views'), $('boatsChip')]) { const r = rect(e); if (r && r.width > 0) top = Math.max(top, r.bottom - sr.top + 8); }
    if (bottom - top < 0.25 * fr.h) top = bottom - 0.25 * fr.h;   // never thinner than a quarter of the free part
    return { x: fr.x, y: top, w: fr.w, h: bottom - top, freeMid: fr.y + fr.h / 2, H: sr.height, W: sr.width };
  }
  // at rest: for each of the two views, the middle between its piece and the survey's outline of it, and its numbers. Both
  // are framed in the clear band (clearBand): the distance for the band's width, and the point the eye is with raised
  // along the picture's up so that the band's middle, not the free part's, holds them (U0's guide picture of 11-21: the
  // stern lay behind the readouts, the band empty but for the survey's word)
  function layRest(f, list) {
    const out = {}, cam = A.camera, psi = (f.at && f.at.psi) || 0, fit = Math.min(1.8, Math.max(1, 0.95 / Math.max(0.3, cam.aspect)));
    const band = clearBand();
    run.band = band ? [band.y, band.h, band.w].map(Math.round).join(',') : '';
    for (const v in SURVEYED) {
      const s = SURVEY.find(q => q.id === SURVEYED[v]), P = pieceOf(list, A.views[v].piece); if (!s || !P) continue;
      // the view's own field of view, not whatever view she came to rest in (QC B-Z2-2: the Bed view's 58 degrees), its
      // width the band's
      const tanV = Math.tan((A.views[v].fov || 36) * D2R / 2);
      const tanH = tanV * Math.max(0.3, cam.aspect) * (band ? band.w / band.W : 1);
      const a = mid3(P, new THREE.Vector3()), c = siteToFall(s.E, s.N, psi, run.B), b = at3(c[0], c[1], -bedDepth(f.sea, c[0], c[1]) + 6);
      const dx = b.x - a.x, dz = b.z - a.z, gap = Math.hypot(dx, dz), half = gap / 2 + Math.max(s.len || 0, Math.min(P.x1, X_FWD) - Math.max(P.x0, X_AFT)) / 2;
      // turned so that the line between them crosses the picture: of the two such bearings, the nearer the view's own
      let theta = FALLING[v].theta;
      if (gap > 1) {
        const t1 = Math.atan2(dz, -dx), t2 = t1 + Math.PI, off = (t) => Math.abs(Math.atan2(Math.sin(t - theta), Math.cos(t - theta)));
        theta = off(t1) <= off(t2) ? t1 : t2;
      }
      const r = clamp(REST.margin * half / tanH / fit, REST.least, REST.most);
      const mid = a.clone().add(b).multiplyScalar(0.5);
      if (band) {                                 // raised along the picture's up (three's Spherical: the eye at r(sin phi sin theta, cos phi, sin phi cos theta))
        const ph = REST.phi, D = r * fit, shift = (band.y + band.h / 2 - band.freeMid) * 2 * D * tanV / band.H;
        mid.add(new THREE.Vector3(-Math.cos(ph) * Math.sin(theta), Math.sin(ph), -Math.cos(ph) * Math.cos(theta)).multiplyScalar(shift));
      }
      out[v] = { mid, eased: a.clone(), at: { r, theta, phi: REST.phi }, gap };
    }
    return out;
  }
  function layColumn(f) {                         // the sea's depth along a line at the point under the break
    const g = T3.column, sea = f.sea, B = run.B, bed = bedDepth(sea, B[0], B[1]), pts = [], col = 0x8fd3c9;
    clearGroup(g);
    pts.push(at3(B[0], B[1], 0), at3(B[0], B[1], -bed));
    for (let d = 500; d < bed; d += 500) { pts.push(at3(B[0], B[1] - 40, -d), at3(B[0], B[1] + 40, -d)); }
    pts.push(at3(B[0], B[1] - 80, -bed), at3(B[0], B[1] + 80, -bed));
    const line = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.7, depthWrite: false }));
    line.renderOrder = 11; line.frustumCulled = false; g.add(line);
    const put = (d, text) => { const sp = label(text, '#8fd3c9', 0.017); sp.center.x = -0.12; sp.position.copy(at3(B[0], B[1], -d)); g.add(sp); };   // beside the line, on the screen
    for (let d = 1000; d < bed - 150; d += 1000) put(d, f0(d) + ' m');
    put(0.035 * bed, 'the surface, above'); put(bed, 'the bed, ' + f0(bed) + ' m');   // [appearance] its name a little under the surface, clear of the view buttons
  }
  function layNet(f, cx, cy) {                    // the two nets about (cx, cy), over the bed's relief
    const sea = f.sea, put = (geo, step, half) => {
      const n = Math.round(half / step), x0 = Math.round(cx / step) * step, y0 = Math.round(cy / step) * step, pos = [];
      const p = (X, Y) => { pos.push(X, -bedDepth(sea, X, Y) + 0.4, -Y); };
      for (let i = -n; i <= n; i++) for (let j = -n; j < n; j++) {
        p(x0 + i * step, y0 + j * step); p(x0 + i * step, y0 + (j + 1) * step);   // a line along y
        p(x0 + j * step, y0 + i * step); p(x0 + (j + 1) * step, y0 + i * step);   // a line along x
      }
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.computeBoundingSphere();
      return pos.length / 6;
    };
    run.laid = { cx, cy, near: put(T3.near.geometry, NET.near, NET.nearHalf), far: put(T3.far.geometry, NET.far, NET.farHalf) };
  }

  // =================================================================== each frame
  let shown = false;
  function show(on) {
    shown = on;
    strip.hidden = !on; box.hidden = !on;
    if (stage) stage.classList.toggle('deep-on', on);
    if (!on) for (const id in marks) { marks[id].at.remove(); marks[id].chip.remove(); delete marks[id]; }
    if (!on) for (const id in rows) { for (const k of ['n', 'd', 'v', 'p', 'T', 'u']) rows[id][k].remove(); delete rows[id]; }
    if (!on && T3) { for (const k of ['water', 'specks', 'near', 'far', 'survey', 'column']) T3[k].visible = false; for (const id in T3.tags) T3.tags[id].visible = false; T3.lamp.intensity = 0; if (T3.lit) { T3.lit = false; A.pieceLook(null); } }
    if (on) layStrip();
  }
  // Where the strip stands and how tall it is are the layout's (the rail); inside it this part lays its column, under the
  // view buttons and the surface's label and above its foot, however short the rail is (a phone's). Laid when it shows
  // and again on each layout (the 'layout' hook: the stage resized, the readouts or the Bridge grown), never on a timer
  const geo = { colTop: 0, colH: 1, h: -1 };
  function layStrip() {
    const h = strip.clientHeight, vh = vseg.offsetHeight || 40;
    if (h === geo.h && vh + 18 === geo.colTop) return;
    geo.h = h; geo.colTop = vh + 18; geo.colH = Math.max(0, h - geo.colTop - 12);
    colEl.style.top = geo.colTop + 'px'; colEl.style.height = geo.colH + 'px';
    run.k = -1;                                   // marks and labels again
  }
  A.on('layout', () => {
    if (shown) layStrip();
    // at rest, the two views laid again when the clear band has changed (the end card closed, the readouts grown): the eye
    // eases on from where it has got to
    if (run.rest) { const b = clearBand(), k = b ? [b.y, b.h, b.w].map(Math.round).join(',') : ''; if (k !== run.band) run.reframe = true; }
  });
  function layLabels(depth) {                     // the depths beside the column: weightier first, none crowding another
    const y = (d) => geo.colTop + geo.colH * d / depth, used = [geo.colTop, geo.colTop + geo.colH];
    surf.style.top = geo.colTop + 'px';
    bedLab.textContent = f0(depth); bedLab.title = f0(depth) + ' m: the bed'; bedLab.style.top = (geo.colTop + geo.colH) + 'px'; bedTick.style.top = (geo.colTop + geo.colH) + 'px';
    for (const w of [2, 1]) for (const L of labs) {
      if (L.w !== w) continue;
      const yy = y(L.d), ok = L.d < depth - 1 && used.every(u => Math.abs(u - yy) >= 13);
      L.e.hidden = L.k.hidden = !ok; if (!ok) continue;
      used.push(yy); L.e.style.top = yy + 'px'; L.k.style.top = yy + 'px';
    }
    // the column's own colour: what light there is above 200 m, black below [appearance]
    colEl.style.background = 'linear-gradient(to bottom, #3c7aa0 0%, #10293a ' + (100 * 200 / depth).toFixed(2) + '%, #05090e 100%)';
  }
  function placeMarks(f, depth) {
    const ys = [];
    for (const p of f.pieces) {
      const M = markFor(p.id), y = geo.colTop + geo.colH * clamp(p.depth / depth, 0, 1.02);
      M.at.style.top = y.toFixed(1) + 'px'; ys.push([y, M]);
    }
    // the chips beside their ticks, inside the strip and kept from covering one another [appearance]: pushed down from
    // the top, then up from the foot
    ys.sort((a, b) => a[0] - b[0]);
    const h = ys.map(([, M]) => M.chip.offsetHeight || 26), c = ys.map(([y]) => y), lo = geo.colTop - 6, hi = geo.colTop + geo.colH + 8;
    for (let i = 0; i < c.length; i++) { c[i] = Math.max(c[i], lo + h[i] / 2); if (i) c[i] = Math.max(c[i], c[i - 1] + (h[i - 1] + h[i]) / 2 + 2); }
    for (let i = c.length - 1; i >= 0; i--) { c[i] = Math.min(c[i], hi - h[i] / 2); if (i < c.length - 1) c[i] = Math.min(c[i], c[i + 1] - (h[i] + h[i + 1]) / 2 - 2); }
    ys.forEach(([, M], i) => { M.chip.style.top = c[i].toFixed(1) + 'px'; });
  }
  function readouts(f) {
    const sea = f.sea || {};
    for (const p of f.pieces) {
      const R = rowFor(p.id), M = markFor(p.id), pr = pressureAt(sea, p.depth), T = colAt(sea, 'T', p.depth), tu = run.tUnder[p.id];
      R.d.textContent = f1(p.depth) + ' m';
      R.v.textContent = p.speed.toFixed(1) + ' m/s';   // the knots in their own span: a phone's stylesheet leaves them out
      const kn = R.kn || (R.kn = el('span', 'kn')); kn.textContent = ' · ' + (p.speed / KN).toFixed(1) + ' kn'; R.v.appendChild(kn);
      R.p.textContent = pr === null ? '–' : (pr / ATM >= 100 ? f0(pr / ATM) : (pr / ATM).toFixed(1)) + ' atm';
      R.T.textContent = T === null ? '–' : T.toFixed(1) + ' °C';
      R.u.textContent = tu === undefined ? 'afloat' : mss(f.t - tu);
      M.v.textContent = p.speed.toFixed(1);
      M.chip.title = 'The ' + (NAMES[p.id] || p.id) + ': ' + f1(p.depth) + ' m down, ' + p.speed.toFixed(1) + ' m/s. Show it';
      M.chip.setAttribute('aria-label', M.chip.title);
    }
    run.shownK = f.k;
  }
  // a piece's middle, 10 m above its keel, in the scene
  const mid3 = (p, out) => out.set(middleX(p), 10, 0).applyMatrix4(p.group.matrix);
  const vA = gl ? new THREE.Vector3() : null, vB = gl ? new THREE.Vector3() : null;
  function scene3d(f, list) {
    const cam = A.camera, under = cam.position.y < -1, night = !!(A.nightScene && A.nightScene.on), sea = f.sea;
    if (!T3.lampIn) { A.scene.add(T3.lamp); T3.lampIn = true; }
    T3.water.visible = under; T3.water.position.copy(cam.position); T3.water.scale.setScalar(0.5 * cam.far);
    T3.water.material.uniforms.uDepth.value = Math.max(0, -cam.position.y); T3.water.material.uniforms.uNight.value = night ? 1 : 0;
    const su = T3.specks.material.uniforms;
    T3.specks.visible = under; su.uCam.value.copy(cam.position); su.uA.value = night ? 0.55 : 0.35;
    su.uScale.value = A.renderer.domElement.height / (2 * Math.tan(cam.fov * D2R / 2));
    // the nets, laid again about her when she has moved far from where they were laid
    let cx = 0, cy = 0; for (const p of list) { mid3(p, vA); cx += vA.x; cy -= vA.z; } cx /= list.length; cy /= list.length;
    if (!run.laid || Math.hypot(cx - run.laid.cx, cy - run.laid.cy) > NET.again) layNet(f, cx, cy);
    T3.near.visible = T3.far.visible = true;
    T3.near.material.uniforms.uFade.value = T3.far.material.uniforms.uFade.value = night ? NET.fadeN : NET.fadeX;
    T3.near.material.uniforms.uA.value = night ? 0.32 : 0.55; T3.far.material.uniforms.uA.value = night ? 0.22 : 0.40;
    // in the Column view each piece named beside it, since from 6 km she is a few pixels [appearance]
    const colView = S.view === 'column', right = vB.setFromMatrixColumn(cam.matrixWorld, 0);
    for (const p of list) {
      let tg = T3.tags[p.id];
      if (!tg) { tg = T3.tags[p.id] = label(NAMES[p.id] || p.id, p.id === 'stern' ? '#8fd3c9' : '#e0b15a', 0.022); A.scene.add(tg); }
      tg.visible = colView;
      if (colView) { mid3(p, vA); tg.position.copy(vA).addScaledVector(right, 0.02 * vA.distanceTo(cam.position)); }
    }
    // the lamp, off the piece the eye is with, toward the eye and a little above (Night, under the sea)
    const P = pieceOf(list, focusId()); mid3(P, vA);
    vB.copy(cam.position).sub(vA); vB.y = 0; if (vB.lengthSq() < 1) vB.set(0, 0, 1);
    vB.setLength(LAMP.off).add(vA); vB.y += LAMP.up;
    const lit = night && under;
    T3.lamp.position.copy(vB); T3.lamp.intensity = lit ? LAMP.power : 0;
    T3.hullMat.uniforms.uLamp.value.copy(vB); T3.hullMat.uniforms.uI.value = lit ? LAMP.power : 0;
    if (lit !== T3.lit) { T3.lit = lit; A.pieceLook(lit ? T3.hullMat : null); }   // her pieces' hull in the lamp's light, cut as the page cuts it
    T3.survey.visible = !!f.done; T3.column.visible = S.view === 'column';
    if (f.done && !run.word) layModelWord(f, list);   // at rest: the model's bow's own words beside the survey's (B-5)
    if (f.done && (!run.rest || run.reframe)) {   // at rest: the two views hold each piece with its outline; into it once, if in one
      const old = run.rest; run.rest = layRest(f, list); run.reframe = false;
      if (old) for (const v in run.rest) if (old[v]) run.rest[v].eased = old[v].eased;   // a new shape keeps where the eye has got to
      restViews(run.rest);
      if (!run.restSet && SURVEYED[S.view]) A.setView(S.view);
      run.restSet = true;
    }
    if (T3.survey.visible) clearWords();
  }

  A.on('frame', () => {
    const sim = S.sim, f = sim && sim.fall, on = !!(f && f.pieces && f.pieces.length && f.sea);
    if (on !== shown) show(on);
    if (!on) return;
    if (run.sim !== sim) fresh(sim);
    const list = T3 ? A.pieces() : [];
    if (T3 && list.length && run.drawn !== sim) { layOutlines(f); layColumn(f); run.drawn = sim; }
    const now = A.now(), depth = f.sea.depth;     // the page's clock (QC C-3): the readouts' ten times a second, on a test's frames too
    if (run.k !== f.k) { layLabels(depth); run.k = f.k; }
    placeMarks(f, depth);
    if (run.shownK !== f.k && (now - run.uiAt > 100 || !S.playing)) { run.uiAt = now; readouts(f); }
    if (run.lines.length && !document.querySelector('#endCard p.deep-line')) putLines();
    if (T3 && list.length) scene3d(f, list);
  });

  // =================================================================== the camera: the bed's eye and the column
  const eye = gl ? new THREE.Vector3() : null, aim = gl ? new THREE.Vector3() : null;
  A.on('camera', (view) => {
    if (view !== 'bed' && view !== 'column') return false;
    const f = S.sim && S.sim.fall, list = f && f.sea ? A.pieces() : [];
    if (!gl || !list.length) return false;          // no fall: the page places it as its Quarter view
    const cam = A.camera, sea = f.sea;
    if (view === 'bed') {
      const P = pieceOf(list, A.views.bed.piece); mid3(P, aim);
      const a = 0.5;                                   // [appearance] the eye off the point under her, toward her starboard quarter
      const X = aim.x + BED_EYE.off * Math.sin(a), Y = -aim.z - BED_EYE.off * Math.cos(a);
      eye.copy(at3(X, Y, -bedDepth(sea, X, Y) + BED_EYE.up));
      // looking up at her, she high in the picture while she is high above, so that the bed comes into its foot as she
      // nears it [appearance]
      const dx = aim.x - eye.x, dy = aim.y - eye.y, dz = aim.z - eye.z, L = look.bed, her = Math.atan2(dy, Math.hypot(dx, dz));
      const yaw = Math.atan2(dz, dx) + L.yaw, pitch = clamp(her - 0.6 * (BED_EYE.fov * D2R / 2) * clamp(her / 0.6, 0, 1) + L.pitch, -1.5, 1.52), cp = Math.cos(pitch);
      cam.position.copy(eye); cam.lookAt(aim.set(eye.x + 100 * cp * Math.cos(yaw), eye.y + 100 * Math.sin(pitch), eye.z + 100 * cp * Math.sin(yaw)));
      return true;
    }
    // the column: from the surface at the head of the stage's free part (under the view bar: C-4's layout; from the
    // stage's own head "the surface, above" lay under the bar, 8d's picture) to the bed just above whatever covers its
    // foot (the damage diagram; the Bridge on a watch), with the page's view offset as it stands, from her starboard side,
    // turned by a drag
    let cx = 0, cz = 0; for (const p of list) { mid3(p, aim); cx += aim.x; cz += aim.z; } cx /= list.length; cz /= list.length;
    const B = run.B || [cx, -cz], bed = bedDepth(sea, B[0], B[1]), t = Math.tan(cam.fov * D2R / 2), v = cam.view;
    const o = v && v.enabled ? v.offsetY / v.fullHeight : 0, up = t * (1 - 2 * o), down = t * (1 + 2 * o);
    const sr = stage ? stage.getBoundingClientRect() : null, H = sr && sr.height > 0 ? sr.height : 1;
    let foot = H;
    for (const e of [document.querySelector('.strip'), $('bridge')]) {
      if (!sr || !e || e.hidden || !e.getClientRects().length) continue;
      const r = e.getBoundingClientRect(); if (r.left < sr.left + sr.width / 2 && r.right > sr.left + sr.width / 2) foot = Math.min(foot, r.top - sr.top);
    }
    const fr = A.layoutFree ? A.layoutFree() : null, head = fr && fr.h > 1 ? Math.min(fr.y, H * 0.5) : 0, m = H * (1 - COLUMN.fill) / 2;
    const tanAt = (px) => up - (px / H) * (up + down), tTop = tanAt(head + m), tBed = tanAt(Math.max(head + H * 0.3, foot - m));
    const D = bed / (tTop - tBed), y = -tTop * D, az = Math.PI / 2 + look.column.az;
    cam.position.set(cx + D * Math.cos(az), y, cz + D * Math.sin(az)); cam.lookAt(aim.set(cx, y, cz));
    return true;
  });
  // looked about from: a drag turns the bed's eye, or the column's bearing (the page leaves these drags to this part)
  const canvas = A.canvas, ptrs = new Map();
  if (canvas) {
    canvas.addEventListener('pointerdown', (e) => { if (S.view === 'bed' || S.view === 'column') ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); });
    canvas.addEventListener('pointermove', (e) => {
      const p = ptrs.get(e.pointerId); if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
      if (S.view === 'bed') { look.bed.yaw -= dx * 0.004; look.bed.pitch = clamp(look.bed.pitch + dy * 0.004, -1.4, 1.4); }
      else if (S.view === 'column') look.column.az += dx * 0.004;
    });
    const lift = (e) => ptrs.delete(e.pointerId);
    canvas.addEventListener('pointerup', lift); canvas.addEventListener('pointercancel', lift);
  }

  // =================================================================== the card: a line as each piece comes to rest
  const WRECK_SAYS = { bow: ' (the wreck\'s bow lies about 0.8 km from that point; the fall is not fitted to it)', stern: ' (the wreck\'s stern lies about 150 m from it)' };
  // the run the wreck came from (the kept set's own test, site/app.js's keptRun); a page without it keeps the scenario's
  const wreckHere = () => (typeof A.keptRun === 'function' ? !!A.keptRun() : (S.scen === 'titanic' || S.scen === 'watch'));
  function putLines() {
    const body = document.querySelector('#endCard .endcard-body'); if (!body) return;
    for (const p of body.querySelectorAll('p.deep-line')) p.remove();
    let at = body.querySelector('p');               // after the card's first line (when she foundered)
    for (const t of run.lines) { const p = el('p', t === UPSIDE ? 'deep-line deep-note' : 'deep-line', t); if (at) at.insertAdjacentElement('afterend', p); else body.appendChild(p); at = p; }
  }
  function onRest(e) {
    const sim = S.sim, f = sim && sim.fall, p = f && f.pieces.find(q => q.id === e.piece); if (!p || !run.B) return;
    // where it lies: its middle, against the point under the break
    const qq = p.q, xm = middleX(p), w = qq[0], x = qq[1], y = qq[2], z = qq[3];
    const X = p.r[0] + (1 - 2 * (y * y + z * z)) * xm, Y = p.r[1] + 2 * (x * y + w * z) * xm, d = Math.hypot(X - run.B[0], Y - run.B[1]);
    const far = d < 1000 ? f0(d) + ' m' : (d / 1000).toFixed(1) + ' km', clock = A.clockOf ? A.clockOf(e.t) : null;
    const when = clock || (Math.round(e.t / 60) + ' min into the run'), down = f0(e.depth) + ' m down';
    const who = NAMES[p.id] || p.id, gap = run.first === null ? 0 : e.t - run.first, later = gap < 90 ? Math.round(gap) + ' s' : Math.round(gap / 60) + ' min';
    // RC2 (the red team's row 19): on the 1912 night (its watch, or its damage) the card sets the wreck beside the model's
    // figure, rounded as its source allows (the bow's place names no source: about 0.8 km, its note's band 540 to 950 m;
    // the stern about 150 m). The fall is not fitted to it (D49; Bo, 2026-11-24: "Keep it unfitted"). Only on the night the
    // wreck came from: the 1912 damage as built, or the 1912 watch on its recorded orders (TitanicApp.keptRun). A night of
    // the player's own breaks elsewhere and at another time, so the wreck's distances "from that point" would not hold
    // (the first ten minutes played cold, 2026-11-24: "Take the watch" and a turn 20 s after the bells broke at 1:31 am)
    const wreck = wreckHere() ? (WRECK_SAYS[p.id] || '') : '';
    run.lines.push(run.whole ? 'She is on the bed at ' + when + ', ' + down + ', ' + far + ' from where she went under.'
      : (run.first === null ? 'The ' + who + ' is on the bed at ' + when + ', ' + down + ', ' + far + ' from where she broke' + wreck + '.'
        : 'The ' + who + ' followed at ' + when + ', ' + later + ' later, ' + down + ', ' + far + ' from where she broke' + wreck + '.'));
    if (p.id === 'bow' && f.rule === 'flag' && p.state === 'at rest' && upsideDown(p)) run.lines.push(UPSIDE);   // D98
    if (run.first === null) run.first = e.t;
    putLines();
  }
  A.on('event', (name, data) => {
    if (name === 'fall' && data) {
      if (run.sim !== S.sim) fresh(S.sim);
      run.seen.push(data.id + ':' + data.piece);
      if (data.id === 'under' && run.tUnder[data.piece] === undefined) run.tUnder[data.piece] = data.t;
      if (data.id === 'rest') onRest(data);
    } else if (name === 'view') {
      if (data === 'bed') { look.bed.yaw = 0; look.bed.pitch = 0; }
      if (data === 'column') look.column.az = 0;
    }
  });
  A.on('reset', () => {
    fresh(null); run.drawn = null;
    if (VB.some(([v]) => v === S.view)) A.setView('quarter');   // a new run has no fall to be with
  });
  window.addEventListener('resize', () => { run.reframe = true; });   // at rest, the views' numbers again for the new shape

  // for the tests (tools/deep_site_test.js) and for exploring: read-only in spirit
  A.deep = {
    shown: () => shown, shownK: () => run.shownK, events: () => run.seen.slice(), lines: () => run.lines.slice(), breakPoint: () => (run.B ? run.B.slice() : null),
    WRECK_SAYS, BOW_SAYS, BOW_SHORT,                // RC2: the card's wreck beside the model's figure, the survey's words (rows 19, 26)
    wreckHere,                                      // RC2: whether this run is the night the wreck came from (keptRun)
    readouts: () => Object.keys(rows).map(id => ({ id, depth: rows[id].d.textContent, speed: rows[id].v.textContent, pressure: rows[id].p.textContent, water: rows[id].T.textContent, under: rows[id].u.textContent })),
    // each mark: the tick's middle on the column, and the column's top and height, all in screen pixels
    marks: () => { const c = colEl.getBoundingClientRect(); return Object.keys(marks).map(id => { const r = marks[id].at.getBoundingClientRect(), b = marks[id].chip.getBoundingClientRect(); return { id, y: r.top + r.height / 2, colTop: c.top, colH: c.height, chip: [b.left, b.top, b.right, b.bottom] }; }); },
    // each piece's keel as drawn: its lowest point's depth (of the hull's points the piece draws: those between its x0
    // and x1), and the bed's depth under that point
    keel: () => {
      const f = S.sim && S.sim.fall; if (!f || !gl) return [];
      return A.pieces().map(p => {
        const a = p.hull.geometry.attributes.position, v = new THREE.Vector3(); let lo = Infinity, X = 0, Y = 0;
        for (let i = 0; i < a.count; i++) { v.fromBufferAttribute(a, i); if (v.x < p.x0 || v.x > p.x1) continue; v.applyMatrix4(p.group.matrix); if (v.y < lo) { lo = v.y; X = v.x; Y = -v.z; } }
        const m = f.pieces.find(q => q.id === p.id);
        return { id: p.id, drawn: -lo, model: m ? m.depth : null, bed: bedDepth(f.sea, X, Y), at: [X, Y] };
      });
    },
    net: () => (run.laid ? Object.assign({ step: [NET.near, NET.far], half: [NET.nearHalf, NET.farHalf], visible: !!(T3 && T3.near.visible) }, run.laid) : null),
    survey: () => { const f = S.sim && S.sim.fall; return f && run.B ? { visible: !!(T3 && T3.survey.visible), B: run.B.slice(), psi: (f.at && f.at.psi) || 0, at: SURVEY.map(s => ({ id: s.id, XY: siteToFall(s.E, s.N, (f.at && f.at.psi) || 0, run.B) })) } : null; },
    // the survey's words as they stand in the picture: each one's box (-1 to 1; null behind the eye, or not drawn: none of
    // its lines inside the picture), how many lines it
    // was moved down to keep clear (up when negative), how far it is drawn left of its anchor, whether it shows its short
    // form, and whether it found no clear line (`stuck`: clearWords laid it where it overlaps least)
    words: () => (T3 ? T3.words.map(wordShown).map(sp => ({ box: sp.visible ? wordBox(sp, sp.center.y) : null, down: Math.round((sp.center.y - 0.5) / 1.15), shift: sp.center.x, short: !!sp.userData.short, stuck: !!sp.userData.noLine })) : []),
    // at rest: the model's bow from the point under the break, along her heading at the flag and across it (m), and that
    // heading (degrees true) (QC B-5)
    gap: () => (run.word ? Object.assign({}, run.word) : null),
    // at rest: for Bow down and Stern down, the point they are with, their numbers, and the gap between piece and outline
    rest: () => { if (!run.rest) return null; const o = {}; for (const v in run.rest) o[v] = { mid: run.rest[v].mid.toArray(), at: Object.assign({}, run.rest[v].at), gap: run.rest[v].gap }; return o; },
    lamp: () => (T3 ? { intensity: T3.lamp.intensity, at: T3.lamp.position.toArray(), inScene: T3.lampIn, hull: A.pieces().map(p => p.drawnWith === T3.hullMat) } : null),
    water: () => (T3 ? { visible: T3.water.visible, depth: T3.water.material.uniforms.uDepth.value, night: T3.water.material.uniforms.uNight.value } : null),
    specks: () => (T3 ? { visible: T3.specks.visible, n: SPECKS.n } : null),
    bedDepth, colAt, pressureAt, siteToFall, VIEWS: VB.map(([v]) => v), LAMP, NET, SURVEY, UPSIDE,
  };
})();
