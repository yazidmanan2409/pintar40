// PINTAR corporate website — content and claims audit.
//
// Walks every content module on the site (the corporate pages and
// Mini-PINTAR), every page's <title> and meta description, and the shipped
// source, and checks what the site claims about PINTAR:
//
//   * no AI hype, jargon, exaggeration, fabricated trust, or PINTAR taking
//     the decision itself;
//   * none of the claims the 24 Sep reconciliation removed comes back, and
//     no new one takes its place: no "PINTAR 4.0", no audience PINTAR has no
//     surface for, no team claim, no "answers and interactions", no
//     unsupported duration, no adoption or availability claim, no quantified
//     time saving, no invented legal entity;
//   * what PINTAR is designed to do, what Mini-PINTAR demonstrates and what
//     is live are kept apart;
//   * the reports are simulated and say so, never guess a cause, and never
//     turn "belum cukup bukti" into a group of children;
//   * the site writes nothing to the visitor's device, anywhere;
//   * identity: the supplied logo rendered the product's way, brand and
//     evidence colours as separate tokens, the product's two weights;
//   * every internal link is a real route, and there is ONE Mini-PINTAR.
//
// Fidelity to the product's own words, metrics, thresholds and assets is
// verify/canonical.mjs. This file is about claims.
//
// Run: node verify/audit.mjs

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const REPO = join(ROOT, "..", "..");

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
  for (const [key, value] of Object.entries(mod)) pairs(value, `${name}.${key}`, ALL);
}
// Mini-PINTAR's lesson paragraphs are arrays of strings per language, not
// pairs; they are public text all the same.
for (const [k, l] of Object.entries(LOADED["mini-pintar"].LESSONS)) {
  l.body.id.forEach((x, i) => ALL.push([`mini-pintar.LESSONS.${k}.body[${i}]`, { id: x, en: l.body.en[i] }]));
}

// Every page's <title> and meta description are public text too.
const PAGE_DIRS = ["", ...LOADED.shared.PAGES.map((p) => p.href.replace(/^\/|\/$/g, "")).filter(Boolean)];
for (const d of new Set(PAGE_DIRS)) {
  const html = readFileSync(join(ROOT, d, "index.html"), "utf8");
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "";
  const desc = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? "";
  ALL.push([`${d || "home"}/index.html title+description`, { id: `${title} ${desc}`, en: `${title} ${desc}` }]);
}

if (ALL.length < 250) fail("suspiciously few string pairs found — a module may have failed to load", String(ALL.length));
else ok();

// The contact form asks who the visitor is. Offering "Dinas" as an answer to
// "who are you?" claims nothing about PINTAR; it is the one place the
// audience words below may appear.
const ASKS_WHO_YOU_ARE = (path) => path.startsWith("kontak.FORM.roleOptions");

// --------------------------------------------------------------- empty sides

for (const [path, p] of ALL) {
  if (path === "mini-pintar.OUTCOMES.KONSISTEN.body") { ok(); continue; } // empty on both sides by ruling
  if (!p.id.trim()) fail("empty ID side", path); else ok();
  if (!p.en.trim()) fail("empty EN side", path); else ok();
}

// -------------------------------------------------------- banned vocabulary

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
const TAKES_DECISION = [
  "pintar memutuskan", "pintar mengambil keputusan", "pintar decides",
  "pintar takes the decision", "otomatis mengambil tindakan", "automatically takes action",
];

