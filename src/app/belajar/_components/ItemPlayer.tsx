"use client";
/**
 * The one learner-facing item surface, used by both the pre-test (§1) and the
 * post-test (§4). The differences between them are props, not a second
 * component: a diagnostic screen and a formal one share a renderer, so a rule
 * fixed in one cannot quietly stop applying in the other.
 *
 * WHAT IT NEVER HAS. No answer key, no correctness, no rationale — the payload
 * it receives has been projected through the database's allow-list and
 * re-checked by the engine's `sanitize()`, and there is no field here to leak.
 * Options carry a display position, never the authored label, so the shuffle
 * is not undone by reading the DOM.
 *
 * THE OUTBOX (§4 resilience). Every answer is written to a durable local
 * outbox keyed (session, presented item, client_seq) BEFORE it is sent, and
 * removed only when the server acknowledges it. On mount — a refresh, a
 * reconnect, a returning tab — the component re-reads the SERVER's state and
 * replays whatever the outbox still holds. Session state is never
 * reconstructed locally: the outbox holds unacknowledged answers and nothing
 * else, and the server decides what it already has (INV-28 makes a replay
 * safe: the same key and the same payload is acknowledged, not duplicated).
 *
 * THE HESITATION PILL (§6). The client never decides when help is due. It
 * reports that the learner is looking at a question and asks the server, whose
 * clock started when the server first issued it; the pill appears only when
 * the server says the configured window has passed. Offline, the ask fails and
 * nothing is offered — which is the required behaviour, not a degradation.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { t, type HleEvent } from "@/lib/hle";
import type { PaperEntry, AssistanceState, AssistanceLevel } from "@/lib/assessment-engine";

type Answer = { posisi: number } | { posisi: number[] };
type Outbox = Record<string, { presentedItemId: string; clientSeq: number; value: Answer }>;

export type ItemPlayerProps = {
  sessionId: string;
  paper: PaperEntry[];
  /** Display positions already accepted by the server, per presented item. */
  accepted: Record<string, Answer>;
  /** Highest client_seq the server has per presented item. */
  seqs: Record<string, number>;
  mode: "PEMETAAN" | "PENGUASAAN";
  stage: string | null;
  allowsPause: boolean;
  startedAt: string | null;
  finishHref: string;
  actions: {
    submitAnswer: (presentedItemId: string, clientSeq: number, value: Answer,
                   receiptMode?: "LIVE" | "REPLAYED" | "LATE_SYNC") =>
      Promise<{ ok: true; outcome: string } | { ok: false; message: string }>;
    noteView: (presentedItemId: string) => Promise<{ ok: boolean }>;
    assistance: (presentedItemId: string) =>
      Promise<{ ok: true; state: AssistanceState } | { ok: false; message: string }>;
    openAssistance: (presentedItemId: string, level: number) =>
      Promise<{ ok: true; level: AssistanceLevel } | { ok: false; message: string }>;
    dismissAssistance: (presentedItemId: string) => Promise<{ ok: boolean }>;
    pauseSession: (sessionId: string) => Promise<{ ok: boolean }>;
    resumeSession: (sessionId: string) => Promise<{ ok: boolean }>;
    finishSession: (sessionId: string) => Promise<{ ok: boolean }>;
  };
};

const STAGE_KEY: Record<string, HleEvent> = {
  SD: "assist.SD", SMP: "assist.SMP", SMA: "assist.SMA", UNIVERSITAS: "assist.UNIVERSITAS",
};

function stageKey(stage: string | null): HleEvent {
  const s = (stage ?? "").trim().toUpperCase();
  if (s.startsWith("SD")) return STAGE_KEY.SD;
  if (s.startsWith("SMP")) return STAGE_KEY.SMP;
  if (s.startsWith("SMA") || s.startsWith("SMK")) return STAGE_KEY.SMA;
  return STAGE_KEY.UNIVERSITAS;
}

function outboxKey(sessionId: string) {
  return `pintar.outbox.${sessionId}`;
}

function readOutbox(sessionId: string): Outbox {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(outboxKey(sessionId)) ?? "{}") as Outbox;
  } catch {
    return {};
  }
}

function writeOutbox(sessionId: string, box: Outbox) {
  try {
    window.localStorage.setItem(outboxKey(sessionId), JSON.stringify(box));
  } catch {
    /* storage unavailable: the server remains the source of truth either way */
  }
}

function sameAnswer(a: Answer | undefined, b: Answer): boolean {
  if (!a) return false;
  const norm = (x: Answer) => (Array.isArray((x as { posisi: number[] }).posisi)
    ? [...(x as { posisi: number[] }).posisi].sort((p, q) => p - q).join(",")
    : String((x as { posisi: number }).posisi));
  return norm(a) === norm(b);
}

