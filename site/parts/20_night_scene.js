/*
 * Night, and the eyes of people who were there: a part of the viewer (site/parts/*.js; "parts" in site/app.js; the rule in
 * CLAUDE.md). It hooks the frame and the camera, reads the model's state and the page's own scene, builds its own
 * controls, and never writes into the model (state.sim): the 1912 orders watched through it have the model's own
 * fingerprint (tools/night_scene_site_test.js).
 *
 *   Night        a second look beside X-ray. The grid sea is hidden and a night sea drawn in its place; more stars, down
 *                to the horizon; the hull solid (through the page's own X-ray switch), lit by her own lights and by
 *                starlight only; the berg a dark mass with no white at its foot. Off: everything as it was, X-ray too.
 *   Crow's nest  the lookouts' eye on the foremast, carried by her pose. Drag to look about.
 *   Boat         the eye of someone in a lifeboat lying off her beam. It is fixed to the earth: she moves on, or goes
 *                down, and the boat stays where it is. Drag to look about; the wheel (a pinch on a phone) brings it nearer
 *                or farther; the button again brings it back off her beam.
 *
 * Everything drawn here is appearance, not physics. Each look is marked [appearance], with the fact it rests on where
 * there is one: a clear, moonless, flat-calm night, and no breaking water at the berg's foot to show it, which is why it
 * was seen so late (README, "Take the bridge"); her lights where site/visuals.js puts them and burning while the dynamos
 * of core/systems.js run (docs/research/RESEARCH_stern_gear_wake_lights_v1_1_2026-11-16.md). A number that is no
 * source's is a [bet]. The berg is not drawn before the lookout's bells in any look or from any eye: site/app.js decides
 * that, and this part never draws it itself.
 */
