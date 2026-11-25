/*
 * G26: her named places as one table, and the walk between two along her decks and stairs
 * (docs/DESIGN_G26_her_named_places_and_walks_v1_2026-11-24.md). A library, as cabins.js is: it keeps no state,
 * registers no reader and writes nothing into a sim, so no fingerprint moves. Its two tables are baked here, since core
 * reads no data file at run time. tools/places_table.js --write derives them (the places from their sources by the
 * model's own functions, the walks over roomnet's rooms), and tools/places_tests.js holds them.
 *
 *   PLACES            [{ key, name, deck, x, y, z, zone, side, row, room, src, tag }], in the ship frame (m): z is the
 *                     floor a man stands on; row is the R3 row it stands in (null on an open deck); room is the roomnet
 *                     room the walk starts from; src and tag are its source ([read], [scaled], [derived] or [bet])
 *   place(key)        the place, or null
 *   walk(a, b)        { m, climb }: metres along her decks and stairs between two places, and the height climbed or
 *                     descended on the way (a stair counts its rise x 1.6 in m) [bet]; null for an unknown place
 *   nearest(x, y, z)  every place by straight distance from a point, the nearest first: [{ key, d }]
 *
 * Nothing here times a walk or says who hears whom: a reader turns metres into minutes at its own pace, and sets its own
 * earshot. The numbers that disagree elsewhere (the bridge's front, the wireless room, the rocket socket) are printed
 * by tools/places_tests.js, not settled here.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TitanicPlaces = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  // the places (tools/places_table.js --write)
  const PLACES = /* PLACES BEGIN */ [
    {"key":"bridge","name":"the navigating bridge's front, on the centreline","deck":"Boat","x":72.5,"y":0,"z":29.34,"zone":3,"side":0,"row":null,"room":"rest@4:P:Boat","src":"the topsides note (docs/research/RESEARCH_topsides_dimensions_v1_2026-11-19.md): the front +72.5 on the centreline, curving back to +69.6 at the wing cabs; BWC's \"190 ft. from the bow\" gives +72.7","tag":"scaled"},
    {"key":"wing.port","name":"the bridge's port wing cab","deck":"Boat","x":68.6,"y":14.7,"z":29.21,"zone":4,"side":0,"row":null,"room":"rest@4:P:Boat","src":"the topsides note (docs/research/RESEARCH_topsides_dimensions_v1_2026-11-19.md): the wing cabs at +67.6 to +69.6, about 0.4 m beyond her side","tag":"scaled"},
    {"key":"wing.stbd","name":"the bridge's starboard wing cab","deck":"Boat","x":68.6,"y":-14.7,"z":29.21,"zone":4,"side":1,"row":null,"room":"rest@4:S:Boat","src":"the topsides note (docs/research/RESEARCH_topsides_dimensions_v1_2026-11-19.md): the wing cabs at +67.6 to +69.6, about 0.4 m beyond her side","tag":"scaled"},
    {"key":"wheelhouse","name":"the wheelhouse","deck":"Boat","x":65.75,"y":0,"z":29.12,"zone":4,"side":0,"row":"Bt-12","room":"Bt-12@4:P:Boat","src":"R3 Bt-12, its outline's centroid; the topsides note (docs/research/RESEARCH_topsides_dimensions_v1_2026-11-19.md) gives +64.8 to +67.8","tag":"read"},
    {"key":"chartroom","name":"the chart room","deck":"Boat","x":63,"y":0,"z":29.04,"zone":4,"side":0,"row":"Bt-10","room":"Bt-10@4:P:Boat","src":"the topsides note (docs/research/RESEARCH_topsides_dimensions_v1_2026-11-19.md): \"immediately abaft\" the wheelhouse; one room deep [bet]","tag":"bet"},
    {"key":"wireless","name":"the Marconi room, with the silent room","deck":"Boat","x":48,"y":0,"z":28.65,"zone":5,"side":0,"row":"Bt-10","room":"Bt-10@5:P:Boat","src":"R3 Bt-10 names the silent room and the Marconi room; the topsides note (docs/research/RESEARCH_topsides_dimensions_v1_2026-11-19.md) puts the Marconi rooms on the centreline abaft funnel 1's casing (+50.7 to +59.4). Its x is a bet: core/readers/world.js has 50 [bet], and Bride's \"at the after end of the officers' deckhouse\" would be +36 to +40","tag":"bet"},
    {"key":"nest","name":"the crow's nest, its floor","deck":null,"x":92.61,"y":0,"z":37,"zone":2,"side":0,"row":"C-076","room":"C-076@2:P:C","src":"site/topsides.js's nestOf: the lookouts' eye 29.0 m over her waterline at the night's drafts (BWC \"about 95 ft.\" [read]), the floor 1.5 m under it, on the foremast's axis; reached by the mast's ladder from the forecastle deck [bet]","tag":"derived"},
    {"key":"socket.stbd","name":"the rocket socket in the starboard rail, by emergency boat No. 1","deck":"Boat","x":65.9,"y":-14.1,"z":29.13,"zone":4,"side":1,"row":null,"room":"rest@4:S:Boat","src":"Boxhall: in the starboard rail by emergency boat No. 1 (core/readers/world.js) [read]; No. 1's davits at +65.72 and +66.18 (Read's davit article, via the topsides note (docs/research/RESEARCH_topsides_dimensions_v1_2026-11-19.md)) [read]; the socket between them [bet]","tag":"bet"},
    {"key":"socket.port","name":"a rocket socket in the port rail, by emergency boat No. 2","deck":"Boat","x":55.9,"y":14.1,"z":28.84,"zone":4,"side":0,"row":null,"room":"rest@4:P:Boat","src":"a socket a side [bet]; No. 2's davits at +55.70 and +56.16 (Read's davit article, via the topsides note (docs/research/RESEARCH_topsides_dimensions_v1_2026-11-19.md))","tag":"bet"},
    {"key":"lamp","name":"the Morse lamp","deck":"Boat","x":68.6,"y":-14.7,"z":29.21,"zone":4,"side":1,"row":null,"room":"rest@4:S:Boat","src":"NOT FOUND: taken at the bridge's starboard wing cab [bet]","tag":"bet"},
    {"key":"platform","name":"the reciprocating engines' starting platform","deck":"orlop","x":-29,"y":0,"z":1.6,"zone":10,"side":0,"row":"O-024","room":"O-024@10:P:below G","src":"R3 O-024 names \"its platforms\"; at the engine room's forward end on the centreline, on its floor [bet]","tag":"bet"},
    {"key":"stokehold.6","name":"boiler room 6, its stokehold","deck":"orlop","x":63.59,"y":0,"z":1.6,"zone":4,"side":0,"row":"O-013","room":"O-013@4:P:below G","src":"R3 O-013, its outline's centroid, on its floor","tag":"read"},
    {"key":"stokehold.5","name":"boiler room 5, its stokehold","deck":"orlop","x":45.57,"y":0,"z":1.6,"zone":5,"side":0,"row":"O-015","room":"O-015@5:P:below G","src":"R3 O-015, its outline's centroid, on its floor","tag":"read"},
    {"key":"stokehold.4","name":"boiler room 4, its stokehold","deck":"orlop","x":27.97,"y":0,"z":1.6,"zone":6,"side":0,"row":"O-017","room":"O-017@6:P:below G","src":"R3 O-017, its outline's centroid, on its floor","tag":"read"},
    {"key":"stokehold.3","name":"boiler room 3, its stokehold","deck":"orlop","x":10.75,"y":0,"z":1.6,"zone":7,"side":0,"row":"O-019","room":"O-019@7:P:below G","src":"R3 O-019, its outline's centroid, on its floor","tag":"read"},
    {"key":"stokehold.2","name":"boiler room 2, its stokehold","deck":"orlop","x":-7.8,"y":0,"z":1.6,"zone":8,"side":0,"row":"O-021","room":"O-021@8:P:below G","src":"R3 O-021, its outline's centroid, on its floor","tag":"read"},
    {"key":"stokehold.1","name":"boiler room 1, its stokehold","deck":"orlop","x":-23.28,"y":0,"z":1.6,"zone":9,"side":0,"row":"O-023","room":"O-023@9:P:below G","src":"R3 O-023, its outline's centroid, on its floor","tag":"read"},
    {"key":"postoffice","name":"the post office (the sorting room), where the mail clerks worked","deck":"G","x":75.31,"y":-8.46,"z":10.08,"zone":3,"side":1,"row":"G-018","room":"G-018@3:S:G","src":"R3 G-018, its outline's centroid","tag":"read"},
    {"key":"mailroom","name":"the mail room (the sorting room's store), under the post office","deck":"orlop","x":78.4,"y":-6.62,"z":7.75,"zone":3,"side":1,"row":"O-010","room":"O-010@3:S:below G","src":"R3 O-010, its outline's centroid","tag":"read"},
  ] /* PLACES END */;
  // the walks: WALK[a][b] = [metres, climb] for a place a before b in PLACES' order (tools/places_table.js --write)
  const WALK = /* WALK BEGIN */ {
    "bridge": {"wing.port":[21.1,0.37],"wing.stbd":[30.3,0.54],"wheelhouse":[12.9,0.29],"chartroom":[18.9,0.5],"wireless":[32.2,0.79],"nest":[169.3,26.32],"socket.stbd":[28.3,0.46],"socket.port":[23.1,0.5],"lamp":[30.3,0.54],"platform":[279.4,28.56],"stokehold.6":[186.9,29.69],"stokehold.5":[205.9,29.69],"stokehold.4":[219.9,29.69],"stokehold.3":[235.5,29.69],"stokehold.2":[259.1,29.69],"stokehold.1":[270,29.69],"postoffice":[142.5,20.71],"mailroom":[144.2,23.04]},
    "wing.port": {"wing.stbd":[33.3,0.41],"wheelhouse":[15.9,0.16],"chartroom":[21.9,0.37],"wireless":[35.2,0.66],"nest":[172.3,26.19],"socket.stbd":[31.3,0.33],"socket.port":[26.1,0.37],"lamp":[33.3,0.41],"platform":[282.3,28.43],"stokehold.6":[189.9,29.56],"stokehold.5":[208.9,29.56],"stokehold.4":[222.9,29.56],"stokehold.3":[238.5,29.56],"stokehold.2":[262.1,29.56],"stokehold.1":[273,29.56],"postoffice":[145.4,20.58],"mailroom":[147.2,22.91]},
    "wing.stbd": {"wheelhouse":[21.4,0.32],"chartroom":[23.6,0.37],"wireless":[34.2,0.66],"nest":[168,26.19],"socket.stbd":[22.1,0.33],"socket.port":[35.3,0.53],"lamp":[24.1,0.41],"platform":[278,28.43],"stokehold.6":[185.6,29.56],"stokehold.5":[204.6,29.56],"stokehold.4":[218.6,29.56],"stokehold.3":[234.2,29.56],"stokehold.2":[257.8,29.56],"stokehold.1":[268.7,29.56],"postoffice":[141.1,20.58],"mailroom":[142.9,22.91]},
    "wheelhouse": {"chartroom":[11.9,0.29],"wireless":[25.2,0.57],"nest":[162.3,26.11],"socket.stbd":[19.4,0.24],"socket.port":[17.9,0.29],"lamp":[21.4,0.32],"platform":[272.4,28.35],"stokehold.6":[179.9,29.47],"stokehold.5":[198.9,29.47],"stokehold.4":[212.9,29.47],"stokehold.3":[228.5,29.47],"stokehold.2":[252.1,29.47],"stokehold.1":[263,29.47],"postoffice":[135.4,20.49],"mailroom":[137.2,22.82]},
    "chartroom": {"wireless":[21.4,0.49],"nest":[158.5,26.02],"socket.stbd":[21.6,0.29],"socket.port":[24,0.5],"lamp":[23.6,0.37],"platform":[268.5,28.26],"stokehold.6":[176.1,29.39],"stokehold.5":[195.1,29.39],"stokehold.4":[209.1,29.39],"stokehold.3":[224.7,29.39],"stokehold.2":[248.3,29.39],"stokehold.1":[259.2,29.39],"postoffice":[131.6,20.41],"mailroom":[133.4,22.74]},
    "wireless": {"nest":[143.3,25.63],"socket.stbd":[32.2,0.58],"socket.port":[37.2,0.78],"lamp":[34.2,0.66],"platform":[253.3,27.87],"stokehold.6":[160.9,29],"stokehold.5":[179.9,29],"stokehold.4":[193.9,29],"stokehold.3":[209.5,29],"stokehold.2":[233.1,29],"stokehold.1":[243.9,29],"postoffice":[116.4,20.02],"mailroom":[118.2,22.35]},
    "nest": {"socket.stbd":[166,26.11],"socket.port":[174.3,26.32],"lamp":[168,26.19],"platform":[203.1,35.4],"stokehold.6":[102,35.4],"stokehold.5":[121,35.4],"stokehold.4":[135,35.4],"stokehold.3":[150.6,35.4],"stokehold.2":[174.2,35.4],"stokehold.1":[185.1,35.4],"postoffice":[72.3,26.97],"mailroom":[74,29.3]},
    "socket.stbd": {"socket.port":[33.3,0.45],"lamp":[22.1,0.33],"platform":[276,28.35],"stokehold.6":[183.6,29.48],"stokehold.5":[202.6,29.48],"stokehold.4":[216.6,29.48],"stokehold.3":[232.2,29.48],"stokehold.2":[255.8,29.48],"stokehold.1":[266.7,29.48],"postoffice":[139.1,20.5],"mailroom":[140.9,22.83]},
    "socket.port": {"lamp":[35.3,0.53],"platform":[284.4,28.56],"stokehold.6":[191.9,29.68],"stokehold.5":[210.9,29.68],"stokehold.4":[224.9,29.68],"stokehold.3":[240.5,29.68],"stokehold.2":[264.1,29.68],"stokehold.1":[275,29.68],"postoffice":[147.5,20.7],"mailroom":[149.2,23.03]},
    "lamp": {"platform":[278,28.43],"stokehold.6":[185.6,29.56],"stokehold.5":[204.6,29.56],"stokehold.4":[218.6,29.56],"stokehold.3":[234.2,29.56],"stokehold.2":[257.8,29.56],"stokehold.1":[268.7,29.56],"postoffice":[141.1,20.58],"mailroom":[142.9,22.91]},
    "platform": {"stokehold.6":[126,0],"stokehold.5":[109.3,0],"stokehold.4":[102.3,0],"stokehold.3":[69.9,0],"stokehold.2":[48.4,0],"stokehold.1":[36.5,0],"postoffice":[159,8.62],"mailroom":[148,6.15]},
    "stokehold.6": {"stokehold.5":[43.9,0],"stokehold.4":[57.9,0],"stokehold.3":[73.5,0],"stokehold.2":[97.1,0],"stokehold.1":[108,0],"postoffice":[61.4,8.62],"mailroom":[50.4,6.15]},
    "stokehold.5": {"stokehold.4":[41.2,0],"stokehold.3":[56.8,0],"stokehold.2":[80.4,0],"stokehold.1":[91.2,0],"postoffice":[80.4,8.62],"mailroom":[69.4,6.15]},
    "stokehold.4": {"stokehold.3":[49.8,0],"stokehold.2":[73.4,0],"stokehold.1":[84.2,0],"postoffice":[94.5,8.62],"mailroom":[83.4,6.15]},
    "stokehold.3": {"stokehold.2":[41,0],"stokehold.1":[51.9,0],"postoffice":[110.1,8.62],"mailroom":[99.1,6.15]},
    "stokehold.2": {"stokehold.1":[30.3,0],"postoffice":[133.6,8.62],"mailroom":[122.6,6.15]},
    "stokehold.1": {"postoffice":[144.5,8.62],"mailroom":[133.5,6.15]},
    "postoffice": {"mailroom":[11.1,2.47]},
    "mailroom": {},
  } /* WALK END */;

  const byKey = new Map(PLACES.map((p) => [p.key, p]));
  function place(key) { return byKey.get(key) || null; }
  function walk(a, b) {
    if (!byKey.has(a) || !byKey.has(b)) return null;
    if (a === b) return { m: 0, climb: 0 };
    const w = (WALK[a] && WALK[a][b]) || (WALK[b] && WALK[b][a]) || null;
    return w ? { m: w[0], climb: w[1] } : null;
  }
  function nearest(x, y, z) {
    return PLACES.map((p) => ({ key: p.key, d: Math.sqrt((p.x - x) * (p.x - x) + (p.y - y) * (p.y - y) + (p.z - z) * (p.z - z)) }))
      .sort((a, b) => a.d - b.d || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  }
  return { PLACES, WALK, place, walk, nearest };
});
