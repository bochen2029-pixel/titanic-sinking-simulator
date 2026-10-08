// Scenario presets shared by the viewer and the headless tools.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./core.js'));
  else root.TitanicScenarios = factory(root.TitanicCore);
})(typeof self !== 'undefined' ? self : this, function (C) {
  'use strict';
  const A4 = 0.210 * 0.297;
  const CALIBRATED_AREA = 0.7506;   // m2 aggregate opening, fitted to the eyewitness timeline (8.1 sq ft)

  // Iceberg damage: short punctures and opened seams along the starboard side
  // (Wilding: ~12 sq ft aggregate; Benson 2025: holes about the size of a sheet of paper).
  // Fractions follow the flooded capacities (Hackett & Bedford): FP, H1, H2, H3, BR6, BR5.
  const TITANIC_SPLIT = [
    { k: 0, f: 0.04, x0: 117, x1: 124, z: 3.2 },
    { k: 1, f: 0.13, x0: 103, x1: 114, z: 2.8 },
    { k: 2, f: 0.21, x0: 88, x1: 100, z: 2.6 },
    { k: 3, f: 0.24, x0: 72, x1: 85, z: 2.5 },
    { k: 4, f: 0.32, x0: 60, x1: 70, z: 2.3 },
    { k: 5, f: 0.06, x0: 53.2, x1: 54.0, z: 2.3 },
  ];

  function icebergDamage(totalArea, split) {
    split = split || TITANIC_SPLIT;
    const out = [];
    for (const s of split) {
      const a = totalArea * s.f;
      const n = Math.max(1, Math.round(a / A4));
      for (let i = 0; i < n; i++) {
        const u = n === 1 ? 0.5 : i / (n - 1);
        const x = s.x0 + (s.x1 - s.x0) * u;
        const z = s.z + 0.35 * Math.sin(i * 2.3 + s.k);
        const y = -(C.halfBreadth(x, z) + 0.02);
        out.push({ x, y, z, area: a / n, kind: 'breach', label: 'iceberg' });
      }
    }
    return out;
  }

  function zoneHole(k, area, z, side) {
    const Z = C.zoneBounds();
    const x = 0.5 * (Z[k] + Z[k + 1]);
    const hb = C.halfBreadth(x, z);
    return { x, y: side === 'port' ? hb + 0.02 : -(hb + 0.02), z, area, kind: 'breach' };
  }

  const PRESETS = {
    titanic: {
      title: 'Titanic, 14 April 1912',
      blurb: 'Iceberg damage along the starboard bow: six compartments holed, about 8 sq ft in all (Wilding estimated 12). Watertight doors closed from the bridge.',
      clock: { h: 23, m: 40 },
      build: (p) => ({ openings: icebergDamage((p && p.areaTitanic) || CALIBRATED_AREA), coalListDeg: 2.0 }),
    },
    four: {
      title: 'Four forward compartments',
      blurb: 'Forepeak and holds 1-3 open to the sea. Wilding testified she would have floated like this.',
      build: () => ({ openings: [0, 1, 2, 3].map(k => zoneHole(k, 0.6, 3.0, 'starboard')), coalListDeg: 0 }),
    },
    five: {
      title: 'Five forward compartments',
      blurb: 'Add boiler room 6. Water reaches E deck at bulkhead E and the compartments fill one after another.',
      build: () => ({ openings: [0, 1, 2, 3, 4].map(k => zoneHole(k, 0.25, 3.0, 'starboard')), coalListDeg: 0 }),
    },
    hawke: {
      title: 'Olympic and HMS Hawke, 1911',
      blurb: 'Rammed near the stern on the starboard side. Two after compartments flooded; she returned to Southampton.',
      build: () => ({ openings: [zoneHole(14, 2.0, 7.5, 'starboard'), zoneHole(15, 1.2, 8.0, 'starboard')], coalListDeg: 0 }),
    },
    britannic: {
      title: 'Britannic, 21 November 1916 (approx.)',
      blurb: 'Mine on the starboard bow, six forward compartments flooded through failed doors, bulkheads raised to B deck, about 25 portholes open.',
      build: () => {
        const openings = [zoneHole(2, 1.6, 4.0, 'starboard'), zoneHole(3, 1.6, 4.0, 'starboard'), zoneHole(1, 0.4, 4.0, 'starboard')];
        // portholes: ~25 open, mostly starboard, on F and E decks forward and amidships (assumed spread)
        const pt = 0.10;
        const spots = [[2, 'F'], [3, 'F'], [4, 'F'], [5, 'F'], [6, 'E'], [7, 'E'], [8, 'E'], [9, 'E']];
        for (const [k, deck] of spots) {
          const Z = C.zoneBounds(); const x0 = Z[k + 1], x1 = Z[k];
          const n = deck === 'F' ? 2 : 4;
          for (let i = 0; i < n; i++) {
            const x = x0 + (x1 - x0) * (i + 0.5) / n; const z = C.deckZ(deck, x) + 1.1;
            const side = (deck === 'E' || i % 2 === 0) ? -1 : 1;
            openings.push({ x, y: side * (C.halfBreadth(x, z) + 0.02), z, area: pt, kind: 'porthole' });
          }
        }
        return {
          openings, coalListDeg: 0,
          doorsOpen: ['D', 'E'],
          bulkTop: { D: 'B', E: 'B', F: 'B', G: 'B', H: 'B', K: 'B' },
        };
      },
    },
    blank: {
      title: 'Undamaged hull',
      blurb: 'No damage. Switch to the hole tool and tap the hull below the waterline.',
      build: () => ({ openings: [], coalListDeg: 2.0 }),
    },
  };

  // Halpern (2023) eyewitness-derived trim and list, minutes after 23:40
  const OBS = {
    trim: [[0, -0.2], [15, 0.8], [30, 1.8], [45, 2.6], [75, 3.2], [100, 4.0], [130, 5.5], [155, 10.0]],
    list: [[10, 5], [85, 2], [100, 0], [130, -10], [145, -15]],          // + starboard
    founder: 160, breakup: 157,
    wilding40: 16000 * C.LT / 1000,                                      // tonnes in 40 min
    events: [
      { id: 'overF', label: 'Water seen pouring down from E deck at the Turkish baths (bulkhead F)', t: 75 },
      { id: 'ports', label: 'Second row of ports under the forecastle submerged', t: 100 },
      { id: 'well', label: 'Forward well deck awash', t: 130 },
      { id: 'fcastle', label: 'Forecastle head going under', t: 145 },
      { id: 'bridge', label: 'Bridge goes under; crow\'s nest at the waterline', t: 155 },
    ],
  };

  return { PRESETS, OBS, icebergDamage, zoneHole, TITANIC_SPLIT, A4, CALIBRATED_AREA };
});
