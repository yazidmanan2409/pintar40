# PINTAR Terminology v1: proposal

**Status: PROPOSED by Yazid, 30 Sep 2026. Not canonical.** Nothing here changes a string. It becomes PINTAR Terminology v1 only when Yazid freezes it after the change-impact review. Until then, the canonical rules stay:

- D-014: all words live in `src/lib/hle.ts`, and Daisy owns the wording;
- D-006, D-007, D-008, D-010 and D-015, below.

**Evidence base:** Daisy's inventory, `ux/PINTAR-4.0-TERMINOLOGY-INVENTORY.md`, refreshed to `main` `4df914a` on 29 Sep. It is evidence only: its families group words that look alike, and it does not claim they mean the same thing.

**Process (Yazid):**

1. The coordinator, or Daisy, maps this proposal onto the real strings as a change-impact list only: `TERMINOLOGY-V1-CHANGE-IMPACT.md`. No implementation.
2. Yazid and the coordinator review it (yes / no / adjust).
3. Yazid freezes Terminology v1.
4. It goes to Daisy as part of her design constitution (`design/PINTAR-DESIGN-SKILL-SPEC.md`). She applies it during UI/UX POLISHED.

**The rule she is given:** "These are PINTAR's words. Use them consistently. If they don't work on a real screen, raise the problem; don't quietly invent another word."

## 1. Overall judgement

PINTAR does not need a rewrite of its language. It needs a controlled normalization pass.

Much of the Bahasa already has the conversational, human quality wanted. The problem is that several core concepts gathered synonyms as PINTAR evolved:

- murid / siswa / peserta didik;
- guru / pengajar / pendidik;
- materi / kursus / isi / paket / bahan / kurikulum / konten.

Preserve PINTAR's plain Bahasa. Normalization must not turn it into bureaucratic prose. *Murid. Guru. Sekolah. Soal. Materi.* Simple words.

## 2. The proposed dictionary

| Concept | Canonical UI term | Treatment of alternatives |
|---|---|---|
| School | Sekolah | Remove *institusi* from ordinary UI. Keep it only where genuinely technical or legal. |
| Learner | Murid | Replace *siswa*, *peserta didik*, *peserta* where they mean a PINTAR learner. |
| Teacher | Guru | Replace *pengajar*, *pendidik*, *edukator* in user-facing role language. |
| Leadership umbrella | Pimpinan | Keep *Kepala departemen* and *Dekan* when naming the actual role. |
| School administrator | Admin sekolah | Replace *administrator sekolah*, *pengelola data sekolah* and similar when they mean that role. |
| Platform administrator | Admin platform | Replace *pengelola sistem*, *administrator* and similar when they mean that role. |
| Person | Orang | A human record or person. |
| Account | Akun | Login and account identity only. *Orang* and *akun* are different concepts; do not merge them. |
| Class | Kelas | Preserve D-006's structure vocabulary. |
| Structural section | Bagian | Preserve as the structural concept. Avoid it in ordinary prose where it could read as "part". |
| Structural level | Tingkat | Preserve. |
| Learning material | Materi | The general teacher- and student-facing word for what is learned or provided. |
| Importable or publishable container | Paket Pembelajaran | The authored or published container in Studio. |
| Chapter | Bab | Preserve. |
| Lesson | Pelajaran | Preserve. |
| Reading | Bacaan | Only where it really is a reading, not as a synonym for lesson. |
| Question | Soal | The default assessment-question term. Keep *pertanyaan* for genuinely conversational questions or prompts. |
| Publish | Terbitkan / diterbitkan | Keep. |
| Release | Terbitan | Keep, as the immutable, versioned published object where needed. |
| Approval | Setujui / persetujuan | Keep. |
| Save | Simpan / tersimpan | The canonical persistence language. |
| Loading | Memuat… | For page or data loading. Use *Sedang…* for an actual ongoing operation. |
| Quick assessment | Uji Cepat | Already canonical (D-015). |
| Initial assessment | Pemetaan Awal | Everywhere for PRE_TEST. |
| Mastery assessment | Uji Penguasaan | Everywhere for POST_TEST. |
| Standalone assessment | Asesmen Mandiri | Prefer over *Penilaian mandiri*. |
| Paper mode | Tes di Kertas | Prefer over *Lembar kertas* when naming the assessment mode. |
| Evidence | Bukti | Evidence supporting conclusions. |
| Results | Hasil | Learner and assessment outcomes. |
| Report | Laporan | An assembled reporting artefact. |
| Figure | Angka | Displayed calculated figures, where already established. |
| Readiness | Kesiapan / Siap / Belum siap | Grammatical variants, not collisions. |
| Feedback | Umpan balik | Keep. |
| Feedback cycle | Putaran umpan balik | *Putaran* alone only where the context is already obvious. |
| Sign in | Masuk | Keep. |
| Sign out | Keluar | Keep, but say *Keluar dari peragaan* where it does not sign the user out. |
| Email | Email | Use *email*, not a mix of *email* and *surel*. |
| Configuration | Konfigurasi | Keep, for the admin workspace. |
| Intake | Pendataan | Keep, for adding or importing people and records. |
| Settings | Pengaturan | Only for actual settings; not a synonym for *Konfigurasi*. |

