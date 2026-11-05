# Batch 6 · Final dependency reconciliation (4 Nov 2026)

**Authority:** owner, 4 Nov: «PINTAR 4.0 — BATCH 6 ENGINEERING REVIEW — CONDITIONAL GO — FINAL DEPENDENCY RECONCILIATION».

The code head is `92aa3b2`, where these runs are green:
- `ci` 41736195658: 18 of 18 jobs;
- end-to-end journeys 41736200006: both jobs, including the A4 print walk and the certificate's one-page print;
- the full local suite: 773 passed, 0 failed (fresh build, fresh database).

No code changed for this reconciliation. Nothing is merged or deployed.

## 1. Every approved Batch 6 requirement, against the inventory

Inventory: register C rows W3.19–W3.22 (the only rows with batch 6); matrix B rows J2.15, J2.16, J8.4; D-159; D-160.

| Requirement | Implemented | Verified | Awaiting |
|---|---|---|---|
| **W3.19 / J8.4 · CR-03, CR-04**: the certificate as designed, one A4 page | ✔ the frozen round-2 sheet in mm; the wordmark slot; the record; the gold line; the band with the school as text (D-160(c)); QR level Q with the 43-character token (D-160(b)) | ✔ B6C-SHEET-01, -QR-01, -DATA-01; a 1-page A4 PDF, its QR decoded; journey STU17 printed as one page | **F-11:** the licensed wordmark master; the physical A4 proof (the gold line freezes only after it, Daisy §6; the QR scanned on two phones). **The sage accent** (§2) |
| **DAISY-36**: one print action, one clean A4 page | ✔ | ✔ B6C-PRINT-01; STU17 | Firefox, Safari and real devices are proved at the physical proof (F-11) |
| **W3.20 / J2.16 · CR-21**: the Digital Card final | ✔ DAISY-24's frozen front and back, CR80; D-074 palette, order and colour rule; the ochre line; the QR tile | ✔ B6K-* (8 guards); print walk P4 (85.6 mm in print) | **F-11:** the wordmark master; the physical CR80 proof (the 0.75 mm line and the 0.598 mm QR modules, D-074(12)) |
| **W3.20 / J2.15 · CR-22**: identity emails final | ✘ not built | — | **DAISY-37:** no composition exists (D-159(e): not invented) |
| **W3.20 · OP-3, AP-1**: the wordmark in the shell and emails | ✘ today's logo stays (D-160(a)) | — | **F-11:** the licensed master |
| **W3.21**: republish the Design System page | ✘ | — | **Daisy** (her page, her task) |
| **W3.22**: the A4 print preview per surface | ✔ the shells, the class-card sheet, the card, the certificate; Konfigurasi's section menu fixed | ✔ B6P-K01; `audit/b6-cetak.mjs` 4/4 in CI journeys; STU17 | — |
| **D-159(d) / D-085 T4 / D-086(e)**: no student photograph on the certificate or the card | ✔ | ✔ B6C-FOTO-01, B6K-FOTO-01 (a planted photo is never drawn) | — |
| **D-159(f) / D-160(d)**: email status by its evidence | ✔ queued, handed off (arrival not confirmed), unsuccessful, not sent; never «delivered» | ✔ B6E-K01, -K02, -K03 | — |
| **D-159(c)**: certificate integrity, revocation, public verification | ✔ unchanged (token, domain, seal, `verify_certificate`) | ✔ B6C-DATA-01; Batch 5's F26 and walks; journeys | — |

**Status: F-11 stays OPEN** until the owner approves the licensed wordmark master and the physical print evidence. **DAISY-37 and W3.21 stay AWAITING DAISY.**

## 2. The certificate's professional-learning accent: what exists, and the smallest fix

**What is approved:**
- **D-076(b)(5):** «accents plum (academic) and sage (professional learning) kept».
- **D-069(i) ruling 8:** the educator learning as a participant receives a certificate. Later, the verifier should see the course or context clearly.
- **Daisy round 2 §5:** professional titles begin «Pengembangan Profesi ·».

**The authoritative classification already exists.** No new one is needed:
- `public.session_is_professional(session)` (migration `20261118100000`, BOB-46) answers from the sitting's own release (`release_is_professional`).
- It is registered and granted to signed-in callers.
- `certificate_eligibility` does not exclude professional sittings, so a professional certificate is issued like any other.

**Why the sheet is plum today:**
- The certificate page reads `my_certificate(p_session)`, and its eleven fields carry no kind.
- UX1-AJAR-KONTEKS-01 holds the Experience to «never says, or knows, which kind of course it was»; provenance is the database's business. So the page may not ask the question itself.

