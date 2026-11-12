# A key correction clears the explanations it makes stale · small C1w correction (F1-R1b)

> **Coordination record.** Owner's decision of 12 November 2026: **Option A approved.** Kept by the Chief Architect.
> A separate, bounded correction of C1w's key-correction flow, **before Z**, with Sharon's and Daisy's reviews. It
> holds no unrelated work, and is not part of F-1. It changes no part of THE PLAN.

## 0 · What holds now

1. **Rule (owner).** When a key correction changes an option's correctness, that option's stale **rationale** and
   **misconception code** are cleared **in the corrected revision**.
2. **The original sealed content and the historical evidence are preserved.** The revision that was sat keeps its
   text exactly as it was sat.
3. **The confirmation identifies the affected explanations,** and **Studio clearly indicates** that the corrected
   revision needs updated explanations.
4. **An urgent key correction is never delayed** because replacement explanations are not ready. The correction does
   not ask for them.
5. **The two-person approval rule is unchanged.**
6. **Sharon verifies the effect of cleared misconception codes on downstream reporting,** so that the absence of an
   annotation is not misrepresented as evidence of no misconception (§3).
7. **Sharon's pre-implementation review: PASS on the design** (read at
   `10b71c39018133964cafa61a3a3527f1f5ff3cbf`), **with three required design points** (§3a: downstream wording and
   marker; content checks; where the clearing is written). They govern where §2 differs.
8. **The owner's question is answered:** "not annotated" is distinguished from "none found" by **wording and a
   marker**, with **no new number and no change to any catalogue definition**.
9. **INV-03 is amended narrowly (owner, 12 Nov 2026: option A1; §3c).** An empty rationale is permitted **only**
   where a governed, two-person-approved answer-key correction has withdrawn an explanation that contradicts the
   corrected key. The option keeps a **durable reference to that correction**; the withdrawn text stays on the
   correction's **audit record**. **Enforced in the database, not merely documented.** Ordinary content creation and
   revision still require complete rationales.
10. **Sharon: PASS on the amended design** (read at `bf91ead92b3924f4e6d3aa7c688ab1a9978a29f8`), with required
    points per item (§3d). They govern where §3c differs.
11. **State: built and pushed at `97a40ebb0e52a2f0ba558418426f9fc5d71aca4b`.** Local pre-flight (engineer's report):
    1110 passed, 168 of 168 planted defects, 11 of 11 red-case groups. CI run `43189210169`: success. Journeys run
    `43189229437`: success. The Chief Architect's read is §3f. *(The earlier states, "released to the engineer" and
    "with Sharon and Daisy for their result reviews", are superseded by item 11a.)*
11a. **ACCEPTED on `97a40ebb0e52a2f0ba558418426f9fc5d71aca4b` (12 Nov 2026, 10:40 UTC).** Sharon: **PASS**, no
    blocker (her record: `claude/gracious-lamport-0m1qjr` at `1076f121fc5d6f1e2414d190f20cf9b6c1be258f`,
    `docs/coordination/reviews/sharon/F1R1B-97a40ebb0e52a2f0ba558418426f9fc5d71aca4b.md`). Daisy: **PASS** (her
    record at `a13f30ff4fe0bd53727d7af219068d35d0b1b0ae`). CI and journeys green on this commit.
    - **One page item remains, for Second Eye (Sharon, required; no code):** the completion page's "Evidence on this
      commit" still reads "to be filled". Fill it with CI `43189210169`, journeys `43189229437` and the local
      pre-flight figures. It may ride in the next commit. It is confirmed from its diff; no re-review. **The record
      closes when that is confirmed.**
    - **Register, before Z (Sharon, non-blocking):** **F1R1B-R1**, one assertion (in F13-K19 or K22) that writing a
      rationale onto a withdrawn option of the sealed corrected revision is refused and the reference stays.
      **F1R1B-R2**, the copy case trusts `items.supersedes_item_id` plus the label: if C2w or A3 lets anything other
      than the revision copy write `supersedes_item_id`, this is looked at again (carried into those batches' design
      reviews).
    - Daisy's non-blocking wording changes are listed in `TEAM-INSTRUCTIONS.md`.
11b. **CLOSED (15:36 UTC, 12 Nov 2026).** The page item is done: `F1R1B-COMPLETION.md`'s evidence section is filled
    in `e27f4a77a10c7c448170bb2851462e4561daadf7` (page only; confirmed from its diff). Nothing further on this
    correction except its register items.
