# PINTAR 4.0 · Closure batch 3: behaviour (D-118 §11, D-120, D-121)

**6–7 October 2026.** Batch 3 of the closure register (`PINTAR-4.0-CLOSURE-REGISTER-2026-10-06.md` §2): the behaviour that does not wait for design. Every item was ruled by the owner first (D-120 batch 1, D-121), built red test first, and proven on the local stack, in CI and on staging. Screens changed only where a ruling named the change; the screens Daisy designs (slices S6–S8) are not touched.

## 1. What was closed

| CR | Ruling | What changed | Proof (red before → green after) | Commit |
|---|---|---|---|---|
| CR-47 + Q10 | D-121(a)(b): Alternative 4 | A new scoring version `pintar-scoring/2`: descriptors Sangat Baik ≥ 90%, Baik ≥ 80%, Cukup ≥ 70%, **none below 70%**; mastery stays the school's sealed mark. A published version's descriptors are immutable and carried forward; a result is decided under its session's own version (prospective: earlier sittings keep pintar-scoring/1). No descriptor line on the certificate or the public check when there is none; the school's threshold is not printed. Engine `pintar-engine/2` (D-060(b)). | F20-Q10, F20-F01; PENUTUPAN-Q10 (the real certificate rendered); F04-T02 restated | d4ebe65 |
| CR-47 | D-121(c): the not-yet state | «Belum mengerjakan Uji Penguasaan» is produced: a learner placed in the class with no official result there counts in it, never in a band; the sample is every learner the distribution counts. Catalogue MC-6. | F20-N01; F06-P23, D088G, BOB43 restated | 4b72ceb |
| CR-02 | D-078(c), D-077(d) | A certificate is sealed at issuance: the school's name, the course and the language as issued; the learner's page and the public check read the seal; a seal can never be edited. | F20-S01; PENUTUPAN-S01 | 07d1c4a |
| CR-01 | D-080(2)(9), Q1 | The number is `<PINTAR ID>/<NNNNN>`, the holder's own five-digit sequence, never reset or reused; «Awalan nomor» is retired from Studio and its save. Issued certificates keep their numbers (sealed). | F20-C01; ADM18-K01/K02 restated | 07d1c4a |
| CR-50 | D-063 M1–M5, D-120 Q9 (mandatory) | A misconception definition belongs to its content's owner (key: school + code); an option names only its own school's definition; definitions are append-only; a package carries its own «Miskonsepsi» sheet. **All 20 PINTAR chapters regenerated**: 1,857 wrong options carry one of 277 defined misconceptions (nothing else in the files changed); each passes the database's check for a school and for the PINTAR library. | F20-M01, M02, M03 (the weak-linkage findings gone); PENUTUPAN-M04 (the content) | a83b9a3 |
| CR-13 | D-120 QN1 | A wrong staff email is corrected without SQL. **Before activation:** the person's school admin or the platform admin, with a reason; any code already sent dies; a set-up begun through the wrong inbox is undone (password cleared, PIN to choose again, name to confirm again). **After activation:** the platform admin only, with a reason; every session ends; the old and the new address are told. Every correction is audited (`identity.email_corrected`). Nothing else can change a staff email account's address any more. | F20-E01, E02 (against Auth's own table); PENUTUPAN-E03 (the route); **PENUTUPAN-A01 end to end through the running app, Auth and the mail sink**; BOB28-D01 restated | ef7929c, dc5f2c1 |
| CR-51 | D-120 Q7 | The platform admin prepares the PINTAR library's standard content through the same workbook import (offered on Unggah to the platform admin only, as the last school in the list). Every school role stays refused at the library, even one holding a role inside it. The two-person rules stand: the importer is the author; **a second platform admin** approves and freezes. | F20-K01 (import → approval refused to the author → a second admin approves and freezes → published → distributed → found by a school's teacher); F11-N02, F12-N01, DAISY-06-UNGGAH-01/02 restated; plant bob02-8 restated and proven | bcc3b7a |

## 2. The runs

| Step | Run | Result |
|---|---|---|
| CI on bcc3b7a | 37483042122 | **red**: two plant gates (§3) |
| CI on a28b4d2 | 37486231374 | **red**: every plant gate green; the strict selftest 616 passed, 1 failed (§3) |
| CI on 9a46bf5 | 37489874488 | **green**: 18/18 jobs, every plant gate red for its own reason; the strict selftest **617 passed, 0 failed** |
| The journeys audit on 0652d21 (code identical to 9a46bf5 but for one test) | 37487347244 | **green**: both jobs; the screens audit and the journey, **72 PASS, 0 other** (S15b, S23r/l/t/j, S25, S26d, S27 and the C-12 steps among them) |
| main fast-forwarded 12b480b → 9a46bf5 (no request file touched) | — | done 6 Oct 16:10 UTC |
| staging migrated | 37493598299 | **green**: 165 → 171 applied (last 20261204100000), equal to the repository; CR-50's guard found no cross-owner link; the sign-in boundary verified |
| CI on main at 9a46bf5 (main always runs the full cycle, CE-8) | 37493596839 | **green**: 18/18 jobs; the strict selftest **617 passed, 0 failed** |

