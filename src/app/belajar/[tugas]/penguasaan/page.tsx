import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { t } from "@/lib/hle";
import { supabaseServer } from "@/lib/supabase/server";
import * as engine from "@/lib/assessment-engine";
import ItemPlayer from "../../_components/ItemPlayer";
import * as actions from "../../actions";
import HalamanPenolakan from "@/components/HalamanPenolakan";
import { currentLocale } from "@/lib/locale";

export const dynamic = "force-dynamic";

/**
 * Post-test — "Uji Penguasaan" (§4). Formal: counting-up timer, pause where
 * the definition allows it, flag-for-review, a navigator, and no auto-advance.
 * Zero overlap with the pre-test is enforced in the draw (INV-24), not here.
 */
export default async function Penguasaan({ params }: { params: Promise<{ tugas: string }> }) {
  const { tugas } = await params;
  const db = (await supabaseServer()) as unknown as engine.EngineClient;
  const state = await engine.cycleState(db, tugas);
  if (!state.post_assignment) notFound();
  if (state.pre_status !== "FINALIZED") redirect(`/belajar/${tugas}`);
  if (state.post_status === "FINALIZED") redirect(`/belajar/${tugas}/hasil`);

  let sessionId = state.post_session;
  if (!sessionId) {
    const may = await engine.mayStart(db, state.post_assignment);
    if (!may.ok) {
      // S0.5: the ONE refusal page, for unauthorized, nonexistent and expired
      // alike. `may.ok` above is the server's decision and is unchanged.
      return <HalamanPenolakan locale={await currentLocale()} backHref={`/belajar/${tugas}`} backKey="cycle.title" />;
    }
    sessionId = await engine.startSession(db, state.post_assignment);
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
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{t("posttest.title", "learner")}</h1>
        <p className="mt-2 max-w-[var(--measure)] text-ink-2">{t("posttest.intro", "learner")}</p>
      </div>
      <ItemPlayer
        sessionId={sessionId}
        paper={paper}
        accepted={accepted}
        seqs={seqs}
        mode="PENGUASAAN"
        stage={session?.stage ?? null}
        allowsPause={session?.allows_pause ?? false}
        startedAt={session?.started_at ?? null}
        finishHref={`/belajar/${tugas}/hasil`}
        actions={actions}
      />
    </main>
  );
}
