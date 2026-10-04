import type { HleEvent } from "@/lib/hle";

/**
 * WHAT THE DELIVERY TEST'S ANSWER MEANS TO THE PLATFORM ADMIN (BOB-51, D-057,
 * REL-08).
 *
 * `POST /api/email/uji` (BOB-25, unchanged) answers one of four shapes:
 *   200  { terkirim: true, rujukan }                       sent
 *   502  { terkirim: false, alasan, rujukan }              the send log or the host refused
 *   503  { terkirim: false, galat, variabel }              a setting is wrong
 *   4xx/500 { terkirim: false, galat }                     refused, or it failed
 *
 * Each maps to one plain sentence in hle.ts; nothing the route sends is shown
 * as text except the reference (a send-log id) and the setting's NAME, and the
 * name only when it is one of `namaSah`: the names the sending module can
 * carry (NAMA_PENGATURAN_EMAIL in src/app/api/_email/pengaturan.ts, the only
 * file that names them, passed down by the page). A value never
 * reaches this reader (the route sends none) and, were one ever sent in its
 * place, it would not be shown.
 *
 * Pure and free of React, so the tests read exactly what the page shows.
 */
export type NadaUji = "ok" | "gagal";

export type HasilUji = {
  nada: NadaUji;
  kunci: HleEvent;
  /** the send log's reference, when the route gave one */
  rujukan?: string;
  /** the setting to fix, by name only */
  variabel?: string;
};

const RUJUKAN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The same permissive shape check as the activation screen: it catches a missing `@` before anything is sent. */
export function alamatLengkap(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
}

/**
 * The sentence for one answer. `status` null is no answer at all: the request
 * never reached PINTAR, or what came back was not the route's answer.
 */
export function bacaHasilUji(status: number | null, jawaban: unknown, namaSah: readonly string[]): HasilUji {
  const j = (jawaban && typeof jawaban === "object" ? jawaban : {}) as Record<string, unknown>;
  const rujukan = typeof j.rujukan === "string" && RUJUKAN.test(j.rujukan) ? j.rujukan : undefined;
  const galat = typeof j.galat === "string" ? j.galat : "";
  if (status === null || typeof j.terkirim !== "boolean") return { nada: "gagal", kunci: "emailuji.galat.jaringan" };

  if (j.terkirim === true && status === 200) return { nada: "ok", kunci: "emailuji.terkirim", rujukan };

  switch (j.alasan) {
    case "BATAS_ALAMAT": return { nada: "gagal", kunci: "emailuji.alasan.batas_alamat", rujukan };
    case "BATAS_UMUM": return { nada: "gagal", kunci: "emailuji.alasan.batas_umum", rujukan };
    case "DITOLAK_SERVER": return { nada: "gagal", kunci: "emailuji.alasan.ditolak_server", rujukan };
    case "GAGAL_KIRIM": return { nada: "gagal", kunci: "emailuji.alasan.gagal_kirim", rujukan };
  }

  const nama = typeof j.variabel === "string" && namaSah.includes(j.variabel) ? j.variabel : undefined;
  switch (galat) {
    case "VARIABEL_HILANG":
      return nama ? { nada: "gagal", kunci: "emailuji.pengaturan.hilang", variabel: nama } : { nada: "gagal", kunci: "emailuji.pengaturan.umum" };
    case "NILAI_TIDAK_SAH":
      return nama ? { nada: "gagal", kunci: "emailuji.pengaturan.tidak_sah", variabel: nama } : { nada: "gagal", kunci: "emailuji.pengaturan.umum" };
    case "KONEKSI_TIDAK_AMAN":
      return nama ? { nada: "gagal", kunci: "emailuji.pengaturan.tidak_aman", variabel: nama } : { nada: "gagal", kunci: "emailuji.pengaturan.umum" };
    case "PERMINTAAN_TIDAK_SAH": return { nada: "gagal", kunci: "emailuji.galat.alamat" };
    case "BELUM_MASUK": return { nada: "gagal", kunci: "emailuji.galat.sesi" };
    case "BUKAN_ADMIN_PLATFORM": return { nada: "gagal", kunci: "emailuji.galat.ditolak" };
    // the press did not come from a PINTAR page at the address the route is addressed by
    case "BUKAN_ASAL_SAMA": return { nada: "gagal", kunci: "emailuji.galat.asal" };
  }
  return { nada: "gagal", kunci: "emailuji.galat.umum" };
}