12. **The repository is the baseline of record (ADR-0019, verified; §3e).** INV-03 is amended **in the repository**
    by Sharon's procedure. Any external Project copy is a downstream synchronization target, not an authority. No
    open decision remains on this correction.

## 1 · The defect

Found by Daisy in Studio during her F-1 review (`ux-1/daisy-experience` at
`34004af2f22055420b4c3b9f0473aae2dd986674`); reasoning in `C1W-F1-CORRECTION.md` §9d.

- `tegaskan_koreksi_kunci` sets `is_correct` on the corrected revision's options (`M/20270115110000…:942`) and leaves
  their `rationale` and `misconception_code` as they were authored for the old key.
- So on the corrected revision the new key can read «Ini belum tepat» and name a misconception, and the old key can
  read «Ini tepat».
- Assignments are moved to the corrected revision. Every learner who sits it afterwards can be shown a mark and,
  beside it in their result, an explanation that contradicts it.
- **Not yet rendered:** a new sitting on a corrected revision. The engineer's first red test is that sitting.
- F-1's fix in `session_review` does not reach this: it compares the key in force with the sealed option, and on the
  corrected revision they are the same.

## 2 · Design direction (for Sharon's review; the engineer proposes the exact statements)

1. **In the confirming act, in the same transaction** that writes the corrected key: for each option of the corrected
   revision whose correctness differs from the revision it supersedes, set `rationale` and `misconception_code` to
   null. Options whose correctness did not change are untouched.
2. **What was cleared is recorded on the correction** (which options, and their previous text and code), so that the
   record shows it, the preview can show it before confirmation, and an educator can see the old text when writing
   the new.
3. **The preview and the confirmation screen list the affected options** and say that their explanations will be
   removed. The second person confirms the key knowing this. No new field is required of either person.
4. **Studio marks the corrected revision** as needing explanations until each cleared option has a rationale again.
   Writing them is ordinary editing through C1w's existing draft and revision path; whether that needs a further
   revision or may be done on the corrected one is the engineer's to state from how C1w seals content.
5. **Nothing sealed is rewritten.** The superseded revision, its options, the release digest, and every result and
   response are byte-identical.

## 3 · What Sharon is asked to verify (owner's instruction, and the consequences that follow)

| # | Question |
|---|---|
| 1 | **Cleared misconception codes downstream.** After the correction, the option that is now wrong (the old key) has no misconception code. `session_misconceptions`, `service_cohort_misconceptions` and the reading map's remediation join on a code, so a learner choosing it contributes **nothing** to `class.misconceptions` and gets no remediation. A teacher reading a low or empty misconception figure could take it as "no misconception here". **How is "not annotated" distinguished from "none found"** in each of those readers and on the screens that show them? If it is not, what is the smallest honest signal (a count of wrong answers with no annotation, or a marker on the question) that needs no change of a catalogue definition? |
| 2 | **Old sittings.** Sittings on the superseded revision read their own sealed options, so their misconception evidence is unchanged, and F-1 decides what counts as wrong for them. Confirm that clearing on the corrected revision cannot reach them through any shared row |
| 3 | **Question Health and the item statistics** for the corrected revision: do any of them read `rationale` or `misconception_code`, and does a null change a state or a figure? |
| 4 | **Packages, copies and annotations.** A copy or a package made from the corrected revision carries the cleared options. C2w will place annotations beside the misconception views: an annotation that names a misconception code now absent from the option must not be left dangling (C2w is not built; this is a note for its page) |
| 5 | **Content rules.** Does any check (`soal_draf_masalah`, `lesson_package_check`, the MCQ quality run) require a rationale or a misconception on an option, so that a corrected revision would be reported as invalid, or could not be published or moved to? An urgent correction must not be refused for it |
| 6 | **A second correction of the same question** (O41-22): options whose correctness flips back. Their text was already cleared; nothing is restored automatically |
| 7 | **Immutability:** which guard today permits `tegaskan_koreksi_kunci` to write `is_correct` on the corrected revision, and does the same permission cover these two columns without widening what else may be written |

## 3a · Sharon's answers (these govern)

