// PART A — every role, every screen it can reach, in the seeded world.
//
// Signs each persona in with a real GoTrue session (the same cookie the app
// itself writes), then walks the internal links reachable from that persona's
// landing page, breadth first. Nothing is submitted: this part only reads.
// For each page it records the HTTP status, where it ended up, the heading,
// whether it is the refusal page or an error page, what the browser logged,
// every failed request, and a screenshot.
//
// Runs on a GitHub runner against a local Supabase stack. Never production.

import { chromium } from "playwright";
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const APP = process.env.APP_URL;
const SB = process.env.SUPABASE_URL;
const ANON = process.env.SUPABASE_ANON_KEY;
const OUT = process.env.OUT_DIR ?? "audit-out/crawl";
// W9: a figure's raw value on a page («0.75»): every PINTAR figure is a percentage, points or a count
const MENTAH = /(?<![\d.,])0\.\d{2,}(?!\d)/;
const require = createRequire(join(process.env.APP_DIR, "package.json"));
const { createServerClient } = require("@supabase/ssr");

const PERSONAS = [
  // demo (synthetic) schools, the seeded learning cycle included
  { key: "sysadmin", role: "SYSTEM_ADMIN", school: "demo", email: "sysadmin@synthetic.pintar.test", password: "Sintetis-Sys-91!" },
  { key: "alpha-admin", role: "INSTITUTION_ADMIN", school: "demo", email: "alpha-admin@synthetic.pintar.test", password: "Sintetis-AlphaAdmin-27!" },
  { key: "alpha-dean", role: "DEAN", school: "demo", email: "alpha-dean@synthetic.pintar.test", password: "Sintetis-AlphaDean-33!" },
  { key: "alpha-hod", role: "HEAD_OF_DEPARTMENT", school: "demo", email: "alpha-hod@synthetic.pintar.test", password: "Sintetis-AlphaHod-48!" },
  { key: "alpha-guru", role: "EDUCATOR", school: "demo", email: "alpha-guru@synthetic.pintar.test", password: "Sintetis-AlphaGuru-52!" },
  { key: "alpha-siswa", role: "STUDENT", school: "demo", email: "alpha-siswa-1@synthetic.pintar.test", password: "Sintetis-AlphaSiswa1-76!" },
  { key: "siklus-admin", role: "INSTITUTION_ADMIN", school: "demo+data", email: "siklus-admin@synthetic.pintar.test", password: "Sintetis-SiklusAdmin-33!" },
  { key: "siklus-kaprodi", role: "HEAD_OF_DEPARTMENT", school: "demo+data", email: "siklus-kaprodi@synthetic.pintar.test", password: "Sintetis-SiklusKaprodi-22!" },
  { key: "siklus-guru", role: "EDUCATOR", school: "demo+data", email: "siklus-guru@synthetic.pintar.test", password: "Sintetis-SiklusGuru-11!" },
  { key: "siklus-siswa", role: "STUDENT", school: "demo+data", email: "siklus-email@synthetic.pintar.test", password: "Sintetis-SiklusEmail-84!" },
  // the one OFFICIAL school, for comparing what reports show
  { key: "boot-admin", role: "INSTITUTION_ADMIN", school: "official", email: "boot-admin@bootstrap.pintar.test", password: "Bootstrap-Admin-9163!" },
  { key: "boot-kaprodi", role: "HEAD_OF_DEPARTMENT", school: "official", email: "boot-kaprodi@bootstrap.pintar.test", password: "Bootstrap-Kaprodi-5528!" },
  { key: "boot-guru", role: "EDUCATOR", school: "official", email: "boot-guru@bootstrap.pintar.test", password: "Bootstrap-Guru-7741!" },
  { key: "boot-siswa", role: "STUDENT", school: "official", email: "boot-siswa@bootstrap.pintar.test", password: "Bootstrap-Siswa-3082!" },
];

