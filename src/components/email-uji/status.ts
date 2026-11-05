import type { HleEvent } from "@/lib/hle";
import { MENIT_TERTAHAN } from "./jenis";

/**
 * What became of one send, as the send log knows it (J1.9, W2.19). Pure, so the copy it picks can be executed by the
 * selftests without the server action RiwayatEmail calls.
 */
export type BarisStatus = { hasil: string; batas: string | null; diminta: string };

export function kunciHasil(b: BarisStatus, sekarang: number = Date.now()): HleEvent {
  if (b.hasil === "REFUSED_LIMIT") return b.batas === "GLOBAL" ? "emailuji.r.hasil.BATAS_UMUM" : "emailuji.r.hasil.BATAS_ALAMAT";
  // W2.19: handed off is not accepted; a pending send the server has not answered for too long is stuck
  if (b.hasil === "PENDING") {
    const umur = sekarang - Date.parse(b.diminta);
    return Number.isFinite(umur) && umur > MENIT_TERTAHAN * 60_000 ? "emailuji.r.hasil.PENDING_LAMA" : "emailuji.r.hasil.PENDING";
  }
  return `emailuji.r.hasil.${b.hasil}` as HleEvent;
}
