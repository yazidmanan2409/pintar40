// Mini-PINTAR — content audit.
//
// The same discipline that guards the presentation deck guards this bundle:
// a content rule that lives only in a document is a rule that drifts, so
// each one below fails a build instead.
//
// Run: node verify/audit.mjs

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  MAP_ITEMS, CHECK_ITEMS, MAP_REASONS, TIER_REASONS, TIER_LABELS,
  DOMAINS, LESSONS, ASSISTANCE, OUTCOMES, EVIDENCE_LIMIT, NO_DELTA, REVEAL, UI,
} from "../content.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..", "..", "..");

const fails = [];
const fail = (what, detail) => fails.push(`${what} — ${detail}`);
let checks = 0;
const ok = () => { checks += 1; };

// --------------------------------------------------------------- shape

const isPair = (v) =>
  v && typeof v === "object" && typeof v.id === "string" && typeof v.en === "string";

/** Every authored pair, with a path for the error message. */
function pairs(value, path, out = []) {
  if (isPair(value)) { out.push([path, value]); return out; }
  if (Array.isArray(value)) {
    value.forEach((v, i) => pairs(v, `${path}[${i}]`, out));
    return out;
  }
  if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) pairs(v, `${path}.${k}`, out);
  }
  return out;
}

const ALL = pairs(
  { MAP_ITEMS, CHECK_ITEMS, MAP_REASONS, TIER_REASONS, TIER_LABELS, DOMAINS,
    LESSONS, ASSISTANCE, OUTCOMES, EVIDENCE_LIMIT, NO_DELTA, REVEAL },
  "bundle");

// OUTCOMES.KONSISTEN.body is intentionally empty on both sides: its
// headline says everything the evidence permits, and a manufactured second
// sentence would be the overclaim the ruling removed.
const MAY_BE_EMPTY = new Set(["bundle.OUTCOMES.KONSISTEN.body"]);

for (const [path, p] of ALL) {
  if (MAY_BE_EMPTY.has(path)) { ok(); continue; }
  if (!p.id.trim()) fail("empty ID side", path);
  else if (!p.en.trim()) fail("empty EN side", path);
  else ok();
}
// Both sides empty or both filled — never one of the two.
for (const path of MAY_BE_EMPTY) {
  const found = ALL.find(([p]) => p === path);
  if (!found) fail("stale exemption", path);
  else if (Boolean(found[1].id.trim()) !== Boolean(found[1].en.trim()))
    fail("half-empty pair", path);
  else ok();
}

// ------------------------------------------------------------ item rules

const ALL_CHECK = Object.values(CHECK_ITEMS).flat();

for (const item of [...MAP_ITEMS, ...ALL_CHECK]) {
  const correct = item.options.filter((o) => o.correct);
  if (correct.length !== 1) fail("not exactly one correct option", item.id);
  else ok();
  if (item.options.length !== 4) fail("not four options", item.id);
  else ok();
  const labels = item.options.map((o) => o.label).join("");
  if (labels !== "ABCD") fail("option labels are not A-D in order", `${item.id}: ${labels}`);
  else ok();
}

// INV-03's principle, honoured by authoring: a distractor must teach. Every
// MAP option carries a rationale, correct ones included.
for (const item of MAP_ITEMS) {
  for (const o of item.options) {
    if (!isPair(o.rationale) || !o.rationale.id.trim() || !o.rationale.en.trim())
      fail("MAP option without a rationale", `${item.id}/${o.label}`);
    else ok();
  }
}

// DEBT, asserted rather than hidden: §2's content model requires a
// rationale on every option and §3.5 — the approved content — supplies none
// for the twenty-four CHECK options. Nothing in the designed Hasil displays
// one, so none is invented. This asserts the field is ABSENT, so the gap
// stays visible in code and an accidental half-authored set fails here.
for (const item of ALL_CHECK) {
  for (const o of item.options) {
    if ("rationale" in o)
      fail("CHECK option carries a rationale — see handoff debt D-1", `${item.id}/${o.label}`);
    else ok();
  }
}

// INV-24's principle: zero pre/post item overlap.
const mapIds = new Set(MAP_ITEMS.map((i) => i.id));
const overlap = ALL_CHECK.filter((i) => mapIds.has(i.id));
if (overlap.length) fail("MAP and CHECK item ids overlap", overlap.map((i) => i.id).join(", "));
else ok();

