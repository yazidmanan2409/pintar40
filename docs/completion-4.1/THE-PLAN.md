# PINTAR 4.1 · THE PLAN

> **DRAFT — NOT APPROVED.** Phase 1 preliminary consolidation, 11 Nov 2026, by the Chief Architect (Bob).
> It becomes final only after A1 and C1w are verified, this draft is reconciled against their final code, and the owner
> has reviewed the completed plan. **Nothing here authorizes implementation.**
>
> **Revision 2 (11 Nov):** the owner's rulings D-1 to D-8 are incorporated (§7.3); the emergency-containment design
> (§5.3 D6) is specified for concurrency, scale and failure. The direction is approved; the plan is not.
> The owner accepted revision 2 (`38e43db0`) as the current working draft: a planning milestone, not approval to
> execute. One follow-up is added: Sharon's review covers the emergency-stop transaction race and the late-sync edge
> (§5.3).
>
> Statements marked **[P-A1]** or **[P-C1w]** rest on a batch that is not yet closed and are provisional.

**What this document is.** The build-ready execution plan for everything in 4.1 after the foundations B0 → A1 → C1w.
It consolidates the approved records. It does not replace them and proposes no competing architecture.

**Authority, in order.** Where two records disagree, the earlier in this list wins.
1. `OWNER-DECISIONS-2026-11-11.md` (O41-7 to O41-22, the five process rules, the 4.2 list).
2. `EXECUTION-PLAN.md` (lanes, batches, how a batch runs, the register of non-blocking findings).
3. `batches/B0-COMPLETION.md`, `A1-COMPLETION.md`, `C1W-COMPLETION.md`.
4. `SCOPE-REGISTER.md` §1 (capabilities C1–C8) and §2 (truths), as the decisions above change them.
5. `C1-D125-INVESTIGATION.md`, `C3-EVALUATION-PLAN.md`, `C3-AI-PROVIDER-COMPARISON.md`.

**Evidence base.** `main` at `057eb2b0`; `claude/system-integrity-4.0` at `7dfe2bc8` (B0 closed; A1's final commit, in
verification), read only. Paths below are relative to the repository; `M/` is `supabase/migrations/`. Evidence was
gathered by targeted reading, not by running anything.

**Contents.** 1 Baseline · 2 Scope · 3 Order · 4 Rules for every batch · 5 Batch instructions (B1, B2, A2, C2w, A3,
C3w, E, Z) · 6 Cross-batch integration · 7 Decision register · 8 Final acceptance.

---

## 1 · Architectural baseline (Deliverable 1)

### 1.1 Where the platform stands

| Item | State |
|---|---|
| PINTAR 4.0 | Closed. On staging at migration 224 (PR #17, `d764d69e`). Rollback script `docs/completion-4.0/acceptance/ROLLBACK-201-224.sql`. |
| Production | Migration 111. Outside every authorization. The 111 → 224 rehearsal on restored real data (R-2) is open and is not part of this plan. |
| B0 · last-administrator guard | Closed on `0bbee3e3`. Migration `20270113170000`. |
| A1 · sitting control | Final commit `7dfe2bc8`; CI and journeys in progress when read. Migrations `20270114100000`, `20270114110000`. **[P-A1]** |
| C1w · item workbench | Not started. Spec: `batches/C1W-COMPLETION.md`. **[P-C1w]** |
| Suite | 1018 manifest ids on `main`; 1045 on the work branch. |

### 1.2 The mechanisms every remaining batch builds on

**Authorization.** Capabilities decided over a place (`can_on_node`), roles with a mandatory end date
(`role_assignments`), `is_system_admin()`. A1 added `CAN_MANAGE_SITTINGS`, decided over the sitting's own place by
`boleh_kelola_pengerjaan` (`M/20270114100000…:258`). A platform admin is deliberately excluded from academic decisions
(A1's approver, C1w's content owner).

**Refusals.** One raiser per domain, an errcode per domain and the code in DETAIL: `pengerjaan_tolak` PR170
(`M/20270114100000…:46`), `akun_tolak` PR140, `maintenance_refuse` PR110 (`M/20261120100000…:74`). Request-level
refusals come from the pre-request hook `pintar_permintaan.periksa()` (latest `M/20270113130000…:475`): PT503
(maintenance, emergency), PT403 (suspended), PT423 (locked). Each domain has a contract file `src/lib/*-kontrak.ts` that
maps codes to `hle.ts` keys (pattern: `src/lib/pengerjaan-kontrak.ts`).

**Audit.** `audit_log` is append-only (INV-18; `M/20260912004158…:73-99`), written only through `audit_write`
(`M/20261111100000…:51`), read under one policy: platform admin, or the school's admin for that school's rows
(`M/20260912004431…:340`). «Jejak audit» reads the table directly (`src/app/konfigurasi/page.tsx:247`).

**RPC registry.** Every client-callable function has a `client_rpc_registry` row with its exposure and its
authorization requirement; lints enforce it (example `M/20270114100000…:1080`).

**Sittings.** `assessment_sessions` with a status allow-list, pinned to a release (`plp_release_id`) and to
`presented_items` (immutable). Answers arrive through `record_answer` → `submit_response`, idempotent on
`(presented_item_id, client_seq)`. A1 added: the held state (`frozen_*` columns, `M/20270114100000…:126-147`; cause list
today `ACCOUNT_SUSPENDED` only), the one deadline decider `pengerjaan_putus_tenggat` (`:325`), the learner gate
`pengerjaan_gerbang` (`:439`), the state trigger `pengerjaan_jaga` (`:209`), and the scheduled closer
`pengerjaan_tutup_terjadwal` run by `pg_cron` every 5 minutes through the idempotent installer
`pengerjaan_jadwal_pasang` (`M/20270114110000…:79`).

**Maintenance.** One system (`M/20261120100000`): `maintenance_windows` (PLANNED or EMERGENCY; platform or a list of
schools), a T−15 start block (trigger on sitting insert, `:175`), the drain rule `maintenance_draining` (`:135`), PT503
at the pre-request hook, the pause page `src/app/pemeliharaan/page.tsx`, the banner `PitaPemeliharaan` with browser
timers at 60/30/15 (`src/lib/pemeliharaan-kontrak.ts:103`).

**Content.** `courses → modules → lessons → items → item_options`; a status allow-list with the two-person rule inside
`enforce_content_status` (`M/20261213100000…:52-72`); releases in `plp_releases`; package-level revision by
`create_course_revision` with `items.supersedes_item_id` (`M/20260915120000…:56`); sealed content immutable
(`enforce_taught_content_immutable`). No per-question stable identity exists today; C1w adds it.

**Learner projection.** Learners never read `items`. `session_paper` and `sanitized_item` return only keys in a declared
allow-list, enforced by `assert_learner_projection_is_closed` (F06-P02) and by `sanitize()` in
`src/lib/assessment-engine/index.ts:79`.

**Metrics.** Calculators `calc_*` may read only relations declared in `metric_sources`; `assert_metric_closure` and
F06-P13 enforce it. F07-P11 refuses any `feedback_%` relation as a source: the precedent for C2w.

**Time.** Instants in UTC. Each school's zone in `institutions.zona_waktu` (`M/20270112195000…:26`); readers in
`src/lib/zona-sekolah.ts`, formatters in `src/lib/tanggal.ts`.

**Outbound calls.** One pattern: a `server-only` module that reads validated settings, reserves a ledger row, calls out,
and settles the row (`src/app/api/_email/kirim.ts:113`). Secrets are read only through `src/lib/env.ts` getters.

**Recovery (backup and restore).** `scripts/recovery/backup.mjs` excludes `pg_cron`'s tables; `restore-bundle.mjs`
re-runs the job installer and refuses to reopen without the job; DR-S14, S15, S16 and DR-D02 pin this
(`selftest/dr150b.test.ts`).

### 1.3 What the foundations give the remaining batches

| Remaining batch | Needs from | What exactly |
|---|---|---|
| A2 | A1 | the held state and its guard; the deadline decider; the scheduled closer |
| A3 | A1, A2, B1 | the sitting gate and row-lock discipline; the teacher's sitting panel on `/mengajar/[kelas]/siapa`; A2's emergency hold; B1's sign-in events |
| B2 | B1 | the print-request event and its reference |
| C2w | C1w | the stable question identity; «Riwayat soal» |
| C3w | C1w, B1 | the draft state and in-app editor; the two-person review; B1's write path |
| Z | all | one candidate |

---

## 2 · Consolidated remaining scope (Deliverable 2)

The lane and batch structure of `EXECUTION-PLAN.md` §2 is kept unchanged.

| Batch | Capability | Delivers | Effort |
|---|---|---|---|
| **B1** | C5 | A separate accountability-event store: sign-in success and failure, explicit sign-out, print requests. 12 months' retention with controlled purging | M |
| **B2** | C6 | «Cetak laporan» logs the request and prints the footer: printed by, date and time in the school's zone, the reference, page n of m | S |
| **A2** | C7 + C8 | Class scope; the reason list; extend and resume early; warnings in the school's zone; "cannot finish before the window" refused at start; emergency stop at class scope with containment | M |
| **C2w** | C2 | Attributed annotations beside sealed content, in a table no sealed report reads | S–M |
| **A3** | C1 without Exam Mode | One writer per sitting at every boundary; stale-device writes refused; self-recovery (low stakes) and teacher-authorized recovery (Uji Penguasaan) | L |
| **C3w** | C3 | Source material in; AI drafts with provenance into the workbench's draft state; the existing two-person review and publication | L |
| **E** | O41-14 | The blind provider evaluation, alongside | S |
| **Z** | — | One candidate, one full verification, then the walkthrough is scheduled | M |

**Not in 4.1** (settled; listed so that nobody rebuilds them by accident):
- Exam Mode, and with it any EXAM assignment path (O41-9). The recovery investigation's remark that Exam Mode "needs an
  assignment path" is superseded.
- School data export, opening past reports, a period selector (owner decisions §4). The assessment's roadmap listed them
  under Lane B; the owner deferred them.
- Job positions, acting appointments, future-dated roles (O41-8). One person at two schools (O41-12): no new assumption
  may block it.
- Scheduled question-health recomputation; the teacher's handover view (`EXECUTION-PLAN.md` §4).
- WhatsApp sign-in (4.5).

**A consequence for B1.** C5 names "print and export requests". No data export exists in the product today (the only
downloads are client-side template workbooks, `src/components/unggah/PanelUnggah.tsx:99`). B1 therefore records print
requests and defines no export event. The export event arrives with the export feature in 4.2 (owner ruling D-4).

---

## 3 · Dependency and execution order (Deliverable 3)

```
B0 ✔ ─► A1 [verifying] ─► C1w ─► STOP ─► owner approves THE PLAN
                                          │
        B1 ─► B2 ─► A2 ─► C2w ─► A3 ─► C3w ─► Z ─► walkthrough
        E  (alongside, as soon as its preconditions are met)
```

**Hard dependencies** (from `EXECUTION-PLAN.md` §1, confirmed against the code):
- A1 before A2; A2 and B1 before A3.
- B1 before B2 and before C3w.
- C1w before C2w and C3w.
- C3w's entry gate (`SCOPE-REGISTER.md` §4, with "C4 verified" read as "C1w closed"): the owner's provider choice, the
  reviewed architecture, B1's write path verified, Studio journeys green.

**Recommended serial order, and why.** B1 → B2 → A2 → C2w → A3 → C3w → Z.
- One implementation engineer builds on one branch. The lanes touch different tables, but every batch edits the same
  four shared files: `src/lib/hle.ts`, `selftest/manifest.json`, `src/app/konfigurasi/page.tsx` and the recovery
  scripts. Serial batches avoid merge work that buys no calendar time.
- B1 first: it is small, it unblocks three others, and its retention job settles the shared job installer (§6.3) before
  A2 and A3 depend on it.
- A3 late: it touches every sitting boundary, so every earlier change to those functions (A2's hold) should already be
  in place. C3w last, as ruled (O41-6).
- C2w sits between A2 and A3 because it is independent and small; it can move earlier or later without consequence.

**Parallel opportunities,** if a second implementation engineer is assigned: lane B (B1, B2) and C2w are independent of
lane A and can run beside A2. A3 and C3w should not run in parallel with each other: both are full-review batches and
both extend the journeys.

**E** runs beside everything. It needs no product code. Its prerequisites are prepared now and its owner-dependent
actions are brought to the owner when needed (owner ruling D-7).

**Each closed batch is promoted to staging** on the owner's authorization for that merge (process rule, owner decisions
§3). A batch whose migration needs a hosted extension or setting says so on its completion page (§6.4).

---

## 4 · Rules for every batch

These are the adopted process rules and standing rules, stated once. Section 5 does not repeat them.

1. **The completion page first** (`batches/<ID>-COMPLETION.md`), in the form of the three existing pages: why, the
   operations table (who, result), refused, history kept, screens and states, tests red before and green after, out of
   this batch, questions for the reviewers. Section 5 of this plan is the input for that page.
2. **One pre-build review** by the reviewers named per batch. Their blockers are settled on the page before code.
3. **Database conventions.**
   - One migration per coherent step, named as a sentence, with the header comment explaining the rule.
   - Refusals through the domain's raiser: errcode plus the code in DETAIL. A new domain gets its own errcode and raiser.
   - Every client-callable function gets its `client_rpc_registry` row; revokes and grants are restated when a function
     is replaced (ADR-0021).
   - Every act writes one `audit_write` row: who, when, what, the reason, before and after.
   - Every function that changes a sitting locks the sitting row first, in the lock order of §6.2.
4. **Application conventions.** A contract file `src/lib/<domain>-kontrak.ts` (codes, types, readers); all copy in
   `src/lib/hle.ts`, Indonesian and English; no raw server text on a screen (D-011); screens reuse Daisy's shared
   components (the Collection, the Dialog, the reason field, `BarisHasil`, `HalamanPenolakan`, `pin-*` classes).
5. **Tests.** Red before green, with the red run recorded on the commit before the change. Never weaken a test. A
   restated test carries a `RESTATED, <batch> (<ruling>)` note. A new static route joins `ROUTE_INVENTORY`.
6. **The engineer's rendered check** before any review: 1280, 390 and 320 px; keyboard only; every disclosure opened; the
   reviewer's own navigation sequence.
7. **Acceptance** is the whole local suite, CI and the journeys, green on the exact candidate commit. Then one review of
   the result, one correction pass, close.
8. **Blockers** are a demonstrated failure of security, authorization, evidence integrity or an essential journey.
   Everything else goes to the register in `EXECUTION-PLAN.md` §5.
9. **Never:** a production action; a merge without authorization; `.github/*-request.txt`; a change to
   `supabase/config.toml`; history rewrite; real-person data, keys or model identifiers in the repository.

---

## 5 · Batch instructions (Deliverable 4)

Each batch follows the same headings: A objective · B scope · C existing architecture · D design · E educational
semantics · F UX · G ordered instructions · H verification · I acceptance · J escalation.

---

### 5.1 · B1 — Accountability events (C5)

**Review before build:** Sharon.

#### A · Objective
A school can answer "who signed in, who failed to, who printed this" for twelve months, without PINTAR watching what
people do. Today a successful sign-in leaves no durable record and a failed one leaves only a 15-minute rate-limit
counter. Users affected: school admins and the platform admin (readers); everyone who signs in (subjects).

#### B · Scope
**In:** a separate event store; five event kinds (below); the write path at each sign-in and sign-out; the print-request
event that B2 uses; a reader for authorized admins; a daily purge of events older than 12 months.

**Out:** school data export and any export event (owner ruling D-4: they arrive together in 4.2); any click, page-view or behaviour record; changes to `audit_log` or to
what it already records; a school-facing analytics view.

**Depends on:** nothing unbuilt. It reuses A1's job installer pattern.

#### C · Existing architecture
| Thing | Where | Note |
|---|---|---|
| Password sign-in | `src/app/api/masuk/password/route.ts:44-58` | resolves, counts (`identity_attempt`), settles; no durable record |
| Card sign-in | `src/app/api/masuk/kartu/route.ts:51-60` | `card_signin_attempt` / `_settle` |
| Magic link and callback | `src/app/masuk/actions.ts:39`, `src/app/auth/callback/actions.ts:29` | no record |
| Code verify, PIN recovery, password after recovery | `src/app/api/masuk/lupa/{periksa,pin,password}/route.ts` | PIN recovery already audits `identity.recovery_pin_*` |
| Sign-out | `src/app/keluar/route.ts:20-35` → `src/lib/keluar.ts:13-32` | `sesi_akhiri_inti` audits `identity.session_ended` with a reason (`M/20261210100000…:223`) |
| Rate-limit counters | `identity_attempts` (`M/20261021100000…:276`), `card_signin_cooldowns` | transient; deleted on success |
| Security events list | `security_event_list` (`M/20261116100000…:201`), `src/app/konfigurasi/keamanan/page.tsx:46` | reads identity rows out of `audit_log`, platform admin only |
| Retention | none | `institutions.retention_days` exists and nothing enforces it (`M/20260912004244…:11`) |
| Scheduled jobs | `pengerjaan_jadwal_pasang` (`M/20270114110000…:79`); restore re-installs (`scripts/recovery/restore-bundle.mjs:84-93,186-189`) | **[P-A1]** |

#### D · Proposed technical design
**The store.** One new table, here called `accountability_events` (the engineer may choose the Indonesian name the
codebase prefers). It is not `audit_log` and has no foreign key into it.

| Column | Meaning |
|---|---|
| `id`, `at` | identity and instant (UTC) |
| `kind` | `SIGN_IN_OK`, `SIGN_IN_FAILED`, `SIGN_OUT`, `PRINT_REQUEST` |
| `method` | for sign-in: `PASSWORD`, `CARD`, `LINK`, `CODE`, `RECOVERY_PIN`; null otherwise |
| `person_id` | the person, when the identifier resolved to one; null otherwise |
| `identifier_hash` | for a failure: the keyed hash the rate limiter already computes for the typed identifier. Never the identifier |
| `institution_id` | the person's school, when known; null for an unresolved identifier and for platform staff |
| `outcome` | `OK`, or the route's own stable failure code (never Auth's message) |
| `network_origin` | coarse only: an IPv4 /24 or IPv6 /48 prefix. No user agent, no device fingerprint |
| `resource` | for a print: the report kind and its scope (a node or assignment id). Null for sign-in |

