import { supabaseServer } from "@/lib/supabase/server";
import { namaTempat, templatUntuk } from "@/lib/laporan";
import { currentLocale } from "@/lib/locale";
import SesiSaya from "@/components/SesiSaya";
import { kunciMuncul } from "@/components/bukti/muncul";
import NilaiLaporan from "@/components/bukti/NilaiLaporan";
import { s, card, omissionText, actionText, type Entry } from "../../_intel";

/**
 * THE EXPOSURE CAVEAT IS CONDITIONAL, NOT DECORATIVE.
 *
 * `kesehatan.catatan_paparan` explains that safety-critical items surface first
 * because the engine guarantees they are presented, not because they are worst.
 * It must appear when that is TRUE of the signals on screen -- attached to every
 * signal regardless, it is a caveat nobody reads by the third one, and then it
 * is absent exactly when it matters.
 *
 * So the condition is a property of the data: show it only when a raised signal
 * belongs to an item the engine over-presents. Question Health rows do not yet
 * reach this page -- the briefings surface is where they land -- and this
 * predicate travels with them rather than being re-derived there.
 */
export function exposureCaveatApplies(
  signals: Array<{ is_safety_critical?: boolean; state?: string }>,
): boolean {
  return signals.some((g) => g.state === "SIGNAL_RAISED" && g.is_safety_critical === true);
}

/**
 * Class Learning Intelligence — FABLE-06 §2.
 *
 * Story first, then the numbers, and never a number without a sentence saying
 * what to do about it (the 3-lens binding rule). Everything on this page comes
 * from `generate_report`, which calls `metric_evaluate` per metric and
 * re-authorizes against THIS viewer -- so a lecturer opening a template an
 * institution admin saved sees the lecturer's permitted subset, with an honest
 * statement standing in for each metric they may not see.
 */
export const dynamic = "force-dynamic";

export default async function RingkasanKelas({
  searchParams,
}: {
  searchParams: Promise<{ kelas?: string }>;
}) {
  const { kelas } = await searchParams;
  const supabase = await supabaseServer();

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

  const entries = (report?.entries ?? []) as Entry[];
  const shown = entries.filter((e) => e.status === "ok");
  // W9: figures in the reader's language and units; rows that name a place, by its name
  const locale = await currentLocale();
  const tempat = await namaTempat(shown.flatMap((e) => (Array.isArray(e.value) ? (e.value as Array<{ cohort_node_id?: unknown }>) : [])
    .map((r) => r.cohort_node_id).filter((x): x is string => typeof x === "string")));

  return (
    <main className="mx-auto grid max-w-3xl gap-6 p-6">
      {/* Who is signed in, and the way out (DAISY-02, D-009). min-w-0: a grid
          item is otherwise never narrower than the strip's unbroken line, and a
          long name pushed the button off a phone screen. */}
      <header className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <h1 className="text-xl font-semibold">{s("laporan.kelas.judul")}</h1>
        <SesiSaya locale={await currentLocale()} persona="educator" />
      </header>

      {!template || !kelas ? (
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

