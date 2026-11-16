#!/usr/bin/env node
// C3 provider runner (C3-EVALUATION-PLAN.md §6, README.md "Provider requirements"). Dependency-free.
//
//   node runner.mjs --plan                      worst-case cost table under the dry-run assumed prices (no call)
//   node runner.mjs --dry-run [options]         the whole run against an offline mock provider (no network)
//   node runner.mjs --self-test                 scenarios (a), (b) and the extra branches, offline, with assertions
//   node runner.mjs [options]                   a real run: REFUSES today (prices, models and adapters unverified)
//
// Options: --out <dir>  --providers anthropic,openai,google  --max-output <tokens>
//          --cap-provider <usd>  --cap-total <usd>  (can only LOWER the caps in prices.json, never raise them)
//          --scenario normal|ceiling   (dry run only: which mock fault plan; ceiling = total cap 0.05)
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
// Retries: at most 2 per request (3 attempts), each a separate reservation, only on a transport error, a 429/5xx,
// or output that kit.mjs validate measures invalid. Concurrency is 1: never more than one reservation in flight.
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
import { readFileSync, writeFileSync, mkdirSync, existsSync, renameSync, mkdtempSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const HERE = dirname(fileURLToPath(import.meta.url));
const KIT = join(HERE, 'kit.mjs');
const PROVIDERS = ['anthropic', 'openai', 'google'];
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
// prices are USD per 1M tokens, so tokens × price is micro-USD; rounded up
const costMicro = (inTok, outTok, p) => Math.ceil(inTok * p.input + outTok * p.output);
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
// Real adapters. NOT verified: written from memory of each API's shape, with no network and no documentation read in
// this session. Before any real call each must be checked against the provider's official API documentation
// (endpoint, headers, output-cap parameter, structured-output parameter, usage fields) and `verified` set to true.
class HttpError extends Error { constructor(status, body) { super(`HTTP ${status}`); this.status = status; this.body = body; } }
const ADAPTERS = {
  anthropic: {
    verified: false, endpoint: 'https://api.anthropic.com/v1/messages', api_version: '2023-06-01',
    async call({ model, text, maxOutput, key }) {
      const r = await fetch(this.endpoint, { method: 'POST', signal: AbortSignal.timeout(600_000),
        headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': this.api_version },
        body: JSON.stringify({ model, max_tokens: maxOutput, messages: [{ role: 'user', content: text }] }) });
      const body = await r.text(); if (!r.ok) throw new HttpError(r.status, body);
      const j = JSON.parse(body);
      return { raw: (j.content ?? []).filter((c) => c.type === 'text').map((c) => c.text).join(''), request_id: r.headers.get('request-id') ?? j.id ?? null, model_version: j.model ?? null,
        usage: j.usage ? { input: j.usage.input_tokens, output: j.usage.output_tokens } : null };
    },
  },
  openai: {
    verified: false, endpoint: 'https://api.openai.com/v1/chat/completions', api_version: 'v1',
    async call({ model, text, schema, maxOutput, key }) {
      const r = await fetch(this.endpoint, { method: 'POST', signal: AbortSignal.timeout(600_000),
        headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
        body: JSON.stringify({ model, max_completion_tokens: maxOutput, messages: [{ role: 'user', content: text }],
          response_format: { type: 'json_schema', json_schema: { name: 'c3_items', strict: true, schema: JSON.parse(schema) } } }) });
      const body = await r.text(); if (!r.ok) throw new HttpError(r.status, body);
      const j = JSON.parse(body);
      return { raw: j.choices?.[0]?.message?.content ?? '', request_id: r.headers.get('x-request-id') ?? j.id ?? null, model_version: j.model ?? null,
        usage: j.usage ? { input: j.usage.prompt_tokens, output: j.usage.completion_tokens } : null };
    },
  },
  google: {
    verified: false, endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent', api_version: 'v1beta',
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
// Faults: malformed | 429 | 500 | 400 | transport | no_usage | overrun
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

// ───────────────────────────── the run
function classify(err) {
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

  outer: for (const provider of providers) {
    const adapter = adapterFor(provider); const price = prices[provider];
    const pdir = join(outDir, provider); mkdirSync(join(pdir, 'attempts'), { recursive: true });
    for (const b of CHAPTERS) {
      const id = `${provider}:bab${b}`;
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
        try { res = await adapter.call({ provider, model: price.model, b, attempt, text, schema, maxOutput, seq, key: keys[provider] }); } catch (x) { err = x; }
        inFlight--;
        const duration_ms = Date.now() - t0;
        const reportedUsage = !!res && !!res.usage && Number.isFinite(res.usage.input) && Number.isFinite(res.usage.output);
        const actual = reportedUsage ? costMicro(res.usage.input, res.usage.output, price) : wc.micro;
        const settle = { cost_usd: usd(actual), cost_basis: reportedUsage ? 'usage' : 'reservation',
          actual_input_tokens: reportedUsage ? res.usage.input : null, actual_output_tokens: reportedUsage ? res.usage.output : null,
          request_id: res?.request_id ?? null, model_version: res?.model_version ?? null,
          duration_ms, rate_limit: res?.rate_limit ?? err?.rate_limit ?? null };
        if (actual > wc.micro) {
          ledger.settle(e, { ...settle, status: 'overrun', reason: `reported cost ${usd(actual)} exceeds its reservation ${usd(wc.micro)}` });
          abort = { kind: 'overrun', reason: `${provider} bab${b} attempt ${attempt}: ${e.reason}` }; log(`ABORT    ${abort.reason}`); break outer;
        }
        if (err) {
          const c = classify(err);
          ledger.settle(e, { ...settle, status: c.status, http_status: c.http ?? (c.status === 'http_429' ? 429 : null), error: String(err.message).slice(0, 200), retryable: c.retry });
          log(`${c.status.padEnd(16)} ${provider} bab${b} attempt ${attempt}: ${err.message}${c.retry && attempt < MAX_ATTEMPTS ? ' → retry' : ''}`);
          it.outcome = c.status;
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
    per[p] = { attempts: es.filter((e) => e.status !== 'refused').length, by_status: by, spent_usd: usd(s.spent), open_reservations_usd: usd(s.reserved),
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
    for (const k of ['model', 'model_date', 'input', 'output']) if (e[k] === UNVERIFIED || e[k] === undefined || e[k] === null) problems.push(`${p}: ${k} is UNVERIFIED`);
    for (const k of ['input', 'output']) if (e[k] !== UNVERIFIED && !(typeof e[k] === 'number' && e[k] > 0)) problems.push(`${p}: ${k} price is not a positive number`);
    if (!e.source || !e.read_on) problems.push(`${p}: price source and read_on date not pinned`);
    if (!ADAPTERS[p]?.verified) problems.push(`${p}: API adapter not verified against the official documentation`);
    if (!env[e.key_env]) problems.push(`${p}: no key in ${e.key_env}`);
  }
  return problems;
}
const dryPrices = (table, providers) => Object.fromEntries(providers.map((p) => [p, { model: `${p}-mock-model`, model_date: 'dry-run', input: table.dry_run_assumed.input, output: table.dry_run_assumed.output, data_retention: 'none (offline mock)' }]));

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
const FAULTS_NORMAL = { 'anthropic:bab1:1': 'malformed', 'anthropic:bab2:1': '429', 'openai:bab1:1': 'transport', 'google:bab2:1': 'no_usage' };
const FAULTS_EXTRA = { 'anthropic:bab1:1': '400', 'openai:bab1:1': '500', 'openai:bab1:2': '500', 'openai:bab1:3': '500', 'google:bab1:1': 'overrun' };

async function selfTest() {
  const fails = []; const check = (ok, msg) => { if (!ok) fails.push(msg); console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`); };
  const table = loadPrices(); const providers = PROVIDERS; const prices = dryPrices(table, providers);
  // no network at all: any fetch fails the test
  let fetches = 0; const realFetch = globalThis.fetch; globalThis.fetch = async () => { fetches++; throw new Error('network forbidden in self-test'); };
  const scen = async (name, faults, capArgs) => {
    const outDir = mkdtempSync(join(tmpdir(), `c3-runner-${name}-`));
    const caps = capsFrom(table, capArgs); const mock = mockProvider(faults); const breaches = [];
    // the invariant, checked at every reservation: no open reservation lets spend exceed a cap
    const onReserve = (l) => { const p = l.sums(l.doc.entries.at(-1).provider), t = l.sums();
      if (p.spent + p.reserved > caps.perProvider) breaches.push(`provider ${usd(p.spent + p.reserved)}`);
      if (t.spent + t.reserved > caps.total) breaches.push(`total ${usd(t.spent + t.reserved)}`);
      if (t.reserved > 0 && l.doc.entries.filter((e) => e.status === 'reserved').length > CONCURRENCY) breaches.push('more than one open reservation'); };
    console.log(`\n── scenario ${name} (caps: ${usd(caps.perProvider)} per provider, ${usd(caps.total)} total) → ${outDir}`);
    const r = await runEval({ mode: 'dry-run', outDir, providers, prices, caps, maxOutput: DEFAULT_MAX_OUTPUT, adapterFor: () => mock, onReserve, log: (s) => console.log('  ' + s) });
    const t = r.ledger.entries.reduce((s, e) => s + toMicro(e.cost_usd ?? 0), 0);
    return { ...r, outDir, caps, mock, breaches, spentMicro: t };
  };
  const count = (r, p, st) => r.ledger.entries.filter((e) => (!p || e.provider === p) && (!st || e.status === st) && e.status !== 'refused').length;

  // (a) the normal plan with every planted fault
  const a = await scen('a-normal', FAULTS_NORMAL, {});
  check(a.exitCode === 0, '(a) completes with exit 0');
  check(a.breaches.length === 0 && a.spentMicro <= a.caps.total, '(a) no reservation let spend exceed a cap');
  check(a.mock.used.length === 4 && Object.keys(FAULTS_NORMAL).every((k) => a.mock.used.some((u) => u.startsWith(k))), '(a) all four planted faults were injected');
  check(count(a, 'anthropic') === 4 && count(a, 'openai') === 3 && count(a, 'google') === 2, '(a) attempts per provider: anthropic 4, openai 3, google 2 (9 in all)');
  check(count(a, 'anthropic', 'invalid_output') === 1 && count(a, 'anthropic', 'http_429') === 1 && count(a, 'openai', 'transport_error') === 1, '(a) malformed → invalid_output, 429 → http_429, transport → transport_error, each retried once');
  const nu = a.ledger.entries.find((e) => e.provider === 'google' && e.chapter === 2);
  check(nu.status === 'ok' && nu.cost_basis === 'reservation' && nu.cost_usd === nu.reserved_usd, '(a) the response with no usage keeps its reservation as its cost');
  check(a.ledger.entries.filter((e) => ['http_429', 'transport_error'].includes(e.status)).every((e) => e.cost_usd === e.reserved_usd), '(a) a 429 or transport error keeps its reservation as its cost');
  check(a.ledger.entries.filter((e) => e.cost_basis === 'usage').every((e) => toMicro(e.cost_usd) <= toMicro(e.reserved_usd)), '(a) every usage-based cost is within its reservation');
  check(providers.every((p) => a.summary.per_provider[p].drafts_valid === 30 && a.summary.per_provider[p].requests_valid === 2), '(a) 30 valid drafts (2 requests × 15) per provider');
  check(a.summary.max_in_flight === 1, '(a) never more than one call in flight');
  const prov = JSON.parse(readFileSync(join(a.outDir, 'anthropic', 'bab1.provenance.json'), 'utf8'));
  const m = manifest();
  check(prov.attempt === 2 && prov.model && prov.model_version && prov.request_id && prov.prompt_version === m.prompt_version && prov.source_excerpt_sha256 === m.chapters.bab1.material_sha256
    && prov.response_sha256 === sha(readFileSync(join(a.outDir, 'anthropic', 'bab1.json'))), '(a) draft provenance: model, version, request id, prompt version, source excerpt hash; the judged file is the first valid attempt');
  check(existsSync(join(a.outDir, 'anthropic', 'attempts', 'bab1.a1.json')), '(a) the invalid attempt is kept');
  const u = JSON.parse(readFileSync(join(a.outDir, 'google', 'usage.json'), 'utf8'));
  const PROV = ['model', 'model_date', 'endpoint', 'api_version', 'run_at', 'run_by', 'generation', 'data_retention', 'price_per_mtok'];
  check(PROV.every((k) => u[k] !== undefined && u[k] !== null && u[k] !== '') && u.calls.length === 2 && u.calls.every((c) => c.request_id), '(a) usage.json carries every provenance field the kit checks');
  const bl = mkdtempSync(join(tmpdir(), 'c3-runner-blind-'));
  execFileSync(process.execPath, [KIT, 'blind', a.outDir, bl], { encoding: 'utf8' });
  const map = JSON.parse(readFileSync(join(bl, 'SEALED', 'map.json'), 'utf8'));
  check(Object.keys(map.items).length === 90, '(a) kit.mjs blind reads the runner output: 90 items (3 providers × 30)');

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
  check(c.exitCode === 3 && c.summary.abort?.kind === 'overrun' && count(c, 'google') === 1, '(c) a reported cost above its reservation aborts at once (exit 3), no further call');

  // the real-run gate
  const g = liveGate(table, providers, {});
  check(g.some((x) => /input is UNVERIFIED/.test(x)) && g.some((x) => /adapter not verified/.test(x)) && g.some((x) => /no key/.test(x)), 'a real run refuses: UNVERIFIED prices, unverified adapters, no keys');
  check(fetches === 0, 'no network call was attempted');
  globalThis.fetch = realFetch;
  const plan = planTable(prices, providers, DEFAULT_MAX_OUTPUT);
  check(Object.values(plan.per).every((v) => v.all <= toMicro(8)) && plan.total <= toMicro(25), `plan: worst case with every retry ${usd(plan.total)} within US$25; per provider ${usd(Object.values(plan.per)[0].all)} within US$8`);
  console.log(`\n${fails.length ? fails.length + ' FAILED' : 'all passed'}`);
  return fails.length ? 1 : 0;
}

// ───────────────────────────── CLI
function parseArgs(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i]; if (!k.startsWith('--')) throw new Fatal(`unexpected argument ${k}`);
    const name = k.slice(2);
    if (['dry-run', 'self-test', 'plan'].includes(name)) a[name] = true;
    else { const v = argv[++i]; if (v === undefined) throw new Fatal(`${k} needs a value`); a[name] = v; }
  }
  return a;
}
async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args['self-test']) return selfTest();
  const table = loadPrices();
  const providers = (args.providers ?? PROVIDERS.filter((p) => table.providers[p]?.enabled).join(',')).split(',').filter(Boolean);
  for (const p of providers) if (!PROVIDERS.includes(p)) throw new Fatal(`unknown provider ${p}`);
  const maxOutput = args['max-output'] ? Number(args['max-output']) : DEFAULT_MAX_OUTPUT;
  if (!(Number.isInteger(maxOutput) && maxOutput > 0)) throw new Fatal('--max-output must be a positive integer');
  if (args.scenario === 'ceiling' && args['cap-total'] === undefined) args['cap-total'] = 0.05;
  const caps = capsFrom(table, args);
  if (args.plan) { const pr = dryPrices(table, providers); printPlan(planTable(pr, providers, maxOutput), pr, caps); return 0; }
  if (args['dry-run']) {
    globalThis.fetch = async () => { throw new Error('network forbidden in a dry run'); };
    const outDir = args.out ?? join(HERE, 'out-dry-run');   // never inside out/: kit.mjs blind treats every folder there as a provider
    const mock = mockProvider(FAULTS_NORMAL);
    const r = await runEval({ mode: 'dry-run', outDir, providers, prices: dryPrices(table, providers), caps, maxOutput, adapterFor: () => mock });
    console.log(JSON.stringify({ exit_code: r.exitCode, abort: r.summary.abort, total_spent_usd: r.summary.total_spent_usd, caps_usd: r.summary.caps_usd, per_provider: r.summary.per_provider, out: outDir }, null, 2));
    return r.exitCode;
  }
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
