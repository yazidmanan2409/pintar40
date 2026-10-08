# 04 · Security and data

**PINTAR 4.0 handoff to Codex · drafted 8 Oct 2026 · code = dab5c12 (main 8202139, docs-only on top).**
Every claim cites a path, migration, test ID, commit or decision. **UNVERIFIED** marks what was not confirmed in code or
git for this page. No secret, credential, token or connection string appears here; environment variables are named only.
Nothing was run to produce this page: no test, audit, workflow, database or API call.

Conventions: migrations are in `supabase/migrations/`; decisions in `docs/coordination/DECISIONS.md`; test IDs are
declared in `selftest/manifest.json`; database suites are `selftest/db/fable*.sql`; journeys are `audit/journey.mjs`.
Indonesian role names used in the UI: Admin platform = SYSTEM_ADMIN, Admin sekolah = INSTITUTION_ADMIN,
Dekan = DEAN, Kepala departemen = HEAD_OF_DEPARTMENT, Guru = EDUCATOR, murid = STUDENT.

---

## 1. Authentication and sessions

### 1.1 Supabase Auth and the two account kinds
- **Identity provider:** Supabase Auth through `@supabase/ssr`. The server client is `src/lib/supabase/server.ts`. The
  proxy builds its own client in `src/proxy.ts` (`proxy()`). Env names: `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` (server-only, `src/lib/env.ts`).
- **Email accounts:** staff, and learners who have email. Idle lifetime is 7 days (`UMUR_SESI.email`, `src/lib/sesi.ts`;
  D-009).
- **Class cards:** an Auth address `card-<digits>@<CARD_EMAIL_DOMAIN>` (`adalahAlamatKartu`, `src/lib/sesi.ts`). The Auth
  password is `deriveCardSecret(cardNumber, pin)`, a SHA-256 over `CARD_PEPPER|card|PIN` (`src/lib/card.ts`). Idle
  lifetime is 60 minutes (`UMUR_SESI.kartu`).
- **Card sign-in:** `POST /masuk/kartu` is rewritten to `src/app/api/masuk/kartu/route.ts` (`next.config.ts`
  `rewrites`). Its decision is `masukDenganKartu` (`src/lib/kartu-masuk.ts`), in this order:
  1. same origin, else `CARD_REQUEST_REFUSED` (login CSRF);
  2. digits only;
  3. the per-card cooldown (`card_signin_attempt`) is checked before Auth is asked;
  4. a single `CARD_NOT_MATCHED` for every mismatch.
  Tests: BOB12-K01, BOB12-K02.
- **Sliding idle limit:** the proxy re-sends the auth cookies with the account's `maxAge` on every signed-in request.
  On server actions it does so only when needed (`perluGeserSesi`, `COOKIE_GESER`, `src/lib/sesi.ts`; BOB-05, BOB-23).

### 1.2 The sign-in proxy (`src/proxy.ts`; Next 16.3.5 `proxy`, not `middleware.ts`)
- **Public allow-list:**
  - `PUBLIC_PATHS`: `/`, `/masuk`, `/masuk/kartu`, `/masuk/password`, `/aktifkan` (and its two doors), `/masuk/lupa` (and
    its four doors), `/auth/callback`, `/keluar`.
  - `PUBLIC_PREFIXES`: `/verifikasi/`, `/api/verifikasi/`, `/id/`.
  - Also public: `/_next*`, `/favicon.ico`, and `/api/dev*`, which its own handler 404s outside development.
  - Everything else, without a user, gets a redirect to `/masuk?lanjut=…`, or a 401 JSON for `/api/*`.
- **Matcher (`config.matcher`):** `"/((?!_next/static|_next/image|favicon.ico|brand/|fonts/).*)"`. Only those five
  prefixes skip the proxy. Every other path, including any other file under `public/`, passes through the auth check
  above. F01-R08 proves this over HTTP for `/brand/` and `/fonts/` (served anonymously) against `/brandx`, `/fontsx/a`,
  `/konfigurasi` and `/studio` (redirected).
- **Authority:** the proxy authenticates only. Its header comment says authorization is decided by database primitives
  on the page or route (FABLE-01 §4, INV-37).
- **Per signed-in request, the proxy:**
  - calls `supabase.auth.getUser()`;
  - asks `sesi_periksa`, unless the session is a prefetch or a server-signed PERSONAL session (`pribadiTersimpan`);
  - turns its answer into the following outcomes.

  | Outcome | Response |
  |---|---|
  | TERKUNCI (locked) | A page redirects to `/terkunci`; anything else gets 423 |
  | BERAKHIR (ended) | `keluarPerangkatIni`, then `/masuk?sesi=berakhir` or 401 |
  | Maintenance | `/pemeliharaan` or 503 |
  | Activation hold | `my_setup_state = REQUIRED` gets the wizard or a 403 |
  | «Komputer siapa ini?» | A staff person's page navigation goes to `/perangkat` (`HALAMAN_PERANGKAT`) |

- **The database refuses as well:** the lock and end states are enforced by PostgREST's pre-request against
  `device_sessions` (migration `20261117100000_a_shared_computer_locks_and_resumes_with_the_pin.sql`; header of
  `src/lib/penjaga-sesi.ts`).

### 1.3 Class card
- A card session's mode is always CARD (`src/lib/penjaga-sesi.ts` header). It has a 5-minute inactivity lock, PIN resume,
  ends after 3 wrong PINs, and ends after 60 minutes locked.
- Its working context is Belajar only (migration `20261210100000_a_session_knows_what_it_is_here_to_do.sql`; D-132(f);
  F22-K01, F22-K02). This is presentation only.
- **CR-91, HELD:** who may hold a card credential at all. See §13.

### 1.4 Activation wizard (Gate 3, BOB-26)
- **Routes:** `/aktifkan` is public. Its doors are `/aktifkan/kode` and `/aktifkan/periksa`, rewritten to
  `src/app/api/aktifkan/*`. After sign-in the person is held in the wizard at `HALAMAN_AKTIVASI`
  (`src/lib/aktivasi-kontrak.ts`) by the proxy's hold (`src/lib/penahan-aktivasi.ts`; `my_setup_state`, migration
  `20261112100000_a_person_activates_their_own_account.sql`).
