import HalamanPenolakan from "@/components/HalamanPenolakan";
import { supabaseServer } from "@/lib/supabase/server";
import { jenisAnggota, type JenisAnggota } from "@/lib/mengajar";
import Kosong from "@/components/Kosong";
import { asalLaporan } from "@/lib/nama-tempat";
import { konteksSaya, tawarkanSekolahLain } from "@/lib/konteks-server";
import type { Persona } from "@/lib/hle";
import { kepalaLaporan, namaTempat, templatUntuk } from "@/lib/laporan";
import { currentLocale } from "@/lib/locale";
import { tanggal } from "@/lib/tanggal";
import { CangkangStaf } from "@/components/CangkangPengalaman";
import { navKonteks } from "@/components/NavKonteks";
import KakiPintar from "@/components/KakiPintar";
import { BarisLingkup } from "@/components/bukti";
import AksiLaporan from "@/components/laporan/AksiLaporan";
import KomposisiKelas from "@/components/laporan/KomposisiKelas";
import KepalaCetak from "@/components/laporan/KepalaCetak";
import { awalAkhirKelas, perluPenguatan, sebaranKelas, targetKelas } from "@/lib/pengajar";
import { s, card, type Entry } from "../../_intel";
import { judulHalaman } from "@/lib/judul-halaman";
import { catatan } from "@/lib/pengembangan";
import KomposisiPengembangan from "@/components/laporan/KomposisiPengembangan";

export const generateMetadata = judulHalaman("/edukator/ringkasan");

/**
 * Class Learning Intelligence — FABLE-06 §2.
 *
 * Story first, then the numbers, and never a number without a sentence saying
 * what to do about it (the 3-lens binding rule). Everything on this page comes
 * from `generate_report`, which calls `metric_evaluate` per metric and
 * re-authorizes against THIS viewer -- so a lecturer opening a template an
 * institution admin saved sees the lecturer's permitted subset, with an honest
 * statement standing in for each metric they may not see.
 *
 * W3.8 (RV-11; J7.2, J7.4, X.7): IN THE STAFF SHELL, AND SAYING WHAT IT IS OF. The report sits in the staff shell
 * (D-138 step 3) with the working context's own places (navKonteks), so the reader keeps their navigation and the
 * signed-in strip at every width; every shell part carries `pin-noprint`, so the paper carries the report alone. Above
 * the figures, the school, the class and its school year (BarisLingkup), and when the figures were calculated: a
 * printed report that does not say whose it is and when is not a report.
 */
export const dynamic = "force-dynamic";

