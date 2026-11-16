# External AI content through PINTAR's import: assessment

Bob, Chief Architect, 16 November 2026. Owner decision of the same date, recorded as ruling 41
(`OWNER-RULINGS-4.1.md` §7) and Addendum 1 §5d, C-3. **Nothing here changes 4.1's scope.**

> Schools choose how to create their content. PINTAR governs how that content enters the platform and becomes trusted
> educational material. PINTAR is AI-friendly, not AI-exclusive.

**What it is:** a content-import decision, not an AI integration. PINTAR supports one consistent format that any
capable AI can produce. There is no bring-your-own-key, no connection to a school's AI account, and no fee for
content a school imports through the standard workflow.

**Read against:** `main`, the Studio import (`src/app/studio/unggah/page.tsx`, `src/components/unggah/`,
`src/lib/unggah-kontrak.ts`), THE PLAN §5.6 (C3w) and rulings 38–40.

## 1 · What PINTAR already supports

| Need | Already on `main` | Where |
|---|---|---|
| **An official MCQ and lesson template** | **Yes, one workbook for both.** One course per workbook; sheets Kursus, Bab, Pelajaran (lesson text, objective, thinking level), Soal (question, reading, hint, use, difficulty) and Pilihan (option, correct, reason, misconception code), plus an optional Miskonsepsi sheet. It is built at download time from the contract itself, so it cannot drift from what the reader accepts. A "Cara mengisi" sheet explains every column | `templat.ts`, `KOLOM` in `unggah-kontrak.ts` |
| **A filled example** | **Yes.** A made-up example chapter, marked «Contoh — », imports as an ordinary draft | `contoh.ts` |
| **A machine-friendly format** | **Yes.** The structured package (JSON) is the same package the workbook becomes, offered on the same page for "packages another system produces" | `structuredImportAction` |
| **Validation feedback** | **Yes.** Every problem is named by code at its sheet and row. A workbook with any problem makes nothing. Nothing is silently dropped | `unggah-kontrak.ts` (`KODE_MASALAH_PAKET`) |
| **The same lifecycle** | **Yes.** An import lands as a draft package (INGESTED), then the content check (`run_mcq_quality`), review by a second educator, release and publication, the same as any draft | THE PLAN §5.6 C |
| **A correction or a new version** | **Yes.** A workbook can arrive as the next version of a course (`?revisi=`) | the upload page |
| **No charge on import** | **Yes, by construction.** Import has no metering | — |

**So the decision is mostly supported now.** Most of what you asked for is guidance: sample prompts and
instructions, written for the existing workbook.

## 2 · Genuine gaps, and where I would place them

| # | Gap | Proposed placement | Why |
|---|---|---|---|
| **X-1** | **Sample prompts and import instructions** for teachers, with the warning not to give an external AI identifiable learner information or restricted school data | **Now, as onboarding material** (`docs/onboarding/`). No product change. Daisy writes the Indonesian; Sharon reviews the data warning; I draft the prompts from the workbook contract. Not in A2b's way: prepared at a quiet point, ready before Z | It needs no code. It also lets the walkthrough educators try the external route |
| **X-2** | **A paste-friendly route.** Not every chat AI can produce an .xlsx. Without one, a teacher must paste the AI's tables into the template, sheet by sheet, or use the structured JSON form, which is written for systems, not teachers | **The prompts first** (X-1): they ask the AI for one table per sheet with the exact headers, to paste into the template. If the walkthrough shows that is too hard, a tab-separated or JSON paste box goes into **4.2**'s planning | The cheapest route is tested with real educators first. Nothing is built on a guess |
| **X-3** | **Adding questions to an existing lesson.** The workbook is one course per workbook. To add ten MCQs to a lesson, a teacher either re-imports the course as a new version or types them into C1w's editor | **4.2 candidate:** a question-only import into an existing draft package | It is a new import shape with its own matching and validation. Not small, and not needed for the decision to work |
| **X-4** | **Recording the external AI, where known.** The workbook has no field saying "drafted with {AI}" | **The field: 4.2 candidate**, optional, on the Kursus or Soal sheet, recorded as **self-declared and unverified**. **The boundary: in C3w's design now.** C3w's provenance table (D3) should be able to hold an origin of "declared external" with the AI's name as a value, beside "PINTAR integrated", so the later field needs no redesign. No column, screen or test is added in 4.1 | PINTAR cannot verify an external declaration, so it must never look like C3w's verified provenance. Undeclared AI use is indistinguishable from manual writing, and the lifecycle treats them the same |

## 3 · "And then what?" and "What else did that change?"

| Area | Traced |
|---|---|
| **The lifecycle** | An externally generated question is an ordinary draft. The importer is its author, so the two-person rule already refuses that educator as its reviewer, and the content check runs on it. **C3w's per-draft acceptance step (D2) does not apply,** because PINTAR cannot know which imported questions came from an AI. The second educator's review is the safeguard, as for manual content |
| **Educational quality** | A wrong key from an external AI is caught the same way as a wrong key typed by hand. PINTAR makes no quality claim about external AIs, and they appear in no school-facing comparison (ruling 40 covers only qualified integrated options) |
| **Privacy** | No PINTAR data leaves PINTAR on this route. What a teacher gives an external AI is the school's responsibility. The instructions (X-1) warn clearly. R-3 governs PINTAR's own provider calls only |
| **Commercial (rulings 38–40)** | The integrated service is charged; import is not. The integrated service's advantage is convenience, and **the import route must never be degraded to sell it.** I'm recording that as a design guardrail on C3w: no C3w change may make the workbook or structured import harder |
| **C3w** | Unchanged, apart from X-4's provenance boundary. Rulings 39 and 40 stand. Generation, entitlement, ledger and ceilings are untouched |
| **E** | Unchanged |
| **Existing questions and account closure** | Imported content follows the existing rules for content, versions and attribution. No new record type |
| **Support** | PINTAR does not support or troubleshoot schools' external AI accounts or charges. The instructions say so |

## 4 · Decisions

**None needed now.** Proceeding as follows; correct me if any placement is wrong:
- X-1 prepared as onboarding material before Z, with no product change;
- X-2 decided after the walkthrough, a 4.2 candidate if needed;
- X-3 a 4.2 candidate;
- X-4's field a 4.2 candidate; its provenance boundary goes into C3w's design;
- the import-parity guardrail recorded on C3w.
