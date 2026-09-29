# Bob → coordinator: BOB-12 (a school's morning sign-in; identity Gate 1, D-058)

**Head:** `8a3eb6a`, with `main` merged in three times:
- `b346144` (LANA-04) as `c751350`, before the work;
- `1c52bea` (LANA-05 and 06, the board) as `e5c2b1c`: content under `docs/`, and one change to `audit/staging/journey.mjs`, which no selftest reads (lint-clean);
- `7a9bf8e` (**DAISY-26**) as `8a3eb6a`, with no textual conflict.

**Manifest:** both sides were at 108, so it is **109**, with every entry kept: main's 399 ids and BOB-12's seven, 406 in all. `hle.ts` keeps Daisy's keys and my two health-card sentences, still marked for her.

**Code:** `3623725`, which meets both approvals' conditions (see ROUND 2 below). BOB-31 is its own commit, `70afa3e`.

**One run:** ci #224. ci #222 on `e5c2b1c` was cancelled as soon as the approvals arrived, because it no longer tested the head.

**Gated with DAISY-13** (D-043): this lane carries only a minimal card-form change so it stands alone; see INTEGRATION.

## ROUND 2: the approvals' conditions (29 Sep)

**(A) The cooldown as the service role, behind `src/app/api/` via the rewrite:**
- **Service role only.** F15-N01 now asks both roles, `anon` and `authenticated`, to run **both** functions, and all four are refused with 42501. By hand, granting `authenticated` execute on the attempt turns it red: `authenticated can call the card cooldown; a signed-in client ran card_signin_attempt`. Plant bob12-7 does the same for anon.
- **One service-role client per request, for the two calls only.** `const layanan = supabaseService()` is made inside `POST` and used for `card_signin_attempt` and `card_signin_settle`, and nothing else. BOB12-K01 reads the source for exactly that. Moving the client out of the request turns it red: `the service-role client is not made once, inside the request's own handler`.
- **Same origin by `Origin` or `Sec-Fetch-Site`:**
  - a `Sec-Fetch-Site` other than `same-origin` (cross-site, same-site, none) is refused, whatever the `Origin`;
  - a foreign or `null` `Origin` is refused, whatever `Sec-Fetch-Site` says;
  - a request with neither signal is refused;
  - `Sec-Fetch-Site: same-origin` alone is accepted.

  BOB12-K01 covers each case. BOB12-A01 sends a cross-site POST (`Sec-Fetch-Site: cross-site`, no Origin) against the running route and expects 403 and no session. Rehearsed locally, it got exactly that. Ignoring `Sec-Fetch-Site` turns K01 red: `Sec-Fetch-Site cross-site is overruled by a matching Origin; a same-site (sibling subdomain) POST is accepted`.
- **Declared.** `public_surface_registry` gains `card_signin` (ROUTE, `/masuk/kartu`) and its child `card_signin_api` (ENDPOINT, `/api/masuk/kartu`), in the same shape as the certificate verification route. The migration is corrected in place (lane-only and unmerged, D-026), and its own final check asserts both rows.
  - `assert_public_surface` holds: `2 distinct anon-reachable surface(s): card_signin (ROUTE), certificate_verification (ROUTE)`.
  - F15-N01 checks the rows. Deleting them turns it red: `the card sign-in route or its rewrite target is not in public_surface_registry`.

**(B) `TIDAK_DINILAI` only for an answer that says nothing about the credential.** `jenisGalatAuth` in `src/lib/kartu-masuk.ts` sorts Auth's refusals into two groups.
- **Taken back:** Auth's 429, a 5xx, and no answer at all: a network failure, or the route's **new 10 s timeout** on Auth (`AbortSignal.timeout`). Both come back as `AuthRetryableFetchError`.
- **Counted:**
  - every 4xx: a wrong card or PIN, an unconfirmed or banned account, 401, 403, 422;
  - an error that fits none of these;
  - a throw.

  A judged non-match returns `CARD_NOT_MATCHED` before any take-back code runs.
