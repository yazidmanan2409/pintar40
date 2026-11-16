#!/usr/bin/env node
// C3 evidence report: E-DECISION-PACK §4.5. It is reported BESIDE the blinded results, never inside the scoring.
// Dependency-free; no network.
//
//   node report.mjs --runs <runner-out-dir> --map <out/SEALED/map.json> --map-sha256 <64-hex> \
//                   --scores <score-A.json,score-B.json,...> [--json]
//   node report.mjs --self-test
//
// It is the unblinding step: cost must never be seen before the scores are final. So it refuses unless:
//   - the sealed map is opened and matches the SHA-256 committed before judging (pack §4.4), and
//   - every provider code in the map has its final score.mjs output (`node score.mjs ... --json`), scored from a
//     flags file checked against its hash (flags_sha256 present), whose 30 slots are exactly the map's slots for it.
// It reads score.mjs's output and never writes to it: nothing here changes a score, an acceptance or a verdict.
//
// Per provider code it reports:
//   - cost per attempt, per valid draft and per accepted draft (accepted as score.mjs defines it). Every attempt
//     counts in the cost (§4.1), including retries and those that kept their reservation as cost;
//   - tokens, retry and failure rates, response times, rate limits met, and cost variability;
//   - whether each run's provenance record is complete, including pack_sha, and whether each judged response is
//     unchanged since blinding (its SHA-256 against the map and its provenance record).
//
// Inputs, all written by the runner (runner.mjs) and the kit:
//   <runs>/ledger.json                      every attempt: status, cost_usd, cost_basis, tokens, duration_ms, rate_limit
//   <runs>/<provider>/usage.json            the kit's provenance per run
//   <runs>/<provider>/bab<n>.provenance.json and bab<n>.json   the judged response and its record
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const CHAPTERS = [1, 2];
const sha256 = (b) => createHash('sha256').update(b).digest('hex');
const toMicro = (u) => Math.round(Number(u) * 1e6);
const usd = (micro) => (micro === null ? null : (micro / 1e6).toFixed(6));
const PACK_SHA_RE = /^[0-9a-f]{40}$/;
// what a run's provenance must hold (README, Sharon 9 Nov; pack_sha since 16 Nov)
export const USAGE_FIELDS = ['pack_sha', 'model', 'model_date', 'endpoint', 'api_version', 'run_at', 'run_by', 'generation', 'data_retention', 'price_per_mtok'];
export const DRAFT_FIELDS = ['pack_sha', 'mode', 'run_id', 'model', 'model_version', 'request_id', 'prompt_version', 'prompt_sha256', 'schema_sha256',
  'source_sha256', 'source_excerpt_sha256', 'request_sha256', 'response_sha256'];
export const BESIDE = 'Reported beside the blinded results, never inside the scoring (E-DECISION-PACK §4.5): nothing here changes a score, an acceptance or a verdict.';

const empty = (v) => v === undefined || v === null || v === '';
const stats = (xs) => {
  if (!xs.length) return null;
  const s = xs.slice().sort((a, b) => a - b); const n = s.length; const mean = s.reduce((a, b) => a + b, 0) / n;
  const sd = Math.sqrt(s.reduce((a, b) => a + (b - mean) ** 2, 0) / n);
  return { n, min: s[0], median: n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2, max: s[n - 1], mean, sd, cv: mean ? sd / mean : null };
};
const readJson = (p) => { try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; } };

export function verifyMap(bytes, expected) {
  if (typeof expected !== 'string' || !/^[0-9a-f]{64}$/.test(expected)) return { ok: false, errors: ['the sealed map\'s committed SHA-256 (64 lowercase hex characters) is required: the map is opened only against it'] };
  const got = sha256(bytes);
  if (got !== expected) return { ok: false, errors: [`sealed map SHA-256 ${got} does not match the committed ${expected}: refused`] };
  return { ok: true, sha256: got };
}