const MAX_PAGES = Number(process.env.MAX_PAGES ?? 45);
// L3: the door each role's persona chooses on `/` (a purpose; for Admin platform, «Seluruh platform»)
const TUJUAN_PERAN = {
  SYSTEM_ADMIN: "MENGELOLA:PLATFORM", INSTITUTION_ADMIN: "MENGELOLA", DEAN: "MENGELOLA", HEAD_OF_DEPARTMENT: "MENGELOLA",
  EDUCATOR: "MENGAJAR", STUDENT: "BELAJAR",
};
const SKIP = [/^\/keluar/, /^\/api\//, /^\/_next\//, /^\/auth\//, /\.(png|jpe?g|svg|woff2?|css|js|pdf|csv|xlsx?)$/i];

async function sessionCookies(p) {
  const jar = new Map();
  const client = createServerClient(SB, ANON, {
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (cs) => cs.forEach(({ name, value }) => jar.set(name, value)),
    },
  });
  const { data, error } = await client.auth.signInWithPassword({ email: p.email, password: p.password });
  if (error || !data.session) throw new Error(`sign-in failed for ${p.key}: ${error?.message ?? "no session"}`);
  const host = new URL(APP).hostname;
  return [...jar].map(([name, value]) => ({ name, value, domain: host, path: "/", httpOnly: false, secure: false, sameSite: "Lax" }));
}

// X.6: in the page, at 320 px: null when nothing is wider than the window; otherwise how wide the page is and the
// outermost parts that stick out of a box that fits (a part inside a box that scrolls or clips sideways is left out)
const SEMPIT = () => {
  const d = document.documentElement;
  const lebar = d.clientWidth;
  if (d.scrollWidth <= lebar + 1) return null;
  const terpotong = (el) => {
    for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
      if (getComputedStyle(a).overflowX !== "visible") return true;
    }
    return false;
  };
  const nama = (el) => el.tagName.toLowerCase() + (el.id ? `#${el.id}` : "") +
    [...el.classList].slice(0, 3).map((c) => `.${c}`).join("");
  const sebab = [];
  for (const el of document.querySelectorAll("body *")) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.right <= lebar + 1) continue;
    const p = el.parentElement?.getBoundingClientRect();
    if (p && p.right > lebar + 1) continue;
    if (getComputedStyle(el).position === "fixed" || terpotong(el)) continue;
    sebab.push(`${el.parentElement ? nama(el.parentElement) + " > " : ""}${nama(el)} (${Math.round(r.width)} px, to ${Math.round(r.right)})`);
    if (sebab.length >= 4) break;
  }
  return { lebar, halaman: d.scrollWidth, sebab };
};

function internal(href) {
  try {
    const u = new URL(href, APP);
    if (u.origin !== new URL(APP).origin) return null;
    if (SKIP.some((r) => r.test(u.pathname))) return null;
    u.hash = "";
    return u.pathname + u.search;
  } catch {
    return null;
  }
}

