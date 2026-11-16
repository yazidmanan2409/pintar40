#!/usr/bin/env node
// C3 blind provider evaluation kit (C3-EVALUATION-PLAN.md). Dependency-free; makes NO network call.
//
//   node kit.mjs material                      freeze the two chapters' material + MANIFEST.json (deterministic)
//   node kit.mjs request <1|2>                 print the exact request bytes for a chapter (stdout)
//   node kit.mjs validate <response.json> <1|2>  per-item structured-output validity (no repair)
//   node kit.mjs blind <runs-dir> <out-dir>    blind, normalise, shuffle; reviewer sheets + SEALED map
//   node kit.mjs score <out-dir> <judgements.csv> <runs-dir>   scores, critical keys, validity, cost; map last
//   node kit.mjs selftest                      the whole pipeline offline on planted cases (no provider)
//
// runs-dir layout (one folder per provider, named freely; names never reach reviewers):
//   <runs-dir>/<provider>/bab1.json, bab2.json   the provider's raw response text, unmodified
//   <runs-dir>/<provider>/usage.json             {model, model_date, price_per_mtok:{input,output},
//                                                 calls:[{bab, request_id, input_tokens, output_tokens}]}
import { createHash, randomInt } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, mkdtempSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const SRC = (b) => join(REPO, 'docs', 'onboarding', 'konten-sintetis', `SD5-Sintetis-Bab${b}.paket.json`);
const PER_CHAPTER = 15;
const PROMPT_VERSION = 'v2';   // v2: Daisy, 9 Nov (TINJAUAN-89374424 §3); v1 kept for the record
const LABELS = ['A', 'B', 'C', 'D'];
// Sharon, 9 Nov: what each provider run records beside its responses (usage.json)
const PROVENANCE = ['model', 'model_date', 'endpoint', 'api_version', 'run_at', 'run_by', 'generation', 'data_retention', 'price_per_mtok'];
const sha = (s) => createHash('sha256').update(s).digest('hex');
const die = (m) => { console.error(m); process.exit(1); };

// ───────────────────────────── material (frozen, no items or keys are sent)
function chapterFacts(b) {
  const d = JSON.parse(readFileSync(SRC(b), 'utf8'));
  const c = d.courses[0];
  const lessons = c.modules[0].lessons;
  const objectives = lessons.map((l, i) => ({ code: `B${b}-T${i + 1}`, bloom: l.objective.bloom, statement: l.objective.statement }));
  return { d, c, lessons, objectives, misconceptions: d.misconceptions.map((m) => ({ code: m.code, label: m.label, description: m.description })) };
}
function materialText(b) {
  const { c, lessons, objectives, misconceptions } = chapterFacts(b);
  const out = [`# ${c.title}`, '', `Mata pelajaran: ${c.subject} · ${c.grade_label}`, '', '## Tujuan pembelajaran', ''];
  for (const o of objectives) out.push(`- ${o.code} (${o.bloom}): ${o.statement}`);
  out.push('', '## Miskonsepsi yang dikenal', '');
  for (const m of misconceptions) out.push(`- ${m.code}: ${m.label}. ${m.description}`);
  out.push('', '## Materi');
  lessons.forEach((l, i) => out.push('', `### Pelajaran ${i + 1}: ${l.title}`, '', l.body_markdown.trim()));
  return out.join('\n') + '\n';
}
function promptTemplate() {
  const t = readFileSync(join(HERE, `prompt-${PROMPT_VERSION}.md`), 'utf8');
  const m = t.match(/<!-- BEGIN PROMPT -->\n([\s\S]*?)\n<!-- END PROMPT -->/);
  if (!m) die('prompt file: markers not found');
  return m[1];
}
const requestText = (b) => promptTemplate().replace('{{MATERIAL}}', readFileSync(join(HERE, 'material', `bab${b}.md`), 'utf8'));

