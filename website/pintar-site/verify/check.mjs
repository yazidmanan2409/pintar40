// PINTAR public website: acceptance checks, in a real browser and against
// the real contact handler.
//
// What this proves:
//   * the build is current: site/ is exactly what `node build.mjs` writes;
//   * every page exists in Bahasa Indonesia and English, with the right lang,
//     one h1, a title, a description, noindex while in review, and a language
//     switch that lands on the same page in the other language;
//   * the site is served from a SUBFOLDER, as on the host: every link and asset
//     is relative and real, every in-page link lands on an id, and nothing is
//     requested from anywhere else;
//   * contrast is measured; no text is under 14 px; controls are 44 px; nothing
//     overflows sideways at 320, 390, 768, 1024 or 1440 px; every planned
//     photograph carries its alternative text;
//   * reduced motion and no JavaScript leave nothing hidden; with motion allowed
//     every entrance completes once and nothing loops;
//   * the phone menu opens and closes with Escape;
//   * the contact form: «Minta Demo» preselects the subject; errors are linked
//     and summarised; a valid message is delivered by the server; an abusive one
//     is refused with the owner's exact wording and is not echoed; the same form
//     works without JavaScript;
//   * the server: validation, origin, honeypot, rate limit, double submit,
//     header injection and moderation (php verify/moderation-cases.php, plus
//     HTTP cases), and the library cannot be fetched;
//   * nothing is stored on the visitor's device: no cookie, no storage.
//
// Run: node website/pintar-site/verify/check.mjs   (needs php and Chromium)

import { spawn, spawnSync } from "node:child_process";
import { readFile, readdir, mkdtemp, writeFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

process.env.CHROMIUM ||= "/opt/pw-browsers/chromium";
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const SITE = join(ROOT, "site");
const { launch, Page } = await import(join(ROOT, "../mini-pintar/app/verify/driver.mjs"));
const { CONTRAST_EXPR } = await import(join(ROOT, "../mini-pintar/app/verify/probes.mjs"));
const { ROUTES } = await import(join(ROOT, "src/core.mjs"));

const fails = [];
let checks = 0;
const assert = (ok, what, detail = "") => { if (ok) checks += 1; else fails.push(`${what}${detail ? " — " + detail : ""}`); };
const phase = (s) => process.stderr.write(`  .. ${s}\n`);
const walk = async (d) => (await Promise.all((await readdir(d, { withFileTypes: true })).map((e) => e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]))).flat();

// ------------------------------------------------------------------ build is current
phase("build");
const hashTree = async () => {
  const h = createHash("sha256");
  for (const f of (await walk(SITE)).filter((f) => f.endsWith(".html")).sort()) h.update(f).update(await readFile(f));
  return h.digest("hex");
};
const before = await hashTree();
const b = spawnSync(process.execPath, [join(ROOT, "build.mjs")], { encoding: "utf8" });
assert(b.status === 0, "the build runs", b.stderr);
assert(await hashTree() === before, "site/ is current with src/ (run node build.mjs and commit the result)");

