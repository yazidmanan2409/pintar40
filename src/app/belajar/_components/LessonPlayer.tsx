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
import TautanBerkas from "@/components/pelajaran/TautanBerkas";
import { useRouter } from "next/navigation";
import { t, type HleEvent, type Locale } from "@/lib/hle";
import { halamanMulai, menjadiDibaca, perluDisimpan, posisiDiServer, setelahSimpan } from "@/lib/siklus";
import { bacaDetik, bacaHalaman, penyimpananPerangkat, simpanDetik, simpanHalaman } from "@/lib/posisi-perangkat";
import { HalamanPelajaran, LangkahContoh, contohPelajaran, halamanPelajaran } from "@/components/pelajaran/Halaman";

export type LessonPlayerProps = {
  learningAssignmentId: string;
  lessonId: string;
  title: string;
  bodyMarkdown: string | null;
  workedExamples: Array<{ judul?: string; langkah?: string[] }>;
  media: Array<{ jenis: string; path: string; transcript?: string; url?: string | null }>;
  startAt: number;
  /** W2 (T1): the signed-in person; what this device remembers is keyed by them, never by the device. */
  personId: string | null;
  saveProgress: (learningAssignmentId: string, lessonId: string, position: number, total: number)
    => Promise<{ ok: boolean; furthest?: number }>;
  /** W5: «Posisi bacaan tersimpan.» in the reader's language, shown only while the server holds the page on screen. */
  savedNote: string;
  /** J6.14 (STU-20): the reader's language for the player's own words; the lesson's text is never translated. */
  locale: Locale;
  /**
   * D-085 M3 (J5.12): opened from a teacher's request to read again. The lesson starts at its first page, whatever
   * was reached before, and its last page marks the lesson read again, once.
   */
  ulang?: string | null;
  tandaiUlang?: ((permintaan: string, pelajaran: string) => Promise<{ ok: boolean }>) | null;
};

export default function LessonPlayer(props: LessonPlayerProps) {
  const kata = (k: HleEvent) => t(k, "learner", { locale: props.locale });
  // L4 (CR-88): the pages, a page and a worked example are drawn by the shared renderer (src/components/pelajaran/Halaman.tsx),
  // the same one Studio's preview uses
  const pages = useMemo(() => halamanPelajaran(props.bodyMarkdown), [props.bodyMarkdown]);

  const [page, setPage] = useState(() => {
    // W2: this person's page on this device, never another learner's
    const local = bacaHalaman(penyimpananPerangkat(), props.personId, props.lessonId);
    // never resume behind what the server already recorded. The server keeps
    // a count of pages reached (BOB-22); this device keeps the page index.
    // D-085 M3: a lesson to read again starts at its beginning
    if (props.ulang) return 0;
    return Math.min(pages.length - 1, Math.max(halamanMulai(props.startAt, pages.length), local));
  });
  const [steps, setSteps] = useState(1);
  // Readiness (8 Nov): the reveal button goes when the last step shows; focus moves to the line that replaces it.
  const contohSelesai = useRef<HTMLParagraphElement>(null);
  const lewatLangkah = useRef(false);
  useEffect(() => { if (lewatLangkah.current) { lewatLangkah.current = false; contohSelesai.current?.focus(); } }, [steps]);

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
    total: pages.length, orang: props.personId, segarkan: () => router.refresh() });
  useEffect(() => {
    simpan.current = { save: props.saveProgress, tugas: props.learningAssignmentId, pelajaran: props.lessonId,
      total: pages.length, orang: props.personId, segarkan: () => router.refresh() };
  });
  const tersimpan = useRef(props.startAt);
  // W5: what the server holds, from its own answers; the note follows this, never the attempt
  const server = useRef(props.startAt);
  const [diServer, setDiServer] = useState(props.startAt);

  useEffect(() => {
    const { save, tugas, pelajaran, total, orang, segarkan } = simpan.current;
    simpanHalaman(penyimpananPerangkat(), orang, pelajaran, page);
    const posisi = perluDisimpan(page, tersimpan.current);
    if (posisi === null) return;
    tersimpan.current = posisi;
    const selesai = (hasil: { ok: boolean; furthest?: number } | null) => {
      const s = setelahSimpan(hasil, posisi, { diServer: server.current, tersimpan: tersimpan.current });
      server.current = s.diServer;
      tersimpan.current = s.tersimpan;
      setDiServer(s.diServer);
      if (menjadiDibaca(hasil, total)) segarkan();
    };
    void save(tugas, pelajaran, posisi, total).then(selesai, () => selesai(null));
  }, [page]);

  // D-085 M3 (J5.12): the last page of a lesson opened from a request marks it read again, once
  const ulangDitandai = useRef(false);
  useEffect(() => {
    const { ulang, tandaiUlang, lessonId } = props;
    if (!ulang || !tandaiUlang || ulangDitandai.current || page < pages.length - 1) return;
    ulangDitandai.current = true;
    void tandaiUlang(ulang, lessonId).then((h) => { if (!h.ok) ulangDitandai.current = false; }, () => { ulangDitandai.current = false; });
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps -- once per page reached, as the save above

  // L4: the example a lesson shows is one rule, shared with Studio's preview (contohPelajaran)
  const example = contohPelajaran(props.workedExamples);
  const langkah = example?.langkah ?? [];

  return (
    <div>
      <HalamanPelajaran baris={pages[page]} />

      <p className="pin-lpos">
        <span>{kata("lesson.page_of")} {page + 1}/{pages.length}</span>
        <span className="pin-dots" aria-hidden="true">
          {pages.map((_, i) => (
            <span key={i} className={`pin-ldot${i === page ? " pin-at" : i < page ? " pin-done" : ""}`} />
          ))}
        </span>
      </p>

      <nav className="pin-actions pin-between">
        <button type="button" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}
          className="pin-btn">
          {kata("lesson.prev")}
        </button>
        <button type="button" disabled={page >= pages.length - 1}
          onClick={() => setPage((p) => Math.min(pages.length - 1, p + 1))}
          className="pin-btn pin-primary">
          {kata("lesson.next")}
        </button>
      </nav>

      {langkah.length > 0 && (
        <section className="pin-contoh">
          <LangkahContoh contoh={example!} tampil={steps} />
          {steps < langkah.length ? (
            <button type="button" onClick={() => { if (steps + 1 >= langkah.length) lewatLangkah.current = true; setSteps((s) => s + 1); }}
              className="pin-btn">
              {kata("lesson.example.reveal")}
            </button>
          ) : (
            <p ref={contohSelesai} tabIndex={-1} className="pin-meta">{kata("lesson.example.done")}</p>
          )}
        </section>
      )}

      {props.media.length > 0 && (
        <section className="pin-lmediaset">
          {props.media.map((m) => (
            <MediaEntry key={m.path} entry={m} personId={props.personId} locale={props.locale} />
          ))}
        </section>
      )}

      {posisiDiServer(page, diServer) && <p className="pin-meta">{props.savedNote}</p>}
    </div>
  );
}

