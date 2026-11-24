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
| **J10-1** | **A closed account with the right password is told the password is wrong.** Puspa signs in with her correct password and reads «Email, username, atau password belum cocok. Periksa lagi, lalu coba sekali lagi.» She will retype or reset a password that is right. The way out («Akun Anda sudah ditutup? Minta dibuka kembali») is on the page, but nothing points her to it. Ruling 81's first question fails | **Disagree.** The truth is CLOSE · DONE. The reopening page knows closed accounts exist; the sign-in refusal hides it | Proposed cause C-9: **a refusal worded to hide a state from strangers is shown to the owner too** | C, H | **Sharon decides.** Once the password is proven correct, telling the owner is not an oracle: «Akun ini sudah ditutup. Anda dapat meminta dibuka kembali.» + the link. With a wrong password, the refusal stays as it is |

## Improvement

| # | Finding | Siblings | Cause | Dim. | Fix |
|---|---|---|---|---|---|
| J10-2 | A learner whose PIN the admin reset gets «PINTAR ID atau PIN tidak cocok. Periksa keduanya» on PIN recovery. They will keep checking a PIN that can no longer work. The session lock has its own line for this («belum punya PIN yang bisa dipakai»); recovery doesn't | **Disagree.** The session lock knows and says it; recovery does not | C-9 (as J10-1) | C, H | Without an oracle: add one line under the refusal for everyone, «Bila PIN Anda baru diatur ulang oleh sekolah, pulihkan lewat email atau tanyakan kepada admin sekolah.» |
| J10-3 | A message that is too short on the reopening form is held only by the browser's own bubble (`minlength`). The page shows no line by the field, so a screen reader may not announce it, and the bubble's wording is the browser's, not PINTAR's | Other PINTAR forms show their own line by the field | — | G | Validate on submit with the page's own line by the field, «10 sampai 500 karakter» shown as the error, with the text kept (it is kept today) |

## Holds (checked)

- **Sign-in:** the password reveal is a real button, «Tampilkan password» with `aria-pressed`. The signed-out page offers each way out by name («Lupa password?», «Minta dibuka kembali», «Aktifkan akun», «Gunakan kartu kelas»).
- **PIN recovery:** says what to type and where it comes from («PINTAR ID yang ada di kartu PINTAR Anda»). After it, the new-password page says what will happen («akun ini keluar dari semua perangkat lain») and the rules.
- **Reopening:**
  - it explains who decides and that records are kept;
  - the double press made **one** request (DB: one REOPEN, RECEIVED);
  - the confirmation promises no time (ruling 90);
  - Back returns to the form without resending.

## Confidentiality marking (ruling 96: «better guidance without weakening account confidentiality»; Sharon decides each one marked)

| # | Would the proposed guidance reveal something about a specific account? |
|---|---|
| **J10-1** | **[S] YES: the account's state (closed).** It is revealed only to someone who has just typed that account's **correct password**. Whether that is acceptable (shared, leaked or old passwords) is Sharon's call. **The fallback reveals nothing:** keep the refusal as it is, and add one line under it for everyone: «Bila akun Anda sudah ditutup, password yang benar pun tidak dapat dipakai untuk masuk. Minta dibuka kembali.» + the link |
| J10-2 | **No.** The proposed line is shown to everyone, whatever was typed, and names no account |
| J10-3 | **No.** It is form validation of the person's own message |

## Capture judgement · the builder's committed J10 (`d70f3222/j10`, `6b248975`), 24 Nov 20:10

The builder made eight walks (1280/390/320, EN, SR, throttled, reduced motion, and the tour-open branch), and every one reached its last screen. **Every «left for the builder» line is walked.**
- **The email path holds** (L2, L3):
  - an address with no account gets the same screen as a real one («Jika nama ini milik akun PINTAR yang sudah aktif …»);
  - the code arrives at the account's own address;
  - after the change: «✓ Password Anda sudah diganti · Akun ini sudah keluar dari semua perangkat lain.»
- **PIN recovery running out of time holds:** «Waktu untuk membuat password baru sudah habis. Ketik lagi PINTAR ID dan PIN Anda.»
- **The real-time lock holds** (L5–L9):
  - the warning comes at 4 minutes and the lock at 5;
  - «Anda bisa mencoba 2 kali lagi» and then «1 kali lagi; jika tidak cocok lagi, Anda perlu masuk lagi»;
  - the card lock reads «Lupa PIN? Keluar, lalu minta bantuan guru Anda.»;
  - the lock after a PIN reset reads «Akun ini belum punya PIN yang bisa dipakai …»;
  - after 61 minutes, the session has ended.
- **Account set-up holds:** each weak-PIN reason names its pattern (same digit, sequence, pattern, straight line, year, the two PINs not matching).
- **J10-1** is reproduced (`37`: the correct password is refused with «belum cocok», and both fields turn red). **J10-2** is reproduced (L4: a PIN reset by the school gets the same refusal). CI-2's general line (CI2-KATA §3) answers both.
- **J10-3** is reproduced (`39`). It is worse in the capture: the bubble is the browser's own English («Please lengthen this text to 10 characters or more …») on an Indonesian page. It stays an Improvement and joins C-10 with J8-1.

