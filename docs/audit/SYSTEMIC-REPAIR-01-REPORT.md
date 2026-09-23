# PINTAR 4.0 — Systemic Repair 01: status report for independent verification

- **Prepared for:** Second Eye
- **Branch:** `claude/quirky-meitner-a04smj`
- **Repository:** `yazidmanan2409/pintar40`
- **Date:** 2026-09-23
- **Defect source:** `docs/audit/SYSTEM-COHERENCE-ASSESSMENT-01.md` (the ledger, with evidence labels)
- **Design source:** `docs/audit/R1-ASSESSMENT-EVIDENCE-INTEGRITY-DESIGN.md`

**Production is unchanged.** It still serves release `46fd4452` on the database at 108/108 migrations. No deploy, migration apply, bootstrap, §3c transition or Auth change was made in this work.

The evidence labels are the ones Sauron fixed:

| label | meaning |
|---|---|
| RUNTIME CONFIRMED | observed by executing the system |
| STATIC FINDING | read from source |
| KNOWN RESIDUAL | a documented, deliberately unimplemented item |
| HARNESS DEFECT | a defect in the probe, not in PINTAR |

---

## 1. Commits to verify

| commit | content |
|---|---|
| `db4d31a` | F05-S01 prefix pin corrected; F06-S07 lexical false positive cleared (S-04) |
| `3a91e56` | **The repair.** Two migrations, app changes, the new DB suite `fable09.sql`, six plants, CI gates |
| `864dc80` | Diagnostic harness attempt 006 (probe only; no application change) |
| `f86992d` | The migration 0112 terminal probe is structural-only on a production-marked database |

New migrations (repository count 108 → **110**):

- `supabase/migrations/20261005100000_an_answer_is_never_lost_to_a_finish.sql`
- `supabase/migrations/20261005110000_a_provisioned_person_can_sign_in.sql`

---

## 2. Issues found (from the ledger)

| id | issue | ledger label | severity |
|---|---|---|---|
| F-01 | Provisioned people have no route to an Auth identity; nobody the intake creates can sign in | RUNTIME CONFIRMED | critical |
| F-02 | Anonymous `POST /auth/v1/signup` creates a permanent PINTAR person and account, with a caller-chosen name that appears in the SYSTEM_ADMIN queue | RUNTIME CONFIRMED (local) | high |
| F-03 | The intake validator accepts `role: STUDENT`; the provisioner fails the row (`role_assignments_role_check`) | RUNTIME CONFIRMED | moderate |
| F-05 | Studio reports `hasil=ok` for a write that RLS filtered to zero rows | RUNTIME CONFIRMED | moderate–high |
| F-07 | After a reload, a changed answer reuses an accepted `client_seq`, is refused, and is lost; the stale answer is scored | RUNTIME CONFIRMED | high |
| F-08 | Finish finalizes while the outbox still holds answers; pending answers are scored as unanswered | RUNTIME CONFIRMED | high |
| F-09 | No integrity observation is ever emitted; the only writer has no caller | RUNTIME CONFIRMED | moderate |
| F-10 | The certificate verification endpoint was refused by middleware at `46fd4452` | RUNTIME CONFIRMED; corrected earlier by `298b4e3d` | — |
| O-01 | A magic link opened in a different browser fails as "expired" (PKCE) | canonical status open | ruling needed |
| O-02 / V-6a | No issuance orchestration: after an eligible pass no certificate exists, and the page shows a refusal | KNOWN RESIDUAL + observed divergence | — |
| S-01 | Media authoring has no product path | STATIC FINDING; scope not established | ruling needed |
| S-02 | PREVIEW evidence class unreachable from the application | STATIC FINDING | low |
| S-03 | No product surface revokes a certificate | STATIC FINDING | ruling needed |
| P-01 | Hosted Auth `disable_signup: false` | observed configuration | high with F-02 |
| P-02 | Hosted `platform_environment = development` (§3c pending) | KNOWN | — |
| P-03 | The production deploy is not gated on CI; branch pushes run no CI | STATIC FINDING | moderate |
| S-04 | F06-S07 lexical false positive | test defect | low |
| S-05 | Local auth `site_url` `:3000` vs the CI app `:3999` | STATIC FINDING | low |

