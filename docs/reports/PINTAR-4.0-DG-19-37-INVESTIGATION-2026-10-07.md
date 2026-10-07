# PINTAR 4.0 · Dr Gladys's natural-use session (7 Oct): investigation of DG-19 to DG-37

**Accepted GREEN by the Second Eye (7 Oct). Ruled in D-127:** `PINTAR-4.0-D127-WORKING-CONTEXT-AND-CLOSURE-STREAMS-2026-10-07.md`. Committed unchanged as D-127's evidence, under D-126's one documentation-only exception.


**Read-only. D-126 remains active.** Nothing was fixed, built, committed or deployed. Code facts are from main `41a89fa`, which is identical in application code to `bd4c0fa`, the build staging runs.

## How each fact was established

- **CONFIRMED (code):** read in the source, with file:line.
- **CONFIRMED (staging log):** read from staging's request and database logs for the session window, 7 Oct, about 03:24–05:15 UTC (10:24–12:15 WIB).
- **CONFIRMED (staging count):** a read-only aggregate SELECT that returns numbers and titles only, never people.
- **INFERRED:** the only reading consistent with the confirmed facts. Marked as such.
- **UNVERIFIED:** needs Yazid's recollection, a screenshot, or a runtime check that was not run.

No personal data was read for this report. One log query that would have shown request details was refused by the session's privacy safeguard, and it was not pursued by any other route.

---

## A. Executive verdict

**Are today's observations mostly presentation/UX?**
- **No: about half are.** The other half come from four structural causes that a visual pass cannot fix:
  1. PINTAR has **no active working context**: it records neither what the person is doing nor which school they are doing it in.
  2. **School-shaped screens are served platform-wide** to the platform-admin role, which Dr Gladys's account holds.
  3. Studio's **older forms** neither name their refusals nor keep the person's input.
  4. **Machine values** are used as the primary label on several screens.
- Her confusion is real evidence each time. In none of the cases traced was it a misunderstanding.

**Confirmed functional defects**

| | Defect | Evidence |
|---|---|---|
| FD-1 | **QH0ZS3.** Studio's Uji Cepat launcher let her pair a class with a chapter from another school. The database refused it correctly (INV-13), and the screen said only «Ada kendala» with a reference | CONFIRMED: staging log 04:52:00Z, `that module belongs to another institution (INV-13)`; studio/kuis/page.tsx |
| FD-2 | **KFRLGH.** The certificate-layout form offered a course from another school than the one selected. The school field defaults to the national library, which sorts first | CONFIRMED: staging log 05:03:38Z, `that course belongs to another institution (INV-13)`; studio/sertifikat/page.tsx:42-51 |
| FD-3 | **5 → 15 minutes.** After any refusal, Studio's forms reload with their defaults. Her «5» was replaced on screen by the field's default «15». Nothing was saved with 15. A second press would have launched 15 minutes | CONFIRMED: studio/kuis/page.tsx:142; actions.ts:501-513 |
| FD-4 | **Konfigurasi at platform scale.** It reads every active enrolment on the platform (1,323 on staging, no limit), then looks up all the names in one request. When that lookup fails, every row falls back to an 8-character ID fragment | CONFIRMED: code (konfigurasi/page.tsx:123, 194-197, 1010) and staging count. Staging's log shows repeated 400s on exactly that lookup during her session. Which screen sent them was not attributed, because that would mean reading request details |
| FD-5 | **Difficulty is inverted.** This was not observed by her; it is a side finding. The workbook stores «Mudah» as 0.3 and «Sulit» as 0.7. The database reads 0.3 as SULIT and 0.7 as MUDAH. So the teacher's Uji Cepat picker shows «Sulit» on the author's easy questions, and Studio's random launcher draws its «MUDAH» share from the author's hard ones | CONFIRMED: unggah-kontrak.ts:44 vs 20260913090000:305-310; used at 20261104100000:175 and 20260916100000:253 |
| FD-6 | **The «Lihat seperti siswa» preview is not what a learner sees.** It shows no pages and no worked examples, and diagram directives print as text | CONFIRMED (code): studio/pratinjau/[pelajaran]/page.tsx:43,78 vs LessonPlayer.tsx |
| FD-7 | **Tinjauan Integritas** never removes reviewed observations, so its "nothing waiting" sentence can never be true. A platform admin is offered «Diteruskan» on professional-learning observations, which the server refuses | CONFIRMED (code), investigator report; spot-checked: studio/integritas/page.tsx:25-37 |
| FD-8 | **The library grant/withdraw form (Pustaka PINTAR)** asks for «id sekolah» and «id izin». No screen shows an «id izin», and no read returns one. The form is shown to every school admin, and the server refuses them | CONFIRMED (code), investigator report |
| FD-9 | **Aturan Penilaian.** Each «Simpan» inserts a new version. Saved rules are INGESTED, while the learning cycle reads only APPROVED ones, so a save may change nothing that a learner meets | CONFIRMED that saves insert versions (studio_governance.sql:382-386). That no approval path exists is UNVERIFIED |

**Security and session concerns**
- **No vulnerability is evidenced.** Sign-out ends the session on the server:
  - PINTAR's own session record and the Auth session are both deleted. Auth's logout answering 403 means "already gone" (CONFIRMED in the staging log, on every sign-out).
  - Cookies are cleared.
  - Every page is sent `no-store`, and every protected page redirects to sign-in when there is no session (CONFIRMED locally).
- What she saw after Back (DG-19) was **the same person, signed in again, legitimately authorized**.
- **Two privacy gaps on shared computers:**
  - **DG-37, credentials visible on screen.** It is systemic (§B RC-7).
  - **BD-11, Back after sign-out with no new sign-in, has never been proven in a real browser.** The reload-on-restore guard runs only on computers declared shared or card (PenjagaSesi.tsx:41-42, 103-104). J2.9 is P0: "the next person never continues as the last".

**Authorization concerns**
- **None that grant more than a person is entitled to.**
- **Three intent questions remain:**
  - The JSON package import is open to every CAN_DRAFT holder, teachers included. D-007 keeps it "for machine producers".
  - The library grant form is shown to school admins.
  - The platform admin holds authoring, Uji Cepat and publishing rights in every school, by design. Is that intended for PINTAR's own operator?

**Architecture problems**
- No active working context, neither purpose nor school.
- School screens read platform-wide.
- Two Uji Cepat launchers with different rules. Studio's bypasses D-085 T2's choose → select → review → launch.
- Two visual systems:
  - 12 Studio pages use the older utility styling;
  - the teacher, learner and leadership areas use the newer `pin-*` grammar.
- The human-label guard (F06-S03) is too narrow to catch most of what she saw.