export default async function RingkasanKelas({
  searchParams,
}: {
  searchParams: Promise<{ kelas?: string; dari?: string }>;
}) {
  const { kelas, dari } = await searchParams;
  // H9: the way back is named by the place the report was opened from
  const asal = asalLaporan(dari);
  const supabase = await supabaseServer();
  // L3 (§2.6): a report of another school's place is never shown in this context; the chooser offers that school
  // E-A3-1: the class's kind decides who the «how far» line names (murid or peserta), read with the reader's own access
  let jenis: JenisAnggota = "LEARNER";
  if (kelas) {
    const { data: tempat } = await supabase.from("org_nodes").select("institution_id, member_kind").eq("id", kelas).limit(1);
    await tawarkanSekolahLain((tempat?.[0] as { institution_id?: string } | undefined)?.institution_id);
    jenis = jenisAnggota((tempat?.[0] as { member_kind?: string } | undefined)?.member_kind);
  }

  // X5 (owner, 7 Nov): a professional-learning class has its own summary. No academic figure, score line, band or
  // «Perlu penguatan» is read for it; its participants are listed as professional_learning_record gives them to this
  // reader (alphabetical, nothing added up: D-069, D-070), with one sentence saying why there are no mastery figures.
  if (kelas && jenis === "PARTICIPANT") return <RingkasanPengembangan kelas={kelas} asal={asal} />;

  // BOB-06 (B6b): the template of the school this node belongs to -- its own
  // latest assembly, else PINTAR's standard one -- never another school's.
  const template = kelas ? (await templatUntuk("class_learning_intelligence", kelas)) ?? undefined : undefined;

  type Report = { entries?: Entry[]; shown?: number; omitted?: number };
  let report: Report | null = null;
  if (template && kelas) {
    const { data } = await supabase.rpc("generate_report", {
      p_template: template.id,
      p_scope_node: kelas,
    });
    report = data as Report;
  }
  const dihitung = new Date();
  // the class's one sealed Uji Penguasaan mark, read with the reader's own access (none: no target line)
  const target = kelas ? await targetKelas(kelas) : null;

  const entries = (report?.entries ?? []) as Entry[];
  // Reporting Quality Gate (9 Nov): a reader refused every figure (a learner, another class's teacher, a teacher at
  // the school's summary) gets the refusal page, not a report frame with the place, a print button and one refusal
  // card per figure. The refusal discloses nothing more than before: no figure is named.
  if (entries.length > 0 && entries.every((e) => e.status === "not_permitted")) {
    return <HalamanPenolakan locale={await currentLocale()} persona="staff" messageKey="laporan.ditolak" backHref={asal.ke} />;
  }
  const shown = entries.filter((e) => e.status === "ok");
  // W9: figures in the reader's language and units; rows that name a place, by its name
  const locale = await currentLocale();
  const kepalaNanti = kelas ? kepalaLaporan(kelas) : Promise.resolve(null);
  const tempat = await namaTempat(shown.flatMap((e) => (Array.isArray(e.value) ? (e.value as Array<{ cohort_node_id?: unknown }>) : [])
    .map((r) => r.cohort_node_id).filter((x): x is string => typeof x === "string")));
  const kepala = await kepalaNanti;
  // E-C1-2: the words of the reader's own work — a teacher's in Mengajar, staff wording for a Kepala departemen, a
  // Dekan or an Admin sekolah who opens the class report from Mengelola (D-132: by the working context, not by role)
  const k = await konteksSaya();
  const untuk: Persona = k?.keadaan === "ADA" && k.tujuan === "MENGAJAR" ? "educator" : "staff";
  const judul = s("laporan.kelas.judul", untuk, locale);
  // D-195(5): section E, the learners in the lowest band by name, for the teacher of the class only
  // KESETIAAN #6: the class's score line, one anonymous dot per learner, for the class's teacher only (the database
  // answers nobody else); #7: the before → after pair, which the database gives any reader whose own Kenaikan is shown
  // Neither is asked for a professional-learning class: its participants are never drawn or named by result (D-069);
  // the database answers nothing for one either
  const murid = untuk === "educator" && kelas && jenis === "LEARNER";
  const [penguatan, titik, awalAkhir] = await Promise.all([
    murid ? perluPenguatan(kelas) : Promise.resolve(null),
    murid ? sebaranKelas(kelas) : Promise.resolve(null),
    kelas ? awalAkhirKelas(kelas) : Promise.resolve(null),
  ]);

  return (
    <>
      <CangkangStaf locale={locale} kini={judul} nav={await navKonteks({ locale, persona: "staff", bentuk: "nav" })} />
      <main id="isi" tabIndex={-1} className="pin-col">
        <KepalaCetak bagian={[judul, kepala?.tempat, kepala?.sekolah, kepala?.periode]} />
        {/* W3.8: whose report, and which school year; printed with it */}
        <BarisLingkup scope={{ institution: kepala?.sekolah, path: kepala?.tempat ? [kepala.tempat] : [], period: kepala?.periode }} locale={locale} />
        <div className="pin-head">
          <p className="pin-eyebrow">{judul}</p>
          <h1 className="pin-h1">{kepala?.tempat ?? judul}</h1>
          {report ? (
            <p className="pin-intro">
              {s("laporan.cakupan.kelas", untuk, locale).replace("{waktu}", tanggal(dihitung, "cap", locale))}
            </p>
          ) : null}
        </div>
        <AksiLaporan kembali={s(asal.nama, untuk, locale)} ke={asal.ke} cetak={s("laporan.cetak", untuk, locale)} />

        {!template || !kelas ? (
          <Kosong jenis="belum" kalimat={s("laporan.kosong", untuk, locale)} />
        ) : entries.length === 0 ? (
          <Kosong jenis="belum" kalimat={s("laporan.kosong", untuk, locale)} />
        ) : (
          <>
            {/* P3 -- an all-omitted report is a valid report. It renders its
                statements and says so, rather than refusing. */}
            {shown.length === 0 ? (
              <p className={card}>{s("laporan.tak_ada_angka", untuk, locale)}</p>
            ) : null}
            {/* CONTOH LAPORAN 2-guru / 2b (approved 7 Nov): one composition over the same envelopes */}
            <KomposisiKelas entries={entries} locale={locale} persona={untuk} jenis={jenis} target={target}
              namaKelas={kepala?.tempat ?? judul} buktiHref={untuk === "educator" ? `/mengajar/${kelas}/bukti` : null} tempat={tempat}
              penguatan={penguatan} muridHref={untuk === "educator" ? `/mengajar/${kelas}/murid` : null} titik={titik} awalAkhir={awalAkhir} />
          </>
        )}
      </main>
      <KakiPintar className="pin-noprint" />
    </>
  );
}

