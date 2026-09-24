# CORPORATE WEBSITE: REVIEW AND CANONICAL RECONCILIATION PLAN

**For:** Sauron · **By:** Pete · **Date:** 2026-09-24
**Mode:** review and reconciliation plan only. **No website file was changed.**
**Reviewed design:** `website/corporate/` at `6b248774cdc8e35087e57aec6c0907ce3818139d`
**Working branch:** `claude/hopeful-turing-43hvpr`

---

## A · Executive result

# RECONCILIATION REQUIRED

**The direction is sound, and the reconciliation is bounded.** Structure, tone, the nine routes, the visual system, the bilingual architecture and the accessibility work all hold up against the canonical implementation. Nothing here calls for a redesign.

**It is not ready for polish.** Five things stand in the way.

1. **There are two Mini-PINTARs, and the corporate one breaks an approved rule.** It writes to browser storage, which ADR-0021 forbids ("no persistence of any kind, including browser storage"). It uses its own vocabulary instead of the product's learner cycle. Its quiz mostly tests things the learning step did not teach (§E).
2. **The report illustrations use a model PINTAR does not have.** Both `/laporan/` and the Mini-PINTAR management screen draw "strong / partial / not enough evidence" as three kinds of learner. In canonical PINTAR, *belum cukup bukti* is a state of a **figure**, never a category of learner. The real class report uses readiness tiers, averages, gain, topic mastery and recurring misunderstandings. These are governed metrics with governed minimum samples (§D, §H-P5).
3. **Seven public claims are inaccurate or unsupported.** Examples: an audience PINTAR has no surface for (Dinas), "interactions" becoming evidence, a team claim with no evidence in the repository, and an unmeasured "one hour" time saving (§D, §G).
4. **Identity is unresolved, and the canonical repository has already recorded decisions the prototype ignored.** The canonical app ships a supplied PINTAR SELALU mark. Its code records primary `#245F55` as approved on 2026-09-16 and "not frozen". The website invented a square mark and a different green, `#0A6E4B`. I am reporting this, not resolving it (§F).
5. **Implementation status.** Canonical `main` has not yet shipped the end-to-end school flow (sprint 1, D-005). The last release checklist run recorded **NO-GO**. The site describes the designed product, which is legitimate, but it must not go to production framed as "in use today" (§D).

**Beyond the website's scope, two things need ruling but not from this task.**
- Canonical `main`, and the production release `5b5b68d`, implement anonymous Student → Educator feedback. Management opens those rounds about named educators (ADR-0022/0023). That contradicts the sync statement that Umpan Balik has no production implementation.
- The Mini-PINTAR ADR number is already taken on canonical (§B.4).

---

## B · Canonical baseline evidence

### B.1 · The baseline moved after the sync message, and the repository says where

| | SHA | Branch | Migrations | Selftest manifest |
|---|---|---|---|---|
| **Canonical implementation (now)** | **`2ac7ab6dd…`** (`2ac7ab6`) | **`main`** | **114** | **v70 · 320 tests** |
| Last integration gate on it | `c5781d4` | `gate/integration-4` (ancestor of `main`) | 114 | v70, CI #180 23/23 |
| Production release | `5b5b68d` | (ancestor of `main`) | 111 | v60 · 286 tests |
| Declared in the 24 Sep sync | `9c21df9` | `claude/sleepy-fermat-hbmuxl` | 87 | v40 · 220 tests |
| That branch's tip now | `619583f` | `claude/sleepy-fermat-hbmuxl` | 102 | (ancestor of `main`) |
| **Where the website was designed** | `6b24877` | `claude/hopeful-turing-43hvpr` | **70** | v11 · 151 tests |

**Why `main`, established from evidence rather than assumed:**
- **D-004** (canonical decisions, 24 Sep): *"`main` is the only trunk and the only source of production… Only the coordinator merges into `main`."*
- `main` **contains** `9c21df9`, the `sleepy-fermat` tip, both integration gates and the production release `5b5b68d`. It supersedes the sync's declaration rather than conflicting with it.
- `RELEASES.md` records "`main` fast-forwarded to the production source" on 24 Sep.
- One small inconsistency: `BOARD.md`'s header still reads "`main` is at `21a8947`". The ref is `2ac7ab6`, and the board line is stale.

**What I need from you:** confirm `main@2ac7ab6` as the baseline for the patch in §H. The sync named `9c21df9`. I believe D-004 supersedes it, but I will not apply a patch against a baseline you have not confirmed.

### B.2 · How I inspected it

Everything was read-only. I used `git ls-remote` and fetched the branches. I checked each branch against the others to see which contain which. I read `main` in a read-only worktree in scratch space. No canonical file was changed, nothing was merged and nothing was deployed.

Sources read:
- `supabase/migrations/*`, 114 files, especially these:

  | Migration | Covers |
  |---|---|
  | `0091` | scope |
  | `0095` | deliberate learner opening |
  | WP2 | *pintar_proposes_a_human_decides* |
  | R5 | *enough_evidence_to_say_it_yet* |
  | WP7B/7D | feedback |
  | W8-02 | institution report templates |
  | `metric_catalogue` | MC-1 |
  | `role_capabilities` | the current definition |
