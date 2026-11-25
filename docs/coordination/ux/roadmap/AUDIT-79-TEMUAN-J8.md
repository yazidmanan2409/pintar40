# Ruling 79 audit · J8, a school year set up: findings (Daisy, 24 Nov 2026)

> **What holds now:**
> - **J8 walked in part** on the local audit world (`00fe853d`), as W15 Wahyu Nugroho, the one Admin sekolah of the empty SD Sintetis Anggrek.
>   - **Read:** every Konfigurasi sub-page from the empty state, plus Pendataan and Aktivasi.
>   - **Done through the screens:** the structure (a Bagian, a wrongly shaped year and then a right one for a Tingkat, two Kelas) and a wrongly shaped school code.
> - **Not walked here:**
>   - pass marks (none can be set before the school has a lesson);
>   - roles with «Berlaku sampai»;
>   - the planted-error workbook;
>   - printed cards;
>   - a renamed rule;
>   - the last admin's refusals;
>   - the screen reader, throttled and reduced-motion passes.
>   These come from the builder's run.
> - **Captures:** `audit79-j8/`.
> - **6 findings, all Improvement.** **L-39 (K-1) is confirmed on a second school:** /konfigurasi's chevrons end at x = 801 to 879 at 1280.
> - **Holds:**
>   - the readiness list («Persiapan sekolah») updates as the year is built («Sudah · Kelas aktif · 2»; «Kelas yang belum punya guru: 1A, 1B») and points to the page for each step;
>   - every empty sub-page says what is missing and where to make it;
>   - a wrongly shaped year is refused by PINTAR with its rule («Tulis tahun ajaran seperti 2026/2027.»), keeping what was typed;
>   - each addition is confirmed («✓ 1B ditambahkan.»).

## Improvement

| # | Finding | Siblings | Cause | Dim. | Fix |
|---|---|---|---|---|---|
| J8-1 | Three fields are refused only by the browser's own bubble (`required` / `pattern`): an empty Bagian name, a school code «A-1» against `[A-Za-z0-9]{3}`, and (J10-3) a short reopening message. PINTAR's own line by the field never appears, so the wording is the browser's and a screen reader may not announce it. **This makes J10-3 a pattern; one row for all three** | **Disagree.** The Tingkat's year field shows PINTAR's own refusal line | New cause (proposed C-10): **some forms leave validation to the browser while others give PINTAR's own refusal** | C, G | One rule: a refused field shows PINTAR's line by it («Tiga huruf atau angka, misalnya AGR.»), announced, with the value kept |
| J8-2 | One school year, two spellings: «2026/27» on the structure (Tingkat, Kelas) and «2026/2027» in the readiness list («1A (2026/2027)») and the year field | **Disagree** (format only) | C-6 (words chosen per screen) | B | One format everywhere: «2026/2027» |
| J8-3 | Confirmations pile up: after two Kelas, «✓ 1B ditambahkan.» and the older «✓ Kelas 1 ditambahkan.» both still show, at separate places in the page | — | — | B, H | Show only the latest confirmation, next to what it added |
| J8-4 | Kelas are added one per submission. A 600-learner school (about 20 Kelas) needs 20 submissions and 20 page loads before intake can start | — | — | F | Allow a list in one field: «1A, 1B, 1C» → «3 Kelas ditambahkan.» |
| J8-5 | «Sistem & Konfigurasi» on an empty school ends with a bare «Belum ada.», without saying what doesn't exist yet | — | — | H | Name it: «Belum ada aturan sekolah yang disimpan.» (or what the list holds) |
| J8-6 | «Laporan» on an empty school says «Buat Kelas di Struktur sekolah di atas»; «Struktur sekolah» is not above, it is another page | — | — | H | «Buat Kelas di Struktur sekolah.» with the link |

## The rest of J8 walked locally (24 Nov 21:30): intake, cards, roles, the last admin, rules

Walked at `6b248975` on the reloaded audit world (W15, SD Sintetis Anggrek), at 1280, as Wahyu Nugroho. There is no builder harness for J8, so I used my own scripts (scratch).
- **The planted-error list:** built from the app's own example (pasted, semicolon-separated).
- **Captures:** scratch only.