function provenance(pdir, code, map, ledgerRuns, provider) {
  const missing = [];
  const u = readJson(join(pdir, 'usage.json'));
  if (!u) missing.push('usage.json missing');
  else {
    for (const k of USAGE_FIELDS) if (empty(u[k])) missing.push(`usage.json: ${k}`);
    if (!empty(u.pack_sha) && !PACK_SHA_RE.test(u.pack_sha)) missing.push('usage.json: pack_sha is not a 40-hex commit SHA');
    if (!Array.isArray(u.calls) || !u.calls.length) missing.push('usage.json: no calls');
    else if (u.calls.some((c) => empty(c.request_id))) missing.push('usage.json: a call without request_id');
  }
  const unchanged = {};
  for (const b of CHAPTERS) {
    const pf = join(pdir, `bab${b}.provenance.json`), rf = join(pdir, `bab${b}.json`);
    const p = readJson(pf);
    if (!p) { missing.push(`bab${b}.provenance.json missing`); unchanged[`bab${b}`] = null; continue; }
    for (const k of DRAFT_FIELDS) if (empty(p[k])) missing.push(`bab${b}.provenance.json: ${k}`);
    if (!empty(p.pack_sha) && !PACK_SHA_RE.test(p.pack_sha)) missing.push(`bab${b}.provenance.json: pack_sha is not a 40-hex commit SHA`);
    const h = existsSync(rf) ? sha256(readFileSync(rf)) : null;
    unchanged[`bab${b}`] = h !== null && h === p.response_sha256 && h === map.providers[code]?.[`bab${b}`]?.response_sha256;
    if (!unchanged[`bab${b}`]) missing.push(`bab${b}.json: not the response sealed in the map and its provenance record`);
  }
  const runs = ledgerRuns.filter((r) => (r.providers ?? []).includes(provider));
  if (!runs.length) missing.push('ledger: no run record');
  for (const r of runs) if (!PACK_SHA_RE.test(r.pack_sha ?? '')) missing.push(`ledger run ${r.run_id}: pack_sha missing or malformed`);
  const shas = new Set([u?.pack_sha, ...CHAPTERS.map((b) => readJson(join(pdir, `bab${b}.provenance.json`))?.pack_sha), ...runs.map((r) => r.pack_sha)].filter((x) => !empty(x)));
  if (shas.size > 1) missing.push(`pack_sha differs across the records: ${[...shas].join(', ')}`);
  return { complete: missing.length === 0, missing, pack_sha: shas.size === 1 ? [...shas][0] : null, responses_unchanged: unchanged };
}

