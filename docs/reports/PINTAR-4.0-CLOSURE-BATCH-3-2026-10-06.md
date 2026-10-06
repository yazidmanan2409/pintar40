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
| CI on 9a46bf5 | 37489874488 | _(pending)_ |
| main fast-forwarded; staging migrated | _(pending)_ | _(pending)_ |

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

## 6. The allowance (D-121(d): 1,900 estimated minutes, a ceiling)

_(filled at the end of the batch)_