// The 24 Sep reconciliation. Each of these was on the site and is not
// supported by the product or by any evidence in the repository; none may
// return, and none may be replaced by a new unsupported claim.
const REMOVED = [
  // The product's public name is PINTAR.
  ["a version name the product does not use publicly", ["pintar 4.0", "pintar 4 ", "pintar4"]],
  // Canonical roles are Guru, Kepala departemen, Dekan, Admin sekolah. There
  // is no surface for a foundation, an education office or a principal.
  ["an audience PINTAR has no surface for", [
    "yayasan", "foundation", "dinas", "education office", "pengambil kebijakan", "policymaker",
    "pembuat kebijakan", "kepala sekolah", "principal"]],
  // No team, founder or staff record exists anywhere in the repository.
  ["a claim about who builds PINTAR", [
    "dibangun oleh orang-orang", "built by people", "siapa yang membangunnya", "who builds it",
    "tim kami", "our team", "pendiri", "founder"]],
  // Interaction telemetry never scores and is never evidence (INV-11).
  ["interaction described as evidence", ["dan interaksi", "and interaction", "jejak bukti", "trace of evidence"]],
  // Nothing is measured; the site states no time saved.
  ["a quantified time saving", [
    "satu jam", "an hour", "separuh waktu", "half the time", "kali lebih cepat", "times faster",
    "hemat waktu", "saves time", "jam per minggu", "hours a week"]],
  // PINTAR shows figures after enough official evidence, not as answers arrive.
  ["an immediacy the product does not have", [
    "langsung lihat", "see straight away", "begitu jawaban masuk", "as answers come in", "real-time", "real time", "seketika"]],
  // The product's name is Uji Cepat.
  ["a non-canonical name for Uji Cepat", ["asesmen singkat", "short assessment"]],
  // Management has a roster and a deliberate, recorded way to open one learner.
  ["an absolute the product contradicts", ["mengawasi orang", "watching people", "bukan daftar nama", "not a list of names"]],
  // Launch status: the site describes what PINTAR is designed to do and
  // demonstrates it; it does not say PINTAR is in use anywhere.
  ["an adoption or availability claim", [
    "digunakan oleh", "digunakan di", "sudah digunakan", "sudah dipakai", "dipakai oleh", "dipakai di",
    "in use", "used by", "used in", "already used", "sudah tersedia", "now available", "available now",
    "tersedia sekarang", "telah diluncurkan", "diluncurkan", "launched", "sekolah mitra", "partner schools",
    "pelanggan", "customers", "klien kami", "our clients"]],
  // The public name, not the mark's artwork, is what the copy calls PINTAR.
  ["the product called by its mark rather than its name", ["pintar selalu"]],
];

for (const [path, p] of ALL) {
  for (const side of ["id", "en"]) {
    const text = ` ${p[side].toLowerCase()} `;
    for (const [label, list] of [
      ["AI hype", AI_HYPE], ["corporate jargon", JARGON],
      ["an exaggerated claim", EXAGGERATED], ["a fabricated trust claim", FABRICATED_TRUST],
      ["PINTAR described as taking the decision itself", TAKES_DECISION],
      ...REMOVED,
    ]) {
      if (label === "an audience PINTAR has no surface for" && ASKS_WHO_YOU_ARE(path)) { ok(); continue; }
      for (const w of list) {
        if (text.includes(w)) fail(`${label} ("${w.trim()}")`, `${path}.${side}`);
        else ok();
      }
    }
  }
}

// ------------------------------------------------------------- the duration
//
// Ruled: Mini-PINTAR takes "sekitar tiga menit / about three minutes"; its
// optional school's side adds "sekitar satu menit / about one minute". No
// other length of time is stated anywhere, and no number of minutes at all.

const DURATIONS = ["sekitar tiga menit", "about three minutes", "sekitar satu menit", "about one minute"];
for (const [path, p] of ALL) {
  for (const side of ["id", "en"]) {
    let text = p[side].toLowerCase();
    for (const d of DURATIONS) text = text.split(d).join(" ");
    // "second" alone is an ordinal ("the second matters", "a second
    // number"), so only plural or numbered units, and "an hour", count.
    if (/menit|minute|\bjam\b|\bdetik\b|\bseconds\b|\bhours\b|\ban hour\b|\b\d+\s*(second|hour)/.test(text))
      fail("a duration other than the ruled one", `${path}.${side}: ${p[side].slice(0, 80)}`);
    else ok();
  }
}
{
  const corpus = ALL.map(([, p]) => `${p.id} ${p.en}`.toLowerCase()).join(" ");
  for (const d of ["sekitar tiga menit", "about three minutes"]) {
    if (!corpus.includes(d)) fail("the ruled duration is not stated", d);
    else ok();
  }
}

// ---------------------------------------------------------- launch status

