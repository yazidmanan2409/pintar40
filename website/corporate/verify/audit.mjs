// PINTAR corporate website — content audit.
//
// Walks every content.js on the site (bilingual string pairs, question
// data, report data) and checks the claims the brief makes about itself:
// no AI-hype/jargon/EdTech-cliché vocabulary, no fabricated claims, no
// walls of text, every internal link resolves to a real route, every quiz
// question is internally consistent, every report row's bands sum to its
// stated total, and "belum cukup bukti" is actually on the site rather
// than only in this design's intentions.
//
// Run: node verify/audit.mjs

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

const fails = [];
const fail = (what, detail = "") => fails.push(`${what}${detail ? " — " + detail : ""}`);
let checks = 0;
const ok = () => { checks += 1; };

// ---------------------------------------------------------- load content

const MODULES = [
  ["shared", "../shared/content.js"],
  ["home", "../content.js"],
  ["apa-yang-dilakukan", "../apa-yang-dilakukan/content.js"],
  ["untuk-pendidik", "../untuk-pendidik/content.js"],
  ["untuk-manajemen", "../untuk-manajemen/content.js"],
  ["cara-kerja", "../cara-kerja/content.js"],
  ["laporan", "../laporan/content.js"],
  ["tentang", "../tentang/content.js"],
  ["kontak", "../kontak/content.js"],
  ["mini-pintar", "../mini-pintar/content.js"],
];

const LOADED = {};
for (const [name, rel] of MODULES) LOADED[name] = await import(rel);

// -------------------------------------------------------------- pair walk

const isPair = (v) => v && typeof v === "object"
  && typeof v.id === "string" && typeof v.en === "string";

function pairs(value, path, out = []) {
  if (isPair(value)) { out.push([path, value]); return out; }
  if (Array.isArray(value)) { value.forEach((v, i) => pairs(v, `${path}[${i}]`, out)); return out; }
  if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      if (typeof v === "function") continue;
      pairs(v, `${path}.${k}`, out);
    }
  }
  return out;
}

const ALL = [];
for (const [name, mod] of Object.entries(LOADED)) {
  for (const [key, value] of Object.entries(mod)) {
    pairs(value, `${name}.${key}`, ALL);
  }
}
if (ALL.length < 100) fail("suspiciously few string pairs found — a module may have failed to load", String(ALL.length));
else ok();

// --------------------------------------------------------------- empty sides

for (const [path, p] of ALL) {
  if (!p.id.trim()) fail("empty ID side", path);
  else ok();
  if (!p.en.trim()) fail("empty EN side", path);
  else ok();
}

// -------------------------------------------------------- banned vocabulary
//
// The brief's own list: no corporate jargon, no AI hype, no EdTech
// clichés, no exaggerated claims. And PINTAR is never "an AI product".

const AI_HYPE = [
  "kecerdasan buatan", "artificial intelligence", " ai-powered", "ai powered",
  "machine learning", "pembelajaran mesin", "algoritma cerdas", "smart algorithm",
  "didukung ai", "powered by ai", "teknologi ai", "ai technology",
];
const JARGON = [
  "sinergi", "synergy", "solusi holistik", "holistic solution", "best-in-class",
  "world-class", "world class", "cutting-edge", "cutting edge", "seamless",
  "end-to-end", "leverage", "memanfaatkan sinergi", "ekosistem terpadu",
  "unified ecosystem", "transformasi digital", "digital transformation",
  "disrupsi", "disruptive", "disruptor", "paradigma baru", "new paradigm",
  "revolusioner", "revolutionary", "game-changer", "game changer",
  "next-generation", "next generation",
];
const EXAGGERATED = [
  "terbaik di indonesia", "the best in indonesia", "nomor satu", "number one",
  "dijamin", "guaranteed", "100% akurat", "100% accurate", "sempurna", "perfect",
  "tanpa kesalahan", "error-free", "revolusi pendidikan", "education revolution",
  "mengubah segalanya", "changes everything",
];
const FABRICATED_TRUST = [
  "ribuan sekolah", "thousands of schools", "dipercaya oleh", "trusted by",
  "digunakan oleh lebih dari", "used by more than", "sejak 20", "since 20",
  "penghargaan", "award-winning", "menang penghargaan",
];
// PINTAR must never be sold as taking the decision itself.
const TAKES_DECISION = [
  "pintar memutuskan", "pintar mengambil keputusan", "pintar decides",
  "pintar takes the decision", "otomatis mengambil tindakan", "automatically takes action",
];

