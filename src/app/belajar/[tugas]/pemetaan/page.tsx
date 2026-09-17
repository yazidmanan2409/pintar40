import { notFound, redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { currentLocale } from "@/lib/locale";
import * as engine from "@/lib/assessment-engine";
import PermukaanAsesmen from "../../_components/PermukaanAsesmen";

export const dynamic = "force-dynamic";

/**
 * Pemetaan Awal — the cycle's mapping (§1). DIAGNOSTIC: no pass/fail wording
 * anywhere on this screen or its result, no rationale, dots instead of a bar.
 *
 * The route now SHOWS the assessment before entering it. It used to call
 * `startSession()` during render, which made arriving at the URL the act of
 * committing — so the integrity disclosure could not be shown before the thing
 * it discloses about. The commitment is a form press inside `PermukaanAsesmen`.
 */
export default async function Pemetaan({ params }: { params: Promise<{ tugas: string }> }) {
  const { tugas } = await params;
  const db = (await supabaseServer()) as unknown as engine.EngineClient;
  const state = await engine.cycleState(db, tugas);
  if (!state.pre_assignment) notFound();
  if (state.pre_status === "FINALIZED") redirect(`/belajar/${tugas}/peta`);

  const mine = (await engine.myAssignments(db)).find((a) => a.learning_assignment_id === tugas);
  if (!mine) notFound();

  return (
    <PermukaanAsesmen
      penugasan={state.pre_assignment}
      sesi={state.pre_session}
      locale={await currentLocale()}
      eyebrow={`${mine.subject} · ${mine.grade_label} · ${mine.title}`}
      kembali={{ href: `/belajar/${tugas}`, key: "cycle.title" }}
      diriHref={`/belajar/${tugas}/pemetaan`}
      selesaiHref={`/belajar/${tugas}/peta`}
      mode="PEMETAAN"
    />
  );
}
