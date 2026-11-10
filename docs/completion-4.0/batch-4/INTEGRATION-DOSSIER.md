# Integration dossier · Batch 4 · administration, identity and accounts (W2.1–W2.3, W2.8, W2.9, W2.10, W2.15, W2.19, W3.5–W3.7, D-152(a)), in the form of H §2

**Status:** drafted 8 Nov from the batch's records (`01`–`04`, `evidence/`), the later corrections B1 (D-166(a), built `c4e2ffe3`) and B2 (D-174, D-175), W2.10's completion in Batch 5 (D-158), the register (`C-OPEN-WORK-REGISTER` W2.x, W3.5–W3.7), the retrospective (`retrospektif/01-REGISTER.md` R4-1…R4-7) and the staging records to P-7 (`batch-9/evidence/staging-p5.md`, `staging-p7.md`). Every test id below is in `selftest/manifest.json`. A check with gaps says so.

## 1. Dependencies

| Surface (page) | Reads / writes (database, Auth, Storage) | Read by |
|---|---|---|
| Aktivasi «Murid yang menjadi staf» → `/api/akun/kartu-ke-email` | `authorize_card_conversion`, `card_conversions`, the `auth.users` card guard (migration `20261217100000`) | role grants (CR-91); the activation email |
| `/aktivasi/orang` «Koreksi data orang» | `orang_berakun` (`20261218100000`); `correct_person_name`, `correct_username`; `/api/akun/email` → `authorize_email_correction` | the identity emails; the audit trail; the Digital Card's name |
| «Akun saya» «Foto profil» → `/api/akun/foto` | `persons.photo_path` (own row), Storage `profile/<person id>/`, the read route | the profile only, never the certificate or the card |
| Konfigurasi › Pindah | `cari_sekolah_tujuan`, `transfer_minta`, `pindah_masuk`, `transfer_terima`, `transfer_execute` (`20261219100000`, `20261231100000`) | enrolments, memberships, the class page of the receiving Guru, the learner's own pages |
| «Email uji» | `email_send_stuck` (`20261220100000`) | — |
| Konfigurasi index and section pages (B1) | `maintenance_list` (`20261221100000`); `studio_home`; `persons_awaiting_account` | server actions, Persiapan, Ringkasan and the walks, through the old addresses (E-B1-1) |
| Aktivasi waiting list | `persons_awaiting_account_page` (`20261224100000`, Batch 5) | «Yang menunggu»; the card exclusions (`kelas_dikecualikan_kartu`, Batch 9) |
| `/mengajar/[kelas]/siapa` and the class page | the roster; `pisahSiapa` (`src/lib/pengajar.ts`) | «Lihat bukti», the learner's record |

## 2. Data contracts and consumers: one fact, one value

- **What a reader may correct:** the panel offers only `orang_berakun`'s `boleh_email` and `boleh_identitas`, the database's own answer (B4-ORANG-K01, F24-O01). The link derives from the same permission as the act.
- **The identity emails:** after a correction, the old and the new address each get one notice that carries no address (PENUTUPAN-A01). The context line is drawn only where the data has a place (D1E-K03; D-164(a), X8). All eight emails pass the frame (D1E-K01).
- **The audit contract:** `identity.email_corrected`, `identity.name_corrected`, `identity.username_corrected`, `account.card_converted_to_email`, `directory.school_searched`, `transfer.requested/authorized/executed`, each read back by the walk (`admin-ujung` B4-W1–W7; staging P2–P6).
- **The waiting counts:** «Yang menunggu» reads `studio_home` (as Studio home does) and `persons_awaiting_account` (B4-MENUNGGU-K01); its reasons add up to the count (F33-A01, B4-MENUNGGU-K02).
- **The learner's name across schools:** before execution the receiving school reads it from `pindah_masuk`, not the person row. The «—» defect was fixed at that source (`01` §1.6; L4-K01 restated).
- **The school registration number:** one term in every key, both languages, kept apart from the PINTAR ID (D-174, D-175; D168-B2-1, extended by R4-7).
- **Gaps:**
  - no test asserts that the «Yang menunggu» count equals the Aktivasi list's total for the same reader. B4-W8 checks only a count ≥ 1 that opens Aktivasi.
  - X7: «staf sekolah Anda» in «Seluruh platform» is still open (Daisy B1, words Dr Gladys).

## 3. Authorisation and visibility, at the database