**Staging-data problems**
- **Her account holds the platform-operator role (Admin platform), not a school role.** So she walked every school at once.
- Staging has 8 schools, one of them synthetic, and 1,323 active enrolments.
- The synthetic school holds 20 copies of SD5 Bab 1 from the load and walk runs of 28 Sep to 2 Oct. They are the bulk of DG-30's identical rows.

**Which findings share root causes:** see §B. Eight clusters cover all 19 observations, plus one standalone defect (FD-5).

---

## B. Root-cause clusters

Severity scale:
- **S1:** security, privacy or data correctness.
- **S2:** a functional failure, or wrong information.
- **S3:** comprehension, blocking a task or failing the first-impression threshold of D-118(c).
- **S4:** polish.

### RC-1 · PINTAR has no active working context: purpose

- **Evidence (CONFIRMED, code):**
  - The three doors on `/` go to `/belajar`, `/masuk?peran=guru` and `/masuk?peran=staf` (src/app/page.tsx:50-58).
  - `?peran=` is dropped on purpose at sign-in (masuk/page.tsx:25-32) and read nowhere else.
  - The landing is chosen by the highest-ranked role (beranda.ts:42-57, masuk/actions.ts:137-141). A platform admin lands on `/konfigurasi` from both staff doors.
  - `/akun` builds its navigation from all the person's roles (akun/page.tsx:30-44).
  - No staff navigation leads back to `/belajar`, except the teacher's «Pembelajaran Saya».
  - No cookie or session row records a context. `device_sessions.mode` is device trust, not context.
  - The code states "no role switcher" (CangkangPengalaman.tsx:69-71) and "no role switch" (WP6A migration).
- **Affected:** DG-20, DG-21, DG-22, and DG-19's visible part. It also drives the section-11 items "no obvious route back Home", "logo not functioning as expected" and "authenticated areas change look and feel".
- **Current behaviour:**
  - Identity and entitlement are cleanly separated.
  - A context exists only as the current URL, so it is lost on the first page that has none of its own (`/`, `/akun`, the landing after sign-in).
  - «Saya mengajar» and «Saya mengelola sekolah» are the same door with two labels.
- **Canonical expected:**
  - D-010: each role lands on its own home; "the only exception is a person who asked for a specific page".
  - FABLE-00: "Entry is by purpose … Routing is role/intent-based".
  - The release checklist: for a person with several roles, "check how they choose where to go, and that changing context never widens authority".
  - D-069(h) defers senior-role navigation to the polish pass.
  - **No document defines what the doors mean beyond D-010.**
- **Severity:** S3; an architecture gap. It is not an authorization leak: a teacher-only person cannot reach Konfigurasi (tempat.ts:41-45, konfigurasi/page.tsx:100-102).
- **Pre-Gladys:** yes. Every multi-role person meets it, not only a platform admin. A teacher who is also a school admin lands on Konfigurasi too.
- **Claude, later:**
  - Carry the door's intent as a destination, as the learner door already does. D-010's exception allows this.
  - If ruled, a per-session context that pages without a context of their own honour.
  - `/akun` keeps the context, or gives a way back.
  - `/` offers Belajar from learning participation, not from `display_role` (CR-57 item 1).
- **Daisy, later:** shell and navigation (CR-54 S2). Her Q1 and Q11 extend to an admin who learns, the doors' meaning and a visible context switch. J3 covers the educator only.
- **Owner ruling required: YES.**
  - What does each door mean?
  - Does a chosen door hold until the person changes it?
  - One staff door or two?
  - How does a multi-role person switch?
- **Acceptance:**
  - A table of door × role-set → landing, ruled, and walked for every row.
  - Leaving the context happens only by the person's own act.
  - `/akun` never changes the context.
  - A journey proves it for {learner + admin}, {teacher + admin} and {platform admin}.

### RC-2 · School-shaped screens are served platform-wide: scope and scale

- **Evidence:**
  - The platform admin has CAN_DRAFT, CAN_QUICK_ASSESSMENT and CAN_PUBLISH in every school (`role_capabilities`; `can_in_institution` is true for SYSTEM_ADMIN).
  - The read rules give them every school's rows.
  - These screens do not filter by school and do not name the school:
    - Studio's Uji Cepat: classes, chapters (kuis/page.tsx:35-50);
    - certificate layout: courses (sertifikat/page.tsx:27,50);
    - Aturan Penilaian: definitions, no limit (definisi/page.tsx:26-31);
    - Bank Soal: newest 40 across schools (bank/page.tsx:46-62);
    - Tinjauan Integritas (integritas/page.tsx:25-31);
    - Konfigurasi enrolments: 1,323, no limit, with a single name lookup (konfigurasi/page.tsx:123,196).
- **Affected:**
  - DG-23 and DG-31: the dependent selects cross schools.
  - DG-30: rows from 6 schools look identical.
  - DG-32: observations from every school, unnamed.
  - DG-33: questions from several schools.
  - The ID fragments in Konfigurasi.
- **Current behaviour:** these screens were designed for one school. A multi-school reader gets them merged, with no school named and no scope chosen.
- **Canonical expected:**
  - INV-13, one tenant per act, holds in the database (it refused correctly both times).
  - CR-49 (paging in platform-admin lists, D · CAPACITY).
  - D-088(a): the platform operator works through screens.
  - Nothing canonical says the platform admin should see a school's screen without choosing the school.
- **Severity:** S2, the two failed saves and the names lost at scale. Otherwise S3.
- **Pre-Gladys:** **it depends on ruling Q3.**
  - If her walkthrough account holds school roles, most of this cluster will not appear in her walk. It still blocks the platform operator CR-69 will designate.
  - If she keeps Admin platform, it is all pre-Gladys.
- **Claude, later:**
  - A chosen school for multi-school readers (the same construct as RC-1, if ruled).
  - Dependent choices bound to that school.
  - Bounded reads with paging.
  - Name lookups that do not grow with the platform.
- **Daisy, later:** a school chooser in the shell, and a scoped-list pattern (Table plus Pagination exists).
- **Owner ruling required: YES.**
  - Q2: Should a multi-school person work in one chosen school at a time?
  - Q3: What role(s) should Dr Gladys hold for the formal walkthrough?
  - Q11: Is the platform admin meant to author, launch and publish in any school?
- **Acceptance:**
  - On every Studio and Konfigurasi screen, a platform admin sees one named school at a time.
  - No form offers a combination the database refuses for tenancy (a test per form).
  - Konfigurasi shows names, never fragments, at 10× staging's enrolments.

### RC-3 · Studio's older forms: unnamed refusals, lost input, unbound choices, a second launcher

