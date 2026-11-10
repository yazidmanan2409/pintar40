/**
 * «KENAIKAN KELAS DAN KELULUSAN» (Daisy's approved flow; owner, 9 Nov; ACCOUNT-LIFECYCLE-INVENTORY.md §10): the pure
 * part of the screen. The database decides (kenaikan_rencana, kenaikan_tetapkan, kenaikan_hasil, 20270112210000); this
 * file only shapes the decisions a form sends and carries them between the review steps.
 *
 * A decision is one select per learner, its value one of:
 *   NAIK:<kelas>     up into a Kelas of the new year
 *   TINGGAL:<kelas>  repeats, straight into that Kelas of the new year (never a promotion moved back)
 *   LULUS            graduates
 *   KELUAR:<alasan>  leaves, with one of akhiri_pendaftaran's reasons («Lainnya» needs an explanation: Akhiri pendaftaran)
 *   PINDAH           a transfer is under way; nothing changes here
 * Between steps the decisions travel in the address as `kn_d`, base64url of [[person, value], …]: ids and codes only,
 * never a name.
 */
export const KEPUTUSAN = ["NAIK", "TINGGAL", "LULUS", "KELUAR", "PINDAH"] as const;
export type Keputusan = (typeof KEPUTUSAN)[number];
export const ALASAN_KELUAR = ["WITHDRAWN", "TRANSFER_EXTERNAL", "MOVED_ABROAD", "DECEASED"] as const;
export type AlasanKeluar = (typeof ALASAN_KELUAR)[number];

export type KeputusanMurid = { person_id: string; keputusan: Keputusan; kelas_tujuan?: string; alasan?: AlasanKeluar };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const adalahUuid = (v: unknown): v is string => typeof v === "string" && UUID.test(v);

/** One select's value as a decision, or null for anything else (an empty «— Pilih —» included). */
export function bacaNilai(person: string, nilai: string): KeputusanMurid | null {
  if (!adalahUuid(person)) return null;
  const [k, x] = nilai.split(":");
  if ((k === "NAIK" || k === "TINGGAL") && adalahUuid(x)) return { person_id: person, keputusan: k, kelas_tujuan: x };
  if (k === "KELUAR" && (ALASAN_KELUAR as readonly string[]).includes(x ?? "")) return { person_id: person, keputusan: "KELUAR", alasan: x as AlasanKeluar };
  if ((k === "LULUS" || k === "PINDAH") && x === undefined) return { person_id: person, keputusan: k };
  return null;
}

/** A decision as its select's value. */
export function nilaiDari(d: KeputusanMurid): string {
  if (d.keputusan === "NAIK" || d.keputusan === "TINGGAL") return `${d.keputusan}:${d.kelas_tujuan}`;
  if (d.keputusan === "KELUAR") return `KELUAR:${d.alasan}`;
  return d.keputusan;
}

export function kodekan(ds: KeputusanMurid[]): string {
  return Buffer.from(JSON.stringify(ds.map((d) => [d.person_id, nilaiDari(d)]))).toString("base64url");
}

/** The decisions an address carries; anything malformed is dropped, never repaired into a decision. */
export function urai(kode: string | undefined | null): KeputusanMurid[] {
  if (!kode || kode.length > 16000) return [];
  try {
    const isi = JSON.parse(Buffer.from(kode, "base64url").toString("utf8")) as unknown;
    if (!Array.isArray(isi)) return [];
    return isi.flatMap((x) => (Array.isArray(x) && typeof x[0] === "string" && typeof x[1] === "string" ? [bacaNilai(x[0], x[1])] : []))
      .filter((d): d is KeputusanMurid => d !== null);
  } catch {
    return [];
  }
}

/** The form's selects (`k[<person>]`) as decisions; a learner left at «— Pilih —» is simply absent (the database names them). */
export function dariForm(entries: Iterable<[string, FormDataEntryValue]>): KeputusanMurid[] {
  const out: KeputusanMurid[] = [];
  for (const [nama, nilai] of entries) {
    const m = /^k\[([0-9a-f-]{36})\]$/i.exec(nama);
    const d = m ? bacaNilai(m[1], String(nilai)) : null;
    if (d) out.push(d);
  }
  return out;
}

