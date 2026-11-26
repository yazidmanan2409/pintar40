# Audit 79 · W6 · the AR-79 correction plan (Bob, 25 Nov 2026)

**Status: FIT TO PROCEED (Sharon, 25 Nov 01:06Z, on the amendments at `88ee3db8`: A1, A2, B1–B9, C and D carried; records-govern line in place). AMENDED after both pre-reviews.** Each batch still needs the owner's request, and Sharon's pre-build review where it touches a DB rule, an RPC contract or a boundary. Daisy's (`roadmap/TINJAUAN-AR79-PLAN.md`, `2f5a6ac8`): the shape is right; L-80 withdrawn; eleven findings moved to the batch whose authority covers them; her optional moves taken (L-84 and L-91 to AR-F; L-119 joins L-47 and L-118 under one «how this sitting ends» read in AR-C); her AR-G word list (§2 of her file) is the binding text for every word. Sharon's (`docs/coordination/reviews/sharon/AR79-PLAN-PREREVIEW-627fdaee.md` (`41ba600e`): FIT TO PROCEED after amendment; A1, A2 and B1–B9 carried below, her record is the binding text). Nothing in it is built.
- **Each batch's verification is held to the full text of Sharon's records**, cited per row; where this plan and a record differ, the record governs.
- Input: W3 FINAL, `AUDIT-79-COMMON-CAUSES.md` (`2385c40a`), the twelve causes C-1 to C-12 and the five principles.
- Ledger: `AUDIT-79-LEDGER.md`, L-1 to L-160, with W2's severities.
- **Completeness (checked by script, 25 Nov 01:00Z):** every finding L-1 to L-160 is placed exactly once: in a batch (§2), in §1 (done or in flight) or in §3 (not built, with the reason). None is missing and none is placed twice.
- Authority: ruling 99, which governs the audit. It does **not** authorise a build, a merge, a staging promotion or a production change; each needs the owner's own request and ruling, as for CI-1 and CI-2. Audit 79 Part II and 4.5 are not started.

## 0 · The shape in one paragraph

