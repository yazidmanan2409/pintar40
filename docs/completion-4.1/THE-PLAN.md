# PINTAR 4.1 · THE PLAN

> **DRAFT — NOT APPROVED. FINAL APPROVAL CANDIDATE (revision 9, 11 Nov 2026),** by the Chief Architect (Bob), for
> the owner's review. **Nothing here authorizes implementation.** It becomes THE PLAN only on the owner's explicit
> approval.
>
> **Revision 9:** Sharon's nine A2 verification scenarios, in her original words, with her reading of them in this
> plan's terms (§5.3 H); her non-blocking point on the scheduled closer's selection (§5.3 D6.6); Daisy's English for
> the A2 refusals (§5.3 F). **Nothing further is outstanding for incorporation.**
>
> **Reviews of revision 8** (`0b40c97758691c956581cf314c2c45b0b73d3a23`): **Daisy: PASS** (recorded on
> `ux-1/daisy-experience` at `401d2d38`). **Sharon: BLOCKED for one reason only,** the nine scenarios missing from
> §5.3 H; her other blocker and all six clarifications verified. This revision adds them. Both reviewers' final
> verdicts are to name this revision's commit.
>
> Revision 8: Sharon's technical review of revision 5 and Daisy's UX review. Revision 7: rulings M-1 to M-3, C1w's
> final verification and the disposition of its findings (§7.7).
>
> **Reconciled against the code** of B0, A1 and C1w at `claude/system-integrity-4.0` `3a190dbf`, and against Daisy's
> design documents.
>
> Final completion records for B0, A1 and C1w are not under `docs/`; the three pre-build pages are unchanged since the
> planning merge. C1w's final verification is recorded in §1.1 as the owner relayed it.
>
> Earlier revisions: 1 preliminary consolidation; 2 owner rulings D-1 to D-8; 3 Sharon's A2 findings and ruling O1;
> 4 the mandatory pre-flight (§4.1); 5 reconciliation against the built code and Daisy's documents; 6 corrections after
> the independent assessment's conditional pass.

**What this document is.** The build-ready execution plan for everything in 4.1 after the foundations B0 → A1 → C1w.
It consolidates the approved records. It does not replace them and proposes no competing architecture.

**Authority, in order.** Where two records disagree, the earlier in this list wins.
1. `OWNER-DECISIONS-2026-11-11.md` (O41-7 to O41-22, the five process rules, the 4.2 list).
2. `EXECUTION-PLAN.md` (lanes, batches, how a batch runs, the register of non-blocking findings).
3. `batches/B0-COMPLETION.md`, `A1-COMPLETION.md`, `C1W-COMPLETION.md`.
4. `SCOPE-REGISTER.md` §1 (capabilities C1–C8) and §2 (truths), as the decisions above change them.
5. `C1-D125-INVESTIGATION.md`, `C3-EVALUATION-PLAN.md`, `C3-AI-PROVIDER-COMPARISON.md`.

**Evidence base.** `main` at `057eb2b0`; `claude/system-integrity-4.0` at `3a190dbf` (B0, A1 and C1w as built), read
only; `ux-1/daisy-experience` at `a2420446` (Daisy's `DESAIN-AWAL-4.1.md` and `TINJAUAN-A1-C1W.md` under
`docs/coordination/ux/completion-4.1/`). Paths below are relative to the repository; `M/` is `supabase/migrations/`. Evidence was
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
| A1 · sitting control | Built; final commit `7dfe2bc8`. Migrations `20270114100000`, `20270114110000`. Tests A1-K01, K02, S01 to S09, A01 to A03, J01 |
| C1w · item workbench | **Closed; Second Eye has formally stopped.** Final verification on `3a190dbfaad5ed71484ae8fc91a1fe4608cf5345` (owner, 11 Nov): local suite 1,056 passed, 0 failed, 0 skipped; planted defects 156 from plant files plus 50 embedded in CI, all verified across 26 local database steps; CI run `43020868681` success; journeys run `43020873278` success; working tree clean; nothing merged or deployed. The Chief Architect confirmed both runs on GitHub. Migrations `20270115100000`, `20270115110000`. Tests C1W-K01, K02, S01 to S06, C01, A01, A02, J01. Eight findings reported: §7.7 |
| Suite | 1018 manifest ids on `main`; 1057 on the work branch at `3a190dbf` |
| Migrations | 224 on `main`. **229 on the work branch, the verified repository count** (counted from the tree at `3a190dbf`: B0 one, A1 two, C1w two). No other count is used in this plan |

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
`(presented_item_id, client_seq)`. What A1 built (`M/20270114100000`, `M/20270114110000`):
- **The held state:** `frozen_at`, `frozen_cause`, `frozen_suspension_id`, `frozen_remaining_seconds` (null or ≥ 0),
  `unfrozen_at`, `unfrozen_by_person_id` (`:120-147`). **One cause only** (`ACCOUNT_SUSPENDED`, `:141`).
- **The state trigger** `pengerjaan_jaga` (`:209`): while held, any status change except to TERMINATED and any deadline
  change is refused (`SITTING_FROZEN`).
- **The effective deadline** `pengerjaan_tenggat_efektif` (`:249`): the sitting's own deadline, else its assignment's
  **current** `closes_at`, else none.
- **The one deadline decider** `pengerjaan_putus_tenggat` (`:325`): locks the sitting `FOR UPDATE`, skips a held one,
  and does not score while inside `late_sync_grace_seconds` (`:356`).
- **The learner gate** `pengerjaan_gerbang` (`:439`), injected by text into `record_answer`, `submit_session`,
  `pause_session`, `resume_session`. **It takes no lock.**
- **The scheduled closer** `pengerjaan_tutup_terjadwal` (`M/20270114110000…:28`): **a function, so one transaction per
  run,** up to 500 sittings (maximum 5000); it excludes held sittings in its query; run every 5 minutes by `pg_cron`
  through the idempotent installer `pengerjaan_jadwal_pasang` (`:79`).
- **Paths that end sittings without consulting the held state:** `terminate_session` (`M/20270112150000…:8`; the
  trigger allows TERMINATED), `akhiri_penugasan` for both «Akhiri» and «Tarik» (`M/20270113100000…:174`), and
  `tutup_asesmen_terbuka` (`M/20270112200000…:24`), which enrolment termination, a transfer and the promotion run all
  call. The last one **scores** a sitting past its deadline and terminates the rest unscored
  (`INSTITUTIONAL_REVOCATION`).
- No migration sets an isolation level: the default, READ COMMITTED, applies.

**Maintenance.** One system (`M/20261120100000`): `maintenance_windows` (PLANNED or EMERGENCY; platform or a list of
schools), a T−15 start block (trigger on sitting insert, `:175`), the drain rule `maintenance_draining` (`:135`), PT503
at the pre-request hook, the pause page `src/app/pemeliharaan/page.tsx`, the banner `PitaPemeliharaan` with browser
timers at 60/30/15 (`src/lib/pemeliharaan-kontrak.ts:103`).

