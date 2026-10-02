# PINTAR 4.1 — Local Experience Layer: feasibility study (2 Oct 2026)

**Status.** A study only. Nothing was built, changed or prototyped. No application code, schema, migration, authentication, ROSES rule or 4.0 behaviour was touched.

**The question.** Can a layer next to the user make PINTAR materially faster, more resilient, more scalable and cheaper to run? It must do so without weakening the server's authority or the evidence model, and without disproportionate operational burden.

**The framing**, as amended by the owner on 2 Oct:
- The candidate is technology-neutral: a **Local Experience Layer**.
- Four architectures are compared on a ladder: **browser only → PWA / Service Worker → PINTAR browser extension → native Windows/macOS companion**.
- An extension plus a tiny native host is examined only where a capability genuinely needs the operating system.
- "PINTAR Companion" stays the human-facing name, whatever the implementation turns out to be.

**Evidence labels used throughout:**

| Label | Meaning |
|---|---|
| **[M]** | Measured on PINTAR (run or file cited) |
| **[C]** | Calculated from measured figures (the arithmetic is shown) |
| **[E]** | Estimated: engineering judgement, not measured on PINTAR |
| **[U]** | Unknown: not measured, and no basis for a number |
| **[X]** | External fact from vendor or public documentation as of Oct 2026 (sources in §2.4); not verified on PINTAR's users |

---

## 1. Executive summary

**The short answer.** The opportunity the idea was meant to capture is real, but almost all of it is **waste to remove on the server and in the page**, not work to move onto the user's machine. Once that waste is removed, what a local layer could still do is small. Nearly all of it can be done by the browser PINTAR already runs in. That includes the phones and shared classroom tablets the decisions already assume, where no extension or native companion can run.

1. **What remains after the approved fix is authoritative.**
   - The measured learner sitting is about 43 server actions and 78 Auth lookups [M].
   - The approved event-driven assistance check removes about 23 of each [C].
   - The rest of the sitting's actions all cross the trust boundary by design: start (the draw), item first-view on the server clock, answer receipt, finish and grading [M, from code].
   - A local layer of any kind can **queue** them, but it cannot **remove** them.
2. **The rest of the request amplification is a server and framework setting, not a local-layer job.**
   - It consists of ~24 RSC fetches (~19 of them prefetches), a second Auth lookup per page, and /belajar's per-assignment fan-out.
   - Each is removed for 100% of users by owner-pending changes inside the app: `getClaims()` for reads, no Auth on prefetch, /belajar consolidation.
   - A companion would remove them only for its adopters, and only if it took over requests it should not own.
3. **Companion-unique cloud savings are approximately zero at every adoption level** (25/50/70/90%) [C, §16]. There is nothing left to double-count once D-class work is removed and A-class work stays.
4. **The 1,000-learner limit is authoritative work plus synchronisation on 2 shared cores** [M, D-089].
   - The approved fix removes 36% of that wave's calls [M].
   - A local layer removes none of the rest.
   - It would not materially delay infrastructure scaling.
5. **Resilience: the valuable part is small, and browser-only.**
   - PINTAR already has a durable answer outbox, server-decided late sync and a refusal to finish while anything is held [M, code].
   - The one material gap is that a **reload while offline loses the page**, though not the answers.
   - A Service Worker offline fallback closes that gap. No extension or native code is needed.
6. **The extension rung is the right second rung, but nothing found today needs it.**
   - Its distinctive powers over a page are background alarms (≥30 s), OS idle state and cross-tab visibility [X].
   - Each is either already available to the page, or is surveillance PINTAR has ruled out (HR:68-69, D06:110).
7. **The native rung is the weakest.**
   - Chrome now prompts before any public site reaches `localhost`, WebSockets included; the last enterprise opt-out goes in Chrome 156 on 20 Oct 2026 [X].
   - Safari blocks `http://localhost` from https pages [X].
   - It cannot run on ChromeOS (1.2M+ school Chromebooks in Indonesia [X]), Android or iPad.
   - In practice it needs an extension anyway (native messaging), so it carries rung 3's costs plus its own.
8. **Recommendation.**
   - Keep the principle, **"Local when possible. Server when authoritative."**
   - Make 4.1's Local Experience Layer **browser-native**:
     - the approved event-driven assistance;
     - an offline-only connectivity probe (owner option A);
     - a Service Worker shell with an offline fallback;
     - tab coordination;
     - the owner-pending request-path changes.
   - Do **not** build an extension or native companion until a named capability fails in the browser and its value is measured (§26).
   - **4.0 needs no code change** to keep this path open (§23).

---

## 2. Evidence examined

### 2.1 Reports and decisions

- `docs/audits/PINTAR-4.0-WHOLE-SYSTEM-EFFICIENCY-AUDIT-2026-10-02.md` (WSA): §3 workload map; §4 amplification; §7 Auth; §11 owner items; §12 infrastructure.
- `docs/reports/PINTAR-4.0-EFFICIENCY-AUDIT-2026-10-02.md` (EA): §2 one-student map (browser 50, run 36979562623); §3 amplification incl. the 1,000 RPC wave (run 36964437916); §10 capacity.
- `docs/reports/ARCHITECTURE-HORIZON-REVIEW-2026-09-29.md` (HR): the 4.0 → 5.5 horizon.
  - HR:39-48 compatibility matrix; HR:58 evidence to protect; HR:68-69 data minimisation; HR:91, 104, 106, 145-171 deferred 4.5/5.0/5.5 items.
- `docs/coordination/DECISIONS.md` (DEC):
  - D-009, D-031, D-035, D-046, D-047, D-050, D-053, D-055, D-060, D-076, D-081, D-085, D-086, D-088, D-089, D-090, D-091.
- `docs/rebuild/03-PINTAR-INVARIANTS.md`: INV-01, 08, 09, 11, 17, 20, 27, 28, 29, 33, 37.
- `docs/rebuild/06-…EVIDENCE-AND-TELEMETRY-CONTRACT.md`: D06:53, 95, 110.
- `docs/rebuild/07-…ASSESSMENT-ENGINE-CONTRACT.md`: D07:141-168, server-authoritative state; offline answering only where `offline_tolerant`; never assistance offline.
- `docs/rebuild/09-…SCOPE-BOUNDARIES.md` D09:139: "Extensive offline platform" PARKED.
- `docs/rebuild/12-PINTAR-FAILURE-MODES.md`: FM:36 business-rule duplication; FM:44 scope creep; FM:45 speculative plugin systems.
- ADRs:
  - 0001: no service-role key client-side.
  - 0004: content hash computed once, by the database.
  - 0005 §4-5: telemetry write-only; first view on the server clock; client timers rejected.
  - 0013: verification at the API boundary.
  - 0020: client-supplied headers are forgeable.
- Identity:
  - `docs/coordination/auth/IDENTITY-4.0.md` (C4 "No client-only lock"; C11 user-declared device context; :143 "never a browser-only control where the server must enforce");
  - the 28 Sep architecture review (lock design: heartbeat about once a minute, the server judges idleness);
  - BOARD BOB-29 / DAISY-23 (Gate 6, TODO).
- `docs/coordination/perf/2026-09-27-staging-latency.md`: sin1 → Supabase 21.5 ms per call against 277 ms from the US.
- `vercel.json`: `regions: ["sin1"]`.
- `docs/coordination/RELEASES.md`: production is Supabase Pro, Singapore, Micro; Auth capped at 10 database connections.

### 2.2 Source code (read, not changed)

- **Request path:**
  - `src/proxy.ts`: matcher L120-122 covers every page, RSC fetch, prefetch, action and /api; `auth.getUser()` L66 on each; cookie slide L80-98.
  - `src/lib/auth.ts`: `currentViewer = cache(…)`, `getUser` L36, so 2 Auth calls per page render.
  - `src/lib/supabase/server.ts`: a new client per call.
  - `next.config.ts`: no prefetch, staleTimes or caching settings.
  - 126 `<Link>`, with one `prefetch={false}`.
  - 40 files `force-dynamic`.
  - No `revalidate`, `unstable_cache` or `"use cache"` anywhere.