function cmdMaterial() {
  mkdirSync(join(HERE, 'material'), { recursive: true });
  const manifest = { prompt_version: PROMPT_VERSION, prompt_sha256: sha(promptTemplate()), schema_sha256: sha(readFileSync(join(HERE, 'item-schema.json'))), chapters: {} };
  for (const b of [1, 2]) {
    const text = materialText(b);
    writeFileSync(join(HERE, 'material', `bab${b}.md`), text);
    const f = chapterFacts(b);
    manifest.chapters[`bab${b}`] = {
      source: `docs/onboarding/konten-sintetis/SD5-Sintetis-Bab${b}.paket.json`, source_sha256: sha(readFileSync(SRC(b))),
      material_sha256: sha(text), request_sha256: sha(requestText(b)), request_chars: requestText(b).length,
      objectives: f.objectives.map((o) => o.code), misconceptions: f.misconceptions.map((m) => m.code),
    };
  }
  writeFileSync(join(HERE, 'material', 'MANIFEST.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(JSON.stringify(manifest, null, 2));
}
const manifest = () => JSON.parse(readFileSync(join(HERE, 'material', 'MANIFEST.json'), 'utf8'));

// ───────────────────────────── validation (measured, never repaired)
function validateResponse(raw, b) {
  const ch = manifest().chapters[`bab${b}`];
  const res = { parsed: false, count: 0, items: [], problems: [] };
  let j;
  try { j = JSON.parse(raw); } catch (e) { res.problems.push(`not JSON: ${e.message}`); return res; }
  if (!j || typeof j !== 'object' || Array.isArray(j) || !Array.isArray(j.items)) { res.problems.push('no items array'); return res; }
  const extraTop = Object.keys(j).filter((k) => k !== 'items');
  if (extraTop.length) res.problems.push(`extra top-level fields: ${extraTop.join(',')}`);
  res.parsed = true; res.count = j.items.length;
  if (j.items.length !== PER_CHAPTER) res.problems.push(`expected ${PER_CHAPTER} items, got ${j.items.length}`);
  j.items.forEach((it, i) => {
    const p = [];
    const str = (v) => typeof v === 'string' && v.trim().length > 0;
    const allowed = ['stem', 'options', 'key', 'distractors', 'objective_code', 'key_rationale'];
    if (!it || typeof it !== 'object') { res.items.push({ index: i, valid: false, renderable: false, problems: ['not an object'] }); return; }
    for (const k of Object.keys(it)) if (!allowed.includes(k)) p.push(`extra field ${k}`);
    if (!str(it.stem)) p.push('stem missing');
    const opts = Array.isArray(it.options) ? it.options : [];
    const labels = opts.map((o) => o && o.label);
    if (opts.length !== 4 || LABELS.some((l) => labels.filter((x) => x === l).length !== 1)) p.push('options are not exactly A, B, C, D once each');
    if (opts.some((o) => !o || !str(o.body))) p.push('an option has no body');
    const bodies = opts.map((o) => (o && typeof o.body === 'string' ? o.body.trim().toLowerCase() : ''));
    if (new Set(bodies).size !== bodies.length) p.push('two options are identical');
    if (!LABELS.includes(it.key)) p.push('key is not A–D');
    const ds = Array.isArray(it.distractors) ? it.distractors : [];
    const want = LABELS.filter((l) => l !== it.key).join('');
    if (ds.map((d) => d && d.label).sort().join('') !== want) p.push('distractors do not cover exactly the three wrong options');
    for (const d of ds) {
      if (!d || !str(d.misconception)) p.push(`distractor ${d && d.label}: no misconception`);
      else if (!(ch.misconceptions.includes(d.misconception_code) || d.misconception_code === 'BARU')) p.push(`distractor ${d.label}: unknown misconception code ${d.misconception_code}`);
    }
    if (!ch.objectives.includes(it.objective_code)) p.push(`unknown objective ${it.objective_code}`);
    if (!str(it.key_rationale)) p.push('no key rationale');
    else if (/\n/.test(it.key_rationale.trim())) p.push('key rationale is not one line');
    const renderable = str(it.stem) && opts.length === 4 && opts.every((o) => o && str(o.body) && LABELS.includes(o.label)) && LABELS.includes(it.key);
    res.items.push({ index: i, valid: p.length === 0, renderable, problems: p });
  });
  return res;
}

// ───────────────────────────── blinding
const norm = (s) => String(s).replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ').trim();
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
// What the judges and Sharon receive is BUILT from these allowlists, never copied from a response: any other field a
// response or the runner's records carry (model, provider, request or response ids, headers, usage and token counts,
// timestamps, fingerprints, anything new) cannot reach them. assertAllowlisted checks the result again before writing.
const BLIND_ITEM_FIELDS = ['item_id', 'chapter', 'objective_code', 'stem', 'options', 'key', 'key_rationale', 'distractors'];
const BLIND_OPTION_FIELDS = ['label', 'body'];
const BLIND_DISTRACTOR_FIELDS = ['label', 'misconception_code', 'misconception'];
const KEYCHECK_ITEM_FIELDS = ['item_id', 'chapter', 'stem', 'options'];   // Sharon: no key, rationale or distractor
const BLIND_FILES = ['kunci/items.json', 'kunci/jawaban-k-template.csv', 'kunci/lembar-kunci-tanpa-kunci.md', 'reviewer/items.json', 'reviewer/judgements-template.csv', 'reviewer/lembar-penilaian.md'];
function assertAllowlisted(list, fields, where) {
  const nested = { options: BLIND_OPTION_FIELDS, distractors: BLIND_DISTRACTOR_FIELDS };
  for (const it of list) {
    if (!eq(Object.keys(it), fields)) throw new Error(`blind (${where}): item fields ${Object.keys(it).join(',')} are not the allowlist ${fields.join(',')}`);
    for (const [k, v] of Object.entries(it)) {
      if (nested[k]) { if (!Array.isArray(v) || v.some((o) => !o || !eq(Object.keys(o), nested[k]) || Object.values(o).some((x) => typeof x !== 'string'))) throw new Error(`blind (${where}): ${it.item_id} ${k} carries a field outside ${nested[k].join(',')}`); }
      else if (!['string', 'number'].includes(typeof v)) throw new Error(`blind (${where}): ${it.item_id} ${k} is not a plain value`);
    }
  }
}
const txt = (v, dflt = '') => (typeof v === 'string' ? norm(v) : dflt);
// one item as the judges see it, built field by field from the allowlist
function blindItem(id, b, it) {
  return {
    item_id: id, chapter: b, objective_code: txt(it.objective_code, '—'), stem: txt(it.stem),
    options: LABELS.map((l) => it.options.find((o) => o.label === l)).map((o) => ({ label: o.label, body: txt(o.body) })),
    key: txt(it.key), key_rationale: txt(it.key_rationale, '—'),
    distractors: (Array.isArray(it.distractors) ? it.distractors : []).filter((d) => d && typeof d === 'object')
      .map((d) => ({ label: txt(d.label), misconception_code: txt(d.misconception_code), misconception: txt(d.misconception) }))
      .sort((x, y) => x.label.localeCompare(y.label)),
  };
}
const keycheckItem = (x) => ({ item_id: x.item_id, chapter: x.chapter, stem: x.stem, options: x.options.map((o) => ({ label: o.label, body: o.body })) });
function shuffle(a) { const x = a.slice(); for (let i = x.length - 1; i > 0; i--) { const j = randomInt(i + 1); [x[i], x[j]] = [x[j], x[i]]; } return x; }

function cmdBlind(runsDir, outDir) {
  const providers = readdirSync(runsDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort();
  if (providers.length < 2 || providers.length > 26) die('blind: need 2–26 provider folders');
  const codes = shuffle(LABELS.concat('EFGHIJKLMNOPQRSTUVWXYZ'.split('')).slice(0, providers.length));
  const sealed = { warning: 'SEALED: do not give to reviewers before scoring is complete', created_at: new Date().toISOString(), manifest: manifest(), providers: {}, items: {} };
  const sheets = { full: ['# Lembar penilaian (blind)', ''], nokey: ['# Lembar pemeriksaan kunci (tanpa kunci)', ''] };
  const csv = ['item_id,judge,role,key_correct,alignment,distractors,language,notes'];
  const kcsv = ['item_id,answer'];
  const blinded = [], keycheck = [];
  providers.forEach((p, i) => { sealed.providers[codes[i]] = { folder: p }; });
  for (const b of [1, 2]) {
    const pool = [];
    providers.forEach((p, i) => {
      const f = join(runsDir, p, `bab${b}.json`);
      const raw = existsSync(f) ? readFileSync(f, 'utf8') : '';
      const v = validateResponse(raw, b);
      const code = codes[i];
      sealed.providers[code][`bab${b}`] = { response_sha256: existsSync(f) ? sha(readFileSync(f)) : null, parsed: v.parsed, count: v.count, valid: v.items.filter((x) => x.valid).length, problems: v.problems, per_item: v.items };
      const items = v.parsed ? JSON.parse(raw).items : [];
      v.items.forEach((r) => { if (r.renderable) pool.push({ code, index: r.index, valid: r.valid, it: items[r.index] }); });
    });
    const ch = chapterFacts(b);
    sheets.full.push(`## Bab ${b}: ${ch.c.title}`, '', 'Tujuan: ' + ch.objectives.map((o) => `${o.code} ${o.statement}`).join(' · '), '');
    sheets.nokey.push(`## Bab ${b}`, '');
    shuffle(pool).forEach((e, n) => {
      const id = `B${b}-${String(n + 1).padStart(3, '0')}`;
      sealed.items[id] = { provider: e.code, bab: b, index: e.index, schema_valid: e.valid, key: e.it.key };
      // everything below is rendered from the allowlisted copy only
      const x = blindItem(id, b, e.it); const k = keycheckItem(x);
      blinded.push(x); keycheck.push(k);
      const opts = x.options.map((o) => `   ${o.label}. ${o.body}`);
      sheets.full.push(`### ${id} · tujuan ${x.objective_code}`, '', x.stem, '', ...opts, '',
        `   Kunci: ${x.key}. Alasan: ${x.key_rationale}`,
        ...x.distractors.map((d) => `   Pengecoh ${d.label}: ${d.misconception_code} ${d.misconception}`), '');
      sheets.nokey.push(`### ${id}`, '', k.stem, '', ...k.options.map((o) => `   ${o.label}. ${o.body}`), '', '   Jawaban Anda: ____', '');
      for (const role of ['J1', 'J2']) csv.push(`${id},,${role},,,,,`);
      kcsv.push(`${id},`);
    });
  }
  assertAllowlisted(blinded, BLIND_ITEM_FIELDS, 'reviewer'); assertAllowlisted(keycheck, KEYCHECK_ITEM_FIELDS, 'kunci');
  mkdirSync(join(outDir, 'reviewer'), { recursive: true }); mkdirSync(join(outDir, 'SEALED'), { recursive: true });
  writeFileSync(join(outDir, 'reviewer', 'lembar-penilaian.md'), sheets.full.join('\n') + '\n');
  writeFileSync(join(outDir, 'reviewer', 'items.json'), JSON.stringify(blinded, null, 2) + '\n');
  // Sharon's key check (role K) is blind: K receives only kunci/, records an answer per item, and seals it (seal-key)
  // before any full sheet is opened; the kit, not K, compares the answers with the keys
  mkdirSync(join(outDir, 'kunci'), { recursive: true });
  writeFileSync(join(outDir, 'kunci', 'lembar-kunci-tanpa-kunci.md'), sheets.nokey.join('\n') + '\n');
  writeFileSync(join(outDir, 'kunci', 'jawaban-k-template.csv'), kcsv.join('\n') + '\n');
  writeFileSync(join(outDir, 'kunci', 'items.json'), JSON.stringify(keycheck, null, 2) + '\n');
  writeFileSync(join(outDir, 'reviewer', 'judgements-template.csv'), csv.join('\n') + '\n');
  writeFileSync(join(outDir, 'SEALED', 'map.json'), JSON.stringify(sealed, null, 2) + '\n');
  return sealed;
}

// ───────────────────────────── K's blind answers, sealed before the full sheet is opened
function sealKey(outDir, answersCsv) {
  const sealed = JSON.parse(readFileSync(join(outDir, 'SEALED', 'map.json'), 'utf8'));
  const sp = join(outDir, 'SEALED', 'k-answers.json');
  if (existsSync(sp)) return { ok: false, errors: ['K\'s answers are already sealed; a second seal is refused'] };
  const raw = readFileSync(answersCsv, 'utf8'); const rows = parseCsv(raw); const errors = []; const answers = {};
  for (const r of rows) {
    if (!sealed.items[r.item_id]) errors.push(`unknown item ${r.item_id}`);
    else if (!LABELS.includes(r.answer)) errors.push(`${r.item_id}: answer «${r.answer}» is not A–D`);
    else answers[r.item_id] = r.answer;
  }
  for (const id of Object.keys(sealed.items)) if (!answers[id]) errors.push(`${id}: no answer`);
  if (errors.length) return { ok: false, errors };
  writeFileSync(sp, JSON.stringify({ sealed_at: new Date().toISOString(), file_sha256: sha(raw), answers }, null, 2) + '\n');
  return { ok: true };
}

// ───────────────────────────── scoring
function parseCsv(text) {
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { f += '"'; i++; } else if (c === '"') q = false; else f += c; }
    else if (c === '"') q = true; else if (c === ',') { row.push(f); f = ''; } else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; } else if (c !== '\r') f += c;
  }
  if (f.length || row.length) { row.push(f); rows.push(row); }
  const [h, ...rest] = rows.filter((r) => r.some((x) => x.trim() !== ''));
  return rest.map((r) => Object.fromEntries(h.map((k, i) => [k.trim(), (r[i] ?? '').trim()])));
}
const CRIT = { key_correct: [0, 1], alignment: [0, 2], distractors: [0, 2], language: [0, 2] };

