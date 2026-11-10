# Action & Consequence inventory (owner's principle A, 9 Nov): read-only, with the triage

**What this is:**
- For each consequential act, its next state: reverse, correct, terminate or supersede. Is there a governed path, is
  the original kept, is the reversal audited with a reason, and does a screen offer it?
- A read-only sweep of the code at `5f373c54`. No database was touched.
- Every claim cites a file and line.

## Triage (9 Nov), after verifying each GAP-4.0 claim in the code

| # | Gap | Verified | Disposition |
|---|---|---|---|
| 1 | A lesson assignment can never be withdrawn or ended, or have its window changed (and `ASSIGN_EXISTS` then blocks giving it again) | **Yes.** No function sets ENDED or WITHDRAWN, and table writes from clients are revoked (`20261110100000`) | **For the owner:** a governed withdraw/end (no starts afterwards; results kept; audited with a reason) and a Mengajar control. Proposed as 4.0 completion |
| 2 | E3/E4 had no screen | Yes | **Closed:** «Akhiri pendaftaran» and «Murid yang sudah keluar» on Pindah kelas (`20270112220000`, KEMBALI-A01) |
| 3 | No screen ends or extends another person's sitting, and an abandoned sitting blocks E3 (ENROL_SITTING_OPEN) | Yes. The screen is deliberately deferred (`mengajar/[kelas]/langkah/page.tsx:24-35`) | **For Sharon** (her open E3 question): E3 ends an open sitting as INSTITUTIONAL_REVOCATION, or treats a sitting past its deadline as expired. Either keeps E3 from being blocked |
| 4 | A certificate cannot be corrected or re-issued | Yes. SUPERSEDED and `supersedes_certificate_id` exist with no writer | **Owner decision already open** (handbook G1.7). Not started |
| 5 | Owner-ruled lifecycle items: E5 (end an educator at a school with a category), E7 (audit trail with actor and reason), platform suspension | Yes | **E7 closed:** «Jejak audit» shows who acted and why. **E5:** today `revoke_role` with a required reason ends authority at once (CABUT-A01). A category list is the remaining part. **Platform suspension:** not started; awaits the owner's sequence |

---

# PINTAR 4.0 · Action & Consequence inventory (read-only, branch `claude/system-integrity-4.0` at `3b2799e4`, 9 Nov 2026)

Method: a function's effective body is the last migration that creates or replaces it (map built over all 213 files in
`supabase/migrations`). "Screen" means a `supabase.rpc("<name>")` call (or the `struktur()` wrapper in
`src/app/konfigurasi/actions.ts:420-422`, or the engine wrapper in `src/lib/assessment-engine/index.ts:62`) reachable
from a page. Paths: `M/` = `supabase/migrations/`. Nothing was run; no file other than this one was written.

Classes: **OK** (governed next state, or correctly irreversible) · **GAP-4.0** (missing next state a school hits in
normal 4.0 use) · **LATER** · **UNCLEAR**.

Context already on record: `docs/completion-4.0/acceptance/ACCOUNT-LIFECYCLE-INVENTORY.md` §2, §5, §5b (owner rulings 9
Nov) covers learner/staff departure (E1–E8 + platform suspension). This file does not repeat its analysis; it records
the code state today.

---

## 1 · Publishing / withdrawing lessons and packages (Studio)

