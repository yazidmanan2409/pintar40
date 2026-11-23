# Z · Bob's approval of the build plan (23 Nov 2026)

**The plan:** `claude/z` at `f258e5f4`, `docs/completion-4.1/batches/z/Z-BUILD-PLAN.md` (Second Eye).

**The authority:** the owner delegated approval of the Z plan to Bob. It goes back to the owner only for a policy decision, a material scope change or an unresolved dependency.

## Decision: APPROVED, with conditions

**Checked against `Z-READINESS.md` and rulings 55–80:**
- **Scope:** every authorised row is present, and nothing is added.
- **Order:** the dependency order is sound. D-1 comes before K-01 and K-02, V2 before K-01's screens, K-07 with K-01, R-10 first in Z5, and the words last.
- **Migrations:** seven (300 → 307), serial.
- **Reviewers:** correct (Sharon for SQL, permissions and verdicts; Daisy for screens and words).

**Conditions:**
1. **Each SQL chunk goes to Sharon at the chunk's end** (Z1, then Z2), not at the candidate. **Z3's K-01 screens wait for her Z1 PASS.**
2. **The K-01 inventory** (Z0) goes to Bob and Sharon before Z1's K-01 SQL. It must also cover:
   - Kenaikan;
   - `siklus.ts`;
   - the public verification page;
   - any export or report that states «tercapai» or «lulus».
3. **D-1's guard allow-list** (Z-D1-02) is named in the commit and reviewed by Sharon. **Containment stays in force** until her PASS on the repaired readers.
4. **R-15's triage:** each item's proposed class (Z, later or no change) comes to Bob before it is built or dropped.
5. **Every hand-off** comes with its head and pre-flight to Bob by a one-shot message. Bob verifies before sending it for review.

## Answers to §6

- **D-6's read RPCs: they stay executable** (Sharon's option 2). This is what R-17 already specifies under ruling 55:
  - the five write RPCs are revoked;
  - the links are hidden;
  - nothing is deleted.

  It is not a new policy decision. **Condition:** Sharon confirms in Z2 that each read RPC still enforces its own authority (no reader gains access by the change), and Z-D6-01 asserts that. Going fully dark would be a new ruling, and it is not requested.
- **V2's «in progress» line:** the fix proceeds without it (the latest finalised result).
  - Daisy proposes the words, if she judges a line is needed.
  - The owner approves them with Z's words (R-22: "with the owner's approval").
  - It does not block Z1.
- **The single-answer AI restriction:** **it is not lifted in Z unless the owner rules it.** Bob puts the question to the owner when D-1's repair passes Sharon's review. Until then, `ai_soal_tertutup` keeps «exactly one key».

## Material information for the owner (no decision)

**The effort** is about **15.5 working days plus about 3 days of slack.** The earlier estimate was 4–6 days, made before rulings 75–78 added R-26 to R-28 (about 30 items).
- **4.1 gates closed** moves from "about 2–3 weeks" to **about 4–5 weeks** from 23 Nov.
- Reviews overlap the next chunk, as the plan says.

---

## Owner's refinements (ruling 81) and Bob's implementation

1. **The verification cadence** replaces "a full pre-flight per chunk":
   - **Every chunk:** focused checks only. That means lint and typecheck, the chunk's own red-first cases, the tests of every file it touches, the plants in its area, and A2A-L01 when it adds a migration.
   - **One intermediate full pre-flight, after Z2.** By then every migration (300 → 307) and every SQL change is in, so schema-level breakage shows up before the screens build on it. That one run is justified.
   - **One full pre-flight on the final candidate (Z9),** followed by CI and the journeys once.
   - **No other full runs,** unless a focused check fails in a way that suggests a wider break; Bob decides that case by case.
2. **D-6:** Sharon states whether any read RPC serves a **legitimate existing purpose**, for example a leader reading rounds already collected.
   - **If none:** the reads are revoked too (dark). Revoking EXECUTE is reversible and deletes nothing.
   - **If one does:** only that read stays, the purpose is written in the migration header, and Z-D6-01 asserts its authority.
   - This supersedes Bob's earlier "reads stay".
