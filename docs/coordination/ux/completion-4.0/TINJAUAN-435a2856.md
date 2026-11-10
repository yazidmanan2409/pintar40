# Design check at `435a2856` (Daisy, 10 Nov 2026)

**Scope:** a read-only design check, not acceptance. The screen changes are in `dc84af22`, `354bf673` and `df9f2b61`, and the copy is in `src/lib/hle.ts`. I read the source at `435a2856`. I did not run or capture anything, so focus, the accessibility tree and 320 px are **not seen**.

**Rulings applied:**
- A withdrawn («Ditarik») assignment's results are kept, marked, and left out of **class and school** figures.
- An ended («Diakhiri») assignment keeps counting.
- Sign-in stays neutral for a suspended or closed account.
- The «Anda» register, and «students» in English.

---

## 1 · The withdrawn assessment

### 1.1 The open question: the teacher's assignment list (`src/app/mengajar/[kelas]/page.tsx:194–222`)

**Today:**
- Ended and withdrawn rows sit inside «Materi untuk kelas ini», between live rows, in roster order.
- They carry a neutral pill and no action.
- When an assignment is withdrawn, its release comes back in the same list as «Siap disediakan». The list then shows **two rows with the same title**: one «Ditarik», one offered again.

**Proposal: the history moves out of the working list into one closed disclosure directly below it.**

1. **The working list** («Materi untuk kelas ini») keeps only what a teacher can act on:
   - assignments in force (Tersedia, Dijadwalkan, Selesai), with their «Akhiri atau tarik» link;
   - releases «Siap disediakan».

   A withdrawn lesson offered again therefore appears **once** up there: as something to set up again, correctly.
2. **Below it, `<details>` (`pin-disclosure`, collapsed):**
   - **New key `mengajar.materi.berakhir`:** «Sudah berakhir ({n})» / EN «Ended or withdrawn ({n})».
   - Shown only when n > 0. Newest first.
3. **Each row uses the same grammar as the list above. It has no action and no primary button:**

   | | Pill (`pin-pill pin-neutral`) | Meta line (`pin-rowmeta`) |
   |---|---|---|
   | Ended | «Diakhiri» | «Diakhiri {tanggal} · hasilnya tetap dihitung» |
   | Withdrawn | «Ditarik» | «Ditarik {tanggal} · hasilnya tidak dihitung di laporan kelas dan sekolah» |

   - **The teacher's reason** follows on a second meta line: «Alasan: …».
   - **New keys:** `mengajar.materi.diakhiri_pada` and `mengajar.materi.ditarik_pada`, with `{tanggal}` in the school's timezone.
4. **The evidence stays reachable from the row.** One quiet link (`pin-tautan`): «Hasil murid ({n} selesai)».
   - It goes to the class's evidence filtered to that assignment.
   - **→ engineering:** if `/mengajar/[kelas]/bukti` cannot filter by assignment in 4.0, use a sentence instead of the link, so nothing promises a view that does not exist: «Hasil tiap murid ada di halaman muridnya.» Each learner page already marks the result.

**How it differs from «Diakhiri»: by the word and by the counting clause only.**
- Both are neutral, collapsed, and have no action.
- No red, no warning tone, no strike-through and no greyed text:
  - strike-through and grey read as an error or as disabled;
  - grey also fails contrast.
- «Ditarik» is not an error the teacher must fix. It is a fact about the figures, and the clause states that fact.

### 1.2 Copy (one rule, said the same way everywhere)

| Key | Today | Change |
|---|---|---|
| `mengajar.akhiri.akibat_tarik` | «…tidak dihitung di laporan kelas.» | «…tidak dihitung di laporan **kelas dan sekolah**.» / EN «…not counted in **class or school** reports.» |
| `mengajar.akhiri.ok_tarik` | «…tidak dihitung di laporan kelas.» | Same change |
| `hasilbelajar.ditarik` (shared by the teacher's and the learner's pages) | «Ditarik guru; tidak dihitung di laporan kelas» | **Split it.** The learner does not read class reports, and «Ditarik guru;» is abrupt for a child. <br>• Teacher, new key `mengajar.murid1.ditarik`: «Ditarik · tidak dihitung di laporan kelas dan sekolah» <br>• Learner, keep `hasilbelajar.ditarik`: «Guru Anda menarik penugasan ini. Hasil Anda tetap tersimpan di sini.» / EN «Your teacher withdrew this assignment. Your result stays here.» |

