# Daisy's rendered check at `bcecb425`: dispositions (10 Nov 2026)

**Source:** `docs/coordination/ux/completion-4.0/TINJAUAN-bcecb425.md`, on `ux-1/daisy-experience` at `536b2240`.

**Owner (10 Nov):** these are acceptance blockers to fix within 4.0, in three groups. Validate each flow locally before the next full run, then give Daisy one integrated rendered recheck. Sharon reviews only the changed provenance and audit boundaries. No owner decision is needed.

**Evidence for `bcecb425` itself, which stands unchanged:**
- CI 42758265813: green.
- Journeys 42758262884: job A and job B green.

---

## 1 · The learner journey

| # | Finding | Change | Proof |
|---|---|---|---|
| A1 | Enter is taken from every control in the player (`288cdb52`, WCAG 2.1.1) | Enter on a focused button, link, summary or form control is that control's own. It moves to the next question only when nothing holds focus. The letters and arrows are unchanged | **PEMAIN-K01**: red on `bcecb425`, green now. Local browser walk at 390 px, by keyboard: Enter chooses an answer and stays on the question; Enter on «Selesaikan pemetaan» finishes it |
| A2 | «Perlu contoh?» covers the question on a phone (it shared `.pin-bantuan` with the Help panel) | The offer has its own class, `.pin-bantuan-soal`: inline, `max-width: 60ch` | **PEMAIN-K01**. Walk: `position: static`; option A is the element under its own centre at 390 and 320 px; no sideways scroll |
| B4 | The sitting stays live under the closed notice | On PR003 the page ends the sitting: the hand-in question closes, every player button is disabled (the answers drawn in the one disabled look), the shortcuts stop, and focus moves to the notice | **PEMAIN-K01**. Walk: the teacher ends the lesson through `akhiri_penugasan` while the learner's Uji Penguasaan is open, then «Kumpulkan» → «Kumpulkan» by keyboard. The notice shows and takes focus; nothing under it can be pressed; Tab reaches «Kembali ke Belajar»; Enter goes to `/belajar` |
| B3 | `/belajar` loses «Hasil belajar» when every lesson has closed | The card also shows when the learner's history holds a result in a lesson no longer assigned (`adaHasilTertutup`, the same history Hasil Belajar reads) | Walk, all-closed case: every lesson of the learner is ended through `akhiri_penugasan`, none in force, and one finished sitting is kept. `/belajar` says «Belum ada materi…» and still offers «Hasil belajar»; its link opens `/belajar/hasil` by keyboard; the kept result is listed. Red side: Daisy at `bcecb425` |

## 2 · Promotion decisions kept faithfully

| # | Finding | Change | Proof |
|---|---|---|---|
| B8 (refused) | The outcome folds the Tingkat learner into the main group | `kenaikan_hasil` returns each learner's `sumber` as the run recorded it; the run's summary already held it. The outcome draws «Pengecualian» with the review's rule. `20270112210000` was corrected in place (undeployed) | **F37-K06**: red on `bcecb425`'s function («the read-back does not say where each learner came from»), green now. **KENAIKAN-A01** restated: the outcome lists B, C and D as exceptions and folds A alone, as the review does |
| B8.1 | A graduating class is all «Pengecualian» | The main group is the largest group of any outcome. A tie is settled by the outcome (naik, tinggal, lulus, keluar, pindah, then the destination), never by the learners' order: the review and the outcome list them in different orders and must choose the same group (owner, 10 Nov). A Tingkat-only learner stays a named exception whatever the main group | **KENAIKAN-K02** restated: «4 lulus» folded, the leaver named. A tie chosen alike in three orders; red on the first-seen rule |
| B8.2 | The summary's «·» reads as five items | The groups are joined by «, »; a repeat reads «tinggal kelas di …» | KENAIKAN-A01 restated |
| B8.3 | The outcome repeats the decision on every matching line | What PINTAR recorded is shown only where it differs; the check line already says everything matched | KENAIKAN-A01 restated |
| B8.4 | Small items | No «Buka Peran & akses» link without a destination. No «0 tidak diubah» clause. The select is named from the visible name (`aria-labelledby`), so the name is read once. Struktur shows «2027/28» | DAISY-05-STRUKTUR-02 and the experience render test restated to the short year |

## 3 · The remaining screens

| # | Finding | Change | Proof |
|---|---|---|---|
| B6 | The reissue table breaks words at 390 and 320 px | Below 640 px each row is a block, each value with its label | Rendered at 1280, 390 and 320 px: no word broken mid-word, no sideways scroll |
| B6 | «Kursus» beside «pelajaran» | One word, «paket» (X12 ruling 2), in the panel's row and both sentences. The list column «Kursus» stays the open X12 item | D168-X12-1 |
| B12 | A certificate whose chapter is no longer assigned is titled «Sertifikat»; «Berlaku» appears twice | The sealed course title, read by `my_certificate`, for those rows only (the list keeps the ten Q-11 columns). The pill is drawn once | UX1-S1-CERT-COLS-01 unchanged and green |
| B5 | The pace message is untrue after one request; the typed message is lost | «Baru saja ada permintaan dari jaringan ini…». The form keeps what was typed for one refused send (CR-84's `SimpanIsian`, this tab only) | static copy tests |
| B1 | A folded row says «Ditarik» twice | No pill in a folded row | PENUGASAN-A01 |
| B2 | The authoring names «Cek penguasaan», «Pemetaan awal» | «Uji Penguasaan · ‹course›», «Pemetaan Awal · ‹course›» | to Daisy's recheck |
| B9.2 | Related audit rows do not name the learner | Each related row names its learner and Kelas. They are read from the enrolment rows of the same trail page, not from the enrolments table (EFF-K02) | **KENAIKAN-K02** (`petaEnrolmen`, `orangBarisRun`, `kelasBarisRun`) |
| B9.3 | «Keluar: …» is capitalised among lowercase decisions | lowercase in the run's list | to Daisy's recheck |
| B9.1 | A large run defeats the fold | **Not built.** A proposal for Sharon: `PROPOSAL-AUDIT-RUN-PAGING.md`. One entry per run, with its children read under the same row security | Sharon |

## Still not seen (tracked, not claimed)

- **The integrity count line** (W2.26): this world holds no integrity record, and by Sharon's ruling the line is hidden at 0.
- **A certificate's day at a boundary**: the issue time cannot move without signing again.
- **«Materi tanpa judul».**
- **Real screen readers, Firefox and WebKit.** The keyboard failure above is the proof that eight clean axe scans are not accessibility proof.
