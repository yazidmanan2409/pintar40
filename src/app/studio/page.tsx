import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { card, s, studioInstitutions } from "./_lib";

/**
 * Studio home — "Beranda" (FABLE-05 §1).
 *
 * Task-first, not a dashboard of everything. `studio_home()` returns no row for
 * an empty bucket, so a card with a zero count cannot render: the emptiness is
 * in the data, not in a `count > 0` the page could forget.
 */
export default async function StudioBeranda() {
  const supabase = await supabaseServer();
  const institutions = await studioInstitutions();
  const byId = new Map(institutions.map((i) => [i.id, i.name]));

  // L3 (D-127 Q2): the working context's place only; studioInstitutions is already narrowed to it (an evaluation
  // persona keeps every school, C10), so what is shown here is read for those places alone
  const ids = institutions.map((i) => i.id);
  const [{ data: buckets }, { data: courses }] = await Promise.all([
    supabase.rpc("studio_home"),
    supabase.from("courses").select("id, title, subject, grade_label, institution_id").in("institution_id", ids)
      .order("created_at", { ascending: false }).limit(30),
  ]);

  const rows = ((buckets ?? []) as Array<{ bucket: string; institution_id: string; count: number }>)
    .filter((r) => byId.has(r.institution_id));

  return (
    <div className="grid gap-6">
      {/* RV-10 (D-140): no task waiting is not «no package»; the packages are listed below */}
      {rows.length === 0 ? (
        <p className={card}>{s("studio.beranda.tak_ada_tugas")}</p>
      ) : (
        <section className="grid gap-3 sm:grid-cols-2">
          {rows.map((r) => (
            <div key={`${r.bucket}:${r.institution_id}`} className={card}>
              <p className="text-sm text-ink-3">{byId.get(r.institution_id) ?? "\u2014"}</p>
              <p className="mt-1 font-medium">{s(`studio.bucket.${r.bucket}` as never)}</p>
              <p className="mt-2 text-2xl tabular-nums">{r.count}</p>
            </div>
          ))}
        </section>
      )}

      <section className="grid gap-2">
        <h2 className="text-lg font-medium">{s("studio.paket.judul")}</h2>
        {(courses ?? []).length === 0 ? (
          <p className={card}>{s("studio.paket.kosong")}</p>
        ) : (
          <ul className="grid gap-2">
            {(courses ?? []).map((c) => (
              <li key={c.id} className={card}>
                <Link href={`/studio/paket/${c.id}`} className="font-medium underline-offset-4 hover:underline">
                  {c.title}
                </Link>
                <p className="mt-1 text-sm text-ink-3">
                  {c.subject} · {c.grade_label} · {byId.get(c.institution_id) ?? "\u2014"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
