# PINTAR 4.0–4.1: Whole-Platform Assessment & Recommended Development Strategy

**Date:** 10 November 2026. **Basis:** the accepted 4.0 candidate (`ab4146da`), read from code, migrations and the approved 4.1 scope register. Nothing was built or changed for this assessment.

**How to read the evidence labels:** *Verified* means read in the code or schema. *Inferred* means concluded from what was read. *Open* means not determined.

**Staging results are in Part 0.** The strategy starts at Part 1.

> **Status (11 Nov):** this is the assessment as delivered on 10 Nov, kept as a planning record. The owner's decisions on it, and the scope it was reduced to, are in `OWNER-DECISIONS-2026-11-11.md`. The plan in force is `EXECUTION-PLAN.md`. Where they differ from Parts 5 and 7 below, they win.

---

## 0 · Staging promotion results

**4.0 is promoted to staging and technically verified, with three rendered checks still unseen.** Production was not touched.

### What was done

| Step | Result |
|---|---|
| PR [#17](https://github.com/yazidmanan2409/pintar40/pull/17) checks on the exact head `5d205020` | CI [42819612884](https://github.com/yazidmanan2409/pintar40/actions/runs/42819612884) success; journeys [42819631074](https://github.com/yazidmanan2409/pintar40/actions/runs/42819631074) success; mergeable, no conflict |
| Merge into `main` | `d764d69e`, a merge commit. The promoted code is the audited code: `kandidat-sama.sh` reads SAME, and nothing under `src/`, `supabase/`, `selftest/`, `audit/` or `.github/` differs from `ab4146da` |
| Staging migration ([42825995243](https://github.com/yazidmanan2409/pintar40/actions/runs/42825995243)) | Success. 200 → 224; "migrations after must equal the repository" passed; the sign-in round trip and front door passed |
| Staging serves the promoted commit ([42827576630](https://github.com/yazidmanan2409/pintar40/actions/runs/42827576630)) | Success |

### Verification (read-only on the staging database)

| Check | Result |
|---|---|
| Migration count | 224, latest `20270113160000`; metric catalogue in force MC-10 |
| Preservation | Every count is identical before and after: 27 schools, 1,579 people, 1,488 enrolments, 1,485 memberships, 1,779 sittings, 1,422 answers, 1,774 results, 66 certificates, 287 generated reports, 99 role assignments |
| Audit trail integrity | 10,421 rows before and after; the new `run_id` column agrees with every row's summary (0 mismatches); the parent trigger and both indexes are present |
| Audit rewrite timing | All 24 migrations applied in **14 seconds** in total, so the one-off audit rewrite took less than that on 10,421 rows (5 MB). This does not size production's window; the upgrade rehearsal does |
| New rule: one live enrolment per school and year | Applied cleanly; staging held no duplicates beforehand |
| School time zones | All 27 schools default to WIB |
| Certificates issued between 00:00 and 07:00 WIB | 15 exist. For each, the stored instant falls on the next WIB day (for example 8 Nov WIB, 7 Nov UTC), and the sealed timestamp matches the stored instant to the second |

### Not verified on staging

- **The certificate's displayed date, the integrity count line, and every other rendered screen.** This session's network cannot reach the staging site, so I could check the data behind these screens but not the screens. Staging does hold what both need: 15 night-issued certificates, and 23 integrity observations at one school.
- **«Materi tanpa judul».** No assignment on staging has a missing or blank title, so the case does not occur there. It stays unseen, not passed.
- **The staging walks used at earlier promotions** (found a school, the golden-school walks, Studio, Batch 5). They start from request files I am instructed never to touch. They need your go-ahead, or someone to start them.
- **Screen readers, Firefox, WebKit, and response times from Indonesia.** Unchanged; these need people and devices.

### Rollback

Not needed. `ROLLBACK-201-224.sql` is in the repository if it ever is. Note that staging now reads the catalogue as MC-10: once reports are generated under it, the rollback will refuse, by design, until those rows are decided.

### What I recommend for the unseen items

One short rendered pass on staging by Daisy, or by anyone with a browser and a staging account: open a night-issued certificate and read its date, and open the integrity review as the school's admin and read the count line. It is two screens. It does not need a review round.

---

## 1 · Executive verdict

**4.0 is a sound foundation for 4.1 in what it protects, but not yet in what it lets a school do.** Evidence integrity, permissions, the audit trail and the people lifecycle (leave, return, transfer, suspend, close, promote a year) are built and tested. Three everyday operations that 4.1's largest capabilities stand on are missing, and the approved plan does not contain them.

**The three most important findings:**

1. **A teacher cannot manage one learner's sitting.** There is no screen to give extra time, end one sitting, grant another attempt or change a window after assigning. A sitting the learner abandons is never closed or scored. Cross-device recovery (C1), the highest-risk 4.1 capability, is "teacher-authorised recovery of a sitting", and today the teacher has no place to act on a sitting at all.
2. **Questions can only be authored by uploading a workbook.** There is no in-app editing of a question, no editing of an unreviewed draft, and no identity that follows a question from one revision to the next. Revision lineage (C4), misconception annotations (C2) and AI-assisted generation (C3) all assume an item-level editing surface. C3 in particular promises that educators "review, edit and approve" AI drafts, and no screen exists where a draft can be edited. That work is not in C3's estimate.
3. **The approved plan is larger than its estimate, and its date is no longer credible.** It carries unestimated scope (job positions, acting appointments, future-dated roles), an unresolved design conflict (12-month retention against an audit table that cannot delete), and a mid-December walkthrough that assumed four parallel lanes starting 10 November. None of the eight capabilities has started.

**My recommendation in one line:** build two small foundations first (sitting control, and an item workbench that absorbs C4), run three lanes in parallel, defer three items that the walkthrough cannot meaningfully exercise, and set the walkthrough date from progress rather than from the calendar. Detail is in Parts 4, 5 and 8.

---

## 2 · Operational completeness map

Lifecycle stages checked: create, operate, modify, suspend, restore, transfer, retire, preserve history. "No engineer needed" is the test.

### 2.1 Accounts, identity, roles

| | |
|---|---|
| **Works today** | Bulk import; activation by email or class card; self set-up; password and PIN recovery, self-service and assisted; lost card reissue; role grant, change and revoke with a preview of what the person is responsible for; staff departure with a category; platform suspension and lifting it; an adult closing their own account, reopening it, and deleting personal data; sign out everywhere; shared-computer mode. |
| **Missing or incomplete** | The platform can lose its last platform admin: every role has a mandatory end date and revocation has no last-holder check; recovery needs database access. A school can likewise lose its only admin. No warning before a role expires, and no renewal. A school admin cannot add one late joiner without an import, or fix a name typo after activation (platform admin only). An account request cannot be declined, so it sits in the queue for good. A staff member cannot hold a role at a second school: the screen refuses, which leads to a duplicate person. No change of password while signed in. |
| **Deferred by ruling** | School-level suspension; closure or deletion for a learner or family (waits for counsel). |
| **Cross-module effect** | Suspension ends every session and refuses every request, but leaves an open sitting open (see 2.4). Staff departure ends authority at the next request but hands nothing over (see 2.2). |
| **Evidence, confidence** | Verified in `supabase/migrations/20270113120000…`, `…130000…`, `src/app/konfigurasi`, `src/app/aktivasi`. High, except "no signed-in password change" (inferred). |

### 2.2 Institution, structure, classes, the school year

| | |
|---|---|
| **Works today** | Create, rename and deactivate departments, levels and classes; place, move, end and re-enrol learners; assign and replace teachers atomically; year-end promotion with a preview (promote, repeat, graduate, leave); transfer between PINTAR schools, agreed by both sides; Professional Development structure, enrolment and record. |
| **Missing or incomplete** | A school cannot be renamed, closed or archived. Founding a school is an operator's workflow (by ruling), and only the platform admin can set its time zone. Structure mistakes are permanent: a deactivated class cannot be reactivated, moved or deleted. The school year is fixed at 1 July to 30 June with no semesters. A mistaken promotion run can only be corrected one learner at a time. When a teacher leaves, nothing lists the classes left without a teacher. Professional Development has no "end programme" or "remove participant", and only the platform admin can end its assignments and sittings. |
| **Cross-module effect** | A teacher leaving does not disturb the class: assignments belong to the class, so a replacement inherits them, and attribution is kept. A transfer ends the old enrolment and open sittings and gives the new school visibility of the person; results and certificates stay with the old school and the learner. What the new school's teachers see of prior results is open. |
| **Evidence, confidence** | Verified in `src/app/konfigurasi/actions.ts`, `20270112210000…`, `20261231100000…`. High. |

### 2.3 Content Studio and the Question Bank

| | |
|---|---|
| **Works today** | Upload a package; check, submit, send back with a reason, approve; create, lock and publish a release, with two-person rules; distribute platform content to schools; assign to a class; end or withdraw an assignment. Sealed content is protected against change. |
| **Missing or incomplete** | Authoring is workbook upload only: no in-app editor, and the Bank itself states that nothing there writes a question. An unreviewed draft cannot be edited or discarded. A revision is a whole-package re-upload; no pointer links a revised question to its original on that path, although the column exists. A published correction does not replace its predecessor: both stay published, and a class that has started stays on the old one. Withdrawing a release does not stop already-assigned classes from starting new sittings. A wrong answer key found after learners sat has no school-usable fix: the recomputation function is platform-admin only, has no screen, and re-scores against the same sealed key. A single question cannot be retired. Question-health statistics are never recomputed: the function has no caller and there is no scheduler. A school cannot copy or adapt platform content. |
| **Evidence, confidence** | Verified in `src/app/studio`, `20261009…`, `20261105…`, `20260914091500…`. High. Whether an external scheduler runs question health is open. |

### 2.4 Assessments, attempts, mastery

| | |
|---|---|
| **Works today** | Assign with a window; start, answer, pause, resume, submit; answers survive a lost connection and are replayed; concurrent starts are serialised; re-reading requests; integrity observations and their review, which never alter a score. |
| **Missing or incomplete** | No screen to change a window, extend one learner's time, end one sitting, reopen one, or grant another attempt. Functions exist for extending and ending; no screen calls them. Attempts are fixed at one and two. **An abandoned sitting stays open indefinitely:** there is no scheduler, the deadline is optional, and it is only enforced when the learner next acts. It uses an attempt and produces no result. On a device change the learner resumes the same sitting, but answers not yet acknowledged stay on the first device, and two devices can both write. |
| **Cross-module effect** | Suspension, a learner's departure, ending an assignment and year-end promotion each handle open sittings deliberately and keep the answers. Suspension is the exception: the sitting is left open, and lifting the suspension restores no time. |
| **Evidence, confidence** | Verified in `src/app/belajar`, `src/app/mengajar`, `20261005100000…`, `20270112150000…`; no `pg_cron` anywhere in the migrations. High. |

### 2.5 Reports, certificates, continuity

| | |
|---|---|
| **Works today** | Reports for learner, teacher, head of department, dean and admin from one versioned metric catalogue. Class moves do not rewrite history, because a result keeps the class it was earned in. Certificates: issue, print, public verification, revoke, and correct by replacement with the original preserved. Certificates survive a transfer and a new year. |
| **Missing or incomplete** | Every generated report is stored, but no screen reads a past one and there is no period selector. Printing is the browser's own, with no record. A mistaken certificate revocation cannot be undone. **A school cannot export its data.** |
| **Evidence, confidence** | Verified in `src/components/laporan/AksiLaporan.tsx`, `20260918120000…`, `20270113110000…`. High. Whether last year's class stays reachable in the teacher and leader screens after rollover is open. |

### 2.6 Security, audit, operations

| | |
|---|---|
| **Works today** | An append-only audit trail with about 120 recorded actions, readable by the platform admin and each school's admin; planned maintenance with a drain, and an emergency stop for the platform or chosen schools; email limits and states; backup and restore workflows. |
| **Missing or incomplete** | No sign-in, sign-out-as-event, print or export events. No retention: the audit table refuses deletion, even by the service role. Pauses have no class scope, no reason list and no extension. Two platform switches (`maintenance_mode`, `registration_lock`) exist but nothing reads them. Whether the backup schedules are switched on is open. |
| **Evidence, confidence** | Verified in `20260912004158…`, `20261120100000…`. High. |

---

## 3 · Material gaps

### Critical: resolve before the work that depends on them

| # | Gap | Blocks | Size |
|---|---|---|---|
| K1 | **Sitting control.** No teacher action on one sitting; an abandoned sitting never ends | C1. Recovery needs a teacher surface and a defined end state for a stuck sitting | medium |
| K2 | **Item identity and in-app item editing.** Upload only; no draft editing; no question identity across revisions | C4, C2, C3 | medium to large |
| K3 | **Where accountability events live.** 12 months' retention cannot run on a table that refuses deletion | C5, then C6, C1 and C3 | a design decision, then small |
| K4 | **Administrator lock-out.** The last platform admin, or a school's only admin, can expire or be removed; recovery needs an engineer | safe operation of every environment, staging included | small |

### Important: include in the matching 4.1 batch

- **Wrong-key correction a school can use:** a published correction replaces its predecessor; a withdrawn release stops new sittings; affected results are recomputed with a record. Belongs with C4.
- **A teacher's handover view:** classes with no teacher, after a departure. Belongs with sitting control.
- **School admin self-service:** add one person; correct a name; decline an account request; role-expiry warning and renewal.
- **A staff member at two schools.** Needs your ruling (Part 7).
- **Professional Development closure:** end a programme, remove a participant, let the school end its own PD sittings.
- **Question health actually runs.** Otherwise authors get no statistics, and C3's review has nothing to compare against.
- **Past reports readable**, and a period selector. Belongs with C6.
- **School data export.** The principle that a school is never held hostage has no implementation.
- **Structure corrections:** reactivate or move a class; rename a school; undo a promotion run as a whole.
- **Password change while signed in.**

### Later: can wait without compromising 4.1 acceptance

Close or archive a school; a foundation above several schools; editable year dates and semesters; un-revoke a certificate; restore a withdrawn release; schools adapting platform content; briefings; learner and family deletion (with counsel).

---

## 4 · Development strategy assessment

**The approved order (O41-6):** 4.0 foundations → C4 → C2, C5, C6 → C7, C8 → C1 → C3 last. Four lanes; capability work complete by about 6 December; walkthrough mid-December.

**What I would keep:**
- C3 last. It depends on the most, and its quality risk (wrong keys, weak Indonesian) is external.
- C5 before C6. C7 and C8 as one system. C7/C8 before C1, because recovery during a pause needs a defined exemption.
- Red cases written before the build for C1.

**What I would change, and why:**

| Change | Reason |
|---|---|
| **Add "sitting control" before C1** | C1 is specified as recovery authorised by a teacher. The teacher has no sitting surface today. Building it first makes C1 smaller, and it solves the ordinary cases (a power cut, a stuck sitting) that schools will meet far more often than a device handoff. |
| **Replace C4 with an "item workbench" that contains it** | C4 was sized at 3–5 days as "item-level lineage on top of the package lineage". The lineage column exists, but the only authoring path with a screen never fills it, and the schema's own note says it cannot be backfilled. C4 needs a stable question identity and per-question editing; C3 needs the same surface to edit a draft. Building it once, first, removes the largest hidden cost from C3. |
| **Decide the accountability store before C5 starts** | Otherwise C5 is built on the audit table and discovers the retention conflict at review. |
| **Split C1** | Single-writer protection and recovery are needed. Exam Mode is a third, stricter mode, and today nothing can put an assessment into it. It cannot be exercised in the walkthrough. Defer it (your decision, Part 7). |
| **Take the unestimated items out of 4.1** | Job positions, acting appointments and future-dated role starts have no estimate, no lane and no foundation (no position table; nothing writes a role's start date). They are employment administration, not the educational experience the walkthrough evaluates. |
| **Three lanes, not four** | Reviews and full verification runs serialise. The history shows the constraint is review turnaround and verification cycles, not coding. Three lanes that touch separate modules is what can actually close. |
| **Set the date from progress** | Week one of the approved plan was spent finishing 4.0. A date fixed now would be a guess; fix it when the two foundations close. |

**Would we plan 4.1 this way today?** No. The plan was organised by capability, as approved. It should be organised by the surface each capability lands on: the sitting, the item, and the accountability trail. Three capabilities land on the item and two on the sitting, and each surface is missing its base.

---

## 5 · Recommended 4.1 roadmap

Three lanes. Each batch closes on its own conditions and is promoted to staging when it closes.

Effort is relative: S about 2–4 engineering days, M about 5–8, L about 9–14.

### Lane A · The sitting

**A1 · Sitting control** (M). *Depends on:* nothing.
- Deliver: a teacher's view of each learner's sitting; extend time; end one sitting; grant another attempt with a reason; change a window, recorded; an abandoned sitting ends at its deadline and is scored on what was answered; a suspended learner's sitting has a defined outcome; the "classes without a teacher" view.
- Accept when: each action works by screen for a teacher and is refused for anyone else; each writes an audit row; no sitting can stay open past its deadline; the journey "power cut during Uji Penguasaan" completes with no engineer.
- Closes K1.

**A2 · Pause and emergency: C7 + C8** (M). *Depends on:* A1 (a pause must respect extended and ended sittings).
- Deliver: class scope; the reason list; extend and resume early; warnings in the school's own time zone; "cannot finish before the window" refused at start; emergency stop at class scope with immediate notice.
- Accept when: the approved C7 and C8 scope is demonstrated at class, school and platform scope, and running sittings finish as D-094 requires.

**A3 · Recovery: C1 without Exam Mode** (L). *Depends on:* A1, A2, B1.
- Deliver: one writer per sitting, enforced at every boundary including service operations; stale-device writes refused; self-recovery for low-stakes assessments after re-authentication; teacher-authorised recovery for Uji Penguasaan from the A1 screen; each recovery recorded.
- Accept when: the red cases written first all pass; two devices can never both write; accepted answers are never lost.

### Lane B · The trail

**B0 · Operate safely** (S). *Depends on:* nothing. Start first.
- Deliver: last-admin guards for platform and school; role-expiry warning and renewal; school admin adds one person and corrects a name; an account request can be declined; password change while signed in.
- Closes K4.

**B1 · Accountability: C5** (M). *Depends on:* the store decision (K3).
- Deliver: sign-in success and failure, sign-out, print and export events, with 12 months' retention; readable only by authorised administrators.
- Accept when: each event is written once, with no password or code; retention is proven by a test that ages a row.

**B2 · Printed-report identification and past reports: C6** (S). *Depends on:* B1.
- Deliver: «Cetak laporan» logs the request and prints the footer; past generated reports can be opened; a period selector.

**B3 · School data export** (S to M). *Depends on:* B1 (an export is a logged event).

### Lane C · The item

**C1w · Item workbench, containing C4** (L). *Depends on:* nothing.
- Deliver: a stable identity for each question; edit and discard an unreviewed draft in the app; revise one question, with the original preserved and linked; a published correction replaces its predecessor; a withdrawn release stops new sittings; wrong-key correction that recomputes affected results on the record; question health recomputed on a schedule.
- Accept when: a typo is fixed without a re-upload; a past sitting still shows the version the learner saw; no comparability is claimed between versions; a wrong key is corrected end to end by a content owner with no engineer.
- Closes K2.

**C2w · Misconception annotations: C2** (S to M). *Depends on:* C1w.
- Deliver: attributed annotations in their own table, which no sealed report reads.
- Accept when: adding an annotation changes no existing score or report, proven by a before-and-after test.

**C3w · AI-assisted generation: C3** (L). *Depends on:* C1w, B1, your provider choice.
- Deliver: source material in; drafts with provenance into the workbench's draft state; the existing two-person review and publication; no AI label for learners.
- Accept when: no draft reaches a learner without an educator's approval; provenance is kept and hidden from learners at the API and database, not only on screen; a failed generation creates nothing.
- **Start the provider evaluation now.** It needs no code and has the longest lead time.

### Then

**Z · One candidate** (M). The integrated journeys, one full verification, Sharon and Daisy once on that commit, then the walkthrough.

### Parallelism and order

```
Lane A:  A1 ──► A2 ──► A3
Lane B:  B0 ──► B1 ──► B2 ──► B3
Lane C:  C1w ─► C2w ─► C3w        (provider evaluation runs alongside from day one)
                               └─► Z
```

- The lanes touch different tables and screens, so they can run at the same time.
- The one cross-lane dependency is B1 before A3 and C3w.
- **Total:** roughly 60–80 engineering days, against the register's 46–69. The difference is the two foundations, which the register's estimate omitted and the work needs anyway.
- **Forecast:** a mid-December walkthrough is not achievable with this scope. The second half of January 2027 is realistic if reviews stay bounded as in Part 6. I would confirm the date when A1 and C1w close.

---

## 6 · Development-process improvements

The record of 7–10 November: about 13 successive commits were named final, verified or ready; at least six security review rounds and seven design review rounds; about ten full-suite runs in one day, seven of which failed first. Four causes account for most of it. Each has one fix.

1. **Write the completion condition before the build, as operations, not features.** For each batch: the lifecycle table (who can create, change, suspend, restore, retire, and what history is kept), and the states each screen must show. Sharon and Daisy review that page once, before code. *Cause addressed:* acceptance criteria discovered during review (the year-end promotion's requirements came from a demonstration; eleven tests were restated after rulings).
2. **The engineer runs the rendered check before any review.** One fixed checklist: three widths, keyboard only, every disclosure opened, the reviewer's own navigation sequence. *Cause addressed:* blockers found only by rendering, and checks that passed while missing the failure (the Enter key after eight clean accessibility scans; the audit view that passed 42 of 42 and was wrong).
3. **A ruling that arrives mid-batch goes to the next batch, unless it is a blocker.** *Cause addressed:* scope added to a candidate under review (two gates and the lifecycle on 9 November; school clocks across 84 call sites on 10 November).
4. **One review of the result, one correction pass, then close.** Findings are classed when raised: a blocker (a broken essential journey, authorisation, data or required evidence) reopens the batch; anything else goes to the register. This is the rule you set on 10 November; make it standing.
5. **Verify per batch, not per commit.** Targeted tests while building; the full suite, CI and journeys once on the batch's candidate. A presentation-only change after that reruns CI and the affected tests, not everything. *Cause addressed:* a 45-minute suite plus CI plus journeys for a one-line change.

One more, from this promotion: **promote each closed batch to staging.** A merge to `main` already migrates and deploys staging. Promoting batch by batch keeps each rollback small and means the 4.1 candidate is not another 24-migration move.

---

## 7 · Owner decisions

| # | Decision | My recommendation |
|---|---|---|
| 1 | **The walkthrough date** | Release mid-December. Set the date when A1 and C1w close; forecast the second half of January 2027. |
| 2 | **Job positions, acting appointments, future-dated role starts** | Move to 4.2. |
| 3 | **Exam Mode** | Move to 4.2. C1 delivers single-writer protection and both recoveries. |
| 4 | **The item workbench** (in-app question editing) as part of 4.1 | Approve. C4 and C3 cannot be delivered as specified without it. |
| 5 | **Wrong-key policy:** does withdrawing a release stop new sittings, and who may recompute results | Yes, it stops them. Recompute by a content owner with a second person's confirmation, recorded. |
| 6 | **One person with roles at two schools** | Allow it. The alternative in use is a duplicate person. |
| 7 | **Where accountability events live** | A separate table with a 12-month purge. Leave the audit trail append-only. |
| 8 | **Run the AI provider evaluation now** (already approved in principle, at most US$25) | Yes, now. |
| 9 | **The process rules in Part 6 as standing rules** | Adopt. |

---

## 8 · Final recommendation

If I were responsible for delivering 4.1, I would do this, in this order:

1. **Finish the staging verification of 4.0** (Part 0), and start nothing on 4.1 before it holds.
2. **Get the nine decisions above**, in one sitting.
3. **Start three things on day one:** B0 (operate safely), A1 (sitting control) and C1w (the item workbench). Run the AI provider evaluation alongside.
4. **Write each batch's completion page first**, have it reviewed once, and build to it.
5. **Promote each batch to staging as it closes.**
6. **Fix the walkthrough date when A1 and C1w close**, because by then the two largest unknowns are measured rather than estimated.
7. **Build C3 last**, onto a workbench educators can already use by hand.

The platform protects evidence well. What it lacks is the ordinary handles: a teacher's hand on a sitting, an author's hand on a question, and an administrator's way back in. 4.1's headline capabilities are refinements of those handles, so the handles come first.

---

## Not determined in this assessment

- Whether last year's classes stay reachable in the teacher and leader screens after a year-end promotion.
- What a receiving school's teachers can see of a transferred learner's earlier results.
- Whether every sitting carries a deadline (the column is optional).
- Whether the backup schedules are switched on.
- Whether anything outside the repository recomputes question health.
