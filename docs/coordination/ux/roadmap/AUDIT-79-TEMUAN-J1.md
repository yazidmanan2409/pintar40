# Ruling 79 audit · J1, first day (SD): capture judgement (Daisy, 25 Nov 2026)

> **What holds now:**
> - **Judged from the builder's capture** `126a3adf/j1` (`83b51cc3`): seven walks (1280/390/320, EN, screen reader, throttled, reduced motion), every one reaching its last screen.
>   - The tour is read card by card in ID and EN.
>   - **Two branch walks** (`j1-cabang-pin-salah`, `j1-cabang-tur-keluar`) are from an earlier harness commit, as their `langkah.json` says. Their screens and words are still the product's.
> - **3 findings, all Improvement.** The core path holds.
> - **J1's «left for the builder» lines are closed.**

## Holds

- **Sign in by card:** card number and PIN, then Enter, lands on /belajar (`device_session_mode: CARD`). There is no personal-PIN step and no «Komputer siapa ini?», as designed (D-086(c)).
- **Time to the first task:** after the tour, one press («Mulai Pemetaan Awal») opens today's task. Nothing is started by opening it (`sittings_started: 0`).
- **Wrong card PINs** (the [S] pacing):
  - five tries are free, each with the same words: «Belum cocok. Coba periksa nomor kartu dan PIN, lalu coba sekali lagi.»;
  - the sixth waits: «Nomor kartu ini sudah terlalu sering dicoba. Tunggu 30 detik, lalu coba lagi. Lupa PIN? Tanyakan kepada guru.»;
  - **the right PIN during the wait is refused too**, with the countdown («Tunggu 29 detik»).
  - The words are short, blame no one, and point a child to their teacher.
- **Nothing tells whether a card number exists:** a number no card has gets the same words as a wrong PIN on a real card (`same_words_as_a_wrong_pin_on_a_real_card: true`).
- **The tour:**
  - seven cards, each with «Kembali», «Berikutnya» and «Lewati tur»;
  - closing it early at card 2 doesn't mark it done;
  - it reopens from «Bantuan» and runs to the end;
  - after completion it doesn't reopen by itself on the next sign-in on the same shared computer.
- **Signing out on a shared computer** leaves no open device session (`open_device_sessions: none`).
- **EN, screen reader, throttled, reduced motion:** every walk reaches the task with the same states.

## Improvement

| # | Finding | Siblings | Cause | Dim. | Fix |
|---|---|---|---|---|---|
| J1-1 | **The tour is written for an adult reader, and its first readers here are nine.** «Semua yang disediakan untuk Anda ada di sini, sudah diurutkan.»; «Hasil adalah langkah terakhir: penguasaan, bagian yang perlu diulang, dan perubahan sejak Pemetaan Awal.»; «Masing-masing bisa diperiksa keasliannya lewat tautan.» A nine-year-old reaches the task anyway (one button), so this is an Improvement, but the tour is meant to help them. | The SD learner's own pages use the same register | C-6 (one register chosen for every reader) | H | An SD register for the learner tour: short sentences, everyday words, no «keaslian», «penguasaan» or «diurutkan». For example, card 1: «Ini daftar tugasmu. Kerjakan yang paling atas dulu.»; card 5: «Di Hasil, kamu bisa lihat bagian mana yang sudah bisa dan mana yang perlu dibaca lagi.» Whether PINTAR uses «kamu» for SD is a product decision for the owner and Bob; **I recommend it for SD learner pages only.** |
| J1-2 | **At 320, the tour card's text is cut off** (`08-tur-5`). «… Perbandingannya selalu dengan diri sendiri» fades under the bottom edge of the sheet, above «Jangan tampilkan tur ini lagi». A child won't know to scroll inside the card. | — | — | V | The sheet grows to fit its text, or the illustration («CONTOH») shrinks at 320. No card's text is clipped. Add to the visual consistency pass. |
| J1-3 | **After a wrong card PIN, the PIN field keeps the wrong PIN** (`pin_field_value_kept: 000000`). A child must notice and delete it before retyping, and the next try often appends to it. | Password sign-in clears the field | — | F | Clear the PIN field and focus it after a refusal. Keep the card number. |

## Checked, no finding

- **Touch targets at 320:** «Masuk dengan kartu» and the tour's «Kembali» / «Berikutnya» are full-width or half-width buttons about 48 px tall. The PIN reveal control sits inside the field.
- **Nothing asks the child an account holder's question:** no PIN creation, no device question, no email.
