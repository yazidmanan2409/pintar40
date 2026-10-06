// PINTAR corporate website — design grammar review package, checked in a
// real browser.
//
// This folder is a proposal, not the website. What this proves about it:
//
//   * every page (the overview, the grammar in each of its three directions,
//     and the three compositions) renders with no console error, no failed
//     request and no request off the machine, served from a SUBFOLDER the
//     way the host serves it;
//   * every link and asset is relative and lands on a real file or a real
//     id; a link that leads nowhere yet says so (data-placeholder) and is
//     counted, never hidden;
//   * contrast is MEASURED; no text is under 14px; the site's controls are
//     44px; nothing overflows sideways from 320 to 1440px;
//   * no figure covers text, a control or another figure, at any width;
//   * every report artefact says DATA SIMULASI and who sees it, is a named
//     group, has a table twin for every set of bars, and draws every bar in
//     the one neutral ink;
//   * reduced motion and no JavaScript both leave nothing hidden; with
//     motion allowed every entrance completes once and nothing loops;
//   * the phone menu, the role pills, the direction switch and the
//     disclosures work;
//   * after walking every page, nothing has been written to the device;
//   * and the product's own words used in the artefacts still exist in the
//     product (src/lib/hle.ts), so a rename in PINTAR fails here rather than
//     drifting into the website.
//
// Run from anywhere: node website/corporate-grammar/verify/check.mjs

