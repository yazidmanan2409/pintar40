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
/** One answer the learner took and the server has not yet acknowledged. */
type Entry = { presentedItemId: string; clientSeq: number; value: Answer };

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
      Promise<{ ok: true; outcome: string } | { ok: false; message: string; code: string | null; detail: string | null }>;
    noteView: (presentedItemId: string) => Promise<{ ok: boolean }>;
    assistance: (presentedItemId: string) =>
      Promise<{ ok: true; state: AssistanceState } | { ok: false; message: string }>;
    openAssistance: (presentedItemId: string, level: number) =>
      Promise<{ ok: true; level: AssistanceLevel } | { ok: false; message: string }>;
    dismissAssistance: (presentedItemId: string) => Promise<{ ok: boolean }>;
    pauseSession: (sessionId: string) => Promise<{ ok: boolean }>;
    resumeSession: (sessionId: string) => Promise<{ ok: boolean }>;
    noteIntegrity: (sessionId: string,
                    category: "VISIBILITY_CHANGE" | "RECONNECT" | "RAPID_OPTION_CHANGE",
                    observation: Record<string, number | string>) => Promise<{ ok: boolean }>;
    finishSession: (sessionId: string, manifest: Record<string, number>) =>
      Promise<{ ok: true; resultId: string } | { ok: false; message: string; code: string | null; detail: string | null }>;
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

/*
 * THE OUTBOX, ONE KEY PER ENTRY (R1). It used to be one JSON object per session,
 * rewritten whole on every change, so two tabs of the same assessment could
 * overwrite each other's unacknowledged answers. An entry is now its own key,
 * `pintar.outbox.<session>.<presented item>.<client_seq>`, written before it is
 * sent and removed only when the server acknowledges it or refuses it for good.
 * Where storage is unavailable the entry lives in memory for this page, so
 * Finish still sees it; it is simply not durable across a reload.
 */
const prefix = (sessionId: string) => `pintar.outbox.${sessionId}.`;
const entryKey = (sessionId: string, e: { presentedItemId: string; clientSeq: number }) =>
  `${prefix(sessionId)}${e.presentedItemId}.${e.clientSeq}`;
const memory = new Map<string, Entry>();

function readEntries(sessionId: string): Entry[] {
  const found = new Map<string, Entry>();
  for (const [k, v] of memory) if (k.startsWith(prefix(sessionId))) found.set(k, v);
  if (typeof window !== "undefined") {
    try {
      const ls = window.localStorage;
      // the pre-R1 single-object outbox, carried over once rather than lost
      const legacyKey = `pintar.outbox.${sessionId}`;
      const legacy = ls.getItem(legacyKey);
      if (legacy) {
        for (const e of Object.values(JSON.parse(legacy) as Record<string, Entry>)) {
          ls.setItem(entryKey(sessionId, e), JSON.stringify(e));
        }
        ls.removeItem(legacyKey);
      }
      const keys: string[] = [];
      for (let i = 0; i < ls.length; i++) {
        const k = ls.key(i);
        if (k && k.startsWith(prefix(sessionId))) keys.push(k);
      }
      for (const k of keys) {
        try { found.set(k, JSON.parse(ls.getItem(k) ?? "") as Entry); } catch { /* not ours */ }
      }
    } catch {
      /* storage unavailable: the in-memory entries above are all there is */
    }
  }
  return [...found.values()].sort((a, b) =>
    a.presentedItemId === b.presentedItemId ? a.clientSeq - b.clientSeq
      : a.presentedItemId < b.presentedItemId ? -1 : 1);
}

function putEntry(sessionId: string, e: Entry) {
  const k = entryKey(sessionId, e);
  try {
    window.localStorage.setItem(k, JSON.stringify(e));
    memory.delete(k);
  } catch {
    memory.set(k, e);
  }
}

function dropEntry(sessionId: string, e: Entry) {
  const k = entryKey(sessionId, e);
  memory.delete(k);
  try { window.localStorage.removeItem(k); } catch { /* nothing stored */ }
}

