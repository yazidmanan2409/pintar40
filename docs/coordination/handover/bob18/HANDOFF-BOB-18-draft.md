# Bob → coordinator: BOB-18 (PINTAR answers quickly, D-046)

**Head:** `HEAD_SHA`, on main `c4b919f` (merged first; (a)–(d) were `5acc7f8`).
**Order:** the lane still carries BOB-09 (`e3232ca`, handed off earlier today, CI dispatched) underneath this. See QUESTIONS 1.

## CHANGED

**(a) The server runs next to the database.**
- A new `vercel.json` has `"regions": ["sin1"]`. That is Vercel's project-level setting for where functions run. Both Supabase projects are in `ap-southeast-1`.
- It applies to both Vercel projects on their next deployment. No Next.js `preferredRegion` is used anywhere.
- **Checking the deployed region:** your `perf · staging` workflow now does this (`region` and `probe` modes), so I removed my own `staging-region.yml` rather than keep two.
- vercel.com and the staging origin are both blocked from this sandbox, so I **could not check it myself**.

**(b) Konfigurasi stops running the lint on every load.**
- `platform_schema_lint` now runs only when the platform admin asks (`/konfigurasi?periksa=skema`). The health card offers a "Jalankan pemeriksaan" link (`config.card.health.periksa`, both languages).
- `assert_learner_rpcs_are_guarded` finds the call graph by splitting each function's source into whole words once and joining them to function names. The old version ran one regular expression per pair of functions.
  - It produces the same edges: 606 in both versions on a fully migrated database, none differing either way.
  - A name containing a non-word character would still use the old regex test; there are none today.
  - Roots, the six-call walk, comment stripping and the detail lines are unchanged.
  - **Time:** 18.4–18.8 s → 56–82 ms locally over 344 functions (26.9 s on staging).
- CI still runs it: F01-T13 through the lint, the inline red case for an unguarded learner RPC, and F03-T10. The new F01-T20 adds a timed test.

**(c) Studio asks its capabilities in one call.**
- `studio_capabilities(text[])` is new: SECURITY INVOKER, pinned search_path, `authenticated` only, registered as STAFF.
- It is the app's old loop moved into one statement. It picks the same candidate schools under the caller's RLS, and every answer is still `can_in_institution`.
- `studioInstitutions()` calls it once and is wrapped in React `cache`, so the layout and the page share one answer per request.
- A failed call means no capabilities, which leads to the same refusal as before.
- Nothing is inferred from a role name.

**(d) Once per request.**
- `currentViewer`, `isSystemAdmin` and `peranSaya` are React per-request caches.
- `peranSaya` takes the person from the viewer's `my_profile` row instead of a second `current_person_id` call.
- The cache lives for one server render; it is never shared between requests or people.

**(e) Writes.**
- **Saved once.** A new BEFORE INSERT trigger on `role_assignments` covers every writer: `grant_role`, the intake, rollover, transfer and bootstrap.
  - It takes an advisory lock on (person, role, place), then refuses a grant while an identical one still stands, meaning not revoked and not expired.
  - The refusal is SQLSTATE 23505, which the app already shows as `ACTION_ALREADY_EXISTS`. The message says `GRANT_ALREADY_ACTIVE`.
  - It fires after `role_assignments_guard`, so someone who may not grant there is refused for that first and learns nothing.
  - The same role in another place, again after a revoke, or again after an expiry is still a new grant.
- **Quick after they finish.** The page a save returns to no longer runs the lint.
  - Konfigurasi's later reads (people awaiting a first role, report templates, the metric catalogue) now run beside the main reads instead of three steps after them.
  - `currentViewer` asks for the user and the profile side by side.
  - Without that last change, (d) would have added one round trip before the roles read. I measured it and fixed it.

## PROOF (red before, green after)

| test | red before | green after |
|---|---|---|
| F01-T20 (db) | `the assert took 18396 ms over 344 functions; the bound is 2000 ms`. The four planted verdicts already matched the old version. | 56–63 ms; same verdicts |
| F01-T21 (db) | `studio_capabilities` does not exist (a new function, so "red" here only means it is missing) | on a fresh database, 12 personas, 8 holding a Studio capability, each identical to asking `can_in_institution` about every school; anon refused |
| F01-T22 (db) | `a second identical grant was saved; 2 standing grants after two presses` | refused 23505 `GRANT_ALREADY_ACTIVE`, one grant stands; another place, after a revoke and after an expiry are each saved |
| F10-C04 (race) | `a second identical grant was saved beside the first; row check: false` | the second connection waits on the lock and is refused; one grant stands |
| BOB18-K01 (static) | no `studioInstitutionsDari`; none of the four reads is cached; `peranSaya` re-asks `current_person_id`; no `vercel.json` | pass |
| BOB18-A01 (app, network: CI) | old code, rehearsed locally against a fake Supabase: 16 `can_in_institution` and 0 `studio_capabilities` per Studio click; `is_system_admin` twice and `role_assignments` twice on a Studio click; the lint on every Konfigurasi load | CI (real stack) |

