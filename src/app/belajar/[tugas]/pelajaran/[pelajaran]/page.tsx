import Link from "next/link";
import { notFound } from "next/navigation";
import { t } from "@/lib/hle";
import { supabaseServer } from "@/lib/supabase/server";
import * as engine from "@/lib/assessment-engine";
import LessonPlayer from "../../../_components/LessonPlayer";
import { saveLessonProgress } from "../../../actions";

export const dynamic = "force-dynamic";

/**
 * The lesson served is the one belonging to the release the Learning
 * Assignment binds (§3) — `learner_lessons()` reads the assignment, never
 * "the newest release". Media is referenced by storage path and resolved to a
 * short-lived signed URL by the server route; no public URL exists anywhere in
 * the chain (FABLE-01 §7, INV-15).
 */
export default async function Pelajaran(
  { params }: { params: Promise<{ tugas: string; pelajaran: string }> },
) {
  const { tugas, pelajaran } = await params;
  const db = (await supabaseServer()) as unknown as engine.EngineClient;
  const all = await engine.lessons(db, tugas);
  const lesson = all.find((l) => l.lesson_id === pelajaran);
  if (!lesson) notFound();

  const supabase = await supabaseServer();
  const media = await Promise.all(
    (lesson.media ?? []).map(async (m) => {
      const { data } = await supabase.rpc("may_read_lesson_media", { p_path: m.path });
      return { ...m, url: data === true ? `/api/assets/read-url?path=${encodeURIComponent(m.path)}` : null };
    }),
  );

  const idx = all.findIndex((l) => l.lesson_id === pelajaran);
  const next = all[idx + 1];

  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <p className="text-sm text-ink-3">
        <Link href={`/belajar/${tugas}`}>{t("cycle.title", "learner")}</Link> · {lesson.modul}
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{lesson.judul}</h1>
      {lesson.ringkasan && <p className="mt-3 max-w-[var(--measure)] text-ink-2">{lesson.ringkasan}</p>}
      {lesson.halaman && <p className="mt-1 text-sm text-ink-3">{t("map.page", "learner")} {lesson.halaman}</p>}

      <LessonPlayer
        learningAssignmentId={tugas}
        lessonId={lesson.lesson_id}
        title={lesson.judul}
        bodyMarkdown={lesson.isi}
        workedExamples={(lesson.contoh ?? []) as Array<{ judul?: string; langkah?: string[] }>}
        media={media}
        startAt={lesson.furthest_position}
        saveProgress={saveLessonProgress}
      />

      <nav className="mt-10 flex justify-between border-t border-line-1 pt-6">
        {next ? (
          <Link href={`/belajar/${tugas}/pelajaran/${next.lesson_id}`} className="text-primary underline">
            {next.judul}
          </Link>
        ) : <span />}
        <Link href={`/belajar/${tugas}/penguasaan`} className="text-primary underline">
          {t("cycle.step.posttest", "learner")}
        </Link>
      </nav>
    </main>
  );
}
