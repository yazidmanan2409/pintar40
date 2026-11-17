# Bob's review: Handbook Draft 01a, coverage map, and the Draft 02 structure proposal

17 Nov 2026. Reviewed: `PINTAR-BUKU-PANDUAN-LENGKAP-DRAFT-01.md` (Draft 01a), `PINTAR-HANDBOOK-FEATURE-COVERAGE.md` and
`PINTAR-BUKU-PANDUAN-USULAN-STRUKTUR-02.md` (Pete). The owner's ruling: **the handbook is issued when 5.0 is ready.**

Claims were checked against `origin/main` code and the 4.1 record. "Verified" below means traced to a file and line.

## 1. Overall verdict

**The proposal is sound, and fits the owner's 5.0 issue date.** One unified book, draft markers stripped at
publication, and nothing written in the present tense until it is accepted: that is the right discipline for a book
issued at 5.0.

My recommendations on Pete's decisions:

| # | Recommendation |
|---|---|
| O-1 | Approve. |
| O-2 | Approve. Keep fifteen tasks and list the five as «Tugas lain». |
| O-3 | (b), the short appendix. |
| O-4 | Include it, re-scoped. See 3.4. |
| O-5 | The rules in 3.3. |
| O-6 | Decide before step 7, as Pete says. |
| O-7 | Still the owner's. The facts for that decision are in 2.6. |

## 2. Factual corrections (to make in the coverage file and the draft)

### 2.1 A2b is accepted, not "in development"
- Coverage row 11 and §5 item 11 say "merged 17 Nov; acceptance pending".
- A2b was **accepted on staging on 17 Nov**: migration 282, with the after-read and hosted checks green.
- Daisy's D8 screen review passed before the freeze.
- Re-mark it **ON STAGING (accepted 4.1 part)**. The wording re-check at Z still applies.

### 2.2 B1 and B2 are closed
- Row 15 says "B1/B2: result reviews pending".
- Both are **closed**: Sharon passed them, Daisy passed them, and the CI runs and journeys are green.

### 2.3 C2w is still in development
- Row 17 is right that C2w is in development with no screen yet. Use the frozen words (ruling 30):
  - «Catatan peninjau»;
  - «belum dikaitkan dengan pemahaman keliru»;
  - «anotasi» never appears on a screen.