/**
 * DAISY'S RECONCILIATION (TINJAUAN-KENAIKAN-KELAS-DIBANGUN, 9 Nov): one year format and the year always written.
 * «TA 2026/2027» and «2026/2027» read «2026/27»; anything else is left as the school wrote it.
 */
export function tahunPendek(nama: string | null | undefined): string {
  const m = /(\d{4})\s*\/\s*(\d{2,4})/.exec(nama ?? "");
  return m ? `${m[1]}/${m[2].slice(-2)}` : (nama ?? "");
}

/** A Kelas with its year, never relative: «Kelas 6A · 2027/28». */
export function kelasDenganTahun(kelas: string, tahun: string | null | undefined): string {
  const t = tahunPendek(tahun);
  return t ? `${kelas} · ${t}` : kelas;
}

/** K2: the level as a level, «Tingkat 5», whatever the school named its Tingkat node («Kelas 5», «Tingkat 5», «5»). */
export function namaTingkat(nama: string | null | undefined): string | null {
  if (!nama) return null;
  // the year is written once, by the heading itself: a Tingkat named «Tingkat 5 — 2026/27» reads «Tingkat 5»
  const inti = nama.replace(/^\s*(kelas|tingkat|grade|level)\s+/i, "").replace(/\s*[—–-]?\s*(TA\s*)?\d{4}\s*\/\s*\d{2,4}\s*$/i, "").trim();
  return inti ? `Tingkat ${inti}` : nama;
}

/** An outcome's group: the same destination and kind together («NAIK:<kelas>», «TINGGAL:<kelas>», «LULUS», «KELUAR», «PINDAH»). */
export type HasilKelompok = { keputusan: Keputusan; kelas_tujuan?: string | null; sumber?: string | null; person_id: string };
export function kunciKelompok(h: HasilKelompok): string {
  return h.keputusan === "NAIK" || h.keputusan === "TINGGAL" ? `${h.keputusan}:${h.kelas_tujuan ?? ""}` : h.keputusan;
}

/**
 * Q2 (Daisy): the main group is the largest group of any outcome (Daisy, bcecb425 B8.1: a graduating Kelas 6 folds «4
 * lulus» and names the one who leaves, rather than listing every child as an exception; it was the most common «Naik»
 * destination only); every other outcome, and every learner who came from the Tingkat without a Kelas, is an exception,
 * named and always shown. A tie goes by the outcome (naik, tinggal, lulus, keluar, pindah, then the destination's id),
 * never by the learners' order, so the review and the outcome choose the same group. Groups keep the order of first appearance.
 */
export function kelompokkan<T extends HasilKelompok>(hasil: T[]): { utama: string | null; pengecualian: T[]; kelompok: Array<{ kunci: string; isi: T[] }> } {
  const hitung = new Map<string, number>();
  for (const h of hasil) hitung.set(kunciKelompok(h), (hitung.get(kunciKelompok(h)) ?? 0) + 1);
  // a tie is settled by the outcome, never by the order the learners came in: the review lists them in its own order
  // and the outcome by name, and both must choose the same main group (owner, 10 Nov)
  const urutan = (k: string) => KEPUTUSAN.indexOf(k.split(":")[0] as Keputusan);
  let utama: string | null = null;
  for (const [k, n] of hitung) {
    const u = utama === null ? 0 : hitung.get(utama) ?? 0;
    if (utama === null || n > u || (n === u && (urutan(k) < urutan(utama) || (urutan(k) === urutan(utama) && k < utama)))) utama = k;
  }
  const kelompok: Array<{ kunci: string; isi: T[] }> = [];
  for (const h of hasil) {
    const k = kunciKelompok(h);
    const g = kelompok.find((x) => x.kunci === k);
    if (g) g.isi.push(h); else kelompok.push({ kunci: k, isi: [h] });
  }
  const pengecualian = hasil.filter((h) => kunciKelompok(h) !== utama || h.sumber === "TINGKAT");
  return { utama, pengecualian, kelompok };
}