- **The hold is a journey, not an authority.** An unreadable state holds nothing (`src/proxy.ts` comment).
- **Who may activate:** activation authority is `authorize_account_activation` (migrations `20261005120000`,
  `20261111100000`, `20261203100000`).
- **D-102:** a first-password activation ends the activation session (migration
  `20261123100000_an_activation_ends_its_own_first_session.sql`, reason `PASSWORD_PERTAMA`). Tests: D102-S01, D102-D01,
  D102-A01.
- **Gate 3 tests:** BOB26-A01..A04, BOB26-K01, BOB26-S01.

### 1.5 Password, PIN and recovery (Gates 4 and 5)
- **Gate 4 (BOB-27), forgotten password by email:** `/masuk/lupa/*` (migration
  `20261115100000_a_forgotten_password_is_recovered_by_email.sql`). A recovery OTP's session is ended immediately
  (`akhiriSesiVerifikasi`, `src/lib/keluar.ts`). Tests: BOB27-A01, K01, S01, D01.
- **Gate 5 (BOB-28), recovery by PINTAR ID and PIN:** `/masuk/lupa/pin` and the QR page `/id/` (migration
  `20261116100000_a_forgotten_password_is_recovered_by_pintar_id_and_pin.sql`). Tests: BOB28-A01..A03, K01, S01, D01.
- **PIN storage:** PINs are stored as bcrypt `pin_hash` via `extensions.crypt`. Retired PINs are checked too
  (`person_pins_retired`; migrations `20261021100000_an_identity_foundation.sql` and `20261117100000`).
- **Leaked-password check:** on in staging and not read in production (CR-23, closure register). Whether D-082(a)
  supersedes D-033(c) is pending as a record (QN2).
- **Secret fields:** one Secret-field component on all ten secret inputs (CR-86, L1, 8ee3585, PENUTUPAN-R01). The
  presentation is Daisy's.

### 1.6 Shared versus personal computer («Komputer siapa ini?», Gate 6, BOB-29)
- **Modes:** SHARED is the default until answered (C11). PERSONAL never locks and keeps 7 days. SHARED and CARD lock
  after 5 minutes and resume with the same person's PIN. 3 wrong PINs end the session; 60 minutes locked ends it. See
  the header of `src/lib/penjaga-sesi.ts` and `umurSesiMode`.
- **Implementation:** the page is `src/app/perangkat/page.tsx`. The device cookie is `COOKIE_PERANGKAT`, hashed in
  `hashPerangkat`. The personal mark is `COOKIE_PRIBADI`, signed per session (`nilaiPribadi`).
- **The answer is a declaration, not proof of ownership** (page comment).
- **Tests:** BOB29-A01..A03, K01, S01, D01.
- **CR-92 (open, minor):** opened from Akun saya, the page preselects «shared». See §13.

### 1.7 Sign-out and BD-11
- **Every sign-out** goes through `keluarPerangkatIni` (`src/lib/keluar.ts`; BOB05-K01). It ends PINTAR's session row
  first (`sesi_akhiri_saya`), then calls Auth `signOut({scope:"local"})`. Other devices are untouched.
- **«Keluar dari semua perangkat»** is `keluarSemuaPerangkat`, through `sesi_akhiri_semua`. Each session is audited and
  its Auth sessions are deleted.
- **Stale-continuation guard (L3, D-132(e)):** `src/lib/tanda-keluar.ts`, with cookies `COOKIE_HADIR` and
  `COOKIE_SELESAI` set in `src/proxy.ts`. A browser whose session ended mints no `lanjut` for the next sign-in.
  Test: F22-P03.
- **BD-11:** journey step `BD11` (`audit/journey.mjs`). Admin signs out deep in Konfigurasi, presses Back twice, and no
  ended-session page returns. The next person lands in their own context.
  - It is the CR-90 (P0) acceptance step. CR-90 was closed in L1 (8ee3585; journeys 37581007813).
  - Per the handoff facts it is PASS on three engines on dab5c12 (journeys 37775382999).
  - Locally it needs Firefox and WebKit.

### 1.8 Gate decisions
- **D-098(a, f):** Gate 3 GO, then Gates 4–6 as the remaining build. Gate 3 landed 4 Oct and its migrations were
  renumbered (`20261112100000`, `20261113100000`).
- **D-102:** see §1.4.
- **D-101(3):** a lost, replaced or reissued credential terminates the person's sessions (§4).

---

## 2. Authorization

### 2.1 Role model
- **Roles:** `public.app_role` is `STUDENT, EDUCATOR, HEAD_OF_DEPARTMENT, DEAN, INSTITUTION_ADMIN, SYSTEM_ADMIN`
  (`20260912004158_foundation_base.sql`). `role_rank` runs 1..6.
- **Where roles are held:**
  - `role_assignments.role` has a check `<> 'STUDENT'` (`20260912004431_authorization.sql`). Learners are enrolments, not
    grants.
  - Only SYSTEM_ADMIN may have a null `scope_node_id`.
- **The application's role is for display only:** `src/lib/auth.ts` `currentViewer().displayRole` is "display only —
  never used as authority".

### 2.2 Capabilities
`role_capabilities(app_role)` is derived from the role and never assigned to a user (`20260912004158_foundation_base.sql`).

| Role | Capabilities |
|---|---|
| SYSTEM_ADMIN, INSTITUTION_ADMIN | CAN_DRAFT, CAN_REVIEW, CAN_FREEZE_RELEASE, CAN_PUBLISH, CAN_ASSIGN_LEARNING, CAN_QUICK_ASSESSMENT, CAN_AUTHORIZE_TRANSFER, CAN_REVIEW_QUESTION_HEALTH, CAN_MANAGE_REPORT_TEMPLATES, CAN_REVIEW_INTEGRITY |
| HEAD_OF_DEPARTMENT | CAN_DRAFT, CAN_REVIEW, CAN_FREEZE_RELEASE, CAN_ASSIGN_LEARNING, CAN_QUICK_ASSESSMENT, CAN_REVIEW_QUESTION_HEALTH, CAN_REVIEW_INTEGRITY |
| EDUCATOR | CAN_DRAFT, CAN_ASSIGN_LEARNING, CAN_QUICK_ASSESSMENT |
| DEAN, STUDENT | none (DEAN read-only by design, INV-19; F01-T06) |

