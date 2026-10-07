# PINTAR 4.0 · Closure landing L2: forms and Studio boundaries (D-128, D-129)

**7 October 2026.** The second landing D-128 authorised:
- CR-84 (form contract and Uji Cepat);
- CR-87 (Studio purpose and role boundaries), with FD-8;
- FD-7 and FD-9;
- FD-5, Option A (D-129(c));
- L1's two approved instrument lines (D-129(f)).

**This report is a stop.** L3 begins with its one-page Working Context design, for the Second Eye, before any code (D-128(a), D-129(i)).

No screen was redesigned. What changed on screen are the ruled boundaries:
- tabs and forms that left;
- choices that are now names, not ids;
- refusals that are now named;
- values that are kept.

Every new word on a screen is one the copy table already had (D-128(g)).

## 1. What landed

| Item | Ruling | What changed | Proof (red before → green after) |
|---|---|---|---|
| **CR-84 (1)** One human Uji Cepat journey | D-127 Q4 | Studio's own launcher has gone: page, tab and action. `launch_quick_assessment` and its proofs stay: the class's Uji Cepat (D-085 T2) launches through `launch_selected_quick_assessment`, which calls it | QAC-S01 restated; PENUTUPAN-T01 |
| **CR-84 (2)** Every known refusal named | D-127; DG-23, DG-31 | Every refusal of every database function behind a Studio form in use (66 refusals of 10 functions, behind 18 actions), read from its latest migration, now reaches the screen as a named sentence. **All but one map to an existing code whose existing sentence is true of it**, so there are no new words. The one left on the reference line is «no scoring policy in force», the platform's own state | **BOB32-K02** (new): red on L1's code (the Studio launcher's 12 refusals, and every unnamed one), green |
| **CR-84 (3)** A refused form keeps what was sent | D-127; DG-24 | Ten Studio forms. What was sent is kept for one press in the tab's own session storage (never the address, a cookie or the server). It is put back only when the page says that submission was refused, for the same person, into the same form (its hidden identity unchanged). A file or a secret is never kept (`src/lib/isian.ts`, `SimpanIsian`) | **PENUTUPAN-V01** (new): the rule driven, every form bound; red on L1's code |
| **CR-84 (4)** No combination the database refuses for tenancy | D-127 | Aturan Penilaian takes the school from the chapter chosen: there is no second picker that could disagree with it (INV-13). Pustaka PINTAR lists only the library's published packages, the schools and the open grants | PENUTUPAN-F01, PENUTUPAN-P01 |
| **CR-84 (5)** The certificate layout picker gone | CR-06, D-073(b) | The picker and its page (§3.2) | PENUTUPAN-T01 |
| **CR-87 (1)** Each Studio tab only for the roles canon names | D-127; D-129(g) | `src/lib/studio-tab.ts`, the table in §2. Each tab's page sends a person it is not for to Studio's home. The database still decides every action | **PENUTUPAN-T01** (new): the table driven from the latest `role_capabilities`; red on L1's code |
| **CR-87 (2)** JSON import platform-only | D-127 Q7 | The two JSON forms are drawn for Admin platform alone. **The action also refuses a JSON package from anyone else** (PACKAGE_NOT_ALLOWED) before any batch is written | **PENUTUPAN-J01** (new); DAISY-06-UNGGAH-02 restated |
| **CR-87 (3)** Aturan Penilaian not teacher UI | D-127 Q8 | Admin sekolah's and Admin platform's alone (§2) | PENUTUPAN-T01 |
| **CR-87 (4), FD-8** Grant and withdrawal: operator only, by names | ADR-0015; D-127; DG-34 | Admin platform alone. Package, school and the open grant to withdraw are each chosen by name; no field asks for «id sekolah» or «id izin» | **PENUTUPAN-P01** (new) |
| **FD-5, Option A** | D-129(c) | `difficulty_band` reads the author's value: ≤ 0.4 MUDAH, ≥ 0.7 SULIT (migration 20261207100000). **No row is written; nothing is resealed** | **F21-D01** (database) and **PENUTUPAN-D01** (outside it): §4 |
| **FD-7** | D-127 §3; DG-32 | Tinjauan Integritas lists what still waits (`integrity_signals_awaiting_review`, migration 20261208100000). A reviewed sitting leaves the list; its sentence «Tidak ada catatan yang menunggu tinjauan» is true when it is said. «Diteruskan ke pihak sekolah» is offered only where the server accepts it | **F21-I01**, **PENUTUPAN-I01**; S23i and S23r restated (§3.5) |
| **FD-9** | D-127 Q8; DG-30 | A defined lifecycle (§3.3, migration 20261209100000). A rule is set while its chapter is drafted, moves with the chapter through Tinjau, and is the released chapter's rule. A late rule is refused by name, its next action the chapter's correction | **F21-R01**, **PENUTUPAN-F01** |
| **The two L1 lines** | D-129(f) | «this commit **is** the same commit»; the every-computer reload pinned | PENUTUPAN-B01: red on the pre-L1 source, green on L1's. **CR-90's evidence class is unchanged** (D-129(d)) |

## 2. The Studio tab table, from canon (D-129(g))

The canon hierarchy is the scope inventory's: DECISIONS, the checklist, the scope inventory, D-084 and D-085. The FABLE prompts and docs 05 and 09 are background.

| Tab | Who sees it | Canon |
|---|---|---|
| Beranda | everyone Studio admits | D-021 |
| Buat Paket | CAN_DRAFT: Guru, Kepala departemen, Admin sekolah, Admin platform. The JSON part: Admin platform only | D-007, D-021, J4.1; D-127 Q7 |
| Tinjau | CAN_REVIEW: Kepala departemen, Admin sekolah, Admin platform | J4.3, J4.4; HOD-01, HOD-03; FABLE-01 §4 |
| Pustaka PINTAR | CAN_DRAFT or CAN_ASSIGN_LEARNING (the read accessors' own gate). Grant and withdrawal: Admin platform only | ADR-0015; D-120 Q7, M6; CR-87 (4) |
| Aturan Penilaian | Admin sekolah, Admin platform | D-127 Q8 («narrow administrative/operator ownership»); FABLE-01 §10 and doc 09 (an admin-gated configuration); D-081 (the pass mark is the school admin's, «no new department-level authority») |
| Bank Soal | CAN_REVIEW_QUESTION_HEALTH: Kepala departemen, Admin sekolah, Admin platform | J5.8 and EDU-09 (no Question Health for teachers); HOD-06. As built, Bank Soal is Question Health |
| Tinjauan Integritas | CAN_REVIEW_INTEGRITY: Kepala departemen, Admin sekolah, Admin platform | HOD-07, X-11; J5.8; CR-75, CR-77; D-070(i) |
| Uji Cepat, Sertifikat | nobody: both gone | D-127 Q4; CR-06 |

**Canon disagreements I settled by the hierarchy, not stopped for:**
- **Aturan Penilaian.** Doc 05 adds the Kepala departemen; FABLE-01 and FABLE-05 and doc 09 do not. Q8's own words («administrative/operator») and D-081 settle it.
- **Tinjauan Integritas.** FABLE-05's «admin only» acceptance line is contradicted by HOD-07 and X-11, which govern.
- **Bank Soal.** QN5's browse with key and reason (CR-52) is S7's, still to be built; whether a Guru browses there is decided then.

**Noted, not changed:** the database's grant authority is wider than D-127's «operator's only». `grant_release_distribution` also admits CAN_PUBLISH in the owning canonical tenant (ADR-0015). The form is the operator's alone; no ruling asked the function to narrow.

**CR-87 (5)**, each tab states its question and next action:
- Six tabs do, in copy the table already holds.
- **Aturan Penilaian has no sentence of its own.** Listed for Daisy (§6); no word was invented.

## 3. Choices made where the rulings were silent

1. **Sertifikat went with its picker.** The layout is read by nothing: `certificate_prepare` does not read templates, and the one screen reader discards it. The number prefix was retired by D-120 Q1. With the picker gone, the page had nothing left to set. Revocation's screen is CR-05, Daisy's to place. `save_certificate_template` stays in the database.
2. **The named refusals use existing sentences.** Each maps to the most specific existing code whose sentence is true of it. Examples:
   - «a field is empty or not right» for a value outside a mode's bounds;
   - «nothing changed … no longer applies» for a grant already withdrawn.

   Field-by-field words for Aturan Penilaian are Daisy's, with its labels (CR-85, L4).
3. **FD-9's lifecycle.**
   - **What exists:** the learning cycle reads only an APPROVED rule, in the two modes it uses (release_cycle_definition). A rule reaches APPROVED only by moving with its chapter.
   - **So:**
     - a rule is set while its chapter is drafted;
     - Studio's step moves the chapter's rules standing where the chapter stands, its modules' rules included (they never moved before);
     - a new rule or a new version once the chapter has moved on is refused by name, and its sentence names the upload that starts the chapter's correction;
     - the form offers only those chapters and the two cycle modes.
   - **Passing rule removed.** The form asks for no passing rule: a definition's passing rule has decided nothing since 20261102100000 (the school's pass mark decides).
   - **Staging:** 0 of 58 rules are stranded today, so nothing needs repair.
4. **FD-7's unit is the sitting.** The reviewer reviews a sitting (the page groups its observations). One review takes all of that sitting's observations then waiting off the list. An observation made after it waits again.
5. **S23i and S23r (journeys).** Kelas 1A's walk raises one observation, so it can be reviewed once.
   - **S23i:** the head of department's review is now the referral, «Diteruskan ke pihak sekolah», and the sitting leaves the waiting list.
   - **S23r:** it follows that referral to the dean. «Pressing again» is gone, because Studio no longer offers the sitting. The database's idempotency stays F06-P22's.
   - **No data was planted.**
6. **Seeds and fixtures written as p-values were restated band by band.** Each value is now 1.1 − its old value, which keeps every question in the band it was in. This covers three seeds and two suites (FABLE-05, QAC). The seeds load only when a local or CI database is reset; staging takes migrations alone (`supabase db push`), and production is never seeded.
7. **Copy keys of the two removed pages are left in the table** for Daisy's sweep (unused, harmless).

## 4. FD-5, the round trip (D-129(c))

| Step | Proof |
|---|---|
| The author's «Mudah», «Sedang», «Sulit» in a workbook → 0.3, 0.5, 0.7 in the package | PENUTUPAN-D01 (the template's own writer and the upload's own reader) |
| Stored exactly so: no conversion on the way in | F21-D01 (the package import) |
| Read back as MUDAH, SEDANG, SULIT | F21-D01; PENUTUPAN-D01 (the migration) |
| The selection: a paper asking for two MUDAH and one SEDANG draws the author's two Mudah and the Sedang, never a Sulit | F21-D01. **Red before:** it drew «Sedang 3, Sulit 4, Sulit 5» |
| The teacher sees «Mudah» | F21-D01 (quick_assessment_choices); PENUTUPAN-D01 (the page's label is the copy table's word) |
| **No sealed hash changes; no resealing** | The migration writes no row (PENUTUPAN-D01 checks it). Locally the items' values are byte-identical before and after. **Staging, before and after (§5):** 27 sealed releases, every recorded hash equal to its recomputed one and unchanged (`8d786345…`); the 881 questions' difficulties unchanged (`3d7bd5cc…`); the author's 0.3 read SULIT before, MUDAH after |

## 5. The runs

One commit, **0387286**, proven once and carried to main unchanged (D-091(a); E1).

| Run | What it shows |
|---|---|
| CI **37592132508** on 0387286 (the branch, dispatched) | **18/18 jobs; 633 tests, 0 contract problems.** L1 had 621; the 12 more are this landing's new tests (F21-D01, F21-I01, F21-R01, PENUTUPAN-D01, B01, T01, J01, P01, I01, F01, V01, BOB32-K02). Both migration paths ran: a clean database with its seed, and the previous schema upgraded to 176 |
| Journeys **37592135705** (the full walk) | Job A, every role's screens in the seeded world: success. Job B: **73 PASS, 1 FAIL.** The FAIL is **S23q**, CR-52's known A item (QN5's filter and review on Bank Soal, S7's), with the same tally as L1's. **S23i and S23r pass as restated** (§3.5). The Studio walks pass: S14, S15, S15b, S15c (upload), S17 and S17t (review to Terbit), S26e and S27h (Uji Cepat as T2), S26f (a correction). BD11 passes again |
| main **37595704726** | **ALREADY PROVEN** by 37592132508: «this commit is the same commit» (the corrected sentence, D-129(f)). It cancelled itself at 3 estimated minutes |
| The deploy lookup | `ci.yml/runs?head_sha=03872869…&status=success` returns **37592132508**: branch `claude/awesome-rubin-bqxp6p`, workflow_dispatch, success |
| Staging **37595704733** (database and sign-in) | Success: **173 → 176 migrations** |

**The staging after-snapshot** (read only, the same query as before):

| | Before (173) | After (176) |
|---|---|---|
| Sealed releases | 27 | 27 |
| Recorded content hashes (digest) | `8d786345bf082f21d09ae0d559450c48` | `8d786345bf082f21d09ae0d559450c48`, **unchanged** |
| Recomputed from the content | equal to recorded | **equal to recorded** |
| Questions | 881 | 881 |
| Their authored difficulties (digest) | `3d7bd5cc1fcd9168249482f8b2cb16b4` | `3d7bd5cc1fcd9168249482f8b2cb16b4`, **unchanged** |
| `difficulty_band(0.3)`, the author's Mudah | SULIT (the inversion) | **MUDAH** |

**No sealed hash changed and nothing was resealed:** the reading moved and the data did not (D-129(c)).

Production was not touched: no migration and no request file.

## 6. For Daisy, and for Dr Gladys's terminology review (no word invented)

- Aturan Penilaian's own sentence (its question and next action, CR-87 (5)).
- The field-by-field words for a rule outside its bounds (today: «Ada isian yang kosong atau belum sesuai»).
- The copy keys of the two removed pages, to retire.
- **Bank Soal's two difficulty figures.** «Perkiraan penyusun» prints the author's number as written (0.3, 0.5, 0.7: the higher, the harder). «Dari pengerjaan siswa» prints the measured share who answered right (the higher, the easier). They sit side by side on opposite scales. FD-5 did not touch this screen, which never read the band. Whether it shows the author's word («Mudah») instead of the number, and how the two are told apart, is wording: Daisy's, with Dr Gladys's terminology review. Bank Soal is not a Guru's tab (§2).

## 7. The allowance (1,900 estimated minutes, a ceiling; E3 held)

| Run | Estimate (min) |
|---|---|
| spent at L1's close | 734 |
| the scheduled spend check on main 7c96bdb (37589025110, before L2; red, as the 6 Oct status already records) | 2 |
| L2 CI 37592132508 | 72 |
| L2 journeys 37592135705 | 36 |
| main 37595704726 (E1, ALREADY PROVEN) | 3 |
| staging 37595704733 (176 migrations) | 1 |
| **Spent** | **848** |

- **L2 against its forecast:** 113–127 forecast, **112 actual**. One cycle, no re-run. FD-5 rode it, so its contingency is spent at 0.
- **Remaining: 1,052 of 1,900.**

**The re-forecast before L3.**

| Work | Before L2 | Now |
|---|---|---|
| L2 | 113–127 | **112** (actual) |
| L3 (+ a Golden School walk 44 + staging 3) | 160–174 | 160–174 |
| L4 | 113–127 | 113–127 |
| P1–P4 (4 × (cycle + main + a Golden School walk)) | 476–532 | 476–532 |
| Batch 6 regression | 160–200 | 160–200 |
| Batch 7 fixes (one or two landings) | 75–150 | 75–150 |
| **Remaining work** | 1,097–1,310 | **984–1,183** |
| Contingency: FD-5 alone | + 75 or 0 | **0** (landed in L2) |
| The scheduled spend check | not counted | about 2 a day |

**Against the 1,052 remaining:**
- the low path fits with about 68 to spare, less the daily check;
- the high path is over by about 131.

That is the same picture as before L2: the ceiling binds only on the upper path. **L3 is the next firm measure**, the largest landing. **I propose nothing on E3** (D-128(f)).

## 8. For the Second Eye

1. L2's report: read.
2. **Next: L3's one-page Working Context design**, for review before any code (D-128(a)). The stale `lanjut` is in it (D-129(e)).
