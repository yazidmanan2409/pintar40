import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { currentLocale } from "@/lib/locale";
import * as engine from "@/lib/assessment-engine";
import PermukaanAsesmen from "../../_components/PermukaanAsesmen";
import HalamanPenolakan from "@/components/HalamanPenolakan";

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
  const locale = await currentLocale();

  // NEVER A 404 (BOB-04, D-008). An assignment that is not the reader's gets
  // the one refusal page every refusal gets; a lesson whose test is not there
  // says so, and the way back is to the lesson.
  const mine = (await engine.myAssignments(db)).find((a) => a.learning_assignment_id === tugas);
  const state = mine ? await engine.cycleState(db, tugas).catch(() => null) : null;
  if (!mine || !state) return <HalamanPenolakan locale={locale} />;
  if (!state.post_assignment) {
    return <HalamanPenolakan locale={locale} messageKey="cycle.penguasaan.belum_ada" backHref={`/belajar/${tugas}`} backKey="cycle.title" />;
  }
  if (state.pre_status !== "FINALIZED") redirect(`/belajar/${tugas}`);
  if (state.post_status === "FINALIZED") redirect(`/belajar/${tugas}/hasil`);

  return (
    <PermukaanAsesmen
      penugasan={state.post_assignment}
      sesi={state.post_session}
      locale={locale}
      eyebrow={`${mine.subject} · ${mine.grade_label} · ${mine.title}`}
      kembali={{ href: `/belajar/${tugas}`, key: "cycle.title" }}
      diriHref={`/belajar/${tugas}/penguasaan`}
      selesaiHref={`/belajar/${tugas}/hasil`}
      mode="PENGUASAAN"
    />
  );
}
