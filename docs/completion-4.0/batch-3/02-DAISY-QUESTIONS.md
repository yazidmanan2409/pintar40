# Batch 3 · Questions for Daisy (prepared 2 Nov 2026)

These are the design and wording questions Batch 3 met that the frozen design system does not answer. Each one says what is built today, so nothing is waiting on an answer. Every answer becomes a small, separate change. The wording in this list is mine unless it is marked as hers.

## A. The blocking one

| # | Question | Built today | Where |
|---|---|---|---|
| A1 | **The question-review layout (W1.2; DG-25, RV-21, L4 §4).** Your frozen system has no composition for reading a package's questions before approving them. Today the reviewer gets a long «wall of questions» in native `<details>` with ▶ markers. Each question shows its options, the key marked «· Kunci», and every option's «Alasan». We need the layout: grouping, how the key is marked, where the reason sits, and how a long package is navigated. | Unchanged (pre-Batch 3), in `pin-*` classes only | «Soal dalam paket ini» on `src/app/studio/paket/[course]/page.tsx` |

## B. Studio · the package page (J1Terbit, send-back, history)

| # | Question | Built today | Where |
|---|---|---|---|
| B1 | **One press to create and lock the release.** A reader who may take both steps does them together. | Panel headed «Buat terbitan · Kunci terbitan», both sentences, «Oleh: …; Kunci terbitan: …», button «Kunci terbitan» | `LangkahTerbit.tsx` |
| B2 | **Result words for steps 1–6.** Only «✓ Diterbitkan» is approved. Do you want a ✓ word per step, e.g. «Tersusun», «Diajukan», «Disetujui», «Dikunci»? | «<step> · Selesai», in the next step's panel | same |
| B3 | **The ✓ in a result line sits on its own line** above the words when the line wraps. Should the mark and the words share one line? | As drawn (`evidence/w65/09-buat-dan-kunci.png`) | `BarisHasil` inside the step panel |
| B4 | **The send-back confirmation.** I treated it as not destructive: a normal edge, a primary button, focus in the reason box rather than on «Batal», and no ✓ word, because the panel moves on. Is that right? | As described | same |
| B5 | **The send-back and history words** (Indonesian and English): «Kembalikan ke penyusun», «Kembalikan paket ini ke penyusun?», «Alasan», «Batal», «Alasan peninjau», «Mengembalikan…», «Disetujui», «Dikembalikan ke penyusun», the four refusals (`galat.sendback_*`) and `galat.sent_back` | Mine | `hle.ts` |
| B6 | **After publication or withdrawal.** J1Terbit shows no panel for these states. | The same panel («Sekarang» · «Terbit»/«Ditarik»), plus a way on to «Paket Pembelajaran» after publishing (your `data-lanjut`) | same |
| B7 | **Step numbers.** «Paket ini terbit setelah langkah 7.» names a number the list no longer shows. | Unchanged; it shows only when no step is current | same |
| B8 | **How the reviewer's reason is shown** | A surface-2 block on the author's panel; plain lines under each version in «Riwayat perbaikan», not a table | package page |
| B9 | **The first, never-released version in «Riwayat perbaikan»** reads «— · belum terbit». Should it read something else, such as «Versi pertama»? | «—» | same |
| B10 | **The package title as heading.** In J1Terbit it is the page's h1, but Studio's layout already owns the h1. | An h2 inside the card, with the back link «‹ Studio» above it | same |
| B11 | **The author and the findings.** The author now sees no acknowledgement button. Should the page tell them that a second person acknowledges findings? | Nothing is said | «Temuan» |
| B12 | **The step list's markers** look like radio buttons: an open circle for a step to come, a filled one for the current step. Is that your «Named steps» drawing? | As drawn | `.pin-lt-daftar` |

## C. Studio · other pages

