import Link from "next/link";
import { t, type HleEvent } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import { konteksHalaman } from "@/lib/konteks-server";
import { judulHalaman } from "@/lib/judul-halaman";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import KakiPintar from "@/components/KakiPintar";
import HalamanPenolakan from "@/components/HalamanPenolakan";
import DaftarAntrean from "@/components/kesempatan/DaftarAntrean";

export const generateMetadata = judulHalaman("/konfigurasi/kesempatan");
export const dynamic = "force-dynamic";

/**
 * A1 (O41-16) «Permintaan kesempatan tambahan», the approver's queue, at a school admin's address (from «Yang menunggu»
 * on Konfigurasi). The list is src/components/kesempatan/DaftarAntrean.tsx (a head of department reads the same list on
 * their own home); this surface's working-context guard is its layout's.
 */
export default async function Kesempatan({ searchParams }: { searchParams: Promise<{ k_hasil?: string; k_kode?: string; untuk?: string }> }) {
  const sp = await searchParams;
  const locale = await currentLocale();
  const s = (k: HleEvent) => t(k, "staff", { locale });
  const kh = await konteksHalaman();
  const sekolah = kh && kh !== "TANPA_KONTEKS" && !kh.platform ? kh.tempat : null;
  if (!sekolah) {
    return <HalamanPenolakan messageKey="staf.tidak_ada_sekolah" persona="staff" locale={locale} backHref="/konfigurasi" backKey="nav.konfigurasi" />;
  }
  return (
    <>
      <CangkangPengalaman locale={locale} kind="pendataan" />
      <main id="isi" tabIndex={-1} className="pin-col">
        <Link className="pin-back" href="/konfigurasi">← {s("nav.konfigurasi")}</Link>
        <div className="pin-head">
          <h1 className="pin-h1">{s("kesempatan.judul")}</h1>
          <p className="pin-intro">{s("kesempatan.arti")}</p>
        </div>
        <DaftarAntrean tempat="konfigurasi" sekolah={sekolah} locale={locale} hasil={sp.k_hasil} kode={sp.k_kode} untuk={sp.untuk} />
        <KakiPintar />
      </main>
    </>
  );
}
