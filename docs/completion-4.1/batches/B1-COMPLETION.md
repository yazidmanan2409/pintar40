# B1 · Accountability events: completion page

**Lane B. Effort M. Review before build: Sharon.** Status: **pre-build PASS** (Sharon, at `d242205d`; the three blockers of `fece55a1` resolved). Released for build.

**Source:** THE PLAN §5.1, owner approved 11 Nov 2026 (`claude/bob-41-master-plan` `17cf4a7e`), with C1w finding F-8
(§7.7). This page restates the plan for the review; where they differ, the plan wins.

## Why

Verified in the code at `3a190dbf`:
- A successful sign-in leaves no durable record. A failed one leaves only a 15-minute rate-limit counter
  (`identity_attempts`, `card_signin_cooldowns`), deleted on success.
- Sign-out audits `identity.session_ended` in `audit_log`; PIN recovery audits `identity.recovery_pin_*`. Nothing records
  a print.
- Nothing enforces retention: `institutions.retention_days` exists and nothing reads it.
- A native Supabase restore does not reinstall A1's scheduled job (F-8). PINTAR's own restore procedure does.

A school must be able to answer "who signed in, who failed to, who printed this" for twelve months (O41-13), without
PINTAR watching what people do (O41-4, C5: accountability, not surveillance).

## Operations

| Operation | Who | Result |
|---|---|---|
| **Record a sign-in**, success or failure, by password, card, magic link, code or recovery PIN | the sign-in route, once its answer is final | One event row per attempt. A failure carries the route's own stable code, never Auth's text |
| **Record a sign-out** | the sign-out path | One event row |
| **Record a print request** | B2's print path | One event row with the report kind and scope. B2 refuses an official print without it |
| **Read events** | a school's admin (their school's rows); the platform admin (all rows, including those with no school) | A paged list, filtered by kind, person and date range, searchable by a print reference. No export, no delete |
| **Purge events older than 12 months** | a daily scheduled job | Rows deleted in bounded batches; one audit row per run that deleted anything (count, oldest and newest instant) |
| **Install every PINTAR scheduled job** | the migration, the restore procedure, and the native-restore runbook step | One idempotent installer for A1's job and B1's; A1's installer becomes a call to it |
| **Report a missing scheduled job** | a health check | Lists each job the installer declares that the database lacks (F-8) |

## The event row

`kind` (SIGN_IN_OK, SIGN_IN_FAILED, SIGN_OUT, PRINT_REQUEST) · `method` (PASSWORD, CARD, LINK, CODE, RECOVERY_PIN; sign-in
only) · `person_id` when resolved · `identifier_hash` for a failure (the keyed hash the rate limiter already computes) ·
`institution_ids` (the person's live affiliations at that instant; see below) · `outcome` · `network_origin` (IPv4 /24 or IPv6 /48 only) · `resource` (print only) · `at`.

**Never stored:** a password, code, PIN, card secret, full IP address, user agent, device fingerprint, or the typed
identifier.

## Blocker 1 · A person at more than one school (settled)

`institution_ids uuid[]` replaces a single school. At the instant of the event it holds every school where the person
is live: a role assignment not revoked and within `valid_from`/`valid_until`, or an enrolment that is PENDING or ACTIVE.
It is an immutable historical snapshot: it is never recomputed when roles or enrolments change later.

- A school admin reads an event only when their school is in its `institution_ids`.
- An event with an empty `institution_ids` (an unresolved identifier, platform staff) is the platform admin's only.
- **Tests:** a person affiliated with two schools: each school's admin reads the event. A school the person left before
  the event, and one the person joins after it, read nothing. Changing the person's affiliations afterwards changes no
  stored snapshot.

## Blocker 2 · Independent attempts (settled)

**One processed attempt writes exactly one row; one request never writes two.**
- Two attempts the route processes independently write two rows, including a client retrying after a failed sign-in.
- A retry inside the route (its own repeated call to Auth for the same attempt) does not write a second row: the write is
  made once, after the route's final answer for that request.
- **Tests:** two failed attempts in a row write two rows; one request whose internal call to Auth is retried writes one.

## Blocker 3 · Governed personal-data deletion (settled)

`hapus_data_pribadi` (L4) is extended: for that person's accountability rows it sets `network_origin` and
`identifier_hash` to null, and keeps `kind`, `at` and `person_id`.
- This is the store's one narrow exception to insert-only, besides the purge. The guard admits exactly this update (those
  two columns to null, nothing else) and only while the deletion transaction's own local marker is set, in the pattern
  of the existing `pintar.anonimkan_email` marker.
- **Test (L4 regression):** after `hapus_data_pribadi`, the person's rows keep kind, instant and person, and hold no
  origin and no hash. The same update without the marker is refused. Other people's rows are untouched.

## Sharon's technical conditions (adopted)

- **Network origin:** taken only from the trusted client address (`alamatKlien`, which reads `x-real-ip`); an
  IPv4-mapped IPv6 address is normalised to IPv4 before the /24 is taken. Never from any other header.
- **Identifier hash:** one store-specific purpose label over the normalised typed identifier, using the existing pepper.
  Never over the IP address. **Rotating the pepper breaks the link to older hashed identifiers**; this is stated in the
  migration's header and in the runbook.
