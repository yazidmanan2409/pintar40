# PINTAR Terminology v1

**Status: FROZEN, 30 Sep 2026, by Yazid (D-068). PINTAR Terminology v1 is canonical.** Nothing is implemented yet: application strings change during UI/UX POLISHED (D-052).

**Built from:**

- the proposal, `TERMINOLOGY-V1-PROPOSAL.md`;
- the change-impact list, `TERMINOLOGY-V1-CHANGE-IMPACT.md` (187 rows);
- Yazid's 24 rulings of 30 Sep on that list's open questions (§8).

**Now that it is frozen:**

- This is PINTAR Terminology v1, and the dictionary in `design/PINTAR-DESIGN-SKILL-SPEC.md` §8.
- Daisy applies the change set during UI/UX POLISHED. Strings held in migrations or seeds (§3) need Bob.
- Nothing is applied before then.

## The governing principle

> **Consistency means one meaning has a stable name. It does not mean one word must be used mechanically in every context.**
>
> Preserve natural Bahasa Indonesia. Full canonical terms establish identity and resolve ambiguity. Natural short forms may be used once the context is clear.

**The rule Daisy is given:** these are PINTAR's words. Use them consistently. If they don't work on a real screen, raise the problem; don't quietly invent another word.

---

## 1. The canonical dictionary

| Concept | Canonical term | Also right (short form or context) | Replace (when it means this concept) | Keep distinct from |
|---|---|---|---|---|
| School | **Sekolah** | «untuk sekolah secara keseluruhan» where the whole school is meant | institusi (ordinary UI) | the structure unit Tingkat |
| Learner | **Murid** | | siswa, peserta didik | **Peserta** (participants in a measurement) |
| Teacher | **Guru** | | pengajar, pendidik, edukator | |
| Leadership (umbrella) | **Pimpinan** | | | |
| Roles | **Murid · Guru · Kepala departemen · Dekan · Admin sekolah · Admin platform** (where the formal role matters to understanding or authorization) | in a help or recovery context, «yang mengurus PINTAR di sekolah Anda»; a human description where the person has no role yet, e.g. «pengelola pertama sebuah sekolah» | kepala program, pengelola sistem, administrator sekolah, pengelola data sekolah, staf pengelola isi | |
| Person / account | **Orang** / **Akun** | address the person («Anda») where the data-model distinction does not help | | each other |
| Structure | **Bagian · Tingkat · Kelas** (capitalised, structural) | ordinary lowercase «bagian» ("part": bagian dari, bagian akhir) | | |
| A leader's scope, shared copy | **lingkup** («lingkup yang Anda pimpin», «lingkup ini») | «Bagian» where only a Kepala departemen's Bagian is meant | «bagian sekolah» as a scope shared with Dekan | |
| Studio object | **Paket Pembelajaran** | **paket** once the context is clear; the package's title | kursus (Studio object) | materi |
| Contents of a package | **isi** (Susun isi · Periksa isi · Setujui isi) | | | |
| Learning material | **Materi** (incl. «menyusun materi», «Materi Uji Cepat») | | bahan | Paket Pembelajaran |
| Workbook / import format | **Kursus** (the sheet, the import structure, «Buka kursus» right after import) · **Paket Terstruktur** (JSON) | | | Paket Pembelajaran |
| Curriculum | **kurikulum** (sekolah, akademik) | | | |
| Chapter · lesson · reading | **Bab · Pelajaran · Bacaan** (Peta Bacaan, posisi bacaan, bagian bacaan) | | | |
| Assessment item | **Soal** | | butir (rewrite the sentence where a swap reads badly) | **Pertanyaan**: the wording inside a soal, or a question asked of people (feedback) |
| Assessment (generic) | **asesmen** (Aturan Asesmen, asesmen resmi) | | penilaian, **only** where it means the assessment object | penilaian = evaluation or judgement («bukan penilaian») |
| PRE_TEST · POST_TEST · QUICK · STANDALONE · PAPER (shown) | **Pemetaan Awal · Uji Penguasaan · Uji Cepat · Asesmen Mandiri · Tes di Kertas** | **pemetaan** once the context is clear | Penilaian awal/akhir/cepat/mandiri, Lembar kertas | the workbook marks below |
| Workbook marks (authoring contract) | **Pemetaan awal · Cek penguasaan** (D-008) | | | the names learners see |
| Other modes | **Tes · Ujian · Latihan · Peragaan publik** | | | |
| Publish · release · approve | **Terbitkan · Terbitan · Setujui / Persetujuan** | | | |
| Save · loading | **Simpan / Tersimpan · Memuat…** (page, data) **· Sedang…** (an operation) | | | selesai |
| Check · review | **Periksa** (checking) · **Tinjau** (human review) | | | |
| Evidence family | **Bukti · Hasil · Laporan · Ringkasan · Angka** (distinct concepts) | | | each other |
| Readiness | **Kesiapan · Siap · Belum siap** | | | |
| Feedback | **Umpan balik · Putaran umpan balik** | **Putaran** once the context is clear | | |
| Sign in / out | **Masuk · Keluar** | **Keluar dari peragaan** where it does not sign out | | |
| Email | **Email** | | surel | |
| Admin workspaces | **Konfigurasi · Pendataan** | | | **Pengaturan** (real settings only) |
| Homes and places | **Belajar · Mengajar · Pimpinan · Konfigurasi · Pendataan · Sertifikat · Halaman awal · Studio**; «Perjalanan belajar» where the learning cycle needs a destination name | the doors on `/` stay first-person sentences («Saya mau belajar» …) | «Kelas» as the teacher's home tab; Studio's «Beranda» | |

