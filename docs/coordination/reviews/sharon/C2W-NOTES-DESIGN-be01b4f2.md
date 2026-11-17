# C2w · reviewer notes («Catatan peninjau»): short design review

Sharon, 17 Nov 2026 (08:30 UTC). Read-only.

**What I reviewed:** `docs/completion-4.1/batches/C2W-COMPLETION.md` on `claude/c2w` at `be01b4f237a4bf0b6a582a6a1a979def88969831`, in full (151 lines). It is docs only; nothing is built yet.

## What holds now

**The design is accepted, with four conditions (D1 to D4) to build into B1 to B6.** My three questions are answered below.

## The three questions

1. **Is CAN_REVIEW the right capability for a school's writer? Yes.**
   - A note is a reviewer's judgement on sealed content, and CAN_REVIEW is the capability that seals. HEAD_OF_DEPARTMENT and INSTITUTION_ADMIN hold it.
   - EDUCATOR (CAN_DRAFT) may read, through `catatan_peninjau_studio`, but not write. That is right.
2. **Is the library writer rule right, and is the report's own authorisation enough for the teacher's read? Yes to both, on one condition.**
   - The library's own reviewers, or the platform admin, write. No school annotates platform content, as ruled.
   - The class report's authorisation is the right gate for the read, **provided the question is in that class's evidence**, as the design says. B6 must also show a teacher of a school **without** the release refused, with the same refusal as an unknown item.
3. **Is walking the chain on each read acceptable, with no stored root? Yes,** on condition D3.

## Conditions

- **D1: one live note per item and option, under concurrency too.**
  - The unique index on `menggantikan_id` stops two replacements of one note. **It does not stop two concurrent *first* notes**, both with `menggantikan_id` null.
  - **Add** a partial unique index on (`item_id`, `opsi_label`) where `menggantikan_id is null`.
  - **The write checks** that `menggantikan_id`, when given, is the item and option's current note, on the same item and option. A stale one is refused.
  - **A race test on two connections:** two first notes, then two replacements of one note. Each time exactly one wins, and the other gets a named refusal, not a constraint error.
- **D2: the trigger enforces the invariants, not only the function.**
  - On insert, `institution_id` must equal the item's owner, and `content_is_sealed` must hold. The UPDATE and DELETE refusal stays.
  - Then no future writer can break them.
- **D3: the chain walk is bounded.**
  - The recursive walk over `supersedes_item_id` carries a depth cap and a cycle guard, as `riwayat_soal`'s must, and uses an index on `supersedes_item_id`. Confirm one exists, or add it.
  - It runs as one statement inside the read, with no lock.
- **D4: free text and privacy.**
  - `isi` is free text up to 1000 characters. For library content it is readable by teachers across every school that received the release.
  - **The form says, in Daisy's words, that a note describes the option's reasoning and never names a learner.** It cannot be enforced, so it must be stated.
  - Rendering stays escaped: React text only, never `dangerouslySetInnerHTML`. B3 asserts that a note containing markup renders as text.

**As designed, and accepted:**
- **No existence oracle:** an unknown item and an unreadable one are refused alike.
- **Never evidence:** the metric-source refusal names the table, the closure assertion covers `calc_*` and views, and nothing reaches learners, proved as F06-P01 proves its secret.
- **No print route.**
- **I-5's comparison:** the key at the note's sealed revision, against the revision on screen or `kunci_berlaku_sesi`.

## Also noted

- **A3 at `b5cd166a6fb6199ee9b5891099966f34907240c3`:** the diff from `e3a7629b` is `selftest/a3.test.ts` and the manifest only, which is A3-P2's reconciliation. **Accepted.** The pre-flight is 1245 passed, and the 1 failure is A3-R01, expected.