**Request counts per click.** These come from the runner's count of the app's Supabase calls (`selftest/hitung-fetch.cjs`, loaded only into the selftest's `next start`). The fake has one school, so "before" understates staging, where it was 3 × 8 per run.

| click | before | after |
|---|---|---|
| Studio page (server only) | 29 (16 `can_in_institution`) | 8 (1 `studio_capabilities`) |
| Studio, in a browser: open `/studio` | 48 | 29 (21 of them are link prefetches passing `proxy.ts`, see QUESTIONS 3) |
| Studio, in a browser: next nav click | 15 (8 `can_in_institution`) | 4 |
| Konfigurasi (platform admin) | lint every load (8.3 s timeout on staging) | lint 0; 1 only when asked |

**Timings for the four writes.** The time is for the page each save returns to, plus one call for the write itself.
- **How it was measured:** real `next start` builds of the old and new code, against a scratch fake Supabase that answers each call after a set delay. The delays are the evidence's medians: 277 ms per call from the US region, 19 ms from Singapore. The lint answers after 8.3 s, as it did on staging.
- **Limits of the fake:** it has three schools, and every persona counts as the platform admin, so the structure step also shows the lint.
- This is a model of staging built from its measured latencies, not a staging measurement. Please take the real before and after from Supabase's log in your U-PERF run.

| write, and the page it returns to | before: old code, US | old code, Singapore | new code, US | **after: new code, Singapore** |
|---|---|---|---|---|
| Grant ("Berikan peran" → Konfigurasi) | 23 calls, **10.9 s** | 8.5 s (the lint) | 22 calls, 1.7 s | 22 calls, **0.16 s** |
| Structure step (→ Konfigurasi re-read) | 23 calls, **10.8 s** | 8.5 s | 22 calls, 1.7 s | 22 calls, **0.15 s** |
| Studio step (→ the package page) | 66 calls, **8.7 s** | 0.67 s | 13 calls, 1.1 s | 13 calls, **0.10 s** |
| Sediakan (→ the class page) | 6 calls, **1.1 s** | 0.10 s | 6 calls, 1.1 s | 6 calls, **0.10 s** |

The writes themselves in the database, measured locally: `grant_role` 19 ms, `create_bagian` 4.5 ms. On staging's 10–15 s grant, the lint's 8.3 s timeout was most of it and the US round trips were the rest.

CI's BOB18-A01 prints the same breakdown per click against the real local stack in the app job log (`BOB18-A01 /studio → 200: N Supabase calls; …`).

**Unchanged and green locally:** every auth, RLS and permission test in the DB suites (F01, F05, F06, F08, F10) and the static tests. The app runner's sign-in and refusal tests need the network facility, so they run in CI.

**Restated for the changed requirement (named):** the migration-count tripwires, 118 → 119, with the reason.

## CI

I dispatched one run on `HEAD_SHA` and haven't waited on it; please read the result there. (The run dispatched on `5acc7f8` covered (a)–(d) only.)
- **Local, before dispatch:** FULL_LOCAL_E
- One run, no new job. BOB18-A01 runs in the existing app job.

## CONTRACT

- New RPC `studio_capabilities(p_capabilities text[])` returns `(institution_id, name, capabilities[])`.
- New query parameter `/konfigurasi?periksa=skema`.
- A duplicate grant is refused with 23505 (`GRANT_ALREADY_ACTIVE`), which the app shows as the existing `ACTION_ALREADY_EXISTS`. The intake records it in `failure_reason` like any other refused row.
- No error codes were added.

## MIGRATIONS

`20261013100000_pintar_answers_quickly.sql`, forward-only:
- replaces the body of `assert_learner_rpcs_are_guarded`;
- adds `studio_capabilities` and one registry row;
- adds the trigger `role_assignments_unique_active` and its function `refuse_duplicate_active_grant`. Existing duplicates, such as staging's double grant from the synthetic setup, are left alone: revoking one is an audited act for a person, not a migration;
- ends with terminal checks: the verdict holds, the assert runs under 5 s, anon cannot call the new function, and the duplicate trigger exists alongside the grant guard.

## COPY

One key, `config.card.health.periksa`: "Jalankan pemeriksaan" / "Run the checks". Daisy owns it.

## QUESTIONS

1. **Order.** BOB-09 was already committed and handed off on this lane when BOB-18 arrived, so BOB-18 sits on top of it. Merging BOB-18 brings BOB-09 too. I didn't rewrite the lane. If BOB-09 must wait, tell me and I'll split it.
2. **Region check.** After the merge reaches staging, please run `staging · function region` once from main, or tell me to. I haven't dispatched it, since it touches the staging project's record.
3. **Prefetch.** A browser that opens a page prefetches each visible link, and each prefetch passes `proxy.ts`'s session check (one Auth call each, about 21 on a Studio page). I left this alone: `proxy.ts` is a security layer that F01-R07 probes, and from `sin1` these calls are about 20 ms and run in parallel. If U-PERF still shows it, the choices are `prefetch={false}` on the nav links (Daisy's components) or accepting the cost. I would not skip the proxy's check for prefetches, because that header can be forged.
4. **Health card verdict.** Now that the lint runs on request, its card shows "Perlu perhatian" whenever any key is not 0. That includes `anon_public_surface` = 1, `anon_reachable_http_paths` = 2 and the `*_ok` flags, all of which are correct. It has always done this, and those strings are also not in `hle.ts`. I didn't change it, since that is scope creep. Should the card read F01-T13's rule, and should Daisy take the wording?

5. **Staging's existing double grant.** Please revoke one of the two from the synthetic setup (Konfigurasi → Peran & akses) so staging's data matches the new rule. The rule only stops new duplicates.

## READY

Yes, once the run on `5acc7f8` is green. Then the region check (QUESTIONS 2) and your U-PERF measurement.