---

## 3. What was done, per issue

### R1 — F-07 and F-08: an answer is never lost to a finish

**Database** (`20261005100000_…finish.sql`):

- **`submit_response` (conflict).** A different answer at a taken `client_seq` raises SQLSTATE **`PR001`**. Its DETAIL is the server's highest `client_seq` for that item; the message is unchanged.
- **`enforce_response_write` (closed session).** A response into a FINALIZED or TERMINATED session raises **`PR002`**.
- **`record_answer` (terminal refusals).** "Continue refused", "terminated" and "not yours" raise **`PR002`**; the body is otherwise identical.
- **`finish_my_session(p_session, p_manifest jsonb default null)`.** The old one-argument signature is dropped, so no overload exists. The function:
  1. repeats idempotently: an existing result returns that result;
  2. checks every `{presented_item_id: client_seq}` in the manifest. It needs a response in *this* session with `client_seq >=` the declared value;
  3. raises **`PR006`** if any entry is unsatisfied. DETAIL lists exactly those items, and nothing is scored;
  4. if every entry is satisfied, sets the transaction-local `pintar.manifest_verified` = this session, then submits and finalizes.
- **`finalize_session` (grace).** An EXPIRED session inside `deadline + late_sync_grace_seconds` raises **`PR007`**, unless the verified-manifest marker names this very session.
- **ADR-0021.** Revoke and grant statements are issued for every recreated function in the same migration.

**Client** (`src/app/belajar/_components/ItemPlayer.tsx`, `actions.ts`, `src/lib/assessment-engine/index.ts`):

- **Outbox.** One entry per answer, under the key `pintar.outbox.<session>.<item>.<seq>`. An in-memory fallback covers storage that throws, and the legacy single-key outbox is migrated.
- **Next seq.** `max(server seq, issued seq, outbox seq) + 1`, so a reload can no longer reuse a seq (**the F-07 cause**).
- **Delivery by code.**

  | server answer | player action |
  |---|---|
  | ok | acknowledged |
  | `PR001` | renumber above DETAIL and resend (up to 4 tries) |
  | `PR002` | closed: show "session closed" and stop |
  | exception | offline |
  | anything else | held |
- **Finish.** Flushes first. If anything is offline or still held, it shows a notice and does not finish (**the F-08 cause**). Otherwise it sends the manifest; a `PR006` or `PR007` refusal keeps the session open.
- **Pause and resume** update the UI only on a server `ok`.

### F-09 — integrity observations

- `ItemPlayer` emits observations through `actions.noteIntegrity`, which calls `record_integrity_signal`. Each category is throttled to one per 10 s. The categories are:
  - `VISIBILITY_CHANGE`: `visibilitychange` to hidden;
  - `RECONNECT`: offline, then online;
  - `RAPID_OPTION_CHANGE`: three or more changes within 5 s.
- Emission failure is silent; it never blocks answering.

### V-6a / O-02 — certificate issuance

- **Player.** On a successful POST_TEST finish, it sends a fire-and-forget `fetch("/api/certificates/issue", {keepalive:true})`.
- **Certificate page.** A passed session without a sealed certificate calls `issueIfEligible` (`src/lib/sertifikat.ts`) server-side on each load, per doc 04 §7's retry clause, then re-reads the certificate.
- **Refusal page.** Shown only when there is no certificate *and* no pass.
- **Unchanged authority.** Issuance authority is still the route: `session_is_mine`, then `certificate_prepare`, then `certificate_seal`.

### F-05 — writes read back

