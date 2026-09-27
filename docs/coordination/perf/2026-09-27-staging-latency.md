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

## Not the cause
- **Supabase itself:** the same calls take about 19 ms from Singapore.
- **The browser:** only 2 of 406 calls came from it.
- **The database under load:** there was no test load.

## Not yet measured
- **Concurrency** under expected internal-test use: needs staging test accounts and a runner script. It should be measured after the fixes, as the gate.
- **Vercel cold starts:** their share can't be seen from Supabase's logs. The before and after run records `x-vercel-id` (edge and function region) and the time to first byte.
