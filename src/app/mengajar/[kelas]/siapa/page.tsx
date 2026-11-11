import Link from "next/link";
import { t, format, type HleEvent } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import * as ajar from "@/lib/pengajar";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import KakiPintar from "@/components/KakiPintar";
import HalamanPenolakan from "@/components/HalamanPenolakan";
import { BarisLingkup } from "@/components/bukti";
import Kosong from "@/components/Kosong";
import Koleksi from "@/components/koleksi/Koleksi";
import { halamanKoleksi, kueriDiminta, saringDiminta, susunKoleksi } from "@/components/koleksi/aturan";
import { adaBuktiSoal, kataAnggota } from "@/lib/mengajar";
import { judulHalaman } from "@/lib/judul-halaman";
import type { ReactNode } from "react";
import BarisHasil from "@/components/BarisHasil";
import AturPengerjaan from "@/components/mengajar/AturPengerjaan";
import { daftarPengerjaan, instrumenSaudara } from "@/lib/pengerjaan";
import { kodePengerjaanDari, tindakanUntuk, type BarisPengerjaan } from "@/lib/pengerjaan-kontrak";
import TandaTautan from "@/components/TandaTautan";
import { isi, lencanaA1, metaBaris, waktuSekolah } from "@/lib/pengerjaan-tampil";
import type { BarisKoleksi } from "@/components/koleksi/Koleksi";
import { supabaseServer } from "@/lib/supabase/server";
import { zonaSekolah } from "@/lib/zona-sekolah";

export const generateMetadata = judulHalaman("/mengajar/[kelas]/siapa");

export const dynamic = "force-dynamic";

/**
 * WHO HAS SUBMITTED — three lists of names, and nothing else.
 *
 * OBSERVATION IS NOT JUDGMENT, and this is the page where the difference is
 * easiest to lose. Everything the design could have reached for here — a red
 * dot, a percentage, a rank, the word "tertinggal", the stragglers floated to
 * the top — would be PINTAR telling a teacher something about a child that it
 * does not know. It knows a session reached SUBMITTED or it did not. It does
 * not know whether the child was ill, whether the tablet failed, or whether
 * they simply have not opened PINTAR today, and the note under the lists says
 * exactly that.
 *
 * So there are three headings and three alphabetical lists: submitted, started
 * and not submitted, not started (EDU-J23, EDU-J24; the states «Lihat bukti»
 * counts, W8). No colour, no order but the alphabet, no reason, and nothing
 * attached to any single name.
 *
 * W3.5 (Batch 4, D-152; Daisy, J2Kelas): THE ROSTER AS A TABLE. Daisy's J2Kelas composes these three states as one
 * Collection: each learner once, alphabetical, the name opening their record (M4), the state in the Badge and words
 * «Lihat bukti» counts under (the same three as before, never a score, a rank or a reason), a search, and a filter
 * that shows one state at a time with its count; the empty row says nobody is in that state, not that the class is
 * empty. The pager keeps the total. The same Badges as the Uji Cepat result's learners (Batch 3).
 *
 * THE NAMES ARE BOUNDED BY THE DATABASE, THE SESSIONS ARE NOT.
 * `persons_select` runs through `person_visible_to_me()`, whose educator branch
 * is subtree containment — so a learner outside this reader's grants never
 * arrives. `assessment_sessions_select` is institution-wide
 * (`can_in_institution('CAN_ASSIGN_LEARNING', …)`), and the query is narrowed to
 * this one assignment. The safety here comes from the roster, not from the
 * session read, and no copy on this page claims the other way round.
 */
