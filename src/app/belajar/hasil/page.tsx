import Kosong from "@/components/Kosong";
import { redirect } from "next/navigation";
import { t, type HleEvent, type Persona } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import { currentViewer } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import * as engine from "@/lib/assessment-engine";
import { hasilBelajar } from "@/lib/hasil-belajar";
import { peranSaya } from "@/lib/tur-negara";
import { konteksPembelajaran } from "@/lib/pembelajaran";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import KomposisiMurid from "@/components/laporan/KomposisiMurid";
import AksiLaporan from "@/components/laporan/AksiLaporan";
import { kataKaki } from "@/lib/kaki-cetak";
import { cetakLaporan } from "@/app/laporan/cetak/actions";
import KakiPintar from "@/components/KakiPintar";
import { judulHalaman } from "@/lib/judul-halaman";
import { tanggal } from "@/lib/tanggal";

export const generateMetadata = judulHalaman("/belajar/hasil");

export const dynamic = "force-dynamic";

/**
 * D-195(1), CONTOH LAPORAN 1-murid: «HASIL BELAJAR», EVERY CHAPTER THE LEARNER HAS WORKED ON, ON ONE PAGE.
 *
 * New presentation over existing results, approved by the owner: the same engine reads, in the learner's own session,
 * that each chapter's result page makes (hasilBelajar), drawn as Daisy's composition. Each chapter's own result page
 * stays as it is and is linked from here. Only the learner's own work: the reads select on the caller (my_* and the
 * session's own outcome), so nothing here can show another learner, a class figure or a rank. A4 like the reports.
 */
export default async function HasilBelajar() {
  const viewer = await currentViewer();
  if (!viewer) redirect("/masuk?lanjut=/belajar/hasil");
  const locale = await currentLocale();
  // the words of the reader's own learning: an educator learning is spoken to as on /belajar (WP6B), the figures the same
  const persona: Persona = konteksPembelajaran(await peranSaya()).mengajar ? "educator" : "learner";
  const s = (k: HleEvent) => t(k, persona, { locale });
  const db = (await supabaseServer()) as unknown as engine.EngineClient;
  const bab = await hasilBelajar(db);

  return (
    <>
      <CangkangPengalaman locale={locale} current="belajar" />
      <main id="isi" tabIndex={-1} className="pin-col">
        <div className="pin-head">
          <h1 className="pin-h1">{s("hasilbelajar.judul")}</h1>
          <p className="pin-intro">{s("hasilbelajar.cakupan").replace("{waktu}", tanggal(new Date(), "cap", locale))}</p>
        </div>
        {/* B2 (§5.2 F; the defect found by the engineer): an empty report offers no «Cetak laporan» */}
        <AksiLaporan kembali={s("nav.belajar")} ke="/belajar" cetak={s("laporan.cetak")} aksi={cetakLaporan} kaki={kataKaki(locale, persona)}
          cetakSebagai={bab.some((b) => b.keadaan !== "BERJALAN") ? { laporan: "hasil.belajar" } : null} />
        {bab.length === 0 ? (
          <Kosong jenis="belum" kalimat={s("hasilbelajar.kosong")} aksi={{ href: "/belajar", label: s("nav.belajar") }} />
        ) : (
          <KomposisiMurid bab={bab} locale={locale} persona={persona} />
        )}
      </main>
      <KakiPintar className="pin-noprint" />
    </>
  );
}
