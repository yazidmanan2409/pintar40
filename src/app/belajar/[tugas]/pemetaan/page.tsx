import { redirect } from "next/navigation";
import { namaBab } from "@/lib/nama-bab";
import { supabaseServer } from "@/lib/supabase/server";
import { currentLocale } from "@/lib/locale";
import * as engine from "@/lib/assessment-engine";
import PermukaanAsesmen from "../../_components/PermukaanAsesmen";
import HalamanPenolakan from "@/components/HalamanPenolakan";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import { peranSaya } from "@/lib/tur-negara";
import { personaPembelajaran } from "@/lib/pembelajaran";
import { judulHalaman } from "@/lib/judul-halaman";

export const generateMetadata = judulHalaman("/belajar/[tugas]/pemetaan");

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
  const locale = await currentLocale();

  // NEVER A 404 (BOB-04, D-008). An assignment that is not the reader's gets
  // the one refusal page every refusal gets; a lesson whose test is not there
  // says so, and the way back is to the lesson.
  const mine = (await engine.myAssignments(db)).find((a) => a.learning_assignment_id === tugas);
  const state = mine ? await engine.cycleState(db, tugas).catch(() => null) : null;
  // W2.16 (DAISY-35 item 2): a refusal here speaks to the reader's own context (an educator reads as an educator)
  const persona = personaPembelajaran(await peranSaya());
  if (!mine || !state) return <HalamanPenolakan locale={locale} persona={persona} />;
  if (!state.pre_assignment) {
    // W2.12 (RV-7): nothing offers this any more (src/lib/siklus.ts tanpaPemetaan); reached by its address, it is
    // said inside the learner's shell, never as a dead end without one
    return (
      <>
        <CangkangPengalaman locale={locale} current="belajar" />
        <HalamanPenolakan locale={locale} persona={persona} messageKey="cycle.pemetaan.belum_ada" backHref={`/belajar/${tugas}`} backKey="cycle.title" />
      </>
    );
  }
  if (state.pre_status === "FINALIZED") redirect(`/belajar/${tugas}/peta`);

  return (
    <PermukaanAsesmen
      penugasan={state.pre_assignment}
      sesi={state.pre_session}
      locale={locale}
      eyebrow={namaBab(mine.subject, mine.title, mine.grade_label)}
      kembali={{ href: `/belajar/${tugas}`, key: "cycle.title" }}
      diriHref={`/belajar/${tugas}/pemetaan`}
      selesaiHref={`/belajar/${tugas}/peta`}
      mode="PEMETAAN"
    />
  );
}
