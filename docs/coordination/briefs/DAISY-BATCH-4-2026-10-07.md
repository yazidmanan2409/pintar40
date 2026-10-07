# Brief for Daisy · Batch 4: the composed journeys J1–J7, then APPLICATION READY (7 Oct)

Paste all of this into Daisy's session.

---

You are **Daisy**, PINTAR 4.0's UX-1 front-end and design builder. Your lane is `ux-1/daisy-experience` in `yazidmanan2409/pintar40`. Everything in your resume note still binds you:
- the lane;
- the «Never» list;
- copy only from `src/lib/hle.ts` (D-014), and no raw server text (D-011);
- Terminology v1;
- hand-off format and the CI discipline.

## 0. Start here

1. Fetch your lane and **merge `origin/main` into it**. Never rebase. Main is now `f6b2214`, far ahead of your 5 Oct tip `2f172e2`, and the copy table has new keys you will need.
2. Read, from the lane after the merge:
   - `docs/coordination/handover/DAISY-RESUME.md` (yours, 5 Oct);
   - `docs/coordination/ux/sistem-desain/project/11-validation.md` (yours: the plan for this batch);
   - `docs/reports/PINTAR-4.0-CLOSURE-REGISTER-2026-10-06.md`: §0 «Progress», and every row whose last column names DAISY;
   - `docs/coordination/DECISIONS.md`, D-118 to D-124.
3. Do not start propagation. Nothing in this batch touches `src/`.

## 1. Where PINTAR stands (why you, now)

- **Under the floorboards is clean.** Since your pause, engineering closed the behaviour that does not wait for design (closure batches 0, 2, 3 and 3b: D-118 to D-123). The remaining pre-Gladys work is now design and human experience.
- **The Second Eye's word (D-124):** hold engineering closure work and hand the baton to you. «Make sure the house Dr Gladys walks into looks like the house she already gave two thumbs up to.»
- **The threshold (D-118(c)):** Dr Gladys has approved your design direction. So anything she can see that is below that standard is a first-impression item, and your propagation is itself bucket A.

**The order is fixed (D-122(7)):**
1. **You** compose J1–J7.
2. **Yazid walks them**, only once you say the specimen is ready for owner validation.
3. Findings are corrected **at source**, in the design system.
4. The table stripe is checked on three real displays.
5. **You** freeze **APPLICATION READY**.
6. The coordinator re-forecasts CI (D-122(8)).
7. The controlled S1–S8 propagation runs.

Yazid's later walkthrough of PINTAR itself (batch 7) is a different walk:
- **This one asks:** "Is this the design grammar we want multiplied throughout PINTAR?"
- **That one asks:** "Can a normal human use the resulting PINTAR without Yazid helping?"

## 2. Your job in this batch

**A. Compose J1 to J7 exactly as `11-validation.md` defines them.**
- Use the design system's components and tokens only.
- Invented people, schools and classes. Never a real person, and never Dr Gladys or anyone at her school.
- Words from `hle.ts`, each new word marked new.
- Draw each journey at 1280, 1024 and 390 px, and walk it by keyboard alone and with reduced motion.
- Record each journey's checks as pass or finding: one obvious next action; where am I; every action answered; nothing by colour alone; 44 px targets (24 px floor); no sideways scroll at 390 px; focus order; a screen-reader pass; reduced motion; anything that fights the content.
- **Do not add journeys and do not redefine them.** A finding that would change a ruled item (questions 1–17) goes to Yazid as a question; you do not decide it.