### Holds
- **Intake refuses the whole list until every row is clean:** «3 baris perlu diperbaiki … Tidak ada yang dicatat sampai seluruh baris bisa dibaca.»
- **A clean list** shows exactly what will happen before anything is recorded:
  - «Baris 3 · Orang baru 3 · No. registrasi sekolah yang akan dibuat 3 · Akun yang bisa masuk 0»;
  - «Pendataan tidak membuat akun»;
  - every name «persis seperti akan dicatat»;
  - then «Ya, catat orang-orang ini».
  - After it, the next steps are named: roles first, then activation.
- **Cards for one class in one press,** a printable card sheet («Cetak kartu kelas»), and «PIN hanya ditampilkan sekali dan tidak bisa ditampilkan lagi setelah halaman ini ditutup».
- **A role ending today is accepted,** and flagged at once under «Peran yang segera berakhir … Perpanjang sebelum tanggalnya».
- **The last admin:**
  - their own row offers no «Lepaskan»;
  - «Tutup akun saya» is refused with an exact way out: «Anda satu-satunya Admin sekolah yang masih aktif … Tunjuk Admin sekolah lain lebih dulu di Peran & akses, lalu ajukan lagi. Bila tidak ada orang lain, hubungi Admin PINTAR.»
- **The effort count for a 600-learner school** (about 20 classes): one paste, one mapping, one check and one approval per class, then one card press and one print per class. That is about 120 actions for the year's intake. It is reasonable, so no finding.

### Not walkable on this world (for the builder)
- **Pass marks:** they need a lesson. That is unchanged from my first walk.
- **A renamed rule:** a rule needs a Paket Pembelajaran, and W15 has none (see J8-12).
- **Email, NIS and date errors** in the list can't be planted: the intake maps only name, existing person, place, role and programme. **Not a finding:** the template asks for «nama» only.
- **«Kirim kartu ke email saya»** failed («Kartu belum bisa dikirim sekarang. Coba lagi nanti.»). My SMTP sink is environmental, as in J10.

### New findings

| # | Finding | Siblings | Cause | Dim. | Fix |
|---|---|---|---|---|---|
| **J8-7 (Significant)** | **Two different children with the same name can't be entered.** A list with «Siti Aminah; 2001» and «Siti Aminah; 2002» is refused: «Baris 1 · Baris ini kembar dengan baris lain di berkas yang sama» (both rows). The NIS column is read but can't be mapped, so nothing tells the two apart. The advice («Perbaiki berkas …») can't be followed for two real children. Same-name learners are common in Indonesian classes. | — | C-7 (a rule that assumes names are unique) | F, C | When two rows share a name and nothing else separates them: a warning, not a refusal. «Baris 1 dan 2 bernama sama (Siti Aminah). Bila keduanya murid yang berbeda, pilih «Dua orang berbeda»; bila sama, hapus salah satunya dari daftar.» Or allow an identifying column (NIS) to separate them. |
| J8-8 | **The check's errors are hard to act on.** It names «Baris 1», «Baris 2», «Baris 5» but not the person, and data-row numbers differ from the spreadsheet's (a header row makes them +1). «Nama kosong atau terlalu panjang» doesn't say which. After the refusal, «Periksa daftar ini» is still offered, and pressing it repeats the same result. There is no «Mulai pendataan baru» button, and the pasted list isn't kept. | — | C-7 | C, F | «Baris 2 (di spreadsheet: baris 3): nama kosong.»; «Baris 1 dan 5: Ani Lestari tertulis dua kali.» Replace «Periksa daftar ini» with «Mulai pendataan baru», which reopens the paste box with the list kept. |
| J8-9 | **A learner is offered in «Berikan peran»,** and choosing her as Guru is refused as «Belum berhasil. Langkah ini bukan wewenang Anda.», said to the school's only admin. The real reason is that she holds a class card. | Aktivasi's own section: «Kartu kelas hanya untuk murid. Bila seorang murid menjadi staf, ubah kartunya menjadi akun email lebih dulu.» | C-9's neighbour (a refusal naming the wrong cause) | C, H | Mark learners in the person list («Ani Lestari · murid»). The refusal: «Ani Lestari memakai kartu kelas murid. Ubah kartunya menjadi akun email lebih dulu, di Aktivasi akun · Murid yang menjadi staf.» |
| J8-10 | A role with no «Berlaku sampai» is held only by the browser's bubble («Please fill out this field.»), although the field's own line says «Belum ada tanggal.» | J5-8, J8-1, J10-3 | C-10 | G | As C-10 |
| J8-11 | **After the cards are made,** the class picker still reads «(3 murid belum punya akun)» and the list «3 orang menunggu akun». Each PIN is also shown twice on the page: on the card sheet, and again in each row. | **Disagree:** the sheet says the cards are made | C-3 | B, F | The counts update («Semua murid di kelas ini sudah punya kartu»). PINs appear once, on the sheet; each row says «Kartu dibuat · lihat lembar kartu di atas». |
| J8-12 | **Aturan Asesmen at a school with no package** shows the full form. Its required «Paket Pembelajaran» select has only «—», and «Buat aturan» is held by the browser's bubble («Please select an item in the list.»). Nothing says a package must exist first. | — | C-7; C-10 | F, C | With no package: «Aturan dibuat untuk satu Paket Pembelajaran. Sekolah ini belum punya paket: buat paket lebih dulu di Buat Paket.» + the link, and no form. |
| J8-13 (optional) | The last admin's refusal begins «Permintaan ini tidak diajukan» on an action that is an immediate close, not a request | — | C-6 | H | «Akun Anda belum dapat ditutup: Anda satu-satunya Admin sekolah …» |

