// The fixed form of the U0 exports (tools/export_ship.js, tools/record_night.js; docs/BRAINSTORM_titanic_in_unreal_v1_2026-11-20.md,
// section 7): JSON whose keys stand in the order the code gives them and whose numbers are written at a fixed number of
// decimals, so that two runs give the same bytes; the sources named by their git blob ids; and the comments the sources
// give their tables, so that each number carries its tag ([read], [scaled], [bet], [appearance] ...) as its source marks it.
//
//   const J = require('./export_json');
//   J.text(obj)            the file's text. A plain number is written at 6 decimals at most; J.F(x, d) at d; J.S(array, d) a
//                          series at d. Trailing zeros are dropped, -0 is 0, and a number that is not finite (NaN, Infinity)
//                          is null: JSON has none. A key that looks like an array index throws (JavaScript would reorder it).
//   J.blob(rel)            the git blob id of a file of the repository (what `git hash-object` gives under its eol=lf)
//   J.sources(list)        { path: blob id } for the files, in the order given
//   J.notes(rel, name)     the comments of the table `name` in a source file, entry by entry: { file, name, line, comment, tags,
//                          keys: { field: { line, comment, tags, keys | rows } } } for an object, rows: [{ i, line, ... }]
//                          for an array (only the entries that have a comment)
//   J.head()               git's HEAD and whether the files named are committed as they stand (printed, never written)
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..');

// ------------------------------------------------------------------ numbers
class Fixed { constructor(x, d) { this.x = x; this.d = d; } }
class Series { constructor(a, d) { this.a = a; this.d = d; } }
const F = (x, d) => new Fixed(x, d);
const S = (a, d) => new Series(a, d);
const DEFAULT_DECIMALS = 6;

function num(x, d) {
  if (typeof x !== 'number') throw new Error('not a number: ' + x);
  if (!Number.isFinite(x)) return 'null';
  let s = x.toFixed(d);                       // the language's own exact rule: the same digits on every run and engine
  if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
  return s === '-0' ? '0' : s;
}

// ------------------------------------------------------------------ the writer
const INDEX_LIKE = /^(0|[1-9][0-9]*)$/;
const isScalar = (v) => v === null || typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean' || v instanceof Fixed;
const isSeries = (v) => v instanceof Series || ArrayBuffer.isView(v) || (Array.isArray(v) && v.every(isScalar));
// an object that may stand on one line: each value a scalar or a series of at most 8; it does when that line is short
const LINE = 200;
function isFlat(v) {
  if (!v || typeof v !== 'object' || Array.isArray(v) || ArrayBuffer.isView(v) || v instanceof Fixed || v instanceof Series) return false;
  const ks = Object.keys(v).filter(k => v[k] !== undefined);
  return ks.every(k => isScalar(v[k]) || (Array.isArray(v[k]) && v[k].length <= 8 && v[k].every(isScalar)));
}
function scalar(v) {
  if (v === null) return 'null';
  if (v instanceof Fixed) return num(v.x, v.d);
  if (typeof v === 'number') return num(v, DEFAULT_DECIMALS);
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'string') return JSON.stringify(v);
  throw new Error('not a scalar');
}
function series(v) {
  if (v instanceof Series) { const a = v.a, out = new Array(a.length); for (let i = 0; i < a.length; i++) out[i] = a[i] === null ? 'null' : num(a[i], v.d); return '[' + out.join(',') + ']'; }
  const a = ArrayBuffer.isView(v) ? Array.from(v) : v;
  return '[' + a.map(scalar).join(',') + ']';
}
function keysOf(v) {
  const ks = Object.keys(v).filter(k => v[k] !== undefined);
  for (const k of ks) if (INDEX_LIKE.test(k)) throw new Error('a key that looks like an index would be reordered: "' + k + '"');
  return ks;
}
function write(v, ind) {
  if (isScalar(v)) return scalar(v);
  if (isSeries(v)) return series(v);
  const pad = ' '.repeat(ind + 1), end = ' '.repeat(ind);
  if (Array.isArray(v)) {
    if (!v.length) return '[]';
    return '[\n' + v.map(e => pad + write(e, ind + 1)).join(',\n') + '\n' + end + ']';
  }
  if (typeof v === 'object') {
    const ks = keysOf(v);
    if (!ks.length) return '{}';
    if (isFlat(v)) {
      const one = '{' + ks.map(k => JSON.stringify(k) + ': ' + (isScalar(v[k]) ? scalar(v[k]) : series(v[k]))).join(', ') + '}';
      if (one.length <= LINE) return one;
    }
    return '{\n' + ks.map(k => pad + JSON.stringify(k) + ': ' + write(v[k], ind + 1)).join(',\n') + '\n' + end + '}';
  }
  throw new Error('cannot write a ' + typeof v);
}
const text = (obj) => write(obj, 0) + '\n';
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

