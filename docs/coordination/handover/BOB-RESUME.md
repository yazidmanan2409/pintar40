# Bob: resume note (written 25 Sep, after BOB-07 and BOB-16)

This note is for a fresh session picking up Bob's lane. Read it first, then `docs/coordination/BOARD.md`, `DECISIONS.md` and `briefs/BOB.md`.

## Who, where, how
- **Who.** I am **Bob**, the back-end builder. The coordinator (another session) gates, merges and releases; Yazid relays messages.
- **Lane.** Work on `claude/quirky-meitner-a04smj` only, in repo `yazidmanan2409/pintar40`.
- **State at pause.** The lane head is `ed89063` (BOB-07 and BOB-16, CI #195 green 26/26), and the coordinator is merging it in **Integration 9**.
- **Never:**
  - dispatch a production workflow;
  - edit a `.github/*-request.txt` or a `RELEASE_SHA`;
  - touch the old Supabase project `sknixmwkynzmrgbxzrvb`;
  - disable Vercel protection;
  - print secrets, emails or user ids;
  - rebase or force-push;
  - weaken, skip or delete a test. Restating one for a changed requirement is allowed, and must be named.

## The queue (confirmed by the coordinator)
1. **Merge `origin/main` first** (merge, not rebase; on a manifest `version` conflict, take the higher and add one).
2. **BOB-08, BOB-09, BOB-10, BOB-11.** See the board rows. Hand each off before starting the next if the week's usage is tight.
3. **BOB-17 with DAISY-16** (one CI run).
   - `publish_readiness` and the release functions return each blocker as a code with details. One migration.
   - The test covers every readiness rule, fails on today's sentences, and a planted sentence never reaches the Terbit step.
   - Delete the four unused release form actions (`createReleaseAction`, `freezeReleaseAction`, `publishReleaseAction`, `withdrawReleaseAction` in `src/app/studio/actions.ts`); BOB07-K01 must stay green.
4. **BOB-12 with DAISY-13** (gated together, D-043). The contract was published on 24 Sep; its essentials:
   - **Route.** `POST /masuk/kartu` (already a public path; closes N12). It replaces and deletes `signInWithCard`. `GET` → 303 `/masuk`.
   - **Request.** Form fields `kartu`, `pin`, `lanjut`. Same-origin only: an `Origin` header that is not the app's own is refused.
   - **Responses** (JSON, `no-store`): 200 `{ok:true,tujuan}`; 401 `CARD_NOT_MATCHED`; 429 `CARD_COOLDOWN` with `tunggu` and `Retry-After`; 429 `CARD_RATE_LIMITED` (`tunggu` only when Auth gives one); 403 `CARD_REQUEST_REFUSED`; 503 `CARD_UNAVAILABLE` with `ref`.
   - **Cooldown.** Keyed by HMAC-SHA256 of the card number with the card pepper. 5 free failures in 15 minutes, then 30 s doubling to a **300 s cap**; never a permanent lock. Success clears it. The check-and-record is atomic, before Auth is asked, with a 20-parallel concurrency test. The table has RLS on, no policies and no grants.
   - **Forwarding key.** One reader: a `server-only` `src/lib/auth-forwarding.ts` reading `SUPABASE_AUTH_FORWARDING_KEY`, which is added to F01-S03. Only an exact `POST <project>/auth/v1/token` gets the key and `sb-forwarded-for`. The address comes from Vercel's `x-real-ip` only, checked to be an IP. Test forged headers, a lookalike path, and that no data request carries the key.
   - **L1 limits proposed:** `sign_in_sign_ups` 400 and `token_refresh` 600 per 5 minutes per address.
   - **Open questions** (coordinator): the cooldown numbers, the limits, and the "no wait given" wording (Daisy).
5. **BOB-15 with DAISY-12** (support reports; due before 1 Nov; one CI run).
6. **BOB-13** (before L2, 1 Dec, from the L1 run's figures).

## Per-ticket process
- **Commits.** Each message starts with the ticket id and ends with the Co-Authored-By and Claude-Session lines.
- **Tests.** Each change needs a test that is red without it and green with it, and I keep the red output to quote in the hand-off.
- **Migrations and codes.** Migrations are forward-only and additive (D-026: a lane-only, unmerged migration may be corrected in place). Error codes are stable (D-011; catalogue `src/lib/galat-kontrak.ts`), and UI words live in `src/lib/hle.ts` (D-014: Bob adds keys with his best wording; Daisy owns them).
- **CI economy (D-043):**
  - **Local first:** tsc, lint, focused tests, the full local run, the inline red cases from `ci.yml`, and the plants.
  - **Then one run.** Dispatch `ci.yml` once per hand-off on the lane head (GitHub MCP `actions_run_trigger`, `workflow_id: ci.yml`, `ref` = the lane).
  - **Don't poll in long loops.** Hand off and let the coordinator read the run.
  - **Planted cases** go into an existing red-case job when they can (see `static-fable06-gates` cases 5 and 6).
- **Hand-off block:** CHANGED, PROOF, CI, CONTRACT, MIGRATIONS, COPY, QUESTIONS, READY.

## Local test setup (the container is ephemeral; recreate it)
**Postgres 16 on port 55432.** If it isn't installed, install `postgresql-16`, then `initdb -D /var/lib/pintarpg/data` as `postgres` with trust auth. To start it:
```
su postgres -c "/usr/lib/postgresql/16/bin/pg_ctl -D /var/lib/pintarpg/data -l /var/lib/pintarpg/pg.log -o '-p 55432 -k /var/lib/pintarpg/sock' start"
```
It dies now and then; check with `pg_isready -h localhost -p 55432`.

**A clean database** (the steps the old `clean.sh` ran):
```
createdb -h localhost -p 55432 -U postgres <db>
psql -q -v ON_ERROR_STOP=1 -1 -f docs/coordination/handover/shim_idem.sql "postgresql://postgres@localhost:55432/<db>?sslmode=disable"
./node_modules/.bin/supabase migration up --db-url "<url>" --include-all
for s in 00_local_fixtures synthetic learning_cycle official_bootstrap human_evaluation; do psql -q -v ON_ERROR_STOP=1 -1 -f supabase/seed/$s.sql "<url>"; done
for f in selftest/db/fable0*.sql selftest/db/fable1*.sql; do psql -q -v ON_ERROR_STOP=1 -1 -f "$f" "<url>"; done
```

**`shim_idem.sql`**, the minimal Supabase shape, is committed beside this note as `docs/coordination/handover/shim_idem.sql`. It holds:
- roles `anon`, `authenticated`, `service_role` (bypassrls), `supabase_auth_admin`, and `authenticator` (granted the first three), all granted to `postgres`;
- schema `extensions` with `pgcrypto` and `uuid-ossp`;
- schema `auth` with `users` (id, instance_id, aud, role, email unique, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change, last_sign_in_at) and `identities`;
- `auth.uid()` returning `nullif(current_setting('request.jwt.claim.sub', true),'')::uuid`;
- `storage.buckets` and `storage.objects` (RLS on);
- `supabase_migrations.schema_migrations(version, name, statements text[])`.

**The full local run:**
```
SUPABASE_DB_URL="postgresql://postgres@localhost:55432/<db>?sslmode=disable" NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 NEXT_PUBLIC_SUPABASE_ANON_KEY=fake npx tsx selftest/run.ts --accept-justified-skips [--only=ID,ID]
```
- **Known local-only results:** F01-R07 fails, F01-R01 fails at random, and UX1-PIMPINAN-AKSES-01 is skipped (network). Tests that need network run only in CI.
- **Before a run,** kill stale servers with `ps -eo pid=,comm= | awk '$2 ~ /^next-server/ {print $1}' | xargs -r kill -9; rm -rf .next`. Never `pkill -f` a pattern that appears in the command itself.
- **Plants:** `node scripts/dev/plants.mjs run --gate=<gate> --db-url=<url>`.
- **Inline red cases:** copy each case's shell from `ci.yml` and run it on a fresh database. Afterwards, remove any untracked `r*.txt`, `c01-*.txt` or `orig.sql` from the repo root.
- **Rehearsing a network-only app test:** a small fake Auth/REST server on :54321 (answering `/auth/v1/health`, `/auth/v1/token`, `/auth/v1/user`, `my_profile`, and `rpc/can_*` → true) worked for BOB06-R01 and BOB07-R01's Studio half. It gives a red run before CI. Build the old code in a `git worktree` with a **hard-linked** `node_modules` (`cp -al`), because Turbopack refuses a symlink.

## Open items handed to the coordinator (no action unless asked)
- **BOB-05:** hosted Auth `inactivity_timeout` 168h, set by the coordinator's machine.
- **BOB-06:** `buktiPerKelas` costs about 4 evaluator calls per class per page load; this is fine at L1.
