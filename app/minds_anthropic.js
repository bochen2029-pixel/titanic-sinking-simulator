// The crew's minds: Claude, through Anthropic's own SDK for JavaScript (@anthropic-ai/sdk; Bo, 2026-11-23: "Yes, use
// the SDK"). One call for app/minds.js (docs/DESIGN_ask_the_bridge_v1_2026-11-23.md, section 9). The fetch it is given
// is already held to one host (minds.js, guard), and the SDK is given that fetch and no other.
//
//   call({ base, key, model, stable, changing, schema, effort, maxTokens, timeoutMs, signal, fetch, MindsError })
//     -> { text, model, usage: { in, out, cached } }        throws MindsError(kind, why)
//
// As Anthropic's reference for new code asks (read 2026-11-23, with the SDK's own types, version 1.13.0):
//   - the stable part is the system prompt, marked for the cache (the changing part comes after it, as the user's turn);
//   - the answer's form is a structured output (output_config.format, a JSON schema); effort is set, low for a short line;
//   - no sampling setting and no thinking setting is sent (the current models think as they see fit and refuse a
//     temperature);
//   - a refusal is read from the stop reason before any text; the server's own fallback is asked for ("default": on a
//     model that has none the request simply runs on that model);
//   - the key is the player's own, passed here by minds.js and to the SDK as its apiKey, and the address is passed too;
//   - NOTHING IS TAKEN FROM THE ENVIRONMENT. The SDK reads it for more than a key: ANTHROPIC_CUSTOM_HEADERS adds its
//     headers to every request, whatever key is passed (its client's constructor; found by the app lane's review). So
//     every ANTHROPIC_* variable is taken out of this process's environment before a client is made (scrub, below):
//     the app reads none of them and starts no child process, and nothing the SDK reads there, now or in a later
//     version, can reach a request. tools/minds_app_tests.js holds it with four of them set;
//   - the SDK retries nothing and prints nothing: one bounded wait is minds.js's.
// A model that will not take the effort, or the form, answers 400: it is then asked without the effort, and then
// without the form (the request's own words ask for JSON, and the page checks what comes back).
'use strict';
const Anthropic = require('@anthropic-ai/sdk');

const FALLBACK_BETA = 'server-side-fallback-2026-07-01';

// every ANTHROPIC_* variable out of this process's environment (Windows' names are in any case): see the head of this file
function scrub() { for (const k of Object.keys(process.env)) if (/^ANTHROPIC_/i.test(k)) delete process.env[k]; }
scrub();

async function call(o) {
  const E = o.MindsError;
  scrub();                                           // again before each client: a variable set since must not be read either
  const client = new Anthropic({ apiKey: o.key, baseURL: o.base, fetch: o.fetch, timeout: o.timeoutMs, maxRetries: 0, logLevel: 'off', openTelemetry: false });
  // what may be left out when a model refuses it, a step at a time
  const steps = [{ effort: true, format: true }, { effort: false, format: true }, { effort: false, format: false }];
  let res = null, last = null;
  for (const step of steps) {
    const body = {
      model: o.model,
      max_tokens: o.maxTokens,
      system: [{ type: 'text', text: o.stable, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: o.changing }],
      betas: [FALLBACK_BETA],
      fallbacks: 'default',
    };
    const oc = {};
    if (step.effort && o.effort) oc.effort = o.effort;
    if (step.format) oc.format = { type: 'json_schema', schema: o.schema };
    if (Object.keys(oc).length) body.output_config = oc;
    try { res = await client.beta.messages.create(body, { signal: o.signal }); break; } catch (e) {
      // the guard's own refusal comes back wrapped as a connection error: it is said as it is
      if (e && e.cause instanceof E) throw e.cause;
      if (e instanceof Anthropic.BadRequestError || e instanceof Anthropic.UnprocessableEntityError) { last = e; continue; }
      if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) throw new E('auth', 'The provider refused the key (' + e.status + ').');
      if (e instanceof Anthropic.NotFoundError) throw new E('shape', 'The provider knows no such model (404).');
      if (e instanceof Anthropic.RateLimitError) throw new E('rate', 'The provider says too many requests, or the account\'s limit is reached (429).');
      if (e instanceof Anthropic.APIConnectionTimeoutError) throw new E('timeout', 'No answer came in time.');
      if (e instanceof Anthropic.APIUserAbortError) throw new E('timeout', 'The wait was ended.');
      if (e instanceof Anthropic.APIConnectionError) throw new E('network', 'The provider could not be reached.');
      if (e instanceof Anthropic.InternalServerError) throw new E('server', 'The provider answered with an error (' + e.status + ').');
      if (e instanceof Anthropic.APIError) throw new E(e.status === 402 ? 'auth' : 'server', e.status === 402 ? 'The provider says the account cannot be billed (402).' : 'The provider answered with an error (' + e.status + ').');
      throw new E('network', 'The provider could not be reached.');
    }
  }
  if (!res) throw new E('shape', 'The provider refused the request: ' + String((last && last.message) || '400'));
  // the stop reason first: a refusal carries no answer to read
  if (res.stop_reason === 'refusal') throw new E('refused', 'The language model declined to answer.');
  const text = (Array.isArray(res.content) ? res.content : []).filter(b => b && b.type === 'text' && typeof b.text === 'string').map(b => b.text).join('');
  if (res.stop_reason === 'max_tokens' || res.stop_reason === 'model_context_window_exceeded') throw new E('server', 'The answer was cut off before its end.');
  if (!text.trim()) throw new E('server', 'The provider sent no text.');
  const u = res.usage || {}, n = (x) => (Number.isFinite(x) ? x : 0);
  return { text, model: typeof res.model === 'string' ? res.model : o.model,
    usage: { in: n(u.input_tokens) + n(u.cache_creation_input_tokens) + n(u.cache_read_input_tokens), out: n(u.output_tokens), cached: n(u.cache_read_input_tokens) } };
}

module.exports = { call, scrub, FALLBACK_BETA };