### 1.3 The teacher's learner page (`mengajar/[kelas]/murid/[orang]/page.tsx:119–131`)

- **The mark after the recalculation note is right.**
- **Two things follow it today that a withdrawn result should not carry:**
  1. «Di bawah target · Target {n}%» (lines 121–126). A target judgement on an assessment given by mistake invites a decision on it.
  2. The «Beri ulang» link (`mengajar.ulang.judul`, lines 128–131).
     - Withdrawing says the assessment was a mistake, so giving material back because of it repeats the mistake.
     - Shown when `catatan.tugasSesi[h.sesi]` resolves. **→ engineering:** confirm whether it resolves for a withdrawn assignment.
- **Change:** when `h.ditarik`, show the mastery and the «Ditarik» mark only, and leave out both of these.

On the learner's Hasil Belajar (`KomposisiMurid.tsx:77–79`), keeping «Tercapai» beside the mark is right: the learning happened.

---

## 2 · Screens changed since my review

### 2.1 Hasil Belajar after a lesson closes or the learner leaves the Kelas (`src/lib/hasil-belajar.ts:47–50`)

- **Hiding an unfinished sitting is right:**
  - a half-done assessment of a closed lesson is not a result;
  - showing it as «Sedang dikerjakan» would be false.
- **But a finished Tes awal with no Uji Penguasaan disappears too.** Line 48 returns `null` whenever `post_session` is missing. That Tes awal is a result the learner earned, and the owner's rule keeps results.
- **Change:** keep one quiet row for that case. New key `hasilbelajar.ditutup_awal`:
  > «Tes awal selesai: {persen}. Materi ini ditutup sebelum Uji Penguasaan.» / EN «Starting check finished: {persen}. This material closed before the mastery check.»
  - No target and no «tercapai».
  - Use the established names for the two instruments: «Tes awal» and «Uji Penguasaan».

### 2.2 `sync.diakhiri_sekolah` (`ItemPlayer.tsx:347`)

> Today: «Asesmen ini sudah ditutup oleh sekolah dan tidak dapat dikirim. Jawaban yang sudah tersimpan tetap ada.»

- **The tone is calm and right,** and it keeps the saved answers.
- **Two gaps:**
  1. **It does not say the assessment is not scored.** A student who answered everything will wait for a result. The teacher's confirmation already says «ditutup sekarang dan tidak dinilai», so the student's line should say the same.
  2. **It has no next step.**
- **On «oleh sekolah»:** the code PR003 can come from the teacher (Akhiri penugasan) or from a year-end run, so naming one actor can be wrong. Name none.
- **Proposed:**
  > «Asesmen ini sudah ditutup dan tidak dinilai. Jawaban yang sudah tersimpan tetap ada. Bila ada pertanyaan, tanyakan kepada guru Anda.» / EN «This assessment has been closed and is not scored. The answers already saved are kept. If you have a question, ask your teacher.»
- **Plus a way back.** The notice offers «Kembali ke Belajar» (an existing link key if there is one; otherwise a new `sync.ke_belajar`). Today the player stays on a question that can no longer be sent.

### 2.3 A lesson PINTAR no longer shares

- **The title fix in `pengajar.ts` is right:** first `distributed_releases`, then `judul_materi_kelas`.
- **`mengajar.akhiri.tanpa_judul` «materi ini» works inside the sentence,** for example «Tarik penugasan materi ini?».
- **But the class list has no fallback.** `page.tsx:198` renders `{x.kursus}` directly, so a title that is still empty draws an empty `pin-title`.
- **Change:** new key `mengajar.materi.tanpa_judul`, «Materi tanpa judul» / EN «Untitled material». «materi ini» does not work as a list item.

### 2.4 `/masuk` for a suspended or closed account

- **Consistent with the ruling:**
  - the neutral `auth.pw_gagal` for every refusal;
  - «Akun Anda sudah ditutup? Minta dibuka kembali» (`auth.tutup_tanya`, `auth.tutup_go`) below «Lupa password?»;
  - `akun.tinggal.akibat.close` sends the person to the same words, «Minta dibuka kembali»;
  - `buka_kembali.terkirim` gives the same answer for every address. A suspended person who sends it is told nothing false.
