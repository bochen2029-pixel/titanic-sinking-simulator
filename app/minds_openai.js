// The crew's minds: the chat-completions form, which OpenAI, Google's compatible endpoint, Cerebras and local servers
// (LM Studio, Ollama) all speak. One call, by fetch, for app/minds.js (docs/DESIGN_ask_the_bridge_v1_2026-11-23.md,
// section 9). The fetch it is given is already held to one host (minds.js, guard).
//
//   call({ base, key, model, stable, changing, schema, cap, maxTokens, signal, fetch, MindsError })
//     -> { text, model, usage: { in, out, cached } }        throws MindsError(kind, why)
//
// The stable part is the system message, the changing part the user's. The answer's form is asked for as a JSON schema
// (response_format); a server that refuses that is asked once more for a JSON object, and then with no form at all (the
// request's own words ask for JSON, and the page checks what comes back). The name of the output's limit differs
// between servers (max_completion_tokens, max_tokens): a server that refuses one is given the other. No sampling
// setting is sent. Nothing is printed.
'use strict';

// the provider's own message from an error body, or the body's start
function messageOf(text) {
  try { const j = JSON.parse(text); const e = j && (j.error !== undefined ? j.error : j); return String((e && (e.message || e.msg || e.detail)) || (typeof e === 'string' ? e : text)); } catch (e) { return String(text); }
}
// An answer's body as text, read no further than `max` bytes: a server that never stops sending (the player's own, or
// one that means harm) must not fill this process's memory while the wait for it runs (the second review: the whole
// body was read before it was cut). What is past the limit is not read, and the connection is let go.
const MAX_BODY = 1000000;
async function bodyText(res, max) {
  const body = res && res.body;
  if (!body || typeof body.getReader !== 'function') return String(await res.text()).slice(0, max);
  const reader = body.getReader(), chunks = [];
  let n = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value && value.length) { chunks.push(Buffer.from(value.buffer, value.byteOffset, value.byteLength)); n += value.byteLength; if (n >= max) break; }
    }
  } finally { try { await reader.cancel(); } catch (e) { /* closed already */ } }
  return Buffer.concat(chunks).subarray(0, max).toString('utf8');
}
async function call(o) {
  const E = o.MindsError, url = String(o.base).replace(/\/+$/, '') + '/chat/completions';
  const headers = { 'content-type': 'application/json', accept: 'application/json' };
  if (o.key) headers.authorization = 'Bearer ' + o.key;
  const forms = [{ type: 'json_schema', json_schema: { name: 'turn', strict: true, schema: o.schema } }, { type: 'json_object' }, null];
  const caps = o.cap === 'max_completion_tokens' ? ['max_completion_tokens', 'max_tokens'] : ['max_tokens', 'max_completion_tokens'];
  let fi = 0, ci = 0;
  for (let attempt = 0; attempt < 5; attempt++) {
    const body = { model: o.model, messages: [{ role: 'system', content: o.stable }, { role: 'user', content: o.changing }] };
    body[caps[ci]] = o.maxTokens;
    if (forms[fi]) body.response_format = forms[fi];
    const res = await o.fetch(url, { method: 'POST', headers, body: JSON.stringify(body), signal: o.signal });
    const text = await bodyText(res, MAX_BODY);
    if (res.status === 400 || res.status === 422) {
      const why = messageOf(text);
      // which part of the request it would not take: the limit's name first (if it says so), then the form, a step at a time
      if (ci === 0 && /max_(completion_)?tokens/i.test(why)) { ci = 1; continue; }
      if (fi < forms.length - 1) { fi++; continue; }
      throw new E('shape', 'The provider refused the request: ' + why);
    }
    if (res.status === 401 || res.status === 403) throw new E('auth', 'The provider refused the key (' + res.status + ').');
    if (res.status === 404) throw new E('shape', 'The provider knows no such model or address (404): ' + messageOf(text));
    if (res.status === 429) throw new E('rate', 'The provider says too many requests, or the account\'s limit is reached (429).');
    if (!res.ok) throw new E('server', 'The provider answered with an error (' + res.status + ').');
    let j;
    try { j = JSON.parse(text); } catch (e) { throw new E('server', 'The provider\'s answer was not JSON.'); }
    const ch = j && Array.isArray(j.choices) ? j.choices[0] : null, msg = ch && ch.message;
    if (msg && typeof msg.refusal === 'string' && msg.refusal) throw new E('refused', 'The language model declined to answer.');
    let content = '';
    if (msg && typeof msg.content === 'string') content = msg.content;
    else if (msg && Array.isArray(msg.content)) content = msg.content.map(p => (p && typeof p.text === 'string' ? p.text : '')).join('');
    if (!content.trim()) throw new E('server', ch && ch.finish_reason === 'length' ? 'The answer was cut off before it began: the model spent its whole allowance thinking. Choose one that thinks less.' : 'The provider sent no text.');
    const u = (j && j.usage) || {}, d = u.prompt_tokens_details || {};
    return { text: content, model: typeof j.model === 'string' ? j.model : o.model, usage: { in: u.prompt_tokens, out: u.completion_tokens, cached: d.cached_tokens } };
  }
  throw new E('shape', 'The provider refused the request in every form.');
}

// The models a server offers (GET <base>/models): their names, for a player who has named none ("Try it" then says
// which there are: a local server's models have names nobody can guess). A server that keeps no such list, or answers
// anything unexpected, gives []: this is a help, never a fault of its own. A refused key is still said.
//   models({ base, key, signal, fetch, MindsError }) -> [name, ...]
async function models(o) {
  const E = o.MindsError, url = String(o.base).replace(/\/+$/, '') + '/models';
  const headers = { accept: 'application/json' };
  if (o.key) headers.authorization = 'Bearer ' + o.key;
  const res = await o.fetch(url, { method: 'GET', headers, signal: o.signal });
  const text = await bodyText(res, MAX_BODY);
  if (res.status === 401 || res.status === 403) throw new E('auth', 'The provider refused the key (' + res.status + ').');
  if (res.status === 429) throw new E('rate', 'The provider says too many requests, or the account\'s limit is reached (429).');
  if (!res.ok) return [];
  let j;
  try { j = JSON.parse(text); } catch (e) { return []; }
  const list = j && Array.isArray(j.data) ? j.data : (Array.isArray(j) ? j : (j && Array.isArray(j.models) ? j.models : []));
  return list.map(m => (m && typeof m.id === 'string' ? m.id : (m && typeof m.name === 'string' ? m.name : ''))).filter(Boolean);
}

module.exports = { call, models, bodyText, MAX_BODY };
