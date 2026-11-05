import Link from "next/link";
import JendelaTinjau from "@/components/mengajar/JendelaTinjau";
import { t, format, hariIniSekolah, type HleEvent } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import * as ajar from "@/lib/pengajar";
import { sediakanMateri } from "../../actions";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import KakiPintar from "@/components/KakiPintar";
import TombolKirim from "@/components/TombolKirim";
import TanggalDenganGema from "@/components/bentuk/TanggalDenganGema";
import BarisHasil from "@/components/BarisHasil";
import Kosong from "@/components/Kosong";
import { bagianJakarta, tanggal } from "@/lib/tanggal";
import HalamanPenolakan from "@/components/HalamanPenolakan";
import { BarisLingkup } from "@/components/bukti";
import TahapKomitmen from "@/components/mengajar/TahapKomitmen";
import { kodePenugasanDari, kunciKodePenugasan } from "@/lib/penugasan-kontrak";
import { batasPelajaran } from "@/lib/batas-ketuntasan";
import { supabaseServer } from "@/lib/supabase/server";
import { judulHalaman } from "@/lib/judul-halaman";

export const generateMetadata = judulHalaman("/mengajar/[kelas]/siapkan");

export const dynamic = "force-dynamic";

/**
 * SCREEN C — making material available to a class.
 *
 * THREE STAGES, AND THE MIDDLE ONE WRITES NOTHING. Choose the material, look at
 * exactly what the learners will receive and when, then commit. The first two
 * are GET renders carrying their choices in the query string: a reload, a
 * prefetch or a back button cannot make anything available to anybody, and the
 * only write is the form POST at the bottom of the review.
 *
 * THAT PROPERTY IS THIS ROUTE'S OWN TO KEEP. Unlike the quick assessment, there
 * is no single RPC here — the commitment is an INSERT at DRAFT followed by an
 * UPDATE to ACTIVE, and it is the UPDATE that `enforce_assignment_status` fires
 * the capability check on. So "the review has no effect" is a discipline of
 * this file rather than a guarantee of the contract, which is why it is written
 * down here and asserted by a test rather than assumed.
 *
 * THE CONSEQUENCE SENTENCE NAMES THE PEOPLE. Not "this will be assigned" but
 * how many learners, in which class, will see it from when — and what cannot be
 * taken back afterwards. The window is changeable later; work a learner has
 * already started is not, and the sentence says both.
 *
 * SCOPE IS CHOSEN, NOT ENFORCED (V2). `enforce_assignment_status` authorizes on
 * `can_in_institution('CAN_ASSIGN_LEARNING', …)` and never consults the target
 * node, so the class below is a SELECTED scope rather than a boundary the
 * database draws. The copy says "dipilih" for exactly that reason and claims no
 * enforcement it cannot point at.
 *
 * BATCH 3 · W3.11 (Daisy, J5Jendela and J1Terbit part two). «Sampai» is marked «(opsional)» and its empty echo says
 * «Tanpa batas akhir». A refusal about the window («Sampai» before «Mulai», ASSIGN_WINDOW_INVALID) comes back with the
 * dates as they were sent, and its sentence is told under «Sampai», which takes focus; correcting the date clears it.
 * Every other refusal still answers at the button. A «Sediakan» the database accepted comes back here as
 * `?disediakan=`: the review reads the class's assignments again and, only when the material is there, the button
 * says «✓ Disediakan», the line says what was made available and its window in words, and the way on names the class.
 */
function hariDari(iso: string | null): string | undefined {
  const b = bagianJakarta(iso);
  return b ? `${b.tahun}-${String(b.bulan).padStart(2, "0")}-${String(b.hari).padStart(2, "0")}` : undefined;
}

