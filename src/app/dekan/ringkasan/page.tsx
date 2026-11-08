import HalamanPenolakan from "@/components/HalamanPenolakan";
import { supabaseServer } from "@/lib/supabase/server";
import Kosong from "@/components/Kosong";
import { asalLaporan } from "@/lib/nama-tempat";
import { tawarkanSekolahLain } from "@/lib/konteks-server";
import { kepalaLaporan, namaTempat, templatUntuk } from "@/lib/laporan";
import { kesiapanPerMapel } from "@/lib/pimpinan";
import KepalaCetak from "@/components/laporan/KepalaCetak";
import { currentLocale } from "@/lib/locale";
import { tanggal } from "@/lib/tanggal";
import { CangkangStaf } from "@/components/CangkangPengalaman";
import { navKonteks } from "@/components/NavKonteks";
import KakiPintar from "@/components/KakiPintar";
import { BarisLingkup } from "@/components/bukti";
import AksiLaporan from "@/components/laporan/AksiLaporan";
import KomposisiSekolah from "@/components/laporan/KomposisiSekolah";
import { s, card, type Entry } from "../../_intel";
import { judulHalaman } from "@/lib/judul-halaman";

export const generateMetadata = judulHalaman("/dekan/ringkasan");

/**
 * Institutional Learning Intelligence — FABLE-06 §3.
 *
 * Story first, then the numbers, and never a number without a sentence saying
 * what to do about it (the 3-lens binding rule).
 *
 * INV-19: THIS SURFACE IS READ-ONLY, AND THAT IS ENFORCED BELOW THE PAGE, NOT
 * BY THE PAGE. There is no form, no action and no mutation here -- but a
 * surface that merely renders no button is not read-only, so the property is
 * asserted against the API: a dean's client holds no Studio capability, so the
 * endpoints refuse a write whatever this file draws. F06-N02 tests that, not
 * the absence of a button.
 *
 * W3.8 (RV-11; J7.3, J7.4, X.7): IN THE STAFF SHELL, AND SAYING WHAT IT IS OF. The report sits in the staff shell
 * (D-138 step 3) with the working context's own places (navKonteks); every shell part carries `pin-noprint`, so the
 * paper carries the report alone. Above the figures, the school (BarisLingkup; the school's figures are asked at its
 * root whatever node is named, so the school and not the node is named), and what the figures cover: every school
 * year, up to the moment they were calculated (`calc_institution_*` read every official sitting of the school, with
 * no year), so no single year is claimed for them.
 */
export const dynamic = "force-dynamic";

export default async function RingkasanSekolah({
  searchParams,
}: {
  searchParams: Promise<{ simpul?: string; dari?: string }>;
}) {
  const { simpul, dari } = await searchParams;
  // H9: the way back is named by the place the report was opened from
  const asal = asalLaporan(dari);
  const supabase = await supabaseServer();
  // L3 (§2.6): a report of another school's place is never shown in this context; the chooser offers that school
  if (simpul) {
    const { data: tempat } = await supabase.from("org_nodes").select("institution_id").eq("id", simpul).limit(1);
    await tawarkanSekolahLain((tempat?.[0] as { institution_id?: string } | undefined)?.institution_id);
  }

  // BOB-06 (B6b): the template of the school this node belongs to -- its own
  // latest assembly, else PINTAR's standard one -- never another school's.
  const template = simpul ? (await templatUntuk("institution_learning_intelligence", simpul)) ?? undefined : undefined;

  type Report = { entries?: Entry[]; shown?: number; omitted?: number };
  let report: Report | null = null;
  if (template && simpul) {
    const { data } = await supabase.rpc("generate_report", {
      p_template: template.id,
      p_scope_node: simpul,
    });
    report = data as Report;
  }
  const dihitung = new Date();

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
  const kepalaNanti = simpul ? kepalaLaporan(simpul) : Promise.resolve(null);
  const tempat = await namaTempat(shown.flatMap((e) => (Array.isArray(e.value) ? (e.value as Array<{ cohort_node_id?: unknown }>) : [])
    .map((r) => r.cohort_node_id).filter((x): x is string => typeof x === "string")));
  const kepala = await kepalaNanti;
  const judul = s("laporan.institusi.judul", "staff", locale);
  // KESETIAAN #18: evidence readiness per subject and class, for the node the summary is of
  const kesiapanMapel = simpul ? await kesiapanPerMapel(simpul) : null;

  return (
    <>
      <CangkangStaf locale={locale} kini={judul} nav={await navKonteks({ locale, persona: "staff", bentuk: "nav" })} />
      <main id="isi" tabIndex={-1} className="pin-col">
        <KepalaCetak bagian={[judul, kepala?.sekolah, kepala?.periode]} />
        {/* W3.8: whose report; printed with it */}
        <BarisLingkup scope={{ institution: kepala?.sekolah }} locale={locale} />
        <div className="pin-head">
          <p className="pin-eyebrow">{judul}</p>
          <h1 className="pin-h1">{kepala?.sekolah ?? judul}</h1>
          {report ? (
            <p className="pin-intro">
              {s("laporan.cakupan.sekolah", "staff", locale).replace("{waktu}", tanggal(dihitung, "cap", locale))}
            </p>
          ) : null}
        </div>
        <AksiLaporan kembali={s(asal.nama, "staff", locale)} ke={asal.ke} cetak={s("laporan.cetak", "staff", locale)} />

        {!template || !simpul ? (
          <Kosong jenis="belum" kalimat={s("laporan.kosong", "staff", locale)} />
        ) : entries.length === 0 ? (
          <Kosong jenis="belum" kalimat={s("laporan.kosong", "staff", locale)} />
        ) : (
          <>
            {/* P3 -- an all-omitted report is a valid report. It renders its
                statements and says so, rather than refusing. */}
            {shown.length === 0 ? (
              <p className={card}>{s("laporan.tak_ada_angka", "staff", locale)}</p>
            ) : null}

            {/* CONTOH LAPORAN 4-dekan (approved 7 Nov): one composition over the same envelopes */}
            <KomposisiSekolah entries={entries} locale={locale} tempat={tempat} kesiapanMapel={kesiapanMapel} />
          </>
        )}
      </main>
      <KakiPintar className="pin-noprint" />
    </>
  );
}
