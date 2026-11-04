# B2 · UX-09: «nomor induk» (W2.13)

**Form T (the term, its one differentiating sentence, and where it appears).** Register entry B2.
**Rule:** «Name PINTAR's school number so it cannot pass for the NIS, and say once how it differs from the PINTAR ID. Settle in the identity copy (DAISY-20/24)» (UXR:23, owner Daisy).
**Built today, at 0b19707:** «nomor induk» / «identity number», at `hle.ts:2746, 2751, 2753, 2757, 2759, 2801, 2811, 2817, 2832, 4320, 4463`. Shown on `/pendataan` (the school code, the preview, the problems) and in Aktivasi's search.
**Decides:** D. **G3 if Dr Gladys rules it a protected institutional term** (D-135(c)): then final terminology acceptance waits on her.

---

## The problem

- **«Nomor induk» is what an Indonesian school calls the NIS** (Nomor Induk Siswa). A school administrator reading «nomor induk» on PINTAR expects the student's NIS, the number the school already gave. PINTAR's number is neither that nor the NISN.
- **It is not only a student's:** a teacher and the leadership get one too («tidak menyatakan apakah orangnya murid, guru, atau pimpinan»).
- **It is not the PINTAR ID either.** A PINTAR ID is the person's own, the same in every school. This number marks the person at one school and carries that school's code.
- **The English** «identity number» and «school number» (two words for one thing, `aktivasi.tunggu.cari`) don't settle it either.

## The name

**«nomor anggota»** · English **«member number»**
- **Why:** it says what the number marks, a person's membership of this school, whatever their role. It cannot be read as the NIS, which is a student's number («induk siswa»).
- It shares nothing with «PINTAR ID».
- It fits the school's own word for the people it holds.
- **Considered and not chosen:**
  - «nomor PINTAR»: it would pass for the PINTAR ID;
  - «nomor sekolah»: it would pass for the school's own code;
  - «nomor pendataan»: it names where the number is made, not what it marks.

## The one differentiating sentence

It is said **once**, where the number is explained: Pendataan's «Kode sekolah» panel (`pendataan.nomor.arti`). Everywhere else the term alone is used.

> **«Nomor anggota menandai seseorang di sekolah ini, apa pun perannya. Nomor ini bukan NIS atau NISN, dan bukan PINTAR ID: PINTAR ID milik orangnya sendiri dan sama di sekolah mana pun.»**
> «A member number marks a person at this school, whatever their role. It is not the NIS or the NISN, and it is not the PINTAR ID: a PINTAR ID is the person's own, the same at every school.»

## Every key (T table)

| Key | Indonesian | English | Kind |
|---|---|---|---|
| `pendataan.nomor.arti` | **the sentence above** | **the sentence above** | CHANGED · the one place it is said |
| `pendataan.kode.arti` | Kode ini menjadi bagian dari **nomor anggota** yang dibuat PINTAR untuk setiap orang di sekolah ini. | This code becomes part of the **member number** PINTAR creates for each person at this school. | CHANGED |
| `pendataan.kode.contoh` | Contoh **nomor anggota** | Example **member number** | CHANGED |
| `pendataan.kode.peringatan` | Setelah **nomor anggota** pertama diterbitkan, kode ini tidak bisa diubah lagi. | Once the first **member number** has been issued, this code can no longer be changed. | CHANGED |
| `pendataan.kode.beku` | Kode ini sudah dipakai pada **nomor anggota** yang diterbitkan, jadi tidak bisa diubah lagi. | This code is already part of issued **member numbers**, so it can no longer be changed. | CHANGED |
| `pendataan.masalah.orang_sudah` | Orang itu sudah punya **nomor anggota** di sekolah ini. | That person already has a **member number** at this school. | CHANGED |
| `pendataan.masalah.staf` | … orangnya tetap tercatat dengan **nomor anggota**, dan perannya Anda berikan di Konfigurasi → Peran & akses. | … the person is still recorded with a **member number**, … | CHANGED (only the term; «nomor induk sekolah» becomes «nomor anggota») |
| `pendataan.pratinjau.nomor` | **Nomor anggota** yang akan dibuat | **Member numbers** to be created | CHANGED |
| `pendataan.percontohan.nyata` | … lengkap dengan **nomor anggotanya**. Ini bukan contoh. | … each with their **member number**. This is not a sample. | CHANGED |
| `aktivasi.tunggu.cari` | Cari nama atau **nomor anggota** | Search by name or **member number** | CHANGED (one English word, not two) |
| `aktivasi.staf.arti` | … Orangnya tetap sama: **nomor anggota**, kelas dan semua hasil belajarnya tetap. … | … the same **member number**, … | CHANGED (only the term) |

**Not changed:**
- **the intake workbook's column header**, if it names the number: a template change for every school. That is X12's consolidated, versioned decision, not this table's.
- **database identifiers.**
- **«Kode sekolah»** (the school's own code) and **«PINTAR ID»**: separate things, whose words stand.

## Where it is never shown

- where the value is the **PINTAR ID** (Akun saya, the card, the activation email): that is «PINTAR ID»;
- where the value is a school's **NIS or NISN**, if a school records one: that is the school's own number, by its own name.

## Decisions it depends on

- **G3**, only if Dr Gladys rules «nomor anggota» a protected institutional term. Then the term's final acceptance waits on her; the sentence's place and the keys don't change.
- The workbook header (if any) follows X12.

## Acceptance checklist

- [auto] Every key above carries «nomor anggota» / «member number», in both languages; no user-facing «nomor induk» remains.
- [auto] The differentiating sentence appears once, in `pendataan.nomor.arti`, on Pendataan's «Kode sekolah» panel.
- [auto] The term is never shown where the value is the PINTAR ID, or a NIS/NISN.
- [manual] G3's ruling recorded, if Dr Gladys takes it.
- [auto] **D-172:** equivalent interactions match their canonical pattern (`../X-KONSISTENSI/`): one name for one thing across Pendataan and Aktivasi (no interaction changes).
