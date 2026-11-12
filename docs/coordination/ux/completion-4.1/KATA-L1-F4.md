# L1-F4: wording (Daisy, 12 Nov 2026)

> **What holds now (12 Nov, later):**
> - **§1 is final:** `account_live_attachment`.
> - **§3 is final (new, 12 Nov):** the refused reopen of an anonymised person.
> - **«Earned but not issued» is superseded** by the shorter cell line in `TINJAUAN-F1R1B-97a40ebb.md` §2.1 (built at `3a63a2b2`). It sits in the impact table's «Sertifikat» column, not on a certificate review screen.
> - ~~The line below is final for the key `akun.tinggal.galat.account_live_attachment`.~~ ~~The «earned but not issued» wording is a draft until I see the certificate review screen.~~ (superseded by the lines above)

**Brief:** `docs/completion-4.1/ANONYMISED-PERSON-IS-TERMINAL.md` on `claude/bob-41-master-plan` at `533a38d7deb88657be28a34846728b36aa43b95f`, §3a point 3, and §0 item 6.

This is not a review visit.

## 1 · The deletion refused because of a live attachment

**Where:** Konfigurasi › Keamanan, the platform admin's account requests, beside the existing refusals of «Hapus data pribadi».

**Key:** `akun.tinggal.galat.account_live_attachment`

| | |
|---|---|
| **ID** | Data pribadi tidak dihapus: orang ini masih memegang pendaftaran, peran, atau keterkaitan lain yang berlaku di sebuah sekolah. Tidak ada yang diubah, dan permintaannya tetap terbuka. Tanyakan kepada sekolah itu apakah keterkaitan tersebut memang harus diakhiri; setelah diakhiri, tekan «Hapus data pribadi» sekali lagi. |
| **EN** | Personal data was not deleted: this person still holds an enrolment, role or other attachment in force at a school. Nothing was changed, and the request stays open. Ask that school whether the attachment should end; once it has ended, press «Delete personal data» once more. |

**Why it is worded this way:**
- **It says what was refused, that nothing changed, and what to do next,** in that order, like `account_photo_pending` and `account_not_closed`.
- **The next step is to ask, not to end the attachment.** This refusal fires when someone gained an enrolment or role after the account was closed. That may mean the person has returned to a school. The platform admin should not end a school's enrolment as bookkeeping to make a deletion go through. The brief prefers refusing because it preserves evidence, and the wording keeps that choice with the school.
- **No school is named in the key.** It holds no placeholder, so the line stays correct whatever the attachment is.
  - If the engineer can cheaply give the school's name, the platform admin may see it. Then use: «… di {sekolah}. … Tanyakan kepada {sekolah} …» / «… at {sekolah}. … Ask {sekolah} …».
  - Either form is acceptable. Do not name the kind of attachment unless it is certain.
- **The register matches the existing refusals:** «Anda» is unused because the subject is the person; no codes; «Admin PINTAR» is not needed here.

## 2 · «Earned but not issued» (§0 item 6, Option A): **draft; I want to see the screen first**

> **Superseded 12 Nov.** The cell line «Memenuhi syarat, tidak diterbitkan: data pribadi sudah dihapus» / «Requirements met; not issued: personal data deleted» replaces this draft (`TINJAUAN-F1R1B-97a40ebb.md` §2.1; built at `3a63a2b2158ea4834c1f12653c864baf157c0dd5`). Kept as a record.

What the reader must understand:
- the corrected result earns a certificate;
- PINTAR did not issue one, because the person's personal data has been deleted;
- nothing is missing or broken.

The line must not be read as a pending issue someone should fix.

**Draft, for the review's outcome:**

| | |
|---|---|
| **ID** | Memenuhi syarat sertifikat setelah koreksi kunci, tetapi tidak diterbitkan: data pribadi orang ini sudah dihapus. |
| **EN** | Met the certificate's requirements after the key correction, but not issued: this person's personal data has been deleted. |

**To settle on the screen:**
- whether it sits in the review's outcome column, or as a status beside the result;
- whether the screen already shows «PINTAR ID» in place of a name (then «orang ini» is enough);
- that no action, such as «Terbitkan», is offered on that row.

**Send me a screenshot or the commit with the screen, and I will confirm or adjust the line in one reply.**

## 3 · A reopen refused because the person's personal data has been deleted (12 Nov; L1F4-A2)

**Source:** Bob's request, with context in `ANONYMISED-PERSON-IS-TERMINAL.md` §0 item 11 at `9f616a58d7cd689548228ce99e1f21934f4e7224`.

**The situation:** a platform admin approves a reopen request (Konfigurasi › Keamanan, beside the other account refusals) for a person whose personal data has already been deleted. It is refused, and nothing is changed.

**Suggested key:** `akun.tinggal.galat.account_anonymised`; the engineer may name it.

| | |
|---|---|
| **ID** | «Akun ini tidak dapat dibuka kembali: data pribadi pemiliknya sudah dihapus. Tidak ada yang diubah. Bila orang ini ingin memakai PINTAR lagi, ia didaftarkan sebagai orang baru.» |
| **EN** | «This account cannot be reopened: its owner's personal data has been deleted. Nothing was changed. If this person wants to use PINTAR again, they are registered as a new person.» |

**Why it is worded this way:**
- **The family's order:** what was refused and why, then that nothing changed, then the next step. It matches `cert_holder_deleted` and `account_live_attachment`.
- **«pemiliknya» (its owner)** is the same word the certificate line uses.
- **The next step is the owner's principle,** said plainly: a returning person gets a new identity (§0 item 1). It names no actor, because who registers them (a school, or the platform admin) depends on the person.
- **Nothing about the deleted record:** no name, no date of deletion. The admin needs only to know that the account cannot come back and what to do instead.