| Action (UI) | Function / route | Who | Forward effect | Next state | Class |
|---|---|---|---|---|---|
| «Kembalikan» (reviewer sends package back) | `kembalikan_paket` M/20261214100000:139; `src/app/studio/actions.ts:121` | CAN_REVIEW, not author | package steps back to author with reason (10–1000 chars), audited | author re-uploads a correction (`studio/paket/[course]/page.tsx:202`, `/studio/unggah?revisi=`) | OK |
| Create release / «Kunci» / «Terbitkan» | `create_release` M/20261204100000:106, `freeze_release` M/20261009100000:109, `publish_release` :181; `studio/actions.ts:206,217,240` | CAN_FREEZE_RELEASE / CAN_PUBLISH | APPROVED course → release INGESTED → FROZEN (hash) → PUBLISHED; publish assigns nothing | withdraw (below); content change = revision | OK |
| «Tarik» (withdraw release) | `withdraw_release` M/20261009100000:209-230; `studio/actions.ts:251`, `LangkahTerbit.tsx:114` | CAN_PUBLISH | PUBLISHED → SUPERSEDED, reason required, audited `RELEASE_WITHDRAWN`, evidence untouched | no un-withdraw (correct: frozen content); a successor comes by revision (upload `?revisi=`, `studio/paket/[course]/page.tsx:503-511`). **But** existing class assignments on the withdrawn release stay ACTIVE and keep serving its lessons (`my_learning_assignments` filters only `la.status='ACTIVE'`, M/20260913093000:121; `learner_lessons` does not read release status). Only remedy is moving each assignment to another published release (`move_learning_assignment_release`, below); if no successor exists, nothing ends the assignment (see §2 GAP) | OK (release) / see §2 |
| Revision of a sealed course | `create_course_revision` M/20261105100000:132; exported as `createRevisionAction` `studio/actions.ts:283` | CAN_DRAFT | new draft course in the chain | **no .tsx calls `createRevisionAction`**; the live revision path is the upload with `?revisi=` | OK (dead server action only) |
| Move a class to another release («Pindah», koreksi) | `move_learning_assignment_release` M/20261022100000:98; `studio/actions.ts:301`; form `studio/paket/[course]/page.tsx:516` | CAN_ASSIGN_LEARNING | assignment re-pointed, reason, `learning_assignment_release_moves` row (M/20260912201500:101-110); policy NOT_STARTED_ONLY | itself is the correction path; shown only when >1 published release (`page.tsx:230`) | OK |
| Grant / withdraw library distribution («izin») | `grant_release_distribution` M/20260915110000:148, `withdraw_release_distribution` :210-247; `studio/kanonik/page.tsx:141,165` | SYSTEM_ADMIN or CAN_PUBLISH in owner tenant | school may / may no longer assign; withdrawal reason required, append-only, started sittings untouched | re-grant = new row | OK |
| Acknowledge finding | `acknowledge_finding` (`studio/actions.ts:147,179`) | CAN_REVIEW, not author | WARNING acknowledged, audited | none (acknowledgement is a record) | OK |

## 2 · Assigning a lesson / assessment to a class

| Action (UI) | Function / route | Who | Forward effect | Next state | Class |
|---|---|---|---|---|---|
| «Sediakan» lesson to a Kelas | `assign_release` M/20261010100000:460-528; `src/app/mengajar/actions.ts:91` | CAN_ASSIGN_LEARNING | learning assignment ACTIVE + PRE/POST assessment assignments OPEN, window `available_until`/`closes_at` = teacher's «sampai» (may be null = open forever); audited `LEARNING_ASSIGNED` | **None.** Enum and transition table allow ACTIVE→ENDED/WITHDRAWN and OPEN→CLOSED (M/20260912201500:34-35, 84-97) but **no function performs any of them** (grep: no `update … learning_assignments set status` other than to ACTIVE). Client writes were revoked (M/20261110100000:33-34) with the explicit note «it has no close, extend or reopen at all … a future need … becomes an audited function» (:8-9, :22-24). The window cannot be changed (`langkah/page.tsx:24-35` says the same). Re-assigning is refused while the old one is ACTIVE, even after its window passed (`ASSIGN_EXISTS`, M/20261010100000:481-485) | **GAP-4.0** |
| «Uji Cepat» | `launch_selected_quick_assessment` M/20261104100000 → `launch_quick_assessment` M/20261020100000 (closes_at = now + minutes, :136-138); `mengajar/actions.ts:132` | CAN_ASSIGN_LEARNING | open for N minutes | self-closing; early cancel absent | OK (cancel LATER) |
| «Minta membaca lagi» | `request_lesson_review` M/20261107100000; `mengajar/actions.ts:171` | the class's teacher | learners asked to reread | no withdraw | LATER |

GAP-4.0 scenarios: (a) teacher picks the wrong Kelas in Siapkan: that class's learners now see the chapter and an open
pre-test indefinitely; nobody can withdraw it. (b) teacher types «sampai» one week too early: the tests close, and the
same release can never be given to the class again (`ASSIGN_EXISTS`). (c) a release is withdrawn for an error and no
corrected release exists yet: classes keep learning the withdrawn content.

