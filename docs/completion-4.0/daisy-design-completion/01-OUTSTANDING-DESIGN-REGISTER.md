# PINTAR 4.0 · The outstanding Daisy design register (4 Nov 2026)

**Authority:** owner, 4 Nov: «PREPARE THE AUTHORITATIVE DAISY DESIGN-COMPLETION BRIEF» and its two clarifications (branding: D-161; scope: research and writing only).

**What it is:** every approved design requirement across Batches 0–6, plus Batch 7's design dependencies, that is **not fully accepted**.

**How it was built:**
- Read-only sweep of the work register (C), the feature and acceptance matrices (B, G), the owner-decisions list (F), the plan (E), the decision log (DEC), the Board (BRD), the UX register (UXR), the application-pass log, the closure register, the Batch 0–6 reports, and Daisy's frozen design system.
- Her system is on branch `origin/ux-1/daisy-experience`: «APPLICATION READY», `c42fecb` / `cc96030`, 8 Oct. Abbreviated **DS** below.
- HEAD at the sweep was `697453d`, plus D-161 (`78cffe3`); revised after the owner's consistency review of 4 Nov.
- Original requirement IDs are kept, and nothing was invented.

**Classes:**

| Class | Meaning |
|---|---|
| **COMP** | missing composition |
| **TERM** | terminology / copy decision |
| **VIS** | visual defect |
| **INT** | interaction gap |
| **POL** | unresolved product policy |
| **PUB** | publication task |

**Who decides:**

| Code | Who |
|---|---|
| **D** | Daisy |
| **O** | owner |
| **G** | Dr Gladys |
| **E** | engineering (a dependency only) |

**Standing rules that bind every row:**
- **The owner's adjustments of 4 Nov:**
  - D-161(e) reconciles the brand: «Pintar» in `#075056`; the interface palette is unchanged.
  - D-162: the sage accent is engineering's, not Daisy's.
  - The email frame is identified first and reused if complete.
  - A provisional wordmark placeholder stands in until F-11.
  - D-074(10) stays explicitly unresolved.
  - Product policy and Dr Gladys's words are outside Daisy's authority.
  - The closed items are not reopened.