| # | Question | Built today | Where |
|---|---|---|---|
| C1 | **Studio home, a narrowed list:** «<count> · Semua»; an empty narrowed list says nothing matches, with «Semua» as the way back; the selected card gets the primary border. Should a sent-back package carry an attention Badge («Dikembalikan») instead of «Sekarang: Susun isi»? | As described | `src/app/studio/page.tsx` |
| C2 | **Grouped findings (W1.5).** One panel per kind: the sentence, «N temuan», why and how to fix said once, the places under «Lihat lokasinya» (Disclosure), one note and «Sudah saya tinjau semuanya». For an ERROR: «Temuan ini diperbaiki di isinya, lalu pemeriksaan dijalankan lagi; tidak bisa sekadar diakui.» The result: «Temuan sejenis sudah diakui sekaligus. Jumlahnya: n.» | As described | `TemuanKelompok.tsx` |
| C3 | **Aturan Asesmen words (W1.3).** The opening line «Semua isian wajib diisi, kecuali yang bertanda (opsional).», the «(opsional)» mark (one shared key?), the legends, «Tenggang kirim (menit)» and the eight hints. The «Jendela ragu» hint borrows «arah berpikir», which may also need Dr Gladys. | Mine | `src/app/studio/definisi/page.tsx` |
| C4 | **Mode, bank and order as radio rows.** I applied your Select rule for two to four options. Should any of them be a segmented control? | Radio rows | same |
| C5 | **Where «Unduh contoh isian» sits and what it says (W1.10).** | A second button row under the template, with its sentence | `PanelUnggah.tsx` |
| C6 | **Empty states with no action.** Pustaka PINTAR, Tinjauan Integritas and a filtered Bank Soal show only a sentence. Should a filtered Bank Soal offer «Hapus saringan»? No such key exists yet. | A sentence only | those pages |
| C7 | **«tujuan pembelajaran»** as the count unit in the canonical outline | As described | `kanonik/[terbitan]` |
| C8 | **Studio's page head.** Eyebrow «PINTAR», h1 «Studio», then the tabs. Is the eyebrow still wanted inside the AppShell? | Kept | `src/app/studio/layout.tsx` |
| C9 | **«Kursus» as the workbook sheet's name.** The screens now say «paket» (Terminology v1), but the sheet the template names is still «Kursus», and the guidance says «Satu buku kerja berisi satu kursus». Rename the sheet (a template change for every school) or keep it? | Sheet unchanged; the screens' correction words say «paket» | `unggah-kontrak.ts`, `studio.templat.*` |

## D. Mengajar

| # | Question | Built today | Where |
|---|---|---|---|
| D1 | **The Uji Cepat score's base («18 dari 31», CR-27).** Is it read as "scored, of the class now", with the class figure as the mean of official scores? Or as something else, such as the share at or above the mark? | The mean, with «n dari N murid sudah dinilai» | `uji-cepat/hasil` |
| D2 | **"One step below".** Is that a section on the same page, or a separate drill-down? | A section on the same page | same |
| D3 | **A minimum group size for the class figure.** The catalogue's class metrics use 5. This may also be an owner question. | Shown from 1, since this teacher already sees each score | same |
| D4 | **A per-row action to the learner's record** («Lihat», as in J2) | None | same |
| D5 | **The Uji Cepat launch's result word.** Success leaves the form for the running stage. | The ✓ result line only | `uji-cepat` |
| D6 | **Siapkan after «✓ Disediakan».** Should the window stay as disabled fields or become read-only text? Should the back link stay «Kembali ke pilihan materi»? | Disabled fields; the link is kept | `siapkan` |
| D7 | **The new words**, especially the English ones: «(opsional)», «Rincian nilai», «Nilai kelas», «Belum ada nilai», «Terkirim», «Disediakan» | Mine | `hle.ts` |
| D8 | **A row with no score.** | «—» if the learner has not handed in; «Belum ada nilai» if they have but there is no score yet | `uji-cepat/hasil` |
| D9 | **RV-20.** Below 560 px, a list row's badge moves under the row's words, on every list. Please confirm the placement. | As described | `experience.css` |

Not for Daisy:
- W1.11 (who the Question Bank is for) waits on owner decision F-7.
- In a synthetic school the Uji Cepat score page shows «Belum ada nilai», because synthetic results are never official evidence. The learner record behaves the same way.