function score(outDir, judgementsCsv, runsDir) {
  const sealed = JSON.parse(readFileSync(join(outDir, 'SEALED', 'map.json'), 'utf8'));
  const rows = parseCsv(readFileSync(judgementsCsv, 'utf8'));
  const by = {}; const errors = [];
  for (const r of rows) {
    if (!sealed.items[r.item_id]) { errors.push(`unknown item ${r.item_id}`); continue; }
    (by[r.item_id] ??= {})[r.role] = r;
  }
  const final = {}; const keyDisagreements = [];
  const kPath = join(outDir, 'SEALED', 'k-answers.json');
  const kSealed = existsSync(kPath) ? JSON.parse(readFileSync(kPath, 'utf8')) : null;
  if (!kSealed) errors.push('Sharon\'s blind key answers are not sealed (node kit.mjs seal-key <out> <answers.csv>)');
  for (const id of Object.keys(sealed.items)) {
    const g = by[id] ?? {}; const f = {};
    for (const [c, [lo, hi]] of Object.entries(CRIT)) {
      const val = (role) => { const x = g[role]?.[c]; if (x === undefined || x === '') return null; const n = Number(x); if (!Number.isInteger(n) || n < lo || n > hi) { errors.push(`${id} ${role} ${c}: ${x} outside ${lo}–${hi}`); return null; } return n; };
      const a = val('J1'), b = val('J2');
      if (a === null || b === null) { errors.push(`${id}: ${c} not judged by both judges`); continue; }
      if (a === b) f[c] = a; else { const r = val('R'); if (r === null) errors.push(`${id}: ${c} judges disagree (${a}/${b}) and no resolver row R`); else f[c] = r; }
    }
    // K's blind answer, sealed earlier, against the item's key: the kit compares, K never sees the key first
    const kAns = kSealed?.answers?.[id];
    if (!kAns) errors.push(`${id}: Sharon's blind key answer (role K) is not sealed`);
    const k = kAns ? (kAns === sealed.items[id].key ? 1 : 0) : null;
    if (f.key_correct !== undefined && k !== null && k !== f.key_correct) keyDisagreements.push({ id, educators: f.key_correct, sharon: k, sharon_answer: kAns, key: sealed.items[id].key });
    f.critical = f.key_correct === 0 || k === 0;
    final[id] = f;
  }
  if (errors.length) return { ok: false, errors };
  const prov = {};
  for (const [code, p] of Object.entries(sealed.providers)) {
    const ids = Object.keys(sealed.items).filter((id) => sealed.items[id].provider === code);
    const expected = 2 * PER_CHAPTER;
    const valid = (p.bab1?.valid ?? 0) + (p.bab2?.valid ?? 0);
    const edu = ids.reduce((s, id) => s + (final[id].critical ? 0 : final[id].key_correct) + final[id].alignment + final[id].distractors + final[id].language, 0);
    const critical = ids.filter((id) => final[id].critical);
    let cost = null, model = null;
    const uf = join(runsDir, p.folder, 'usage.json');
    let provenance = ['usage.json missing'];
    if (existsSync(uf)) { const u = JSON.parse(readFileSync(uf, 'utf8')); model = `${u.model} (${u.model_date})`;
      provenance = PROVENANCE.filter((k) => u[k] === undefined || u[k] === null || u[k] === '').concat(
        (u.calls ?? []).some((c) => !c.request_id) ? ['a call without request_id'] : []); cost = u.calls.reduce((s, c) => s + c.input_tokens * u.price_per_mtok.input / 1e6 + c.output_tokens * u.price_per_mtok.output / 1e6, 0); }
    prov[code] = { provenance_missing: provenance, judged: ids.length, expected, missing_or_unrenderable: expected - ids.length, valid, valid_rate: valid / expected, edu, edu_max: expected * 7, critical, cost, model, folder: p.folder };
  }
  const eligible = Object.entries(prov).filter(([, v]) => v.critical.length <= 1);
  const ranking = eligible.sort(([, a], [, b]) => b.edu - a.edu || b.valid_rate - a.valid_rate || (a.cost ?? Infinity) - (b.cost ?? Infinity)).map(([c]) => c);
  return { ok: true, prov, final, keyDisagreements, ranking, notRecommended: Object.keys(prov).filter((c) => prov[c].critical.length > 1) };
}
function resultsMarkdown(s, sealed) {
  const L = ['# C3 · blind evaluation results', '', `Prompt ${sealed.manifest.prompt_version} (${sealed.manifest.prompt_sha256.slice(0, 12)}), schema ${sealed.manifest.schema_sha256.slice(0, 12)}.`, '',
    '| Code | Judged / 30 | Schema-valid | Educational score | Critical key errors | Billed cost (USD) | Provenance | Decision rule |', '|---|---|---|---|---|---|---|---|'];
  for (const [c, v] of Object.entries(s.prov).sort()) L.push(`| ${c} | ${v.judged} | ${v.valid}/30 (${Math.round(v.valid_rate * 100)}%) | ${v.edu}/${v.edu_max} | ${v.critical.length}${v.critical.length ? ': ' + v.critical.join(', ') : ''} | ${v.cost === null ? 'not recorded' : v.cost.toFixed(4)} | ${v.provenance_missing.length ? '**incomplete:** ' + v.provenance_missing.join(', ') : 'complete'} | ${v.critical.length > 1 ? '**not recommended** (>1 critical)' : 'eligible'} |`);
  L.push('', `**Ranking of eligible providers** (educational score, then validity, then cost): ${s.ranking.join(' > ') || 'none'}.`, '');
  if (s.keyDisagreements.length) L.push('**Key checks where Sharon and the educators differ** (counted as critical; for the owner):', ...s.keyDisagreements.map((d) => `- ${d.id}: educators ${d.educators}, Sharon ${d.sharon}`), '');
  L.push('## Blinding map (revealed last)', '', ...Object.entries(s.prov).sort().map(([c, v]) => `- ${c} = ${v.folder}${v.model ? `, ${v.model}` : ''}`), '');
  return L.join('\n');
}
function cmdScore(outDir, csv, runsDir) {
  const s = score(outDir, csv, runsDir);
  if (!s.ok) die('score refused:\n' + s.errors.map((e) => '- ' + e).join('\n'));
  const md = resultsMarkdown(s, JSON.parse(readFileSync(join(outDir, 'SEALED', 'map.json'), 'utf8')));
  writeFileSync(join(outDir, 'C3-EVALUATION-RESULTS.draft.md'), md); console.log(md);
}

