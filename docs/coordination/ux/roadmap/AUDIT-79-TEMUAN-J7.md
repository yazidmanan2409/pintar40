# Ruling 79 audit · J7, a key correction after results exist: findings (Daisy, 24 Nov 2026)

> **What holds now:**
> - **J7 walked** on the local audit world (`00fe853d`), W14 in the bootstrap tenant, with the certificates issued through the product (`terbitkan.mjs`).
>   - **People:**
>     - the school admin Yohana proposes the correction («7 × 8» keyed 54 → 56);
>     - the head of department Made confirms it;
>     - Ratih (100 → 83 %), Citra (67 → 50 %, so below the 60 mark) and Bayu (83 → 100 %);
>     - the outside verifier;
>     - the admin's certificate review.
> - **Captures:** `audit79-j7/`, at 390.
> - **8 findings: 4 Significant (one possibly Critical, for Sharon), 4 Improvement.**
> - **What works well:**
>   - the three-step proposal;
>   - step 2's impact preview, with exact counts and each learner before and after;
>   - «Hasil asli tetap tersimpan» on every recalculated result;
>   - «Sedang ditinjau» agreeing across the learner's list, her card and the public page;
>   - the public page's K-05 «Seperti saat diterbitkan» block.

## Significant

| # | Finding | Siblings (same fact) | Cause | Dim. | Fix |
|---|---|---|---|---|---|
| **J7-1** | **One unwarned press keeps a now-failing certificate valid.** Citra's recalculated result is 50 % against 60 %. In «Sedang ditinjau», her card offers «Konfirmasi berlaku» exactly like Ratih's (who still passes), with no confirmation step and no words naming the effect. After it: «✓ Sertifikat dikonfirmasi berlaku.» **Possibly Critical:** an outside verifier is now told «Berlaku · HASIL Lulus» for a pass the system itself no longer records | **Disagree.** Citra's result: «Belum lulus … 3 dari 6». The public check: «Berlaku · Lulus». The admin's card did show «67% → 50%, target 60%» | **C-7: a consequential choice offered the same whatever the facts beside it** | E, B | **Sharon decides** whether «Konfirmasi berlaku» may be offered at all when the recalculated result no longer meets the mark. At least: for that case, a confirmation that names the effect («Hasil yang dihitung ulang 50% di bawah target 60%. Bila dikonfirmasi, pemeriksaan sertifikat tetap menyebutnya Berlaku dan Lulus.»), with «Cabut» as the suggested action |
| **J7-2** | **A certificate under review tells its holder it is still valid.** Citra's and Ratih's certificate pages open with «Sedang ditinjau … Selama ditinjau, pemeriksaan sertifikat menyebutnya sedang ditinjau», and further down keep the standing line «Halaman itu memastikan sertifikat ini benar diterbitkan dan masih berlaku.» | **Disagree.** The public page under review: «Sampai selesai, sertifikat ini tidak dinyatakan berlaku.» | C-3 (a fixed sentence beside a state-derived banner) | B, H | The «Periksa keaslian» line follows the state: under review, «Halaman itu menunjukkan keadaan sertifikat ini saat ini.» |
| **J7-3** | **The second person is told nothing waits for them.** While the correction waits for the head of department: Studio's home «Tidak ada yang menunggu tindakan Anda di Studio.»; /pimpinan «Tidak ada keputusan yang menunggu Anda.»; and the queue page itself lists «Perbaikan kunci menunggu konfirmasi …» then ends «Tidak ada yang menunggu tinjauan Anda.» | **Disagree** on three of the four surfaces | C-4 | B | The waiting correction counts in Studio's «menunggu tindakan Anda», in /pimpinan's Bagian A, and in the queue's own empty line |
| **J7-4** | **The reissue panel says the result was never recalculated,** right after a recalculation: «Hasil · Tetap seperti di sertifikat ini; tidak pernah dihitung ulang.» (opened from «Cabut» on Citra's row) | **Disagree.** The admin's review card: «hasil dihitung ulang 67% → 50%». Citra's result: «Dihitung ulang» | C-3 | B, H | «Hasil tetap seperti di sertifikat ini; penerbitan ulang tidak menghitungnya ulang.» That is the true statement about reissuing |

## Improvement

| # | Finding | Siblings | Cause | Dim. | Fix |
|---|---|---|---|---|---|
| J7-5 | Only the school admin sees «Kunci jawaban keliru?». The class teacher and the head of department see «7 × 8 · Kunci 54» with no way to raise it | The admin's view has the link; the other two don't | C-8: who notices is not who may act, and nothing connects them | F, A | For staff who can read keys: «Laporkan kunci keliru», which reaches the material's owner |
| J7-6 | The proposal, the queue and the confirmation show the key as letters only («KUNCI SEKARANG A · KUNCI YANG DIUSULKAN B», «kunci A → B»). The second person must look up what A and B are | The question with its options is shown on the confirmation page only | — | F, H | «A. 54 → B. 56» |
| J7-7 | Step 2 explains the two lost explanations separately («Pilihan A akan kehilangan alasan …», «Pilihan B akan …»). Correct, but long | — | — | F | One line: «Pilihan A dan B kehilangan alasan dan pemahaman keliru terkaitnya …» |
| J7-8 | The admin's review cards use «target 60%» while the learner's result says «Belum lulus» (L-33) | — | C-6 | B | With L-33 |

## Not walked

- The printed-copy comparison;
- «Cabut» completed;
- the reissue completed;
- the EN pass, and the screen reader, throttled and reduced-motion passes.

These come from the builder's run. Citra's certificate is now «Berlaku» in my local world because of J7-1's test press. That is local only, and the world resets.

## The builder's note on reissuing (24 Nov 13:40): the product is right; my script was wrong

- **«Terbitkan ulang»** exists to correct what is printed (the name, the school, the package) after the record changes. Its panel compares «Tertulis di sertifikat» with «Tercatat sekarang», and with nothing changed there is nothing to reissue. So «only once the data has changed» is correct.
- **After a recalculation, the decision is «Konfirmasi berlaku» or «Cabut»,** made on the review card. Ratih, who still passes at 83 %, is the «Konfirmasi berlaku» case, not a reissue.
- **J7's script step 7 is corrected** to «the review is settled: Ratih confirmed valid, Citra revoked».
- **J7-4 stands:** the reissue panel's «tidak pernah dihitung ulang» is still false beside a recalculated result.

## Capture judgement · the builder's committed J7 (`63ff05e9/j7`, `5e0d0392`; L2 redone in `e0aa6294`), 24 Nov 15:40

The walks reached their last screen in all seven passes. The «Not walked» items above are now covered: «Cabut» completed, the reissue completed, the printed copies, EN, SR, throttled, reduced motion. **Every finding J7-1 to J7-8 stands in the captures.** J7-4 is visible in `33-admin-terbit-ulang`: «Hasil · Tetap seperti di sertifikat ini; tidak pernah dihitung ulang.» on Ratih's certificate, recalculated to 83 % and confirmed.

### Bob's three questions

| | Judgement |
|---|---|
| **(a)** Ratih's own way in opens the replaced certificate | **A finding: J7-9, Significant.** |
| **(b)** focus opens on «Batal»; the red «Cabut» is one Shift+Tab back | **Holds. Not a finding.** For an action that cannot be undone, focus on the safe choice is the right default. The question names the certificate and the effect («Cabut sertifikat MBPZ95KA/00001? Pemeriksaan sertifikat lalu menyebutnya dicabut.»). The SR tree reads it as a named group with both buttons. The reason field above already says «tidak dapat diubah». |
| **(c)** L-105, the printed copy | **A finding: J7-10. I propose Critical for a revoked certificate and Significant for a replaced one; Sharon decides.** |

### New findings

| # | Finding | Siblings | Cause | Dim. | Fix |
|---|---|---|---|---|---|
| **J7-9 (Significant)** | **After a reissue, the holder's own way in leads to the old certificate.** Ratih's result page «Lihat sertifikat» opens 6PQFF0H5/00001, the replaced one (`35`, `36`). The banner is clear and calm: «Sertifikat ini sudah digantikan dengan yang lebih baru … Gunakan yang baru». But the full certificate still sits below it, ready to print (J7-10). «Buka sertifikat yang baru» goes to the **public check page** (`/verifikasi/…`), not to her own certificate page. | **Disagree.** The admin's list: /00002 «Berlaku», /00001 «Digantikan». The public check of /00001: «Digantikan sertifikat yang lebih baru». The holder's link: /00001. | C-3: the page finds «the certificate» from the sitting, not from the chain's current end | B, E | «Lihat sertifikat» opens the current end of the chain (/00002). The replaced one stays reachable from it: «Menggantikan sertifikat 6PQFF0H5/00001». On the old page, «Buka sertifikat yang baru» opens her own certificate page, not the public check. |
| **J7-10 (proposed Critical for revoked; Significant for replaced)** | **A printed revoked certificate looks valid.** The browser's print of Citra's revoked certificate (`28`, `citra-dicabut-sertifikat-cetak.pdf`) is the clean certificate: name, «Telah dinyatakan memenuhi kriteria kelulusan …», date, number. There is no «Dicabut», no banner, and no way to check it. The replaced /00001 prints the same way (`37`). **Every printed copy, valid ones too, also lacks a check address.** The public check opens by a link token, so a reader holding only the paper and its number cannot check it, unless there is a lookup by number I have not seen. | **Disagree.** The screen: «Sertifikat ini sudah dicabut oleh penerbitnya». The public check: «Dicabut». The paper: valid. | C-3 (the print view re-derives the document without its state). Revocation exists to stop this exact use. | E, B | (1) The print view carries the state on the document itself, for example a band across it: «DICABUT · {tanggal}. Sertifikat ini tidak berlaku.» or «DIGANTIKAN oleh {nomor baru}». (2) Every printed copy carries its check address in words (and a QR if the product wants one): «Periksa keasliannya: {alamat}». (3) Sharon decides whether a revoked certificate offers printing at all. |
| J7-11 | **The certificate table does not fit at 1280.** With the sidebar, the «Keadaan» column is cut («Berlak…», «Dicabu…», «Diganti…») and the «Cabut» column is off-screen (`25`, `34`). After a search the table scrolls sideways and the number column is cut instead («…at», «0001», `33`). On the admin's one page for certificate state, the state is the column that is hidden. | — | — | V, F | The table fits 1280 with the sidebar: the long confirmation note wraps under the badge in a narrower cell, or moves to the selected row's panel. Below that width, use stacked rows like other lists. |
| J7-12 | **The selected-certificate panel is headed «CABUT SERTIFIKAT · {nomor}»** while it also holds «Terbitkan ulang», and stays so on a certificate already «Digantikan» (`33`, `34`) | — | C-6 | H | Head it with the certificate: «Sertifikat {nomor}». «Cabut» and «Terbitkan ulang» become the two sections under it. |
| J7-13 | The success line «✓ Sertifikat dikonfirmasi berlaku.» does not name the certificate, and stays above Citra's card after Ratih's confirmation (`24`) | — | — | H | «✓ Sertifikat {nomor} ({nama}) dikonfirmasi berlaku.» |

**J7's «left for the builder» lines are closed.**
