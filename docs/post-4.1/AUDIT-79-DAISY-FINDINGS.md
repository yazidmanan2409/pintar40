# Audit 79 · Daisy's findings, complete list (as of 24 Nov 2026, 20:15Z)

Compiled by Bob from Daisy's eleven journey files, `docs/coordination/ux/roadmap/AUDIT-79-TEMUAN-J2.md` to `…-J12.md`, on `ux-1/daisy-experience` at `5d0096b7`. The ledger references are from `docs/post-4.1/AUDIT-79-LEDGER.md`.

**Severity** is the final one in the ledger. Where Sharon classified a finding, her classification is binding.

**Status:**
- All findings are still open for correction.
- None is fixed yet, except that CI-1 (ready, awaiting the owner) corrects J7-1.
- Everything else goes into CI-1b or AR-79, as the notes say.

## Summary

| Severity | Count |
|---|---|
| Critical | 1 (J7-1) |
| High | 1 (J7-10) |
| Significant | 19 |
| Improvement | 46 |
| **Open findings** | **67** |
| Not counted: confirmations of an earlier row, a harness note, a world artefact, no change proposed | 6 (J4-2, J4-5, J5-2, J5-5, J12-4, J3-9) |

**Captures still to come:** J2, J3, J4, J7 and J10 are fully judged against the builder's captures. J5, J6, J8, J9, J11 and J12 are walked by Daisy, and the builder's captures are pending (J5 is in progress), so those journeys may still add findings.

**The dimensions** are A to H from Daisy's script. **V** means visual and **[S]** means Sharon decides the confidentiality side.

---

## J2 · One chapter, from start to certificate

| Daisy # | Ledger | Severity | Finding | Proposed fix |
|---|---|---|---|---|
| J2-1 | L-44 | **Significant** | The certificate page promises «Sertifikat Anda sedang disiapkan…» for a pass that can never certify (every demo and preview school) | The page follows the three certificate states; where none is possible, it says so and promises nothing |
| J2-2 | L-45 | **Significant** | The teacher's home says nothing awaits them while a learner is blocked waiting for their «minta lanjut» | The waiting request is the teacher's «one thing to do first», with a link to «Atur» |
| J2-3 | L-46 | **Significant** | «Siap untuk Uji Penguasaan» carries the reading map's «Mulailah dari kartu paling atas» line | «Semua pelajaran sudah dibaca.» |
| J2-4 | L-47 | Improvement | Remaining time shown in minutes: «sisa 259191 menit» | Days beyond 24 h, hours beyond 60 min |
| J2-5 | L-48 | Improvement | One verdict, two words: «Lulus» against «target tercapai» across three learner surfaces | «lulus» everywhere on certifying chapters (with L-33) |
| J2-6 | L-49 | Improvement | «perlu dipelajari lagi» against «baca lagi» for one concept | «disarankan untuk dibaca lagi» |
| J2-7 | L-50 | Improvement | The result's last three lines run together at 390 | A paragraph gap; the counts line on its own |
| J2-8 | L-51 | Improvement | Two page numbers on one lesson screen | «Buku halaman 3–8» |
| J2-9 | L-52 | Improvement | The five-step line has no labels at 390 | «Langkah 4 dari 5: Uji Penguasaan» |
| J2-10 | L-53 | Improvement | «Keluar» and the ID / EN control are styled differently on mobile and desktop | With L-41 and L-42 |
| J2-11 | L-103 | Improvement | A screen reader hears the certificate twice (the A4 preview is exposed in full) | Hide the preview's duplicate from the accessibility tree |

## J3 · The gate, the retake and the new result

| Daisy # | Ledger | Severity | Finding | Proposed fix |
|---|---|---|---|---|
| J3-1 | L-54 | **Significant** | While a retake is open (or after it ends uncounted), the learner's result page is a 404 | Show the previous result with «Uji Penguasaan ulang sedang berlangsung…» |
| J3-2 | L-55 | **Significant** | The teacher sees two result rows, with no attempt number and no mark of which is in force | «Kesempatan ke-{n}»; the current row first; earlier ones folded (widens L-43) |
| J3-3 | L-56 | **Significant** | After approval, the start page says «Tidak ada lagi yang menunggu» above the retake's «Mulai» | The approved retake is the top «Langkah berikutnya» |
| J3-4 | L-57 | **Significant** | After approval, the result and chapter pages still say «ask your teacher», with no way in | «Kesempatan berikutnya sudah disetujui.» + «Mulai Uji Penguasaan» |
| J3-5 | L-58 | **Significant** | The approver's page: «1 permintaan… menunggu» above «Tidak ada keputusan yang menunggu Anda» | Count the retake request in Bagian A |
| J3-6 | L-59 | Improvement | The chapter page after a fail says «Selesai», and the map is stale against the newer result | The map shows the result's «Baca lagi»; the panel says «Belum lulus» |
| J3-7 | L-60 | Improvement | The retake request is offered only in the «Atur» panel, not on the learner's record | «Minta satu kesempatan lagi» beside the failed result |
| J3-8 | L-61 | Improvement | One verdict, different words on the learner's own pages | With L-33 and J2-5 |
| J3-10 | L-102 | **Significant** | With the gate unreadable, the learner gets counts with no decision and no reason | «Keputusan lulus… belum dapat ditentukan sekarang. Hasil Anda tetap tersimpan…» |
| J3-11 | L-111 | Improvement | Bagian C's headings run together; the footer is misaligned | One column per class; the footer aligned (visual pass) |