function MediaEntry({ entry, personId, locale }: { entry: LessonPlayerProps["media"][number]; personId: string | null; locale: Locale }) {
  const kata = (k: HleEvent) => t(k, "learner", { locale });
  const [rate, setRate] = useState(1);
  const [showTranscript, setShowTranscript] = useState(false);
  // W2.12 (RV-8): a recording whose file is not there (no address, or the file answers with an error) is said to be
  // unavailable in words, its transcript shown in its place, instead of a player stuck at «0:00 / 0:00». Lessons are
  // text in this stage (D-050), so this makes a missing file honest and builds nothing else.
  const [tidakAda, setTidakAda] = useState(!entry.url);
  const gagal = (el: HTMLMediaElement) => el.error !== null || el.networkState === HTMLMediaElement.NETWORK_NO_SOURCE;
  const attach = (el: HTMLMediaElement | null) => {
    if (!el) return;
    // an error that came before the page's script was running is read from the element itself
    if (gagal(el)) { setTidakAda(true); return; }
    el.playbackRate = rate;
    // W2: this person's place in the recording on this device, never another learner's
    const at = bacaDetik(penyimpananPerangkat(), personId, entry.path);
    if (at > 0 && at > el.currentTime) el.currentTime = at;
    el.ontimeupdate = () => simpanDetik(penyimpananPerangkat(), personId, entry.path, el.currentTime);
  };

  if (entry.jenis === "pdf") {
    // R0-5: offered only while its file is there (TautanBerkas asks the read route)
    return entry.url ? <TautanBerkas href={entry.url} className="pin-lcard pin-llink">{kata("lesson.pdf")}</TautanBerkas> : null;
  }

  if (tidakAda && (entry.jenis === "audio" || entry.jenis === "video")) {
    return (
      <div className="pin-lcard" data-media="tidak-ada">
        <p className="pin-meta" role="status">
          {kata(entry.transcript ? "lesson.media.tidak_ada" : "lesson.media.tidak_ada_teks")}
        </p>
        {entry.transcript ? <p className="pin-ltrans">{entry.transcript}</p> : null}
      </div>
    );
  }

  return (
    <div className="pin-lcard">
      {entry.url && entry.jenis === "video" && (
        <video ref={attach} controls src={entry.url} className="pin-lvideo" onError={() => setTidakAda(true)} />
      )}
      {entry.url && entry.jenis === "audio" && (
        <audio ref={attach} controls src={entry.url} className="pin-laudio" onError={() => setTidakAda(true)} />
      )}
      <div className="pin-lctl">
        <label className="pin-lrate">
          {kata("lesson.speed")}
          <select value={rate} onChange={(e) => setRate(Number(e.target.value))}
            className="pin-lselect">
            {[0.75, 1, 1.25, 1.5, 2].map((r) => <option key={r} value={r}>{r}×</option>)}
          </select>
        </label>
        {entry.transcript && (
          <button type="button" onClick={() => setShowTranscript((s) => !s)} className="pin-btn pin-quiet">
            {kata("lesson.transcript")}
          </button>
        )}
      </div>
      {showTranscript && entry.transcript && (
        <p className="pin-ltrans">{entry.transcript}</p>
      )}
    </div>
  );
}