for (const [path, p] of ALL) {
  for (const side of ["id", "en"]) {
    const text = ` ${p[side].toLowerCase()} `;
    for (const [label, list] of [
      ["AI hype", AI_HYPE], ["corporate jargon", JARGON],
      ["an exaggerated claim", EXAGGERATED], ["a fabricated trust claim", FABRICATED_TRUST],
      ["PINTAR described as taking the decision itself", TAKES_DECISION],
    ]) {
      for (const w of list) {
        if (text.includes(w)) fail(`${label} ("${w.trim()}")`, `${path}.${side}`);
        else ok();
      }
    }
  }
}

// ---------------------------------------------------------------- no walls

const WORD_LIMIT = 65;
for (const [path, p] of ALL) {
  for (const side of ["id", "en"]) {
    const words = p[side].trim().split(/\s+/).filter(Boolean).length;
    if (words > WORD_LIMIT) fail(`a block of copy is longer than ${WORD_LIMIT} words (${words})`, `${path}.${side}`);
    else ok();
  }
}

// -------------------------------------------------------- the core principle

const corpusId = ALL.map(([, p]) => p.id).join(" • ").toLowerCase();
const corpusEn = ALL.map(([, p]) => p.en).join(" • ").toLowerCase();

if (!corpusId.includes("belum cukup bukti"))
  fail("the site never states PINTAR's principle in Indonesian", "“belum cukup bukti”");
else ok();
if (!corpusEn.includes("not enough evidence") && !corpusEn.includes("isn't enough") && !corpusEn.includes("is not enough"))
  fail("the site never states PINTAR's principle in English", "“not enough evidence”");
else ok();

// Evidence -> understanding -> human decision, present somewhere.
if (!/bukti.{0,40}pemahaman.{0,40}keputusan/is.test(corpusId))
  fail("the evidence → understanding → decision chain is not stated in Indonesian", "");
else ok();

// ---------------------------------------------------- internal links resolve

const KNOWN_ROUTES = new Set(LOADED.shared.PAGES.map((p) => p.href));
const files = ["app.js", "apa-yang-dilakukan/app.js", "untuk-pendidik/app.js",
  "untuk-manajemen/app.js", "cara-kerja/app.js", "laporan/app.js", "tentang/app.js",
  "kontak/app.js", "mini-pintar/app.js", "shared/chrome.js"];
const { readFileSync } = await import("node:fs");
const HREF_RE = /withLang\(\s*"([^"]+)"/g;
for (const f of files) {
  const src = readFileSync(join(ROOT, f), "utf8");
  let m;
  while ((m = HREF_RE.exec(src))) {
    const href = m[1];
    if (!KNOWN_ROUTES.has(href)) fail("a link points to a route not in PAGES", `${f}: ${href}`);
    else ok();
  }
}

// PAGES itself: unique hrefs, all non-root routes start and end with "/".
const seen = new Set();
for (const p of LOADED.shared.PAGES) {
  if (seen.has(p.href)) fail("a route appears twice in PAGES", p.href);
  else ok();
  seen.add(p.href);
  if (p.href !== "/" && !(p.href.startsWith("/") && p.href.endsWith("/")))
    fail("a route is not in the /slug/ form the http.server convention expects", p.href);
  else ok();
}

