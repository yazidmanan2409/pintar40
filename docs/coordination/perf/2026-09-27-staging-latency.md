# Staging latency, 27 Sep 2026: where the time goes

**Reported by Yazid** (signed in as Gladys on staging, `main` `2adce88`): sign-in takes about 10–20 s before he is fully in, and menu navigation about 5–10 s after each click, with no test load.

**Method.**
- Supabase's own request log for staging (`edge_logs`), 10:46–11:00 UTC, which covers Yazid's session: 406 requests. Each row records the Cloudflare data centre the request came in through (`request.cf.colo`), the caller (`node` is PINTAR's server) and Supabase's own time (`response.origin_time`). The requests were grouped into bursts per click.
- Read-only timing on staging's database: `EXPLAIN ANALYZE` of the pieces of `platform_schema_lint`, and the roles' `statement_timeout`.
- No addresses, user ids or emails were read.

## Findings

| # | Finding | Evidence | Who it hits |
|---|---|---|---|
| 1 | **PINTAR's server runs in the US, and its database is in Singapore.** There is no region in the repo (no `vercel.json`, no `preferredRegion`), so Vercel runs the functions in its default US East region. Both Supabase projects, staging and production, are in `ap-southeast-1` (Singapore). | 344 of the 406 calls came in through **IAD** (Washington, D.C.) from `node`. Supabase time per call: **IAD p50 277 ms, p90 813 ms**, against **SIN p50 19 ms, p90 30 ms** for the calls made near Yazid (the sign-in check in `proxy.ts`). That is about 14 times slower per call. | Every user, every click |
| 2 | **Konfigurasi waits for a schema lint that always times out.** `src/app/konfigurasi/page.tsx` puts `platform_schema_lint()` inside the first `Promise.all`, for the platform admin. Inside the lint, `assert_learner_rpcs_are_guarded()` takes **26.9 s** on staging's database. It compares every public function's source against every other function's name with a regular expression (quadratic in the number of functions). The limit for signed-in calls is `statement_timeout = 8s`. | 5 × `POST rpc/platform_schema_lint` → **500 after 8.3–8.8 s**, one on each Konfigurasi load, including the first screen after sign-in. `EXPLAIN ANALYZE`: 26,877 ms for this assert; the other eight asserts take 1–27 ms. | The platform admin (Gladys), on every Konfigurasi load |
| 3 | **Studio asks 8 permissions per school, one after another, and asks it again for the same click.** `studioInstitutions()` in `src/app/studio/_lib.ts` has nested `for … await supabase.rpc("can_in_institution")` loops. On staging that is 3 schools × 8 = 24 calls in a row. `src/app/studio/layout.tsx` calls it, and so does every Studio page, and nothing shares the result within a request (no React `cache()` anywhere in `src`). | One Studio click: **141 calls in 24.7 s, 96 of them `can_in_institution`** (4 runs of 24). Another: 62 calls in 13.2 s (48 checks, 2 runs). | Every Studio page; 8 calls per school per run for everyone |
| 4 | **The same reads repeat within one click.** | Per click: `auth/v1/user` 4–10 times, `my_profile` 2–4 times, `role_assignments` 3–6 times. | Every user |

**Sign-in, as logged:**
- 10:49:51 the sign-in link is requested (`auth/v1/otp`).
- 10:50:06 the link is opened in the browser (`auth/v1/verify`, CGK, Jakarta).
- 10:50:09 the token is exchanged and the profile read.
- 10:50:12–10:50:15.6 the landing page (Konfigurasi) loads: 21 calls, including the 8.3 s lint.

So after the link is clicked, about 10 s pass before the first screen, and about 8 s of that is the lint.

**Navigation, as logged:**

| Page type | Calls | Time |
|---|---|---|
| Ordinary page | 8–30 | 1.7–5.5 s |
| Konfigurasi (platform admin) | 21–54 | at least 8.3 s |
| Studio | 62–141 (2–4 runs of the 24 checks) | 13–25 s |

## After (a): the server in Singapore (27 Sep, 11:56 UTC)

- **Configured:** both Vercel projects were set to `sin1` by Yazid and read back from Vercel's API (`resourceConfig.functionDefaultRegions = ['sin1']`).
- **As deployed:** staging's new deployment answers `x-vercel-id: sfo1::sin1::…` (the perf-staging probe).
- **Supabase's side:** the server's calls now come from **SIN, at p50 21.5 ms and p90 39 ms**. Before, they came from IAD at 277 ms and 813 ms.
- **First byte, measured from a US runner, so it includes that runner's own trip to Singapore:** `/masuk` 0.42–0.52 s warm (before: 0.5–1.1 s), `/` 0.35–0.37 s (before: 0.55 s).
- **Still to do:** the unnecessary work (b)–(e) remains, and so does its request count. This fixes the distance only.
- **Production** is unchanged until its next release.

## Writes (added 27 Sep, from the synthetic setup; D-046(e))

- **What happened:** "Berikan peran" (Konfigurasi → Peran & akses), as the platform admin, took **about 10–15 s**, with nothing on screen to show the click had registered. The database then held **two identical active grants**, a double submit.
- **Why it took so long:** the action is one `grant_role` call. It then redirects to `/konfigurasi?bagian=roles`, and that full re-render includes the lint's 8.3 s timeout.
- **Why it saved twice:** the button is a plain `<button>` in a server-action form, with no pending or disabled state, and nothing in the database refuses a duplicate active grant.
- **Tickets:** BOB-18 (e) and DAISY-17.

## U-PERF baseline: before BOB-18 (27 Sep, 23:28–23:31 UTC)

- **Where:** staging on `main` 163bbcc (118 migrations, Singapore), from a GitHub runner in the US, so every number includes that runner's own trip to Singapore (about 0.2 s per round trip).
- **Who:** the synthetic accounts (D-046(c)): the platform admin and a Guru in the synthetic school "Uji Kinerja". Signed in by PINTAR's own session cookie, then timed from the click to the page's heading being visible.
- **Run:** `perf · staging`, mode `journey`, run 36358786975, two repetitions. Times in ms.

| Step | Rep 1 | Rep 2 |
|---|---|---|
| Admin: sign-in → Konfigurasi usable | 4,754 | 3,061 |
| Aktivasi akun | 1,468 | 696 |
| Back to Konfigurasi (browser cache) | 29 | 24 |
| Studio | 1,559 | 990 |
| Studio → Buat Paket | 2,288 | 1,251 |
| Antrean Tinjauan | 983 | 1,076 |
| Bank Soal | 964 | 1,026 |
| Open Konfigurasi | 2,151 | 1,205 |
| Ringkasan sekolah | 1,004 | 649 |
| Teacher: sign-in → Mengajar usable | 2,866 | 2,623 |

- **Against D-046(b):** sign-in is under the 5 s gate but over the 3 s target on the first repetition. Clicks are 0.65–2.3 s, so the typical click is near the 1.5 s bound, and none is over 3 s.
- **Not yet measured, harness faults, not PINTAR's:** the timed write (the grant form did not offer the synthetic teacher to the admin) and the teacher's class click (the first-visit tour overlay took the click). The harness is fixed for both before the measurement after BOB-18.
- **Request counts** for these windows come from Supabase's edge logs, beside the counts after BOB-18.

## U-PERF after BOB-18 (28 Sep, 23:49–23:50 UTC; single session)

- **Where:** staging serving `87fedc9` (Integration 11 plus the harness; read back from Vercel in the run), 119 migrations, Singapore. The same US runner, so every number still includes about 0.2 s per round trip to Singapore. Repetition 1 met a freshly deployed function (cold start).
- **Run:** `perf · staging`, mode `journey`, run 36359917724, three repetitions. Times in ms. **Server calls** are the Supabase requests from Vercel's Singapore functions in the step's window (edge logs, colo SIN), repetition 2 of each run, before → after.

| Step | Rep 1 | Rep 2 | Rep 3 | Server calls before → after |
|---|---|---|---|---|
| Admin: sign-in → Konfigurasi, whole step | 5,107 | 3,333 | 2,246 | 24 → 27 |
| … of which the page, from opening it to usable | 3,288 | 1,646 | 1,593 | |
| Aktivasi akun | 1,651 | 1,289 | 1,565 | 10 → 9 |
| Studio | 2,092 | 677 | 908 | **27 → 6** |
| Studio → Buat Paket | 1,752 | 722 | 941 | **13 → 3** |
| Antrean Tinjauan | 1,423 | 915 | 1,407 | **13 → 3** |
| Bank Soal | 1,649 | 898 | 905 | **13 → 3** |
| Open Konfigurasi | 1,525 | 1,900 | 1,155 | 24 → 27 |
| Ringkasan sekolah | 808 | 1,592 | 1,522 | 7 → 6 |
| **Save: rename the Bagian**, click → "saving" shown | 4 | 4 | 4 | |
| … click → result line | 1,864 | 1,838 | 1,841 | 28 (the action and Konfigurasi re-read) |
| Teacher: sign-in → Mengajar, whole step | 1,972 | 1,656 | 2,411 | |
| … of which the page | 1,323 | 999 | 1,242 | |
| Teacher: Kelas Uji Kinerja A | 2,476 | 1,074 | 1,110 | 13 |
| Teacher: Siapkan | 785 | 1,101 | 1,072 | 12 |

- **Against D-046(b), single session:**
  - **Sign-in:** the page is usable 1.0–3.3 s after opening it (3.3 s only on the cold start). The whole step also creates the session from the US runner (two calls to Singapore), which a real sign-in replaces with one code exchange inside Singapore; with that included it was 5.1 s once, on the cold start, and 1.7–3.3 s otherwise.
  - **Typical click:** median 1.16 s over all 27 clicks (1.09 s warm). Target 1.5 s: **met**.
  - **95% under 3 s:** 27 of 27, the slowest 2.5 s (cold). **Met.**
  - **Writes:** the button shows "Menyimpan…" **2–4 ms** after the click (D-046(e): acknowledged at once), and the result line appears after 1.8 s, which includes re-reading the whole Konfigurasi page (27 reads).
  - **Errors:** none.
- **What BOB-18 changed:** the server work fell where it was pathological (Studio 27 → 6 calls per click, its other pages 13 → 3; the schema lint no longer runs on Konfigurasi). From a US runner the wall-clock gain is small, because each navigation's round trips to Singapore dominate; people in Indonesia do not pay that distance.
- **Still broad:** Konfigurasi reads 27 times per render, and a save there re-reads all of it. Not repeated work, but the next candidate after 5 Oct (D-047(d)).
- **Prefetch sign-in checks (Bob's Q1), measured:** `proxy.ts` asks Auth for the user on every prefetched link, from the edge nearest the browser (IAD here). That is **6–10 checks per page view**, on top of the server calls above. Kept for now (the prefetch header can be forged). The concurrency run shows whether they matter under load.
- **Harness notes:** the rename back was not timed correctly (its result matched the previous line; fixed for the next run), and its server calls fell into the teacher's sign-in window, so that window's count (45) is not used.

## U-PERF: 30 active sessions for 10 minutes (28 Sep, 00:20–00:31 UTC)

- **Run:** `perf · staging`, mode `sessions30`, run 36361820806, on staging serving `3b7f224` (after BOB-18). Three US runners, 10 sessions each: 15 as the synthetic school admin, 15 as the synthetic teacher, signed in over the first minute, then clicking through their menus with 3–8 s of reading between clicks for 10 minutes. One session also renamed the Bagian and renamed it back every fourth round.
- **Result: no timeout and no error.** 3,004 steps and 2,429 menu clicks: **0 failed, 0 server errors (5xx) from PINTAR's pages, 0 errors in a page.**

| | Shard 0 | Shard 1 | Shard 2 |
|---|---|---|---|
| Menu clicks | 825 | 829 | 775 |
| Click p50 / p95 / max (ms) | 1,007 / 1,483 / 2,309 | 845 / 1,206 / 2,015 | 1,004 / 1,440 / 2,152 |
| Clicks under 3 s | all | all | all |
| Sign-ins p50 / max (ms), from the US runner, including making the session | 3,489 / 4,829 | 2,065 / 3,768 | 1,979 / 2,773 |

- **Saves under load:** four renames, the result line after 1.39–1.47 s, and the name back as it was at the end.
- **Supabase's side, same minutes:** 44,537 requests, **0 server errors, 0 rate-limit refusals (429)**. The database answered at p50 13 ms, p95 282 ms, max 1.4 s (edge logs, `response.origin_time`). No Postgres ERROR or FATAL lines.
- **Two things to watch** (neither an error for the person):
  - **Sign-in checks on prefetched links are 32% of all Supabase requests** (14,363 of 44,537: `proxy.ts` asking Auth for the user on every link the browser prefetches, from the edge nearest the browser). Harmless at 30 sessions; at the capacity track's scale (D-031) it is the first multiplier to remove, by checking the session without a network call. Backlog, after 5 Oct.
  - **Konfigurasi asks `persons_awaiting_first_role` for every reader**, and the database refuses it for anyone but the platform admin: 338 refusals (400) in the run, one per school admin's Konfigurasi. Wasted work and log noise; the page should ask only the platform admin. Rides BOB-19's run (Daisy).
- **Verdict against D-046(b):** single session and 30 sessions both meet every threshold. Measured from US runners, so each click also carries the trip to Singapore; people in Indonesia do not.

## Not the cause
- **Supabase itself:** the same calls take about 19 ms from Singapore.
- **The browser:** only 2 of 406 calls came from it.
- **The database under load:** there was no test load.

## Not yet measured
- **Concurrency:** measured, above (30 sessions, 10 minutes, 28 Sep).
- **Vercel cold starts:** their share can't be seen from Supabase's logs. The before and after run records `x-vercel-id` (edge and function region) and the time to first byte.
