#!/usr/bin/env node
// C3 provider runner (C3-EVALUATION-PLAN.md §6, README.md "Provider requirements"). Dependency-free.
//
//   node runner.mjs --plan                      worst-case cost table under the dry-run assumed prices (no call)
//   node runner.mjs --dry-run [options]         the whole run against an offline mock provider (no network)
//   node runner.mjs --self-test                 scenarios (a), (b), the extra branches and the adapter checks, offline
//   node runner.mjs --live [options]            a real run: REFUSES today (adapters not verified, no keys).
//                                               Without --live a real run is always refused.
//
// Options: --out <dir>  --providers anthropic,openai  --max-output <tokens>
//          --pack-sha <40-hex>          the commit SHA of the frozen decision pack (E-DECISION-PACK §4.3a, Sharon).
//                                       Recorded in every provenance record. REQUIRED for --live: a real run without a
//                                       valid lowercase 40-hex value is refused before any request is built. Optional
//                                       for --dry-run (recorded as null when absent; refused when malformed)
//          --cap-provider <usd>  --cap-total <usd>  (can only LOWER the caps in prices.json, never raise them)
//          --scenario normal|ceiling   (dry run only: which mock fault plan; ceiling = total cap 0.05)
//          --real-prices               (--plan and --dry-run only: use the pinned prices in prices.json, not the
//                                       deliberately high dry-run assumption; still no network)
// The default provider set is anthropic and openai. google is excluded (prices.json says why) and is refused.
// It has no adapter.
//
// Budget rules, applied before EVERY attempt:
//   input_estimate  = UTF-8 bytes of (request + schema)               a true upper bound on the text's tokens: both
//                                                                     providers' tokenisers are byte-level (tokens <= bytes)
//   input_bound     = ceil(input_estimate × 1.2) + 10,000             the allowance covers what the provider adds
//                                                                     (structured output); sized from the 17 Nov run
//                                                                     (4,993 real input tokens, all treated as overhead,
//                                                                     × 2, rounded up; floor 1,000). v2, E incident run 1
//   worst_case      = input_bound × in_price + max_output × out_price
//   max_output is sent to the API as the hard output cap.
//   The worst case is RESERVED in the ledger before the call; the call is refused if
//     provider spent + provider reservations + worst_case > per-provider cap (US$8), or
//     total spent + total reservations + worst_case > total cap (US$25).
//   After the call the reservation is replaced by the cost from the usage the provider returns; with no usage
//   (including a 429, a 5xx or a transport error) the reservation is kept as the cost (conservative).
//   A reported cost above its reservation is an overrun: the run aborts at once.
// Retries: at most 2 per request (3 attempts), each a separate reservation, only on a transport error, a retryable
// 429 (a rate limit, not a spend or billing stop), a 5xx, or output that kit.mjs validate measures invalid.
// A spend or billing stop (classified by status AND error code, E-PROVIDER-FACTS.md §6) is never retried and ends
// every further call to that provider. Concurrency is 1: never more than one reservation in flight.
// Money is held as integer micro-USD (1e-6 USD), rounded UP, so float error never loosens a cap.
//
// The unit of a call is one chapter request (kit.mjs request <1|2>), which asks for 15 items: 2 requests and
// 30 drafts per provider. Output layout matches what kit.mjs blind/score read:
//   <out> is out/ for a real run and out-dry-run/ for a dry run (never mixed: kit.mjs blind reads every folder in it)
//   <out>/ledger.json, <out>/summary.json
//   <out>/<provider>/bab<n>.json             raw response text of the judged attempt, unmodified
//   <out>/<provider>/bab<n>.provenance.json  model, version, request id, prompt version, source excerpt hash, …
//   <out>/<provider>/attempts/bab<n>.a<k>.json   every attempt's raw response, kept
//   <out>/<provider>/incomplete/bab<n>.a<k>.partial.txt   v3: the answer text received before a stream broke off, kept
//                                            for incident investigation only (never validated, judged or blinded)
//   <out>/<provider>/usage.json              the kit's usage.json (provenance + calls with tokens)
// v2 streaming: anthropic calls stream (streamCall). Only a completed stream is a response; a cut or errored stream is
// stream_incomplete or stream_error, keeps its full reservation and is retried like a transport error. A real run
// refuses any provider without a streaming transport (openai today: deferred by Ruling 50).
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, renameSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const HERE = dirname(fileURLToPath(import.meta.url));
const KIT = join(HERE, 'kit.mjs');
const PROVIDERS = ['anthropic', 'openai'];   // the adapters that exist; the eligible set comes from prices.json
const CHAPTERS = [1, 2];
const PER_CHAPTER = 15;
const MAX_ATTEMPTS = 3;            // 1 + at most 2 retries per request
const CONCURRENCY = 1;             // the in-flight bound: one reservation at a time
const CHARS_PER_TOKEN = 3;
const INPUT_MARGIN = 1.2;
const INPUT_ALLOWANCE = 10000;   // v2: see the budget rules above
const CALL_TIMEOUT_MS = 1_500_000; // v2: 25 min per call. At 48,000 output tokens a call can take ~5.5 min at the speed seen on 17 Nov (12,000 in 83 s); a timeout is charged and retried, so leave ample room
const DEFAULT_MAX_OUTPUT = 12000;  // hard output cap per call: 15 items of JSON in Indonesian
const LABELS = ['A', 'B', 'C', 'D'];
const UNVERIFIED = 'UNVERIFIED';
const PACK_SHA_RE = /^[0-9a-f]{40}$/;   // a full git commit SHA, lowercase
const MICRO = 1e6;

const sha = (s) => createHash('sha256').update(s).digest('hex');
const usd = (micro) => (micro / MICRO).toFixed(6);
const usd2 = (micro) => (micro / MICRO).toFixed(4);
const toMicro = (u) => Math.round(Number(u) * MICRO);
class Fatal extends Error {}

// ───────────────────────────── the frozen kit (the runner never re-implements it)
const manifest = () => JSON.parse(readFileSync(join(HERE, 'material', 'MANIFEST.json'), 'utf8'));
const schemaText = () => readFileSync(join(HERE, 'item-schema.json'), 'utf8');
function kitRequest(b) {
  const text = execFileSync(process.execPath, [KIT, 'request', String(b)], { encoding: 'utf8' });
  const want = manifest().chapters[`bab${b}`].request_sha256;
  if (sha(text) !== want) throw new Fatal(`bab${b}: request bytes do not match MANIFEST.json (kit not frozen?)`);
  return text;
}
function kitValidate(file, b) {
  const v = JSON.parse(execFileSync(process.execPath, [KIT, 'validate', file, String(b)], { encoding: 'utf8' }));
  v.valid = v.parsed && v.count === PER_CHAPTER && v.problems.length === 0 && v.items.every((x) => x.valid);
  return v;
}

// ───────────────────────────── cost
const estimateInputTokens = (bytes) => bytes;   // v2: tokens <= bytes (byte-level tokenisers); CHARS_PER_TOKEN is no longer used
// prices are USD per 1M tokens, so tokens × price is micro-USD; rounded up. A documented long-prompt surcharge
// (prices.json `surcharge`, e.g. OpenAI above 272K input tokens) applies to the full request.
function costMicro(inTok, outTok, p) {
  const s = p.surcharge && inTok > p.surcharge.above_input_tokens ? p.surcharge : null;
  return Math.ceil(inTok * p.input * (s ? s.input_multiplier : 1) + outTok * p.output * (s ? s.output_multiplier : 1));
}
function worstCase(bytes, maxOutput, p) {
  const est = estimateInputTokens(bytes);
  const inBound = Math.ceil(est * INPUT_MARGIN) + INPUT_ALLOWANCE;
  return { input_estimate: est, input_bound: inBound, max_output_tokens: maxOutput, micro: costMicro(inBound, maxOutput, p) };
}

// ───────────────────────────── ledger (written after every reservation and every settlement)
class Ledger {
  constructor(path, caps, { fresh, onReserve } = {}) {
    this.path = path; this.caps = caps; this.onReserve = onReserve;
    this.doc = { version: 1, caps_usd: { per_provider: caps.perProvider / MICRO, total: caps.total / MICRO }, runs: [], entries: [] };
    if (!fresh && existsSync(path)) {
      this.doc = JSON.parse(readFileSync(path, 'utf8'));
      // a reservation left open by a crash may have been billed: it is kept as its cost
      for (const e of this.doc.entries) if (e.status === 'reserved') { e.status = 'orphaned_reservation'; e.cost_usd = e.reserved_usd; e.cost_basis = 'reservation'; }
    }
    this.doc.caps_usd = { per_provider: caps.perProvider / MICRO, total: caps.total / MICRO };
  }
  save() { mkdirSync(dirname(this.path), { recursive: true }); const t = this.path + '.tmp'; writeFileSync(t, JSON.stringify(this.doc, null, 2) + '\n'); renameSync(t, this.path); }
  sums(provider) {
    let spent = 0, reserved = 0;
    for (const e of this.doc.entries) {
      if (provider && e.provider !== provider) continue;
      if (e.status === 'refused') continue;
      if (e.status === 'reserved') reserved += toMicro(e.reserved_usd); else spent += toMicro(e.cost_usd);
    }
    return { spent, reserved };
  }
  check(provider, worst) {
    const p = this.sums(provider), t = this.sums();
    if (p.spent + p.reserved + worst > this.caps.perProvider) return { ok: false, cap: 'per_provider', reason: `${provider}: spent ${usd(p.spent)} + reserved ${usd(p.reserved)} + worst case ${usd(worst)} > per-provider cap ${usd(this.caps.perProvider)}` };
    if (t.spent + t.reserved + worst > this.caps.total) return { ok: false, cap: 'total', reason: `total: spent ${usd(t.spent)} + reserved ${usd(t.reserved)} + worst case ${usd(worst)} > total cap ${usd(this.caps.total)}` };
    return { ok: true };
  }
  add(e) { this.doc.entries.push(e); this.save(); return e; }
  reserve(e) {
    const entry = this.add({ ...e, status: 'reserved' });
    this.onReserve?.(this, entry);
    return entry;
  }
  settle(e, fields) { Object.assign(e, fields, { settled_at: new Date().toISOString() }); this.save(); }
}

// ───────────────────────────── providers
// Each real adapter is split into build (the request), parse (a 2xx response) and classifyError (a non-2xx response),
// so the self-test can check every field offline. httpCall joins them with fetch; it is never reached in a dry run or
// the self-test, where fetch is replaced by a function that throws.
//
// anthropic and openai were compared field by field with E-PROVIDER-FACTS.md §6a, §6b and §6c (read 16 Nov 2026 from
// the official API reference; tables in DRY-RUN-RESULT.md). `verified` is true only when every field the adapter
// depends on rests on a grade-A fact; `unverified_fields` lists what does not.
// There is no google adapter: Google is ineligible (prices.json gives the §20(d) reason) and its adapter, written
// without documentation, was removed.
class HttpError extends Error {
  constructor(status, body, extra = {}) { super(`HTTP ${status}${extra.cls?.code ? ' ' + extra.cls.code : ''}`); this.status = status; this.body = body; Object.assign(this, extra); }
}
const tryJson = (t) => { try { return JSON.parse(t); } catch { return null; } };
// only the headers §6 names, so nothing else from a response is copied into the ledger
function pickHeaders(headers, names) {
  const h = new Headers(headers ?? {}); const o = {};
  for (const n of names) { const v = h.get(n); if (v !== null) o[n] = v; }
  return Object.keys(o).length ? o : null;
}
const ANTHROPIC_RL = ['retry-after', ...['requests', 'tokens', 'input-tokens', 'output-tokens'].flatMap((k) => ['limit', 'remaining', 'reset'].map((x) => `anthropic-ratelimit-${k}-${x}`))];
const OPENAI_RL = ['retry-after', ...['limit', 'remaining', 'reset'].flatMap((x) => ['requests', 'tokens', 'project-tokens'].map((k) => `x-ratelimit-${x}-${k}`))];
// The schema as sent. item-schema.json (frozen) carries three root annotation keywords, $schema, title and description,
// whose acceptance neither provider documents (§6c, B). They have no validating effect, so they are left out of the
// copy sent. Every keyword that remains (type, properties, items, required, additionalProperties: false, string enum)
// is documented as supported by both (§6c, A). kit.mjs validate still checks every response in full.
const SCHEMA_ANNOTATIONS = ['$schema', 'title', 'description'];
function wireSchema(schemaText) {
  const s = JSON.parse(schemaText);
  for (const k of SCHEMA_ANNOTATIONS) delete s[k];
  return s;
}
const OPENAI_SPEND_CODES = ['organization_spend_limit_exceeded', 'project_spend_limit_exceeded', 'organization_usage_limit_exceeded'];

async function httpCall(adapter, args, fetchImpl = globalThis.fetch) {
  const q = adapter.build(args);
  const r = await fetchImpl(q.url, { method: q.method, headers: q.headers, body: JSON.stringify(q.body), signal: AbortSignal.timeout(CALL_TIMEOUT_MS) });
  const bodyText = await r.text();
  if (!r.ok) { const cls = adapter.classifyError({ status: r.status, headers: r.headers, bodyText }); throw new HttpError(r.status, bodyText, { cls, request_id: cls.request_id, rate_limit: cls.rate_limit }); }
  return parseOrThrow(adapter, { status: r.status, headers: r.headers, bodyText, maxOutput: args.maxOutput });
}
// a 2xx whose body cannot be parsed is an "unparsable 2xx": retried like a transport error, but it counts towards the
// no-usable-response stop (Sharon N4: three such attempts on one request stop the provider)
function parseOrThrow(adapter, resp) {
  try { return adapter.parse(resp); } catch (x) {
    const h = new Headers(resp.headers ?? {});
    const e = new Error(`unparsable ${resp.status} response: ${String(x.message).slice(0, 80)}`); e.unparsable = true;
    e.request_id = h.get('request-id') ?? h.get('x-request-id'); throw e;
  }
}