- **Evidence (CONFIRMED, code):**
  - Studio's `ditolak()` maps errors with the generic `kodeGalat` (studio/actions.ts:40-46).
  - The class page's own mapping already names INV-13 as QUICK_NOT_ALLOWED (ujicepat-kontrak.ts:39), so the same refusal is named on one launcher and a reference number on the other.
  - `back()` returns only a result code, so the forms re-render with `defaultValue`.
  - There are two launchers:
    - `/mengajar/[kelas]/uji-cepat`: D-085 T2's flow, class-bound, 10/15/30 minutes, keeps the choices (BOB-34);
    - `/studio/kuis` (ADR-0018): count plus minutes, random draw, any class, any chapter, free minutes defaulting to 15.
- **Affected:** DG-23, DG-24 and DG-31. The certificate picker's raw CLASSIC, MODERN and MINIMAL (DG-31) is CR-06.
- **Canonical expected:**
  - D-011: a refusal in human words, a reference only for the unknown.
  - D-085 T2: Uji Cepat is choose → select → review → launch.
  - BOB-34: a refused launch reopens with the teacher's own choices.
  - D-080 / CR-06: the certificate layout is frozen, and the picker goes.
- **Severity:** S2.
- **Pre-Gladys:** yes. She met two of these four failures within 11 minutes.
- **Claude, later:**
  - One Uji Cepat path, as ruled.
  - Every refusal these RPCs can raise named in the copy.
  - Submitted values kept on refusal.
  - Dependent choices bound (with RC-2).
  - The certificate picker removed (CR-06).
- **Daisy, later:** wording for the newly named refusals.
- **Owner ruling required: YES.** Q4: Does Studio's `/studio/kuis` launcher stay in 4.0, given D-085 T2?
- **Acceptance:**
  - No refusal that the database raises with a known cause reaches the screen as «Ada kendala» plus a reference.
  - Proven by a static test that extends BOB32-K01 to Studio's actions.
  - A refused submission reopens with exactly what was sent.
  - A walk shows a failed Uji Cepat that keeps 5 minutes.

### RC-4 · The human interface boundary is not enforced

- **Evidence:** see §E for the inventory.
  - The doctrine already exists:
    - D-011;
    - D-014;
    - the enum rule (hle.ts:1945-1948): «A staff reader is still a human and §7 admits no exception»;
    - `enumLabel` (hle.ts:4800);
    - D-122(5) W-1, W-6 and W-7: «human labels, the raw value underneath and secondary»;
    - CR-75's target.
  - The guard F06-S03 (selftest/static.test.ts:1649-1656) catches only `{x.col}` where the column is an enum. It misses:
    - enum literals in arrays (definisi:77-87);
    - `short(id)` used as a primary label (integritas:56; kanonik:91);
    - JSON as an input or placeholder (definisi:93-94);
    - raw text columns (`audit_log.action`, `metric_id`);
    - numbers with no meaning given (`300s`, `0.3`);
    - name fallbacks to an ID fragment (FD-4).
- **Affected:** DG-27, DG-28, DG-29, DG-32 and DG-34 (all five examples); DG-30 (the missing distinction); DG-31 (CLASSIC); DG-33 (0.3/0.5); DG-35 (JSON).
- **Current behaviour:** where a screen was built before the copy table and the enum rule, or as an operator tool, it renders the storage shape.
- **Canonical expected:** as quoted. **The proposed invariant restates existing doctrine; it is not a new principle.** It can be adopted:
  > «No ordinary PINTAR workflow may require a user to understand or manipulate database IDs, UUID fragments, enums, API/domain constants, JSON, raw metric keys, internal event names or unexplained machine values. Technical references may remain where genuinely necessary for support, audit or troubleshooting, subordinate to the human identity and action.»
- **Severity:** S3. S2 where the raw value hides the person or entity: the integrity review, and the ID fragments.
- **Pre-Gladys:** yes, for everything on screens she will meet.
- **Claude, later:**
  - **First, the guard:** a static check over every page for `short(`, `.slice(0, 8)` on a label, enum literals rendered as text, JSON inputs outside an integration surface, and unexplained number formats. Red before, green after.
  - Then the screens, through the shared components (§F).
- **Daisy, later:** the identifier pattern (name first, identifier secondary in `t-identifier`), already in her grammar; labels for the remaining enums and metrics.
- **Owner ruling required: YES,** to adopt it as a **closure invariant** (Q5), so that it gates the slices.
- **Acceptance:** the extended guard is green, and a walk of every staff screen finds no primary label made of an ID, enum, JSON, key or bare number.

### RC-5 · Operator, integration and unruled screens sit inside the teacher's Studio

The question is not "how to explain the screen" but "should this person see it at all".

- **Evidence (CONFIRMED, code):** Studio's tab bar is a fixed list of nine tabs, shown unfiltered to everyone Studio admits (studio/layout.tsx:45-55). Educators hold CAN_DRAFT, so teachers see all of these:
  - Aturan Penilaian: no J-row in the scope inventory, and nothing to do next.
  - Pustaka PINTAR's grant/withdraw form: an operator act, needing IDs nobody can see.
  - The «Untuk sistem lain: paket JSON» disclosure on Buat Paket, ungated: D-007 says "for machine producers". On staging it is in fact used by the platform's import script (audit/import-staging.mjs).
  - Bank Soal built as the Question Health screen. Its actions appear only after 30 answers per question (CR-36), so on staging there is nothing to do.
  - Tinjauan Integritas, with no person, class, assessment or state (CR-75, CR-77).
- **Affected:** DG-33 and DG-35, the integrity and assessment-rules parts of DG-27–34, and the "What am I supposed to do here?" moments (§G of the brief, item 12).
- **Purpose audit:**

| Screen | Intended user (source) | Its question | Its task | Natural next action | Does the screen say so? |
|---|---|---|---|---|---|
| Teacher landing `/mengajar` | Guru (J5.1) | «What is most worth doing first?» (mengajar/page.tsx:20-25) | Prepare published material for a class | «Siapkan … untuk [kelas]» | **Yes, when reached.** A platform admin never reaches it: RC-1 sends her to Konfigurasi |
| Bank Soal | Studio roles; reviewers (QN5, J4.8–4.9) | Browse, filter and review the school's questions, with key and reason | Review a question; correct it through the workbook | Open a question; correct it through Buat Paket | **No.** No filter, newest 40, no key or reason (CR-52, S23q red) |
| Tinjauan Integritas | Kepala departemen, Admin sekolah, Admin platform (J7.6) | Whose sitting showed what, for a human to weigh | Record what the reviewer did; refer onward | Talk with the learner, or refer to Pimpinan | **No.** No learner, class, assessment or state (CR-75, CR-77) |
| Aturan Penilaian | CAN_DRAFT holders (code comment only) | **None found in canonical documents** | Configure a definition within the bounds | **None found** | **No** |
| Pustaka PINTAR (school view) | Studio roles (D-120 Q7, J1.5) | What PINTAR has opened to my school | Preview, then make it available via Siapkan | «Lihat seperti siswa» | **Yes** |
| Pustaka PINTAR (grant form) | Admin platform (ADR-0015) | Which school receives which release | Grant or withdraw | — | **No.** It needs IDs nobody can see, and every school admin is shown it |

