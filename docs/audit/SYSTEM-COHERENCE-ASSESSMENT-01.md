# SYSTEM COHERENCE ASSESSMENT — 01 (Bob · Phase 1 diagnosis)

Diagnosis only. **Nothing here has been repaired.** Production deployment
`46fd4452` and all production state are untouched; no request of any kind was
made to production by this assessment. The F05-S01 / F06-S07 working-tree
corrections remain uncommitted. **Production status: NOT A RELEASE CANDIDATE.**

**Evidence ceiling.** Everything here is **builder evidence (Bob)**. Nothing is
INDEPENDENTLY CONFIRMED by this document; Second Eye's Pass 1 was not read before
it was written. Reconciliation is Sauron's.

## Evidence states (never mixed)

| state | meaning |
|---|---|
| KNOWN RESIDUAL | explicitly documented/accepted before this investigation (handoff §17 register) |
| STATIC FINDING | inconsistent on source inspection; no executable reproduction |
| RUNTIME CONFIRMED | reproduced through executable behaviour — run cited |
| INDEPENDENTLY CONFIRMED | Second Eye reproduced independently (none claimed here) |
| REJECTED | hypothesis disproven by execution |
| HARNESS DEFECT | the diagnostic machinery was wrong — **never counted against PINTAR** |

## Method and provenance

- **Specimens:** `46fd4452` (released) and branch head (application code =
  `19655a5`; head adds diagnostic files only). The only application difference
  is `298b4e3d`.
- **Harness:** `scripts/diagnostics/journeys.mjs`, run by
  `.github/workflows/diagnose-journeys.yml` on a disposable local Supabase stack
  (with its mail sink) on a GitHub runner; the specimen is built and started in
  production mode. Journeys go request → middleware → page / server action /
  route → Supabase → database → response. Server actions are invoked by their
  build-time action ids as a browser does; client-side behaviour runs in real
  Chromium (Playwright). psql is used only for labelled DISCOVERY, one labelled
  ATTACKER-MODEL tamper, and read-back of persisted state — never to cause an
  outcome.
- **Runs:** attempt 1 `35821680038` (no observation; H-1/H-2) · 2 `35821954707` ·
  3 `35825110584` · 4 `35825636265` · 5 `35826152921`. Every RUNTIME CONFIRMED
  item below reproduced on **both** specimens unless the row says otherwise.
- **Recorded specimen deviation:** local `site_url` / redirect allow-list pointed
  at the probe origin `:3999` (repository local config names `:3000`).
- **Emulation, where used, is labelled** (S2a/S2b only).
- **Why CI, not this container:** the container's egress refuses every container
  registry (Docker Hub, ECR, GHCR); no Supabase stack can start here.

---

## Part A — Twelve-journey coherence map

"Assurance" = what existing tests prove. Manifest v58: 277 tests = 178 db · 83
static · 16 app (HTTP). **32 of 38 invariants have no HTTP-level test**; the six
that do (INV-13/15/19/21/37/38) are covered by 16 tests, most of which check
rendering or refusal, not a completed journey.

### J1 — Identity / sign-in / bootstrap
- **Expected:** an institution provisions its people; a provisioned person can
  authenticate (magic link or classroom card); no one can self-provision (L-2,
  doc 05 PUBLIC row); the first SYSTEM_ADMIN is created once (`20261003100000`, `20261004100000`).
- **Actual:** magic-link sign-in works end to end **for an identity that already
  exists in Auth**. Intake-provisioned people get a person, a role and an
  institutional ID, and **no account and no Auth identity**. Nothing in `src/`
  creates an Auth identity for a provisioned person.
- **Missing links:** provisioned person → Auth identity (email or card) →
  sign-in. The public signup endpoint is open beside the form's refusal.
- **Assurance:** L2-TIDAK-DIBUAT-01 tests `/auth/v1/otp` with
  `create_user:false` only; F01-R05/06 and app tests sign in by password
  (seeded identities). Bootstrap is DB-tested only.
- **Composition evidence:** J1b (attempts 4–5): browser A requests a link on
  `/masuk` → mail arrives → link → `/auth/callback` → exchange → lands on `/`
  with a session ("Halo, Guru Bootstrap"). Same link flow in browser B → "Tautan
  ini sudah tidak berlaku". J1onboard (3–5): EDUCATOR row provisioned
  (`institutional_id=PRB…`), `accounts=0`, `auth_identities=0`; classroom-card
  door with that ID → `gagal`. J1a (2–5): signup chain below.
- **Findings:** F-01, F-02, O-01 (F-03 under J4).
- **Blast radius:** every user except operator-created identities.

