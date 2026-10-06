# PINTAR-DESIGN-SKILL-SPEC

**The source specification for Daisy's eventual design skill.**

**Status: SPECIFICATION ONLY. Requested by Yazid, 30 Sep 2026.** This is not a skill. Nothing is installed, and no screen, code, copy, guard or workflow changes because of it.

- Daisy's current work continues as the board and D-062 set it.
- The skill will be built from this document later, when Yazid says so.

**What it is.** It consolidates PINTAR's existing design evidence: rulings, the 4.0 baseline, coordinator decisions, the built and test-guarded system, ticket acceptance criteria, and evidence documents.

- It creates no product decision.
- Where a topic has no ruling, it says so.
- Ideas still being explored are kept apart in §18, **OPEN DESIGN DOCTRINE — NOT YET CANONICAL**, so that today's discussion does not become a ruling by accident.

---

## Why this matters (Yazid, 30 Sep 2026)

> "We've spent a lot of time in the architecture — robust, stable, working as designed and intended. The UI/UX is the face. First impression counts. So Daisy has an extremely important role to play. All the effort, man-hours and sweat to develop the architecture will count for nothing if the UI/UX is not intuitive, natural, consistent. Daisy needs to understand this. Naturally, I'll be providing my feedback as we polish the UI/UX."

Every rigorous thing underneath PINTAR reaches a teacher, a student or a head of department only through a screen, and people judge PINTAR by that screen. The rules below exist to serve that one purpose: a PINTAR that feels intuitive, natural and consistent the first time someone opens it, and every time after.

---

## 0. How to read this: evidence tiers

Every rule carries a tag for the tier of evidence behind it.

| Tag | Tier | What it means for the skill |
|---|---|---|
| **R** | Yazid's ruling: a `DECISIONS.md` row marked *(Yazid)*, or a spec Yazid froze (e.g. `auth/IDENTITY-4.0.md`, "Status: CANONICAL. Frozen 29 Sep 2026 by Yazid") | Binding |
| **B** | The 4.0 baseline: `docs/rebuild/15-FABLE-5.1-START-HERE.md` (baseline amendment 12 Sep) and doc 16 | Binding |
| **D** | A coordinator decision in `DECISIONS.md` (the canonical file, not Yazid-marked; DEC:3, "Decided by the coordinator unless marked *(Yazid)*") | Binding unless Yazid overrides |
| **S** | The built system: the token file, shared components and the selftest guards that keep them | Binding as built. A change is a change to the product, not a styling choice |
| **T** | A board ticket's acceptance criteria, or a release-checklist criterion (D-028) | Binding for that ticket or check |
| **I** | Inherited 3.0 doctrine: `docs/product/PINTAR-VOICE-GUIDE.md` (v2.0), `PINTAR-3.0-PHILOSOPHY.md`, `PINTAR-DESIGN-LANGUAGE.md` (2.0) | "Preserve the lesson. Discard the implementation." (doc 15). Where 4.0 says otherwise, 4.0 wins. Its token values are superseded by token set v2 |
| **E** | Evidence documents: the terminology inventory, the UX polish register, the post-login review | Findings, not rules |

**Precedence (doc 15, "Authority hierarchy"):**

1. Dr. Gladys's educational vision.
2. The PINTAR Doctrine and Philosophy.
3. Validated product principles and approved decisions.
4. The 4.0 invariants.
5. Capabilities.
6. Implementation.

**Scope guards that already bind any design work:**

- **D-044(c) (R):** "No new product-design work opens unless a genuine blocker needs Yazid's ruling."
- **D-061 (R):** a correction's "scope is narrow: no redesign, no roadmap expansion, no unrelated UX work."
- **D-052(b)(c) (R):** UI/UX POLISHED is "the full pass: terminology inventory, navigation and hierarchy, interaction feedback, responsiveness, loading and saving states, wording, consistency, visual design, first impression". Nothing is "left as UX debt to meet a date".

---

## 1. Calm on the surface, rigorous underneath

- **B** (doc 15:11-27): "**CALM ON THE SURFACE. RIGOROUS UNDERNEATH.** PINTAR absorbs complexity rather than transferring it to its users… Simplicity in the interface is never achieved by weakening those foundations. This is an architectural principle, not a UI slogan."
- **B** (doc 15, the final test): "*does this make PINTAR calmer for the person using it while making the system more rigorous underneath?* If complexity leaks unnecessarily to the user, reconsider the surface. If simplicity weakens evidence, security, governance, historical integrity or educational validity, reconsider the foundation."
- **T** (release checklist header, CHK:13): "Calm on the surface. Rigorous underneath. One meaningful next action is obvious, while authorization, evidence and state transitions stay correct."
- **S** (`src/app/globals.css:4-8`): "Quiet, warm, intelligent. A screen may use only what is defined here: one type family, one primary, restrained pastel accents, calm semantic status. No decorative gradients, no alarms."
- **S** (`src/app/experience.css:1620-1629`): "CALM, AND THE CALM IS STRUCTURAL RATHER THAN DECORATIVE… A GROUND IS A STATE, NEVER A PERSON."
- **T** (U-TRUTH): "success means a real change happened." And CHK:45: "A screen that shows success after a zero-row or no-op change is a FAIL."
- **I** (VG:52-54): "respectful, calm, honest, clear, patient, helpful. Never arrogant, sarcastic, dismissive, manipulative, dramatic, or shaming."

**For the skill:** calm is honesty plus restraint. It is never calm bought by hiding a real state, softening a fact or skipping a check.

## 2. Natural flow and one obvious next action

