# PINTAR 4.0 · D-127: working context, the rulings on Dr Gladys's natural-use session, and the eight closure streams (7 Oct)

**Status: ruled by Yazid, with the Second Eye (7 Oct).**
- **D-126 stays active.** This record is its one documentation-only exception: no application code, no database or schema change, no migration, no staging or deployment, no Daisy implementation, no CI run.
- **Next step:** the Second Eye reviews how the investigation became rulings and streams. Only then is D-126 lifted, with one implementation order to Claude and one to Daisy.

**The evidence:**
- `PINTAR-4.0-DG-19-37-INVESTIGATION-2026-10-07.md`: the read-only investigation of DG-19 to DG-37, accepted GREEN by the Second Eye.
- The shared doc "DG-19 to DG-37 Investigation" carries the same text.

## 1. The architecture

These two statements are recorded verbatim, and they govern every stream below.

> **Identity tells PINTAR who the person is. Entitlement tells PINTAR what they may do. Working context tells PINTAR what they are doing here, in this session, on this device. Working context may narrow presentation and action choices; it must never widen authority.**

> **A school-shaped action occurs within one explicitly identified school context. Platform-wide authority does not imply platform-wide presentation.**

**Why they are needed:**
- The investigation found that 4.0 separates identity from entitlement cleanly, but has no working context at all. The URL stands in for it.
- A person's chosen door is dropped at sign-in. The landing follows the highest-ranked role. Pages without a context of their own fall back to everything the person may see.
- School-shaped screens merge every school for a person who has several.

## 2. The rulings

Verbatim, as Yazid ruled them. Each incorporates the coordinator's six refinements.

| Q | Ruling |
|---|---|
| Q1 — Working context | APPROVE. The selected purpose becomes the active working context for that signed-in session on that device, until the user explicitly changes it. It is not person-global. Context narrows presentation/navigation only and never widens authorization. /akun must preserve it. Keep the three human-intent doors: Belajar / Mengajar / Mengelola. This should be designed so 4.1 handoff can later carry the context deliberately. |
| Q2 — School context | APPROVE. A multi-school user works within one explicitly named school context at a time for school-shaped workflows. Platform-wide views may exist where genuinely appropriate, but must be intentionally platform-wide—not accidental aggregation. School context never changes underlying authority. |
| Q3 — Dr Gladys roles | APPROVE with Claude's clarification. Dr Gladys keeps Admin platform. She may additionally receive the actual school roles required by the Golden School journeys, granted through normal PINTAR screens after the fixes. Do not simplify her account merely to conceal multi-role/context problems. Formal journeys use the role/context appropriate to that journey. |
| Q4 — Uji Cepat | APPROVE. There is one canonical human Uji Cepat journey: choose → select → review → launch, per D-085 T2. Remove the competing Studio launcher from ordinary human UI. Retain the underlying launch function and its existing automated proofs where useful. |
| Q5 — Human Interface Boundary | APPROVE as a 4.0 closure invariant. Ordinary users must never need to understand/manipulate UUIDs, DB IDs, raw enums, JSON, internal keys/events, API/domain constants or unexplained machine values. Necessary technical references may remain secondary/subordinate for support, audit and troubleshooting. Enforce this systematically, not screen-by-screen. |
| Q6 — Credential fields | APPROVE. Passwords, PINs and reusable/recovery secrets are masked by default. Reveal is deliberate, accessible, predictable and local to the individual field. One field's control must never reveal another field. Re-mask appropriately after submit/error. Apply through one governed Secret-field grammar/component. |
| Q7 — JSON import | APPROVE for 4.0: platform/operator only. It is machine/integration machinery, not an ordinary teacher authoring interface. Do not create a new educator capability merely to accommodate the existing screen. |
| Q8 — Aturan Penilaian | Do not expose it as ordinary teacher UI in 4.0. Preserve the governed underlying mechanism. Determine its narrow administrative/operator ownership from existing canon. FD-9 must also be resolved: saving a rule must have a defined lifecycle to becoming effective—or clearly remain draft/ingested with the required next action. Hiding the page alone does not close this. |
| Q9 — Example workbook | APPROVE separate completed example workbook. Use a clearly marked example title/content. Do not add an importer refusal solely because it is an example. If a teacher deliberately imports it, normal behaviour is acceptable: it becomes a draft course in that school's Studio and is not learner-visible until the normal publish/make-available process. This actually demonstrates the workflow without introducing special-case importer logic. Use the familiar SD5 Mathematics/Bab 1 domain if canonically suitable. |
| Q10 — One-time codes | Visible by convention. Short-lived emailed verification/activation codes may remain plain/readable because their purpose is transcription. They are distinct from passwords, PINs and reusable/recovery secrets. Don't mask them merely for visual consistency. |
| Q11 — Platform admin authority | Retain necessary platform authority, but require explicit working context for school-shaped actions. Platform admin may have cross-school authority as already designed, but must not casually author, launch or publish inside an unnamed school context. Consequential school operations must clearly identify the school being acted upon. Authority and active working context remain separate concepts. |

