import Link from "next/link";
import { t, format, type HleEvent } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import * as ajar from "@/lib/pengajar";
import { adaBuktiSoal } from "@/lib/mengajar";
import { actionText, omissionText } from "../../../_intel";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import KakiPintar from "@/components/KakiPintar";
import HalamanPenolakan from "@/components/HalamanPenolakan";
import { AngkaBerdiri, BarisKesiapan, BarisLingkup, KartuKetiadaan, KeadaanHariIni, PopulasiKelas } from "@/components/bukti";
import { nilaiMetrik, urutkanPita } from "@/lib/nilai-metrik";
import { judulHalaman } from "@/lib/judul-halaman";
import { labelMetrik } from "@/components/bukti/label";

export const generateMetadata = judulHalaman("/mengajar/[kelas]/bukti");

export const dynamic = "force-dynamic";

/**
 * SCREEN E — what can be concluded, and what cannot yet.
 *
 * THE INSUFFICIENT STATE IS THE DESIGNED STATE. Not a fallback and not an empty
 * page: "we looked and there is not enough yet" is a real answer about the
 * world, it is the answer most of the time in a live term, and PINTAR already
 * distinguishes it from "this is not for you". `metric_evaluate` returns
 * `below_minimum` with `have` and `needed` before it returns any value, and
 * KartuKetiadaan renders that distinction rather than flattening both into "no
 * data". There is no zero standing in for an unknown and no red anywhere.
 *
 * EVERY NUMBER COMES THROUGH THE CATALOGUE. Five metrics are asked for by name
 * and each is re-authorized against this reader inside the evaluator; nothing
 * on this page is computed from a table in TypeScript. That is why
 * `assessment_results` — which an educator MAY read for the classes they are
 * assigned, since R6 narrowed that from institution-wide to the node the
 * evidence was produced in — is not touched here: a class average assembled in
 * a route would be a number that reached a screen without passing the
 * catalogue.
 *
 * THE SCOPE LINE NAMES A CLASS AND NOT A CHAPTER. `metric_evaluate` takes a
 * NODE; every class calculator aggregates that node's official sessions with no
 * release or module filter. The reviewed concept read "Bukti · Kelas 10A · Bab
 * 3" and the chapter half is a scope no contract carries, so it is gone. The
 * COUNTS below may still name the assessment, because a count is read from an
 * assignment row that genuinely is chapter-specific.
 *
 * NOTHING FOR QUESTION HEALTH OR INTEGRITY — not a locked card, not a "not for
 * you" placeholder. `not_permitted` deliberately carries no label precisely so
 * a refusal cannot disclose what it withheld, and those two are simply not
 * asked for. One footnote names who does review them.
 */
