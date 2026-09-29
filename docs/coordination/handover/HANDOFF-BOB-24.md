# Bob → coordinator: BOB-24 (identity Gate 2: the identity foundation, DB only)

**SHA:** the lane head is `c0d82c3`. `main` `9e72564` (DAISY-30) came in as `de588a4`, and `ffcd7dc` (DAISY-29) came in earlier as `9bad5e5`. BOB-24's commits:
- **`9d4a2c7`:** the migration, the suite, the plants and the tripwires.
- **`a31a1a8`:** the two standing assertions the first full proof found red (see PROOF).
- **`8a44044`:** your 29 Sep rulings on the six questions.
- **`8ac8959`:** CI #230's finding, the helpers revoked from `service_role` too (see CI).

**Manifest:** the lane's is v120 with 429 ids (the union with `main`'s DAISY-30-TEKS-01), as you directed at the merge.

**CI:** the lane-head run named in the next commit. It is the one run for the lane head, carrying BOB-24's fix, BOB-34, BOB-35 and BOB-36. BOB-34 has its own hand-off, `HANDOFF-BOB-34.md`.

## CHANGED

### BOB-24: one migration, `20261021100000_an_identity_foundation.sql` (the 127th)
1. **The PINTAR ID, `persons.pintar_id`** (D-054 (d), D-059).
   - **Format:** 8 Crockford Base32 characters from 40 random bits (`extensions.gen_random_bytes(5)`). `pintar_id_new()` takes no argument and reads nothing about anyone.
   - **Assignment:** the `persons_pintar_id` trigger draws an ID on insert and redraws while it is taken. Every existing person is backfilled one row at a time.
   - **Constraints:** NOT NULL, a shape check and a unique index.
   - **Immutable:** a change or a clear is refused `PINTAR_ID_IMMUTABLE`.
   - **`pintar_id_canonical(text)`** reads typed input case-insensitively, ignores spaces and hyphens, and reads O as 0 and I or L as 1. Any other shape reads as nothing.
   - **No card-edition table.**
2. **Usernames, `person_usernames`** (C9).
   - **`username_rejection`** returns one code per rule: USERNAME_EMAIL_SHAPE, _LENGTH (4–20), _CHARACTERS (`a-z 0-9 . _`), _NUMBER, _START (a letter), _ID_SHAPE or _RESERVED.
     - **ID shape, as ruled:** exactly 8 characters, all in the alphabet after the ID's own normalisation. «hendra12» and «rootbeer» are refused; «hendra123» and «hendra.12» pass.
     - **Reserved, as ruled:** an exact name from the list (`pintar` included), or one of the prefixes pintar, admin, root, system, support, security, official or resmi **followed by `.` or `_`**. «pintaryanti» passes.
   - **`claim_username(p_name)`** takes a name once per person (USERNAME_ALREADY_SET) and stores it in lowercase. A taken name is refused USERNAME_TAKEN, including in a race. Only a staff person with an EMAIL account who is not a persona may claim; anyone else gets IDENTITY_NOT_ELIGIBLE.
   - **No rename or delete:** the guard refuses USERNAME_FIXED.
   - **`correct_username(person, name, reason)`** is the platform admin's only (42501). It needs a reason (REASON_REQUIRED) and is audited `identity.username_corrected` with from, to and reason.
3. **The personal PIN, `person_pins` and `person_pins_retired`** (D-056 (a)).
   - **`pin_weakness`** refuses every IDENTITY-4.0 §3 category: not 4 digits, one digit repeated, a run up or down (wrapping, 8901), ABAB or AABB, a keypad line, a year from 1950 to 2030, or the spec's top-50 list. The list holds exactly fifty, among them 0000, 1111, 1234 and 4321, as frozen.
   - **Storage:** bcrypt, cost 10.
   - **`set_my_pin`** sets the PIN once (PIN_ALREADY_SET), or again only when a new one is required. A current or retired PIN is refused PIN_REUSED. Each change is audited `identity.pin_set` with `replaced` and no PIN or hash.
   - **`pin_matches(person, pin)`** is internal and executes for nobody. It returns only a boolean. It does the same hashing work when the person has no PIN, and a PIN awaiting reset matches nothing.