- **Inconsistent:**
  1. **The identity label.** Sign-in asks for «Email atau username» (`auth.pw_identitas`), but `buka_kembali.identitas` asks for «Email untuk masuk atau PINTAR ID». A person types what they type at sign-in.
     - If `minta_buka_kembali` accepts a username: «Email atau username».
     - If it accepts the PINTAR ID only: keep the label and add where to find the ID.
     - **→ engineering:** which identifiers it accepts.
  2. **`buka_kembali.galat.tunggu` says «dari perangkat ini».** The pace is keyed by network address, so on a school's shared connection another person's requests count.
     - Use «Sudah terlalu banyak permintaan baru saja. Coba lagi beberapa menit lagi.» / EN «Too many requests just now. Try again in a few minutes.»

---

## 3 · My review items as implemented in `ffb1e513`

| Item | Result | Key or file | Change |
|---|---|---|---|
| Diakhiri / Ditarik and «Mengapa penugasan ini berakhir?» | ✓ | `mengajar.akhiri.jenis*`; `AkhiriPenugasan.tsx:97–104`: two confirmations whose button follows the choice; quiet «Tutup tanpa mengubah»; reason 10–300 | Only the «kelas dan sekolah» wording (§1.2) |
| The reissue table and its «sama» row | ✓ | `FormTerbitUlang.tsx:22–54`: Data / Field; name, school, lesson, then the result; the word «berbeda» in the pill; reason not on the check page | Small: the result row reads «Berbeda: sama» under the header `sertifikat.ganti.berubah`. Rename the header «Perbandingan» / «Comparison» |
| The staff confirmation names the person, the school and the roles | ✓ | `staf.akhiri.tanya`, `staf.akhiri.peran_berakhir`; `staf/page.tsx:253–255` | Small: <br>• `peran_berakhir` repeats the `staf.akhiri.arti` sentence one screen apart; keep only «Semua perannya di sekolah ini berakhir: {daftar}.» <br>• Join `{daftar}` with `daftarKata`: «Guru 5B, Guru 5C dan Kepala departemen Matematika» |
| The category order and the CORRECTION group | ✓ | `staf-kontrak.ts:21`; `optgroup` «Bukan kepergian» | None |
| «Lepaskan» for roles | ✓ | `staf.ubah.lepas`, `config.action.revoke` | None |
| The split «already closed» messages | ✓ | `akun.tinggal.galat.account_already_suspended` / `_already_closed` / `_not_suspended`, each with its date | None |
| The shorter «meninggalkan PINTAR» fact list | ✓ | `MeninggalkanPintar.tsx:27–31`: a student sees access, academic records and certificates, then `lewat_sekolah` | None |
| The Keamanan refusals name Admin PINTAR | ✓ | `keamanan.ditolak`, `keamanan.akun.arti` | Not this check's scope, for the 4.1 consistency list (P-item 6): «Admin platform» remains in `role.SYSTEM_ADMIN`, `config.refused`, `config.kesehatan.bukan_admin`, `laporan.templat.tak_berwenang`, `pemeliharaan.darurat.arti`, `galat.maintenance_not_allowed`, `galat.role_scope_required`, `studio.paket.masalah.package_could_not_be_saved`, `aktivasi.ditolak` and the `emailuji.*` refusals |

---

## 4 · Kenaikan kelas (#96, `0d3830ec`; `src/components/kenaikan/KenaikanKelas.tsx`)

### 4.1 The review

**✓ As designed:**
- the main group in a disclosure, with the exceptions first and always open;
- the step indicator;
- the destination-only teachers, with each Kelas carrying its year;
- the acknowledgement that names the Kelas;
- «Buka Peran & akses di tab baru»;
- the confirmation sentence with the counts.

**One count is wrong.** The disclosure's summary (`:228`) counts `utamaGrup.isi.length`, which includes Tingkat-only learners, but the list under it (`:231`) leaves them out because they are already under «Pengecualian». So the summary says «37 naik ke Kelas 6A · 2027/28» and opening it shows 36 names.
- **Change:** the summary counts the names it holds.
- The overall line `data-kenaikan-ringkas` keeps the totals.

### 4.2 «Tanpa tujuan»

- `kenaikan.guru.tanpa_tujuan` is right: «Tidak ada kelas tujuan: setiap murid kelas ini lulus atau keluar.»
- **`kenaikan.guru.tanpa_tujuan_centang` should not be a required checkbox.** When no learner has a destination, there is no teacher to acknowledge. The box then asks the admin to confirm what the screen has just told them.
  - It also says «tidak ada murid yang **pindah** ke kelas lain», which reuses the PINTAR transfer word.
