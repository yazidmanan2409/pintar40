import "server-only";
import { supabaseServer } from "@/lib/supabase/server";
import {
  kodeGalatStruktur,
  rujukanGalat,
  type HasilDaftarStruktur,
  type SimpulStruktur,
} from "@/lib/struktur-kontrak";

/**
 * BOB-01 — ONE SCHOOL'S BAGIAN, TINGKAT AND KELAS, read as the signed-in user.
 *
 * A thin call to `school_structure`, which decides who may read it (an Admin
 * sekolah of the school or an Admin platform) and returns the three visible
 * levels only. Nothing here filters, sorts or authorizes; `susunStruktur` in
 * the contract file turns the rows into a tree when a screen wants one.
 *
 * A refusal comes back as its stable code; a failure nobody named comes back
 * as STRUCTURE_FAILED with a reference that is also logged here, next to the
 * database's own words, which never reach the page (D-011).
 */
export async function bacaStruktur(institusi: string): Promise<HasilDaftarStruktur> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(institusi)) {
    return { ok: false, code: "STRUCTURE_INPUT_INVALID" };
  }
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("school_structure", { p_institution: institusi });
  if (error || !Array.isArray(data)) {
    const code = kodeGalatStruktur(error);
    if (code !== "STRUCTURE_FAILED") return { ok: false, code };
    const ref = rujukanGalat();
    console.error(`[struktur ${ref}] school_structure failed`, error?.code, error?.message);
    return { ok: false, code, ref };
  }
  return { ok: true, rows: data as SimpulStruktur[] };
}
