import Link from "next/link";
import { notFound } from "next/navigation";
import { t, format, type HleEvent } from "@/lib/hle";
import { supabaseServer } from "@/lib/supabase/server";
import { currentLocale } from "@/lib/locale";
import * as engine from "@/lib/assessment-engine";
import { posisi, statusKey, lessonRead } from "@/lib/siklus";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import KakiPintar from "@/components/KakiPintar";
import JejakSiklus from "@/components/siklus/JejakSiklus";
import PetaBacaan from "@/components/siklus/PetaBacaan";

export const dynamic = "force-dynamic";

/**
 * SCREEN B — ONE ASSIGNMENT, AS A POSITION IN A JOURNEY.
 *
 * The trail says where the learner is in the five steps. The panel under it
 * says what the step actually is and offers the one action that continues it.
 * The reading map below is the personal ordering the engine derived from this
 * learner's own mapping evidence — it appears once the mapping is finished and
 * not before, because before that there is nothing to order.
 */
export default async function Tugas({ params }: { params: Promise<{ tugas: string }> }) {
  const { tugas } = await params;
  const locale = await currentLocale();
  const db = (await supabaseServer()) as unknown as engine.EngineClient;
  const s = (k: HleEvent) => t(k, "learner", { locale });

  const mine = (await engine.myAssignments(db)).find((a) => a.learning_assignment_id === tugas);
  if (!mine) notFound();

  const [state, lessons] = await Promise.all([
    engine.cycleState(db, tugas),
    engine.lessons(db, tugas),
  ]);
  const p = posisi(state, lessons);

  // The map is derived from the MAPPING session's evidence, so it exists only
  // once that session is finalized.
  const peta =
    state.pre_session && state.pre_status === "FINALIZED"
      ? await engine.readingMap(db, state.pre_session)
      : [];

  // The next unread lesson, which is what "continue" means here. The reading
  // map set the order; this follows it rather than inventing a second one.
  const berikutnya = lessons.find((l) => !lessonRead(l));

  const aksi: { href: string; labelKey: HleEvent } | null = (() => {
    switch (p.langkah) {
      case "PEMETAAN": return { href: `/belajar/${tugas}/pemetaan`, labelKey: "siklus.mulai" };
      case "PETA":
      case "PELAJARAN":
        return berikutnya
          ? { href: `/belajar/${tugas}/pelajaran/${berikutnya.lesson_id}`, labelKey: "siklus.lanjutkan" }
          : null;
      case "PENGUASAAN": return { href: `/belajar/${tugas}/penguasaan`, labelKey: "siklus.mulai" };
      case "HASIL": return { href: `/belajar/${tugas}/hasil`, labelKey: "siklus.buka" };
    }
  })();

  return (
    <>
      <CangkangPengalaman locale={locale} current="belajar" />
      <main className="pin-col">
        <Link className="pin-back" href="/belajar">
          ← {s("siklus.beranda")}
        </Link>
        <div className="pin-head">
          <p className="pin-eyebrow">
            {mine.subject} · {mine.grade_label}
          </p>
          <h1 className="pin-h1">{mine.title}</h1>
          <p className="pin-intro">{s("siklus.langkah_dari")}</p>
        </div>

        <JejakSiklus posisi={p} locale={locale} />

        <section className="pin-lanjut">
          <p className="pin-eyebrow">{s("siklus.sekarang")}</p>
          <h2>
            {s(statusKey(p) as HleEvent)}
            {p.langkah === "PELAJARAN" && p.pelajaranTotal > 0
              ? ` — ${format.number(p.pelajaranSelesai, locale)} ${s("siklus.dari")} ${format.number(p.pelajaranTotal, locale)} ${s("siklus.selesai_n")}`
              : ""}
          </h2>
          {peta.length > 0 ? <p className="pin-sub">{s("map.intro")}</p> : null}
          {aksi ? (
            <div className="pin-actions">
              <Link className="pin-btn pin-primary" href={aksi.href}>
                {s(aksi.labelKey)}
              </Link>
            </div>
          ) : null}
        </section>

        {peta.length > 0 ? (
          <section className="pin-sec">
            <h2>{s("siklus.peta_anda")}</h2>
            <PetaBacaan kartu={peta} locale={locale} />
          </section>
        ) : null}

        {lessons.length > 0 ? (
          <section className="pin-sec">
            <h2>{s("lesson.title")}</h2>
            <div className="pin-list">
              {lessons.map((l) => (
                <Link className="pin-row" key={l.lesson_id} href={`/belajar/${tugas}/pelajaran/${l.lesson_id}`}>
                  <span className="pin-eyebrow">{l.modul}</span>
                  <span className="pin-title">{l.judul}</span>
                  <span className="pin-rowmeta">
                    <span className={`pin-pill ${lessonRead(l) ? "pin-ok" : "pin-neutral"}`}>
                      {s(lessonRead(l) ? "siklus.di.hasil" : "cycle.open")}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <KakiPintar />
      </main>
    </>
  );
}
