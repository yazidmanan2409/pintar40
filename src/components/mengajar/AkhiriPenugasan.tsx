import Link from "next/link";
import { t, format, type HleEvent, type Locale } from "@/lib/hle";
import type { Penugasan, PratinjauAkhiri } from "@/lib/pengajar";
import { kunciKodePenugasan, type KodePenugasan } from "@/lib/penugasan-kontrak";
import { akhiriPenugasanAction } from "@/app/mengajar/actions";
import KonfirmasiBahaya from "@/components/KonfirmasiBahaya";
import BarisHasil from "@/components/BarisHasil";
import Kosong from "@/components/Kosong";

/**
 * W2.21 (owner, 9 Nov): «Akhiri penugasan» on the class page, opened from one material's row.
 *
 * WHAT IS TOUCHED, BEFORE ANYTHING IS. The panel reads akhiri_penugasan_pratinjau: how many students finished (kept),
 * how many never started (they will not be able to), and, by name, who is still answering an assessment of this
 * material. Those sittings end only if the teacher ticks the confirmation; without it the database refuses
 * (ASSIGN_IN_PROGRESS) and nothing changes. The kind (Diakhiri / Ditarik) and a reason are required; the act's words follow the kind (both drawn, the stylesheet shows the chosen one), and the
 * act is the destructive confirmation (Daisy, TINJAUAN-6faef690 §1).
 *
 * NOT UNPUBLISHING. The sentence under the heading says the lesson package stays published and can be given again;
 * nothing here reaches Studio.
 */
export default function AkhiriPenugasan({ kelasId, tugas, pratinjau, kode, locale }: {
  kelasId: string;
  tugas: Penugasan;
  pratinjau: PratinjauAkhiri;
  kode: KodePenugasan | null;
  locale: Locale;
}) {
  const s = (k: HleEvent) => t(k, "educator", { locale });
  // a lesson whose title cannot be read is still named, never left as «penugasan ?»
  const kursus = tugas.kursus || s("mengajar.akhiri.tanpa_judul");
  return (
    <form id="akhiri" action={akhiriPenugasanAction} className="pin-sec pin-ulang pin-akhiri" data-akhiri={tugas.id}>
      <input type="hidden" name="kelas" value={kelasId} />
      <input type="hidden" name="penugasan" value={tugas.id} />
      <h2>{s("mengajar.akhiri.judul")} · {kursus}</h2>
      <p className="pin-sub">{s("mengajar.akhiri.arti")}</p>
      {kode ? <BarisHasil nada="gagal">{s(kunciKodePenugasan(kode))}</BarisHasil> : null}

      <dl className="pin-facts">
        <div>
          <dt>{s("mengajar.akhiri.selesai_n")}</dt>
          <dd><span className="pin-num">{format.number(pratinjau.selesai, locale)}</span></dd>
        </div>
        <div>
          <dt>{s("mengajar.akhiri.belum_n")}</dt>
          <dd><span className="pin-num">{format.number(pratinjau.belumMulai, locale)}</span></dd>
        </div>
        <div>
          <dt>{s("mengajar.akhiri.berjalan")}</dt>
          <dd><span className="pin-num">{format.number(pratinjau.berjalan.length, locale)}</span></dd>
        </div>
      </dl>

      <fieldset>
        <legend>{s("mengajar.akhiri.berjalan")}</legend>
        {pratinjau.berjalan.length === 0 ? (
          <Kosong jenis="belum" kalimat={s("mengajar.akhiri.berjalan_kosong")} />
        ) : (
          <>
            <ul data-berjalan={pratinjau.berjalan.length}>
              {pratinjau.berjalan.map((b) => <li key={b.personId}>{b.nama}</li>)}
            </ul>
            <label className="pin-cepat-centang">
              <input type="checkbox" name="akhiri_berjalan" value="ya" required />
              <span>{s("mengajar.akhiri.konfirmasi")}</span>
            </label>
          </>
        )}
      </fieldset>


      <div className="pin-isian">
        <label htmlFor="akhiri-alasan">{s("mengajar.akhiri.alasan")}</label>
        <textarea id="akhiri-alasan" name="alasan" className="pin-input" rows={3} minLength={10} maxLength={300} required
          aria-describedby="akhiri-alasan-arti" />
        <p id="akhiri-alasan-arti" className="pin-hint">{s("mengajar.akhiri.alasan.arti")}</p>
      </div>

      <fieldset>
        <legend>{s("mengajar.akhiri.jenis")}</legend>
        <ul>
          {(["ENDED", "WITHDRAWN"] as const).map((j) => (
            <li key={j}>
              <label className="pin-cepat-centang">
                <input type="radio" name="jenis" value={j} defaultChecked={j === "ENDED"} required />
                <span>{s(`mengajar.akhiri.jenis.${j.toLowerCase()}` as HleEvent)}</span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      {/* Daisy (TINJAUAN-6faef690 §1): the act's words follow the kind, and the act is the destructive confirmation (red
          opener and confirm, a quiet «Batal»). Both are drawn; the stylesheet shows the one the chosen kind names. */}
      <div className="pin-actions" data-akhiri-untuk="ENDED">
        <KonfirmasiBahaya id={`akhiri-${tugas.id}`} sibuk={s("tombol.memproses")} tombol={s("mengajar.akhiri.tombol")} ya={s("mengajar.akhiri.tombol")}
          batal={s("mengajar.akhiri.batal")} tanya={s("mengajar.akhiri.tanya").replace("{kursus}", kursus)} akibat={<p>{s("mengajar.akhiri.akibat")}</p>} />
      </div>
      <div className="pin-actions" data-akhiri-untuk="WITHDRAWN">
        <KonfirmasiBahaya id={`tarik-${tugas.id}`} sibuk={s("tombol.memproses")} tombol={s("mengajar.akhiri.tombol_tarik")} ya={s("mengajar.akhiri.tombol_tarik")}
          batal={s("mengajar.akhiri.batal")} tanya={s("mengajar.akhiri.tanya_tarik").replace("{kursus}", kursus)} akibat={<p>{s("mengajar.akhiri.akibat_tarik")}</p>} />
      </div>
      <p><Link className="pin-btn pin-quiet" href={`/mengajar/${encodeURIComponent(kelasId)}#materi`}>{s("mengajar.akhiri.tutup")}</Link></p>
    </form>
  );
}
