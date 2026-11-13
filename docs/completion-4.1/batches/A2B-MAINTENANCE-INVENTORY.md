# A2b · Work-scoped planned maintenance: the eight operations, inventoried (read-only)

**Source:** `THE-PLAN-ADDENDUM-1.md` §5d, R-1 (owner, 12 Nov), its feasibility work, and Sharon's answer to the
eight operations. Read at `e7723882e73079632442fb5d1e62d140da10eabf`, against the code at
`b21bec621a449e8d4d90ed646f7fb09c15dfc6f9`. **This page confirms or corrects her answer, as the addendum asks, before
A2b is built.** Read from the code of `claude/system-integrity-4.0` at `bfe949b11935763a8c8ed7b91f4adcdbcea93645`.
**Nothing is built.**

## What holds now

- **No operation is "cannot be safely scoped".** Nothing goes to the owner from this inventory.
- **Sharon's principle holds.** For a work-scoped PLANNED window, the refusal moves from the request (the person) to
  the writers of that work (the object). EMERGENCY stays person-level in the request hook, with D6 in full.
- **Three rows are confirmed as she wrote them (3, 5, 6).** One row needs a correction (2). Four rows are incomplete
  (1, 4, 7, 8): what she wrote holds, and the build must also do what each row below adds.
- **One thing does not exist yet: no writer-enumeration test.** Her row 4 relies on "the place question joins A2a's
  D6.2 writer-enumeration test". D6.2 is A2a's to build. Until it exists, A2b's completeness has no guard. A2a's page
  carries it (`A2A-COMPLETION.md`).
- **For Sharon:** please confirm the correction to row 2 and the four additions. Questions are at the end.

## The shared piece, as it will have to be built

`maintenance_affects_place(node, at)`, from her answer: true when an active (or, for starts, approaching) PLANNED
window scopes this node or an ancestor at school or class level.

**What the windows table can express today:** `maintenance_windows` stores `platform boolean` and
`institution_ids uuid[]`, with `check (platform or cardinality(institution_ids) > 0)`
(`20261120100000_maintenance_is_announced_and_drains.sql`). **No column can name a class node.** So the place
question needs a new column (for example `node_ids uuid[]`, or one node), and `schedule_maintenance`, `change_maintenance`,
`maintenance_collisions` and `maintenance_may_act` all need to accept it. That belongs to A2a: its class scope is for
EMERGENCY only (row 8 below).

## The eight operations