export function buildReport({ runsDir, mapPath, mapSha, scorePaths }) {
  if (!existsSync(mapPath)) return { ok: false, errors: [`sealed map not found: ${mapPath}`] };
  const bytes = readFileSync(mapPath);
  const v = verifyMap(bytes, mapSha);
  if (!v.ok) return v;
  const map = JSON.parse(bytes.toString('utf8'));
  const errors = [];
  const codes = Object.keys(map.providers ?? {}).sort();
  if (!codes.length) errors.push('sealed map: no provider codes');
  // the scores must be final, for every code, before any cost is seen
  const scores = {};
  for (const p of scorePaths ?? []) {
    const s = readJson(p);
    if (!s || s.ok !== true || !Array.isArray(s.table)) { errors.push(`${p}: not a successful score.mjs --json output`); continue; }
    if (!codes.includes(s.provider_code)) { errors.push(`${p}: provider code ${s.provider_code} is not in the sealed map`); continue; }
    if (scores[s.provider_code]) { errors.push(`provider code ${s.provider_code}: scored twice`); continue; }
    if (!/^[0-9a-f]{64}$/.test(s.flags_sha256 ?? '')) errors.push(`${p}: no flags_sha256 (not scored against the committed flags hash)`);
    const want = (map.slots?.[s.provider_code] ?? []).map((x) => `${x.item_id}|${x.chapter}|${x.status}`).sort();
    const got = s.table.map((x) => `${x.item_id}|${x.chapter}|${x.status}`).sort();
    if (want.length !== 30 || JSON.stringify(want) !== JSON.stringify(got)) errors.push(`${p}: its 30 slots are not the sealed map's slots for code ${s.provider_code}`);
    scores[s.provider_code] = s;
  }
  for (const c of codes) if (!scores[c]) errors.push(`provider code ${c}: no final score.mjs output; cost is reported only after every code is scored`);
  const ledger = readJson(join(runsDir, 'ledger.json'));
  if (!ledger || !Array.isArray(ledger.entries)) errors.push(`${join(runsDir, 'ledger.json')}: missing or not a ledger`);
  if (errors.length) return { ok: false, errors };

  const out = {};
  for (const code of codes) {
    const provider = map.providers[code].folder; const s = scores[code];
    const es = ledger.entries.filter((e) => e.provider === provider && e.status !== 'refused');
    const total = es.reduce((a, e) => a + toMicro(e.cost_usd ?? 0), 0);
    const requests = new Set(es.map((e) => `${e.run_id}:${e.chapter}`)).size;
    const byStatus = {}; for (const e of es) byStatus[e.status] = (byStatus[e.status] ?? 0) + 1;
    const withUsage = es.filter((e) => e.cost_basis === 'usage');
    const valid = s.counts?.valid ?? s.table.filter((r) => r.status === 'valid').length;
    const accepted = s.table.filter((r) => r.accepted).length;
    const per = (n) => (n > 0 ? Math.ceil(total / n) : null);
    const cv = stats(withUsage.map((e) => toMicro(e.cost_usd)));
    out[code] = {
      provider, attempts: es.length, requests, retries: es.length - requests, retry_rate: es.length ? (es.length - requests) / es.length : null,
      failures: es.filter((e) => e.status !== 'ok').length, failure_rate: es.length ? es.filter((e) => e.status !== 'ok').length / es.length : null, by_status: byStatus,
      cost: { total_usd: usd(total), per_attempt_usd: usd(per(es.length)), per_valid_draft_usd: usd(per(valid)), per_accepted_draft_usd: usd(per(accepted)),
        valid_drafts: valid, accepted_drafts: accepted, attempts_cost_from_reservation: es.length - withUsage.length },
      tokens: { input: withUsage.reduce((a, e) => a + (e.actual_input_tokens ?? 0), 0), output: withUsage.reduce((a, e) => a + (e.actual_output_tokens ?? 0), 0), attempts_without_usage: es.length - withUsage.length },
      response_ms: stats(es.map((e) => e.duration_ms).filter(Number.isFinite)),
      rate_limits: { http_429: byStatus.http_429 ?? 0, spend_or_billing_stops: (byStatus.spend_stop ?? 0) + (byStatus.billing_stop ?? 0), attempts_with_rate_limit_headers: es.filter((e) => e.rate_limit).length },
      cost_variability: cv && { attempts: cv.n, min_usd: usd(cv.min), max_usd: usd(cv.max), mean_usd: usd(Math.round(cv.mean)), sd_usd: usd(Math.round(cv.sd)), cv: cv.cv },
      provenance: provenance(join(runsDir, provider), code, map, ledger.runs ?? [], provider),
    };
  }
  return { ok: true, map_sha256: v.sha256, beside: BESIDE, codes: out };
}

