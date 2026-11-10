# PINTAR 4.1 · execution plan (in force from 11 November 2026)

**Authority:** `OWNER-DECISIONS-2026-11-11.md` (O41-7 to O41-15). This plan supersedes §4, §5 and §6 of `SCOPE-REGISTER.md`. The capability definitions (register §1) and truths (§2) stand, as those decisions change them.

**Base:** `main` at `d764d69e` (4.0 promoted to staging, migration 224).

## 1 · The sequence

```
Lane A  A1 sitting control ──► A2 pause and emergency (C7+C8) ──► A3 recovery (C1, no Exam Mode)
Lane B  B0 admin lock-out ───► B1 accountability events (C5) ───► B2 print identification (C6)
Lane C  C1w item workbench (C4 inside) ─► C2w annotations (C2) ─► C3w AI generation (C3)
        E  AI provider evaluation, alongside from the start
                                                                └─► Z one candidate ─► walkthrough
```

- The lanes touch different tables and screens and run in parallel.
- Cross-lane dependencies: B1 before A3 and before C3w. A1 before A2. C1w before C2w and C3w.
- **The walkthrough date is set when A1 and C1w close** (O41-7).

## 2 · The batches

Effort is relative: S about 2–4 engineering days, M about 5–8, L about 9–14.

| Batch | Delivers | Closes when | Effort | Review before build |
|---|---|---|---|---|
| **B0** Admin lock-out protection | The platform and each school cannot lose their last administrator by removal or silent expiry; an expiring role warns and can be renewed | `batches/B0-COMPLETION.md` | S | Sharon, short |
| **A1** Sitting control | A teacher acts on one learner's sitting: extra time, end it, another attempt, a changed window; an abandoned sitting ends and is scored; a suspended learner's sitting has a defined outcome | `batches/A1-COMPLETION.md` | M | Sharon and Daisy |
| **C1w** Item workbench | A stable identity per question; edit and discard a draft in the app; revise one question with its original preserved and linked; a correction replaces its predecessor; a withdrawn release stops new sittings; wrong-key correction (O41-11) | `batches/C1W-COMPLETION.md` | L | Sharon and Daisy |
| **B1** Accountability events (C5) | Sign-in success and failure, sign-out, print and export requests, in a separate store with 12 months' retention (O41-13, O41-4) | completion page written before it starts | M | Sharon |
| **B2** Print identification (C6) | «Cetak laporan» logs the request and prints the footer with its reference | as above | S | Daisy |
| **A2** Pause and emergency (C7 + C8) | Class scope; the reason list; extend and resume early; warnings in the school's zone; emergency stop at class scope | as above | M | Sharon and Daisy |
| **C2w** Annotations (C2) | Attributed annotations beside sealed content, in a table no sealed report reads | as above | S–M | Sharon; Daisy short |
| **A3** Recovery (C1 without Exam Mode) | One writer per sitting at every boundary; stale-device writes refused; self-recovery (low stakes) and teacher-authorized recovery (Uji Penguasaan) from A1's screen | as above; the red cases are written first (O41-3) | L | Sharon and Daisy, full |
| **C3w** AI generation (C3) | Source material in; drafts with provenance into the workbench's draft state; the existing two-person review and publication | as above; and its entry gate in register §4, with "C4 verified" read as "C1w closed" | L | Sharon and Daisy, full |
| **E** Provider evaluation | The blind comparison in `C3-EVALUATION-PLAN.md` | results to the owner; no selection before the owner decides | S | per its plan |
| **Z** One candidate | The integrated journeys; one full verification; Sharon and Daisy once on that commit | the walkthrough is scheduled | M | — |

**Planning estimate:** about 50–65 engineering days. It is not a deadline.

## 3 · How a batch runs (O41-15)

1. **The completion page first.** It states the operations, who may do each, what is refused, what history is kept, the screens and their states, the tests that must be red before and green after, and what is deliberately out.
2. **One review of that page** by the reviewers named above. Their questions are settled on the page before code.
3. **Build to the page.** Targeted tests while building. A ruling that arrives mid-batch goes to the next batch unless it is a blocker.
4. **The engineer's rendered check** before any review: 1280, 390 and 320 px; keyboard only; every disclosure opened; the reviewer's own navigation sequence.
5. **One verification on the batch's candidate:** the full suite, CI and journeys on that exact commit.
6. **One review of the result, one correction pass, then close.** A blocker (security, authorization, evidence integrity, an essential journey) is always fixed before closure. Anything else goes to the register in §5.
7. **Promote to staging** through the protected process, on the owner's authorization for that merge. Then verify the migration count, the preservation counts, and the batch's own screens.

A batch that is closed stays closed unless a blocker is demonstrated.

## 4 · Not in 4.1

The deferred list is in `OWNER-DECISIONS-2026-11-11.md` §4. Two further items from the assessment are also outside 4.1 and go to the 4.2 roadmap:
- recomputing question-health statistics on a schedule;
- a teacher's handover view after a colleague leaves.

4.1 must not add an assumption that blocks one person holding roles at two schools (O41-12).

## 5 · Register of non-blocking findings

Carried from 4.0, to be taken with the batch that touches the same code, or in 4.2:
- **Sharon:** move the school guard ahead of `not (v_summary ? 'run_id')`; add the school filter to the in-function run check; prove F37-K06 with a plant.
- **Daisy:** the first Tab after landing on an audit run scrolls the frame; a 15 px header strip on a phone landing; broader audit presentation.
- **Cosmetic:** Kenaikan step 2's «·» status line; the summary's group order; «Tambah Tingkat» suggesting «2026/2027»; the 320 px top bar breaking titles; «Kursus» in «Cabut sertifikat» (X12).

From the pre-build review of A1 and C1w (11 Nov), taken with those batches:
- **A1, Daisy:** state how an open player learns of an extension or an ending (a light check every 30 to 60 s, and on every send) (A1-R1); name `/mengajar/[kelas]/siapa` in place of "the class's assessment page" (A1-R2); the approver's queue under Konfigurasi's «Yang menunggu», and on a head of department's home (A1-R4).
- **C1w, Daisy:** on an existing assignment, «Ada perbaikan · terbit {tanggal}» linking to «Pindahkan penugasan», with nothing moved automatically (C1-R2); a paper printed while under review relies on its QR (C1-R4); the school notice's channel, in-app plus one email to the school's admins with no student names (C1-R5).
- **Staging, Daisy:** her session cannot reach either staging host and has no staging sign-in. The three checks in §6 stay outstanding.

New non-blocking findings are added here when raised, with the batch they came from.

## 6 · Still open from 4.0 on staging

Three rendered checks, not yet seen: a certificate's displayed date for a night-issued certificate; the integrity count line; «Materi tanpa judul» (no such assignment exists on staging). They need a browser on staging. They are checks, not a review round.

**Owner (11 Nov):** these do not hold 4.1 development. Daisy attempts them; if she cannot reach staging, they stay recorded as outstanding and a browser-capable person performs them before the next human acceptance milestone. «Materi tanpa judul» stays explicitly unverified.
