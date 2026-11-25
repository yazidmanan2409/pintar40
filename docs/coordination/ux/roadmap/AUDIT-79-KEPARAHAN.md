# Ruling 79 audit · W2: a severity for every finding (Daisy, 24 Nov 2026)

> **What holds now (reconciled 24 Nov 22:05 with Sharon's binding classifications; both observations adopted for W6's order):**
> - Every finding in `AUDIT-79-TEMUAN-J2.md` to `-J12.md` has one severity here, as of 24 Nov 22:10, including the addenda and the ledger-only lines I raised (L-86, L-87, K-1 to K-4).
> - **Where Sharon has ruled, her ruling stands** and is marked «Sharon». Where she has the call and hasn't ruled, the row says «Sharon decides» and gives my proposal.
> - The details, siblings, causes and fixes stay in each journey's TEMUAN file. This table only ranks.

## The scale

| Severity | When | Test |
|---|---|---|
| **Critical** | A person relies on something false with consequences **outside PINTAR**: a credential, a safety or confidentiality boundary, data lost | «Would someone outside the school be misled, or someone harmed, if this shipped?» |
| **Significant** | A person is **misled about their own state or task**, or **blocked from a task they must do**, with no obvious way round. Or two siblings contradict each other on the main fact of the page. Or the cause recurs across many screens. | «Would a careful user act wrongly, or stop?» |
| **Improvement** | Friction, wording, consistency, layout or accessibility polish. **The person still reaches the right outcome.** | «Would a careful user get there anyway, just less easily?» |

- An accessibility failure on a core task with no alternative path is Significant. Otherwise it is an Improvement.
- «Optional» marks an Improvement where the current words are also true.

## Counts

- **Critical (proposed):** 1 (J7-1, with Sharon). L-105 is Sharon's HIGH, now under Significant.
- **Significant:** 29 findings, reconciled with Sharon's binding classifications (ledger `aa9c2c22`).
  - Sharon's rulings: J6-4, J6-6, L-143 Significant; L-105, L-112 HIGH; L-35 Significant.
  - My proposal where Sharon decides: J10-1.
  - 2 more rows rank two **cause families** (C-10, and C-6 in EN) whose single rows stay where they are.
- **Improvement:** 76, of which 2 are optional (J8-13, J10-8).
- **Not findings:** 2 (a harness note, and a note recorded as acceptable).
- **Bob's ledger-only lines** I haven't judged myself (L-36 to L-38, and others not raised by me) aren't ranked here, except L-35, which J9 confirms.

## Critical (proposed)

| # | One line | Note |
|---|---|---|
| J7-1 | One unwarned press («Konfirmasi berlaku») keeps a certificate valid whose recalculated result now fails | Provisionally Critical (ruling 96). **Sharon decides.** The CI-1 refusal words are delivered (`CI1-KATA.md`) |

## Significant