// ------------------------------------------------------------- quiz data

const { QUIZ } = LOADED["mini-pintar"];
if (QUIZ.questions.length !== 5) fail("the quick assessment is not five questions", String(QUIZ.questions.length));
else ok();
for (const [i, q] of QUIZ.questions.entries()) {
  if (q.options.length !== 4) fail(`question ${i + 1} does not have four options`, "");
  else ok();
  if (!(q.answer >= 0 && q.answer < q.options.length)) fail(`question ${i + 1}'s answer index is out of range`, "");
  else ok();
  if (new Set(q.options).size !== q.options.length) fail(`question ${i + 1} has a duplicate option`, "");
  else ok();
}
// The five concepts the brief asked for: multiplication, division, a
// fraction, a word problem, basic numerical reasoning — never a sixth
// dropped in or a concept silently duplicated.
const CONCEPT_IDS = QUIZ.questions.map((q) => q.concept.id);
if (new Set(CONCEPT_IDS).size !== 5) fail("the five quiz concepts are not all distinct", CONCEPT_IDS.join(", "));
else ok();

// --------------------------------------------------------- report rows sum

function checkRows(rows, label) {
  for (const [i, r] of rows.entries()) {
    const sum = r.strong + r.mid + r.low;
    if (sum !== r.total) fail(`${label} row ${i + 1}'s bands do not sum to its total`, `${sum} ≠ ${r.total}`);
    else ok();
  }
}
checkRows(LOADED.laporan.REPORT_A.rows, "Reports/REPORT_A");
checkRows(LOADED.laporan.REPORT_B.rows, "Reports/REPORT_B");
checkRows(LOADED["mini-pintar"].MANAGEMENT.rows, "Mini-PINTAR/MANAGEMENT");

// No composite score anywhere in a report row's rendered text: no percent
// sign, no decimal average. (Rows carry raw counts only.)
for (const [label, rows] of [
  ["Reports/REPORT_A", LOADED.laporan.REPORT_A.rows],
  ["Reports/REPORT_B", LOADED.laporan.REPORT_B.rows],
  ["Mini-PINTAR/MANAGEMENT", LOADED["mini-pintar"].MANAGEMENT.rows],
]) {
  for (const r of rows) {
    if (typeof r.strong !== "number" || typeof r.mid !== "number" || typeof r.low !== "number")
      fail(`${label} row is not raw counts`, JSON.stringify(r));
    else ok();
  }
}

// ------------------------------------------------------------- report says

// The Mini-PINTAR management step must say, in words, that it is NOT the
// visitor's own result — this is the one adversarial case the brief names
// explicitly ("Do NOT pretend one demo visitor represents a real class").
const mgmt = LOADED["mini-pintar"].MANAGEMENT;
for (const side of ["id", "en"]) {
  const text = mgmt.intro[side].toLowerCase();
  const needle = side === "id" ? "bukan hasil anda" : "not your result";
  if (!text.includes(needle)) fail("the Mini-PINTAR report does not say it isn't the visitor's own result", side);
  else ok();
}
// And the sim badge itself must say "simulasi"/"simulated" — not merely
// "example", which reads as this-could-be-real.
for (const side of ["id", "en"]) {
  const needle = side === "id" ? "simulasi" : "simulated";
  if (!mgmt.simLabel[side].toLowerCase().includes(needle))
    fail("the sample-class badge does not say the data is simulated", side);
  else ok();
}

// --------------------------------------------------------------- report

if (fails.length) {
  console.error(`\naudit FAILED — ${fails.length} problem(s), ${checks} checks passed\n`);
  for (const f of fails) console.error("  " + f);
  process.exit(1);
}
console.log(`audit OK — ${checks} checks, ${ALL.length} string pairs across ${MODULES.length} content modules, ` +
  `${QUIZ.questions.length} quiz questions, ${LOADED.shared.PAGES.length} routes`);
