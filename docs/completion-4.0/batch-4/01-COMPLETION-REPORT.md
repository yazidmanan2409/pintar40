# Batch 4 · Administration, identity and account management: completion report (3 Nov 2026)

**Authority:** owner, 3 Nov: «PINTAR 4.0 — BATCH 4 DEVELOPMENT GO» (D-152). Owner rulings in this batch:
- **F-8:** a platform-admin screen corrects a username; a reason is required; the correction is audited.
- **F-10:** a minimal school directory. A school admin finds an active school by its exact name or code (name and code only, every search audited); the receiving school accepts the transfer.

**Branch:** `claude/awesome-rubin-bqxp6p`, head `93b8161 + the report commit`, on top of `main` `cb1ff3e`.
- Nothing was merged to `main`.
- Nothing was applied to staging or production.
- Dr Gladys's demonstration records were not touched.
- No 4.1, 4.5 or 5.0 work.
- W1.2, D1 and D3 remain registered as awaiting Daisy.

## Verdict: Batch 4 development complete. STOP at the Batch 4 promotion gate.

The exit gate is met locally: every administration action is done through the screens in a browser walk, with no SQL, and each act's audit row is asserted (`audit/admin-ujung.mjs`, 11 of 11 steps; §3). The walk now also runs as the last step of `audit-journeys`. The remaining gaps are listed in §4. Each is either a Daisy design that does not exist, so it is not invented here, or a deliberately recorded residual.

| Item | Requirement | Result |
|---|---|---|
| Card → staff | D-152(a); CR-91 kept | **DONE**: a class card becomes an email account, keeping the same person, account row, Auth user, PINTAR ID and history (§1.1) |
| W2.1 | Correct a wrong email (CR-13, J2.21) | **DONE**: «Koreksi data orang» (§1.2) |
| W2.2 | Correct a name (CR-14, J2.4; platform admin, D-077(3)) | **DONE** (§1.2) |
| W2.3 | Correct a username (CR-15, J2.17; F-8) | **DONE** (§1.2) |
| W2.8 | Profile photo on the profile only (CR-07, J8.8) | **DONE** (§1.3) |
| W2.9 | «Laporan saya» from the account menu (CR-78, J10.1) | **ALREADY DONE in Batch 2**; verified, register reconciled (§1.9) |
| W2.10 | Platform lists paged (CR-49, CAP-10) | **DONE**, with one recorded residual (§1.4, §4) |
| W2.13 (admin part) | UX-33 Konfigurasi waiting counts; UX-09 «nomor induk» | UX-33 **DONE**; UX-09 **AWAITING DAISY** (identity copy) (§1.5) |
| W2.15 | Transfers end to end; destination by name (F-10) | **DONE** (§1.6) |
| W2.19 | Stuck sends; «handed off» is not «accepted» (J1.9) | **DONE** (§1.7) |
| W3.5 | J2 Kelas roster as a Table | **DONE** (§1.8) |
| W3.6 | Konfigurasi | Approved-rule fixes only (RV-16 dates, RV-18 through W2.15). The page split and index are **AWAITING DAISY**: there is no composition (§4) |
| W3.7 | Pendataan, Aktivasi: field widths, hints, label case (RV-22) | **DONE** (§1.10) |

## 1. What was built

### 1.1 A class-card learner becomes staff (D-152(a)), CR-91 unchanged

**Database: migration 184, `20261217100000`**
- New table `card_conversions`.
- `authorize_card_conversion(person, email, reason)`:
  - Authority: CAN_PROVISION_PEOPLE in the learner's school, or the platform admin.
  - Refusals: REASON_REQUIRED, EMAIL_INVALID, CARD_NOT_FOUND, EMAIL_TAKEN.
- The `auth.users` card guard consumes the two-minute grant and converts **the same account row** to EMAIL:
  - it clears the card number;
  - set-up becomes REQUIRED;
  - the old PIN and sessions end;
  - the act is audited as `account.card_converted_to_email` with the reason, the old card and the new address.