async function crawl(browser, p) {
  const dir = join(OUT, p.key);
  mkdirSync(dir, { recursive: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: "id-ID", timezoneId: "Asia/Jakarta" });
  const result = { persona: p.key, role: p.role, school: p.school, landing: null, pages: [], error: null };
  try {
    await context.addCookies(await sessionCookies(p));
  } catch (e) {
    result.error = String(e.message ?? e);
    await context.close();
    return result;
  }
  const page = await context.newPage();
  let current = null;
  const consoleErrors = [];
  const failed = [];
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push({ at: current, text: m.text().slice(0, 300) }); });
  page.on("pageerror", (e) => consoleErrors.push({ at: current, text: `PAGEERROR ${String(e.message).slice(0, 300)}` }));
  page.on("response", (r) => {
    const s = r.status();
    if (s >= 400) failed.push({ at: current, status: s, url: r.url().replace(SB, "<supabase>").replace(APP, "").slice(0, 200) });
  });

  const queue = [{ path: "/", depth: 0, from: null }];
  const seen = new Set(["/"]);
  let n = 0;
  while (queue.length && n < MAX_PAGES) {
    const { path, depth, from } = queue.shift();
    current = path;
    const before = { c: consoleErrors.length, f: failed.length };
    const rec = { path, from, depth, status: null, finalPath: null, h1: null, refusal: false, errorPage: false, text: "", shot: null };
    try {
      const resp = await page.goto(APP + path, { waitUntil: "networkidle", timeout: 45000 });
      rec.status = resp?.status() ?? null;
      // X.10 (U-PERF, D-046(b)): when the page could be read (its first heading painted, the document parsed), from the
      // browser's own navigation timing. Reported, not judged: a runner's local stack is not the deployment.
      rec.ms = await page.evaluate(() => {
        const n = performance.getEntriesByType("navigation")[0];
        return n ? { awal: Math.round(n.responseStart), siap: Math.round(n.domContentLoadedEventEnd) } : null;
      }).catch(() => null);
      const fu = new URL(page.url());
      rec.finalPath = fu.pathname + fu.search;
      rec.h1 = (await page.locator("h1").first().textContent({ timeout: 2000 }).catch(() => null))?.trim() ?? null;
      rec.refusal = (await page.locator(".pin-refusal").count()) > 0;
      const body = (await page.locator("body").innerText().catch(() => "")) ?? "";
      // «404» as a word only: a page that shows an id («…-6102404a13d3») is not the framework's error page
      rec.errorPage = /Application error|server-side exception|This page could not be found|Internal Server Error|\b404\b/i.test(body.slice(0, 600));
      rec.text = body.replace(/\s+/g, " ").slice(0, 700);
      rec.mentah = body.match(MENTAH)?.[0] ?? null; // W9: read over the whole page, not the 700 characters kept
      rec.shot = `${String(n).padStart(2, "0")}${path.replace(/[^a-z0-9]+/gi, "_").slice(0, 60)}.png`;
      await page.screenshot({ path: join(dir, rec.shot), fullPage: true }).catch(() => (rec.shot = null));
      // X.6 (U-DEVICE, D-046): the same page at 320 px wide scrolls only downwards. A page wider than the window is
      // measured, and what sticks out of a box that fits is named (a part inside its own scrolling box is not).
      await page.setViewportSize({ width: 320, height: 720 });
      await page.waitForTimeout(200);
      rec.sempit = await page.evaluate(SEMPIT).catch((e) => ({ gagal: String(e.message ?? e).slice(0, 200) }));
      if (rec.sempit) {
        rec.shotSempit = rec.shot?.replace(/\.png$/, "-320.png") ?? null;
        if (rec.shotSempit) await page.screenshot({ path: join(dir, rec.shotSempit), fullPage: true }).catch(() => (rec.shotSempit = null));
      }
      await page.setViewportSize({ width: 1280, height: 900 });
      if (n === 0) result.landing = rec.finalPath;
      // Gate 6 (BOB-29): a staff browser is first asked «Komputer siapa ini?». The persona answers as the walks do
      // («Komputer pribadi saya»), so the crawl reads the screens behind the question rather than the question alone
      if (n === 0 && new URL(page.url()).pathname === "/perangkat") {
        await page.locator('input[type="radio"][name="mode"][value="PERSONAL"]').check();
        await page.getByRole("button", { name: "Simpan pilihan" }).click();
        await page.waitForURL((u) => u.pathname !== "/perangkat", { timeout: 20000 }).catch(() => {});
        await page.waitForLoadState("networkidle");
        result.perangkat = "PERSONAL";
        const lu = new URL(page.url());
        result.landing = lu.pathname + lu.search;
      }
      // L3 (D-132 C3): signed in, `/` is the chooser and visiting it changes nothing. The persona chooses its door as
      // a person does (its role's purpose; Admin platform, «Seluruh platform»), and the walk goes on from where the
      // choice lands, in that working context
      if (n === 0) {
        const pintu = page.locator('[data-pemilih="konteks"] button[data-konteks]');
        if (await pintu.count()) {
          const kunci = await pintu.evaluateAll((bs) => bs.map((b) => b.getAttribute("data-konteks")));
          const mau = TUJUAN_PERAN[p.role];
          const pilih = kunci.find((k) => k === mau) ?? kunci.find((k) => k.split(":")[0] === mau.split(":")[0]) ?? kunci[0];
          result.pintu = kunci;
          result.dipilih = pilih;
          await page.locator(`[data-pemilih="konteks"] button[data-konteks="${pilih}"]`).click();
          await page.waitForURL((u) => u.pathname !== "/", { timeout: 20000 }).catch(() => {});
          await page.waitForLoadState("networkidle");
          const lu = new URL(page.url());
          result.landing = lu.pathname + lu.search;
          if (!seen.has(result.landing)) { seen.add(result.landing); queue.unshift({ path: result.landing, depth: 0, from: path }); }
        }
      }
      if (depth < 3) {
        const hrefs = await page.$$eval("a[href]", (as) => as.map((a) => a.getAttribute("href")));
        for (const h of hrefs) {
          const ip = internal(h);
          if (ip && !seen.has(ip)) { seen.add(ip); queue.push({ path: ip, depth: depth + 1, from: path }); }
        }
      }
    } catch (e) {
      rec.error = String(e.message ?? e).slice(0, 300);
    }
    rec.consoleErrors = consoleErrors.slice(before.c);
    rec.failedRequests = failed.slice(before.f);
    result.pages.push(rec);
    n++;
  }
  result.unvisited = queue.map((q) => q.path);
  await context.close();
  return result;
}

