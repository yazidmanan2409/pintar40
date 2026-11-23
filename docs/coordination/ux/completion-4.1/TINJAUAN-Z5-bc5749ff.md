# Z5 · review at `claude/z-ux` `bc5749ff` (Daisy, 23 Nov 2026)

> **What holds now:** **PASS with two small conditions (C-1, C-2).** Both are client-only and can ride Z7.
> - **Rows:** R-10 (option A), N-9, S-01 (Sharon passed), S-02/S-03, S-04, S-05, S-06, S-07, S-16, R-26 item 3, N-16 and N-17 match.
> - **Captures:** 13 shots × 3 widths accepted, keyboard only, 0 px overflow.
> - **The builder's two walk findings:** (a) gets creation words; (b) gets its intended behaviour. Both are for Z7.
> - **Read:**
>   - the src diff `954aa9bc..bc5749ff`;
>   - `CATATAN-Z5.txt`;
>   - the definisi edit row in source.

## 1 · The builder's questions

1. **The English is accepted:**
   - **N-9:** «This staff record cannot be opened. It may no longer exist, or it is not for you.» It follows the refusal pattern exactly.
   - **S-04:** «A school code is three letters or digits.»
   - **S-05:**
     - «The questions per difficulty must add up to the Number of questions. Check both, then try again.»
     - «The minimum safety questions cannot be more than the Number of questions.»
     - The hint addition «The three must add up to the Number of questions.»
   - **R-26 item 3:** «Update status», «Save name», «Save changes», «Create rule», «Grant permission».
2. **S-02 without a client-side `required`: accepted.** A role is optional, so `required` would be wrong. A role chosen without a date is now refused with «Tanggal berlaku sampai harus hari ini atau sesudahnya.», never dropped (captures 04 and 05).
3. **S-04's field empty after the refusal: fix it (C-1).** Ruling 81's «work kept» applies, and `kenapa` already carries what was typed.
4. **N-17's guard-only browser measure: accepted.** No reachable button shrinks today, and the rule is guarded.
5. **Kanonik «Berikan izin» proved from source (Z-R26-03): accepted.** There is no library package locally.

## 2 · Conditions (client-only; can ride Z7)

- **C-1 · S-04 keeps what was typed.** After the shape refusal, the code field is refilled from `kenapa`, as every other refused form here keeps its input (capture 07: «kept after the refusal: no»).
- **C-2 · S-05 on the rule's edit row needs its own sentence.**
  - The edit row (`studio/definisi/page.tsx`) shows only «Nama aturan» and «Jumlah soal». A rule with a difficulty mix refuses a changed count with «… Periksa keduanya, lalu coba lagi.», but the mix can't be seen or changed there.
  - **On the row only (`definisi` present), new key `galat.definition_mix_total_baris`:**
    - ID: «Aturan ini membagi soalnya per tingkat kesulitan, jadi Jumlah soal tidak dapat diubah di sini. Buat aturan baru dengan jumlah yang diinginkan.»
    - EN: «This rule divides its questions by difficulty, so the Number of questions cannot be changed here. Create a new rule with the number you want.»
  - **The new-rule form keeps `galat.definition_mix_total`** (capture 10, correct there).

## 3 · The walk findings, for Z7 (client-only)

- **(a) Creating a rule is answered with the re-versioning sentence** (capture 10b: a new rule is told «Perubahan ini mengubah cara hasil dibaca, jadi tersimpan sebagai aturan baru…»). On the new-rule form (`definisi=""`), show instead new key `studio.definisi.dibuat`:
  - ID: «Aturan baru dibuat.»
  - EN: «The new rule has been created.»
  - Tone `ok`. The edit row keeps `versi_baru` and `tetap` as they are.
- **(b) The bar at 320 breaks «Konfigurasi» mid-word.** Intended behaviour:
  - the place word never breaks inside a word (no `overflow-wrap: anywhere` or `word-break` on it, no hyphenation);
  - if it doesn't fit beside the brand, it moves whole to the bar's second line, and the bar grows;
  - it is never truncated with an ellipsis, because the place word says where the person is.
  - The same applies to every place word: Pendataan, Studio, Mengajar, Aktivasi akun.
  - **Test:** at 320, the place word's text node has one line box per word.

## 4 · Notes

- **S-06 «Jadwal materi ini tidak dapat diubah.» is accepted as the minimum.** Naming the lasting cause needs the server to separate the guards; that goes to the ruling 79 audit.
- **N-19 (optional, later) · in captures 08 and 09, the reason line is announced twice** («… | …»): the inline line and the result line say the same sentence. One live region is enough.
- **R-10 is correct.** NavKonfigurasi is one source. `aria-current` is on «Konfigurasi» for kesempatan (01), and the platform admin's «Kirim email uji» is present and current on email-uji (02).
