# Planning audit 4.2 / 4.5 / 5.0: Daisy's independent review (18 Nov 2026)

> **What holds now:**
> - **I agree with the three readiness verdicts** (§8: none of the three is ready for detailed execution planning).
> - **The journeys cover exceptions well but miss ordinary school days.** Five journeys are missing, including the first day as a **teacher and a learner** live it (§1).
> - **"Open; Daisy" items:** none needs a **new** owner decision. Each is either wording I can give inside planning, or it waits on an owner decision the audit already lists (§2).
> - **Consistency:** four shared patterns should be fixed **once, before 4.2 planning**, so 4.2, 4.5 and 5.0 do not each invent their own (§3):
>   - "as of";
>   - corrected;
>   - not concluded;
>   - the refusal that discloses nothing.
> - **⚠ One correction to my own earlier finding (§3.4):** Z-3, as I wrote it, would create an existence oracle. It must be revised **before** it lands on C3w-1's branch.
> - **Accessibility risks for the plans** (§4). **One of them may need the owner:** accommodations in Exam Mode, inside D-01.
> - **Disagreements with Bob, stated plainly** (§5), for §7 as they stand.
> - **Read:** `docs/roadmap/PLANNING-AUDIT-4.2-4.5-5.0.md` at `63c66ba9` on `claude/bob-41-master-plan`, §1 to §8.

## 1 · The journeys (§4): realistic days, and what is missing

**What is right:** the eighteen journeys test the hard edges well: correction, transfer, rename, recovery, evaluation, small cells. **What is missing is the ordinary day those edges interrupt.** A version can pass every exception journey and still fail a teacher on a Monday.

**Missing journeys:**

| # | Proposed journey | Why it is needed |
|---|---|---|
| **J42-0** | **A teacher's and a class's first day:** account request → activation → first sign-in → choosing the context → the first class → assigning the first Pemetaan Awal → learners sign in with card and PIN on shared lab computers («Komputer siapa ini?») → the teacher reads the first result | J42-1 is the **admin's** first day of a year. Nobody walks the **teacher's** or the **learner's** first contact, and that is where a school decides whether PINTAR is usable. 4.2-06 (adding one person), 4.2-07 (declining a request), 4.2-08 (password) and 4.2-03 (context) all meet here |
| **J42-9** | **An ordinary week:** assign, sit, read the class report, print for a meeting, re-teach, assign the Uji Penguasaan | The **regression baseline.** Every 4.2 change (positions, two schools, past reports, structure corrections) must leave this unchanged, and nothing currently asserts it |
| **J42-10** | **A learner transfers mid-term** (ruling 25) | The audit mentions it only inside 4.2-05. It touches past reports, the export (whose copy?), certificates and open sittings at once, the way a real transfer does |
| **J42-11** | **A teacher leaves mid-term, not at rollover** | J42-1 tests handover only at the year's start. The realistic case is a resignation in October, with open sittings, an Uji Penguasaan held for authorisation (A3), and reviewer notes on content they wrote |
| **J42-12** | **A lab session with a power or network cut** | Indonesian schools' real interruption. It crosses A3 (recovery), A2a/A2b (if the school stops the class) and shared devices. J42-3 has it only on an exam day, and only after D-01 |

**For 4.5 and 5.0:**
- **J45-3, "a teacher's minute":** add the **"nothing needs attention"** outcome. A tool that always finds something to say is not quiet intelligence. Also add the **second visit** a week later: what changed, and what the teacher already acted on.
- **Missing: an author's and reviewer's journey in Studio** with Question Intelligence: from the flag to revising the question, through C1w and C2w's notes. J45-1 tells it as a system story, not as the author's screens.
- **J50-2 (staggered start):** add the **family's side** of R-4's communication. If families are told, what they read is a screen or a print, and it is part of the journey.

## 2 · §3's "What the user sees: open; Daisy", and what is genuinely open

