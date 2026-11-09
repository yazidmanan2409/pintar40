# Learner wording after the owner's ruling (Daisy, 9 Nov 2026)

**Commit reviewed:** `claude/awesome-rubin-bqxp6p` at exactly **`abce834d`**. I only read that branch.

**The ruling:**
- learners never see «disegel»;
- the «Anda» register throughout;
- English «students» for pupils, «participants» for PD, and «learner» only for the account role.

**Evidence:** `verifikasi-abce834d/`. The screenshots are `layar/<page>-<language>-<width>.jpg`; `teks.json` holds each page's text.

## How this was verified

1. The stack was rebuilt from nothing (`supabase db reset`), then `laporan-lokal.mjs`, `next build` and `next start -p 3999`.
2. **Two real recalculations** (`alat/vD14.sql`, with the `\gset` fix; local only). For learner `lap-5b-13`, after a corrected key, a platform SYSTEM_ADMIN ran `recompute_result` on:
   - her Bab 2 Uji Penguasaan, sealed 0% → 12.5%;
   - her Pemetaan Awal, sealed 0% → 25%.

   Both re-scored `per_domain`.
3. **Captured** (`alat/vO.mjs`):
   - her chapter result, «Hasil belajar» and reading map, in Indonesian and English, at 1280 and 390 px;
   - the English Ringkasan Kelas 5B and 5C and «Lihat bukti» 5B (Guru), Pimpinan (Dekan) and Ringkasan Sekolah (Admin sekolah), at 1280 px.

## Answers

| # | Item | Answer |
|---|---|---|
| 1 | The recalculated chapter result | **Confirmed**, both languages, 1280 and 390 px |
| 2 | The recalculated Pemetaan Awal's reading map | **Confirmed**, both languages, 1280 and 390 px |
| 3 | English | **Confirmed** |
| 4 | Can a Grade 5 learner tell, without a technical word? | **Yes** |

## 1. The chapter result

`murid-bab-uji-id-1280`, `-390`; `-en-…`

**The card**, under «Penguasaan 0% · Terjawab tepat 0 dari 8 soal», reads «Hasil ini kemudian dihitung ulang. Penguasaan dan jumlah jawaban tepat di atas, serta sertifikat Anda, tetap seperti semula; laporan guru dapat menampilkan hasil yang dihitung ulang.»

**Under «Tinjau kembali»**, above question 1: «Tanda «Sudah tepat» dan «Belum tepat» pada soal-soal di bawah mengikuti jawaban benar yang sudah diperbaiki, jadi bisa berbeda dari hasil di atas (0 dari 8 soal tepat). Hasil di atas dan sertifikat Anda tetap seperti semula.»

The same words appear at both widths. The sealed count shown in the review note («0 dari 8») matches the card.

## 2. The reading map

`murid-peta-id-…`, `-en-…`

Before the first card: «Peta ini mengikuti jawaban benar yang sudah diperbaiki, jadi bisa berbeda dari hasil Pemetaan Awal Anda. Hasil Pemetaan Awal Anda tetap seperti semula.»

## 3. English

**The learner notes:**
- «…and your certificate, stay as they were; your teacher's reports may show the recalculated result.»
- «…follow the corrected answers, so they can differ from the result above (0 of 8 questions right). The result above and your certificate stay as they were.»
- «Your Initial Mapping result stays as it was.»

«sealed» and «disegel» appear **0 times** across all 16 learner views.

**The reports:** in the English report pages, «learner(s)» appears **0 times** and «students» 10–27 times per page, including «Lihat bukti»'s status cards, which said «1 learners» on `e8a5efb9`. PD pages were not in this capture, so «participants» was not checked.

## 4. Can a Grade 5 learner now tell?

**Yes.** Each of the three notes says, in everyday words, what changed («jawaban benar yang sudah diperbaiki») and what did not («tetap seperti semula»), and names the result and the certificate. No technical word is left: «dihitung ulang» is plain Indonesian. The order also helps: the unchanged result first, the note at the boundary, then the corrected badges.

**One observation, not a finding:** the learner is not told *why* the result was recalculated; only the teacher's note gives the reason. That matches the ruling. If a learner asks, the teacher's page has the answer.

## Not seen

- **Staging.**
- **NVDA / TalkBack.**
- **A4 print.**
- **PD pages** (the English «participants»).
- **The owner's acceptance.**