- **B** (doc 15): users "should experience clarity, calmness and obvious next actions"; "One screen, one purpose."
- **D** D-010: everyone lands on their own home after signing in:
    - Murid → Belajar;
    - Guru → Mengajar;
    - Kepala departemen and Dekan → Pimpinan;
    - Admin sekolah and Admin platform → Konfigurasi.
- **D** D-008: "A student never reaches a 404." A lesson that cannot be assigned tells the teacher why, in Indonesian.
- **T** U-NAV: "every intended screen is reachable by clicking". DAISY-03: "Every role reaches every screen it is allowed to use by clicking, with no typed addresses."
- **T** (CHK:322, completion rule): each role must "find the next action, finish the consequential work, receive a truthful outcome… without SQL, typed addresses, developer help or knowledge of PINTAR's internals."
- **T** STU-03: "One obvious next action".
- **S** (`experience.css:547-551`): "THE ONE THING. The single most appropriate next action… the ONLY element on the home that stands on the primary ground… the moment a second thing claims that ground, the home is a dashboard again."
- **S** (`src/app/belajar/page.tsx:115-116`): "A session already open or paused is the one obvious next action."
- **I** (VG:554-556): "Every terminal screen carries a next step." VG:382-383: "Never a dead end, never a verdict without a path forward."
- **E** (post-login review, "Preserve these"): the role homes, the learner's «Langkah berikutnya», the teacher's «one thing first», /pimpinan, and honest zero states.

## 3. 60-second comprehension

**Status: not ruled.** It is the question of the Second Eye post-login review (**E**, `docs/reports/POST-LOGIN-60S-UX-REVIEW-2026-09-29.md:5`): "after login, can each role understand what needs them, decide, and act, within about 60 seconds?"

- D-061 adopted four of that review's findings. It did not adopt the standard itself.
- The repository names no other source for it, apart from "~60s read" for the educator briefing in the 3.0 handoff (**I**).

**For the skill, until Yazid rules otherwise:** use it as a review lens, not a gate. The review asks, per role (REV:83):

- the login destination;
- the first meaningful screen;
- "Attention surfaced?";
- "Primary action obvious?";
- clicks to a useful action.

Whether it becomes a canonical standard is listed in §18.

## 4. Progressive disclosure

No single ruling. The evidence is consistent:

- **B** (doc 15): PINTAR "absorbs complexity rather than transferring it". **I** (PH:64-66): "Complexity moves inward; simplicity faces the user."
- **What is not for the reader is absent, not locked.**
    - **S** (`src/app/mengajar/[kelas]/bukti/page.tsx`): "NOTHING FOR QUESTION HEALTH OR INTEGRITY — not a locked card, not a 'not for you' placeholder."
    - **S** (KartuKetiadaan): `not_permitted` "deliberately carries no label… so a refusal cannot disclose what it withheld."
- **Set it up, look at what will happen, then do it.**
    - **S** (TahapKomitmen): "a strip of words, not a progress bar… there is no proportion of a decision."
    - **T** EDU-07: "Atur → Tinjau → Tersedia with an explicit commit."
- **Looking never commits.**
    - **S** (the tour): "it only ever LOOKS. NOTHING HERE NAVIGATES AND NOTHING HERE COMMITS."
    - **T** (CHK:49): "looking… never consumes an attempt."
- **Disclosure by plain markup.** **S** (Pimpinan, DAISY-07): each class is a `<details>` the reader opens; "the summary line says whether it has any figure yet, and inside, every absent figure says what will make it appear."
- **Show only what is true.** **S** (`experience.css:663-666`): "TWO FACTS, NOT THREE… a plausible number a learner plans their afternoon around is worse than no number."
- **No machinery on screen.**
    - **T** DAISY-27: "No sentence names a code."
    - **E** register pattern (UX-12, UX-17, UX-20, UX-26, UX-29, UX-32).
    - **I** VG:393: "Taxonomy codes are never shown to a learner."

## 5. Mature UI conventions, not invented interaction patterns

**Status: practised and stated in the built system, but not ruled as a general principle** (see §18).

- **B** (doc 15): "Do not redesign PINTAR visually from scratch. Inherit and refine PINTAR 3.0's established visual language."
- **S** (`experience.css:2016-2018`): "THE CONFIRMATION IS A PANEL, NOT A DIALOG. PINTAR has no modal pattern outside the tour, and inventing one for a single act would be inventing a product convention on the way past."
- **S** (HalamanKomitmen): "NO MODAL… a dialogue that traps a reader on a decision is the opposite of calm."
- **S** (`src/app/pimpinan/page.tsx`, the scope list): "PLAIN LINKS RATHER THAN A SELECT. A picker whose choice is applied by a script is a control that looks operational before the script arrives; a link is a link in every browser, needs no hydration, and is already in the tab order."
- **S** conventions in use:
    - native forms submitted through one shared button (TombolKirim);
    - `<details>` for disclosure;
    - `<ol>` with `aria-current="step"` for steps;
    - `role="status"` for results and `role="alert"` for errors;
    - one refusal page, one error page, one loading shell.

## 6. Typography, hierarchy, spacing, and semantic colour and tokens

The source of truth is the token file, **S** `src/app/globals.css` (token set v2; **B** doc 16 §9: "enforced by a small, versioned token set").

