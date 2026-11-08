# Final Design Readiness Report (Daisy, 8 Nov 2026)

**Candidate:** `claude/awesome-rubin-bqxp6p` at `f2a52a5a`. Its `src/` is the same as `b41aeeed`, the head Second Eye's completion report §4 describes. **Answers:** `09-SIAP-VERIFIKASI.md`.

## How this was verified

**The real application, on my own local stack:**
- the candidate built with `next build`;
- served by `next start`;
- the Supabase local stack with every migration and the synthetic seed.

I signed in as the seeded admin, Guru, Kepala departemen and Dekan, and pressed PINTAR's own buttons in Chromium at 1280, 390 and 320 px, with the keyboard where the item asks for it.

**What I created through the UI** (local data only):
- a Kode sekolah;
- a two-learner import;
- a class card;
- a Studio package uploaded from the synthetic chapter, with a wide table added to one lesson, taken by the Guru to «Setujui isi».

Second Eye's walk `audit/siap-jalan.mjs` also ran here: 7/7 PASS.

**Rendered from the candidate's components** (the local seed has no below-target figures and no grid): B5 and B6, at 1280, 390 and 320 px and A4.

**Not seen:**
- **Staging:** it still runs `c4944fab`.
- **Screen readers:** NVDA and TalkBack remain human checks.
- **Withdrawal confirmations:** the Studio and Kanonik withdrawals and the Konfigurasi maintenance confirmations need a published package or a live window. I read their code; **only «Keluar dari semua» was pressed** (Second Eye's R4, and my screen).

## 1. A findings

| # | Verdict | Evidence |
|---|---|---|
| **A1** | **Not closed** | **The correction works:** «Kelas» is never guessed (Tempat stays «Tidak dipakai»); the page states the supported format with an example; choosing the «Kelas» column by hand gives the new, actionable sentence for every row. **But the essential journey still fails silently.** Without a class chosen at Tempat, «Periksa daftar ini» passes and offers «Ya, catat orang-orang ini» for two learners; the preview never shows that they have no class. After approval, Aktivasi gives them class cards, so they can sign in but belong to no class, and no material can reach them. **Two smaller points:** after a failed check the closing line says «Perbaiki berkas Anda», when the fix is in the mapping, not the file; and every button in the flow is secondary (M2). **Smallest correction:** when learner rows have no Tempat, the check names it above «Ya, catat…» («2 murid belum punya kelas: pilih kelasnya pada Tempat») and the approval waits for it. A staff list, which rightly has no Tempat, is unaffected |
| **A2** | **Closed** | «Ringkasan Kelas» sits beside «Lihat bukti» on 5A (a secondary button); the report opens with «← Mengajar»; 1280 and 390 px, no sideways scroll. A PD class keeps its record link instead |
| **A3** | **Closed, with a human check outstanding** | **Keyboard:** the lesson table is a region named by its headers; Tab reaches it after the page's earlier stops; a 2 px `pintar-primary` ring shows; ArrowRight and End scroll it to its last column at 390 and 320 px. The page stays 390 and 320 px wide. **Notes (C):** nothing shows that more columns lie to the right, and a long last column makes every row very tall. **Outstanding:** NVDA / TalkBack (§5 of the completion report) |

## 2. The six walkthrough Bs

| # | Verdict | Evidence |
|---|---|---|
| **B1** | **Closed, with a note** | **The author, live:** after «Ajukan untuk ditinjau» the package reads «Menunggu orang lain — Langkah berikutnya, «Setujui isi», diambil oleh Kepala departemen atau Admin sekolah… PINTAR tidak mengirim pemberitahuan: beri tahu mereka…». The reasons list is hidden. Studio's list says «Sekarang: Setujui isi · Menunggu orang lain». **The reviewer, live:** Studio home shows «Menunggu tinjauan Anda 1». **Note (must fix):** the reviewer's own package page still shows the old reasons, «19 bagian isi masih menunggu langkah Setujui isi» and «Paket ini belum memiliki terbitan: mulai dari langkah Buat terbitan.», beside the one action «Setujui isi». Two next steps compete, and the count means nothing to a teacher. Hide the readiness reasons until a release exists. **C:** «PINTAR tidak mengirim pemberitahuan» is said twice on the author's page (state line and panel) |
| **B2** | **Closed** | **Peran & akses:** an intro with the order (role here, then email activation on Aktivasi), the heading «Berikan peran», «Lingkup» with what it means per role, and a hint under «Berlaku sampai». **Aktivasi:** the intro says the same, and that PINTAR sends nothing. **Konfigurasi «Yang menunggu»:** says to give teachers their role first. The date field shows the browser's own format (`mm/dd/yyyy` in an English-language browser); the echo «Belum ada tanggal.» stays in Indonesian |
| **B3** | **Closed** | Without a code, «Simpan kode sekolah di atas lebih dulu…» appears where the upload will be. The done page gives «Langkah berikutnya»: Peran & akses for teachers' roles, then Aktivasi (email for staff, a class card for learners). **Note (B):** under the Kode field sits the hint for a *person's* registration number («Nomor registrasi orang ini…»), and «Simpan kode» gives no success line |
| **B4** | **Not closed** | **What works:** one shared `KonfirmasiBahaya`, focus to «Batal» on open and back on «Batal», a filled red confirm, nothing sent until confirmed («Keluar dari semua», live). **The gap:** P8 is «red twice, never once», and the opener is a plain `pin-btn`; the design system's opener is `pds-btn-destructive` (red text on white). The app has no such class. **Smallest correction:** add `.pin-btn.pin-bahaya`, the DS values, and use it for `KonfirmasiBahaya`'s opener: one component, every use. On the design question: **yes, «Batal» as `pin-quiet` is right**; P2 asks for a quiet button after the act |
| **B5** | **Closed** | Rendered at A4: 10 classes × 5 topics print as **one landscape page**, with the head and the grid together. 5 classes print as one portrait page |
| **B6** | **Closed** | **Guru, grid and Dekan:** no value draws its words; each amber value carries them as `pin-sr` text. **Legends:** one per figure, «Angka berwarna jingga menunjukkan penguasaan di bawah target.» (Guru, grid) and «Titik berwarna jingga menunjukkan penguasaan pada pita Perlu penguatan.» (Dekan A and C). The grid's key carries «Tanda — berarti data belum cukup.». The report reads visibly calmer |

## 3. Must be fixed before the walkthrough

All are small, and all were seen in the running application unless marked "rendered".

| # | Finding | Smallest correction |
|---|---|---|
| F1 | **A1:** learners recorded with no class, silently (above) | The check names learner rows with no Tempat; the approval waits |
| F2 | **B4:** the opener is not destructive | `.pin-btn.pin-bahaya` on `KonfirmasiBahaya`'s opener |
| F3 | **Regression (rendered):** at 390 and 320 px the topics × classes page scrolls sideways (481 px for 5 classes, 1005 px for 10; it was 390 on `c4944fab`). Each new `pin-sr` span is `position: absolute` and escapes the scroll region, which isn't positioned | `.pin-lk-kisi-wadah { position: relative; }`. Checked: the page returns to 390 px |
| F4 | The reviewer's package page shows the old reasons beside «Setujui isi» (B1 note) | Hide the reasons until a release exists |
| F5 | **M2:** Pendataan has no primary button. «Simpan kode», «Lanjut ke pemeriksaan», «Periksa daftar ini» and «Ya, catat orang-orang ini» are all secondary (`.pin-go` has no style outside `.pin-act`) | `pin-primary` on those buttons. That is one per view, so it doesn't conflict with D-140 |
| F6 | **M7:** on a learner's row in Aktivasi the primary is «Aktifkan dengan email», and «Buat kartu kelas» is secondary | The card is primary when the person may have one. Still one primary per row (D-140) |
| F7 | **M10:** after «Buku kerja lolos pemeriksaan», «Periksa buku kerja» and «Simpan ke Studio» are both primary | «Periksa buku kerja» is primary only until the check passes |
| F8 | **M11:** «Tandai lolos pemeriksaan» moved the package on although «Periksa isi sekarang» was never pressed | Show «Periksa isi sekarang» in that panel, ahead of the mark |
| F9 | **M14:** the upload's check result still says «Kursus 1 · Bab 2 …» (`studio.unggah.hitung.courses`) | «Paket» |
| F10 | **W1.16:** after approval, nobody's Studio home counts the package, and the zero line says «Tidak ada yang menunggu tindakan Anda di Studio.» to the person who must «Buat terbitan» | **On screen, until the migration:** the zero line becomes «Lihat daftar paket di bawah: setiap paket menyebut langkahnya sekarang.» **Also tell the owner** |

## 4. May follow the walkthrough

| Finding | Why it can wait |
|---|---|
| C2: Konfigurasi results under the list, and «✓ Selesai.» | Each act reports its outcome, and the page scrolls to it |
| C3: «Batal» drawn as a text link in older non-destructive forms | Every destructive confirmation now uses `pin-quiet` |
| C5: step lists drawn three ways | Each names its steps and marks the current one |
| **C6: form labels and error slots** | My walk met no case where it stopped the admin. A native required bubble points at its field; the order and hints now read well. It is still a ♿ item for the human pass |
| C7: typography outside tokens; the eyebrows inside the shell; h1 «Menambahkan orang» / «Aktifkan akun» against the nav words | Legible; consistency only |
| C9, C11, lowercase «admin sekolah», «Cek penguasaan» in the workbook (its own value), the certificate's h2 | As argued in the completion report §3; I agree |
| Dekan «Peserta 418» without a base | It needs a new read; the figure is the database's |
| «terbitkan lagi» in `mengajar.sedia.kode.*` | It now says to upload the next version in Studio first; acceptable |
| A3's scroll cue and tall rows; B1's repeated sentence; B3's misplaced hint and missing success line | C. B3's hint is a one-key fix worth riding along with F5 |

## 5. Rulings asked for

1. **C4, one primary per view versus D-140.** My recommendation: keep D-140 for row lists where every row offers the same act (Aktivasi's people, Konfigurasi's rows), and apply P1 to a page's own next step. F5, F6 and F7 are the three places where the primary currently points to the wrong act or to none. They are fixed under either rule and need no ruling.
2. **C6:** may follow, as above.
3. **W1.16:** the rename alone is not enough, because the zero line tells the approver nothing is waiting. With F10's line on screen, it is enough for the walkthrough, provided the owner is told.

## 6. Cross-feature consistency verdict

On the corrected journeys:
- **Navigation and context:** shell, context block, back links naming their destination, chooser (`/`).
- **Result lines and pagers:** consistent.
- **The new confirmation:** one pattern everywhere, apart from F2.
- **Reports:** speak one grammar (letters, lead, amber with one legend, A4).

The remaining inconsistency is concentrated in primary-button weight (F5–F7) and in older Konfigurasi form plumbing (C2, C6), which may follow.

## 7. Accessibility still open

- **NVDA / TalkBack:**
  - A3: the region announced by its headers;
  - B4: the question announced on open;
  - B6: amber values heard with their words;
  - C6: the native bubble.
- **The human journeys H1–H20:** none recorded.

## 8. Recommendation

**NOT READY**, by a short list. F1–F10 are each a sentence, a class or a condition; none is a redesign or new scope. **READY** once all three hold:
1. F1–F10 are corrected.
2. The owner rules on C4, or accepts my recommendation.
3. One signed-in pass on staging confirms A1 (both paths), B1 (author and reviewer), B4 and the 390 px grid.

I can run that pass here on the local stack as soon as the corrected head is pushed. Staging needs promotion first.
