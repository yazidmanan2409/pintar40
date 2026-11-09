# Copy and flow review of five new screens (Daisy, 9 Nov 2026)

**Commit:** `claude/system-integrity-4.0` at **`6faef690`**. Not verified, so read from code and copy only; I have no screenshots, and nothing was pressed.

**Sources:**
- `src/lib/hle.ts` (`mengajar.akhiri.*`, `sertifikat.ganti.*`, `staf.*`, `akun.tinggal.*`, `keamanan.akun.*`, `keamanan.permintaan.*`);
- `AkhiriPenugasan.tsx`;
- `MeninggalkanPintar.tsx`;
- the other components named in the request.

**Two rulings apply throughout:**
- **English says «students» for pupils** (owner, 9 Nov). Several new keys still say «learner(s)» (listed per item).
- **One name per role:** «Admin PINTAR», not «Admin platform» (my 4.1 consistency item 6). Every new key that says «Admin platform» or «platform administrator» should follow it.

---

## 1 · «Akhiri atau tarik» (Mengajar, a class's material)

**Clear?** Mostly. The page shows how many finished, how many never started, and who is still answering, before the teacher decides. That is the right order. Six corrections:

1. **«Selesai / Ditarik» is not the right pair.** «Selesai» is already the learner's word («Sudah menyelesaikan» sits in the same panel, one line above). A teacher reading «Selesai» can take it to mean «the students finished».

   **The pair should say what the teacher does, both in the same form:**

   | | Indonesian | English |
   |---|---|---|
   | ended | «**Diakhiri**: materi sudah selesai dibahas» | «**Ended**: the material has been covered» |
   | withdrawn | «**Ditarik**: diberikan karena keliru» | «**Withdrawn**: given by mistake» |

2. **The legend «Jenis»** names nothing. Use «**Mengapa penugasan ini berakhir?**» / «**Why is this assignment ending?**»
3. **The title and button must follow the choice.**
   - **Title:** «Akhiri atau tarik penugasan · {kursus}».
   - **Button:** «**Akhiri penugasan**» when «Diakhiri» is chosen, «**Tarik penugasan**» when «Ditarik».
   - **Result line:** «Penugasan diakhiri.» / «Penugasan **ditarik**.», each followed by «Hasil murid tetap tersimpan.»
4. **Say what happens to a running sitting.** «Akhiri juga asesmen yang masih dikerjakan murid di atas. Jawaban mereka tetap tersimpan.» does not say whether those answers are **scored**, nor what the student sees.
   - **This is a different rule from maintenance,** where a running sitting finishes. A teacher needs to know which applies before ticking.
   - **→ Sharon:** the rule.
   - **Copy pattern, once the rule is known:** «Asesmen yang sedang dikerjakan **ditutup sekarang**. Jawaban yang sudah tersimpan {dinilai / tidak dinilai}; murid melihat «Asesmen ini sudah diakhiri guru».»