| # | One line | Cause | Note |
|---|---|---|---|
| J2-1 | /sertifikat promises a certificate that can never be made (the evidence isn't OFFICIAL) | C-7 | |
| J2-2 / J4-2 (L-45) | The teacher's home says nothing waits while a learner is blocked waiting for them | C-4 | Evidenced in the builder's run (`e0aa6294`) |
| J2-3 | «Siap untuk Uji Penguasaan» shows the reading map's «start at the top» line | C-3 | |
| J3-1 | During a retake, the learner's earlier result is a 404 | C-2 | |
| J3-2 | After a retake, the teacher's record shows two Uji Penguasaan rows, each with its own action | C-1 | |
| J3-3 | After approval, the learner's start page says nothing waits while a retake is open | C-4 | |
| J3-4 | After approval, the result and chapter pages still say «ask your teacher» | C-3 | |
| J3-5 (L-58) | /pimpinan: «1 permintaan … menunggu» above «Tidak ada keputusan yang menunggu Anda» | C-4 | Evidenced in the builder's run |
| J3-10 | When the gate can't be read, the learner sees counts with no verdict and no reason | C-3 | |
| J4-1 | A learner whose sitting the teacher ended (or that timed out) isn't told why it ended | C-3 | |
| J5-1 | «Siap disediakan» on a chapter with no pass mark, and «Sediakan» is offered, then refused | C-3, C-7 | |
| J5-6 | The learner isn't told how long an Uji Cepat stays open; the clock counts up | C-3 | Bob: Significant |
| J6-4 (L-124) | «Tandai lolos pemeriksaan» runs the check silently and doesn't show what it found | C-3 | **Sharon: Significant** (restated after the code reading) |
| J6-6 (L-126) | The AI request log doesn't record why allowance and ceiling refusals happened | — | **Sharon: Significant** ([S]) |
| L-143 | Two steps go «Selesai» while an AI draft still waits; only «Ajukan» holds | C-3 | **Sharon: Significant.** Both marks are held, in the database too. The words for both marks are in TEMUAN-J6 |
| J7-2 | A certificate under review tells its holder it is «masih berlaku» | C-3 | |
| J7-3 | The second person is told nothing waits while a key correction waits for them | C-4 | |
| J7-4 | The reissue panel says the result was «tidak pernah dihitung ulang» right after a recalculation | C-3 | |
| J7-9 | After a reissue, the holder's «Lihat sertifikat» opens the replaced certificate | C-3 | |
| J7-10 (revoked) / L-105 | A revoked certificate prints as a clean, valid certificate | C-3 | **Sharon: HIGH (not Critical)**, fixed before the first real certificate (CI-1b). The words are in `CI1B-KATA.md` |
| J7-10 (replaced) | A replaced certificate prints as a clean certificate | C-3 | With CI-1b |
| J8-7 (L-127) | Two different children with the same name can't be entered | C-7 | Words fitted to Sharon's identity rule (`a73874d6`) |
| J8-14 / L-152 | The last admin releasing their own role is told «diubah atau diakhiri oleh admin lain»; «Lepaskan» is offered | C-9 (neighbour), C-7 | The guard exists in the database; the UX shows the wrong line |
| L-148 (restated) | Intake offers staff units as a Tempat, then refuses them with the learner line | C-7 | |
| L-154 | With «guru atau staf» ticked, the approval screen labels everyone «Murid» | C-3 | Bob and I: Significant |
| L-155 | Staff recorded via the tick are offered a class card and counted as «murid tanpa kelas» | C-3 | UX: Significant. Sharon classifies the credential side |
| J9-1 | The promotion doesn't say it will strand an open transfer (upstream of L-35) | C-4 | |
| L-35 | The receiving school can «Terima» a transfer whose origin enrolment already ended | C-7 | **Sharon: Significant**, placed in 4.5. J9 confirms it in every pass |
| J9-4 | In EN, the transfers section of /konfigurasi is wholly Indonesian, its refusal included | C-6 | Same cause as J12-5 |
| J10-1 | A closed account with the right password is told the password is wrong | C-9 | **Sharon decides** the confidentiality; CI-2's general line is the fallback |
| J10-4 (L-113) | «Komputer siapa ini?» promises a setting learners never get | C-3 | Recommendation adopted |
| L-112 | An open welcome tour stops a shared computer from locking | — | **Sharon: HIGH** (20:02Z). The UX side is given |
| J12-1 | The maintenance banner tells learners to sign out, which then blocks their test (A3 lock) | C-11 | |
| **C-10 family** (J5-8, J8-1, J8-10, J8-12, J10-3) | Required fields held only by the browser's bubble, in the browser's language | C-10 | **Each row stays an Improvement.** The family is Significant **as a cause**: five screens, screen readers may miss it, and English bubbles appear on Indonesian pages. One fix: PINTAR's own line on submit |
| **C-6 EN family** (J9-4, J9-5, J12-5) | Konfigurasi renders results and sections outside the word lookup in EN | C-6 | J9-4 is Significant on its own; the family is one fix |

## Improvement

| # | One line | Cause |
|---|---|---|
| J2-4 / J4-5 / L-47 | «sisa 259191 menit» | — |
| J2-5 | One verdict, three words on learner surfaces | C-6 |
| J2-6 | «bagian yang perlu dipelajari lagi» vs «baca lagi» | C-6 |
| J2-7 | The result's last three lines run together at 390 | — |
| J2-8 | Two page numbers on one lesson screen | — |
| J2-9 | Five unlabelled dots at 390 | — |
| J2-10 | Mobile vs desktop chrome (Keluar outline, ID/EN weight) | (K-3, K-4) |
| J2-11 | The certificate's A4 preview read in full by screen readers (a second h1) | — |
| L-86 | The verification link (J2 addendum) | — |
| L-87 | «Soal 1/3» exposed as an image | — |
| J3-6 | «Selesai» plus the map's line after a not-yet-passed result | C-3 |
| J3-7 | A retake request offered only in «Atur», not on the learner's record | C-8 |
| J3-8 | One verdict, different words (Belum lulus / belum mencapai target / …) | C-6 |
| J3-11 | /pimpinan Bagian C heads run together; the footer is misaligned | — |
| J4-3 | «Siap untuk Uji Penguasaan» on an open sitting | C-3 |
| J4-4 | «Sedang luring» | — |
| J4-6 | «Akhiri tanpa menghitung» has no confirmation | — |
| J4-7 | The sidebar popover opens off-screen | — |
| J5-2 | The home's «first thing» picks a further chapter over an empty class | C-4 |
| J5-3 | «Uji Cepat» offered to a class with no chapter | C-7 |
| J5-4 | «capaian» left on «Siapkan»'s certificate step | C-6 |
| J5-5 | «sisa … menit» and «Siap untuk» seen from the teacher's side | — |
| J5-7 | «Tambah waktu» offered on an untimed sitting, in the danger style | C-7 |
| J5-8 | «Ubah jadwal»'s reason held by the browser bubble | C-10 |
| J5-9 | One Uji Cepat, two times, two formats | C-6 |
| J5-10 | A missing link parameter answered as a permission refusal | — |
| J5-11 | The teacher gets the learner's emergency-stop page | C-6 |
| J5-12 | «Minta membaca lagi» pre-ticks the whole chapter | C-3 |
| L-134 | «Belum ada Uji Penguasaan / nilai» beside submitted sittings that don't count | C-3 |
| J6-1 | The package head doesn't name the current step | C-3 |
| J6-2 | «Terima» on an AI draft gives no line | — |
| J6-3 | The AI allowance is never shown before a request | — (Sharon decides whether it may be shown) |
| J6-5 | The rights tick is cleared after a refusal | — |
| J6-7 (L-144) | The held «Ajukan»'s reason can't be reached by keyboard or SR. The same pattern applies to every held button | — |
| J7-5 | Only the school admin can raise a wrong key | C-8 |
| J7-6 | Keys shown as letters only | — |
| J7-7 | Two long «kehilangan alasan» lines | — |
| J7-8 | «target 60%» vs «Belum lulus» | C-6 (L-33) |
| J7-11 | The certificate table doesn't fit at 1280 | — |
| J7-12 | The panel heading reads «CABUT SERTIFIKAT» while it also holds the reissue | C-6 |
| J7-13 | «Dikonfirmasi berlaku» doesn't name the certificate | — |
| J8-1 | Three fields held by the browser bubble | C-10 |
| J8-2 | «2026/27» vs «2026/2027» | C-6 |
| J8-3 | Confirmations pile up | — |
| J8-4 | Kelas added one per submission | — |
| J8-5 | A bare «Belum ada.» | — |
| J8-6 | «di atas» pointing at another page | — |
| J8-8 | Intake errors give row numbers without names; no restart | C-7 |
| J8-9 | A learner is offered for a staff role; the refusal names the wrong cause | C-9 (neighbour) |
| J8-10 | A role with no end date is held by the browser bubble | C-10 |
| J8-11 (L-131) | Counts aren't updated after the cards; each PIN shows twice | C-3 |
| J8-12 | Aturan Asesmen shows its form with no package to choose | C-7, C-10 |
| J8-15 / L-153 | The staff-page role card collapses and overlaps at 1280 | — |
| L-150 | A pass mark of 150 held only by the browser | C-10 |
| J8-13 (optional) | «Permintaan» on an immediate close | C-6 |
| J9-2 | «4 naik ke 8A» twice | — |
| J9-3 | «pihak lain» where PINTAR knows the school | — |
| J9-5 | EN: the promotion h1 untranslated | C-6 |
| J9-6 | EN: «have» / «has»; «4 up to 8A» twice | — |
| J10-2 | A school-reset PIN gets «tidak cocok» on recovery | C-9 (covered by CI-2 §3) |
| J10-3 | The reopening form's minimum length held by the browser bubble | C-10 |
| J10-5 (L-114) | The tour note and the lock warning ask at once | — |
| J10-6 (L-115) | Two sign-in layouts; /terkunci cramped; no h1 on the reopening page | C-6 |
| J10-7 (L-116) | /perangkat from Akun saya says «ubah nanti di Akun saya» | — |
| J10-8 (L-117, optional) | Three wrong PINs end with the same line as the 60-minute end | — (Sharon: a distinct line reveals nothing) |
| J11-1 | «—» legend false for privacy-withheld domains | C-6 |
| J11-2 | «dari 10» unexplained | — |
| J11-3 | Section letters differ between /pimpinan and the summary | C-6 |
| J11-4 | An empty list; inconsistent regions | — |
| J12-2 | «Batalkan» beside «Batal» | — |
| J12-3 | «Mulai sekarang» doesn't say it overrides the 30-minute warning | — |
| J12-5 | EN: the Konfigurasi results and section heading untranslated (per message: L5's are English) | C-6 |
| J12-6 | The last Admin PINTAR's row lacks «Lepaskan» with no reason | C-7 |
| J12-7 | «Lepaskan» on the button, «dicabut» in the result | C-6 |
| K-1 / L-39 | /konfigurasi chevrons not aligned | — |
| K-2 / L-40 | «Masuk sebagai» cramped on one row | — |
| K-3 / L-41 | «Keluar» indistinct from the page | — |
| K-4 / L-42 | The ID/EN control too heavy | — |
| L-43 | No attempt ordinal on the teacher's side | C-6 |
| L-33 | «Selesai · target tercapai» vs «Lulus» | C-6 |

## Not findings

| # | Why |
|---|---|
| J3-9 | Approving a retake in one press is acceptable: approval is the requested action and is audited. Recorded so it isn't reopened |
| J12-4 | Harness: the tour covered the observer captures |

## Two observations across the table

1. **Nineteen of the 29 Significant findings come from C-3 and C-4:** a page re-derives a shared fact, or «waiting for you» counts one kind only. Fixing those two causes in the shared layer, not page by page, closes most of the Significant column.
2. **Certificates hold the Critical row and five Significant ones** (J7-2, J7-4, J7-9, J7-10 replaced). The certificate is the one output that leaves PINTAR, so these come first in AR-79's order whatever the count.
