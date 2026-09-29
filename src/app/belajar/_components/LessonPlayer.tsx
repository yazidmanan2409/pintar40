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
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { t } from "@/lib/hle";
import { halamanMulai, menjadiDibaca, perluDisimpan } from "@/lib/siklus";
import TeksBlok, { TeksBaris } from "@/components/teks/Teks";

export type LessonPlayerProps = {
  learningAssignmentId: string;
  lessonId: string;
  title: string;
  bodyMarkdown: string | null;
  workedExamples: Array<{ judul?: string; langkah?: string[] }>;
  media: Array<{ jenis: string; path: string; transcript?: string; url?: string | null }>;
  startAt: number;
  saveProgress: (learningAssignmentId: string, lessonId: string, position: number, total: number)
    => Promise<{ ok: boolean; furthest?: number }>;
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
             className="pin-lmedia">
          {Array.from({ length: den }, (_, i) => (
            <rect key={i} x={i * cell} y={0} width={cell} height={h}
              fill={i < num ? "var(--pintar-primary)" : "var(--surface-2)"}
              stroke="var(--line-1)" strokeWidth={1} />
          ))}
        </svg>
      );
    }
  }
  return <p className="pin-meta">{spec}</p>;
}

/**
 * DAISY-30: a page's lines are drawn by the shared renderer (TeksBlok), which
 * reads the lesson's own marks (**bold**, "- " lists, pipe tables, ^{…}/_{…})
 * and keeps a line a line. The one directive only the player knows, a drawn
 * diagram, is handed back to it here.
 */
function sisipVisual(line: string) {
  const visual = /^\[\[visual:(.+)\]\]$/.exec(line.trim());
  return visual ? <Visual spec={visual[1]} /> : null;
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
    // never resume behind what the server already recorded. The server keeps
    // a count of pages reached (BOB-22); this device keeps the page index.
    return Math.min(pages.length - 1, Math.max(halamanMulai(props.startAt, pages.length), Number.isFinite(local) ? local : 0));
  });
  const [steps, setSteps] = useState(1);

  // BOB-23: ONE SAVE PER PAGE NEWLY REACHED. The save ran in an effect that
  // depended on the whole props object; each save re-rendered the page, the
  // new props re-ran the effect, and a learner reading one page saved about
  // twenty times a second. Now the effect depends on the page alone, reads
  // the save function and ids through a ref, and saves only beyond what is
  // already saved (the server's startAt, then each save) -- as pages reached
  // (BOB-22), so the last page of N saves N.
  // Round 2: the save that makes the lesson read (N of N) asks the page for
  // one refresh, so its closing action -- the Uji Penguasaan link once every
  // lesson is read -- is decided again. That save only, never one per page.
  const router = useRouter();
  const simpan = useRef({ save: props.saveProgress, tugas: props.learningAssignmentId, pelajaran: props.lessonId,
    total: pages.length, kunci: localKey, segarkan: () => router.refresh() });
  useEffect(() => {
    simpan.current = { save: props.saveProgress, tugas: props.learningAssignmentId, pelajaran: props.lessonId,
      total: pages.length, kunci: localKey, segarkan: () => router.refresh() };
  });
  const tersimpan = useRef(props.startAt);

  useEffect(() => {
    const { save, tugas, pelajaran, total, kunci, segarkan } = simpan.current;
    try { window.localStorage.setItem(kunci, String(Math.max(page, Number(window.localStorage.getItem(kunci) ?? 0)))); }
    catch { /* unavailable */ }
    const posisi = perluDisimpan(page, tersimpan.current);
    if (posisi === null) return;
    tersimpan.current = posisi;
    void save(tugas, pelajaran, posisi, total).then((hasil) => { if (menjadiDibaca(hasil, total)) segarkan(); }, () => {});
  }, [page]);

  const example = props.workedExamples[0];
  const langkah = example?.langkah ?? [];

  return (
    <div>
      <article className="pin-prose"><TeksBlok teks={pages[page].join("\n")} sisip={sisipVisual} /></article>

      <p className="pin-lpos">
        <span>{t("lesson.page_of", "learner")} {page + 1}/{pages.length}</span>
        <span className="pin-dots">
          {pages.map((_, i) => (
            <span key={i} className={`pin-ldot${i === page ? " pin-at" : i < page ? " pin-done" : ""}`} />
          ))}
        </span>
      </p>

      <nav className="pin-actions pin-between">
        <button type="button" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}
          className="pin-btn">
          {t("lesson.prev", "learner")}
        </button>
        <button type="button" disabled={page >= pages.length - 1}
          onClick={() => setPage((p) => Math.min(pages.length - 1, p + 1))}
          className="pin-btn pin-primary">
          {t("lesson.next", "learner")}
        </button>
      </nav>

      {langkah.length > 0 && (
        <section className="pin-contoh">
          <h3 className="pin-lh3"><TeksBaris teks={example?.judul} /></h3>
          <ol className="pin-steps">
            {langkah.slice(0, steps).map((s, i) => (
              <li key={i} className="pin-langkah"><span className="pin-n">{i + 1}</span><span><TeksBaris teks={s} /></span></li>
            ))}
          </ol>
          {steps < langkah.length ? (
            <button type="button" onClick={() => setSteps((s) => s + 1)}
              className="pin-btn">
              {t("lesson.example.reveal", "learner")}
            </button>
          ) : (
            <p className="pin-meta">{t("lesson.example.done", "learner")}</p>
          )}
        </section>
      )}

      {props.media.length > 0 && (
        <section className="pin-lmediaset">
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
         className="pin-lcard pin-llink">
        {t("lesson.pdf", "learner")}
      </a>
    ) : null;
  }

  return (
    <div className="pin-lcard">
      {entry.url && entry.jenis === "video" && (
        <video ref={attach} controls src={entry.url} className="pin-lvideo" />
      )}
      {entry.url && entry.jenis === "audio" && <audio ref={attach} controls src={entry.url} className="pin-laudio" />}
      <div className="pin-lctl">
        <label className="pin-lrate">
          {t("lesson.speed", "learner")}
          <select value={rate} onChange={(e) => setRate(Number(e.target.value))}
            className="pin-lselect">
            {[0.75, 1, 1.25, 1.5, 2].map((r) => <option key={r} value={r}>{r}×</option>)}
          </select>
        </label>
        {entry.transcript && (
          <button type="button" onClick={() => setShowTranscript((s) => !s)} className="pin-btn pin-quiet">
            {t("lesson.transcript", "learner")}
          </button>
        )}
      </div>
      {showTranscript && entry.transcript && (
        <p className="pin-ltrans">{entry.transcript}</p>
      )}
    </div>
  );
}