**Never stored:** a password, a code, a PIN, a card secret, a full IP address, the typed identifier.

**Invariants.**
1. Rows are insert-only for every role. The only deletion is the purge function.
2. No client role can insert, read or delete directly. Writes go through one service-level function; reads through one
   reader function.
3. One sign-in attempt writes exactly one row, whatever its outcome. A retried HTTP request must not write two: the
   write is made once, after the route has its final answer.
4. A failed write never blocks a sign-in or a sign-out. The route logs the failure to the server log (without the
   identifier) and proceeds. **A print is different:** no event, no reference, no official print (B2).
5. `audit_log` keeps everything it records today. `identity.session_ended` and the recovery rows are unchanged, so no
   existing test moves.

**Who reads.** The reader function returns a page of events for: the platform admin (all rows); a school's admin (rows
whose `institution_id` is their school). Rows with no school (unresolved identifiers, platform staff) are the platform
admin's only. This is the same boundary as `audit_log_select`.

**Retention and purging.**
- One function deletes rows older than 12 months, in bounded batches, and writes **one** `audit_write` row per run that
  deleted anything: how many, the oldest and newest instant removed. The purge is the only code path with DELETE.
- A daily `pg_cron` job runs it. It is installed by the shared installer (§6.3), not by a second ad-hoc installer.
- The 12 months is a constant in the function, stated in its comment with O41-4 and O41-13. It is not a setting.
- The table is ordinary application data: it is in the backup. A restore brings back at most 12 months plus one day.

**Concurrency and failure.** Inserts are independent rows; no lock is needed. The purge takes rows in id order with
`FOR UPDATE SKIP LOCKED` so that two runs cannot double-count. A failed purge run changes nothing and is retried the next
day.

**Backward compatibility.** No backfill: history starts when the migration lands. The reader says so on its empty state.

#### E · Educational semantics
«Accountability, not surveillance» (C5). The store records that a person entered, failed to enter, left, or asked for a
print. It records nothing about what a learner read, how long they stayed, or what they clicked. No report, metric or
calculator may read it: it is not declared in `metric_sources`, and a test refuses it as a source (the F07-P11 pattern).

