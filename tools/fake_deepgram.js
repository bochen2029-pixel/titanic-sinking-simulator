// A Deepgram on this PC, for the men's voices' tests (app/voice.js) and for building with no key and no network:
//   POST /v2/speak?model=flux-<voice>-en&encoding=linear16&container=wav&sample_rate=24000   Flux's text to speech, whole
//   GET  /v1/auth/token                                                                     a key tried
// Both need `Authorization: Token <key>` with the one key it was started with (default: the tests' made-up key); any
// other is answered 401, as Deepgram answers a key it does not know. The speech request's query must be exactly those
// four fields (the model one of Flux's English voices' form), its body JSON with a text: else 400. It listens on
// 127.0.0.1 only, on a port the system picks, and keeps every request in `seen` (method, path, query, headers, body,
// raw), for the tests to hold the app to: one host, the key in the header and nowhere else.
//   const s = await start({ key }); s.base and s.origin ('http://127.0.0.1:PORT'), s.seen, s.mode, s.sent, await s.close()
// s.mode: 'ok' | '400' | '401' | '402' | '403' | '404' | '413' | '422' | '429' | '500' | 'echo' (a 400 whose message repeats
//   the key) | 'slow' (never answers until closed) | 'redirect' (to another port) | 'notaudio' (200, JSON) | 'badwav' (200,
//   audio/wav, not a WAV) | 'toolarge' (200, a stated length past the app's bound) | 'toolarge-chunked' (200, no length
//   stated, more bytes than the app's bound) | 'octet' (200, a true WAV called application/octet-stream) | 'notype' (200,
//   a true WAV with no content type) | 'echolong' (the key far into a long message) | 'echopart' (its first and last
//   characters only) | 'typekey', 'typekey2' (200, the key in the content type) | 'plain' (a 400 whose body is a string)
// s.sent: the last WAV it answered with (a Buffer). The WAV: 24 kHz, 16 bits, one channel, a tone of 440 Hz whose length
// grows with the text (50 ms and 20 ms a character, 5 s at most), so that a queue of lines takes time to play.
//
// And the ears (docs/DESIGN_spoken_bridge_voice_v1_2026-11-23.md, section 5):
//   GET /v1/listen?model=nova-3&...   (an Upgrade: websocket)   Nova-3's live speech to text, one socket a transmission
// The upgrade is done by hand on node:http's 'upgrade' event, as RFC 6455 has it: the accept key, the client's frames
// unmasked, text and binary frames and their fragments, ping and close. It takes only `Sec-WebSocket-Protocol: token,
// <the key it was started with>` (Deepgram's form for a client that cannot set a header) and answers with `token` chosen;
// anything else is answered 401 on the upgrade, as Deepgram answers a key it does not know. It keeps a record a socket in
// s.listens: { path, search, query (keyterm: every one), mipOptOut (whether the query opted the voice out of Deepgram's
// Model Improvement Program, mip_opt_out=true), headers (every handshake header), protocols, audio (every byte of audio,
// one Buffer), frames (binary messages), texts (every text message, parsed where it is JSON), closed ({ code, reason } of
// the client's close frame, or null), opened (101 sent) }. The words it "hears" are s.heard (default 'hard a starboard').
// s.mode, for /v1/listen: 'ok' (an interim Results, the first two words, on the first audio; at CloseStream a final Results,
//   is_final true, then a Metadata and a close 1000) | 'nometa' (at CloseStream the final Results and a close 1000, no
//   Metadata) | '401' (the key refused: 401 on the upgrade) | 'silent' (nothing at all at CloseStream) | 'drop' (the socket
//   destroyed after the first audio, with no close frame) | 'slow' (never opened: the upgrade is never answered) | 'echo',
//   'echopart' (on the first audio an Error message and a close 1011 whose words repeat the key, whole, or its first twelve
//   and last ten characters) | 'badaudio' (on the first audio a close 1008, as Deepgram closes on data it cannot decode)
//   | 'nofinal' (at CloseStream an interim Results only, then a Metadata and a close 1000: the stream ends with words
//   never made final) | 'late' (the upgrade answered s.lateMs after it came, default 300 ms: a slow handshake) |
//   'echoclose' (on the first audio a close 1011 whose reason repeats the key, with no Error message before it) |
//   'bigmsg' (on the first audio an interim Results of more than 64 kB, of Z's, then the usual interim) | 'interimclose'
//   (at CloseStream an interim Results only, then a close 1000, with no Metadata)
//   node tools/fake_deepgram.js [port]     runs it for building by hand, and prints its address
'use strict';
const http = require('http'), crypto = require('crypto');