import { createServer } from "node:http";
import { readFile, readdir } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import { dirname, join, extname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { launch, Page } from "../../mini-pintar/app/verify/driver.mjs";
import { CONTRAST_EXPR } from "../../mini-pintar/app/verify/probes.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const PKG = join(HERE, "..");                 // website/corporate-grammar
const WEBSITE = join(PKG, "..");              // website/
const REPO = join(WEBSITE, "..");

const fails = [];
let checks = 0;
const assert = (cond, what, detail = "") => { if (cond) checks += 1; else fails.push(`${what}${detail ? " — " + detail : ""}`); };
const phase = (n) => process.stderr.write(`  .. ${n}\n`);

// ------------------------------------------------------------------ files
phase("files");
const walk = async (dir) => (await Promise.all((await readdir(dir, { withFileTypes: true })).map((d) =>
  d.isDirectory() ? walk(join(dir, d.name)) : [join(dir, d.name)]))).flat();
const FILES = (await walk(PKG)).filter((f) => !relative(PKG, f).startsWith("verify"));
const TEXT = FILES.filter((f) => /\.(html|css|js|svg)$/.test(f));

for (const f of TEXT) {
  const src = await readFile(f, "utf8");
  const name = relative(PKG, f);
  // Nothing is fetched from anywhere but this folder. The SVG namespace is a
  // name, not a request.
  const external = [...src.matchAll(/https?:\/\/[^\s"')]+/g)].map((m) => m[0])
    .filter((u) => !u.startsWith("http://www.w3.org/"));
  assert(external.length === 0, `${name}: no external url`, external.join(", "));
  // Every reference is relative, so the package works from any folder.
  const rooted = [...src.matchAll(/(?:href|src)="\/(?!\/)|url\(\s*["']?\/(?!\/)/g)];
  assert(rooted.length === 0, `${name}: no root-absolute reference`);
}
for (const f of FILES.filter((f) => f.endsWith(".html"))) {
  const src = await readFile(f, "utf8");
  assert(/<meta name="robots" content="noindex">/.test(src), `${relative(PKG, f)}: noindex`);
  assert(/<title>[^<]+<\/title>/.test(src), `${relative(PKG, f)}: has a title`);
}
for (const fam of ["PlusJakartaSans", "IBMPlexMono", "Newsreader"]) {
  assert(existsSync(join(PKG, "assets/fonts", `OFL-${fam}.txt`)), `font licence shipped: ${fam}`);
}

// The product's words. Each one is used by the artefacts AND still exists in
// the product. A rename in PINTAR makes this fail; the fix is to follow the
// product, never to keep the old word.
const PRODUCT = await readFile(join(REPO, "src/lib/hle.ts"), "utf8");
const SPECS = await readFile(join(PKG, "assets/specimens.js"), "utf8");
const WORDS = [
  "Apa yang sudah bisa disimpulkan", "Sebaran hasil Uji Penguasaan", "Penguasaan per bagian",
  "Soal mana yang sulit bagi kelas ini", "Murid yang mungkin perlu bantuan pada soal ini",
  "Jawaban yang sudah dikumpulkan", "Yang didukung bukti", "Belum cukup data untuk menampilkan angka ini.",
  "Belum ada bukti yang memenuhi syarat untuk angka ini.", "Target tercapai.",
  "Penguasaan bab ini memenuhi targetnya.", "Semua soal penting sudah dijawab dengan tepat.",
  "Per tujuan pembelajaran", "Verifikasi Sertifikat", "Memenuhi capaian", "Berlaku", "Diterbitkan oleh",
  "Tanggal terbit", "Pemahaman", "Kenaikan", "Butir wajib", "Capaian kompetensi", "Kesiapan bukti",
  "Cukup untuk ditafsirkan", "Mantap", "Berkembang", "Perlu penguatan", "Belum mengerjakan Uji Penguasaan",
  "Bukan batas ketuntasan sekolah", "Halaman ini memastikan sertifikat yang Anda pegang benar diterbitkan.",
];
for (const w of WORDS) {
  assert(SPECS.includes(w), `artefacts use the product's words: «${w}»`);
  assert(PRODUCT.includes(w), `the product still says «${w}» (src/lib/hle.ts)`);
}

// The compositions make no claim PINTAR cannot back. The grammar itself may
// name these things, because it names them in order to rule them out.
const NEVER = [
  [/\bAI\b|kecerdasan buatan/i, "AI (there is none in PINTAR)"],
  [/Question Health|kesehatan soal/i, "Question Health (no screen)"],
  [/\bbriefing\b|ringkasan otomatis/i, "briefings (no screen)"],
  [/miskonsepsi/i, "misconceptions (empty in practice)"],
  [/\d{1,3}[.,]\d{3}\+?\s*(murid|sekolah|guru|siswa)/i, "adoption numbers (no school uses PINTAR in production)"],
  [/digunakan (oleh|di) \d|sekolah yang (sudah )?menggunakan/i, "a claim of use in schools"],
];
for (const f of ["a.html", "b.html", "c.html"]) {
  const visible = (await readFile(join(PKG, f), "utf8")).replace(/<!--[\s\S]*?-->/g, "").replace(/<[^>]+>/g, " ");
  for (const [re, what] of NEVER) assert(!re.test(visible + SPECS), `${f}: no ${what}`);
}

// ------------------------------------------------------------------ server
// Served from a subfolder, as on the host: anything outside /test/ is a 404,
// so a link written from the domain root fails here exactly as it would there.
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2",
  ".json": "application/json", ".txt": "text/plain; charset=utf-8" };
const PREFIX = "/test/";
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (!p.startsWith(PREFIX)) { res.writeHead(404); res.end(); return; }
  p = p.slice(PREFIX.length);
  if (p === "" || p.endsWith("/")) p += "index.html";
  const file = resolve(WEBSITE, p);
  if (!file.startsWith(WEBSITE)) { res.writeHead(403); res.end(); return; }
  try { const b = await readFile(file); res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" }); res.end(b); }
  catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const ORIGIN = `http://127.0.0.1:${server.address().port}`;
const BASE = `${ORIGIN}${PREFIX}corporate-grammar/`;

const browser = await launch();
const p = await Page.open(browser.pageUrl);
const failed = [];
// The browser asks the domain root for /favicon.ico on its own; that is the
// host's file, not this package's request.
p.cdp.on("Network.responseReceived", (e) => {
  if (e.response.status >= 400 && !e.response.url.endsWith("/favicon.ico")) failed.push(`${e.response.status} ${e.response.url}`);
});
const media = (reduce) => p.cdp.send("Emulation.setEmulatedMedia",
  { features: [{ name: "prefers-reduced-motion", value: reduce ? "reduce" : "no-preference" }] });
const ready = () => p.eval("document.fonts.ready.then(() => new Promise(r => setTimeout(r, 250)))", true);
const fresh = async (url) => { p.consoleErrors.length = 0; p.requests.length = 0; failed.length = 0; await p.goto(url); await ready(); };

const PAGES = [
  ["overview", "index.html"],
  ["grammar · A", "grammar.html?dir=a"], ["grammar · B", "grammar.html?dir=b"], ["grammar · C", "grammar.html?dir=c"],
  ["composition A", "a.html"], ["composition B", "b.html"], ["composition C", "c.html"],
];

// ------------------------------------------------------------------ probes
// Each probe is a FUNCTION serialised with toString(), for the reason
// mini-pintar/app/verify/probes.mjs gives: a template literal eats escapes.
function sizeProbe() {
  const bad = []; let measured = 0;
  for (const el of document.querySelectorAll("body *")) {
    if (el.closest(".sr") || !el.getClientRects().length) continue;
    if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
    measured += 1;
    const px = parseFloat(getComputedStyle(el).fontSize);
    if (px < 13.99) bad.push(`${el.tagName.toLowerCase()}.${el.className} ${px}px «${el.textContent.trim().slice(0, 30)}»`);
  }
  return { bad, measured };
}
// The house rule is 44px for the site's own controls. Links inside a
// sentence are exempt, as WCAG exempts them; the review chrome is not design.
function targetProbe() {
  const SEL = ".hdr a, .hdr button, main .btn, .c-tab, [data-role], .cap summary, .lang a, .ftr__grid a, .doc-switch a";
  const bad = []; let measured = 0;
  for (const el of document.querySelectorAll(SEL)) {
    const r = el.getBoundingClientRect();
    if (!r.width || el.closest(".phone")) continue;
    measured += 1;
    const min = el.closest(".doc-switch") ? 40 : 44;
    if (r.height + 0.5 < min) bad.push(`${el.tagName.toLowerCase()}.${el.className} «${el.textContent.trim().slice(0, 20)}» ${Math.round(r.height)}px`);
  }
  return { bad, measured };
}
function artefactProbe() {
  const bad = [];
  const reps = [...document.querySelectorAll(".rep")];
  for (const r of reps) {
    const name = r.getAttribute("aria-label") || "(unnamed)";
    if (r.getAttribute("role") !== "group" || !r.getAttribute("aria-label")) bad.push(`${name}: not a named group`);
    const sim = [...r.querySelectorAll(".rep__sim")];
    if (sim.length !== 1 || sim[0].textContent.trim() !== "DATA SIMULASI") bad.push(`${name}: DATA SIMULASI`);
    if (!r.querySelector(".rep__who")?.textContent.trim()) bad.push(`${name}: says who sees it`);
    const sets = r.querySelectorAll(".rows").length, twins = r.querySelectorAll(".sr table").length;
    if (twins < sets) bad.push(`${name}: ${sets} sets of bars, ${twins} table twins`);
  }
  // The "don't" example in the grammar paints bands red and green on
  // purpose, to show what is forbidden. Everything else is one ink.
  const bars = [...document.querySelectorAll(".bar > i")].filter((i) => !i.closest(".dd--no"));
  const inks = [...new Set(bars.map((i) => getComputedStyle(i).backgroundColor))];
  return { reps: reps.length, bad, bars: bars.length, inks };
}
function linkProbe() {
  const out = { placeholders: 0, ids: [], files: [] };
  for (const a of document.querySelectorAll("a[href]")) {
    const raw = a.getAttribute("href");
    if (raw === "#") { if (a.hasAttribute("data-placeholder")) out.placeholders += 1; else out.ids.push("bare # without data-placeholder"); continue; }
    const u = new URL(raw, location.href);
    if (u.origin !== location.origin) { out.files.push(`EXTERNAL ${raw}`); continue; }
    if (u.pathname === location.pathname) { if (u.hash && !document.getElementById(u.hash.slice(1))) out.ids.push(raw); continue; }
    out.files.push(u.pathname + (u.hash ? u.hash : ""));
  }
  for (const n of document.querySelectorAll("[src]")) out.files.push(new URL(n.getAttribute("src"), location.href).pathname);
  for (const u of document.querySelectorAll("use[href]")) out.files.push(new URL(u.getAttribute("href"), location.href).pathname + new URL(u.getAttribute("href"), location.href).hash);
  return out;
}
function revealProbe() {
  const els = [...document.querySelectorAll("[data-reveal]")];
  const hidden = els.filter((e) => Number(getComputedStyle(e).opacity) < 0.99 || getComputedStyle(e).transform !== "none");
  return { total: els.length, hidden: hidden.length, motion: document.documentElement.classList.contains("motion"),
    inIn: els.filter((e) => e.classList.contains("is-in")).length };
}
// A figure may sit over a photograph, never over text, a control, or
// another figure: the rule the grammar states, measured.
function overlapProbe() {
  const box = (e) => e.getBoundingClientRect();
  const hit = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 2 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 2;
  // Inside a closed disclosure only the summary is on screen.
  const shown = (e) => e.getClientRects().length && getComputedStyle(e).visibility !== "hidden"
    && !(e.closest("details:not([open])") && !e.closest("summary"));
  const reps = [...document.querySelectorAll(".rep")].filter(shown);
  const words = [...document.querySelectorAll("h1, h2, h3, p, li, a, button, figcaption")]
    .filter((e) => shown(e) && !e.closest(".rep") && !e.closest(".sr") && !e.closest(".ph") && !e.querySelector(".rep"));
  const bad = [];
  reps.forEach((r, i) => {
    const R = box(r);
    reps.slice(i + 1).forEach((o) => { if (hit(R, box(o))) bad.push(`«${r.getAttribute("aria-label").split(" —")[0]}» covers «${o.getAttribute("aria-label").split(" —")[0]}»`); });
    for (const w of words) if (!w.contains(r) && hit(R, box(w))) bad.push(`«${r.getAttribute("aria-label").split(" —")[0]}» covers ${w.tagName.toLowerCase()} «${w.textContent.trim().slice(0, 24)}»`);
  });
  return bad;
}
const expr = (fn) => `(${fn.toString()})()`;

// Linked files must exist on disk (a link to another page's id is checked
// when that page is loaded, below).
const idsWanted = new Map();
const checkFiles = (label, list) => {
  for (const ref of list) {
    if (ref.startsWith("EXTERNAL")) { assert(false, `${label}: link stays on the site`, ref); continue; }
    const [path, hash] = ref.split("#");
    let rel = decodeURIComponent(path).replace(/^\/test\//, "");
    if (rel === "" || rel.endsWith("/")) rel += "index.html";
    const file = join(WEBSITE, rel);
    assert(existsSync(file) && statSync(file).isFile(), `${label}: link target exists`, ref);
    if (hash && rel.endsWith(".html")) { if (!idsWanted.has(rel)) idsWanted.set(rel, new Set()); idsWanted.get(rel).add(hash); }
  }
};

// ------------------------------------------------------------------ pages, still
await media(true);
let placeholders = 0;
for (const [label, path] of PAGES) {
  for (const w of [390, 1440]) {
    phase(`${label} at ${w}px`);
    await p.viewport(w, w < 700 ? 844 : 900);
    await fresh(BASE + path);
    const tag = `${label} @${w}`;
    assert(p.consoleErrors.length === 0, `${tag}: no console error`, p.consoleErrors.join(" | "));
    assert(failed.length === 0, `${tag}: no failed request`, failed.join(", "));
    const off = p.requests.filter((u) => !u.startsWith(ORIGIN) && !u.startsWith("data:"));
    assert(off.length === 0, `${tag}: nothing requested off the machine`, off.join(", "));
    const over = await p.eval("document.documentElement.scrollWidth - document.documentElement.clientWidth");
    assert(over <= 0, `${tag}: no sideways overflow`, `${over}px`);

    const c = await p.eval(CONTRAST_EXPR);
    assert(c.measured > 20, `${tag}: contrast measured`, `${c.measured} elements`);
    assert(c.bad.length === 0, `${tag}: contrast`, JSON.stringify(c.bad.slice(0, 4)));
    const s = await p.eval(expr(sizeProbe));
    assert(s.bad.length === 0, `${tag}: no text under 14px`, s.bad.slice(0, 4).join(" | "));
    const t = await p.eval(expr(targetProbe));
    assert(t.bad.length === 0, `${tag}: controls are 44px`, t.bad.slice(0, 4).join(" | "));

    const a = await p.eval(expr(artefactProbe));
    if (path !== "index.html") assert(a.reps > 0, `${tag}: report artefacts render`);
    assert(a.bad.length === 0, `${tag}: artefacts are honest`, a.bad.join(" | "));
    assert(a.inks.length <= 1 && (a.inks[0] ?? "rgb(86, 106, 110)") === "rgb(86, 106, 110)",
      `${tag}: every evidence bar is the one neutral ink #566A6E`, a.inks.join(", "));

    const ov = await p.eval(expr(overlapProbe));
    assert(ov.length === 0, `${tag}: no figure covers text, a control or another figure`, ov.slice(0, 4).join(" | "));

    const r = await p.eval(expr(revealProbe));
    assert(!r.motion && r.hidden === 0, `${tag}: reduced motion hides nothing and moves nothing`, JSON.stringify(r));

    if (w === 1440) {
      const l = await p.eval(expr(linkProbe));
      assert(l.ids.length === 0, `${tag}: every in-page link lands on an id`, l.ids.join(", "));
      checkFiles(tag, l.files);
      placeholders += l.placeholders;
    }
  }
}

// Widths in between: nothing overflows sideways at any of them.
for (const w of [320, 768, 1024]) {
  await p.viewport(w, 900);
  for (const [label, path] of PAGES) {
    await fresh(BASE + path);
    const over = await p.eval("document.documentElement.scrollWidth - document.documentElement.clientWidth");
    assert(over <= 0, `${label} @${w}: no sideways overflow`, `${over}px`);
    const ov = await p.eval(expr(overlapProbe));
    assert(ov.length === 0, `${label} @${w}: no figure covers text, a control or another figure`, ov.slice(0, 4).join(" | "));
  }
}
phase("in-between widths");

// Ids that other pages link to.
for (const [rel, ids] of idsWanted) {
  await fresh(`${ORIGIN}${PREFIX}${rel}`);
  for (const id of ids) assert(await p.eval(`!!document.getElementById(${JSON.stringify(id)})`), `linked id exists: ${rel}#${id}`);
}

// ------------------------------------------------------------------ direction switch
phase("direction switch");
await p.viewport(1440, 900);
for (const d of ["a", "b", "c"]) {
  await fresh(`${BASE}grammar.html?dir=${d}`);
  assert(await p.eval("document.documentElement.dataset.dir") === d, `grammar ?dir=${d} applies direction ${d}`);
  assert(await p.eval(`document.querySelector('[data-dir-link="${d}"]').getAttribute("aria-current")`) === "true",
    `grammar ?dir=${d}: the switch says which direction is showing`);
}
await fresh(`${BASE}grammar.html?dir=zz`);
assert(await p.eval("document.documentElement.dataset.dir") === "a", "an unknown ?dir= falls back to A");

// ------------------------------------------------------------------ interactions
phase("role pills");
await fresh(`${BASE}c.html`);
const pills = await p.eval(`(() => {
  const ps = [...document.querySelectorAll("[data-role]")]; if (ps.length < 2) return null;
  ps[1].click();
  const panels = [...document.querySelectorAll("[data-role-panel]")];
  return { pressed: ps.map(x => x.getAttribute("aria-pressed")), shown: panels.filter(x => !x.hidden).map(x => x.dataset.rolePanel), want: ps[1].dataset.role };
})()`);
assert(pills && pills.pressed.filter((x) => x === "true").length === 1 && pills.pressed[1] === "true", "role pills: one pressed, the one chosen", JSON.stringify(pills));
assert(pills && pills.shown.length === 1 && pills.shown[0] === pills.want, "role pills: only the chosen panel shows", JSON.stringify(pills));

phase("phone menu");
await p.viewport(390, 844);
for (const f of ["a.html", "b.html", "c.html"]) {
  await fresh(BASE + f);
  const m = await p.eval(`(() => {
    const b = document.querySelector(".hdr__menu"), nav = document.getElementById(b.getAttribute("aria-controls"));
    const before = nav.getClientRects().length > 0; b.click();
    const open = b.getAttribute("aria-expanded") === "true" && nav.getClientRects().length > 0 && nav.querySelectorAll("a").length === 4;
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    return { before, open, closed: b.getAttribute("aria-expanded") === "false" && nav.getClientRects().length === 0, focus: document.activeElement === b };
  })()`);
  assert(!m.before && m.open, `${f}: the phone menu opens with its four links`, JSON.stringify(m));
  assert(m.closed && m.focus, `${f}: Escape closes the menu and returns focus`, JSON.stringify(m));
}

phase("disclosures");
await p.viewport(1440, 900);
await fresh(`${BASE}a.html`);
const cap = await p.eval(`(() => { const d = document.querySelector(".cap details, details.cap"); if (!d) return null;
  const was = d.open; d.querySelector("summary").click(); return { was, now: d.open }; })()`);
assert(cap && !cap.was && cap.now, "capability details start closed and open on request", JSON.stringify(cap));

// ------------------------------------------------------------------ motion allowed
phase("motion");
await media(false);
for (const [label, path] of PAGES.filter(([, x]) => x !== "index.html")) {
  await fresh(BASE + path);
  const before = await p.eval(expr(revealProbe));
  assert(before.motion, `${label}: motion runs when allowed`);
  // Walk down the page the way a reader does, then wait for the longest
  // entrance (bars: 240 ms delay + 900 ms) to finish.
  await p.eval(`(async () => { const H = document.documentElement.scrollHeight;
    for (let y = 0; y < H; y += 500) { scrollTo({ top: y, behavior: "instant" }); await new Promise(r => setTimeout(r, 60)); }
    scrollTo({ top: 0, behavior: "instant" }); await new Promise(r => setTimeout(r, 1400)); })()`, true);
  const after = await p.eval(expr(revealProbe));
  assert(after.inIn === after.total && after.hidden === 0, `${label}: every entrance completes`, JSON.stringify(after));
  const loops = await p.eval("document.getAnimations().filter(a => a.effect?.getTiming().iterations === Infinity || a.playState === 'running').length");
  assert(loops === 0, `${label}: nothing is still moving or loops`, `${loops} animations`);
}
await media(true);

// ------------------------------------------------------------------ no JavaScript
phase("no JavaScript");
// With scripts off the page's timers never fire, so the usual navigation
// (which waits on a timer inside the page) would wait forever: navigate
// directly and wait on the load event from outside.
const noJs = async (url) => {
  const done = p.cdp.once("Page.loadEventFired");
  await p.cdp.send("Page.navigate", { url });
  await Promise.race([done, new Promise((r) => setTimeout(r, 15000))]);
  await new Promise((r) => setTimeout(r, 300));
};
await p.cdp.send("Emulation.setScriptExecutionDisabled", { value: true });
for (const [label, path] of PAGES) {
  await noJs(BASE + path);
  const r = await p.eval(expr(revealProbe)).catch(() => null);
  // With scripts off, Runtime.evaluate still runs our probe; the page's own
  // scripts do not, so nothing may be hidden waiting for them.
  assert(r && !r.motion && r.hidden === 0, `${label}: without JavaScript nothing is hidden`, JSON.stringify(r));
}
await noJs(`${BASE}c.html`);
assert(await p.eval(`[...document.querySelectorAll("[data-role-panel]")].every(x => !x.hidden)`), "c.html without JavaScript: every role panel shows");
await p.cdp.send("Emulation.setScriptExecutionDisabled", { value: false });

// ------------------------------------------------------------------ storage
phase("storage");
for (const [, path] of PAGES) await fresh(BASE + path);
const store = await p.eval(`(async () => ({ local: localStorage.length, session: sessionStorage.length, cookie: document.cookie,
  idb: (await indexedDB.databases()).length }))()`, true);
assert(store.local === 0 && store.session === 0 && store.cookie === "" && store.idb === 0, "nothing is written to the device", JSON.stringify(store));

browser.kill();
server.close();

console.log(`\n${checks} checks passed, ${fails.length} failed. ${placeholders} links are marked as placeholders (pages not composed yet).`);
if (fails.length) { for (const f of fails) console.log("  ✗ " + f); process.exit(1); }
