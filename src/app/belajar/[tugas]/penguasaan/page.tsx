import { notFound, redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { currentLocale } from "@/lib/locale";
import * as engine from "@/lib/assessment-engine";
import PermukaanAsesmen from "../../_components/PermukaanAsesmen";

export const dynamic = "force-dynamic";

/**
 * Uji Penguasaan — the cycle's Mastery Check (§4). Formal: counting-up timer,
 * pause where the definition allows it, flag-for-review, a navigator, and no
 * auto-advance. Zero overlap with the mapping is enforced in the draw
 * (INV-24), in the database, not here.
 *
 * As with the mapping, arriving is no longer committing: the orientation is
 * shown first and the session begins on a press.
 */
export default async function Penguasaan({ params }: { params: Promise<{ tugas: string }> }) {
  const { tugas } = await params;
  const db = (await supabaseServer()) as unknown as engine.EngineClient;
  const state = await engine.cycleState(db, tugas);
  if (!state.post_assignment) notFound();
  if (state.pre_status !== "FINALIZED") redirect(`/belajar/${tugas}`);
  if (state.post_status === "FINALIZED") redirect(`/belajar/${tugas}/hasil`);

  const mine = (await engine.myAssignments(db)).find((a) => a.learning_assignment_id === tugas);
  if (!mine) notFound();

  return (
    <PermukaanAsesmen
      penugasan={state.post_assignment}
      sesi={state.post_session}
      locale={await currentLocale()}
      eyebrow={`${mine.subject} · ${mine.grade_label} · ${mine.title}`}
      kembali={{ href: `/belajar/${tugas}`, key: "cycle.title" }}
      diriHref={`/belajar/${tugas}/penguasaan`}
      selesaiHref={`/belajar/${tugas}/hasil`}
      mode="PENGUASAAN"
    />
  );
}