**Also ruled:**
- **FD-5 is provenance first** (§4).
- **The CI forecast comes before implementation** (§5): «We don't need to economize by weakening evidence; we need to avoid … "every little change wakes the entire factory".»

## 3. The eight closure streams

**The rule of execution:** fix the root, never the DG item. DG-19 to DG-37 are the acceptance evidence. A stream is closed when its own condition holds and every DG row mapped to it passes in a walk.

All eight streams are **bucket A**: before the formal walkthrough. The register rows are CR-83 to CR-90 (`PINTAR-4.0-CLOSURE-REGISTER-2026-10-06.md`, «Added by D-127»).

### CR-83 · Working Context and School Scope

- **Roots:** RC-1 and RC-2.
- **Rulings:** Q1, Q2, Q3, Q11; §1's two statements.
- **Done when:**
  1. **The context lives where Q1 puts it.** Each signed-in session on each device holds one working context (Belajar, Mengajar or Mengelola). Only the person's own explicit act changes it. `/akun` and every page without a context of its own preserve it.
  2. **The doors are honoured.** A ruled table of door × role-set → landing is walked row by row, including {learner + admin}, {teacher + admin} and {platform admin}.
  3. **A person with several schools acts in one named school.** Every school-shaped screen and action names the school. Platform-wide views exist only where deliberately designed, and say so.
  4. **Context never widens authority.** For each context, a test shows that an action the entitlement lacks is still refused by the database.
  5. **The model can be carried by the 4.1 handoff later** (D-125). Its home is the session, not the person.
- **Claude:** the context model, the session's record of it, routing and landing, `/akun`, `/`, school scope for multi-school readers, dependent choices bound to the context school.
- **Daisy:** the shell's expression of the context and of the school, and the natural way to change them (CR-54 S2; her Q1/Q11 extended).
- **DG acceptance evidence:** DG-19 (visible part), DG-20, DG-21, DG-22; the school parts of DG-23, DG-30, DG-31, DG-32.

### CR-84 · Form Contract and Uji Cepat

- **Roots:** RC-3.
- **Rulings:** Q4; CR-06 (already ruled).
- **Done when:**
  1. **One human Uji Cepat journey,** choose → select → review → launch (D-085 T2). Studio's launcher leaves the human UI. `launch_quick_assessment` and its automated proofs stay.
  2. **Every refusal the database can raise with a known cause is named in words.** Such a refusal never reaches the screen as «Ada kendala» plus a reference. A static test extends BOB32-K01 to Studio's actions.
  3. **A refused submission reopens with exactly what the person sent.**
  4. **No form offers a combination the database will refuse for tenancy.**
  5. **The certificate layout picker is gone** (CR-06; D-080).
- **Daisy:** the words for the newly named refusals.
- **DG acceptance evidence:** DG-23 (QH0ZS3), DG-24 (5 → 15), DG-31 (KFRLGH).

### CR-85 · Human Interface Boundary