### J2 — Roles, capabilities, authorization
- **Expected:** doc 05 matrix enforced at DB and application layers; UI only
  reflects; refusals are shown, never reported as success.
- **Actual:** DB authorization held in every attempt observed. The Studio
  lifecycle action reports **success** when RLS silently filters the write to
  zero rows.
- **Assurance:** F06-N02 (declared-population refusals, DB); F01-R02,
  UX1-PIMPINAN-AKSES-01 (HTTP rendering by role).
- **Composition evidence:** J5 (2–5). J1a: a role-less self-signed-up person
  reaches `/belajar` and `/mengajar` home shells (200) and is refused on
  `/studio`, `/konfigurasi`, `/pimpinan`.
- **Findings:** F-05.

### J3 — Institution and tenant isolation
- **Expected:** INV-13 across complete application requests.
- **Actual / evidence:** no cross-tenant read or write was observed to succeed.
  The one composed cross-tenant attempt (J5b) did not execute (H-8).
- **Assurance:** strong DB coverage (F06-P10 etc.); HTTP: F01-R02 (one tenant).
- **Status:** **UNPROVEN at composition.** No finding.

### J4 — Learner enrolment and school transfer
- **Expected:** enrolment/membership through the institution; transfer
  REQUESTED → AUTHORIZED → EXECUTED (doc 04 §3c).
- **Actual:** the intake is the enrolment path; a learner row **with an explicit
  `role: STUDENT`** passes validation and fails provisioning. A learner row
  without a role provisions. Transfer is reachable from `/konfigurasi` actions;
  not executed.
- **Findings:** F-03. Transfer: **UNPROVEN at composition.**

### J5 — Content create → review → freeze → publish → distribute → consume
- **Expected:** doc 04 §1 transitions by capability; human publish; readiness
  gate; consumption by assigned learners.
- **Actual:** consumption of seeded, published content works (J10 learner).
  The Studio lifecycle action writes directly to tables with no read-back; a
  STUDENT's "advance" returns `hasil=ok` while nothing persisted. An EDUCATOR's
  illegal move of a visible row is refused and shown correctly (negative
  control). Studio has no media upload path.
- **Assurance:** F05-R01 (anonymous redirect only); DB suites for transitions.
- **Composition evidence:** J5 (2–5). J5b approve/freeze out-of-scope: **not
  executed** (H-8).
- **Findings:** F-05, S-01 (media, scope question). Approve/freeze by an
  out-of-scope actor, and authoring → publish through Studio: **UNPROVEN.**

### J6 — Assessment: assign → discover → orient → start → answer → interrupt → resume → submit → finalize
- **Expected:** INV-27/28: no legitimate completed work lost; replay never
  duplicates or silently drops; exactly-once finalization; finalization must not
  silently omit pending learner work.
- **Actual:** online path works (J10: start via orientation form, 6/6 answers,
  finish → FINALIZED). Server idempotency behaves correctly. Two client
  defects (F-07, F-08). Pure network outage at Finish is safe (S2a).
- **Assurance:** INV-28 DB tests (server idempotency); no browser/outbox test.
- **Composition evidence:** S1 (4, 5), S2a/S2b (3–5), S3 (5).
- **Findings:** F-07, F-08. Pause/resume, deadline, INV-27: **UNPROVEN at
  composition.**

### J7 — Evidence classification, official / non-official boundary
- **Expected:** INV-20/33: class derived at write; only OFFICIAL reaches
  certificates, analytics and reports.
- **Actual:** OFFICIAL bootstrap tenant session → `certificate_eligibility`
  eligible (J10). No application path sets the PREVIEW context (static).
- **Findings:** KNOWN RESIDUAL — INV-20 vacuity (§17). S-02 (PREVIEW
  unreachable). Otherwise **UNPROVEN at composition.**

### J8 — Integrity observation without automated judgment
- **Expected:** doc 07 / doc 09 (V1): category-7 events raise review signals for
  a human with CAN_REVIEW_INTEGRITY; never a verdict.
- **Actual:** no learner behaviour produces a signal. The only writer
  (`record_integrity_signal`) has no caller; no DB trigger writes signals.
- **Composition evidence:** after the full run (finish, offline/online
  reconnect, navigation, answer changes, visibility hidden/visible on the live
  player): `integrity_signals = 0`; `/studio/integritas` (HoD) shows its
  empty-state (3–5).
- **Findings:** F-09. KNOWN RESIDUAL D-1/D-2/D-3 (emission *semantics*) is a
  different question and stays as documented.

