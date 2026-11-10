import Link from "next/link";
import { t, format, type HleEvent } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import * as ajar from "@/lib/pengajar";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import KakiPintar from "@/components/KakiPintar";
import HalamanPenolakan from "@/components/HalamanPenolakan";
import TombolKirim from "@/components/TombolKirim";
import BarisHasil from "@/components/BarisHasil";
import Kosong from "@/components/Kosong";
import { BarisLingkup } from "@/components/bukti";
import { mintaBacaUlang } from "../../actions";
import { bacaKodeUlang } from "@/lib/ulang-kontrak";
import { judulHalaman } from "@/lib/judul-halaman";
import { tanggal } from "@/lib/tanggal";
import { zonaSekolah } from "@/lib/zona-sekolah";
import { supabaseServer } from "@/lib/supabase/server";

export const generateMetadata = judulHalaman("/mengajar/[kelas]/ulang");

export const dynamic = "force-dynamic";

/**
 * D-085 M3 (J5.12) — «MINTA MEMBACA LAGI».
 *
 * "The learner remains visibly below target to the authorised teacher; the
 * teacher may reassign existing learning material to selected learners who
 * need additional support." Reached from an Uji Penguasaan the class handed
 * in (on «Lihat bukti») or from a learner's record. The class's learners are
 * listed with where each stands against the chapter's sealed target, those
 * under it first and ticked; the teacher chooses the learners and the
 * chapter's lessons, and each chosen learner finds the request on their home.
 *
 * Which learners need support is the teacher's judgement, so any learner of
 * the class may be ticked. Nothing about a result, an attempt or a mastery
 * changes; there is no new test. The requests already made are listed below
 * with how many of their lessons have been read again.
 */