- `src/app/studio/actions.ts`:
  - **`advanceContentAction`** pre-counts visible rows and refuses on a count mismatch; the course update must hit exactly 1 row.
  - **`freezeReleaseAction`**: each update must hit 1 row, followed by a read-back that the status is FROZEN.
  - **`confirmMappingAction`** must hit exactly 1 row.
- `src/app/mengajar/actions.ts`: the activation update must hit 1 row.
- `src/app/konfigurasi/actions.ts`: the flag upsert is read back.

### F-03 — intake learner rows

- `import_advance` is recreated from the latest source with the clause `if v_role is not null and v_role <> 'STUDENT'`. The class membership *is* the learner's authorization.

### F-01 — account activation

- **New screen `/aktivasi`** (`src/app/aktivasi/page.tsx`, `src/components/aktivasi/FormAktivasi.tsx`). It lists `persons_awaiting_account()`: people without an account, in institutions where the reader holds `CAN_PROVISION_PEOPLE`, or everywhere for a SYSTEM_ADMIN.
- **New route `/api/akun/aktivasi`.** The caller's own client asks the database first:
  - `authorize_account_activation(person, kind, email)` checks the capability in the person's institution, refuses a person who already has an account, and audits `account.activation_authorized`;
  - `authorize_new_person(name)` is SYSTEM_ADMIN-only and audited.

  Only after that does the service role call `auth.admin.createUser`:
  - **EMAIL:** `email_confirm` is set, because the administrator vouches for the address. Possession is still proven at every magic-link sign-in.
  - **CLASSROOM_CARD:** a random 10-digit card and a 6-digit PIN, shown once and never stored. The password is the existing peppered derivation.
- **Auth trigger.** `handle_new_auth_user` links `app_metadata.person_id` and activates PENDING enrolments.
- **Registry rows** are added for the three new RPCs.

### F-02 — self-provisioning refused

- **The rule.** `handle_new_auth_user` creates a person with no `person_id` only when one of these holds:
  - `app_metadata.pintar_provisioned = 'true'`;
  - fixtures are permitted;
  - the synthetic seed intent is set off production;
  - day zero: no active SYSTEM_ADMIN exists.

  Otherwise it raises **`PR010`**.
- **The design.** `app_metadata` is admin-API-only; `user_metadata`, which the signer controls, is never trusted.

### P-03 — CI gate

- **Branch CI.** `ci.yml` now runs on pushes to `claude/**`.
- **Deploy gate.** `deploy-vercel-production.yml` requires a successful `ci.yml` run on `RELEASE_SHA` before any token is used, via the GitHub API with `actions: read`.

### S-04

- Fixed in `db4d31a`.

### Tests added

- **`selftest/db/fable09.sql`**, with six tests:

  | test | proves |
  |---|---|
  | F09-R01 | `PR001` with its DETAIL; identical replay acknowledged; `PR002` into someone else's session |
  | F09-R02 | `PR006` naming exactly the missing item; no scoring on refusal; idempotent finish; `PR002` after finish |
  | F09-R03 | grace-window scoring; `PR007` ×3; the marker is session-bound; a cross-session manifest is refused |
  | F09-A01 | the F-02 refusals |
  | F09-A02 | the F-01 authorization matrix and linking |
  | F09-A03 | F-03 |
- **Six plants in the new CI gate `db-r1-gates`:** `selftest/plants/r1-1..3`, `f01-1`, `f02-1` and `f03-1`. Each removes one fix and asserts its test turns red, with the declared reason. Locally 6/6 proved their gate.
- **Manifest v59.** The migration-count pins in UX1-BRAND-02 and UX1-TUR-ORANG-01 moved 108 → 110, with written justification.
- **Selftest expectations updated:**
  - **UX1-S1-CERT-ELIGIBLE-01:** the page may ask for issuance only through `issueIfEligible`, before the pending branch, and renders no action of its own.
  - **UX1-S0-TOKEN-01:** `/aktivasi` joins the re-set surface list.
  - **F01 route inventory:** `/aktivasi` added.

