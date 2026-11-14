import Link from "next/link";
import { t, format, type HleEvent } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import * as ajar from "@/lib/pengajar";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import KakiPintar from "@/components/KakiPintar";
import HalamanPenolakan from "@/components/HalamanPenolakan";
import Kosong from "@/components/Kosong";
import Koleksi from "@/components/koleksi/Koleksi";
import { halamanKoleksi, kueriDiminta, saringDiminta, susunKoleksi } from "@/components/koleksi/aturan";
import { BarisLingkup, kalimatJumlahOrang } from "@/components/bukti";
import { adaBuktiSoal, kataAnggota } from "@/lib/mengajar";
import { AMBANG_NILAI_KELAS, type KeadaanHasil } from "@/lib/hasil-ujicepat";
import { judulHalaman } from "@/lib/judul-halaman";
import { judulAsesmen } from "@/lib/judul-asesmen";
import { zonaSekolah } from "@/lib/zona-sekolah";
import { supabaseServer } from "@/lib/supabase/server";
import { jam, kataZona } from "@/lib/tanggal";

export const generateMetadata = judulHalaman("/mengajar/[kelas]/uji-cepat/hasil");

export const dynamic = "force-dynamic";

/** The three states, in the words and badges «Siapa yang sudah mengumpulkan» uses (Daisy, J2Kelas). */
const KEADAAN: Record<KeadaanHasil, { kunci: HleEvent; badge: string }> = {
  sudah: { kunci: "mengajar.siapa.sudah", badge: "pin-pill pin-ok" },
  sedang: { kunci: "mengajar.siapa.sedang", badge: "pin-pill pin-info" },
  belum: { kunci: "mengajar.siapa.belum", badge: "pin-pill pin-neutral" },
};
const URUTAN_KEADAAN = ["sudah", "sedang", "belum"] as const;
const UKURAN = 50;

/**
 * W2.4 (CR-27, J5.6) — THE UJI CEPAT SCORE: THE CLASS FIRST, THE LEARNERS ONE STEP BELOW (D-120 Q8).
 *
 * Owner's ruling: both, on the teacher's Uji Cepat result only. Daisy's grammar (11-validation.md §3): the class
 * figure in `t-stat` with its base («18 dari 31»), and the learners in a Table one step below it. Nothing else is
 * composed here: no chart, no ranking, no colour for a score.
 *
 * A READ, NO NEW PATH. Each score is the learner's official result as the catalogue gives this teacher
 * (`learner.result`; the figure the learner was told). What the evaluator does not give is «Belum ada nilai», never a
 * number, and is not in the class figure; with no score at all there is an Empty state, never a zero
 * (src/lib/hasil-ujicepat.ts). Never on a learner's surface, never a certificate (D-082(d)).
 *
 * Only this class's own Uji Cepat: anything else is the ordinary refusal page.
 */
