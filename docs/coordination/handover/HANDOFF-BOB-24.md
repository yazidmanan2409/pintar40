# Bob → coordinator: BOB-24 (identity Gate 2: the identity foundation, DB only), with BOB-34

**SHA:** `@@SHA@@`, with `main` `73c0be5` (Integration 17) merged in as `d823bc9`.
- **BOB-34:** `7445c1b`, its own commit. It rides this run, as ruled.
- **BOB-24:** `9d4a2c7`.
- **Manifest:** v116. BOB-34 took 115 and BOB-24 took 116. main's 413 ids are all kept, plus BOB34-K01 and nine F16 ids: 423 in all. You set the final number.
- **One `ci.yml` run:** @@CI@@.

## CHANGED

### BOB-34: a refused Uji Cepat keeps the teacher's choices (`7445c1b`)
- **`alamatTolakUjiCepat(kode, pilihan, ref?)`** in `src/lib/ujicepat-kontrak.ts` builds the refusal address:
  - `/uji-cepat?cepat=gagal&kode=…[&ref=…]`, followed by `bab`, `soal` and `menit` exactly as the teacher sent them;
  - encoded with `URLSearchParams`, so a value containing `&`, `=`, `?` or `#` comes back whole and cannot override the code;
  - an empty choice is left out.
- **`sediakanUjiCepat`** (`src/app/mengajar/actions.ts`) builds both refusal addresses from `{ bab, soal, menit }` as sent: the named codes, and the QUICK_FAILED catch-all with its reference.
- **No stage parameter.** The page's own links show that without `tahap` the page opens its form. It already reads `q.bab`, `q.soal` and `q.menit` and validates each (`pilihBab`, `pilihSoal`, `pilihMenit`), so the form reopens with the teacher's choices. The page is unchanged; it is Daisy's.
- **BOB34-K01** (static) is new.
- **BOB32-K01 is restated for the changed requirement.** Its wiring check accepts either the old template literals or the two `alamatTolakUjiCepat(kode, pilihan[, ref])` calls. Nothing else in it changed.

### BOB-24: one migration, `20261021100000_an_identity_foundation.sql` (the 127th)
1. **The PINTAR ID, `persons.pintar_id`** (D-054 (d), D-059).
   - **Format:** 8 Crockford Base32 characters from 40 random bits (`extensions.gen_random_bytes(5)`). `pintar_id_new()` takes no argument and reads nothing about anyone.
   - **Assignment:** the `persons_pintar_id` trigger draws an ID on insert and redraws while it is taken. Every existing person is backfilled one row at a time.
   - **Constraints:** NOT NULL, a shape check and a unique index.
   - **Immutable:** a change or a clear is refused `PINTAR_ID_IMMUTABLE`.
   - **`pintar_id_canonical(text)`** reads typed input case-insensitively, ignores spaces and hyphens, and reads O as 0 and I or L as 1. Any other shape reads as nothing.
   - **No card-edition table.**
2. **Usernames, `person_usernames`** (C9).
   - **`username_rejection`** returns one code per rule: USERNAME_EMAIL_SHAPE, _LENGTH (4–20), _CHARACTERS (`a-z 0-9 . _`), _NUMBER, _START (a letter), _ID_SHAPE (anything that reads as a PINTAR ID) or _RESERVED (a list, plus the prefixes pintar, admin, root, system, support, security, official and resmi).
   - **`claim_username`** takes a name once per person (USERNAME_ALREADY_SET) and stores it in lowercase. A taken name is refused USERNAME_TAKEN, including in a race. Only a staff person with an EMAIL account who is not a persona may claim; anyone else gets IDENTITY_NOT_ELIGIBLE.
   - **No rename or delete:** the guard refuses USERNAME_FIXED.
   - **`correct_username(person, name, reason)`** is the platform admin's only (42501). It needs a reason (REASON_REQUIRED) and is audited `identity.username_corrected` with from, to and reason.
3. **The personal PIN, `person_pins` and `person_pins_retired`** (D-056 (a)).
   - **`pin_weakness`** refuses: not 4 digits, one digit repeated, a run up or down (wrapping, 8901), ABAB or AABB, a keypad line, a year from 1950 to 2030, or a common PIN.
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
**BOB34-K01 on today's action:** `there is no refusal address that keeps the choices: src/lib/ujicepat-kontrak.ts has no alamatTolakUjiCepat; sediakanUjiCepat does not keep the chapter, count and time as the teacher sent them; a refusal of sediakanUjiCepat does not carry the teacher's choices back to the form`.

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

**Local, every database with an `en-US` ICU collation, on `9d4a2c7`:**
@@LOCAL@@

## CI
@@CIDETAIL@@

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
- **BOB-34:** the Uji Cepat refusal address adds `bab`, `soal` and `menit`, as sent. The page reads them as before.

## MIGRATIONS
`20261021100000`, additive: six tables, one column with a backfill, triggers, functions and registry rows. It is lane-only and unmerged; it was corrected in place once (D-026), to read the clock after the row lock. It applies in one transaction (`psql -1`) and through the Supabase CLI.

## COPY
None in this change. The codes above will need sentences in `hle.ts` when Gate 3's pages use them. That copy is Daisy's (D-014).

## QUESTIONS
1. **Code-counter numbers.** `identity_attempt` uses the card's rule: 5 free within 15 minutes, then 30 s doubling to 300 s. Is that right for email codes, or should it be stricter?
2. **The reserved list and prefixes.** Is the list in `username_rejection` right? It includes common roles (guru, siswa, kepsek, …) and the prefixes pintar, admin, root, system, support, security, official and resmi. Note that a prefix also refuses ordinary names such as «pintaryanti» and «rootbeer».
3. **ID-shaped usernames.** Any 8-character name that reads as a PINTAR ID is refused USERNAME_ID_SHAPE, so a username can never be mistaken for an ID at the one sign-in box. This refuses ordinary names such as «hendra12» (8 characters, all in the alphabet). Keep it, or refuse only names that are not also plausible words?
4. **Registry exposure.** `claim_username`, `set_my_pin`, `my_setup_state` and `complete_my_setup` are registered as **LEARNER** exposure. L3-F02 requires a mutating STAFF endpoint to declare an authorization kind, and none of the existing kinds means "the caller's own identity". The functions themselves refuse anyone but a staff EMAIL person. Accept LEARNER, or add a SELF kind in a later ticket?
5. **The PIN keypad and common lists.** They are in `pin_weakness`, with 30 keypad lines and 60 common PINs. Are they sufficient, or is there a list you want?
6. **The username resolver** (username → person for sign-in) is deferred to Gate 3 with the route. Confirm.

## READY
@@READY@@

---
### Summary (ready to paste)
@@PASTE@@
