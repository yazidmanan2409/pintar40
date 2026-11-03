import { supabaseServer } from "@/lib/supabase/server";
import { tawarkanSekolahLain } from "@/lib/konteks-server";
import { kepalaLaporan, namaTempat, templatUntuk } from "@/lib/laporan";
import { currentLocale } from "@/lib/locale";
import { tanggal } from "@/lib/tanggal";
import { CangkangStaf } from "@/components/CangkangPengalaman";
import { navKonteks } from "@/components/NavKonteks";
import KakiPintar from "@/components/KakiPintar";
import { BarisLingkup, kalimatJumlah } from "@/components/bukti";
import { kunciMuncul } from "@/components/bukti/muncul";
import NilaiLaporan from "@/components/bukti/NilaiLaporan";
import AksiLaporan from "@/components/laporan/AksiLaporan";
import { s, card, omissionText, actionText, type Entry } from "../../_intel";
import { judulHalaman } from "@/lib/judul-halaman";

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
  searchParams: Promise<{ kelas?: string }>;
}) {
  const { kelas } = await searchParams;
  const supabase = await supabaseServer();
  // L3 (§2.6): a report of another school's place is never shown in this context; the chooser offers that school
  if (kelas) {
    const { data: tempat } = await supabase.from("org_nodes").select("institution_id").eq("id", kelas).limit(1);
    await tawarkanSekolahLain((tempat?.[0] as { institution_id?: string } | undefined)?.institution_id);
  }

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

  const entries = (report?.entries ?? []) as Entry[];
  const shown = entries.filter((e) => e.status === "ok");
  // W9: figures in the reader's language and units; rows that name a place, by its name
  const locale = await currentLocale();
  const kepalaNanti = kelas ? kepalaLaporan(kelas) : Promise.resolve(null);
  const tempat = await namaTempat(shown.flatMap((e) => (Array.isArray(e.value) ? (e.value as Array<{ cohort_node_id?: unknown }>) : [])
    .map((r) => r.cohort_node_id).filter((x): x is string => typeof x === "string")));
  const kepala = await kepalaNanti;
  const judul = s("laporan.kelas.judul", "educator", locale);

  return (
    <>
      <CangkangStaf locale={locale} kini={judul} nav={await navKonteks({ locale, persona: "staff", bentuk: "nav" })} />
      <main id="isi" tabIndex={-1} className="pin-col">
        {/* W3.8: whose report, and which school year; printed with it */}
        <BarisLingkup scope={{ institution: kepala?.sekolah, path: kepala?.tempat ? [kepala.tempat] : [], period: kepala?.periode }} locale={locale} />
        <div className="pin-head">
          <p className="pin-eyebrow">{judul}</p>
          <h1 className="pin-h1">{kepala?.tempat ?? judul}</h1>
          {report ? (
            <p className="pin-intro">
              {s("laporan.cakupan.kelas", "educator", locale).replace("{waktu}", tanggal(dihitung, "cap", locale))}
            </p>
          ) : null}
        </div>
        <AksiLaporan kembali={s("laporan.kembali", "educator", locale)} cetak={s("laporan.cetak", "educator", locale)} />

        {!template || !kelas ? (
          <p className={card}>{s("laporan.kosong", "educator", locale)}</p>
        ) : entries.length === 0 ? (
          <p className={card}>{s("laporan.kosong", "educator", locale)}</p>
        ) : (
          <>
            {/* P3 -- an all-omitted report is a valid report. It renders its
                statements and says so, rather than refusing. */}
            {shown.length === 0 ? (
              <p className={card}>{s("laporan.tak_ada_angka", "educator", locale)}</p>
            ) : null}

            <section className="grid gap-4">
              {entries.map((e, i) => (
                <article key={e.ordinal ?? i} className={card}>
                  {/* A metric the viewer may not see carries NO label: the
                      refusal must not disclose what it withheld. */}
                  {e.status === "ok" || e.status === "below_minimum" || e.status === "deprecated" ? (
                    <h2 className="font-medium">{e.label_key ? s(e.label_key, "educator", locale) : ""}</h2>
                  ) : null}

                  {e.status === "ok" ? (
                    <>
                      <NilaiLaporan entry={e} locale={locale} tempat={tempat} />
                      {/* S-3: the sentence is not optional and not conditional. */}
                      <p className="mt-2 text-sm text-black/70">{actionText(e, locale)}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-black/70">{omissionText(e, locale)}</p>
                      {/* W3.9 (RV-9; CR-46): how far, as a sentence, never «(0/5)» */}
                      {kalimatJumlah(e, locale) ? <p className="mt-1 text-sm text-black/70">{kalimatJumlah(e, locale)}</p> : null}
                      {/* DAISY-07: and what will make it appear, when it is short of evidence */}
                      {kunciMuncul(e) ? <p className="mt-1 text-sm text-black/70">{s(kunciMuncul(e)!, "educator", locale)}</p> : null}
                    </>
                  )}
                </article>
              ))}
            </section>
          </>
        )}
      </main>
      <KakiPintar className="pin-noprint" />
    </>
  );
}
