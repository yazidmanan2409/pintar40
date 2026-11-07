/**
 * CONTOH LAPORAN — seven sample reports for the owner's review: one per reader, plus one variant.
 * A design and language exercise, not a proposal: every report is drawn over figures PINTAR already
 * has (the metric catalogue, the pages each reader already reads), on invented data (data.mts).
 *
 *   npx tsx docs/coordination/ux/completion-4.0/CONTOH-LAPORAN/buat-contoh.mts
 *
 * Words: the copy table on the engineering branch (read only) for every label PINTAR already has;
 * anything new is written through `baru()`, so the README lists it for review.
 */
import { execSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync, readFileSync, mkdtempSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import * as D from "./data.mts";

const sini = dirname(fileURLToPath(import.meta.url));
const repo = join(sini, "..", "..", "..", "..", "..");
const DS = join(repo, "docs/coordination/ux/sistem-desain");
const CABANG = "origin/claude/awesome-rubin-bqxp6p";
const kerja = mkdtempSync(join(tmpdir(), "contoh-"));
for (const f of ["hle.ts", "tanggal.ts"]) writeFileSync(join(kerja, f), execSync(`git show ${CABANG}:src/lib/${f}`, { cwd: repo }));
const hle = await import(join(kerja, "hle.ts"));

// ── words ────────────────────────────────────────────────────────────────────
type Persona = "staff" | "educator" | "learner";
const kata = (k: string, persona: Persona = "staff", isi: Record<string, string | number> = {}) => {
  let v: string = hle.t(k, persona, { locale: "id" });
  if (!v || v === k) throw new Error(`no words for ${k}`);
  for (const [a, b] of Object.entries(isi)) v = v.replace(`{${a}}`, String(b));
  return v;
};
/** New words, for review. Each is recorded with the report it appears in. */
const BARU: Array<{ laporan: string; teks: string; catatan?: string }> = [];
let laporanKini = "";
let hurufKini = 0;
/** Each report's major sections carry a letter, A first, so a reader can say «see Section C» (G-02). */
const huruf = () => String.fromCharCode(65 + hurufKini++);
const judulBagian = (judul: string, id: string, tag = "h2") => `<${tag} id="${id}" class="cl-h"><span class="cl-huruf">${huruf()}</span><span>${esc(judul)}</span></${tag}>`;
const baru = (teks: string, catatan?: string) => { if (!BARU.some((b) => b.laporan === laporanKini && b.teks === teks)) BARU.push({ laporan: laporanKini, teks, catatan }); return teks; };
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const ikon = (n: string) => `<i data-ikon="${n}"></i>`;
const bulat = (x: number) => Math.round(x);
/** A percentage as a whole number, unless rounding would carry it across a boundary the reader judges by
 *  (PINTAR's bands at 60 and 80, the target at 75): then one decimal, so «60%» never stands for 59,6% (R4-02). */
const BATAS = [60, 75, 80];
const pct = (x: number) => BATAS.some((b) => (x < b) !== (Math.round(x) < b)) ? `${x.toFixed(1).replace(".", ",")}%` : `${bulat(x)}%`;
// «serta» joins the last item when an item already holds «dan» («Penjumlahan dan pengurangan pecahan serta Pecahan campuran»).
const daftarKata = (xs: string[]) => xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} ${xs.some((x) => / dan /.test(x)) ? "serta" : "dan"} ${xs[xs.length - 1]}`;
const angkaKata = (n: number) => (["nol", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh"][n] ?? String(n));
const Kapital = (s: string) => s[0].toUpperCase() + s.slice(1);

// ── shells ───────────────────────────────────────────────────────────────────
type Pembaca = { inisial: string; nama: string; peran: string; tempat: Array<[string, string]>; kini: number };
const merek = `<span class="pds-merek">PINTAR</span>`;
function shellStaf(p: Pembaca, judul: string, isi: string): string {
  return `<div class="pds pds-jalan cl">
  <section class="pds-lewati-induk" data-shell data-shell-statis aria-label="${esc(judul)}">
  <a class="pds-lewati" href="#cl-isi">Langsung ke isi</a>
  <div class="pds-shell-host"><div class="pds-shell">
    <nav class="pds-nav" aria-label="${kata("nav.tempat")}">
      <div class="pds-nav-kepala">${merek}</div>
      <ul class="pds-nav-daftar">${p.tempat.map(([t, i], n) => `<li><a href="#" class="pds-nav-item"${n === p.kini ? ' aria-current="page"' : ""}>${ikon(i)}<span class="pds-nav-label">${t}</span></a></li>`).join("")}</ul>
      <div class="pds-nav-bawah"><div class="pds-identity" style="cursor:default"><span class="pds-avatar" aria-hidden="true">${p.inisial}</span><div><strong>${p.nama}</strong><small>${p.peran}</small></div></div>
      <button type="button" class="pds-nav-item pds-nav-keluar">${ikon("log-out")}<span class="pds-nav-label">${kata("sesi.keluar")}</span></button></div>
    </nav>
    <div class="pds-main">
      <header class="pds-bar">${merek}<span class="pds-bar-tempat" aria-hidden="true">${p.tempat[p.kini][0]}</span><button type="button" class="pds-btn pds-btn-secondary">${kata("sesi.keluar")}</button><button type="button" class="pds-btn pds-btn-icon" aria-label="${kata("nav.menu")}">${ikon("menu")}</button></header>
      <main class="pds-main-isi" id="cl-isi" tabindex="-1">${isi}</main>
    </div>
  </div></div></section></div>`;
}
function shellMurid(judul: string, isi: string): string {
  return `<div class="pds pds-jalan cl"><section class="pds-lewati-induk" aria-label="${esc(judul)}">
  <a class="pds-lewati" href="#cl-isi">Langsung ke isi</a>
  <div class="pds-topshell">
    <header class="pds-top">${merek}
      <nav class="pds-tabs" aria-label="${kata("nav.belajar", "learner")}"><a href="#" class="pds-tab" aria-current="page">${kata("nav.belajar", "learner")}</a><a href="#" class="pds-tab">${kata("nav.sertifikat", "learner")}</a></nav>
      <div class="pds-top-kanan"><span class="pds-top-nama">${kata("sesi.bukan_anda", "learner")}</span><button type="button" class="pds-btn pds-btn-secondary">${kata("sesi.keluar", "learner")}</button></div>
    </header>
    <main class="pds-main-isi" id="cl-isi" tabindex="-1">${isi}</main>
  </div></section></div>`;
}
const GURU: Pembaca = { inisial: "CL", nama: "Citra Lestari", peran: `Guru · ${D.SEKOLAH}`, tempat: [["Kelas", "users"], ["Studio", "square-pen"]], kini: 0 };
const KADEP: Pembaca = { inisial: "EP", nama: "Eko Prasetyo", peran: `Kepala departemen · ${D.SEKOLAH}`, tempat: [["Pimpinan", "chart-no-axes-column"], ["Studio", "square-pen"]], kini: 0 };
const DEKAN: Pembaca = { inisial: "SW", nama: "Sri Wahyuni", peran: `Dekan · ${D.SEKOLAH}`, tempat: [["Pimpinan", "chart-no-axes-column"]], kini: 0 };
const PESERTA_PD: Pembaca = { inisial: "AN", nama: "Andi Nugroho", peran: `Guru · ${D.SEKOLAH}`, tempat: [["Kelas", "users"], ["Studio", "square-pen"], ["Pembelajaran Saya", "book-open"]], kini: 2 };
const FASIL: Pembaca = { inisial: "YH", nama: "Yusuf Hidayat", peran: `Fasilitator · ${D.SEKOLAH}`, tempat: [["Kelas", "users"], ["Pengembangan profesi", "graduation-cap"], ["Studio", "square-pen"]], kini: 1 };
const ADMIN: Pembaca = { inisial: "DS", nama: "Dewi Saraswati", peran: `Admin sekolah · ${D.SEKOLAH}`, tempat: [["Konfigurasi", "settings"], ["Pendataan", "file-spreadsheet"], ["Aktivasi akun", "user-check"], ["Studio", "square-pen"]], kini: 0 };

// ── the page ─────────────────────────────────────────────────────────────────
type Laporan = { kode: string; judul: string; pembaca: string; html: string; cetakJudul: string; catatan: Catatan };
type Catatan = { tigaPuluh: string; peta: string[]; visual: Array<[string, string]>; privasi: string[]; tanya: string[] };
const contohTanda = `<p class="cl-contoh" role="note"><strong>CONTOH LAPORAN — DATA SIMULASI</strong><span>Semua nama, kelas, dan angka di laporan ini rekaan.</span></p>`;
function halaman(o: { lingkup: string[]; alis: string; h1: string; cakupan: string; inti: string; bagian: string[]; aksi?: string; langkah?: string[]; kaki: string[] }): string {
  return `<div class="cl-isi">${contohTanda}
  <div class="cl-kepala"><ol class="pds-scope" aria-label="Lokasi">${o.lingkup.map((l, i) => i === o.lingkup.length - 1 ? `<li><span aria-current="page">${esc(l)}</span></li>` : `<li><a href="#">${esc(l)}</a></li>`).join("")}</ol>
  <p class="pds-eyebrow">${esc(o.alis)}</p><h1 class="pds-title">${esc(o.h1)}</h1><p class="cl-cakupan">${esc(o.cakupan)}</p></div>
  ${o.inti}
  ${o.bagian.join("\n")}
  ${o.aksi ? `<section class="cl-bagian cl-aksi-bagian" aria-labelledby="cl-berikut">${judulBagian(baru("Apa berikutnya", "siklus.berikutnya is the learner's; the staff pages reuse it"), "cl-berikut")}<div class="cl-aksi">${o.aksi}</div>${o.langkah?.length ? `<ul class="cl-cetak-saja">${o.langkah.map((l) => `<li>${esc(baru(l, "printed in place of the buttons (G-06)"))}</li>`).join("")}</ul>` : ""}</section>` : ""}
  <footer class="cl-kaki">${o.kaki.map((k) => `<p${k.startsWith("CONTOH LAPORAN") ? ' class="cl-layar-saja"' : ""}>${k}</p>`).join("")}</footer></div>`;
}
const inti = (kalimat: string, sub: string, visual: string, judul: string) => `<section class="cl-bagian" aria-labelledby="cl-inti">${judulBagian(judul, "cl-inti")}<div class="cl-inti"><p class="cl-kalimat" id="cl-inti-kalimat">${esc(kalimat)}</p>${sub ? `<p class="cl-kalimat-sub">${esc(sub)}</p>` : ""}${visual}</div></section>`;
const bagian = (id: string, judul: string, isi: string, arti = "", utuh = false) => `<section class="cl-bagian${utuh ? " cl-utuh" : ""}" aria-labelledby="${id}">${judulBagian(judul, id)}${arti ? `<p class="cl-arti">${esc(arti)}</p>` : ""}${isi}</section>`;
const tombol = (t: string, utama = false) => `<a href="#" class="pds-btn ${utama ? "pds-btn-primary" : "pds-btn-secondary"}">${esc(t)}</a>`;
const angka = (judul: string, nilai: string, sub: string[], belum = false) => `<div class="cl-angka"><h3>${esc(judul)}</h3>${belum ? `<p class="cl-belum">${esc(nilai)}</p>` : `<p class="cl-angka-nilai">${nilai}</p>`}${sub.map((s) => `<p>${esc(s)}</p>`).join("")}</div>`;
const srTabel = (judul: string, kepala: string[], baris: string[][]) => `<table class="pds-sr"><caption>${esc(judul)}</caption><thead><tr>${kepala.map((k) => `<th scope="col">${esc(k)}</th>`).join("")}</tr></thead><tbody>${baris.map((b) => `<tr>${b.map((c, i) => i === 0 ? `<th scope="row">${esc(c)}</th>` : `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;

// ── figures ──────────────────────────────────────────────────────────────────
const pitaKata = (k: "mantap" | "berkembang" | "penguatan") => `«${NAMA_PITA[k]}»`;
const NAMA_PITA = { mantap: kata("kesiapan.siap_sertifikasi"), berkembang: kata("kesiapan.perlu_review"), penguatan: kata("kesiapan.butuh_pendampingan") } as const;
/** Bands over their base, in PINTAR's band order. «Belum mengerjakan» is never a band: it is in the population line. */
function pitaBatang(p: Record<D.Pita, number>, n: number, persona: Persona): string {
  const urut: D.Pita[] = ["mantap", "berkembang", "penguatan"];
  return `<div class="cl-pita"><p class="cl-arti">${esc(`Hasil ${n} murid yang sudah mengerjakan`)}</p>
  <div class="cl-pita-batang" aria-hidden="true">${urut.filter((k) => p[k]).map((k) => `<span data-pita="${k}" style="flex:${p[k]}">${p[k] / n >= 0.08 ? p[k] : ""}</span>`).join("")}</div>
  <ul class="cl-pita-ket">${urut.map((k) => `<li><i style="background:var(--cl-pita-${k})" aria-hidden="true"></i>${esc(NAMA_PITA[k])} <strong>${p[k]} murid</strong> (${pct((p[k] / n) * 100)})</li>`).join("")}</ul></div>`;
}
const populasi = (terdaftar: number, sudah: number, persona: Persona) => `<p class="pds-populasi"><strong class="pds-num">${terdaftar}</strong> ${esc(kata("kesiapan.populasi.murid", persona))} <span aria-hidden="true">·</span> <strong class="pds-num">${sudah}</strong> ${esc(kata("kesiapan.populasi.sudah", persona))} <span aria-hidden="true">·</span> <strong class="pds-num">${terdaftar - sudah}</strong> ${esc(kata("kesiapan.populasi.belum", persona))}</p>`;
/* ONE COLOUR GRAMMAR FOR EVERY REPORT (G-03): grey for an ordinary value; amber, always with its words, for a value
   below its target or in «Perlu penguatan»; PINTAR teal only for the bands and for progress (steps, lessons). The
   two greys and the amber differ in lightness too, so the meaning survives a greyscale print. */
// Explain once, show consistently: amber is named in one legend per figure; each amber value carries the same words
// only for assistive technology (pds-sr), and on paper or in greyscale the bar or dot still stops short of its line.
const kunciBawah = (ada: boolean, teks = "di bawah target") => ada ? `<p class="cl-kunci"><i class="cl-kunci-bawah" aria-hidden="true"></i>${esc(baru(`Angka berwarna jingga menunjukkan penguasaan ${teks}.`))}</p>` : "";
/** Rows on one 0–100 scale: a bar per row, the target line through every row, the value and its base at the end. */
function barisSkala(rows: Array<{ nama: string; nilai: number | null; sub?: string }>, o: { target?: number; tandaBawah?: boolean } = {}): string {
  const t = o.target;
  const skala = `<div class="cl-skala" aria-hidden="true"${t != null ? ' style="margin-top:16px"' : ""}><span></span><div class="cl-skala-garis">${[0, 20, 40, 60, 80, 100].map((v) => `<span style="left:${v}%">${v}%</span>`).join("")}${t != null ? `<span class="cl-skala-target" style="left:${t}%;top:-16px">Target ${t}%</span>` : ""}</div><span></span></div>`;
  let adaBawah = false;
  const isi = rows.map((r) => {
    if (r.nilai == null) return `<li><span class="cl-nama">${esc(r.nama)}</span><span class="cl-arti">${esc(kata("laporan.metrik.belum_cukup_data"))}</span><span></span></li>`;
    const bawah = !!(o.tandaBawah && t != null && r.nilai < t); adaBawah ||= bawah;
    return `<li${bawah ? " data-bawah" : ""}><span class="cl-nama">${esc(r.nama)}</span><span class="cl-jalur" aria-hidden="true"><span class="cl-isi-batang" style="width:${r.nilai}%"></span>${t != null ? `<span class="cl-target" style="left:${t}%"></span>` : ""}</span><span class="cl-nilai">${pct(r.nilai)}${bawah ? `<span class="pds-sr"> ${esc(baru("di bawah target"))}</span>` : ""}${r.sub ? `<small>${esc(r.sub)}</small>` : ""}</span></li>`;
  }).join("");
  return `<div class="cl-gambar">${skala}<ol class="cl-baris">${isi}</ol>${kunciBawah(adaBawah)}</div>`;
}
/** A dot per row on 0–100. PINTAR's band boundaries are drawn at 60 and 80 and named once in a legend (R4-01). */
function titikZona(rows: Array<{ nama: string; nilai: number; sub?: string }>): string {
  const legenda = `<p class="cl-kunci">${esc(baru(`Batas pita: di bawah 60% ${pitaKata("penguatan")} · 60–79% ${pitaKata("berkembang")} · 80% ke atas ${pitaKata("mantap")}.`))}</p>`;
  const skala = `<div class="cl-skala" aria-hidden="true"><span></span><div class="cl-skala-garis">${[0, 20, 40, 60, 80, 100].map((v) => `<span style="left:${v}%">${v}%</span>`).join("")}</div><span></span></div>`;
  let adaBawah = false;
  const isi = rows.map((r) => { const bawah = r.nilai < D.PITA.berkembang; adaBawah ||= bawah;
    return `<li${bawah ? " data-bawah" : ""}><span class="cl-nama">${esc(r.nama)}</span><span class="cl-jalur" aria-hidden="true"><span class="cl-zona" style="left:60%"></span><span class="cl-zona" style="left:80%"></span><span class="cl-titik" style="left:${r.nilai}%"></span></span><span class="cl-nilai">${pct(r.nilai)}${bawah ? `<span class="pds-sr"> ${esc(NAMA_PITA.penguatan)}</span>` : ""}${r.sub ? `<small>${esc(r.sub)}</small>` : ""}</span></li>`; }).join("");
  return `<div class="cl-gambar">${legenda}<ol class="cl-baris">${isi}</ol>${skala}${kunciBawah(adaBawah, `di pita ${pitaKata("penguatan")}`)}</div>`;
}
/** Before and after on one scale: the small light dot is Pemetaan Awal, the dark dot Uji Penguasaan (amber when it stops short of the target). */
function awalAkhir(rows: Array<{ nama: string; awal: number | null; akhir: number | null; maks: number; target?: number; sub: string }>, labelTarget = kata("siklus.ambang", "learner").replace(/:$/, "")): string {
  let adaBawah = false;
  const isi = rows.map((r) => {
    const x = (v: number) => (v / r.maks) * 100;
    const a = r.awal != null ? x(r.awal) : null, b = r.akhir != null ? x(r.akhir) : null;
    const bawah = r.akhir != null && r.target != null && r.akhir < r.target; adaBawah ||= bawah;
    return `<li${bawah ? " data-bawah" : ""}><span class="cl-nama">${esc(r.nama)}</span><span class="cl-jalur" aria-hidden="true">${a != null && b != null ? `<span class="cl-garis-naik" style="left:${Math.min(a, b)}%;width:${Math.abs(b - a)}%"></span>` : ""}${r.target != null ? `<span class="cl-target" style="left:${x(r.target)}%"></span>` : ""}${a != null ? `<span class="cl-titik-awal" style="left:${a}%"></span>` : ""}${b != null ? `<span class="cl-titik" style="left:${b}%"></span>` : ""}</span><span class="cl-nilai">${esc(r.sub)}</span></li>`;
  }).join("");
  return `<div class="cl-gambar"><ul class="cl-pita-ket" style="margin-bottom:var(--space-3)"><li><i class="cl-kunci-awal" aria-hidden="true"></i>${esc(kata("jenis.mode.PRE_TEST"))}</li><li><i class="cl-kunci-akhir" aria-hidden="true"></i>${esc(kata("jenis.mode.POST_TEST"))}</li><li><i style="background:var(--ink-1);width:2px;border-radius:0" aria-hidden="true"></i>${esc(labelTarget)}</li>${adaBawah ? `<li><i class="cl-kunci-bawah" style="border-radius:50%" aria-hidden="true"></i>${esc(baru("Titik berwarna jingga menunjukkan penguasaan di bawah target."))}</li>` : ""}</ul><ol class="cl-baris">${isi}</ol></div>`;
}
/** One dot per student on the score line (0–20 correct), stacked where scores are equal; the band zones and the target named. */
function sebaranTitik(skor: number[], pitaDari: (i: number) => D.Pita, maks = 20, target = 15): string {
  const L = 880, T = 150, kiri = 16, kanan = 16, w = L - kiri - kanan, x = (s: number) => kiri + (s / maks) * w, r = 6, jarak = 14, dasar = 118;
  const tinggi: Record<number, number> = {};
  const titik = skor.map((s, i) => { const k = (tinggi[s] = (tinggi[s] ?? 0) + 1); return `<circle cx="${x(s).toFixed(1)}" cy="${dasar - (k - 0.5) * jarak}" r="${r}" fill="var(--cl-pita-${pitaDari(i)})" stroke="var(--surface-1)" stroke-width="2"><title>${s} dari ${maks} soal tepat</title></circle>`; }).join("");
  const batas = [12, 16].map((s) => `<line x1="${x(s - 0.5)}" x2="${x(s - 0.5)}" y1="22" y2="${dasar}" stroke="var(--line-strong)" stroke-width="1"/>`).join("");
  const tgt = `<line x1="${x(target)}" x2="${x(target)}" y1="20" y2="${dasar + 4}" stroke="var(--ink-1)" stroke-width="2"/><text x="${x(target) - 6}" y="30" text-anchor="end" class="cl-t1">Target ${target} soal (${D.TARGET}%)</text>`;
  const zona = `<text x="${x(6)}" y="12" text-anchor="middle" class="cl-t3">${esc(NAMA_PITA.penguatan)}</text><text x="${x(13.75)}" y="12" text-anchor="middle" class="cl-t3">${esc(NAMA_PITA.berkembang)}</text><text x="${x(18)}" y="12" text-anchor="middle" class="cl-t3">${esc(NAMA_PITA.mantap)}</text>`;
  const sumbu = `<line x1="${kiri}" x2="${L - kanan}" y1="${dasar}" y2="${dasar}" stroke="var(--line-strong)"/>` + [0, 5, 10, 15, 20].map((s) => `<text x="${x(s)}" y="${dasar + 18}" text-anchor="middle">${s}</text>`).join("") + `<text x="${L - kanan}" y="${dasar + 32}" text-anchor="end">${esc(baru("soal tepat dari 20"))}</text>`;
  return `<svg class="cl-svg" viewBox="0 0 ${L} ${T}" role="img" aria-label="${esc(`Sebaran ${skor.length} murid menurut banyak soal tepat`)}">${zona}${batas}${sumbu}${titik}${tgt}</svg>`;
}

// ═════════════════════════════════════════════════════════════════════════════
// 2 · GURU — Ringkasan Kelas (7A), and its variant (7E: not yet enough)
// ═════════════════════════════════════════════════════════════════════════════
function laporanGuru(namaKelas: string, kode: string): Laporan {
  laporanKini = `guru-${namaKelas}`; hurufKini = 0;
  const k = D.ringkasKelas(namaKelas, kode);
  const persona: Persona = "educator";
  const judulKelas = `Kelas ${namaKelas} · ${k.paket.mapel}`;
  const lingkup = [D.SEKOLAH, `Kelas ${namaKelas}`, D.TAHUN];
  const cakupan = kata("laporan.cakupan.kelas", persona, { waktu: D.WAKTU });
  const kaki = [esc(kata("kesiapan.catatan", persona)), esc(baru(`Target bab ini ditetapkan sekolah: ${D.TARGET}% (15 dari 20 soal).`)), "CONTOH LAPORAN — DATA SIMULASI."];
  if (k.pemahaman == null) {
    // Not enough yet: every figure says how far it is and what makes it appear (P14), in its own place.
    const kurang = kata("ketiadaan.jumlah.murid", persona, { have: k.peserta, needed: D.MIN_SAMPEL });
    const kalimat = baru(`Belum cukup bukti untuk menyimpulkan apa pun tentang ${judulKelas}.`);
    const sub = baru(`Baru ${k.peserta} dari ${k.terdaftar} murid mengerjakan Uji Penguasaan ${k.paket.bab}. Angka kelas muncul setelah paling sedikit ${D.MIN_SAMPEL} murid mengerjakannya.`);
    const html = shellStaf(GURU, "Ringkasan Kelas", halaman({ lingkup, alis: kata("laporan.kelas.judul", persona), h1: judulKelas, cakupan,
      inti: inti(kalimat, sub, populasi(k.terdaftar, k.peserta, persona), kata("metrik.peserta.label", persona)),
      bagian: [bagian("cl-angka", baru("Angka kelas"), `<div class="cl-angka-baris">
        ${angka(kata("metrik.peserta.label", persona), String(k.peserta), [kata("metrik.peserta.arti", persona)])}
        ${angka(kata("metrik.pemahaman.label", persona), kata("laporan.metrik.belum_cukup_data", persona), [kurang, kata("laporan.muncul.akhir", persona)], true)}
        ${angka(kata("metrik.kenaikan.label", persona), kata("laporan.metrik.belum_cukup_data", persona), [kurang, kata("laporan.muncul.awal_akhir", persona)], true)}</div>`),
        bagian("cl-pita-h", kata("metrik.kesiapan.label", persona), `<p class="cl-belum">${esc(kata("laporan.metrik.belum_cukup_data", persona))}</p><p class="cl-arti">${esc(kurang)} ${esc(kata("laporan.muncul.akhir", persona))}</p>`, "", true),
        bagian("cl-topik-h", kata("metrik.topik.label", persona), `<p class="cl-belum">${esc(kata("laporan.metrik.belum_cukup_data", persona))}</p><p class="cl-arti">${esc(kurang)}</p>`)],
      aksi: tombol(kata("mengajar.soal.kembali", persona), true), langkah: [`Di PINTAR, angka kelas muncul sendiri setelah paling sedikit ${D.MIN_SAMPEL} murid mengerjakan Uji Penguasaan. Tidak ada yang perlu dilakukan sekarang.`], kaki }));
    return { kode: "2b-guru-belum-cukup", judul: `Ringkasan Kelas · ${namaKelas} (belum cukup data)`, pembaca: "Guru", html, cetakJudul: `Ringkasan Kelas · Kelas ${namaKelas} · ${D.SEKOLAH} · ${D.TAHUN}`, catatan: {
      tigaPuluh: "The same report on a class whose Mastery Check is still being held: there is nothing to conclude yet, and the page says so before anything else. Every figure stays in its place with how far it is from appearing.",
      peta: ["`/edukator/ringkasan?kelas=…` (Ringkasan Kelas, C1)", "The «not yet» state: `laporan.metrik.belum_cukup_data`, `ketiadaan.jumlah.murid`, `laporan.muncul.*` (P14)"],
      visual: [["Population line", "Existing (`pds-populasi`): who the report covers and who is missing, before any figure."], ["Headline figures in their «not yet» form", "Existing «Angka utama»: the figure's place is kept, so the page does not change shape when the data arrives."]],
      privasi: ["Nothing about individual students; under the minimum sample no class figure is drawn."],
      tanya: [] } };
  }
  const p = k.pita!, n = k.peserta;
  const topikRows = k.paket.topik.map((t, i) => ({ nama: t.nama, nilai: k.topik[i]! }));
  const bawah = topikRows.filter((r) => r.nilai < D.TARGET);
  const terendah = topikRows.reduce((a, b) => (b.nilai < a.nilai ? b : a));
  const kalimat = bawah.length
    ? baru(`${Kapital(angkaKata(bawah.length))} dari ${angkaKata(topikRows.length)} topik masih di bawah target: ${daftarKata(bawah.map((b) => b.nama))}.`, "lead sentence, composed from metrik.topik and the chapter's target")
    : baru(`Semua topik sudah mencapai target.`);
  const sub = baru(`${p.mantap + p.berkembang} dari ${n} murid sudah berada di pita ${pitaKata("mantap")} atau ${pitaKata("berkembang")}; ${p.penguatan} murid perlu penguatan. Rata-rata penguasaan kelas ${pct(k.pemahaman!)}.`);
  const ab = k.awalAkhir, rAwal = ab.reduce((a, b) => a + b[0], 0) / ab.length, rAkhir = ab.reduce((a, b) => a + b[1], 0) / ab.length;
  const kenaikan = k.kenaikan!;
  const visualInti = barisSkala(topikRows, { target: D.TARGET, tandaBawah: true }) +
    srTabel(kata("metrik.topik.label", persona), ["Topik", "Penguasaan rata-rata"], topikRows.map((r) => [r.nama, pct(r.nilai)]));
  const indeksPita = (() => { const ikut = k.kelas.murid.filter((m) => m.hasil[kode]?.akhir).map((m) => ({ s: D.skor(m.hasil[kode].akhir!), p: D.pita(m.hasil[kode].akhir!, k.paket) })).sort((a, b) => a.s - b.s); return ikut; })();
  const mis = k.miskonsepsi!;
  const html = shellStaf(GURU, "Ringkasan Kelas", halaman({ lingkup, alis: kata("laporan.kelas.judul", persona), h1: judulKelas, cakupan,
    inti: inti(kalimat, sub, visualInti, kata("metrik.topik.label", persona)),
    bagian: [
      bagian("cl-sebaran", kata("metrik.kesiapan.label", persona), populasi(k.terdaftar, n, persona) + `<div class="cl-utuh">` + pitaBatang(p, n, persona) +
        `<div class="cl-lebar-saja">` + sebaranTitik(indeksPita.map((x) => x.s), (i) => indeksPita[i].p) +
        `<p class="cl-arti">${esc(baru("Setiap titik satu murid, diwarnai menurut pitanya.") + (indeksPita.some((x) => x.s >= 12 && x.p === "penguatan") ? " " + baru(`Titik terang di sebelah kanan garis 60% adalah murid yang belum tepat pada soal wajib, sehingga masuk pita ${pitaKata("penguatan")}.`) : ""))}</p></div></div>` +
        srTabel(kata("metrik.kesiapan.label", persona), ["Pita", "Murid"], (["mantap", "berkembang", "penguatan"] as D.Pita[]).map((x) => [NAMA_PITA[x], String(p[x])])),
        kata("metrik.kesiapan.arti", persona)),
      `<div class="cl-dua">` +
      bagian("cl-kenaikan", kata("metrik.kenaikan.label", persona), `<div class="cl-angka-baris">${angka(kata("metrik.kenaikan.label", persona), `+${bulat(kenaikan)} <small>${esc(baru("poin"))}</small>`, [baru(`Dihitung dari ${k.keduanya} murid yang mengerjakan Pemetaan Awal dan Uji Penguasaan.`)])}</div>` +
        awalAkhir([{ nama: baru("Rata-rata kelas"), awal: rAwal, akhir: rAkhir, maks: 20, target: 15, sub: `${pct((rAwal / 20) * 100)} → ${pct((rAkhir / 20) * 100)}` }]), kata("metrik.kenaikan.arti", persona)) +
      bagian("cl-mis", kata("metrik.miskonsepsi.label", persona), `<ul class="cl-daftar"><li><div><strong>${esc(D.MISKONSEPSI.nama)}</strong><br><small>${esc(baru(`Contoh jawaban: ${D.MISKONSEPSI.contoh}`))}</small></div><span class="cl-nilai">${mis} murid<small>${esc(baru(`dari ${n}`))}</small></span></li></ul>
        <p class="cl-arti"><strong>${esc(baru("Saran penanganan"))}:</strong> ${esc(D.MISKONSEPSI.saran)}</p>`, kata("metrik.miskonsepsi.arti", persona)) + `</div>`,
      bagian("cl-murid", baru("Murid yang perlu penguatan", "R2-02: the band's own name stays where the band is named"), `<ul class="cl-daftar cl-daftar-angka">${k.penguatan.map((m) => { const l = m.hasil[kode].akhir!; const lemah = k.paket.topik.map((t, i) => ({ t: t.nama, n: D.topikSkor(l, i) })).filter((x) => x.n < 3).map((x) => x.t); return `<li><div><strong>${esc(m.nama)}</strong><br><small>${esc(baru("Pelajari lagi") + ": " + (lemah.length ? lemah.join(", ") : baru("soal wajib")))}</small></div><span class="cl-nilai">${D.skor(l)} ${esc(kata("siklus.dari", persona))} 20 ${esc(baru("soal tepat"))}${D.wajibTepat(l, k.paket) ? "" : `<small>${esc(baru("soal wajib belum tepat"))}</small>`}</span></li>`; }).join("")}</ul>`,
        baru(`Murid di pita ${pitaKata("penguatan")}, menurut abjad. Ini daftar bagian yang perlu dipelajari lagi, bukan penilaian atas muridnya.`)),
    ],
    aksi: tombol(kata("mengajar.soal.kembali", persona), true) + tombol(kata("laporan.cetak", persona)), langkah: [`Di PINTAR: Kelas ${namaKelas} › «${kata("mengajar.soal.kembali", persona)}» memuat jawaban setiap murid per soal.`, "Saran penanganan untuk pemahaman keliru ada di bagian D."], kaki }));
  return { kode: "2-guru", judul: `Ringkasan Kelas · ${namaKelas}`, pembaca: "Guru", html, cetakJudul: `Ringkasan Kelas · Kelas ${namaKelas} · ${k.paket.bab} · ${D.SEKOLAH} · ${D.TAHUN}`, catatan: {
    tigaPuluh: `Which parts of the chapter the class has and has not yet got (${bawah.length} of ${topikRows.length} topics under the target), how the class spreads across PINTAR's bands, the one recurring misunderstanding with what to do about it, and who to help first.`,
    peta: ["`/edukator/ringkasan?kelas=…` (Ringkasan Kelas, C1): `metrik.topik`, `metrik.kesiapan`, `metrik.kenaikan`, `metrik.miskonsepsi`, `metrik.peserta`, `metrik.pemahaman`",
      "The students in the lowest band: the class's own students, as the teacher already sees them in «Lihat bukti» (`/mengajar/[kelas]/bukti`) and the student page (`mengajar.murid1.*`)",
      "«Pelajari lagi» per student: `mengajar.murid1.tujuan_arti` («tujuan yang penguasaannya masih di bawah target»)"],
    visual: [["Lead: «Penguasaan per topik» as rows on one 0–100% scale with the target line through every row", "Existing display «Diagram batang» / «Daftar». Answers «which part needs attention» in one look: the bars that stop short of the line. Bars are grey; a bar below the target is amber and says «di bawah target» in words, so colour is never alone and the meaning survives greyscale (G-03)."],
      ["Population line, then the bands as one bar over the students who took it", "Existing «Sebaran» (`pds-populasi`, D-121(c)): «Belum mengerjakan» is a count, never a band."],
      ["One dot per student on the score line, with the band zones and the target", "**Candidate VI-C1** (distribution strip): shows the class's real shape (here two groups, not one bell) that an average hides. Needs per-student scores on this page; the teacher already holds them in «Lihat bukti»."],
      ["Kenaikan: the number, then the class's average before and after on the same scale", "Existing «Angka utama»; the before→after pair is the same figure drawn at both ends (the same students in both)."],
      ["Recurring misunderstanding: one row with its count, an example answer and the remedy", "Existing «Daftar» (`metrik.miskonsepsi`, which carries its remedy)."]],
    privasi: ["Only this teacher's class. Students are listed by name only in the lowest band, alphabetically, never ranked, with what to study again (as `mengajar.murid1.*` already does)."],
    tanya: ["The page-level lead sentence is new: PINTAR would compose it from the figures below it, with no cause or advice. Owner: should reports carry one?",
      "«Penguasaan per topik» (this report, `metrik.topik.label`) and «Penguasaan per bagian» («Lihat bukti», `mengajar.bukti.bagian`, UX-41) name nearly the same figure on two pages. Dr Gladys: one name, or keep both?",
      "«poin» for Kenaikan (a difference in percentage points). Dr Gladys: «poin», «poin persentase», or no unit?",
      "The report title is G6 (Dr Gladys); «Ringkasan Kelas» is today's copy (`laporan.kelas.judul`)."] } };
}

// ═════════════════════════════════════════════════════════════════════════════
// 1 · MURID — Hasil belajar (Bagas, 7A)
// ═════════════════════════════════════════════════════════════════════════════
function laporanMurid(): Laporan {
  laporanKini = "murid"; hurufKini = 0;
  const persona: Persona = "learner";
  const bagas = D.KELAS.find((k) => k.nama === "7A")!.murid.find((m) => m.nama === "Bagas Pratama")!;
  const M7 = bagas.hasil.M7, I7 = bagas.hasil.I7, b1 = D.BAGAS_LAIN.bab1, b3 = D.BAGAS_LAIN.bab3;
  const bab = [
    { nama: `${b1.mapel} · ${b1.bab}`, awal: b1.awal, akhir: b1.akhir, topik: b1.topik },
    { nama: `${M7.paket.mapel} · ${M7.paket.bab}`, awal: D.skor(M7.awal!), akhir: D.skor(M7.akhir!), topik: M7.paket.topik.map((t, i) => [t.nama, D.topikSkor(M7.akhir!, i)] as [string, number]) },
    { nama: `${I7.paket.mapel} · ${I7.paket.bab}`, awal: D.skor(I7.awal!), akhir: D.skor(I7.akhir!), topik: I7.paket.topik.map((t, i) => [t.nama, D.topikSkor(I7.akhir!, i)] as [string, number]) },
  ];
  const tercapai = bab.filter((b) => b.akhir >= 15), belum = bab.filter((b) => b.akhir < 15);
  // Every part section B marks «pelajari lagi», named here with its chapter, met target or not.
  const ulangPerBab = bab.map((b) => ({ bab: b.nama.split(" · ").slice(0, 2).join(" "), t: b.topik.filter(([, n]) => n < 3).map(([t]) => t) })).filter((x) => x.t.length);
  const ulang = ulangPerBab.flatMap((x) => x.t);
  const kalimat = baru(`${Kapital(angkaKata(tercapai.length))} dari ${angkaKata(bab.length)} bab sudah mencapai target.${belum.length ? ` Di ${belum.map((b) => b.nama.split(" · ").slice(0, 2).join(" ")).join(", ")} masih ada bagian yang perlu dipelajari lagi.` : ""}`, "learner copy: no pronoun, no comparison with anyone");
  const jalur = awalAkhir([...bab.map((b) => ({ nama: b.nama, awal: b.awal, akhir: b.akhir, maks: 20, target: 15, sub: `${b.akhir} ${kata("siklus.dari", persona)} 20 · ${b.akhir >= 15 ? kata("siklus.target.tercapai", persona) : kata("siklus.target.belum", persona)}` })),
    { nama: `${b3.mapel} · ${b3.bab}`, awal: b3.awal, akhir: null, maks: 20, target: 15, sub: `${kata("siklus.di.pelajaran", persona)} · ${b3.pelajaran[0]} ${kata("siklus.dari", persona)} ${b3.pelajaran[1]}` }]);
  const meter = (n: number) => `<span class="cl-segmen" aria-hidden="true">${[0, 1, 2, 3].map((i) => `<i${i < n ? " data-isi" : ""}></i>`).join("")}</span>`;
  const perBab = bab.map((b, j) => `<section class="cl-grup" aria-labelledby="cl-bab-${j}"><h3 id="cl-bab-${j}" class="cl-h3">${esc(b.nama)}</h3>` + (`<ul class="cl-daftar">${b.topik.map(([t, n]) => `<li><span>${esc(t)}</span><span>${meter(n)}${n} ${esc(kata("siklus.dari", persona))} 4 ${esc(kata("siklus.soal", persona))}${n < 3 ? ` · <strong>${esc(baru("pelajari lagi"))}</strong>` : ""}</span></li>`).join("")}</ul>`) + `</section>`).join("");
  const html = shellMurid("Hasil belajar", halaman({ lingkup: [kata("nav.belajar", persona), baru("Hasil belajar")], alis: baru("Hasil belajar"), h1: baru("Halo, Bagas"), cakupan: baru(`Semua bab yang sudah dikerjakan di ${D.TAHUN}, sampai ${D.WAKTU}.`),
    inti: inti(kalimat, ulang.length ? baru(`${kata("hasil.target.ulang", persona)} ${ulangPerBab.map((x) => `${daftarKata(x.t)} (${x.bab})`).join("; ")}.`) : "", jalur, baru("Hasil per bab")),
    bagian: [bagian("cl-perbab", baru("Bagian per bab"), perBab, baru("Setiap kotak satu soal yang dijawab tepat pada Uji Penguasaan."))],
    aksi: tombol(kata("siklus.aksi.pelajaran", persona), true) + tombol(kata("siklus.target.lihat_ulang", persona)) + tombol(kata("siklus.lihat_sertifikat", persona)),
    langkah: [`Lanjutkan ${b3.mapel} ${b3.bab} di Belajar.`, ...(ulangPerBab.length ? [`Pelajari lagi bagian yang ditandai «pelajari lagi» (${ulangPerBab.map((x) => x.bab).join(", ")}), lalu tanyakan kepada guru langkah berikutnya.`] : []), "Sertifikat bab yang targetnya tercapai ada di Sertifikat."],
    kaki: [esc(kata("siklus.delta_arti", persona)), esc(baru(`Target setiap bab ditetapkan sekolah: 15 dari 20 soal.`)), "CONTOH LAPORAN — DATA SIMULASI."] }));
  return { kode: "1-murid", judul: "Hasil belajar · murid", pembaca: "Murid", html, cetakJudul: `Hasil belajar · Bagas · Kelas 7A · ${D.SEKOLAH} · ${D.TAHUN}`, catatan: {
    tigaPuluh: "Which chapters are done and reached their target, what is still in progress, and exactly which parts to study again: no score is compared with anyone else's.",
    peta: ["Each chapter's result page, `/belajar/[tugas]/hasil`: «Penguasaan», «Target untuk bab ini», «Target tercapai» / «Belum mencapai target», «Pelajari lagi:»", "Pemetaan Awal against Uji Penguasaan: `siklus.delta_arti`", "Chapter in progress: `siklus.di.pelajaran` on `/belajar`",
      "**A page that gathers every chapter does not exist today**: this specimen lays the existing per-chapter results side by side (see the questions)."],
    visual: [["Lead: one row per chapter, Pemetaan Awal (small light dot) to Uji Penguasaan (dark dot, amber when it stops short of the target), the target line through every row", "**Candidate VI-C7** (a student's own path): progress against the chapter's own target, never against classmates. The chapter in progress shows only what is known."],
      ["Per chapter: each part as four small squares, one per question answered right", "A count the learner already sees question by question on the result page; the squares make «3 dari 4» readable without a percentage."]],
    privasi: ["Only Bagas's own work. No class average, no rank, no peer. First name only in the greeting (D-020); the bar says «Bukan akun Anda?» (S15)."],
    tanya: ["Owner: a learner's page that gathers all chapters is new presentation over existing results. Wanted, or keep results per chapter?", "The title «Hasil belajar» and the greeting are new words. Dr Gladys: the title (G6 covers report titles)."] } };
}

// ═════════════════════════════════════════════════════════════════════════════
// 3 · KEPALA DEPARTEMEN — Matematika, kelas 7
// ═════════════════════════════════════════════════════════════════════════════
function laporanKadep(): Laporan {
  laporanKini = "kadep"; hurufKini = 0;
  const persona: Persona = "staff";
  const kelasNama = ["7A", "7B", "7C", "7D", "7E"];
  const rs = kelasNama.map((n) => D.ringkasKelas(n, "M7"));
  const paket = rs[0].paket;
  const cukup = rs.filter((r) => r.pemahaman != null);
  const pola = paket.topik.map((t, i) => ({ t: t.nama, bawah: cukup.filter((r) => r.topik[i]! < D.TARGET).length })).filter((x) => x.bawah >= Math.ceil(cukup.length / 2)).sort((a, b) => b.bawah - a.bawah);
  const sama = pola.every((x) => x.bawah === pola[0]?.bawah);
  const kalimat = !pola.length ? baru("Tidak ada topik yang di bawah target di sebagian besar kelas.")
    : sama ? baru(`${daftarKata(pola.map((x) => x.t))} di bawah target di ${pola[0].bawah === cukup.length ? `ke${angkaKata(cukup.length)}` : `${pola[0].bawah} dari ${cukup.length}`} kelas yang datanya cukup.`, "lead: a pattern across classes, from metrik.topik per class")
    : baru(`Di bawah target di sebagian besar kelas: ${daftarKata(pola.map((x) => `${x.t} (${x.bawah} dari ${cukup.length} kelas)`))}.`);
  const tanpa = rs.filter((r) => r.pemahaman == null);
  const sub = baru(`Pola yang sama di banyak kelas menunjuk ke topiknya, bukan ke satu kelas.${tanpa.length ? ` ${tanpa.map((r) => `Kelas ${r.kelas.nama}`).join(", ")} belum cukup data.` : ""}`);
  const sel = (v: number | null) => v == null ? `<span class="cl-sel-kosong">—</span>` : `<span class="cl-sel"${v < D.TARGET ? " data-bawah" : ""}><b>${pct(v)}</b><span class="cl-mini" aria-hidden="true"><i style="width:${v}%"></i><u style="left:${D.TARGET}%"></u></span>${v < D.TARGET ? `<span class="pds-sr"> ${baru("di bawah target")}</span>` : ""}</span>`;
  const kisi = `<div class="cl-kisi-wadah"><table class="cl-kisi cl-zebra cl-kisi-kelas"><colgroup><col class="cl-kol-nama">${rs.map(() => "<col>").join("")}</colgroup><caption class="pds-sr">${esc(`${kata("metrik.topik.label")} per kelas · ${paket.bab}`)}</caption>
    <thead><tr><th scope="col">${esc(baru("Topik"))}</th>${rs.map((r) => `<th scope="col">Kelas ${r.kelas.nama}<small>${r.pemahaman == null ? esc(kata("ketiadaan.jumlah.murid", persona, { have: r.peserta, needed: D.MIN_SAMPEL })) : `${r.peserta} ${esc(kata("siklus.dari"))} ${r.terdaftar} murid`}</small></th>`).join("")}</tr></thead>
    <tbody>${paket.topik.map((t, i) => `<tr><th scope="row">${esc(t.nama)}</th>${rs.map((r) => `<td>${sel(r.topik[i])}</td>`).join("")}</tr>`).join("")}
    <tr><th scope="row"><strong>${esc(kata("metrik.kenaikan.label"))}</strong></th>${rs.map((r) => `<td>${r.kenaikan == null ? `<span class="cl-sel-kosong">—</span>` : `<b>+${bulat(r.kenaikan)}</b> ${esc(baru("poin"))}`}</td>`).join("")}</tr></tbody></table></div>
    <p class="cl-arti">${esc(baru(`Garis tegak di setiap sel: target ${D.TARGET}%. Angka berwarna jingga menunjukkan penguasaan di bawah target. Tanda — berarti data belum cukup.`))}</p>`;
  const kesiapan = `<ul class="cl-daftar">${rs.map((r) => `<li><span>Kelas ${r.kelas.nama}</span><span>${esc(r.pemahaman != null ? kata("pimpinan.kesiapan.cukup") : r.peserta > 0 ? kata("pimpinan.kesiapan.belum_cukup") : kata("pimpinan.kesiapan.belum_ada"))}</span></li>`).join("")}</ul><p class="cl-arti">${esc(kata("pimpinan.kesiapan.catatan"))}</p>`;
  const rantai = `<dl class="cl-rantai"><div><dt>${esc(kata("pimpinan.rantai.didukung"))}</dt><dd>${esc(kalimat)}</dd></div><div><dt>${esc(kata("pimpinan.rantai.belum"))}</dt><dd>${esc(kata("pimpinan.rantai.pembelajaran.belum"))}</dd></div><div><dt>${esc(kata("pimpinan.rantai.langkah"))}</dt><dd>${esc(kata("pimpinan.rantai.pembelajaran.langkah"))}</dd></div></dl>`;
  const html = shellStaf(KADEP, "Matematika", halaman({ lingkup: [D.SEKOLAH, "Matematika", D.TAHUN], alis: kata("pimpinan.eyebrow"), h1: `Matematika · kelas 7`, cakupan: baru(`${paket.bab} di ${rs.length} kelas. Angka dihitung ${D.WAKTU} dari semua bukti sampai saat itu.`),
    inti: inti(kalimat, sub, kisi, baru(`${kata("metrik.topik.label")} per kelas`)),
    bagian: [bagian("cl-rantai-h", kata("pimpinan.keluarga.pembelajaran"), rantai),
      bagian("cl-kesiapan", kata("pimpinan.kesiapan.judul"), kesiapan)],
    aksi: tombol(kata("pimpinan.buka.simpul"), true) + tombol(kata("laporan.cetak")),
    langkah: [`Di PINTAR: Pimpinan › Matematika › «${kata("pimpinan.buka.simpul")}» memuat angka setiap kelas.`, kata("pimpinan.rantai.pembelajaran.langkah")],
    kaki: [esc(baru("Setiap angka dihitung per kelas, sama dengan Ringkasan Kelas tiap kelas.")), esc(baru("Kelas disebut menurut namanya, tidak menurut gurunya. Angka menunjukkan keadaan, bukan penilaian atas guru.")), "CONTOH LAPORAN — DATA SIMULASI."] }));
  return { kode: "3-kadep", judul: "Matematika · kelas 7", pembaca: "Kepala Departemen", html, cetakJudul: `Pimpinan · Matematika · kelas 7 · ${D.SEKOLAH} · ${D.TAHUN}`, catatan: {
    tigaPuluh: `Whether a difficulty is a pattern across the department or one class: here ${pola.map((x) => x.t).join(" and ")} sit under the target in most classes, so the follow-up is about the topic. One class has too little evidence to say anything.`,
    peta: ["`/pimpinan/[simpul]` for the Matematika node: «Yang didukung bukti» (figures per class, `pimpinan.bukti.di_kelas`), «Kesiapan bukti» (`pimpinan.kesiapan.*`), the evidence chain words (`pimpinan.rantai.*`)", "Each cell is that class's own `metrik.topik` figure, the same as its teacher's Ringkasan Kelas (7A matches report 2)"],
    visual: [["Lead: a grid of topics × classes, each cell its value, a short bar and the target tick", "**Candidate VI-C4** (competency grid), drawn with no colour ramp: the number, a bar and the word carry the value, so it needs no new token. Reading across a row shows a pattern; reading down a column shows one class."],
      ["Evidence chain: supported / not yet known / possible step", "Existing (`pimpinan.rantai.*`): keeps the pattern apart from any explanation of it."],
      ["Evidence readiness per class", "Existing «Kesiapan bukti»: missing evidence is stated, never drawn as a low value."]],
    privasi: ["Classes only, named by class, never by teacher (Visual Intelligence: a class's results are not its teacher's rating). No student here: students are a separate, recorded action (`pimpinan.murid.sub`)."],
    tanya: ["Owner: the grid is a new display (VI-C4) over existing per-class figures. Adopt for `/pimpinan/[simpul]`?"] } };
}

// ═════════════════════════════════════════════════════════════════════════════
// 4 · DEKAN — Ringkasan Sekolah
// ═════════════════════════════════════════════════════════════════════════════
function laporanDekan(): Laporan {
  laporanKini = "dekan"; hurufKini = 0;
  const persona: Persona = "staff";
  const s = D.ringkasSekolah();
  const ranah = [...s.ranah].sort((a, b) => b.nilai - a.nilai);
  const lemah = ranah.filter((r) => r.nilai < D.PITA.berkembang);
  const terendah = ranah[ranah.length - 1];
  const kalimat = baru(`Penguasaan murid naik rata-rata ${bulat(s.kenaikan)} poin sejak Pemetaan Awal. ${lemah.length ? `${daftarKata(lemah.map((r) => r.ranah))} masih di pita ${pitaKata("penguatan")}.` : `Ranah terendah: ${terendah.ranah} (${pct(terendah.nilai)}).`}`, "lead: kenaikan_institusi, then the ranah under 60% (or the lowest)");
  const sub = baru(`${ranah.filter((r) => r.nilai >= D.PITA.berkembang).length} dari ${ranah.length} ranah berada di pita ${pitaKata("berkembang")} atau ${pitaKata("mantap")}.`);
  const visual = titikZona(ranah.map((r) => ({ nama: r.ranah, nilai: r.nilai, sub: baru(`${r.soal.toLocaleString("id-ID")} jawaban`) }))) +
    srTabel(kata("metrik.kompetensi.label"), ["Ranah", "Penguasaan rata-rata"], ranah.map((r) => [r.ranah, pct(r.nilai)]));
  const kesiapanMapel = (["Matematika", "IPA"] as const).map((m) => { const xs = s.kesiapan.filter((x) => x.paket.mapel === m); return { m, cukup: xs.filter((x) => x.keadaan === "cukup").length, n: xs.length, kurang: xs.filter((x) => x.keadaan !== "cukup").map((x) => `Kelas ${x.kelas}`) }; });
  const html = shellStaf(DEKAN, "Ringkasan Sekolah", halaman({ lingkup: [D.SEKOLAH], alis: kata("laporan.institusi.judul"), h1: D.SEKOLAH, cakupan: kata("laporan.cakupan.sekolah", persona, { waktu: D.WAKTU }),
    inti: inti(kalimat, sub, `<p class="cl-arti">${esc(kata("metrik.kompetensi.arti"))}</p>` + visual, kata("metrik.kompetensi.label")),
    bagian: [
      bagian("cl-angka", baru("Angka sekolah"), `<div class="cl-angka-baris">
        ${angka(kata("metrik.peserta_institusi.label"), s.peserta.toLocaleString("id-ID"), [baru(`dari ${s.terdaftar.toLocaleString("id-ID")} murid terdaftar`), kata("metrik.peserta_institusi.arti")])}
        ${angka(kata("metrik.kenaikan_institusi.label"), `+${bulat(s.kenaikan)} <small>${esc(baru("poin"))}</small>`, [baru(`dari ${s.keduanya.toLocaleString("id-ID")} hasil dengan Pemetaan Awal dan Uji Penguasaan`), kata("metrik.kenaikan_institusi.arti")])}
        ${angka(kata("metrik.gerbang_keselamatan.label"), pct((s.wajib.tepat / s.wajib.dari) * 100), [baru(`${s.wajib.tepat.toLocaleString("id-ID")} dari ${s.wajib.dari.toLocaleString("id-ID")} hasil Uji Penguasaan`), baru("Bagian hasil yang menjawab benar seluruh soal wajib.", "the catalogue's metrik.gerbang_keselamatan.arti says «murid»; the calculation counts Uji Penguasaan results (H31)")])}
        ${angka(kata("metrik.kredensial.label"), s.sertifikat.berlaku.toLocaleString("id-ID"), [baru(`dari ${s.sertifikat.terbit.toLocaleString("id-ID")} yang pernah terbit; ${s.sertifikat.dicabut} dicabut`), kata("metrik.kredensial.arti")])}</div>`),
      bagian("cl-angkatan", kata("metrik.perbandingan_kohort.label"), titikZona(s.angkatan.map((a) => ({ nama: baru(`Angkatan\u00a0${a.tahun}\u00a0(kelas\u00a0${a.tingkat})`), nilai: a.nilai, sub: baru(`${a.n} hasil`) }))) +
        srTabel(kata("metrik.perbandingan_kohort.label"), ["Angkatan", "Penguasaan rata-rata"], s.angkatan.map((a) => [`Angkatan ${a.tahun}`, pct(a.nilai)])),
        kata("metrik.perbandingan_kohort.arti") + " " + baru("Angkatan berbeda mempelajari bab yang berbeda, jadi ini perbandingan keadaan, bukan peringkat.")),
      bagian("cl-kesiapan", kata("pimpinan.kesiapan.judul"), `<ul class="cl-daftar">${kesiapanMapel.map((x) => `<li><span>${x.m}</span><span><strong>${x.cukup} ${esc(kata("siklus.dari"))} ${x.n} kelas</strong> ${esc(kata("pimpinan.kesiapan.cukup").toLowerCase())}${x.kurang.length ? `<br><small>${esc(`${x.kurang.join(", ")}: ${kata("pimpinan.kesiapan.belum_cukup").toLowerCase()}`)}</small>` : ""}</span></li>`).join("")}</ul><p class="cl-arti">${esc(kata("pimpinan.kesiapan.catatan"))}</p>`, "", true),
    ],
    aksi: tombol(kata("pimpinan.buka.simpul"), true) + tombol(kata("laporan.cetak")),
    langkah: [`Di PINTAR: Pimpinan › «${kata("pimpinan.buka.simpul")}» memuat angka setiap bagian sekolah, sampai ke kelas.`],
    kaki: [esc(kata("kesiapan.catatan")), esc(baru("Angka sekolah ini tidak menilai guru atau kelas mana pun.")), "CONTOH LAPORAN — DATA SIMULASI."] }));
  return { kode: "4-dekan", judul: "Ringkasan Sekolah", pembaca: "Dekan / Pimpinan", html, cetakJudul: `Ringkasan Sekolah · ${D.SEKOLAH} · semua tahun ajaran`, catatan: {
    tigaPuluh: `Learning is moving up across the school (+${bulat(s.kenaikan)} points since the Pemetaan Awal), and attention belongs to ${daftarKata(lemah.map((r) => r.ranah))}, the domains still under 60%. Every figure states its base; readiness of evidence is stated, not hidden.`,
    peta: ["`/dekan/ringkasan?simpul=…` (Ringkasan Sekolah, C1): `metrik.kompetensi`, `metrik.peserta_institusi`, `metrik.kenaikan_institusi`, `metrik.gerbang_keselamatan`, `metrik.kredensial`, `metrik.perbandingan_kohort`; the coverage line `laporan.cakupan.sekolah` (every school year, no year claimed)", "Evidence readiness per class: `/pimpinan` («Kesiapan bukti»)", "«Sertifikat terbit» is MC-1 (`calc_institution_verified_credentials`): certificates issued and not revoked, out of all issued (R4-03). Issuance itself is the certificate service's; the simulation stands in for it."],
    visual: [["Lead: «Capaian kompetensi», one dot per domain on a 0–100% scale, PINTAR's band zones named once", "A dot plot instead of bars: the question is «where on the scale is each domain», and the band zones answer «is it a concern» without a legend. Sorted high to low; a domain below 60% is amber and names its band. The band names are a legend above the scale (R4-01), and a value that rounding would carry across a boundary shows one decimal (59,6%, R4-02)."],
      ["Headline figures, each with its base", "Existing «Angka utama»: four numbers a leader needs, none standing alone («Numbers never stand alone»)."],
      ["Perbandingan angkatan on the same zoned scale", "Existing figure, same visual as the lead so the eye does not relearn it; captioned as a comparison of states, not a ranking."]],
    privasi: ["School aggregates only: no class, teacher or student is named in the figures. The only class names are where evidence is not yet enough."],
    tanya: ["«Angkatan 2026 (kelas 7)»: is «angkatan» by entry year the school's usage? Dr Gladys."] } };
}

// ═════════════════════════════════════════════════════════════════════════════
// 5 · PENDIDIK SEBAGAI PESERTA — own professional-learning results
// ═════════════════════════════════════════════════════════════════════════════
function laporanPesertaPD(): Laporan {
  laporanKini = "peserta-pd"; hurufKini = 0;
  const persona: Persona = "staff";
  const a = D.PESERTA.find((p) => p.nama === "Andi Nugroho")!;
  const total = D.pdSkor(a.akhir!), awal = D.pdSkor(a.awal!), maks = D.PAKET_PD.topik.length * 4;
  const ulang = D.PAKET_PD.topik.filter((_, i) => a.akhir![i] < 3);
  const baik = D.PAKET_PD.topik.filter((_, i) => a.akhir![i] === 4);
  const kalimat = baru(`${D.pdTercapai(a.akhir!) ? "Target tercapai" : "Belum mencapai target"}: ${total} dari ${maks} soal tepat, naik dari ${awal} pada Pemetaan Awal.`);
  const sub = ulang.length ? baru(`Paling kuat: ${daftarKata(baik)}. Pelajari lagi: ${daftarKata(ulang)}.`) : "";
  const langkah = `<ol class="pds-steps cl-urutan" aria-label="${esc(baru("Langkah Anda"))}">${[kata("cycle.step.pretest"), baru(`Pelajaran (${a.pelajaran} dari ${D.PAKET_PD.pelajaran})`), kata("cycle.step.posttest"), kata("siklus.di.hasil")].map((x, i) => `<li data-keadaan="selesai"><span class="cl-urutan-no">${i + 1}</span>${esc(x)}<span class="pds-sr"> (selesai)</span></li>`).join("")}</ol>`;
  const html = shellStaf(PESERTA_PD, "Hasil pengembangan profesi", halaman({ lingkup: ["Pembelajaran Saya", kata("pengembangan.eyebrow")], alis: kata("pengembangan.eyebrow"), h1: D.PAKET_PD.judul, cakupan: baru(`Hasil Anda sendiri, sampai ${D.WAKTU}.`),
    inti: inti(kalimat, sub, langkah + awalAkhir(D.PAKET_PD.topik.map((t, i) => ({ nama: t, awal: a.awal![i], akhir: a.akhir![i], maks: 4, target: 3, sub: `${a.akhir![i]} ${kata("siklus.dari")} 4${a.akhir![i] < 3 ? " · " + baru("pelajari lagi") : ""}` })), baru("Target paket ini")), baru("Langkah dan hasil per bagian")),
    bagian: [bagian("cl-arti-pd", baru("Tentang hasil ini"), `<p class="cl-arti">${esc(kata("pengembangan.arti"))}</p><p class="cl-arti">${esc(baru("Hasil ini terlihat oleh Anda, fasilitator paket ini, Kepala departemen yang membawahi pengembangan profesi, dan Dekan. Admin sekolah hanya melihat pendaftaran, keikutsertaan, dan penyelesaian; guru lain tidak melihatnya. Jawaban Anda per soal tidak ditampilkan kepada mereka.", "who may see the result, as ruled (D-069(b)); integrity signals are not shown to anyone (D-069(c))"))}</p>`)],
    aksi: tombol(kata("siklus.target.lihat_ulang"), true) + tombol(kata("siklus.lihat_sertifikat")),
    langkah: [`Di PINTAR: Pembelajaran Saya › ${D.PAKET_PD.judul} › «${kata("siklus.target.lihat_ulang")}».`, "Sertifikat paket ini ada di Sertifikat."],
    kaki: [esc(kata("siklus.delta_arti")), esc(baru(`Target paket ini: ${D.TARGET}% (15 dari 20 soal); per bagian, 3 dari 4.`)), "CONTOH LAPORAN — DATA SIMULASI."] }));
  // Report 5 fits one A4 page: a little less space between its blocks on paper (the type stays at 10 pt).
  const htmlRingkas = html.replace('class="cl-isi"', 'class="cl-isi cl-ringkas"');
  return { kode: "5-peserta-pd", judul: "Hasil pengembangan profesi · peserta", pembaca: "Pendidik sebagai peserta", html: htmlRingkas, cetakJudul: `Pengembangan profesi · ${D.PAKET_PD.judul} · Andi Nugroho · ${D.SEKOLAH}`, catatan: {
    tigaPuluh: "The package is finished and its target reached; each part shows where the educator started and ended, and the one part to study again is named. It is the educator's own record, never a performance rating.",
    peta: ["The educator's own result in «Pembelajaran Saya» (`/belajar/[tugas]/hasil` for a PD package): Pemetaan Awal, Uji Penguasaan, target, «Pelajari lagi»; the record's meaning `pengembangan.arti`", "Steps: the named steps (`pds-steps`, corrected 4 Nov)"],
    visual: [["Named steps, all done", "Existing step list: where the educator is in the package."], ["Lead: per part, Pemetaan Awal → Uji Penguasaan on a 0–4 scale with the target at 3", "**Candidate VI-C7**, the same as the learner's report so one grammar serves both: growth against the package's own target, nothing else."]],
    privasi: ["The educator's own result. The page says who else may see the result (D-069(b)) and that answers are shown to no one else."],
    tanya: ["The sentence on who may see the result is new; owner: is it right to state it here (D-069(b), (c))?"] } };
}

// ═════════════════════════════════════════════════════════════════════════════
// 6 · FASILITATOR — the activity, participant by participant
// ═════════════════════════════════════════════════════════════════════════════
const statusLembar = (x: number[] | null) => x ? kata("pengembangan.status.SELESAI") : kata("pengembangan.status.BELUM");
const tandaLangkah = (ya: boolean, teks: string) => `<span class="cl-langkah"${ya ? "" : " data-belum"}>${esc(teks)}</span>`;
function laporanFasilitator(): Laporan {
  laporanKini = "fasilitator"; hurufKini = 0;
  const ps = D.PESERTA;
  const mulai = ps.filter((p) => p.mulai).length, selesai = ps.filter((p) => p.akhir).length, belumMulai = ps.filter((p) => !p.mulai);
  const kalimat = baru(belumMulai.length ? `${daftarKata(belumMulai.map((p) => p.nama))} belum mulai.` : "Semua peserta sudah mulai.", "owner, 7 Nov: no aggregate participation headline (D-069(b)); the lead names who has not begun");
  const sub = baru("Peserta menurut abjad. Hasil terlihat per orang, tidak dijumlahkan dan tidak diurutkan.");
  const segmen = (n: number) => `<span style="white-space:nowrap"><span class="cl-segmen" aria-hidden="true">${Array.from({ length: D.PAKET_PD.pelajaran }, (_, i) => `<i${i < n ? " data-isi" : ""}></i>`).join("")}</span>${n} ${esc(kata("siklus.dari"))} ${D.PAKET_PD.pelajaran}</span>`;
  const kisi = `<p class="cl-paket"><strong>${esc(kata("pengembangan.kolom.paket"))}:</strong> ${esc(D.PAKET_PD.judul)}</p><div class="cl-kisi-wadah"><table class="cl-kisi cl-zebra cl-kisi-pd"><colgroup><col class="cl-kol-nama"><col><col><col class="cl-kol-segmen"><col><col><col></colgroup><caption class="pds-sr">${esc(`${kata("pengembangan.judul")} · ${D.PAKET_PD.judul}`)}</caption><thead><tr><th scope="col">${esc(baru("Peserta"))}</th><th scope="col">${esc(kata("pengembangan.kolom.mulai"))}</th><th scope="col">${esc(kata("pengembangan.kolom.pemetaan"))}</th><th scope="col">${esc(kata("pengembangan.kolom.pelajaran"))}</th><th scope="col">${esc(kata("pengembangan.kolom.penguasaan"))}</th><th scope="col">${esc(kata("pengembangan.kolom.hasil"))}</th><th scope="col">${esc(kata("pengembangan.kolom.selesai"))}</th></tr></thead><tbody>
    ${ps.map((p) => `<tr><th scope="row">${esc(p.nama)}<br><small style="color:var(--ink-2)">${esc(p.akun ? p.peran : kata("pengembangan.daftar.PENDING"))}</small></th>
      <td>${tandaLangkah(p.mulai, p.mulai ? kata("pengembangan.ya") : kata("pengembangan.belum"))}</td><td>${tandaLangkah(!!p.awal, statusLembar(p.awal))}</td><td>${segmen(p.pelajaran)}</td><td>${tandaLangkah(!!p.akhir, statusLembar(p.akhir))}</td>
      <td>${p.akhir ? esc(D.pdTercapai(p.akhir) ? kata("pengembangan.tercapai") : kata("pengembangan.belum_tercapai")) : `<span class="cl-sel-kosong">—</span>`}</td><td>${tandaLangkah(!!p.akhir, p.akhir ? kata("pengembangan.ya") : kata("pengembangan.belum"))}</td></tr>`).join("")}</tbody></table></div>`;
  const html = shellStaf(FASIL, kata("pengembangan.judul"), halaman({ lingkup: [D.SEKOLAH, kata("pengembangan.eyebrow"), D.PAKET_PD.judul], alis: `${kata("pengembangan.eyebrow")} · ${D.SEKOLAH}`, h1: kata("pengembangan.judul"), cakupan: baru(`${D.PAKET_PD.judul} · ${ps.length} peserta · sampai ${D.WAKTU}.`),
    inti: inti(kalimat, sub, kisi, baru("Langkah setiap peserta")),
    bagian: [bagian("cl-arti-f", baru("Tentang catatan ini"), `<p class="cl-arti">${esc(kata("pengembangan.arti"))}</p><p class="cl-arti">${esc(baru("Jawaban peserta dan catatan integritas tidak ditampilkan di sini."))}</p>`)],
    aksi: tombol(kata("pengembangan.buka"), true) + tombol(kata("laporan.cetak")),
    langkah: [`Di PINTAR: «${kata("pengembangan.buka")}» pada setiap peserta memuat langkahnya satu per satu.`],
    kaki: [esc(baru("Tanda —: belum ada.")), "CONTOH LAPORAN — DATA SIMULASI."] }));
  return { kode: "6-fasilitator", judul: "Catatan pengembangan profesi · fasilitator", pembaca: "Fasilitator", html, cetakJudul: `Pengembangan profesi · ${D.PAKET_PD.judul} · ${D.SEKOLAH}`, catatan: {
    tigaPuluh: "Who has started, who is part-way and who has finished, person by person, and who has not begun. Results are there for each person (as the facilitator is entitled), never added up or ranked.",
    peta: ["`/pengembangan/[simpul]` for the facilitator: the columns «Sudah mulai · Pemetaan Awal · Pelajaran selesai · Uji Penguasaan · Hasil · Selesai» (`pengembangan.kolom.*`), «Terdaftar, akun belum diaktifkan»"],
    visual: [["Lead: one row per participant, one column per step; a filled dot when done, a short dash when not yet; lessons as five small squares", "**Candidate VI-C5** (progression path), as a table: the pattern of the group is visible at a glance (the empty right-hand side), while every cell stays a person's own fact. No column totals."]],
    privasi: ["Individual results for the facilitator (D-069(b)); no answers, no integrity signals (D-069(c)); alphabetical, never ordered by result."],
    tanya: ["**Ruled (owner, 7 Nov):** no aggregate participation headline (D-069(b)). The lead names who has not begun; every other fact stays in its person's row."] } };
}

// ═════════════════════════════════════════════════════════════════════════════
// 7 · ADMIN SEKOLAH — what waits on the school's administration
// ═════════════════════════════════════════════════════════════════════════════
function laporanAdmin(): Laporan {
  laporanKini = "admin"; hurufKini = 0;
  const persona: Persona = "staff";
  const tanpaAkun = D.KELAS.map((k) => ({ k: k.nama, n: k.murid.length, belum: k.murid.filter((m) => !m.akun).sort((a, b) => a.nama.localeCompare(b.nama, "id")) }));
  const kelasBelum = tanpaAkun.filter((x) => x.belum.length);
  const stafBelum = D.PESERTA.filter((p) => !p.akun);
  const nAkun = kelasBelum.reduce((a, b) => a + b.belum.length, 0) + stafBelum.length;
  const PENDATAAN = 1, STUDIO = 3;
  const menunggu = [[PENDATAAN, "config.menunggu.pendataan"], [nAkun, "config.menunggu.aktivasi"], [STUDIO, "config.menunggu.studio"]] as const;
  // R7-04: why each person cannot sign in, as PINTAR knows it; a class card is the remedy for only one of them.
  const murid = D.KELAS.flatMap((k) => k.murid.filter((m) => !m.akun));
  const per = (al: D.Alasan) => D.KELAS.map((k) => ({ k: k.nama, orang: k.murid.filter((m) => !m.akun && m.alasan === al).sort((a, b) => a.nama.localeCompare(b.nama, "id")) })).filter((x) => x.orang.length);
  const kartu = per("kartu"), aktivasi = per("aktivasi"), data = per("data");
  const jml = (g: Array<{ orang: unknown[] }>) => g.reduce((a, b) => a + b.orang.length, 0);
  const nKartu = jml(kartu), nAktivasi = jml(aktivasi), nData = jml(data);
  const kalimat = baru(`${nAkun} orang belum bisa masuk: ${nKartu} murid belum punya kartu kelas, ${nAktivasi} murid belum memakai kartunya, ${nData} murid menunggu Pendataan, dan ${stafBelum.length} guru belum mengaktifkan akun emailnya.`);
  const sub = baru(`Di ${tanpaAkun.length - kelasBelum.length} dari ${tanpaAkun.length} kelas, semua murid sudah bisa masuk.`);
  // Aktivasi lists those already in the school's data: not the two whose data still waits in Pendataan.
  const menungguBenar = menunggu.map(([n, k]) => [k === "config.menunggu.aktivasi" ? nKartu + nAktivasi + stafBelum.length : n, k] as const);
  const daftarMenunggu = `<ul class="pds-list">${menungguBenar.map(([n, k]) => `<li><a href="#" class="pds-list-row"><strong><span class="cl-nilai">${n}</span> ${esc(kata(k))}</strong>${ikon("chevron-right")}</a></li>`).join("")}</ul>`;
  const namaPerKelas = (g: Array<{ k: string; orang: D.Murid[] }>) => `<ul class="cl-daftar">${g.map((x) => `<li><span><strong>Kelas ${x.k}</strong> · ${x.orang.length} murid<br><small>${esc(x.orang.map((m) => m.nama).join(", "))}</small></span><span></span></li>`).join("")}</ul>`;
  // R7-02: one selection across classes, one operation, one printed batch. Screen only; paper says the same as text.
  const kelasKartu = kartu.map((x) => x.k).join(", ");
  const caraHariIni = `Di PINTAR: Aktivasi akun › «${kata("aktivasi.kelas.banyak.judul")}»: «${kata("aktivasi.kelas.banyak.semua")}» (${kelasKartu}), lalu «${kata("aktivasi.kelas.banyak.tombol").replace("{murid}", String(nKartu))}» dan «${kata("aktivasi.kelas.cetak")}».`;
  const pilih = `<div class="cl-layar-saja">
    <form class="cl-pilih" onsubmit="return false"><fieldset><legend class="cl-h3">${esc(kata("aktivasi.kelas.banyak.judul"))}</legend>
    <label class="pds-choice"><input type="checkbox" class="pds-check" id="cl-semua" checked><span><strong>${esc(kata("aktivasi.kelas.banyak.semua"))}</strong></span><small>${esc(baru(`${nKartu} murid di ${kartu.length} kelas`))}</small></label>
    ${kartu.map((x) => `<label class="pds-choice"><input type="checkbox" class="pds-check" name="cl-kelas" checked><span>Kelas ${x.k} · ${x.orang.length} murid</span><small>${esc(x.orang.map((m) => m.nama).join(", "))}</small></label>`).join("")}</fieldset>
    <p class="cl-arti">${esc(baru(`${kata("aktivasi.kelas.banyak.terpilih").replace("{murid}", String(nKartu)).replace("{kelas}", String(kartu.length))} Tidak termasuk: ${nAktivasi} murid yang sudah punya kartu dan ${nData} murid yang datanya masih di Pendataan. Setiap kartu tetap dibuat dan dicatat untuk muridnya masing-masing; semua kartu dicetak dalam satu lembar.`))}</p>
    <div class="cl-aksi"><button type="submit" class="pds-btn pds-btn-primary">${esc(kata("aktivasi.kelas.banyak.tombol").replace("{murid}", String(nKartu)))}</button></div></form></div>
    <div class="cl-cetak-saja">${namaPerKelas(kartu)}<p class="cl-arti">${esc(caraHariIni)}</p></div>`;
  const grup = (id: string, judul: string, isi: string, arti: string) => `<section class="cl-grup" aria-labelledby="${id}"><h3 id="${id}" class="cl-h3">${esc(judul)}</h3><p class="cl-arti">${esc(arti)}</p>${isi}</section>`;
  const perKelas = [
    grup("cl-g-kartu", baru(`Belum punya kartu kelas (${nKartu} murid)`), pilih, baru("Datanya sudah lengkap; yang dibutuhkan hanya kartunya.")),
    grup("cl-g-aktivasi", baru(`Sudah punya kartu, belum dipakai untuk masuk (${nAktivasi} murid)`), namaPerKelas(aktivasi), baru("Kartu baru tidak diperlukan. Akun mereka aktif saat mereka masuk pertama kali dengan nomor kartu dan PIN-nya.")),
    grup("cl-g-data", baru(`Menunggu Pendataan (${nData} murid)`), namaPerKelas(data), baru("Kartu belum bisa dibuat sampai pendataannya disetujui di Pendataan.")),
    grup("cl-g-staf", baru(`Guru: akun email belum diaktifkan (${stafBelum.length})`), `<ul class="cl-daftar">${stafBelum.map((p) => `<li><span><strong>${esc(p.nama)}</strong> · ${esc(p.peran)}<br><small>${esc(kata("pengembangan.daftar.PENDING"))}</small></span><span></span></li>`).join("")}</ul>`, `${kata("aktivasi.surel_arti")} ${kata("aktivasi.halaman_masuk")}${kata("aktivasi.surel_arti.lalu")}`),
  ].join("");
  const pdBelum = D.PESERTA.filter((p) => !p.akhir);
  const pd = `<ul class="cl-daftar">${pdBelum.map((p) => `<li><div><strong>${esc(p.nama)}</strong><br><small>${esc(p.akun ? kata("pengembangan.daftar.ACTIVE") : kata("pengembangan.daftar.PENDING"))}</small></div><span>${tandaLangkah(p.mulai, `${kata("pengembangan.kolom.mulai")}: ${p.mulai ? kata("pengembangan.ya") : kata("pengembangan.belum")}`)} &nbsp; ${tandaLangkah(!!p.awal, `${kata("pengembangan.kolom.pemetaan")}: ${statusLembar(p.awal)}`)}</span></li>`).join("")}</ul><p class="cl-arti">${esc(kata("pengembangan.arti_terbatas"))}</p>`;
  const html = shellStaf(ADMIN, kata("config.title"), halaman({ lingkup: [D.SEKOLAH, kata("config.title")], alis: kata("config.title"), h1: D.SEKOLAH, cakupan: baru(`Pekerjaan administrasi yang belum selesai, sampai ${D.WAKTU}.`),
    inti: inti(kalimat, sub, daftarMenunggu, kata("config.menunggu.judul")),
    bagian: [bagian("cl-akun", baru("Yang belum bisa masuk"), perKelas, kata("aktivasi.intro").split(".")[0] + "."),
      bagian("cl-pd", baru(`${kata("pengembangan.eyebrow")}: yang belum selesai`), pd)],
    aksi: tombol(baru("Buka Aktivasi akun")) + tombol(baru("Buka Pendataan")),
    langkah: [caraHariIni, `Di PINTAR: Pendataan › ${PENDATAAN} pendataan menunggu persetujuan (${nData} murid).`, `Di PINTAR: Studio › ${STUDIO} paket menunggu tindakan atau tinjauan.`],
    kaki: [esc(baru("Laporan ini mengumpulkan yang sudah ada di Konfigurasi, Aktivasi akun, Pendataan, dan catatan pengembangan profesi.")), "CONTOH LAPORAN — DATA SIMULASI."] }));
  return { kode: "7-admin", judul: "Pekerjaan administrasi · Admin sekolah", pembaca: "Admin Sekolah", html, cetakJudul: `Konfigurasi · ${D.SEKOLAH} · ${D.TAHUN}`, catatan: {
    tigaPuluh: `Who cannot sign in yet (${nAkun} people) and why, grouped by reason with the one remedy for each; what else waits on the administrator, and who has not finished the professional-learning package: each with the one action that resolves it.`,
    peta: ["Konfigurasi's «Yang menunggu» (`config.menunggu.*`, B1, UX-33)", "Aktivasi akun: who waits for an account, per class (`aktivasi.kelas.*`), «Buat kartu kelas», «Aktifkan dengan email»", "`/pengembangan/[simpul]` for Admin sekolah: enrolment, participation and completion only (`pengembangan.arti_terbatas`)",
      "**One page that gathers these does not exist today**: this specimen places existing lists side by side (see the questions)."],
    visual: [["Lead: the «Yang menunggu» rows, each a count that opens where the work is done", "Existing (B1). An exception summary: only what waits is shown."], ["«Yang belum bisa masuk», one group per reason (R7-04)", "No card yet · a card not used yet · data still in Pendataan · a teacher's email account not activated. A class card is the remedy for the first group only, and the page says so."], ["The bulk card selection (R7-02)", "«Pilih semua» and one checkbox per class, the number selected and who is excluded and why, then one action and one printed batch. On paper it becomes the same instruction as text (R7-03, G-06)."]],
    privasi: ["No assessment result, score or answer. The professional-learning part shows enrolment, start and Pemetaan Awal status only (D-069(b): Admin sekolah sees enrolment, participation and completion)."],
    tanya: ["Owner: a single administration summary is new presentation over existing pages. Wanted, or keep Konfigurasi's «Yang menunggu» as the summary?", "**Engineering (hand-off H30):** today one press makes the cards for every student without an account in **one** class (`aktivasi.kelas.arti`) and prints them as a batch. Choosing several classes at once, «Pilih semua», and the selected/excluded counts extend that same workflow; no second card system. The four sign-in states shown here must be read from the real account and Pendataan states."] } };
}

// ── build ────────────────────────────────────────────────────────────────────
const LAPORAN = [laporanMurid(), laporanGuru("7A", "M7"), laporanGuru("7E", "M7"), laporanKadep(), laporanDekan(), laporanPesertaPD(), laporanFasilitator(), laporanAdmin()];
const tokens = readFileSync(join(DS, "render/tokens.css"), "utf8").replace(/url\("\/(fonts\/[^"]+)"\)/g, (_, f) => `url("file://${repo}/public/${f}")`);
const bundleCss = readFileSync(join(DS, "project/components/bundle.css"), "utf8");
const bundleJs = readFileSync(join(DS, "project/components/bundle.js"), "utf8");
const GAYA = readFileSync(join(sini, "contoh.css"), "utf8");
const RENDER = join(sini, "render"); mkdirSync(RENDER, { recursive: true });
const require = createRequire(join(repo, "package.json"));
const { chromium } = require("playwright");
const axe = readFileSync(join(repo, "node_modules/axe-core/axe.min.js"), "utf8");
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const laporanTeks: string[] = [];
let gagal = 0;
for (const l of LAPORAN) {
  const html = `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(l.judul)} · CONTOH</title><style>${tokens}</style><style>${bundleCss}</style><style>${GAYA}</style><style>@page { @top-right { content: "${l.cetakJudul.replace(/"/g, "")}"; } }</style><script>${bundleJs}</script></head><body>${l.html}<script>Pintar.siapkan();</script></body></html>`;
  writeFileSync(join(sini, `${l.kode}.html`), html);
  const masalah: string[] = [];
  for (const w of [1280, 390]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.goto(`file://${join(sini, `${l.kode}.html`)}`); await page.evaluate(() => document.fonts.ready);
    const lebar = await page.evaluate(() => document.documentElement.scrollWidth) as number;
    if (lebar > w + 1) masalah.push(`sideways scroll ${lebar} at ${w}`);
    await page.screenshot({ path: join(RENDER, `${l.kode}-${w}.png`), fullPage: true });
    if (w === 1280) {
      await page.addScriptTag({ content: axe });
      const v = await page.evaluate(`axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } }).then(function (r) { return r.violations.map(function (v) { return v.id + " (" + v.nodes.length + ": " + v.nodes.slice(0,2).map(function(n){return n.target.join(" ");}).join(" | ") + ")"; }); })`) as string[];
      masalah.push(...v.map((x) => `axe ${x}`));
      await page.emulateMedia({ media: "print" });
      await page.pdf({ path: join(RENDER, `${l.kode}-a4.pdf`), preferCSSPageSize: true, printBackground: true });
      laporanTeks.push(`${l.kode}: ${execSync(`pdfinfo "${join(RENDER, `${l.kode}-a4.pdf`)}"`).toString().match(/Pages:\s+(\d+)/)?.[1]} A4 pages`);
      execSync(`rm -f "${join(RENDER, l.kode)}"-a4-*.png`);
      execSync(`pdftoppm -r 80 -png "${join(RENDER, `${l.kode}-a4.pdf`)}" "${join(RENDER, `${l.kode}-a4`)}"`);
    }
    await ctx.close();
  }
  if (masalah.length) gagal++;
  laporanTeks.push(`${masalah.length ? "FAIL" : "ok  "} ${l.kode}${masalah.length ? "\n      " + masalah.join("\n      ") : ""}`);
}
await browser.close();
writeFileSync(join(sini, "baru.json"), JSON.stringify(BARU, null, 1));
writeFileSync(join(sini, "catatan.json"), JSON.stringify(LAPORAN.map((l) => ({ kode: l.kode, judul: l.judul, pembaca: l.pembaca, ...l.catatan })), null, 1));
writeFileSync(join(RENDER, "laporan.txt"), `${LAPORAN.length} reports, 1280 and 390 px, A4: ${gagal} with a failure\n${laporanTeks.join("\n")}\n`);
console.log(readFileSync(join(RENDER, "laporan.txt"), "utf8"));
