# PINTAR 4.0: consolidated status (6 Nov 2026, 07:30 UTC; addendum 09:20 UTC at the end)

This update is measured against the evening update of 5 Nov (`STATUS-UPDATE-2026-11-05-PM.md`).

## At a glance

| | 5 Nov evening | Now |
|---|---|---|
| Branch head | `b4be7c37`+ | `8d951655` (W9.19), with CI and journeys running |
| `main` | `38d7e701` (P-1) | **`12d357ce`** (PR #11, the P-2 promotion) |
| Staging | migration 196, `main` 38d7e701 | migration 196, **`main` 12d357ce** |
| Production | not touched | not touched |

**Owner decisions on 6 Nov:**
- promote the branch to staging (done, P-2);
- J2.7 authorised (done, green);
- no test machine in Indonesia for now;
- «Proceed as per your proposal» for W9.19 (implemented; promotion next).

---

## 1 · Done since the last update

### 1.1 P-2: the branch promoted to staging

**PR #11 merged as `main` `12d357ce`**, after all 18 CI checks were green on the pull request.
- **No migrations:** staging stays at 196.
- **`staging.yml`:** run 42159507039, green; its first run on Node 22.

**Read-only checks, before and after:**
- **Migrations:** 196 both times.
- **The demo school:** every value identical.
- **The real schools outside the test schools:** results, official results, certificates, signals and decisions all identical.

**Since P-1, four values changed by design:** they come from the W6.8 synthetic load school and the B8 test school.

**Evidence:** `batch-8/evidence/staging-praperiksa-p2.md`, `staging-pascaperiksa-p2.md`.

### 1.2 J2.7 / W9.14: the existing-staff transition, rehearsed on staging

**Run 42163941604: 15 of 15 PASS.**

**Who:** SD Golden School GS-001's four staff (Dekan, Guru, Kepala departemen, Admin sekolah).
- Their accounts are from 2 Oct, before the new identity foundation.
- They signed in then by the old email link.
- They have been REQUIRED since the foundation.

**Each one:**
- activated by the emailed code and the wizard;
- kept the same login, account, person, PINTAR ID and roles;
- signed in again by password.

**Nothing was duplicated:** persons, accounts and logins stayed at 1516/1516/1516.

**The email link is gone:** `/masuk` no longer offers it.

**Still open:** the same rehearsal on a copy of production, including its only admin (W9.10, F-18). Production keeps offering the email link until the release.

### 1.3 W9.12: restore readiness, verified

**Restore rehearsal from `main`: run 42174482669, green.**
- **The restored copy:** passes **24 of 24** launch-readiness checks, up from 18/24 on 3 Nov.
- **Client rights:** equal to staging's, 1,931 rights.
- **The private `assets` bucket:** restored.

**Not covered:**
- Storage files (D-190);
- secrets kept outside the database;
- the Auth and SMTP settings;
- some of Supabase's own vendor tables, which the runner's older stack restores differently.

### 1.4 W9.18: the Node 22 toolchain, proven on staging

- **Proven:** `staging.yml` and the restore rehearsal both ran green on Node 22.
- **Not run:** the production deploy job runs only at the release.
- **Unchanged:** `RELEASE_SHA`.

### 1.5 W6.2: page speed, re-measured after the fix

**Journey run 42174494519**, timed from GitHub's runner in the US.

| Step | Before (5 Nov) | After (6 Nov) | Under 3 s |
|---|---|---|---|
| Konfigurasi | 3.3–3.4 s | 1.6–2.3 s | yes |
| «Laporan» | 3.5–5.0 s | 1.6–2.1 s | yes |
| A save, click to result | 3.9–4.9 s | 1.8–2.8 s | yes |
| Admin: sign-in to first screen | 4.6–5.7 s | 3.0–5.1 s | **no** |
| Teacher: sign-in to first screen | 2.4–3.2 s | 3.5–3.9 s | **no** |

**What it shows:**
- **The fix works:** no audit-trail read appears anywhere in the run.
- **What is left is distance:** the proxy asked Auth "who is this?" 348 times through IAD (US), at a median of 733 ms each. The same call through Singapore (SIN) took 16 ms.
- **The row stays OPEN.**

### 1.6 W9.19: the proxy's Auth call, implemented on the branch (`8d951655`)

**The change:** the proxy now checks the sign-in token itself (`getClaims()`) instead of calling Auth on every request.
- **Asymmetric signing key:** no call to Auth per request.
- **HS256 (shared secret):** Auth is still asked, as before, so nothing is weaker.
- **Ended, locked or under maintenance:** still the database's answer (`sesi_periksa`).

**Tests:**
- **W919-KLAIM-01:** the real client, with genuinely signed tokens. It fails against the old code.
- **W919-KLAIM-02:** the proxy never calls the old check, and still runs the session check.

**Locally:** typecheck, lint and the static suite are green. Two tests fail the same way without the change (F01-R07, BOB26-K01); they need a database or secret this environment lacks.

**Running now:** CI 42179337901 and journeys 42179347500.

### 1.7 Fixes along the way

- **CI on `d9ef8548`:** red on EFF-K02, an older test that pinned the audit read's exact wording. It was restated with the same rule (a school admin's trail is never read without naming the school); a planted unnamed read is still caught.
- **A runner fault:** one re-run, then green.
- **W6.2 and W6.8 evidence:** the US-route finding recorded:
  - the save's own database time is 11–20 ms;
  - `sesi_periksa` is 1.1 ms in the database.

