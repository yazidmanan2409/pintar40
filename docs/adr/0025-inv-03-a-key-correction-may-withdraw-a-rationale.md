# ADR-0025 — INV-03: a governed key correction may withdraw a rationale that contradicts the corrected key

**Status:** accepted (owner decision of 12 Nov 2026, option A1; PINTAR 4.1, F1-R1b)
**Amends** INV-03 in `docs/rebuild/03-PINTAR-INVARIANTS.md` (baseline 2026-11-12). The repository is the baseline
of record (ADR-0019), so the amendment is made here and nowhere else.

## Context

A governed answer-key correction (C1w, O41-22) copies the course and writes the corrected key on the copy. Each
option's rationale and misconception code were authored for the old key. After the correction, the new key could
read «Ini belum tepat» and name a misconception, and the old key «Ini tepat». Every learner who sat the corrected
revision could be shown a mark and, beside it, an explanation that contradicts it (F1-R1b, found by Daisy in her F-1
review).

INV-03 required every option's rationale to be non-empty, enforced by `NOT NULL` and a non-empty `CHECK`. Clearing a
stale rationale contradicted it. The owner chose (C1W-KEY-CORRECTION-CLEARS-STALE-EXPLANATIONS.md §3b, §3c):

- **A1 (taken):** narrow the invariant to what can be authored; a governed correction may withdraw a rationale, and
  the option names the correction that did.
- **A2 (not taken):** keep INV-03 and write a fixed sentence in place of the stale rationale. It would be stored
  content rather than copy, read by learners as the option's explanation, and could not be translated.
- **A3 (not taken):** keep INV-03 and withhold the stale rationale at every reader. It differs from the approved rule
  ("cleared in the corrected revision"), and a reader added later could miss the withholding.

## Decision

1. **The invariant (owner's wording):** every Option's rationale is non-empty, except where a governed,
   two-person-approved answer-key correction has withdrawn it because it contradicted the corrected key. Such an
   Option keeps a durable reference to that correction, the withdrawn text is kept on the correction's audit record,
   and no further revision of its package may be submitted until the rationale is written.
2. **Enforcement** (Sharon's verified design, §3d; `supabase/migrations/20270117140000…`):
   - `item_options.rationale_withdrawn_by` references `key_corrections(id)` (`on delete restrict`). One `CHECK`: a
     non-empty rationale and no reference, or a null rationale and a reference.
   - A trigger admits the reference from exactly two places:
     - **the confirming act:** `koreksi_kunci_berwenang` for that correction, the option in its corrected copy of the
       question it corrects, its correctness different from the option it supersedes;
     - **a copy:** the copied question's `supersedes_item_id`, and the same label (unique per question), holding the
       same reference.

     Every other path is refused. Writing a rationale clears the reference, in the same statement.
   - The withdrawn text is kept on `key_corrections.penjelasan_dihapus`, written once.
   - The draft editor (`soal_draf_masalah`) and the package upload (`lesson_package_check`) still refuse an option
     without a rationale. So a further revision cannot be submitted until each withdrawn rationale is written again.
   - The release digest is unchanged: `content_field` encodes null as `~`, and the reference is governance, not taught
     content.
3. **Tests:** F13-K16 to K21. The baseline parity check proves the amended document, its manifest entry and this
   record arrive together.

## Consequences

- Readers of `rationale` must accept null. The learner's review shows no explanation, and the reading map falls back
  to the objective's statement. Studio marks the corrected revision as owing explanations.
- An urgent correction is never delayed for replacement explanations: the correction asks for none.
- This is the only amendment of the frozen baseline in PINTAR 4.1 so far.