## J4 · An interrupted sitting

| Daisy # | Ledger | Severity | Finding | Proposed fix |
|---|---|---|---|---|
| J4-1 | L-63 | **Significant** | A learner whose sitting the teacher ended, or whose time ran out, isn't told how it ended | «…diakhiri oleh guru Anda pada {waktu}. Jawaban yang sudah tersimpan dinilai.»; «Waktu… habis pukul {waktu}…» (ruling 96) |
| J4-3 | L-64 | Improvement | An open (or uncounted) sitting is headed «Siap untuk Uji Penguasaan» | «Uji Penguasaan sedang berjalan»; «Mulai lagi» when it starts over |
| J4-4 | L-65 | Improvement | «Sedang luring» is too formal for SD and SMP learners | «Tidak tersambung ke internet…» |
| J4-6 | L-104 | Improvement | «Akhiri tanpa menghitung» ends at once, while «Akhiri dan nilai» asks first | Both ask, each naming its effect |
| J4-7 | L-110 | Improvement | The sidebar popover opens off-screen, and its text is cut | Keep it inside the window (with L-39 to L-43) |

## J5 · A teacher's week

Partly walked; the builder's capture is in progress.

| Daisy # | Ledger | Severity | Finding | Proposed fix |
|---|---|---|---|---|
| J5-1 | L-79 | **Significant** | «Siap disediakan» for a chapter with no pass mark; «Sediakan» is offered and then refused | «Menunggu batas ketuntasan dari admin sekolah»; no button until the mark exists |
| J5-3 | L-81 | Improvement | «Langkah berikutnya» offers an Uji Cepat that can't run | Not offered until a chapter is given; the empty state links «Siapkan materi» |
| J5-4 | L-82 | Improvement | «Siapkan» still says «capaian» where D2-R changed it to «lulus» | «…bila murid lulus Uji Penguasaan…» |

## J6 · Authoring with AI drafts

| Daisy # | Ledger | Severity | Finding | Proposed fix |
|---|---|---|---|---|
| J6-1 | L-83 | Improvement | The package head says only «Perlu tindakan», and the actual step sits at the bottom | «Sekarang: Periksa isi», plus the count of drafts waiting |
| J6-2 | L-84 | Improvement | «Terima» on a draft gives no confirmation | «✓ Soal {n} diterima.», announced |
| J6-3 | L-85 | Improvement | The AI allowance is never shown before a request | «Sisa jatah AI sekolah…» (Sharon decides whether to show it) |

## J7 · A key correction after results exist

| Daisy # | Ledger | Severity | Finding | Proposed fix |
|---|---|---|---|---|
| J7-1 | L-67 | **CRITICAL** | One unwarned press keeps a now-failing certificate «Berlaku · Lulus» for outside verifiers | **CI-1** (ready, awaiting the owner): the database refuses the confirmation when the result no longer passes |
| J7-2 | L-68 | **Significant** | A certificate under review still tells its holder it's valid | The «Periksa keaslian» line follows the state |
| J7-3 | L-69 | **Significant** | The second approver is told nothing waits for them, on three of four surfaces | The correction counts as waiting everywhere |
| J7-4 | L-70 | **Significant** | The reissue panel says «tidak pernah dihitung ulang» right after a recalculation | «…penerbitan ulang tidak menghitungnya ulang.» |
| J7-5 | L-71 | Improvement | Only the school admin can raise a wrong key | «Laporkan kunci keliru» for staff who can read keys |
| J7-6 | L-72 | Improvement | The key change is shown as letters only («A → B») | «A. 54 → B. 56» |
| J7-7 | L-73 | Improvement | Step 2 explains the lost explanations in two long lines | One line |
| J7-8 | L-74 | Improvement | «target 60%» against «Belum lulus» | With L-33 |
| J7-9 | L-106 | **Significant** | After a reissue, the holder's «Lihat sertifikat» opens the old, replaced certificate | Open the chain's current end |
| J7-10 | L-105 | **HIGH** (Sharon) | A revoked or replaced certificate prints as a clean, valid-looking one, and no printed copy can be checked from the paper alone | **CI-1b:** a notice page when revoked or replaced, a fixed line under review, and the QR plus short link on every print |
| J7-11 | L-107 | Improvement | The certificate table doesn't fit at 1280, and the «Keadaan» column is cut | Fit at 1280; stacked rows below that |
| J7-12 | L-108 | Improvement | The panel is headed «CABUT SERTIFIKAT» even when it holds the reissue | «Sertifikat {nomor}» |
| J7-13 | L-109 | Improvement | The confirmation doesn't name whose certificate | «✓ Sertifikat {nomor} ({nama}) dikonfirmasi berlaku.» |

