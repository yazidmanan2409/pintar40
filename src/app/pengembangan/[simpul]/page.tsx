import Link from "next/link";
import Kosong from "@/components/Kosong";
import { namaTempat } from "@/lib/nama-tempat";
import { t, type HleEvent } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import { peranSaya } from "@/lib/tur-negara";
import { catatan } from "@/lib/pengembangan";
import KomposisiPengembangan from "@/components/laporan/KomposisiPengembangan";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import KakiPintar from "@/components/KakiPintar";
import HalamanPenolakan from "@/components/HalamanPenolakan";
import { judulHalaman } from "@/lib/judul-halaman";
import { konteksSaya } from "@/lib/konteks-server";
import { cangkangStaf } from "@/components/lapor/cangkang";

export const generateMetadata = judulHalaman("/pengembangan/[simpul]");

export const dynamic = "force-dynamic";

/**
 * DAISY-34 (D-069(b), D-070(a), (b); BOB-47): WHERE THE RULED AUDIENCES SEE PROFESSIONAL LEARNING.
 *
 * One read-only record per professional-learning place: participants × package, with the columns the database
 * returned to this reader. The facilitator, the Kepala departemen over the place and the Dekan see progress and the
 * result (learner.result, catalogue MC-5); Admin sekolah sees enrolment, participation and completion, and the page
 * draws only what came back. Never answers, never integrity, never a figure or a ranking, never inside a decision
 * queue: it is reached from the facilitator's Kelas and from each audience's home, as a link.
 *
 * Anyone else, and a place that is not one, meets the one refusal page: the database refused them
 * (PD_RECORD_NOT_ALLOWED), and the page has no slot for why.
 */
export default async function CatatanPengembangan({ params }: { params: Promise<{ simpul: string }> }) {
  const { simpul } = await params;
  const locale = await currentLocale();
  const s = (k: HleEvent) => t(k, "staff", { locale });
  const [isi, peran, k] = await Promise.all([catatan(simpul), peranSaya(), konteksSaya()]);
  // E-C1-6 (D-132): the shell of the reader's own work, chosen by the working context as every other staff page's
  // places are (a teacher's, Management's, or none for the administrator); the roles only stand in without one
  const { kind, kembali } = cangkangStaf(peran, k?.keadaan === "ADA" ? k : null);
  if (!isi) {
    return <HalamanPenolakan locale={locale} persona="staff" messageKey="pengembangan.ditolak" backHref={kembali} />;
  }

  return (
    <>
      <CangkangPengalaman locale={locale} kind={kind} />
      <main id="isi" tabIndex={-1} className="pin-col">
        <Link className="pin-back" href={kembali}>← {s(namaTempat(kembali) ?? "nav.konfigurasi")}</Link>
        <div className="pin-head">
          <p className="pin-eyebrow">{s("pengembangan.eyebrow")} · {isi.nama}</p>
          <h1 className="pin-h1">{s("pengembangan.judul")}</h1>
        </div>

        {/* CONTOH LAPORAN 6-fasilitator (D-195(3)): a table per package, person by person, nothing added up */}
        {isi.peserta.length === 0 ? (
          <Kosong jenis="belum" kalimat={s("pengembangan.kosong")} />
        ) : (
          <KomposisiPengembangan isi={isi} locale={locale} />
        )}
      </main>
      {/* E-C1-5 (Daisy, C1 PIMPINAN.md): an A4 surface like the reports — the provenance footer stays on screen, outside
          the record, and off the paper */}
      <KakiPintar className="pin-noprint" />
    </>
  );
}
