# B1 · Accountability events: completion page

**Lane B. Effort M. Review before build: Sharon.** Status: awaiting that review. No code yet.

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
`institution_id` when known · `outcome` · `network_origin` (IPv4 /24 or IPv6 /48 only) · `resource` (print only) · `at`.

**Never stored:** a password, code, PIN, card secret, full IP address, user agent, device fingerprint, or the typed
identifier.

## Refused

- Any direct insert, update, delete or select by a client role. Writes go through one service-level writer; reads through
  one reader.
- Any deletion except by the purge.
- A school admin reading another school's rows, or rows with no school.
- Any report, metric or calculator reading the store: it is not a metric source, and a test refuses it as one.

## History kept

`audit_log` keeps everything it records today; `identity.session_ended` and the recovery rows are unchanged. The store is
ordinary application data and is in the backup. History starts when the migration lands; there is no backfill.

## Failure behaviour

- A failed write never blocks a sign-in or a sign-out: the route logs it (without the identifier) and proceeds.
- A print is different: no event, no reference, no official print (B2).
- A retried HTTP request writes one row: the write is made once, after the route's final answer.
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
  update, delete or select. Reader bounds by school. A row aged 12 months and a day is purged with one audit row; a row
  at 11 months stays. Two concurrent purge runs delete each row once.
- **App:** each sign-in method and each failure code through the running app; sign-out; a retried request writes one
  row; a simulated writer failure does not block sign-in.
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

## Questions for Sharon

1. **Network origin.** IPv4 /24 and IPv6 /48 only, shown to the platform admin only. Acceptable under O41-4, or too
   precise or too coarse to serve its purpose?
2. **Identifier hash for an unresolved failure.** Reusing the rate limiter's keyed hash lets an admin see repeated
   failures against one typed identifier without storing it. Is that hash's key and scope acceptable for a 12-month
   record, or must the store use its own key?
3. **Write placement.** One write per attempt, after the route's final answer, with a failed write logged and ignored
   for sign-in. Is "proceed on writer failure" acceptable at this boundary, given a print refuses instead?
4. **The shared installer.** One function declaring every PINTAR job, called by the migrations and by the restore
   procedure, plus a health check for a native restore (F-8). Any objection to A1's installer becoming a call to it?
