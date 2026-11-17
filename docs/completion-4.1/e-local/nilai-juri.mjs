// PINTAR E · the judges' sheets: generate, route to J3, and convert for score.mjs. Dependency-free; no network.
//
//   node nilai-juri.mjs lembar <untuk-sharon/items.json> <out-dir>
//        → lembar-nilai-J1.csv, lembar-nilai-J2.csv: one row per item ID, with the five criteria and alasan blank.
//   node nilai-juri.mjs lembar-k <untuk-sharon/items.json> <out-dir>
//        → lembar-kunci-K.csv: item_id, jawaban (A–D), alasan. The key checker answers every item blind (K-FLAG).
//   node nilai-juri.mjs flags <lembar-kunci-K.csv> <untuk-juri/items.json> <flags.json> --answers-sha256 <h>
//        → c3-key-flags/1: a flag wherever K's answer differs from the key, with K's alasan as its reason. It refuses on
//          a hash mismatch, a missing or invalid answer, or a flag without a reason. It needs no map: the judges'
//          items.json carries the keys.
//   node nilai-juri.mjs slot <SEALED/map.json> <slots.json>
//        → the map's "slots" only (code → item IDs and status). It carries no provider name. The owner runs it on his Mac.
//   node nilai-juri.mjs j3 <J1.csv> <J2.csv> <flags.json> <out-dir> --flags-sha256 <h> --j1-sha256 <h> --j2-sha256 <h>
//        → lembar-nilai-J3.csv: only the items J3 must decide, with what is asked, both judges' reasons, and the
//          key-checker's flag reason as a reviewer's note (Sharon A5).
//   node nilai-juri.mjs json <J1.csv> <J2.csv> <J3.csv> <slots.json> <out-dir> --j1-sha256 <h> --j2-sha256 <h> --j3-sha256 <h>
//        → sheets-<code>.json in score.mjs's format "c3-judge-sheets/1", one file per provider code.
//   node nilai-juri.mjs --self-test
//
// Sharon J3-H: j3 and json refuse unless every input matches the SHA-256 committed for it (the flags before any score;
// J1's and J2's sheets before J3 is routed; J3's before scoring), so the audit order holds by construction.
// It reads CSV with "," or ";" as the separator (Excel in an Indonesian locale writes ";"), quoted fields included.
// Nothing in the frozen set (kit.mjs, score.mjs, report.mjs) is changed: this only prepares score.mjs's input.

import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';

const COLS = ['item_id', 'juri', 'benar', 'keselarasan', 'pengecoh', 'bahasa', 'beban_tinjau', 'alasan'];
const MAP02 = { keselarasan: 'alignment', pengecoh: 'distractors', bahasa: 'language', beban_tinjau: 'review_burden' };
const C02 = Object.keys(MAP02);
class Fatal extends Error {}
const sha256 = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');
function verify(path, expected, what) {
  if (!/^[0-9a-f]{64}$/.test(expected ?? '')) throw new Fatal(`${what}: the committed SHA-256 is required (64 lowercase hex)`);
  const got = sha256(path); if (got !== expected) throw new Fatal(`${what}: ${path} is ${got}, not the committed ${expected}`);
}

// ── CSV ─────────────────────────────────────────────────────────────────────
function parseCsv(text, required = ['item_id', 'juri', 'benar', ...C02, 'alasan']) {
  text = text.replace(/^﻿/, '');
  const first = text.split(/\r?\n/, 1)[0];
  const sep = (first.match(/;/g) || []).length > (first.match(/,/g) || []).length ? ';' : ',';
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; continue; }
    if (c === '"') q = true; else if (c === sep) { row.push(f); f = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; }
    else f += c;
  }
  if (f !== '' || row.length) { row.push(f); rows.push(row); }
  const head = rows.shift().map((h) => h.trim().toLowerCase());
  for (const c of required) if (!head.includes(c)) throw new Fatal(`sheet: column "${c}" is missing`);
  return rows.filter((r) => r.some((x) => x.trim() !== '')).map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? '').trim()])));
}
const cell = (s) => /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
const toCsv = (cols, rows) => [cols.join(','), ...rows.map((r) => cols.map((c) => cell(String(r[c] ?? ''))).join(','))].join('\n') + '\n';

