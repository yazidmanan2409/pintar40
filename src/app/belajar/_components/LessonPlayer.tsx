"use client";
/**
 * The multimodal lesson player (§3).
 *
 * PAGINATION IS AT HEADING BOUNDARIES, not at a character count — a page that
 * breaks mid-explanation is worse than a long one. The split happens here from
 * the lesson's own markdown, so authoring controls it.
 *
 * PROGRESS NEVER GOES BACKWARDS. The furthest page reached is written to the
 * server and mirrored locally so a refresh resumes instantly; the two are
 * reconciled by taking the larger. The database applies the same rule
 * independently (GREATEST in the trigger), so a client that reported a smaller
 * number — a stale tab, a replayed request — cannot move a learner back.
 *
 * DIAGRAMS ARE DRAWN, NOT SHIPPED. A `[[visual:...]]` directive is interpreted
 * here into SVG, so a fraction diagram stays accurate and localizable instead
 * of being a picture of one language's labels.
 *
 * WORKED EXAMPLES REVEAL ONE STEP AT A TIME, and media carries a transcript —
 * which the data layer already requires (FABLE-02 §6's CHECK), so there is
 * never a track here without one.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { t } from "@/lib/hle";

export type LessonPlayerProps = {
  learningAssignmentId: string;
  lessonId: string;
  title: string;
  bodyMarkdown: string | null;
  workedExamples: Array<{ judul?: string; langkah?: string[] }>;
  media: Array<{ jenis: string; path: string; transcript?: string; url?: string | null }>;
  startAt: number;
  saveProgress: (learningAssignmentId: string, lessonId: string, position: number, total: number)
    => Promise<{ ok: boolean }>;
};

/** `[[visual:pecahan|3/8]]` → a drawn diagram. Unknown directives render as text. */
function Visual({ spec }: { spec: string }) {
  const [kind, arg] = spec.split("|");
  if (kind === "pecahan" && arg && arg.includes("/")) {
    const [numStr, denStr] = arg.split("/");
    const num = Number(numStr), den = Number(denStr);
    if (Number.isFinite(num) && Number.isFinite(den) && den > 0 && num >= 0 && num <= den) {
      const w = 320, h = 64, cell = w / den;
      return (
        <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`${num} dari ${den} bagian`}
             className="my-4 w-full max-w-sm">
          {Array.from({ length: den }, (_, i) => (
            <rect key={i} x={i * cell} y={0} width={cell} height={h}
              fill={i < num ? "var(--pintar-primary)" : "var(--surface-2)"}
              stroke="var(--line-1)" strokeWidth={1} />
          ))}
        </svg>
      );
    }
  }
  return <p className="my-4 text-ink-3">{spec}</p>;
}

function renderBlock(line: string, key: number) {
  const visual = /^\[\[visual:(.+)\]\]$/.exec(line.trim());
  if (visual) return <Visual key={key} spec={visual[1]} />;
  if (line.startsWith("## ")) return <h3 key={key} className="mt-6 text-lg font-medium">{line.slice(3)}</h3>;
  if (line.trim() === "") return null;
  return <p key={key} className="mt-3 leading-relaxed text-ink-1">{line}</p>;
}