| Item | What I can settle inside planning | Waits on an owner decision already listed |
|---|---|---|
| **4.2-01 Exam Mode** | The fixed points: no disabled controls on the assessment surface beyond R-A's «Mulai» (Slice-2); the learner told **before starting** what the exam restricts (orientation); A3's recovery words reused | **D-01** (what Exam Mode is). Accommodations too (§4.1) |
| **4.2-02/03 Context** | **The context named on every page** (a persistent «Sekolah: … · sebagai …» line), not only at the chooser. One switch control, the same everywhere | — |
| **4.2-04 Export** | The file and the screen both say **«Keadaan per {tanggal waktu} {zona}»**. The B1 event reference is shown after the download. The file name carries the school and the date. **No promise that a later deletion reaches a file already downloaded:** the screen says so plainly | **D-04a** (datasets and recipients) |
| **4.2-05 Past reports** | The banner pattern of §3.1, either way | **D-05** (as then, or as corrected) |
| **4.2-06 Name correction** | What verification shows (§3.2) | **D-06** |
| **4.2-07 Decline a request** | One neutral line, the same whether the account exists or not (rulings 17 and 20): «Permintaan ini tidak dapat diproses. Tanyakan kepada admin sekolah Anda.» No reason, which could disclose, unless the school writes one for the requester | — |
| **4.2-08 Password change** | Re-enter the current password; then «Password diganti. Anda keluar dari perangkat lain.» Learners: **not in scope** unless ruled. They sign in with cards | Only if learners are meant |
| **4.2-12 Question Health schedule** | See §5, D-1 | **D-12** |
| **4.5-05 Quiet Intelligence** | Screens are mine at its pre-build review. «Belum dapat disimpulkan» is a first-class state (§3.3) | Blocked on 4.5-01 to 4.5-03 |
| **4.5-11 WhatsApp sign-in** | Neutral failure and fallback lines in L-1's form | **D-45-11** (audience) |

**Owner decisions:** none new. The UX items either sit inside team authority or wait on D-01, D-04a, D-05, D-06, D-12 and D-45-11, all already in §5.1.

## 3 · Consistency across versions: four patterns to fix once

**The risk:** 4.2-05 (past reports), 4.5-04 (classification), 4.5-08 (history) and 5.0-03 (claims) each need the same few states. Built separately, they will each name them differently, as 4.0 did with «Cek penguasaan» and «Uji Penguasaan». **Proposal:** one short **vocabulary and pattern page**, owned in `hle.ts`, agreed **before 4.2 planning**.

### 3.1 · "As of" and "as issued"

| Situation | ID | Pattern |
|---|---|---|
| A view or file reflecting a moment | «Keadaan per {tanggal}, {jam} {zona}» | One `pin-meta` line at the top, and in every export and print |
| A past report shown **as it was** (if D-05 says so) | «Ini laporan seperti saat diterbitkan, {tanggal}. Sejak itu ada perbaikan. Lihat keadaan sekarang.» | A neutral banner with one link. Never two figures side by side without labels |
| A certificate or report re-rendered from a snapshot (4.5-08) | «Seperti saat diterbitkan, {tanggal}.» | The same words as above, so the reader learns one phrase |

### 3.2 · Corrected

- **Reuse 4.1's vocabulary,** already learned by teachers:
  - «Kunci soal ini sudah diperbaiki»;
  - «kunci yang berlaku sekarang»;
  - «Ditulis sebelum kunci soal ini diperbaiki …».
- Any later "corrected" state (a name, a school, a score) uses **«diperbaiki»** and states **what was before and since when**. Never «diubah» for a correction: that is an ordinary edit.

### 3.3 · Not concluded (RD-7)

- **One phrase: «Belum dapat disimpulkan»**, always followed by **why** and **what would make it possible**: «… karena baru {n} murid yang mengerjakan. Perlu paling sedikit {m}.»
- It must not reuse 4.1's «belum cukup data» variants silently. **Inventory them** (e.g. `KartuKetiadaan`) and fold them into this one phrase at 4.5.
- The four RD-7 classes (recorded, derived, inferred, not concluded) need **reader-facing names**. I propose:
  - «tercatat»;
  - «dihitung»;
  - «perkiraan»;
  - «belum dapat disimpulkan».

  Each has one icon-free text marker, because colour alone is not enough (§4).

