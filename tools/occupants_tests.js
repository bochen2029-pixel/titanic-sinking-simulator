// NH2: the people in her staterooms (data/rooms/occupants_1912.json: the Cave list of 1912, first class), against R3's
// rows (core/readers/cabins.js's index) and the page's own asset (tools/rooms_asset.js, as tools/build_site.js writes it).
//   node tools/occupants_tests.js     (seconds; writes out/occupants_1912.txt through tools/outdir.js)
// MUST rows:
// - the list: every line in the list's order, with its stateroom as the list writes it (or none) and its names, and the
//   list with its source; each line's staterooms and rows derived (node tools/occupants_table.js --write);
// - every line placed on the rows its staterooms stand in, or kept apart with why; every name of a placed line found by
//   name (named) in its own rows and no others;
// - the people change nothing else in the index (its rows, stateroom numbers, conflicts and unresolved numbers);
// - the page's asset carries the list, and its index has the files' people, line by line, and the same rows.
// CHECK rows: the lines kept apart (each a finding: a stateroom her plans in R3's tables do not number, or a line with
// none), and the list's own gaps as its source states them. The table: every line, its staterooms, rows and names.
'use strict';
const fs = require('fs');
const path = require('path');
const K = require('../core/readers/cabins.js');
const OT = require('./occupants_table');
const { roomsAsset } = require('./rooms_asset');
const outFile = require('./outdir');

const root = path.join(__dirname, '..');
const DIR = path.join(root, 'data', 'rooms');
const lines = [], say = (s) => { lines.push(s === undefined ? '' : s); console.log(s === undefined ? '' : s); };
const musts = [], checks = []; let fails = 0;
function must(what, value, ref, ok) { musts.push([what, value, ref, ok]); if (!ok) fails++; }
function check(what, value, ref, ok) { checks.push([what, value, ref, ok]); }

const tables = fs.readdirSync(DIR).filter((x) => x.endsWith('.json')).sort().map((x) => JSON.parse(fs.readFileSync(path.join(DIR, x), 'utf8')));
const I = K.index(tables);
const occ = tables.find((T) => T && T.table === 'occupants') || null;
const sig0 = (J) => JSON.stringify([J.decks, J.rows.map((e) => [e.id, e.labels]), [...J.byLabel].map(([l, e]) => [l, e.id]), J.conflicts, J.unresolved]);
const peopleSig = (J) => JSON.stringify([J.rows.map((e) => [e.id, e.people.map((p) => [p.n, p.labels, p.names, p.cabin])]), J.people.lines, J.people.names, J.people.placed, J.people.unplaced]);

// 1. the list, and its derived fields
{
  const bad = [];
  if (!occ) bad.push('no list of people in data/rooms');
  else {
    const I0 = OT.deckIndex();
    let n0 = 0;
    for (const r of occ.rows) {
      if (r.n !== ++n0) bad.push('line ' + r.n + ' out of order');
      if (!(r.cabin === null || (typeof r.cabin === 'string' && r.cabin.trim()))) bad.push('line ' + r.n + ' its stateroom');
      if (!Array.isArray(r.names) || !r.names.length || r.names.some((s) => typeof s !== 'string' || !s.trim())) bad.push('line ' + r.n + ' its names');
      if (r.labels_note !== undefined && !(typeof r.labels_note === 'string' && r.labels_note.length > 20)) bad.push('line ' + r.n + ' a hand reading without its reason');
      const d = OT.derive(r, I0);
      if (JSON.stringify(d.labels) !== JSON.stringify(r.labels) || JSON.stringify(d.rooms) !== JSON.stringify(r.rooms)) bad.push('line ' + r.n + ' its derived fields');
    }
    if (!(occ.source && occ.source.title && occ.source.what && (occ.source.urls || []).length)) bad.push('its source');
  }
  must('the list (the Cave list, first class): every line in the list\'s order with its stateroom as the list writes it (or none) and its names, the list with its source; each line\'s staterooms and rows derived (node tools/occupants_table.js --write)',
    occ ? occ.rows.length + ' lines; ' + (bad.length ? bad.slice(0, 5).join('; ') : 'none wrong') : 'no list', 'none wrong', !!occ && !bad.length);
}
// 2. every line placed or kept apart; every name found in its own rows
{
  const P = I.people, lost = [];
  for (const r of occ ? occ.rows : []) {
    const placed = r.labels.length > 0 && r.rooms.every(Boolean), apart = P.unplaced.some((u) => u.n === r.n);
    if (placed === apart) lost.push('line ' + r.n + (placed ? ' placed and kept apart' : ' neither placed nor kept apart'));
    if (!placed) continue;
    const want = r.rooms.filter((x, i) => r.rooms.indexOf(x) === i).sort();
    for (const nm of r.names) {
      const hit = K.named(I, nm).filter((h) => h.n === r.n).map((h) => h.row.id).sort();
      if (JSON.stringify(hit) !== JSON.stringify(want)) lost.push('line ' + r.n + ' "' + nm + '" found in ' + (hit.join(',') || 'none'));
    }
  }
  must('every line placed on the rows its staterooms stand in, or kept apart with why (I.people.unplaced); every name of a placed line found by name (named) in its own rows and no others',
    P.lines + ' lines, ' + P.names + ' names: ' + P.placed + ' placed, ' + P.unplaced.length + ' kept apart; ' + (lost.length ? lost.slice(0, 4).join('; ') : 'none lost'), 'none lost', !!occ && P.lines === occ.rows.length && !lost.length);
}
// 3. the people change nothing else
{
  const bare = K.index(tables.filter((T) => !(T && T.table === 'occupants')));
  const same = sig0(bare) === sig0(I);
  must('the people change nothing else: the index with the list has the rows, stateroom numbers, conflicts and unresolved numbers of the index without it',
    same ? 'the same' : 'DIFFERENT', 'the same', same);
}
// 4. the page's asset
{
  const A = JSON.parse(roomsAsset(root)), IA = K.index(A);
  const carried = A.some((T) => T && T.table === 'occupants'), same = carried && peopleSig(IA) === peopleSig(I) && sig0(IA) === sig0(I);
  must('the page\'s asset (tools/rooms_asset.js, as tools/build_site.js writes it) carries the list, and its index has the files\' people, line by line, and the same rows',
    (carried ? 'carried' : 'NOT CARRIED') + '; ' + (same ? 'the same' : 'DIFFERENT'), 'the same', same);
}