| Read / act | Given to | Refused (tested) | Evidence |
|---|---|---|---|
| `authorize_card_conversion` | CAN_PROVISION_PEOPLE in the learner's school; the platform admin | a Guru, another school's admin (42501); no reason, a bad or taken address, no card; an address moved without the grant | F24-K01, F24-K02, F24-K03, B4-KARTU-A01 |
| `orang_berakun` | the platform admin (everyone); a school admin (their school) | a Guru (nobody); another school | F24-O01 |
| Name and username correction | the platform admin only | a school admin (42501) | F24-O01, B4-ORANG-K01 |
| Email correction | the platform admin; the school admin before activation | a teacher after activation (DITOLAK) | PENUTUPAN-A01, F24-O01 |
| `cari_sekolah_tujuan`, transfers | the sending and the receiving school's CAN_AUTHORIZE_TRANSFER | a Guru searching; two letters; the sender accepting its own request; the receiver asking for another school's learner | F24-P01, F24-P02, F06-N02 |
| After execution | the receiver reads the learner's PORTABLE history (INV-25) | the sender reads no future enrolment; the receiver no INSTITUTION_SCOPED row | F24-P03 (identity digest unchanged) |
| `email_send_stuck` | the platform admin | everyone else | F24-E01 |
| `maintenance_list` | narrowed to the school in the database | a platform notice in a school's context | F24-H01 |
| `persons_awaiting_account_page` | the school's provisioner | nothing narrowed to another school | F26-W01 |
| `persons.photo_path` | the person's own row | a direct update by anyone else | F01-T17 |

- **On staging:** the nine new functions are SECURITY DEFINER with `search_path=public, pg_temp`; anon refused; `card_conversions` has row security and no policy (`04` §2).
- **Gap:** no database or Storage test that another person cannot read an object under `profile/<id>/`. B4-FOTO-K01 reads the route's source.

## 4. Design and terminology across connected surfaces

- **One term:** «Nomor Registrasi Sekolah» (D-174; D168-B2-1). The «PINTAR ID» heading that showed the nomor induk was corrected (`01` §1.5).
- **Navigation:** Konfigurasi is an index and one page per section (B1, D-166(a)). «Seluruh platform» lists exactly Sistem, Peran & akses, Jejak audit, Laporan masalah and Pemeliharaan (D168-B1-1). The sections follow the menu's rule (D168-B1-5; X6, D-169(a)).
- **Old links:** every older `/konfigurasi?bagian=…`, section parameter or `#fragment` is one redirect to its section page, with the same result line (D168-B1-1; E-B1-1, X10).
- **Gaps:**
  - E-B1-2 (`config.refused`'s two languages disagree) and E-B1-3 (the seed school's name) are BLOCKED on copy (R4-6);
  - `config.kelompok.*` and `context.manage_label` await approval;
  - X9 («Pengembangan», «uji» for environments) waits on Dr Gladys.

## 5. Exceptional conditions and multi-context journeys

- **Interrupted, expired, retried:** a card conversion stopped at each point leaves one account, never two, and never a staff role on a card (F24-K03; CR-91).
- **Refused:** every refusal has its code and a sentence in both languages (B4-KARTU-K01, B4-ORANG-K01, F24-P02).
- **Stuck sends:** «handed off» is not «accepted»; a send is shown after 10 minutes (F24-E01; B4-W9; staging P7).
- **Empty:** «Yang menunggu» is not drawn when nothing waits (B4-MENUNGGU-K01; staging P7).
- **A transferred learner:** placed in the receiving Kelas, and their Guru finds them (`20261231100000`, F24-P01; staging P6 42323858693). The defect of 6 Nov, an executed transfer that left the learner in no class, was fixed at source (`staging-p5.md`).
- **A person in two schools:** the transfer keeps the nomor induk, PINTAR ID, results and certificates (F24-P03). Afterwards the learner signs in and is offered nothing of the old class (B4-W7b, in CI only).
- **A learner who becomes staff:** the class card becomes an email account (F24-K01; B4-KARTU-A01; staging P3–P4).
- **A platform administrator in «Seluruh platform»:**
  - corrects a name and a username there, audited, and puts them back (staging P2, 41612169706);
  - sees no school-shaped section (D168-B1-5);
  - is shown the schools a page at a time (B4-HAL-K01; staging P7).
- **Gap:** a staff member who is also learning, as a PD participant, is not exercised on «Koreksi data orang» or on the roster. The roster's participant words are X2 (E-C2-1, E-C2-2).