export default async function Bukti({ params }: { params: Promise<{ kelas: string }> }) {
  const { kelas: id } = await params;
  const locale = await currentLocale();
  const s = (k: HleEvent) => t(k, "educator", { locale });

  const ctx = await ajar.kelas(id);
  if (!ctx) {
    return <HalamanPenolakan locale={locale} persona="educator" backHref="/mengajar" backKey="mengajar.kembali" />;
  }

  // E-C2-2 (D-070(h)): a professional-learning class produces no academic class figure, so none is asked for
  const akademik = adaBuktiSoal(ctx.ini.jenis);
  const [asesmen, fakta, amplop, minimum] = await Promise.all([
    ajar.berjalan([id], ["OPEN", "CLOSED"]),
    ajar.faktaKelas(id),
    akademik ? ajar.bukti(id, ctx.ini.institusi) : Promise.resolve([] as Awaited<ReturnType<typeof ajar.bukti>>),
    ajar.minimumMetrik(),
  ]);

  const byId = new Map(ajar.METRIK_KELAS.map((m, i) => [m, amplop[i]]));
  const paham = byId.get("class.comprehension");
  const naik = byId.get("class.net_gain");
  const topik = byId.get("class.topic_mastery");
  const keliru = byId.get("class.misconceptions");
  const siap = byId.get("class.readiness_distribution");

  /** The catalogue's minimum, for the `ok` envelope that does not carry one. */
  const withMin = (e: ajar.Amplop | undefined, metric: string) =>
    e ? ({ ...e, needed: e.needed ?? minimum[metric] } as ajar.Amplop) : undefined;

  function angka(e: ajar.Amplop | undefined, metric: string, nilai: (v: number) => string) {
    if (!e) return null;
    if (e.status !== "ok") return <KartuKetiadaan key={metric} entry={e} locale={locale} />;
    const v = typeof e.value === "number" ? e.value : Number(e.value);
    if (!Number.isFinite(v)) return <KartuKetiadaan key={metric} entry={{ ...e, status: "unavailable" }} locale={locale} />;
    return (
      <AngkaBerdiri
        key={metric}
        entry={withMin(e, metric)!}
        value={nilai(v)}
        action={actionText(e, locale)}
        locale={locale}
      />
    );
  }

  const sebaran =
    siap && siap.status === "ok" && siap.value && typeof siap.value === "object"
      ? urutkanPita(Object.entries(siap.value as Record<string, number>)) // D-095: band order, not key order
      : [];
  // CR-81 (D-123(3)): the bands are the assessed alone (MC-7), so their bars are drawn over the assessed
  const totalSiap = sebaran.reduce((n, [, c]) => n + Number(c), 0);

  // D-088(g), MC-4: one row per objective, named by its statement (what was learned), never by a code that two
  // chapters share; the evaluator's own order (lowest mastery first) is kept
  type Bagian = { objective_id: string | null; code: string; competency: string; title?: string | null; mean_score: number | null; learners: number; needed?: number | null };
  const semuaBagian: Bagian[] =
    topik && topik.status === "ok" && Array.isArray(topik.value) ? (topik.value as Bagian[]) : [];
  // D6: a part whose own learners are under the minimum has no mean; it is counted and said, never drawn as 0
  const bagian = semuaBagian.filter((b) => typeof b.mean_score === "number");
  const bagianTertahan = semuaBagian.filter((b) => typeof b.mean_score !== "number");

  type Keliru = { code: string; label: string; remediation: string | null; occurrences: number };
  const salahPaham =
    keliru && keliru.status === "ok" && Array.isArray(keliru.value)
      ? (keliru.value as Keliru[])
      : [];

  return (
    <>
      <CangkangPengalaman locale={locale} kind="pengajar" current="kelas" />
      <main id="isi" tabIndex={-1} className="pin-col">
        <Link className="pin-back" href={`/mengajar/${id}`}>← {ctx.ini.nama}</Link>
        <BarisLingkup
          scope={{
            institution: ctx.konteks.institusi?.nama ?? null,
            path: [ctx.ini.nama],
            period: ctx.konteks.periode,
          }}
          locale={locale}
        />

        <div className="pin-head">
          <p className="pin-eyebrow">{s("mengajar.bukti.eyebrow")} · {ctx.ini.nama}</p>
          <h1 className="pin-h1">{s("mengajar.bukti.judul")}</h1>
          <p className="pin-intro">{s("mengajar.bukti.intro")}</p>
        </div>

        <div className="pin-sec">
          <h2>{s("mengajar.bukti.keadaan")}</h2>
          {/* DAISY-26 (UX-06): every open test of the class, each with its own
              counts, rather than one "focus" test standing for all of them. */}
          <KeadaanHariIni asesmen={asesmen} murid={fakta.murid.length} locale={locale} kelas={id} jenis={ctx.ini.jenis} />
        </div>

        {!akademik ? (
          /* C2 (D-169(b)): one statement and the way to the professional-learning record (DAISY-34) — no figure, no
             figure's place, no «not yet» promise of a figure that never comes */
          <div className="pin-sec" data-pd-kesimpulan="">
            <h2>{s("mengajar.bukti.simpulan")}</h2>
            <div className="pin-kosong">
              <p className="pin-kosong-kalimat">{s("mengajar.bukti.pd.arti")}</p>
              <Link className="pin-btn pin-quiet" href={`/pengembangan/${id}`}>{s("mengajar.bukti.pd.buka")}</Link>
            </div>
          </div>
        ) : (
        <div className="pin-sec">
          <h2>{s("mengajar.bukti.simpulan")}</h2>
          <div className="pin-grid2">
            {/* W9: the same reading as /pimpinan's, from one rule */}
            {angka(paham, "class.comprehension", (v) => nilaiMetrik("class.comprehension", v, locale))}
            {angka(naik, "class.net_gain", (v) => nilaiMetrik("class.net_gain", v, locale))}
          </div>

          {/* Mastery by part: an ORDER, not a verdict. The evaluator returns a
              number per domain; sorting them is reading what it returned, and
              naming one "worth repeating" would be a threshold no contract
              carries. The catalogue's own meaning sentence does the telling. */}
          {topik && topik.status === "ok" && bagian.length > 0 ? (
            <div className="pin-metric">
              <span className="pin-ml">{s("mengajar.bukti.bagian")}</span>
              <div className="pin-readiness">
                {bagian.map((b) => (
                  <BarisKesiapan
                    key={b.objective_id ?? b.code}
                    label={b.title && b.title.trim() !== "" ? b.title : b.competency}
                    count={Math.round(Number(b.mean_score) * 100)}
                    total={100}
                    locale={locale}
                  />
                ))}
              </div>
              {bagianTertahan.length > 0 ? (
                <span className="pin-ms" data-bagian-tertahan="">{s("laporan.sekolah.ranah_tertahan")
                  .replace("{n}", format.number(bagianTertahan.length, locale)).replace("{m}", format.number(Number(bagianTertahan[0].needed ?? 0), locale))}</span>
              ) : null}
              <span className="pin-ma">{actionText(topik, locale)}</span>
            </div>
          ) : topik ? (
            <KartuKetiadaan entry={topik} locale={locale} />
          ) : null}

          {/* THE LEGITIMATE AGGREGATE. `class.misconceptions` is granted to
              EDUCATOR by the catalogue and returns a code, a label, a
              remediation and an occurrence count for the CLASS — no learner in
              it, no item in it, and no path to either. It is what replaced a
              concept sentence that counted learners against two questions,
              which would have needed the item-level read an educator does not
              have. It is not Question Health by another name: that is item
              quality and belongs to the Head of Department. */}
          {keliru && keliru.status === "ok" && salahPaham.length > 0 ? (
            <div className="pin-metric">
              <span className="pin-ml">{s("mengajar.bukti.keliru")}</span>
              <ul className="pin-keliru">
                {salahPaham.map((k) => (
                  <li key={k.code}>
                    <span className="pin-kl">{k.label}</span>
                    <span className="pin-ms pin-num">
                      {format.number(k.occurrences, locale)} {s("mengajar.bukti.kali")}
                    </span>
                    {k.remediation ? <span className="pin-kr">{k.remediation}</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : keliru ? (
            <KartuKetiadaan entry={keliru} locale={locale} />
          ) : null}

          {siap && siap.status === "ok" && sebaran.length > 0 ? (
            <div className="pin-metric">
              <span className="pin-ml">{labelMetrik(siap, "educator", locale)}</span>
              <div className="pin-readiness">
                {sebaran.map(([tier, n]) => (
                  <BarisKesiapan key={tier} tierKey={tier} count={Number(n)} total={totalSiap} locale={locale} />
                ))}
              </div>
              {/* D-095: PINTAR's fixed bands, not the school's mastery threshold; they decide no certificate */}
              <span className="pin-mm">{s("kesiapan.catatan")}</span>
              <PopulasiKelas populasi={siap.population} locale={locale} />
              <span className="pin-ma">{actionText(siap, locale)}</span>
            </div>
          ) : siap ? (
            <>
              <KartuKetiadaan entry={siap} action={omissionText(siap, locale)} locale={locale} />
              {/* CR-81: who has not sat yet is said even while the bands are withheld (D-121(c), D-123(3)) */}
              <PopulasiKelas populasi={siap.population} locale={locale} />
            </>
          ) : null}
        </div>
        )}

        {/* C2: the ordinary footnote names who reviews integrity signals; for a professional-learning class that is
            false (D-069(c)), so it has none (Dr Gladys's slot, DR-GLADYS-QUESTION-PACK A7) */}
        {akademik ? <p className="pin-foot">{s("mengajar.bukti.kaki")}</p> : null}
        <KakiPintar />
      </main>
    </>
  );
}
