/**
 * A1 on the screens: how one row of the teacher's list reads (Daisy, TINJAUAN-A1-C1W Q4, §A1·N1, §A1·N2). Pure: the
 * copy table's words, the school's own clock (D-199) and a clock passed in, so a test drives it with its own.
 */
import { t, type HleEvent, type Locale } from "./hle";
import { bagianJakarta, geserZona, jam, kataZona, tanggal } from "./tanggal";
import { menitDari, type BarisPengerjaan } from "./pengerjaan-kontrak";

/** A copy-table sentence with its {placeholders} filled; a person's words go in last, so nothing typed is read as one. */
export function isi(kalimat: string, nilai: Record<string, string | number>): string {
  let s = kalimat;
  for (const [k, v] of Object.entries(nilai).sort(([a], [b]) => (a === "alasan" || a === "nama" ? 1 : b === "alasan" || b === "nama" ? -1 : 0))) {
    s = s.split(`{${k}}`).join(String(v));
  }
  return s;
}

/** A moment on the school's clock: «10.05 WITA» today, «12 Nov 2026, 10.05 WITA» on another day; "" for none. */
export function waktuSekolah(nilai: string | null | undefined, zona: string | null | undefined, locale: Locale, sekarang: Date = new Date()): string {
  if (!nilai) return "";
  const a = bagianJakarta(nilai, geserZona(zona)), b = bagianJakarta(sekarang, geserZona(zona));
  if (!a) return "";
  const pukul = `${jam(nilai, zona)} ${kataZona(zona)}`;
  return b && a.tahun === b.tahun && a.bulan === b.bulan && a.hari === b.hari ? pukul : `${tanggal(nilai, "baca", locale, zona)}, ${pukul}`;
}

/**
 * The Badge a row's latest sitting adds to the three states «Lihat bukti» counts (handed in, started, not started),
 * or null when one of those three says it: held, ended by the teacher either way, ended by its deadline.
 */
export type LencanaA1 = "ditahan" | "dinilai" | "tidak_dihitung" | "waktu_habis";
export function lencanaA1(b: Pick<BarisPengerjaan, "keadaan"> | undefined): LencanaA1 | null {
  switch (b?.keadaan) {
    case "FROZEN": return "ditahan";
    case "ENDED_SCORED": return "dinilai";
    case "ENDED_NOT_COUNTED": return "tidak_dihitung";
    case "ENDED_BY_DEADLINE": return "waktu_habis";
    default: return null;
  }
}

/** The lines under a learner's name: what the sitting's state says, then the request's, each one fact, never a reason for an ending. */
export function metaBaris(b: BarisPengerjaan, o: { locale: Locale; zona: string | null | undefined; sekarang?: Date }): string[] {
  const s = (k: HleEvent) => t(k, "educator", { locale: o.locale });
  const w = (x: string | null) => waktuSekolah(x, o.zona, o.locale, o.sekarang);
  const out: string[] = [];
  let utama = "";
  switch (b.keadaan) {
    case "OPEN": {
      const sisa = menitDari(b.sisa_detik);
      utama = [isi(s("atur.meta.mulai"), { waktu: w(b.mulai) }), ...(sisa !== null ? [isi(s("atur.meta.sisa"), { n: sisa })] : [])].join(" · ");
      break;
    }
    case "FROZEN": {
      const sisa = menitDari(b.sisa_ditahan_detik);
      utama = b.murid_aktif ? s("atur.meta.ditahan_menunggu") : sisa !== null ? isi(s("atur.meta.ditahan"), { n: sisa }) : s("atur.meta.ditahan_polos");
      break;
    }
    case "HANDED_IN": utama = isi(s("atur.meta.dikumpulkan"), { waktu: w(b.berakhir_pada) }); break;
    case "ENDED_SCORED": utama = isi(s("atur.meta.dinilai"), { waktu: w(b.berakhir_pada) }); break;
    case "ENDED_NOT_COUNTED": utama = isi(s("atur.meta.tidak_dihitung"), { waktu: w(b.berakhir_pada) }); break;
    case "ENDED_BY_DEADLINE": utama = isi(s("atur.meta.waktu_habis"), { waktu: w(b.berakhir_pada ?? b.tenggat) }); break;
    default: utama = "";
  }
  // a granted attempt not yet started: the row is «not started» again and says only that (the earlier sitting is on
  // the learner's record page); a sitting that came from a granted attempt says so after its own line
  if (b.izin_belum_dipakai) utama = s("atur.meta.tambahan");
  else if (b.percobaan_diizinkan) utama = utama ? `${utama} · ${s("atur.meta.tambahan")}` : s("atur.meta.tambahan");
  if (utama) out.push(utama);
  // the request: waiting, approved (until the granted attempt has been used and handed in), or declined with its reason
  if (b.permintaan_status === "PENDING") out.push(s("atur.meta.diminta"));
  else if (b.permintaan_status === "APPROVED" && (b.izin_belum_dipakai || b.percobaan_diizinkan)) {
    out.push(isi(s("atur.meta.disetujui"), { tanggal: tanggal(b.keputusan_pada, "baca", o.locale, o.zona) }));
  } else if (b.permintaan_status === "DECLINED") out.push(isi(s("atur.meta.ditolak"), { alasan: b.keputusan_alasan ?? "" }));
  return out;
}