## 3 · Roles

| Action (UI) | Function | Who | Forward effect | Next state | Class |
|---|---|---|---|---|---|
| «Beri peran» (Peran & akses) | `grant_role` M/20260912004431:214 (+ guard `role_assignments_guard` M/20261122100000); `konfigurasi/actions.ts:202,235` | INSTITUTION_ADMIN over node (school-root admin only by SYSTEM_ADMIN or another admin with confirm); D-049 relationship required | row with mandatory `valid_until`; audited `role.granted` | revoke; expiry is automatic at `valid_until`; renewal / re-grant = new row (rows immutable, guard :UPDATE branch) | OK |
| «Cabut» | `revoke_role` M/20261111100000:187-204; `konfigurasi/actions.ts:253` | SYSTEM_ADMIN or INSTITUTION_ADMIN over scope | `revoked_at/by/reason` (≤300, required); audit `role.revoked` with from-state | mistaken revoke → new grant (relationship persists through the registration number) | OK |
| End an educator at this school (E5), one action with category | — | — | — | not built; role-by-role revoke works meanwhile | GAP-4.0 (owner-ruled §5b; tracked) |
| Lost school admin | `tunjukAdminPertamaAction` `konfigurasi/actions.ts:218`; ordinary grant by SYSTEM_ADMIN | SYSTEM_ADMIN | re-appoint | exists | OK |

## 4 · Learner placement and lifecycle

| Action (UI) | Function | Who | Forward effect | Next state | Class |
|---|---|---|---|---|---|
| Place a learner without a Kelas | `tempatkan_murid` M/20270112170000:254; `konfigurasi/actions.ts:301` | INSTITUTION_ADMIN | membership in Kelas; audited (membership trigger M/20260912004321:155-161) | wrong Kelas → «Pindah kelas» | OK |
| «Pindah kelas» | `move_learner_to_class` M/20261029100000:22 (SECURITY DEFINER since M/20270112160000:25); `konfigurasi/actions.ts:278` | INSTITUTION_ADMIN over both places | close MOVED, open new, same year (`MOVE_OTHER_YEAR`) | move back; no reason captured (trigger audit only) | OK |
| Transfer (request by name / accept / authorize / execute / reject) | `transfer_minta` M/20261219100000:66, `transfer_terima` M/20261231100000:26, `transfer_execute` M/20270112170000:173, `transfer_reject` M/20261121100000:32; `konfigurasi/actions.ts:89-162` | CAN_AUTHORIZE_TRANSFER either side | old enrolment ENDED TRANSFERRED_OUT, new one placed; both schools audited (`transfers_audit`) | before execution: reject (either side, acts as cancel; guard M/20260912004527:70-74); after: a transfer back. CANCELLED state has no function (reject covers it) | OK |
| «Tahun ajaran dilanjutkan» (rollover) | `period_rollover` M/20270112190000:6; `konfigurasi/actions.ts:66` | INSTITUTION_ADMIN | memberships closed PERIOD_ROLLOVER, reopened in mapped Kelas; audited with count | individual fix by «Pindah kelas» in the new year; no whole-run undo | OK (undo LATER) |
| «Akhiri pendaftaran» (E3) | `akhiri_pendaftaran` M/20270112200000:19-70 | INSTITUTION_ADMIN | enrolment ENDED with reason/date, placements closed, audited `enrollment.ended_with_reason` | correction via E4 | **GAP-4.0: no screen** (no `rpc("akhiri_pendaftaran")` in `src`; only error codes `src/lib/galat-kontrak.ts:69-72`, copy `hle.ts:4298-4304`). Graduation, withdrawal and emigration cannot be recorded by a school. In flight (commit `3b2799e4`, DB green) |
| «Daftarkan kembali» (E4) | `daftarkan_kembali` M/20270112200000:73-184 | INSTITUTION_ADMIN | CORRECTION reopens the latest reasoned ending; RETURN new enrolment, same person/number; audited `enrollment.reopened` with `corrects` | itself is the correction | **GAP-4.0: no screen** (same) |
| Platform suspension / reactivation | — | SYSTEM_ADMIN (owner §5b) | — | not built (no function) | GAP-4.0 (owner-ruled §5b; tracked) |
| Professional-learning participant | `enrol_for_professional_learning` M/20261118100000; `konfigurasi/actions.ts:324` | admin | PD placement | no remove-from-PD function found; whether «Pindah kelas» applies to a PD Kelas not verified | UNCLEAR |

