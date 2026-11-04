# B2 · UX-09: «nomor induk» → **Nomor Registrasi Sekolah**

**Form T.** Register entry B2.
**Status: the owner's ruling, 4 Nov (final):**
- **Nomor Registrasi Sekolah** · **School Registration Number** · short label **No. Registrasi Sekolah**.
- It replaces the ambiguous «nomor induk» and my proposed «nomor anggota», wherever the field is a person's registration identifier at a particular school.
- This README applies it. B2 moves to DESIGN ACCEPTED once incorporated. Engineering's implementation and end-to-end verification are separate gates.

## The field's meaning, verified against the data contract

The ruling stands «subject only to verification of the field's existing data semantics». **Verified; no material difference.**
- `supabase/migrations/20260926100000_a_school_gives_a_person_a_number.sql` defines the number as an **«institutional identity», that person's relationship to ONE school**.
- It is not a new key for `persons`, «because the same person may legitimately be ABC123456XY at one school and DEF000842K7 at another … the identity lives on the PAIR».
- Format NNN######SS: NNN is the school's code («Kode sekolah», the institution's own namespace), then a number the school allocates, then two characters PINTAR generates.
- It identifies a **person at a school**, not the school: the school's identifier is the «Kode sekolah», a separate field with its own words, unchanged.

## The four identifiers, never interchangeable

| Identifier | Meaning | Its words |
|---|---|---|
| **PINTAR ID** | the person's permanent identity across PINTAR schools | «PINTAR ID», as the copy table writes it in 39 keys (the card, recovery, Akun saya). See the note below. |
| **Nomor Registrasi Sekolah** | the person's registration identifier at one school | «Nomor Registrasi Sekolah» / «No. Registrasi Sekolah» |
| **NIS / NISN** | the official student identifiers, separate from PINTAR | the school's and the nation's own names; PINTAR does not issue them |
| **Keanggotaan Kelas** | membership of one class, not an identifier | the class's own words (Pindah kelas, the rollover); never called a number |

**Note on «ID PINTAR».** The ruling's table and explanation write «ID PINTAR». The product's established term, on the frozen card, in account recovery and in Akun saya, is **«PINTAR ID»**, and «ID PINTAR» appears in no copy key.
- Under D-172 (one name for one thing), this README writes the explanation with **«PINTAR ID»**.
- A rename of the PINTAR ID itself is not part of this ruling. It would be an X12-scale terminology change for the owner and Dr Gladys.
- If the owner intends «ID PINTAR» everywhere, it is one consolidated change across those 39 keys, not a change here.

## The explanation, said where clarification is needed

> **«Nomor registrasi orang ini di sekolah tersebut. Berbeda dari PINTAR ID dan NIS/NISN.»**
> «This person's registration number at that school. Different from the PINTAR ID and the NIS/NISN.»

**Where:**
- **Pendataan's «Kode sekolah» panel** (`pendataan.nomor.arti`), the one place the number is explained, as the help line under the term;
- **as the help line under the label wherever the number is a form field or a search field** (Aktivasi's search).

Elsewhere the term alone.

## Every key (T table)

| Key | Indonesian | English | Kind |
|---|---|---|---|
| `pendataan.nomor.arti` | **Nomor registrasi orang ini di sekolah tersebut. Berbeda dari PINTAR ID dan NIS/NISN.** Nomor ini tidak menyatakan apakah orangnya murid, guru, atau pimpinan. | **This person's registration number at that school. Different from the PINTAR ID and the NIS/NISN.** It does not say whether that person is a student, a teacher or management. | CHANGED: the explanation, then the existing role sentence |
| `pendataan.kode.arti` | Kode ini menjadi bagian dari **nomor registrasi sekolah** yang dibuat PINTAR untuk setiap orang di sekolah ini. | This code becomes part of the **school registration number** PINTAR creates for each person at this school. | CHANGED |
| `pendataan.kode.contoh` | Contoh **No. Registrasi Sekolah** | Example **School Registration Number** | CHANGED (a label: the short form) |
| `pendataan.kode.peringatan` | Setelah **nomor registrasi sekolah** pertama diterbitkan, kode ini tidak bisa diubah lagi. | Once the first **school registration number** has been issued, this code can no longer be changed. | CHANGED |
| `pendataan.kode.beku` | Kode ini sudah dipakai pada **nomor registrasi sekolah** yang diterbitkan, jadi tidak bisa diubah lagi. | This code is already part of issued **school registration numbers**, so it can no longer be changed. | CHANGED |
| `pendataan.masalah.orang_sudah` | Orang itu sudah punya **nomor registrasi sekolah** di sekolah ini. | That person already has a **school registration number** at this school. | CHANGED |
| `pendataan.masalah.staf` | … orangnya tetap tercatat dengan **nomor registrasi sekolah**, dan perannya Anda berikan di Konfigurasi → Peran & akses. | … still recorded with a **school registration number**, … | CHANGED (the term only) |
| `pendataan.pratinjau.nomor` | **No. Registrasi Sekolah** yang akan dibuat | **School Registration Numbers** to be created | CHANGED (a heading: the short form) |
| `pendataan.percontohan.nyata` | … lengkap dengan **nomor registrasi sekolahnya**. Ini bukan contoh. | … each with their **school registration number**. … | CHANGED |
| `aktivasi.tunggu.cari` | Cari nama atau **no. registrasi sekolah** | Search by name or **school registration number** | CHANGED (one English term, not «school number»), with the explanation as its help line |
| `aktivasi.staf.arti` | … Orangnya tetap sama: **nomor registrasi sekolah**, kelas dan semua hasil belajarnya tetap. … | … the same **school registration number**, … | CHANGED (the term only) |

**Usage:**
- **The full form** in running text, lowercase within a sentence («nomor registrasi sekolah»);
- **the short form «No. Registrasi Sekolah»** for a label, a column or table heading, a field, and search;
- **the English** «School Registration Number» in labels, «school registration number» in running text.

## Workbooks, exports and identifiers

- **The intake workbook has no column for this number.** PINTAR creates it; the intake's recognised headers are name, person, class, role and programme (`pendataan-kontrak.ts` `PETUNJUK`). No sheet or header changes.
- **Any export, template or help text that names the number** takes «No. Registrasi Sekolah» as its column heading. A template's change goes into its **next version** (X12's versioning and compatibility rule), never in place.
- **Unchanged:**
  - the identifier's values and format (NNN######SS);
  - every database column and relationship;
  - the identity permissions;
  - «Kode sekolah», «PINTAR ID», NIS/NISN.

## Acceptance checklist

- [auto] Every key above carries «Nomor Registrasi Sekolah» in the form given (full form in sentences, «No. Registrasi Sekolah» in labels), in both languages. No user-facing «nomor induk» or «nomor anggota» remains.
- [auto] The explanation appears in `pendataan.nomor.arti` and as the help line of Aktivasi's search, and nowhere it isn't needed.
- [auto] The term is never shown where the value is the PINTAR ID, a NIS/NISN, the school's «Kode sekolah», or a class membership.
- [auto] No identifier value, format, column or permission changes; the intake workbook is unchanged.
- [manual] The owner's choice between «PINTAR ID» (the product's term, used here) and «ID PINTAR» (the ruling's wording) recorded, if a change is intended (X12-scale).
- [auto] **D-172:** equivalent interactions match their canonical pattern (`../X-KONSISTENSI/`): one name for one thing across Pendataan, Aktivasi and exports; the explanation as a field's help line (FormLayout).