Every cause gets **one existing authority in the shared layer**, and every screen that shows that fact reads it. No new layer or framework (ruling 95). The batches are ordered by severity:
- **certificates first** (the Critical L-67 and the High L-105 are already in CI-1 and CI-1b);
- **then the confidentiality boundaries** (Sharon's bindings);
- then the result in force and retakes;
- then «waiting for you»;
- then the «may do / why not» reads;
- then forms, words, layout and accessibility.

Each batch carries:
- its dependent-screens list (L-8 applied to screens: «dependent screens: N found, N updated»);
- one cross-surface journey assertion per cause it fixes;
- red-first tests, a plant per database rule, and a static guard wherever a rule could be bypassed by a sibling route.

## 0a · Approved refinements riding inside the batches (owner, 26 Nov)

Daisy's design reflection, `docs/coordination/ux/roadmap/REFLEKSI-DESAIN-2026-11.md` (`bdb51ee0`, on `ux-1/daisy-experience`), is the binding text.

**The owner's conditions:**
- refinements to existing functionality only: no new batch, workstream or capability;
- no unnecessary architectural change;
- educational meaning and every necessary explanation preserved;
- each affected shared component verified on every consuming screen, at 1280, 390 and 320;
- no completed batch reopened for them;
- **any refinement that proves substantially larger than anticipated is deferred until after 4.1, and recorded as such.**

| | Refinement | Rides with | Shared component and its consumers |
|---|---|---|---|
| R-1 | Belajar: the chapter already shown in «Langkah berikutnya» keeps only its title and one status line in «Pembelajaran Anda», with no second step line or button (optionally «di atas») | **AR-C**: the home's step derivation already changes there, so the home changes once | the chapter card on Belajar |
| R-2 | Mengajar: each running assessment listed once; the date labelled, with «ditutup» | **AR-D** (composed with L-45's «waiting for you», not before it) | the class card on `/mengajar` and `/mengajar/[kelas]` |
| R-3 | /pimpinan: empty sections stop carrying their full method text; no figure, threshold or withheld reason moves | **AR-G** (with L-97, L-98, L-138) | the blocks shared by `/pimpinan` and `/dekan/ringkasan` |
| 320 | the learner's bar takes about a third of the screen at 320 | **AR-H** (within L-53 and K-4) | the learner chrome: AR-H's 320 capture checks the learner bar specifically |

## 1 · What is already done or in flight (not part of AR-79's build)

| Finding | Where | State |
|---|---|---|
| L-67 (Critical) | CI-1, ruling 101 | CLOSED on staging (310) |
| L-78 (High) | CI-2, ruling 103 | merged `0c155a5c`; staging 311; Sharon's promotion verdict pending; **PR-22 stays open** |
| L-105 (High) | CI-1b | building on main `0c155a5c` (Second Eye) |
| H-1 (test harness) | ruling 102 | CLOSED |

## 2 · The batches

Migration numbers: 312 onwards, after CI-1b takes its own. Builder: Second Eye. The Z-UX audit builder owns the cross-surface journey assertions. Sharon pre-reviews and verifies every batch that touches a database rule, an RPC contract or a confidentiality boundary. Daisy owns every word, and verifies every batch that changes what a person reads.

### AR-A · Certificates: three facts, one state (C-1 applied to certificates, C-3; ruling 96)

**Authority:** `keadaanSertifikat`, the result in force (AR-C's helper) and the certificate's validity, read by every certificate surface, the public check included.
- **Three facts, each said truthfully and distinctly:** the original passing result, the recalculated result, and the certificate's current validity.
- **Findings:** L-16, L-44, L-66, L-68, L-70, L-82, L-86, L-103, L-106, L-107, L-108, L-109.
- **Print language (Daisy, `5ca1a18c`):** the paper follows the certificate's issued language, and the chrome follows the viewer. This is settled; nothing changes. Her optional note beside «Cetak» when the locales differ rides only if AR-A already touches that line, otherwise it is left out (scope).
- **Check text under the review band (Daisy, CI-1b print judgement, 26 Nov; J7-2's sibling):** under «Sedang ditinjau», the «Periksa keaslian» text still says «… dan masih berlaku» (EN «… and is still valid»). The band and the QR already tell the truth, so it is non-blocking. Her words for AR-A: «Halaman itu menunjukkan apakah sertifikat ini benar diterbitkan dan bagaimana keadaannya sekarang.» / «That page shows whether this certificate was genuinely issued and what its status is now.» Record: `docs/coordination/ux/completion-4.1/CI1B-KATA.md` (`ux-1/daisy-experience` `88602ba2`).
- **Dependent screens:** the learner's certificate page and list, the public check page, the reissue and revoke panel, Siapkan's certificate step, and the printed and PDF forms (with CI-1b).
- **Journey assertions:**
  - after a recalculation, the holder, the admin panel and the public check agree on validity;
  - after a reissue, «Lihat sertifikat» opens the new one.

### AR-B · Confidentiality boundaries (principle 5, C-9, C-11; Sharon's bindings)

**Authority:** one per boundary. Sharon's bindings unless the row says otherwise; her records are the binding text.

| Finding | Sharon's binding condition |
|---|---|
| **L-112 (HIGH)**, L-114 | In full: `AUDIT79-L112.md` and the pre-review's B1. The idle lock counts only real input (keydown, pointerdown, touchstart, wheel; `pointermove` only with movementX or movementY ≠ 0), never a render or a programmatic scroll. `scroll` is dropped, or counted only within about 1 s of a wheel, touch or key event. **The warning and the lock screen never count as activity:** only «Masih di sini», a pointerdown or a key. No looping or autoplay media keeps a session alive. Every component that scrolls, focuses or changes height by itself is swept. **Red-first in a real browser:** the tour open with no input locks at about 300 s; `scrollBy`, `scrollIntoView`, `focus` and each layout change count as nothing; a real wheel or key counts. **Gate:** fixed before any shared-computer use, and before the pilot if the pilot uses shared machines. **Readiness: PR-23** |
| L-113, L-116, L-115, L-117, L-160 | «Komputer siapa ini?» keeps its promise: the choice is changeable where it says (principle 4). A wrong card PIN is cleared from the field. **L-160 (Daisy, `b71e77c5`):** clear the PIN, keep the card number, and **focus the card number**, never the PIN: CARD_NOT_MATCHED covers a wrong number too, and a locked account answers the same |
| L-131, **L-142** | In full: the pre-review's B2. A PIN is a secret shown once: never in a URL, never stored in plaintext, never re-shown on reload or Back, never in history state, and the server can't return it a second time (a reload that re-shows PINs is a separate, higher finding). Every response that carries a secret is `no-store` through the one helper. **The test covers every `/api` response carrying a PIN, code, token or secret.** The static guard: no route on the secret-bearing list calls `NextResponse.json` directly |
| L-134 | In full: the pre-review's B3. A teacher never learns that a sitting was set aside by an integrity review: only the counts, «not countable», and the ordinary next step. **The test covers the teacher's reads, screen and RPC alike,** for an overridden sitting: no reason, reviewer or override record. Who may know why: the integrity reviewer and those the referral process names; the learner is told by that process, never through the teacher's screen |
| L-126 | In full: the pre-review's B4. Every AI refusal records its code **in the same transaction as the refusal**, from a closed list (e.g. ALLOWANCE_EXHAUSTED, PLATFORM_CEILING, NOT_ENTITLED, REFUSED_PERSONAL_DATA), with no free text and no request content. A CHECK means a terminal row can't have an empty `hasil`. The test: each refusal path leaves exactly its code. **Before C3w-2's activation; readiness PR-24** |
| L-127 | In full: the pre-review's B5. (1) The same NIS in the same school is the same person, refused as a duplicate; a different NIS means different people, never «kembar». (2) No NIS: the same name and birth date is a possible duplicate; the same name with neither NIS nor birth date is a possible duplicate too, with a per-pair, audited admin choice («Dua orang berbeda»), and «Catat» is held until every pair is chosen; the same name with different birth dates means different people. (3) NIS is a per-school attribute: unique within the institution; shown only to that school's intake and admin staff; **never** on the certificate, the public check, other learners' views or exports outside the school; **never** a sign-in, and never matched across schools. (4) Never auto-merge or auto-split: «Hapus baris» removes only the import row, and a merge is a separate, audited admin act |
| L-151 | In full: `J8-L151-L149-ACCESS.md` and the pre-review's B6. A name row like «Citra 123 <b>» is flagged at intake, and output stays encoded. **Control, bidi and zero-width characters are refused at storage** (a `display_name` CHECK plus an intake row error, with a step 0 count first): the security-relevant part, against a spoofed printed name. Any future CSV or spreadsheet export neutralises a leading `= + - @`, TAB and CR, and quotes per RFC 4180. A new non-React renderer states its encoding and is tested with the row |
| **L-154, L-155** (C-1 widened) | In full: `J12-L155-STAFF-CARD.md` and the pre-review's B7. Staff-ness is recorded server-side, never held only in the browser. **No card for anyone recorded as staff, or who ever held a staff role,** with one exception: an audited reclassification to learner, with a reason. One helper decides it, for the read, the action and the counts («murid tanpa kelas» and the rest) alike. The DB trigger `accounts_card_is_learners` stays the boundary and keeps CARD_FOR_STAFF; the reverse direction (`role_assignments_card_holds_no_role`) is unchanged. A lapsed role keeps email sign-in with no capability and never makes a person card-eligible. Tests include a PLANT that reverts to `not memegang_peran_staf`. Staging step 0 (00:36:43Z): 1,477 card accounts, 0 ever held a role; **the production step 0 goes through the readiness process, with any hit going to the owner.** Daisy's adjusted Aktivasi words (`098539b2`): «Aktifkan dengan email» is offered, «Buat kartu kelas» never is |
| L-75, L-76, L-147 (C-9) | **L-75: WITHDRAWN, the neutral line only** (pre-review A1). Under CI-2 a locked account's password is rotated, so a correct old password reads as any wrong one and no password can be proven for a closed account. **Any AR-79 change that tells a closed account apart from a wrong password reopens L-78.** C-9's principle (say more only after a strong proof a stranger can't have; a password qualifies, a PIN doesn't) stays for L-147 and any future path. **L-76** (B9): its line is shown on **every** PIN-recovery refusal, never conditioned on whether a reset happened, with the response and its timing otherwise unchanged. L-147: the recovery email goes out in the person's language |
| L-99 (C-11) | **Bob's direction (W3, C-11), not a condition of Sharon's** (attribution corrected, pre-review D). Maintenance's advice is reconciled with A3's one-device rule: learners are never told to sign out of a sitting they can't leave. Sharon reviews it in AR-B's pre-build |

**Journey assertions:**
- the tour open on a shared computer, then the lock at its time;
- a closed account with the correct password, compared with a wrong one, and with a card;
- the integrity-reviewed sitting, as seen by its teacher.

### AR-C · The result in force and the retake (C-1, C-2, C-5, C-6)

**Authority:**
- One SQL helper for «the result in force» (the latest FINALIZED), shared with `hasil_belajar_sesi_orang`.
- `my_cycle_state` **gains** it as an added field; the current attempt keeps its meaning (§3a's eleven consumers).
- The step derivation `posisi` reads `percobaan_saya` and `ulang_berjalan`.
- One verdict word per `bersertifikasi`.

**Sharon's C-1 conditions:**
- return the sitting id, never values;
- the own-assignment rule, with no person parameter;
- drop and create, with the grant and the registry entry asserted;
- a red-first test per consumer, with the pinned case: an open retake after a finished attempt. The result page shows attempt 1, and the test page resumes attempt 2;
- never call outcome, map or review with the open retake's id;
- the result is labelled as the previous attempt's;
- (pre-review C) `my_cycle_state` **calls** the helper rather than restating it; every page reads the id through `session_outcome` / `reading_map` under `session_is_mine`, so R-h counts-only is inherited; only `session_answers` reads an open sitting.

**«How this sitting ends» (Daisy's optional grouping, taken):** L-47, L-118 and L-119 read one answer for a sitting's time limit and end (no raw minute counts, no «Tambah waktu» on an untimed sitting).

**C-5 (Sharon's conditions):**
- each recommendation block is read with its own sitting's id and gated by that sitting's flag;
- each block's provenance is labelled;
- KUAT is dropped where it would read as a mastery verdict beside a certifying result, **in that view only** (a presentation choice, with no new analytics);
- neither block is computed from the other's answers;
- a plant that feeds the certifying id to the pre-test block must be refused.

**Findings:** L-14, L-33, L-43, L-46, L-47, L-48, L-54, L-55, L-56, L-57, L-59, L-61, L-63, L-64, L-74, L-118, L-119, L-121, L-141.

**Journey assertions:**
- **R-1 (§0a):** the next-step chapter appears once with one button; other chapters are unchanged; checked at 1280, 390 and 320;
- a retake approved: the home, the result, the chapter and `lanjut` all offer it;
- a retake open: the learner and the teacher both show the result in force;
- a sitting ended by the teacher: the learner is told how it ended (ruling 96).

### AR-D · «Waiting for you» covers every decision a person owns (C-4)

**Authority:** one count per person over every kind of decision they own. For a teacher: release, continue and retake requests. For an approver: management decisions and retake requests. For the second person: key corrections. The empty line appears only when every kind is empty.
- **Findings:** L-45, L-58, L-69, L-83.
- **Journey assertions:**
  - a continue request, a retake request and a correction each appear in their owner's «waiting» list, and the empty line is absent while any of them waits;
  - **R-2 (§0a):** each running assessment is listed once on `/mengajar` and `/mengajar/[kelas]`, with its date labelled, at all three widths.

### AR-E · Actions offered only when their prerequisites hold, refused with the true cause (C-7 both halves, C-8, C-12)

**Authority:** PINTAR's existing pattern: a read the database owns that answers «may do / why not» with the action's own refusal codes. Every indicator and every button's enabled state read it. The database still decides at the moment of action (Sol's qualification), and a refusal at press time is shown by name (DAISY-18).
- **The second half (L-124, L-143):** every rule a screen enforces is also enforced by the action's RPC, with the same code. **Sharon's binding, in full (pre-review B8):**
  - the mark stores the check run id and the revision or content hash;
  - the DB refuses the mark when there is no completed check for the current revision, or an open mandatory finding;
  - the approval screen and RPC never treat VALIDATED as «checked»: approval runs or reads a check of the current revision;
  - **the HIGH test:** the approve and publish paths each re-run the check and refuse with an open ERROR, whatever the mark says;
  - red-first: a mark before any check is refused; a mark after a clean check is accepted; an edit after the mark leaves it stale and refuses approval; a mark with a pending draft is refused, and is accepted once the draft is decided; a draft added after the mark makes it stale;
  - severity contingency: HIGH if any approve or publish path skips the re-check.
- **L-38, Sharon's C-3 transfer conditions (pre-review A2; `AUDIT79-C1-C3-C5-VIEW.md` §C-3):** (1) one helper holds the closed-source rule, used by both the transfer row's read and `transfer_execute`; (2) the receiving school gets a boolean only («tidak dapat dilaksanakan: pendaftaran asal sudah ditutup»), **never why** the source closed: that reason is the sending school's record.
- **The 9 buttons** (§3b of W3) and the reverse sweep: a database action without the screen's rule.
- **C-12:** each refusal names the cause that applies, from the same codes; never a generic permission line when the cause is known and harmless to name.
- **L-152:** the guard already exists (`role_assignments_guard`, `20270113170000`, FOR UPDATE on institutions, ROLE_LAST_SCHOOL_ADMIN). AR-79 adds **a dynamic plant that removes the lock** and proves two concurrent releases can't leave a school with no admin, and gives the true refusal.
- **C-8 (L-71):** the teacher and the head of department can raise a wrong key to the admin; only the admin decides.
- **Findings:** L-13, L-36, L-38, L-60, L-71, L-79, L-81, L-94, L-96, L-101, L-102, L-104, L-122, L-123, L-124, L-128, L-129, L-132, L-133, L-143, L-144, L-148, L-152, L-156, L-157.
- **Journey assertions:**
  - for each of the 9 buttons, the button's state and the press-time refusal agree;
  - the last admin is refused with the true cause.

### AR-F · Forms validated by PINTAR, not the browser (C-10, form state)

**Authority:** PINTAR's own announced error line on every form, as the sibling forms already do. A refusal never clears what the person entered (L-125).
- **Findings:** L-77, L-84, L-88, L-90, L-91, L-120, L-125, L-130, L-150.
- **Journey assertion:** each field submitted empty or out of range gets PINTAR's line, announced, and it survives a scroll.

### AR-G · Words: one name per concept, every word through the lookup (C-6 widened; Daisy's word list)

**Authority:** the translation lookup, with Daisy's word list (sent before the build). No hard-coded page text (L-135, L-136, L-140 in `konfigurasi/page.tsx`).
- **Findings:** L-15, L-17, L-18, L-19, L-20, L-21, L-22, L-23, L-24, L-25, L-31, L-32, L-34, L-49, L-65, L-72, L-73, L-85, L-89, L-92, L-93, L-95, L-97, L-98, L-100, L-135, L-136, L-137, L-138, L-140, L-145, L-146, L-158.
- **Daisy's word list** (`2f5a6ac8` §2) is the binding text: one name each for L-17 to L-25 (e.g. kesempatan = attempt, pengerjaan = sitting, never «session»; murid, not «Peserta»; tahun ajaran «2026/2027»); the verdict words per `bersertifikasi`: Lulus / Belum lulus / Belum dapat ditentukan when certifying, Mencapai target / Belum mencapai target otherwise, with staff adding the figure after the word.
- **L-31 (principle 4):** a response-time promise is made only where a fact supports it (ruling 90's lesson).
- **Assertion:** a static check that every visible string on the changed pages comes from the lookup, in both ID and EN.
- **R-3 (§0a):** on `/pimpinan` and `/dekan/ringkasan`, the empty sections are short, and the non-empty ones keep their method text and figures unchanged.

### AR-H · Layout and accessibility (its own verification)

**Authority:** the shared components, fixed once, not per page. Accessibility is verified separately: a screen that looks right isn't necessarily accessible (L-87). Each batch gets the screen-reader pass.
- **Findings:** L-01, L-02, L-03, L-04, L-05, L-06, L-07, L-09, L-10, L-39, L-40, L-41, L-42, L-50, L-51, L-52, L-53, L-87, L-110, L-111, L-139, L-153, L-159.
- **Daisy:** L-01 is WCAG 1.4.1, so it is verified app-wide; K-1 to K-4 apply to the learner and teacher chrome (L-53).
- **The 320 note (§0a):** the learner bar is checked at 320, not only /konfigurasi.
- **Assertion:** 320, 390 and 1280 captures plus the screen-reader pass, per changed surface.

## 3 · Not built in AR-79, named for the closure report

| Finding | Why | Where it goes |
|---|---|---|
| L-26, L-27, L-28, L-29, L-30 | phase-bound to 4.5 by their record | 4.5 |
| L-35 | Sharon: 4.5, not a 4.1 correctness defect; **PR-3** rides with it | 4.5, carrying Sharon's fixes (pre-review C): (a) acceptance refuses a closed source by the same name, before AUTHORIZED; (b) a transfer whose source closed becomes EXPIRED or CANCELLED with its cause, never left dangling; and the UX note: the receiving admin sees the sender's latest period and outcome. AR-E's L-38 helper is the same helper |
| L-08, L-11, L-12 | unknown until walked: they need fixtures holding empty, untitled and integrity states | walked with those fixtures in AR-79's verification; a finding opens a row |
| L-37 | no finding | — |
| L-80 | **WITHDRAWN** (Daisy, `2f5a6ac8`): resolved on the corrected world; Ayu's first thing now names 8C (her walk `6b248975`, the builder's `d41ed05c` L1); the ledger already records it | — |
| L-62 | no change proposed | — |
| L-149 | WITHDRAWN (Daisy's reproduction; the builder's walk `0a424d0b`) | — |
| L-67, L-78, L-105 | CI-1, CI-2, CI-1b (§1) | — |
| M5b staff intake | out of scope (the L-148 boundary): staff are recorded through the existing path, and bulk staff intake is a feature | named in the closure report |
| OD-3 | the owner's open decision (ledger) | the owner |

## 4 · Order and gates

1. **AR-A, then AR-B** (certificates, then the confidentiality boundaries; L-112's lock is the only HIGH left after CI-1b).
2. **AR-C, then AR-D and AR-E** (AR-E's «may do» reads reuse AR-C's helper where they touch the result).
3. **AR-F, AR-G and AR-H** can go with the batches that touch the same pages, so each page changes once.
4. **For each batch:**
   - **words before code** (Daisy): the batch's strings are committed and reviewed first, as CI-1 and CI-2 did;
   - the frozen head;
   - ci and journeys conclusions read from the API (plan of record §3d);
   - the local suite, plants and redcase;
   - the diff accounting;
   - Sharon's verification;
   - Daisy's verification;
   - the owner's request through Bob;
   - a staging promotion only with its own step 0, BEFORE and AFTER, as CI-1 and CI-2 did.
5. **Readiness rows:** PR-23 closes with AR-B's L-112; PR-24 closes with AR-B's L-126, before C3w-2. PR-22 stays open until the owner's separate production authorisation. PR-25 is the standing rule (main green on the exact commit).

## 5 · What would make this plan wrong (for the reviewers)

- A finding placed in a batch whose authority doesn't actually cover it. **Sharon:** AR-B and AR-E. **Daisy:** AR-C, AR-D and AR-G.
- A dependent screen missing from a batch's list. The rule from L-148 and L-149 applies: **a code reading is a hypothesis until the path is walked**, so each list is confirmed by the builder's walk before the freeze.
- Any boundary of Sharon's not carried verbatim into the build's tests.
- **The lesson from Sharon's A1:** this plan was first drafted from the findings list, not from the rulings that later changed them (L-75 after CI-2's rotation). Every batch request re-reads the rulings and specialist records made since its finding was recorded.
