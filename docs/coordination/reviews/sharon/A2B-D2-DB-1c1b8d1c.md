# A2b batch 2: the D2 database commit (a planned window gives its reason)

Sharon, 16 Nov 2026 (10:30 UTC). Read-only. **What I reviewed:**
- `1c1b8d1c6459d121ff39f68febad8d94e0c6922c` on `claude/a2b`: migration 20270120190000. I read its CHECK, the replaced `schedule_maintenance`, its grants, and its own check.
- the commit messages of `23ce7965`, `11d42d45` and `7fd71560`.
- the suite as Second Eye reports it, on a fresh database: 1209 passed and 9 failed, each failure waiting on a later product commit (R03, E01 to E03, C10, K14, K17, K18, E05).

## What holds now

- **PASS for the D2 database part.**
- **The CHECK matches the approved rule** (Bob, 09:16) and my T1 to T4. It is added VALID, and its convalidated flag is asserted.
  - A row with no code is valid, which keeps old rows and every EMERGENCY row.
  - A code is allowed on PLANNED rows only.
  - LAINNYA's text is measured with `char_length(btrim(…))`, and must be 1 to 120 characters.
  - The other four codes require `reason = reason_code`, so no free text reaches the affected.
- **`schedule_maintenance` is replaced by DROP and CREATE,** so no 8-argument overload is left to make calls ambiguous.
  - The 7-argument and 8-argument callers (M148, L01) still resolve through the defaults.
  - **Grants are exactly commit 1's:** revoked from public, anon and service_role, and granted to authenticated.
  - The authority check (`maintenance_may_act`) and the class check are unchanged and still come before any write.
  - The new input rules (a foreign code, LAINNYA's length, text behind another code) all refuse with `MAINTENANCE_INPUT_INVALID` before the insert.
- **The preservation line holds.** R04 runs the marked section over every existing row shape, and they come through unchanged. `7fd71560` pins that the migration changes `maintenance_windows` only inside its markers.
- **The status read** gives `alasan_kode` and `alasan` for PLANNED windows only. R02's negative case (7B) shows an untouched learner gets nothing.
- **My open items are closed:** the E04 and E06 plants are shown red, LAINNYA made only of spaces is refused at the row, and D15 covers `maintenance_collisions`.

## One accepted limit (not a defect)

- **A07, restated.** `audit_write` takes no time argument, and `audit_log.at` defaults to `now()`.
  - So even after the E05 fix, the audit row's own time is the transaction's start. That can be earlier than the real end by the lock wait, at most the fence's 1.5 to 2 s.
  - The summary carries the true `ended_at`, and A07 now compares that.
  - **Accepted.** Giving `audit_write` a time argument would change a function shared across the platform, for a gap of seconds. Recorded here so no reader takes `audit_log.at` as the exact end.

## Next for me

- the change_maintenance clock fix (E05);
- the picker and the class-aware count (K14, K17, K18), through `maintenance_jendela_atas` and with the 500 bound;
- then the app commits;
- ~~**and later edits to this migration.** The branch head `ef1c6a7b05f1f1a9fe40324db3bc1f596b104589` shows this migration file further changed after `1c1b8d1c`. I will read those changes with their own commits.~~ *Withdrawn, 10:25: the file is unchanged since 1c1b8d1c, and my line numbers came from a comment-stripped grep. The later edits to `schedule_maintenance` are in 20270120210000 (c903e71f), read with that commit.*
