# A2a change A · row 4 (`recompute_result`) after Second Eye's race

Sharon, 13 Nov 2026 (22:45 UTC). Read-only. I read the page at `33a97fa45b7086a9330290a6575615325808000b`, section "Row 4 raced before the fix", and the code on `main` at `a6b47466`.

## What holds now

- **My row-4 reasoning was wrong, and Second Eye's reading is right.** Two recomputes of one sitting do not deadlock with each other.
  - Both insert a result with the same `supersedes_result_id`. The unique constraint `results_one_successor` (`20260912140823…`, :87) makes the second wait for the first's whole transaction, before its foreign-key check takes `KEY SHARE` on the sitting.
  - Could reasonably have been anticipated: yes (Q3). I read the statement's locks in text order, as the engine does, and left out the unique check that comes before the RI triggers.
- **A real cycle remains, with a different partner.** So the fix stays in change A. The race test changes.

## The remaining cycle

- **T1, `recompute_result` on sitting S:**
  - its insert claims the successor slot of S's head result;
  - its foreign key takes S `KEY SHARE`;
  - then `koreksi_kunci_saat_selesai` → `hitung_ulang_koreksi_kunci` takes S `FOR UPDATE`. This is reached when S is affected by a confirmed key correction.
- **T2, `hitung_ulang_koreksi_kunci` on S, from `tegaskan_koreksi_kunci` or a direct call:**
  - it takes S `FOR UPDATE` first (`20270115110000…`, :544);
  - then it inserts a result superseding the same head (:557). That waits on T1's slot.
- T1 waits on T2 for S, and T2 waits on T1 for the slot. That is a 40P01. Nothing is lost.
- It needs a sitting with a confirmed correction, recomputed while a correction is confirmed or applied to it. That is narrow, but real.

## Ruling

1. **Build row 4's fix as ruled:** the learner `FOR KEY SHARE`, then the sitting `FOR UPDATE`, as `recompute_result`'s first two locks. T1 and T2 then queue on S before either claims the slot.
2. **The test:**
   - the structural check: the two locks come first;
   - A2A-L01 green on that site;
   - a two-connection race of `recompute_result` against `hitung_ulang_koreksi_kunci` on one sitting with a confirmed correction, with a plant, **if the fixture is cheap**. Copy one sitting and one correction, as A2A-L03 copies a sitting.
   - If it is not cheap, the race is a register item and is not built. Make no claim of a reproduced deadlock either way.
3. **Row 3's fix and row 4's go in one commit:** the same functions' family, and the same order.
4. **The page's other items stand as listed:**
   - rows 7 and 9 in C1's commit;
   - `import_advance`, which inserts only: I agree it is not C1's shape;
   - row 13, with the caller condition;
   - REG-A2A-01, 02 and 03.