// ------------------------------------------------------------------ the sources
// a file's git blob id: sha1 of "blob <bytes>\0<content>", the content with LF line ends as this repository stores it
// (.gitattributes: * text=auto eol=lf), so that it equals `git hash-object` and `git log --find-object` finds the commit
function blob(rel) {
  const buf = Buffer.from(fs.readFileSync(path.join(root, rel)).toString('latin1').replace(/\r\n/g, '\n'), 'latin1');
  return crypto.createHash('sha1').update('blob ' + buf.length + '\0').update(buf).digest('hex');
}
function sources(list) { const o = {}; for (const rel of list) o[rel] = blob(rel); return o; }
function head(list) {
  const git = (args) => execFileSync('git', args, { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  try {
    const commit = git(['rev-parse', '--short', 'HEAD']);
    const dirty = git(['status', '--porcelain', '--'].concat(list || [])).split('\n').filter(Boolean).map(l => l.slice(3));
    return { commit, committed: dirty.length === 0, dirty };
  } catch (e) { return { commit: null, committed: false, dirty: [] }; }
}

// ------------------------------------------------------------------ the sources' own words
// The comments a table's entries carry in its source file: for `const NAME = {` or `[` (or `NAME: {` inside another), the
// lines of comment just above each entry of its top level and the comments on the entry's own lines; one level down the
// same for each entry of an entry that runs over several lines (an array of rows, an object of fields). tags: the tag
// words found inside the comment's square brackets, as the sources write them.
const TAG = /\b(read|scaled|derived|measured|bet|appearance|textbook|mine|stated|fitted|calibrated)\b/gi;
function tagsOf(comment) {
  const out = [];
  for (const m of comment.match(/\[[^\]]*\]/g) || []) for (const w of m.match(TAG) || []) { const t = w.toLowerCase(); if (!out.includes(t)) out.push(t); }
  return out;
}
const CACHE = new Map();
function scanFile(rel) {
  if (CACHE.has(rel)) return CACHE.get(rel);
  const src = fs.readFileSync(path.join(root, rel), 'utf8').replace(/\r\n/g, '\n');
  // each character's line, and what it is: 1 code, 2 inside a string (quotes too), 0 a comment; so that brackets and commas
  // in comments and strings are passed over
  const lineAt = new Int32Array(src.length + 1), code = new Uint8Array(src.length);
  let line = 1;
  for (let i = 0; i < src.length;) {
    lineAt[i] = line;
    const c = src[i], d = src[i + 1];
    if (c === '/' && d === '/') { while (i < src.length && src[i] !== '\n') { lineAt[i] = line; i++; } continue; }
    if (c === '/' && d === '*') { i += 2; while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) { lineAt[i] = line; if (src[i] === '\n') line++; i++; } i += 2; continue; }
    if (c === '"' || c === '\'' || c === '`') {
      code[i] = 2; i++;
      while (i < src.length && src[i] !== c) { lineAt[i] = line; code[i] = 2; if (src[i] === '\\') { i++; code[i] = 2; lineAt[i] = line; } else if (src[i] === '\n') line++; i++; }
      if (i < src.length) { lineAt[i] = line; code[i] = 2; }
      i++; continue;
    }
    code[i] = 1;
    if (c === '\n') line++;
    i++;
  }
  const lines = src.split('\n');
  const S = { src, lineAt, code, lines };
  CACHE.set(rel, S);
  return S;
}
// the comment on a line (after its code), or ''
function trailing(S, ln) {
  const l = S.lines[ln - 1];
  let i = 0, inS = null;
  for (; i < l.length; i++) {
    const c = l[i];
    if (inS) { if (c === '\\') i++; else if (c === inS) inS = null; continue; }
    if (c === '"' || c === '\'' || c === '`') { inS = c; continue; }
    if (c === '/' && l[i + 1] === '/') return l.slice(i + 2).trim();
  }
  return '';
}
// the comment lines just above line ln (whole lines of comment, nearest last)
function above(S, ln) {
  const out = [];
  for (let j = ln - 1; j >= 1; j--) { const t = S.lines[j - 1].trim(); if (t.startsWith('//')) out.unshift(t.slice(2).trim()); else break; }
  return out.join(' ');
}
// the entries of the bracketed value that opens at index o: [{ key, start, end }]
function entries(S, o) {
  const { src, code } = S, open = src[o], close = open === '{' ? '}' : ']', out = [];
  let depth = 0, start = -1, idx = 0;
  for (let i = o; i < src.length; i++) {
    if (!code[i]) continue;
    const c = src[i];
    if (code[i] === 2) { if (depth === 1 && start < 0) start = i; continue; }
    if (c === '{' || c === '[' || c === '(') { if (depth === 1 && start < 0) start = i; depth++; if (depth === 1) continue; }
    else if (c === '}' || c === ']' || c === ')') {
      depth--;
      if (depth === 0) { if (start >= 0) out.push(entryOf(S, start, i, open, idx++)); return { list: out, end: i }; }
    } else if (depth === 1 && c === ',') { if (start >= 0) out.push(entryOf(S, start, i, open, idx++)); start = -1; continue; }
    if (depth === 1 && start < 0 && !/\s/.test(c)) start = i;
  }
  throw new Error('unclosed ' + open + ' in ' + close);
}
function entryOf(S, start, end, open, idx) {
  let key = String(idx), vStart = start;
  if (open === '{') {
    const m = /^\s*(?:([A-Za-z_$][\w$]*)|'([^']*)'|"([^"]*)")\s*:/.exec(S.src.slice(start, Math.min(end, start + 200)));
    if (m) { key = m[1] || m[2] || m[3]; vStart = start + m[0].length; while (/\s/.test(S.src[vStart])) vStart++; }
  }
  return { key, start, end, vStart };
}
function noteOf(S, e, depth) {
  const l0 = S.lineAt[e.start], l1 = S.lineAt[Math.max(e.start, e.end - 1)];
  const c = S.src[e.vStart], nested = depth < 2 && (c === '{' || c === '[') && l1 > l0;
  // an entry whose rows have comments of their own keeps only the comments on its first and last lines
  const parts = [above(S, l0)];
  for (let ln = l0; ln <= l1; ln++) { if (nested && ln !== l0 && ln !== l1) continue; const t = trailing(S, ln); if (t && !parts.includes(t)) parts.push(t); }
  const comment = parts.filter(Boolean).join(' ');
  const n = { line: l0, comment, tags: tagsOf(comment) };
  if (nested) inner(S, e.vStart, depth + 1, n);
  return n;
}
// the notes of the entries of the bracketed value at o, into n.keys (an object's fields) or n.rows (an array's rows, each
// with its index i), those with a comment only
function inner(S, o, depth, n) {
  const list = entries(S, o).list;
  if (S.src[o] === '[') {
    const rows = [];
    list.forEach((e, i) => { const k = noteOf(S, e, depth); if (k.comment || k.keys || k.rows) rows.push(Object.assign({ i }, k)); });
    if (rows.length) n.rows = rows;
  } else {
    const keys = {};
    for (const e of list) { const k = noteOf(S, e, depth); if (k.comment || k.keys || k.rows) keys[e.key] = k; }
    if (Object.keys(keys).length) n.keys = keys;
  }
  return n;
}
function notes(rel, name) {
  const S = scanFile(rel), nm = name.replace(/\$/g, '\\$');
  let at = -1;
  // `const NAME = {` first; else `NAME: {` (a table that is a field of another)
  for (const re of [new RegExp('(?:const|let|var)\\s+' + nm + '\\s*=\\s*[\\[{]', 'g'), new RegExp('\\b' + nm + '\\s*:\\s*[\\[{]', 'g')]) {
    let m;
    while ((m = re.exec(S.src))) if (S.code[m.index] === 1) { at = m.index + m[0].length - 1; break; }
    if (at >= 0) break;
  }
  if (at < 0) throw new Error('no table ' + name + ' in ' + rel);
  const line = S.lineAt[at], comment = [above(S, line), trailing(S, line)].filter(Boolean).join(' ');
  return inner(S, at, 1, { file: rel, name, line, comment, tags: tagsOf(comment) });
}

module.exports = { F, S, Fixed, Series, num, text, sha256, blob, sources, head, notes, tagsOf, DEFAULT_DECIMALS };