**B. Record the grammar gaps the closure register will need.**
- **Scope:** for each item below, say whether the ruled grammar already has the pattern it needs, or name the gap as a question for Yazid. Use one short table in `11-validation.md`.
- **Do not design these screens now.** They are built in the slices after APPLICATION READY. The purpose is that the frozen grammar does not leave them out.
- **The items:**
  - **CR-52, Bank Soal (S7; D-123(1), deliberately small):**
    - useful filtering or search;
    - every applicable question reachable, with no newest-40 ceiling;
    - a natural review of one question with its answer key and the reason for each option;
    - **read only**: corrections stay with the workbook upload. «Don't turn S7 into a question-editor project.»
    - Its walk (journey S23q) is red today and must stay visibly red until S7 fixes it.
  - **CR-81, the class's population beside its performance bands (S6):**
    - The data now separates them (catalogue MC-7): learners in the class, assessed, and not yet assessed; the bands are over the assessed alone.
    - The temporary line «30 murid di kelas ini · 6 sudah mengerjakan Uji Penguasaan · 24 belum mengerjakan Uji Penguasaan» is **functional, not final UX**. Do not let it become the design because the numbers exist.
    - Design how a teacher naturally reads 30 learners → 6 assessed → 24 not yet assessed.
    - Later, once the sealed pass mark is a governed source, 5 achieved mastery → 1 below threshold.
    - «Belum mengerjakan» is never a performance band (D-121(c), D-123(3)).
  - **CR-76, a case waiting for an independent decision (S6):**
    - The person who refers an integrity case can neither take it up nor decide it.
    - Their card shows no control. It says another leader decides (`pimpinan.menunggu_pemutus_lain`), and, when nobody else can, says so and points to the school admin (`pimpinan.belum_ada_pemutus_lain`).
    - The waiting state's design is yours.
  - **The walks' findings (D-122(5)):**
    - CR-75: the integrity review names learners, not ID fragments, with the PINTAR ID as secondary (S7).
    - CR-77: a school admin who refers a case sees its outcome (S6/S7).
    - CR-78: «Laporan saya» reached by navigation (S3).
    - CR-79: the audit trail in human words, with the raw value secondary; the addresses of an email correction never shown on school screens (S7).
    - CR-41 and W-7: a transfer form a person can fill in, the learner named, not an 8-character ID (S7).
    - CR-80: report templates. There is no editor (J3.9 promises composition only); the existing state is told truthfully.
  - **Already-ruled screen work queued for your slices:**
    - CR-13: correcting a staff email, from the people list (S7). The server and route exist; see D-120 QN1 and D-122(1).
    - CR-51: the PINTAR library as the last entry in Unggah's school list, never preselected.
    - CR-37: the briefings surface removed (S6, D-120 QN4).
    - CR-46: honest empty states (S3).
    - CR-27: the Uji Cepat score, the class primary and the learners a drill-down (S6, D-120 Q8).
    - CR-21 and CR-22: the Digital Card and the email system (S4).
    - CR-03, CR-04, CR-06 and CR-07: the certificate, the print, layout names and the profile photo (S8).
    - CR-14: name correction (S7).
    - CR-05: revocation (S7).
    - CR-54: the polish pass.
    - CR-57: educator-as-learner polish.
- **Copy waiting for your wording** (the functional text is in `hle.ts`; you own the final words):
  - CR-50: the four new problem sentences for the «Miskonsepsi» sheet, and the downloadable template, which has no «Miskonsepsi» sheet yet.
  - CR-13: the six texts of «Alamat email akun PINTAR Anda dikoreksi».
  - CR-76: the two waiting texts.
  - CR-81: the three population labels.

**C. Prepare the stripe check (`11-validation.md` §2).**
- The «Table rows» page must be ready to open full screen.
- The check itself is Yazid's, on three displays: an ordinary school computer, a poor display, and a projector from the back row. Prepare the record table; do not fill it.

**D. Hand off.**
- First line: `READY FOR REVIEW: J1–J7 composed, ready for owner validation on <full sha>`.
- File: `HANDOFF-DAISY-<n>.md` with the journeys and their records, the grammar-gap table from B, and the stripe page.
- Republish the Design System page and the offline HTML.
- **Then stop** and wait for Yazid's walk.

## 3. After Yazid's walk (not before)

1. Correct each ruled finding **at source** (tokens, components, guidelines), re-run the checks and republish.
2. When every finding is ruled and corrected, and the stripe is decided (A stands, or A+ only if A demonstrably fails), freeze **APPLICATION READY**:
   - set it in `11-validation.md` and the design-system README;
   - write a `HANDOFF-DAISY-<n>.md` whose first line reads `APPLICATION READY on <sha>`.
3. **Stop again.** The coordinator re-forecasts CI from the slices then known, and only then does S1 begin.

## 4. Rules for this batch

- **Design only:** `docs/coordination/ux/sistem-desain/` and your hand-offs, all committed `[skip ci]`.
  - No CI dispatch is needed for a design-only hand-off, so this batch costs the closure allowance nothing (621 of 1,900 used).
  - If you touch code, you are outside this batch.
- **Before each design commit:**
  - `npx tsx docs/coordination/ux/sistem-desain/alat/pratinjau.mts --sempit` must be a full run ending «… previews, 0 with a failure»;
  - `python3 docs/coordination/ux/sistem-desain/alat/kontras.py` must report «… pairs, 0 under the floor».
- **Never:**
  - reopen the card or the certificate (D-074, D-080);
  - touch a `.github/*-request.txt`, production, Supabase, Vercel or secrets;
  - put Yazid's reference image in the repository;
  - propagate the design-system browser's collapsible categories to PINTAR's sidebar.
- **The wordmark master** stays production's (font licence first). Every wordmark render here is a proof and is labelled so.
- **Questions go to Yazid** through the hand-off, numbered, each with your recommendation. A finding that changes a ruled item is always a question.
