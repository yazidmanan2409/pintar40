import { kataHalaman } from "@/lib/kata-halaman";
import Link from "next/link";
import { t, format, type HleEvent } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import { peranSaya } from "@/lib/tur-negara";
import { kunciStatusLaporan, laporanSaya } from "@/lib/lapor-masalah";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import KakiPintar from "@/components/KakiPintar";
import BarisHasil from "@/components/BarisHasil";
import { cangkangStaf } from "@/components/lapor/cangkang";

export const dynamic = "force-dynamic";

/**
 * DAISY-12 (D-037 step 2): «LAPORAN SAYA». The reporter's own reports, newest first, each with its status
 * (Diterima → Ditangani → Selesai) and the next step written to them. Received is said at once, with when to expect an
 * answer (D-037: a stopped class the same school day; otherwise within one school day). Read under the table's own
 * row security, so nobody else's report can appear here.
 */
export default async function LaporanSaya({ searchParams }: { searchParams: Promise<{ hasil?: string }> }) {
  const q = await searchParams;
  const locale = await currentLocale();
  const s = (k: HleEvent) => t(k, "staff", { locale });
  const [daftar, peran] = await Promise.all([laporanSaya(), peranSaya()]);
  const { kind, kembali } = cangkangStaf(peran);

  return (
    <>
      <CangkangPengalaman locale={locale} kind={kind} halamanKini="lapor" />
      <main className="pin-col">
        <Link className="pin-back" href={kembali}>← {s("lapor.kembali")}</Link>
        <div className="pin-head">
          <p className="pin-eyebrow">{s("lapor.eyebrow")}</p>
          <h1 className="pin-h1">{s("lapor.saya.judul")}</h1>
          <p className="pin-intro">{s("lapor.saya.arti")}</p>
        </div>
        {q.hasil === "diterima" ? <BarisHasil nada="ok">{s("lapor.diterima")}</BarisHasil> : null}
        {daftar.length === 0 ? (
          <p className="pin-empty">{s("lapor.saya.kosong")}</p>
        ) : (
          <ul className="pin-lapor-daftar">
            {daftar.map((l) => (
              <li key={l.id} className="pin-lapor-satu">
                <p>
                  <strong>{s(kunciStatusLaporan(l.status))}</strong> · {format.date(l.dibuat, locale)} · {kataHalaman(l.halaman, locale)}
                  {l.hentikanKelas ? <> · {s("lapor.hentikan.singkat")}</> : null}
                </p>
                <p className="pin-meta">{l.terjadi}</p>
                <p className="pin-lapor-langkah">
                  {s("lapor.langkah")} {l.langkah ?? s(l.hentikanKelas ? "lapor.langkah.awal_kelas" : "lapor.langkah.awal")}
                </p>
              </li>
            ))}
          </ul>
        )}
        <KakiPintar />
      </main>
    </>
  );
}
