# PINTAR 4.0 · Experience Readiness Report (Daisy, 8 Nov 2026)

Read against staging `c4944fab` (migration 200). Its `src/` is identical to the trees that the X5 walk (`9a97bb54`) and the report walk (`76d75420`) ran on.

## 0. What this rests on (read this first)

| Kind of evidence | What it covers |
|---|---|
| **Staging, by automation** (job logs) | X5 walk `42428273364`: 9/9 PASS. Report walk `42424027157` (green, per Second Eye; I did not read its log) |
| **Rendered by me from `c4944fab`** | The built report components (Ringkasan Kelas, 2b, topics × classes with 5 and 10 classes, Ringkasan Sekolah, PD Ringkasan Kelas for the facilitator and Admin) at 1280, 390 and 320 px and A4. Rendered with axe and a scrollWidth check, using the page's own frame components; only the signed-in shell is absent |
| **Code reading** | The whole application, in four read-only reviews (navigation and actions; the admin's first run; the educator's Studio journey; forms, terminology and mobile). I re-verified every A finding myself in the code |
| **Not inspected** | Any staging screen by eye. The journey screenshots are GitHub artifacts on Azure blob hosts that this session's network refuses; a `pintar40` environment that allows them now exists for the next session. Nothing here was used signed in |

So **no screen was inspected live**. Report findings are from my renders of the deployed components; all other findings are from code.

## 1. X5 closure

Every correction is present at `c4944fab`, checked by content: the patch was applied with edits, not byte for byte.