// ───────────────────────────── streaming (v2: Sharon T-1 and S-1 to S-5; Ruling 50)
// Anthropic advises streaming for a large max_tokens and for long requests (errors page, read 17 Nov 2026, grade A).
// The event flow (streaming page, read 17 Nov 2026): message_start (its usage carries the input count), content blocks
// (content_block_start, content_block_delta, content_block_stop), one or more message_delta (the stop reason and the
// cumulative usage), then message_stop. ping events may come anywhere; errors arrive as an `error` event; new event
// types may be added and are to be handled gracefully.
//   S-1  only a completed stream is a response: message_stop after a message_delta with a known stop reason and a
//        final output count. Anything else is stream_incomplete: never assembled into a file, never validated or
//        judged, and its full reservation is kept as its cost.
//   S-2  only text_delta in text blocks is kept. Thinking and its signature are counted, never stored.
//   S-3  a bounded, line-exact parser (below).
const STREAM_MAX_BYTES = 32 * 1024 * 1024;   // a 48,000-token answer with thinking is a few MB of events
const STREAM_IDLE_MS = 300_000;              // 5 min with no byte at all aborts the call (pings come far more often)
const ANTHROPIC_STOP_REASONS = ['end_turn', 'max_tokens', 'stop_sequence', 'tool_use', 'pause_turn', 'refusal', 'model_context_window_exceeded'];
class StreamIncomplete extends Error {
  constructor(reason, msg, evidence = null) { super(`stream incomplete (${reason}): ${msg}`); this.reason = reason; this.evidence = evidence; }
}
class StreamError extends Error {
  constructor(error, evidence = null) {
    const type = typeof error?.type === 'string' ? error.type : null;
    super(`stream error event: ${type ?? 'unknown type'}${error?.message ? ' ' + String(error.message).slice(0, 80) : ''}`);
    // fail-closed, as for HTTP errors: only the documented retryable types (500 api_error, 504 timeout_error,
    // 529 overloaded_error) are retried; every other error event stops the provider
    const retry = ['overloaded_error', 'api_error', 'timeout_error'].includes(type);
    this.cls = { status: 'stream_error', type, code: null, retry, stop: !retry, noResponse: true };
    this.evidence = evidence;
  }
}
// Server-sent events, as the HTML standard defines them: lines end in CRLF, LF or CR; a blank line dispatches the event;
// "data" lines are joined with a newline; lines starting with ":" are comments; id and retry are ignored; an event with
// no data is not dispatched; an event the stream does not end with a blank line is discarded.
export class SseParser {
  constructor({ maxBytes = STREAM_MAX_BYTES } = {}) {
    this.maxBytes = maxBytes; this.bytes = 0; this.buf = ''; this.event = ''; this.data = [];
    this.decoder = new TextDecoder('utf-8', { fatal: true });
  }
  push(chunk) {
    this.bytes += chunk.byteLength;
    if (this.bytes > this.maxBytes) throw new StreamIncomplete('byte_cap', `more than ${this.maxBytes} bytes`);
    try { this.buf += this.decoder.decode(chunk, { stream: true }); } catch { throw new StreamIncomplete('bad_utf8', 'the stream is not UTF-8'); }
    return this.drain(false);
  }
  end() {
    try { this.buf += this.decoder.decode(); } catch { throw new StreamIncomplete('bad_utf8', 'the stream is not UTF-8'); }
    const out = this.drain(true);
    this.event = ''; this.data = [];   // an unterminated event is discarded
    return out;
  }
  drain(final) {
    const out = [];
    for (;;) {
      const i = this.buf.search(/[\r\n]/);
      if (i < 0) break;
      if (this.buf[i] === '\r' && i === this.buf.length - 1 && !final) break;   // maybe the first half of a CRLF
      const n = this.buf[i] === '\r' && this.buf[i + 1] === '\n' ? 2 : 1;
      const line = this.buf.slice(0, i); this.buf = this.buf.slice(i + n);
      this.line(line, out);
    }
    if (final && this.buf.length) { this.line(this.buf, out); this.buf = ''; }
    return out;
  }
  line(l, out) {
    if (l === '') {
      if (this.data.length) out.push({ event: this.event || 'message', data: this.data.join('\n') });
      this.event = ''; this.data = []; return;
    }
    if (l.startsWith(':')) return;
    const c = l.indexOf(':');
    const field = c < 0 ? l : l.slice(0, c);
    let v = c < 0 ? '' : l.slice(c + 1); if (v.startsWith(' ')) v = v.slice(1);
    if (field === 'event') this.event = v; else if (field === 'data') this.data.push(v);
  }
}
// Assembles one Messages stream. feed() takes parsed events in order; finish() returns the response or throws.
export function anthropicAssembler() {
  const st = { events: 0, unknown: 0, pings: 0, thinking: 0, started: false, stopped: false, model: null, start_usage: null, final_usage: null, stop_reason: null, blocks: new Map() };
  const textNow = () => [...st.blocks.entries()].sort((x, y) => x[0] - y[0]).filter(([, b]) => b.type === 'text').map(([, b]) => b.text.join('')).join('');
  const evidence = () => { const t = textNow(); return { events: st.events, pings: st.pings, unknown_events: st.unknown, thinking_blocks: st.thinking, blocks: st.blocks.size,
    started: st.started, stopped: st.stopped, stop_reason: st.stop_reason, final_usage_seen: !!st.final_usage, text_chars: t.length, text_sha256: sha(t) }; };
  const fail = (reason, msg) => { const x = new StreamIncomplete(reason, msg, evidence()); x.partial = textNow(); return x; };
  const block = (j) => { const b = st.blocks.get(j.index); if (!b || !b.open) throw fail('bad_order', `${j.type} for block ${j.index}, which is not open`); return b; };
  return {
    evidence, partial: textNow,
    feed({ event, data }) {
      st.events++;
      if (st.stopped) throw fail('after_stop', `event "${event}" after message_stop`);
      let j; try { j = JSON.parse(data); } catch { throw fail('bad_json', `event "${event}": its data is not JSON`); }
      const type = j?.type;
      if (typeof type !== 'string' || (event !== 'message' && event !== type)) throw fail('bad_event', `event "${event}" carries data of type ${JSON.stringify(type)}`);
      if (type === 'ping') { st.pings++; return; }
      if (type === 'error') { const x = new StreamError(j.error, evidence()); x.partial = textNow(); throw x; }
      if (type === 'message_start') {
        if (st.started) throw fail('bad_order', 'a second message_start');
        st.started = true; st.model = j.message?.model ?? null; st.start_usage = j.message?.usage ?? null; return;
      }
      const known = ['content_block_start', 'content_block_delta', 'content_block_stop', 'message_delta', 'message_stop'];
      if (!known.includes(type)) { st.unknown++; return; }   // an unknown event type: ignored and counted
      if (!st.started) throw fail('bad_order', `${type} before message_start`);
      if (type === 'content_block_start') {
        if (!Number.isInteger(j.index) || st.blocks.has(j.index)) throw fail('bad_order', `content_block_start for block ${j.index}`);
        const t = j.content_block?.type ?? null;
        st.blocks.set(j.index, { type: t, open: true, text: t === 'text' && typeof j.content_block.text === 'string' ? [j.content_block.text] : [] });
        if (t === 'thinking' || t === 'redacted_thinking') st.thinking++;
        return;
      }
      if (type === 'content_block_delta') {
        const b = block(j);
        if (j.delta?.type === 'text_delta') {
          if (b.type !== 'text' || typeof j.delta.text !== 'string') throw fail('bad_delta', `a text_delta in a block of type ${b.type}`);
          b.text.push(j.delta.text);
        }
        return;   // thinking_delta, signature_delta and any other delta: not kept (S-2)
      }
      if (type === 'content_block_stop') { block(j).open = false; return; }
      if (type === 'message_delta') {
        if (typeof j.delta?.stop_reason === 'string') st.stop_reason = j.delta.stop_reason;
        if (j.usage && typeof j.usage === 'object') {
          // usage in message_delta is cumulative: a count that goes down is not trustworthy
          const prev = st.final_usage ?? {};
          for (const [k, v] of Object.entries(j.usage)) if (Number.isFinite(prev[k]) && Number.isFinite(v) && v < prev[k]) throw fail('bad_usage', `${k} went down from ${prev[k]} to ${v}`);
          st.final_usage = { ...prev, ...j.usage };
        }
        return;
      }
      st.stopped = true;   // message_stop
    },
    finish() {
      if (!st.started) throw fail('no_start', 'no message_start');
      if (!st.stopped) throw fail('no_stop', 'the stream ended before message_stop');
      if ([...st.blocks.values()].some((b) => b.open)) throw fail('open_block', 'a content block was never stopped');
      if (!ANTHROPIC_STOP_REASONS.includes(st.stop_reason)) throw fail('stop_reason', `stop reason ${JSON.stringify(st.stop_reason)} is not a known one`);
      const f = st.final_usage ?? {}, s0 = st.start_usage ?? {};
      if (!Number.isFinite(f.output_tokens)) throw fail('no_usage', 'no final output count in message_delta');
      // every count used for cost must be a non-negative whole number, and the final output count at least the start's
      for (const u of [s0, f]) for (const k of ['input_tokens', 'output_tokens', 'cache_creation_input_tokens', 'cache_read_input_tokens'])
        if (u[k] !== undefined && u[k] !== null && !(Number.isInteger(u[k]) && u[k] >= 0)) throw fail('bad_usage', `${k} ${JSON.stringify(u[k])} is not a whole number of tokens`);
      if (Number.isInteger(s0.output_tokens) && f.output_tokens < s0.output_tokens) throw fail('bad_usage', `final output count ${f.output_tokens} is below message_start's ${s0.output_tokens}`);
      const pick = (k) => (Number.isFinite(f[k]) ? f[k] : Number.isFinite(s0[k]) ? s0[k] : null);
      const input = pick('input_tokens');
      if (input === null) throw fail('no_usage', 'no input count');
      const usage_raw = { ...s0, ...f };
      return { raw: textNow(), stop_reason: st.stop_reason, model: st.model,
        usage: { input: input + (pick('cache_creation_input_tokens') ?? 0) + (pick('cache_read_input_tokens') ?? 0), output: f.output_tokens }, usage_raw, evidence: evidence() };
    },
  };
}
// The streaming transport. Before the stream starts, an HTTP error is read and classified exactly as before. Once it
// has started, any failure (a dropped connection, the idle limit, the 25-minute call limit, a bad event) is
// stream_incomplete, and an `error` event is stream_error; both carry the request id and the stream evidence.
async function streamCall(adapter, args, fetchImpl = globalThis.fetch, opt = {}) {
  const q = adapter.build(args);
  const idleMs = opt.idleMs ?? STREAM_IDLE_MS;
  const idle = new AbortController(); let timer = null, idleFired = false;
  const arm = () => { clearTimeout(timer); timer = setTimeout(() => { idleFired = true; idle.abort(new Error('idle limit')); }, idleMs); };
  const signal = AbortSignal.any([idle.signal, AbortSignal.timeout(opt.totalMs ?? CALL_TIMEOUT_MS)]);
  arm();
  try {
    const r = await fetchImpl(q.url, { method: q.method, headers: q.headers, body: JSON.stringify(q.body), signal });
    const h = new Headers(r.headers ?? {}); const requestId = h.get('request-id');
    if (!r.ok) {
      const bodyText = await r.text(); const cls = adapter.classifyError({ status: r.status, headers: r.headers, bodyText });
      throw new HttpError(r.status, bodyText, { cls, request_id: cls.request_id, rate_limit: cls.rate_limit });
    }
    if (!/^text\/event-stream\b/i.test(h.get('content-type') ?? '') || !r.body) {
      try { await r.body?.cancel(); } catch { /* nothing to cancel */ }
      const e = new Error(`unparsable ${r.status} response: not an event stream (${String(h.get('content-type')).slice(0, 40)})`); e.unparsable = true; e.request_id = requestId; throw e;
    }
    const parser = new SseParser({ maxBytes: opt.maxBytes ?? STREAM_MAX_BYTES }); const asm = adapter.assembler(); let bytes = 0;
    const reader = r.body.getReader();
    const tag = (x) => { x.request_id = requestId; if (x.evidence) x.evidence.bytes = bytes; return x; };
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        arm(); bytes += value.byteLength;
        for (const ev of parser.push(value)) asm.feed(ev);
      }
      for (const ev of parser.end()) asm.feed(ev);
    } catch (x) {
      try { await reader.cancel(); } catch { /* already closed */ }
      if (x instanceof StreamIncomplete || x instanceof StreamError) throw tag(x);
      const y = new StreamIncomplete(idleFired ? 'idle' : signal.aborted ? 'call_limit' : 'cut', String(x?.message ?? x).slice(0, 120), asm.evidence()); y.partial = asm.partial();
      throw tag(y);
    }
    let out; try { out = asm.finish(); } catch (x) { throw tag(x); }
    out.evidence.bytes = bytes;
    return { raw: out.raw, request_id: requestId, model_version: out.model, finish: { stop_reason: out.stop_reason },
      usage: out.usage, usage_raw: out.usage_raw, rate_limit: pickHeaders(h, ANTHROPIC_RL), stream: out.evidence };
  } finally { clearTimeout(timer); }
}