4. **Set-up state, `account_setup`** (C10, C13).
   - Every staff EMAIL account is REQUIRED. Existing staff are backfilled, and new accounts get a row from a trigger.
   - Class cards and personas never get a row. A person who becomes a persona leaves the flow.
   - **`my_setup_state()`** returns REQUIRED, COMPLETE or NOT_APPLICABLE.
   - **`complete_my_setup()`** refuses SETUP_INCOMPLETE until a username and a usable PIN are in place, and is audited.
5. **Code counters, `identity_attempts`** (scope CODE_VERIFY, keyed by the route's 64-hex hash of the address).
   - **`identity_attempt`:** 5 attempts free within 15 minutes, then 30 s doubling to a 300 s cap. It is the card cooldown's rule and uses its row lock.
   - **As ruled (C2, C3):** it counts every submitted address hash and never asks whether the address exists, so it answers an existing and a non-existent address alike. The route, in Gate 3, must pass every hash.
   - **`identity_attempt_settle`:** OK clears the record, and NOT_JUDGED takes the last attempt back.
6. **The recovery ladder, `recovery_ladder`** (D-056 (c)–(e)). `recovery_attempt(typed_id, pin)` returns (outcome, wait_seconds, person_id):
   - **The steps:** at level 0, the 3rd wrong PIN gives LOCKED for 1 h. At level 1, the 3rd wrong gives LOCKED for 4 h. At level 2, the 3rd wrong gives SUSPENDED, and the PIN is set to reset_required.
   - **While locked or suspended, nothing is judged,** not even the right PIN.
   - **Decay:** 30 clean days return levels 1–2 to 0. **Nothing decays a suspension.**
   - **Success** resets the count.
   - **An ID nobody holds walks the same steps** with the same hashing work. MALFORMED counts nothing.
   - **The clock is read after the row lock is taken**, so an attempt that queued behind another is judged when it is taken. F16-C03 found the defect.
   - **Restores:** `recovery_restore(person)` (the email-recovery route, service_role) and `admin_reset_recovery(person, reason)` (the platform admin, with a reason). Both return the ladder to 0 and force a new PIN, and the old PIN never works again.
   - **Audit:** every step is audited as `identity.recovery_pin_ok`, `_pin_wrong`, `_locked`, `_suspended` or `_restored`. `security_events(limit)` returns only `identity.*` rows, to the platform admin only.
7. **Surfaces.**
   - **The six tables:** RLS on, no policies, no grant for anon, authenticated or service_role.
   - **`recovery_attempt`, `recovery_restore`, `identity_attempt` and `identity_attempt_settle`:** execute for service_role only, and none is a client RPC.
   - **Helpers** (`pin_matches`, the ID generator and normaliser, the rule functions, `recovery_restore_core`): no execute for anyone.
   - **The seven client functions** are granted to authenticated and registered. The anon principal still executes nothing.
     - The four self-service ones (`claim_username`, `set_my_pin`, `my_setup_state`, `complete_my_setup`) are LEARNER exposure, as ruled, each noted "self-service identity, the caller's own".
     - They refuse a class card and an evaluation persona (C13, C17): the mutating three with IDENTITY_NOT_ELIGIBLE, and `my_setup_state` reads NOT_APPLICABLE.
     - The platform admin's three are STAFF / SYSTEM_ADMIN and refuse with 42501 naming SYSTEM_ADMIN.
   - **A terminal verification block.** The lint came back clean after applying: `unclassified_client_rpcs` 0 and `learner_rpcs_guarded_ok` true.

## PROOF

**New, `selftest/db/fable16.sql`, F16-I01, U01, P01, S01, R01 and N01.** Every row is rolled back by a sentinel.

**Under real concurrency, `runIdentityConcurrency` in `selftest/run.ts`:**
- **F16-C01:** 20 connections each insert 50 persons in transactions held open together, then roll back. All 1000 IDs are well-formed and distinct, no insert fails, and nothing is left behind.
- **F16-C02:** two staff people claim one name at once. The holder's claim goes in, and the other waits and is refused USERNAME_TAKEN. One row holds the name.
- **F16-C03:** 20 wrong PINs for one typed ID at once, as service_role. Exactly 2 are WRONG and exactly one locks for an hour, 17 are told it is locked, the ladder is at level 1, and the audit holds 2 wrongs and 1 lock.
  - **Red before the clock fix,** on the first version of the migration: `the locks were for 3601, 3600 s; each should be about an hour`. A queued attempt read the clock before it waited.

**Red on today's schema** (a database at `main`'s 126 migrations, without 20261021100000): 0 passed, 9 failed.
```
F16-I01  the test could not run: column p.pintar_id does not exist
F16-U01  the test could not run: function public.username_rejection(text) does not exist
F16-P01  the test could not run: function public.pin_weakness(text) does not exist
F16-S01  the test could not run: function public.adalah_persona(uuid) does not exist
F16-R01  the test could not run: column p.pintar_id does not exist
F16-N01  the test could not run: relation "public.person_usernames" does not exist
F16-C01  20 of 20 connections failed; 0 of 1000 inserts returned a PINTAR ID
F16-C02  fixture failed
F16-C03  no fresh typed ID could be drawn
```