- **Row 7 (Studio), «Tarik izin»:**
  - On the current build, the Kanonik page cannot offer «Tarik izin» (withdrawing a school's access to a release). Its list of open grants is always empty.
  - C2w's first item fixes this. Until it is accepted, do not mark the «Tarik izin» steps as verified.

### 2.4 Attempt counts per assessment type (row 9, Draft 9.4 and 11.7, §5 item 5)
- **The platform does not fix "Pemetaan Awal 1, Uji Penguasaan 2".** The author sets the attempt limit for each assessment, within platform bounds:
  - up to 5 in general;
  - exactly 1 for Uji Cepat and for exam and paper modes.

  Source: `assessment_definition_bounds`, `20260915150000_studio_governance.sql`. The limit is shown in the assessment's rules (`aturan-asesmen.ts`).
- **Recommended wording:** "sesuai Aturan Asesmen yang ditetapkan penyusun; Uji Cepat hanya sekali". Drop the fixed numbers, unless a ruling fixes them. I found none.

### 2.5 Counting attempts across versions (ruling 46) is decided, not built
- Row 9 marks it "verified". It is a **ruling, built by A3**, so it is in development.
- Today the count is per version.
- Mark it `⟦DRAF · dalam pengembangan⟧`.

### 2.6 Facts for the principal-role decision (O-7)
From `role_capabilities()`, latest version `20270114100000`:

| Role | What it can do | What it cannot do |
|---|---|---|
| **Dekan** | See the learner roster and the school summary. | Read an individual learner's results; review, assign or manage sittings. |
| **Kepala departemen** | Draft, review, assign learning, run Uji Cepat, read learner results, manage sittings, decide integrity requests, review question health. | Publish; provision people. |
| **Admin sekolah** | Administer, provision, publish, manage sittings. | Read an individual learner's results. |

- A principal who only oversees fits **Dekan** at school scope.
- A principal who acts on academic matters fits **Kepala departemen** at school scope.

Draft 01a §4.3 should state these consequences in reader terms, whichever role the owner rules.

### 2.7 Account set-up after the upgrade (row 3, the question left open)
- **An existing email account sees all four steps:** username, password, PIN, then name confirmation.
  - Usernames and PINs did not exist before 4.0 (both tables come from `20261021100000`). I found no backfill.
  - `complete_my_setup()` lists every missing step (`20261112100000`, lines 358–361).
- Tugas 1's sample step order matches the server's order (USERNAME → PASSWORD → PIN → NAME).

### 2.8 The ruling on integrated AI (Draft 10.10, line 1370)
- Replace "mungkin tidak ditawarkan" and its [Perlu konfirmasi] with ruling 44 (16 Nov). Its substance:
  - For each provider, one contractual check: does it permit this educator-only authoring workflow?
  - If no suitable provider permits it, integrated AI-assisted MCQ generation is **removed from the roadmap**.
  - PINTAR then continues with manual authoring and workbook imports.
- In the 5.0 book, this feature is either built and accepted, or it goes into Lampiran B under O-3.

## 3. Recommendations on the proposal

### 3.1 Screen text: verified
I checked every screen string the proposal quotes against `src/lib/hle.ts`, and all are present. There is one label correction:
- SS-33 is «Lihat per soal», not «Per soal».

Ask Daisy which label learners see for "Latihan" (Tugas 9). The word exists, but in more than one place.

### 3.2 Rules and timings: verified
- «Tambah waktu» is 1 to 120 minutes, at most three times per sitting.
- Maintenance notices come 60, 30 and 15 minutes before, and starts are blocked from T−15.
- The school year runs 1 July to 30 June.
- A Kepala departemen cannot publish, and an Admin sekolah cannot read an individual learner's results (D-04, D-10, D-12).

### 3.3 Screenshots (O-5): capture rules under the project's constraints
- **No real-person data, ever.** Pete's rule is right.
- **Drafts:** capture from a local build with seeded fictional data, as Daisy does for her reviews (390 px and 1280 px). That needs no staging access.
- **The final 5.0 set:** capture on an acceptance fixture school that the owner approves, with Sharon's agreement.
  - Signing in and acting on staging writes to staging, so each capture run must be bounded and on that verified fixture.
  - Never use `sekolah-demo-pintar` unless the owner authorises it.
- **Use ordinary fixture accounts, not the evaluation personas.** Personas run inside an evaluation session and are not what a normal user sees.
- **Tooling:** reuse Daisy's capture tooling where possible, so that the product reviews and the handbook use one set of captures.

### 3.4 Lampiran C and the 4.1 release (O-4)
- **The one-time account set-up happens when production is upgraded at 4.1 release.** That is long before the 5.0 book.
- Schools therefore need that guidance **at 4.1 release**, through the release note (rehearsal finding REH-2).
- **Lampiran C in the 5.0 book** should cover only what an upgrade to the version the book describes changes.

### 3.5 A publication gate that a script can check
Add these to Pete's check script (§7.1). Publication fails if any of them is found:
- any `⟦DRAF` marker;
- any `[Perlu konfirmasi`;
- any internal identifier: batch IDs, migration numbers, commit hashes, PR codes;
- any quoted «…» string that is no longer in `hle.ts`.

### 3.6 Diagrams: keep the drafting order
- Pete's rule not to draw D-09, D-11 or D-17 until 4.5 and 5.0 are planned is correct. Keep it.
- D-06 and D-07 wait for A3 and Z, as he proposes.

### 3.7 Not verified by me
- Brand colour `#075056` (D-192): Pete should cite the source.
- The 4.5 and 5.0 working names (§5 item 4): the owner's decision.
