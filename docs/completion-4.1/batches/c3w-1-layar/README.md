# C3w-1 · C3-11 captures for Daisy (TINJAUAN-C3W-1-LAYAR-6ace7b2f.md §3)

> **Taken on the local app** of `claude/c3w-1` with C-1, C-2, N-10 and N-11 built. The harness's stub was used, with
> no provider. The widths are 1280, 390 and 320 px, at device scale 2, from the viewport (not full page).
> - **Keyboard only:** each control was given focus, then driven with Enter, Space, the arrow keys and typing. There
>   were no clicks.
> - **`CATATAN.txt`** records, per shot: the horizontal overflow (0 px in every shot), the focused element, and the
>   live-region text. It ends with the learner-page text search.

| Shot | Daisy §3 item | What it shows |
|---|---|---|
| `01-sasaran-lain-*` | The form opened, with the target changed | «Pelajaran dua» chosen; «Tujuan pembelajaran» now lists its own objective, ticked (C-1) |
| `02-sumber-tempel-*` | The paste source | «Teks yang saya tempel», with the text typed |
| `03-bekerja-*` | The working line | «Menyusun 3 draf soal… …»; focus stays on «Buat draf», busy (see below) |
| `04-siap-fokus-*` | Success on the lesson on screen | «3 draf soal siap ditinjau.»; focus on the first new card's heading |
| `05-siap-di-pelajaran-lain-*` | Success into another lesson | «3 draf soal siap ditinjau di Pelajaran dua.», the title a link |
| `06-data-pribadi-*` | AI_DATA_PRIBADI | Daisy's line; the rights box cleared (`CATATAN.txt`: ticked false) |
| `07-kartu-menunggu-*` | A card, undecided | «Draf dari AI», the provenance line, «Menunggu keputusan Anda …», «Terima» · «Hapus» |
| `08-kartu-diubah-*` | A card, edited and undecided | «Sudah diubah. Menunggu keputusan Anda …» |
| `09-hapus-tanya-*` | «Hapus»'s confirmation | Opened by Enter; focus on «Batal» |
| `10-ajukan-tertahan-*` | «Ajukan» held | The disabled button, with Daisy's sentence and the server's count tied to it |
| `11-peninjau-jumlah-*` | The reviewer's count | As the head of department: «{a} dari {b} soal disusun dengan AI» |
| `12-murid-belajar-390` | A learner page | No AI mark. The text search of /belajar, /belajar/hasil and /belajar/sertifikat is at the end of `CATATAN.txt`: none of «AI», «Draf dari AI», «Disusun dengan» |

**Found by these captures, and fixed in the same commit:** while working, «Buat draf» was `disabled`, so the keyboard's
focus fell to the page. It is now `aria-disabled` and busy, keeping focus, and a second press is still ignored.

The world is C1w's screen fixture: the cycle school's teacher, a draft package and a class learner, plus a second lesson
with its own objective. It was removed after the run.
