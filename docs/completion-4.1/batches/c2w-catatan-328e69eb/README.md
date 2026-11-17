# C2w · «Catatan peninjau», B4 / B5 / B7 captures (for Daisy's screen review)

**Build:** `claude/c2w` at `328e69eb`, production build, local stack. **Taken:** 18 Nov 2026, Asia/Jakarta, `id-ID`, device scale 2.
**World:** the bootstrap school.
- One package, published. On «Pertanyaan awal nomor 1» (key A):
  - a note on B by the head of department, replaced by the administrator;
  - a 1000-character note on A.
- Three learners sat its Pemetaan Awal.
- The key was corrected A → B through the governed two-person path, which made version 2 (a new package version, `course2`).
- A note on A of version 2.

Each line of `log.tsv` gives the address and the page's horizontal overflow, plus any role="status"/"alert" text.

| File | What it shows | Daisy's reference |
|---|---|---|
| `b4-studio-tertutup-{1280,390,320}` | «Catatan peninjau (n)», closed, after «Riwayat soal» | §1, §5 |
| `b4-studio-terbuka-{1280,390,320}` | The question with both disclosures open. A: the on-screen version's note first, then version 1's under its I-5 line. B: version 1's current note with I-5, then «Catatan sebelumnya (1)» with «Diganti pada …» | §1, §3, §8.3 |
| `b4-form-ganti-{1280,390,320}` | «Ganti catatan» on A: label, the hint with §8.2's sentence, the replace hint, «Simpan catatan», «Batal» | §2, §8.2 |
| `b4-tolak-kosong-390` | An empty save: role="alert", «Tulis catatannya, 1 sampai 1000 karakter. Tidak ada yang disimpan.» | §2 |
| `b4-tersimpan-390` | A save: role="status", «✓ Catatan tersimpan.» | §2 |
| `b5-guru-{1280,390,320}` | Beside the class report, under the distribution: one note per option, «Peninjau: {nama} · {tanggal}» | §1, §3, §8.3 |
| `b7-fokus-ringkasan-1280`, `b7-fokus-setelah-tab-1280` | Real keyboard focus, :focus-visible ring on the summary, then Enter and Tab onto «Ganti catatan» | §6 |
| `b7-1000-karakter-320` | A 1000-character note at 320 px: page overflow 0, panel scroll width = client width (188/188) | §6 |
| `b7-cetak-studio.pdf` | Print media: all six notes panels on the page have display none (O-3) | §6 |

**Tab order inside the panel, keyboard only** (from `log.tsv`): «Ganti catatan · Pilihan A» → «Catatan sebelumnya (1)» → «Ganti catatan · Pilihan B» → the next question's «Riwayat soal».

**Found in the first pass and fixed before these captures** (`55c75e37` red, `328e69eb` product):
- The panel used `.pin-catatan`, the integrity note's class (Q-15), and took its look.
- One note's I-5 line sat straight under the previous note's attribution, with no space between them.

**Not captured here:**
- The author's read-only Studio view (CAN_DRAFT only). The bootstrap school's teacher has no Studio context there. C2W-B3 proves the view in the cycle school: the note is read and no form is offered.
- «anotasi»: none. C2W-K01 reads every notes string for it.
