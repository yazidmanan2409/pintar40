# X-1 · Using your own AI to prepare content for PINTAR: guide and sample prompts (DRAFT)

**Bob's draft, 16 November 2026, for Daisy (the Indonesian, the teacher's voice and the final form) and Sharon (the
data warning). Ruling 41; `docs/completion-4.1/EXTERNAL-AI-CONTENT-ASSESSMENT.md` X-1.** No product change. Not for
schools until Daisy and Sharon have passed it.

- **The prompts are in Indonesian,** because a teacher copies them into their AI as they stand.
- **Everything else here is the brief for Daisy,** who writes the teacher-facing text.
- **The column headers are copied exactly** from the workbook's contract (`src/lib/unggah-kontrak.ts`, `KOLOM`), since
  the importer matches them by name. If the contract changes, this guide changes with it.

## 1 · What the guide tells teachers (brief for Daisy)

1. **You may use any AI you already have** (Claude, ChatGPT, Gemini, Qwen, DeepSeek or another) to draft lessons and
   questions for PINTAR. PINTAR charges nothing extra for content you import this way, and does not need your AI's
   password or key.
2. **Before you start: what never goes into an AI.** *(Sharon to review.)*
   - **No learner's name, PINTAR ID, class list, photo, answers, scores or reports.** Not even one.
   - No other teacher's or the school's private data.
   - Only material you have the right to use: your own, the school's, or material whose licence allows it.
   - What you paste into an outside AI is handled by that AI's company under its own terms. PINTAR cannot see it or
     take it back.
3. **The steps:**
   1. In Studio › Unggah, download the **PINTAR workbook** («Unduh templat») and, if you like, the filled example.
   2. Copy one of the prompts below into your AI, and add your material where it says so.
   3. Your AI answers with one table per sheet. Copy each table into the matching sheet of the workbook, starting at
      row 2 (row 1 already holds the headers).
   4. Upload the workbook in Studio. PINTAR checks every row. If something is wrong, it names the sheet, the row and
      the problem, and saves nothing. Fix that row and upload again.
   5. The imported content is a **draft**, like anything you write yourself. Read every question and its answer key,
      correct what is wrong, then submit it for review. A second educator reviews it before it can be published.
4. **You are the author.** The AI only drafts. Check especially that each question has exactly one correct answer and
   that the key is right. A wrong key is the most serious mistake a question can have.
5. **If your AI can make an Excel file itself,** you may ask it to fill the workbook directly. Pasting the tables
   works with every AI.
6. **PINTAR does not support or troubleshoot outside AI services,** their accounts or their charges.

## 2 · Prompt A: a chapter with its lessons and questions (DRAFT; Daisy finalises)

```text
Anda membantu seorang guru menyiapkan isi pelajaran untuk PINTAR. Gunakan HANYA materi di bawah. Jangan
menambahkan nama orang sungguhan, dan jangan menyebut murid mana pun.

Mata pelajaran: [isi]   Jenjang: [SD/SMP/SMA]   Kelas: [isi]   Judul kursus: [isi]
Tujuan pembelajaran: [isi]
Banyak soal pilihan ganda per pelajaran: [misalnya 5]

MATERI:
[tempel materi Anda di sini]

Buat jawaban sebagai LIMA tabel, masing-masing berjudul nama lembarnya, dengan kolom dipisah TAB dan baris pertama
berisi judul kolom PERSIS seperti ini:

Lembar Kursus:    Judul kursus | Mata pelajaran | Jenjang | Kelas | Konteks
Lembar Bab:       No bab | Judul bab
Lembar Pelajaran: No bab | No pelajaran | Judul pelajaran | Ringkasan | Isi pelajaran | Tujuan pembelajaran | Tingkat berpikir | Media | Transkrip
Lembar Soal:      Kode soal | No bab | No pelajaran | Jenis soal | Pertanyaan | Bacaan | Petunjuk | Kegunaan | Tingkat kesulitan | Kelompok paralel | Identitas soal
Lembar Pilihan:   Kode soal | Pilihan | Teks pilihan | Benar | Alasan | Kode miskonsepsi

Aturan:
- Satu baris Kursus. Konteks, Media, Transkrip, Kelompok paralel, Identitas soal dan Kode miskonsepsi dikosongkan.
- No bab dan No pelajaran berupa angka 1, 2, 3 …, tidak kembar.
- Isi pelajaran ditulis untuk murid, dalam bahasa Indonesia yang baku dan sesuai kelasnya.
- Teks yang lebih dari satu baris (misalnya Isi pelajaran) ditulis di dalam tanda kutip ganda "…", supaya tetap satu sel.
- Tingkat berpikir: salah satu dari Mengingat, Memahami, Menerapkan, Menganalisis, Mengevaluasi, Mencipta.
- Jenis soal dikosongkan (artinya pilihan ganda dengan satu jawaban benar).
- Kode soal: S1, S2, S3 …, tidak kembar, dan dipakai lagi di lembar Pilihan.
- Kegunaan: kosong (Latihan), "Pemetaan awal" atau "Cek penguasaan".
- Tingkat kesulitan: Mudah, Sedang atau Sulit.
- Petunjuk boleh membantu berpikir, tetapi tidak boleh menyebut jawabannya.
- Setiap soal punya 4 pilihan berlabel A, B, C, D. TEPAT SATU pilihan berisi "Ya" di kolom Benar; yang lain "Tidak".
- Setiap pilihan WAJIB punya Alasan: mengapa pilihan itu benar, atau kesalahan berpikir apa yang membuatnya salah.
- Pilihan yang salah harus masuk akal bagi murid yang keliru, bukan asal salah.
- Jangan menulis apa pun di luar lima tabel itu.
```