const { FOOTER, SAMPLE } = LOADED.shared;
for (const [side, words] of [["id", ["dirancang", "demonstrasi", "bukan asesmen resmi"]],
                             ["en", ["designed", "demonstration", "not an official assessment"]]]) {
  for (const w of words) {
    if (!FOOTER.status[side].toLowerCase().includes(w))
      fail("the footer no longer separates designed, demonstrated and live", `${side}: "${w}"`);
    else ok();
  }
}
if (!/bukan situs produksi/i.test(FOOTER.copyright.id) || !/not a production site/i.test(FOOTER.copyright.en))
  fail("the footer no longer says this is not a production site");
else ok();
// The legal entity is open. The line names none, and says it is pending.
for (const side of ["id", "en"]) {
  const c = FOOTER.copyright[side];
  if (/\b(PT|CV|Tbk|Ltd|LLC|Inc|GmbH|Pte)\b\.?|Yayasan|Foundation/.test(c))
    fail("the copyright line names a legal entity", `${side}: ${c}`);
  else ok();
  if (!/menunggu konfirmasi|pending confirmation/.test(c))
    fail("the copyright line does not say its holder is pending", `${side}: ${c}`);
  else ok();
}
if (!/rancangan|design sample/i.test(`${SAMPLE.label.id} ${SAMPLE.label.en}`))
  fail("the sample banner no longer says this is a design sample");
else ok();

// The product says what it is DESIGNED to do wherever the present tense
// would read as a working deployment. These leads carry it.
for (const [path, pair] of [
  ["home.HERO.lede", LOADED.home.HERO.lede],
  ["untuk-pendidik.HEADER.lede", LOADED["untuk-pendidik"].HEADER.lede],
  ["untuk-manajemen.BOUNDARY.body", LOADED["untuk-manajemen"].BOUNDARY.body],
  ["cara-kerja.HEADER.lede", LOADED["cara-kerja"].HEADER.lede],
  ["laporan.HEADER.lede", LOADED.laporan.HEADER.lede],
  ["shared.FOOTER.tagline", FOOTER.tagline],
]) {
  if (!pair.id.includes("dirancang") || !pair.en.includes("designed"))
    fail("a capability is stated as a working deployment, not as design", path);
  else ok();
}

// ------------------------------------------------------ reports, honestly

const R = LOADED.laporan;
const SCHOOL = LOADED["mini-pintar"].SCHOOL;
const SIM = [
  ["laporan.HEADER.lede", R.HEADER.lede, "data simulasi", "simulated data"],
  ["laporan.REPORT_A.meta", R.REPORT_A.meta, "data simulasi", "simulated data"],
  ["laporan.REPORT_B.meta", R.REPORT_B.meta, "data simulasi", "simulated data"],
  ["mini-pintar.SCHOOL.management.badge", SCHOOL.management.badge, "data simulasi", "simulated data"],
];
for (const [path, pair, id, en] of SIM) {
  if (!pair.id.toLowerCase().includes(id) || !pair.en.toLowerCase().includes(en))
    fail("simulated figures are not labelled as simulated", path);
  else ok();
}
if (!SCHOOL.management.sub.id.includes("tidak ada yang berasal dari jawaban Anda") ||
    !SCHOOL.management.sub.en.includes("none of them comes from your answers"))
  fail("Mini-PINTAR's management side does not say none of it is the visitor's", "SCHOOL.management.sub");
else ok();

// Not enough evidence is a state of a FIGURE, never a group of children, and
// a report never guesses why.
const REPORT_TEXT = ALL.filter(([path]) => path.startsWith("laporan.") || path.startsWith("mini-pintar.SCHOOL."));
for (const [path, p] of REPORT_TEXT) {
  for (const side of ["id", "en"]) {
    const text = p[side].toLowerCase();
    if (/belum cukup bukti|not enough evidence/.test(text) && path !== "laporan.PRINCIPLE.line")
      fail("\"belum cukup bukti\" used as something other than the principle", `${path}.${side}`);
    else ok();
    if (/kemungkinan|mungkin karena|disebabkan|likely|probably|caused by|due to/.test(text))
      fail("a report guesses a cause", `${path}.${side}`);
    else ok();
  }
}
for (const [label, rows] of [["laporan.REPORT_A", R.REPORT_A.figures], ["laporan.REPORT_B", R.REPORT_B.figures],
                             ["mini-pintar.SCHOOL.educator", SCHOOL.educator.figures],
                             ["mini-pintar.SCHOOL.management", SCHOOL.management.figures]]) {
  for (const f of rows) {
    const bands = Object.keys(f).filter((k) => ["strong", "mid", "low", "bands"].includes(k));
    if (bands.length) fail("a report figure uses learner bands the product does not have", `${label} ${f.metric}: ${bands}`);
    else ok();
  }
}