- **Severity:** S3. The JSON path being open to teachers is a design-intent question, not a leak: the person is entitled to CAN_DRAFT.
- **Pre-Gladys:** yes.
- **Claude, later:**
  - Gate the operator and integration surfaces to the roles a ruling names.
  - Build Bank Soal's ruled browse/review (CR-52, already A, S7).
  - The integrity review's names, state and outcome route (CR-75, CR-77).
- **Daisy, later:** Studio's information architecture by role, in S7.
- **Owner ruling required: YES.**
  - Q7: Who may use the JSON import?
  - Q8: Who is Aturan Penilaian for, and is it in 4.0?
  - Whether the grant form belongs in Studio at all.
- **Acceptance:** each Studio tab is shown only to the roles a ruling lists, and each tab's screen states its question and offers its next action (the doctrine: "Every screen answers one question and naturally offers the next question").

### RC-6 · Collection and content components

These are the same five weaknesses on many screens.

- **Evidence (CONFIRMED, code):**
  1. **Unbounded lists, with an edit form on every row:**
     - Aturan Penilaian, no limit, and a «Simpan» per row that inserts a version;
     - Konfigurasi enrolments, no limit;
     - Jejak audit, newest 50 unsearchable.
  2. **Question review is unstyled.** «Soal dalam paket ini» uses classes that have no CSS rule (`pin-soal`, `pin-opsi`, `pin-soal-pelajaran`). Question, options, key and reasons run together. **The data is already structured** (soal-tinjauan.ts:21-99): role, stimulus, stem, options with a correct flag and a reason. Misconception codes are stored but not fetched.
  3. **Lesson preview vs player:**
     - The content has structure: on average about 4 `## ` sections per lesson, lists, tables and diagram directives.
     - The learner player pages it by `## `, draws diagrams and steps through worked examples.
     - The Studio preview flattens all of this into one card (FD-6).
     - The workbook has one free-text cell for the lesson. `worked_examples` cannot be reached from a workbook or package, and «Cara mengisi» gives no formatting guidance.
  4. **No example workbook.** Complete examples exist in the repository (selftest/fixtures/bob02/contoh-pelajaran.xlsx; docs/onboarding/konten/*.xlsx), but none is offered for download. A **separate** example file, or an unread «Contoh» sheet, would not affect import. Example rows inside the data sheets would be imported.
  5. **A native file input** with formats not stated (section 11, earlier).
- **Affected:** DG-25, DG-26, DG-30 (the UX half), DG-33 (the UX half), DG-36, and the earlier Jejak audit, upload-control and "accepted formats" items.
- **Severity:** S3; FD-6 is S2.
- **Pre-Gladys:** yes for DG-25, DG-26 and DG-30/33's UX, which she will see again. DG-36 per ruling Q9.
- **Claude, later:**
  - The preview renders through the learner player's own components (one renderer, two places).
  - Bounded, paged lists.
  - The review list fetches what is already stored.
  - The example as a separate download.
- **Daisy, later:** the components Collection (Table + Pagination + Search, with an explicit edit action), Question review (stem / options / key / reason / misconception) and File field (her GQ4). Lesson typography is already in her grammar.
- **Owner ruling required:**
  - **NO** for the components.
  - **YES** for Q9: which chapter ships as the example, and that it is a separate file.
- **Acceptance:**
  - No staff list renders more than one page of rows, or an edit form per row.
  - The preview and the player render one lesson to the same structure: the same pages, diagrams and worked examples. Prove it with a test that compares their outputs.
  - The example downloads and imports cleanly.

### RC-7 · Secret fields are not one component (DG-37)

**Evidence (CONFIRMED, code), every secret-entry field in `src/`:**

| Flow | Field(s) | Masked by default | Reveal |
|---|---|---|---|
| Sign-in (LayarMasuk.tsx:420) | password | yes | **its own** eye |
| Sign-in, class card (LayarMasuk.tsx:307) | card PIN | yes | **its own** eye |
| Activation (Langkah.tsx:134, 147) | password + «ulang» | yes | **one eye inside the first box toggles both.** The confirmation has no control of its own, and «nothing re-masks it» (code comment, :138) |
| Activation (Langkah.tsx:171, 184) | PIN + «ulang» | yes | **the same shared toggle** |
| Forgotten password, new password (LupaPassword.tsx:203, reuses LangkahPassword) | password + «ulang» | yes | **the same shared toggle** |
| Forgotten password, PIN path (LupaPassword.tsx:272) | PIN | yes | **none** |
| Akun saya, new PIN (PinBaru.tsx:62, 66) | PIN + «ulang» | yes | **none** |
| Lock screen (LayarTerkunci.tsx:112) | PIN | yes | **none** |
| Activation / recovery codes (MintaKode.tsx:151; LupaPassword.tsx:224) | emailed one-time code | **no** (plain text, `one-time-code`) | — |

- **What she saw, explained:** the only code path to "the second box visibly exposed, with no control on it" is pressing the eye in the **first** box, which unmasks both. The confirmation box then shows the secret with no control and no sign of why. **INFERRED:** this is the only path consistent with the code, because both boxes start masked.
- **Is it systemic? Yes.** Nine secret fields behave in four different ways:
  - a reveal on the field itself;
  - one shared reveal placed in another field;
  - no reveal at all;
  - visible by design (the one-time codes).
- **Is there a transmission or storage issue?** No evidence of one. Activation posts from script; no secret travels in a URL.
- **Canonical expected:**
  - J2.9 / D-099: the shared computer is the normal case.
  - Daisy's Identity screens rule; there is no component rule for secret fields.
- **Severity:** S1 (privacy UX). Not a vulnerability.
- **Pre-Gladys:** **yes.**
- **Claude, later:** one secret-field component used by all nine fields:
  - masked by default;
  - a reveal per field, or none, consistently;
  - an accessible label and `aria-pressed`;
  - re-masked on submit and on error.
  - A static test that every `password`, PIN or recovery input in `src/` uses it.
- **Daisy, later:** the Secret field in the design system: its states, label and placement.
- **Owner ruling required: YES.**
  - Q6: adopt the credential-field invariant.
  - Q10: are emailed one-time codes secrets, to be masked, or visible by convention? They are short-lived, and showing them is common practice.
- **Acceptance:** the static test is green over every secret input. A walk of activation, reset, Akun saya, lock and sign-in shows each secret masked by default, each revealable field with its own control, and nothing revealed after submit.

### RC-8 · Back after sign-out is unproven (BD-11)

- **Evidence:**
  - CONFIRMED (code and staging log): server-side sign-out works, as in §A.
  - CONFIRMED (code): a page restored from the back-forward cache reloads only on SHARED or CARD devices (PenjagaSesi.tsx:41-42, 103-104).
  - CONFIRMED (code): after sign-out, Back to a protected page that reaches the server is redirected to `/masuk?lanjut=<that page>`. The next sign-in, through **any** door, then lands on the previous person's page path. Their own authorization still applies.
  - CONFIRMED (catalogue): BD-11 is "UNPROVEN": browser Back after «Keluar» has never been run.
- **Affected:** DG-19, the security half.
- **Current behaviour:** correct on the server. In the browser it depends on the browser and on the device mode.
- **Canonical expected:** J2.9, P0: «the next person never continues as the last».
- **Severity:** S1 until proven. It may prove to be nothing.
- **Pre-Gladys:** yes, as a **proof**: a real-browser walk of BD-11 on Chrome, Edge and Safari, on shared and personal devices.
- **Claude, later:** the BD-11 walk. If it fails: reload on restore whenever someone is signed in, whatever the mode, and/or `Clear-Site-Data` on `/keluar`. Drop the stale `lanjut` after a sign-out.
- **Daisy, later:** none.
- **Owner ruling required: NO.** BD-11 and J2.9 already require it.
- **Acceptance:**
  - BD-11 passes in each named browser and mode: after «Keluar», Back shows no protected content and no protected action works.
  - After a different person signs in, Back shows only what that person may see.

### Standalone · FD-5, difficulty inverted between the workbook and the database

- **Evidence (CONFIRMED):**
  - The workbook stores Mudah 0.3, Sedang 0.5, Sulit 0.7 (unggah-kontrak.ts:44).
  - `difficulty_band` reads p ≥ 0.7 as MUDAH and p ≤ 0.4 as SULIT (20260913090000:305-310).
  - The band is shown to teachers (20261104100000:175 → uji-cepat/page.tsx:323) and used for the difficulty mix of a drawn paper (assemble_session, 20260916100000:253).
  - Imported pre-tests and post-tests carry an empty mix, so their papers are unaffected. Only the Studio launcher's random draw ({SEDANG, MUDAH}) and the teacher's labels are affected.
  - SD5 Bab 1 has 15 questions at 0.3 and 2 at 0.7.
- **Severity:** S2: wrong information to teachers, and a composition skew in Studio's random draw. No stored result is altered.
- **Pre-Gladys:** yes. She is an expert educator, and she would notice «Sulit» on an easy question.
- **Claude, later:**
  - One convention, with the workbook mapping corrected to it.
  - Existing items corrected through a governed path; they may be sealed content, which needs care.
  - A test that a «Mudah» question shows as «Mudah».
- **Owner ruling required: NO** for the fix: the database's convention is explicit. **Owner informed** because sealed content is touched.
- **Acceptance:** an author's word round-trips to the same word on every teacher screen, and a drawn mix uses the author's meaning.

---

## C. DG crosswalk

The brief groups DG-27, DG-28, DG-29, DG-32 and DG-34 without saying which example each number is. Only DG-32 (Tinjauan Integritas) is certain. The others share one row until Yazid confirms the numbering.

| DG | Observation | Confirmed? | Root cause | Existing CR/Daisy overlap | Sev. | Before formal walk? | Impl. | Design | Ruling |
|---|---|---|---|---|---|---|---|---|---|
| 19 | After sign-out → learner sign-in → Back, the Pengelola page showed | Yes: the same person, legitimately re-authorized. BD-11 unproven | RC-1 (visible part), RC-8 (security part) | BD-11, J2.9; no CR row | S1 until BD-11 is proven; S3 | Yes | Proof; maybe a small fix | No | RC-1: yes. RC-8: no |
| 20 | «Akun saya» swaps the learner bar for the admin navigation | Yes | RC-1 | CR-57 item 1/3 (partly), CR-54 S2, D-069(h) | S3 | Yes | Yes | Yes | Yes |
| 21 | «Saya mengajar» lands on Konfigurasi | Yes: `?peran` is dropped; landing by highest role | RC-1 | D-010, CR-54 S2, Daisy Q1/Q11 | S3 | Yes | Yes | Yes | Yes |
| 22 | The two staff doors look and act the same | Yes: identical for everyone | RC-1 | as DG-21 | S3 | Yes | Yes | Yes | Yes |
| 23 | QH0ZS3 on «Luncurkan Uji Cepat» | Yes: INV-13, class and chapter from different schools; preventable before the button | RC-2, RC-3 | D-085 T2; no CR row | S2 | Yes | Yes | Copy | Yes (Q4) |
| 24 | 5 minutes became 15 | Yes: the form's default after the refusal reload; nothing saved; 5 minutes is valid (bounds 5–60) | RC-3 | BOB-34 (met on the class page only) | S2 | Yes | Yes | No | With Q4 |
| 25 | «Soal dalam paket ini» is a wall of text | Yes: unstyled; the data is structured | RC-6 | CR-52 (where key and reason are), CR-50/82 (misconceptions not shown) | S3 | Yes | Small | Yes | No |
| 26 | «Lihat seperti siswa» is dense prose | Yes: the preview flattens the structure the player renders. Also a schema limit | RC-6, FD-6 | UX-18, JQ6; no CR row | S2/S3 | Yes | Yes | Yes | No |
| 27/28/29/34 | Aturan Penilaian codes and JSON; Pustaka PINTAR ID fragments; «id sekolah» and «id izin»; Jejak audit codes; metric keys | Yes, each (§E) | RC-4; RC-5 (whose screen) | UX-42, CR-79 (W-6), CR-06, CR-49; no CR row for Aturan Penilaian or the grant form | S3 | Yes, for screens she meets | Yes | Yes | Yes (Q5, Q8) |
| 30 | A long page of identical «Cek penguasaan …» rows, each with «Simpan» | Yes: 25 genuinely different rows (5 real schools, plus 20 import copies in one synthetic school); the distinction is not shown; no limit; a form per row; Simpan inserts a version | RC-2, RC-4, RC-6; staging data | CR-49, CR-54 S7; no CR row | S3 | Yes | Yes | Yes | Q8 |
| 31 | KFRLGH saving the certificate layout | Yes: INV-13, a course of another school; the school defaults to the library; CLASSIC raw | RC-2, RC-3 | CR-06, CR-03 (frozen design) | S2 | Yes | Yes (removing the picker per CR-06) | No | No (CR-06 already ruled) |
| 32 | Tinjauan Integritas: «4d2050fd · 1»; "what should a teacher do?" | Yes: the 8 characters are a sitting's ID; «· 1» is the count of observations; name, class and assessment exist but are not fetched; reviewed items never leave; evidence is thin | RC-4, RC-5, RC-2 | CR-75 (W-1), CR-76, CR-77 | S2 | Yes | Yes | Yes (Daisy says the grammar has it) | No (CR-75 ruled) |
| 33 | Bank Soal: why, what to do, everything on one page | Yes: built as Question Health; newest 40; no filter, key or reason; «0.3/0.5» is the author's difficulty, raw and inverted | RC-5, RC-6, RC-4, FD-5 | CR-52 (A, S7), CR-36 | S3 | Yes | Yes | Yes | No (QN5/D-123(1) ruled) |
| 35 | JSON fields on Buat Paket | Yes: a machine-import path (D-007) in a closed disclosure, open to any CAN_DRAFT holder | RC-5, RC-4 | D-007, UX-12; no CR row | S3 | Yes | Yes (gate) | Small | Yes (Q7) |
| 36 | A teacher needs an example workbook | Yes: none offered; examples exist in the repository; a separate file is safe | RC-6 | CR-50 (the template's missing «Miskonsepsi» sheet) | S3 | Per Q9 | Small | No | Yes (Q9) |
| 37 | The confirmation secret was visible | Yes: the shared toggle; systemic across 9 fields | RC-7 | none (CR-26 is adjacent) | S1 privacy | **Yes** | Yes | Yes | Yes (Q6, Q10) |
| — | (side finding) Mudah ↔ Sulit inverted | Yes | FD-5 | none | S2 | Yes | Yes | No | No (informed) |

---

## D. Functional failure trace

### D1 · QH0ZS3, «Luncurkan Uji Cepat»

1. **The screen:** Studio → Uji Cepat (`/studio/kuis`), not the class page.
   - **Kelas:** every active class or cohort in every school where she holds CAN_QUICK_ASSESSMENT. As platform admin, that is every school.
   - **Bab:** every module of every course she can read, plus library modules (kuis/page.tsx:35-73). The chapter list is not filtered by the chosen class's school.
   - «Jumlah soal», defaulting to 5, and «Lama pengerjaan (menit)», defaulting to 15: free numbers (:137-143).
2. **The action:** `launchQuickAssessmentAction` (studio/actions.ts:501-513) calls `launch_quick_assessment(p_node, p_module, p_item_count, p_minutes)`.
3. **The database (staging log, 04:52:00.729Z):** `that module belongs to another institution (INV-13)`. PostgREST answered 400 (edge log 04:52:00.742Z). Nothing was written; the function is one transaction.
4. **The answer:** Studio's `ditolak()` maps it with the generic `kodeGalat`, so it becomes ACTION_FAILED with a random reference. The banner shows «Belum tersimpan. Ada kendala di PINTAR …», reference QH0ZS3. The cause went only to the app's server log.
5. **Answers to the brief's questions:**
   - **An unexpected runtime failure?** No: a correct refusal of an impossible combination.
   - **Knowable before the button?** Yes. The page knows each class's school and each chapter's school.
   - **Class eligible?** Yes, on its own.
   - **Chapter eligible?** Not for that class's school.
   - **Enough questions?** Not reached; the INV-13 check runs first.
   - **Permission or context?** Context. She holds the permission in both schools.
   - **Staging data?** It amplified the problem: 8 schools, several with a «Kelas 5» and an identical «Matematika Kelas 5 — Bab 1».
   - **The missing preflight:** chapters offered only from the chosen class's school, plus the library distributed to it. The refusal named (as the class page already does).

### D2 · 5 minutes → 15 minutes

1. Studio's field is `<input name="menit" type="number" defaultValue={15}>` (kuis/page.tsx:142). She typed 5.
2. On refusal, `back()` redirects to `/studio/kuis?hasil=…&kode=…&ref=…`. The form re-renders with `defaultValue`: 5 questions (the default) and **15** minutes. Nothing was stored, so no database value exists.
3. **On a successful launch,** the typed value goes straight through as `p_minutes` (actions.ts:505, 510). The database accepts 5–60 (20261020100000). **A success cannot silently store 15 in place of 5.**
4. **The real risk:** pressing «Luncurkan» again after a refusal sends the default 15 that is now on screen.
5. **The class page** offers only 10, 15 or 30 and keeps the choice across a refusal (uji-cepat/page.tsx:176-178, BOB-34). An address carrying another value silently becomes 15 (:178). That is unreachable from its own form, but it is the same silent-default pattern.
6. **«Penilaian cepat: 3–20 · 300s · 1×»** (Aturan Penilaian, definisi/page.tsx:47-51) means:
   - 3–20 questions;
   - at most **300 s of late-sync grace** (answers synced up to that long after the deadline still count). **This is not a duration.**
   - at most 1 attempt.
   
   Her 5-minute choice was **valid**. Showing «300s» beside a minutes field invites exactly the reading the brief makes.

### D3 · KFRLGH, certificate layout «Simpan»

1. **The screen:** Studio → Sertifikat (`/studio/sertifikat`).
   - **Sekolah:** the schools where she holds CAN_PUBLISH, sorted by name. «PINTAR Kurikulum Nasional», the national library, sorts first and is the default (sertifikat/page.tsx:42; _lib.ts:62).
   - **Paket Pembelajaran:** «—» plus **every course she can read on the platform**, not filtered by the chosen school (:27, 48-50).
   - **Tata letak:** CLASSIC, MODERN or MINIMAL, the raw values (:55-56).
2. **The action:** `saveCertificateTemplateAction` calls `save_certificate_template(p_institution, p_course, p_module, p_layout)`.
3. **The database (staging log, 05:03:38.615Z):** `that course belongs to another institution (INV-13)`. The edge log shows one call only, at 05:03:38.637Z, answered 400.
4. **What this proves:** the request carried a course. With «—» it would have sent none, and this refusal cannot occur.
   - **INFERRED:** the school was the default, the library, and the course chosen belonged to another school.
   - «Paket Pembelajaran: —» as observed matches the form **after** the refusal, which reloads with its defaults (the same mechanism as D2). UNVERIFIED: Yazid's recollection or a screenshot would settle it.
5. **Answers to the brief's questions:**
   - **Was Paket Pembelajaran required?** No: it is optional, and «—» means a school-wide layout.
   - **Permission or context?** Context, as in D1.
   - **Synthetic data?** It added to the list.
   - **A backend defect?** No: the database was right.
   - **Shared root cause with QH0ZS3?** **Yes:** RC-2 and RC-3.
   - **Is CLASSIC raw?** Yes. The picker should not exist: the certificate is the frozen design, CR-06 and D-080.

### D4 · Sign out → «Saya mau belajar» → sign in → Back → Pengelola

1. **«Keluar»** posts a form to `/keluar`, a whole-document navigation (BarisSesi.tsx:62). The handler, in order:
   - `exit_persona`: staging logs a 400 "there is no evaluation session to leave" at every sign-out. A harmless no-op, but noise.
   - `sesi_akhiri_saya`: PINTAR's session record ends with reason KELUAR, and the Auth session row is deleted.
   - `signOut({scope:"local"})`: Auth answers 403, because the session is already gone. The cookies are cleared.
   - A 303 to `/`.
   
   **The old session is invalid on the server.** F01-R05 proves that replaying its cookie is refused.
2. **«Saya mau belajar»** is a link to `/belajar`. The proxy sends a signed-out visitor to `/masuk?lanjut=/belajar`. Password sign-in ends with `window.location.assign` to `/belajar`. **The same person** now has a new, valid session. **No context is recorded anywhere.**
3. **Back** walks the browser history to the Pengelola page, a different document.
   - **If the browser re-requests it:** the proxy sees a valid session, and the page's own gate (`is_system_admin`, konfigurasi/page.tsx:96-102) passes. **It is legitimately rendered for her.** This is what she saw, the brief's case "after logout → different role login → Back".
   - **If it is restored from the back-forward cache instead:** it shows the session-1 snapshot. Any action is then served with session 2's authority, which is the same person and the same rights.
4. **Answers to the brief's questions:**
   - **BFCache only?** Either path ends the same way for the same person.
   - **Protected data available?** Yes, to her: she is entitled to it.
   - **Could a server or API request be made from the restored page?** Yes, as session 2, the same person.
   - **Did the learner sign-in re-authorize admin routes?** Yes. Authorization is the person's entitlement; the door is not recorded.
   - **Was the old session invalidated?** Yes.
   - **Does logout end the session correctly?** Yes.
   - **Cache-control?** `private, no-cache, no-store, max-age=0, must-revalidate` on every page (CONFIRMED locally). The proxy and `/keluar` send no `Clear-Site-Data`.
   - **Authorization based on entitlement rather than context?** Yes.
   - **Is an active context represented?** No.
   - **Does educator-as-learner contribute?** Yes. An admin who learns gets the plain learner bar with no way back (pembelajaran.ts:35-40). The teacher's «Pembelajaran Saya» exists for EDUCATOR-only people.
5. **The untested cases:**
   - **Back after sign-out with no new sign-in:**
     - a re-request is redirected to sign-in, and the stale page path is kept as `lanjut`;
     - a back-forward-cache restore depends on the browser.
   - **A different person signing in, then Back:** a re-request shows only what *that* person may see; a cache restore is the BD-11 risk.
   
   **Both are UNPROVEN (BD-11).**

---

## E. Human interface leakage inventory

Every item below is CONFIRMED in the code. Where it appears is given as file:line.

| # | Value | Where | Underlying field | Meaning | Human label exists? | Who sees it |
|---|---|---|---|---|---|---|
| 1 | PRACTICE / TEST / EXAM | Aturan Penilaian (studio/definisi/page.tsx:77-79) | `bank_type` | The bank a rule draws from | **Yes**, `jenis.bank.*` (used on Bank Soal) | CAN_DRAFT, teachers included |
| 2 | NONE / ITEMS / ITEMS_AND_OPTIONS | definisi:85-87 | `shuffle_policy` | What is shuffled | No | Same |
| 3 | `{"MUDAH":3,"SEDANG":2}` (typed JSON) | definisi:93 | `difficulty_mix` | Questions per difficulty band | No | Same |
| 4 | `{"mastery_min":0.6}` (typed JSON) | definisi:94 | `passing_rules` | The pass mark as a proportion | No | Same |
| 5 | «3–20 · 300s · 1×», «3–60 · 900s · 5×» | definisi:47-51 | `assessment_definition_bounds` | Questions · maximum late-sync grace · maximum attempts | The mode name only, itself a *Replace* term | Same |
| 6 | Inputs labelled by placeholder only (jendela ragu, tenggang kirim, luring …) | definisi:80-91 | Definition columns | — | Not in hle.ts (D-014) | Same |
| 7 | «Penilaian awal / akhir / cepat» | Mode labels across Studio (hle.ts:1990-1991) | `mode` | *Replace* terms; v1 says Pemetaan Awal / Uji Penguasaan / Uji Cepat | Yes (Terminology v1) | Studio |
| 8 | **«4d2050fd · 1»** | Tinjauan Integritas (integritas/page.tsx:56) | `integrity_signals.session_id`, first 8 characters; the count | One learner's sitting of one assessment; the number of observations | Name, class and assessment are available but not fetched (:27) | Kepala departemen, Admin sekolah, Admin platform |
| 9 | **9571fe7b, 408bfd3f …** | Pustaka PINTAR grant form (studio/kanonik/page.tsx:88-92) | `plp_releases.id`, first 8 characters | A published release | `version_label` and the course title are selected but unused | Platform admin, and every CAN_PUBLISH school admin |
| 10 | «id sekolah» (full UUID) | kanonik:95 | `institutions.id` | The receiving school | School names exist | Same |
| 11 | «id izin» | kanonik:100 | `release_distributions.id` | The grant to withdraw | **No screen or read returns it** | Same |
| 12 | Jejak audit: action codes, `target_table · 8 characters`, build | Konfigurasi (konfigurasi/page.tsx:1117-1119) | `audit_log.action`, `target_table`, `target_id`, `build_sha` | What happened and to what. 112 distinct codes in three naming styles. The actor is not shown | Column headers only | Admin sekolah (own school), Admin platform |
| 13 | Metric keys, visualization ids | Konfigurasi report templates (:1147-1190) | `metric_id`, `visualization`, `standard_report` | Report contents | **Yes**: `label_key` is fetched but unused; `metrik.*.label` exists | Admins |
| 14 | «Kode sekolah tujuan» that requires UUIDs | Konfigurasi transfer (:1015-1017) | School, period, programme ids | — | Names exist | Admins (CR-41/W-7) |
| 15 | 8-character ID when a name lookup fails | Konfigurasi (:208-209, 979-980, 1010, 1032-1033); Studio home (studio/page.tsx:32, 52) | Person, school and node ids | Fallback, **triggered at platform scale** (FD-4) | Names exist | Admins |
| 16 | «Perkiraan penyusun: 0.3 / 0.5» | Bank Soal (bank/page.tsx:93) | `predicted_difficulty` | The author's word as a number, **with the scale reversed** (FD-5) | The author's word (Mudah / Sedang / Sulit) | Studio |
| 17 | «Dari pengerjaan siswa: x · n» | bank:97 | `empirical_difficulty`, evidence count | The measured p-value · the number of answers | No | Studio |
| 18 | CLASSIC / MODERN / MINIMAL | Certificate layout (sertifikat/page.tsx:56) | `layout` | — (the picker should not exist) | — | CAN_PUBLISH |
| 19 | Raw JSON text areas and the «Sistem pengirim», «Kontrak kemampuan», «Nomor permintaan» fields | Buat Paket (studio/unggah/page.tsx:115-151) | The package JSON and its free-text metadata | The machine import path | — | Any CAN_DRAFT holder |
| 20 | `JSON.stringify(q)` | unggah:163 | `ingest_batches.open_questions` | Whether it is reachable today is UNVERIFIED | — | Studio |
| 21 | `[[visual:…]]` printed as text | Lesson preview (studio/pratinjau/[pelajaran]/page.tsx) | A diagram directive in `body_markdown` | The player draws it; the preview does not | — | Studio |
| 22 | Build SHA (7 characters) | Konfigurasi issue triage (:657) | `build_sha` | Technical detail | — | Admin platform. **Legitimately subordinate**: keep it |

Kept on purpose, and consistent with the invariant's exception: the reference code on a failure (D-011), the PINTAR ID as a secondary identifier, and the build SHA in the operator's triage.

---

## F. What not to fix individually

1. **Do not add "explanation text" to Aturan Penilaian, the grant form, Bank Soal or Tinjauan Integritas.** First decide who sees each screen (RC-5, Q7, Q8). Several should not be in a teacher's Studio at all.
2. **Do not rename IDs screen by screen.** Extend the guard (RC-4) and fix through the shared components: the identifier pattern, `enumLabel`, the name-lookup helper. Otherwise the next screen regresses.
3. **Do not patch QH0ZS3 and KFRLGH separately.** One scope rule (RC-2) and one form contract (RC-3: named refusals, kept values, bound choices) fix both, and the forms nobody has opened yet.
4. **Do not fix the second password box on Aktivasi alone.** One Secret field component, and a test over all nine fields (RC-7).
5. **Do not paginate Aturan Penilaian alone.** The rows multiply by design (each import, each Simpan). The ruling is what the page is for; the collection pattern is shared (RC-6).
6. **Do not restyle «Soal dalam paket ini» and the lesson preview by hand.** The preview should render through the learner player's components. The question review is one component, also needed by CR-52's Bank Soal.
7. **Do not add a role switcher before the context ruling (RC-1).** The doors, `/akun`, `/` and the landing are one decision.
8. **Do not fix the difficulty labels in the UI.** Fix the convention at import and correct the data (FD-5). Otherwise Studio's random draw stays wrong.
9. **Do not treat DG-19 as a security bug, and do not dismiss it either.** It is context (RC-1) plus a proof owed (RC-8, BD-11).

---

## G. Recommended order after the owner lifts D-126

This is investigation advice only. The order differs from the suggested one in two places, with the reasons given.

1. **Rulings first:**
   - **Q3: Dr Gladys's walkthrough role(s).** It decides how much of RC-2 is pre-Gladys.
   - Q1/Q2: context and doors; school scope.
   - Q4: one Uji Cepat launcher.
   - Q5/Q6: the two invariants.
   - Q7/Q8: the JSON import and Aturan Penilaian.
   - Q9/Q10: the example workbook; one-time codes.
   - Q11: the platform admin's powers in schools.
2. **Security and privacy correctness:**
   - RC-7, secret fields;
   - RC-8, the BD-11 proof and whatever it finds.
   
   Both are small, and both are proof-first.
3. **Functional correctness and data:**
   - FD-5, difficulty inversion: data correctness, and it reaches teachers.
   - RC-3: named refusals, kept values, one launcher.
   - FD-4: names at scale.
   - FD-7, FD-8, FD-9.
4. **Context and scope:** RC-1 + RC-2 together. They share one construct, if ruled, and one set of journeys.
5. **The human interface boundary:** the RC-4 guard first, red then green; then the fixes, through components.
6. **Purpose and information architecture:** RC-5, Studio by role. Then CR-52, CR-75 and CR-77 inside S7 as already ruled.
7. **Shared collection and content components:** RC-6; the preview equal to the player.
8. **Visual polish:** the remaining Studio pages on the newer grammar (12 Studio pages still use the older utility styling: the "look and feel changes" between areas).

**Why it differs from the suggested order:**
- Rulings come first because four clusters cannot start without them, and Q3 changes their scope.
- FD-5 sits in step 3 with the functional failures, because it gives teachers wrong information silently.

**Placement in the current plan:**
- These items join the closure register as new rows. **None exists today** for:
  - RC-3's launcher;
  - FD-4, FD-5, FD-6, FD-7, FD-8 and FD-9;
  - RC-7;
  - BD-11;
  - the Aturan Penilaian page;
  - DG-36.
- Daisy's batch 4 grammar gains three components: the Secret field, Collection with explicit edit, and Question review. It also gains a context/school chooser in the shell, if ruled. **This touches APPLICATION READY:** better to rule these before she freezes than after.

---

## H. Pause confirmation

| | |
|---|---|
| Files modified | **NONE in the repository.** The tree is clean at `41a89fa`. This report and the investigators' scratch notes are in the session scratchpad, outside the repository |
| Database modified | **NONE.** Staging was **read only**: its request and database logs for the session window, and 5 aggregate SELECTs (counts, titles, column names). No personal data was read. One log query was refused by the privacy safeguard and was not pursued another way |
| Staging modified | **NONE** |
| Migrations | **NONE** |
| Commits | **NONE** since this investigation began. The last commit is D-126 itself, before the brief |
| CI runs | **NONE** |
| Daisy work triggered | **NONE** |
| Local test stack | Docker restarted; the local app started for header checks (anonymous GETs only, no sign-in) and then stopped. Nothing was written |

## Questions for Yazid (rulings this report needs)

| | Question |
|---|---|
| Q1 | What does each sign-in door mean? Does a chosen door hold as the working context until the person changes it? One staff door or two? |
| Q2 | Should a person with several schools (the platform admin) work in one chosen school at a time? |
| Q3 | Which role(s) should Dr Gladys's account hold for the formal walkthrough: Admin platform, or the school roles the Golden School walk was built for? |
| Q4 | Does Studio's `/studio/kuis` launcher stay in 4.0, given D-085 T2 (choose → select → review → launch)? |
| Q5 | Adopt the Human Interface Boundary as a closure invariant (§B RC-4)? |
| Q6 | Adopt the credential-field invariant: masked by default; reveal deliberate, per field, consistent? |
| Q7 | Who may use the JSON package import: the platform admin only, or a named capability? |
| Q8 | Who is Aturan Penilaian for, and is it in 4.0 at all? |
| Q9 | Ship an example workbook as a separate download? Which chapter? |
| Q10 | Emailed one-time codes: masked, or visible by convention? |
| Q11 | Is the platform admin meant to author, launch Uji Cepat and publish inside any school? |
| — | DG numbering: which of DG-27, DG-28, DG-29 and DG-34 is which example? |