const KEY = 'test-key-0123456789-not-a-secret';
const BIG = 9 * 1048576;                           // past app/voice.js's bound on an answer (8 MiB)

// a WAV the length of the text: RIFF, WAVE, a fmt chunk (PCM, one channel, 24 kHz, 16 bits) and the data
function wav(text) {
  const rate = 24000, secs = Math.min(5, 0.05 + 0.02 * String(text).length), n = Math.round(rate * secs);
  const b = Buffer.alloc(44 + n * 2);
  b.write('RIFF', 0, 'ascii'); b.writeUInt32LE(36 + n * 2, 4); b.write('WAVE', 8, 'ascii');
  b.write('fmt ', 12, 'ascii'); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(rate, 24); b.writeUInt32LE(rate * 2, 28);
  b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34);
  b.write('data', 36, 'ascii'); b.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) b.writeInt16LE(Math.round(8000 * Math.sin(2 * Math.PI * 440 * i / rate)), 44 + i * 2);
  return b;
}

// ---------------------------------------------------------------- RFC 6455, as much as a client's frames need
const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
// a frame of the server's: never masked, never fragmented
function frame(op, payload) {
  const n = payload.length;
  let head;
  if (n < 126) head = Buffer.from([0x80 | op, n]);
  else if (n < 65536) { head = Buffer.alloc(4); head[0] = 0x80 | op; head[1] = 126; head.writeUInt16BE(n, 2); }
  else { head = Buffer.alloc(10); head[0] = 0x80 | op; head[1] = 127; head.writeBigUInt64BE(BigInt(n), 2); }
  return Buffer.concat([head, payload]);
}
const textFrame = (obj) => frame(1, Buffer.from(JSON.stringify(obj), 'utf8'));
// a close frame: the code, then the reason (at most 123 bytes of it)
function closeFrame(code, reason) {
  const r = Buffer.from(String(reason || ''), 'utf8').subarray(0, 123), b = Buffer.alloc(2 + r.length);
  b.writeUInt16BE(code, 0); r.copy(b, 2);
  return frame(8, b);
}
// the client's frames, read as they come: calls on(fin, op, payload) for each whole frame, unmasked
function reader(on) {
  let buf = Buffer.alloc(0);
  return (d) => {
    buf = buf.length ? Buffer.concat([buf, d]) : d;
    for (;;) {
      if (buf.length < 2) return;
      const fin = !!(buf[0] & 0x80), op = buf[0] & 0x0f, masked = !!(buf[1] & 0x80);
      let n = buf[1] & 0x7f, at = 2;
      if (n === 126) { if (buf.length < 4) return; n = buf.readUInt16BE(2); at = 4; } else if (n === 127) { if (buf.length < 10) return; n = Number(buf.readBigUInt64BE(2)); at = 10; }
      if (buf.length < at + (masked ? 4 : 0) + n) return;
      const mask = masked ? buf.subarray(at, at + 4) : null; at += masked ? 4 : 0;
      const p = Buffer.from(buf.subarray(at, at + n));
      if (mask) for (let i = 0; i < n; i++) p[i] ^= mask[i & 3];
      buf = buf.subarray(at + n);
      on(fin, op, p);
    }
  };
}

