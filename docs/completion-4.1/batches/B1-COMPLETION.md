# B1 · Accountability events: completion page

**Lane B. Effort M.** Status: **CLOSED** on `1fc719b5127313bf24084695fa30d7505e15b5d1` (11 Nov 2026).

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

## Close (11 Nov 2026)

- **Commit:** `1fc719b5127313bf24084695fa30d7505e15b5d1`.
- **Sharon: PASS** on that commit. Two governed limitations: the magic-link success path, which needs a controlled
  integration test before `TAUTAN_MASUK_CADANGAN` is enabled; and the native Supabase restore, covered by its runbook
  step and the health check. One accepted exception: the learner transfer was verified at database level, without a
  rendered journey, because the existing tests already exercise that reader path. Her condition for the suspended
  sign-in correction: B1-A04's note becomes an assertion of `MASUK_TIDAK_COCOK`.
- **Daisy: PASS.** Her record is on `ux-1/daisy-experience` at `c3ab4eac31cded2956c6ec7fe19028a037033beb`.
- **Evidence on that commit:** whole local suite 1072 passed, 0 failed, 0 skipped; planted defects 156 of 156; CI's
  red-case job, run locally, 11 of 11 groups; CI run `43110782265` success; journeys run `43110786290` success
  (including step B1J).
- **Register to B2:** B1-R1 to B1-R5 (`B1-ARCHITECT-CHECK.md` §13), including the completeness notice (B1-R4).
- **Promotion:** B1 is not promoted ahead of the suspended sign-in correction.

## Execution requirements (Sharon's PASS, 11 Nov; the third from the owner via Bob)

1. **`institution_ids` is derived inside the database** from `person_id`, at the instant the writer runs. The writer
   takes no affiliation from the application; a route cannot supply or influence it.
2. **A magic-link request for an unknown address** is recorded as `SIGN_IN_FAILED` / `LINK`, holding only the governed
   identifier hash. Separate requests are separate events. Sending a link to a known address is not a sign-in and
   writes no success; success is recorded only at the callback, when the link is used.
3. **An event with a resource (a print)** takes `institution_ids` from the single school that owns the resource, computed
   in the database, never the person's affiliations and never from the route (owner, via Bob, 11 Nov; for Sharon at her
   result review). Test: a person at two schools prints at school A; A's admin reads it, B's admin does not.

## Result review (Sharon, at `40e89308`): one correction pass

- **Blocker:** the reader returned a person's whole `institution_ids` snapshot to a school admin, disclosing their other
  schools. The snapshot stays stored whole; the reader returns it whole to the platform admin and only the caller's own
  school to a school admin.
- **Bounded cross-module checks** in the same pass: other school-level readers for the same disclosure; suspended, closed
  and anonymised accounts (a generic failure code, correct visibility); a real A-to-B learner transfer; the purge's audit
  visibility and the purged-reference empty state.
- **Follow-ups recorded:**
  - **Magic-link success** needs a controlled integration test before `TAUTAN_MASUK_CADANGAN` can be enabled. Until then
    only a source test covers the callback's success.
  - **Purge capacity:** settled in this pass. The run continues in bounded batches until nothing it may take is left, and
    the health read names any row older than 12 months and a day (B1-S07).
  - **Intentional exclusion:** the evaluator persona's sign-in writes no accountability event.

## Cross-module inventory (SYSTEM-INTEGRITY-4.1 §2; candidate after the correction pass)

Bounded: every caller and reader of what B1 changed, found by its own search. Shared evidence on the corrected
candidate is in its pre-flight record and CI and journeys runs.