#### F · UX requirements
One reader screen for admins. Recommended place: a section beside «Jejak audit» in Konfigurasi, with the same paging and
the same wording layer (`src/lib/jejak-audit.ts` pattern). Daisy decides the final place and words at the result review;
no pre-build UX review is planned for B1 (`EXECUTION-PLAN.md` §2).
- **Purpose:** look up sign-ins, failures, sign-outs and prints for one person or one period.
- **Actions:** filter by kind, by person, by date range. No export, no delete.
- **States:** empty ("recorded since {date}"); no match; a page of rows; refused (not an admin).
- **Each row:** when (school's zone), who (name, or «pengenal tidak dikenal» for an unresolved identifier), what, how,
  outcome in plain words. The network origin is shown to the platform admin only.
- **Mobile:** the Collection's stacked rows. **Print:** none.

#### G · Ordered implementation instructions
1. **Preconditions.** A1 closed (the installer exists). Completion page written; Sharon's review settled.
2. **Database.** The table, its guard (no update, no delete outside the purge), the service-level writer, the reader, the
   purge, the registry rows, the metric-source refusal. Extend the shared job installer (§6.3) and install the purge job.
3. **Recovery scripts.** `restore-bundle.mjs` checks and re-installs both jobs through the shared installer; restate
   DR-S14 to S16 and DR-D02 with notes if their expectations name the job count.
4. **Contract.** `src/lib/akuntabilitas-kontrak.ts` (or the chosen name): kinds, methods, outcome codes, the row type,
   and the `hle.ts` key per kind and outcome.
5. **Server.** One server-only helper that derives the coarse origin from the request and calls the writer. Call it once
   in each route of table C, at the point where the route's answer is final. Magic-link success is recorded at the
   callback, not at the request.
6. **UI.** The reader section.
7. **Tests** (H). 8. **Rendered check.** 9. **Acceptance.**

#### H · Verification
- **Database (red first):** a successful and a failed sign-in each leave exactly one row (red today: none). No row holds
  a password, code, PIN or full address (a scan over every text column after a full sign-in matrix). A client role cannot
  insert, update, delete or select. A school admin reads only their school's rows; rows with no school are the platform
  admin's. **Retention:** a row aged to 12 months and a day is purged and one audit row records the count; a row at 11
  months stays. Two purge runs at once delete each row once.
- **App:** each sign-in method and each failure code through the running app; sign-out; a retried request writes one row.
  A writer failure (simulated) does not block sign-in.
- **Static:** the store is not a metric source; no file outside the helper calls the writer; no copy names the mechanism.
- **Recovery:** the restored database has both jobs.
- **Regression:** every existing identity test green unchanged (F15 to F18, BOB26-*, BOB27-*, BOB28-*, BOB29-*, L2-*).
- **Rendered:** the reader at the three widths, keyboard only.

#### I · Acceptance criteria
1. Every sign-in path writes one event per attempt; none stores a secret.
2. Retention is proven by the aged-row test, and the purge is audited.
3. Readers are bounded exactly as `audit_log` is.
4. No existing identity or recovery test was restated except the four DR tests, each with a note.
5. Whole suite, CI and journeys green on the candidate commit; Sharon's result review closed.

#### J · Escalate to the owner only if
- Sharon finds the coarse network origin unacceptable in either direction (too precise, or useless) and no bounded
  alternative satisfies O41-4.
- A sign-in path cannot be recorded without storing the typed identifier.

---

### 5.2 · B2 — Printed-report identification (C6)

**Review before build:** Daisy. **Depends on:** B1.

#### A · Objective
A printed report that leaves the building can be traced to the person who asked for it. Users: teachers, heads and
school admins who print; anyone who later holds the paper.

#### B · Scope
**In:** the official «Cetak laporan» button logs a print request and prints a footer on every page.
**Out:** certificates (they keep their QR, C6); class cards (`LembarKartu`); past reports and the period selector (4.2);
any claim that paper came out of a printer.

#### C · Existing architecture
| Thing | Where |
|---|---|
| The button | `src/components/laporan/AksiLaporan.tsx:24` calls `window.print()` |
| The print header | `src/components/laporan/KepalaCetak.tsx:5-12` |
| Page rule | `src/app/experience.css:3804-3815`: `@page laporan`, «Halaman n dari m» |
| Pages that print | `/belajar/hasil` (`src/app/belajar/hasil/page.tsx:48`), `/dekan/ringkasan`, `/edukator/ringkasan`; `/pimpinan` has the header and no button |
| Zone formatting | `src/lib/tanggal.ts:138`, `src/lib/zona-sekolah.ts:8` |

#### D · Proposed technical design
1. Pressing «Cetak laporan» calls a server action. It writes B1's `PRINT_REQUEST` event (the signed-in person, the
   report kind, its scope) and returns the **reference**, the person's display name and the instant.
2. The reference is a short, legible code derived from the event's id (for example 8 characters in the PINTAR ID
   alphabet, grouped 4+4). It is unique, and the reader in B1 finds the event by it.
3. The client places name, date and time (the school's zone, with the zone's word), and the reference in the print
   footer, then calls `window.print()`. After the print dialog closes (`afterprint`) the footer values are cleared.
4. **A browser print (Ctrl+P) carries no reference and claims no audit** (owner, 9 Nov). Without the button's values the
   footer prints page numbers only, as today.
5. If the action fails, nothing prints and the result line says so. An official print never goes out without a
   reference.
6. Each press is one event and one reference. Printing twice is two references; that is intended.

**Invariant:** the footer never shows a reference that has no event.

**A consequence to know.** Print events are purged with the rest after 12 months (O41-13). A paper older than that still
shows who printed it and when, but its reference no longer resolves (register N-3).

#### E · Educational semantics
The footer identifies the requester of the print. It makes no statement about the learners in the report and changes no
figure. Learners printing their own results (`/belajar/hasil`) are treated the same way: their own name, their school's
zone.