**Content.** `courses → modules → lessons → items → item_options`; a status allow-list with the two-person rule inside
`enforce_content_status` (`M/20261213100000…:52-72`); releases in `plp_releases`; sealed content immutable
(`enforce_taught_content_immutable`). What C1w built (`M/20270115100000` = M1, `M/20270115110000` = M2):
- **A question's identity is its lineage, not a new column.** C1w added no separate identity. A revision's question
  points to its predecessor through `items.supersedes_item_id`, now guarded against crossing schools (M1`:167`). An
  uploaded workbook may name the predecessor it replaces (M1`:659-762`). The chain is read by `riwayat_soal(item)`
  (M1`:1038`; `CAN_DRAFT` or `CAN_REVIEW` in the question's school).
- **In-app drafting:** `ubah_soal_draf`, `tambah_soal_draf(lesson, jsonb)`, `hapus_soal_draf`, `buang_draf` (M1`:405-558`),
  allowed while the package is INGESTED, STRUCTURED, VALIDATED or VALIDATION_FAILED and unsealed; `CAN_DRAFT` in the
  owning school; refusals `soal_tolak`, PR180; every edit attributed in `item_draft_edits` (append-only; field names,
  never text).
- **Revision and release:** `revisi_soal`, `salin_kursus_revisi`, `create_course_revision` (head only);
  `publish_release` replaces the predecessor; `withdraw_release` blocks new sittings (`start_learning_session` and
  `may_start_assessment` patched by text again, M1`:1213-1239`). Withdrawn and replaced are both SUPERSEDED, told
  apart by columns.
- **Wrong-key correction** (M2): `key_corrections`, propose and confirm by two different people (`koreksi_tolak`,
  PR190); `assessment_result_bases`; **the result in force is `hasil_terkini_id(session)`**, the learner's is
  `hasil_murid_id`; `certificate_reviews` and the DITINJAU verification state; school notices in-app.
- **Nothing in C1w mentions annotations, provenance or AI.** No hook was left for C2w or C3w; none is needed (§5.4,
  §5.6).

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
| A2 | A1 | the held state and its guard; the deadline decider; the effective-deadline rule; the scheduled closer |
| A3 | A1, A2, B1 | the sitting gate and row-lock discipline; the teacher's sitting panel on `/mengajar/[kelas]/siapa`; A2's emergency hold; B1's sign-in events |
| B2 | B1 | the print-request event and its reference |
| C2w | C1w | the lineage chain and its reader `riwayat_soal`; «Riwayat soal» on the package page |
| C3w | C1w, B1 | `tambah_soal_draf` and the in-app editor; the two-person review; B1's write path |
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

**Order, reconfirmed against the built code: B1 → B2 → A2 → C2w → A3 → C3w → Z,** with E alongside. Nothing in the
final B0, A1 or C1w code changes it, and no owner approval is needed for the order. Why:
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
   - Every function that changes a sitting takes its locks in the order of §6.2: from A2 onwards **the emergency
     fence in shared mode first, the sitting's row lock second.**
4. **Application conventions.** A contract file `src/lib/<domain>-kontrak.ts` (codes, types, readers); all copy in
   `src/lib/hle.ts`, Indonesian and English; no raw server text on a screen (D-011); screens reuse Daisy's shared
   components (the Collection, the Dialog, the reason field, `BarisHasil`, `HalamanPenolakan`, `pin-*` classes).
5. **Tests.** Red before green, with the red run recorded on the commit before the change. Never weaken a test. A
   restated test carries a `RESTATED, <batch> (<ruling>)` note. A new static route joins `ROUTE_INVENTORY`.
6. **The engineer's rendered check** before any review: 1280, 390 and 320 px; keyboard only; every disclosure opened; the
   reviewer's own navigation sequence.
7. **Acceptance** is the whole local suite, CI and the journeys, green on the exact candidate commit. Then one review of
   the result, one correction pass, close. **The pre-flight of §4.1 comes before every CI dispatch.**
8. **Blockers** are a demonstrated failure of security, authorization, evidence integrity or an essential journey.
   Everything else goes to the register in `EXECUTION-PLAN.md` §5.
9. **Never:** a production action; a merge without authorization; `.github/*-request.txt`; a change to
   `supabase/config.toml`; history rewrite; real-person data, keys or model identifiers in the repository.

### 4.1 · Mandatory pre-flight before every CI dispatch (owner, 11 Nov)

**Why.** C1w lost about two hours to three failures, none of them a product defect, each found only after an expensive
cycle: a test that committed data left a platform admin behind and broke a later test; two planted defects were aimed
at code C1w had moved, and only CI runs planted defects. The acceptance standard was right. The preparation was
incomplete. This procedure changes no acceptance requirement, adds no approval and exempts no kind of commit. It is
what the engineer does before pressing the button.

**P1 · Impact analysis, when the change is designed and again before the candidate.**
For every function, trigger, view or table the batch replaces or changes, list by name and then search for that name
in each of the following. Everything found is on the batch's impact list and is re-run or re-aimed in this batch.

| Where to search | What breaks, and how it shows |
|---|---|
| `selftest/plants/*.sql` and `selftest/plants/plants.json` | A planted defect edits a function's body by matching text. If the text moved, the plant **fails to apply**. If the plant carries a whole older body, it **silently replaces the new one** and may pass for the wrong reason |
| The `red-case` job in `.github/workflows/ci.yml` | The same, for the planted defects written inline there. These run **only in CI** unless extracted (P2) |
| Later migrations that edit a function by text (`pg_get_functiondef` … `replace`) | A function already rewritten that way must be re-read in its **final** form, not in the migration that created it |
| Tests that read a migration's source (`const MIGRASI = …`, the `-K0x` tests) | A test pinned to an older migration file keeps passing while describing a definition that has been superseded. Re-point it, with a `RESTATED` note |
| `selftest/db/*.sql`, `selftest/*.test.ts`, the journeys | Tests and fixtures that call the function or depend on its refusal codes, its audit rows or its timing |
| `src/` callers and `client_rpc_registry` | Dependent operations and their contract files |

For each affected test and plant, confirm it still targets the behaviour it was written for: it is red for its own
stated reason when the defect is present and green when it is not.

**P2 · Complete local verification.** Before CI is dispatched, on the candidate commit, on a fresh database and a fresh
build:
1. the whole local suite;
2. **every planted-defect gate** (`node scripts/dev/plants.mjs run`, all gates);
3. **the `red-case` cases written inline in `ci.yml`,** extracted and run locally. No such script exists today
   (`scripts/` has none; `scripts/dev/plants.mjs` runs only the gates declared in `plants.json`). **B1, the first batch,
   writes it** as test tooling and keeps it in the repository; every later batch uses it;
4. the static checks CI runs (typecheck, lint, the build);
5. the journeys, where the local stack can run them.

A shared helper for tests on several connections is needed from A2 onwards. A1's `psqlLain`
(`selftest/a1-layar.test.ts:243`) is not exported; **A2 moves it to a shared selftest module** and A3 reuses it.

**P3 · Test isolation.** Every test that commits data (anything that is not one rolled-back transaction: two-connection
tests, app tests, journeys) ends by proving the baseline is restored: the same fingerprint the `red-case` groups
already take (schema, grants, roles and memberships, row counts), and in particular **no live role, session, maintenance or emergency window, held or protected sitting, or recorded
emergency shift
left behind**. A leak then fails the test that leaked, not an unrelated test an hour later. This matters most for
A2: a leaked emergency window refuses every later test's requests, and a leaked protected sitting is silently skipped
by the closer in every later test.

**P4 · Failure consolidation.** When anything fails at any stage, before the next run:
1. find the cause, then **search for every other place the same cause applies** (every plant aimed at the moved code,
   every test with the same cleanup pattern, every caller of the changed function);
2. fix them together, in one commit;
3. re-run the directly affected checks locally, then P2 in full.
One expensive cycle per cause, not one per symptom.

**P5 · Pre-flight confirmation.** The CI dispatch is preceded by a short written note in the session, kept with the
batch's evidence: the commit; P2's results, check by check; the impact list of P1 with each item's result; and **the
checks that can only run in CI, named**, so that a CI failure outside that list is recognized as a pre-flight gap and
fixed as one.

**P6 · Immediate failure response.** While CI and the journeys run, watch the jobs. Read a failed job when it fails,
not at a scheduled time. Start P4 at once; let the remaining jobs finish, because they may show further failures to
consolidate.

**Applies to** B1, B2, A2, C2w, A3, C3w and Z. Each batch's section G names its affected functions and its
impact-analysis starting list.

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
**In:** a separate event store; four event kinds (sign-in success, sign-in failure, sign-out, print request); the write path at each sign-in and sign-out; the print-request
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
| Scheduled jobs | `pengerjaan_jadwal_pasang` (`M/20270114110000…:79`); restore re-installs (`scripts/recovery/restore-bundle.mjs:84-93,186-189`) | |

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
the same wording layer (`src/lib/jejak-audit.ts` pattern). Daisy's design input expects a print reference to be found
"in «Jejak audit» by typing it" (DESAIN-AWAL §1), so the reader must accept a reference in its search field. Daisy
verifies the changed screens at the result review (her §8, medium risk for C5); no pre-build UX review is planned for
B1 (`EXECUTION-PLAN.md` §2).
- **Purpose:** look up sign-ins, failures, sign-outs and prints for one person or one period.
- **Actions:** filter by kind, by person, by date range. No export, no delete.
- **States:** empty ("recorded since {date}"); no match; a page of rows; refused (not an admin).
- **Each row:** when (school's zone), who (name, or «pengenal tidak dikenal» for an unresolved identifier), what, how,
  outcome in plain words. The network origin is shown to the platform admin only.
- **Mobile:** the Collection's stacked rows below 640 px, never a wide table. **Print:** none.
- **From Daisy's review of this plan** (O-1): rows with no school are the platform admin's only and are written in WIB
  with its word; a print reference that has been purged gets its own empty state, «Referensi ini tidak ditemukan.
  Catatan cetak disimpan 12 bulan, sejak {tanggal mulai}.», not the plain "no match"; each failure outcome has one
  `hle.ts` key worded as the sign-in screen's own refusals, never Auth's text.

#### G · Ordered implementation instructions
1. **Preconditions.** A1 closed (the installer exists). Completion page written; Sharon's review settled.
2. **Database.** The table, its guard (no update, no delete outside the purge), the service-level writer, the reader, the
   purge, the registry rows, the metric-source refusal. Extend the shared job installer (§6.3) and install the purge job.
3. **Recovery scripts.** `restore-bundle.mjs` checks and re-installs both jobs through the shared installer; restate
   DR-S14 to S16 and DR-D02 with notes if their expectations name the job count. **For a native Supabase restore**
   (C1w finding F-8, §7.7), which bypasses that procedure: add the runbook step (run the installer) and a health check
   that reports any scheduled job the installer declares and the database lacks.
4. **Contract.** `src/lib/akuntabilitas-kontrak.ts` (or the chosen name): kinds, methods, outcome codes, the row type,
   and the `hle.ts` key per kind and outcome.
5. **Server.** One server-only helper that derives the coarse origin from the request and calls the writer. Call it once
   in each route of table C, at the point where the route's answer is final. Magic-link success is recorded at the
   callback, not at the request.
6. **UI.** The reader section.
7. **Tests** (H). 8. **Rendered check.** 9. **Acceptance.**

**Pre-flight starting list (§4.1 P1).** *Changed:* the six sign-in routes and the sign-out path of table C (application
code; no database function they call is replaced); `pengerjaan_jadwal_pasang` and `restore-bundle.mjs` (the shared
installer, §6.3). *Expect to re-run or restate:* DR-S14, DR-S15, DR-S16, DR-D02; A1-K01, A1-S08 and A1-S09 (they pin
the installer and the job); every identity suite. *Committing tests:* the sign-in app tests, which must leave no
session and no event rows behind (P3).

#### H · Verification
- **Database (red first):** a successful and a failed sign-in each leave exactly one row (red today: none). No row holds
  a password, code, PIN or full address (a scan over every text column after a full sign-in matrix). A client role cannot
  insert, update, delete or select. A school admin reads only their school's rows; rows with no school are the platform
  admin's. **Retention:** a row aged to 12 months and a day is purged and one audit row records the count; a row at 11
  months stays. Two purge runs at once delete each row once.
- **App:** each sign-in method and each failure code through the running app; sign-out; a retried request writes one row.
  A writer failure (simulated) does not block sign-in.
- **Static:** the store is not a metric source; no file outside the helper calls the writer; no copy names the mechanism.
- **Recovery:** the restored database has both jobs. With a job removed by hand, the health check reports it.
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
2. The reference is «CTK-» plus 8 characters in two groups of 4, without look-alike characters, derived from the
   event's id. It is unique, and the reader in B1 finds the event by it.
3. **The footer has a default and one replacement** (Daisy's composition, F):
   - *The default,* which is what the stylesheet prints for any print not made through the button: «Dicetak dari
     browser oleh {nama} · {waktu} · tanpa nomor referensi», with page numbers. It contains no reference-shaped text.
     The name and time here are read in the browser and claim nothing about an audit; if they cannot be filled
     reliably the line is «Dicetak dari browser · tanpa nomor referensi».
   - *The replacement,* set only after the action has returned a reference and before the print dialog opens:
     «Dicetak oleh {nama} · {tanggal, jam, zona} · Ref. CTK-XXXX-XXXX», the name and instant being the server's.
   After the print dialog closes (`afterprint`) the footer returns to the default.
4. **A browser print (Ctrl+P) therefore carries the default line: no reference, and no claim of an audit** (owner,
   9 Nov). It is not "page numbers only": it says plainly that it came from the browser and has no reference.
5. If the action fails, nothing prints and the result line says so. An official print never goes out without a
   reference.
6. Each press is one event and one reference. Printing twice is two references; that is intended.

**Invariant:** the footer never shows a reference that has no event, and a page printed any way other than through
«Cetak laporan» never shows a reference at all.

**A consequence to know.** Print events are purged with the rest after 12 months (O41-13). A paper older than that still
shows who printed it and when, but its reference no longer resolves (register N-3).

#### E · Educational semantics
The footer identifies the requester of the print. It makes no statement about the learners in the report and changes no
figure. Learners printing their own results (`/belajar/hasil`) are treated the same way: their own name, their school's
zone.

#### F · UX requirements
**Daisy's composition exists and is adopted:** `docs/coordination/ux/completion-4.1/DESAIN-AWAL-4.1.md` on `ux-1/daisy-experience`, §1, with a rendered mock (`gambar/c6-footer.png`,
`gambar/c6-mock.html`). The engineer builds to it; Daisy's pre-build review confirms it against this section.
- **Official print, bottom-left margin box, one line, 7.5–8 pt, `--ink-2`:** «Dicetak oleh {nama} · {tanggal, jam,
  zona} · Ref. CTK-XXXX-XXXX». Bottom-right unchanged: «Halaman n dari m». Both on every page, portrait and wide.
- **The reference:** «CTK-» plus 8 characters in two groups of 4, without look-alike characters.
- **A browser print (Ctrl+P)** is the stylesheet's **default** footer and carries no reference-shaped text at all:
  «Dicetak dari browser oleh {nama} · {waktu} · tanpa nomor referensi». If name and time cannot be filled reliably,
  it shrinks to «Dicetak dari browser · tanpa nomor referensi». «Cetak laporan» swaps in the referenced line only
  after the request is recorded, before the print dialog opens, and never for a refused request.
- **Failed recording:** the dialog does not open; the existing result line says «Cetakan belum dapat dicatat, jadi
  belum dicetak. Coba lagi.»
- **Not on certificates** (their print CSS excludes the box) and never on screen.
- **An empty report:** «Cetak laporan» is not offered on a report with nothing in it (her §6, item 15), so that no
  empty page is printed and recorded.
- **States:** working; failed; done (no message). **Accessibility:** the button keeps its name and focus; the failure
  line is a status region (`BarisHasil`). **Long names:** the name and time stay whole and the reference wraps.
- **Known print defects to check, not to redesign** (her §6, item 11): an empty card frame on page 2 of Ringkasan
  Kelas 5C; Pimpinan's last page holding one link. They are register items unless the footer makes them worse.

#### G · Ordered implementation instructions
1. Preconditions: B1 closed; completion page reviewed by Daisy.
2. Database: nothing new beyond B1, unless the reference needs its own unique column on the event (the engineer's
   choice; if so it goes in B2's migration).
3. Contract: the action's answer type and failure codes in the B1 contract file.
4. Server: the print action (same-origin, signed in; the report kind and scope are checked against what the person may
   read, so a forged call cannot log a print of a report they cannot open).
5. UI: `AksiLaporan` and `KepalaCetak`; the footer CSS under `@page laporan` and `laporan-lebar`.
6. Tests. 7. Rendered and printed check. 8. Acceptance.

**Pre-flight starting list (§4.1 P1).** *Changed:* `AksiLaporan`, `KepalaCetak`, the print CSS. No database function is
replaced. *Expect to re-run:* every report suite that renders those components and DAISY's print checks; the
certificate print tests, which must be unchanged. *Committing tests:* the print app test leaves no event row (P3).

#### H · Verification
- **App (red first):** a press writes one `PRINT_REQUEST` and the printed document carries that reference, the name and
  the time in the school's zone (red today: no event, no footer). A failed action prints nothing. A forged scope is
  refused and writes nothing.
- **Static:** every page that renders `AksiLaporan` goes through the action; nothing else calls `window.print()` on a
  report; the certificate print is untouched.
- **Rendered:** a PDF print of each report at A4 and wide, checked for the footer on every page, in monochrome; a
  browser print without the button shows the browser line and no reference-shaped text.
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

**Sharon's pre-build review: done, and accepted by the owner as the technical basis for this section (11 Nov).**
Read-only, against A1 at `7dfe2bc8` and this plan at `6ae42b88`. It raised six blockers (B1 to B6) and two further
requirements (R1, R2); the owner added ruling O1. All are incorporated in D6 below.

> **What this section rests on.** Sharon's original findings, relayed by the owner, and her verification of revision
> 8, in which she supplied her nine verification scenarios in their original text. They are in H, word for word, and
> are required acceptance evidence. The design responses in D6 are the Chief Architect's; Sharon verified them against
> her review and against A1 at `3a190dbf`.

| # | Sharon's finding (as relayed) | Where it is answered |
|---|---|---|
| B1 | A safe transaction-ordering fence between emergency activation and protected sitting decisions | D6.1 |
| B2 | Emergency protection on every A1 action that can end, score, resume, extend or re-time an affected sitting | D6.2 |
| B3 | The remaining late-sync allowance preserved for sittings already expired but still inside their grace | D6.3 |
| B4 | Remaining time preserved for assignment-window-timed sittings, by their effective deadlines | D6.3 |
| B5 | Overlapping and successive emergency windows, without granting or losing time | D6.4 |
| B6 | Suspension holds preserved when an emergency stop is lifted | D6.5 |
| R1 | No scheduler starvation of unaffected sittings | D6.6 |
| R2 | Transactions holding the fence kept short; activation latency measured | D6.1, D6.6 |
| O1 | **Owner ruling:** during a stop, refuse administrative assessment-ending and assignment-withdrawal on protected sittings; permit genuine enrolment termination without bypassing protection | D6.2 |

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
| A1's deadline rule | `pengerjaan_putus_tenggat`, the 5-minute job | **knows nothing of maintenance** |
| The scheduled closer | `pengerjaan_tutup_terjadwal` (`M/20270114110000…:28`) | a **function**: one transaction per run, up to 500 sittings; excludes held sittings in its query, not protected ones |
| A1's held state | six `frozen_*` columns, one cause (`M/20270114100000…:120-147`) | cannot hold two causes; remaining seconds cannot be negative |
| Endings that ignore the held state | `terminate_session`; `akhiri_penugasan` («Akhiri» and «Tarik»); `tutup_asesmen_terbuka` | each can end a held sitting today |
| Enrolment termination, transfer, promotion | `akhiri_pendaftaran` (`M/20270112200000…:73`), `transfer_execute` (`:59-68`), the Kenaikan run (`M/20270112210000…:229`) | all call `tutup_asesmen_terbuka`, which **scores** a sitting past its deadline and terminates the rest unscored |
| Isolation level | none set anywhere | READ COMMITTED, which the fence requires |

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

*The design, revised for Sharon's review. It still uses A1's mechanisms and adds no second sitting-control system.*

**Terms.** A sitting is **protected** while an active EMERGENCY window affects its **person**. A **protected decision**
is any database act that can end, score, resume, extend or re-time a sitting.

**D6.1 · The fence (B1, R2).** Revision 2 relied on each decision checking for an active window under the sitting's row
lock. That is not enough: a decision can read "no window" just before the stop commits and write its ending just
after. The sitting's row lock orders decisions against each other, not against the window. The correction:

- **One lock, two modes.** Every protected decision takes the *emergency fence* in **shared** mode, as the first lock
  of its transaction, and only then reads whether the person is protected. Activation and lift take the same fence in
  **exclusive** mode. A transaction-level advisory lock is the intended mechanism; the engineer may choose another
  with the same properties.
- **What this guarantees.** A decision that took the fence before activation finishes and commits before activation
  can acquire it. A decision that takes it after activation's commit reads the window as committed and is refused or
  skips. There is no third case. This holds only if the protection read is a **new statement, after** the fence is
  held, at READ COMMITTED; a decision running at a stricter isolation level must not be used here, and the tests prove
  the ordering rather than assume it.
- **The instant of effect is taken under the fence, not assumed from a column default.** Activation acquires the
  exclusive fence, **then** reads the clock (`clock_timestamp()`, not the transaction's start time), records that as the
  window's instant of effect `T_stop`, inserts the window and commits. Justification: every earlier protected decision
  had committed before the fence was granted, so before `T_stop`; every later one begins after the commit, so after
  `T_stop`. `T_stop` is therefore a valid dividing line even though it is not the commit timestamp itself. The lift
  records `T_lift` the same way. No other timestamp (a column default, `now()`) is used for time arithmetic.
- **Requests before and after** (Sharon's distinction, preserved). A learner request that passed the sitting gate
  before activation holds the shared fence, so it completes and its answer is accepted evidence. A request that
  reaches the gate after activation is refused there, even if it passed the request-level check a moment earlier; the
  answer stays on the device and is sent after the lift, inside the restored time.
- **Short exclusive section (R2).** The transaction holding the exclusive fence does four things only: acquire, read
  the clock, insert (or end) the window, commit. Marking and releasing sittings happen afterwards, in other
  transactions. Activation uses a lock timeout and retries, and tells the admin plainly if it could not take effect.
- **Contention, reviewed.** Shared holders never block each other, so normal operation pays one uncontended lock per
  protected decision. Two costs are real and must be measured:
  1. *Activation waits for every in-flight protected decision.* A long one delays the stop. Therefore no protected
     decision may hold the fence across a long transaction. In particular the scheduled closer must not hold it for a
     whole run (D6.6).
  2. *While activation waits, new shared requests queue behind it.* For that interval, sitting operations platform-wide
     pause. It must be short, and it is measured (H).
  The fence is global by design: one lock is simpler to prove than per-scope locks, and stops are rare. If the measured
  latency is unacceptable, per-school fences are the fallback, brought back for review before being built.

**D6.2 · Protection on every protected decision (B2, O1).** One check, `is this sitting protected?`, is applied under
the fence by every act below. Functions as read at `3a190dbf`:

| Act | Function | During a stop, on a protected sitting |
|---|---|---|
| Ended by its deadline (lazy and scheduled) | `pengerjaan_putus_tenggat` | skipped; nothing ended or scored |
| Finalized and scored | `finalize_session` | not run |
| Teacher ends it, scored or not counted | `akhiri_pengerjaan` | **refused** (O1) |
| Ended for an integrity cause | `terminate_session` | **refused** (O1) |
| Extra time | `tambah_waktu_pengerjaan`, `extend_session_deadline` | refused |
| Resume or close a suspension-held sitting | `lanjutkan_pengerjaan`, `tutup_pengerjaan_ditahan` | refused |
| The window changed | `ubah_jadwal_penugasan` | refused where it would re-time a protected sitting |
| The assignment ended or withdrawn | `akhiri_penugasan` (one function for «Akhiri» and «Tarik») | **refused** where a protected sitting would be ended (O1) |
| A first view of a question | `note_item_view` | refused (it has no gate today) |
| Learner answer, pause, resume, hand-in | the gate `pengerjaan_gerbang` and the response trigger | refused (the request-level refusal usually comes first) |

- Each refusal has its own designed code in A1's domain and one sentence saying the class is stopped and the act can be
  done after the stop is lifted.
- **Completeness is enforced by a test, not by this table:** every function that writes a sitting's status, deadline or
  held state either applies the protection check or is on a short declared list (the marking, the release, the
  enrolment path below). The same enumeration test serves A3.
- **Enrolment termination is permitted (O1).** It records an institutional fact about the learner, not an assessment
  judgment. *What the code does today:* `akhiri_pendaftaran` and `transfer_execute` call `tutup_asesmen_terbuka`, which
  runs the deadline rule on each open sitting (**scoring** one that is past its deadline) and terminates the rest as
  `INSTITUTIONAL_REVOCATION`, answers kept, unscored. *Required during a stop:* the enrolment ends and is audited as
  usual; for a **protected** sitting the deadline rule is **not** run, nothing is scored and no answer is discarded.
  **The sitting is preserved, unscored, for the whole stop.** After the lift, the ordinary enrolment-ending rule
  (`tutup_asesmen_terbuka`) is applied to it, judged against its **shifted** deadline (D6.3): a sitting not past that
  deadline is terminated unscored with its answers kept, as an ordinary departure; only a sitting genuinely past its
  shifted deadline, and any grace it has, is scored. A departed learner's work is never scored on time they did not
  have. The enrolment's ending and the later treatment of the sitting are each audited, the second naming the stop.
- **The promotion run (Kenaikan) calls the same function.** It is a school's year-end administrative act, not one
  learner's enrolment fact. This plan treats it as an administrative assessment-ending action: **refused during a stop
  for a learner with a protected sitting,** with a sentence saying which learners and why. **Owner ruling M-1 (11 Nov) confirms this.** Sharon
  verifies the technical treatment against her original review.

**D6.3 · One time rule (B3, B4).** Revision 2 stored "remaining time" and gave nothing back to a sitting without its own
deadline. Both were wrong. The rule is now:

> **Every protected sitting's effective deadline moves later by exactly the length of its protected interval.**

- The **effective deadline** is A1's: the sitting's own deadline, or, for a sitting timed by its assignment's window,
  the window's closing time (`pengerjaan_tenggat_efektif`). A sitting with neither has no deadline and none is created.
- **How the move is applied.** For a sitting with its own deadline, that deadline is changed, so every existing reader
  of it stays consistent. For a window-timed sitting, the shift is recorded beside it (previous point but one).
- **B4 · Window-timed sittings.** A sitting with no deadline of its own is timed by its assignment's closing time. Its
  effective deadline moves later by the protected interval, **and it stays a window-timed sitting**: it is not given a
  deadline of its own. The shift is recorded on the sitting and added wherever the window's closing time is read for
  it (the effective-deadline function and the deadline decider); when it ends, it ends as `WINDOW_CLOSED`, as today.
  The assignment's window is not changed, so learners who were not protected are unaffected.
- **B3 · Late-sync allowance: only where A1 gives one (Sharon's approval blocker 1).** In A1 the late-sync grace
  applies **only to a sitting with its own deadline** (`pengerjaan_putus_tenggat`, `M/20270114100000…:356-359`: the
  grace is read only when `authoritative_deadline` is not null). A window-timed sitting has no grace today and **must
  not acquire one** through the emergency rule. This is the reason B4 does not give it a deadline of its own: doing so
  would make A1's own code grant it a grace it never had.
  - *Own-deadline sitting, still open at `T_stop`:* its deadline moves by the protected interval; its grace follows the
    deadline, unchanged in length.
  - *Own-deadline sitting, already `EXPIRED` but inside its grace at `T_stop`:* protected, and after the lift it has
    exactly the grace it had left. **It is not placed in A1's held state,** which accepts only an open sitting
    (CREATED, IN_PROGRESS, PAUSED). It stays `EXPIRED`, unscored; the protection of D6.1 and D6.2 keeps it from being
    finalized during the stop, and at release its deadline moves by the protected interval so that the remaining grace
    is exact. Its `closure_*` facts, written once at expiry, are not rewritten.
  - *Window-timed sitting past its window's closing time at `T_stop`:* it has no grace, so it is not protected. It is
    ended and scored by the ordinary rule.
  This replaces revision 2's "known edge", which is withdrawn.
- A sitting already ended, handed in, or past its deadline **and** any grace it has, before `T_stop`, is not protected.
  Nothing about it changes.
- **Recording.** A1's held state stores a non-negative remaining time (`frozen_remaining_seconds`, null or ≥ 0), which
  cannot express "40 seconds of grace left". The emergency hold therefore records the instant it began, and the release
  computes the shift.
- **The trigger must let the release through.** `pengerjaan_jaga` refuses any deadline change on a held sitting. The
  release changes the deadline and clears the emergency hold in one statement; the trigger is extended to allow
  exactly that transition and no other.
- **The effective deadline is read at `T_stop`.** `pengerjaan_tenggat_efektif` returns the assignment's *current*
  closing time, so a later window change would move it. That is why `ubah_jadwal_penugasan` is refused for a
  protected sitting (D6.2).

**D6.4 · Overlapping and successive stops (B5).**
- A person's **protected interval** is the union of the active EMERGENCY windows that affect them, from the first
  `T_stop` to the last `T_lift` with no gap between them.
- **Overlapping** (a class stop, then a school stop before the first is lifted): the sitting stays held throughout and
  is released once, when the last window lifts. The shift is the length of the union. Lifting the first window alone
  releases nothing.
- **Successive** (a stop, a lift, later another stop): each interval is applied once. The release of the first is
  always applied before a second hold is recorded, including when that release had not yet been materialized. The
  release rule is deterministic, so applying it late gives the same deadline as applying it at the lift.
- **Neither grants nor loses time:** the shift uses `T_lift`, never the moment a row happened to be processed, so a
  learner who returns an hour after the lift has no more time than one who returns at once.

**D6.5 · Suspension holds (B6).**
- An emergency hold and a suspension hold are independent facts about a sitting. A1 has one cause column and one check
  (`frozen_cause in ('ACCOUNT_SUSPENDED')`), which cannot hold both, so the held state is extended to carry both; this
  is an extension of A1's state, not a second system. `pengerjaan_ditahan` stays the one question "is this sitting
  held?", answering yes for either.
- A sitting is writable only when **no** hold remains.
- **Suspended before the stop:** the sitting is already held with its remaining time stored. The stop and the lift do
  not touch it.
- **Suspended during the stop:** the suspension is recorded; the sitting's remaining time is fixed as of `T_stop`. The
  lift removes the emergency hold only. The sitting stays held until its teacher resumes or closes it (O41-17), with
  exactly that remaining time.
- **Suspension lifted during the stop:** nothing resumes; the emergency hold remains, and O41-17 still requires the
  teacher's act afterwards.

**D6.6 · The scheduled closer (R1, R2).**
- **No starvation (R1).** The closer selects its candidates **excluding** protected and held sittings, in the query
  itself. Skipping them after selection would let a large stopped scope fill every run's limit and leave unaffected,
  overdue sittings unprocessed.
- **Short fence holds (R2).** Today the closer is a function, so one run is one transaction of up to 500 sittings with
  scoring. Holding the shared fence for that long would delay an activation by the whole run. The closer therefore
  becomes a **procedure that commits per sitting or per small batch** and takes the shared fence inside each. The
  installer's job text changes from `select …` to `call …`; A1-S08, A1-S09 and the DR tests that pin the job are
  restated with notes.
- **Selection.** Its query already excludes held sittings; it must also exclude sittings of protected persons, since
  marking may not have reached them yet.
- **Selection must use the shifted closing time (Sharon, non-blocking, on revision 8).** The closer's query reads the
  assignment's `closes_at` directly (`M/20270114110000…:47`), without the window-timed shift of D6.3. Left so, a
  released window-timed sitting would be selected again on every run until its shifted time and would fill the run's
  limit, which is R1's starvation again. The selection uses `pengerjaan_tenggat_efektif`, or adds the same shift.
- It keeps running during a stop and does its ordinary work for everyone who is not protected.

**D6.7 · Marking and release are bookkeeping.** After activation commits, protected **open** sittings are marked held
in bounded batches; an expired sitting inside its grace is protected without being marked (D6.3). Batches run (sittings in id order, §6.2; `SKIP LOCKED`; idempotent; resumable). After the lift commits they are released
in batches, and the learner gate and the deadline decider release on first touch by the same rule. Because protection
comes from D6.1 and D6.2 and time from D6.3, an interrupted or late batch changes no outcome.

**D6.8 · Failure behaviour.**
- Activation cannot take the fence within its timeout: nothing is in force, the admin is told, and may retry. There is
  no half-stop.
- Marking or release fails: retried; outcomes are identical to a clean run.
- The lift fails: the stop remains fully in force.

**D6.9 · Audit.** One row when the stop takes effect (with `T_stop`), one when marking completes (how many held), one
at the lift (with `T_lift`; how many released, how many held for a suspension and left held). Each refused act under
O1 is audited as a refusal. Enrolment terminations during a stop keep their ordinary audit record.

**D7 · Emergency at class scope.** `stop_pintar_now` accepts class nodes, under the same typed confirmation and reason.
The immediate notice is the existing PT503 path: the open player's 45-second check and the next request both land on
the pause page.

**D8 · Warnings in the school's zone.** The status read returns the school's zone with the window; the banner and the
pause page format times with it and name the zone (WIB, WITA, WIT). A platform-wide window shows each reader their own
school's zone. No polling is added: the existing timers already fire at 60, 30 and 15 minutes from one server read, and
a person arriving inside the warning sees the time left (`pintar_status_saya`).

**Transactions and locks.** As D6 states: the emergency fence first, then the locks of §6.2 (sittings in id order), in
short transactions.

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
**Daisy's design input exists and is the starting design:** `docs/coordination/ux/completion-4.1/DESAIN-AWAL-4.1.md` on `ux-1/daisy-experience`, §2 (C7), §3 (C8), §6 and §7. It reuses the existing
scheduling form, list, banner and pause page and adds no second system. Daisy reviews this batch before build.

*Affected users and screens*
| Who | Screen | Change |
|---|---|---|
| School admin | Konfigurasi › Pemeliharaan (form, list) | scope, reason list, «Perpanjang» |
| Platform admin | the same, and the emergency form | class scope; the impact sentence; two more reasons |
| Learners and teachers in scope | the banner; the pause page; the player; the start button | wording by scope and reason; the school's zone |
| The class's teacher | A1's sitting list on `/mengajar/[kelas]/siapa` | «Ditahan» for an emergency-held sitting |

*As Daisy composed them*
- **The form:** «Untuk» = «Satu kelas» (a class select with the year) or «Seluruh sekolah»; the platform option only for
  a PINTAR Administrator. «Alasan» as required radios: Pemeliharaan rutin, Pembaruan sistem, Perbaikan gangguan,
  Pemeliharaan jaringan atau listrik, Lainnya (with «Jelaskan singkat», required, up to 120 characters). The chosen
  reason is shown to the people affected, and the hint says so. «Periksa waktu ini» lists the class's assessments in
  the window. The zone in the labels is the school's.
- **The list row** adds the scope and «Dijadwalkan oleh {nama}». Actions: «Perpanjang» (a new end time, no
  confirmation), «Akhiri sekarang» and «Batalkan» as today.
- **Warnings:** one banner, three states. T−60 and T−30 neutral and closable; T−15 amber and not closable, saying no
  new assessment can start. Minutes left refresh in place once a minute, never a seconds countdown. `role="status"`,
  announced on arrival and at each step only.
- **A learner in a running sitting** (planned window): a quiet line that they can finish and that the time does not
  change.
- **A blocked start** (inside T−15, or the assessment cannot finish before the window): «Mulai» disabled and tied by
  `aria-describedby` to a sentence naming when the window starts, how long the assessment takes and when to start
  instead. This replaces the fixed 15-minute sentence (`pemeliharaan.menjelang.arti`).
- **The pause page:** the title names the class for a class scope; the lines give start, reason and expected end; an
  extension says «diperpanjang sampai …».
- **Emergency form:** the impact sentence above the typed phrase («Anda akan menghentikan seketika: {kelas · sekolah}.
  Saat ini {n} murid masuk dan {m} asesmen sedang dikerjakan.»); reasons are the planned list plus «Masalah
  keamanan» and «Masalah integritas data»; the phrase stays «HENTIKAN SEKARANG».
- **Who lifts:** a PINTAR Administrator gets «Akhiri penghentian» behind `KonfirmasiBahaya`; a school admin sees the
  row with «Hanya Admin PINTAR yang dapat mengakhiri penghentian ini.»
- **One name for the role:** «Admin PINTAR» in place of «Admin platform» in `pemeliharaan.darurat.arti` (her §6,
  item 6).

*Wording settled by Daisy's review of this plan* (`docs/coordination/ux/completion-4.1/TINJAUAN-THE-PLAN-r5.md` on `ux-1/daisy-experience` (`b24242da`)). It is adopted here so that the engineer does not wait for
it. **This is her exact wording; no alternative copy is to be written.** All of it goes into `hle.ts`, Indonesian and
English.

1. **During the stop** (her blocker 2). The line learners see today, `pemeliharaan.darurat.asesmen`, ends «Bila
   waktunya habis selama penghentian, beri tahu guru Anda.» Under D-1 that is false: a held sitting loses no time. It
   is **replaced** by: «Penghentian ini tidak mengumpulkan dan tidak menilai asesmen yang sedang dikerjakan. Asesmen itu
   ditahan bersama jawaban yang sudah tersimpan dan sisa waktunya. Setelah PINTAR kembali, buka lagi asesmen tersebut;
   sisa waktunya sama seperti saat dihentikan.»
   *English:* «This stop does not submit or score an assessment that was in progress. It is held with the answers
   already saved and the time that was left. When PINTAR is back, open that assessment again; the time left is what it
   was when the stop began.»
2. **After the lift,** on «PINTAR dapat digunakan», for a learner whose sitting was held: «Asesmen yang ditahan selama
   penghentian dapat dibuka lagi. Jawaban yang sudah «Tersimpan» tetap ada, dan sisa waktunya sama seperti saat
   dihentikan.» *English:* «An assessment held during the stop can be opened again. Answers that showed «Saved» are
   still there, and the time left is what it was when the stop began.» Her earlier sentence («guru Anda yang
   menentukan langkah berikutnya») is withdrawn.
3. **On reopening the sitting,** a `role="status"` line in the player: «Asesmen ini ditahan selama penghentian. Sisa
   waktu Anda: {n} menit.» *English:* «This assessment was held during the stop. Your time left: {n} min.»
   These three hold for D6's edge cases: for a sitting inside its grace the time left is the grace; a window-timed
   sitting's moved closing time is exactly "what it was"; a suspended learner cannot sign in and never sees them.
4. **The new refusals** (English supplied by Daisy with her PASS, `401d2d38`):

| State | Indonesian | English |
|---|---|---|
| A teacher's act on a stopped class | «Kelas {kelas} sedang dihentikan oleh Admin PINTAR. Tindakan ini dapat dilakukan setelah penghentian diakhiri. Tidak ada yang diubah.» | «Class {kelas} has been stopped by an Admin PINTAR. This can be done once the stop has ended. Nothing was changed.» |
| Assignment ending or withdrawal during a stop (O1) | «Penugasan ini tidak dapat diakhiri atau ditarik selama penghentian. Tidak ada yang diubah.» | «This assignment cannot be ended or withdrawn during a stop. Nothing was changed.» |
| The promotion run during a stop (M-1) | «Kenaikan kelas belum dapat diterapkan: asesmen {n} murid sedang ditahan karena penghentian. Coba lagi setelah penghentian diakhiri.» | «The promotion cannot be applied yet: {n} students' assessments are on hold because of the stop. Try again once the stop has ended.» |
| Activation that did not take effect (platform admin) | «Penghentian belum berlaku. Tidak ada yang dihentikan. Coba lagi.» | «The stop has not taken effect. Nothing was stopped. Try again.» |
| A start refused because the assessment cannot finish before the window | «Asesmen ini memerlukan {d} menit, sedangkan pemeliharaan mulai pukul {jam} {zona}. Mulailah setelah pemeliharaan selesai, pukul {jam selesai} {zona}.», tied to the disabled «Mulai» by `aria-describedby` | «This assessment takes {d} min, and maintenance starts at {jam} {zona}. Start it after maintenance ends, at {jam selesai} {zona}.» |

5. **The teacher's list during a stop:** «Ditahan · dilanjutkan setelah penghentian diakhiri» (English: «On hold ·
   continues once the stop has ended»), with no «Atur». After
   the lift the row returns to its live state with no notice to the teacher; the learner's notice is enough. A
   suspension-held sitting keeps A1's «Ditahan · menunggu keputusan Anda».

*States, in full:* none scheduled; scheduled; approaching (60, 30, 15); active; extended; ended early; emergency
active; lifted; refused; failed to activate. *Mobile:* the form stacks in one column at 390 and 320 px.
*Keyboard and screen reader:* as above; the typed phrase and the confirm are reachable in order. *Print:* none.

#### G · Ordered implementation instructions
1. Preconditions: A1 closed and reconciled; the completion page carries Sharon's six blockers as settled and her nine
   scenarios word for word from H; Daisy's review.
2. Database, in this order: scope and reason columns; `maintenance_affects` and the hook for class scope (measured);
   extend; the start refusal (D4); the emergency hold and release on A1's held state; class scope on the emergency;
   registry rows; audit rows.
3. Contract: `src/lib/pemeliharaan-kontrak.ts` gains the scope, the reason codes, the new refusal code and the zone;
   `jamWib` callers move to the zone-aware formatter.
4. Server actions in `src/app/konfigurasi/actions.ts` for the new acts.
5. UI: scheduling, banner, pause page, the player's held notice, the teacher's list.
6. Tests. 7. Rendered check at three widths, keyboard only, both a WIB and a WITA school. 8. Acceptance.

**Pre-flight starting list (§4.1 P1). This batch changes sensitive assessment mechanisms; the analysis is done in
full before the first migration is written.** Read at `3a190dbf`:
- *Functions replaced or extended:* every function in D6.2's table; `pengerjaan_gerbang`; `pengerjaan_jaga`;
  `pengerjaan_tutup_terjadwal`; `pengerjaan_tahan_orang`; `tangguhkan_akun`; `maintenance_affects`,
  `maintenance_block_for_me`, `maintenance_draining`, `schedule_maintenance`, `change_maintenance`, `stop_pintar_now`,
  `pintar_status_saya`; the pre-request hook `pintar_permintaan.periksa`; the sitting-insert trigger of the T−15 block.
- *Already rewritten by text in an earlier migration* (read the final body, not the first): `start_learning_session`,
  `may_start_assessment`, `record_answer`, `submit_session`, `pause_session`, `resume_session`, `finalize_session`
  (A1 injected its gate into each).
- *Planted defects known to target this area:* `r1-1`, `r1-2`, `r1-3` (gate `db-r1-gates`); the inline `red-case`
  plants on `start_learning_session` and `may_start_assessment` (`ci.yml`, about lines 792 and 1096 to 1143); eight
  plant files touch `assessment_sessions` or `responses`. No plant file names a maintenance function today; the search
  is repeated on the day, because other batches add plants.
- *Source-reading tests to re-point:* A1-K01 and A1-K02 (they read A1's two migrations by file name); M148-K01.
- *Suites to re-run in full:* M148-*, A1-*, F03, F04, F37, F38, fable01, fable08 and fable24 (they exercise
  maintenance), the DR tests.
- *Committing tests:* any test that activates a window or a stop must end with **no active window** and no held
  sitting (P3); a leaked emergency window would refuse every later test's requests.

#### H · Verification
- **Database (red first):**
  - A class-scoped window affects its learners and teachers and nobody else in the school (red today: no class scope).
  - A start whose deadline would cross a planned window is refused; one that fits is accepted.
  - A planned window: a running sitting drains and is scored by the ordinary rule; nothing is held.
  - **Emergency, required evidence: Sharon's nine verification scenarios.** Her original text, from her A2 review
    against this plan at `6ae42b88` and A1 at `7dfe2bc8`. They are database tests, red first unless they guard an
    existing rule. **All nine are required for A2's acceptance, with these invariants.**

    1. **The fence (B1):** the decider, the stop and the marking, interleaved in two sessions at each point: before
       the stop's lock, while it is held, and after the commit.
       - Invariant: no sitting ends by deadline with `closure_deadline > starts_at` for a window affecting its person.
       - Plant: remove the fence, and this goes red.
    2. **The acts during a stop (B2):** under a class-scoped stop, a head of department and the school admin are each
       refused end, extend, resume, close and window change on an affected but unmarked sitting. The same acts on an
       unaffected class succeed.
    3. **Late sync (B3):**
       - a sitting in its grace at the stop's instant, with the stop longer than the grace;
       - after the lift, the answer arriving within the restored grace is LATE_SYNC and scored, and scoring waits
         until `late_sync_until`;
       - an answer after `late_sync_until` is kept, not scored;
       - a manifest-complete hand-in after the lift closes it early.
       - Red today: the scoring happens at the lift.
    4. **A window-timed sitting (B4):** its `closes_at` passes during the stop. After the lift it has
       `ended_at + (closes_at − starts_at)` and isn't ended at the lift.
    5. **Re-stop (B5):** W1 lifts, the gap passes, W3 starts before release. The final deadline equals
       `W3.ended_at + (W1 restored deadline − W3.starts_at)`, so the learner gains no gap time.
       - Also: with overlapping W1 and W2, the remaining time comes from the earlier `starts_at`.
    6. **Suspension during a stop (B6):** suspended during the stop, then the stop lifts. The sitting stays held as
       ACCOUNT_SUSPENDED with the same remaining time, and the scheduler doesn't end it.
    7. **In-flight requests:** a hand-in and an answer whose requests passed the gate before the stop's commit. Both
       are committed and kept, and neither is refused or lost.
    8. **Scale and starvation (R1, R2):** 50,000 affected sittings and one unaffected expired sitting. The unaffected
       one is ended on the first scheduler run, and the skipped count is reported. The stop's wait on the fence is
       measured, as is the hook's time before and after (D1).
    9. **Idempotency and recovery:** the marking interrupted after half the sittings, then the lift. Every outcome is
       identical to a clean run: the same deadlines, nothing scored.
       - Also: stopping twice or lifting twice writes no second audit row.

    *How to read them in this plan's terms (Sharon's own mapping; it keeps each scenario's meaning and invariant and
    replaces no words above):*
    - `starts_at` is `T_stop`, and `ended_at` is `T_lift`.
    - Scenario 2: an enrolment ending during the stop is permitted under O1 and scores nothing; `akhiri_penugasan`
      and the promotion run are refused.
    - Scenario 3: "`late_sync_until`" is the grace remaining after the deadline shift of D6.3. It applies only to
      sittings with their own deadline.
    - Scenario 4: the window-timed sitting keeps no deadline of its own. "Its effective deadline" is the shifted
      closing time.
    - Scenarios 4 and 5: these equal D6.3's "moves later by exactly the protected interval" and D6.4's union of
      windows.
    - Scenario 8: this is run by the dedicated scale job, with the CI-sized variant in the suite.

  - **In addition,** one test per design point not already proven by a scenario above, so that each blocker and
    ruling has a named proof:
    - *B1:* on real connections, a deadline ending, a teacher's ending and a learner's answer are each started just
      before and just after activation, repeatedly. Every one either commits before `T_stop` or is refused or skipped.
      None commits an ending after `T_stop`. The test fails if the fence is removed (a plant).
    - *B2 and O1:* each act in D6.2's table is refused or skipped on a protected sitting and works on an unprotected
      one in the same school. The enumeration test finds no unguarded writer. An enrolment termination during a stop
      succeeds, is audited, scores nothing and leaves every answer byte-identical.
    - *B3:* a sitting 20 seconds past its deadline with a 60-second grace at `T_stop` accepts a late answer within 40
      seconds after the lift and not after.
    - *B4:* a window-timed sitting whose window closes during the stop is not ended at the lift, and ends exactly the
      protected interval after the window's closing time. An unprotected learner on the same assignment ends at the
      window's closing time.
    - *B5:* overlapping windows and successive windows, including a second stop before the first release was
      materialized. In every case the deadline moved by exactly the protected interval.
    - *B6:* suspended before, during, and reinstated during a stop. No suspension-held sitting is writable after the
      lift until its teacher acts, and it resumes with the right remaining time.
    - *R1:* several thousand protected overdue sittings and one unprotected overdue sitting: the unprotected one is
      ended in the next run.
    - *The closer's selection is shift-aware (Sharon, on revision 8):* after the lift, a released window-timed sitting
      whose original `closes_at` has passed but whose shifted closing time has not is **not selected** by the closer
      on any run before that time, and is ended on the first run after it. With more such sittings than the run's
      limit and one unprotected overdue sitting, the unprotected one is ended on the first run. Red first: with the
      selection reading `closes_at` unshifted, the sittings are selected on every run.
    - *Enrolment ended during a stop (Sharon's clarification 4):* the enrolment ends and is audited; the protected
      sitting is unscored and unchanged until the lift; after the lift it is terminated unscored if inside its shifted
      deadline, and scored only if past it and any grace; every answer is byte-identical throughout.
    - *Grace only where A1 gives it:* after a stop, a window-timed sitting accepts no late answer after its shifted
      closing time, and a sitting with its own deadline has exactly its remaining grace. An `EXPIRED` sitting inside
      its grace is never in the held state and is never finalized during the stop.
    - *R2, with Sharon's proposed threshold:* **activation takes effect within 5 seconds at the 95th percentile under
      normal load, with the scheduled closer running.** The **queue delay** imposed on other sitting operations while
      activation waits for and holds the fence is measured and recorded with it. Both figures are evidence on the
      candidate; a miss goes to J.
  - **A dedicated scale test (Sharon's clarification 6):** **50,000 protected open sittings.** Activation, marking,
    the closer running throughout, the lift and release; every sitting's final deadline checked against the rule; no
    sitting scored during the stop; the latency and queue delay of the previous point measured at this size. It runs
    as its own job, not in the ordinary suite. **A CI-sized variant** of the same test (a few thousand sittings) is in
    the suite and in CI, and proves the same invariants.
  - Extend and resume early are audited with before and after; a school admin cannot stop immediately; a school admin
    cannot schedule for another school's class.
  - **Interruption:** marking killed halfway and resumed; the lift with marking incomplete. Outcomes equal a clean
    run.
- **App:** the warnings at 60, 30 and 15 with a mocked clock, in WIB and WITA; arriving at T−20 shows the time left; the
  pause page; the player's held notice.
- **Regression:** M148-*, A1-S01 to S09, F37 and F38 green; the pre-request hook's timing within the measured budget.
- **Journey:** "the platform admin stops one class during Uji Penguasaan, lifts it 20 minutes later, and the class
  finishes with the time it had."

#### I · Acceptance criteria
1. C7 and C8 demonstrated at class, school and platform scope.
2. Planned maintenance changes no sitting's conditions; an emergency loses no answer and no time, grants no time, and
   scores nothing. Sharon's nine scenarios and the per-blocker tests are green on the candidate.
3. Every time shown is in the reader's school zone.
4. Suite, CI and journeys green on the candidate; Sharon's and Daisy's result reviews closed.

#### J · Escalate only if
- The fence's measured activation latency or platform-wide pause is unacceptable and per-school fences are needed.
- A response in D6 differs from what Sharon's review requires (her review governs; the difference is brought back).
- Enrolment termination, as coded today, cannot be permitted without ending or scoring a protected sitting.
- The class test cannot be added to the pre-request hook within the measured budget.

---

### 5.4 · C2w — Misconception annotations (C2)

**Review before build:** Sharon; Daisy short. **Depends on:** C1w.throughout.

#### A · Objective
An authorized reviewer can record what a wrong option really reveals about a learner's thinking, after the question is
sealed, without changing the question, any score or any report. Users: reviewers (write); authors, reviewers and
teachers (read).

#### B · Scope
**In:** an annotation table; create and supersede; display in Studio and beside the class misconception report.
**Out:** editing an option's `misconception_code` on sealed content; any metric, calculator or report figure that reads
annotations; learner-facing display; AI-suggested annotations.

**Outside this batch (owner ruling M-3, 11 Nov):** an annotation naming a code from the existing misconception
taxonomy. No scope expansion.

#### C · Existing architecture
| Thing | Where |
|---|---|
| Option's code | `item_options.misconception_code` → `misconception_taxonomy` (`M/20260912112712…:186,262`) |
| Sealed content guard | `enforce_taught_content_immutable` (latest `M/20260914120000…:242`) |
| Class misconception metric | `calc_class_misconceptions` (latest `M/20270111100000…:1124`) over `scoped_service_cohort_misconceptions` |
| What a calculator may read | `metric_sources`, `assert_metric_closure` (`M/20260923110000…:726`), F06-P13 |
| The refusal precedent | F07-P11 refuses `feedback_%` as a source (`selftest/db/fable07.sql:1087`) |
| Review capability | `CAN_REVIEW`, used by `kembalikan_paket` (`M/20261214100000…:139`) |
| A question's lineage | `items.supersedes_item_id` (guarded, C1w M1`:167`); read by `riwayat_soal(item)` (M1`:1038`, `CAN_DRAFT` or `CAN_REVIEW` in the question's school) |
| «Riwayat soal» | `RiwayatSoal` in `src/components/studio/SoalKerja.tsx:227`, on `src/app/studio/paket/[course]/page.tsx` (`:222-228`), shown when the package is sealed |
| The option's code is editable only in a draft | C1w's editor (M1`:290`, `:324-326`) |

#### D · Proposed technical design
**The table.** One row per annotation: the **question revision** it was written on (an `items` row), optionally the
option it concerns, the text, the author, the instant, and an optional pointer to the annotation it supersedes. Rows
are immutable. A correction is a new row that supersedes; nothing is edited or deleted (truth table, C2).

**Across revisions, by lineage.** C1w gave a question no separate identity: a question is its chain of revisions
(`supersedes_item_id`). An annotation is therefore stored against one revision and **shown for every revision in the
same chain**, each display stating which revision it was written on, so a reader sees when the question has changed
since. The chain is read as `riwayat_soal` reads it; C2w adds no identity column and does not change `items`.

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
- **Studio › package page** (settled by Daisy, O-3): under each question in «Soal dalam paket ini», a second
  collapsed disclosure directly after «Riwayat soal», titled «Catatan peninjau ({n})», with a reviewer's «Tambah
  catatan» inside it: the annotations for this question, newest
  first, each with author, date and the revision it was written on; «Tambah catatan» for a reviewer; «Perbarui» creates
  a superseding note and shows the earlier one as replaced.
- **The class misconception report:** where a misconception row comes from an annotated question, a quiet «Catatan
  peninjau» disclosure with the same attribution. Closed by default.
- **States:** none; one or more; a superseded note; refused (not a reviewer); saved.
- **Limits:** plain text, a bounded length; no markup.
- **Mobile, keyboard:** the disclosure and the form by keyboard at 320 px. **Print:** annotations do not print, in
  Studio or in the class report (Daisy, O-3): they are staff commentary, and a printed report is a figure-bearing
  document.

#### G · Ordered implementation instructions
1. Preconditions: C1w's corrective items F-1 and F-4 done (§7.7), F-1 no later than this batch's first step, because
   this batch places annotations beside the misconception views F-1 concerns; Sharon's short review of the completion
   page.
2. Database: the table, its immutability guard, create and supersede, the two readers, registry rows, audit rows, the
   metric-source refusal.
3. Contract file and copy. 4. Server actions. 5. UI in Studio, then in the report. 6. Tests. 7. Rendered check.
8. Acceptance.

**Pre-flight starting list (§4.1 P1).** *Changed:* nothing existing is replaced; one table and its functions are
added. *Expect to re-run:* F06-P02, F06-P13, F07-P11, F36-M01, F23-*, the C1w suites; the class misconception report's
render tests. *Check for plants:* any plant aimed at `calc_class_misconceptions` or the report reader, if the reader is
extended.

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
- Walking the lineage chain on every display proves too slow for a long-revised question (then a stored chain root is
  proposed; it would add a column to `items` and needs Sharon's review).

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
The boundary list is `C1-D125-INVESTIGATION.md` §2. Latest definitions at `3a190dbf`:

| Boundary | Function (latest) | Locks today |
|---|---|---|
| Start | `start_learning_session` (`M/20270112120000…:16`; patched by text by A1 `M/20270114100000…:778` and again by C1w M1`:1213`) | advisory per (person, assignment); assignment `FOR SHARE` |
| Open | `open_assessment_session` (`M/20270111100000…:1375`) | none |
| Answer | `record_answer` (`M/20261005100000…:114`), `submit_response` `:46`, trigger `enforce_response_write` (`M/20270114100000…:481`) | **none** |
| Pause, resume | `pause_session`, `resume_session` (`M/20260913090000…:660,675`) | none |
| Submit, finish | `submit_session` (`M/20260913094000…:109`), `finish_my_session` (`M/20261005100000…:258`) | none |
| Finalize | `finalize_session` (`M/20261129100000…:104`) | none (idempotent by result check) |
| Item view | `note_item_view` (`M/20260913090000…:540`) | none; no gate at all, so it writes even on a held sitting |
| The gate | `pengerjaan_gerbang` (`M/20270114100000…:439`) | **none**: a plain read; returns silently when the caller is not the learner |
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
1. takes **the emergency fence in shared mode first, then the sitting's row lock (`FOR UPDATE`)**. Never the row
   lock before the fence: A2's activation takes the fence exclusively and then touches sittings, so the opposite order
   could deadlock and would break A2's ordering guarantee;
2. requires the caller's verified session to be the controller, else refuses with a designed code (stale writer);
3. then applies A1's gate and its own existing checks.
The natural place is A1's `pengerjaan_gerbang`, which `record_answer`, `submit_session`, `pause_session` and
`resume_session` already call. Today it takes no lock and is silent for a caller who is not the learner; A3 makes it
take the row lock and check the controller. `start_learning_session` and `note_item_view` do not call it and are
brought under it. `finish_my_session` reaches it through `submit_session`.

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
**Daisy's design input exists and is the starting design:** `docs/coordination/ux/completion-4.1/DESAIN-AWAL-4.1.md` on `ux-1/daisy-experience`, §4. Daisy reviews the journeys and wording in full
before build (her §8: high risk). No word for the mechanism reaches a user.

*Affected users and screens*
| Who | Screen | State |
|---|---|---|
| Learner, new device, low-stakes | a full page before the assessment, in the pattern of «Komputer siapa ini?» | «Lanjutkan di perangkat ini?» with where they were, when it was last saved, how many answered, and that the other device stops saving. [Lanjutkan di perangkat ini] [Batal]. Then a quiet line above the first unanswered question |
| Learner, new device, Uji Penguasaan | the same place | «Asesmen ini sedang dikerjakan di perangkat lain.» The teacher must allow it; what to tell the teacher; «buka lagi asesmen ini» afterwards |
| Learner, old device | the player's question area, on its next save or 45-second check | a neutral panel, not an error colour: continued on another device at {jam}; answers from this device are no longer saved; saved ones remain. If an answer was pending: «1 jawaban terakhir di perangkat ini belum tersimpan dan tidak dikirim.» [Kembali ke Belajar] |
| Teacher | A1's sitting list on `/mengajar/[kelas]/siapa` | the row reads «Sedang mengerjakan · minta lanjut di perangkat lain»; one row action «Izinkan lanjut di perangkat lain»; a primary (not red) confirmation naming the learner and the assessment; result «{nama} dapat melanjutkan di perangkat lain sampai pukul {jam}» |
| Teacher, afterwards | the learner's record | «Dilanjutkan di perangkat lain pukul {jam} · diizinkan oleh {guru}», or «… oleh murid sendiri setelah masuk lagi» |

*What the mechanism decides that the words depend on* (Daisy's four «→ Sharon» points, answered by D):
1. **Can the waiting page refresh itself?** No push is added. The page offers «Coba lagi», which asks whether an
   authorization now exists.
2. **The teacher's row shows a request.** The learner's refused continue attempt on an Uji Penguasaan records that a
   recovery is wanted, so the row can say so. It grants nothing.
3. **The expiry is shown to the teacher** («sampai pukul …», 10 minutes, D-3) and not to the learner. When it lapses
   the row returns to «Sedang mengerjakan».
4. **A pending answer on the old device** is known to that device only; it can be named there, as her panel does.

*To be dropped from her draft:* the Exam Mode sentence (O41-9; no Exam Mode in 4.1).
*Under D-2:* the same screens appear when a learner signs in again on the **same** device, because it is a new
session. «di perangkat lain» would then be untrue. **Settled by Daisy (O-4):** where the app can tell that the device
differs, her «perangkat lain» wording is used; otherwise the neutral form. Neutral, low-stakes: «Lanjutkan di sini?
Anda masuk lagi, jadi asesmen ini dilanjutkan di sesi baru. Jawaban yang sudah tersimpan tetap ada.» Neutral, Uji
Penguasaan: «Asesmen ini perlu diizinkan guru Anda untuk dilanjutkan, karena Anda masuk lagi.» The teacher's row and
record say «di perangkat lain» only when the device differs, otherwise «setelah masuk lagi». *The device comparison
is for wording only:* it may use the browser cookie hash, which is never used to decide who may write (D2).

*States, in full:* nothing to recover; confirm (low-stakes); waiting; authorized; expired; recovered; old device
stopped; refused because held, ended, or in maintenance. *Mobile and keyboard:* all learner screens at 320 px and by
keyboard; the waiting screen announces a change of state; the panel on the old device takes focus. *Print:* none.

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

**Pre-flight starting list (§4.1 P1). This batch rewrites nearly every sitting boundary. It will break planted
defects exactly as C1w did unless the analysis is done first.** Read at `3a190dbf`:
- *Functions replaced:* every function in table C; `pengerjaan_gerbang`; `session_final_responses`;
  `enforce_response_write`; A1's teacher acts (they gain nothing, but the enumeration test reads them); A2's emergency
  hold and release.
- *Already rewritten by text in an earlier migration:* the seven functions A1 injected its gate into (listed under
  A2). A3 should **redefine each in full** in its own migration rather than patch text a third time, so that later
  plants and readers have one body to aim at.
- *Planted defects to re-aim, at minimum:* `r1-1`, `r1-2`, `r1-3`; the inline `red-case` plants on
  `start_learning_session` and `may_start_assessment`; the eight plant files that touch `assessment_sessions` or
  `responses`; A2's own plants. **Each is run locally against the new bodies before the suite is run at all.**
- *Source-reading tests to re-point:* A1-K01, A1-K02, and every `-K0x` test that reads a sitting migration.
- *Suites to re-run in full:* the whole sitting surface, as H lists.
- *Committing tests:* the two-connection concurrency tests commit by design. Each ends with no open sitting, no
  recovery authorization and no live role of its own (P3).

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
| Draft state | editable while INGESTED, STRUCTURED, VALIDATED or VALIDATION_FAILED and unsealed (`draf_kunci`, C1w M1`:254`); `CAN_DRAFT` in the owning school (`draf_boleh_tulis`, M1`:244`) |
| Writing a draft question | `tambah_soal_draf(lesson, jsonb)` (M1`:460`), `ubah_soal_draf`, `hapus_soal_draf`; refusals `soal_tolak`, PR180; attribution in `item_draft_edits` |
| The in-app editor | `FormSoal` in `src/components/studio/SoalKerja.tsx:53`; actions in `src/app/studio/soal-actions.ts` |
| The step to review | `langkah_konten` (`CAN_DRAFT`; `M/20261214100000…:80`) |
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

**D2 · A generated question is an ordinary draft, plus one fact: whether an educator has accepted it.**
- It is written through C1w's own path, `tambah_soal_draf`, by the requesting educator, who becomes its author. The
  two-person rule therefore already refuses that educator as its reviewer. No new content status, no parallel
  lifecycle.
- **Acceptance** (Daisy's design, adopted): each generated draft must be **accepted, edited or deleted** by an educator
  before the package can be submitted for review. The fact (who, when, which of the three) is recorded beside the
  provenance, not on `items`.
- **The submit step refuses while any generated draft is unaccepted,** in the database (`langkah_konten`), with a
  designed code and Daisy's sentence. Hiding the button is not the rule.

**D3 · Provenance.** One side table, one row per generated question, never a column on `items`:
the draft question (an `items` row; its later revisions are reached through the lineage chain, as in C2w); the
generation request; the model's identifier and version **as a value** (the INV-32
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
- AI drafts; educators decide. Nothing generated reaches a learner without an educator's accept, edit or delete on
  each draft, the content check, and a second educator's approval.
- A materially wrong key is a critical defect (O41-1). The existing content check runs on generated drafts exactly as on
  written ones, and the review screen shows the key and rationale prominently for a generated draft.
- Provenance is part of the question's history for staff, for good. Learners get approved questions with no AI label.
- Statistics and comparability rules are C1w's and unchanged: a generated question is a question.

#### F · UX requirements
**Daisy's design input exists and is the starting design:** `docs/coordination/ux/completion-4.1/DESAIN-AWAL-4.1.md` on `ux-1/daisy-experience`, §5. No new review system: a draft enters the
existing steps. Daisy reviews the generation and review flow in full (her §8: high risk).

*Affected users and screens*
| Who | Screen | What |
|---|---|---|
| Author | Studio › package page, on a lesson, beside the workbook route | a secondary button «Buat draf soal dengan AI» and a short form |
| Author | the same page | the generated cards, in C1w's question card and editor |
| Reviewer | «Setujui isi» and the review queue | a count («5 dari 12 soal disusun dengan AI») and each card's provenance line |
| Anyone with Studio access to the question | Bank Soal, «Riwayat soal» | the provenance line stays readable |
| Learners | — | published questions only, with no AI label |

*As Daisy composed them*
- **The form:** «Sumber» (this lesson's text by default, another lesson of the package, or pasted text); «Tujuan
  pembelajaran» (the lesson's objectives); «Banyak soal» 1–10; «Kesulitan» Mudah, Sedang or Sulit. Primary «Buat draf».
  The rights confirmation of D10 is added to this form; its wording is Daisy's.
- **A draft is visibly a draft:** a neutral chip «Draf dari AI»; a provenance line («Disusun dengan AI ({model}) dari
  {sumber} · diminta oleh {nama}, {waktu}»); three actions per card: «Terima» (primary), «Ubah», «Hapus».
  «Terima» records the educator and the chip becomes «Diterima oleh {nama}»; «Ubah» opens C1w's editor.
- **The held step:** «Ajukan untuk ditinjau» is held while any draft remains unaccepted, with the step reason «{n}
  soal masih draf dari AI. Setiap soal perlu diterima, diubah atau dihapus oleh pendidik sebelum paket diajukan.» The
  disabled action is tied to that sentence by `aria-describedby`.
- **Failure:** «Tidak ada soal yang dibuat. Coba lagi, atau tulis soal sendiri.» Nothing is created.

*Settled by Daisy's review of this plan* (O-5); her full pre-build review still applies:
- **Rights confirmation (D-5),** a required checkbox before «Buat draf»: «Saya menyatakan bahwa sekolah memiliki hak
  atau izin untuk memakai sumber ini dalam membuat soal.» Hint: «Pernyataan ini dicatat bersama permintaan. Pernyataan
  ini bukan izin hukum.»
- **Limit reached:** «Batas pembuatan draf dengan AI untuk {bulan ini} sudah tercapai. Anda tetap dapat menulis soal
  sendiri.»
- **Not yet available** (limits not set): «Pembuatan draf dengan AI belum tersedia di sekolah ini.» The button is
  absent, not disabled.
- **Working** (tens of seconds), `role="status"`: «Menyusun {n} draf soal… Ini dapat memakan waktu hingga satu menit.»
  On completion focus moves to the first new card and the status reads «{n} draf soal siap ditinjau.»

*States, in full:* no source; working; drafted n of n; failed (the service did not answer; the answer could not be
used); limit reached; unavailable; refused (not an author; the package is not a draft). *Mobile:* usable at 390 px;
at 320 px the form follows C1w's editor. *Never:* the provider's name or the mechanism on a learner surface.

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

**Pre-flight starting list (§4.1 P1).** *Changed:* C1w's draft-write path gains a caller; the closed learner projection's
assertion and the engine's forbidden-key list are extended. *Expect to re-run:* F06-P02 and the static projection
test; F23-*; C1w's and B1's suites. *Check for plants:* any aimed at the draft-write functions or at
`assert_learner_projection_is_closed`. *Committing tests:* the generation app test leaves no request, draft or
provenance row (P3). *Only in the supervised staging run, never in CI:* a call to the real provider.

#### H · Verification
- **Database (red first):** a generation inserts drafts only into a draft package the caller authors; the package
  cannot be submitted while a generated draft is unaccepted, by any caller; the requester cannot approve them; a failed or invalid response creates nothing; limits refuse before any call; provenance is
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
3. The pre-flight of §4.1 in full, with P1 run across **all** batches' changed functions together, since Z is where
   one batch's plants meet another batch's rewrites. Then one full verification on the candidate: whole local suite,
   CI, journeys.
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
| `assessment_sessions` | A1, A2, A3 | Columns are only added. A2 extends the held state so that an emergency hold and a suspension hold can coexist (§5.3 D6.5); A3 adds the controller. The state trigger `pengerjaan_jaga` stays the one guard of held sittings |
| `responses` | A3 | One added column (generation). The idempotency key is unchanged |
| The pre-request hook | A2 (class scope) | Measured before and after. A3 adds nothing to it |
| `pg_cron` jobs | A1, B1 | One shared installer (6.3) |
| `maintenance_windows` | A2 | Columns added; existing rows valid |
| `items`, identity, lineage | C1w, C2w, C3w | C2w and C3w add side tables keyed by C1w's identity; neither adds a column to `items` |
| `audit_log` | all | Unchanged in shape. New action names follow the `domain.verb` pattern and get words in `src/lib/jejak-audit.ts` |
| The accountability store | B1, B2 | Only B2 adds a kind's use; A3 and C3w write to `audit_log`, not here |

### 6.2 One lock order
A3 must publish it as a lint; every batch before A3 must already follow it, so A3 finds nothing to reorder.

`emergency fence (A2) → person → learning assignment → assessment assignments (by id) → sittings (by id) → other advisory locks`

Evidence at `3a190dbf`: suspension locks the person and then sittings by id; assignment-ending paths lock the assignment
and then sittings by id; A1's per-sitting acts lock the sitting and then an advisory lock. **One point for A3's design review:** `start_learning_session` takes its advisory lock first and then reads the assignment `FOR SHARE`. It inserts a
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
| **O1** | **Acts during an active emergency stop: approved (after Sharon's A2 review).** Administrative assessment-ending and assignment-withdrawal actions on protected sittings are refused. Genuine enrolment termination is permitted, as an institutional fact about the learner | It must not bypass protection, cause protected work to be scored, or discard accepted evidence. The audit record is preserved | §5.3 D6.2 |
| **M-1** | **The year-end promotion during an emergency stop: approved.** It is refused where it would terminate a protected sitting. Genuine individual enrolment termination remains permitted | Under the approved safeguards of O1 | §5.3 D6.2 |
| **M-2** | **AI provider and numerical limits: remain pending the provider evaluation** | No value is invented and no provider is selected prematurely | §5.6 D7, §5.7 |
| **M-3** | **Structured misconception codes stay outside C2w** | No scope expansion | §5.4 B |
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
| N-4 | Sharon's ten further red cases for recovery are summarized at `SCOPE-REGISTER.md:255`; her full review (`1f7b6fc2`) is not on the branches read | Sharon, before A3's page |
| N-9 | Sharon's nine A2 verification scenarios: received in her verification of revision 8 and incorporated in §5.3 H | closed |
| N-10 | C1w's completion page promises "a stable identity per question". The code delivers it as the lineage chain, with no separate identity column. This plan builds on the chain. Whether that satisfies the page is for C1w's closure review | Second Eye and Sharon, at C1w's closure |
| N-11 | C1w notifies affected schools in-app only; Daisy's C1-R5 proposed in-app plus one email | §7.7, F-5 |
| N-12 | `terminate_session` and `akhiri_penugasan` can end a **suspension-held** sitting today (the state trigger allows TERMINATED). A2 refuses them for emergency-protected sittings; whether they should also be refused for suspension-held ones is outside A2 | Sharon, at A2's review |
| N-13 | `start_learning_session` and `may_start_assessment` have now been patched by text three times (4.0, A1, C1w). A3 redefines them in full (§5.5 G) | A3 |
| N-14 | Daisy's design input predates D-1, D-2, D-5, D-6 and O41-9. Her review of this plan (`TINJAUAN-THE-PLAN-r5.md`, `b24242da`) supplies the revised wording, now in each batch's F | settled; confirmed at each pre-build review |
| N-5 | Sharon's verdict on the SI-D02 stronger-race re-review is not recorded on the branch read | Sharon |
| N-6 | `institutions.retention_days` exists and nothing enforces it | 4.2; B1 does not use it |
| N-7 | The warning banner formats times with `jamWib` and no zone today | fixed in A2 |
| N-8 | The production upgrade rehearsal 111 → 224 (R-2) grows with every 4.1 migration | the owner; outside this plan |

---

### 7.6 Outstanding dependencies, review requirements and blockers

**Material decisions still open:** none for the owner. M-1, M-2 and M-3 were ruled on 11 Nov (§7.3). The numerical AI
limits and the provider are decided after E's report, as ruled.

**Sharon: what her reviews must cover**
| Batch | Review | Must cover |
|---|---|---|
| B1 | short, before build | the store's columns and the coarse network origin; who reads; the purge and its audit; the shared job installer and the restore |
| A2 | **done** | her six blockers, two requirements and nine verification scenarios are in §5.3 (D6 and H). On revision 8 she verified her grace blocker and all six clarifications, and confirmed the emergency architecture, the batch sequence, the pre-flight and M-1. Her non-blocking point on the closer's selection is in D6.6. Remaining: her final PASS on this revision's commit, and N-12 |
| C2w | short, before build | no sealed row changes; the table is refused as a metric source; unreachable by learners |
| A3 | full, before build | the controller design against her five gaps; her ten further red cases (N-4); the lock order with the emergency fence first (§6.2); the enumeration test of writers |
| C3w | full, before build | provenance hidden at the database and API; the acceptance fact and the refused submit; what is sent to the provider; limits |
| C1w | result review | the class of finding F-1; finding F-3's test result (§7.7); N-10 and N-12 |
| every batch | one review of the result | on the exact candidate commit |

**Daisy: what her reviews must cover**
| Batch | Review | Must cover |
|---|---|---|
| B1 | result only | the reader screen at three widths; finding a print reference |
| B2 | before build | her §1 composition against §5.2 F; the browser-print line; no print on an empty report; printed PDF in colour and greyscale |
| A2 | before build | her §2 and §3 against §5.3 F, including the replaced during-stop line `pemeliharaan.darurat.asesmen`, the after-lift and reopening lines, the five refusals and the teacher's list, all now worded in §5.3 F from her review of this plan; a WITA or WIT school |
| C2w | short | where annotations sit with «Riwayat soal» and beside the class misconception report |
| A3 | full, before build | her §4 against §5.5 F; the same-device case under D-2; dropping the Exam Mode sentence |
| C3w | full, before build | her §5 against §5.6 F; the rights confirmation, limit and long-running states |
| C1w | result review | findings F-5, F-6 and F-7 (§7.7) |
| every batch | the engineer's rendered check, then one result review | 1280, 390 and 320 px; keyboard only; every disclosure opened |

**Genuine blockers to execution**
| Blocker | Blocks | Does not block |
|---|---|---|
| The owner's approval of this plan | every batch | — |
| Sharon's classification of C1w finding F-1 (§7.7) | where F-1's correction is done: before promotion, or as C2w's first step | B1, B2, A2 |
| Sharon's and Daisy's final verdicts on this revision's commit | submission of this plan as final | nothing else |
| Sharon's full review of the controller design, with her ten red cases | A3's completion page | everything before A3 |
| E's prerequisites and the owner's provider choice | C3w | everything before C3w |

**B1 and B2 have no blocker other than the owner's approval.** C1w is closed; its findings are disposed of in §7.7.

---

### 7.7 C1w's reported findings: disposition

C1w is closed and is **not reopened by this section**. Each finding is classed against approved scope. "Engineering"
means work is required somewhere in 4.1; "reviewer" means a named reviewer's judgment decides; "non-blocking" means it
goes to the register in `EXECUTION-PLAN.md` §5.

| # | Finding (Second Eye's report, as relayed by the owner) | Against approved scope | Class | Disposition |
|---|---|---|---|---|
| **F-1** | After a governed key correction, some of the teacher's per-question evidence, the sitting's misconception views and the reading-map remediation links still use the **original** answer key. Authoritative results, outcomes and certificates use the corrected key | C1w's completion page: "Reports read the result in force". O41-21: the corrected result is the current result. The evidence is intact; several **derived views contradict the result in force**. A teacher can see a question marked wrong that the result counts as right, and a learner can be sent to remediate what they answered correctly | **Engineering, and reviewer (Sharon) for its class** | Work is required in 4.1 whatever its class. **Sharon decides at C1w's result review whether it is a blocker** (a failure of evidence integrity in what educators are shown). If a blocker: corrected in C1w's one correction pass, before C1w is promoted. If not: done as **the first step of C2w**, which builds on the same misconception views, and no later. It must be closed before Z: journey 3 of §8.5 passes through a key correction and then reads these screens. Rule for the correction: every view that marks an answer right or wrong, or derives a misconception or a remediation from it, reads the key in force for that sitting through the one accessor (`hasil_terkini_id` and the recorded basis), never the sealed key directly; the original marking stays visible in history |
| **F-2** | Public certificate verification does not display «Ditinjau ulang dan dikonfirmasi» after a completed review | Not a defect against scope. O41-19 requires that a certificate under review is not shown as unquestionably valid; after a confirming decision it verifies as valid, as before. Showing that a review happened would change the settled public verification format | **Non-blocking; a separate owner decision if wanted** | No work in 4.1. Recorded as a possible later decision. This plan does not recommend it: a confirmed certificate is simply valid, and its review history is kept for authorized readers |
| **F-3** | No test covers a platform administrator deciding a Professional Development certificate review | A gap in authorization coverage, not a known defect. PD belongs to the platform, so this is the one path where a platform admin decides | **Engineering (a test), and reviewer (Sharon)** | One red-first test, with its refusal counterpart (a school's reviewer cannot decide a PD review). If the test passes, nothing else changes. **If it fails, that is an authorization defect and a blocker.** Done with F-4, before C2w |
| **F-4** | Concurrent edits of one draft question are tested one after the other, not on two database connections | The behaviour exists (`DRAFT_EDIT_CONFLICT` on a stale revision); the proof does not exercise a real race. C3w writes drafts through the same path | **Engineering (a test)** | One two-connection test using the shared helper A2 exports (§4.1): two editors save the same revision at once; exactly one succeeds, the other gets `DRAFT_EDIT_CONFLICT`, and no edit is lost or duplicated in `item_draft_edits`. Done before C2w and in any case **before C3w's build** |
| **F-5** | The notice to affected schools (C1-R5) is in-app only; no email | Daisy's register item proposed in-app plus one email. In-app notice satisfies "affected schools are notified" (O41-18) | **Reviewer (Daisy); non-blocking** | Register. The email, if Daisy still wants it, uses B1-era email infrastructure already in the product and is a small item for Z's triage |
| **F-6** | «Pindahkan penugasan» first places focus at the top of its page | An accessibility finding on an existing page | **Reviewer (Daisy); non-blocking** | Register, for Daisy's result review of C1w |
| **F-7** | After an ordinary revision, the class page also lists the new release separately as «Siap disediakan» | Daisy's C1-R2 asked for «Ada perbaikan · terbit {tanggal}» linking to «Pindahkan penugasan». A second, separate listing can read as a different lesson | **Reviewer (Daisy)** | Daisy judges at C1w's result review whether it misleads a teacher. If it does, a small presentation correction in C1w's correction pass; otherwise register |
| **F-8** | A native Supabase restore does not reinstall A1's scheduled job | After such a restore abandoned sittings are closed only by the lazy check, until someone installs the job. PINTAR's own restore procedure does reinstall it | **Engineering, in B1** | B1 already owns the shared job installer and the restore check (§6.3). B1 adds: the native-restore runbook step (run the installer), and a health check that reports a missing scheduled job, so that the gap is visible instead of silent. No change to C1w or A1 |

**Summary.** Engineering work: F-1 (a correction), F-3 and F-4 (tests), F-8 (in B1). Reviewer judgment: Sharon on F-1's
class and F-3's result; Daisy on F-5, F-6 and F-7. Non-blocking as they stand: F-2, F-5, F-6. **None reopens C1w by
itself;** only a blocker classed by a reviewer does, under process rule 4.

**Sequence consequence.** B1 and B2 are unaffected. F-3 and F-4 are a short test-only item between A2 and C2w (F-4
needs A2's shared helper). F-1 is placed by Sharon's classification. The batch order of §3 does not change.

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

## Reconciliation record (revision 5)

What changed when the draft met the built code and Daisy's documents:

| Area | Before | After |
|---|---|---|
| Question identity | C2w and C3w keyed to a "stable identity" column expected from C1w | C1w built none. Both attach to a question revision and follow the lineage chain (§5.4, §5.6) |
| AI drafts | an ordinary draft, nothing more | plus an acceptance fact per draft, and a submit step refused while any draft is unaccepted (Daisy's design; §5.6 D2) |
| The scheduled closer | assumed able to commit between sittings | it is a function, one transaction per run; A2 makes it a procedure (§5.3 D6.6) |
| Enrolment termination under O1 | "to verify" | verified: it scores a sitting past its deadline today; the required behaviour during a stop is specified, and the promotion run is flagged (§5.3 D6.2, M-1) |
| Endings that ignore a held sitting | not known | `terminate_session`, `akhiri_penugasan`, `tutup_asesmen_terbuka` (§1.2; §5.3 C) |
| The learner gate | "most boundaries call it" | four do; it takes no lock; start and item view do not call it (§5.5) |
| Print footer | page numbers only on a browser print | Daisy's composition, now stated identically in §5.2 D and F: a browser line with no reference; `CTK-` references |
| Low-stakes recovery | silent | Daisy's confirmation screen (§5.5 F), consistent with D-2 |
| UX sections of B2, A2, A3, C3w | written from the capability definitions | rebuilt on Daisy's `DESAIN-AWAL-4.1.md`, with the points she must revise named |
| Test tooling | assumed | no script runs the inline red cases locally, and the multi-connection helper is not exported; B1 and A2 provide them (§4.1) |
| Batch order | proposed | reconfirmed, unchanged |