- `src/lib/hle.ts` (the product's own words)
- `src/lib/pengajar.ts` (what an educator is shown)
- `src/lib/umpanbalik.ts`
- `src/components/MerekPintar.tsx`
- `src/app/globals.css`
- `docs/coordination/{BOARD,DECISIONS,RELEASES}.md`
- `docs/adr/0021…0024`
- `docs/rebuild/11` (OD-11)

### B.3 · Canonical role capabilities (from `role_capabilities()`, current definition)

| Role | Capabilities |
|---|---|
| EDUCATOR | DRAFT · ASSIGN_LEARNING · QUICK_ASSESSMENT · VIEW_LEARNER_ROSTER · VIEW_LEARNER_RESULT |
| HEAD_OF_DEPARTMENT | DRAFT · REVIEW · FREEZE_RELEASE · ASSIGN_LEARNING · QUICK_ASSESSMENT · REVIEW_QUESTION_HEALTH · REVIEW_INTEGRITY · VIEW_LEARNER_ROSTER · VIEW_LEARNER_RESULT. **No** PUBLISH, AUTHORIZE_TRANSFER, MANAGE_REPORT_TEMPLATES or PROVISION_PEOPLE |
| DEAN | VIEW_LEARNER_ROSTER **only**, so no Studio capability |
| INSTITUTION_ADMIN | everything except VIEW_LEARNER_RESULT ("an administrator is not an examiner") |
| SYSTEM_ADMIN | all 13 |

This matches your sync note exactly (DEAN has zero Studio capabilities; HoD lacks PUBLISH, TRANSFER and TEMPLATES).

### B.4 · Canonical facts relevant to this review, several of them new since the sync

- **Institutional Learning Intelligence exists.**
  - MC-1 has 16 metrics with governed minimum samples: 1 for a participant count, 3 for misconceptions, 5 for class figures, 10 for institution figures, 30 for item statistics.
  - It has readiness tiers.
  - Every figure carries one of three evidence states: `NOT_YET_EVALUABLE` / `INSUFFICIENT_EVIDENCE` / `SUFFICIENT_EVIDENCE`. On screen these read "Belum ada yang memenuhi syarat / Sudah ada, belum cukup / Cukup untuk ditafsirkan".
  - An institution assembles its own report from an approved subset of metrics and defines nothing (W8-02, ADR-0024).
- **Organisational scope is enforced on the learning-intelligence read path** (0091, *"a reader sees the part of the school they stand in"*). A head of department is bounded to their node and its descendants. Your sync said this was "not currently enforced". It now is, which bears on reserved decision 1.
- **A Management decision foundation exists** (WP2): evidence → decision candidate → human decision → state, with an integrity-referral path. The Pimpinan home reads *"Apa yang menunggu Anda"*. This bears on reserved decisions 2 and 3.
- **Anonymous Student → Educator feedback is implemented and in production** (WP7B–D, ADR-0022/0023, migration in `5b5b68d`). Management opens a round about a named educator. The educator and Management over the class read a threshold-guarded result.
  - This conflicts with your sync ("Umpan Balik has no production implementation") and with Management rulings R2/R4.
  - The website makes no feedback claim, so **the website is unaffected**. The conflict is reported here only.
- **The canonical ADR-0021 is a different ADR** ("a new function is closed by construction"). The Mini-PINTAR ADR exists only on my design branch, under a number `main` already uses. On `main`, doc 11 still reads **OD-11 OPEN**, so Mini-PINTAR STOP-1 remains owed.
- **The website does not exist on `main`.** `website/` lives only on my design branch.
- **Educator surface (`pengajar.ts`).**
  - An educator sees class figures: comprehension, gain, topic mastery, recurring misunderstandings with remediation, and readiness distribution.
  - They also see *"Satu hal yang paling layak dikerjakan lebih dulu"* and *"Yang bisa Anda lakukan sekarang"*.
  - An educator does **not** see per-item responses. Those are `CAN_REVIEW_INTEGRITY`, which only a head of department holds.

---

## C · Page-by-page review

Key: **K** = KEEP · **R** = REFINE · **X** = REMOVE · **C** = CANONICAL RECONCILIATION REQUIRED.

### 1 · `/`
| Content | Class | Note |
|---|---|---|
| Eyebrow, headline *"Lebih banyak waktu untuk mendidik."*, lede | K | The positioning, stated as a promise rather than a statistic |
| Primary CTA *Coba Mini-PINTAR* | K | |
| Secondary CTA *Kenali PINTAR* → `/tentang/` | R | Should point to `/apa-yang-dilakukan/`. The label promises the product, not the company. |
| *DIRANCANG UNTUK: Guru dan Pendidik · Kepala Sekolah · Yayasan Pendidikan · Dinas dan Pengambil Kebijakan* | **C** | Canonical has no surface for a yayasan (multi-school operator) or for a dinas. Use the product's own roles. |
| Six-node chain | K | Conceptual; the canonical cycle names belong on the next page |
| Educators card: *"…langsung lihat apa yang perlu perhatian Anda hari ini"* | R | "Langsung" overstates. Figures appear only once official evidence meets the minimum. |
| Management card | K | Aggregate and non-ranking, which is true |
| Reports teaser | K | The claim is true (three evidence states) |
| Closing *"Lima menit…"* | R | Conflicts with the ruled duration of about three minutes |

### 2 · `/apa-yang-dilakukan/`
| Content | Class | Note |
|---|---|---|
| Header, pull-quote *Bukti → Pemahaman → Keputusan manusia*, both explanation blocks, cross-link | K | The doctrine is canonical (WP2) |
| Flow · *Pembelajaran: "…dengan caranya sendiri"* | R | Vague. What canonical does is adapt the reading order from the Pemetaan Awal. |
| Flow · *Bukti: "Setiap jawaban menjadi bukti"* | K | Consider "setiap jawaban resmi". Demo and preview answers never count. |
| Closing *"dalam lima menit"* | R | Duration |
| (missing) the product's own cycle names | R | Add *Pemetaan Awal → Peta Bacaan → Pelajaran → Uji Penguasaan → Hasil* once, so the site and the product share one vocabulary |

### 3 · `/untuk-pendidik/`
| Content | Class | Note |
|---|---|---|
| Headline, quote, closing, hero placeholder | K | |
| Lede *"…biasanya memakan satu jam bisa dipangkas…"* | R (§G) | A quantified time claim with no measurement anywhere in the repository |
| 01 *Siapkan pembelajaran: "…tanpa memulai dari nol setiap kali"* | **C** | True in capability: Studio drafting, workbook import, the PINTAR library. But an educator does not publish alone. Review, freeze and publish need HoD or school-admin roles and the four-eyes rule. The releases path (BOB-03) is also not yet merged. |
| 02 *Jalankan asesmen* | R | Canonical is **Uji Cepat** (D-015). Use the product's name. |
| 03 *"Begitu jawaban masuk…"* | R | Figures come from finished sessions above the minimum sample, not live answers |
| 04 *Ambil keputusan* | K | Matches *"Yang bisa Anda lakukan sekarang"* |

### 4 · `/untuk-manajemen/`
| Content | Class | Note |
|---|---|---|
| Headline, lede | K | Matches canonical *Kesiapan bukti* |
| Boundary headline *"Ini bukan alat untuk mengawasi orang."* | **C** | Canonical gives HoD and Dean a learner roster. It gives a deliberate, **audited** way to open one learner's record (0095). Management can open feedback rounds about a named educator. So the absolute is not defensible. |
| Boundary body *"bukan peringkat guru, bukan peringkat siswa… bukan rapor perilaku"* | K | True. The product's own copy says "ini urutan, bukan peringkat". |
| Example 1 *Ringkasan tingkat sekolah* | K | School summary exists (`/dekan/ringkasan`, W8-02) |
| Example 2 *Cakupan bukti per kelas* | K | Kesiapan bukti |
| Example 3 *"…bukan daftar nama"* | R | Rosters exist. What is true is "no ranking of names". |
| *"Kepala sekolah dan pengelola institusi"* | R | Use the product's role words (Kepala departemen · Dekan · Admin sekolah), or a neutral "pimpinan sekolah" |

### 5 · `/cara-kerja/`
| Content | Class | Note |
|---|---|---|
| Header, steps 1, 4, 6, cross-link | K | |
| 2 *"…mengerjakan asesmen singkat"* | R | Name the cycle |
| 3 *"Setiap jawaban **dan interaksi** meninggalkan jejak bukti"* | **C** | Interaction telemetry is never evidence and never scores (INV-11). Only official assessment answers are evidence. |
| 5 *"PINTAR menunjukkan pola…"* | R | Same timing refinement as page 3 |

### 6 · `/laporan/`
| Content | Class | Note |
|---|---|---|
| Header (says "data simulasi"), principle *"Belum cukup bukti adalah hasil yang sah"*, closing | K | Principle is canonical (R5). Its body can quote the product verbatim: *"Bukti yang belum cukup bukan hasil yang buruk. Artinya PINTAR belum boleh menyimpulkan apa pun…"* |
| Legend *Pemahaman kuat / Sebagian dipahami / Belum cukup bukti* | **C** | Invented. Canonical tiers are *Siap sertifikasi / Perlu review / Butuh pendampingan ekstra / Belum mengerjakan penilaian akhir*. *Belum cukup bukti* is a figure state, not a tier. |
| Report A *Laporan Kelas* | **C** | Redraw from the canonical class-report figures (§H-P5) |
| Report B *Ringkasan Sekolah* | **C** | Canonical institution figures: participants, gain (min 10), required items (safety gate), cohort comparison, competency outcomes, verified credentials. There is no subject-by-subject breakdown. |
| Report B unresolved note *"…kemungkinan karena asesmen baru mulai berjalan"* | R | A report must not guess a cause. The product itself says "PINTAR tidak tahu sebabnya". |

### 7 · `/tentang/`
| Content | Class | Note |
|---|---|---|
| Header, essays 2 and 3, closing | K | |
| Essay 1 *"Pendidik menghabiskan banyak waktu…"* | R | Asserted universally. "Banyak pendidik…" is supportable. |
| **"Siapa yang membangunnya"** + team photo placeholder | **X** (§G) | No evidence in the repository. Remove unless you provide a verifiable basis. |

### 8 · `/kontak/`
| Content | Class | Note |
|---|---|---|
| Header, form fields, the design-sample note, the confirmation | K | Honest while inert |
| "Setelah Anda mengirim" (three process promises) | K, conditional | True only once a named person owns the inbox and the response (§H-P9) |
| Role option *Dinas / Pembuat Kebijakan* | K | Asking who someone is is not a capability claim |

### 9 · `/mini-pintar/`
| Content | Class | Note |
|---|---|---|
| The whole journey | **C** | Convergence with M1/M2 (§E). Not patched until you rule. |

### Shared chrome
| Content | Class | Note |
|---|---|---|
| Design-sample banner, footer tagline | K | |
| Square-in-square mark | **C** (§F) | Label it as a placeholder. Develop nothing further. |
| *"© 2026 PINTAR"* | R | The legal entity name for copyright and contact is unconfirmed (§G) |

---

## D · Product claim audit

| # | Website claim (ID) | Canonical evidence | Accurate? | Required change |
|---|---|---|---|---|
| 1 | *Lebih banyak waktu untuk mendidik* (positioning) | A promise, not a capability. Doctrine consistent throughout. | Yes, as positioning | none |
| 2 | *DIRANCANG UNTUK … Yayasan Pendidikan, Dinas dan Pengambil Kebijakan* | `app_role`: STUDENT, EDUCATOR, HEAD_OF_DEPARTMENT, DEAN, INSTITUTION_ADMIN, SYSTEM_ADMIN. An institution is one school. No cross-school or dinas surface exists. | **No** | Guru · Kepala Departemen · Pimpinan Sekolah · Admin Sekolah |
| 3 | *…langsung lihat apa yang perlu perhatian Anda* | `mengajar.beranda.intro` shows "the one thing most worth doing first". Figures need `minimum_sample` (5 for a class). | Partly | Drop "langsung" |
| 4 | *Siapkan pembelajaran… tanpa memulai dari nol* | EDUCATOR holds CAN_DRAFT. Studio has `kanonik` (the PINTAR library) and `unggah` (workbook import, BOB-02 merged). Publishing needs HoD/admin and four-eyes. BOB-03 (releases through the app) is **not merged**. | Capability yes; solo publishing no; end-to-end not yet | Say the school reviews before use. Do not imply an educator publishes alone. |
| 5 | *Jalankan asesmen* / *asesmen singkat* | Uji Cepat (`/mengajar/[kelas]/uji-cepat`; D-015 "Uji Cepat everywhere") | Yes, wrong name | Use **Uji Cepat** |
| 6 | *Begitu jawaban masuk, PINTAR menunjukkan pola* | Metrics are over finished official sessions. `class.misconceptions` has a minimum of 3, with remediation. | Timing overstated | "Setelah cukup banyak yang selesai…" |
| 7 | *…bukan daftar nilai satu per satu* | `pengajar.ts` never selects per-learner mastery. Lists are alphabetical and "bukan peringkat". | Yes | none |
| 8 | *Setiap jawaban dan interaksi meninggalkan jejak bukti* | Evidence is OFFICIAL assessment answers only. Telemetry never scores (INV-11). | **No** | Remove "dan interaksi" |
| 9 | *PINTAR mengusulkan. Pendidik memutuskan.* | WP2: "no path writes an outcome without a named human" | **Proven** | none |
| 10 | *Setiap laporan… mengatakan dengan jujur ketika buktinya belum cukup* | R5 three evidence states, the governed minimum per metric, and the product's own copy | **Proven** | none |
| 11 | *Ini bukan alat untuk mengawasi orang* | 0095 roster plus the audited deliberate learner opening; WP7B/7D feedback rounds about named educators | Absolute is **not** defensible | "Laporan tentang pembelajaran, bukan peringkat orang", plus one honest line that opening a learner's record is deliberate and recorded |
| 12 | *bukan peringkat guru, bukan peringkat siswa* | No ranking metric in MC-1; the product's copy repeatedly says "bukan peringkat". `institution.cohort_comparison` compares cohorts, not people. | **Proven** | none |
| 13 | *Pola yang layak dibahas, bukan daftar nama* | HoD and Dean hold VIEW_LEARNER_ROSTER | Partly | "…bukan peringkat nama" |
| 14 | Report legend, three learner bands with raw counts | MC-1 has readiness tiers (≥80% plus safety gate / 60–79% / <60% or gate failed / Uji Penguasaan not yet taken), `class.comprehension` (class average), `net_gain`, `topic_mastery`, `misconceptions` | **No**, invented model | Redraw per §H-P5 |
| 15 | *Belum cukup bukti* shown as a band of learners | R5: a state of a **figure**, never a learner category | **No** | Show it as the figure's state |
| 16 | *Ringkasan Sekolah* by subject (Matematika/Literasi/Sains) | Institution metrics are participants, gain, safety gate, cohort comparison, competencies and credentials, with audience-scoped reads (0091) | **No** | Redraw from the institution metrics |
| 17 | Unresolved note guessing a cause | The product's own copy: "PINTAR tidak tahu sebabnya" | **No** | Delete the guessed cause |
| 18 | *Tidak perlu akun* (Mini-PINTAR) | M2 is zero-write. The corporate version has no account either. | **Proven** | none |
| 19 | Mini-PINTAR educator view shows **per-question evidence** for a learner | Educators do not see per-item responses (`pengajar.ts`; CAN_REVIEW_INTEGRITY is HoD-only) | **No** | See §E. A faithful educator view shows class figures, and with one learner every figure honestly reads "belum cukup". |
| 20 | The whole site's implied status | Sprint 1 (D-005) is not done. Checklist baseline 13/79 P0 → **NO-GO**. Production stays on `5b5b68d`. | Must not read as "in use today" | No live or adoption framing; launch gated (§H) |

**Silences checked:** the site never claims AI, adoption, customers, outcomes, certification or feedback. That is correct, and should stay so until each has canonical and factual evidence.

---

## E · Mini-PINTAR convergence

### E.1 · Matrix

| Dimension | Approved M1/M2 (`website/mini-pintar/app`) | Corporate (`website/corporate/mini-pintar`) |
|---|---|---|
| Purpose | Let a visitor *experience* PINTAR's learning cycle and watch it refuse to overclaim | Walk the value chain end to end: learn → evidence → educator → management |
| Audience | Adults: educators, school leaders, parents, decision-makers (register `Anda`) | The same |
| Learning content | **"Membaca Angka / Reading a Number"**: three data-literacy domains (what a number counts; when a conclusion may be drawn; linked vs causing), reviewed and approved in M1 §3 | Simple arithmetic: one taught example (12 × 4) and five mixed items |
| Journey | Pemetaan Awal (3) → **Peta Bacaan** (order adapted to the answers) → one Pelajaran → Uji Penguasaan (2) → Hasil → "Itu tadi PINTAR" reveal | Mulai → Belajar → 5 questions → Bukti → Educator view (decision) → simulated management report → Selesai |
| Canonical fidelity | **Uses the product's own vocabulary and cycle** (Pemetaan Awal, Peta Bacaan, Uji Penguasaan, Hasil all appear in canonical `hle.ts`) | Own vocabulary ("Asesmen Singkat", "Bukti"). No pre-test and no map, so it does not show adaptation, the product's core mechanic. |
| Assessment behaviour | Deterministic, pure adaptation module; answers committed; rationales revealed after commit; hints never name the answer | Tap-to-answer, auto-advance, no rationale, no change of mind |
| Pedagogical coherence | The check items test the domain of the lesson just read | **Weak.** Only Q1 (and loosely Q4 and Q5) test what was taught. Division and fractions were never taught, so the "evidence" measures prior knowledge, and the educator view can flag a concept the journey never taught. |
| Evidence generation | Real per-answer evidence, misconception codes kept internal, never exposed | Real per-answer evidence (computed, not scripted, and verified across three answer sets) |
| Educator interpretation | Not present, only a door ("Apa artinya bagi pendidik") | **Present, and strong in concept:** perspective shift plus a real human-decision interaction. But it shows per-question evidence an educator never sees in PINTAR. |
| Management interpretation | Not present | **Present:** simulated class, clearly labelled, fixed regardless of the visitor. But it uses the non-canonical band model. |
| Persistence / storage | **Zero-write**: memory only, no storage of any kind (asserted by `isolation.mjs`) | **Writes `localStorage` key `pintar-site-lang`** (`shared/lang.js:12`, `:23`) |
| Privacy | Nothing kept, and this is proven | No answers kept. One UI preference kept. |
| ADR-0021 compliance | Complies (it is the ADR's reference implementation). The evidence-limit sentence appears in every outcome. | **Breaches** "no persistence of any kind, including browser storage". Has no ADR evidence-limit sentence (it has its own humility clause). |
| Bilingual | ID/EN pairs, register and overclaim audit | ID/EN pairs, banned-vocabulary audit |
| Accessibility | Keyboard-only completion, live region, reduced motion, zoom, contrast at every step, both widths; 383 browser checks and 47 plants | 44 px targets, 14 px floor, 320 px reflow. Contrast measured **only on the start screen**. No keyboard-only journey check, no focus management between stages, no live region, no reduced-motion rule. |
| Duration (200 wpm plus interaction; an estimate, not user-measured) | About 3 minutes for the cycle; the reveal adds about 30 s | About **3 min 45 s** (ID) and 3 min 55 s (EN); the educator and management steps are 280 words, about 85 s |
| Strengths | Governance, fidelity to the product, pedagogy, accessibility, proven honesty | The value chain made visible: the perspective shift, the human decision, the management aggregation. Visually integrated with the site. |
| Weaknesses | Ends at the learner; never shows the school side | Pedagogical incoherence, a non-canonical vocabulary and report model, a storage breach, thinner accessibility |

### E.2 · Pedagogical coherence

The corporate journey does not show evidence **about what the visitor was just taught**:

- The lesson teaches one idea (multiplication as repeated addition).
- The check then samples four other concepts.
- So PINTAR's central claim, that it measures the effect of learning, is not what the visitor experiences.

It also has **no Pemetaan Awal**. The visitor never sees the product's adaptation, and adaptation is what the canonical cycle is built around.

A coherent demonstration needs one small objective: a before-question, one short lesson on it, and a check on the same objective. M2 is already built exactly that way.

### E.3 · Duration

The ruling is *about three minutes* (M1 ruling; ADR-0021 "about three minutes"; M2 pins "Sekitar tiga menit").

The corporate site says **"Lima menit"** (Home and What-PINTAR-Does) and **"Sekitar 3–5 menit"** (Mini-PINTAR). I did not change the ruling, and I am not proposing a new one. The recommendation below is built to fit it.

### E.4 · Recommendation (for review; **not implemented**)

**One Mini-PINTAR: the approved M2 cycle as its core, with a short, optional school-side continuation adapted from the corporate version.**

1. **Core, unchanged in governance.** M2's cycle, vocabulary, adaptation module, content model, rationales, internal misconception taxonomy and evidence-limit sentence. It stays zero-write, with no storage of any kind. It is re-skinned into the corporate visual system and its minimal chrome. The core stays about three minutes, and that is the only duration the site states.
2. **Optional continuation, about 60 seconds, clearly labelled.** It appears after the Hasil as *"Lihat dari sisi sekolah"*.
   - **Sisi pendidik.** "Bayangkan Anda pendidiknya." It shows what the product actually shows: class figures and *"Yang bisa Anda lakukan sekarang"*.
     - With **one** learner, every class figure honestly reads **"Sudah ada, belum cukup"**, because the canonical minimum is 5.
     - That is ADR-0021's own argument made visible: the refusal is the differentiator.
     - The visitor still makes the human decision, from the corporate version's three options.
   - **Sisi pimpinan.** The corporate version's simulated class report, clearly badged *DATA SIMULASI* and fixed. It is **redrawn from the canonical MC-1 class figures**: readiness tiers, topic mastery, recurring misunderstandings, and evidence states on each figure.
3. **Subject: a ruling is needed.**
   - **Option A (my recommendation):** keep *Membaca Angka*. It is approved, reviewed and verified. It is low-difficulty for adults. Its lesson (*"don't conclude more than the evidence supports"*) is PINTAR's own message.
   - **Option B:** if you require Mathematics, author **one** coherent arithmetic objective in M2's content model: 3 Pemetaan Awal items, three short lessons, 2 Uji Penguasaan items per domain, with rationales and codes. This is new content and needs its own M1-style review and a native editorial read (STOP-4). It replaces the current five-concept quiz; it does not keep it.
4. **What retires.** The corporate `mini-pintar/` stops being a second definition. Its perspective and decision screens are carried into (2). Its quiz, its band model and its storage do not survive.
5. **Owed regardless of choice.** ADR renumbering and baseline integration (the Mini-PINTAR ADR's number is taken on `main`; OD-11 is still OPEN there, which is STOP-1). Accessibility parity: every M2 check applies to the continuation too.

### E.5 · Storage conflict (§13 of your brief)

| | |
|---|---|
| **What is written** | One `localStorage` key, `pintar-site-lang`, value `"id"` or `"en"`. It is written when a URL carries `?lang=` or the language switch is pressed, on **every** corporate route, **including `/mini-pintar/`**. It is read on load. |
| **Why it exists** | So a returning visitor keeps their language. It adds almost nothing: `withLang()` already carries `?lang=` on every internal link, so navigating the site never needs it. |
| **Is it meaningful user-data persistence?** | Low sensitivity. It is a UI preference with no identifier, no answer and no progress. But it is still persistence on the visitor's device, and it survives the visit. |
| **Relationship to ADR-0021** | A **breach as written**: "no persistence of any kind, **including browser storage**". Inside Mini-PINTAR there is no room to interpret this away, and M2's audit plants a `localStorage` write specifically to prove the rule is enforced. |
| **Recommendation** | Remove it **site-wide**, not only in Mini-PINTAR. Language travels in `?lang=` alone (M2's approach). The corporate site then writes nothing at all, which also means no consent banner question ever arises. No schema, backend or cookie is proposed. |

---

## F · Brand and identity: open decisions (not resolved here)

| # | Decision you need to make | What exists today (facts, not a recommendation) |
|---|---|---|
| F1 | **The corporate site's identity asset (STOP-6).** Is it the supplied mark, or something else? | Canonical `main` ships `public/brand/pintar-selalu-logo.png` (766×429, pale band "PINTAR" over dark band "SELALU"), described in `MerekPintar.tsx` as *"The official PINTAR SELALU mark… the file Yazid supplied, byte for byte"*. It was uploaded on 17 Sep and there is an institution-mark ruling of 17 Sep. The corporate site's square mark was **invented by me**, is not approved, and will be labelled a placeholder (H-P1). |
| F2 | **The brand name shown publicly: "PINTAR" or "PINTAR SELALU"** | The app's name string is `"PINTAR"` (`app.name`). The supplied artwork reads "PINTAR SELALU". The domain is `pintarselalu.com`, and staging is `staging.pintarselalu.com`. The real schools are *SD/SMA Zayd Pintar Selalu*. **I infer nothing from these.** |
| F3 | **Brand colour for the corporate site** | Canonical `globals.css`: *"PRIMARY… now #245F55… APPROVED by Yazid on 2026-09-16. APPROVED AND IN USE — NOT FROZEN."* The website uses `#0A6E4B`, a **design exploration** that will be labelled provisional and not propagated. Also open: whether the corporate site must follow the product's primary at all. Your original brief said the site need not follow the app's design language. |
| F4 | **Typeface** | Canonical self-hosts Plus Jakarta Sans and IBM Plex Mono (under OFL licences). The website uses system fonts. This is a brand question only if F1–F3 decide the site speaks with the product's identity. |
| F5 | **Separate the brand accent from the evidence colours?** | **Recommendation: yes, separate them.** Today one token (`--accent`) is both the brand green and the "strong evidence" band colour. A brand change would then repaint evidence semantics, and an evidence colour could be mistaken for "good/brand". Canonical already separates them ("one primary… calm semantic status"). Proposed tokens: `--brand-accent` (provisional), `--evidence-sufficient / -insufficient / -not-yet`, and an ordinal ramp `--tier-1…4` for readiness tiers, each validated with the palette checker. The values are yours to rule. |
| F6 | **The legal entity** named in © and the contact channel | Not found in the repository |

---

## G · Factual and trust-claim audit

| # | Claim | Basis found | Verdict |
|---|---|---|---|
| G1 | *"PINTAR dibangun oleh orang-orang yang pernah berdiri di depan kelas dan pernah membangun perangkat lunak untuk pendidikan…"* | **None.** No team, founder or staff record anywhere in the repository or docs. | **REMOVE** (with its team photo placeholder) unless you supply a verifiable basis |
| G2 | *"…pekerjaan yang biasanya memakan satu jam bisa dipangkas jauh lebih singkat"* | The idea comes from your brief. There is no measurement, study or pilot data in the repository. | **QUALIFY or REMOVE**. Keep the intent ("mengambil alih pekerjaan menyusun dan membaca ulang jawaban") without a quantity until something is measured. |
| G3 | *"Pendidik menghabiskan banyak waktu memeriksa, mencatat…"* | General experience, no source | **QUALIFY**: "Banyak pendidik…" |
| G4 | *DIRANCANG UNTUK … Yayasan, Dinas…* | No such product surface | **REMOVE** (see D2) |
| G5 | *"Ini bukan alat untuk mengawasi orang"* | Contradicted by canonical roster, learner-opening and feedback features | **QUALIFY** (see D11) |
| G6 | *Belum cukup bukti* / *PINTAR tidak pernah berpura-pura tahu…* | R5 migration, the governed minimums and the product copy | **PROVEN** |
| G7 | *PINTAR mengusulkan, manusia memutuskan* | WP2 migration | **PROVEN** |
| G8 | *Tidak perlu akun* | M2 zero-write, `isolation.mjs` | **PROVEN** |
| G9 | Duration *"Lima menit" / "3–5 menit"* | Ruling says about three; my estimate for the corporate version is about 3¾ | **CORRECT** to the ruled wording once §E is decided |
| G10 | Contact promises (*"Kami membaca… menghubungi… menyesuaikan…"*) | No owner, inbox or process exists | **Conditional.** True only when H-P9 is staffed. Until then the design-sample note keeps them honest. |
| G11 | Implied implementation status | Sprint 1 not released; NO-GO recorded | **No live, adoption or customer framing.** The site currently has none. Keep it that way. D-003 (real schools) and D-031 (signed MOU) exist, but **using them publicly is your call, not mine**, and nothing is proposed. |
| G12 | Privacy and security | The site makes almost none, correctly | Any future privacy wording must be written against real behaviour (G8, E.5) |
| G13 | *"© 2026 PINTAR"* | Legal entity unconfirmed | **CONFIRM** (F6) |

**Nothing is invented on the site.** It has no testimonials, statistics, customers, adoption numbers or outcomes. The Mini-PINTAR and report numbers are labelled simulated.

---

## H · Proposed bounded patch (after your ruling; **not performed**)

All changes are inside `website/corporate/`. No product code, no infrastructure, no schema, no deployment.

| # | Files | Change |
|---|---|---|
| **P1** Identity placeholder | `shared/chrome.js`, `shared/content.js`, `PLACEHOLDERS.md` | Keep the square mark exactly as is and develop it no further. Add an accessible label and title: *"Tanda identitas sementara — belum diputuskan"*. Add a clause to the sample banner saying the mark and colour are provisional. Add an **IDENTITY PLACEHOLDER** row (STOP-6) to the inventory. |
| **P2** Tokens | `shared/style.css` | Rename `--accent` to `--brand-accent` and comment it as *PROVISIONAL, not canonical*. Add separate evidence tokens (F5), each validated with the palette checker; no brand value decided. |
| **P3** Zero-write | `shared/lang.js` | Remove every `localStorage` read and write. Language comes from `?lang=` (default `id`), and `withLang()` already propagates it. |
| **P4** Copy corrections | `content.js`, `apa-yang-dilakukan/content.js`, `untuk-pendidik/content.js`, `untuk-manajemen/content.js`, `cara-kerja/content.js`, `tentang/content.js` | Exactly the R and C rows in §C/§D: audience list, "langsung", the solo-publishing implication, Uji Cepat, timing words, "dan interaksi", the "mengawasi" absolute, "daftar nama", role words, essay 1 qualified, the canonical cycle named once, durations set to the ruled wording. Both languages each time, with no stylistic rewrites of K rows. |
| **P5** Reports | `laporan/content.js`, `laporan/app.js`, `shared/style.css` (`.report`) | Redraw both examples as faithful simplifications of MC-1. **Class:** Peserta; Pemahaman; Kenaikan; Sebaran kesiapan (4 canonical tiers, ordinal colours, labels verbatim from the product); Penguasaan per topik; Pemahaman keliru yang berulang with its remediation line. One figure is shown in **"Sudah ada, belum cukup"** state instead of a number. **School:** Peserta; Kenaikan; Butir wajib; Perbandingan angkatan; one figure **"Belum ada yang memenuhi syarat"**. The legend uses evidence states, not learner bands. No guessed causes. Everything stays badged *data simulasi*. |
| **P6** About | `tentang/content.js`, `tentang/app.js`, `PLACEHOLDERS.md` | Remove "Siapa yang membangunnya" and its photo (inventory 9 → 8, plus the identity row), unless G1 is evidenced |
| **P7** Home link | `app.js` | *Kenali PINTAR* → `/apa-yang-dilakukan/` |
| **P8** Verification | `verify/audit.mjs`, `verify/view.mjs`, `verify/negative.sh` | Replace my non-canonical "raw counts only, no %" rule with "report figures are MC-1 metric ids, tier labels verbatim, every figure carries one of the three evidence states". Add bans: *Dinas*, the team sentence, "dan interaksi", "lima menit" / "3–5 menit". Add a source check (no storage API anywhere) and a browser check (storage empty after walking every route), as M2 does. **Add one plant per new rule.** |
| **P9** Contact backend | `README.md` (spec only) | Before production: a named owner and response commitment; destination decided (no new service until ruled); fields minimised (phone optional); a consent and privacy notice written for UU No. 27/2022 (PDP); retention period; spam protection without a third-party tracker (honeypot plus server rate limit); an audit trail; no analytics; the confirmation copy rewritten to what really happens. **No infrastructure in this task.** |
| **P10** Records | `README.md` | Record the canonical baseline (§B), identity and colour as provisional (§F), and "not production" status with its gates: rulings F1–F6, the Mini-PINTAR convergence, sprint 1 released, and photography. |
| **Not in this patch** | `mini-pintar/*` | Waits for the §E ruling. Only P3 touches it indirectly, and that ends the storage breach immediately. |

**Estimated size:** about 12 files, copy and two components. The information architecture, the layouts and the visual direction do not change.

**Photography (§11):** the inventory is unchanged except G1/P6. The direction is unchanged: documentary, real Indonesian classrooms, calm, no AI imagery. Final photography follows the copy reconciliation.

---

## I · Verification evidence

All run **locally** on `6b24877` (the unchanged reviewed design), 24 Sep:

| Check | Result |
|---|---|
| `verify/audit.mjs` (content, both languages, banned vocabulary, links, quiz and report integrity) | **OK: 41,342 checks**, 275 string pairs, 10 modules, 9 routes |
| `verify/view.mjs` (real browser: every route in both languages, contrast, 14 px / 44 px floors, reflow 320–1440, inert form, Mini-PINTAR over three answer sets) | **OK: 122 checks** |
| `verify/negative.sh` (adversarial plants) | **12 / 12 caught**, tree restored clean |
| Storage scan of site source | 3 `localStorage` call sites, all in `shared/lang.js` (lines 12, 16, 23). M2: none. |
| Canonical claim tracing | 20 claims traced (§D), 13 trust claims (§G) |

**What the green suite does not prove, now that the canonical baseline is known.**
- Some of my own rules encode non-canonical assumptions. The "raw counts only" report rule is one; it passes a report model PINTAR does not have.
- The suite is green, and §D is still red. That is why P8 rewrites the rules against MC-1 rather than re-running them for reassurance.

### CI conservation (directive of 24 Sep)

- **Actions runs triggered by this task: none.** `ci.yml` runs only on push to `main`, pull requests and manual dispatch. Pushes to this design branch trigger nothing, and none of my earlier pushes on it triggered a run.
- **Runs avoided:**
  - No PR was opened, so no PR run.
  - No dispatch.
  - The website, role-view and Mini-PINTAR suites are all local (CDP against the Chromium already in the container).
  - The canonical suites were not run. Nothing canonical changed, and this task gives no reason to re-prove `main`.
- The review commit is documentation-only and marked `[skip ci]` as a precaution, though nothing on this branch would trigger a run anyway.

---

## Gate

This package is review and plan only. **No website patch was applied.** No merge, no deploy, no change to any canonical file.

**Rulings requested:**
1. Confirm `main@2ac7ab6` as the canonical baseline (§B.1).
2. The Mini-PINTAR recommendation (§E.4), including subject Option A or B.
3. F1–F6.
4. G1 (the team claim): evidence or removal.
5. Approval of patch P1–P10.
6. Separately, not for this task: the Umpan Balik conflict and the ADR-number collision (§B.4).
