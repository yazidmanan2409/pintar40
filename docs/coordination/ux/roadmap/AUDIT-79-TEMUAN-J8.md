# Ruling 79 audit · J8, a school year set up: findings (Daisy, 24 Nov 2026)

> **What holds now:**
> - **J8 walked in part** on the local audit world (`00fe853d`), as W15 Wahyu Nugroho, the one Admin sekolah of the empty SD Sintetis Anggrek.
>   - **Read:** every Konfigurasi sub-page from the empty state, plus Pendataan and Aktivasi.
>   - **Done through the screens:** the structure (a Bagian, a wrongly shaped year and then a right one for a Tingkat, two Kelas) and a wrongly shaped school code.
> - **Not walked here:**
>   - pass marks (none can be set before the school has a lesson);
>   - roles with «Berlaku sampai»;
>   - the planted-error workbook;
>   - printed cards;
>   - a renamed rule;
>   - the last admin's refusals;
>   - the screen reader, throttled and reduced-motion passes.
>   These come from the builder's run.
> - **Captures:** `audit79-j8/`.
> - **6 findings, all Improvement.** **L-39 (K-1) is confirmed on a second school:** /konfigurasi's chevrons end at x = 801 to 879 at 1280.
> - **Holds:**
>   - the readiness list («Persiapan sekolah») updates as the year is built («Sudah · Kelas aktif · 2»; «Kelas yang belum punya guru: 1A, 1B») and points to the page for each step;
>   - every empty sub-page says what is missing and where to make it;
>   - a wrongly shaped year is refused by PINTAR with its rule («Tulis tahun ajaran seperti 2026/2027.»), keeping what was typed;
>   - each addition is confirmed («✓ 1B ditambahkan.»).

## Improvement

| # | Finding | Siblings | Cause | Dim. | Fix |
|---|---|---|---|---|---|
| J8-1 | Three fields are refused only by the browser's own bubble (`required` / `pattern`): an empty Bagian name, a school code «A-1» against `[A-Za-z0-9]{3}`, and (J10-3) a short reopening message. PINTAR's own line by the field never appears, so the wording is the browser's and a screen reader may not announce it. **This makes J10-3 a pattern; one row for all three** | **Disagree.** The Tingkat's year field shows PINTAR's own refusal line | New cause (proposed C-10): **some forms leave validation to the browser while others give PINTAR's own refusal** | C, G | One rule: a refused field shows PINTAR's line by it («Tiga huruf atau angka, misalnya AGR.»), announced, with the value kept |
| J8-2 | One school year, two spellings: «2026/27» on the structure (Tingkat, Kelas) and «2026/2027» in the readiness list («1A (2026/2027)») and the year field | **Disagree** (format only) | C-6 (words chosen per screen) | B | One format everywhere: «2026/2027» |
| J8-3 | Confirmations pile up: after two Kelas, «✓ 1B ditambahkan.» and the older «✓ Kelas 1 ditambahkan.» both still show, at separate places in the page | — | — | B, H | Show only the latest confirmation, next to what it added |
| J8-4 | Kelas are added one per submission. A 600-learner school (about 20 Kelas) needs 20 submissions and 20 page loads before intake can start | — | — | F | Allow a list in one field: «1A, 1B, 1C» → «3 Kelas ditambahkan.» |
| J8-5 | «Sistem & Konfigurasi» on an empty school ends with a bare «Belum ada.», without saying what doesn't exist yet | — | — | H | Name it: «Belum ada aturan sekolah yang disimpan.» (or what the list holds) |
| J8-6 | «Laporan» on an empty school says «Buat Kelas di Struktur sekolah di atas»; «Struktur sekolah» is not above, it is another page | — | — | H | «Buat Kelas di Struktur sekolah.» with the link |