// ───────────────────────────── selftest: the pipeline on planted cases, no provider
function asResponse(b, mutate) {
  const { lessons } = chapterFacts(b);
  const items = [];
  lessons.forEach((l, li) => l.items.forEach((it) => {
    if (it.item_type !== 'MCQ_SINGLE' || it.options.length !== 4) return;
    const key = it.options.find((o) => o.is_correct).label;
    items.push({ stem: it.stem, options: it.options.map((o) => ({ label: o.label, body: o.body })), key,
      distractors: it.options.filter((o) => !o.is_correct).map((o) => ({ label: o.label, misconception_code: o.misconception_code ?? 'BARU', misconception: o.rationale })),
      objective_code: `B${b}-T${li + 1}`, key_rationale: it.options.find((o) => o.is_correct).rationale });
  }));
  const r = { items: items.slice(0, PER_CHAPTER) };
  if (r.items.length !== PER_CHAPTER) throw new Error(`selftest: chapter ${b} has ${r.items.length} usable items`);
  return JSON.stringify(mutate ? mutate(r) : r);
}
// Blind strips identifying fields: plant every kind of field a provider response or the runner's records could carry
// (model id, provider name, request and response ids, headers, usage and token counts, timestamps, fingerprints),
// at the top level, in items, options and distractors, and in the files beside the responses. Then check the blinded
// output against the ALLOWLIST of item fields (not a denylist alone), and that no planted value survives anywhere in
// what the judges and Sharon receive.
function blindStripTest(t, check) {
  const runs = join(t, 'runs-planted'), out = join(t, 'out-planted');
  const S = 'ZQXSENTINEL';   // every planted value carries this marker
  const plant = (r, tag) => {
    Object.assign(r, { id: `resp_${S}_${tag}`, object: 'response', model: `${S}-model-${tag}`, provider: `${S}-provider-${tag}`, system_fingerprint: `fp_${S}`,
      created: 1763276400, created_at: '2026-11-16T07:00:00Z', request_id: `req_${S}`, headers: { 'x-request-id': `req_${S}`, 'request-id': `req_${S}`, 'openai-organization': S },
      usage: { input_tokens: 777001, output_tokens: 777002, total_tokens: 777003, cache_read_input_tokens: 777004 }, stop_reason: `${S}_stop` });
    r.items.forEach((it, i) => {
      Object.assign(it, { model: `${S}-model`, model_version: `${S}@v`, response_id: `resp_${S}_${i}`, request_id: `req_${S}_${i}`, provider: S, usage: { output_tokens: 777100 + i },
        timestamp: '2026-11-16T07:00:01Z', headers: { 'retry-after': S }, _meta: { provider: S, model: S }, [`x-${S}`]: S });
      it.options.forEach((o) => { o.provider = S; o.model = S; });
      it.distractors.forEach((d) => { d.request_id = S; d.usage = { tokens: 777200 }; });
    });
    return r;
  };
  for (const [folder, tag] of [[`${S}FOLDERA`, 'a'], [`${S}FOLDERB`, 'b']]) {
    const d = join(runs, folder); mkdirSync(join(d, 'attempts'), { recursive: true });
    for (const b of [1, 2]) {
      writeFileSync(join(d, `bab${b}.json`), asResponse(b, (r) => plant(r, tag)));
      writeFileSync(join(d, `bab${b}.provenance.json`), JSON.stringify({ model: S, provider: S, request_id: S, run_at: '2026-11-16T07:00:00Z' }));
      writeFileSync(join(d, 'attempts', `bab${b}.a1.json`), JSON.stringify({ model: S }));
    }
    writeFileSync(join(d, 'usage.json'), JSON.stringify({ model: S, model_date: S, calls: [{ request_id: S, input_tokens: 777300, output_tokens: 777301 }] }));
  }
  cmdBlind(runs, out);
  const files = [];
  const walk = (dir) => { for (const e of readdirSync(dir, { withFileTypes: true })) { const p = join(dir, e.name); if (e.isDirectory()) walk(p); else files.push(p); } };
  walk(join(out, 'reviewer')); walk(join(out, 'kunci'));
  const rel = files.map((f) => f.slice(out.length + 1)).sort();
  check(eq(rel, BLIND_FILES), `blind writes only its own files to reviewer/ and kunci/ (${BLIND_FILES.join(', ')}): no provenance, usage or attempt file is copied`);
  const items = existsSync(join(out, 'reviewer', 'items.json')) ? JSON.parse(readFileSync(join(out, 'reviewer', 'items.json'), 'utf8')) : [];
  const kitems = existsSync(join(out, 'kunci', 'items.json')) ? JSON.parse(readFileSync(join(out, 'kunci', 'items.json'), 'utf8')) : [];
  check(items.length === 60 && kitems.length === 60, 'the planted responses are still blinded (renderable): 60 items for the judges, 60 for the key check');
  check(items.length > 0 && items.every((it) => eq(Object.keys(it), BLIND_ITEM_FIELDS) && it.options.every((o) => eq(Object.keys(o), BLIND_OPTION_FIELDS)) && it.distractors.every((d) => eq(Object.keys(d), BLIND_DISTRACTOR_FIELDS))),
    `judges' items.json holds exactly the allowlisted fields, at every level: item ${BLIND_ITEM_FIELDS.join(', ')}; option ${BLIND_OPTION_FIELDS.join(', ')}; distractor ${BLIND_DISTRACTOR_FIELDS.join(', ')}`);
  check(kitems.length > 0 && kitems.every((it) => eq(Object.keys(it), KEYCHECK_ITEM_FIELDS) && it.options.every((o) => eq(Object.keys(o), BLIND_OPTION_FIELDS))), `key-check items.json holds exactly ${KEYCHECK_ITEM_FIELDS.join(', ')} (no key, rationale or distractor)`);
  check(items.every((it) => Object.values(it).every((v) => typeof v === 'string' || typeof v === 'number' || Array.isArray(v))), 'every blinded value is a plain string, number or array of allowlisted objects (no nested object passes through)');
  const all = files.map((f) => readFileSync(f, 'utf8')).join('\n');
  check(!all.includes(S) && !/77700\d|7771\d\d|7772\d\d|7773\d\d/.test(all), 'no planted value survives in any file the judges or Sharon receive: model, provider, request/response ids, headers, usage/token counts, fingerprint, folder names');
  check(!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(all) && !/1763276400/.test(all), 'no timestamp survives in the blinded files');
  check(!/"(model|model_version|provider|request_id|response_id|id|object|headers|usage|[a-z_]*tokens?|created|created_at|timestamp|system_fingerprint|stop_reason|_meta)"\s*:/.test(all), 'no identifying field name appears as a key in the blinded JSON (denylist, as a second check beside the allowlist)');
  let threw = false; try { assertAllowlisted([{ ...items[0], model: 'x' }], BLIND_ITEM_FIELDS, 'reviewer'); } catch { threw = true; }
  let threwNested = false; try { assertAllowlisted([{ ...items[0], options: [{ label: 'A', body: 'x', provider: 'x' }] }], BLIND_ITEM_FIELDS, 'reviewer'); } catch { threwNested = true; }
  check(threw && threwNested, 'the allowlist guard that runs before any blinded file is written refuses an extra field, top-level or nested');
}