- **Roots:** RC-4.
- **Rulings:** Q5, the closure invariant.
- **Done when:**
  1. **A static guard covers every page,** red first, then green. It catches:
     - an ID slice or UUID used as a label;
     - an enum literal rendered as text;
     - JSON as an input or placeholder outside an integration surface;
     - a raw internal key or event name;
     - an unexplained number format.
  2. **A walk of every staff screen finds no primary label made of an ID, enum, JSON, key or bare number.**
  3. **Technical references appear only subordinate,** as Q5 allows: the reference on a failure (D-011), the PINTAR ID as a secondary identifier, the operator's build SHA.
- **Fix through shared components,** never screen by screen: the identifier pattern, `enumLabel`, the name lookup.
- **Overlaps carried in:** CR-75 (W-1), CR-79 (W-6), CR-41/W-7, UX-42, and the 22-item inventory (investigation §E).
- **Daisy:** labels for the remaining enums and metrics; the identifier pattern already in her grammar.
- **DG acceptance evidence:** DG-27, DG-28, DG-29, DG-34; the labels in DG-30, DG-31, DG-32, DG-33 and DG-35.

### CR-86 · Credential Privacy

- **Roots:** RC-7.
- **Rulings:** Q6, Q10.
- **Done when:**
  1. **One Secret field grammar and component.** Masked by default; a reveal local to its own field, accessible (`aria-pressed`, a label), predictable; re-masked after submit and after an error.
  2. **Every password, PIN and reusable or recovery secret input in `src/` uses it,** proven by a static test. Today they are:
     - sign-in password and card PIN;
     - activation password, PIN and their two confirmations;
     - the reset password and its confirmation;
     - the reset PIN, Akun saya's new PIN and its confirmation, and the lock-screen PIN.
  3. **Emailed one-time codes stay readable** (Q10).
  4. **A walk** of activation, reset, Akun saya, lock and sign-in shows each secret masked by default, and no control revealing another field.
- **Daisy:** the Secret field in the design system.
- **DG acceptance evidence:** DG-37.

### CR-87 · Studio Purpose and Role Boundaries

- **Roots:** RC-5; FD-8.
- **Rulings:** Q7, Q8; CR-52, CR-75, CR-77 as already ruled.
- **Done when:**
  1. **Each Studio tab is shown only to the roles a ruling lists.**
  2. **The JSON package import is platform/operator only** (Q7).
  3. **Aturan Penilaian is not teacher UI,** and its narrow owner is named from canon (Q8).
  4. **The library grant/withdraw form** is the operator's only, and usable without IDs that no screen shows.
  5. **Each remaining tab states its question and offers its next action** («Every screen answers one question and naturally offers the next question»).
- **Daisy:** Studio's information architecture by role (S7).
- **DG acceptance evidence:** DG-32 (purpose), DG-33, DG-35; the Aturan Penilaian and Pustaka PINTAR examples among DG-27/28/29/34.

### CR-88 · Shared Collection and Content Grammar

- **Roots:** RC-6.
- **Rulings:** Q9.
- **Done when:**
  1. **No staff list renders more than one page of rows, or an edit form on every row.**
  2. **One Question review component** shows stem, options, the key, each option's reason and its misconception from data already stored. It serves «Soal dalam paket ini» and CR-52's Bank Soal.
  3. **The lesson preview renders through the learner player's own components,** proven by a test comparing their structure: pages, diagrams, worked examples.
  4. **A completed example workbook is a separate download,** clearly marked as an example, in the SD5 Matematika Bab 1 domain if canonically suitable. No special importer logic (Q9).
  5. **Accepted formats are stated at the file field.**
- **Daisy:** the Collection pattern (with an explicit edit action), Question review and the File field (her GQ4).
- **DG acceptance evidence:** DG-25, DG-26, DG-30 (UX), DG-33 (UX), DG-36; the earlier Jejak audit and upload-control observations.

### CR-89 · Functional and Data Correctness

- **Findings:** FD-4, FD-5, FD-6, FD-7, FD-9 (FD-8 is in CR-87).
- **Done when:**

