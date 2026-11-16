# A2b: the words for «Perpanjang» and «Akhiri sekarang» on a planned window (Daisy, 16 Nov 2026)

> **What holds now:**
> - **Written before batch 2 is built, so it is captured right the first time.**
> - These two acts had a button each and no other words: no form, no confirmation, no refusal and no result. The reason list (D2) is already in `A2-KATA-DESAIN.md` B1.
> - **Scope:** PLANNED windows only, in the Konfigurasi list (D8-6). An EMERGENCY row keeps A2a's «Akhiri penghentian» and shows neither button.
> - **«diperpanjang» for the affected people** stays a note for the next batch (`TINJAUAN-A2B-D8-B1-646c7340.md` §3). My D8-1 and D8-2 rows in `A2B-C2W-KATA.md` §2, which still list «diperpanjang sampai …», are superseded on that point.
> - Existing keys reused where right: «Akhiri sekarang», «Alasan (dicatat)», `galat.maintenance_not_open`, `galat.maintenance_ended`.

## 1 · «Perpanjang» (`perpanjang_pemeliharaan`)

**Shown on:** a planned row, scheduled or under way, that has an end. A window with no end set has nothing to extend, so the button is not shown there.

| Element | ID | EN |
|---|---|---|
| Button | «Perpanjang» | «Extend» |
| Form heading | «Perpanjang pemeliharaan» | «Extend maintenance» |
| Current end (text, before the field) | «Sekarang diperkirakan selesai pukul {jam} {zona}.» | «Now expected to end at {jam} {zona}.» |
| Field | «Selesai baru ({zona})» | «New end ({zona})» |
| Reason field | `config.pemeliharaan.alasan` «Alasan (dicatat)», required | «Reason (recorded)» |
| Submit | «Simpan perpanjangan» | «Save the extension» |
| Cancel | «Batal» | «Cancel» |
| Result line (`role="status"`) | ~~«… Pemberitahuan untuk yang terdampak ikut berubah.»~~ **(16 Nov, 11:05; DAISY-25 refuses «pemberitahuan»)** «Pemeliharaan diperpanjang sampai pukul {jam} {zona}. Yang terdampak akan melihat waktu selesai yang baru.» | ~~«… The notices for those affected change with it.»~~ «Maintenance extended to {jam} {zona}. Those affected will see the new end.» |
| Refused: the new end is not later | «Waktu selesai baru harus lebih lambat dari pukul {jam} {zona}. Tidak ada yang diubah.» | «The new end must be later than {jam} {zona}. Nothing was changed.» |
| Refused: no reason | «Tulis alasan perpanjangannya. Tidak ada yang diubah.» | «Write the reason for the extension. Nothing was changed.» |
| Refused: the window has ended meanwhile | `galat.maintenance_not_open` «Pemeliharaan ini sudah berakhir.», unchanged | unchanged |
| Refused: an EMERGENCY, by a direct call (A8) | «Penghentian darurat tidak dapat diperpanjang atau diakhiri di sini. Tidak ada yang diubah.» | «An emergency stop cannot be extended or ended here. Nothing was changed.» |

**Notes on the words:**
- «Batal» vs «Batalkan»: the row's «Batalkan» cancels the **window**; the form's «Batal» closes the **form**. This is the double «Batal» I noted for A2a. Keep the two words apart, never two «Batalkan».
- An end on another day takes «, {hari} {tanggal}», as C-3. Non-breaking spaces as in batch 1.

**Rulings, 16 Nov 11:05, on Second Eye's build (`84681d51`):**
- **The result line:** my «pemberitahuan» broke DAISY-25, my own rule (PINTAR sends no notifications). I did not take Second Eye's «Pengumuman» either: it is true only when the window was also published as an announcement, which is optional. The banner and the pause page always change, so the line now says what is always true, and promises nothing sent.
- **«Perpanjang» in two steps** (the new end with «Periksa waktu ini» and the count for the added period, then the reason and save): **accepted.** The person sees what the extension meets before writing why, as the planned form does. The words are unchanged.

## 2 · «Akhiri sekarang» on a planned window (resume early)

**Shown on:** a planned row under way. A scheduled row keeps «Batalkan» instead.

| Element | ID | EN |
|---|---|---|
| Button | `config.pemeliharaan.akhiri` «Akhiri sekarang», unchanged | «End now» |
| Confirmation, class scope | «Akhiri pemeliharaan sekarang? Pekerjaan kelas {kelas} dapat diubah lagi segera.» | «End maintenance now? Class {kelas}'s work can be changed again at once.» |
| Confirmation, school scope | «Akhiri pemeliharaan sekarang? Pekerjaan sekolah ini dapat diubah lagi segera.» | «End maintenance now? This school's work can be changed again at once.» |
| Confirmation, platform | «Akhiri pemeliharaan sekarang? PINTAR dapat dipakai lagi segera.» | «End maintenance now? PINTAR can be used again at once.» |
| Reason field | «Alasan (dicatat)», required | «Reason (recorded)» |
| Confirm button | «Akhiri sekarang» | «End now» |
| Result line | `galat.maintenance_ended` «Pemeliharaan diakhiri.», unchanged | unchanged |
| Refused: ended meanwhile | `galat.maintenance_not_open`, unchanged | unchanged |

- **The confirmation says what follows** («dapat diubah lagi segera»), as A2a's lift does.
- It names no held sittings: a planned window holds none. Running sittings drained through their deadline (K5).

## 3 · For batch 2's screens (D8-6), add

- «Perpanjang»:
  - the form open, at 390 and 320, by keyboard;
  - the refusal for a new end that is not later;
  - the result line.
- «Akhiri sekarang»: the class-scope confirmation, and the result.
- One WITA capture of each.

## 4 · Anticipation

**Found before the build**, by **question 2**: the opposite and neighbouring acts. Extending is the neighbour of scheduling; ending early is the opposite of extending. Both had a button and no words.
