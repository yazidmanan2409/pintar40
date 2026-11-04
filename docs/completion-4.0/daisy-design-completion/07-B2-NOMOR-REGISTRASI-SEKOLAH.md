# B2 / UX-09 · «Nomor Registrasi Sekolah»: implementation preparation (no code authorised) · 4 Nov 2026

**Authority:** owner, 4 Nov, «PINTAR 4.0 — OWNER RULING: B2 / UX-09 — APPROVED — Nomor Registrasi Sekolah» (D-174).
**The term:** **Nomor Registrasi Sekolah** / **School Registration Number**; short label **No. Registrasi Sekolah**; clarification «Nomor registrasi orang ini di sekolah tersebut. Berbeda dari ID PINTAR dan NIS/NISN.»

## 1. The data contract: verified (the ruling's one condition)

`supabase/migrations/20260926100000_a_school_gives_a_person_a_number.sql`:
- **`institutional_identities` holds the number on the pair (person × school):**
  - «INSTITUTIONAL IDENTITY: that person's relationship to ONE school»;
  - primary key `(person_id, institution_id)`;
  - «the same person may legitimately be ABC123456XY at one school and DEF000842K7 at another»;
  - «it is not a credential».
- **So the field identifies a person at a particular school**, not the school, not the person platform-wide, and not a class membership. **The approved term fits the data; no reopening is needed.**

**One neighbouring concept to keep apart:** the number's first three characters are the **school's namespace** (`institutions.namespace`), shown on Pendataan as **«Kode sekolah»**. That identifies the school itself, not a person. It keeps its own name. The explanation that a code «menjadi bagian dari» the number (`pendataan.kode.arti`) stays, with the new term.

| Identifier | Meaning | Where it lives |
|---|---|---|
| ID PINTAR | the person, across PINTAR schools | `persons.pintar_id` |
| **Nomor Registrasi Sekolah** | the person **at one school** | `institutional_identities.institutional_id` |
| Kode sekolah | **the school** (part of the number) | `institutions.namespace` |
| NIS / NISN | official student identifiers, outside PINTAR | not held by PINTAR as identity |
| Keanggotaan Kelas | membership of a class; not an identifier | `memberships` |

## 2. Every user-facing occurrence

**The copy table: 11 keys**, all on Pendataan and Aktivasi. The English uses three different words for one thing: «identity number», «school number», «school's number».

| Key | Indonesian today | English today |
|---|---|---|
| `pendataan.nomor.arti` | Nomor induk menandai seseorang di sekolah ini. Nomor itu tidak menyatakan apakah orangnya murid, guru, atau pimpinan. | An identity number marks a person at this school. It does not say whether that person is a student, a teacher or management. |
| `pendataan.kode.arti` | Kode ini menjadi bagian dari nomor induk yang dibuat PINTAR untuk setiap orang di sekolah ini. | This code becomes part of the identity number PINTAR creates for each person at this school. |
| `pendataan.kode.contoh` | Contoh nomor induk | Example identity number |
| `pendataan.kode.peringatan` | Setelah nomor induk pertama diterbitkan, kode ini tidak bisa diubah lagi. | Once the first identity number has been issued, this code can no longer be changed. |
| `pendataan.kode.beku` | Kode ini sudah dipakai pada nomor induk yang diterbitkan, jadi tidak bisa diubah lagi. | This code is already part of issued identity numbers, so it can no longer be changed. |
| `pendataan.masalah.orang_sudah` | Orang itu sudah punya nomor induk di sekolah ini. | That person already has an identity number at this school. |
| `pendataan.masalah.staf` | Peran guru dan staf tidak diberikan lewat pendataan massal. Kosongkan kolom Peran dan Tempat pada baris ini: orangnya tetap tercatat dengan nomor induk sekolah, dan perannya Anda berikan di Konfigurasi → Peran & akses. | Teacher and staff roles are not given through a bulk intake. Leave this row's Role and Place empty: the person is still recorded with the school's number, and you give the role in Konfigurasi → Roles & access. |
| `pendataan.pratinjau.nomor` | Nomor induk yang akan dibuat | Identity numbers to be created |
| `pendataan.percontohan.nyata` | Lima puluh orang ini sudah benar-benar tercatat, lengkap dengan nomor induknya. Ini bukan contoh. | These fifty people are genuinely recorded, each with their identity number. This is not a sample. |
| `aktivasi.tunggu.cari` | Cari nama atau nomor induk | Search by name or school number |
| `aktivasi.staf.arti` | Kartu kelas hanya untuk murid. Bila seorang murid menjadi staf, ubah kartunya menjadi akun email lebih dulu. Orangnya tetap sama: nomor induk, kelas dan semua hasil belajarnya tetap. Setelah ia mengaktifkan akun email itu, berikan perannya. | A class card is for learners only. When a learner becomes staff, turn their card into an email account first. They stay the same person: their PINTAR ID, classes and all their learning stay. Once they have activated that email account, give them their role. |

**Shown without a label** (the value only, so no word to change; the label, where one is added, uses the short label):
- Aktivasi's lists and forms: `FormAktivasi.tsx:205`, `KartuUlang.tsx:95`, `KartuJadiEmail.tsx:95`;
- the printed class-card sheet: `LembarKartu.tsx:47`;
- the search: `pemegang-kartu.ts:21` searches by the number; its placeholder is `aktivasi.tunggu.cari`.

**Not user-facing, not to be renamed:** the column `institutional_id`, the table `institutional_identities`, the TypeScript names (`nomorInduk`, `institutional_id`), the pending-intake field `institutional_ids_to_assign`, and the comments in migrations `20261218100000` and `20261224100000`.

**Checked and absent:** emails, reports, certificates, the Digital Card, Studio, the workbook.

## 3. Workbooks and templates: no backward-compatibility issue

- **The intake (Pendataan) reads CSV/TSV files whose columns the administrator maps** (`src/lib/pendataan-kontrak.ts`, `BacaDanPetakan.tsx`). There is no fixed header naming the number.
- **PINTAR generates the number** at intake; no file carries it in.
- **No previously issued template or school file names the term**, so nothing needs a version or an alias.
- **The Studio workbook** (X12) does not carry this number.
- **Printed class cards already in schools' hands** show the number without a label: they stay valid.

## 4. The replacement, once authorised: one change set

- The 11 keys, in both languages, to the approved term, the short label where space is short, and the clarification once, on Pendataan's «Kode sekolah» panel (B2's place). One English term throughout, **School Registration Number**: the three English variants are retired.
- Daisy's B2 composition gives the exact strings. Where a sentence's grammar needs it, the full term introduces and the short label follows (Terminology v1, ruling 2).
- **Unchanged:**
  - every issued number, its format (`NNN######SS`), its sequence and its uniqueness;
  - the database columns and relationships;
  - who may read or issue numbers;
  - every printed card;
  - the existing guard B4's «PINTAR ID» column check (`selftest/b4.test.ts:111`).

## 5. The focused cross-feature check (D-168, D-172)

One static test over the rendered copy table, both languages:
- no user-facing string says «nomor induk», «identity number» or «school number» for this concept;
- «Nomor Registrasi Sekolah» / «School Registration Number» (or the short label) is the only name for it;
- **the five identifiers are never confused:**
  - a string naming the ID PINTAR never calls it the registration number, and the reverse;
  - «Kode sekolah» stays the school's;
  - no string offers the number as the NIS / NISN;
  - «Keanggotaan» stays class membership.

One rendered check: Pendataan and Aktivasi show the same term, the same short label and the same clarification.