## 5 · Certificates

| Action (UI) | Function / route | Who | Forward effect | Next state | Class |
|---|---|---|---|---|---|
| Issue (automatic on result page) | `POST src/app/api/certificates/issue/route.ts` → `certificate_prepare` M/20261201100000:109 + `certificate_seal` | the learner's own sitting (`session_is_mine`), service client | sealed name, school, course, language, number `<PINTAR ID>/<seq>` | idempotent per sitting: returns the existing root certificate whatever its status (:127-133) | OK (seal is correct) |
| «Cabut sertifikat» | `revoke_certificate` M/20261111100000:354-380; `src/app/konfigurasi/sertifikat/actions.ts:33`, `FormCabut.tsx` | CAN_PUBLISH in its school | REVOKED, reason, first revocation stands, audited | REVOKED is terminal (guard :336-337) | OK (irreversible by design, D-093) |
| Correct / re-issue (e.g. after a name correction) | — | — | — | **none.** `certificate_status` has SUPERSEDED and `certificates.supersedes_certificate_id` (M/20260914103000:45,88,98), and copy exists («Digantikan sertifikat yang lebih baru» `hle.ts:3132`), but no function writes either. `correct_person_name` (M/20261112100000:296, SYSTEM_ADMIN) changes the person, never the sealed certificate (D-077(d), «a later correction never silently rewrites it»; (e) «corrections stay possible through a governed identity process»). Handbook Q045 (`docs/product/handbook/PERTANYAAN-SEKOLAH-DRAF-1.md:1134-1140`) already states «penerbitan ulang belum ada», and its open-decisions list puts the re-issue path with the product owner (:2665, G1.7) | **GAP-4.0** |

Scenario: a class-card learner's name was imported misspelt (class cards are not asked to confirm a name at
activation), the learner passes and receives a certificate; the platform admin corrects the name; the certificate keeps
the old spelling, and revoking it leaves the learner with none, since `certificate_prepare` returns the revoked root for
that sitting. Owner may rule this LATER; it is the one item in §5 the principle names explicitly.

## 6 · Class cards and accounts

| Action (UI) | Function / route | Who | Forward effect | Next state | Class |
|---|---|---|---|---|---|
| Activate account / new person | `authorize_account_activation` M/20270112140000:291, `authorize_new_person`; `api/akun/aktivasi/route.ts:61,76`; `FormAktivasi.tsx` | CAN_PROVISION_PEOPLE while the school holds the person (`sekolah_memegang` :27) | activation code/email | wrong email → email correction | OK |
| Re-issue class card («Kartu hilang/rusak») | `authorize_card_reissue` :74-128; `api/akun/kartu-kelas/route.ts:63`; `KartuUlang.tsx` | same | `card_reissues` row (old/new number, reason HILANG/RUSAK) | further re-issue | OK |
| Card → email | `authorize_card_conversion` :130-178; `api/akun/kartu-ke-email/route.ts:53`; `KartuJadiEmail.tsx` | same | `card_conversions` row, reason 10–500 | email correction; back to card not offered | OK (reverse LATER) |
| Email correction | `authorize_email_correction` :180-240; `api/akun/email/route.ts:50`; `FormKoreksiEmail.tsx` | owner-ruled roles | `email_corrections` row | further correction | OK |
| PIN recovery reset | `admin_reset_recovery` M/20261122100000:135 → `sesi_akhiri_orang` :68; `api/keamanan/pemulihan/route.ts:83` | SYSTEM_ADMIN / current school's admin | new PIN required, all sessions end, audited | owner sets new PIN | OK |
| End own sessions | `sesi_akhiri_saya`, `sesi_akhiri_semua` M/20261117100000:292; `KeluarSemua.tsx` | self | sessions ended | sign in again | OK |
| Name / username correction | `correct_person_name`, `correct_username`; `src/app/aktivasi/orang/actions.ts` | SYSTEM_ADMIN only (D-077(3)) | audited from/to/reason | further correction | OK |

