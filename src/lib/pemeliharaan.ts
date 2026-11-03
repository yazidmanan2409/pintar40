import "server-only";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";
import { adalahCookieSesi } from "@/lib/sesi";
import { bacaDaftarKelola, bacaStatusSaya, STATUS_KOSONG, type DaftarKelola, type StatusSaya } from "@/lib/pemeliharaan-kontrak";

export * from "@/lib/pemeliharaan-kontrak";

/**
 * #148: the reads of maintenance and notices. `pintar_status_saya` is the one question a page asks as it begins
 * (D-094(d)); the pre-request lets it through even while a window stops the reader, so it can say what stops them.
 * Nobody signed in asks nothing. A read that fails says nothing rather than something untrue.
 */
export async function statusSaya(): Promise<StatusSaya> {
  const toples = await cookies();
  if (!toples.getAll().some((c) => adalahCookieSesi(c.name))) return STATUS_KOSONG;
  try {
    const supabase = await supabaseServer();
    const { data, error } = await supabase.rpc("pintar_status_saya");
    if (error) {
      // a shared computer's locked or ended session (BOB-29, PT423/PT401) reads nothing until it is opened: expected,
      // so not logged; its page is the lock screen or the sign-in, which say what they need to
      if (error.code !== "PT423" && error.code !== "PT401") {
        console.error("[pemeliharaan] pintar_status_saya failed", error.code, error.message);
      }
      return STATUS_KOSONG;
    }
    return bacaStatusSaya(data);
  } catch {
    return STATUS_KOSONG;
  }
}

/**
 * The windows and notices this administrator may act on, newest first; null when the read fails. W2.10 (CR-49): a page
 * of each at a time, and, in a school's working context, that school's windows and the notices that are not
 * platform-wide, decided by the database (maintenance_list).
 */
export async function daftarKelola(halaman: { jendela?: number; pengumuman?: number; sekolah?: string | null } = {}): Promise<DaftarKelola | null> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("maintenance_list", {
    p_hal_jendela: halaman.jendela ?? 1, p_hal_pengumuman: halaman.pengumuman ?? 1, p_sekolah: halaman.sekolah ?? null,
  });
  if (error) {
    console.error("[pemeliharaan] maintenance_list failed", error.code, error.message);
    return null;
  }
  return bacaDaftarKelola(data);
}
