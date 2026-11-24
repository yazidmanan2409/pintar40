# D-2 · What a PINTAR certificate asserts: the policy specification (revision 3)

Bob, 18 Nov 2026. **Ruling 55, D-2 (A):** a certificate means mastery under defined test conditions. **Revision 2
incorporates Dr Gladys's educational review** (owner direction, 18 Nov).

**This is a specification and impact assessment only:** no code, migration, template or configuration changes. It
refines the existing certificate. It does not redesign certificates, the assessment engine, the institutional model or
4.1's scope. Implementation must be verified **before any real certificate is issued.** Whether that happens inside Z
is the owner's call by 24 Nov.

> **Owner decisions, 18 Nov (ruling 59):**
> - **O-1:** the attempt number on results and staff views only.
> - **O-2:** public «Predikat» removed; internal band kept.
> - **O-3:** the verification boundary is unchanged.
> - **O-4:** overall mark plus mandatory questions, kept.
> - **O-5 deferred:** extra time only; other accommodations go to a separate review.
> - **O-6:** reading is advised.
> - **O-7 decided (rulings 74 and 74a).**
> - **O-8:** terminology as future guidance.
> - **Timing:** after Z, before the first real certificate.
> - **B-7 (achieved sections) is not implemented now.**
>
> §6 is the implementation gate.

**Classes used throughout:**
- **A**, already supported: keep it and verify it.
- **B**, a small wording or presentation correction.
- **C**, new functionality or a material policy change: returned to the owner and not placed in any batch.

## 1 · Current state against proposed state (read on `main` `7ba18b03`)

### 1.1 Certificate purpose, title and wording

| Element | Today | Dr Gladys's guidance | Proposed | Class |
|---|---|---|---|---|
| Title | «SERTIFIKAT PENGUASAAN»: one string, `sertifikat.jenis` (hle.ts:4690), used on the card, the A4 sheet and the file name (`sertifikat.berkas`) | «SERTIFIKAT», with the meaning given by the achievement line | Change the two strings to «Sertifikat» and «Sertifikat · {kursus}» | **B** |
| The achievement line | «telah menuntaskan» + the course name (`sertifikat.diberikan`; the English reads "has met the mastery standard in") | «Telah dinyatakan memenuhi kriteria kelulusan yang ditetapkan berdasarkan hasil asesmen pada Materi Pembelajaran: [nama materi].» | That sentence, with the existing course name as [nama materi]. Daisy checks that it fits the frozen A4 grid (it is longer than today's line), and that «kelulusan» reads as passing this assessment, not graduation | **B** |
| Participant's name | Shown, from the sealed snapshot | Nama Peserta Didik | Unchanged. The sheet shows the name, not a label | **A** |
| Materi Pembelajaran | The course name is shown | Name it | Covered by the new achievement line | **A/B** |
| The specific assessment | The sheet names the course, not the assessment | Identify the assessment | The sentence's «berdasarkan hasil asesmen» states it. Naming the assessment itself (for example «Uji Penguasaan, Bab 3») needs the sheet to carry a field it doesn't today | **B** (sentence) / **C** (a named assessment field) |
| Score | **Never shown** on the certificate or the verification page (KartuSertifikat: "no score") | No score needed | Unchanged | **A** |
| Predikat (a grade band, shown only at 70% or above, D-121) | Shown on the certificate and the verification page | The certificate need not show numbers; the narrative carries meaning | **Owner decision (O-2):** keep the band, or remove it from the certificate and the verification page (it stays internal) | **B** |
| Issue date, number, verification QR | Shown; verification at `/verifikasi/[token]` | Required | Unchanged | **A** |
| The verification page | It shows only pass («Memenuhi capaian»), predikat, institution, date and validity. **Never the name** (structural; ADR-0013) **and not the Materi Pembelajaran** | Identity and verification information | The holder's identity stays off the public page. **Adding the Materi Pembelajaran to the public page changes the public-safe read contract** (doc 05) | **C** (O-3) |
| Already-issued certificates | The title and the line are strings rendered when a certificate is viewed, not sealed. The sealed snapshot holds the name, the course and the result | — | A string change alters how every certificate reads, old ones included. **No certificate has been issued to a real learner** (production holds none), so nothing real changes. Staging's test certificates would read the new words | Note |

**Verified: the change is possible by wording alone.** The title, the achievement line and the file name are three
strings. The predikat line is one conditional block. Nothing in the certificate contract, the snapshot or the
verification read needs to change for the B items.

### 1.2 Learning objectives and certificate eligibility

| What | How PINTAR does it today | Class |
|---|---|---|
| **The passing conditions are set before the assessment** | **Yes.** The school's pass mark is **sealed on the attempt when it starts** (`assessment_sessions.pass_mark`). If no mark is sealed, nothing is certified ("nothing is certified against an invented one", `certificate_eligibility`) | **A** |
| **Mandatory questions** | **Yes.** «Soal penting» (the safety gate) must be passed (INV-10), as well as the mark | **A** |
| **Eligibility** | All five must hold: a certifying mode, official evidence (INV-20), the result in force (not superseded), the safety gate passed, and mastery at or above the sealed mark (`certificate_eligibility`, `20261102100000`) | **A** |
| **Learning objectives** | Questions link to the school's objective codes (sections). Per-section mastery is computed and shown to the learner (the result's "areas to reread") and to the teacher (the evidence page). **Certification uses the overall mastery and the mandatory questions, not each objective** | **A**, described accurately |
| **Certification requires mastery of every objective** | **Not supported, and not proposed.** It would be a changed eligibility rule | **C** (O-4) |
| **The result in force; corrections** | One result in force; a governed key correction opens a certificate review. A reissue is a new certificate, and the old one reads DIGANTIKAN (D-06). Revocation is recorded and shown on verification | **A** |
| **Retakes, and the certificate's validity** | Each attempt is its own sitting; attempt limits count across versions (ruling 46); further certifying attempts need the second approver (**O41-16, unchanged**) | **A** |