// Daisy Q-2: Excel in an Indonesian locale may save CSV as Windows-1252, not UTF-8. Decode strictly as UTF-8 first;
// fall back to Windows-1252 only if the bytes are not valid UTF-8.
function decode(buf, path = '') {
  let text, used;
  try { text = new TextDecoder('utf-8', { fatal: true }).decode(buf); used = 'utf-8'; }
  catch { text = new TextDecoder('windows-1252').decode(buf); used = 'windows-1252'; }
  if (path && !process.env.NILAI_JURI_QUIET) console.error(`decoded ${path} as ${used}`);   // Sharon: say which, per sheet
  decode.last = used; return text;
}
function readSheet(path, judge) {
  const rows = parseCsv(decode(readFileSync(path), path)); const by = new Map();
  for (const r of rows) {
    if (r.juri && r.juri.toUpperCase() !== judge) throw new Fatal(`${path}: row ${r.item_id} is for ${r.juri}, not ${judge}`);
    if (by.has(r.item_id)) throw new Fatal(`${path}: ${r.item_id} appears twice`);
    by.set(r.item_id, r);
  }
  return by;
}
function num(v, allowed, where) {
  if (v === '') return null;
  const n = Number(v.replace(',', '.'));
  if (!allowed.includes(n)) throw new Fatal(`${where}: "${v}" is not one of ${allowed.join('/')}`);
  return n;
}

// ── lembar: J1 and J2 sheets ────────────────────────────────────────────────
function lembar(itemsPath, out) {
  const raw = JSON.parse(readFileSync(itemsPath, 'utf8')); const items = Array.isArray(raw) ? raw : raw.items;
  const ids = items.map((x) => x.item_id); if (new Set(ids).size !== ids.length) throw new Fatal('items: duplicate item IDs');
  mkdirSync(out, { recursive: true });
  for (const j of ['J1', 'J2']) writeFileSync(join(out, `lembar-nilai-${j}.csv`), toCsv(COLS, ids.map((id) => ({ item_id: id, juri: j }))));
  return ids.length;
}

// ── lembar-k and flags: the key checker's blind answers, then the flags (Sharon K-FLAG) ──
function lembarK(itemsPath, out) {
  const raw = JSON.parse(readFileSync(itemsPath, 'utf8')); const items = Array.isArray(raw) ? raw : raw.items;
  if (items.some((x) => 'key' in x)) throw new Fatal('lembar-k: these items carry keys; use untuk-sharon/items.json, which has none');
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, 'lembar-kunci-K.csv'), toCsv(['item_id', 'jawaban', 'alasan'], items.map((x) => ({ item_id: x.item_id }))));
  return items.length;
}
function flags(answersPath, itemsPath, outPath, h = {}) {
  verify(answersPath, h.answers, 'key-checker answers');
  const rows = parseCsv(decode(readFileSync(answersPath), answersPath), ['item_id', 'jawaban', 'alasan']);
  const raw = JSON.parse(readFileSync(itemsPath, 'utf8')); const items = Array.isArray(raw) ? raw : raw.items;
  const key = new Map(items.map((x) => [x.item_id, x.key]));
  if ([...key.values()].some((k) => !['A', 'B', 'C', 'D'].includes(k))) throw new Fatal('flags: the items file must be the judges\' items.json, with keys');
  const ans = new Map();
  for (const r of rows) {
    if (!key.has(r.item_id)) throw new Fatal(`flags: unknown item ${r.item_id}`);
    if (ans.has(r.item_id)) throw new Fatal(`flags: ${r.item_id} answered twice`);
    const a = r.jawaban.toUpperCase(); if (!['A', 'B', 'C', 'D'].includes(a)) throw new Fatal(`flags: ${r.item_id} jawaban "${r.jawaban}" is not A–D`);
    ans.set(r.item_id, { a, alasan: r.alasan });
  }
  for (const id of key.keys()) if (!ans.has(id)) throw new Fatal(`flags: ${id} has no answer`);
  const out = [];
  for (const [id, { a, alasan }] of ans) if (a !== key.get(id)) {
    if (!alasan) throw new Fatal(`flags: ${id} differs from the key but has no alasan`);
    out.push({ item_id: id, reason: alasan });
  }
  writeFileSync(outPath, JSON.stringify({ format: 'c3-key-flags/1', flags: out }, null, 2) + '\n');
  return out.length;
}

