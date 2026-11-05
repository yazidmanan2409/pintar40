# The coordinated decision pass (D-178, as adjusted by D-179 and D-180) · 4 Nov 2026

**Ruling (D-178):**
- the retrospective is accepted;
- Batch 0 is VERIFIED;
- Batches 1–6 are acceptance-incomplete;
- no promotion; the branch stays protected.

**Approved (D-179):** GO for the coordinated decision process; NO-GO for batch promotion until the applicable acceptance conditions are met.

**The decision pack (4 Nov):** one document for Dr Gladys and the owner, with every K row, its options, a recommendation and an answer column: «PINTAR 4.0 · K1–K7 decision pack» (Claude Docs, shared by the owner). It adds B32–B34 to K1 (now in `DR-GLADYS-QUESTION-PACK.md`) and records the residency conflict below (§1b).

**The pass:** close the genuinely blocking decisions together in one round. Then implement what they decide, rerun the affected tests and the full journeys, and assess readiness for the next batch. No further broad audit is commissioned now.

**Rule in force (D-180):** approved means implemented and verified. Every obligation records what must exist, where it is implemented, how it is verified, and what remains (`06-ENGINEERING-ITEMS-FROM-DESIGN.md`, held by `R-PROSES-01` in every CI run).

**The source of each item** is the register (`01-REGISTER.md`) and the summary (`02-RINGKASAN.md` §4). **Nothing here is decided by engineering.** No answer is assumed because a recommendation exists: K4–K7 are open until the owner answers them.

## 1. What is asked, of whom, in one round

