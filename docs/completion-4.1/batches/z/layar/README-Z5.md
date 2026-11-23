# Z5 (stream B) · captures and recovery walks for Daisy

> **How they were taken:** on the local app of `claude/z-ux`, by `next start` against a local stack (migrations and
> seed). Widths 1280, 390 and 320 px, device scale 2, viewport only.
> - **Keyboard only:** typing, Tab, Enter, arrow keys and Ctrl+A. No clicks. At 390 and 320 «Tempat kerja Anda» is
>   opened with «Buka menu» and Enter.
> - **`CATATAN-Z5.txt`** has, per shot: the horizontal overflow (**0 px in every shot**), the focused element, the live
>   region and the text the row changes.
> - **Script:** `tangkap-z5.ts`. The world is the seed's bootstrap and platform administrators, plus C1w's screen
>   fixture (a draft package in the cycle school) for Studio's rule form, which is removed after the run.
>   **Nothing is saved in the bootstrap school.**

| Shot | Row | What it shows |
|---|---|---|
| `01-nav-sekolah-kesempatan-*` | R-10 | The bootstrap school's administrator on «Kesempatan» (a standalone page). The places are the index's own: Konfigurasi (marked current, `aria-current`), Pendataan, Aktivasi akun, Studio, Keamanan akun, Sertifikat sekolah. Before, the page showed only its own item |
| `02-nav-platform-email-uji-*` | R-10 | The platform administrator on «Kirim email uji»: the index's places, with «Kirim email uji» marked current |
| `03-staf-tidak-dapat-dibuka-*` | N-9 | A staff page for a person who does not exist: «Data staf ini tidak dapat dibuka. Mungkin sudah tidak ada, atau bukan untuk Anda.», with «Konfigurasi» as the way back (focused) |
| `04-staf-tanpa-tanggal-*` | S-02, S-03 | «Guru» chosen (by arrow key), no date, a reason, then «Tinjau perubahan»: «Tanggal berlaku sampai harus hari ini atau sesudahnya.» The role and the reason are kept. Before, the role was dropped without a word |
| `05-staf-tinjau-*` | S-02 (recovery) | The date typed (31 Dec next year), sent again: the review opens. Nothing is saved until «Terapkan» (not pressed) |
| `06-pendataan-kode-bentuk-*` | S-04 | «A-» sent as the school code: «Kode sekolah terdiri dari tiga huruf atau angka.», never «mungkin sudah dipakai». **The field's own `pattern` is the server's rule, so a browser stops this first with its own bubble, which a screenshot cannot hold.** The shot is the server's answer with the form's validation off, as a client that ignores `pattern` would meet it |
| `07-pendataan-kode-lagi-*` | S-04 (recovery) | Three letters typed; the field accepts them (`valid=true`). **The walk stops before «Simpan kode»:** the bootstrap school has no code yet, and a saved code is the school's for good |
| `08-struktur-alasan-spasi-*` | S-07 | «Nonaktifkan» on a Bagian, a reason of three spaces, then Enter: «Tuliskan alasan tempat ini dinonaktifkan.», the reason's own sentence. The question stays open with focus in the reason |
| `09-struktur-batal-*` | S-07 (recovery) | «Batal»: the question closes and focus returns to «Nonaktifkan». Nothing was deactivated |
| `10-definisi-campuran-*` | R-26 item 3, S-05 | Studio, a new rule: the button reads «Buat aturan». A count of 3 with a mix of 1 + 1: «Belum tersimpan. Jumlah soal per tingkat kesulitan harus sama dengan Jumlah soal. …». Name, count and mix are kept (`CATATAN`) |
| `10b-definisi-tersimpan-*` | S-05 (recovery) | «Sulit» set to 1, sent again: saved (see item 4 below about its sentence) |
| `11-definisi-baris-*` | R-26 item 3 | A rule's own row form: its button reads «Simpan perubahan» |
| `13-buka-kembali-tunggu-*` | N-16 | A second reopening request from the same address: «Tunggu sebentar, lalu coba lagi.» The message is kept |

`12-kanonik-beri` was not taken: the local platform administrator has no library package, so Kanonik draws no grant form.
«Berikan izin» and «Perbarui status» (Lapor triage) and «Simpan nama» (Struktur) are proved from the source by Z-R26-03.

## Recovery walks (ruling 81 item 7)

| Path | What happened | Work kept | Next step |
|---|---|---|---|
| **N-9, a staff page that cannot be opened** (`03`) | Says it cannot be opened and why it might be | Not applicable | «Konfigurasi», focused |
| **S-02, a role without a date** (`04` → `05`) | The date's own sentence under the form | Role, place and reason | Type the date; the review opens |
| **S-04, a code of the wrong shape** (`06` → `07`) | The shape is said as the shape | **No: the field comes back empty** (item 3 below) | Type three letters or digits |
| **S-07, a reason of spaces** (`08` → `09`) | The reason's own sentence; the question stays open | The question and the place | Write a reason, or «Batal» |
| **S-05, a mix that does not add up** (`10` → `10b`) | Names both fields to check | Name, count and mix | Correct the mix and send |
| **N-16, sent twice** (`13`) | «Tunggu sebentar, lalu coba lagi.» | The identity and the message | Wait, then send again |

## For Daisy to judge

1. **My English** for N-9, S-04, S-05 and R-26 item 3 («Create rule», «Save changes», «Grant permission», «Update status», «Save name»).
2. **S-02** has no client-side `required` on the date: a role is optional, so the date can only be required once a role is
   chosen, and the server says so (`04`).
3. **S-04's field does not keep what was typed** after the refusal. It is a three-character field; I left it outside S-04.
4. **Not Z5, found on the walk:** a brand-new rule is answered «Perubahan ini mengubah cara hasil dibaca, jadi tersimpan
   sebagai aturan baru. Hasil lama tetap dibaca dengan aturan lamanya.» (`10b`). The database reports `created_new_version`
   for a creation too, so a creation reads as a re-versioning.
5. **Not Z5, found on the walk:** at 320 the phone bar breaks «Konfigurasi» mid-word («Konfig / urasi», `04-…-320`).
6. **N-17's browser measure** (`n17-lebar.ts`) cannot go red on any reachable button today; it guards the rule.