### 3.4 · Refusals that disclose nothing, and a correction to my own Z-3

- **4.1 settled the rule in practice:**
  - A2b's S-1 and C2w's «Tarik izin»: an unknown and a forbidden target answer **alike**;
  - L-1 and rulings 17 and 20: sign-in never discloses state.
- **4.2 must carry this into:**
  - the export (another school's data);
  - the two-school context (school B from A);
  - the request decline (§2);
  - evaluation access (4.5-07).
- **⚠ My Z-3 contradicts it.** It asks that an **unknown** key-correction id give «not found» while a **forbidden** one gives the refusal. That tells a reader which ids exist.
  - **Revised Z-3:** keep one answer for both. Change only its wording, so it no longer implies the reader lacks permission when the item may simply not exist: «Koreksi ini tidak dapat dibuka. Mungkin sudah tidak ada, atau bukan untuk Anda.» The «Kembali ke antrean» link stays.
  - **This must replace my Z-3 before it lands as the first commit of C3w-1's branch** (Bob, 18 Nov, 06:30).
  - Anticipable by **question 2**, the neighbouring case: the forbidden id. Mine. Recorded in `ANTISIPASI-4.1.md` as V-3.

## 4 · Accessibility risks the plans must carry

| # | Risk | Where | What the plan must say |
|---|---|---|---|
| **4.1** | **Timed exams and accommodations** (WCAG 2.2.1, timing adjustable). A learner with a recognised need may need more time or a reader | 4.2-01 Exam Mode | **Inside D-01, an owner point:** whether Exam Mode allows per-learner accommodations, and who grants them. Without it, Exam Mode excludes learners by design |
| 4.2 | **Charts as the only carrier of meaning** (distributions, longitudinal patterns) | 4.5-01, 4.5-05 | Every chart has a text equivalent: a summary sentence, plus a table on demand. Denominators are stated in text |
| 4.3 | **State shown by colour or position only** (corrected, as of, not concluded, below target) | 4.2-05, 4.5-04, 4.5-08 | A text marker for every state (§3.3). Contrast checked in print too |
| 4.4 | **Wide tables at 320 px** (evaluations, aggregates, export previews) | 4.5-06, 5.0-05 | The Collection's stacked rows, as in B1. No horizontal scroll |
| 4.5 | **One-time codes by WhatsApp** (expiry, copying, screen readers) | 4.5-11 | Autofill (`autocomplete="one-time-code"`), a stated expiry, «Kirim ulang» after a visible wait, a fallback route |
| 4.6 | **Shared devices and sign-out** | J42-0, J42-12 | The two-school context and the password change must not leave another person's context on a lab computer |
| 4.7 | **Cognitive load of "a minute"** | 4.5-05 | Plain-language sentences at the reading level of the least-trained teacher. Tested in the walkthroughs Rev 3 proposes, with a teacher who did not see the design |
| 4.8 | **Evaluation documents read and responded to by the educator** | 4.5-06/07 | Accessible print and PDF (tagged headings, reading order). A response field usable by keyboard and screen reader. The response window stated with its end date and time and zone |

## 5 · Disagreements with Bob, for §7 as they stand

| # | Bob's draft | My position |
|---|---|---|
| D-1 | 4.2-12: schedule known-defective Question Health figures with a disclosed limitation, **or** move it (D-12, owner) | **From the user's side: move it to 4.5, behind the repair.** A teacher does not read a limitation footnote. A fresher wrong figure is trusted more than a stale one. Scheduling it makes the defect look endorsed |
| D-2 | J42-1 as "the first-day experience" | It is the **admin's** first day of a year. The first-day experience the owner asked about is a teacher's and a learner's (J42-0). Add it rather than rename |
| D-3 | 4.5-05's "about one minute" stated as a requirement | It is a **design goal to measure**, not a requirement the plan can assert. Rev 3's walkthroughs should time it, and the plan should name the measurement (M-03) |
| D-4 | 4.2-09 classed COMPLETE | **Agree,** with one UX point inside planning: a class whose teacher left mid-term (J42-11) should appear there too, not only classes never assigned |
| D-5 | G-8: consider moving server-side progression earlier | **Agree, strongly.** Learners meet page-only progression today. It is an integrity and experience issue, not a 5.0 feature |

## 6 · Anticipation

**My V-3** (Z-3's existence oracle) is the one defect found in this review. It is recorded with the 4.1 defects.

---

## 7 · Addendum: revision 2 (`3c1e3c7c`), 18 Nov 08:45

**What holds now for revision 2:**
- §1 to §6 above **still apply.** Revision 2 does not yet include my journeys or my vocabulary patterns. It may have crossed with my review.
- Three new points below: **one challenge to a recommended answer that affects what the public sees (D-06)**, agreement with the rest, and a numbering clash.

### 7.1 · Bob's new journeys

- **J42-9 (Question Health on a schedule), J42-10 (imported external AI content), J50-5 (interrupted governed journey): agreed.**
- **Numbering clash:** my §1 proposed J42-9 to J42-12 (an ordinary week, a mid-term transfer, a teacher leaving mid-term, a lab session with a cut) and J42-0 (the first day). **Renumber mine J42-11 to J42-14, and keep J42-0** as the first day, so it reads first.
- **J42-10 (imported AI content):** add one outcome. **The learner sees no AI marker** on an imported question, as for C3w. The self-declared field is staff-only.

### 7.2 · §5.1's recommended answers that touch what a user sees

| Decision | Bob's recommendation | My position |
|---|---|---|
| **D-06** | Certificate stays as issued; **verification shows the current name and "name corrected on {date}"** | **Challenge. Do not show the current name on public verification.** Verification is reachable by anyone holding the link or code. Showing both names tells a stranger that a learner's name changed, and to what. That can be sensitive: a family's safety, a legal change of name. **Instead:** verification shows the certificate **as issued**, with «Sertifikat ini sah.» Nothing about later changes. The school sees the correction in its own records. **Reissue on request** (Bob's own line) is how a family gets a corrected certificate. This is a privacy point, so Sharon should see it too |
| D-11a | Verification shows the current school name with "formerly …" | **Agree.** A school is not a person. «Sebelumnya bernama …» |
| D-05 | Past reports **as corrected now**, with a "corrected" marker and the date | **Agree.** The marker uses §3.2's vocabulary: «Diperbaiki pada {tanggal}», with what changed on demand. The as-issued reconstruction stays 4.5-08's, with «Seperti saat diterbitkan» (§3.1) |
| D-01 | Fixed start window, A3 recovery, A1 controls with reasons, no lockdown or monitoring, results marked "exam" | **Agree, plus §4.1:** per-learner **accommodations** (extra time) belong in this same decision. The "exam" marker is staff-facing. A learner's result page needs no label beyond the assessment's name |
| D-04a/b | Excludes educator evidence and the B1 store; allowed before R-2 with "as of" and stated obligations | **Agree.** The screen says the obligations in plain words before download: «Berkas ini salinan per {tanggal}. Setelah diunduh, sekolah yang menjaganya: PINTAR tidak dapat menghapus atau memperbaruinya.» |
| D-12 | Do not schedule a misleading figure; correct first, or schedule only unaffected figures with any limitation shown | **Agree.** It now matches my D-1 |
| D-45-11 | Staff only first | **Agree** |
| D-C3, C4 | Admit both | **Agree**, with the learner-side rule in §7.1 |
| D-02 | Positions descriptive; acting cover a dated grant | **Agree.** The context line (§2) shows «sebagai … (pelaksana tugas, sampai {tanggal})» |

### 7.3 · Owner decisions

- **No new owner decision from me.** D-06's challenge is to Bob's **recommended answer**, for the owner to weigh when D-06 comes up at 4.2 planning.
- **One addition to an existing decision:** accommodations, inside D-01.