const browser = await chromium.launch();
mkdirSync(OUT, { recursive: true });
const all = [];
for (const p of PERSONAS) {
  const r = await crawl(browser, p);
  all.push(r);
  const bad = r.pages.filter((x) => x.errorPage || (x.status ?? 0) >= 500 || x.error || x.consoleErrors.some((c) => c.text.startsWith("PAGEERROR")));
  console.log(`${p.key.padEnd(15)} ${p.role.padEnd(19)} landing=${r.landing ?? "-"}${r.perangkat ? " (answered «Komputer siapa ini?»)" : ""}${r.dipilih ? ` (chose ${r.dipilih} of ${r.pintu.length})` : ""} pages=${r.pages.length} refusals=${r.pages.filter((x) => x.refusal).length} broken=${bad.length}${r.error ? " ERROR " + r.error : ""}`);
}
await browser.close();
writeFileSync(join(OUT, "crawl.json"), JSON.stringify(all, null, 2));

// The detail, printed to the job log (the artifact is not reachable from everywhere).
const REPORTY = /pimpinan|bukti|hasil|ringkasan|laporan|sertifikat|umpan-balik|bank|langkah|siapa/;
for (const r of all) {
  console.log(`\n=== ${r.persona} (${r.role}, ${r.school})`);
  for (const x of r.pages) {
    const flags = [x.refusal && "REFUSAL", x.errorPage && "ERROR-PAGE", x.error && "NAV-ERROR",
      (x.status ?? 0) >= 400 && `HTTP${x.status}`, x.consoleErrors.length && `console:${x.consoleErrors.length}`,
      x.failedRequests.length && `failed-req:${x.failedRequests.length}`].filter(Boolean).join(" ");
    console.log(`  ${x.path} -> ${x.finalPath ?? "-"} | h1: ${x.h1 ?? "-"} ${flags ? "| " + flags : ""}`);
    if (REPORTY.test(x.path) || x.errorPage || x.error) console.log(`      text: ${x.text.slice(0, 420)}`);
    for (const c of x.consoleErrors.slice(0, 3)) console.log(`      console: ${c.text.slice(0, 200)}`);
    for (const f of x.failedRequests.slice(0, 3)) console.log(`      failed: ${f.status} ${f.url}`);
    if (x.error) console.log(`      nav-error: ${x.error}`);
    if (x.sempit) console.log(`      320px: ${x.sempit.gagal ?? `the page is ${x.sempit.halaman} px wide; ${x.sempit.sebab.join("; ") || "no single part named"}`}`);
  }
}

