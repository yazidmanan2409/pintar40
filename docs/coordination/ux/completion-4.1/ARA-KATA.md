# AR-A words: certificates, three facts, one state (Daisy, 26 Nov 2026)

> **What holds now:**
> - **Words before code** for AR-A (AUDIT-79-AR79-PLAN.md §2 AR-A, `claude/bob-41-master-plan`). The findings are L-16, L-44, L-66, L-68, L-70, L-82, L-86, L-103 and L-106 to L-109.
> - **Drafted from main's text** (`src/lib/hle.ts` at `b9ca98ef`'s line). Second Eye's walked strings are reconciled in the last section when they come. A string they show that this file doesn't cover gets words there, before code.
> - **Three facts, said separately:**
>   1. the passing result the certificate was issued on;
>   2. the recalculated result, where there is one;
>   3. the certificate's validity now.
>
>   Each surface states only the facts its reader may see. **The public check shows no score** (D2-R R-c), so it carries facts 1 and 3 only.
> - **Required** means the finding needs it. **Optional** is marked.
> - The verdict words follow AR-G §2 (TINJAUAN-AR79-PLAN.md): «Lulus / Belum lulus», with the figure after the word.

## 1 · «Periksa keaslian» never promises validity (L-68; the CI-1b print note) · required

One sentence for every state, on screen and on paper. It makes no claim about state, so it can't contradict any state (C-3), and the paper stays true after it is printed.

| Key | Now | New |
|---|---|---|
| `sertifikat.periksa.arti` | «Pindai kode ini atau buka tautannya. Halaman itu memastikan sertifikat ini benar diterbitkan dan masih berlaku.» | «Pindai kode ini atau buka tautannya. Halaman itu menunjukkan apakah sertifikat ini benar diterbitkan dan bagaimana keadaannya sekarang.» |
| EN | «Scan this code or open the link. That page confirms this certificate was genuinely issued and is still valid.» | «Scan this code or open the link. That page shows whether this certificate was genuinely issued and what its status is now.» |

- **Why one sentence and not one per state:** a printed BERLAKU certificate can be revoked after it is printed. «masih berlaku» on paper is a promise the paper can't keep.
- The public page's own `verifikasi.status.BERLAKU.arti` («… dan masih berlaku») stays. It is read live, so it is true when it is read.

## 2 · The learner's certificate page: no promise where no certificate can come (L-44, L-16) · required

**The page follows §13's three states, the same as the result page** (`keadaanSertifikat`).

| State | Words |
|---|---|
| **Being prepared** (a pass that will certify) | `sertifikat.disiapkan.arti`: «Anda lulus Uji Penguasaan. Sertifikat akan muncul di sini, lengkap dengan nomor dan tautan pemeriksaannya, setelah diterbitkan.» / «You passed the Mastery Check. The certificate will appear here, with its number and verification link, once it has been issued.» (L-16: «sudah memenuhi syarat» becomes the verdict word.) The heading and `…tenang` are unchanged. |
| **No certificate possible** (not certifying, or evidence not OFFICIAL, INV-20) | New `sertifikat.tidak_ada.judul`: «Hasil ini tidak menghasilkan sertifikat» / «This result doesn't lead to a certificate». New `sertifikat.tidak_ada.arti`: «Hasil Anda tetap tersimpan dan bisa dilihat kapan saja.» / «Your result is kept, and you can see it at any time.» Then the existing link `sertifikat.disiapkan.hasil`. **There is no «sedang disiapkan», no «akan muncul» and no «tidak ada yang perlu dilakukan».** |
| **Not passed** (certifying, not yet passed) | New `sertifikat.belum.arti`: «Sertifikat diterbitkan setelah Anda lulus Uji Penguasaan ini.» / «A certificate is issued once you pass this Mastery Check.» Then the same link. |

- **No reason is given for «tidak menghasilkan sertifikat».** «Bukan resmi», «pratinjau» and «demo» are the school's terms, not the learner's. The result page already shows nothing here (§13), so the learner is never told a certificate is coming.

## 3 · The learner's page after a recalculation: three facts (AR-A's authority) · required

**Today, once a certificate is confirmed after a recalculation, the learner's page shows a plain «Berlaku»** with nothing about the recalculation, while the result page says «Dihitung ulang». Under the certificate's heading, for a certificate whose result was recalculated:

| Fact | Key (new) | ID | EN |
|---|---|---|---|
| 1 | `sertifikat.fakta.terbit` | «Diterbitkan atas hasil {asli} · Lulus.» | «Issued on a result of {asli} · Passed.» |
| 2 | `sertifikat.fakta.dihitung_ulang` | «Penilaian satu soal kemudian diperbaiki, dan hasil Anda dihitung ulang: {baru} · {Lulus / Belum lulus}.» | «The marking of one question was later corrected, and your result was recalculated: {baru} · {Passed / Not passed}.» |
| 3, under review | existing `sertifikat.ditinjau.arti` | unchanged | unchanged |
| 3, confirmed | `sertifikat.fakta.dikonfirmasi` | «Sekolah Anda sudah meninjaunya: sertifikat ini tetap berlaku.» | «Your school has reviewed it: this certificate remains valid.» |
| 3, revoked | existing `sertifikat.dicabut.*` | unchanged | unchanged |

