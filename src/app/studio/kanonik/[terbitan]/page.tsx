import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { currentLocale } from "@/lib/locale";
import { card, kataStudio } from "../../_lib";
import Kosong from "@/components/Kosong";
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
 *
 * W1.14 (Batch 3): on the v3 primitives (Panel, a list with gaps, the Empty state); W1.9: in the reader's language,
 * and each count says what it counts.
 */
type Params = Promise<{ terbitan: string }>;

export default async function KanonikTerbitan({ params }: { params: Params }) {
  const { terbitan } = await params;
  const supabase = await supabaseServer();
  const s = kataStudio(await currentLocale());
  const { data: outline } = await supabase.rpc("distributed_release_outline", { p_release: terbitan });

  const rows = (outline ?? []) as Array<{
    module_id: string; module_ordinal: number; module_title: string;
    lesson_id: string | null; lesson_ordinal: number | null; lesson_title: string | null;
    lesson_summary: string | null; objective_count: number; item_count: number;
  }>;

  if (rows.length === 0) {
    return <Kosong jenis="belum" kalimat={s("studio.kanonik.kosong")} />;
  }

  return (
    <div className="pin-studio-halaman">
      <p className="pin-ket">{s("studio.kanonik.hanya_baca")}</p>
      <ul className="pin-daftar">
        {rows.map((r) => (
          <li key={`${r.module_id}:${r.lesson_id ?? "-"}`} className={card}>
            <p className="pin-ket-3">{r.module_title}</p>
            {r.lesson_id ? (
              <>
                <Link href={`/studio/pratinjau/${r.lesson_id}?kanonik=1`} className="pin-tautan pin-judul-baris">
                  {r.lesson_title}
                </Link>
                {r.lesson_summary ? <p className="pin-ket">{r.lesson_summary}</p> : null}
                <p className="pin-ket-3 pin-num">
                  {r.objective_count} {s("studio.kanonik.unit.tujuan")} · {r.item_count} {s("studio.definisi.unit.soal")}
                </p>
              </>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