function start(o) {
  o = o || {};
  return new Promise((resolve, reject) => {
    const S = { seen: [], mode: 'ok', key: o.key || KEY, sent: null, base: '', origin: '', port: 0, held: [], listens: [], heard: 'hard a starboard', sockets: new Set() };
    const rid = () => 'fake-' + S.seen.length;
    const json = (res, status, obj, headers) => { const b = typeof obj === 'string' ? obj : JSON.stringify(obj); res.writeHead(status, Object.assign({ 'content-type': 'application/json' }, headers || {})); res.end(b); };
    const err = (res, status, code, msg) => json(res, status, { err_code: code, err_msg: msg, request_id: rid() });
    // a body of n bytes, written as the socket takes it, stopped if the client lets go
    const stream = (res, n) => {
      const chunk = Buffer.alloc(65536, 0); let left = n;
      const go = () => { while (left > 0 && !res.destroyed) { const c = left >= chunk.length ? chunk : chunk.subarray(0, left); left -= c.length; if (!res.write(c)) { res.once('drain', go); return; } } if (!res.destroyed) res.end(); };
      go();
    };
    const server = http.createServer((req, res) => {
      res.on('error', () => { /* the client let go */ });
      const chunks = [];
      req.on('data', c => chunks.push(c));
      req.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8'), u = new URL(req.url, 'http://127.0.0.1');
        let body = null; try { body = raw ? JSON.parse(raw) : null; } catch (e) { body = null; }
        S.seen.push({ method: req.method, path: u.pathname, search: u.search, query: Object.fromEntries(u.searchParams), headers: Object.assign({}, req.headers), body, raw });
        const m = S.mode;
        if (m === 'slow') { S.held.push(res); return; }
        if (m === 'redirect') { res.writeHead(307, { location: 'http://127.0.0.1:9/elsewhere' }); res.end(); return; }
        const auth = req.headers.authorization;
        if (m === '401' || auth !== 'Token ' + S.key) return err(res, 401, 'INVALID_AUTH', 'Invalid credentials.');
        if (m === '403') return err(res, 403, 'INSUFFICIENT_PERMISSIONS', 'This key may not use this endpoint.');
        if (m === '402') return err(res, 402, 'ASR_PAYMENT_REQUIRED', 'Project does not have enough credits.');
        if (m === '429') return err(res, 429, 'TOO_MANY_REQUESTS', 'Too many requests. Please try again later.');
        if (m === '500') return err(res, 500, 'INTERNAL_SERVER_ERROR', 'The server had an error.');
        if (req.method === 'GET' && u.pathname === '/v1/auth/token') return json(res, 200, { accessor: 'fake-accessor' });
        if (req.method === 'POST' && u.pathname === '/v2/speak') {
          if (m === '400') return err(res, 400, 'Bad Request', 'The text could not be read.');
          if (m === '413') return err(res, 413, 'PAYLOAD_TOO_LARGE', 'The text is too long.');
          if (m === '422') return json(res, 422, { category: 'INVALID_REQUEST_BODY', message: 'The text is not in a form this voice takes.', details: '', request_id: rid() });
          if (m === '404') return err(res, 404, 'NOT_FOUND', 'No such model.');
          // a server that repeats the caller's key in its error (some do, whole or in part)
          if (m === 'echo') return err(res, 400, 'Bad Request', 'No such key on this account: ' + String(auth || '').replace(/^Token /, ''));
          // ... the key far into a long message (where a cut would fall on it), a part of it only, the key in the answer's
          // content type, and an error that is a bare string (the third of Deepgram's error shapes)
          const k = String(auth || '').replace(/^Token /, '');
          if (m === 'echolong') return err(res, 400, 'Bad Request', 'x'.repeat(196) + ' ' + k + ' ' + 'y'.repeat(80));
          if (m === 'echopart') return err(res, 400, 'Bad Request', 'No such key: it begins ' + k.slice(0, 12) + ' and ends ' + k.slice(-10) + '.');
          if (m === 'typekey') { res.writeHead(200, { 'content-type': 'text/plain; key=' + k }); res.end('not audio'); return; }
          if (m === 'typekey2') { res.writeHead(200, { 'content-type': 'x' + k }); res.end('not audio either'); return; }
          if (m === 'plain') return json(res, 400, JSON.stringify('The voice is not one of ours.'));
          const q = S.seen[S.seen.length - 1].query, keys = Object.keys(q).sort().join(',');
          if (keys !== 'container,encoding,model,sample_rate' || !/^flux-[a-z]+-en$/.test(q.model) || q.encoding !== 'linear16' || q.container !== 'wav' || q.sample_rate !== '24000') return err(res, 400, 'Bad Request', 'Unsupported query: ' + u.search);
          if (!/^application\/json/i.test(String(req.headers['content-type'] || '')) || !body || typeof body.text !== 'string' || !body.text || Object.keys(body).length !== 1) return err(res, 400, 'Bad Request', 'The body must be {"text": ...}.');
          if (m === 'notaudio') return json(res, 200, { request_id: rid() });
          if (m === 'badwav') { res.writeHead(200, { 'content-type': 'audio/wav' }); res.end(Buffer.from('not a wav at all, though it says so')); return; }
          if (m === 'toolarge') { res.writeHead(200, { 'content-type': 'audio/wav', 'content-length': String(BIG) }); stream(res, BIG); return; }
          if (m === 'toolarge-chunked') { res.writeHead(200, { 'content-type': 'audio/wav' }); stream(res, BIG); return; }
          // a true WAV under another name, or under none (Deepgram's reference names no content type for its answer)
          if (m === 'octet' || m === 'notype') { S.sent = wav(body.text); res.writeHead(200, m === 'octet' ? { 'content-type': 'application/octet-stream' } : {}); res.end(S.sent); return; }
          S.sent = wav(body.text);
          res.writeHead(200, { 'content-type': 'audio/wav', 'content-length': String(S.sent.length) });
          res.end(S.sent);
          return;
        }
        err(res, 404, 'NOT_FOUND', 'No such path.');
      });
    });
    // ---- /v1/listen: the live socket
    server.on('upgrade', (req, socket, head) => {
      socket.on('error', () => { /* the client let go */ });
      S.sockets.add(socket); socket.on('close', () => S.sockets.delete(socket));
      const u = new URL(req.url, 'http://127.0.0.1'), m = S.mode;
      const protocols = String(req.headers['sec-websocket-protocol'] || '').split(',').map(x => x.trim()).filter(Boolean);
      const query = {};
      for (const k of new Set(u.searchParams.keys())) query[k] = k === 'keyterm' ? u.searchParams.getAll(k) : u.searchParams.get(k);
      const rec = { path: u.pathname, search: u.search, query, mipOptOut: u.searchParams.getAll('mip_opt_out').length === 1 && u.searchParams.get('mip_opt_out') === 'true',
        headers: Object.assign({}, req.headers), protocols, audio: Buffer.alloc(0), frames: 0, texts: [], closed: null, opened: false };
      S.listens.push(rec);
      const refuse = (status, text, body) => { try { socket.end('HTTP/1.1 ' + status + ' ' + text + '\r\ncontent-type: application/json\r\ndg-error: ' + text + '\r\ncontent-length: ' + Buffer.byteLength(body) + '\r\nconnection: close\r\n\r\n' + body); } catch (e) { /* gone */ } };
      if (u.pathname !== '/v1/listen') return refuse(404, 'Not Found', JSON.stringify({ err_code: 'NOT_FOUND', err_msg: 'No such path.' }));
      if (m === 'slow') { S.held.push(socket); return; }                           // never opened: the upgrade is never answered
      if (String(req.headers.upgrade || '').toLowerCase() !== 'websocket' || req.headers['sec-websocket-version'] !== '13' || !req.headers['sec-websocket-key']) return refuse(400, 'Bad Request', JSON.stringify({ err_code: 'Bad Request', err_msg: 'Not a WebSocket.' }));
      if (m === '401' || protocols.length !== 2 || protocols[0] !== 'token' || protocols[1] !== S.key) return refuse(401, 'Unauthorized', JSON.stringify({ err_code: 'INVALID_AUTH', err_msg: 'Invalid credentials.' }));
      const accept = crypto.createHash('sha1').update(req.headers['sec-websocket-key'] + GUID).digest('base64');
      const answer = () => { if (socket.destroyed) return; socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + accept + '\r\nSec-WebSocket-Protocol: token\r\n\r\n'); rec.opened = true; };
      if (m === 'late') { const lt = setTimeout(answer, S.lateMs || 300); socket.on('close', () => clearTimeout(lt)); } else answer();
      const k = S.key, words = String(S.heard);
      let audioSeen = false, frag = -1, parts = [], ended = false, closing = null;
      const send = (b) => { if (!ended && !socket.destroyed) socket.write(b); };
      // the server's own close: its frame, then the client's answer (or a moment) before the line is let go
      const shut = (code, reason) => { if (ended) return; send(closeFrame(code, reason)); ended = true; closing = setTimeout(() => socket.destroy(), 300); };
      socket.on('close', () => { if (closing) clearTimeout(closing); });
      const message = (op, p) => {
        if (op === 2) {
          rec.frames++; rec.audio = Buffer.concat([rec.audio, p]);
          if (audioSeen) return;
          audioSeen = true;
          if (m === 'drop') { socket.destroy(); return; }
          if (m === 'badaudio') { shut(1008, 'DATA-0000: the data could not be decoded as audio'); return; }
          if (m === 'echo') { send(textFrame({ type: 'Error', description: 'No such key on this project: ' + k })); shut(1011, 'key ' + k); return; }
          if (m === 'echopart') { send(textFrame({ type: 'Error', description: 'No such key: it begins ' + k.slice(0, 12) + ' and ends ' + k.slice(-10) + '.' })); shut(1011, 'begins ' + k.slice(0, 12)); return; }
          if (m === 'echoclose') { shut(1011, 'key ' + k); return; }
          if (m === 'bigmsg') send(textFrame({ type: 'Results', is_final: false, speech_final: false, channel: { alternatives: [{ transcript: 'Z'.repeat(70000), confidence: 0.1 }] } }));
          send(textFrame({ type: 'Results', is_final: false, speech_final: false, channel: { alternatives: [{ transcript: words.split(' ').slice(0, 2).join(' '), confidence: 0.9 }] } }));
          return;
        }
        let j = null; try { j = JSON.parse(p.toString('utf8')); } catch (e) { j = null; }
        rec.texts.push(j || p.toString('utf8'));
        if (!j || j.type !== 'CloseStream' || m === 'silent') return;
        const isFinal = m !== 'nofinal' && m !== 'interimclose';
        send(textFrame({ type: 'Results', is_final: isFinal, speech_final: isFinal, channel: { alternatives: [{ transcript: words, confidence: 0.95 }] } }));
        if (m !== 'nometa' && m !== 'interimclose') send(textFrame({ type: 'Metadata', request_id: 'fake-listen-' + S.listens.length, duration: rec.audio.length / 16000, channels: 1 }));
        shut(1000, '');
      };
      const take = reader((fin, op, p) => {
        if (op === 8) { rec.closed = { code: p.length >= 2 ? p.readUInt16BE(0) : null, reason: p.subarray(2).toString('utf8') }; if (!ended) { send(closeFrame(rec.closed.code || 1000, '')); ended = true; } socket.end(); return; }
        if (op === 9) { send(frame(10, p)); return; }
        if (op === 10) return;
        if (op === 0) { if (frag < 0) return; parts.push(p); if (fin) { const whole = Buffer.concat(parts); const o0 = frag; frag = -1; parts = []; message(o0, whole); } return; }
        if (op === 1 || op === 2) { if (fin) message(op, p); else { frag = op; parts = [p]; } }
      });
      socket.on('data', take);
      if (head && head.length) take(head);
    });
    server.on('error', reject);
    server.listen(o.port || 0, '127.0.0.1', () => {
      S.port = server.address().port; S.origin = 'http://127.0.0.1:' + S.port; S.base = S.origin;
      S.close = () => new Promise((done) => {
        for (const r of S.held.concat(Array.from(S.sockets))) { try { r.destroy(); } catch (e) { /* gone */ } }
        S.held.length = 0; S.sockets.clear();
        if (server.closeAllConnections) server.closeAllConnections();
        server.close(() => done());
      });
      resolve(S);
    });
  });
}

module.exports = { start, wav, KEY };
if (require.main === module) start({ port: +process.argv[2] || 0 }).then((s) => { console.log('a stand-in for Deepgram is listening: ' + s.base + '  (Ctrl+C ends it)'); });
