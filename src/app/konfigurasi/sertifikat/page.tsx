import Link from "next/link";
import { t, type HleEvent } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import { supabaseServer } from "@/lib/supabase/server";
import { konteksHalaman } from "@/lib/konteks-server";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import KakiPintar from "@/components/KakiPintar";
import HalamanPenolakan from "@/components/HalamanPenolakan";
import BarisHasil from "@/components/BarisHasil";
import Kosong from "@/components/Kosong";
import Koleksi from "@/components/koleksi/Koleksi";
import { halamanKoleksi, kueriDiminta, posisiHalaman } from "@/components/koleksi/aturan";
import { UKURAN } from "@/components/koleksi/halaman";
import FormCabut from "@/components/sertifikat/FormCabut";
import FormTerbitUlang, { type PratinjauGanti } from "@/components/sertifikat/FormTerbitUlang";
import { tanggal } from "@/lib/tanggal";
import { judulHalaman } from "@/lib/judul-halaman";
import { KODE_CABUT, KODE_GANTI, KEADAAN_SERTIFIKAT, type KeadaanSertifikat, type KodeCabut, type KodeGanti } from "@/lib/sertifikat-cabut-kontrak";
import { kalimatHasil } from "@/lib/galat-kontrak";

export const generateMetadata = judulHalaman("/konfigurasi/sertifikat");
export const dynamic = "force-dynamic";

type Sertifikat = {
  id: string; certificate_number: string; holder_name: string; institution_id: string; institution_name: string;
  course_title: string; issued_at: string; status: KeadaanSertifikat; revoked_at: string | null; revoked_reason: string | null;
  total: number;
};
type Sp = { cari?: string; hal?: string; pilih?: string; hasil?: string; kode?: string; jenis?: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * W2.5 (Batch 5; CR-05, ADM-18, J8.5): «SERTIFIKAT SEKOLAH». The school admin finds a certificate their school issued
 * and revokes it, on a screen, with a reason.
 *
 * The list is Daisy's Collection (Table, Search, Pagination): the database's own read, sertifikat_sekolah, of the
 * working context's school (every school's in «Seluruh platform», for Admin platform only), searched by number or
 * holder name, a page of 20 with the total. «Cabut» on an issued certificate opens its panel below the table: the
 * certificate's facts, then the reason and the in-page confirmation (FormCabut). The act is revoke_certificate's, with
 * the reader's own client: it refuses anyone without CAN_PUBLISH in that school, wants a reason, keeps the first
 * revocation, and writes certificate.revoked to the audit log. The public check then says «Dicabut oleh penerbit».
 * Nothing here decides.
 */
