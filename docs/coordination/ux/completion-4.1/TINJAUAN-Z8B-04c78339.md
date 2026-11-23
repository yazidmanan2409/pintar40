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

### Revised at 13:17: both routes (Sharon's second route), one refusal code that names no school

**(1) Closing their own account.**
- **Where:** `/akun` › «Meninggalkan PINTAR».
- **Key:** `akun.tinggal.galat.account_last_school_admin`. It **replaces** the 13:15 version: there is no `{sekolah}`, because the code names no school.
- **ID:** «Permintaan ini tidak diajukan: Anda satu-satunya Admin sekolah yang masih aktif di sekolah Anda, jadi akun Anda belum dapat ditutup. Tunjuk Admin sekolah lain lebih dulu di Peran & akses, lalu ajukan lagi. Bila tidak ada orang lain, hubungi Admin PINTAR.»
- **EN:** «This request was not made: you are the only active school administrator at your school, so your account cannot be closed yet. Appoint another school administrator in Roles & access first, then ask again. If there is no one else, contact an Admin PINTAR.»

**(2) Revoking the last usable Admin sekolah role, their own or another's.**
- **Where:** Konfigurasi › Peran & akses, as the revoke's result line.
- **Key:** reuse the existing `peran.galat.role_last_school_admin`. Its words already fit both «own» and «another's», and it is the screen's own vocabulary:
  - «Ini satu-satunya Admin sekolah yang masih aktif di sekolah ini, jadi perannya tidak dapat dicabut. Tunjuk Admin sekolah lain lebih dulu, atau hubungi Admin PINTAR.»
  - «This is the only active school administrator at this school, so the role cannot be revoked. Appoint another school administrator first, or contact an Admin PINTAR.»
- **No word change.** «di sekolah ini» is right, because the page is scoped to one school.
- **Mapping:** the one new guard code maps to this key on Peran & akses, and to (1)'s key on `/akun`. One code, two keys, chosen by screen.

**«masih aktif»** stands for «usable»: appointed now, not suspended, not locked, with an account. That is the reader's sense of "active". The exact test belongs in the guard, not the sentence.

**Capture:**
- the walk for (1), as at 13:15;
- for (2): one shot at 390 of the refused revoke, and the role still listed.

### Sharon's nit, C2 (a must-be-right item with no linked objective) · included for Z3-A

When the gate failed but the missed item has no learning objective, the teacher's per-learner page shows the gate row and then «Tidak ada tujuan … di bawah target». That is true, but it reads as "nothing to study".
- **New key `mengajar.murid1.gerbang_tanpa_tujuan`,** in place of the empty-list line in that case only:
  - ID: «Soal penting yang belum tepat tidak terhubung ke tujuan pembelajaran mana pun, jadi tidak ada tujuan yang dapat ditunjukkan di sini. Lihat soalnya bersama murid.»
  - EN: «The important question that is not right yet is not linked to any learning objective, so no objective can be shown here. Go over the question with the student.»
- **I'll check it in Z3-A.**

### Item 8 built at `claude/z` `f505166e` (23 Nov, 14:47): **PASS**

From `layar-z8/CATATAN-Z8.txt` (8 shots, 0 px overflow):
- **(1) Account closure, recovery walk at 390, keyboard only:**
  - the refusal, word for word, with the CLOSE form still offered and the account not closed (01);
  - Guru Alpha appointed with the D-101 confirmation, giving 2 usable admins (02–04);
  - the closure then goes through (06).
- **(2) The refused revoke:** `peran.galat.role_last_school_admin`, unchanged; the role is still live and listed (05).
- **Ruling 81:** the person understands what happened, nothing is lost, and the next step is clear, on both routes.

### Finding · the REOPEN form on «Akun saya» (pre-existing): **Significant**, recommended for Z

**What it is:**
- `MeninggalkanPintar.tsx:48` draws one form per `JENIS_PERMINTAAN` entry. That list includes `REOPEN`, which has no `akun.tinggal.*` keys, so a signed-in person sees a third form whose text, checkbox and button all read «—».
- `minta_akun` accepts only CLOSE and DELETE_PERSONAL_DATA, so pressing it refuses with `ACCOUNT_REQUEST_INVALID` («Permintaan itu tidak ditemukan atau sudah selesai.»).
- No data is at risk.

**Why Significant, not polish:**
- It is on the page every signed-in person opens to manage their account, in the section about leaving PINTAR, where trust matters most.
- It is a control with no words that can be pressed and then answers with an unrelated refusal.
- Reopening is a signed-out act (`/masuk/buka-kembali`), so a signed-in person must never be offered it.

**The smallest fix (client-only):** filter `REOPEN` out of the signed-in forms in `MeninggalkanPintar.tsx` (`JENIS_PERMINTAAN.filter((j) => j !== "REOPEN" && …)`). No words and no server change.
- **Test:** for a signed-in learner and a signed-in admin, the section offers exactly the CLOSE and DELETE_PERSONAL_DATA forms (or the learner's via-school sentence), and no element's text is «—».

**Placement:** I recommend it enter Z as a review finding. It removes a broken control and changes no approved behaviour. Bob decides between Z and bringing it to the owner. It is likely on staging today.