### L-113 · J10-4 (Significant): «Komputer siapa ini?» promises a setting a learner never gets

- **The finding.** The question says «Anda bisa mengubah pilihan ini nanti di Akun saya.» (EN «You can change this later in My account.»). A learner's «Akun saya» (`09`) has no «Komputer ini»: the section sits after the `if (!staf)` return in `src/app/akun/page.tsx`. /perangkat works for a learner, but only by typing its address.
- **Why Significant, not an Improvement.** The choice matters most for learners, who sit at shared lab computers. A learner who picks «Komputer pribadi saya» on a school computer stays signed in for up to 7 days on a machine the next class uses. The way back the screen promises doesn't exist. It is an unsupported promise (principle 4) about the one setting that protects the learner's account.
- **Siblings disagree.** /perangkat serves learners. The staff «Akun saya» has «Komputer ini · Ubah». The learner's has nothing.
- **Cause:** C-3 (a page re-derives who gets what), next to C-8.
- **Recommended: the learner gets the section, and the promise stays.** Move the existing «Komputer ini» block above the staff check. Its words are already right for a learner:
  - «Komputer ini»;
  - «Komputer bersama: layar ditutup setelah 5 menit tidak dipakai.» or «Komputer pribadi Anda: Anda tetap masuk hingga 7 hari.»;
  - «Ubah» → `/perangkat?lanjut=%2Fakun`.
  - The keys `akun.perangkat.*` need the learner persona registered if `t(…, "learner")` requires it. No new words.
  - The learner's «Akun saya» must also be reachable from the learner header. Check whether the name menu reaches it.
- **Only if the section can't be given** (not recommended), the promise changes:
  - ID: «PINTAR menjaga akun Anda sesuai komputer yang Anda pakai. Pilihan ini ditanyakan lagi setiap kali Anda masuk di browser baru.»
  - EN: «PINTAR looks after your account to suit the computer you use. You're asked again whenever you sign in on a new browser.»
  - That is true only if the question really returns per browser. **The builder must confirm before this text is used.**

### L-112 (Sharon's severity): the UX side only

In the tour branch, the tour stayed open with no input, and in 9 minutes there was no warning and no lock (heartbeats at 57, 242, 307 and 487 s). On the screen (`01`–`03`), the dimmed overlay and the tour card look exactly as they did at the start: **nothing tells anyone at the computer that the protection is paused.** UX requirements, whatever Sharon rates it:
1. **The lock warning takes precedence over the tour.** It appears above the tour's dim, and «Saya masih di sini» keeps the tour where it was.
2. **When the lock comes, the tour closes without being marked as seen.** It returns at the next sign-in, as «Lewati tur» already promises («Tur akan muncul lagi saat Anda masuk berikutnya»).
3. **No new words needed.**

### New findings from the captures

| # | Finding | Siblings | Cause | Dim. | Fix |
|---|---|---|---|---|---|
| J10-5 | **Two layers at once.** The «Lewati tur» note («Tur akan muncul lagi saat Anda masuk berikutnya … Mengerti») stays open under the lock warning, over «Halo, Intan» (`26`). The person at the computer has two things asking for an answer. | — | — | V, F | While the lock warning shows, the tour's note is hidden. The warning is the only thing asking. |
| J10-6 | **Two layouts for one family of pages.** /masuk, /masuk/lupa, PIN recovery and /masuk/buka-kembali have the green panel on the right. **/terkunci and /perangkat leave the right half empty** (`08`, `27`) at 1280. /terkunci's column is also tight: «Terkunci untuk …» touches the heading, the field label touches the paragraph, and «Lupa PIN?» touches the button. /masuk's links, by contrast, are spaced about 110 px apart. **«Minta akun dibuka kembali» is body-size text, not a heading** (`39`), while every sibling page has a large h1. | Every other sign-in page | C-6 (here, layout chosen per screen) | V | One sign-in shell for all of them: the panel, the h1 size, and one vertical rhythm (as /pin's spacing). Goes into the visual consistency pass. |
| J10-7 | Opened from «Akun saya · Ubah», /perangkat still says «Anda bisa mengubah pilihan ini nanti di Akun saya» (`10`), on the page you came from Akun saya to reach | — | — | H | When `lanjut` is /akun, drop the sentence. The lede ends at «… komputer yang Anda pakai.» |
| J10-8 (optional) | After three wrong PINs, the sign-in page says only «Sesi di komputer ini sudah berakhir. Masuk lagi untuk melanjutkan.», the same line as the 60-minute end (L6, L9). The owner isn't told why. | — | — | H | «PIN tidak cocok tiga kali, jadi sesi di komputer ini diakhiri. Masuk lagi dengan password Anda.» It names no account. **Optional, because the general line is also true.** |

**J10's «left for the builder» lines are closed.**