`role_capabilities` was later redefined in migrations `20260923130000`, `20260924100000` and `20260926100000`. The
table above is the first definition. **UNVERIFIED:** whether those redefinitions changed the matrix. Codex should read
the latest definition before relying on it.

### 2.3 Primitives
All primitives are in `20260912004431_authorization.sql` and fail closed: null, missing or any error returns false
(F01-T05).
- `is_system_admin()`, `current_person_id()`.
- `has_scope(min_role, node)`: SYSTEM_ADMIN gets true everywhere; otherwise an active assignment of at least that rank
  over the node's `jalur`.
- `can_on_node(capability, node)`: an active assignment carrying the capability, scoped over the node (SYSTEM_ADMIN
  anywhere).
- `is_member_of_institution`, `person_visible_to_me`. `person_visible_to_me` was revoked from PUBLIC in 05bd52e
  (ADR-0021).
- `can_in_institution` (`20260912112712_content_hierarchy.sql`).
- App wrappers in `src/lib/auth.ts`: `isSystemAdmin`, `hasScope`, `canOnNode`.

### 2.4 Working context and the action guard (L3; D-132, D-133)
- **Context:** a purpose (BELAJAR, MENGAJAR, MENGELOLA) and a place, stored on the session's own `device_sessions` row
  (`20261210100000_a_session_knows_what_it_is_here_to_do.sql`).
  - One writer: `konteks_tetapkan`. One reader: `konteks_saya`, which re-checks against current grants and clears stale
    pairs.
  - `sesi_akhiri_inti` clears it at session end.
- **Never authority.** The migration's verification fails if any RLS policy or authorizing function reads the context
  columns. F22-K06 proves that a forged context widens nothing.
- **Action guard (§2.11, D-132(k)):** `wajibDalamKonteks` and `sasaranDalamKonteks` (`src/lib/konteks-server.ts`). Every
  context-bound human action checks its target's school against the active context, or sends the person to the
  chooser. It is "a narrowing, never a permit".
  - There are 48 references under `src/`.
  - F22-P05 proves every server action and the five API routes are guarded or exempt by name, and catches a planted
    unguarded action.
- **Chooser:** it fails closed when grants are unreadable (F22-A01). Visiting `/` changes nothing (F22-P04).
- **Two sessions are independent** (F22-K03). Invalidation: F22-K04. End: F22-K05.

### 2.5 Page guards
- **Authentication:** the proxy (§1.2).
- **Per page:** the page reads the viewer and redirects. Example: Studio tabs by role from canon, `tabSaya`
  (`src/lib/studio-tab.ts`; CR-87, L2, 0387286; PENUTUPAN-T01, J01, P01). `src/app/studio/integritas/page.tsx` redirects
  to `/studio` when the tab is not the person's.
- **The comment in `src/lib/studio-tab.ts`:** "Hiding a tab makes nothing safe: every action is still the database's to
  refuse."
- **Platform-only parts:** the JSON package import and the library grant and withdrawal (CR-87(4), FD-8).

---

## 3. Multi-tenant isolation and RLS

### 3.1 How policies scope by institution
Every policy calls the primitives of §2.3, so the application and RLS cannot drift (`20260912004431_authorization.sql`
header). Examples:
- **Content:** the tables `sources`, `source_versions`, `courses`, `modules`, `lessons`, `learning_objectives`,
  `misconception_taxonomy`, `items` and `item_options` have select, insert and update policies of
  `can_in_institution('CAN_DRAFT', institution_id)` (`20260912112712_content_hierarchy.sql`).
- **Audit:** `audit_log_select` is `is_system_admin() or has_scope('INSTITUTION_ADMIN', institution_id)`
  (`20260912004431_authorization.sql`; later touched by `20260917110000_evaluation_registry.sql`, **UNVERIFIED** how).
- **Certificates:** owner-only read (`20260914180000_verification_is_cryptographic.sql` §4).
- **Canonical (PINTAR library) content:** no widened policy. Named SECURITY DEFINER accessors gated on existing
  capabilities instead (`20260915140000_canonical_read_path.sql`).
- **D-032:** `published_lessons` lost every client grant and became `security_invoker`
  (`20261008100000_lesson_content_is_not_public.sql`).

### 3.2 Database guards in migrations
`platform_schema_lint()` counts (latest body around `20261008100000`):
- `tables_without_rls`;
- `policies_using_true`;
- SECURITY DEFINER functions without a pinned `search_path`;
- anon or authenticated EXECUTE on definer functions;
- `client_readable_definer_views`.

The scoring migration asserts anon executes no `public` function (`20260913091500_learning_cycle_scoring.sql`). D-033
records the Advisor findings accepted by design, including SECURITY DEFINER functions callable by signed-in users.

### 3.3 Tests that prove it
- **Database (fable01.sql):**
  - F01-T02: tenant isolation, an institution admin sees zero foreign rows.
  - F01-T03: a learner sees only self.
  - F01-T07: an educator's scope covers their own class only.
  - F01-T13: schema lint all zero.