/**
 * X5: Ringkasan Kelas of a professional-learning class. The same page frame (whose report, which school year, print),
 * then the reason in words, then the record the database gives this reader: the facilitator, the Kepala departemen and
 * the Dekan each participant's steps and result, Admin sekolah enrolment, participation and completion only, anyone
 * else nothing. It never says figures will come: there are none to come (D-070(h)).
 */
async function RingkasanPengembangan({ kelas, asal }: { kelas: string; asal: ReturnType<typeof asalLaporan> }) {
  const locale = await currentLocale();
  const [isi, kepala, nav] = await Promise.all([
    catatan(kelas), kepalaLaporan(kelas), navKonteks({ locale, persona: "staff", bentuk: "nav" }),
  ]);
  const judul = s("laporan.kelas.judul", "staff", locale);
  return (
    <>
      <CangkangStaf locale={locale} kini={judul} nav={nav} />
      <main id="isi" tabIndex={-1} className="pin-col" data-ringkasan="pengembangan">
        <KepalaCetak bagian={[judul, kepala?.tempat, kepala?.sekolah, kepala?.periode]} />
        <BarisLingkup scope={{ institution: kepala?.sekolah, path: kepala?.tempat ? [kepala.tempat] : [], period: kepala?.periode }} locale={locale} />
        <div className="pin-head">
          <p className="pin-eyebrow">{judul}</p>
          <h1 className="pin-h1">{kepala?.tempat ?? judul}</h1>
          {/* X5-1 (Daisy, c4011570): the owner's sentence is the scope line, where the academic report says what its
              figures cover; it is the class's ordinary nature, not a state to notice, and takes no letter */}
          <p className="pin-intro" data-pd-arti="">{s("laporan.kelas.pd_arti", "staff", locale)}</p>
        </div>
        <AksiLaporan kembali={s(asal.nama, "staff", locale)} ke={asal.ke} cetak={s("laporan.cetak", "staff", locale)} />
        {isi === null ? (
          <Kosong jenis="belum" kalimat={s("pengembangan.ditolak", "staff", locale)} />
        ) : isi.peserta.length === 0 ? (
          <Kosong jenis="belum" kalimat={s("pengembangan.kosong", "staff", locale)} />
        ) : (
          <KomposisiPengembangan isi={isi} locale={locale} />
        )}
      </main>
      <KakiPintar className="pin-noprint" />
    </>
  );
}