**Recommended (smallest, scope-compliant): the certificate read carries the accent, decided by the database.**
- **One migration** (194) re-emits `my_certificate` with one more output column, `accent`, either `'AKADEMIK'` or `'PROFESI'`. It is computed inside the function by `public.session_is_professional(c.session_id)`. Changing the return type means drop and recreate, as `20261201100000` did.
- **No new classification:** no new table, column or value is stored. The kind is read the way BOB-46 already reads it.
- **The page passes the accent to `konteks`.** The Experience still names no context and asks nothing; it renders what its own certificate says.
- **Tests:**
  - a DB test: a professional sitting's certificate gives `PROFESI`, an academic one `AKADEMIK`, and another person's certificate stays refused;
  - B6C-SHEET-01 extended to the sage sheet;
  - UX1-AJAR-KONTEKS-01 unchanged and green.
- **Cost:** about two hours with tests. At promotion it adds one migration (193 → 194), with its rollback.

**Rejected:**
- **The page calling `session_is_professional` directly** needs no migration, but the Experience would then *know* the kind, against the guard's rule.
- **Reading the course title's «Pengembangan Profesi ·» prefix** infers a classification from words.

**Needs the owner's yes** before it is built (it adds a migration to the promotion).

## 3. The Digital Card: staff-only and the multi-role cases, against 4.0

| Requirement | Source | Implementation | Verdict |
|---|---|---|---|
| Staff cards only in 4.0 | DAISY-24: «Only staff cards ship in 4.0; the rest are design assets» | The card is drawn from `my_identity_card`, which needs a staff role. Learners' class cards (`LembarKartu`, `KartuUlang`) are untouched. | **Compliant** (B6K-STAF-01) |
| Several roles: alphabetical order, colour of the first | D-074(5), (11), addendum (4) | `susunKartu` re-sorts the database's seniority order alphabetically by the Indonesian role names; the colour comes from the first role. | **Compliant** (B6K-URUTAN-01, -WARNA-01) |
| Roles at two schools: one role and its school per line | D-074(6) | Two places become two lines. | **Compliant** |
| More than two pairs: no smaller type, no truncation, no silent omission; surfaced as an unresolved exception, not solved on the card | D-074(10) | Every line is drawn at the approved type; nothing is cut or omitted; the card is marked `data-pengecualian="lebih-dari-dua"`; no design invented. | **Compliant with the rule.** The handling stays an open product item. **Not reachable today:** on staging (read-only, 4 Nov), all 67 people holding a role hold exactly one pair, none two or more. |
| A school-less role (Admin platform) beside a school role | not drawn by Daisy | Set as two places, one line each, so a platform role never sits under a school | **Recorded** for Daisy; consistent with D-074(6) |

## 4. Evidence retained

All of it is committed under `docs/completion-4.0/batch-6/evidence/`:
- **`B6C/`:** the certificate's 1-page A4 PDF, print and screen screenshots, measured mm, and the QR decode.
- **`B6K/`:** the card at 1280 and 320 px, front and back, print, measurements, and the multi-role samples.
- **`cetak/`:** the A4 print walk's PDFs and screenshots for the shells and the card. The class-card sheet is left out because its cards carry PINs.
- **`full-suite-local.txt`:** 773/0.

The CI runs are listed above. The failed `ci` 41734258404 (a lint error in two evidence scripts, ours, fixed in `92aa3b2`) stays on record.

## 5. Genuine blockers, and the shortest safe path to closure

| # | Blocker | Who | Then engineering does | Size |
|---|---|---|---|---|
| 1 | **F-11:** <br>• the licensed outlined wordmark master (SVG/PDF) and its approval; <br>• the physical proofs: the certificate at A4 100 % and the card at CR80, with the gold and ochre lines, and the QR scanned on two phones | Owner | Swap the master into its three slots (`MerekSertifikat`, `MerekKartu`, and the shell's `MerekPintar`); re-run the guards and the print walk; record the proof | about half a day |
| 2 | **DAISY-37:** the final identity-email composition. The card in the email needs her answers on: <br>• the composition at 600 and 320 px, light and dark; <br>• table HTML or image; <br>• whether the back and QR appear; <br>• images blocked; <br>• the rows' order. | Daisy | Build the six emails to it (J2.15), with tests and renders | 1–2 days |
| 3 | **The sage accent (§2):** approve `my_certificate` returning the accent | Owner (yes or no) | Migration 194 with its rollback, a DB test, the page, B6C extended | about 2 hours |
| 4 | **W3.21:** the Design System page | Daisy | none | — |

**Not blockers, but kept visible:**
- D-074(10) (unreachable today);
- the PDF file name (course, not person);
- `auth.link_sent`'s wording;
- the engineering-written words for Dr Gladys;
- the earlier batches' Daisy and Dr Gladys items.

**Shortest safe path:**
1. The owner rules on item 3 now. If yes, it is built and verified on the branch at once.
2. Promotion of what is built can then proceed on the owner's separate authorisation. Without item 3 there is no migration; with it, migration 194.
3. F-11 and DAISY-37 close afterwards, as small follow-ups.

## STOP

Stopped at the Batch 6 promotion gate. No merge into `main`, no staging migration, no production change, no Batch 7 without further authorisation.
