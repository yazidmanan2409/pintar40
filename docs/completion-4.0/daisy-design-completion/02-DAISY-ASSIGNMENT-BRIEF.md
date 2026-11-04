# PINTAR 4.0 · Design-completion assignment for Daisy (draft for owner review; not yet sent)

**From:** the coordinator (Claude), on the owner's direction of 4 Nov: «Activate Daisy for the consolidated completion of approved PINTAR 4.0 designs».

**Status:** for owner review. Nothing here is dispatched until the owner approves it, and the owner decisions in `04-DECISIONS-DAISY-CANNOT-MAKE.md` that gate a package are taken first.

## For the owner: the genuine design blockers, in one place

| Blocker | Why it blocks | Unblocked by |
|---|---|---|
| **A1 W1.2 question review** | Studio's last missing composition (S-4, W6.5, Gate 2) | Daisy: no decision needed |
| **B1 W3.6 Konfigurasi** | No approved composition; Batch 4 acceptance is held open on it (D-156(a)) | Daisy: no decision needed |
| **C1 W3.8 report body and A4 print** | «Reports: NO APPROVED COMPOSITION» (G:34) | Daisy, with the approved words kept (Dr Gladys's labels stay as they are) |
| **C2 PD «Lihat bukti»** | DAISY-35(5) has no presentation | Daisy: no decision needed |
| **E2 W3.16 the chooser** | «Chooser: NO APPROVED COMPOSITION» (G:38) | Daisy for the composition; **Dr Gladys's six words** to fill its slots |
| **E1 W3.12 J3 navigation** | The composition predates the working context | **Owner:** restate or accept the deviation (O6); then Daisy |
| **D1 the identity emails (CR-22 / DAISY-37)** | Engineering finds no composition; Daisy's validation says the frame is it | Daisy, step 1: identify the frame and reuse it if complete; then the six emails with the provisional wordmark placeholder |
| **A2 / A3 the Uji Cepat figure and small groups** | The meaning and threshold are product policy | **Owner:** O3, and O4 if the meaning changes; Daisy presents |
| **D5 / D4 the brand slots and the Design System page** | The wordmark master does not exist | Daisy draws the geometry with the placeholder now; the artwork comes with **F-11** |

**Not blockers in this exercise:**
- D-074(10), explicitly unresolved;
- the sage accent (D-162, engineering);
- the PDF file name (O7);
- the Batch 2 and 3 answers and words (A4, A5, E3), which are confirmations;
- the words engineering wrote (Dr Gladys).

## 1. What this is

**A completion exercise, not a redesign.** Your design system is frozen and APPLICATION READY (`c42fecb`, verified at `cc96030`, 8 Oct). Since then, engineering has built Batches 0–6 on it:
- Batches 0–5 are promoted and verified on staging (D-147 … D-158).
- Batch 6 is on the development branch at `92aa3b2`, green in CI.

What is left is a short, exact list of approved items that still need your composition, your words, or your answer. **Every item, with its approved rule, what is built today, what is missing, its evidence and its acceptance, is in `01-OUTSTANDING-DESIGN-REGISTER.md`.** Work from it. Do not reopen anything it marks completed or superseded.

**Keep, without exception:**
- the approved 4.0 scope (no 4.1, 4.5 or 5.0 design: the register's exclusion list);
- your frozen grammar and the design rulings;
- the human journeys that work today;
- the security, identity and assessment-integrity boundaries.

## 2. Read first

1. `01-OUTSTANDING-DESIGN-REGISTER.md`: your items, packages A–E.
2. `03-SCREEN-REFERENCES.md`: for each item, the current screen (screenshots taken from the running application), your frozen composition if one exists, and the approved behaviour.
3. `04-DECISIONS-DAISY-CANNOT-MAKE.md`: the owner and Dr Gladys decisions your items depend on. **Do not choose an option for them.** Draw each option if asked, and say what each costs.
4. `docs/coordination/DECISIONS.md`, notably:
   - D-135 (you decide design execution within the system; the owner is not asked for design-language rulings);
   - D-142, D-144 (scope);
   - D-157 (terminology kept, tour non-modal, the MODE PERAGAAN exit);
   - D-159 / D-160 (Batch 6);
   - **D-161 (branding)**.
5. The current application, on the development branch. Do not reproduce working behaviour from memory: the screenshots and the code paths in the register are the reference.

## 3. Branding (D-161, reconciled): read before Package D

**Authoritative for this exercise:**

| | |
|---|---|
| Legal company | PT Zayd Pintar Selalu |
| Application | **PINTAR SELALU** |
| Public wordmark | **«Pintar»** |
| Wordmark colour | **#075056** |
| Preferred typography | **Helvetica Neue Bold**, subject to the final master's approval |

D-161(e) records the reconciliation:
- «Pintar» in `#075056` replaces your Wordmark card's «PINTAR, in capitals» / Helvetica Neue 65 Medium / `#245F55`, D-120 Q16's wordmark and D-160(a)'s «canonical wordmark» wording. **Your Wordmark card is superseded. Do not use it.**
- **The interface palette is unchanged:** `--pintar-primary` stays `#245F55`, and no token changes unless separately approved. Do not propose palette changes in this exercise.
- **The licensed master artwork and its physical reproduction remain owner-controlled (F-11).** Do not draw, freeze or hand on a master.
- Where a composition needs the wordmark, use a **provisional wordmark placeholder**: a box at the slot's size and position, labelled «Pintar (master pending F-11)». The final artwork drops into it later.
- **Not decided, and not yours:**
  - where the application name «PINTAR SELALU» replaces «PINTAR» in running product text;
  - the tab icon's colour.

  Leave both as they are.

## 4. What you may and may not decide

**You decide presentation within the approved system:**
- layout, components, tokens, measurements and spacing;
- states, responsive behaviour, print layout;
- keyboard and focus behaviour;
- the words for presentation-only labels where your grammar already governs them.

**You must not change, and must not decide by implication:**
- educational policy;
- assessment calculations and **metric definitions**: you design how a figure is presented, never what it measures;
- certificate integrity: **the 43-character verification token, QR security, revocation and public verification stay exactly as built** (D-160(b));
- role permissions; identity security;
- the approved scope; prior owner rulings;
- **Dr Gladys's frozen terminology** («Peserta», «Kenaikan», «Penguasaan per bagian» stay: D-157(a));
- **the prohibition on student photographs** on the certificate and the Digital Card (D-085 T4, D-086(e), D-159(d)).

Where an item depends on such a decision, name the decision, lay out the options, and stop. Do not choose.

## 5. The packages (details per item in the register)

| Package | Items | What you deliver |
|---|---|---|
| **A · Studio and assessment** | A1 W1.2 question review; A2 D1 the Uji Cepat class figure; A3 D3 small groups; A4 eight Batch 3 wordings; A5 the Batch 3 cosmetic confirmations | A1: a full composition (the commission's six decisions). A2: a written answer on presentation and label only; the meaning is the owner's if it changes. A3: the under-threshold presentation for each owner option. A4: words. A5: yes or a correction per item. |
| **B · Administration and identity** | B1 W3.6 Konfigurasi; B2 UX-09 «nomor induk»; B3 D-074(10) more than two pairs; B4 platform role beside a school role | B1: the full composition: split or index, sections, both roles, all states, RV-24 / RV-15. B2: the term and its one sentence. **B3 stays explicitly unresolved and is not designed in this exercise**: the rule holds (no truncation, no shrinking, no silent omission; D-074(10)). B4: confirm or draw. |
| **C · Reports and learning evidence** | C1 W3.8 report body and A4 print; C2 W2.16(5) PD Kelas «Lihat bukti»; (C3, Dr Gladys's labels: dependency only) | C1: Ringkasan Kelas and Sekolah bodies at three widths, the empty and «not yet» states, the A4 print specification. C2: the presentation without academic figures, and the pointer to the professional record. |
| **D · Certificates, Digital Card, email** | D1 the six identity emails and the card in the email (CR-22 / DAISY-37); D2 the PDF file name; D3 the physical-proof consequences; D4 W3.21 the Design System page; D5 the brand slots | **D1, step 1, first of all:** identify the existing approved email frame (the DAISY-19 frame, `docs/coordination/ux/email-frame/`, built as `src/components/email/bingkai.ts`, and your GQ3 «D-079 is the email standard and the DAISY-19 frame its implementation») and check it against D-079(a)–(f) and DAISY-37's points (1)–(4). **If it is complete, reuse it and say so; otherwise deliver only the missing composition**, item by item. **Step 2:** the six emails' structure and states in that frame, and the card in the email (600 / 320, light / dark, images blocked, plain text), with the **provisional wordmark placeholder** (§3). D2: the course form or a revised rule (owner's choice). D3: only if the proof fails. D4: republish once the packages are in, with the reconciled brand. D5: the slot geometry for «Pintar» in each slot, with the placeholder; never the artwork. |
| **E · Shared experience** | E1 W3.12 J3 navigation under L3; E2 W3.16 the chooser, the context control and the six expressions' places; E3 the fifteen Batch 2 questions; E4 engineering-written words (Dr Gladys first) | E1: J3 restated under the working context, or a recommendation that the owner accept OP-1 and OP-2. E2: the full composition, with the six words left as Dr Gladys's slots. E3: an answer per row. |

**Not yours (do not design them):**
- the certificate's professional-learning accent: approved in principle as an engineering correction (D-162, migration 194), built separately under the Batch 6 gate, with the sage already in your frozen certificate grammar;
- F-11;
- the handling of more than two role/school pairs (unresolved);
- product-policy questions;
- Dr Gladys's words;
- every engineering row.

**Do not reopen** any item the register lists as completed or superseded (about 30 items).
- Their closure is recorded: closing citations are in the register's reconciliation notes.
- If you believe one is wrong, say so in one line with the evidence, and continue with the rest.

## 6. What every composition must contain

The deliverable must let engineering build it **without guessing**. For every item:
1. **The complete composition:** every region of the screen, not an isolated illustration, a token list or generic advice.
2. **Layouts** at 1280 (desktop), 820 (tablet) and 390 / 320 (phone), plus **A4 print** where the surface prints (C1; D1 has no print; the certificate and card are already frozen).
3. **Every state and role variant:** empty, loading, refusal, error, success, «not yet», each role that sees the screen, and the long-content and edge cases named in the register.
4. **Keyboard and accessibility:** focus order, focus return, the skip-link target, names and roles, colour never the only carrier, target sizes.
5. **The exact Indonesian copy and its English.** Words that are Dr Gladys's are marked as her slots, never filled.
6. **Component usage, tokens, measurements and spacing:** your components by name (`Kosong`, Collection / `Koleksi` and `Penomoran`, `TombolKirim`, `BidangTeks`, `Dialog`, `HalamanPenolakan`, the shells, `pin-*`). Nothing ad hoc where a token exists.
7. **Navigation and interaction outcomes:** where each action leads, what is announced, what is saved.
8. **Edge cases:** the register's (2,000 questions; five long options at 320 px; more than two role pairs; images blocked; and so on).
9. **A requirement-specific acceptance checklist** engineering can test against, one line per checkable rule.

Deliver each package as a folder under `docs/coordination/ux/completion-4.0/<package>/` on your lane:
- a README with sections 1–9 per item;
- renders at each width and in print;
- the keyboard and accessibility trees, as your `render/jalan/*.txt` do today;
- the acceptance checklist.

## 7. Order of delivery (by dependency)

1. **First, needing no decision:**
   - A1 W1.2 (Studio's last missing composition; S-4 and W6.5 depend on it);
   - B1 W3.6 Konfigurasi;
   - C1 W3.8 report body and print;
   - C2 PD «Lihat bukti»;
   - E2 the chooser's composition (with Dr Gladys's word slots left empty);
   - E3 the Batch 2 answers;
   - **D1 step 1**: identify the existing approved email frame and reuse it if complete.
2. **Then, as each owner or Dr Gladys decision lands:**
   - A2 / A3 (the figure's meaning and the small-group rule: you present, the owner decides);
   - E1 (restate J3 or accept the deviation);
   - D2 (the file name);
   - B2 / A4 / E4 words with Dr Gladys.
3. **Then the six emails (D1, step 2)**, built on the frame step 1 confirmed, with the provisional wordmark placeholder.
4. **Last:**
   - D5 (the slot geometry for «Pintar», with the placeholder);
   - D4 (the Design System page republished with everything above and the reconciled brand);
   - D3 only if F-11's physical proof fails.
5. **Batch 7 follows your packages:** the NVDA / TalkBack / 200 % zoom pass (W6.12) and the new words (W4.4) are «only meaningful once the screens are final».

Send each package when it is complete. A package is not "done" until it passes the verification in §8.

## 8. How your work is checked before anything is built

See the verification plan below. In short: completeness against §6, conformity to the register and the decisions, a check against the real screens, and an acceptance checklist turned into tests.

## Verification plan (the coordinator's, before implementation)

Each package Daisy sends is checked, in this order, before one line of it is built:

1. **Completeness.**
   - Every register item in the package has all nine §6 sections.
   - Every width and print rendering is present, and every state and role variant named in the register is drawn.
   - Missing sections are returned to Daisy as a list, not filled by engineering.
2. **Conformity to authority.** Each composition is read against:
   - the item's approved rule (quoted in the register);
   - D-135, D-142 and D-144 scope;
   - D-157 (approved words kept; the tour non-modal);
   - D-160 (token, no school logo, never «delivered»);
   - D-161(e) (the wordmark «Pintar» `#075056` with the provisional placeholder; the interface palette unchanged; no master drawn or frozen).

   Anything that changes a metric definition, a permission, identity security, certificate integrity, the photo prohibition or a frozen term is **rejected back to Daisy with the rule it breaks**. It is never "interpreted".
3. **Grammar conformity:** components and `pin-*` / tokens only; the existing static guards (the token rule, the copy-table rule, no internal words, DAISY-04 every key in the table) are run against a dry implementation sketch before the build is accepted.
4. **Reality check against the current application.** Each composition is laid beside the screenshots in `03-SCREEN-REFERENCES.md`, and the working behaviour the screen has today (its data, actions, refusals and role differences) must all still be there. A composition that drops working behaviour is returned.
5. **Decisions isolated.** Every place a composition depends on an owner or Dr Gladys decision is listed. The build of that part waits for the decision; Daisy's default is never taken as the decision.
6. **Acceptance checklist → tests.**
   - Daisy's per-item checklist becomes red/green selftests (source and rendered) and browser-walk steps: the pattern of `audit/b5-ujung.mjs`, `audit/b6-cetak.mjs` and the a11y harness `audit/a11y.mjs` (axe WCAG 2.2 AA, skip link, page title, no sideways scroll at 320–1280, the keyboard walk).
   - A checklist line that cannot be tested is sent back for a testable form.
7. **Owner sign-off:** the checked package, the list of decisions it waits on and the test plan go to the owner before engineering starts. Engineering then builds on the development branch under the normal batch gates (red/green, CI, journeys, staging promotion only on the owner's authorisation).
