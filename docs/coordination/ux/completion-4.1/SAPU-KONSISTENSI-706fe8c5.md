# Consistency sweep: words against what the server does (Daisy, 23 Nov 2026)

> **What holds now:**
> - **Scope and method.**
>   - Read-only, `main` at `706fe8c5`.
>   - Bob's four questions: labels against what the server accepts (Q1); errors against the refusal behind them (Q2); claims against evidence (Q3); one term per concept (Q4).
>   - Four parallel readers did the first pass. I re-read each finding marked **✓D**: both the string and the server line. Every other A has both sides cited by the reader, and Bob verifies them.
> - **Evidence tags:**
>   - **A** is a confirmed mismatch, with both sides cited.
>   - **B** needs verification. It is not presented as a defect, and its correction applies only if confirmed.
> - **Class:** **Z** (small and actually wrong) · **later** (natural wording review) · **owner** (already logged for the owner).
> - **The three most serious:**
>   - **S-01:** renaming an Aturan Asesmen silently turns off pause and offline, and saves a new rule.
>   - **K-01:** a learner who misses a must-be-right question is told their mastery is below target, while their teacher sees «target reached».
>   - **S-02:** an added role is silently dropped when no end date is given.
> - **Excluded as settled:** R-26, R-27, «nama pengguna»/«username», and the no-existence-oracle sameness. «Sudah dikuasai» is listed once, as K-02.
> - **Counts:**
>   - Q1/Q2: 16, of which 12 are A and 4 are B.
>   - Q3: 9, of which 4 are A and 5 are B.
>   - Q4: 12, all A (the strings themselves are the evidence).

## Severity order (for Bob's report)

**High:**
- S-01 (data);
- K-01 (educational correctness);
- S-02;
- K-03.

**Medium:**
- S-04, S-08, S-11, S-12, K-04, S-05;
- the B items K-05 and S-15.

**Low:** the rest.

## Q1 / Q2 · Labels and errors against the server