const HARI = /^\d{4}-\d{2}-\d{2}$/;
export default async function Siapkan({
  params,
  searchParams,
}: {
  params: Promise<{ kelas: string }>;
  searchParams: Promise<{ terbitan?: string; kode?: string; mulai?: string; sampai?: string; disediakan?: string }>;
}) {
  const { kelas: id } = await params;
  const { terbitan: pilihan, kode, mulai: mulaiTadi, sampai: sampaiTadi, disediakan } = await searchParams;
  const locale = await currentLocale();
  const s = (k: HleEvent) => t(k, "educator", { locale });

  const ctx = await ajar.kelas(id);
  // BOB-04 (D-008): a refused "Sediakan" comes back here with its code, and the
  // teacher reads what the lesson is missing -- never the database's words
  const galat = kodePenugasanDari(kode);
  // W3.11 (J5): a window refusal is told under «Sampai», not at the button
  const galatJendela = galat === "ASSIGN_WINDOW_INVALID" ? s(kunciKodePenugasan(galat)) : undefined;
  const tolakan = galat && !galatJendela ? <BarisHasil nada="gagal">{s(kunciKodePenugasan(galat))}</BarisHasil> : null;
  if (!ctx) {
    return <HalamanPenolakan locale={locale} persona="educator" backHref="/mengajar" backKey="mengajar.kembali" />;
  }

  const [semua, tugas, fakta, akar] = await Promise.all([
    ajar.terbitan(ctx.ini.institusi, id),
    ajar.penugasan(id),
    ajar.faktaKelas(id),
    ajar.garisSekolah(ctx.ini.institusi),
  ]);
  const punya = new Set(tugas.map((x) => x.releaseId));
  // D-085 M10: a class already given a release of a chapter's line is not offered that line again; a corrected release
  // reaches it through «Koreksi» (before anyone starts), or stays with the release it was given
  const garisPunya = new Set(tugas.filter((x) => x.status === "ACTIVE").map((x) => akar.get(x.courseId) ?? x.courseId));
  const calon = semua.filter((r) => !punya.has(r.id) && !garisPunya.has(akar.get(r.courseId) ?? r.courseId));
  // W3.11 (J1 part two): made available, as the database now says, and never on the address's word alone
  const sudah = disediakan ? tugas.find((x) => x.releaseId === disediakan && x.status === "ACTIVE") ?? null : null;
  const dipilih = sudah
    ? semua.find((r) => r.id === sudah.releaseId) ?? null
    : pilihan ? calon.find((r) => r.id === pilihan) ?? null : null;
  const mulaiAwal = sudah ? hariDari(sudah.mulai) ?? hariIniSekolah() : HARI.test(mulaiTadi ?? "") ? mulaiTadi! : hariIniSekolah();
  const sampaiAwal = sudah ? hariDari(sudah.sampai) : HARI.test(sampaiTadi ?? "") ? sampaiTadi : undefined;
  const jendelaKata = `${s("mengajar.siap.mulai")} ${tanggal(mulaiAwal, "hari", locale)} · ${
    sampaiAwal ? `${s("mengajar.siap.sampai")} ${tanggal(sampaiAwal, "hari", locale)}` : s("mengajar.siap.sampai.kosong")}`;

  const lingkup = (
    <BarisLingkup
      scope={{
        institution: ctx.konteks.institusi?.nama ?? null,
        path: [ctx.ini.nama],
        period: ctx.konteks.periode,
      }}
      locale={locale}
    />
  );
  const langkah: [HleEvent, HleEvent, HleEvent] = [
    "mengajar.siap.langkah1", "mengajar.siap.langkah2", "mengajar.siap.langkah3",
  ];

  // ───────────────────────────────────────────────── stage 1: choose material
  if (!dipilih) {
    return (
      <>
        <CangkangPengalaman locale={locale} kind="pengajar" current="kelas" />
        <main id="isi" tabIndex={-1} className="pin-col">
          <Link className="pin-back" href={`/mengajar/${id}`}>← {ctx.ini.nama}</Link>
          {lingkup}
          {/* a window refusal whose material is no longer on offer has no field to stand under: it is said here */}
          {tolakan ?? (galatJendela ? <BarisHasil nada="gagal">{galatJendela}</BarisHasil> : null)}
          {sudah ? <BarisHasil nada="ok">{s("mengajar.sedia.ok")}</BarisHasil> : null}
          <TahapKomitmen tahap={0} nama={langkah} locale={locale} />
          <div className="pin-head">
            <p className="pin-eyebrow">
              {s("mengajar.siap.eyebrow")} · {ctx.ini.nama}
            </p>
            <h1 className="pin-h1">{s("mengajar.siap.pilih")}</h1>
          </div>
          {calon.length === 0 ? (
            <Kosong jenis="belum" kalimat={s("mengajar.siap.pilih.kosong")} />
          ) : (
            <div className="pin-list">
              {calon.map((r) => (
                <Link key={r.id} className="pin-row" href={`/mengajar/${id}/siapkan?terbitan=${r.id}`}>
                  <span className="pin-title">{r.kursus}</span>
                  {/* D-085 M6: where the material comes from, said */}
                  <span className="pin-asal" data-asal={r.asal}>{s(r.asal === "PINTAR" ? "mengajar.siap.asal.pintar" : "mengajar.siap.asal.sekolah")}</span>
                  {/* DAISY-26 (UX-20): the date says which release; its version number means nothing to a teacher */}
                  <span className="pin-rowmeta">
                    {r.terbitPada ? (
                      <span>{s("mengajar.siap.diterbitkan")} {tanggal(r.terbitPada, "baca", locale)}</span>
                    ) : null}
                  </span>
                  <span className="pin-pill pin-info">{s("mengajar.status.siap")}</span>
                </Link>
              ))}
            </div>
          )}
          <KakiPintar />
        </main>
      </>
    );
  }

  // ──────────────────────────────── stage 2: review, then the one commitment
  // D-088(b), DAISY-38: the school's pass mark for this lesson, read-only; unset, the lesson cannot be given yet
  const [isi, alat, batas] = await Promise.all([
    ajar.isiTerbitan(dipilih),
    ajar.instrumen(dipilih),
    supabaseServer().then((c) => batasPelajaran(c, ctx.ini.institusi, dipilih.courseId)),
  ]);

  return (
    <>
      <CangkangPengalaman locale={locale} kind="pengajar" current="kelas" />
      <main id="isi" tabIndex={-1} className="pin-col">
        <Link className="pin-back" href={`/mengajar/${id}/siapkan`}>← {s("mengajar.siap.kembali")}</Link>
        {lingkup}
        <TahapKomitmen tahap={sudah ? 2 : 1} nama={langkah} locale={locale} />

        <div className="pin-head">
          <p className="pin-eyebrow">{s("mengajar.siap.eyebrow")} · {ctx.ini.nama}</p>
          <h1 className="pin-h1">{s("mengajar.siap.judul")}</h1>
          <p className="pin-intro">{s("mengajar.siap.intro")}</p>
        </div>

        <div className="pin-paket">
          <div className="pin-prow">
            <h2>{dipilih.kursus}</h2>
            <span className="pin-asal" data-asal={dipilih.asal}>{s(dipilih.asal === "PINTAR" ? "mengajar.siap.asal.pintar" : "mengajar.siap.asal.sekolah")}</span>
            {/* Batch 3 closure (defect 2): once «Sediakan» is taken the card says what the class now has, as the class
                page does (statusMateri), never «Belum disediakan» beside «✓ Disediakan» */}
            {sudah ? (
              <span className={`pin-pill ${ajar.nadaMateri(ajar.statusMateri(sudah))}`}>{s(ajar.statusMateri(sudah))}</span>
            ) : (
              <span className="pin-pill pin-neutral">{s("mengajar.status.belum")}</span>
            )}
          </div>
          <p className="pin-meta">
            {/* DAISY-26 (UX-20): no version number; the date says which release */}
            {dipilih.terbitPada ? `${s("mengajar.siap.diterbitkan")} ${tanggal(dipilih.terbitPada, "baca", locale)} · ` : ""}
            {`${format.number(isi.pelajaran, locale)} ${s("mengajar.siap.pelajaran")}`}
            {` · ${format.number(isi.soal, locale)} ${s("mengajar.siap.soal")}`}
          </p>
          {batas === null ? (
            <p className="pin-meta pin-batas" data-batas="belum">{s("mengajar.sedia.batas_belum")}</p>
          ) : batas !== undefined ? (
            <p className="pin-meta pin-batas" data-batas={batas}>
              {s("mengajar.sedia.batas")} <span className="pin-num">{format.percent(batas / 100, locale)}</span>
            </p>
          ) : null}
          <ol className="pin-terima">
            {alat.map((a, i) => (
              <li key={`${a.mode}-${i}`}>
                <span className="pin-n">{format.number(i + 1, locale)}</span>
                <span className="pin-what">
                  {s(`mengajar.instrumen.${a.mode}` as HleEvent)}
                </span>
                <span className="pin-r">
                  {format.number(a.soal, locale)} {s("mengajar.siap.soal")}
                  {a.percobaan != null
                    ? ` · ${format.number(a.percobaan, locale)} ${s("mengajar.percobaan")}`
                    : ""}
                </span>
                <span className="pin-d">{a.judul}</span>
              </li>
            ))}
            <li>
              <span className="pin-n">{format.number(alat.length + 1, locale)}</span>
              <span className="pin-what">{s("mengajar.instrumen.sertifikat")}</span>
              <span className="pin-r" />
              <span className="pin-d">{s("mengajar.instrumen.sertifikat.arti")}</span>
            </li>
          </ol>
        </div>

        {/* THE COMMITMENT. Every choice above travelled here in the URL and
            nothing has been written; this form is the first and only write. */}
        <form action={sediakanMateri}>
          <input type="hidden" name="kelas" value={id} />
          <input type="hidden" name="terbitan" value={dipilih.id} />
          <input type="hidden" name="kursus" value={dipilih.courseId} />

          <div className="pin-sec">
            <h2>{s("mengajar.siap.jendela")}</h2>
            <p className="pin-sub">{s("mengajar.siap.jendela.arti")}</p>
            <dl className="pin-facts">
              <div>
                <dt><label htmlFor="pin-mulai">{s("mengajar.siap.mulai")}</label></dt>
                <dd>
                  <TanggalDenganGema id="pin-mulai" name="mulai" defaultValue={mulaiAwal} disabled={Boolean(sudah)} locale={locale} untuk="educator" />
                </dd>
              </div>
              <div>
                <dt>
                  <label htmlFor="pin-sampai">
                    {s("mengajar.siap.sampai")} <span className="pin-opsional">{s("bentuk.opsional")}</span>
                  </label>
                </dt>
                <dd>
                  <TanggalDenganGema id="pin-sampai" name="sampai" defaultValue={sampaiAwal} disabled={Boolean(sudah)}
                    kosong={s("mengajar.siap.sampai.kosong")} galat={galatJendela} locale={locale} untuk="educator" />
                </dd>
              </div>
            </dl>
          </div>

          <div className="pin-sec">
            <h2>{s("mengajar.siap.tinjau")}</h2>
            <div className="pin-commit">
              {/* Batch 3 closure (Daisy, J5Jendela and J1Terbit step 6): who it is for is part of the review, «Disediakan
                  untuk Kelas 5A · 31 murid terdaftar hari ini», not a third column of the window */}
              <p className="pin-untuk" data-untuk="kelas">
                {s("mengajar.siap.disediakan")} <b>{ctx.ini.nama}</b>
                {" · "}{format.number(fakta.murid.length, locale)} {s("mengajar.siap.terdaftar")}
              </p>
              {/* A5 J5 (D-173(a)): the window being confirmed, before «Sediakan»; after it, the result line says it */}
              {sudah ? null : (
                <JendelaTinjau idMulai="pin-mulai" idSampai="pin-sampai" mulai={mulaiAwal} sampai={sampaiAwal} locale={locale}
                  kata={{ jendela: s("mengajar.siap.jendela"), mulai: s("mengajar.siap.mulai"), sampai: s("mengajar.siap.sampai"), tanpaAkhir: s("mengajar.siap.sampai.kosong") }} />
              )}
              <p className="pin-akibat">
                {s("mengajar.siap.akibat.1")}{" "}
                <b>
                  {format.number(fakta.murid.length, locale)} {s("mengajar.bukti.murid")} {ctx.ini.nama}
                </b>{" "}
                {s("mengajar.siap.akibat.2")} {s("mengajar.siap.akibat.3")}
              </p>
              {/* DAISY-18: a refused "Sediakan" answers at the button that sent it */}
              {tolakan}
              <div className="pin-actions">
                <TombolKirim className="pin-btn pin-primary" sibuk={s("tombol.menyediakan")}
                  selesai={sudah ? s("mengajar.sedia.selesai") : undefined}>
                  {s("mengajar.siap.komit")} {dipilih.kursus} {s("mengajar.untuk")} {ctx.ini.nama}
                </TombolKirim>
                {sudah ? (
                  <Link className="pin-btn" href={`/mengajar/${id}`}>{ctx.ini.nama}</Link>
                ) : (
                  <Link className="pin-btn" href={`/mengajar/${id}/siapkan`}>
                    {s("mengajar.siap.kembali")}
                  </Link>
                )}
              </div>
              {/* W3.11 (J1 part two): what changed for whom, the window in words, and the way on beside it */}
              {sudah ? <BarisHasil nada="ok">{s("mengajar.sedia.ok")} {jendelaKata}.</BarisHasil> : null}
            </div>
          </div>
        </form>

        <KakiPintar />
      </main>
    </>
  );
}