function cmdSelftest() {
  const t = mkdtempSync(join(tmpdir(), 'c3-eval-')); const runs = join(t, 'runs'), out = join(t, 'out');
  const fails = []; const check = (ok, m) => { if (!ok) fails.push(m); console.log(`${ok ? 'PASS' : 'FAIL'}  ${m}`); };
  // requests are byte-identical and stable
  const m = manifest();
  for (const b of [1, 2]) {
    check(sha(materialText(b)) === m.chapters[`bab${b}`].material_sha256, `bab${b}: material regenerates byte-identical to the frozen file`);
    check(sha(requestText(b)) === m.chapters[`bab${b}`].request_sha256, `bab${b}: request bytes match the manifest`);
    check(!/is_correct|"key"|Kunci/.test(requestText(b)), `bab${b}: the request carries no item, option key or answer`);
  }
  // validation
  const good = asResponse(1);
  check(validateResponse(good, 1).items.every((x) => x.valid), 'a well-formed response validates 15/15');
  check(!validateResponse('```json\n' + good + '\n```', 1).parsed, 'a fenced (wrapped) response is measured invalid, not repaired');
  const bad = JSON.parse(good); bad.items[0].distractors.pop(); bad.items[1].options[3].body = bad.items[1].options[2].body; bad.items[2].objective_code = 'B9-T9';
  const vb = validateResponse(JSON.stringify(bad), 1);
  check(!vb.items[0].valid && !vb.items[1].valid && !vb.items[2].valid && vb.items[3].valid, 'missing distractor, duplicate option, unknown objective are each caught per item');
  // three providers: X control, Y two planted wrong keys + one dropped item + one invalid, Z fine
  const mk = (name, b, mut) => { mkdirSync(join(runs, name), { recursive: true }); writeFileSync(join(runs, name, `bab${b}.json`), asResponse(b, mut)); };
  for (const b of [1, 2]) { mk('x', b); mk('z', b); }
  // a wrong key that is still schema-valid: the key moves to a wrong option, whose distractor row moves to the old key
  const flip = (it) => { const to = it.key === 'A' ? 'B' : 'A'; const d = it.distractors.find((x) => x.label === to); d.label = it.key; it.key = to; };
  mk('y', 1, (r) => { flip(r.items[0]); flip(r.items[4]); r.items.pop(); r.items[1].distractors = []; return r; });
  mk('y', 2);
  writeFileSync(join(runs, 'x', 'usage.json'), JSON.stringify({ model: 'control', model_date: '2026-11-09', endpoint: 'offline', api_version: 'none', run_at: '2026-11-09T00:00:00Z', run_by: 'selftest', generation: { temperature: 1, max_tokens: 8000, system_prompt: '' }, data_retention: 'none (offline)', price_per_mtok: { input: 2, output: 10 }, calls: [{ bab: 1, request_id: 'r1', input_tokens: 3000, output_tokens: 1000 }, { bab: 2, request_id: 'r2', input_tokens: 3000, output_tokens: 1000 }] }));
  const sealed = cmdBlind(runs, out);
  const sheet = readFileSync(join(out, 'reviewer', 'lembar-penilaian.md'), 'utf8') + readFileSync(join(out, 'reviewer', 'judgements-template.csv'), 'utf8');
  check(!/\bx\b|\by\b|\bz\b|control/.test(sheet.replace(/B\d-\d{3}/g, '')), 'reviewer files carry no provider folder or model name');
  const codeOf = (f) => Object.entries(sealed.providers).find(([, v]) => v.folder === f)[0];
  check(Object.values(sealed.items).filter((i) => i.provider === codeOf('y')).length === 29, 'Y\'s dropped item is absent from the sheets (29 judged)');
  // judgements: everyone agrees all good, except Y's two flipped keys (wrong), one disagreement resolved by R
  const lines = ['item_id,judge,role,key_correct,alignment,distractors,language,notes']; const kLines = ['item_id,answer'];
  const flipped = new Set(Object.entries(sealed.items).filter(([, i]) => i.provider === codeOf('y') && i.bab === 1 && (i.index === 0 || i.index === 4)).map(([id]) => id));
  let first = true;
  for (const id of Object.keys(sealed.items)) {
    const k = flipped.has(id) ? 0 : 1;
    lines.push(`${id},e1,J1,${k},2,2,2,`, `${id},e2,J2,${k},${first ? 1 : 2},2,2,"ok, natural"`);
    // K solved Y's two flipped items from the stem: their answer is the true one, not the item's (wrong) key
    const key = sealed.items[id].key; kLines.push(`${id},${flipped.has(id) ? (key === 'A' ? 'B' : 'A') : key}`);
    if (first) { lines.push(`${id},e3,R,${k},2,,,resolved`); first = false; }
  }
  writeFileSync(join(t, 'j.csv'), lines.join('\n') + '\n');
  check(!score(out, join(t, 'j.csv'), runs).ok, 'scoring refuses before Sharon\'s blind key answers are sealed');
  writeFileSync(join(t, 'k-bad.csv'), kLines.slice(0, -1).join('\n') + '\n');
  check(!sealKey(out, join(t, 'k-bad.csv')).ok, 'sealing refuses a key sheet with an item unanswered');
  writeFileSync(join(t, 'k.csv'), kLines.join('\n') + '\n');
  check(sealKey(out, join(t, 'k.csv')).ok, 'K\'s complete blind answers are sealed');
  check(!sealKey(out, join(t, 'k.csv')).ok, 'a second seal is refused (answers cannot be changed after the full sheet opens)');
  check(!/Kunci:|Pengecoh/.test(readFileSync(join(out, 'kunci', 'lembar-kunci-tanpa-kunci.md'), 'utf8')) && !existsSync(join(out, 'kunci', 'lembar-penilaian.md')),
    'K\'s folder holds only the stem and options, never the full sheet');
  const s = score(out, join(t, 'j.csv'), runs);
  check(s.ok, 'scoring accepts a complete judgement set with one resolved disagreement' + (s.ok ? '' : ': ' + s.errors.slice(0, 3).join('; ')));
  if (s.ok) {
    check(s.notRecommended.includes(codeOf('y')) && s.prov[codeOf('y')].critical.length === 2, 'Y, with 2 critical keys, is not recommended');
    check(s.prov[codeOf('y')].valid === 28 && s.prov[codeOf('x')].valid === 30, 'validity: Y 28/30 (one dropped, one invalid), X 30/30');
    check(s.prov[codeOf('x')].cost.toFixed(2) === '0.03', 'cost: X 2 × (3K × $2/M + 1K × $10/M) = $0.032');
    check(s.ranking.length === 2 && !s.ranking.includes(codeOf('y')), 'ranking holds only the eligible providers');
    check(s.prov[codeOf('x')].provenance_missing.length === 0 && s.prov[codeOf('y')].provenance_missing.includes('usage.json missing'),
      'provenance: X\'s run is complete; Y\'s missing usage.json is reported');
    const mapNow = JSON.parse(readFileSync(join(out, 'SEALED', 'map.json'), 'utf8'));
    check(mapNow.providers[codeOf('x')].bab1.response_sha256 === sha(readFileSync(join(runs, 'x', 'bab1.json'))),
      'each raw response is hashed when sealed, so «unmodified» can be checked');
  }
  writeFileSync(join(t, 'j2.csv'), lines.filter((l) => !/,R,/.test(l)).join('\n') + '\n');
  check(!score(out, join(t, 'j2.csv'), runs).ok, 'scoring refuses a disagreement with no resolver');
  blindStripTest(t, check);
  console.log(`\n${fails.length ? fails.length + ' FAILED' : 'all passed'} (scratch: ${t})`);
  process.exit(fails.length ? 1 : 0);
}

const [cmd, a1, a2, a3] = process.argv.slice(2);
if (cmd === 'material') cmdMaterial();
else if (cmd === 'request') process.stdout.write(requestText(Number(a1)));
else if (cmd === 'validate') console.log(JSON.stringify(validateResponse(readFileSync(a1, 'utf8'), Number(a2)), null, 2));
else if (cmd === 'blind') { cmdBlind(a1, a2); console.log(`educators: ${join(a2, 'reviewer')}; Sharon (key check): ${join(a2, 'kunci')} only; ${join(a2, 'SEALED')}: nobody`); }
else if (cmd === 'seal-key') { const r = sealKey(a1, a2); if (!r.ok) die('seal-key refused:\n' + r.errors.map((e) => '- ' + e).join('\n')); console.log('sealed'); }
else if (cmd === 'score') cmdScore(a1, a2, a3);
else if (cmd === 'selftest') cmdSelftest();
else die('usage: node kit.mjs material | request <1|2> | validate <file> <1|2> | blind <runs> <out> | seal-key <out> <answers.csv> | score <out> <csv> <runs> | selftest');