/** The three states, in the words «Lihat bukti» counts under and the Badges of Daisy's J2Kelas (as the Uji Cepat result's). */
const KEADAAN: Record<"sudah" | "sedang" | "belum" | "ditahan" | "dinilai" | "tidak_dihitung" | "waktu_habis", { kunci: HleEvent; badge: string }> = {
  sudah: { kunci: "mengajar.siapa.sudah", badge: "pin-pill pin-ok" },
  sedang: { kunci: "mengajar.siapa.sedang", badge: "pin-pill pin-info" },
  belum: { kunci: "mengajar.siapa.belum", badge: "pin-pill pin-neutral" },
  // A1 (Daisy, TINJAUAN-A1-C1W Q4): what a sitting's own ending or hold adds to those three, each neutral. A held
  // sitting is «Ditahan»: the teacher is told it waits for them, never why.
  ditahan: { kunci: "atur.keadaan.ditahan", badge: "pin-pill pin-neutral" },
  dinilai: { kunci: "atur.keadaan.dinilai", badge: "pin-pill pin-neutral" },
  tidak_dihitung: { kunci: "atur.keadaan.tidak_dihitung", badge: "pin-pill pin-neutral" },
  waktu_habis: { kunci: "atur.keadaan.waktu_habis", badge: "pin-pill pin-neutral" },
};
const HASIL_ATUR: Record<string, HleEvent> = {
  waktu: "atur.waktu.ok", dinilai: "atur.akhiri.ok_nilai", tidak_dihitung: "atur.akhiri.ok_tidak", diminta: "atur.minta.ok", dilanjutkan: "atur.lanjut.ok",
};

/**
 * A1: a row of the Table with what the teacher's list adds to it: under the name, the sitting's own line (since when
 * and how long is left, when it was handed in or ended, the request for another attempt), and one quiet «Atur» link
 * where an act applies. Never a score, never an order.
 */
function denganAtur(baris: BarisKoleksi, meta: string[], atur: ReactNode | null, ada: boolean): BarisKoleksi {
  if (!ada) return baris;
  return {
    kunci: baris.kunci,
    // the link sits under the name, in the column that stays in view when a narrow screen scrolls the table sideways
    nama: <>{baris.nama}{meta.map((m, i) => <span key={i} className="pin-meta pin-atur-meta" data-atur-meta="">{m}</span>)}{atur ? <span className="pin-atur-meta">{atur}</span> : null}</>,
    sel: baris.sel,
  };
}
const URUTAN_KEADAAN = ["sudah", "sedang", "belum"] as const;
const UKURAN = 50;