## 6. Regression

- **Restated, with the reason in the file:** EDU23-K01 and M4-K01 (the roster is a Table), BOB28-A03, BOB15-S01, L4-K01, F22-P05, F06-N02 (`01` §2). Nothing was removed or weakened.
- **Baselines:** the migration counts moved 183 → 188 with the reading recorded.
- **The full suite:** 726/728, then green after `93b8161` (`evidence/full-suite-local.txt`).
- **Way back:** `ROLLBACK-184-188.sql`, tested locally in both directions (`02` §1).
- **Staging:** GS-01–21, Studio and accessibility green on «Sekolah Uji B4 1103» (`04` §3). Dr Gladys's school, its people and its accounts are byte-identical (`evidence/preservation-before.txt`, `-after.txt`).

## 7. End-to-end journeys

- **CI:** `audit/admin-ujung.mjs` B4-W0–W11 with W7b, in journeys job A (`.github/workflows/audit-journeys.yml`).
- **Staging, administration:** `audit/staging/golden-school-pentadbiran.mjs` P0–P8.
- **Staging, set-up (GS-04–11):** `audit/staging/golden-school-admin.mjs`, which opens the Konfigurasi section pages from the index.
- **J-numbers:** J2.4, J2.17, J2.21, J3.10, J8.8, J10.1, J1.9, J2 Kelas.
- **Gaps:**
  - the Batch 4 administration walk did not run in P-6 or P-7; its last staging run is P-5, 42323858693;
  - B4-W7b, UX-33's shown case (B4-W8) and the maintenance flow (B4-W11) are walked in CI only.
- **Human journey:** not accepted (no recorded walk by a person).

## 8. Evidence

- **Candidate:** CI 41587206549; journeys 41587216584 (admin walk 11/11 on `b66c4bb`).
- **Promotion (D-153, D-154, D-155):** CI 41593789975 and 41596379905; merge `31e456d`; staging P0–P8 41612169706 9/9; a11y 41613954494.
- **Later:**
  - B1's section pages from the index: GS-04–11 42043970344 (5 Nov) and 42422594024 (P-7);
  - P-5: administration 42323858693, journeys 42310079074 (B4-W7/W7b);
  - the latest journeys, 42409388669, have job A green, and job A runs `admin-ujung.mjs`.
- **Screens:** `evidence/admin-ujung/` (10 screenshots and the run's JSON).

## 9. Cross-feature UX consistency (D-172)

- **One Collection:** Table, Search and Pagination on «Koreksi data orang», the roster and the waiting list (B4-ORANG-K01, B4-J2-K01, F26-W01).
- **One field set:** TextField, FileField and TombolKirim for the school code, the intake, the photo and the card conversion (B4-BIDANG-K01, B4-FOTO-K01, B4-KARTU-K01).
- **Records and destructive acts:**
  - a row's one action at its end, named with its record (D168-B1-3);
  - «Hentikan sekarang» last, with a typed phrase (D168-B1-6);
  - the B1 #9 recount holds by D168-B1-3/6/7, D168-K2-1, DAISY-17-KIRIM-01 and DAISY-18-DENGAR-01.
- **Widths, axe, keyboard:** every Konfigurasi section page at four widths, keyboard at 1280 (`audit/rb-ujung.mjs` RB1-B1); B2's explanation rendered (RB5).
- **Gaps:**
  - no Daisy side-by-side for «Koreksi data orang», «Murid yang menjadi staf», the transfer screens or «Email uji»;
  - no screen-reader pass by a person (W6.12).

## Verdict

- **Integration for Batch 4: partial.**
  - Checks 1, 6 and 8 are complete.
  - Checks 2, 3, 4, 5, 7 and 9 have gaps: the count equality; X7; the Storage read of a photo; copy E-B1-2, E-B1-3 and X9; the PD-participant case; staging walks older than P-7, with W7b, W8 and W11 in CI only; Daisy's comparison; a person's screen-reader pass.
- **Human journey: not accepted** (no recorded walk by a person).

Ledger note: in H §3b, «B1 provisional» and D-156(a)'s open items are out of date. B1 is accepted for design (D-166(a)) and built (W3.6, `c4e2ffe3`), and W2.10 is complete (F26-W01, D-158). Design acceptance stays partial only for copy (E-B1-2, E-B1-3, X7, X9). The ledger's walk `admin-ujung.mjs` is the CI walk; the staging walk is `golden-school-pentadbiran.mjs`.