// ------------------------------------------------------ zero-write, anywhere
//
// Mini-PINTAR's ADR forbids persistence of any kind, including browser
// storage, and the site that contains it holds itself to the same rule.

const PERSISTENCE = ["localStorage", "sessionStorage", "indexedDB", "openDatabase", "document.cookie",
  "cookieStore", "caches.open", "navigator.storage", "showSaveFilePicker"];
const stripComments = (text, file) => file.endsWith(".html")
  ? text.replace(/<!--[\s\S]*?-->/g, " ")
  : text.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ").replace(/\s\/\/ .*$/gm, " ");
function shipped(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (f === "verify" || f === "screens" || f === "node_modules") continue;
    if (statSync(p).isDirectory()) shipped(p, out);
    else if (/\.(js|mjs|html|css)$/.test(f)) out.push(p);
  }
  return out;
}
const SHIPPED = shipped(ROOT);
for (const p of SHIPPED) {
  const code = stripComments(readFileSync(p, "utf8"), p);
  for (const api of PERSISTENCE) {
    if (code.includes(api)) fail(`a storage API ("${api}")`, relative(ROOT, p));
    else ok();
  }
}
if (SHIPPED.length < 25) fail("suspiciously few shipped files scanned", String(SHIPPED.length));
else ok();
// And no "PINTAR 4.0" in anything a visitor can view the source of.
for (const p of SHIPPED) {
  if (/PINTAR\s*4\.0/i.test(readFileSync(p, "utf8"))) fail("\"PINTAR 4.0\" in a shipped file", relative(ROOT, p));
  else ok();
}
// The language is read from ?lang= and written nowhere.
{
  const lang = readFileSync(join(ROOT, "shared/lang.js"), "utf8");
  if (!/new URLSearchParams\(location\.search\)\.get\("lang"\)/.test(lang))
    fail("the language no longer comes from ?lang=", "shared/lang.js");
  else ok();
}

// ------------------------------------------------------------------ identity

const css = readFileSync(join(ROOT, "shared/style.css"), "utf8");
const miniCss = readFileSync(join(ROOT, "mini-pintar/style.css"), "utf8");
const chrome = readFileSync(join(ROOT, "shared/chrome.js"), "utf8");
const miniHtml = readFileSync(join(ROOT, "mini-pintar/index.html"), "utf8");
const tokenValue = (text, name) => text.match(new RegExp(`${name}:\\s*(#[0-9A-Fa-f]{6})\\s*;`))?.[1]?.toUpperCase();

// The supplied mark, rendered the product's way: height set, width never.
if (!/export const LOGO_SRC = "\/shared\/brand\/pintar-selalu-logo\.png";/.test(chrome))
  fail("the site header does not use the supplied logo", "shared/chrome.js");
else ok();
if (!/alt: "PINTAR SELALU"/.test(chrome) || !/alt="PINTAR SELALU"/.test(miniHtml))
  fail("the logo's alternative text is not what the artwork says", "PINTAR SELALU");
