#!/usr/bin/env node
// C3 provider runner (C3-EVALUATION-PLAN.md §6, README.md "Provider requirements"). Dependency-free.
//
//   node runner.mjs --plan                      worst-case cost table under the dry-run assumed prices (no call)
//   node runner.mjs --dry-run [options]         the whole run against an offline mock provider (no network)
//   node runner.mjs --self-test                 scenarios (a), (b), the extra branches and the adapter checks, offline
//   node runner.mjs [options]                   a real run: REFUSES today (adapters not verified, no keys)
//
// Options: --out <dir>  --providers anthropic,openai  --max-output <tokens>
//          --cap-provider <usd>  --cap-total <usd>  (can only LOWER the caps in prices.json, never raise them)
//          --scenario normal|ceiling   (dry run only: which mock fault plan; ceiling = total cap 0.05)
//          --real-prices               (--plan and --dry-run only: use the pinned prices in prices.json, not the
//                                       deliberately high dry-run assumption; still no network)
// The default provider set is anthropic and openai. google is excluded (prices.json says why) and is refused.
//
// Budget rules, applied before EVERY attempt:
//   input_estimate  = ceil((request chars + schema chars) / 3)      no tokenizer: conservative estimator
//   worst_case      = ceil(input_estimate × 1.2) × in_price + max_output × out_price
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
//   <out>/<provider>/usage.json              the kit's usage.json (provenance + calls with tokens)
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, renameSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const HERE = dirname(fileURLToPath(import.meta.url));
const KIT = join(HERE, 'kit.mjs');
const PROVIDERS = ['anthropic', 'openai', 'google'];   // every adapter known; the eligible set comes from prices.json
const CHAPTERS = [1, 2];
const PER_CHAPTER = 15;
const MAX_ATTEMPTS = 3;            // 1 + at most 2 retries per request
const CONCURRENCY = 1;             // the in-flight bound: one reservation at a time
const CHARS_PER_TOKEN = 3;
const INPUT_MARGIN = 1.2;
const DEFAULT_MAX_OUTPUT = 12000;  // hard output cap per call: 15 items of JSON in Indonesian
const LABELS = ['A', 'B', 'C', 'D'];
const UNVERIFIED = 'UNVERIFIED';
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
const estimateInputTokens = (chars) => Math.ceil(chars / CHARS_PER_TOKEN);
// prices are USD per 1M tokens, so tokens × price is micro-USD; rounded up. A documented long-prompt surcharge
// (prices.json `surcharge`, e.g. OpenAI above 272K input tokens) applies to the full request.
function costMicro(inTok, outTok, p) {
  const s = p.surcharge && inTok > p.surcharge.above_input_tokens ? p.surcharge : null;
  return Math.ceil(inTok * p.input * (s ? s.input_multiplier : 1) + outTok * p.output * (s ? s.output_multiplier : 1));
}
function worstCase(chars, maxOutput, p) {
  const est = estimateInputTokens(chars);
  const inBound = Math.ceil(est * INPUT_MARGIN);
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
// anthropic and openai were compared field by field with E-PROVIDER-FACTS.md §6 (read 16 Nov 2026 from the official
// API reference; table in DRY-RUN-RESULT.md, "Adapter verification against official docs, 16 Nov"). `verified` is true
// only when every field the adapter depends on rests on a grade-A fact; `unverified_fields` lists what does not.
// google was written from memory and never checked; it is excluded (prices.json) and kept only as code.
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
const OPENAI_SPEND_CODES = ['organization_spend_limit_exceeded', 'project_spend_limit_exceeded', 'organization_usage_limit_exceeded'];

async function httpCall(adapter, args, fetchImpl = globalThis.fetch) {
  const q = adapter.build(args);
  const r = await fetchImpl(q.url, { method: q.method, headers: q.headers, body: JSON.stringify(q.body), signal: AbortSignal.timeout(600_000) });
  const bodyText = await r.text();
  if (!r.ok) { const cls = adapter.classifyError({ status: r.status, headers: r.headers, bodyText }); throw new HttpError(r.status, bodyText, { cls, request_id: cls.request_id, rate_limit: cls.rate_limit }); }
  return adapter.parse({ status: r.status, headers: r.headers, bodyText, maxOutput: args.maxOutput });
}

const ADAPTERS = {
  anthropic: {
    verified: false,
    unverified_fields: [
      'response text location: the adapter reads the generated text from content[] blocks of type "text" (content[].text); §6a documents no response-content field',
      'credit exhaustion: HTTP 402 billing_error is grade B in §6a ("No error specific to an exhausted credit balance was found"); the adapter treats 402 as a billing stop, which fails closed',
    ],
    endpoint: 'https://api.anthropic.com/v1/messages', api_version: '2026-10-21',
    build({ model, text, schema, maxOutput, key }) {
      return { url: this.endpoint, method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${key}`, 'anthropic-version': this.api_version },
        body: { model, max_tokens: maxOutput, messages: [{ role: 'user', content: text }],
          output_config: { format: { type: 'json_schema', schema: JSON.parse(schema) } } } };
    },
    parse({ headers, bodyText }) {
      const h = new Headers(headers ?? {}); const j = JSON.parse(bodyText); const u = j.usage;
      const ok = u && Number.isFinite(u.input_tokens) && Number.isFinite(u.output_tokens);
      return { raw: (j.content ?? []).filter((c) => c.type === 'text').map((c) => c.text).join(''),
        request_id: h.get('request-id'), model_version: j.model ?? null,
        // §6a: total input = input_tokens + cache_creation_input_tokens + cache_read_input_tokens; output_tokens is the billing total
        usage: ok ? { input: u.input_tokens + (u.cache_creation_input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0), output: u.output_tokens } : null,
        usage_raw: u ?? null, rate_limit: pickHeaders(h, ANTHROPIC_RL) };
    },
    classifyError({ status, headers, bodyText }) {
      const h = new Headers(headers ?? {}); const j = tryJson(bodyText); const e = j?.error ?? {};
      const code = e.details?.error_code ?? null; const msg = String(e.message ?? '');
      const base = { http: status, type: e.type ?? null, code, request_id: h.get('request-id') ?? j?.request_id ?? null, rate_limit: pickHeaders(h, ANTHROPIC_RL) };
      if (status === 429 && code === 'enforced_spend_limit_reached') return { ...base, status: 'spend_stop', retry: false, stop: true };
      // a documented rate limit carries retry-after; a ramp limit carries its code. Any other 429 fails closed.
      if (status === 429 && (h.get('retry-after') !== null || code === 'ramp_limit_exceeded')) return { ...base, status: 'http_429', retry: true };
      if (status === 429) return { ...base, status: 'spend_stop', retry: false, stop: true, note: '429 without retry-after or a rate-limit code: treated as a stop' };
      if (status === 400 && /^You have reached your specified (workspace )?API usage limits/.test(msg)) return { ...base, status: 'spend_stop', retry: false, stop: true };
      if (status === 402) return { ...base, status: 'billing_stop', retry: false, stop: true };
      if (status >= 500) return { ...base, status: 'http_5xx', retry: true };   // 500 api_error, 504 timeout_error, 529 overloaded_error
      return { ...base, status: 'http_4xx', retry: false };
    },
    async call(args) { return httpCall(this, args); },
  },
  openai: {
    verified: false,
    unverified_fields: [
      'response text location: the adapter reads the generated text from output[] items of type "message", content[] parts of type "output_text" (.text); §6b documents no response-content field',
      'content-type: application/json request header: not stated in §6b',
    ],
    endpoint: 'https://api.openai.com/v1/responses', api_version: 'v1',
    build({ model, text, schema, maxOutput, key, clientRequestId }) {
      const headers = { 'content-type': 'application/json', authorization: `Bearer ${key}` };
      // §6b: logged by OpenAI for lookup if a response is lost; ASCII, at most 512 characters (otherwise a 400)
      if (clientRequestId) { if (!/^[\x20-\x7e]{1,512}$/.test(clientRequestId)) throw new Fatal('X-Client-Request-Id must be ASCII, ≤512 chars'); headers['x-client-request-id'] = clientRequestId; }
      return { url: this.endpoint, method: 'POST', headers,
        body: { model, input: text, max_output_tokens: maxOutput, store: false,
          text: { format: { type: 'json_schema', name: 'c3_items', schema: JSON.parse(schema), strict: true } } } };
    },
    parse({ headers, bodyText, maxOutput }) {
      const h = new Headers(headers ?? {}); const j = JSON.parse(bodyText); const u = j.usage;
      const ok = u && Number.isFinite(u.input_tokens) && Number.isFinite(u.output_tokens);
      // §6b names the detail fields but does not say whether input_tokens includes the cached tokens, or output_tokens the
      // reasoning tokens. Settle on an upper bound that holds either way: input + cache details; output + reasoning, but
      // never above max_output_tokens, which already includes reasoning (§6b, A). The raw usage is kept.
      let usage = null;
      if (ok) {
        const d = u.input_tokens_details ?? {}; const r = u.output_tokens_details?.reasoning_tokens ?? 0;
        const outBound = Number.isFinite(maxOutput) ? Math.max(u.output_tokens, Math.min(maxOutput, u.output_tokens + r)) : u.output_tokens + r;
        usage = { input: u.input_tokens + (d.cached_tokens ?? 0) + (d.cache_write_tokens ?? 0), output: outBound };
      }
      const raw = (j.output ?? []).filter((o) => o.type === 'message').flatMap((o) => o.content ?? []).filter((c) => c.type === 'output_text').map((c) => c.text).join('');
      return { raw, request_id: h.get('x-request-id'), model_version: j.model ?? null, usage, usage_raw: u ?? null, rate_limit: pickHeaders(h, OPENAI_RL) };
    },
    classifyError({ status, headers, bodyText }) {
      const h = new Headers(headers ?? {}); const j = tryJson(bodyText); const e = j?.error ?? {};
      const code = e.code ?? null;
      const base = { http: status, type: e.type ?? null, code, request_id: h.get('x-request-id'), rate_limit: pickHeaders(h, OPENAI_RL) };
      // §6b: "Retrying billing, spend, or quota errors won't restore API access."
      if (status === 429 && code === 'credit_balance_exhausted') return { ...base, status: 'billing_stop', retry: false, stop: true };
      if (status === 429 && (OPENAI_SPEND_CODES.includes(code) || e.type === 'insufficient_quota')) return { ...base, status: 'spend_stop', retry: false, stop: true };
      if (status === 429) return { ...base, status: 'http_429', retry: true };    // "Rate limit reached for requests", slow_down
      if (status >= 500) return { ...base, status: 'http_5xx', retry: true };     // 500; 503 service_unavailable_error / server_is_overloaded
      return { ...base, status: 'http_4xx', retry: false };
    },
    async call(args) { return httpCall(this, args); },
  },
  google: {
    verified: false, excluded: true,
    unverified_fields: ['every field: written from memory; the Google API documentation could not be read (E-PROVIDER-FACTS.md §0)'],
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent', api_version: 'v1beta',
    async call({ model, text, maxOutput, key }) {
      const r = await fetch(this.endpoint.replace('{model}', encodeURIComponent(model)), { method: 'POST', signal: AbortSignal.timeout(600_000),
        headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text }] }], generationConfig: { maxOutputTokens: maxOutput, responseMimeType: 'application/json' } }) });
      const body = await r.text(); if (!r.ok) throw new HttpError(r.status, body);
      const j = JSON.parse(body); const u = j.usageMetadata;
      // thinking tokens are billed as output: counted with the candidates
      return { raw: (j.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? '').join(''), request_id: j.responseId ?? null, model_version: j.modelVersion ?? null,
        usage: u ? { input: u.promptTokenCount, output: (u.candidatesTokenCount ?? 0) + (u.thoughtsTokenCount ?? 0) } : null };
    },
  },
};

// The offline mock: schema-valid JSON unless a fault is planned for (provider, chapter, attempt).
// Faults: malformed | 429 | 500 | 400 | transport | no_usage | overrun | spend_stop (a canned §6 spend-stop error,
// classified by the provider's real classifyError)
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
  return {
    used, endpoint: 'mock://offline', api_version: 'mock-1', verified: true,
    async call({ provider, model, b, attempt, text, schema, maxOutput, seq }) {
      const f = faults[`${provider}:bab${b}:${attempt}`];
      if (f) used.push(`${provider}:bab${b}:${attempt}:${f}`);
      if (f === 'transport') { const e = new Error('mock transport error: connection reset'); e.transport = true; throw e; }
      if (f === '429') throw new HttpError(429, '{"error":"rate limited (mock)"}');
      if (f === '500') throw new HttpError(500, '{"error":"server error (mock)"}');
      if (f === '400') throw new HttpError(400, '{"error":"bad request (mock)"}');
      if (f === 'spend_stop') { const c = CANNED_SPEND_STOP[provider]; const cls = ADAPTERS[provider].classifyError(c); throw new HttpError(c.status, c.bodyText, { cls, request_id: cls.request_id, rate_limit: cls.rate_limit }); }
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

// canned spend stops, shaped as E-PROVIDER-FACTS.md §6 documents them
const CANNED_SPEND_STOP = {
  anthropic: { status: 429, headers: { 'request-id': 'req_mock_spend' }, bodyText: JSON.stringify({ type: 'error', error: { type: 'rate_limit_error', message: 'spend limit (mock)', details: { error_code: 'enforced_spend_limit_reached' } }, request_id: 'req_mock_spend' }) },
  openai: { status: 429, headers: { 'x-request-id': 'req_mock_spend' }, bodyText: JSON.stringify({ error: { type: 'insufficient_quota', code: 'organization_spend_limit_exceeded', message: 'spend limit (mock)' } }) },
};

// ───────────────────────────── the run
function classify(err) {
  if (err instanceof HttpError && err.cls) return err.cls;     // a verified-against-§6 adapter classified it by status and code
  if (err instanceof HttpError) {
    if (err.status === 429) return { status: 'http_429', retry: true };
    if (err.status >= 500) return { status: 'http_5xx', retry: true, http: err.status };
    return { status: 'http_4xx', retry: false, http: err.status };
  }
  return { status: 'transport_error', retry: true };
}

export async function runEval(cfg) {
  const { mode, outDir, providers, prices, caps, maxOutput, adapterFor, onReserve, keys = {}, log = console.log } = cfg;
  const runId = `${mode}-${new Date().toISOString().replace(/[:.]/g, '-')}`;
  const ledger = new Ledger(join(outDir, 'ledger.json'), caps, { fresh: mode === 'dry-run', onReserve });
  const run = { run_id: runId, mode, started_at: new Date().toISOString(), providers, max_output_tokens: maxOutput, concurrency: CONCURRENCY, max_attempts: MAX_ATTEMPTS };
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
      const text = req[b];
      const chars = text.length + schema.length;   // the schema is sent (or listed) with the request: counted as input
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        const wc = worstCase(chars, maxOutput, price);
        const seq = ledger.doc.entries.filter((e) => e.provider === provider && e.status !== 'refused').length + 1;
        const base = { run_id: runId, provider, model: price.model, chapter: b, request_index: seq, attempt, input_chars: chars,
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
          usage_raw: res?.usage_raw ?? null, duration_ms, rate_limit: res?.rate_limit ?? err?.rate_limit ?? null };
        if (actual > wc.micro) {
          ledger.settle(e, { ...settle, status: 'overrun', reason: `reported cost ${usd(actual)} exceeds its reservation ${usd(wc.micro)}` });
          abort = { kind: 'overrun', reason: `${provider} bab${b} attempt ${attempt}: ${e.reason}` }; log(`ABORT    ${abort.reason}`); break outer;
        }
        if (err) {
          const c = classify(err);
          ledger.settle(e, { ...settle, status: c.status, http_status: c.http ?? (c.status === 'http_429' ? 429 : null), error_type: c.type ?? null, error_code: c.code ?? null, error: String(err.message).slice(0, 200), retryable: c.retry });
          log(`${c.status.padEnd(16)} ${provider} bab${b} attempt ${attempt}: ${err.message}${c.retry && attempt < MAX_ATTEMPTS ? ' → retry' : ''}${c.stop ? ' → no further call to ' + provider : ''}`);
          it.outcome = c.status;
          if (c.stop) { stopped[provider] = `${c.status} (HTTP ${c.http}${c.code ? ', ' + c.code : ''})`; break; }   // the next chapter sees stopped
          if (!c.retry) break;
          continue;
        }
        if (res.model_version) modelVersion[provider] = res.model_version;
        const af = join(pdir, 'attempts', `bab${b}.a${attempt}.json`);
        writeFileSync(af, res.raw);
        const v = kitValidate(af, b);
        usageCalls[provider].push({ bab: b, attempt, request_id: res.request_id, input_tokens: reportedUsage ? res.usage.input : wc.input_bound,
          output_tokens: reportedUsage ? res.usage.output : maxOutput, usage_reported: reportedUsage, valid: v.valid });
        ledger.settle(e, { ...settle, status: v.valid ? 'ok' : 'invalid_output', response_sha256: sha(res.raw), valid_items: v.items.filter((x) => x.valid).length, problems: v.problems.slice(0, 5), retryable: !v.valid });
        log(`${(v.valid ? 'ok' : 'invalid_output').padEnd(16)} ${provider} bab${b} attempt ${attempt}: cost ${usd(actual)} (${reportedUsage ? 'usage' : 'no usage → reservation kept'})${!v.valid && attempt < MAX_ATTEMPTS ? ' → retry' : ''}`);
        // the judged file: the first valid attempt; with none valid, the last response received (measured invalid)
        if (v.valid || !it.valid) {
          writeFileSync(join(pdir, `bab${b}.json`), res.raw);
          writeFileSync(join(pdir, `bab${b}.provenance.json`), JSON.stringify({
            mode, run_id: runId, provider, model: price.model, model_version: res.model_version, model_date: price.model_date,
            request_id: res.request_id, attempt, prompt_version: m.prompt_version, prompt_sha256: m.prompt_sha256, schema_sha256: m.schema_sha256,
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
      model: pr.model, model_version: modelVersion[p] ?? null, model_date: pr.model_date, endpoint: a.endpoint, api_version: a.api_version,
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
  const summary = { run_id: runId, mode, finished_at: new Date().toISOString(), exit_code: exitCode, abort, failed_requests: failed,
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
export function liveGate(table, providers, env = process.env) {
  const problems = [];
  for (const p of providers) {
    const e = table.providers[p];
    if (!e) { problems.push(`${p}: not in prices.json`); continue; }
    if (e.excluded || ADAPTERS[p]?.excluded) problems.push(`${p}: excluded: ${e.excluded ?? 'adapter excluded'}`);
    for (const k of ['model', 'model_date', 'input', 'output']) if (e[k] === UNVERIFIED || e[k] === undefined || e[k] === null) problems.push(`${p}: ${k} is UNVERIFIED`);
    for (const k of ['input', 'output']) if (e[k] !== UNVERIFIED && !(typeof e[k] === 'number' && e[k] > 0)) problems.push(`${p}: ${k} price is not a positive number`);
    if (!e.source || !e.read_on) problems.push(`${p}: price source and read_on date not pinned`);
    else if (e.grade !== 'A') problems.push(`${p}: price is not grade A`);
    const a = ADAPTERS[p];
    if (!a?.verified) problems.push(`${p}: API adapter not verified against the official documentation${a?.unverified_fields?.length ? '; no grade-A fact for: ' + a.unverified_fields.map((f) => f.split(':')[0]).join(', ') : ''}`);
    if (!env[e.key_env]) problems.push(`${p}: no key in ${e.key_env}`);
  }
  return problems;
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
const eligible = (table) => PROVIDERS.filter((p) => table.providers[p]?.enabled && !table.providers[p]?.excluded && !ADAPTERS[p]?.excluded);

// ───────────────────────────── the worst-case plan (no call)
export function planTable(prices, providers, maxOutput) {
  const schema = schemaText(); const rows = []; let total = 0; const per = {};
  for (const p of providers) {
    per[p] = { one: 0, all: 0 };
    for (const b of CHAPTERS) {
      const chars = kitRequest(b).length + schema.length; const wc = worstCase(chars, maxOutput, prices[p]);
      rows.push({ provider: p, chapter: `bab${b}`, chars, ...wc });
      per[p].one += wc.micro; per[p].all += MAX_ATTEMPTS * wc.micro;
    }
    total += per[p].all;
  }
  return { rows, per, total, oneEach: Object.values(per).reduce((s, v) => s + v.one, 0) };
}
function printPlan(plan, prices, caps) {
  const p0 = Object.values(prices)[0];
  console.log(`Worst case per call: ceil(ceil(chars/3) × 1.2) × $${p0.input}/M + max_output × $${p0.output}/M`);
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
      check(k.status === status && k.retry === retry && (k.stop === true) === status.endsWith('_stop'), `${name} error: ${label} → ${status}, ${retry ? 'retried' : 'not retried'}${status.endsWith('_stop') ? ', no further call' : ''}`);
    }
  };

  // ── anthropic, §6a
  {
    const A = ADAPTERS.anthropic; const q = A.build(args('anthropic'));
    check(q.method === 'POST' && q.url === 'https://api.anthropic.com/v1/messages', 'anthropic request: POST https://api.anthropic.com/v1/messages');
    check(eq(q.headers, { 'content-type': 'application/json', authorization: `Bearer ${KEY}`, 'anthropic-version': '2026-10-21' }), 'anthropic request headers: content-type application/json, Authorization: Bearer <key>, anthropic-version 2026-10-21 (no legacy x-api-key)');
    const f = q.body.output_config?.format ?? {};
    check(eq(Object.keys(q.body).sort(), ['max_tokens', 'messages', 'model', 'output_config']) && q.body.model === 'claude-sonnet-5-5' && q.body.max_tokens === DEFAULT_MAX_OUTPUT
      && eq(q.body.messages, [{ role: 'user', content: text }]) && eq(Object.keys(f).sort(), ['schema', 'type']) && f.type === 'json_schema' && eq(f.schema, JSON.parse(schema)),
      'anthropic request body: model claude-sonnet-5-5, max_tokens 12000, messages [user: the chapter request], output_config.format {type json_schema, schema: item-schema.json}; no system prompt');
    const okH = { 'request-id': 'req_018Eselftest', 'anthropic-ratelimit-requests-remaining': '3999', 'anthropic-ratelimit-output-tokens-reset': '2026-11-16T07:00:30Z', 'x-unrelated': 'dropped' };
    const okB = JSON.stringify({ id: 'msg_selftest', type: 'message', role: 'assistant', model: 'claude-sonnet-5-5', content: [{ type: 'text', text: '{"items":[]}' }],
      usage: { input_tokens: 2400, output_tokens: 2500, cache_creation_input_tokens: 10, cache_read_input_tokens: 5 } });
    const r = A.parse({ status: 200, headers: okH, bodyText: okB });
    check(r.usage?.input === 2415 && r.usage?.output === 2500, 'anthropic response usage: input = input_tokens + cache_creation_input_tokens + cache_read_input_tokens (2415), output = output_tokens (2500)');
    check(r.request_id === 'req_018Eselftest', 'anthropic response: request id from the request-id header, not the message id');
    check(r.rate_limit?.['anthropic-ratelimit-requests-remaining'] === '3999' && r.rate_limit?.['anthropic-ratelimit-output-tokens-reset'] && !('x-unrelated' in r.rate_limit), 'anthropic response: the documented anthropic-ratelimit-* headers are kept, nothing else');
    check(r.raw === '{"items":[]}' && r.model_version === 'claude-sonnet-5-5', 'anthropic response: text and model extracted');
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
    ]);
    const noHdr = A.classifyError({ status: 500, headers: {}, bodyText: JSON.stringify({ type: 'error', error: { type: 'api_error', message: 'x' }, request_id: 'req_err_body' }) });
    const hdr = A.classifyError(ae(429, { type: 'rate_limit_error', message: 'x' }, { 'retry-after': '7' }));
    check(noHdr.request_id === 'req_err_body' && hdr.request_id === 'req_err' && hdr.rate_limit?.['retry-after'] === '7', 'anthropic error: request id from the header, else the error body\'s request_id; retry-after kept');
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
      && eq(f, { type: 'json_schema', name: 'c3_items', schema: JSON.parse(schema), strict: true }),
      'openai request body: model gpt-6.1-sol, input (the chapter request), max_output_tokens 12000, store false, text.format {type json_schema, name, schema, strict true}; no instructions');
    let bad = null; try { A.build({ ...args('openai'), clientRequestId: 'naïve' }); } catch (x) { bad = x; }
    check(bad instanceof Fatal && args('openai').clientRequestId.length <= 512, 'openai request: X-Client-Request-Id is ASCII and at most 512 characters, or the request is not built');
    const okH = { 'x-request-id': 'req_selftest', 'x-ratelimit-remaining-requests': '4999', 'x-ratelimit-reset-tokens': '6ms', 'openai-version': '2020-10-01', 'x-unrelated': 'dropped' };
    const okB = JSON.stringify({ id: 'resp_selftest', object: 'response', model: 'gpt-6.1-sol', output: [{ type: 'reasoning', summary: [] }, { type: 'message', role: 'assistant', content: [{ type: 'output_text', text: '{"items":[]}' }] }],
      usage: { input_tokens: 2400, input_tokens_details: { cached_tokens: 0, cache_write_tokens: 0 }, output_tokens: 2600, output_tokens_details: { reasoning_tokens: 300 }, total_tokens: 5000 } });
    const r = A.parse({ status: 200, headers: okH, bodyText: okB, maxOutput: DEFAULT_MAX_OUTPUT });
    check(r.usage?.input === 2400 && r.usage?.output === 2900 && r.usage_raw?.output_tokens === 2600, 'openai response usage: input_tokens (+ cache details) 2400; output settled at the upper bound output_tokens + reasoning_tokens (2900); raw usage kept');
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
    ]);
    check(A.classifyError(oe(429, { code: 'credit_balance_exhausted' })).request_id === 'req_err', 'openai error: request id from the x-request-id header');
  }
  // the documented long-prompt surcharge (never reached by E)
  const op = table.providers.openai;
  check(costMicro(272000, 1000, op) === 272000 * 2 + 1000 * 10 && costMicro(272001, 1000, op) === Math.ceil(272001 * 4 + 1000 * 15), 'openai price: above 272K input tokens the full request costs 2× input and 1.5× output');
}

async function selfTest() {
  const fails = []; const check = (ok, msg) => { if (!ok) fails.push(msg); console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`); };
  const table = loadPrices(); const providers = eligible(table); const prices = dryPrices(table, providers); const tmp = [];
  // no network at all: any fetch fails the test
  let fetches = 0; const realFetch = globalThis.fetch; globalThis.fetch = async () => { fetches++; throw new Error('network forbidden in self-test'); };
  const scen = async (name, faults, capArgs) => {
    const outDir = mkdtempSync(join(tmpdir(), `c3-runner-${name}-`)); tmp.push(outDir);
    const caps = capsFrom(table, capArgs); const mock = mockProvider(faults); const breaches = [];
    // the invariant, checked at every reservation: no open reservation lets spend exceed a cap
    const onReserve = (l) => { const p = l.sums(l.doc.entries.at(-1).provider), t = l.sums();
      if (p.spent + p.reserved > caps.perProvider) breaches.push(`provider ${usd(p.spent + p.reserved)}`);
      if (t.spent + t.reserved > caps.total) breaches.push(`total ${usd(t.spent + t.reserved)}`);
      if (t.reserved > 0 && l.doc.entries.filter((e) => e.status === 'reserved').length > CONCURRENCY) breaches.push('more than one open reservation'); };
    console.log(`\n── scenario ${name} (caps: ${usd(caps.perProvider)} per provider, ${usd(caps.total)} total)`);
    const r = await runEval({ mode: 'dry-run', outDir, providers, prices, caps, maxOutput: DEFAULT_MAX_OUTPUT, adapterFor: () => mock, onReserve, log: (s) => console.log('  ' + s) });
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
  const bl = mkdtempSync(join(tmpdir(), 'c3-runner-blind-')); tmp.push(bl);
  execFileSync(process.execPath, [KIT, 'blind', a.outDir, bl], { encoding: 'utf8' });
  const map = JSON.parse(readFileSync(join(bl, 'SEALED', 'map.json'), 'utf8'));
  check(Object.keys(map.items).length === 60, '(a) kit.mjs blind reads the runner output: 60 items (2 providers × 30)');

  // (b) forced ceiling: total cap 0.05 → refused before the first call
  const b = await scen('b-ceiling-0.05', FAULTS_NORMAL, { 'cap-total': 0.05 });
  check(b.exitCode === 2 && b.summary.abort?.cap === 'total', '(b) total cap 0.05: aborts with exit 2 on the total cap');
  check(count(b) === 0 && b.spentMicro === 0 && b.breaches.length === 0, '(b) no call made, nothing spent, no reservation above the cap');
  check(b.ledger.entries.length === 1 && b.ledger.entries[0].status === 'refused' && existsSync(join(b.outDir, 'summary.json')), '(b) the refusal is in the ledger and a summary is written');
  // (b2) a cap that allows a few calls and then refuses
  const b2 = await scen('b2-ceiling-1.30', FAULTS_NORMAL, { 'cap-total': 1.30 });
  check(b2.exitCode === 2 && count(b2) === 2 && b2.breaches.length === 0 && b2.spentMicro <= b2.caps.total, `(b2) total cap 1.30: ${count(b2)} calls, then refused; spend ${usd(b2.spentMicro)} never above the cap`);
  // (b3) the per-provider cap
  const b3 = await scen('b3-provider-1.10', FAULTS_NORMAL, { 'cap-provider': 1.10 });
  check(b3.exitCode === 2 && b3.summary.abort?.cap === 'per_provider' && count(b3, 'anthropic') === 1 && b3.breaches.length === 0, '(b3) per-provider cap 1.10: one call, then refused on the provider cap');

  // extra branches: non-retryable 4xx, retries exhausted, usage above the reservation
  const c = await scen('c-branches', FAULTS_EXTRA, {});
  check(count(c, 'anthropic', 'http_4xx') === 1 && c.ledger.entries.filter((e) => e.provider === 'anthropic' && e.chapter === 1).length === 1, '(c) a 400 is not retried');
  check(count(c, 'openai', 'http_5xx') === 3 && c.summary.items['openai:bab1'].valid === false, '(c) three 5xx: retries exhausted at 3 attempts, request failed');
  check(c.exitCode === 3 && c.summary.abort?.kind === 'overrun' && count(c, 'openai') === 4, '(c) a reported cost above its reservation aborts at once (exit 3), no further call');

  // (d) a spend or billing stop: never retried, and no further call to that provider
  const d = await scen('d-spend-stops', FAULTS_STOP, {});
  check(count(d, 'anthropic') === 1 && count(d, 'anthropic', 'spend_stop') === 1 && d.summary.items['anthropic:bab2'].outcome === 'not_attempted', '(d) anthropic tier spend cap (429 enforced_spend_limit_reached): one attempt, not retried, bab2 not attempted');
  check(count(d, 'openai', 'ok') === 1 && count(d, 'openai', 'spend_stop') === 1 && count(d, 'openai') === 2, '(d) openai spend limit (429 organization_spend_limit_exceeded) on bab2: not retried; bab1 unaffected');
  check(d.exitCode === 4 && eq(d.summary.failed_requests.sort(), ['anthropic:bab1', 'anthropic:bab2', 'openai:bab2']) && d.summary.per_provider.anthropic.stopped, '(d) the run ends with exit 4 and names the three failed requests and the stop');
  check(d.ledger.entries.filter((e) => e.status === 'spend_stop').every((e) => e.cost_usd === e.reserved_usd && e.request_id === 'req_mock_spend' && e.error_code), '(d) a stop keeps its reservation as its cost and records its request id and error code');

  // the adapters against E-PROVIDER-FACTS.md §6
  console.log('\n── adapters against E-PROVIDER-FACTS.md §6 (offline)');
  await adapterChecks(check, table);

  // the real-run gate
  console.log('\n── the real-run gate');
  const g = liveGate(table, providers, {});
  check(providers.every((p) => g.includes(`${p}: no key in ${table.providers[p].key_env}`)), 'a real run refuses without keys');
  check(!g.some((x) => /UNVERIFIED|not pinned|not grade A/.test(x)), 'prices, model IDs and sources are pinned for anthropic and openai (grade A, read 2026-11-16)');
  const dummyKeys = Object.fromEntries(providers.map((p) => [table.providers[p].key_env, 'DUMMY-KEY-PLACEHOLDER']));
  const g2 = liveGate(table, providers, dummyKeys); const unverified = providers.filter((p) => !ADAPTERS[p].verified);
  check(unverified.every((p) => g2.some((x) => x.startsWith(`${p}: API adapter not verified`))) && (g2.length > 0) === (unverified.length > 0), `with keys present, a real run still refuses while an adapter is unverified (${unverified.join(', ') || 'none'})`);
  check(liveGate(table, ['google'], { GEMINI_API_KEY: 'DUMMY-KEY-PLACEHOLDER' }).some((x) => /^google: excluded: Not eligible/.test(x)), 'google is refused as excluded, even with a key');
  check(fetches === 0, 'no network call was attempted');
  globalThis.fetch = realFetch;
  const plan = planTable(prices, providers, DEFAULT_MAX_OUTPUT);
  check(Object.values(plan.per).every((v) => v.all <= toMicro(8)) && plan.total <= toMicro(25), `plan at the assumed $15/$75: worst case with every retry ${usd(plan.total)} within US$25; per provider ${usd(Object.values(plan.per)[0].all)} within US$8`);
  const rp = planTable(realDryPrices(table, providers), providers, DEFAULT_MAX_OUTPUT);
  check(Object.values(rp.per).every((v) => v.all === 764298) && rp.total === 1528596, `plan at the pinned $2/$10: worst case with every retry ${usd(rp.total)} (per provider ${usd(Object.values(rp.per)[0].all)})`);
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
    if (['dry-run', 'self-test', 'plan', 'real-prices'].includes(name)) a[name] = true;
    else { const v = argv[++i]; if (v === undefined) throw new Fatal(`${k} needs a value`); a[name] = v; }
  }
  return a;
}
async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args['self-test']) return selfTest();
  const table = loadPrices();
  const providers = (args.providers ?? eligible(table).join(',')).split(',').filter(Boolean);
  for (const p of providers) {
    if (!PROVIDERS.includes(p)) throw new Fatal(`unknown provider ${p}`);
    if (table.providers[p]?.excluded) throw new Fatal(`${p} is excluded: ${table.providers[p].excluded}`);
  }
  const maxOutput = args['max-output'] ? Number(args['max-output']) : DEFAULT_MAX_OUTPUT;
  if (!(Number.isInteger(maxOutput) && maxOutput > 0)) throw new Fatal('--max-output must be a positive integer');
  if (args.scenario === 'ceiling' && args['cap-total'] === undefined) args['cap-total'] = 0.05;
  const caps = capsFrom(table, args);
  const offlinePrices = () => (args['real-prices'] ? realDryPrices : dryPrices)(table, providers);
  if (args.plan) { const pr = offlinePrices(); printPlan(planTable(pr, providers, maxOutput), pr, caps); return 0; }
  if (args['dry-run']) {
    globalThis.fetch = async () => { throw new Error('network forbidden in a dry run'); };
    const outDir = args.out ?? join(HERE, 'out-dry-run');   // never inside out/: kit.mjs blind treats every folder there as a provider
    const mock = mockProvider(FAULTS_NORMAL);
    const r = await runEval({ mode: 'dry-run', outDir, providers, prices: offlinePrices(), caps, maxOutput, adapterFor: () => mock });
    console.log(JSON.stringify({ exit_code: r.exitCode, abort: r.summary.abort, total_spent_usd: r.summary.total_spent_usd, caps_usd: r.summary.caps_usd, per_provider: r.summary.per_provider, out: outDir }, null, 2));
    return r.exitCode;
  }
  if (args['real-prices']) throw new Fatal('--real-prices applies only to --plan and --dry-run');
  const problems = liveGate(table, providers);
  if (problems.length) { console.error('real run refused:\n' + problems.map((x) => '- ' + x).join('\n')); return 1; }
  const prices = Object.fromEntries(providers.map((p) => [p, table.providers[p]]));
  const keys = Object.fromEntries(providers.map((p) => [p, process.env[table.providers[p].key_env]]));
  const outDir = args.out ?? join(HERE, 'out');
  const r = await runEval({ mode: 'live', outDir, providers, prices, caps, maxOutput, keys, adapterFor: (p) => ADAPTERS[p] });
  console.log(JSON.stringify({ exit_code: r.exitCode, abort: r.summary.abort, total_spent_usd: r.summary.total_spent_usd, per_provider: r.summary.per_provider, out: outDir }, null, 2));
  return r.exitCode;
}
main().then((code) => process.exit(code), (e) => { console.error(e instanceof Fatal ? `runner: ${e.message}` : e); process.exit(1); });