export default function ItemPlayer(props: ItemPlayerProps) {
  const { sessionId, paper, mode, stage, allowsPause, actions, finishHref } = props;
  const router = useRouter();
  const formal = mode === "PENGUASAAN";

  const [index, setIndex] = useState(0);
  const [accepted, setAccepted] = useState<Record<string, Answer>>(props.accepted);
  const [draft, setDraft] = useState<Record<string, Answer>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [pending, setPending] = useState<number>(() => Object.keys(readOutbox(sessionId)).length);
  const [online, setOnline] = useState(() =>
    typeof window === "undefined" ? true : window.navigator.onLine);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  // Keyed by the item they belong to rather than cleared on navigation: a
  // synchronous reset inside the effect would cascade a render, and a reply
  // for the previous question must never be shown against this one.
  const [assist, setAssist] = useState<{ itemId: string; state: AssistanceState } | null>(null);
  const [levels, setLevels] = useState<{ itemId: string; opened: AssistanceLevel[] }>(
    { itemId: "", opened: [] });
  const [navOpen, setNavOpen] = useState(false);
  const seqs = useRef<Record<string, number>>({ ...props.seqs });
  const current = paper[index];

  // ------------------------------------------------------------- the outbox
  const flush = useCallback(async () => {
    const box = readOutbox(sessionId);
    const keys = Object.keys(box);
    if (keys.length === 0) { setPending(0); return; }
    for (const k of keys) {
      const e = box[k];
      const r = await actions.submitAnswer(e.presentedItemId, e.clientSeq, e.value, "REPLAYED");
      if (r.ok) {
        delete box[k];
        writeOutbox(sessionId, box);
        setAccepted((a) => ({ ...a, [e.presentedItemId]: e.value }));
      } else {
        setOnline(false);
        break;
      }
    }
    setPending(Object.keys(readOutbox(sessionId)).length);
  }, [actions, sessionId]);

  useEffect(() => {
    // The mount replay is deferred by a tick rather than run in the effect
    // body: it settles state, and a synchronous settle here would cascade a
    // render before the first paint for no benefit.
    const first = window.setTimeout(() => { void flush(); }, 0);
    const on = () => { setOnline(true); void flush(); };
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.clearTimeout(first);
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, [flush]);

  const send = useCallback(async (entry: PaperEntry, value: Answer) => {
    if (sameAnswer(accepted[entry.presentedItemId], value)) return;
    const seq = (seqs.current[entry.presentedItemId] ?? 0) + 1;
    seqs.current[entry.presentedItemId] = seq;
    const box = readOutbox(sessionId);
    const k = `${entry.presentedItemId}:${seq}`;
    box[k] = { presentedItemId: entry.presentedItemId, clientSeq: seq, value };
    writeOutbox(sessionId, box);
    setPending(Object.keys(box).length);

    const r = await actions.submitAnswer(entry.presentedItemId, seq, value, "LIVE");
    if (r.ok) {
      const after = readOutbox(sessionId);
      delete after[k];
      writeOutbox(sessionId, after);
      setPending(Object.keys(after).length);
      setAccepted((a) => ({ ...a, [entry.presentedItemId]: value }));
      setOnline(true);
    } else {
      setOnline(false);
    }
  }, [accepted, actions, sessionId]);

  // -------------------------------------------------- the server's own clock
  useEffect(() => {
    if (!current) return;
    let alive = true;
    const itemId = current.presentedItemId;
    void actions.noteView(current.presentedItemId);
    const ask = async () => {
      const r = await actions.assistance(itemId);
      if (!alive) return;
      if (r.ok) { setAssist({ itemId, state: r.state }); setOnline(true); }
      else { setAssist(null); setOnline(false); }
    };
    void ask();
    const timer = window.setInterval(ask, 5000);
    return () => { alive = false; window.clearInterval(timer); };
  }, [actions, current]);

  // counting up, never down (§4). The server owns the deadline; this is display.
  useEffect(() => {
    if (!formal || paused) return;
    const base = props.startedAt ? Date.parse(props.startedAt) : Date.now();
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - base) / 1000)));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [formal, paused, props.startedAt]);

  const answerOf = (entry: PaperEntry): Answer | undefined =>
    draft[entry.presentedItemId] ?? accepted[entry.presentedItemId];

  const choose = useCallback((posisi: number) => {
    if (!current) return;
    const multi = current.item.item_type === "MCQ_MULTI";
    const existing = draft[current.presentedItemId] ?? accepted[current.presentedItemId];
    let next: Answer;
    if (multi) {
      const set = new Set(Array.isArray((existing as { posisi: number[] } | undefined)?.posisi)
        ? (existing as { posisi: number[] }).posisi : []);
      if (set.has(posisi)) set.delete(posisi); else set.add(posisi);
      next = { posisi: [...set].sort((a, b) => a - b) };
    } else {
      next = { posisi };
    }
    setDraft((d) => ({ ...d, [current.presentedItemId]: next }));
    // §4: no auto-advance and no auto-commit in the formal test — the learner
    // confirms. The diagnostic screen commits when they move on.
    if (!formal) void send(current, next);
  }, [current, draft, accepted, formal, send]);

  const go = useCallback((to: number) => {
    if (to < 0 || to >= paper.length) return;
    setIndex(to);
    setNavOpen(false);
  }, [paper.length]);

  // ------------------------------------------------------------- keyboard nav
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!current) return;
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      const letter = e.key.toUpperCase();
      if (letter >= "A" && letter <= "E") {
        const pos = letter.charCodeAt(0) - 64;
        if (pos <= current.item.opsi.length) { e.preventDefault(); choose(pos); }
        return;
      }
      if (e.key === "ArrowRight" || e.key === "Enter") { e.preventDefault(); go(index + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); go(index - 1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [choose, current, go, index]);

  if (!current) return null;
  const chosen = answerOf(current);
  const selected = (posisi: number) =>
    Array.isArray((chosen as { posisi: number[] } | undefined)?.posisi)
      ? (chosen as { posisi: number[] }).posisi.includes(posisi)
      : (chosen as { posisi: number } | undefined)?.posisi === posisi;
  const committed = sameAnswer(accepted[current.presentedItemId], chosen ?? { posisi: -1 });

  const itemId = current.presentedItemId;
  const state = assist?.itemId === itemId ? assist.state : null;
  const opened = levels.itemId === itemId ? levels.opened : [];

  const openLevel = async (level: number) => {
    const r = await actions.openAssistance(itemId, level);
    if (r.ok) {
      setLevels((l) => (l.itemId === itemId
        ? { itemId, opened: [...l.opened, r.level] }
        : { itemId, opened: [r.level] }));
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-5 py-8">
      {/* ---------------------------------------------------------- chrome */}
      <div className="flex items-center justify-between gap-4">
        {formal ? (
          <span className="tabular-nums text-sm text-ink-2" aria-live="off">
            {t("posttest.elapsed", "learner")} {String(Math.floor(elapsed / 60)).padStart(2, "0")}:
            {String(elapsed % 60).padStart(2, "0")}
          </span>
        ) : (
          // §1: dots, never a percent bar and never a countdown-feeling timer
          <span className="flex items-center gap-1.5" aria-label={`${t("pretest.progress", "learner")} ${index + 1}/${paper.length}`}>
            {paper.map((p, i) => (
              <span
                key={p.presentedItemId}
                className={`h-2 w-2 rounded-full ${
                  i === index ? "bg-primary" : accepted[p.presentedItemId] ? "bg-ink-3" : "bg-line-1"
                }`}
              />
            ))}
          </span>
        )}
        <span className="flex items-center gap-3 text-sm">
          {!online && <span className="text-attention">{t("sync.offline", "learner")}</span>}
          {online && pending > 0 && <span className="text-ink-3">{t("sync.pending", "learner")}</span>}
          {formal && allowsPause && (
            <button
              type="button"
              onClick={async () => {
                if (paused) { await actions.resumeSession(sessionId); setPaused(false); }
                else { await actions.pauseSession(sessionId); setPaused(true); }
              }}
              className="rounded-[var(--radius-1)] border border-line-1 px-3 py-1.5 hover:bg-surface-2"
            >
              {paused ? t("posttest.resume", "learner") : t("posttest.pause", "learner")}
            </button>
          )}
          {formal && (
            <button type="button" onClick={() => setNavOpen((o) => !o)}
              className="rounded-[var(--radius-1)] border border-line-1 px-3 py-1.5 hover:bg-surface-2">
              {t("posttest.navigator", "learner")}
            </button>
          )}
        </span>
      </div>

      {formal && navOpen && (
        <ol className="mt-4 grid grid-cols-6 gap-2 rounded-[var(--radius-2)] border border-line-1 bg-surface-1 p-4">
          {paper.map((p, i) => (
            <li key={p.presentedItemId}>
              <button type="button" onClick={() => go(i)}
                className={`w-full rounded-[var(--radius-1)] border px-2 py-2 text-sm ${
                  accepted[p.presentedItemId] ? "border-ok bg-ok-soft" : "border-line-1"
                } ${flagged[p.presentedItemId] ? "ring-2 ring-attention" : ""} ${i === index ? "font-semibold" : ""}`}
                aria-label={`${i + 1} — ${accepted[p.presentedItemId] ? t("posttest.answered", "learner") : t("posttest.unanswered", "learner")}`}>
                {i + 1}
              </button>
            </li>
          ))}
        </ol>
      )}

      {paused ? (
        <p className="mt-10 rounded-[var(--radius-2)] border border-line-1 bg-surface-1 p-6 text-ink-2">
          {t("posttest.resume", "learner")}
        </p>
      ) : (
        <>
          {/* ------------------------------------------------------- the item */}
          <article className="mt-8">
            <h2 className="text-xl leading-relaxed">{current.item.stem}</h2>
            {current.item.stimulus && (
              <p className="mt-3 whitespace-pre-wrap text-ink-2">{current.item.stimulus}</p>
            )}

            <ul className="mt-6 grid gap-2">
              {current.item.opsi.map((o) => (
                <li key={o.posisi}>
                  <button
                    type="button"
                    onClick={() => choose(o.posisi)}
                    aria-pressed={selected(o.posisi)}
                    className={`flex w-full items-start gap-3 rounded-[var(--radius-2)] border p-4 text-left ${
                      selected(o.posisi) ? "border-primary bg-primary-soft" : "border-line-1 bg-surface-1 hover:bg-surface-2"
                    }`}
                  >
                    <span className="mt-0.5 text-sm text-ink-3">{String.fromCharCode(64 + o.posisi)}</span>
                    <span>{o.teks}</span>
                  </button>
                </li>
              ))}
            </ul>

            {formal && (
              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  disabled={!chosen || committed}
                  onClick={() => chosen && void send(current, chosen)}
                  className="rounded-[var(--radius-1)] bg-primary px-4 py-2 text-primary-ink disabled:opacity-40"
                >
                  {committed ? t("posttest.confirmed", "learner") : t("posttest.confirm", "learner")}
                </button>
                <button
                  type="button"
                  onClick={() => setFlagged((f) => ({ ...f, [current.presentedItemId]: !f[current.presentedItemId] }))}
                  className="rounded-[var(--radius-1)] border border-line-1 px-3 py-2 text-sm hover:bg-surface-2"
                >
                  {flagged[current.presentedItemId] ? t("posttest.flagged", "learner") : t("posttest.flag", "learner")}
                </button>
              </div>
            )}
          </article>

          {/* ------------------------------------------------ assistance pill */}
          {state?.due && (
            <section className="mt-6 rounded-[var(--radius-2)] border border-attention bg-attention-soft p-4">
              <p className="font-medium">{t(stageKey(stage), "learner")}</p>
              {opened.map((l) => (
                <p key={l.level} className="mt-3">
                  <span className="block text-sm text-ink-3">{t(`assist.level.${l.kode}` as HleEvent, "learner")}</span>
                  <span>{l.isi}</span>
                </p>
              ))}
              <div className="mt-3 flex gap-3 text-sm">
                {state.nextLevel !== null && (
                  <button type="button" onClick={() => void openLevel(state.nextLevel as number)}
                    className="rounded-[var(--radius-1)] border border-line-1 bg-surface-1 px-3 py-1.5">
                    {opened.length === 0 ? t(stageKey(stage), "learner") : t("assist.more", "learner")}
                  </button>
                )}
                <button type="button"
                  onClick={() => { void actions.dismissAssistance(itemId); setAssist(null); }}
                  className="px-2 py-1.5 text-ink-2 underline">
                  {t("assist.close", "learner")}
                </button>
              </div>
            </section>
          )}
        </>
      )}

      {/* ------------------------------------------------------ move / finish */}
      <nav className="mt-10 flex items-center justify-between">
        <button type="button" onClick={() => go(index - 1)} disabled={index === 0}
          className="rounded-[var(--radius-1)] border border-line-1 px-4 py-2 disabled:opacity-40">
          {t(formal ? "pretest.back" : "pretest.back", "learner")}
        </button>
        {index < paper.length - 1 ? (
          <button type="button" onClick={() => go(index + 1)}
            className="rounded-[var(--radius-1)] bg-primary px-5 py-2 text-primary-ink">
            {t("pretest.next", "learner")}
          </button>
        ) : (
          <button
            type="button"
            onClick={async () => {
              await flush();
              const r = await actions.finishSession(sessionId);
              if (r.ok) router.push(finishHref);
            }}
            className="rounded-[var(--radius-1)] bg-primary px-5 py-2 text-primary-ink"
          >
            {t(formal ? "posttest.submit" : "pretest.finish", "learner")}
          </button>
        )}
      </nav>
    </div>
  );
}