const ADAPTERS = {
  anthropic: {
    // Success path (request, response text, usage, request id): all grade A (§6a, §6c). Error handling is accepted
    // under the fail-closed rule (classifyError below); one error field rests on that rule instead of a grade-A fact.
    verified: true,
    unverified_fields: [],
    fail_closed_fields: ['credit exhaustion: not documented; fail-closed (any 402, or a message starting "Your credit balance is too low", is a billing stop; every other undocumented error stops the provider too)'],
    endpoint: 'https://api.anthropic.com/v1/messages', api_version: '2026-10-21',
    streaming: true,   // v2: every call streams (streamCall, anthropicAssembler)
    assembler: anthropicAssembler,
    build({ model, text, schema, maxOutput, key }) {
      return { url: this.endpoint, method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${key}`, 'anthropic-version': this.api_version },
        body: { model, max_tokens: maxOutput, messages: [{ role: 'user', content: text }],
          output_config: { format: { type: 'json_schema', schema: wireSchema(schema) } }, stream: true } };
    },
    // parse: the non-streamed message (kept for the §6 checks of its fields; a live call streams)
    parse({ headers, bodyText }) {
      const h = new Headers(headers ?? {}); const j = JSON.parse(bodyText); const u = j.usage;
      const ok = u && Number.isFinite(u.input_tokens) && Number.isFinite(u.output_tokens);
      // §6c: the JSON arrives as a string in content[] blocks of type "text"; other block types are skipped
      return { raw: (j.content ?? []).filter((c) => c.type === 'text').map((c) => c.text).join(''),
        request_id: h.get('request-id'), model_version: j.model ?? null,
        // §6c: "refusal" and "max_tokens" are 200s whose output may not match the schema; kit.mjs validate decides
        finish: { stop_reason: j.stop_reason ?? null },
        // §6a/§6c: input_tokens excludes the cache tokens, so total input = input_tokens + cache_creation_input_tokens +
        // cache_read_input_tokens; output_tokens is "the inclusive, authoritative total used for billing" (incl. thinking)
        usage: ok ? { input: u.input_tokens + (u.cache_creation_input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0), output: u.output_tokens } : null,
        usage_raw: u ?? null, rate_limit: pickHeaders(h, ANTHROPIC_RL) };
    },
    classifyError({ status, headers, bodyText }) {
      const h = new Headers(headers ?? {}); const j = tryJson(bodyText); const e = j?.error ?? {};
      const code = e.details?.error_code ?? null; const msg = String(e.message ?? '');
      const base = { http: status, type: e.type ?? null, code, request_id: h.get('request-id') ?? j?.request_id ?? null, rate_limit: pickHeaders(h, ANTHROPIC_RL) };
      // Fail-closed rule (coordinator's ruling, 16 Nov): only the documented retryable errors are retried, i.e. a 429 that is
      // not a tier spend cap and carries retry-after or a rate-limit code (§6a), and 500 api_error, 504 timeout_error,
      // 529 overloaded_error. EVERY other non-2xx response, whatever its status, type or body, stops all further calls
      // to this provider and is not retried; with no usage, its reservation is kept as its cost.
      const retryable = (status === 429 && code !== 'enforced_spend_limit_reached' && (h.get('retry-after') !== null || code === 'ramp_limit_exceeded'))
        || [500, 504, 529].includes(status);
      if (retryable) return { ...base, status: status === 429 ? 'http_429' : 'http_5xx', retry: true, stop: false };
      let st = status >= 500 ? 'http_5xx' : 'http_4xx';
      if (status === 429) st = 'spend_stop';      // enforced_spend_limit_reached (A), or a 429 that is not a documented rate limit
      if (status === 400 && /^You have reached your specified (workspace )?API usage limits/.test(msg)) st = 'spend_stop';
      // credit exhaustion: status and type not documented; the message is (§6a, 312dab55). 402 billing_error too.
      if (status === 402 || /^Your credit balance is too low/.test(msg)) st = 'billing_stop';
      return { ...base, status: st, retry: false, stop: true };
    },
    async call(args) { return streamCall(this, args); },
  },
  openai: {
    // Every relied-on field is grade A (§6b, §6c). Content-Type: A as documented in every reference example (whether it
    // is required is B, but it is always sent). Output usage: whether output_tokens includes reasoning_tokens is B, so
    // the adapter does not rely on it: it settles on a bound that holds either way (below).
    verified: true,
    unverified_fields: [],
    endpoint: 'https://api.openai.com/v1/responses', api_version: 'v1',
    build({ model, text, schema, maxOutput, key, clientRequestId }) {
      const headers = { 'content-type': 'application/json', authorization: `Bearer ${key}` };
      // §6b: logged by OpenAI for lookup if a response is lost; ASCII, at most 512 characters (otherwise a 400)
      if (clientRequestId) { if (!/^[\x20-\x7e]{1,512}$/.test(clientRequestId)) throw new Fatal('X-Client-Request-Id must be ASCII, ≤512 chars'); headers['x-client-request-id'] = clientRequestId; }
      return { url: this.endpoint, method: 'POST', headers,
        body: { model, input: text, max_output_tokens: maxOutput, store: false,
          text: { format: { type: 'json_schema', name: 'c3_items', schema: wireSchema(schema), strict: true } } } };
    },
    parse({ headers, bodyText, maxOutput }) {
      const h = new Headers(headers ?? {}); const j = JSON.parse(bodyText); const u = j.usage;
      const ok = u && Number.isFinite(u.input_tokens) && Number.isFinite(u.output_tokens);
      // §6c: input_tokens INCLUDES cached and cache-write tokens (A), so it is the total input; the cache discount is not
      // taken (conservative). Whether output_tokens includes reasoning_tokens is B ("breakdown"), so output settles on a
      // bound that holds either way: output + reasoning, never above max_output_tokens, which includes reasoning (§6b, A).
      // The raw usage is kept.
      let usage = null;
      if (ok) {
        const r = u.output_tokens_details?.reasoning_tokens ?? 0;
        const outBound = Number.isFinite(maxOutput) ? Math.max(u.output_tokens, Math.min(maxOutput, u.output_tokens + r)) : u.output_tokens + r;
        usage = { input: u.input_tokens, output: outBound };
      }
      // §6c: select output[] items by type "message" (not position), then aggregate their "output_text" parts; output_text
      // at the top level is SDK-only. A "refusal" part carries no JSON; it is recorded, and kit.mjs validate decides.
      const parts = (j.output ?? []).filter((o) => o.type === 'message').flatMap((o) => o.content ?? []);
      const raw = parts.filter((c) => c.type === 'output_text').map((c) => c.text).join('');
      const refusal = parts.filter((c) => c.type === 'refusal').map((c) => c.refusal).join('') || null;
      return { raw, request_id: h.get('x-request-id'), model_version: j.model ?? null, finish: { status: j.status ?? null, refusal },
        usage, usage_raw: u ?? null, rate_limit: pickHeaders(h, OPENAI_RL) };
    },
    classifyError({ status, headers, bodyText }) {
      const h = new Headers(headers ?? {}); const j = tryJson(bodyText); const e = j?.error ?? {};
      const code = e.code ?? null;
      const base = { http: status, type: e.type ?? null, code, request_id: h.get('x-request-id'), rate_limit: pickHeaders(h, OPENAI_RL) };
      // Fail-closed rule: only the documented retryable errors are retried, i.e. a 429 rate limit ("Rate limit reached for
      // requests", rate_limit_error / slow_down, or Retry-After present) that is not a spend, usage or credit stop (§6b),
      // and 500 and 503. EVERY other non-2xx response stops all further calls to this provider and is not retried.
      // §6b: "Retrying billing, spend, or quota errors won't restore API access."
      const stopCode = code === 'credit_balance_exhausted' || OPENAI_SPEND_CODES.includes(code) || e.type === 'insufficient_quota';
      const rateLimit = h.get('retry-after') !== null || code === 'slow_down' || e.type === 'rate_limit_error' || /^Rate limit reached/.test(String(e.message ?? ''));
      const retryable = (status === 429 && !stopCode && rateLimit) || [500, 503].includes(status);
      if (retryable) return { ...base, status: status === 429 ? 'http_429' : 'http_5xx', retry: true, stop: false };
      let st = status >= 500 ? 'http_5xx' : 'http_4xx';
      if (status === 429) st = code === 'credit_balance_exhausted' ? 'billing_stop' : 'spend_stop';
      return { ...base, status: st, retry: false, stop: true };
    },
    async call(args) { return httpCall(this, args); },
  },
};

// The offline mock: schema-valid JSON unless a fault is planned for (provider, chapter, attempt).
// Faults: malformed | transport | no_usage | overrun, and the canned HTTP errors in CANNED (429 | 500 | 400 |
// spend_stop | unknown_4xx | unknown_5xx | 402_unknown), each classified by the provider's real classifyError
function mockProvider(faults = {}) {
  const used = [];
  const m = manifest();
  const items = (b, provider, attempt) => {
    const ch = m.chapters[`bab${b}`];
    return Array.from({ length: PER_CHAPTER }, (_, i) => {
      const key = LABELS[i % 4];
      return {
        stem: `Soal tiruan ${i + 1} (uji kering, bab ${b}, percobaan ${attempt}); bukan soal sungguhan.`,
        options: LABELS.map((l) => ({ label: l, body: `Pilihan tiruan ${l}-${i + 1}` })),
        key,
        distractors: LABELS.filter((l) => l !== key).map((l, j) => ({ label: l, misconception_code: ch.misconceptions[(i + j) % ch.misconceptions.length], misconception: 'Miskonsepsi tiruan untuk uji kering.' })),
        objective_code: ch.objectives[i % ch.objectives.length],
        key_rationale: 'Alasan tiruan dalam satu baris.',
      };
    });
  };
  const streams = [];
  return {
    used, streams, endpoint: 'mock://offline', api_version: 'mock-1', verified: true,
    async call(args) {
      const { provider, model, b, attempt, text, schema, maxOutput, seq } = args;
      const f = faults[`${provider}:bab${b}:${attempt}`];
      if (f) used.push(`${provider}:bab${b}:${attempt}:${f}`);
      if (f === 'transport') { const e = new Error('mock transport error: connection reset'); e.transport = true; throw e; }
      if (provider === 'anthropic') return mockAnthropicStream(args, f, items(b, provider, attempt), streams);
      if (f === 'unparsable') parseOrThrow(ADAPTERS[provider], { status: 200, headers: {}, bodyText: '<html>truncated (mock)', maxOutput });
      // every HTTP fault is a canned response, classified by the provider's real classifyError
      if (CANNED[f]) { const c = CANNED[f][provider]; const cls = ADAPTERS[provider].classifyError(c); throw new HttpError(c.status, c.bodyText, { cls, request_id: cls.request_id, rate_limit: cls.rate_limit }); }
      let raw = JSON.stringify({ items: items(b, provider, attempt) });
      if (f === 'malformed') raw = '```json\n' + raw.slice(0, raw.length - 40) + '\n```';
      const out = Math.ceil(raw.length / 4);
      if (out > maxOutput) throw new Error(`mock: output ${out} would exceed the cap ${maxOutput}`);
      let usage = { input: Math.ceil((text.length + schema.length) / 4), output: out };
      if (f === 'no_usage') usage = null;
      if (f === 'overrun') usage = { input: 40 * usage.input, output: maxOutput };
      return { raw, usage, request_id: `mock-${provider}-${seq}`, model_version: `${model}@mock` };
    },
  };
}

// v2 streaming test infrastructure (Sharon S-3, S-4). THINK_CANARY marks every thinking delta the mock sends: it must
// never appear in any file the run writes (S-2).
const THINK_CANARY = 'THINKING-CANARY-7f3a';
const enc = (x) => new TextEncoder().encode(x);
const sseOf = (evs, nl = '\n') => evs.map(([ev, d]) => `event: ${ev}${nl}data: ${typeof d === 'string' ? d : JSON.stringify(d)}${nl}${nl}`).join('');
// A local function in fetch's place that answers with a streamed body: in chunks of `chunk` bytes, `delayMs` apart;
// failAfter: the connection fails after that many bytes; stallAfter: the body stops sending (until the call aborts).
function fakeStream(bytes, { chunk = bytes.length || 1, delayMs = 0, failAfter = null, stallAfter = null, status = 200,
  headers = { 'content-type': 'text/event-stream; charset=utf-8', 'request-id': 'req_stream' } } = {}) {
  const seen = [];
  const f = async (url, init) => {
    seen.push({ url, init });
    let off = 0;
    const body = new ReadableStream({
      async pull(c) {
        if (stallAfter !== null && off >= stallAfter) {
          await new Promise((r) => { const t = setTimeout(r, 10_000); init?.signal?.addEventListener('abort', () => { clearTimeout(t); r(); }); });
          c.error(init?.signal?.reason ?? new Error('mock: stalled')); return;
        }
        if (failAfter !== null && off >= failAfter) { c.error(new Error('mock: connection reset mid-stream')); return; }
        if (off >= bytes.length) { c.close(); return; }
        if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
        let n = Math.min(chunk, bytes.length - off);
        if (failAfter !== null) n = Math.min(n, failAfter - off);
        if (stallAfter !== null) n = Math.min(n, stallAfter - off);
        c.enqueue(bytes.slice(off, off + n)); off += n;
      },
    });
    return new Response(body, { status, headers });
  };
  f.seen = seen; return f;
}
const filesUnder = (d) => readdirSync(d, { recursive: true, withFileTypes: true }).filter((x) => x.isFile()).map((x) => join(x.parentPath ?? x.path, x.name));
const noThinkingIn = (d) => filesUnder(d).every((f) => !readFileSync(f, 'utf8').includes(THINK_CANARY));

// v2: the mock's anthropic answers go through the real streaming adapter, parser and assembler (S-4). Each stream is
// shaped as the documented one: message_start, a thinking block (marked with THINK_CANARY) with its signature, a ping,
// the text in 64-character text_delta pieces, message_delta with the final usage, message_stop.
// Faults: stream_cut | stream_error | stream_error_fatal | stream_slow | stream_unknown_event | no_usage | overrun |
// malformed | unparsable | the canned HTTP errors (answered as HTTP errors before the stream starts).
async function mockAnthropicStream(args, f, itemList, streams) {
  const { model, text, schema, maxOutput, seq } = args;
  const A = ADAPTERS.anthropic;
  const fetchLog = (inner) => async (url, init) => { streams.push({ url, stream: JSON.parse(init.body).stream === true }); return inner(url, init); };
  const ids = { 'content-type': 'text/event-stream; charset=utf-8', 'request-id': `mock-anthropic-${seq}` };
  if (CANNED[f]) { const c = CANNED[f].anthropic; return streamCall(A, args, fetchLog(fakeStream(enc(c.bodyText), { status: c.status, headers: { 'content-type': 'application/json', ...c.headers } }))); }
  if (f === 'unparsable') return streamCall(A, args, fetchLog(fakeStream(enc('<html>truncated (mock)'), { headers: { 'content-type': 'text/html', 'request-id': ids['request-id'] } })));
  let raw = JSON.stringify({ items: itemList });
  if (f === 'malformed') raw = '```json\n' + raw.slice(0, raw.length - 40) + '\n```';
  const thinkingTokens = 300;
  let out = Math.ceil(raw.length / 4) + thinkingTokens;
  if (out > maxOutput) throw new Error(`mock: output ${out} would exceed the cap ${maxOutput}`);
  let input = Math.ceil((text.length + schema.length) / 4);
  if (f === 'overrun') { input *= 40; out = maxOutput; }
  const ev = [['message_start', { type: 'message_start', message: { id: `msg_mock_${seq}`, type: 'message', role: 'assistant', content: [], model: `${model}@mock`, stop_reason: null, stop_sequence: null,
    usage: { input_tokens: input, output_tokens: 1 } } }],
    ['content_block_start', { type: 'content_block_start', index: 0, content_block: { type: 'thinking', thinking: '', signature: '' } }],
    ...[1, 2, 3].map((k) => ['content_block_delta', { type: 'content_block_delta', index: 0, delta: { type: 'thinking_delta', thinking: `${THINK_CANARY} langkah ${k} (tiruan)` } }]),
    ['content_block_delta', { type: 'content_block_delta', index: 0, delta: { type: 'signature_delta', signature: 'c2lnbmF0dXJlLXRpcnVhbg==' } }],
    ['content_block_stop', { type: 'content_block_stop', index: 0 }],
    ['ping', { type: 'ping' }],
    ['content_block_start', { type: 'content_block_start', index: 1, content_block: { type: 'text', text: '' } }]];
  const pieces = raw.match(/[\s\S]{1,64}/g) ?? [];
  pieces.forEach((t, k) => {
    ev.push(['content_block_delta', { type: 'content_block_delta', index: 1, delta: { type: 'text_delta', text: t } }]);
    if (f === 'stream_unknown_event' && k === Math.floor(pieces.length / 2)) ev.push(['content_block_hint', { type: 'content_block_hint', index: 1 }]);
  });
  ev.push(['content_block_stop', { type: 'content_block_stop', index: 1 }],
    ['message_delta', { type: 'message_delta', delta: { stop_reason: 'end_turn', stop_sequence: null }, ...(f === 'no_usage' ? {} : { usage: { input_tokens: input, output_tokens: out } }) }],
    ['message_stop', { type: 'message_stop' }]);
  const half = 9 + Math.floor(pieces.length / 2);
  let evs = ev, opts = { headers: ids };
  if (f === 'stream_cut') evs = ev.slice(0, half);   // the server stops sending: no message_delta, no message_stop
  if (f === 'stream_error' || f === 'stream_error_fatal') evs = [...ev.slice(0, half), ['error', { type: 'error', error: { type: f === 'stream_error' ? 'overloaded_error' : 'invalid_request_error', message: 'mock' } }]];
  if (f === 'stream_slow') opts = { headers: ids, chunk: 31, delayMs: 1 };
  return streamCall(A, args, fetchLog(fakeStream(enc(sseOf(evs, f === 'stream_slow' ? '\r\n' : '\n')), opts)), { idleMs: 5000 });
}

// canned HTTP errors: the documented ones shaped as E-PROVIDER-FACTS.md §6 shows them, and three undocumented ones
const anthErr = (status, error, h = {}) => ({ status, headers: { 'request-id': 'req_mock', ...h }, bodyText: JSON.stringify({ type: 'error', error, request_id: 'req_mock' }) });
const oaiErr = (status, error, h = {}) => ({ status, headers: { 'x-request-id': 'req_mock', ...h }, bodyText: JSON.stringify({ error }) });
const CANNED = {
  '429': { anthropic: anthErr(429, { type: 'rate_limit_error', message: 'rate limited (mock)' }, { 'retry-after': '1' }), openai: oaiErr(429, { message: 'Rate limit reached for requests (mock)' }) },
  '500': { anthropic: anthErr(500, { type: 'api_error', message: 'server error (mock)' }), openai: oaiErr(500, { type: 'server_error', message: 'The server had an error while processing your request' }) },
  '400': { anthropic: anthErr(400, { type: 'invalid_request_error', message: 'bad request (mock)' }), openai: oaiErr(400, { type: 'invalid_request_error', message: 'bad request (mock)' }) },
  spend_stop: { anthropic: anthErr(429, { type: 'rate_limit_error', message: 'spend limit (mock)', details: { error_code: 'enforced_spend_limit_reached' } }),
    openai: oaiErr(429, { type: 'insufficient_quota', code: 'organization_spend_limit_exceeded', message: 'spend limit (mock)' }) },
  unknown_4xx: { anthropic: anthErr(418, { type: 'mystery_error', message: 'unknown (mock)' }), openai: oaiErr(418, { type: 'mystery_error', code: 'mystery', message: 'unknown (mock)' }) },
  unknown_5xx: { anthropic: anthErr(502, { type: 'mystery_error', message: 'unknown (mock)' }), openai: oaiErr(502, { type: 'mystery_error', message: 'unknown (mock)' }) },
  '402_unknown': { anthropic: anthErr(402, { type: 'mystery_error', message: 'unknown (mock)' }), openai: oaiErr(402, { type: 'mystery_error', code: 'mystery', message: 'unknown (mock)' }) },
};

// ───────────────────────────── the run
function classify(err) {
  if (err instanceof StreamError) return err.cls;
  if (err instanceof StreamIncomplete) return { status: 'stream_incomplete', retry: true, stop: false, noResponse: true, reason: err.reason };
  if (err instanceof HttpError && err.cls) return err.cls;     // a verified-against-§6 adapter classified it by status and code
  // an HTTP error no adapter classified: fail closed (never reached by the two adapters or the mock)
  if (err instanceof HttpError) return { status: err.status >= 500 ? 'http_5xx' : 'http_4xx', retry: false, stop: true, http: err.status };
  // no usable response: retried (at most 2 retries); three on one request stop the provider (runEval)
  if (err?.unparsable) return { status: 'unparsable_2xx', retry: true, noResponse: true };
  return { status: 'transport_error', retry: true, noResponse: true };
}

export async function runEval(cfg) {
  const { mode, outDir, providers, prices, caps, maxOutput, adapterFor, onReserve, keys = {}, log = console.log } = cfg;
  const packSha = cfg.packSha ?? null;
  if (packSha !== null && !PACK_SHA_RE.test(packSha)) throw new Fatal('pack SHA must be 40 lowercase hex characters');
  if (mode === 'live' && packSha === null) throw new Fatal('a real run needs the frozen decision pack\'s commit SHA (--pack-sha)');
  const runId = `${mode}-${new Date().toISOString().replace(/[:.]/g, '-')}`;
  const ledger = new Ledger(join(outDir, 'ledger.json'), caps, { fresh: mode === 'dry-run', onReserve });
  const run = { run_id: runId, mode, pack_sha: packSha, started_at: new Date().toISOString(), providers, max_output_tokens: maxOutput, concurrency: CONCURRENCY, max_attempts: MAX_ATTEMPTS };
  ledger.doc.runs.push(run); ledger.save();
  const m = manifest(); const schema = schemaText();
  const req = Object.fromEntries(CHAPTERS.map((b) => [b, kitRequest(b)]));
  let abort = null, inFlight = 0, maxInFlight = 0;
  const items = {};      // `${provider}:bab${b}` → { valid, attempts, judged_attempt }
  const usageCalls = Object.fromEntries(providers.map((p) => [p, []]));
  const modelVersion = {};
  const stopped = {};    // provider → the spend or billing stop that ended its calls

  outer: for (const provider of providers) {
    const adapter = adapterFor(provider); const price = prices[provider];
    const pdir = join(outDir, provider); mkdirSync(join(pdir, 'attempts'), { recursive: true });
    for (const b of CHAPTERS) {
      const id = `${provider}:bab${b}`;
      if (stopped[provider]) { items[id] = { valid: false, attempts: 0, outcome: 'not_attempted', reason: `provider stopped: ${stopped[provider]}` }; continue; }
      if (mode !== 'dry-run' && ledger.doc.entries.some((e) => e.provider === provider && e.chapter === b && e.status === 'ok')) { items[id] = { valid: true, skipped: 'already valid in the ledger' }; continue; }
      const it = items[id] = { valid: false, attempts: 0, outcome: null };
      let noResponse = 0;   // attempts of this request that ended as a transport error or an unparsable 2xx
      const text = req[b];
      const chars = text.length + schema.length;   // the schema is sent (or listed) with the request: counted as input
      const bytes = Buffer.byteLength(text, 'utf8') + Buffer.byteLength(schema, 'utf8');
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        const wc = worstCase(bytes, maxOutput, price);
        const seq = ledger.doc.entries.filter((e) => e.provider === provider && e.status !== 'refused').length + 1;
        const base = { run_id: runId, pack_sha: packSha, provider, model: price.model, chapter: b, request_index: seq, attempt, input_chars: chars, input_bytes: bytes,
          input_tokens_estimate: wc.input_estimate, input_tokens_bound: wc.input_bound, max_output_tokens: maxOutput,
          price_per_mtok: { input: price.input, output: price.output }, reserved_usd: usd(wc.micro), reserved_at: new Date().toISOString() };
        const chk = ledger.check(provider, wc.micro);
        if (!chk.ok) {
          ledger.add({ ...base, status: 'refused', cap: chk.cap, reason: chk.reason, cost_usd: usd(0) });
          abort = { kind: 'refused', cap: chk.cap, reason: chk.reason }; log(`REFUSED  ${chk.reason}`); break outer;
        }
        const e = ledger.reserve(base);
        it.attempts = attempt;
        inFlight++; maxInFlight = Math.max(maxInFlight, inFlight);
        if (inFlight > CONCURRENCY) throw new Fatal(`in-flight bound broken: ${inFlight}`);
        let res = null, err = null;
        const t0 = Date.now();
        const clientRequestId = `${runId}.${provider}.bab${b}.a${attempt}`;
        try { res = await adapter.call({ provider, model: price.model, b, attempt, text, schema, maxOutput, seq, key: keys[provider], clientRequestId }); } catch (x) { err = x; }
        inFlight--;
        const duration_ms = Date.now() - t0;
        const reportedUsage = !!res && !!res.usage && Number.isFinite(res.usage.input) && Number.isFinite(res.usage.output);
        const actual = reportedUsage ? costMicro(res.usage.input, res.usage.output, price) : wc.micro;
        const settle = { cost_usd: usd(actual), cost_basis: reportedUsage ? 'usage' : 'reservation',
          actual_input_tokens: reportedUsage ? res.usage.input : null, actual_output_tokens: reportedUsage ? res.usage.output : null,
          request_id: res?.request_id ?? err?.request_id ?? null, client_request_id: clientRequestId, model_version: res?.model_version ?? null,
          usage_raw: res?.usage_raw ?? null, finish: res?.finish ?? null, duration_ms, rate_limit: res?.rate_limit ?? err?.rate_limit ?? null,
          stream: res?.stream ?? err?.evidence ?? null };
        if (actual > wc.micro) {
          // v2: a paid response is always kept, as evidence, even when its cost overruns; the run still aborts.
          if (res && res.raw !== undefined && res.raw !== null) {
            writeFileSync(join(pdir, 'attempts', 'bab' + b + '.a' + attempt + '.json'), res.raw); settle.response_sha256 = sha(res.raw);
          }
          ledger.settle(e, { ...settle, status: 'overrun', reason: `reported cost ${usd(actual)} exceeds its reservation ${usd(wc.micro)}` });
          abort = { kind: 'overrun', reason: `${provider} bab${b} attempt ${attempt}: ${e.reason}` }; log(`ABORT    ${abort.reason}`); break outer;
        }
        if (err) {
          const c = classify(err);
          // owner, 17 Nov: an incomplete paid answer is preserved for incident investigation, in <provider>/incomplete/
          // (inside PRIVAT on the Mac). It is never an attempt file, never validated, and kit.mjs blind never reads it.
          if (typeof err.partial === 'string' && err.partial.length) {
            mkdirSync(join(pdir, 'incomplete'), { recursive: true });
            writeFileSync(join(pdir, 'incomplete', `bab${b}.a${attempt}.partial.txt`), err.partial);
            settle.partial_file = `${provider}/incomplete/bab${b}.a${attempt}.partial.txt`;
          }
          ledger.settle(e, { ...settle, status: c.status, http_status: c.http ?? (c.status === 'http_429' ? 429 : null), error_type: c.type ?? null, error_code: c.code ?? null, error: String(err.message).slice(0, 200), retryable: c.retry });
          log(`${c.status.padEnd(16)} ${provider} bab${b} attempt ${attempt}: ${err.message}${c.retry && attempt < MAX_ATTEMPTS ? ' → retry' : ''}${c.stop ? ' → no further call to ' + provider : ''}`);
          it.outcome = c.status;
          if (c.stop) { stopped[provider] = `${c.status} (HTTP ${c.http}${c.code ? ', ' + c.code : ''})`; break; }   // the next chapter sees stopped
          if (c.noResponse && ++noResponse === MAX_ATTEMPTS) {   // Sharon N4
            stopped[provider] = `no usable response in ${MAX_ATTEMPTS} attempts on bab${b} (transport errors or unparsable 2xx)`;
            log(`STOPPED  ${provider}: ${stopped[provider]} → no further call to ${provider}`); break;
          }
          if (!c.retry) break;
          continue;
        }
        if (res.model_version) modelVersion[provider] = res.model_version;
        const af = join(pdir, 'attempts', `bab${b}.a${attempt}.json`);
        writeFileSync(af, res.raw);
        const v = kitValidate(af, b);
        usageCalls[provider].push({ bab: b, attempt, request_id: res.request_id, model_version: res.model_version ?? null, input_tokens: reportedUsage ? res.usage.input : wc.input_bound,
          output_tokens: reportedUsage ? res.usage.output : maxOutput, usage_reported: reportedUsage, valid: v.valid });
        ledger.settle(e, { ...settle, status: v.valid ? 'ok' : 'invalid_output', response_sha256: sha(res.raw), valid_items: v.items.filter((x) => x.valid).length, problems: v.problems.slice(0, 5), retryable: !v.valid });
        log(`${(v.valid ? 'ok' : 'invalid_output').padEnd(16)} ${provider} bab${b} attempt ${attempt}: cost ${usd(actual)} (${reportedUsage ? 'usage' : 'no usage → reservation kept'})${!v.valid && attempt < MAX_ATTEMPTS ? ' → retry' : ''}`);
        // the judged file: the first valid attempt; with none valid, the last response received (measured invalid)
        if (v.valid || !it.valid) {
          writeFileSync(join(pdir, `bab${b}.json`), res.raw);
          writeFileSync(join(pdir, `bab${b}.provenance.json`), JSON.stringify({
            mode, run_id: runId, pack_sha: packSha, provider, model: price.model, model_version: res.model_version, model_date: price.model_date,
            request_id: res.request_id, attempt, prompt_version: m.prompt_version, prompt_sha256: m.prompt_sha256, schema_sha256: m.schema_sha256,
            schema_sent_sha256: sha(JSON.stringify(wireSchema(schema))), schema_sent_omits: SCHEMA_ANNOTATIONS,
            source: m.chapters[`bab${b}`].source, source_sha256: m.chapters[`bab${b}`].source_sha256,
            source_excerpt_sha256: m.chapters[`bab${b}`].material_sha256, request_sha256: m.chapters[`bab${b}`].request_sha256,
            response_sha256: sha(res.raw), schema_valid: v.valid, valid_items: v.items.filter((x) => x.valid).length,
            usage_reported: reportedUsage, cost_usd: usd(actual), cost_basis: settle.cost_basis,
          }, null, 2) + '\n');
        }
        it.outcome = v.valid ? 'ok' : 'invalid_output';
        if (v.valid) { it.valid = true; it.judged_attempt = attempt; break; }
      }
    }
  }

  // kit-format usage.json per provider (README: provenance per run)
  for (const p of providers) {
    if (!usageCalls[p].length) continue;
    const a = adapterFor(p); const pr = prices[p];
    writeFileSync(join(outDir, p, 'usage.json'), JSON.stringify({
      pack_sha: packSha, model: pr.model, model_version: modelVersion[p] ?? null, model_date: pr.model_date, endpoint: a.endpoint, api_version: a.api_version,
      run_at: run.started_at, run_by: process.env.C3_RUN_BY || 'runner.mjs', generation: { temperature: 'provider default', max_tokens: maxOutput, system_prompt: '' },
      data_retention: pr.data_retention ?? UNVERIFIED, price_per_mtok: { input: pr.input, output: pr.output }, mode, calls: usageCalls[p],
    }, null, 2) + '\n');
  }
  const per = {};
  for (const p of providers) {
    const es = ledger.doc.entries.filter((e) => e.provider === p && e.run_id === runId);
    const by = {}; for (const e of es) by[e.status] = (by[e.status] ?? 0) + 1;
    const s = ledger.sums(p);
    per[p] = { attempts: es.filter((e) => e.status !== 'refused').length, by_status: by, stopped: stopped[p] ?? null, spent_usd: usd(s.spent), open_reservations_usd: usd(s.reserved),
      requests_valid: CHAPTERS.filter((b) => items[`${p}:bab${b}`]?.valid).length, drafts_valid: PER_CHAPTER * CHAPTERS.filter((b) => items[`${p}:bab${b}`]?.valid).length };
  }
  const failed = Object.entries(items).filter(([, v]) => !v.valid).map(([k]) => k);
  const exitCode = abort ? (abort.kind === 'overrun' ? 3 : 2) : failed.length ? 4 : 0;
  const tot = ledger.sums();
  const summary = { run_id: runId, mode, pack_sha: packSha, finished_at: new Date().toISOString(), exit_code: exitCode, abort, failed_requests: failed,
    caps_usd: ledger.doc.caps_usd, total_spent_usd: usd(tot.spent), open_reservations_usd: usd(tot.reserved), max_in_flight: maxInFlight, per_provider: per, items };
  Object.assign(run, { finished_at: summary.finished_at, exit_code: exitCode, abort }); ledger.save();
  writeFileSync(join(outDir, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
  return { exitCode, summary, ledger: ledger.doc };
}

// ───────────────────────────── configuration and the real-run gate
function loadPrices() { return JSON.parse(readFileSync(join(HERE, 'prices.json'), 'utf8')); }
function capsFrom(table, args) {
  let perProvider = toMicro(table.caps_usd.per_provider), total = toMicro(table.caps_usd.total);
  if (perProvider > toMicro(8) || total > toMicro(25)) throw new Fatal('prices.json caps exceed the approved US$8 per provider / US$25 total');
  if (args['cap-provider'] !== undefined) perProvider = Math.min(perProvider, toMicro(args['cap-provider']));
  if (args['cap-total'] !== undefined) total = Math.min(total, toMicro(args['cap-total']));
  if (!(perProvider > 0 && total > 0)) throw new Fatal('caps must be positive numbers');
  return { perProvider, total };
}
// The frozen set (rulings 8 and b, 16 Nov): kit.mjs, score.mjs and report.mjs must match their SHA-256 in MANIFEST.json
export function frozenSetProblems(m = manifest()) {
  const out = [];
  for (const [k, file] of [['kit_sha256', 'kit.mjs'], ['score_sha256', 'score.mjs'], ['report_sha256', 'report.mjs']]) {
    if (!/^[0-9a-f]{64}$/.test(m[k] ?? '')) out.push(`frozen set: MANIFEST.json has no ${k} (node kit.mjs material)`);
    else if (sha(readFileSync(join(HERE, file))) !== m[k]) out.push(`frozen set: ${file} differs from its SHA-256 in MANIFEST.json (a new freeze is needed)`);
  }
  return out;
}
export function liveGate(table, providers, env = process.env, adapters = ADAPTERS) {
  const problems = frozenSetProblems();
  for (const p of providers) {
    const e = table.providers[p];
    if (!e) { problems.push(`${p}: not in prices.json`); continue; }
    if (e.excluded) { problems.push(`${p}: excluded: ${e.excluded}`); continue; }
    if (!adapters[p]) { problems.push(`${p}: no adapter`); continue; }
    for (const k of ['model', 'model_date', 'input', 'output']) if (e[k] === UNVERIFIED || e[k] === undefined || e[k] === null) problems.push(`${p}: ${k} is UNVERIFIED`);
    for (const k of ['input', 'output']) if (e[k] !== UNVERIFIED && !(typeof e[k] === 'number' && e[k] > 0)) problems.push(`${p}: ${k} price is not a positive number`);
    if (!e.source || !e.read_on) problems.push(`${p}: price source and read_on date not pinned`);
    else if (e.grade !== 'A') problems.push(`${p}: price is not grade A`);
    const a = adapters[p];
    if (!a?.verified) problems.push(`${p}: API adapter not verified against the official documentation${a?.unverified_fields?.length ? '; no grade-A fact for: ' + a.unverified_fields.map((f) => f.split(':')[0]).join(', ') : ''}`);
    if (!a?.streaming) problems.push(`${p}: no streaming transport: a long call is not safe without one (Sharon T-1); OpenAI is deferred by Ruling 50`);
    if (!env[e.key_env]) problems.push(`${p}: no key in ${e.key_env}`);
  }
  return problems;
}
// A real run needs BOTH the explicit --live flag and a passing gate. `adapters` is a test-only override.
export function realRunProblems(args, table, providers, env = process.env, adapters = ADAPTERS) {
  const problems = args.live ? [] : ['no --live flag: a real run starts only with node runner.mjs --live, and only when every check below passes'];
  const ps = args['pack-sha'];
  if (ps === undefined || ps === true) problems.push('no --pack-sha: a real run records the frozen decision pack\'s commit SHA (40 lowercase hex characters)');
  else if (!PACK_SHA_RE.test(String(ps))) problems.push(`--pack-sha ${JSON.stringify(String(ps)).slice(0, 60)} is not a 40-character lowercase hex commit SHA`);
  return problems.concat(liveGate(table, providers, env, adapters));
}
// The real run's entry point. Every check runs first; on any problem it returns the refusal and nothing else happens:
// no key is read into the call arguments, no request is built, no adapter or fetch is touched.
// `adapters` and `run` are test-only overrides (the self-test passes spies; main passes the real ones).
export async function liveRun({ args, table, providers, env = process.env, adapters = ADAPTERS, run = runEval, log = console.log }) {
  const problems = realRunProblems(args, table, providers, env, adapters);
  if (problems.length) return { refused: true, problems };
  const prices = Object.fromEntries(providers.map((p) => [p, table.providers[p]]));
  const keys = Object.fromEntries(providers.map((p) => [p, env[table.providers[p].key_env]]));
  const outDir = args.out ?? join(HERE, 'out');
  const r = await run({ mode: 'live', outDir, providers, prices, caps: capsFrom(table, args), maxOutput: args.maxOutput ?? DEFAULT_MAX_OUTPUT, keys, packSha: args['pack-sha'], adapterFor: (p) => adapters[p], log });
  return { refused: false, outDir, ...r };
}
const dryPrices = (table, providers) => Object.fromEntries(providers.map((p) => [p, { model: `${p}-mock-model`, model_date: 'dry-run', input: table.dry_run_assumed.input, output: table.dry_run_assumed.output, data_retention: 'none (offline mock)' }]));
// the pinned prices with the mock: still offline. Refuses while a price is not pinned.
function realDryPrices(table, providers) {
  return Object.fromEntries(providers.map((p) => {
    const e = table.providers[p];
    if (![e.input, e.output].every((x) => typeof x === 'number' && x > 0)) throw new Fatal(`${p}: price not pinned in prices.json; --real-prices needs it`);
    return [p, { model: `${p}-mock-model`, model_date: 'dry-run', input: e.input, output: e.output, surcharge: e.surcharge, data_retention: 'none (offline mock)' }];
  }));
}
const eligible = (table) => PROVIDERS.filter((p) => table.providers[p]?.enabled && !table.providers[p]?.excluded);

// ───────────────────────────── the worst-case plan (no call)
export function planTable(prices, providers, maxOutput) {
  const schema = schemaText(); const rows = []; let total = 0; const per = {};
  for (const p of providers) {
    per[p] = { one: 0, all: 0 };
    for (const b of CHAPTERS) {
      const chars = kitRequest(b).length + schema.length;
      const wc = worstCase(Buffer.byteLength(kitRequest(b), 'utf8') + Buffer.byteLength(schema, 'utf8'), maxOutput, prices[p]);
      rows.push({ provider: p, chapter: `bab${b}`, chars, ...wc });
      per[p].one += wc.micro; per[p].all += MAX_ATTEMPTS * wc.micro;
    }
    total += per[p].all;
  }
  return { rows, per, total, oneEach: Object.values(per).reduce((s, v) => s + v.one, 0) };
}
function printPlan(plan, prices, caps) {
  const p0 = Object.values(prices)[0];
  console.log(`Worst case per call: (ceil(bytes × 1.2) + 10000) × $${p0.input}/M + max_output × $${p0.output}/M`);
  console.log('| Provider | Chapter | Chars (request + schema) | Input estimate | Input bound (×1.2) | Max output | Worst case per call (USD) |');
  console.log('|---|---|---|---|---|---|---|');
  for (const r of plan.rows) console.log(`| ${r.provider} | ${r.chapter} | ${r.chars} | ${r.input_estimate} | ${r.input_bound} | ${r.max_output_tokens} | ${usd(r.micro)} |`);
  console.log('');
  console.log('| Provider | 1 attempt per request (2 calls) | All retries used (6 calls) | Per-provider cap |');
  console.log('|---|---|---|---|');
  for (const [p, v] of Object.entries(plan.per)) console.log(`| ${p} | ${usd(v.one)} | ${usd(v.all)} | ${usd(caps.perProvider)} |`);
  console.log(`| **total** | ${usd(plan.oneEach)} | ${usd(plan.total)} | total cap ${usd(caps.total)} |`);
}

// ───────────────────────────── self-test
const FAULTS_NORMAL = { 'anthropic:bab1:1': 'malformed', 'anthropic:bab2:1': '429', 'openai:bab1:1': 'transport', 'openai:bab2:1': 'no_usage' };
const FAULTS_EXTRA = { 'anthropic:bab1:1': '400', 'openai:bab1:1': '500', 'openai:bab1:2': '500', 'openai:bab1:3': '500', 'openai:bab2:1': 'overrun' };
const FAULTS_STOP = { 'anthropic:bab1:1': 'spend_stop', 'openai:bab2:1': 'spend_stop' };
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Offline checks of the two real adapters against E-PROVIDER-FACTS.md §6: the request each builds, a canned response
// shaped as §6 documents it, and every documented error. A dummy key placeholder only; global fetch stays blocked, and
// the wire check hands httpCall a local function in its place, which answers from memory.
async function adapterChecks(check, table) {
  const KEY = 'DUMMY-KEY-PLACEHOLDER'; const schema = schemaText(); const text = kitRequest(1);
  const args = (p) => ({ provider: p, model: table.providers[p].model, b: 1, attempt: 1, text, schema, maxOutput: DEFAULT_MAX_OUTPUT, key: KEY, clientRequestId: `live-2026-11-16T07-00-00-000Z.${p}.bab1.a1` });
  const wire = async (adapter, a, status, headers, bodyText) => {
    const seen = []; const fake = async (url, init) => { seen.push({ url, init }); return new Response(bodyText, { status, headers }); };
    let res = null, err = null; try { res = await httpCall(adapter, a, fake); } catch (x) { err = x; }
    return { seen, res, err };
  };
  const classes = (name, A, cases) => {
    for (const [label, c, status, retry] of cases) {
      const k = A.classifyError(c);
      check(k.status === status && k.retry === retry && k.stop === !retry, `${name} error: ${label} → ${status}, ${retry ? 'retried' : 'not retried, no further call to the provider'}`);
    }
  };

  // ── anthropic, §6a
  {
    const A = ADAPTERS.anthropic; const q = A.build(args('anthropic'));
    check(q.method === 'POST' && q.url === 'https://api.anthropic.com/v1/messages', 'anthropic request: POST https://api.anthropic.com/v1/messages');
    check(eq(q.headers, { 'content-type': 'application/json', authorization: `Bearer ${KEY}`, 'anthropic-version': '2026-10-21' }), 'anthropic request headers: content-type application/json, Authorization: Bearer <key>, anthropic-version 2026-10-21 (no legacy x-api-key)');
    const f = q.body.output_config?.format ?? {};
    check(eq(Object.keys(q.body).sort(), ['max_tokens', 'messages', 'model', 'output_config', 'stream']) && q.body.stream === true && q.body.model === 'claude-sonnet-5-5' && q.body.max_tokens === DEFAULT_MAX_OUTPUT
      && eq(q.body.messages, [{ role: 'user', content: text }]) && eq(Object.keys(f).sort(), ['schema', 'type']) && f.type === 'json_schema' && eq(f.schema, wireSchema(schema)),
      'anthropic request body: model claude-sonnet-5-5, max_tokens 12000, messages [user: the chapter request], output_config.format {type json_schema, schema: item-schema.json without its root annotations}, stream true (v2); no system prompt');
    const okH = { 'request-id': 'req_018Eselftest', 'anthropic-ratelimit-requests-remaining': '3999', 'anthropic-ratelimit-output-tokens-reset': '2026-11-16T07:00:30Z', 'x-unrelated': 'dropped' };
    const okB = JSON.stringify({ id: 'msg_selftest', type: 'message', role: 'assistant', model: 'claude-sonnet-5-5', content: [{ type: 'text', text: '{"items":[]}' }],
      usage: { input_tokens: 2400, output_tokens: 2500, cache_creation_input_tokens: 10, cache_read_input_tokens: 5 } });
    const r = A.parse({ status: 200, headers: okH, bodyText: okB });
    check(r.usage?.input === 2415 && r.usage?.output === 2500, 'anthropic response usage: input = input_tokens + cache_creation_input_tokens + cache_read_input_tokens (2415), output = output_tokens (2500)');
    check(r.request_id === 'req_018Eselftest', 'anthropic response: request id from the request-id header, not the message id');
    check(r.rate_limit?.['anthropic-ratelimit-requests-remaining'] === '3999' && r.rate_limit?.['anthropic-ratelimit-output-tokens-reset'] && !('x-unrelated' in r.rate_limit), 'anthropic response: the documented anthropic-ratelimit-* headers are kept, nothing else');
    check(r.raw === '{"items":[]}' && r.model_version === 'claude-sonnet-5-5', 'anthropic response: text and model extracted');
    const mixed = A.parse({ status: 200, headers: okH, bodyText: JSON.stringify({ model: 'claude-sonnet-5-5', stop_reason: 'max_tokens', content: [{ type: 'thinking', thinking: 'x' }, { citations: null, text: '{"items":', type: 'text' }, { type: 'text', text: '[]}' }], usage: { input_tokens: 1, output_tokens: 2 } }) });
    check(mixed.raw === '{"items":[]}' && mixed.finish.stop_reason === 'max_tokens', 'anthropic response (§6c): only content blocks of type "text" are joined, other block types skipped; stop_reason recorded');
    const w = await wire(A, args('anthropic'), 200, okH, okB);
    check(w.seen.length === 1 && w.seen[0].url === A.endpoint && w.seen[0].init.method === 'POST' && eq(w.seen[0].init.headers, q.headers) && eq(JSON.parse(w.seen[0].init.body), q.body) && w.res?.usage?.input === 2415,
      'anthropic wire path (local function, no network): httpCall sends exactly the built request and parses the response');
    const ae = (status, error, h = {}) => ({ status, headers: { 'request-id': 'req_err', ...h }, bodyText: JSON.stringify({ type: 'error', error, request_id: 'req_err_body' }) });
    classes('anthropic', A, [
      ['429 rate_limit_error with retry-after', ae(429, { type: 'rate_limit_error', message: 'rate limited' }, { 'retry-after': '7' }), 'http_429', true],
      ['429 rate_limit_error, error_code ramp_limit_exceeded', ae(429, { type: 'rate_limit_error', message: 'ramp', details: { error_code: 'ramp_limit_exceeded' } }), 'http_429', true],
      ['429 rate_limit_error, error_code enforced_spend_limit_reached, no retry-after (tier spend cap)', ae(429, { type: 'rate_limit_error', message: 'cap', details: { error_code: 'enforced_spend_limit_reached' } }), 'spend_stop', false],
      ['429 without retry-after or a rate-limit code (fails closed)', ae(429, { type: 'rate_limit_error', message: '?' }), 'spend_stop', false],
      ['400 "You have reached your specified API usage limits" (own spend limit)', ae(400, { type: 'invalid_request_error', message: 'You have reached your specified API usage limits. You will regain access on …' }), 'spend_stop', false],
      ['400 "…specified workspace API usage limits" (workspace limit)', ae(400, { type: 'invalid_request_error', message: 'You have reached your specified workspace API usage limits.' }), 'spend_stop', false],
      ['400 other invalid_request_error', ae(400, { type: 'invalid_request_error', message: 'messages: field required' }), 'http_4xx', false],
      ['402 billing_error (credit exhaustion, grade B)', ae(402, { type: 'billing_error', message: "There's an issue with your billing or payment information." }), 'billing_stop', false],
      ['500 api_error', ae(500, { type: 'api_error', message: 'internal' }), 'http_5xx', true],
      ['504 timeout_error', ae(504, { type: 'timeout_error', message: 'timeout' }), 'http_5xx', true],
      ['529 overloaded_error', ae(529, { type: 'overloaded_error', message: 'overloaded' }), 'http_5xx', true],
      ['502 (undocumented 5xx, fails closed)', ae(502, { type: 'api_error', message: 'bad gateway' }), 'http_5xx', false],
      ['unknown 4xx (418, unknown type)', ae(418, { type: 'mystery_error', message: '?' }), 'http_4xx', false],
      ['unknown 5xx (599, unknown type)', ae(599, { type: 'mystery_error', message: '?' }), 'http_5xx', false],
      ['402 with an unknown type', ae(402, { type: 'mystery_error', message: '?' }), 'billing_stop', false],
      ['400 "Your credit balance is too low…" (documented message, status not documented)', ae(400, { type: 'invalid_request_error', message: 'Your credit balance is too low to access the Anthropic API. Please go to Plans & Billing to upgrade or purchase credits.' }), 'billing_stop', false],
      ['429 enforced_spend_limit_reached even with retry-after', ae(429, { type: 'rate_limit_error', message: 'cap', details: { error_code: 'enforced_spend_limit_reached' } }, { 'retry-after': '5' }), 'spend_stop', false],
      ['500 with a non-JSON body', { status: 500, headers: {}, bodyText: '<html>oops</html>' }, 'http_5xx', true],
      ['403 with a non-JSON body', { status: 403, headers: {}, bodyText: '<html>forbidden</html>' }, 'http_4xx', false],
    ]);
    const noHdr = A.classifyError({ status: 500, headers: {}, bodyText: JSON.stringify({ type: 'error', error: { type: 'api_error', message: 'x' }, request_id: 'req_err_body' }) });
    const hdr = A.classifyError(ae(429, { type: 'rate_limit_error', message: 'x' }, { 'retry-after': '7' }));
    check(noHdr.request_id === 'req_err_body' && hdr.request_id === 'req_err' && hdr.rate_limit?.['retry-after'] === '7', 'anthropic error: request id from the header, else the error body\'s request_id; retry-after kept');
    const wu = await wire(A, args('anthropic'), 200, { 'request-id': 'req_bad' }, '<html>cut');
    check(wu.err?.unparsable === true && wu.err.request_id === 'req_bad' && classify(wu.err).status === 'unparsable_2xx' && classify(wu.err).retry === true,
      'anthropic wire path: a 200 with an unparsable body becomes unparsable_2xx (retried, counted towards the N4 stop), request id kept');
    const we = await wire(A, args('anthropic'), 429, { 'request-id': 'req_spend' }, JSON.stringify({ type: 'error', error: { type: 'rate_limit_error', message: 'cap', details: { error_code: 'enforced_spend_limit_reached' } }, request_id: 'req_spend' }));
    check(we.err instanceof HttpError && classify(we.err).status === 'spend_stop' && we.err.request_id === 'req_spend', 'anthropic wire path: a spend-stop response becomes a spend_stop error carrying its request id');
  }

  // ── openai, §6b
  {
    const A = ADAPTERS.openai; const q = A.build(args('openai'));
    check(q.method === 'POST' && q.url === 'https://api.openai.com/v1/responses', 'openai request: POST https://api.openai.com/v1/responses (Responses API)');
    check(eq(q.headers, { 'content-type': 'application/json', authorization: `Bearer ${KEY}`, 'x-client-request-id': args('openai').clientRequestId }), 'openai request headers: content-type application/json, Authorization: Bearer <key>, X-Client-Request-Id; no version header');
    const f = q.body.text?.format ?? {};
    check(eq(Object.keys(q.body).sort(), ['input', 'max_output_tokens', 'model', 'store', 'text']) && q.body.model === 'gpt-6.1-sol' && q.body.input === text && q.body.max_output_tokens === DEFAULT_MAX_OUTPUT && q.body.store === false
      && eq(f, { type: 'json_schema', name: 'c3_items', schema: wireSchema(schema), strict: true }),
      'openai request body: model gpt-6.1-sol, input (the chapter request), max_output_tokens 12000, store false, text.format {type json_schema, name, schema, strict true}; no instructions');
    let bad = null; try { A.build({ ...args('openai'), clientRequestId: 'naïve' }); } catch (x) { bad = x; }
    check(bad instanceof Fatal && args('openai').clientRequestId.length <= 512, 'openai request: X-Client-Request-Id is ASCII and at most 512 characters, or the request is not built');
    const okH = { 'x-request-id': 'req_selftest', 'x-ratelimit-remaining-requests': '4999', 'x-ratelimit-reset-tokens': '6ms', 'openai-version': '2020-10-01', 'x-unrelated': 'dropped' };
    const okB = JSON.stringify({ id: 'resp_selftest', object: 'response', model: 'gpt-6.1-sol', output: [{ type: 'reasoning', summary: [] }, { type: 'message', role: 'assistant', content: [{ type: 'output_text', text: '{"items":[]}' }] }],
      usage: { input_tokens: 2400, input_tokens_details: { cached_tokens: 0, cache_write_tokens: 0 }, output_tokens: 2600, output_tokens_details: { reasoning_tokens: 300 }, total_tokens: 5000 } });
    const r = A.parse({ status: 200, headers: okH, bodyText: okB, maxOutput: DEFAULT_MAX_OUTPUT });
    check(r.usage?.input === 2400 && r.usage?.output === 2900 && r.usage_raw?.output_tokens === 2600, 'openai response usage: input = input_tokens (2400); output settled at the upper bound output_tokens + reasoning_tokens (2900); raw usage kept');
    const cached = A.parse({ status: 200, headers: okH, bodyText: JSON.stringify({ output: [], usage: { input_tokens: 12000, input_tokens_details: { cached_tokens: 4000, cache_write_tokens: 7000 }, output_tokens: 10 } }), maxOutput: DEFAULT_MAX_OUTPUT });
    check(cached.usage.input === 12000, 'openai response usage (§6c): input_tokens already includes cached and cache-write tokens, so 12,000 is not added to (the §6c worked example)');
    const refused = A.parse({ status: 200, headers: okH, bodyText: JSON.stringify({ status: 'completed', output: [{ type: 'message', role: 'assistant', content: [{ type: 'refusal', refusal: 'no' }] }], usage: { input_tokens: 1, output_tokens: 1 } }), maxOutput: DEFAULT_MAX_OUTPUT });
    check(refused.raw === '' && refused.finish.refusal === 'no' && refused.finish.status === 'completed', 'openai response (§6c): a refusal part gives no text (kit.mjs validate then measures it invalid) and is recorded');
    const capped = A.parse({ status: 200, headers: okH, bodyText: JSON.stringify({ output: [], usage: { input_tokens: 10, output_tokens: 11900, output_tokens_details: { reasoning_tokens: 500 } } }), maxOutput: DEFAULT_MAX_OUTPUT });
    check(capped.usage.output === DEFAULT_MAX_OUTPUT, 'openai response usage: the output bound never exceeds max_output_tokens, which includes reasoning');
    check(r.request_id === 'req_selftest', 'openai response: request id from the x-request-id header, not the response id');
    check(r.rate_limit?.['x-ratelimit-remaining-requests'] === '4999' && r.rate_limit?.['x-ratelimit-reset-tokens'] === '6ms' && !('x-unrelated' in r.rate_limit) && !('openai-version' in r.rate_limit), 'openai response: the documented x-ratelimit-* headers are kept, nothing else');
    check(r.raw === '{"items":[]}' && r.model_version === 'gpt-6.1-sol', 'openai response: output_text and model extracted');
    const w = await wire(A, args('openai'), 200, okH, okB);
    check(w.seen.length === 1 && w.seen[0].url === A.endpoint && eq(w.seen[0].init.headers, q.headers) && eq(JSON.parse(w.seen[0].init.body), q.body) && w.res?.usage?.output === 2900,
      'openai wire path (local function, no network): httpCall sends exactly the built request and parses the response');
    const oe = (status, error, h = {}) => ({ status, headers: { 'x-request-id': 'req_err', ...h }, bodyText: JSON.stringify({ error }) });
    classes('openai', A, [
      ['429 "Rate limit reached for requests"', oe(429, { message: 'Rate limit reached for requests', type: 'requests' }, { 'retry-after': '1' }), 'http_429', true],
      ['429 rate_limit_error / slow_down', oe(429, { type: 'rate_limit_error', code: 'slow_down', message: 'increased too quickly' }), 'http_429', true],
      ['429 organization_spend_limit_exceeded', oe(429, { type: 'insufficient_quota', code: 'organization_spend_limit_exceeded', message: 'x' }), 'spend_stop', false],
      ['429 project_spend_limit_exceeded', oe(429, { type: 'insufficient_quota', code: 'project_spend_limit_exceeded', message: 'x' }), 'spend_stop', false],
      ['429 organization_usage_limit_exceeded (approved usage limit)', oe(429, { code: 'organization_usage_limit_exceeded', message: 'x' }), 'spend_stop', false],
      ['429 credit_balance_exhausted', oe(429, { type: 'insufficient_quota', code: 'credit_balance_exhausted', message: 'x' }), 'billing_stop', false],
      ['429 error.type insufficient_quota, other code', oe(429, { type: 'insufficient_quota', code: 'something_else', message: 'x' }), 'spend_stop', false],
      ['500 server error', oe(500, { type: 'server_error', message: 'The server had an error while processing your request' }), 'http_5xx', true],
      ['503 service_unavailable_error / server_is_overloaded', oe(503, { type: 'service_unavailable_error', code: 'server_is_overloaded', message: 'x' }), 'http_5xx', true],
      ['400 invalid request', oe(400, { type: 'invalid_request_error', message: 'x' }), 'http_4xx', false],
      ['502 (undocumented 5xx, fails closed)', oe(502, { type: 'server_error', message: 'bad gateway' }), 'http_5xx', false],
      ['unknown 4xx (418, unknown type)', oe(418, { type: 'mystery_error', code: 'mystery', message: '?' }), 'http_4xx', false],
      ['unknown 5xx (599, unknown type)', oe(599, { type: 'mystery_error', message: '?' }), 'http_5xx', false],
      ['402 with an unknown type', oe(402, { type: 'mystery_error', code: 'mystery', message: '?' }), 'http_4xx', false],
      ['429 with an unknown code and no rate-limit sign (fails closed)', oe(429, { type: 'mystery_error', code: 'mystery', message: '?' }), 'spend_stop', false],
      ['429 spend code even with Retry-After', oe(429, { type: 'insufficient_quota', code: 'project_spend_limit_exceeded', message: 'x' }, { 'retry-after': '1' }), 'spend_stop', false],
      ['403 with a non-JSON body', { status: 403, headers: {}, bodyText: 'forbidden' }, 'http_4xx', false],
    ]);
    check(A.classifyError(oe(429, { code: 'credit_balance_exhausted' })).request_id === 'req_err', 'openai error: request id from the x-request-id header');
  }
  // the fail-closed rule, exhaustively over statuses: every non-2xx is either a documented retryable error, or it is
  // not retried and stops the provider. Bodies: documented rate-limit shapes, unknown, empty and non-JSON.
  const RETRYABLE = { anthropic: (st, c) => (st === 429 && c.rl && !c.spend) || [500, 504, 529].includes(st), openai: (st, c) => (st === 429 && c.rl && !c.spend) || [500, 503].includes(st) };
  const bodies = {
    anthropic: [[{ rl: false }, (st) => anthErr(st, { type: 'mystery_error', message: '?' })], [{ rl: true }, (st) => anthErr(st, { type: 'rate_limit_error', message: 'x' }, { 'retry-after': '3' })],
      [{ rl: true }, (st) => anthErr(st, { type: 'rate_limit_error', message: 'x', details: { error_code: 'ramp_limit_exceeded' } })], [{ rl: true, spend: true }, (st) => anthErr(st, { type: 'rate_limit_error', message: 'x', details: { error_code: 'enforced_spend_limit_reached' } }, { 'retry-after': '3' })],
      [{ rl: false }, (st) => ({ status: st, headers: {}, bodyText: '' })], [{ rl: false }, (st) => ({ status: st, headers: {}, bodyText: 'not json' })]],
    openai: [[{ rl: false }, (st) => oaiErr(st, { type: 'mystery_error', code: 'mystery', message: '?' })], [{ rl: true }, (st) => oaiErr(st, { message: 'Rate limit reached for requests' })],
      [{ rl: true }, (st) => oaiErr(st, { type: 'rate_limit_error', code: 'slow_down', message: 'x' })], [{ rl: true, spend: true }, (st) => oaiErr(st, { type: 'insufficient_quota', code: 'credit_balance_exhausted', message: 'x' }, { 'retry-after': '3' })],
      [{ rl: false }, (st) => ({ status: st, headers: {}, bodyText: '' })], [{ rl: false }, (st) => ({ status: st, headers: {}, bodyText: 'not json' })]],
  };
  for (const name of ['anthropic', 'openai']) {
    let n = 0; const bad = [];
    for (let st = 300; st <= 599; st++) for (const [c, mk] of bodies[name]) {
      n++; const k = ADAPTERS[name].classifyError(mk(st)); const want = RETRYABLE[name](st, c);
      if (want ? !(k.retry === true && k.stop === false) : !(k.retry === false && k.stop === true)) bad.push(`${st}:${JSON.stringify(c)}→${k.status}`);
    }
    check(bad.length === 0, `${name} fail-closed rule, every status 300–599 × ${bodies[name].length} body shapes (${n} cases): only documented retryable errors are retried; all others stop the provider${bad.length ? ' — ' + bad.slice(0, 5).join(', ') : ''}`);
  }
  // item-schema.json against the §6c schema rules of both providers, as sent
  const orig = JSON.parse(schema); const sent = wireSchema(schema); const kw = new Set(); const objs = []; const enums = []; const nestedAnno = [];
  const walk = (n, root) => {
    for (const k of Object.keys(n)) kw.add(k);
    if (!root) for (const k of SCHEMA_ANNOTATIONS) if (k in n) nestedAnno.push(k);
    if (n.type === 'object') objs.push(n);
    if (n.enum) enums.push(n.enum);
    for (const c of Object.values(n.properties ?? {})) walk(c, false);
    if (n.items) walk(n.items, false);
  };
  walk(orig, true); const origKw = new Set(kw); kw.clear(); objs.length = 0; enums.length = 0; walk(sent, true);
  const canon = (x) => (Array.isArray(x) ? x.map(canon) : x && typeof x === 'object' ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, canon(x[k])])) : x);
  check(eq(canon({ ...sent, ...Object.fromEntries(SCHEMA_ANNOTATIONS.filter((k) => k in orig).map((k) => [k, orig[k]])) }), canon(orig)) && nestedAnno.length === 0 && SCHEMA_ANNOTATIONS.every((k) => !(k in sent)) && [...origKw].filter((k) => !kw.has(k)).sort().join() === [...SCHEMA_ANNOTATIONS].sort().join(),
    'schema sent: item-schema.json minus only its root annotations ($schema, title, description), which do not validate; every validating keyword is unchanged');
  const ALLOWED = ['additionalProperties', 'enum', 'items', 'properties', 'required', 'type'];
  check([...kw].every((k) => ALLOWED.includes(k)), `schema sent uses only keywords both providers document as supported (§6c): ${[...kw].sort().join(', ')}`);
  check(sent.type === 'object' && !('anyOf' in sent) && objs.length === 4 && objs.every((o) => o.additionalProperties === false && eq([...o.required].sort(), Object.keys(o.properties).sort())),
    'schema sent: root is an object without anyOf; all 4 objects have additionalProperties false and every property required (0 optional parameters; Anthropic limit 24)');
  check(enums.length > 0 && enums.every((e) => e.every((x) => typeof x === 'string')) && !['minItems', 'maxItems', 'minLength', 'maxLength', 'minimum', 'maximum', 'pattern', 'format', 'allOf', 'anyOf', 'not', 'if', '$ref'].some((k) => kw.has(k)),
    'schema sent: string-only enums; no array, string or number constraints and no composition (counts stay with kit.mjs validate)');
  // the documented long-prompt surcharge (never reached by E)
  const op = table.providers.openai;
  check(costMicro(272000, 1000, op) === 272000 * 2 + 1000 * 10 && costMicro(272001, 1000, op) === Math.ceil(272001 * 4 + 1000 * 15), 'openai price: above 272K input tokens the full request costs 2× input and 1.5× output');
}


// v2 streaming checks (Sharon S-1 to S-4; Ruling 50). Offline: every "fetch" here is a local function answering from
// memory. DOC_STREAM is shaped as Anthropic's streaming page shows a response with thinking (read 17 Nov 2026).
const DOC_STREAM = [
  ['message_start', { type: 'message_start', message: { id: 'msg_doc', type: 'message', role: 'assistant', content: [], model: 'claude-sonnet-5-5', stop_reason: null, stop_sequence: null,
    usage: { input_tokens: 4993, output_tokens: 1, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 } } }],
  ['content_block_start', { type: 'content_block_start', index: 0, content_block: { type: 'thinking', thinking: '', signature: '' } }],
  ['content_block_delta', { type: 'content_block_delta', index: 0, delta: { type: 'thinking_delta', thinking: THINK_CANARY + ' langkah satu' } }],
  ['ping', { type: 'ping' }],
  ['content_block_delta', { type: 'content_block_delta', index: 0, delta: { type: 'thinking_delta', thinking: THINK_CANARY + ' langkah dua' } }],
  ['content_block_delta', { type: 'content_block_delta', index: 0, delta: { type: 'signature_delta', signature: 'EqQBCgIYAhIM1gbcDa9GJwZA2b3hGgxBdjrkzLoky3dl1pkiMOYds' } }],
  ['content_block_stop', { type: 'content_block_stop', index: 0 }],
  ['content_block_start', { type: 'content_block_start', index: 1, content_block: { type: 'text', text: '' } }],
  ['content_block_delta', { type: 'content_block_delta', index: 1, delta: { type: 'text_delta', text: '{"items":[{"stem":"Pola ½ — ' } }],
  ['content_block_delta', { type: 'content_block_delta', index: 1, delta: { type: 'text_delta', text: 'bilangan ganjil"}]}' } }],
  ['content_block_stop', { type: 'content_block_stop', index: 1 }],
  ['message_delta', { type: 'message_delta', delta: { stop_reason: 'end_turn', stop_sequence: null }, usage: { output_tokens: 7600 } }],
  ['message_stop', { type: 'message_stop' }],
];
const DOC_TEXT = '{"items":[{"stem":"Pola ½ — bilangan ganjil"}]}';
async function streamChecks(check) {
  const evNames = (evs) => evs.map((e) => e.event + '|' + e.data).join('\n');
  const parseAll = (bytes, size, opt) => { const p = new SseParser(opt); const out = []; for (let i = 0; i < bytes.length; i += size) out.push(...p.push(bytes.slice(i, i + size))); out.push(...p.end()); return out; };
  const assemble = (evs, nl) => { const p = new SseParser(); const a = anthropicAssembler(); for (const e of [...p.push(enc(sseOf(evs, nl))), ...p.end()]) a.feed(e); return a.finish(); };
  const throwsIncomplete = (fn) => { try { fn(); return null; } catch (x) { return x instanceof StreamIncomplete ? x : null; } };
  const cut = (i) => DOC_STREAM.filter((_, k) => k !== i);
  const swap = (i, ev) => DOC_STREAM.map((x, k) => (k === i ? ev : x));

  console.log('\n── streaming (v2, Sharon S-1 to S-4; offline)');
  // S-3: the parser
  const whole = enc(sseOf(DOC_STREAM));
  const one = parseAll(whole, whole.length);
  check(one.length === DOC_STREAM.length && one.every((e, i) => e.event === DOC_STREAM[i][0] && eq(JSON.parse(e.data), DOC_STREAM[i][1])), `S-3 parser: the documented sequence gives its ${DOC_STREAM.length} events, names and data intact`);
  let same = true; for (const size of [1, 2, 3, 7, 64]) same = same && evNames(parseAll(whole, size)) === evNames(one);
  check(same, 'S-3 parser: the same events whatever the chunk size (1, 2, 3, 7 and 64 bytes), including splits inside a line and inside a multi-byte character');
  check(evNames(parseAll(enc(sseOf(DOC_STREAM, '\r\n')), 5)) === evNames(one) && evNames(parseAll(enc(sseOf(DOC_STREAM, '\r')), 5)) === evNames(one),
    'S-3 parser: CRLF and CR line endings give the same events, also when a CRLF is split across chunks');
  const ml = parseAll(enc(': keep-alive comment\nid: 7\nretry: 100\nevent: ping\ndata: {"type":\ndata: "ping"}\n\nevent: lonely\n\ndata: {"type":"ping"}\n\n'), 4);
  check(ml.length === 2 && ml[0].event === 'ping' && ml[0].data === '{"type":\n"ping"}' && eq(JSON.parse(ml[0].data), { type: 'ping' }) && ml[1].event === 'message',
    'S-3 parser: multi-line data is joined with a newline; comment, id and retry lines are ignored; an event with no data is not dispatched; no event name means "message"');
  const tail = parseAll(enc('event: ping\ndata: {"type":"ping"}\n\nevent: message_stop\ndata: {"type":"message_stop"}'), 3);
  check(tail.length === 1, 'S-3 parser: an event not ended by a blank line before the stream ends is discarded, never dispatched');
  check(throwsIncomplete(() => parseAll(enc('x'.repeat(201)), 50, { maxBytes: 200 }))?.reason === 'byte_cap', 'S-3 parser: a stream larger than its byte cap is refused (reason byte_cap)');
  check(STREAM_MAX_BYTES >= 8 * 1024 * 1024 && STREAM_MAX_BYTES <= 64 * 1024 * 1024, `S-3 parser: the byte cap (${STREAM_MAX_BYTES} bytes) is far above a 48,000-token answer and still bounded`);
  check(throwsIncomplete(() => parseAll(Uint8Array.from([0x64, 0x61, 0x74, 0x61, 0x3a, 0x20, 0xff, 0xfe, 0x0a, 0x0a]), 3))?.reason === 'bad_utf8', 'S-3 parser: bytes that are not UTF-8 are refused (reason bad_utf8)');

  // S-1, S-2: the assembled answer
  const ok = assemble(DOC_STREAM);
  check(ok.raw === DOC_TEXT && ok.stop_reason === 'end_turn' && ok.model === 'claude-sonnet-5-5' && eq(ok.usage, { input: 4993, output: 7600 }),
    'S-1 assembler: a completed stream gives the text, the stop reason, the model, input from message_start and output from the final message_delta');
  check(!JSON.stringify(ok).includes(THINK_CANARY) && !JSON.stringify(ok).includes('EqQBCgIYAhIM') && ok.evidence.thinking_blocks === 1,
    'S-2 assembler: thinking and its signature are counted, never kept: nothing of them is in the result');
  check(assemble(DOC_STREAM, '\r\n').raw === DOC_TEXT, 'S-1 assembler: the same text over CRLF');
  const du = assemble(swap(11, ['message_delta', { type: 'message_delta', delta: { stop_reason: 'max_tokens', stop_sequence: null }, usage: { input_tokens: 5000, output_tokens: 48000, cache_read_input_tokens: 10, cache_creation_input_tokens: 2 } }]));
  check(eq(du.usage, { input: 5012, output: 48000 }) && du.stop_reason === 'max_tokens', 'S-1 assembler: final usage in message_delta wins (cumulative), cache tokens added to input; max_tokens is a completed stream (kit.mjs validate then measures it)');
  const unk = assemble([...DOC_STREAM.slice(0, 9), ['content_block_hint', { type: 'content_block_hint', index: 1 }], ...DOC_STREAM.slice(9)]);
  check(unk.raw === DOC_TEXT && unk.evidence.unknown_events === 1, 'S-3 assembler: an unknown event type mid-stream is ignored and counted ("handle unknown event types gracefully")');
  const twoText = assemble([...DOC_STREAM.slice(0, 10), ['content_block_start', { type: 'content_block_start', index: 2, content_block: { type: 'text', text: '' } }],
    ['content_block_delta', { type: 'content_block_delta', index: 2, delta: { type: 'text_delta', text: ' ' } }], ['content_block_stop', { type: 'content_block_stop', index: 2 }], ...DOC_STREAM.slice(10)]);
  check(twoText.raw === DOC_TEXT + ' ', 'S-1 assembler: several text blocks are joined in index order');
  const INCOMPLETE = [
    ['no message_stop (the stream just ends)', DOC_STREAM.slice(0, 12)],
    ['an unknown final event in place of message_stop', swap(12, ['message_end', { type: 'message_end' }])],
    ['no stop reason', swap(11, ['message_delta', { type: 'message_delta', delta: { stop_reason: null }, usage: { output_tokens: 7600 } }])],
    ['an unknown stop reason', swap(11, ['message_delta', { type: 'message_delta', delta: { stop_reason: 'mystery_reason' }, usage: { output_tokens: 7600 } }])],
    ['no usage in message_delta (message_start\'s output count is never used)', swap(11, ['message_delta', { type: 'message_delta', delta: { stop_reason: 'end_turn' } }])],
    ['usage without output_tokens', swap(11, ['message_delta', { type: 'message_delta', delta: { stop_reason: 'end_turn' }, usage: { input_tokens: 4993 } }])],
    ['a negative output count', swap(11, ['message_delta', { type: 'message_delta', delta: { stop_reason: 'end_turn' }, usage: { output_tokens: -5 } }])],
    ['a fractional output count', swap(11, ['message_delta', { type: 'message_delta', delta: { stop_reason: 'end_turn' }, usage: { output_tokens: 7600.5 } }])],
    ['an output count sent as a string', swap(11, ['message_delta', { type: 'message_delta', delta: { stop_reason: 'end_turn' }, usage: { output_tokens: '7600' } }])],
    ['a final output count below message_start\'s', swap(11, ['message_delta', { type: 'message_delta', delta: { stop_reason: 'end_turn' }, usage: { output_tokens: 0 } }])],
    ['a negative input count', swap(11, ['message_delta', { type: 'message_delta', delta: { stop_reason: 'end_turn' }, usage: { input_tokens: -1, output_tokens: 7600 } }])],
    ['a negative cache count', swap(11, ['message_delta', { type: 'message_delta', delta: { stop_reason: 'end_turn' }, usage: { output_tokens: 7600, cache_read_input_tokens: -3 } }])],
    ['a cumulative output count that goes down between message_delta events', [...DOC_STREAM.slice(0, 11), ['message_delta', { type: 'message_delta', delta: { stop_reason: null }, usage: { output_tokens: 8000 } }], DOC_STREAM[11], DOC_STREAM[12]]],
    ['an event after message_stop', [...DOC_STREAM, ['ping', { type: 'ping' }]]],
    ['a delta before message_start', DOC_STREAM.slice(1)],
    ['two message_start events', [DOC_STREAM[0], ...DOC_STREAM]],
    ['a text_delta inside a thinking block', swap(4, ['content_block_delta', { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'x' } }])],
    ['a delta for a block never started', swap(8, ['content_block_delta', { type: 'content_block_delta', index: 5, delta: { type: 'text_delta', text: 'x' } }])],
    ['a text block never stopped', cut(10)],
    ['data that is not JSON', swap(3, ['ping', '{not json'])],
    ['an event name that disagrees with its data type', swap(3, ['ping', { type: 'message_stop' }])],
    ['an empty stream', []],
  ];
  for (const [label, evs] of INCOMPLETE) check(throwsIncomplete(() => assemble(evs)) !== null, `S-1 assembler: refused, not a response: ${label}`);
  // error events
  const errEv = (type) => [...DOC_STREAM.slice(0, 9), ['error', { type: 'error', error: { type, message: 'mock' } }]];
  const errOf = (type) => { try { assemble(errEv(type)); return null; } catch (x) { return x instanceof StreamError ? x : null; } };
  for (const t of ['overloaded_error', 'api_error', 'timeout_error']) {
    const x = errOf(t); check(x && classify(x).status === 'stream_error' && classify(x).retry === true && classify(x).stop === false && classify(x).noResponse === true && classify(x).type === t,
      `S-1 a mid-stream ${t} event: stream_error, retried, counted towards the no-usable-response stop`);
  }
  for (const t of ['invalid_request_error', 'rate_limit_error', 'billing_error', 'mystery_error']) {
    const x = errOf(t); check(x && classify(x).status === 'stream_error' && classify(x).retry === false && classify(x).stop === true, `S-1 a mid-stream ${t} event: stream_error, not retried, no further call to the provider (fail-closed)`);
  }
  const inc = throwsIncomplete(() => assemble(DOC_STREAM.slice(0, 9)));
  check(inc && classify(inc).status === 'stream_incomplete' && classify(inc).retry === true && classify(inc).noResponse === true, 'S-1 a cut stream is stream_incomplete: retried, counted towards the no-usable-response stop');
  check(inc && inc.evidence.text_chars > 0 && /^[0-9a-f]{64}$/.test(inc.evidence.text_sha256) && !JSON.stringify(inc.evidence).includes(THINK_CANARY) && !('text' in inc.evidence),
    'S-1/S-2 a cut stream\'s ledger evidence holds event counts, bytes, and the length and SHA-256 of the partial text, never the text or any thinking');
  check(inc && inc.partial === '{"items":[{"stem":"Pola ½ — ' && sha(inc.partial) === inc.evidence.text_sha256 && !inc.partial.includes(THINK_CANARY),
    'owner: a cut stream carries its partial answer text (text blocks only, no thinking) for the runner to preserve, matching its SHA-256');

  // the transport: streamCall with local functions in fetch's place
  const A = ADAPTERS.anthropic; const table = loadPrices();
  const args = { provider: 'anthropic', model: table.providers.anthropic.model, b: 1, attempt: 1, text: kitRequest(1), schema: schemaText(), maxOutput: 48000, key: 'DUMMY-KEY-PLACEHOLDER', clientRequestId: 'x' };
  const run = async (f, opt) => { try { return { res: await streamCall(A, args, f, opt) }; } catch (err) { return { err }; } };
  const okH = { 'content-type': 'text/event-stream; charset=utf-8', 'request-id': 'req_stream', 'anthropic-ratelimit-requests-remaining': '49', 'x-unrelated': 'dropped' };
  const f1 = fakeStream(whole, { headers: okH }); const r1 = await run(f1);
  const sent = f1.seen[0] && JSON.parse(f1.seen[0].init.body);
  check(f1.seen.length === 1 && f1.seen[0].url === A.endpoint && sent?.stream === true && sent.max_tokens === 48000 && eq(f1.seen[0].init.headers, A.build(args).headers),
    'transport: one POST to the Messages endpoint with stream true, max_tokens 48000 and the same headers as before');
  check(r1.res?.raw === DOC_TEXT && r1.res.request_id === 'req_stream' && eq(r1.res.usage, { input: 4993, output: 7600 }) && r1.res.finish?.stop_reason === 'end_turn'
    && r1.res.model_version === 'claude-sonnet-5-5' && r1.res.rate_limit?.['anthropic-ratelimit-requests-remaining'] === '49' && !('x-unrelated' in (r1.res.rate_limit ?? {})) && r1.res.stream?.events === DOC_STREAM.length,
    'transport: the result has the same fields as before (text, request id, usage, stop reason, model version, rate-limit headers) plus the stream evidence');
  check(!JSON.stringify(r1.res ?? {}).includes(THINK_CANARY), 'S-2 transport: no thinking in the result');
  const t0 = Date.now(); const r2 = await run(fakeStream(enc(sseOf(DOC_STREAM, '\r\n')), { chunk: 5, delayMs: 1, headers: okH }));
  check(r2.res?.raw === DOC_TEXT && eq(r2.res.usage, { input: 4993, output: 7600 }), `S-4 transport: a slow stream (5-byte chunks, CRLF) completes with the same result (${Date.now() - t0} ms)`);
  const r3 = await run(fakeStream(whole, { headers: okH, failAfter: enc(sseOf(DOC_STREAM.slice(0, 9))).length + 10 }));
  check(r3.err instanceof StreamIncomplete && r3.err.reason === 'cut' && r3.err.request_id === 'req_stream' && classify(r3.err).status === 'stream_incomplete' && r3.err.evidence.text_chars > 0,
    'S-4 transport: a connection that fails mid-stream is stream_incomplete (reason cut), request id and evidence kept');
  const r3b = await run(fakeStream(enc(sseOf(DOC_STREAM.slice(0, 10))), { headers: okH }));
  check(r3b.err instanceof StreamIncomplete && classify(r3b.err).status === 'stream_incomplete', 'S-4 transport: a stream that closes cleanly but early (no usage, no stop) is stream_incomplete');
  const t1 = Date.now(); const r4 = await run(fakeStream(whole, { headers: okH, stallAfter: 300 }), { idleMs: 80 });
  check(r4.err instanceof StreamIncomplete && r4.err.reason === 'idle' && Date.now() - t1 < 5000, `transport: a stream that goes silent is aborted after the idle limit (reason idle, ${Date.now() - t1} ms)`);
  check(STREAM_IDLE_MS >= 60_000 && STREAM_IDLE_MS <= CALL_TIMEOUT_MS, `transport: the idle limit (${STREAM_IDLE_MS / 1000} s) is well above the ping interval and below the 25-minute call limit`);
  const r5 = await run(fakeStream(enc(JSON.stringify({ type: 'error', error: { type: 'overloaded_error', message: 'Overloaded' }, request_id: 'req_529' })), { status: 529, headers: { 'content-type': 'application/json', 'request-id': 'req_529' } }));
  check(r5.err instanceof HttpError && classify(r5.err).status === 'http_5xx' && classify(r5.err).retry === true && r5.err.request_id === 'req_529', 'transport: an HTTP error before the stream starts is classified exactly as before (529 overloaded_error: retried)');
  const r6 = await run(fakeStream(enc(JSON.stringify({ type: 'error', error: { type: 'rate_limit_error', message: 'cap', details: { error_code: 'enforced_spend_limit_reached' } } })), { status: 429, headers: { 'content-type': 'application/json', 'request-id': 'req_cap' } }));
  check(r6.err instanceof HttpError && classify(r6.err).status === 'spend_stop', 'transport: a spend stop before the stream starts is still a spend_stop');
  const r7 = await run(fakeStream(enc('{"id":"msg"}'), { headers: { 'content-type': 'application/json', 'request-id': 'req_json' } }));
  check(r7.err?.unparsable === true && classify(r7.err).status === 'unparsable_2xx' && r7.err.request_id === 'req_json', 'transport: a 2xx that is not an event stream is unparsable_2xx (retried, counted towards the no-usable-response stop)');
  const r8 = await run(async () => { throw new TypeError('fetch failed'); });
  check(r8.err && !(r8.err instanceof StreamIncomplete) && classify(r8.err).status === 'transport_error', 'transport: a failure before any response is a transport_error, as before');
  const r9 = await run(fakeStream(enc(sseOf(errEv('overloaded_error'))), { headers: okH }));
  check(r9.err instanceof StreamError && r9.err.request_id === 'req_stream' && classify(r9.err).retry === true && !JSON.stringify(r9.err.evidence ?? {}).includes(THINK_CANARY), 'transport: a mid-stream error event keeps the request id and evidence, without thinking');
}

// a syntactically valid 40-hex value for the self-test only; the real one is the frozen pack's commit, given at run time
const TEST_PACK_SHA = '0123456789abcdef0123456789abcdef01234567';
async function selfTest() {
  const fails = []; const check = (ok, msg) => { if (!ok) fails.push(msg); console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`); };
  const table = loadPrices(); const providers = eligible(table); const prices = dryPrices(table, providers); const tmp = [];
  // no network at all: any fetch fails the test
  let fetches = 0; const realFetch = globalThis.fetch; globalThis.fetch = async () => { fetches++; throw new Error('network forbidden in self-test'); };
  const scen = async (name, faults, capArgs, packSha = TEST_PACK_SHA) => {
    const outDir = mkdtempSync(join(tmpdir(), `c3-runner-${name}-`)); tmp.push(outDir);
    const caps = capsFrom(table, capArgs); const mock = mockProvider(faults); const breaches = [];
    // the invariant, checked at every reservation: no open reservation lets spend exceed a cap
    const onReserve = (l) => { const p = l.sums(l.doc.entries.at(-1).provider), t = l.sums();
      if (p.spent + p.reserved > caps.perProvider) breaches.push(`provider ${usd(p.spent + p.reserved)}`);
      if (t.spent + t.reserved > caps.total) breaches.push(`total ${usd(t.spent + t.reserved)}`);
      if (t.reserved > 0 && l.doc.entries.filter((e) => e.status === 'reserved').length > CONCURRENCY) breaches.push('more than one open reservation'); };
    console.log(`\n── scenario ${name} (caps: ${usd(caps.perProvider)} per provider, ${usd(caps.total)} total)`);
    const r = await runEval({ mode: 'dry-run', outDir, providers, prices, caps, maxOutput: DEFAULT_MAX_OUTPUT, adapterFor: () => mock, onReserve, packSha, log: (s) => console.log('  ' + s) });
    const t = r.ledger.entries.reduce((s, e) => s + toMicro(e.cost_usd ?? 0), 0);
    return { ...r, outDir, caps, mock, breaches, spentMicro: t };
  };
  const count = (r, p, st) => r.ledger.entries.filter((e) => (!p || e.provider === p) && (!st || e.status === st) && e.status !== 'refused').length;

  check(eq(providers, ['anthropic', 'openai']), 'default provider set: anthropic and openai (google excluded)');
  // (a) the normal plan with every planted fault
  const a = await scen('a-normal', FAULTS_NORMAL, {});
  check(a.exitCode === 0, '(a) completes with exit 0');
  check(a.breaches.length === 0 && a.spentMicro <= a.caps.total, '(a) no reservation let spend exceed a cap');
  check(a.mock.used.length === 4 && Object.keys(FAULTS_NORMAL).every((k) => a.mock.used.some((u) => u.startsWith(k))), '(a) all four planted faults were injected');
  check(count(a, 'anthropic') === 4 && count(a, 'openai') === 3, '(a) attempts per provider: anthropic 4, openai 3 (7 in all)');
  check(count(a, 'anthropic', 'invalid_output') === 1 && count(a, 'anthropic', 'http_429') === 1 && count(a, 'openai', 'transport_error') === 1, '(a) malformed → invalid_output, 429 → http_429, transport → transport_error, each retried once');
  const nu = a.ledger.entries.find((e) => e.provider === 'openai' && e.chapter === 2);
  check(nu.status === 'ok' && nu.cost_basis === 'reservation' && nu.cost_usd === nu.reserved_usd, '(a) the response with no usage keeps its reservation as its cost');
  check(a.ledger.entries.filter((e) => ['http_429', 'transport_error'].includes(e.status)).every((e) => e.cost_usd === e.reserved_usd), '(a) a 429 or transport error keeps its reservation as its cost');
  check(a.ledger.entries.filter((e) => e.cost_basis === 'usage').every((e) => toMicro(e.cost_usd) <= toMicro(e.reserved_usd)), '(a) every usage-based cost is within its reservation');
  check(providers.every((p) => a.summary.per_provider[p].drafts_valid === 30 && a.summary.per_provider[p].requests_valid === 2), '(a) 30 valid drafts (2 requests × 15) per provider');
  check(a.summary.max_in_flight === 1, '(a) never more than one call in flight');
  check(a.ledger.entries.every((e) => e.status === 'refused' || /^dry-run-.*\.(anthropic|openai)\.bab[12]\.a[123]$/.test(e.client_request_id)), '(a) every attempt carries its own client request id');
  const prov = JSON.parse(readFileSync(join(a.outDir, 'anthropic', 'bab1.provenance.json'), 'utf8'));
  const m = manifest();
  check(prov.attempt === 2 && prov.model && prov.model_version && prov.request_id && prov.prompt_version === m.prompt_version && prov.source_excerpt_sha256 === m.chapters.bab1.material_sha256
    && prov.response_sha256 === sha(readFileSync(join(a.outDir, 'anthropic', 'bab1.json'))), '(a) draft provenance: model, version, request id, prompt version, source excerpt hash; the judged file is the first valid attempt');
  check(existsSync(join(a.outDir, 'anthropic', 'attempts', 'bab1.a1.json')), '(a) the invalid attempt is kept');
  const u = JSON.parse(readFileSync(join(a.outDir, 'openai', 'usage.json'), 'utf8'));
  const PROV = ['model', 'model_date', 'endpoint', 'api_version', 'run_at', 'run_by', 'generation', 'data_retention', 'price_per_mtok'];
  check(PROV.every((k) => u[k] !== undefined && u[k] !== null && u[k] !== '') && u.calls.length === 2 && u.calls.every((c) => c.request_id), '(a) usage.json carries every provenance field the kit checks');
  check(u.calls.every((c) => c.model_version === 'openai-mock-model@mock') && a.ledger.entries.filter((e) => ['ok', 'invalid_output'].includes(e.status)).every((e) => e.model_version && e.model_version.endsWith('@mock'))
    && prov.model_version === 'anthropic-mock-model@mock', '(a) the model version the response reports is recorded per attempt (ledger, usage.json calls) and in the draft provenance');
  const bl = mkdtempSync(join(tmpdir(), 'c3-runner-blind-')); tmp.push(bl);
  execFileSync(process.execPath, [KIT, 'blind', a.outDir, bl], { encoding: 'utf8' });
  const map = JSON.parse(readFileSync(join(bl, 'SEALED', 'map.json'), 'utf8'));
  check(Object.keys(map.items).length === 60, '(a) kit.mjs blind reads the runner output: 60 items (2 providers × 30)');
  // the pack SHA in every provenance record
  const provFiles = providers.flatMap((p) => CHAPTERS.map((b) => JSON.parse(readFileSync(join(a.outDir, p, `bab${b}.provenance.json`), 'utf8'))));
  const usages = providers.map((p) => JSON.parse(readFileSync(join(a.outDir, p, 'usage.json'), 'utf8')));
  const summ = JSON.parse(readFileSync(join(a.outDir, 'summary.json'), 'utf8'));
  check(provFiles.length === 4 && provFiles.every((x) => x.pack_sha === TEST_PACK_SHA) && usages.every((x) => x.pack_sha === TEST_PACK_SHA)
    && a.ledger.runs.every((x) => x.pack_sha === TEST_PACK_SHA) && a.ledger.entries.length > 0 && a.ledger.entries.every((x) => x.pack_sha === TEST_PACK_SHA) && summ.pack_sha === TEST_PACK_SHA,
    '(a) --pack-sha is recorded in every provenance record: each bab<n>.provenance.json, usage.json, the ledger run and every ledger entry, summary.json');

  // (b) forced ceiling: total cap 0.05 → refused before the first call
  const b = await scen('b-ceiling-0.05', FAULTS_NORMAL, { 'cap-total': 0.05 });
  check(b.exitCode === 2 && b.summary.abort?.cap === 'total', '(b) total cap 0.05: aborts with exit 2 on the total cap');
  check(count(b) === 0 && b.spentMicro === 0 && b.breaches.length === 0, '(b) no call made, nothing spent, no reservation above the cap');
  check(b.ledger.entries.length === 1 && b.ledger.entries[0].status === 'refused' && existsSync(join(b.outDir, 'summary.json')), '(b) the refusal is in the ledger and a summary is written');
  // (b2) a cap that allows a few calls and then refuses
  const b2 = await scen('b2-ceiling-1.55', FAULTS_NORMAL, { 'cap-total': 1.55 });
  check(b2.exitCode === 2 && count(b2) === 2 && b2.breaches.length === 0 && b2.spentMicro <= b2.caps.total, `(b2) total cap 1.55: ${count(b2)} calls, then refused; spend ${usd(b2.spentMicro)} never above the cap`);
  // (b3) the per-provider cap
  const b3 = await scen('b3-provider-1.30', FAULTS_NORMAL, { 'cap-provider': 1.30 });
  check(b3.exitCode === 2 && b3.summary.abort?.cap === 'per_provider' && count(b3, 'anthropic') === 1 && b3.breaches.length === 0, '(b3) per-provider cap 1.30: one call, then refused on the provider cap');

  // extra branches: non-retryable 4xx, retries exhausted, usage above the reservation
  const c = await scen('c-branches', FAULTS_EXTRA, {});
  check(count(c, 'anthropic', 'http_4xx') === 1 && count(c, 'anthropic') === 1 && c.summary.items['anthropic:bab2'].outcome === 'not_attempted', '(c) a plain 400 is not retried and stops the provider (bab2 not attempted)');
  check(count(c, 'openai', 'http_5xx') === 3 && c.summary.items['openai:bab1'].valid === false, '(c) three 5xx: retries exhausted at 3 attempts, request failed');
  check(c.exitCode === 3 && c.summary.abort?.kind === 'overrun' && count(c, 'openai') === 4, '(c) a reported cost above its reservation aborts at once (exit 3), no further call');
  // v2, red first (E incident run 1, 17 Nov): a paid response is kept even when its cost overruns the reservation.
  const ovr = c.ledger.entries.find((x) => x.provider === 'openai' && x.chapter === 2 && x.status === 'overrun');
  check(existsSync(join(c.outDir, 'openai', 'attempts', 'bab2.a1.json')) && /^[0-9a-f]{64}$/.test(ovr?.response_sha256 ?? ''),
    'v2 (c) an overrun keeps the paid response: the attempt file is written and its SHA-256 is in the ledger, then the run aborts');
  // v2, red first: the input bound is above the real count observed on 17 Nov (anthropic bab1: 4,993 input tokens).
  { const t = kitRequest(1), sch = schemaText(); const wc = worstCase(Buffer.byteLength(t, 'utf8') + Buffer.byteLength(sch, 'utf8'), 12000, { input: 2, output: 10 });
    check(wc.input_bound >= 4993 && wc.input_bound >= Buffer.byteLength(t + sch, 'utf8'),
      `v2 the bab1 input bound (${wc.input_bound}) is at least the real 4,993 tokens and at least the request's UTF-8 bytes`); }
  // v2: real-sized counts (E incident run 1). At the raised output limit, a call that uses twice the observed input
  // and every output token (thinking included) still costs no more than its reservation, so it cannot overrun.
  for (const mo of [32000, 48000]) {
    for (const b of CHAPTERS) {
      const t = kitRequest(b), sch = schemaText(); const pr = { input: 2, output: 10 };
      const wc = worstCase(Buffer.byteLength(t, 'utf8') + Buffer.byteLength(sch, 'utf8'), mo, pr);
      check(costMicro(2 * 4993, mo, pr) <= wc.micro,
        `v2 real-sized: bab${b} at max_output ${mo}, 2 × 4,993 input + ${mo} output costs ${usd(costMicro(2 * 4993, mo, pr))} <= reservation ${usd(wc.micro)}`);
    }
  }

  // (d) a spend or billing stop: never retried, and no further call to that provider
  const d = await scen('d-spend-stops', FAULTS_STOP, {});
  check(count(d, 'anthropic') === 1 && count(d, 'anthropic', 'spend_stop') === 1 && d.summary.items['anthropic:bab2'].outcome === 'not_attempted', '(d) anthropic tier spend cap (429 enforced_spend_limit_reached): one attempt, not retried, bab2 not attempted');
  check(count(d, 'openai', 'ok') === 1 && count(d, 'openai', 'spend_stop') === 1 && count(d, 'openai') === 2, '(d) openai spend limit (429 organization_spend_limit_exceeded) on bab2: not retried; bab1 unaffected');
  check(d.exitCode === 4 && eq(d.summary.failed_requests.sort(), ['anthropic:bab1', 'anthropic:bab2', 'openai:bab2']) && d.summary.per_provider.anthropic.stopped, '(d) the run ends with exit 4 and names the three failed requests and the stop');
  check(d.ledger.entries.filter((e) => e.status === 'spend_stop').every((e) => e.cost_usd === e.reserved_usd && e.request_id === 'req_mock' && e.error_code), '(d) a stop keeps its reservation as its cost and records its request id and error code');

  // (e), (f) undocumented errors in a full run: each stops its provider at once, with no retry, reservation kept as cost
  const stopsAt = (r, p, st) => count(r, p) === 1 && count(r, p, st) === 1 && r.summary.items[`${p}:bab2`].outcome === 'not_attempted' && r.summary.per_provider[p].stopped
    && r.ledger.entries.filter((e) => e.provider === p && e.status === st).every((e) => e.cost_usd === e.reserved_usd && e.cost_basis === 'reservation' && e.retryable === false);
  const e1 = await scen('e-unknown-4xx-5xx', { 'anthropic:bab1:1': 'unknown_4xx', 'openai:bab1:1': 'unknown_5xx' }, {});
  check(stopsAt(e1, 'anthropic', 'http_4xx'), '(e) anthropic unknown 4xx (418, unknown type): one attempt, not retried, provider stopped, reservation kept as cost');
  check(stopsAt(e1, 'openai', 'http_5xx'), '(e) openai unknown 5xx (502): one attempt, not retried, provider stopped, reservation kept as cost');
  const f1 = await scen('f-402-unknown-type', { 'anthropic:bab1:1': '402_unknown', 'openai:bab1:1': '402_unknown' }, {});
  check(stopsAt(f1, 'anthropic', 'billing_stop') && stopsAt(f1, 'openai', 'http_4xx'), '(f) a 402 with an unknown type: each provider stops after one attempt, not retried, reservation kept as cost');
  check(e1.exitCode === 4 && f1.exitCode === 4 && e1.summary.failed_requests.length === 4 && f1.summary.failed_requests.length === 4, '(e)(f) both runs end with exit 4, all four requests failed, no call after the stop');

  // (g) Sharon N4: three attempts with no usable response (transport errors or unparsable 2xx) stop the provider;
  // fewer than three do not
  const g1 = await scen('g-no-usable-response', { 'anthropic:bab1:1': 'transport', 'anthropic:bab1:2': 'unparsable', 'anthropic:bab1:3': 'transport',
    'openai:bab1:1': 'transport', 'openai:bab1:2': 'unparsable' }, {});
  const gA = g1.ledger.entries.filter((e) => e.provider === 'anthropic');
  check(gA.length === 3 && eq(gA.map((e) => e.status), ['transport_error', 'unparsable_2xx', 'transport_error']) && gA.every((e) => e.cost_usd === e.reserved_usd && e.cost_basis === 'reservation')
    && g1.summary.items['anthropic:bab2'].outcome === 'not_attempted' && /no usable response in 3 attempts/.test(g1.summary.per_provider.anthropic.stopped ?? ''),
    '(g) anthropic bab1: transport, unparsable 2xx, transport → provider stopped, bab2 not attempted, all three reservations kept as cost');
  check(count(g1, 'openai') === 4 && g1.summary.per_provider.openai.stopped === null && g1.summary.per_provider.openai.requests_valid === 2,
    '(g) openai bab1: two such attempts then a valid one → not stopped; bab2 runs');
  check(g1.exitCode === 4 && eq(g1.summary.failed_requests.sort(), ['anthropic:bab1', 'anthropic:bab2']), '(g) the run ends with exit 4 and names anthropic\'s two requests as failed');


  try {
  // (h) v2 streaming through the whole run (Sharon S-4): the mock answers anthropic through the real streaming
  // adapter and parser, with thinking in every stream
  check(a.mock.streams.length === count(a, 'anthropic') && a.mock.streams.every((x) => x.url === ADAPTERS.anthropic.endpoint && x.stream === true),
    `(h) every anthropic attempt in (a) went through the streaming transport with stream true (${a.mock.streams.length})`);
  const h1 = await scen('h-stream', { 'anthropic:bab1:1': 'stream_cut', 'anthropic:bab1:2': 'stream_error', 'anthropic:bab1:3': 'stream_slow', 'anthropic:bab2:1': 'stream_unknown_event' }, {});
  const hA = h1.ledger.entries.filter((e) => e.provider === 'anthropic');
  check(eq(hA.map((e) => e.status), ['stream_incomplete', 'stream_error', 'ok', 'ok']) && h1.exitCode === 0, '(h) anthropic: a cut stream, a mid-stream overloaded_error, then a slow stream that succeeds; bab2 succeeds despite an unknown event; exit 0');
  check(hA.slice(0, 2).every((e) => e.cost_usd === e.reserved_usd && e.cost_basis === 'reservation' && e.actual_output_tokens === null && e.stream?.events > 0 && /^[0-9a-f]{64}$/.test(e.stream?.text_sha256 ?? '')),
    '(h) S-1: the cut and the errored stream each keep their full reservation as cost, with stream evidence in the ledger');
  check(!existsSync(join(h1.outDir, 'anthropic', 'attempts', 'bab1.a1.json')) && !existsSync(join(h1.outDir, 'anthropic', 'attempts', 'bab1.a2.json')) && existsSync(join(h1.outDir, 'anthropic', 'attempts', 'bab1.a3.json')),
    '(h) S-1: partial text is never an attempt file, never validated or judged; only the completed attempt has one');
  // owner, 17 Nov: incomplete paid responses are preserved securely for incident investigation, never scored
  const inc1 = join(h1.outDir, 'anthropic', 'incomplete');
  const incFiles = existsSync(inc1) ? readdirSync(inc1).sort() : [];
  check(eq(incFiles, ['bab1.a1.partial.txt', 'bab1.a2.partial.txt']) && hA.slice(0, 2).every((e, i) => e.partial_file === `anthropic/incomplete/bab1.a${i + 1}.partial.txt`
      && sha(readFileSync(join(h1.outDir, e.partial_file), 'utf8')) === e.stream.text_sha256 && e.stream.text_chars === readFileSync(join(h1.outDir, e.partial_file), 'utf8').length && e.stream.text_chars > 0),
    '(h) owner: the cut and the errored stream each keep their partial answer text in <provider>/incomplete/ (PRIVAT), matching the SHA-256 and length in the ledger');
  check(noThinkingIn(inc1) && hA.slice(2).every((e) => !e.partial_file), '(h) S-2: the preserved partial text holds no thinking; a completed attempt has no partial file');
  { const bl3 = mkdtempSync(join(tmpdir(), 'c3-runner-blind-h-')); tmp.push(bl3);
    execFileSync(process.execPath, [KIT, 'blind', h1.outDir, bl3], { encoding: 'utf8' });
    const sealed = JSON.parse(readFileSync(join(bl3, 'SEALED', 'map.json'), 'utf8'));
    const anth = Object.values(sealed.providers).find((v) => v.folder === 'anthropic');
    const partials = incFiles.map((f) => readFileSync(join(inc1, f), 'utf8'));
    const shown = filesUnder(bl3).filter((f) => !f.includes('SEALED')).map((f) => readFileSync(f, 'utf8')).join('\n');
    check(Object.keys(sealed.items).length === 60 && anth.bab1.response_sha256 === sha(readFileSync(join(h1.outDir, 'anthropic', 'attempts', 'bab1.a3.json')))
      && partials.every((t) => !shown.includes(t.slice(0, 200))),
      '(h) the frozen kit.mjs blind reads only the judged files: 60 items, bab1 is the completed attempt 3, and no preserved partial text reaches what the judges or the key checker see'); }
  check(hA.slice(2).every((e) => e.cost_basis === 'usage' && toMicro(e.cost_usd) <= toMicro(e.reserved_usd) && e.finish?.stop_reason === 'end_turn' && e.stream?.thinking_blocks === 1), '(h) the completed streams are costed from their final usage, within the reservation, with the stop reason recorded');
  check([a, h1].every((r) => noThinkingIn(r.outDir)), '(h) S-2: no thinking text in any file the run wrote (attempts, judged files, provenance, ledger, summary, usage)');
  const h2 = await scen('h2-stream-overrun', { 'anthropic:bab1:1': 'overrun' }, {});
  const h2e = h2.ledger.entries.find((e) => e.provider === 'anthropic' && e.status === 'overrun');
  const h2f = join(h2.outDir, 'anthropic', 'attempts', 'bab1.a1.json');
  check(h2.exitCode === 3 && h2e && existsSync(h2f) && sha(readFileSync(h2f, 'utf8')) === h2e.response_sha256 && JSON.parse(readFileSync(h2f, 'utf8')).items?.length === PER_CHAPTER && noThinkingIn(h2.outDir),
    '(h2) S-4: a streamed overrun keeps the paid answer (text only, its SHA-256 in the ledger), then aborts with exit 3');
  const h3 = await scen('h3-stream-fatal', { 'anthropic:bab1:1': 'stream_error_fatal' }, {});
  check(stopsAt(h3, 'anthropic', 'stream_error'), '(h3) a mid-stream invalid_request_error: one attempt, not retried, provider stopped, reservation kept as cost');
  const h4 = await scen('h4-stream-cuts', { 'anthropic:bab1:1': 'stream_cut', 'anthropic:bab1:2': 'no_usage', 'anthropic:bab1:3': 'stream_cut' }, {});
  check(eq(h4.ledger.entries.filter((e) => e.provider === 'anthropic').map((e) => e.status), ['stream_incomplete', 'stream_incomplete', 'stream_incomplete']) && /no usable response in 3 attempts/.test(h4.summary.per_provider.anthropic.stopped ?? ''),
    '(h4) three incomplete streams on one request (cut, no final usage, cut) stop the provider (Sharon N4)');
  // the dry run at the package's settings: 48,000, anthropic only, streaming
  const h5 = await (async () => { const outDir = mkdtempSync(join(tmpdir(), 'c3-runner-h5-')); tmp.push(outDir); const mock = mockProvider(FAULTS_NORMAL);
    const r = await runEval({ mode: 'dry-run', outDir, providers: ['anthropic'], prices: realDryPrices(table, ['anthropic']), caps: capsFrom(table, { 'cap-provider': 4.87, 'cap-total': 9.87 }), maxOutput: 48000, adapterFor: () => mock, packSha: TEST_PACK_SHA, log: () => {} });
    return { ...r, outDir, mock }; })();
  check(h5.exitCode === 0 && h5.summary.per_provider.anthropic.drafts_valid === 30 && h5.mock.streams.length === 4 && noThinkingIn(h5.outDir) && h5.ledger.entries.every((e) => e.max_output_tokens === 48000),
    '(h5) the package settings (anthropic only, max_output 48,000, caps 4.87 / 9.87, pinned prices): 30 valid drafts, every call streamed, no thinking in any file');
  } catch (x) { check(false, `streaming scenarios threw: ${String(x?.message ?? x).slice(0, 120)}`); }

  // the adapters against E-PROVIDER-FACTS.md §6
  console.log('\n── adapters against E-PROVIDER-FACTS.md §6 (offline)');
  await adapterChecks(check, table);
  try { await streamChecks(check); } catch (x) { check(false, `streaming checks threw: ${String(x?.message ?? x).slice(0, 120)}`); }

  // the real-run gate
  console.log('\n── the real-run gate');
  const g = liveGate(table, providers, {});
  check(providers.every((p) => g.includes(`${p}: no key in ${table.providers[p].key_env}`)), 'a real run refuses without keys');
  check(!g.some((x) => /UNVERIFIED|not pinned|not grade A/.test(x)), 'prices, model IDs and sources are pinned for anthropic and openai (grade A, read 2026-11-16)');
  const dummyKeys = Object.fromEntries(providers.map((p) => [table.providers[p].key_env, 'DUMMY-KEY-PLACEHOLDER']));
  const g2 = liveGate(table, providers, dummyKeys); const unverified = providers.filter((p) => !ADAPTERS[p].verified);
  const noStream = providers.filter((p) => !ADAPTERS[p].streaming);
  check(unverified.every((p) => g2.some((x) => x.startsWith(`${p}: API adapter not verified`))) && (g2.length > 0) === (unverified.length + noStream.length > 0), `with keys present, a real run still refuses while an adapter is unverified (${unverified.join(', ') || 'none'}) or has no streaming transport (${noStream.join(', ') || 'none'})`);
  check(frozenSetProblems().length === 0, 'frozen set: kit.mjs, score.mjs and report.mjs match their SHA-256 in MANIFEST.json');
  const mf = manifest();
  check(frozenSetProblems({ ...mf, kit_sha256: '0'.repeat(64) }).some((x) => /kit\.mjs differs/.test(x)) && frozenSetProblems({ ...mf, score_sha256: undefined }).some((x) => /no score_sha256/.test(x))
    && frozenSetProblems({ ...mf, report_sha256: 'f'.repeat(64) }).some((x) => /report\.mjs differs/.test(x)),
    'frozen set: a real run is refused while kit.mjs, score.mjs or report.mjs differs from MANIFEST.json, or a hash is absent');
  const gg = liveGate(table, ['google'], {});
  check(!('google' in ADAPTERS) && !PROVIDERS.includes('google') && gg.length === 1 && /^google: excluded: Not eligible .*§20\(d\)/.test(gg[0]), 'google: no adapter; refused with the §20(d) reason from prices.json');
  // the --live flag: required in addition to the gate
  check(liveGate(table, ['openai'], dummyKeys).some((x) => /^openai: no streaming transport/.test(x)) && liveGate(table, ['anthropic'], dummyKeys).length === 0,
    'v2 gate: a real run refuses a provider without a streaming transport (openai, deferred by Ruling 50); anthropic alone passes the gate with a key');
  const allVerified = Object.fromEntries(Object.entries(ADAPTERS).map(([p, x]) => [p, { ...x, verified: true, streaming: true }]));   // test-only override
  check(liveGate(table, providers, dummyKeys, allVerified).length === 0, 'test-only override: with dummy keys and adapters marked verified, the gate itself passes');
  const nl = realRunProblems({ 'pack-sha': TEST_PACK_SHA }, table, providers, dummyKeys, allVerified);
  check(nl.length === 1 && /--live/.test(nl[0]), 'without --live a real run is refused, even with dummy keys and (hypothetically) verified adapters; the refusal names --live');
  const lv = realRunProblems({ live: true, 'pack-sha': TEST_PACK_SHA }, table, providers, dummyKeys);
  check((lv.length > 0) === (unverified.length + noStream.length > 0) && !lv.some((x) => /--live/.test(x)) && unverified.every((p) => lv.some((x) => x.startsWith(`${p}: API adapter not verified`))) && noStream.every((p) => lv.some((x) => x.startsWith(`${p}: no streaming transport`))), `with --live and dummy keys, a real run is still refused while an adapter is unverified (${unverified.join(', ') || 'none'}) or has no streaming transport (${noStream.join(', ') || 'none'})`);
  check(realRunProblems({ live: true, 'pack-sha': TEST_PACK_SHA }, table, providers, dummyKeys, allVerified).length === 0, 'test-only override: --live, --pack-sha, keys and verified adapters together are the only way through');
  const verifiedOnly = providers.filter((p) => ADAPTERS[p].verified && ADAPTERS[p].streaming);
  check(verifiedOnly.every((p) => realRunProblems({ live: true, 'pack-sha': TEST_PACK_SHA }, table, [p], dummyKeys).length === 0 && realRunProblems({ 'pack-sha': TEST_PACK_SHA }, table, [p], dummyKeys).length === 1),
    `the real adapters as they stand: ${verifiedOnly.join(', ') || 'none'} would pass the gate alone with --live and a key, and is refused without --live (checked in memory; no call made)`);
  // --pack-sha: a real run without a valid 40-hex value is refused BEFORE any request is built. Checked in memory with
  // spies: adapters whose build/call count and throw, a run function that counts, and fetch still blocked (above).
  console.log('\n── --pack-sha (in memory; no request is built)');
  const spy = { built: 0, called: 0, runs: 0 };
  const spyAdapters = Object.fromEntries(Object.entries(ADAPTERS).map(([p, x]) => [p, { ...x, verified: true, streaming: true,
    build() { spy.built++; throw new Error('spy: a request was built'); }, async call() { spy.called++; throw new Error('spy: a call was made'); } }]));
  const spyRun = async (cfg) => { spy.runs++; spy.cfg = cfg; return { exitCode: 0, summary: { pack_sha: cfg.packSha } }; };
  const live = (extra) => liveRun({ args: { live: true, ...extra }, table, providers, env: dummyKeys, adapters: spyAdapters, run: spyRun, log: () => {} });
  const r0 = await live({});
  check(r0.refused && r0.problems.length === 1 && /no --pack-sha/.test(r0.problems[0]), '--live with keys and verified adapters but no --pack-sha: refused, and the refusal names --pack-sha');
  const badShas = ['abc', TEST_PACK_SHA.slice(0, 39), TEST_PACK_SHA + '8', TEST_PACK_SHA.toUpperCase().replace(/[0-9]/g, 'A'), 'g'.repeat(40), ' ' + TEST_PACK_SHA.slice(1), true, ''];
  const rb = []; for (const v of badShas) rb.push(await live({ 'pack-sha': v }));
  check(rb.every((x) => x.refused && x.problems.length === 1 && /--pack-sha/.test(x.problems[0])), `a malformed --pack-sha is refused: ${badShas.length} cases (short, long, uppercase, non-hex, leading space, flag with no value, empty)`);
  check(spy.built === 0 && spy.called === 0 && spy.runs === 0 && fetches === 0, 'every --pack-sha refusal happened before any request was built: no adapter build, no call, no run, no fetch');
  check(realRunProblems({ live: true, 'pack-sha': TEST_PACK_SHA }, table, providers, dummyKeys, spyAdapters).length === 0, 'a valid 40-hex --pack-sha clears this check (the other gates unchanged)');
  const rOk = await live({ 'pack-sha': TEST_PACK_SHA });
  check(!rOk.refused && spy.runs === 1 && spy.cfg.packSha === TEST_PACK_SHA && spy.cfg.mode === 'live' && spy.built === 0 && spy.called === 0,
    'with a valid --pack-sha the (spy) run receives it; the spy builds nothing and no adapter is touched');
  let thrown = null; try { await runEval({ mode: 'live', outDir: tmpdir(), providers, prices, caps: capsFrom(table, {}), maxOutput: 1, adapterFor: () => spyAdapters.anthropic, packSha: null, log: () => {} }); } catch (x) { thrown = x; }
  check(thrown instanceof Fatal && /--pack-sha/.test(thrown.message) && spy.built === 0, 'runEval itself refuses a live run with no pack SHA, before reading the kit or building a request (a second guard)');
  check(fetches === 0, 'no network call was attempted');
  globalThis.fetch = realFetch;
  const plan = planTable(prices, providers, DEFAULT_MAX_OUTPUT);
  check(Object.values(plan.per).every((v) => v.all <= toMicro(8)) && plan.total <= toMicro(25), `plan at the assumed $15/$75: worst case with every retry ${usd(plan.total)} within US$25; per provider ${usd(Object.values(plan.per)[0].all)} within US$8`);
  const rp = planTable(realDryPrices(table, providers), providers, DEFAULT_MAX_OUTPUT);
  check(Object.values(rp.per).every((v) => v.all === 973614) && rp.total === 1947228, `plan at the pinned $2/$10: worst case with every retry ${usd(rp.total)} (per provider ${usd(Object.values(rp.per)[0].all)})`);
  for (const t of tmp) rmSync(t, { recursive: true, force: true });
  console.log(`\n${fails.length ? fails.length + ' FAILED' : 'all passed'} (temporary folders removed)`);
  return fails.length ? 1 : 0;
}

// ───────────────────────────── CLI
function parseArgs(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i]; if (!k.startsWith('--')) throw new Fatal(`unexpected argument ${k}`);
    const name = k.slice(2);
    if (['dry-run', 'self-test', 'plan', 'real-prices', 'live'].includes(name)) a[name] = true;
    else if (name === 'pack-sha') { const v = argv[i + 1]; if (v === undefined || v.startsWith('--')) a[name] = true; else { a[name] = v; i++; } }   // left for realRunProblems to refuse
    else { const v = argv[++i]; if (v === undefined) throw new Fatal(`${k} needs a value`); a[name] = v; }
  }
  return a;
}
async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.live && (args['self-test'] || args['dry-run'] || args.plan)) throw new Fatal('--live cannot be combined with --self-test, --dry-run or --plan');
  if (args['self-test']) return selfTest();
  const table = loadPrices();
  const providers = (args.providers ?? eligible(table).join(',')).split(',').filter(Boolean);
  for (const p of providers) {
    if (table.providers[p]?.excluded) throw new Fatal(`${p} is excluded: ${table.providers[p].excluded}`);
    if (!PROVIDERS.includes(p)) throw new Fatal(`unknown provider ${p}`);
  }
  const maxOutput = args['max-output'] ? Number(args['max-output']) : DEFAULT_MAX_OUTPUT;
  if (!(Number.isInteger(maxOutput) && maxOutput > 0)) throw new Fatal('--max-output must be a positive integer');
  if (args.scenario === 'ceiling' && args['cap-total'] === undefined) args['cap-total'] = 0.05;
  const caps = capsFrom(table, args);
  if (!args.live && args['pack-sha'] !== undefined && !PACK_SHA_RE.test(String(args['pack-sha']))) throw new Fatal('--pack-sha must be a 40-character lowercase hex commit SHA');
  const offlinePrices = () => (args['real-prices'] ? realDryPrices : dryPrices)(table, providers);
  if (args.plan) { const pr = offlinePrices(); printPlan(planTable(pr, providers, maxOutput), pr, caps); return 0; }
  if (args['dry-run']) {
    globalThis.fetch = async () => { throw new Error('network forbidden in a dry run'); };
    const outDir = args.out ?? join(HERE, 'out-dry-run');   // never inside out/: kit.mjs blind treats every folder there as a provider
    const mock = mockProvider(FAULTS_NORMAL);
    const r = await runEval({ mode: 'dry-run', outDir, providers, prices: offlinePrices(), caps, maxOutput, adapterFor: () => mock, packSha: args['pack-sha'] ?? null });
    console.log(JSON.stringify({ exit_code: r.exitCode, abort: r.summary.abort, total_spent_usd: r.summary.total_spent_usd, caps_usd: r.summary.caps_usd, per_provider: r.summary.per_provider, out: outDir }, null, 2));
    return r.exitCode;
  }
  if (args['real-prices']) throw new Fatal('--real-prices applies only to --plan and --dry-run');
  const r = await liveRun({ args: { ...args, maxOutput }, table, providers });
  if (r.refused) { console.error('real run refused:\n' + r.problems.map((x) => '- ' + x).join('\n')); return 1; }
  console.log(JSON.stringify({ exit_code: r.exitCode, abort: r.summary.abort, total_spent_usd: r.summary.total_spent_usd, pack_sha: r.summary.pack_sha, per_provider: r.summary.per_provider, out: r.outDir }, null, 2));
  return r.exitCode;
}
main().then((code) => process.exit(code), (e) => { console.error(e instanceof Fatal ? `runner: ${e.message}` : e); process.exit(1); });