| Id | Screen | Strings (ID / EN) and file:line | What the server does | Why it misleads | Smallest correction | Tag | Class |
|---|---|---|---|---|---|---|---|
| **S-01** | Studio › Aturan Asesmen, an existing rule's row | Success line `studio.definisi.versi_baru` «Perubahan ini mengubah cara hasil dibaca, jadi tersimpan sebagai aturan baru…» (hle.ts:6277) instead of `studio.definisi.tetap` «Nama diperbarui…» (6278). Row form: `studio/definisi/page.tsx:228-234` (name and count only) | `studio/actions.ts:532-533` always sends `allows_pause` and `offline_tolerant` as `=== "on"`, so `false` from this row. `20270121210000…sql:327-330` takes the payload over the old value, and lines 397-405 count both as interpretive, so a **new version is saved with pause and offline off** | A rename quietly changes two settings. The sentence then blames "your change" for a change the person didn't make | Send the two flags only when their fields are in the form (`fd.has("jeda")`), or carry them as hidden inputs on the row. No wording change. Not a server change | A ✓D | **Z** (high: data) |
| **S-02** | Konfigurasi › Staf › Ubah peran | Date field `staf.sampai`, neither `required` nor «(opsional)» (`staf/page.tsx:169-172`). With nothing ticked: `ROLE_NOTHING` «Pilih peran untuk dilepaskan atau ditambahkan.» / "Choose a role to release or to add." (hle.ts:4273) | `staf/actions.ts:80-82` builds the add only if the date is valid; otherwise the add is `[]`. The server would refuse `ROLE_UNTIL_INVALID` (`20270113120000…sql:200-201`) but never sees the add | The person chose a role and is told to choose one. With a release ticked, the add vanishes silently | Make the date `required` when a role is chosen. Send `ROLE_UNTIL_INVALID` for role-without-date | A ✓D | **Z** (high) |
| **S-03** | Same form | `galat.role_until_invalid` «Tanggal berlaku sampai harus setelah hari ini.» / "…must be after today." (hle.ts:4276) | `min={hariIni}`; the action uses 23.59.59 on the school's clock; SQL refuses only `<= now()`. **Today is accepted** | It states a rule the form and server don't apply | «Tanggal berlaku sampai harus hari ini atau sesudahnya.» / «The valid-until date must be today or later.» | A | **Z** |
| **S-04** | Pendataan › Kode sekolah | «Kode itu tidak bisa dipakai. Mungkin sudah dipakai sekolah lain, atau bentuknya tidak sesuai.» / "…may already belong to another school, or its shape is wrong." (hle.ts:3938; page.tsx:121) | Three distinct refusals (`20260926100000…sql:181-200`: not permitted, shape, taken). `pendataan/actions.ts:53,66` passes `kenapa`, but the page never reads it. The input has `maxLength={3}` and no pattern | «AB» is told "maybe taken". The shape case is fully knowable, and its hint exists («Tiga huruf atau angka.», 3929) | Check the shape in the action and answer with the existing hint as the error: «Kode sekolah terdiri dari tiga huruf atau angka.» Keep "taken" for the rest. Add `pattern="[A-Za-z0-9]{3}"` | A ✓D (`kenapa` unread) | **Z** |
| **S-05** | Studio › Aturan Asesmen | `ACTION_INPUT_INVALID` «Ada isian yang kosong atau belum sesuai. Periksa, lalu coba lagi.» (hle.ts:6334) for a mix total ≠ count, safety > count, and out-of-bounds values (`galat-kontrak.ts:312-315`) | `20270121210000…sql:340-372`, distinct checks. On the edit row (S-01's form), changing the count of a rule that has a mix is refused, and the mix isn't on that row | The person can't see or reach the field at fault | **Z:** add to the mix hint `studio.definisi.petunjuk.komposisi`: «Jumlah ketiganya harus sama dengan Jumlah soal.» **Later:** own codes for the mix and safety refusals | A | Z (hint) + later |
| **S-06** | Mengajar › Ubah jadwal | «Jadwal materi ini tidak dapat diubah saat ini.» / "…right now." (hle.ts:4322) | `20270114100000…sql:938-947` re-raises any guard as `WINDOW_NOT_CHANGEABLE`, including "content no longer shared" (lasting) | "Right now" suggests a retry that can't work | If confirmed: drop «saat ini», and name the lasting cause where the server can tell it apart | B. Bob checks which guards reach this code | later |
| **S-07** | Struktur › Nonaktifkan | Whitespace-only reason → `KURANG` «Lengkapi pilihan yang diminta.» (hle.ts:5102) | `konfigurasi/actions.ts:55-57,591` trims, then KURANG | It speaks of a choice; the missing thing is the reason, and «Tuliskan alasan tempat ini dinonaktifkan.» (5103) exists | Return `STRUCTURE_REASON_REQUIRED` there | A | **Z** |
| **S-08** | Masuk › Lupa password, PINTAR ID + PIN path | `lupa.berakhir` «Waktu untuk membuat password baru sudah habis. Minta kode baru, lalu coba lagi.» / "Ask for a new code…" (hle.ts:6601), shown on the PIN form (`LupaPassword.tsx:146-149`) | The grant came from `recovery_by_pin` (`20261116100000…sql:118`). No code exists on this path (`pemulihan.ts:209-211`) | The person is told to request a code on a form that has no code | New `lupa.pin.berakhir`: «Waktu untuk membuat password baru sudah habis. Ketik lagi PINTAR ID dan PIN Anda.» / «The time to make a new password has run out. Type your PINTAR ID and PIN again.» | A ✓D | **Z** |
| **S-09** | Same path, the wait | `lupa.pin.sering` «Terlalu banyak percobaan dari perangkat ini.» / "…from this device." (hle.ts:6629) | Keyed by network address (`pemulihan.ts:287`, `kunciIdentitas("pulih-pin-alamat", alamat)`) | In a lab behind one address, a child at a fresh computer is told *this device* tried | «Terlalu banyak percobaan dari jaringan ini.» / «Too many tries from this network.» (as the reopen form already says) | A ✓D | **Z** |
| **S-10** | «PINTAR terkunci» | «Akun ini belum punya PIN, jadi layar ini tidak bisa dibuka dengan PIN. Keluar, lalu masuk lagi.» / "…has no PIN yet…" (hle.ts:6799; `LayarTerkunci.tsx:69,97`) | `bisa_pin` is false also when the PIN was reset (`20261117100000…sql:214-217`) | After a reset the person had a PIN, and Akun saya says «PIN lama Anda tidak berlaku lagi» (6640) | «Akun ini belum punya PIN yang bisa dipakai, jadi layar ini tidak bisa dibuka dengan PIN. Keluar, lalu masuk lagi.» / «This account has no PIN that can be used, …» | A | **Z** |
| **S-11** | Konfigurasi › Keamanan, account lookup | Field `keamanan.akun.cari` «PINTAR ID», `maxLength={8}` (`AkunPlatform.tsx:50`) | `keamanan/page.tsx:51` accepts only 8 bare Crockford characters, no `kanonikPintarId`; anything else gives an empty `pid` and **no message** | The ID is displayed as «A14C D7ST». Pasted, it is cut to 8 characters, and the page shows nothing. The PIN-reset field next door (`PemulihanPin.tsx:67`) accepts it | `maxLength={12}`, normalise with `kanonikPintarId`, and use the existing `ID_TIDAK_SAH` sentence for a malformed entry | A ✓D | **Z** |
| **S-12** | Masuk › Buka kembali | `galat.tunggu` «Baru saja ada permintaan dari jaringan ini. Tunggu beberapa menit, lalu coba lagi.» / "A request was just sent…" (hle.ts:6984) | `api/masuk/buka-kembali/kirim/route.ts`: `code_request_pace` counts **before** the input check in `minta_buka_kembali`. A refused or failed try still uses the pace. The returned wait (60 s, up to 1 h) is discarded. The textarea's `minLength={10}` counts spaces the server trims | After «Coba lagi» or a field error, a person is told a request *was* sent when none was | Check the input before pacing. Wording: «Tunggu sebentar, lalu coba lagi.» / «Wait a little, then try again.», with no claim that something was sent. Coordinate with UX package item 1 (same page) | A | **Z** |
| **S-13** | Aktifkan, resend code | `aktifkan.kode_ulang_ok` «Jika alamat ini terdaftar, PINTAR sedang mengirim kode baru.» (hle.ts:6580). The first send states «…dan akunnya belum aktif…» (6571) | `activation_code_target` matches only `state = 'REQUIRED'` | An active account is promised a code that never comes | «Jika alamat ini terdaftar dan akunnya belum aktif, PINTAR sedang mengirim kode baru.» / «If this address is registered and its account is not active yet, PINTAR is sending a new code.» | A | **Z** |
| **S-14** | Lupa password, username typed | `aktifkan.minta_sering`, `aktifkan.kode_sering` «…untuk alamat ini…» (hle.ts:6881, 6584) | Keyed on the typed name (`pemulihan.ts:71,125`) | It speaks of an address the person didn't type | If confirmed: recovery variants with «nama ini» / «this name» | B. Bob checks that recovery reuses these keys | later |
| **S-15** | Aktivasi (admin) | `aktivasi.galat.dipakai` «…Alamat email ini mungkin sudah dipakai akun lain. Coba alamat lain.» (hle.ts:6537) | `api/akun/aktivasi/route.ts:89,124-127` sends every `createUser` error, including 5xx and rate limits, as `create_failed` | During an outage the admin changes a correct address | If confirmed: only "already registered" maps to `dipakai`; the rest go to a general «Akun belum bisa dibuat. Coba lagi sebentar lagi.» | B. Bob checks the error shapes | Z if confirmed |
| **S-16** | Aktivasi, NEW_PERSON | `aktivasi.galat.baru_ditolak` «…Hanya Admin platform yang bisa membuat orang di luar pendataan.» (hle.ts:6536) | `authorize_new_person` also refuses a name over 200 characters or a malformed email; the name field has no `maxLength` | It tells a platform admin they lack a role they hold | If confirmed: `maxLength={200}`, and a separate input code | B | later |

## Q3 · Claims against evidence

| Id | Screen | Strings and file:line | What the data supports | Why it overclaims | Smallest correction | Tag | Class |
|---|---|---|---|---|---|---|---|
| **K-01** | Learner `/belajar/[tugas]/hasil`; teacher `/mengajar/[kelas]/murid/[orang]` and `/ulang` | Learner: `hasil.target.belum_arti` «Bab ini sudah selesai dikerjakan, tetapi penguasaannya masih di bawah target. Pelajari lagi bagian di bawah ini…» (hle.ts:5857; page.tsx:132-134). Teacher: `di_bawah_target` from `penguasaan < batas` only (murid page:126-128); `urutUlang` marks the learner "capai" (`pengajar.ts:1157`) | `session_outcome`: `lulus = safety_gate_passed and mastery >= v_min` (`20261102100000…sql:375-376`) | A learner at 90% against 75% who missed a must-be-right item is told their *mastery* is below target, possibly over an empty "parts below" list. Their teacher sees «reached», no «Beri ulang», and sorts them last | **Learner:** a gate branch, «Ada soal penting yang belum tepat, jadi target bab ini belum tercapai. Pelajari lagi soal itu bersama guru Anda.» / «An important question is not right yet, so this chapter's target is not reached. Go over it again with your teacher.» **Teacher:** judge on the session's `lulus`, not on the percentage | A ✓D | **Z** (high: educational correctness) |
| **K-02** | Peta Bacaan | `map.tier.KUAT` «Sudah dikuasai» / "You already have this" (hle.ts:5713) | `reading_map`: tier 4 when correct/total ≥ 0.8 on Pemetaan Awal, **no minimum item count** (`20270117100000…sql:232-281`); 1/1 qualifies | One lucky answer on a pre-test that says it is "not an exam" becomes "mastered" | Already logged for the owner. Word in the catalogue reply: describe it as an order of reading. Possible: «Sudah tepat di Pemetaan Awal», or a minimum of 2 items | A ✓D | owner |
| **K-03** | Teacher, one learner | `mengajar.murid1.tujuan_kosong` «Tidak ada tujuan pembelajaran yang tercatat di bawah target…» (hle.ts:7728; page.tsx:153-154) | `tujuanBelum` returns `[]` on any error (`pengajar.ts:1029`). The RPC also returns nothing for no role, no membership, or no Uji Penguasaan | A failed read, or no assessment yet, reads as "all reached". It breaks the file's own rule, «a failed read never says nobody» (`pengajar.ts:1040`) | Return `null` on error and draw no section. With no Uji Penguasaan: «Belum ada Uji Penguasaan dari murid ini di kelas ini.» / «This student has no Mastery Check in this class yet.» | A ✓D (error→[]) | **Z** |
| **K-04** | Leadership, school report | `laporan.sekolah.semua_cukup` «Semua bidang kompetensi berada di 60% ke atas.» (hle.ts:3742) | `KomposisiSekolah.tsx:130-153`: only domains with a figure are judged; withheld domains are left out | "All" while some are withheld. The class report already has the `_sebagian` pattern (D13) | New `laporan.sekolah.semua_cukup_sebagian`: «Semua bidang kompetensi yang punya angka berada di 60% ke atas.» / «Every competency domain with a figure is at 60% or above.», when any is withheld | A ✓D | **Z** |
| **K-05** | Public verification, status «Sedang ditinjau» | `verifikasi.lulus` «Memenuhi capaian» and the Predikat, shown under `verifikasi.status.DITINJAU.arti` «…sertifikat ini tidak dinyatakan berlaku…» (hle.ts:4400; page.tsx:99,125-137) | The facts come from the issue-time payload. The page's own note (lines 42-49) makes showing facts for DICABUT deliberate, but doesn't cover DITINJAU, which came later | "Achieved" stated beside "not declared valid", for a mark a correction may overturn | If confirmed: under DITINJAU (and DICABUT, if the owner wishes), head the facts «Seperti saat diterbitkan» / «As issued» (vocabulary already decided) | B. Bob checks whether DITINJAU's facts are intended | Z if confirmed |
| **K-06** | Learner, Hasil Belajar | `hasilbelajar.semua_capai` «Semua bab yang selesai sudah mencapai target.» (hle.ts:5192) | Counts only finished chapters that have a verdict (`KomposisiMurid.tsx:21-31`) | A finished chapter without a verdict is included in "all" | If confirmed: «Semua bab yang sudah dinilai…» | B. Bob checks whether no-mark sessions still exist | later |
| **K-07** | Konfigurasi › Batas ketuntasan | `hasil.target.tercapai_arti` «Penguasaan bab ini memenuhi targetnya.» | `school_pass_marks.percent between 0 and 100`; 0 makes any score pass | A server question, not wording | If confirmed: a floor above 0 (Sharon) | B | later |
| **K-08** | Learner tour | `tur.sd.6.isi` «…Isinya: yang sudah dikuasai dan yang masih perlu dilatih.» (hle.ts:7126) | The result page shows counts and the parts below target; nothing is labelled as mastered | It promises a verdict the page doesn't give | If confirmed: «Isinya: berapa soal yang tepat, dan bagian yang perlu dipelajari lagi.» | B. Bob checks it against the tour's current page | later |
| **K-09** | Learner certificate page | `sertifikat.disiapkan.arti` «Hasil Uji Penguasaan Anda sudah memenuhi syarat…» | Shown from `lulus` only; eligibility also needs OFFICIAL and a certifying mode (`20261102100000…sql:392-405`) | A passed non-official sitting waits for a certificate that will never come (reachable by URL only) | If confirmed: decide from `certificate_eligibility` | B | later |

## Q4 · One term per concept

All tagged A: the evidence is the strings, which contradict each other. The readers' full counts are in the session notes.

| Id | Concept | Variants (examples) | Proposed single term | Class |
|---|---|---|---|---|
| **T-01** | Learning objective (one report row, per `20261031100000_a_topic_is_named_by_its_objective.sql`) | «topik» (~18: `metrik.topik.*`, `laporan.komposisi.topik_*`) · «tujuan pembelajaran» (~15) · «bagian» (`mengajar.bukti.bagian` «Penguasaan per bagian») · «bidang kompetensi»/«ranah» (`metrik.kompetensi.*`, `laporan.sekolah.semua_cukup`) | «tujuan pembelajaran» / «learning objective»; heading «Penguasaan per tujuan pembelajaran» | later (largest; one pass) |
| **T-02** | The assignment's open period | «jendela» (12) and «jadwal» (8). `mengajar.langkah.f2` «Ubah jendela asesmen yang berjalan» leads to the button `jadwal.buka` «Ubah jadwal» (hle.ts:7925, 4612) | One word on that flow. I recommend «jadwal» for the teacher's verb («Ubah jadwal»), with «jendela» kept for guidance text only if Bob prefers; at minimum, f2 should match the button: «Ubah jadwal asesmen yang berjalan» | **Z** (f2 only) + later |
| **T-03** | Platform administrator | «Admin platform» (22, incl. `role.SYSTEM_ADMIN`, hle.ts:5663) and «Admin PINTAR» (22, incl. `peran.galat.role_last_platform_admin`, 4281), on the same Peran & akses screen. EN: «an Admin PINTAR», «Platform administrator», «platform admin» | **Owner/Bob to pick one.** B1-R1 moved one key to «Admin PINTAR»; v1 and the role label say «Admin platform» | later (one decision, then ~22 keys) |
| **T-04** | The package-level unit called «pelajaran» | `config.ketuntasan.arti`/`.kosong`, `galat.pass_mark_set`/`_missing`, `mengajar.sedia.kode.assign_pass_mark_missing`/`assign_exposed_content`: the pass mark is per course | «materi» / «material» (as the 10 sibling Siapkan refusals and `config.ketuntasan.materi_pintar`) | later |
| **T-05** | Mode labels, two tables on teacher screens | `jenis.mode.TEST` EN «Assessment» vs `mengajar.instrumen.TEST` «Test»; PUBLIC_DEMO «Peragaan publik» vs «Demonstrasi» | «Tes / Test», «Peragaan publik / Public demonstration» (v1) | later |
| **T-06** | School structure in EN admin copy | audit rows «Section/Grade/Class created» against DAISY-05's kept «Kelas · Tingkat · Bagian»; «school year» (34) and «academic year» (11) | Follow DAISY-05; «school year» | later |
| **T-07** | EN «learner» on teacher surfaces | 8 keys (`pengerjaan.galat.sitting_not_allowed`, `…learner_suspended`, `attempt_*`, `atur.izinkan.tidak_ada`, `studio.soal.galat.release_state_not_visible`, `studio.catatan.petunjuk`), against «student» in 287 | «student» | later |
| **T-08** | Attempt and sitting | Studio «Batas percobaan» against «kesempatan» elsewhere (25); EN «session» for a sitting in `mengajar.langkah.f3w`, `siklus.catatan.*`; «pengerjaan» as «attempt» in `sertifikat.belum_ada` | «kesempatan»; «sitting» | later |
| **T-09** | Assessment names untranslated in EN | «Uji Penguasaan» in `mengajar.ulang.belum_uji` and the learner's `pengerjaan.pulih.perlu_izin_isi`; «quick checks (Uji Cepat)» in `staf.tj.can_quick_assessment` | «Mastery Check», «Quick Assessment» | **Z** (3 keys; actually wrong) |
| **T-10** | «Peserta» counting students | `metrik.peserta.label`, `metrik.peserta_institusi.label` (their `.arti` says murid) | «Murid» (v1 D-069(k) keeps «Peserta» for professional learning) | later |
| **T-11** | EN «institution», «educator» | 5 keys «institution» for «sekolah»; 11 «educator» for «guru» against 80 «teacher» | «school», «teacher» (or «teachers and staff» where professional learning means both) | later |
| **T-12** | Minor tail | «classroom card» (3) against «class card» (20); «Kartu PINTAR» lowercased; «wali kelas» as «homeroom»/«class teacher»; one «surel»; a sitting's «batas waktu» as «deadline» against «time limit» | The majority form in each case; «time limit» for a sitting | later |

**Checked and consistent** (examples; the readers' full lists are kept in the session):
- the sign-in identifier and `signin_resolve`;
- username and PIN rules against their checks;
- the class card;
- the session-lock timers;
- «Komputer siapa ini?»;
- the Uji Cepat minutes (10/15/30, within 5–60);
- the Aturan Asesmen hints and units;
- the ketuntasan, role, staff-leave, enrolment, transfer, maintenance and structure limits;
- «Selesai» on the task card;
- «Target tercapai» from `lulus`;
- «Siap untuk Uji Penguasaan»;
- readiness bands;
- corrected and recalculated labels;
- PINTAR ID, email, school, learner and teacher in Indonesian (one term each).

## Anticipation

- **Question 2** (the neighbours) would have caught S-01, S-02 and K-01 at their original reviews. Each is a form or verdict whose *other* fields or causes were not read together.
- Logged as DAISY-SAPU-1 in `ANTISIPASI-4.1.md`.
