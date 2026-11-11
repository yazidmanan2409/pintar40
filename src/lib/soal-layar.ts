/**
 * C1w on the screens: the item workbench's pure rules (Daisy, TINJAUAN-A1-C1W Q5, Q6). No database, no React, so the
 * editor's payload, its error summary, the history's words and the key correction's counts are tested directly.
 */
import { kunciMasalahPaket } from "./unggah-kontrak";
import {
  KODE_KOREKSI, KODE_SOAL, MASALAH_SOAL_SENDIRI, kunciKodeKoreksi, kunciKodeSoal, kunciMasalahSoal,
  type DampakKoreksi, type KodeKoreksi, type KodeSoal, type MasalahSoal, type PerubahanSoal, type SoalDraf,
} from "./soal-kontrak";
import type { HleEvent } from "./hle";

/** The editor's option rows, in the article's order (two to five are used). */
export const LABEL_PILIHAN = ["A", "B", "C", "D", "E"] as const;

/** The package page's address for one C1w answer: the lesson, the answer's code, the article it is about. */
export type AlamatSoal = {
  pelajaran?: string; c1h?: "ok" | "gagal"; c1?: string; c1s?: string; c1m?: string; ref?: string;
  ubah?: string; tambah?: string; kunci?: string; langkah?: string; jangkar?: string;
};
export function alamatSoal(course: string, q: AlamatSoal): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) if (v && k !== "jangkar") p.set(k, v);
  const jangkar = q.jangkar ?? (q.ubah || q.c1s ? `soal-${q.ubah ?? q.c1s}` : q.tambah ? `tambah-${q.tambah}` : q.kunci ? `soal-${q.kunci}` : "soal");
  return `/studio/paket/${encodeURIComponent(course)}${p.size > 0 ? `?${p.toString()}` : ""}#${jangkar}`;
}

/**
 * The form read into the question ubah_soal_draf and tambah_soal_draf take. Options left empty AT THE END are not
 * sent (two to five are used); an empty option between filled ones is sent, so the database names it («Pilihan C
 * masih kosong»). The key is the one radio chosen. The objective is sent only when one was chosen.
 */
export function soalDariIsian(baca: (k: string) => string, label: readonly string[] = LABEL_PILIHAN): SoalDraf {
  const baris = label.map((x) => ({
    label: x, body: baca(`pilihan_${x}`), rationale: baca(`alasan_${x}`), misconception_code: baca(`miskonsepsi_${x}`) || null,
  }));
  let akhir = baris.length;
  while (akhir > 0 && !baris[akhir - 1].body && !baris[akhir - 1].rationale && !baris[akhir - 1].misconception_code) akhir--;
  const kunci = baca("kunci").toUpperCase();
  const tujuan = baca("tujuan");
  return {
    stimulus: baca("bacaan"),
    stem: baca("pertanyaan"),
    options: baris.slice(0, akhir).map((o) => ({ ...o, is_correct: o.label === kunci })),
    ...(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tujuan) ? { objective_ids: [tujuan] } : {}),
  };
}

/** A save's problems in the address: code, field and label, at most twelve. */
export function kemasMasalah(m: readonly MasalahSoal[]): string {
  return m.slice(0, 12).map((x) => [x.code, x.field ?? "", x.label ?? ""].join(":")).join(",");
}
const KODE_MASALAH = /^[A-Z_]{3,40}$/;
const BIDANG = /^[a-z_]{1,30}$/;
export function bacaMasalah(q: string | undefined): MasalahSoal[] {
  const out: MasalahSoal[] = [];
  for (const b of (q ?? "").split(",").slice(0, 12)) {
    const [code, field, label] = b.split(":");
    if (!code || !KODE_MASALAH.test(code)) continue;
    out.push({ code, field: field && BIDANG.test(field) ? field : undefined, label: label && /^[A-E]$/.test(label) ? label : undefined });
  }
  return out;
}

/**
 * Where a problem is said beside its field: the form's field id suffix. The summary at the top links to it.
 * Key problems sit by the key's radios, an option's by that option.
 */
export function bidangMasalah(m: MasalahSoal): string {
  if (m.code === "ITEM_CORRECT_MISSING" || m.code === "ITEM_CORRECT_TOO_MANY" || m.code === "OPTION_CORRECT_INVALID") return "kunci";
  if (m.field === "stem") return "pertanyaan";
  if (m.field === "stimulus") return "bacaan";
  if (m.field === "objective_ids") return "tujuan";
  if (m.label && m.field === "rationale") return `alasan_${m.label}`;
  if (m.label && m.field === "misconception_code") return `miskonsepsi_${m.label}`;
  if (m.label) return `pilihan_${m.label}`;
  return "pilihan_A";
}

