"use server";

import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";
import { adalahCookieSesi } from "@/lib/sesi";
import { bacaStatusSaya, type StatusSaya } from "@/lib/pemeliharaan-kontrak";

/**
 * A2b (the Chief Architect's R-B, PLAN-A2B-C2W.md at e15fe966; Daisy's addition, A2B-C2W-KATA.md §1): the banner's
 * re-read at a stage boundary. One read of `pintar_status_saya`, as the page's own first read; null when it fails (no
 * session, a refusal, a network error), so the banner shows nothing new rather than something stale. It is called only
 * by PengingatPemeliharaan at a stage boundary (jadwalBacaUlang), never on an interval.
 */
export async function bacaUlangStatusSaya(): Promise<StatusSaya | null> {
  try {
    const toples = await cookies();
    if (!toples.getAll().some((c) => adalahCookieSesi(c.name))) return null;
    const supabase = await supabaseServer();
    const { data, error } = await supabase.rpc("pintar_status_saya");
    if (error) return null;
    return bacaStatusSaya(data);
  } catch {
    return null;
  }
}
