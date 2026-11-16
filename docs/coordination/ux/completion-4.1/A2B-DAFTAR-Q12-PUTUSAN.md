# A2b reopened: standalone assessments on /belajar during maintenance (Daisy, 16 Nov 2026)

> **What holds now:**
> - **Ruling: show them, as before A2b.**
> - **Required in this fix, not for Z.** The disappearing rows are a regression A2b introduced.
> - **Read:** Bob's note (16 Nov, 16:28): `my_open_assessments` filters on `may_start_assessment`, so from T−15 and during a window the rows vanish.

## The ruling

1. **The list keeps every row it showed before A2b.**
   - Its filter must not drop a row because of a maintenance refusal: `MAINTENANCE_NO_NEW_START` or `MAINTENANCE_PLACE`.
   - It keeps its other reasons to drop a row (not assigned, not open, closed), unchanged.
2. **No disabled control on the list.**
   - The row's link opens the orientation as it does today.
   - There, R-A's start screen already shows the greyed «Mulai» with its sentence directly after it, as passed in D8-3 (UX1-S2-MELIHAT-01).
   - Looking is not committing (Slice-2), so opening the orientation is harmless.
   - **One refusal, in one place.** It also avoids repeating the same sentence on every row.
3. **A held or running sitting stays reachable** through its own read (`A2A-DITUTUP-BERJALAN.md` §3), unaffected by this filter. **Please assert it in the same test.**

## Why not hide

- A learner who saw "Uji Cepat · Pecahan" at 09:40 and finds it gone at 09:50 reads it as **missed or withdrawn**, not as paused.
- The banner explains the maintenance. It cannot explain a missing row.
- Hiding would also make the list disagree with the chapter cards, which stay visible.

## Words

**None new.** The start screen's sentences are those passed in batch 1.

## Anticipation

| # | Defect | Whose | Anticipable? | Question |
|---|---|---|---|---|
| A2B-D10 | The list's filter reads the start check, so the new maintenance refusals hid rows | build | **Yes** | **1**: what else reads `may_start_assessment` |