**J8's «left for the builder» lines:** walked, except pass marks and the renamed rule (world: no lesson, no package) and the passes.

## J8-7 (L-127) · words fitted to Sharon's identity rule (`a73874d6`, 24 Nov 21:30)

**The rule:**
- the same NIS means a duplicate; a different NIS means different people;
- with no NIS, the same name **and** the same birth date is a possible duplicate: warn, require «Dua orang berbeda», and audit it;
- the same name with a different birth date means different people;
- NIS is visible only to that school's intake and admin staff.

### «Kolom mana untuk apa»: two more targets
- **NIS (opsional)**
  - ID: «Dipakai untuk membedakan murid yang namanya sama. Hanya terlihat oleh petugas pendataan dan admin sekolah ini.»
  - EN: «Used to tell apart students with the same name. Visible only to this school's intake and admin staff.»
- **Tanggal lahir (opsional)**
  - ID: «Dipakai untuk membedakan murid yang namanya sama bila tidak ada NIS. Tulis seperti 2019-03-14.»
  - EN: «Used to tell apart students with the same name when there's no NIS. Write it like 2019-03-14.»

### The check («Periksa daftar ini»), by case

| Case | Outcome | ID | EN |
|---|---|---|---|
| Same NIS on two rows | **Refused** (the whole list, as today) | «Baris {a} dan {b}: NIS {nis} tertulis dua kali. Satu NIS untuk satu murid: hapus salah satu baris, atau perbaiki NIS-nya.» | «Rows {a} and {b}: NIS {nis} appears twice. One NIS per student: remove one row, or correct the NIS.» |
| Same name, different NIS | **Accepted**, no warning | (no message; in the approval list both rows show their NIS) | — |
| Same name, no NIS, **same** birth date | **Warning**, with an explicit choice per pair | «Baris {a} dan {b}: nama dan tanggal lahirnya sama ({nama}, {tanggal}). Mungkin orang yang sama tertulis dua kali.» + choices «Dua orang berbeda» / «Orang yang sama: hapus baris {b}» + «Pilihan ini dicatat.» | «Rows {a} and {b} have the same name and birth date ({nama}, {tanggal}). The same person may be listed twice.» + «Two different people» / «The same person: remove row {b}» + «This choice is recorded.» |
| Same name, no NIS, **different** birth dates | **Accepted**, no warning | — | — |
| Same name, **neither** NIS nor birth date | **Warning**, as the same-birth-date case: nothing tells them apart. *My reading of the rule; Sharon to confirm.* | «Baris {a} dan {b}: namanya sama ({nama}), dan tidak ada NIS atau tanggal lahir untuk membedakannya.» + the same two choices + «Pilihan ini dicatat.» | «Rows {a} and {b} have the same name ({nama}), with no NIS or birth date to tell them apart.» + the same choices |
| Fully identical rows (every mapped column the same) | **Refused**, as today, with the name | «Baris {a} dan {b}: {nama} tertulis dua kali dengan data yang sama. Hapus salah satunya.» | «Rows {a} and {b}: {nama} is listed twice with the same data. Remove one.» |