// X.10: the slowest pages to become readable, for the record (judged on staging, not here)
{
  const semua = all.flatMap((r) => r.pages.filter((x) => x.ms?.siap).map((x) => ({ who: r.persona, path: x.path, ...x.ms })));
  semua.sort((a, b) => b.siap - a.siap);
  const lambat = semua.filter((x) => x.siap > 3000).length;
  console.log(`\nX.10: ${semua.length} pages timed; ${lambat} took over 3 s to be readable; the slowest:`);
  for (const x of semua.slice(0, 8)) console.log(`  ${x.siap} ms (first byte ${x.awal} ms) ${x.who} ${x.path}`);
  if (process.env.GITHUB_STEP_SUMMARY) {
    writeFileSync(process.env.GITHUB_STEP_SUMMARY, [`### X.10 page readiness (runner, for the record)`, "",
      `${semua.length} pages timed; ${lambat} over 3 s.`, "", ...semua.slice(0, 8).map((x) => `- ${x.siap} ms ${x.who} ${x.path}`), ""].join("\n"), { flag: "a" });
  }
}

// The crawl can fail (D-087, Phase 2): a server error, the framework's error
// page, a navigation error or an uncaught page error on any page turns the job
// red. A refusal page is not a failure: it is the product refusing a role.
const broken = [];
for (const r of all) {
  if (r.error) broken.push(`${r.persona}: ${r.error}`);
  for (const x of r.pages) {
    if (x.errorPage || (x.status ?? 0) >= 500 || x.error || x.consoleErrors.some((c) => c.text.startsWith("PAGEERROR")))
      broken.push(`${r.persona} ${x.path} -> ${x.finalPath ?? "-"} (${x.error ?? (x.errorPage ? "error page" : x.status >= 500 ? `HTTP ${x.status}` : "page error")})`);
  }
}
// W9 (J7.3, J7.4): a report or management page that prints a figure's raw value («0.75») is broken too.
for (const r of all) {
  for (const x of r.pages) {
    if (/ringkasan|pimpinan/.test(x.path) && x.mentah) broken.push(`${r.persona} ${x.path} prints a raw decimal: "${x.mentah}"`);
  }
}
// X.6 (U-DEVICE, D-046): responsive is part of PASS. A page wider than a 320 px window, for any role, is broken.
for (const r of all) {
  for (const x of r.pages) {
    if (x.sempit) broken.push(`${r.persona} ${x.path} at 320 px: ${x.sempit.gagal ?? `${x.sempit.halaman} px wide (${x.sempit.sebab.join("; ") || "no single part named"})`}`);
  }
}
// The controlled red: AUDIT_PLANT=crawl adds one broken page.
if (["crawl", "both"].includes(process.env.AUDIT_PLANT)) broken.push("PLANT: planted failure, proves the crawl goes red");
if (process.env.GITHUB_STEP_SUMMARY) {
  writeFileSync(process.env.GITHUB_STEP_SUMMARY, [`### Crawl A: ${broken.length ? `RED, ${broken.length} broken` : "GREEN"}`, "", ...all.map((r) => `- ${r.persona} (${r.role}): ${r.pages.length} pages${r.error ? `, ERROR ${r.error}` : ""}`), "", ...broken.map((b) => `- BROKEN ${b}`), ""].join("\n"), { flag: "a" });
}
if (broken.length) {
  console.log(`\nRED: ${broken.length} broken\n  ${broken.join("\n  ")}`);
  process.exitCode = 1;
}
