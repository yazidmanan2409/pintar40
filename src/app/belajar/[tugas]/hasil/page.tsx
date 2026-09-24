import Link from "next/link";
import { notFound } from "next/navigation";
import { t, format, type HleEvent } from "@/lib/hle";
import { supabaseServer } from "@/lib/supabase/server";
import { currentLocale } from "@/lib/locale";
import * as engine from "@/lib/assessment-engine";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import KakiPintar from "@/components/KakiPintar";

export const dynamic = "force-dynamic";

/**
 * SCREEN F — THE RESULT, AND FOUR THINGS KEPT APART.
 *
 * The RESULT is the figure. The FEEDBACK is the sentence under it. The
 * OBSERVATION is the per-section counts. The EVIDENCE is the reviewed items.
 * They are not interchangeable and none of them is invented here — every one
 * comes from `session_outcome()` and `session_review()`.
 *
 * A NUMBER NEVER STANDS ALONE. 75% is immediately followed by what it is out
 * of and what the threshold is, both supplied by the engine. A percentage on
 * its own is a verdict a learner cannot check.
 *
 * "BELUM TEPAT", NEVER "SALAH". The direction under an answer that is not
 * right yet is the item's own `arah`; the frontend adds no recommendation of
 * its own, because a recommendation PINTAR did not derive is a guess wearing
 * the product's voice.
 */
export default async function Hasil({ params }: { params: Promise<{ tugas: string }> }) {
  const { tugas } = await params;
  const locale = await currentLocale();
  const db = (await supabaseServer()) as unknown as engine.EngineClient;
  const s = (k: HleEvent) => t(k, "learner", { locale });

  const state = await engine.cycleState(db, tugas);
  if (!state.post_session || state.post_status !== "FINALIZED") notFound();

  const [outcome, review, delta, mine] = await Promise.all([
    engine.outcome(db, state.post_session),
    engine.review(db, state.post_session),
    engine.delta(db, tugas),
    engine.myAssignments(db).then((a) => a.find((x) => x.learning_assignment_id === tugas)),
  ]);
  if (!outcome) notFound();

  const pct = outcome.penguasaan == null ? null : outcome.penguasaan;
  const gate = outcome.gerbang_keselamatan;
  const benar = review.filter((r) => r.benar === true).length;

  return (
    <>
      <CangkangPengalaman locale={locale} current="belajar" />
      <main className="pin-col">
        <Link className="pin-back" href={`/belajar/${tugas}`}>
          ← {s("cycle.title")}
        </Link>
        <div className="pin-head">
          {mine ? (
            <p className="pin-eyebrow">
              {mine.subject} · {mine.title}
            </p>
          ) : null}
          <h1 className="pin-h1">{s("hasil.title")}</h1>
        </div>

        {/* The result, and what it is out of. */}
        <section className="pin-hasil">
          <p className="pin-eyebrow">{s("hasil.mastery")}</p>
          <p className="pin-big2 pin-num">{pct == null ? "—" : format.percent(pct, locale)}</p>
          <p className="pin-mean">
            {s("siklus.tepat_dari")} {format.number(benar, locale)} {s("siklus.dari")}{" "}
            {format.number(review.length, locale)} {s("siklus.soal")}.
            {outcome.ambang != null
              ? ` ${s("siklus.ambang")} ${format.percent(outcome.ambang, locale)}.`
              : ""}
          </p>
        </section>

        {/* The feedback on the safety gate, when there is one. */}
        {gate != null ? (
          <div className={`pin-banner ${gate ? "pin-ok" : "pin-attention"}`} role="status">
            <p>{gate ? s("hasil.safety.ok") : s("hasil.safety.missed")}</p>
          </div>
        ) : null}

        {/* The observation: how it went, section by section. */}
        {Object.keys(outcome.per_domain ?? {}).length > 0 ? (
          <section className="pin-sec">
            <h2>{s("hasil.domain")}</h2>
            <div className="pin-domain">
              {Object.entries(outcome.per_domain ?? {}).map(([code, d]) => (
                <div className="pin-drow" key={code}>
                  <span>{code}</span>
                  <span className="pin-cnt pin-num">
                    {format.number(d.benar, locale)}/{format.number(d.total, locale)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* The evidence: the items themselves. A wrong safety-critical item is
            pinned open — it is the one thing on this page a learner must not
            have to go looking for. */}
        <section className="pin-sec">
          <h2>{s("hasil.review")}</h2>
          <div className="pin-tinjau">
            {review.map((r) => (
              <details
                key={r.posisi}
                className="pin-item"
                open={r.is_safety_critical && r.benar === false}
              >
                <summary className="pin-ihead">
                  <span className="pin-pos">{format.number(r.posisi, locale)}</span>
                  <span className="pin-q">{r.stem}</span>
                  <span className={`pin-pill ${r.benar ? "pin-ok" : "pin-neutral"}`}>
                    {r.benar ? s("hasil.answer_right") : s("hasil.answer_notyet")}
                  </span>
                </summary>
                {r.jawaban_teks ? (
                  <span className="pin-mine">
                    {s("hasil.answer_yours")}: {r.jawaban_teks}
                  </span>
                ) : null}
                {r.alasan || r.arah ? (
                  <span className="pin-why">
                    {r.alasan}
                    {r.alasan && r.arah ? " " : ""}
                    {r.arah}
                  </span>
                ) : null}
              </details>
            ))}
          </div>
        </section>

        {/* The change, which appears only when both sessions are finished. It
            says so plainly when they are not, rather than showing a zero for a
            comparison nobody made. */}
        <section className="pin-sec">
          <h2>{s(`hasil.delta.${delta.status}` as HleEvent)}</h2>
          {delta.status === "LENGKAP" ? (
            <div className="pin-metric">
              <span className="pin-mv pin-num">
                {format.percent(delta.awal ?? 0, locale)} → {format.percent(delta.akhir ?? 0, locale)}
              </span>
              <span className="pin-mm">{s("siklus.delta_arti")}</span>
            </div>
          ) : null}
        </section>

        <div className="pin-actions">
          <Link className="pin-btn pin-primary" href={`/belajar/${tugas}/lanjut`}>
            {s("siklus.berikutnya")} →
          </Link>
        </div>

        <KakiPintar />
      </main>
    </>
  );
}
