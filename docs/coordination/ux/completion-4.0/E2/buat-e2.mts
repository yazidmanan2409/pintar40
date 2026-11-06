/**
 * E2 · W3.16 — the `/` chooser, the context control, and the placement of the six
 * expressions of D-132(m). Design specimen, not application code. Run from the repository root:
 *
 *   npx tsx docs/coordination/ux/completion-4.0/E2/buat-e2.mts
 *
 * Words: the copy table at 0b19707. The six expressions are Dr Gladys's (G1): drawn as
 * labelled slots naming their semantic key, never words. People and places are invented.
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
const kerja = mkdtempSync(join(tmpdir(), "e2-"));
for (const f of ["hle.ts", "tanggal.ts"]) writeFileSync(join(kerja, f), execSync(`git show 0b19707:src/lib/${f}`, { cwd: repo }));
const hle = await import(join(kerja, "hle.ts"));
const kata = (k: string, persona = "public") => {
  const v: string = hle.t(k, persona, { locale: "id" });
  if (!v || v === k || v === "—") throw new Error(`no words for ${k}`);
  return v;
};
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const ikon = (n: string) => `<i data-ikon="${n}"></i>`;
const slotMerek = `<span class="pds-merek">PINTAR</span>`;
/** G1 (D-132(m)): a labelled slot naming the semantic key. Never words. */
const slot = (k: string) => `<span class="c1-slot-kata e2-slot" data-slot="G1" data-kunci="${k}">[G1 · ${k}]</span>`;

// ── the chooser ─────────────────────────────────────────────────────────────
type Pintu = { tujuan: "BELAJAR" | "MENGAJAR" | "MENGELOLA" | "PIMPINAN"; tempat?: string; kini?: boolean };
const KATA_TUJUAN = { BELAJAR: "entry.learner", MENGAJAR: "entry.educator", MENGELOLA: "entry.staff", PIMPINAN: "entry.pimpinan" } as const;
type Pemilih = { kode: string; judul: string; nama: string; pintu: Pintu[]; alasan?: string; tanya?: boolean };
function pemilih(p: Pemilih): string {
  // the reason the person was sent here (role="status"); with no words yet (G1) the build draws nothing here
  const alasan = p.alasan && !p.tanya ? `<div class="pds-alert pds-alert-info e2-alasan" role="status">${ikon("info")}<p>${slot(p.alasan)}</p></div>` : "";
  const tanya = p.tanya ? `<h2 class="e2-tanya" id="e2-tanya">${slot("context.choose_place")}</h2>` : "";
  const pintu = p.pintu.length === 0 ? `<div class="pds-empty"><p>${kata("entry.kosong")}</p></div>`
    : `<ul class="e2-pintu"${p.tanya ? ' aria-labelledby="e2-tanya"' : ` aria-label="${esc(kata("entry.title"))}"`} data-pemilih="konteks">${p.pintu.map((d) => `<li><form><button type="submit" class="e2-pintu-tombol${d.kini ? " e2-kini" : ""}"${d.kini ? ' aria-current="true"' : ""}>
      <span class="e2-pintu-isi"><strong>${kata(KATA_TUJUAN[d.tujuan])}</strong>${d.tempat ? `<small>${esc(d.tempat)}</small>` : ""}</span>${d.kini ? ikon("check") : ikon("chevron-right")}</button></form></li>`).join("")}</ul>`;
  return `<div class="pds e2"><header class="e2-kepala">${slotMerek}<p class="e2-sesi">${kata("sesi.sebagai")} <strong>${esc(p.nama)}</strong> <button type="button" class="pds-btn pds-btn-secondary">${ikon("log-out")}${kata("sesi.keluar")}</button></p></header>
  <main class="e2-isi" id="isi" tabindex="-1"><h1 class="pds-title">${kata("entry.title")}</h1><p class="pds-intro">${kata("entry.halo")}, ${esc(p.nama.split(" ")[0])}.</p>${alasan}${tanya}${pintu}</main></div>`;
}

