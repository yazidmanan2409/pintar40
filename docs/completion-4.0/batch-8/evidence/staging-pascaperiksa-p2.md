# P-2 · Staging after the promotion, and the J2.7 staff transition (6 Nov 2026)

**Merge:** PR #11 merged into `main` as `12d357ce`, a merge commit pinned to the head `5895bcdf`.
- **CI first:** all 18 checks green on the pull request (run 42157331836).
- **Authorised by:** the owner, 6 Nov.

**`staging.yml`:** run 42159507039, green on `main` `12d357ce`.
- The first run on Node 22 (W9.18).
- No migration to apply; the count stays at 196.

**Post-check:** read-only, on `pintar-staging`, inside `begin transaction read only`, against `staging-praperiksa-p2.md`.

| Check | Pre-check | Read | Result |
|---|---|---|---|
| Recorded migrations | 196, `20261230100000` | 196, `20261230100000` | ✓ |
| The demo school | 4/10/10/3/5/1, audit 91 (6860), people `bd41b3c9…`, accounts `7deebf17…` | the same | ✓ |
| Non-synthetic results outside the test schools | `f4fbb8c0…` | `f4fbb8c0…` | ✓ |
| Non-synthetic official results | `a14f4a40…` | `a14f4a40…` | ✓ |
| Certificates outside the test schools | `ffa43edd…` | `ffa43edd…` | ✓ |
| Non-synthetic integrity signals | 0 | 0 | ✓ |
| Management decisions | 0 | 0 | ✓ |

## J2.7: the existing staff make the transition (W9.14, CR-24)

**Authorised by:** the owner, 6 Nov («J2.7 authorised»).

**The run:** `staging-peralihan-staf.yml` run **42163941604**, GREEN, 15 of 15 PASS.
- **Script:** `audit/staging/peralihan-staf.mjs`.
- **Staging:** serving `main` `12d357ce` (GS-00 green in the same run).

**The population:** SD Golden School GS-001 (`gs-001`), a real school (not synthetic), and its four staff:
- one each: Dekan, Guru, Kepala departemen, Admin sekolah;
- accounts made on 2 Oct, before the identity foundation (21 Oct), on the staging test mailbox;
- they signed in then by the email link;
- the foundation marked each REQUIRED.

This is the case the transition meets in production: an account, a person and roles that already exist, and a sign-in that no longer does.

| Step | What it proves | Result |
|---|---|---|
| T0 | four staff, each REQUIRED, each with one auth user, one account and one person; persons/accounts/auth users 1516/1516/1516 | PASS |
| T1 | `/masuk` offers no email link (C14): «Lupa password?» is the link to the recovery page (no email-link button); «Aktifkan akun» is offered | PASS |
| T2 × 4 | each activates as a person does: «Aktifkan akun», the emailed code («Kode aktivasi akun PINTAR Anda»), then username → password → PIN → name → done → «Komputer siapa ini?». Landed on: Dekan `/pimpinan`, Guru `/mengajar`, Kepala departemen `/` (the chooser), Admin sekolah `/konfigurasi` | PASS |
| T3 × 4 | after, read-only: the same auth user, account, person, PINTAR ID and roles; set-up REQUIRED → COMPLETE with one username; still one auth user, one account and one person | PASS |
| T4 × 4 | each signs in again in a fresh browser with the password the wizard set, and lands on the same home | PASS |
| T5 | the run made no person, account or auth user: 1516/1516/1516 before and after | PASS |

**What it does not cover:**
- **A copy of production:** only W9.10's upgrade rehearsal (F-18) can prove the transition there, including production's only admin (migration 127).
- **The Auth setting:** the email link is retired at PINTAR's door (`TAUTAN_MASUK_CADANGAN = false`; `sendMagicLink` sends nothing). Supabase Auth's own email-link setting was not read here.

**What it touched:** four code emails to the test mailbox, and the four accounts' set-up, written through PINTAR's own screens. Nothing else.

