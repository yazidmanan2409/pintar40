READY FOR GATE: CI #249 (run 36785565966) green on cf7dd878ec9a81f2fc18f906dacefeee717c0ed1

# Bob → coordinator: BOB-26 (Gate 3: activation and password sign-in), with D-077 and D-079's additions

- **SHA:** `cf7dd87`, with `main` `28d3015` merged in (DAISY-19 and BOB-42 both on `main`).
- **Gated but held from `main`,** per the board: BOB-26 and DAISY-20 land in one joint gate. Daisy merges this SHA; then one CI, one audit and one fast-forward.
- **Contract:** `docs/coordination/handover/BOB-26-CONTRACT.md`, published before the build (`8b3e3d5`), accepted with two corrections, and kept to. **Correction (a) is done:** the templates are `src/components/email/identitas.ts` and import DAISY-19's frame; the data shapes stay in `src/lib/email/identitas.ts`; nothing is copied. **Correction (b):** this hand-off is for the joint gate. **One change of mine, named at its top:** the code check's door is `/aktifkan/periksa`, not `/aktifkan/verifikasi`, because INV-38 keeps *verifikasi* for the one certificate route (F04-S01 caught it).
- **Migration:** 133, `20261030100000_a_person_activates_their_own_account.sql`.
- **Manifest:** v130 with 464 ids. That is 16 new: F18-N01..N05, P01, S01, L01, I01, A01, and BOB26-A01..A04, K01, S01. v129 is `gate/bob42`'s.
- **D-060:** stated below. Nothing here touches a metric or the engine.

## CHANGED

