import Link from "next/link";
import { t, format, type HleEvent } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import * as ajar from "@/lib/pengajar";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import KakiPintar from "@/components/KakiPintar";
import BarisHasil from "@/components/BarisHasil";
import Kosong from "@/components/Kosong";
import HalamanPenolakan from "@/components/HalamanPenolakan";
import { BarisLingkup } from "@/components/bukti";
import PemilihKelas from "@/components/mengajar/PemilihKelas";
import AkhiriPenugasan from "@/components/mengajar/AkhiriPenugasan";
import { kodePenugasanDari } from "@/lib/penugasan-kontrak";
import Koleksi from "@/components/koleksi/Koleksi";
import { halamanKoleksi, kueriDiminta, susunKoleksi } from "@/components/koleksi/aturan";
import { adaBuktiSoal, kataAnggota } from "@/lib/mengajar";
import { alamatCatatan } from "@/lib/pengembangan-kontrak";
import { judulHalaman } from "@/lib/judul-halaman";
import { tanggal } from "@/lib/tanggal";

export const generateMetadata = judulHalaman("/mengajar/[kelas]");

export const dynamic = "force-dynamic";

/**
 * SCREEN B — one class, as a teaching context.
 *
 * THE TITLE NAMES WHAT IS BEING LOOKED AT, NOT WHO OWNS IT. "Anda sedang
 * melihat" over the class name, and an intro that says why this class appears
 * at all: the school assigned this reader to a scope that contains it. PINTAR
 * has no concept of a class belonging to a teacher and this screen does not
 * invent one — which is also the honest thing to say, because the authority
 * behind most of what follows is institution-wide rather than class-bound.
 *
 * MAKING AVAILABLE IS NOT PUBLISHING, said where an educator would ask. An
 * EDUCATOR holds CAN_DRAFT and CAN_ASSIGN_LEARNING and does not hold
 * CAN_PUBLISH; the sentence under the material list says so in the product's
 * own words rather than leaving a teacher to discover it at a refusal.
 *
 * MATERIAL IS LISTED AS THE SCHOOL PUBLISHES IT. The reviewed concept listed
 * chapters with their own availability. PINTAR publishes a `plp_releases` row
 * per COURSE and the chapters are `modules` inside it, so a per-chapter window
 * would be a fact no row carries. The rows are therefore the material the
 * school actually released, with the window the assignment actually holds.
 */