| Finding | Done when |
|---|---|
| FD-4 | Names, never ID fragments, at ten times staging's enrolments. Reads are bounded, and the name lookup does not grow with the platform |
| FD-5 | Provenance first (§4), then one difficulty convention end to end. An author's «Mudah» is «Mudah» on every teacher screen and in every drawn mix |
| FD-6 | The preview equals the player (with CR-88) |
| FD-7 | Reviewed integrity observations leave the waiting list. Its empty sentence is true. No act is offered that the server refuses |
| FD-9 | A saved assessment rule has a defined lifecycle to becoming effective, or remains clearly a draft with its next action named (Q8) |

- **DG acceptance evidence:** DG-26 (FD-6), DG-30 (FD-9), DG-32 (FD-7), DG-33 (FD-5), and the Konfigurasi fragments (FD-4).

### CR-90 · Browser Session Proof

- **Roots:** RC-8.
- **Rulings:** none needed; J2.9 (P0) and BD-11 already require it.
- **Done when:**
  1. **BD-11 passes** in each named browser (Chrome, Edge, Safari) and device mode (shared, personal): after «Keluar», Back shows no protected content and no protected action works.
  2. **After a different person signs in,** Back shows only what that person may see.
  3. **A stale `lanjut` left by a signed-out Back** does not carry the next sign-in to the previous person's page.
  4. **If it fails:** a fix, then the walk again.
- **DG acceptance evidence:** DG-19 (security part).

### Reverse map: each observation and its streams

| DG | Streams |
|---|---|
| 19 | CR-83 (visible part), CR-90 (security part) |
| 20, 21, 22 | CR-83 |
| 23 | CR-84, CR-83 |
| 24 | CR-84 |
| 25 | CR-88 |
| 26 | CR-88, CR-89 (FD-6) |
| 27, 28, 29, 34 | CR-85, CR-87, CR-89 (FD-4) |
| 30 | CR-88, CR-85, CR-83, CR-89 (FD-9) |
| 31 | CR-84, CR-83, CR-85 |
| 32 | CR-85, CR-87, CR-83, CR-89 (FD-7) |
| 33 | CR-87 (with CR-52), CR-88, CR-85, CR-89 (FD-5) |
| 35 | CR-87, CR-85 |
| 36 | CR-88 |
| 37 | CR-86 |

The investigation still needs one thing from Yazid: which of DG-27, DG-28, DG-29 and DG-34 is which example. It changes no stream.

## 4. FD-5: provenance first

**No correction until the affected content is known exactly.**
1. **A read-only count** of every item whose difficulty came through the workbook mapping (Mudah 0.3, Sedang 0.5, Sulit 0.7):
   - grouped by school and by source: a school's workbook, a PINTAR package, the PINTAR library;
   - with whether the item is sealed, canonical or published;
   - with whether any Uji Cepat or other assessment has already drawn by the inverted band.
2. **The convention is chosen deliberately:** the database's p-value convention ("high means most learners get it right") is the one the schema and the draw already use.
3. **Only then a correction path:** the import mapping first; existing items through a governed path that respects sealing; canonical content with its provenance recorded.

The count needs D-126 lifted, because it reads staging.

## 5. The CI forecast

**This is the D-122(8) re-forecast, brought forward.** The streams now come before APPLICATION READY.

**Spent:** 621 of 1,900 estimated minutes. **1,279 remain.**

**Unit costs** (measured):

| Unit | Estimated minutes | Measured on |
|---|---|---|
| Branch CI cycle | 72 (68–75) | 37458146396 (68, after S4); 37549911642 (75, with plant gates) |
| Main CI after a landing | 70 | 37551984401. Main never reuses the branch's run |
| Staging migration | 3 | 37551984344 |
| Journeys audit run | 36 (33–40) | 37547178658, 37531719996 |
| Golden School staging walk | 44 | — |
| Re-run allowance | one cycle in five | — |

**One landing** = a branch cycle + its re-run allowance + main + staging ≈ **159**.

### The eight streams, landed in four bundles

Not eight landings.

| Landing | Streams | Cost |
|---|---|---|
| L1 Privacy and correctness | CR-86; CR-89 (FD-5 after its count, FD-6, FD-7) | 159 + journeys 36 = **195** |
| L2 Forms and Studio boundaries | CR-84; CR-87; CR-89 (FD-9) | **195** |
| L3 Working context and school scope | CR-83; CR-89 (FD-4) | 159 + journeys + a Golden School walk = **239** |
| L4 Human Interface Boundary and shared components | CR-85; CR-88 (engineering part) | **195** |
| CR-90 | BD-11 proof, one audit run | **36** (+159 only if it fails) |
| **Total** | | **≈ 860–1,020** |

