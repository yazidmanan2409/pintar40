# Integration dossier · Batch 1 · data model and security (CR-91 / W5.1, W1.6, W1.8, W1.13, W4.1, F-4 / W5.2), in the form of H §2

**Status:** drafted 8 Nov from the batch's own reports (`01`–`05`, `F4-EXPOSED-ITEM-INVENTORY.md`), the register rows (`C-OPEN-WORK-REGISTER-2026-11-02.md`), the retrospective (`retrospektif/01-REGISTER.md` R1-1…R1-8, baseline `be8a68c2`: ci 41842329505, journeys 41842334345) and the manifest's own «proves» sentences. Every test id below is in `selftest/manifest.json`. Promoted as `430544b` (PR #3, D-147). A check with gaps says so.

## 1. Dependencies

| Feature | Database (migration) | Reads it (surface) |
|---|---|---|
| CR-91 | `20261212100000_a_class_card_is_a_learners_alone.sql` (179): triggers `accounts_card_is_learners`, `role_assignments_card_holds_no_role`; `memegang_peran_staf`, `kartu_bukan_staf()`; `authorize_account_activation`, `authorize_card_reissue`; `persons_awaiting_account.boleh_kartu` | the card sign-in (`src/lib/kartu-masuk.ts`, `src/app/api/masuk/kartu/route.ts`); Aktivasi's «kartu» offer (`src/components/aktivasi/kelas.ts`, `src/app/aktivasi/page.tsx`); card re-issue (GS-17–21); Batch 4's «Murid yang menjadi staf» (`authorize_card_conversion`, B4-KARTU-K01/A01) |
| W1.6 send-back | `20261213100000_a_reviewer_may_send_a_package_back.sql` (180): edge IN_REVIEW → VALIDATION_FAILED; `kembalikan_paket`, `paket_dikembalikan` (181) | Studio's `LangkahTerbit` and `kembalikanPaketAksi` (Batch 3, STUDIO3A-KEMBALI-01); `package_revision_problems` (the correction path) |
| W1.8 history | `content_review_outcomes`, trigger `courses_review_outcome` (181); `nama_riwayat_paket` (`20261215100000_a_package_names_who_reviewed_it.sql`, Batch 3) | the package page's «Riwayat perbaikan» (STUDIO3A-RIWAYAT-01); the probe helpers `purge_probe_content`, `f05_reset` (`01` §2.2–2.3) |
| W1.13 atomic step | `langkah_konten` (181, SECURITY INVOKER) | `advanceContentAction` (`src/app/studio/actions.ts`); Studio's «Tandai…» steps (walk U3, `audit/studio-ujung.mjs`) |
| W4.1 wording | `20261211100000_db_wording_follows_terminology_v1.sql` (178): `learner_readable_fields.judul_kolom`, `validate_course_content`, `run_mcq_quality`, 4 `doctrine_lexicon` rows | coaching and question-quality findings in Studio; the seed's persona labels (B15/B16) |
| F-4 | no migration; 82 keyed files removed; `docs/onboarding/konten-sintetis/`, `audit/fixtures/sd5-sintetis-bab{1,2}`; `scripts/guard/sensitive-scan.mjs` | every test, audit and workflow that read a chapter (L4-C01/P01, PENUTUPAN-M04, DAISY-30-TEKS-01); the exposure flag of Batch 6/K6 (`20261228100000_exposed_questions_never_give_a_real_verdict.sql`, F27-X01…X06) |

## 2. Data contracts and consumers

- **`boleh_kartu`** (`persons_awaiting_account`): Aktivasi offers a card only where the database says so (CR91-K02). The offer is derived from the same rule the database enforces (F23-C01), as H §2 requires, not hidden by a screen rule.
- **`kartu_bukan_staf()`**: the card sign-in asks it as the new session and fails closed; the refusal is one generic code, the session ended for this device only (CR91-K01, BOB05-K01).
- **Refusal codes** (CARD_FOR_STAFF, STAFF_ROLE_FOR_CARD, SENDBACK_NOT_REVIEWER, SENDBACK_REASON_MISSING, SENDBACK_NOT_IN_REVIEW, SENDBACK_REVIEWER_IS_AUTHOR): the SENDBACK_* each reach the screen as their own code with a sentence in both languages (`src/lib/galat-kontrak.ts`, STUDIO3A-KEMBALI-01).
- **`content_review_outcomes`**: one fact, two consumers. The step's last reason on `LangkahTerbit` (STUDIO3A-KEMBALI-01) and the history's who/why/when (STUDIO3A-RIWAYAT-01, F23-W05) read the same rows; walk U12 shows both.
- **Old app on the new database:** compatible except a sent-back package shows as «dikembalikan» (`02-MIGRATIONS-AND-EFFECTS.md`, compatibility table).
- **Gap:** no test asserts that the reason shown on `LangkahTerbit` and the reason in «Riwayat perbaikan» are the same row for the same version (each is asserted on its own).

## 3. Authorisation and visibility, at the database

| Act | Given to | Refused (tested) | Evidence |
|---|---|---|---|
| a card account | a learner | a Guru, a Guru whose role starts tomorrow (activation); a planted grant, the seed branch, a re-point (account trigger) | F23-C01, F23-C02 |
| a staff role | an email learner | a card learner, through `grant_role` by the school admin **and by a Platform Admin**, and the seed path | F23-C03 |
| legacy card + role | — | the card's session (`kartu_bukan_staf` false), its re-issue (CARD_FOR_STAFF) | F23-C04 |
| staff power through a card | — | provision, review, school admin, Admin platform, activation list | F23-C05 |
| role transitions | a revoked or expired Guru may take a card | a role after the card (STAFF_ROLE_FOR_CARD) | F23-C07 |
| send back | CAN_REVIEW, not the author, reason 10–1000 | the author, a Dekan, no reason, an approved package, a reviewer who wrote it; the edge outside `kembalikan_paket` | F23-W02 |
| read the outcomes | the school's author and reviewer | another school's administrator; any update or delete (PR080) | F23-W04, F23-W05 |
| the content step | whatever RLS and `enforce_content_status` admit (INVOKER) | a step refused at its last table moves nothing | F23-W01 |

- **On staging,** as the test school's own people in a rolled-back statement: every refusal above and the accepted send-back (`05` §4.2); card holders with a staff role platform-wide: 0 (`05` §5).
- **At the baseline,** directly on the tables as the database owner (R1-1); `kembalikan_paket` SECURITY DEFINER with its length check (R1-2); `langkah_konten` invoker (R1-4).
- **Gap:** no test of the platform administrator reading `content_review_outcomes` or calling `kembalikan_paket` (F23-W04/W05 cover another school's administrator only).

## 4. Design and terminology across connected surfaces

- **W4.1:** findings name the workbook's column, never the database's; no «siswa» rule; «murid» and «Bank soal untuk paket ini» (F23-T01; R1-5 read the schema at the baseline).
- **The package noun:** the history's correction lines say «paket», not «kursus» (STUDIO3A-RIWAYAT-01); the send-back's English has no «course» (R3-A5-01). The Indonesian «kursus» strings elsewhere are X12 / C9 (H §4), Dr Gladys and the owner.
- **The card refusal** names no reason to the person at the card (CR91-K01).
- **Gap (BLOCKED):** C31 retained (ruling 7); the English coaching rule's label and RV-15's seed name have no approved text (E-B1-3, R1-5). Terminology v1 is Dr Gladys's (ledger).

## 5. Exceptional conditions and multi-context journeys

- **Superseded / revoked / expired:** a revoked or expired role no longer blocks a card; a future role does (F23-C07, F23-C01). Legacy card + role ended at sign-in (F23-C04).
- **A staff member also learning:** the enrolled Guru keeps one EMAIL account with Belajar and Mengajar (F23-C06; `04` §3).
- **A learner who becomes staff:** CR-91 refuses the role over the card (`04` §3); Batch 4's conversion card → email, on the same account row, then the role is accepted, the reason audited (B4-KARTU-A01, D-152(a)).
- **A platform administrator:** refused a staff role for a card learner (F23-C03); performs the card → email conversion only with a reason (B4-KARTU-A01).
- **Two schools:** another school's administrator reads no outcome (F23-W04/W05); on staging T16 read reviewer names from the «other school» (`batch-3/04`, walk 41540087994).
- **Partial failure:** nothing moves (F23-W01); the old five-request path would have left a mixed tree (`01` §2.1).
- **Gap:** a person holding a staff role in one school and a card in another: held by construction (`memegang_peran_staf` counts any school's role, migration 179 lines 32–39) but no test plants it.
- **Gap:** the platform administrator in «Seluruh platform» on Aktivasi's card offer: no Batch 1 assertion (Batch 2 met that screen, `batch-2/03` §4).

## 6. Regression

- **Educator-as-learner:** F23-C06, green before and after (`01` §2.1).
- **F-4's restated tests**, each shown red on a broken fixture: L4-C01, L4-P01, PENUTUPAN-M04, DAISY-30-TEKS-01, SEC-G01, SEC-G02; PENUTUPAN-F01 restated into `langkah_konten`.
- **The 323 first-run failures**, traced, none suppressed (`01` §2.2); BOB05-K01 caught the global sign-out; BOB07-K01/K02, BOB32-K02 the coded refusals.
- **Helpers:** `f05_reset` red twice on one database (ci 41384760756), fixed in `dabafa5`, green 41387912678.
- **On `main` after the merge:** ci 41398310519 green. At the retrospective baseline F23-C01…C06, CR91-K01/K02 green (R1-1).
- **Preservation:** «Sekolah Demo PINTAR» 4 / 10 / 10 / 3 / 5 / 1, audit 91, unchanged (`05` §5).

## 7. End-to-end journeys

- **Golden School on staging** (school `sekolah-uji-b1-1102`, founded 41400107343): GS-01–03 41400228976; GS-04–11 41400643297 (W1.13 whole tree APPROVED, W1.8 one outcome); GS-07/12–16 41401958860 (CR-91 cards); GS-17–21 41403668209 (re-issue, shared computer). All PASS (`05` §4.1).
- **Journeys A and B** on the final candidate `d4cc538`: 41391072019 green (`04` §2).
- **The send-back through the screen** (J4.3, J4.12): Studio walk U3, U4, U12 (`audit/studio-ujung.mjs`; R1-2…R1-4); staging Studio walk T5–T7, T12, T16 in 41540087994, re-walked 41570204639 (register W1.6, W1.8).
- **Human journey: not accepted (no recorded walk by a person).** Dr Gladys's walkthrough deferred (D-141).

## 8. Evidence

- CI: 41387912678 (`dabafa5`, 674/0/0); 41391068557 (`d4cc538`, 675/0/0); PR 41396610763; `main` 41398310519.
- Staging: migrations 41398310527 (181 applied); facts 41400103860; accessibility 41402855483 (no new finding against the Batch 0 baseline, `05` §4.3).
- Local: 673 passed; every DB suite 319 rows, 0 failing (`01` §2.2).
- **F-4:** the inventory of 619 exposed items and their use (`F4-EXPOSED-ITEM-INVENTORY.md`); `sensitive-scan --tree` 0 not allowed (R1-6).
- **Gap (BLOCKED, owner):** the private content store, its access list and regeneration under new identities (E-K6-2), and production residency (E-K6-1), register W5.2.

## 9. Cross-feature UX consistency (D-172)

Batch 1 has two screens of its own (Aktivasi's offer, the card sign-in); its send-back screens are Batch 3's.
- **Confirming a destructive act (P8, `X-KONSISTENSI/README.md` on `origin/ux-1/daisy-experience`):** the send-back confirms in place with a reason of 10–1000 characters and «Batal» (STUDIO3A-KEMBALI-01), as P8 says.
- **Refusal (P15):** the card refusal is one generic code (CR91-K01); the send-back's refusals each have their sentence (STUDIO3A-KEMBALI-01).
- **A history (P21):** «Riwayat perbaikan» is a record read in order (STUDIO3A-RIWAYAT-01; walk U12).
- **Step list (K8, E-RB-10):** the step markers on `LangkahTerbit`, which hosts the send-back (D168-K8-1, walk U8).
- **Gap:** no Daisy side-by-side comparison of Aktivasi's card offer or the send-back against similar screens is recorded for this batch.
- **Gap:** no keyboard, screen-reader or phone pass recorded on the send-back confirmation itself (only the Batch 0 harness on staging, 41402855483).

## Verdict

- **Integration for Batch 1: partial.** Checks 1, 6 and 7 (automated) are evidenced; checks 2, 3, 4, 5, 8 and 9 each carry a gap above.
- **UX consistency (D-172): partial** (P8, P15, P21 matched; no Daisy comparison).
- **Human journey: not accepted (no recorded walk by a person).**

Ledger note: H §3b's Batch 1 UX cell cites «E-RB closure (D-181)»; of E-RB-1…10 only E-RB-10 (the step list where the send-back lives) touches a Batch 1 consumer, so that cell's evidence is P8/P15/P21 above, still partial. The other cells stand.