- **Writer failures:** the write has a short timeout and happens before the route sends its response. For sign-in and
  sign-out it fails open (the route proceeds), but every failure is counted, and the health check reports a nonzero
  count.
- **Print evidence:** fails closed. If the print's accountability reference cannot be written, there is no official print
  (B2).
- **Shared installer:** idempotent; it declares each job's name, schedule and command; the health check compares that
  declaration with `cron.job` and reports any job missing or different.

## Execution details kept (Sharon's non-blocking points)

- The purge deletes through a guarded path only, in bounded batches with `FOR UPDATE SKIP LOCKED`.
- Retention is exactly 12 months, a constant in the function.
- A print reference is stable and indexed, so «Jejak audit» finds it by typing it.
- A magic-link sign-in is recorded at the callback, when the link is used, not when it is requested.

## Execution requirements (Sharon's PASS, 11 Nov; the third from the owner via Bob)

1. **`institution_ids` is derived inside the database** from `person_id`, at the instant the writer runs. The writer
   takes no affiliation from the application; a route cannot supply or influence it.
2. **A magic-link request for an unknown address** is recorded as `SIGN_IN_FAILED` / `LINK`, holding only the governed
   identifier hash. Separate requests are separate events. Sending a link to a known address is not a sign-in and
   writes no success; success is recorded only at the callback, when the link is used.
3. **An event with a resource (a print)** takes `institution_ids` from the single school that owns the resource, computed
   in the database, never the person's affiliations and never from the route (owner, via Bob, 11 Nov; for Sharon at her
   result review). Test: a person at two schools prints at school A; A's admin reads it, B's admin does not.

## Refused

- Any direct insert, update, delete or select by a client role. Writes go through one service-level writer; reads through
  one reader.
- Any deletion except by the purge.
- A school admin reading an event whose `institution_ids` does not hold their school, or an event with none.
- Any report, metric or calculator reading the store: it is not a metric source, and a test refuses it as one.

## History kept

`audit_log` keeps everything it records today; `identity.session_ended` and the recovery rows are unchanged. The store is
ordinary application data and is in the backup. History starts when the migration lands; there is no backfill.

## Failure behaviour

- A failed write never blocks a sign-in or a sign-out: the route logs it (without the identifier), counts it, and
  proceeds. The health check reports a nonzero count.
- A print is different: no event, no reference, no official print (B2).
- One processed attempt writes exactly one row; one request never writes two (blocker 2).
- Two purge runs at once delete each row once (`FOR UPDATE SKIP LOCKED`); a failed run changes nothing and retries the
  next day.

## Screens and states

One reader section in Konfigurasi, beside «Jejak audit», with its paging and wording layer.
- States: empty («recorded since {date}»); no match; a page of rows; refused (not an admin); a purged print reference
  («Referensi ini tidak ditemukan. Catatan cetak disimpan 12 bulan, sejak {tanggal mulai}.»).
- Each row: when (the school's zone; rows with no school in WIB, with its word), who (name, or «pengenal tidak dikenal»),
  what, how, the outcome in plain words. The network origin is shown to the platform admin only.
- Below 640 px, the Collection's stacked rows. No print.
- Each failure outcome has one `hle.ts` key, worded as the sign-in screen's own refusal.

## Tests: red before, green after

- **Database:** a successful and a failed sign-in each leave exactly one row (red today: none). No row holds a password,
  code, PIN or full address (a scan over every text column after a full sign-in matrix). A client role cannot insert,
  update, delete or select. Reader bounds by the `institution_ids` snapshot, including the two-school case (blocker 1).
  The L4 deletion clears origin and hash only, under its marker (blocker 3). A row aged 12 months and a day is purged with one audit row; a row
  at 11 months stays. Two concurrent purge runs delete each row once.
- **App:** each sign-in method and each failure code through the running app; sign-out; a retried request writes one
  row and two attempts write two (blocker 2); a simulated writer failure does not block sign-in and is counted.
- **Static:** the store is not a metric source; only the helper calls the writer; no copy names the mechanism.
- **Recovery:** the restored database has both jobs; with a job removed by hand, the health check reports it.
- **Regression:** every existing identity test green unchanged (F15 to F18, BOB26 to BOB29, L2).
- **Pre-flight (§4.1):** B1 writes the local runner for the planted defects written inline in `ci.yml`, and keeps it in
  the repository for every later batch.

## Expected restatements

DR-S14, DR-S15, DR-S16 and DR-D02, if their expectations name the job count (the shared installer, §6.3). A1-K01, A1-S08
and A1-S09 pin A1's installer and job; they are re-pointed to the shared installer only where they name it, with notes.
No identity or recovery test is restated otherwise.

## Out of this batch

School data export and any export event (D-4: 4.2). Click, page-view or behaviour records. Any change to `audit_log` or
to what it records. A school-facing analytics view. B2's printed-report identification itself (B2 uses this store).

## Sharon's answers to the four questions (pre-build review)

1. Network origin: IPv4 /24 and IPv6 /48 from the trusted address only, IPv4-mapped normalised (conditions above).
2. Identifier hash: the store's own purpose label over the normalised identifier; pepper rotation documented.
3. Write failure: fail open for sign-in and sign-out with a counted failure in the health check; fail closed for a print.
4. Shared installer: accepted, idempotent, with declared jobs and schedules checked against `cron.job`.