| # | Status | Evidence |
|---|---|---|
| X5-1 scope line | **Closed** | Code (`pin-intro`, no banner). Staging D4: «the sentence true» for all four readers. Render |
| X5-2 natural sentence | **Closed** | Code (`{daftar} belum mulai.` with `daftarKata`). Render |
| X5-3 dash | **Closed** | Code. Render at 1280, 390, 320 and A4 |
| X5-4 mark kept with its word | **Closed** | Code. Render |
| X5-5 no percentage | **Closed** | Code; LAPORAN-FASILITATOR-01 asserts no `%`. Staging D4: «academic marks false» |
| X5-6 compact table | **Closed** | Code. Render |
| X5-7 A4 pagination | **Closed** | Code (the `break-inside: auto` rule sits after the section's `avoid`). Render: page 1 holds the frame and 12 rows; the header repeats on page 2. Staging D7: a 1-page PDF with both participants |
| X5-8 header wrapping | **Closed** | Render |
| X5-9 refusal and empty in words | **Closed** | Staging D5: the Kepala departemen of «Kelas Tinggi» and the Guru of «Kelas 5A» see no participant and no academic mark |

**Caveat:** staging's PD class participants have no package yet (D4: «Belum diberi paket»). The step table (X5-2 to X5-7) was therefore seen in my renders of the deployed code, not on staging. One Second Eye step that gives a package and repeats D4/D7 would show it live. I don't hold that open as a defect.

## 2. Cross-application consistency

The grammar holds in most places:
- **Pagers and result lines:** one pager (K2/K6) and one result line (K3).
- **Busy words:** every server form shows one.
- **Back links:** they name their destination (K1).
- **Shell:** S2/S5/S6 and K7 hold.
- **The `/` chooser:** follows E2.
- **Terminology:** frozen terms are applied (Murid, Guru, Pemetaan Awal, Uji Penguasaan, Mengajar).

The drift is concentrated in older Konfigurasi code and in destructive actions:

| # | Finding | Class | Smallest correction |
|---|---|---|---|
| C1 | Destructive acts are not «red twice» (P8). «Tarik dari peredaran» and Kanonik's withdrawal act on one press. «Keluar dari semua» is blue on /akun but red in the menu. «Ya, tutup putaran» is primary. The Konfigurasi «Akhiri», «Batalkan» and «Tarik» are plain | B | `pin-konfirmasi-bahaya` plus `pin-bahaya-pasti`, as FormCabut does |
| C2 | Konfigurasi puts a row's result under the whole list, not in its row (K4/P7), and every act there says «✓ Selesai.» / «Belum berhasil.» (P5) | B | `HasilDi baris=` per row; per-section `awal` keys |
| C3 | «Batal» is drawn three ways: a text link, a secondary button, or a quiet button (P2) | B | `pin-btn pin-quiet` everywhere |
| C4 | Several primaries in one view: Aktivasi (up to 22), Aktivasi/orang (3), Konfigurasi row lists, Struktur «Tambah …», Studio upload after a passed check | B | One primary per view (P1). D-140's "one primary per form" needs a ruling where it conflicts |
| C5 | Steps are drawn three ways: publishing uses K8 dots; upload uses numbered circles; Siapkan / Uji Cepat use eyebrow words | B | `.pin-ung-langkah` and `.pin-tahap` take the `.pin-lt-langkah` markers |
| C6 | Field labels have four looks. Konfigurasi errors come from the browser's own bubble, in the browser's language. `BidangTeks` has no error slot. Hints are not linked to their fields. The required «Alasan» is required in one place and optional elsewhere | B | Add `galat` and `aria-describedby` to `BidangTeks`; move Konfigurasi to it |
| C7 | Typography outside tokens: 12 `text-xs` in Konfigurasi; `text-2xl` / `text-3xl` titles on `/`, Konfigurasi and Evaluasi; h2s styled as labels | B | `.pin-h1`, `.pin-hint`, `pin-studio-h2` |
| C8 | Admin pages for «Laporkan masalah» and the PD record use the focus shell (no navigation); /akun uses the staff shell (P19) | B | The same shell as /akun |
| C9 | A PD refusal is drawn as an empty state on the report and as a refusal page on the record (P13/P15) | B | `HalamanPenolakan` on both |
| C10 | Terminology. «penilaian» for an assessment (4 keys; N6 had fixed one). «hubungi admin sekolah» in recovery text. Lowercase «admin sekolah» (16 keys). «username» vs «nama pengguna». One object named Kursus, Paket, Terbitan and Materi. «Cek penguasaan» vs «Uji Penguasaan» in workbook help. «terbitkan ulang» names a step that doesn't exist | B | Key-by-key copy fixes. Only «username» vs «nama pengguna» and «Kursus» in certificates need a word from Dr Gladys |
| C11 | «Kembali» used as "previous" in the item and tour pagers (K2); back-link words drift from the nav words; emoji used as icons; Dialog lacks its close button; and smaller items | C | As listed in the review notes |

## 3. First-time-user friction

**School administrator**
- **A1, blocking.** A natural sheet («Nama, Kelas»: 7A, 7B) auto-maps «Kelas» to the place-id field. Every row then fails with «Kolom tempat tidak berisi penanda yang sah.», which does not say what to do. The way that works, «Satu pilihan untuk semua», one list per class, is stated nowhere. *Patched (see §6).*
- **B.**
  - Nothing says teachers are given their role before being activated by email; Konfigurasi counts a new teacher under «buat kartu kelas».
  - The import ends with no way on to Aktivasi or Peran.
  - Pendataan hides the upload until Kode sekolah is saved, without saying so; the Konfigurasi set-up never mentions the code.
  - Only CSV can be chosen, though the page says «spreadsheet».
  - Every Pendataan action is a secondary button.
  - «Persiapan sekolah» counts PD classes and participants as academic ones, and its «murid» step is not a link.
  - Peran & akses has no intro sentence, no heading on its form, an optional-looking «Lingkup» that is really needed, and no hint for «Berlaku sampai».
  - Enrolling a PD participant shows an empty list without saying a role is needed first.
  - Aktivasi's «Semua orang … sudah bisa masuk» appears even when nobody has been recorded.

**Educator**
- **A2, blocking.** The Guru cannot reach their own Ringkasan Kelas (the approved 2-guru report, with «Murid yang perlu penguatan»). Only Konfigurasi and Pimpinan link to it. *Patched.*
- **B.**
  - While waiting for review, the package page says «Perlu tindakan — Ada yang bisa Anda selesaikan sekarang», and its reasons point to «Buat terbitan», which the author cannot take.
  - PINTAR sends no notification and doesn't say so: «Minta rekan yang disebut di atas» names only roles.
  - Studio's «Menunggu tindakan Anda» counts colleagues' drafts and drops VALIDATED, APPROVED and FROZEN, so a package can stall unseen.
  - List rows say «Sekarang: Setujui isi» to someone who cannot take that step.
  - «Periksa isi sekarang» is secondary, below the primary «Tandai lolos pemeriksaan».
  - The Lihat bukti footer says per-question detail is not shown here, yet the page links to «Lihat per soal».

**School leadership**
- **PASS on finding reports:** Pimpinan links each report, and the lead sentences say where attention is needed.
- **B, printing.** On the topics × classes grid with more than six classes, page 1 holds only the page head. The landscape named page starts a new page, so the grid moves to page 2.
- **B.** The owner's 7 Nov «explain once» ruling is **not applied**. «di bawah target» / «Perlu penguatan» is printed under every amber value: Guru A, every Kadep cell, Dekan A and C.
- **C.** Dekan «Peserta 418» has no base. The specimen gives «dari 468 murid terdaftar»; the component never draws one.

## 4. Accessibility and mobile

- **A3, blocking for keyboard users.** A lesson table (`Teks.tsx`, `.pin-ttabel`) scrolls sideways but cannot be reached by keyboard: it has no tabindex, role or name (WCAG 2.1.1). A keyboard learner on a phone cannot read its hidden columns. *Patched.*
- **Renders at 1280, 390 and 320 px:** axe found 0 violations on every rendered report. No page scrolls sideways at any width; wide tables scroll inside focusable, named regions.
- **From code:** 44 px control floor; no fixed width over 288 px; every image has alt text; icon-only controls have names.
- **Hard-coded fraction name.** One aria-label is in Indonesian whatever the language (`Halaman.tsx:36`) — B.
- **Heading level.** The certificate skips h2 — C.

## 5. Remaining issues

**A (3):** A1, A2 and A3, all patched (§6), awaiting engineering.

**B (about 30), the ones most likely to interrupt the walkthrough:**
1. The Studio waiting state.
2. The teacher role-and-activation order.
3. The Pendataan dead end and the hidden Kode sekolah step.
4. Destructive acts without a confirmation (C1).
5. The wide-grid print.
6. «explain once».

The rest are listed in §2 and §3.

**C (about 20):** cosmetic, and not for this walkthrough.

## 6. Corrections prepared

**`SIAP-A-koreksi.patch`** against `c4944fab` (5 files, +15 −4):
- **A1:** «Kelas», «rombel», «class» and «group» are no longer guessed as the place. The failure sentence and `pendataan.peta.sub` now say to use «Satu pilihan untuk semua», one list per class.
- **A2:** a secondary «Ringkasan Kelas» link on a learner Kelas page. `asalLaporan` gets `kelas` («Mengajar»).
- **A3:** the lesson table becomes a focusable, named region.

**Checks:**
- `tsc`: clean.
- Full selftest: 420 pass and 2 fail. The 2 failures are UX1-S0-MUAT-01 (needs `next build`) and BOB26-K01 (needs `CARD_PEPPER`), and they fail identically on the unpatched base.

No reachable Second Eye or engineering session exists here. Engineering applies the patch on `claude/awesome-rubin-bqxp6p`; Second Eye verifies on staging. Nothing was merged or deployed.

## 7. Recommendation

**Not ready yet for the owner's unscripted walkthrough.**
- The three A issues will interrupt a first-time admin, Guru and keyboard user; all three are patched and small.
- Six of the B issues are in the very journeys the walkthrough exercises: Studio waiting, teacher activation, Pendataan's dead end, destructive acts, wide-grid print, and «explain once».

**Ready when:**
1. `SIAP-A-koreksi.patch` is applied and verified on staging.
2. The six walkthrough-path B items are corrected, or accepted by the owner as known.
3. One signed-in pass by Second Eye (or me, with the screenshots reachable) confirms the admin, Guru and leadership journeys at 1280, 390 and A4.

The remaining Bs and the Cs can follow the walkthrough. None of this needs a new feature or a change of scope.
