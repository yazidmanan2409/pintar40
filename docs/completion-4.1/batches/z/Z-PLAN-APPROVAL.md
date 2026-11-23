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