// ── the context control, in the staff shell ─────────────────────────────────
type Shell = { kode: string; judul: string; tujuan: "MENGELOLA" | "MENGAJAR"; tempat: string; lain: boolean; isi: string; nama: string; peran: string };
function shell(s: Shell): string {
  const tempatNav: Array<[string, string]> = s.tujuan === "MENGELOLA"
    ? [[kata("nav.konfigurasi", "staff"), "settings"], [kata("nav.pendataan", "staff"), "file-spreadsheet"], [kata("nav.aktivasi", "staff"), "user-check"], [kata("nav.studio", "staff"), "square-pen"]]
    : [[kata("nav.kelas", "staff"), "users"], [kata("nav.studio", "staff"), "square-pen"]];
  // the purpose's short name: «Mengajar» and «Belajar» exist; Mengelola's is G1's context.manage_label
  const tujuan = s.tujuan === "MENGELOLA" ? slot("context.manage_label") : kata("nav.kelas", "staff");
  const konteks = `<div class="e2-konteks" data-konteks-tempat=""><span class="e2-konteks-tujuan">${tujuan}</span><strong class="e2-konteks-tempat">${esc(s.tempat)}</strong>${s.lain ? `<a href="#" class="e2-konteks-pilih" data-konteks-pilih="">${kata("entry.title")}${ikon("chevron-right")}</a>` : ""}</div>`;
  return `<div class="pds pds-jalan e2s">
  <section class="pds-lewati-induk" data-shell data-shell-statis aria-label="${esc(s.judul)}">
  <a class="pds-lewati" href="#e2-isi">Langsung ke isi</a>
  <div class="pds-shell-host"><div class="pds-shell">
    <nav class="pds-nav" aria-label="${kata("nav.tempat", "staff")}"><div class="pds-nav-kepala">${slotMerek}</div>${konteks}
      <ul class="pds-nav-daftar">${tempatNav.map(([t, i], n) => `<li><a href="#" class="pds-nav-item"${n === 0 ? ' aria-current="page"' : ""}>${ikon(i)}<span class="pds-nav-label">${t}</span></a></li>`).join("")}</ul>
      <div class="pds-nav-bawah"><div class="pds-identity" style="cursor:default"><span class="pds-avatar" aria-hidden="true">${s.nama.split(" ").map((x) => x[0]).join("")}</span><div><strong>${s.nama}</strong><small>${s.peran}</small></div></div>
      <button type="button" class="pds-nav-item pds-nav-keluar">${ikon("log-out")}<span class="pds-nav-label">${kata("sesi.keluar", "staff")}</span></button></div></nav>
    <div class="pds-main">
      <header class="pds-bar">${slotMerek}<span class="e2-bar-konteks" data-konteks-tempat=""><span class="e2-konteks-tujuan">${tujuan}</span> <strong>${esc(s.tempat)}</strong></span><button type="button" class="pds-btn pds-btn-secondary">${kata("sesi.keluar", "staff")}</button><button type="button" class="pds-btn pds-btn-icon" aria-label="${kata("nav.menu", "staff")}">${ikon("menu")}</button></header>
      <main class="pds-main-isi" id="e2-isi" tabindex="-1">${s.isi}</main>
    </div></div></div></section></div>`;
}
const isiKonfigurasi = (tolakSekolah: boolean) => `<div class="pds-pagehead"><div><h1 class="pds-title">${kata("config.title", "staff")}</h1><p class="pds-help">${kata("config.struktur.sekolah", "staff")}: <strong>SMP Cahaya Kaliandra</strong></p></div></div>
  <section class="pds-section" aria-labelledby="e2-beri"><h2 id="e2-beri">${kata("config.action.grant", "staff")}</h2>
  <form class="pds-panel e2-form"><div class="pds-field"><label class="pds-label" for="o">${kata("config.label.person", "staff")}</label><span class="pds-select"><select id="o"><option>Indah Permata</option></select>${ikon("chevron-down")}</span></div>
  <div class="pds-actions"><button type="submit" class="pds-btn pds-btn-primary">${kata("config.action.grant", "staff")}</button></div>
  ${tolakSekolah ? `<p class="pds-result pds-result-blocked" role="status">${ikon("circle-alert")}<span>${slot("context.other_school")}</span></p>` : ""}</form></section>`;