else ok();
if (!/\.brand__logo \{ height: 36px; width: auto;/.test(css) || !/\.brand__logo \{ height: 36px; width: auto;/.test(miniCss))
  fail("the logo is not rendered at the product's 36px height with its width left free");
else ok();
if (!/src="\.\.\/shared\/brand\/pintar-selalu-logo\.png"/.test(miniHtml))
  fail("Mini-PINTAR does not carry the supplied logo", "mini-pintar/index.html");
else ok();
// The logo leads Home, in the visitor's language, EVERYWHERE it is drawn
// (header and footer): a count, so one linked copy cannot cover for another.
{
  const drawn = (chrome.match(/\[logo\(\)\]/g) || []).length;
  const linked = (chrome.match(/el\("a", \{ class: "brand", href: withLang\("\/", lang\) \}, \[logo\(\)\]\)/g) || []).length;
  if (drawn < 2 || linked !== drawn)
    fail("the header logo does not lead Home", `shared/chrome.js: ${linked} of ${drawn} logos link Home`);
  else ok();
}

// Brand and evidence are separate semantics, so a brand change can never
// repaint what a figure means.
const BRAND = ["--brand-primary", "--brand-primary-ink", "--brand-primary-soft", "--brand-primary-hover"];
const EVIDENCE = ["--evidence-bar", "--evidence-track", "--evidence-absent-line"];
for (const t of [...BRAND, ...EVIDENCE]) {
  if (!tokenValue(css, t)) fail("a brand or evidence token is missing", t);
  else ok();
}
for (const e of EVIDENCE) {
  for (const b of BRAND) {
    if (tokenValue(css, e) && tokenValue(css, e) === tokenValue(css, b))
      fail("an evidence colour is the brand colour", `${e} = ${b}`);
    else ok();
  }
}
{
  const start = css.indexOf("/* ---------------------------------------------------------- report mock */");
  const end = css.indexOf("/* ------------------------------------------------------------------ form */");
  const report = start >= 0 && end > start ? css.slice(start, end) : "";
  if (!report) fail("the report styles could not be found", "shared/style.css");
  else {
    if (/--brand-|--status-|--accent/.test(report.replace(/\/\*[\s\S]*?\*\//g, "")))
      fail("a report style paints evidence in a brand or status colour", "shared/style.css");
    else ok();
    if (!/\.rbar > i \{[^}]*background: var\(--evidence-bar\)/.test(report))
      fail("readiness bars are not the neutral evidence colour", "shared/style.css");
    else ok();
  }
  if (!/\.rbar i \{[^}]*background: var\(--ink-3\)/.test(miniCss))
    fail("Mini-PINTAR's readiness bars are not the neutral ink", "mini-pintar/style.css");
  else ok();
}
if (/--accent|--status-mid|--warn-line/.test(css)) fail("a retired token is still defined", "shared/style.css");
else ok();
// The product's two weights and its typeface, in both stylesheets.
for (const [name, text] of [["shared/style.css", css], ["mini-pintar/style.css", miniCss]]) {
  const weights = [...text.replace(/@font-face\s*\{[^}]*\}/g, "").matchAll(/font-weight:\s*(\d+)/g)].map((m) => m[1]);
  const off = weights.filter((w) => w !== "400" && w !== "600");
  if (off.length) fail("a weight the product does not use", `${name}: ${[...new Set(off)].join(", ")}`);
  else ok();
  const faces = [...text.matchAll(/@font-face\s*\{[^}]*font-family: "Plus Jakarta Sans";[^}]*\}/g)].length;
  if (faces !== 2 || !/--(font-)?sans: "Plus Jakarta Sans",/.test(text))
    fail("the product's typeface is not declared", `${name}: ${faces} faces, stack ${/--(font-)?sans: "Plus Jakarta Sans",/.test(text) ? "leads with it" : "does not lead with it"}`);
  else ok();
}

// --------------------------------------------------------- the principles

const corpusId = ALL.map(([, p]) => p.id).join(" • ").toLowerCase();
const corpusEn = ALL.map(([, p]) => p.en).join(" • ").toLowerCase();
if (!corpusId.includes("belum cukup bukti"))
  fail("the site never states PINTAR's principle in Indonesian", "“belum cukup bukti”");
else ok();
if (!corpusEn.includes("not enough evidence") && !corpusEn.includes("isn't enough") && !corpusEn.includes("is not enough"))
  fail("the site never states PINTAR's principle in English", "“not enough evidence”");
else ok();
if (!/bukti.{0,40}pemahaman.{0,40}keputusan/is.test(corpusId))
  fail("the evidence → understanding → decision chain is not stated in Indonesian", "");
else ok();

// ---------------------------------------------------------------- no walls

const WORD_LIMIT = 65;
for (const [path, p] of ALL) {
  for (const side of ["id", "en"]) {
    const words = p[side].trim().split(/\s+/).filter(Boolean).length;
    if (words > WORD_LIMIT) fail(`a block of copy is longer than ${WORD_LIMIT} words (${words})`, `${path}.${side}`);
    else ok();
  }
}

// ---------------------------------------------------- internal links resolve

const KNOWN_ROUTES = new Set(LOADED.shared.PAGES.map((p) => p.href));
const APPS = ["app.js", "apa-yang-dilakukan/app.js", "untuk-pendidik/app.js",
  "untuk-manajemen/app.js", "cara-kerja/app.js", "laporan/app.js", "tentang/app.js",
  "kontak/app.js", "shared/chrome.js"];
for (const f of APPS) {
  const src = readFileSync(join(ROOT, f), "utf8");
  for (const m of src.matchAll(/withLang\(\s*"([^"]+)"/g)) {
    if (!KNOWN_ROUTES.has(m[1])) fail("a link points to a route not in PAGES", `${f}: ${m[1]}`);
    else ok();
  }
}
for (const d of LOADED["mini-pintar"].REVEAL.doors) {
  if (!KNOWN_ROUTES.has(d.href)) fail("a Mini-PINTAR door points to a route not in PAGES", d.href);
  else ok();
}
// "Kenali PINTAR" promises the product, so it leads to what PINTAR does.
if (!/href: withLang\("\/apa-yang-dilakukan\/", lang\), text: t\(HERO\.ctaSecondary\)/.test(readFileSync(join(ROOT, "app.js"), "utf8")))
  fail("the home page's Kenali PINTAR does not lead to What PINTAR Does", "app.js");
else ok();
const seen = new Set();
for (const p of LOADED.shared.PAGES) {
  if (seen.has(p.href)) fail("a route appears twice in PAGES", p.href); else ok();
  seen.add(p.href);
  if (p.href !== "/" && !(p.href.startsWith("/") && p.href.endsWith("/")))
    fail("a route is not in the /slug/ form the http.server convention expects", p.href);
  else ok();
}

// ------------------------------------------------------------ one Mini-PINTAR
//
// Ruled 24 Sep: the approved M2 is the single public implementation, moved
// here. The corporate quiz is retired, and nothing of a second one remains.
{
  const mini = LOADED["mini-pintar"];
  for (const retired of ["QUIZ", "MANAGEMENT", "EDUCATOR", "EVIDENCE"]) {
    if (retired in mini) fail("the retired corporate quiz is back", `mini-pintar exports ${retired}`);
    else ok();
  }
  for (const needed of ["MAP_ITEMS", "CHECK_ITEMS", "LESSONS", "EVIDENCE_LIMIT", "SCHOOL"]) {
    if (!(needed in mini)) fail("the Mini-PINTAR here is not the approved M2", `missing ${needed}`);
    else ok();
  }
  if (!existsSync(join(ROOT, "mini-pintar/adapt.js"))) fail("Mini-PINTAR has no adaptation module");
  else ok();
  // The old location keeps only the shared browser tooling the role views use.
  const old = join(REPO, "website/mini-pintar/app");
  const left = existsSync(old) ? shipped(old).map((p) => relative(old, p)) : [];
  const allowed = new Set(["verify/driver.mjs", "verify/probes.mjs"]);
  const oldFiles = existsSync(old) ? [...function walk(d, out = []) {
    for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? walk(p, out) : out.push(relative(old, p)); }
    return out; }(old)] : [];
  const stray = [...new Set([...left, ...oldFiles])].filter((f) => !allowed.has(f));
  if (stray.length) fail("a second Mini-PINTAR remains at website/mini-pintar/app", stray.join(", "));
  else ok();
}

// --------------------------------------------------------------- report

if (fails.length) {
  console.error(`\naudit FAILED — ${fails.length} problem(s), ${checks} checks passed\n`);
  for (const f of fails) console.error("  " + f);
  process.exit(1);
}
console.log(`audit OK — ${checks} checks, ${ALL.length} public strings across ${MODULES.length} content ` +
  `modules and ${new Set(PAGE_DIRS).size} pages, ${SHIPPED.length} shipped files scanned for storage, ` +
  `${LOADED.shared.PAGES.length} routes`);
