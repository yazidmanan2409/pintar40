/**
 * THE KEYBOARD WALK of the composed journeys (11-validation.md §1). Review tooling, not product code.
 * Run from the repository root, after pratinjau.mts (it writes render/tokens.css):
 *
 *   npx tsx docs/coordination/ux/sistem-desain/alat/jalani.mts [J1Terbit ...]
 *
 * For each journey at 1280, 1024 and 390 px, twice (motion on, then reduced motion):
 *   - the walk, by keyboard alone: Tab to each step's action, press the key, and check that the next
 *     screen is there, that focus is on its heading and that the page title follows;
 *   - every screen's Tab stops in order, each with whether a focus ring shows, whether the sticky bar
 *     hides it, and the skip link: first, visible on focus, and it lands on the main region;
 *   - every animation that runs: under reduced motion none may; with motion on, none may be longer
 *     than 240 ms unless it is the working dot's pulse.
 * Each screen's accessibility tree is written beside the walk, for the screen-reader review. That
 * review is of the tree; it is not a screen reader.
 *
 * Writes render/jalan/<Journey>.txt and prints one line per journey, width and motion setting.
 */
import { createServer } from "node:http";
import { readFileSync, existsSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";

const sini = dirname(fileURLToPath(import.meta.url));
const akar = join(sini, "..");
const repo = join(akar, "..", "..", "..", "..");
const proyek = join(akar, "project");
const keluaran = join(akar, "render", "jalan");
mkdirSync(keluaran, { recursive: true });
const tokensCss = join(akar, "render", "tokens.css");
if (!existsSync(tokensCss)) throw new Error("render/tokens.css is missing: run pratinjau.mts first");

const req = createRequire(join(execSync("npm root -g").toString().trim(), "x.js"));
const { chromium } = req("playwright");

// ── the walks: what a person presses, screen by screen ────────────────────────
// tab: Tab forward until focus is on the selector (mundur: Shift+Tab); tekan: a key; ketik: type;
// isi: set a date field's value (its own keyboard entry follows the device's locale, so the walk sets it);
// harap: this screen is now shown, with focus on its heading; fokus: focus is here; terlihat /
// tersembunyi: shown or hidden; tunggu: ms. `di` limits a step to some widths.
type Langkah = { tab?: string; mundur?: boolean; tekan?: string; ketik?: string; isi?: [string, string]; harap?: string; fokus?: string; terlihat?: string; tersembunyi?: string; tunggu?: number; di?: number[]; catat?: string };
const LEBAR_PENUH = [1280, 1024];
const KECIL = [390];
const SELESAI = 1300; // an action's answer (900 ms) and its result line
const JALAN: Record<string, { mulai: string; langkah: Langkah[] }> = {
  J1Terbit: { mulai: "a1", langkah: [
    { tab: '[data-layar="a1"] a[data-ke="a2"]' }, { tekan: "Enter" }, { harap: "a2" },
    { tab: '[data-layar="a2"] button[data-aksi]' }, { tekan: "Enter" }, { tunggu: 100 }, { terlihat: '[data-layar="a2"] button[data-aksi][aria-busy="true"]', catat: "«Menerbitkan…» at once" },
    { tunggu: SELESAI }, { terlihat: '[data-layar="a2"] button[data-keadaan="selesai"]', catat: "«✓ Diterbitkan»" }, { terlihat: "#j1-a2-hasil" },
    { tab: '#j1-a2-hasil a[data-ke="a1b"]' }, { tekan: "Enter" }, { harap: "a1b" },
    { tab: '[data-layar="a1b"] a[data-ke="b1"]' }, { tekan: "Enter" }, { harap: "b1" },
    { tab: '[data-layar="b1"] a[data-ke="b2"]' }, { tekan: "Enter" }, { harap: "b2" },
    { tab: '[data-layar="b2"] a[data-ke="b3"]' }, { tekan: "Enter" }, { harap: "b3" },
    { tab: '[data-layar="b3"] button[data-aksi]' }, { tekan: "Enter" }, { tunggu: 100 }, { terlihat: '[data-layar="b3"] button[aria-busy="true"]', catat: "«Menyediakan…» at once" },
    { tunggu: SELESAI }, { terlihat: "#j1-b3-hasil" },
    { tab: '#j1-b3-hasil a[data-ke="b4"]' }, { tekan: "Enter" }, { harap: "b4" },
  ] },
  J2Kelas: { mulai: "a", langkah: [
    { tab: '[data-layar="a"] input[data-tabel-cari]' }, { ketik: "Ayu" }, { tunggu: 300 }, { terlihat: '[data-layar="a"] tr[data-cari="Ayu Lestari"]' }, { tersembunyi: '[data-layar="a"] tr[data-cari="Adi Pratama"]', catat: "the search filters as typed" },
    { tab: '[data-layar="a"] button[aria-controls="j2-menu-2"]' }, { tekan: "Enter" }, { tunggu: 300 }, { fokus: "#j2-menu-2 [role=menuitem]:first-child", catat: "the menu opens on its first item" },
    { tekan: "ArrowDown" }, { fokus: '#j2-menu-2 a[data-ke="b"]' }, { tekan: "Enter" }, { harap: "b" },
    { tab: '[data-layar="b"] button[data-aksi]' }, { tekan: "Enter" }, { tunggu: 100 }, { terlihat: '[data-layar="b"] button[aria-busy="true"]' }, { tunggu: SELESAI }, { terlihat: "#j2-b-hasil" },
    { tab: '#j2-b-hasil a[data-ke="a"]' }, { tekan: "Enter" }, { harap: "a" },
    // The one dialog: from the account menu (1280, 1024), or from the drawer (390).
    { tab: '[data-layar="a"] button.pds-identity', mundur: true, di: LEBAR_PENUH }, { tekan: "Enter", di: LEBAR_PENUH }, { tunggu: 300, di: LEBAR_PENUH },
    { tekan: "End", di: LEBAR_PENUH }, { fokus: '#j2-a-akun [data-dialog-buka="j2-semua"]', di: LEBAR_PENUH }, { tekan: "Enter", di: LEBAR_PENUH },
    { tab: '[data-layar="a"] button[data-dialog-buka="j2-a-laci"]', mundur: true, di: KECIL }, { tekan: "Enter", di: KECIL }, { tunggu: 300, di: KECIL },
    { tab: '#j2-a-laci button[data-dialog-buka="j2-semua"]', di: KECIL }, { tekan: "Enter", di: KECIL },
    { tunggu: 400 }, { terlihat: "#j2-semua[open]" }, { fokus: "#j2-semua [autofocus]", catat: "the dialog opens on «Batal»" },
    { tekan: "Escape" }, { tunggu: 300 }, { tersembunyi: "#j2-semua[open]" },
    { fokus: '[data-layar="a"] button.pds-identity', di: LEBAR_PENUH, catat: "Esc returns focus to the account button" },
    { fokus: '#j2-a-laci button[data-dialog-buka="j2-semua"]', di: KECIL, catat: "Esc returns focus to the drawer row" },
    { tekan: "Escape", di: KECIL }, { tunggu: 300, di: KECIL }, { fokus: '[data-layar="a"] button[data-dialog-buka="j2-a-laci"]', di: KECIL, catat: "Esc closes the drawer and returns focus to «Buka menu»" },
  ] },
  J3MengajarBelajar: { mulai: "a", langkah: [
    { tab: '[data-layar="a"] .pds-nav a[data-ke="b"]', di: LEBAR_PENUH }, { tekan: "Enter", di: LEBAR_PENUH },
    { tab: '[data-layar="a"] button[data-dialog-buka="j3-a-laci"]', di: KECIL }, { tekan: "Enter", di: KECIL }, { tunggu: 300, di: KECIL },
    { tab: '#j3-a-laci a[data-ke="b"]', di: KECIL }, { tekan: "Enter", di: KECIL },
    { harap: "b" },
    { tab: '[data-layar="b"] a[data-ke="c"]' }, { tekan: "Enter" }, { harap: "c" },
    { tab: '[data-layar="c"] .pds-nav a[data-ke="a"]', mundur: true, di: LEBAR_PENUH }, { tekan: "Enter", di: LEBAR_PENUH },
    { tab: '[data-layar="c"] button[data-dialog-buka="j3-c-laci"]', mundur: true, di: KECIL }, { tekan: "Enter", di: KECIL }, { tunggu: 300, di: KECIL },
    { tab: '#j3-c-laci a[data-ke="a"]', di: KECIL }, { tekan: "Enter", di: KECIL },
    { harap: "a" },
  ] },
  J4Murid: { mulai: "a", langkah: [
    { tab: '[data-layar="a"] a[data-ke="b"]' }, { tekan: "Enter" }, { harap: "b" },
    { tab: '[data-layar="b"] a[data-ke="c"]' }, { tekan: "Enter" }, { harap: "c" },
    { tab: '[data-layar="c"] input[name="j4-jawab"]:checked' }, { tekan: "ArrowDown" }, { fokus: '[data-layar="c"] input[name="j4-jawab"]:checked', catat: "arrows move the choice" },
    { tab: '[data-layar="c"] button[data-aksi]' }, { tekan: "Enter" }, { tunggu: SELESAI + 100 }, { terlihat: "#j4-c-hasil" },
    { tab: '[data-layar="c"] [data-ke="d"]' }, { tekan: "Enter" }, { harap: "d" },
    { tab: '[data-layar="d"] [data-ke="a"]' }, { tekan: "Enter" }, { harap: "a" },
  ] },
  J5Jendela: { mulai: "a", langkah: [
    { tab: "#j5-a-kirim" }, { tekan: "Enter" }, { tunggu: 200 }, { terlihat: "#j5-a-sampai-galat" }, { fokus: "#j5-a-sampai", catat: "the mistake is told under its field and focus goes there" },
    { isi: ["#j5-a-sampai", "2026-10-20"] }, { tunggu: 200 }, { tersembunyi: "#j5-a-sampai-galat", catat: "correcting the date clears it" },
    { tab: "#j5-a-kirim" }, { tekan: "Enter" }, { tunggu: 100 }, { terlihat: '#j5-a-kirim[aria-busy="true"]' }, { tunggu: SELESAI }, { terlihat: "#j5-a-hasil" },
  ] },
  J6Peragaan: { mulai: "a", langkah: [
    { tab: '[data-layar="a"] a[data-ke="b"]' }, { tekan: "Enter" }, { harap: "b" },
    { tab: "#j6-b-keluar", mundur: true }, { tekan: "Enter" }, { harap: "c" },
    { tab: '[data-layar="c"] a[data-ke="a"]' }, { tekan: "Enter" }, { harap: "a" },
  ] },
  J7Kunci: { mulai: "a", langkah: [
    { tab: '[data-layar="a"] button[data-ke="b"]' }, { tekan: "Enter" }, { harap: "b" },
    { tab: '[data-layar="b"] [data-ke="a"]', mundur: true, catat: "«Saya masih di sini» is reachable" },
    { tab: '[data-layar="b"] button[data-ke="c"]' }, { tekan: "Enter" }, { harap: "c" },
    { tab: "#j7-c-pin" }, { ketik: "4721" },
    { tab: '[data-layar="c"] [data-ke="d"]' }, { tekan: "Enter" }, { harap: "d" }, { terlihat: "#j7-d-galat" },
    { tab: '[data-layar="d"] [data-ke="a"]' }, { tekan: "Enter" }, { harap: "a" },
  ] },
};

// ── a preview, framed as the harness frames it ────────────────────────────────
const halaman = new Map<string, string>();
const tipe: Record<string, string> = { ".css": "text/css", ".js": "text/javascript", ".woff2": "font/woff2", ".png": "image/png", ".svg": "image/svg+xml" };
const server = createServer((r, w) => {
  const url = decodeURIComponent((r.url ?? "/").split("?")[0]);
  if (halaman.has(url)) { w.writeHead(200, { "content-type": "text/html; charset=utf-8" }); w.end(halaman.get(url)); return; }
  const berkas = url === "/tokens.css" ? tokensCss : url.startsWith("/fonts/") ? join(repo, "public", "fonts", url.slice(7)) : join(proyek, url);
  if (!berkas.startsWith(repo) || !existsSync(berkas)) { w.writeHead(404); w.end(); return; }
  w.writeHead(200, { "content-type": tipe[extname(berkas)] ?? "application/octet-stream" });
  w.end(readFileSync(berkas));
});
await new Promise<void>((ok) => server.listen(0, "127.0.0.1", () => ok()));
const port = (server.address() as { port: number }).port;

const dipilih = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const semua = Object.keys(JALAN).filter((n) => dipilih.length === 0 || dipilih.includes(n))
  .filter((n) => readdirSync(join(proyek, "components")).includes(n));
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
let gagalTotal = 0;
const ringkas: string[] = [];

// The few parts of Playwright's Page this walk uses (Playwright is loaded at run time, untyped).
type Page = {
  evaluate<R, A>(fn: (arg: A) => R | Promise<R>, arg: A): Promise<R>;
  evaluate<R>(fn: () => R | Promise<R>): Promise<R>;
  focus(selector: string): Promise<void>;
  keyboard: { press(key: string): Promise<void> };
  waitForTimeout(ms: number): Promise<void>;
};
type JendelaAnim = Window & { __anim?: string[] };
/** Who has focus, in words: role and name, as a reader would hear it. */
const siapa = (page: Page) => page.evaluate(() => {
  const e = document.activeElement as HTMLElement | null;
  if (!e || e === document.body) return "(body)";
  const nama = (e.getAttribute("aria-label") || (e as HTMLInputElement).labels?.[0]?.textContent || e.textContent || "").replace(/\s+/g, " ").trim().slice(0, 48);
  return `${e.tagName.toLowerCase()}${e.getAttribute("role") ? `[${e.getAttribute("role")}]` : ""}${(e as HTMLInputElement).type && e.tagName === "INPUT" ? `[${(e as HTMLInputElement).type}]` : ""} «${nama}»`;
});
const cocok = (page: Page, sel: string) => page.evaluate((s: string) => !!document.activeElement && (document.activeElement as Element).matches(s), sel);
const terlihat = (page: Page, sel: string) => page.evaluate((s: string) => {
  const el = document.querySelector(s) as HTMLElement | null;
  return !!el && !el.closest("[hidden]") && el.getClientRects().length > 0;
}, sel);

/** The Tab stops of the screen now shown, from the review bar's last control to where focus leaves the screen. */
async function stops(page: Page, id: string): Promise<{ baris: string[]; masalah: string[] }> {
  const baris: string[] = [];
  const masalah: string[] = [];
  await page.focus("[data-jalan-ulang]");
  for (let i = 0; i < 160; i++) {
    await page.keyboard.press("Tab");
    const info = await page.evaluate((lid: string) => {
      const e = document.activeElement as HTMLElement | null;
      const layar = document.querySelector(`[data-layar="${lid}"]`)!;
      if (!e || !layar.contains(e)) return null;
      const cs = getComputedStyle(e);
      // A native date or time field's calendar button is a stop inside the browser's own control: the
      // browser draws its own ring around the icon there, and no page style reaches it.
      const asli = /^(date|time|datetime-local)$/.test((e as HTMLInputElement).type) && !e.matches(":focus");
      const cincin = asli ? "the browser's own ring (the calendar button)" : (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) >= 2) || /rgb/.test(cs.boxShadow) ? "ring" : "NO RING";
      // A label's own ring (the seg, a choice) counts for its hidden input.
      const lab = e.closest("label");
      const span = lab?.querySelector("input + span") as HTMLElement | null;
      const cincinLabel = span && (getComputedStyle(span).outlineStyle !== "none") ? "ring" : "";
      const r = e.getBoundingClientRect();
      const bar = [...document.querySelectorAll(".pds-bar, .pds-top")].find((b) => getComputedStyle(b).display !== "none" && getComputedStyle(b).position === "sticky" && layar.contains(b));
      const bawahBar = bar ? bar.getBoundingClientRect().bottom : 0;
      const atas = document.elementFromPoint(r.left + Math.min(r.width / 2, 20), r.top + Math.min(r.height / 2, 12));
      const tertutup = bar && !bar.contains(e) && r.top < bawahBar - 1 && atas && bar.contains(atas) && !e.contains(atas) ? "HIDDEN BY THE BAR" : "";
      const luar = r.bottom < 0 || r.top > innerHeight ? "OFF SCREEN" : "";
      const nama = (e.getAttribute("aria-label") || (e as HTMLInputElement).labels?.[0]?.textContent || e.textContent || "").replace(/\s+/g, " ").trim().slice(0, 48);
      return { nama: `${e.tagName.toLowerCase()}${e.getAttribute("role") ? `[${e.getAttribute("role")}]` : ""} «${nama}»`, cincin: cincinLabel || cincin, tertutup, luar, lewati: e.classList.contains("pds-lewati"), tampak: r.top >= 0 && r.bottom <= innerHeight + 1 };
    }, id);
    if (!info) break;
    baris.push(`${String(baris.length + 1).padStart(2)}. ${info.nama}  ${info.cincin}${info.tertutup ? "  " + info.tertutup : ""}${info.luar ? "  " + info.luar : ""}`);
    if (baris.length === 1 && !info.lewati) masalah.push(`${id}: the first stop is not the skip link`);
    if (baris.length === 1 && info.lewati && !info.tampak) masalah.push(`${id}: the skip link does not show on focus`);
    if (info.cincin === "NO RING") masalah.push(`${id}: no focus ring on ${info.nama}`);
    if (info.tertutup) masalah.push(`${id}: ${info.nama} is under the sticky bar`);
  }
  // The skip link lands on the main region.
  await page.focus("[data-jalan-ulang]");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(80);
  const tujuan = await page.evaluate(() => (document.activeElement as HTMLElement)?.tagName.toLowerCase());
  if (tujuan !== "main") masalah.push(`${id}: the skip link lands on ${tujuan}, not main`);
  return { baris, masalah };
}

