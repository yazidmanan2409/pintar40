import Link from "next/link";
import { t, type HleEvent } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import { supabaseServer } from "@/lib/supabase/server";
import { sekolahPendataan } from "@/lib/pendataan";
import { konteksHalaman } from "@/lib/konteks-server";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import KakiPintar from "@/components/KakiPintar";
import HalamanPenolakan from "@/components/HalamanPenolakan";
import BarisHasil from "@/components/BarisHasil";
import BidangTeks from "@/components/bentuk/BidangTeks";
import Kosong from "@/components/Kosong";
import Koleksi from "@/components/koleksi/Koleksi";
import { halamanKoleksi, kueriDiminta, posisiHalaman } from "@/components/koleksi/aturan";
import { UKURAN } from "@/components/koleksi/halaman";
import FormKoreksiEmail from "@/components/aktivasi/FormKoreksiEmail";
import { judulHalaman } from "@/lib/judul-halaman";
import { koreksiNamaAksi, koreksiUsernameAksi } from "./actions";

export const generateMetadata = judulHalaman("/aktivasi/orang");
export const dynamic = "force-dynamic";

type Orang = {
  person_id: string; display_name: string; institutional_id: string | null; institution_name: string | null;
  email: string; username: string | null; activated: boolean; boleh_email: boolean; boleh_identitas: boolean; total: number;
};
type Sp = { cari?: string; hal?: string; pilih?: string; bagian?: string; hasil?: string; kode?: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * W2.1, W2.2, W2.3 (Batch 4, D-152; CR-13, CR-14, CR-15 per F-8; J2.4, J2.17, J2.21): «KOREKSI DATA ORANG».
 *
 * The people with an email account the reader may correct, as Daisy's Collection (Table, Search, Pagination): the
 * database's own list (orang_berakun) of the working context's school, or every school's in «Seluruh platform»; a
 * page of 20 with the total. «Koreksi» on a row opens that person's panel below the table, offering only what the
 * database will accept from this reader: the email (the school admin before activation, the platform admin always;
 * /api/akun/email), the name and the username (the platform admin only; correct_person_name, correct_username). Every
 * correction asks for a reason and is audited by the database; nothing here decides.
 */
export default async function KoreksiOrang({ searchParams }: { searchParams: Promise<Sp> }) {
  const sp = await searchParams;
  const locale = await currentLocale();
  const s = (k: HleEvent) => t(k, "staff", { locale });
  const supabase = await supabaseServer();
  const { data: sistem } = await supabase.rpc("is_system_admin");
  const adminSistem = sistem === true;
  // L3 (D-132): the working context's school, or every school's in «Seluruh platform» (as Aktivasi)
  const kh = await konteksHalaman();
  const lama = kh === "TANPA_KONTEKS";
  const platformIni = lama ? adminSistem : kh?.platform === true && adminSistem;
  const sekolahIni = !lama && kh && !kh.platform ? kh.tempat : null;
  const sekolah = adminSistem ? [] : await sekolahPendataan();
  if (!adminSistem && sekolah.length === 0) {
    return <HalamanPenolakan messageKey="aktivasi.ditolak" persona="staff" locale={locale} backHref="/" backKey="galat.beranda" />;
  }

  const cari = kueriDiminta(sp.cari);
  const hal = halamanKoleksi(sp.hal);
  const { data } = await supabase.rpc("orang_berakun", {
    p_cari: cari || null, p_offset: (hal - 1) * UKURAN, p_limit: UKURAN, p_sekolah: platformIni ? null : sekolahIni,
  });
  const orang = (Array.isArray(data) ? data : []) as Orang[];
  const total = orang[0] ? Number(orang[0].total) : 0;
  const posisi = posisiHalaman(total, hal, UKURAN);
  const pilih = sp.pilih && UUID.test(sp.pilih) ? sp.pilih : null;
  // the chosen person, read again by id so the panel never trusts the address alone
  const { data: dipilihData } = pilih
    ? await supabase.rpc("orang_berakun", { p_cari: pilih, p_offset: 0, p_limit: 1, p_sekolah: platformIni ? null : sekolahIni })
    : { data: null };
  const dipilih = pilih
    ? (orang.find((o) => o.person_id === pilih)
      ?? ((Array.isArray(dipilihData) ? dipilihData : []) as Orang[]).find((o) => o.person_id === pilih)
      ?? null)
    : null;
  const tautanPilih = (id: string) => {
    const q = new URLSearchParams({ pilih: id });
    if (cari) q.set("cari", cari);
    if (hal > 1) q.set("hal", String(hal));
    return `/aktivasi/orang?${q.toString()}#koreksi`;
  };
  const hasilDi = (bagian: string) => sp.bagian === bagian && (sp.hasil === "ok" || sp.hasil === "gagal")
    ? <BarisHasil nada={sp.hasil === "ok" ? "ok" : "gagal"}>
        {sp.hasil === "ok" ? s(`orang.${bagian}.ok` as HleEvent) : kataGagal(s, bagian, sp.kode)}
      </BarisHasil>
    : null;
  const identitas = dipilih?.boleh_identitas && platformIni;

  return (
    <>
      <CangkangPengalaman locale={locale} kind="pendataan" current="aktivasi" />
      <main id="isi" tabIndex={-1} className="pin-col">
        <Link className="pin-back" href="/aktivasi">← {s("aktivasi.judul")}</Link>
        <div className="pin-head">
          <p className="pin-eyebrow">{s("aktivasi.eyebrow")}</p>
          <h1 className="pin-h1">{s("orang.judul")}</h1>
          <p className="pin-intro">{s(platformIni ? "orang.intro.platform" : "orang.intro.sekolah")}</p>
        </div>
        <Koleksi
          id="pin-orang"
          nama={s("orang.judul")}
          benda={s("orang.benda")}
          kolom={[
            { judul: s("orang.kolom.nama") },
            { judul: s("orang.kolom.id"), prioritas: "rendah" },
            { judul: s("orang.kolom.email") },
            { judul: s("orang.kolom.username"), prioritas: "rendah" },
            { judul: s("orang.kolom.keadaan") },
            { judul: s("orang.kolom.tindakan"), sempit: true, tersembunyi: true },
          ]}
          baris={orang.map((o) => ({
            kunci: o.person_id,
            nama: o.display_name,
            sel: [
              <span key="i" className="pin-num">{o.institutional_id ?? "—"}</span>,
              <span key="e" className="pin-num">{o.email}</span>,
              <span key="u" className="pin-num">{o.username ?? "—"}</span>,
              <span key="k" className={o.activated ? "pin-pill pin-ok" : "pin-pill pin-neutral"}>{s(o.activated ? "orang.aktif" : "orang.belum_aktif")}</span>,
              (o.boleh_email || (o.boleh_identitas && platformIni))
                ? <Link key="t" className="pin-tautan" href={tautanPilih(o.person_id)} data-koreksi-orang={o.person_id}>{s("orang.koreksi")}</Link>
                : <span key="t" className="pin-meta">—</span>,
            ],
          }))}
          posisi={posisi}
          totalSemua={total}
          kosong={<Kosong jenis="belum" kalimat={s("orang.kosong")} />}
          jalan="/aktivasi/orang"
          cari={cari}
          placeholder={s("orang.cari")}
          locale={locale}
        />

        {dipilih ? (
          <section className="pin-sec" id="koreksi" aria-labelledby="pin-koreksi-judul" data-orang={dipilih.person_id}>
            <h2 id="pin-koreksi-judul">{s("orang.panel")} · {dipilih.display_name}</h2>
            <p className="pin-meta">{dipilih.institution_name ?? "—"} · {s(dipilih.activated ? "orang.aktif" : "orang.belum_aktif")}</p>
            {dipilih.boleh_email ? (
              <FormKoreksiEmail locale={locale} orang={dipilih.person_id} sekarang={dipilih.email} />
            ) : (
              <p className="pin-meta">{s("orang.email.hanya_platform")}</p>
            )}
            {identitas ? (
              <>
                <form action={koreksiNamaAksi} className="pin-koreksi" data-koreksi="nama">
                  <h3 className="pin-koreksi-judul">{s("orang.nama.judul")}</h3>
                  <p className="pin-meta">{s("orang.nama.arti")}</p>
                  <input type="hidden" name="orang" value={dipilih.person_id} />
                  <BidangTeks id="koreksi-nama" name="nilai" required maxLength={200} label={s("orang.nama.baru")} defaultValue={dipilih.display_name} />
                  <BidangTeks id="koreksi-nama-alasan" name="alasan" required maxLength={500} label={s("orang.alasan")} petunjuk={s("orang.alasan.arti")} />
                  <span className="pin-actions"><button type="submit" className="pin-btn pin-primary">{s("orang.nama.tombol")}</button></span>
                  {hasilDi("nama")}
                </form>
                <form action={koreksiUsernameAksi} className="pin-koreksi" data-koreksi="username">
                  <h3 className="pin-koreksi-judul">{s("orang.username.judul")}</h3>
                  <p className="pin-meta">{s("orang.username.arti")}</p>
                  <input type="hidden" name="orang" value={dipilih.person_id} />
                  <BidangTeks id="koreksi-username" name="nilai" required maxLength={20} autoComplete="off" spellCheck={false}
                    label={s("orang.username.baru")} petunjuk={s("orang.username.aturan")} defaultValue={dipilih.username ?? ""} />
                  <BidangTeks id="koreksi-username-alasan" name="alasan" required maxLength={500} label={s("orang.alasan")} petunjuk={s("orang.alasan.arti")} />
                  <span className="pin-actions"><button type="submit" className="pin-btn pin-primary">{s("orang.username.tombol")}</button></span>
                  {hasilDi("username")}
                </form>
              </>
            ) : (
              <p className="pin-meta">{s("orang.identitas.hanya_platform")}</p>
            )}
          </section>
        ) : null}
        <KakiPintar />
      </main>
    </>
  );
}

/** A refusal's sentence: the username's own rule words where it is one, else the correction's. */
function kataGagal(s: (k: HleEvent) => string, bagian: string, kode: string | undefined): string {
  const k = kode && /^[A-Z_]+$/.test(kode) ? kode : "LAYANAN_TIDAK_TERSEDIA";
  if (bagian === "username" && k.startsWith("USERNAME_")) return s(`aktifkan.kode.${k}` as HleEvent);
  const dikenal = ["DITOLAK", "REASON_REQUIRED", "IDENTITY_NOT_FOUND", "NAME_INVALID", "NAME_UNCHANGED", "PERMINTAAN_TIDAK_SAH"];
  return s(`orang.gagal.${dikenal.includes(k) ? k : "LAYANAN_TIDAK_TERSEDIA"}` as HleEvent);
}