- **With no recalculation, no fact line is added.** The page is as it is today.
- `{asli}` and `{baru}` use the result page's percent format. The learner already sees both on the result page (`hasil.dikoreksi.asli`).
- **On paper: none of these lines print.** The paper carries only the certificate and, under review, CI-1b's band.

## 4 · The public check · no new words

- **Confirmed after a recalculation:** a certificate can be confirmed only if its recalculated result still passes (`cert_review_result_no_longer_passes`), so «Hasil · Lulus» stays true. The public page shows no score. **Nothing to add.**
- Under review and revoked already carry «Seperti saat diterbitkan» (K-05). **They are unchanged.**

## 5 · The reissue and revoke panel (L-70, L-108, L-109) · required

| Finding | Key | Now | New ID | New EN |
|---|---|---|---|---|
| L-70 | `sertifikat.ganti.hasil_arti` | «Tetap seperti di sertifikat ini; tidak pernah dihitung ulang.» | «Tetap seperti di sertifikat ini. Penerbitan ulang tidak menghitung ulang hasil.» | «As on this certificate. Reissuing doesn't recalculate the result.» |
| L-70 (three facts; staff see the figures) | new `sertifikat.ganti.hasil_dihitung_ulang`, only when the result was recalculated | — | «Hasilnya sudah dihitung ulang ({asli} → {baru}); sertifikat ini {keadaan}.» with {keadaan} as «sedang ditinjau» or «dikonfirmasi berlaku» | «Its result has been recalculated ({asli} → {baru}); this certificate is {keadaan}.» with «under review» or «confirmed valid» |
| L-108 | the panel's heading | «Cabut sertifikat · {nomor}» | new `sertifikat.panel.judul`: «Sertifikat {nomor}». «Cabut sertifikat» and «Terbitkan ulang» become its two sections, unchanged. | «Certificate {nomor}» |
| L-109 | `config.tinjau_sertifikat.ok_konfirmasi` | «Sertifikat dikonfirmasi berlaku.» | «✓ Sertifikat {nomor} ({nama}) dikonfirmasi berlaku.» | «✓ Certificate {nomor} ({nama}) is confirmed valid.» |
| L-109 sibling | `config.tinjau_sertifikat.ok_cabut` | «Sertifikat dicabut.» | «✓ Sertifikat {nomor} ({nama}) dicabut.» | «✓ Certificate {nomor} ({nama}) is revoked.» |

- **L-109:** the line sits above the row it names, or replaces the old line. It never stays above another person's card.
- **L-108, on a certificate already «Digantikan»:** the heading is still «Sertifikat {nomor}». The existing `sertifikat.cabut.digantikan` line explains why there is nothing to do.

## 6 · After a reissue, the holder's way in (L-106) · required

- **«Lihat sertifikat»** (`siklus.lihat_sertifikat`, and the list's rows) opens **the chain's current end.** The words are unchanged.
- **On the current certificate,** a quiet line under the number. New `sertifikat.menggantikan`: «Menggantikan sertifikat {nomor}.» / «Replaces certificate {nomor}.» The number links to the replaced certificate's own page.
- **On the replaced certificate,** «Buka sertifikat yang baru» opens the holder's own page for the new certificate, not `/verifikasi`. The words are unchanged.

## 7 · Siapkan's certificate step (L-82) · required

| Key | Now | New |
|---|---|---|
| `mengajar.instrumen.sertifikat.arti` | «Diterbitkan sekolah bila murid memenuhi capaian; bisa diperiksa siapa pun lewat tautan.» | «Diterbitkan sekolah bila murid lulus Uji Penguasaan; bisa diperiksa siapa pun lewat tautan.» |
| EN | «Issued by the school when a student meets the standard; anyone can check it through its link.» | «Issued by the school when a student passes the Mastery Check; anyone can check it through its link.» |

## 8 · The check link on screen (L-86) · required, with one optional rename

- **On screen, the address becomes a link.** New `sertifikat.buka_periksa`: «Buka halaman pemeriksaan» / «Open the check page». The address stays visible as text beside it, so it can be read aloud or copied by hand.
- **The copy button stays.** *Optional:* `sertifikat.salin` «Salin tautan verifikasi» becomes «Salin tautan pemeriksaan» / «Copy the check link», matching «Periksa keaslian» and «halaman pemeriksaan» everywhere else.
- **On paper, nothing changes:** the text and the QR.

## 9 · The A4 preview and screen readers (L-103) · required

- The preview's duplicate is hidden from the accessibility tree.
- Its visible heading becomes new `sertifikat.a4.judul`, «Sertifikat · A4» / «Certificate · A4», followed by one line. New `sertifikat.a4.arti`: «Sertifikat yang sama, diatur untuk kertas A4.» / «The same certificate, laid out for A4 paper.»
- **A screen reader hears the certificate once,** then that line, then «Cetak».

## 10 · No words needed

- **L-66** (the list loses the chapter title while a retake is open): the list reads the certificate's own sitting, so the existing title shows. The words are unchanged.
- **L-107** (the table at 1280): layout only. The long «Dikonfirmasi setelah dihitung ulang · {alasan}» note wraps under the badge, or moves to the selected row's panel. The words are unchanged.

## 11 · Second Eye's walked strings

*Pending.* When they come, each string is matched against §1–§10 here, and anything not covered gets words before code.
