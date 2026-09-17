import Link from "next/link";
import { notFound } from "next/navigation";
import { t, type HleEvent } from "@/lib/hle";
import { supabaseServer } from "@/lib/supabase/server";
import { currentLocale } from "@/lib/locale";
import * as engine from "@/lib/assessment-engine";
import { lessonRead } from "@/lib/siklus";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import KakiPintar from "@/components/KakiPintar";
import PetaBacaan from "@/components/siklus/PetaBacaan";

export const dynamic = "force-dynamic";

/**
 * The reading map on its own — where the mapping hands off to the reading.
 *
 * NOT A RESULTS PAGE (§2): no score, no percentage, no count of what was
 * wrong. A learner arrives here straight from the Initial Mapping, and the
 * first thing they should meet is what to read, not how they did. The map
 * itself also sits on the assignment screen; this route is the landing, and
 * both render the same component so the two can never say different things.
 */
export default async function Peta({ params }: { params: Promise<{ tugas: string }> }) {
  const { tugas } = await params;
  const locale = await currentLocale();
  const db = (await supabaseServer()) as unknown as engine.EngineClient;
  const s = (k: HleEvent) => t(k, "learner", { locale });

  const state = await engine.cycleState(db, tugas);
  if (!state.pre_session || state.pre_status !== "FINALIZED") notFound();

  const [kartu, lessons] = await Promise.all([
    engine.readingMap(db, state.pre_session),
    engine.lessons(db, tugas),
  ]);
  const berikutnya = lessons.find((l) => !lessonRead(l));

  return (
    <>
      <CangkangPengalaman locale={locale} current="belajar" />
      <main className="pin-col">
        <Link className="pin-back" href={`/belajar/${tugas}`}>
          ← {s("cycle.title")}
        </Link>
        <div className="pin-head">
          <p className="pin-eyebrow">{s("pretest.done")}</p>
          <h1 className="pin-h1">{s("map.title")}</h1>
          <p className="pin-intro">{s("map.intro")}</p>
        </div>

        <PetaBacaan kartu={kartu} locale={locale} />

        {berikutnya ? (
          <div className="pin-actions">
            <Link className="pin-btn pin-primary" href={`/belajar/${tugas}/pelajaran/${berikutnya.lesson_id}`}>
              {s("map.to_lesson")}
            </Link>
          </div>
        ) : null}

        <KakiPintar />
      </main>
    </>
  );
}