## 2. Semantic and context rules

1. **One meaning, one stable name.** Not one word everywhere. A word that also has an ordinary meaning keeps it; «bagian dari», «bagian akhir» and «paket ini» stay.
2. **Full term, then short form.** Use the full canonical term to introduce a concept, in headings, at a boundary, or where it would be ambiguous. Use the natural short form after that.
3. **Name the role only when the reader needs it.**
    - **Formal permission context:** *Admin sekolah* (the canonical role name), where the role matters to the reader's understanding or authorization.
    - **Help and recovery context:** «yang mengurus PINTAR di sekolah Anda».
    - **A person with no role yet:** a human description.
4. **Refusals explain the problem and the next action; they do not recite RBAC.** For example: «Anda tidak memiliki akses ke Studio.»
5. **Don't expose the data model.** Where orang vs akun doesn't matter to the reader, speak to the person.
6. **The authoring contract may differ from what learners see.** The workbook marks stay «Pemetaan awal» / «Cek penguasaan»; learners meet «Pemetaan Awal» / «Uji Penguasaan».
7. **Don't force one noun across two authorities.** Copy shared by Kepala departemen and Dekan says «lingkup», not «bagian sekolah».
8. **Substitute only when the meaning survives.** Otherwise rewrite the sentence (e.g. «butir» → «soal»).
9. **Technical and diagnostic language stays precise** (the schema-health lines).
10. **Data is not terminology.** Seed and display names are left alone. An evaluation persona takes the canonical role name where it represents a role.
11. **Capitalisation:** the structural Bagian · Tingkat · Kelas, the assessment names, Paket Pembelajaran, and the role names as written in §1.
12. **Navigation grammar:**
    - A destination is a short noun or name.
    - A heading may be a human question or purpose.
    - An action is a verb plus its object.
    - «Kembali» names its destination only where that is ambiguous.
    - A doorway on `/` may be a first-person sentence.
    - A creation destination may keep an action name («Buat Paket»).
    - The same label in two places is fine when it is the same concept (Sertifikat, Uji Cepat) or an action (Lihat seperti murid).
13. **Not every language problem is terminology.** Rendering, persona, information-architecture and technical-display issues go to the UX polish register (§5), not into this dictionary.

## 3. The approved change set

Row IDs are the change-impact list's. The disposition follows Yazid's rulings (§8). Nothing is implemented.

### A. Assessment vocabulary