- **Tests:**
  - BOB12-K01 drives every case above.
  - **F15-P02** runs two unjudged attempts, taken back, around each judged one, and **exactly 5 judged attempts go ahead before the card waits**.
- **Reds:**
  - Letting the take-back run for a non-match turns K01 red: `a wrong PIN was taken back: a judged attempt must always count` (the same for every 4xx).
  - Counting nothing for an unexplained error turns it red: `an error that says nothing of itself was taken back`.
  - A new plant, **bob12-9** (an unjudged settlement that clears the whole record), turns F15-P02 red: `… judged attempt(s) went ahead before the card waited`.
- **Rehearsed:**
  - Auth answering 503, seven times in a row → seven calm 503 `CARD_UNAVAILABLE` with a reference each, 0 counted, never a cooldown.
  - Auth never answering → 503 after 10.1 s, 0 counted.
  - A wrong PIN is still counted, as before.

**(C) `x-real-ip`.** Proven on staging instead; see ACCEPTANCE.

**What the declaration moved** (restated for the changed requirement, named):
- The schema lint's `anon_public_surface` goes 1 → 2 and `anon_reachable_http_paths` 2 → 4, in `src/lib/kesehatan-skema.json` (the one list the Konfigurasi health card and F01-T13 judge by) and in F05's own check (`selftest/db/fable05.sql`).
- The two health-card sentences are updated in `hle.ts` (see COPY).

## CHANGED

### (a) Auth sees the student's address, and only Auth does
`src/lib/auth-forwarding.ts` is `server-only` and the **one reader** of `SUPABASE_AUTH_FORWARDING_KEY` (design condition 1).

**Which requests carry it.** `fetchBerpenerus(alamat)` adds the secret key (`apikey`, and `Authorization` when it was the publishable key) and `sb-forwarded-for` **only** to:
- `POST <project>/auth/v1/token?grant_type=password`: a sign-in;
- `POST <project>/auth/v1/token?grant_type=refresh_token`: a refresh;
- **`POST <project>/auth/v1/verify`**: a code check. This is the Gate 1 reconciliation (C15). `generate_link` stays out.

**How exactly it matches:**
- the project's own origin, that exact path, that method and exactly one of those grants;
- no embedded credentials in the URL;
- every other request goes out exactly as the client built it;
- a `sb-forwarded-for` already on a request is always removed;
- a user's own bearer token is never replaced.

**The address** comes only from `x-real-ip`, and must parse as a single IP (`node:net` `isIP`).
- `x-forwarded-for` and a client's own `sb-forwarded-for` are never read.
- Vercel sets `x-real-ip` to the connecting client's address and overwrites a client-sent value ([Vercel request headers](https://vercel.com/docs/headers/request-headers)). This session's egress blocks vercel.com, so I cite this from the documentation as I know it; please confirm it when gating.

**When nothing is forwarded.** Nothing changes when any of these holds:
- there is no key;
- the key is not an `sb_secret_…` key (a legacy service-role JWT is treated as absent);
- there is no usable address.

**Where it is used:**
- the proxy's session refresh (`src/proxy.ts`);
- the card route's sign-in.

The service-role client never uses it. F01-S03 now names the key in its bundle scan and holds it to the one reader behind `server-only`.

### (b) A card waits after failures
Migration `20261019100000_a_card_waits_after_failures.sql`, the 125th.

**The rule:**
- 5 attempts within 15 minutes are free.
- After that, each attempt waits 30 s after the one before, then 60, 120, 240, and never more than 300 s.
- An attempt older than 15 minutes is forgotten.
- A waiting attempt is not recorded. It is never a lock.

**How the route uses it:**
- **Before Auth:** `card_signin_attempt(key)` records the attempt atomically, under the card row's lock, and returns the wait.
- **After Auth:** `card_signin_settle(key, outcome)` settles it.
  - `MASUK` (signed in) clears the record.
  - `TIDAK_DINILAI` takes the attempt back, only when Auth's answer says nothing about the credential: its own rate limit (429), a 5xx, a network failure or the route's 10 s timeout (approval (B)).
  - A non-match stays counted.