**Screen:** Aktivasi, «Murid yang menjadi staf», beside «Kartu hilang atau rusak». It posts to `/api/akun/kartu-ke-email`, which:
- refuses another origin and a signed-out caller;
- checks the working context (CONTEXT_OTHER_PLACE);
- asks the database with the caller's own client;
- only then makes its one service-key write (Auth's address move).

The person then activates with a code sent to the new address. A staff role refused before the conversion (STAFF_ROLE_FOR_CARD) is accepted after it. CR-91 still decides in the database.

### 1.2 «Koreksi data orang» (`/aktivasi/orang`): W2.1–W2.3

**Finding people: migration 185, `orang_berakun`**
- Lists the people with an email account that the reader may correct:
  - the platform admin: everyone;
  - a school admin: their school's people.
- Paged at 20 per page, at most 50.
- Searches name, email, username, nomor induk and the PINTAR ID as typed (4+4, any case).
- Says which corrections this reader may make:
  - email: the platform admin, or the school admin before activation;
  - name and username: the platform admin only.

**The screen:**
- Daisy's Collection (Table, Search, Pagination), with a correction panel under the table.
- Every correction needs a reason, and the database audits it:
  - `identity.email_corrected`;
  - `identity.name_corrected`;
  - `identity.username_corrected`.
- After an activated person's email is corrected, PINTAR sends a security email to the old and the new address. This was already the route's behaviour; the copy now says so without promising more.

### 1.3 Profile photo (W2.8, CR-07)

- On «Akun saya», «Foto profil» uses the FileField: PNG, JPEG or WebP, at most 2 MB.
- **Upload:** through the one signed upload route, into `profile/<own person id>/`.
- **Keeping the path:** `/api/akun/foto` keeps it on the person only if it lies in the person's own folder and the file exists. The write uses the person's own client (`persons_update_own`).
- **Display:** the read route's 60-second signed URL. The page never signs a URL itself.
- **Removal:** «Hapus foto» takes the photo off the profile.
- **Never on a certificate:** the certificate reads no photo (D-076(b)(1)).

### 1.4 Platform lists paged (W2.10, CR-49, CAP-10)

- **Konfigurasi, «Seluruh platform»:** the schools are read a page at a time, with only those schools' years.
- **Problem reports:** a page at a time, in the database's order:
  - open reports first;
  - among them, a stopped class first, then the oldest waiting;
  - then the finished reports, newest first.
- **Maintenance windows and notices: migration 188, `20261221100000`.** `maintenance_list` pages them (20 each) and narrows them to a school in the database.
  - **Defect found while paging:** Konfigurasi used to filter windows in the browser by comparing schools' *names* with the context's school *id*. A school's own windows therefore never showed in its context. The database now does the filtering.
- **Aktivasi's class-card holders:** searched on the server, at most 20 per search. Every holder is no longer sent to the browser.

### 1.5 W2.13, administrator part

**UX-33, done.** Konfigurasi's landing shows «Yang menunggu», with each count read by the database:
- imports waiting for a go;
- people waiting for an account;
- packages waiting in Studio.

Only what this reader may act on in this context is shown. Each count opens the screen where the work is done. Nothing is drawn when nothing waits.

**UX-09, awaiting Daisy.** The register gives the renaming of «nomor induk» to Daisy's identity copy (DAISY-20/24). No ruling exists, so no term was invented.

**A labelling error found and fixed:** the corrections screen showed the school's nomor induk under the heading «PINTAR ID». It now shows the PINTAR ID (`persons.pintar_id`, 4+4).

### 1.6 Transfers by name (W2.15, F-10)

**Database: migration 186, `20261219100000`**
- `cari_sekolah_tujuan`: exact name or code only, active schools only, every search audited.
- `transfer_minta`: the sending school asks, with a reason and no school year.
- `pindah_masuk`: the receiving school's incoming and accepted transfers, with the learner's name.
- `transfer_terima`: the receiving school accepts into one of its own school years.
- `transfer_execute`: now refuses a transfer that has no school year.

**Auditing:** by the existing `transfers_audit` trigger, for both schools.

**Defect found by the walk:** the receiving school executed an accepted transfer shown as «—», because it may not read the learner's person row before execution. `pindah_masuk` now also returns accepted transfers, and the list names the learner from it.

### 1.7 Stuck sends (W2.19, J1.9)

- **Database: migration 187.** `email_send_stuck` lists, for the platform admin only, the sends still waiting on the email server after 10 minutes, with their age.
- **Screen:** «Email uji» shows them.
- **History wording:** a send with no answer reads «Diserahkan ke server email, belum ada jawaban» («handed off», not «accepted»). After 10 minutes it is marked as stuck.

### 1.8 J2 Kelas roster as a Table (W3.5, Daisy's J2Kelas)

- **`/mengajar/[kelas]/siapa`:** one Collection.
  - Each learner appears once, and their name opens their record.
  - Their state is shown as a Badge, in the words «Lihat bukti» counts under.
  - There is a search and a state filter with counts.
  - There is no score and no rank.
- **The class page's roster:** a Table of names alone, searched and paged.

EDU23 and M4 were restated against the Table with the same content asserted: the three states in order, each with its own empty sentence, and names that open the record. The journey reads the Table.

### 1.9 W2.9

`MenuAkun.tsx` has carried «Laporan saya» since Batch 2 (CR-78). It was verified in this batch, and the register is reconciled.

### 1.10 Pendataan and Aktivasi fields (W3.7, RV-22) and WIB dates (RV-16)

- The school code is Daisy's TextField: a sentence-case label, with the hint directly under it and named by the field. It sits on one row with its button.
- The intake's file and paste fields use the same field frame.
- Pendataan's job list and Konfigurasi's last two raw dates now go through the WIB date helper.
- RV-22's «request host» on Aktivasi is the real address on staging (the pass log, row 193), so it needs no change.

## 2. Test evidence

**New proofs:**

| Kind | IDs | What they prove |
|---|---|---|
| Database (`selftest/db/fable24.sql`) | F24-K01, K02, O01, P01, P02, E01, H01 | The conversion and its refusals; finding people (PINTAR ID as typed); the transfer and its refusals; stuck sends; maintenance paging |
| Static (`selftest/b4.test.ts`) | B4-KARTU-K01, FOTO-K01, ORANG-K01, PINDAH-K01, HAL-K01 (the paging arithmetic executed), MENUNGGU-K01, J2-K01, BIDANG-K01 | The source of each feature |
| Live (`selftest/b4.test.ts`) | B4-KARTU-A01 | A card learner converted, activated with a code to the new address, and given a staff role |

Each guard fails on `cb1ff3e` and passes on this branch.

**Two real bugs in migration 188 were caught by F24-H01 before any commit:**
- a row of the wrong type was passed to `maintenance_state`;
- `row_number()` was computed before OFFSET, which left page 2 empty.

**Full suite** on a freshly reset database and a fresh build: 726 passed and 2 failed of 728 (F06-N02: the three transfer refusals did not name CAN_AUTHORIZE_TRANSFER; L4-K01: the transfer-name expression changed). Both were fixed in `93b8161` and re-run green. The ledger is `evidence/full-suite-local.txt`.

**Restated tests, each with its reason in the file:**
- EDU23 and M4: the roster is now a Table (§1.8).
- BOB28-A03: asks the screen with the learner's name, now that holders are searched (§1.4).
- BOB15-S01: the triage call carries its page.
- L4-K01: the transfer row's name, its own first, then the receiving school's `pindah_masuk` name (§1.6).
- F22-P05: classifies the new action files and routes:
  - the name and username corrections are platform-scoped;
  - the photo route is the person's own;
  - the card conversion is context-bound.
- The two migration-count baselines move from 183 to 188. The reading is recorded: no new migration touches the tour or any mark, logo or theme.

No test was removed or weakened.

**The static suite also caught issues in this batch's own code, all fixed:**
- the service key was used outside `src/app/api`;
- copy read as an internal word, or promised a notification;
- forms submitted without TombolKirim;
- a `.details` read sat in a server-action file;
- a function was re-emitted without restating its grants (ADR-0021);
- the new route was missing from the route inventory and the re-set surfaces.

**Browser walk (exit gate):** `audit/admin-ujung.mjs`, 11 of 11 steps. Screenshots are in `evidence/admin-ujung/`.

| Step | Done at the screen | Recorded and asserted |
|---|---|---|
| W0 | School code on Pendataan | `institutions.namespace` |
| W1 | Name correction with a reason | `identity.name_corrected` and its reason |
| W2 | Username correction | `identity.username_corrected` |
| W4 | Class card on Aktivasi | `account.*` row; CLASSROOM_CARD account |
| W5 | Card → email account | `account.card_converted_to_email`; same account row, now EMAIL |
| W3 | Email correction (not yet activated) | `identity.email_corrected`; new Auth address |
| W6 | Directory search and transfer request | `directory.school_searched`, `transfer.requested` |
| W7 | Receiving school accepts, then executes | `transfer.authorized`, `transfer.executed`; enrolments moved |
| W8 | «Yang menunggu» count opens Aktivasi | count ≥ 1 |
| W9 | Stuck send on «Email uji»; schools paged | listed with its age |
| W10 | Profile photo added, shown, removed | `persons.photo_path` set, then cleared |

## 2a. CI evidence on the candidate (PR #7, head `b66c4bb`)

The candidate is [yazidmanan2409/pintar40#7](https://github.com/yazidmanan2409/pintar40/pull/7). Its head is `b66c4bba9fe7468225d0be30123328ffb5115c2f`.

- **`ci`, run 41587206549:** all 18 jobs green, including the verdict job «green only when every job ran and succeeded». The jobs are:
  - install, lint, typecheck and build;
  - the migrations from a clean database plus seed, and the upgrade path from the previous schema to HEAD;
  - the strict selftest contract on the local stack, which runs the full manifest, the new Batch 4 proofs included;
  - every red-case job, static and db.
- **`audit-journeys`, run 41587216584**, dispatched with `ref` set to the head SHA (the run log names `b66c4bb`), both jobs green:
  - **A · every role's screens in the seeded world:** the crawl, the Studio walk (W6.5) and **the Batch 4 administration walk, 11/11 PASS** (B4-W0 to B4-W10).
  - **B · Gladys's path from an empty production-like database:** PASS.

So the exit gate holds in CI as well as locally.

## 3. Security boundaries kept

- **School isolation:**
  - the correction finder, the directory and the incoming transfers are each scoped in the database;
  - the receiving school sees the learner's name only, until execution;
  - the maintenance list is narrowed to the school by the database.
- **Least privilege:**
  - name and username corrections: the platform admin only;
  - email: the school admin before activation;
  - every Batch 4 act is checked against the working context or classified as exempt by name.
- **Staff and learner separation:** CR-91 still decides in the database. A card becomes an email account before any staff role is given.
- **Service key:** used only under `src/app/api`. Each route asks the database with the caller's client before its one service-key act.

## 4. Remaining gaps and blockers

| Item | Status | Why |
|---|---|---|
| W3.6 Konfigurasi page split and index (Collection sections, RV-24, RV-15) | **AWAITING DAISY** | No composition exists; not invented. RV-16 and RV-18 are done (§1.10, §1.6) |
| UX-09 «nomor induk» naming | **AWAITING DAISY** | Identity copy (DAISY-20/24); no ruling exists |
| W1.2, D1, D3 | **AWAITING DAISY** (unchanged) | Registered in Batch 3 |
| Aktivasi's waiting-for-account list | **RESIDUAL (W2.10)** | Not paged. Seven journeys find people on its first page, and the list holds only people with no account yet, so it empties as accounts are made. Card holders, the permanent population, are searched on the server. Paging this list needs a server search and journey changes; proposed as a follow-up |
| CI evidence | **DONE** | Green on the head SHA; see §2a |
| Staging | **NOT APPLIED** | Migrations 184–188 reach staging only on the promotion authorisation |

## 5. Stop

Batch 4 development stops here, at the promotion gate. Promotion needs separate authorisation:
1. a PR to `main`;
2. CI and `audit-journeys` on the head SHA;
3. migrations 184–188 applied to staging;
4. the walk repeated on a staging test school.
