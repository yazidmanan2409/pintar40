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
      const fu = new URL(page.url());
      rec.finalPath = fu.pathname + fu.search;
      rec.h1 = (await page.locator("h1").first().textContent({ timeout: 2000 }).catch(() => null))?.trim() ?? null;
      rec.refusal = (await page.locator(".pin-refusal").count()) > 0;
      const body = (await page.locator("body").innerText().catch(() => "")) ?? "";
      rec.errorPage = /Application error|server-side exception|This page could not be found|Internal Server Error|404/i.test(body.slice(0, 600));
      rec.text = body.replace(/\s+/g, " ").slice(0, 700);
      rec.shot = `${String(n).padStart(2, "0")}${path.replace(/[^a-z0-9]+/gi, "_").slice(0, 60)}.png`;
      await page.screenshot({ path: join(dir, rec.shot), fullPage: true }).catch(() => (rec.shot = null));
      if (n === 0) result.landing = rec.finalPath;
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
  console.log(`${p.key.padEnd(15)} ${p.role.padEnd(19)} landing=${r.landing ?? "-"} pages=${r.pages.length} refusals=${r.pages.filter((x) => x.refusal).length} broken=${bad.length}${r.error ? " ERROR " + r.error : ""}`);
}
await browser.close();
writeFileSync(join(OUT, "crawl.json"), JSON.stringify(all, null, 2));
