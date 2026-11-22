# Verification 5 · Transfer consent, and what a year rollover does (PETE-22)

Agent verification, 22 Nov 2026. Ruling 58. Run on `origin/main` `706fe8c5`, scratch database as in V1 §Setup.

## Finding 1: CONFIRMED. Consent is `{}` on every path, and nothing reads it

- `src/app/konfigurasi/actions.ts`:83 (`transfer_request`, `p_consent: {}`) and :132 (`transfer_authorize`,
  `p_consent: {}`), as the register says. The current request screen's action, `transferMintaAction`, calls
  `transfer_minta`, which takes no consent and writes `'{}'::jsonb` itself (`20261219100000`:66 ff.).
- **No database function reads `transfers.consent`.** The only functions naming it are the three writers
  (`transfer_request`, `transfer_authorize`, `transfer_minta`; catalogue search). `transfer_execute`
  (`20270112170000`:130) does not check it.
- **What execution grants without it:** a `portable_visibility` row for the receiving school. Runtime in V6 (C′): a
  transfer executed with `consent = {}` and one `portable_visibility` row written.

## Finding 2: what rollover does (runtime)

The product's run is `kenaikan_tetapkan` (`20270112210000`:136; the screen's "Kenaikan kelas", replacing
`period_rollover`). Reproduction, on the clone used for V2 (the learner has a finished Uji Penguasaan and an
unfinished retake): as the owner, a new year `TA 2027/2028` and a Kelas `6S` in it (inserted as `fable37.sql` does); as
`siklus-admin@…`: `kenaikan_tetapkan(5S, new_year, <NAIK for every learner in kenaikan_rencana(5S)>, true, true)`.
A control run on a fresh clone without the retake.

| Object | After the run |
|---|---|
| Enrolment | old: `ENDED`, `end_reason EXPIRED`; new: `ACTIVE` in the new year |
| Placements | old Kelas and Tingkat closed, `close_reason PERIOD_ROLLOVER`; new `6S` open |
| Open sittings | the unfinished retake `TERMINATED`, `INSTITUTIONAL_REVOCATION` (not counted as an attempt) |
| Sittings and results | untouched (FINALIZED sittings and their result rows all still there) |
| The old chapter assignment | still `ACTIVE`; the learner can no longer start it (`may_start_assessment` → `NO_ACTIVE_MEMBERSHIP`) |
| The learner's Hasil Belajar | control: the chapter still `SELESAI` with its result. **With the retake: `DITUTUP_AWAL`, the finished Uji Penguasaan no longer shown** (V2) |
| The old Kelas's teacher | grant untouched (rollover never touches `role_assignments`); `learner.result` → `not_permitted`, `tujuan_belum_tercapai` → 0 rows, since the learner is no longer placed in the class |
| An AUTHORIZED transfer of that learner | left `AUTHORIZED`; `transfer_execute` then fails with the undesigned `a closed enrollment is immutable` (V6 C); the transfer is stranded |

- **The school year shape:** `structure_period` makes 1 Jul to 30 Jun (`make_date(y, 7, 1)`, `make_date(y + 1, 6, 30)`;
  `20261006100000`:142); `academic_periods` itself only checks `ends_on > starts_on`. No semesters.

## Classification

- **Consent. Severity:** Medium–High for learners and families (a receiving school gains the learner's history on a
  record that says nothing about consent). **Proposed: Z, as an owner decision (OD-9)** before real school use: either
  a consent record that execution checks, or a written ruling that no consent is needed and the field goes.
- **Rollover. Severity:** Medium for educators (the old Kelas's teacher loses the learner's evidence at once; the
  evidence itself is kept). **Proposed: 4.5** for the stranded transfer (a designed refusal, or the run refuses NAIK
  while a transfer is open) and for the rule on who reads last year's evidence. **The vanishing result is V2's, Z.**
