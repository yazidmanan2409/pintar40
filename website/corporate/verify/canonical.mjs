// PINTAR corporate website — canonical fidelity.
//
// THE DIRECTION OF AUTHORITY IS ONE WAY: the canonical PINTAR product decides,
// and the corporate website represents it. Never the reverse. So this file
// reads the PRODUCT'S OWN SOURCES — its copy table, its metric catalogue, its
// readiness tiers, the figures each surface asks for, its identity tokens and
// assets — and holds the website to them.
//
// canonical-snapshot.mjs is NOT a second specification. It is the record of
// what the website was last reconciled against, pinned to a product commit,
// so the result is deterministic and a change on main is noticed rather than
// silently absorbed. Two checks, reported separately:
//
//   A. PRODUCT vs SNAPSHOT. If the product no longer says what the snapshot
//      recorded, the website is now out of date by definition:
//        "canonical product changed — website reconciliation required: …"
//      The fix is never to edit the snapshot until it passes. It is to
//      reconcile the website with the product, then re-record the snapshot
//      against the commit it was reconciled with.
//
//   B. WEBSITE vs SNAPSHOT. Every product word, threshold, metric, surface
//      and asset the site shows matches what the product says:
//        "website misrepresents canonical PINTAR: …"
//
// If the product's sources cannot be found, this FAILS. A website check that
// passes because it could not see the product is the green-on-wrong-thing
// this file exists to prevent.
//
// Run:  node verify/canonical.mjs                  (product = this repository)
//       node verify/canonical.mjs --at 2ac7ab6     (product read from git at a commit)
//       node verify/canonical.mjs --product <dir>  (product read from a copy)
//       node verify/canonical.mjs --print [--at …] (print what the product says)

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as SNAP from "./canonical-snapshot.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE = join(HERE, "..");
const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const PRODUCT = opt("--product") ?? join(SITE, "..", "..");
const AT = opt("--at");
const PRINT = args.includes("--print");

const changed = [];   // A
const wrong = [];     // B
let checks = 0;
const ok = () => { checks += 1; };

// ------------------------------------------------------------ product reads

function readProduct(rel, encoding = "utf8") {
  if (AT) {
    try {
      const buf = execFileSync("git", ["-C", PRODUCT, "show", `${AT}:${rel}`],
        { maxBuffer: 64 * 1024 * 1024 });
      return encoding ? buf.toString(encoding) : buf;
    } catch { return null; }
  }
  const p = join(PRODUCT, rel);
  return existsSync(p) ? readFileSync(p, encoding ?? undefined) : null;
}

function listMigrations() {
  if (AT) {
    try {
      return execFileSync("git", ["-C", PRODUCT, "ls-tree", "--name-only", `${AT}:supabase/migrations`])
        .toString().split("\n").filter((f) => f.endsWith(".sql")).sort();
    } catch { return null; }
  }
  const d = join(PRODUCT, "supabase", "migrations");
  return existsSync(d) ? readdirSync(d).filter((f) => f.endsWith(".sql")).sort() : null;
}

const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");

const REQUIRED = [
  "src/lib/hle.ts", "src/lib/pengajar.ts", "src/lib/pimpinan.ts", "src/app/globals.css",
  ...Object.keys(SNAP.ASSETS),
];
const missing = REQUIRED.filter((f) => readProduct(f, null) === null);
const migrations = listMigrations();
if (missing.length || !migrations || migrations.length === 0) {
  console.error(`\ncanonical FAILED — the canonical product's sources were not found` +
    ` (${AT ? `git ${AT}` : PRODUCT}): ${[...missing, ...(migrations?.length ? [] : ["supabase/migrations/"])].join(", ")}`);
  console.error("  The website cannot be verified against PINTAR without PINTAR. Run this from the product repository.");
  process.exit(1);
}