// the CHECK rows, and the table
const P = I.people;
{
  const withRoom = occ ? occ.rows.filter((r) => r.cabin !== null).length : 0, apart = P.unplaced.filter((u) => u.cabin !== null);
  check('the lines with a stateroom kept apart, each with why (a stateroom her plans in R3\'s tables do not number, or no deck\'s letter and number to read): findings for R3\'s tables (the lines that give no stateroom are the list\'s own, ' + (P.unplaced.length - apart.length) + ' of them)',
    apart.length + ' of ' + withRoom + ': ' + apart.map((u) => u.cabin).join(', '), 'under a tenth', apart.length < 0.1 * withRoom);
}
const byDeck = {};
for (const r of occ ? occ.rows : []) if (r.labels.length && r.rooms.every(Boolean)) for (const l of r.labels) byDeck[l[0]] = (byDeck[l[0]] || 0) + 1;
if (occ) {
  const S = occ.source || {};
  say('NH2: HER FIRST-CLASS PEOPLE BY STATEROOM: ' + occ.title + ' (data/rooms/occupants_1912.json)');
  say('Source: ' + S.title + '. ' + (S.what || ''));
  say('Transcribed from: ' + (S.transcribed_from || '-') + '; accessed ' + (S.accessed || '-') + '; ' + (S.urls || []).join(' '));
  say('Its gaps: ' + (S.gaps || '-'));
  say(P.lines + ' lines, ' + P.names + ' names: ' + P.placed + ' placed, ' + P.unplaced.length + ' kept apart; staterooms placed by deck ' + Object.keys(byDeck).sort().map((k) => k + ' ' + byDeck[k]).join(', '));
  say('');
  say('  line  stateroom (as the list)     her plans          R3 rows                names (as the list)');
  for (const r of occ.rows) say('  ' + String(r.n).padStart(4) + '  ' + String(r.cabin === null ? '-' : r.cabin).padEnd(26) + (r.labels.join(', ') || '-').padEnd(19) + (r.rooms.map((x) => x || '?').join(', ') || '-').padEnd(23) + r.names.join('; ') + (r.note ? '  [' + r.note + ']' : ''));
  say('');
  say('KEPT APART (not placed in her rooms, with why)');
  for (const u of P.unplaced) say('  ' + String(u.n).padStart(4) + '  ' + String(u.cabin === null ? '-' : u.cabin).padEnd(26) + u.why + ': ' + u.names.join('; '));
}
say('');
say('THE CHECK ROWS');
for (const [what, value, ref, ok] of checks) say((ok ? 'in   ' : 'out  ') + 'CHECK ' + what + ' | ' + value + ' | ' + ref);
fs.writeFileSync(outFile('occupants_1912.txt'), lines.join('\n') + '\n');
console.log('');
for (const [what, value, ref, ok] of musts) console.log((ok ? 'PASS' : 'FAIL') + ' MUST  ' + what + ' | ' + value + ' | ' + ref);
console.log(fails ? 'FAIL: ' + fails + ' of ' + musts.length + ' MUST rows' : 'PASS: every MUST row (' + musts.length + ')');
process.exit(fails ? 1 : 0);