### J9 — Reporting / metrics / evidence sufficiency
- **Actual / evidence:** DB-proven; not driven at composition.
- **Status:** **UNPROVEN at composition.** KNOWN RESIDUAL: two uncalibrated
  Question Health signals.

### J10 — Certificate eligibility → issue → QR → anonymous verification → tamper / revocation / supersession
- **Expected:** doc 04 §7; INV-05/38.
- **Actual:** eligibility true after an OFFICIAL pass; **no certificate row is
  created by anything in the product**; invoking `POST /api/certificates/issue`
  by hand issues correctly; the QR link appears; anonymous verification is
  BERLAKU on head; tampering → TIDAK SAH on endpoint and page; `revoke_certificate`
  works as an RPC and has no product surface; reissue/supersession absent.
- **Composition evidence:** reference specimen F-10 on `46fd4452`: anonymous
  `/api/verifikasi/<token>` → 401, QR page → "tidak ditemukan" for a validly
  issued certificate. On head: 200 BERLAKU and "Berlaku". (2–5)
- **Findings:** KNOWN RESIDUAL V-6a, **with a runtime divergence for Sauron's
  ruling** (O-02). F-10 (reference, not repaired). S-03 (revocation surface).

### J11 — Audit trail
- **Actual / evidence:** the zero-row Studio attempts wrote 0 audit rows
  (consistent: nothing changed). Not otherwise driven.
- **Status:** **UNPROVEN at composition.**

### J12 — Production runtime / configuration boundaries
- **Expected:** configuration cannot silently change authorization or domain
  meaning.
- **Findings:** P-01 (hosted signup open), P-02 (hosted environment
  `development`, gates keyed to it), P-03 (deploy not gated on CI; branch pushes
  run no CI), S-04 (F06-S07 lexical false positive), S-05 (local auth origin ≠ CI
  origin).

---

## Part B — Defect ledger (evidence-labelled)

Severity is blast-radius based, independent of fix size.

**F-01 · Provisioned people have no route to an Auth identity** — RUNTIME
CONFIRMED (attempts 3–5), with a STATIC corroboration (no `src/` path creates an
Auth identity).
- Canonical: a provisioned learner/teacher can authenticate.
- Observed: intake → person + role + institutional ID; `accounts=0`, no Auth
  user; card door refuses; magic link needs an Auth identity with an address the
  intake never collects (rows carry `display_name`, `role`, `node_id`,
  `person_id` only). The code says so itself: `AKUN_AKTIF = 0` — "there is no
  activation path in PINTAR" (`src/lib/pendataan-kontrak.ts`).
- Layers: product workflow ↔ Auth. Not in the §17 register.
- Should a test have caught it? A journey test from intake to sign-in; none
  exists. Every sign-in test uses seeded identities.
- Susceptible elsewhere: any lifecycle step whose owner is "someone else"
  (compare V-6a, F-09).
- Severity: **critical** (no onboarded user can use the product).

**F-02 · The public Auth signup endpoint creates permanent PINTAR identities** —
RUNTIME CONFIRMED on the disposable stack (2–5). Hosted setting observed as P-01;
hosted behaviour deliberately not exercised.
- Canonical: L-2 / doc 05 — no self-provisioning; PUBLIC does nothing but
  verification and Mini-PINTAR.
- Observed: anonymous `POST /auth/v1/signup` with the public anon key → 200;
  `auth.users|persons|accounts` 24|24|24 → 25|25|25; person `display_name`
  chosen by the caller ("Kepala Sekolah (asli)"); the stranger is listed in the
  SYSTEM_ADMIN's `persons_awaiting_first_role` queue under that name. Local
  stack returned a live session (confirmations off locally; hosted has
  `mailer_autoconfirm=false`, which delays the session, not the rows —
  `handle_new_auth_user` fires on insert).
- Immediate cause: signup enabled at the Auth service; the application's
  `shouldCreateUser:false` guards only the form.
- Test gap: L2-TIDAK-DIBUAT-01 measures `/otp` only.
- Also: `persons_no_delete` makes the rows non-removable.
- Severity: **high** (unauthenticated, unbounded, permanent writes into identity
  tables; spoofed names in the first-role queue).

**F-03 · The intake validator and provisioner disagree about `role: STUDENT`** —
RUNTIME CONFIRMED (4–5).
- Observed: `import_validate` → row ok; `import_advance` → row FAILED
  `role_assignments_role_check`; job FAILED. A learner row with no role
  provisions.
- Severity: moderate (a plausible spreadsheet value fails an import after
  confirmation).