- **Learner journey:**
  - `src/app/belajar/actions.ts`: 13 actions → `src/lib/assessment-engine/index.ts`, one RPC each, all SECURITY DEFINER.
  - `src/app/belajar/_components/ItemPlayer.tsx`:
    - outbox `pintar.outbox.<session>.<item>.<seq>` in localStorage (IP:92-143);
    - offline vs refused (IP:210-247);
    - 5 s assistance poll (IP:388-393);
    - 1 s display timer (IP:398-405);
    - integrity observations (IP:355-369, 424-427);
    - finish flow (IP:301-341).
  - `PermukaanAsesmen.tsx`: `session_state.authoritative_deadline` fetched, not passed.
  - `LessonPlayer.tsx`: one `record_lesson_progress` per newly reached page; device position in localStorage keyed by person (`src/lib/posisi-perangkat.ts`, W2).
  - `src/app/belajar/page.tsx`: 9 + 2N + F calls, about 9–10 sequential.
  - `src/app/api/assets/read-url/route.ts`: media through signed URLs, 3600 s.
- **Server authority (migrations):**
  - `record_answer` decides LIVE / REPLAYED / LATE_SYNC (`…an_answer_is_never_lost_to_a_finish.sql`:130-160). The client's mode "is recorded as a claim and never trusted as a verdict" (`…resilience_late_sync_termination.sql`:4-23).
  - Server clocks:
    - `received_at = now()`;
    - `first_viewed_at = now()` (DELIV:148);
    - session stamps by trigger.
  - The `client_asserted_at` column is stored and never trusted; the app sends null.
  - Finish verifies a manifest against held receipts (R1:272-291).
  - Grading is in `grade_response`, `evaluate_session` and `finalize_session`.
  - Seals:
    - `plp_releases.content_sha256`;
    - the pass-mark seal triggers;
    - `responses.value_digest`;
    - signed certificates.
  - `assistance_state` is **not read-only**: when help becomes due it inserts the grant and the OFFERED telemetry (LPA:362-371).
- **Absent from the codebase:**
  - Service Worker, web manifest, IndexedDB, BroadcastChannel, Web Locks, WebSocket, SSE, Realtime, `sendBeacon`.
  - Any reader of `assessment_definitions.offline_tolerant`.
  - Any heartbeat or lock: D-055 / BOB-29 are TODO.

### 2.3 Not found in the repository

- No browser or device mix of PINTAR's users.
- No school device inventory, beyond these qualitative lines:
  - "shared classroom tablets" (D-009);
  - "computer lab" (SSC:36);
  - the tester form's laptop / tablet / phone and "HP Android, Chrome".
- No connectivity measurements from Indonesia.
- No 4.5 / 5.0 roadmap beyond HR.
- "Adaptive Identity", "Performance Distribution", "Learning System Composer": not in any doc. "Unusual sign-in" exists only as D-088(j): "adaptive unusual-access checks are 4.5".

### 2.4 External sources [X]

