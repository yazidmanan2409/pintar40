# B1 / C2 evidence completion: the two missing screens reproduced (4 Nov 2026)

**Authority:** owner, 4 Nov, «PINTAR 4.0 — OWNER RULING: B1/C2 EVIDENCE COMPLETION — GO, Option 2».

**Where:**
- the disposable local stack only; the app built from the development branch's code head `9b52b51`;
- synthetic identities and synthetic data only;
- no staging or production access, no application code change, no migration, no repository tooling. The setup SQL and the capture script stay in the coordinator's scratchpad.

**Compared against:** Daisy's specimens on `ux-1/daisy-experience`:
- B1 at `0d50a8f0` (`docs/coordination/ux/completion-4.0/B1/`);
- C2 at `d9a27652` (`…/C2/`).

**Verdict: neither B1 nor C2 moves to final design acceptance yet.**
- B1 has three composition differences, which go back to Daisy.
- C2 has one composition difference, which goes back to Daisy, and two states that could not be reproduced (§2.4).
- The database boundary for C2 is proven by BOB43-D01 in CI. The local re-run failed, through the coordinator's own error (§3).

## 1. How the PD class was made (C2)

In «Sekolah Sintetis Alpha», never in the demonstration school, **through the product's own functions, acting as Admin Alpha**:
- `create_bagian(…, true)`: the Bagian «Pengembangan Guru (sintetis)» for educators;
- `create_tingkat`, then `create_kelas`: «Kelas PD Sintetis», TA 2026/2027;
- `grant_role`: Guru Alpha as the facilitator (EDUCATOR on that Kelas);
- `enrol_for_professional_learning`: Kaprodi Alpha and Dekan Alpha as the two participants.

Then, as in BOB43-D01's own recipe: one PD course «Strategi Bertanya (sintetis)», its release, one chapter and one lesson, assigned and active. Nobody has handed anything in.

Each person signed in with their own synthetic account and chose the working context in the real chooser at `/`.

## 2. C2: the real PD Kelas «Lihat bukti»

### 2.1 What the page does today (`c2-pd-fasilitator-*.png`, `c2-biasa-fasilitator-1280.png`)

The PD page is **identical to an ordinary class's**. Daisy's «today» description holds, and the reality is slightly worse than she said:
- «Kesimpulan» draws the five «not yet» cards, plus a sixth, unlabelled «Belum ada bukti …» line.
- **«murid» appears in the PD class** in three places Daisy did not list:
  - «Sekarang 0 murid; perlu 5.»;
  - «Angka ini muncul setelah cukup murid …»;
  - the population line «0 murid di kelas ini · 0 sudah mengerjakan …».
- **That line says «0 murid» while the class has two participants.**