type Lembar = { kode: string; judul: string; html: string };
const S = "SMP Cahaya Kaliandra", T = "SD Tunas Mandiri";
const LEMBAR: Lembar[] = [
  { kode: "pilih", judul: "/ · a Guru who also learns (two doors, the current one marked)", html: pemilih({ kode: "", judul: "", nama: "Citra Lestari", pintu: [{ tujuan: "BELAJAR" }, { tujuan: "MENGAJAR", tempat: S, kini: true }] }) },
  { kode: "pilih-banyak", judul: "/ · a Kepala departemen who teaches and leads in two schools", nama: "", html: pemilih({ kode: "", judul: "", nama: "Eko Prasetyo", pintu: [{ tujuan: "MENGAJAR", tempat: S }, { tujuan: "MENGAJAR", tempat: T }, { tujuan: "PIMPINAN", tempat: S, kini: true }, { tujuan: "BELAJAR" }] }) } as Lembar,
  { kode: "pilih-platform", judul: "/ · Admin platform («Seluruh platform» and each school)", html: pemilih({ kode: "", judul: "", nama: "Arif Nugraha", pintu: [{ tujuan: "MENGELOLA", tempat: kata("config.pemeliharaan.platform", "staff"), kini: true }, { tujuan: "MENGELOLA", tempat: "SD Tunas Mandiri" }, { tujuan: "MENGELOLA", tempat: S }, { tujuan: "MENGELOLA", tempat: "SMA Harapan Bangsa" }] }) },
  { kode: "tidak-dipegang", judul: "/ · not held (context.not_held)", html: pemilih({ kode: "", judul: "", nama: "Citra Lestari", alasan: "context.not_held", pintu: [{ tujuan: "BELAJAR" }, { tujuan: "MENGAJAR", tempat: S, kini: true }] }) },
  { kode: "lain", judul: "/ · the page belongs to another context (context.other_context)", html: pemilih({ kode: "", judul: "", nama: "Eko Prasetyo", alasan: "context.other_context", pintu: [{ tujuan: "PIMPINAN", tempat: S }] }) },
  { kode: "tidak-berlaku", judul: "/ · the context is no longer held (context.invalid)", html: pemilih({ kode: "", judul: "", nama: "Citra Lestari", alasan: "context.invalid", pintu: [{ tujuan: "BELAJAR" }, { tujuan: "MENGAJAR", tempat: T }] }) },
  { kode: "pilih-tempat", judul: "/ · choose a place (context.choose_place)", html: pemilih({ kode: "", judul: "", nama: "Eko Prasetyo", tanya: true, pintu: [{ tujuan: "MENGAJAR", tempat: S }, { tujuan: "MENGAJAR", tempat: T }] }) },
  { kode: "kosong", judul: "/ · holding no place", html: pemilih({ kode: "", judul: "", nama: "Bagas Saputra", pintu: [] }) },
  { kode: "shell-mengelola", judul: "The context control · Mengelola (context.manage_label)", html: shell({ kode: "", judul: "Konfigurasi", tujuan: "MENGELOLA", tempat: S, lain: true, isi: isiKonfigurasi(false), nama: "Dewi Saraswati", peran: `Admin sekolah · ${S}` }) },
  { kode: "shell-mengajar", judul: "The context control · Mengajar, one context only (no chooser link)", html: shell({ kode: "", judul: "Mengajar", tujuan: "MENGAJAR", tempat: S, lain: false, isi: `<div class="pds-pagehead"><div><h1 class="pds-title">${kata("nav.kelas", "staff")}</h1></div></div>`, nama: "Fitri Handayani", peran: `Guru · ${S}` }) },
  { kode: "lain-sekolah", judul: "An action refused: its target is outside the context (context.other_school)", html: shell({ kode: "", judul: "Konfigurasi", tujuan: "MENGELOLA", tempat: S, lain: true, isi: isiKonfigurasi(true), nama: "Dewi Saraswati", peran: `Admin sekolah · ${S}` }) },
];

