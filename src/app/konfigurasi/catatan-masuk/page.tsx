import Link from "next/link";
import { format, t, type HleEvent } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import { supabaseServer } from "@/lib/supabase/server";
import { konteksHalaman } from "@/lib/konteks-server";
import { judulHalaman } from "@/lib/judul-halaman";
import { tanggal } from "@/lib/tanggal";
import { zonaSekolahBanyak } from "@/lib/zona-sekolah";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import KakiPintar from "@/components/KakiPintar";
import HalamanPenolakan from "@/components/HalamanPenolakan";
import Kosong from "@/components/Kosong";
import Ikon from "@/components/Ikon";
import TanggalDenganGema from "@/components/bentuk/TanggalDenganGema";
import { HalamanKoleksi } from "@/components/koleksi/Koleksi";
import { halamanKoleksi, kueriDiminta } from "@/components/koleksi/aturan";
import {
  CARA_MASUK, JENIS_AKUNTABILITAS, UKURAN_AKUNTABILITAS, ditolakMembaca, kunciCara, kunciHasil, kunciJenis, rujukanCetakDari,
  type BarisAkuntabilitas, type JenisAkuntabilitas,
} from "@/lib/akuntabilitas-kontrak";

export const generateMetadata = judulHalaman("/konfigurasi/catatan-masuk");
export const dynamic = "force-dynamic";

type Sp = { cari?: string; jenis?: string; dari?: string; sampai?: string; hal?: string };
const TANGGAL = /^\d{4}-\d{2}-\d{2}$/;

/**
 * B1 «CATATAN MASUK DAN CETAK» (docs/completion-4.1/batches/B1-COMPLETION.md, «Screens and states»; THE PLAN §5.1 F):
 * beside «Jejak audit» in Konfigurasi, the school's answer to "who signed in, who failed to, who printed this" for twelve
 * months. Read only: no export, no delete, no print of its own.
 *
 * The database's own reader (akuntabilitas_baca) decides who reads what: a school's administrator, the rows whose
 * school snapshot holds the working context's school; the platform administrator, every row (in «Seluruh platform»,
 * those with no school too), and the network origin theirs alone. A page of 50, the newest first, filtered by kind,
 * by a person or a print reference typed in the one search, and by a date range on the school's clock.
 *
 * States: refused (not an administrator); empty («recorded since»); no match; a print reference that is not (or no
 * longer) there, with its own sentence; a page of rows. Each row: when (the school's zone; a row with no school in WIB,
 * the word printed), who (the name, or «pengenal tidak dikenal»), what, how, and the outcome in the sign-in screen's own
 * words. Below 640 px every row stacks, each cell under its own label (the Collection's frame, experience.css).
 */
