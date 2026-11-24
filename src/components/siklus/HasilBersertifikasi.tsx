import Link from "next/link";
import Ikon from "@/components/Ikon";
import { TeksBaris } from "@/components/teks/Teks";
import { format, t, type HleEvent, type Locale } from "@/lib/hle";
import type { LessonEntry, Outcome, ReadingMapCard } from "@/lib/assessment-engine/types";
import { alasanBelum, bagianUlang, hitunganSegel, ketuntasan } from "@/lib/siklus";

/**
 * D2-R (R-h, ruling 74, 74a, 74b; Daisy's D2R-KATA.md §3 and §6): A CERTIFYING RESULT, IN COUNTS ONLY.
 *
 * An Uji Penguasaan (and any sitting whose mode certifies, as it captured it at the start) shows its learner, in this
 * order and nothing else:
 *   1. the decision, «Lulus.» or «Belum lulus.», with its one-line reason (the K-01 gate keeps its own);
 *   2. what to read again, as advice (no evidence threshold is approved in 4.1, so every section is «Baca lagi:», with
 *      the note that it is advice, not a judgement of mastery);
 *   3. the retake line, when «Belum lulus»;
 *   4. the counts, secondary, and the attempt ordinal (R-f);
 *   5. one line saying the key and each question's mark are not shown.
 * Never «tidak lulus». No per-question row, no key, no explanation, no mastery figure per objective: the database
 * withholds them (20270124100000) and the engine refuses a result that carries one (jagaHasil). Staff views are unchanged.
 */
export default function HasilBersertifikasi({ outcome, peta, pelajaran, tugas, locale, dihitungUlang }: {
  outcome: Outcome; peta: readonly ReadingMapCard[]; pelajaran: readonly LessonEntry[]; tugas: string; locale: Locale;
  dihitungUlang: boolean;
}) {
  const s = (k: HleEvent) => t(k, "learner", { locale });
  const keputusan = ketuntasan(outcome);
  const gerbang = alasanBelum(outcome) === "GERBANG";
  const baca = keputusan === "BELUM" ? bagianUlang(null, null, peta, pelajaran, outcome.tujuan_gerbang_kode ?? [], outcome.tujuan_ulang ?? []) : [];
  const hitungan = hitunganSegel(outcome.ringkasan, []);

  return (
    <>
      {/* 1. The decision and its reason. */}
      {keputusan === "TERCAPAI" ? (
        <div className="pin-banner pin-ok pin-target" role="status" data-keputusan="lulus">
          <Ikon nama="circle-check" />
          <p><strong>{s("hasil.lulus")}</strong> {s("hasil.lulus_arti")}</p>
        </div>
      ) : keputusan === "BELUM" ? (
        <div className="pin-banner pin-attention pin-target" role="status" data-keputusan="belum-lulus" id="ulang">
          <Ikon nama="triangle-alert" />
          <p data-alasan={gerbang ? "gerbang" : "di-bawah"}><strong>{s("hasil.belum_lulus")}</strong> {s(gerbang ? "hasil.target.belum_gerbang" : "hasil.belum_lulus_arti")}</p>
        </div>
      ) : null}

      {/* 2. What to read again: advice, never a verdict on mastery (74b). */}
      {baca.length > 0 ? (
        <section className="pin-sec" data-baca-lagi="">
          <p className="pin-ulang-judul">{s("hasil.baca_lagi")}</p>
          <ul className="pin-ulang">
            {baca.map((b) => (
              <li key={b.kode}>
                {b.lessonId ? <Link href={`/belajar/${tugas}/pelajaran/${b.lessonId}`}>{b.pelajaran}</Link> : null}
                {b.lessonId ? " · " : ""}<TeksBaris teks={b.nama} />
              </li>
            ))}
          </ul>
          <p className="pin-meta">{s("hasil.baca_lagi_arti")}</p>
        </section>
      ) : null}

      {/* 3. The retake, under the school's rules. */}
      {keputusan === "BELUM" ? <p data-ulang-boleh="">{s("hasil.ulang_boleh")}</p> : null}

      {/* 4. The counts, secondary; the attempt this was (R-f). */}
      <p className="pin-meta pin-num" data-hitungan="">
        {s("hasilbelajar.nilai").replace("{b}", format.number(hitungan.benar, locale)).replace("{t}", format.number(hitungan.total, locale))}{" "}
        {s("hasil.dijawab_tepat")}
        {typeof outcome.percobaan_ke === "number" ? <> · <span data-percobaan-ke="">{s("hasil.percobaan_ke").replace("{n}", format.number(outcome.percobaan_ke, locale))}</span></> : null}
      </p>
      {outcome.dikoreksi ? (
        <p className="pin-meta" data-dikoreksi=""><span className="pin-pill pin-neutral">{s("hasil.dikoreksi.tanda")}</span> {s("hasil.dikoreksi")}</p>
      ) : dihitungUlang ? <p className="pin-meta" data-dihitung-ulang="">{s("hasil.dihitung_ulang")}</p> : null}

      {/* 5. What is not shown, said once. */}
      <p className="pin-meta" data-tidak-ditampilkan="">{s("hasil.tidak_ditampilkan")}</p>
    </>
  );
}