## J8 · A school year set up

| Daisy # | Ledger | Severity | Finding | Proposed fix |
|---|---|---|---|---|
| J8-1 | L-88 | Improvement | Three fields are refused only by the browser's own bubble (with J10-3, this is cause C-10) | PINTAR's own announced line by the field |
| J8-2 | L-89 | Improvement | «2026/27» against «2026/2027» | «2026/2027» everywhere |
| J8-3 | L-90 | Improvement | Confirmations pile up in separate places | Only the latest, next to what it added |
| J8-4 | L-91 | Improvement | Classes are added one per submission (about 20 for a 600-learner school) | A list in one field |
| J8-5 | L-92 | Improvement | A bare «Belum ada.» | Name what doesn't exist yet |
| J8-6 | L-93 | Improvement | «di atas» points to a different page | The link, without «di atas» |

## J9 · A promotion, then a transfer across it

| Daisy # | Ledger | Severity | Finding | Proposed fix |
|---|---|---|---|---|
| J9-1 | L-94 | **Significant** | The promotion doesn't warn that it will strand a learner's open transfer (the upstream cause of L-35) | Name each learner with an open transfer; leave them out or proceed |
| J9-2 | L-95 | Improvement | «4 naik ke 8A» is stated twice in a row | Keep one |
| J9-3 | L-96 | Improvement | «menunggu persetujuan dari pihak lain», when PINTAR knows the school | Name the school |

## J10 · Locked out

| Daisy # | Ledger | Severity | Finding | Proposed fix |
|---|---|---|---|---|
| J10-1 | L-75 | **Significant** [S] | A closed account with the right password is told the password is wrong | **Ruling 98:** the account-specific disclosure is withdrawn; the neutral line for everyone is kept (CI-2's general line) |
| J10-2 | L-76 | Improvement [S] | A learner whose PIN was reset gets «periksa keduanya» on recovery | One line for everyone (Sharon: reveals nothing) |
| J10-3 | L-77 | Improvement | A short message is held only by the browser's bubble, in English | PINTAR's own line by the field (C-10) |
| J10-4 | L-113 | **Significant** | «Komputer siapa ini?» promises a setting that learners don't have; «Komputer pribadi» on a lab computer stays signed in for 7 days | The learner gets the existing «Komputer ini» section, with no new words |
| J10-5 | L-114 | Improvement | The tour's note and the lock warning ask for an answer at the same moment | Hide the tour note while the warning shows |
| J10-6 | L-115 | Improvement | Two sign-in layouts; «Minta akun dibuka kembali» isn't a heading | One sign-in shell; a real h1 |
| J10-7 | L-116 | Improvement | /perangkat, opened from Akun saya, still says «ubah nanti di Akun saya» | Drop the sentence when opened from Akun saya |
| J10-8 | L-117 | Improvement (optional) | Three wrong PINs end with the same line as the 60-minute end | «PIN tidak cocok tiga kali…» (Sharon confirms it reveals nothing) |

**Daisy's UX side of L-112** (the builder's finding; HIGH per Sharon): the open tour stops the shared-computer lock. Daisy's three requirements go into AR-79 with it:
- show that the protection is paused;
- the lock warning sits above the tour;
- the tour closes unmarked at the lock and returns at the next sign-in.

## J11 · Reading the school

| Daisy # | Ledger | Severity | Finding | Proposed fix |
|---|---|---|---|---|
| J11-1 | L-97 | Improvement | A «—» withheld for privacy is explained as «data belum cukup» | Give each «—» its own short reason |
| J11-2 | L-98 | Improvement | «dari 10» doesn't say what it counts | «dari 10 ranah» |

## J12 · Operating PINTAR

| Daisy # | Ledger | Severity | Finding | Proposed fix |
|---|---|---|---|---|
| J12-1 | L-99 | **Significant** | The maintenance warning tells learners to sign out, and signing out then blocks their test (C-11) | The learner's banner: «Simpan jawaban Anda… Jangan keluar dari akun saat sedang mengerjakan asesmen.» |
| J12-2 | L-100 | Improvement | A red «Batalkan» sits beside a plain «Batal», with different effects | «Tutup tanpa mengubah» |
| J12-3 | L-101 | Improvement | «Mulai sekarang» cuts off people who were told 30 minutes, without saying so first | A confirmation that names the effect |

---

## Not counted, with reasons

| Item | Why |
|---|---|
| J3-9 (L-62) | Approving a retake in one press is acceptable; no change proposed |
| J4-2 | Confirms L-45 (J2-2) on a second school |
| J4-5 | Confirms L-47 (J2-4) |
| J5-2 (L-80) | Withdrawn as a world artefact (same-named publications in the test world) |
| J5-5 | Confirms L-47 and J4-3 from the teacher's side |
| J12-4 | A harness note: the tour covered the observer captures, so it isn't a product finding |

**Other checks Daisy closed as "holds", not findings:**
- the L3 lesson help (a world-data gap);
- the double-read question (retracted);
- focus opening on «Batal» before «Cabut» (the right default);
- the holder's name absent from the public check (the intended privacy boundary).
