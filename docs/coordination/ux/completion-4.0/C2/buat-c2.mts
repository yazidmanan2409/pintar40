/**
 * C2 · W2.16 item 5 — how a PD Kelas presents its ordinary «Lihat bukti» page
 * (/mengajar/[kelas]/bukti) to its facilitator (DAISY-35(5), D-070(h)).
 * Design specimen, not application code. Run from the repository root:
 *
 *   npx tsx docs/coordination/ux/completion-4.0/C2/buat-c2.mts
 *
 * Words: the copy table at 0b19707 (educator persona, as the page asks), plus NEW
 * (README §5). No PD class is seeded: the PD specimens are a labelled substitute drawn
 * from the code path (jenis = PARTICIPANT). People and counts are invented.
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
const kerja = mkdtempSync(join(tmpdir(), "c2-"));
for (const f of ["hle.ts", "tanggal.ts"]) writeFileSync(join(kerja, f), execSync(`git show 0b19707:src/lib/${f}`, { cwd: repo }));
const hle = await import(join(kerja, "hle.ts"));
export const NEW: Record<string, { id: string; en: string }> = {
  "mengajar.bukti.pd.arti": { id: "Kelas pengembangan profesi tidak menghasilkan angka akademik kelas. Kemajuan dan hasil setiap peserta tercatat di Catatan pengembangan profesi.", en: "A professional-learning class produces no class academic figures. Each participant's progress and result are kept in the professional-learning record." },
  "mengajar.bukti.pd.buka": { id: "Buka catatan pengembangan profesi", en: "Open the professional-learning record" },
  "mengajar.bukti.siapa_peserta": { id: "Lihat nama peserta", en: "See the participants' names" },
};
const kata = (k: string) => {
  const v: string = NEW[k] ? NEW[k].id : hle.t(k, "educator", { locale: "id" });
  if (!v || v === k || v === "—") throw new Error(`no words for ${k}`);
  return v;
};
const angka = (n: number) => hle.format.number(n, "id");
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const ikon = (n: string) => `<i data-ikon="${n}"></i>`;
const slotMerek = `<span class="c1-slot" role="img" aria-label="Pintar (master pending F-11)">Pintar <small>(master pending F-11)</small></span>`;
const SEKOLAH = "SMP Cahaya Kaliandra";

type Asesmen = { judul: string; kumpul: number; jendela: string; sedang: number; belum: number };
type Lembar = { kode: string; judul: string; pd: boolean; asesmen: Asesmen[]; tolak?: boolean };

function shell(judul: string, isi: string): string {
  const tempat: Array<[string, string]> = [["Mengajar", "users"], ["Studio", "square-pen"]];
  return `<div class="pds pds-jalan c1">
  <section class="pds-lewati-induk" data-shell data-shell-statis aria-label="${esc(judul)}">
  <a class="pds-lewati" href="#c2-isi">Langsung ke isi</a>
  <div class="pds-shell-host"><div class="pds-shell">
    <nav class="pds-nav" aria-label="${kata("nav.tempat")}"><div class="pds-nav-kepala">${slotMerek}</div>
      <ul class="pds-nav-daftar">${tempat.map(([t, i], n) => `<li><a href="#" class="pds-nav-item"${n === 0 ? ' aria-current="page"' : ""}>${ikon(i)}<span class="pds-nav-label">${t}</span></a></li>`).join("")}</ul>
      <div class="pds-nav-bawah"><div class="pds-identity" style="cursor:default"><span class="pds-avatar" aria-hidden="true">CL</span><div><strong>Citra Lestari</strong><small>Guru · ${SEKOLAH}</small></div></div>
      <button type="button" class="pds-nav-item pds-nav-keluar">${ikon("log-out")}<span class="pds-nav-label">${kata("sesi.keluar")}</span></button></div></nav>
    <div class="pds-main">
      <header class="pds-bar">${slotMerek}<span class="pds-bar-tempat" aria-hidden="true">Mengajar</span><button type="button" class="pds-btn pds-btn-secondary">${kata("sesi.keluar")}</button><button type="button" class="pds-btn pds-btn-icon" aria-label="${kata("nav.menu")}">${ikon("menu")}</button></header>
      <main class="pds-main-isi" id="c2-isi" tabindex="-1">${isi}</main>
    </div></div></div></section></div>`;
}

function halaman(l: Lembar): string {
  if (l.tolak) return `<div class="pds c1"><main class="c1b-tolak" id="c2-isi" tabindex="-1"><section class="pds-section">${slotMerek}<h1 class="pds-title">${kata("auth.not_yet")}</h1><p class="pds-intro">${kata("tolak.arti")}</p><div class="pds-actions"><a href="#" class="pds-btn pds-btn-primary">${kata("mengajar.kembali")}</a></div><p class="pds-help">${kata("sesi.sebagai")} <strong>Citra Lestari</strong> · ${kata("sesi.bukan_anda")} <a href="#" class="pds-link">${kata("sesi.keluar")}</a></p></section></main></div>`;
  const kelas = l.pd ? "PD Guru Matematika" : "Kelas 7A";
  const orang = kata(l.pd ? "mengajar.bukti.peserta" : "mengajar.bukti.murid");
  const total = l.pd ? 9 : 28;
  const keadaan = l.asesmen.length === 0 ? `<div class="pds-empty"><p>${kata("mengajar.bukti.kosong")}</p></div>` : l.asesmen.map((a) => `<article class="c2-asesmen" aria-labelledby="as-${a.judul.length}"><h3 id="as-${a.judul.length}">${esc(a.judul)}</h3>
    <dl class="c1-isi"><div><dt>${kata("mengajar.bukti.kumpul")}</dt><dd>${angka(a.kumpul)} / ${angka(total)}</dd></div><div><dt>${kata("mengajar.bukti.jendela")}</dt><dd>${a.jendela}</dd></div>
    <div><dt>${kata("mengajar.bukti.mulai")}</dt><dd>${angka(a.sedang)} <span>${orang}</span></dd></div><div><dt>${kata("mengajar.bukti.belum")}</dt><dd>${angka(a.belum)} <span>${orang}</span></dd></div></dl>
    <p class="c2-tautan"><a href="#" class="pds-link">${kata(l.pd ? "mengajar.bukti.siapa_peserta" : "mengajar.bukti.siapa")}</a></p></article>`).join("");
  // D-070(h): a PD Kelas has no class academic figures by design. Not five «not yet» cards that promise figures which
  // never come: one statement of what this class is, and the pointer to the record that matters (DAISY-34).
  const simpulan = l.pd
    ? `<div class="pds-well c2-pd" data-pd-arah=""><p>${kata("mengajar.bukti.pd.arti")}</p><div class="pds-actions"><a href="#" class="pds-btn pds-btn-secondary">${kata("mengajar.bukti.pd.buka")}</a></div></div>`
    : `<div class="c1-baris-satu">${["metrik.pemahaman.label", "metrik.kenaikan.label"].map((k) => `<section class="c1-m c1-m-satu c1-m-belum" aria-label="${esc(kata(k))}"><p class="c1-m-judul">${kata(k)}</p><div class="c1-ket"><p>${kata("laporan.metrik.belum_cukup_data")}</p><p>${hle.t("ketiadaan.jumlah.murid", "educator", { locale: "id" }).replace("{have}", "3").replace("{needed}", "5")}</p></div></section>`).join("")}</div>`;
  return shell(kata("mengajar.bukti.judul"), `<p><a href="#" class="pds-back">${ikon("chevron-left")}${kelas}</a></p>
    <ol class="pds-scope" aria-label="Lokasi"><li><a href="#">${SEKOLAH}</a></li><li><a href="#">${kelas}</a></li><li><span aria-current="page">TA 2026/2027</span></li></ol>
    <div class="pds-pagehead"><div><p class="c1-alis-biasa">${kata("mengajar.bukti.eyebrow")} · ${kelas}</p><h1 class="pds-title">${kata("mengajar.bukti.judul")}</h1><p class="pds-intro">${kata("mengajar.bukti.intro")}</p></div></div>
    <section class="pds-section" aria-labelledby="c2-keadaan"><h2 id="c2-keadaan">${kata("mengajar.bukti.keadaan")}</h2>${keadaan}</section>
    <section class="pds-section" aria-labelledby="c2-simpulan"><h2 id="c2-simpulan">${kata("mengajar.bukti.simpulan")}</h2>${simpulan}</section>
    <p class="c1-meta">${kata("mengajar.bukti.kaki")}</p>`);
}

const LEMBAR: Lembar[] = [
  { kode: "pd", judul: "PD Kelas · an assessment open (labelled substitute)", pd: true, asesmen: [{ judul: "Uji Penguasaan · Asesmen formatif di kelas", kumpul: 4, jendela: "14 Nov 2026", sedang: 2, belum: 3 }] },
  { kode: "pd-kosong", judul: "PD Kelas · nothing open yet (labelled substitute)", pd: true, asesmen: [] },
  { kode: "biasa", judul: "Ordinary class, for contrast · figures not yet", pd: false, asesmen: [{ judul: "Uji Penguasaan · Pecahan senilai", kumpul: 3, jendela: "14 Nov 2026", sedang: 6, belum: 19 }] },
  { kode: "tolak", judul: "Refusal · a class this facilitator does not teach", pd: true, asesmen: [], tolak: true },
];

const GAYA = readFileSync(join(repo, "docs/coordination/ux/completion-4.0/C1/c1.css"), "utf8") + readFileSync(join(repo, "docs/coordination/ux/completion-4.0/C1/c1b.css"), "utf8") + readFileSync(join(sini, "c2.css"), "utf8");
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
  const html = `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(l.judul)}</title><style>${tokens}</style><style>${bundleCss}</style><style>${GAYA}</style><script>${bundleJs}</script></head><body>${halaman(l)}<script>Pintar.siapkan();</script></body></html>`;
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
      document.querySelectorAll("a, button").forEach(function (e) { var r = e.getBoundingClientRect(); if (!r.width) return;
        if (e.classList.contains("pds-link") && /^(P|SMALL|SPAN)$/.test(e.parentElement.tagName)) return;
        if (r.height < 24 || r.width < 24) kecil.push(e.tagName + " " + Math.round(r.width) + "x" + Math.round(r.height)); });
      var t = document.body.innerText;
      return { lebar: document.documentElement.scrollWidth, kecil: kecil,
        angka: document.querySelectorAll(".c1-stat, .c1-m").length, arah: document.querySelectorAll("[data-pd-arah]").length,
        murid: /\\bmurid\\b/.test(t.replace(${JSON.stringify(kata("mengajar.bukti.intro"))}, "")) };
    })()`) as { lebar: number; kecil: string[]; angka: number; arah: number; murid: boolean };
    if (ukur.lebar > w + 1) masalah.push(`sideways scroll ${ukur.lebar} at ${w}`);
    if (ukur.kecil.length) masalah.push(`targets under 24 px: ${ukur.kecil.join(", ")}`);
    if (l.pd && !l.tolak) {
      if (ukur.angka) masalah.push("a PD Kelas shows a figure or a figure's place (D-070(h))");
      if (ukur.arah !== 1) masalah.push("the pointer to the professional-learning record is not drawn once");
      if (ukur.murid) masalah.push("a PD Kelas names its people «murid» (DAISY-33)");
    }
    await page.addScriptTag({ content: axe });
    const pelanggaran = await page.evaluate(`axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } }).then(function (r) { return r.violations.map(function (v) { return v.id + " (" + v.nodes.length + ")"; }); })`) as string[];
    masalah.push(...pelanggaran.map((v) => `axe ${v}`));
    if (w === 1280 || w === 320) {
      const tab: string[] = [];
      for (let i = 0; i < 20; i++) {
        await page.keyboard.press("Tab");
        const f = await page.evaluate(`(function () { var a = document.activeElement; if (!a || a === document.body) return ""; var cs = getComputedStyle(a); var cincin = (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) >= 2) || /rgb/.test(cs.boxShadow); return a.tagName.toLowerCase() + " «" + (a.getAttribute("aria-label") || a.textContent || "").replace(/\\s+/g, " ").trim().slice(0, 50) + "»" + (cincin ? "" : "  NO RING"); })()`) as string;
        if (!f) break;
        tab.push(f);
        if (/NO RING/.test(f)) masalah.push(`no focus ring: ${f}`);
      }
      writeFileSync(join(JALAN, `${l.kode}-${w}.txt`), `${l.judul} at ${w} px: the Tab order from the top of the page\n${tab.map((x, i) => `${String(i + 1).padStart(2)}. ${x}`).join("\n")}\n\nThe accessibility tree of the main region\n${await page.locator("main").ariaSnapshot()}\n`);
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