**Plants: new gate `db-bob24-gates`** (suite `run_fable16`, control 6 green), 14 plants, each red for its declared reason:

| plant | defect | red |
|---|---|---|
| bob24-1 | the immutability refusal removed | F16-I01 changing a PINTAR ID was answered with success |
| bob24-2 | O, I and L no longer mapped | F16-I01 'o1il-ooOO' is read as nothing |
| bob24-3 | reserved names allowed | F16-U01 'admin' is answered allowed |
| bob24-4 | any rename allowed | F16-U01 a username was renamed |
| bob24-5 | `correct_username` without the admin check | F16-U01 a teacher corrected another person's username |
| bob24-6 | the run check removed | F16-P01 PIN 8901 is answered allowed |
| bob24-7 | `set_my_pin` re-sets at will | F16-P01 a second PIN was answered with success |
| bob24-8 | the first lock lasts 60 s (the answer still says 3600) | F16-R01 the level-0 lock does not hold the ID for an hour |
| bob24-9 | the 30-day decay lifts a suspension | F16-R01 a suspension 400 days old answered WRONG |
| bob24-10 | a restore does not force a new PIN | F16-R01 the platform admin's reset did not force a new PIN |
| bob24-11 | a select grant on `person_pins` | F16-N01 authenticated holds a grant on person_pins |
| bob24-12 | `recovery_attempt` executable by anon | F16-N01 a client can call public.recovery_attempt |
| bob24-13 | `security_events` without the admin check | F16-N01 a teacher ran security_events |
| bob24-14 | set-up completes without a PIN | F16-S01 set-up completed with no PIN |

The `ci.yml` red-case matrix gains `db-bob24-gates`, with the same harness and four proofs.

**Restated for the changed requirement:** UX1-BRAND-02 and UX1-TUR-ORANG-01, the migration tripwires, move 126 → 127, with the reason beside them. The migration adds six tables and one column, `persons.pintar_id`; every column is an identifier, a hash, a state, a counter or a time. There is no colour, mark, logo or brand column, and no tour RPC.

**The first full proof, on `9d4a2c7`, found two standing assertions red.** Both were caused by the migration and are fixed in `a31a1a8`:
- **`assert_engine_takes_no_identity` (F03-T10, F04-T14, F06-P08):** a LEARNER function may take no identity-like argument, and `claim_username(p_username)` matched "user". The parameter is now `p_name`, in `correct_username` too.
- **F06-N02:** its probe expects a platform-admin refusal to name SYSTEM_ADMIN. The three 42501 messages now end "(SYSTEM_ADMIN)".

**Local, on the lane head `c0d82c3`:** every database is built with an `en-US` ICU collation, and with Supabase's default privileges emulated (see BOB-24's CI section):
- **Full suite, fresh database, clean build:** 397 passed, 0 failed, 31 justified skips. The one unjustified skip is UX1-PIMPINAN-AKSES-01 (network), as in every proof before.
  - F16-I01..N01, F16-C01..C03, F05-C01, BOB34-K01, BOB32-K01, F05-T14, F05-T14b, F04-T04, F04-T04c, F04-T04d, F06-N02, F06-P19..P21, F06-S01 and DAISY-30-TEKS-01 all passed.
  - Both migration tripwires passed at 129.
