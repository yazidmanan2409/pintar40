import CatatanHitungUlang from "@/components/CatatanHitungUlang";
import Link from "next/link";
import Kosong from "@/components/Kosong";
import { t, format, type HleEvent } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import * as ajar from "@/lib/pengajar";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import KakiPintar from "@/components/KakiPintar";
import HalamanPenolakan from "@/components/HalamanPenolakan";
import { BarisLingkup, KartuKetiadaan } from "@/components/bukti";
import { TeksBaris } from "@/components/teks/Teks";
import { judulHalaman } from "@/lib/judul-halaman";
import { adaBuktiSoal } from "@/lib/mengajar";

export const generateMetadata = judulHalaman("/mengajar/[kelas]/murid/[orang]");

export const dynamic = "force-dynamic";

const KEADAAN: Record<ajar.KeadaanMurid, HleEvent> = {
  sudah: "mengajar.siapa.sudah",
  sedang: "mengajar.siapa.sedang",
  belum: "mengajar.siapa.belum",
};

/**
 * M4 (D-085): A TEACHER'S VIEW OF ONE LEARNER IN THEIR CLASS.
 *
 * An educational record, not a dossier: where the learner stands on each of
 * this class's assessments (the three states /siapa lists) and the mastery
 * recorded on their official results, as the catalogue gives an EDUCATOR
 * (`learner.result`, through metric_evaluate). No integrity signal, no answer
 * (M5 governs those), no other learner beside them and no order among them.
 *
 * ONLY A LEARNER OF THIS CLASS. The roster is the database's (faktaKelas, bounded
 * by the educator's own grants); anyone not on it, or a class not the reader's,
 * reaches the same refusal. The evaluator re-authorizes the reader over the
 * learner on its own.
 *
 * WHETHER THE MASTERY TARGET WAS MET IS NOT SAID: the target is the school's
 * pass mark, still open (D-086(b)); the recorded mastery is shown as recorded.
 *
 * W2.18 (J5.13): AND WHAT THE LEARNER HAS NOT YET REACHED, IN WORDS. The
 * objectives, by their statement, that the learner's latest Uji Penguasaan in
 * this class recorded below the mark sealed on it (tujuan_belum_tercapai, which
 * answers nobody but a teacher of this class). No new figure reaches the screen.
 */
