A whole class in one table, and one learner: a composed journey for owner validation (11-validation.md §1).

**Status: SPECIMEN, APPLICATION READY (8 Oct).** Not PINTAR, and not applied: it shows the approved grammar working together; its findings are corrected at source.

**Who.** Rina Kartika, Guru, Kelas 5A.

**What it validates.** Floating layers and their shadow (5); the one dialog pattern, started from a menu (6); 4 px small controls (7); entering layers (8); the stripe in context (14).

**Composed against the product**
- The table is the class's «Siapa yang sudah mengumpulkan» for Bab 3: every learner, alphabetical, with the three states the product names (mengajar.siapa.*). Search, the state filter and the stripe (option A) come from the Table and Table rows components.
- The product shows this page as three lists of names («Tiga daftar nama…», mengajar.siapa.catatan). 11-validation.md asks for the long table with a state filter, so here the three lists are one alphabetical table with the state in words, and the filter gives each list back; the intro is therefore the table's own true line (mengajar.murid.sub), not «Tiga daftar». Decided 8 Oct (JQ2): the one table.
- A row's menu holds what a teacher really can do for one learner: «Lihat bukti» and «Minta membaca lagi» (D-085 M3). Neither is consequential. 11-validation.md asked for «a consequential action asked in a dialog» on one learner, but a teacher has no consequential act on a learner in 4.0: enrolment, the class card and its reissue (aktivasi.ulang.*) are the school admin's.
- The one dialog (question 6: a consequential question started from a menu) is therefore met where a teacher can meet it: «Keluar dari semua perangkat» (akun.semua.*, Gate 6), started from the account menu at the bottom of the navigation, or from the drawer under 1024 px. Today the product has it on «Akun saya» as an in-page confirmation (src/components/sesi/KeluarSemua.tsx), which question 6 keeps as the default; the menu is where the shell (question 1) puts account actions. Decided 8 Oct (JQ2): the menu, asking in the Dialog.
- The «…» after an item that asks before it acts is the Dialog component's own (its example is this same item).
- Found while composing: the Table and Table rows components' menus and bulk bar offer «Kirim pengingat», «Pindahkan ke kelas lain» and «Keluarkan dari kelas». A teacher cannot do the last two, and PINTAR promises no notifications. Corrected 8 Oct (F2).
- The count under the table («Menampilkan 1–31 dari 31 murid») is written by the Table behaviour (bundle.js), not the copy table: it is new to the copy table too.
- The dialog's confirm button is the copy table's «Ya, keluar dari semua»; the grammar's rule is a verb and its object, never «Ya» (finding C1).

**The steps**
1. The class
2. Minta membaca lagi

**Words.** 32 copy-table keys (D-014). New, not in the copy table yet (marked on the screens by «Mark new words», or listed here when they sit in an attribute):
- «Opsi untuk»: a row menu's accessible name
- «Opsi»: the row menu button's tooltip
- «Tampilkan»: the filter's accessible name
- «Semua»: the filter's first option
- «Lokasi»: the scope line's accessible name
- «Cari murid»: the search field's accessible name
- «Cari nama»: the search field's placeholder
- «Hapus pencarian»: clears the search
- «Tindakan»: the actions column's hidden header
- «Tidak ada murid yang cocok»: the table's «nothing matches» state
- «Tidak ada nama dengan»: the empty state says what was searched (Empty state)
- «di tampilan ini.»: the empty state's end
- «Hapus pencarian dan saringan»: resets the table
- «Halaman daftar murid»: the pager's accessible name
- «Sebelumnya»: the pager (Table behaviour)
- «Halaman sebelumnya»: the pager's hidden name
- «Berikutnya»: the pager (Table behaviour)
- «Halaman berikutnya»: the pager's hidden name
- «Mengajar»: the group label for an educator who also learns (question 11); WP6B
- «Ciutkan navigasi»: the staff navigation's collapse control (question 1); the product has no rail yet
- «Buka menu»: the top bar's menu button under 1024 px (question 1)
- «Tutup menu»: closes the drawer under 1024 px
- «Terkirim»: the request's result word: the request is inside PINTAR, not an email
- «Langsung ke isi»: the skip link (question 10; 06-accessibility)

**The record**

| Check | 1280 | 1024 | 390 | Note |
|---|---|---|---|---|
| One obvious next action | pass | pass | pass | The class table is for reading: no primary button, the search field leads. «Minta membaca lagi» is the one primary of its form. |
| Where am I | pass | pass | pass | Three levels, so the scope line «Kelas / Kelas 5A / Bab 3»; Kelas is current in the navigation; the title follows. |
| Every action answered, then its result in words | pass | pass | pass | The search filters as typed and the count says «Menampilkan … dari 31 murid»; the menu opens on its first item; «Mengirim…», then «✓ Terkirim» and «Permintaan dikirim kepada Ayu Lestari.» (a request inside PINTAR, not an email). |
| Nothing by colour alone | pass | pass | pass | Each state is a badge with its words; the stripe is never a state. |
| Targets 44 px (24 px floor) | pass | pass | pass | Nothing under 24 px. «Lihat» in each row is the 36 px small button for rows. |
| No sideways scroll at 390 px | — | — | finding, corrected | The page does not scroll sideways; the table scrolls in its frame with the name held still, as the Table rule says. But the state is cut at the frame's edge and the row's actions are only reached by scrolling the table (F7). |
| Keyboard order and focus | pass | pass | pass | 28 presses for the whole walk. Arrows move in the menu, Enter takes the item; the dialog opens on «Batal»; Esc closes it and gives focus back to the account button, or the drawer row at 390; Esc closes the drawer back to «Buka menu». |
| Screen reader (the accessibility tree) | pass | — | pass | The table has a caption; each row action carries the learner's name («Lihat Adi Pratama», «Opsi untuk Adi Pratama»); the filter is a radio group. |
| Reduced motion | pass | pass | pass | The menu, the drawer and the dialog appear without moving; with motion on they enter in 240 ms with 4 to 8 px of travel. |
| Anything that fights the content | finding, corrected | finding, corrected | finding, corrected | The dialog's confirm reads «Ya, keluar dari semua» (C1). |

**Findings**
- F1 · JQ2: a teacher has no consequential act on one learner; the dialog is met on «Keluar dari semua perangkat», and the product's three lists are one table here. Corrected or decided, 8 Oct.
- C1: «Ya, …» on a confirm button. Corrected or decided, 8 Oct.
- F2: the Table and Table rows specimens offer acts a teacher cannot do, and «Kirim pengingat». Corrected or decided, 8 Oct.
- F7: the table at 390 px. Corrected or decided, 8 Oct.