export default async function CatatanMasuk({ searchParams }: { searchParams: Promise<Sp> }) {
  const sp = await searchParams;
  const locale = await currentLocale();
  const s = (k: HleEvent) => t(k, "staff", { locale });
  const supabase = await supabaseServer();
  const { data: sistem } = await supabase.rpc("is_system_admin");
  const adminSistem = sistem === true;
  const kh = await konteksHalaman();
  const lama = kh === "TANPA_KONTEKS";
  const platformIni = adminSistem && (lama || kh?.platform === true);
  const sekolahIni = !lama && kh && !kh.platform ? kh.tempat : null;

  const cari = kueriDiminta(sp.cari).slice(0, 80);
  const jenis = (JENIS_AKUNTABILITAS as readonly string[]).includes(sp.jenis ?? "") ? (sp.jenis as JenisAkuntabilitas) : null;
  const dari = sp.dari && TANGGAL.test(sp.dari) ? sp.dari : "";
  const sampai = sp.sampai && TANGGAL.test(sp.sampai) ? sp.sampai : "";
  const hal = halamanKoleksi(sp.hal);
  const lingkup = platformIni ? null : sekolahIni;
  const [baca, sejak] = !platformIni && !sekolahIni
    ? [{ data: null, error: { code: "PR200", details: "ACCOUNTABILITY_NOT_ALLOWED" } }, { data: null }]
    : await Promise.all([
        supabase.rpc("akuntabilitas_baca", { p_sekolah: lingkup, p_jenis: jenis, p_cari: cari || null, p_dari: dari || null,
          p_sampai: sampai || null, p_halaman: hal, p_ukuran: UKURAN_AKUNTABILITAS }),
        supabase.rpc("akuntabilitas_sejak", { p_sekolah: lingkup }),
      ]);
  if (baca.error && ditolakMembaca(baca.error as { code?: string; details?: string })) {
    return <HalamanPenolakan messageKey="akuntabilitas.ditolak" persona="staff" locale={locale} backHref="/konfigurasi" backKey="nav.konfigurasi" />;
  }
  const semua = (Array.isArray(baca.data) ? baca.data : []) as BarisAkuntabilitas[];
  const baris = semua.slice(0, UKURAN_AKUNTABILITAS);
  const lagi = semua.length > UKURAN_AKUNTABILITAS;
  const zonaSekolah = await zonaSekolahBanyak(supabase, [lingkup, ...baris.map((b) => b.institution_ids[0] ?? null)]);
  // the school's clock: the context's school, or the row's first school in «Seluruh platform»; WIB when there is none
  const zonaBaris = (b: BarisAkuntabilitas) => zonaSekolah(lingkup ?? b.institution_ids[0] ?? null);
  const sejakKata = typeof sejak.data === "string" ? tanggal(sejak.data, "baca", locale, zonaSekolah(lingkup)) : "";
  const rujukan = rujukanCetakDari(cari);
  const tersaring = Boolean(cari || jenis || dari || sampai);

  const tautan = (n: number) => {
    const q = new URLSearchParams();
    if (cari) q.set("cari", cari);
    if (jenis) q.set("jenis", jenis);
    if (dari) q.set("dari", dari);
    if (sampai) q.set("sampai", sampai);
    if (n > 1) q.set("hal", String(n));
    const qs = q.toString();
    return `/konfigurasi/catatan-masuk${qs ? `?${qs}` : ""}#catatan`;
  };
  const kataJenis = (b: BarisAkuntabilitas) => (JENIS_AKUNTABILITAS.includes(b.kind) ? s(kunciJenis(b.kind)) : "—");
  const kataCara = (b: BarisAkuntabilitas) => (b.method && CARA_MASUK.includes(b.method) ? s(kunciCara(b.method)) : "");
  const kataHasil = (b: BarisAkuntabilitas) => {
    const k = kunciHasil(b.outcome);
    const kata = t(k, "staff", { locale });
    return kata && kata !== "—" ? kata : s("akuntabilitas.hasil.layanan_tidak_tersedia");
  };
  const siapa = (b: BarisAkuntabilitas) => (b.person_id ? (b.nama ?? b.pintar_id ?? s("akuntabilitas.tidak_dikenal")) : s("akuntabilitas.tidak_dikenal"));
  const kolomAsal = platformIni || adminSistem;
  // B1-R2 (Daisy): the platform's view names each row's school or schools, a line under the name; a school's admin
  // reads only their own school's rows and is shown no second line
  const idSekolah = platformIni ? [...new Set(baris.flatMap((b) => b.institution_ids))] : [];
  const { data: namaSek } = idSekolah.length
    ? await supabase.from("institutions").select("id, name").in("id", idSekolah)
    : { data: [] as Array<{ id: string; name: string }> };
  const namaSekolah = new Map(((namaSek ?? []) as Array<{ id: string; name: string }>).map((x) => [x.id, x.name]));
  const sekolahBaris = (b: BarisAkuntabilitas) => (b.institution_ids.length
    ? b.institution_ids.map((i) => namaSekolah.get(i) ?? "—").join(", ") : s("akuntabilitas.tanpa_sekolah"));
  // B1-R4 (Sharon's change 6; Daisy): the platform's view only; its own narrow read; absent when it cannot be read
  const ringkas = platformIni ? await supabase.rpc("akuntabilitas_gagal_ringkas") : { data: null, error: null };
  const gagalTulis = !ringkas.error ? (ringkas.data as { n?: unknown; terakhir?: unknown } | null) : null;
  const tidakLengkap = gagalTulis && typeof gagalTulis.n === "number" && gagalTulis.n > 0 && typeof gagalTulis.terakhir === "string"
    ? { n: gagalTulis.n, terakhir: gagalTulis.terakhir } : null;

  return (
    <>
      <CangkangPengalaman locale={locale} kind="pendataan" />
      <main id="isi" tabIndex={-1} className="pin-col">
        <Link className="pin-back" href="/konfigurasi/audit">← {s("config.section.audit")}</Link>
        <div className="pin-head">
          <p className="pin-eyebrow">{s("nav.konfigurasi")}</p>
          <h1 className="pin-h1">{s("akuntabilitas.judul")}</h1>
          <p className="pin-intro">{s("akuntabilitas.arti")}</p>
        </div>

        {tidakLengkap ? (
          <p className="pin-banner pin-attention" role="status" data-akuntabilitas-tidak-lengkap={tidakLengkap.n}>
            {s("akuntabilitas.tidak_lengkap").replace("{n}", format.number(tidakLengkap.n, locale)).replace("{waktu}", tanggal(tidakLengkap.terakhir, "cap", locale))}{" "}
            <Link href="/konfigurasi?periksa=skema">{s("akuntabilitas.tidak_lengkap.tautan")}</Link>
          </p>
        ) : null}
        <form method="get" action="/konfigurasi/catatan-masuk" className="pin-akuntabilitas-saring" aria-label={s("akuntabilitas.saring.judul")} data-akuntabilitas-saring="">
          <label className="pin-bidang">
            <span className="pin-bidang-label">{s("akuntabilitas.cari.label")}</span>
            <span className="pin-cari">
              <Ikon nama="search" />
              <input className="pin-input" type="search" name="cari" defaultValue={cari} autoComplete="off" maxLength={80}
                placeholder={s("akuntabilitas.cari.placeholder")} />
            </span>
          </label>
          <label className="pin-bidang">
            <span className="pin-bidang-label">{s("akuntabilitas.saring.jenis")}</span>
            <span className="pin-pilih">
              <select className="pin-input" name="jenis" defaultValue={jenis ?? ""}>
                <option value="">{s("akuntabilitas.saring.semua")}</option>
                {JENIS_AKUNTABILITAS.map((j) => <option key={j} value={j}>{s(kunciJenis(j))}</option>)}
              </select>
              <Ikon nama="chevron-down" />
            </span>
          </label>
          {/* RV-16: a native date field says its date under it, in words (TanggalDenganGema) */}
          <div className="pin-bidang">
            <label htmlFor="akuntabilitas-dari" className="pin-bidang-label">{s("akuntabilitas.saring.dari")}</label>
            <TanggalDenganGema id="akuntabilitas-dari" name="dari" defaultValue={dari} kosong={s("akuntabilitas.saring.tanpa_tanggal")} locale={locale} zona={zonaSekolah(lingkup)} />
          </div>
          <div className="pin-bidang">
            <label htmlFor="akuntabilitas-sampai" className="pin-bidang-label">{s("akuntabilitas.saring.sampai")}</label>
            <TanggalDenganGema id="akuntabilitas-sampai" name="sampai" defaultValue={sampai} kosong={s("akuntabilitas.saring.tanpa_tanggal")} locale={locale} zona={zonaSekolah(lingkup)} />
          </div>
          <div className="pin-actions">
            <button type="submit" className="pin-btn pin-primary">{s("akuntabilitas.saring.tombol")}</button>
            {tersaring ? <Link className="pin-btn" href="/konfigurasi/catatan-masuk">{s("akuntabilitas.saring.hapus")}</Link> : null}
          </div>
        </form>

        {baca.error ? (
          <p className="pin-banner pin-attention" role="status" data-akuntabilitas-gagal="">{s("akuntabilitas.gagal")}</p>
        ) : baris.length === 0 && hal === 1 ? (
          rujukan
            // B1-R5: the filter's own «Hapus saringan» is the one way back; the empty state adds none
            ? <Kosong jenis="tidak_cocok" kalimat={s("akuntabilitas.rujukan_hilang").replace("{tanggal}", sejakKata)} />
            : tersaring
              ? <Kosong jenis="tidak_cocok" kalimat={s("akuntabilitas.tidak_cocok")} />
              : <Kosong jenis="belum" kalimat={s("akuntabilitas.kosong").replace("{tanggal}", sejakKata)} />
        ) : (
          <div className="pin-koleksi pin-akuntabilitas">
            <div className="pin-tabel-bingkai" id="catatan" role="region" tabIndex={0} aria-label={s("akuntabilitas.judul")}>
              <table className="pin-tabel" data-akuntabilitas="">
                <caption className="pin-sr">{s("akuntabilitas.keterangan")}</caption>
                <thead>
                  <tr>
                    <th scope="col">{s("akuntabilitas.kolom.waktu")}</th>
                    <th scope="col">{s("akuntabilitas.kolom.orang")}</th>
                    <th scope="col">{s("akuntabilitas.kolom.apa")}</th>
                    <th scope="col">{s("akuntabilitas.kolom.cara")}</th>
                    <th scope="col">{s("akuntabilitas.kolom.hasil")}</th>
                    {kolomAsal ? <th scope="col">{s("akuntabilitas.kolom.asal")}</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {baris.map((b) => (
                    <tr key={b.id} data-akuntabilitas-baris={b.kind}>
                      <th scope="row" className="pin-tabel-nama" data-label={s("akuntabilitas.kolom.waktu")}>{tanggal(b.at, "cap", locale, zonaBaris(b))}</th>
                      <td data-label={s("akuntabilitas.kolom.orang")} data-akuntabilitas-orang="">{siapa(b)}
                        {platformIni ? <><br /><span className="pin-meta" data-akuntabilitas-sekolah="">{sekolahBaris(b)}</span></> : null}</td>
                      <td data-label={s("akuntabilitas.kolom.apa")}>{kataJenis(b)}{b.print_ref
                        ? <span className="pin-meta pin-num" data-rujukan-cetak={b.print_ref}> · {s("akuntabilitas.rujukan").replace("{ref}", b.print_ref)}</span> : null}</td>
                      <td data-label={s("akuntabilitas.kolom.cara")}>{kataCara(b)}</td>
                      <td data-label={s("akuntabilitas.kolom.hasil")} data-akuntabilitas-hasil={b.outcome}>{b.kind === "SIGN_IN_FAILED" ? kataHasil(b) : s("akuntabilitas.hasil.ok")}</td>
                      {kolomAsal ? <td data-label={s("akuntabilitas.kolom.asal")} className="pin-num">{b.network_origin ?? ""}</td> : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <HalamanKoleksi posisi={{ halaman: hal, lagi, dari: (hal - 1) * UKURAN_AKUNTABILITAS + (baris.length ? 1 : 0), sampai: (hal - 1) * UKURAN_AKUNTABILITAS + baris.length }}
              benda={s("akuntabilitas.benda")} ke={tautan} locale={locale} />
          </div>
        )}
        <KakiPintar />
      </main>
    </>
  );
}
