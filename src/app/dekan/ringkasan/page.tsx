import { supabaseServer } from "@/lib/supabase/server";
import { templatUntuk } from "@/lib/laporan";
import { currentLocale } from "@/lib/locale";
import SesiSaya from "@/components/SesiSaya";
import { kunciMuncul } from "@/components/bukti/muncul";
import { s, card, omissionText, actionText, tierLabel, type Entry } from "../../_intel";

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

  return (
    <main className="mx-auto grid max-w-3xl gap-6 p-6">
      {/* Who is signed in, and the way out (DAISY-02, D-009). min-w-0: a grid
          item is otherwise never narrower than the strip's unbroken line, and a
          long name pushed the button off a phone screen. */}
      <header className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <h1 className="text-xl font-semibold">{s("laporan.institusi.judul")}</h1>
        <SesiSaya locale={await currentLocale()} persona="staff" />
      </header>

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
                    <Value entry={e} />
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

function Value({ entry }: { entry: Entry }) {
  const v = entry.value;

  if (v !== null && typeof v === "object" && !Array.isArray(v)) {
    const rows = Object.entries(v as Record<string, unknown>);
    return (
      <dl className="mt-1 grid gap-1 text-sm">
        {rows.map(([k, n]) => (
          <div key={k} className="flex justify-between gap-4">
            {/* tier keys are HLE keys; the readiness enum never renders */}
            <dt>{k.startsWith("kesiapan.") ? tierLabel(k) : k}</dt>
            <dd className="tabular-nums">{String(n)}</dd>
          </div>
        ))}
      </dl>
    );
  }

  if (Array.isArray(v)) {
    return (
      <ul className="mt-1 grid gap-2 text-sm">
        {(v as Array<Record<string, unknown>>).slice(0, 8).map((row, i) => (
          <li key={i} className="rounded border border-black/5 p-2">
            {String(row.label ?? row.competency ?? row.code ?? "")}
            {row.remediation ? (
              <span className="block text-black/60">{String(row.remediation)}</span>
            ) : null}
          </li>
        ))}
      </ul>
    );
  }

  return <p className="mt-1 text-2xl tabular-nums">{v === null || v === undefined ? "—" : String(v)}</p>;
}
