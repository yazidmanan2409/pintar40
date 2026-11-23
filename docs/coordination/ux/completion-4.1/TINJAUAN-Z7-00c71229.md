# Z7 (the words) · review at `claude/z-ux` `00c71229` (Daisy, 23 Nov 2026)

> **What holds now:** **PASS with three conditions.** All three are word-only.
> - **C-1:** S-14's keys are shared with activation, which takes an email only.
> - **C-2:** two T-03 English keys should name the roles.
> - **C-3:** X12's column name.
> - **Matches the agreed words:** T-03 (22 keys plus 1 EN; the sweep found no old forms), T-09, T-02, S-09, S-10, N-1, N-2, and R-15's Kenaikan join.
> - **No captures needed.** These are copy-table words proved word for word, and N-2 is proved by render.
> - **Read:** the `hle.ts` diff `bc5749ff..00c71229`, and `components/aktifkan/jawaban.ts`.

## 1 · The builder's questions

1. **S-14: change it (C-1).**
   - `aktifkan.minta_sering` and `aktifkan.kode_sering` are read by `jawaban.ts:224,227` for **both** recovery and activation (`STATUS_MINTA_KODE`). Activation takes an email only, so «email atau username yang Anda ketik» would be wrong there.
   - The simplest true wording for both paths names neither:
     - `aktifkan.minta_sering`: «Kode sudah terlalu sering diminta, jadi kode tidak dikirim.» / «A code has been asked for too often, so no code was sent.»
     - `aktifkan.kode_sering`: «Kode sudah terlalu sering dicoba.» / «The code has been tried too many times.»
   - The wait sentence that follows still gives the time.
2. **The T-03 English and «Creating Quick Assessments» are accepted.** «an Admin PINTAR» in running text; «Admin PINTAR» as the role label.
3. **Yes, name the roles (C-2).** The English should say what the Indonesian says:
   - `laporan.templat.tak_berwenang` EN: «Assembling a report template requires a school administrator or an Admin PINTAR.» This also drops «institution» (T-11).
   - `aktivasi.ditolak` EN: «This page is for a school administrator or an Admin PINTAR.»
4. **X12 should use the concept's name (C-3).**
   - `sertifikat.kelola.kolom.kursus` → «Paket Pembelajaran» / «Learning Package», as `studio.paket.judul` names it.
   - The certificate table is read by school admins who may never open Studio, so the column uses the full name, not Studio's short form. This keeps X12 T4's recommendation.
5. **The summary order:** the main group first, then the rest **in a fixed outcome order**, the same order as step 2's statuses.
   - Arrival order changes from run to run, so two reviews of the same promotion would read differently.
   - This is a choice of order only, with no word change. It can ride this chunk or Z6, whichever the builder prefers.

## 2 · Rows checked

| Row | Result |
|---|---|
| T-03 | 22 ID keys plus `email.aman.diatur_ulang.isi` EN; `role.SYSTEM_ADMIN` is «Admin PINTAR» in both languages |
| T-09 | «Mastery Check» ×2, «Creating Quick Assessments» |
| T-02 | `mengajar.langkah.f2` deleted; f2w kept |
| S-09 | «… dari jaringan ini.» / «… from this network.» |
| S-10 | «… belum punya PIN yang bisa dipakai …» / «… has no PIN that can be used …» |
| S-14 | C-1 |
| N-1, N-2 | `pemeliharaan.pita.asesmen_baru_staf` «Murid tidak dapat memulai asesmen baru sampai pemeliharaan selesai.» / «Students cannot start a new assessment until maintenance ends.» It is accurate, staff only, and DAISY-25 is clean |
| R-15 | Kenaikan's «, » join is accepted; the order is in §1.5; the column is C-3 |
