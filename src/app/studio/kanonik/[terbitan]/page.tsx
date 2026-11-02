import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { card, s } from "../../_lib";
import { judulHalaman } from "@/lib/judul-halaman";

export const generateMetadata = judulHalaman("/studio/kanonik/[terbitan]");

/**
 * A distributed canonical release, read-only (§5.3).
 *
 * The outline and the lesson preview arrive through the two SECURITY DEFINER
 * accessors, each of which re-checks the grant. Neither carries an item, an
 * option, a correctness mapping or a rationale: preview is the sanitized
 * learner view, and a consuming school has no authoring reason to hold another
 * tenant's answer key.
 */
type Params = Promise<{ terbitan: string }>;

export default async function KanonikTerbitan({ params }: { params: Params }) {
  const { terbitan } = await params;
  const supabase = await supabaseServer();
  const { data: outline } = await supabase.rpc("distributed_release_outline", { p_release: terbitan });

  const rows = (outline ?? []) as Array<{
    module_id: string; module_ordinal: number; module_title: string;
    lesson_id: string | null; lesson_ordinal: number | null; lesson_title: string | null;
    lesson_summary: string | null; objective_count: number; item_count: number;
  }>;

  if (rows.length === 0) {
    return <p className={card}>{s("studio.kanonik.kosong")}</p>;
  }

  return (
    <div className="grid gap-4">
      <p className="text-sm text-ink-2">{s("studio.kanonik.hanya_baca")}</p>
      <ul className="grid gap-2">
        {rows.map((r) => (
          <li key={`${r.module_id}:${r.lesson_id ?? "-"}`} className={card}>
            <p className="text-sm text-ink-3">{r.module_title}</p>
            {r.lesson_id ? (
              <>
                <Link href={`/studio/pratinjau/${r.lesson_id}?kanonik=1`}
                      className="mt-1 block font-medium underline-offset-4 hover:underline">
                  {r.lesson_title}
                </Link>
                {r.lesson_summary ? <p className="mt-1 text-sm text-ink-2">{r.lesson_summary}</p> : null}
                <p className="mt-1 text-sm text-ink-3 tabular-nums">
                  {r.objective_count} · {r.item_count}
                </p>
              </>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
