// STAGING ONLY. Batch 1 closeout (owner, 2 Nov: «security, content, regression, accessibility and Golden School
// verification»): the Batch 0 accessibility harness (../a11y.mjs) on the running staging application.
//
// Each Golden School staff person (the school admin, the teacher, the head of department, the dean; golden-school-admin.mjs
// made them) signs in as Gate 3 has it (masuk.mjs: the password), and every working context the chooser offers them is
// opened. Its landing screen and up to SEJAUH of its own navigation links are checked; so are the public pages. Every
// step is a page load (GET) or a sign-in: nothing is submitted, and links that end a session are never followed.
//
// It RECORDS, as the Batch 0 baseline does (a11y.mjs): the findings are the staging baseline, not a verdict. The run
// fails only when the harness could not do its work: a person could not sign in, or axe could not run on a page.
// Learners are not walked here: a card's PIN is shown once (golden-school-murid.mjs); learner screens are measured by
// the local crawl (audit-journeys job A).
//
// NEVER: production (staging's ref and database URL are checked first); any write to the database (read only); a
// password or PIN in the log.

import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, appendFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { APP, SLOW, closeTour } from "../perf/lib.mjs";
import { keadaanDari, masukStaf } from "./masuk.mjs";
import { periksa, ringkas } from "../a11y.mjs";

const env = (k) => { const v = process.env[k]; if (!v) throw new Error(`${k} is not set`); return v; };
const DB = env("STAGING_SUPABASE_DB_URL");
const REF = env("STAGING_SUPABASE_PROJECT_REF");
const PRODUCTION_REF = env("PRODUCTION_SUPABASE_PROJECT_REF");
const SLUG = env("GS_SLUG");
const OUT = process.env.OUT_DIR ?? "out";
const SUMMARY = process.env.GITHUB_STEP_SUMMARY;
const SEJAUH = 6;
if (!DB.includes(REF) || DB.includes(PRODUCTION_REF) || !APP.includes("staging")) throw new Error("not staging");
if (!/^[a-z0-9][a-z0-9-]{1,40}$/.test(SLUG)) throw new Error("GS_SLUG is not a school slug");
mkdirSync(OUT, { recursive: true });

const mail = (who) => `goldenschool+${SLUG}-${who}@pintarselalu.com`;
const sql = (q) => execFileSync("psql", [DB, "-qAt", "-v", "ON_ERROR_STOP=1",
  "-c", "begin transaction read only", "-c", q, "-c", "commit"], { encoding: "utf8" }).trim();
const lit = (s) => { if (String(s).includes("$q$")) throw new Error("unsafe literal"); return `$q$${s}$q$`; };
const log = (s) => { console.log(s); if (SUMMARY) appendFileSync(SUMMARY, `${s}\n`); };
const BERBAHAYA = /keluar|logout|sign-?out|hapus|cabut|terbitkan/i;

const semua = [];
const masalah = [];

async function ukur(rec, page) {
  const path = new URL(page.url()).pathname + new URL(page.url()).search;
  const a11y = await periksa(page).catch((e) => ({ gagal: [String(e.message ?? e).slice(0, 200)] }));
  rec.pages.push({ path, a11y });
  if (!a11y.axe) masalah.push(`${rec.persona} ${path}: axe could not run (${(a11y.gagal ?? []).join("; ")})`);
}

async function buka(page, path) {
  await page.goto(`${APP}${path}`, { timeout: SLOW, waitUntil: "networkidle" });
  await closeTour(page).catch(() => {});
}

async function tautanSendiri(page) {
  const hrefs = await page.locator("nav a[href^='/'], header a[href^='/'], aside a[href^='/']").evaluateAll(
    (as) => [...new Set(as.map((a) => a.getAttribute("href")))]);
  return hrefs.filter((h) => h && h !== "/" && !BERBAHAYA.test(h)).slice(0, SEJAUH);
}

const browser = await chromium.launch();
try {
  // the public pages, anonymous
  {
    const rec = { persona: "anonim", pages: [] };
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    for (const p of ["/masuk", "/verifikasi"]) { await buka(page, p); await ukur(rec, page); }
    await ctx.close();
    semua.push(rec);
  }
  for (const who of ["admin", "guru", "kabag", "dekan"]) {
    const rec = { persona: who, pages: [] };
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    try {
      await masukStaf(page, mail(who), keadaanDari(sql, lit));
      await closeTour(page).catch(() => {});
      const pintu = [];
      if (new URL(page.url()).pathname === "/" && (await page.locator('[data-pemilih="konteks"]').count()) > 0) {
        await ukur(rec, page);
        pintu.push(...await page.locator('[data-pemilih="konteks"] button[data-konteks]').evaluateAll((bs) => bs.map((b) => b.getAttribute("data-konteks"))));
      } else {
        pintu.push(null);
      }
      const dilihat = new Set();
      for (const k of pintu) {
        if (k) {
          await buka(page, "/");
          await page.locator(`[data-pemilih="konteks"] button[data-konteks="${k}"]`).click();
          await page.waitForURL((u) => u.pathname !== "/", { timeout: SLOW }).catch(() => {});
          await page.waitForLoadState("networkidle");
          await closeTour(page).catch(() => {});
        }
        const rumah = new URL(page.url()).pathname;
        if (!dilihat.has(rumah)) { dilihat.add(rumah); await ukur(rec, page); }
        for (const h of await tautanSendiri(page)) {
          if (dilihat.has(h)) continue;
          dilihat.add(h);
          await buka(page, h);
          await ukur(rec, page);
        }
      }
      log(`${who}: ${rec.pages.length} page(s) checked over ${pintu.filter(Boolean).length || 1} working context(s)`);
    } catch (e) {
      masalah.push(`${who}: ${String(e.message ?? e).split("\n")[0].slice(0, 300)}`);
    } finally {
      await ctx.close();
    }
    semua.push(rec);
  }
} finally {
  await browser.close();
}

const b = ringkas(semua);
writeFileSync(join(OUT, "a11y-staging.json"), JSON.stringify({ slug: SLUG, app: APP, ...b }, null, 1));
const baris = [
  `A11Y ON STAGING (recorded, not judged; Batch 0 harness): ${b.layar} distinct screens (${b.halaman} pages checked)`,
  `  title missing or only «PINTAR»: ${b.tanpaJudul}; no working skip link as the first Tab stop: ${b.tanpaLompat}`,
  `  a focus stop without a visible indicator: ${b.fokusTakTerlihat}; focus stuck: ${b.fokusMacet}; no focus stop at all: ${b.tanpaBerhentiPapan}`,
  `  axe clean: ${b.axeBersih}; axe could not run: ${b.axeGagal}`,
  `  wider than the window at ${Object.entries(b.meluap).map(([w, n]) => `${w}px: ${n}`).join(", ")}`,
  `  clipped text at ${Object.entries(b.terpotong).map(([w, n]) => `${w}px: ${n}`).join(", ")}`,
  `  axe rules violated (impact, screens, nodes):`,
  ...b.aturan.map((a) => `    ${a.id} (${a.impact}) ${a.layar} screens, ${a.node} nodes — ${a.help}; e.g. ${a.contoh.join(" ")}`),
];
log(["", ...baris].join("\n"));
if (masalah.length) {
  for (const m of masalah) console.log(`::error title=a11y-staging::${m.replace(/%/g, "%25")}`);
  log(`\nHARNESS INCOMPLETE: ${masalah.length} problem(s)\n${masalah.join("\n")}`);
  process.exit(1);
}
log("\nHARNESS COMPLETE: every persona signed in and axe ran on every page reached");