**Rules for the composition:**
- Row numbers follow J8-8: «Baris 2 (di spreadsheet: baris 3)».
- «Ya, catat orang-orang ini» stays unavailable until every warned pair has a choice. Above it: «{n} pasangan nama sama belum dipilih.» / «{n} same-name pairs still need a choice.»
- In the approval list, a pair confirmed as different carries «· dikonfirmasi berbeda» / «· confirmed different». The NIS column is shown on this page only (intake staff).
- **No NIS anywhere else:** not on the learner's pages, the teacher's class list, the certificate or the public check.

## Capture judgement · the builder's committed J8 (`434e2c7f/j8`, `9874ea1b`), 24 Nov 23:55

Seven walks, every one reaching its last screen.

### Holds (new in the capture)
- **A pass mark of 70** is set with its scope: «✓ Selesai. Batas ketuntasan ditetapkan. Berlaku untuk pelajaran yang disediakan mulai sekarang.»
- **A renamed rule keeps its settings, and says so:** «✓ Nama diperbarui. Cara hasil dibaca tidak berubah.»
- **The card sheet prints** (`kartu-cetak.pdf`).
- **A wrong school code** keeps what was typed («A-1»). Its refusal is still the browser's (J8-1).

**Every earlier J8 finding stands in the capture:**
- J8-1 / L-150: a pass mark of 150 is held only by «Value must be less than or equal to 100.»;
- J8-8: «Baris 4 · Nama kosong atau terlalu panjang»;
- J8-10: no date, browser only;
- J8-13: «Permintaan ini tidak diajukan» on the close.

**One capture to re-take:** `03-tingkat-tahun-salah` caught the form mid-submit («Menyimpan…»), so `year_wrong` reads «(no refusal line)». My walk got PINTAR's refusal («Tulis tahun ajaran seperti 2026/2027.»). It is timing, not product.

### L-148 and L-149: narrower than stated, from a local reproduction

I reproduced intake locally at `6b248975` (the app code is unchanged to `50ba47f7`), on the reloaded W15 world:
- a list «nama / Sari Wulandari / Tono Prasetyo»;
- **Tempat and Peran left «Tidak dipakai»**, with «Ini daftar guru atau staf: catat tanpa kelas» ticked;
- the result: **«✓ 2 orang tercatat»**, with no enrolment row.
- In «Peran & akses», both are offered.
- **«Guru · 1A · berlaku sampai hari ini» was granted to Sari** (`role_assignments`: EDUCATOR, until 25 Nov 16:59:59Z).

So the intake's promise works as worded. The builder's run chose **Tempat = «Guru dan Staf»** (the staff Bagian built in L1) and **Program = «Guru dan Staf»** (`18-staf-kolom`), and that is what is refused.

**L-148, restated (Significant, my proposal):** intake offers the school's own staff Bagian and Program as a «Tempat» and «Program». Choosing them, which is the natural reading for a staff list, is refused row by row with the **learner** line «Murid hanya bisa ditempatkan di Kelas atau Tingkat yang aktif». The app already has the right words for it (`pendataan.masalah.staf`).

