import { supabaseServer } from "@/lib/supabase/server";
import { t } from "@/lib/hle";
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
type Media = { jenis: string; path: string; transcript?: string; url: string | null };

export default async function Pratinjau({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { pelajaran } = await params;
  const sp = await searchParams;
  const supabase = await supabaseServer();

  let title: string | null = null;
  let summary: string | null = null;
  let body: string | null = null;
  let objectives: Objective[] = [];
  let media: Media[] = [];

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
      .from("lessons").select("id, title, summary, body_markdown, media").eq("id", pelajaran).maybeSingle();
    if (lesson) {
      title = lesson.title; summary = lesson.summary; body = lesson.body_markdown;
      // BOB-11 (M9): the lesson's media, before release, for the school's own
      // staff. Each path is asked of the database, as the learner's are; the
      // route asks again when the file is fetched.
      const entri = (Array.isArray(lesson.media) ? lesson.media : []) as Array<{ jenis?: string; path?: string; transcript?: string }>;
      media = await Promise.all(entri.filter((m) => typeof m.path === "string").map(async (m) => {
        const { data } = await supabase.rpc("may_preview_lesson_media", { p_path: m.path });
        return {
          jenis: String(m.jenis ?? ""), path: m.path!, transcript: m.transcript,
          url: data === true ? `/api/assets/read-url?path=${encodeURIComponent(m.path!)}&alih=1` : null,
        };
      }));
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
      {media.filter((m) => m.url).map((m) => (
        <div key={m.path} className={card}>
          {m.jenis === "video" ? <video controls preload="metadata" src={m.url!} className="w-full" /> : null}
          {m.jenis === "audio" ? <audio controls preload="metadata" src={m.url!} className="w-full" /> : null}
          {m.jenis === "pdf" ? (
            <a href={m.url!} target="_blank" rel="noreferrer" className="text-sm underline underline-offset-4">
              {t("lesson.pdf", "staff")}
            </a>
          ) : null}
          {m.transcript ? <p className="mt-2 text-sm text-ink-2">{m.transcript}</p> : null}
        </div>
      ))}
    </article>
  );
}
