#!/usr/bin/env node
// C3 scoring: E-DECISION-PACK.md §4.1–§4.3a and §4.5, for ONE provider code at a time. Dependency-free; no network.
//
//   node score.mjs <sheets.json> <flags.json> --flags-sha256 <64-hex> [--json]
//   node score.mjs --self-test
//
// The flags file is Sharon's blind key flags. Its SHA-256 is committed BEFORE she sees any judge's score (pack §4.2,
// condition 1). The expected hash is passed with --flags-sha256. On a mismatch, or without it, scoring is refused.
//
// ── Input 1: the judge sheets for one provider code (JSON), format "c3-judge-sheets/1"
//   {
//     "format": "c3-judge-sheets/1",
//     "provider_code": "A",                       the blinded code, never a provider name
//     "items": [                                  exactly 30 slots: 15 for chapter 1 and 15 for chapter 2
//       { "item_id": "B1-001", "chapter": 1, "status": "valid" },
//       { "item_id": "A-B2-missing-01", "chapter": 2, "status": "missing" },    no draft for this slot (§4.1)
//       { "item_id": "B1-007", "chapter": 1, "status": "malformed" }            fails the item schema (§4.1)
//     ],
//     "scores": [                                 one row per judge per item; judge is J1, J2 or J3 (the third educator)
//       { "item_id": "B1-001", "judge": "J1", "correctness": 1, "alignment": 2, "distractors": 1,
//         "language": 2, "review_burden": 2, "reason": "free text" }
//     ]
//   }
//   - J1 and J2 must score all five criteria on every valid item: correctness 0/1, the other four integers 0–2.
//   - J3 scores only what is sent to them: correctness when J1 and J2 disagree or the item is flagged, and a 0–2
//     criterion when J1 and J2 are 2 apart. J3 may leave the others out. A J3 score that no rule uses is ignored and
//     reported as a warning.
//   - Missing and malformed slots carry no scores; any scores given for them are ignored, with a warning.
//
// ── Input 2: Sharon's flags (JSON), format "c3-key-flags/1"
//   { "format": "c3-key-flags/1", "flags": [ { "item_id": "B1-004", "reason": "the key should be C: ..." } ] }
//   - One file covers every provider's items (Sharon is blind to the provider). Flags on another code's items are
//     not counted here.
//   - Every flag states a reason (condition 2). A flag without one, a duplicate flag, or a flag on a missing or
//     malformed slot makes the file invalid and scoring is refused.
//
// ── Resolution (pack §4.2)
//   correctness: J1 = J2 and not flagged → that score. J1 ≠ J2, or flagged → J3's correctness, final.
//                A flag is UPHELD when J3 scores correctness 0 (the key is wrong) and REJECTED when J3 scores 1.
//   0–2 criteria: gap 0 → the score; gap 1 → the average (x.5); gap 2 → the median of J1, J2 and J3.
//   missing or malformed slot → 0 on every criterion, not accepted, not critical (§4.1).
//   critical: a valid item whose resolved correctness is 0 (a wrong key).
//   accepted: resolved correctness 1 AND resolved review burden ≥ 1 (§4.3a Q1, §4.5).
// ── Qualification (pack §4.3, §4.3a), all on the one resolved table
//   critical ≤ 1; Q1: accepted ≥ 24 of 30; Q2: each 0–2 criterion's mean over the 30 slots ≥ 1.0.
//   The verdict covers the scoring rules only. The contract, security and operational checks (ruling 40) are separate.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

// ───────────────────────────── thresholds (constants)
export const DENOMINATOR = 30;                 // always 30 per provider (§4.1)
export const PER_CHAPTER = 15;
export const CHAPTERS = [1, 2];
export const CRITICAL_MAX = 1;                 // the plan's rule (§4.3): no more than 1 critical key error in 30
export const ACCEPT_REVIEW_BURDEN_MIN = 1;     // accepted: review burden 1 or 2 after resolution (§4.3a, §4.5)
export const Q1_ACCEPTED_MIN = 24;             // PROPOSED (§4.3a), awaiting owner approval; not frozen
export const Q2_MEAN_MIN = 1.0;                // PROPOSED (§4.3a), awaiting owner approval; not frozen
export const THRESHOLD_STATUS = {
  critical: 'adopted (plan rule, §4.3)',
  Q1: 'PROPOSED (E-DECISION-PACK §4.3a), awaiting owner approval',
  Q2: 'PROPOSED (E-DECISION-PACK §4.3a), awaiting owner approval',
};
export const CRITERIA_02 = ['alignment', 'distractors', 'language', 'review_burden'];
const JUDGES = ['J1', 'J2', 'J3'];
const STATUSES = ['valid', 'missing', 'malformed'];
const SHEETS_FORMAT = 'c3-judge-sheets/1';
const FLAGS_FORMAT = 'c3-key-flags/1';