// ── slot: the map's slots only ──────────────────────────────────────────────
function slot(mapPath, outPath) {
  const m = JSON.parse(readFileSync(mapPath, 'utf8'));
  if (!m.slots || typeof m.slots !== 'object') throw new Fatal('map: no slots');
  const slots = {};
  for (const [code, list] of Object.entries(m.slots)) {
    if (!/^[A-Z]$/.test(code)) throw new Fatal(`map: unexpected code ${code}`);
    slots[code] = list.map((s) => ({ item_id: s.item_id, chapter: s.chapter, status: s.status }));
  }
  writeFileSync(outPath, JSON.stringify({ format: 'c3-slots/1', slots }, null, 2) + '\n');
  return Object.keys(slots);
}

// ── j3: what the third educator must decide ─────────────────────────────────
function j3Needs(r1, r2, flagged) {
  const need = [];
  const b1 = num(r1.benar, [0, 1], `J1 ${r1.item_id} benar`), b2 = num(r2.benar, [0, 1], `J2 ${r2.item_id} benar`);
  if (b1 === null || b2 === null) throw new Fatal(`${r1.item_id}: benar is blank for J1 or J2`);
  if (b1 !== b2 || flagged) need.push('benar');
  for (const c of C02) {
    const a = num(r1[c], [0, 1, 2], `J1 ${r1.item_id} ${c}`), b = num(r2[c], [0, 1, 2], `J2 ${r2.item_id} ${c}`);
    if (a === null || b === null) throw new Fatal(`${r1.item_id}: ${c} is blank for J1 or J2`);
    if (Math.abs(a - b) === 2) need.push(c);
  }
  return need;
}
function j3(j1p, j2p, flagsPath, out, h = {}) {
  verify(flagsPath, h.flags, 'flags'); verify(j1p, h.j1, 'J1 sheet'); verify(j2p, h.j2, 'J2 sheet');
  const s1 = readSheet(j1p, 'J1'), s2 = readSheet(j2p, 'J2');
  const flags = JSON.parse(readFileSync(flagsPath, 'utf8'));
  if (flags.format !== 'c3-key-flags/1') throw new Fatal('flags: not c3-key-flags/1');
  const fl = new Map(flags.flags.map((f) => [f.item_id, f.reason]));
  if ([...s1.keys()].sort().join() !== [...s2.keys()].sort().join()) throw new Fatal('J1 and J2 do not cover the same items');
  const rows = [];
  for (const [id, r1] of s1) {
    const need = j3Needs(r1, s2.get(id), fl.has(id));
    if (need.length) rows.push({ item_id: id, juri: 'J3', perlu_dinilai: need.join(' '), alasan_J1: r1.alasan,
      alasan_J2: s2.get(id).alasan, catatan_pemeriksa_kunci: fl.get(id) ?? '' });
  }
  mkdirSync(out, { recursive: true });
  const cols = ['item_id', 'juri', 'perlu_dinilai', ...COLS.slice(2), 'alasan_J1', 'alasan_J2', 'catatan_pemeriksa_kunci'];
  writeFileSync(join(out, 'lembar-nilai-J3.csv'), toCsv(cols, rows));
  return rows.length;
}

// ── json: score.mjs's input, per provider code ──────────────────────────────
function score(row, judge, only) {
  const o = { item_id: row.item_id, judge, reason: row.alasan ?? '' };
  const b = num(row.benar ?? '', [0, 1], `${judge} ${row.item_id} benar`); if (b !== null) o.correctness = b;
  for (const c of C02) { const v = num(row[c] ?? '', [0, 1, 2], `${judge} ${row.item_id} ${c}`); if (v !== null) o[MAP02[c]] = v; }
  if (!only) for (const k of ['correctness', ...Object.values(MAP02)]) if (!(k in o)) throw new Fatal(`${judge} ${row.item_id}: ${k} is blank`);
  return o;
}
function json(j1p, j2p, j3p, slotsPath, out, h = {}) {
  verify(j1p, h.j1, 'J1 sheet'); verify(j2p, h.j2, 'J2 sheet'); verify(j3p, h.j3, 'J3 sheet');
  const s1 = readSheet(j1p, 'J1'), s2 = readSheet(j2p, 'J2'), s3 = readSheet(j3p, 'J3');
  const { format, slots } = JSON.parse(readFileSync(slotsPath, 'utf8'));
  if (format !== 'c3-slots/1') throw new Fatal('slots: not c3-slots/1');
  mkdirSync(out, { recursive: true }); const written = [];
  const validIds = new Set(Object.values(slots).flat().filter((s) => s.status === 'valid').map((s) => s.item_id));
  for (const id of s1.keys()) if (!validIds.has(id)) throw new Fatal(`J1 scored ${id}, which is not a valid slot`);
  for (const [code, list] of Object.entries(slots)) {
    const scores = [];
    for (const s of list.filter((x) => x.status === 'valid')) {
      if (!s1.has(s.item_id) || !s2.has(s.item_id)) throw new Fatal(`${s.item_id}: missing from J1 or J2`);
      scores.push(score(s1.get(s.item_id), 'J1', false), score(s2.get(s.item_id), 'J2', false));
      if (s3.has(s.item_id)) scores.push(score(s3.get(s.item_id), 'J3', true));
    }
    const sheet = { format: 'c3-judge-sheets/1', provider_code: code, items: list, scores };
    const p = join(out, `sheets-${code}.json`); writeFileSync(p, JSON.stringify(sheet, null, 2) + '\n'); written.push(p);
  }
  return written;
}