export default async function Siapa({
  params,
  searchParams,
}: {
  params: Promise<{ kelas: string }>;
  searchParams: Promise<{ penugasan?: string; cari?: string | string[]; saring?: string | string[]; saring_tadi?: string | string[]; hal?: string | string[];
    sesi?: string; tindakan?: string; kode?: string; hasil?: string; untuk?: string; n?: string }>;
}) {
  const { kelas: id } = await params;
  const sp = await searchParams;
  const tugasId = sp.penugasan;
  const locale = await currentLocale();
  const s = (k: HleEvent) => t(k, "educator", { locale });

  const ctx = await ajar.kelas(id);
  if (!ctx || !tugasId) {
    return <HalamanPenolakan locale={locale} persona="educator" backHref="/mengajar" backKey="mengajar.kembali" />;
  }

  const [fakta, semua] = await Promise.all([
    ajar.faktaKelas(id),
    ajar.berjalan([id], ["OPEN", "CLOSED"]),
  ]);
  const ini = semua.find((b) => b.id === tugasId);
  if (!ini) {
    return <HalamanPenolakan locale={locale} persona="educator" backHref={`/mengajar/${id}`} backLabel={ctx.ini.nama} />;
  }

  const { sudah, sedang, belum } = await ajar.siapa(tugasId, fakta.murid);
  // A1: the teacher's list for this class and instrument, where the database gives it to this reader (a
  // professional-learning class has none, so it shows no «Atur»); and the lesson's other instrument, to move between
  const [a1, saudara, zona] = await Promise.all([
    adaBuktiSoal(ctx.ini.jenis) ? daftarPengerjaan(id, tugasId) : Promise.resolve(null),
    instrumenSaudara(tugasId),
    supabaseServer().then((c) => zonaSekolah(c, ctx.ini.institusi)),
  ]);
  const petaA1 = new Map<string, BarisPengerjaan>((a1 ?? []).map((b) => [b.person_id, b]));
  // W3.5: one row per learner, in the state the database's sessions give them; alphabetical (susunKoleksi), paged
  const jumlah = { sudah: sudah.length, sedang: sedang.length, belum: belum.length };
  const semuaMurid = [
    ...sudah.map((m) => ({ ...m, kelompok: "sudah" as const, keadaan: lencanaA1(petaA1.get(m.id)) ?? ("sudah" as const) })),
    ...sedang.map((m) => ({ ...m, kelompok: "sedang" as const, keadaan: lencanaA1(petaA1.get(m.id)) ?? ("sedang" as const) })),
    ...belum.map((m) => ({ ...m, kelompok: "belum" as const, keadaan: lencanaA1(petaA1.get(m.id)) ?? ("belum" as const) })),
  ];
  // A1 (Daisy, missing state 2b): a learner granted one more attempt and not yet started on it is «belum» again
  for (const m of semuaMurid) {
    if (petaA1.get(m.id)?.izin_belum_dipakai && m.kelompok !== "belum") {
      jumlah[m.kelompok] -= 1;
      jumlah.belum += 1;
      Object.assign(m, { kelompok: "belum", keadaan: "belum" });
    }
  }
  const cari = kueriDiminta(sp.cari);
  const saring = saringDiminta(sp.saring, URUTAN_KEADAAN, sp.saring_tadi);
  const halaman = susunKoleksi(semuaMurid, {
    nama: (m) => m.nama, kelompok: (m) => m.kelompok, kueri: cari, saring, halaman: halamanKoleksi(sp.hal), ukuran: UKURAN,
  });
  // A1: the instrument's name, the one panel that is open, and the result line of the act just taken
  const modeIni = saudara.find((x) => x.id === tugasId)?.mode ?? ini.mode;
  const namaInstrumen = modeIni === "PRE_TEST" || modeIni === "POST_TEST" ? s(`jenis.mode.${modeIni}` as HleEvent) : ini.judul;
  const dasar = `/mengajar/${id}/siapa?penugasan=${tugasId}`;
  const dipilih = a1 && sp.sesi ? a1.find((b) => b.sesi_id === sp.sesi) ?? null : null;
  const untuk = a1 && sp.untuk ? a1.find((b) => b.sesi_id === sp.untuk) ?? null : null;
  const kunciHasil = untuk && sp.hasil ? HASIL_ATUR[sp.hasil] : undefined;
  const menitHasil = /^\d{1,3}$/.test(sp.n ?? "") ? Number(sp.n) : 0;

  return (
    <>
      <CangkangPengalaman locale={locale} kind="pengajar" current="kelas" />
      <main id="isi" tabIndex={-1} className="pin-col">
        <Link className="pin-back" href={`/mengajar/${id}`}>← {ctx.ini.nama}</Link>
        <BarisLingkup
          scope={{
            institution: ctx.konteks.institusi?.nama ?? null,
            path: [ctx.ini.nama],
            period: ctx.konteks.periode,
          }}
          locale={locale}
        />
        <div className="pin-head">
          <p className="pin-eyebrow">{ini.judul}</p>
          <h1 className="pin-h1">{s("mengajar.siapa.judul")}</h1>
          <p className="pin-intro">{s("mengajar.siapa.catatan")}</p>
        </div>

        {/* A1 (Daisy, Q4): which instrument. A sitting belongs to the Pemetaan Awal or to the Uji Penguasaan */}
        {saudara.length > 1 ? (
          <nav className="pin-seg pin-seg-tautan" aria-label={s("atur.instrumen")} data-instrumen="">
            {saudara.map((x) => (
              <Link key={x.id} href={`/mengajar/${id}/siapa?penugasan=${x.id}`} aria-current={x.id === tugasId ? "page" : undefined} data-instrumen-mode={x.mode}>
                <span>{s(`jenis.mode.${x.mode}` as HleEvent)}</span>
                <TandaTautan />
              </Link>
            ))}
          </nav>
        ) : null}

        {/* W3.5 (Daisy, J2Kelas): one Table, each learner once with their state, filtered by state, never ranked */}
        <section className="pin-sec" aria-labelledby="pin-siapa-daftar" data-siapa-jumlah={`${sudah.length}/${sedang.length}/${belum.length}`}>
          <h2 id="pin-siapa-daftar">{s(kataAnggota("mengajar.bukti.murid", ctx.ini.jenis))}</h2>
          {kunciHasil && untuk ? (
            <BarisHasil nada="ok" id="pin-siapa-hasil">
              {isi(s(kunciHasil), { nama: untuk.nama, n: menitHasil, waktu: waktuSekolah(untuk.tenggat, zona, locale) })}
            </BarisHasil>
          ) : null}
          <Koleksi
            id="pin-siapa-murid"
            nama={`${s("mengajar.siapa.judul")} · ${ctx.ini.nama}`}
            benda={s(kataAnggota("mengajar.bukti.murid", ctx.ini.jenis))}
            kolom={[
              { judul: s("mengajar.cepat.hasil.kolom.nama") },
              { judul: s("mengajar.cepat.hasil.kolom.keadaan") },
            ]}
            baris={halaman.isi.map((m) => denganAtur({
              kunci: m.id,
              nama: adaBuktiSoal(ctx.ini.jenis) ? <Link href={`/mengajar/${id}/murid/${m.id}`}>{m.nama}</Link> : m.nama,
              sel: [<span key="k" className={KEADAAN[m.keadaan].badge} data-keadaan={m.keadaan}>{s(KEADAAN[m.keadaan].kunci)}</span>],
            }, petaA1.has(m.id) ? metaBaris(petaA1.get(m.id)!, { locale, zona }) : [],
            // one quiet link, and only where an act applies: an act that cannot apply is absent, not disabled
            petaA1.has(m.id) && tindakanUntuk(petaA1.get(m.id)!).length > 0 ? (
              <Link key="a" className="pin-tautan" href={`${dasar}&sesi=${petaA1.get(m.id)!.sesi_id}#atur`} data-atur-buka={petaA1.get(m.id)!.sesi_id ?? ""}>
                {s("atur.buka")}<span className="pin-sr"> · {m.nama}</span>
              </Link>
            ) : null, a1 !== null))}
            posisi={halaman.posisi}
            totalSemua={halaman.totalSemua}
            kosong={<Kosong jenis="belum" kalimat={s(kataAnggota("mengajar.siapa.kosong", ctx.ini.jenis))} />}
            jalan={`/mengajar/${id}/siapa`}
            tetap={{ penugasan: tugasId }}
            cari={cari}
            saring={{
              nilai: saring,
              pilihan: URUTAN_KEADAAN.map((k) => ({ nilai: k, label: `${s(KEADAAN[k].kunci)} · ${format.number(jumlah[k], locale)}` })),
            }}
            locale={locale}
            untuk="educator"
          />
        </section>

        {dipilih ? (
          <AturPengerjaan kelasId={id} penugasan={tugasId} baris={dipilih} instrumen={namaInstrumen} sertifikat={modeIni === "POST_TEST"}
            zona={zona} locale={locale} kode={kodePengerjaanDari(sp.kode)} tindakan={sp.tindakan ?? null} kembali={`${dasar}#pin-siapa-daftar`} />
        ) : null}

        <p className="pin-foot">{s("mengajar.cepat.hidup.catatan")}</p>
        <KakiPintar />
      </main>
    </>
  );
}
