# C1w · Item workbench: completion page

**Lane C. Effort L. Review before build: Sharon and Daisy.** Status: awaiting that review. No code yet. Contains the approved C4 (revision lineage) and decisions O41-10 and O41-11.

## Why

Verified in the 4.0 code:
- Authoring is workbook upload only. The Bank states that nothing there writes a question.
- An unreviewed draft cannot be edited or discarded.
- `items.supersedes_item_id` exists and is immutable and acyclic, but only `create_course_revision` sets it, and no screen calls that. The upload path, the only one with a screen, sets no item pointer.
- A published correction does not replace its predecessor: both stay published.
- Withdrawing a release does not stop already-assigned classes from starting new sittings.
- `recompute_result` is platform-admin only, has no screen, and re-scores against the same sealed key.

## Operations

| Operation | Who | Result |
|---|---|---|
| **Edit a question in a draft**: stem, options, key, rationale, misconception code, objective | the author (CAN_DRAFT), before submission or after it is sent back | Saved in the app. No re-upload |
| **Add or remove a question** in a draft; **discard** a whole draft | the author | As above. A discarded draft leaves an audit row and no content |
| **Upload a workbook**, as today | the author | Unchanged, and each question now receives a stable identity |
| **Revise one question** of a published package | the author | A new revision of the package in which that question is new and points to its original; every unchanged question points to its own original. Through review, approval, lock and publish as today |
| See a question's **history** | authors and reviewers | Studio shows the chain: each version, who revised it, when, in which release |
| **Publish a correction** | CAN_PUBLISH, second person as today | The corrected release replaces its predecessor for new assignments. The predecessor is marked replaced |
| **Withdraw a release** | CAN_PUBLISH | No class can start a new sitting on it (O41-11). Open sittings finish. Finished results stay |
| **Correct a wrong key** (O41-11) | an authorized content owner proposes; an independent second person confirms | A corrected revision of the question is published. Affected finished sittings are listed. Each gets a recomputed result that supersedes the original; the original result, the original responses and the authorization are kept and visible. A mastery decision or certificate that changes is flagged for the school, never silently altered |

## Truths (for Sharon)

- A past sitting always shows the version the learner saw. Sealed content is never edited.
- A revised question is a new row. Statistics stay per version. No comparability is claimed between versions.
- A recomputed result supersedes; it does not overwrite. Reports read the result in force and can show that it was recomputed and why.
- **Certificates after a recomputation:** one that would no longer be earned is not revoked automatically. It is listed for the school admin, who revokes or keeps it with a reason. One newly earned is issued by the usual path.
- A learner sees a neutral «dihitung ulang» note, as 4.0 already words it.

## Refused

- Editing any question in a sealed or published release.
- The author approving their own correction; the proposer confirming their own key correction.
- A recomputation for a sitting not affected by the corrected question.
- AI provenance fields: none in this batch. The draft state is built so C3w can add them.

## History kept

Every edit of a draft is attributed (who, when). Every revision, publication, withdrawal, key correction, confirmation and recomputation writes an audit row. Original results and responses are never deleted.

## Screens and states

- Studio › package: a question editor for drafts; discard; «Riwayat» per question.
- Studio › package: «Koreksi kunci» with the list of affected sittings and the second person's confirmation.
- Konfigurasi › Sertifikat: certificates flagged after a recomputation.
- States: empty draft; validation failures (exactly one key, no empty option); sent back; awaiting the second person; nothing affected; recomputation done; refused.

## Tests: red before, green after

- Database: a draft edit is refused once submitted. A revision of one question sets every item pointer (red today on the screen path). A withdrawn release refuses a new sitting (red today). A key correction needs two different people. A recomputation leaves the original result and responses byte-identical and adds one superseding result. An unaffected sitting is untouched.
- App: a typo fixed with no re-upload; the history chain; the correction by two signed-in people.
- Journey: author → reviewer → publish → class sits → wrong key found → corrected and confirmed → results recomputed → the teacher's report shows the result in force and its note.

## Out of this batch

Misconception annotations (C2w). AI drafting (C3w). Scheduled question-health statistics (4.2). Retiring a single question without a revision. Schools adapting platform content.

## Questions

**For Sharon:**
1. Question identity on the upload path. Proposal: the workbook gains an optional identity column; a re-upload with it links each question to its original, and one without it is treated as all new questions. Is "all new" the right fail-closed default?
2. Reusing `create_course_revision` for a one-question revision: are its immutability and lineage guarantees sufficient as they stand?
3. Who is "an authorized content owner" for a school's own content, and for platform content distributed to many schools? For platform content, a correction recomputes results in every school that used it.
4. The certificate rule above: flag and let the school decide. Acceptable for evidence integrity?

**For Daisy:**
5. The draft editor's shape inside the existing package page, and how the history chain reads.
6. The key-correction flow: the affected list, the second person's step, and the teacher's and learner's notes.