## 7 · Integrity and sittings

| Action (UI) | Function | Who | Forward effect | Next state | Class |
|---|---|---|---|---|---|
| Decide an observation | `record_integrity_review` M/20270112130000:65-106; `studio/actions.ts:555` | CAN_REVIEW_INTEGRITY over the sitting's place | audit row only (signal never mutated); REFERRED opens a management case | decided signals leave the queue (`integrity_signal_decided` M/20261223100000); no reopen | OK (record by design) |
| Decide a referral | `advance_management_decision` M/20261205100000:28-75; `pimpinan/actions.ts` | HoD/Dean over scope, not the referrer | AWAITING→UNDER_REVIEW→DECIDED with outcome | «every move out of DECIDED» refused; new information = new referral (:49-53) | OK (by design) |
| End another person's sitting | `terminate_session` M/20270112150000:8-44 | CAN_REVIEW_INTEGRITY over place; PD = SYSTEM_ADMIN | TERMINATED, cause + reason, responses kept, audited | terminal | **GAP-4.0: no screen** (no `src` caller) |
| Extend a sitting's deadline | `extend_session_deadline` M/20270112150000:47-… | CAN_ASSIGN_LEARNING over place | +1–120 min, ≤3 times, reason, audited | — | **GAP-4.0: no screen** (`mengajar/[kelas]/langkah/page.tsx:24-35` records it as deliberately absent) |
| Reclassify evidence | `evidence_class_overrides` insert (RLS M/20270112130000:50-53; trigger M/20260912194513:46-85) | CAN_REVIEW_INTEGRITY | append-only override, may only weaken | no screen; header (:22) says a demotion is «reversible only by a further override», but the monotonic check (:72-75) refuses any promotion, so a mistaken demotion appears permanent | LATER (screen) / UNCLEAR (reversibility contradicts its own comment) |

Why the sitting rows are GAP-4.0: `akhiri_pendaftaran` refuses while the learner has a CREATED/IN_PROGRESS/PAUSED
sitting (M/20270112200000:53-57) and its copy tells the admin it must be «dikumpulkan atau diakhiri dulu»
(`hle.ts:4298`). Deadline expiry is lazy, applied only when the sitting is next touched (`session_enforce_deadline`
M/20260913090000:194-210), so a learner who abandoned a sitting and left the school keeps it IN_PROGRESS forever. Then
nothing in the product can end the sitting, and the school cannot end the enrolment. Extension: a learner loses 20
minutes to a power cut mid-test, and the teacher has no way to give the time back.

## 8 · School structure

| Action (UI) | Function | Who | Forward effect | Next state | Class |
|---|---|---|---|---|---|
| Create Bagian / Tingkat / Kelas | `create_bagian` M/20261118100000:161, `create_tingkat` M/20261006100000:289, `create_kelas` :318; `konfigurasi/actions.ts:445-463` | INSTITUTION_ADMIN | node + audit; academic year created on demand (`structure_period` M/20261006100000:142-158) | rename / deactivate | OK |
| Rename | `rename_school_node` :352; `actions.ts:474` | same | audited | rename again | OK |
| «Nonaktifkan» | `deactivate_school_node` M/20261111100000:260-303; `actions.ts:483` | same | only when empty (no active children, members, staff); reason; audited with the list closed | no reactivate function, but a new node may take the same name (uniqueness is among *active* siblings, M/20261006100000:44) | OK (reactivate LATER) |
| Academic year | `structure_period` (implicit), `academic_periods_append_only` | — | append-only | none needed | OK |

## 9 · Bulk learner import (Pendataan)

| Action (UI) | Function | Who | Forward effect | Next state | Class |
|---|---|---|---|---|---|
| Open / validate / confirm / advance | `import_open` M/20260926110000:162, `import_confirm` :329, `import_advance` :405; `src/app/pendataan/actions.ts` | CAN_PROVISION_PEOPLE | rows provisioned one by one: persons, registration numbers, enrolments, placements | per-person corrections only: Kelas via «Pindah kelas»; name via platform admin; an unwanted learner via E3 (no screen yet, §4). No undo of an import (persons are never deleted, by design) | LATER (bulk undo); depends on §4 GAP |
| «Uji coba diperiksa» (pilot of 50 verified) | `import_verify_pilot` :541-566; `pendataan/actions.ts:168` | same | releases the remainder | **only "approve" exists**; a pilot found wrong cannot be stopped/abandoned (job sits at AWAITING_PILOT_VERIFICATION; the remainder is never provisioned, so it is harmless) | LATER |