- **Change:** when `tujuan` is empty, leave out the checkbox (`:251–257`) and keep the sentence. Delete the key.

### 4.3 The outcome page and «Lanjut ke»

- **✓ As designed:**
  - «Diperiksa dari data PINTAR: semua sesuai.» and the mismatch line with both values;
  - the teacher line with the year;
  - «Lanjut ke {kelas} (belum diproses)» as the primary action, with the year (`kelasDenganTahun`, `:123`);
  - «Pilih kelas lain» quiet.
- **The outcome is not grouped as in the review.**
  - `:149–156` draws every group (`g.kelompok`) open, in first-appearance order, with no «Pengecualian» first. At 40 learners the main group is again a long list on the page.
  - **Change:** reuse the review's structure (Pengecualian first, then the main group in `pin-disclosure`, then the others), each name followed by `tercatat`. On a phone these are already lists, which is right.
- **Not verified:** whether `tanggal(h.pada, "cap")` (`:140`) uses the school's timezone (`zona-sekolah.ts`). **→ engineering:** confirm.
- **Unused keys to delete:** `kenaikan.kolom.murid`, `kenaikan.kolom.hasil`, `kenaikan.kolom.sekarang` and `kenaikan.guru.sudah_ditinjau` (no caller at `435a2856`).

### 4.4 The audit fold by `run_id` (`src/lib/jejak-audit.ts:50–86`; `konfigurasi/page.tsx:1905–1925`)

**✓:**
- one parent row per run;
- each learner by name with the decision, and the departure's reason;
- linking by the recorded id, never by time.

**Four changes:**
1. **The learner's line drops the destination.**
   - Today `kenaikan.keputusan.naik` gives «Ayu Lestari · naik kelas», and «tinggal kelas» has no Kelas.
   - The audit is where someone later asks *which* class.
   - **Change:** use the same phrases as the review, with the year: «naik ke Kelas 6A · 2027/28», «tinggal kelas di Kelas 5A · 2027/28». The summary's outcomes need the destination name and year (**→ engineering**).
2. **The parent row does not name the run.**
   - «Sasaran» reads the table and the school.
   - **Change:** «Kenaikan kelas · Kelas 5B · 2026/27 → 2027/28».
   - The disclosure's summary then gives the counts by outcome, as approved: «6 murid: 4 naik, 1 tinggal kelas, 1 keluar». Today it gives «6 murid, masing-masing dengan keputusannya».
3. **«{lain} catatan terkait dilipat di sini» counts rows that cannot be opened.**
   - `lipat.anak` is read only for its length, so the folded rows are counted but not reachable.
   - That is closer to hiding than to folding.
   - **→ Sharon** («fold, don't hide»): whether the folded membership rows must be listable. If so, add a second quiet disclosure, «Catatan terkait ({n})», that lists them in the table's own row form.
4. **`audit.kenaikan.bagian` «bagian dari satu kenaikan kelas»** uses the frozen level word «Bagian» in lowercase. It also gives the reader no way to the parent row.
   - **Change:** «Termasuk kenaikan kelas {kelas} · {tanggal}; baris utamanya ada di halaman lain.»

---

## Summary

**To change before Sharon's re-verification:**
- **§1.1:** the history folded below the working list, with «Ditarik» marked by its counting clause.
- **§1.2:** «kelas dan sekolah» in three keys, and `hasilbelajar.ditarik` split by reader.
- **§1.3:** no target judgement and no «Beri ulang» on a withdrawn result.
- **§2.1:** a finished Tes awal kept.
- **§2.2:** «tidak dinilai» and a way back.
- **§4.1:** the disclosure count.
- **§4.3:** the outcome grouped as in the review.
- **§4.4.1–2:** the audit with destinations and the run named.

**Small:**
- the class list's title fallback (§2.3);
- the two `/masuk` reopen strings (§2.4);
- the «Perbandingan» header and `daftarKata` (§3);
- the checkbox when there is no destination (§4.2);
- `audit.kenaikan.bagian` (§4.4.4);
- deleting the unused keys.

**Confirmed as implemented:** all eight `ffb1e513` items.

**Questions:**
- **→ engineering:**
  - the bukti filter by assignment;
  - `tugasSesi` for a withdrawn assignment;
  - the reopen identifiers;
  - the timezone at `:140`.
- **→ Sharon:** whether the folded audit rows must be listable.

**Not seen:** the rendered screens, focus, the accessibility tree and 320 px.
