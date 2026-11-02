// STAGING ONLY. Batch 1 closeout (owner, 2 Nov: «security, content, regression, accessibility and Golden School
// verification»): the Batch 0 accessibility harness (../a11y.mjs) on the running staging application.
//
// Each Golden School staff person (the school admin, the teacher, the head of department, the dean; golden-school-admin.mjs
// made them) signs in as Gate 3 has it (masuk.mjs: the password), and every working context the chooser offers them is
// opened. Its landing screen and up to SEJAUH of its own navigation links are checked; so are the public pages. Every
// step is a page load (GET) or a sign-in: nothing is submitted, and links that end a session are never followed.
//
// It RECORDS, as the Batch 0 baseline does (a11y.mjs): the findings are the staging baseline, not a verdict. Batch 2's
// promotion adds JUDGED checks that fail the run: the keyboard walk of the skip link, the account menu and the dialog
// (never confirmed), no page title carrying a name of the school's people, a refused page's title, the menu at 320 px
// and no sideways scroll at 1280, 1024 and 320 px. The run also fails when the harness could not do its work.
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

// ── JUDGED (Batch 2 promotion, owner item 6 and 8): keyboard, titles, widths. These FAIL the run when they fail.
const nilai = [];
const nilaiKah = (id, ok, d) => { nilai.push({ id, ok }); log(`${ok ? "PASS" : "FAIL"} ${id} :: ${d}`); if (!ok) console.log(`::error title=${id}::${String(d).replace(/%/g, "%25").slice(0, 600)}`); };
const aktif = (page) => page.evaluate(() => { const e = document.activeElement; return { tag: e.tagName.toLowerCase(), id: e.id, cls: typeof e.className === "string" ? e.className : "", role: e.getAttribute("role"), teks: (e.innerText || "").replace(/\s+/g, " ").trim().slice(0, 40), atas: Math.round(e.getBoundingClientRect().top) }; });
// the school's people, by name: no page title may carry one
const namaOrang = sql(`select coalesce(string_agg(p.display_name, '|'), '') from public.persons p join public.enrollments e on e.person_id = p.id join public.institutions i on i.id = e.institution_id where i.slug = ${lit(SLUG)}`)
  .split("|").concat(sql(`select coalesce(string_agg(p.display_name, '|'), '') from public.persons p join public.role_assignments r on r.person_id = p.id join public.institutions i on i.id = r.institution_id where i.slug = ${lit(SLUG)}`).split("|"))
  .map((x) => x.trim()).filter((x) => x.length >= 4);