// ── render and check ─────────────────────────────────────────────────────────
const C1 = join(repo, "docs/coordination/ux/completion-4.0/C1");
const GAYA = readFileSync(join(C1, "c1.css"), "utf8") + readFileSync(join(sini, "e2.css"), "utf8");
const RENDER = join(sini, "render"), JALAN = join(sini, "jalan");
mkdirSync(RENDER, { recursive: true }); mkdirSync(JALAN, { recursive: true });
const tokens = readFileSync(join(DS, "render/tokens.css"), "utf8").replace(/url\("\/(fonts\/[^"]+)"\)/g, (_, f) => `url("file://${repo}/public/${f}")`);
const bundleCss = readFileSync(join(DS, "project/components/bundle.css"), "utf8");
const bundleJs = readFileSync(join(DS, "project/components/bundle.js"), "utf8");
const req = createRequire(join(execSync("npm root -g").toString().trim(), "x.js"));
const { chromium } = req("playwright");
const axe = readFileSync(join(repo, "node_modules/axe-core/axe.min.js"), "utf8");
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const harapSlot: Record<string, string[]> = {
  "tidak-dipegang": ["context.not_held"], lain: ["context.other_context"], "tidak-berlaku": ["context.invalid"], "pilih-tempat": ["context.choose_place"],
  "shell-mengelola": ["context.manage_label", "context.manage_label"], "lain-sekolah": ["context.manage_label", "context.manage_label", "context.other_school"],
};
const laporan: string[] = [];
let gagal = 0;
for (const l of LEMBAR) {
  const html = `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(l.judul)}</title><style>${tokens}</style><style>${bundleCss}</style><style>${GAYA}</style><script>${bundleJs}</script></head><body>${l.html}<script>Pintar.siapkan();</script></body></html>`;
  writeFileSync(join(RENDER, `${l.kode}.html`), html);
  for (const w of [1280, 820, 390, 320]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
    const page = await ctx.newPage();
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: join(RENDER, `${l.kode}-${w}.png`), fullPage: true });
    const masalah: string[] = [];
    const ukur = await page.evaluate(`(() => {
      var kecil = [];
      document.querySelectorAll("a, button, select").forEach(function (e) { var r = e.getBoundingClientRect(); if (!r.width) return; if (r.height < 24 || r.width < 24) kecil.push(e.tagName + " " + Math.round(r.width) + "x" + Math.round(r.height)); });
      var pintu = [].map.call(document.querySelectorAll(".e2-pintu-tombol"), function (b) { return b.getBoundingClientRect().height; });
      return { lebar: document.documentElement.scrollWidth, kecil: kecil, pintuKecil: pintu.filter(function (h) { return h < 56; }).length,
        kini: document.querySelectorAll(".e2-pintu-tombol[aria-current]").length, kiniTanda: [].every.call(document.querySelectorAll(".e2-pintu-tombol[aria-current]"), function (b) { return b.querySelector("[data-ikon=check], .pds-ikon"); }),
        slot: [].map.call(document.querySelectorAll("[data-slot=G1]"), function (s) { return s.getAttribute("data-kunci"); }) };
    })()`) as { lebar: number; kecil: string[]; pintuKecil: number; kini: number; kiniTanda: boolean; slot: string[] };
    if (ukur.lebar > w + 1) masalah.push(`sideways scroll ${ukur.lebar} at ${w}`);
    if (ukur.kecil.length) masalah.push(`targets under 24 px: ${ukur.kecil.join(", ")}`);
    if (ukur.pintuKecil) masalah.push(`a door under 56 px tall`);
    if (ukur.kini > 1) masalah.push("more than one current door");
    if (!ukur.kiniTanda) masalah.push("the current door is marked by weight alone");
    const harap = (harapSlot[l.kode] ?? []).slice().sort().join(",");
    if (ukur.slot.slice().sort().join(",") !== harap) masalah.push(`G1 slots ${ukur.slot.join(",") || "none"}, expected ${harap || "none"}`);
    await page.addScriptTag({ content: axe });
    const pelanggaran = await page.evaluate(`axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } }).then(function (r) { return r.violations.map(function (v) { return v.id + " (" + v.nodes.length + ": " + v.nodes.slice(0,2).map(function(n){return n.target.join(" ");}).join(" | ") + ")"; }); })`) as string[];
    masalah.push(...pelanggaran.map((v) => `axe ${v}`));
    if (w === 1280 || w === 320) {
      const tab: string[] = [];
      for (let i = 0; i < 20; i++) {
        await page.keyboard.press("Tab");
        const f = await page.evaluate(`(function () { var a = document.activeElement; if (!a || a === document.body) return ""; var cs = getComputedStyle(a); var cincin = (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) >= 2) || /rgb/.test(cs.boxShadow); return a.tagName.toLowerCase() + " «" + (a.getAttribute("aria-label") || a.textContent || "").replace(/\\s+/g, " ").trim().slice(0, 60) + "»" + (a.getAttribute("aria-current") ? " [current]" : "") + (cincin ? "" : "  NO RING"); })()`) as string;
        if (!f) break;
        tab.push(f);
        if (/NO RING/.test(f)) masalah.push(`no focus ring: ${f}`);
      }
      writeFileSync(join(JALAN, `${l.kode}-${w}.txt`), `${l.judul} at ${w} px: the Tab order from the top of the page\n${tab.map((x, i) => `${String(i + 1).padStart(2)}. ${x}`).join("\n")}\n\nThe accessibility tree\n${await page.locator("body").ariaSnapshot()}\n`);
    }
    if (masalah.length) gagal++;
    laporan.push(`${masalah.length ? "FAIL" : "ok  "} ${l.kode} @${w}${masalah.length ? "\n      " + masalah.join("\n      ") : ""}`);
    await ctx.close();
  }
}
await browser.close();
const ringkas = `${LEMBAR.length} pages × 4 widths: ${gagal} with a failure\n\n${laporan.join("\n")}\n`;
writeFileSync(join(RENDER, "laporan.txt"), ringkas);
console.log(ringkas);
process.exit(gagal ? 1 : 0);
