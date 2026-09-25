import { supabaseServer } from "@/lib/supabase/server";
import { button, can, card, field, label, outcomeLine, s, studioInstitutions, when } from "../_lib";
import { launchQuickAssessmentAction } from "../actions";

/**
 * Quick Assessment (ADR-0018).
 *
 * One action: pick the class, pick the chapter you just taught, launch. The
 * chapter list is the union of two sources and the page does not say which is
 * which in any technical sense — a teacher sees "your school's package" and
 * "the PINTAR library you may teach", never a tenant kind and never a
 * distribution status. Whether a canonical chapter is offered at all is
 * decided by `distributed_releases()`, which is the database's answer to the
 * same question the launcher will re-ask.
 *
 * WHAT THIS PAGE DOES NOT DO. It does not filter for safety: every option
 * shown is re-authorized by `launch_quick_assessment`, and a hand-made POST
 * naming an unauthorized module gets the same refusal as a tampered form.
 * Hiding a control is never what makes something safe.
 *
 * WITHDRAWAL, IN PLAIN LANGUAGE. A launched quick assessment whose material is
 * no longer available to this school keeps its row — nothing here deletes
 * history — and says so in a sentence a teacher can act on. Work already
 * finished stays finished (ADR-0018, INV-27).
 */
type Search = Promise<{ hasil?: string; kode?: string; ref?: string; n?: string; masalah?: string; kelas?: string }>;

