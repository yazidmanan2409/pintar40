# Audit 79 · W6 · the AR-79 correction plan (Bob, 25 Nov 2026)

**Status: DRAFT for Sharon's and Daisy's pre-build review.** Nothing in it is built.
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
- **Dependent screens:** the learner's certificate page and list, the public check page, the reissue and revoke panel, Siapkan's certificate step, and the printed and PDF forms (with CI-1b).
- **Journey assertions:**
  - after a recalculation, the holder, the admin panel and the public check agree on validity;
  - after a reissue, «Lihat sertifikat» opens the new one.

### AR-B · Confidentiality boundaries (principle 5, C-9, C-11; Sharon's bindings)

**Authority:** one per boundary, as Sharon set them.

| Finding | Sharon's binding condition |
|---|---|
| **L-112 (HIGH)**, L-114 | The idle lock counts only real input (keydown, pointerdown, touchstart, wheel, real pointer movement), never a render or a programmatic scroll. Every component that scrolls, focuses or changes height by itself is swept. A plant proves a tour-driven `scrollBy` doesn't keep a session open. **Readiness: PR-23** |
| L-113, L-116, L-115, L-117, L-160 | «Komputer siapa ini?» keeps its promise: the choice is changeable where it says (principle 4). A wrong card PIN is cleared from the field |
| L-131, **L-142** | A PIN is a secret shown once. Every response that carries a secret is `no-store` through the one helper, with a static guard against a sibling route bypassing it. The «shown once» probe keeps holding |
| L-134 | A teacher never learns that a sitting was set aside by an integrity review: only «not countable», and the ordinary next step |
| L-126 | Every AI refusal records a closed reason code in `ai_permintaan`. **Before C3w-2's activation; readiness PR-24** |
| L-127 | A name is never identity. NIS is per school, shown only to intake and admin staff, and never matched across schools. No merge without an audited admin decision. Removing an import row never touches a person record |
| L-151 | Data quality, not a security gap: a name row like «Citra 123 <b>» is flagged at intake; output stays encoded |
| **L-154, L-155** (C-1 widened) | Staff-ness is recorded server-side, never held only in the browser. **No card for anyone recorded as staff, or who ever held a staff role.** One helper decides it, for the read and the action alike. Staging step 0 (00:36:43Z): 1,477 card accounts, 0 ever held a role. Daisy's adjusted Aktivasi words (`098539b2`): «Aktifkan dengan email» is offered, «Buat kartu kelas» never is |
| L-75, L-76, L-147 (C-9) | Say more only after the requester has proven what a stranger can't know, and only where the proof is strong: a password qualifies, a PIN doesn't. The recovery email goes out in the person's language |
| L-99 (C-11) | Maintenance's advice is reconciled with A3's one-device rule: learners are never told to sign out of a sitting they can't leave |

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
- the result is labelled as the previous attempt's.

