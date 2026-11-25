# CI-2 · independent verification of the frozen candidate `9c6aae62` (PR #31) — Sharon

**Work:** the diff `94ce6727..9c6aae62`:
- migration `20270126100000_a_locked_account_reads_as_any_wrong_password.sql`, sha256 `4622be4e…` (which I checked);
- `selftest/ci2.test.ts` and the restated tests;
- the app changes.

Read from the source, not from the builder's summary.

**Verdict: PASS with two conditions (V-1 and V-2), conditional on ci 45488925842 and journeys 45488932426 being green in attempt 1.**
- V-1 is a small product change, so it needs a re-freeze.
- V-2 is a test-only change.

## L-78's oracle: closed

- **No ban remains.** The migration lifts every `banned_until` and asserts none is left. CI2-Z01 asserts it is null everywhere and that no function in the database names it. CI2-K01 asserts no function in the migration does.
- **Lock and unlock rotate instead.** `akun_kunci` locks the person's Auth rows in id order and calls `akun_rotasi` for each account. `akun_rotasi`:
  - writes a fresh bcrypt hash of 32 random bytes;
  - clears the recovery, confirmation, email-change, reauthentication and phone-change tokens;
  - deletes `one_time_tokens` and `flow_state`;
  - ends the sessions and deletes the refresh tokens.
- **The uniformity test** compares the answers to an ordinary wrong password, for email and card: status, `error_code` and body identical, and medians within max(12 ms, 35 %). CI2-K01 catches Q1 and Q2.

## The GUC bypass: meets my §8, with one gap (V-2)

- **(a)** It is set with `set_config('pintar.kunci_rotasi', p_auth_user::text, true)` and cleared immediately after the single update. ✓
- **(b)** The guard returns early only when `current_setting('pintar.kunci_rotasi', true) = new.id::text`, and only after the unchanged-password return. ✓
- **(c)** CI2-G01 asserts only `akun_rotasi` and the guard name it, and that no `set_config` takes a caller-supplied name.
  - **Gap (V-2):** G01 reads `p.prosrc`, which is **empty for a `BEGIN ATOMIC` SQL function.** That is the same lesson as Z-D1-02.
  - **Switch it to `pg_get_functiondef(p.oid)`,** and plant a `BEGIN ATOMIC` function that sets the GUC, which must turn it red. Test-only.
- **(d)** Clients cannot set `pintar.*`. ✓
- **(e)** I accept the A2A-L01 exception text as narrow.

## `akun_auth_terkunci` and the activation route: accepted

- It reads the uuid only from `supabase.auth.getUser()`, the caller's own session. CI2-K01's Q13 catches a foreign uuid from the request.
- **A locked person gets the ordinary `KODE_TIDAK_COCOK`,** counted like a wrong code, and the session the code created is signed out.
- The extra round trip falls only on the path of someone holding the emailed code, so it reveals nothing to a stranger.
- It is service_role only. ✓

## The five preservations (ruling 98): confirmed

1. **Legitimate suspension:** `tangguhkan_akun`, closure, and the sitting lock all go through `akun_kunci`, which rotates and **also deletes pending RECOVERY and ACTIVATION permits**. There is no workaround and no extra step for the institution. `periksa` still refuses (CI2-R01: a pre-lock access token is refused, Q9 caught).
2. **Reinstatement, with OD-1:**
   - unlocking rotates again (`KREDENSIAL_DIGANTI`), so previous credentials and sessions are void;
   - CI2-B01 proves that a password set during the lock never signs in after `aktifkan_kembali_akun` or `buka_kembali_akun`, and a fresh one does;
   - the card's PIN reset writes the derived Auth password (Q6 caught);
   - identity and records are untouched.
3. **Recovery:**
   - `recovery_code_target` and `activation_code_target` exclude locked persons;
   - during a lock, any credential written through a permit is stored as a secret nobody holds (Q10);
   - links from before the lock fail (CI2-T01, Q4).
4. **Historical records:** F-4 writes only Auth credential and token columns, and is audited (`account.lock_converted`, with its counts). `hapus_data_pribadi` is restated with the same deletions plus rotation.
5. **Institutional authorisation:** who locks, reinstates and reopens is unchanged; the same functions decide. `admin_akun_dapat_masuk` now reads PINTAR's own lock, not `banned_until`.