// ── self-test ───────────────────────────────────────────────────────────────
function selfTest() {
  let pass = 0, fail = 0; const check = (c, m) => { if (c) { pass++; console.log('PASS  ' + m); } else { fail++; console.log('FAIL  ' + m); } };
  const d = mkdtempSync(join(tmpdir(), 'nilai-juri-'));
  try {
    const ids = [...Array(15)].map((_, i) => `B1-${String(i + 1).padStart(3, '0')}`).concat([...Array(14)].map((_, i) => `B2-${String(i + 1).padStart(3, '0')}`));
    writeFileSync(join(d, 'items.json'), JSON.stringify(ids.map((id) => ({ item_id: id, chapter: id[1] === '1' ? 1 : 2 }))));
    check(lembar(join(d, 'items.json'), join(d, 's')) === 29, 'lembar: one row per item ID');
    const t = parseCsv(readFileSync(join(d, 's', 'lembar-nilai-J1.csv'), 'utf8'));
    check(t.length === 29 && t.every((r) => r.juri === 'J1' && r.benar === ''), 'lembar: J1 sheet blank, judge filled');
    const slotsMap = { warning: 'SEALED', providers: { A: { folder: 'x' } }, items: {}, slots: { A: [
      ...ids.slice(0, 15).map((id) => ({ item_id: id, chapter: 1, status: 'valid' })),
      ...ids.slice(15).map((id) => ({ item_id: id, chapter: 2, status: 'valid' })),
      { item_id: 'A-B2-missing-15', chapter: 2, status: 'missing' }] } };
    writeFileSync(join(d, 'map.json'), JSON.stringify(slotsMap));
    slot(join(d, 'map.json'), join(d, 'slots.json'));
    const so = readFileSync(join(d, 'slots.json'), 'utf8');
    check(!/folder|providers|warning/.test(so), 'slot: no provider block or folder name in slots.json');
    // J1 all 2/1; J2 disagrees on benar for B1-002, is 2 apart on pengecoh for B1-003; ; separator and quoted reason
    const fill = (j, f) => toCsv(COLS, ids.map((id) => f({ item_id: id, juri: j, benar: '1', keselarasan: '2', pengecoh: '2', bahasa: '2', beban_tinjau: '2', alasan: 'baik, jelas' })));
    writeFileSync(join(d, 'J1.csv'), fill('J1', (r) => r));
    writeFileSync(join(d, 'J2.csv'), fill('J2', (r) => (r.item_id === 'B1-002' ? { ...r, benar: '0', alasan: 'kunci "B" salah' } : r.item_id === 'B1-003' ? { ...r, pengecoh: '0' } : r)).replace(/,/g, ';'));
    writeFileSync(join(d, 'flags.json'), JSON.stringify({ format: 'c3-key-flags/1', flags: [{ item_id: 'B2-004', reason: 'kunci seharusnya C' }] }));
    const H = { flags: sha256(join(d, 'flags.json')), j1: sha256(join(d, 'J1.csv')), j2: sha256(join(d, 'J2.csv')) };
    let r1 = false; try { j3(join(d, 'J1.csv'), join(d, 'J2.csv'), join(d, 'flags.json'), join(d, 'j3'), { ...H, j2: H.j1 }); } catch (e) { r1 = e instanceof Fatal; }
    check(r1, 'J3-H: j3 refuses a J2 sheet that does not match its committed hash');
    let r2 = false; try { j3(join(d, 'J1.csv'), join(d, 'J2.csv'), join(d, 'flags.json'), join(d, 'j3'), { j1: H.j1, j2: H.j2 }); } catch (e) { r2 = e instanceof Fatal; }
    check(r2, 'J3-H: j3 refuses without the flags hash');
    check(j3(join(d, 'J1.csv'), join(d, 'J2.csv'), join(d, 'flags.json'), join(d, 'j3'), H) === 3, 'j3: three items routed (benar differs, pengecoh 2 apart, flagged)');
    const j3rows = parseCsv(readFileSync(join(d, 'j3', 'lembar-nilai-J3.csv'), 'utf8'));
    check(j3rows.find((r) => r.item_id === 'B1-003').perlu_dinilai === 'pengecoh' && j3rows.find((r) => r.item_id === 'B2-004').catatan_pemeriksa_kunci === 'kunci seharusnya C', 'j3: asks only what is needed; the flag reason reaches J3 as a note');
    check(j3rows.find((r) => r.item_id === 'B1-002').alasan_j2 === 'kunci "B" salah', 'j3: quoted reasons survive the ";" sheet');
    const j3f = toCsv(COLS, [{ item_id: 'B1-002', juri: 'J3', benar: '0', alasan: 'kunci salah' }, { item_id: 'B1-003', juri: 'J3', pengecoh: '1', alasan: 'sedang' }, { item_id: 'B2-004', juri: 'J3', benar: '1', alasan: 'kunci benar' }]);
    writeFileSync(join(d, 'J3.csv'), j3f);
    const HJ = { j1: H.j1, j2: H.j2, j3: sha256(join(d, 'J3.csv')) };
    let r3 = false; try { json(join(d, 'J1.csv'), join(d, 'J2.csv'), join(d, 'J3.csv'), join(d, 'slots.json'), join(d, 'out'), { ...HJ, j3: H.j1 }); } catch (e) { r3 = e instanceof Fatal; }
    check(r3, 'J3-H: json refuses a J3 sheet that does not match its committed hash');
    const w = json(join(d, 'J1.csv'), join(d, 'J2.csv'), join(d, 'J3.csv'), join(d, 'slots.json'), join(d, 'out'), HJ);
    const sh = JSON.parse(readFileSync(w[0], 'utf8'));
    check(sh.format === 'c3-judge-sheets/1' && sh.items.length === 30 && sh.scores.filter((x) => x.judge === 'J3').length === 3, 'json: 30 slots, J1+J2 on every valid item, J3 only where routed');
    check(sh.scores.every((x) => x.judge !== 'J1' || ['correctness', 'alignment', 'distractors', 'language', 'review_burden'].every((k) => k in x)), 'json: every J1 row carries all five criteria, review_burden included');
    let refused = false; try { writeFileSync(join(d, 'bad.csv'), toCsv(COLS, [{ item_id: 'B1-001', juri: 'J1', benar: '3' }])); readSheet(join(d, 'bad.csv'), 'J1'); j3Needs(readSheet(join(d, 'bad.csv'), 'J1').get('B1-001'), { item_id: 'B1-001', benar: '1' }, false); } catch (e) { refused = e instanceof Fatal; }
    check(refused, 'a value outside 0/1 is refused');
    writeFileSync(join(d, 'w1252.csv'), Buffer.concat([Buffer.from('item_id;juri;benar;keselarasan;pengecoh;bahasa;beban_tinjau;alasan\r\nB1-001;J1;1;2;2;2;2;baik caf', 'latin1'), Buffer.from([0xe9, 0x0d, 0x0a])]));
    const enc = readSheet(join(d, 'w1252.csv'), 'J1').get('B1-001').alasan;
    check(enc.endsWith('caf\u00e9') && decode.last === 'windows-1252', 'Windows-1252: an accented letter survives (café), and the decoding used is reported');
    // K-FLAG: blind answers to flags
    writeFileSync(join(d, 'kitems.json'), JSON.stringify(ids.slice(0, 3).map((id) => ({ item_id: id }))));
    check(lembarK(join(d, 'kitems.json'), join(d, 'k')) === 3, 'lembar-k: one row per item, from the keyless items');
    writeFileSync(join(d, 'jitems.json'), JSON.stringify(ids.slice(0, 3).map((id, i) => ({ item_id: id, key: ['A', 'B', 'C'][i] }))));
    let kk = false; try { lembarK(join(d, 'jitems.json'), join(d, 'k2')); } catch (e) { kk = e instanceof Fatal; }
    check(kk, 'lembar-k refuses an items file that carries keys');
    writeFileSync(join(d, 'K.csv'), toCsv(['item_id', 'jawaban', 'alasan'], [{ item_id: ids[0], jawaban: 'A' }, { item_id: ids[1], jawaban: 'c', alasan: 'selisihnya 4, jadi C' }, { item_id: ids[2], jawaban: 'C' }]));
    const KH = sha256(join(d, 'K.csv'));
    check(flags(join(d, 'K.csv'), join(d, 'jitems.json'), join(d, 'flags-k.json'), { answers: KH }) === 1, 'flags: one differing answer gives one flag; matches give none');
    const fk = JSON.parse(readFileSync(join(d, 'flags-k.json'), 'utf8'));
    check(fk.format === 'c3-key-flags/1' && fk.flags[0].item_id === ids[1] && fk.flags[0].reason === 'selisihnya 4, jadi C', 'flags: the flag carries the key checker\'s alasan as its reason');
    let f1 = false; try { flags(join(d, 'K.csv'), join(d, 'jitems.json'), join(d, 'x.json'), { answers: H.j1 }); } catch (e) { f1 = e instanceof Fatal; }
    check(f1, 'flags refuses answers that do not match their committed hash');
    writeFileSync(join(d, 'K2.csv'), toCsv(['item_id', 'jawaban', 'alasan'], [{ item_id: ids[0], jawaban: 'A' }, { item_id: ids[1], jawaban: 'C' }, { item_id: ids[2], jawaban: 'C' }]));
    let f2 = false; try { flags(join(d, 'K2.csv'), join(d, 'jitems.json'), join(d, 'x.json'), { answers: sha256(join(d, 'K2.csv')) }); } catch (e) { f2 = e instanceof Fatal; }
    check(f2, 'flags refuses a differing answer without an alasan');
    writeFileSync(join(d, 'K3.csv'), toCsv(['item_id', 'jawaban', 'alasan'], [{ item_id: ids[0], jawaban: 'A' }, { item_id: ids[1], jawaban: 'B' }]));
    let f3 = false; try { flags(join(d, 'K3.csv'), join(d, 'jitems.json'), join(d, 'x.json'), { answers: sha256(join(d, 'K3.csv')) }); } catch (e) { f3 = e instanceof Fatal; }
    check(f3, 'flags refuses when an item has no answer');
    return { pass, fail, sheet: w[0], dir: d };
  } finally { if (!process.env.KEEP) rmSync(d, { recursive: true, force: true }); }
}

