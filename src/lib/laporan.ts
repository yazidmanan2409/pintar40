import "server-only";
import { supabaseServer } from "@/lib/supabase/server";
import { pilihTemplat, type BarisTemplat, type LaporanStandar } from "@/lib/laporan-kontrak";

/**
 * BOB-06 (B6b) — THE TEMPLATE A SUMMARY AT THIS NODE READS, as the signed-in
 * reader: the node's school is read under `org_nodes_select`, that school's
 * templates under `report_templates_select`, and `pilihTemplat` chooses. Null
 * when the reader cannot see the node or the school has no such template.
 * Authorizes nothing: `generate_report` decides every figure per reader.
 */
export async function templatUntuk(
  standar: LaporanStandar,
  simpul: string,
): Promise<{ id: string; title_key: string } | null> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(simpul)) return null;
  const supabase = await supabaseServer();
  const { data: node } = await supabase.from("org_nodes").select("institution_id").eq("id", simpul).maybeSingle();
  const institusi = (node as { institution_id?: string } | null)?.institution_id;
  if (!institusi) return null;
  const { data } = await supabase
    .from("report_templates")
    .select("id, institution_id, standard_report, template_version, is_standard, title_key")
    .eq("institution_id", institusi)
    .eq("standard_report", standar);
  const t = pilihTemplat((data ?? []) as BarisTemplat[], institusi, standar);
  return t ? { id: t.id, title_key: t.title_key } : null;
}