| # | Operation | Sharon | Inventory | What the code shows, and what the build adds |
|---|---|---|---|---|
| 1 | The request-level block | Scoped, by removal: the hook keeps person-level only for EMERGENCY (any scope) and PLANNED at platform scope | **Incomplete** | The hook is `pintar_permintaan.periksa()` with `maintenance_block_for_me()` and `maintenance_affects(w, person)`. Removing class and school PLANNED windows from it is right. **Also, on the client:** `src/components/pemeliharaan/PengingatPemeliharaan.tsx` sends the browser to the pause page itself (`window.location.replace(HALAMAN_PEMELIHARAAN)`, lines 33 and 48) whenever a window is running and the person does not control it. For a work-scoped window it must not, or the banner-only rule of row 7 fails on the client while the hook is right. **And** every reader that maps PT503 to the pause page (`src/proxy.ts` line 144, `src/app/belajar/actions.ts` line 196, `src/lib/galat-kontrak.ts`) assumes PT503 means "you are stopped". A work-scoped refusal of a write must answer with its own code, not PT503 |
| 2 | Starting work | Scoped: the sitting-insert trigger asks the place question, with D4 in the same trigger; `may_start_assessment` the same answer for the screen; lesson progress refused by a trigger asking the same question | **Correction** | The sitting trigger is `assessment_sessions_zz_no_new_sitting_in_maintenance` (`enforce_no_new_sitting_in_maintenance`): right place, and it covers every start path. **Two corrections:** (a) `lesson_progress` has **no class or assignment column** (`person_id`, `lesson_id`, `plp_release_id`, `institution_id` only), so "lesson progress takes its assignment's place" cannot be read from the row. The guard has to sit in `record_lesson_progress`, which knows the assignment it is called for, or the row needs the assignment. A trigger on the table alone cannot ask the place question. (b) `may_start_assessment` (latest in `20261229100000_the_mastery_check_waits_for_the_mapping.sql`) has **no maintenance check at all** today. "Gives the same answer" is a new check, not a change to one |
| 3 | A running sitting | Not applicable as a block; continues to deadline plus grace (D5) | **Confirmed** | `maintenance_draining(person)` remains only on the person-level paths. Nothing in a running sitting asks for the class |
| 4 | Staff acts on the class's work | Scoped, each classed on A2b's page; refused: assigning, schedule changes, A1's extend and resume, teacher endings, `akhiri_penugasan`; allowed: departure, transfer, key-correction move, certificate acts | **Incomplete** | Her list is right as far as it goes. **Writers she does not name,** each of which writes sittings, assignments or progress for a class: `launch_quick_assessment` (a quick assessment is a new assignment and new sittings); `move_learning_assignment_release` (an assignment's release moved); `minta_percobaan` and `putuskan_percobaan` (a further attempt requested and granted, `20270114100000_…`); `kenaikan_tetapkan` (a class moves up, which ends and makes enrolments and assignments, `20270112210000_…`). Each must be classed. **The closer and the ending acts must pass:** A1's scheduled closer and the endings that finish work must not be refused by the place guard, or a window would keep work open past its end. **`koreksi_kunci_pindah` spans classes:** one key correction moves assignments in every class that sat the item. Allowing it is right (it changes only new starts), but the page must say that it is allowed in a class under maintenance because it starts nothing, not because it is outside the class |
| 5 | Cross-context writes | Scoped by construction: the guard is per object | **Confirmed** | A guard on the object asks only that object's place. A teacher of 7A and 7B is refused only on 7A's work |
| 6 | Background writes | Unaffected; no background job starts new work | **Confirmed** | The closer, finalization and the purge make no requests. No scheduled job inserts a sitting or an assignment. The enumeration test (row 4) is what keeps it so |
| 7 | The status read and warnings | Scoped: returned only to people with work in that place, naming the class; no PT503; no redirect | **Incomplete** | The status read is `pintar_status_saya()`. It decides who is told with `maintenance_affects(w, person)`, which is person-level. It needs the place question per class the person has work in. **And the client redirect of row 1:** `PengingatPemeliharaan` acts on the status read, so the status read must also say "work-scoped" so that the client shows the banner and does not redirect |
| 8 | School and platform scope | School: the same, one level up (option A, decided). Platform: person-level remains correct | **Incomplete** | Right in principle. **What the code adds:** a school-scoped window is `institution_ids`, and `maintenance_affects` refuses every request of a person enrolled at any of them, which is the pre-existing defect. Moving school-scoped PLANNED windows to the place guard is the same change as row 1. **And between A2a and A2b:** `schedule_maintenance(p_platform, p_institutions, …)` takes no class node today. The rule "it refuses a class node unless the kind is EMERGENCY" therefore arrives with the node column in A2a; A2a's page states it and tests it |

## Questions for Sharon (from the engineer, by name)

1. **Row 2a.** For lesson progress: the guard in `record_lesson_progress` (it knows the assignment), or an assignment
   column on `lesson_progress` and a trigger? The first adds no column. The second covers a later writer.
2. **Row 4.** Do you agree with the classing of the five writers above: `launch_quick_assessment`, `move_learning_assignment_release` and `kenaikan_tetapkan`
   refused; `minta_percobaan` refused and `putuskan_percobaan` allowed only to refuse, not to grant?
3. **Row 1.** Which code does a work-scoped refusal answer with? A new one, so that no reader of PT503 sends the
   person away.
