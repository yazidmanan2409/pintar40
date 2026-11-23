# Z4 stream B · review at `claude/z-ux` `954aa9bc` (Daisy, 23 Nov 2026)

> **What holds now:** **PASS.** No condition. Three optional notes (N-16 to N-18).
> - **Rows:** S-12, R-26 items 1, 2 and 4, R-27(a), R-27(c), S-15, S-11, S-08 and S-13 match the sweep and the UX package. The K-07 strings are «1 sampai 100».
> - **The one rendered recheck of the reopening page:** done from captures 01 and 02 at all three widths (§2).
> - **Read:**
>   - the src diff `4bf300da..954aa9bc`;
>   - `README-Z4.md` and `CATATAN-Z4.txt`;
>   - the shot 01-buka-kembali-isian-390.

## 1 · Rows

| Row | Result |
|---|---|
| S-12 | `isianBukaKembaliSah` mirrors the SQL's own first check (btrim spaces, 1–254 and 10–500 characters) **before** `code_request_pace`, after the same fixed wait. A refused input never spends the pace (01 → 02) |
| R-26 item 1 | `TombolKirim asli`. The capture-phase guard sets busy, so a double press sends one POST. `pageshow` restores the verb. Without JS it posts as before. Other forms are untouched |
| R-26 item 4 | Width at submit becomes `minInlineSize` while busy; nothing changes at rest. Proof: 248 px held, pixel-identical at rest |
| R-26 item 2 | A 44 px band centred on `a.pin-konteks-pilih` (36.5 → 44.5 px); the look is unchanged (05) |
| R-27(a) | `buka_kembali.galat.isian` «Isi email atau username, …» matches the field |
| R-27(c) | `type=text`, `autocomplete=username`, no email keyboard, no autocapitalise or autocorrect (03) |
| S-15 | `create_failed` → «Akun belum bisa dibuat. Coba lagi sebentar lagi.»; «sudah dipakai» only for "already registered" (08) |
| S-11 | The ID as printed (with space) is found. A malformed ID gets the existing shape sentence, and the input is kept (06, 07) |
| S-08 | `lupa.pin.berakhir`, word for word; the ID stays filled (04) |
| S-13 | My first sentence, with the existing «Pakai kode dari email yang paling baru.» kept. **Right:** it still applies |

**Bob's points:**
- **S-15's English «The account could not be made yet. Try again in a moment.»** is accepted. «made» matches its siblings («nothing was made», «The card could not be made»).
- **S-15's browser-given `create_failed` capture** is accepted, since the README states it.

## 2 · Rendered recheck: «Minta akun dibuka kembali»

All four changes are on one page, in order: R-27(b) (stream A), S-12, R-26 item 1, R-27(a).
- **Capture 01:**
  - A message of spaces around «pendek» passes the browser's `minLength` and is refused by the route with the input's own line, «Isi email atau username, dan pesan 10 sampai 500 karakter.». It is red, `role="alert"`.
  - Both fields keep what was typed, and there is no «Baru saja ada permintaan».
  - 0 px overflow at all three widths.
- **Capture 02:** the corrected message from the same address goes through at once: «✓ Terima kasih. …».
- **Recovery walk (ruling 81):** in both 01 and 02, the person understands what happened, their work is kept, and the next step is clear.

## 3 · Optional notes

- **N-16 · `buka_kembali.galat.tunggu` still says «Baru saja ada permintaan dari jaringan ini. Tunggu beberapa menit…».**
  - With S-12 it is reached only after a request the database accepted, so «a request was just sent» is now true, except after a `GAGAL` (the database failed after the pace was counted).
  - Also, under the 5-an-hour cap, «beberapa menit» can be nearly an hour.
  - **If the owner wants it, later:** «Tunggu sebentar, lalu coba lagi.» / «Wait a little, then try again.»
- **N-17 · `TombolAksi` keeps the width while pending only.**
  - My package also held it through «✓ {selesai}» until the form changes.
  - A shorter «✓ Tersimpan» can still pull a neighbour left after the answer. It is used on five buttons only.
  - **Later:** keep `lebar` while `tuntas`.
- **N-18 (the ruling 79 audit, pre-existing) ·** On this page the `h1` «Minta akun dibuka kembali» is drawn at body size (capture 01), under a large brand. It is not this batch's change.
