# A2b · Planned maintenance, work-scoped: the reason list, extend and resume early, "cannot finish before the window", the school's zone

> **DRAFT, design stage.**
> - **Nothing is built.** A2b follows A2a, and A2a is not built until the staging checkpoint passes.
> - Written while the checkpoint's clean-up commit was in pre-flight (Bob, 13 Nov: "work in parallel"). Committed as
>   documentation only, for Sharon's pre-build review and Daisy's words and screens: they answer the questions below.
> - **Focused checks for a documentation-only commit** (the owner's ruling, 13 Nov; every changed path is a `.md`
>   under `docs/`), run before the commit, then full CI and journeys after the push:
>   1. `git diff --cached --name-only | grep -vE '^docs/.*\.md$'` must print nothing (documentation only);
>   2. `npm run -s guard:scan` (the sensitive scan, whole tree);
>   3. `npm run -s lint`;
>   4. `git diff --cached -U0 | grep -nE 'claude-(opus|sonnet|haiku|fable)'` must print nothing (no model identifier).

## What governs it

- **THE PLAN §5.3:** A2's D2 (the reason list), D3 (extend and resume early), D4 ("cannot finish before the window")
  and D8 (warnings in the school's zone), with §5.3's B (scope), E (educational semantics) and the transaction rules.
- **Addendum 1:**
  - **§5a**, the split of A2 and Sharon's three conditions. A2a owns every path that ends an EMERGENCY. A2b's extend
    and resume early apply to PLANNED windows only. A2b lands before A3.
  - **§5d R-1** (owner, 12 Nov): **planned maintenance is work-scoped**, for class-scoped and school-scoped windows
    alike. EMERGENCY stays person-level, with all of D6. Platform-wide planned maintenance is unchanged.
- **The eight-operation inventory** (`A2B-MAINTENANCE-INVENTORY.md`) and **Sharon's rulings on it**
  (`A2B-INVENTORY-55fb9b9b….md`, `claude/gracious-lamport-0m1qjr`):
  - the place guard in `record_lesson_progress`, with no new column;
  - the classing of every writer;
  - a work-scoped refusal is `PR040` with its own detail, never `PT503`;
  - the status read says person-level or work-scoped, and the client redirects only for person-level;
  - the place guard takes no person or account lock.
- **Daisy's wording direction** (`I6-I7-JAWABAN.md`, `ux-1/daisy-experience` at `e48c4906…`). Her words and screens for
  A2b, at the design stage, are in hand (Bob, 13 Nov).
- **TEAM-INSTRUCTIONS, "Before any correction is built":** the five questions below are answered before the build;
  each touched column and table is listed with its constraints and invariant.

## What A2b builds

| # | What | Where |
|---|---|---|
| 1 | **The place guard.** `maintenance_affects_place(node, at)`: true when an active PLANNED window, or one approaching (for starts), scopes this node or an ancestor at class or school level. One indexed read, skipped entirely when no such window is open | New function; reads `maintenance_windows`, including A2a's class-node column, and the node tree |
| 2 | **The request hook loses class- and school-scoped PLANNED windows.** It keeps person-level refusal only for EMERGENCY (any scope) and PLANNED at platform scope (R-1; inventory rows 1 and 8) | `pintar_permintaan.periksa`, `maintenance_affects`, `maintenance_block_for_me` |
| 3 | **Every writer of a class's work asks the place question.** Classed from A2a's D6.2 writer enumeration as **refused**, **allowed** or **system closure**. The enumeration fails on an unclassified writer (Sharon) | The writers in the table below |
| 4 | **Starting work:** the sitting-insert trigger asks the place question, with D4 in the same trigger; `may_start_assessment` gives the same answer for the screen (a new check: it has none today); lesson progress is guarded in `record_lesson_progress` | `enforce_no_new_sitting_in_maintenance`, `may_start_assessment`, `record_lesson_progress` |
| 5 | **D4 · "cannot finish before the window."** At start, if start plus the sitting's duration falls after the `starts_at` of a planned window that reaches this work, the start is refused with a designed code naming that start. T−15 stays. A sitting with no duration is refused only inside T−15, as today | The sitting-insert trigger |
| 6 | **D2 · the reason list.** `reason_code`, one of `ROUTINE`, `UPDATE`, `FAULT_REPAIR`, `NETWORK_POWER`, `OTHER`. The free text is required only for `OTHER`. Existing rows keep their text and get no code | `maintenance_windows`, `schedule_maintenance`, the scheduling screen |
| 7 | **D3 · extend and resume early, PLANNED only.** One act changes `ends_at` of a window that has not ended: later (extend), or now (resume early, the existing `AKHIRI`). An audit row with before, after and reason. **An EMERGENCY window is refused**, or routed to A2a's fenced lift (§5a, condition 1). **Decided (the Chief Architect, 13 Nov): extend gets its own function**, `perpanjang_pemeliharaan`, on three conditions. (a) It is the only writer of a planned window's `ends_at`, apart from the listed ones (`schedule_maintenance` at insert, and `change_maintenance`'s `AKHIRI` and cancel). (b) The older path refuses that change: `change_maintenance` refuses any later `ends_at`. (c) It is in A2a's writer enumeration. A test enumerates every function that writes `maintenance_windows.ends_at` and fails on one not in that list | `perpanjang_pemeliharaan` (new); `change_maintenance` |
| 8 | **The work-scoped refusal:** `PR040` with detail `MAINTENANCE_PLACE`, naming nothing but the place. Never `PT503`, so no reader sends the person to the pause page | The guarded writers; `src/lib/galat-kontrak.ts` |
| 9 | **The status read** returns, per window, whether it is person-level or work-scoped, the class or school it names, and the school's zone (D8). `PengingatPemeliharaan` redirects only for person-level windows, and shows the banner for work-scoped ones | `pintar_status_saya`, `PengingatPemeliharaan.tsx`, `src/app/pemeliharaan/page.tsx` |
| 10 | **D8 · every time in the school's zone,** named (WIB, WITA, WIT). A platform-wide window shows each reader their own school's zone. No polling is added | `jamWib(…)` replaced by a zone-aware formatter that reads `institutions.zona_waktu` (`20270112195000`) |

### Every writer of a class's work, classed (Sharon's rulings; inventory row 4)

Final list: **A2a's D6.2 enumeration, with the attributes both batches need**. This is the classing as ruled; the
enumeration adds any writer not named here and fails until it is classed.

| Writer | Class | Why |
|---|---|---|
| The sitting-insert trigger (every start path) | **refused** (place + D4 + T−15) | A start is new work |
| `may_start_assessment` | **refused** (the same answer, for the screen) | It must not offer what the trigger refuses |
| `record_lesson_progress` | **refused, quietly** (its own code, no redirect; reading stays open) | Progress is the class's work |
| Assigning (the assigning functions, named by the enumeration), schedule changes (`ubah_jadwal_penugasan`) | **refused** | Routine staff change to the class's work |
| A1's extend and resume (`tambah_waktu_pengerjaan`, `lanjutkan_pengerjaan`) | **refused** | Staff change to running work |
| A teacher's early end (`akhiri_pengerjaan`), `akhiri_penugasan` («Akhiri», «Tarik») | **refused** | Staff-initiated endings (Sharon) |
| `launch_quick_assessment` | **refused** | A new assignment and new sittings |
| `move_learning_assignment_release` | **refused** | Routine staff change |
| `kenaikan_tetapkan` | **refused, as a whole act** | If any class it touches is under an active planned window, nothing is promoted; never partial |
| `minta_percobaan` | **refused** | A further attempt is new work |
| `putuskan_percobaan` | **decline allowed; grant refused** | A pending request may be closed; nothing new is opened |
| `koreksi_kunci_pindah` | **allowed** | It changes only what new starts use, and it is an integrity correction across classes (not because it is outside the class) |
| Departures, transfers (`akhiri_pendaftaran`, `transfer_execute`), certificate acts | **allowed** | A person leaving or moving is not the class's work being changed |
| A1's scheduled closer (`pengerjaan_tutup_terjadwal` → `pengerjaan_putus_tenggat`), finalization, the drain's own end | **system closure: passes** | A window must never keep work open past its end |

## The five questions (answered before the build)

### 1 · What else reads or writes this state?

**`maintenance_windows`.**
- **Writers:** `schedule_maintenance` (insert), `change_maintenance` (start now, end, cancel), `stop_pintar_now` (insert
  EMERGENCY; A2a's), and `maintenance_record_edges` (the activation and deactivation marks, `for update skip locked`).
  A2b adds the extend path and `reason_code`; A2a adds the class-node column.
- **Readers in the database:** `maintenance_affects`, `maintenance_block_for_me`, `maintenance_draining`,
  `maintenance_collisions`, `maintenance_controls`, `maintenance_may_act`, `maintenance_list`, `maintenance_state`,
  `pintar_status_saya`, `pintar_permintaan.periksa`, the sitting-insert trigger; **new:** the place guard and every
  guarded writer.
- **Readers outside the database:**
  - the banner `PengingatPemeliharaan`, the pause page and the scheduling screen in Konfigurasi;
  - `src/proxy.ts`, `src/app/belajar/actions.ts` and `src/lib/galat-kontrak.ts` (they map `PT503`; they must never
    see `MAINTENANCE_PLACE`);
  - the restore facts (`audit/restore/fakta.sql`, table rows by hash, unaffected);
  - the preservation query of any later promotion (a new column is outside `to_jsonb` minus the added columns, to be
    named there).

**The work the guard protects:** sittings, assignments, lesson progress and attempt requests, through the writers in
the table. Their own readers are unchanged: a refused write writes nothing.

**Neighbouring state:**
- `institutions.zona_waktu` (D8) is read at render time.
- `assessment_definitions` duration (D4) is read at start.
- A1's held state is not touched: planned maintenance never holds a sitting (§5.3 E).

**A3** changes the same start path later; A2b lands first (§5a, condition 3).

**Constraints and invariants of what is touched:**
- **`maintenance_windows`:** `check (platform or cardinality(institution_ids) > 0)`, extended by A2a for the node
  column; `check (ends_at is null or ends_at > starts_at)`, which extend respects; `reason` 1–300 characters (kept;
  `reason_code` added, nullable for old rows; for `OTHER` the text is required). RLS on, no client grant.
- **Sittings:** INV-04/INV-29 (a sitting records its course's release, `enforce_session_release_is_its_course`),
  unchanged.
- **Lesson progress:** written by `record_lesson_progress` only, which a static and database check enforces (Sharon).
- Invariant numbers are taken from `docs/rebuild/03-PINTAR-INVARIANTS.md` at the build.

### 2 · The opposite and neighbouring act

- **Extend ↔ resume early.** Both change only `ends_at` of a window not yet ended, each audited with before and after.
  Resume early is the existing `AKHIRI`.
- **Ending a window lifts every place refusal at once.** The guard reads `ended_at` and `ends_at`; no state is
  written on the work, so nothing needs undoing.
- **EMERGENCY:** extend and resume early refuse it. Its only end is A2a's fenced lift (§5a, condition 1). The test:
  every function that sets `ended_at` on an EMERGENCY window takes the fence (A2a's enumeration).
- **Cancelling a planned window before it starts** is the existing `change_maintenance` cancel; its audit is
  unchanged.
- **A refused write and its retry:**
  - the refusal writes nothing, so a retry after the window is a fresh act;
  - lesson progress refused during a window is not queued (reading stays open);
  - whether the reader says "progress is not being saved" is Daisy's.
- **D4 and the drain:** D4 refuses only a start. A sitting already running drains as today (D5): its learner works
  on to its deadline plus grace, and the closer ends it.
- **The same person in two places:**
  - a teacher of 7A and 7B, refused only on 7A's work;
  - a person at two schools, refused only at the school whose window it is (R-1, option A);
  - a platform-wide planned window stays person-level, for everyone.
- **A class window overlapping its school's window:** `maintenance_collisions` treats them as overlapping (THE PLAN
  D1), so the scheduler is told.

### 3 · Which locks, in what order, and who else takes them?

- **The place guard takes no row lock** (Sharon). It reads `maintenance_windows` and the object's place inside the
  writer's own transaction. So it adds nothing to the person-before-account order, and nothing to A2a's fence order:
  person → accounts → fence → sittings in id order.
- **Extend and resume early:** take the window's row `FOR UPDATE` (as `change_maintenance` does today), check that its
  kind is PLANNED and it has not ended, write `ends_at` and the audit row, and commit. They take no person, account,
  fence or sitting lock, and no other window's row.
- **`maintenance_record_edges`** takes window rows `for update skip locked`. An extend holding a window's row makes
  the edge recorder skip that window for that run; the next run records it. **To verify at the build:** a skipped
  edge is recorded late, never twice.
- **Who else takes the window row:** `change_maintenance` (start, end, cancel). Two such acts on one window serialise
  on its row.
- **The race a place guard has:**
  - It reads windows at its statement's time (READ COMMITTED). A write that commits just before a window becomes
    active is allowed. One that starts after is refused.
  - For PLANNED windows, announced at least 60 minutes ahead, that is acceptable and is stated. It is not EMERGENCY's
    guarantee, which is A2a's fence.
  - **To test:** a write racing the window's `starts_at` either commits before it or is refused; never half.
- **`kenaikan_tetapkan`:** its "refused as a whole act" check reads every class it touches before it writes anything,
  in the same transaction.

### 4 · How is "before" told from "after"?

- **A window's state** is told by `starts_at`, `ends_at`, `ended_at` and `activation_recorded_at`, never by a clock on
  the client. Extend and resume early write their before and after in the audit row.
- **Old windows** (before A2b) have `reason_code` null and keep their text. Every reader shows the text when the code
  is null. A test covers a pre-A2b row.
- **A scope that changes:** a window's scope is never changed after it is scheduled (as today). A new scope is a new
  window. So "which work did this window govern" has one answer.
- **D8:** times are stored in UTC and rendered in the reader's school's zone at render time. A school whose zone
  changes after scheduling shows the new zone; the stored instant is the same. Stated.
- **The client's timers:** the banner fires its 60/30/15-minute stages from one status read. After an extend or a
  resume early, the next status read carries the new end (THE PLAN D3).
  - **To decide with Daisy:** does each stage re-read before it shows, so that a stale stage never shows?
  - My proposal: yes, one read per stage, which adds no polling.
- **A refused write** leaves no row, so "before" and "after" a window are the same rows for that work. The audit of
  the refusal is the access log, not a row.

### 5 · Who runs each check, with what access, and where does it render?

- **Who acts:**
  - **school admins** schedule, extend and resume early for their own school or classes (`maintenance_may_act`);
  - the **platform admin** acts for the platform;
  - EMERGENCY is A2a's (the platform admin, with the typed phrase).
- **Tests, red first:**
  - **database suites:** M148 extended, plus new ones for the place guard, D4, the reason list and extend/resume;
  - **the writer enumeration from A2a's D6.2:** it fails on an unclassified writer;
  - **static tests:**
    - no reader maps `MAINTENANCE_PLACE` to the pause page;
    - `PT503` is answered only by the person-level hook;
    - `lesson_progress` is written by `record_lesson_progress` alone;
  - **app tests:**
    - a work-scoped window never redirects;
    - the banner at 320 px names the class and the zone;
    - the class's pages carry Daisy's notice;
    - another class carries nothing;
  - **one journey:** a planned window on 7A; a teacher of 7A and 7B works in 7B, sees the notice on 7A, and is
    refused on 7A's writes only.
- **Where it renders:**
  - the banner `PengingatPemeliharaan`, on every page of a person with work in the place;
  - the pause page, for person-level windows only;
  - the scheduling screen in Konfigurasi (reason list, extend, resume early);
  - the class's own pages, with the notice during the window;
  - the start refusal (D4) on the start screen.

  Daisy's screens decide each; her review is at the design stage (Bob, 13 Nov).
- **The hook's timing** is re-measured with the 6b statement of the checkpoint page, before and after. The gate is
  Sharon's: p95 ≤ 1 ms with no window active, after ≤ before + 0.5 ms. The cost with a work-scoped window active is
  measured too, since the hook no longer reads it.

## Questions before the build

1. **For Daisy:**
   - the wording of the D4 refusal, which names the window's start in the school's zone;
   - whether refused lesson progress shows a note;
   - whether each banner stage re-reads before it shows (question 4).
2. **For Sharon:**
   - is a place guard's race with `starts_at` (question 3) acceptable for PLANNED windows, as stated?
   - does an extend skipping the edge recorder's run need anything more than "recorded late, never twice"?
3. ~~For the Chief Architect: does the extend act reuse `change_maintenance`, or get its own function?~~ **Decided
   (13 Nov): its own function**, on the three conditions in row 7. *(Superseded, kept: the question as asked.)*

## Anticipation pre-check

**At the design stage, by question:**
- **(1)** the edge recorder's `skip locked` meeting extend's row lock;
- **(2)** EMERGENCY refused by extend and resume early;
- **(4)** pre-A2b rows with a null code, and the client's stale stage;
- **(5)** `MAINTENANCE_PLACE` mapped to the pause page by a reader.

Each has a test above.