const judulDilihat = semua.flatMap((r) => r.pages.map((x) => ({ who: r.persona, path: x.path, judul: x.a11y?.judul ?? "" })));
const bocor = judulDilihat.filter((x) => namaOrang.some((n) => x.judul.includes(n)));
nilaiKah("JUDUL-NAMA", namaOrang.length > 0 && bocor.length === 0, `${judulDilihat.length} titles read, ${namaOrang.length} names of the school's people checked; carrying a name: ${bocor.map((x) => `${x.who} ${x.path} «${x.judul}»`).join("; ") || "none"}`);
{
  const browser2 = await chromium.launch();
  try {
    // the admin at 1280: the skip link, the account menu, the dialog (never confirmed)
    for (const lebar of [1280, 1024, 320]) {
      const ctx = await browser2.newContext({ viewport: { width: lebar, height: 900 } });
      const page = await ctx.newPage();
      await masukStaf(page, mail("admin"), keadaanDari(sql, lit));
      if (new URL(page.url()).pathname === "/" && (await page.locator('[data-pemilih="konteks"] button[data-konteks]').count())) {
        await page.locator('[data-pemilih="konteks"] button[data-konteks]').first().click();
        await page.waitForURL((u) => u.pathname !== "/", { timeout: SLOW }).catch(() => {});
      }
      await page.waitForLoadState("networkidle"); await closeTour(page).catch(() => {});
      const di = new URL(page.url()).pathname;
      const melebar = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      nilaiKah(`LEBAR-${lebar}`, !melebar, `${di} at ${lebar} px: wider than the window ${melebar}`);
      if (lebar === 1280) {
        await page.goto(`${APP}${di}`, { waitUntil: "networkidle" }); await closeTour(page).catch(() => {});
        await page.keyboard.press("Tab"); await page.waitForTimeout(400); let a = await aktif(page);
        nilaiKah("PAPAN-LEWATI", a.tag === "a" && /pin-lewati/.test(a.cls) && a.atas >= 0, `first Tab on ${di}: ${a.tag}.${a.cls} «${a.teks}» top ${a.atas}`);
        await page.keyboard.press("Enter"); await page.waitForTimeout(200); a = await aktif(page);
        nilaiKah("PAPAN-ISI", a.id === "isi", `Enter: focus on ${a.tag}#${a.id}`);
        let n = 0, ketemu = false;
        await page.goto(`${APP}${di}`, { waitUntil: "networkidle" }); await closeTour(page).catch(() => {});
        for (; n < 120; n++) { await page.keyboard.press("Tab"); a = await aktif(page); if (/pin-menu-tombol/.test(a.cls)) { ketemu = true; break; } }
        nilaiKah("PAPAN-MENU-0", ketemu, `the account menu's button reached by Tab in ${n + 1}`);
        await page.keyboard.press("Enter"); await page.waitForTimeout(200); a = await aktif(page);
        const ex = await page.getAttribute("button.pin-menu-tombol", "aria-expanded");
        nilaiKah("PAPAN-MENU-1", ex === "true" && a.role === "menuitem", `Enter: expanded ${ex}, focus «${a.teks}» (${a.role})`);
        await page.keyboard.press("End"); const akhir = (await aktif(page)).teks;
        await page.keyboard.press("Home"); const awal = (await aktif(page)).teks;
        await page.keyboard.press("Escape"); await page.waitForTimeout(150); a = await aktif(page);
        nilaiKah("PAPAN-MENU-2", /semua perangkat/i.test(akhir) && awal !== akhir && /pin-menu-tombol/.test(a.cls), `End «${akhir}», Home «${awal}», Esc back on ${a.cls}`);
        await page.keyboard.press("Enter"); await page.waitForTimeout(150); await page.keyboard.press("End"); await page.keyboard.press("Enter"); await page.waitForTimeout(300);
        const buka = await page.evaluate(() => document.querySelector("dialog.pin-dialog")?.open === true); a = await aktif(page);
        nilaiKah("PAPAN-DIALOG-1", buka && /^Batal$/.test(a.teks), `the dialog open ${buka}, focus «${a.teks}»`);
        await page.screenshot({ path: join(OUT, "dialog-1280.png") }).catch(() => {});
        await page.keyboard.press("Escape"); await page.waitForTimeout(200); a = await aktif(page);
        const tutup = await page.evaluate(() => document.querySelector("dialog.pin-dialog")?.open === false);
        nilaiKah("PAPAN-DIALOG-2", tutup && /pin-menu-tombol/.test(a.cls) && new URL(page.url()).pathname === di, `Esc: closed ${tutup}, focus on ${a.cls}, still signed in on ${new URL(page.url()).pathname}`);
      }
      if (lebar === 320) {
        const laci = page.locator('label[for="pin-laci"]');
        if (await laci.isVisible().catch(() => false)) { await laci.click(); await page.waitForTimeout(200); }
        await page.locator("button.pin-menu-tombol:visible").first().click();
        await page.waitForTimeout(200);
        const m = await page.evaluate(() => { const r = document.querySelector("#pin-menu-akun")?.getBoundingClientRect(); return r ? { l: Math.round(r.left), r: Math.round(r.right), w: innerWidth, h: Math.round(r.height) } : null; });
        nilaiKah("MENU-320", m && m.h > 0 && m.l >= 0 && m.r <= m.w, `the open account menu at 320 px: ${JSON.stringify(m)}`);
        await page.screenshot({ path: join(OUT, "menu-320.png") }).catch(() => {});
      }
      await ctx.close();
    }
    // a page the reader may not open: the teacher asks for Pimpinan; the tab says nothing of Pimpinan's home
    const ctx = await browser2.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    await masukStaf(page, mail("guru"), keadaanDari(sql, lit));
    await page.goto(`${APP}/pimpinan`, { waitUntil: "networkidle" });
    const judul = await page.title();
    const ditolak = (await page.locator(".pin-refusal").count()) > 0;
    nilaiKah("JUDUL-DITOLAK", ditolak && !/menunggu Anda/i.test(judul), `the teacher on /pimpinan: refused ${ditolak}, title «${judul}»`);
    await ctx.close();
  } catch (e) {
    nilaiKah("PAPAN-JALAN", false, String(e.message ?? e).split("\n")[0].slice(0, 300));
  } finally {
    await browser2.close();
  }
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
const gagalNilai = nilai.filter((x) => !x.ok);
if (gagalNilai.length) masalah.push(`judged checks failed: ${gagalNilai.map((x) => x.id).join(", ")}`);
if (masalah.length) {
  for (const m of masalah) console.log(`::error title=a11y-staging::${m.replace(/%/g, "%25")}`);
  log(`\nHARNESS INCOMPLETE: ${masalah.length} problem(s)\n${masalah.join("\n")}`);
  process.exit(1);
}
log("\nHARNESS COMPLETE: every persona signed in and axe ran on every page reached");
