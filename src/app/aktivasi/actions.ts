"use server";

import { supabaseServer } from "@/lib/supabase/server";
import type { AnggotaKelas } from "@/components/aktivasi/kelas";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * W2.10 (Batch 5; D-153) with M7 (D-085): ONE CLASS'S LEARNERS FOR THE WHOLE-CLASS RUN, read when it starts. The
 * database answers only the learners of that Kelas who wait for an account and may hold a card, for a reader who may
 * provision people in its school (orang_kelas_menunggu_akun). It acts on nothing: each card is still asked and decided
 * per person through /api/akun/aktivasi. Null when the read is refused or fails.
 */
export async function anggotaKelasMenungguAksi(kelas: string): Promise<AnggotaKelas[] | null> {
  if (typeof kelas !== "string" || !UUID.test(kelas)) return null;
  const { data, error } = await (await supabaseServer()).rpc("orang_kelas_menunggu_akun", { p_kelas: kelas });
  if (error) return null;
  return ((Array.isArray(data) ? data : []) as Array<Record<string, unknown>>).map((o) => ({
    person_id: String(o.person_id), display_name: String(o.display_name ?? ""), institutional_id: String(o.institutional_id ?? ""),
  }));
}