export default function LessonPlayer(props: LessonPlayerProps) {
  const pages = useMemo(() => {
    const body = props.bodyMarkdown ?? "";
    const out: string[][] = [];
    let currentPage: string[] = [];
    for (const line of body.split("\n")) {
      if (line.startsWith("## ") && currentPage.some((l) => l.trim() !== "")) {
        out.push(currentPage);
        currentPage = [];
      }
      currentPage.push(line);
    }
    if (currentPage.some((l) => l.trim() !== "")) out.push(currentPage);
    return out.length ? out : [[""]];
  }, [props.bodyMarkdown]);

  const localKey = `pintar.lesson.${props.lessonId}`;
  const [page, setPage] = useState(() => {
    let local = 0;
    try { local = Number(window.localStorage.getItem(localKey) ?? 0); } catch { /* unavailable */ }
    // never resume behind what the server already recorded
    return Math.min(pages.length - 1, Math.max(props.startAt, Number.isFinite(local) ? local : 0));
  });
  const [steps, setSteps] = useState(1);

  const record = useCallback((p: number) => {
    try { window.localStorage.setItem(localKey, String(Math.max(p, Number(window.localStorage.getItem(localKey) ?? 0)))); }
    catch { /* unavailable */ }
    void props.saveProgress(props.learningAssignmentId, props.lessonId, p, pages.length);
  }, [localKey, pages.length, props]);

  useEffect(() => { record(page); }, [page, record]);

  const example = props.workedExamples[0];
  const langkah = example?.langkah ?? [];

  return (
    <div>
      <article className="mt-6">{pages[page].map(renderBlock)}</article>

      <p className="mt-6 flex items-center gap-2 text-sm text-ink-3">
        <span>{t("lesson.page_of", "learner")} {page + 1}/{pages.length}</span>
        <span className="flex items-center gap-1.5">
          {pages.map((_, i) => (
            <span key={i} className={`h-2 w-2 rounded-full ${i === page ? "bg-primary" : i < page ? "bg-ink-3" : "bg-line-1"}`} />
          ))}
        </span>
      </p>

      <nav className="mt-4 flex justify-between">
        <button type="button" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}
          className="rounded-[var(--radius-1)] border border-line-1 px-4 py-2 disabled:opacity-40">
          {t("lesson.prev", "learner")}
        </button>
        <button type="button" disabled={page >= pages.length - 1}
          onClick={() => setPage((p) => Math.min(pages.length - 1, p + 1))}
          className="rounded-[var(--radius-1)] bg-primary px-5 py-2 text-primary-ink disabled:opacity-40">
          {t("lesson.next", "learner")}
        </button>
      </nav>

      {langkah.length > 0 && (
        <section className="mt-10 rounded-[var(--radius-2)] border border-line-1 bg-surface-1 p-5">
          <h3 className="text-lg font-medium">{example?.judul}</h3>
          <ol className="mt-3 grid gap-2">
            {langkah.slice(0, steps).map((s, i) => (
              <li key={i} className="flex gap-3"><span className="text-ink-3">{i + 1}</span><span>{s}</span></li>
            ))}
          </ol>
          {steps < langkah.length ? (
            <button type="button" onClick={() => setSteps((s) => s + 1)}
              className="mt-4 rounded-[var(--radius-1)] border border-line-1 px-4 py-2 hover:bg-surface-2">
              {t("lesson.example.reveal", "learner")}
            </button>
          ) : (
            <p className="mt-4 text-sm text-ink-3">{t("lesson.example.done", "learner")}</p>
          )}
        </section>
      )}

      {props.media.length > 0 && (
        <section className="mt-8 grid gap-4">
          {props.media.map((m) => (
            <MediaEntry key={m.path} entry={m} />
          ))}
        </section>
      )}
    </div>
  );
}

function MediaEntry({ entry }: { entry: LessonPlayerProps["media"][number] }) {
  const [rate, setRate] = useState(1);
  const [showTranscript, setShowTranscript] = useState(false);
  const positionKey = `pintar.media.${entry.path}`;

  const attach = (el: HTMLMediaElement | null) => {
    if (!el) return;
    el.playbackRate = rate;
    try {
      const at = Number(window.localStorage.getItem(positionKey) ?? 0);
      if (Number.isFinite(at) && at > 0 && at > el.currentTime) el.currentTime = at;
    } catch { /* unavailable */ }
    el.ontimeupdate = () => {
      try { window.localStorage.setItem(positionKey, String(Math.floor(el.currentTime))); } catch { /* unavailable */ }
    };
  };

  if (entry.jenis === "pdf") {
    return entry.url ? (
      <a href={entry.url} target="_blank" rel="noreferrer"
         className="rounded-[var(--radius-2)] border border-line-1 bg-surface-1 p-4 text-primary underline">
        {t("lesson.pdf", "learner")}
      </a>
    ) : null;
  }

  return (
    <div className="rounded-[var(--radius-2)] border border-line-1 bg-surface-1 p-4">
      {entry.url && entry.jenis === "video" && (
        <video ref={attach} controls src={entry.url} className="w-full rounded-[var(--radius-1)]" />
      )}
      {entry.url && entry.jenis === "audio" && <audio ref={attach} controls src={entry.url} className="w-full" />}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-2">
          {t("lesson.speed", "learner")}
          <select value={rate} onChange={(e) => setRate(Number(e.target.value))}
            className="rounded-[var(--radius-1)] border border-line-1 bg-surface-0 px-2 py-1">
            {[0.75, 1, 1.25, 1.5, 2].map((r) => <option key={r} value={r}>{r}×</option>)}
          </select>
        </label>
        {entry.transcript && (
          <button type="button" onClick={() => setShowTranscript((s) => !s)} className="text-primary underline">
            {t("lesson.transcript", "learner")}
          </button>
        )}
      </div>
      {showTranscript && entry.transcript && (
        <p className="mt-3 whitespace-pre-wrap text-ink-2">{entry.transcript}</p>
      )}
    </div>
  );
}
