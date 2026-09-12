import Link from "next/link";
import { redirect } from "next/navigation";
import { t } from "@/lib/hle";
import { supabaseServer } from "@/lib/supabase/server";
import { currentViewer } from "@/lib/auth";
import * as engine from "@/lib/assessment-engine";

/**
 * Entry by purpose (FABLE-00). One screen, one question: what is assigned to
 * me? A learner sees only what a Learning Assignment reaches them through —
 * publishing content is not assigning it.
 */
export default async function Belajar() {
  const viewer = await currentViewer();
  if (!viewer) redirect("/masuk?lanjut=/belajar");
  const db = (await supabaseServer()) as unknown as engine.EngineClient;
  const assignments = await engine.myAssignments(db);

  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <p className="text-sm text-ink-3">{t("app.name", "learner")}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t("cycle.title", "learner")}</h1>

      {assignments.length === 0 ? (
        <p className="mt-8 rounded-[var(--radius-2)] border border-line-1 bg-surface-1 p-5 text-ink-2">
          {t("cycle.none", "learner")}
        </p>
      ) : (
        <ul className="mt-8 grid gap-3">
          {assignments.map((a) => (
            <li key={a.learning_assignment_id}>
              <Link
                href={`/belajar/${a.learning_assignment_id}`}
                className="block rounded-[var(--radius-2)] border border-line-1 bg-surface-1 p-5 hover:bg-surface-2"
              >
                <span className="text-sm text-ink-3">{a.subject} · {a.grade_label}</span>
                <span className="mt-1 block text-xl font-medium">{a.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
