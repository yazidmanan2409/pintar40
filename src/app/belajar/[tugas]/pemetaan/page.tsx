import { redirect } from "next/navigation";
import { namaBab } from "@/lib/nama-bab";
import { supabaseServer } from "@/lib/supabase/server";
import { currentLocale } from "@/lib/locale";
import * as engine from "@/lib/assessment-engine";
import { tugasSaya } from "@/lib/tugas-saya";
import PermukaanAsesmen from "../../_components/PermukaanAsesmen";
import HalamanPenolakan from "@/components/HalamanPenolakan";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import { peranSaya } from "@/lib/tur-negara";
import { personaPembelajaran } from "@/lib/pembelajaran";
import { judulHalaman } from "@/lib/judul-halaman";
import { kesempatanSaya } from "@/lib/pengerjaan";

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

  // A test that is not there is never a 404 (BOB-04, D-008): it says so, and the way back is to the lesson. R-8 (X-2;
  // Daisy, X2-CATATAN-DESAIN.md): an assignment that is not the reader's answers «not found», as the assignment's own
  // page does, so «not yours» and «does not exist» are one answer; a failed read of their own stays the refusal page.
  const mine = await tugasSaya(db, tugas);
  const state = await engine.cycleState(db, tugas).catch(() => null);
  // W2.16 (DAISY-35 item 2): a refusal here speaks to the reader's own context (an educator reads as an educator)
  const persona = personaPembelajaran(await peranSaya());
  if (!state) return <HalamanPenolakan locale={locale} persona={persona} />;
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
  // A1 (O41-16): once an independent approval has granted one more attempt, the finished sitting no longer closes the
  // way in: the orientation is offered again (the database decides the start, as always)
  const sekaliLagi = state.pre_status === "FINALIZED" ? await kesempatanSaya(state.pre_assignment) : false;
  if (state.pre_status === "FINALIZED" && !sekaliLagi) redirect(`/belajar/${tugas}/peta`);

  return (
    <PermukaanAsesmen
      penugasan={state.pre_assignment}
      sesi={sekaliLagi ? null : state.pre_session}
      locale={locale}
      eyebrow={namaBab(mine.subject, mine.title, mine.grade_label)}
      kembali={{ href: `/belajar/${tugas}`, key: "cycle.title" }}
      diriHref={`/belajar/${tugas}/pemetaan`}
      selesaiHref={`/belajar/${tugas}/peta`}
      bab={{ jenis: "PRE_TEST", judul: mine.title }}
      mode="PEMETAAN"
    />
  );
}