/** What one delivery attempt came to. */
type Delivery = "acked" | "pending" | "offline" | "closed";

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
  const [pending, setPending] = useState<number>(() => readEntries(sessionId).length);
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
  // R1: what Finish says to the learner when it cannot finish yet, and whether
  // the server has closed the session under this page (another tab finished).
  const [notice, setNotice] = useState<HleEvent | null>(null);
  const [closed, setClosed] = useState(false);
  const [finishing, setFinishing] = useState(false);
  // THE SEQUENCE RULE (R1, F-07). Two sources of truth, never one:
  //   serverSeqs — the highest client_seq the server is known to hold per item
  //                (the page's read, raised by every acknowledgement);
  //   issued     — the highest client_seq this page has issued per item.
  // `nextSeq` is one above BOTH of them AND above everything still in the
  // outbox, which is the one thing a reload used to forget: an answer replayed
  // from the outbox after the page's read carried a seq the read never saw.
  const serverSeqs = useRef<Record<string, number>>({ ...props.seqs });
  const issued = useRef<Record<string, number>>({});
  const current = paper[index];

  const outboxMax = useCallback((item: string) =>
    readEntries(sessionId).filter((e) => e.presentedItemId === item)
      .reduce((m, e) => Math.max(m, e.clientSeq), 0), [sessionId]);

  const nextSeq = useCallback((item: string) => {
    const n = 1 + Math.max(serverSeqs.current[item] ?? 0, issued.current[item] ?? 0, outboxMax(item));
    issued.current[item] = n;
    return n;
  }, [outboxMax]);

  // ------------------------------------------------------------- the outbox
  /*
   * ONE DELIVERY, CLASSIFIED BY THE SERVER'S CODE (R1). Only an acknowledgement
   * or a terminal refusal removes an entry:
   *   acked    RECORDED / ACKNOWLEDGED            — removed
   *   PR001    the seq is taken by another answer — renumbered above the server's
   *            high-water mark and sent again; never "offline"
   *   PR002    the session accepts nothing more   — removed, and said to the learner
   *   thrown   the request never arrived          — kept; offline
   *   other    a refusal we cannot interpret      — kept; tried again later
   */
  const deliver = useCallback(async (e: Entry, mode: "LIVE" | "REPLAYED"): Promise<Delivery> => {
    let cur = e;
    for (let attempt = 0; attempt < 4; attempt++) {
      let r: Awaited<ReturnType<typeof actions.submitAnswer>>;
      try {
        r = await actions.submitAnswer(cur.presentedItemId, cur.clientSeq, cur.value, mode);
      } catch {
        return "offline";
      }
      if (r.ok) {
        dropEntry(sessionId, cur);
        const item = cur.presentedItemId;
        serverSeqs.current[item] = Math.max(serverSeqs.current[item] ?? 0, cur.clientSeq);
        // shown as the learner's answer only if nothing newer was taken since
        if (cur.clientSeq >= Math.max(issued.current[item] ?? 0, outboxMax(item))) {
          const v = cur.value;
          setAccepted((a) => ({ ...a, [item]: v }));
        }
        return "acked";
      }
      if (r.code === "PR001") {
        const held = Number(r.detail);
        if (Number.isFinite(held)) {
          serverSeqs.current[cur.presentedItemId] = Math.max(serverSeqs.current[cur.presentedItemId] ?? 0, held);
        }
        dropEntry(sessionId, cur);
        cur = { ...cur, clientSeq: nextSeq(cur.presentedItemId) };
        putEntry(sessionId, cur);
        continue;
      }
      if (r.code === "PR002") {
        dropEntry(sessionId, cur);
        return "closed";
      }
      return "pending";
    }
    return "pending";
  }, [actions, nextSeq, outboxMax, sessionId]);

  /** Every entry still held, oldest first per item. Stops at the first lost request. */
  const flush = useCallback(async (): Promise<Delivery | "clear"> => {
    let result: Delivery | "clear" = "clear";
    for (const e of readEntries(sessionId)) {
      const o = await deliver(e, "REPLAYED");
      if (o === "offline") { result = "offline"; break; }
      if (o === "closed") result = "closed";
      else if (o === "pending" && result === "clear") result = "pending";
    }
    setPending(readEntries(sessionId).length);
    setOnline(result !== "offline");
    if (result === "closed") setClosed(true);
    return result;
  }, [deliver, sessionId]);

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
    const item = entry.presentedItemId;
    const heldForItem = readEntries(sessionId).some((e) => e.presentedItemId === item);
    if (sameAnswer(accepted[item], value) && !heldForItem) return;
    const e: Entry = { presentedItemId: item, clientSeq: nextSeq(item), value };
    putEntry(sessionId, e);
    setPending(readEntries(sessionId).length);
    const o = await deliver(e, "LIVE");
    setPending(readEntries(sessionId).length);
    setOnline(o !== "offline");
    if (o === "closed") setClosed(true);
  }, [accepted, deliver, nextSeq, sessionId]);

  /*
   * FINISH NEVER OUTRUNS THE LEARNER'S WORK (R1, F-08). Replay everything held;
   * if anything is still held, do not finish — say so. Otherwise send the
   * manifest (the highest seq taken per item), and the database refuses (PR006)
   * if it does not hold every one of them, whatever this page believed.
   */
  const finish = useCallback(async () => {
    if (finishing) return;
    setFinishing(true);
    setNotice(null);
    try {
      const f = await flush();
      if (f === "offline") { setNotice("sync.belum_terkirim"); return; }
      if (readEntries(sessionId).length > 0) { setNotice("sync.belum_tersimpan"); return; }
      const manifest: Record<string, number> = {};
      for (const p of paper) {
        const m = Math.max(serverSeqs.current[p.presentedItemId] ?? 0, issued.current[p.presentedItemId] ?? 0);
        if (m > 0) manifest[p.presentedItemId] = m;
      }
      let r: Awaited<ReturnType<typeof actions.finishSession>>;
      try {
        r = await actions.finishSession(sessionId, manifest);
      } catch {
        setNotice("sync.belum_terkirim");
        return;
      }
      if (r.ok || r.code === "PR002") {
        // doc 04 §7: the system issues a certificate for a certifying pass. Asked
        // at once, never awaited: the results view must not wait on issuance,
        // and the certificate page asks again on every load.
        if (formal) {
          void fetch("/api/certificates/issue", {
            method: "POST", keepalive: true, headers: { "content-type": "application/json" },
            body: JSON.stringify({ session_id: sessionId }),
          }).catch(() => undefined);
        }
        router.push(finishHref);
        return;
      }
      setNotice("sync.belum_tersimpan");
    } finally {
      setFinishing(false);
    }
  }, [actions, finishHref, finishing, flush, formal, paper, router, sessionId]);

  // ---------------------------------------- integrity observations (F-09)
  /*
   * doc 07's category-7 events, proportionate by construction: that the tab
   * was hidden, that the connection came back, that one question's answer was
   * changed several times in a few seconds. Never the answer, never content,
   * never a verdict — a human with CAN_REVIEW_INTEGRITY reads these, nothing
   * scores them. At most one of each kind per ten seconds from this page.
   */
  const lastSignal = useRef<Record<string, number>>({});
  const changes = useRef<Record<string, number[]>>({});
  const observe = useCallback((category: "VISIBILITY_CHANGE" | "RECONNECT" | "RAPID_OPTION_CHANGE",
                               observation: Record<string, number | string>) => {
    const now = Date.now();
    if (now - (lastSignal.current[category] ?? 0) < 10_000) return;
    lastSignal.current[category] = now;
    void actions.noteIntegrity(sessionId, category, observation).catch(() => undefined);
  }, [actions, sessionId]);

  useEffect(() => {
    let wentOffline = false;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") observe("VISIBILITY_CHANGE", { state: "hidden" });
    };
    const onOffline = () => { wentOffline = true; };
    const onOnline = () => {
      if (wentOffline) { wentOffline = false; observe("RECONNECT", {}); }
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, [observe]);

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
    const now = Date.now();
    const recent = [...(changes.current[current.presentedItemId] ?? []), now].filter((x) => now - x < 5_000);
    changes.current[current.presentedItemId] = recent;
    if (recent.length >= 3) observe("RAPID_OPTION_CHANGE", { soal: index + 1, kali: recent.length });
    // §4: no auto-advance and no auto-commit in the formal test — the learner
    // confirms. The diagnostic screen commits when they move on.
    if (!formal) void send(current, next);
  }, [current, draft, accepted, formal, send, observe, index]);

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
    <div className="pin-player">
      {/* ---------------------------------------------------------- chrome */}
      <div className="pin-soalbar">
        {formal ? (
          <span className="pin-time" aria-live="off">
            {t("posttest.elapsed", "learner")} {String(Math.floor(elapsed / 60)).padStart(2, "0")}:
            {String(elapsed % 60).padStart(2, "0")}
          </span>
        ) : (
          // §1: dots, never a percent bar and never a countdown-feeling timer
          <span className="pin-dots" aria-label={`${t("pretest.progress", "learner")} ${index + 1}/${paper.length}`}>
            {paper.map((p, i) => (
              <span
                key={p.presentedItemId}
                className={`pin-ldot${i === index ? " pin-at" : accepted[p.presentedItemId] ? " pin-done" : ""}`}
              />
            ))}
          </span>
        )}
        <span className="pin-sbchrome">
          {!online && <span className="pin-luring">{t("sync.offline", "learner")}</span>}
          {online && pending > 0 && <span className="pin-meta">{t("sync.pending", "learner")}</span>}
          {formal && allowsPause && (
            <button
              type="button"
              onClick={async () => {
                // the server decides; the screen follows what it said
                try {
                  if (paused) { if ((await actions.resumeSession(sessionId)).ok) setPaused(false); }
                  else if ((await actions.pauseSession(sessionId)).ok) setPaused(true);
                } catch {
                  setOnline(false);
                }
              }}
              className="pin-btn"
            >
              {paused ? t("posttest.resume", "learner") : t("posttest.pause", "learner")}
            </button>
          )}
          {formal && (
            <button type="button" onClick={() => setNavOpen((o) => !o)}
              className="pin-btn">
              {t("posttest.navigator", "learner")}
            </button>
          )}
        </span>
      </div>

      {formal && navOpen && (
        <ol className="pin-daftar">
          {paper.map((p, i) => (
            <li key={p.presentedItemId}>
              <button type="button" onClick={() => go(i)}
                className={`pin-num-btn${accepted[p.presentedItemId] ? " pin-ans" : ""}${flagged[p.presentedItemId] ? " pin-flag" : ""}${i === index ? " pin-at" : ""}`}
                aria-label={`${i + 1} — ${accepted[p.presentedItemId] ? t("posttest.answered", "learner") : t("posttest.unanswered", "learner")}`}>
                {i + 1}
              </button>
            </li>
          ))}
        </ol>
      )}

      {paused ? (
        <p className="pin-pending">
          {t("posttest.resume", "learner")}
        </p>
      ) : (
        <>
          {/* ------------------------------------------------------- the item */}
          <article className="pin-soal">
            <h2 className="pin-stem">{current.item.stem}</h2>
            {current.item.stimulus && (
              <p className="pin-stimulus">{current.item.stimulus}</p>
            )}

            <ul className="pin-opsi">
              {current.item.opsi.map((o) => (
                <li key={o.posisi}>
                  <button
                    type="button"
                    onClick={() => choose(o.posisi)}
                    aria-pressed={selected(o.posisi)}
                    /* The selected state is drawn from `aria-pressed` above
                       rather than from a second class: one source of truth, so
                       the thing a screen reader announces and the thing an eye
                       sees cannot disagree. */
                    className="pin-op"
                  >
                    <span className="pin-k">{String.fromCharCode(64 + o.posisi)}</span>
                    <span>{o.teks}</span>
                  </button>
                </li>
              ))}
            </ul>

            {formal && (
              <div className="pin-actions">
                <button
                  type="button"
                  disabled={!chosen || committed}
                  onClick={() => chosen && void send(current, chosen)}
                  className="pin-btn pin-primary"
                >
                  {committed ? t("posttest.confirmed", "learner") : t("posttest.confirm", "learner")}
                </button>
                <button
                  type="button"
                  onClick={() => setFlagged((f) => ({ ...f, [current.presentedItemId]: !f[current.presentedItemId] }))}
                  className="pin-btn"
                >
                  {flagged[current.presentedItemId] ? t("posttest.flagged", "learner") : t("posttest.flag", "learner")}
                </button>
              </div>
            )}
          </article>

          {/* ------------------------------------------------ assistance pill */}
          {state?.due && (
            <section className="pin-bantuan">
              <p className="pin-lvl">{t(stageKey(stage), "learner")}</p>
              {opened.map((l) => (
                <p key={l.level}>
                  <span className="pin-lvl">{t(`assist.level.${l.kode}` as HleEvent, "learner")}</span>
                  <span>{l.isi}</span>
                </p>
              ))}
              <div className="pin-actions">
                {state.nextLevel !== null && (
                  <button type="button" onClick={() => void openLevel(state.nextLevel as number)}
                    className="pin-btn">
                    {opened.length === 0 ? t(stageKey(stage), "learner") : t("assist.more", "learner")}
                  </button>
                )}
                <button type="button"
                  onClick={() => { void actions.dismissAssistance(itemId); setAssist(null); }}
                  className="pin-btn pin-quiet">
                  {t("assist.close", "learner")}
                </button>
              </div>
            </section>
          )}
        </>
      )}

      {/* ------------------------------------------------------ move / finish */}
      {(notice || closed) && (
        <p className="pin-pending" role="status">
          {t(closed ? "sync.sesi_ditutup" : (notice as HleEvent), "learner")}
        </p>
      )}
      <nav className="pin-actions pin-between">
        <button type="button" onClick={() => go(index - 1)} disabled={index === 0}
          className="pin-btn">
          {t(formal ? "pretest.back" : "pretest.back", "learner")}
        </button>
        {index < paper.length - 1 ? (
          <button type="button" onClick={() => go(index + 1)}
            className="pin-btn pin-primary">
            {t("pretest.next", "learner")}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void finish()}
            disabled={finishing}
            className="pin-btn pin-primary"
          >
            {t(formal ? "posttest.submit" : "pretest.finish", "learner")}
          </button>
        )}
      </nav>
    </div>
  );
}