**C-5 (Sharon's conditions):**
- each recommendation block is read with its own sitting's id and gated by that sitting's flag;
- each block's provenance is labelled;
- KUAT is dropped where it would read as a mastery verdict beside a certifying result;
- a plant that feeds the certifying id to the pre-test block must be refused.

**Findings:** L-14, L-15, L-33, L-43, L-46, L-47, L-48, L-49, L-50, L-51, L-52, L-54, L-55, L-56, L-57, L-59, L-60, L-61, L-63, L-64, L-74, L-118, L-121, L-141.

**Journey assertions:**
- a retake approved: the home, the result, the chapter and `lanjut` all offer it;
- a retake open: the learner and the teacher both show the result in force;
- a sitting ended by the teacher: the learner is told how it ended (ruling 96).

### AR-D · «Waiting for you» covers every decision a person owns (C-4)

**Authority:** one count per person over every kind of decision they own. For a teacher: release, continue and retake requests. For an approver: management decisions and retake requests. For the second person: key corrections. The empty line appears only when every kind is empty.
- **Findings:** L-45, L-58, L-69, L-80, L-83, L-90, L-97, L-98.
- **Journey assertions:** a continue request, a retake request and a correction each appear in their owner's «waiting» list, and the empty line is absent while any of them waits.

### AR-E · Actions offered only when their prerequisites hold, refused with the true cause (C-7 both halves, C-8, C-12)

**Authority:** PINTAR's existing pattern: a read the database owns that answers «may do / why not» with the action's own refusal codes. Every indicator and every button's enabled state read it. The database still decides at the moment of action (Sol's qualification), and a refusal at press time is shown by name (DAISY-18).
- **The second half (L-124, L-143):** every rule a screen enforces is also enforced by the action's RPC, with the same code. **Sharon's binding:** the «lolos» mark is bound to the exact revision it checked, approval re-checks the current revision whatever the mark says, and neither mark goes through while an AI draft awaits its decision.
- **The 9 buttons** (§3b of W3) and the reverse sweep: a database action without the screen's rule.
- **C-12:** each refusal names the cause that applies, from the same codes; never a generic permission line when the cause is known and harmless to name.
- **L-152:** the guard already exists (`role_assignments_guard`, `20270113170000`, FOR UPDATE on institutions, ROLE_LAST_SCHOOL_ADMIN). AR-79 adds **a dynamic plant that removes the lock** and proves two concurrent releases can't leave a school with no admin, and gives the true refusal.
- **C-8 (L-71):** the teacher and the head of department can raise a wrong key to the admin; only the admin decides.
- **Findings:** L-13, L-36, L-38, L-71, L-79, L-81, L-94, L-96, L-102, L-119, L-122, L-123, L-124, L-128, L-129, L-132, L-133, L-143, L-144, L-148, L-152, L-156, L-157.
- **Journey assertions:**
  - for each of the 9 buttons, the button's state and the press-time refusal agree;
  - the last admin is refused with the true cause.

### AR-F · Forms validated by PINTAR, not the browser (C-10, form state)

**Authority:** PINTAR's own announced error line on every form, as the sibling forms already do. A refusal never clears what the person entered (L-125).
- **Findings:** L-77, L-88, L-120, L-125, L-130, L-150.
- **Journey assertion:** each field submitted empty or out of range gets PINTAR's line, announced, and it survives a scroll.

### AR-G · Words: one name per concept, every word through the lookup (C-6 widened; Daisy's word list)

**Authority:** the translation lookup, with Daisy's word list (sent before the build). No hard-coded page text (L-135, L-136, L-140 in `konfigurasi/page.tsx`).
- **Findings:** L-17, L-18, L-19, L-20, L-21, L-22, L-23, L-24, L-25, L-31, L-32, L-34, L-65, L-72, L-73, L-84, L-85, L-89, L-91, L-92, L-93, L-95, L-100, L-101, L-104, L-135, L-136, L-137, L-138, L-140, L-145, L-146, L-158.
- **L-31 (principle 4):** a response-time promise is made only where a fact supports it (ruling 90's lesson).
- **Assertion:** a static check that every visible string on the changed pages comes from the lookup, in both ID and EN.

### AR-H · Layout and accessibility (its own verification)

**Authority:** the shared components, fixed once, not per page. Accessibility is verified separately: a screen that looks right isn't necessarily accessible (L-87). Each batch gets the screen-reader pass.
- **Findings:** L-01, L-02, L-03, L-04, L-05, L-06, L-07, L-09, L-10, L-39, L-40, L-41, L-42, L-53, L-87, L-110, L-111, L-139, L-153, L-159.
- **Assertion:** 320, 390 and 1280 captures plus the screen-reader pass, per changed surface.

## 3 · Not built in AR-79, named for the closure report

| Finding | Why | Where it goes |
|---|---|---|
| L-26, L-27, L-28, L-29, L-30 | phase-bound to 4.5 by their record | 4.5 |
| L-35 | Sharon: 4.5, not a 4.1 correctness defect; also **PR-3** | 4.5 (Sharon's one closed-source helper is specified there) |
| L-08, L-11, L-12 | unknown until walked: they need fixtures holding empty, untitled and integrity states | walked with those fixtures in AR-79's verification; a finding opens a row |
| L-37 | no finding | — |
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
