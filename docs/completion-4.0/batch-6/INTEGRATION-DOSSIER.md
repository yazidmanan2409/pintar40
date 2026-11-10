# Integration dossier · Batch 6 · the certificate, the Digital Card, A4 print and the identity emails, in the form of H §2

**Status:** drafted 8 Nov from the record. Batch 6 was built on the branch: code head `9b52b51`, `ci` 41748270096 (attempt 2) and journeys 41748274116 green. It was promoted with P-1 (PR #10, `main` `38d7e701`, 5 Nov) and has been on staging since. Later work changed it:
- D1, the identity emails, built at `be8a68c2`;
- D-192 and D-193, the text-only Inter wordmark (in `main` since P-7).

Every claim names its evidence; a check with gaps says so. **Human journey: not accepted (no recorded walk by a person).**

## 1. Dependencies

| Surface | Reads (database or code) | Read by |
|---|---|---|
| The certificate page and sheet (W3.19) | `my_certificate`; `LembarSertifikat` (`src/lib/sertifikat-lembar.ts`); `MerekSertifikat` | the print (`@page sertifikat`); `/verifikasi/<token>` through the QR (`verify_certificate`, unchanged); revocation from Batch 5 (`sertifikat_sekolah`, `revoke_certificate`) |
| The Digital Card (W3.20) on «Akun saya» and the activation welcome | `my_identity_card` (staff only); `susunKartu` and `urutKonteksKartu` (`src/lib/kartu-pintar.ts`); `MerekKartu` | the card email (`templatKartu`, `src/components/email/identitas.ts`); the print at CR80 |
| The identity emails (D1) | the four data types (`DataEmailKartu` among them), unchanged (D-164(b)); the frame `src/components/email/bingkai.ts`; the one sender `kirimEmail` | the activation, resend, recovery, password-changed, card and security emails |
| Email status (D-159(f), D-160(d)) | the send log's four provable states | «Kirim email uji», «Akun saya», the activation welcome |
| A4 print (W3.22) | `pin-noprint` and the print rules (`src/app/experience.css`) | every staff and learner shell, the class-card sheet, the card, the certificate, `/pengembangan` (E-C1-5) |

## 2. Data contracts and consumers: one fact, one value

- **The card and its email give one order (D-164):**
  - one sort, `urutKonteksKartu`, called by both;
  - B6K-URUTAN-02 checks every permutation, at one school, at two, and with the platform role beside school roles. It was red before the fix, green after (H §4 X1).
- **The email's card block takes its lines from `susunKartu`** (D1E-K14). The data types keep their fields (D1E-K15).
- **The certificate links to its verification URL:**
  - the QR decodes to the page's own verification URL (B6C-QR-01, B6C-DATA-01; `evidence/B6C/bukti.txt`, `dekode.mjs`);
  - the holder sees the name as issued and the link (staging GS-18 C2, run 42424027157).
- **A revoked certificate:**
  - the sheet shows no QR or link and keeps its banner (B6C-DATA-01);
  - the learner's list, the certificate page and the public link agree (journey S27v, run 42310079074).
- **One gold:** the certificate's line is the card's own token (B6C-SHEET-01).
- **Email words claim only what the log proves:** «Diserahkan», never «delivered» (B6E-K01, B6E-K02, B6E-K03).
- **The wordmark:** one renderer per slot. `MerekPintar`, `MerekSertifikat`, `MerekKartu` and the email frame all draw the text «PINTAR» (D-192, D-193; UX1-BRAND-01/02, B6K-MEREK-01).
- **Gap:** a professional-learning certificate is plum, because `my_certificate` carries no accent (`02` §2). The proposed migration (`accent` from `session_is_professional`) has no owner ruling in `DECISIONS.md` and is not built.

## 3. Authorisation and visibility, at the database

| Read | Given to | Refused (tested) | Evidence |
|---|---|---|---|
| `my_identity_card` | staff, for their own card | anyone who is not staff | B6K-STAF-01 |
| The holder's certificate | the holder | staff: the teacher's browser at the holder's page shows none | staging GS-18 C3 (42424027157) |
| `verify_certificate` | anyone, by token | a random or malformed code gets the private not-found (404) | staging GS-19 V1, V2 |
| Sending (P-2) | outside production, `pintarselalu.com` and reserved test domains only | every other address is held, not sent and not logged. The hold does not reveal whether an account exists | P2-PENERIMA-01; `batch-8/02` §4 |

- **No read was broadened** and the card's source is unchanged (B6K-DATA-01, `01` §4).
- **No photograph:** a planted photograph never renders (B6C-FOTO-01, B6K-FOTO-01).
- **Gaps:**
  - No database test reads `my_certificate` for another person.
  - No test covers a platform administrator, in «Seluruh platform», at a learner's certificate page or at another person's card.

## 4. Design and terminology across connected surfaces

- **The same shape where the same fact appears:** the card on screen, in print and in the email, with the same order and the colour of the first role (B6K-WARNA-01, D1E-K05).
- **Accepted frames:**
  - D1 is accepted for design (D-164, D-165) and built to it (D1E-K02–K08, K10, K12; `daisy-design-completion/06` D1);
  - the Design System page is republished as version 26 (register W3.21).
- **Gaps:**
  - X12: «kursus» remains in the certificate list's column «Kursus» and in `sertifikat.berkas`'s `{kursus}`, against Terminology v1's «paket» (C9, Dr Gladys and the owner).
  - The engineering-written words await Dr Gladys (`01` §3 item 9). So do D1's context line (P5) and `auth.link_sent`, which claims a little more than its evidence (`01` §3 item 7).
  - H29, the wordmark's clear space, is a manual check on staging, not done (register W3.21).

## 5. Exceptional conditions and multi-context journeys

- **Revoked:** B6C-DATA-01 and S27v. A defect was found on the way: after a new school year, a learner could not open her own certificate. It was fixed in `7ea62753` (`batch-9/evidence/staging-p5.md`).
- **Not yet eligible:** below the target there is no certificate, and opening the page creates none (journey S21i, STU-17).
- **Roles at two schools:** one role and its school per line, on the card and in the email (D1E-K05, B6K-URUTAN-02; `evidence/B6K/contoh-dua-sekolah.png`).
- **More than two pairs:** every line is drawn, and the card is marked `data-pengecualian` (D-074(10), unresolved). This is unreachable on staging, where all 67 role holders hold one pair (`02` §3).
- **Images blocked:** each email still says who, why and what (`audit/d1-email.mjs` E2).
- **Held and failed sends:** P2-PENERIMA-01; B6E-K01.
- **A staff member who is also learning:** the Guru gets two certificates as a participant, each verified by its token (journey C12d).
- **A platform role beside a school role:** two lines (B6K-URUTAN-02). A render is in `retrospektif/evidence/b4-kartu-platform-dan-sekolah-*.png`; it is visual evidence, not accepted (retrospective R6-2, B4 blocked).
- **Gaps:**
  - The PD certificate's sage accent (check 2).
  - Daisy has not drawn the platform role beside a school role (B4).
  - Nothing tests a platform administrator in «Seluruh platform» on these surfaces.

## 6. Regression

- **Restated, none weakened** (`01` §2): UX1-S0-TOKEN-01, UX1-V3-TOKENS-01, UX1-S0-FAKTA-01, UX1-BRAND-01, DAISY-20-LAYAR-01, B6C-SHEET-01.
- **D-192's restatements:** UX1-BRAND-01/02, B6K-MEREK-01, D1E-K06/K07, DAISY-19-EMAIL-01, EFF-K01, F01-R08.
- **Revocation and verification unchanged:** Batch 5's F26-C01/C02 and B5-W1 stay green (`02` §1).
- **The full local suite:** 773 passed, 0 failed (`evidence/full-suite-local.txt`).
- **Batch 6 adds no migration:** staging stayed at 193 until P-1 (`01` §1).

## 7. End-to-end journeys

- **J8.4, the certificate:**
  - job B's STU-17 steps: S21i, the certificate printed as one A4 page, and S27v;
  - staging GS-18 and GS-19 on the promoted builds: P-1 42049795788, P-4 42220729346, P-5 42320850695, P-7 42424027157 (18/18).
- **J2.16, the card:**
  - print walk P4 (85.6 mm per face, `audit/b6-cetak.mjs`);
  - journey S13, where a role granted on Peran & akses reaches the card (42293038982, 42310079074).
  - **Gap:** not walked on staging (`batch-9/evidence/staging-p5.md`).
- **J2.15, the emails:**
  - `audit/d1-email.mjs` E1–E3, in the journeys (`.github/workflows/audit-journeys.yml`);
  - on staging, the activation code reached the test mailbox in the J2.7 run 42163941604 (T2), and the J2.13 notice in P-4's R3 (42220729346).
- **Human journey:** not accepted (no recorded walk by a person).

## 8. Evidence

- **Runs:**
  - `ci` 41736195658 and journeys 41736200006 on `92aa3b2`;
  - `ci` 41748270096 (attempt 1 failed on runner infrastructure, kept) and journeys 41748274116 on `9b52b51`;
  - CI 42026560581 and journeys 42026579074 on P-1's head `afefaf72`.
- **Files:** `evidence/B6C/` (the 1-page PDF, the measured mm), `evidence/B6K/`, `evidence/cetak/b6-cetak.json`, `evidence/D1/d1-email.json` (3/3), `evidence/D1/red-before-build.txt` (9 red before the build).

## 9. Cross-feature UX consistency (D-172)

- **Print:**
  - one action, «Cetak atau simpan PDF»;
  - one rule, `pin-noprint`, on every shell (`b6-cetak` P1–P6);
  - Konfigurasi's section menu was found printing and fixed at the shared rule (B6P-K01).
- **Emails:** one frame, `bingkai.ts`, on all eight (D1E-K01; E-RB-7 closed, D-181).
- **Keyboard order in the emails:** `d1-email` E3.
- **Gaps:**
  - No Daisy side-by-side comparison of the certificate and card screens with their equivalents.
  - Print is proved in Chromium only, not Firefox, Safari or a real device (`01` §3 item 6).
  - No physical A4 or CR80 print proof, and no QR scan on two phones (retrospective R6-1, R6-2).
  - No cross-client email protocol: real Gmail and Outlook, light and dark (P6; `05-D1-IMPLEMENTATION-TEST-PLAN.md` §5).
  - No screen-reader pass by a person (W6.12).

## Verdict

- **Integration for Batch 6: partial.**
  - Checks 1 and 6–8 have evidence.
  - Checks 2, 3, 4, 5 and 9 have gaps: the PD accent, a platform administrator, another person's certificate at the database, X12, the card on staging, the physical and cross-client proofs, and Daisy's comparison.
- **UX consistency: partial. Human journey: not accepted.**
- Ledger note: H §3b's Batch 6 row is stale on design. F-11 is closed for development (D-192, then D-193). DAISY-37 is built as D1 (`be8a68c2`). W3.21 stage 2 is published (version 26). What stays open is the physical proofs, P5/P6, B4, H29 and the PD accent. This dossier now exists; integration stays **partial**.
