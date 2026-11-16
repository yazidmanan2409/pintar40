# A2b batch 2: what I will check in the red tests

Sharon, 16 Nov 2026 (09:45 UTC). This is preparation only, with no verdict. **What it covers:**
- the D2 reason list;
- «Perpanjang» and «Akhiri sekarang»;
- D8-5 and D8-6;
- the class picker on the planned form;
- K14.

## What holds now (Bob's rulings)

- **Emergency reasons:** `stop_pintar_now` keeps free text. The CHECK admits the five planned codes on PLANNED rows only. EMERGENCY rows keep text with no code, and a test pins `stop_pintar_now`'s signature. Emergency codes are A2B-R1, deferred.
- **Overlap of a class window with its school's window is allowed (b).**
  - `maintenance_collisions` refuses nothing. It is advisory: it counts the assessments a proposed window would meet.
  - «Perpanjang» shows the same advisory for the added period. It is not a refusal.
- **The owner's sequence is K14:** class A has a planned window, an overlapping school window is added, A is extended, and the school window ends first.
  - **Expected:**
    - A stays refused until its own extended end;
    - the other classes resume when the school window ends;
    - each sees the right notice.
  - The plant: the guard reads only the earliest-ending window.

## What I will check

1. **The reason CHECK over existing rows.** PLANNED rows that already exist with no code still load. Either the code is nullable for them or there is a stated backfill. A test applies the migration over existing PLANNED and EMERGENCY rows and shows them unchanged. This is the `maintenance_windows` preservation line.
2. **`p_nodes` from the form.** The database is the gate:
   - every node must be a class in the window's school and within the caller's authority;
   - an empty array means a school window;
   - duplicates, an archived class and an oversized array are each handled;
   - another school's class is refused with the designed code;
   - the picker's class list is read under the caller's own access, so no other school's names reach the form.
3. **The class choice in `maintenance_collisions`.** If it gains the class choice (Bob's point 4), it has the same authority checks as `schedule_maintenance`, and it returns counts only. If instead the form labels the count as the school's, overstating is the safe direction for an advisory, provided the words say so.
4. **«Perpanjang» and «Akhiri sekarang».**
   - Each runs under the same locks as the writers it changes, in the A2A-L01 order.
   - «Akhiri sekarang» uses the database clock.
   - An extension cannot shorten or move the start.
   - Ending a window lets draining sittings finish under D-100(b).
   - Each is audited.
5. **K14 and its plant,** with two windows and two classes.