## 3. The red CI runs, and why

**Run 37483042122.** Two mutation-plant gates failed. **Neither was a product defect**; both were the instruments not following the batch's own changes, and both are the coordinator's miss: the plant gates were not run locally before the dispatch.
- **F06 plant 3b** deleted the capability check of `save_certificate_template` in its five-argument form, which CR-01 retired with «Awalan nomor». The plant errored before planting and the gate read it as "stayed green". It now plants the same deletion in the four-argument form; proven locally (F06-N02 red for ACCEPTED, and the whole FABLE-06 step green with every plant red for its own reason).
- **db-bob24-gates** expected 6 green rows of the identity suite; CR-19's F16-X01 (batch 2) made it 7. Proven locally: 14/14 plants prove their gate.
Cost: 69 estimated minutes. From now on the plant gates of any suite a change touches run locally first (`scripts/dev/plants.mjs run --gate=…`, and the F06 step's script).

**Run 37486231374.** Every plant gate green; the strict selftest 616 passed and 1 failed: PENUTUPAN-A01, CR-13's end-to-end test. The correction's notice **had** arrived at both addresses; the test took the old address's newest message by position, and CI's Mailpit lists a mailbox newest first where the local sink listed it oldest first, so it read the activation code instead. The test now finds the notice by its subject and requires exactly one more message (9a46bf5); the local sink was changed to Mailpit's order and the test re-proven against it. Again an instrument, not the product; again the coordinator's miss (a local sink that did not behave as CI's).

## 4. For the owner and for Daisy

**CR-13 (your QN1 ruling), choices made where the ruling was silent:**
1. Before activation, the set-up begun through the wrong inbox is undone (password cleared, PIN to choose again, name to confirm again; the person may then correct the name once, as at any activation). A username already chosen stays: it is no credential, and only the platform admin may change one.
2. After activation, every session ends, and the password and the set-up stay the person's own.
3. The platform admin may also correct before activation (they provision a school's first administrator).
4. The audit row keeps both addresses in clear, as the name correction does. Say if you want them hashed.
5. The screen is the people list's, in slice S7 (Daisy). Until then the route exists without a button.

**CR-51 (your Q7 ruling):**
1. Approving and freezing the library's content needs **a second platform admin** (the importer is the author, and the two-person rule stands as for any school). Staging has two (you and the Platform Operator). Production: who is the second person?
2. gs-001's published Bab 1 on staging: leave it as a school's chapter, or re-import it into the library?
3. The end-to-end walk (authored → distributed → assigned → learned) on staging needs those two people; it is scheduled with batch 6.

**CR-47:** the class's sample now includes not-yet learners (the denominator is every learner the distribution counts). This was my reading of D-121(c); say if the sample should be the assessed learners only.

**Daisy (copy and design, nothing changed by me beyond functional text):**
- CR-50: the four new problem sentences for the «Miskonsepsi» sheet and the reworded option-code sentence; the downloadable template does not yet carry a «Miskonsepsi» sheet (the reader accepts one by name).
- CR-13: the notice «Alamat email akun PINTAR Anda dikoreksi» (six texts, both languages); the people-list control (S7).
- CR-51: the library entry in Unggah's school list (last, never preselected).

## 5. Observations (not changed)

- EVAL-N09's credential pattern (`password`) also matches D-102's session-end reason `PASSWORD_PERTAMA`. CI never meets it (the database suites run before any app activation), but a local run after app tests does.
- F18's fixture picks the school admin's role with an unordered `limit 1`; on a database where that admin has gained other (revoked) roles it picks the wrong one. CI's fresh database never has them.
- F03-R02's internal word «Salah» also matches the ordinary phrase «Salah satu …» in the seeded cycle's options.

## 6. Batch 2, closed with this batch (proof on today's code, no product change)

| CR | Proof | Result |
|---|---|---|
| CR-29 pause and resume | F03-T11 | **Closed**: green in CI 37489874488; red on three plants |
| CR-19 persona exclusion | F16-X01 | **Closed**: green in CI; red on eight plants |
| CR-45 error-page reference | BOB07-K03 | **Closed**: green in CI; red on three plants |
| CR-18 resend countdown | `audit/staging/kode-ulang-walk.mjs` K1–K3 on staging | **Closed**: run 37483810708 green (a real account and an unknown name wait the same; red locally on two plants) |
| CR-33 audit-only evidence | the journeys audit | **Closed on today's code**: 37487347244, 72 PASS. Batch 6 runs it again on the frozen specimen |
| CR-35 "what next" | S26d (`[data-tur="layak"]`: «Layak dikerjakan lebih dulu», Bab 2, the siapkan link) | **Closed** (same run) |
| CR-38 the decision queue | S23r: referred in Studio, one decision only; the dean takes it and records «Tidak ada tindakan lanjutan»; the referrer sees it decided; no score moves; the student sees none of it | **Closed** (same run) |
| CR-39 the audit reader | S23j: the school admin reads exactly their school's newest 50 rows; the platform admin the platform's | **Closed** (same run) |
| CR-40 report templates | S23t: the school's own class report replaces PINTAR's standard on the head of department's summary | **Closed** (same run) |
| CR-42 class move | S25 | **Closed** (same run) |
| CR-43 year rollover | S27, on the audit's own stack (never the demo school) | **Closed** (same run) |
| CR-44 «Laporkan masalah» | S23l: teacher reports; the school admin moves it to «Ditangani»; the platform admin to «Selesai»; the reporter reads both | **Closed** (same run). The tiers' people stay an owner action (D) |
| CR-41 transfer between schools | — | **Not walkable, so it becomes an A item** (the register's rule for batch 2). The request form takes «Kode sekolah tujuan» and «Kode tahun ajaran tujuan» as raw UUIDs that no screen shows, and Pendataan calls the namespace «SDZ» a «Kode sekolah» too. A walk could pass only by reading the UUIDs from the database, which would hide the gap, so none was written. Its fix belongs to S7 (Daisy) with engineering |
| CR-30 answers kept through network loss | — | **Moved to batch 6**: it needs a fresh specimen learner with no sitting, which the specimen gives |

## 7. Findings from the walks (reported, not changed: no ruling covers them)

Each was found while writing or running a batch 2 walk. None made a walk red; none was worked around. I propose them for the register; the owner rules which are A (and whose), and which are accepted.

| # | Where | Finding | Who it reaches | Kind |
|---|---|---|---|---|
| W-1 | Studio «Tinjauan Integritas» | Each sitting is named by 8 characters of its UUID and a count: no learner, class or test. The note field has no label (a hard-coded placeholder). Only a sitting's newest signal can be reviewed. A reviewed or referred signal looks exactly like a new one | heads of department, school admins | Daisy (S7) + engineering |
| W-2 | The decision queue | **The referrer can decide their own referral**: `advance_management_decision` checks Management scope only, and the head of department who referred stands over the class. No separation of duties. Read from the code, not walked | heads of department | **owner ruling** (is a second person required?) |
| W-3 | The decision queue | A school admin may refer (holds CAN_REVIEW_INTEGRITY) but /pimpinan refuses them, so they never see the outcome. The decision card gives no way to the evidence. One phrase, «Diteruskan ke pihak sekolah», names two different acts | school admins, deans | Daisy + engineering |
| W-4 | «Laporkan masalah» | No screen links to «Laporan saya» (/lapor/saya): the copy key exists and is used nowhere; the reporter reaches it only through the redirect after sending. The triage line shows the raw user-agent and path | every staff reporter | Daisy (S3/S7) |
| W-5 | «Templat laporan» | **A template cannot be revised on the screen** (the form never sends the template, so a second save hits the unique version index and fails generically); the order cannot be chosen; raw identifiers throughout; the title changes nothing; learner_result can be saved but nothing shows it; no way back to the standard | school admins | Daisy (S7) + engineering |
| W-6 | «Jejak audit» | Raw codes in mixed conventions, raw table names and id fragments, no actor shown although it is recorded; the newest 50 only, no paging or filter | school admins, platform admin | Daisy (S7) |
| W-7 | Transfers | Beyond CR-41: the receiving admin sees the learner as an 8-character id before approving; whether the platform admin alone can request and approve is not verified | admins | with CR-41 |

## 8. The allowance (D-121(d): 1,900 estimated minutes, a ceiling)

Every Actions run since batch 0's report, read with the same classify/judge (`audit/ci/actions-spend.mjs`):

| Run | Estimate (min) |
|---|---|
| batch 0 (its report §4) | 60 |
| watch · production 37477387473 (scheduled, skipped) | 0 |
| CI on bcc3b7a 37483042122, **red** (§3) | 69 |
| staging CR-18 37483810708 | 3 |
| CI on a28b4d2 37486231374, **red** (§3) | 75 |
| journeys audit 37487347244 | 40 |
| CI on 9a46bf5 37489874488 | 79 |
| staging migration 37493598299 | 1 |
| CI on main 37493596839 | 73 |
| **Spent since D-121** | **400** |

- **Batches 2 and 3 cost 340.** Of that, **144 is waste**: the two red CI runs (§3), both the coordinator's instruments.
- **Remaining: 1,500 of 1,900.** No job waited for a runner (queue 6.6 minutes in all), none was starved, and nothing was cancelled.
- **Landing costs a second cycle.** On main, CI never reuses a branch's run (CE-8), so moving main to a proven commit runs the full cycle again: 73 here. The register's forecast counted one cycle per batch; batches that land on main cost about two. That does not threaten the ceiling at this rate. I record it because the forecast in §2 of the register is the owner's figure.
- **What is left, at the measured rates:**
  - Batches 4 and 7 are the owner's and Daisy's.
  - Batch 5 is eight slices. At two cycles each (branch, then main), that is about **1,170** before each slice's staging walks.
  - Batch 6 is a full Golden School walk (about 44) and an audit (about 40), plus its cycles.
  - That is close to the **1,500** remaining. **The ceiling is likely to bind during batch 5.** I will say so in the batch report before it is reached, never after.
  - Meanwhile: no avoidable red runs: every plant gate a change touches runs locally before its dispatch.
