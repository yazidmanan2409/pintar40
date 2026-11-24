# Z4 (stream B) · captures and recovery walks for Daisy

> **How they were taken:** on the local app of `claude/z-ux`, by `next start` against a local stack (with the migrations
> and the seed). Widths 1280, 390 and 320 px, device scale 2, viewport only.
> - **Keyboard only:** typing, Tab, Enter and Ctrl+A. There are no clicks.
> - **`CATATAN-Z4.txt`** has, per shot: the horizontal overflow (**0 px in every shot**), the focused element, the live
>   region, and the text the row changes.
> - **Script:** `tangkap-z4.ts`. The world is A1's screen fixture (its signing-in learner has a PINTAR ID and PIN 2817)
>   and the seed's platform administrator. Everything is removed after the run.
> - **The browser proof for R-26** (double press, Back, widths, the 44 px target, identical pixels at rest) is
>   `r26-tekan.ts`. Its base and fix outputs are in `../z-ux-merah-z4.txt` and `../z-ux-hijau-z4.txt`.

| Shot | Row | What it shows |
|---|---|---|
| `01-buka-kembali-isian-*` | S-12, R-27(a) | A message of spaces and six letters. The refusal is the input's own line, «Isi email atau username, dan pesan 10 sampai 500 karakter.», never «Baru saja ada permintaan…». What was typed is kept (`CATATAN`) |
| `02-buka-kembali-terkirim-*` | S-12, R-26 item 1 | The recovery from `01`, from the same address: the message written properly, then Enter. «Terima kasih. …»: the refused try had used no pace |
| `03-masuk-identitas-*` | R-27(c) | The sign-in identity field, focused by keyboard. `CATATAN` records its attributes: `type=text`, no `inputmode`, `autocomplete=username`, no autocapitalise, autocorrect or spell-check |
| `04-lupa-pin-berakhir-*` | S-08 | The PIN path: PINTAR ID and PIN accepted, then the ten minutes run out (the grant is aged locally for the shot), then the new password is sent. The PIN form returns with «Waktu untuk membuat password baru sudah habis. Ketik lagi PINTAR ID dan PIN Anda.», with the ID still filled in |
| `05-konteks-ganti-*` | R-26 item 2 | «Mau ke mana hari ini?» (`a.pin-konteks-pilih`) focused, in the rail at 1280 and in the opened menu at 390 and 320. It looks as before; its hit area is 44 px (`r26-tekan.ts`) |
| `06-keamanan-cari-spasi-*` | S-11 | The platform administrator types the PINTAR ID as printed, with its space, and presses Enter: the account is found, and the field shows the ID read back |
| `07-keamanan-cari-salah-*` | S-11 | «A14CD7SU» (U is not in the alphabet): «Periksa PINTAR ID: 8 huruf dan angka, seperti A14C D7ST.» under the field, with what was typed kept. Before, the page showed nothing |
| `08-aktivasi-gagal-buat-*` | S-15 | Orang baru, confirmed, with the route answering `create_failed` (an Auth outage). **That answer is given by the browser,** because stopping Auth would also end the administrator's session. It reads «Akun belum bisa dibuat. Coba lagi sebentar lagi.», never «mungkin sudah dipakai» |

S-13 changes only the resend sentence's words (Z-S13-01). R-26 item 4's width rule is the browser proof, not a capture.

## Recovery walks (ruling 81 item 7)

| Path | What happened | Work kept | Next step |
|---|---|---|---|
| **S-12, a refused reopening request** (`01` → `02`) | The input's own line says what is missing. Nothing claims a request was sent | Both fields keep what was typed (SimpanIsian) | Correct the message and send. It goes through at once (`02`): the refused try used no pace |
| **R-26 item 1, a double press** (`r26-tekan.ts`) | One request; the button says «Mengirim…» while it travels | Not applicable | Back shows «Kirim permintaan» again, enabled |
| **S-08, the PIN path's time runs out** (`04`) | Said on the PIN form: the time ran out | The PINTAR ID stays in its field; the new password was not saved (the page says to start again from the PIN) | Type the PIN again |
| **S-11, a malformed ID** (`07`) | The sentence under the field names the shape | What was typed stays in the field, marked invalid | Correct it and press Enter |
| **S-15, Auth unavailable** (`08`) | «Akun belum bisa dibuat», and nothing blames the address | The name and address stay in the form; nothing was created | «Coba lagi sebentar lagi»: the same form, sent again |

## For Daisy to judge

1. **S-15's English,** «The account could not be made yet. Try again in a moment.», is mine. Your sweep gave the Indonesian only.
2. **S-13:** your correction is the first sentence. I kept the existing second sentence, «Pakai kode dari email yang paling
   baru.», unchanged.
