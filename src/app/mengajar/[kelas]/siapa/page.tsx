import Link from "next/link";
import { t, format, type HleEvent } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import * as ajar from "@/lib/pengajar";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import KakiPintar from "@/components/KakiPintar";
import HalamanPenolakan from "@/components/HalamanPenolakan";
import { BarisLingkup } from "@/components/bukti";
import DaftarMurid from "@/components/mengajar/DaftarMurid";
import { kataAnggota } from "@/lib/mengajar";

export const dynamic = "force-dynamic";

/**
 * WHO HAS SUBMITTED — three lists of names, and nothing else.
 *
 * OBSERVATION IS NOT JUDGMENT, and this is the page where the difference is
 * easiest to lose. Everything the design could have reached for here — a red
 * dot, a percentage, a rank, the word "tertinggal", the stragglers floated to
 * the top — would be PINTAR telling a teacher something about a child that it
 * does not know. It knows a session reached SUBMITTED or it did not. It does
 * not know whether the child was ill, whether the tablet failed, or whether
 * they simply have not opened PINTAR today, and the note under the lists says
 * exactly that.
 *
 * So there are three headings and three alphabetical lists: submitted, started
 * and not submitted, not started (EDU-J23, EDU-J24; the states «Lihat bukti»
 * counts, W8). No colour, no order but the alphabet, no reason, and nothing
 * attached to any single name.
 *
 * THE NAMES ARE BOUNDED BY THE DATABASE, THE SESSIONS ARE NOT.
 * `persons_select` runs through `person_visible_to_me()`, whose educator branch
 * is subtree containment — so a learner outside this reader's grants never
 * arrives. `assessment_sessions_select` is institution-wide
 * (`can_in_institution('CAN_ASSIGN_LEARNING', …)`), and the query is narrowed to
 * this one assignment. The safety here comes from the roster, not from the
 * session read, and no copy on this page claims the other way round.
 */
export default async function Siapa({
  params,
  searchParams,
}: {
  params: Promise<{ kelas: string }>;
  searchParams: Promise<{ penugasan?: string }>;
}) {
  const { kelas: id } = await params;
  const { penugasan: tugasId } = await searchParams;
  const locale = await currentLocale();
  const s = (k: HleEvent) => t(k, "educator", { locale });

  const ctx = await ajar.kelas(id);
  if (!ctx || !tugasId) {
    return <HalamanPenolakan locale={locale} persona="educator" backHref="/mengajar" backKey="mengajar.kembali" />;
  }

  const [fakta, semua] = await Promise.all([
    ajar.faktaKelas(id),
    ajar.berjalan([id], ["OPEN", "CLOSED"]),
  ]);
  const ini = semua.find((b) => b.id === tugasId);
  if (!ini) {
    return <HalamanPenolakan locale={locale} persona="educator" backHref={`/mengajar/${id}`} backKey="mengajar.kembali" />;
  }

  const { sudah, sedang, belum } = await ajar.siapa(tugasId, fakta.murid);

  return (
    <>
      <CangkangPengalaman locale={locale} kind="pengajar" current="kelas" />
      <main className="pin-col">
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
          <p className="pin-eyebrow">{ini.judul}</p>
          <h1 className="pin-h1">{s("mengajar.siapa.judul")}</h1>
          <p className="pin-intro">{s("mengajar.siapa.catatan")}</p>
        </div>

        <div className="pin-sec">
          <h2>
            {s("mengajar.siapa.sudah")} · {format.number(sudah.length, locale)}
          </h2>
          <DaftarMurid murid={sudah} locale={locale} kelas={id} kosong={kataAnggota("mengajar.siapa.kosong", ctx.ini.jenis)} />
        </div>

        <div className="pin-sec">
          <h2>
            {s("mengajar.siapa.sedang")} · {format.number(sedang.length, locale)}
          </h2>
          <DaftarMurid murid={sedang} locale={locale} kelas={id} kosong={kataAnggota("mengajar.siapa.kosong", ctx.ini.jenis)} />
        </div>

        <div className="pin-sec">
          <h2>
            {s("mengajar.siapa.belum")} · {format.number(belum.length, locale)}
          </h2>
          <DaftarMurid murid={belum} locale={locale} kelas={id} kosong={kataAnggota("mengajar.siapa.kosong", ctx.ini.jenis)} />
        </div>

        <p className="pin-foot">{s("mengajar.cepat.hidup.catatan")}</p>
        <KakiPintar />
      </main>
    </>
  );
}