const pct = (x) => (x === null ? '—' : `${(100 * x).toFixed(1)}%`);
export function markdown(r) {
  const L = ['# C3 · cost and reliability evidence (§4.5)', '', `> ${r.beside}`, '', `Sealed map opened and checked: ${r.map_sha256}.`, '',
    '| Code | Provider | Attempts | Retry rate | Failure rate | Cost total | Per attempt | Per valid draft | Per accepted draft | Tokens in / out | Response ms (median, max) | 429s | Cost CV | Provenance |',
    '|---|---|---|---|---|---|---|---|---|---|---|---|---|---|'];
  for (const [c, x] of Object.entries(r.codes)) {
    L.push(`| ${c} | ${x.provider} | ${x.attempts} | ${pct(x.retry_rate)} | ${pct(x.failure_rate)} | $${x.cost.total_usd} | $${x.cost.per_attempt_usd} | ${x.cost.per_valid_draft_usd === null ? '—' : '$' + x.cost.per_valid_draft_usd} (${x.cost.valid_drafts}) | ${x.cost.per_accepted_draft_usd === null ? '—' : '$' + x.cost.per_accepted_draft_usd} (${x.cost.accepted_drafts}) | ${x.tokens.input} / ${x.tokens.output}${x.tokens.attempts_without_usage ? ` (+${x.tokens.attempts_without_usage} without usage)` : ''} | ${x.response_ms ? `${x.response_ms.median}, ${x.response_ms.max}` : '—'} | ${x.rate_limits.http_429} | ${x.cost_variability?.cv?.toFixed(3) ?? '—'} | ${x.provenance.complete ? 'complete, pack ' + x.provenance.pack_sha.slice(0, 12) : '**incomplete:** ' + x.provenance.missing.join('; ')} |`);
  }
  L.push('', 'Regeneration cost is estimated from the cost per attempt; E measures no regeneration. No number of approved questions is promised for a fixed cost.');
  return L.join('\n') + '\n';
}