**F-05 · Studio reports success for a write that changed nothing** — RUNTIME
CONFIRMED (2–5) for `advanceContentAction`.
- Canonical: a refused transition is refused and shown; never trust 2xx.
- Observed: a STUDENT posts the advance form → redirect `hasil=ok`; course
  APPROVED → APPROVED. Negative control: an EDUCATOR's illegal move of a visible
  row → `hasil=gagal` with the database's reason.
- Immediate cause: PostgREST `update()` filtered to zero rows by RLS returns no
  error; the action never reads back.
- Susceptible: `freezeReleaseAction` (same pattern, plus it `continue`s past
  statuses already reached and still reports ok) and other direct table writes
  in Studio actions — STATIC, not executed (H-8).
- Severity: moderate–high (a governance surface that can misreport outcomes).

**F-07 · After a reload, a changed answer reuses an accepted `client_seq` and
is lost** — RUNTIME CONFIRMED (4, 5; both specimens). **This is Bob's earlier
sequence-counter hypothesis: CONFIRMED, scoped to reload-then-replay.**
- Canonical: INV-28 — a new answer is a new receipt; never silently dropped.
- Reproduction (real Chromium, no emulation): item 1 online; offline; item 2
  answered (outbox); tab closed; online; fresh page (mount replay records item 2
  `client_seq 1`); change item 2 → the client sends `client_seq 1` again; the
  server correctly refuses the conflicting receipt; the outbox keeps it, the page
  shows "offline" indefinitely; Submit → FINALIZED; item 2's authoritative
  answer is the stale replayed one; the learner's final choice remains in
  localStorage.
- Immediate cause: `ItemPlayer` seeds its per-item counter from the server read
  taken before the mount replay and never advances it for replayed entries.
- Distinguished from Second Eye's observation: S3 (same page, no reload) records
  `client_seq 1` then `2` correctly. Both observations hold.
- Severity: **high** (silent evidence corruption in a scored assessment).

**F-08 · Finish finalizes while the outbox still holds learner work** — RUNTIME
CONFIRMED (S1 without emulation; S2b with a labelled emulated refusal).
- Observed: when the pre-finish replay gets `{ok:false}`, the client proceeds to
  `finishSession`; the session FINALIZES with the pending answers absent (S2b: 4
  pending answers treated as unanswered). S2a (network abort) is safe: the replay
  throws, Finish never reaches the server, session stays IN_PROGRESS.
- Immediate cause: `flush()` stops at the first refused entry and returns; the
  Finish handler does not check that the outbox drained.
- Relation: F-07 supplies a real `{ok:false}`; F-08 is the general mechanism.
- Severity: **high**.

**F-09 · No integrity observation is ever emitted** — RUNTIME CONFIRMED (3–5).
- Canonical: doc 07 "Integrity evidence"; doc 09 V1 scope.
- Observed: zero signals after reconnect, navigation, answer changes and a
  visibility change on the live player; review surface empty. Only writer
  `record_integrity_signal` has no caller; no `visibilitychange` listener exists
  in `src/`.
- Not the same as KNOWN RESIDUAL D-1/D-2/D-3 (what to do with repeats).
- Severity: moderate (a V1 capability absent end to end; no evidence corrupted).