const sha256 = (b) => createHash('sha256').update(b).digest('hex');
const median3 = (a, b, c) => [a, b, c].sort((x, y) => x - y)[1];
// a mean threshold checked on the sum, so 30/30 is exactly 1.0 and no float division decides a pass
export const meetsMean = (sum, n, min) => sum >= min * n;

// ───────────────────────────── the flags file and its committed hash
export function verifyFlagsBytes(bytes, expected) {
  if (typeof expected !== 'string' || !/^[0-9a-f]{64}$/.test(expected)) return { ok: false, errors: ['an expected flags SHA-256 (64 lowercase hex characters, committed before scoring) is required'] };
  const got = sha256(bytes);
  if (got !== expected) return { ok: false, errors: [`flags file SHA-256 ${got} does not match the committed ${expected}: refused`] };
  return { ok: true, sha256: got };
}

function parseFlags(doc) {
  const errors = []; const flags = new Map();
  if (!doc || doc.format !== FLAGS_FORMAT || !Array.isArray(doc.flags)) return { errors: [`flags: not a ${FLAGS_FORMAT} document with a flags array`] };
  for (const [i, f] of doc.flags.entries()) {
    if (!f || typeof f.item_id !== 'string' || !f.item_id) { errors.push(`flags[${i}]: no item_id`); continue; }
    if (typeof f.reason !== 'string' || !f.reason.trim()) errors.push(`flag ${f.item_id}: no reason (every flag states its reason)`);
    if (flags.has(f.item_id)) errors.push(`flag ${f.item_id}: flagged twice`);
    flags.set(f.item_id, f);
  }
  return { errors, flags };
}

// ───────────────────────────── scoring
function readScore(row, crit, errors, where, required) {
  const v = row?.[crit];
  if (v === undefined || v === null || v === '') { if (required) errors.push(`${where}: ${crit} missing`); return null; }
  const hi = crit === 'correctness' ? 1 : 2;
  if (!Number.isInteger(v) || v < 0 || v > hi) { errors.push(`${where}: ${crit} ${JSON.stringify(v)} is not an integer 0–${hi}`); return null; }
  return v;
}