/** Daisy's three sentences where she wrote them; her pattern for the reason; the upload's own sentence otherwise. */
export function kalimatMasalah(m: MasalahSoal, s: (k: HleEvent) => string): string {
  const x = (k: HleEvent) => s(k).replace("{x}", m.label ?? "");
  switch (m.code) {
    case "ITEM_CORRECT_MISSING": case "ITEM_CORRECT_TOO_MANY": return s("studio.soal.v.kunci");
    case "ITEM_QUESTION_MISSING": return s("studio.soal.v.pertanyaan_kosong");
    case "OPTION_TEXT_MISSING": return m.label ? x("studio.soal.v.pilihan_kosong") : s("studio.soal.v.pilihan_kurang");
    case "OPTION_REASON_MISSING": return m.label ? x("studio.soal.v.alasan_kosong") : s(kunciMasalahPaket(m.code));
    case "ITEM_OPTIONS_TOO_FEW": return s("studio.soal.v.pilihan_kurang");
  }
  if ((MASALAH_SOAL_SENDIRI as readonly string[]).includes(m.code)) return s(kunciMasalahSoal(m.code as (typeof MASALAH_SOAL_SENDIRI)[number]));
  return s(kunciMasalahPaket(m.code)) + (m.label ? ` (${m.label})` : "");
}

/** The C1w answer codes the package page draws: the database's own, and the page's own successes. */
export const HASIL_SOAL = ["TERSIMPAN", "TERSIMPAN_PERIKSA", "DITAMBAH", "DIHAPUS", "KOREKSI_TERKIRIM", "MASALAH"] as const;
export function kalimatKodeC1(kode: string | undefined, s: (k: HleEvent) => string): string | null {
  if (!kode) return null;
  const sendiri: Record<string, HleEvent> = {
    TERSIMPAN: "studio.soal.tersimpan", TERSIMPAN_PERIKSA: "studio.soal.tersimpan_periksa", DITAMBAH: "studio.soal.ditambah",
    DIHAPUS: "studio.soal.dihapus", KOREKSI_TERKIRIM: "studio.kunci.terkirim", MASALAH: "studio.soal.ringkasan_galat",
  };
  if (sendiri[kode]) return s(sendiri[kode]);
  if ((KODE_SOAL as readonly string[]).includes(kode)) return s(kunciKodeSoal(kode as KodeSoal));
  if ((KODE_KOREKSI as readonly string[]).includes(kode)) return s(kunciKodeKoreksi(kode as KodeKoreksi));
  return null;
}

/** What changed from one version to the next, in words (Daisy Q5: «Kunci: B → C», «Pilihan D diubah»), never a diff. */
export function kataPerubahan(p: PerubahanSoal | null | undefined, s: (k: HleEvent) => string): string[] {
  if (!p) return [];
  const out: string[] = [];
  const x = (k: HleEvent, v: string) => s(k).replace("{x}", v);
  if (p.key) out.push(s("studio.soal.riwayat.kunci").replace("{dari}", p.key.from.join(", ") || "—").replace("{ke}", p.key.to.join(", ") || "—"));
  if (p.stimulus) out.push(s("studio.soal.riwayat.bacaan"));
  if (p.stem) out.push(s("studio.soal.riwayat.pertanyaan"));
  for (const o of p.options ?? []) {
    out.push(x(o.kind === "ADDED" ? "studio.soal.riwayat.pilihan_ditambah" : o.kind === "REMOVED" ? "studio.soal.riwayat.pilihan_dihapus" : "studio.soal.riwayat.pilihan_diubah", o.label));
  }
  for (const l of p.rationale ?? []) out.push(x("studio.soal.riwayat.alasan", l));
  for (const l of p.misconception ?? []) out.push(x("studio.soal.riwayat.miskonsepsi", l));
  if (p.objectives) out.push(s("studio.soal.riwayat.tujuan"));
  return out;
}

/** Step 2's two sentences (Daisy Q6), with the exact counts of the recalculation's own rule; the empty state when none. */
export function kalimatDampak(d: Pick<DampakKoreksi, "sesi_selesai" | "sekolah" | "hasil_berubah" | "putusan_target_berubah"
  | "sertifikat_ditinjau" | "sertifikat_baru_layak">, s: (k: HleEvent) => string, angka: (n: number) => string): string[] {
  if (d.sesi_selesai === 0) return [s("studio.kunci.dampak.kosong")];
  return [
    s("studio.kunci.dampak").replace("{n}", angka(d.sesi_selesai)).replace("{k}", angka(d.sekolah)),
    s("studio.kunci.dampak.bila").replace("{a}", angka(d.hasil_berubah)).replace("{b}", angka(d.putusan_target_berubah))
      .replace("{c}", angka(d.sertifikat_ditinjau)).replace("{d}", angka(d.sertifikat_baru_layak)),
  ];
}
