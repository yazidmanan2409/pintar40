# Sweep follow-up: final words under ruling 78 (Daisy, 23 Nov 2026)

> **What holds now:** final words for (a) K-02, (b) K-05, (c) K-01 and (d) the «Admin PINTAR» list.
> - Bob's corrections to `SAPU-KONSISTENSI-706fe8c5.md` are accepted as given: S-14 «yang Anda ketik»; S-05 mapped SQL messages; K-08 modelled on `tur.nt.5.isi`; S-16 `maxLength={200}` only; T-02 delete `f2`; K-05 is a new key.
> - DAISY-25 checked: no promise of notice anywhere.

## (a) K-02 · Peta Bacaan, the fourth tier

**Label:** `map.tier.KUAT` «Sudah kuat» / «Already strong». This keeps the owner's word. It sits after «Baca ini lebih dulu» · «Perlu dibaca» · «Sebaiknya dibaca».

**The card's line, for KUAT cards only.** It replaces the `alasan` slot. For a KUAT card, `reading_map` falls back to the objective's own statement, so the card prints the statement twice [B: Bob to confirm in `20270117100000…sql:278-287`].
- New key `map.kuat.arti`.
- ID: «Jawaban Anda di Pemetaan Awal untuk bagian ini sudah tepat. Anda boleh membacanya sekilas.»
- EN: «Your Initial Mapping answers for this part were right. You may skim it.»

**Description wherever the tiers are explained** (the catalogue, tours, help):
- ID: «Tanda ini adalah saran urutan membaca dari hasil Pemetaan Awal. Tanda ini bukan nilai dan bukan pernyataan penguasaan.»
- EN: «These marks suggest an order of reading, from the Initial Mapping. They are not a score, and not a statement of mastery.»

## (b) K-05 · Verification, the facts under «Sedang ditinjau»

- **Heading above Hasil, Predikat and the issue date:** new key `verifikasi.fakta.seperti_terbit`. ID «Seperti saat diterbitkan» / EN «As issued».
- **Under DITINJAU only, one line below the heading:** new key `verifikasi.fakta.ditinjau`.
  - ID: «Isi ini dapat berubah setelah sekolah penerbit selesai meninjau sertifikat ini.»
  - EN: «This may change once the issuing school finishes reviewing the certificate.»
- **DICABUT:** the heading only. Its facts stay shown, by the page's documented design.
- **TIDAK SAH:** unchanged; no facts are shown.

## (c) K-01 · One verdict

These words assume the single verdict of ruling 78: the session's `lulus`, which is the gate AND mastery ≥ the mark.

**Learner, the result page:** the headline `hasil.target.belum` «Belum mencapai target.» stays.
- **Gate failed, mastery at or above the mark:** new `hasil.target.belum_gerbang`.
  - ID: «Persentase penguasaan bab ini sudah memenuhi target, tetapi ada soal penting yang belum dijawab dengan tepat. Karena itu target bab ini belum tercapai. Tanyakan kepada guru Anda langkah berikutnya.»
  - EN: «Your mastery percentage for this chapter meets the target, but an important question was not answered correctly. So this chapter's target is not reached yet. Ask your teacher about the next step.»
- If the «Pelajari lagi:» list has entries, it follows as today. The sentence makes no reference to «di bawah ini», so an empty list reads correctly.
- **Mastery below the mark** (with or without the gate): the existing `hasil.target.belum_arti`, unchanged.
- **Unchanged:** the existing `hasil.safety.missed` line «Ada soal penting yang belum tepat. Mari kita lihat bersama.»

**Teacher, one learner** (`/mengajar/[kelas]/murid/[orang]`). The tag beside the figure, with the target kept as today:
- **Mastery below the mark:** «di bawah target · target {p}» (unchanged).
- **Gate failed, mastery at or above:** new `mengajar.murid1.gerbang` «belum mencapai target: soal penting belum tepat · target {p}» / «target not reached: an important question is not right yet · target {p}».

**«Minta membaca lagi»** (the «Beri ulang» link and page, `mengajar.ulang.*`):
- **The link:** shown for every learner whose verdict is «belum mencapai target», gate included. The label `mengajar.ulang.judul` «Minta membaca lagi» is unchanged.
- **On the page:** a gate learner is listed with the others below target and pre-ticked. Their row carries new `mengajar.ulang.gerbang`.
  - ID: «Persentase sudah memenuhi target, tetapi ada soal penting yang belum tepat.»
  - EN: «The percentage meets the target, but an important question is not right yet.»
- **Lessons to read again:** suggest the lessons of the objective(s) the missed must-be-right item belongs to, as well as those below the mark [B: Bob confirms that the items' `objective_ids` are available there].

**Retake eligibility and the certificate** read the same verdict. Their existing words already follow `lulus`, so no new copy is needed.

## (d) «Admin PINTAR» throughout (T-03)

**ID «Admin platform» → «Admin PINTAR», 22 keys** (from `main` `706fe8c5`):
- `peran.perpanjang.sendiri`, `peran.saya.berakhir_platform`, `peran.saya.berakhir_sendiri`;
- `laporan.templat.tak_berwenang`, `config.kesehatan.bukan_admin`, `config.refused`;
- `galat.maintenance_not_allowed`, `studio.paket.masalah.package_could_not_be_saved`, `role.SYSTEM_ADMIN`, `galat.role_scope_required`;
- `emailuji.r.ditolak`, `emailuji.ditolak`, `emailuji.galat.ditolak`, `email.uji.alasan`;
- `aktivasi.ditolak`, `aktivasi.galat.baru_ditolak`;
- `orang.intro.sekolah`, `orang.email.hanya_platform`, `orang.identitas.hanya_platform`;
- `email.aman.ditangguhkan.isi_admin`, `email.aman.diatur_ulang.isi_admin`;
- `audit.aksi.role.first_system_admin_bootstrapped`.

**EN:**
- **Those 22 keys:** «Platform administrator» / «platform admin» → «Admin PINTAR» («an Admin PINTAR» in running text, as the existing Admin PINTAR keys already write it).
- **Also `email.aman.diatur_ulang.isi`:** EN «PINTAR administrator» → «an Admin PINTAR».

**Not changed:**
- «tim PINTAR» (`lapor.*`) and «pengelola PINTAR» (`pemeliharaan.pesan`) stay. They name the people who handle reports and maintenance, not the role.
- [B: Bob confirms that the report queue really reaches more than SYSTEM_ADMIN. If it reaches only that role, these become «Admin PINTAR» too.]

## Settled by Bob (23 Nov, 03:24)

- **K-02's double statement:** confirmed. `map.kuat.arti` replaces that slot.
- **K-01's gate-item objectives:** not available today, because `tujuan_belum_tercapai` returns only objectives below the mark. This needs an SQL change, which Sharon reviews in Z. The words above stand.
- **«tim PINTAR» and «pengelola PINTAR»:** they stay. They describe readers, not a role name.
