# Batch 0 · Deliverable 8 · Terminology brief: Dr Gladys's universal terms and frozen Terminology v1 (2 Nov 2026)

**Correction 6 of the 2 Nov authorisation.** Nothing in this brief is implemented. No wording is changed, and the institution model is not broadened.

**Where the proposal comes from:** it reached the project through the owner's 2 Nov message. **It is not yet recorded in the repository.** No file holds «Materi Pembelajaran», and no decision row records her list. This brief is therefore the first written record of it. It must be confirmed in writing by Dr Gladys before it can be treated as a proposal (§5).

## 1. The conflict in one sentence

Terminology v1 (D-068, frozen 30 Sep; the dictionary is in `docs/coordination/ux/TERMINOLOGY-V1-FREEZE-PACKAGE.md` §1) lists «institusi», «pendidik» and «peserta didik» as **Replace** terms, to become **Sekolah**, **Guru** and **Murid**.

Dr Gladys's proposal makes three of those Replace terms canonical again. It **reverses** approved v1 rows. It does not fill gaps.

D-134(d) allows exactly this («Dr Gladys's review, when it comes, may amend v1 like any later ruling»). But it is a change to a frozen decision, so the owner rules on it under D-068: a change to a canonical term is the owner's to make.

## 2. Term by term

| Concept | Frozen v1 | Her proposal | Change? | Size of change in the copy (`src/lib/hle.ts`, ID) |
|---|---|---|---|---|
| Institution | **Sekolah** | Institusi | **Reverses v1** | «sekolah» in **193** strings |
| Leadership (umbrella) | **Pimpinan** | Pimpinan | **None**: already canonical. The roles under it stay **Kepala departemen** and **Dekan** | — |
| Educator | **Guru** | Pendidik | **Reverses v1** | «guru» in **54** strings |
| Learner | **Murid** («Peserta» kept for a measurement participant, D-069(k)) | Peserta Didik | **Reverses v1**. It also collides with «Peserta», which has a different meaning | «murid» in **139** strings |
| Administrator | **Admin sekolah** · **Admin platform**; in help: «yang mengurus PINTAR di sekolah Anda» | Admin | **Partial**: the word stays; she drops the qualifier. Without «sekolah»/«platform», the two admin roles (different powers) become indistinguishable on screen | 29 + 19 strings |
| Learning material | **Materi**; the Studio object is **Paket Pembelajaran**, kept distinct from materi; workbook level **Kursus · Bab · Pelajaran · Bacaan** | Materi Pembelajaran | **Unclear**: it could mean «Materi» (a lengthening), or replace «Paket Pembelajaran» (merging two concepts v1 kept apart) | materi 71; paket pembelajaran 5 |

**Also affected and not named in her list:**
- the routes `/belajar`, `/mengajar`, `/pimpinan` and `/edukator` (`/edukator` already uses a v1 Replace word);
- the six role labels (`hle.ts` 3362–3367);
- the English copy: school 205, teacher 34, student 38, learner 26.

## 3. What a change would touch

| Surface | What carries the words | Change if adopted |
|---|---|---|
| (a) **Screen copy** | `src/lib/hle.ts` only (D-014: every visible word lives there). Most affected: `pimpinan.*` (88 keys), `studio.*` (60 of 386), `pendataan.*` (14), `laporan.*` (13), `email.*` (5), `aktifkan.*` (5), `sertifikat.*` (1) | Copy edits plus their guards. A selftest guards the v1 Replace list; it would need re-pointing |
| (b) **Addresses** (routes) | `/mengajar/[kelas]/murid`, `/pimpinan/[simpul]/murid`, `/edukator/ringkasan` and others | **No change needed.** URLs are not terminology (freeze package §4), and changing them breaks bookmarks and the J-designs |
| (c) **Data and schema** | `app_role` (STUDENT, EDUCATOR, HEAD_OF_DEPARTMENT, DEAN, INSTITUTION_ADMIN, SYSTEM_ADMIN); `org_kind` (INSTITUTION … CLASS); table `institutions` | **No change.** The schema already uses universal English identifiers; only the display layer says Sekolah, Guru, Murid |
| (d) **Printed documents** | Certificate (prints the institution's own name; one term string); reports («Ringkasan Sekolah» and 12 `laporan.*` keys; report titles are already on her pending list, D-135(e)); the PINTAR card (not built; the D-074 designs name each role) | Copy edits. The card and certificate designs (F-11) would need the new names before print proofs |
| (e) **Onboarding workbooks** | `docs/onboarding/PINTAR-Isian-Data-Sekolah.xlsx` (sheets «Staf», «Murid»; headers «Sekolah», «Kelas diajar», «Wali kelas»); the content workbook template; the import contract `src/lib/unggah-kontrak.ts` | Header changes. The importer must then accept both old and new headers, or schools holding the old template break |

## 4. The institution model: a label change does not broaden it

**What the model supports today:**
- PINTAR's data model has **no institution type**. `institutions` holds name, slug, is_synthetic and retention_days.
- `tenant_kind` only separates a school tenant from PINTAR's own content tenant.
- «Konteks» (Akademik, Pengembangan profesi) belongs to a **course**, not to an institution.
- The organisation tree is generic (INSTITUTION → FACULTY → DEPARTMENT → PROGRAMME → COHORT → CLASS). D-006 maps a **school** onto it, hiding the levels a school does not have.
- The product, onboarding, copy (Tingkat, Kelas, tahun ajaran, Wali kelas, NIS/NISN) and every test are school-only.

**The consequence:** «Institusi · Pendidik · Peserta Didik» would tell a university, a training centre or a madrasah that PINTAR supports them. It does not. Nothing defines or tests their structure, roles, calendar or identifiers.

**The authorisation forbids broadening the supported institution model by changing labels.** So if the universal words are adopted, the owner must also decide one of two things:
- (i) the words are adopted **as wording only**, and PINTAR remains for schools; or
- (ii) a broader institution model is a **new scope item** (4.5/5.0), with its own requirements.

Option (ii) is outside approved 4.0 (D-142).

## 5. Decision request: for Dr Gladys, in writing

*To be sent by the owner. It is written to be answered in writing, without a walkthrough. Her time is used for terminology only (F-13).*

> **Bu Gladys, terima kasih atas usulan istilahnya.** PINTAR saat ini memakai Terminologi v1 (dibekukan 30 September), yang sengaja memakai kata sekolah: **Sekolah, Guru, Murid, Admin sekolah, Admin platform, Materi / Paket Pembelajaran**. Usulan Ibu (**Institusi, Pimpinan, Pendidik, Peserta Didik, Admin, Materi Pembelajaran**) akan mengganti sebagian kata itu. Agar kami menerapkannya dengan tepat, mohon jawaban tertulis untuk enam pertanyaan berikut:
>
> 1. **Cakupan.** Apakah PINTAR 4.0 tetap untuk **sekolah saja**? Jika ya, apakah kata umum (Institusi, Pendidik, Peserta Didik) tetap Ibu inginkan di layar sekolah, atau usulan ini untuk tahap ketika PINTAR melayani jenis lembaga lain?
> 2. **Peserta Didik dan «Peserta».** PINTAR memakai «Peserta» untuk orang yang mengikuti pengukuran (termasuk Guru yang sedang belajar). Jika murid menjadi «Peserta Didik», kata apa untuk arti yang kedua?
> 3. **Admin.** Ada dua peran admin dengan wewenang berbeda: admin di sekolah dan admin seluruh platform PINTAR. Apakah keduanya cukup «Admin», atau tetap dibedakan (mis. «Admin institusi» dan «Admin platform»)?
> 4. **Materi Pembelajaran.** Apakah ini pengganti «Materi» (isi yang dipelajari), atau juga pengganti «Paket Pembelajaran» (berkas yang diunggah, ditinjau, dan diterbitkan di Studio)? Saat ini keduanya sengaja dibedakan.
> 5. **Peran pimpinan.** Di bawah «Pimpinan», apakah «Kepala departemen» dan «Dekan» tetap dipakai, atau ada nama lain?
> 6. **Dokumen cetak dan templat.** Apakah istilah baru juga berlaku pada sertifikat, kartu PINTAR, laporan, dan templat Excel pendataan (kolom «Murid», «Staf», «Kelas diajar»)?
>
> Pertanyaan istilah lain yang masih terbuka (OP-6, OP-7, enam kata konteks, daftar L4 §4) kami kirim dalam lampiran yang sama.

## 6. Recommendation to the owner

1. **Keep v1 in force until she answers in writing** (D-134). Nothing changes on screen meanwhile.
2. Send §5 together with the existing F-13 questions as **one** written request.
3. **If she confirms the universal words for schools:**
   - record a decision amending D-068;
   - change copy only (hle.ts, the printed documents and the workbook headers, with the importer accepting both);
   - leave routes and schema unchanged;
   - this fits Batch 7 (words and accessibility, plan E) without moving the critical path.

   Estimate: about 2–3 engineering days, plus re-running the copy guards and the journeys.
4. **If she means a broader institution model:** record it as out of 4.0 scope (D-142), to be planned for 4.5/5.0.