**1 · Cleared misconception codes downstream (the owner's row): REQUIRED, with no catalogue change.**
- "Not annotated" already exists in 4.0: `misconception_code` is optional. Clearing adds cases; it creates no new
  kind.
- `class.misconceptions` and `session_misconceptions` count only annotated wrong answers; an unannotated wrong answer
  contributes nothing to either.
- The reading map is honest already: its remediation falls back to the objective's own statement
  (`coalesce(remediation, statement)`), so a learner who chose the now-wrong old key is still sent to read the
  objective.
- **Required: wording plus a marker, not a new number.**
  - Every screen that shows a misconception figure or list words an empty or thin result as **"no recorded
    misconception"**, never "no misconception".
  - **A marker** on the teacher's per-question view and in Studio, on a question whose wrong options carry no
    annotation.
  - **No new number:** a count of unannotated wrong answers would add a value to a catalogue figure, which is a
    definition change.
  - The wording is Daisy's (§6 line 3).

**2 · Old sittings: verified.** The corrected revision's questions are new rows; `tegaskan_koreksi_kunci` copies the
head course and writes only the copied question's options, so no option row is shared with the revision that was
sat. *One consequence:* in an old sitting the old key was authored as the key and so carries no code; a learner who
chose it is now wrong and unannotated. The same "not recorded" wording covers it.

**3 · Question Health and item statistics: no effect.** They read correctness and counts, not rationale or codes.
The engineer confirms with a search of every reader of the two columns.

**4 · Packages, copies, annotations: noted.** Copies carry the nulls, correctly. **For C2w's page:** an annotation is
keyed to the option's code as it stands; one naming a code the option no longer has is refused or shown as detached,
never as attached.

**5 · Content rules: REQUIRED.**
- `soal_draf_masalah` refuses an option with no rationale (`OPTION_REASON_MISSING`), and `lesson_package_check` does
  the same on upload. **The correction path must not run these checks.** As built, `tegaskan_koreksi_kunci` steps the
  copied revision's status directly; the engineer confirms nothing in that path calls them, so an urgent correction
  is never refused for the explanations it has just cleared.
- **The same checks are the marker's teeth:** a later ordinary revision of that package cannot be submitted until
  each cleared option has a rationale again. "Explanations owed" is enforced without a new rule.
- The engineer also states: that any MCQ quality run treats a missing rationale as a finding to report, not a refusal
  to publish or to move an assignment; and whether writing the explanations needs a further revision, given that the
  corrected revision is approved and sealed when the confirmation ends.

**6 · A second correction: verified.** A flip-back option was already cleared in the revision being copied and stays
null; a first-time flip is cleared now; nothing is restored. Each correction's record holds the text it cleared.

**7 · Immutability: REQUIRED.** The `is_correct` write is made on the freshly copied revision while it is still a
draft, before the status loop takes it to APPROVED. **The two columns are cleared in the same statement or
immediately after it, before the status loop,** under the same draft permission. The sealed-content guard gains no
exception. Once approved, a direct write to either column is refused as before.

**Her tests, beyond §5:**
1. The empty state: for a corrected question, the teacher's class misconception figure and the learner's sitting
   misconceptions show the "not recorded" wording, and the marker is present.
2. The reading map: a learner who chose the now-wrong old key, on a new sitting and on an old one, is given the
   objective's statement, never empty.
3. Content checks: the correction is confirmed although `soal_draf_masalah` would report `OPTION_REASON_MISSING`; a
   later ordinary revision is refused until the rationale is written; the marker clears only then.
4. Old sittings: `session_misconceptions`, the class figure and the reading map byte-identical before and after.
5. Order: the clearing happens while the copy is a draft; after approval a direct write to either column is refused.
6. Copies and a second correction.

**Chief Architect's notes.**
- **The "not recorded" wording reaches existing screens.** Unannotated wrong options already exist in 4.0, so the
  wording corrects an existing overstatement wherever a misconception figure or list is shown, not only on corrected
  questions. It is wording only, in `src/lib/hle.ts`, and is Daisy's; it is the consistency the owner's standard asks
  for and adds no behaviour.
- **§2 point 4 is answered by her point 5:** Studio's marker and the existing content checks together are how
  "explanations owed" is shown and enforced. No new mechanism is added.

## 3b · Conflict with INV-03, found by the engineer (12 Nov 2026)

**The conflict.** `docs/rebuild/03-PINTAR-INVARIANTS.md`, INV-03: *"Every Option's rationale is non-empty. A wrong
answer is evidence of thinking; an unexplained distractor teaches nothing."* It is enforced in the database:
`item_options.rationale text not null check (btrim(rationale) <> '')` (`M/20260912112712…:261`). The approved
correction clears the rationale of an option whose correctness changed. **A null rationale cannot be stored.** The
brief and Sharon's design review both missed the column constraint; her point 5 saw only the draft check.
(`misconception_code` is nullable, so clearing it raises no conflict.)

The engineer raised this for a ruling and held F1-R1b. The question did not reach the Chief Architect until the
engineer's status of 12 Nov mentioned it.

**It is the owner's to decide,** because an invariant of the baseline is involved, and the invariants document says
its rules must remain true whatever implements them.

| Option | What is stored | Consequence |
|---|---|---|
| **A1 (recommended). Amend INV-03 narrowly** | The rationale is null **only** on an option that names the governed key correction which withdrew it (one new column, with a constraint: non-empty rationale, or a named withdrawing correction). The old text is kept on the correction's record | **No reader can show a stale explanation, because there is none to show.** This is the property F-1 was about: the defect class there was a reader serving sealed text beside a new mark. The existing draft checks then refuse any later revision until the rationale is rewritten, as Sharon's point 5 describes. Cost: INV-03 gains one stated exception, and the baseline records an amendment |
| A2. Keep INV-03 untouched; withdraw instead of clearing | The stale text stays in the column; the option is marked withdrawn; every reader that serves a rationale must withhold it when marked | The invariant's letter holds. But correctness then depends on every present and future reader honouring the mark, which is exactly how F-1 arose. It needs a new draft check and an accessor every reader must use |
| A3. Store a fixed placeholder sentence | A system sentence in an authored column | The constraint holds. Authored content then contains text no author wrote, in one language, sealed into releases and copies. Not recommended |

**Why A1.** The invariant's own reason is that an unexplained distractor teaches nothing. A distractor explained
**wrongly** teaches something false, which is worse, and A2 keeps the false text one missed reader away from a
learner. A1 states the exception honestly, bounds it to a governed, two-person, audited act, marks it, and makes the
debt enforceable. It is also what the owner's decision said in words: "clear that option's stale rationale".

**Proposed amended wording of INV-03 (for the owner's approval):** *Every Option's rationale is non-empty, except
where a governed answer-key correction has withdrawn it because it contradicted the corrected key. Such an Option
names that correction, the withdrawn text is kept on the correction's record, and no further revision of its package
may be submitted until the rationale is written.*

**How the amendment is recorded.** The invariants document already carries a dated "Baseline amendment" note, and
CI checks the frozen baseline against its manifest. The engineer and Sharon state the correct way to record an
amendment (the note, the manifest, and the owner-decisions record) so that the baseline check stays truthful.

**For Sharon, with the owner's decision:** confirm A1's constraint and that nothing else reads `rationale` assuming
it is never null (packages, copies, the canonical payload and its digest, Studio, the MCQ quality run, exports).
That search was already asked of the engineer in her point 3; it now matters more.

## 3c · The owner's decision on INV-03, and what Sharon is asked to verify (12 Nov 2026)

**Decided: A1.** As stated in §0 item 9. Options A2 and A3 of §3b are not taken.

**Design that follows (for Sharon's verification; the engineer proposes the exact statements):**

1. **One new column on the option** naming the correction that withdrew its rationale (a foreign key to
   `key_corrections`), and **one constraint replacing the present one:** the rationale is non-empty, **or** it is
   null and the withdrawing correction is named. Never an empty string; never null without the reference; never the
   reference with a rationale still present.
2. **Only the confirming act may set it.** The reference is written by `tegaskan_koreksi_kunci`, on the draft copy,
   in the statement that writes the corrected key (Sharon's point 7 of §3a). No other writer may set the reference:
   not the draft editor, not a package upload, not a copy that originates the state. A copy of a corrected revision
   carries the state it copies.
3. **Writing a rationale again clears the reference** in the same statement, through the ordinary draft path, so the
   state cannot outlive its cause.
4. **The withdrawn text is on the correction's record** (which option, its text, its misconception code), written in
   the same transaction, and immutable as `key_corrections` rows are.
5. **Ordinary creation and revision are unchanged:** `soal_draf_masalah` and `lesson_package_check` still refuse an
   option without a rationale; the correction path runs neither (Sharon's point 5).

**What Sharon is asked to verify (owner's instruction):**

| # | Point |
|---|---|
| 1 | **The database constraints.** That the exception cannot be reached except through a governed, two-person-confirmed correction: the constraint, the reference's foreign key, who may write the column, and that a direct write by any role or path other than the confirming act is refused. That the sealed-content guard still refuses any write after approval |
| 2 | **Every affected reader.** Everything that reads `item_options.rationale`, checked for an assumption that it is never null: the learner's review, Studio's package and question views, the canonical payload and its digest (so a release's hash stays well defined and reproducible), packages and exports, copies, the MCQ quality run, the draft comparison functions (`soal_beda`, `soal_beda_versi`), and any type in the application that declares it non-nullable |
| 3 | **Every affected writer.** Every path that inserts or updates an option: the draft editor, `soal_tulis_pilihan`, package ingest and materialise, `salin_kursus_revisi`, quick-assessment launch, and the correction itself. Each either requires a rationale, or carries an existing withdrawn state by copying, and none can originate one |
| 4 | **The procedure for amending the frozen invariant and its CI manifest.** `docs/rebuild/03-PINTAR-INVARIANTS.md` is in the frozen baseline that CI verifies against `BASELINE-MANIFEST.json`. What is the correct, truthful way to record this amendment: the dated "Baseline amendment" note the document already uses, the manifest's entry for the file, and the owner-decision record? The amended wording is the owner's, below |

**The amended invariant (owner-approved in substance; final wording to be confirmed with the procedure):**
*INV-03. Every Option's rationale is non-empty, except where a governed, two-person-approved answer-key correction
has withdrawn it because it contradicted the corrected key. Such an Option keeps a durable reference to that
correction, the withdrawn text is kept on the correction's audit record, and no further revision of its package may
be submitted until the rationale is written.*

**Tests added by this decision (red first):**
- A null rationale without the reference, an empty string, and a reference with a rationale present: each refused by
  the database.
- The reference set by any path other than the confirming act: refused.
- An ordinary draft, a package upload and a new revision with a missing rationale: refused as today.
- Writing the rationale clears the reference; the option is then an ordinary one.
- The release digest of a corrected revision is computed, stable and reproducible with a null rationale.
- The baseline check in CI passes with the amendment recorded as Sharon specifies, and fails if the document is
  changed without it.

## 3d · Sharon's verification of the amended design (these govern)

**1 · The database constraints.**
- Add `rationale_withdrawn_by uuid references key_corrections(id) on delete restrict`; drop the NOT NULL; one CHECK:
  a non-empty rationale and no reference, **or** a null rationale and a reference.
- **A foreign key alone does not prove the reference was earned.** A trigger on INSERT or UPDATE that sets the
  reference admits exactly two cases:
  - **the confirming act:** `koreksi_kunci_berwenang` is true for that correction (the marker names it, it is
    CONFIRMED, decided by the caller at `now()`), the option belongs to that correction's corrected copy of the
    target question, and the option's correctness differs from the option it supersedes;
  - **a copy:** the row is a copy of an option that already holds the same reference, through a verifiable lineage
    link.
  Every other path is refused: the draft editor, an upload, a direct write by any role, the service role.
- **"Writing a rationale again clears the reference" is enforced by the same trigger,** on UPDATE when a non-empty
  rationale arrives, so no writer has to remember it.
- The sealed-content guard is unchanged; after approval a write to either column is refused.

**2 · Readers.**
- **The release digest needs no change.** `content_field` writes `'~'` for null and a length prefix otherwise
  (`M/20260912124007…`), so a null rationale hashes deterministically and is distinct from any text. **Do not add the
  reference to the digest:** it is governance, not taught content. *Test:* recomputing every existing release's hash
  gives the stored value, and a corrected revision's hash is reproducible.
- `session_review` returns the rationale; a null shows no explanation, which is correct.
- **The engineer checks and states on the page:** every TypeScript type declaring `rationale` non-nullable and each
  place it is rendered; Studio's package and question views; the exports (a null becomes an empty cell that
  re-import then refuses, correctly); the MCQ quality run (reports a missing rationale, does not fail on it).
  `soal_beda` and `soal_beda_versi` already compare with `is distinct from`.
- `M/20260915120000…:499` counts options with a non-null rationale. It ran once at migration time and is not a live
  check, but it holds the old assumption and is listed.

**3 · Writers.**
- Unchanged, requiring a rationale: the draft editor and `soal_tulis_pilihan`; package ingest and materialise. The
  trigger refuses any attempt by them to set the reference.
- `salin_kursus_revisi` copies both columns; its copy is admitted only because the source option holds the same
  reference.
- **Required: each copy path keeps a verifiable link to its source option, or refuses to copy an option whose
  rationale was withdrawn.** That covers the course revision copy, and quick-assessment launch if it copies options
  (the engineer states which). No path may originate the state.
- The withdrawn text goes on the correction's record in the same transaction, append-only.

**4 · Amending the frozen invariant and its manifest** (`scripts/baseline-parity.mjs` defines the procedure):
1. **The marker.** The script reads the **first** match of `Baseline amendment (YYYY-MM-DD)`. The new dated note goes
   **at the top** of `docs/rebuild/03-PINTAR-INVARIANTS.md`, **above** the 2026-09-12 note, which stays below as
   history. Placed below, the check would still read the old date and fail.
2. **The row.** INV-03's rule becomes the owner's wording; its enforcement column becomes "DB: CHECK (non-empty, or
   null with a withdrawing correction's reference); trigger admitting the reference only from the confirming act or a
   verified copy"; its test column names the refusal cases.
3. **The manifest.** In `docs/rebuild/BASELINE-MANIFEST.json`, the entry for document 03 gets the new `sha256` and
   `bytes`, and `"baseline": "2026-11-12"`.
4. **The ADR.** An ADR in `docs/adr/`, **in the same commit**: the owner's A1 decision, why A2 and A3 were not taken,
   and the enforcement. The owner-decision record points to it.
5. **The source.** The script's comment says the repository copy must match "the authoritative" baseline. **If a
   copy exists outside the repository, the same amendment goes there,** or the next sync reintroduces the old text.
- *Test:* the parity check passes on the amendment commit, and fails if document 03 changes without the marker, the
  manifest or the ADR.

**Chief Architect's notes.**
- **Point 4.5 is a question only the owner can answer:** whether an authoritative baseline is kept outside this
  repository. If it is, the amended INV-03 must be put there by the owner or with the owner's authorization; nobody
  on the team can reach it. Put to the owner.
- **The lineage link of point 3** uses what C1w already has (`items.supersedes_item_id`, read by `riwayat_soal`) for
  the question; the engineer states how an option is tied to the option it was copied from (by label within the
  superseding question, or a column), since the trigger depends on it.
- The amendment commit changes a frozen baseline document. It is authorized by the owner's decision of 12 Nov and
  carries that decision's reference in the ADR; it is the only baseline change in 4.1 so far.

## 3e · Document authority, verified (12 Nov 2026, 05:56 UTC)

The owner pointed to the governance decision of 13 September 2026 and asked that it be verified before amending.

| Checked | Found |
|---|---|
| `docs/adr/0019-the-baseline-is-in-the-repository.md` on the work branch | Status **Accepted**, dated 2026-09-13. Its decision: "the repository becomes the single source of truth for the baseline, and that status is enforced by a manifest and a parity job rather than by convention". It states that the repository "is the baseline of record. Amendments are made here and flow outward" |
| Later ADRs (0020 to 0024) | None mentions ADR-0019, the baseline, `docs/rebuild/` or a source of truth. Nothing supersedes it |
| `docs/coordination/DECISIONS.md` | No later ruling on document authority. D-197 (9 Nov) records owner directives "approved outside the repository" by writing them into the repository, which is consistent with ADR-0019, not a counter-authority |
| `scripts/baseline-parity.mjs` | Its six assertions are those ADR-0019 lists; assertion 5 requires an ADR in the same change as a changed baseline |

**Conclusion.** The authority is unchanged. Sharon's point 4.5 of §3d is answered: there is no separate authority
to amend. If an external Project copy exists, updating it is a downstream synchronization after the repository's
amendment, and is the owner's to do or to assign; it is not part of this correction and does not gate it.

**The amendment therefore proceeds exactly as §3d point 4 sets out,** in one commit on the work branch: the dated
note first in document 03, the INV-03 row, the manifest entry, and a new ADR recording the owner's A1 decision. The
ADR takes the next free number after 0024 at the time of the commit.

## 3f · Chief Architect's read of the candidate (12 Nov 2026, 09:53 UTC)

Read-only, of `97a40ebb0e52a2f0ba558418426f9fc5d71aca4b` (one migration, `M/20270117140000…`; the invariants
document, its manifest entry and ADR-0025; screens; tests and four plants).

| Required (§3d) | As built | Standing |
|---|---|---|
| The column and the one CHECK | `rationale_withdrawn_by` references `key_corrections` with `on delete restrict`; the CHECK admits a non-empty rationale with no reference, or a null rationale with one | Met |
| A trigger that admits the reference only from the confirming act or a verified copy, and clears it when a rationale is written | `alasan_ditarik_jaga`, before insert or update: refuses an insert carrying both; clears the reference when a rationale arrives on update; otherwise requires the confirming act's marker naming that correction, or a source option (the superseded question's option with the same label) holding the same reference | Met as read; Sharon verifies |
| The withdrawn text on the correction's record | `key_corrections.penjelasan_dihapus`, added to the record's write-once fields | Met |
| Written while the copy is a draft, with the key | In `tegaskan_koreksi_kunci`, in the statement that writes `is_correct` | Met |
| A later revision refused until rewritten | **Found by the engineer:** nothing enforced it as the design assumed. A trigger on the question's status, `penjelasan_terutang_jaga`, now applies the existing "rationale missing" rule when a question moves on, with the confirming act exempt. Put to Sharon for the placement | Met, by a correction of the design's assumption |
| The baseline amendment | The dated note is **first** in `docs/rebuild/03-PINTAR-INVARIANTS.md`, above the September note; the INV-03 row carries the owner's wording; the manifest entry has the new digest, size and date. **Checked independently:** the file's SHA-256 and byte count at this commit equal the manifest's (`c57f9870…`, 21,013 bytes). ADR-0025 is in the same commit | Met |
| "Any", not "all", for the marker | Test F13-K24 with two worlds, and plant bob04-20 that flips the meaning | Met |
| A zero never stands in for a missing figure | The engineer's first version broke an existing test of that rule; the code was corrected, the test left as it was | Met |

**Nothing in this read stands in the way of the two reviews.**

## 4 · The four questions

| Question | To answer on the page |
|---|---|
| And then what? | A learner sitting the corrected revision sees a mark and no explanation for the affected options, until an educator writes one. The educator who corrected the key sees, in Studio, that explanations are owed |
| What else did that change? | §3 rows 1 to 5. The learner's result page, the reading map, the class figure, Studio's package view, copies |
| What happens when things go wrong? | A correction that fails part-way leaves the key and the explanations as they were: one transaction. A corrected revision whose explanations are never rewritten stays honest, and stays marked |
| Can it be reversed, and what survives? | The correction is superseded, never undone (C1w). The cleared text survives on the correction's record and on the superseded revision. A further correction does not restore it |

## 5 · Tests (red first)

- **The defect itself:** a new sitting on a corrected revision; the learner's result, with the disclosure opened,
  shows the mark and no contradicting rationale. Red today.
- Options whose correctness changed have null rationale and misconception code on the corrected revision; unchanged
  options are byte-identical.
- The superseded revision, its options and every result and response are byte-identical.
- The correction's record holds what was cleared; the preview lists the same options before confirmation.
- The two-person rule: unchanged tests still pass; a correction with no replacement text is confirmed.
- Studio's marker is present after the correction and absent once each cleared option has a rationale.
- Sharon's downstream cases from §3, once she has ruled.
- A second correction on the same question.

Pre-flight of THE PLAN §4.1 in full. The page carries the inventory and the next-state row.

## 6 · Wording (Daisy)

Three lines, when the engineer asks, each in Indonesian and English:

1. On the preview and the confirmation: which options will lose their explanation, and that the key is corrected now
   and the explanations are written afterwards.
2. In Studio, on the corrected revision: that these options need their explanations written.
3. If Sharon rules that a reader needs a signal for "not annotated" (§3 row 1): its wording.

On the learner's result, an option with no explanation shows none; whether anything is said in its place is Daisy's
call, together with the same question for F-1's fix.

## 6a · Daisy's wording and terms (12 Nov 2026)

Her record: `docs/coordination/ux/completion-4.1/I6-I7-JAWABAN.md` on `ux-1/daisy-experience` at
`e48c49063e3a52d657e305ed5892f1a638ec5afb`. It also holds her lines for the confirmation screen and for Studio's
corrected revision; the engineer takes those from her file.

**Two terms, kept apart.**
- **C2w's reviewer notes:** «Catatan peninjau» / «Reviewer note» (already in THE PLAN §5.4 F).
- **This correction's missing misconception code:** «belum dikaitkan dengan pemahaman keliru» / «not linked to a
  misconception»; the noun is «pemahaman keliru terkait» / «linked misconception».
- This correction never uses «catat», «catatan» or «tercatat»; C2w never uses «kaitkan» or «terkait»; **«anotasi» /
  «annotation» never appears on a screen.** A teacher meets one as a property of an option and the other as a note
  beside the question.

| Where | ID | EN |
|---|---|---|
| The option in Studio | «Pemahaman keliru: belum dikaitkan» | «Misconception: not linked» |
| Marker on the question | «Sebagian pilihan salah belum dikaitkan dengan pemahaman keliru. Jawaban pada pilihan itu tidak masuk hitungan pemahaman keliru.» | «Some wrong options are not linked to a misconception. Answers on those options are not counted in the misconception figures.» |
| An empty misconception figure | «Belum ada pemahaman keliru yang terkait dengan jawaban ini.» | «No misconception is linked to these answers yet.» |

The marker tells the teacher what a missing link does to the figures, without adding a number, which is Sharon's
requirement of §3a point 1. **On the learner's result, an option whose explanation was withdrawn shows nothing in its
place.** That also settles the remaining question of F-1 (`C1W-F1-CORRECTION.md` §0 B).

*Note on names in code:* the engineer's internal key `tanpa_anotasi` is not shown to anyone; it may stay or be
renamed, but no screen string uses the word.

## 7 · Review and order

- **Sharon, before implementation:** §2 and §3. Then one result review on the exact commit.
- **Daisy:** the wording of §6, and one result review of the confirmation screen, Studio's marker and the learner's
  result with the disclosure opened.
- **When:** its own commit, at any boundary before Z. It gates nothing. It should come **after F-1's fix**, because
  both touch what the learner's review shows.

## 8 · Log

| Date | Entry |
|---|---|
| 12 Nov 2026 (03:50 UTC) | Owner approved Option A with the conditions of §0. Brief written. Awaiting Sharon's pre-implementation review and Daisy's wording |
| 12 Nov 2026 (03:53 UTC) | Sharon: PASS on the design with three required points and six tests (§3a). Released to the engineer, after F-1's fix |
| 12 Nov 2026 (05:47 UTC) | **Held.** The engineer found that INV-03 and its column constraint forbid a null rationale. Options and a recommendation recorded in §3b; put to the owner |
| 12 Nov 2026 (05:49 UTC) | Owner: A1. INV-03 amended narrowly, enforced in the database, with a durable reference and the text on the correction's audit record. Awaiting Sharon's verification (§3c) |
| 12 Nov 2026 (05:54 UTC) | Sharon: PASS on the amended design (§3d): the CHECK and a trigger that admits the reference only from the confirming act or a verified copy; the digest unchanged; the baseline amendment procedure with the marker first, the manifest and an ADR in the same commit. Released to the engineer. One question to the owner: an authoritative baseline outside the repository |
| 12 Nov 2026 (05:56 UTC) | Owner: the repository is the single authoritative baseline (ADR-0019). Verified against the ADR, later ADRs, the decisions record and the parity script (§3e). No conflicting ruling found. The amendment proceeds in the repository |
| 12 Nov 2026 (07:29 UTC) | Daisy's wording and the two distinct terms recorded (§6a). The learner's result shows nothing in place of a withdrawn explanation |
| 12 Nov 2026 (09:53 UTC) | Candidate pushed: `97a40ebb0e52a2f0ba558418426f9fc5d71aca4b`. Read by the Chief Architect (§3f); the manifest digest verified independently. With Sharon and Daisy |
| 12 Nov 2026 (10:18 UTC) | **Daisy: PASS on `97a40ebb0e52a2f0ba558418426f9fc5d71aca4b`** (`ux-1/daisy-experience` at `a13f30ff4fe0bd53727d7af219068d35d0b1b0ae` (`TINJAUAN-F1R1B-97a40ebb.md`)). Journeys run `43189229437` success on that commit (both jobs), with CI `43189210169`. **Remaining: Sharon's result review.** Daisy's non-blocking changes ride the next commit that touches `hle.ts`: English «Misunderstanding» in three lines (her earlier «misconception» lines superseded); the teacher's per-question marker to show only when an answer in that view landed on an unlinked wrong option (in Studio "any wrong option" stays); her wording for the held step, `studio.konten.kode.content_rationale_owed`. She rendered a sitting on the corrected revision: no explanation is shown, as designed. She corrected her own F-1 record: the learner's result does show a rationale |
