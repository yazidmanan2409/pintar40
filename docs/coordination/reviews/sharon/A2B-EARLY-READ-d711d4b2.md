# A2b · early read of the page, before code · `d711d4b266c4f1457ee8f70ac6859b299cd4c38c`

Sharon, 13 Nov 2026 (20:40 UTC). Read-only. The page is `docs/completion-4.1/batches/A2B-COMPLETION.md` on `claude/a2a`. I read it against my `A2B-PREBUILD-ec09e82e…` and today's A2a rulings.

## What holds now

- **NO BLOCKER in the design.** My PASS at `ec09e82e` stands.
- **The page carries none of my three required points yet.** Its only change since `ec09e82e` is one "superseded" line. Before A2b's build, the page must carry the five items below.
- That is a page edit, not a new round. I check them at the result review.

## To carry before the build

1. **The guard's clock (my point 1).**
   - "Active" and "approaching" are read against `clock_timestamp()`, never `now()`. State it in row 1.
   - Test: a transaction that begins before `starts_at` and writes after it is refused.
2. **Extend and the window's state (my point 2).**
   - In question 4, the page still lists `activation_recorded_at` among what tells a window's state. Remove it, or mark it as audit only.
   - Extend is refused once `ends_at <= clock_timestamp()`.
   - Test both orders against the edge recorder, on two connections. Either way, exactly one activation row and at most one deactivation row per window.
3. **Lifting A2a's emergency-only CHECK (my point 3).**
   - The CHECK is dropped in the same migration that adds the node parameter.
   - `schedule_maintenance` refuses a bad node with a designed code, before any constraint fires.
   - A2a's validation trigger then covers PLANNED class windows as well.
   - Test: a PLANNED class window is accepted, and a bad node is refused with the designed code.
4. **New today: the corrected lock order.**
   - Question 3 still states the order as person → accounts → fence → sittings. Cite the order in force instead, from my A2a early read, ruling 1: … accounts → `password_write_permits` → the fence → `maintenance_windows` → sittings.
   - State that A2A-L01 covers A2b's new writers. `perpanjang_pemeliharaan` takes the window row only, takes no fence, and locks nothing after it. `maintenance_record_edges` and `change_maintenance` are re-read under it.
   - **A2b's change to `change_maintenance`** (row 7b: refuse a later `ends_at`) **is made to A2a's B1 form,** where the fence comes before the window row for an EMERGENCY `AKHIRI`. It is not made to today's form. Otherwise A2b reintroduces B1's cycle.
5. **New today: working rule 1.**
   - Question 5 names the tests, but not who runs each one, with what access, and where.
   - Add the acceptance-evidence table in A2a's §7 form. Name the hook-timing measurement there: who runs it, and on which stack.
   - Say whether any proof can only be made on hosted staging. My reading is that none is needed.

## Checked and unchanged

- The writer classing.
- `MAINTENANCE_PLACE` is never `PT503`.
- The place guard takes no row lock.
- EMERGENCY is refused by extend and resume early.
- D4 refuses only a start; D2's null code is kept for old rows; D8 is in UTC and rendered in the school's zone.
- A1's held state is untouched.
- None of these sit in the `finalize_session` shape: the guard locks nothing.

Could reasonably have been anticipated: item 4's `change_maintenance` overlap, yes (Q1, readers and writers: two batches edit one function). The rest are carried-over points, not new defects.