- **Plants:** 123 of 123 proved their gate on a copy taken straight after the seeds. That includes db-bob24-gates 14, db-bob35-gates 5 and db-bob36-gates 4.
- **Shared red cases:** all 19 gates exited 0 on one shared stack. The schema digest stayed the same, and every recheck was 256 of 256.
- **BOB-35's closure query over the proof database:** 0 of 8 committed sessions with items.

## CI
**CI #230** (run `36544435566`, on `a2fdaae`) was **red in one job**: the red case `db-bob24-gates` stopped at its control, `already red before any defect: F16-N01`. The strict selftest contract was then skipped, so F16 had not yet run green in CI.

**Cause:**
- The migration revoked the internal helpers from `public`, `anon` and `authenticated`, but not from `service_role`.
- On a Supabase stack, the default privileges grant every new function to `service_role`, and 0001 (`foundation_base`, lines 17–22) takes that back only from `anon` and `authenticated`.
- F16-N01 holds six helpers to nobody: `pin_matches`, `pintar_id_new`, `pintar_id_canonical`, `username_rejection`, `pin_weakness` and `recovery_restore_core`.
- My local shim does not grant those defaults, so the local proof was green.

**Fix (`8ac8959`, in place under D-026; the migration is unmerged):**
- Every helper revoke now names `service_role` too.
- The four route functions keep their `service_role` grants, as ruled.
- Nothing calls a helper as `service_role`; the routes reach them as their owner.

**Reproduced:** a database built with Supabase's default privileges emulated shows F16-N01 red with exactly those six (`service_role can call public.pin_matches(uuid,text); … public.recovery_restore_core(uuid,text,text)`), then green after the fix.

**The local proof now emulates them.** Every database is built with `alter default privileges for role postgres in schema public grant all on functions, tables to anon, authenticated, service_role` before the migrations, as the Supabase image does. The remaining differences from CI:
- the server is Postgres 16.13, where CI's stack runs 17;
- the Supabase roles and the `auth` and `storage` schemas are shims;
- there is no GoTrue, PostgREST or Storage service, so the network tests are skipped: 31 justified skips, plus UX1-PIMPINAN-AKSES-01.

**BOB-35/36's red-case controls, re-checked the same way:** `db-bob35-gates` and `db-bob36-gates` prove 4/4 and 3/3 on the emulated database.

**The run for the lane head:**
- **the lane-head run named in the next commit**, `workflow_dispatch` on `claude/quirky-meitner-a04smj` at the commit carrying these hand-offs. That commit is docs only; the code is at `c0d82c3`.
- **The previous run, CI #235** (run `36551388380`, on `d4e4ce6`, code `9bad5e5`), was **green**. It is superseded by the gate's fix round for BOB-35 (`91d0cb6`) and BOB-36 (`ec0f65c`), and by the DAISY-30 merge.
- It is the one run for BOB-24's fix, BOB-34, BOB-35 and BOB-36, as directed.
- The red-case matrix carries `db-bob24-gates`, `db-bob35-gates` and `db-bob36-gates`.
- I don't poll it: you read it at the gate.

## CONTRACT
For Gate 3, the routes and Daisy's pages. All refusals are SQLSTATE PR040 with the code in DETAIL, except 42501.
- **Client RPCs (authenticated):**
  - `claim_username(text) → text`, the stored name;
  - `set_my_pin(text) → void`;
  - `my_setup_state() → text`;
  - `complete_my_setup() → text`;
  - `correct_username(uuid, text, text) → text`;
  - `admin_reset_recovery(uuid, text) → void`;
  - `security_events(int) → (at, action, target_table, target_id, summary)`.
- **Route RPCs (service_role only):**
  - `recovery_attempt(text, text) → (outcome, wait_seconds, person_id)`, where outcome is MALFORMED, OK, WRONG, LOCKED or SUSPENDED;
  - `recovery_restore(uuid)`;
  - `identity_attempt('CODE_VERIFY', hex64) → int`, the seconds to wait (0 means go ahead);
  - `identity_attempt_settle('CODE_VERIFY', hex64, 'OK'|'NOT_JUDGED')`.
