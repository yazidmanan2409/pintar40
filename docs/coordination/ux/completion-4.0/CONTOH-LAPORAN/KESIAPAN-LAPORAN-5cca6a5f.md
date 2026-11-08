# Design re-verification: owner decisions 1 and 3, the content-check refusal, and every report (Daisy, 9 Nov 2026)

**Commit reviewed:** `claude/awesome-rubin-bqxp6p` at **`5cca6a5f`**. I only read that branch; this report is on `ux-1/daisy-experience`.

**Compared against:**
- D-195 and D-196;
- `KESETIAAN.md` (rows #1–#28, X5);
- the report grammar G-01 … G-06;
- VI-4 and the C1 composition;
- S-3.

**Evidence:** `verifikasi-5cca6a5f/`. Screenshot names below refer to its files. Each name ends in `-1280`, `-390` or `-320`; a name without a width covers all three.

## How this was verified

**The local report world, built as Second Eye described:**
1. `npx supabase db reset` on the commit, all 202 migrations.
2. `audit/fixtures/laporan-lokal.mjs`.
3. `next build`, then `next start -p 3999`.
4. `audit/laporan-jalan.mjs`: **84 page views, all HTTP 200, none scrolls sideways** (`laporan/`, with `laporan-jalan.json` holding each page's text).

The fixture draws its answers at random, so this world's figures are not those in matrix §3:
- 107 sittings instead of 104;
- 5B: 2 Mantap, 8 Berkembang, 12 Perlu penguatan;
- Kenaikan +17.

**I judged design, not numbers.** Second Eye's independent count stands for its own run.

**Second Eye's `audit/siap-jalan.mjs`, on this build:** 7/10 PASS, 2 NOT EXERCISED, 1 FAIL (R9; see item 3). `keputusan/siap-jalan-ringkasan.json`.

**My own walks** (`alat/vD.mjs` for decisions 1 and 3, `alat/vR9.mjs` for the refusal):
- Signed in as the world's Admin sekolah, Guru, Kepala departemen and a learner, at 1280, 390 and 320 px.
- Pressed «Masukkan ke kelas» once, at 390 px.
- Pressed «Tandai lolos pemeriksaan» on R9's package at each width.

**Local fixtures I added (synthetic, local only):**
- **Studio:** four packages in the demonstration school, authored by the Guru, at STRUCTURED, VALIDATED, IN_REVIEW and APPROVED with no release. Their states were **set by SQL with triggers off**; they were not reached through Studio's steps.
- **Two classless learners,** each with a registration number and no account. The school's empty namespace was set to «SCN» for this, as R8 does.
- **A learner with an account and no class:** one 5E learner whose placement I closed.

## Verdicts

| # | Item | Verdict |
|---|---|---|
| 1 | Decision 1: placing a learner without a class, and the learner's message | **NOT READY: one condition (F5)** |
| 2 | Decision 3: Studio counts and their lists (Guru, Kepala departemen, Admin sekolah) | **READY** |
| 3 | Content-check refusal | **READY** (design). R9's FAIL is a capture taken before the action returned (see item 3) |
| 4 | Reports, as their readers | **NOT READY: F1–F4 below, with V1 and V2.** Per report in §4 |

**Must fix before the walkthrough.** All are small: a join, a prefix, a legend, a cap or a condition.

| # | Finding | Where (screenshots) | Smallest correction |
|---|---|---|---|
| **F1** | **R5 does not reach section E.** «Pelajari lagi: …sehari-hari., Kalian dapat…», under every one of 12 names. `KomposisiKelas.tsx:389` joins with `o.ulang.join(", ")` | `laporan/guru-ringkasan-5B` | Use `daftarKata` there. It also gives «dan» before the last item (G-01) |
| **F2** | **R7 does not reach the chapter result page.** The eyebrow reads «MATEMATIKA · MATEMATIKA KELAS 5 · BAB 1: POLA BILANGAN» | `laporan/murid-hasil-bab` | Apply R7's rule to `/belajar/[t]/hasil` |
| **F3** | **The Dekan's grid explains marks it does not draw.** With no target readable (O2), it has no tick, no amber and no lead. Yet the meaning line still says «terhadap target kelas itu», and the key «Garis tegak di setiap sel: target kelas itu. Angka berwarna jingga menunjukkan penguasaan di bawah target.» So a grey 39% reads as «not below target» | `laporan/dekan-pimpinan` | When no target is readable, the meaning line and the key say only what is drawn, plus one line: «Target kelas tidak tampil untuk peran Anda.» The wording is for the owner and Dr Gladys (it rides on O2) |
| **F4** | **Section D lists 19 patterns.** VI-4 and C1 set «up to eight rows». The cap was never in the code (`14361bda` had the same map); the specimens never had more than eight, so this data is the first to show it | `laporan/guru-ringkasan-5B`, `kadep-ringkasan-5B` | Ringkasan Kelas shows the eight most frequent, then «{n} pola lain, lebih jarang, ada di «Lihat bukti».». «Lihat bukti» is the evidence level and may keep them all |
| **F5** | **Konfigurasi contradicts itself** on decision 1. «Yang menunggu» says «2 murid belum punya kelas» while «Persiapan sekolah» marks «Sudah · Murid yang sudah ditempatkan di Kelas · 49» | `keputusan/d1-konfigurasi` | That row is «Belum» while `murid_tanpa_kelas` > 0, with «2 murid belum punya kelas: masukkan ke kelas di Pindah kelas» as its hint, like «Setiap Kelas punya guru» |
| **V1** | **«Target 70%» on the axis overprints «60%»** at 1280 px («Target 70%%»), and «100%» at 320 px | `laporan/guru-ringkasan-5B-1280`, `-320` | See §5, V1 |

## 1. Decision 1: a learner without a class

- **Pindah (`/konfigurasi/pindah#tempatkan`), `keputusan/d1-pindah`, `d1-pindah-layar`:**
  - «Murid yang belum punya kelas» comes after the move form. It has its meaning line and one row per person: name, registration number, a «Kelas» choice and a primary «Masukkan ke kelas».
  - Only learners' Kelas are offered (5A–5E).
  - At 390 and 320 px the rows stack cleanly, with no sideways scroll.
  - At 390 px the anchor lands with the section's heading on screen.
- **After placing, at 390 px (`d1-pindah-sesudah`):** «✓ Selesai. Murid sudah ditempatkan di kelas.» appears under the list, and the learner leaves it (2 → 1).
- **«Yang menunggu» (`d1-konfigurasi`):** «2 murid belum punya kelas: masukkan ke kelas di Pindah kelas» links to the section. The contradiction is F5.
- **The learner (`d1-belajar`):** «Anda belum masuk kelas mana pun, jadi belum ada materi untuk Anda. Admin sekolah Anda dapat memasukkan Anda ke kelas.» sits under the empty card at 1280, 390 and 320 px.
- **Not seen in one person:** a learner with an account who also appears in Pindah's list.
  - The world's learners have no school registration number, and `murid_tanpa_kelas` lists only people who have one. So my classless account learner saw the message but was not in the admin's list.
  - A Pendataan learner always has a number, so I take this as the fixture, not the product. **Second Eye may want one end-to-end case.**
- **C (may follow):** «Yang menunggu» runs each count into its words («2murid», «4paket»). `.pin-tautan` is a flex box, which drops the space; at 390 px the number then sits beside a wrapped link. This was already so on `14361bda`; the new, longer row makes it visible.

## 2. Decision 3: Studio's counts

**Every count equals the list it opens, for all three readers, at 1280, 390 and 320 px** (`keputusan/d3-studio-*`, `d3-daftar-*`, and `vD-catatan.txt`).

| Reader | Home | Lists |
|---|---|---|
| Guru (author) | «Draf yang belum diajukan 2» | 2: «Sekarang: Periksa isi» and «Sekarang: Ajukan untuk ditinjau» (VALIDATED is now counted) |
| Kepala departemen | Drafts 2, «Menunggu tinjauan Anda 1», «Menunggu langkah terbitan dari Anda 1» | 2, 1, 1; the release list says «Sekarang: Buat terbitan» |
| Admin sekolah | The same three | 2, 1, 1 |

- **The author's own list** reads «Sekarang: Setujui isi · Menunggu orang lain» on the package under review and «Buat terbitan · Menunggu orang lain» on the approved one. The waiting is named where it happens, and nothing is counted that the author cannot do.
- **Wording:** «Menunggu langkah terbitan dari Anda» follows the other cards' grammar.
- **R10 on Alpha:** PASS (Guru and Admin).
- **Konfigurasi** now counts «4 paket menunggu tindakan atau tinjauan Anda di Studio» for the Admin (2 + 1 + 1). It agrees with Studio.

## 3. The content-check refusal

**My walk** (`keputusan/r9-*`): «Tandai lolos pemeriksaan» on a package whose check finds an ERROR returns in about 0.2 s at every width:
- the state «Tertahan · Ada yang harus diperbaiki pada isinya sebelum paket ini bisa lanjut.»;
- the refusal line «Belum tersimpan. Pemeriksaan isi sudah dijalankan dan menemukan hal yang wajib diperbaiki, jadi paket belum ditandai lolos. Lihat Temuan di bawah: perbaiki yang wajib diperbaiki, lalu tandai lolos pemeriksaan lagi.»;
- Temuan, with «Mengapa penting» and «Cara memperbaiki» for each finding.

The page lands at `#temuan` with the refusal on screen. The package does not move, and no step is recorded.

**R9's FAIL** was taken on the **first** press. Its screenshot (`keputusan/siap-jalan-09-periksa-ditolak`) still shows «Memproses…», and Temuan reads «Tidak ada catatan mutu yang menunggu». The database checks in the same step passed (no move, the ERROR recorded). So the walk captured the page before the action returned. **The first run of the check may take longer than the walk's wait.** That is for Second Eye; it is not a design finding.

**C (may follow):**
- At 390 px the Temuan cards have no inner padding: text touches the card's border (`r9-layar-390`).
- The «Periksa isi» panel still says «Jalankan pemeriksaan … lalu tandai», although the mark runs the check. This was already known.

## 4. Every report, as its reader

**Changed since `14361bda` and seen here:**
- topics named by their objective statements;
- «Dari 22 murid»;
- the cohort named «Matematika · Angkatan 5 · 2026/27»;
- the grid lead with no readable target (absent for the Dekan);
- the learner lead counting parts («Ada 7 bagian untuk dipelajari lagi; semuanya ditandai «pelajari lagi» di bagian B.»);
- the refusal page.

| Report (reader) | Screenshots | Verdict | Notes |
|---|---|---|---|
| Ringkasan Kelas (Guru) | `guru-ringkasan-5B`, `-5C` | **NOT READY:** F1, F4, V1, V2 | The grammar holds: letters, «explain once», band key, «Bukan batas ketuntasan sekolah», section F. **The lead is the problem:** «8 dari 8 topik masih di bawah target:» and eight full statements, 9 lines at 1280 px and 31 at 320 px, in the lead's size (V2) |
| Ringkasan Kelas (staff wording: Kepala departemen, Dekan, Admin sekolah) | `kadep-ringkasan-5B`, `dekan-ringkasan-5B`, `admin-ringkasan-5B` | **NOT READY:** F4, V1, V2 | No section E, as ruled. «← Pimpinan» / «← Konfigurasi» name the way back |
| Ringkasan Kelas, under the minimum (5D) and with zero records (5E) | `kadep-ringkasan-5D`, `-5E` | **READY** | Each figure says «Sekarang 4 murid; perlu 5.» 5E opens «Tidak ada angka pada laporan ini, tetapi keterangan di bawah menjelaskan alasannya satu per satu» and ends «Tidak ada yang perlu dilakukan sekarang.» The 5D misconception list beside withheld figures is the catalogue's rule (matrix §5); I would show it with its own floor named («muncul bila sebuah pola muncul 3 kali atau lebih»), so the page does not look inconsistent |
| «Lihat bukti» | `guru-bukti-5B` | **NOT READY until O1** | «Pemahaman 52% … Ulangi topik ini bersama-sama sebelum lanjut.» beside «Kenaikan +17 poin … Tidak perlu diulang — lanjutkan ke materi berikutnya.», and «Fokuskan waktu tambahan…» under the bands. See §5, O1 |
| Per soal | `guru-soal-5B` | **READY** | Hardest question first, the key marked, who chose what |
| Catatan murid | `guru-murid-lemah` | **READY** | «Ini yang perlu dipelajari lagi, bukan penilaian atas muridnya.» C: the page calls one test «Cek penguasaan» (the assignment's title) and then «Uji Penguasaan terakhir». «Lihat bukti» does the same (known, deferred) |
| Pimpinan with KisiTopik (Kepala departemen) | `kadep-pimpinan` | **READY in design; V2 open** | Column heads «22 dari 24 murid · Target 70%». «—» where data is short. Amber with words, one key. The lead lists four statements, 6 lines (V2). C: column heads mix two and three lines, so 5B/5C sit lower than 5A/5D/5E. B: section D says «5A Ada angka», «5D Ada angka» while the grid shows both as «Sekarang … perlu 5». A reader meets «has figures» and «not enough» for the same class |
| Pimpinan (Dekan) | `dekan-pimpinan` | **NOT READY: F3** | Everything else as for the Kepala departemen |
| Ringkasan Sekolah (Admin sekolah) | `admin-sekolah` | **READY; V2 open** | The cohort named (R3). «Dari 33 murid». Kesiapan bukti names 5A, 5D and 5E. **Wording (Dr Gladys):** «4 dari 10 ranah» now counts objective statements, not ranah. Section A's lead lists six statements (V2). **For Second Eye (data, not design):** two rows read «Menentukan pecahan senilai dengan membagi. 100%» and «…mengali. 100%». They look like the demonstration package's single learner; please confirm the school-level minimum applies |
| Ringkasan Sekolah refused (Kepala departemen; Dekan at a faculty node) | `kadep-sekolah`, `dekan-sekolah` | **READY** (O4 is the owner's) | The standard refusal page |
| Konfigurasi «Laporan» | `admin-laporan` | **READY** | Both summaries, and each class with its year |
| Hasil belajar (learner with results) | `murid-hasil` | **READY** | R6 works. C: section A's figure reads «0 dari 8 soal / belum mencapai target», which a child can read as «none not reached»; «0 dari 8 soal tepat» would say it. Section C lists two chapter names with «,» not «dan» (G-01) |
| Hasil belajar (learner with none) | `murid0-hasil` | **READY** | C: «Cetak laporan» is offered on an empty report |
| Hasil per bab | `murid-hasil-bab` | **NOT READY: F2** | Otherwise good. The «Pelajari lagi» list already names each part by its short title («Pola Berkurang · Kalian dapat…»). That matters for V2 |
| The refusal page (Guru at 5D and at the school; learner at a class report; Admin at /pimpinan) | `guru-tolak-5D`, `guru-tolak-sekolah`, `murid-tolak-ringkasan`, `admin-tolak-pimpinan` | **READY** | One sentence on what is not shown and why («untuk peran Anda di tempat ini»), one on who can help, and one way out to the reader's own home («Mengajar», «Mau ke mana hari ini?», «Ke halaman awal»). No report frame, no «Cetak laporan» |

**All 84 views:** no sideways scroll at 390 or 320 px.

**C (may follow):** at 320 px the top bar's page name breaks inside a word: «Ringka/san Kelas», «Konfig/urasi» (`laporan/*-320`, `keputusan/d1-pindah-320`).

## 5. Design input (the owner and Dr Gladys decide)

### O1: a «where to look next» line that keeps S-3

**The problem.** S-3 keeps a sentence under each figure: Pemahaman, Kenaikan, and the bands (Sebaran / kesiapan). Today each sentence is chosen by the figure's own value and prescribes a teaching act («Ulangi…», «Tidak perlu diulang…», «Fokuskan waktu tambahan…»). Two values read separately can then give opposite instructions, and the owner has said not to prescribe interventions.

**The proposal: keep one sentence under every figure, but make it:**
1. **Independent of the value.** The same words at 39% or at 90%, so two lines can never contradict each other.
2. **A place in PINTAR, never a teaching act.** It says where the figure's explanation is.
3. **Once per page, the decision:** «PINTAR menunjukkan; langkah berikutnya Anda yang memutuskan.» It is said once, not under each figure («explain once»).

**Suggested lines.** They replace `tindakan.ulangi`, `tindakan.lanjut`, `tindakan.fokus` and `tindakan.fokus_pita`. `tindakan.tunggu` stays: it is not prescriptive.

| Lens | Indonesian | English |
|---|---|---|
| Pemahaman | «Topik mana yang paling menurunkan angka ini: lihat Penguasaan per bagian di bawah.» | «To see which topics pull this figure down, see mastery by part below.» |
| Kenaikan | «Kenaikan menunjukkan seberapa jauh kelas bergerak, bukan apakah target tercapai. Baca bersama Pemahaman dan Sebaran hasil.» | «Gain shows how far the class moved, not whether the target is met. Read it with comprehension and the spread of results.» |
| Sebaran / kesiapan | «Siapa saja yang ada di pita «Perlu penguatan»: lihat nama murid (Ringkasan Kelas, bagian E).» On «Lihat bukti», the existing «Lihat nama murid» link | «Who is in the Needs strengthening band: see the students' names (class summary, section E).» |

S-3's check («every shown figure carries its sentence») still passes. The sentences only stop telling the teacher what to do.

### V1: «Target 70%» crowding the 60% tick

**Proposal.** Take the target's label off the axis. The axis keeps 0 / 20 / 40 / 60 / 80 / 100%, and the target line is named once, in the figure's existing key: «Garis tegak: target kelas, 70%.» Section A's caption already says «Target ditetapkan sekolah pada Uji Penguasaan kelas ini: 70%», so nothing is lost.

This fixes the overlap at any target value and at 320 px (where it hits «100%»), and it is «explain once». If an on-axis label is kept, hide the tick label within 12 points of it; I do not recommend that, because 60 is the band boundary readers need.

### V2: leads that list several full statements

**What I saw:**
- Ringkasan Kelas A: 8 statements, 9 lines at 1280 px and 31 at 320 px.
- Pimpinan: 4 statements.
- Ringkasan Sekolah A: 6 statements.

All are in the lead's large type. The lead's job is the 60-second answer, so it stops being a lead.

**Proposal: R6's rule, applied to staff leads too.**
1. **Up to two topics are named; above two, the lead gives the count and the lowest one, and points to the list.**
   - «8 dari 8 topik masih di bawah target. Yang paling rendah: Memecahkan Masalah dengan Pola (39%). Semua topik ada di daftar di bawah.»
   - Grid: «4 topik di bawah target di kedua kelas yang punya angka. Yang paling rendah: …»
2. **Name a topic by its short title where one exists.** The learner's chapter page already shows them («Pola Berkurang», «Pola pada Tabel dan Gambar»). The statement stays as the row's second line. This also settles the voice: the statements address the learner («Kalian dapat…»), which reads oddly in a teacher's or Dekan's report. Short titles exist per lesson; whether they map one-to-one to objectives is for Second Eye to check.
3. **«Di sebagian besar kelas» over two classes with figures out of five** should say what it counts: «di kedua kelas yang punya angka».

**The same rule for section E.** Each name currently carries up to seven statements (F1 aside). With short titles that becomes one line per learner.

## 6. What I did not see

- **Staging:** everything here is local.
- **NVDA / TalkBack.**
- **The A4 print of the new long leads and the 19-row section D.** I did not print this world.
- **PD reports:** not re-walked, as in the matrix.
- **Numerical integrity:** Second Eye's §3; my world is a different random draw.
- **A classless learner who has both an account and a registration number** (§1).
- **Studio's own steps** taking the four test packages to their states: they were set by SQL.
- **The owner's acceptance.**
- **Engineering.**
- **Whether the first content-check press is slow beyond the walk's wait** (§3).
