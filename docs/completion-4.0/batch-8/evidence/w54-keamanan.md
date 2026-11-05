# W5.4 · The security suite on the release candidate (5 Nov 2026)

**What W5.4 asks:** re-run the security suite (RLS, isolation, sessions, credential privacy, audit) on the release
candidate and record it. **Release candidate:** the branch head after W2.17 (c256cd69) plus this item's dependency fix
(the commit that carries this page). Everything below ran locally on a reset database, built from that tree; CI and
journeys are dispatched on the pushed head.

## 1 · The selftest manifest, whole

There is no separate «security suite» in the tree: the security checks are rows of the one manifest (RLS and tenant
isolation in the db suites fable01–fable30; sessions, PIN and sign-in in bob*/app tests; credential privacy CR-86;
function exposure and grants F01-T13, F03-T10, F04-T14, F05-T21, F06-P08, DR-D01; the audit trail's append-only rule).
So W5.4 is the whole manifest on the candidate, and the readiness check beside it.

| Run | Tree | Result |
|---|---|---|
| Full selftest, reset database | c256cd69 (W2.17) | **843 passed, 0 failed**, 1 justified local skip |
| Full selftest, reset database | c256cd69 + Next 16.4.5 and the audit fixes | **781 passed**; 62 failed «fetch failed» when the local Docker shims died mid-run (database, auth, storage and realtime containers restarted; no out-of-memory kill) |
| The 62, re-run on a fresh stack | same tree | **all 62 pass** (166 rows, the db suites reporting whole). F22-K06 is red only in that targeted run: its persona is seeded by a suite the targeted run does not execute; it passed in the full run |
| CI (`ci.yml`) on the pushed head | this commit | dispatched; the clean single full run of record |

The first full run of W2.17 was **red, 10 rows**, and those rows are the security suite doing its work: the new
SECURITY DEFINER function `school_people_page` had no exposure class (F01-T13, F03-T10, F04-T14, F05-T21, F06-P08,
BOB19-A01), was not among the registered functions `authenticated` may execute (DR-D01, G7), and its migration had no
terminal verification block (F01-S01). It was registered (STAFF / SCOPE INSTITUTION_ADMIN) and verified, and its
access rule is held by F30-S01, where a planted missing scope check is caught (with it, Alpha's administrator read
Beta's enrolments, and Alpha's educator and a learner read Alpha's). Nothing was weakened.

## 2 · The launch-readiness check (`docs/audit/launch-readiness.sql`), on the candidate's database

All 24 rows **PASS**, among them:
- RLS closed by default: 0 tables without RLS; 0 policies using `true`; 0 client storage policies; storage buckets private.
- G7: anon holds no right on any public table, view or sequence; `authenticated` executes exactly the 236 registered
  functions and holds exactly the release's table rights (86 relations); everything owned by `postgres`; the four
  `auth.users` triggers present and enabled; the PostgREST pre-request set.
- Every function pins its `search_path`; the anonymous surface unchanged (10 / 19 / 0); exactly one public verification
  path.
- The audit trail is append-only and populated (0 client write grants).

## 3 · Secrets and dependencies

- `scripts/guard/sensitive-scan.mjs --tree`: **0 findings not allowed** (29 allowed by `scripts/guard/allowlist.json`,
  unchanged).
- `npm audit` on the release candidate **as pushed at c256cd69** found **4 advisories in production dependencies**,
  one critical: Next.js 16.3.5 (RCE in `next/og` ImageResponse; draft-mode leak through `use cache`), nodemailer
  (address parser), sharp (librsvg), source-map-js. PINTAR's source does not import `next/og`; the advisory is fixed
  all the same.
  - **Fixed:** `next` and `eslint-config-next` 16.3.5 → 16.4.5 (same major, pinned exact as before) and `npm audit
    fix` for the rest. **Production dependencies: 0 vulnerabilities.**
  - **Residue, accepted with reason:** 8 moderate advisories in `minimatch` under `typescript-eslint`, reached only by
    the lint toolchain (development, never shipped). npm's only offered fix is `eslint-config-next` 15, a major
    downgrade; it is left for the toolchain's own release.
  - Typecheck clean, lint 0 errors (8 warnings, as before), production build green on Next 16.4.5.

## 4 · What this does not cover

- Staging and production were not read for this item (staging read-only access is not needed: the suite runs on the
  candidate's own database). The candidate is not on staging until the owner authorises the promotion.
- Penetration testing by a third party is outside the suite and outside W5.4.
