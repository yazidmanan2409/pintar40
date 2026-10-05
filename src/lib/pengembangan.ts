import "server-only";
import { supabaseServer } from "@/lib/supabase/server";
import { bacaCatatan, bacaTempatCatatan, type CatatanPengembangan, type TempatCatatan } from "@/lib/pengembangan-kontrak";

export * from "@/lib/pengembangan-kontrak";

/**
 * BOB-44 / BOB-47 (D-069, D-070): THE READS OF EDUCATORS' PROFESSIONAL LEARNING, each one database call that decides
 * who may ask. Nothing here checks a role: a reader the database refuses gets null or an empty list.
 */

/** The record of one place, or null when this reader may not open it (or it is not one). */
export async function catatan(simpul: string): Promise<CatatanPengembangan | null> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(simpul)) return null;
  const c = await supabaseServer();
  const { data, error } = await c.rpc("professional_learning_record", { p_node: simpul });
  return error ? null : bacaCatatan(data);
}

/** The professional-learning Kelas whose record this reader may open: the links from their home (DAISY-34). */
export async function tempatCatatan(): Promise<TempatCatatan[]> {
  const c = await supabaseServer();
  const { data, error } = await c.rpc("professional_record_places");
  return error ? [] : bacaTempatCatatan(data);
}

export type TempatPeserta = { id: string; nama: string; tingkat: string | null; tahun: string | null };
export type CalonPeserta = { id: string; nama: string };

/** DAISY-32's form: the places this school's administrator may enrol into, and the people D-070(c) allows. */
export async function formulirPeserta(institusi: string): Promise<{ tempat: TempatPeserta[]; calon: CalonPeserta[] }> {
  const c = await supabaseServer();
  const [t, o] = await Promise.all([
    c.rpc("professional_learning_places", { p_institution: institusi }),
    c.rpc("professional_learning_candidates", { p_institution: institusi }),
  ]);
  const tempat = (Array.isArray(t.data) ? t.data : []) as Array<{ node_id: string; name: string; tingkat: string | null; academic_year: string | null }>;
  const calon = (Array.isArray(o.data) ? o.data : []) as Array<{ person_id: string; display_name: string }>;
  return {
    tempat: t.error ? [] : tempat.map((x) => ({ id: x.node_id, nama: x.name, tingkat: x.tingkat, tahun: x.academic_year })),
    calon: o.error ? [] : calon.map((x) => ({ id: x.person_id, nama: x.display_name })),
  };
}