- **D-135:** Daisy decides design execution within the approved system; the owner is not asked for design-language rulings; missing protected words go to Dr Gladys's register.
- **D-161 (branding; the owner's words quoted verbatim in the log):**
  - **The wordmark direction is settled:** «Pintar» in `#075056` (preferred Helvetica Neue Bold, subject to the master). The uppercase «PINTAR» / `#245F55` wordmark specification is superseded.
  - **Still open:** the licensed master (F-11), the running-text naming («PINTAR SELALU» vs «PINTAR», O1) and the tab icon (O1, O9).
  - **Existing assets stay until an approved replacement exists** (D-160(a)); the interface palette is unchanged.
- **Gates are per item**, not per package: each item's start, design-acceptance, implementation and final-closure gates are in the brief, §5.

---

## Package A · Studio and assessment

### A1 · W1.2: the question-review composition (DG-25, RV-21 layout, CR-88 «Question review», F-12(1), J4.4)
- **Approved rule:**
  - D-088(h): before «Setujui isi» the reviewer reads every question, its key and every option's reason (`batch-3/03-DAISY-W1.2-COMMISSION.md:7`).
  - CR-88 requires the question review (closure register :265).
  - G §2: Studio needs «Daisy's question review (F-12)» (G:37).
- **Implemented:** `src/app/studio/paket/[course]/page.tsx:273-307`.
  - One Disclosure per lesson; the first is open.
  - The use on an eyebrow line; the key marked «· Kunci»; every option's «Alasan» shown.
  - The Disclosure chevron is Daisy's (the RV-21 ▶ marker is fixed, `batch-2/01`).
- **Missing:** the layout itself. «None exists … not accepted» (`batch-3/04:143`).
- **Class:** COMP · **Decides:** D · no owner or Dr Gladys decision recorded.
- **Daisy's deliverable:** a composition answering the commission's six decisions (`03-DAISY-W1.2-COMMISSION.md:38-45`):
  1. reading order and navigation («Soal 7 dari 18»);
  2. the key marked without colour alone (WCAG 1.4.1);
  3. where the reasons and misconceptions sit;
  4. what replaces or keeps the disclosure, and its defaults;
  5. use and difficulty;
  6. the 320 px layout with five long options.

  It must scale to 2,000 questions in 500 lessons. Per-question approvals stay out of scope (D-142).
- **Affects:**
  - `/studio/paket/[course]` §«Soal dalam paket ini»;
  - Kepala departemen, Admin sekolah, Guru (CAN_DRAFT);
  - J4.4; W6.5 S-4.
- **Specification and evidence:** no spec. The nearest grammar is the Bank Soal single question (DS/11-validation.md:181). Evidence: `batch-3/evidence/w65/09-buat-dan-kunci.png`, `batch-3/evidence/sisi/j1-terbitkan.png`.
- **Acceptance:**
  - a guard rendered against her composition;
  - the S17 and W6.5 walks keep or move `#soal li.pin-soal`, `.pin-opsi-kunci` and `.pin-opsi` (`03-…:53`);
  - Daisy's side-by-side review (G:14).

### A2 · D1: what the Uji Cepat class figure means (W2.4, CR-27, J5.6)
- **Approved rule:**
  - D-120 Q8: «the class outcome is primary, the learners' scores a drill-down» (DEC:128).
  - DS: «the class figure in `t-stat` with its base («18 dari 31»); the learners in a Table one step below it» (DS/11-validation.md:194).
- **Implemented:** the mean of the official scores, with «n dari N murid sudah dinilai» (`src/lib/hasil-ujicepat.ts:71-76`; `…/uji-cepat/hasil/page.tsx:91-103`).
- **Missing:** Daisy's confirmation of how the existing mean is **presented and worded** (`batch-3/02-DAISY-QUESTIONS.md:54`). What the figure measures is not hers to decide: it is the mean of official scores unless the owner rules otherwise (O4).
- **Class:** POL (the meaning of a figure) · **Decides:** D for presentation. If the figure's *meaning* changes, O: **metric definitions are not Daisy's** (owner rule, this brief).
- **Deliverable (form K):** a confirmation, or a correction, of the existing mean's label, its base wording («n dari N murid sudah dinilai») and its place. It can be given now.
- **Affects:** `/mengajar/[kelas]/uji-cepat/hasil`; Guru; J5.6.
- **Evidence:** `batch-3/evidence/w65/16-uji-cepat-hasil.png`.
- **Acceptance:**
  - her written confirmation (`batch-3/05:148`);
  - [auto] the label and base wording in `hle.ts` match it;
  - W6.7 at Level 3.

### A3 · D3: the small-group display rule (Uji Cepat)
- **Approved rule:** none for the Uji Cepat. The catalogue's class metrics use a floor of 5 (`batch-3/02:56`).
- **Implemented:** the figure is shown from one scored learner, and is null only when none is scored (`hasil-ujicepat.ts:74`).
- **Missing:** a minimum, or a decision that none applies.
- **Class:** POL · **Decides:** the threshold touches what a teacher may infer, so **O** (recorded as «possibly also the owner», `batch-3/02:9`). The under-threshold presentation is **D** (the Empty-state grammar).
- **Deliverable:** the presentation for a group under the threshold, for each option the owner may choose (O3). It can be drawn now; it is built only after O3.
- **Affects** and **evidence:** as A2.
- **Acceptance:**
  - [auto] under the chosen threshold, no class figure is rendered, and the Empty-state grammar (`Kosong`) says why;
  - [auto] at and above it, the figure and its base render as A2;
  - [auto] the threshold value is read from one place, not repeated in the page.

### A4 · Batch 3 wordings awaiting approval: B2, B5, C2, C3, C5, C7, C9, D7 (`batch-3/02:10`, `batch-3/05:150`)
- **Implemented:** engineering's words in `hle.ts`, listed per item in `batch-3/02:24-60`:

  | Item | Words |
  |---|---|
  | B2 | the per-step result |
  | B5 | send-back and history |
  | C2 | grouped findings |
  | C3 | Aturan Asesmen |
  | C5 | «Unduh contoh isian» |
  | C7 | the count unit «tujuan pembelajaran» |
  | C9 | the workbook sheet «Kursus» vs «paket» |
  | D7 | «(opsional)», «Rincian nilai», «Nilai kelas», «Belum ada nilai», «Terkirim», «Disediakan» |

- **Class:** TERM · **Decides:** D. The C3 «arah berpikir» hint, and C9 (it changes every school's template), may need **G**.
- **Deliverable:** the approved Indonesian and English per key, or her words.
- **Acceptance:** the copy in `hle.ts` (`batch-3/05:150`).

### A5 · Batch 3 cosmetic and layout confirmations: B1, B3, B4, B6–B12, C1, C4, C6, C8, D2, D4, D5, D6, D8, D9, and J5's live «Jendela: …» line (`batch-3/05:151-152`)
- **Notable:**
  - D5, the Uji Cepat launch result, is the named exception to W3.17.
  - B10 / C8: the question list's position on the package page.
  - C6: no «Hapus saringan».
  - D2 is arguably settled by DS/11-validation.md:194.
- **Class:** VIS / INT confirmations · **Decides:** D.
- **Deliverable:** a yes, or a correction, per item.
- **Evidence** (each is our render beside hers):
  - `batch-3/evidence/sisi/`: `j1-kelas.png`, `j1-terbit.png`, `j1-terbitkan.png`, `j1-tersedia.png`, `j5-jendela.png`;
  - `batch-3/evidence/sisi-penutupan/`: `f7-bank-guru.png`, `j1-beranda.png`, `j1-kelas.png`, `j1-siapkan.png`, `j5-jendela.png`.

---

## Package B · Administration and identity

### B1 · W3.6: Konfigurasi's organisation (F-12(4), RV-24, RV-15 residue, J3.3)
- **Approved rule:**
  - G §2: «Daisy's split or index (F-12); Collection; date helper» (G:35).
  - DS/07-proposal.md:50: Konfigurasi becomes «the same components as every other surface».
  - DS/05-navigation.md:34: its links move into the navigation.
- **Implemented:** one 1,578-line, Tailwind-composed page (`src/app/konfigurasi/page.tsx`).
  - A section menu (it no longer prints: Batch 6, B6P-K01).
  - UX-33 «Yang menunggu», RV-16 dates and RV-18 are done.
  - RV-24 residue: «Inteligensi & Laporan» (`hle.ts:3129`), «Lingkungan» (`hle.ts:3181`).
- **Missing:**
  - the split-or-index composition;
  - the sections on Collection or Form;
  - the RV-24 fixes: the empty «Lingkungan —» tile, the «PINTAR» eyebrow, the index label, the all-«—» «Versi» column, the stripe;
  - the RV-15 platform-admin wording (application-pass log :141, :150).
- **Class:** COMP · **Decides:** D. RV-15's seed name needs approved text (G if a protected term).
- **Deliverable:** the Konfigurasi composition, covering:
  - split versus index;
  - the section order;
  - each section's pattern;
  - every role's view (Admin sekolah; Admin platform in «Seluruh platform»);
  - empty, refusal and loading states.
- **Affects:**
  - `/konfigurasi` and its children `/konfigurasi/keamanan`, `/konfigurasi/email-uji`, `/konfigurasi/sertifikat`;
  - J3.3–J3.9; S-2.
- **Evidence:**
  - `daisy-design-completion/layar/konfigurasi-admin-sekolah-1280.png`, `konfigurasi-admin-sekolah-820.png`, `konfigurasi-admin-sekolah-390.png` (new);
  - `batch-4/evidence/admin-ujung/09-menunggu.png`, `10-email-tertahan.png`;
  - `batch-6/evidence/cetak/staf-konfigurasi-cetak.png`.
  - **Missing:** Konfigurasi as Admin platform in «Seluruh platform» was not captured (03, «Missing evidence»). It is reproduced on a disposable stack before the composition is accepted.
- **Acceptance:**
  - every route meets G §2 (G:35, :81);
  - D-156(a) keeps Batch 4's product acceptance open on this item.

### B2 · UX-09: «nomor induk» (W2.13)
- **Approved rule:** «Name PINTAR's school number so it cannot pass for the NIS, and say once how it differs from the PINTAR ID. Settle in the identity copy (DAISY-20/24)», owner Daisy (UXR:23).
- **Implemented:** the term at `hle.ts:2746, 2751, 2753, 2757, 2759, 2801, 2817, 2832, 4320`. Shown on `/pendataan` and in the Aktivasi search. «No ruling exists, so no term was invented» (`batch-4/01:106`).
- **Class:** TERM · **Decides:** D, with **G** if it is a protected institutional term (D-135(c)).
- **Deliverable:** the name and its one differentiating sentence, in Indonesian and English, with where it appears.
- **Affects:** `/pendataan`, `/aktivasi`, the intake workbook; Admin sekolah.
- **Evidence:** `batch-4/evidence/admin-ujung/01-kode-sekolah.png`.
- **Acceptance:**
  - [auto] every listed `hle.ts` key carries the approved term, in both languages;
  - [auto] the differentiating sentence appears once, where Daisy places it;
  - [auto] the term is never shown where the value is the PINTAR ID, or the NIS;
  - final terminology acceptance waits on G3 if Dr Gladys rules it a protected term.

### B3 · D-074(10): the card with more than two role/school pairs (W3.20)
- **Approved rule:** the card must not shrink type below the minimum, truncate, or silently omit a role; the case is «surfaced as an unresolved presentation exception for product handling, not solved on the card» (DEC:82).
- **Implemented:**
  - Every line is drawn at the approved type, and the card is marked `data-pengecualian="lebih-dari-dua"` (`src/lib/kartu-pintar.ts:65-79`; `src/components/kartu/KartuPintar.tsx:47`).
  - **Not reachable today:** on staging all 67 role holders hold exactly one pair (`batch-6/02:70`).
- **Class:** POL · **EXPLICITLY UNRESOLVED (owner, 4 Nov).** The rule holds as built: no truncation, no shrinking, no silent omission.
- **Deliverable:** **none in this exercise.** Not designed until the owner rules on the product handling.
- **Affects:** `/akun`, the activation welcome; staff; J2.16.
- **Evidence:** `batch-6/evidence/B6K/contoh-tiga-pasangan.png`, `contoh-dua-sekolah.png`, `contoh-satu-sekolah-dua-peran.png`; Daisy's card round 2 §10 (render F-kasus-uji).

### B4 · The card: a school-less role beside a school role (Admin platform plus a school role)
- **Approved rule:** none drawn. The nearest rule is D-074(6), «one role and its school per line».
- **Implemented:** two places, one line each, so a platform role never sits under a school (`kartu-pintar.ts:71-78`).
- **Class:** COMP (edge case) · **Decides:** D.
- **Deliverable:** confirm the current treatment, or draw it.
- **Evidence:** **no render of a platform role beside a school role exists.** The nearest substitute is `batch-6/evidence/B6K/contoh-dua-sekolah.png` (two schools), labelled as a substitute (03, «Missing evidence»).
- **Acceptance:**
  - [auto] the platform role takes its own line, with no school under it;
  - [auto] the order and colour follow D-074;
  - [auto] nothing is truncated or shrunk;
  - Daisy's confirmation, or her drawing, recorded.

---

## Package C · Reports and learning evidence

### C1 · W3.8: the report body and the A4 print (RV-11, J7.2–J7.4, X.7, F-12(2))
- **Approved rule:**
  - G §2: «Reports: NO APPROVED COMPOSITION» (G:34).
  - E's exit gate: «report pages name class, school and period, in the shell, printable» (E:90).
- **Implemented (Batch 5):**
  - the staff shell; the school, class and period named;
  - print without navigation (`src/app/edukator/ringkasan/page.tsx`, `src/app/dekan/ringkasan/page.tsx`);
  - the approved metric words kept («Peserta», «Kenaikan»).
- **Missing:** the body's composition, and the A4 print layout: page breaks, margins, a repeated header line (`batch-5/01:159`).
- **Class:** COMP · **Decides:** D for presentation. **The metrics' definitions are not Daisy's.** The labels are G's (see C3).
- **Deliverable:**
  - the Ringkasan Kelas and Ringkasan Sekolah bodies at 1280, 820 and 390 px;
  - the empty and under-five («not yet») states;
  - the A4 print specification: pages, breaks, margins, the header line, colour in print;
  - the bodies of the Management and professional-learning routes, where G:34 names reports.
- **Routes, roles and variants** (in full in the brief, §5 «C1: the concrete routes»):

  | Route | Readers |
  |---|---|
  | `/edukator/ringkasan?kelas=…` | the readers `generate_report` authorises, per metric |
  | `/dekan/ringkasan?simpul=…` | the same; read-only (INV-19) |
  | `/pimpinan`, `/pimpinan/[simpul]` | Kepala departemen, Dekan over an assigned node; **Admin sekolah is refused by design** |
  | `/pimpinan/[simpul]/murid`, `/pimpinan/[simpul]/murid/[orang]` | as above, plus `CAN_VIEW_LEARNER_ROSTER` |
  | `/pimpinan/[simpul]/umpan-balik`, `…/umpan-balik/[siklus]`, `…/umpan-balik/kelas/[kelas]` | as `/pimpinan` |
  | `/pengembangan/[simpul]` | facilitator; Kepala departemen; Dekan; Admin sekolah (enrolment, participation, completion only) |

- **Affects:** J7.2–J7.4; S-8.
- **Evidence:**
  - `batch-5/evidence/B5A/`: `ringkasan-kelas-1280.png`, `ringkasan-kelas-320.png`, `ringkasan-kelas-print.png`, `ringkasan-kelas.pdf`, `ringkasan-sekolah-1280.png`, `ringkasan-sekolah-320.png`, `ringkasan-sekolah-print.png`, `ringkasan-sekolah.pdf`, `pimpinan-1280.png`, `pimpinan-kelas-1280.png`;
  - `batch-5/evidence/walk/run3-fresh/04-laporan-kelas.png`, `04-laporan-kelas-cetak.png`.
- **Acceptance:** E:90; the A4 print check (W3.22, `audit/b6-cetak.mjs`).

### C2 · W2.16 item 5: the PD Kelas «Lihat bukti» presentation (DAISY-35(5), CR-57, J9.8)
- **Approved rule:**
  - D-070(h): a PD Kelas keeps its ordinary «Lihat bukti» page, empty of academic figures by design; «presentation only; no figure is added or computed» (`docs/coordination/design/EDUCATOR-AS-LEARNER-TICKETS.md:382, :746`).
- **Implemented:** items 1–4 done in Batch 5. `src/app/mengajar/[kelas]/bukti/page.tsx` renders the ordinary page for a PD Kelas.
- **Class:** COMP · **Decides:** D.
- **Deliverable:**
  - how the page presents the absence of academic figures for a PD Kelas;
  - the pointer to the professional-learning record (DAISY-34);
  - no new figure.
- **Affects:** `/mengajar/[kelas]/bukti` (PD Kelas); the facilitator; J9.
- **Evidence:** **missing: no seeded PD class exists**, so no screenshot (03, «Missing evidence»). The ordinary class pages are in `batch-3/evidence/w65/` (e.g. `13-riwayat.png`), and the code is cited above. A PD class is reproduced on a disposable stack before the composition is accepted.
- **Acceptance:** DAISY-35's own (BRD:260); UX1-AJAR-KATA-01 holds.

### C3 · W3.9 / UX-41: the metric labels and the heading (dependency, not Daisy's)
- **Status:** Dr Gladys's words. The approved «Peserta», «Kenaikan» and «Penguasaan per bagian» are kept (D-157(a)); the questions are in `batch-5/02-PROMOTION-PRECONDITIONS.md`, condition 1.
- **Daisy:** lays out C1 with the approved words and must not replace them.

---

## Package D · Certificates, Digital Card and email

### D1 · DAISY-37: the identity-email composition, including the card in the email (CR-22, J2.15, DAISY-24 «All six emails final»)
- **Approved rule:**
  - D-079(a)–(f) and its addendum (DEC:87): one canonical shell; who, why, what; the context line; images blocked; plain text; the real duration.
  - DAISY-37 (1)–(4) (BRD:211).
- **Implemented:**
  - the DAISY-19 frame, `src/components/email/bingkai.ts`;
  - the templates, `src/components/email/identitas.ts`: the card email is detail rows in the database's order;
  - the honest send status (Batch 6, D-160(d)).
- **Missing:** «DAISY-37 has no composition» (`batch-6/01`). For the card in the email, the open points are:
  - the layout at 600 and 320 px, light and dark;
  - table HTML or image;
  - whether the back and the QR appear;
  - the wordmark with images blocked;
  - whether the rows follow the card's alphabetical order and colour rule.
- **Step 1, first (owner, 4 Nov):** Daisy identifies the existing approved email frame (the DAISY-19 frame and D-079), and checks it against D-079(a)–(f) and DAISY-37 (1)–(4).
  - Her own validation says CR-22 is covered: «Has it (8 Oct): D-079 is the email standard and the DAISY-19 frame its implementation» (DS/11-validation.md:196; GQ3 :211).
  - She returns **a requirement-by-requirement covered/missing mapping** (the brief, §5): one row for each of D-079(a)–(f), its addendum, DAISY-37 (1)–(4) and each card-in-email point above.
  - **A complete frame means confirmation and reuse, not a redraw.** Only a missing row is new composition.
- **Step 2:** the six emails' structure and states, and the card in the email, with a **provisional wordmark placeholder**. The final artwork depends on F-11; the wordmark is «Pintar» `#075056` (D-161(e)).
- **Class:** COMP (only what step 1 finds missing) · **Decides:** D.
- **Deliverable:**
  - the six emails (activation, resend, recovery, password changed, card, security notice) in one shell;
  - 600 and 320 px, light and dark, images blocked, and plain text;
  - the card in the email.
- **Affects:** every staff person's identity emails; J2.15; S-3, S-11.
- **Specification and evidence:**
  - `docs/coordination/ux/email-frame/README.md`; `render-wiring/contoh-kode-320-terang.png`, `contoh-kode-320-gelap.png`, `contoh-kode-600-terang.png`, `contoh-kode-600-gelap.png`, `contoh-kode-600-tanpa-gambar.png`;
  - the card-in-email mock-ups `docs/coordination/ux/kartu-pintar/ronde-2/render/H-email-600-terang.png`, `H-email-600-gelap.png`, `H-email-320-terang.png`, `H-email-320-gelap.png` («The card in the DAISY-19 email frame», ronde-2 README:51; it predates the brand change).
- **Acceptance:**
  - BRD:211: real Gmail and Outlook renders (desktop and mobile, light and dark, images blocked);
  - the recognition check, and the within-seconds check at 320 px;
  - complete plain text; no internal words; one shell.
  - E:98 «emails match DAISY-37».

### D2 · The certificate's PDF file name (DAISY-36)
- **Approved rule:** Daisy's round-2 example «Sertifikat Penguasaan · Bagas Saputra» (ronde-2 README:392) versus W3.1, which keeps people's names out of titles.
- **Three strings, kept apart:**

  | String | Today |
  |---|---|
  | the download file name «Simpan sebagai PDF» suggests | «Sertifikat Penguasaan · {kursus}» (`sertifikat.berkas`, set as the document title only while printing: `src/components/sertifikat/AksiCetak.tsx`) |
  | the PDF metadata title | the same string (Chromium writes the title into the PDF) |
  | the visible certificate heading | the frozen sheet's; **not reopened** |

- **Class:** TERM within W3.1 · **Decides:** D recommends within W3.1; **only an exception to W3.1 (naming the person) goes to the owner** (O7).
- **Deliverable (form K):** the recommended file name and metadata title, within W3.1.
- **Evidence:** `batch-6/evidence/B6C/sertifikat-A4.pdf` (its Title: «Sertifikat Penguasaan · Matematika · Pecahan Senilai»).
- **Acceptance:**
  - [auto] the printed PDF's Title and the suggested name equal the approved string;
  - [auto] neither contains the learner's name unless the owner has approved the exception;
  - [auto] the tab title is restored after printing.

### D3 · The physical-proof consequences (dependency)
- The 0.75 mm line and the QR geometry freeze only after the physical proof (D-074(9)(12), D-080(6)(7)).
- If the QR fails, Daisy's options are already recorded: move the line to about 33.5 mm, or put the ID beside the tile (D-074(9)).
- **This is F-11 (O). It becomes Daisy's only if the proof fails.**
- **Evidence:** `batch-6/evidence/B6K/akun-cetak.pdf`, `batch-6/evidence/B6K/ukuran.json`; `batch-6/evidence/B6C/cetak-A4.png`, `batch-6/evidence/B6C/ukuran-cetak.json`.
- **Acceptance:** the recorded manual physical-proof protocol (the brief, §8).

### D4 · W3.21: republish the Design System page
- **Approved rule:** «The Design System page (version 18) predates c42fecb … Republish with the next design change» (`docs/handoff/codex-2026-10-09/07-OPEN-WORK-AND-BLOCKERS.md:62`).
- **Class:** PUB · **Decides:** D.
- **Deliverable (form P), in stages:**
  - **Stage 1**, once the no-decision items are in: the page republished to the frozen system with their outcomes and the settled brand («Pintar» `#075056`, the palette unchanged). Every section waiting on F-11 or a decision is **marked provisional**.
  - **Stage 2**, after F-11 and the decision-gated items: the provisional sections resolved.
- **Acceptance:**
  - [manual] each stage's page lists its change log against version 18;
  - [manual] no provisional section is presented as final;
  - [manual] the superseded Wordmark card is marked superseded, not silently removed.

### D5 · The brand and wordmark slots (re-scoped by D-161)

| Slot | Today | Old rulings it conflicts with |
|---|---|---|
| the shell wordmark (OP-3, AP-1) | `src/components/MerekPintar.tsx` (today's logo) | D-120 Q16; DS Wordmark card (`PINTAR` capitals, `#245F55`, «the only identity inside the product»); D-160(a); F-11's Helvetica Neue 65 Medium |
| the certificate header slot | `MerekSertifikat.tsx` («SELALU» prints) | D-076(b)(7); D-120 Q16; DS/08-migration.md:60, :169 |
| the card front slot | `MerekKartu.tsx` (5.2 mm wide) | D-074(3); D-120 Q16; card round 2 §L |
| the email header | `public/brand/pintar-email-logo.png` | DS/08-migration.md:57; D-079(c); D-120 Q16 |
| the tab icon | `favicon.ico` (Daisy's icon); `icon.svg` and `apple-icon.png` not shipped (owner, proxy paths) | DS Wordmark card (a `pintar-primary` square = `#245F55`) vs D-161's `#075056` |
| DAISY-37 point 3 | not built | «PINTAR SELALU» typeset as live text. It fits D-161's application name, not its public wordmark «Pintar» |

- **Reconciled** (D-161(e)):
  - the wordmark is «Pintar» in `#075056` in every slot once the master exists;
  - the interface palette is unchanged (`--pintar-primary` `#245F55`).
- **Still owner's, and not Daisy's:** where «PINTAR SELALU» replaces «PINTAR» in running text, and the tab icon's colour.
- **Class:** COMP (geometry only) · **Decides:** D.
- **Deliverable:**
  - the slot geometry for «Pintar» in the shell, certificate, card and email, drawn with the **provisional wordmark placeholder**;
  - the replacement for the superseded Wordmark card's rules (size ladder, clear space, versions), as a placeholder specification.
- **Never** the artwork or a master (F-11).
- **Acceptance:**
  - [auto] each of the four slots has its size, position and clear space stated in millimetres or pixels;
  - [auto] the placeholder is labelled «Pintar (master pending F-11)» in every slot;
  - [auto] no change to `--pintar-primary` or any token;
  - [auto] today's logo stays in every slot until the master exists (D-160(a)).

---

## Package E · Shared experience

### E1 · W3.12: J3 navigation under L3 (OP-1, OP-2, F-12(5))
- **Approved rule:**
  - DS/05-navigation.md:56: the rail from 1024 to 1279 px, icons only, 72 px.
  - :34: «the final menu … is confirmed with Yazid in the application pass».
  - :38: group labels only where a person has two contexts.
  - J3 README: «Ciutkan navigasi», the «Mengajar» / «Belajar» labels, the JQ7 hairline.
- **Implemented:**
  - OP-1: the full 248 px navigation from 1024 px, with no rail and no collapse.
  - OP-2: since L3 the shell shows one context's places, so no group label (`src/components/NavKonteks.tsx:25-35`).
- **Missing:** «the composition predates the working-context model» (C:85).
- **Class:** COMP (restate under L3) **or** an accepted deviation · **Decides:** D to restate, **or O** to accept OP-1 and OP-2 as deviations. The menu order is confirmed with the owner (DS/05:34).
- **Deliverable:** J3 restated under D-132's working context:
  - the rail, the collapse and the tooltips;
  - labels or none under one context;
  - the context line's place.

  Or a recommendation that the owner accepts the deviations.
- **Widths:** 1280, 820, 390, 320, and **1024–1279** (the rail's range).
- **Evidence:** `daisy-design-completion/layar/rail-rentang-mengajar-1100.png`, `daisy-design-completion/layar/rail-rentang-1024-1279-1100.png` (new); DS `render/jalan/J3MengajarBelajar*.txt`.
- **Gate:** the design (C) or the recommendation (K) can be given now; the build waits on the owner's O6.
- **Acceptance:** E:90 «compositions J3, J4 and J6 matched».

### E2 · W3.16: the `/` chooser, the context control and the six expressions (CR-54 S2, D-132(m), F-12(3))
- **Approved rule:**
  - D-132(m): «Daisy may design their placement and states; Dr Gladys supplies the words» (DEC:140).
  - D-132(c): `/` is the single deliberate chooser.
- **Implemented:**
  - `src/app/page.tsx`: Tailwind; the doors «Saya mau belajar», «Saya mengajar · <school>».
  - The six semantic keys return null and draw nothing (`src/lib/istilah-menunggu.ts`).
  - The context control's look is Daisy's (`NavKonteks.tsx:29`).
- **Missing:** «Chooser: NO APPROVED COMPOSITION» (G:38); the placement and states of the six expressions.
- **Class:** COMP + TERM · **Decides:** D for the composition; **G** for the six words (W4.2, F-13).
- **Deliverable:**
  - the chooser and the context control, at three widths;
  - their states: not held, another context, invalid, another school, choose a place, the «Mengelola» label;
  - the slots for the six words: placement only, never the words.
- **Affects:** `/` and every staff shell's context line; every multi-context staff person; J1.3, J3.1.
- **Evidence** (new, in `daisy-design-completion/layar/`): `pemilih-guru-yang-belajar-1280.png`, `pemilih-guru-yang-belajar-820.png`, `pemilih-guru-yang-belajar-390.png`, `pemilih-admin-platform-1280.png`, `pemilih-admin-platform-390.png`, `pemilih-admin-sekolah-1280.png`.
- **Acceptance:**
  - G:38;
  - **structural acceptance** with the six words as empty slots;
  - **final closure only with G1:** any word placeholder is a NO-GO at Gate 2 (G:81).

### E3 · The Batch 2 questions, none answered (`batch-2/02-DAISY-QUESTIONS.md:7-21`)

| # | Item | Built today | Class |
|---|---|---|---|
| 1 | The page-title convention «<page> · PINTAR»; a data-headed page titled by its place | `src/lib/judul-halaman.ts` | TERM |
| 2 | The skip link covers «Belajar» while focused (axe target-size 21.8 px of 24) | `.pin-lewati` | VIS / a11y |
| 3 | The idle warning: in the flow, or sticky | `.pin-jaga` | INT |
| 4 | Words for three disabled reasons; `AlasanNonaktif` is used nowhere | `src/components/AlasanNonaktif.tsx` | TERM |
| 5 | English «Sept» or «Sep» | `src/lib/tanggal.ts` | TERM |
| 6 | «No date yet.» | `tanggal.belum` | TERM |
| 7 | An email's formal date with a time | «9 Oktober 2026 pukul 07.30 WIB» (`tanggal.ts`; `email/identitas.ts:107`; `keamanan.ts:21`) | TERM |
| 8 | Konfigurasi's overlap sentence | the timestamp form | TERM |
| 9 | Seconds in Email uji's history | none (`cap` form) | TERM / IA |
| 10–13 | Collection: the no-script button, the empty search count, the one-page pager, unknown totals | `FormKoleksi`, `Koleksi`, `HalamanKoleksi` | INT / TERM |
| 14 | English for Collection and FileField | `koleksi.*`, `berkas.*` | TERM |
| 15 | 25 dates still in the formal form | `format.date` call sites | TERM |

**Decides:** D (#1 page titles: G only if a title is a protected term). **Deliverable:** an answer per row. **Evidence:** `batch-2/evidence/01-lewati-1280.png`, `02-menu-1280.png`, `03-dialog-1280.png`, `keyboard-walk-2026-11-02.json`.

### E4 · Engineering-written words where Daisy gave only the grammar
- **Keys:**
  - `sertifikat.kelola.*`, `sertifikat.cabut.*`, `studio.integritas.*`;
  - `laporan.cakupan.*`, `mengajar.murid1.tujuan*`;
  - `lesson.media.tidak_ada*`, `aktivasi.tunggu.*`, `tolak.kembali_sertifikat` (`batch-5/01:164`, «Dr Gladys / Daisy»).
- **Batch 6's own:** the email-status words, `sertifikat.berkas`, `akun.kartu.*` (`batch-6/01` §3 item 9): G.
- **Class:** TERM · **Decides:** G first. Daisy confirms only where a word is presentation (a button label inside her grammar), not a protected term.
- **Deliverable (form T):** per key, presentation (Daisy's word) or protected (Dr Gladys's slot).
- **Acceptance:**
  - [auto] every key in the list has an approved Indonesian and English in `hle.ts`;
  - [auto] the copy-table and no-internal-words guards stay green;
  - final terminology acceptance only with G4.

### E5 · Batch 7's design dependencies (E:100-106)
- **W6.12** (NVDA, TalkBack, 200 % zoom) is «only meaningful once the screens are final». It follows A1, B1, C1, C2, E1 and E2.
- **W4.4** brings the compositions' new words into `hle.ts`; it follows the same items.
- **Gate 2:** «the five new designs applied; terminology final» (G:81).
- **Class:** E (dependency) · Daisy's items above unblock them.

---

## Reconciliation notes

**Duplicates merged:**

| Merged item | Its IDs |
|---|---|
| A1 | W1.2 / A1 / DG-25 / RV-21 layout / CR-88 / F-12(1) |
| A2 | W2.4 / CR-27 / J5.6 / D1 |
| B1 | W3.6 / F-12(4) / J3.3 / RV-24 / RV-15 |
| C1 | W3.8 / RV-11 / F-12(2) / X.7 |
| C2 | W2.16(5) / DAISY-35(5) / CR-57 / D-070(h) |
| D1 | W3.20 emails / CR-22 / J2.15 / DAISY-37 / DAISY-24 emails |
| D5 | OP-3 / AP-1 / CR-56 / F-11 wordmark / W3.20 wordmark |
| E1 | W3.12 / OP-1 / OP-2 / F-12(5) |
| E2 | W3.16 / CR-54 S2 / D-132(m) / F-12(3) |

B3 and B4 stay separate: one has a written rule and the other has none.

**Completed or superseded: not to be reopened (owner, 4 Nov)** (not in the brief):
- the RV-21 ▶ markers (Batch 2);
- UX-10 «surel» (the words are «Alamat email»);
- UX-02–08, 11, 12, 14, 16, 20–22, 24, 26, 27, 30, 32 (done, UXR); UX-23, 28 and 29 (moved to DAISY-25); UX-31 (DAISY-20);
- DAISY-20–23 (landed, BRD reconciliation note);
- DAISY-36 (built in Batch 6; only F-11 and D2 remain);
- the DAISY-24 card (built; only F-11, B3 and D1 remain);
- DAISY-35(1)–(4) (Batch 5);
- the copy owed for C1, C2, «Tandai soal ini», CR-13/50/76/81 (applied);
- the class-page and D6 navigation (Batch 3 closure);
- UX-38 / RV-19 tour modality (D-157(b));
- the MODE PERAGAAN exit (D-157(c));
- UX-33, 37, 40, 45, 46 (Batches 4–5);
- the Q16/Q18 framing, now superseded by D-161.

**Not Daisy's:**

| Owner | Items |
|---|---|
| Owner | F-11 (the master, the physical proofs); the D-161 items still open (the application name in running text, the tab-icon colour and proxy paths); D-074(10) |
| Engineering, approved in principle | the certificate's sage accent: D-162, migration 194, under the Batch 6 gate |
| Dr Gladys | W3.9, UX-41; W4.2 (OP-6, OP-7, the L4 §4 list); `auth.link_sent`; the Batch 5–6 engineering strings; the universal-term proposal (`batch-0/08`) |
| Engineering | every «E» row of the register, and print beyond Chromium |

**Register gaps: UX-42, UX-44, UX-47.** They are «for the UI/UX POLISHED pass» with no owner, and absent from C. **Proposed owner and disposition, for the owner's approval** (until approved, this inventory is not claimed exhaustive):

| Item | What it is | Proposed owner | Proposed disposition |
|---|---|---|---|
| UX-42 | internal identifiers shown on screen (Studio integritas, the Studio page, «kanonik») | engineering | an engineering verification against the no-internal-words guard; any word that needs replacing goes to E4 (Dr Gladys first) |
| UX-44 | «Program» shown despite D-006 | engineering, with Daisy confirming | an engineering IA check of where «Program» appears; Daisy confirms the placement within E3/E4 if a label moves |
| UX-47 | English term drift | Dr Gladys | tied to Terminology v1; carried with W4.4 in Batch 7 |

**Excluded as 4.1, 4.5, 5.0 or speculative:**
- per-question review comments (D-142);
- a broader institution model behind universal words (4.5/5.0);
- card-edition history / «PINTAR Journey» and the student and PINTAR-team card families (D-059(f)(g): staff cards only);
- a delivery webhook (D-160(d));
- C5 continuation (4.1, D-132(e));
- the Context-Aware Next Action (D-142(b));
- the A+ table stripe (only if a display fails).
