import Link from "next/link";
import { namaTempat } from "@/lib/nama-tempat";
import { t, format, type HleEvent } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import { peranSaya } from "@/lib/tur-negara";
import { catatan, type KeadaanUji, type PaketPeserta } from "@/lib/pengembangan";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import KakiPintar from "@/components/KakiPintar";
import HalamanPenolakan from "@/components/HalamanPenolakan";
import { judulHalaman } from "@/lib/judul-halaman";
import { konteksSaya } from "@/lib/konteks-server";
import { cangkangStaf } from "@/components/lapor/cangkang";

export const generateMetadata = judulHalaman("/pengembangan/[simpul]");

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
  const [isi, peran, k] = await Promise.all([catatan(simpul), peranSaya(), konteksSaya()]);
  // E-C1-6 (D-132): the shell of the reader's own work, chosen by the working context as every other staff page's
  // places are (a teacher's, Management's, or none for the administrator); the roles only stand in without one
  const { kind, kembali } = cangkangStaf(peran, k?.keadaan === "ADA" ? k : null);
  if (!isi) {
    return <HalamanPenolakan locale={locale} persona="staff" messageKey="pengembangan.ditolak" backHref={kembali} />;
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
      <main id="isi" tabIndex={-1} className="pin-col">
        <Link className="pin-back" href={kembali}>← {s(namaTempat(kembali) ?? "nav.konfigurasi")}</Link>
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
      </main>
      {/* E-C1-5 (Daisy, C1 PIMPINAN.md): an A4 surface like the reports — the provenance footer stays on screen, outside
          the record, and off the paper */}
      <KakiPintar className="pin-noprint" />
    </>
  );
}
