"use server";

import { headers } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";
import { catatPermintaanCetak, type LingkupCetak } from "@/app/api/_akuntabilitas/catat";
import { LAPORAN_CETAK, type HasilCetak, type PermintaanCetak } from "@/lib/akuntabilitas-kontrak";
import { templatUntuk } from "@/lib/laporan";
import { catatan } from "@/lib/pengembangan";
import { hasilBelajar } from "@/lib/hasil-belajar";
import { zonaSekolah } from "@/lib/zona-sekolah";
import { tanggal } from "@/lib/tanggal";
import { currentLocale } from "@/lib/locale";
import { sasaranDalamKonteks } from "@/lib/konteks-server";
import type * as engine from "@/lib/assessment-engine";

/**
 * B2 · «CETAK LAPORAN» (THE PLAN §5.2 B–D; B2-COMPLETION.md §1–§3).
 *
 * 1. WHO: the verified session's user, from Auth (`auth.getUser()`), never a value the request carries (Sharon's
 *    change 1). A learner's own-results print names that session's person; the database refuses any other.
 * 2. THE WORKING CONTEXT (§2.11): a print of a class's or a school's report is of the active context's school, or is not
 *    made here (CETAK_TIDAK_BOLEH; the page offers the chooser as for any other act). A learner's own results have no
 *    place (C1), as Belajar's other actions.
 *    MAY THEY READ IT: the same read the page makes, as the caller. A class or a node the person cannot read is refused
 *    as the page refuses it, and nothing is written.
 * 3. THE EVENT: B1's fail-closed writer (catatPermintaanCetak). No reference, no official print.
 * 4. THE FOOTER'S WORDS: the person's name as the platform holds it and the instant, on the school's clock (for a
 *    learner's own results: their one school's when the printout holds one school's results, else WIB), both the server's.
 */
export async function cetakLaporan(p: PermintaanCetak): Promise<HasilCetak> {
  const tolak: HasilCetak = { ok: false, kode: "CETAK_TIDAK_BOLEH" };
  if (!p || !(LAPORAN_CETAK as readonly string[]).includes(p.laporan)) return tolak;
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return tolak;
  const { data: profil } = await supabase.from("my_profile").select("person_id, display_name").maybeSingle();
  const orang = profil as { person_id?: string | null; display_name?: string | null } | null;
  if (!orang?.person_id) return tolak;

  let lingkup: LingkupCetak;
  let sekolah: string | null = null;
  const simpul = p.laporan !== "hasil.belajar" && typeof p.simpul === "string"
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(p.simpul) ? p.simpul : null;
  if (simpul) {
    const { data: node } = await supabase.from("org_nodes").select("institution_id").eq("id", simpul).maybeSingle();
    sekolah = (node as { institution_id?: string } | null)?.institution_id ?? null;
  }
  if (p.laporan !== "hasil.belajar" && !sekolah) return tolak;
  if (!(await sasaranDalamKonteks(p.laporan === "hasil.belajar" ? {} : { sekolah }))) return tolak;
  if (p.laporan === "hasil.belajar") {
    // the page's own read: nothing in it, nothing to print (§5.2 F; B2's correction of /belajar/hasil)
    const bab = await hasilBelajar(supabase as unknown as engine.EngineClient).catch(() => null);
    if (!bab || !bab.some((b) => b.keadaan !== "BERJALAN")) return tolak;
    lingkup = { person_id: orang.person_id };
    // Bob (B2-ARCHITECT-NOTES.md log): a printout holding one school's results is dated on that school's clock; one
    // spanning schools, or holding none, in WIB. The schools are the one read's, as the record's are
    const { data: tampil } = await supabase.rpc("hasil_belajar_sesi_saya");
    const sesi = ((tampil ?? []) as Array<{ pre_session: string | null; post_session: string | null }>)
      .flatMap((t) => [t.pre_session, t.post_session]).filter((x): x is string => typeof x === "string");
    if (sesi.length) {
      const { data: s } = await supabase.from("assessment_sessions").select("institution_id").in("id", sesi);
      const satu = [...new Set(((s ?? []) as Array<{ institution_id: string }>).map((x) => x.institution_id))];
      if (satu.length === 1) sekolah = satu[0];
    }
  } else if (simpul) {
    if (p.laporan === "ringkasan.pengembangan") {
      const isi = await catatan(simpul).catch(() => null);
      if (!isi || isi.peserta.length === 0) return tolak;
    } else {
      const template = await templatUntuk(p.laporan === "ringkasan.kelas" ? "class_learning_intelligence" : "institution_learning_intelligence", simpul);
      if (!template) return tolak;
      const { data, error } = await supabase.rpc("generate_report", { p_template: template.id, p_scope_node: simpul });
      const entries = ((data as { entries?: Array<{ status?: string }> } | null)?.entries ?? []);
      if (error || entries.length === 0 || entries.every((e) => e.status === "not_permitted")) return tolak;
    }
    lingkup = { node_id: simpul };
  } else {
    return tolak;
  }

  let ref: string;
  try {
    ({ ref } = await catatPermintaanCetak(await headers(), { authUserId: user.id, laporan: p.laporan, lingkup }));
  } catch {
    return { ok: false, kode: "CETAK_GAGAL" };
  }
  const zona = await zonaSekolah(supabase, sekolah);
  return { ok: true, ref, nama: orang.display_name ?? "", waktu: tanggal(new Date(), "resmiJam", await currentLocale(), zona) };
}