- **Static:** F01-S02, no `USING/WITH CHECK (true)` in any migration or seed.
- **CI red cases (`.github/workflows/ci.yml`, job `red-case`):** each plants a defect and requires the named check to
  fail.
  - `static-permissive-policy` writes `create policy red_case on public.persons for select to anon using (true);` as
    migration `20990101000000_red_case.sql`. It must make F01-S02 FAIL (step "Static contract must go red for the right
    reason").
  - `db-table-without-rls` plants `create table public.red_case_no_rls …` with no RLS. On a fresh stack, F01-T13 must
    read `f` (step "DB contract must go red on F01-T13").
  - Others:
    - `static-second-verification-route` (F04-S01, INV-38);
    - `static-duplicate-engine` (F03-S01, INV-26);
    - `static-raw-evidence-read` (F02-S01);
    - the database gate groups (fable04/05/06, wp1, wp7, wp8, bob01..bob50, tour, r1, task1/2), planted from
      `selftest/plants/*.sql` and `selftest/plants/plants.json`.
- **Suites:** `selftest/db/fable01.sql` .. `fable22.sql`, with the BOB and WP database plants, run in CI. The latest CI
  was 37775379355 on dab5c12, 18/18, per the handoff facts.
- **Recovery caveat:** a dump restored into a new Supabase project re-grants `anon` and `authenticated` default
  privileges. Every internal SECURITY DEFINER function then becomes callable unless revoked again
  (`docs/recovery/BACKUP-DR-REVIEW-2026-10-05.md`, "Why the privileges open").

---

## 4. Role-grant boundaries

### 4.1 `role_assignments_guard`
The latest definition is in `20261122100000_a_school_resolves_its_own_recovery.sql`, trigger on `role_assignments`. It
enforces the following.
- **No deletes and no edits:** no DELETE ("revoked, never deleted"). The core fields are immutable; revoke and grant
  again. The revocation reason is written only with the revocation (D-093).
- **No `auth.uid()`:** allowed only for the day-zero `bootstrap_first_system_admin` marker (SYSTEM_ADMIN, none active,
  installation never initialised). Also allowed for a synthetic seed outside production. Otherwise refused (INV-16).
- **Self-grant refused.** `granted_by` is forced to the actor.
- **SYSTEM_ADMIN, or any null-scope role:** an active SYSTEM_ADMIN only.
- **INSTITUTION_ADMIN below a school's root node:** SYSTEM_ADMIN only. An Admin sekolah appoints another at the school
  root (D-101).
- **Otherwise:** the grantor needs `has_scope('INSTITUTION_ADMIN', node)`. A non-SYSTEM_ADMIN grantor may grant only to
  a person the school already has: an institutional ID, a non-system role there, or a PENDING or ACTIVE enrolment there
  (D-049, BOB-21, errcode 42501 `GRANT_NO_SCHOOL_RELATIONSHIP`).
- **Audit:** every grant and revoke is audited (`role_assignments_audit`; F01-T04 covers anti-escalation, audit and
  immutability).

### 4.2 D-101 (school self-service and recovery authority)
- **Recovery authority:**
  - A lost card is revoked and reissued by Admin sekolah.
  - A lost Admin sekolah credential is reissued by another Admin sekolah of the same school.
  - Otherwise the Platform Admin is the authority of last resort.
  - Nobody recovers their own privileged credential.
- **Sessions:** reissue ends the sessions.
- **Implementation:** `20261122100000` (`recovery_status`, `admin_reset_recovery` declared SCOPE INSTITUTION_ADMIN;
  `RECOVERY_SELF` refused; internal `sesi_akhiri_orang`, `recovery_may_assist`, `recovery_assist_school` not executable by
  `authenticated`).
- **Tests:** D101-S01, D101-D01, D101-A01, D101-A02.
- **Conformance review:** `docs/coordination/reviews/D-101-RECOVERY-AUTHORITY-CONFORMANCE.md`.

### 4.3 BOB19-K01, Option B (D-133(d))
- **Rule:** a school's first Admin sekolah is appointed only by:
  - an active SYSTEM_ADMIN;
  - in Mengelola for a school with no active Admin sekolah;
  - of a person recorded at no school;
  - at the school root.
- **Ordinary school-role grants** name the school's own people. This is enforced in the server actions
  (`src/lib/admin-pertama.ts`; Konfigurasi actions). The database restriction on the list is in
  `persons_awaiting_first_role`.
- **No migration** (`docs/reports/PINTAR-4.0-L3-BOB19-OPTION-B-EVIDENCE-2026-10-08.md` §1).
- **Tests:** BOB19-K01, F22-A02.

### 4.4 D-133(e): the standing boundary
The database enforces who may grant and records every grant. The application enforces which workflows a platform
administrator may use.

**An active SYSTEM_ADMIN may still grant any school role at the database.** `role_assignments_guard` skips the D-049
relationship check when `is_system_admin()`, and `has_scope` returns true everywhere for a SYSTEM_ADMIN. This is
standing, audited authority. It is **not** database-enforced narrowing and must never be described as such. Changing it
needs its own product and security ruling (D-133(e)).

Related: L4 finding 6. The Peran & akses role list is unbounded, with a revoke form per row. It is minor, open, and
waits for Daisy's Collection pattern (`docs/reports/PINTAR-4.0-CLOSURE-L4-2026-10-08.md` §7).

---

## 5. Assessment answer-key protection

### 5.1 Where keys live
- **Keys:** `item_options.is_correct` and `item_options.rationale` (the content tables of
  `20260912112712_content_hierarchy.sql`). RLS is CAN_DRAFT in the item's school, so EDUCATOR, HEAD_OF_DEPARTMENT,
  INSTITUTION_ADMIN and SYSTEM_ADMIN can read them. STUDENT and DEAN hold no capability and read none.
- **Committed copies:** the content workbooks and packages committed to the repository also carry keys. See §11.5.

### 5.2 Who can read them
- **Learners:** never. The learner paper is built by the database sanitizer (`session_paper`, allow-list
  `item_type_registry.sanitizer_allowlist`; `20260913090000_learning_cycle_delivery.sql`: "the answer key never leaves
  the database").
  - INV-01 assertion (`20260913091500_learning_cycle_scoring.sql`): `grade_response`, `evaluate_session`,
    `session_final_responses` and `session_misconceptions` must not be executable by anon or authenticated.
  - `src/app/belajar/_components/ItemPlayer.tsx`: "No answer key, no correctness, no rationale".
- **The canonical read path (another tenant's content):** `distributed_releases`, `distributed_release_outline` and
  `distributed_lesson_preview` (`20260915140000_canonical_read_path.sql`).
  - These are classified STAFF and gated on CAN_ASSIGN_LEARNING or CAN_DRAFT.
  - A structural check fails the migration if `distributed_lesson_preview` mentions `is_correct`, `item_options` or
    `rationale`, or if the outline mentions `is_correct` or `item_options`.
  - A consuming school never reads the canonical key.
- **Reviewers in their own school (D-088(h)):** `src/lib/soal-tinjauan.ts` reads `is_correct` and `rationale` with the
  reader's own client under RLS. These are CAN_DRAFT holders; every CAN_REVIEW holder has CAN_DRAFT.
- **The bank (Studio «Bank Soal», `src/app/studio/bank/page.tsx`):** the tab is gated on CAN_REVIEW_QUESTION_HEALTH. As
  built it is Question Health. Key and reason are **not** shown on the bank. That is S23q/CR-52 (§12).

### 5.3 D-032
Lesson content is not public. `published_lessons` has no client grants and is `security_invoker`. Its anon surface was
removed from `public_surface_registry` (`20261008100000_lesson_content_is_not_public.sql`).

### 5.4 Item-correctness boundary
- **Use of the term:** it appears in `src/lib/contoh-buku-kerja.ts` ("goes around D-032 and the item-correctness
  boundary"). **UNVERIFIED:** no decision or migration defines it under that name. The enforcement in code is §5.2
  (keys readable only under CAN_DRAFT RLS or inside the engine).
- **A separate concept:** `item.correctness_rate`, an academic-evidence metric
  (`20260928100000_academic_evidence_is_its_own_boundary.sql`). That migration routes response-derived aggregates through
  `academic_responses`. It concerns evidence provenance, not key secrecy.

---

## 6. Assessment integrity evidence

- **Signals:** `20260912194342_telemetry_and_integrity.sql`. Presented items are readable by the learner, or by
  CAN_REVIEW_INTEGRITY in the session's school (`presented_items_select`, latest
  `20261118100000_an_educator_learns_as_a_participant.sql`).
- **Review centre `/studio/integritas`** (`src/app/studio/integritas/page.tsx`):
  - The tab belongs to CAN_REVIEW_INTEGRITY (HOD, Admin sekolah, Admin platform; never a teacher).
  - It reads `integrity_signals_awaiting_review` and is narrowed to the working-context school (`studioInstitutions`).
  - Signals are "material for a human, never a verdict". Decisions describe the reviewer and write no outcome to the
    signal, session or result.
  - A reviewed sitting leaves the list: FD-7, `20261208100000_a_reviewed_observation_leaves_the_waiting_list.sql`,
    F21-R01.
- **Separation of duties (CR-76, W-2; D-122(4), D-123(4)):** `20261205100000_whoever_refers_an_integrity_case_does_not_decide_it.sql`.
  - `advance_management_decision` refuses the referrer both UNDER_REVIEW and DECIDED on an INTEGRITY_REFERRAL. A table
    constraint forbids it on any path.
  - `management_decision_independent_decider` reports "waiting for independent decision" truthfully.
  - Test: W2-K01 (`selftest/w2.test.ts`).
  - «Diteruskan ke pihak sekolah» is offered only where the server accepts it.

---

## 7. Certificate signing and verification

### 7.1 Signing
- **Algorithm:** HMAC-SHA256 over canonical bytes, compared in constant time (`src/lib/certificates/sign.ts`). The
  payload is built in SQL and signed in Node.
- **Keys:** versioned env vars `CERT_SECRET_KEY_V1`, `CERT_SECRET_KEY_V2`, … read only by `src/lib/certificates/keyring.ts`
  (`server-only`; INV-07). Earlier versions stay loaded as verify-only and are never deleted. F01-S03 limits which
  modules read which secret class.
- **Escrow (D-107(b) D8):** no offline plaintext copy of `CARD_PEPPER` or the certificate keys. Dual-recipient encrypted
  escrow is the path, and it is not active yet (B5; §10).

### 7.2 Sealing
`20261201100000_a_certificate_is_numbered_by_its_holder_and_sealed_at_issuance.sql` (CR-02, CR-01):
- `institution_as_issued`, `course_*_as_issued` and `language_as_issued` are fixed at issuance.
- `enforce_certificate_write` forbids DELETE and any change to the identity, number, token, payload or issued fields.
- The number is `<PINTAR ID>/<sequence>`, taken under a per-person lock and never reused.
- Related: `20261126100000_a_certificate_number_is_never_shared.sql`. A Quick assessment does not certify
  (`20261113100000_a_quick_assessment_does_not_certify.sql`).

### 7.3 The public check
- **One surface (INV-38):** the page `/verifikasi/[token]` and its endpoint `/api/verifikasi/[token]` (`PUBLIC_PREFIXES`
  in `src/proxy.ts`; `public_surface_registry`, ENDPOINT kind with `parent`).
- **The endpoint recomputes the signature** from `certificate_verification_material(token)`. That function is internal
  and reached by service_role in the API route only. `verify_certificate` has no anon grant
  (`20260914180000_verification_is_cryptographic.sql`). The response is a closed five-field shape.
- **Tests:**
  - F01-R07: the running proxy admits the endpoint and refuses its siblings.
  - Red case `static-second-verification-route` (F04-S01).
  - Journey step `P1` "PUB-04": a random token answers a 404 `{"found": false}` anonymously (`audit/journey.mjs`).
- **Revocation:** `revoke_certificate`, SECURITY DEFINER, gated on CAN_PUBLISH.

### 7.4 Scoring versions (F20-Q10)
`selftest/db/fable20.sql` F20-Q10 (D-121(a)(b), Q10 Alternative 4):
- the current scoring version names Sangat Baik ≥ 90%, Baik ≥ 80% and Cukup ≥ 70%, and nothing below 70%;
- the engine is `pintar-engine/2` (D-060(b));
- a published version's descriptors cannot be edited in place;
- eligibility follows the school's sealed mark.

---

## 8. Content publishing and immutable releases

- **Capabilities:**
  - CAN_PUBLISH: SYSTEM_ADMIN and INSTITUTION_ADMIN only.
  - CAN_FREEZE_RELEASE and CAN_REVIEW: also HEAD_OF_DEPARTMENT.
  - EDUCATOR: CAN_DRAFT (§2.2).
  - The CAN_PUBLISH gate is INV-32 (`20260912124007_content_freeze_hash.sql`, `20260912125618_freeze_capability_gate.sql`).
- **State machine:** an allow-list table, `content_status_transitions`. A status with no edge can be neither reached nor
  left (`20260912114854_content_lifecycle.sql`; F02-T01..T04).
- **Freeze:**
  - `content_sha256` under contract `PINTAR-CONTENT-SHA256/1` (ADR-0004). No UUID or timestamp enters the hash.
  - Taught content is immutable after FROZEN (INV-04).
  - Content tenancy is immutable (`20260912130904_content_tenant_immutable.sql`).
  - A sealed chapter keeps its tests' questions (`20261105100000`).
  - `publish_readiness` is internal only (5aa9f2f).
- **Studio steps** (tabs, `src/lib/studio-tab.ts`):
  - `unggah`: upload a workbook, CAN_DRAFT;
  - `tinjau`: review, CAN_REVIEW, never the author's own work;
  - the package page and publish steps.
  - Publication requires CAN_PUBLISH at the database.
  - **UNVERIFIED** for this page: the exact click order of the publish steps.
- **Versions and corrections (M10, D-085):** `20261106100000_a_correction_arrives_in_its_line.sql`.
  - A corrected workbook names `revises_course_id` and a `change_summary` of 10–1000 characters.
  - It must correct the school's newest sealed release of that line, so lines never fork.
  - The workbook stays the edit surface (D-007). There is no in-app question editor (D-123(1)).
- **Evidence of stability:** FD-5 left 27 sealed staging releases' hashes unchanged (closure register, CR-89).

---

## 9. Student transfer protections

- **Lifecycle (INV-25):** `20260912004527_transfer_rollover.sql`. The state enum is
  `REQUESTED → AUTHORIZED → EXECUTED | REJECTED | CANCELLED`. `transfers_guard` and `transfers_audit` triggers.
  - `transfer_request`: by CAN_AUTHORIZE_TRANSFER on either side, or by the learner themselves (no consent policy yet).
  - `transfer_authorize`: must come from the **counterpart** institution.
  - `transfer_execute`: needs an AUTHORIZED transfer and CAN_AUTHORIZE_TRANSFER on either side. It creates a new
    enrolment, closes the old one and its memberships, and grants `portable_visibility`.
  - `transfer_reject`.
- **What moves:** `record_class_registry` declares each record class PORTABLE (enrolments, memberships) or
  INSTITUTION_SCOPED (`audit_log`, `role_assignments`, which never transfer).
- **Open:** consent policy is OD-9: "nothing about consent is invented here" (migration comment). **UNVERIFIED** whether
  OD-9 was ruled since.
- **Display:**
  - The other school shows «—» for Admin sekolah under existing row security (D-135(e)).
  - Transfers are listed by their own paged read (L4 finding 5; 2750de3).
  - A class move within a school keeps history (`20261027100000_a_student_moves_class_and_keeps_their_history.sql`).
- **Tests:** F01-T10, the transfer lifecycle with portable and institution-scoped visibility.

---

## 10. Audit logging and recovery controls

### 10.1 Audit trail
- **Append-only:** `public.audit_log` is append-only. Triggers `audit_log_no_update`, `audit_log_no_delete` and
  `audit_log_no_truncate` (`20260912004158_foundation_base.sql`). UPDATE, DELETE and TRUNCATE are revoked even from
  service_role (`20260912051935_audit_log_no_service_writes.sql`).
- **Tests:** F01-T11 (append-only for student, sysadmin and owner); build SHA stamped via the `x-pintar-build`
  header (F01-T19).
- **Read access:** SYSTEM_ADMIN, or INSTITUTION_ADMIN over the row's institution (§3.1).
- **Konfigurasi:** the audit page shows the newest 50, then paged (e7fb612; CR-39).
- **CR-13:** the email addresses held in the audit record are accepted as exposed to authorised school admins of their
  own school (D-123(5)).

### 10.2 Backup and DR (#150)
- **Verdict: NOT PASS for PRODUCTION READY, accepted (D-104, D-105).** Source:
  `docs/recovery/BACKUP-DR-REVIEW-2026-10-05.md` §"Verdict". Restated in `docs/recovery/EVIDENCE-INDEX-150.md` §1.
- **Items in the review:**

  | Item | Status |
  |---|---|
  | B1 (G2, hosted native restore, 24/24, 8 min 03 s) | **CLOSED 6 Oct** |
  | B2 (production's 7 daily backups seen; PITR off) | **CLOSED 6 Oct** |
  | B3 (machine-readable backup list; G6 refuses production applies until token C1, O2) | open |
  | B4 / B9 (copy outside Supabase; Storage files) | WP-B built, not active |
  | B5 (durable-secret escrow) | built against stand-ins, not active |
  | B6 (recovery rests on one person; R2 and second custodian) | WP-D **not started** |
  | B7 (production watch) | built, off until release |
  | B8 (reconstruction) | WP-C built, hosted rehearsal O8 open |

  The handoff brief's "B1–B7 with the owner" does not match the review. B1 and B2 are closed; B3–B9 are the open set.
- **Decisions:**
  - D-107: plan rev. 2, S3 Singapore with Object Lock, R1+R2 OpenPGP, 35-day and 12-month retention, the dedicated
    `pintar_backup` credential.
  - D-107(c) A7: `pintar_backup` has `pg_read_all_data` with BYPASSRLS and can read every tenant. It is kept out of the
    app runtime and never logged.
  - D-108: the `supautils` residual. The role can create or drop allow-listed extensions. `default_transaction_read_only`
    is a safety default, not a boundary. Extension-baseline checks on every backup and restore (D-108(c)); see
    `docs/recovery/extension-baseline.json`.
  - D-109: migration 162 for staging only; escrow-first minting; no R1-only production bundles.
  - D-110: school data ownership, NO HOSTAGE DATA, a principle and not a 4.0 feature.
  - D-111: checkpoint GREEN to proceed to owner infrastructure, "not #150 PASS, not PRODUCTION READY".
- **Migration:** `20261125100000_a_backup_reads_everything_and_writes_nothing.sql`.
- **Tests:** DR-S01..S17, DR-D01..D03 (`selftest/dr150*.test.ts`).
- **Register:** CR-66 (closure register).

---

## 11. INCIDENT: the L4 example-workbook answer-key exposure

### 11.1 What was exposed
- **The file:** `public/contoh/contoh-buku-kerja-pintar.xlsx` (116,851 bytes), served at the URL path
  `/contoh/contoh-buku-kerja-pintar.xlsx`.
- **Its contents:** PINTAR's live SD 5 Matematika Bab 1 workbook (source `docs/onboarding/konten/SD5-Matematika-Bab1.xlsx`),
  unchanged except that the course title is prefixed «Contoh — » (`bukuKerjaContoh`, `src/lib/contoh-buku-kerja.ts`).
  It contained the chapter's Pemetaan Awal and Uji Penguasaan questions with their answer keys and reasons
  (`docs/reports/PINTAR-4.0-CLOSURE-L4-2026-10-08.md` §7, finding 1, MAJOR).
- **The link:** offered as «Contoh» beside the blank template in Studio's upload panel
  (`src/components/unggah/PanelUnggah.tsx`).
- **Found by:** the Second Eye's L4 review, finding 1.

### 11.2 Root cause
D-127 Q9 asked for "a separate, clearly marked example workbook … if canonically suitable". Commit **9859efa**
(08:31 UTC, 8 Oct) built it from the live chapter rather than from example-only questions. It placed the file under
`public/`, which Next.js serves as a static file outside every database read path and so outside RLS. No check existed
that `public/` holds no data file. L4-C01 then asserted that the example **was** offered (L4 report §2, "FAIL (no
example) → PASS").

### 11.3 Who could reach it: what the code shows
- **The proxy runs on this path.** `src/proxy.ts` `config.matcher` excludes only `_next/static`, `_next/image`,
  `favicon.ico`, `brand/` and `fonts/`. `/contoh/…` is not excluded, so the proxy runs on it. `/contoh/…` is not in
  `PUBLIC_PATHS` or `PUBLIC_PREFIXES`.
- **Anonymous visitors** were redirected to `/masuk?lanjut=/contoh/…`, not served the file. This is the same mechanism
  F01-R08 proves for `/konfigurasi` and `/studio`. **UNVERIFIED at runtime for `/contoh/` itself:** no test or probe
  requested that path.
- **Any signed-in session** passed the proxy's authentication and received the file, with no role, school or capability
  check. That includes STUDENT accounts and class-card sessions, at any school on the deployment. Exceptions in the
  proxy:
  - setup REQUIRED (sent to activation);
  - a TERKUNCI or BERAKHIR session;
  - a maintenance stop;
  - a staff browser that had not answered «Komputer siapa ini?», whose page navigation is sent to `/perangkat` first.
- **The link** was in Studio's upload panel, visible to CAN_DRAFT staff. The URL itself is fixed and guessable, so any
  signed-in learner who learned it could fetch it.
- **Not established:** whether anyone actually downloaded it. Vercel access logs were not read, so this is
  **UNVERIFIED**. Who held staging accounts in the window is also **UNVERIFIED**.

### 11.4 Environments and time window
- **Staging (main → staging):**
  - **Start:** `origin/main` moved to **e7fb612 at 10:50:38 UTC on 8 Oct**, then e1f8736 at 10:54:25. Both trees contain
    `public/contoh/contoh-buku-kerja-pintar.xlsx` (git reflog of `origin/main`; `git ls-tree`).
  - **End:** the fix reached main with **dab5c12 at 13:10:45 UTC**. Staging was confirmed serving dab5c12 by
    environment-facts 37782586725 at about 13:13 UTC (handoff facts).
  - **Window:** about 10:50 to about 13:10 UTC, about 2 h 20 min, plus deploy latency. **UNVERIFIED:** the exact time
    staging's deployment of e7fb612 went live (L4 report §7 cites facts 37766343961 showing staging on e7fb612).
- **Branch pushes:** the working branch `claude/awesome-rubin-bqxp6p` carried the file from 08:31:43 UTC (9859efa)
  until c124e92 at 11:16:08. `vercel.json` sets `git.deploymentEnabled` to `main` only, so Git pushes to that branch
  create no Vercel deployment. **UNVERIFIED:** Vercel dashboard settings beyond `vercel.json`.
- **Production: never had it.** Production runs 5b5b68d (handoff facts), and `git merge-base --is-ancestor 9859efa
  5b5b68d` is false.
- **Previous staging deployments:** **UNVERIFIED** whether Vercel's immutable per-deployment URLs for the e7fb612 and
  e1f8736 builds still serve the file. They would carry the same proxy, so a sign-in would still be needed.

### 11.5 Fix commits
- **c124e92** (11:16 UTC; "L4 Second Eye findings 1, 2, 4"):
  - moves the file out of `public/` (first to `docs/onboarding/konten/`);
  - removes the link and import from `PanelUnggah.tsx` (5 lines);
  - documents the withholding in `src/lib/contoh-buku-kerja.ts`;
  - extends L4-C01.
- **dab5c12** (11:43 UTC commit, on main 13:10): moves the build to `docs/onboarding/contoh/contoh-buku-kerja-pintar.xlsx`
  (`HASIL_CONTOH`), apart from the chapters PENUTUPAN-M04 reads. M04 had failed locally reading it as a chapter (L4
  report §9).
- **Report and decision:** 6d0eac7 (L4 report §7). The owner's Q9 is settled under **D-135(e)**: "stays withheld (it
  carries live answer keys; an example-only set is content work, not a ruling)". D-136 records L4 GREEN on dab5c12.
- `git log -- public/contoh src/lib/contoh-buku-kerja.ts src/components/unggah/PanelUnggah.tsx` lists dab5c12, c124e92
  and 9859efa (plus earlier unrelated panel commits). **e7fb612 itself touches none of these paths**
  (`git show e7fb612 --stat`: `audit/journey.mjs`, two selftests, `src/app/konfigurasi/page.tsx`,
  `src/components/koleksi/halaman.ts`). It is the first commit on **main** that carried 9859efa's file.

### 11.6 Regression test L4-C01 (`selftest/l4.test.ts`)
L4-C01 asserts:
1. no file under `public/` matches `\.(xlsx|xlsm|xls|csv|json)$`, case-insensitive;
2. the code of `src/components/unggah/PanelUnggah.tsx`, with comments stripped, contains no `contoh-buku-kerja`,
   `BERKAS_CONTOH` or `/contoh/`;
3. the kept build exists at `docs/onboarding/contoh/…`, is byte-identical to `bukuKerjaContoh(SUMBER_CONTOH)`, is
   accepted by the importer's reader and converter as one course with lessons, and has a title starting «Contoh — »;
4. the import path (`unggah-kontrak.ts`, `xlsx.ts`, `studio/actions.ts`) has no special case for the example.

**What L4-C01 does not assert:**
- other extensions under `public/`, for example `.pdf`, `.ods`, `.xlsb`, `.zip` or `.txt`;
- links from any component other than `PanelUnggah.tsx`;
- the proxy matcher's exemption list.

### 11.7 Remaining concerns (facts, not judgements)
- **The withheld build is still committed** at `docs/onboarding/contoh/contoh-buku-kerja-pintar.xlsx`. L4-C01 requires
  it to exist.
- **The source workbooks with keys are committed** in `docs/onboarding/konten/`: 20 workbooks (`SD5-Matematika-Bab1..9.xlsx`,
  `SMA10-Matematika-Bab1..7.xlsx`, `SMA11-Geografi-Bab1..4.xlsx`), with their `*.paket.json` and `*-miskonsepsi.csv`.
  **UNVERIFIED:** that every one carries keys; only Bab 1's package was counted. For example, `SD5-Matematika-Bab1.paket.json` holds 124
  `is_correct` fields. Anyone with read access to the repository can read these keys. **UNVERIFIED:** repository
  visibility and collaborator list (not queried).
- **Git history keeps the served copy** at `public/contoh/contoh-buku-kerja-pintar.xlsx` in commits 9859efa, e7fb612 and
  e1f8736 (and the `docs/onboarding/konten/` copy in c124e92). Removing the current files would not remove them from
  history.
- **Static files under `public/` are protected by authentication only, never by role.** Anything later placed under
  `brand/` or `fonts/` is served anonymously.

---

## 12. Governed exception: S23q / CR-52 (D-123), UNRESOLVED

- **The step:** journey step `S23q` (`audit/journey.mjs`). The head of department opens Studio → «Bank Soal» and must be
  able to:
  - browse the school's questions;
  - **filter**;
  - review with **answer key and reason** on the bank, or by a link from it;
  - not author.
- **Status:** it FAILS in every journey run since D-123. The latest is 37775382999 on dab5c12: 75 PASS, 1 FAIL = S23q.
- **Ruling:** D-123(1) made it an A item for Daisy's S7. D-133(b) and D-135(f) keep it as a documented exception.
  **It is not a pass.** The suite is not fully green.
- **What is missing in code:** the bank (`src/app/studio/bank/page.tsx`) has no filter, and shows no key or reason.
  Building the key view must keep §5's boundary: CAN_DRAFT RLS in the school, never the canonical tenant's key.

---

## 13. Known security-relevant open items

| ID | Item | State | Source |
|---|---|---|---|
| **CR-91** | Class-card trust boundary. A card account can be activated for **any** person awaiting an account, staff included. `FormAktivasi.tsx:197-212` offers «kartu» to all. `authorize_account_activation` checks the activator and the card's shape, not the person's role or enrolment. A staff person signed in by card has their staff acts authorized through that session | **HELD** for its own ruling (D-131, D-132(n), D-133(h)). Not fixed | closure register CR-91 |
| **CR-92** | «Komputer siapa ini?» from Akun saya preselects «shared». `/perangkat` asks `sesi_periksa` without the browser's identity (`src/app/perangkat/page.tsx`). The stored choice is unaffected | Minor defect, open | CR-92; D-132(n) |
| L4 finding 6 | Peran & akses role list unbounded, a revoke form per row | Open, minor | L4 report §7 |
| CR-23 / QN2 | Leaked-password check: staging on, production not read | Record pending; Gate 8 | closure register |
| CR-66 | #150 backup/DR: NOT PASS (§10.2) | Open | closure register; D-111 |
| CR-69 | Break-glass, a second production SYSTEM_ADMIN (D-122(2)) | Not done | closure register |
| CR-67 | IP forwarding and its forwarding key (BOB-12 staging acceptance; `src/lib/auth-forwarding.ts`) | Open | closure register |
| CR-74 | Legal and data-protection gate (UU PDP, PSE, consent, retention, privacy notice), AI-tooling policy (D-112(a)) | Open | closure register |
| D-108(e) | Provider question: can `supautils` extension create/drop be restricted for `pintar_backup` | Open, non-blocking | D-108 |
| D-133(e) | SYSTEM_ADMIN may grant any school role at the database: standing, audited authority | By ruling; a change needs a new ruling | §4.4 |
| Production drift | Production app at 5b5b68d with 111 migrations against 177 on main. Every control added since is absent there, D-102 included. The production database was not read | Release gate (Gate 8 / REL items) | handoff facts |
| OD-9 | Transfer consent policy not invented in code | **UNVERIFIED** whether ruled | §9 |
| Repo-held keys | Content workbooks with keys in the repository | Fact recorded | §11.7 |
| CR-86 (presentation) | Secret-field presentation, Daisy batch 4b | Engineering landed in L1 | closure register |

Other notes:
- D-033 records accepted Advisor findings, for example SECURITY DEFINER functions callable by signed-in users.
- A restore into a new project re-opens default privileges (§3.3). Both should be re-read before production.
