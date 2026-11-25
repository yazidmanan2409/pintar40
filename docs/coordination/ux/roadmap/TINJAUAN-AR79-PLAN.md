# Pre-build review of the AR-79 plan (W6): Daisy, 25 Nov 2026

> **What holds now:**
> - **Reviewed:** `docs/post-4.1/AUDIT-79-AR79-PLAN.md` at `627fdaee` (claude/bob-41-master-plan), against the ledger at the same commit.
> - **My parts:**
>   1. AR-C, AR-D and AR-G placement;
>   2. AR-G's word list;
>   3. AR-H's list;
>   4. §3's three fixture rows.
> - **Verdict:**
>   - **The shape is right:** one authority per cause, certificates first, each batch with its dependent screens and journey assertions.
>   - **Required before the freeze:** one withdrawal (L-80), and eleven findings moved to the batch whose authority actually covers them.
>   - **Optional:** three regroupings.
>   - **The word list (§2) is complete for the build.**

## 1 · Placement: required changes

### A finding to withdraw

| Finding | Why | Evidence |
|---|---|---|
| **L-80** (J5-2) | **Resolved on the corrected world.** On the one-chapter world, Ayu's «Layak dikerjakan lebih dulu» names the empty class: «Materi yang diterbitkan sekolah belum disediakan untuk 8C · Siapkan materi». The ledger itself records L-80 «withdrawn as a world artefact» and re-judged. | My J5 walk at `6b248975` (L1 `teacher_home`); the builder's `d41ed05c/j5` L1 |

**L-80 → §3, «withdrawn (world artefact; re-judged on the corrected world)».** It leaves AR-D.

### Findings whose batch doesn't hold their authority

| Finding | Placed in | Should be in | Why |
|---|---|---|---|
| L-49 «dipelajari lagi» vs «baca lagi» | AR-C | **AR-G** | Two words for one concept, not the result in force |
| L-50 the result's last lines run together at 390 | AR-C | **AR-H** | Layout |
| L-51 two page numbers on one lesson screen | AR-C | **AR-H** | Layout and labelling of the reader |
| L-52 the five-step dots unlabelled at 390 | AR-C | **AR-H** | Layout and accessibility (shared step component) |
| L-15 the SD tour promises «what you have mastered and what to practise» | AR-C | **AR-G** | A promise in words (principle 4), with L-31 and L-158. The fix is the tour's wording, not the result |
| L-60 the retake request only in «Atur», not on the learner's record | AR-C | **AR-E** | C-8 (who notices isn't where they can act), the same authority as L-71 |
| L-90 old ✓ confirmations pile up | AR-D | **AR-F** | Form feedback state, not «waiting for you» |
| L-97 the «—» legend false for privacy-withheld rows | AR-D | **AR-G** | A legend's words: two reasons share one mark (C-6). The privacy reason is already decided |
| L-98 «dari 10» unexplained | AR-D | **AR-G** | Words |
| L-101 «Mulai sekarang» without naming its effect | AR-G | **AR-E** | A consequential action offered without its effect named (C-7), like J7-1's confirmation |
| L-104 «Akhiri tanpa menghitung» ends without asking | AR-G | **AR-E** | The same: its sibling «Akhiri dan nilai» asks; this one must too |

### Optional regroupings (the authority covers them as placed; these read better together)

- **L-47, L-118, L-119: one authority, «how this sitting ends».** «sisa 259191 menit», the learner not told the Uji Cepat window, and «Tambah waktu» on an untimed sitting all come from one fact: does the sitting end by its own timer, or by its schedule's close? I suggest they sit together in **AR-C** (L-118 is already there; L-119 is in AR-E). One read answers «ends at {time} by its timer» or «open until the schedule closes {date}». The row text, the learner's start page and the «Tambah waktu» offer all read it.
- **L-84 («Terima» gives no line) → AR-F.** Its fix is an announced status line, which is AR-F's authority. Its words are in my list.
- **L-91 (Kelas added one per submission):** an effort finding, not a wording one. Better **AR-F** (a multi-add form) or §3 as a feature. Not AR-G.

### Checked and right as placed