3. **V2:** the latest completed result, plus a **secondary line while an attempt is open.**
   - **The words:** Daisy's to finalise, with the owner's suggestion «Ujian ulang sedang berlangsung.» as the start. The line must never read as the open attempt's result.
   - **The red cases:**
     - begun and open (the line is shown);
     - abandoned or ended unfinished (no line, and the completed result is still shown);
     - finalised later (the new result replaces it, and the D14 marker where it applies).
   - This supersedes "no line".
4. **AI single-answer:** stays (unchanged).
5. **K-01's integrated check:**
   - **The consumers:** learner result, teacher pages, class reports (including Kenaikan), retake eligibility, certificates and recalculated results.
   - **Two scripted learners:**
     - (i) mastery at or above the mark, with a must-be-right item missed;
     - (ii) a verdict changed by an approved key correction.
6. **K-07, the existing data, read-only on staging on 23 Nov:**
   - `school_pass_marks.percent` (smallint): 38 rows, **60–70**, 0 out of range.
   - **`assessment_assignments.pass_mark` and `assessment_sessions.pass_mark` are stored as FRACTIONS (numeric 0.60–0.70),** not percent. That covers 182 and 1,779 rows, 0 out of range.
   - **333 sessions have a null pass mark** (legacy or diagnostic).

   **So:**
   - the floor is expressed **per column in its own unit**: 1–100 for `percent`, and 0.01–1.00 for the fraction columns;
   - **null stays allowed**, so the legacy rows are untouched;
   - the constraint is added `NOT VALID`, then validated **only after** a read confirms zero violators;
   - **no existing row is updated.**

   Production's values are not read: that needs the owner's permission. They must be checked before any production release of Z.
7. **Human experience:** each Z3–Z5 screen row with a failure path gets a short **recovery walk**:
   - provoke the failure;
   - check the person can tell what happened and whether their work was kept;
   - then the next step.

   Committed beside the captures.
8. **Scope:** bounded to the authorised rows. Anything new goes to the ruling 79 audit or later, not into Z.

**V2's words (Daisy, ux-1 `c208d953`, `Z-V2-KATA.md`).** Neutral tone. Shown only while a retake of that chapter's Uji Penguasaan is open:
- **Learner,** `hasil.ulang_berjalan`: «Anda sedang mengerjakan Uji Penguasaan ini lagi. Sampai selesai, yang tampil di sini hasil sebelumnya.» / «You are taking this Mastery Check again. Until you finish, this shows your previous result.»
- **Teacher,** `mengajar.murid1.ulang_berjalan`: «Sedang mengerjakan Uji Penguasaan ini lagi. Sampai selesai, yang tampil hasil sebelumnya.» / «Taking this Mastery Check again. Until it is finished, the previous result is shown.»

They refine the owner's suggestion, and ruling 81 makes them Daisy's approved wording. They go to stream A's `// Z-A` block.

**D-6, Sharon's purpose test** (`D6-READ-RPC-PURPOSE-f258e5f4.md`, `03632083`):
- **Revoke three reads:** `feedback_questionnaire`, `my_feedback_cycles`, `feedback_subjects_for_class`. Each serves only a revoked write, and each names educators.
- **`feedback_result` has a legitimate purpose only if a deployed database holds a closed round** (PUBLISHED or WITHHELD).

**Staging, read-only on 23 Nov:** `feedback_cycles` has **0 rows**, and `feedback_results` has **0 rows**.

**Production** is not read, because that needs the owner's permission.
- **Default** (Sharon's, absent production's counts): **revoke all four reads,** so all nine RPCs are dark. That is reversible and deletes nothing.
- **If the owner permits the two-count read on production** and it shows a closed round, `feedback_result` stays, with its purpose in the header and its tests: a non-subject educator and a learner refused, anon with no EXECUTE, and an OPEN cycle returning no number.
