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