- **Primary:** `--pintar-primary #245F55`, **R**: approved by Yazid on 16 Sep, "APPROVED AND IN USE — NOT FROZEN" (globals.css:12-15).
- **Typography:**
    - Plus Jakarta Sans, with IBM Plex Mono for code-like text; "Two weights only: 400 and 600".
    - A named size ladder: eyebrow 12 · fine 13 · meta 14 · body 16 · card 17 · course 20 · subhead 22 · section 24 · page 30; display sizes hero 36 · name 40 · name-print 44; chip 12.5.
    - Assessment stem 21, or 19 on a phone ("the most-read text in the product").
    - "Named rather than free, so 'large' is still a decision somebody made once."
    - Leading: tight 1.15 · body 1.5 · prose 1.65 · heading 1.25.
- **Spacing and measure:**
    - "8-pt on a 4-px scale": 4 · 8 · 12 · 16 · 24 · 32 · 40 · 48 · 64.
    - Gutter 16, or 24 at ≥640 px.
    - Reading column `--measure-read 760px`; narrow 560; stage 1120; prose 64ch.
- **Surfaces and lines:**
    - surface-0 is the canvas, surface-1 is for cards, sheets and lists, surface-2 is for quiet wells;
    - one hairline token;
    - "hairlines and grounds instead of elevation": there are no shadow tokens.
    - Radii are 8 / 12 / pill.
- **Semantic status:**
    - ok `#2F6E4A`, attention `#8A5F00`, blocked `#8C3B3B`, info `#3D5A80`, each with a soft ground.
    - **B:** "Colour communicates hierarchy or meaning, not decoration."
    - **R** (D-059(d)): "colour or a label grants nothing". **R** (IDN:156): "colour is supplementary only".
- **Status discipline, S** (comment rules in `experience.css`):
    - Management has "no `blocked` ground… the reddest thing a Management page has to say is that somebody has been asked to look at something" (1625-1629).
    - Readiness is "ALWAYS THE QUIET GROUND. A figure PINTAR may not yet interpret is not a warning" (1711-1713).
    - An expired link is "Attention, not blocked: nothing is broken and nobody did anything wrong" (1506-1508).
    - Feedback has "no coloured scale running from red to green" (1891-1900).
    - The evidence screen has "no red anywhere".
    - A readiness tier's bar is the same ink for every tier, so the distribution "reads as a shape rather than as an alarm" (BarisKesiapan).
    - "Nothing here is carried by colour alone."
- **Guards (S):**
    - UX1-S0-TOKEN-01: no raw hex, rgb, Tailwind scale class or inline pixel on re-set surfaces. Each exemption is listed with its reason.
    - UX1-S0-CONTRAST-01: any pair below 4.5:1 fails.
    - UX1-BRAND-01/02 and DAISY-08-PANEL-01 check the brand and panel values.
- **I** (DL 2.0) values are superseded: Inter, `#365147`, zero radius, "no red". Kept from it: its restraint ("Nothing spins, bounces, or flashes"; hairlines, not elevation).

**Known gaps in the built system (E, from reading the code; not rulings):**

- literal sizes outside the ladder (15 px in several places; 26, 27 and 32 px phone headings and values);
- a literal 6 px radius;
- `.pin-sehat-tanda.pin-perhatian` painted in blocked colours despite its "attention" name;
- Konfigurasi and Studio not yet re-set (Tailwind classes remain);
- some controls under 44 px (`.pin-btn` 40, question navigator 34, soal bar 32).

## 7. The restrained card family (D-059)

- **R** D-059 is "a product and design principle":
    - (b) "the card is rendered from stable identity… plus the person's **current** context";
    - (c) "Card families (SD, SMP, SMA/SMK, Universitas; Guru, Dosen, Kepala Sekolah, Dekan, Rektor; Tim PINTAR, leadership, Founder) are a **design taxonomy, not roles**. Calm, muted, one PINTAR family (the Founder card restrained, e.g. understated obsidian). The context is always stated in text";
    - (d) "**Card appearance is never authority**";
    - (e) "**Keepsake, not gamification:**… no badges, points, rewards or collecting mechanics in 4.0";
    - (g) "In 4.0 only staff cards are delivered (C17): student and PINTAR-team designs are explored in Gate 7 but not shipped."
- **T** DAISY-24: "one calm, muted PINTAR family… colour never implies authority… Designed as a keepsake, with no gamification"; its acceptance needs renders of every email, on desktop and on mobile.
- **B** (doc 15) warns against "excessive card colours". For UI cards in general, **S**: cards stand on surface-1, and "a ground is a state, never a person".

## 8. Terminology and microcopy

**Where the words live:**

- **D** D-014: "All user-visible words live in `src/lib/hle.ts`. Daisy owns the wording… the key names are the contract."
- **S** (hle.ts): every string passes through `t(event, persona, {locale})`.
    - Every key must have both Bahasa Indonesia and English, or it does not compile.
    - A missing key renders «—», "calm, and never the key itself".

**Fixed terms:**

- **D** D-015: "Uji Cepat" everywhere.
- **D** D-006: screens show only Bagian, Tingkat and Kelas.
- **D** D-008: the workbook marks *Pemetaan awal* and *Cek penguasaan*.
- **D** D-010 names the homes.
- **D** D-020: a learner is greeted by first name only.
- **B** (doc 15): "'PINTAR 4.0' must never appear" in user-facing surfaces.

**Honest copy:**

- **D** D-019: "The copy must not promise an email that never goes."
- **R** D-054(a): unknown addresses get "neutral behaviour and copy".
- **R** D-056(e): "lock messages never reveal which IDs exist".
- **R** D-057(d): a resend countdown only on verification and recovery code screens; "no countdown elsewhere".

**Guards (S):**

