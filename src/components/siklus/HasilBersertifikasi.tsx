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
 *   2. what to read again, as advice, on a pass too (ruling 74a item 2; no evidence threshold is approved in 4.1, so
 *      every section is «Baca lagi:», with the note that it is advice, not a judgement of mastery);
 *   3. the retake line, when «Belum lulus»;
 *   4. the counts, secondary, and the attempt ordinal (R-f);
 *   5. one line saying the key and each question's mark are not shown.
 * Never «tidak lulus». No per-question row, no key, no explanation, no mastery figure per objective: the database
 * withholds them (20270124100000) and the engine refuses a result that carries one (jagaHasil). Staff views are unchanged.
 */
export default function HasilBersertifikasi({ outcome, peta, pelajaran, tugas, locale, dihitungUlang, sertifikat = null }: {
  outcome: Outcome; peta: readonly ReadingMapCard[]; pelajaran: readonly LessonEntry[]; tugas: string; locale: Locale;
  dihitungUlang: boolean;
  /** ruling 74a item 4: the certificate this pass earned, as the certificate page reads it: TERBIT (it renders), DISIAPKAN
   *  (not yet), or null (none to speak of) */
  sertifikat?: "TERBIT" | "DISIAPKAN" | null;
}) {
  const s = (k: HleEvent) => t(k, "learner", { locale });
  const keputusan = ketuntasan(outcome);
  const gerbang = alasanBelum(outcome) === "GERBANG";
  // ruling 74a item 2 (the owner, via Bob 04:02Z): the sections still to learn are advice on EVERY certifying result, a
  // pass included (a pass with an objective below the mark still names it); the retake line stays on «Belum lulus»
  const baca = keputusan ? bagianUlang(null, null, peta, pelajaran, outcome.tujuan_gerbang_kode ?? [], outcome.tujuan_ulang ?? []) : [];
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

      {/* 2a. Ruling 74a item 4: after «Lulus.», the certificate, in the words the certificate pages already use (no new
          words: the link of /lanjut, or «sedang disiapkan» as the certificate page says it before issuance). */}
      {keputusan === "TERCAPAI" && sertifikat === "TERBIT" ? (
        <p data-sertifikat="terbit"><Link className="pin-btn" href={`/belajar/${tugas}/sertifikat`}>{s("siklus.lihat_sertifikat")}</Link></p>
      ) : keputusan === "TERCAPAI" && sertifikat === "DISIAPKAN" ? (
        <section className="pin-sec" data-sertifikat="disiapkan">
          <p><strong>{s("sertifikat.disiapkan.judul")}</strong></p>
          <p className="pin-meta">{s("sertifikat.disiapkan.arti")}</p>
          <p><Link href={`/belajar/${tugas}/sertifikat`}>{s("siklus.lihat_sertifikat")}</Link></p>
        </section>
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
