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
import { kataAnggota } from "@/lib/mengajar";
import { judulHalaman } from "@/lib/judul-halaman";

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
const KEADAAN: Record<"sudah" | "sedang" | "belum", { kunci: HleEvent; badge: string }> = {
  sudah: { kunci: "mengajar.siapa.sudah", badge: "pin-pill pin-ok" },
  sedang: { kunci: "mengajar.siapa.sedang", badge: "pin-pill pin-info" },
  belum: { kunci: "mengajar.siapa.belum", badge: "pin-pill pin-neutral" },
};
const URUTAN_KEADAAN = ["sudah", "sedang", "belum"] as const;
const UKURAN = 50;

export default async function Siapa({
  params,
  searchParams,
}: {
  params: Promise<{ kelas: string }>;
  searchParams: Promise<{ penugasan?: string; cari?: string | string[]; saring?: string | string[]; saring_tadi?: string | string[]; hal?: string | string[] }>;
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
    return <HalamanPenolakan locale={locale} persona="educator" backHref={`/mengajar/${id}`} backKey="mengajar.kembali" />;
  }

  const { sudah, sedang, belum } = await ajar.siapa(tugasId, fakta.murid);
  // W3.5: one row per learner, in the state the database's sessions give them; alphabetical (susunKoleksi), paged
  const jumlah = { sudah: sudah.length, sedang: sedang.length, belum: belum.length };
  const semuaMurid = [
    ...sudah.map((m) => ({ ...m, keadaan: "sudah" as const })),
    ...sedang.map((m) => ({ ...m, keadaan: "sedang" as const })),
    ...belum.map((m) => ({ ...m, keadaan: "belum" as const })),
  ];
  const cari = kueriDiminta(sp.cari);
  const saring = saringDiminta(sp.saring, URUTAN_KEADAAN, sp.saring_tadi);
  const halaman = susunKoleksi(semuaMurid, {
    nama: (m) => m.nama, kelompok: (m) => m.keadaan, kueri: cari, saring, halaman: halamanKoleksi(sp.hal), ukuran: UKURAN,
  });

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

        {/* W3.5 (Daisy, J2Kelas): one Table, each learner once with their state, filtered by state, never ranked */}
        <section className="pin-sec" aria-labelledby="pin-siapa-daftar" data-siapa-jumlah={`${sudah.length}/${sedang.length}/${belum.length}`}>
          <h2 id="pin-siapa-daftar">{s(kataAnggota("mengajar.bukti.murid", ctx.ini.jenis))}</h2>
          <Koleksi
            id="pin-siapa-murid"
            nama={`${s("mengajar.siapa.judul")} · ${ctx.ini.nama}`}
            benda={s(kataAnggota("mengajar.bukti.murid", ctx.ini.jenis))}
            kolom={[
              { judul: s("mengajar.cepat.hasil.kolom.nama") },
              { judul: s("mengajar.cepat.hasil.kolom.keadaan") },
            ]}
            baris={halaman.isi.map((m) => ({
              kunci: m.id,
              nama: <Link href={`/mengajar/${id}/murid/${m.id}`}>{m.nama}</Link>,
              sel: [<span key="k" className={KEADAAN[m.keadaan].badge} data-keadaan={m.keadaan}>{s(KEADAAN[m.keadaan].kunci)}</span>],
            }))}
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

        <p className="pin-foot">{s("mengajar.cepat.hidup.catatan")}</p>
        <KakiPintar />
      </main>
    </>
  );
}
