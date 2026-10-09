import Link from "next/link";
import { evaluationHub, evaluationState } from "@/lib/evaluation";
import { t } from "@/lib/hle";

const e = (k: Parameters<typeof t>[0]) => t(k, "staff");

/**
 * The Evaluation Hub (ADR-0020, Task 2 §8).
 *
 * Every persona shown is a row the database returned; a non-evaluator is
 * refused by the database and gets one calm sentence, never an empty list that
 * would confirm the facility exists. No lifecycle enum, tenant kind or
 * evidence purpose is named here — the evaluator sees a school and five people,
 * which is what the demonstration is about.
 */
export default async function EvaluationHubPage({
  searchParams,
}: {
  searchParams: Promise<{ galat?: string }>;
}) {
  const params = await searchParams;
  const [{ personas, refused }, state] = await Promise.all([evaluationHub(), evaluationState()]);

  if (refused) {
    return (
      <main className="mx-auto max-w-md py-16">
        <h1 className="text-2xl font-semibold tracking-tight">{e("evaluasi.judul")}</h1>
        <p className="mt-4 text-ink-2">{e("evaluasi.refused")}</p>
        <p className="mt-6"><Link href="/">← {e("galat.beranda")}</Link></p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl py-12">
      <h1 className="text-2xl font-semibold tracking-tight">{e("evaluasi.judul")}</h1>
      <p className="mt-3 text-ink-2">{e("evaluasi.intro")}</p>

      {state ? (
        <p className="mt-6 rounded-[var(--radius-1)] border border-line-1 bg-surface-1 p-3 text-sm">
          {e("evaluasi.sebagai")}: <strong>{state.label}</strong>
        </p>
      ) : null}
      {params.galat ? (
        <p className="mt-6 rounded-[var(--radius-1)] border border-line-1 bg-surface-1 p-3 text-sm text-ink-2">
          {e("evaluasi.gagal")}
        </p>
      ) : null}

      <h2 className="mt-8 text-sm font-medium text-ink-2">{e("evaluasi.pilih")}</h2>
      <ul className="mt-3 grid gap-3">
        {personas.map((p) => (
          <li key={p.persona_id} className="rounded-[var(--radius-2)] border border-line-1 bg-surface-1 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">{p.label}</p>
                <p className="text-sm text-ink-3">{p.institution_name}</p>
              </div>
              <form action="/api/evaluation/assume" method="post">
                <input type="hidden" name="persona_id" value={p.persona_id} />
                <button className="pin-btn">
                  {e("evaluasi.mulai")}
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