**The proposed first vocabulary:**

- Sekolah
- Murid · Guru · Pimpinan · Kepala departemen · Dekan · Admin sekolah · Admin platform
- Orang / Akun (deliberately distinct)
- Bagian / Tingkat / Kelas
- Paket Pembelajaran / Materi / Kursus (deliberately distinct, §3)
- Bab / Pelajaran / Bacaan
- Soal
- Pemetaan Awal · Uji Penguasaan · Uji Cepat · Asesmen Mandiri · Tes di Kertas
- Bukti / Hasil / Laporan / Ringkasan / Angka (distinct concepts, not synonyms)
- Pendataan · Konfigurasi · Email · Masuk / Keluar
- Simpan / Tersimpan · Terbitkan / Terbitan · Setujui / Persetujuan
- *Periksa* for checking; *Tinjau* for human review
- Siap / Belum siap / Kesiapan

## 3. Distinctions to preserve

Consistency does not mean flattening distinct concepts. These pairs stay apart:

- orang ≠ akun
- materi ≠ Paket Pembelajaran
- hasil ≠ bukti
- laporan ≠ ringkasan
- peran ≠ wewenang
- simpan ≠ selesai

**Content boundary:**

- **Paket Pembelajaran** = the Studio object or container.
- **Materi** = what a teacher provides and a learner learns.
- **Kursus** = the import or workbook schema term, only where the format genuinely requires it (D-007's sheet «Kursus»).

Do not globally replace *kursus* with *Paket Pembelajaran*.

## 4. Priorities named in the proposal

1. **Assessment vocabulary, normalized completely.** The same stored value currently carries different names on different surfaces (inventory F18, F19). The mapping:
    - PRE_TEST → Pemetaan Awal
    - POST_TEST → Uji Penguasaan
    - QUICK → Uji Cepat
    - STANDALONE → Asesmen Mandiri
    - PAPER → Tes di Kertas
2. **Role names made boringly consistent:** Murid · Guru · Kepala departemen · Dekan · Admin sekolah · Admin platform, with *Pimpinan* as the umbrella experience for Kepala departemen and Dekan. Refusal pages currently use role words found nowhere else (inventory §3.5 G).
3. **Paket Pembelajaran / materi / kursus**, bounded as in §3.

## 5. Navigation grammar (proposed)

Navigation labels and page H1s do not have to match mechanically. For example, the tab «Pimpinan» opening a page headed «Apa yang menunggu Anda» is good UX: the navigation answers "where am I going?", the heading answers "what matters here?".

- **Navigation destination:** a short noun or name.
- **Page heading:** a human question or a purpose is allowed.
- **Action:** a verb plus its object.
- **Back:** name the destination where there is ambiguity; plain «Kembali» where there is none.

What does need correcting is one destination with too many identities. `/belajar` alone is «Belajar», «Pembelajaran Saya», «Saya mau belajar», «Beranda», «Kembali ke Belajar» and «Pembelajaran Anda» (inventory Table 3).

## 6. Button language

The action vocabulary is already healthy: Simpan, Kembali, Mulai, Buat, Periksa, Lanjutkan, Kirim. Do not normalize these beyond their meaning.

The proposal links them to interaction states, **intent → processing → resolution**:

- Simpan → Menyimpan… → Tersimpan
- Kirim → Mengirim… → Terkirim
- Periksa → Memeriksa… → the result
- Terbitkan → Menerbitkan… → Diterbitkan

(Recorded as open doctrine in `design/PINTAR-DESIGN-SKILL-SPEC.md`, not a ruling.)

## 7. Defects, not wording (the coordinator's check against the code, 30 Sep)

The proposal names three items as defects rather than terminology. Their current state:

1. **English that is never shown.** At `4df914a`, 203 rendered strings have an English telling that no screen displays, because every call passes no language (199 at `15bfc99`). 18 more are shown in English on some screens only (inventory §1, "English that exists but is never displayed"). This is a rendering-consistency defect, not wording. It is not placed yet.
2. **A teacher's Uji Cepat opening as «Uji Penguasaan» on the learner side:** **already fixed** by DAISY-26. The learner's cycle action maps QUICK to `ujicepat.title` (`src/components/siklus/aksi.ts:44`), and the inventory records it resolved (A25). The «Uji Penguasaan» title was the `15bfc99` state.
3. **Topic rows on the teacher's evidence page:** **partly fixed.** They no longer read «—": DAISY-25 passes the content's own label (`src/components/bukti/BarisKesiapan.tsx:14-19`). But the label is the learning-objective code (e.g. `MTK5-P1`), not a name (inventory §1.2). Since BOB-37 is on `main`, these rows now appear (audit #52, S22), so teachers see codes. The learner's result already names rows by the objective's statement (DAISY-29). The same treatment on the teacher's page is a UI/UX POLISHED item: the meaning is correct, the label is an identifier.
