// Her first-class people by stateroom (data/rooms/occupants_1912.json, NH2): the Cave list of 1912, a line a row, and the
// fields derived from each line by the model's own index of her rooms (core/readers/cabins.js), as tools/rooms_table.js
// does for R3's tables.
//   node tools/occupants_table.js                print each line's staterooms and rows, and what differs from the file
//   node tools/occupants_table.js --write        write them into data/rooms/occupants_1912.json
//   node tools/occupants_table.js --from FILE    make the table from a transcription (FILE: { source, entries }) first
// A row's source fields, as the list gives them: n (its line, in the list's order), cabin (its stateroom or staterooms as
// the list writes them, null where it gives none), names (as the list writes them), where (its place in the list), note
// (struck out, unclear, or the sources differ). Its derived fields:
//   labels   the staterooms as her plans number them ('C 85'), read from cabin by parseCabin: a deck's letter and its
//            numbers, each number after a comma, dash, ampersand or 'and' another room of the same deck (never a range);
//            a number after a slash is the room's berth, not a room (the list prints 'C101/1', 'C101/2', 'C101/3'); a
//            letter in square brackets is the transcriber's, where a tear took it. A row's labels_note keeps a reading
//            made by hand instead
//   rooms    the rows of R3's tables those staterooms stand in (cabins.js's index), in the labels' order
'use strict';
const fs = require('fs');
const path = require('path');
const K = require('../core/readers/cabins.js');

const root = path.join(__dirname, '..');
const DIR = path.join(root, 'data', 'rooms');
const FILE = path.join(DIR, 'occupants_1912.json');

// the staterooms a line of the list names, as her plans number them
function parseCabin(s) {
  if (s == null) return [];
  // a deck's letter in square brackets is the transcriber's, supplied where the list leaves it out: read as the list's
  // and a number after a slash is a berth of the room before it: dropped
  const t = String(s).toUpperCase().replace(/[\u2010-\u2015]/g, '-').replace(/[*[\]]/g, '').replace(/\/\s*\d+/g, '');
  const out = [];
  const re = /\b([A-G])\s*-?\s*(\d+)((?:\s*(?:[-&,]|AND)\s*\d+(?![A-Z\d]))*)/g;
  let m;
  while ((m = re.exec(t))) {
    out.push(m[1] + ' ' + +m[2]);
    for (const k of m[3].match(/\d+/g) || []) out.push(m[1] + ' ' + +k);
  }
  return out.filter((l, i) => out.indexOf(l) === i);
}

// the index of R3's deck tables alone (no list of people), for the rows each stateroom stands in
function deckIndex() {
  const T = fs.readdirSync(DIR).filter((f) => /_deck\.json$/.test(f)).sort().map((f) => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')));
  return K.index(T);
}

function derive(r, I) {
  const labels = r.labels_note ? r.labels.slice() : parseCabin(r.cabin);
  const rooms = labels.map((l) => (I.byLabel.get(l) ? I.byLabel.get(l).id : null));
  return { labels, rooms };
}
const DERIVED = ['labels', 'rooms'];

// a new table from a transcription: the source and the lines, untouched but for the order of their fields
function fromRaw(raw) {
  return {
    table: 'occupants',
    title: 'Her first-class passengers by stateroom: the Cave list (1912)',
    format: 1,
    written: new Date().toISOString().slice(0, 10),
    source: raw.source,
    counts: raw.counts || null,
    rules: [
      'One row is one line of the list: its stateroom or staterooms (cabin) and its names, as the list writes them, in the list\'s order (n), with where in the list it stands. Nothing is normalised: a name stands as the list spells it.',
      'The list is first class\'s alone. Second and third class stay unnamed in her rooms: no list of their staterooms is used here.',
      'A line names the room it was allocated, which is not proof the passenger slept there that night: the source\'s gaps say what it leaves out.',
    ],
    how: [
      'labels and rooms are derived: node tools/occupants_table.js --write (labels by parseCabin from cabin, rooms by core/readers/cabins.js\'s index of R3\'s tables). A row with labels_note keeps labels read by hand, with its reason.',
      'core/readers/cabins.js puts each line\'s names on the rows its staterooms stand in (each row\'s people) and finds them by name (named). A line whose staterooms her plans do not number is kept apart (I.people.unplaced), with why.',
      'node tools/cabins_tests.js holds it: every line its fields, its labels and rooms derived, placed or kept apart with why, every name found in its own room, the index otherwise unchanged.',
    ],
    rows: raw.entries.map((e) => {
      const r = { n: e.n, cabin: e.cabin == null ? null : e.cabin, names: e.names, where: e.where == null ? null : e.where };
      if (e.note) r.note = e.note;
      return r;
    }),
  };
}

if (require.main === module) {
  const at = process.argv.indexOf('--from');
  let V;
  if (at > 0) V = fromRaw(JSON.parse(fs.readFileSync(process.argv[at + 1], 'utf8')));
  else V = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  const I = deckIndex();
  let differ = 0, placed = 0, apart = 0, names = 0;
  const byDeck = {};
  for (const r of V.rows) {
    const d = derive(r, I);
    for (const k of DERIVED) if (JSON.stringify(r[k]) !== JSON.stringify(d[k])) differ++;
    Object.assign(r, d);
    names += r.names.length;
    if (r.labels.length && r.rooms.every(Boolean)) { placed++; for (const l of r.labels) byDeck[l[0]] = (byDeck[l[0]] || 0) + 1; }
    else { apart++; console.log('  apart: line ' + r.n + ' "' + r.cabin + '" ' + (r.labels.length ? 'not in the plans: ' + r.labels.filter((l, i) => !r.rooms[i]).join(', ') : 'no stateroom')); }
  }
  console.log(V.rows.length + ' lines, ' + names + ' names; placed ' + placed + ', apart ' + apart + '; staterooms by deck ' + JSON.stringify(byDeck));
  if (process.argv.includes('--write') || at > 0) {
    fs.writeFileSync(FILE, JSON.stringify(V, null, 1) + '\n');
    console.log('written: ' + FILE + ' (' + differ + ' derived fields changed)');
  } else console.log('derived fields that differ from the file: ' + differ + (differ ? ' (run with --write)' : ''));
}
module.exports = { parseCabin, derive, DERIVED, deckIndex, fromRaw, FILE };
