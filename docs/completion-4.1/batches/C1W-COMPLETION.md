# C1w · Item workbench: completion page

**Lane C. Effort L. Review before build: Sharon and Daisy.** Status: reviewed once; open points listed under «Pre-build review: outcome». No code yet. Contains the approved C4 (revision lineage) and decisions O41-10 and O41-11.

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
| **Correct a wrong key** (O41-11) | an authorized content owner proposes; an independent second person confirms | A corrected revision of the question is published. Affected finished sittings are listed. Each gets a recomputed result that supersedes the original; the original result, the original responses and the authorization are kept and visible. Affected schools are notified |
| **Review a certificate** whose supporting result changed | an authorized person at the issuing school | The certificate is marked under review from the moment the result changes. The reviewer confirms it or revokes it, with a reason. Its history is kept either way |

## Truths (for Sharon)

- A past sitting always shows the version the learner saw. Sealed content is never edited.
- A revised question is a new row. Statistics stay per version. No comparability is claimed between versions.
- A recomputed result supersedes; it does not overwrite. Reports read the result in force and can show that it was recomputed and why.
- **Who the content owner is (owner, 11 Nov):** for a school's own content, that school's authorized content owner. For platform content distributed across schools, an authorized platform content owner. Both need independent confirmation, and the affected schools are notified.
- **Certificates after a recomputation (owner, 11 Nov):** a certificate is a formal educational claim. When its supporting result changes it is neither silently revoked nor left standing as valid. It is flagged for authorized review, its history is preserved, and **public verification says it is under review** until an authorized decision is made. One newly earned is issued by the usual path.
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
- Konfigurasi › Sertifikat: certificates under review after a recomputation, with confirm and revoke.
- The public verification page and the learner's certificate: the «under review» state.
- A notice to each affected school's admins.
- States: empty draft; validation failures (exactly one key, no empty option); sent back; awaiting the second person; nothing affected; recomputation done; refused.

## Tests: red before, green after

- Database: a draft edit is refused once submitted. A revision of one question sets every item pointer (red today on the screen path). A withdrawn release refuses a new sitting (red today). A key correction needs two different people. A recomputation leaves the original result and responses byte-identical and adds one superseding result. An unaffected sitting is untouched. A certificate whose result changed verifies as under review, not as valid, until it is confirmed or revoked; an unaffected certificate verifies as before.
- App: a typo fixed with no re-upload; the history chain; the correction by two signed-in people.
- Journey: author → reviewer → publish → class sits → wrong key found → corrected and confirmed → results recomputed → the teacher's report shows the result in force and its note.

## Out of this batch

Misconception annotations (C2w). AI drafting (C3w). Scheduled question-health statistics (4.2). Retiring a single question without a revision. Schools adapting platform content.

## Pre-build review: outcome (11 Nov)

One review each, at `2560494a`. Daisy: `docs/coordination/ux/completion-4.1/TINJAUAN-A1-C1W.md` (branch `ux-1/daisy-experience`, `a2420446`). Sharon: her addendum response of 11 Nov, and her first reading at `3370643a`.

**Settled, and now part of this page:**

| Point | From | Decision |
|---|---|---|
| The content owner of a school's content (blocker) | Sharon | A role scoped inside that school. Platform admins are excluded from a school's content |
| The confirmer of a key correction (blocker) | Sharon | A different person holding CAN_PUBLISH or CAN_REVIEW in the same tenant |
| The certificate under review (blocker) | Sharon | An append-only `certificate_reviews` side record, not a new status value; sealed payloads are untouched. `verify_certificate` returns DITINJAU while a review is open. DICABUT and DIGANTIKAN take precedence |
| «Ditarik» (C1-B2, blocker) | Daisy | Teachers and learners never see «Ditarik» for a release its publisher withdrew. They see «Dihentikan penerbit · tidak dapat dimulai lagi; hasil tetap dihitung». «Ditarik» stays inside Studio |
| The draft editor | Daisy | Inside «Soal dalam paket ini», one question at a time, errors summarised at the top, each save attributed. «Tambah soal», «Hapus soal», «Buang draf ini» |
| A question's history | Daisy | «Riwayat soal (n versi)», newest first, changes said in words. No statistic across versions |
| The key correction | Daisy | «Perbaiki kunci jawaban», three steps, with exact counts computed by the recompute rule. For platform content, other schools appear as counts only. The proposer sees no confirm button |
| «Sedang ditinjau» | Daisy | A third, neutral status on public verification and on the learner's certificate, never the mark of «Berlaku». No school reason shown publicly. Printing stays available. Konfigurasi › Sertifikat gains «Sedang ditinjau (n)» |
| The notice to affected schools | Daisy | A line in Konfigurasi's «Yang menunggu» until every certificate is decided |
| States to add | Daisy | Her six: two authors on one draft; a re-upload over in-app edits; a correction on a withdrawn release; a correction that changes nothing; a confirmation refused for lack of authority; a decided certificate affected again |

**Open before build:**
- **C1-B1 (Daisy, blocker):** what the learner's result page shows after a key correction, the recalculated result or the sealed original. 4.0 shows the original and says the certificate is unchanged, which O41-19 makes false. Both notes are rewritten once this is settled.
- Sharon's first reading at `3370643a`: C1W blockers 1 (D11, one recalculation per sitting), 2 (the scoring basis), 3 (stop new sittings on a wrong key) and 4 (validate the identity column). Her text is not yet in this record; blocker 2 is expected to settle C1-B1.

Non-blocking points are in `EXECUTION-PLAN.md` §5.

## Questions

**For Sharon:**
1. Question identity on the upload path. Proposal: the workbook gains an optional identity column; a re-upload with it links each question to its original, and one without it is treated as all new questions. Is "all new" the right fail-closed default?
2. Reusing `create_course_revision` for a one-question revision: are its immutability and lineage guarantees sufficient as they stand?
3. *(Ruled by the owner; see Truths.)* The remaining design point: which existing capability marks the content owner at each level. Proposal: CAN_PUBLISH on the content's own tenant, with the confirmer a different holder.
4. *(Ruled by the owner; see Truths.)* The remaining design point: «under review» as a certificate state the public verification function returns, without disturbing sealed certificate payloads.

**For Daisy:**
5. The draft editor's shape inside the existing package page, and how the history chain reads.
6. The key-correction flow: the affected list, the second person's step, and the teacher's and learner's notes.