### 1.3 Narrative feedback: the existing mechanisms

| What Dr Gladys asks | What exists, built on evidence | Class |
|---|---|---|
| What the participant demonstrated | The result says whether the target was met (`hasil.target.*`), and the review gives each question's own reason (`session_review`) | **A** |
| Which areas are achieved | Per-section mastery is computed. **The result lists only the sections below target,** not the achieved ones | **B** (list the achieved sections as well, from the same data; a presentation change only) |
| Which areas need reinforcement | "Bagian yang perlu dibaca lagi", with links to the lessons (`hasil.target.ulang`) | **A** |
| What to do next | Links to the lessons; the result's next step | **A** |
| When the evidence is insufficient, say so | «Belum cukup data» and the withholding rules; on learners' screens, the reading map | **A** |
| Numbers kept internally | Scores are kept for eligibility and audit; the certificate shows none | **A** |
| AI-written narratives | **None, and none proposed** | Rejected |

**One known defect touches the narrative:** a multi-answer question shows no chosen answer and no reason. That is
D-1, and it is repaired in Z.

### 1.4 Final assessment conditions

| Condition | Today | Dr Gladys | Proposed | Class |
|---|---|---|---|---|
| Thinking prompts and answer-giving help in a certifying sitting | **Available:** `POST_TEST` and `STANDALONE` allow all three levels (thinking prompt, hint, worked example) | Disabled in final or certifying assessments; kept in learning and practice | **All three levels refused in every certifying mode.** This answers Q-1: level 1 goes too, so **no per-level schema is needed**. Policy captured on the sitting at its start (Sharon); a lint `certifies ⇒ not allows_assistance` | **B** (approved by D-2; one policy row, the capture and the lint) |
| In learning and practice | Available (lessons, PRACTICE, Pemetaan Awal) | Keep | Unchanged | **A** |
| Conditions defined before the sitting | **Fixed before or at the start:** the pass mark (sealed on the attempt), the attempt limit, the mandatory questions, and the **assignment window** (opens and closes, set by the teacher). **Time (corrected 19 Nov):** PINTAR has **no per-assessment duration; every sitting is untimed** (`20270120120000`'s header, R-C). The only time limit is the effective deadline: the sitting's own `authoritative_deadline` where one is set, otherwise the assignment's `closes_at`. A short late-sync grace applies to answers already given; an abandoned sitting is closed on a schedule (A1) | Defined in advance and enforced consistently | Unchanged. **No new duration feature is proposed:** Dr Gladys's guidance asks that time rules be defined and enforced, not that a per-assessment duration be added. A duration would be **C** | **A** |
| Accessibility | **"Extra time" means an authorised extension of one learner's deadline** (A1: capability-gated, bounded, audited, with the old and new deadline and the actor recorded), not added minutes on a timed test, since sittings are untimed. **No glossary and no read-aloud inside a sitting today** | Keep the legitimate accommodations | Keep the authorised extension. Record it with the result, staff-only, **never on the certificate or the verification page** (Sharon). **Any further accommodation is new functionality** | **A** (extension) / **C** (any new one, O-5) |
| Reading before Uji Penguasaan | Required only by the chapter screen; the database and a typed address don't require it (verification 3) | (Not addressed) | **O-6** | Open |

### 1.5 Retakes and repeated questions

| Point | Today | Class |
|---|---|---|
| No universal retake policy imposed | Retakes are a school decision: the attempt limit and the second approver (O41-16) | **A** |
| Non-certifying practice kept distinct from certifying attempts | Practice and Uji Cepat never certify (BOB-50); the 4.2 learning retry is non-certifying by ruling (D-3) | **A** |
| Attempt history and lineage | Kept (ruling 46, A3) | **A** |
| Whether a retake repeats the same questions | **Not yet verified.** It is verification 1, **paused** until the usage limit resets on 22 Nov. Review P infers that on imported chapters a retake draws the same questions in a new order | Open (O-7, after the check) |
| The attempt ordinal | Fixed at the start (Sharon). Where it shows is **O-1** | **B** |

### 1.6 Institutional terminology

Recorded as **educational and terminology guidance**, with no renaming started.

| Concept | Dr Gladys | PINTAR's interface today (occurrences in the interface strings) | Where it stands |
|---|---|---|---|
| Learner | Peserta Didik | «murid» about 325; «peserta» about 36 (professional learning); «peserta didik» 1 | Not consistent |
| Teacher or lecturer | Pendidik | «guru» about 89; «pendidik» none | Not consistent |
| The organisation | Institusi | «sekolah» about 357; «institusi» none | Not consistent |
| Leadership | Pimpinan | «pimpinan» 16; it is also the leader's route (`/pimpinan`) | **Already consistent** |
| Administrator | Admin | «admin» about 98 | **Already consistent** |
| Content | Materi Pembelajaran | «materi» about 95, «kursus» 17, «bab» 69 | Partly |
| Categories (PAUD/TK, SD/MI, SMP/MTs, SMA/SMK/MA, Perguruan Tinggi) and identifiers (NPSN, Kode PT) | — | Jenjang SD/SMP/SMA in content; the institution code (Pendataan) | Partly |

**Classification:**
- **B on the certificate only:** the new line already uses «Materi Pembelajaran».
- **C platform-wide (O-8):** several hundred strings, the routes, the roles, registration and institution categories,
  and the roadmap's sector assumption (Perguruan Tinggi). A platform-wide renaming is a future scope decision, best
  taken with Daisy's vocabulary page and the rationalisation milestone, not in 4.1.

## 2 · The smallest proposed changes (class B), with their risks and dependencies

| # | Change | Risk | Depends on |
|---|---|---|---|
| B-1 | `sertifikat.jenis` becomes «Sertifikat»; `sertifikat.berkas` becomes «Sertifikat · {kursus}» | It renames how existing test certificates read (none are real) | Daisy's copy check |
| B-2 | `sertifikat.diberikan` becomes Dr Gladys's sentence, with the course as Materi Pembelajaran, in ID and EN | A longer line on the frozen A4 grid. **Daisy re-checks the sheet, and the rendered check R-13 covers it** | Daisy; the sheet guard (B6C-SHEET-01) |
| B-3 | Predikat: removed from the certificate and the verification page, or kept (O-2) | Removing it changes the public verification read's output, though not its contract (the field becomes absent, as already happens below 70%) | O-2; Sharon if removed |
| B-4 | Certifying modes refuse all assistance; the policy is captured at the start; the lint | It changes what learners meet in Uji Penguasaan. The walkthrough script and the handbook follow it | D-2 (approved); Sharon reviews |
| B-5 | The accommodation (extra time) recorded with the result, staff-only | A small field | Sharon |
| B-6 | The attempt ordinal fixed at the start; shown on the result and in staff views | — | O-1; A3's lineage count |
| B-7 | The result also lists achieved sections, from existing per-section data | Presentation only | Daisy; **not 4.1 unless the owner places it** |

**All B items together are about 1–1.5 days of build, plus Daisy's and Sharon's reviews.** B-1 to B-6 are D-2's
implementation. They do not enter Z unless the owner decides so by 24 Nov.

## 3 · Is any existing 4.1 acceptance requirement affected?

**No accepted 4.1 requirement is broken, and no defect was found in the certificate contract:** eligibility, sealing,
verification, revocation and reissue work as specified (A).

**The decisions that would touch 4.1's acceptance, only if the owner places them there:**
- B-1 and B-2 change an accepted 4.0 design (Daisy's frozen sheet, D-076, D-120). They need Daisy's layout check and
  the rendered check.
- B-4 changes the assessment conditions that learners, the walkthrough and the handbook meet.
- **Without a ruling, all of this lands after Z and before any real certificate,** as D-2 says.

## 4 · Decisions for the owner

| # | Decision | Bob recommends |
|---|---|---|
| **O-1** | Where the attempt number shows | On the result and in staff views only; not on the certificate or the public page |
| **O-2** | Predikat on the certificate and the verification page | **Remove it from both:** it reads as a report-card grade, which Dr Gladys's guidance avoids. Keep it internal |
| **O-3** | Name the Materi Pembelajaran on the public verification page | **Not now.** The certificate itself names it, and the public page is deliberately minimal (privacy contract); a change needs Sharon's review |
| **O-4** | Certification per objective (every objective mastered) | **No:** keep the overall mark plus the mandatory questions, as built and set before the assessment |
| **O-5** | Accommodations beyond extra time | Ask Dr Gladys which, if any, are required, then decide them as separate scope |
| **O-6** | Reading before Uji Penguasaan: required or advised | Advised, and the screen made honest; an educational call |
| **O-7** | **DECIDED (rulings 74 and 74a).** See R-h | — |
| **O-8** | Platform-wide terminology (Peserta Didik, Pendidik, Institusi) | Record as guidance now; plan it as future scope with Daisy's vocabulary work. No 4.1 renaming |
| **Timing** | Whether B-1 to B-6 ride Z or land after it | **After Z, before any real certificate.** The pilot issues none (proposal P-3), so nothing waits on them |

## 5 · Verification, when built

- **Assistance refused:** a certifying sitting refuses each assistance level, through the normal entry point and by a
  direct call, with a failing test first and a planted defect per mode.
- **The lint** fails if a certifying mode allows assistance.
- **Existing sittings unaffected:** a sitting open before the change keeps its captured policy.
- **Extra time** given through A1 is recorded with the result and appears on no public surface.
- **The attempt ordinal** equals the lineage count at the start.
- **Wording:** the certificate, the A4 sheet, the file name and the verification page say the new words; Daisy's
  layout check and the rendered check (R-13) pass.
- **The predikat** follows O-2 everywhere, consistently.
- **Sharon reviews** the policy capture, the lint and any public-surface change.

## 6 · The approved refinement and its implementation gate (ruling 59)

### 6.1 Scope: exactly these, nothing more

| # | Change | From |
|---|---|---|
| R-a | `sertifikat.jenis` becomes «Sertifikat»; `sertifikat.berkas` becomes «Sertifikat · {kursus}» | B-1 |
| R-b | `sertifikat.diberikan` becomes «Telah dinyatakan memenuhi kriteria kelulusan yang ditetapkan berdasarkan hasil asesmen pada Materi Pembelajaran: {kursus}.» (ID; EN to match). Daisy's final wording, checked against the frozen A4 grid | B-2 |
| R-c | «Predikat» no longer rendered on the certificate (card and A4 sheet) or on `/verifikasi/[token]`. **The band stays in `certificate_eligibility`, the snapshot and internal reports.** The public read keeps its contract; its presentation drops one field | B-3, O-2 |
| R-d | **All three assistance levels refused in every certifying mode** (`POST_TEST`, `STANDALONE`, and the modes that already refuse). The policy is captured on the sitting at its start; a lint enforces `certifies ⇒ not allows_assistance` | B-4 |
| R-e | Extra time given through A1 is recorded with the result, staff-only, on no public surface | B-5 |
| R-f | The attempt ordinal is fixed at the start, under ruling 46's lock, and shown on the learner's result and in authorised staff views only | B-6, O-1 |
| R-g | **Reading advised (O-6): the smallest consistency correction.** The inconsistency is behaviour as well as words: the chapter page offers Uji Penguasaan only once every lesson is read (`siklus.ts`). The smallest correction is for that page to offer Uji Penguasaan once Pemetaan Awal is done, beside "continue reading", with one advisory line (Daisy's wording, for example «Disarankan membaca semua pelajaran lebih dulu»). The database and the test page are unchanged (they already allow it) | O-6 |
| R-h | **O-7 (ruling 74): certifying results disclose counts only.** In assessments whose **governed purpose** is certification or a formal pass decision (the mode's `certifies` policy, not its display name: today `POST_TEST` / Uji Penguasaan and certifying `STANDALONE`), the learner sees the numbers correct and incorrect, and **never** the per-question correctness, the answer keys or the explanations. This applies on every learner-facing route: the result page, the review screens, print, export and every learner RPC (the closed learner projection and the engine's forbidden-key list). Captured at the sitting's start like R-d. Staff views are unchanged. **Ruling 74a (Dr Gladys):** the result shows **Lulus or Belum lulus**, eligibility, the retake line, and **the sections still to learn** (the existing `bagianUlang`) as advice, with no mastery verdict. **Ruling 74b:**
- where an objective's evidence in the sitting is **sufficient**, it is named among the sections still to learn;
- where it is **insufficient**, the learner is advised to revisit that material, with **no** suggestion they failed to master it;
- the threshold is an approved one if it exists, confirmed with Sharon at the build; otherwise everything is worded as revisit-advice;
- the counts are kept, secondary to the qualitative feedback.

Red cases cover both evidence states. **No "mastered" claim per objective in 4.1;** that waits for 4.5's evidence-sufficiency rules. Daisy writes the words | O-7 |

**Not in scope:**
- B-7 (achieved sections);
- any new accommodation (O-5);
- the material name on the public page (O-3);
- per-objective eligibility (O-4);
- any repetition rule or question selection (O-7 points 4 and 5: 4.5);
- any terminology change beyond R-a and R-b (O-8).

**Preserved unchanged:**
- `certificate_eligibility`;
- the sealed pass mark and the safety gate;
- official evidence;
- correction, review, reissue (DIGANTIKAN) and revocation;
- certificate identity and number;
- the verification contract (`verify_certificate`, `assert_public_surface()`);
- the name never appearing on the public page.

### 6.2 Regression proof (red first)

- **Certifying modes:** each refuses each of the three levels, through the player and by a direct `open_assistance`
  call, with one planted defect per mode.
- **Non-certifying activities keep their behaviour:** lessons, PRACTICE, Pemetaan Awal (`PRE_TEST`) and Uji Cepat
  (`QUICK`) still serve each level they serve today, each pinned by a test. This is the owner's explicit condition.
- **Open sittings:** a sitting started before the change keeps its captured policy.
- **The lint** fails if any certifying mode allows assistance.
- **Predikat:** absent from the card, the A4 sheet and the verification page; still present in the eligibility output
  and the snapshot.
- **The public surface:** `assert_public_surface()` and F04-S01 stay green, with no new field.
- **The attempt ordinal:** equals the lineage count at the start, and appears on no public surface.
- **Extra time:** recorded, staff-only.
- **The reading guidance:** after Pemetaan Awal the chapter page offers Uji Penguasaan, with the advisory line.
- **Wording:** Daisy's copy check; the sheet guard (B6C-SHEET-01); the rendered check (R-13) on the new sheet.
- **R-h, red first:** for each certifying mode, every learner-facing route (the result, review, print, export, each learner RPC) carries no answer key, per-question correctness or explanation, with a plant per route. The counts are correct. Pemetaan Awal, Uji Cepat and practice keep their explanations, each pinned. Staff views are unchanged. **Sharon reviews the security side.**

### 6.3 The gate

1. **When:** a bounded post-Z batch, **D2-R**. It opens after Z's candidate is accepted, and must be on staging and
   accepted **before the first certificate is issued to a real participant.** It does not need to precede the 10-adult
   pilot, because the pilot issues no certificates (pilot proposal P-3). It does not belong to the rationalisation
   milestone (ruling 54), which is optimisation, not behaviour, but it may run beside it.
2. **Before any code:** Daisy reviews R-a, R-b and R-g against the A4 grid; Sharon reviews R-c to R-f for integrity and
   privacy.
3. **Then:** the usual batch process: red first, one uninterrupted pre-flight, CI, Sharon's and Daisy's reviews, a
   staging preservation pair, and **the owner's staging authorisation.**
4. **Effort:** about 1–1.5 days of build, plus the reviews.

### 6.3a Consistency check: conditions, certificate wording and public verification

Before D2-R's code, as part of the reviews in §6.3 step 2:
- **Daisy:** the conditions the learner is shown before starting (the window's close, attempts, what counts, and from
  D2-R, no help) agree with the certificate's achievement line and the verification page's words («Memenuhi capaian»).
- **Sharon:** that nothing on the certificate or the public page implies a timed test, a duration or an accommodation,
  and that the public read's contract is unchanged.

Sharon's part waits until after A3's freeze (ruling 58).

### 6.4 What else it changes

- **The 4.1 walkthrough runs on the Z candidate, before D2-R.** Observers will see today's title, the Predikat and
  hints in Uji Penguasaan. Daisy's script must not present these as final, and observations on them are recorded
  against D2-R, not as 4.1 defects.
- **The handbook and the teacher guidance:** "hints are available in the test" becomes false after D2-R.
- **The pilot:** none, because it issues no certificates.

## 7 · Revision 4 (Bob, 24 Nov 2026; ruling 89, track 1d): the pre-code reviews folded in

**Sharon's review** (`D2R-PRECODE-R-c-f.md`, `dfb5167f`, plus her C1-R4 addendum): R-d, R-e and R-f are ready as written. **R-c's render sites:** the card (`KartuSertifikat:80`), the printable record (`:153`, C1-R4), the A4 sheet (`sertifikat-lembar`), `/verifikasi:138`, and the API and RPC (null). A list test fails on any Predikat render site outside the internal reports, with one plant. The learner's own certificate page (`:166`) is not public, so it is Daisy's call. Two corrections, both adopted.

| # | Revision 4 |
|---|---|
| R-c | **Corrected: the band goes from the public data, not just from the page.** `verify_certificate` and `/api/verifikasi` today return `predikat` as a public field. **The RPC returns `predikat` as null for every certificate.** The OUT columns and `assert_public_surface()` are unchanged (null is already allowed below 70%). The band stays in `certificate_eligibility`, the snapshot and internal reports. **Also covered:** C1-R4's printed report line (Z-READINESS §6). **Proof:** the RPC and the API both return null for a banded certificate; the card, the A4 sheet, the page and the print show no Predikat |
| R-d | As written. `open_assistance` reads the **policy captured on the sitting**, never the live `mode_policy` |
| R-e | As written. **Proof:** extra time is absent from every public surface and from the public snapshot |
| R-f | As written |
| R-h | **The red cases are made concrete.** Every learner route is named, each with a plant: `session_review`, `session_answers`, `reading_map`'s reasons, `hasil_koreksi_saya`, and the print and export. **A list guard in the style of Z-D1-02** fails on any new learner-facing reader that is not classified. **There is no approved evidence threshold in 4.1,** so every section line is revisit-advice. `tujuan_gerbang_kode` counts as section-level advice and is allowed, worded as «revisit this section» |
| §6.3a (Sharon) | **PASS:** nothing on the certificate, the sheet or the public page implies a timed test, a duration or an accommodation |
| R-a, R-b (Daisy, `D2R-KATA.md`, final at `e64f94c2`, ux-1; supersedes `01dc4416`) | **Confirmed.** **One concept, two names:** R-b says «Materi Pembelajaran: {kursus}», while the admin's certificate column says «Paket Pembelajaran» (since Z7 C-3). **Bob's decision:** keep «Materi Pembelajaran», because it is Dr Gladys's approved sentence (ruling 59), and **the column follows it** (one string, under R-b). The owner may choose «Paket Pembelajaran» for both instead, which fits the A4 grid as well |
| R-g | `siklus.siap.saran`: «Uji Penguasaan sudah dapat dikerjakan. Sebaiknya baca semua pelajaran lebih dulu.» It is neutral advice beside «Lanjut membaca» |
| R-h's words | Daisy's set, in this order:<br>1. «Lulus.» / «Belum lulus.», with a reason line; the gate line keeps its reason;<br>2. the section line;<br>3. the retake line;<br>4. the counts, secondary («5 dari 6 soal dijawab tepat»);<br>5. one line saying the key and per-question marks are not shown.<br>Never «tidak lulus». No per-objective mastery claim. Staff views are unchanged. **With no threshold in 4.1 (Sharon),** only the revisit form is used: «Baca lagi juga:» with the no-blame note (74b). «Bagian yang masih perlu dipelajari:» waits for 4.5's sufficiency rules |
| §6.3a (Daisy) | **Adopted:** `verifikasi.lulus` «Memenuhi capaian» becomes «Lulus» / «Passed», to agree with «kriteria kelulusan» on the certificate and the result. The string changes; the public contract does not. Sharon checks it with R-c |
| The pre-start conditions screen | Daisy's one new «no help» line (R-d), confirmed at the build |
| R-1 (Z-READINESS) | Second Eye verifies on `claude/next-base`, and adds a red-first test on `claude/d2r` if one is missing. Not D2-R scope; it rides the branch as its own commit |

**Revision 4 is final (24 Nov, 01:05Z).** The scope stays frozen as §6.1, with these corrections and two string alignments (the admin column; `verifikasi.lulus`). Nothing else is added. **The build may start** on `claude/d2r`.

**The strings of record are Daisy's `D2R-KATA.md` at `e64f94c2`**, with «Materi Pembelajaran» / «Learning Material» in R-b. With no threshold in 4.1, every section below the mark goes under «Baca lagi juga:». `hasil.target.ulang` stays defined, but no 4.1 route draws it.

### 7.1 · Bob's decisions on Second Eye's build map (`D2R-BUILD-MAP.md`, `claude/d2r` `cefb60eb`), for Sharon to confirm

- **F-1:** `assistance_state` is mode-blind. **R-d closes it too.** It reads the same captured policy as `open_assistance`, with one plant each.
- **F-2:** the policy is read live and never captured. **A capture column on `assessment_sessions`, written once at start**, following the `pass_mark` / `pass_mark_source` precedent.
  - **The proposed shape:** `assistance_policy jsonb not null`, holding the three assistance levels plus `reveals_rationale_on_review`, taken from `mode_policy` at start.
  - **The rules:** it is immutable after insert (a guard trigger), and an open sitting from before the migration is backfilled from its mode's policy at migration time (spec §6.2, open sittings).
  - **Sharon confirms the shape.**
- **F-3:** `reveals_rationale_on_review` is read by nothing. **It is read from the capture** in `session_review`. The hard-coded PRE_TEST refusal stays as a second check.
- **`session_review` on a certifying mode: refuse**, as PRE_TEST already does. This closes direct calls; the counts come from `session_outcome`.
- **STANDALONE has no learner result page:** R-h is enforced **in the database**, on every learner RPC. The page checks are additional.
- **No learner export exists:** H10 asserts that it is absent, and the list guard (H18) catches any added later.
- **`session_outcome.per_domain`, and `reading_map`'s KUAT and misconception reasons, on certifying modes:** the learner gets **no per-objective verdict**.
  - `per_domain` is returned to learners without a mastery label: sections only, as revisit-advice (74a and 74b, and «no "mastered" claim per objective in 4.1»).
  - KUAT is not shown on a certifying route.
  - Staff views are unchanged.
- **Result payloads are not key-sanitised:** every certifying learner RPC is covered by a forbidden-key test, the engine's existing list applied to result payloads (H-series).

**The build may start now on R-a, R-b, R-c, R-e, R-f, R-g and R-1.** R-d and R-h start once Sharon confirms F-2's shape and the per_domain line.

**Daisy's string update, with no threshold (`D2R-KATA.md` §6, `dc275f6a`), adopted:**
- `hasil.baca_lagi`: «Baca lagi:» / «Read again:» (no «juga», since there is no list above it).
- `hasil.baca_lagi_arti`: «Bagian ini disarankan untuk dibaca lagi. Saran ini bukan penilaian atas penguasaan Anda pada bagian ini.» / «These parts are suggested for reading again. This is advice, not a judgement of your mastery of them.»
- `sertifikat.kelola.kolom.kursus`: «Materi Pembelajaran» / «Learning Material». This reverses Z7 C-3, so the concept keeps one name.

**Daisy (24 Nov): «Predikat» is removed from the learner's own certificate page (`:166`) as well.** The page must match the certificate and the public check. The band stays internal. No new words.

### 7.2 · Sharon's confirmation of §7.1 (24 Nov, addendum to `D2R-PRECODE-R-c-f.md`): R-d and R-h may start

**F-2, the capture column, with four corrections:**
- **(a)** Backfill **every** sitting, open and closed, from the **old** `mode_policy`, *before* the same migration changes the certifying modes, and assert that order. Otherwise an open POST_TEST would lose help mid-sitting.
- **(b)** Fill the column first, then add the immutability trigger. If the trigger has to come first, its only exception is keyed to the migration, never to a setting a client can set.
- **(c)** A CHECK that the jsonb has exactly the four boolean keys.
- **(d)** This writes existing `assessment_sessions` rows during the migration, so **D2-R's promotion needs a step 0** (sittings by mode and status), and line 58's `baru` gains `assistance_policy`.

**Refusals and learner routes:**
- `session_review` refuses on certifying modes.
- R-h covers `session_answers`, `reading_map`'s reasons and `hasil_koreksi_saya`, each with a plant.
- `hasil_koreksi_saya` says only that the result changed, and gives the new count. It never says which question changed, or the key.

**per_domain, corrected:**
- «Baca lagi» is computed client-side from per_domain's per-objective `penguasaan` (`siklus.ts` `bagianUlang`), which is a score in all but name.
- **On certifying modes, `per_domain` is returned without per-objective numbers**, plus a server-computed **`tujuan_ulang`**: the codes below the mark, plus `tujuan_gerbang_kode`.
- `bagianUlang` reads `tujuan_ulang`.
- The forbidden-key test covers `penguasaan` inside `per_domain`.

**Also confirmed:** F-1; F-3; database enforcement for STANDALONE; H10; H18; `verifikasi.lulus` «Lulus» (a string only, with the public contract unchanged).

### 7.3 · At the build (24 Nov, about 02:05Z)

**Sharon accepts Second Eye's deviation:** a separate sealed `bersertifikasi` column records the result's purpose. It is needed because Pemetaan Awal hides rationales but keeps its reading-map reasons, so the review key can't decide purpose. Her four conditions:
1. It is captured at start from `mode_policy.certifies`, sealed with the same trigger, and backfilled in the same step as `assistance_policy`.
2. Every R-h gate reads `bersertifikasi`, never a mode name or `reveals_rationale`. One plant sets `bersertifikasi=true` on a non-certifying mode name, and the gate must still hold.
3. «`bersertifikasi` ⇒ all assistance false» is enforced at INSERT only, as a trigger. Certifying sittings backfilled from before D2-R legitimately hold true.
4. Both new columns join line 58's `baru`, and step 0 counts sittings by mode and `bersertifikasi`.

**R-1 is accepted as built** (green on its first run). Sharon closes it on the pushed head and CI.

**Daisy's two strings:**
- `hasil.percobaan_ke`: «Kesempatan ke-{n}» / «Attempt {n}». «Kesempatan» is the learner and teacher word.
- A new key, `posttest.tanpa_bantuan_umum`, for a certifying STANDALONE only: «Selama asesmen ini, petunjuk, contoh, dan arah berpikir tidak tersedia.» / «During this assessment, hints, examples and thinking prompts are not available.»
