# B1 / C2 evidence completion, round 2: from a clean baseline (4 Nov 2026)

**Authority:** owner, 4 Nov, «PINTAR 4.0 — OWNER RULING: LOCAL REPRODUCTION COMPLETION — GO».

**Boundaries kept:**
- the disposable local stack only; synthetic people and data only;
- no application code, schema, staging or production change, and no repository tooling;
- the setup, the walk and the probe scripts live in the coordinator's scratchpad.

**Verdict: B1 and C2 stay provisional.**
- Daisy has not yet pushed corrections for the four differences of round 1. Her branch is still at `d9a27652`, so there are no corrected specimens to lay beside.
- This round adds **two new differences for C2** (§3.3) and **one new question for C1** (§3.4).
- Every boundary check holds (§4).

## 1. The clean baseline

| Check | Result |
|---|---|
| Target | the local CLI stack (`127.0.0.1:54322`, project `pintar40`); `supabase db reset` without `--linked` touches no remote project |
| Before the reset | 6 `wp2-*` users, 9 WP2 nodes (the stray `selftest.wp2_school()` world), the round-1 PD class and its directly inserted course |
| Reset | `npx supabase db reset`: «Reset local database.» |
| After the reset | 0 `wp2-*` users, 0 WP2 nodes, no PD class or course |
| The demonstration school after the whole round | every one of its nodes and grants is stamped with the seed's instant (02:04:56 UTC); nothing was written there |
| Seeds and helpers | not modified |

## 2. BOB43-D01 from the clean baseline

**PASS**, run once, before any scenario was built:

> «… PD sessions reach the participant, facilitator, PD Bagian head, Dekan and Admin sekolah only, progress not Admin sekolah, answers and signals no school role, referral refused for everyone and review for school roles; … the record gives the facilitator, Dekan and PD head progress and the 0.92 result through MC-5, Admin sekolah completion only, and refuses everyone else; … no figure at the PD Kelas»

After it ran there were still 0 `wp2-*` users: it rolled back as designed.

**This confirms the round-1 diagnosis.** The local `GRANT_ALREADY_ACTIVE` failure came from the coordinator's stray helper call, not from the product.

## 3. C2: the PD Kelas, with an assessment in progress and one handed in

### 3.1 How the scenario was made: the normal product workflow, each step as its own synthetic user

- **The place** (product functions as Admin Alpha): the Bagian for educators, its Tingkat, «Kelas PD Sintetis»; Guru Alpha the facilitator; Kaprodi and Dekan Alpha enrolled.
- **The course, through Studio's screens:**
  - Guru Alpha downloaded «Unduh contoh isian», gave it a synthetic title «Strategi Bertanya (sintetis)» and the course sheet's «Konteks» «Pengembangan profesi», and uploaded it («Buku kerja lolos pemeriksaan», «Tersimpan di Studio sebagai draf»);
  - then «Tandai sudah tersusun», «Tandai lolos pemeriksaan», «Ajukan untuk ditinjau»;
  - Kaprodi Alpha «Setujui isi», «Kunci terbitan»;
  - Admin Alpha «Terbitkan» («✓ Diterbitkan») and the pass mark, 70%.
- **The two assessment definitions** (Pemetaan Awal, Cek penguasaan) came with the package and were approved with its content.
- **Siapkan:** Guru Alpha, on the PD class's Siapkan, which offered only this course: «✓ Disediakan».
- **Dekan Alpha** (context BELAJAR) did Pemetaan Awal → Peta Bacaan → the lesson → Uji Penguasaan, «Kumpulkan»: «PENGUASAAN 100% … Target tercapai.»
- **Kaprodi Alpha** handed in the Pemetaan Awal, started the Uji Penguasaan, saved one answer and did not hand it in.
- **No direct write** to a session, a response, a result, a grant or a policy. Database reads were made to check, never to make.

### 3.2 What the real screens show (`c2b-pd-bukti-fasilitator-*.png`)

**«Keadaan hari ini», as built, matches Daisy's `pd` specimen in structure:**
- per assessment, «Mengumpulkan 2 / 2» or «1 / 2», «Jendela», «Sudah mulai, belum mengumpulkan **1 peserta**», «Belum mengerjakan **0 peserta**»;
- the people are «peserta».

**«Lihat nama murid» is confirmed live,** twice (one per assessment). It is the defect Daisy found; her «Lihat nama peserta» is right.

**«Kesimpulan» is still the five academic «not yet» cards** with «Sekarang 0 murid; perlu 5.», as in round 1. Her composition replaces them.

**«Lihat nama murid» → `/siapa` (`c2b-ikut-siapa-1280.png`):** «PESERTA», the two participants alphabetically, «Sudah mengumpulkan» / «Sudah mulai, belum mengumpulkan». No figure.

### 3.3 New differences for Daisy (C2)

1. **«Lihat per soal» is offered on a PD Kelas, and it leads to the refusal page** for the facilitator (`c2b-ikut-soal-1280.png`: «Halaman ini belum tersedia untuk akun Anda.»).
   - The boundary is right: the facilitator reads **0** of the participant's answers (§4).
   - But the page offers a link that always refuses. Her composition keeps the link («C2 neither adds nor removes those links»), and the PD page should not offer it.
   - Engineering's E-C2-3 is updated: the per-question page refuses, so the build hides the link on a PD Kelas.
2. **(From round 1, still open) the footnote** «Keduanya ditinjau Kepala departemen, bukan guru» is false for a PD Kelas (D-069(c)).

