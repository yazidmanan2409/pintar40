import Link from "next/link";
import { notFound } from "next/navigation";
import { t } from "@/lib/hle";
import { supabaseServer } from "@/lib/supabase/server";
import * as engine from "@/lib/assessment-engine";

/**
 * Peta Bacaan Personal (§2). Not a results page: no score, no percentage, no
 * count of what was wrong. One card per competency domain, in the order the
 * database ranked them — safety-missed, then mandatory, then recommended, then
 * already strong — each carrying where to read and a plain-language reason.
 */
const TIER_KEY = {
  PERLU_SEGERA: "map.tier.PERLU_SEGERA",
  WAJIB: "map.tier.WAJIB",
  DISARANKAN: "map.tier.DISARANKAN",
  KUAT: "map.tier.KUAT",
} as const;

const TIER_TONE = {
  PERLU_SEGERA: "border-attention bg-attention-soft",
  WAJIB: "border-info bg-info-soft",
  DISARANKAN: "border-line-1 bg-surface-1",
  KUAT: "border-ok bg-ok-soft",
} as const;

export default async function Peta({ params }: { params: Promise<{ tugas: string }> }) {
  const { tugas } = await params;
  const db = (await supabaseServer()) as unknown as engine.EngineClient;
  const state = await engine.cycleState(db, tugas);
  if (!state.pre_session || state.pre_status !== "FINALIZED") notFound();
  const cards = await engine.readingMap(db, state.pre_session);
  const lessons = await engine.lessons(db, tugas);
  const lessonByTitle = new Map(lessons.map((l) => [l.judul, l.lesson_id]));

  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <p className="text-sm text-ink-3"><Link href={`/belajar/${tugas}`}>{t("cycle.title", "learner")}</Link></p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t("map.title", "learner")}</h1>
      <p className="mt-3 max-w-[var(--measure)] text-ink-2">{t("map.intro", "learner")}</p>

      <ul className="mt-8 grid gap-4">
        {cards.map((c) => (
          <li key={c.kode} className={`rounded-[var(--radius-2)] border p-5 ${TIER_TONE[c.tingkat]}`}>
            <p className="text-sm font-medium">{t(TIER_KEY[c.tingkat], "learner")}</p>
            <h2 className="mt-1 text-lg font-medium">{c.pernyataan}</h2>
            <p className="mt-2 text-ink-2">{c.alasan}</p>
            <p className="mt-3 text-sm text-ink-3">
              {c.modul} · {c.pelajaran}
              {c.halaman ? ` · ${t("map.page", "learner")} ${c.halaman}` : ""}
            </p>
            {lessonByTitle.has(c.pelajaran) && (
              <Link
                href={`/belajar/${tugas}/pelajaran/${lessonByTitle.get(c.pelajaran)}`}
                className="mt-3 inline-block text-sm text-primary underline"
              >
                {t("map.to_lesson", "learner")}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
