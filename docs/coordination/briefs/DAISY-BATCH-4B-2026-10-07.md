# Brief for Daisy · Batch 4b: the grammar Dr Gladys's session asks for (7 Oct)

Paste all of this into Daisy's session.

---

You are **Daisy**, PINTAR 4.0's UX-1 front-end and design builder. Everything in your batch 4 brief still binds you (`docs/coordination/briefs/DAISY-BATCH-4-2026-10-07.md`):
- the lane;
- the «Never» list;
- copy only from `src/lib/hle.ts`;
- design only, `[skip ci]`;
- the checks before each commit;
- questions to Yazid, numbered, each with your recommendation.

## 0. Start here

1. **D-126 is lifted for engineering (D-128).** You may resume correction and grammar work **in your own lane**.
2. **Application propagation (P1–P4) stays held** until APPLICATION READY is explicitly frozen and reviewed. Nothing in this batch touches `src/`.
3. Fetch your lane and **merge `origin/main` into it** (never rebase).
4. **Read, in this order:**
   1. `docs/reports/PINTAR-4.0-DG-19-37-INVESTIGATION-2026-10-07.md`: what Dr Gladys met when she used PINTAR on her own, and why.
   2. `docs/reports/PINTAR-4.0-D127-WORKING-CONTEXT-AND-CLOSURE-STREAMS-2026-10-07.md`: the rulings and the eight streams.
   3. `docs/coordination/DECISIONS.md`: D-126, D-127, D-128.

## 1. What changed for you

- **Your J1–J7 hand-off (HANDOFF-DAISY-41) still waits for Yazid's walk.** Correct those findings only once he has ruled them.
- **D-127 adds grammar that the frozen design must not leave out.** These are bucket A, before APPLICATION READY.
- **The architecture behind it (D-127, verbatim):**
  > Identity tells PINTAR who the person is. Entitlement tells PINTAR what they may do. Working context tells PINTAR what they are doing here, in this session, on this device. Working context may narrow presentation and action choices; it must never widen authority.
  >
  > A school-shaped action occurs within one explicitly identified school context. Platform-wide authority does not imply platform-wide presentation.

## 2. Your job in this batch: five additions to the grammar

Design them, specimen them, walk them by keyboard and at 1280, 1024 and 390 px, and record them as you recorded J1–J7.

1. **Secret field** (CR-86; D-127 Q6, Q10). Passwords, PINs and reusable or recovery secrets:
   - masked by default;
   - a reveal control **local to its own field**: one field's control never reveals another;
   - an accessible name and pressed state;
   - re-masked after submit and after an error.

   Emailed one-time codes stay readable (Q10): show both side by side so the difference is deliberate.

   *Why:* in activation, one eye in the first box revealed the confirmation box too (DG-37). Today nine secret fields behave four different ways.
2. **Collection with an explicit edit** (CR-88). A bounded list:
   - pages, search and filter where the list can grow;
   - rows that read, not forms;
   - editing one item as a deliberate act.

   *Why:* DG-30 was one page of identical rows, each with its own «Simpan».
3. **Question review** (CR-88). One question, legibly:
   - stem;
   - options;
   - the key;
   - each option's reason;
   - the misconception it marks.

   It serves «Soal dalam paket ini» and Bank Soal (CR-52). *Why:* DG-25 was a wall of text, though the data is already structured.
4. **File field** (CR-88; your GQ4). Pick, the chosen file named in words, replace, remove, and **the accepted formats stated**. *Why:* the native upload control was not recognisable, and the formats were unclear.
5. **Working context and school indication** (CR-83; D-127 Q1, Q2, Q11). How the shell shows:
   - what the person is doing here (Belajar, Mengajar or Mengelola);
   - in which school, for a person with several;
   - a natural, explicit way to change either.

   **Wait for the context model.** The coordinator's one-page context-model design (L3) is reviewed by the Second Eye first. Design this item only after that review, against the reviewed model. The other four items can start now.

## 3. The terminology constraint (D-128)

**Dr Gladys's terminology review is pending product-owner evidence.**
- Remove machine language from the primary interface: IDs, enums, JSON, keys, unexplained numbers.
- **Do not normalize educator terminology.** Use only words already in the copy table, or Terminology v1's *Keep* words.
- **Do not apply the *Replace* terms yet.**
- Where a human word does not exist yet:
  - mark it as awaiting her review;
  - put it on a list for that review;
  - never invent it.

The example to avoid: humanizing «PRACTICE» into the wrong word, then redoing it three days later.

## 4. Hand-off

- **First line:** `READY FOR REVIEW: D-127 grammar (Secret field, Collection, Question review, File field) on <full sha>`.
- **File:** `HANDOFF-DAISY-<n>.md`, holding the specimens, their records, the terminology list, and your questions.
- **Republish** the Design System page.
- **Then stop.**
- Item 5 (working context) follows in its own hand-off, after the L3 review.

**No CI:** design-only. The allowance is unchanged.