/** Every copy row the site depends on, resolved the way t() resolves it. */
function hleRows(text, keys) {
  const out = {};
  for (const key of keys) {
    const start = text.indexOf(`  "${key}": {`, text.indexOf("const table: Table = {"));
    if (start < 0) { out[key] = null; continue; }
    // A row is one object of string values; find its closing brace while
    // skipping over string contents.
    let i = text.indexOf("{", start), depth = 0, inStr = false;
    for (; i < text.length; i += 1) {
      const c = text[i];
      if (inStr) { if (c === "\\") i += 1; else if (c === '"') inStr = false; continue; }
      if (c === '"') inStr = true;
      else if (c === "{") depth += 1;
      else if (c === "}") { depth -= 1; if (depth === 0) break; }
    }
    const body = text.slice(text.indexOf("{", start) + 1, i);
    const row = {};
    for (const m of body.matchAll(/([A-Za-z_]+):\s*"((?:[^"\\]|\\.)*)"/g)) row[m[1]] = JSON.parse(`"${m[2]}"`);
    out[key] = row;
  }
  return out;
}

/** What a reader with this persona sees (hle.ts t(), without stage copy). */
export const resolve = (row, persona, locale) => locale === "en"
  ? row[`en_${persona}`] ?? row.en
  : row[persona] ?? row.default;

function stringArray(text, name) {
  const m = text.match(new RegExp(`const ${name} = \\[([\\s\\S]*?)\\] as const;`));
  return m ? [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]) : null;
}

const hle = readProduct("src/lib/hle.ts");
const product = {
  labels: hleRows(hle, Object.keys(SNAP.LABELS)),
  metrics: {},
  tiers: {},
  surfaces: {
    educatorClass: stringArray(readProduct("src/lib/pengajar.ts"), "METRIK_KELAS"),
    managementClass: stringArray(readProduct("src/lib/pimpinan.ts"), "METRIK_SIMPUL"),
    managementInstitution: stringArray(readProduct("src/lib/pimpinan.ts"), "METRIK_INSTITUSI"),
  },
  tokens: {},
  assets: {},
  catalogueWriters: {},
  capabilityDefiners: {},
};