- **Approved as drafted:**
    - A1–A13 (A3 also brings Studio back to D-015's «Uji Cepat»);
    - A14 and A15, first use only («Materi ini belum punya Pemetaan Awal / Uji Penguasaan»); the second use is the workbook mark and stays.
- **Retained (ruling 1, workbook marks):** A16–A21.
- **Retained (ruling 2, short form):** A22 «Pemetaan selesai.» and A23 «Selesaikan pemetaan».
- **New from ruling 3 (other modes):**
    - N1: `jenis.mode.TEST` «Penilaian» → **«Tes»** (hle.ts:1412).
- **New from ruling 4 (generic «asesmen»).** Checked in context: only where the word means the assessment object.

  | # | Current | Proposed | Key (hle.ts) |
  |---|---|---|---|
  | N2 | «Penilaian» (bank type TEST) | «Asesmen» | 1405 `jenis.bank.TEST` |
  | N3 | «Berpindah dari layar penilaian» | «Berpindah dari layar asesmen» | 1416 |
  | N4 | «…mengerjakan penilaian di kelas ini.» | «…mengerjakan asesmen di kelas ini.» | 1427 |
  | N5 | «…mengerjakan penilaian di sekolah ini.» | «…mengerjakan asesmen di sekolah ini.» | 1443 |
  | N6 | «Penguasaan murid ini pada tiap penilaian.» | «…pada tiap asesmen.» | 1461 |
  | N7 | «…menyelesaikan penilaian pertamanya.» | «…menyelesaikan asesmen pertamanya.» (it means any official assessment: `SYARAT_METRIK` «penilaian», `src/components/bukti/muncul.ts`) | 2165 |
  | N8 | «Ringkasan dibaca dari penilaian resmi murid. …» | «…dari asesmen resmi murid. …» | 2178 |
  | N9 | «Aturan Penilaian» (tab and heading) | «Aturan Asesmen» | 2451, 2603 |
  | N10 | «Mengerjakan penilaian» (tour) | «Mengerjakan asesmen» | 2802 |
  | N11 | «Penilaian yang jendelanya masih terbuka, … Angka ini hitungan, bukan penilaian.» | «Asesmen yang jendelanya masih terbuka, … Angka ini hitungan, bukan penilaian.» (the second use is judgement and stays) | 2819 |
  | N12 | «Saat ada penilaian yang jendelanya terbuka, …» | «Saat ada asesmen yang jendelanya terbuka, …» | 2820 |

- **Kept as judgement or evaluation («penilaian» stays):**
    - «hitungan, bukan penilaian» (3167);
    - «penilaian per soal» (3193, 3210);
    - «Bukan peringkat, bukan penilaian» (3214).

### B. Role names

- **Approved as drafted:** B3, B6, B7, B8, B9, B15.
- **Approved, modified:**
    - **B1** `config.refused` → «Halaman ini hanya untuk Admin sekolah atau Admin platform.» Aligned with ruling 5's «atau». It corrects a false sentence.
    - **B2** `pimpinan.ditolak` → «Halaman ini untuk Kepala departemen dan Dekan, dalam lingkup yang mereka pimpin.» (ruling 19)
    - **B4** `aktivasi.ditolak` → «Halaman ini untuk Admin sekolah atau Admin platform.» (ruling 5)
    - **B5** `studio.refused` «Halaman ini untuk staf pengelola isi. Akun Anda belum memiliki akses ke Studio.» → «Anda tidak memiliki akses ke Studio.» (ruling 5). The next-action sentence comes from the shared refusal page.
    - **B14** `laporan.templat.tak_berwenang` → «Menyusun templat laporan memerlukan wewenang Admin sekolah atau Admin platform.» (ruling 7). Verified: `CAN_MANAGE_REPORT_TEMPLATES` is held by INSTITUTION_ADMIN and SYSTEM_ADMIN only (`role_capabilities`, migration 20260926100000).
    - **B10** `entry.kosong` → «…Hubungi yang mengurus PINTAR di sekolah Anda.» (Yazid's final ruling on §7.7). With C32, the whole line reads «Anda belum terhubung dengan kelas atau tugas apa pun. Hubungi yang mengurus PINTAR di sekolah Anda.»
    - **B16** evaluation personas `Penelaah & Penerbit` → «Kepala departemen», `Pimpinan Sekolah` → «Dekan» (ruling 7). This also corrects an inaccuracy: a Kepala departemen does not hold CAN_PUBLISH (HOD-10).
- **Retained:**
    - B11 «pengelola sekolah» and B12 «yang mengurus PINTAR di sekolah Anda» (ruling 6);
    - B13 «pengelola pertama sebuah sekolah» (ruling 7);
    - B17 seed names (ruling 7, data).

### C. People and school

- **Approved as drafted:** C1–C14 («siswa» / «peserta didik» → «murid»), C17–C25 («pengajar» / «pendidik» → «guru»), C26, C27, C29, C30.
- **Approved, modified:**
    - **C28** `pimpinan.batas` «…penafsiran tingkat institusi. …» → «…penafsiran untuk sekolah secara keseluruhan. …» (ruling 9).
    - **C32** «Akun Anda belum terhubung dengan kelas atau tugas apa pun. …» → «Anda belum terhubung dengan kelas atau tugas apa pun. …» (ruling 11).
    - **C33** «Akun Anda belum dipasangkan dengan kelas mana pun.» → «Anda belum dipasangkan dengan kelas mana pun.» (ruling 11).
- **Retained:**
    - C15 (schema-health, ruling 10);
    - C16 «Peserta» (ruling 8);
    - C31 seed names (ruling 7).

### D. Content vocabulary (short-form rule)

- **Approved, modified to the short form (ruling 2).** In Studio sentences the object is already clear, so «kursus» → **«paket»**, not the full term:
    - D1–D9, D11–D15, D17–D21, D23;
    - for example D2 «Paket ini maju ke langkah berikutnya.», D5 «Penyusun paket tidak dapat diganti.», D23 `Bank soal untuk paket ini`.
- **Approved with the full term where it introduces the concept or marks a boundary:**
    - **D10** «Terbitan adalah versi Paket Pembelajaran yang nanti dipakai murid. Terbitan dibuat dari paket yang sudah disetujui.»
    - **D16** «…Unggahan menjadi Paket Pembelajaran sekolah, bukan pustaka platform.»
    - **D22** «Terbitan dibuat dari Paket Pembelajaran sekolah, bukan dari pustaka nasional.»
- **Approved:** D43 «Bahan Uji Cepat» → «Materi Uji Cepat» (ruling 14).
- **Retained:**
    - D24 «Buka kursus» and D25 (ruling 14);
    - D26–D37, where the short form «paket» already stands (ruling 2);
    - D38–D40, the JSON and upload format (ruling 13);
    - D41 «Buat Paket» (ruling 22);
    - D42 «menyusun materi» and D44–D45 kurikulum (ruling 14);
    - D46 schema-health (ruling 10);
    - D47 the tenant name;
    - D48–D49 «isi» (ruling 12), with any «kursus» inside them following the D1 rule, e.g. D4 «Isi paket belum dikunci…»;
    - D50–D55, workbook format terms.

### E. Other dictionary items

- **Approved as drafted:** E1–E9 («surel» → «email»), E10 player progress «Pertanyaan» → «Soal», E11–E15 («butir» → «soal»).
- **Approved, rewritten (ruling 16):** **E16** `kesehatan.catatan_paparan` → «Soal wajib selalu disertakan dalam setiap asesmen, jadi jawabannya terkumpul lebih cepat dan soal itu lebih dulu muncul di daftar ini. Urutan ini menunjukkan seberapa sering soal ditampilkan, bukan mutunya.»
- **Approved, ruling 19 (shared leadership copy, 13 strings; T1 numbers from the inventory):**

  | T1 | Current | Proposed |
  |---|---|---|
  | #542 | «…untuk bagian sekolah ini.» | «…untuk lingkup ini.» |
  | #544 | = B2 | |
  | #557, #705 | «Belum ada kelas di bagian ini.» | «Belum ada kelas dalam lingkup ini.» |
  | #569 | «Bagian sekolah yang Anda pimpin» (h2) | «Lingkup yang Anda pimpin» |
  | #570 | «Bagian sekolah» (aria-label) | «Lingkup» |
  | #576 | «Murid pada bagian ini» | «Murid dalam lingkup ini» |
  | #577 | «…pada bagian ini.» | «…dalam lingkup ini.» |
  | #589, #592 | «…pada bagian sekolah ini.» | «…dalam lingkup ini.» |
  | #590 | «…dengan pendidik di bagian ini, …» | «…dengan guru dalam lingkup ini, …» (with C25) |
  | #704 | «Kelas di bagian ini» | «Kelas dalam lingkup ini» |
  | #731 | «…di bagian ini.» | «…dalam lingkup ini.» |

    - Retained from E30: #58, the role form's «bagian sekolah», an ordinary use (ruling 18); #159, the door on `/` (ruling 21).
- **Retained:**
    - E17, E18 «pertanyaan» (ruling 15);
    - E19 «putaran»;
    - E20–E22 Peta Bacaan, posisi bacaan, bagian bacaan (ruling 17);
    - E24–E29, ordinary «bagian» (ruling 18).
- **Moved to the register:** E23 «Penguasaan per bagian», with the objective codes on the same rows (UX-41).

### F. Navigation

- **Approved:**
    - **F2** «Pembelajaran Saya» → «Belajar».
    - **F7** the teacher's home tab and back link «Kelas» → **«Mengajar»** (ruling 20, D-010). The door «Saya mengajar» stays.
    - **F10** the Konfigurasi link «Menambahkan orang» → «Pendataan». The page's h1 stays.
    - **F25:** Studio's «Beranda» → **«Studio»**.
    - **F4:** the learner's «Beranda» back link → «Belajar».
    - **F18:** `/` is «Halaman awal». The refusal's back button (today the h1 «Mau ke mana hari ini?») reads «Ke halaman awal», as on the error and not-found pages. The h1 on `/` stays.
- **Retained:**
    - F1, F3, F8 and F9 (the doors, ruling 21), F5 (a heading may state a purpose), F6, F11;
    - F12 «Sertifikat» (its refusal back target goes to the register, UX-46);
    - F13 «Perjalanan belajar»;
    - F14 «Buat Paket»;
    - F15 the package title, else «Paket»;
    - F16, F17, F19–F24;
    - F26–F28, shared labels (ruling 22), with C8 «Lihat seperti murid»;
    - F29, applied case by case by the grammar.

### Counts

Of the change-impact list's 187 rows:

| Section | Approved (as drafted or modified) | Retained on purpose | To the register | Rows |
|---|---|---|---|---|
| A | 15 | 8 | 0 | 23 |
| B | 13 | 4 | 0 | 17 |
| C | 30 | 3 | 0 | 33 |
| D | 24 | 31 | 0 | 55 |
| E | 17 | 12 | 1 (E23) | 30 |
| F | 6 | 23 | 0 | 29 |
| **Total** | **105** | **81** | **1** | **187** |

- E30 counts as one approved row. It covers the 13 scope strings in the table above.
- F12 is retained (the name «Sertifikat»), and its refusal back target goes to the register as UX-46.
- **New rows from the rulings:** N1–N12 (N9 covers two strings).

## 4. Exceptions intentionally retained

| Retained | Why (ruling) |
|---|---|
| Workbook marks «Pemetaan awal» / «Cek penguasaan», the parser's values, the template, Lana's workbooks | The authoring contract, D-008 (1) |
| «pemetaan», «paket», «putaran» as short forms | Context established (2) |
| Tes · Ujian · Latihan · Peragaan publik | Natural, established names (3) |
| «penilaian» meaning evaluation or judgement | Not the assessment object (4) |
| «yang mengurus PINTAR di sekolah Anda», «pengelola sekolah» | Human wording where the reader may not know the role (6) |
| «pengelola pertama sebuah sekolah» | The person has no role yet (7) |
| Seed and display names | Data, not terminology (7) |
| «Peserta» (metric) | Participants in the measurement, not all murid (8) |
| Schema-health lines | Diagnostic precision (10) |
| Studio «isi» (Susun · Periksa · Setujui isi) | Concise and accurate (12) |
| JSON «paket», «Paket Terstruktur» | A format, not the Studio object (13) |
| «Buka kursus» after import, «Buku kerja sudah menjadi kursus, bab…», «menyusun materi», «kurikulum sekolah / akademik» | The workbook structure and natural usage (14) |
| «pertanyaan» (feedback questions; a soal's stem) | Soal = item, pertanyaan = wording or a question to people (15) |
| Peta Bacaan, posisi bacaan, bagian bacaan | The learner's experience (17) |
| Ordinary «bagian» (bagian dari, bagian akhir, bagian yang perlu dibaca) | Natural Bahasa (18) |
| First-person doors on `/` | A doorway, not navigation (21) |
| «Buat Paket»; «Sertifikat» and «Uji Cepat» in two places; «Lihat seperti murid» twice | A creation destination; the same concept; an action (22) |

## 5. UI/UX polish items found during the review (to the register, not v1)

**Already in the register:**

- **UX-25:** English that is never shown. Now 203 strings plus 18 shown only on some screens (was 199). Rendering.
- **UX-17:** database column names in Studio findings. Technical display.
- **UX-20:** release version numbers. Technical display.

**New rows** (added to `UX-POLISH-REGISTER.md` as UX-41 to UX-47):

- **UX-41:** topic rows on the teacher's evidence page show objective codes («MTK5-P1») under «Penguasaan per bagian». This is the rest of UX-29 after DAISY-25, and visible since BOB-37 (audit #52).
- **UX-42:** identifiers on screen: UUID prefixes, enum values, metric ids, audit action codes.
- **UX-43:** the workbook guidance prints the decision id «D-008».
- **UX-44:** «Program» shown as a field although D-006/D-027 hide it. Information-architecture residue (ruling 23).
- **UX-45:** persona mismatch (ruling 24).
    - A teacher refused on a class page reads the learner's line «Jika ini keliru, tanyakan kepada guru Anda»: `HalamanPenolakan` with persona `educator` falls back to `tolak.arti`'s learner default.
    - The Uji Cepat refusals use a different, staff line.
- **UX-46:** the refusal on a certificate page goes back to «Belajar», not to Sertifikat.
- **UX-47:** English terms have their own drift: student / learner, teacher / educator, school / institution. v1 covers Indonesian only.

**Existing rows that v1 resolves once implemented:**

- UX-10: surel / email (E1–E9);
- UX-13: one noun across Studio (D, short-form rule);
- UX-18: murid / siswa (C).

**UX-19 is not resolved by v1:** three verbs for assigning (Tugaskan / Siapkan / Sediakan). None of the rulings decides it, so it stays in the register.

## 6. Canonical decisions whose wording v1 supersedes (applied in `DECISIONS.md`, 30 Sep)

| Decision | Today | Amendment proposed with the freeze |
|---|---|---|
| **D-014** | "All user-visible words live in `src/lib/hle.ts`. Daisy owns the wording…" | Add: "within PINTAR Terminology v1. A change to a canonical term or rule is Yazid's; a term that does not fit a real screen is raised, not replaced." |
| **D-019** | Quotes the button «Aktifkan dengan surel» | The displayed wording becomes «Aktifkan dengan email» (E3); the decision's meaning is unchanged |
| D-008 | The workbook marks *Pemetaan awal* / *Cek penguasaan* | **No change**, kept (ruling 1). A clarifying note: learners see «Pemetaan Awal» / «Uji Penguasaan» |
| D-010 | Guru → Mengajar | **No change.** v1 applies it: the tab «Kelas» becomes «Mengajar». This supersedes DAISY-03's label choice, a board convention, not a decision |
| D-006 | "Screens show only Bagian, Tingkat and Kelas" | **No change.** A clarifying note: lowercase «bagian» in its ordinary sense is not the structure unit; shared leadership copy says «lingkup» |
| D-015 | "Uji Cepat" everywhere | **No change.** A3 restores it on the Studio definitions page |

## 7. Points applied by the coordinator's reading: ruled 30 Sep (D-068)

These followed from the rulings but were not stated word for word. Yazid ruled on each:

1. «atau» rather than «dan» in B1 (matching ruling 5's B4).
2. «lingkup» wording in B2 and the 13 scope strings (ruling 19's «lingkup yang Anda pimpin», extended to «lingkup ini»).
3. TEST mode → «Tes» (ruling 3), and bank type TEST → «Asesmen» (ruling 4). They are two different things.
4. Short form «paket» for D1–D23, with the full term only in D10, D16 and D22.
5. The learner's «Beranda» back link → «Belajar» (from "reserve Belajar for learner home").
6. The refusal back button → «Ke halaman awal» (from "`/`: Halaman awal").
7. **Adjusted:** B10 on `/` reads «Hubungi yang mengurus PINTAR di sekolah Anda». `/` is the human doorway into PINTAR. *Admin sekolah* is kept for contexts where the formal role matters to understanding or authorization.

Points 1–6: **confirmed** as written.

**Frozen 30 Sep 2026 (D-068).**

---

## 8. Annex: Yazid's rulings on the 24 questions (30 Sep)

1. **Workbook marks:** keep. User-facing names stay Pemetaan Awal / Uji Penguasaan.
2. **Short forms:** yes, once the concept is established or the context is unambiguous. Full term for introductions, headings, ambiguity and boundaries.
3. **Other modes:** keep the natural, established names Tes, Ujian, Latihan, Peragaan publik.
4. **Generic assessment:** «asesmen» (Aturan Asesmen, asesmen resmi). Don't replace «penilaian» where it means evaluation or judgement; inspect «penilaian pertamanya» in context.
5. **Refusal roles:**
    - /aktivasi: «Admin sekolah atau Admin platform».
    - Studio: «Anda tidak memiliki akses ke Studio.» Explain the problem and the next action; don't recite RBAC.
6. **Unnamed helpers:** keep «yang mengurus PINTAR di sekolah Anda» (and «pengelola sekolah» where appropriate) where the reader may not know the formal role.
7. **Other role phrases:**
    - «pengelola pertama sebuah sekolah» stays descriptive.
    - «pengelola institusi» becomes the actual authorized role once verified.
    - Evaluation personas use canonical role names where they represent roles.
    - Seed names are data; leave them alone.
8. **«Peserta»:** keep.
9. **«tingkat institusi»:** «untuk sekolah secara keseluruhan», avoiding a collision with Tingkat.
10. **Schema-health lines:** keep technical.
11. **Orang vs akun:** remove «Akun» from the two sentences («Anda belum terhubung…», «Anda belum dipasangkan…»).
12. **Studio «isi»:** keep.
13. **JSON «paket»:** keep as format language; «Paket Terstruktur» stays.
14. **Studio / course boundary:**
    - «Buka kursus» after import may stay; «Buku kerja sudah menjadi kursus, bab…» stays.
    - «menyusun materi» stays.
    - «Bahan Uji Cepat» → «Materi Uji Cepat».
    - «kurikulum sekolah / akademik» stay.
15. **«pertanyaan»:** for feedback questions and a soal's wording. Soal = assessment item.
16. **«butir» → «soal»:** rewrite the sentence rather than substitute mechanically.
17. **Peta Bacaan:** keep, together with posisi bacaan and bagian bacaan.
18. **Ordinary «bagian»:** keep. The blanket avoidance is withdrawn.
19. **Management scope:** don't force one noun across two authorities; «lingkup yang Anda pimpin» in shared copy.
20. **Teacher home:** «Mengajar» (D-010 wins).
21. **Home doors:** keep the first-person sentences.
22. **Destination names:**
    - «Sertifikat»;
    - «Perjalanan belajar» where a destination name is required;
    - «Buat Paket» acceptable;
    - package detail: the title, else «Paket»;
    - `/`: «Halaman awal»;
    - Studio's «Beranda» → «Studio»;
    - shared «Sertifikat», «Uji Cepat» and «Lihat seperti murid» are fine.
23. **«Program»:** record for UI/UX POLISHED; not in v1.
24. **Uji Cepat refusal persona mismatch:** a UI/UX defect, not terminology. Educators get educator-appropriate recovery wording.

**Section verdicts:**

- A: approve, subject to 1–4.
- B: approve with the contextual human wording of 5–7.
- C: approve with «Peserta» retained and the account sentences corrected.
- D: approve with the short-form rule; don't expand every «paket»; keep Studio «isi».
- E: approve; withdraw the blanket avoidance of «bagian»; keep natural «pertanyaan» and «bacaan».
- F: approve the grammar, not every normalization; «Mengajar» becomes the teacher home, while role doors and contextual action labels may stay natural.