**Fix and words:**
1. **Don't offer staff units** («Guru dan staf» Bagian, its Tingkat and Program) in intake's Tempat and Program lists. Under Tempat:
   - ID: «Bagian guru dan staf tidak dipilih di sini. Untuk daftar guru atau staf, biarkan Tempat dan Peran «Tidak dipakai», lalu centang «Ini daftar guru atau staf».»
   - EN: «Staff sections aren't chosen here. For a list of teachers or staff, leave Place and Role as «Not used», then tick «This is a list of teachers or staff».»
2. **If a staff unit still reaches the check** (an old link, a file with a «tempat» column): use the existing `pendataan.masalah.staf` for that row, not the learner line.
3. **The tick's label stays.** It is true.

**L-149, restated:**
- People recorded without a class **are** offered in «Berikan peran» (Sari and Tono were).
- What isn't found is the school's **seeded** admin (Wahyu has no intake record).
- A real school's first admin is created by Admin PINTAR and already holds the role, so **on this evidence L-149 isn't a defect for a real school**.
- **Not a finding until your check of the real path says otherwise.**
- If it does, the empty-search line should name the cause: «Orang ini belum tercatat di sekolah ini. Catat lewat Pendataan lebih dulu (tanpa kelas untuk guru dan staf), lalu berikan perannya di sini.» / «This person isn't recorded at this school yet. Record them through Intake first (without a class for teachers and staff), then give the role here.»

### New findings from the capture

| # | Finding | Siblings | Cause | Dim. | Fix |
|---|---|---|---|---|---|
| **J8-14 (Significant)** | **The last admin releasing their own role is told something false:** «Peran Anda sendiri diubah atau diakhiri oleh admin lain.» (`31`). It reads as if another admin had changed their role, said to the school's only admin. The staff page also offers «Lepaskan · Admin sekolah» on that sole role, while the roles list doesn't (my J8 walk: no «Lepaskan» on their own row). | **Disagree:** the close-account refusal names the real cause exactly; the roles list doesn't offer it | C-9's neighbour; C-7 | C, H | Show the checkbox disabled, with the same cause as the close refusal. ID: «Peran Admin sekolah ini belum dapat dilepas: Anda satu-satunya Admin sekolah yang masih aktif di sekolah ini. Tunjuk Admin sekolah lain lebih dulu di Peran & akses. Bila tidak ada orang lain, hubungi Admin PINTAR.» EN: «This School admin role can't be released yet: you're the only active School admin at this school. Appoint another School admin first in Roles & access. If there's no one else, contact Admin PINTAR.» A server refusal uses the same sentence. |
| J8-15 | **The role card on the staff page collapses at 1280** (`31`): «Tempat: SD Sintetis Anggrek · Berlaku sampai Selasa, 25 Nov 2036» is squeezed to one word per line and runs into the «Tanggung jawab» paragraph. The text overlaps. | — | — | V | Stack the card: role, then place and end date on one line, then the responsibilities below. Add to the visual consistency pass. |
| L-150 | A pass mark of 150 is held only by the browser | J8-1 family | C-10 | G | As C-10 |

**J8's «left for the builder» lines are closed**, except re-taking `03` (timing).

## L-149 withdrawn; L-154 classified and worded (25 Nov 00:10)

The builder walked the staff path without the fixture (`96e42ac5/j8`, screens 20–27). **L-149 is withdrawn.**

**L-154 (Significant, as Bob proposes):** with «Ini daftar guru atau staf» ticked, the approval screen (`22`) still says «Peran · Murid 2», and labels each name «Murid». The admin approves «learners» while PINTAR records two staff with no class and no enrolment (my reproduction: no `enrollments` row). The one screen whose job is «persis seperti akan dicatat» states the wrong kind of person.
- **Cause:** C-3 (the summary re-derives «role» from the default rather than from the tick).
- **Dimensions:** B, H.

**Words, when the tick is set:**