### What was already planned (D-122, D-124)

| Work | Cost |
|---|---|
| S1–S8 propagation: eight landings, plus the affected Golden School walk after each (up to 8 × 44) | ≈ 1,270–1,620 |
| Batch 6, the full regression (Golden School walk, audits, U-PERF, one cycle) | ≈ 160–200 |
| Batch 7, fixes from your walk (one or two landings) | ≈ 160–320 |
| **Total** | **≈ 1,590–2,140** |

### As CI stands

- **Needed ≈ 2,450–3,160. Available: 1,279.**
- **The ceiling binds by about 1,170–1,880.**
- It was already going to bind during S1–S8 (closure status of 7 Oct, §6). D-127 adds about 860–1,020.

### Options

These are for the Second Eye and Yazid. Nothing here weakens evidence, and nothing is decided.

| | Option | What it changes | Saves |
|---|---|---|---|
| E1 | **Main reuses a proven branch run on the identical commit.** Extends D-119's ALREADY PROVEN, which docs-only pushes already use | A fast-forward of main to a commit whose full run was green on the branch proves nothing new. It is a CI workflow change, with its own proof; first check which jobs run only on main | ≈ 70 a landing; ≈ 1,000 over about 14 landings |
| E2 | **Bundle the propagation slices that share screens** (S1+S2, S3+S4, S5+S6, S7+S8) and fold the streams' screen work into them | Four landings instead of eight. Each bundle still ends with its staging visual check and the affected Golden School walk | ≈ 360 with E1 |
| E3 | **Raise the ceiling** | — | — |

**With E1 and E2:**
- **Needed ≈ 1,360–1,490,** plus about 90 if the BD-11 proof fails. This counts each stream landing without main's duplicate run, and four propagation bundles each with one Golden School walk.
- **The ceiling still binds by about 80–300, at the very end** (batch 7).

**Recommendation:**
1. Rule E1 and E2 now.
2. Re-forecast after L1, from its measured cost.
3. Decide E3, the ceiling, then, with numbers rather than estimates.

## 6. The sequence

As the Second Eye set it, and Yazid approved:

1. **The rulings:** this record. Then the Second Eye reviews it.
2. **D-126 lifted deliberately,** with one consolidated implementation order to Claude and one coordinated order to Daisy. No piecemeal "fix DG-23 … now DG-24".
3. **Claude fixes roots,** security, privacy and correctness first: CR-86, CR-90, FD-5 after its count, CR-84. Then CR-83, CR-85, CR-87, CR-88 and the rest of CR-89.
4. **Daisy brings today's lessons into the grammar before APPLICATION READY is frozen:**
   - the Secret field;
   - the working-context and school indication;
   - Question review;
   - the bounded Collection;
   - the remaining coherence of the Studio and application shell.
5. **Regression and human verification:**
   - Claude proves the invariants; CI goes green; staging is updated; the affected Golden School journeys are re-walked.
   - Then Yazid uses PINTAR himself, without helping it, asking "Would she know what to do here?".
6. **Dr Gladys, natural use #2:** «PINTAR has been updated. Just use it however you naturally would.» She is an explorer again, not QA. She is not given a list of fixes to check.
7. **The formal Golden School walkthrough,** later. It answers a different question.

**Open for the Second Eye's review:** does step 6 come before or after the S1–S8 propagation? The record does not decide it.

**Dr Gladys's account (Q3):** she keeps Admin platform. The school roles the Golden School journeys need are granted by Yazid through PINTAR's own screens, after the fixes.

## 7. What this commit did not do

Its only content is documentation:
- this record;
- the D-127 row in `DECISIONS.md`;
- the register rows CR-83 to CR-90;
- the investigation report it rests on.

**No application code, database, schema, migration, staging, deployment, CI run or Daisy work.** D-126 remains active after it.