---

## 4. Verification results — what is proven and what is not

### 4.1 Local

**Environment:** PostgreSQL 16, clean replay (`supabase migration up` with the pinned CLI, then seeds, then lifecycle files).

- **Migrations:** 110/110 applied; the history matches the repository.
- **DB suites:** all 186 existing tests pass (a previous run gave the same count).
- **fable09:** 6/6 green, three consecutive runs, every row rolled back.
- **Plants:** 6/6 turned their own test red, then restored the schema.
- **Full selftest:** 267 passed, 2 failed (both then diagnosed as below), 1 skipped for no network, 13 justified skips.
  - **UX1-S1-CERT-ELIGIBLE-01:** fixed afterwards.
  - **F01-R07:** needs a live Supabase and is environmental locally. **Second Eye: confirm it in CI.**
- **Typecheck, lint and production build:** clean.

### 4.2 CI

- The runs for `3a91e56` and `864dc80` were **cancelled** by later pushes (`cancel-in-progress`).
- The run for `f86992d` was **in progress** when this was written: [run 35833444600](https://github.com/yazidmanan2409/pintar40/actions/runs/35833444600).
- **CI is not yet green on any repair commit.**

### 4.3 Composed-journey probe, attempt 006, on the repaired head

[Run 35833339570](https://github.com/yazidmanan2409/pintar40/actions/runs/35833339570), job `journeys · head`, specimen `864dc80`, local stack with a real GoTrue and a real Chromium:

| journey / step | result | reading |
|---|---|---|
| J10: certificate page after finish, no further action | ✅ ISSUED, QR and verification link | **V-6a runtime-proven fixed** |
| J10: verification, tamper, revoke via RPC | ✅ | unchanged |
| J10: product surface that revokes | ❌ none | S-03, awaiting a ruling (not attempted) |
| J1b: magic link, same browser | ✅ | unchanged |
| J1b: magic link, other browser | "expired" | O-01, awaiting a ruling |
| J5: STUDENT and EDUCATOR illegal Studio moves | ✅ UI says `gagal`, state unchanged | **F-05 runtime-proven fixed** (was `hasil=ok`) |
| J5b | ❌ revision refused `CAN_DRAFT` | HARNESS DEFECT H-8 persists (specimen actor) |
| J1onboard: intake with STUDENT rows | ✅ 3/3 PROVISIONED | **F-03 runtime-proven fixed** |
| J1onboard: `/aktivasi` lists the people; route returns card and PIN; anonymous caller 401 | ✅ | |
| J1onboard: learner enrolment after activation | ❌ PENDING | **NEW-2, below** |
| J1onboard: card sign-in with the issued card and PIN | ❌ `gagal` | **NEW-2, below** |
| J1a: anonymous `/auth/v1/signup` | ❌ 200; 24 → 25 persons | **NEW-1, below: the F-02 fix does not hold at runtime** |
| J6 S2a / S2b: Finish while answers cannot sync | ✅ session stays IN_PROGRESS | **F-08 runtime-proven fixed** (S2b FINALIZED before) |
| J6 S2: outbox entry count | reads 0 | HARNESS DEFECT H-10: probe reads the legacy key `pintar.outbox.<session>`; the player now writes per-entry keys |
| J6 S1: reload, then change | not reached (click timeout) | HARNESS DEFECT H-11 (below); F-07 still unproven at runtime |
| J8: integrity signals | 0 | **unproven, not refuted**: the visibility and reconnect events live inside S1, which never ran |

### 4.4 Two new defects in my own repair (found by the probe; root causes established)

**NEW-1 · The F-02 refusal is bypassed by SQL three-valued logic.** RUNTIME CONFIRMED (probe) and reproduced locally with a plain insert.

- **Mechanism.** A connection that never set `app.seed_intent` gets `current_setting('app.seed_intent', true)` = **NULL**, not `''`. The clause `v_env is distinct from 'production' and NULL = 'synthetic'` is NULL, so `not (false or false or NULL or false)` is NULL, and `if NULL then raise` does not raise.
- **Who is affected.** GoTrue's connections never set the value, so every real sign-up passed.
- **Why the tests missed it.** `fable09` and the migration's own probe set `app.seed_intent` earlier in their session, where it reads `''`, not NULL.
- **Planned fix.**
  - Make the decision fail-closed: `coalesce(current_setting(...), '')`, and raise unless the allow-condition `is true`.
  - Add a test that runs on a **fresh connection** (a run.ts leg, like F02-C01 and F07-C01), plus a plant.

**NEW-2 · Activation cannot work through the real Auth API.** RUNTIME CONFIRMED (probe). Mechanism read from GoTrue source (`internal/api/admin.go`, `adminUserCreate`).

- **Mechanism.** GoTrue `INSERT`s the user with `app_metadata = {provider, providers}` only. It applies the caller's `app_metadata` afterwards, in a separate `UpdateAppMetaData` call. So the AFTER INSERT trigger never sees `person_id` or `pintar_provisioned`:
  - **locally**, with the fixtures marker on, it creates a *new* person, so the provisioned learner stays PENDING;
  - **on production** it would raise `PR010` and refuse every activation.
- **Why the tests missed it.** `fable09` and the migration probe insert `raw_app_meta_data` directly, which the real API never does. **This is the ledger's own pattern (a component tested in-process, the journey assumed), repeated in my own tests.**
- **Planned fix.**
  1. `authorize_account_activation` and `authorize_new_person` write a short-lived, single-use **activation grant**: lower-cased email, person, account kind and card number, expiring in minutes. For a card, the route passes the card email it generated.
  2. The trigger links at INSERT time by consuming the grant that matches `new.email`.
  3. Nothing depends on `app_metadata` timing.
  4. The card sign-in failure is re-measured after this fix. It may be downstream of the mis-linked person. Not yet proven either way.

### 4.5 Harness defects, new

- **H-10:** the outbox key read is outdated (see J6 S2).
- **H-11:** J6 S1 waits for `button.pin-op` on a POST_TEST that cannot start. S2a/S2b now *correctly* leave the PRE_TEST IN_PROGRESS, so S1 must first close the PRE_TEST. Suspected; confirm on the next attempt.

---

## 5. Done / not done

**Done and runtime-proven by the probe on the repaired head:**
- V-6a (auto-issuance);
- F-05 (Studio refusals shown);
- F-03 (STUDENT rows provision);
- F-08 (Finish never finalizes over pending work: S2a, S2b).

**Done, proven by DB tests and plants only (still needs a runtime journey):**
- R1 codes and manifest and grace (F09-R01..R03);
- F-07 client renumbering (needs J6 S1 after H-11);
- F-09 emission (needs J8 after H-11);
- P-03 CI gate (proven when the first deploy runs through it).

**Implemented but failing at runtime; fix designed, not yet applied:**
- **F-02 → NEW-1**;
- **F-01 → NEW-2**.

**Not attempted (need rulings or are out of scope):**
- **O-01** cross-device magic link: a `token_hash` flow was blocked as security-weakening. User or Sauron decision.
- **S-03** certificate revocation surface. Ruling.
- **S-01** media upload scope. Ruling.
- **S-02** PREVIEW evidence class. Low.
- **S-05** local `config.toml` origins and `enable_signup`: blocked as a shared-resource edit. User decision.
- **P-01** hosted `disable_signup: true`: a production Auth change, pending the go-ahead. It is also what stops public sign-ups outright, independent of NEW-1.
- **P-02 / §3b / §3c**: Gladys bootstrap and the environment transition. Not touched.

---

## 6. What is next, in order

1. **Fix NEW-1** (fail-closed trigger) and **NEW-2** (activation grant). Add a fresh-connection test for each, and plants.
2. **Fix H-10 and H-11** in the harness, then re-run the probe. The pass condition for sign-off:
   - **J1a:** refused, counts unchanged;
   - **J1onboard:** learner ACTIVE, card sign-in lands in `/belajar`, teacher magic link works;
   - **J6 S1:** the changed answer is authoritative;
   - **J8:** at least one signal.
3. **CI fully green** on the resulting commit, including the `db-r1-gates` red-case job.
4. **Production, only after steps 1–3,** via the existing gated workflows:
   1. apply the 2 migrations (history 110/110; readiness 17/17; standing assertions);
   2. deploy that SHA to Vercel (the CI gate verifies it first);
   3. set hosted `disable_signup: true`.
5. **Then §3b** (Gladys bootstrap; her Auth identity already exists, so neither NEW-1 nor NEW-2 affects her), **§3c**, and Gladys's real sign-in.

---

## 7. How to check this independently

```bash
git fetch origin claude/quirky-meitner-a04smj && git checkout 3a91e56   # the repair
git diff db4d31a 3a91e56 --stat

# clean replay + all DB suites against a scratch database
supabase migration up --db-url "$DB" --include-all
for s in 00_local_fixtures synthetic learning_cycle official_bootstrap human_evaluation; do
  psql -v ON_ERROR_STOP=1 -1 -f supabase/seed/$s.sql "$DB"; done
for f in selftest/db/fable0*.sql; do psql -v ON_ERROR_STOP=1 -1 -f "$f" "$DB"; done
psql -At -c "select * from selftest.run_fable09()" "$DB"

# the plants for this repair
node scripts/dev/plants.mjs run --gate=db-r1-gates --db-url="$DB"

# NEW-1 reproduction (expect a refusal; on 3a91e56 the insert SUCCEEDS)
psql "$DB" -c "begin; update public.platform_environment set local_fixtures_enabled=false;
  insert into auth.users (id,email) values (gen_random_uuid(),'x@contoh.invalid'); rollback;"
```

The ledger's attack prompts still apply to this repair. In particular, NEW-1 and NEW-2 were caught only because the probe drove a real GoTrue. **Treat any claim in §3 that has no runtime row in §4.3 as unproven.**

---

## Addendum A — Second Eye ruling, Priorities 0–5 (2026-09-23)

### P0 — hosted `disable_signup: true` — DONE, verified

- Workflow `configure-supabase-auth.yml`, attempt 004, commit `5381758`, [run 35834922821](https://github.com/yazidmanan2409/pintar40/actions/runs/35834922821).
- One PATCH carries `disable_signup: true`, with `site_url` and `uri_allow_list` re-sent unchanged.
- The independent read-back logged:

  ```
  site_url AFTER:       'https://app.pintarselalu.com'
  uri_allow_list AFTER: 'https://app.pintarselalu.com/auth/callback*'
  disable_signup AFTER: True
  read-back matches the canonical production configuration exactly
  ```

- The functional check against `/auth/callback` passed.
- Nothing else was touched: no migration, no deploy, no bootstrap.

### P1 — NEW-1 — fixed

- **The fix.** `handle_new_auth_user` decides fail-closed: every term is NULL-safe (`coalesce(current_setting('app.seed_intent', true), '')`), and the refusal fires unless the allow-condition `is true`.
- **The test: `F09-C01`** (db runner, a run.ts leg). The id `F02-C01` was already taken by the INV-28 concurrency test. The leg:
  - uses fresh psql connections that never touch the setting;
  - asserts the setting reads NULL there;
  - asserts an insert shaped as GoTrue makes it is refused with `PR010`;
  - control: the same shape is admitted when a live activation grant names the address.
- **Plant.** `selftest/plants/f02-2-fresh.sql` restores NEW-1. A new `db-r1-gates` CI step requires `F09-C01` to go green, then red with "NEW-1 is open", then green again.
- **Locally:** green on the fix, red on the plant.

### P2 — NEW-2 — fixed

- **The table.** `account_activation_grants` holds a single-use, 10-minute binding of a lower-cased email to a person (or, for `authorize_new_person`, to a name), with kind and card number. RLS is on, and no client role holds a grant.
- **Who writes it.** Only `authorize_account_activation(person, kind, email, card)` and `authorize_new_person(name, email)` write it, after they decide and audit.
- **Who consumes it.** `handle_new_auth_user` consumes the live grant matching `new.email` at INSERT time. Nothing depends on `app_metadata` timing.
- **Test `F09-C02`** (app runner, CI local stack):
  - An institution administrator activates a provisioned learner (card) and a provisioned teacher (email) through `POST /api/akun/aktivasi`, and the real GoTrue creates both identities. The fixtures marker is off.
  - Asserted: the identities are linked and no second person exists; the enrolment is ACTIVE; each grant is consumed once; the card and PIN sign in and reach `/belajar` as the learner; a second activation gets 403; an anonymous caller gets 401.
  - Setup and read-back go through the database owner, a declared exception to that runner's black-box rule.
- **Runtime evidence, probe attempt 007** ([run 35836761727](https://github.com/yazidmanan2409/pintar40/actions/runs/35836761727), specimen `b73f20d`, same SQL as the final set):
  - J1a sign-up refused (500), counts `24|24|24 → 24|24|24`, no session;
  - activation by card and email ok;
  - learner enrolment `PENDING → ACTIVE`;
  - accounts `learner=1 teacher=1`, no second person;
  - the teacher's magic link landed on `/` under a session.

### P3 — harness

| id | defect | fix |
|---|---|---|
| H-10 | the probe read the legacy single-key outbox | counts per-entry keys; attempt 007 read `outbox entries=4` as expected |
| H-11 | S1 could not start while the PRE_TEST correctly stayed open | new step S2c restores sync and finishes the PRE_TEST |
| H-12 | "1 response" counted by splitting on spaces, and the answer JSON contains a space | counts by SQL |
| H-6 (again) | the hand-encoded card sign-in answered `gagal` in 007 | now driven through the real `/masuk` card form in a browser |
| H-13 | S2c in 007 pressed Finish while the player had reopened at item 1, so Finish was not on screen | steps to the end first. (007 observed all 5 answers delivered and the outbox empty; only Finish was not reached.) |

### Migration history — disclosed for review

The final set has 111 files:

- `20261005100000` unchanged since `3a91e56`;
- `20261005110000` **byte-identical to `5381758`**;
- **`20261005120000_activation_is_granted_not_inferred.sql`**, the NEW-1/NEW-2 repair.

`20261005110000` was edited after first push twice:

- in `f86992d`: the structural-only probe on production-marked databases;
- in `b73f20d`: the repair edited in place.

CI's upgrade-path job ("every previously applied migration is byte-identical in HEAD") correctly went red on `b73f20d` ([run 35836761670](https://github.com/yazidmanan2409/pintar40/actions/runs/35836761670)).

That job compares HEAD with the **previous push**. My corrections therefore changed the migration set in three consecutive pushes:

| commit | change |
|---|---|
| `1bc2900` | split |
| `ce41301` | reverted to `b73f20d`'s set |
| `c99535d` | final split |

Each of those reads as an edit once. The commit carrying this addendum changes no migration. It is the first commit where that rule can pass without any change to the rule.

None of these migrations was ever applied to a persistent database: hosted production is at 108.

### P4 / P5 — pending at the time of writing

- **P4:** probe attempt 008, specimen `c99535d`. Its code is identical to this commit, which changes only this document.
- **P5:** CI on this commit.

Both results are reported with run ids when complete. The hard gate is unchanged: no hosted migration, no deploy and no §3b/§3c until Second Eye re-verifies.
