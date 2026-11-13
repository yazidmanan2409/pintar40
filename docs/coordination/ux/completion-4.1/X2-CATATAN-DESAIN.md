# X-2: a learner's link to an assignment page that is not theirs (design note; Daisy, 13 Nov 2026)

> **What holds now:**
> - **X-2 is restated.** My first description (`TINJAUAN-F1R1B-97a40ebb.md` §3: "an old link to a moved assignment after a key correction") was **wrong**, and is corrected there in place.
>   - A key correction keeps the class's learning assignment id: `b6721b8d…` before and after, in the C1W-J02 world. Only its course changes.
>   - The address that failed carried the **assessment** assignment id of the Pemetaan Awal (`/belajar/{pre}/hasil`), which is not a learning assignment.
> - **What X-2 really is:**
>   - Under `/belajar/[tugas]/`, **only the main page and «lanjut»** check that the id is one of the learner's assignments, and answer «not found».
>   - **Six sub-pages do not** (`hasil`, `pelajaran/[pelajaran]`, `pemetaan`, `penguasaan`, `peta`, `sertifikat`). With an id that is not the learner's, they call the learning-state function, which raises «this learning assignment is not assigned to you», and the learner gets the generic error page with a reference code.
> - **Design: one answer for every page under `/belajar/[tugas]/`, the main page's own** (§2). Small; for Second Eye with the register corrections.
> - Read at `55e7eed9573d7396973b48665cd9d67a048da5bf`.

## 1 · Who meets it, and what they see today

**Who:** a learner who opens such a page with an id that is not theirs:
- a link copied from a classmate;
- an old bookmark from a class they have left;
- a mistyped address;
- any `/belajar/{id}/…` built from an assessment assignment id.

**What they see:** «Maaf, halaman ini tidak bisa ditampilkan. Coba lagi sebentar lagi. Jika masih terjadi, sampaikan kode rujukan di bawah kepada pengelola sekolah Anda. Kode rujukan …».

**What that says, and why it is wrong:**
- **It says PINTAR is broken and to try again.** It isn't, and trying again cannot help.
- **It asks the learner to pass a reference to the school,** which produces a support request for nothing.
- **The page that does check** (`/belajar/{tugas}`) answers the same id with «Halaman ini tidak ada. Alamatnya mungkin keliru, atau halaman ini sudah dipindahkan. Ke halaman awal». So two pages of one assignment answer one wrong id in two ways.

## 2 · The design

1. **Every page under `/belajar/[tugas]/` answers an id that is not the learner's exactly as the main page does:** «not found», through the same check (`if (!mine) notFound()`), before any learning-state read.
   - One guard for the segment, in a shared helper or a `layout.tsx` for `[tugas]`, so a page added later cannot miss it.
2. **No distinction between "exists but not yours" and "does not exist".** The answer must not tell a learner that a classmate's assignment, or another class's, exists. That is the same rule as B2-R-A1's general refusal.
3. **The words are the existing not-found page's.** No new string.
   - **One improvement, optional, for the learner only:** the way back on that page could be «Ke Belajar» (`/belajar`), their own list, instead of «Ke halaman awal».
   - That needs the not-found page to know the section it is in. If that is not cheap, the current «Ke halaman awal» is acceptable: the doors lead to «Belajar» in one step.
4. **The neighbouring states keep their designed screens:** an assignment that has been **withdrawn** («Ditarik») or **ended** is the learner's own, and keeps its 4.0 wording. The guard is "not the learner's", never "not active".
5. **A genuine failure stays the error page.** A failed read of an assignment that *is* the learner's still shows «Maaf, … Kode rujukan …»; only a missing ownership becomes «not found».

## 3 · The five questions, answered for this change

| # | Question | Answer |
|---|---|---|
| 1 | What else reads this state? | The six sub-pages listed, and any page added under `[tugas]` later, hence one guard for the segment. The learning-state function's own exception stays as the database's last line |
| 2 | The opposite and neighbouring act | Withdrawn and ended assignments: the learner's own, with designed screens; unchanged (§2.4). A real failure: still the error page (§2.5) |
| 3 | Locks | None. A read |
| 4 | Before and after | Not applicable: ownership is read on each request |
| 5 | Who checks, where it renders | **The test:** a learner opens each of the seven `/belajar/{id}/…` routes with another learner's assignment id and with an assessment-assignment id. Each answers 404 with the not-found page, and none shows a reference code. Through the running app, at 390 px |

## 4 · Anticipation

X-2 predates 4.1 (listed in `ANTISIPASI-4.1.md`, not counted). It would have been caught by **question 1**: what else reads this assignment id. The main page had the check; its siblings were written without it.
