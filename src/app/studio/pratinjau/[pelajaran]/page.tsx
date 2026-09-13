import { supabaseServer } from "@/lib/supabase/server";
import { card, s } from "../../_lib";

/**
 * Preview — the learner view, sanitized (§5).
 *
 * For a school's own lesson the ordinary RLS read applies. For a distributed
 * canonical lesson the read goes through `distributed_lesson_preview`, which
 * re-checks the grant and returns no item, option, correctness mapping or
 * rationale. Neither path can reach an answer key from this page, which is why
 * the page holds no item query at all.
 */
type Params = Promise<{ pelajaran: string }>;
type Search = Promise<{ kanonik?: string }>;

type Objective = { code: string; statement: string; bloom: string; is_core: boolean };

export default async function Pratinjau({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { pelajaran } = await params;
  const sp = await searchParams;
  const supabase = await supabaseServer();

  let title: string | null = null;
  let summary: string | null = null;
  let body: string | null = null;
  let objectives: Objective[] = [];

  if (sp.kanonik === "1") {
    const { data } = await supabase.rpc("distributed_lesson_preview", { p_lesson: pelajaran });
    const row = (Array.isArray(data) ? data[0] : data) as
      | { title: string; summary: string | null; body_markdown: string | null; objectives: Objective[] }
      | undefined;
    if (row) {
      title = row.title; summary = row.summary; body = row.body_markdown;
      objectives = row.objectives ?? [];
    }
  } else {
    const { data: lesson } = await supabase
      .from("lessons").select("id, title, summary, body_markdown").eq("id", pelajaran).maybeSingle();
    if (lesson) {
      title = lesson.title; summary = lesson.summary; body = lesson.body_markdown;
      const { data: los } = await supabase
        .from("learning_objectives").select("code, statement, bloom, is_core").eq("lesson_id", pelajaran)
        .order("code");
      objectives = (los ?? []) as Objective[];
    }
  }

  if (!title) return <p className={card}>{s("studio.paket.kosong")}</p>;

  return (
    <article className="grid gap-4">
      <header>
        <h2 className="text-xl font-medium">{title}</h2>
        {summary ? <p className="mt-1 text-sm text-ink-2">{summary}</p> : null}
      </header>
      {objectives.length > 0 ? (
        <ul className="grid gap-1 text-sm text-ink-2">
          {objectives.map((o) => <li key={o.code}>{o.code} — {o.statement}</li>)}
        </ul>
      ) : null}
      {body ? <div className={card}><p className="whitespace-pre-wrap text-sm">{body}</p></div> : null}
    </article>
  );
}
