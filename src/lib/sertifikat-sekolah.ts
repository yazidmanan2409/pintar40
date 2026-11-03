import "server-only";
import { supabaseServer } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * W2.5 (Batch 5; CR-05): the school a certificate belongs to, read under the reader's own rights (sertifikat_sekolah by
 * id answers whoever may revoke it), so a revocation is checked against the working context before it acts (D-132(k)).
 * Null when it cannot be read; the database then refuses what this person may not touch.
 */
export async function sekolahSertifikat(id: unknown): Promise<string | null> {
  if (typeof id !== "string" || !UUID.test(id)) return null;
  const { data } = await (await supabaseServer()).rpc("sertifikat_sekolah", { p_sekolah: null, p_cari: null, p_hal: 1, p_id: id });
  const sekolah = ((Array.isArray(data) ? data : []) as Array<{ institution_id?: unknown }>)[0]?.institution_id;
  return typeof sekolah === "string" ? sekolah : null;
}
