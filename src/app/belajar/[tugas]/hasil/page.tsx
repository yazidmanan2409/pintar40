import Link from "next/link";
import { notFound } from "next/navigation";
import { t } from "@/lib/hle";
import { supabaseServer } from "@/lib/supabase/server";
import * as engine from "@/lib/assessment-engine";

export const dynamic = "force-dynamic";

/**
 * Hasil (§7). Score header, the safety-gate banner, the per-domain breakdown,
 * the review accordion with wrong safety-critical items pinned open, and the
 * delta — which appears only when both sessions are FINALIZED. A learner who
 * has done one of the two is told so; they are never shown a delta of zero for
 * a comparison nobody made.
 *
 * The certificate call to action is Phase 4's, and it is honest about that:
 * eligibility needs OFFICIAL evidence, this tenant is synthetic, and issuance
 * does not exist yet.
 */
export default async function Hasil({ params }: { params: Promise<{ tugas: string }> }) {
  const { tugas } = await params;
  const db = (await supabaseServer()) as unknown as engine.EngineClient;
  const state = await engine.cycleState(db, tugas);
  if (!state.post_session || state.post_status !== "FINALIZED") notFound();

  const [outcome, review, delta] = await Promise.all([
    engine.outcome(db, state.post_session),
    engine.review(db, state.post_session),
    engine.delta(db, tugas),
  ]);
  if (!outcome) notFound();

  const pct = outcome.penguasaan == null ? null : Math.round(outcome.penguasaan * 100);
  const gate = outcome.gerbang_keselamatan;

  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <p className="text-sm text-ink-3">
        <Link href={`/belajar/${tugas}`}>{t("cycle.title", "learner")}</Link>
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t("hasil.title", "learner")}</h1>

      <section className="mt-8 rounded-[var(--radius-2)] border border-line-1 bg-surface-1 p-6">
        <p className="text-sm text-ink-3">{t("hasil.mastery", "learner")}</p>
        <p className="mt-1 text-4xl font-semibold tabular-nums">{pct == null ? "—" : `${pct}%`}</p>
      </section>

      {gate != null && (
        <p className={`mt-4 rounded-[var(--radius-2)] border p-4 ${
          gate ? "border-ok bg-ok-soft" : "border-attention bg-attention-soft"}`}>
          {gate ? t("hasil.safety.ok", "learner") : t("hasil.safety.missed", "learner")}
        </p>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-medium">{t("hasil.domain", "learner")}</h2>
        <ul className="mt-3 grid gap-2">
          {Object.entries(outcome.per_domain ?? {}).map(([code, d]) => (
            <li key={code} className="flex items-center justify-between rounded-[var(--radius-1)] border border-line-1 bg-surface-1 px-4 py-3">
              <span className="text-ink-2">{code}</span>
              <span className="tabular-nums">{d.benar}/{d.total}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium">{t("hasil.review", "learner")}</h2>
        <div className="mt-3 grid gap-2">
          {review.map((r) => (
            // wrong safety-critical items are pinned open; everything else folds
            <details key={r.posisi} open={r.is_safety_critical && r.benar === false}
              className="rounded-[var(--radius-2)] border border-line-1 bg-surface-1 p-4">
              <summary className="cursor-pointer">
                <span className="text-sm text-ink-3">{r.posisi}</span>
                <span className="ml-3">{r.stem}</span>
                <span className={`ml-3 text-sm ${r.benar ? "text-ok" : "text-attention"}`}>
                  {r.benar ? t("hasil.answer_right", "learner") : t("hasil.answer_notyet", "learner")}
                </span>
              </summary>
              {r.jawaban_teks && (
                <p className="mt-3 text-ink-2">
                  <span className="text-sm text-ink-3">{t("hasil.answer_yours", "learner")}: </span>
                  {r.jawaban_teks}
                </p>
              )}
              {r.alasan && <p className="mt-2 text-ink-1">{r.alasan}</p>}
              {r.arah && <p className="mt-2 text-ink-2">{r.arah}</p>}
            </details>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-[var(--radius-2)] border border-line-1 bg-surface-2 p-5">
        <h2 className="text-lg font-medium">{t(`hasil.delta.${delta.status}` as never, "learner")}</h2>
        {delta.status === "LENGKAP" && (
          <p className="mt-2 tabular-nums text-ink-1">
            {Math.round((delta.awal ?? 0) * 100)}% → {Math.round((delta.akhir ?? 0) * 100)}%
          </p>
        )}
      </section>

      <p className="mt-8 text-sm text-ink-3">{t("hasil.certificate_soon", "learner")}</p>
    </main>
  );
}
