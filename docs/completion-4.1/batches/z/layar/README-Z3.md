# Z3 (stream B) · captures and recovery walks for Daisy

> **Taken on the local app** of `claude/z-ux` (the Z3 commit), `next start` against a fresh local stack (300 migrations
> and the seed). Widths 1280, 390 and 320 px, device scale 2, the viewport only (not the full page).
> - **Keyboard only:** each page is opened, then Tab from the top. No clicks. The recovery step for R-8 is Enter on the
>   page's own link.
> - **`CATATAN-Z3.txt`** has, per shot: the horizontal overflow (**0 px in every shot**), the focused element, the
>   live-region text, and the text of the section the row changes.
> - **Script:** `tangkap-z3.ts`, re-runnable. The world is A1's screen fixture (a class of the run's own, with one learner
>   who signs in), the bootstrap school's official sitting, and C1W-A02's sealed bootstrap certificate. All of it is
>   removed after the run.

| Shot | Row | What it shows |
|---|---|---|
| `01-peta-kuat-*` | K-02 | A clean Pemetaan Awal: every card «SUDAH KUAT», its statement once, and `map.kuat.arti` in the reason slot. `map.tingkat.arti` is under the cards (below the fold at these heights; its text is in `CATATAN-Z3.txt`) |
| `02-guru-belum-uji-*` | K-03 | The teacher's one-learner page before any Uji Penguasaan: «Belum ada Uji Penguasaan dari murid ini di kelas ini.» |
| `03-tunggu-izin-*` | M1, M2 | The Uji Penguasaan another session holds: the body is the **neutral** box (`pin-hasil-netral`, role=status), and the teacher is told «Uji Penguasaan · Pecahan». The eyebrow above keeps the course path |
| `04-guru-gagal-baca-*` | K-03 | A failed read (provoked locally by lifting the read's grant for the shot, then restoring it): «Tujuan pembelajaran yang belum tercapai belum dapat dibaca. Muat ulang halaman ini.» |
| `05-guru-sintetis-selesai-*` | K-03 | The fixture school's sitting handed in. Its sittings are SYNTHETIC, so there is no official result: «Hasil resmi» says «Belum ada bukti …», and the objectives say «Belum ada Uji Penguasaan …» (the read counts official sittings only) |
| `05-guru-tujuan-resmi-*` | K-03 | An official Uji Penguasaan below target (the bootstrap school): the two objectives by their statements |
| `06-bukan-milik-hasil-*` | R-8 | Another class's assignment under the learner's own address (`/belajar/{id}/hasil`): the not-found page, never the error page with a reference code |
| `06-bukan-milik-hasil-pulih-390` | R-8 | Enter on «Ke halaman awal»: the learner's start page, one step from Belajar (Daisy's X-2 note §2.3: acceptable) |
| `07-verifikasi-ditinjau-*` | K-05 | «Sedang ditinjau»; under it «Seperti saat diterbitkan», then `verifikasi.fakta.ditinjau`, then the facts |
| `08-verifikasi-dicabut-*` | K-05 | «Dicabut oleh penerbit»; the heading only, then the facts |
| `09-laporan-sebagian-*`, `10-laporan-penuh-*` | K-04 | **Drawn from the component with the app's built stylesheet,** not from the running app (a withheld domain beside a shown one needs more learners than a fixture has). One withheld domain: «Semua bidang kompetensi yang punya angka berada di 60% ke atas.» None withheld: the sentence as before |

## Recovery walks (ruling 81 item 7)

For each failure path: can the person tell what happened, was their work kept, and what next?

| Path | What happened | Work kept | Next step |
|---|---|---|---|
| **K-03, a failed read** (`04`) | Said as a failure in the section's own place: the objectives «belum dapat dibaca». It no longer says «none below target» | Nothing is lost: it is a read; the page's other sections still show | «Muat ulang halaman ini.» Reloading the same page after the grant was restored drew the section's normal state again (`05-guru-sintetis-selesai`, the same learner) |
| **K-03, no Uji Penguasaan yet** (`02`, `05-guru-sintetis-selesai`) | Its own state, not «all reached» | Not applicable | None is needed; the result section above says the same |
| **M1, waiting for the teacher** (`03`) | The title says the teacher must allow it; the body says why, and that the request is on the teacher's list | The answers already saved stay (A3's design; unchanged) | «Coba lagi» once the teacher allows; «Kembali ke Belajar» is focusable and reached by Tab |
| **R-8, an address that is not theirs** (`06`) | «Halaman ini tidak ada. Alamatnya mungkin keliru, atau halaman ini sudah dipindahkan.» No reference code, and nothing says whether the assignment exists | Not applicable | «Ke halaman awal» (Enter) → the start page, then «Saya mau belajar» |
| **K-05, a certificate under review** (`07`) | The status says it is under review and not declared valid; the facts are headed as issue-time and may change | Not applicable (a stranger's check) | The status line already says to contact the issuing school |

## For Daisy to judge

1. **K-02's tier description** is drawn once under the cards of every map (the map page and the assignment page), since no
   page explained the tiers before. Please confirm that place.
2. **K-03, no official result:** with a SYNTHETIC or otherwise unqualified sitting, the page reads «Belum ada Uji Penguasaan
   dari murid ini di kelas ini.» beside «Hasil resmi: Belum ada bukti yang memenuhi syarat untuk angka ini.» Is that the
   right sentence there, or should the objectives section say nothing when «Hasil resmi» has no figure?
3. **K-03's two sentences** are from your sweep (`tujuan_belum_uji`) and modelled on `studio.soal.riwayat.gagal`
   (`tujuan_gagal`, new). Please confirm the words.
