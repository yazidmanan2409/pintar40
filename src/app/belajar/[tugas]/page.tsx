import Link from "next/link";
import { notFound } from "next/navigation";
import { t } from "@/lib/hle";
import { supabaseServer } from "@/lib/supabase/server";
import * as engine from "@/lib/assessment-engine";

/**
 * The cycle, as one screen. Each step says what it is and whether it is open
 * yet; nothing here names a status, a mode or a version (§9).
 */
export default async function Cycle({ params }: { params: Promise<{ tugas: string }> }) {
  const { tugas } = await params;
  const db = (await supabaseServer()) as unknown as engine.EngineClient;
  const mine = (await engine.myAssignments(db)).find((a) => a.learning_assignment_id === tugas);
  if (!mine) notFound();
  const state = await engine.cycleState(db, tugas);
  const lessons = await engine.lessons(db, tugas);

  const preDone = state.pre_status === "FINALIZED";
  const postDone = state.post_status === "FINALIZED";

  const steps = [
    {
      key: "pretest",
      label: t("cycle.step.pretest", "learner"),
      href: `/belajar/${tugas}/pemetaan`,
      open: true,
      done: preDone,
    },
    {
      key: "map",
      label: t("cycle.step.map", "learner"),
      href: `/belajar/${tugas}/peta`,
      open: preDone,
      done: false,
    },
    {
      key: "lesson",
      label: t("cycle.step.lesson", "learner"),
      href: lessons.length ? `/belajar/${tugas}/pelajaran/${lessons[0].lesson_id}` : `/belajar/${tugas}`,
      open: preDone && lessons.length > 0,
      done: false,
    },
    {
      key: "posttest",
      label: t("cycle.step.posttest", "learner"),
      href: `/belajar/${tugas}/penguasaan`,
      open: preDone,
      done: postDone,
    },
    {
      key: "result",
      label: t("cycle.step.result", "learner"),
      href: `/belajar/${tugas}/hasil`,
      open: postDone,
      done: false,
    },
  ];

  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <p className="text-sm text-ink-3">
        <Link href="/belajar">{t("cycle.title", "learner")}</Link> · {mine.subject} {mine.grade_label}
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{mine.title}</h1>

      <ol className="mt-8 grid gap-3">
        {steps.map((s, i) => (
          <li key={s.key}>
            {s.open ? (
              <Link
                href={s.href}
                className="flex items-center justify-between rounded-[var(--radius-2)] border border-line-1 bg-surface-1 p-5 hover:bg-surface-2"
              >
                <span>
                  <span className="text-sm text-ink-3">{i + 1}</span>
                  <span className="ml-3 text-lg">{s.label}</span>
                </span>
                <span className="text-sm text-primary">
                  {s.done ? t("cycle.continue", "learner") : t("cycle.open", "learner")}
                </span>
              </Link>
            ) : (
              <div className="flex items-center justify-between rounded-[var(--radius-2)] border border-line-1 bg-surface-2 p-5 text-ink-3">
                <span>
                  <span className="text-sm">{i + 1}</span>
                  <span className="ml-3 text-lg">{s.label}</span>
                </span>
                <span className="text-sm">{t("cycle.locked_until_pretest", "learner")}</span>
              </div>
            )}
          </li>
        ))}
      </ol>
    </main>
  );
}