- **Codes:**
  - PINTAR_ID_IMMUTABLE and IDENTITY_NOT_ELIGIBLE;
  - IDENTITY_NOT_FOUND;
  - USERNAME_EMAIL_SHAPE, USERNAME_LENGTH, USERNAME_CHARACTERS, USERNAME_NUMBER, USERNAME_START, USERNAME_ID_SHAPE, USERNAME_RESERVED, USERNAME_ALREADY_SET, USERNAME_TAKEN and USERNAME_FIXED;
  - PIN_FORMAT, PIN_REPEATED, PIN_SEQUENCE, PIN_PATTERN, PIN_KEYPAD, PIN_YEAR, PIN_COMMON, PIN_ALREADY_SET and PIN_REUSED;
  - SETUP_INCOMPLETE and REASON_REQUIRED.

## MIGRATIONS
`20261021100000`, additive: six tables, one column with a backfill, triggers, functions and registry rows. It is lane-only and unmerged, and was corrected in place under D-026 four times:
- the clock is read after the row lock is taken;
- the parameter is now `p_name`, and the admin refusals name SYSTEM_ADMIN;
- the rulings;
- the helpers are revoked from `service_role` (CI #230). It applies in one transaction (`psql -1`) and through the Supabase CLI.

## COPY
None in this change. The codes above will need sentences in `hle.ts` when Gate 3's pages use them. Ruling 3's copy, suggesting the person add a character to an ID-shaped name, is Gate 3's. That copy is Daisy's (D-014).

## QUESTIONS
None open. Your six rulings of 29 Sep are applied in `8a44044`:
1. **Email-code limits:** kept, and the counter never asks whether the address exists. R01 checks this.
2. **Reserved names:** exact matches, and prefixes only before a separator.
3. **ID-shaped usernames:** refused exactly as ruled.
4. **LEARNER exposure:** noted, with card and persona refusals tested.
5. **PIN list:** trimmed to the spec's top-50. The ten entries dropped are all caught by the run, ABAB or AABB rules, so no PIN's answer changes.
6. **Username lookup:** left to Gate 3.

**Red on `a31a1a8`'s migration** for the new checks: `'pintaryanti' is answered USERNAME_RESERVED, expected allowed`; `the common list holds 60 PIN(s), not IDENTITY-4.0's top-50 with 0000, 1111, 1234 and 4321`; `a self-service identity function is not registered as LEARNER, the caller's own`.

**D-060:** identity only, so the metric catalogue version and `engine_version` are unchanged, as you ruled. Nothing here assembles, draws or scores a paper.

## READY
Yes, for the one run on the lane head (the lane-head run named in the next commit), gated with BOB-34, BOB-35 and BOB-36 as one integration.

---
### Summary (ready to paste)
```
BOB-24 (identity Gate 2, DB only), ready for the gate in the lane head's run (the lane-head run named in the next commit), with BOB-34, BOB-35 and BOB-36.
Lane head c0d82c3; main 9e72564 merged; manifest v120, 429 ids.
- Migration 20261021100000:
  - PINTAR ID on persons (random, immutable, normalised input);
  - usernames (C9 + rulings 2 and 3);
  - a bcrypt personal PIN (the IDENTITY-4.0 top-50);
  - set-up state (staff EMAIL only);
  - code counters (address-agnostic);
  - the recovery ladder (1 h, then 4 h, then suspended; restore forces a new PIN).
- CI #230 was red at db-bob24-gates' control (F16-N01): on Supabase, service_role holds every new function by default.
  Fixed at 8ac8959 (helpers revoked from service_role too); reproduced and re-proved with Supabase's default privileges emulated.
- Tests: fable16 F16-I01..N01, F16-C01..C03; gate db-bob24-gates, 14 plants.
- Local: suite 397/0 (31 justified skips, plus UX1-PIMPINAN-AKSES-01); plants 123/123; shared 19 gates, recheck 256/256; Supabase default privileges emulated.
- D-060: identity only; catalogue and engine_version unchanged.
```
