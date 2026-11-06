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
