import Link from "next/link";
import Ikon from "@/components/Ikon";
import { notFound } from "next/navigation";
import { t, format, type HleEvent } from "@/lib/hle";
import { supabaseServer } from "@/lib/supabase/server";
import { currentLocale } from "@/lib/locale";
import * as engine from "@/lib/assessment-engine";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import KakiPintar from "@/components/KakiPintar";
import PerTujuan from "@/components/siklus/PerTujuan";
import { TeksBaris } from "@/components/teks/Teks";
import { bagianUlang, ketuntasan } from "@/lib/siklus";

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

  const [outcome, review, delta, mine, peta, pelajaran] = await Promise.all([
    engine.outcome(db, state.post_session),
    engine.review(db, state.post_session),
    engine.delta(db, tugas),
    engine.myAssignments(db).then((a) => a.find((x) => x.learning_assignment_id === tugas)),
    // UX-26: the objectives' names, from this learner's own session. Only
    // names hang on it, so a failed read leaves the rows on their codes
    // rather than the result unreadable.
    engine.readingMap(db, state.post_session).catch(() => []),
    // M3: the chapter's lessons, so a part below the target links to the lesson to read again
    engine.lessons(db, tugas).catch(() => []),
  ]);
  if (!outcome) notFound();
  // D-085 M3 (W4): finishing is not mastering. The verdict is the session's own, from the mark sealed on it (D-088(b)).
  const target = ketuntasan(outcome);
  const ulang = target === "BELUM" ? bagianUlang(outcome.per_domain, outcome.ambang, peta, pelajaran) : [];

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
              // D-088(b): a result judged against a mark sets one; with none sealed PINTAR says so and assumes nothing
              : outcome.diagnostik === false ? ` ${s("siklus.ambang_belum")}` : ""}
          </p>
        </section>

        {/* M3: whether the target was met, said plainly; below it, what to read again. */}
        {target === "TERCAPAI" ? (
          <div className="pin-banner pin-ok pin-target" role="status" data-target="tercapai">
            <Ikon nama="circle-check" />
            <p><strong>{s("hasil.target.tercapai")}</strong> {s("hasil.target.tercapai_arti")}</p>
          </div>
        ) : target === "BELUM" ? (
          <div className="pin-banner pin-attention pin-target" role="status" data-target="belum" id="ulang">
            <Ikon nama="triangle-alert" />
            <p><strong>{s("hasil.target.belum")}</strong> {s("hasil.target.belum_arti")}</p>
            {ulang.length > 0 ? (
              <>
                <p className="pin-ulang-judul">{s("hasil.target.ulang")}</p>
                <ul className="pin-ulang">
                  {ulang.map((u) => (
                    <li key={u.kode}>
                      {u.lessonId ? (
                        <Link href={`/belajar/${tugas}/pelajaran/${u.lessonId}`}>{u.pelajaran}</Link>
                      ) : null}
                      {u.lessonId ? " · " : ""}<TeksBaris teks={u.nama} />
                      {" · "}<span className="pin-num">{format.percent(u.penguasaan, locale)}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
        ) : null}

        {/* The feedback on the safety gate, when there is one. */}
        {gate != null ? (
          <div className={`pin-banner ${gate ? "pin-ok" : "pin-attention"}`} role="status">
            <Ikon nama={gate ? "circle-check" : "triangle-alert"} />
            <p>{gate ? s("hasil.safety.ok") : s("hasil.safety.missed")}</p>
          </div>
        ) : null}

        {/* The observation: how it went, objective by objective, each by its
            name (UX-26). */}
        <PerTujuan perDomain={outcome.per_domain} peta={peta} locale={locale} />

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
                  <span className="pin-q"><TeksBaris teks={r.stem} /></span>
                  <span className={`pin-pill ${r.benar ? "pin-ok" : "pin-neutral"}`}>
                    {r.benar ? s("hasil.answer_right") : s("hasil.answer_notyet")}
                  </span>
                </summary>
                {r.jawaban_teks ? (
                  <span className="pin-mine">
                    {s("hasil.answer_yours")}: <TeksBaris teks={r.jawaban_teks} />
                  </span>
                ) : null}
                {r.alasan || r.arah ? (
                  <span className="pin-why">
                    <TeksBaris teks={r.alasan} />
                    {r.alasan && r.arah ? " " : ""}
                    <TeksBaris teks={r.arah} />
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
