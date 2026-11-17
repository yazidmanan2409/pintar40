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

## Addendum, 17 Nov 14:35 UTC: the build at `5b34fa5f` on `claude/c2w`

**What I read:**
- migration 20270121110000 at `5b34fa5f`: the table, the indexes, the triggers, the chain walk and `catatan_peninjau_tulis`;
- the diff `b4177078..fde309c5` on that file;
- `CatatanPeninjau.tsx`'s strings, and `studio.catatan.petunjuk`.
- **The pre-flight, as reported:** suite 1242 passed and 0 failed, plants 175/175, red cases 11/11.

**D1 to D3 are met.**
- **D1, the concurrency rule:**
  - a partial unique index `catatan_peninjau_satu_awal` on (`item_id`, `opsi_label`) where `menggantikan_id is null`, beside `…_satu_pengganti`;
  - a transaction advisory lock per item and option before the current-note read;
  - the named refusals NOTE_EXISTS and NOTE_NOT_CURRENT, including when the unique index fires;
  - the race test C2W-D1R on two connections, for both cases.
- **D2:** the trigger on insert refuses NOTE_OWNER_MISMATCH and NOTE_NOT_SEALED, and refuses every update, delete and truncate.
- **D3:** the walk is capped at 64 deep, guards against cycles through `jalur`, stays within one owner, and uses the existing index on `items.supersedes_item_id` (20260915120000).
- **The rest, accepted:**
  - the metric-source trigger refuses the table;
  - every function is revoked from client roles;
  - the writer rule is CAN_REVIEW in the school, or, for library content, the library's reviewers or the platform admin;
  - the write is audited;
  - a library note does not show its writer's name.

**`fde309c5`, the edit to the migration, is accepted:**
- the one change is a `orang_lampiran` row classing `catatan_peninjau.ditulis_oleh` as BEBAS, an act's actor, with `on conflict do nothing`;
- L1F4-E01 is green again;
- ~~correcting it in the draft migration, not in a new one, is right, since it is unpushed to staging.~~ *Corrected, 14:45 UTC: `fde309c5` was pushed to `claude/c2w` with `5b34fa5f`. Editing the migration in place is still right, because it has not been promoted to staging.*
- *The miss is noted as Second Eye's own:* `b4177078` went out on targeted runs only.

**D4: half met. One requirement remains.**
- **Rendering is met:** C2W-B3 shows `<b>markup</b>` rendered as `&lt;b&gt;` text.
- **The statement is not met.** `studio.catatan.petunjuk` says the note is about how learners think, and that learners never see it. **It does not say that a note must never name a learner.**
  - Library notes cross schools, and school notes are read by the school's authors.
  - **Add Daisy's sentence to that hint, for example: «Jangan menyebut nama murid.»** Then K01's word-for-word test picks it up.
  - **Required before C2w's freeze.**

**Second Eye's two questions:**
1. **NOTE_NOT_ALLOWED on a question the reader can already read, with Daisy's "only a reviewer at the school that owns this question …": no leak. Keep it.** The reader already sees the question and its owner. The sentence tells them nothing new, and it is more helpful than the generic one. An unknown or unreadable item never reaches the form, and the function answers it as before.
2. **NOTE_LIBRARY_CONTENT to any school's reviewer on a library question: acceptable.** That reviewer can read the released question, and "library content is noted by the platform's reviewers" is a fact about the library, not about anyone.

**The mapping is accepted:** the codes no form can reach go to `galat.action_not_allowed`, and an unnamed failure gets the "not saved" sentence plus a logged reference.

## Addendum, 17 Nov 14:45 UTC: D4 met (`12943afa`)

- **The form's hint now carries Daisy's §8.2 sentence as its second sentence:** «Jangan menyebut nama atau data murid mana pun.» / «Do not name any learner or include any learner's data.»
  - C2W-K01 checks it word for word, in both languages, and was red first at `545a1b7f`.
  - **D4 is met.**
- **Daisy's §8.3:**
  - in Studio, the note on the version on screen comes first;
  - beside the class report, one note per question and option is shown, the newest version's (`catatanGuru`, a pure function, executed in K01).
  - There is no database change.
- **The pre-flight, as reported:** suite 1242 passed and 0 failed, plants 175/175, red cases 11/11.
- **D1 to D4 are all met.** The C2w candidate comes to me for my freeze checks: the preservation pair restated with the notes table, and my lines 65 to 68 kept.