export default async function HasilUjiCepat({
  params,
  searchParams,
}: {
  params: Promise<{ kelas: string }>;
  searchParams: Promise<{ penugasan?: string; cari?: string | string[]; saring?: string | string[]; saring_tadi?: string | string[]; hal?: string | string[] }>;
}) {
  const { kelas: id } = await params;
  const sp = await searchParams;
  const locale = await currentLocale();
  const s = (k: HleEvent) => t(k, "educator", { locale });
  const n = (x: number) => format.number(x, locale);

  const ctx = await ajar.kelas(id);
  const baca = ctx && sp.penugasan ? await ajar.hasilUjiCepat(id, ctx.ini.institusi, sp.penugasan) : null;
  if (!ctx || !baca) {
    return <HalamanPenolakan locale={locale} persona="educator" backHref={ctx ? `/mengajar/${id}/uji-cepat` : "/mengajar"}
      backKey={ctx ? "mengajar.cepat.judul" : "mengajar.kembali"} />;
  }
  const { tugas, hasil } = baca;
  // the owner's ruling (10 Nov): named by when it opened on the class's school's clock
  const supabase = await supabaseServer();
  const [zona, { data: masihData }] = await Promise.all([
    zonaSekolah(supabase, ctx.ini.institusi),
    // A2a (DITUTUP §2): the assignment's sittings still running on their shifted time after its own close
    supabase.rpc("penugasan_masih_dikerjakan", { p_aa: tugas.id }),
  ]);
  const masih = masihData && typeof masihData === "object" ? (masihData as { murid: number; sampai: string | null }) : null;
  const benda = s(kataAnggota("mengajar.bukti.murid", ctx.ini.jenis));
  const isi = (k: HleEvent, ganti: Record<string, string>) =>
    Object.entries(ganti).reduce((a, [kunci, v]) => a.split(`{${kunci}}`).join(v), s(k));

  const cari = kueriDiminta(sp.cari);
  const saring = saringDiminta(sp.saring, URUTAN_KEADAAN, sp.saring_tadi);
  const halaman = susunKoleksi(hasil.murid, {
    nama: (m) => m.nama,
    kelompok: (m) => m.keadaan,
    kueri: cari,
    saring,
    halaman: halamanKoleksi(sp.hal),
    ukuran: UKURAN,
  });

  return (
    <>
      <CangkangPengalaman locale={locale} kind="pengajar" current="kelas" />
      <main id="isi" tabIndex={-1} className="pin-col">
        <Link className="pin-back" href={`/mengajar/${id}/uji-cepat`}>← {s("mengajar.cepat.hasil.kembali")}</Link>
        <BarisLingkup
          scope={{ institution: ctx.konteks.institusi?.nama ?? null, path: [ctx.ini.nama], period: ctx.konteks.periode }}
          locale={locale}
        />
        <div className="pin-head">
          <p className="pin-eyebrow">{judulAsesmen(tugas, locale, zona)}</p>
          <h1 className="pin-h1">{s("mengajar.cepat.hasil.judul")}</h1>
        </div>
        {/* A2a, Daisy (A2A-DITUTUP-BERJALAN.md §2): closed by its own time while held sittings still run */}
        {masih && masih.murid > 0 && masih.sampai ? (
          <p className="pin-mm" role="status" data-masih-ditahan="">
            {s("mengajar.cepat.hasil.masih_ditahan").replace("{n}", n(masih.murid)).replace("{jam}", jam(masih.sampai, zona)).replace("{zona}", kataZona(zona))}
          </p>
        ) : null}

        {/* THE CLASS FIRST: the figure, and always its base. D-176: the figure needs AMBANG_NILAI_KELAS scores */}
        {hasil.kelas.dinilai === 0 ? (
          <Kosong jenis="belum" kalimat={s("mengajar.cepat.hasil.belum")} />
        ) : hasil.kelas.nilai === null ? (
          <div className="pin-metric pin-cepat-kelas" data-dinilai={hasil.kelas.dinilai} data-terdaftar={hasil.kelas.terdaftar} data-ambang={AMBANG_NILAI_KELAS}>
            <span className="pin-ml">{s("mengajar.cepat.hasil.kelas")}</span>
            <span className="pin-abs">{s("mengajar.cepat.hasil.belum_cukup")}</span>
            <span className="pin-ma">{kalimatJumlahOrang(hasil.kelas.dinilai, AMBANG_NILAI_KELAS, ctx.ini.jenis, locale)}</span>
            <span className="pin-ma">{isi("mengajar.cepat.hasil.muncul", { benda })}</span>
            <span className="pin-mm">
              {isi("mengajar.cepat.hasil.dasar", { n: n(hasil.kelas.dinilai), total: n(hasil.kelas.terdaftar), benda })}
            </span>
          </div>
        ) : (
          <div className="pin-metric pin-cepat-kelas" data-dinilai={hasil.kelas.dinilai} data-terdaftar={hasil.kelas.terdaftar}>
            <span className="pin-ml">{s("mengajar.cepat.hasil.kelas")}</span>
            <span className="pin-mv pin-num">{format.percent(hasil.kelas.nilai, locale)}</span>
            <span className="pin-mm">
              {isi("mengajar.cepat.hasil.dasar", { n: n(hasil.kelas.dinilai), total: n(hasil.kelas.terdaftar), benda })}
            </span>
            <span className="pin-ms">{s("mengajar.cepat.hasil.arti")}</span>
          </div>
        )}

        {/* E-C2-3: offered only where the per-question page answers (adaBuktiSoal; a PD class's is refused) */}
        {adaBuktiSoal(ctx.ini.jenis) ? (
          <div className="pin-actions">
            <Link className="pin-btn" href={`/mengajar/${id}/soal?penugasan=${tugas.id}`}>{s("mengajar.bukti.per_soal")}</Link>
          </div>
        ) : null}

        {/* ONE STEP BELOW: each learner, alphabetical, a list and not a ranking */}
        <section className="pin-sec" aria-labelledby="pin-cepat-rincian">
          <h2 id="pin-cepat-rincian" className="pin-cepat-rincian-judul">{s("mengajar.cepat.hasil.rincian")}</h2>
          <p className="pin-sub">{s("mengajar.cepat.hasil.rincian.arti")}</p>
          <Koleksi
            id="pin-cepat-murid"
            nama={`${s("mengajar.cepat.hasil.rincian")} · ${ctx.ini.nama}`}
            benda={benda}
            kolom={[
              { judul: s("mengajar.cepat.hasil.kolom.nama") },
              { judul: s("mengajar.cepat.hasil.kolom.keadaan") },
              { judul: s("mengajar.cepat.hasil.kolom.nilai"), angka: true },
            ]}
            baris={halaman.isi.map((m) => ({
              kunci: m.id,
              nama: m.nama,
              sel: [
                <span key="k" className={KEADAAN[m.keadaan].badge} data-keadaan={m.keadaan}>{s(KEADAAN[m.keadaan].kunci)}</span>,
                m.nilai === null
                  ? <span key="n" className="pin-cepat-tanpa">{m.keadaan === "sudah" ? s("mengajar.cepat.hasil.nilai_belum") : "—"}</span>
                  : <span key="n" className="pin-num">{format.percent(m.nilai, locale)}</span>,
              ],
            }))}
            posisi={halaman.posisi}
            totalSemua={halaman.totalSemua}
            kosong={<Kosong jenis="belum" kalimat={s(kataAnggota("mengajar.siapa.kosong", ctx.ini.jenis))} />}
            jalan={`/mengajar/${id}/uji-cepat/hasil`}
            tetap={{ penugasan: tugas.id }}
            cari={cari}
            saring={{ nilai: saring, pilihan: URUTAN_KEADAAN.map((k) => ({ nilai: k, label: s(KEADAAN[k].kunci) })) }}
            locale={locale}
            untuk="educator"
          />
        </section>

        <KakiPintar />
      </main>
    </>
  );
}