---

## 2 · Open, with what each waits on

| Item | State | Waits on |
|---|---|---|
| **W6.2** U-PERF | OPEN, NOT MET: the first screen after sign-in is over 3 s from the runner | W9.19 on staging (§3); no regional measurement (owner, 6 Nov) |
| **W6.8** 50 learners | OPEN, NOT MET (D-031): every correctness criterion met; save p95 1,828 ms against 1 s | the same distance cause; re-measure after W9.19 |
| **W9.19** | IMPLEMENTED on the branch | CI, promotion, and staging's JWT key type (§3) |
| **W9.14** | STAGING VERIFIED | the production-copy rehearsal (W9.10, F-18) |
| **W6.9** checklist v2.8 | IN PROGRESS | rows marked only with staging evidence |
| **W6.12** | GREEN except two device checks | **NVDA** and **TalkBack**, each needing a person with the device |
| **Real assessment content** | BLOCKED | K6: E-K6-1 (residency; the owner, after counsel) and E-K6-2 |
| **Copy** W2.13, W4.3/W4.4 | waiting | Dr Gladys's words |
| **Gate 6** (release pack) | see `batch-9/RELEASE-EVIDENCE-PACK.md` | owner, external and production actions (F-5, F-15, F-16, F-18, DNS, support, backup) |

---

## 3 · Next, in order

1. **W9.19 CI and journeys** (running). If green: the **P-3 promotion** (covered by the approved proposal), `staging.yml`, then re-measure the journey and read Supabase's log.
2. **Read the result.** The log answers whether staging's Auth signs with an asymmetric key:
   - **Yes:** the proxy stops calling Auth, and the sign-in times should drop.
   - **No (HS256):** nothing speeds up yet. **Owner action:** move the Supabase project to asymmetric JWT signing keys, staging now and production before the release.
3. **If W6.2 is met on that evidence:** re-measure W6.8 (the 50 learners).
4. **W6.9:** render checklist v2.8; then the staging report and restore the freeze.

## 4 · Decisions for the owner

- **Possibly:** the JWT signing-key migration in Supabase (§3, step 2), once the log has answered.
- **Unchanged:**
  - production read and upgrade rehearsal (F-5, F-18);
  - capacity tier (F-15);
  - counsel (F-16);
  - residency for K6;
  - DNS, support, backup escrow.

---

## Addendum, 09:20 UTC: P-3 and W9.19 on staging

**P-3:** PR #12 merged as `main` **`4d325a33`**, after its CI and both journey jobs were green. Job B's first attempt was cut off by a slow runner; its one re-run was green.
- **No migrations.**
- **The read-only post-check:** identical.

**W9.19: verified on staging.**
- **Staging signs with an asymmetric key.** The proxy now verifies the token locally.
- **The proxy's Auth calls through the US:** 348 → **0**.
- **No owner action is needed on staging.**
- **Production's key type is not known** (production is not read); it is a release-time check.

**W6.2** (journey run 42192239336):

| Step | Now | Under 3 s |
|---|---|---|
| Every click and save | under 3 s, most under 2 s (Konfigurasi 1.3 s, Antrean Tinjauan 0.4–0.6 s, saves 1.3–1.8 s) | yes |
| The first screen | usable in 2.5–3.2 s | 1 of 6 |

- **The row stays OPEN, but the remaining gap is small.**
- **What remains:** the proxy's database session check (`sesi_periksa`) crossing from the US, at 776 ms, against 34 ms through Singapore.

**Next options:**
1. **W6.8:** re-run the 50 learners to see how far the save p95 dropped. The save time was dominated by the same two proxy calls, and one of them is now gone.
2. **W9.19's next item:** avoid the session check's round trip on every page, a security-sensitive design.
3. **A regional measurement:** the owner declined a test machine for now.
