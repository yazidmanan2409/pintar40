import Link from "next/link";
import { redirect } from "next/navigation";
import { t, format, type HleEvent } from "@/lib/hle";
import { supabaseServer } from "@/lib/supabase/server";
import { currentViewer } from "@/lib/auth";
import { currentLocale } from "@/lib/locale";
import * as engine from "@/lib/assessment-engine";
import { posisi, peringkat, statusKey, type Kandidat } from "@/lib/siklus";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import KakiPintar from "@/components/KakiPintar";
import JejakSiklus from "@/components/siklus/JejakSiklus";
import KartuTugas from "@/components/siklus/KartuTugas";

export const dynamic = "force-dynamic";

/**
 * SCREEN A — THE LEARNER'S HOME, AND IT IS NOT A DASHBOARD.
 *
 * The primary Slice-2 problem: a learner arriving here should not have to
 * choose. One panel carries the single most appropriate next action, decided
 * in `src/lib/siklus.ts` from cycle state and lesson progress rather than from
 * list position, and everything below it is quiet.
 *
 * FOUR SECTIONS, AND TWO OF THEM VANISH. "Perlu perhatian" and "Bisa
 * dikerjakan sekarang" are absent entirely when there is nothing in them —
 * honest absence, never an empty container explaining that it is empty. The
 * home of a learner with nothing to do is short, and that is the correct
 * shape for it.
 */
