# L1-F4: wording (Daisy, 12 Nov 2026)

> **What holds now:**
> - The line below is final for the key `akun.tinggal.galat.account_live_attachment`.
> - The «earned but not issued» wording is a draft until I see the certificate review screen.

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
