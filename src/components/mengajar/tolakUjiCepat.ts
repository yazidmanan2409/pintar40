import { format, type HleEvent, type Locale } from "@/lib/hle";
import type { KodeUjiCepat } from "@/lib/ujicepat-kontrak";

/**
 * DAISY-27 (UX-03's page half, with BOB-32): WHY AN UJI CEPAT WAS NOT MADE
 * AVAILABLE, in the teacher's words.
 *
 * The page used to say «Sudah ada Uji Cepat yang berjalan…» for a refusal,
 * which was never its cause: the database lets several run in one class.
 * BOB-32's action now passes the refusal's code (src/lib/ujicepat-kontrak.ts),
 * and `bacaGagalUjiCepat` reads it back from the address, dropping a code it
 * does not know and a reference of the wrong shape. Each code has a sentence
 * of its own, which says what to change. A refusal nobody named (QUICK_FAILED,
 * or no known code) gets the general line, with its reference only when there
 * is one. No sentence names a code.
 *
 * Pure, so the test can read every sentence without a database. The page
 * hands in the bounds it already knows: the question range it reads from
 * assessment_definition_bounds, and the minute windows it offers.
 */
export function kalimatTolakUjiCepat(
  gagal: { kode: KodeUjiCepat | null; ref: string | null },
  s: (k: HleEvent) => string,
  locale: Locale,
  batas: { soalMin: number; soalMax: number; menit: readonly number[] },
): string {
  const n = (x: number) => format.number(x, locale);
  const awal = s("mengajar.cepat.tolak.awal");
  switch (gagal.kode) {
    case "QUICK_BANK_TOO_SMALL":
      return `${awal} ${s("mengajar.cepat.tolak.bank")}`;
    case "QUICK_COUNT_OUT_OF_RANGE":
      return `${awal} ${s("mengajar.cepat.tolak.jumlah")} ${n(batas.soalMin)} ${s("mengajar.cepat.jumlah.dan")} ${n(batas.soalMax)}.`;
    case "QUICK_MINUTES_OUT_OF_RANGE":
      return `${awal} ${s("mengajar.cepat.tolak.menit")} ${daftar(batas.menit.map(n), s("mengajar.cepat.atau"))} ${s("mengajar.cepat.menit")}.`;
    case "QUICK_NOT_ALLOWED":
      return `${awal} ${s("mengajar.cepat.tolak.izin")}`;
    case "QUICK_NOT_FOUND":
      return `${awal} ${s("mengajar.cepat.tolak.tidak_ada")}`;
    case "QUICK_PASS_MARK_MISSING":
      return `${awal} ${s("mengajar.cepat.tolak.ketuntasan")}`;
    // D-085 T2: the questions the teacher ticked
    case "QUICK_SELECTION_COUNT":
      return `${awal} ${s("mengajar.cepat.tolak.pilih_jumlah")} ${n(batas.soalMin)} ${s("mengajar.cepat.jumlah.dan")} ${n(batas.soalMax)} ${s("mengajar.cepat.tolak.pilih_jumlah2")}`;
    case "QUICK_SELECTION_NOT_OFFERED":
      return `${awal} ${s("mengajar.cepat.tolak.pilih_bukan")}`;
    case "QUICK_SELECTION_SIBLINGS":
      return `${awal} ${s("mengajar.cepat.tolak.pilih_versi")}`;
    default:
      // QUICK_FAILED, or a code the contract does not know: the app's general
      // line, and the reference only when the address carried one
      return gagal.ref && /^[A-Z0-9]{6}$/.test(gagal.ref)
        ? `${awal} ${s("galat.action_failed")} ${s("galat.rujukan")}: ${gagal.ref}.`
        : `${awal} ${s("mengajar.cepat.tolak.umum")}`;
  }
}

/** «10, 15 atau 30» / "10, 15 or 30". */
function daftar(butir: string[], atau: string): string {
  return butir.length <= 1 ? butir.join("") : `${butir.slice(0, -1).join(", ")} ${atau} ${butir[butir.length - 1]}`;
}
