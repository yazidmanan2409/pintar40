# Ruling 79 audit · J5, a teacher's week: findings (Daisy, 24 Nov 2026)

> **What holds now:**
> - **J5 walked in part** on the local audit world (`00fe853d`), as W10 Ayu Lestari, new to PINTAR, teacher of 8A (W3, with results) and 8C (W11, nothing given).
>   - **Pages:** /mengajar, each class, «Siapkan» to its last step, «Bukti», «Uji Cepat», «Langkah berikutnya».
>   - **The «Atur» panel** («Izinkan», «Akhiri sesi») was walked in J4.
> - **Not walked here:**
>   - running an Uji Cepat (a late joiner, a stop);
>   - «Minta membaca lagi» sent;
>   - «Ubah jadwal»;
>   - «Tambah waktu»;
>   - the screen reader, throttled and reduced-motion passes.
>   These come from the builder's run.
> - **Captures:** `audit79-j5/`, at 390.
> - **5 findings: 1 Significant, 4 Improvement.**
> - **First use without the tour (A) mostly holds:**
>   - every class page says why it is shown;
>   - empty states say what is missing and what makes it appear («Sekarang 0 murid; perlu 5»);
>   - «Siapkan»'s review step says exactly who will see what, and what can't be undone.

## Significant

| # | Finding | Siblings (same fact) | Cause | Dim. | Fix |
|---|---|---|---|---|---|
| **J5-1** | **«Siap disediakan» for a chapter that can't be given.** «Statistika Dasar» is labelled «Siap disediakan» on 8C's page and in «Siapkan»'s list. Its review step then says «Batas ketuntasan belum ditetapkan … belum bisa disediakan» and still offers «Sediakan Statistika Dasar untuk 8C», which is refused (`ASSIGN_PASS_MARK_MISSING`) | **Disagree.** The class page and the list say «Siap disediakan»; the review step says it can't be given; the button is offered anyway | C-3 (the list derives «ready» without the pass mark) and C-7 (the button offered whatever the fact beside it) | B, F | The list and the class page read «Menunggu batas ketuntasan dari admin sekolah», the review step keeps its sentence, and the «Sediakan» button is not drawn until the mark exists |

## Improvement

| # | Finding | Siblings | Cause | Dim. | Fix |
|---|---|---|---|---|---|
| J5-2 | The home's one «Layak dikerjakan lebih dulu» suggests giving «Persamaan Linear Satu Variabel (8B)» to 8A, which already runs «Persamaan Linear Satu Variabel». Meanwhile 8C has nothing at all and isn't named | The 8C page: «Materi tersedia: Belum ada». The 8A page: two chapters running | C-4 (the «first thing» covers one kind of fact) | F, B | The first thing for a class with nothing given outranks a further chapter for a class already running. (Two same-named publications are partly world data; the builder should confirm) |
| J5-3 | 8C's «Langkah berikutnya» offers «Uji Cepat untuk mengecek pemahaman hari ini», whose page then says «Belum ada bab yang disediakan … belum ada soal» with no link onward | **Disagree:** the list offers it, the page can't run it | C-7 | F | The list doesn't offer it until a chapter is given. The Uji Cepat empty state links «Siapkan materi» |
| J5-4 | «Siapkan»'s certificate step: «Diterbitkan sekolah bila murid memenuhi capaian». «capaian» was replaced on the certificate and the public check by «kriteria kelulusan» / «Lulus» (D2-R §4); this sibling was missed | **Disagree** with the certificate (R-b) and `/verifikasi` | C-6 | B | «Diterbitkan sekolah bila murid lulus Uji Penguasaan; bisa diperiksa siapa pun lewat tautan.» |
| J5-5 | «sisa … menit» and «Siap untuk» on the learners' cards were seen from the teacher's side too | — | L-47; J4-3 | H | As those rows |
