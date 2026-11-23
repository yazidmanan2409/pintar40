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

export const generateMetadata = judulHalaman("/belajar/[tugas]/penguasaan");

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

  // A test that is not there is never a 404 (BOB-04, D-008): it says so, and the way back is to the lesson. R-8 (X-2;
  // Daisy, X2-CATATAN-DESAIN.md): an assignment that is not the reader's answers «not found», as the assignment's own
  // page does, so «not yours» and «does not exist» are one answer; a failed read of their own stays the refusal page.
  const mine = await tugasSaya(db, tugas);
  const state = await engine.cycleState(db, tugas).catch(() => null);
  // W2.16 (DAISY-35 item 2): a refusal here speaks to the reader's own context (an educator reads as an educator)
  const persona = personaPembelajaran(await peranSaya());
  if (!state) return <HalamanPenolakan locale={locale} persona={persona} />;
  if (!state.post_assignment) {
    // W2.12 (RV-7): nothing offers this any more (src/lib/siklus.ts tanpaPemetaan); reached by its address, it is
    // said inside the learner's shell, never as a dead end without one
    return (
      <>
        <CangkangPengalaman locale={locale} current="belajar" />
        <HalamanPenolakan locale={locale} persona={persona} messageKey="cycle.penguasaan.belum_ada" backHref={`/belajar/${tugas}`} backKey="cycle.title" />
      </>
    );
  }
  if (state.pre_status !== "FINALIZED") redirect(`/belajar/${tugas}`);
  // A1 (O41-16): once an independent approval has granted one more attempt, the finished sitting no longer closes the
  // way in: the orientation is offered again (the database decides the start, as always)
  const sekaliLagi = state.post_status === "FINALIZED" ? await kesempatanSaya(state.post_assignment) : false;
  if (state.post_status === "FINALIZED" && !sekaliLagi) redirect(`/belajar/${tugas}/hasil`);

  return (
    <PermukaanAsesmen
      penugasan={state.post_assignment}
      sesi={sekaliLagi ? null : state.post_session}
      locale={locale}
      eyebrow={namaBab(mine.subject, mine.title, mine.grade_label)}
      kembali={{ href: `/belajar/${tugas}`, key: "cycle.title" }}
      diriHref={`/belajar/${tugas}/penguasaan`}
      selesaiHref={`/belajar/${tugas}/hasil`}
      bab={{ jenis: "POST_TEST", judul: mine.title }}
      mode="PENGUASAAN"
    />
  );
}
