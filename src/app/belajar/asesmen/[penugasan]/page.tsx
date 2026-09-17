import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { currentLocale } from "@/lib/locale";
import * as engine from "@/lib/assessment-engine";
import PermukaanAsesmen from "../../_components/PermukaanAsesmen";

export const dynamic = "force-dynamic";

/**
 * A QUICK ASSESSMENT — one that belongs to no learning cycle (Q-12).
 *
 * Same experience as the cycle's two assessments, reached a different way:
 * `my_open_assessments()` put it on the home, this route orients and enters
 * it. It has no reading map, no trail and no next lesson, because it is not a
 * step in anything — it is a teacher asking a class a question this week.
 *
 * FINDING THE SESSION, once one exists. There is no RPC that maps an
 * assignment to the caller's session, so this reads `assessment_sessions`
 * directly — which RLS already scopes to `person_id = current_person_id()`, so
 * the filter below narrows the caller's own rows and cannot widen them. Two
 * columns, and no status logic here: `session_state()` remains the authority
 * on what a session is doing, and the surface only needs to know that one
 * exists to render the player instead of the orientation.
 */
export default async function Asesmen({ params }: { params: Promise<{ penugasan: string }> }) {
  const { penugasan } = await params;
  const locale = await currentLocale();
  const supabase = await supabaseServer();
  const db = supabase as unknown as engine.EngineClient;

  // Discovery and entry ask the same question. If this assignment is not one
  // the learner may start, there is no orientation to show and no session to
  // resume, and the surface below renders the refusal.
  const terbuka = await engine.openAssessments(db);
  const ini = terbuka.find((a) => a.assessment_assignment_id === penugasan);

  const { data } = await supabase
    .from("assessment_sessions")
    .select("id, status")
    .eq("assessment_assignment_id", penugasan)
    .order("created_at", { ascending: false })
    .limit(1);
  const baris = (data ?? [])[0] as { id: string; status: string } | undefined;
  // A finished session is not one to re-enter: the learner is done with it,
  // and the player would be offering to answer questions already submitted.
  const sesi = baris && baris.status !== "FINALIZED" ? baris.id : null;

  if (!ini && !sesi) notFound();

  return (
    <PermukaanAsesmen
      penugasan={penugasan}
      sesi={sesi}
      locale={locale}
      eyebrow={ini ? ini.node_name : ""}
      kembali={{ href: "/belajar", key: "siklus.beranda" }}
      diriHref={`/belajar/asesmen/${penugasan}`}
      selesaiHref="/belajar"
      mode="PENGUASAAN"
    />
  );
}
