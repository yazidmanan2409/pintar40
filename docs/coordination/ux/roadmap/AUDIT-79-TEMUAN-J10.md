# Ruling 79 audit · J10, locked out: findings (Daisy, 24 Nov 2026)

> **What holds now:**
> - **J10's signed-out paths walked** on the local audit world (`00fe853d`).
>   - **Forgot password:** by email (an active account, and an address that doesn't exist).
>   - **By PINTAR ID + PIN:** right; wrong PIN; unknown ID; the account whose PIN the admin reset (W2).
>   - **Closed account (W17, Puspa):** signing in; then the reopening request with a short message, a double press, and Back.
> - **Not walked here:**
>   - the session lock (it needs a shared-computer session);
>   - the PIN recovery's time running out;
>   - the account set-up steps from J1;
>   - the screen reader, throttled and reduced-motion passes.
>   These come from the builder's run.
> - **The email path is environmental locally:** both addresses got «PINTAR sedang tidak dapat memproses ini … Kode rujukan: …», because there is no mail service in my local stack. The message itself is good (a reference code, who to tell). The builder's run must show the real path.
> - **Captures:** `audit79-j10/`, at 390.
> - **3 findings: 1 Significant, 2 Improvement.**
> - **[S] holds:** no existence oracle seen. A wrong PIN, an unknown PINTAR ID and a reset account all read «PINTAR ID atau PIN tidak cocok. Periksa keduanya, lalu coba lagi.» The reopening confirmation says «Jika akun itu memang sudah ditutup, …».

## Significant

| # | Finding | Siblings | Cause | Dim. | Fix |
|---|---|---|---|---|---|
| **J10-1** | **A closed account with the right password is told the password is wrong.** Puspa signs in with her correct password and reads «Email, username, atau password belum cocok. Periksa lagi, lalu coba sekali lagi.» She will retype or reset a password that is right. The way out («Akun Anda sudah ditutup? Minta dibuka kembali») is on the page, but nothing points her to it. Ruling 81's first question fails | **Disagree.** The truth is CLOSE · DONE. The reopening page knows closed accounts exist; the sign-in refusal hides it | New cause (proposed C-10): **a refusal worded to hide a state from strangers is shown to the owner too** | C, H | **Sharon decides.** Once the password is proven correct, telling the owner is not an oracle: «Akun ini sudah ditutup. Anda dapat meminta dibuka kembali.» + the link. With a wrong password, the refusal stays as it is |

## Improvement

| # | Finding | Siblings | Cause | Dim. | Fix |
|---|---|---|---|---|---|
| J10-2 | A learner whose PIN the admin reset gets «PINTAR ID atau PIN tidak cocok. Periksa keduanya» on PIN recovery. They will keep checking a PIN that can no longer work. The session lock has its own line for this («belum punya PIN yang bisa dipakai»); recovery doesn't | **Disagree.** The session lock knows and says it; recovery does not | C-10 (as J10-1) | C, H | Without an oracle: add one line under the refusal for everyone, «Bila PIN Anda baru diatur ulang oleh sekolah, pulihkan lewat email atau tanyakan kepada admin sekolah.» |
| J10-3 | A message that is too short on the reopening form is held only by the browser's own bubble (`minlength`). The page shows no line by the field, so a screen reader may not announce it, and the bubble's wording is the browser's, not PINTAR's | Other PINTAR forms show their own line by the field | — | G | Validate on submit with the page's own line by the field, «10 sampai 500 karakter» shown as the error, with the text kept (it is kept today) |

## Holds (checked)

- **Sign-in:** the password reveal is a real button, «Tampilkan password» with `aria-pressed`. The signed-out page offers each way out by name («Lupa password?», «Minta dibuka kembali», «Aktifkan akun», «Gunakan kartu kelas»).
- **PIN recovery:** says what to type and where it comes from («PINTAR ID yang ada di kartu PINTAR Anda»). After it, the new-password page says what will happen («akun ini keluar dari semua perangkat lain») and the rules.
- **Reopening:**
  - it explains who decides and that records are kept;
  - the double press made **one** request (DB: one REOPEN, RECEIVED);
  - the confirmation promises no time (ruling 90);
  - Back returns to the form without resending.
