/**
 * E1 · W3.12 — J3's navigation restated under the L3 working context (O6(a)), as one
 * experience with E2's context control. Design specimen, not application code:
 *
 *   npx tsx docs/coordination/ux/completion-4.0/E1/buat-e1.mts
 *
 * The shell is the design system's AppShell (bundle.css / bundle.js): its rail at
 * 1024–1279 px, its collapse («Ciutkan navigasi» / «Lebarkan navigasi»), its tooltips and
 * its drawer, unchanged. Words: the copy table at 0b19707 and the DS's approved shell words;
 * Mengelola's name is G1's slot. People and places are invented.
 */
import { execSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync, readFileSync, mkdtempSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const sini = dirname(fileURLToPath(import.meta.url));
const repo = join(sini, "..", "..", "..", "..", "..");
const DS = join(repo, "docs/coordination/ux/sistem-desain");
const kerja = mkdtempSync(join(tmpdir(), "e1-"));
for (const f of ["hle.ts", "tanggal.ts"]) writeFileSync(join(kerja, f), execSync(`git show 0b19707:src/lib/${f}`, { cwd: repo }));
const hle = await import(join(kerja, "hle.ts"));
const kata = (k: string, persona = "staff") => { const v: string = hle.t(k, persona, { locale: "id" }); if (!v || v === k || v === "—") throw new Error(`no words for ${k}`); return v; };
/** The DS's approved shell words (J3 README, question 1): not in the copy table yet, marked new there. */
const DSKATA = { ciut: "Ciutkan navigasi", lebar: "Lebarkan navigasi", buka: "Buka menu", tutup: "Tutup menu", lewati: "Langsung ke isi" };
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const ikon = (n: string) => `<i data-ikon="${n}"></i>`;
const SLOT_MANAGE = "[G1 · context.manage_label]";

type Konteks = { tujuan: "MENGAJAR" | "BELAJAR" | "MENGELOLA"; tempat: string; tempatSingkat: string; lain: boolean };
type Orang = { nama: string; inisial: string; peran: string };
type Sajian = { kode: string; judul: string; orang: Orang; konteks: Konteks; tempat: Array<[string, string]>; h1: string; intro: string };
const S = "SMP Cahaya Kaliandra";
const namaTujuan = (k: Konteks) => k.tujuan === "MENGAJAR" ? kata("nav.kelas") : k.tujuan === "BELAJAR" ? kata("nav.belajar") : SLOT_MANAGE;
const slotTujuan = (k: Konteks) => k.tujuan === "MENGELOLA" ? `<span class="c1-slot-kata e2-slot" data-slot="G1" data-kunci="context.manage_label">${SLOT_MANAGE}</span>` : esc(namaTujuan(k));

function halaman(s: Sajian, ciut?: "ya" | "tidak"): string {
  const k = s.konteks;
  const label = `${namaTujuan(k)} · ${k.tempat}`;
  // E2's context control: purpose · place, and «Mau ke mana hari ini?» for a person with more than one context.
  const blok = `<div class="e2-konteks e1-konteks" data-konteks-tempat=""><span class="e2-konteks-tujuan">${slotTujuan(k)}</span><strong class="e2-konteks-tempat">${esc(k.tempat)}</strong>${k.lain ? `<a href="#" class="e2-konteks-pilih" data-konteks-pilih="">${kata("entry.title", "public")}${ikon("chevron-right")}</a>` : ""}</div>`;
  // In the rail (72 px) the block becomes one 44 px item: the place's initials, named in full; it is the chooser link
  // when there is another context, and absent when there is none (the expanded navigation and the page say where).
  const rail = k.lain ? `<a href="#" class="pds-nav-item e1-rail-konteks" data-konteks-pilih="" data-tip="${esc(kata("entry.title", "public"))} · ${esc(label)}" data-tip-arah="kanan"><span class="e1-inisial" data-inisial="${esc(k.tempatSingkat)}" aria-hidden="true"></span><span class="pds-nav-label">${esc(kata("entry.title", "public"))} · ${esc(label)}</span></a>` : "";
  const tempat = s.tempat.map(([t, i], n) => `<li><a href="#" class="pds-nav-item"${n === 0 ? ' aria-current="page"' : ""}>${ikon(i)}<span class="pds-nav-label">${esc(t)}</span></a></li>`).join("");
  const bawah = (laci: boolean) => `<a href="#" class="pds-nav-item">${ikon("circle-help")}<span class="pds-nav-label">${kata("nav.bantuan")}</span></a>
      <a href="#" class="pds-nav-item">${ikon("triangle-alert")}<span class="pds-nav-label">${kata("nav.lapor")}</span></a>
      <div class="pds-identity" style="cursor:default"><span class="pds-avatar" aria-hidden="true">${s.orang.inisial}</span><div><strong>${esc(s.orang.nama)}</strong><small>${esc(s.orang.peran)}</small></div></div>
      <button type="button" class="pds-nav-item pds-nav-keluar">${ikon("log-out")}<span class="pds-nav-label">${kata("sesi.keluar")}</span></button>`;
  const merek = `<span class="pds-merek pds-merek-penuh">PINTAR</span>`;
  const tombolCiut = ciut === "ya" ? `<button type="button" class="pds-btn pds-btn-icon" data-shell-ciut aria-label="${DSKATA.lebar}" aria-expanded="false">${ikon("panel-left-open")}</button>`
    : `<button type="button" class="pds-btn pds-btn-icon e1-ciut" data-shell-ciut aria-label="${DSKATA.ciut}" aria-expanded="true">${ikon("panel-left-close")}</button>`;
  return `<div class="pds pds-jalan e1">
  <section class="pds-lewati-induk" data-shell data-shell-statis aria-label="${esc(s.judul)}">
  <a class="pds-lewati" href="#e1-isi">${DSKATA.lewati}</a>
  <div class="pds-shell-host"><div class="pds-shell"${ciut ? ` data-ciut="${ciut}"` : ""}>
    <nav class="pds-nav" aria-label="${kata("nav.tempat")}">
      <div class="pds-nav-kepala">${merek}${tombolCiut}</div>
      ${blok}${rail}
      <ul class="pds-nav-daftar">${tempat}</ul>
      <div class="pds-nav-bawah">${bawah(false)}</div>
    </nav>
    <div class="pds-main">
      <header class="pds-bar"><span class="pds-merek">PINTAR</span><span class="e2-bar-konteks"><strong>${esc(k.tempat)}</strong></span><button type="button" class="pds-btn pds-btn-secondary">${kata("sesi.keluar")}</button><button type="button" class="pds-btn pds-btn-icon" aria-label="${DSKATA.buka}" data-dialog-buka="e1-laci">${ikon("menu")}</button></header>
      <main class="pds-main-isi" id="e1-isi" tabindex="-1"><div class="pds-pagehead"><div><h1 class="pds-title">${esc(s.h1)}</h1><p class="pds-intro">${esc(s.intro)}</p></div></div></main>
    </div></div></div></section></div>
  <div class="pds"><dialog class="pds-drawer" id="e1-laci" aria-label="${kata("nav.menu")}" data-tutup-luar>
    <div class="pds-drawer-kepala"><span class="pds-merek">PINTAR</span><button type="button" class="pds-btn pds-btn-icon" aria-label="${DSKATA.tutup}" data-dialog-tutup>${ikon("x")}</button></div>
    <nav class="pds-drawer-isi" aria-label="${kata("nav.tempat")}">${blok.replace('data-konteks-tempat=""', 'data-konteks-tempat="laci"')}<ul class="pds-nav-daftar">${tempat}</ul><div class="pds-nav-bawah">${bawah(true)}</div></nav>
  </dialog></div>`;
}

const CITRA: Orang = { nama: "Citra Lestari", inisial: "CL", peran: `Guru · ${S}` };
const MENGAJAR: Array<[string, string]> = [[kata("nav.kelas"), "users"], [kata("nav.studio"), "square-pen"]];
const SAJIAN: Sajian[] = [
  { kode: "mengajar", judul: "Mengajar · a Guru who also learns (two contexts)", orang: CITRA, konteks: { tujuan: "MENGAJAR", tempat: S, tempatSingkat: "SC", lain: true }, tempat: MENGAJAR, h1: "Kelas", intro: "Kelas yang Anda ajar tahun ajaran ini." },
  { kode: "belajar", judul: "Belajar · the same Guru, learning (staff shell, JQ3)", orang: CITRA, konteks: { tujuan: "BELAJAR", tempat: S, tempatSingkat: "SC", lain: true }, tempat: [[kata("nav.belajar"), "book-open"]], h1: "Pembelajaran Saya", intro: "Kursus pengembangan profesi Anda." },
  { kode: "tunggal", judul: "Mengajar · one context only (no chooser link)", orang: { nama: "Fitri Handayani", inisial: "FH", peran: `Guru · ${S}` }, konteks: { tujuan: "MENGAJAR", tempat: S, tempatSingkat: "SC", lain: false }, tempat: MENGAJAR, h1: "Kelas", intro: "Kelas yang Anda ajar tahun ajaran ini." },
  { kode: "mengelola", judul: "Mengelola · Admin sekolah (G1's name)", orang: { nama: "Dewi Saraswati", inisial: "DS", peran: `Admin sekolah · ${S}` }, konteks: { tujuan: "MENGELOLA", tempat: S, tempatSingkat: "SC", lain: true },
    tempat: [[kata("nav.konfigurasi"), "settings"], [kata("nav.pendataan"), "file-spreadsheet"], [kata("nav.aktivasi"), "user-check"], [kata("nav.studio"), "square-pen"], [kata("keamanan.judul"), "shield"], [kata("sertifikat.kelola.judul"), "award"]], h1: "Konfigurasi", intro: "" },
  { kode: "pimpinan", judul: "Mengelola · Kepala departemen (Pimpinan)", orang: { nama: "Eko Prasetyo", inisial: "EP", peran: `Kepala departemen · ${S}` }, konteks: { tujuan: "MENGELOLA", tempat: S, tempatSingkat: "SC", lain: true }, tempat: [[kata("nav.pimpinan"), "chart-no-axes-column"], [kata("nav.studio"), "square-pen"]], h1: "Apa yang menunggu Anda", intro: "" },
  { kode: "platform", judul: "Mengelola · Admin platform in «Seluruh platform»", orang: { nama: "Arif Nugraha", inisial: "AN", peran: "Admin platform" }, konteks: { tujuan: "MENGELOLA", tempat: kata("config.pemeliharaan.platform"), tempatSingkat: "SP", lain: true },
    tempat: [[kata("nav.konfigurasi"), "settings"], [kata("nav.aktivasi"), "user-check"], [kata("keamanan.judul"), "shield"], [kata("emailuji.judul"), "mail"], [kata("sertifikat.kelola.judul"), "award"]], h1: "Konfigurasi", intro: "" },
];
for (const s of SAJIAN) if (!s.intro) s.intro = " ";

type Lembar = { kode: string; sajian: Sajian; lebar: number[]; ciut?: "ya" | "tidak"; laci?: boolean };
const SEMUA = [1280, 1279, 1100, 1024, 1023, 820, 390, 320];
const LEMBAR: Lembar[] = [
  { kode: "mengajar", sajian: SAJIAN[0], lebar: SEMUA },
  { kode: "mengajar-diciutkan", sajian: SAJIAN[0], lebar: [1280], ciut: "ya" },
  { kode: "mengajar-dilebarkan", sajian: SAJIAN[0], lebar: [1100], ciut: "tidak" },
  { kode: "mengajar-laci", sajian: SAJIAN[0], lebar: [390, 320], laci: true },
  { kode: "belajar", sajian: SAJIAN[1], lebar: [1280, 1100, 390] },
  { kode: "tunggal", sajian: SAJIAN[2], lebar: [1280, 1100, 390] },
  { kode: "mengelola", sajian: SAJIAN[3], lebar: [1280, 1100, 820, 390] },
  { kode: "mengelola-laci", sajian: SAJIAN[3], lebar: [390], laci: true },
  { kode: "pimpinan", sajian: SAJIAN[4], lebar: [1280, 1100] },
  { kode: "platform", sajian: SAJIAN[5], lebar: [1280, 1100, 390] },
];

const C1 = join(repo, "docs/coordination/ux/completion-4.0/C1"), E2 = join(repo, "docs/coordination/ux/completion-4.0/E2");
const GAYA = readFileSync(join(C1, "c1.css"), "utf8") + readFileSync(join(E2, "e2.css"), "utf8") + readFileSync(join(sini, "e1.css"), "utf8");
const RENDER = join(sini, "render"), JALAN = join(sini, "jalan");
mkdirSync(RENDER, { recursive: true }); mkdirSync(JALAN, { recursive: true });
const tokens = readFileSync(join(DS, "render/tokens.css"), "utf8").replace(/url\("\/(fonts\/[^"]+)"\)/g, (_, f) => `url("file://${repo}/public/${f}")`);
const bundleCss = readFileSync(join(DS, "project/components/bundle.css"), "utf8");
const bundleJs = readFileSync(join(DS, "project/components/bundle.js"), "utf8");
const req = createRequire(join(execSync("npm root -g").toString().trim(), "x.js"));
const { chromium } = req("playwright");
const axe = readFileSync(join(repo, "node_modules/axe-core/axe.min.js"), "utf8");
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const laporan: string[] = [];
let gagal = 0;
for (const l of LEMBAR) {
  const html = `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(l.sajian.judul)}</title><style>${tokens}</style><style>${bundleCss}</style><style>${GAYA}</style><script>${bundleJs}</script></head><body>${halaman(l.sajian, l.ciut)}<script>Pintar.siapkan();(function(){var b=document.querySelector("[data-shell-ciut]");if(!b)return;var sh=document.querySelector(".pds-shell"),hw=sh.parentNode.getBoundingClientRect().width;var rail=sh.getAttribute("data-ciut")==="ya"||(sh.getAttribute("data-ciut")!=="tidak"&&hw>=1024&&hw<1280);b.setAttribute("aria-label",rail?"Lebarkan navigasi":"Ciutkan navigasi");b.setAttribute("aria-expanded",rail?"false":"true");b.innerHTML='<i data-ikon="'+(rail?"panel-left-open":"panel-left-close")+'"></i>';Pintar.siapkan(b.parentNode);})();</script></body></html>`;
  writeFileSync(join(RENDER, `${l.kode}.html`), html);
  for (const w of l.lebar) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 760 } });
    const page = await ctx.newPage();
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    if (l.laci) { await page.click("[data-dialog-buka=e1-laci]"); await page.waitForTimeout(600); }
    await page.screenshot({ path: join(RENDER, `${l.kode}-${w}.png`), fullPage: !l.laci });
    const masalah: string[] = [];
    const u = await page.evaluate(`(() => {
      var nav = document.querySelector(".pds-shell .pds-nav"), bar = document.querySelector(".pds-bar");
      var tampak = function (e) { return e && e.offsetParent !== null && getComputedStyle(e).display !== "none" && e.getBoundingClientRect().width > 0; };
      var keluar = [].some.call(document.querySelectorAll(".pds-nav-keluar, .pds-bar .pds-btn-secondary"), function (e) { return tampak(e); });
      var railTanpaNama = [].filter.call(document.querySelectorAll(".pds-shell .pds-nav .pds-nav-item"), function (a) { var l = a.querySelector(".pds-nav-label"); return tampak(a) && !(l && l.textContent.trim() && getComputedStyle(l).display !== "none"); }).length;
      var labelDiganda = [].filter.call(document.querySelectorAll(".pds-shell .pds-nav a.pds-nav-item, .pds-shell .pds-nav button.pds-nav-item"), function (a) { return a.hasAttribute("aria-label"); }).length;
      var kecil = []; document.querySelectorAll("a, button").forEach(function (e) { if (!tampak(e)) return; var r = e.getBoundingClientRect(); if (r.height < 24 || r.width < 24) kecil.push(e.tagName + " «" + (e.getAttribute("aria-label") || e.textContent || "").trim().slice(0, 24) + "» " + Math.round(r.width) + "x" + Math.round(r.height)); });
      return { lebar: document.documentElement.scrollWidth, nav: tampak(nav) ? Math.round(nav.getBoundingClientRect().width) : 0, bar: tampak(bar), keluar: keluar, railTanpaNama: railTanpaNama, labelDiganda: labelDiganda, kecil: kecil,
        kini: document.querySelectorAll(".pds-shell .pds-nav [aria-current=page]").length, grup: document.querySelectorAll(".pds-nav-grup").length,
        pilih: [].filter.call(document.querySelectorAll(".pds-shell [data-konteks-pilih], dialog[open] [data-konteks-pilih]"), tampak).length,
        laci: !!document.querySelector("dialog[open]") };
    })()`) as { lebar: number; nav: number; bar: boolean; keluar: boolean; railTanpaNama: number; labelDiganda: number; kecil: string[]; kini: number; grup: number; pilih: number; laci: boolean };
    const rel = l.ciut === "ya" ? "rail" : l.ciut === "tidak" ? "penuh" : w >= 1280 ? "penuh" : w >= 1024 ? "rail" : "bar";
    if (u.lebar > w + 1) masalah.push(`sideways scroll ${u.lebar} at ${w}`);
    if (rel === "penuh" && !(u.nav >= 240 && u.nav <= 256)) masalah.push(`expanded navigation ${u.nav} px, not 248`);
    if (rel === "rail" && !(u.nav >= 64 && u.nav <= 80)) masalah.push(`rail ${u.nav} px, not 72`);
    if (rel === "bar" && (u.nav || !u.bar)) masalah.push("under 1024 px: the top bar, not the navigation");
    if (!u.keluar) masalah.push("«Keluar» not visible without opening anything (D-009)");
    if (rel === "rail" && u.railTanpaNama) masalah.push(`${u.railTanpaNama} rail items whose own text is removed from the accessibility tree (display: none)`);
    if (u.labelDiganda) masalah.push(`${u.labelDiganda} navigation links name themselves twice (aria-label)`);
    if (rel === "penuh") {
      await page.focus(".pds-shell .pds-nav .pds-nav-daftar .pds-nav-item");
      await page.keyboard.press("Shift+Tab"); await page.keyboard.press("Tab");
      const tipPenuh = await page.evaluate(`[].some.call(document.querySelectorAll(".pds-shell .pds-tooltip"), function (x) { return !x.hidden; })`) as boolean;
      if (tipPenuh) masalah.push("a tooltip shows in the expanded navigation");
    }
    if (rel === "rail") {
      await page.focus(".pds-shell .pds-nav .pds-nav-daftar .pds-nav-item");
      await page.keyboard.press("Shift+Tab"); await page.keyboard.press("Tab");
      const tip = await page.evaluate(`(function(){ var t = [].filter.call(document.querySelectorAll(".pds-shell .pds-tooltip"), function (x) { return !x.hidden; }); return t.length ? t[0].textContent : ""; })()`) as string;
      if (!tip) masalah.push("no tooltip on a focused rail item");
      const nama = await page.evaluate(`(function(){ var a = document.querySelector(".pds-shell .pds-nav .pds-nav-daftar .pds-nav-item"), l = a.querySelector(".pds-nav-label"); return l && getComputedStyle(l).display !== "none" && l.getBoundingClientRect().width <= 1 ? l.textContent.trim() : "VISIBLE"; })()`) as string;
      if (!nama || nama === "VISIBLE") masalah.push("a rail item's own text is not visually hidden");
    }
    if (u.kecil.length) masalah.push(`targets under 24 px: ${u.kecil.join(", ")}`);
    if (rel !== "bar" && u.kini !== 1) masalah.push(`${u.kini} current places, not 1`);
    if (u.grup) masalah.push("a group label under one context (L3)");
    const harapPilih = l.sajian.konteks.lain && (rel !== "bar" || u.laci) ? 1 : 0;
    if (u.pilih !== harapPilih) masalah.push(`chooser links ${u.pilih}, expected ${harapPilih}`);
    if (l.laci && !u.laci) masalah.push("the drawer did not open");
    const ciutKata = await page.evaluate(`(function(){ var b = document.querySelector(".pds-shell [data-shell-ciut]"); return b && b.offsetParent ? b.getAttribute("aria-label") : ""; })()`) as string;
    if (rel === "rail" && ciutKata !== "Lebarkan navigasi") masalah.push(`the rail's toggle says «${ciutKata}», not «Lebarkan navigasi»`);
    if (rel === "penuh" && ciutKata !== "Ciutkan navigasi") masalah.push(`the expanded toggle says «${ciutKata}», not «Ciutkan navigasi»`);
    await page.addScriptTag({ content: axe });
    const v = await page.evaluate(`axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } }).then(function (r) { return r.violations.map(function (v) { return v.id + " (" + v.nodes.length + ": " + v.nodes.slice(0,2).map(function(n){return n.target.join(" ");}).join(" | ") + ")"; }); })`) as string[];
    masalah.push(...v.map((x) => `axe ${x}`));
    if (!l.laci && (w === 1280 || w === 1100 || w === 390)) {
      await page.setContent(html, { waitUntil: "load" }); // a fresh page: the walk starts from the top
      await page.evaluate(() => document.fonts.ready);
      const tab: string[] = [];
      for (let i = 0; i < 16; i++) {
        await page.keyboard.press("Tab");
        const f = await page.evaluate(`(function () { var a = document.activeElement; if (!a || a === document.body) return ""; var cs = getComputedStyle(a); var cincin = (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) >= 2) || /rgb/.test(cs.boxShadow); var tip = document.querySelector(".pds-tooltip:not([hidden])"); return a.tagName.toLowerCase() + " «" + (a.getAttribute("aria-label") || a.textContent || "").replace(/\\s+/g, " ").trim().slice(0, 64) + "»" + (a.getAttribute("aria-current") ? " [current]" : "") + (tip && tip.offsetParent ? " tooltip «" + tip.textContent.trim().slice(0, 50) + "»" : "") + (cincin ? "" : "  NO RING"); })()`) as string;
        if (!f) break;
        tab.push(f);
        if (/NO RING/.test(f)) masalah.push(`no focus ring: ${f}`);
      }
      writeFileSync(join(JALAN, `${l.kode}-${w}.txt`), `${l.sajian.judul} at ${w} px (${rel}): the Tab order from the top of the page\n${tab.map((x, i) => `${String(i + 1).padStart(2)}. ${x}`).join("\n")}\n\nThe navigation's accessibility tree\n${await page.locator(rel === "bar" ? ".pds-bar" : ".pds-shell .pds-nav").ariaSnapshot()}\n`);
    }
    if (masalah.length) gagal++;
    laporan.push(`${masalah.length ? "FAIL" : "ok  "} ${l.kode} @${w} (${rel})${masalah.length ? "\n      " + masalah.join("\n      ") : ""}`);
    await ctx.close();
  }
}
await browser.close();
const n = LEMBAR.reduce((a, l) => a + l.lebar.length, 0);
const ringkas = `${n} renders across ${LEMBAR.length} states: ${gagal} with a failure\n\n${laporan.join("\n")}\n`;
writeFileSync(join(RENDER, "laporan.txt"), ringkas);
console.log(ringkas);
process.exit(gagal ? 1 : 0);