const catalogue = readProduct(`supabase/migrations/${SNAP.CATALOGUE_FILE}`) ?? "";
for (const m of catalogue.matchAll(
  /\('MC-1',\s*'([a-z_.]+)',\s*'([a-z_.]+)',\s*'([a-z_.]+)',\s*'([A-Z_]+)',\s*(\d+),\s*array\[([^\]]*)\],\s*array\[([^\]]*)\]/g)) {
  const [, id, label, meaning, scope, min, vis, aud] = m;
  const row = { label, meaning, scope, minimum: Number(min),
    visualizations: [...vis.matchAll(/'([^']+)'/g)].map((x) => x[1]),
    audiences: [...aud.matchAll(/'([^']+)'/g)].map((x) => x[1]) };
  if (product.metrics[id] && JSON.stringify(product.metrics[id]) !== JSON.stringify(row))
    product.metrics[id] = { ambiguous: true };
  else product.metrics[id] = row;
}
for (const m of catalogue.matchAll(
  /\('MC-1',\s*'(kesiapan\.[a-z_]+)',\s*(\d+),\s*(null|[\d.]+),\s*(null|[\d.]+),\s*(true|false),\s*(true|false)\)/g)) {
  const [, key, ordinal, min, max, gate, nopost] = m;
  product.tiers[key] = { ordinal: Number(ordinal), min: min === "null" ? null : Number(min),
    max: max === "null" ? null : Number(max), requiresSafetyGate: gate === "true",
    appliesWithoutPostTest: nopost === "true" };
}

const css = readProduct("src/app/globals.css");
for (const name of Object.keys(SNAP.TOKENS)) {
  const m = css.match(new RegExp(`${name}:\\s*(#[0-9A-Fa-f]{6})\\s*;`));
  product.tokens[name] = m ? m[1].toUpperCase() : null;
}
for (const f of Object.keys(SNAP.ASSETS)) product.assets[f] = sha256(readProduct(f, null));

// Any migration that WRITES the catalogue, and any that defines who may do
// what. A new one means the product's policy may have moved under the site.
const CATALOGUE_WRITE = /(insert into|update|delete from|alter table)\s+(public\.)?(metric_definitions|readiness_tiers|metric_catalogue)\b|publish_metric_catalogue\(/i;
const CAPABILITIES = /function\s+public\.role_capabilities\b/i;
for (const f of migrations) {
  const text = readProduct(`supabase/migrations/${f}`);
  if (CATALOGUE_WRITE.test(text)) product.catalogueWriters[f] = sha256(text);
  if (CAPABILITIES.test(text)) product.capabilityDefiners[f] = sha256(text);
}

if (PRINT) {
  console.log(JSON.stringify({ read_from: AT ? `git ${AT}` : PRODUCT, ...product }, null, 2));
  process.exit(0);
}

// ======================================================== A. product vs snapshot

const moved = (what) => changed.push(what);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

for (const [key, want] of Object.entries(SNAP.LABELS)) {
  const got = product.labels[key];
  if (!got) moved(`copy row "${key}" no longer exists in src/lib/hle.ts`);
  else if (!same(got, want)) moved(`copy row "${key}" now reads ${JSON.stringify(got)}`);
  else ok();
}
for (const [id, want] of Object.entries(SNAP.METRICS)) {
  const got = product.metrics[id];
  if (!got) moved(`MC-1 metric ${id} is no longer defined in ${SNAP.CATALOGUE_FILE}`);
  else if (!same(got, want)) moved(`MC-1 metric ${id} is now ${JSON.stringify(got)}`);
  else ok();
}
for (const [key, want] of Object.entries(SNAP.TIERS)) {
  const got = product.tiers[key];
  if (!got) moved(`readiness tier ${key} is no longer defined in MC-1`);
  else if (!same(got, want)) moved(`readiness tier ${key} is now ${JSON.stringify(got)}`);
  else ok();
}
if (Object.keys(product.tiers).length !== Object.keys(SNAP.TIERS).length)
  moved(`MC-1 now has ${Object.keys(product.tiers).length} readiness tiers`);
else ok();
for (const [name, want] of Object.entries(SNAP.SURFACES)) {
  if (!same(product.surfaces[name], want))
    moved(`the ${name} surface now asks for ${JSON.stringify(product.surfaces[name])}`);
  else ok();
}
for (const [name, want] of Object.entries(SNAP.TOKENS)) {
  if (product.tokens[name] !== want) moved(`${name} is now ${product.tokens[name]} in src/app/globals.css`);
  else ok();
}
for (const [f, want] of Object.entries(SNAP.ASSETS)) {
  if (product.assets[f] !== want) moved(`${f} has changed (sha256 ${product.assets[f].slice(0, 12)}…)`);
  else ok();
}
for (const [label, got, want] of [
  ["a migration that writes the metric catalogue", product.catalogueWriters, SNAP.CATALOGUE_WRITERS],
  ["a migration that defines role capabilities", product.capabilityDefiners, SNAP.CAPABILITY_DEFINERS],
]) {
  for (const f of Object.keys(got)) {
    if (!(f in want)) moved(`${label} has been added: ${f}`);
    else if (got[f] !== want[f]) moved(`${label} has been edited: ${f}`);
    else ok();
  }
  for (const f of Object.keys(want)) if (!(f in got)) moved(`${label} has gone: ${f}`);
}

// ======================================================== B. website vs snapshot

const misrep = (what) => wrong.push(what);
const W = {
  home: await import("../content.js"),
  does: await import("../apa-yang-dilakukan/content.js"),
  educators: await import("../untuk-pendidik/content.js"),
  reports: await import("../laporan/content.js"),
  mini: await import("../mini-pintar/content.js"),
};

/** The product's own sentence for a copy key, in both languages. */
const P = (key, persona = "educator") => {
  const row = SNAP.LABELS[key];
  return row ? { id: resolve(row, persona, "id"), en: resolve(row, persona, "en") } : null;
};
function verbatim(pair, key, where, persona) {
  const want = P(key, persona);
  // A figure the site reconciled nothing for (a metric it was never meant to
  // show) is itself the misrepresentation; it never crashes the check.
  if (!want) { misrep(`${where}: "${key}" is not a product sentence the website was reconciled against`); return; }
  for (const side of ["id", "en"]) {
    if (!pair || pair[side] !== want[side])
      misrep(`${where}.${side} is not the product's "${key}" word for word (${JSON.stringify(pair?.[side])} ≠ ${JSON.stringify(want[side])})`);
    else ok();
  }
}
function contains(pair, key, where, persona) {
  const want = P(key, persona);
  if (!want) { misrep(`${where}: "${key}" is not a product sentence the website was reconciled against`); return; }
  for (const side of ["id", "en"]) {
    if (!pair || !pair[side].includes(want[side]))
      misrep(`${where}.${side} does not carry the product's "${key}" (${JSON.stringify(want[side])})`);
    else ok();
  }
}

/**
 * One figure: a metric the product has, the product's label and meaning,
 * MC-1's minimum, a surface that really shows it, and an evidence state
 * consistent with its own sample.
 */
function figure(f, where, surface, persona) {
  const def = SNAP.METRICS[f.metric];
  if (!def) { misrep(`${where}: ${f.metric} is not an MC-1 metric`); return; }
  ok();
  if (!SNAP.SURFACES[surface].includes(f.metric))
    misrep(`${where}: ${f.metric} is not a figure the product's ${surface} surface shows`);
  else ok();
  verbatim(f.label, def.label, `${where}.label`, persona);
  if (f.meaning) verbatim(f.meaning, def.meaning, `${where}.meaning`, persona);
  if (f.needed !== def.minimum)
    misrep(`${where}: minimum ${f.needed} is not MC-1's ${def.minimum} for ${f.metric}`);
  else ok();
  const state = f.have >= f.needed && f.have > 0 ? "cukup" : f.have > 0 ? "belum_cukup" : "belum_ada";
  if (f.state !== state)
    misrep(`${where}: ${f.metric} is drawn as "${f.state}" but ${f.have}/${f.needed} makes it "${state}"`);
  else ok();
  if (f.state !== "cukup" && "value" in f)
    misrep(`${where}: ${f.metric} carries a value while below its minimum`);
  else ok();
  if (f.tiers) tiersOf(f.tiers, `${where}.tiers`, f.have);
}
function tiersOf(counts, where, sample) {
  const keys = Object.keys(counts).map((k) => `kesiapan.${k}`);
  if (!same([...keys].sort(), Object.keys(SNAP.TIERS).sort()))
    misrep(`${where}: the tiers are not MC-1's four (${keys.join(", ")})`);
  else ok();
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total !== sample) misrep(`${where}: tier counts sum to ${total}, not the sample ${sample}`);
  else ok();
}
/** A tier table: MC-1's four, highest first, each named and ruled by MC-1. */
function tierTable(table, where) {
  const byOrdinal = Object.entries(SNAP.TIERS).sort((a, b) => b[1].ordinal - a[1].ordinal).map(([k]) => k);
  const keys = Object.keys(table).map((k) => `kesiapan.${k}`);
  if (!same(keys, byOrdinal)) misrep(`${where}: tiers are not MC-1's, in MC-1's order (${keys.join(", ")})`);
  else ok();
  for (const [k, x] of Object.entries(table)) {
    const key = `kesiapan.${k}`, tier = SNAP.TIERS[key];
    if (!tier) continue;
    verbatim(x.name, key, `${where}.${k}.name`);
    // The rule must state MC-1's thresholds, not a paraphrase of them.
    const pct = (v) => `${Math.round(v * 100)}%`;
    const needs = tier.appliesWithoutPostTest ? ["Uji Penguasaan"]
      : tier.requiresSafetyGate ? [pct(tier.min), "butir wajib"]
      : tier.min === 0 ? [pct(tier.max), "butir wajib"]
      : [`${Math.round(tier.min * 100)}–${Math.round(tier.max * 100) - 1}%`];
    for (const n of needs) {
      if (!x.rule.id.includes(n)) misrep(`${where}.${k}.rule does not state MC-1's "${n}" (${x.rule.id})`);
      else ok();
    }
  }
}

// -- Reports page: the educator's and the management view, from MC-1.
const R = W.reports;
for (const [i, f] of R.REPORT_A.figures.entries()) figure(f, `laporan.REPORT_A.figures[${i}]`, "educatorClass", "educator");
for (const [i, f] of R.REPORT_B.figures.entries()) {
  const surface = f.metric.startsWith("institution.") ? "managementInstitution" : "managementClass";
  figure(f, `laporan.REPORT_B.figures[${i}]`, surface, "staff");
}
for (const [label, list] of [["REPORT_A", R.REPORT_A.figures], ["REPORT_B", R.REPORT_B.figures]]) {
  if (!list.some((f) => f.state !== "cukup")) misrep(`laporan.${label} shows no figure below its minimum`);
  else ok();
}
verbatim(R.REPORT_A.title, "mengajar.bukti.judul", "laporan.REPORT_A.title");
verbatim(R.REPORT_A.intro, "mengajar.bukti.intro", "laporan.REPORT_A.intro");
verbatim(R.REPORT_A.foot, "mengajar.bukti.kaki", "laporan.REPORT_A.foot");
verbatim(R.REPORT_B.title, "pimpinan.bukti.judul", "laporan.REPORT_B.title", "staff");
verbatim(R.PRINCIPLE.body, "pimpinan.kesiapan.catatan", "laporan.PRINCIPLE.body", "staff");
verbatim(R.STATES.title, "pimpinan.kesiapan.judul", "laporan.STATES.title", "staff");
for (const k of ["cukup", "belum_cukup", "belum_ada"])
  verbatim(R.STATES[k].name, `pimpinan.kesiapan.${k}`, `laporan.STATES.${k}.name`, "staff");
verbatim(R.STATES.belum_cukup.shows, "laporan.metrik.belum_cukup_data", "laporan.STATES.belum_cukup.shows");
verbatim(R.STATES.belum_ada.shows, "laporan.metrik.belum_ada_bukti", "laporan.STATES.belum_ada.shows");
for (const [k, key, persona] of [
  ["from", "bukti.dari"], ["students", "bukti.murid"], ["minimum", "bukti.minimum"],
  ["fromStaff", "pimpinan.bukti.dari", "staff"], ["points", "mengajar.bukti.poin"],
  ["times", "mengajar.bukti.kali"], ["where", "mengajar.bukti.keadaan"],
  ["submitted", "mengajar.bukti.kumpul"], ["conclusions", "mengajar.bukti.simpulan"],
]) verbatim(R.WORDS[k], key, `laporan.WORDS.${k}`, persona);
tierTable(R.TIERS, "laporan.TIERS");
// An action sentence is the product's, and the one its own rule would pick.
for (const f of R.REPORT_A.figures) {
  if (!f.action) continue;
  const rule = f.metric === "class.comprehension" ? (f.value < 0.6 ? "tindakan.ulangi" : "tindakan.lanjut")
    : f.metric === "class.readiness_distribution" ? "tindakan.fokus" : null;
  if (!rule) misrep(`laporan: ${f.metric} carries an action the product does not give it`);
  else verbatim(f.action, rule, `laporan.${f.metric}.action`);
}

// -- Mini-PINTAR's school view: the same product, a class of one and a
//    simulated class of 24.
const S = W.mini.SCHOOL;
for (const [i, f] of S.educator.figures.entries()) {
  figure(f, `mini-pintar.SCHOOL.educator.figures[${i}]`, "educatorClass", "educator");
  if (f.have !== 1 || f.state !== "belum_cukup")
    misrep(`mini-pintar: with one learner, ${f.metric} must read "belum cukup" at 1/${SNAP.METRICS[f.metric]?.minimum}`);
  else ok();
}
{
  const drawn = new Set(S.educator.figures.map((f) => f.metric));
  const expected = SNAP.SURFACES.educatorClass.filter((m) => m !== "class.net_gain");
  if (!same([...drawn].sort(), [...expected].sort()))
    misrep(`mini-pintar: the educator's side draws ${[...drawn].join(", ")}, not the product's class figures less Kenaikan`);
  else ok();
}
for (const [i, f] of S.management.figures.entries())
  figure(f, `mini-pintar.SCHOOL.management.figures[${i}]`, "managementClass", "staff");
if (!S.management.figures.some((f) => f.state !== "cukup"))
  misrep("mini-pintar: the management side shows no figure below its minimum");
else ok();
verbatim(S.educator.title, "mengajar.bukti.judul", "mini-pintar.SCHOOL.educator.title");
verbatim(S.educator.intro, "mengajar.bukti.intro", "mini-pintar.SCHOOL.educator.intro");
verbatim(S.educator.foot, "mengajar.bukti.kaki", "mini-pintar.SCHOOL.educator.foot");
verbatim(S.educator.where, "mengajar.bukti.keadaan", "mini-pintar.SCHOOL.educator.where");
verbatim(S.educator.submitted, "mengajar.bukti.kumpul", "mini-pintar.SCHOOL.educator.submitted");
verbatim(S.educator.conclusions, "mengajar.bukti.simpulan", "mini-pintar.SCHOOL.educator.conclusions");
verbatim(S.educator.decide, "mengajar.langkah.judul", "mini-pintar.SCHOOL.educator.decide");
for (const o of S.educator.options) {
  if (o.step === "none") { ok(); continue; }
  verbatim(o.text, `mengajar.langkah.${o.step}`, `mini-pintar.SCHOOL.educator.options.${o.step}`);
}
verbatim(S.management.title, "pimpinan.bukti.judul", "mini-pintar.SCHOOL.management.title", "staff");
verbatim(S.management.from, "pimpinan.bukti.dari", "mini-pintar.SCHOOL.management.from", "staff");
verbatim(S.management.readiness.title, "pimpinan.kesiapan.judul", "mini-pintar.SCHOOL.management.readiness.title", "staff");
verbatim(S.management.readiness.note, "pimpinan.kesiapan.catatan", "mini-pintar.SCHOOL.management.readiness.note", "staff");
for (const k of ["cukup", "belum_cukup", "belum_ada"])
  verbatim(S.management.readiness[k], `pimpinan.kesiapan.${k}`, `mini-pintar.SCHOOL.management.readiness.${k}`, "staff");
verbatim(S.absent.belum_cukup, "laporan.metrik.belum_cukup_data", "mini-pintar.SCHOOL.absent.belum_cukup");
verbatim(S.absent.belum_ada, "laporan.metrik.belum_ada_bukti", "mini-pintar.SCHOOL.absent.belum_ada");
tierTable(S.management.tiers, "mini-pintar.SCHOOL.management.tiers");

// -- The product's cycle, by its own names, wherever the site names it.
const CYCLE = ["cycle.step.pretest", "cycle.step.map", "cycle.step.lesson", "cycle.step.posttest", "cycle.step.result"];
W.does.CYCLE.steps.forEach((s, i) => verbatim(s, CYCLE[i], `apa-yang-dilakukan.CYCLE.steps[${i}]`, "learner"));
if (W.does.CYCLE.steps.length !== CYCLE.length) misrep("apa-yang-dilakukan names a different number of cycle steps");
else ok();
for (const [k, key] of [["stepMap", CYCLE[0]], ["stepPeta", CYCLE[1]], ["stepLesson", CYCLE[2]],
                         ["stepCheck", CYCLE[3]], ["stepHasil", CYCLE[4]]])
  verbatim(W.mini.UI[k], key, `mini-pintar.UI.${k}`, "learner");
W.mini.REVEAL.steps.forEach((s, i) => verbatim(s.step, CYCLE[i], `mini-pintar.REVEAL.steps[${i}].step`, "learner"));

// -- Who PINTAR is for: the product's own roles, and no one else.
const ROLES = ["role.EDUCATOR", "role.HEAD_OF_DEPARTMENT", "role.DEAN", "role.INSTITUTION_ADMIN"];
if (W.home.TRUST.items.length !== ROLES.length) misrep("the home page's audience list is not the product's four staff roles");
else ok();
W.home.TRUST.items.forEach((it, i) => verbatim(it, ROLES[i], `home.TRUST.items[${i}]`, "staff"));

// -- Product names and the educator's real limits.
contains(W.educators.SEQUENCE[0].body, "studio.kanonik.judul", "untuk-pendidik.SEQUENCE[0].body", "staff");
{
  const f6w = P("mengajar.langkah.f6w");
  const approval = { id: f6w.id.split(". ").slice(1).join(". "), en: f6w.en.split(". ").slice(1).join(". ") };
  for (const side of ["id", "en"]) {
    if (!approval[side] || !W.educators.SEQUENCE[0].body[side].includes(approval[side]))
      misrep(`untuk-pendidik: preparing learning no longer says, as the product does, "${approval[side]}"`);
    else ok();
  }
}
contains(W.educators.SEQUENCE[1].title, "studio.nav.kuis", "untuk-pendidik.SEQUENCE[1].title", "staff");
contains(W.home.AUDIENCES.educators.body, "studio.nav.kuis", "home.AUDIENCES.educators.body", "staff");

// -- Identity: the product's tokens and its supplied, self-hosted assets.
const siteCss = readFileSync(join(SITE, "shared/style.css"), "utf8");
for (const [site, product] of Object.entries(SNAP.SITE_TOKENS)) {
  const m = siteCss.match(new RegExp(`${site}:\\s*(#[0-9A-Fa-f]{6})\\s*;`));
  if (!m || m[1].toUpperCase() !== SNAP.TOKENS[product])
    misrep(`${site} is ${m?.[1]} in shared/style.css, not the product's ${product} ${SNAP.TOKENS[product]}`);
  else ok();
}
const miniCss = readFileSync(join(SITE, "mini-pintar/style.css"), "utf8");
{
  const m = miniCss.match(/--green:\s*(#[0-9A-Fa-f]{6})\s*;/);
  if (!m || m[1].toUpperCase() !== SNAP.TOKENS["--pintar-primary"])
    misrep(`Mini-PINTAR's --green is ${m?.[1]}, not the product's primary ${SNAP.TOKENS["--pintar-primary"]}`);
  else ok();
}
for (const [site, product] of Object.entries(SNAP.SITE_ASSETS)) {
  const p = join(SITE, site);
  if (!existsSync(p)) { misrep(`${site} is missing`); continue; }
  if (sha256(readFileSync(p)) !== SNAP.ASSETS[product])
    misrep(`${site} is not the product's ${product}, byte for byte`);
  else ok();
}
verbatim({ id: SNAP.LABELS["app.name"].default, en: SNAP.LABELS["app.name"].en }, "app.name", "app.name");

// --------------------------------------------------------------------- report

if (changed.length || wrong.length) {
  console.error(`\ncanonical FAILED — ${changed.length + wrong.length} problem(s), ${checks} checks passed` +
    ` (product: ${AT ? `git ${AT}` : PRODUCT}; snapshot recorded at ${SNAP.SOURCE_COMMIT})\n`);
  for (const c of changed) console.error(`  canonical product changed — website reconciliation required: ${c}`);
  for (const w of wrong) console.error(`  website misrepresents canonical PINTAR: ${w}`);
  process.exit(1);
}
console.log(`canonical OK — ${checks} checks: the product (${AT ? `git ${AT}` : "this repository"}) still says` +
  ` what the website was reconciled against at ${SNAP.SOURCE_COMMIT}, and the website represents it:` +
  ` ${Object.keys(SNAP.LABELS).length} copy rows, ${Object.keys(SNAP.METRICS).length} MC-1 metrics,` +
  ` ${Object.keys(SNAP.TIERS).length} readiness tiers, ${Object.keys(SNAP.SURFACES).length} surfaces,` +
  ` ${Object.keys(SNAP.TOKENS).length} tokens, ${Object.keys(SNAP.ASSETS).length} assets`);
