import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { t } from "@/lib/hle";
import { supabaseServer } from "@/lib/supabase/server";
import * as engine from "@/lib/assessment-engine";
import ItemPlayer from "../../_components/ItemPlayer";
import * as actions from "../../actions";

export const dynamic = "force-dynamic";

/**
 * Pre-test — "Pemetaan Awal" (§1). Diagnostic: no pass/fail wording anywhere
 * on this screen or its result, no rationale, dots instead of a bar.
 */
export default async function Pemetaan({ params }: { params: Promise<{ tugas: string }> }) {
  const { tugas } = await params;
  const db = (await supabaseServer()) as unknown as engine.EngineClient;
  const state = await engine.cycleState(db, tugas);
  if (!state.pre_assignment) notFound();
  if (state.pre_status === "FINALIZED") redirect(`/belajar/${tugas}/peta`);

  let sessionId = state.pre_session;
  if (!sessionId) {
    const may = await engine.mayStart(db, state.pre_assignment);
    if (!may.ok) {
      return (
        <main className="mx-auto max-w-2xl px-5 py-12">
          <h1 className="text-2xl font-semibold">{t("pretest.title", "learner")}</h1>
          <p className="mt-4 text-ink-2">{t("auth.not_yet", "learner")}</p>
          <Link href={`/belajar/${tugas}`} className="mt-6 inline-block text-primary underline">
            {t("cycle.title", "learner")}
          </Link>
        </main>
      );
    }
    sessionId = await engine.startSession(db, state.pre_assignment);
  }

  const [paper, prior, session] = await Promise.all([
    engine.paper(db, sessionId),
    engine.answersSoFar(db, sessionId),
    engine.sessionState(db, sessionId),
  ]);

  const accepted: Record<string, { posisi: number } | { posisi: number[] }> = {};
  const seqs: Record<string, number> = {};
  for (const row of prior) {
    seqs[row.presented_item_id] = Math.max(seqs[row.presented_item_id] ?? 0, row.client_seq);
    if (row.posisi != null) accepted[row.presented_item_id] = { posisi: row.posisi } as never;
  }

  return (
    <main>
      <div className="mx-auto max-w-2xl px-5 pt-10">
        <p className="text-sm text-ink-3">
          <Link href={`/belajar/${tugas}`}>{t("cycle.title", "learner")}</Link>
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{t("pretest.title", "learner")}</h1>
        <p className="mt-2 max-w-[var(--measure)] text-ink-2">{t("pretest.intro", "learner")}</p>
      </div>
      <ItemPlayer
        sessionId={sessionId}
        paper={paper}
        accepted={accepted}
        seqs={seqs}
        mode="PEMETAAN"
        stage={session?.stage ?? null}
        allowsPause={false}
        startedAt={session?.started_at ?? null}
        finishHref={`/belajar/${tugas}/peta`}
        actions={actions}
      />
    </main>
  );
}
