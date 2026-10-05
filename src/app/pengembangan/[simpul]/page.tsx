import Link from "next/link";
import { t, format, type HleEvent } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import { peranSaya } from "@/lib/tur-negara";
import { catatan, type KeadaanUji, type PaketPeserta } from "@/lib/pengembangan";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import KakiPintar from "@/components/KakiPintar";
import HalamanPenolakan from "@/components/HalamanPenolakan";

export const dynamic = "force-dynamic";

const KEADAAN: Record<KeadaanUji, HleEvent> = {
  BELUM: "pengembangan.status.BELUM",
  SEDANG: "pengembangan.status.SEDANG",
  SELESAI: "pengembangan.status.SELESAI",
};

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
  const [isi, peran] = await Promise.all([catatan(simpul), peranSaya()]);
  // the shell of the reader's own work: a teacher's, Management's, or none for the administrator
  const kind = peran?.includes("EDUCATOR") ? "pengajar" : peran?.some((p) => p === "HEAD_OF_DEPARTMENT" || p === "DEAN") ? "pimpinan" : "focus";
  const kembali = kind === "pengajar" ? "/mengajar" : kind === "pimpinan" ? "/pimpinan" : "/konfigurasi";
  if (!isi) {
    return <HalamanPenolakan locale={locale} persona="staff" backHref={kembali} backKey="pengembangan.kembali" />;
  }

  const ringkas = (p: PaketPeserta): string[] => {
    const bagian = [
      `${s("pengembangan.kolom.mulai")}: ${s(p.mulai ? "pengembangan.ya" : "pengembangan.belum")}`,
      `${s("pengembangan.kolom.pemetaan")}: ${s(KEADAAN[p.pemetaan])}`,
      `${s("pengembangan.kolom.penguasaan")}: ${s(KEADAAN[p.penguasaan])}`,
    ];
    if (p.pelajaran) {
      bagian.push(`${s("pengembangan.kolom.pelajaran")}: ${format.number(p.pelajaran.selesai, locale)}/${format.number(p.pelajaran.jumlah, locale)}`);
    }
    if (p.hasil) {
      const kata = p.hasil.tercapai === null ? "" : ` · ${s(p.hasil.tercapai ? "pengembangan.tercapai" : "pengembangan.belum_tercapai")}`;
      bagian.push(`${s("pengembangan.kolom.hasil")}: ${format.percent(p.hasil.penguasaan, locale)}${kata}`);
    }
    return bagian;
  };

  return (
    <>
      <CangkangPengalaman locale={locale} kind={kind} />
      <main className="pin-col">
        <Link className="pin-back" href={kembali}>← {s("pengembangan.kembali")}</Link>
        <div className="pin-head">
          <p className="pin-eyebrow">{s("pengembangan.eyebrow")} · {isi.nama}</p>
          <h1 className="pin-h1">{s("pengembangan.judul")}</h1>
          <p className="pin-intro">{s(isi.kolom === "FULL" ? "pengembangan.arti" : "pengembangan.arti_terbatas")}</p>
        </div>

        {isi.peserta.length === 0 ? (
          <p className="pin-empty">{s("pengembangan.kosong")}</p>
        ) : (
          isi.peserta.map((o) => (
            <section key={o.id} className="pin-sec" aria-labelledby={`pin-peserta-${o.id}`}>
              <h2 id={`pin-peserta-${o.id}`}>{o.nama}</h2>
              <p className="pin-sub">{s(o.terdaftar === "PENDING" ? "pengembangan.daftar.PENDING" : "pengembangan.daftar.ACTIVE")}</p>
              {o.paket.length === 0 ? (
                <p className="pin-empty">{s("pengembangan.paket_kosong")}</p>
              ) : (
                <div className="pin-list">
                  {o.paket.map((p) => (
                    <div key={p.id} className="pin-row">
                      <span className="pin-title">{p.judul}</span>
                      <span className="pin-rowmeta">
                        {ringkas(p).map((x, i) => <span key={i}>{x}</span>)}
                      </span>
                      <span className="pin-pill pin-neutral">
                        {s("pengembangan.kolom.selesai")}: {s(p.selesai ? "pengembangan.ya" : "pengembangan.belum")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))
        )}
        <KakiPintar />
      </main>
    </>
  );
}
