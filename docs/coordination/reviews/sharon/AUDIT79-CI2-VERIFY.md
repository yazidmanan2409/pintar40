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