export function scoreProvider(sheets, flagsDoc) {
  const errors = []; const warnings = [];
  if (!sheets || sheets.format !== SHEETS_FORMAT) return { ok: false, errors: [`sheets: not a ${SHEETS_FORMAT} document`] };
  if (typeof sheets.provider_code !== 'string' || !sheets.provider_code) errors.push('sheets: no provider_code');
  const items = Array.isArray(sheets.items) ? sheets.items : [];
  if (items.length !== DENOMINATOR) errors.push(`sheets: ${items.length} item slots; the denominator is always ${DENOMINATOR}`);
  const byId = new Map();
  for (const [i, it] of items.entries()) {
    if (!it || typeof it.item_id !== 'string' || !it.item_id) { errors.push(`items[${i}]: no item_id`); continue; }
    if (byId.has(it.item_id)) errors.push(`items: ${it.item_id} appears twice`);
    if (!CHAPTERS.includes(it.chapter)) errors.push(`${it.item_id}: chapter ${JSON.stringify(it.chapter)} is not 1 or 2`);
    if (!STATUSES.includes(it.status)) errors.push(`${it.item_id}: status ${JSON.stringify(it.status)} is not ${STATUSES.join(', ')}`);
    byId.set(it.item_id, it);
  }
  for (const b of CHAPTERS) { const n = items.filter((x) => x?.chapter === b).length; if (n !== PER_CHAPTER) errors.push(`sheets: chapter ${b} has ${n} slots, not ${PER_CHAPTER}`); }

  const rows = {};
  for (const [i, r] of (Array.isArray(sheets.scores) ? sheets.scores : []).entries()) {
    if (!r || !byId.has(r.item_id)) { errors.push(`scores[${i}]: unknown item ${r?.item_id}`); continue; }
    if (!JUDGES.includes(r.judge)) { errors.push(`scores[${i}]: judge ${JSON.stringify(r.judge)} is not J1, J2 or J3`); continue; }
    rows[r.item_id] ??= {};
    if (rows[r.item_id][r.judge]) errors.push(`${r.item_id}: two rows for ${r.judge}`);
    rows[r.item_id][r.judge] = r;
  }

  const pf = parseFlags(flagsDoc);
  if (pf.errors.length) errors.push(...pf.errors);
  const flags = pf.flags ?? new Map();
  for (const id of flags.keys()) if (byId.has(id) && byId.get(id).status !== 'valid') errors.push(`flag ${id}: the slot is ${byId.get(id).status}; it was never shown, so it cannot be flagged`);
  if (errors.length) return { ok: false, errors };

  const table = []; const flagItems = [];
  for (const it of items) {
    const id = it.item_id; const g = rows[id] ?? {};
    const row = { item_id: id, chapter: it.chapter, status: it.status, flagged: flags.has(id), via: {} };
    if (it.status !== 'valid') {
      if (Object.keys(g).length) warnings.push(`${id}: ${it.status} slot; its judge rows are ignored (it scores 0)`);
      row.correctness = 0; for (const c of CRITERIA_02) row[c] = 0;
      for (const c of ['correctness', ...CRITERIA_02]) row.via[c] = it.status;
      row.critical = false; row.accepted = false; table.push(row); continue;
    }
    for (const j of ['J1', 'J2']) if (!g[j]) errors.push(`${id}: no ${j} row`);
    const usedJ3 = new Set();
    // correctness
    const c1 = readScore(g.J1, 'correctness', errors, `${id} J1`, true), c2 = readScore(g.J2, 'correctness', errors, `${id} J2`, true);
    if (c1 !== null && c2 !== null) {
      if (c1 === c2 && !row.flagged) { row.correctness = c1; row.via.correctness = 'agreed'; }
      else {
        const c3 = readScore(g.J3, 'correctness', errors, `${id} J3`, true);
        if (c3 === null) errors[errors.length - 1] += ` (${row.flagged ? 'flagged by Sharon' : `judges disagree ${c1}/${c2}`}: the third educator decides)`;
        else { row.correctness = c3; row.via.correctness = row.flagged ? (c1 === c2 ? 'third (flag)' : 'third (disagreement and flag)') : 'third (disagreement)'; usedJ3.add('correctness'); }
      }
    }
    if (row.flagged && row.correctness !== undefined) {
      const f = { item_id: id, reason: flags.get(id).reason, judges: [c1, c2], third: row.correctness, upheld: row.correctness === 0 };
      flagItems.push(f);
    }
    // the 0–2 criteria
    for (const c of CRITERIA_02) {
      const a = readScore(g.J1, c, errors, `${id} J1`, true), b = readScore(g.J2, c, errors, `${id} J2`, true);
      if (a === null || b === null) continue;
      const gap = Math.abs(a - b);
      if (gap === 0) { row[c] = a; row.via[c] = 'agreed'; }
      else if (gap === 1) { row[c] = (a + b) / 2; row.via[c] = 'average'; }
      else {
        const t = readScore(g.J3, c, errors, `${id} J3`, true);
        if (t === null) errors[errors.length - 1] += ` (judges 2 apart ${a}/${b}: the third educator also scores it)`;
        else { row[c] = median3(a, b, t); row.via[c] = 'median of three'; usedJ3.add(c); }
      }
    }
    if (g.J3) for (const c of ['correctness', ...CRITERIA_02]) if (g.J3[c] !== undefined && g.J3[c] !== null && g.J3[c] !== '' && !usedJ3.has(c)) warnings.push(`${id}: J3's ${c} is not used by any rule (ignored)`);
    row.critical = row.correctness === 0;
    row.accepted = row.correctness === 1 && row.review_burden >= ACCEPT_REVIEW_BURDEN_MIN;
    table.push(row);
  }
  if (errors.length) return { ok: false, errors };

  const critical_items = table.filter((r) => r.critical).map((r) => r.item_id);
  const accepted = table.filter((r) => r.accepted).length;
  const per = {};
  for (const c of CRITERIA_02) { const sum = table.reduce((s, r) => s + r[c], 0); per[c] = { sum, mean: sum / DENOMINATOR, pass: meetsMean(sum, DENOMINATOR, Q2_MEAN_MIN) }; }
  const critical = { max: CRITICAL_MAX, count: critical_items.length, items: critical_items, pass: critical_items.length <= CRITICAL_MAX, status: THRESHOLD_STATUS.critical };
  const q1 = { threshold: Q1_ACCEPTED_MIN, of: DENOMINATOR, accepted, pass: accepted >= Q1_ACCEPTED_MIN, status: THRESHOLD_STATUS.Q1 };
  const q2 = { threshold: Q2_MEAN_MIN, per_criterion: per, pass: CRITERIA_02.every((c) => per[c].pass), status: THRESHOLD_STATUS.Q2 };
  const upheld = flagItems.filter((f) => f.upheld).length;
  return {
    ok: true, provider_code: sheets.provider_code, denominator: DENOMINATOR,
    counts: Object.fromEntries(STATUSES.map((s) => [s, table.filter((r) => r.status === s).length])),
    table, critical, q1, q2,
    qualifies: critical.pass && q1.pass && q2.pass,
    verdict_scope: 'scoring rules only (§4.3 critical, Q1, Q2); the contract, security and operational checks (ruling 40) are separate',
    flags: { raised: flagItems.length, upheld, rejected: flagItems.length - upheld, items: flagItems, outside_this_code: [...flags.keys()].filter((id) => !byId.has(id)).length },
    warnings,
  };
}

