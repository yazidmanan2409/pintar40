# Tester report form (D-037 step 1, staging tests from 28 Sep)

Chosen by Yazid on 27 Sep: a **Google Form**, so testers need no claude.ai account. Yazid builds the form from this page and shares its link with Gladys's team. Once a day he downloads the responses as a CSV (Responses → ⋮ → Download responses) and uploads it to the coordinator. The coordinator sorts every report within one working day, either into a BOARD ticket or with an answer. Chat is only for "I am stuck right now".

The wording matches what testers see in PINTAR: "Kode rujukan" is the label on PINTAR's error page, and the roles are named as in D-037.

## Form

**Title:** Laporan Uji PINTAR (staging)

**Description:**
> Untuk tim penguji PINTAR di https://staging.pintarselalu.com. Satu laporan untuk satu masalah.
> Gunakan hanya data uji: jangan masukkan nama, nomor, atau foto murid dan guru yang sebenarnya.
> Jika Anda terhenti dan sama sekali tidak bisa melanjutkan, kirim juga pesan singkat lewat chat.

| # | Question | Type | Required | Options, help text |
|---|---|---|---|---|
| 1 | Nama Anda | Short answer | Yes | |
| 2 | Peran yang Anda gunakan saat masalah terjadi | Multiple choice | Yes | Admin platform · Admin sekolah · Guru · Kepala departemen · Dekan · Murid (kartu kelas) · Lainnya |
| 3 | Sekolah | Multiple choice | Yes | SD Zayd Pintar Selalu · SMA Zayd Pintar Selalu · Tidak terkait sekolah tertentu |
| 4 | Alamat halaman | Short answer | Yes | Help: "Salin dari bilah alamat browser." Response validation: Text → Contains → `staging.pintarselalu.com`; error text: "Tempel alamat halaman PINTAR staging." |
| 5 | Apa yang Anda lakukan? | Paragraph | Yes | Help: "Langkah demi langkah, misalnya: Studio → Unggah → pilih file → Periksa buku kerja." |
| 6 | Apa yang Anda harapkan terjadi? | Paragraph | Yes | |
| 7 | Apa yang sebenarnya terjadi? | Paragraph | Yes | Help: "Tulis pesan di layar persis seperti yang tertulis." |
| 8 | Kode rujukan | Short answer | No | Help: "Jika halaman menampilkan Kode rujukan, salin kodenya di sini." |
| 9 | Seberapa mengganggu? | Multiple choice | Yes | Saya terhenti dan tidak bisa melanjutkan · Bisa lanjut, tetapi hasilnya salah · Tampilan atau kata-katanya kurang tepat · Saran perbaikan |
| 10 | Tangkapan layar | File upload | No | Images only; up to 3 files, 10 MB each |
| 11 | Perangkat dan browser | Short answer | No | Help: "Misalnya: laptop, Chrome; atau HP Android, Chrome." |

The form records the date and time of each response automatically.

**Before sharing it:**
- **File uploads need a Google sign-in.** With question 10 in the form, Google asks every respondent to sign in to Google, and the files are saved in the form owner's Drive. If testers must be able to report without a Google account, leave question 10 out and ask them to send screenshots by chat, quoting the report's time.
- **Responses:** link the form to a response sheet, so there is one list to export each day.

## How reports are sorted (coordinator)

- **"Saya terhenti":** answered the same school day (WIB), per D-037.
- **Everything else:** answered within one school day.
- **Defects** become or extend BOB or DAISY tickets on the board, naming the report's time and reporter.
- **How-to questions** are answered back through Yazid or Gladys's team.
- **Duplicates** are linked to the first report.