**The key** is `kunciJedaKartu(card)` in `src/lib/card.ts`: an HMAC-SHA256 of the card number under the card pepper, with its own label.
- The database never sees a card number.
- Every number typed is counted the same way, existing or not.

**Storage:**
- RLS on, no policies, no grants (anon, authenticated and service_role all hold none).
- Both functions: owner-defined, pinned search path, executable by **service_role only**.

### (c) `POST /masuk/kartu` answers in codes, and is the only way a card signs in
**Where it lives.** `next.config.ts` rewrites `/masuk/kartu` (already in the proxy's public paths; closes N12) to `src/app/api/masuk/kartu/route.ts`.
- The route wires the outside calls.
- `src/lib/kartu-masuk.ts` decides.
- `src/lib/kartu-kontrak.ts` holds the codes.

**The answers.** Always JSON, always `no-store`:

| HTTP | body | when |
|---|---|---|
| 200 | `{ ok: true, tujuan }` | signed in; `tujuan` is `tujuanMasuk(lanjut)` (narrowed, else the role's home); session cookies with the card's 3600 s |
| 401 | `CARD_NOT_MATCHED` | wrong PIN, a card nobody holds, an account that cannot sign in, empty or absurd input (nothing asked for the last) |
| 429 | `CARD_COOLDOWN`, `tunggu`, `Retry-After` | the card's cooldown; **Auth is not asked** |
| 429 | `CARD_RATE_LIMITED` (+ `tunggu` and `Retry-After` only when Auth gave one) | Auth's per-address limit; the attempt is taken back |
| 403 | `CARD_REQUEST_REFUSED` | not same-origin: a `Sec-Fetch-Site` other than `same-origin`; an `Origin` that is `null` or neither the app's configured origin nor the origin the request was addressed to (Next's server-action rule); or neither signal |
| 503 | `CARD_UNAVAILABLE`, `ref` (6 upper-case characters) | Auth or the database could not be asked (Auth is given 10 s); logged with `ref`, never the card number or PIN |

- **`GET /masuk/kartu`** → 303 `/masuk`.
- **`signInWithCard` is deleted** (design condition 3). No server action anywhere in `src/` signs in with a password, and BOB12-K01 checks that.
- **`LayarMasuk`**: the smallest change that keeps this lane standing alone. It posts the form to the route, goes to `tujuan` on success, and shows today's one "Belum cocok" for every refusal. DAISY-13 replaces it (see INTEGRATION).

### Where this differs from the approved design, and why (1 and 2 approved on conditions, met in ROUND 2)
1. **The cooldown runs as service_role, not with the publishable key.** The approved text said the publishable key. But FABLE-01 and FABLE-04 hold that **the anonymous principal executes nothing** (F01, F04 assert it). F01-S03 also allows the service-role client only under `src/app/api/`.
   - So the functions are service_role-only, exactly like `assume_persona`, and are not client RPCs (not in `client_rpc_registry`).
   - The handler lives under `src/app/api/`, reached by the rewrite. The public address and the contract are unchanged.
2. **A third settlement, `TIDAK_DINILAI`.** An attempt Auth never judged is taken back, so a school's busy morning or an Auth outage never counts against a student's card. Only the server can do it, and only after Auth refused without judging the PIN, so it opens nothing.
3. **Same origin also accepts the origin the request was addressed to.** That covers a deployment alias as well as `NEXT_PUBLIC_APP_URL`. A foreign page cannot choose that origin, and a browser always sends `Origin` on this POST.
4. **The `ref` is 6 upper-case characters** (`rujukan()`, D-011), which is what DAISY-13 reads. The contract's example was lower-case.
5. **No copy keys in `kartu-kontrak.ts`.** The words are DAISY-13's (D-014).

## PROOF

| test | red before | green after |
|---|---|---|
| **BOB12-K01** (static): the route's decisions, driven with every outside call recorded, plus its wiring | on `c751350` (before BOB-12): `the server action signInWithCard still signs a card in … there is no card sign-in route … next.config.ts does not rewrite it … a server action signs in with a password: src/app/masuk/actions.ts; there is no card sign-in decision` | pass |
| **BOB12-K02** (static): the real Supabase client through the forwarding fetch, with a recording fetch | `there is no forwarding: src/lib/auth-forwarding.ts has no fetchBerpenerus and alamatKlien` | pass |
| **F15-P01, P02, N01** (db, `selftest/db/fable15.sql`): the rule, the settlement, the storage | without the migration the suite cannot even be defined (`card_signin_cooldowns` does not exist) | pass |
| **F15-C01** (db, `run.ts`): 20 connections at once on one card | with the row lock removed: `6 of 20 simultaneous attempts went ahead to Auth; exactly 5 may` | 5 go ahead, 15 wait 30 s, 5 recorded, a sign-in clears it |
| **BOB12-A01** (app, live Auth, CI only): card 7001 through the running route | the route does not exist | runs in CI; rehearsed locally below |

**Each test also goes red on a planted defect in my own code** (the file restored after each):
- every POST to the project forwarded → K02: `a function call (POST) … carried the secret forwarding key`;
- the address read from `x-forwarded-for` → K02: `… give the address 9.9.9.9, expected 203.0.113.7`;
- Auth asked before the cooldown → K01: `Auth was asked for a card in its cooldown`;
- the route skipping same-origin → K01: `the route does not decide same-origin from the request's own headers`.

**Plants** `bob12-1` to `bob12-9` are on a new red case, **`db-bob12-gates`** (control 3). Each turns its own F15 test red for its own reason; all 9 of 9 are proved locally:
1. a card never waits;
2. no cap;
3. nothing is forgotten;
4. a waiting attempt is counted;
5. a sign-in clears nothing;
6. an unjudged attempt stays counted;
7. anon can call the settlement;
8. authenticated can read the table;
9. an unjudged attempt clears the whole record.

**Rehearsed against the production build.** The Auth stand-in checks the seeded bcrypt password, and it logs only whether the key and an address arrived, never their values.

| request | answer |
|---|---|
| card 7001, wrong PIN | 401 `CARD_NOT_MATCHED`, no session, 1 counted |
| card 7001, its own PIN | 200 `{"ok":true,"tujuan":"/belajar"}`, one session cookie with Max-Age 3600, record cleared; `/belajar` answers 200 with it |
| five recent failures, own PIN | 429 `CARD_COOLDOWN` `tunggu` 30, `Retry-After: 30`, no session, Auth not asked |
| Auth answering 429 with `Retry-After: 42` | 429 `CARD_RATE_LIMITED` `tunggu` 42, attempt taken back (0 counted) |
| another site's `Origin`, no `Origin`, a cross-site POST (`Sec-Fetch-Site: cross-site`) | 403 `CARD_REQUEST_REFUSED`, nothing counted |
| a same-origin POST sending only `Sec-Fetch-Site: same-origin` (wrong PIN) | 401 `CARD_NOT_MATCHED`, 1 counted |
| Auth answering 503, seven times | 503 `CARD_UNAVAILABLE` each with its own `ref`, 0 counted, no cooldown |
| Auth never answering | 503 `CARD_UNAVAILABLE` after 10.1 s, 0 counted |
| `GET /masuk/kartu` | 303 → `/masuk` |
| `POST /api/masuk/kartu` signed out | 401 (the proxy; not the public door) |
| an expired session on `/belajar` | 200 with a refreshed session (the proxy's refresh) |

**What the stand-in saw:**
- `POST /auth/v1/token?grant_type=password` and `?grant_type=refresh_token` arrived with the **secret key and the address** (`203.0.113.9`, `198.51.100.4`).
- Every `/rest/v1` call arrived with **neither**. That covers `card_signin_attempt`, `card_signin_settle`, `role_assignments` and the learner's RPCs.
- A request with forged `x-forwarded-for` and `sb-forwarded-for` and no `x-real-ip` reached Auth with the publishable key and no address.

**Restated for a changed requirement** (named; no test weakened, skipped or deleted):
- **L2-KONTRAK-01:** the card path's three properties (`signInWithPassword`, no sign-up, the server-derived secret) are now asked of the route and `kartu-masuk.ts`. The actions file is now held to signing in no card.
- **DAISY-04-TIDAK-ADA-01:** its two missing public paths are now under `/verifikasi/`, since `/masuk/kartu` now exists. This is **word for word DAISY-13's own restatement** (`afc1066`), code and manifest.
- **UX1-MASUK-PRIVASI-01**, card line only: "one value for every refusal" is now asserted of the route. There is exactly one non-match code, no code names a card, a PIN or existence, and the decision returns `CARD_NOT_MATCHED` for every judged refusal. DAISY-13 restates the same line for its screen.
- **F05's schema-lint counts and `src/lib/kesehatan-skema.json`:** `anon_public_surface` 1 → 2 and `anon_reachable_http_paths` 2 → 4, because the card route and its endpoint are declared (approval (A)).
- **UX1-BRAND-02 and UX1-TUR-ORANG-01:** the migration tripwires move 124 → 125, with the reason written beside them. The new table is `card_signin_cooldowns (kunci, percobaan, diperbarui)`: no mark or brand column, and no tour RPC.

## CI
[ci #224](https://github.com/yazidmanan2409/pintar40/actions/runs/36525443544) on `8a3eb6a`, dispatched once and not waited on; please read the result there.
- **Local, before dispatch, every database with an `en-US` ICU collation, on `3623725`:**
  - **Full suite, fresh database, clean build:** 373 passed, 0 failed, 30 justified skips. BOB12-A01 is among the justified: it needs live Auth and runs in CI. One unjustified skip is UX1-PIMPINAN-AKSES-01 (network), as before this change. F01-R07 passed.
  - **Plants:** 100 of 100 proved their gate on a copy taken straight after the seeds (the 91 before, plus bob12-1 to bob12-9).
  - **Shared red cases:** all 16 gates, `db-bob12-gates` included, exited 0 on one shared stack. The schema digest stayed the same, and every recheck was 246 of 246.
- **On the merged head `8a3eb6a`** (DAISY-26 changes only pages, components, `experience.css`, `hle.ts`, the experience tests and the manifest; nothing under `supabase/`, `selftest/db/`, `selftest/plants/`, `scripts/` or `src/app/api/`, so the database proof above still holds):
  - typecheck and lint clean;
  - a clean production build;
  - every static and app test: 136 passed, 0 failed. That includes DAISY-26-BELAJAR-01 and -MENGAJAR-01, F01-S03, F06-S04, UX1-MASUK-PRIVASI-01, L2-KONTRAK-01, both tripwires, BOB12-K01 and BOB12-K02.
- The one new job is the `db-bob12-gates` red case, now 9 plants.

## CONTRACT
- The route and codes are as published on 24 Sep, with the five differences above.
- `supabaseServer` takes an optional `fetch`.
- No database RPC changed for clients.

## MIGRATIONS
- `20261019100000_a_card_waits_after_failures.sql` (additive: one table, two service-role functions, two `public_surface_registry` rows).
- Lane-only and unmerged, so it can still be corrected in place (D-026).

## COPY
- The card screen's words are DAISY-13's.
- **Daisy, please confirm or replace these two** (D-014). Declaring the card route made both health-card sentences untrue, so I changed them:
  - `config.kesehatan.cek.anon_public_surface`: «Tepat dua permukaan publik: pemeriksaan sertifikat dan masuk dengan kartu kelas» / «Exactly two public surfaces: certificate verification and class-card sign-in».
  - `config.kesehatan.cek.anon_reachable_http_paths`: «Tepat empat alamat publik yang dinyatakan: pemeriksaan sertifikat dan masuk dengan kartu kelas, masing-masing dengan alamat di baliknya» / «Exactly four declared public addresses: certificate verification and class-card sign-in, each with the address behind it».
- The terminology inventory (rows 830, 831 and key `anon_reachable_http_paths`) still shows the old sentences.

## SETTINGS (Yazid and the machine; staging first, production at release with Yazid's go)
For each project, in this order:
1. **The secret key.** Create a secret API key (`sb_secret_…`) in the Supabase dashboard; that's one click for Yazid. The machine writes it into that project's Vercel variables as `SUPABASE_AUTH_FORWARDING_KEY`.
2. **Forwarding on.** Set `security_sb_forwarded_for_enabled` to true (Auth Config). **Staging needs this on once BOB-12 is deployed there**, so Yazid, this is the moment.
3. **Auth's per-address limits for L1**, only after steps 1 and 2 are read back, so raising them never opens PIN guessing:
   - `sign_in_sign_ups` 30 → **400** per 5 minutes;
   - `token_refresh` 150 → **600**;
   - `token_verifications` unchanged at 30.
4. **Auth's database connections** as a percentage, not an absolute 10 (Performance Advisor).

**Order and safety.** Until step 1, nothing is forwarded, and card sign-in works exactly as today, cooldown included. Forwarding without the key forwards nothing. The key without forwarding is ignored by Auth.

## ACCEPTANCE (staging; the coordinator's condition (C))
Once the key and `security_sb_forwarded_for_enabled` are on (SETTINGS steps 1 and 2):
- a card sign-in from the journey runner appears in `auth.audit_log_entries` with **the runner's own address**;
- a sign-in sent with a forged `x-real-ip` does **not** record the forged address.

That is the proof that Vercel's `x-real-ip` is the connecting address and cannot be set by a client.

## INTEGRATION (with DAISY-13)
Where DAISY-13 and this lane touch the same lines, **take DAISY-13's side** (its screen reads every code):
- `LayarMasuk.tsx`: its `masukKartu` and the import line;
- `UX1-MASUK-PRIVASI-01`'s card lines.

DAISY-04's restatement is identical on both sides. `KODE_KARTU` in her `kartu.ts` and my `STATUS_KARTU` hold the same five codes and statuses. DAISY-13-KARTU-02 posts a 10-digit card and a 6-digit PIN from its own origin, and gets 401 `CARD_NOT_MATCHED`, and 403 from a foreign origin, as the route answers.

## BOB-31 (carried here as its own commit, `70afa3e`; no CI run of its own)

**The fault.** F10-V01..V03's fixture (`selftest/db/fable10.sql`, the block at about line 955) set both schools' namespaces in **one UPDATE**.
- Its not-exists check sees the table as it stood before the statement, so both rows could draw the same code.
- Upper-cased md5 hex that passes `^[A-Z]{3}$` is only A–F, which is 216 codes.
- CI #221 hit `institutions_namespace_unique` under plant bob01-17 (found by Daisy, confirmed by the coordinator).

**The fix.** One school at a time, so the second sees the first's code. Each draws three letters from A–Z until one is free (as `fable09.sql` does, with a wider alphabet).

**The repeat.** A scratch script ran two fresh synthetic schools, 2,000 times each, every row rolled back:

| fixture | failures in 2,000 |
|---|---|
| the old one-UPDATE statement | **7** (`duplicate key value violates unique constraint "institutions_namespace_unique"`), about 1 in 286; the prediction was 1 in 216 |
| the new per-school block | **0** |

F10-V01, V02 and V03 still assert exactly what they did. The plants that go through them (bob01-16 to bob01-21) are in the plant run above. Nothing is weakened.

## QUESTIONS
1. **Daisy:** the two health-card sentences in COPY.
2. None else. The approvals' conditions are met as described in ROUND 2.

## READY
Yes, once ci #224 on `8a3eb6a` is green, to be gated with DAISY-13. BOB-31 rides in it. Staging acceptance (C) follows the settings.
