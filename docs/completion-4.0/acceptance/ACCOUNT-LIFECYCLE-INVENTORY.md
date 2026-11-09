# PINTAR 4.0 · account lifecycle: inventory and proposed minimal correction (9 Nov 2026)

**Status:**
- A read-only investigation (owner, 9 Nov: a 4.0 completeness investigation, findings before implementation).
- Nothing is built.
- The definitions were read from `supabase/migrations/` (latest wins) and checked against the local database.
  - **Caveat:** the local database's `transfer_reject` body differs from `20261121100000:41-43`. That drift is
    probably a self-test plant. Database checks are re-run on a clean reset before any change.
- Marked **(inferred)** where read from code and not exercised.

## 0 · The four layers

| Layer | What it is | Ends by | Can end today? |
|---|---|---|---|
| **1 · Platform identity** | Auth user, `accounts`, `persons` (PINTAR ID), PIN / card / email | (nothing) | No status, no suspension. `persons` is never deleted |
| **2 · School affiliation** | `institutional_identities` (the school's registration number, **permanent**), and for staff, their roles there | — | Staff: only by revoking every role. The registration number never ends |
| **3 · Enrollment** | `enrollments` (a learner in a school and period) and `memberships` (in a Kelas or Angkatan) | `ENDED` with `end_reason` COMPLETED / TRANSFERRED_OUT / WITHDRAWN / EXPIRED; membership `valid_to` with `close_reason` | Only TRANSFERRED_OUT, through a transfer between PINTAR schools |
| **4 · Role permission** | `role_assignments`, read live by `can_on_node`, `can_in_institution` and `has_scope` | `revoke_role` (reason required) or `valid_until` | Yes |

## 1 · The priority question: can a departed person still reach school resources?

| Who | Verified result |
|---|---|
| **Learner whose enrollment ended** (transfer) | **No new access.** Starting an assessment needs an ACTIVE enrollment and an open membership (`may_start_assessment`). Continuing a sitting already under way is stopped at the next answer (`may_continue_session`, INV-17). Lessons come only through ACTIVE placements (`my_learning_assignments`). Their own history stays readable, as intended (D-153) |
| **Learner who graduated, withdrew or moved abroad** | **Still has full access, because they cannot be ended.** No function, and no screen, sets COMPLETED or WITHDRAWN. Their enrollment stays ACTIVE, so they can start the class's assessments and their teachers keep authority over them |
| **Educator whose roles were revoked** | **No authority from the next request.** Every capability is re-read live, and there are no direct-write policies on staff tables. Revocation is write-once (`role_assignments_guard`: «assignment already revoked») and audited |
| **Educator, session** | **Stays signed in.** No session ends on revocation. With no role, the session reaches nothing of the school's (inferred from the above), but there is no immediate sign-out an administrator can use for a departure |
| **Former school over the person** | **Still has account-level power after they leave.** See defect D1 |

## 2 · Findings, classified

The classes are:
- **R:** existing capability to reuse;
- **UI:** missing administrator UI or workflow;
- **DB:** missing API or database enforcement;
- **DEF:** a genuine authorization or record-integrity defect.

| # | Finding | Class | Evidence |
|---|---|---|---|
| **D1** (SI-D03) | **A former school keeps account-level power over a person. Reproduced: F37-S01 is red** (school X's admin reset the recovery of a learner who transferred to Y, and of one who withdrew; each lost every session).  `recovery_assist_school` (recovery reset) and `authorize_card_reissue` grant authority over any person holding the school's **permanent** registration number. School A's admin can therefore still reset the recovery of a person who has moved to school B. That forces a new PIN and ends **all** their sessions, B's included. It breaks «one school never disables another school's affiliation» | **DEF** | `recovery_assist_school` (the institutional-identities branch); `authorize_card_reissue` (`ii … can_on_node('CAN_PROVISION_PEOPLE', ii.institution_id)`); `admin_reset_recovery` → `sesi_akhiri_orang` |
| **D2** | **An ungoverned write path ends enrollments.** `authenticated` holds table UPDATE and INSERT on `enrollments` and `memberships`. RLS lets a School Admin update them, and `enrollments_guard` allows ACTIVE → ENDED. So an enrollment can be ended through PostgREST: any `end_reason` or none, no stated reason, memberships left open. It is still audited by trigger, but the admin takes no governed decision (D-097(d)) | **DB / DEF** | grants; policies `enrollments_update` / `memberships_update`; `enrollments_guard` |
| **D3** | **A departed staff member's name may vanish from history** (inferred). Where a person's only link to the school was a role (no registration number), `person_visible_to_me` stops showing them once the role is revoked. Their authored items, reviews and decisions would then show no name | **DEF** (inferred; a red test proves it first) | `person_visible_to_me` (role branch requires `revoked_at is null`) |
| **D4** | **«Jejak audit» hides who acted and why.** The page selects `id, at, action, target_table, target_id, institution_id, build_sha`; `actor_person_id` and `summary` (the reason) are captured but never shown. `transfer.*` and `enrollment.ended` have no copy («Perubahan tercatat»). `identity.session_ended` reads «Keluar dari PINTAR» even when an administrator ended it | **UI** (the audit itself is sound) | `src/app/konfigurasi/page.tsx:229`; `hle.ts` |
| G1 | **No way to end a learner's enrollment**: graduation, withdrawal, relocation abroad, or a school outside PINTAR. The enum exists | **UI + DB** | no function sets COMPLETED or WITHDRAWN |
| G2 | **No way back for a returning learner.** The intake refuses a person who already holds the school's registration number, and creates a new person otherwise («NO MATCHING IS DONE») | **UI + DB** | `20261014100000:37`, `20261006100000:587` |
| G3 | **Staff departure is a role-by-role revocation, one free-text reason each.** It has no category: retirement, resignation, dismissal, transfer and «recorded in error» are indistinguishable | **UI** (R: `revoke_role`) | «Peran & akses» → «Alasan» → «Cabut» |
| G4 | **No reason categories anywhere.** Reasons are free text (roles, transfers, recovery) or internal codes (membership close). There is no «Other» with an explanation, and no correction category | **UI + DB** | §3 |
| G5 | **The effective date is always `now()`.** A departure cannot be recorded as of the day it happened | **DB** | every path |
| G6 | **No temporary access restriction** (security, disciplinary, administrative) at any layer, and no restoration other than the recovery reset | **UI + DB**; owner decision (§6) | — |
| G7 | **No staff affiliation with a second school.** D-049 blocks school B's direct grant (good). No workflow exists (D-049(d)); re-importing at B creates a **duplicate person** | **UI + DB** (larger) | D-049(b–d) |
| G8 | **Missing refusal tests:** a cross-school `revoke_role`, and a cross-school enrollment UPDATE. The code refuses both (inferred), but no test proves it | **test** | F01-T04 covers grants only |
| R1 | Learner transfer between PINTAR schools: request, accept, execute, both schools audited, history snapshot | **R** | `transfer_minta/terima/execute`; F01-T10, F24-P0x |
| R2 | Class move and year rollover | **R** | `move_learner_to_class`, `period_rollover` |
| R3 | History is append-only. DELETE is refused on persons, enrollments, memberships, roles, transfers, identities and `audit_log` (INV-18, INV-23). Results, certificates and authorship point to `person_id`. Certificates keep `name_as_issued` | **R** | F01-T09, F01-T11 |
| R4 | `sesi_akhiri_orang`: ending every session of a person (now used only by a credential replacement) | **R** | D101-S01/D01/A01/A02 |
| R5 | A returning educator at the same school: a new role grant (the registration number persists) | **R** | (inferred) |

## 3 · The scenarios

| Scenario | Today | With the essential scope (§5) |
|---|---|---|
| **Retirement, resignation** (educator) | Revoke each role; free-text reason; authority ends; session lingers; the name may disappear (D3) | One «end at this school» action over the person's roles: a category, an effective date, «Other» explained; the name kept |
| **Dismissal** | As above. No immediate sign-out other than the recovery reset, which is a misuse | As above, with the category `DISMISSAL`. Ending sessions follows the §6 ruling |
| **Educator transfer** to another PINTAR school | Revoke at A; B cannot grant (D-049), so B re-imports, which creates a **duplicate person** | Ending at A: category `TRANSFER`. Joining B stays the Platform Administrator granting on the **existing** person, until G7 |
| **Graduation** | Impossible; the learner stays ACTIVE | End the enrollment: `COMPLETED`, category `GRADUATION`, memberships closed in the same transaction |
| **Withdrawal** | Impossible | `WITHDRAWN`, category `WITHDRAWAL` / «Other» explained |
| **Relocation abroad, or a non-PINTAR school** | Impossible: the transfer needs a PINTAR destination | `TRANSFERRED_OUT`, category `RELOCATION` / `TRANSFER_EXTERNAL`, destination free text |
| **Transfer** between PINTAR schools | Works (R1) | unchanged |
| **Return**, same school (learner) | Refused, or a duplicate | Re-enroll the **same** person and registration number; their history is still theirs |
| **Return**, same school (educator) | Works (R5) | unchanged |
| **Several schools** | Roles are per school (good). A former school can still reset the person everywhere (D1) | D1 closed: account-level acts only from a school where the person is **currently** placed, or by the platform |
| **Recorded in error** | Indistinguishable from a departure | category `CORRECTION` on each end action, shown as a correction in the record |

## 4 · Reason categories (proposal for Daisy and the owner)

- Each list is context-specific. «Lainnya» requires an explanation of 10–300 characters.
- A category is stored as a checked code beside the free-text explanation.
- Shown in both languages from `hle.ts`.

| Action | Categories |
|---|---|
| End an educator at this school | `RETIREMENT` Pensiun · `RESIGNATION` Mengundurkan diri · `DISMISSAL` Diberhentikan · `TRANSFER` Pindah tugas · `CONTRACT_END` Masa tugas selesai · `CORRECTION` Salah catat · `OTHER` Lainnya |
| End a learner's enrollment | `GRADUATION` Lulus · `WITHDRAWAL` Mengundurkan diri / keluar · `RELOCATION` Pindah domisili (termasuk ke luar negeri) · `TRANSFER_EXTERNAL` Pindah ke sekolah di luar PINTAR · `CORRECTION` Salah catat · `OTHER` Lainnya |
| Re-enroll / restore | `RETURN` Kembali bersekolah · `CORRECTION` Membatalkan salah catat · `OTHER` Lainnya |
| Temporary restriction (if ruled, §6) | `SECURITY` Keamanan akun · `DISCIPLINARY` Disiplin · `ADMINISTRATIVE` Administrasi · `OTHER` Lainnya |

## 5 · Proposed minimal 4.0 correction scope

### Essential: safety and completeness (proposed for 4.0)

| # | Change | Reuses | Size |
|---|---|---|---|
| E1 | **Close D1.** A school's account-level acts (recovery reset, card reissue) require the person's **current** placement there: an ACTIVE or PENDING enrollment, or a live role. The permanent registration number alone no longer suffices; the platform is unchanged | `recovery_assist_school`'s own enrollment and role branches | 1 day |
| E2 | **Close D2.** Ending an enrollment or membership only through governed functions. Revoke the table UPDATE/INSERT on `enrollments` and `memberships` from `authenticated`, after an inventory of every app write (intake, rollover, transfer, move, and whether they already go through functions) | existing RPCs | 1–2 days |
| E3 | **End a learner's enrollment** (G1): one governed function and a Konfigurasi «Murid» action. It takes the category (§4) with «Other» explained, the effective date, and the actor. It closes the memberships in the same transaction, as `transfer_execute` already does, and writes an audit row. | `transfer_execute`'s closing logic; INV-17 | 2–3 days |
| E4 | **Re-enroll a returning learner** (G2): a new enrollment for the **same** person and registration number, with a category and reason; never a new person | the enrollment and membership guards | 1–2 days |
| E5 | **End an educator at this school** (G3): one action revoking all of the person's roles at this school, with category, effective date and reason. Each revocation is written once; restoring is a new grant | `revoke_role`, `role_assignments_guard` | 1–2 days |
| E6 | **Keep the name** (D3): a person who held a role at the school stays visible to that school's administrators after revocation. Red test first | `person_visible_to_me` | 0.5 day |
| E7 | **A usable audit trail** (D4): «Jejak audit» shows the actor, category, reason and effective date; copy for `transfer.*`, `enrollment.ended`, the end reasons, and an administrator-ended session | the existing audit rows | 1 day |
| E8 | **Refusal tests** (G8): cross-school revocation, enrollment end and re-enrollment refused; one school cannot touch another's placement | — | within the above |

**Effective date in E3–E5:**
- It is the **date of the departure as a fact**: today, or an earlier date, never a future one.
- Access ends when the action is recorded.
- Scheduling a future end is an enhancement (below).

**Total:** about **8–12 engineering days** plus Sharon's and Daisy's review. This is 4.0-foundation work, step 1 of
O41-6. It moves the 4.1 forecast unless the owner places part of it elsewhere (§6).

### Enhancements that can wait (4.1 or 4.5)

- **Future-dated ends**, with a scheduled execution.
- **Staff affiliation with a second school** (G7, D-049(d)), and **duplicate-person matching** at intake. These are
  an integrity risk, but a larger design. Interim: the Platform Administrator grants on the existing person, and the
  runbook says so.
- **Platform-wide account deactivation** (for example after a death), and anonymisation (`anonymized_at` is unused).
- **An orderly school exit** (D-110).
- A combined people-lifecycle history view per person.

## 5b · Owner rulings (9 Nov), which supersede §6 where they answer it

**Who does what:**

| Action | Authorized administrator |
|---|---|
| Suspend or reactivate an entire PINTAR identity | **PINTAR Administrator only** |
| End an educator's employment or school affiliation | School Administrator, own school |
| End a learner's enrollment (graduation, withdrawal, relocation) | School Administrator, own school |
| Restore a person's school affiliation or enrollment | School Administrator, within governed rules |
| Reset account recovery | an authorized administrator of a **currently affiliated** person, subject to Sharon's review (SI-D03) |

**Platform-level suspension:**
- It needs a mandatory reason category, an optional note and an audit record.
- It is enforced immediately, across active sessions and protected operations.
- Reactivation needs a reason and an audit record.
- It never deletes or alters historical educational evidence.
- Normal retirement, graduation and transfer use the affiliation and enrollment lifecycle, never suspension.
- A School Administrator never globally suspends a person who also teaches or studies at another school.

**SI-D03:**
- The red test stays at `6070cd60` until Sharon's independent review.
- The fix removes authority based on a historical registration number. It keeps legitimate **pending-onboarding**
  assistance: a current, authorized onboarding relationship, not the mere existence of a number.

**The 4.0 scope:** essential completion work covers:
- reliable departures, with reasons and auditability;
- historical attribution preserved;
- safe return and re-enrollment;
- platform suspension (E1–E8 plus the suspension).

Future-dated scheduling can wait; a departure is recorded with immediate effect. The 8–12 days (plus about 2–3 for
suspension) is a planning estimate, not a commitment, until Sharon and Daisy have reviewed the design.

**Order:**
1. Sharon's security and data review, and Daisy's administrator-flow review.
2. Then implementation.
3. The Kelas 5 → Kelas 6 demonstration reports what the existing interface does before any change is proposed.

**The benchmark for simplicity:** select the class's learners, choose their next grade, review the exceptions (repeat,
transfer, withdraw), confirm.

## 6 · Decisions for the owner (as asked; answered by §5b)

1. **Temporary restriction and account suspension** (G6). Should 4.0 have an account-level suspension that blocks
   sign-in and every request?
   - **Recommendation:** the **PINTAR Administrator only**, for the account (security). Reuse `sesi_akhiri_orang`, plus
     a restriction checked in the existing pre-request hook. Restoration is by the same role, and both are audited
     with a category.
   - **School Administrators** restrict only what is theirs: they end or pause roles and enrollments at their school
     (E3, E5). They never restrict an account that other schools rely on.
   - Size: about 2–3 days if ruled into 4.0.
2. **Sign-out on dismissal.** Should ending an educator with category `DISMISSAL` or `SECURITY` also end their
   sessions?
   - **Recommendation:** only where the person holds no role at any other school. Otherwise the request goes to the
     PINTAR Administrator, so that one school never signs a person out of another.
3. **Where E1–E8 sit:**
   - E1, E2 and E6 are defects. **Recommendation:** fix them in the System Integrity Gate (4.0).
   - E3–E5, E7 and E8 are completeness work. **Recommendation:** also 4.0, since a school cannot run a year without
     graduation and withdrawal.

## 7 · For Sharon (authorization, identity uniqueness, historical evidence), read-only, on `f37fd20e`

Please answer each: verified, or a finding with a reproducible case.

1. Is **D1** a defect as described? Is «current placement» (an ACTIVE/PENDING enrollment or a live role) the right
   authority for a school's account-level acts? Is there any other function that authorizes on
   `institutional_identities` alone?
2. Is **D2** reachable through PostgREST by a School Admin? Should E2 revoke the table writes, or should the guard
   require a governed context?
3. **D3:** is a departed staff member's attribution lost to the school's readers? Which readers should keep it?
4. **Identity uniqueness:** do E4 (re-enrollment of the same person) and the interim for G7 (the platform grants on the
   existing person) keep D-049(c)'s «never a duplicate person»? What else creates a second person for one human?
5. **Evidence:**
   - After E3, does any report, certificate or integrity record change for the ended learner?
   - Should the ended learner's own results stay readable to the learner and the school, as with a transfer?
6. **Restoration:** is «a new grant / a new enrollment, never reopening a closed row» right for every layer?
7. **Effective date:** is «a past date recorded as fact; access ends at recording» sound for evidence and audit?

## 8 · For Daisy (the administrator journey), on `f37fd20e`

1. **Today's journey:**
   - Staff leave through «Peran & akses» → «Alasan» → «Cabut», one role at a time.
   - A learner leaves only through «Perpindahan murid».
   - «Jejak audit» shows no actor or reason.
   - Where would an administrator look first for «Pak X retired», «Ani graduated» or «Budi moved abroad»?
2. **The proposed actions**, «Akhiri di sekolah ini» (educator), «Akhiri pendaftaran» (learner) and «Daftarkan kembali»
   (return):
   - their place in Konfigurasi «Murid» and «Staf dan akses»;
   - the reason lists in §4 and their wording;
   - «Lainnya» with its explanation;
   - the effective date (past or today);
   - one confirmation that names the person, the school and what ends («Ani tidak lagi dapat mengerjakan asesmen di
     sekolah ini; hasilnya tetap tersimpan»);
   - restoration.
3. **The states:** empty, refused (another school's person), already ended, a correction, and how a correction reads
   in «Jejak audit» and on the person's record.
4. **Graduation of a whole class at year end:** one learner at a time, or a class at once? This is a design decision
   that changes E3's size.

## 9 · «Easy to join. Easy to leave. Never held hostage.» (owner, 9 Nov): closure and deletion

This is read-only: what exists, then the smallest coherent proposal. Nothing is built.

### What exists

| Area | Today | Evidence |
|---|---|---|
| **Sign out everywhere** (self-service) | **Works:** «Keluar dari semua perangkat» on «Akun saya» | `src/app/akun/page.tsx` (`KeluarSemua`), D-055(g) |
| **Remove one's own photo** | **Works** | `akun.foto.hapus` |
| **«Akun saya» for learners** | **Missing:** a learner is refused the page (`auth.not_yet`), so a learner has no place to see or leave their account | `src/app/akun/page.tsx` (`if (!staf)`) |
| **Close one's account** | **Missing:** no action, request or state; `persons` cannot be deleted (`persons_no_delete`) | — |
| **Request deletion of personal data** | **Missing:** `persons.anonymized_at` exists, and two readers already skip anonymized persons, but nothing sets it | `20260912004321:16`; `20261004110000:49`; `20261017100000:93` |
| **Retention** | **Not built.** `institutions.retention_days` is unused. OD-5: «architecture resolved; legal durations open», and inventing legal periods is forbidden. Backups outlive deletion: 7 days today, then 35 days and 12 months once the off-site copies are active | `docs/product/SCHOOL-DATA-EXPORT-4.0.md` §D; D-103; D-107 D4 |
| **Legal gate** | **Blocked, external:** UU PDP, controller/processor, retention, **parental consent** (F-16, W9.11). No real student data until it closes (D-117(m)) | `F-OWNER-DECISIONS-REQUIRED-2026-11-02.md:51` |
| **A school leaving PINTAR** | A principle (D-110 «NO HOSTAGE DATA»); an orderly exit journey is a 4.5 candidate | D-110(b)(d) |

### Four things that must never be confused (for Daisy's wording and Sharon's boundaries)

| Action | Who starts it | What it does | What it never does |
|---|---|---|---|
| **End a school affiliation** (§5, E3–E5) | the School Administrator, own school | that school's access ends; the person's account and other schools are untouched | close the account |
| **Close my account** | **the person** (for a learner: owner decision 1) | sign-in ends everywhere; the person is told what is kept and why | delete records that have a retention requirement |
| **Delete my personal data** | **the person** (or their guardian) | removes or anonymizes personal data that has no retention requirement | rewrite an academic record, a certificate or an audit row |
| **Suspension** (§5b) | the **PINTAR Administrator** only | a security, disciplinary or administrative restriction | anything the person asked for; it is never presented as closure |

### What each departure should say happens (the explanation Daisy designs; Sharon checks every line is true)

- **Access:** when sign-in stops, and at which schools.
- **Personal data:** what is removed (photo, contact email, display name where not required) and what is kept, with the
  reason and the period.
- **Academic records:** results and sittings stay with the school, attributed. After deletion, the attribution becomes
  anonymized.
- **Certificates:** each stays verifiable. `name_as_issued` is the certificate's own record (INV-30).
- **Audit history:** append-only (INV-18). An audit row is not rewritten; it may point to an anonymized person.
- **Backups:** data removed from PINTAR stays in backups until they age out (7 days today). This is said plainly.

### Proposed smallest coherent implementation

**For 4.0** (no legal duration needed):
- **L1 · Akun saya for everyone.** Learners included. A plain «Meninggalkan PINTAR» section explains the facts above,
  truthfully about today's retention.
- **L2 · Self-service requests.** «Tutup akun saya» and «Hapus data pribadi saya»:
  - one clear confirmation that names the consequences;
  - no retention offers, no detours, no support email;
  - recorded as a request the person can see (received → in progress → done, or why not), and audited;
  - routed to the PINTAR Administrator's queue.
- **L3 · Closure executed.** By the platform-suspension mechanism the owner has approved, with its own category
  (`CLOSED_AT_REQUEST`), never shown as a suspension: sessions end, sign-in is refused, records are kept. Reopening is
  by the person's request.
- **L4 · Deletion of what needs no retention.** Photo, contact email, and the display name replaced by an anonymized
  label, setting `anonymized_at`. Only where Sharon confirms no record depends on them. Everything with a possible legal
  retention is listed in the person's request as «disimpan sesuai ketentuan», and never deleted by invention.

About **4–6 engineering days**. L3 shares the suspension work.

**Waits for counsel (F-16 / OD-5):**
- retention durations;
- deleting or anonymizing records that have a legal retention requirement;
- whether a learner (a child) may close or delete alone, or only with a guardian or the school;
- backup purging.

**Waits for 4.5:** a school leaving PINTAR (D-110(d)).

### Owner decisions

1. **For a learner** (SD, a child), who may request closure or deletion? The learner, a guardian through the school, or
   the school on the family's request? This is pending parental consent under F-16.
   - **Recommendation for 4.0:** the request is made by the school's administrator on the family's behalf, and the
     learner's own page explains how.
2. **Closure:**
   - **Option 1:** executed immediately on the person's confirmation (pure self-service).
   - **Option 2:** executed by the PINTAR Administrator within a stated time, to check that no school process is in
     progress, such as an open sitting.
   - **Recommendation:** immediate for staff and adult accounts. A sitting in progress is drained or contained first,
     never lost.

### For Sharon (privacy, identity integrity, retention boundaries)

1. Which personal fields can be removed today without breaking an academic record, a certificate, the audit log or
   identity uniqueness?
2. Does an anonymized person keep exactly one identity (no duplicate on return)?
3. What must a closure block (sign-in, the pre-request hook, recovery, service-role work)?
4. Is every line of the departure explanation true of the current code and backups?

### For Daisy (leaving as easy as joining)

1. Where «Meninggalkan PINTAR» lives for each person (learner, teacher, administrator).
2. The two requests' wording, the single confirmation, and the status page.
3. How «akhiri di sekolah ini», «tutup akun», «hapus data pribadi» and a suspension read unmistakably differently.
4. That no step is a dark pattern: no guilt copy, no buried link, no forced support contact.

## 11 · Educator roles and responsibilities (owner directive, 9 Nov): design for review before build

**The benchmark:** find the person → select their responsibilities → review → confirm.
- «Pak Yusuf remains a Mathematics teacher. He is now also Head of Department.» And later, the reverse.
- One person, several responsibilities.
- A formal position is never PINTAR authority (D-059(c, d)).

### What exists (read-only inventory of the code, 9 Nov)

**The role model:**
- `role_assignments` rows are dated, immutable and audited (`role_assignments_guard`; `role.granted`/`role.revoked`
  with from/to, reason and actor role).
- One person may hold several roles at once. Duplicates are refused per (person, role, place).
- Self-grant is refused. SYSTEM_ADMIN is platform-only.
- A School Admin may grant INSTITUTION_ADMIN only at the school's own node, after a second press (D-101(2)), and
  EDUCATOR, HEAD_OF_DEPARTMENT and DEAN only within their own school (D-049).

**The capability registry:** `role_capabilities(app_role)` (`20260926100000`) is the one central definition.
- EDUCATOR: draft, assign learning, quick assessment, roster, results.
- HEAD_OF_DEPARTMENT: that, plus review, freeze, question health, integrity review.
- DEAN: roster only.
- INSTITUTION_ADMIN: administration, including provisioning.
- Management decisions are open to HEAD_OF_DEPARTMENT/DEAN by role, not capability (`20260924110000`). The matrix
  must show this too.

**Attribution and queues:** work is attributed to the person, not the role. Since `20270112160000`, a former
role-holder stays visible to the school's admin. Decision queues follow the place: after a demotion, pending items
fall to whoever now holds the role there, and to nobody if no one does
(`management_decision_independent_decider`). Nothing warns the admin.

**The UI today:** «Peran & akses» lists grants and offers «Cabut» (with a reason) and «Berikan peran» (person, role,
Lingkup, «Berlaku sampai»).
- There is no per-person view.
- A change takes two separate actions.
- There is no preview of what is gained or lost.
- `grant_role` has no `valid_from`, so a grant starts now.

| Journey | Today |
|---|---|
| Guru → Guru + Kepala Departemen | works, as a second grant |
| Kepala Departemen → Guru | works, but not atomic; the queue may be left without a decider and nobody is warned |
| Department transfer | partial: revoke then grant, so access may lapse or overlap in between |
| Guru → Admin Sekolah | works, with the D-101 second press |
| Acting appointment | an end date works; no future start date, no label (4.1) |

### The proposed 4.0 design: smallest, reusing everything

**1. Read: `peran_orang(person)`, a definer function for the person's school administrator (or the platform).**
- It returns the person's live roles at the caller's school: role, place (named), and «Berlaku sampai».
- For each role, it gives the responsibilities that role carries, derived from `role_capabilities` plus the
  management-decision rule. No list is maintained by hand.

**2. Preview: `pratinjau_ubah_peran(person, changes)`, read-only.** For a proposed set of roles to add and remove, it
returns:
- **gained, retained and lost** responsibilities, each with the place it applies to;
- **not granted:** School Admin and Platform Admin unless explicitly chosen, and nothing in other departments or
  schools;
- what needs **higher authority** (INSTITUTION_ADMIN: its confirmation; SYSTEM_ADMIN: never from a school);
- a **queue warning:** for each HEAD_OF_DEPARTMENT/DEAN role removed, the places whose pending decisions would be left
  with no independent decider;
- a fingerprint of the person's current roles.

**3. Apply: `ubah_peran(person, add, remove, reason, fingerprint)`, one transaction.**
- It takes an advisory lock per person, so concurrent changes serialize.
- It refuses a stale preview (the fingerprint differs).
- It revokes and grants through the existing guards, so every rule is kept.
- One reason (required), and one `role.changed` audit row naming the revocations and grants beside the existing
  per-row audit.
- All or nothing.
- Authority ends at the next request: capabilities are read live, so no session needs to end.

**4. Screens (Daisy):** «Staf dan akses» → the «Staf sekolah» list, one row per person (her earlier review) → the
person's page: current roles and their responsibilities → «Ubah peran & tanggung jawab». The flow then:
1. add, keep or remove a role;
2. review gained, retained, lost and not granted, with the place of each;
3. the queue warning, if any;
4. the reason;
5. one confirmation;
6. the result.

**Red tests first:**
- **Atomicity:** one invalid addition means nothing changes.
- **Scope:** nothing in another department or school; never SYSTEM_ADMIN; INSTITUTION_ADMIN only with its
  confirmation.
- **Concurrency:** a stale preview is refused.
- **Demotion:** authority ends immediately while teaching stays.
- **Queues:** the warning appears for an unattended queue, and pending decisions stay visible to the next reviewer.
- **History:** attribution is kept.
- **Journeys:** Pak Yusuf's promotion and demotion, and a department transfer with no gap and no overlap.

**4.1 (owner):**
- formal job-position records distinct from roles, with dated history;
- employment movements;
- acting-appointment labels;
- future-effective role start dates.

### For Sharon (pre-build)

1. Who may grant and revoke each role through `ubah_peran`: do the existing guards suffice when called inside one
   definer transaction?
2. Scope boundaries and escalation: can any combination of additions and removals reach SYSTEM_ADMIN, another school,
   or an INSTITUTION_ADMIN grant without its confirmation?
3. Atomicity, the per-person lock, and the stale-preview fingerprint against concurrent changes.
4. Revocation timing: capabilities are read live, so is anything cached in a session that must also end?
5. Audit completeness of one `role.changed` row beside the per-row audit.
6. Pending-decision ownership: is "warn, never reassign" right? Should a change that leaves a queue without a decider
   be refused rather than warned?
7. Do platform-only privileges stay unreachable from every school path?

### For Daisy (pre-build)

1. The person-centred flow above, in PINTAR's design grammar, in both languages, accessible, and usable on a phone.
2. **The matrix:**
   - responsibility names for the registry's capabilities (no codes);
   - checkmarks only where they help;
   - three kinds kept visibly distinct: inherited from a role held, available to assign, unavailable to this
     administrator.
3. The review screen's gained, retained, lost and not-granted wording, for both Pak Yusuf journeys.
4. The queue warning's wording, and what the administrator can do about it.
5. How this sits beside «Akhiri di sekolah ini» (the person leaving the school) without confusion.