export default async function Kuis({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const supabase = await supabaseServer();
  const institutions = (await studioInstitutions()).filter((i) => can(i, "CAN_QUICK_ASSESSMENT"));
  const institutionIds = institutions.map((i) => i.id);

  const [{ data: nodes }, { data: courses }, { data: releases }] = await Promise.all([
    institutionIds.length
      ? supabase.from("org_nodes").select("id, name, kind, institution_id")
          .in("institution_id", institutionIds).in("kind", ["CLASS", "COHORT"])
          .eq("is_active", true).order("name")
      : Promise.resolve({ data: [] as Array<Record<string, string>> }),
    supabase.from("courses").select("id, title, institution_id").order("title"),
    supabase.rpc("distributed_releases"),
  ]);

  // The school's own chapters.
  const ownCourses = new Map((courses ?? []).map((c) => [c.id as string, c]));
  const { data: ownModules } = ownCourses.size
    ? await supabase.from("modules").select("id, title, ordinal, course_id, institution_id")
        .in("course_id", Array.from(ownCourses.keys())).order("ordinal")
    : { data: [] as Array<Record<string, unknown>> };

  // The authorized library chapters, one outline call per active release.
  type ReleaseRow = { plp_release_id: string; course_title: string; distribution_status: string };
  const active = ((releases ?? []) as ReleaseRow[]).filter((r) => r.distribution_status === "ACTIVE");
  const outlines = await Promise.all(
    active.map(async (r) => ({
      release: r,
      rows: (await supabase.rpc("distributed_release_outline", { p_release: r.plp_release_id })).data ?? [],
    })),
  );
  const libraryModules = outlines.flatMap(({ release, rows }) => {
    const seen = new Map<string, { id: string; title: string; course: string }>();
    for (const row of rows as Array<Record<string, string>>) {
      if (row.module_id && !seen.has(row.module_id)) {
        seen.set(row.module_id, {
          id: row.module_id, title: row.module_title, course: release.course_title as string,
        });
      }
    }
    return Array.from(seen.values());
  });

  // Everything this school may currently teach, for the withdrawal note below.
  const availableModuleIds = new Set([
    ...(ownModules ?? []).map((m) => m.id as string),
    ...libraryModules.map((m) => m.id),
  ]);

  const { data: launched } = institutionIds.length
    ? await supabase.from("assessment_assignments")
        .select("id, node_id, opens_at, closes_at, status, assessment_definition_id, institution_id")
        .in("institution_id", institutionIds).order("assigned_at", { ascending: false }).limit(20)
    : { data: [] as Array<Record<string, unknown>> };
  const definitionIds = (launched ?? []).map((a) => a.assessment_definition_id as string);
  const { data: definitions } = definitionIds.length
    ? await supabase.from("assessment_definitions")
        .select("id, title, module_id, item_count, is_ad_hoc").in("id", definitionIds)
    : { data: [] as Array<Record<string, unknown>> };
  const byDefinition = new Map((definitions ?? []).map((d) => [d.id as string, d]));
  const nodeName = new Map((nodes ?? []).map((n) => [n.id as string, n.name as string]));
  const quick = (launched ?? []).filter((a) => byDefinition.get(a.assessment_definition_id as string)?.is_ad_hoc);

  const chosenClass = sp.kelas ?? (nodes ?? [])[0]?.id ?? "";

  return (
    <div className="grid gap-6">
      <h2 className="text-lg font-medium">{s("studio.kuis.judul")}</h2>
      {outcomeLine(sp) ? <p className={card}>{outcomeLine(sp)}</p> : null}
      <p className="text-sm text-ink-2">{s("studio.kuis.pengantar")}</p>

      <section className={card} id="kuis">
        {(nodes ?? []).length === 0 ? (
          <p className="text-sm text-ink-2">{s("studio.kuis.tanpa_kelas")}</p>
        ) : availableModuleIds.size === 0 ? (
          <p className="text-sm text-ink-2">{s("studio.kuis.bab_kosong")}</p>
        ) : (
          <form action={launchQuickAssessmentAction} className="grid gap-2">
            <label className={label}>
              <span>{s("studio.kuis.kelas")}</span>
              <select className={field} name="kelas" defaultValue={chosenClass} required>
                {(nodes ?? []).map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
              </select>
            </label>
            <label className={label}>
              <span>{s("studio.kuis.bab")}</span>
              <select className={field} name="modul" required>
                {(ownModules ?? []).length ? (
                  <optgroup label={s("studio.kuis.sumber_sekolah")}>
                    {(ownModules ?? []).map((m) => (
                      <option key={m.id as string} value={m.id as string}>
                        {ownCourses.get(m.course_id as string)?.title} — {m.title as string}
                      </option>
                    ))}
                  </optgroup>
                ) : null}
                {libraryModules.length ? (
                  <optgroup label={s("studio.kuis.sumber_pustaka")}>
                    {libraryModules.map((m) => (
                      <option key={m.id} value={m.id}>{m.course} — {m.title}</option>
                    ))}
                  </optgroup>
                ) : null}
              </select>
            </label>
            <div className="flex flex-wrap gap-2">
              <label className={label}>
                <span>{s("studio.kuis.jumlah")}</span>
                <input className={field} name="jumlah" type="number" defaultValue={5} required />
              </label>
              <label className={label}>
                <span>{s("studio.kuis.menit")}</span>
                <input className={field} name="menit" type="number" defaultValue={15} required />
              </label>
            </div>
            <button className={button} type="submit">{s("studio.kuis.luncurkan")}</button>
          </form>
        )}
      </section>

      <section className="grid gap-2">
        <h3 className="font-medium">{s("studio.kuis.riwayat")}</h3>
        {quick.length === 0 ? <p className={card}>{s("studio.kuis.kosong")}</p> : null}
        <ul className="grid gap-2">
          {quick.map((a) => {
            const d = byDefinition.get(a.assessment_definition_id as string);
            const gone = d?.module_id ? !availableModuleIds.has(d.module_id as string) : false;
            return (
              <li key={a.id as string} className={card}>
                <p className="font-medium">{d?.title as string}</p>
                <p className="mt-1 text-sm text-ink-3 tabular-nums">
                  {nodeName.get(a.node_id as string) ?? ""} · {d?.item_count as number} · {when(a.closes_at as string)}
                </p>
                {gone ? <p className="mt-2 text-sm text-ink-2">{s("studio.kuis.tidak_tersedia")}</p> : null}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
