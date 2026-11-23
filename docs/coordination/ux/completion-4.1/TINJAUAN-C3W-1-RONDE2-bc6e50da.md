# C3w-1 round 2 · recheck at `bc6e50da` (Daisy, 23 Nov 2026)

> **What holds now:** **PASS with one condition (C-3).**
> - **Closed:** C-1, C-2, N-10 and N-11.
> - **Also correct:** focus to the first new card; the linked success line for another target, using existing words with no new ones; «Buat draf» busy without losing focus.
> - **The C3-11 captures are accepted.** 34 shots: 0 px overflow, the rights box cleared after `AI_DATA_PRIBADI`, and no AI wording on learner pages.
> - **Read:** the diff `6ace7b2f..bc6e50da` (src), `CATATAN.txt`, and the shots 03-390 and 05-320.

## Checked

| Item | Result |
|---|---|
| **C-1** | **Closed.** `tujuanPer` per lesson. `ganti()` resets the ticks to the target's first objective. `galat.ai_tanpa_tujuan` appears under the legend and as the server refusal `AI_TANPA_TUJUAN`. Its words match mine exactly. Capture 01 shows the other lesson's objective |
| **`AI_TUJUAN_LAIN` → «Ada isian yang kosong atau belum sesuai. Periksa, lalu coba lagi.»** | **Acceptable.** It occurs only on a stale form, which is rare. Optional N-12 below |
| **C-2** | **Closed.** `hapusNama` carries `<span class="pin-sr"> · {posisi}</span>`. `KonfirmasiBahaya.tombol` now takes a node, used only at its line 52. The confirmation keeps «Hapus» and «Batal». Capture 09: focus on «Batal» in the dialog |
| **N-10, N-11** | **Closed.** «…Pilih pelajaran tujuan lain atau tempel teks sumber.»; `studio.ai.sumber.lain` removed |
| **Focus on success** | **Correct.** It goes to the first card's `h4` (`tabIndex=-1`). Captures 04 at all three widths: focus is on `h4#pin-soal-…` and the live region says «✓3 draf soal siap ditinjau.» |
| **Success, another target** | **Correct.** It uses the existing `studio.ai.siap_di`, with `{judul}` as a link to that lesson's page; no new words. Focus stays on «Buat draf», which is right: nothing new is on this page |
| **«Buat draf» while working** | **Correct.** `aria-disabled` and `aria-busy`, guarded by `if (sibuk) return`. Capture 03: focus is kept on the button |
| **Learner pages** | /belajar, /belajar/hasil and /belajar/sertifikat: none of «AI», «Draf dari AI», «Disusun dengan» |

## Required

- **C-3 · The working line claims success.** `DrafAi.tsx` draws «Menyusun {n} draf soal… Ini dapat memakan waktu hingga satu menit.» with `BarisHasil nada="ok"`, which draws ✓ on the success ground. In capture 03-390 it reads «✓ Menyusun 3 draf soal…». By `BarisHasil`'s own rule, ✓ means *it was done*, and here nothing has been done yet.
  - **Fix:** `nada="netral"`. No word change.
  - I missed this in round 1, where the line was already there.

## Optional

- **N-12 ·** A message of its own for `AI_TUJUAN_LAIN`, in the pattern Mengajar already uses: «Tujuan pembelajaran pelajaran ini sudah berubah. Muat ulang halaman, lalu pilih lagi.» / «This lesson's learning objectives have changed. Reload the page, then choose again.»
- **N-13 (outside this batch, for the ruling 79 audit) ·** The link inside a result line (capture 05: «Pelajaran dua») has no underline. Its colour is close to the success ground's text colour. Links inside text are not underlined anywhere in the app (`globals.css:435`), so this is a system matter, not C3w-1's.