| Interface | Checked how | Evidence | Limitation |
|---|---|---|---|
| Every sign-in route and method (password, card, link request, callback, code, recovery PIN, password after recovery) | One processed attempt writes one row; one request never two; two attempts two rows; the route's own failure code; no secret or full address stored; a writer failure counted and the sign-in continues | B1-A01, B1-K01, B1-K02, B1-A02; F15–F18, BOB26–29, L2 unchanged and green | A successful magic-link callback is covered only by a source test (links are off); `TAUTAN_MASUK_CADANGAN` needs a controlled integration test before it is enabled. The evaluator persona's sign-in is deliberately not recorded |
| Sign-out (`/keluar`, `keluarDariSesi`) | One SIGN_OUT row; `identity.session_ended` in `audit_log` unchanged | B1-A01, B1-K01 | «Keluar dari semua perangkat» and the CR-91 forced end write no event, by design |
| Institutional membership: roles, enrolments, a person at two schools, a change after the event | The snapshot is derived in the database at write time; a school left before or joined after reads nothing; later changes don't alter it | B1-S01, B1-S05 | — |
| A real learner transfer A→B (`transfer_minta` → `transfer_terima` → `transfer_execute`) | Before the move: {A}, read by A only; after: {B}, read by B only; the platform reads both | B1-S06 | — |
| The reader `akuntabilitas_baca`, across schools and roles | A school admin receives only their own school (the defect of `40e89308`); the platform admin the full snapshot; network origin to the platform only; a teacher refused; client roles cannot touch the tables | B1-S05 (red on `40e89308`), B1-S01, B1-L01, the rendered check | — |
| Other client readers that could disclose a person's other schools (root-cause search) | `security_event_list`, `audit_log` RLS, `role_assignments` RLS, `peran_orang`, `staf_peran_hidup`, `staf_sidik`, `peran_akan_berakhir`, `school_people_page`, `card_holders`, `persons_awaiting_account` | No disclosure found | Pre-existing by design, outside B1: `murid_keluar` (yes/no "enrolled elsewhere now", no school named), INV-25 portability (F01-T10), `pindah_masuk` names the sending school of an incoming transfer |
| Suspended, closed and deleted accounts | One SIGN_IN_FAILED row holding the route's own answer, visible to the person's school only; after L4 deletion the old address resolves to no one, earlier rows lose origin and hash and show under the PINTAR ID | B1-A04 (rendered for the school and the platform), B1-S02 | **Pre-existing defect outside B1, escalated:** a suspended or closed account's sign-in answers 503 `LAYANAN_TIDAK_TERSEDIA` where a wrong password answers 401, because `banned_until = 'infinity'` is unreadable by the local Auth. B1 records the route's answer faithfully |
| Printing (the path B2 uses) | A print belongs to the single school owning the resource; fails closed if unrecorded; stable, searchable `CTK-` reference | B1-S01, B1-K02, B1-L01 | B2's print screen does not exist yet; tested at the writer and helper |
| Personal-data deletion (L4) and the departure wording | Only origin and hash cleared, under the deletion's marker; other people untouched; departure wording unchanged | B1-S02, B1-A04; fable38 and fable22 L4 tests | — |
| `audit_log` and «Jejak audit» | Unchanged, no double record; the purge's audit row is the platform's only, and its count equals the run's | B1-S07, B1-L01; JEJAK and audit tests green | — |
| Retention and the purge | 12 months and a day purged, 11 months kept; concurrent purges delete each row once; the run continues until nothing it may take is left; a backlog is named by the health read | B1-S03, B1-C01, B1-S07 | — |
| Job installer, backup, restore, native-restore runbook, health check | One installer for both jobs; the three tables and their rows in the backup and back on restore; the restored database has both jobs once; a job removed by hand is named | B1-R01, DR-D02 (restated), A1-K01, A1-S08 (restated), A1-S09 | A native Supabase restore cannot be run here: its runbook step and the health check are what exists (F-8) |
| Reports and metrics | The store is not a metric source | B1-S04; F07 metric tests | — |
| Admin navigation and the reader screen | Beside «Jejak audit»; terminology, paging, refusal states, stacked rows below 640 px, keyboard, no overflow, axe at 1280, 390, 320 px | Rendered check (scratchpad `b1-lihat/`); Daisy's result review | No print view, by design |
| Human journey (§8.5 journey 4, B1's part) | A wrong password, then a sign-in, then the school admin finds both in the reader and nothing from another school | Journey step B1J (CI only: it needs the mail sink); the same walk locally, 10/10 (`jurnal-*`) | The printed-report step waits for B2 |

**Transitions (SYSTEM-INTEGRITY-4.1 §3):** a person at two schools and later changes: S01, S05 · transfer: S06 · suspension,
closure, L4 deletion: A04, S02 · backup, restore, job recovery: DR-D02, R01 · retries and duplicates: K02, A01 · retention:
S03, S07, C01 · corrections, sealed content, emergency stop: not applicable to B1.

**Root causes found during B1:** CI's build-identity check missing from the local pre-flight (now in it); a result chain
ordered by a tied timestamp in two C1w tests (now walked by links; product readers checked).

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