export default async function Kelas({
  params,
  searchParams,
}: {
  params: Promise<{ kelas: string }>;
  searchParams: Promise<{ sedia?: string; cari?: string | string[]; hal?: string | string[]; akhiri?: string; kode?: string; diakhiri?: string }>;
}) {
  const { kelas: id } = await params;
  const sp = await searchParams;
  const { sedia } = sp;
  const locale = await currentLocale();
  const s = (k: HleEvent) => t(k, "educator", { locale });

  const ctx = await ajar.kelas(id);
  if (!ctx) {
    return (
      <HalamanPenolakan
        locale={locale}
        persona="educator"
        backHref="/mengajar"
        backKey="mengajar.kembali"
      />
    );
  }

  const [fakta, tugas, buka, terbit] = await Promise.all([
    ajar.faktaKelas(id),
    ajar.penugasan(id),
    ajar.berjalan([id]),
    ajar.terbitan(ctx.ini.institusi, id),
  ]);
  // W3.5 (Daisy, J2Kelas): the roster searched and paged (alphabetical, 50 a page, the total kept)
  const rosterHalaman = susunKoleksi(fakta.murid, { nama: (m) => m.nama, kueri: kueriDiminta(sp.cari), halaman: halamanKoleksi(sp.hal), ukuran: 50 });

  // W2.21: only an assignment still in force holds the class's place for its release; one ended or withdrawn stays
  // listed as history and its release is offered again («Siap disediakan»)
  const punya = new Set(tugas.filter(ajar.masihBerlaku).map((x) => x.releaseId));
  const diakhiri = tugas.find((x) => x.id === sp.akhiri && x.status === "ACTIVE") ?? null;
  const pratinjau = diakhiri ? await ajar.pratinjauAkhiri(diakhiri.id) : null;
  const aktif = tugas.filter((x) => x.status === "ACTIVE" && !x.berakhir);

  return (
    <>
      <CangkangPengalaman locale={locale} kind="pengajar" current="kelas" />
      <main id="isi" tabIndex={-1} className="pin-col">
        <Link className="pin-back" href="/mengajar">
          ← {s("mengajar.kembali")}
        </Link>
        <BarisLingkup
          scope={{
            institution: ctx.konteks.institusi?.nama ?? null,
            path: [ctx.ini.nama],
            period: ctx.konteks.periode,
          }}
          locale={locale}
        />

        <div className="pin-head">
          <p className="pin-eyebrow">{s("mengajar.melihat")}</p>
          <h1 className="pin-h1">{ctx.ini.nama}</h1>
          <p className="pin-intro">{s("mengajar.kelas.intro")}</p>
        </div>

        <PemilihKelas kelas={ctx.konteks.kelas} terpilih={id} locale={locale} />

        <dl className="pin-facts">
          <div>
            <dt>{s("mengajar.fakta.mapel")}</dt>
            <dd>{fakta.mapel ?? "—"}</dd>
          </div>
          <div>
            <dt>{s(kataAnggota("mengajar.fakta.murid", ctx.ini.jenis))}</dt>
            <dd className="pin-num">{format.number(fakta.murid.length, locale)}</dd>
          </div>
          <div>
            <dt>{s("mengajar.fakta.materi")}</dt>
            <dd>
              {aktif.length > 0
                ? format.number(aktif.length, locale)
                : s("mengajar.fakta.materi.kosong")}
            </dd>
          </div>
        </dl>

        <div className="pin-actions">
          <Link className="pin-btn pin-primary" href={`/mengajar/${id}/siapkan`}>
            {s("mengajar.siap.eyebrow")}
          </Link>
          <Link className="pin-btn" href={`/mengajar/${id}/uji-cepat`}>
            {s("mengajar.aksi.uji_cepat")}
          </Link>
          <Link className="pin-btn" href={`/mengajar/${id}/bukti`}>
            {s("mengajar.aksi.bukti")}
          </Link>
          {/* Readiness A2 (Daisy, 8 Nov): the teacher's own Ringkasan Kelas (CONTOH LAPORAN 2-guru) is reached from the class */}
          {ctx.ini.jenis !== "PARTICIPANT" ? (
            <Link className="pin-btn" href={`/edukator/ringkasan?kelas=${encodeURIComponent(id)}&dari=kelas`}>
              {s("laporan.kelas.judul")}
            </Link>
          ) : null}
          {/* DAISY-34 (D-070(a)): a professional-learning Kelas's record, for its facilitator; the database decides again */}
          {ctx.ini.jenis === "PARTICIPANT" ? (
            <Link className="pin-btn" href={alamatCatatan(id)}>
              {s("mengajar.kelas.catatan_pengembangan")}
            </Link>
          ) : null}
          <Link className="pin-btn" href={`/mengajar/${id}/langkah`}>
            {s("mengajar.aksi.langkah")}
          </Link>
          {/* WP7C. The class's own feedback, beside the class's own evidence:
              a reading rather than an act, which is what `bukti` is too. Always
              offered, because whether a round has been held is a fact the
              subject of one is entitled to, and the page behind it says plainly
              when there has not been one. */}
          <Link className="pin-btn" href={`/mengajar/${id}/umpan-balik`}>
            {s("umpanbalik.guru.judul")}
          </Link>
        </div>

        <div className="pin-sec">
          <h2>{s("mengajar.berjalan.kelas")}</h2>
          {buka.length === 0 ? (
            <Kosong jenis="belum" kalimat={s("mengajar.berjalan.kosong")} />
          ) : (
            <div className="pin-list">
              {buka.map((b) => (
                <div key={b.id} className="pin-row">
                  <span className="pin-title">{b.judul}</span>
                  <span className="pin-rowmeta">
                    {b.ditutup ? <span>{tanggal(b.ditutup, "hari", locale)}</span> : null}
                    <span>
                      {format.number(b.mengumpulkan, locale)}/
                      {format.number(fakta.murid.length, locale)}{" "}
                      {s("mengajar.bukti.kumpul").toLowerCase()}
                    </span>
                  </span>
                  <span className="pin-pill pin-neutral">{s("mengajar.status.berjalan")}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pin-sec" id="materi">
          <h2>{s("mengajar.materi.judul")}</h2>
          <p className="pin-sub">{s("mengajar.materi.sub")}</p>
          {/* DAISY-18: "Sediakan" lands here, beside the material it made available */}
          {sedia === "ok" ? <BarisHasil nada="ok">{s("mengajar.sedia.ok")}</BarisHasil> : null}
          {sp.diakhiri === "ok" || sp.diakhiri === "ditarik" ? <BarisHasil nada="ok">{s(sp.diakhiri === "ditarik" ? "mengajar.akhiri.ok_tarik" : "mengajar.akhiri.ok")}</BarisHasil> : null}
          {tugas.length === 0 && terbit.length === 0 ? (
            <Kosong jenis="belum" kalimat={s("mengajar.materi.kosong")} />
          ) : (
            <div className="pin-list">
              {tugas.map((x) => (
                <div key={x.id} className="pin-row">
                  <span className="pin-title">{x.kursus}</span>
                  {/* Batch 3 closure (Daisy, J1Terbit step 7): the window in words, «Mulai … · Sampai …» or «Tanpa batas
                      akhir», and «Tersedia» as the done Badge (✓); a scheduled or finished material stays neutral */}
                  <span className="pin-rowmeta">
                    {x.mulai ? <span>{s("mengajar.siap.mulai")} {tanggal(x.mulai, "hari", locale)}</span> : null}
                    <span>{x.sampai ? `${s("mengajar.siap.sampai")} ${tanggal(x.sampai, "hari", locale)}` : s("mengajar.siap.sampai.kosong")}</span>
                  </span>
                  <span className={`pin-pill ${ajar.nadaMateri(ajar.statusMateri(x))}`}>{s(ajar.statusMateri(x))}</span>
                  {/* W2.21: an assignment in force can be ended or withdrawn, on the record, from its own row */}
                  {x.status === "ACTIVE" ? (
                    <Link className="pin-tautan" href={`/mengajar/${id}?akhiri=${x.id}#akhiri`} data-akhiri-buka={x.id}>
                      {s("mengajar.akhiri.buka")}<span className="pin-sr"> · {x.kursus}</span>
                    </Link>
                  ) : null}
                </div>
              ))}
              {terbit
                .filter((r) => !punya.has(r.id))
                .map((r) => (
                  <Link
                    key={r.id}
                    className="pin-row"
                    href={`/mengajar/${id}/siapkan?terbitan=${r.id}`}
                  >
                    <span className="pin-title">{r.kursus}</span>
                    {/* DAISY-26 (UX-20): the date says which release; its version number means nothing to a teacher */}
                    <span className="pin-rowmeta">
                      {r.terbitPada ? (
                        <span>
                          {s("mengajar.siap.diterbitkan")} {tanggal(r.terbitPada, "baca", locale)}
                        </span>
                      ) : null}
                    </span>
                    <span className="pin-pill pin-info">{s("mengajar.status.siap")}</span>
                  </Link>
                ))}
            </div>
          )}
        </div>

        {diakhiri && pratinjau ? (
          <AkhiriPenugasan kelasId={id} tugas={diakhiri} pratinjau={pratinjau} kode={kodePenugasanDari(sp.kode)} locale={locale} />
        ) : null}

        <div className="pin-sec">
          <h2>{s(kataAnggota("mengajar.murid.judul", ctx.ini.jenis))}</h2>
          <p className="pin-sub">
            {format.number(fakta.murid.length, locale)} {s(kataAnggota("mengajar.fakta.murid", ctx.ini.jenis)).toLowerCase()}.{" "}
            {s("mengajar.murid.sub")}
            {fakta.rosterBerubah
              ? ` ${s("mengajar.fakta.berubah")} ${tanggal(fakta.rosterBerubah, "baca", locale)}.`
              : ""}
          </p>
          {/* W3.5 (Batch 4; Daisy, J2Kelas): the class's learners as a Table: alphabetical, searchable, paged with the
              total; each name opens that learner's record (M4) and nothing stands beside it (no status, no colour) */}
          {fakta.murid.length === 0 ? (
            <Kosong jenis="belum" kalimat={s(kataAnggota("mengajar.murid.kosong", ctx.ini.jenis))} />
          ) : (
            <Koleksi
              id="pin-kelas-murid"
              nama={`${s(kataAnggota("mengajar.murid.judul", ctx.ini.jenis))} · ${ctx.ini.nama}`}
              benda={s(kataAnggota("mengajar.bukti.murid", ctx.ini.jenis))}
              kolom={[{ judul: s("mengajar.cepat.hasil.kolom.nama") }]}
              baris={rosterHalaman.isi.map((m) => ({ kunci: m.id, nama: adaBuktiSoal(ctx.ini.jenis) ? <Link href={`/mengajar/${id}/murid/${m.id}`}>{m.nama}</Link> : m.nama, sel: [] }))}
              posisi={rosterHalaman.posisi}
              totalSemua={rosterHalaman.totalSemua}
              kosong={<Kosong jenis="belum" kalimat={s(kataAnggota("mengajar.murid.kosong", ctx.ini.jenis))} />}
              jalan={`/mengajar/${id}`}
              cari={kueriDiminta(sp.cari)}
              locale={locale}
              untuk="educator"
            />
          )}
        </div>

        <KakiPintar />
      </main>
    </>
  );
}