Also seen, not a C2 difference: the `/siapa` names link to `/mengajar/[kelas]/murid/[orang]`, a route named «murid», for a participant. That is for engineering's word check (E-C2-1 widened to the route's page).

### 3.4 New question for C1 (owner, then Daisy)

**Ringkasan Kelas opened on a PD Kelas** (`/edukator/ringkasan?kelas=…`, `c2b-ringkasan-kelas-*.png`), as the facilitator and as Admin sekolah:
- it lays out the **six academic class metrics** (Peserta, Pemahaman, Kenaikan, the bands, Penguasaan per topik, the misconceptions);
- each is «not yet», with «Sekarang 0 murid; perlu …».

No value is computed or shown, so no figure is disclosed. But the report presents academic metrics and «murid» for a class of educators. C1 has no PD state.
- **Whether a PD Kelas has a Ringkasan Kelas at all is the owner's question** (D-070(h) rules «Lihat bukti», not the report).
- If it has one, its presentation is Daisy's.

### 3.5 What could not be reached, and why

**A participant's result shown on the record.**
- The result field is in the facilitator's and the Dekan's record (`columns: FULL`, the `result` key), and absent from Admin sekolah's (`columns: COMPLETION`).
- But its value is empty. The synthetic school's evidence is `evidence_class SYNTHETIC`, and the official result (MC-5) counts only official evidence.
- So a synthetic school cannot show a result through the product, **by design**, and the coordinator did not manufacture one.

The visible result is proven by BOB43-D01 instead: the 0.92 result for the facilitator, the Dekan and the PD head; Admin sekolah completion only.

## 4. Boundary checks, live, as each person's own signed-in session (read-only; `probe-batas.json`)

On Dekan Alpha's handed-in Uji Penguasaan:

| Reader | Result row | Answers | Presented questions | Integrity signals | Session row | Record | `metric_evaluate('learner.result')` |
|---|---|---|---|---|---|---|---|
| **Admin sekolah** | **0** | **0** | **0** | 0 | yes (status and timestamps only: completion) | `COMPLETION`, **no `result` key** | **`not_permitted`** |
| **Facilitator** (Guru Alpha) | 1 (D-069(b): result/score) | **0** | **0** | 0 | yes | `FULL`, with `result` | `below_minimum` (synthetic evidence) |
| **Kaprodi Alpha** (not over the PD Bagian) | **0** | **0** | **0** | 0 | none | **refused**, `PR090 PD_RECORD_NOT_ALLOWED` | **`not_permitted`** |
| **Dekan Alpha** (the participant herself, and the Dekan) | 1 | 2 (her own) | 2 (her own) | 0 | yes | `FULL` | `below_minimum` |

- **`generate_report`** (the class template at the PD Kelas, the school template at the school), for every reader: no value, every entry `below_minimum` or `not_permitted`.
- **The screens agree with the database** (`c2b-catatan-*.png`):
  - the facilitator and the Dekan see «Pelajaran selesai» (progress);
  - Admin sekolah sees enrolment, participation and completion, and the line «Kemajuan dan hasil hanya untuk fasilitator, Kepala departemen dan Dekan.»;
  - Kaprodi Alpha is refused.
- **Integrity signals:** none was raised in this scenario; making one requires the engine, not a direct write. D-069(c) is proven by BOB43-D01 (`sinyal_kaprodi_pd 0`, `sinyal_admin 0`; only Admin platform).

**Conclusions:**
- Admin sekolah cannot retrieve an individual PD result through any of these routes.
- The facilitator cannot retrieve participants' answers: the table read returns 0, and the per-question page refuses.
- Academic class metrics compute nothing for the PD Kelas.

## 5. B1 from the clean baseline (`b1b-konfigurasi-platform-*.png`)

The same as round 1:
- the «PINTAR» eyebrow, «Lingkungan development», «Kelas aktif 0», the section menu;
- «Laporan masalah» with «staf sekolah Anda»;
- **«Perpindahan murid» shown to Admin platform**;
- the platform navigation without «Studio».

«Yang menunggu» is absent because nobody waits on the fresh seed (as built: the panel shows only when someone waits). **The three round-1 differences stand.**

## 6. Remaining differences and their owners

| # | Item | Difference | Owner |
|---|---|---|---|
| 1 | C2 | The footnote names the Kepala departemen as reviewing PD integrity signals (D-069(c)) | Daisy (words: Dr Gladys) |
| 2 | C2 | «Lihat per soal» offered on a PD Kelas, leading to a refusal | Daisy; engineering E-C2-3 |
| 3 | C2 | «Lihat nama murid» (already in her composition as «Lihat nama peserta») | Daisy (done in composition); engineering E-C2-1 |
| 4 | B1 | «Perpindahan murid» dropped for Admin platform | Daisy; if it should go, the owner |
| 5 | B1 | «Studio» in her platform navigation | Daisy |
| 6 | B1 | «staf sekolah Anda» in «Seluruh platform» | Daisy (words: Dr Gladys) |
| 7 | C1 | A Ringkasan Kelas on a PD Kelas shows academic metrics and «murid» | **Owner** (whether it exists), then Daisy |

## 7. Recommendation

**B1 and C2 should not receive final design acceptance yet.**
- Final acceptance follows Daisy's corrections to items 1, 2, 4, 5 and 6, laid beside these real screens.
- Item 7 needs the owner's ruling first.
- The boundary evidence for C2 is complete and holds.