**Signed out: three doors,** each POST-only, same-origin, rewritten to a handler under `src/app/api/` (the card route's shape) and declared in `public_surface_registry`. The decisions are in `src/lib/aktivasi.ts`, with their tools passed in.
- **`POST /aktifkan/kode`** asks for a code.
  - The answer is the same for every well-formed address.
  - Only an existing EMAIL account with set-up REQUIRED (`activation_code_target`) is sent a code, issued by Auth (`generate_link`), after the answer has gone (`after()`).
  - The limits are asked first (`email_send_would_allow`, read-only), because issuing a code replaces the one already in the person's inbox.
  - No Auth user is ever made.
- **`POST /aktifkan/periksa`** checks the code.
  - The code is read as digits, so «482 913» = «482913».
  - It is counted per address (BOB-24's CODE_VERIFY, keyed by the address's HMAC whether or not it exists), then Auth's `verifyOtp`. A match signs in to `/aktifkan`.
  - One code, `KODE_TIDAK_COCOK`, for wrong, expired, used or nobody's.
- **`POST /masuk/password`** signs in with an email **or** a username.
  - The name resolves on the server only (`signin_resolve`).
  - It is counted per account (the new PASSWORD_SIGNIN scope), and per typed name when the name resolves to nothing.
  - An unknown name makes the same call to Auth (as a reserved non-address) and waits for the same floor: every failure is `MASUK_TIDAK_COCOK`, no sooner than 800 ms.

**Signed in: the wizard,** `/api/aktifkan/{keadaan,username,password,pin,nama,selesai}`. The order is D-054(b)'s plus D-077's name step: username → password → PIN → name → finish.
- **Username and PIN** are BOB-24's functions and codes, unchanged.
- **Password:**
  - It is checked against the canonical rules, then by Auth.
  - It is written only through a **single-use, one-minute permit** (`password_write_permit`, service-role), then Auth's admin endpoint.
  - Auth ends every session when its admin endpoint sets a password, so the route signs the person back in with the new one.
- **Name (D-077(1)):** `confirm_my_name`. «Sudah benar» keeps the name, or one «Ubah nama» corrects it first. It is audited (old, new, who) and closed afterwards.
- **Finish:**
  - `complete_my_setup` now needs all four steps; `SETUP_BELUM_LENGKAP` names what is missing.
  - Staff (C17) are sent the card by email, through BOB-25.
  - If the limits or the host refuse it, the answer is `BELUM_TERKIRIM`, the set-up still completes, and `POST /api/akun/kartu/kirim` sends it later (D-079).
- **`GET /api/akun/kartu`:** the current name, the PINTAR ID, `/id/<ID>` for the QR, and the role and school read now (D-059). Staff only.

**The proxy holds a set-up REQUIRED session** (`src/lib/penahan-aktivasi.ts`).
- Every page redirects to `/aktifkan`, and every `/api/` route but `/api/aktifkan/*` answers `403 setup_required`.
- `/keluar` and the public paths stay open.
- Class cards are never asked; they have no set-up.
- A settled state (COMPLETE, NOT_APPLICABLE) is remembered in an httpOnly cookie for that Auth user, signed with a key derived from the pepper under its own label. So the database is asked only until the person has finished.
- Unreadable, the state holds nothing: the hold is a journey, not an authority.

**D-077, the name is governed data.**
- **(2)** `revoke update (display_name) on persons from authenticated`. `photo_path` keeps its grant. F01-T17 is restated in the same change.
- **(3)** `correct_person_name(p_person, p_name, p_reason)`: the platform admin only, with a reason, audited (from, to, reason). Everyone else gets 42501. It is an RPC, as `correct_username` is; no page.
- **(4)** `import_preview_names(p_job, p_after, p_limit)`: every name of an import, paged, for the job's own school admin. `import_preview` returned counts only.
- Certificates keep `name_as_issued` (INV-30). Nothing touches them, and there is no reissue.

**The Gate 0 password finding, closed in the database.**
- A trigger on `auth.users` (`pintar_password_write_guard`) refuses any new password hash that has no live permit, consuming the permit when there is one.
- So Auth's own `PUT /auth/v1/user` from a signed-in session fails, including a first password and a recovery session. This does not depend on Auth's settings. The settings below are a second lock.
- Clearing a hash, or leaving it unchanged, passes. The one other hash write in Auth v2.196, re-encryption on sign-in, happens only with database encryption, which Supabase does not use.

**D-079's addendum: one canonical setting,** `supabase/auth-identitas.json`:
- code length 6 and `mailer_otp_exp` 600;
- password minimum 8, no required kinds, leaked-password check on (**D-082(a), approved as proposed**);
- reauthentication and current-password on;
- TOTP enrolment off.

From that one file:
- the app reads the validity and the rules (`src/lib/pengaturan-auth.ts`), and the code email says «berlaku 10 menit» from there;
- `supabase/config.toml` mirrors it (otp_expiry 3600 → 600, minimum_password_length 6 → 8, secure_password_change on), and BOB26-S01 fails on drift;
- `staging.yml` writes the file's keys to staging (a new step, and the file is added to its paths trigger), then reads them back and asserts them. The leaked-password check is written **on its own and only if the plan provides it** (staging is Pro, GATE-0-FACTS). A refusal leaves it off with a warning, and the read-back then reports it rather than failing;
- `identity-facts.yml` compares each project with the file (`scripts/auth-identitas-banding.py`). Staging **fails** on drift. Production fails only once the file's `production_applied` is true, which the release commit sets at C-11; until then it reports.

**The emails** are sent through DAISY-19's wired frame (`src/components/email/bingkai.ts`), which is imported, never copied. The templates are `src/components/email/identitas.ts`, beside the frame, for DAISY-20 to replace; the data shapes are `src/lib/email/identitas.ts`.

**Also:**
- the magic link stays on `/masuk` behind `TAUTAN_MASUK_CADANGAN` (on) until C14;
- the D2 comment is updated per D-057(d);
- L2-KONTRAK-01 is extended, not weakened: Gate 3's doors make no identity, read no account table themselves, send after answering, and give an unknown name Auth's path and the floor;
- the fixture's email accounts that have passwords are seeded as activated (`supabase/seed/activated_staff.sql`, local and CI only, behind `synthetic_fixtures_permitted()`). Under Gate 3 a password means activation, and without this the hold would rightly stop every staff test at `/aktifkan`.

## PROOF

**The Ironman test** (D-077's seven steps):
- **1.** F18-N02 registers «Bagas Saputro» through `authorize_new_person`, then corrects and confirms it as «Bagas Saputra», audited. BOB26-A01 does the same through the real routes, starting from «Orang baru».
- **2.** Direct database updates are refused:
  - F18-N01: Bagas (activated), a Murid on class card 7001 and a Guru each run `UPDATE persons SET display_name='Ironman'` on their own row, as themselves. All three are refused (42501).
  - BOB26-A03: the Guru's PostgREST `PATCH` is refused, and the photo stays theirs.
- **3.** The UI offers no unrestricted edit: the wizard's name step closes after confirmation (`NAMA_SUDAH_DIKONFIRMASI`) and after set-up.
- **4.** F18-N03: the platform admin's correction succeeds and is audited. A school admin, a Guru, the person, a class card and a learner are refused.
- **5.** F18-N04: a certificate issued before the correction still reads «Bagas Saputra», and its row is byte-identical.
- **6.** F18-N05 and BOB26-A01: the card data and the wizard's state read the corrected name.
- **7.** F18-N04: a certificate issued after the correction reads «Bagas Saputra Wijaya».

**The row's acceptance:**
- **A provisioned address gets a code, then the wizard; an unknown one gets the identical screen, no email and no Auth user** (BOB26-A01, BOB26-A02). BOB26-A02 also sends a finished Guru's address and a class card's: same 200, sink empty, the `auth.users` count unchanged.
- **Wrong or expired codes are stopped by counters:** BOB26-A02 (`KODE_TUNGGU`, Retry-After) and F18-L01.
- **Username collision and the password policy:** BOB26-A01 (`USERNAME_TAKEN`, `USERNAME_RESERVED`, `PASSWORD_LEMAH`/PANJANG under the canonical minimum).
- **Sign-in by email and by username; a wrong password gives the same error and similar timing:**
  - BOB26-A01 signs in by both.
  - BOB26-A02: a wrong password and an unknown username are the one `401 MASUK_TIDAK_COCOK`, each ≥ 800 ms, with medians 810 ms and 809 ms on the rig.
  - A sixth try is held (`MASUK_TUNGGU`).
- **Existing staff transition without new persons or accounts:**
  - every existing EMAIL account is REQUIRED (BOB-24's backfill) and is held to the wizard;
  - BOB26-A01 asserts one person and one account after the journey;
  - no migration creates a person.
- **The code with or without spaces:** BOB26-A01 types «482 913». BOB26-K01 also reads «482-913».
- **Card tests, D-010 homes and school isolation stay green:**
  - the whole suite, below;
  - BOB26-A01 lands on `/mengajar`;
  - F09-C02 makes a new class card and signs it in under the Gate 3 policy, and card 7001 signs in (BOB-12's tests).
- **Gate 0 findings:**
  - BOB26-A03: a signed-in session's own password change through Auth is refused, and the new password does not sign in.
  - F18-P01: Auth's own role writing a hash without a permit is refused.
  - TOTP enrolment is off in the canonical file and in config.toml. `identity-facts.yml` reads both settings back.
- **D-079:**
  - BOB26-A01: the code email says «berlaku 10 menit».
  - BOB26-S01: with `mailer_otp_exp` 600, 900 and 300, the email says 10, 15 and 5 minutes, and no validity is typed in src.
  - BOB26-A04: a card the limits refuse is `BELUM_TERKIRIM`, the set-up completes, and Akun saya sends it once the limit passes.

**Red on today's code, green on this head.** The same probe (`b26red.sh`) ran on rigs built fresh from `main` `a3a146a` and from this head:

| | `main` `a3a146a` | this head |
|---|---|---|
| Murid (card 7001), Guru and a bootstrap Guru each `UPDATE … display_name='Ironman'` on their own row | all three renamed (1 row each) | all three refused (42501) |
| A signed-in session's `PUT /auth/v1/user {password}` | 200, and the new password signs in | 500, and the new password is refused (400) |
| The Guru's PostgREST `PATCH persons display_name=Ironman` | 204, and the name reads «Ironman» | 403, and the name is unchanged |
| Auth's code validity and password minimum | 3600 s, 6 | 600 s, 8 |

The routes, the wizard and the hold do not exist on `main`, so BOB26-A01, A02 and A04 have nothing to answer them there.

**Plants:** `db-bob26-gates`, 7 of 7, each turning its own F18 test red and coming back:
- the grant restored;
- the guard dropped;
- a code for a finished account;
- completion without the name;
- anyone correcting a name;
- the name step never closing;
- another school reading the names.

The plant harness's schema digest now also covers column grants and triggers (public and auth). Before this, the first two plants read as "the schema is unchanged". That is stricter, never weaker.

**Local proof, on this head.** For the first time the suite ran against a **real Auth server** here:
- the rig: Supabase Auth v2.196.0, the CLI's own version, built from source; PostgREST 16.2; a gateway; the Mailpit sink;
- on fresh databases where Auth's own migrations made the auth schema, then the repository's migrations through the Supabase CLI and the seeds.

Results:
- **Rig:** 459 passed, 0 skipped. The 4 failures are the four tests that need Storage, which the rig does not run (F01-R03, BOB11-A01, BOB11-A02, BOB20-A01). They fail identically on `main`.
- **CI-shaped databases** (the shim, as before):
  - full suite 427 passed, 0 failed (one skip, UX1-PIMPINAN-AKSES-01, for want of the network facility, which the shim does not have; 36 local-only justified skips);
  - plants 140/140 proved their gate;
  - every db red-case gate in `ci.yml` (23, `db-bob26-gates` included), each on its own stack: 23/23 green.

## CI
**CI #249 (run 36785565966) on `cf7dd878ec9a81f2fc18f906dacefeee717c0ed1`: success, 34/34 jobs green.** The coordinator dispatched it; I dispatched none.
- **Strict suite (local stack):** 464 passed, 0 failed, 0 skipped, 0 contract problems → GREEN. That includes F18-N01..A01, BOB26-A01..A04, K01 and S01. BOB26-A02's failure medians on the runner were 806 ms for a wrong password and 805 ms for an unknown name.
- **`db-bob26-gates`:** 8/8 plants proved their gate.
- **The two runs before it, for the record:**
  - CI #247 (36731643740, `d6710f3`) was 32/34. Its red case `db-bob26-gates` failed on F18-P01's control, because the real stack refuses `SET ROLE supabase_auth_admin` to the selftest login. `cf7dd87` fixes the helper: it takes Auth's role only when it may and that role can write `auth.users`. The guard is a trigger and fires either way.
  - CI #248 (36734198316, `cf7dd87`) never got a runner (the Actions budget) and proves nothing.
- **Local proof and the heads:** the local proof above ran on `d6710f3`. `cf7dd87` changes only `fable18.sql`'s helper, and after it `db-bob26-gates` was re-proven 8/8 on the shim and on the rig.

## CONTRACT
- `BOB-26-CONTRACT.md` as published, with the one named change.
- The typed contract is in `src/lib/aktivasi-kontrak.ts`: codes, statuses, response types, readers, `HALAMAN_AKTIVASI` and `TAUTAN_MASUK_CADANGAN`.
- New RPCs:
  - for the caller's own identity: `confirm_my_name`, `my_setup_progress`, `my_identity_card` (LEARNER class, each reaching `current_person_id`);
  - STAFF: `correct_person_name` (SYSTEM_ADMIN) and `import_preview_names` (CAN_PROVISION_PEOPLE);
  - service-role only: `activation_code_target`, `signin_resolve`, `email_resend_seconds`, `email_send_would_allow`, `password_write_permit`.
- `identity_attempt` and `identity_attempt_settle` take the PASSWORD_SIGNIN scope as well.
- `complete_my_setup` needs the password and the name as well.

## MIGRATIONS
**133, `20261030100000`:**
- one table, `password_write_permits` (RLS on, no policy, no grant);
- two columns on `account_setup`;
- the functions above;
- the trigger on `auth.users`;
- the revoked column grant;
- six `public_surface_registry` rows.

Nothing is backfilled: existing accounts stay REQUIRED, with the new columns empty.

## RESTATED TESTS (named)
- **F01-T17:** a learner's own name update is now refused; the photo stays theirs (D-077(2)).
- **F16-S01:** a username and a PIN alone no longer complete a set-up; with the password (through the permit) and the confirmed name, it completes.
- **F05-S01:** the anonymous path list gains `/masuk/password`, `/aktifkan`, `/aktifkan/kode` and `/aktifkan/periksa`. It now also requires each POST door to be declared with its handler as its child.
- **F05-T21, and `kesehatan-skema.json` for F01-T13 and BOB19-A01:** 5 public surfaces and 10 addresses, where there were 2 and 4.
- **DAISY-13-KARTU-01:** its number words run to ten, and the surface list may be a series. The check is unchanged.
- **UX1-BRAND-02, UX1-TUR-ORANG-01:** the migration count moves 132 → 133, with the reason written beside it.
- **L2-KONTRAK-01:** extended (above).

## COPY (FOR DAISY)
- **The code and card emails' words are placeholders** in `src/components/email/identitas.ts`, for DAISY-20 to replace:
  - the code email is her own prototype's sample («Kode aktivasi akun PINTAR Anda», «Kode ini berlaku {N} menit dan hanya bisa dipakai sekali.»);
  - the card email is «Kartu PINTAR Anda», «Halo, {nama}.», rows «Nama» and «PINTAR ID», button «Buka Akun saya», and the reason line.
- **The health card's two public-surface sentences** (`config.kesehatan.cek.anon_public_surface` and `.anon_reachable_http_paths`) now name five surfaces and ten addresses. The words are mine, written in the existing pattern; they are Daisy's to confirm, as BOB-12's were.
- **The wizard page is DAISY-20's.** It lives at `/aktifkan`, and the proxy already holds unfinished sessions there.

## D-060
- **Metric catalogue: unchanged.** No `calc_*` body, no metric source view and no readiness rule changes. Identity, set-up and names are not metric sources. Certificates are untouched: `name_as_issued` stays sealed.
- **Engine: unchanged.** Nothing grades, assembles or finalizes.

## FOR THE COORDINATOR
1. **The joint gate (as ruled):** BOB-26 is held from `main` until DAISY-20's `/aktifkan` merges with it.
   - The hold ships with BOB-26, and staging's three EMAIL staff are REQUIRED (BOB-24's backfill), so they walk the wizard once after the fast-forward.
   - The journey harness and audit job B sign in as those staff, so they walk it too.
2. **Staging's Auth settings change on merge.** `staging.yml` runs on the migration and writes the canonical keys.
   - After that, staging's magic link and codes are valid 10 minutes.
   - `security_update_password_require_current_password` is written by name, as GATE-0-FACTS read it. If the Management API refuses that key, the step fails loudly and names it.
   - No production setting is touched: `configure-supabase-auth.yml` is unchanged, and `production_applied` stays false until Yazid approves the production application at C-11.
3. **REL-08(ii) on staging:** a new class card made and signed in, and an existing one signed in, once the policy is set (your walk).
   - Local observation: Auth v2.196 does not check password strength when an admin creates a user (only on update), and card secrets are 64 hex characters in any case.
4. **Email learners are in the wizard.** An EMAIL account that belongs to a learner (not staff) is REQUIRED like any EMAIL account (BOB-24). It walks the wizard but is shown no PINTAR ID (`staf: false`) and sent no card (C17).

## QUESTIONS
None. The password policy is D-082(a).

## READY
Yes.