// verify the flags bytes, then score: the hash check comes first, so a mismatched file is never read for scores
export function scoreFiles(sheetsPath, flagsPath, expectedFlagsSha) {
  const bytes = readFileSync(flagsPath);
  const v = verifyFlagsBytes(bytes, expectedFlagsSha);
  if (!v.ok) return v;
  let sheets, flagsDoc;
  try { sheets = JSON.parse(readFileSync(sheetsPath, 'utf8')); } catch (e) { return { ok: false, errors: [`sheets: not JSON: ${e.message}`] }; }
  try { flagsDoc = JSON.parse(bytes.toString('utf8')); } catch (e) { return { ok: false, errors: [`flags: not JSON: ${e.message}`] }; }
  const s = scoreProvider(sheets, flagsDoc);
  return s.ok ? { ...s, flags_sha256: v.sha256 } : s;
}

const fmt = (x) => (Number.isInteger(x) ? String(x) : x.toFixed(1));
export function report(s) {
  const L = [`Provider code ${s.provider_code}: ${s.denominator} slots (valid ${s.counts.valid}, missing ${s.counts.missing}, malformed ${s.counts.malformed}); flags file ${s.flags_sha256 ?? '(not checked)'}`, '',
    '| Item | Ch | Status | Flag | Correct | Align | Distr | Lang | Burden | Critical | Accepted |', '|---|---|---|---|---|---|---|---|---|---|---|'];
  for (const r of s.table) L.push(`| ${r.item_id} | ${r.chapter} | ${r.status} | ${r.flagged ? 'yes' : ''} | ${r.correctness} (${r.via.correctness}) | ${CRITERIA_02.map((c) => `${fmt(r[c])} (${r.via[c]})`).join(' | ')} | ${r.critical ? '**yes**' : ''} | ${r.accepted ? 'yes' : ''} |`);
  L.push('', `Critical (resolved wrong key): ${s.critical.count} (max ${s.critical.max}) → ${s.critical.pass ? 'pass' : 'FAIL'}${s.critical.items.length ? ': ' + s.critical.items.join(', ') : ''}`,
    `Q1 [${s.q1.status}]: accepted ${s.q1.accepted}/${s.q1.of} (min ${s.q1.threshold}) → ${s.q1.pass ? 'pass' : 'FAIL'}`,
    `Q2 [${s.q2.status}]: ${CRITERIA_02.map((c) => `${c} ${s.q2.per_criterion[c].mean.toFixed(3)} (${fmt(s.q2.per_criterion[c].sum)}/${s.denominator}) ${s.q2.per_criterion[c].pass ? 'pass' : 'FAIL'}`).join('; ')} (min ${s.q2.threshold.toFixed(1)} each)`,
    `Sharon's flags: raised ${s.flags.raised}, upheld ${s.flags.upheld}, rejected ${s.flags.rejected}`,
    ...s.flags.items.map((f) => `- ${f.item_id}: judges ${f.judges.join('/')}, third educator ${f.third} → ${f.upheld ? 'upheld' : 'rejected'}. Reason: ${f.reason}`),
    '', `Verdict: ${s.qualifies ? 'QUALIFIES' : 'DOES NOT QUALIFY'} on the ${s.verdict_scope}.`,
    ...(s.warnings.length ? ['', 'Warnings:', ...s.warnings.map((w) => '- ' + w)] : []));
  return L.join('\n');
}