5. **A withdrawn assignment's results.** «Hasil … tetap tersimpan» is right for evidence. But if an assignment given **by mistake** still counts in Ringkasan Kelas and the reports, the class's figures are wrong (the owner's accuracy directive).
   - **→ Sharon:** whether «Ditarik» excludes its results from class figures.
   - **If it does,** add: «Hasilnya tetap tersimpan tetapi **tidak dihitung** di laporan kelas.»
6. **Pattern:** this ends something students rely on. Use the destructive-confirmation grammar already in use:
   - the opener «Akhiri atau tarik» in `pin-bahaya` (red text);
   - the confirm button red;
   - «Batal» quiet (`pin-quiet`).

   Today the confirm is `pin-primary` and «Batal» a plain `pin-btn` (`AkhiriPenugasan.tsx:91–92`).

**Small:** the reason length is «5 sampai 300» here and «10 sampai 300» everywhere else (certificates, staff, account). Use 10–300.

## 2 · «Terbitkan ulang» beside «Cabut» (Konfigurasi · Sertifikat)

**The two verbs are distinct and right:**
- «Cabut» ends a certificate;
- «Terbitkan ulang» replaces it, keeping the old one as «digantikan».

The explanation is clear and honest: «…dengan hasil yang sama dan nomor baru. Sertifikat ini tetap tersimpan, dan pemeriksaannya akan menyebut bahwa ia sudah digantikan.»

**The comparison table:**
1. **Column «Bagian» → «Data».** «Bagian» is a structural level in PINTAR (Bagian · Tingkat · Kelas), so it reads as one here. EN «Part» → «Field».
2. **«Berbeda» as a column** is fine if each differing row says the word «berbeda» (not only a colour or icon). A matching row leaves it empty.
3. **Order:** name, school, lesson (as listed in the explanation), and the result last, marked «sama» always. This shows that the result is never re-derived.

**Who reads the reason.** «Tercatat bersama sertifikat pengganti dan di jejak audit sekolah» should say whether the **public check page** shows it. If not: «Alasan ini tidak ditampilkan di halaman pemeriksaan.» **→ Sharon.**

**`sertifikat.ganti.sama`:** «(nama orang dikoreksi oleh **Admin platform**)» → «oleh **Admin PINTAR**».

**`gagal.cert_key_invalid`:** «belum dapat ditandatangani» is a technical word for an administrator. Use «Sertifikat pengganti belum dapat dibuat sekarang. Sertifikat ini tetap berlaku; coba lagi nanti.» That matches `layanan_tidak_tersedia`, which already says «tetap berlaku».

## 3 · One person's page, `/konfigurasi/staf`

**Title and intro:**
- **`staf.judul` «Peran dan tugas seseorang»:** the page is about one named person. Make the h1 the name, with this as the eyebrow: eyebrow «Peran dan tanggung jawab», h1 «Pak Yusuf Hidayat». That matches the learner record page's grammar (eyebrow, then name).
- **`staf.intro` «Jabatan formal bukan wewenang di PINTAR.»** is too compressed; a reader stops on it. Use «Di PINTAR, wewenang datang dari peran yang diberikan di sini, bukan dari jabatan di sekolah.» / «In PINTAR, authority comes from the roles given here, not from a job title at the school.»

**«Ubah peran & tanggung jawab» and its review:**

| Key | Today | Correction |
|---|---|---|
| `staf.ubah.lepas` | «Lepaskan» | Keep «Lepaskan». Also use it in «Peran & akses», which says «Cabut» for the same act: one verb per act. «Cabut» stays for certificates, where it is a revocation |
| `staf.ubah.dapat` / `.hilang` | «yang didapat» / «yang hilang» | «yang **ditambahkan**» / «yang **dilepas**». «hilang» reads as lost by accident; both should be acts |
| `staf.ubah.tidak_diberikan` | «Tidak pernah diberikan dari sekolah: Admin platform, dan apa pun di sekolah lain.» | «Dari halaman ini tidak dapat diberikan: peran **Admin PINTAR**, dan peran di sekolah lain.» / «This page cannot give: the PINTAR Administrator role, or roles at another school.» |
| `staf.ubah.antrean` | «Keputusan yang akan menunggu tanpa pemutus» | «Keputusan yang akan menunggu **tanpa ada yang memutuskan**». «pemutus» is unusual |
| `staf.ubah.antrean_arti` | «Di tempat ini tidak akan ada lagi …» | **Name the place:** «Di **Departemen Matematika** tidak akan ada lagi Kepala departemen. {n} keputusan yang menunggu tetap menunggu dan tidak dialihkan; tetapkan pemegang baru agar ada yang memutuskannya.» This is the most important sentence on the page, and it should not need the reader to work out «tempat ini» |
| `staf.galat.role_scope_invalid` | «Tempat itu bukan bagian aktif sekolah ini.» | «Tempat itu tidak aktif atau bukan milik sekolah ini.» («bagian» again) |
| `staf.galat.role_not_allowed` | «Peran itu tidak diberikan di tempat itu dari sekolah.» | «Peran itu tidak dapat diberikan untuk tempat itu.» |

**«Akhiri tugas di sekolah ini»:**
- **The title and explanation are right.** «Akunnya, peran di sekolah lain, dan semua karya serta catatannya tetap ada» is exactly the sentence that separates it from suspension.
- **`staf.akhiri.tanggal` «Tanggal berlaku» → «Tanggal kejadian»,** with the hint «Hari ini atau sebelumnya. Wewenangnya berakhir saat Anda menyimpan, apa pun tanggalnya.» «Berlaku» suggests the date is when authority ends, which it is not (approved in `TINJAUAN-89374424.md` §1.4).
- **Categories:**
  - «Pindah tugas» → «Pindah tugas **ke sekolah lain**»;
  - order: Pensiun, Mengundurkan diri, Pindah tugas ke sekolah lain, Masa tugas selesai, Diberhentikan, Lainnya, then «Dicatat keliru» set apart by a rule (approved §1.3).
- **Confirmation:** confirm that it names the person, the school and every role that ends, as approved: «Semua perannya di sekolah ini berakhir: Guru 5B, Guru 5C, Kepala departemen Matematika.» Not visible in the copy keys. **→ engineering.**

**The responsibility names (`staf.tj.*`).** Named by the act in the words the person meets on the screen where they do it: Studio's step names, Mengajar's, Pimpinan's.

| Key | Indonesian | English |
|---|---|---|
| `can_draft` | Menyusun paket di Studio | Writing packages in Studio |
| `can_review` | Menyetujui isi paket | Approving package content |
| `can_freeze_release` | Membuat dan mengunci terbitan | Making and locking releases |
| `can_publish` | Menerbitkan paket dan mengelola sertifikat | Publishing packages and managing certificates |
| `can_assign_learning` | Menyediakan materi untuk kelas | Giving material to classes |
| `can_quick_assessment` | Membuat Uji Cepat | Creating quick checks (Uji Cepat) |
| `can_authorize_transfer` | Menyetujui perpindahan murid | Approving student transfers |
| `can_review_question_health` | Meninjau sinyal mutu soal | Reviewing item quality signals |
| `can_manage_report_templates` | Mengelola templat laporan | Managing report templates |
| `can_review_integrity` | Meninjau catatan integritas | Reviewing integrity notes |
| `can_view_learner_roster` | Melihat daftar murid | Seeing the student list |
| `can_view_learner_result` | Melihat hasil murid | Seeing students' results |
| `can_provision_people` | Mendata orang dan mengaktifkan akun | Recording people and activating accounts |
| `management_decision` | Memutuskan hal yang menunggu di Pimpinan | Deciding what waits under Management |

**Why these words:**
- «Meninjau sinyal mutu soal» is Studio's own bucket name.
- «catatan integritas» is the Tinjauan Integritas page's own word; «tanda integritas» appears nowhere else.
- «Mendata … mengaktifkan» names the two screens, Pendataan and Aktivasi.
- **The English «students»** follows the ruling.

## 4 · «Meninggalkan PINTAR» (Akun saya)

**Dark patterns:** none found.
- «Anda boleh pergi kapan saja» comes first.
- There is no guilt line, and nothing pre-ticked: each act needs its own tick.
- Only the close button is red, and the request button is plain.
- The facts include the uncomfortable one: «Cadangan … saat ini 7 hari».

That is honest design. **Keep it.**

**Plainness, line by line:**

| Key | Note |
|---|---|
| `akun.tinggal.arti` «…sesuai keadaan PINTAR hari ini.» | «hari ini» reads oddly. Use «…**sebagaimana PINTAR bekerja saat ini**.» EN «…as PINTAR works today.» is fine |
| `fakta.data` «nama tampilan (diganti PINTAR ID)» | Clear. EN good |
| `fakta.audit` «Barisnya dapat menunjuk ke orang yang sudah dianonimkan.» | «dianonimkan» is technical. Use «Barisnya tetap ada, **tanpa nama Anda**.» / «Its rows stay, **without your name**.» |
| `akibat.close` «…atas permintaan Anda kepada **Admin platform**.» | «Admin PINTAR». And say how to reach them; a closed account cannot sign in to ask. **→ owner:** the contact (e.g. the email in the footer) |
| `akibat.delete_personal_data` | Say the order plainly: «Data pribadi dihapus **setelah akun ditutup**. Bila akun Anda belum ditutup, permintaan ini menunggu sampai akun ditutup.» Today a person can send it and only learn the order from the status |
| `status.done` «Selesai» | Fine for a request |

**The learner's view («through the school»).**
- **`akun.tinggal.lewat_sekolah`:** «Untuk murid, permintaan menutup akun atau menghapus data pribadi diajukan oleh Admin sekolah bersama keluarga. Sampaikan kepada sekolah Anda.»
- **The meaning is right; the voice is not.** «Untuk murid» talks about the reader in the third person, and «Admin sekolah» is a role a child does not know.
- **Use, addressed to them:**

  > «Karena Anda murid, permintaan menutup akun atau menghapus data pribadi Anda diajukan oleh sekolah bersama keluarga Anda. Sampaikan kepada **wali kelas atau guru Anda**.»
  > «As a student, a request to close your account or delete your personal data is made by your school with your family. Tell **your class teacher**.»

- **The same correction applies to `galat.account_learner_via_school`** («For a learner» → «As a student»).
- **For learners, show a shorter fact list:** access, academic records, certificates, and «sekolah dan keluarga Anda yang mengajukan». The audit and backup lines are for adults deciding, and a Grade 5 student reads them as alarming. **→ engineering:** a learner variant of the list.

## 5 · Suspension and closure: four outcomes, unmistakably different?

**Mostly yes:** four different verbs, four different actors, and each says its scope.

| Outcome | Actor | Scope | The copy that says so |
|---|---|---|---|
| «Ditangguhkan» | Admin PINTAR | every school | «Penangguhan berlaku saat itu juga di semua sesi…» |
| «Ditutup atas permintaan sendiri» | the person | every school | «…di semua sekolah» (`fakta.akses`) |
| «Akhiri tugas di sekolah ini» | Admin sekolah | this school | «Akunnya, peran di sekolah lain … tetap ada» |
| «Hapus data pribadi» | Admin PINTAR, on request | the person's data | «Catatan yang wajib disimpan tetap ada» |

`keamanan.akun.arti` already carries the essential rule: «Pensiun, kelulusan dan pindah sekolah memakai pengakhiran di sekolah, bukan penangguhan.»

**Four places blur them:**
1. **Two states merged in one error.** `galat.account_already_suspended` («sudah ditangguhkan **atau** ditutup») and `galat.account_not_suspended` («tidak sedang ditangguhkan **atau** ditutup») merge two states. An administrator restoring needs to know which: «Pulihkan akun» is for a suspension, «Buka kembali … atas permintaannya» for a closure. **Split each** («Akun ini sudah ditangguhkan sejak …» / «Akun ini sudah ditutup atas permintaan pemiliknya sejak …»).
2. **«permintaan» means two things on one page.**
   - `keamanan.akun.akibat` says «…setiap **permintaan** ditolak» (meaning every request to the server);
   - the section below is «**Permintaan** dari pemilik akun» (requests by people).
   - **Use «…setiap tindakan di PINTAR ditolak.»**
3. **«Disiplin» at platform scope.** A disciplinary matter is a school's, and the owner ruled that a school never suspends a person who also studies or teaches elsewhere. «Disiplin» on the platform suspension invites a school to ask for exactly that. **→ owner:** keep it, or keep the platform categories to «Keamanan akun», «Administrasi», «Lainnya».
4. **What the person sees.** None of these keys says what a suspended or closed person sees when they try to sign in. Without it, «suspended» and «closed» may look identical to the person, and to a school that hears «she can't sign in». **Two lines:**

   > «Akun ini **ditangguhkan** oleh Admin PINTAR sejak 9 Nov 2026. Hubungi sekolah Anda atau Admin PINTAR.»
   > «Akun ini **sudah ditutup** atas permintaan Anda sejak 9 Nov 2026. Untuk membukanya kembali, hubungi Admin PINTAR.»

   «Disiplin» is never shown to the person, only the fact and who to contact. **→ engineering**, and Sharon on whether the sign-in refusal may say which.

**Also:** `keamanan.akun.arti` and every «Admin platform» key → «Admin PINTAR».

---

## Summary

**Must change before the screens are verified:**
- the «Selesai / Ditarik» pair, and the title and button following the choice (§1);
- what happens to running sittings, and whether a withdrawn assignment counts (§1, → Sharon);
- «Bagian» in the certificate table (§2);
- the departure date's label (§3);
- the merged suspended/closed messages (§5.1);
- «permintaan» used twice (§5.2);
- the learner's «through the school» sentence (§4).

**Names given:** the 14 responsibilities (§3).

**To the owner:** «Disiplin» at platform scope; the contact for reopening a closed account.

**Not seen:** every screen as rendered, focus order, accessible names, phone widths.