function main(a) {
  if (a[0] === '--self-test') { const r = selfTest(); console.log(`\n${r.pass} passed, ${r.fail} failed`); process.exit(r.fail ? 1 : 0); }
  const opt = {}; const p = [];
  for (let i = 1; i < a.length; i++) { const m = a[i].match(/^--(flags|j1|j2|j3|answers)-sha256$/); if (m) opt[m[1]] = a[++i]; else p.push(a[i]); }
  const cmd = a[0];
  if (cmd === 'lembar' && p.length === 2) return console.log(`${lembar(...p)} rows per sheet`);
  if (cmd === 'lembar-k' && p.length === 2) return console.log(`${lembarK(...p)} rows on the key checker's sheet`);
  if (cmd === 'flags' && p.length === 3) return console.log(`${flags(...p, opt)} flags`);
  if (cmd === 'slot' && p.length === 2) return console.log(`slots for codes ${slot(...p).join(', ')}`);
  if (cmd === 'j3' && p.length === 4) return console.log(`${j3(...p, opt)} items for J3`);
  if (cmd === 'json' && p.length === 5) return console.log(json(...p, opt).join('\n'));
  console.error('usage: see the header of nilai-juri.mjs'); process.exit(2);
}
try { main(process.argv.slice(2)); } catch (e) { if (e instanceof Fatal) { console.error('REFUSED  ' + e.message); process.exit(1); } throw e; }
