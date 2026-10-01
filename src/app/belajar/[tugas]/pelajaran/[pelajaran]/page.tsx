import Link from "next/link";
import { notFound } from "next/navigation";
import { t, format, type HleEvent } from "@/lib/hle";
import { supabaseServer } from "@/lib/supabase/server";
import { currentLocale } from "@/lib/locale";
import * as engine from "@/lib/assessment-engine";
import { lessonRead } from "@/lib/siklus";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import KakiPintar from "@/components/KakiPintar";
import LessonPlayer from "../../../_components/LessonPlayer";
import { saveLessonProgress } from "../../../actions";
import { TeksBaris } from "@/components/teks/Teks";

export const dynamic = "force-dynamic";

/**
 * SCREEN C — THE LESSON.
 *
 * The lesson served is the one belonging to the release the Learning
 * Assignment binds (§3): `learner_lessons()` reads the assignment, never "the
 * newest release". Media is referenced by storage path and resolved to a
 * short-lived signed URL by the server route; no public URL exists anywhere in
 * the chain (FABLE-01 §7, INV-15).
 *
 * READING POSITION IS SAVED, AND THE LEARNER IS TOLD ONCE. There is no save
 * button and no prompt: the position is the product's job to remember, and
 * asking somebody to remember it for us would be the complexity leaking. The
 * telling is true or absent (W5): the player shows it only while the server
 * holds the page on screen, never because a save was attempted.
 */
export default async function Pelajaran(
  { params }: { params: Promise<{ tugas: string; pelajaran: string }> },
) {
  const { tugas, pelajaran } = await params;
  const locale = await currentLocale();
  const db = (await supabaseServer()) as unknown as engine.EngineClient;
  const s = (k: HleEvent) => t(k, "learner", { locale });

  const all = await engine.lessons(db, tugas);
  const lesson = all.find((l) => l.lesson_id === pelajaran);
  if (!lesson) notFound();

  const supabase = await supabaseServer();
  // W2 (T1): the player keys what this device remembers by the person, never the device
  const { data: orang } = await supabase.rpc("current_person_id");
  const media = await Promise.all(
    (lesson.media ?? []).map(async (m) => {
      const { data } = await supabase.rpc("may_read_lesson_media", { p_path: m.path });
      // BOB-11: `alih=1` answers with the file itself (a redirect), which a <video> or <audio> can play
      return { ...m, url: data === true ? `/api/assets/read-url?path=${encodeURIComponent(m.path)}&alih=1` : null };
    }),
  );

  const idx = all.findIndex((l) => l.lesson_id === pelajaran);
  const next = all[idx + 1];
  const prev = all[idx - 1];
  const semuaDibaca = all.length > 0 && all.every(lessonRead);

  return (
    <>
      <CangkangPengalaman locale={locale} current="belajar" />
      <main className="pin-col">
        <Link className="pin-back" href={`/belajar/${tugas}`}>
          ← {s("cycle.title")}
        </Link>
        <div className="pin-head">
          <p className="pin-eyebrow">
            {s("lesson.title")} {format.number(idx + 1, locale)} {s("siklus.dari")}{" "}
            {format.number(all.length, locale)} · {lesson.modul}
          </p>
          <h1 className="pin-h1">{lesson.judul}</h1>
          {lesson.ringkasan ? <p className="pin-intro"><TeksBaris teks={lesson.ringkasan} /></p> : null}
          {lesson.halaman ? (
            <p className="pin-meta">
              {s("map.page")} {lesson.halaman}
            </p>
          ) : null}
        </div>

        <div className="pin-lesson">
          <LessonPlayer
            learningAssignmentId={tugas}
            lessonId={lesson.lesson_id}
            title={lesson.judul}
            bodyMarkdown={lesson.isi}
            workedExamples={(lesson.contoh ?? []) as Array<{ judul?: string; langkah?: string[] }>}
            media={media}
            startAt={lesson.furthest_position}
            personId={typeof orang === "string" ? orang : null}
            saveProgress={saveLessonProgress}
            savedNote={s("lesson.saved")}
          />

          <div className="pin-actions">
            {next ? (
              <Link className="pin-btn pin-primary" href={`/belajar/${tugas}/pelajaran/${next.lesson_id}`}>
                {s("siklus.pelajaran_next")}
              </Link>
            ) : semuaDibaca ? (
              <Link className="pin-btn pin-primary" href={`/belajar/${tugas}/penguasaan`}>
                {s("cycle.step.posttest")}
              </Link>
            ) : null}
            {prev ? (
              <Link className="pin-btn" href={`/belajar/${tugas}/pelajaran/${prev.lesson_id}`}>
                {s("siklus.pelajaran_prev")}
              </Link>
            ) : null}
          </div>
        </div>

        <KakiPintar />
      </main>
    </>
  );
}