(function () {
  'use strict';
  const A = window.TitanicApp, THREE = window.THREE, C = window.TitanicCore;
  if (!A || !THREE || !C || !A.renderer) return;          // no WebGL: the page draws no scene, and nor does this part
  const S = A.state, scene = A.scene, camera = A.camera, renderer = A.renderer, shipG = A.shipGroup, earth = A.earth, canvas = A.canvas;
  const G = C.G, TAU = 2 * Math.PI, D2R = Math.PI / 180;
  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const v3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);

  // =================================================================== the numbers
  // Colours are what the screen shows (the page writes them unconverted); a screen cannot show starlight's range, so the
  // night is drawn a little brighter than the eye would find it, and sea and sky are kept apart at the horizon.
  const NIGHT = {
    hor: [0.100, 0.120, 0.150],     // [appearance] the sky at the horizon: airglow and the light of the whole starry sky (moonless: README)
    zen: [0.016, 0.021, 0.034],     // [appearance] the zenith: as dark as a screen allows
    deep: [0.004, 0.006, 0.010],    // [appearance] the water itself: no moon, nothing to light it from above
    fMax: 0.55,                     // [appearance] the sea's reflectance near grazing, held under a perfect mirror's so that sea and sky part at the horizon
    stars: 7000, magLimit: 6.8,     // [appearance] the naked eye's stars on an exceptionally clear night (clear: README): a random field, not the sky of 14 April
    extinction: 0.12,               // [appearance] magnitudes for each air mass: stars dim and thin towards the horizon, and still reach it
    hemi: 0.09,                     // [appearance] starlight on her and on the berg: the page's sky light turned down; no moon, so no other light
    hull: 0.12,                     // [appearance] starlight on her plating (the night hull below)
    // [appearance] a dark mass a little paler than the sky behind it, with no white at its foot: there was no breaking water
    // there to show it, which is why it was seen so late (a flat calm: README). Its shape above water is the page's own
    berg: { color: [0.62, 0.68, 0.74], emissive: [0.058, 0.069, 0.084] },
    wake: 0.22, waves: 0.22, bowWave: 0.6,   // [appearance] her wake's foam, Kelvin's crests and her bow wave, as site/visuals.js lays them: faint, with only starlight and her lamps on them
    smoke: [0.015, 0.015, 0.016], steam: [0.12, 0.125, 0.135],   // [appearance] her coal smoke a darkness that hides stars; the steam she blows off a faint wisp
    glow: { white: 0.10, funnel: 0.018, mast: 0.008, window: 0.42, deck: 0.07 },   // [appearance] her deck lamps and lit windows on her deckhouses, at full light; dimming with her lights
  };
  // [appearance] the swell: "a long slow swell that is barely there" on a flat-calm night (README: flat calm). Three long
  // waves, about four thousandths of a radian of slope in all; they bend reflections and nothing else (the sea stays the
  // model's plane); their speed is deep water's, sqrt(g k)
  const SWELL = [
    { len: 180, a: 0.12, dir: 75 * D2R, ph: 0.0 },
    { len: 120, a: 0.06, dir: 110 * D2R, ph: 2.1 },
    { len: 260, a: 0.10, dir: 50 * D2R, ph: 4.4 },
  ];
  // the crow's nest: on the foremast as site/topsides.js draws it (its foot at +95.0 on the forecastle, raked aft about
  // 9.7 degrees: docs/research/RESEARCH_topsides_dimensions_v1_2026-11-19.md, 2.2), its cage round the lookouts' eye. The
  // eye 29 m above the water at her draft of that night (Wilding's drafts) [read: BWC, "about 95 ft. above the
  // waterline"], 1 m forward of the mast's axis [bet: the nest's front]: the drawn cage and this eye are one number
  const NEST = (() => {
    const TS = window.TitanicTopsides, n = TS && TS.built().nest;
    if (n) return { x: n.eye.x, y: 0, z: n.eye.z, above: n.above, zWL: n.zWL, fov: 58, pitch0: -0.06 };
    const xm = 93.5, rake = 0.06, z0 = C.zTopAt(xm), P = C.DEFAULT_PARAMS;   // without the topsides: the upright mast of before
    const zWL = P.draftA + (P.draftF - P.draftA) * (xm - G.xAP) / (G.xFP - G.xAP), above = 29.0, z = zWL + above;
    return { x: xm - (z - z0) * Math.tan(rake) + 1.0, y: 0, z, above, zWL, fov: 58, pitch0: -0.06 };
  })();
  // the boat: off her port beam [appearance: the side], 300 m off and the eye 1.2 m above the sea [appearance: a person
  // seated in a boat lying off her, as survivors described her going]. Fixed to the earth: on a watch the model's (north,
  // east: core/motion.js); on a damage preset she lies stopped at the scene's origin heading north, and the scene is the
  // earth. It looks at her amidships 8 m above the sea; the wheel moves it from 60 m to 3 km off her amidships, never
  // within 30 m of her sides or ends [appearance]. Both eyes see 58 degrees from top to bottom, as the Bridge does.
  const BOAT = { dist: 300, h: 1.2, side: 1, min: 60, max: 3000, fov: 58, aim: 8, clear: 30 };

  // =================================================================== the page's own pieces this part works with
  // by name, from TitanicApp (site/app.js, N2), where the page keeps them; only its two lights are found by their kind
  const hemis = scene.children.filter(o => o.isHemisphereLight), suns = scene.children.filter(o => o.isDirectionalLight);
  const hullMesh = A.hull;
  const faces = (A.deckhouses || []).slice();     // her deckhouses, funnels and masts (userData.solid is each one's colour)
  const holeGroup = A.marks ? A.marks.openings : null, dentPts = A.marks ? A.marks.dents : null;
  const lines = [A.track, A.course].filter(Boolean);                      // her track and her course: a diagram's lines
  // her funnel smoke and the steam she blows off (site/app.js): at night the same puffs in other colours, on the page's own
  // uniforms, so they rise and spread as before
  const puffs = [[A.smoke, true], [A.steam, false]].filter(([p]) => p && p.points && p.points.material && p.points.material.isShaderMaterial).map(([p, smoke]) => {
    const o = p.points, m = o.material, c = smoke ? NIGHT.smoke : NIGHT.steam;
    const frag = m.fragmentShader.replace(/vec3\(0\.[0-9., ]+\), a\)/, 'vec3(' + c.map(x => x.toFixed(3)).join(', ') + '), ' + (smoke ? 'min(1.0, 1.5 * a))' : 'a)'));
    return { o, day: m, night: new THREE.ShaderMaterial({ uniforms: m.uniforms, vertexShader: m.vertexShader, fragmentShader: frag, transparent: true, depthWrite: false }) };
  });
  // her wake (site/app.js): the ribbon's foam in a night copy of its own material (its uniforms shared); the lines of
  // Kelvin's crests and the bow wave turned down through their opacity
  const W = A.wake || {}, rib = W.ribbon && W.ribbon.material && W.ribbon.material.isShaderMaterial ? W.ribbon : null;
  const ribNight = rib ? new THREE.ShaderMaterial({
    uniforms: rib.material.uniforms, vertexShader: rib.material.vertexShader, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    fragmentShader: 'varying float vA; varying float vSide; void main(){ float a = vA * (1.0 - abs(vSide)); gl_FragColor = vec4(vec3(0.55, 0.60, 0.64) * a * ' + (0.55 * NIGHT.wake).toFixed(4) + ', 1.0); }',
  }) : null;
  const dimmed = [[W.lines, NIGHT.waves], [W.bow, NIGHT.bowWave]].filter(([o]) => o && o.material && o.material.transparent);
  // the berg above the water, on a watch (the page builds one for each: asked each time). Found before as the earth's
  // first group, which a boat parked on the earth (site/parts/50_boats.js) or a rocket could have been
  const bergAbove = () => { const b = A.berg ? A.berg() : null; return b && b.above && b.above.isMesh ? b.above : null; };
  if (!hullMesh) { console.warn('night scene: the hull was not found; the part is off'); return; }

  // =================================================================== shared GLSL and uniforms
  const U = {
    uHor: { value: v3(NIGHT.hor) }, uZen: { value: v3(NIGHT.zen) }, uFar: { value: new THREE.Vector3() }, uDeep: { value: v3(NIGHT.deep) },
    uFmax: { value: NIGHT.fMax }, uW: { value: SWELL.map(() => new THREE.Vector4()) }, uC: { value: new THREE.Vector2() },
    uTime: { value: 0 }, uPx: { value: 1 },
    // her wake's slopes (site/parts/26_wake_seams.js fills these and puts its own wakeSlope in place of the default below;
    // without it they stay as they are and the sea is the swell's alone)
    uWakeN: { value: null }, uWakeF: { value: null }, uWakeHull: { value: null }, uWakeT: { value: new THREE.Vector4() },
    uWakeO: { value: new THREE.Vector4() }, uWakeS: { value: new THREE.Vector4() }, uWakeHX: { value: new THREE.Vector3() },
  };
  // the sea far off: the horizon's glow in its reflectance, over the dark water (the sky below the level shows the same)
  U.uFar.value.copy(U.uHor.value).multiplyScalar(NIGHT.fMax).addScaledVector(U.uDeep.value, 1 - NIGHT.fMax);
  const GLSL_SKY = `
    uniform vec3 uHor; uniform vec3 uZen; uniform vec3 uFar;
    vec3 skyAt(float h){ float s = max(h, 0.0); return uZen + (uHor - uZen) * (0.62 * exp(-s / 0.09) + 0.38 * exp(-s / 0.5)); }
  `;
  const GLSL_SWELL = `
    uniform vec4 uW[3]; uniform vec2 uC;
    /* wake: slope */ vec2 wakeSlope(vec2 p){ return vec2(0.0); } /* wake end */
    vec2 slope(vec2 p){ vec2 g = vec2(0.0); for (int i = 0; i < 3; i++) { vec4 w = uW[i]; g += w.z * w.xy * cos(dot(w.xy, p - uC) + w.w); } return g + wakeSlope(p); }
    float fres(float c, float fMax){ return min(fMax, 0.02 + 0.98 * pow(1.0 - clamp(c, 0.0, 1.0), 5.0)); }
  `;
  // the swell's phases for this frame, in the scene's frame: the sea's own uPsi and uPos (site/app.js), so that the night
  // sea slides past her at her speed and turns with her heading; computed here in doubles, so the shader's numbers stay small
  function swell(t) {
    const su = A.seaMat.uniforms, psi = su.uPsi.value, P = su.uPos.value, cs = Math.cos(psi), sn = Math.sin(psi);
    const cx = camera.position.x, cz = camera.position.z, cN = cx * cs - cz * sn + P.x, cE = cx * sn + cz * cs + P.y;
    SWELL.forEach((w, i) => {
      const k = TAU / w.len, kN = k * Math.cos(w.dir), kE = k * Math.sin(w.dir), om = Math.sqrt(C.GRAV * k);
      const ph = (((kN * cN + kE * cE - om * t + w.ph) % TAU) + TAU) % TAU;
      U.uW.value[i].set(kN * cs + kE * sn, -kN * sn + kE * cs, w.a, ph);
    });
    U.uC.value.set(cx, cz);
  }

  // =================================================================== the night's pieces
  // [appearance] the sky: replaces the page's sky material while the look is on; its gradient is seen from the eye,
  // wherever it is
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, uniforms: { uHor: U.uHor, uZen: U.uZen, uFar: U.uFar },
    vertexShader: 'varying vec3 vD; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vD = w.xyz - cameraPosition; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: GLSL_SKY + 'varying vec3 vD; void main(){ vec3 d = normalize(vD); gl_FragColor = vec4(d.y >= 0.0 ? skyAt(d.y) : uFar, 1.0); }',
  });
  // [appearance] the sea: nearly black, a mirror of the faint sky (water's reflectance, Schlick's form) that brightens
  // towards the horizon, bent by the swell; opaque from above, a dark lid seen from below
  const seaMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: true, side: THREE.DoubleSide,
    uniforms: { uHor: U.uHor, uZen: U.uZen, uFar: U.uFar, uDeep: U.uDeep, uFmax: U.uFmax, uW: U.uW, uC: U.uC },
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: GLSL_SKY + GLSL_SWELL + `
      uniform vec3 uDeep; uniform float uFmax; varying vec3 vW;
      void main(){
        if (!gl_FrontFacing) { gl_FragColor = vec4(uDeep * 2.5, 0.6); return; }       // from under the water: a dark lid
        vec3 v = normalize(vW - cameraPosition);
        vec2 g = slope(vW.xz);
        vec3 n = normalize(vec3(-g.x, 1.0, -g.y));
        float F = fres(-dot(v, n), uFmax);
        vec3 col = F * skyAt(reflect(v, n).y) + (1.0 - F) * uDeep;
        col = mix(col, uFar, smoothstep(3000.0, 4400.0, length(vW.xz - cameraPosition.xz)));
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const nightSea = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000, 1, 1).rotateX(-Math.PI / 2), seaMat);
  nightSea.renderOrder = 1; nightSea.frustumCulled = false; nightSea.visible = false; scene.add(nightSea);

  // [appearance] the stars: a random field down to the horizon, brighter ones fewer (counts rising about three times a
  // magnitude), dimmed and thinned by the air near the horizon, twinkling a little low down; centred on the eye and turned
  // with her heading as the page's own stars are
  const starGeo = (() => {
    const n = NIGHT.stars, pos = new Float32Array(n * 3), aB = new Float32Array(n), aS = new Float32Array(n), aT = new Float32Array(n * 3), aP = new Float32Array(n);
    let seed = 19120414; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const m0 = -1.5, span = Math.pow(10, 0.48 * (NIGHT.magLimit - m0)) - 1, R = 4400;
    const tints = [[1.0, 0.80, 0.60], [1.0, 0.93, 0.82], [0.93, 0.95, 1.0], [0.80, 0.87, 1.0]];
    for (let i = 0; i < n; i++) {
      const s = -0.003 + 1.003 * rnd(), az = rnd() * TAU, ce = Math.sqrt(1 - s * s);
      pos[i * 3] = R * ce * Math.cos(az); pos[i * 3 + 1] = R * s; pos[i * 3 + 2] = R * ce * Math.sin(az);
      const m = m0 + Math.log10(1 + rnd() * span) / 0.48, me = m + NIGHT.extinction * (1 / (Math.max(0, s) + 0.03) - 1);
      const f = Math.pow(10, -0.4 * (me - 1));    // its light against a first-magnitude star's
      aB[i] = Math.min(1, 1.5 * Math.pow(f, 0.38));   // compressed: no screen shows the range
      aS[i] = 1.0 + 1.8 * Math.min(1, Math.pow(f, 0.4));
      const k = rnd(); aT.set(tints[k < 0.1 ? 0 : (k < 0.32 ? 1 : (k < 0.8 ? 2 : 3))], i * 3); aP[i] = rnd();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aB', new THREE.BufferAttribute(aB, 1));
    g.setAttribute('aS', new THREE.BufferAttribute(aS, 1)); g.setAttribute('aT', new THREE.BufferAttribute(aT, 3)); g.setAttribute('aP', new THREE.BufferAttribute(aP, 1));
    return g;
  })();
  // a point under two pixels is one pixel, drawn whole (a round falloff would lose it where its centre falls)
  const GLSL_DOT = 'float dot2(float size, vec2 q, float sx){ return size < 2.0 ? 1.0 : 1.0 - smoothstep(0.28, 0.5, length(vec2(q.x * sx, q.y))); }';
  const starMat = new THREE.ShaderMaterial({
    blending: THREE.AdditiveBlending, depthWrite: false, uniforms: { uPx: U.uPx, uTime: U.uTime },
    vertexShader: `attribute float aB; attribute float aS; attribute vec3 aT; attribute float aP; uniform float uPx; uniform float uTime; varying vec3 vC; varying float vS;
      void main(){ vec3 d = normalize(position); float low = 1.0 - smoothstep(0.0, 0.3, d.y);
        vC = aT * aB * (1.0 + 0.3 * low * sin(uTime * (1.7 + 2.9 * aP) + 37.0 * aP));
        vS = aS * uPx; gl_PointSize = vS; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: GLSL_DOT + ' varying vec3 vC; varying float vS; void main(){ gl_FragColor = vec4(vC * dot2(vS, gl_PointCoord - 0.5, 1.0), 1.0); }',
  });
  const stars = new THREE.Points(starGeo, starMat); stars.renderOrder = -9; stars.frustumCulled = false; stars.visible = false; scene.add(stars);

  // [appearance] the stars in the glassy sea: each where the swell's facet shows it, as bright as the water's reflectance there
  const starReflMat = new THREE.ShaderMaterial({
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, uniforms: { uPx: U.uPx, uFmax: U.uFmax, uW: U.uW, uC: U.uC },
    vertexShader: GLSL_SWELL + `
      attribute float aB; attribute float aS; attribute vec3 aT; uniform float uPx; uniform float uFmax; varying vec3 vC; varying float vS;
      void main(){
        vec3 d = normalize(mat3(modelMatrix) * position), cam = cameraPosition;
        vC = vec3(0.0); vS = 1.0; gl_PointSize = 1.0; gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
        if (d.y < 0.004 || cam.y < 0.05) return;
        vec3 v = vec3(d.x, -d.y, d.z);
        vec3 P = cam + v * min(cam.y / -v.y, 4300.0);
        vec2 g = slope(P.xz);
        v = reflect(d, normalize(vec3(-g.x, 1.0, -g.y)));
        if (v.y > -0.0005) return;
        P = cam + v * min(cam.y / -v.y, 4300.0); P.y = 0.04;
        vC = aT * aB * fres(-v.y, uFmax);
        vS = aS * uPx * 1.8; gl_PointSize = vS;
        gl_Position = projectionMatrix * viewMatrix * vec4(P, 1.0);
      }`,
    fragmentShader: GLSL_DOT + ' varying vec3 vC; varying float vS; void main(){ gl_FragColor = vec4(vC * dot2(vS, gl_PointCoord - 0.5, 2.2), 1.0); }',
  });
  const starRefl = new THREE.Points(starGeo, starReflMat); starRefl.renderOrder = 2; starRefl.frustumCulled = false; starRefl.visible = false; scene.add(starRefl);

  // [appearance] her lit ports in the glassy sea: the near side's, where the swell's facet shows each; and a lit port under
  // a few metres of water glowing through it, at the surface over it [appearance] (its own spot, vG, back as before NH15's
  // F6). Both are gated by G1's circuits (D97) through the page's own mark of each port (aOut: its section's fuses have
  // blown): such a port gives the sea nothing. Her own ports' places, light and size (site/app.js: ports.mat's uOn and
  // uScale, unchanged), so they burn and go out with the dynamos of core/systems.js
  const PM = A.ports.mat.uniforms;
  const portReflMat = new THREE.ShaderMaterial({
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    uniforms: { uOn: PM.uOn, uScale: PM.uScale, uFmax: U.uFmax, uW: U.uW, uC: U.uC },
    vertexShader: GLSL_SWELL + `
      attribute float aOut; uniform float uOn; uniform float uScale; uniform float uFmax; varying vec3 vC; varying float vG; varying float vS;
      void main(){
        vec4 w = modelMatrix * vec4(position, 1.0); vec3 cam = cameraPosition;
        vC = vec3(0.0); vG = 0.0; vS = 1.0; gl_PointSize = 1.0; gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
        if (uOn <= 0.0 || cam.y < 0.05 || aOut > 0.5) return;
        if (w.y < 0.0) {
          float k = exp(w.y / 1.6); if (k < 0.03) return;
          vec4 mu = viewMatrix * vec4(w.x, 0.04, w.z, 1.0);
          vC = vec3(0.10, 0.40, 0.38) * uOn * k; vG = 1.0;
          vS = clamp(3.2 * uScale / -mu.z, 2.0, 24.0); gl_PointSize = vS; gl_Position = projectionMatrix * mu; return;
        }
        vec3 side = mat3(modelMatrix) * vec3(0.0, 0.0, sign(position.z));
        if (dot(side, cam - w.xyz) <= 0.0) return;
        vec3 m = vec3(w.x, -w.y, w.z), v = normalize(m - cam);
        if (v.y > -0.0005) return;
        vec3 P = cam + v * min(cam.y / -v.y, 4300.0);
        vec2 g = slope(P.xz);
        v = reflect(vec3(v.x, -v.y, v.z), normalize(vec3(-g.x, 1.0, -g.y)));
        if (v.y > -0.0005) return;
        P = cam + v * min(cam.y / -v.y, 4300.0); P.y = 0.04;
        vC = vec3(1.0, 0.82, 0.5) * uOn * 0.8 * fres(-v.y, uFmax);
        vS = clamp(0.9 * uScale / length(m - cam), 1.2, 6.0) * 2.4; gl_PointSize = vS;
        gl_Position = projectionMatrix * viewMatrix * vec4(P, 1.0);
      }`,
    fragmentShader: GLSL_DOT + ` varying vec3 vC; varying float vG; varying float vS;
      void main(){ vec2 q = gl_PointCoord - 0.5; float a = vG > 0.5 ? exp(-32.0 * dot(q, q)) : dot2(vS, q, 2.6); gl_FragColor = vec4(vC * a, 1.0); }`,
  });
  const portRefl = new THREE.Points(A.ports.pts.geometry, portReflMat); portRefl.renderOrder = 2; portRefl.frustumCulled = false; portRefl.visible = false; shipG.add(portRefl);

  // [appearance] her hull at night: the page's solid colours (site/app.js hullSolid), lit by starlight from the sky above
  // and by her own lights: a glow round each row of lit ports, her deck lamps on her decks; her decks' planking drawn; her
  // white top strake over the yellow sheer line and the antifouling's edge as site/topsides.js has them
  const f4 = (v) => v.toFixed(4);
  const TSN = (window.TitanicTopsides && window.TitanicTopsides.N) || { strake: 0.25, sheerLine: 0.24, boot: { z: 10.3, rise: 0, from: 75 } };
  const hullMat = new THREE.ShaderMaterial({
    uniforms: { uFront: hullMesh.material.uniforms.uFront, uAp: hullMesh.material.uniforms.uAp, uLit: { value: 1 }, uStar: { value: NIGHT.hull }, uDeep: U.uDeep },
    vertexShader: 'varying vec3 vL; varying vec3 vW; varying vec3 vN; void main(){ vL = position; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `
      const float XFP = ${f4(G.xFP)}; const float XAP = ${f4(G.xAP)};
      const float DB = ${f4(G.deck.B)}; const float DC = ${f4(G.deck.C)}; const float DD = ${f4(G.deck.D)}; const float DE = ${f4(G.deck.E)}; const float DF = ${f4(G.deck.F)};
      float sheer(float x){ float s = x >= 0.0 ? x / XFP : x / XAP; return (x >= 0.0 ? ${f4(G.sheerF)} : ${f4(G.sheerA)}) * s * s; }
      float zTopF(float x){ bool w = (x > ${f4(G.wellFwd[0])} && x < ${f4(G.wellFwd[1])}) || (x > ${f4(G.wellAft[0])} && x < ${f4(G.wellAft[1])}); return (w ? DC : DB) + sheer(x); }
      float row(float zs, float x, float deck){ float d = (zs - (deck + sheer(x) + 1.2)) / 0.9; return exp(-d * d); }
      uniform float uFront; uniform vec4 uAp; uniform float uLit; uniform float uStar; uniform vec3 uDeep;
      varying vec3 vL; varying vec3 vW; varying vec3 vN;
      /* wake: seaZ */ float seaZ(float x, float ys){ return 0.0; } /* wake end */
      void main(){
        float x = vL.x; float zs = vL.y;
        float sz = seaZ(x, -vL.z);                                          // the sea against her here (site/parts/26_wake_seams.js; nought without it)
        if (x > uFront) discard;
        if (x > uAp.x && x < uAp.y && zs > uAp.z && zs < uAp.w) discard;
        vec3 n = normalize(vN);
        float top = zTopF(x), line = DB + sheer(x) - ${f4(TSN.strake)};
        bool deck = zs > top - 0.03;
        float boot = ${f4(TSN.boot.z)} + ${f4(TSN.boot.rise)} * smoothstep(${f4(TSN.boot.from)}, XFP, abs(x));
        vec3 base = zs < boot ? vec3(0.42, 0.10, 0.07) : vec3(0.035, 0.037, 0.04);
        if (zs > line + ${f4(TSN.sheerLine / 2)}) base = vec3(0.80, 0.79, 0.75);
        else if (zs > line - ${f4(TSN.sheerLine / 2)}) base = vec3(0.75, 0.6, 0.3);
        if (deck) base = vec3(0.30, 0.26, 0.20);
        vec3 col = base * uStar * (0.45 + 0.55 * clamp(n.y, 0.0, 1.0));
        float rows = row(zs, x, DC) + row(zs, x, DD) + row(zs, x, DE) + row(zs, x, DF);
        // her deck lamps abaft the bridge only: forward of it her decks are kept dark for the watch [appearance]
        col += vec3(1.0, 0.78, 0.48) * uLit * (0.030 * rows * (1.0 - abs(n.y)) + (deck && x < 72.0 ? 0.10 * base.r : 0.0));
        if (vW.y < sz) { float dep = clamp((sz - vW.y) / 30.0, 0.0, 1.0); col = mix(col, uDeep, 0.5 + 0.5 * dep); }
        gl_FragColor = vec4(col, 1.0);
      }`,
  });

  // =================================================================== the look
  const night = { on: false, saved: null, dents: false };
  function nightOn() {
    if (night.on) return;
    // the hull solid: X-ray claimed off of the page while the night is on (C-4 step 3, site/app.js's claims), never
    // switched off and back; when the claim goes, X-ray is as the player last chose it
    A.claim('look.xray', 'night', false);
    night.saved = {
      sea: A.sea.visible, stars: S.stars ? S.stars.visible : true, sky: S.sky ? S.sky.material : null,
      hemi: hemis.map(l => l.intensity), sun: suns.map(l => l.intensity), faces: faces.map(f => f.material.emissive.getHex()),
      lines: lines.map(l => l.visible),
      rib: rib ? rib.material : null, dimmed: dimmed.map(([o]) => o.material.opacity),
    };
    // her hull in the night's own material: claimed of the page (material.hull), which keeps it there however often the
    // look is applied again, and gives the look's own back when the claim goes (C-4 step 3)
    A.claim('material.hull', 'night', hullMat); night.on = true;
    // the marks of the damage hidden while the night is on: claimed of the page, never saved and given back (QC C-5)
    if (A.marks && A.marks.claim) { A.marks.claim('openings', 'night', true); A.marks.claim('dents', 'night', true); }
    bNight.setAttribute('aria-pressed', 'true');
    A.toast('Night: clear, moonless, flat calm. Her own lights and the stars; X-ray shows the water inside her');
  }
  function nightOff(byXray) {
    if (!night.on) return;
    const k = night.saved;
    A.sea.visible = k.sea; if (S.stars) S.stars.visible = k.stars;
    if (S.sky && S.sky.material === skyMat) S.sky.material = k.sky;
    hemis.forEach((l, i) => { l.intensity = k.hemi[i]; }); suns.forEach((l, i) => { l.intensity = k.sun[i]; });
    faces.forEach((f, i) => f.material.emissive.setHex(k.faces[i]));
    A.claim('material.hull', 'night', null);
    restoreBerg();
    for (const p of puffs) if (p.o.material === p.night) p.o.material = p.day;
    if (rib && rib.material === ribNight) rib.material = k.rib;
    dimmed.forEach(([o], i) => { o.material.opacity = k.dimmed[i]; });
    lines.forEach((l, i) => { l.visible = k.lines[i]; });
    if (A.marks && A.marks.claim) { A.marks.claim('openings', 'night', false); A.marks.claim('dents', 'night', false); }   // the page's rule again, unless another claims them
    nightSea.visible = stars.visible = starRefl.visible = portRefl.visible = false;
    if (A.topsides && A.topsides.lineLook) A.topsides.lineLook(S.xray ? 'xray' : 'solid');   // the page's own look for her lines
    night.on = false; bNight.setAttribute('aria-pressed', 'false');
    A.claim('look.xray', 'night', null);           // its claim let go: X-ray as the player last chose it (byXray: they just did)
  }
  function restoreBerg() {
    const b = bergAbove(), u = b && b.material.userData.nightWas;
    if (!u) return;
    b.material.color.setHex(u.color); b.material.emissive.setHex(u.emissive); delete b.material.userData.nightWas;
  }
  const warm = new THREE.Color(1.0, 0.82, 0.55);
  // each face's glow by what it is (site/app.js gives the topsides' meshes userData.kind): the funnels, masts and black
  // tops as before; the windows and the domes' glass lit from within; the decks' planking under her deck lamps
  const GLOW = { funnel: NIGHT.glow.funnel, mast: NIGHT.glow.mast, cap: 0, black: 0, lettering: 0, window: NIGHT.glow.window, glass: NIGHT.glow.window, deck: NIGHT.glow.deck };
  function frameNight() {
    const lit = PM.uOn.value, cam = camera.position, under = cam.y < 0.05;
    A.sea.visible = false;
    nightSea.visible = true; nightSea.position.set(cam.x, 0, cam.z);
    if (S.stars) S.stars.visible = false;
    const turn = S.stars ? S.stars.rotation.y : 0;            // her heading on a watch (site/app.js turns the page's stars)
    stars.visible = true; stars.position.copy(cam); stars.rotation.y = turn;
    starRefl.visible = !under; starRefl.position.copy(cam); starRefl.rotation.y = turn;
    portRefl.visible = !under && lit > 0;
    U.uPx.value = renderer.getPixelRatio();
    if (S.sky && S.sky.material !== skyMat) { night.saved.sky = S.sky.material; S.sky.material = skyMat; }
    hemis.forEach(l => { l.intensity = NIGHT.hemi; }); suns.forEach(l => { l.intensity = 0; });
    hullMat.uniforms.uLit.value = lit;             // (the hull's material is the night's by its claim, in nightOn)
    for (const f of faces) {
      const s = f.userData.solid, k = f.userData.kind;
      const g = k ? (GLOW[k] !== undefined ? GLOW[k] : NIGHT.glow.white) : (s === 0xc78a3d ? NIGHT.glow.funnel : (s === 0xc9a46a ? NIGHT.glow.mast : (s === 0x111111 ? 0 : NIGHT.glow.white)));
      f.material.emissive.copy(warm).multiplyScalar(g * lit);
    }
    if (A.topsides && A.topsides.lineLook) A.topsides.lineLook('night');   // her rails and rigging starlit, not drawn white
    const b = bergAbove();
    if (b && !b.material.userData.nightWas) {
      b.material.userData.nightWas = { color: b.material.color.getHex(), emissive: b.material.emissive.getHex() };
      b.material.color.setRGB(NIGHT.berg.color[0], NIGHT.berg.color[1], NIGHT.berg.color[2]);
      b.material.emissive.setRGB(NIGHT.berg.emissive[0], NIGHT.berg.emissive[1], NIGHT.berg.emissive[2]);
    }
    for (const p of puffs) if (p.o.material !== p.night) p.o.material = p.night;
    if (rib && rib.material !== ribNight) rib.material = ribNight;
    for (const [o, k] of dimmed) o.material.opacity = k;
    // [appearance] nothing a person there would not have seen: her track and course lines, the markers of her openings
    // and dents (the damage diagram under the stage still shows them)
    for (const l of lines) l.visible = false;      // (the markers and dents: claimed hidden in nightOn)
  }

  // =================================================================== the eyes
  const look = { nest: { yaw: 0, pitch: NEST.pitch0 }, boat: { yaw: 0, pitch: 0 } };
  const boat = { N: 0, E: 0, sim: null, dist: BOAT.dist };
  // setView needs an entry; the camera hook below places these views itself. Their flags (site/app.js, VIEWS): looked
  // about from (a drag turns the eye: the page neither orbits nor pans, and Follow stays on), their field of view, and
  // kept by a new watch, which turns any other view astern
  A.views.nest = Object.assign({}, A.views.quarter, { look: true, fov: NEST.fov, keep: true });
  A.views.boat = Object.assign({}, A.views.quarter, { look: true, fov: BOAT.fov, keep: true });
  const isEye = (v) => v === 'nest' || v === 'boat';
  // her amidships on the earth and her heading: the model's own numbers on a watch; a preset lies stopped at the origin
  function herPlace() {
    const m = S.sim && S.sim.mo;
    return S.night && m ? { N: m.X, E: m.Y, psi: m.psi } : { N: 0, E: 0, psi: 0 };
  }
  function placeBoat() {                          // off her port beam, at the boat's distance
    const p = herPlace(), d = boat.dist, s = BOAT.side;
    boat.N = p.N + s * d * Math.sin(p.psi); boat.E = p.E - s * d * Math.cos(p.psi); boat.sim = S.sim;
  }
  function clearOfHer(N, E, p) {                  // at least BOAT.clear metres off her sides and ends [appearance]
    const c = Math.cos(p.psi), s = Math.sin(p.psi), rN = N - p.N, rE = E - p.E;
    const along = Math.max(0, Math.abs(rN * c + rE * s) - (G.LBP / 2 + 6)), across = Math.max(0, Math.abs(-rN * s + rE * c) - G.B / 2);
    return Math.hypot(along, across) >= BOAT.clear;
  }
  function moveBoat(f) {                          // nearer (f < 1) or farther along the line to her amidships
    if (boat.sim !== S.sim) placeBoat();
    const p = herPlace(), dN = boat.N - p.N, dE = boat.E - p.E, d = Math.hypot(dN, dE) || 1;
    const nd = clamp(d * f, BOAT.min, BOAT.max), N = p.N + dN * nd / d, E = p.E + dE * nd / d;
    if (clearOfHer(N, E, p)) { boat.N = N; boat.E = E; boat.dist = nd; }
  }
  const eyeV = new THREE.Vector3(), dirV = new THREE.Vector3(), tmpV = new THREE.Vector3();
  // the boat's eye in the scene: through the earth group on a watch (site/app.js turns and moves it under her every
  // frame), the scene itself on a preset
  function boatScene(out) {
    if (S.night) { earth.updateMatrix(); return out.set(boat.N - A.E0.x, BOAT.h, boat.E - A.E0.y).applyMatrix4(earth.matrix); }
    return out.set(boat.N, BOAT.h, boat.E);
  }
  // (each view's field of view is the page's to set when it is chosen: VIEWS' fov)
  function aim(eye, yaw, pitch) {
    const cp = Math.cos(pitch);
    dirV.set(cp * Math.cos(yaw), Math.sin(pitch), cp * Math.sin(yaw));
    camera.position.copy(eye); camera.lookAt(tmpV.copy(eye).addScaledVector(dirV, 200));
  }
  A.on('camera', (view) => {
    if (view === 'nest') {
      // the eye in her frame, carried by her pose; its line of sight turned by her heading and trim, as the Bridge's is
      const L = look.nest, cp = Math.cos(L.pitch);
      eyeV.copy(A.SX(NEST.x, NEST.y, NEST.z)).applyMatrix4(shipG.matrix);
      dirV.set(cp * Math.cos(L.yaw), Math.sin(L.pitch), cp * Math.sin(L.yaw)).transformDirection(shipG.matrix);
      camera.position.copy(eyeV); camera.lookAt(tmpV.copy(eyeV).addScaledVector(dirV, 200));
      return true;
    }
    if (view === 'boat') {
      if (boat.sim !== S.sim) placeBoat();
      boatScene(eyeV);
      const M = shipG.matrix.elements, tx = M[12] - eyeV.x, tz = M[14] - eyeV.z, ty = BOAT.aim - eyeV.y;   // towards her
      const L = look.boat;
      aim(eyeV, Math.atan2(tz, tx) + L.yaw, clamp(Math.atan2(ty, Math.hypot(tx, tz)) + L.pitch, -1.2, 1.2));
      return true;
    }
    return false;
  });
  // looking about by dragging, as on the Bridge (these views are looked about from: the page leaves the drag to them)
  const ptrs = new Map(); let pinch = 0;
  canvas.addEventListener('pointerdown', (e) => { if (isEye(S.view)) { ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); pinch = 0; } });
  canvas.addEventListener('pointermove', (e) => {
    const p = ptrs.get(e.pointerId); if (!p || !isEye(S.view)) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
    if (ptrs.size === 1) { const L = look[S.view]; L.yaw -= dx * 0.004; L.pitch = clamp(L.pitch + dy * 0.004, -1.2, 0.9); }
    else if (ptrs.size === 2 && S.view === 'boat') {
      const q = [...ptrs.values()], d = Math.hypot(q[0].x - q[1].x, q[0].y - q[1].y);
      if (pinch) moveBoat(pinch / Math.max(d, 1));
      pinch = d;
    }
  });
  const lift = (e) => { ptrs.delete(e.pointerId); pinch = 0; };
  canvas.addEventListener('pointerup', lift); canvas.addEventListener('pointercancel', lift);
  canvas.addEventListener('wheel', (e) => { if (S.view !== 'boat') return; e.preventDefault(); moveBoat(Math.exp(e.deltaY * 0.0012)); }, { passive: false });

  // a new view: its look reset; the boat put off her beam when it has none for this run. A new watch keeps these views (their
  // keep flag: site/app.js loadNight turns any other astern), and the boat is laid off her beam again for it. (A new run
  // applies the page's look to the bulkheads it builds itself, so the night's solid hull needs nothing done here)
  A.on('event', (name, data) => {
    // the player chose X-ray while the night claims it off (its button, or a damage tool): the later choice; the night
    // turns itself off (C-4 step 3's 'overruled')
    if (name === 'overruled' && data && data.owner === 'night' && data.key === 'look.xray') { nightOff(true); return; }
    if (name !== 'view') return;
    if (data === 'nest') { look.nest.yaw = 0; look.nest.pitch = NEST.pitch0; }
    if (data === 'boat') { look.boat.yaw = 0; look.boat.pitch = 0; if (boat.sim !== S.sim) placeBoat(); }
  });
  A.on('reset', () => {
    boat.sim = null;
    if (S.view === 'boat') placeBoat();
  });
  A.on('frame', (t) => {
    U.uTime.value = t;
    if (!night.on) return;
    if (S.xray) { nightOff(true); return; }        // X-ray was chosen (its button, or a damage tool): that look wins
    swell(t);
    frameNight();
  });

  // =================================================================== the controls
  const touch = () => A.device() !== 'desktop';
  function button(attrs, text) { const b = document.createElement('button'); for (const k in attrs) b.setAttribute(k, attrs[k]); b.textContent = text; return b; }
  const bNight = button({ id: 'bNight', 'aria-pressed': 'false', title: 'Night: the sea, the sky and her lights as they would have looked' }, 'Night');
  if (!(A.addButton && A.addButton('display', bNight, { after: '#bXray' }))) $('bXray').insertAdjacentElement('afterend', bNight);   // C-4: the bar's
  bNight.addEventListener('click', () => { if (night.on) nightOff(false); else nightOn(); });
  const bridgeBtn = document.querySelector('[data-view="bridge"]');
  const bNest = button({ 'data-view': 'nest', 'aria-pressed': 'false', title: 'The crow\'s nest: the lookouts\' eye on the foremast, 29 m above the water' }, 'Crow\'s nest');
  const bBoat = button({ 'data-view': 'boat', 'aria-pressed': 'false', title: 'A boat lying 300 m off her port beam, fixed where it is' }, 'Boat');
  if (!(A.addButton && A.addButton('camera', bNest, { after: '[data-view="bridge"]' }) && A.addButton('camera', bBoat, { after: '[data-view="nest"]' }))) {
    bridgeBtn.insertAdjacentElement('afterend', bNest); bNest.insertAdjacentElement('afterend', bBoat);
  }
  bNest.addEventListener('click', () => {
    A.setView('nest');
    A.toast('The crow\'s nest, 29 m above the water: the lookouts\' eye. Drag to look about');
  });
  bBoat.addEventListener('click', () => {
    const again = S.view === 'boat';
    A.setView('boat');
    if (again) placeBoat();                       // the button again: the boat off her beam once more
    A.toast('A boat ' + Math.round(boat.dist) + ' m off her port beam. Drag to look about; ' + (touch() ? 'pinch' : 'the wheel') + ': nearer or farther');
  });

  // for the tests (tools/night_scene_site_test.js) and for exploring: what this part holds, read-only in spirit
  A.nightScene = {
    get on() { return night.on; },
    NEST, BOAT, NIGHT, SWELL, boat, look,
    sea: nightSea, stars, starRefl, portRefl, hullMat, skyMat,
    placeBoat,
    U,                                            // the shared uniforms, the wake's among them (site/parts/26_wake_seams.js)
  };
})();