**F-10 · Certificate verification endpoint refused by middleware (reference
specimen)** — RUNTIME CONFIRMED on `46fd4452`; corrected at head by `298b4e3d`.
**Not repaired further; not deployed.**
- Test gap: F04-S05 imports the route handler and calls it in-process ("the
  path a stranger uses"), bypassing middleware; the registry and
  `assert_public_surface()` assert the declaration, not the middleware.

**O-01 · Magic link opened in a different browser fails as "expired"** — RUNTIME
CONFIRMED behaviour; **canonical status open** (PKCE binds the code to the
requesting browser; the screen says the link aged out). For Sauron: is
same-device sign-in the intended contract?

**O-02 · V-6a runtime divergence** — KNOWN RESIDUAL V-6a (no issuance
orchestration) **plus an observed divergence from its documented description**.
§17 says the learner UI must render the ELIGIBLE state ("sedang disiapkan").
Observed: after an eligible OFFICIAL pass no certificate row exists at all (only
`certificate_prepare` creates one, and only the uncalled issuance route calls
it), and the learner's certificate page renders the generic refusal "Halaman ini
belum tersedia untuk akun Anda". **Sauron to rule whether this stays within V-6a.**

**S-01 · Media authoring has no product path** — STATIC FINDING; **scope not
established.** `/api/assets/upload-url` has no caller and accepts only
`content/…`; the read route serves only `pelajaran/…` and `profile/…`. doc 09
names "server-gated uploads" and Easy Upload "file/asset-role recognition";
whether Studio media upload is frozen V1 scope needs a ruling before this is a
defect.

**S-02 · PREVIEW evidence class unreachable from the application** — STATIC
FINDING (nothing sets `app.evidence_context`). Low.

**S-03 · No product surface revokes a certificate** — STATIC FINDING
(inventory, runtime-checked); the RPC works for INST_ADMIN (doc 05 ✅).
Whether this belongs to V-6a: for Sauron.

**P-01 · Hosted Auth `disable_signup: False`** — observed configuration, not
executed. Provenance: run `35816242664`, workflow `configure-supabase-auth.yml`
at `e1c20f85`, job `107038259015`, log line `2026-09-23T03:55:24Z`, read-only
`GET /v1/projects/trtlvibiybwixfumjrrx/config/auth` → HTTP 200. The later PATCHes
sent only `site_url`/`uri_allow_list` (`e1c20f85`) and `smtp_*` (`fa2e7bb9`);
the current value after 03:55:24Z is unverified. Combined with F-02 this is the
production exposure.

**P-02 · Hosted `platform_environment = development`** — KNOWN (§3c pending,
gated). STATIC: gates key to it (e.g. non-synthetic institutions refused while
not production; evaluation registry open while not production).

**P-03 · Production deploy is not gated on CI; branch pushes run no CI** —
STATIC FINDING. `ci.yml` runs on main/PR/dispatch; the deploy workflows have no
CI dependency. `46fd4452` did have a green dispatched CI (which F-10 passed
through).

**S-04 · F06-S07 lexical false positive** — STATIC FINDING (test defect): "db
push" + the word "seed" anywhere in one file. The uncommitted working-tree edit
is recorded, not applied.

**S-05 · Local auth `site_url` `:3000` vs CI app `:3999`** — STATIC FINDING,
low; the same class as the production localhost-redirect incident.

### REJECTED
- "J1b magic-link sign-in is broken" (attempts 2–3 showed `gagal` and no
  verifier cookie) — **REJECTED**: the browser run succeeds; the earlier result
  was H-6.

### HARNESS DEFECTS (not PINTAR)
H-1 `createRequire` relative path (1) · H-2 mail-sink URL concatenated (1) ·
H-3 ambiguous `status` column in J5 read-back (2) · H-4 first-role queue called
as INST_ADMIN (2; the refusal was PINTAR behaving correctly) · H-5 NULL
concatenation emptied the response listing (3) · H-6 FormData server-action
encoding → J1b `gagal` (2–3) · H-7 `pg_get_functiondef` over aggregates (3) ·
H-8 J5b specimen course not bound to the actor's institution; revision refused
by name (4–5) · H-9 Auth-identity inventory regex over-broad (3–5; output
disregarded).

---

## Part C — Distribution and patterns (observations, not repairs)

Findings distribute across **multiple categories**:

| category | items |
|---|---|
| production integration only | P-01, P-02, P-03 |
| known residuals (unimplemented) | V-6a (+O-02), INV-20 vacuity, D-1/D-2/D-3, uncalibrated QH signals |
| UI / application composition | F-05, F-07, F-08, F-09, F-10, S-01, S-03 |
| core domain / product workflow | F-01, F-03 |
| security / tenancy | F-02 (+P-01); tenancy: no failure observed, UNPROVEN at composition |

Candidate mechanism families (labelled, for Second Eye to attack):
- *A step owned by "someone else" that no journey reaches* — F-01, F-09, V-6a/O-02,
  S-01, S-03.
- *A write reported without read-back* — F-05 (and the earlier Vercel env
  incident).
- *A guard at one layer assumed to cover another* — F-02 (form vs Auth), F-10
  (registry vs middleware).
- *Client/server state split with a local counter* — F-07, F-08.
- *Tests that call a component in-process and claim the journey* — F-10
  (F04-S05), L2 (`/otp` only), every sign-in test (seeded identities).

**ROOT-CAUSE HYPOTHESIS (not a conclusion):** components were built and verified
against their own contracts, and the assembled journeys were never executed as
journeys. This stays a hypothesis until the UNPROVEN journeys (J3, J4 transfer,
J5 authoring→publish, J6 pause/deadline, J7, J9, J11) have been exercised.

## Part D — Unproven (the denominator still open)

J3 at composition; J4 transfer; J5 approve/freeze by an out-of-scope actor and
Studio authoring → publish; J6 pause/resume/deadline/INV-27; J7; J9; J11; J1
bootstrap at composition.
