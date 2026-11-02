import { supabaseServer } from "@/lib/supabase/server";
import { tawarkanSekolahLain } from "@/lib/konteks-server";
import { namaTempat, templatUntuk } from "@/lib/laporan";
import { currentLocale } from "@/lib/locale";
import SesiSaya from "@/components/SesiSaya";
import { kunciMuncul } from "@/components/bukti/muncul";
import NilaiLaporan from "@/components/bukti/NilaiLaporan";
import AksiLaporan from "@/components/laporan/AksiLaporan";
import { s, card, omissionText, actionText, type Entry } from "../../_intel";
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
 */
export const dynamic = "force-dynamic";

export default async function RingkasanSekolah({
  searchParams,
}: {
  searchParams: Promise<{ simpul?: string }>;
}) {
  const { simpul } = await searchParams;
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

  const entries = (report?.entries ?? []) as Entry[];
  const shown = entries.filter((e) => e.status === "ok");
  // W9: figures in the reader's language and units; rows that name a place, by its name
  const locale = await currentLocale();
  const tempat = await namaTempat(shown.flatMap((e) => (Array.isArray(e.value) ? (e.value as Array<{ cohort_node_id?: unknown }>) : [])
    .map((r) => r.cohort_node_id).filter((x): x is string => typeof x === "string")));

  return (
    <main id="isi" tabIndex={-1} className="mx-auto grid max-w-3xl gap-6 p-6">
      {/* Who is signed in, and the way out (DAISY-02, D-009). min-w-0: a grid
          item is otherwise never narrower than the strip's unbroken line, and a
          long name pushed the button off a phone screen; the strip's own box too,
          or at 320 px it stood 26 px past the window (X.6). */}
      <header className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <h1 className="text-xl font-semibold">{s("laporan.institusi.judul")}</h1>
        <div className="pin-noprint min-w-0 max-w-full">
          <SesiSaya locale={await currentLocale()} persona="staff" />
        </div>
      </header>
      <AksiLaporan kembali={s("laporan.kembali", "staff", locale)} cetak={s("laporan.cetak", "staff", locale)} />

      {!template || !simpul ? (
        <p className={card}>{s("laporan.kosong")}</p>
      ) : entries.length === 0 ? (
        <p className={card}>{s("laporan.kosong")}</p>
      ) : (
        <>
          {/* P3 -- an all-omitted report is a valid report. It renders its
              statements and says so, rather than refusing. */}
          {shown.length === 0 ? (
            <p className={card}>{s("laporan.tak_ada_angka")}</p>
          ) : null}

          <section className="grid gap-4">
            {entries.map((e, i) => (
              <article key={e.ordinal ?? i} className={card}>
                {/* A metric the viewer may not see carries NO label: the
                    refusal must not disclose what it withheld. */}
                {e.status === "ok" || e.status === "below_minimum" || e.status === "deprecated" ? (
                  <h2 className="font-medium">{e.label_key ? s(e.label_key) : ""}</h2>
                ) : null}

                {e.status === "ok" ? (
                  <>
                    <NilaiLaporan entry={e} locale={locale} tempat={tempat} />
                    {/* S-3: the sentence is not optional and not conditional. */}
                    <p className="mt-2 text-sm text-black/70">{actionText(e)}</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-black/70">{omissionText(e)}</p>
                    {/* DAISY-07: and what will make it appear, when it is short of evidence */}
                    {kunciMuncul(e) ? <p className="mt-1 text-sm text-black/70">{s(kunciMuncul(e)!)}</p> : null}
                  </>
                )}
              </article>
            ))}
          </section>
        </>
      )}
    </main>
  );
}

