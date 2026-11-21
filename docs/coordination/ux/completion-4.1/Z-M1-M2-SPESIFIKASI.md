# Z · A3 minors M1 and M2: fix specification (Daisy, 21 Nov 2026)

> **What holds now:**
> - Two small fixes, each in one file.
> - **No new words.** `hle.ts` is unchanged.
> - **Read on `main` `origin/main`:** `src/app/belajar/_components/LanjutkanDiSini.tsx` and `PermukaanAsesmen.tsx`.
> - **Source:** `TINJAUAN-A3-LAYAR-5ae2d406.md`, M1 and M2.

## M1 · The waiting screen's body is drawn as an error

**Now:** `LanjutkanDiSini.tsx:100` renders `perlu_izin_isi` with `<BarisHasil nada="gagal">`, a red box with `role="alert"`. Line 103 does the same for EXPIRED, USED and NOTHING.

**Change:**
- **`nada="netral"` for the recovery outcomes the learner did not cause.** These are NOT_AUTHORISED (line 100), and EXPIRED, USED and NOTHING (line 103).
- **Keep `nada="gagal"` only for `OFFLINE` and any unexpected code.**
- `netral` gives `role="status"`. **That is enough:** the section already takes focus on arrival (`judulRef`, line 70), so the screen reader reads the title, and then the line.

**Test:** at 390, the NOT_AUTHORISED body is not in `pin-hasil-gagal`, and `OFFLINE` still is.

## M2 · «Beri tahu guru Anda juga: {judul}» names the course, not the assessment

**Now:** `PermukaanAsesmen.tsx:107` passes `judul={eyebrow}`, which renders «Matematika · Kelas 5 · Pecahan».

**Change:**
- Pass the assessment's own name and chapter: `judul = «{nama} · {bab}»`.
  - `{nama}` comes from `kunciNamaAsesmen(mode)`, as line 136 already computes, giving «Uji Penguasaan».
  - `{bab}` is the chapter's title (the eyebrow's last part).
- **It renders:** «Beri tahu guru Anda juga: Uji Penguasaan · Pecahan.»
- The eyebrow line above it (line 106) stays as it is.

**Test:** the NOT_AUTHORISED body contains «Uji Penguasaan · » followed by the chapter title, and does not contain the subject or grade.