// Every distractor names a misconception, and every misconception has a
// card reason. Nine of each — one per (domain × misconception).
const codes = new Set();
for (const item of MAP_ITEMS) {
  for (const o of item.options) {
    if (o.correct) continue;
    if (!o.misconception) fail("MAP distractor without a misconception", `${item.id}/${o.label}`);
    else { codes.add(o.misconception); ok(); }
  }
}
if (codes.size !== 9) fail("expected nine misconception codes", `found ${codes.size}`);
else ok();
for (const c of codes) {
  if (!MAP_REASONS[c]) fail("misconception without a card reason", c);
  else ok();
}
for (const c of Object.keys(MAP_REASONS)) {
  if (!codes.has(c)) fail("card reason for an unreachable misconception", c);
  else ok();
}

// Every domain has a lesson, every lesson belongs to a domain, and every
// lesson has two CHECK items.
for (const d of DOMAINS) {
  if (!LESSONS[d.lesson]) fail("domain without a lesson", d.key);
  else ok();
  if (!CHECK_ITEMS[d.key] || CHECK_ITEMS[d.key].length !== 2)
    fail("domain without exactly two CHECK items", d.key);
  else ok();
  if (!ASSISTANCE[d.key]) fail("domain without assistance", d.key);
  else ok();
}
if (new Set(DOMAINS.map((d) => d.severity)).size !== DOMAINS.length)
  fail("severities are not distinct", "ordering would not be total");
else ok();

// ------------------------------------------------- the machine's own voice
//
// Scoped deliberately. These rules govern what the DEMONSTRATION says to
// the visitor. They are NOT applied to item stems and options, which
// discuss grades, percentages and passing as subject matter — banning
// "nilai" there would ban the content from talking about numbers.

const VOICE = pairs(
  { MAP_REASONS, TIER_REASONS, TIER_LABELS, OUTCOMES, EVIDENCE_LIMIT, NO_DELTA, REVEAL,
    UI: Object.fromEntries(Object.entries(UI).filter(([, v]) => isPair(v))),
    LESSON_TITLES: Object.fromEntries(Object.entries(LESSONS).map(([k, l]) => [k, l.title])) },
  "voice");

// Phrases that contain a banned word in order to REFUSE it. The negation is
// the point, so each is allowed explicitly rather than by a loose rule.
const NEGATIONS = [
  "bukan nilai", "not a score", "bukan peringkat", "not a ranking",
  "bukan ukuran penguasaan", "not a measure of your mastery",
  "soal dan nilai", "questions and a score",
  "bukan kekurangan anda", "not a shortcoming in you",
];

// Words in which the machine would be judging the person rather than
// naming the evidence.
const JUDGING = [
  "salah", "gagal", "wrong", "failed", "skor", "score", "peringkat",
  "ranking", "persentil", "percentile", "nilai anda", "your grade",
];

// The Voice Guide's belum-not-tidak rule, in the one place it is testable
// mechanically: the machine never says a thing is impossible where it means
// not yet.
const NOT_YET = [["tidak cukup", "belum cukup"], ["tidak berhasil", "belum berhasil"]];

// §4.2 of the Voice Guide: Anda for adults. Never speak down the ladder.
const CHILD = ["kamu", "untukmu", "jawabanmu", "bagimu", "dirimu", "milikmu", "kepadamu"];

// The ruling of 2026-09-18 and the DIDUKUNG rename: no surface claims more
// than its evidence.
const OVERCLAIM = [
  "anda kuasai", "kamu kuasai", "already yours", "sudah menguasai",
  "you have mastered", "terbukti menguasai", "didukung bukti kuat",
];

for (const [path, p] of VOICE) {
  for (const side of ["id", "en"]) {
    let text = p[side].toLowerCase();
    for (const n of NEGATIONS) text = text.split(n).join(" ");
    for (const w of JUDGING) {
      if (new RegExp(`(^|[^a-z])${w}([^a-z]|$)`).test(text))
        fail(`machine voice judges the person ("${w}")`, `${path}.${side}`);
      else ok();
    }
    for (const [bad, good] of NOT_YET) {
      if (text.includes(bad)) fail(`"${bad}" should be "${good}"`, `${path}.${side}`);
      else ok();
    }
    for (const w of OVERCLAIM) {
      if (text.includes(w)) fail(`overclaim ("${w}")`, `${path}.${side}`);
      else ok();
    }
  }
  for (const w of CHILD) {
    if (new RegExp(`(^|[^a-z])${w}([^a-z]|$)`).test(p.id.toLowerCase()))
      fail(`child register ("${w}") — Mini-PINTAR speaks to an adult`, `${path}.id`);
    else ok();
  }
}

