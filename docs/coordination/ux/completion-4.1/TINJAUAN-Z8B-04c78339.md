# Z8 verify-closed, stream B · confirmation at `claude/z-ux` `04c78339` (Daisy, 23 Nov 2026)

> **What holds now:** **All six confirmed as recorded.** Nothing is reopened.
> - **Closed:** A1-R1, A1-R2, the placement of A1-R4, C1-R2, C1-R4, and the in-app half of C1-R5.
> - **C1-R5's email stays 4.2** (PETE-12).
> - **Two re-looks ride the post-merge sweep session:** A1-R4's row words (`hasil_gerbang`) and C1-R4's printed predicate.
> - **C1-R2 needs no fresh render.** My own R-15 read (`R15-DAISY-7ba18b03.md`, row C1-R2) recorded «Ada perbaikan · terbit {tanggal}» with «Pindahkan penugasan» in `d8-1-wita-t15-guru-390`. Neither the class page nor `keadaanTerbitanKelas` has changed since, and C1W-K02 passes.
> - **Read:** `Z8-VERIFIKASI-B.md`, and my register (`TINJAUAN-A1-C1W.md` §register, `R15-DAISY-7ba18b03.md`).

| Row | Against my register | Confirmed |
|---|---|---|
| A1-R1 | The open player learns of an extension or an ending: a check every 45 s and on every send (A1-K02, A1-J01) | Yes |
| A1-R2 | The controls are on «Siapa», plus «Ubah jadwal» (A1-A01, z8-04) | Yes |
| A1-R4 | Placement: «Yang menunggu» on Konfigurasi for the school admin, and the head's own home (A1-A02, z8-01..03). This was the one look I asked for | Placement yes; the row words are a re-look after merge 2 |
| C1-R2 | «Ada perbaikan · terbit {tanggal}» → «Pindahkan penugasan»; nothing moves by itself | Yes, with the cited capture |
| C1-R4 | My register said: «Allow it; the QR carries the live status. Say nothing on paper that the status page contradicts». Built exactly so: «Cetak» stays, and on paper there is no review banner and no status word, but the QR is there (z8-05..07, the PDF). The 12 px print-media overflow at 390 and 320 is the paper layout in a phone window; the PDF is the page | Yes; the predicate is a re-look after merge 2 |
| C1-R5 | In-app in «Yang menunggu», with no student names (C1W-S06) | In-app yes; email 4.2 |

## Z8 item 8 · words for the last school admin closing their own account (23 Nov, 13:15)

**Where:** `/akun`, «Meninggalkan PINTAR» (`MeninggalkanPintar.tsx`), as the result line of the closure request, `role="alert"`.

**New key `akun.tinggal.galat.account_last_school_admin`.** It is modelled on its sibling `peran.galat.role_last_school_admin`:
- **ID:** «Permintaan ini tidak diajukan: Anda satu-satunya Admin sekolah yang masih aktif di {sekolah}, jadi akun Anda belum dapat ditutup. Tunjuk Admin sekolah lain lebih dulu di Peran & akses, lalu ajukan lagi. Bila tidak ada orang lain, hubungi Admin PINTAR.»
- **EN:** «This request was not made: you are the only active school administrator at {sekolah}, so your account cannot be closed yet. Appoint another school administrator in Roles & access first, then ask again. If there is no one else, contact an Admin PINTAR.»
- **{sekolah}:** the school's name, so that an admin of several schools knows which one. If the refusal can't name it, use «di sekolah Anda» / «at your school».
- **The checks:** it says what happened, why, and what to do. «belum» marks it as temporary. DAISY-25 is clean.

**Capture:** yes. One recovery walk at 390, keyboard only:
1. the refusal, with the form kept and nothing changed;
2. Peran & akses: appoint a second Admin sekolah;
3. back to «Meninggalkan PINTAR»: the request goes through.

A 1280 shot of step 1 is enough for width.