export default async function SertifikatSekolah({ searchParams }: { searchParams: Promise<Sp> }) {
  const sp = await searchParams;
  const locale = await currentLocale();
  const s = (k: HleEvent) => t(k, "staff", { locale });
  const supabase = await supabaseServer();
  const { data: sistem } = await supabase.rpc("is_system_admin");
  const adminSistem = sistem === true;
  // L3 (D-132): the working context's school, or every school's in «Seluruh platform» for Admin platform
  const kh = await konteksHalaman();
  const lama = kh === "TANPA_KONTEKS";
  const platformIni = adminSistem && (lama || kh?.platform === true);
  const sekolahIni = !lama && kh && !kh.platform ? kh.tempat : null;

  const cari = kueriDiminta(sp.cari);
  const hal = halamanKoleksi(sp.hal);
  const lingkup = platformIni ? null : sekolahIni;
  const { data, error } = !platformIni && !sekolahIni
    ? { data: null, error: { code: "42501" } }
    : await supabase.rpc("sertifikat_sekolah", { p_sekolah: lingkup, p_cari: cari || null, p_hal: hal, p_id: null });
  if (error) {
    return <HalamanPenolakan messageKey="sertifikat.kelola.ditolak" persona="staff" locale={locale} backHref="/konfigurasi" backKey="nav.konfigurasi" />;
  }
  const daftar = (Array.isArray(data) ? data : []) as Sertifikat[];
  const total = daftar[0] ? Number(daftar[0].total) : 0;
  const posisi = posisiHalaman(total, hal, UKURAN);
  // the chosen certificate, read again by id under the same rule, so the panel never trusts the address alone
  const pilih = sp.pilih && UUID.test(sp.pilih) ? sp.pilih : null;
  const { data: dipilihData } = pilih
    ? await supabase.rpc("sertifikat_sekolah", { p_sekolah: lingkup, p_cari: null, p_hal: 1, p_id: pilih })
    : { data: null };
  const dipilih = ((Array.isArray(dipilihData) ? dipilihData : []) as Sertifikat[]).find((c) => c.id === pilih) ?? null;
  // W2.22: what a replacement would carry beside what was sealed, and the replacement already sealed (the database's read)
  const { data: gantiData } = dipilih && dipilih.status !== "REVOKED"
    ? await supabase.rpc("sertifikat_koreksi_pratinjau", { p_certificate: dipilih.id })
    : { data: null };
  const ganti = (gantiData ?? null) as PratinjauGanti | null;
  const gantiKini = sp.jenis === "ganti";

  const tautanPilih = (id: string) => {
    const q = new URLSearchParams({ pilih: id });
    if (cari) q.set("cari", cari);
    if (hal > 1) q.set("hal", String(hal));
    return `/konfigurasi/sertifikat?${q.toString()}#cabut`;
  };
  const keadaan = (k: KeadaanSertifikat) => (KEADAAN_SERTIFIKAT.includes(k) ? s(`sertifikat.kelola.keadaan.${k}` as HleEvent) : "—");
  const nada = (k: KeadaanSertifikat) => (k === "ISSUED" ? "pin-pill pin-ok" : k === "REVOKED" ? "pin-pill pin-blocked" : "pin-pill pin-neutral");
  const kode: KodeCabut = KODE_CABUT.includes(sp.kode as KodeCabut) ? (sp.kode as KodeCabut) : "LAYANAN_TIDAK_TERSEDIA";
  const kodeGanti: KodeGanti = KODE_GANTI.includes(sp.kode as KodeGanti) ? (sp.kode as KodeGanti) : "LAYANAN_TIDAK_TERSEDIA";
  const hasil = dipilih && (sp.hasil === "ok" || sp.hasil === "gagal")
    ? <BarisHasil nada={sp.hasil === "ok" ? "ok" : "gagal"}>
        {gantiKini && sp.kode !== "CONTEXT_OTHER_PLACE"
          ? (sp.hasil === "ok"
              ? s("sertifikat.ganti.ok").replace("{nomor}", ganti?.pengganti?.nomor ?? "")
              : s(`sertifikat.ganti.gagal.${kodeGanti.toLowerCase()}` as HleEvent))
          : sp.hasil === "ok"
          ? s("sertifikat.cabut.ok").replace("{nomor}", dipilih.certificate_number)
          // E-K4 / L3: a revocation of another school's certificate, refused in this context, says so (not «service down»)
          : sp.kode === "CONTEXT_OTHER_PLACE"
            ? kalimatHasil(sp, (k) => s(k), { ok: "config.result.ok", gagal: "config.result.failed" })
            : s(`sertifikat.cabut.gagal.${kode}` as HleEvent)}
      </BarisHasil>
    : null;

  return (
    <>
      <CangkangPengalaman locale={locale} kind="pendataan" halamanKini="sertifikat" />
      <main id="isi" tabIndex={-1} className="pin-col">
        <Link className="pin-back" href="/konfigurasi">← {s("nav.konfigurasi")}</Link>
        <div className="pin-head">
          <p className="pin-eyebrow">{s("nav.konfigurasi")}</p>
          <h1 className="pin-h1">{s("sertifikat.kelola.judul")}</h1>
          <p className="pin-intro">{s(platformIni ? "sertifikat.kelola.intro.platform" : "sertifikat.kelola.intro")}</p>
        </div>
        <Koleksi
          id="pin-sertifikat"
          nama={s("sertifikat.kelola.judul")}
          benda={s("sertifikat.kelola.benda")}
          kolom={[
            { judul: s("sertifikat.kelola.kolom.pemegang") },
            { judul: s("sertifikat.kelola.kolom.nomor") },
            ...(platformIni ? [{ judul: s("sertifikat.kelola.kolom.sekolah"), prioritas: "rendah" as const }] : []),
            { judul: s("sertifikat.kelola.kolom.kursus"), prioritas: "rendah" },
            { judul: s("sertifikat.kelola.kolom.terbit"), prioritas: "rendah" },
            { judul: s("sertifikat.kelola.kolom.keadaan") },
            { judul: s("sertifikat.kelola.kolom.tindakan"), sempit: true, tersembunyi: true },
          ]}
          baris={daftar.map((c) => ({
            kunci: c.id,
            nama: c.holder_name,
            sel: [
              <span key="n" className="pin-num">{c.certificate_number}</span>,
              ...(platformIni ? [<span key="s">{c.institution_name}</span>] : []),
              <span key="k">{c.course_title || "—"}</span>,
              <span key="t">{tanggal(c.issued_at, "baca", locale)}</span>,
              <span key="e" className={nada(c.status)}>{keadaan(c.status)}</span>,
              c.status === "ISSUED"
                ? <Link key="a" className="pin-tautan" href={tautanPilih(c.id)} data-cabut-sertifikat={c.id}>{s("sertifikat.kelola.cabut")}</Link>
                : <span key="a" className="pin-meta">—</span>,
            ],
          }))}
          posisi={posisi}
          totalSemua={total}
          kosong={<Kosong jenis={cari ? "tidak_cocok" : "belum"} kalimat={s(cari ? "sertifikat.kelola.tidak_cocok" : "sertifikat.kelola.kosong")} />}
          jalan="/konfigurasi/sertifikat"
          cari={cari}
          placeholder={s("sertifikat.kelola.cari")}
          locale={locale}
        />

        {dipilih ? (
          <section className="pin-sec" id="cabut" aria-labelledby="pin-cabut-judul" data-sertifikat={dipilih.id}>
            <h2 id="pin-cabut-judul">{s("sertifikat.cabut.judul")} · {dipilih.certificate_number}</h2>
            <dl className="pin-facts">
              <div><dt>{s("sertifikat.kelola.kolom.pemegang")}</dt><dd>{dipilih.holder_name}</dd></div>
              <div><dt>{s("sertifikat.kelola.kolom.kursus")}</dt><dd>{dipilih.course_title || "—"}</dd></div>
              <div><dt>{s("sertifikat.kelola.kolom.sekolah")}</dt><dd>{dipilih.institution_name}</dd></div>
              <div><dt>{s("sertifikat.kelola.kolom.terbit")}</dt><dd>{tanggal(dipilih.issued_at, "baca", locale)}</dd></div>
              <div><dt>{s("sertifikat.kelola.kolom.keadaan")}</dt><dd className={nada(dipilih.status)}>{keadaan(dipilih.status)}</dd></div>
            </dl>
            {dipilih.status === "ISSUED" ? (
              <>
                <FormCabut locale={locale} id={dipilih.id} nomor={dipilih.certificate_number} />
                {ganti ? <FormTerbitUlang locale={locale} id={dipilih.id} pratinjau={ganti} /> : null}
              </>
            ) : dipilih.status === "SUPERSEDED" && ganti?.pengganti ? (
              <p className="pin-meta" data-digantikan-oleh={ganti.pengganti.id}>
                {s("sertifikat.ganti.digantikan_oleh").replace("{nomor}", ganti.pengganti.nomor)}
              </p>
            ) : dipilih.status === "REVOKED" ? (
              <p className="pin-meta" data-sudah-dicabut="">
                {s("sertifikat.cabut.dicabut_pada").replace("{tanggal}", dipilih.revoked_at ? tanggal(dipilih.revoked_at, "cap", locale) : "—")}
                {" "}{s("sertifikat.cabut.alasan_tercatat")} {dipilih.revoked_reason ?? "—"}
              </p>
            ) : (
              <p className="pin-meta">{s("sertifikat.cabut.digantikan")}</p>
            )}
            {hasil}
          </section>
        ) : null}
        <KakiPintar />
      </main>
    </>
  );
}