**Her composition removes all of these with the five cards,** so they need no new design. They strengthen E-C2-2 (no class metric requested, no figure's place drawn).

### 2.2 Matches

| Checked | Result |
|---|---|
| The page frame: back link, scope line (school / class / year), eyebrow, h1, intro, «Keadaan hari ini» | as in her specimen |
| «Keadaan hari ini» with nothing running | the built empty line, as her `pd-kosong` |
| Another school's Guru opens the PD class's «Lihat bukti» (`c2-tolak-guru-lain-1280.png`) | the one refusal page, «Mengajar», who is signed in, as her `tolak` |
| Admin sekolah opens the PD class's «Lihat bukti» (`c2-admin-sekolah-bukti-1280.png`) | refused |
| Her pointer's destination, `/pengembangan/[simpul]`, as the facilitator (`c2-catatan-fasilitator-1280.png`) | each participant with «Pelajaran selesai 0/1» (progress) |
| The same record as Admin sekolah (`c2-catatan-admin-sekolah-1280.png`) | enrolment, participation and completion only; **no progress row**; the page says «Kemajuan dan hasil hanya untuk fasilitator, Kepala departemen dan Dekan.» (D-069(b)) |
| 320 px | no sideways scroll (scroll width 320) |

### 2.3 Difference, back to Daisy

**The footnote is false for a PD Kelas.** Her PD specimens keep the ordinary page's «Yang tidak tampil di sini: penilaian per soal dan sinyal integritas. **Keduanya ditinjau Kepala departemen, bukan guru.**». For a PD Kelas:
- integrity signals are **not** reviewed by the Kepala departemen: D-069(c) «PD signals are not surfaced to school leadership, the facilitator or Management»;
- BOB43-D01 asserts the Kepala departemen over the PD Bagian reads **0** PD signals (`sinyal_kaprodi_pd: 0`); only Admin platform reads them.

The PD page needs its own footnote, or none. Its words are copy (Dr Gladys confirms).

### 2.4 Not reproduced, and why

The synthetic school has no finished assessment to copy from, and the only one the selftest helpers copy is in the demonstration school. So two states were not reached:
- **an assessment running or handed in**, which shows «Keadaan hari ini» with counts and the «Lihat nama murid» control;
- **a participant with a result**, so the result cell's visibility on `/pengembangan` was not seen live.

Both are covered by tests rather than screens:
- BOB43-S01 (green locally, this run): the class page and «Keadaan hari ini» name a class's people by its returned kind;
- BOB43-K01 (green locally): Admin sekolah's record has no progress or result;
- BOB43-D01 (§3).

Reaching these states live needs an assessment definition made for the PD course. That is synthetic data on this stack, and only with the owner's go.

## 3. The database boundary (D-069(b)), and a correction

**The evidence:** BOB43-D01 runs against the database, as each person, and proves who reads PD evidence:
- Admin sekolah reads the PD **session** row (status and timestamps: completion), but **no** result's evidence:
  - no answers, no presented questions, no integrity signals;
  - no lesson progress;
  - `professional_learning_record` without progress or result;
- the facilitator reads no participant's answers.

It is green in CI on `9b52b51`: `ci` 41748270096 attempt 2, `selftest contract (strict, local stack)`, which runs every manifest id. It stays part of the acceptance evidence, and E-C1-7's sweep (`assessment_results`, `metric_evaluate`, `generate_report`, the certificate reads, the API routes) adds to it at the build.

**The local re-run failed (`GRANT_ALREADY_ACTIVE`). The cause is the coordinator's error, not the product:**
- While checking the setup, the coordinator ran `select … from selftest.wp2_school()` to see which school the helper uses. That helper **builds** BOB43-D01's world, and it did so in the local copy of the **demonstration school** («SD Cendekia Nusantara (sekolah peragaan)»), committed: the `wp2-*` grants stamped 01:56:07 UTC, 31 s before the PD setup.
- BOB43-D01 expects to build that world itself, so it then met an existing grant.
- **This is the disposable local database only.** Staging, production and Dr Gladys's records are untouched. The demonstration school's local copy now carries the WP2 test world.
- **To re-run BOB43-D01 locally:** the local database needs resetting to its seed. That clears the synthetic PD class too, which `pd-setup.sql` recreates. Not done: the owner's go is asked first.

## 4. B1: Admin platform in «Seluruh platform»

Sysadmin (synthetic) chose «MENGELOLA:PLATFORM» at `/`. The page is 4,793 px at 1280 (`b1-konfigurasi-platform-1280.png`, `-390.png`).

### 4.1 Confirmed: today's defects her composition fixes

All present on the real platform page:
- the «PINTAR» eyebrow;
- «Lingkungan **development**» in raw English (RV-15);
- «Kelas aktif **0**»: it counts the *selected school's* classes, so in «Seluruh platform» it is always 0. Her move of the count into «Persiapan sekolah» fixes it, as with the empty «Lingkungan» tile;
- the audit trail's «Versi» column all «—», and the rows unstriped (RV-24);
- the section menu.

### 4.2 Matches

| Checked | Result |
|---|---|
| «Yang menunggu» first, with the platform-wide count | as her index |
| «Kesehatan sistem» with «Jalankan pemeriksaan» | as her health panel (her specimen draws the after-run state) |
| «Laporan masalah», «Pemeliharaan dan pengumuman» with «Seluruh platform» in «Untuk», «Hentikan sekarang» typed confirmation | as her `pemeliharaan-platform` |
| «Sistem & Konfigurasi»: every school with «aktif», the «data uji» badge and its school years | as her row pattern |
| «Peran & akses» with «Admin platform» and the grant form | as her `peran-platform` |
| 390 px | no sideways scroll |

### 4.3 Differences, back to Daisy

1. **«Perpindahan murid» is shown to Admin platform in «Seluruh platform» today** («Belum ada.»), between «Sistem & Konfigurasi» and «Peran & akses». Her composition says the «Murid» group is absent for Admin platform. That drops a section the platform administrator has today: she keeps it, or says why it should go (and then it is the owner's).
2. **Her specimen's navigation for Admin platform includes «Studio».** The real platform navigation is: Konfigurasi, Aktivasi akun, Keamanan akun, Kirim email uji, Sertifikat sekolah, and «Mau ke mana hari ini?». There is no Studio. The specimen's shell should match the real places (D-132).
3. **«Laporan masalah»'s intro says «Laporan dari staf sekolah Anda …» in «Seluruh platform»**, where there is no «your school». It is a wording point for her T table (an RV-15-type line); Dr Gladys confirms.

## 5. Files

Screens (synthetic only; no PIN, password or key):
- `c2-pd-fasilitator-1280.png`, `-390.png`, `-320.png`
- `c2-biasa-fasilitator-1280.png`
- `c2-tolak-guru-lain-1280.png`
- `c2-admin-sekolah-bukti-1280.png`
- `c2-catatan-fasilitator-1280.png`, `c2-catatan-admin-sekolah-1280.png`
- `b1-konfigurasi-platform-1280.png`, `-390.png`
- `b1-email-uji-platform-1280.png`

The setup (`pd-setup.sql`) and the capture (`tangkap.mjs`) are in the coordinator's scratchpad, not the repository.