## 3 · Prompt B: questions only, for a lesson already in your workbook (DRAFT)

```text
Anda membantu seorang guru membuat soal pilihan ganda untuk PINTAR. Gunakan HANYA materi di bawah. Jangan
menambahkan nama orang sungguhan, dan jangan menyebut murid mana pun.

Kelas: [isi]   No bab: [angka]   No pelajaran: [angka]   Kode soal mulai dari: [misalnya S11]
Tujuan pembelajaran: [isi]   Banyak soal: [misalnya 10]   Tingkat kesulitan: [Mudah/Sedang/Sulit]

MATERI:
[tempel materi pelajaran di sini]

Buat jawaban sebagai DUA tabel, dengan kolom dipisah TAB dan baris pertama berisi judul kolom PERSIS seperti ini:

Lembar Soal:    Kode soal | No bab | No pelajaran | Jenis soal | Pertanyaan | Bacaan | Petunjuk | Kegunaan | Tingkat kesulitan | Kelompok paralel | Identitas soal
Lembar Pilihan: Kode soal | Pilihan | Teks pilihan | Benar | Alasan | Kode miskonsepsi

[the same rules as Prompt A, from "Jenis soal dikosongkan" onward]
```

**A limit to state plainly (X-3):** the workbook imports a whole course. Prompt B's questions go into a workbook for
a new course, or into the next version of an existing one. Adding questions straight into an existing lesson is a
4.2 candidate (X-3). Until then, teachers can also type them into Studio's question editor.

## 4 · Before uploading: a short checklist (brief for Daisy)

- No learner's name or PINTAR ID anywhere, including in examples and word problems that name a real child.
- Every question has exactly one "Ya".
- Every option has a reason.
- The question codes in «Pilihan» match those in «Soal».
- The chapter and lesson numbers in «Soal» exist in «Pelajaran».

## 5 · When PINTAR reports a problem (brief for Daisy)

The importer names each problem by sheet and row and saves nothing until all are fixed. Map the commonest messages
to a plain next step. Second Eye can list the codes most likely from AI output, for example:
- a missing reason;
- two correct options, or none;
- an unknown chapter number;
- a label other than A–E;
- a value not in a list.

## 6 · For the walkthrough (owner, 16 Nov)

Observe, without helping unless asked:
- how long steps 2–4 take;
- whether moving the tables into Excel needs help;
- which validation messages appear.

That is the evidence for X-2 (a paste-friendly route) in 4.2.

## 7 · Open points for the reviewers

| # | For | Point |
|---|---|---|
| 1 | Daisy | The teacher-facing text in Indonesian, from §1, §4 and §5; the prompts' wording; where the guide lives (a page in `docs/onboarding/`, a printable PDF, or both) |
| 2 | Sharon | §1 step 2's data warning: complete and enforceable as guidance? Should the checklist name more identifiers (NISN, phone numbers, addresses)? |
| 3 | Both | Whether word problems may use common first names, which PINTAR itself cannot tell apart from learners (the same question as R-3's matching rule) |
| 5 | Second Eye | **Test the paste once, offline:** a multi-line «Isi pelajaran» in double quotes pasted into the template, then uploaded to a local stack, survives as one cell. If not, the prompt's rule changes, and that is early evidence for X-2 |
| 4 | Second Eye | Confirm the headers above against the contract at the A2b freeze; list the validation codes most likely from AI output, for §5 |