// ------------------------------------------------------------------ files
phase("files");
const files = await walk(SITE);
for (const f of files.filter((f) => /\.(html|css|js|php)$/.test(f))) {
  const src = await readFile(f, "utf8");
  const name = relative(SITE, f);
  const ext = [...src.matchAll(/https?:\/\/[^\s"'<>)]+/g)].map((m) => m[0]).filter((u) => !u.startsWith("http://www.w3.org/"));
  assert(ext.length === 0, `${name}: no external URL`, ext.slice(0, 3).join(", "));
  assert(!/(?:href|src|action)="\/(?!\/)|url\(\s*["']?\/(?!\/)/.test(src), `${name}: no root-absolute reference`);
}
assert(existsSync(join(SITE, "api/lib/.htaccess")) && /Require all denied/.test(await readFile(join(SITE, "api/lib/.htaccess"), "utf8")), "the contact library is denied to the web");
for (const fam of ["Inter", "IBMPlexMono"]) assert(existsSync(join(SITE, `assets/fonts/OFL-${fam}.txt`)), `font licence shipped: ${fam}`);
const PAGES = Object.keys(ROUTES).flatMap((k) => ["id", "en"].map((lang) => ({ key: k, lang, path: ROUTES[k][lang] })));
for (const p of PAGES) {
  const html = await readFile(join(SITE, p.path, "index.html"), "utf8").catch(() => "");
  const tag = `${p.lang}/${p.key}`;
  assert(html.length > 0, `${tag}: page exists`);
  assert(html.includes(`<html lang="${p.lang}">`), `${tag}: lang attribute`);
  assert((html.match(/<h1[\s>]/g) || []).length === 1, `${tag}: exactly one h1`);
  assert(/<title>[^<]{10,}<\/title>/.test(html) && /<meta name="description" content="[^"]{30,}">/.test(html), `${tag}: title and description`);
  assert(html.includes('<meta name="robots" content="noindex, nofollow">'), `${tag}: noindex while in review`);
  const other = ROUTES[p.key][p.lang === "id" ? "en" : "id"];
  const depth = p.path.split("/").filter(Boolean).length;
  assert(html.includes(`href="${"../".repeat(depth) + other || "./"}" lang="${p.lang === "id" ? "en" : "id"}"`), `${tag}: the language switch leads to the same page`);
  assert(html.includes("© PT ZAYD PINTAR SELALU (ZPS)"), `${tag}: footer company identity`);
  // Launch wording (owner, 10 Nov 2026): 4.0 and 4.1 are presented as available; no
  // «in verification» or «planned» labels remain; future direction stays marked.
  assert(!/verifikasi rilis|release verification|Direncanakan untuk|[Pp]lanned for 4\.1|4\.1 · Berikutnya|4\.1 · Next/.test(html), `${tag}: launch wording, no verification or planned labels`);
  assert(html.includes('class="review-strip"'), `${tag}: the review build says it is launch wording, not published`);
  const foot = html.slice(html.indexOf('<footer class="site-footer">'));
  assert(!/>(Bahasa|Language|Perusahaan|Company)</.test(foot) && !/dikembangkan oleh|is developed by/.test(foot), `${tag}: footer has no language column and no company heading`);
  assert(/class="lang lang--footer"/.test(foot) && foot.includes("info@pintarselalu.com") && !foot.includes("subjek=demo"), `${tag}: footer has the ID | EN switch and the email, and no demo link`);
  const confirms = (html.match(/class="confirm"/g) || []).length;
  if (!["privacy", "terms"].includes(p.key)) assert(confirms === 0, `${tag}: no unconfirmed facts outside the legal pages`);
}

for (const lang of ["id", "en"]) {
  const html = await readFile(join(SITE, ROUTES.home[lang], "index.html"), "utf8");
  const main = html.slice(html.indexOf('<main id="isi">'), html.indexOf("</main>"));
  const hero = main.slice(0, main.indexOf("</section>"));
  assert((main.match(/subjek=demo/g) || []).length === 1 && !hero.includes("subjek=demo"), `${lang}/home: one demo invitation in the page (the closing section), none in the hero`);
  assert(hero.includes('href="#siklus"'), `${lang}/home: the hero keeps «see how it works»`);
  const head = html.slice(html.indexOf('<header class="site-header">'), html.indexOf("</header>"));
  assert(head.includes('class="btn btn--sm" href="kontak/?subjek=demo#formulir"'.replace("kontak/", ROUTES.contact[lang].replace(/^en\//, ""))) || head.includes("subjek=demo"), `${lang}/home: the header carries the demo button`);
  const feat = await readFile(join(SITE, ROUTES.features[lang], "index.html"), "utf8");
  const flow = feat.slice(feat.indexOf('class="flow flow--5"'), feat.indexOf("</figure>", feat.indexOf('class="flow flow--5"')));
  assert((flow.match(/data-step/g) || []).length === 5 && flow.includes("flow__human"), `${lang}/features: the AI workflow shows five steps with the educator's decision`);
  assert(lang === "id" ? /persetujuan seperti biasa/i.test(flow) && /orang kedua/.test(flow) : /usual approval/i.test(flow) && /second person/.test(flow), `${lang}/features: approved drafts go through the usual review and approval before release`);
  assert(lang === "id" ? feat.includes("Arah ke depan") : feat.includes("Future direction"), `${lang}/features: 4.5 and 5.0 are marked as future direction`);
}

// ------------------------------------------------------------------ servers
phase("servers");
const tmp = await mkdtemp(join(tmpdir(), "pintar-site-"));
// The fake mail system fails while a flag file exists, to test a failed delivery.
await writeFile(join(tmp, "sendmail.sh"), `#!/bin/sh\nif [ -f "${tmp}/fail" ]; then cat > /dev/null; exit 1; fi\ncat > "${tmp}/mail-$(date +%s%N).eml"\n`, { mode: 0o755 });
await writeFile(join(tmp, "config.php"), `<?php return ['store_dir' => '${tmp}/data', 'min_seconds' => 0, 'rate_limit' => 50];`);
const port = 20000 + Math.floor(Math.random() * 20000);
const php = spawn("php", ["-d", `sendmail_path=${tmp}/sendmail.sh`, "-S", `127.0.0.1:${port}`, join(HERE, "router.php")],
  { env: { ...process.env, PINTAR_CONTACT_CONFIG: join(tmp, "config.php") }, stdio: "ignore" });
await new Promise((r) => setTimeout(r, 700));
const ORIGIN = `http://127.0.0.1:${port}`;
const BASE = `${ORIGIN}/test/pintar/`;
const mails = async () => (await readdir(tmp)).filter((f) => f.startsWith("mail-")).length;
const lastMail = async () => {
  const f = (await readdir(tmp)).filter((x) => x.startsWith("mail-")).sort().pop();
  const raw = await readFile(join(tmp, f), "utf8");
  const [head, body] = raw.split(/\r?\n\r?\n/, 2).length === 2 ? [raw.slice(0, raw.search(/\r?\n\r?\n/)), raw.slice(raw.search(/\r?\n\r?\n/))] : [raw, ""];
  const subj = (head.match(/^Subject: =\?UTF-8\?B\?([^?]+)\?=/m) || [])[1];
  return { subject: subj ? Buffer.from(subj, "base64").toString("utf8") : "", body: Buffer.from(body.replace(/\s+/g, ""), "base64").toString("utf8") };
};

// ------------------------------------------------------------------ server-side: moderation unit cases
phase("moderation cases");
const mc = spawnSync("php", [join(HERE, "moderation-cases.php")], { encoding: "utf8" });
assert(mc.status === 0, "moderation: every case in both languages decides as expected", (mc.stdout + mc.stderr).trim().split("\n").slice(-6).join(" | "));
const mcount = Number((mc.stdout.match(/(\d+) cases/) || [])[1] || 0);
assert(mcount >= 40, "moderation: at least 40 cases are exercised", String(mcount));

// ------------------------------------------------------------------ server-side: HTTP
phase("contact handler over HTTP");
const post = async (fields, headers = {}) => {
  const body = new URLSearchParams({ lang: "id", name: "Siti Rahmawati", email: "siti@sekolah.sch.id", subject: "demo", consent: "yes", started: "", ...fields });
  const r = await fetch(`${BASE}api/kontak.php`, { method: "POST", body, headers: { Accept: "application/json", ...headers } });
  let j = {}; try { j = await r.json(); } catch {}
  return { status: r.status, json: j };
};
let m0 = await mails();
let r = await post({ message: "Kami ingin melihat demo PINTAR untuk kelas 8, terima kasih." });
assert(r.status === 200 && r.json.ok === true && await mails() === m0 + 1, "a valid message is delivered", JSON.stringify(r));
const sent = await lastMail();
assert(sent.subject.startsWith("[PINTAR] Minta demo") && sent.body.includes("Kami ingin melihat demo"), "the delivered email carries the subject and the message", sent.subject);
r = await post({ message: "Kami ingin melihat demo PINTAR untuk kelas 8, terima kasih." });
assert(r.status === 200 && await mails() === m0 + 1, "a double submit answers as before and sends nothing again");
// A failed delivery must not be remembered: the retry is sent, not falsely confirmed.
await writeFile(join(tmp, "fail"), "1");
m0 = await mails();
r = await post({ message: "Mohon jadwalkan demo untuk minggu depan, terima kasih banyak." });
assert(r.status === 502 && r.json.ok === false && await mails() === m0, "a failed delivery is reported as not sent", JSON.stringify(r));
await rm(join(tmp, "fail"));
r = await post({ message: "Mohon jadwalkan demo untuk minggu depan, terima kasih banyak." });
assert(r.status === 200 && r.json.ok === true && await mails() === m0 + 1, "after a failed delivery, the retry is actually sent (no false «sent»)", JSON.stringify(r));
r = await post({ message: "Dasar goblok, kalian bangsat semua! Balas sekarang." });
assert(r.status === 422 && r.json.rejected === true && r.json.message === "Pesan Anda tidak dapat dikirim. Mohon periksa kembali isi pesan dan gunakan bahasa yang sesuai.", "an abusive message is refused with the owner's Indonesian wording", JSON.stringify(r.json));
assert(!JSON.stringify(r.json).includes("goblok") && !JSON.stringify(r.json).includes("bangsat"), "a refusal never echoes the offensive text");
r = await post({ lang: "en", message: "f*ck you all, answer my emails right now" });
assert(r.status === 422 && r.json.message === "Your message could not be sent. Please review its content and use appropriate language.", "an abusive message is refused with the owner's English wording", JSON.stringify(r.json));
assert(!/f\*ck|answer my emails/.test(JSON.stringify(r.json)), "a refusal never echoes the submitted text (English)");
m0 = await mails();
r = await post({ message: 'Saya ingin melaporkan bahwa siswa kami dikatakan "bangsat" oleh siswa lain di kelas.' });
const flagged = await lastMail();
assert(r.status === 200 && await mails() === m0 + 1 && flagged.subject.startsWith("[PERLU DITINJAU]"), "a report quoting abuse is delivered, marked for review, not discarded", flagged.subject);
r = await post({ message: "Pesan sah yang panjangnya cukup." , consent: "" });
assert(r.status === 422 && r.json.errors?.consent === 1, "consent is required on the server");
r = await post({ message: "Pesan sah yang panjangnya cukup.", subject: "hack" });
assert(r.status === 422 && r.json.errors?.subject === 1, "an unknown subject is refused on the server");
r = await post({ message: "Pesan sah yang panjangnya cukup.", name: "Eve\r\nBcc: x@example.com" });
assert(r.status === 422 && r.json.errors?.name === 1, "header injection in the name is refused");
r = await post({ message: "Pesan sah yang panjangnya cukup.", email: "not-an-email" });
assert(r.status === 422 && r.json.errors?.email === 1, "an invalid email is refused on the server");
r = await post({ message: "Pesan sah dari asal yang lain." }, { Origin: "https://evil.example" });
assert(r.status === 403, "a request from another origin is refused");
m0 = await mails();
r = await post({ message: "Pesan sah dengan honeypot terisi.", website: "http://spam.example" });
assert(r.status === 200 && await mails() === m0, "a filled honeypot is answered as sent and nothing is sent");
const g = await fetch(`${BASE}api/kontak.php`);
assert(g.status === 405, "GET is refused");
const lib = await fetch(`${BASE}api/lib/moderation-rules.php`);
assert(lib.status === 404 && !(await lib.text()).includes("terms"), "the rules cannot be fetched");
const noJs = await fetch(`${BASE}api/kontak.php`, { method: "POST", body: new URLSearchParams({ lang: "en", name: "Ana", email: "ana@school.org", subject: "umum", consent: "yes", message: "A message without JavaScript, please reply." }) });
const noJsHtml = await noJs.text();
assert(noJs.status === 200 && noJsHtml.includes("Thank you. Your message has been sent.") && noJsHtml.includes('lang="en"'), "without JavaScript the server answers with a page, in the visitor's language");
// The rate limit (here 50 for the test run; 5 in production) eventually refuses.
let limited = false;
for (let i = 0; i < 60 && !limited; i++) limited = (await post({ message: `Pesan uji batas kiriman nomor ${i} yang sah.` })).status === 429;
assert(limited, "the rate limit refuses a sender who keeps sending");
const log = JSON.parse(await readFile(join(tmp, "data/security-log.json"), "utf8"));
assert(log.length > 0 && log.every((e) => Object.keys(e).sort().join() === "categories,decision,ip,t"), "the security log holds only time, decision, categories and a hashed address");
assert(!JSON.stringify(log).includes("goblok") && !JSON.stringify(log).includes("Siti") && !JSON.stringify(log).includes("127.0.0.1"), "the security log holds no content, name or raw address");

// Fresh store for the browser pass, so the rate limit above does not interfere.
await rm(join(tmp, "data"), { recursive: true, force: true });

// ------------------------------------------------------------------ browser
const browser = await launch();
const p = await Page.open(browser.pageUrl);
const failed = [];
p.cdp.on("Network.responseReceived", (e) => { if (e.response.status >= 400 && !e.response.url.endsWith("/favicon.ico")) failed.push(`${e.response.status} ${e.response.url}`); });
const media = (reduce) => p.cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: reduce ? "reduce" : "no-preference" }] });
// Load a page. A fresh navigation for every load (via about:blank) keeps the
// driver from reusing a document between widths.
const fresh = async (url) => {
  p.consoleErrors.length = 0; p.requests.length = 0; failed.length = 0;
  const done = p.cdp.once("Page.loadEventFired");
  await p.cdp.send("Page.navigate", { url });
  await Promise.race([done, new Promise((r) => setTimeout(r, 15000))]);
  await p.eval("document.fonts.ready.then(() => new Promise(r => setTimeout(r, 200)))", true);
};
const expr = (fn) => `(${fn.toString()})()`;

function sizeProbe() {
  const bad = [];
  for (const el of document.querySelectorAll("body *")) {
    if (el.closest(".sr, .hp") || !el.getClientRects().length) continue;
    if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
    const px = parseFloat(getComputedStyle(el).fontSize);
    if (px < 13.99) bad.push(`${el.tagName.toLowerCase()}.${el.className} ${px}px`);
  }
  return bad;
}
function targetProbe() {
  const bad = [];
  for (const el of document.querySelectorAll(".site-header a, .site-header button, .btn, .link, .site-footer a, .lang a, .anchors a, .legal__toc a, .field input:not([type=checkbox]), .field select, .field textarea")) {
    const r = el.getBoundingClientRect();
    if (!r.width || el.closest(".hp") || el.closest("p.body, p.lead, .legal__body p, .legal__body li, .caption, label")) continue;
    if (r.height + 0.5 < 44) bad.push(`${el.tagName.toLowerCase()}.${el.className} «${el.textContent.trim().slice(0, 18)}» ${Math.round(r.height)}px`);
  }
  return bad;
}
function linkProbe() {
  const out = { ids: [], files: [] };
  for (const a of document.querySelectorAll("a[href]")) {
    const raw = a.getAttribute("href");
    if (raw.startsWith("mailto:")) continue;
    const u = new URL(raw, location.href);
    if (u.origin !== location.origin) { out.files.push("EXTERNAL " + raw); continue; }
    if (u.pathname === location.pathname) { if (u.hash && !document.getElementById(u.hash.slice(1))) out.ids.push(raw); continue; }
    out.files.push(u.pathname + u.hash);
  }
  for (const n of document.querySelectorAll("[src], link[href]")) out.files.push(new URL(n.getAttribute("src") || n.getAttribute("href"), location.href).pathname);
  return out;
}
function revealProbe() {
  const els = [...document.querySelectorAll("[data-reveal], [data-step]")];
  return { total: els.length, hidden: els.filter((e) => Number(getComputedStyle(e).opacity) < 0.99).length, motion: document.documentElement.classList.contains("motion") };
}
function photoProbe() {
  return [...document.querySelectorAll("[data-photo]")].filter((f) => !(f.querySelector("[role=img]")?.getAttribute("aria-label") || "").length).length;
}

await media(true);
const idsWanted = [];
for (const pg of PAGES) {
  for (const w of [390, 1440]) {
    const tag = `${pg.lang}/${pg.key} @${w}`;
    phase(tag);
    await p.viewport(w, w < 700 ? 844 : 900);
    await fresh(BASE + pg.path);
    assert(p.consoleErrors.length === 0, `${tag}: no console error`, p.consoleErrors.join(" | "));
    assert(failed.length === 0, `${tag}: no failed request`, failed.join(", "));
    const off = p.requests.filter((u) => !u.startsWith(ORIGIN) && !u.startsWith("data:"));
    assert(off.length === 0, `${tag}: nothing requested from anywhere else`, off.join(", "));
    const over = await p.eval("document.documentElement.scrollWidth - document.documentElement.clientWidth");
    assert(over <= 0, `${tag}: no sideways overflow`, `${over}px`);
    const c = await p.eval(CONTRAST_EXPR);
    assert(c.measured > 20 && c.bad.length === 0, `${tag}: contrast`, JSON.stringify(c.bad.slice(0, 3)));
    const s = await p.eval(expr(sizeProbe));
    assert(s.length === 0, `${tag}: no text under 14 px`, s.slice(0, 4).join(" | "));
    const t = await p.eval(expr(targetProbe));
    assert(t.length === 0, `${tag}: controls are 44 px`, t.slice(0, 4).join(" | "));
    assert(await p.eval(expr(photoProbe)) === 0, `${tag}: every planned photograph has its alternative text`);
    const rv = await p.eval(expr(revealProbe));
    assert(!rv.motion && rv.hidden === 0, `${tag}: reduced motion hides nothing`, JSON.stringify(rv));
    if (w === 1440) {
      const l = await p.eval(expr(linkProbe));
      assert(l.ids.length === 0, `${tag}: in-page links land on ids`, l.ids.join(", "));
      for (const f of l.files) {
        if (f.startsWith("EXTERNAL")) { assert(false, `${tag}: link stays on the site`, f); continue; }
        const [path, hash] = f.split("#");
        const rel = decodeURIComponent(path).replace(/^\/test\/pintar\//, "");
        const file = join(SITE, rel.endsWith("/") || rel === "" ? rel + "index.html" : rel);
        assert(path.startsWith("/test/pintar/") && existsSync(file), `${tag}: link target exists`, f);
        if (hash && file.endsWith(".html")) idsWanted.push([path, hash]);
      }
    }
  }
}
phase("in-between widths");
for (const w of [320, 768, 1024]) {
  await p.viewport(w, 900);
  for (const pg of PAGES) {
    await fresh(BASE + pg.path);
    const over = await p.eval("document.documentElement.scrollWidth - document.documentElement.clientWidth");
    assert(over <= 0, `${pg.lang}/${pg.key} @${w}: no sideways overflow`, `${over}px`);
  }
}
for (const [path, id] of [...new Map(idsWanted.map((x) => [x.join("#"), x])).values()]) {
  await fresh(ORIGIN + path);
  assert(await p.eval(`!!document.getElementById(${JSON.stringify(id)})`), `linked id exists: ${path}#${id}`);
}

phase("cycle reading order");
for (const [w, mode] of [[1440, "serpentine"], [390, "sequence"]]) {
  await p.viewport(w, w < 700 ? 844 : 900);
  await fresh(BASE);
  const o = await p.eval(`(() => { const li = [...document.querySelectorAll(".cycle__grid > li")];
    return li.map(l => { const r = l.getBoundingClientRect(); return { n: (l.querySelector(".cycle__n")?.textContent || "R").trim(), x: Math.round(r.left), y: Math.round(r.top) }; }); })()`);
  assert(o.map((x) => x.n).join() === "01,02,03,04,05,06,07,R", `cycle @${w}: document order is stages 1–7, then the return`, o.map((x) => x.n).join());
  if (mode === "serpentine") {
    const [a1, a2, a3, a4, b5, b6, b7, ret] = o;
    const top = a1.y === a2.y && a2.y === a3.y && a3.y === a4.y && a1.x < a2.x && a2.x < a3.x && a3.x < a4.x;
    const bottom = b5.y === b6.y && b6.y === b7.y && b7.y === ret.y && b5.y > a1.y && b5.x === a4.x && b6.x === a3.x && b7.x === a2.x && ret.x === a1.x;
    assert(top && bottom, "cycle @1440: 1→4 across the top, 5→7 back along the bottom, the return under stage 1", JSON.stringify(o));
  } else {
    assert(o.every((x, i) => i === 0 || x.y > o[i - 1].y), "cycle @390: one column, in reading order", JSON.stringify(o));
  }
}

phase("language switch");
await p.viewport(1440, 900);
for (const pg of PAGES) {
  await fresh(BASE + pg.path);
  const other = ROUTES[pg.key][pg.lang === "id" ? "en" : "id"];
  const hrefs = await p.eval(`[...document.querySelectorAll(".lang a[href]")].map(a => new URL(a.getAttribute("href"), location.href).pathname)`);
  assert(hrefs.length === 2 && hrefs.every((h) => h === "/test/pintar/" + other), `${pg.lang}/${pg.key}: both language switches (header and footer) lead to the same page in the other language`, hrefs.join(", "));
}

phase("menu");
await p.viewport(390, 844);
await fresh(BASE);
const menu = await p.eval(`(() => { const b = document.querySelector(".menu-btn"), nav = document.getElementById("menu");
  const before = getComputedStyle(nav).display; b.click(); const open = b.getAttribute("aria-expanded") === "true" && getComputedStyle(nav).display !== "none";
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
  return { before, open, closed: b.getAttribute("aria-expanded") === "false" && getComputedStyle(nav).display === "none", focus: document.activeElement === b }; })()`);
assert(menu.before === "none" && menu.open && menu.closed && menu.focus, "the phone menu opens, and Escape closes it and returns focus", JSON.stringify(menu));

phase("contact form in the browser");
await p.viewport(1440, 900);
for (const [lang, path, rejected] of [["id", "kontak/", "Pesan Anda tidak dapat dikirim. Mohon periksa kembali isi pesan dan gunakan bahasa yang sesuai."],
  ["en", "en/contact/", "Your message could not be sent. Please review its content and use appropriate language."]]) {
  await fresh(`${BASE}${path}?subjek=demo#formulir`);
  assert(await p.eval(`document.querySelector("[name=subject]").value`) === "demo", `${lang}: «Request a Demo» arrives with the subject chosen`);
  const empty = await p.eval(`(() => { document.querySelector("form[data-contact] button[type=submit]").click();
    const s = document.querySelector(".form__summary"); return { shown: !s.hidden, focused: document.activeElement === s, items: s.querySelectorAll("li").length,
      invalid: [...document.querySelectorAll("[aria-invalid=true]")].map(x => x.name) }; })()`);
  assert(empty.shown && empty.focused && empty.items >= 4 && empty.invalid.includes("name") && empty.invalid.includes("consent"), `${lang}: an empty form shows a focused summary and marks each field`, JSON.stringify(empty));
  const fill = (msg) => `(() => { const f = document.querySelector("form[data-contact]");
    f.name.value = "Rina Wulandari"; f.email.value = "rina@sekolah.sch.id"; f.institution.value = "SMA Negeri 2"; f.message.value = ${JSON.stringify(msg)};
    f.consent.checked = true; f.querySelector("button[type=submit]").click(); })()`;
  await p.eval(fill("Dasar goblok, kalian semua bangsat, jawab sekarang!"));
  await p.eval("new Promise(r => setTimeout(r, 900))", true);
  const st = await p.eval(`(() => ({ status: document.querySelector("[data-status]").textContent, done: !document.getElementById("form-done").hidden,
    page: document.body.innerText.includes("bangsat") && document.querySelector("[data-status]").textContent.includes("bangsat") }))()`);
  assert(!st.done && st.status === rejected && !st.page, `${lang}: an abusive message is refused in the browser with the owner's wording, without echoing it`, JSON.stringify(st));
  const before = await mails();
  await p.eval(fill(lang === "id" ? "Kami tertarik dengan demo untuk tiga sekolah di yayasan kami." : "We would like a demonstration for the three schools in our foundation."));
  await p.eval("new Promise(r => setTimeout(r, 900))", true);
  const ok = await p.eval(`(() => { const d = document.getElementById("form-done"); return { done: !d.hidden, focused: document.activeElement === d, formHidden: document.querySelector("form[data-contact]").hidden }; })()`);
  assert(ok.done && ok.focused && ok.formHidden && await mails() === before + 1, `${lang}: a valid message is sent by the server and confirmed`, JSON.stringify(ok));
}

phase("motion");
await media(false);
await p.viewport(1440, 900);
for (const pg of PAGES.filter((x) => x.lang === "id")) {
  await fresh(BASE + pg.path);
  assert((await p.eval(expr(revealProbe))).motion, `${pg.key}: motion runs when allowed`);
  await p.eval(`(async () => { const H = document.documentElement.scrollHeight; for (let y = 0; y < H; y += 450) { scrollTo({ top: y, behavior: "instant" }); await new Promise(r => setTimeout(r, 70)); }
    scrollTo({ top: 0, behavior: "instant" }); await new Promise(r => setTimeout(r, 2000)); })()`, true);
  const rv = await p.eval(expr(revealProbe));
  assert(rv.hidden === 0, `${pg.key}: every entrance and diagram stage completes`, JSON.stringify(rv));
  const running = await p.eval("document.getAnimations().filter(a => a.playState === 'running' || a.effect?.getTiming().iterations === Infinity).length");
  assert(running === 0, `${pg.key}: nothing keeps moving`, `${running}`);
}
await media(true);

phase("no JavaScript");
await p.cdp.send("Emulation.setScriptExecutionDisabled", { value: true });
for (const pg of PAGES.filter((x) => x.lang === "id")) {
  const done = p.cdp.once("Page.loadEventFired");
  await p.cdp.send("Page.navigate", { url: BASE + pg.path });
  await Promise.race([done, new Promise((r) => setTimeout(r, 10000))]);
  await new Promise((r) => setTimeout(r, 250));
  const rv = await p.eval(expr(revealProbe));
  assert(!rv.motion && rv.hidden === 0, `${pg.key}: without JavaScript nothing is hidden`, JSON.stringify(rv));
}
await p.cdp.send("Emulation.setScriptExecutionDisabled", { value: false });

phase("storage");
for (const pg of PAGES) await fresh(BASE + pg.path);
const store = await p.eval(`(async () => ({ local: localStorage.length, session: sessionStorage.length, cookie: document.cookie, idb: (await indexedDB.databases()).length }))()`, true);
assert(store.local === 0 && store.session === 0 && store.cookie === "" && store.idb === 0, "nothing is stored on the visitor's device", JSON.stringify(store));
const cookies = await p.cdp.send("Network.getAllCookies");
assert(cookies.cookies.length === 0, "no cookie is set, by the page or by the server", String(cookies.cookies.length));

browser.kill();
php.kill();
await rm(tmp, { recursive: true, force: true });
console.log(`\n${checks} checks passed, ${fails.length} failed.`);
if (fails.length) { for (const f of fails) console.log("  ✗ " + f); process.exit(1); }
