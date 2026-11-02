import { t, type HleEvent, type Locale } from "@/lib/hle";
import { acknowledgeFindingsGroupAction } from "@/app/studio/actions";
import TombolKirim from "@/components/TombolKirim";
import SimpanIsian from "@/components/SimpanIsian";
import Ikon from "@/components/Ikon";
import { kelompokTemuan, type Temuan } from "@/lib/temuan";

/**
 * W1.5 (Batch 3; UX-01) · THE QUESTION CHECK'S FINDINGS, ONE GROUP PER KIND.
 *
 * The check (validate_course_content and run_mcq_quality, «Periksa isi sekarang», runnable by the author before the
 * release is locked) writes one finding per question. For SD 5 Bab 1 on staging that was 33 findings, 28 of them the
 * same sentence, each with its own «Sudah saya tinjau» and a page load. Here a finding's kind is its sentence (the
 * database writes the same «masalah», «mengapa penting» and «cara memperbaiki» for every finding of one pattern): each
 * kind is listed once with its count, its why and its fix said once, and its places in a Disclosure. A reviewer
 * acknowledges the kind with ONE press and one note (acknowledgeFindingsGroupAction), which asks the database once per
 * finding; the database still decides each (acknowledge_finding). An ERROR is never acknowledged: it says it is fixed
 * in the content.
 *
 * The page that mounts this keeps its own «Temuan» heading, its check button and its result line (HasilDi, section
 * «temuan»); this draws the list. Every word is the copy table's or the database's own finding text.
 */
export type { Temuan, JenisTemuan } from "@/lib/temuan";

export default function TemuanKelompok({
  course, mcq, coaching, bolehAkui, pemilik, ditolak, locale,
}: {
  course: string;
  mcq: readonly Temuan[];
  coaching: readonly Temuan[];
  /** The reader holds CAN_REVIEW in the course's school (the database decides again). */
  bolehAkui: boolean;
  pemilik: string;
  /** The page's last group press was refused: what was typed comes back (CR-84 (3)). */
  ditolak: boolean;
  locale: Locale;
}) {
  const s = (k: HleEvent) => t(k, "staff", { locale });
  const kelompok = kelompokTemuan([{ jenis: "MCQ_QUALITY", temuan: mcq }, { jenis: "COACHING", temuan: coaching }]);
  return (
    <ul className="pin-daftar" data-temuan-kelompok="">
      {kelompok.map((g, i) => {
        const formId = `temuan-kelompok-${i + 1}`;
        const akui = bolehAkui && g.severity === "WARNING";
        return (
          <li key={formId} className="pin-panel" data-jenis={g.jenis} data-jumlah={g.temuan.length}>
            <div className="pin-temuan-kepala">
              <p className="pin-judul-baris">{g.masalah}</p>
              <span className="pin-temuan-jumlah">{g.temuan.length} {s("studio.temuan.kelompok.jumlah")}</span>
            </div>
            <p className="pin-ket">{s("studio.temuan.mengapa")}: {g.mengapa}</p>
            <p className="pin-ket">{s("studio.temuan.cara")}: {g.cara}</p>
            <details className="pin-disclosure pin-temuan-lokasi">
              <summary>{s("studio.temuan.kelompok.lokasi")}<Ikon nama="chevron-down" kelas="pin-chevron" /></summary>
              <ul className="pin-daftar-titik pin-ket">
                {g.temuan.map((f) => <li key={f.id}>{s("studio.temuan.lokasi")}: {f.lokasi}</li>)}
              </ul>
            </details>
            {g.severity === "ERROR" ? <p className="pin-ket">{s("studio.temuan.perbaiki_dulu")}</p> : null}
            {akui ? (
              <form action={acknowledgeFindingsGroupAction} id={formId} className="pin-baris-aksi">
                <input type="hidden" name="course" value={course} />
                <input type="hidden" name="kind" value={g.jenis} />
                {g.temuan.map((f) => <input key={f.id} type="hidden" name="finding" value={f.id} />)}
                <div className="pin-bidang">
                  <label htmlFor={`${formId}-catatan`}>{s("studio.paket.catatan")}</label>
                  <input id={`${formId}-catatan`} className="pin-input" name="catatan" />
                </div>
                <TombolKirim className="pin-btn" sibuk={s("tombol.menyimpan")}>
                  {s(g.temuan.length > 1 ? "studio.temuan.akui_semua" : "studio.temuan.akui")}
                </TombolKirim>
              </form>
            ) : null}
            {akui ? <SimpanIsian form={formId} ditolak={ditolak} pemilik={pemilik} /> : null}
          </li>
        );
      })}
    </ul>
  );
}