| Where | ID | EN |
|---|---|---|
| «Peran» summary row | «Guru atau staf (tanpa kelas) · {n}» | «Teacher or staff (no class) · {n}» |
| The label beside each name | «Guru atau staf» | «Teacher or staff» |
| The line above «Ya, catat orang-orang ini» | «Orang-orang ini dicatat tanpa kelas dan tanpa peran. Perannya Anda berikan sesudahnya di Peran & akses; akunnya diaktifkan dengan email.» | «These people are recorded without a class and without a role. You give their role afterwards in Roles & access; their account is activated by email.» |
| The done screen | «✓ {n} guru atau staf tercatat di sekolah ini. Langkah berikutnya: berikan perannya di Peran & akses.» | «✓ {n} teachers or staff recorded at this school. Next: give their role in Roles & access.» |

**One thing for the builder to check with it:** in Aktivasi, people recorded this way may be offered «Buat kartu kelas» (a learner card) beside «Aktifkan dengan email». If so, staff recorded without a class should be offered email activation only. This is the same family as J8-9.

## L-155 · the UX side (Sharon classifies the credential side), 25 Nov 00:35

**What happens:**
- people recorded with «Ini daftar guru atau staf» are offered «Buat kartu kelas», a learner credential, until they hold a staff role, and again if it lapses;
- they are counted as «murid tanpa kelas»;
- it is the same root as L-154: the tick is recorded nowhere, so every later page treats them as learners.

**UX severity: Significant (C-3).** It is the same fact misread on two more screens, and it offers a learner credential to staff.

**Prerequisite:** the tick must be recorded as the person's kind («guru atau staf»). Every line below reads from it.

### Aktivasi: a staff-kind person without a usable staff role

**No «Buat kartu kelas».** In its place, one line and a link.

| Case | ID | EN |
|---|---|---|
| Never had a role | «{nama} · guru atau staf · belum punya peran. Berikan perannya lebih dulu, lalu aktifkan akunnya dengan email.» + «Buka Peran & akses» | «{nama} · teacher or staff · no role yet. Give their role first, then activate the account by email.» + «Open Roles & access» |
| The role lapsed | «{nama} · guru atau staf · perannya berakhir {tanggal}. Perpanjang perannya di Peran & akses.» + «Perpanjang peran» | «{nama} · teacher or staff · their role ended on {tanggal}. Renew it in Roles & access.» + «Renew the role» |
| Holds a role | as today: «Aktifkan dengan email» only, never a class card | — |

**Whether email activation may be offered before a role exists** is Sharon's (credential side). The words above assume «role first», as the page's own intro already says («Untuk guru dan staf, berikan perannya di Peran & akses lebih dulu, lalu aktifkan dengan email»).

### Konfigurasi readiness: the «murid tanpa kelas» count

- Staff-kind people **leave** «Murid yang belum ditempatkan di Kelas».
- They appear on their own line, only while some have no role:
  - ID: «Guru dan staf yang belum punya peran · {n}», with the action «Berikan peran di Peran & akses».
  - EN: «Teachers and staff without a role · {n}» / «Give roles in Roles & access».
- Once every one has a role, the line goes, as the other readiness lines do.

### L-155 · Aktivasi adjusted to Sharon's answer (25 Nov 00:45)

**Sharon:** a staff-kind person **may** activate by email before a role is given (no role means no capability). **The firm rule stays:** never a card for anyone recorded as staff.

So «Aktifkan dengan email» is offered, «Buat kartu kelas» never is, and the line points to the role without blocking activation.

| Case | ID | EN |
|---|---|---|
| No role yet | «{nama} · guru atau staf · belum punya peran. Akunnya dapat diaktifkan dengan email sekarang; perannya diberikan di Peran & akses.» + «Aktifkan dengan email» + «Buka Peran & akses» | «{nama} · teacher or staff · no role yet. The account can be activated by email now; the role is given in Roles & access.» + «Activate by email» + «Open Roles & access» |
| The role lapsed | «{nama} · guru atau staf · perannya berakhir {tanggal}. Perpanjang perannya di Peran & akses.» + «Perpanjang peran» (account activation as today) | «{nama} · teacher or staff · their role ended on {tanggal}. Renew it in Roles & access.» + «Renew the role» |

The page intro's recommended order («berikan perannya … lebih dulu, lalu aktifkan dengan email») can stay. It is advice, and the lines above no longer contradict it.
