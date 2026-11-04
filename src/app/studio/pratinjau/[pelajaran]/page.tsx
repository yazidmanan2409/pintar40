import { supabaseServer } from "@/lib/supabase/server";
import { alamatMedia } from "@/lib/media-pelajaran";
import { currentLocale } from "@/lib/locale";
import { card, kataStudio } from "../../_lib";
import Kosong from "@/components/Kosong";
import { TeksBaris } from "@/components/teks/Teks";
import { HalamanPelajaran, LangkahContoh, contohPelajaran, halamanPelajaran, type ContohLangkah } from "@/components/pelajaran/Halaman";
import { judulHalaman } from "@/lib/judul-halaman";

export const generateMetadata = judulHalaman("/studio/pratinjau/[pelajaran]");

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
  // W1.9 (UX-25): the preview's own words in the reader's language; the lesson's text is the lesson's
  const s = kataStudio(await currentLocale());

  let title: string | null = null;
  let summary: string | null = null;
  let body: string | null = null;
  let objectives: Objective[] = [];
  let media: Media[] = [];
  let contoh: ContohLangkah[] = [];

  if (sp.kanonik === "1") {
    const { data } = await supabase.rpc("distributed_lesson_preview", { p_lesson: pelajaran });
    const row = (Array.isArray(data) ? data[0] : data) as
      | { title: string; summary: string | null; body_markdown: string | null; worked_examples: unknown; objectives: Objective[] }
      | undefined;
    if (row) {
      title = row.title; summary = row.summary; body = row.body_markdown;
      // L4 (the Second Eye's finding 4): the worked examples the RPC already returns, as the learner gets them
      contoh = (Array.isArray(row.worked_examples) ? row.worked_examples : []) as ContohLangkah[];
      objectives = row.objectives ?? [];
    }
  } else {
    const { data: lesson } = await supabase
      .from("lessons").select("id, title, summary, body_markdown, media, worked_examples").eq("id", pelajaran).maybeSingle();
    if (lesson) {
      title = lesson.title; summary = lesson.summary; body = lesson.body_markdown;
      contoh = (Array.isArray(lesson.worked_examples) ? lesson.worked_examples : []) as ContohLangkah[];
      // BOB-11 (M9): the lesson's media, before release, for the school's own
      // staff. Each path is asked of the database, as the learner's are; the
      // route asks again when the file is fetched.
      const entri = (Array.isArray(lesson.media) ? lesson.media : []) as Array<{ jenis?: string; path?: string; transcript?: string }>;
      media = await Promise.all(entri.filter((m) => typeof m.path === "string").map(async (m) => {
        const { data } = await supabase.rpc("may_preview_lesson_media", { p_path: m.path });
        return {
          jenis: String(m.jenis ?? ""), path: m.path!, transcript: m.transcript,
          url: await alamatMedia(m.path!, data === true),
        };
      }));
      const { data: los } = await supabase
        .from("learning_objectives").select("code, statement, bloom, is_core").eq("lesson_id", pelajaran)
        .order("code");
      objectives = (los ?? []) as Objective[];
    }
  }

  if (!title) return <Kosong jenis="belum" kalimat={s("studio.paket.kosong")} />;

  return (
    <article className="pin-studio-halaman">
      <header>
        <h2 className="pin-studio-h2">{title}</h2>
        {summary ? <p className="pin-ket"><TeksBaris teks={summary} /></p> : null}
      </header>
      {objectives.length > 0 ? (
        <ul className="pin-daftar-rapat pin-ket">
          {/* L4 (CR-85): the objective in words; its code secondary. RV-23: the code keeps together at 320 px */}
          {objectives.map((o) => <li key={o.code}><TeksBaris teks={o.statement} /> <span className="pin-kode">{o.code}</span></li>)}
        </ul>
      ) : null}
      {/* L4 (CR-88, FD-6): the lesson as the learner's player draws it, through the same renderer: its pages (one card
          each, in order), its drawn diagrams and its worked examples, every step shown */}
      {body ? halamanPelajaran(body).map((baris, i, semua) => (
        <div key={i} className={card} data-halaman={i + 1}>
          <p className="pin-halaman-ke">{s("lesson.page_of")} {i + 1}/{semua.length}</p>
          <HalamanPelajaran baris={baris} />
        </div>
      )) : null}
      {/* the worked example the player shows (its first, contohPelajaran), every step at once: the preview does not
          step through it, as the learner does */}
      {contohPelajaran(contoh) ? (
        <section className={`${card} pin-contoh`} data-contoh="">
          <LangkahContoh contoh={contohPelajaran(contoh)!} tampil={(contohPelajaran(contoh)!.langkah ?? []).length} />
        </section>
      ) : null}
      {media.filter((m) => m.url).map((m) => (
        <div key={m.path} className={card}>
          {m.jenis === "video" ? <video controls preload="metadata" src={m.url!} className="pin-media" /> : null}
          {m.jenis === "audio" ? <audio controls preload="metadata" src={m.url!} className="pin-media" /> : null}
          {m.jenis === "pdf" ? (
            <a href={m.url!} target="_blank" rel="noreferrer" className="pin-tautan">
              {s("lesson.pdf")}
            </a>
          ) : null}
          {m.transcript ? <p className="pin-ket">{m.transcript}</p> : null}
        </div>
      ))}
    </article>
  );
}