## 10 · Other consequential acts found on the way

| Action | Function | Next state | Class |
|---|---|---|---|
| School pass mark | `set_school_pass_mark` M/20261102100000:203 (append-only; sealed per sitting) | new value supersedes; sealed sittings keep theirs | OK |
| Maintenance windows / notices | `schedule_maintenance`, `change_maintenance`, `stop_pintar_now`, `publish_notice`, `withdraw_notice` M/20261120100000; `konfigurasi/actions.ts:525-587` | end / cancel / withdraw with reason | OK |
| Feedback cycle | `open_feedback_cycle`, `close_feedback_cycle` | close exists; no reopen | OK |
| Evaluator status | `revoke_evaluator` M/20260917110000 (no `src` caller; platform tooling) | revoke ends personas | OK (operator tool) |

---

## GAP-4.0, ranked by severity

| # | Gap | Missing piece | Evidence |
|---|---|---|---|
| 1 | **A lesson assignment can never be withdrawn, ended, or have its window changed** | an audited function (ACTIVE→WITHDRAWN/ENDED, change `available_until`/`closes_at`) + a Mengajar control | M/20260912201500:34-35,84-97 (states exist); M/20261110100000:8-9,22-24,33-34 (no path, by note); M/20261010100000:481-485 (`ASSIGN_EXISTS` blocks re-assignment); `langkah/page.tsx:24-35` |
| 2 | **Ending and re-enrolling a learner have no screen** (E3/E4) | Konfigurasi «Murid» actions calling `akhiri_pendaftaran` / `daftarkan_kembali` | M/20270112200000:19,73; no `src` caller; codes only in `galat-kontrak.ts:69-72` (in flight) |
| 3 | **No one can end or extend another person's sitting from the product**, and an abandoned sitting blocks E3 | screens for `terminate_session` / `extend_session_deadline` (or have E3 treat a sitting past its deadline as expired) | M/20270112150000:8,47; M/20270112200000:53-57; M/20260913090000:194-210; `hle.ts:4298` |
| 4 | **A certificate cannot be corrected or re-issued** | a governed supersede (new certificate, old one SUPERSEDED and kept) | M/20260914103000:45,88,98; no writer; M/20261201100000:127-133; `hle.ts:3132`; D-077(d)(e); handbook Q045 (:1140) and G1.7 (:2665, owner decision open) |
| 5 | Owner-ruled 4.0 lifecycle items not yet built: E5 end educator at school with category; E7 audit trail showing actor and reason; platform suspension/reactivation | as designed in ACCOUNT-LIFECYCLE-INVENTORY §5/§5b | no functions; `konfigurasi/page.tsx:229` still selects no `actor_person_id`/`summary` |

## Correctly irreversible (by design)

- Sealed certificate content: name, school, course, language and number (INV-30, D-077(d), M/20261201100000). Revocation is terminal and the first revocation stands (M/20261111100000:336-346).
- A withdrawn release (SUPERSEDED) and frozen release content. A correction is a new revision through review (M/20261009100000:223-226).
- Recorded integrity reviews (audit rows) and DECIDED management decisions. New information becomes a new referral (M/20261205100000:49-53).
- TERMINATED / FINALIZED sittings, their responses and results (recalculation supersedes, never edits).
- Role assignment rows: immutable, and re-granting writes a new row (`role_assignments_guard`).
- Ended enrolments, closed memberships, EXECUTED/REJECTED transfers. E4 corrects with a new enrolment (M/20260912004527:74, M/20270112200000).
- Evidence overrides are append-only and may only weaken eligibility. Whether a mistaken demotion should be reversible is UNCLEAR (§7).
- `audit_log`, persons, registration numbers and certificate numbers are never deleted or reused. Academic periods and school pass marks are append-only.
- Card re-issue, card conversion and email correction records are history; the next correction is a new row.
