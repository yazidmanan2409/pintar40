import { kataHalaman } from "@/lib/kata-halaman";
import Link from "next/link";
import { namaTempat, KEMBALI_RIWAYAT } from "@/lib/nama-tempat";
import { t, type HleEvent } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import { peranSaya } from "@/lib/tur-negara";
import { halamanLaporan, kodeGalatLaporan, kunciKodeLaporan, rujukanLaporan } from "@/lib/lapor-masalah-kontrak";
import { kirimLaporanAksi } from "./actions";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import KakiPintar from "@/components/KakiPintar";
import BarisHasil from "@/components/BarisHasil";
import TombolKirim from "@/components/TombolKirim";
import TangkapanLayar from "@/components/lapor/TangkapanLayar";
import { cangkangStaf } from "@/components/lapor/cangkang";
import { judulHalaman } from "@/lib/judul-halaman";

export const generateMetadata = judulHalaman("/lapor");

export const dynamic = "force-dynamic";

/**
 * BOB-15 + DAISY-12 (D-037 step 2): «LAPORKAN MASALAH». A short form on the page the problem happened on: what you
 * did, what you expected, what happened, whether it stops a class, and an optional screenshot. PINTAR attaches the
 * page and any error reference (from the address), the device, and in the database the reporter's role, school,
 * build and time. The answer is immediate: received, and where to follow it («Laporan saya»).
 *
 * Students tell their teacher (D-037): a student account reaches a page that says so, never the form.
 */
export default async function Lapor({ searchParams }: { searchParams: Promise<{ dari?: string; ref?: string; kode?: string; rujukan?: string }> }) {
  const q = await searchParams;
  const locale = await currentLocale();
  const s = (k: HleEvent) => t(k, "staff", { locale });
  const peran = await peranSaya();
  const staf = (peran ?? []).some((p) => p !== "STUDENT");
  const { kind, kembali } = cangkangStaf(peran);
  const halaman = halamanLaporan(q.dari);
  const ref = rujukanLaporan(q.ref);
  const kode = q.kode ? kodeGalatLaporan({ code: "PR100", details: q.kode }) : null;
  const galat = q.kode === "REPORT_FAILED" ? "REPORT_FAILED" : kode;
  const rujukanGagal = q.rujukan && /^[A-Z0-9]{6}$/.test(q.rujukan) ? q.rujukan : null;

  return (
    <>
      <CangkangPengalaman locale={locale} kind={kind} halamanKini="lapor" />
      <main id="isi" tabIndex={-1} className="pin-col">
        {/* E-K1: back to the page the report was started from is the history-back, named as one; from no page, the place */}
        <Link className="pin-back" href={halaman === "/" ? kembali : halaman} data-kembali={halaman === "/" ? "tempat" : "riwayat"}>
          ← {s(halaman === "/" ? namaTempat(kembali) ?? "entry.title" : KEMBALI_RIWAYAT)}
        </Link>
        <div className="pin-head">
          <p className="pin-eyebrow">{s("lapor.eyebrow")}</p>
          <h1 className="pin-h1">{s("lapor.judul")}</h1>
          <p className="pin-intro">{s(staf ? "lapor.arti" : "lapor.murid")}</p>
        </div>
        {staf ? (
          <form action={kirimLaporanAksi} className="pin-lapor">
            <input type="hidden" name="dari" value={halaman} />
            {ref ? <input type="hidden" name="ref" value={ref} /> : null}
            <p className="pin-meta">
              {/* D-140(c): the place in words; the path itself travels in the hidden field above */}
              {s("lapor.halaman")} {kataHalaman(halaman, locale)}
              {ref ? <> · {s("lapor.rujukan")} <span className="pin-num">{ref}</span></> : null}
            </p>
            <label className="pin-lapor-isian">
              <span>{s("lapor.lakukan")}</span>
              <textarea name="lakukan" rows={3} maxLength={2000} required />
            </label>
            <label className="pin-lapor-isian">
              <span>{s("lapor.harapan")}</span>
              <textarea name="harapan" rows={3} maxLength={2000} required />
            </label>
            <label className="pin-lapor-isian">
              <span>{s("lapor.terjadi")}</span>
              <textarea name="terjadi" rows={3} maxLength={2000} required />
            </label>
            <label className="pin-lapor-pilih">
              <input type="checkbox" name="hentikan" value="ya" />
              <span>{s("lapor.hentikan")}</span>
            </label>
            <TangkapanLayar locale={locale} />
            <div className="pin-actions">
              <TombolKirim className="pin-btn pin-primary" sibuk={s("tombol.mengirim")}>{s("lapor.kirim")}</TombolKirim>
            </div>
            {galat ? (
              <BarisHasil nada="gagal">
                {s(kunciKodeLaporan(galat))}{rujukanGagal ? ` ${s("galat.rujukan")}: ${rujukanGagal}.` : ""}
              </BarisHasil>
            ) : null}
            <p className="pin-hint">{s("lapor.privasi")}</p>
          </form>
        ) : null}
        <KakiPintar />
      </main>
    </>
  );
}
