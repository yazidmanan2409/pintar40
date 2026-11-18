# D-2 · What a PINTAR certificate asserts: the policy specification (revision 2)

Bob, 18 Nov 2026. **Ruling 55, D-2 (A):** a certificate means mastery under defined test conditions. **Revision 2
incorporates Dr Gladys's educational review** (owner direction, 18 Nov).

**This is a specification and impact assessment only:** no code, migration, template or configuration changes. It
refines the existing certificate. It does not redesign certificates, the assessment engine, the institutional model or
4.1's scope. Implementation must be verified **before any real certificate is issued.** Whether that happens inside Z
is the owner's call by 24 Nov.

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
| Conditions defined before the sitting | The mark, the attempt limit, the window and the deadline are fixed at the start; a teacher's extension is recorded (A1) | Yes | Unchanged | **A** |
| Accessibility | **Extra time** (A1, recorded). **No glossary and no read-aloud inside a sitting today** | Keep the legitimate accommodations | Keep extra time. Record it with the result, staff-only, **never on the certificate or the verification page** (Sharon). **Any further accommodation is new functionality** | **A** (extra time) / **C** (any new one, O-5) |
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
| **O-7** | Repeated questions on a retake: disclose, or vary | Decide after verification 1, which resumes after 22 Nov |
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