export default async function UlangKelas({
  params,
  searchParams,
}: {
  params: Promise<{ kelas: string }>;
  searchParams: Promise<{ penugasan?: string; murid?: string; ulang?: string; kode?: string; ref?: string; n?: string }>;
}) {
  const { kelas: id } = await params;
  const sp = await searchParams;
  const locale = await currentLocale();
  const s = (k: HleEvent) => t(k, "educator", { locale });
  const n = (x: number) => format.number(x, locale);

  const ctx = await ajar.kelas(id);
  const bahan = ctx && sp.penugasan ? await ajar.bahanUlang(id, ctx.ini.institusi, sp.penugasan) : null;
  if (!ctx || !bahan) {
    return <HalamanPenolakan locale={locale} persona="educator" backHref={ctx ? `/mengajar/${id}/bukti` : "/mengajar"}
      backKey={ctx ? "mengajar.soal.kembali" : "mengajar.kembali"} />;
  }
  // from a learner's record: that learner ticked; otherwise those under the target
  const dariMurid = sp.murid && bahan.murid.some((m) => m.id === sp.murid) ? sp.murid : null;
  const kode = sp.ulang === "gagal" ? bacaKodeUlang(sp.kode) : null;
  const ref = sp.ref && /^[A-Z0-9]{6}$/.test(sp.ref) ? sp.ref : null;
  // the owner's ruling (10 Nov): when each re-read was asked, on the class's school's clock
  const zona = await zonaSekolah(await supabaseServer(), ctx.ini.institusi);

  return (
    <>
      <CangkangPengalaman locale={locale} kind="pengajar" current="kelas" />
      <main id="isi" tabIndex={-1} className="pin-col">
        <Link className="pin-back" href={`/mengajar/${id}/bukti`}>← {s("mengajar.soal.kembali")}</Link>
        <BarisLingkup
          scope={{ institution: ctx.konteks.institusi?.nama ?? null, path: [ctx.ini.nama], period: ctx.konteks.periode }}
          locale={locale}
        />
        <div className="pin-head">
          <p className="pin-eyebrow">{bahan.judul}</p>
          <h1 className="pin-h1">{s("mengajar.ulang.judul")}</h1>
          {/* Daisy (821d3853): on a closed chapter the closed sentence replaces the invitation and the target */}
          {bahan.tertutup ? null : <p className="pin-intro">{s("mengajar.ulang.arti")}</p>}
          {!bahan.tertutup && bahan.batas !== null ? (
            <p className="pin-meta">{s("mengajar.murid1.target")} {format.percent(bahan.batas, locale)}</p>
          ) : null}
        </div>

        {sp.ulang === "ok" ? (
          <BarisHasil nada="ok">{s("mengajar.ulang.terkirim")} {n(Number(sp.n) || 0)} {format.satuan(Number(sp.n) || 0, s("mengajar.bukti.murid"), locale)}.</BarisHasil>
        ) : kode ? (
          <BarisHasil nada="gagal">
            {s(`mengajar.ulang.tolak.${kode.toLowerCase()}` as HleEvent)}
            {kode === "REVIEW_FAILED" && ref ? ` ${s("galat.rujukan")}: ${ref}.` : ""}
            {/* UX-45: a refusal ends with the teacher's recovery line, as every refusal a teacher meets does */}
            {kode === "REVIEW_NOT_ALLOWED" ? ` ${s("tolak.arti")}` : ""}
          </BarisHasil>
        ) : null}

        {/* Daisy (1fad2861, B2): a chapter the class is no longer given cannot be asked for again (request_lesson_review:
            REVIEW_ASSIGNMENT_CLOSED); the page says so in place of the form, and the requests already made stay listed */}
        {bahan.tertutup ? (
          <p className="pin-msg pin-sec" data-ulang-tertutup="">{s("mengajar.ulang.tolak.review_assignment_closed")}</p>
        ) : (
        <form action={mintaBacaUlang} className="pin-sec pin-ulang">
          <input type="hidden" name="kelas" value={id} />
          <input type="hidden" name="penugasan" value={bahan.penugasan} />
          <input type="hidden" name="tugas" value={bahan.tugas} />

          <fieldset className="pin-ulang-murid">
            <legend>{s("mengajar.ulang.murid")}</legend>
            {bahan.murid.length === 0 ? (
              <Kosong jenis="belum" kalimat={s("mengajar.ulang.murid_kosong")} />
            ) : (
              <ul>
                {bahan.murid.map((m) => (
                  <li key={m.id} data-murid={m.id}>
                    <label className="pin-cepat-centang">
                      <input type="checkbox" name="murid" value={m.id}
                        defaultChecked={dariMurid ? m.id === dariMurid : m.status === "bawah"} />
                      <span>
                        {m.nama}{" "}
                        <small data-status={m.status}>
                          {m.status === "belum"
                            ? s("mengajar.ulang.belum_uji")
                            : `${m.status === "bawah" ? `${s("mengajar.murid1.di_bawah_target")} · ` : ""}${m.penguasaan === null ? "—" : format.percent(m.penguasaan, locale)}`}
                        </small>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </fieldset>

          <fieldset className="pin-ulang-pelajaran">
            <legend>{s("mengajar.ulang.pelajaran")}</legend>
            <ol>
              {bahan.pelajaran.map((l) => (
                <li key={l.id}>
                  <label className="pin-cepat-centang">
                    <input type="checkbox" name="pelajaran" value={l.id} defaultChecked />
                    <span>{l.judul}</span>
                  </label>
                </li>
              ))}
            </ol>
          </fieldset>

          <p className="pin-sub">{s("mengajar.ulang.tidak_berubah")}</p>
          {/* W3.17 (Daisy, J2Kelas; 08 Actions): «Mengirim…», then «✓ Terkirim» once the database has taken the request;
              a request inside PINTAR, not an email, so the result word is honest. Changing a tick returns it to its verb. */}
          <TombolKirim className="pin-btn pin-primary" sibuk={s("tombol.mengirim")}
            selesai={sp.ulang === "ok" ? s("mengajar.ulang.selesai") : undefined}>{s("mengajar.ulang.kirim")}</TombolKirim>
        </form>
        )}

        <section className="pin-sec" aria-labelledby="pin-ulang-riwayat">
          <h2 id="pin-ulang-riwayat">{s("mengajar.ulang.riwayat")}</h2>
          {bahan.permintaan.length === 0 ? (
            <Kosong jenis="belum" kalimat={s("mengajar.ulang.riwayat_kosong")} />
          ) : (
            <dl className="pin-facts">
              {bahan.permintaan.map((r) => (
                <div key={r.id} data-permintaan={r.orang}>
                  <dt>{r.nama}</dt>
                  <dd>
                    {tanggal(r.kapan, "baca", locale, zona)} · {n(r.dibaca)} {s("mengajar.soal.dari")} {n(r.jumlah)} {s("mengajar.ulang.dibaca")}
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