// Obsolete terminology, the same list the deck audit carries.
const OBSOLETE = ["kuis cepat", "quick quiz", "quick test", "mastery test"];
for (const [path, p] of ALL) {
  for (const side of ["id", "en"]) {
    for (const w of OBSOLETE) {
      if (p[side].toLowerCase().includes(w)) fail(`obsolete term ("${w}")`, `${path}.${side}`);
      else ok();
    }
  }
}

// The duration ruling: the public promise is "sekitar tiga menit / about
// three minutes". No surface may say two.
for (const [path, p] of ALL) {
  for (const side of ["id", "en"]) {
    const text = p[side].toLowerCase();
    if (text.includes("dua menit") || text.includes("two minutes"))
      fail("duration claim contradicts the ruling", `${path}.${side}`);
    else ok();
  }
}
if (UI.thresholdLede.id !== "Sekitar tiga menit." ||
    UI.thresholdLede.en !== "About three minutes.")
  fail("threshold does not carry the ruled duration", JSON.stringify(UI.thresholdLede));
else ok();

// The evidence limit appears under every outcome — the condition ADR-0021
// makes binding. Asserted on the renderer, not only on the content.
const appSrc = readFileSync(join(HERE, "..", "app.js"), "utf8");
const limitFn = appSrc.slice(appSrc.indexOf("function evidenceLimitBlock"),
                             appSrc.indexOf("// ------------------------------------------------------------- navigation"));
if (!appSrc.includes("function evidenceLimitBlock"))
  fail("the evidence-limit block was removed", "app.js");
else if (!limitFn.includes("t(EVIDENCE_LIMIT)"))
  fail("the evidence-limit block no longer renders EVIDENCE_LIMIT", "evidenceLimitBlock");
else ok();

const hasilFn = appSrc.slice(appSrc.indexOf("function viewHasil"),
                             appSrc.indexOf("function viewReveal"));
if (!hasilFn.includes("evidenceLimitBlock()"))
  fail("the Hasil does not render the evidence limit", "viewHasil");
else ok();
for (const key of Object.keys(OUTCOMES)) {
  if (!appSrc.includes("OUTCOMES[outcome]")) { fail("outcome copy not read from the bundle", key); break; }
  ok();
}

// ----------------------------------------- ADR-0021: never from a bank
//
// The binding rule. Not a promise in a comment: every identifier in the
// bundle is searched for across the application's schema, seed and source,
// and finding one there would mean this bundle had imported protected
// content — an INV-01 breach, and it would invalidate content a certificate
// may point at.

const IDENTIFIERS = [
  ...MAP_ITEMS.map((i) => i.id),
  ...ALL_CHECK.map((i) => i.id),
  ...Object.keys(MAP_REASONS),
  ...DOMAINS.map((d) => d.key === "D1" || d.key === "D2" || d.key === "D3" ? null : d.key),
  ...Object.keys(LESSONS),
].filter(Boolean);

function walk(dir, out = []) {
  let entries;
  try { entries = readdirSync(dir); } catch { return out; }
  for (const name of entries) {
    if (name === "node_modules" || name === ".git" || name === ".next") continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(sql|ts|tsx|js|mjs|json)$/.test(name)) out.push(p);
  }
  return out;
}

const productFiles = [
  ...walk(join(REPO, "supabase")),
  ...walk(join(REPO, "src")),
];
if (productFiles.length === 0) fail("bank check found no product files to search", "supabase/, src/");
else ok();

for (const file of productFiles) {
  const text = readFileSync(file, "utf8");
  for (const id of IDENTIFIERS) {
    if (new RegExp(`['"\`]${id}['"\`]`).test(text))
      fail(`bundle identifier "${id}" also appears in product source`,
           file.replace(REPO + "/", ""));
  }
}
ok();

// --------------------------------------------------------------- report

if (fails.length) {
  console.error(`\naudit FAILED — ${fails.length} problem(s), ${checks} checks passed\n`);
  for (const f of fails) console.error("  " + f);
  process.exit(1);
}
console.log(`audit OK — ${checks} checks, ${ALL.length} authored string pairs, ` +
            `${MAP_ITEMS.length + ALL_CHECK.length} items, ${productFiles.length} product files searched for bundle identifiers`);