## V-1: a new disclosure in `card_holders`. Change it before acceptance

- `card_holders()` now returns `kunci` = **DITUTUP or DITANGGUHKAN** to every holder of CAN_PROVISION_PEOPLE in the school. `KartuUlang` shows the category beside the learner's name. Before CI-2, these staff saw no lock at all.
- **A suspension can be a platform-level safeguarding act** (`tangguhkan_akun` is the PINTAR administrator's), so telling provisioning staff a named learner is **suspended** discloses more than they need.
- **Their need is operational:** "a card can't be re-issued for this learner now". So return a **neutral** flag, `terkunci boolean`, and show one neutral line for both cases (Daisy's words), for example «Kartu belum dapat dibuat untuk murid ini. Tanyakan kepada admin sekolah.».
- **The exception:** if the owner rules that school provisioning staff may know the category, record that, and V-1 lapses. Until then, the category stays with the decider.
- **The test:** `card_holders` never returns a category; a planted category is caught.

**On V-1 and V-2 landing, and CI green in one attempt: CI-2 PASS.** I check the re-frozen delta only.

## Addendum · the run half is OPEN (24 Nov 2026, 21:42 UTC)

- **The source-reading verdict stands:** PASS with V-1 and V-2.
- **The run half is OPEN.** I read both runs from the GitHub API at 21:41Z:

  | Run | Status | Conclusion |
  |---|---|---|
  | ci 45488925842 | `in_progress` | none |
  | journeys 45488932426 | `in_progress` | none |

- **What I based my words on:** I had not read either run. My record said "conditional on … being green in attempt 1", a condition, not a result. But my message to Bob put it as "PASS WITH TWO CONDITIONS, plus ci … and journeys … green in attempt 1", which reads as a claim.
- **The lesson** (adopted): a run's result is quoted only from the API's `conclusion`, with the time it was read. A condition is written as "required: … green", never as a run ID followed by "green".
- **These runs are of `9c6aae62`, which V-1 changes,** so the runs of record will be those of the re-frozen head. I quote their conclusions when they finish.

---

## Addendum: re-freeze delta 9c6aae62..25681b11 (Sharon, read-only, 2026-11-24)

**Verdict on the code: PASS. V-1 and V-2 are closed in the code.**
**Required: ci and journeys on 25681b11 green**, quoted from the GitHub API conclusion along with the time it was read. Until then the run half stays OPEN.

- **V-1, the category is no longer shown:**
  - `card_holders()` returns `terkunci boolean` = `public.orang_ditangguhkan(p.id)`; the category column is gone.
  - `pemegang-kartu.ts` passes only `terkunci === true`.
  - `KartuUlang.tsx` renders one key, `aktivasi.kartu_ulang.tidak_dapat_dipakai` (Daisy §6), with `data-kartu-terkunci="ya"`. The line names no reason. The two §5 keys (DITANGGUHKAN/DITUTUP) are removed from `hle.ts`.
  - CI2-P01 asserts:
    - the list adds exactly `{"terkunci": false}` / `{"terkunci": true}` for both SECURITY and CLOSED_AT_REQUEST;
    - the row matches no suspend/closed vocabulary;
    - the suspended row and the closed row are byte-identical, with no button and no card.
- **V-2, the test now reads full function definitions:**
  - CI2-G01 reads `pg_get_functiondef` throughout, never `prosrc`.
  - Plant Q14 is a BEGIN ATOMIC setter of `pintar.kunci_rotasi`, which has an empty `prosrc`, and it must be caught.
- **Z-S12-01 test isolation:**
  - `ipUji` is now a counter over 198.18.0.0/15, so it never repeats within a run.
  - Z-S12-01 posts from 192.0.2.0/24 and checks over 2000 draws that `ipUji` never lands there.
  - This is isolation only; no assertion was weakened.
- **Migration 311:** sha256 begins `5c4b2306c4c1c418`, matching Bob's value. `preservation-CI2.sql` carries the new sha, and that is its only change.
- Could reasonably have been anticipated: yes, as V-1/V-2 already said. No new findings.
- I have not queried staging; this is a code read only.

---

## Addendum: run half closed; CI-2 FINAL (Sharon, 2026-11-25)

I read both runs on 25681b110173b87dd2996c752145e5e377b6baf5 myself from the GitHub API at **00:11Z**:
- ci 45509971723 (PR #31): status=completed, **conclusion=success**, attempt 1, updated 00:05:13Z.
- journeys 45509965430: status=completed, **conclusion=success**, attempt 1, updated 23:58:12Z (first read as success at 23:59Z).

The run half is closed, and ~~OPEN~~ above is superseded.

Also read at 00:11Z: main's ci 45510549989 on f1e35bb9 (H-1's merge) is completed, conclusion=success.

**CI-2 FINAL: PASS**, at the frozen content 25681b11. V-1 and V-2 are closed. The conditions for the merge, all of them the owner's to authorise:
1. **#31 is updated onto main** (CI-1 and H-1 have moved it). After the update, the PR's diff against main must be byte-identical to 25681b11's diff, with only main's commits added. Any content change re-opens review.
2. **Required: ci on the updated head of #31 green**, from the API conclusion.
3. **The production carry-overs stand.** CI-2 (311) rides with, or precedes, any production promotion that brings migration 221 or later (PR-22, L-78). Step 0s come before promotion. 311's staging promotion gets its own preservation verification from me.

I have not queried staging; the run half is from the API and the content is a code read.

---

## Addendum: merge condition (1) met at c9d4e8a1 (Sharon, 2026-11-25 00:18Z)

I checked Bob's accounting myself, read-only:
- **origin/claude/ci-2 is c9d4e8a14b4bb9842258d42ea659e2b1c1f1ac39**, a merge commit with parents 25681b11 and f1e35bb9. The merge-base of 25681b11 and f1e35bb9 is 94ce6727, so 94ce6727..25681b11 is the whole reviewed branch.
- **The diff matches.** `git diff f1e35bb9 c9d4e8a1` has sha256 `941c0d0b0ba2376b…`, the same as `git diff 94ce6727 25681b11 -- . ':!selftest/db/r1.sql' ':!selftest/db/fable37.sql'`. It covers 33 files.
- **The two left-out files are identical** at 25681b11, f1e35bb9 and c9d4e8a1: the diff between each pair is empty. H-1 brought them to main with the same content (ruling 103's clock-fix accounting).

**Condition (1) is met:** the change brings no content beyond what I reviewed.

**Condition (2) is still OPEN.** ci 45516071985 on c9d4e8a1 was status=in_progress when I read the API at 00:18Z. Required: ci 45516071985 green, from the API conclusion.

Noted, not yet verified: Bob's step 0 and BEFORE in docs/post-4.1/ci-2/promotion/ (b6f307ea): banned 1 = locked 1, 0 banned-but-not-locked, 0 live tokens, watermark audit_id 10706. The expected AFTER moves are lines 10, 12, 44 and 45 only. I check these with the 311 staging promotion.

---

## Addendum: merge condition (2) met; merged (Sharon, 2026-11-25 00:50Z)

- **Condition (2) is met.** ci 45516071985 on c9d4e8a1 shows status=completed, **conclusion=success**, attempt 1, updated 00:45:50Z (read from the API at 00:50Z). The condition ~~OPEN~~ is superseded.
- **The merge is what I accepted.** origin/main is 0c155a5c, with parents f1e35bb9 and c9d4e8a1. Its tree equals c9d4e8a1's tree (checked with git), so main carries exactly the content I accepted.
- **Still to come:**
  - staging.yml 45520797689 and main ci 45520797680 had not concluded (Bob: in_progress at 00:47Z);
  - my independent check of the 311 staging promotion: AFTER against BEFORE, where only lines 10, 12, 44 and 45 may move, plus the counts (banned 0, locked 1, live tokens 0), V6 and the preservations;
  - PR-22 stays open, and production is untouched at 111.

---

## Addendum: staging promotion 310 → 311, independent verdict (Sharon, 2026-11-25 ~01:05Z)

**I have not queried staging.** This verdict is from Bob's verbatim evidence at claude/bob-41-master-plan bafffd3c (docs/post-4.1/ci-2/promotion/), which I re-checked myself, plus the API.

- **staging.yml 45520797689** on main 0c155a5c: completed, **conclusion=success**, updated 00:48:20Z (read from the API at ~01:04Z).
- **AFTER against BEFORE, my own machine diff** of the 66 numbered output lines: exactly lines **10, 12, 44 and 45** differ, and the other 62 are byte-identical. Both reads use the same batas: saat `2026-11-25 00:12:55.166386+00`, audit_id 10706.
  - 10: `310 / 20270125100000` → `311 / 20270126100000`.
  - 12: 5 → 4 triggers. Exactly `pintar_kunci_tetap_jaga` is gone, and the other four are unchanged.
  - 44: the count stays 1580 and the digest changes. That is the expected change for the locked row: banned false, a new password digest.
  - 45: 1 → 0.
- **The auth row updated after the cutoff is not a discrepancy. I agree with Bob.** Line 44's expression (script line 171) reads only id, lowercased email, `banned_until is not null` and md5(encrypted_password), for users created on or before batas. A password sign-in changes last_sign_in_at, updated_at, sessions and tokens, and none of those is an input. If that row had changed in a way that mattered, the 62 lines that stayed identical would have exposed it. Line 44's move is accounted for by audit 10707 `account.lock_converted` {rotated 1, bans_lifted 1}, the single audit row above the watermark. I took this from the evidence and did not read it on staging myself.
- **Counts (Bob, 00:51:19Z):** banned 0; accounts of locked persons 1, unchanged; banned but not locked 0; live tokens 0. The locked account reads as not banned, secret rotated, 0 sessions, one-time tokens clear, suspension still open. This matches the expected AFTER.
- **V6:** periksa md5 `2b4a0444…` is unchanged, and v6-pre-request and c3w-r3-bahan are OK. The hosted half, the call counter rising after a staging request, is **PENDING**. It needs one owner staging request after 00:55:14Z, against the baseline of 178,247 calls.
- **Reinstatement:** proven by the suite and the plants, with no staging exercise. **I do not require a staging exercise for this promotion.** A run on a disposable fixture before production is optional, and the owner may ask for it.

**Verdict: STAGING PROMOTION PASS**, with two items still open:
1. **Required: main ci 45520797680 on 0c155a5c green.** It was status=in_progress when I read the API at ~01:04Z.
2. **Required before production: the hosted V6 re-read** after the owner's staging request, showing the call counter above 178,247.

PR-22 stays open, and production is untouched at 111. All production carry-overs stand.

---

## Addendum: hosted V6 re-read met (Sharon, 2026-11-25 ~01:05Z)

- **Open item (2) is MET.** The evidence is Bob's read, recorded in after-promotion-CI2-staging.txt at 2b4387eb, lines 74–78. I have not queried staging.
- **What it shows:** read after the owner's staging sign-in at 01:00:40Z, periksa calls are 178,406, which is +159 over the 178,247 baseline (00:55:14Z). The periksa md5 `2b4a0444…` is unchanged, and the latest migration is 20270126100000.
- **Open item (1) is still OPEN.** Main ci 45520797680 on 0c155a5c was status=in_progress when I read the API at ~01:05Z. Required: 45520797680 green. Until it is, CI-2 is not closed on staging.

---

## Addendum: CI-2 closed on staging (Sharon, 2026-11-25 ~01:20Z)

- **Open item (1) is MET.** Main ci 45520797680 on 0c155a5c shows status=completed, **conclusion=success**, attempt 1, updated 01:17:38Z (read from the API at ~01:20Z). ~~OPEN~~ above is superseded.
- **Every item I set for the staging promotion is now met:**
  - the staging promotion PASS (6f0d376f);
  - the hosted V6 re-read (8db19f2f);
  - main ci green.

  **CI-2 is CLOSED ON STAGING** as far as my verification goes.
- **PR-22 stays open,** and production is untouched at 111. All production carry-overs stand:
  - 311 goes with or before any promotion that brings migration 221 or later;
  - step 0s come first;
  - the owner's production authorisation.
