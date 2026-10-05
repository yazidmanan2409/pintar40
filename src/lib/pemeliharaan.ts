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
      console.error("[pemeliharaan] pintar_status_saya failed", error.code, error.message);
      return STATUS_KOSONG;
    }
    return bacaStatusSaya(data);
  } catch {
    return STATUS_KOSONG;
  }
}

/** The windows and notices this administrator may act on, newest first; null when the read fails. */
export async function daftarKelola(): Promise<DaftarKelola | null> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("maintenance_list");
  if (error) {
    console.error("[pemeliharaan] maintenance_list failed", error.code, error.message);
    return null;
  }
  return bacaDaftarKelola(data);
}
