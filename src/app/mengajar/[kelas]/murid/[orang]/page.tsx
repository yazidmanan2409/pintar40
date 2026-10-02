import Link from "next/link";
import { t, format, type HleEvent } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import * as ajar from "@/lib/pengajar";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import KakiPintar from "@/components/KakiPintar";
import HalamanPenolakan from "@/components/HalamanPenolakan";
import { BarisLingkup, KartuKetiadaan } from "@/components/bukti";

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
 */
export default async function MuridSatu({ params }: { params: Promise<{ kelas: string; orang: string }> }) {
  const { kelas: id, orang } = await params;
  const locale = await currentLocale();
  const s = (k: HleEvent) => t(k, "educator", { locale });

  const ctx = await ajar.kelas(id);
  const fakta = ctx ? await ajar.faktaKelas(id) : null;
  const murid = fakta?.murid.find((m) => m.id === orang) ?? null;
  if (!ctx || !murid) {
    return <HalamanPenolakan locale={locale} persona="educator" backHref={ctx ? `/mengajar/${id}` : "/mengajar"} backKey="mengajar.kembali" />;
  }

  const catatan = await ajar.catatanMurid(id, ctx.ini.institusi, orang);

  return (
    <>
      <CangkangPengalaman locale={locale} kind="pengajar" current="kelas" />
      <main className="pin-col">
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
            <p className="pin-empty">{s("mengajar.murid1.tugas_kosong")}</p>
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
            <p className="pin-empty">{s("mengajar.murid1.hasil_kosong")}</p>
          ) : (
            <dl className="pin-facts">
              {catatan.daftarHasil.map((h) => (
                <div key={h.sesi}>
                  <dt>{h.judul ?? s(`mengajar.instrumen.${h.mode}` as HleEvent)}</dt>
                  <dd className="pin-num">
                    {h.penguasaan === null ? "—" : format.percent(h.penguasaan, locale)}
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

        <KakiPintar />
      </main>
    </>
  );
}
