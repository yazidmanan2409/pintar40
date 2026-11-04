# PINTAR 4.0 · Design-completion assignment for Daisy (draft for owner review; not yet sent)

**From:** the coordinator (Claude), on the owner's direction of 4 Nov: «Activate Daisy for the consolidated completion of approved PINTAR 4.0 designs».

**Status:**
- For owner review, after the owner's consistency review of 4 Nov («CONDITIONAL GO … Do not dispatch unchanged»).
- Nothing here is dispatched until the owner approves this corrected package.
- Daisy's independent design work does not wait for every owner decision. Each item carries its own gates (§5).

## For the owner: the genuine design blockers, in one place

| Blocker | Why it blocks | Unblocked by |
|---|---|---|
| **D1 step 1, CR-22 / DAISY-37** (first) | Engineering finds no composition; Daisy's validation says the frame is it | Daisy: a requirement-by-requirement covered/missing mapping (§5, D1) |
| **A1 W1.2 question review** | Studio's last missing composition (S-4, W6.5, Gate 2) | Daisy: no decision needed |
| **B1 W3.6 Konfigurasi** | No approved composition; Batch 4 acceptance is held open on it (D-156(a)) | Daisy: no decision needed |
| **C1 W3.8 report bodies and A4 print** | «Reports: NO APPROVED COMPOSITION» (G:34) | Daisy, laying out the approved words (Dr Gladys's labels stay) |
| **C2 PD «Lihat bukti»** | DAISY-35(5) has no presentation | Daisy: no decision needed |
| **E2 W3.16 the chooser** | «Chooser: NO APPROVED COMPOSITION» (G:38) | Daisy for the composition. **Dr Gladys's six words** are needed for final closure only. |
| **E1 W3.12 J3 navigation** | The composition predates the working context | Daisy may restate J3, or recommend accepting the deviation, now. **The owner** decides which stands (O6) before implementation. |
| **A3 the small-group rule** | The threshold is product policy | Daisy draws the under-threshold state for each option now. **The owner** picks one (O3) before implementation. |
| **D5 / D4 the brand slots and the Design System page** | The wordmark master does not exist | Daisy draws the slot geometry with the placeholder now. The artwork and final publication wait for **F-11**. |

**Not blockers in this exercise:**
- A2: Daisy confirms the presentation of the existing mean. Its meaning changes only if the owner rules (O4).
- D-074(10) / B3: explicitly unresolved, not designed.
- The sage accent: D-162, engineering's.
- D2, the PDF name: Daisy recommends within W3.1. The owner rules only on an exception (O7).
- A4, A5, E3: confirmations.
- The words engineering wrote: Dr Gladys's.

**What completing this commission does not mean:**
- **Terminology.** **Approved words are retained, never replaced by placeholders** («Peserta», «Kenaikan», «Penguasaan per bagian» and every other approved string; §4). A labelled slot is used **only for wording that is genuinely unresolved**: the six expressions (G1), report titles still on Dr Gladys's list (G6), and the engineering-written strings awaiting her (G4). Such slots let a composition pass the **structural** review. They cannot pass **final terminology acceptance** or **Gate 2** («terminology final», G:81; a word placeholder is a NO-GO).
- **Full 4.0 acceptance.** B3 (more than two role/school pairs) is explicitly unresolved and is not designed here, so W3.20 / J2.16 cannot be fully accepted by this commission alone.
- **An exhaustive inventory.** UX-42, UX-44 and UX-47 have no owner in the work register. The register proposes an owner and a disposition for each (01, «Register gaps»; O10). Approving them resolves these known ownership gaps; **it does not by itself prove the inventory exhaustive.**

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
2. `03-SCREEN-REFERENCES.md`: for each item, the current screen (exact files), your frozen composition if one exists, the approved behaviour, and **the evidence that does not exist** (its own section: do not treat a labelled substitute as the real screen).
3. `04-DECISIONS-DAISY-CANNOT-MAKE.md`: the owner and Dr Gladys decisions your items depend on. **Do not choose an option for them.** Draw each option if asked, and say what each costs.
4. `docs/coordination/DECISIONS.md`, notably:
   - D-135 (you decide design execution within the system; the owner is not asked for design-language rulings);
   - D-142, D-144 (scope);
   - D-157 (terminology kept, tour non-modal, the MODE PERAGAAN exit);
   - D-159 / D-160 (Batch 6);
   - **D-161 (branding)** and **D-162** (the sage accent, not yours), with **D-163**, the dated addendum that records the reconciliation and the owner's messages verbatim, with their time and sender, kept apart from the coordinator's own reconciliation and recommendation.
5. The current application, on the development branch. Do not reproduce working behaviour from memory: the screenshots and the code paths in the register are the reference.

## 3. Branding (D-161): read before Package D

**Settled by the owner** (D-161, reconciled by D-163(a); the owner's messages are quoted verbatim in D-163(b)–(c)):

| | |
|---|---|
| Legal company | PT Zayd Pintar Selalu |
| Application | **PINTAR SELALU** |
| Public wordmark | **«Pintar»** |
| Wordmark colour | **#075056** |
| Preferred typography | **Helvetica Neue Bold**, subject to the final master's approval |

- **The wordmark direction is settled.** «Pintar» in `#075056` replaces the older uppercase «PINTAR» / Helvetica Neue 65 Medium / `#245F55` specification. **Your Wordmark card is superseded. Do not use it.**
- **The interface palette is unchanged:** `--pintar-primary` stays `#245F55`, and no token changes unless separately approved. Do not propose palette changes in this exercise.

**Still open, and not yours:**
- **the licensed master artwork** and its physical reproduction (owner-controlled, F-11). Do not draw, freeze or hand on a master;
- **the running-text naming:** where the application name «PINTAR SELALU» replaces «PINTAR» in product text (O1);
- **the tab icon:** its colour and its proxy paths (O1, O9).

Leave all three as they are today.

**Existing assets stay until an approved replacement exists.** Today's logo stays in every slot (D-160(a)), and the application, the tokens and the logo files are not changed by this exercise.

**In your compositions:** where a composition needs the wordmark, use a **provisional wordmark placeholder**: a box at the slot's size and position, labelled «Pintar (master pending F-11)». The final artwork drops into it later.

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

## 5. The items and their gates

**Deliverable forms** (each item's form is in the table):

| Form | What it is | Sections it carries |
|---|---|---|
| **C · composition** | a full screen design | the nine sections of §6 |
| **K · confirmation** | yes, or a correction, per row | per row: the item, yes or the correction, and for a correction the exact change and its acceptance line |
| **T · copy table** | words | per key: the key, the Indonesian, the English, where it appears, and whether it is presentation (yours) or a protected term (Dr Gladys's slot) |
| **P · publication** | the Design System page | the page, its change log, and every provisional section marked as such |

**Gates, per item** (not per package):
- **Start:** when you may begin.
- **Design acceptance:** what the coordinator's check (§8) needs before the design is accepted.
- **Implementation:** what must exist before engineering builds it.
- **Final closure:** what must exist before the item is closed in the register.

| Item | Form | Start | Design acceptance | Implementation | Final closure |
|---|---|---|---|---|---|
| **D1 step 1** CR-22 / DAISY-37 mapping | K | now (first) | the covered/missing mapping below, every requirement answered | — | owner approves the mapping |
| **D1 step 2** six emails, the card in the email | C (only what step 1 found missing), with the **email matrix** (§6) | immediately after step 1 is accepted | §6, with the wordmark placeholder | design and test plan approved (§8) | the automated checks green; the **provisional** email protocol passed (§8); after F-11, the **final** recognition test with the approved artwork |
| **A1** W1.2 question review | C | now | §6 | design and test plan approved | the planned checks green (selftests, walks, a11y); Daisy's side-by-side review (G:14) |
| **A2** the Uji Cepat class figure | K | now | confirms the **presentation and wording of the existing mean** (label, base wording, place) | approved; only if the owner changes the meaning (O4) does it wait | the confirmation recorded; any change implemented and its checks green; W6.7 at Level 3 |
| **A3** small groups | C (one state per option) | now | the under-threshold state drawn for each of O3's options | **the owner's O3 ruling** | the chosen option built; the A3 acceptance for that option (01) green, including zero scored learners |
| **A4** eight Batch 3 wordings | T | now | every key answered; protected terms marked as Dr Gladys's slots | copy approved | the copy in `hle.ts` and the copy guards green; final terminology acceptance (G4 where it applies) |
| **A5** Batch 3 confirmations | K | now | every row answered | corrections approved | per row: **unchanged** → Daisy's confirmation recorded; **changed** → the approved correction implemented and its checks green |
| **B1** W3.6 Konfigurasi | C | now | §6, both roles (see the missing evidence in 03) | design and test plan approved | the planned checks green; G §2 for every route (G:35, :81); Daisy's side-by-side review |
| **B2** UX-09 «nomor induk» | T | now | the term and its one sentence, Indonesian and English, with its places | **G3** if Dr Gladys rules it a protected term; otherwise approved | the B2 acceptance (01) green; final terminology acceptance |
| **B3** more than two pairs | — | **not in this exercise** (O5) | — | — | — |
| **B4** a platform role beside a school role | K, or C if redrawn | now | confirm the two-place treatment, or draw it | approved | **unchanged** → the confirmation recorded and the B4 acceptance (01) green against a reproduced card; **changed** → the drawing implemented and its checks green |
| **C1** W3.8 reports | C | now | §6 for every route in the table below, with the approved words | design and test plan approved | the planned checks green, including the A4 print check; Daisy's side-by-side review; G6 (the titles still pending) for final terminology acceptance |
| **C2** PD «Lihat bukti» | C | now | §6; no academic figure | design and test plan approved | the planned checks green against a reproduced PD class; DAISY-35's own acceptance (BRD:260) |
| **D2** the PDF name | K | now | a recommendation **within W3.1** for **the first two strings** below (the file name and the PDF title); the visible heading stays frozen | approved; **only an exception to W3.1 goes to the owner (O7)** | **unchanged** → the confirmation recorded; **changed** → the new string implemented and the D2 acceptance (01) green |
| **D3** physical proof | — | only if F-11's proof fails | — | — | F-11 |
| **D4** W3.21 the Design System page | P | stage 1 once the no-decision items are in (§7, step 4) | stage 1: published, with the brand and pending sections marked provisional | — | stage 2 after F-11 and the decision-gated items |
| **D5** brand slots | C (geometry only) | now | the slot geometry in four slots, with the placeholder | — (no asset changes until the master) | the D5 acceptance (01) green; after F-11, engineering integrates the owner-supplied master and Daisy verifies its fit (the geometry stays provisional until then) |
| **E1** W3.12 J3 | C or K | now | either J3 restated under the working context (C), or a written recommendation that the owner accept OP-1 / OP-2 (K) | **the owner's O6 ruling** | the planned checks green at every width including 1024–1279; E:90 |
| **E2** W3.16 the chooser | C | now | §6, with the six words as empty slots | design and test plan approved | the planned checks green; **G1** (the six words) |
| **E3** fifteen Batch 2 questions | K (T for the word rows) | now | every row answered | approved | per row: **unchanged** → the answer recorded; **changed** → implemented and its checks green |
| **E4** engineering-written words | T | after Dr Gladys's G4 | for presentation words only | copy approved | the E4 acceptance (01) green; final terminology acceptance |

### D1 step 1: the covered/missing mapping (CR-22 / DAISY-37)

Before anything else, identify the existing approved email frame and map it, **one row per requirement**:
- the DAISY-19 frame (`docs/coordination/ux/email-frame/`), built as `src/components/email/bingkai.ts`;
- your GQ3: «D-079 is the email standard and the DAISY-19 frame its implementation» (DS/11-validation.md:196, :211).

| Requirement | Where it is met in the frame (file, render, line) | Covered / missing |
|---|---|---|
| D-079(a) … D-079(f), one row each | | |
| D-079's addendum | | |
| DAISY-37 (1) … (4), one row each | | |
| the card in the email: 600 / 320 px, light / dark | | |
| the card in the email: table HTML or an image | | |
| the card in the email: the back and the QR, shown or not | | |
| the card in the email: the wordmark with images blocked | | |
| the card in the email: the rows' order and colour rule (D-074) | | |

**A complete frame means confirmation and reuse, not a redraw.** If every row is covered, step 1 is a confirmation and step 2 draws only the six emails' content inside it. Only a missing row becomes new composition.

### D2: three different strings

| String | Today | Source |
|---|---|---|
| **The download file name** suggested by «Simpan sebagai PDF» | «Sertifikat Penguasaan · {kursus}» | `sertifikat.berkas`, set as the document title only while printing (`src/components/sertifikat/AksiCetak.tsx`) |
| **The PDF metadata title** | the same string: Chromium writes the document title into the PDF's Title (`batch-6/evidence/B6C/sertifikat-A4.pdf`: «Sertifikat Penguasaan · Matematika · Pecahan Senilai») | as above |
| **The visible certificate heading** | the frozen sheet's heading, with the learner's name in the body (D-076) | your frozen certificate; **not reopened** |

Recommend **the first two** within W3.1, which keeps people's names out of titles. Your round-2 example («Sertifikat Penguasaan · Bagas Saputra», ronde-2 README:392) names the person, so it is an exception that only the owner can approve (O7). The tab's own page title is a separate string (`judul-halaman.ts`) and stays as it is.

### C1: the concrete routes

| Route | Who reads it | Variants to draw |
|---|---|---|
| `/edukator/ringkasan?kelas=…` Ringkasan Kelas | the readers `generate_report` authorises (re-authorised per metric for **this** viewer); linked from `/pimpinan` and Konfigurasi | full; a metric the reader may not see (an honest statement stands in its place); empty; under five («not yet»); A4 print |
| `/dekan/ringkasan?simpul=…` Ringkasan Sekolah | the same; read-only (INV-19); linked from `/pimpinan` and Konfigurasi | full; covers every school year («no single year claimed»); empty; A4 print |
| `/pimpinan` | Kepala departemen, Dekan, over an assigned node (`management_scope_over_node`). **Admin sekolah and educators meet the refusal page, by design.** | the decisions waiting; none waiting; the suppression line; refusal |
| `/pimpinan/[simpul]` | as `/pimpinan` | a node's page; refusal |
| `/pimpinan/[simpul]/murid` | as `/pimpinan`, plus `CAN_VIEW_LEARNER_ROSTER` | the roster; empty; refusal |
| `/pimpinan/[simpul]/murid/[orang]` | as above | one learner; refusal |
| `/pimpinan/[simpul]/umpan-balik` | as `/pimpinan` (the policy asks `management_scope_over_node` again) | the cycles; none; refusal |
| `/pimpinan/[simpul]/umpan-balik/[siklus]` | as above | one cycle; refusal |
| `/pimpinan/[simpul]/umpan-balik/kelas/[kelas]` | as above | one class's feedback; refusal |
| `/pengembangan/[simpul]` (DAISY-34) | the facilitator; Kepala departemen over the place; Dekan (progress and result); Admin sekolah (enrolment, participation, completion only). Anyone else is refused (PD_RECORD_NOT_ALLOWED). | each audience's columns as the database returns them; refusal; never a figure, ranking or answer |

The two Ringkasan bodies and their A4 print are the core of C1. The `/pimpinan` and `/pengembangan` routes are included where G:34 names reports. Their shells and behaviour are built and stay; what they need is the body's composition.

## 6. What every composition (form C) must contain

Forms K, T and P use their own shorter forms (§5). The nine sections below apply to **compositions only**.

The deliverable must let engineering build it **without guessing**. For every composition:
1. **The complete composition:** every region of the screen, not an isolated illustration, a token list or generic advice.
2. **Layouts:**
   - **Screens:** **1280** (desktop), **820** (tablet), **390** and **320** (phone; both are drawn), plus **A4 print** where the surface prints (C1; the certificate and card are already frozen). **E1 also covers 1024–1279 px**, the rail's range.
   - **Emails (D1) are exempt from the screen widths.** They use the **email matrix** instead: **600** and **320** px, each in **light** and **dark**; **images blocked**; and the **plain-text** part. Emails have no print.
3. **Every state and role variant:** empty, loading, refusal, error, success, «not yet», each role that sees the screen, and the long-content and edge cases named in the register.
4. **Keyboard and accessibility:** focus order, focus return, the skip-link target, names and roles, colour never the only carrier, target sizes.
5. **The exact Indonesian copy and its English.** Words that are Dr Gladys's are marked as her slots, never filled.
6. **Component usage, tokens, measurements and spacing:** your components by name (`Kosong`, Collection / `Koleksi` and `Penomoran`, `TombolKirim`, `BidangTeks`, `Dialog`, `HalamanPenolakan`, the shells, `pin-*`). Nothing ad hoc where a token exists.
7. **Navigation and interaction outcomes:** where each action leads, what is announced, what is saved.
8. **Edge cases:** the register's (2,000 questions in 500 lessons; five long options at 320 px; images blocked; and so on). The case of more than two role pairs is **not** among them: B3 is excluded.
9. **A requirement-specific acceptance checklist**, one line per checkable rule, each marked:
   - **[auto]** if engineering can test it (source or rendered);
   - **[manual]** if it needs a person (it then follows the recorded protocol in §8).

Deliver each package as a folder under `docs/coordination/ux/completion-4.0/<package>/` on your lane:
- a README with the item's form;
- renders at each width and in print;
- the keyboard and accessibility trees, as your `render/jalan/*.txt` do today;
- the acceptance checklist.

## 7. Order of delivery (by dependency)

The email track is first in priority, **not a block on everything else**: the items in step 3 may run alongside steps 1 and 2.

1. **D1 step 1, first of all:** the CR-22 / DAISY-37 covered/missing mapping (§5).
2. **D1 step 2, immediately after step 1 is accepted:** the six emails and the card in the email, in the confirmed frame, with the wordmark placeholder.
3. **The items that need no decision, in any order, alongside the email track:** A1, A2, A4, A5, B1, B2, B4, C1, C2, D2, D5 (geometry), E2 (with the word slots empty), E3.
4. **D4, stage 1:** the Design System page published with everything above and the brand as settled. Every section that waits on F-11 or a decision is marked **provisional**.
5. **The decision-gated items, as each ruling lands:**
   - A3 (O3);
   - E1 (O6; the design may be drawn earlier, its build waits);
   - E4 and the final words for A4 / B2 / C1 / E2 (Dr Gladys).
6. **After F-11:** the **owner-supplied approved artwork is integrated by engineering, and Daisy verifies its fit** in each slot (the D5 geometry stays provisional until checked against the actual master); D4 stage 2 (provisional sections resolved); the final email recognition test; D3 only if the physical proof fails.
7. **Batch 7 follows your packages:** the NVDA / TalkBack / 200 % zoom pass (W6.12) and the new words (W4.4) are «only meaningful once the screens are final».

Send each item when it is complete. An item is not "done" until it passes the check in §8.

## 8. Verification plan

### Before implementation (the coordinator's check of each item Daisy sends)

1. **Completeness, per form.**
   - A composition has all nine §6 sections, every width (screens: 1280, 820, 390, 320, and 1024–1279 for E1; emails: the email matrix instead) and print where it applies, and every state and role variant named in the register.
   - K, T and P items have their form's sections (§5).
   - Missing sections are returned to Daisy as a list, not filled by engineering.
2. **Conformity to authority.** Each item is read against:
   - the item's approved rule (quoted in the register);
   - D-135, D-142 and D-144 scope;
   - D-157 (approved words kept; the tour non-modal);
   - D-160 (token, no school logo, never «delivered»);
   - D-161 / D-163(a) (the wordmark «Pintar» `#075056` with the placeholder; the palette unchanged; no master drawn or frozen).

   Anything that changes a metric definition, a permission, identity security, certificate integrity, the photo prohibition or a frozen term is **rejected back to Daisy with the rule it breaks**. It is never "interpreted".
3. **Grammar conformity:** components and `pin-*` / tokens only. The existing static guards (the token rule, the copy-table rule, no internal words, DAISY-04 every key in the table) are named against each composition.
4. **Reality check against the current application.**
   - Each composition is laid beside the screenshots in `03-SCREEN-REFERENCES.md`. The working behaviour the screen has today (its data, actions, refusals and role differences) must all still be there. A composition that drops working behaviour is returned.
   - **Where 03 records missing evidence** (platform-admin Konfigurasi, a mixed platform/school card, a PD class), that state is reproduced on a disposable local stack with synthetic data before the composition is accepted. The labelled substitute is never taken as the real screen.
5. **Decisions isolated.** Every place an item depends on an owner or Dr Gladys decision is listed, with its gate from §5. Daisy's default is never taken as the decision.
6. **The test plan.**
   - Every [auto] checklist line becomes a planned red/green selftest (source or rendered) or a browser-walk step, on the pattern of `audit/b5-ujung.mjs`, `audit/b6-cetak.mjs` and `audit/a11y.mjs` (axe WCAG 2.2 AA, skip link, page title, no sideways scroll at 320–1280, the keyboard walk).
   - Every [manual] line is assigned to the protocol below.
   - A line that is neither testable nor manual is sent back for a checkable form.
7. **Owner approval of the design and its test plan.** The checked item, its gates and its test plan go to the owner. **Implementation does not start before this approval.**

### After implementation (engineering, under the normal batch gates)

8. **Source and rendered checks:** each planned selftest is written red against today's code, then green against the build.
9. **Browser walks and accessibility:** the planned walk steps and the a11y harness at every width.
10. **CI and journeys** green on the development branch. Staging promotion only on the owner's authorisation.

### The recorded manual protocol (for the human criteria)

Each [manual] line is run by a named person and recorded (date, device, client, result, screenshot) in the batch's evidence folder.

| Criterion | Protocol |
|---|---|
| **Email layout (provisional, with the placeholder)** (D1; BRD:211) | Each of the six emails is sent to a test inbox and opened in Gmail web, Gmail on a phone, Outlook desktop and Outlook on a phone; light and dark; once with images blocked. Recorded per client: (1) the layout matches the composition; (2) nothing is clipped or overflows at 320 px; (3) the plain text is complete; (4) with images blocked, the email still reads in full. **Recognition of who sent it, why and what to do is timed: a reader not involved in the design, shown the email at 320 px, states all three within 5 seconds**, in at least 4 of 5 attempts across the clients. **This stage cannot establish brand recognition:** a labelled placeholder is not the brand. |
| **Email recognition (final, with the approved artwork)** (D1; after F-11) | The same clients and conditions, repeated with the owner-supplied master in place. Recorded: the same 5-second test, now including «this is from Pintar», in at least 4 of 5 attempts, with images on and with images blocked (the alt text then carries the name). |
| **Physical proof** (D3; F-11) | The certificate printed on A4 at 100 % and the card at CR80, from the development build. Recorded: the 0.75 mm line measured; the QR scanned on two different phones; the colours under daylight. |
| **Design judgement** (A1, B1, C1, C2, E1, E2) | Daisy's side-by-side review of the build beside her composition, at each width (G:14). Recorded: match / deviation per region. |
