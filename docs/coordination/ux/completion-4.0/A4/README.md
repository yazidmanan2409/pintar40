# A4 · Batch 3 wordings awaiting approval: B2, B5, C2, C3, C5, C7, C9, D7

**Form T (copy table, per key).** Register entry A4 (`batch-3/02:10`, `batch-3/05:150`).
**Source:** the words in `src/lib/hle.ts` at 0b19707, as engineering wrote them (`batch-3/02:24-60`).
**Decides:** D, except where a row is marked **G** (Dr Gladys).

**Each row is marked:**
- **CONFIRM:** approved as written;
- **CORRECT:** the approved words follow;
- **G:** the word is Dr Gladys's, or the change touches every school's template; she confirms.

No row changes behaviour; every answer is copy only. «Paket» follows Terminology v1, whose English is «Learning Package» / «package» (`studio.paket.judul`).

---

## B2 · The per-step result words (`LangkahTerbit`)

| Key | Indonesian | English | Verdict |
|---|---|---|---|
| `studio.langkah.keadaan.selesai` | Selesai | Done | **CONFIRM.** The step's own name already says what was done («Susun isi · Selesai»). A participle per step would add six words that say the same thing. «✓ Diterbitkan» stays the one step with its own word (J1Terbit, approved). |
| `studio.langkah.selesai.terbitkan` | Diterbitkan | Published | **CONFIRM** (already approved) |

## B5 · Send-back and history

The Indonesian is confirmed throughout. **The English says «course» where the product says «package»: corrected.**

| Key | Indonesian | English | Verdict |
|---|---|---|---|
| `studio.kembali.tombol` | Kembalikan ke penyusun | Send back to the author | CONFIRM |
| `studio.kembali.judul` | Kembalikan paket ini ke penyusun? | **Send this package back to its author?** | CORRECT (en) |
| `studio.kembali.arti` | (unchanged) | **«The package goes back to …»** («course» → «package» throughout) | CORRECT (en) |
| `studio.kembali.alasan`, `.alasan_arti`, `.batal`, `.alasan_dari` | Alasan · Tulis apa yang perlu diperbaiki, 10 sampai 1000 karakter. · Batal · Alasan peninjau | Reason · Write what needs correcting, in 10 to 1000 characters. · Cancel · The reviewer's reason | CONFIRM |
| `studio.kembali.jalan_unggah` | (unchanged) | («course» → «package» wherever it appears) | CORRECT (en) where it applies |
| `tombol.mengembalikan` | Mengembalikan… | Sending back… | CONFIRM |
| `galat.sent_back` | Paket ini dikembalikan ke penyusun beserta alasan Anda. | **This package was sent back to its author with your reason.** | CORRECT (en) |
| `galat.sendback_not_reviewer` | (unchanged) | **Sending a package back to its author is not yours to do in this school.** | CORRECT (en) |
| `galat.sendback_not_in_review` | (unchanged) | **This package is no longer at the Approve the content step, …** | CORRECT (en) |
| `galat.sendback_reviewer_is_author` | Anda menyusun paket ini, jadi yang mengembalikannya harus orang lain. | **You wrote this package, so someone else sends it back.** | CORRECT (en) |
| `galat.sendback_reason_missing` | Tulis alasannya, 10 sampai 1000 karakter. | Write the reason, in 10 to 1000 characters. | CONFIRM |
| `studio.paket.riwayat.disetujui` / `.dikembalikan` | Disetujui · Dikembalikan ke penyusun | Approved · Sent back to the author | CONFIRM |

## C2 · Grouped findings (`TemuanKelompok`)

| Key | Indonesian | English | Verdict |
|---|---|---|---|
| `studio.temuan.kelompok.jumlah` | temuan | findings | CONFIRM |
| `studio.temuan.kelompok.lokasi` | Lihat lokasinya | See where | CONFIRM |
| `studio.temuan.mengapa`, `.cara`, `.lokasi` | Mengapa penting · Cara memperbaiki · Lokasi | Why it matters · How to fix it · Where | CONFIRM |
| `studio.temuan.akui` / `.akui_semua` | Sudah saya tinjau · Sudah saya tinjau semuanya | I have reviewed this · I have reviewed all of these | CONFIRM |
| `studio.temuan.perbaiki_dulu` | Temuan ini diperbaiki di isinya, lalu pemeriksaan dijalankan lagi; tidak bisa sekadar diakui. | These are fixed in the content and the check run again; they cannot just be acknowledged. | CONFIRM |
| `galat.findings_acknowledged` | **Temuan sejenis sudah ditinjau sekaligus. Jumlahnya:** (was «… sudah diakui sekaligus …») | **Findings of this kind are marked reviewed together. Count:** | **CORRECT.** The result echoes the button the person pressed («Sudah saya tinjau semuanya»): the same verb. |

## C3 · Aturan Asesmen (`/studio/definisi`)

