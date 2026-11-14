# A2a: an assignment closed by its own time while held sittings still run (Daisy, 14 Nov 2026)

> **What holds now:**
> - **The approved wording does not cover it.** One new line for the teacher (§2). On the learner's side, **no new words, but a reachability fix** (§3): today the learner cannot get back to the sitting at all, so no line could help.
> - **Within A2a's scope:** it is D-1's own behaviour ("held sittings resume with the time they had").
> - **Question for Bob and Sharon:** §3 changes which rows a learner's list returns. It is a behaviour change, not wording, so Sharon decides its shape.
> - **Read at:** `main` `a6b47466`, with Sharon's note in `A2A-C-T01-768eb032.md` (`afc2566e`).

## 1 · Where it happens, swept for siblings

- **A chapter's Uji Penguasaan (learning cycle): not affected.** The learner's chapter card follows the **sitting's** own state and deadline (`catatanDari` → «Lanjutkan · sisa {n} menit» from the sitting's `tenggat`), not the assignment's `closes_at`.
- **Standalone assessments (Uji Cepat, Latihan) with a `closes_at`: affected, in three places:**

| Who | Where | Today, once `closes_at` passes during or after a stop |
|---|---|---|
| Learner | Belajar's «terbuka» list (`my_open_assessments`) | **The row disappears.** `may_start_assessment` answers `OUTSIDE_WINDOW` after `closes_at`, whether or not the learner has an open sitting. The learner has no way back to the held sitting, while THE PLAN item 2 tells them to «buka lagi» |
| Learner | The orientation before an assessment (`OrientasiAsesmen`) | «Ditutup {tanggal}», the assignment's date, while their own sitting runs past it |
| Teacher | `/mengajar/[kelas]/uji-cepat` | The page leaves stage 3 («running», with «Sisa … menit» from `closes_at`) and shows the results stage: «Rata-rata nilai kelas … Yang belum mengumpulkan, atau belum dinilai, tidak dihitung». Meanwhile learners are still answering |

**The teacher's sitting list** (`/mengajar/[kelas]/siapa`) is right as it is: each row is the sitting's own state. After the lift, a held row returns to live (THE PLAN item 5).

## 2 · The teacher: one line

**Where:** on `/mengajar/[kelas]/uji-cepat`'s results stage, directly under its heading. **When:** when any sitting of that assignment is still open after the assignment's own `closes_at`.

| | |
|---|---|
| **ID** | «Pengumpulan sudah ditutup, tetapi {n} murid masih mengerjakan asesmen yang ditahan selama penghentian, sampai pukul {jam} {zona}. Nilainya masuk setelah mereka mengumpulkan.» |
| **EN** | «Submissions have closed, but {n} students are still working on assessments held during the stop, until {jam} {zona}. Their scores come in once they hand in.» |

- **{jam}** is the latest of those sittings' shifted deadlines, in the school's zone.
- It disappears when the last sitting ends.
- `role="status"`, in the page's existing quiet banner style. It follows the same pattern as the other held-sitting lines (THE PLAN §5.3 F), so one fix covers its siblings.

## 3 · The learner: reachable again, with words that already exist

- **The fix:** while the learner has an **open sitting** (not final) in a standalone assignment, Belajar's list keeps that assignment after its `closes_at`, and it opens straight into the sitting. Whether that is a separate read or a branch in `may_start_assessment` for resuming (never for starting) is Sharon's call.
- **The words already exist:**
  - the row's button reads «Lanjutkan · sisa {n} menit» (`sync.lanjut_sisa`), from the **sitting's** deadline, as the chapter card already does;
  - the row's meta drops «Ditutup {tanggal}» for that learner, because it would contradict the button.
- **On reopening,** the player shows THE PLAN item 3: «Asesmen ini ditahan selama penghentian. Sisa waktu Anda: {n} menit.»
- **`OrientasiAsesmen`:** for a learner resuming their own sitting, show the sitting's time left in place of the assignment's «Ditutup {tanggal}». The same existing words, «sisa {n} menit».

## 4 · For my screen review (add to the ten)

11. **A learner's Belajar list after the lift,** with a held Uji Cepat whose `closes_at` passed during the stop. The row is there, with «Lanjutkan · sisa {n} menit».
12. **The teacher's Uji Cepat page in the same moment,** with the line in §2.

Both at 390 and 320 px.

## 5 · Anticipation

**Yes, anticipable,** by **question 1**, what else reads this state. The assignment's `closes_at` is read by the learner's list, the orientation and the teacher's page; D6.3 shifted only the sittings' deadlines. Found before the build, which is the point.