// ───────────────────────────── self-test: a real offline dry run, blinded, scored, then reported
async function selfTest() {
  const fails = []; let passes = 0;
  const check = (ok, m) => { if (ok) passes++; else fails.push(m); console.log(`${ok ? 'PASS' : 'FAIL'}  ${m}`); };
  const t = mkdtempSync(join(tmpdir(), 'c3-report-'));
  try {
    const PACK = '0123456789abcdef0123456789abcdef01234567';
    const runs = join(t, 'runs'), out = join(t, 'out');
    execFileSync(process.execPath, [join(HERE, 'runner.mjs'), '--dry-run', '--out', runs, '--pack-sha', PACK], { encoding: 'utf8' });
    execFileSync(process.execPath, [join(HERE, 'kit.mjs'), 'blind', runs, out], { encoding: 'utf8' });
    const mapPath = join(out, 'SEALED', 'map.json'); const mapSha = sha256(readFileSync(mapPath));
    const map = JSON.parse(readFileSync(mapPath, 'utf8'));
    const codeOf = (p) => Object.entries(map.providers).find(([, v]) => v.folder === p)[0];
    // scores: every shown item perfect, except 6 of openai's with review burden 0 (24 accepted)
    const { scoreProvider } = await import('./score.mjs');
    const scorePaths = {};
    for (const [code, v] of Object.entries(map.providers)) {
      const slots = map.slots[code]; let n = 0;
      const scores = slots.filter((z) => z.status === 'valid').flatMap((z) => { const rb = v.folder === 'openai' && n++ < 6 ? 0 : 2;
        return ['J1', 'J2'].map((judge) => ({ item_id: z.item_id, judge, correctness: 1, alignment: 2, distractors: 2, language: 2, review_burden: rb, reason: 'uji' })); });
      const s = scoreProvider({ format: 'c3-judge-sheets/1', provider_code: code, items: slots, scores }, { format: 'c3-key-flags/1', flags: [] });
      scorePaths[code] = join(t, `score-${code}.json`);
      writeFileSync(scorePaths[code], JSON.stringify({ ...s, flags_sha256: sha256('[]') }, null, 2));
    }
    const all = Object.values(scorePaths);
    const before = all.map((p) => sha256(readFileSync(p)));
    const args = (o = {}) => ({ runsDir: runs, mapPath, mapSha, scorePaths: all, ...o });

    console.log('── refusals: the map is opened only against its committed hash, and only once every code is scored');
    const r0 = buildReport(args({ mapSha: undefined }));
    check(!r0.ok && /committed SHA-256/.test(r0.errors[0]) && !('codes' in r0), 'no committed map hash: refused, nothing reported');
    const r1 = buildReport(args({ mapSha: sha256('another map') }));
    check(!r1.ok && /does not match the committed/.test(r1.errors[0]) && !('codes' in r1), 'map hash mismatch: refused, nothing reported');
    const r2 = buildReport(args({ scorePaths: [scorePaths[codeOf('anthropic')]] }));
    check(!r2.ok && r2.errors.some((e) => new RegExp(`code ${codeOf('openai')}: no final score`).test(e)), 'a code without its final score: refused (cost only after every code is scored)');
    const bad = JSON.parse(readFileSync(scorePaths[codeOf('openai')], 'utf8')); bad.table = bad.table.slice(1); writeFileSync(join(t, 'bad.json'), JSON.stringify(bad));
    const r3 = buildReport(args({ scorePaths: [scorePaths[codeOf('anthropic')], join(t, 'bad.json')] }));
    check(!r3.ok && r3.errors.some((e) => /not the sealed map's slots/.test(e)), 'a score whose slots are not the sealed map\'s: refused');
    const nf = JSON.parse(readFileSync(scorePaths[codeOf('openai')], 'utf8')); delete nf.flags_sha256; writeFileSync(join(t, 'nf.json'), JSON.stringify(nf));
    check(!buildReport(args({ scorePaths: [scorePaths[codeOf('anthropic')], join(t, 'nf.json')] })).ok, 'a score not checked against the committed flags hash: refused');
    writeFileSync(join(t, 'refused.json'), JSON.stringify({ ok: false, errors: ['x'] }));
    check(!buildReport(args({ scorePaths: [...all, join(t, 'refused.json')] })).ok, 'a refused score output: refused');

    console.log('── the evidence, on the dry run\'s ledger');
    const r = buildReport(args());
    check(r.ok && Object.keys(r.codes).length === 2, 'map opened against its hash, both codes scored: reported' + (r.ok ? '' : ': ' + r.errors.join('; ')));
    if (r.ok) {
      const L = JSON.parse(readFileSync(join(runs, 'ledger.json'), 'utf8'));
      const A = r.codes[codeOf('anthropic')], O = r.codes[codeOf('openai')];
      const tot = (p) => L.entries.filter((e) => e.provider === p && e.status !== 'refused').reduce((a, e) => a + toMicro(e.cost_usd), 0);
      check(A.attempts === 4 && O.attempts === 3 && A.cost.total_usd === usd(tot('anthropic')) && O.cost.total_usd === usd(tot('openai')), 'every attempt counts in the cost: anthropic 4 attempts, openai 3, totals equal the ledger');
      check(A.cost.per_attempt_usd === usd(Math.ceil(tot('anthropic') / 4)) && A.cost.per_valid_draft_usd === usd(Math.ceil(tot('anthropic') / 30)) && A.cost.per_accepted_draft_usd === usd(Math.ceil(tot('anthropic') / 30)),
        'cost per attempt, per valid draft (30) and per accepted draft (30), rounded up to the micro-dollar');
      check(O.cost.accepted_drafts === 24 && O.cost.per_accepted_draft_usd === usd(Math.ceil(tot('openai') / 24)) && O.cost.valid_drafts === 30, 'per accepted draft uses score.mjs\'s accepted (24: six with review burden 0), not the valid count');
      check(A.retries === 2 && A.retry_rate === 0.5 && O.retries === 1 && A.failures === 2 && O.failures === 1 && A.by_status.http_429 === 1 && O.by_status.transport_error === 1, 'retry and failure rates: anthropic 2 retries, 2 failures (invalid output, 429) in 4; openai 1 retry, 1 failure (transport) in 3');
      check(A.rate_limits.http_429 === 1 && O.rate_limits.http_429 === 0 && A.rate_limits.attempts_with_rate_limit_headers === 1, 'rate limits met: anthropic one 429 (with its headers), openai none');
      check(A.tokens.input > 0 && A.tokens.attempts_without_usage === 1 && O.tokens.attempts_without_usage === 2, 'tokens from reported usage; attempts without usage counted apart (their reservation is their cost)');
      check(A.response_ms && A.response_ms.n === 4 && A.cost_variability && A.cost_variability.attempts === 3 && A.cost_variability.cv >= 0, 'response times (n, min, median, max) and cost variability (sd, cv over billed attempts) reported');
      check(A.provenance.complete && O.provenance.complete && A.provenance.pack_sha === PACK && A.provenance.responses_unchanged.bab1 === true, 'provenance complete for both, pack_sha recorded, judged responses unchanged since blinding');
      const md = markdown(r);
      check(md.includes(BESIDE) && /never inside the scoring/.test(md) && md.includes(codeOf('openai')), 'the report states it sits beside the scores, never inside them');
      check(all.every((p, i) => sha256(readFileSync(p)) === before[i]) && !readdirSync(t).some((f) => /report/.test(f)), 'score.mjs output is read, never written: every score file is byte-unchanged');
      // incomplete provenance: a provenance record without pack_sha, and a response changed after blinding
      const pf = join(runs, 'openai', 'bab2.provenance.json'); const p = JSON.parse(readFileSync(pf, 'utf8')); delete p.pack_sha; writeFileSync(pf, JSON.stringify(p));
      writeFileSync(join(runs, 'anthropic', 'bab1.json'), readFileSync(join(runs, 'anthropic', 'bab1.json'), 'utf8') + ' ');
      const ri = buildReport(args());
      check(ri.ok && !ri.codes[codeOf('openai')].provenance.complete && ri.codes[codeOf('openai')].provenance.missing.includes('bab2.provenance.json: pack_sha'), 'a provenance record without pack_sha is reported incomplete');
      check(ri.ok && ri.codes[codeOf('anthropic')].provenance.responses_unchanged.bab1 === false && !ri.codes[codeOf('anthropic')].provenance.complete, 'a judged response changed after blinding is reported');
    }
    const me = fileURLToPath(import.meta.url);
    let code = 0, err = '';
    try { execFileSync(process.execPath, [me, '--runs', runs, '--map', mapPath, '--map-sha256', sha256('x'), '--scores', all.join(',')], { encoding: 'utf8', stdio: 'pipe' }); } catch (x) { code = x.status; err = String(x.stderr); }
    check(code === 2 && /refused/.test(err) && !/\$\d/.test(err), 'CLI: a map-hash mismatch exits 2 and shows no cost');
    const okOut = execFileSync(process.execPath, [me, '--runs', runs, '--map', mapPath, '--map-sha256', mapSha, '--scores', all.join(',')], { encoding: 'utf8' });
    check(okOut.includes(BESIDE) && /\| [A-Z] \| (anthropic|openai) \|/.test(okOut), 'CLI: with the committed map hash and every score, prints the report');
  } finally { rmSync(t, { recursive: true, force: true }); }
  console.log(`\n${passes} passed, ${fails.length} failed`);
  return fails.length ? 1 : 0;
}

function main(argv) {
  if (argv[0] === '--self-test') return selfTest();
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--json') o.json = true;
    else if (['--runs', '--map', '--map-sha256', '--scores'].includes(k)) o[k.slice(2)] = argv[++i];
    else { console.error(`unknown argument ${k}`); return 2; }
  }
  if (!o.runs || !o.map || !o.scores) { console.error('usage: node report.mjs --runs <dir> --map <SEALED/map.json> --map-sha256 <64-hex> --scores <a.json,b.json> [--json] | --self-test'); return 2; }
  const r = buildReport({ runsDir: o.runs, mapPath: o.map, mapSha: o['map-sha256'], scorePaths: o.scores.split(',').filter(Boolean) });
  if (!r.ok) { console.error('report refused:\n' + r.errors.map((e) => '- ' + e).join('\n')); return 2; }
  process.stdout.write(o.json ? JSON.stringify(r, null, 2) + '\n' : markdown(r));
  return 0;
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) Promise.resolve(main(process.argv.slice(2))).then((c) => { process.exitCode = c; });
