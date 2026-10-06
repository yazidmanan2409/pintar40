import "server-only";
import { supabaseServer } from "@/lib/supabase/server";
import { pilihTemplat, type BarisTemplat, type LaporanStandar } from "@/lib/laporan-kontrak";
import { pilihanTempat, type SimpulPohon } from "@/lib/struktur-kontrak";

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

/**
 * W9 (J7.3): THE NAME A READER KNOWS A PLACE BY, for report rows that carry
 * only a node id (the cohort comparison). The visible path and year, as the
 * intake labels a place (`pilihanTempat`); the node's own name when the place
 * is no longer active, so a historical row is never blank. RLS-bounded reads
 * as the signed-in reader: a place the reader may not see gets no name.
 */
export async function namaTempat(ids: readonly string[]): Promise<Record<string, string>> {
  const unik = [...new Set(ids)].filter((x) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x));
  if (unik.length === 0) return {};
  const supabase = await supabaseServer();
  const { data: dicari } = await supabase.from("org_nodes").select("id, jalur").in("id", unik);
  const leluhur = [...new Set(((dicari ?? []) as Array<{ id: string; jalur: string[] | null }>).flatMap((n) => [n.id, ...(n.jalur ?? [])]))];
  if (leluhur.length === 0) return {};
  const { data: simpul } = await supabase.from("org_nodes")
    .select("id, name, kind, parent_id, jalur, academic_period_id, is_active").in("id", leluhur);
  const nodes = (simpul ?? []) as SimpulPohon[];
  const periodeIds = [...new Set(nodes.map((n) => n.academic_period_id).filter((x): x is string => !!x))];
  const { data: periode } = periodeIds.length
    ? await supabase.from("academic_periods").select("id, name").in("id", periodeIds)
    : { data: [] };
  const tahun = new Map(((periode ?? []) as Array<{ id: string; name: string }>).map((p) => [String(p.id), String(p.name)]));
  const label = new Map(pilihanTempat(nodes, tahun).map((t) => [t.id, t.label]));
  return Object.fromEntries(unik.flatMap((id) => {
    const n = nodes.find((x) => x.id === id);
    const nama = label.get(id) ?? (n ? String(n.name) : null);
    return nama ? [[id, nama]] : [];
  }));
}