## P-3 (6 Nov): W9.19 promoted

**Merge:** PR #12 merged into `main` as `4d325a33`, pinned to the head `d54b90a7`, after:
- all of its CI checks were green;
- CI run 42179337901 was green on `8d951655`;
- journeys run 42179347500 was green.
  - **Job A:** green on its first attempt.
  - **Job B:** green on its second attempt. The first was cancelled at its 60-minute limit after a 46-minute browser install on that runner, with no test failed.

**No migrations:** `staging.yml` did not run; the app reached staging through Vercel's build of `main`.

**Post-check:** read-only, against the P-2 baselines.

| Check | Read | Result |
|---|---|---|
| Migrations | 196 | ✓ |
| The demo school | 4/10/10/3/5/1, audit 91 (6860), people `bd41b3c9…` | ✓ identical |
| Non-synthetic results and official results | `f4fbb8c0…`, `a14f4a40…` | ✓ identical |
| Certificates outside the test schools | `ffa43edd…` | ✓ identical |
| Management decisions | 0 | ✓ |

**W9.19 on staging:** journey run 42192239336 (`w69-bukti-pemeriksaan.md` §2b).
- `jwks.json` was fetched 4 times.
- The proxy's `GET /auth/v1/user` through the US went from 348 to 0.

## W9.19's session regression (6 Nov): RED, the cause, the fix on the branch

**The run:** `staging-golden-school-laporan.yml` run **42195722895**, GS-17 to GS-21 on Sekolah Uji B8 1105, against staging serving `main` `4d325a33`: 7 PASS, 11 FAIL.

**Real: a session regression from W9.19 (GS-21 R2 and R3)**
- **R2:** the teacher replaced her password on another browser. The database recorded the old sessions ended (`KREDENSIAL_DIGANTI` × 6), **but the old browser still reached `/mengajar`**.
- **R3:** the same with «Pakai PINTAR ID dan PIN»: R2's browser still reached `/mengajar`.
- **Before W9.19:** on 5 Nov, `main` 38d7e701, the same steps passed (run 42049795788).
- **The cause:**
  - On a computer marked PERSONAL, the proxy skips `sesi_periksa` (`pribadiTersimpan`, a cookie this server signs).
  - There, Auth's answer to `getUser()` was what refused a session ended elsewhere.
  - W9.19's `getClaims()` verified the token locally instead, so the ended session passed until its token expired.

**Passed in the same run, on the W9.19 code:**
- U1: a class card locks after 5 idle minutes (302 s), and the PIN resumes it at the same page;
- U2a, U2: the shared computer is locked by the server after 664 s;
- R1: the card reissue;
- L4, C3, V2.

**The walk's own re-run state, not the product:** the walk is built to run once per school.
- **L0 to L3, C1:** six learners now, not five; N1 added one on the first run.
- **C2, V1:** one certificate is «Dicabut», revoked by the Batch 5 walk.
- **N1:** runs once per school.
- **X1:** the head of department's and the dean's sessions are open only because L2 and L3 stopped before their «Keluar».

**The fix:** on the branch at `78df95e1`, **not on staging**; promoting it needs the owner's authorisation.
- `penggunaTerverifikasi` asks `auth.getUser()` again, exactly the read before W9.19.
- **Held by W919-CABUT-01:** through the real client, an ES256 token signed by the project's own key, whose session Auth reports gone, is nobody. It is red against the `getClaims()` read.
- **Held by W919-CABUT-02:** a static check.
- **What it costs:** the 348 → 0 drop in the proxy's Auth calls is given back. This is how immediate enforcement is kept (the owner's ruling of 6 Nov).

**Staging until then:** it still runs `4d325a33`. On a PERSONAL computer, a session ended elsewhere stays usable until its token expires (Auth's default lifetime is one hour). Staging only: production runs the old release and is untouched.