export default async function MuridSatu({ params }: { params: Promise<{ kelas: string; orang: string }> }) {
  const { kelas: id, orang } = await params;
  const locale = await currentLocale();
  const s = (k: HleEvent) => t(k, "educator", { locale });

  const ctx = await ajar.kelas(id);
  const fakta = ctx ? await ajar.faktaKelas(id) : null;
  const murid = fakta?.murid.find((m) => m.id === orang) ?? null;
  if (!ctx || !murid) {
    return <HalamanPenolakan locale={locale} persona="educator" backHref={ctx ? `/mengajar/${id}` : "/mengajar"}
      backKey="mengajar.kembali" backLabel={ctx?.ini.nama} />;
  }
  // E-C2-1 (D-069(b), D-168): one learner's academic record is built from answers a professional-learning facilitator
  // may not read, so it exists by the same rule as the per-question evidence; a participant's progress and result are
  // the professional-learning record's, where this sends the reader
  if (!adaBuktiSoal(ctx.ini.jenis)) {
    return <HalamanPenolakan locale={locale} persona="educator" backHref={`/pengembangan/${id}`} backKey="mengajar.bukti.pd.buka" />;
  }

  // W2.18: beside the record, the objectives the learner has not yet reached, as the database answers for this class
  const [catatan, belum] = await Promise.all([
    ajar.catatanMurid(id, ctx.ini.institusi, orang),
    ajar.tujuanBelum(id, orang),
  ]);

  return (
    <>
      <CangkangPengalaman locale={locale} kind="pengajar" current="kelas" />
      <main id="isi" tabIndex={-1} className="pin-col">
        <Link className="pin-back" href={`/mengajar/${id}`}>← {ctx.ini.nama}</Link>
        <BarisLingkup
          scope={{ institution: ctx.konteks.institusi?.nama ?? null, path: [ctx.ini.nama], period: ctx.konteks.periode }}
          locale={locale}
        />
        <div className="pin-head">
          <p className="pin-eyebrow">{s("mengajar.murid1.eyebrow")}</p>
          <h1 className="pin-h1">{murid.nama}</h1>
          <p className="pin-intro">{s("mengajar.murid1.catatan")}</p>
        </div>

        <section className="pin-sec" aria-labelledby="pin-murid-tugas">
          <h2 id="pin-murid-tugas">{s("mengajar.murid1.tugas")}</h2>
          {catatan.tugas.length === 0 ? (
            <Kosong jenis="belum" kalimat={s("mengajar.murid1.tugas_kosong")} />
          ) : (
            <dl className="pin-facts">
              {catatan.tugas.map((x) => (
                <div key={x.id}>
                  <dt>{x.judul}</dt>
                  <dd>{s(KEADAAN[x.keadaan])}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>

        <section className="pin-sec" aria-labelledby="pin-murid-hasil">
          <h2 id="pin-murid-hasil">{s("mengajar.murid1.hasil")}</h2>
          <p className="pin-sub">{s("mengajar.murid1.hasil_arti")}</p>
          {catatan.hasil.status !== "ok" ? (
            <KartuKetiadaan entry={catatan.hasil} locale={locale} persona="educator" />
          ) : catatan.daftarHasil.length === 0 ? (
            <Kosong jenis="belum" kalimat={s("mengajar.murid1.hasil_kosong")} />
          ) : (
            <dl className="pin-facts">
              {catatan.daftarHasil.map((h) => (
                <div key={h.sesi}>
                  <dt>{h.judul ?? s(`mengajar.instrumen.${h.mode}` as HleEvent)}</dt>
                  <dd className="pin-num">
                    {h.penguasaan === null ? "—" : format.percent(h.penguasaan, locale)}
                    {/* owner decisions E1, D14: a recalculated sitting is explained directly under its figure, with its reason */}
                    {h.dihitungUlang ? <CatatanHitungUlang baru={h.penguasaan} asli={h.asli} alasan={h.alasan} locale={locale} /> : null}
                    {/* D-085 M3: below the sealed target, the teacher sees it; the target is shown beside the mastery */}
                    {h.batas !== null ? (
                      <small data-target={h.penguasaan !== null && h.penguasaan < h.batas ? "belum" : "batas"}>
                        {h.penguasaan !== null && h.penguasaan < h.batas ? `${s("mengajar.murid1.di_bawah_target")} · ` : ""}
                        {s("mengajar.murid1.target")} {format.percent(h.batas, locale)}
                      </small>
                    ) : null}
                    {/* D-085 M3 (J5.12): under the target on this class's Uji Penguasaan, the teacher may give material back */}
                    {h.mode === "POST_TEST" && h.batas !== null && h.penguasaan !== null && h.penguasaan < h.batas && catatan.tugasSesi[h.sesi] ? (
                      <Link className="pin-ulang-tautan" href={`/mengajar/${id}/ulang?penugasan=${catatan.tugasSesi[h.sesi]}&murid=${orang}`}>
                        {s("mengajar.ulang.judul")}
                      </Link>
                    ) : null}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </section>

        {/* W2.18 (J5.13): the objectives by their statement (the learner's result's own rows, DAISY-29), no figure
            and no item; «belum» is what to work on next, never a failure (X.5) */}
        <section className="pin-sec" aria-labelledby="pin-murid-tujuan">
          <h2 id="pin-murid-tujuan">{s("mengajar.murid1.tujuan")}</h2>
          <p className="pin-sub">{s("mengajar.murid1.tujuan_arti")}</p>
          {belum.length === 0 ? (
            <Kosong jenis="belum" kalimat={s("mengajar.murid1.tujuan_kosong")} />
          ) : (
            <div className="pin-domain">
              {belum.map((x) => (
                <div className="pin-drow" key={x.id ?? x.pernyataan} data-tujuan-belum="">
                  <span><TeksBaris teks={x.pernyataan} /></span>
                </div>
              ))}
            </div>
          )}
        </section>

        <KakiPintar />
      </main>
    </>
  );
}
