# Bob → coordinator: BOB-22 (a lesson read to its last page counts as read)

**Head:** `190a955`, with `main` merged in: first `64181e8` (a fast-forward carrying Integration 15), then `1afae39`, the staging journey harness. That last merge touches only `audit/staging/journey.mjs`, which no selftest reads; it is lint-clean. The code is `d43043a`. **One run:** ci #217.

## CHANGED

**The one meaning, chosen:** a saved lesson position is **the number of pages reached**, from 1 to N. 0 means never opened. This is the database's own reading: `lesson_progress_within_total` is `furthest_position <= total_positions`.

**The one place it lives** (`src/lib/siklus.ts`), used in all three places:
- **The save:** `posisiTersimpan(halaman)` is the page on screen (counted from 0) plus 1. `LessonPlayer` saves `posisiTersimpan(p)`, so the last page of N saves N.
- **The resume point:** `halamanMulai(posisi, jumlahHalaman)` is the page to show, counted from 0: the count minus 1, kept inside the lesson. `LessonPlayer` resumes from `halamanMulai(props.startAt, pages.length)`. `startAt` is still the saved `furthest_position`.
- **The read rule:** `lessonRead` is unchanged (`furthest_position >= total_positions`). It now meets what the player saves.

The device's own `localStorage` copy stays a page index, as it was; it is only a local "never behind" hint. No migration, no database change, no copy change.

## PROOF

| test | red before | green after |
|---|---|---|
| BOB22-K01 (static) | on the code before BOB-22: `a 1-page lesson on page 1 saved 0 and reads as unread; a 2-page lesson on page 2 saved 1 and reads as unread; … a 8-page lesson on page 8 saved 7 and reads as unread; three lessons read to their last page leave the learner at PETA with 0 read; LessonPlayer does not save the page as posisiTersimpan(page); LessonPlayer resumes from startAt without halamanMulai` | pass |

**What BOB22-K01 checks:**
- A learner steps through lessons of 1 to 8 pages. Each step saves exactly what `LessonPlayer` saves, and the furthest is kept, as the database's `greatest` does.
- The lesson is read only once the last page is reached.
- A saved position never exceeds the total.
- Coming back, the learner resumes on the page they were on.
- Three lessons read to their last page put `posisi` at the Uji Penguasaan.
- `LessonPlayer` saves and resumes through the two helpers.

On the code before, it falls back to the old player's own rule (save the index, resume at what was saved) and judges that, so the red says what a learner met, not only that a name is missing.

**J09/J10, rehearsed locally in a real browser** (Chromium through Playwright, the production build, against the local seeded database through my scratchpad REST stand-in). The seeded cycle learner opened each of their two lessons from the home and clicked "next" to the last page.

| | before BOB-22 | with BOB-22 |
|---|---|---|
| rows saved | `2 of 3` and `1 of 2`, one short, as on staging run 7 | `3 of 3` and `2 of 2` |
| the home's lesson pills | `Mulai`, `Mulai` | `Selesai`, `Selesai` |
| the last lesson page's closing action | no Uji Penguasaan link | the Uji Penguasaan link |

This seeded learner has not taken the pre-test, so the home's own next step stays "Pemetaan Awal" in both, as the cycle rule says. On staging, J09 and J10 run a learner past the pre-test, so they are the acceptance that counts.

**Existing test:** UX1-S2-POSISI-01's 10-of-10 is now a state the player produces. It needed no change.

No test was weakened, skipped or deleted.

## CI

`ci #217` on `190a955`, dispatched once and not waited on; please read the result there.
- **Local, before dispatch, every database with an `en-US` ICU collation:** on `d43043a`:
  - **Plants:** 91 of 91 proved their gate on a copy taken straight after the seeds.
  - **Full suite, fresh database:** 362 passed. F01-R07 fails, as it always does locally. 29 justified skips.
  - **Shared red cases:** all 15 gates exited 0 on one shared stack, the schema digest stayed the same, and every recheck was 242 of 242.
- One run, no new job.

## EXISTING DATA

No rows change, and none are patched.
- **Production:** no `lesson_progress` rows (the coordinator's read-only count).
- **Staging:** the old rows are earlier runs' test data, which D-050 does not allow altering to make a journey pass. The journey creates fresh students each run, so J09/J10 do not depend on them.
- **If an old row is read again:** a learner who reached a last page before this deploy shows it as unread until they open that lesson again. One "next" then saves the full count.

## CONTRACT

None changed: `record_lesson_progress(p_position, p_total)` is as it was, and the client now sends the count.

## MIGRATIONS / COPY

None.

## QUESTIONS

None.

## READY

Yes, once `ci #217` on `190a955` is green.