- `INTERNAL_WORDS` (e.g. FROZEN, IN_REVIEW, OFFICIAL, Menunggu, Salah, Failed, Penalty) may not reach a non-staff surface.
- UX1-S0-SAPAAN-01: «Anda», never «kamu», including the clitic «-mu». This 4.0 guard supersedes the voice guide's «kamu» for children (**I** VG:176-184).
- UX1-AJAR-KATA-01: teacher copy "judges nobody", with no ranking or comparison.
- UX1-UB-KATA-01: feedback copy makes no absolute anonymity claim.
- F05-S03 and F06-S03: no staff-only key on a learner surface, and no enum value in visible text.
- The Q-15 forbidden words ("dipantau", "diawasi", "kamera" and others).
- UX1-MASUK-KONTRAK-01: no countdown on sign-in.

**Rules from tickets (T):**

- DAISY-27: "One sentence per code… each say what to change… No sentence names a code."
- DAISY-31: "one sentence… saying what happened and what to do instead".
- DAISY-26: "learner copy never speaks of pass or fail" (UX-27).

**PINTAR Terminology v1 (R, D-068, frozen 30 Sep 2026).** The full record: `ux/TERMINOLOGY-V1-FREEZE-PACKAGE.md`. It holds the approved change set, the exceptions kept on purpose, and the UI/UX items that are not terminology (UX-41 to UX-47). The strings change during UI/UX POLISHED; until then the screens still show today's words. The inventory stays evidence only.

### Terminology v1: the governing principle

> **Consistency means one meaning has a stable name. It does not mean one word must be used mechanically in every context.**
>
> Preserve natural Bahasa Indonesia. Full canonical terms establish identity and resolve ambiguity. Natural short forms may be used once the context is clear.

**The rule Daisy is given:** these are PINTAR's words. Use them consistently. If they don't work on a real screen, raise the problem; don't quietly invent another word.

### Terminology v1: the dictionary

| Concept | Canonical term | Also right (short form or context) | Replace (when it means this concept) | Keep distinct from |
|---|---|---|---|---|
| School | **Sekolah** | «untuk sekolah secara keseluruhan» where the whole school is meant | institusi (ordinary UI) | the structure unit Tingkat |
| Learner | **Murid** | | siswa, peserta didik | **Peserta** (participants in a measurement) |
| Teacher | **Guru** | | pengajar, pendidik, edukator | |
| Leadership (umbrella) | **Pimpinan** | | | |
| Roles | **Murid · Guru · Kepala departemen · Dekan · Admin sekolah · Admin platform** (where the formal role matters to understanding or authorization) | in a help or recovery context, «yang mengurus PINTAR di sekolah Anda»; a human description where the person has no role yet, e.g. «pengelola pertama sebuah sekolah» | kepala program, pengelola sistem, administrator sekolah, pengelola data sekolah, staf pengelola isi | |
| Person / account | **Orang** / **Akun** | address the person («Anda») where the data-model distinction does not help | | each other |
| Structure | **Bagian · Tingkat · Kelas** (capitalised, structural) | ordinary lowercase «bagian» ("part": bagian dari, bagian akhir) | | |
| A leader's scope, shared copy | **lingkup** («lingkup yang Anda pimpin», «lingkup ini») | «Bagian» where only a Kepala departemen's Bagian is meant | «bagian sekolah» as a scope shared with Dekan | |
| Studio object | **Paket Pembelajaran** | **paket** once the context is clear; the package's title | kursus (Studio object) | materi |
| Contents of a package | **isi** (Susun isi · Periksa isi · Setujui isi) | | | |
| Learning material | **Materi** (incl. «menyusun materi», «Materi Uji Cepat») | | bahan | Paket Pembelajaran |
| Workbook / import format | **Kursus** (the sheet, the import structure, «Buka kursus» right after import) · **Paket Terstruktur** (JSON) | | | Paket Pembelajaran |
| Curriculum | **kurikulum** (sekolah, akademik) | | | |
| Chapter · lesson · reading | **Bab · Pelajaran · Bacaan** (Peta Bacaan, posisi bacaan, bagian bacaan) | | | |
| Assessment item | **Soal** | | butir (rewrite the sentence where a swap reads badly) | **Pertanyaan**: the wording inside a soal, or a question asked of people (feedback) |
| Assessment (generic) | **asesmen** (Aturan Asesmen, asesmen resmi) | | penilaian, **only** where it means the assessment object | penilaian = evaluation or judgement («bukan penilaian») |
| PRE_TEST · POST_TEST · QUICK · STANDALONE · PAPER (shown) | **Pemetaan Awal · Uji Penguasaan · Uji Cepat · Asesmen Mandiri · Tes di Kertas** | **pemetaan** once the context is clear | Penilaian awal/akhir/cepat/mandiri, Lembar kertas | the workbook marks below |
| Workbook marks (authoring contract) | **Pemetaan awal · Cek penguasaan** (D-008) | | | the names learners see |
| Other modes | **Tes · Ujian · Latihan · Peragaan publik** | | | |
| Publish · release · approve | **Terbitkan · Terbitan · Setujui / Persetujuan** | | | |
| Save · loading | **Simpan / Tersimpan · Memuat…** (page, data) **· Sedang…** (an operation) | | | selesai |
| Check · review | **Periksa** (checking) · **Tinjau** (human review) | | | |
| Evidence family | **Bukti · Hasil · Laporan · Ringkasan · Angka** (distinct concepts) | | | each other |
| Readiness | **Kesiapan · Siap · Belum siap** | | | |
| Feedback | **Umpan balik · Putaran umpan balik** | **Putaran** once the context is clear | | |
| Sign in / out | **Masuk · Keluar** | **Keluar dari peragaan** where it does not sign out | | |
| Email | **Email** | | surel | |
| Admin workspaces | **Konfigurasi · Pendataan** | | | **Pengaturan** (real settings only) |
| Homes and places | **Belajar · Mengajar · Pimpinan · Konfigurasi · Pendataan · Sertifikat · Halaman awal · Studio**; «Perjalanan belajar» where the learning cycle needs a destination name | the doors on `/` stay first-person sentences («Saya mau belajar» …) | «Kelas» as the teacher's home tab; Studio's «Beranda» | |