#### F · UX requirements
- **Footer composition** (Daisy's to settle at the pre-build review): one quiet line, legible in monochrome, never over
  content: «Dicetak oleh {nama} · {tanggal, jam, zona} · Ref {rujukan}» left, «Halaman n dari m» right.
- **States:** working (the button's existing busy state); failed (one sentence, nothing printed); done (no message
  needed).
- **Accessibility:** the button keeps its name and focus; the failure line is a status region (`BarisHasil`).
- **Print:** A4 portrait and the wide variant (`laporan-lebar`) both carry the footer; no content is clipped at 1280
  or when printed from a phone.

#### G · Ordered implementation instructions
1. Preconditions: B1 closed; completion page reviewed by Daisy.
2. Database: nothing new beyond B1, unless the reference needs its own unique column on the event (the engineer's
   choice; if so it goes in B2's migration).
3. Contract: the action's answer type and failure codes in the B1 contract file.
4. Server: the print action (same-origin, signed in; the report kind and scope are checked against what the person may
   read, so a forged call cannot log a print of a report they cannot open).
5. UI: `AksiLaporan` and `KepalaCetak`; the footer CSS under `@page laporan` and `laporan-lebar`.
6. Tests. 7. Rendered and printed check. 8. Acceptance.

#### H · Verification
- **App (red first):** a press writes one `PRINT_REQUEST` and the printed document carries that reference, the name and
  the time in the school's zone (red today: no event, no footer). A failed action prints nothing. A forged scope is
  refused and writes nothing.
- **Static:** every page that renders `AksiLaporan` goes through the action; nothing else calls `window.print()` on a
  report; the certificate print is untouched.
- **Rendered:** a PDF print of each report at A4 and wide, checked for the footer on every page, in monochrome; a
  browser print without the button shows no reference.
- **Regression:** the report suites and the certificate tests unchanged.

#### I · Acceptance criteria
1. Every official report print has a footer whose reference resolves to its event.
2. No reference appears without an event; a browser print claims nothing.
3. Daisy's printed check passed on the candidate commit; suite, CI and journeys green.

#### J · Escalate only if
- Daisy and the engineer cannot fit the footer without obscuring content on an existing report.

---

### 5.3 · A2 — Pause and emergency (C7 + C8)

**Review before build:** Sharon and Daisy. **Depends on:** A1.

**Required in Sharon's pre-build review (owner, 11 Nov).** Her review of this batch must explicitly cover, and record a
finding on, both of the following, alongside the recovery cases she reviews for A3:
1. **The emergency-stop transaction race** (D6): the interval between the stop's commit and the completion of marking,
   with the deadline scheduler, a hand-in, a teacher's act and the lift each racing it; Rule 2 as the guarantee that no
   affected sitting is ended or scored; the lock order.
2. **The late-sync edge** (D6, "A known edge"): a sitting already past its deadline and inside its late-sync grace at
   the stop's instant, and an answer of its still travelling.
The completion page is not settled, and the build does not start, until both findings are on it.

#### A · Objective
A school can announce maintenance for one class or the whole school and trust what happens to sittings. The platform
admin can stop a class, a school or the platform at once without anyone's work being lost or silently judged. Users:
school admins (planned), the platform admin (emergency), every affected learner and teacher.

#### B · Scope
**In:** class scope on the existing windows; a reason list; extend a window and resume early; the 60/30/15 warnings in
the school's own zone; "cannot finish before the window" refused at start; emergency stop at class scope; containment
of open sittings during an emergency.

**Out:** an immediate pause for school admins (ruled out, C7); any automatic pause, timer extension, forced submission
or new scoring for **planned** maintenance (the maintenance ruling: D-094's drain is preserved); a second maintenance
system.

#### C · Existing architecture
| Thing | Where | Gap for A2 |
|---|---|---|
| Windows | `maintenance_windows` (`M/20261120100000…:32-50`) | scope is platform or schools; `reason` is free text |
| Schedule, start/end | `schedule_maintenance` `:347`, `change_maintenance(…,'MULAI'\|'AKHIRI',…)` `:390` | no extend; `ends_at` cannot change |
| Emergency | `stop_pintar_now` `:430`: platform admin, typed phrase, platform or school | no class scope |
| Who is affected | `maintenance_affects` `:109`, `maintenance_block_for_me` `:147` | by school only |
| Drain | `maintenance_draining` `:135` | per person |
| Start block | trigger on sitting insert `:175-188` | T−15 only; does not compare the sitting's length with the window |
| Request refusal | `pintar_permintaan.periksa()` (`M/20270113130000…:475`) | PT503 for every affected person |
| Status for the client | `pintar_status_saya` `:274` (60-minute look-ahead) | — |
| Warnings | `PengingatPemeliharaan.tsx:40-45` timers; stages in `pemeliharaan-kontrak.ts:103` | times shown with `jamWib(…)` and no zone (`PengingatPemeliharaan.tsx:76-77`) |
| Screens | scheduling in `src/app/konfigurasi/page.tsx:1305`; pause page `src/app/pemeliharaan/page.tsx` | — |
| Tests | `selftest/m148.test.ts` (M148-K01, S01, D01, D02) | — |
| A1's deadline rule | `pengerjaan_putus_tenggat`, the 5-minute job | **knows nothing of maintenance** [P-A1] |

#### D · Proposed technical design

**D1 · Class scope.** A window's scope becomes one of: the platform; a list of schools; a list of class nodes of one
school. A class-scoped window affects a person when they are enrolled in, or teach, one of those classes. A school admin
may schedule for their school or for classes of their school; the existing collision check (`maintenance_collisions`)
considers a class window to overlap its school's window.

*Cost.* The pre-request hook runs on every request. The class test must stay one indexed lookup and must be skipped
entirely when no class-scoped window is active or approaching. The engineer measures the hook before and after.

**D2 · The reason list.** A `reason_code` from the approved list (routine maintenance, system update, fault repair,
network or power maintenance, other), with the short free text required only for «other». Existing rows keep their text
and get no code. The scheduler's identity is already recorded (`created_by`).

**D3 · Extend and resume early.** One new act changes `ends_at` of a window that has not ended: later (extend) or to now
(resume early, the existing `AKHIRI`). Each writes an audit row with before and after and a reason. Warnings and the
pause page read the new end at their next status read.

**D4 · "Cannot finish before the window."** At start, if the sitting's own deadline (start plus its duration) would fall
after a planned window's `starts_at` that affects the learner, the start is refused with a designed code that names the
window's start. This replaces nothing: the T−15 block stays, and a sitting with no duration is refused only inside T−15
as today.

**D5 · Planned maintenance and running sittings: unchanged.** A running sitting drains: its learner keeps working until
its deadline plus grace, as `maintenance_draining` allows. A1's scheduled closer keeps running during a planned window;
that is consistent, because a draining sitting is reachable.

**D6 · Emergency containment** (the one genuine gap this plan found; **owner ruling D-1, 11 Nov**).
- C8 requires: "accepted answers and attempt state preserved; nothing silently submitted, scored, failed or discarded;
  governed recovery afterwards."
- Today an emergency refuses every request of the affected people (PT503). Their sittings' deadlines keep running.
- With A1, a sitting past its deadline is ended and **scored** by the 5-minute job or by the lazy check (O41-20). So a
  class stopped for 40 minutes would come back to sittings already ended and scored on partial answers. That is exactly
  what C8 forbids.

**Ruled by the owner (11 Nov, D-1): approved.** Open sittings are held with their answers and exact remaining time;
they resume when the platform admin lifts the stop; suspension-held sittings stay held. The transition must be safe
under concurrency and at scale, and no affected sitting may be scored by the deadline scheduler while containment is
taking effect. It uses A1's mechanisms; there is no second sitting-control system.

*The design. Three rules make it safe; the bulk work is then only bookkeeping.*

**Rule 1 · The stop takes effect at one instant, by one row.** `stop_pintar_now` inserts the EMERGENCY window and
commits. That commit is the instant of effect (`starts_at`). Nothing about containment depends on how long the rest
takes.

**Rule 2 · The one deadline decider refuses to end a contained sitting.** `pengerjaan_putus_tenggat` is the single
function that ends a sitting by its deadline; the lazy check and the scheduled closer both call it **[P-A1]**. Under the
sitting's row lock, before deciding, it asks whether an active EMERGENCY window affects the sitting's **person** (a
person-parameter form of `maintenance_block_for_me`). If so it ends nothing and reports the sitting as skipped. So from
the commit of Rule 1 no path can end or score an affected sitting, whether or not it has been marked held yet. This is
what satisfies "no scoring while containment is taking effect", for one sitting or for fifty thousand.

**Rule 3 · Remaining time is computed from the stop's instant, never from when a row was processed.**
`remaining = the sitting's deadline − the window's starts_at`. A sitting with no deadline has no remaining time and gets
none back.

*Marking sittings held.* After Rule 1, the open sittings of every affected person are marked held with cause
`EMERGENCY_STOP`, the window's id and the remaining time of Rule 3. This widens A1's cause check
(`M/20270114100000…:141`) and reuses `pengerjaan_tahan_orang`'s logic and the state trigger `pengerjaan_jaga`.
- **By person, not by class:** an affected person cannot make any request (PT503), so every open sitting of theirs is
  contained, at any class or school, as a suspension already does.
- **In bounded batches,** each its own short transaction, sittings locked in id order (§6.2), `SKIP LOCKED` for a row
  another transaction holds, repeated until none is left. No long transaction, no lock queue behind the stop.
- **Idempotent and resumable:** a sitting already held is left alone. If the marking is interrupted, the stop is still
  fully in force (Rule 2), and the marking is finished by re-running it, by the next scheduled run, or at the lift.
- **Not held:** a sitting that had already handed in or ended before `starts_at`; a sitting already past its deadline
  at `starts_at` (it is ended by the ordinary rule after the lift; Rule 2 only postpones that); a sitting held for a
  suspension (it keeps `ACCOUNT_SUSPENDED`; the causes never overwrite each other).

*Races at the moment of the stop.* Each is settled by the sitting's row lock:
- The scheduler holds the lock and ends a sitting whose deadline had passed **before** the commit of Rule 1: that
  sitting ended legitimately before the stop and is not held.
- A hand-in commits before the stop: it stands. A hand-in arriving after: refused at the request (PT503).
- A teacher's act (extend, end) commits first: it stands, and the remaining time is computed from the deadline it left.
  After the stop, A1's acts on a held sitting are refused as today (`SITTING_FROZEN`).

*The lift.* Lifting sets the window's `ended_at` and commits; requests flow again at once. Then:
- **One deterministic rule:** `new deadline = the window's ended_at + remaining`. It does not depend on when the release
  runs, so every path gives the same answer and a learner neither loses nor gains time.
- Sittings held by that window are released in bounded batches, as they were marked.
- **Nobody waits for the batch:** the learner gate (`pengerjaan_gerbang`) and the decider, on meeting a sitting whose
  emergency has ended, release it by the same rule before doing anything else.
- A sitting in scope that was never marked (an interrupted marking) is treated identically: its remaining time is still
  `deadline − starts_at`.
- **Overlapping stops:** if another active EMERGENCY window still affects the person, the sitting stays held, its
  remaining time unchanged, and is re-attributed to that window. It is released when the last one lifts.
- A sitting held for a suspension is untouched by any lift.
- A window that closed during the stop does not end a released sitting before its restored deadline (A1 already allows
  «Lanjutkan» after a closed window).

*Failure behaviour.*
- The stop's row fails to commit: nothing is in force and the admin is told; there is no half-stop.
- The marking or the release batch fails: retried; Rules 2 and 3 keep every outcome identical to a clean run.
- The scheduler runs throughout and is harmless: Rule 2 makes it skip, and it counts what it skipped.

*Audit.* One row when the stop takes effect, one when marking completes (how many sittings held), one at the lift (how
many released, how many left to the ordinary rule). The held and release facts are also on each sitting, as A1 records
them.

*A known edge, stated rather than hidden.* An answer acknowledged before the stop is kept. An answer still travelling
when the stop commits is refused at the request and stays on the device; after the lift the device sends it, inside the
restored time. A sitting already inside its late-sync grace at `starts_at` is not held, so an answer of its that was
still travelling is not part of the paper. Sharon reviews this edge before build.

**D7 · Emergency at class scope.** `stop_pintar_now` accepts class nodes, under the same typed confirmation and reason.
The immediate notice is the existing PT503 path: the open player's 45-second check and the next request both land on
the pause page.

**D8 · Warnings in the school's zone.** The status read returns the school's zone with the window; the banner and the
pause page format times with it and name the zone (WIB, WITA, WIT). A platform-wide window shows each reader their own
school's zone. No polling is added: the existing timers already fire at 60, 30 and 15 minutes from one server read, and
a person arriving inside the warning sees the time left (`pintar_status_saya`).

**Transactions and locks.** As D6 states: the window row first, then sittings in id order (§6.2), in short batches.

**Idempotency.** Stopping an already stopped scope and lifting an already lifted window change nothing and write no
second audit row.

**Backward compatibility.** Existing windows are valid under the new scope and reason columns. M148's cases keep their
meaning.

#### E · Educational semantics
- Planned maintenance never changes an assessment's conditions: no time is added, nothing is submitted for the learner.
- An emergency costs the learner no time and decides nothing about their work. What they had answered is what they still
  have; what remained is what they get back.
- Professional-learning sittings follow the same containment (they are sittings); who may act on them is unchanged.

#### F · UX requirements
Daisy reviews before build. Reuse the scheduling form, the banner and the pause page.
- **Scheduling (school admin):** scope choice (the school, or classes picked from the school's active classes); the
  reason list; start and end in the school's zone; a collision message. **Extend** and **resume early** on a listed
  window, each with a reason and a confirmation.
- **Emergency (platform admin):** class added to the scope choice; the typed phrase as today.
- **Affected learner:** the banner at 60/30/15 with the time left and the start in their zone; the pause page with the
  expected end; after an emergency, on return, the player says the sitting was held and shows the restored time (a
  notice in the pattern of A1's player notices, with its own key).
- **Refused start (D4):** one sentence naming when the window begins.
- **Teacher:** A1's sitting list shows «Ditahan» for an emergency-held sitting with the cause in neutral words; no act
  is offered on it while the stop is in force.
- **States:** none scheduled; scheduled; approaching; active; extended; ended early; emergency active; lifted.
- **Mobile and keyboard:** as the existing screens. **Print:** none.

#### G · Ordered implementation instructions
1. Preconditions: A1 closed and reconciled; completion page reviewed by Sharon and Daisy (D6's rules and its stated
   edge in particular).
2. Database, in this order: scope and reason columns; `maintenance_affects` and the hook for class scope (measured);
   extend; the start refusal (D4); the emergency hold and release on A1's held state; class scope on the emergency;
   registry rows; audit rows.
3. Contract: `src/lib/pemeliharaan-kontrak.ts` gains the scope, the reason codes, the new refusal code and the zone;
   `jamWib` callers move to the zone-aware formatter.
4. Server actions in `src/app/konfigurasi/actions.ts` for the new acts.
5. UI: scheduling, banner, pause page, the player's held notice, the teacher's list.
6. Tests. 7. Rendered check at three widths, keyboard only, both a WIB and a WITA school. 8. Acceptance.

#### H · Verification
- **Database (red first):**
  - A class-scoped window affects its learners and teachers and nobody else in the school (red today: no class scope).
  - A start whose deadline would cross a planned window is refused; one that fits is accepted.
  - A planned window: a running sitting drains and is scored by the ordinary rule; nothing is held.
  - **Emergency:** every open sitting in scope is held with its remaining time; the scheduled closer and the lazy check
    skip it past its original deadline (red today: ended and scored); on lift each resumes with exactly the stored time;
    answers are byte-identical before and after; a suspended learner's sitting stays held after the lift.
  - Extend and resume early are audited with before and after; a school admin cannot stop immediately; a school admin
    cannot schedule for another school's class.
  - **Concurrency on real connections:** the scheduled closer running while the stop commits and while marking is in
    progress, over sittings whose deadlines fall inside that interval: none is ended or scored. A hold racing a
    hand-in; a lift racing a teacher's act; a lift racing the learner's first request (the gate releases by the same
    rule).
  - **Scale and interruption:** a stop over several thousand open sittings marks them in batches; the marking is
    killed halfway and resumed; the lift happens with marking incomplete. Every sitting ends with exactly
    `ended_at + (deadline − starts_at)`.
  - **Overlapping stops:** a sitting stays held until the last one lifts.
- **App:** the warnings at 60, 30 and 15 with a mocked clock, in WIB and WITA; arriving at T−20 shows the time left; the
  pause page; the player's held notice.
- **Regression:** M148-*, A1-S01 to S09, F37 and F38 green; the pre-request hook's timing within the measured budget.
- **Journey:** "the platform admin stops one class during Uji Penguasaan, lifts it 20 minutes later, and the class
  finishes with the time it had."

#### I · Acceptance criteria
1. C7 and C8 demonstrated at class, school and platform scope.
2. Planned maintenance changes no sitting's conditions; an emergency loses no answer and no time and scores nothing.
3. Every time shown is in the reader's school zone.
4. Suite, CI and journeys green on the candidate; Sharon's and Daisy's result reviews closed.

#### J · Escalate only if
- Sharon finds the late-sync edge in D6 unacceptable and no rule inside A1's mechanisms closes it.
- The class test cannot be added to the pre-request hook within the measured budget.

---

### 5.4 · C2w — Misconception annotations (C2)

**Review before build:** Sharon; Daisy short. **Depends on:** C1w. **[P-C1w]** throughout.

#### A · Objective
An authorized reviewer can record what a wrong option really reveals about a learner's thinking, after the question is
sealed, without changing the question, any score or any report. Users: reviewers (write); authors, reviewers and
teachers (read).

#### B · Scope
**In:** an annotation table; create and supersede; display in Studio and beside the class misconception report.
**Out:** editing an option's `misconception_code` on sealed content; any metric, calculator or report figure that reads
annotations; learner-facing display; AI-suggested annotations.

#### C · Existing architecture
| Thing | Where |
|---|---|
| Option's code | `item_options.misconception_code` → `misconception_taxonomy` (`M/20260912112712…:186,262`) |
| Sealed content guard | `enforce_taught_content_immutable` (latest `M/20260914120000…:242`) |
| Class misconception metric | `calc_class_misconceptions` (latest `M/20270111100000…:1124`) over `scoped_service_cohort_misconceptions` |
| What a calculator may read | `metric_sources`, `assert_metric_closure` (`M/20260923110000…:726`), F06-P13 |
| The refusal precedent | F07-P11 refuses `feedback_%` as a source (`selftest/db/fable07.sql:1087`) |
| Review capability | `CAN_REVIEW`, used by `kembalikan_paket` (`M/20261214100000…:139`) |
| Stable question identity, «Riwayat soal» | C1w **[P-C1w]** |

#### D · Proposed technical design
**The table.** One row per annotation: the question's **stable identity** (C1w), the item revision it was written
against, optionally the option it concerns, the text, the author, the instant, and an optional pointer to the annotation
it supersedes. Rows are immutable. A correction is a new row that supersedes; nothing is edited or deleted (truth table,
C2).

**Why the stable identity.** An annotation is knowledge about the question, so it stays visible across revisions. Each
display states which revision it was written against, so a reader can see when the question has changed since.

**Authorization.** Create: a holder of `CAN_REVIEW` over the content's tenant (school content: that school; platform
library content: the platform's content reviewers). Read: anyone who may read the item in Studio, and a teacher who may
read the class misconception report for a class taught that question. Never a learner.

**Invariants.**
1. No sealed row changes when an annotation is written. Proven by hashing the question, its options, every result and
   every metric evaluation before and after.
2. The table is not a metric source, and the closure test refuses it by name (the F07-P11 pattern). No `calc_*`, no
   metric source view and no report function depends on it.
3. It is absent from the learner projection (the closed allow-list already guarantees this; a test states it).

**Platform content.** An annotation on a library question is written once and read by every school that received the
release. A school does not annotate platform content in 4.1 (schools adapting platform content is later than 4.2).

#### E · Educational semantics
An annotation is commentary, attributed and dated. It is never evidence. A report may show it **beside** a figure,
marked as an annotation with its author and date; it never alters the figure, and "none" is shown as nothing, not as a
claim that the question has no misconception.

#### F · UX requirements
- **Studio › question (in «Riwayat soal» or beside it, Daisy's choice):** the annotations for this question, newest
  first, each with author, date and the revision it was written on; «Tambah catatan» for a reviewer; «Perbarui» creates
  a superseding note and shows the earlier one as replaced.
- **The class misconception report:** where a misconception row comes from an annotated question, a quiet «Catatan
  peninjau» disclosure with the same attribution. Closed by default.
- **States:** none; one or more; a superseded note; refused (not a reviewer); saved.
- **Limits:** plain text, a bounded length; no markup.
- **Mobile, keyboard:** the disclosure and the form by keyboard at 320 px. **Print:** annotations do not print with the
  report unless Daisy rules otherwise.

#### G · Ordered implementation instructions
1. Preconditions: C1w closed; reconcile this section against its identity column and history screen.
2. Database: the table, its immutability guard, create and supersede, the two readers, registry rows, audit rows, the
   metric-source refusal.
3. Contract file and copy. 4. Server actions. 5. UI in Studio, then in the report. 6. Tests. 7. Rendered check.
8. Acceptance.

#### H · Verification
- **Database (red first):** before and after an annotation, the question, options, results and all metric evaluations
  for an affected class are byte-identical. A non-reviewer, a learner and another school's reviewer are refused. An
  annotation cannot be updated or deleted. Declaring the table as a metric source fails the closure test.
- **App:** a reviewer adds and supersedes a note; a teacher reads it beside the report; a learner's surfaces and API
  answers never contain it.
- **Regression:** F06-P02, F06-P13, F36-M01, F23-* green and unchanged.

#### I · Acceptance criteria
1. Adding an annotation changes no existing score, result or report figure, proven by the before-and-after test.
2. Annotations are attributed, immutable and superseded, never edited.
3. No learner can read one. Suite, CI and journeys green; Sharon's result review closed.

#### J · Escalate only if
- C1w's final identity model cannot carry an annotation across revisions (then the fallback is per-revision annotations,
  which changes what educators see and is the owner's to accept).

---

### 5.5 · A3 — Recovery (C1 without Exam Mode)

**Review before build:** Sharon and Daisy, full. **Depends on:** A1, A2, B1. **The red cases are written first**
(O41-3).

#### A · Objective
A learner whose device fails during an assessment continues on another, and no sitting is ever written by two devices.
Today two signed-in devices of one learner can both write to one sitting (the residual accepted in 4.0). Users: learners;
teachers, who authorize recovery for Uji Penguasaan.

#### B · Scope
**In:** a single-writer controller on every sitting, checked at every boundary that changes a sitting, service-level
operations included; refusal of stale-device writes; self-recovery for low-stakes modes after re-authentication;
teacher-authorized recovery for Uji Penguasaan, from A1's sitting panel; an audit record of every recovery.

**Out:** Exam Mode and any EXAM path (O41-9); QR or token hand-over between devices; reopening a finished sitting;
offline recovery beyond what the late-sync grace already allows.

#### C · Existing architecture
The boundary list is `C1-D125-INVESTIGATION.md` §2. Latest definitions at `7dfe2bc8` **[P-A1]**:

| Boundary | Function (latest) | Locks today |
|---|---|---|
| Start | `start_learning_session` (`M/20270112120000…:16`; A1 rewrite `M/20270114100000…:778`) | advisory per (person, assignment); assignment `FOR SHARE` |
| Open | `open_assessment_session` (`M/20270111100000…:1375`) | none |
| Answer | `record_answer` (`M/20261005100000…:114`), `submit_response` `:46`, trigger `enforce_response_write` (`M/20270114100000…:481`) | **none** |
| Pause, resume | `pause_session`, `resume_session` (`M/20260913090000…:660,675`) | none |
| Submit, finish | `submit_session` (`M/20260913094000…:109`), `finish_my_session` (`M/20261005100000…:258`) | none |
| Finalize | `finalize_session` (`M/20261129100000…:104`) | none (idempotent by result check) |
| Item view | `note_item_view` (`M/20260913090000…:540`) | none |
| Final answer | `session_final_responses` (`M/20260914094500…:181`) | highest `client_seq` with `is_final` |
| Staff acts | A1's functions; `terminate_session` (`M/20270112150000…:8`) | sitting `FOR UPDATE` (A1) |
| Deadline | `pengerjaan_putus_tenggat` (`M/20270114100000…:325`), the scheduled closer | sitting `FOR UPDATE` |
| Assignment end | `akhiri_penugasan` (`M/20270113100000…:174`), `tutup_asesmen_terbuka` | assignment, then sittings by id |

Other facts:
- The verified device identity available today is the Auth session id, a JWT claim read by `sesi_saya()`
  (`M/20261117100000…:75`). The browser cookie hash (`device_contexts`) reaches the database as a **parameter**
  (`src/proxy.ts:132-141`).
- Stakes are told apart by `mode`: PRE_TEST, QUICK and PRACTICE are low-stakes; POST_TEST is Uji Penguasaan
  (`C1-D125-INVESTIGATION.md` §3). There is no stakes column and none is needed.
- The double-start race (SI-D02) is corrected (`M/20270112120000`, F37-R01). Sharon's verdict on the stronger-race
  re-review is not recorded on the branch read (register N-5).
- The player: `ItemPlayer.tsx` (answers `:235-290`, the 45-second check `:217-231`), actions in
  `src/app/belajar/actions.ts`.
- Sharon's review of the first controller design (`1f7b6fc2`, summarized at `SCOPE-REGISTER.md:255`) left five gaps.
  This design answers each, below.

#### D · Proposed technical design

**D1 · The controller.** Each sitting records who may write it: the **controlling Auth session** and a
**generation** (an integer that only grows). Both live on the sitting row.

**D2 · Identity comes from the verified claim** (Sharon's gap 1). The controller is compared with `sesi_saya()`, the
session id inside the verified token. No function takes a device or session identifier as a parameter. The cookie hash is
not used for control.

**D3 · The server decides the generation** (gap 2). The client never sends one. A recovery increments it inside the
database, under the sitting's row lock.

**D4 · One rule at every learner boundary.** Each of start, answer, pause, resume, item view, submit and finish:
1. takes the sitting's row lock (`FOR UPDATE`) first;
2. requires the caller's verified session to be the controller, else refuses with a designed code (stale writer);
3. then applies A1's gate and its own existing checks.
The natural place is A1's `pengerjaan_gerbang`, which most learner boundaries already call **[P-A1]**; `record_answer`
and the response trigger gain the row lock they lack today.

**D5 · Service-level and staff writers** (the owner's second ruling on O41-3). The scheduled closer, finalization, A1's
teacher acts, the suspension and emergency holds, and the assignment-ending paths are not devices and are not checked
against the controller. They **are** bound by the same row lock and the one lock order (§6.2), so none can interleave
with a learner write or a recovery. A test enumerates every function that writes `assessment_sessions` or `responses`
and fails if one neither checks the controller nor is on the declared service list (gap 4, the completed boundary list,
kept complete by a test rather than by a document).

**D6 · Start.** The first start sets the controller to the starting session, generation 1. A sitting already open when
the migration lands has no controller; the first learner write claims it. That is a one-time transition, stated in the
migration and tested.

**D7 · Recovery is a new generation, never a second writer.**
- **Low-stakes (PRE_TEST, QUICK, PRACTICE):** the learner, signed in again on any device, asks to continue. The database
  checks ownership and status, increments the generation and sets the controller to the caller's session, in one
  transaction. The old device's next write is refused.
- **Uji Penguasaan (POST_TEST):** the same act is refused unless a teacher has authorized it. From A1's sitting panel the
  class's teacher (`CAN_MANAGE_SITTINGS` over the sitting's place) records an authorization with a reason. It is
  single-use, lasts 10 minutes, is enforced in the database, and names no device (**owner ruling D-3**). An expired or
  used authorization is refused. The learner's next continue
  request consumes it.
- Both write an audit row (who recovered, who authorized, when, the generations) and, as today's reconnects do, an
  integrity observation in the RECONNECT category. A recovery adds no time and changes no answer.

**D8 · Which answer counts** (gap 3). Every response row records the generation under which it was acknowledged.
Accepted evidence is never discarded: answers acknowledged under an earlier generation remain. The final answer for an
item is the final response with the highest (generation, `client_seq`). Because a stale device cannot write after a
recovery, a later generation's answer can never be overtaken by an earlier device's higher sequence number.
`session_final_responses` is the one place that changes; scoring reads it unchanged.

**D9 · The finishing manifest.** `finish_my_session` checks the finishing device's own manifest (PR006). After a
recovery the new controller's manifest is judged against the answers the server holds for the sitting, whatever
generation acknowledged them, so answers sent by the failed device and acknowledged are part of the paper.

**D10 · Interactions.**
- **Privacy lock (PT423)** and **maintenance (PT503)** stay request-level and are evaluated before any recovery call. A
  recovery is not exempt: it cannot be made by a locked session or during a window.
- **Held sittings** (suspension, emergency): a recovery of a held sitting is refused with A1's `SITTING_FROZEN`. After an
  emergency lift the learner recovers normally; the restored remaining time belongs to the sitting, not to a device.
- **Deadline during a recovery:** the recovery takes the row lock, then the deadline rule runs first. A sitting past its
  deadline is ended by the ordinary rule and not recovered.
- **A staff act racing a recovery:** serialized by the row lock; whichever commits first is seen by the other.

**D11 · A consequence educators will notice** (**owner ruling D-2, 11 Nov: approved**). The controller is the Auth session. A learner who signs
out and in again, or whose card session expires, on the **same** device has a new session and therefore needs a
recovery: automatic for low-stakes work, teacher-authorized for Uji Penguasaan. Treating "the same browser" as the same
writer would need the cookie hash, which arrives as a parameter and which Sharon's review rules out as identity. The
design keeps the strict rule and makes the player re-attempt recovery silently for low-stakes modes, so only Uji
Penguasaan shows a wait.

**D12 · Refusal codes.** New codes in A1's domain (PR170, `pengerjaan_tolak`): not the controller; recovery not
authorized; authorization expired or used; nothing to recover. The player maps "not the controller" to a calm screen
that offers «Lanjutkan di perangkat ini», never to a generic error.

#### E · Educational semantics
- An attempt has one writer at a time. Two devices can never both contribute answers unseen by each other.
- Accepted answers are never lost and never rewritten by a recovery.
- A recovery is not a new attempt: no attempt is used, no time is added.
- For Uji Penguasaan the teacher, who is present and accountable, decides that the person continuing is the learner.
  The platform admin has no part in it.
- A sitting that cannot be reconciled stays as it is and is never auto-submitted (truth table, C1); the teacher's A1
  acts («Akhiri», «Tidak dihitung») remain the way out.

#### F · UX requirements
Daisy reviews the journeys and wording in full before build.
- **Learner, new device, low-stakes:** opening the assessment continues where they left off, with one quiet line that
  the sitting was continued on this device.
- **Learner, new device, Uji Penguasaan:** a waiting screen: what happened, that the teacher must allow it, and a
  «Coba lagi» that checks for the authorization. No countdown that reveals the expiry mechanism; if it expires, the same
  screen.
- **Learner, old device:** on its next send or 45-second check: "this sitting continues on another device"; nothing more
  can be entered; unsent answers on that device are named as not sent.
- **Teacher (A1's panel on `/mengajar/[kelas]/siapa`):** an act «Izinkan lanjut di perangkat lain» on an open Uji
  Penguasaan sitting, with a reason and a confirmation; the row shows that a recovery was authorized, and later that it
  was used, with the time.
- **States:** nothing to recover; waiting; authorized; expired; recovered; refused (held, ended, maintenance).
- **Accessibility and mobile:** all three learner screens at 320 px and by keyboard; the waiting screen announces its
  change of state.

#### G · Ordered implementation instructions
1. **Preconditions.** A1, A2 and B1 closed. The completion page reviewed in full.
2. **Red cases first,** as failing tests on the pre-change commit: the ten of `C1-D125-INVESTIGATION.md` §5 (case 4 is
   already F37-R01) and Sharon's ten further cases from her review at `1f7b6fc2` (to be obtained from Sharon; register
   N-4).
3. **Database, in this order:** the controller columns and the response generation; the lock-order statement as a
   comment in the migration and a lint; the gate at every learner boundary; the service list and its enumeration test;
   the recovery act; the teacher's authorization; `session_final_responses`; the finish manifest rule; registry rows;
   audit and integrity rows.
4. **Contract.** `src/lib/pengerjaan-kontrak.ts` gains the codes, the recovery states and the panel's new act.
5. **Server.** `src/app/belajar/actions.ts` and the engine: the continue path and the mapping of "not the controller".
   The teacher's action beside A1's in `src/app/mengajar/pengerjaan-aksi.ts`.
6. **UI.** The player's three screens; the panel's act.
7. **Tests** (H). 8. **Rendered check.** 9. **Acceptance.**

#### H · Verification
- **Concurrency, deterministic, on real connections** (the standard F37-R01 set): two devices answering at once; finish
  on A with B's answers in flight; answer while paused from the other device; old A after a recovery; two recoveries at
  once; a recovery racing a teacher's ending, an extension, the scheduled closer and an emergency hold.
- **Database:** every learner boundary refuses a non-controller. The enumeration test covers every writer. A recovery
  leaves every earlier response byte-identical. The final answer follows (generation, sequence). A POST_TEST recovery
  without, with an expired, and with a used authorization is refused; with a valid one it succeeds once. A sitting open
  at migration time is claimed by its first write.
- **App:** the three learner screens; the teacher's act by keyboard.
- **Regression:** the whole sitting surface: F03, F04, F37, F38, R1's sequence and manifest tests, A1-*, M148-*, and the
  A2 tests.
- **Journeys:** "a tablet dies during Pemetaan Awal and the learner continues on another"; "a laptop dies during Uji
  Penguasaan, the teacher allows it, the learner finishes"; "the old device comes back and cannot write".

#### I · Acceptance criteria
1. Every red case written first is green.
2. Two devices can never both write: proven by the concurrency set, not by review.
3. No accepted answer is lost in any recovery path.
4. The enumeration test shows no unguarded writer.
5. Suite, CI and journeys green on the candidate; Sharon's and Daisy's full result reviews closed.

#### J · Escalate only if
- A boundary cannot take the row lock without an unacceptable cost under load (the engineer measures answer latency
  before and after).
- Sharon's further red cases reveal a boundary this design cannot guard.

---

### 5.6 · C3w — AI-assisted question generation (C3)

**Review before build:** Sharon and Daisy, full. **Depends on:** C1w, B1, the entry gate. **Built last** (O41-6).
**[P-C1w]** throughout.

#### A · Objective
An educator turns source material into draft questions faster, and stays the author of record for everything that
reaches a learner. Users: authors (generate, edit), reviewers and publishers (the existing second person); learners see
only published questions.

#### B · Scope
**In:** source material supplied or selected by the educator; a generation request; drafts with provenance placed in
C1w's draft state; editing, review and publication exactly as for any draft; provenance visible to educators and
reviewers; cost and rate limits.

**Out:** any generation that publishes or submits for review by itself; AI review, AI approval, AI scoring; AI
annotations; learner-facing assistance (`src/ai-gateway/contexts.ts` stays unused); a learner-visible AI label; sending
learner data to a provider; provider selection (the owner's, O41-1).

#### C · Existing architecture
| Thing | Where |
|---|---|
| Draft state and in-app editor | C1w **[P-C1w]** |
| Author → reviewer rule | `enforce_content_status` (`M/20261213100000…:52-72`): APPROVED needs `CAN_REVIEW` and refuses the author |
| Content check | `validate_course_content`, `run_mcq_quality` (latest `M/20260919090000…:35,90`), run by `advanceContentAction` (`src/app/studio/actions.ts:73`) |
| Release and publish | `create_release`, `freeze_release` (refuses the author), `publish_release` (`M/20261009100000…`) |
| Learner projection | closed allow-list (§1.2) |
| Vendor names in schema | **refused** by the INV-32 guard for any column, table or enum name (`M/20260912201500…:488-527`) |
| Outbound pattern, secrets | `src/app/api/_email/` and `src/lib/env.ts` (§1.2) |
| The evaluation kit | `docs/completion-4.1/c3-eval/` (prompts v1 and v2, `item-schema.json`) |

#### D · Proposed technical design

**D1 · The flow.**
1. The author opens a draft package and chooses «Buat draf soal dari materi».
2. They supply source material (pasted text, or a lesson of the same package) and choose how many questions and for
   which objective.
3. The server validates, reserves a ledger row, calls the provider, validates the response against the item schema, and
   only then inserts the questions as **drafts** in that package, each with a provenance row.
4. The author edits them in C1w's editor like any draft. The content check, the review by a second person, the release
   and the publication are the existing ones, unchanged.

**D2 · A generated question is an ordinary draft.** It is written through the same path as a hand-written draft, by the
requesting educator, who becomes its author. Therefore the two-person rule already refuses that educator as its
reviewer. No new status, no parallel lifecycle.

**D3 · Provenance.** One side table, one row per generated question, never a column on `items`:
the question's stable identity; the generation request; the model's identifier and version **as a value** (the INV-32
guard forbids vendor names in schema names, so the columns are named neutrally, for example `model_ident`); the
provider's request id; the prompt version; the source material reference and a hash of the excerpt sent; the requesting
educator; the instant. Rows are immutable. When the author edits the draft, the provenance row stays: the question's
history then shows "drafted with assistance, edited by {name}". When the question is revised after publication, lineage
(C1w) carries the origin.

**D4 · Hidden from learners at the database and the API.** The provenance table is granted to no learner role and is
read only through a Studio reader that requires `CAN_DRAFT` or `CAN_REVIEW` over the content. The learner projection's
allow-list does not change. Tests: the closed-projection assertion extended to name the table; a scan of every
learner-reachable RPC answer for the provenance keys; the engine's forbidden-key list gains them.

**D5 · The generation request and its ledger.** A table of requests in the pattern of the email send log: who, which
package, how many asked, the outcome (`DRAFTED`, `REFUSED_LIMIT`, `PROVIDER_FAILED`, `INVALID_OUTPUT`), token counts and
the cost estimate. It stores **no** source text beyond the hash and a bounded excerpt reference, and no provider key.

**D6 · A failed generation creates nothing.** The questions and their provenance rows are inserted in one transaction,
after the whole response has validated. A provider error, a timeout, an output that fails the schema, or a question with
no single correct key leaves zero rows and one ledger row with the reason. A partial batch is not kept.

**D7 · Limits** (**owner ruling D-6: approved in principle**). The system supports governed limits per educator, per
school and per month, checked before the call (the `email_send_would_allow` pattern). **No number is set in this plan.**
The numbers are set by the owner after the provider evaluation has measured real cost and operational constraints. The
build ships with generation refused until limits have been set, so an unset limit can never mean unlimited.

**D8 · The provider module.** One `server-only` module behind one interface (request in, validated items out), so the
owner's choice is a configuration and one adapter. Settings and the key are read through `src/lib/env.ts` getters; the
owner enters the key himself. Nothing about the provider appears in a schema name or in copy.

**D9 · What is sent.** The source excerpt, the objective, the item schema and the versioned prompt. Never a learner's
name, answer or result; never another school's content. The request builder is a pure function with a test that scans
its output.

**D10 · Source material rights** (**owner ruling D-5: approved with safeguards**). For each request the author
explicitly confirms that they have the rights or permission to use the submitted material; the confirmation is recorded
with the request, and a request without it is refused. The confirmation alone does not establish legal permission:
before any educational material is transmitted to a provider, the evaluation (E) must have examined the applicable
licensing restrictions, the provider's data handling and its contractual terms, and C3w's entry gate requires that
finding.

**D11 · Idempotency and retries.** A request has a client-generated key; a repeated submit returns the first outcome and
does not call the provider again. The server retries a transient provider failure a bounded number of times inside the
limits.

#### E · Educational semantics
- AI drafts; educators decide. Nothing generated reaches a learner without an educator's edit-or-accept, the content
  check, and a second educator's approval.
- A materially wrong key is a critical defect (O41-1). The existing content check runs on generated drafts exactly as on
  written ones, and the review screen shows the key and rationale prominently for a generated draft.
- Provenance is part of the question's history for staff, for good. Learners get approved questions with no AI label.
- Statistics and comparability rules are C1w's and unchanged: a generated question is a question.

#### F · UX requirements
Daisy reviews the generation and review flow in full.
- **Generate (in the draft package):** source, objective, count; the rights confirmation; the limits left today; a busy
  state that can take tens of seconds, with a plain explanation; cancel leaves nothing.
- **Result:** the new drafts listed, each marked «Draf dengan bantuan AI» for staff, opening in C1w's editor. Failure:
  one sentence per cause (limit reached, the service did not answer, the answer could not be used), nothing created.
- **Review queue and review screen:** the same mark and a «Asal-usul» disclosure (model, prompt version, source
  reference, who asked, when).
- **Question history:** the origin line.
- **States:** no source; limit reached; working; drafted n of n; failed; refused (not an author).
- **Accessibility:** the long-running state is announced; focus returns to the result. **Mobile:** usable at 390 px;
  authoring at 320 px may be read-only if C1w's editor is.
- **Never:** the provider's name or the word for the mechanism on a learner surface.

#### G · Ordered implementation instructions
1. **The entry gate** (all blocking): C1w closed; B1's write path verified; Studio journeys green on the head; Daisy's
   Studio consistency findings applied; the architecture reviewed by Sharon and Daisy; **the owner has selected the
   provider from E's results** (D-8; none is preselected); E's finding on licensing, data handling and contract terms
   (D-5); the numerical limits set by the owner (D-6); network egress and the key in place.
2. Database: requests and ledger; provenance; the Studio reader; limits; registry rows; audit rows; the projection and
   metric-source assertions.
3. Contract: `src/lib/…-kontrak.ts` with outcome codes, the provenance view type, the limits.
4. Server: the provider module and adapter; the request builder; the generation route (same-origin, `CAN_DRAFT` over the
   package, draft state only).
5. UI: generate, result, the marks and disclosures.
6. Tests, with the provider replaced by a local stub in the suite and CI (as the mail sink replaces SMTP).
7. Rendered check. 8. One supervised generation on staging against the real provider, recorded. 9. Acceptance.

#### H · Verification
- **Database (red first):** a generation inserts drafts only into a draft package the caller authors; the requester
  cannot approve them; a failed or invalid response creates nothing; limits refuse before any call; provenance is
  immutable; a learner role cannot read provenance by any path.
- **App (stubbed provider):** the full flow; each failure cause; a double submit calls the stub once.
- **Static:** only the provider module makes the outbound call; no schema name carries a vendor; no learner surface
  carries the mark; the request builder's output contains no person data.
- **Journey:** author generates → edits → second educator reviews and approves → release → publish → a class sits it →
  the teacher's report shows it like any question.
- **Quality gate:** the supervised staging run's drafts are checked by an educator for key correctness before
  acceptance; any wrong key that the content check and review would not have caught is a blocker.
- **Regression:** F23-*, the studio suites, F06-P02, C1w's tests, B1's.

#### I · Acceptance criteria
1. No draft reaches a learner without an educator's approval; proven at the database, not on the screen.
2. Provenance is kept for every generated question and is unreadable by learners at the API and database.
3. A failed generation creates nothing.
4. Spend cannot exceed the approved ceilings.
5. Suite, CI and journeys green; Sharon's and Daisy's full result reviews closed.

#### J · Escalate only if
- E's results show no provider meets the key-correctness bar (the walkthrough date follows; C3 is not shortened).
- The provider's binding data terms conflict with D9.
- Staging or production egress to the provider cannot be allowed.

---

### 5.7 · E — Provider evaluation

The plan is `C3-EVALUATION-PLAN.md`; it is approved (O41-14). It needs no product code and blocks nothing except C3w's
entry gate. **No provider is preselected** (D-8).

**Prerequisites to identify and prepare (owner ruling D-7).** Preparing them is authorized. Incurring cost,
provisioning a credential and transmitting material are **not** authorized by this plan; each is brought to the owner
when it becomes necessary.

| Prerequisite | What "ready" means | Whose action |
|---|---|---|
| Provider data-handling terms | For each provider: the binding terms on retention, training use, sub-processors and location, read from the official source and recorded with its date | prepared by engineering; accepted by the owner |
| Licensing of the material (D-5) | For the material to be sent: who holds the rights, and whether the terms above permit sending it. The synthetic chapters in the kit are the default because they carry no third-party rights | prepared by engineering; any non-synthetic material authorized by the owner in writing |
| Network access | The evaluating session can reach the three providers' API hosts | the owner (environment setting) |
| Credentials with spending caps | One key per provider with a provider-side cap; the script's own hard stop as the plan states | the owner enters them; never in the repository or a log |
| Named human evaluators | Two educator judges per item and a third for disagreements, named | the owner |
| Materials and criteria | The kit in `docs/completion-4.1/c3-eval/` (prompts, schema, material) and the rubric of the plan's §5, frozen before the first call | engineering; ready today |

**Additions to the evaluation's report** (from D-5 and D-6): the licensing and data-handling finding per provider; the
measured cost per accepted draft and any rate limit met, as the basis for the owner's numerical limits.

Result: a report to the owner. No selection and no integration before the owner decides.

---

### 5.8 · Z — One candidate

**Objective.** One commit on which the whole approved 4.1 experience works together, verified once.
**Instructions.**
1. Freeze scope: every batch closed; the register in `EXECUTION-PLAN.md` §5 triaged (blockers none; the rest stated).
2. Extend the integrated journeys (§6.6) and run them.
3. One full verification on the candidate: whole local suite, CI, journeys.
4. Sharon and Daisy, once each, on that exact commit, including the three 4.0 rendered checks still outstanding on
   staging (`EXECUTION-PLAN.md` §6) if a browser can reach staging.
5. Promote to staging on the owner's authorization; verify the migration count, the preservation counts, both scheduled
   jobs and each batch's screens.
6. The owner sets the walkthrough date (O41-7).
**Acceptance:** section 8.

---

## 6 · Cross-batch integration (Deliverable 5)

### 6.1 Shared database objects
| Object | Touched by | Rule |
|---|---|---|
| `assessment_sessions` | A1, A2, A3 | Columns are only added. A2 widens the held-cause check; A3 adds the controller. The state trigger `pengerjaan_jaga` stays the one guard of held sittings |
| `responses` | A3 | One added column (generation). The idempotency key is unchanged |
| The pre-request hook | A2 (class scope) | Measured before and after. A3 adds nothing to it |
| `pg_cron` jobs | A1, B1 | One shared installer (6.3) |
| `maintenance_windows` | A2 | Columns added; existing rows valid |
| `items`, identity, lineage | C1w, C2w, C3w | C2w and C3w add side tables keyed by C1w's identity; neither adds a column to `items` |
| `audit_log` | all | Unchanged in shape. New action names follow the `domain.verb` pattern and get words in `src/lib/jejak-audit.ts` |
| The accountability store | B1, B2 | Only B2 adds a kind's use; A3 and C3w write to `audit_log`, not here |

### 6.2 One lock order
A3 must publish it as a lint; every batch before A3 must already follow it, so A3 finds nothing to reorder.

`person → learning assignment → assessment assignments (by id) → sittings (by id) → advisory locks`

Evidence at `7dfe2bc8`: suspension locks the person and then sittings by id; assignment-ending paths lock the assignment
and then sittings by id; A1's per-sitting acts lock the sitting and then an advisory lock. **One exception to reconcile
[P-A1]:** `start_learning_session` takes its advisory lock first and then reads the assignment `FOR SHARE`. It inserts a
new sitting rather than locking an existing one, so it may be harmless; A3's design review settles it with Sharon
(already on her list: "the lock order with A3").

### 6.3 One job installer
A1 installs its job through `pengerjaan_jadwal_pasang`, and the restore procedure calls it. B1 adds a second job.
**Rule:** B1 introduces one general installer that installs every PINTAR job idempotently (A1's and B1's), A1's
installer becomes a call to it, and `restore-bundle.mjs` checks every job the installer declares. No later batch adds a
job outside it. The four DR tests are restated once, in B1.

### 6.4 Migration and promotion order
- Migrations continue the dated sequence after C1w's last one, one block per batch, in the serial order of §3. A batch
  never edits an earlier batch's migration.
- A1's scheduler needs `pg_cron` enabled on hosted staging (A1's commit records it as offered, not yet installed). The
  first promotion that carries it is authorized as that combined act. B1 adds no new extension.
- C3w's promotion additionally needs the provider's host allowed from staging and the key set by the owner.

### 6.5 Shared application contracts
- `src/lib/pengerjaan-kontrak.ts`: A1 owns it; A2 adds the emergency-held state; A3 adds controller codes and the
  recovery act. One file, one code list, one test that every database code has a sentence in both languages (A1-K01's
  pattern, extended).
- `src/lib/pemeliharaan-kontrak.ts`: A2.
- New: one contract file each for B1/B2, C2w and C3w.
- `src/lib/hle.ts`: every batch. Words are Daisy's at each result review.

### 6.6 Integration checkpoints
After each batch closes, the engineer extends the journeys and runs the platform-wide regression before starting the
next. The checkpoints that cross batches:

| After | Checkpoint |
|---|---|
| B1 | every existing identity journey still passes; the restored database has both jobs |
| B2 | each report prints with a resolvable reference; certificates unchanged |
| A2 | an emergency during an A1-managed sitting (extended, then stopped, then lifted) keeps the extension and the time |
| C2w | a key correction (C1w) on an annotated question keeps its annotations and changes no annotation |
| A3 | recovery during an extension; recovery after an emergency lift; recovery of a sitting whose assignment was moved by a C1w correction |
| C3w | a generated, published question goes through sitting, report, key correction (C1w) and annotation (C2w) like any other |

### 6.7 Historical data
No batch backfills or rewrites evidence. B1's history starts at its migration. A3's controller is claimed by the first
write on a sitting open at migration time. C2w and C3w add rows beside sealed content and never touch it.

---

## 7 · Decision register (Deliverable 6)

### 7.1 Settled (recorded, not reopened)
O41-7 to O41-22 and the earlier O41-1 to O41-6 as amended. The pre-build outcomes on the B0, A1 and C1w pages. The
maintenance ruling (D-094's drain preserved). The three carried rulings: school time zone, AI provenance hidden from
learners in the API and database, only «Cetak laporan» issues a reference.

### 7.2 Resolved here from existing decisions and code (no owner action)
| # | Question | Resolution | Basis |
|---|---|---|---|
| R-1 | Does recovery include an Exam Mode assignment path? | No | O41-9 supersedes the investigation's §3 remark |
| R-2 | Are export, past reports and a period selector in Lane B? | No | Owner decisions §4 |
| R-3 | Where does device identity come from? | The verified Auth session claim | Sharon's review, gap 1; `sesi_saya()` |
| R-4 | How are stakes told apart? | By `mode` | Investigation §3; no new column |
| R-5 | Can C2w's table feed a report? | No; refused as a metric source | Truth table C2; F07-P11 precedent |
| R-6 | Where does AI provenance live? | A side table with neutral column names | INV-32 guard; the 9 Nov provenance ruling |
| R-7 | Is a generated draft a new lifecycle? | No; an ordinary draft authored by the requester | Truth table C3; the existing two-person rule |
| R-8 | Order of the remaining batches | B1 → B2 → A2 → C2w → A3 → C3w → Z | `EXECUTION-PLAN.md` §1 dependencies; one engineer |

### 7.3 Owner rulings on this plan's questions — **OWNER APPROVED — 11 NOVEMBER 2026**

These are settled. They are not reopened without material new evidence.

| # | Ruling | Qualification | Where in this plan |
|---|---|---|---|
| **D-1** | **Emergency-stop containment: approved.** Affected open sittings are held with their answers and exact remaining time. They resume with that time when the authorized platform admin lifts the stop. Suspension-held sittings stay held | Safe under concurrency and at scale. No affected sitting is scored by the deadline scheduler while containment takes effect. A1's mechanisms; no second sitting-control system | §5.3 D6 |
| **D-2** | **Same-device reauthentication: approved.** The authenticated session is the authoritative writer. A new session is a new writer, even on the same device. Low-stakes recovery is automatic after reauthentication; Uji Penguasaan needs the teacher's authorization | Accepted answers preserved; the approved sitting-time rules apply | §5.5 D2, D7, D11 |
| **D-3** | **Teacher recovery authorization: approved.** 10 minutes, single use, enforced server-side | Expiry and reuse are refused | §5.5 D7 |
| **D-4** | **Accountability export events: approved.** B1 records print requests | No school data export and no export event in 4.1; both arrive in 4.2 | §2, §5.1 B |
| **D-5** | **Copyrighted source material: approved with safeguards.** An explicit educator confirmation of rights or permission for each AI drafting request, recorded | Confirmation is not legal permission. The provider evaluation examines licensing, data handling and contract terms before any educational material is transmitted | §5.6 D10, §5.7 |
| **D-6** | **AI usage limits: approved in principle.** Governed limits per educator, per school and per month | Numbers are set only after the evaluation establishes cost and constraints. None is invented now | §5.6 D7 |
| **D-7** | **Evaluation prerequisites: approved.** Identify and prepare: data-handling terms, network access, credentials with spending caps, named evaluators, materials and criteria | Not an authorization to incur cost, provision credentials or transmit material. Owner-dependent actions are brought to the owner when needed | §5.7 |
| **D-8** | **Provider selection: approved.** After the evaluation's results | No provider is preselected. The final choice is the owner's | §5.6 G1, §5.7 |

### 7.4 Material contradictions
None open. The one found (O41-20's deadline rule against C8's containment, in the code as built) is settled by D-1.

### 7.5 Non-blocking observations
| # | Observation | Goes to |
|---|---|---|
| N-1 | `selftest/a1.test.ts`'s header (A1-K01) still says "nothing is scheduled"; line 259 restates it | Second Eye, with A1's closure |
| N-2 | BOB-48's certificate sealing and numbering are on `main` under F20 ids (`M/20261201100000…`) | record only |
| N-3 | A print reference stops resolving after 12 months, with the purge | Daisy and the owner, at B2's page |
| N-4 | Sharon's ten further red cases for recovery are summarized at `SCOPE-REGISTER.md:255`; her full review (`1f7b6fc2`) is not on the branches read. Her review also covers the emergency-stop transaction race and the late-sync edge (§5.3, owner, 11 Nov) | Sharon, before A2's and A3's pages |
| N-5 | Sharon's verdict on the SI-D02 stronger-race re-review is not recorded on the branch read | Sharon |
| N-6 | `institutions.retention_days` exists and nothing enforces it | 4.2; B1 does not use it |
| N-7 | The warning banner formats times with `jamWib` and no zone today | fixed in A2 |
| N-8 | The production upgrade rehearsal 111 → 224 (R-2) grows with every 4.1 migration | the owner; outside this plan |

---

## 8 · Final acceptance framework (Deliverable 7)

PINTAR 4.1 is complete when **all** of the following hold on **one** candidate commit. A list of individually passing
batches is not acceptance.

### 8.1 Technical
- The whole local suite, CI and the journeys are green on the exact commit. No test was weakened; every restated test
  carries its note and the ruling it follows.
- Every red-first test of every batch is in the manifest and green.
- A fresh database built from the migrations equals the migrated staging database in schema; the restore procedure
  yields a database with both scheduled jobs.

### 8.2 Educational
Each statement is proven by a named test or journey on the candidate.
- A sitting has one writer; no accepted answer is ever lost (A3).
- No sitting stays open without a defined outcome; an abandoned one is scored on what was answered and says why it ended
  (A1).
- Maintenance changes no assessment's conditions; an emergency costs no time and judges no work (A2).
- A corrected key supersedes results on the record; a certificate whose result changed is under review, never silently
  valid or revoked (C1w).
- An annotation changes no score or report (C2w).
- No AI-drafted question reaches a learner without two educators; its origin is kept for staff and hidden from learners
  (C3w).
- No comparability is claimed between revisions of a question.

### 8.3 Security and integrity (Sharon, once, on the candidate)
- One permission boundary across screen, API, database, scheduled jobs and prints for every new operation.
- The enumeration test of sitting writers is complete; the lock-order lint passes.
- The accountability store holds no secret and no behaviour trail; retention is proven.
- Provenance and annotations are unreachable by learner roles.
- Every new act writes its audit row; `audit_log` is still append-only.

### 8.4 UX and accessibility (Daisy, once, on the candidate)
- Every new screen at 1280, 390 and 320 px, keyboard only, every disclosure opened.
- One vocabulary in Indonesian and English across all batches; every time in the reader's school zone.
- Printed reports carry the footer, legibly, in monochrome.
- The human NVDA and TalkBack check of the 4.0 Reporting Quality Gate stays a precondition.

### 8.5 End-to-end
The integrated journeys, run in one sitting on the candidate, each with no engineer's help:
1. **A school year in a day:** an admin signs in (recorded), a teacher assigns, a class sits Pemetaan Awal, one device
   dies and the learner continues on another.
2. **An interrupted Uji Penguasaan:** an extension, an emergency stop and lift, a device failure with the teacher's
   authorization, a finish, a certificate.
3. **A question's life:** drafted with AI, edited, reviewed by a second educator, published, sat, found to have a wrong
   key, corrected and confirmed, results superseded, the certificate reviewed, an annotation added.
4. **Accountability:** a failed sign-in, a sign-in, a printed report whose reference an admin looks up.
5. **Maintenance:** a class-scoped window announced, warned at 60, 30 and 15 in the school's zone, started, extended,
   ended early.

### 8.6 Ready for human evaluation
- The candidate is on staging by the protected process, with migration and preservation counts verified.
- The register of non-blocking findings is stated, with nothing in it that an educator would meet as a defect in the
  five journeys.
- The owner schedules the walkthrough with Dr Gladys and her educators (O41-7). Their recorded session is the only thing
  that moves a capability to "human-accepted".

---

## Reconciliation list (Phase 2, after C1w closes)

1. Re-read A1's final verified commit: the gate, the held-state columns and causes, the installer; update §1.2, §5.3 D6
   and §6.2.
2. Read C1w's final code: the identity column, the draft state and editor, «Riwayat soal», the key-correction and
   certificate-review objects; complete §5.4 and §5.6 and remove their provisional marks.
3. Obtain Sharon's full review of the controller design; complete A3's red-case list.
4. Carry any register items C1w adds for C2w or C3w into their sections.
5. Re-issue the plan for the owner's approval. (D-1 to D-8 were ruled on 11 Nov and are recorded in §7.3.)
