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
import { t, format, type HleEvent, type Locale } from "@/lib/hle";
import type { PaperEntry, AssistanceState, AssistanceLevel } from "@/lib/assessment-engine";
import { TeksBaris } from "@/components/teks/Teks";
import { belumDisimpan, sameAnswer, soalAwal, type Answer, type Entry } from "@/lib/kumpulkan";
import { ALAMAT_PERIKSA, dijawabDiHalaman, jedaAwal, jedaBantuan, periksaSaatLuring } from "@/lib/bantuan-terjadwal";
import AlasanNonaktif from "@/components/AlasanNonaktif";

export type ItemPlayerProps = {
  sessionId: string;
  paper: PaperEntry[];
  /** Display positions already accepted by the server, per presented item. */
  accepted: Record<string, Answer>;
  /** Highest client_seq the server has per presented item. */
  seqs: Record<string, number>;
  mode: "PEMETAAN" | "PENGUASAAN";
  /**
   * BOB-50 (D-082(d)): whether this session is the cycle's Uji Penguasaan
   * (assessment mode POST_TEST), the one sitting that asks for a certificate.
   * An Uji Cepat borrows the PENGUASAAN treatment but never certifies.
   */
  memintaSertifikat: boolean;
  stage: string | null;
  allowsPause: boolean;
  startedAt: string | null;
  /** The assessment's hesitation window in seconds, from the server (session_state); null: it offers no help. */
  assistanceWindow: number | null;
  finishHref: string;
  /** J6.14 (STU-20): the reader's language for the player's own words; questions and options are never translated. */
  locale: Locale;
  actions: {
    submitAnswer: (presentedItemId: string, clientSeq: number, value: Answer,
                   receiptMode?: "LIVE" | "REPLAYED" | "LATE_SYNC") =>
      Promise<{ ok: true; outcome: string } | { ok: false; code: string | null; detail: string | null }>;
    noteView: (presentedItemId: string) => Promise<{ ok: true; dwellSeconds: number | null } | { ok: false }>;
    assistance: (presentedItemId: string) =>
      Promise<{ ok: true; state: AssistanceState } | { ok: false; code: string | null; detail: string | null }>;
    openAssistance: (presentedItemId: string, level: number) =>
      Promise<{ ok: true; level: AssistanceLevel } | { ok: false; code: string | null; detail: string | null }>;
    dismissAssistance: (presentedItemId: string) => Promise<{ ok: boolean }>;
    pauseSession: (sessionId: string) => Promise<{ ok: boolean }>;
    resumeSession: (sessionId: string) => Promise<{ ok: boolean }>;
    noteIntegrity: (sessionId: string,
                    category: "VISIBILITY_CHANGE" | "RECONNECT" | "RAPID_OPTION_CHANGE",
                    observation: Record<string, number | string>) => Promise<{ ok: boolean }>;
    finishSession: (sessionId: string, manifest: Record<string, number>) =>
      Promise<{ ok: true; resultId: string } | { ok: false; code: string | null; detail: string | null }>;
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

export default function ItemPlayer(props: ItemPlayerProps) {
  const { sessionId, paper, mode, stage, allowsPause, actions, finishHref, memintaSertifikat } = props;
  const router = useRouter();
  const formal = mode === "PENGUASAAN";
  const kata = (k: HleEvent) => t(k, "learner", { locale: props.locale });

  // W3: a reload opens the first question without a saved answer, not question 1
  const [index, setIndex] = useState(() => soalAwal(paper.map((p) => p.presentedItemId), props.accepted));
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
  // W3: «Kumpulkan» asks once before it hands the test in (posttest.submit_confirm)
  const [asking, setAsking] = useState(false);
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

  // ONE RECOVERY (owner ruling, 3 Oct, item 17). The browser's `online` and a successful offline probe (below)
  // take the same path: the notice clears and every held answer is sent at once. «Tersimpan» still shows only on
  // the server's acknowledgement (deliver), and a resend that does not arrive keeps the answer and turns offline
  // mode, and with it the probe, back on (flush).
  const pulihkan = useCallback(() => { setOnline(true); void flush(); }, [flush]);
  const pulihkanRef = useRef(pulihkan);
  useEffect(() => { pulihkanRef.current = pulihkan; }, [pulihkan]);

  useEffect(() => {
    // The mount replay is deferred by a tick rather than run in the effect
    // body: it settles state, and a synchronous settle here would cascade a
    // render before the first paint for no benefit.
    const first = window.setTimeout(() => { void flush(); }, 0);
    const off = () => setOnline(false);
    window.addEventListener("online", pulihkan);
    window.addEventListener("offline", off);
    return () => {
      window.clearTimeout(first);
      window.removeEventListener("online", pulihkan);
      window.removeEventListener("offline", off);
    };
  }, [flush, pulihkan]);

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
   * FINISH NEVER OUTRUNS THE LEARNER'S WORK (R1, F-08). A choice still on the
   * screen and not yet taken (W3: chosen, «Simpan jawaban ini» not pressed) is
   * taken first, into the same outbox. Then replay everything held; if anything
   * is still held, do not finish — say so. Otherwise send the manifest (the
   * highest seq taken per item), and the database refuses (PR006) if it does
   * not hold every one of them, whatever this page believed.
   */
  const finish = useCallback(async () => {
    if (finishing) return;
    setFinishing(true);
    setNotice(null);
    try {
      for (const u of belumDisimpan(paper.map((p) => p.presentedItemId), draft, accepted, readEntries(sessionId))) {
        putEntry(sessionId, { presentedItemId: u.presentedItemId, clientSeq: nextSeq(u.presentedItemId), value: u.value });
      }
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
        // and the certificate page asks again on every load. BOB-50 (D-082(d)):
        // only the cycle's Uji Penguasaan asks; an Uji Cepat never does.
        if (memintaSertifikat) {
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
  }, [accepted, actions, draft, finishHref, finishing, flush, memintaSertifikat, nextSeq, paper, router, sessionId]);

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
  /*
   * HELP IS ASKED FOR WHEN IT COULD BE DUE (owner ruling, 2 Oct). The server decides whether help is due
   * (assistance_state: the window against the time since the first view, and never once answered). The player asks
   * at the point the server's own figures say help could become due (bantuan-terjadwal.ts), never on a timer of its
   * own, and not at all where the assessment offers no help. It asks again only when the server's answer could have
   * changed: after the learner opens a level, or when an answer is taken while help is on screen. «Tutup» closes the
   * offer on this question for this page: nothing reopens it (dismiss_assistance records the close and changes no
   * eligibility). The offline notice no longer rides on this: a refusal is not the network (option A, below).
   */
  const jendelaBantuan = props.assistanceWindow;
  const ditutup = useRef<Set<string>>(new Set());
  const tanyaBantuan = useRef<(() => void) | null>(null);
  const diterima = useRef(accepted);
  useEffect(() => { diterima.current = accepted; }, [accepted]);
  useEffect(() => {
    if (!current) return;
    let alive = true;
    let timer: number | undefined;
    const itemId = current.presentedItemId;
    const jadwalkan = (ms: number | null) => {
      if (timer !== undefined) window.clearTimeout(timer);
      // item 17: an answer this page holds (acknowledged, or held for sending) cannot become due: no check is sent
      timer = ms === null ? undefined : window.setTimeout(() => {
        if (dijawabDiHalaman(diterima.current, readEntries(sessionId), itemId)) return;
        void tanya();
      }, ms);
    };
    const tanya = async () => {
      if (!alive || ditutup.current.has(itemId)) return;
      let r: Awaited<ReturnType<typeof actions.assistance>>;
      try {
        r = await actions.assistance(itemId);
      } catch {
        // the request never arrived: offline mode, and the probe below looks for the network
        if (alive) setOnline(false);
        return;
      }
      if (!alive || ditutup.current.has(itemId)) return;
      // a refusal (the session closed under the page, say) is not the network: the notice stays as it was
      if (!r.ok) { setAssist(null); return; }
      setAssist({ itemId, state: r.state });
      jadwalkan(jedaBantuan(r.state));
    };
    tanyaBantuan.current = () => { void tanya(); };
    // the first view, on the server's clock; the action says how long the question has been on screen
    const terjawab = diterima.current[itemId] !== undefined;
    void actions.noteView(itemId).then(
      (v) => { if (alive) jadwalkan(jedaAwal(jendelaBantuan, v.ok ? v.dwellSeconds : null, terjawab)); },
      () => { if (alive) jadwalkan(jedaAwal(jendelaBantuan, null, terjawab)); },
    );
    return () => {
      alive = false;
      tanyaBantuan.current = null;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [actions, current, jendelaBantuan, sessionId]);

  // an answer the server holds ends the hesitation: while help is on screen, ask once so the offer follows the server
  const terimaKini = current ? accepted[current.presentedItemId] : undefined;
  const bantuanTampil = Boolean(current && assist?.itemId === current.presentedItemId && assist.state.due);
  useEffect(() => {
    if (bantuanTampil && terimaKini !== undefined) tanyaBantuan.current?.();
  }, [bantuanTampil, terimaKini]);

  // OFFLINE ONLY (owner ruling, option A): while the page believes the learner is offline (a browser `offline`
  // event, or a request that never arrived), a light probe asks whether the network is back; on the first yes the
  // notice clears and the probe stops. Nothing runs while online. The probe is a static file the proxy does not
  // see: no session check, no database, no decision but the notice.
  useEffect(() => {
    if (online) return;
    // item 17: the first success takes the same recovery as the browser's `online`, sending the held answers
    return periksaSaatLuring(
      () => fetch(`${ALAMAT_PERIKSA}?periksa=${Date.now()}`, { method: "HEAD", cache: "no-store" }).then((r) => r.ok),
      () => pulihkanRef.current(),
      5000,
    );
  }, [online]);

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
    setAsking(false);
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
  const jumlahDijawab = paper.filter((p) => accepted[p.presentedItemId]).length;

  const itemId = current.presentedItemId;
  const state = assist?.itemId === itemId ? assist.state : null;
  const opened = levels.itemId === itemId ? levels.opened : [];

  const openLevel = async (level: number) => {
    const r = await actions.openAssistance(itemId, level);
    if (r.ok) {
      setLevels((l) => (l.itemId === itemId
        ? { itemId, opened: [...l.opened, r.level] }
        : { itemId, opened: [r.level] }));
      // the server's next level follows the one just opened: ask once
      tanyaBantuan.current?.();
    }
  };

  return (
    <div className="pin-player">
      {/* ---------------------------------------------------------- chrome */}
      <div className="pin-soalbar">
        {formal ? (
          <span className="pin-time" aria-live="off">
            {kata("posttest.elapsed")} {String(Math.floor(elapsed / 60)).padStart(2, "0")}:
            {String(elapsed % 60).padStart(2, "0")}
          </span>
        ) : (
          // §1: dots, never a percent bar and never a countdown-feeling timer
          <span className="pin-dots" role="img" aria-label={`${kata("pretest.progress")} ${index + 1}/${paper.length}`}>
            {paper.map((p, i) => (
              <span
                key={p.presentedItemId}
                className={`pin-ldot${i === index ? " pin-at" : accepted[p.presentedItemId] ? " pin-done" : ""}`}
              />
            ))}
          </span>
        )}
        <span className="pin-sbchrome">
          {!online && <span className="pin-luring">{kata("sync.offline")}</span>}
          {online && pending > 0 && <span className="pin-meta">{kata("sync.pending")}</span>}
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
              {paused ? kata("posttest.resume") : kata("posttest.pause")}
            </button>
          )}
          {formal && (
            <button type="button" onClick={() => setNavOpen((o) => !o)}
              className="pin-btn">
              {kata("posttest.navigator")}
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
                aria-label={`${i + 1} — ${accepted[p.presentedItemId] ? kata("posttest.answered") : kata("posttest.unanswered")}`}>
                {i + 1}
              </button>
            </li>
          ))}
        </ol>
      )}

      {paused ? (
        <p className="pin-pending">
          {kata("posttest.resume")}
        </p>
      ) : (
        <>
          {/* ------------------------------------------------------- the item */}
          <article className="pin-soal">
            <h2 className="pin-stem"><TeksBaris teks={current.item.stem} /></h2>
            {current.item.stimulus && (
              <p className="pin-stimulus"><TeksBaris teks={current.item.stimulus} /></p>
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
                    <span><TeksBaris teks={o.teks} /></span>
                  </button>
                </li>
              ))}
            </ul>

            {formal && (
              <div className="pin-actions">
                <button
                  type="button"
                  disabled={!chosen || committed}
                  aria-describedby={!chosen && !committed ? "jawab-alasan" : undefined}
                  onClick={() => chosen && void send(current, chosen)}
                  className="pin-btn pin-primary"
                >
                  {committed ? kata("posttest.confirmed") : kata("posttest.confirm")}
                </button>
                <button
                  type="button"
                  onClick={() => setFlagged((f) => ({ ...f, [current.presentedItemId]: !f[current.presentedItemId] }))}
                  className="pin-btn"
                >
                  {flagged[current.presentedItemId] ? kata("posttest.flagged") : kata("posttest.flag")}
                </button>
              </div>
            )}
            {/* E3 #4: the answer button, disabled before a choice, says why */}
            {formal && !chosen && !committed ? <AlasanNonaktif id="jawab-alasan">{kata("alasan.nonaktif.jawab")}</AlasanNonaktif> : null}
            {/* W3.10 (J4Murid): after a saved answer, how many are answered, in words («Sudah dijawab: 7 dari 10.») */}
            {formal && (
              <p className="pin-meta" role="status" data-dijawab="">
                {jumlahDijawab > 0
                  ? `${kata("posttest.answered")}: ${format.number(jumlahDijawab, props.locale)} ${kata("siklus.dari")} ${format.number(paper.length, props.locale)}.`
                  : ""}
              </p>
            )}
          </article>

          {/* ------------------------------------------------ assistance pill */}
          {state?.due && (
            <section className="pin-bantuan">
              <p className="pin-lvl">{kata(stageKey(stage))}</p>
              {opened.map((l) => (
                <p key={l.level}>
                  <span className="pin-lvl">{kata(`assist.level.${l.kode}` as HleEvent)}</span>
                  <span><TeksBaris teks={l.isi} /></span>
                </p>
              ))}
              <div className="pin-actions">
                {state.nextLevel !== null && (
                  <button type="button" onClick={() => void openLevel(state.nextLevel as number)}
                    className="pin-btn">
                    {opened.length === 0 ? kata(stageKey(stage)) : kata("assist.more")}
                  </button>
                )}
                <button type="button"
                  onClick={() => { ditutup.current.add(itemId); void actions.dismissAssistance(itemId); setAssist(null); }}
                  className="pin-btn pin-quiet">
                  {kata("assist.close")}
                </button>
              </div>
            </section>
          )}
        </>
      )}

      {/* ------------------------------------------------------ move / finish */}
      {(notice || closed) && (
        <p className="pin-pending" role="status">
          {kata(closed ? "sync.sesi_ditutup" : (notice as HleEvent))}
        </p>
      )}
      {formal && asking && (
        <div className="pin-pending" role="group" aria-labelledby="kumpulkan-tanya">
          <p id="kumpulkan-tanya">{kata("posttest.submit_confirm")}</p>
          <div className="pin-actions">
            <button type="button" onClick={() => void finish()} disabled={finishing}
              className="pin-btn pin-primary">
              {kata("posttest.submit")}
            </button>
            {/* the button that asked is gone: focus lands on the safe answer, so the question is read out */}
            <button type="button" onClick={() => setAsking(false)} className="pin-btn" autoFocus>
              {kata("komitmen.kembali")}
            </button>
          </div>
        </div>
      )}
      <nav className="pin-actions pin-between">
        <button type="button" onClick={() => go(index - 1)} disabled={index === 0}
          className="pin-btn">
          {kata(formal ? "pretest.back" : "pretest.back")}
        </button>
        {index < paper.length - 1 ? (
          <button type="button" onClick={() => go(index + 1)}
            className="pin-btn pin-primary">
            {kata("pretest.next")}
          </button>
        ) : formal ? (
          !asking && (
            <button type="button" onClick={() => { setNotice(null); setAsking(true); }}
              className="pin-btn pin-primary">
              {kata("posttest.submit")}
            </button>
          )
        ) : (
          <button
            type="button"
            onClick={() => void finish()}
            disabled={finishing}
            className="pin-btn pin-primary"
          >
            {kata("pretest.finish")}
          </button>
        )}
      </nav>
    </div>
  );
}
