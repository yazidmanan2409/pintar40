import Link from "next/link";
import { t, format, hariIniSekolah, batasHari, type HleEvent } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import { supabaseServer } from "@/lib/supabase/server";
import { konteksHalaman } from "@/lib/konteks-server";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import KakiPintar from "@/components/KakiPintar";
import HalamanPenolakan from "@/components/HalamanPenolakan";
import BarisHasil from "@/components/BarisHasil";
import Kosong from "@/components/Kosong";
import TombolKirim from "@/components/TombolKirim";
import TanggalDenganGema from "@/components/bentuk/TanggalDenganGema";
import { tanggal } from "@/lib/tanggal";
import { judulHalaman } from "@/lib/judul-halaman";
import { KATEGORI_AKHIR, PERAN_SEKOLAH, kodeStafDari, kodeStafDariGalat, kunciTanggungJawab, type KodeStaf } from "@/lib/staf-kontrak";
import { akhiriTugasAksi, ubahPeranAksi } from "./actions";

export const generateMetadata = judulHalaman("/konfigurasi/staf");
export const dynamic = "force-dynamic";

type Peran = { id: string; role: string; tempat_id: string; tempat: string; jenis_tempat: string; sampai: string; tanggung_jawab: string[] };
type Orang = { person_id: string; nama: string | null; sidik: string; peran: Peran[] };
type Tj = { tj: string; tempat: string };
type Tinjau = { tetap: Tj[]; dapat: Tj[]; hilang: Tj[]; antrean: Array<{ tempat: string; menunggu: number }>; butuh_konfirmasi_admin: boolean };
type Sp = {
  orang?: string; tinjau?: string; cabut?: string | string[]; tambah_peran?: string; tambah_tempat?: string; tambah_sampai?: string;
  alasan?: string; jenis?: string; hasil?: string; kode?: string;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HARI = /^\d{4}-\d{2}-\d{2}$/;

/**
 * E5 «Akhiri tugas di sekolah ini» and §11 «Ubah peran & tanggung jawab» (owner, 9 Nov), on ONE PERSON'S PAGE, as the
 * design asks: find the person → their roles and responsibilities → change → review → confirm.
 *
 * READ, THEN REVIEW, THEN ONE COMMITMENT. The roles and their responsibilities are peran_orang's (role_capabilities plus
 * the management-decision rule, never a list kept here). «Tinjau perubahan» is a GET render: the choices travel in the
 * address and ubah_peran answers with apply = false, writing nothing: what is gained, kept and lost, each with its
 * place; what a school never gives; the decisions that would wait with no one to decide them (warned, never
 * reassigned); and the second press for Admin sekolah. «Konfirmasi perubahan» is the only write, and it carries the
 * review's fingerprint, so a review made stale by someone else's change is refused. «Akhiri tugas di sekolah ini» ends
 * every role here with a category, a date and a reason (akhiri_tugas_staf).
 */
export default async function StafSekolah({ searchParams }: { searchParams: Promise<Sp> }) {
  const sp = await searchParams;
  const locale = await currentLocale();
  const s = (k: HleEvent) => t(k, "staff", { locale });
  const kh = await konteksHalaman();
  const sekolah = kh && kh !== "TANPA_KONTEKS" && !kh.platform ? kh.tempat : null;
  const orangId = sp.orang && UUID.test(sp.orang) ? sp.orang : null;
  const tolak = (k: HleEvent) => <HalamanPenolakan messageKey={k} persona="staff" locale={locale} backHref="/konfigurasi/roles" backKey="nav.konfigurasi" />;
  if (!sekolah) return tolak("staf.tidak_ada_sekolah");
  if (!orangId) return tolak("sertifikat.kelola.ditolak");

  const supabase = await supabaseServer();
  const { data: orangData, error } = await supabase.rpc("peran_orang", { p_person: orangId, p_institution: sekolah });
  if (error || !orangData) return tolak("sertifikat.kelola.ditolak");
  const orang = orangData as Orang;
  const { data: tempatData } = await supabase.from("org_nodes").select("id, name, kind")
    .eq("institution_id", sekolah).eq("is_active", true).order("kind").order("name");
  const tempat = (tempatData ?? []) as Array<{ id: string; name: string; kind: string }>;

  // the review: the choices in the address, answered by the database with apply = false
  const cabut = (Array.isArray(sp.cabut) ? sp.cabut : sp.cabut ? [sp.cabut] : []).filter((x) => UUID.test(x));
  const tambahPeran = (PERAN_SEKOLAH as readonly string[]).includes(sp.tambah_peran ?? "") ? sp.tambah_peran! : "";
  const tambahTempat = sp.tambah_tempat && UUID.test(sp.tambah_tempat) ? sp.tambah_tempat : "";
  const tambahSampai = sp.tambah_sampai && HARI.test(sp.tambah_sampai) ? sp.tambah_sampai : "";
  const alasan = (sp.alasan ?? "").slice(0, 300);
  let tinjau: Tinjau | null = null;
  let kodeTinjau: KodeStaf | null = null;
  if (sp.tinjau === "1") {
    const tambah = tambahPeran && tambahTempat && tambahSampai
      ? [{ role: tambahPeran, scope_node_id: tambahTempat, valid_until: batasHari(tambahSampai, "akhir") }] : [];
    const { data, error: e } = await supabase.rpc("ubah_peran", {
      p_person: orangId, p_institution: sekolah, p_tambah: tambah, p_cabut: cabut, p_alasan: alasan,
      p_sidik: orang.sidik, p_konfirmasi_admin: true, p_terapkan: false,
    });
    if (e) kodeTinjau = kodeStafDariGalat(e); else tinjau = data as Tinjau;
  }
  const kode = kodeStafDari(sp.kode);
  const hasil = (jenis: "ubah" | "akhiri") => sp.jenis === jenis && (sp.hasil === "ok" || sp.hasil === "gagal")
    ? <BarisHasil nada={sp.hasil === "ok" ? "ok" : "gagal"}>
        {sp.hasil === "ok" ? s(jenis === "ubah" ? "staf.ubah.ok" : "staf.akhiri.ok") : s(`staf.galat.${(kode ?? "STAFF_FAILED").toLowerCase()}` as HleEvent)}
      </BarisHasil>
    : null;
  const peranKata = (r: string) => s(`role.${r}` as HleEvent);
  const daftarTj = (xs: Tj[], data: string) => xs.length === 0
    ? <p className="pin-meta">{s("staf.ubah.tidak_ada")}</p>
    : <ul className="pin-staf-tj" data-tj={data}>{xs.map((x) => <li key={`${x.tj}-${x.tempat}`}>{s(kunciTanggungJawab(x.tj))} · {x.tempat}</li>)}</ul>;
  const hariIni = hariIniSekolah();

  return (
    <>
      <CangkangPengalaman locale={locale} kind="pendataan" />
      <main id="isi" tabIndex={-1} className="pin-col">
        <Link className="pin-back" href="/konfigurasi/roles">← {s("config.section.roles")}</Link>
        <div className="pin-head">
          <p className="pin-eyebrow">{s("staf.judul")}</p>
          <h1 className="pin-h1">{orang.nama ?? "—"}</h1>
          <p className="pin-intro">{s("staf.intro")}</p>
        </div>

        <section className="pin-sec" aria-labelledby="staf-kini">
          <h2 id="staf-kini">{s("staf.peran_kini")}</h2>
          {orang.peran.length === 0 ? <Kosong jenis="belum" kalimat={s("staf.kosong")} /> : (
            <ul className="pin-list" data-peran-orang={orang.peran.length}>
              {orang.peran.map((p) => (
                <li key={p.id} className="pin-row pin-staf-peran" data-peran={p.id}>
                  <span className="pin-title">{peranKata(p.role)}</span>
                  <span className="pin-rowmeta">
                    <span>{s("staf.tempat")}: {p.tempat}</span>
                    <span>{s("staf.sampai")} {tanggal(p.sampai, "hari", locale)}</span>
                  </span>
                  <span className="pin-meta">{s("staf.tj")}: {p.tanggung_jawab.map((x) => s(kunciTanggungJawab(x))).join(", ")}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="pin-sec" id="ubah" aria-labelledby="staf-ubah">
          <h2 id="staf-ubah">{s("staf.ubah.judul")}</h2>
          <p className="pin-sub">{s("staf.ubah.arti")}</p>
          {hasil("ubah")}
          <form method="get" action="/konfigurasi/staf" className="pin-ulang pin-staf-form" data-staf-ubah="">
            <input type="hidden" name="orang" value={orangId} />
            <input type="hidden" name="tinjau" value="1" />
            {orang.peran.length > 0 ? (
              <fieldset>
                <legend>{s("staf.ubah.lepas")}</legend>
                <ul>
                  {orang.peran.map((p) => (
                    <li key={p.id}>
                      <label className="pin-cepat-centang">
                        <input type="checkbox" name="cabut" value={p.id} defaultChecked={cabut.includes(p.id)} />
                        <span>{peranKata(p.role)} · {p.tempat}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </fieldset>
            ) : null}
            <fieldset>
              <legend>{s("staf.ubah.tambah")}</legend>
              <div className="pin-isian">
                <label htmlFor="staf-tambah-peran">{s("staf.ubah.tambah")}</label>
                <select id="staf-tambah-peran" name="tambah_peran" className="pin-input" defaultValue={tambahPeran}>
                  <option value="">{s("staf.ubah.tambah_tidak")}</option>
                  {PERAN_SEKOLAH.map((r) => <option key={r} value={r}>{peranKata(r)}</option>)}
                </select>
              </div>
              <div className="pin-isian">
                <label htmlFor="staf-tambah-tempat">{s("staf.tempat")}</label>
                <select id="staf-tambah-tempat" name="tambah_tempat" className="pin-input" defaultValue={tambahTempat}>
                  {tempat.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
              </div>
              <div className="pin-isian">
                <label htmlFor="staf-tambah-sampai">{s("staf.sampai")}</label>
                <TanggalDenganGema jenis="date" id="staf-tambah-sampai" name="tambah_sampai" className="pin-input" defaultValue={tambahSampai || undefined} min={hariIni} locale={locale} />
              </div>
            </fieldset>
            <div className="pin-isian">
              <label htmlFor="staf-ubah-alasan">{s("staf.ubah.alasan")}</label>
              <textarea id="staf-ubah-alasan" name="alasan" className="pin-input" rows={3} minLength={10} maxLength={300} required
                defaultValue={alasan} aria-describedby="staf-ubah-alasan-arti" />
              <p id="staf-ubah-alasan-arti" className="pin-hint">{s("staf.ubah.alasan_arti")}</p>
            </div>
            <button type="submit" className="pin-btn">{s("staf.ubah.tinjau")}</button>
          </form>

          {kodeTinjau ? <BarisHasil nada="gagal">{s(`staf.galat.${kodeTinjau.toLowerCase()}` as HleEvent)}</BarisHasil> : null}
          {tinjau ? (
            <div className="pin-koreksi pin-staf-tinjau" data-staf-tinjau="">
              <h3>{s("staf.ubah.tinjau_judul")}</h3>
              <h4>{s("staf.ubah.dapat")}</h4>{daftarTj(tinjau.dapat, "dapat")}
              <h4>{s("staf.ubah.tetap")}</h4>{daftarTj(tinjau.tetap, "tetap")}
              <h4>{s("staf.ubah.hilang")}</h4>{daftarTj(tinjau.hilang, "hilang")}
              <p className="pin-meta">{s("staf.ubah.tidak_diberikan")}</p>
              {tinjau.antrean.length > 0 ? (
                <div className="pin-banner pin-info" role="status" data-staf-antrean={tinjau.antrean.length}>
                  <h4>{s("staf.ubah.antrean")}</h4>
                  <p>{s("staf.ubah.antrean_arti")}</p>
                  <ul>{tinjau.antrean.map((a) => <li key={a.tempat}>{a.tempat}: {format.number(a.menunggu, locale)} {s("staf.ubah.menunggu")}</li>)}</ul>
                </div>
              ) : null}
              <form action={ubahPeranAksi} data-staf-terapkan="">
                <input type="hidden" name="orang" value={orangId} />
                <input type="hidden" name="sekolah" value={sekolah} />
                <input type="hidden" name="sidik" value={orang.sidik} />
                <input type="hidden" name="alasan" value={alasan} />
                {cabut.map((c) => <input key={c} type="hidden" name="cabut" value={c} />)}
                <input type="hidden" name="tambah_peran" value={tambahPeran} />
                <input type="hidden" name="tambah_tempat" value={tambahTempat} />
                <input type="hidden" name="tambah_sampai" value={tambahSampai} />
                {tinjau.butuh_konfirmasi_admin ? (
                  <label className="pin-cepat-centang">
                    <input type="checkbox" name="konfirmasi_admin" value="ya" required />
                    <span>{s("staf.ubah.konfirmasi_admin")}</span>
                  </label>
                ) : null}
                <div className="pin-actions">
                  <TombolKirim className="pin-btn pin-primary" sibuk={s("tombol.memproses")}>{s("staf.ubah.terapkan")}</TombolKirim>
                  <Link className="pin-btn" href={`/konfigurasi/staf?orang=${orangId}#ubah`}>{s("staf.ubah.batal")}</Link>
                </div>
              </form>
            </div>
          ) : null}
        </section>

        {orang.peran.length > 0 ? (
          <section className="pin-sec" id="akhiri" aria-labelledby="staf-akhiri">
            <h2 id="staf-akhiri">{s("staf.akhiri.judul")}</h2>
            <p className="pin-sub">{s("staf.akhiri.arti")}</p>
            {hasil("akhiri")}
            <form action={akhiriTugasAksi} className="pin-staf-form" data-staf-akhiri="">
              <input type="hidden" name="orang" value={orangId} />
              <input type="hidden" name="sekolah" value={sekolah} />
              <div className="pin-isian">
                <label htmlFor="staf-akhiri-kategori">{s("staf.akhiri.kategori")}</label>
                <select id="staf-akhiri-kategori" name="kategori" className="pin-input" required defaultValue="">
                  <option value="" disabled>—</option>
                  {KATEGORI_AKHIR.map((k) => <option key={k} value={k}>{s(`staf.kategori.${k.toLowerCase()}` as HleEvent)}</option>)}
                </select>
              </div>
              <div className="pin-isian">
                <label htmlFor="staf-akhiri-tanggal">{s("staf.akhiri.tanggal")}</label>
                <TanggalDenganGema jenis="date" id="staf-akhiri-tanggal" name="tanggal" className="pin-input" required defaultValue={hariIni} max={hariIni} locale={locale} />
              </div>
              <div className="pin-isian">
                <label htmlFor="staf-akhiri-alasan">{s("staf.akhiri.alasan")}</label>
                <textarea id="staf-akhiri-alasan" name="alasan" className="pin-input" rows={3} minLength={10} maxLength={300} required aria-describedby="staf-akhiri-alasan-arti" />
                <p id="staf-akhiri-alasan-arti" className="pin-hint">{s("staf.ubah.alasan_arti")}</p>
              </div>
              <div className="pin-actions">
                <TombolKirim className="pin-btn pin-bahaya" sibuk={s("tombol.memproses")}>{s("staf.akhiri.tombol")}</TombolKirim>
              </div>
            </form>
          </section>
        ) : null}
        <KakiPintar />
      </main>
    </>
  );
}