| # | Decision | Decides | Where it is asked | Register rows |
|---|---|---|---|---|
| K1 | The words: Part A (A1–A10) and Part B (B1–B37) | **Dr Gladys** (A6 with the owner) | `DR-GLADYS-QUESTION-PACK.md`, one sitting. B28–B31 were added by the retrospective, B32–B34 by the pack, B35 by D-183, B36 by W6.10 (J1.8), B37 by P-2 | R1-5, R2-4, R3-2, R3-3, R4-6, R4-7, R5-4, R5-6, R6-3 |
| K2 | X12: «paket» / «kursus» / «course», one consolidated decision, the workbook sheet included (C9) | **Dr Gladys and the owner** | `X12-TERMINOLOGY-PAKET.md`; pack A6 | R3-2 |
| K3 | C2 (the PD Kelas presentation), B4 (the card's school-less role), G1's screens; the two questions the reverse reconciliation found are **answered** (Daisy, 4 Nov, `78b680d5`: K8's markers are A5 B12's filled marks, built; D2's name follows the issued language, as built). **C2:** complete, ready for the owner's review; the PD footnote (Dr Gladys) and two keys' copy remain. **B4:** confirmed, rendered from a disposable stack (`evidence/b4-kartu-platform-dan-sekolah-390.png`), visual evidence for the owner's review, not final acceptance | **Daisy first reconciles** them against the approved decisions and gives **one consolidated recommendation** (D-179(d)). What an earlier ruling already covers is applied, not asked again. Only a genuinely open choice goes to the owner | Daisy's C2, B4, E2 on `ux-1/daisy-experience` | R5-5, R5-6, R6-2 |
| K4 | F-11: the wordmark master and the font licence | **owner** | `F-OWNER-DECISIONS-REQUIRED-2026-11-02.md` | R6-4, R6-5 |
| K5 | D1's manual client protocol: a send path and synthetic inboxes (P6) | **owner** | `daisy-design-completion/05-D1-IMPLEMENTATION-TEST-PLAN.md` | R6-3 |
| K6 | **F-4 as a security decision (D-179(b))**: the six questions in §1a | **owner** | §1a; `batch-1/F4-EXPOSED-ITEM-INVENTORY.md` | R1-6 |
| K7 | The personal address in three files: keep it, or use a role address | **owner** | Batch 0 security report §4.1 | R1-7 |

### 1a. K6: what the security decision must settle (D-179(b))

K6 is not closed by choosing a storage location. Each question below needs an answer, and the answers together are the decision.

| # | Question | What is known today |
|---|---|---|
| K6.1 | **Where the private content resides.** Production storage and its backups must reside in Indonesia. | The answer keys left the public tree (F-4, D-145(b)). 82 removed files remain in public history (R0-6). No private store exists |
| K6.2 | **Which identities and services can read it**, by name (people, the import pipeline, CI) | none named |
| K6.3 | **How access is enforced and audited**: the boundary (database policy, storage policy, or a service), and the log a reader leaves | the repository guard (`sensitive-scan`, SEC-G01/G02) keeps keyed material out of the tree; nothing governs the store itself yet |
| K6.4 | **How the exposed materials are retired**: the chapters whose keys are public are marked never usable for real assessment | the inventory lists them (`batch-1/F4-EXPOSED-ITEM-INVENTORY.md`) |
| K6.5 | **How content is regenerated before real assessment**: who writes it, who reviews it, and how it reaches the store without passing through the repository | — |
| K6.6 | **How backups and exports stay confidential**: database backups, Studio exports, reports and the workbook, each in Indonesia and under K6.2's readers | — |

### 1b. K6: a residency conflict found while preparing the pack

D-179(b) requires production storage and its backups to reside in Indonesia. Today nothing does: both Supabase projects are in `ap-southeast-1` (Singapore); the server functions run in Vercel's `sin1` (BOB-18); the approved off-platform backup is AWS S3 Singapore (D-107(b) D1, W9.5, not built). The pack asks the owner whether residency covers (a) the private content store only, (b) all production data and backups, which reverses D-107(b) D1, or (c) counsel first (F-16). Recommended: (c), with the content store created in Indonesia meanwhile. Engineering decides none of it.

**Interim ruling (D-182, owner, 4 Nov):** Singapore continues for development and testing; **the production residency architecture is DEFERRED — PENDING LEGAL REVIEW** (the owner consults counsel this weekend, and may still choose a stricter Indonesia-only policy); no migration, provider change or hosting commitment until then; synthetic data only, no real-school data or real assessment; K6's other content-security requirements stay active, the exposed content treated as compromised. K6.2 refined: the named readers cover the authoring store; a runtime delivery service, if any, gets its own narrowly defined identity. Obligations E-K6-1 (residency, BLOCKED) and E-K6-2 (no reuse of exposed questions, BLOCKED on K6.1–K6.6 and F-4(c), (e), (f)). The deferral is not acceptance.

**F-4(f) approved in principle (D-183, owner, 4 Nov):** the exposure flag refuses, it does not warn; synthetic work continues; deployment only through the protected gates. Built on the branch (migration `20261228100000_exposed_questions_never_give_a_real_verdict.sql`, E-K6-3, held by F27-X01…X06, shown red first). It applies to every school that is not synthetic. A read-only staging check found ten founded test and demonstration schools, not synthetic by construction (staging's environment reads «production»), holding an exposed chapter with open cycle assignments: after deployment they would be refused it. How staging's test work continues is the owner's decision at the deployment gate (E-K6-4).

**Engineering's part, once K6 is answered:** apply the access rules at the stated boundary, with a test that reads the content as a person who must be refused. Extend the guard and the export paths to the stated rules. Record each answer as an obligation (D-180).

**Not in this pass:** no staging or production change. Anything that touches staging or production goes through its protected gate.

**Not decisions, done at acceptance on the final screens:**
- the NVDA and TalkBack passes and the skip link's keyboard check (R2-9);
- the printed A4, CR80 and QR proofs (R6-1, R6-2).

These need K1 and K3 answered first, so the screens they read are final.

## 2. What each answer changes, and what is rerun

| Answer | Engineering change (one pass, at the shared source) | How it is verified | Rerun |
|---|---|---|---|
| K1 | the approved words into `src/lib/hle.ts` only; no screen writes its own | the key's own test (e.g. `R3-A5-01`, `D168-B2-1`, `D168-KATA-1`). Any test that quotes the old words is restated with the reason | the whole manifest; every walk (the walks read words) |
| K2 | one replacement across every user-facing occurrence. The workbook gets a new template version, and old workbooks still import. No identifier, column or file is renamed | a cross-feature check over every user-facing string; an import test over the existing templates (the old one must still import) | the manifest; `studio-ujung` (upload, both template versions); the journeys |
| K3 | C2 at `adaBuktiSoal`'s consumers; B4 in `susunKartu`; G1 in the chooser | `D168-C2-1`, `R5-PERSOAL-01`, `B6K-URUTAN-*`, `D168-E2-1` | `e1-navigasi`, `b5-ujung`, `d1-email` (the card block) |
| K4 | the master into `MerekKartu` and the D5 slots; DS stage 2 | `B6K-MEREK-01`, `D1E-K07`; the print proofs by inspection | `b6-cetak`, `d1-email` |
| K5 | none in the code (the protocol is run, not built) | `D1E-K*` stay; P6 run by hand and recorded | — |
| K6 | the access rules at the stated boundary; the guard and export paths | a refusal test read as a person who must be refused, plus the guard's tests | the manifest; CI |
| K7 | the three files, if the owner says so (`.github/*-request.txt` stays the owner's) | the guard's allowlist entry removed; the guard green | CI |

**Verification rule (D-179(a)):**
- every change has appropriate verification;
- every defect correction has a regression test shown failing on the defect;
- an approved word or asset needs no deliberately failing test.

**Reconciliation (D-180):** an answer that creates or changes an obligation is entered in `06-ENGINEERING-ITEMS-FROM-DESIGN.md` the day it is given, in its «Rulings reconciled» table, with the obligation's four fields. `R-PROSES-01` fails on a ruling without that line.

## 3. The exit, and then readiness

**The decision round is closed when** every K row is answered, or explicitly deferred by the owner.

**A deferred item is not acceptance (D-179(c)).** It stays OPEN or BLOCKED in the register, and the readiness assessment counts it. For example, deferring F-11 leaves the branding and the print proofs incomplete.

**The pass is done when:**
- the answered items are implemented and verified (§2);
- the whole manifest and every walk are green locally;
- the relevant manual checks are done or recorded as blocked;
- `ci` and the journeys are green on that head;
- `R-PROSES-01` finds no approved requirement without implementation or verification evidence.

**Then** the per-batch verdicts in `02-RINGKASAN.md` §5 are reassessed:
- a batch is not GREEN while an applicable approved requirement has an unimplemented or unverified obligation (D-180);
- readiness for the next batch is put to the owner;
- promotion stays the owner's decision, through the protected gates.
