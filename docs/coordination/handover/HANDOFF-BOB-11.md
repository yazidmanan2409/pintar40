# Bob → coordinator: BOB-11 (lesson media play, M9 read side; checklist STU-11, ADM-10)

**Head:** `92d74aa`, on main `3b7f224` (merged first). It sits on BOB-10 (`7073ef3`) in the lane.

## CHANGED

**The route answers with the file.** `/api/assets/read-url` gains a redirect mode, `alih=1`: after the same authority check it answers **302 to the signed storage URL**, with `Cache-Control: private, no-store`.
- Without `alih` it answers JSON `{ url, expiresIn: 60 }`, exactly as before.
- The redirected URL lives **one hour** instead of 60 seconds. A media element fetches in ranges for as long as the lesson is open and keeps the URL it was redirected to, so a 60-second URL would stop a video that is paused or sought after a minute. See QUESTIONS 1.

**The player points at it.** The learner's lesson page (`src/app/belajar/[tugas]/pelajaran/[pelajaran]/page.tsx`) adds `&alih=1` to each media URL: a one-line change, as the ticket allows. `<video>`, `<audio>` and the PDF link now play or open. `LessonPlayer` itself is unchanged.

**Staff preview their own school's media before release.**
- A new function, `may_preview_lesson_media(path)`, answers true only when a lesson of a school where the caller may draft or review names that exact path. It asks `can_in_institution` for CAN_DRAFT or CAN_REVIEW; it is SECURITY DEFINER, callable by `authenticated` only, and registered as STAFF / CAN_DRAFT.
- It is asked per exact path, never by prefix, as the learner's question is. A stranger and an unknown path both get false.
- The route accepts either question.
- Studio's lesson preview (`src/app/studio/pratinjau/[pelajaran]/page.tsx`) now shows a school lesson's media (audio, video, and the PDF link with its transcript), each gated by that question.
- The learner's `may_read_lesson_media` is unchanged.

## PROOF

| test | red before | green after |
|---|---|---|
| F11-P04 (db) | `the test could not run: function public.may_preview_lesson_media(text) does not exist` | 6 of 6: the school's admin, a drafting teacher and a platform admin may preview the unreleased course's audio; a DEAN of the school, another school's admin and a path no lesson names may not. The learner's question still refuses an unassigned admin. |
| BOB11-A01 (app, network: CI) | on the old code, rehearsed locally against a scratch fake Supabase that stores and signs objects: `the lesson's <audio> src is "/api/assets/read-url?path=pelajaran%2Fpecahan-senilai.mp3"; the learner: the player's src answered 200 with no redirect, not the file; the author's Studio preview → 200 with <audio> src ""` | green on the new code against the same fake; CI runs it against the real stack |

BOB11-A01 is end to end:
1. It places a real object at the seeded lesson's audio path, using the service key.
2. It opens the learner's own lesson page, found through `my_learning_assignments` and `learner_lessons`.
3. It follows the rendered `<audio src>`: 302 to `…/storage/v1/object/sign/assets/…`, which returns the same bytes.
4. The author does the same from Studio's preview.
5. A teacher of another school gets 403.
6. `read-url` without `alih` still answers JSON with a 60-second URL.

**Tests changed:**
- The migration-count tripwires moved from 120 to 121, with the reason.
- `db-bob02-gates`' control moved from 6 to 7 green rows, because F11-P04 joins the suite.

No other test was restated, weakened or skipped.

## CI

I dispatched one run on `92d74aa` and haven't waited on it; please read the result there.
- **Local, before dispatch:** tsc and lint are clean (the two lint warnings are in files that aren't mine). A full run on a fresh database with all 121 migrations: 348 passed.
  - It first found two of my own slips, both fixed: BOB11-A01's `proves` didn't name its artefact for F06-S04, and `db-bob02-gates`' control count needed 6 → 7 for F11-P04.
  - The only other failure is F01-R07, which always fails locally.
- All 80 plants prove their gates, including the new **bob02-11**: it removes the draft-or-review check, and F11-P04 goes red with `a DEAN of the school (no draft, no review) was let preview`.
- One run, no new job. BOB11-A01 runs in the existing app job, and plant bob02-11 runs in the existing `db-bob02-gates` job.

## CONTRACT

- `GET /api/assets/read-url?path=…&alih=1` answers 302 to a signed URL valid for one hour. Without `alih` it is unchanged.
- New RPC `may_preview_lesson_media(p_path text) returns boolean`.
- No error codes changed.

## MIGRATIONS

`20261015100000_lesson_media_play.sql`, forward-only. It adds one function and one registry row, and its terminal checks confirm anon cannot call it and a caller with no person previews nothing. No data changes.

## COPY

None new. Studio's PDF link reuses `lesson.pdf`.

## QUESTIONS

1. **The one-hour media URL.** It is a bearer URL for one file, issued only after the authority check and never stored, and it outlives the page by at most an hour. The alternative, 60 seconds, would break a paused or scrubbed video. Is one hour acceptable, or would you prefer a shorter bound, such as 15 minutes, with a reload?
2. **The seeded synthetic lessons still 404.** Their media paths (`pelajaran/pecahan-senilai.mp3` and others) have no object in staging's storage, so "not found" is the honest answer there. The sample workbook's media, uploaded through BOB-02, play. For STU-11 on staging, either upload those three seeded files, or walk the check with a lesson made from the sample workbook.

## READY

Yes, once the run on `92d74aa` is green.