// ───────────────────────────── self-test (offline)
function selfTest() {
  const fails = []; let passes = 0;
  const check = (ok, m) => { if (ok) passes++; else fails.push(m); console.log(`${ok ? 'PASS' : 'FAIL'}  ${m}`); };
  const ids = CHAPTERS.flatMap((b) => Array.from({ length: PER_CHAPTER }, (_, i) => `B${b}-${String(i + 1).padStart(3, '0')}`));
  const perfect = { correctness: 1, alignment: 2, distractors: 2, language: 2, review_burden: 2 };
  // a sheet where both judges give every item a perfect score; edit(id) may return { status, J1, J2, J3 } overrides
  const sheet = (edit = () => ({})) => {
    const s = { format: SHEETS_FORMAT, provider_code: 'Q', items: [], scores: [] };
    for (const id of ids) {
      const e = edit(id) ?? {};
      s.items.push({ item_id: id, chapter: Number(id[1]), status: e.status ?? 'valid' });
      if ((e.status ?? 'valid') !== 'valid' && !e.keepRows) continue;
      for (const j of ['J1', 'J2']) s.scores.push({ item_id: id, judge: j, ...perfect, ...(e[j] ?? {}), reason: 'uji' });
      if (e.J3) s.scores.push({ item_id: id, judge: 'J3', ...e.J3, reason: 'uji' });
    }
    return s;
  };
  const noFlags = { format: FLAGS_FORMAT, flags: [] };
  const flagsOn = (...xs) => ({ format: FLAGS_FORMAT, flags: xs.map((id) => ({ item_id: id, reason: 'kunci tampaknya salah (uji)' })) });
  const at = (s, id) => s.table.find((r) => r.item_id === id);
  const run = (edit, flags = noFlags) => scoreProvider(sheet(edit), flags);

  console.log('── baseline');
  const p = run();
  check(p.ok && p.qualifies && p.q1.accepted === 30 && p.critical.count === 0 && CRITERIA_02.every((c) => p.q2.per_criterion[c].mean === 2), 'all perfect: 30 accepted, 0 critical, every mean 2.0, qualifies');
  check(p.q1.status.startsWith('PROPOSED') && p.q2.status.startsWith('PROPOSED') && /awaiting owner approval/.test(p.q1.status + p.q2.status), 'Q1 and Q2 are marked PROPOSED, awaiting owner approval, in the output');
  check(Q1_ACCEPTED_MIN === 24 && Q2_MEAN_MIN === 1.0 && CRITICAL_MAX === 1 && DENOMINATOR === 30, 'thresholds are the constants of §4.3/§4.3a: critical ≤ 1, Q1 ≥ 24/30, Q2 ≥ 1.0');

  console.log('── the 0–2 criteria');
  const g1 = run((id) => id === 'B1-001' ? { J1: { alignment: 2, review_burden: 0 }, J2: { alignment: 1, review_burden: 1 } } : {});
  check(g1.ok && at(g1, 'B1-001').alignment === 1.5 && at(g1, 'B1-001').via.alignment === 'average', '1-point gap (2/1) scores the average, 1.5');
  check(g1.ok && at(g1, 'B1-001').review_burden === 0.5 && !at(g1, 'B1-001').accepted && g1.q1.accepted === 29, 'review burden 0/1 resolves to 0.5, below 1: correct but not accepted');
  const g2 = (t) => run((id) => id === 'B1-002' ? { J1: { distractors: 0 }, J2: { distractors: 2 }, J3: { distractors: t } } : {});
  check([0, 1, 2].every((t) => { const s = g2(t); return s.ok && at(s, 'B1-002').distractors === t && at(s, 'B1-002').via.distractors === 'median of three'; }), '2-point gap (0/2) takes the median of the three: third 0 → 0, 1 → 1, 2 → 2');
  const g2n = run((id) => id === 'B1-002' ? { J1: { distractors: 0 }, J2: { distractors: 2 } } : {});
  check(!g2n.ok && g2n.errors.some((e) => /B1-002 J3: distractors missing.*2 apart/.test(e)), '2-point gap with no third-judge score is refused, not guessed');
  const g1x = run((id) => id === 'B1-003' ? { J1: { language: 1 }, J2: { language: 2 }, J3: { language: 0 } } : {});
  check(g1x.ok && at(g1x, 'B1-003').language === 1.5 && g1x.warnings.some((w) => /B1-003: J3's language is not used/.test(w)), '1-point gap stays the average even when a third score is present (ignored, with a warning)');

  console.log('── correctness and Sharon\'s flags');
  const up = run((id) => id === 'B1-004' ? { J3: { correctness: 0 } } : {}, flagsOn('B1-004'));
  check(up.ok && at(up, 'B1-004').correctness === 0 && at(up, 'B1-004').via.correctness === 'third (flag)' && at(up, 'B1-004').critical, 'flag UPHELD: judges agreed 1/1, flag sends it to the third educator, who scores 0 → critical');
  check(up.ok && up.flags.raised === 1 && up.flags.upheld === 1 && up.flags.rejected === 0 && up.critical.count === 1, 'flag upheld: raised 1, upheld 1; critical count 1');
  const rj = run((id) => id === 'B1-004' ? { J3: { correctness: 1 } } : {}, flagsOn('B1-004'));
  check(rj.ok && at(rj, 'B1-004').correctness === 1 && !at(rj, 'B1-004').critical && rj.flags.raised === 1 && rj.flags.upheld === 0 && rj.flags.rejected === 1, 'flag REJECTED: third educator scores 1 → stands correct; raised 1, upheld 0, rejected 1');
  const fl0 = run((id) => id === 'B1-004' ? { J1: { correctness: 0 }, J2: { correctness: 0 }, J3: { correctness: 1 } } : {}, flagsOn('B1-004'));
  check(fl0.ok && at(fl0, 'B1-004').correctness === 1, 'a flag sends even an agreed 0/0 to the third educator, whose decision is final');
  const fln = run(() => ({}), flagsOn('B1-004'));
  check(!fln.ok && fln.errors.some((e) => /B1-004 J3: correctness missing.*flagged/.test(e)), 'a flagged item with no third-educator correctness is refused (the flag is never resolved by default)');
  const dis = run((id) => id === 'B1-005' ? { J1: { correctness: 0 }, J3: { correctness: 0 } } : {});
  check(dis.ok && at(dis, 'B1-005').correctness === 0 && at(dis, 'B1-005').via.correctness === 'third (disagreement)' && dis.flags.raised === 0, 'judges disagree 0/1 with no flag: the third educator decides');
  const disn = run((id) => id === 'B1-005' ? { J1: { correctness: 0 } } : {});
  check(!disn.ok, 'a correctness disagreement with no third educator is refused');
  const agree = run((id) => id === 'B1-006' ? { J3: { correctness: 0 } } : {});
  check(agree.ok && at(agree, 'B1-006').correctness === 1 && agree.warnings.some((w) => /B1-006: J3's correctness is not used/.test(w)), 'judges agree and no flag: their score stands; a stray third score is ignored');
  const noReason = run((id) => id === 'B1-004' ? { J3: { correctness: 0 } } : {}, { format: FLAGS_FORMAT, flags: [{ item_id: 'B1-004', reason: ' ' }] });
  check(!noReason.ok && noReason.errors.some((e) => /no reason/.test(e)), 'a flag without a reason is refused');
  const other = run(() => ({}), flagsOn('Z9-999'));
  check(other.ok && other.flags.raised === 0 && other.flags.outside_this_code === 1, 'a flag on another code\'s item is not counted for this code');

  console.log('── missing and malformed');
  const miss = run((id) => id.startsWith('B2-') ? { status: 'missing' } : {});
  check(miss.ok && miss.counts.missing === 15 && miss.table.filter((r) => r.status === 'missing').every((r) => r.correctness === 0 && CRITERIA_02.every((c) => r[c] === 0) && !r.accepted && !r.critical), 'missing chapter: 15 slots score 0 on every criterion, not accepted, not critical');
  check(miss.ok && miss.q1.accepted === 15 && !miss.q1.pass, 'missing chapter: accepted 15/30 fails Q1');
  check(miss.ok && CRITERIA_02.every((c) => miss.q2.per_criterion[c].mean === 1 && miss.q2.per_criterion[c].pass) && miss.q2.pass, 'missing chapter: Q2 reads exactly 1.0 on all four and passes (the stated edge case)');
  check(miss.ok && miss.critical.pass && miss.qualifies === false, 'missing chapter: critical 0 and Q2 pass, yet it does NOT qualify (Q1 decides)');
  const mal = run((id) => id === 'B1-007' ? { status: 'malformed', keepRows: true } : {});
  check(mal.ok && at(mal, 'B1-007').correctness === 0 && CRITERIA_02.every((c) => at(mal, 'B1-007')[c] === 0) && !at(mal, 'B1-007').accepted && !at(mal, 'B1-007').critical, 'malformed item: 0 on every criterion, not accepted, not a critical key error');
  check(mal.ok && mal.q1.accepted === 29 && mal.warnings.some((w) => /B1-007: malformed slot; its judge rows are ignored/.test(w)), 'malformed item: judge rows given for it are ignored with a warning; accepted 29');
  const malFlag = run((id) => id === 'B1-007' ? { status: 'malformed' } : {}, flagsOn('B1-007'));
  check(!malFlag.ok && malFlag.errors.some((e) => /B1-007.*cannot be flagged/.test(e)), 'a flag on a malformed slot (never shown) is refused');
  const badVal = run((id) => id === 'B1-008' ? { J1: { alignment: 3 } } : {});
  check(!badVal.ok && badVal.errors.some((e) => /B1-008 J1: alignment 3 is not an integer 0–2/.test(e)), 'an out-of-range judge score (alignment 3) is refused');
  const badHalf = run((id) => id === 'B1-008' ? { J2: { correctness: 0.5 } } : {});
  check(!badHalf.ok, 'a non-integer judge correctness (0.5) is refused');
  const noJ2 = sheet(); noJ2.scores = noJ2.scores.filter((r) => !(r.item_id === 'B1-009' && r.judge === 'J2'));
  check(!scoreProvider(noJ2, noFlags).ok, 'a valid item with only one judge is refused');
  const s29 = sheet(); s29.items.pop();
  check(!scoreProvider(s29, noFlags).ok, '29 slots are refused: the denominator is always 30');
  const s1614 = sheet(); s1614.items[15].chapter = 1;
  check(!scoreProvider(s1614, noFlags).ok, 'a 16/14 chapter split is refused: 15 per chapter');

  console.log('── the critical rule');
  const wrong = (n) => (id) => ids.indexOf(id) < n ? { J1: { correctness: 0 }, J2: { correctness: 0 } } : {};
  const k1 = run(wrong(1)), k2 = run(wrong(2));
  check(k1.ok && k1.critical.count === 1 && k1.critical.pass && k1.q1.accepted === 29 && k1.qualifies, 'critical exactly 1: passes the rule; 29 accepted; qualifies');
  check(k2.ok && k2.critical.count === 2 && !k2.critical.pass && k2.q1.pass && k2.q2.pass && !k2.qualifies, 'critical 2: fails the rule and does not qualify, though Q1 and Q2 pass');

  console.log('── Q1');
  const burden0 = (n) => (id) => ids.indexOf(id) < n ? { J1: { review_burden: 0 }, J2: { review_burden: 0 } } : {};
  const a24 = run(burden0(6)), a23 = run(burden0(7));
  check(a24.ok && a24.q1.accepted === 24 && a24.q1.pass && a24.qualifies, 'Q1 at 24 accepted: passes, qualifies');
  check(a23.ok && a23.q1.accepted === 23 && !a23.q1.pass && a23.q2.pass && a23.critical.pass && !a23.qualifies, 'Q1 at 23 accepted: fails, does not qualify (critical and Q2 pass)');

  console.log('── Q2');
  const lang1 = run(() => ({ J1: { language: 1 }, J2: { language: 1 } }));
  check(lang1.ok && lang1.q2.per_criterion.language.mean === 1 && lang1.q2.per_criterion.language.pass && lang1.qualifies, 'Q2 language exactly 1.0 (30/30): passes, qualifies');
  const lang099 = run((id) => id === 'B1-001' ? { J1: { language: 0 }, J2: { language: 1 } } : { J1: { language: 1 }, J2: { language: 1 } });
  check(lang099.ok && lang099.q2.per_criterion.language.sum === 29.5 && !lang099.q2.per_criterion.language.pass && lang099.q1.pass && !lang099.qualifies, 'Q2 language 29.5/30 (0.983, the nearest value below 1.0 that resolution can give): fails, does not qualify though Q1 passes');
  check(!meetsMean(29.7, 30, Q2_MEAN_MIN) && meetsMean(30, 30, Q2_MEAN_MIN) && !meetsMean(0.99 * 30, 30, Q2_MEAN_MIN), 'the Q2 test itself: a mean of 0.99 fails, 1.0 passes');
  const dimWeak = run((id) => ids.indexOf(id) < 16 ? { J1: { distractors: 0 }, J2: { distractors: 0 } } : {});
  check(dimWeak.ok && dimWeak.q1.pass && !dimWeak.q2.per_criterion.distractors.pass && dimWeak.q2.per_criterion.alignment.pass && !dimWeak.qualifies, 'one weak dimension (distractors 28/30) fails Q2 although the other three and Q1 pass');

  console.log('── the flags hash and the CLI');
  const t = mkdtempSync(join(tmpdir(), 'c3-score-'));
  try {
    const sp = join(t, 'sheets.json'), fp = join(t, 'flags.json');
    writeFileSync(sp, JSON.stringify(sheet((id) => id === 'B1-004' ? { J3: { correctness: 0 } } : {})));
    writeFileSync(fp, JSON.stringify(flagsOn('B1-004')) + '\n');
    const good = sha256(readFileSync(fp));
    const ok = scoreFiles(sp, fp, good);
    check(ok.ok && ok.flags_sha256 === good && ok.flags.upheld === 1, 'flags file matching its committed SHA-256 is scored');
    const mm = scoreFiles(sp, fp, sha256('something else'));
    check(!mm.ok && mm.errors.some((e) => /does not match the committed/.test(e)) && !('table' in mm), 'flags-hash MISMATCH is refused, and no table is produced');
    writeFileSync(fp, JSON.stringify(flagsOn('B1-004', 'B1-005')) + '\n');
    check(!scoreFiles(sp, fp, good).ok, 'a flags file changed after its hash was committed (a flag added) is refused');
    check(!scoreFiles(sp, fp, undefined).ok && !scoreFiles(sp, fp, good.toUpperCase()).ok && !scoreFiles(sp, fp, good.slice(0, 63)).ok, 'no expected hash, or a malformed one, is refused');
    writeFileSync(fp, JSON.stringify(flagsOn('B1-004')) + '\n');
    const me = fileURLToPath(import.meta.url);
    const out = execFileSync(process.execPath, [me, sp, fp, '--flags-sha256', good, '--json'], { encoding: 'utf8' });
    const j = JSON.parse(out);
    check(j.ok && j.table.length === 30 && j.critical.count === 1 && j.qualifies === true, 'CLI: scores a file pair and prints the resolved table, critical, Q1, Q2 and the verdict');
    let code = 0, err = '';
    try { execFileSync(process.execPath, [me, sp, fp, '--flags-sha256', sha256('x')], { encoding: 'utf8', stdio: 'pipe' }); } catch (e) { code = e.status; err = String(e.stderr); }
    check(code === 2 && /refused/.test(err), 'CLI: a flags-hash mismatch exits 2 with a refusal');
  } finally { rmSync(t, { recursive: true, force: true }); }

  console.log(`\n${passes} passed, ${fails.length} failed`);
  return fails.length ? 1 : 0;
}

// ───────────────────────────── CLI
function main(argv) {
  if (argv[0] === '--self-test') return selfTest();
  const pos = []; const opt = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--json') opt.json = true;
    else if (argv[i] === '--flags-sha256') opt.sha = argv[++i];
    else if (argv[i].startsWith('--')) { console.error(`unknown option ${argv[i]}`); return 2; }
    else pos.push(argv[i]);
  }
  if (pos.length !== 2) { console.error('usage: node score.mjs <sheets.json> <flags.json> --flags-sha256 <64-hex> [--json] | --self-test'); return 2; }
  const s = scoreFiles(pos[0], pos[1], opt.sha);
  if (!s.ok) { console.error('score refused:\n' + s.errors.map((e) => '- ' + e).join('\n')); return 2; }
  console.log(opt.json ? JSON.stringify(s, null, 2) : report(s));
  return 0;
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) process.exitCode = main(process.argv.slice(2));