| Key | Indonesian | English | Verdict |
|---|---|---|---|
| `studio.definisi.wajib` | Semua isian wajib diisi, kecuali yang bertanda (opsional). | Every field is required except those marked (optional). | CONFIRM (FormLayout's rule, said once at the top) |
| `studio.definisi.opsional` | (opsional) | (optional) | **CONFIRM, as the one shared key** for every optional field in the product; D7's «(opsional)» is this key |
| `studio.definisi.f.tenggang_menit` | Tenggang kirim (menit) | **Late-submission grace (minutes)** | CORRECT (en): «Send grace» doesn't read as English |
| `studio.definisi.f.ragu` | Jendela ragu (detik) | Hesitation window (seconds) | CONFIRM |
| the legends and the other fields (`.f.keselamatan`, `.f.percobaan`, `.f.acak`, `.f.selama`, `.f.komposisi`, `.f.jeda`, `.f.luring`, `.batas`) | as written | as written | CONFIRM |
| the hints (`studio.definisi.petunjuk.jumlah`, `.keselamatan`, `.tenggang`, `.percobaan`, `.komposisi`, `.jeda`, `.luring`) | as written | as written | CONFIRM |
| `studio.definisi.petunjuk.ragu` | Kosongkan bila arah berpikir tidak ditawarkan. Bila diisi: … murid ditawari arah berpikir; … | Leave empty if no direction to think in is offered. … | **G.** «Arah berpikir» is the learner cycle's existing term (`siklus.bisa.arah`, `assist.*`), used here unchanged, which is right: one name for one thing. Because it is her term, **Dr Gladys confirms its use in a teacher-facing hint.** |

## C5 · The filled example (`PanelUnggah`)

| Key | Indonesian | English | Verdict |
|---|---|---|---|
| `studio.unggah.contoh` | Unduh contoh isian | **Download a filled-in example** | CONFIRM (id); CORRECT (en) |
| `studio.unggah.contoh_arti` | Templat yang sama, sudah terisi satu bab contoh … bukan materi sekolah dan bukan soal yang dikerjakan murid. | (as written) | CONFIRM |
| **The place** | a second button row under the template, with its sentence | — | **CONFIRM**: next to the template it fills in; the template stays the first and primary download |

## C7 · The count unit (`kanonik/[terbitan]`)

| Key | Indonesian | English | Verdict |
|---|---|---|---|
| `studio.kanonik.unit.tujuan` | tujuan pembelajaran | learning objectives | **CONFIRM.** It is the same term as `hasil.domain` «Per tujuan pembelajaran»: one name for one thing. |

## C9 · «Kursus», the workbook sheet

| Key / item | Indonesian | English | Verdict |
|---|---|---|---|
| **The sheet's name «Kursus»** | — | — | **G, and not changed here.** Renaming it changes every school's template and every workbook already filled in (a contract change, `unggah-kontrak.ts`), so it is not decided by wording. Recommendation, for Dr Gladys and the owner: **rename only with the next template version**, never in place. |
| `studio.templat.cara.1` | **Satu buku kerja berisi satu paket. Isi lima lembar berikutnya: Kursus (keterangan paket), Bab, Pelajaran, Soal, dan Pilihan.** | **One workbook holds one package. Fill in the next five sheets: Kursus (the package's details), Bab, Pelajaran, Soal and Pilihan.** | **CORRECT.** The sentence says «paket», as the screens do. The sheet keeps its name until G, and is explained in place, so the two words don't seem to be two things. |
| `studio.templat.batas.kursus` | **Paket** | **Packages** | CORRECT: the limit counts packages per workbook, in the product's word |

## D7 · The Mengajar words

| Key | Indonesian | English | Verdict |
|---|---|---|---|
| `studio.definisi.opsional` | (opsional) | (optional) | CONFIRM (C3; the one shared key) |
| `mengajar.cepat.hasil.rincian` | Rincian nilai | Score by person | CONFIRM |
| `mengajar.cepat.hasil.kelas` | **Rata-rata nilai kelas** | **Class average score** | **CORRECT, as accepted in A2** (owner, 4 Nov) |
| `mengajar.cepat.hasil.nilai_belum` | Belum ada nilai | No score yet | CONFIRM |
| `mengajar.ulang.selesai` | Terkirim | Sent | CONFIRM: the «Minta membaca lagi» request has gone to the learners |
| `mengajar.sedia.selesai` | Disediakan | Made available | CONFIRM: J1 step 7's word |

## Decisions it depends on

- **G (Dr Gladys):**
  - C3's use of «arah berpikir» in a teacher's hint;
  - C9, the sheet's name, which also needs the owner because it changes every school's template.
- Nothing else waits.

## Acceptance checklist

- [auto] The keys above read exactly as approved in `hle.ts`, in both languages.
- [auto] No English string for these keys says «course» where the Indonesian says «paket».
- [auto] «(opsional)» comes from one key wherever an optional field is marked.
- [auto] The findings' result and its button use the same verb («tinjau»).
- [manual] Dr Gladys's confirmations for C3's hint and C9's sheet name recorded.