- **Chrome Local Network Access** (public site → loopback/private needs a permission):
  - shipped in Chrome 142;
  - WebSocket/WebTransport covered from 147;
  - the temporary enterprise opt-out removed in Chrome 156 (stable 20 Oct 2026);
  - `LocalNetworkAccessAllowedForUrls` pre-allows named origins on managed browsers.
  - Sources: [blink-dev intent](https://groups.google.com/a/chromium.org/g/blink-dev/c/cwu_RUmBpzY), [WICG spec](https://wicg.github.io/local-network-access/), [OpenReplay explainer](https://blog.openreplay.com/chrome-local-network-access-lna-permission/), [Chrome 156 note](https://www.superchargebrowser.com/library/chrome-156-local-network-access), [policy write-up](https://patchmypc.com/blog/the-localnetworkaccessallowedforurls-policy-you-never-deployed/), [Microsoft eCDN guidance](https://learn.microsoft.com/en-us/ecdn/how-to/configure-local-network-access-policy).
- **Safari** blocks `http://127.0.0.1` / `localhost` from https pages as mixed content: [WebKit bug 171934](https://bugs.webkit.org/show_bug.cgi?id=171934).
- **Chrome MV3 extension service worker:**
  - stops after 30 s idle;
  - `chrome.alarms` minimum period 30 s (Chrome 120+);
  - timers do not survive shutdown.
  - Source: [Chrome docs](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle).
- **Web page → extension messaging** (`externally_connectable`):
  - Chrome and Edge support it; Firefox does not (a content-script bridge is needed): [MDN](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/externally_connectable), [Chrome docs](https://developer.chrome.com/docs/extensions/develop/concepts/messaging).
  - Safari Web Extensions ship inside an app through App Store Connect: [Apple](https://developer.apple.com/safari/extensions/).
- **Background Sync:** Chrome, Edge, Opera and Samsung Internet only; no Safari or Firefox ([compatibility summary](https://www.lambdatest.com/web-technologies/background-sync)).
- **Windows signing:**
  - EV certificates no longer give instant SmartScreen reputation;
  - Azure Artifact Signing is $9.99/month (Basic) and builds reputation over releases.
  - Sources: [Microsoft SmartScreen](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/smartscreen-reputation), [Azure Artifact Signing](https://azure.microsoft.com/en-us/products/artifact-signing).
- **Indonesia:** more than 1.2 million Chromebooks distributed to 65,000+ schools under the 2019–2022 digitalisation programme. Reported classroom use is low, and the procurement is the subject of a corruption case.
  - Sources: [Kejaksaan](https://story.kejaksaan.go.id/hot-issue/perkiraan-kerugian-rp198-triliun-program-digitalisasi-pendidikan-kemendikbudristek-ajukan-pengadaan-12-juta-chromebook-mvk.html), [CNN Indonesia](https://www.cnnindonesia.com/nasional/20250724060925-20-1254192/belajar-pakai-chromebook-di-sekolah-indonesia-bagaimana-realitanya), [detik](https://www.detik.com/edu/sekolah/d-7957808/kilas-balik-pengadaan-chromebook-yang-seret-nama-eks-mendikbud-nadiem).

---

## 3. Current 4.0 workload baseline

### 3.1 One Uji Penguasaan sitting through the real app

Browser 50, run 36979562623, per learner. Every figure is [M].

| Item | Count | Of which |
|---|---|---|
| Server actions started | **43.5** (33.4 answered, 10.1 cancelled by the browser after the server did the work) | assistance 22.8 · noteView 8.0 · saves 9.4 · start 1 · finish 1 · other ~1.3 |
| RSC fetches | **24** (14.6 answered, 9.2 cancelled) | ~19 prefetches |
| Document loads | 2 | — |
| Auth lookups (network round trip to Supabase Auth) | **78** | ~43 actions · ~24 RSC · ~4 pages (2 per render: proxy + `currentViewer`) |
| Database work in the window | **285 ms, 20,300 buffers** | incl. the Pemetaan Awal and page renders; learner RPCs alone 77 ms after the draw fix (89 ms before) |
| Unit costs | — | assistance check 1.2–1.4 ms · save 1.7 ms · start 19 ms (was 25 ms) |
| Save p95, press → «Tersimpan» | **1,366 ms** from GitHub's US runners | the same journey by RPC: 289 ms; from Indonesia: **[U]** |

The sitting lasts about 2 minutes. Learners answer within the 25 s hesitation window, so every assistance check in the measured journey answered "not yet" [M, EA §5].

### 3.2 Other journeys (WSA §3, EA, code)

| Journey | Auth | Calls | Database | Grows with |
|---|---|---|---|---|
| Any page (shell) | 2 | 3 | ~1.5 ms [M] | — |
| /belajar | 2 | 9 + 2N + F, ~9–10 sequential | ~20 ms per assignment [M] | assignments over the year |
| Lesson page load | 2 | ~6 + media items | small [M] | media items |
| Lesson page turn | 1 | 1 (`record_lesson_progress`, once per page newly reached) | small [M] | — |
| Teacher class view | 2 | ~18, ~8 sequential | 43 ms (RLS per student) [M] | class size |
| /pimpinan, school root | 2 | 14 + 8K | ≈ 2.8 s (26 classes) [M] | classes × history |
| Konfigurasi, school admin | 2 | 26 + K | two reads 2,469 → 21 ms (fixed) [M] | — |

### 3.3 After the already-approved correction

The approved correction is the event-driven assistance check (owner ruling, 2 Oct). It is not yet built, because the heartbeat question is with the owner.

| Per sitting | Today [M] | After the approved fix [C] |
|---|---|---|
| Server actions | 43.5 | **≈ 20.7** (43.5 − 22.8) |
| Auth lookups | 78 | **≈ 55** (78 − 23) |
| Learner RPC database time | 77–89 ms | **≈ 53–65 ms** (−24 ms of `assistance_state`; −27% of the RPC journey) |
| Saves waiting behind a check | yes (F3) | no; the size of the tail improvement is **[U]** until measured |

**Rule for this study:** none of the assistance reduction is credited to any Local Experience Layer.

---

## 4. A/B/C/D work classification

Verified against the code and the migrations, not assumed.

### A — Authoritative: must reach the trusted boundary

| Operation | Why it is A (evidence) |
|---|---|
| Sign-in, session validity, sign-out | Supabase Auth is the authority. D-055 / C4 forbid any client-only lock |
| Authorisation, RLS reads | INV-13, INV-37: "security is enforced at the server/data boundary" |
| Start: the draw (`start_learning_session`) | Item security (INV-12); the paper is server-drawn; D07: "never draws new items" offline |
| Item first view (`note_item_view`) | `first_viewed_at = now()` on the **server clock** (DELIV:148; ADR-0005 §5: "a client-side timer is rejected … as spoofable"). It starts the hesitation clock |
| Answer receipt (`record_answer`) | Server stamps `received_at`, decides LIVE/REPLAYED/LATE_SYNC, `value_digest`, idempotency (INV-28) |
| Assistance eligibility and content (`assistance_state`, `open_assistance`) | D07:141-145: the timer runs server-side; never served offline. `assistance_state` writes the grant when due |
| Finish, grading, pass/fail | `finish_my_session` → manifest check → `finalize_session` → `evaluate_session`; pass mark sealed (INV-09, D-081, D-088(b)) |
| Integrity observations (`record_integrity_signal`) | Stored server-side as observations, never read by scoring (assertion function). The *content* is client-asserted |
| Certificates, verification | Server-signed payload (INV-05/07, ADR-0013) |
| All staff writes: structure, roles, Pendataan, Studio, publishing, pass marks | Institutional records; audited |

### B — Synchronisation: may happen locally first, must sync, the server decides

| Operation | Already local-first? | Safe locally because |
|---|---|---|
| Answers while offline | **Yes**: the durable outbox, replay on mount / `online` / finish (IP:254-310) | The server decides the receipt mode and scoring; the client's mode is a claim (LATE:4-23) |
| Lesson progress | Partly: the device position is local (W2); the server count is sent per new page | Low stakes. **Caveat:** `total_positions` comes from the client (LPA:182-184; HR:104), an existing 4.0 weakness that no local layer should widen |
| Integrity observations | No (fire-and-forget) | Observations only; at most one per 10 s per category |
| Dismissed-help telemetry, feedback text | No | Telemetry or anonymous feedback |

### C — Local coordination: needs no server

| Operation | Today |
|---|---|
| Elapsed-time display | Local (IP:398-405); "the server owns the deadline; this is display" |
| *When* to ask the server about assistance next | Today a 5 s poll. After the approved fix, scheduled from the server's own `window_seconds` / `dwell_seconds`. Local scheduling of a server decision |
| Connectivity awareness | Browser events plus request results. The poll is also the only periodic probe (reported to the owner 2 Oct; options A/B/C pending) |
| Tab coordination (one sitting open in two tabs) | None. Two tabs share the outbox keys and may both flush; the server's idempotency (PR001) keeps it correct but noisy [code] |
| Lesson page and media position on this device | Local, keyed by person (W2) |
| Language mirror | Local |

### D — Accidental / chatter: remove it, do not move it

| Work | Size [M] | Correct remedy | Status |
|---|---|---|---|
| Assistance polls before the window, after an answer, and where no help is configured | 22.8 actions + 23 Auth per sitting; 36% of calls at 1,000 | Event-driven scheduling, silent when not configured | **Approved**; heartbeat question with the owner |
| Auth round trip on every prefetch | ~19 per sitting | No Auth on prefetch, or no prefetch on selected learner links | Owner (auth / perceived speed) |
| Second Auth round trip per render (proxy + viewer) | ~1 per page | `getClaims()` for reads | Owner (auth) |
| Actions cancelled after the server did the work | 10.1 per sitting (mostly polls at navigation **[U]**) | Disappears largely with the event-driven check **[E]** | — |
| /belajar re-running `my_learning_assignments` per assignment; lesson bodies fetched only to count | 2 RPCs per assignment | One progress RPC | "Recommend before scale" |
| /pimpinan live figures | ≈ 2.8 s per school view | Snapshot or cache with stated freshness | Owner |
| A check refused after hand-in shown as «Sedang luring» | 0.7% of checks at 50 | Goes with the event-driven check | With the approved fix |

**What the classification says.** No local layer has a claim on D: the remedy is to stop doing the work, for every user, in the app. A is not movable. That leaves B and C as the only candidates for a local layer, and both are small in requests. Their value, if any, is in **resilience and perceived latency**, not in cloud workload.

---

## 5. Browser-only opportunity (rungs 1 and 2)

What a normal modern browser can do safely, with no installation, on desktops, Chromebooks, Android and iPad alike.

| Capability | Browser mechanism | Covers PINTAR's need? | Notes |
|---|---|---|---|
| Scheduling the next assistance check from server data | `setTimeout` from `window_seconds − dwell_seconds`; Page Visibility to re-check on return | **Yes** | Background-tab timer throttling is harmless: help is not needed in a hidden tab, and the server's clock keeps running |
| Connectivity awareness | `online`/`offline` events; request results; a probe **only while offline** to a path the proxy does not touch (owner option A) | **Yes** | Zero requests while connected |
| Durable answer queue | localStorage today; IndexedDB if the queue grows | **Yes** (exists) | Values are on-screen positions only, no person, no correctness (`kumpulkan.ts`:13-16) |
| Tab coordination | BroadcastChannel, Web Locks (`navigator.locks`) | **Yes** | One flusher per sitting; tell the second tab "sitting open elsewhere" |
| Reload while offline | **Service Worker** shell cache plus an offline fallback for the sitting route | **Yes: the one material resilience gap today** | Today a reload during a drop shows the browser's error page. Answers are safe in storage, but the learner sees nothing |
| Delivering held answers after the tab is closed | Background Sync | **Partly**: Chrome/Edge only [X] | The page already replays on next open; finish is refused while anything is held |
| Immutable lesson content cache | SW cache, or HTTP `Cache-Control: immutable` keyed by release hash (releases are sealed by `content_sha256`) | **Yes, with care** | Shared devices: clear on sign-out (`Clear-Site-Data`), never cache across persons. Tenant scope (INV-13) means person/session-scoped caches only |
| Instant navigation without per-prefetch Auth | Next config; `getClaims()` | **Yes** (server-side) | Owner decisions |
| Activity / idle detection for the shared-device lock (D-055) | In-page input events; the Idle Detection API (Chrome, needs permission) | **Enough** | D-055: the server judges idleness from a heartbeat; "a client-only lock is never shipped" |
| Device continuity signal | A non-extractable WebCrypto key in IndexedDB, per browser profile | Weak signal only | Same trust as an extension or native key: attacker-controlled (§7) |
| Cross-device handoff / QR | Server-issued tokens; camera via `getUserMedia` / BarcodeDetector | **Yes** | The authority is the server either way |

**Limits of the browser:**
- no execution when no PINTAR tab is open, except Background Sync on Chromium;
- no OS-level idle or lock state without a permission prompt;
- storage the user can clear.

None of these limits blocks a need found in §4.

---

## 6. Companion opportunity (rungs 3 and 4)

Each candidate from the brief, against the 14 questions. To keep the table readable, the four questions every candidate answers the same way are answered once here:

- **Q9 (maliciously modified):** whatever it says is a client claim (§7).
- **Q11 (shared device):** local state must be person-keyed and cleared on sign-out.
- **Q12 (sensitive):** answers and lesson content are tenant data.
- **Q13 (encryption):** gives nothing against the device's own user, since the key is on the device. It protects only against other OS accounts, which the OS already separates.

Ext = extension; Nat = native.

| Candidate | 1. Browser already adequate? | 2. What Ext/Nat adds | 3. Fewer cloud requests? | 4. Better perceived latency? | 5. Better resilience? | 6. New exposure | 7–8. Crashed / outdated | 10. Unreachable | 14. Worth it? |
|---|---|---|---|---|---|---|---|---|---|
| Local timers | Yes | Nothing (MV3 alarms ≥30 s are coarser than `setTimeout`) | No | No | No | — | Fall back to the page | Page does it | **No** |
| Assistance scheduling | Yes (server data + `setTimeout`) | Nothing | No (the approved fix already gets ~0) | No | No | — | — | — | **No** |
| Connectivity detection | Yes | Ext: an OS network-change event, same as `online`/`offline`. Nat: interface state | No | No | Marginal | Nat: a network listener | Page fallback | — | **No** |
| Network-quality awareness | `navigator.connection` (Chromium) plus request timings | Nat: link metrics | No | No | Marginal | Fingerprinting surface | — | — | **No** |
| Temporary safe queues | Yes (outbox) | Ext: `chrome.storage` survives "clear site data". **A negative on shared devices** (person-bound rule, D-085 T1) | No | No | No | Answers outlive the person's session | Lost queue if the extension is removed | Page queue | **No** |
| Retry coordination | Yes | Ext: retry when no tab is open, but it needs the learner's credentials (§7) | No | No | Small | Credential exposure | — | — | **No** |
| Tab / session coordination | Yes (BroadcastChannel, Web Locks) | Ext: sees all tabs, which is surveillance | No | No | Small | `tabs` permission reads browsing history | — | — | **No** |
| Device / session continuity | Weak signal in the browser (§5) | Nat: hardware IDs (spoofable, privacy) | No | No | No | Device fingerprinting | — | — | **No** |
| Safe local caching | Yes (SW, HTTP cache) | Nothing beyond the SW; only reaches adopters | Only lesson revisits, ∝ adoption | Small on revisits | Small | Tenant data outside the origin's clear-data | Stale cache | Network | **No** (do it in the SW) |
| Local preloading | Yes (prefetch, SW precache) | Nothing | **More** requests if over-eager | Yes | — | — | — | — | **No** |
| Browser ↔ desktop handoff, QR handoff | Yes (server token; camera in the browser) | Nat: deep links into another app PINTAR doesn't have | No | No | No | Protocol-handler abuse | — | — | **No** |
| Offline / poor network | Mostly (outbox + SW fallback) | Ext/Nat: delivery after the tab closes; Background Sync already does this on Chromium | No | No | Small | Background credentials | — | — | **Not now** |
| Local activity signals (shared-device lock) | Yes (in-page activity; the server judges idleness) | Ext: `chrome.idle` OS idle/locked state | No | No | No | Activity telemetry beyond the page (HR:68-69) | — | — | **No**; D-055 forbids a client-only lock anyway |
| Adaptive Identity signals (4.5) | Server-side signals (IP after BOB-12, device-context cookie BOB-29) | Ext/Nat: device key, hardware data | No | No | No | Spoofable; privacy | — | — | **No** (§7, §21) |
| Upload / download coordination | Yes (signed upload URL; resumable uploads possible) | Nat: large-file background upload | No | Small for authors | Small | File-system access | — | — | **Not now** (rare, staff-only) |
| Media handling | Yes (signed URLs, the browser's media cache; SW for offline) | Nat: disk cache for long video | Bandwidth only, ∝ adoption | Small | Small | Disk-cached tenant media | — | — | **Not now** (media out of scope, D-050) |
| Safe background synchronisation | Background Sync (Chromium) | Ext: alarms; needs credentials | No | No | Small | Credentials | — | — | **No** |
| Context Passport support (4.5) | Server snapshots plus a QR | Nothing | No | No | No | — | — | — | **No** |

**The honest residue.** Exactly one capability is not fully covered by the browser: **work while no PINTAR tab is open** (delivering held answers, a reminder). It is covered on Chromium by Background Sync. Its value is bounded by how often learners close the tab with answers held and do not come back before the grace window ends, and that is **[U]** (experiment E4).

---

## 7. Proposed trust boundary

**The client is everything on the learner's or teacher's device: page, Service Worker, extension and native process alike. All of it is attacker-controlled.**

A capable user can inspect and replay traffic, edit storage, kill or replace processes, change the clock, call IPC or extension messages directly, run VMs or many profiles, and downgrade software. Installation by PINTAR confers **no** trust: a signed binary proves who built it, not what is running.

**The server stays authoritative for everything that could change:**
- identity;
- permission;
- evidence (receipt time, receipt mode, which answer counts);
- assessment state (draw, deadline, grace);
- grading and the pass mark;
- integrity judgements;
- institutional records;
- certificates.

PINTAR already enforces this:
- INV-08: the person is derived server-side;
- INV-09: scores server-side;
- ADR-0005 §5: server clock on first view;
- `received_at = now()`;
- the client mode recorded "as a claim";
- the finish manifest checked against held receipts.

**What the server may accept from the client, and how:**

| Client input | Accepted as | Why that is safe |
|---|---|---|
| The learner's own answer value, `client_seq` | The learner's claim about their own answer | They are entitled to choose their own answer. Ordering only selects among their own answers |
| "Offline / replayed" mode | A claim, recorded | The server recomputes LIVE / LATE_SYNC from its own clock |
| Integrity observations (visibility, reconnect, rapid change) | Observations for a human reviewer | Never scored (assertion function); D06:110 data minimisation |
| Lesson position / total | Progress claim | **Existing weakness:** the client's total can mark a lesson read (LPA:182-184; HR:104 already names it). Fix server-side before 5.0; no local layer should depend on it |
| Device key signature (any rung) | "The same browser profile / install as before" | Weak continuity signal only. It cannot prove a human, a device, or that the content is true |

**Cryptographic device identity and signed local messages.**
- **Some value:**
  - binding a session to a device key makes stolen cookies harder to replay elsewhere. Chrome's browser-native Device Bound Session Credentials target exactly this, with no PINTAR software [X, to verify];
  - a stable per-install key is a *risk signal* for 4.5's unusual-access checks on **staff** accounts.
- **No value:**
  - signing what an attacker-controlled process says (idle time, time on question, "the answer was given at 10:02") proves only that the attacker's process signed it;
  - hardware attestation (TPM, Secure Enclave) is heavy, platform-specific and privacy-invasive, and it attests the device, not the answer;
  - none of it can protect evidence. **Evidence integrity must keep coming from server receipt, not from client signatures.**

---

## 8. Candidate architectures

| # | Model | Shape | Reaches | Verdict |
|---|---|---|---|---|
| 1 | **Current web PINTAR** (after the approved assistance fix) | Browser ↔ Cloud | every device | Baseline |
| 2 | **Local-first browser** | Browser (page plus outbox, scheduler, tab lock) ↔ Cloud | every device | **Recommended core of 4.1** |
| 3 | **PWA / Service Worker** | Browser + SW (shell cache, offline fallback, immutable lesson cache) ↔ Cloud | every modern browser (Background Sync on Chromium only) | **Recommended, narrowly** (§18) |
| 4 | **PINTAR browser extension** ("PINTAR Companion") | Page ↔ extension (`externally_connectable`); page ↔ Cloud direct; extension ↔ Cloud **only** for a named function | Chrome/Edge desktop and ChromeOS; Safari via an app; **not** Android Chrome or iPad without an app | **Not now**: no capability found that needs it |
| 5 | **Native companion** | Page ↔ (extension ↔ native messaging host) or page ↔ localhost; page ↔ Cloud direct | Windows/macOS only | **No**: dominated by 4, and blocked or prompted on Chrome/Safari (§9) |
| 6 | Hybrid: extension plus a tiny native host | As 5, through native messaging | Windows/macOS | Only if an OS-level capability is ever required. **None is** today |

**Topology, if any companion is ever built:**
- Do **not** route Browser → Companion → Server.
- Authoritative traffic stays **page ↔ server, direct**, with the page's own session.
- The companion talks to the server only for an explicitly justified function. It then needs its own credential, scoped to that one function, never the learner's session cookie.

---

## 9. Browser ↔ Companion communication options

| Mechanism | Chrome / Edge | Safari | School environments | Security | Verdict |
|---|---|---|---|---|---|
| **localhost HTTP / WebSocket** | **Permission prompt** for every public site → loopback (Chrome 142+; WebSockets from 147; enterprise opt-out removed in 156 on 20 Oct 2026; only `LocalNetworkAccessAllowedForUrls` on managed browsers avoids it) [X] | **Blocked** as mixed content from https (WebKit 171934) [X]. The workaround is a locally trusted TLS root, which is unacceptable | Firewalls / EDR flag local listeners; port collisions; **two OS users on one PC each run a listener on one port** | CSRF and DNS rebinding need Origin checks plus a per-install secret; any local process can call it | **Reject** |
| **Native messaging** (extension ↔ native host via stdio) | Supported; the host is registered in the registry or a manifest directory | Through the Safari app extension's containing app | Needs the extension **and** an installer | No network listener; only the named extension may connect | The only sane native path; **implies an extension** |
| **Custom protocol handler** (`pintar://`) | Launch only, with a prompt; one-way, no reply | Same | Often blocked by policy | Handler abuse by other sites | Handoff only; **no use found** |
| **Extension messaging** (`externally_connectable`) | Supported; restricted to PINTAR's origins by match patterns | Supported (Safari Web Extension) | Force-install by policy (Google Admin, Intune / GPO) | Only PINTAR's origins can message. The page must still treat every reply as a client claim. **Two store IDs** (Chrome, Edge) to know | **Best channel if an extension is ever built** |
| Content-script `postMessage` bridge | Works | Works | — | Any script on the page can spoof; widens XSS impact | Fallback only (Firefox) |

**Cross-cutting requirements, if ever built:**
- version negotiation: the web app deploys many times a day, while stores review for days;
- the page must work identically when the companion is absent, stale or lying;
- multiple simultaneous sessions: per-tab message routing;
- rollback: store rollback is slow, so every companion feature needs a server-side kill switch.

---

## 10. Technology options

**Extension (rung 4).**
- TypeScript, Manifest V3, sharing types with the web app. Size well under 1 MB [E].
- No resident process: the MV3 worker stops after 30 s idle [X], so the idle RAM/CPU cost is the browser's own.
- Frameworks (WXT, Plasmo) ease the multi-browser builds [E].

**Native host (rungs 5 and 6), if ever.** Idle figures are [E], not measured.

| Option | Binary | Idle RAM | Cross-platform | Fit |
|---|---|---|---|---|
| **Rust** (single static binary, native-messaging host) | ~2–8 MB | ~5–15 MB | One codebase; Windows ARM64 / x64, macOS universal | **Best fit** for a stdio host; hiring and maintenance are scarcer |
| **Go** | ~8–20 MB | ~10–25 MB | One codebase; easy cross-compiling | Good; larger runtime |
| **.NET NativeAOT** | ~10–30 MB | ~20–40 MB | One codebase; macOS tooling weaker | Acceptable |
| Swift (mac) + C# (Windows) | small | small | **Two codebases** | Reject (capacity) |
| Tauri | ~3–10 MB plus the system WebView | ~30–80 MB | Built for UI apps | Wrong tool: PINTAR needs no desktop UI (its signing / updater tooling is useful) |
| Electron | ~100–200 MB | ~100+ MB | — | Reject |

---

## 11. Windows deployment (native rung)

| Need | What it takes | Burden |
|---|---|---|
| Installer | MSIX or MSI; per-user (no admin) vs per-machine (admin) | Restricted student accounts **cannot** install per-machine; per-user installs multiply per OS account on shared PCs |
| Code signing | Azure Artifact Signing ($9.99/month) or an OV certificate; EV no longer gives instant SmartScreen reputation [X] | **SmartScreen warnings on early releases** until reputation builds [X], which is bad on a teacher's first contact |
| Startup / background | Run key or scheduled task; the native-messaging host is launched by the browser on demand (no resident service) | A resident service raises EDR attention and support load |
| Updates | Own updater (Velopack, WinSparkle) plus signing in CI; staged rollout; rollback | A permanent release pipeline |
| Uninstall | Clean removal of the registry host manifest | Orphaned hosts break extension messaging |
| School-managed PCs | Intune / GPO / SCCM silent install, version pinning | Many Indonesian schools have **no** device management **[U]** |
| Platforms | Windows 10 (end of support Oct 2025, still common in schools [E]), Windows 11, x64 + ARM64 | QA matrix |

## 12. macOS deployment (native rung)

| Need | What it takes | Burden |
|---|---|---|
| Signing / notarisation | Apple Developer Program ($99/year); Developer ID; hardened runtime; notarisation in CI | Every release is notarised; certificate renewals |
| Background | A browser-launched native-messaging host (preferred), or a login item through `SMAppService` (macOS 13+), which shows a user-visible "Login Items" notice | Users see and disable login items |
| Sandbox | Not needed outside the Mac App Store. The Safari extension path **requires** an App Store or notarised container app | Two packaging paths (App Store for Safari, Developer ID for Chrome hosts) |
| Updates | Sparkle (signed feeds) or App Store | Release pipeline |
| Permissions | None if the host does nothing privileged; any idle / accessibility / network-monitoring access triggers prompts | Prompt fatigue |
| Platforms | Apple silicon + Intel (universal binary); OS support window about the last 3 releases [E] | QA matrix |

**Extension distribution** (rung 4), for comparison:
- Chrome Web Store, with review measured in days [E];
- Edge Add-ons (separate listing and ID);
- Safari through App Store Connect inside an app;
- managed deployment by `ExtensionInstallForcelist` (Windows / Mac through Intune / GPO; ChromeOS through Google Admin, where enrolled **[U]**);
- automatic updates on store schedules, **not** on PINTAR's deploy schedule.

---

## 13. Security threat model

| Threat | Browser-only | Extension | Native |
|---|---|---|---|
| A learner forges or replays local messages | Already handled by server authority | Same; any extension message is a claim | Same |
| A learner changes the clock | Server clocks (`received_at`, `first_viewed_at`) | Same | Same |
| A malicious website talks to the companion | n/a | Only origins in `externally_connectable` | **localhost is reachable by any site the user allows** (LNA prompt), and by any local process; DNS rebinding and CSRF |
| **Supply-chain compromise** (developer account or update channel hijacked) | PINTAR's deploy pipeline only | **A malicious update reaches every installed browser automatically.** With `cookies` / `tabs` / broad host permissions it can read sessions and browsing of every student. Must hold minimal permissions, 2FA publishing, review | A signed malicious binary on every school PC: highest blast radius |
| Shared devices | Person-keyed storage (W2); clear on sign-out | `chrome.storage` survives site-data clearing, so data outlives the person | Files outlive OS sessions unless per-user |
| Privacy creep (activity, tabs, OS idle) | Page-scoped only | `idle`, `tabs`, `history` permissions invite surveillance PINTAR has ruled out (HR:68-69; D06:110: "no webcam/mic/screen/keylog") | Worse (OS-level) |
| Downgrade / stale version | Always current | The store updates eventually; old versions linger | Must enforce a minimum version server-side |
| Code injection into PINTAR pages | XSS (CSP) | A content script widens the attack surface | — |

**Security is acceptable only if:**
1. no companion ever holds the learner's session or a service credential;
2. it requests no `cookies`, `tabs`, `history` or broad host permissions;
3. the page treats its every reply as a client claim;
4. the server keeps every decision listed in §7.

Under those constraints the companion can do almost nothing the page cannot (§6). **That is the core finding.**

---

## 14. Failure / fallback model

**The principle tested:** "No Companion: PINTAR works. With Companion: faster and/or more resilient."

| Situation | Expected degradation (any rung, designed correctly) |
|---|---|
| Companion absent, stopped, updating, incompatible, corrupt | The page detects it within one message timeout and runs its own browser-only path. No user-visible difference beyond losing the enhancement |
| Browser upgraded (MV3 / LNA changes) or OS upgraded | The extension or native path may break silently. **The kill switch is server-side** and pages fall back |
| No internet / intermittent | Unchanged from 4.0 plus the SW fallback: answers queue, finish waits, «Sedang luring…» shown |
| Server unavailable | Same as no internet. Nothing authoritative continues |
| Browser reaches server, Companion cannot | Irrelevant if authoritative traffic is page-direct (§8). **Harmful** if traffic were routed through the companion |
| Companion reaches server, browser cannot | The companion must **not** act for the learner. It holds no session (§13) |

**Where the principle cannot hold:**
- any capability whose value exists **only** with the companion, such as background delivery after the tab closes, or OS-level idle;
- a native companion on **Chrome with LNA** for unmanaged users, where the prompt itself is a user-visible degradation;
- Safari over localhost, which is impossible.

---

## 15. Performance model

Per Uji Penguasaan sitting. Columns:
- **4.0** = today [M];
- **4.0+A** = after the approved assistance fix [C];
- **+S** = 4.0+A plus the owner-pending **server-side** options (`getClaims()` for reads, no Auth on prefetch) [C, conditional on owner rulings];
- **Br** = +S plus browser local-first and SW [C/E];
- **Co** = Br plus an extension or native companion [C].

| Measure | 4.0 | 4.0+A | +S | Br | Co |
|---|---|---|---|---|---|
| Server actions | 43.5 | ≈ 20.7 | ≈ 20.7 | ≈ 20.7 (all A) | ≈ 20.7 |
| RSC fetches | 24 | 24 | ≈ 24 (prefetch kept, but cheaper) or ≈ 5 (prefetch off) | same | same |
| Auth network lookups | 78 | ≈ 55 | ≈ 21–25 (writes keep `getUser`) | same | same |
| Learner RPC database time | 77–89 ms | ≈ 53–65 ms | same | same | same |
| Whole-window database time | 285 ms | ≈ 255 ms (−~30 ms of checks) | small further gain (Auth DB cost ~0.1 ms each) | same | same |
| Save waits behind a check | yes | no | no | no | no |
| Reload while offline | page lost (answers safe) | same | same | **page kept** (SW fallback) | same as Br |
| Bytes | **[U]** (RSC payloads not measured) | — | less with fewer prefetches | less on lesson revisits (immutable cache) | same as Br |

The Auth arithmetic for +S: actions ≈ 21 keep `getUser`; reads move to `getClaims()`. `getClaims()` verifies locally only with asymmetric JWT signing keys; otherwise it calls Auth (**[X]**, to verify on staging).

**Other journeys:**

| Journey | Where its time goes | What helps | Local-layer share |
|---|---|---|---|
| Learner sign-in (email link, class card) | Auth, email, `createUser`/`signIn` | Nothing local: authority | **0** |
| /belajar | 9–10 sequential round trips (~10–30 ms each in sin1 [M, WSA §6]); grows 2 RPCs per assignment | Server: parallelise the independent reads and one progress RPC. ~60–80 ms saved now [E]; more as N grows | **0** |
| Lesson navigation | 1 action per new page; a full page per lesson | Server (fewer reads per page); SW immutable cache on revisits | Small, browser-only |
| Answer saving | Request path to sin1 plus Auth plus 1.7 ms RPC; **«Tersimpan» must be a server ack** (STU-09) | Fewer queued actions (approved); no Auth round trip [owner]; a measuring point near learners | **0**: the acknowledgement is authoritative |
| Assistance | — | The approved fix | **0** unique |
| Finish | Flush, manifest, grading | Nothing local | **0** |
| Teacher class view | ~18 calls, ~8 sequential; RLS per student 43 ms | Server: parallelise `konteks` | **0** |
| /pimpinan, Konfigurasi, Studio | Live figures; RLS | Server: snapshots (owner); done for Konfigurasi | **0** |

**Perceived latency.**
- From Indonesia, the remaining cost of an action is network RTT to Singapore plus the function, Auth and the RPC. It is **[U]**: every PINTAR latency figure was taken from US runners or inside sin1.
- A plausible range is 100–300 ms p50 [E]. Below ~100 ms, users do not perceive the difference (D-047(b): acknowledgement < 100 ms is met by the immediate UI, not by the server).
- A local layer cannot shorten an authoritative acknowledgement. It can only show "kept on this device", which the outbox already does before sending.

---

## 16. Adoption scenarios: 25 / 50 / 70 / 90%

**Adoption does not equal savings.**
- The 70% "desktop" share is a planning hypothesis **[U]**. PINTAR has no device or browser data.
- D-009 names "shared classroom tablets"; tester guidance names "HP Android, Chrome".
- An extension or native companion cannot run on Android Chrome or iPad without an app.

Let *a* be the share of sittings with a companion. Per 1,000 sittings, assuming 4.0+A and +S are applied to everyone:

| | 25% | 50% | 70% | 90% |
|---|---|---|---|---|
| Requests removed **uniquely** by the companion | ≈ 0 | ≈ 0 | ≈ 0 | ≈ 0 |
| Auth traffic removed uniquely | ≈ 0 | ≈ 0 | ≈ 0 | ≈ 0 |
| Application compute | ≈ 0 | ≈ 0 | ≈ 0 | ≈ 0 |
| Database workload | ≈ 0 | ≈ 0 | ≈ 0 | ≈ 0 |
| Bandwidth (lesson revisits only, if the companion cached; **the SW does the same for 100%**) | 0.25 × r × L | 0.5 × r × L | 0.7 × r × L | 0.9 × r × L |
| Infrastructure scaling pressure | none | none | none | none |

*r* = the revisit share of lesson loads **[U]**; *L* = bytes per lesson load **[U]**.

**Why ≈ 0.** Every remaining request is A-class, and every D-class request is removed in the app for everyone. If the D-class work were *not* removed in the app, a companion still could not remove it: prefetches, render-time Auth and the poll are issued by the page itself.

**Comparison: the browser-only measures apply at *a* = 100%, on every device, from the day they deploy.**

---

## 17. The 1,000-learner question

Analysed, not rerun (D-089(b); D-090).

| Part of the 1,000 RPC wave (run 36964437916) [M] | Size | Class | After approved fixes | Could move local? |
|---|---|---|---|---|
| Assistance checks | 20,002 of 54,812 calls (36%) | D | **Removed** | — |
| Starts (the draw) in the first minute | 1,000; ~19 ms each after the draw fix (was 25 ms); about 19–25 s of database work in a burst on 2 shared cores | A | Same | No |
| Views, saves, finishes, papers | the remaining ~34,800 calls (exact split **[U]**) | A | Same | No (queue only) |
| Real-app extras the RPC wave did **not** include | per learner: 78 vs ~14 Auth; ~3× the database work (285 vs 89 ms, with renders and the Pemetaan Awal) | D (prefetch / Auth) and A (renders) | Reduced by +S | No |

**Result.**
- After the approved fix, the wave is about 35k calls with the same synchronized start burst.
- CPU saturation at 98% came from synchronisation on 2 shared cores (EA §3). The authoritative start and save path dominates the remainder.
- The real app would ask more of the database than the wave did (EA §10).
- **A Local Experience Layer is likely to have little impact on the 1,000 result.**
- The levers that matter are:
  - the approved fix;
  - the request-path options (+S);
  - smoothing the synchronized start, a server/product option such as pre-drawing papers when an assignment opens (not ruled, not proposed here);
  - compute (CAP-08).
- Whether 1,000 fits after these is **[U]**. It needs a measured run when the owner chooses (D-089).

---

## 18. Poor-connectivity / offline implications

Indonesia's conditions are high RTT on mobile networks, unstable school Wi-Fi, brief drops, and LAN up while WAN is down. Measurements: **[U]**; none exist from Indonesia.

**What PINTAR already does [M, code]:**
- the durable outbox written before sending;
- replay on load, on `online` and at finish;
- the server decides LIVE / REPLAYED / LATE_SYNC, with a grace window (scored inside, kept unscored beyond);
- finish refuses while anything is held;
- STU-09 passed in a browser (S21): «Sedang luring…», never «sudah ditutup».

**The smallest useful resilience layer**, all browser-only:

| Situation | Continue safely | Queue | Must stop until authority | Tell the user |
|---|---|---|---|---|
| Brief drop mid-sitting | Answer the questions already on the page | Answers (exists), integrity observations, lesson progress | Start, finish, assistance, certificate | «Sedang luring…» plus "pending" (exists) |
| **Reload during a drop** | Today: **page lost**. With a SW fallback: the sitting shell with the held answers (only for definitions that allow offline answering; see below) | Same | Same | Same |
| Tab closed with held answers | — | Held on the device; replayed on next open (Background Sync on Chromium could send sooner) | Finish | "Answers waiting on this device" on next open |
| High latency | Everything, slowly | — | — | The existing pending label; no spinner lies |
| LAN up, WAN down | Same as offline. A per-device layer cannot make authority reachable; a school-local server is a different architecture, PARKED (D09:139) | Same | Same | Same |

**Two cautions:**
- `assessment_definitions.offline_tolerant` exists, is in the content hash, and is **read by nothing** [code]. Any SW work on the sitting route must make the server's rule explicit, not invent a client one (FM:36).
- Caching a sitting's paper is **item exposure** on shared devices. It is acceptable only for the live session, cleared at finish and sign-out.

---

## 19. Infrastructure-cost implications

- **Dollar savings cannot be credibly calculated, and the workload reduction attributable to a companion is ≈ 0** (§16).
- The current bill context:
  - Supabase Pro ($25/month) plus Micro compute (about $10/month) per project (D039:135-138) [M, docs];
  - Vercel Pro is needed before 1 Nov (D039:138).
- **What actually moves infrastructure:**
  - the approved assistance fix (−36% of calls at 1,000; −27% of learner RPC time);
  - the owner-pending request-path options;
  - /belajar and /pimpinan;
  - compute for real synchronized load (CAP-08).
- **None of these needs a local layer.**

---

## 20. Ownership / maintenance cost

All figures in this section are [E]; they are judgement, not measured.

| Item | Browser-only (rungs 1–2) | Extension (rung 4) | Native (rungs 5–6) |
|---|---|---|---|
| Build | Inside the existing app: about 1–3 weeks for the SW fallback, tab lock and offline probe | Initial 3–6 weeks; a second store listing; a Safari app wrapper if wanted | Initial 2–3 months: host, installers ×2, updater, signing, notarisation |
| Recurring | Part of normal web work | Store reviews; MV3 changes; permission and privacy reviews; version skew with daily deploys; about 0.1–0.2 FTE | Releases ×2 OS; certificates; notarisation; updater; crash reporting; OS and browser matrix; LNA and Safari issues; school IT support; about 0.3–0.5 FTE |
| Cash | none | Chrome Web Store $5 once; Apple $99/year for Safari | Apple $99/year; Azure Artifact Signing ~$120/year; crash reporting / telemetry service |
| QA matrix | Browsers PINTAR already supports | Chrome, Edge × Windows, macOS, ChromeOS (+ Safari) | Windows 10/11 x64/ARM64 × macOS (3 versions) × Intel/Apple silicon × Chrome/Edge/Safari |
| Support | None new | "Extension not detected / disabled / not allowed by school" | Installer failures, SmartScreen, antivirus quarantine, restricted accounts, per-user installs on shared PCs |
| Security review | Existing | Supply chain, permissions, store account security | All of the extension's, plus the binary supply chain and update channel |

**Against PINTAR's capacity:**
- PINTAR's development capacity is very limited.
- A native platform would be a **permanent** second product with no measured cloud saving to repay it (D-090: "Do not spend $3,000 to save 10 grams").

---

## 21. Relationship to PINTAR 4.5

| 4.5 concept | Where it lives | Does a 4.1 local layer help? |
|---|---|---|
| Question Intelligence, Performance Distribution, Report Intelligence, longitudinal trends | Server analytics over OFFICIAL evidence only (INV-20; HR:41-43, 145-163) | **No**: client data is not evidence |
| Context Passport / QR | Server-issued immutable snapshots (HR:150, 169); QR read by any camera | **No** |
| Adaptive identity / unusual sign-in | Server signals: IP after BOB-12, the hashed device-context cookie (BOB-29), session history. "No IP address in 4.0; adaptive unusual-access checks are 4.5" (D-088(j)) | **Marginal**: a client device key is a weak, spoofable signal (§7). The browser can hold one too |
| Conversational drill-down | Server, governed reads | **No** |

**Effect:** a companion would add coupling (versions, permissions, privacy review) to features that do not need it. The browser-level seams (local scheduling from server data, an offline probe, tab coordination) are neutral to 4.5.

## 22. Relationship to PINTAR 5.0

| 5.0 concept | Need | Does a 4.1 local layer help? |
|---|---|---|
| Learning System Composer (drag/drop, very responsive) | In-page client state with optimistic editing and server save; progression must be **server-side** before 5.0 (HR:104, 170) | **No**: this is front-end architecture inside the page |
| Educator-intent → learning journey; student-created activities | Server workflow layer (HR "workflow layer … server-side progression") | **No** |
| Richer learning experiences (media, interactives) | Media delivery and caching | **SW / HTTP caching** helps; a companion adds nothing the SW cannot |
| Cross-device continuation | **Person-bound** server state (D-085 T1: "PERSON-BOUND, never device-bound") | **A device-resident companion works against it**: its state is per device |

---

## 23. Required 4.0 architecture seams, if any

**Answer: nothing in code. Documentation only.**

1. **No code change is needed now** to keep the path open:
   - authoritative traffic is already page-direct, and every decision is already server-side (§7);
   - the approved assistance fix already schedules from server data (`window_seconds`, `dwell_seconds` already returned).
2. **Documentation (optional, small).** Record the principle and the trust rule as a decision line:
   - "Local when possible. Server when authoritative. Client-supplied data is a claim or an observation, never authority."
   - "Companion only when the browser is insufficient and the value is measured."
   - This study is the evidence.
3. **No new data capture in 4.0.** The device and browser mix needed for a 4.1 decision can be read from **existing** request logs (Vercel and Supabase edge logs carry the user agent) without code (E1).
4. **Not a seam, but observed and outside this study's authority.** These are for the owner's existing queue:
   - a lesson can be marked read by a client-supplied total (LPA:182-184; HR:104 already names it);
   - `offline_tolerant` is hashed but read by nothing.

---

## 24. Alternatives to a companion

| Alternative | Captures | Status | Notes |
|---|---|---|---|
| Event-driven assistance, silent when not configured | 23 actions + 23 Auth per sitting; the save queue; 36% of 1,000-wave calls | **Approved**; heartbeat option with the owner | The largest single item |
| Offline-only connectivity probe (owner option A) | The label truth the poll gave, at zero cost while connected | Owner | — |
| `getClaims()` for reads; no Auth on prefetch | ~30 Auth round trips per sitting; Auth's 10-connection cap | Owner (authentication) | — |
| Prefetch policy on learner links | ~19 RSC requests per sitting | Owner (perceived speed) | — |
| /belajar consolidation and parallel reads | 2 RPCs per assignment; ~60–80 ms per load now [E] | Recommend before scale | — |
| /pimpinan snapshots | ≈ 2.8 s per school view | Owner (freshness) | — |
| Service Worker shell plus offline fallback; immutable lesson cache; `Clear-Site-Data` on sign-out | The one material resilience gap; lesson revisits | **4.1 candidate** | Browser-only, every device |
| Tab coordination (BroadcastChannel / Web Locks) | Duplicate flushes; "open elsewhere" clarity | 4.1 candidate | Small |
| Connection pooling | Already Supavisor / PostgREST pools; exhausted only under CPU saturation | — | Not the constraint |
| WebSocket / SSE / Realtime | No learner need: when help can become due is computable. A live "who has submitted" view for teachers is a **product** feature | Not justified for efficiency | — |
| Measuring near the learners | Knowing whether any latency is left to fix | Owner (EA §8.6) | — |
| Infrastructure (CAP-08) | Synchronized 1,000+ | Owner, before production | — |

**About 80–100% of the reachable benefit needs no native software, and none of it needs an extension today** [C from §15–16; the remaining 0–20% is the unmeasured value of after-tab-close delivery and OS idle state].

---

## 25. Risks and unknowns

- **[U] Device / browser mix.** The 70% desktop hypothesis is untested. Tablets and phones are explicit in decisions and tester guidance.
- **[U] Latency from Indonesia.** Whether anything perceptible remains after +S.
- **[U] Offline incidence in real sittings.** It can be read from existing receipt modes and RECONNECT observations (E4).
- **[U] How many schools manage their devices** (Intune/GPO/Google Admin). This decides whether an extension could be force-installed at all.
- **[X] Moving browser policy.** LNA tightening (Chrome 156), MV3 changes and Safari's localhost stance all move against local daemons.
- **Risk of the idea itself:**
  - a companion invites "temporary" trust in client data;
  - storing tenant data outside the origin's clearable storage;
  - surveillance permissions;
  - a second release train for a team with very limited capacity.
- **Double-counting traps found and excluded:**
  - assistance traffic (approved fix);
  - prefetch and Auth (app config);
  - /belajar and /pimpinan (server);
  - "local timers" (already local);
  - "local scoring" (impossible: keys never reach the client, INV-01).

---

## 26. Experiments required before any decision

Each is cheap and read-mostly. Run them in this order and stop when the answer is clear.

| # | Experiment | Method | Decides |
|---|---|---|---|
| E1 | **Who uses PINTAR on what** | Aggregate the user agent by device class and browser family from existing Vercel and Supabase edge logs over the pilot; no code, no new capture | Whether a desktop-only rung can reach a meaningful share. If Chrome/Edge desktop is under ~50% of sittings, rungs 4–6 are out |
| E2 | **The post-fix baseline** | The measurement the assistance ruling already requires (one comparable sitting) | The real residual: actions, Auth, database, save latency |
| E3 | **Latency where learners are** | One sitting from a vantage point in or near Indonesia (a Jakarta / Singapore runner or a real school) | Whether any perceptible latency remains, and whether it is network or server |
| E4 | **Offline incidence** | Read-only SQL over real pilot sittings: receipts by mode (LIVE / REPLAYED / LATE_SYNC), RECONNECT observations, finishes refused as offline. Production needs the owner's permission | Whether resilience work is worth anything at all |
| E5 | **Browser-only resilience spike** (only if E4 > ~1–2% of sittings [E]) | SW shell plus offline fallback on staging; reload-while-offline walk | Value of the SW rung |
| E6 | **Extension spike** (only if a capability that E5 cannot provide is named and E4 shows value) | Minimal-permission MV3 extension on staging; measure delivery-after-close | Whether rung 4 is ever justified |

---

## 27. Feasibility conclusion

**Technically feasible?**
- **Yes for every rung,** with very different costs.
- Browser-only and SW work fits inside the existing app.
- An extension is straightforward on Chrome/Edge and reaches ChromeOS. It does not reach Android Chrome or iPad without an app.
- A native companion is feasible on Windows/macOS but practically requires an extension (native messaging). Its localhost alternative is prompted on Chrome (LNA, opt-out gone in Chrome 156) and blocked on Safari [X].

**Material performance benefit?**
- **Not from a companion.**
- The material gains come from removing work in the app:
  - −23 actions and −23 Auth per sitting from the approved fix [C];
  - about −30 more Auth round trips from the owner-pending read-path options [C];
  - shorter /belajar chains [E].
- What remains is authoritative, and its acknowledgement cannot be made local.
- Perceived latency from Indonesia is **[U]** (E3).

**Material infrastructure benefit?**
- **No.** Companion-unique workload reduction is ≈ 0 at 25/50/70/90% adoption [C, §16].
- The 1,000-learner limit is authoritative and synchronized work on 2 shared cores [M]; the companion would not delay scaling.

**Material resilience benefit?**
- **Small, and browser-only.**
- The one material gap, the page lost on a reload while offline, closes with a Service Worker fallback.
- Delivery after the tab closes is the only companion-shaped gain. Its value is [U] (E4), and Background Sync covers it on Chromium.

**Security acceptable?**
- **Only as a strictly untrusted client:**
  - no session or service credential;
  - no `cookies`, `tabs` or `history` permissions;
  - authoritative traffic page-direct;
  - every reply a claim;
  - a server-side kill switch.
- Under those constraints it can do almost nothing the page cannot.
- Signed device keys give a weak continuity signal, never evidence.
- Extension supply-chain risk is real, and native's is larger.

**Operational burden acceptable?**
- **Browser-only:** yes.
- **Extension:** modest but permanent (store, skew, permissions, support). Not justified without a named need.
- **Native:** no, for PINTAR's capacity. Two OS pipelines, signing and notarisation, SmartScreen reputation, school installs, LNA and Safari constraints, and no repayment in cloud savings.

**Browser-only alternative sufficient?**
- **Yes, for everything found.** It captures about 80–100% of the reachable benefit, on every device, at 100% adoption from deploy [C/E].
- The residue (after-tab-close delivery; OS idle) is unmeasured and small.

**Appropriate for 4.0?**
- **No preparation beyond documentation is warranted.** No code seam, data capture or schema change (§23).

**Appropriate candidate for 4.1?**
- **Yes, as a browser-native Local Experience Layer:**
  - event-driven assistance (approved);
  - the offline-only probe;
  - SW fallback and immutable lesson cache with sign-out clearing;
  - tab coordination;
  - the owner-pending request-path changes.
- **"PINTAR Companion" as installable software is not a 4.1 candidate on today's evidence.** The ladder stays (browser → extension → native), and the evidence says 4.1 stops on the first rung.
- If E1–E4 later name a capability the browser cannot provide, rung 4 (minimal-permission extension) is the next step, never rung 5 first.

**What must be proven before approval?**
- E1 device/browser mix;
- E2 post-fix baseline;
- E3 latency from Indonesia;
- E4 offline incidence;
- for any installable companion, additionally:
  - a **named** capability that fails in the browser (E5);
  - its measured value (E6).
