import Link from "next/link";
import { format, t, type HleEvent } from "@/lib/hle";
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
import { zonaSekolahBanyak } from "@/lib/zona-sekolah";
import { judulHalaman } from "@/lib/judul-halaman";
import { KODE_CABUT, KODE_GANTI, KEADAAN_SERTIFIKAT, type KeadaanSertifikat, type KodeCabut, type KodeGanti } from "@/lib/sertifikat-cabut-kontrak";
import { kalimatHasil } from "@/lib/galat-kontrak";
import TombolKirim from "@/components/TombolKirim";
import KonfirmasiBahaya from "@/components/KonfirmasiBahaya";
import { putuskanTinjauanAksi } from "@/app/studio/soal-actions";
import { kodeKoreksiDariGalat, kunciKodeKoreksi, KODE_KOREKSI, type KodeKoreksi } from "@/lib/soal-kontrak";

export const generateMetadata = judulHalaman("/konfigurasi/sertifikat");
export const dynamic = "force-dynamic";

type Sertifikat = {
  id: string; certificate_number: string; holder_name: string; institution_id: string; institution_name: string;
  course_title: string; issued_at: string; status: KeadaanSertifikat; revoked_at: string | null; revoked_reason: string | null;
  total: number;
};
type Sp = { cari?: string; hal?: string; pilih?: string; hasil?: string; kode?: string; jenis?: string; tinjau?: string; ref?: string; baris?: string };
type Ditinjau = { tinjauan: string; sertifikat: string; nomor: string; nama: string; paket: string | null; dibuka_pada: string;
  sebelum: number | null; sesudah: number | null; target: number | null; boleh_putuskan: boolean };

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
  // the owner's ruling (10 Nov): each certificate's dates on its issuing school's clock, one read for the schools listed
  const zonaDari = await zonaSekolahBanyak(supabase, [...daftar.map((c) => c.institution_id), dipilih?.institution_id]);
  const gantiKini = sp.jenis === "ganti";
  // C1w (O41-19, Daisy Q6): «Sedang ditinjau ({n})» at the top, only when n > 0, in the public page's own words; each
  // row decided here (putuskan_tinjauan_sertifikat: «Konfirmasi berlaku» or «Cabut», each with a reason, each audited).
  // A certificate confirmed after its recalculation keeps «Dikonfirmasi setelah dihitung ulang · {alasan}» in the list
  const [{ data: ditinjauData }, { data: dikonfirmasiData }] = sekolahIni
    ? await Promise.all([
        supabase.rpc("tinjauan_sertifikat_antrean", { p_institution: sekolahIni }),
        supabase.rpc("tinjauan_sertifikat_dikonfirmasi", { p_institution: sekolahIni }),
      ])
    : [{ data: [] }, { data: [] }];
  const ditinjau = ((ditinjauData ?? []) as Ditinjau[]).filter((r) => r.boleh_putuskan);
  const dikonfirmasi = new Map(((dikonfirmasiData ?? []) as Array<{ sertifikat: string; alasan: string }>).map((r) => [r.sertifikat, r.alasan]));
  const sedangDitinjau = new Set(((ditinjauData ?? []) as Ditinjau[]).map((r) => r.sertifikat));
  const zonaTinjau = zonaDari(sekolahIni);
  const pct = (n: number | null) => (n === null ? "—" : format.percent(n, locale));
  const kodeTinjau: KodeKoreksi = KODE_KOREKSI.includes(sp.kode as KodeKoreksi) ? (sp.kode as KodeKoreksi) : kodeKoreksiDariGalat(null);
  const hasilTinjau = sp.tinjau === "dikonfirmasi" ? s("config.tinjau_sertifikat.ok_konfirmasi")
    : sp.tinjau === "dicabut" ? s("config.tinjau_sertifikat.ok_cabut")
    : sp.tinjau === "gagal" ? s(kunciKodeKoreksi(kodeTinjau)) + (sp.ref && /^[A-Z0-9]{6}$/.test(sp.ref) ? ` ${s("galat.rujukan")}: ${sp.ref}.` : "")
    : null;
  const digantikan = dipilih?.status === "SUPERSEDED";

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
        {hasilTinjau && ditinjau.length === 0 ? <BarisHasil nada={sp.tinjau === "gagal" ? "gagal" : "ok"}>{hasilTinjau}</BarisHasil> : null}
        {ditinjau.length > 0 ? (
          <section className="pin-sec pin-sertifikat-ditinjau" id="ditinjau" aria-labelledby="pin-ditinjau-judul" data-sertifikat-ditinjau={ditinjau.length}>
            <h2 id="pin-ditinjau-judul">{s("config.tinjau_sertifikat.judul").replace("{n}", format.number(ditinjau.length, locale))}</h2>
            <p className="pin-sub">{s("config.tinjau_sertifikat.arti")}</p>
            {hasilTinjau ? <BarisHasil nada={sp.tinjau === "gagal" ? "gagal" : "ok"}>{hasilTinjau}</BarisHasil> : null}
            <ul className="pin-daftar">
              {ditinjau.map((r) => (
                <li key={r.tinjauan} className="pin-panel" data-tinjauan={r.tinjauan}>
                  <p className="pin-judul-baris">
                    {s("config.tinjau_sertifikat.baris").replace("{nama}", r.nama).replace("{paket}", r.paket ?? "—")
                      .replace("{asli}", pct(r.sebelum)).replace("{baru}", pct(r.sesudah)).replace("{t}", pct(r.target))
                      .replace("{tanggal}", tanggal(r.dibuka_pada, "baca", locale, zonaTinjau))}
                  </p>
                  <p className="pin-meta pin-num">{r.nomor}</p>
                  <form action={putuskanTinjauanAksi} className="pin-formulir" id={`tinjau-${r.tinjauan}`}>
                    <input type="hidden" name="tinjauan" value={r.tinjauan} />
                    <input type="hidden" name="sertifikat" value={r.sertifikat} />
                    <div className="pin-bidang">
                      <label htmlFor={`tinjau-alasan-${r.tinjauan}`} className="pin-bidang-label">{s("config.tinjau_sertifikat.alasan")}</label>
                      <p className="pin-hint" id={`tinjau-arti-${r.tinjauan}`}>{s("config.tinjau_sertifikat.alasan.arti")}</p>
                      <textarea id={`tinjau-alasan-${r.tinjauan}`} name="alasan" className="pin-input pin-alasan-isian" required minLength={10} maxLength={300}
                        aria-describedby={`tinjau-arti-${r.tinjauan}`} />
                    </div>
                    <div className="pin-actions">
                      <TombolKirim className="pin-btn pin-primary" sibuk={s("tombol.memproses")} name="keputusan" value="CONFIRMED">
                        {s("config.tinjau_sertifikat.konfirmasi")}<span className="pin-sr"> · {r.nomor}</span>
                      </TombolKirim>
                      <KonfirmasiBahaya id={`cabut-${r.tinjauan}`} tombol={s("config.tinjau_sertifikat.cabut")}
                        tanya={s("config.tinjau_sertifikat.cabut.tanya").replace("{nomor}", r.nomor)}
                        ya={s("config.tinjau_sertifikat.cabut")} batal={s("sertifikat.cabut.batal")} sibuk={s("tombol.memproses")}
                        nama="keputusan" nilai="REVOKED" />
                    </div>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
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
              <span key="t">{tanggal(c.issued_at, "baca", locale, zonaDari(c.institution_id))}</span>,
              <span key="e">
                <span className={sedangDitinjau.has(c.id) && c.status === "ISSUED" ? "pin-pill pin-neutral" : nada(c.status)}>
                  {sedangDitinjau.has(c.id) && c.status === "ISSUED" ? s("verifikasi.status.DITINJAU") : keadaan(c.status)}
                </span>
                {dikonfirmasi.has(c.id) ? <span className="pin-meta" data-dikonfirmasi-ulang=""> {s("config.tinjau_sertifikat.dikonfirmasi").replace("{alasan}", dikonfirmasi.get(c.id)!)}</span> : null}
              </span>,
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
              <div><dt>{s("sertifikat.kelola.kolom.terbit")}</dt><dd>{tanggal(dipilih.issued_at, "baca", locale, zonaDari(dipilih.institution_id))}</dd></div>
              <div><dt>{s("sertifikat.kelola.kolom.keadaan")}</dt><dd className={nada(dipilih.status)}>{keadaan(dipilih.status)}</dd></div>
            </dl>
            {dipilih.status === "ISSUED" ? (
              <>
                <FormCabut locale={locale} id={dipilih.id} nomor={dipilih.certificate_number} />
                {ganti ? <FormTerbitUlang locale={locale} id={dipilih.id} pratinjau={ganti} /> : null}
              </>
            ) : digantikan && ganti?.pengganti ? (
              <p className="pin-meta" data-digantikan-oleh={ganti.pengganti.id}>
                {s("sertifikat.ganti.digantikan_oleh").replace("{nomor}", ganti.pengganti.nomor)}
              </p>
            ) : dipilih.status === "REVOKED" ? (
              <p className="pin-meta" data-sudah-dicabut="">
                {s("sertifikat.cabut.dicabut_pada").replace("{tanggal}", dipilih.revoked_at ? tanggal(dipilih.revoked_at, "cap", locale, zonaDari(dipilih.institution_id)) : "—")}
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