export default async function Belajar() {
  const viewer = await currentViewer();
  if (!viewer) redirect("/masuk?lanjut=/belajar");
  const locale = await currentLocale();
  const db = (await supabaseServer()) as unknown as engine.EngineClient;
  const s = (k: HleEvent) => t(k, "learner", { locale });

  const tugas = await engine.myAssignments(db);

  // One round of reads per assignment, then the ranking. The cycle state says
  // where the learner is; the lessons say how far through the reading they
  // are. Both are needed before anything can be called "next".
  const kandidat: Kandidat[] = await Promise.all(
    tugas.map(async (a): Promise<Kandidat> => {
      const [state, lessons] = await Promise.all([
        engine.cycleState(db, a.learning_assignment_id),
        engine.lessons(db, a.learning_assignment_id),
      ]);
      return {
        tugas: a,
        posisi: posisi(state, lessons),
        // A session already open or paused is the one obvious next action,
        // whatever step it belongs to.
        berjalan: Boolean(
          (state.post_session && state.post_status !== "FINALIZED") ||
            (state.pre_session && state.pre_status !== "FINALIZED"),
        ),
      };
    }),
  );
  const { utama, sisa } = peringkat(kandidat);

  // Q-12: what a learner may start that no learning assignment names. The RPC
  // returns exactly what `may_start_assessment()` accepts, so this list adds
  // no authority — everything in it is genuinely startable right now.
  const terbuka = await engine.openAssessments(db);

  /** Where a step actually leads, and what the button for it says. */
  function aksi(k: Kandidat): { href: string; labelKey: HleEvent } | null {
    const id = k.tugas.learning_assignment_id;
    switch (k.posisi.langkah) {
      case "PEMETAAN": return { href: `/belajar/${id}/pemetaan`, labelKey: "siklus.mulai" };
      case "PETA": return { href: `/belajar/${id}/peta`, labelKey: "siklus.lihat_peta" };
      case "PELAJARAN": return { href: `/belajar/${id}`, labelKey: "siklus.lanjutkan" };
      case "PENGUASAAN": return { href: `/belajar/${id}/penguasaan`, labelKey: "siklus.mulai" };
      case "HASIL": return { href: `/belajar/${id}/hasil`, labelKey: "siklus.buka" };
    }
  }

  // "Perlu perhatian": a cycle whose Mastery Check is the next thing and whose
  // reading is already done. It is not a deadline warning — PINTAR does not
  // have the learner's calendar — it is "this one is ready for you".
  const perhatian = sisa.filter(
    (k) => k.posisi.langkah === "PENGUASAAN" && !k.berjalan && k.posisi.pelajaranTotal > 0,
  );

  return (
    <>
      <CangkangPengalaman locale={locale} current="belajar" />
      <main className="pin-col">
        <div className="pin-head">
          <p className="pin-eyebrow">{s("siklus.beranda")}</p>
          <h1 className="pin-h1">
            {viewer.displayName ? `${s("siklus.halo")}, ${viewer.displayName}` : s("siklus.halo")}
          </h1>
          {tugas.length > 0 ? <p className="pin-intro">{s("siklus.hari_ini")}</p> : null}
        </div>

        {/* THE ONE THING. The only element on this page standing on the primary
            ground, because there is only ever one of it. */}
        {utama ? (
          <section className="pin-lanjut">
            <p className="pin-eyebrow">{s("siklus.lanjutkan")}</p>
            <p className="pin-where">
              {utama.tugas.subject} · {utama.tugas.title}
            </p>
            <h2>
              {s(statusKey(utama.posisi) as HleEvent)}
              {utama.posisi.langkah === "PELAJARAN" && utama.posisi.pelajaranTotal > 0
                ? ` — ${format.number(utama.posisi.pelajaranSelesai, locale)} ${s("siklus.dari")} ${format.number(utama.posisi.pelajaranTotal, locale)} ${s("siklus.selesai_n")}`
                : ""}
            </h2>
            <JejakSiklus posisi={utama.posisi} locale={locale} />
            <div className="pin-actions">
              {(() => {
                const a = aksi(utama);
                return a ? (
                  <Link className="pin-btn pin-primary" href={a.href}>
                    {s(a.labelKey)}
                  </Link>
                ) : null;
              })()}
              <Link className="pin-btn" href={`/belajar/${utama.tugas.learning_assignment_id}`}>
                {s("siklus.buka")}
              </Link>
            </div>
          </section>
        ) : null}

        {perhatian.length > 0 ? (
          <section className="pin-sec">
            <h2>{s("siklus.perhatian")}</h2>
            {perhatian.map((k) => (
              <div className="pin-perhatian" key={k.tugas.learning_assignment_id}>
                <span className="pin-what">{k.tugas.title}</span>
                <span className="pin-why">{s("siklus.di.penguasaan")}</span>
                <div className="pin-actions">
                  <Link className="pin-btn" href={`/belajar/${k.tugas.learning_assignment_id}/penguasaan`}>
                    {s("siklus.mulai")}
                  </Link>
                </div>
              </div>
            ))}
          </section>
        ) : null}

        <section className="pin-sec">
          <h2>{s("siklus.milik_anda")}</h2>
          {tugas.length === 0 ? (
            <p className="pin-empty">{s("cycle.none")}</p>
          ) : (
            [...(utama ? [utama] : []), ...sisa].map((k) => (
              <KartuTugas
                key={k.tugas.learning_assignment_id}
                tugas={k.tugas}
                posisi={k.posisi}
                locale={locale}
                aksi={aksi(k)}
              />
            ))
          )}
        </section>

        {/* Q-12. Absent when there is nothing open, like every other section
            here that has nothing to say. */}
        {terbuka.length > 0 ? (
          <section className="pin-sec">
            <h2>{s("siklus.terbuka")}</h2>
            {terbuka.map((a) => (
              <div className="pin-tugas" key={a.assessment_assignment_id}>
                <span className="pin-ttitle">{a.title}</span>
                <div className="pin-tfoot">
                  <span className="pin-tstatus">
                    {format.number(a.item_count, locale)} {s("siklus.soal")} · {a.node_name}
                    {a.closes_at ? ` · ${s("siklus.ditutup")} ${format.date(a.closes_at, locale)}` : ""}
                  </span>
                  <Link className="pin-btn" href={`/belajar/asesmen/${a.assessment_assignment_id}`}>
                    {s("siklus.buka")}
                  </Link>
                </div>
              </div>
            ))}
          </section>
        ) : null}

        <KakiPintar />
      </main>
    </>
  );
}