for (const nama of semua) {
  const isi = readFileSync(join(proyek, "components", nama, "preview.html"), "utf8");
  halaman.set(`/${nama}.html`, `<!doctype html><html lang="id" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${nama}</title>
<link rel="stylesheet" href="/tokens.css"><link rel="stylesheet" href="/components/bundle.css"><script src="/components/bundle.js"></script></head><body>${isi}</body></html>`);
  const log: string[] = [`${nama}: the keyboard walk (alat/jalani.mts). Chromium, locale id-ID. Focus after a screen change is the walk's runner (the screen's heading); the product's own focus rules are in the journey's README.`];
  const layarId: string[] = [...isi.matchAll(/data-layar="([^"]+)"/g)].map((m) => m[1]);
  for (const gerak of ["no-preference", "reduce"] as const) {
    for (const w of [1280, 1024, 390]) {
      const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, locale: "id-ID", reducedMotion: gerak });
      // Every animation and transition that starts, with its length, on every load of the page.
      // (A string, so the TypeScript runner adds no helpers to it.)
      await ctx.addInitScript(`
        window.__anim = [];
        var nama = function (el) { return (typeof el.className === "string" && el.className.split(" ")[0]) || el.tagName.toLowerCase(); };
        document.addEventListener("animationstart", function (e) { window.__anim.push(e.animationName + " " + getComputedStyle(e.target).animationDuration + " on " + nama(e.target)); }, true);
        document.addEventListener("transitionrun", function (e) { var d = getComputedStyle(e.target).transitionDuration; if (!/^0s(, 0s)*$/.test(d)) window.__anim.push("transition " + e.propertyName + " " + d + " on " + nama(e.target)); }, true);
      `);
      const page = await ctx.newPage();
      const galat: string[] = [];
      page.on("pageerror", (e: Error) => galat.push(`script: ${e.message}`));
      await page.goto(`http://127.0.0.1:${port}/${nama}.html`, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      const masalah: string[] = [];
      const jejak: string[] = [];
      const kepala = `── ${w} px · motion ${gerak === "reduce" ? "reduced" : "on"}`;
      // The Tab stops of every screen (motion on only: they do not change with motion).
      if (gerak === "no-preference") {
        log.push(`\n${kepala}: Tab stops, screen by screen`);
        for (const id of layarId) {
          await page.click(`[data-lompat="${id}"]`);
          await page.waitForTimeout(120);
          const s = await stops(page, id);
          log.push(`[${id}]`, ...s.baris.map((b) => "  " + b));
          masalah.push(...s.masalah);
          if (w !== 1024) {
            const pohon = await page.locator(`[data-layar="${id}"]`).ariaSnapshot();
            writeFileSync(join(keluaran, `${nama}--${id}@${w}.aria.txt`), pohon + "\n");
          }
        }
        await page.reload({ waitUntil: "networkidle" });
        await page.evaluate(() => { (window as JendelaAnim).__anim = []; });
      }
      // The walk itself, from the review bar's last control.
      await page.focus("[data-jalan-ulang]");
      let tabs = 0;
      for (const l of JALAN[nama].langkah) {
        if (l.di && !l.di.includes(w)) continue;
        if (l.tab) {
          let n = 0;
          while (!(await cocok(page, l.tab)) && n < 140) { await page.keyboard.press(l.mundur ? "Shift+Tab" : "Tab"); n++; }
          tabs += n;
          if (!(await cocok(page, l.tab))) { masalah.push(`walk: could not reach ${l.tab} by ${l.mundur ? "Shift+Tab" : "Tab"}`); break; }
          jejak.push(`${l.mundur ? "Shift+Tab" : "Tab"} ×${n} → ${await siapa(page)}${l.catat ? ` (${l.catat})` : ""}`);
        }
        if (l.tekan) { await page.keyboard.press(l.tekan); jejak.push(`${l.tekan}`); }
        if (l.ketik) { await page.keyboard.type(l.ketik); jejak.push(`type «${l.ketik}»`); }
        if (l.isi) { await page.fill(l.isi[0], l.isi[1]); jejak.push(`set ${l.isi[0]} to ${l.isi[1]}`); }
        if (l.tunggu) await page.waitForTimeout(l.tunggu);
        if (l.harap) {
          await page.waitForSelector(`[data-layar="${l.harap}"]:not([hidden])`, { timeout: 3000 }).catch(() => {});
          const ok = await page.evaluate((id: string) => {
            const s = document.querySelector(`[data-layar="${id}"]`) as HTMLElement;
            const h = s?.querySelector("h1");
            return { tampil: !!s && !s.hidden, fokus: !!h && document.activeElement === h, judul: document.title === s?.getAttribute("data-judul-hal"), h1: h?.textContent?.trim() };
          }, l.harap);
          if (!ok.tampil) { masalah.push(`walk: screen ${l.harap} did not come`); break; }
          if (!ok.fokus) masalah.push(`walk: focus is not on ${l.harap}'s heading`);
          if (!ok.judul) masalah.push(`walk: the title does not follow ${l.harap}`);
          jejak.push(`→ screen ${l.harap}: focus on «${ok.h1}», title «${await page.title()}»`);
        }
        if (l.fokus && !l.tab) {
          const ok = await cocok(page, l.fokus);
          if (!ok) masalah.push(`walk: focus is on ${await siapa(page)}, not ${l.fokus}`);
          jejak.push(`focus ${ok ? "ok" : "WRONG"}: ${await siapa(page)}${l.catat ? ` (${l.catat})` : ""}`);
        }
        if (l.terlihat) { const ok = await terlihat(page, l.terlihat); if (!ok) masalah.push(`walk: ${l.terlihat} is not shown`); jejak.push(`${ok ? "shown" : "NOT SHOWN"}: ${l.terlihat}${l.catat ? ` (${l.catat})` : ""}`); }
        if (l.tersembunyi) { const ok = !(await terlihat(page, l.tersembunyi)); if (!ok) masalah.push(`walk: ${l.tersembunyi} is still shown`); jejak.push(`${ok ? "hidden" : "STILL SHOWN"}: ${l.tersembunyi}${l.catat ? ` (${l.catat})` : ""}`); }
      }
      const anim: string[] = await page.evaluate(() => [...new Set((window as JendelaAnim).__anim ?? [])]);
      for (const a of anim) {
        const ms = Math.max(...[...a.matchAll(/([\d.]+)(m?s)/g)].map((m) => parseFloat(m[1]) * (m[2] === "s" ? 1000 : 1)));
        if (gerak === "reduce" && ms > 0) masalah.push(`motion under reduced motion: ${a}`);
        if (gerak === "no-preference" && ms > 240 && !/denyut/.test(a)) masalah.push(`motion longer than 240 ms: ${a}`);
      }
      masalah.push(...galat);
      log.push(`\n${kepala}: the walk (${tabs} Tab presses in all)`, ...jejak.map((j) => "  " + j), `  motion seen: ${anim.length ? anim.join("; ") : "none"}`, `  ${masalah.length ? "FINDINGS:\n    " + masalah.join("\n    ") : "no finding"}`);
      if (masalah.length) gagalTotal++;
      ringkas.push(`${masalah.length ? "FIND" : "ok  "} ${nama} @${w} motion ${gerak === "reduce" ? "reduced" : "on"} · ${tabs} Tabs${masalah.length ? " · " + masalah.length + " finding(s)" : ""}`);
      await ctx.close();
    }
  }
  writeFileSync(join(keluaran, `${nama}.txt`), log.join("\n") + "\n");
}
await browser.close();
server.close();
console.log(`${ringkas.join("\n")}\n${semua.length} journeys, ${gagalTotal} runs with a finding`);
process.exit(gagalTotal ? 1 : 0);