### Terminology v1: semantic and context rules

1. **One meaning, one stable name.** Not one word everywhere. A word that also has an ordinary meaning keeps it; «bagian dari», «bagian akhir» and «paket ini» stay.
2. **Full term, then short form.** Use the full canonical term to introduce a concept, in headings, at a boundary, or where it would be ambiguous. Use the natural short form after that.
3. **Name the role only when the reader needs it.**
    - **Formal permission context:** *Admin sekolah* (the canonical role name), where the role matters to the reader's understanding or authorization.
    - **Help and recovery context:** «yang mengurus PINTAR di sekolah Anda».
    - **A person with no role yet:** a human description.
4. **Refusals explain the problem and the next action; they do not recite RBAC.** For example: «Anda tidak memiliki akses ke Studio.»
5. **Don't expose the data model.** Where orang vs akun doesn't matter to the reader, speak to the person.
6. **The authoring contract may differ from what learners see.** The workbook marks stay «Pemetaan awal» / «Cek penguasaan»; learners meet «Pemetaan Awal» / «Uji Penguasaan».
7. **Don't force one noun across two authorities.** Copy shared by Kepala departemen and Dekan says «lingkup», not «bagian sekolah».
8. **Substitute only when the meaning survives.** Otherwise rewrite the sentence (e.g. «butir» → «soal»).
9. **Technical and diagnostic language stays precise** (the schema-health lines).
10. **Data is not terminology.** Seed and display names are left alone. An evaluation persona takes the canonical role name where it represents a role.
11. **Capitalisation:** the structural Bagian · Tingkat · Kelas, the assessment names, Paket Pembelajaran, and the role names as written in §1.
12. **Navigation grammar:**
    - A destination is a short noun or name.
    - A heading may be a human question or purpose.
    - An action is a verb plus its object.
    - «Kembali» names its destination only where that is ambiguous.
    - A doorway on `/` may be a first-person sentence.
    - A creation destination may keep an action name («Buat Paket»).
    - The same label in two places is fine when it is the same concept (Sertifikat, Uji Cepat) or an action (Lihat seperti murid).