- **AR-C:**
  - L-14, L-33, L-43, L-46, L-48, L-54, L-55, L-56, L-57, L-59, L-61, L-63, L-64, L-74, L-118, L-141;
  - L-121 (two timestamps for one Uji Cepat is a source question, not only a format question).
  - **Note:** the verdict rows (L-33, L-48, L-61, L-74) take their words from §2 below.
- **AR-D:** L-45, L-58, L-69 (the three C-4 sightings), and L-83 (the package head names the step and counts waiting AI drafts, with L-143).
- **AR-G:** L-17 to L-25, L-31, L-32, L-34, L-65, L-72, L-73, L-85, L-89, L-92, L-93, L-95, L-100, L-135 to L-138, L-140, L-145, L-146, L-158.
  - **L-85 (showing the AI allowance) needs Sharon's decision first.** I raised that in J6-3.

## 2 · AR-G's word list (before the build)

One name per concept, ID and EN. A word not in this list keeps what the lookup already has.

### Concepts (L-17 to L-25)

| Concept | ID | EN | Never in the UI | Ledger |
|---|---|---|---|---|
| What a report row measures, at the finest level | **tujuan pembelajaran** | **learning objective** | «topik», «bagian» (collides with the school's Bagian), «bidang kompetensi» | L-17 |
| A group of objectives | **ranah** | **domain** | «bidang», «topik» | L-17 |
| The chapter a class is given, which has a pass mark | **bab** | **chapter** | «materi» for the unit with the pass mark; «pelajaran» for it | L-18 |
| A part of a chapter | **pelajaran** | **lesson** | — | L-18 |
| The authoring artefact in Studio | **Paket Pembelajaran** | **learning package** | — | — |
| What is printed on the certificate | **Materi Pembelajaran** (certificate and public check only, as D2-R) | **learning material** | — | — |
| Assessment kinds | Pemetaan Awal · Uji Penguasaan · Uji Cepat · Latihan · Asesmen Mandiri · Tes · Ujian · Tes di Kertas · **Peragaan publik** | Initial Mapping · Mastery Check · Quick Assessment · Practice · Self-Assessment · Test · Exam · Paper Test · Public Demonstration | «Demonstrasi»; EN «Assessment» for «Tes» | L-19 |
| School structure | Bagian · Tingkat · Kelas | Section · Grade · Class | — | L-20 |
| The school year | **tahun ajaran**, written «2026/2027» | **school year**, written «2026/2027» | «academic year», «2026/27» (also L-89) | L-20, L-89 |
| The person learning | murid | **student** | EN «learner» (internal docs only) | L-21 |
| One go at an assessment, counted | **kesempatan** («Kesempatan ke-2», «Batas kesempatan») | **attempt** («Attempt 2», «Attempt limit») | «percobaan» in the UI | L-22 |
| The act of working one go, open or finished | **pengerjaan** | **sitting** | EN «session» for a sitting (a session is a sign-in) | L-22 |
| A count of students on leaders' pages | **murid** | **students** | «Peserta» | L-23 |
| School / teacher | sekolah / guru | **school** / **teacher** | EN «institution», «educator» | L-24 |
| The class card | **kartu kelas** | **class card** | «classroom card» | L-25 |
| The personal card | **Kartu PINTAR** (capital K) | **PINTAR card** | «kartu PINTAR» | L-25 |
| The homeroom teacher | **wali kelas** | **homeroom teacher** | «class teacher» | L-25 |
| Email | **email** | email | «surel» | L-25 |

### Verdict words, per `bersertifikasi` (L-33, L-48, L-61, L-74)

One word for one verdict, on every surface (learner, teacher, head, admin, card).

| The assessment | Verdict | ID | EN |
|---|---|---|---|
| Certifying Uji Penguasaan (`bersertifikasi`) | met | **Lulus** | **Passed** |
| | not met | **Belum lulus** | **Not passed yet** |
| | can't be decided (W8) | **Belum dapat ditentukan** | **Can't be decided yet** |
| Not certifying | met | **Mencapai target** | **Reached the target** |
| | not met | **Belum mencapai target** | **Not yet at the target** |

- **Staff rows add the figure after the same word:** «Lulus · 83% (target 60%)» / «Passed · 83% (target 60%)». The word comes first, never the figure alone.
- **The learner's chapter card:** «Selesai · Lulus», «Selesai · Belum lulus», or the non-certifying pair. That replaces «Selesai · target tercapai» (L-33).
- **«tercapai» alone is retired.** «kriteria kelulusan» stays the certificate's and the result's own phrase (D2-R).

### L-31 · the response-time promise (principle 4; ruling 90)

- **No time promise until a fact supports it** (PR-12 and PR-15 open). «Laporkan masalah» says only what is true (D2R-KATA §10):
  - `lapor.langkah.awal`: «Laporan ini sudah tersimpan. Admin sekolah Anda dan tim PINTAR dapat membacanya.»
  - EN: «This report is saved. Your school admin and the PINTAR team can read it.»
  - The class-stopping variant stays as written (`lapor.langkah.awal_kelas`).
- **«dalam satu hari sekolah» and «hari sekolah yang sama» are removed.**
- **When a measured response time exists,** one line, read from that fact: «Biasanya ditanggapi dalam {n} hari sekolah.» / «Usually answered within {n} school days.» Never a fixed promise.

### Words for findings moved or kept in AR-G (already in their TEMUAN rows)

- **L-15 (tour step 6):** «Di Hasil kamu bisa lihat bagian mana yang sudah bisa dan mana yang perlu dibaca lagi.» (SD register, with L-158). For SMP and above, keep «Anda»: «Di Hasil Anda melihat bagian yang sudah dikuasai dan yang perlu dibaca lagi.»
- **L-97:** two marks. «—» means «belum cukup data»; «tidak ditampilkan» carries its reason inline («dikerjakan kurang dari 10 murid»).
- **L-98:** «rata-rata dari 10 murid» / «average of 10 students».
- **L-84 (wherever it lands):** «✓ Soal {n} diterima.» / «✓ Question {n} accepted.», announced.

## 3 · AR-H's list

The list is right. Fixing in shared components is the right authority (L-01, L-03, L-05, L-07 are app-wide). **Add from §1:** L-50, L-51, L-52.

**Two notes for the verification:**
- **L-01 (links told by colour alone) is Significant and WCAG 1.4.1.** Verify it on every surface with a link in running text, not only on the changed pages.
- **L-39 to L-42 and L-53 are the owner's own observations** (the /konfigurasi sidebar). The decisions are in `SIDEBAR-KONFIG-CATATAN.md`:
  - K-1: the chevron pinned right, with the sibling sweep;
  - K-2: two rows;
  - K-3: a neutral outline at `--line-control`, 3.4:1;
  - K-4: a text switch «ID · EN».
  - **Apply them to the learner and teacher chrome too** (L-53: mobile against desktop), so the chrome is one component.
- **Already placed elsewhere, accessibility-relevant:** L-103 (AR-A), L-107 (AR-A), L-144 (AR-E). Each batch's screen-reader pass covers them, as the plan says.

## 4 · §3: L-08, L-11 and L-12 walked with fixtures

Agreed. For each, what the fixture must hold and what I'll judge:

| Finding | Fixture | Judged against |
|---|---|---|
| L-08 (four empty states never seen) | An Uji Cepat result with no rows (W11); a certificate list with no rows (W14); `/studio/tinjau/kunci` with no pending correction (W14); Studio's package page beyond N-8 (W12) | Each empty state says what is missing and what makes it appear (the J8 holds pattern); none says «Belum ada.» bare (L-92) |
| L-11 (the integrity count line) | A sitting set aside by an integrity reviewer's downward override (the builder confirmed this exists at a real school; L-134) | The count line names no learner and no reason to the teacher (Sharon's L-134 binding), and reads with L-134's «yang dapat dihitung» words |
| L-12 («Materi tanpa judul») | An assignment whose package has no title | The fallback reads as a placeholder the teacher can act on: «Bab tanpa judul · ubah di Studio» for staff. **Never shown to a learner;** the learner sees the subject and class instead |

**A finding from any of the three opens a row and is placed by the same rules** (the plan says so).

## 5 · One rule I'd add to §4 (optional)

**Words before code for every batch:** the batch's new or changed strings go into the lookup, ID and EN, as one reviewed commit, before its UI work starts. My verification then checks the screen against an agreed text, not a moving one. This is the CI-1 and CI-2 practice (KATA files first).
