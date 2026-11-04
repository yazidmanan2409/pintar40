/**
 * C1 part B · W3.8 — the bodies of the Management routes (/pimpinan …) and the
 * professional-learning record (/pengembangan/[simpul]). Shells and behaviour are built
 * and stay; this lays out their bodies in the design system. Specimen, not application code.
 *
 *   npx tsx docs/coordination/ux/completion-4.0/C1/buat-c1b.mts
 *
 * Words: the copy table at 0b19707 (staff persona, as the pages ask), plus the one new key
 * in NEW (PIMPINAN.md §5). People, places and figures are invented.
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
const kerja = mkdtempSync(join(tmpdir(), "c1b-"));
for (const f of ["hle.ts", "tanggal.ts"]) writeFileSync(join(kerja, f), execSync(`git show 0b19707:src/lib/${f}`, { cwd: repo }));
const hle = await import(join(kerja, "hle.ts"));
export const NEW: Record<string, { id: string; en: string }> = {
  "pengembangan.pelajaran_dari": { id: "{n} dari {m}", en: "{n} of {m}" },
  "pengembangan.ditolak": { id: "Catatan ini untuk fasilitator, Kepala departemen, Dekan, dan Admin sekolah tempat ini.", en: "This record is for the facilitator, the Head of department, the Dean and the school administrator of this place." },
};
const kata = (k: string, isi: Record<string, string | number> = {}, persona = "staff") => {
  let v: string = NEW[k] ? NEW[k].id : hle.t(k, persona, { locale: "id" });
  if (!v || v === k || v === "—") throw new Error(`no words for ${k}`);
  for (const [a, b] of Object.entries(isi)) v = v.replace(`{${a}}`, String(b));
  return v;
};
const angka = (n: number) => hle.format.number(n, "id");
const persen = (x: number) => hle.format.percent(x, "id");
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const ikon = (n: string) => `<i data-ikon="${n}"></i>`;
const slotMerek = `<span class="c1-slot" role="img" aria-label="Pintar (master pending F-11)">Pintar <small>(master pending F-11)</small></span>`;
const SEKOLAH = "SMP Cahaya Kaliandra";

// ── the shell ────────────────────────────────────────────────────────────────
type Pembaca = { inisial: string; nama: string; peran: string; tempat: Array<[string, string]> };
const KADEP: Pembaca = { inisial: "EP", nama: "Eko Prasetyo", peran: `Kepala departemen · ${SEKOLAH}`, tempat: [["Pimpinan", "chart-no-axes-column"], ["Studio", "square-pen"]] };
const ADMIN: Pembaca = { inisial: "DS", nama: "Dewi Saraswati", peran: `Admin sekolah · ${SEKOLAH}`, tempat: [["Konfigurasi", "settings"], ["Pendataan", "file-spreadsheet"], ["Aktivasi akun", "user-check"], ["Studio", "square-pen"]] };
function shell(p: Pembaca, judul: string, isi: string): string {
  return `<div class="pds pds-jalan c1">
  <section class="pds-lewati-induk" data-shell data-shell-statis aria-label="${esc(judul)}">
  <a class="pds-lewati" href="#c1-isi">Langsung ke isi</a>
  <div class="pds-shell-host"><div class="pds-shell">
    <nav class="pds-nav" aria-label="${kata("nav.tempat")}">
      <div class="pds-nav-kepala">${slotMerek}</div>
      <ul class="pds-nav-daftar">${p.tempat.map(([t, i], n) => `<li><a href="#" class="pds-nav-item"${n === 0 ? ' aria-current="page"' : ""}>${ikon(i)}<span class="pds-nav-label">${t}</span></a></li>`).join("")}</ul>
      <div class="pds-nav-bawah"><div class="pds-identity" style="cursor:default"><span class="pds-avatar" aria-hidden="true">${p.inisial}</span><div><strong>${p.nama}</strong><small>${p.peran}</small></div></div>
      <button type="button" class="pds-nav-item pds-nav-keluar">${ikon("log-out")}<span class="pds-nav-label">${kata("sesi.keluar")}</span></button></div>
    </nav>
    <div class="pds-main">
      <header class="pds-bar">${slotMerek}<span class="pds-bar-tempat" aria-hidden="true">${p.tempat[0][0]}</span><button type="button" class="pds-btn pds-btn-secondary">${kata("sesi.keluar")}</button><button type="button" class="pds-btn pds-btn-icon" aria-label="${kata("nav.menu")}">${ikon("menu")}</button></header>
      <main class="pds-main-isi c1-isi-utama" id="c1-isi" tabindex="-1">${isi}</main>
    </div>
  </div></div></section></div>`;
}
const lingkup = (...t: string[]) => t.length >= 3 ? `<ol class="pds-scope" aria-label="Lokasi">${t.map((x, i) => `<li>${i === t.length - 1 ? `<span aria-current="page">${esc(x)}</span>` : `<a href="#">${esc(x)}</a>`}</li>`).join("")}</ol>` : "";
const kembali = (teks: string) => `<p><a href="#" class="pds-back">${ikon("chevron-left")}${esc(teks)}</a></p>`;
const kepala = (o: { kembali?: string; alis?: string; h1: string; intro?: string; meta?: string }) => `<div class="pds-pagehead"><div>${o.kembali ? kembali(o.kembali) : ""}${o.alis ? `<p class="c1-alis-biasa">${esc(o.alis)}</p>` : ""}<h1 class="pds-title">${esc(o.h1)}</h1>${o.intro ? `<p class="pds-intro">${esc(o.intro)}</p>` : ""}${o.meta ? `<p class="pds-help">${esc(o.meta)}</p>` : ""}</div></div>`;
const bagian = (id: string, judul: string, isi: string, sub?: string) => `<section class="pds-section" aria-labelledby="${id}"><h2 id="${id}">${esc(judul)}</h2>${sub ? `<p class="pds-intro">${esc(sub)}</p>` : ""}${isi}</section>`;
const barisTautan = (b: Array<[string, string?]>) => `<ul class="pds-list">${b.map(([t, small]) => `<li><a href="#" class="pds-list-row"><strong>${esc(t)}</strong>${ikon("chevron-right")}${small ? `<small>${esc(small)}</small>` : ""}</a></li>`).join("")}</ul>`;
const kosong = (t: string) => `<div class="pds-empty"><p>${esc(t)}</p></div>`;

// figures: the same layout as Part A (AngkaTerkelola / KartuKetiadaan)
const angkaSatu = (label: string, nilai: string, makna: string, dari: number) => `<section class="c1-m c1-m-satu" aria-label="${esc(label)}"><p class="c1-m-judul">${esc(label)}</p><p class="c1-stat">${nilai}</p><p class="c1-kalimat">${esc(makna)}</p><p class="c1-meta">${kata("pimpinan.bukti.dari")} ${angka(dari)} ${kata("mengajar.bukti.murid", {}, "educator")}</p></section>`;
const ketiadaan = (label: string | null, ada?: [number, number], muncul?: string) => `<section class="c1-m c1-m-satu c1-m-belum${label ? "" : " c1-m-tanpa"}" aria-label="${esc(label ?? kata("laporan.metrik.bukan_untuk_anda"))}">${label ? `<p class="c1-m-judul">${esc(label)}</p>` : ""}<div class="c1-ket"><p>${kata(label ? "laporan.metrik.belum_cukup_data" : "laporan.metrik.bukan_untuk_anda")}</p>${ada ? `<p>${kata("ketiadaan.jumlah.murid", { have: angka(ada[0]), needed: angka(ada[1]) })}</p>` : ""}${muncul ? `<p>${kata(muncul)}</p>` : ""}</div></section>`;
const kesiapan = (c: number, b: number, a: number) => bagian("k-siap", kata("pimpinan.kesiapan.judul"), `<dl class="c1-isi">${[["pimpinan.kesiapan.cukup", c], ["pimpinan.kesiapan.belum_cukup", b], ["pimpinan.kesiapan.belum_ada", a]].map(([k, n]) => `<div><dt>${kata(k as string)}</dt><dd>${angka(n as number)}</dd></div>`).join("")}</dl><p class="c1-meta">${kata("pimpinan.kesiapan.catatan")}</p>`);

// ── /pimpinan ────────────────────────────────────────────────────────────────
type Kasus = { keadaan: "menunggu" | "ditangani" | "selesai"; keluarga: "integritas" | "pembelajaran" | "program"; tempat: string; tentang?: string; sejak: string; catatan?: string; hasil?: string; diputuskan?: string; pemutusLain?: boolean };
const NADA = { menunggu: ["pds-badge-attention", "circle-alert"], ditangani: ["pds-badge-info", "clock"], selesai: ["pds-badge-ok", "check"] } as const;
let nk = 0;
function kartu(k: Kasus): string {
  const id = `kp${++nk}`;
  const [nada, ik] = NADA[k.keadaan];
  const lencana = `<span class="pds-badge ${nada}">${ikon(ik)}${kata(k.pemutusLain ? "pimpinan.keadaan.menunggu_keputusan" : `pimpinan.keadaan.${k.keadaan}`)}</span>`;
  const rantai = `<dl class="c1b-rantai"><div><dt>${kata("pimpinan.rantai.didukung")}</dt><dd>${kata(`pimpinan.rantai.${k.keluarga}.didukung`)}</dd></div><div><dt>${kata("pimpinan.rantai.belum")}</dt><dd>${kata(`pimpinan.rantai.${k.keluarga}.belum`)}</dd></div><div><dt>${kata("pimpinan.rantai.langkah")}</dt><dd>${kata(`pimpinan.rantai.${k.keluarga}.langkah`)}</dd></div></dl>`;
  const kepalaK = `<div class="c1b-kp-kepala">${lencana}<span class="c1-meta">${esc(k.tempat)}</span></div><h3 id="${id}">${kata(`pimpinan.keluarga.${k.keluarga}`)}</h3>
    ${k.tentang ? `<p>${kata("pimpinan.tentang")} <strong>${esc(k.tentang)}</strong></p>` : ""}<p class="c1-meta">${kata("pimpinan.sejak")} ${k.sejak}${k.keluarga === "integritas" ? ` · ${kata("pimpinan.sumber.integrity_signals")}` : ""}</p>`;
  if (k.keadaan === "selesai") return `<li><article class="pds-panel c1b-kp c1b-kp-selesai" aria-labelledby="${id}">${kepalaK}
    <p><strong>${kata("pimpinan.rantai.keputusan")}:</strong> ${kata(`pimpinan.hasil.${k.hasil}`)} · ${kata("pimpinan.diputuskan")} ${k.diputuskan}</p>
    <details class="pds-disclosure c1b-rincian"><summary>${kata("pimpinan.rantai.didukung")} · ${kata("pimpinan.rantai.belum")} · ${kata("pimpinan.rantai.langkah")}${ikon("chevron-down")}</summary>${rantai}${k.catatan ? `<blockquote class="c1b-kutip">${esc(k.catatan)}</blockquote>` : ""}</details></article></li>`;
  const putuskan = k.pemutusLain ? `<p class="c1-meta">${kata("pimpinan.menunggu_pemutus_lain")}</p>` : `<form class="c1b-putus">${k.keadaan === "menunggu" ? `<div class="pds-actions"><button type="button" class="pds-btn pds-btn-secondary">${kata("pimpinan.aksi.ambil")}</button></div>` : ""}
      <div class="c1b-dua"><div class="pds-field"><label class="pds-label" for="${id}-h">${kata("pimpinan.aksi.pilih")}</label><span class="pds-select"><select id="${id}-h">${["tidak_ada", "pendampingan", "diteruskan"].map((h) => `<option>${kata(`pimpinan.hasil.${h}`)}</option>`).join("")}</select>${ikon("chevron-down")}</span></div>
      <div class="pds-field"><label class="pds-label" for="${id}-c">${kata("pimpinan.aksi.catatan")}</label><textarea id="${id}-c" class="pds-textarea" rows="2"></textarea></div></div>
      <div class="pds-actions"><button type="submit" class="pds-btn pds-btn-primary">${kata("pimpinan.aksi.putuskan")}</button></div></form>`;
  return `<li><article class="pds-panel c1b-kp" aria-labelledby="${id}">${kepalaK}${rantai}${k.catatan ? `<blockquote class="c1b-kutip">${esc(k.catatan)}</blockquote>` : ""}<h4>${kata("pimpinan.rantai.keputusan")}</h4>${putuskan}</article></li>`;
}
function pimpinan(nihil = false): string {
  const kasus: Kasus[] = nihil ? [{ keadaan: "selesai", keluarga: "pembelajaran", tempat: "Kelas 7B", sejak: "12 Okt 2026", hasil: "pendampingan", diputuskan: "20 Okt 2026", catatan: "Dibicarakan dengan wali kelas; pendampingan dua minggu." }] : [
    { keadaan: "menunggu", keluarga: "integritas", tempat: "Kelas 7A", tentang: "Rizky Maulana", sejak: "28 Okt 2026", catatan: "Jawaban Uji Penguasaan dikirim dalam waktu yang sangat singkat dibanding biasanya." },
    { keadaan: "ditangani", keluarga: "pembelajaran", tempat: "Kelas 7B", sejak: "30 Okt 2026" },
    { keadaan: "menunggu", keluarga: "program", tempat: "Matematika", sejak: "2 Nov 2026", pemutusLain: true },
    { keadaan: "selesai", keluarga: "pembelajaran", tempat: "Kelas 7B", sejak: "12 Okt 2026", hasil: "pendampingan", diputuskan: "20 Okt 2026" },
  ];
  const menunggu = kasus.filter((k) => k.keadaan !== "selesai").length;
  const judulHitung = menunggu === 0 ? kata("pimpinan.menunggu.nihil") : menunggu === 1 ? kata("pimpinan.menunggu.satu") : `<span class="c1b-angka">${angka(menunggu)}</span> ${kata("pimpinan.menunggu.banyak")}`;
  const pilih = `<nav class="c1b-lingkup" aria-label="${kata("pimpinan.lingkup.pilih")}"><span class="pds-label">${kata("pimpinan.lingkup.pilih")}</span><ul>${["Matematika", "Kelas 7A", "Kelas 7B"].map((n, i) => `<li><a href="#" class="pds-btn ${i === 0 ? "pds-btn-secondary c1b-kini" : "pds-btn-quiet"}"${i === 0 ? ' aria-current="page"' : ""}>${n}</a></li>`).join("")}</ul></nav>`;
  const keputusan = bagian("k-putus", kata("pimpinan.menunggu.judul"), `<p class="c1b-hitung">${judulHitung}</p>${menunggu > 1 ? `<p class="c1-meta">${kata("pimpinan.urutan")}</p>` : ""}<ul class="c1b-kartu">${kasus.map(kartu).join("")}</ul><p class="c1-meta">${kata("pimpinan.memutuskan")}</p>`);
  const bukti = bagian("k-bukti", kata("pimpinan.bukti.judul"), `<div class="c1-baris-satu">${angkaSatu(kata("metrik.peserta_institusi.label", {}, "educator"), angka(84), kata("metrik.peserta_institusi.arti", {}, "educator"), 84)}${angkaSatu(kata("metrik.kenaikan_institusi.label", {}, "educator"), `+${angka(12)} ${kata("mengajar.bukti.poin", {}, "educator")}`, kata("metrik.kenaikan_institusi.arti", {}, "educator"), 61)}${ketiadaan(kata("metrik.gerbang_keselamatan.label", {}, "educator"), [4, 10], "laporan.muncul.akhir")}</div>`);
  const kelas = bagian("k-kelas", kata("pimpinan.kelas.judul"), ["Kelas 7A", "Kelas 7B", "Kelas 7C"].map((n, i) => `<details class="pds-disclosure"${i === 0 ? " open" : ""}><summary><span>${n}</span><span class="pds-badge${i === 2 ? "" : " pds-badge-info"}">${kata(i === 2 ? "pimpinan.kelas.belum" : "pimpinan.kelas.ada")}</span>${ikon("chevron-down")}</summary>
    <div class="c1b-dalam"><p class="c1-meta">${kata("pimpinan.kelas.murid")} · ${angka(28 + i)}</p>${i === 0 ? `<div class="c1-baris-satu">${angkaSatu(kata("metrik.pemahaman.label", {}, "educator"), persen(0.72), kata("metrik.pemahaman.arti", {}, "educator"), 24)}${angkaSatu(kata("metrik.kenaikan.label", {}, "educator"), `+${angka(18)} ${kata("mengajar.bukti.poin", {}, "educator")}`, kata("metrik.kenaikan.arti", {}, "educator"), 22)}</div>` : ""}
    <div class="pds-actions"><a href="#" class="pds-btn pds-btn-quiet">${kata("pimpinan.laporan.kelas")}</a></div></div></details>`).join(""), kata("pimpinan.kelas.arti"));
  const perlu = bagian("k-perlu", kata("pimpinan.perlu_diketahui"), barisTautan([[kata("pimpinan.buka.simpul")], [kata("pimpinan.laporan.sekolah")]]), kata("pimpinan.perlu_diketahui.sub"));
  const pd = bagian("k-pd", kata("config.peserta.catatan"), barisTautan([["PD Guru Matematika (2026/2027)"]]));
  return shell(KADEP, kata("pimpinan.judul"), `${kepala({ alis: kata("pimpinan.eyebrow"), h1: kata("pimpinan.judul"), intro: kata("pimpinan.batas") })}${pilih}${keputusan}${bukti}${kelas}${kesiapan(3, 2, 1)}${perlu}${pd}`);
}
const tolak = (h1: string, kembaliKe: string, nama: string) => `<div class="pds c1"><main class="c1b-tolak" id="c1-isi" tabindex="-1"><section class="pds-section">${slotMerek}<h1 class="pds-title">${esc(h1)}</h1><p class="pds-intro">${kata("tolak.arti")}</p><div class="pds-actions"><a href="#" class="pds-btn pds-btn-primary">${esc(kembaliKe)}</a></div><p class="pds-help">${kata("sesi.sebagai")} <strong>${nama}</strong> · ${kata("sesi.bukan_anda")} <a href="#" class="pds-link">${kata("sesi.keluar")}</a></p></section></main></div>`;

// ── /pimpinan/[simpul] and the roster ───────────────────────────────────────
function simpul(): string {
  return shell(KADEP, "Matematika", `${kembali(kata("pimpinan.kembali"))}${kepala({ alis: kata("pimpinan.eyebrow"), h1: "Matematika" })}
    ${bagian("s-bukti", kata("pimpinan.bukti.judul"), `<div class="c1-baris-satu">${angkaSatu(kata("metrik.peserta_institusi.label", {}, "educator"), angka(84), kata("metrik.peserta_institusi.arti", {}, "educator"), 84)}${ketiadaan(null)}</div>`)}
    ${kesiapan(1, 1, 0)}
    ${bagian("s-ub", kata("umpanbalik.pimpinan.judul"), barisTautan([[kata("umpanbalik.pimpinan.buka")]]), kata("umpanbalik.pimpinan.sub"))}
    ${bagian("s-murid", kata("pimpinan.murid.judul"), barisTautan([[kata("pimpinan.murid.judul")]]), kata("pimpinan.murid.sub"))}
    ${bagian("s-lingkup", kata("pimpinan.lingkup.judul"), barisTautan([["Kelas 7A"], ["Kelas 7B"], ["Kelas 7C"]]))}`);
}
const NAMA = ["Adinda Putri", "Bagas Saputra", "Cahya Ramadhani", "Dimas Pratama", "Elok Wulandari", "Fajar Nugroho", "Gita Anggraini", "Hafiz Kurniawan", "Intan Permatasari", "Joko Susilo"];
function murid(isi: boolean): string {
  return shell(KADEP, kata("pimpinan.murid.judul"), `${kembali("Matematika")}${kepala({ alis: kata("pimpinan.eyebrow"), h1: kata("pimpinan.murid.judul"), intro: kata("pimpinan.murid.sub") })}
    <section class="pds-section" aria-labelledby="m-daftar"><h2 id="m-daftar" class="pds-sr">${kata("pimpinan.murid.judul")}</h2>${isi ? barisTautan(NAMA.map((n) => [n])) : kosong(kata("pimpinan.murid.kosong"))}</section>`);
}
function muridOrang(belum: boolean): string {
  const fakta: Array<[string, string]> = [[kata("pimpinan.rincian.program"), "Reguler"], [kata("pimpinan.rincian.periode"), "TA 2026/2027"], [kata("pimpinan.rincian.penempatan"), `${SEKOLAH} / Kelas 7A`], [kata("pimpinan.rincian.riwayat"), `Kelas 7B (2026/2027) · ${kata("pimpinan.rincian.sampai")} 15 Agu 2026 · ${kata("pimpinan.rincian.alasan.MOVED")}`]];
  const catatan = belum ? `${kosong(kata("pimpinan.rincian.belum"))}<p class="c1-meta">${kata("pimpinan.kesiapan.belum_cukup")}</p>` : `<ul class="pds-list">${[["jenis.mode.PRE_TEST", 0.48], ["jenis.mode.QUICK", 0.62], ["jenis.mode.POST_TEST", 0.79]].map(([m, v]) => `<li><div class="pds-list-row"><strong>${kata(m as string)}</strong><span class="c1b-angka">${kata("pimpinan.rincian.penguasaan")} ${persen(v as number)}</span></div></li>`).join("")}</ul>`;
  return shell(KADEP, "Adinda Putri", `${kembali(kata("pimpinan.murid.judul"))}${kepala({ alis: kata("pimpinan.rincian.judul"), h1: "Adinda Putri", meta: kata("pimpinan.rincian.tercatat") })}
    <dl class="c1-isi c1b-fakta">${fakta.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>
    ${bagian("o-cat", kata("pimpinan.rincian.catatan"), catatan)}`);
}

// ── feedback ─────────────────────────────────────────────────────────────────
const KEADAAN_UB = { OPEN: "terbuka", PUBLISHED: "terbit", WITHHELD: "ditahan" } as const;
const lencanaUb = (s: keyof typeof KEADAAN_UB) => `<span class="pds-badge${s === "PUBLISHED" ? " pds-badge-info" : ""}">${kata(`umpanbalik.keadaan.${KEADAAN_UB[s]}`)}</span>`;
function umpanBalik(ada: boolean): string {
  const putaran: Array<[string, string, keyof typeof KEADAAN_UB]> = [["Kelas 7A", "Citra Lestari", "PUBLISHED"], ["Kelas 7B", "Fitri Handayani", "OPEN"], ["Kelas 7C", "Citra Lestari", "WITHHELD"]];
  const daftar = ada ? `<ul class="pds-list">${putaran.map(([k, g, s]) => `<li><a href="#" class="pds-list-row"><strong>${k}</strong>${lencanaUb(s)}<small>${kata("umpanbalik.tentang.guru")}: ${g}</small></a></li>`).join("")}</ul>` : kosong(kata("umpanbalik.pimpinan.kosong"));
  // the h2 names the rounds (not the eyebrow's words again): «Putaran untuk kelas ini» is the built key for a round list
  return shell(KADEP, kata("umpanbalik.pimpinan.judul"), `${kembali(kata("umpanbalik.kembali"))}${lingkup(SEKOLAH, "Matematika", kata("umpanbalik.pimpinan.judul"))}${kepala({ alis: kata("umpanbalik.pimpinan.judul"), h1: "Matematika", intro: kata("umpanbalik.pimpinan.sub") })}
    <section class="pds-section" aria-labelledby="u-put"><h2 id="u-put">${kata("umpanbalik.kelas.putaran")}</h2>${daftar}</section>
    ${bagian("u-kelas", kata("umpanbalik.kelas.judul"), `<ul class="pds-list">${["Kelas 7A", "Kelas 7B", "Kelas 7C"].map((k) => `<li><a href="#" class="pds-list-row"><strong>${k}</strong><span class="c1-meta">${kata("umpanbalik.kelas.buka")}</span>${ikon("chevron-right")}</a></li>`).join("")}</ul>`, kata("umpanbalik.kelas.sub"))}`);
}
function siklus(s: "PUBLISHED" | "WITHHELD" | "OPEN"): string {
  const total = 26;
  const soal: Array<[string, Array<[string, number]>]> = [
    ["Penjelasan guru mudah diikuti.", [["Hampir selalu", 14], ["Sering", 8], ["Kadang-kadang", 3], ["Jarang", 1]]],
    ["Saya tahu apa yang harus dipelajari berikutnya.", [["Hampir selalu", 9], ["Sering", 11], ["Kadang-kadang", 5], ["Jarang", 1]]],
  ];
  const hasil = s === "PUBLISHED" ? `<p class="c1b-hitung">${kata("umpanbalik.hasil.total")}: <span class="c1b-angka">${angka(total)}</span></p><p class="c1-meta">${kata("umpanbalik.hasil.arti")}</p>
    <ol class="c1b-soal">${soal.map(([q, op], i) => `<li><h3 id="q${i}">${q}</h3><dl class="c1b-opsi">${op.map(([o, n]) => `<div><dt>${o}</dt><dd><span class="c1b-batang" aria-hidden="true"><span style="width:${Math.round((n / total) * 100)}%"></span></span><span class="c1b-angka">${angka(n)}</span></dd></div>`).join("")}</dl></li>`).join("")}</ol>`
    : `<div class="pds-well"><p>${kata(s === "WITHHELD" ? "umpanbalik.hasil.belum_cukup_tanggapan" : "umpanbalik.hasil.belum_ditutup")}</p></div>`;
  const tutup = s === "OPEN" ? `<div class="pds-actions"><button type="button" class="pds-btn pds-btn-secondary">${kata("umpanbalik.tutup.aksi")}</button></div>` : `<p class="c1-meta">${kata("umpanbalik.tutup.selesai")}</p>`;
  return shell(KADEP, "Kelas 7A", `${kembali(kata("umpanbalik.kembali"))}${lingkup(SEKOLAH, "Matematika", "Kelas 7A")}${kepala({ alis: kata("umpanbalik.pimpinan.judul"), h1: "Kelas 7A", intro: `${kata("umpanbalik.tentang.guru")}: Citra Lestari` })}
    ${bagian("h-hasil", kata("umpanbalik.hasil.judul"), `<p>${lencanaUb(s)}</p>${hasil}`)}
    ${bagian("h-tutup", kata("umpanbalik.tutup.judul"), tutup)}<p class="c1-meta">${kata("umpanbalik.guru.guna")}</p>`);
}
function kelasUmpan(): string {
  return shell(KADEP, "Kelas 7B", `${kembali(kata("umpanbalik.kembali"))}${lingkup(SEKOLAH, "Matematika", "Kelas 7B")}${kepala({ alis: kata("umpanbalik.pimpinan.judul"), h1: "Kelas 7B" })}
    ${bagian("k-put", kata("umpanbalik.kelas.putaran"), `<ul class="pds-list"><li><a href="#" class="pds-list-row"><strong>${kata("umpanbalik.tentang.guru")}: Fitri Handayani</strong>${lencanaUb("OPEN")}${ikon("chevron-right")}</a></li></ul>`)}
    ${bagian("k-buka", kata("umpanbalik.buka.judul"), `<ul class="pds-list c1b-guru"><li><div class="pds-list-row"><strong>Fitri Handayani</strong><span class="c1-meta">${kata("umpanbalik.buka.sudah_ada")}</span></div></li><li><div class="pds-list-row"><strong>Gilang Ramadhan</strong><button type="button" class="pds-btn pds-btn-secondary" aria-label="${kata("umpanbalik.buka.aksi")} · Gilang Ramadhan">${kata("umpanbalik.buka.aksi")}</button></div></li></ul>`, kata("umpanbalik.buka.sub"))}`);
}

// ── /pengembangan/[simpul] ───────────────────────────────────────────────────
type Paket = { judul: string; mulai: boolean; awal: string; akhir: string; pelajaran?: [number, number]; hasil?: [number, boolean]; selesai: boolean };
const PESERTA: Array<{ nama: string; daftar: "ACTIVE" | "PENDING"; paket: Paket[] }> = [
  { nama: "Citra Lestari", daftar: "ACTIVE", paket: [{ judul: "Asesmen formatif di kelas", mulai: true, awal: "SELESAI", akhir: "SELESAI", pelajaran: [6, 6], hasil: [0.84, true], selesai: true }, { judul: "Merancang umpan balik", mulai: true, awal: "SELESAI", akhir: "BELUM", pelajaran: [3, 5], selesai: false }] },
  { nama: "Fitri Handayani", daftar: "ACTIVE", paket: [{ judul: "Asesmen formatif di kelas", mulai: true, awal: "SELESAI", akhir: "SEDANG", pelajaran: [5, 6], selesai: false }] },
  { nama: "Gilang Ramadhan", daftar: "PENDING", paket: [] },
];
function pengembangan(penuh: boolean): string {
  const ya = (b: boolean) => kata(b ? "pengembangan.ya" : "pengembangan.belum");
  const orang = PESERTA.map((p, i) => `<section class="pds-section c1b-peserta" aria-labelledby="pd${i}"><h2 id="pd${i}">${p.nama}</h2><p class="c1-meta">${kata(`pengembangan.daftar.${p.daftar}`)}</p>
    ${p.paket.length === 0 ? `<p class="c1-meta">${kata("pengembangan.paket_kosong")}</p>` : `<ul class="pds-list">${p.paket.map((k) => `<li class="c1b-paket"><strong>${k.judul}</strong>
      <dl class="c1b-kolom">
        <div><dt>${kata("pengembangan.kolom.mulai")}</dt><dd>${ya(k.mulai)}</dd></div>
        <div><dt>${kata("pengembangan.kolom.pemetaan")}</dt><dd>${kata(`pengembangan.status.${k.awal}`)}</dd></div>
        <div><dt>${kata("pengembangan.kolom.penguasaan")}</dt><dd>${kata(`pengembangan.status.${k.akhir}`)}</dd></div>
        ${penuh && k.pelajaran ? `<div><dt>${kata("pengembangan.kolom.pelajaran")}</dt><dd>${kata("pengembangan.pelajaran_dari", { n: angka(k.pelajaran[0]), m: angka(k.pelajaran[1]) })}</dd></div>` : ""}
        ${penuh && k.hasil ? `<div class="c1b-hasil" data-eskalasi="hasil"><dt>${kata("pengembangan.kolom.hasil")}</dt><dd>${persen(k.hasil[0])} · ${kata(k.hasil[1] ? "pengembangan.tercapai" : "pengembangan.belum_tercapai")}</dd></div>` : ""}
        <div><dt>${kata("pengembangan.kolom.selesai")}</dt><dd>${ya(k.selesai)}</dd></div>
      </dl></li>`).join("")}</ul>`}</section>`).join("");
  const p = penuh ? KADEP : ADMIN;
  return shell(p, kata("pengembangan.judul"), `${kembali(kata("pengembangan.kembali"))}${kepala({ alis: `${kata("pengembangan.eyebrow")} · PD Guru Matematika`, h1: kata("pengembangan.judul"), intro: kata(penuh ? "pengembangan.arti" : "pengembangan.arti_terbatas") })}${orang}`);
}

// ── render and check ─────────────────────────────────────────────────────────
type Lembar = { kode: string; judul: string; html: () => string; cetak?: boolean };
const LEMBAR: Lembar[] = [
  { kode: "pimpinan", judul: "/pimpinan · decisions waiting", html: () => pimpinan(), cetak: true },
  { kode: "pimpinan-nihil", judul: "/pimpinan · none waiting", html: () => pimpinan(true) },
  { kode: "pimpinan-tolak", judul: "/pimpinan · refusal (Admin sekolah, by design)", html: () => tolak(kata("pimpinan.ditolak"), kata("galat.beranda"), "Dewi Saraswati") },
  { kode: "simpul", judul: "/pimpinan/[simpul] · a node's page", html: simpul },
  { kode: "murid", judul: "/pimpinan/[simpul]/murid · the roster", html: () => murid(true) },
  { kode: "murid-kosong", judul: "/pimpinan/[simpul]/murid · empty", html: () => murid(false) },
  { kode: "murid-orang", judul: "/pimpinan/[simpul]/murid/[orang] · one learner", html: () => muridOrang(false), cetak: true },
  { kode: "murid-orang-belum", judul: "/pimpinan/[simpul]/murid/[orang] · not yet", html: () => muridOrang(true) },
  { kode: "umpan-balik", judul: "/pimpinan/[simpul]/umpan-balik · the rounds", html: () => umpanBalik(true) },
  { kode: "umpan-balik-kosong", judul: "/pimpinan/[simpul]/umpan-balik · none", html: () => umpanBalik(false) },
  { kode: "siklus-terbit", judul: "/umpan-balik/[siklus] · results available", html: () => siklus("PUBLISHED") },
  { kode: "siklus-ditahan", judul: "/umpan-balik/[siklus] · results withheld (too few responses)", html: () => siklus("WITHHELD") },
  { kode: "siklus-terbuka", judul: "/umpan-balik/[siklus] · still collecting", html: () => siklus("OPEN") },
  { kode: "kelas-umpan", judul: "/umpan-balik/kelas/[kelas] · one class", html: kelasUmpan },
  { kode: "umpan-balik-tolak", judul: "/umpan-balik · refusal", html: () => tolak(kata("umpanbalik.ditolak"), kata("umpanbalik.kembali"), "Citra Lestari") },
  { kode: "pengembangan-penuh", judul: "/pengembangan/[simpul] · facilitator, Kepala departemen, Dekan", html: () => pengembangan(true), cetak: true },
  { kode: "pengembangan-terbatas", judul: "/pengembangan/[simpul] · Admin sekolah (completion only)", html: () => pengembangan(false) },
  { kode: "pengembangan-tolak", judul: "/pengembangan/[simpul] · refusal", html: () => tolak(kata("pengembangan.ditolak"), kata("pengembangan.kembali"), "Joko Susilo") },
];
const GAYA = readFileSync(join(sini, "c1.css"), "utf8") + readFileSync(join(sini, "c1b.css"), "utf8");
const RENDER = join(sini, "render-b"), JALAN = join(sini, "jalan-b");
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
  nk = 0;
  const html = `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(l.judul)}</title><style>${tokens}</style><style>${bundleCss}</style><style>${GAYA}</style><script>${bundleJs}</script></head><body>${l.html()}<script>Pintar.siapkan();</script></body></html>`;
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
      document.querySelectorAll("a, button, select, input, textarea, summary").forEach(function (e) { var r = e.getBoundingClientRect(); if (!r.width) return;
        if (e.tagName === "A" && e.classList.contains("pds-link") && /^(P|SMALL|SPAN)$/.test(e.parentElement.tagName)) return;
        if (r.height < 24 || r.width < 24) kecil.push(e.tagName + " «" + (e.textContent||"").trim().slice(0,20) + "» " + Math.round(r.width) + "x" + Math.round(r.height)); });
      var h1 = [].filter.call(document.querySelectorAll("h1"), function (h) { return !h.textContent.trim(); }).length;
      var t = document.body.innerText;
      return { lebar: document.documentElement.scrollWidth, kecil: kecil, h1Kosong: h1, mentah: (t.match(/\\b(pimpinan|umpanbalik|pengembangan|laporan|metrik)\\.[a-z_.A-Z]+/g) || []),
        peringkat: /peringkat\\s*\\d|#\\d|rank/i.test(t.replace("Ini urutan, bukan peringkat.", "").replace("bukan peringkat", "")) };
    })()`) as { lebar: number; kecil: string[]; h1Kosong: number; mentah: string[]; peringkat: boolean };
    if (ukur.lebar > w + 1) masalah.push(`sideways scroll ${ukur.lebar} at ${w}`);
    if (ukur.kecil.length) masalah.push(`targets under 24 px: ${ukur.kecil.join(", ")}`);
    if (ukur.h1Kosong) masalah.push("an empty h1");
    if (ukur.mentah.length) masalah.push(`raw keys: ${ukur.mentah.join(", ")}`);
    if (ukur.peringkat) masalah.push("something that reads as a ranking");
    await page.addScriptTag({ content: axe });
    const pelanggaran = await page.evaluate(`axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } }).then(function (r) { return r.violations.map(function (v) { return v.id + " (" + v.nodes.length + ": " + v.nodes.slice(0,2).map(function(n){return n.target.join(" ");}).join(" | ") + ")"; }); })`) as string[];
    masalah.push(...pelanggaran.map((v) => `axe ${v}`));
    if (w === 1280 || w === 320) {
      const tab: string[] = [];
      for (let i = 0; i < 40; i++) {
        await page.keyboard.press("Tab");
        const f = await page.evaluate(`(function () { var a = document.activeElement; if (!a || a === document.body) return ""; var cs = getComputedStyle(a); var cincin = (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) >= 2) || /rgb/.test(cs.boxShadow); var nama = a.getAttribute("aria-label") || (a.labels && a.labels[0] && a.labels[0].textContent) || a.textContent || ""; return a.tagName.toLowerCase() + " «" + nama.replace(/\\s+/g, " ").trim().slice(0, 50) + "»" + (cincin ? "" : "  NO RING"); })()`) as string;
        if (!f) break;
        tab.push(f);
        if (/NO RING/.test(f)) masalah.push(`no focus ring: ${f}`);
      }
      const pohon = await page.locator("main").ariaSnapshot();
      writeFileSync(join(JALAN, `${l.kode}-${w}.txt`), `${l.judul} at ${w} px: the Tab order from the top of the page\n${tab.map((x, i) => `${String(i + 1).padStart(2)}. ${x}`).join("\n")}\n\nThe accessibility tree of the main region\n${pohon}\n`);
    }
    if (masalah.length) gagal++;
    laporan.push(`${masalah.length ? "FAIL" : "ok  "} ${l.kode} @${w}${masalah.length ? "\n      " + masalah.join("\n      ") : ""}`);
    await ctx.close();
  }
  if (l.cetak) {
    const ctx = await browser.newContext({ viewport: { width: 794, height: 1123 } });
    const page = await ctx.newPage();
    await page.setContent(html, { waitUntil: "load" });
    await page.emulateMedia({ media: "print" });
    await page.evaluate(() => document.fonts.ready);
    await page.pdf({ path: join(RENDER, `${l.kode}-a4.pdf`), preferCSSPageSize: true, printBackground: true });
    const tampak = await page.evaluate(`[".pds-nav", ".pds-bar", ".pds-lewati", ".pds-back", "form"].filter(function (s) { var e = document.querySelector(s); return e && e.offsetParent !== null; })`) as string[];
    if (tampak.length) { gagal++; laporan.push(`FAIL ${l.kode} @A4\n      printed: ${tampak.join(", ")}`); } else laporan.push(`ok   ${l.kode} @A4`);
    await ctx.close();
  }
}
await browser.close();
const ringkas = `${LEMBAR.length} pages × 4 widths (+ A4 for ${LEMBAR.filter((l) => l.cetak).length}): ${gagal} with a failure\n\n${laporan.join("\n")}\n`;
writeFileSync(join(RENDER, "laporan.txt"), ringkas);
console.log(ringkas);
process.exit(gagal ? 1 : 0);
