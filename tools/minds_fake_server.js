// A provider on this PC, for the crew's minds' tests and for building with no key and no network
// (docs/DESIGN_ask_the_bridge_v1_2026-11-23.md, sections 9 and 13). It speaks both forms:
//   POST /v1/chat/completions   the chat-completions form (app/minds_openai.js)
//   POST /v1/messages           Claude's form (app/minds_anthropic.js, when built)
//   GET  /v1/models             a list
// It listens on 127.0.0.1 only, on a port the system picks. Every request is kept in `seen` (its path, its headers, its
// body), for the tests to hold the app to: one host, the key in the header and nowhere else.
//   const s = await start(); s.base ('http://127.0.0.1:PORT/v1'), s.origin, s.seen, s.mode, s.reply, await s.close()
// s.mode: 'ok' | 'slow' (never answers until closed) | '401' | '429' | '500' | 'badjson' | 'empty' | 'refusal' | 'echo'
//         | 'redirect' (to another port) | 'noschema' (refuses a json_schema form) | 'noform' (refuses any form)
//         | 'nocap' (refuses max_completion_tokens) | 'noeffort', 'noconfig' (Claude's form: refuses the effort, or any
//         output_config)
// s.reply: the text of the answer (default: a turn, {"say":"Aye, sir.","order":null}); a function of the request's body
// to answer by what was asked. s.models: the names its list gives (default: fake-1, fake-2).
//   node tools/minds_fake_server.js [port]     runs it for building by hand, and prints its address
'use strict';
const http = require('http');

function start(port) {
  return new Promise((resolve, reject) => {
    const S = { seen: [], mode: 'ok', reply: '{"say":"Aye, sir.","order":null}', base: '', origin: '', port: 0, held: [] };
    const send = (res, status, obj, headers) => { const b = typeof obj === 'string' ? obj : JSON.stringify(obj); res.writeHead(status, Object.assign({ 'content-type': 'application/json' }, headers || {})); res.end(b); };
    const server = http.createServer((req, res) => {
      const chunks = [];
      req.on('data', c => chunks.push(c));
      req.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        let body = null; try { body = raw ? JSON.parse(raw) : null; } catch (e) { body = null; }
        const path = req.url.split('?')[0];
        S.seen.push({ method: req.method, path, headers: Object.assign({}, req.headers), body, raw });
        const m = S.mode, text = typeof S.reply === 'function' ? String(S.reply(body, path)) : String(S.reply);
        if (m === 'slow') { S.held.push(res); return; }
        if (m === '401') return send(res, 401, { error: { message: 'Incorrect API key provided.', type: 'invalid_request_error' } });
        if (m === '429') return send(res, 429, { error: { message: 'Rate limit reached.' } });
        if (m === '500') return send(res, 500, { error: { message: 'The server had an error.' } });
        // a provider that repeats the caller's key in its error (some do, whole or in part)
        if (m === 'echo') return send(res, 400, { error: { message: 'Bad request for the key ' + String(req.headers.authorization || '').replace(/^Bearer /, '') + ' on this account.' } });
        // ... only its first and last characters, or the key far into a long text (where a cut would fall on it)
        const bearer = String(req.headers.authorization || '').replace(/^Bearer /, '');
        if (m === 'echopart') return send(res, 400, { error: { message: 'No such key: it begins ' + bearer.slice(0, 12) + ' and ends ' + bearer.slice(-10) + '.' } });
        if (m === 'echolong') return send(res, 400, { error: { message: 'x'.repeat(180) + ' ' + bearer + ' ' + 'y'.repeat(80) } });
        if (m === 'redirect') return send(res, 302, '', { location: 'http://127.0.0.1:9/elsewhere' });
        if (m === 'badjson') return send(res, 200, '{"choices": [');
        if (req.method === 'GET' && path === '/v1/models') return send(res, 200, { object: 'list', data: (Array.isArray(S.models) ? S.models : ['fake-1', 'fake-2']).map(id => ({ id, object: 'model' })) });
        if (req.method === 'POST' && path === '/v1/chat/completions') {
          const f = body && body.response_format;
          if (m === 'noschema' && f && f.type === 'json_schema') return send(res, 400, { error: { message: 'response_format of type json_schema is not supported by this model.' } });
          if (m === 'noform' && f) return send(res, 400, { error: { message: 'response_format is not supported.' } });
          if (m === 'nocap' && body && body.max_completion_tokens !== undefined) return send(res, 400, { error: { message: 'Unsupported parameter: max_completion_tokens. Use max_tokens instead.' } });
          const message = m === 'refusal' ? { role: 'assistant', content: null, refusal: 'I cannot help with that.' } : { role: 'assistant', content: m === 'empty' ? '' : text };
          return send(res, 200, { id: 'chatcmpl-fake', object: 'chat.completion', model: (body && body.model) || 'fake-1', choices: [{ index: 0, message, finish_reason: 'stop' }],
            usage: { prompt_tokens: 321, completion_tokens: 17, total_tokens: 338, prompt_tokens_details: { cached_tokens: 300 } } });
        }
        if (req.method === 'POST' && path === '/v1/messages') {
          const oc = body && body.output_config;
          if (m === 'noeffort' && oc && oc.effort !== undefined) return send(res, 400, { type: 'error', error: { type: 'invalid_request_error', message: 'This model does not support the effort parameter.' } });
          if (m === 'noconfig' && oc) return send(res, 400, { type: 'error', error: { type: 'invalid_request_error', message: 'output_config is not supported on this model.' } });
          if (m === 'refusal') return send(res, 200, { id: 'msg_fake', type: 'message', role: 'assistant', model: (body && body.model) || 'fake-1', content: [], stop_reason: 'refusal', stop_details: { type: 'refusal', category: null, explanation: 'declined' }, usage: { input_tokens: 21, output_tokens: 0 } });
          return send(res, 200, { id: 'msg_fake', type: 'message', role: 'assistant', model: (body && body.model) || 'fake-1', content: m === 'empty' ? [] : [{ type: 'text', text }], stop_reason: 'end_turn', stop_sequence: null,
            usage: { input_tokens: 21, output_tokens: 17, cache_read_input_tokens: 300, cache_creation_input_tokens: 0 } });
        }
        send(res, 404, { error: { message: 'no such path' } });
      });
    });
    server.on('error', reject);
    server.listen(port || 0, '127.0.0.1', () => {
      S.port = server.address().port; S.origin = 'http://127.0.0.1:' + S.port; S.base = S.origin + '/v1';
      S.close = () => new Promise((done) => { for (const r of S.held) { try { r.destroy(); } catch (e) { /* gone */ } } S.held.length = 0; server.closeAllConnections && server.closeAllConnections(); server.close(() => done()); });
      resolve(S);
    });
  });
}

module.exports = { start };
if (require.main === module) start(+process.argv[2] || 0).then((s) => { console.log('a stand-in provider is listening: ' + s.base + '  (Ctrl+C ends it)'); });