13. **Not every language problem is terminology.** Rendering, persona, information-architecture and technical-display issues go to the UX polish register (the package's §5; §16 here), not into this dictionary.

**Inherited voice (I, not re-ratified for 4.0).** The 4.0 guards above already enforce some of these. The rest carry weight but are not rulings:

- «belum» where the state can still change; «gagal» never to a learner;
- "one next step";
- errors as "what happened → why → what to do → what was not lost";
- "Never a bare ratio… Always '2 dari 3 tepat'". The built system says the same: "A NUMBER NEVER STANDS ALONE", `experience.css:820`;
- never a bare «harus» / «wajib» / «segera»;
- "Praise must be earned".

## 9. States

**Empty.**

- **T** U-EMPTY: "'not yet' is never shown as failure, and absence is never shown as a finding" (P1, PARTIAL).
- **S** (`experience.css:602-606`): "The section is ABSENT entirely when nothing needs attention — honest absence, never an empty container explaining that it is empty."
- **I** VG:445: "Empty is a beginning, not an absence."

**Insufficient evidence.**

- **S** (`bukti/page.tsx:16-22`): "THE INSUFFICIENT STATE IS THE DESIGNED STATE. Not a fallback and not an empty page… no zero standing in for an unknown and no red anywhere."
- **S** KartuKetiadaan:
    - "'we looked and there is not enough yet' and 'this is not for you' are DIFFERENT SENTENCES";
    - the variant is "DERIVED from the envelope's status, never passed in, so a surface cannot choose a gentler sentence";
    - it shows how much evidence exists and how much is needed.
- **S** AngkaBerdiri: "a number is never rendered without the sentence that says what it MEANS, the sample it rests on, and what to DO about it."
- **T** DAISY-07: cards "that say *why* there is no figure yet and what will make it appear".
- **S** (the miniature): "a dashed rule, never a zero and never a warning colour."

**Loading.**

- **R** D-047(a): "No loading indicator hides work that should not happen."
- **S** MemuatHalaman: "THE ONE LOADING SHELL… the brand, 'Memuat halaman…' and the shape of a page". Seven sections use it as `loading.tsx` (DAISY-18).
- **S** (a data surface): "there is no indeterminate spinner… 'something is happening' is exactly the claim this surface must not make on its own."

**Success.**

- **T** U-TRUTH and CHK:45 (above).
- **R** D-047(e): the result is "shown at the action, `role="status"`, with specific wording".
- **S** BarisHasil / HasilDi: the result line "sits next to the form that was sent… brings itself into view."
- **S** (DAISY-18): "the key actions say what was done, not only 'saved'".

**Warning.**

- **S** the attention status is used for "nothing is broken and nobody did anything wrong", never for a person (§6).
- A figure PINTAR may not yet interpret "is not a warning".

**Error and refusal.**

- **D** D-011: "Errors are never shown raw… An unknown error shows a calm generic message plus a short reference. Error and not-found pages are PINTAR's own, in the reader's language."
- **S** HalamanGalat: "a calm sentence that blames nobody, a way to try again and a way back… NEVER THE MESSAGE; ONLY A REFERENCE."
- **S** HalamanPenolakan: "ONE refusal page, for unauthorized, nonexistent and expired alike… A refusal that differs by cause is an existence oracle."
- **T** U-ERR and U-PRIV.
- **R** D-062(d): an unauthorized referral "must fail explicitly… the screen shows ACTION_NOT_ALLOWED".
- **T** CHK:46: "A refusal or empty state passes only when it is honest, understandable in the reader's language, and leaks nothing protected."

## 10. Acknowledging a person's action (D-047) and interaction states

- **R** D-047: "PINTAR never leaves the user wondering whether an action was received (a 4.0 UX principle, carried into 4.5 and 5.0)."
    - (a) "**One interaction pattern:** Idle → Working → Success / Error, as shared components, not per-screen patches."
    - (b) Design objectives, not release gates: "acknowledgement under 100 ms; common navigation about 0.5–1 s; saves under 1 s; heavy screens show useful content within 1–2 s; anything over 3 s is exceptional and explained."
    - (c) A standing gate question: "What happens when the user clicks?"
    - (e) Results are shown at the action.
- **R** D-046(e): "a click that saves is acknowledged at once (a visible 'saving' state), cannot be submitted twice while it is processing".
- **S** how it is built:
    - **TombolKirim**: "A CLICK THAT SAVES SAYS SO AT ONCE AND SAVES ONCE." It is busy and disabled while pending, shows the step's own word («Menyimpan…»), and a capture-phase guard stops a second submit.
    - **TandaTautan**: a working mark on a navigation link that "takes no room at rest".
    - **MemuatHalaman**, the shared loading shell.
    - **BarisHasil**, the result at the action.
- **S** guards:
    - DAISY-17-KIRIM-01/02: every form uses TombolKirim with its pending word; every `tombol.*` string ends in "…".
    - DAISY-18-DENGAR-01: every section has the shared loading shell; every navigation link carries the mark; the result is `role="status"`, never `alert`.

**For the skill:** intent → processing → resolution is **canonical as D-047's Idle → Working → Success / Error**. The paired verbs that would name each stage (Simpan → Menyimpan… → Tersimpan) are Yazid's proposal, recorded in §18 and the terminology proposal §6.

## 11. Motion

**No ruling states what motion is for** (see §18). The evidence:

- **B** (doc 15): avoid "excessive animation, confetti, visually punitive error states, unnecessary alarms or popups."
- **S** (`globals.css:210-211`): "motion: colour and opacity only, 160ms" (`--motion-fast`).
- **S** purpose in the built system:
    - "Nothing here animates meaning."
    - "THE WIDTH IS A COMMITTED COUNT. There is no keyframe moving it" (a data progress bar).
    - A reading position is shown as "dots rather than a bar, because a page of a lesson is a place and not a percentage".
    - "Seven positions, not a bar that fills: finishing a tour is not an achievement."
- **S** the only moving things:
    - a sign-in spinner;
    - a data stripe saying "a request is in flight";
    - the loading shell's pulse and the link mark's pulse, both opted in only under `prefers-reduced-motion: no-preference`.
- **S** known departure (E): one width transition (the data progress bar) is outside "colour and opacity only".
- **I** (DL 2.0): "Nothing spins, bounces, or flashes."

## 12. Responsive behaviour

- **T** U-DEVICE (P0): "Phone, touch and shared device: usable at 320px; Keluar everywhere; idle timeout for class cards." PARTIAL: "320 px walked on /masuk, the upload panel, activation and the step list only."
- **T** tickets: DAISY-26 "readable at 320 px"; DAISY-30 "A table scrolls inside its frame at 320px"; DAISY-19 "Chromium renders at 600 px, 320 px"; DAISY-02, «Keluar» "visible without scrolling on a phone".
- **S** the built system:
    - One viewport breakpoint, `max-width: 560px`, "the phone breakpoint, which is a device fact".
    - The gutter widens at 640 px. Sign-in uses container queries.
    - Management is "one column at every width".
    - A table "scrolls inside its frame, never the page… a 320px screen must still hold the page still".
    - A long word breaks "rather than pushing the count off a 320px screen".
    - On a phone the tour card becomes a bottom sheet.
- **S** tests: DAISY-01-MASUK-01 runs ten widths from 320 to 2560. Other tests use 320, 375, 390, 414 and 768.
- **Touch (S):** `min-height: 44px` is "a platform requirement". Sign-in controls are 52 and 60 px, "the difference between a form a child can hit and one they cannot".
- **Tablet:** no tablet ruling. The audit harness walks a student at 820×1180 and staff at 1280×900.

## 13. Accessibility and reduced motion

**No WCAG level is ruled** (see §18). What is ruled or built:

- **T** "AA contrast" (DAISY-19). **S** UX1-S0-CONTRAST-01 fails any pair below 4.5:1. White on primary is about 7.4:1 (DAISY-08).
- **S** focus:
    - a global `:focus-visible` outline in the primary colour;
    - programmatic-focus headings hide the ring only for non-keyboard focus;
    - custom controls draw focus on the whole control.
- **S** announcements: `role="status"` for results and loading; `role="alert"` for errors and sign-in failures; `aria-live="polite"` where content updates; `aria-busy` on pending controls.
- **S** `<html lang>` follows the reader's language. `.pin-sr` text is "Announced, not drawn".
- **S** the tour is a real dialog: `aria-modal`, Esc closes it, focus is trapped, the rest is `aria-hidden`.
- **R** D-047's Why column: "none was announced to screen readers". Announcing results is part of the principle.
- **S** reduced motion:
    - a global switch, `@media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }`;
    - per-component static fallbacks (the spinner becomes a ring; the stripe stops while "the bar itself keeps its width, because that width is information");
    - the tour scrolls without smoothing.
- **S** no dark mode (`color-scheme: light`).
- **Gaps (E):** no skip link; the sub-44 px controls listed in §6.

## 14. No gamification or decorative celebration unless explicitly ruled

- **R** D-059(e): "Keepsake, not gamification:… no badges, points, rewards or collecting mechanics in 4.0."
- **B** (doc 15): avoid "confetti" and "excessive animation".
- **T** STU-15: the result shows "no rank, class average or other learner". **S** UX1-AJAR-KATA-01: no ranking, performance score or comparison. **S** (`src/lib/pengajar.ts`): "Alphabetical, and that is the only order. There is no ranking to offer."
- **S** "finishing a tour is not an achievement"; "a bar would invite somebody to fill it".
- **T** DAISY-26: "learner copy never speaks of pass or fail".
- **I** VG:72-74: "Praise must be earned. No 'Great job!'… untethered to evidence." VG:79-80: "Never compare learners."

**For the skill:** anything that celebrates, rewards, ranks or collects needs an explicit Yazid ruling first.

## 15. Screenshot review before hand-off

**A workflow requirement of the skill, from Yazid's brief for this spec (30 Sep).** It does not change Daisy's present workflow.

**The requirement, when the skill exists:** every changed screen is rendered and looked at, at phone, tablet and desktop widths, in both interface languages, before it is called ready. The screenshots go with the hand-off.

**Existing tools and practice (S / T):**

- `claude/tools/render-screens`: "renders the built Experience components to static HTML with the real compiled stylesheet and the real copy table, then screenshots each one at 1280 and 390 CSS pixels in both interface languages."
    - It renders components, not routes, because the local stack cannot start in the container.
    - Its README counts are stale (the code makes 36 pages and 72 images).
- The audit harness: 1280×900 staff and 820×1180 student tablet, `id-ID`, Asia/Jakarta.
- DAISY-01's acceptance: screenshots "at phone and desktop width". The run record (CHK:312) names the devices "phone and desktop".

**Gaps to close when the skill is built, not now:** the renderer has no tablet viewport (820) and no 320 px viewport.

## 16. Inputs the skill must read first

1. **The UX polish register** (`ux/UX-POLISH-REGISTER.md`):
    - "for the UI/UX POLISHED gate, D-052";
    - "Short, evidence-based and **non-blocking**… A problem that stops a person is a **defect** and goes to the board";
    - classes W (wording) and U (interaction/UX), each row with its evidence;
    - its open rows, UX-01 to UX-40 as they stand.

    **E** its rows show recurring patterns. The grouping is the coordinator's synthesis, not a ruling:
    - one name per thing;
    - truthful copy;
    - no machinery on screen;
    - buttons named for their destination;
    - no alarm for a non-problem;
    - fewer presses;
    - surface waiting work;
    - say the result of every action;
    - don't block the landing;
    - no empty placeholders;
    - language parity;
    - context before a decision.
2. **PINTAR Terminology v1** (D-068, §8), and the terminology inventory as evidence only.
3. **The decisions and board rows** tagged in this document.
4. **The release checklist's universal checks:** U-NAV, U-AUTH, U-TRUTH, U-LOC, U-EMPTY, U-DEVICE, U-CONTEXT, U-AUDIT, U-PRIV, U-RECOVER, U-ERR and U-PERF.
5. **Yazid's feedback during the polish** ("I'll be providing my feedback as we polish the UI/UX", 30 Sep). It is recorded so that nothing is lost and nothing is quietly generalised:
    - a ruling goes into `DECISIONS.md`;
    - an observation about a screen becomes a register row with "Yazid" as its evidence, his words and the screen it concerns;
    - where one comment could apply more widely, Daisy asks rather than assumes.

## 17. The self-review checklist (before a screen is declared ready)

Each item points to its evidence. The skill reports each as yes, no or not applicable, with its evidence.

1. **Calm and honest (§1):** nothing decorative; no state hidden or softened; success shown only after a real change (U-TRUTH).
2. **One obvious next action (§2):** at most one element on the primary ground; reachable by clicking, with no typed address (U-NAV); no dead end.
3. **60-second read (§3, review lens):** attention surfaced; the primary action obvious; clicks to useful work counted.
4. **Disclosure (§4):** what is not for the reader is absent, not locked; looking commits nothing; no codes, enum values, UUIDs or internal words on screen.
5. **Conventions (§5):** no new interaction pattern; no modal outside the tour; the shared components used (TombolKirim, TandaTautan, MemuatHalaman, BarisHasil, HalamanPenolakan, HalamanGalat, KartuKetiadaan, AngkaBerdiri).
6. **Tokens (§6):** tokens only (UX1-S0-TOKEN-01 green); contrast at least 4.5:1 (UX1-S0-CONTRAST-01 green); status colour never on a person; nothing carried by colour alone.
7. **Cards (§7):** any PINTAR ID card within D-059: calm, one family, context in text, colour grants nothing.
8. **Words (§8):**
    - every string in `hle.ts`, in both languages, and actually shown in the reader's language;
    - Terminology v1 terms and rules used (§8); no internal words; «Anda»;
    - no promise the system does not keep;
    - a term that does not fit is raised, not invented.
9. **States (§9):** empty, insufficient evidence, loading, success, warning and error each designed for this screen and checked against §9.
10. **D-047 (§10):** "What happens when the user clicks?" is answered: acknowledged within 100 ms, a pending word ending in "…", one submit, the result at the action with specific wording, `role="status"`.
11. **Motion (§11):** colour and opacity only, 160 ms; nothing that animates meaning; nothing decorative.
12. **Responsive (§12):** usable at 320 px; no page-level horizontal scroll; targets of at least 44 px (or the exemption named).
13. **Accessibility (§13):** keyboard reachable; visible focus; results announced; `lang` correct; reduced motion leaves no information lost.
14. **No gamification (§14):** no badge, points, streak, rank, comparison or celebration.
15. **Screenshots (§15):** phone, tablet and desktop, in both languages, looked at and attached.
16. **Register (§16):** related open UX rows read; anything new found is written as a register row or, if it stops a person, raised as a defect.

## 18. OPEN DESIGN DOCTRINE — NOT YET CANONICAL

**These ideas are under exploration. None is a ruling, and none may be applied as one.** Each becomes canonical only through a Yazid decision recorded in `DECISIONS.md`. Until then the skill may keep them in mind as questions, and must not use them to justify a change.

1. **"PINTAR should visibly acknowledge human intention."** (Yazid, 30 Sep.)

    Its canonical neighbour is D-047 ("never leaves the user wondering whether an action was received"). This broader statement is not ruled: that acknowledgement is a character trait of PINTAR, beyond the operational pattern.
2. **Motion communicates reception, progress, completion and continuity, and never exists for decoration.** (Under discussion, 30 Sep.)

    Today's evidence (§11) is consistent with it: colour and opacity only; nothing animates meaning; widths are committed counts. But no ruling states what motion is for, or whether continuity motion (for example between a list and its detail) belongs in 4.0.
3. **One interaction language joining words and states** (Yazid's terminology proposal §6):
    - Simpan → Menyimpan… → Tersimpan
    - Kirim → Mengirim… → Terkirim
    - Periksa → Memeriksa… → the result
    - Terbitkan → Menerbitkan… → Diterbitkan

    D-047's pattern is canonical. These word triples are not.
4. **RULED 30 Sep (D-068), now §8.** Kept for the record: **Terminology v1 and its navigation grammar:**
    - navigation is a short noun;
    - a heading may be a human question or purpose;
    - an action is a verb plus its object;
    - «Kembali» names its destination only when that is ambiguous.

    Frozen as D-068 on 30 Sep, after the change-impact review.
5. **RULED 30 Sep (D-068), now §8's governing principle.** Kept for the record: **Preserve PINTAR's plain Bahasa.** "Murid. Guru. Sekolah. Soal. Materi." (Yazid's judgement in the proposal.)
6. **60-second comprehension as a formal standard** (§3). Today it is a review lens.
7. **"Mature conventions, not invented patterns" as a general principle** (§5). Today it is stated in code comments and practised, but not ruled.
8. **Tablet as a required review width** (§15). Today only phone and desktop appear in ticket criteria.
9. **A named accessibility standard** (for example WCAG 2.x AA as a whole, not only contrast) and a skip link (§13).
10. **Confirmation before irreversible release steps.** The post-login review observed that «Kunci terbitan» and «Terbitkan» have none (REV §5). The observation was not adopted by D-061 or the register.
11. **Inherited 3.0 voice rules not yet re-ratified for 4.0** (§8, "Inherited voice").

---

## Sources

- **Rulings and decisions:** `docs/coordination/DECISIONS.md` — D-006, D-008, D-010, D-011, D-014, D-015, D-019, D-020, D-044, D-046, D-047, D-052, D-054, D-056, D-057, D-059, D-061, D-062.
- **Baseline:** `docs/rebuild/15-FABLE-5.1-START-HERE.md` and `docs/rebuild/16-PINTAR-ENGINEERING-AND-VERIFICATION-SYSTEM.md` §9.
- **Identity:** `docs/coordination/auth/IDENTITY-4.0.md` (canonical, frozen 29 Sep).
- **Built system:**
    - `src/app/globals.css`, `src/app/experience.css`, `src/lib/hle.ts`;
    - components in `src/components` (TombolKirim, TandaTautan, MemuatHalaman, BarisHasil, HasilDi, HalamanPenolakan, HalamanGalat, KartuKetiadaan, AngkaBerdiri, BarisKesiapan, BarisLingkup, TahapKomitmen, HalamanKomitmen, CangkangPengalaman, the tour);
    - guards in `selftest/experience.test.ts`, `selftest/static.test.ts` and `selftest/app.test.ts`.
- **Tickets and checks:** `docs/coordination/BOARD.md` (DAISY-01 to DAISY-31) and `docs/coordination/RELEASE-CHECKLIST.md` (v2.2).
- **Evidence:** `docs/coordination/ux/UX-POLISH-REGISTER.md`, `docs/coordination/ux/PINTAR-4.0-TERMINOLOGY-INVENTORY.md`, `docs/reports/POST-LOGIN-60S-UX-REVIEW-2026-09-29.md`.
- **Inherited:** `docs/product/PINTAR-VOICE-GUIDE.md`, `PINTAR-3.0-PHILOSOPHY.md`, `PINTAR-DESIGN-LANGUAGE.md`.
- **Tools:** `claude/tools/render-screens`, and `audit/` for the viewports.
