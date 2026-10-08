# PINTAR 4.0 · L3 · BOB19-K01, Option B: impact assessment and smallest safe plan

**8 October 2026. For the Second Eye and the owner. No code has changed.** Option B is approved in principle for impact assessment only. This page:
- establishes how the first-administrator appointment can be told apart from ordinary grants;
- checks that narrowing the picker strands no new school;
- lists the journeys that change;
- proposes the smallest safe implementation and its risks.

No L4 and no production change.

## 1. What the code does today (f27ffb3)

| Where | The roles form's person picker offers |
|---|---|
| Admin sekolah, Mengelola · their school | «Belum memiliki peran»: **the school's own** recorded people who hold nothing there (`persons_awaiting_first_role_at(school)`), plus people already known |
| **Admin platform, Mengelola · a school** | The school's own list as above, **plus the platform's whole list**: every person anywhere who holds no role, enrolment or transfer (`persons_awaiting_first_role()`; id and name only) |
| Admin platform, «Seluruh platform» | The platform's list, but the scope picker offers **no school** (`lingkupPeran(platformKonteks ? [] : nodes)`), so no school-scoped role can be given there |

**Why a first administrator needs the platform list.** The operator makes them on Aktivasi, «Orang baru di luar pendataan». That route's `NEW_PERSON` branch is «a SYSTEM_ADMIN's path to someone no institution has», so the person is recorded at no school and cannot appear in any school's own list. Golden School GS-02/03 (G2 then G3), journey S3/S4 (SD) and L3A (SMA) all appoint this way.

**The database.** `role_assignments_guard` lets an active SYSTEM_ADMIN grant any role at a school to anyone. A school-scoped grant by anyone else needs INSTITUTION_ADMIN scope over the node **and** a person the school has (an institutional identity there; D-049). Every grant records its grantor and is audited.

## 2. Telling bootstrap apart from ordinary grants

A school is **awaiting its first administrator** exactly when it has no active `INSTITUTION_ADMIN` assignment. That is the state D-101 (2) already relies on: a school admin appoints another; before that, only the platform admin can.

**The bootstrap appointment** is then fully determined:
- **Who:** the actor is an active SYSTEM_ADMIN.
- **Where:** in Mengelola · that school, which is not yet administered.
- **What:** the role is `INSTITUTION_ADMIN`, at the school's own root node.
- **To whom:** a person from the platform's unattached list.

**Any other grant is ordinary.** Its candidates are the school's own recorded people, plus people already known there.

**No school is stranded:**
- **Before the first administrator:** the bootstrap form is offered.
- **After it:** the school admin, or the platform admin in the school's context, records new staff with the school's own tools. That is Pendataan's «Menambahkan orang» (an institutional identity at the school), then Aktivasi; those people then appear in the school's own list.
- **If every administrator is later revoked:** the school is unadministered again, so the bootstrap form reappears. Recovery needs no SQL.

## 3. Journey impact (checked before any change)

| Step | Today | Under B |
|---|---|---|
| GS-02/03 G3 (staging), S4 (SD), L3A (SMA) | First administrator from «Orang baru» | **Unchanged path:** bootstrap form. Each happens while the school has no administrator (checked: G3 asserts `hibah = 0` first; S4 is SD's first; SMA has none before L3A). The walks need their selector updated to the bootstrap form |
| **S16** (journey.mjs:899–902) | Gladys makes the Kepala departemen with «Orang baru», then grants HEAD_OF_DEPARTMENT at SD (SD already has an admin) | **Breaks as written.** Restated: the person is recorded at SD with SD's own tool (Pendataan, as C12b's `stafBaru` does), then granted from SD's own list |
| **S24 follow-up** (journey.mjs:3773) | The platform admin re-appoints that Kepala departemen from the platform list | Follows S16: once recorded at SD, she is in SD's own list after the revocation, and is re-appointed from there |
| **C12c guruSma** (c12.mjs:157–162) | «Orang baru», then EDUCATOR at SMA, which has no administrator yet | **Breaks as written:** an ordinary role in an unadministered school. Restated: recorded at SMA with SMA's own tool, then granted, or the walk first gives SMA its administrator (L3A's order) |
| All school-admin grants (S5ff, C12b `stafBaru`, D-101, BOB20) | The school's own list | Unchanged |

Three journey steps are restated, each to the path a real school uses, and one walk selector changes. No PASS criterion is relaxed.

## 4. The smallest safe implementation (proposed; not started)

1. **Konfigurasi, Mengelola · a school, Admin platform** (`src/app/konfigurasi/page.tsx`):
   - Ask the platform's list **only while the school has no active Admin sekolah**, from the assignments already read for the school.
   - Draw it as its **own small form**: «Jadikan admin sekolah?» (existing copy, `config.angkat.judul`) with its existing meaning sentence (`config.angkat.arti`).
   - The form carries a person from that list. Role (INSTITUTION_ADMIN) and scope (the school's root) are fixed fields, not choices.
   - **The general roles form offers the school's own people only**, for everyone.
2. **The server action** (`grantRoleAction`): before calling the database, refuse a grant whose person is not the school's own unless every bootstrap condition holds (§2). This puts the rule on the server, not only in the picker. A forged form post therefore cannot use the platform list for an ordinary grant.
3. **The database: no change proposed for 4.0.**
   - The guard already refuses every cross-school grant by a non-platform actor, and audits all grants.
   - Tightening SYSTEM_ADMIN itself in the guard would be a migration and a wider authority change. That is offered as a separate option if wanted, not part of the smallest plan.
4. **Tests:**
   - **Static:** BOB19-K01 restated by the ruling. The platform list is asked only in the bootstrap state, and the general form never draws it.
   - **App test** (a new one, like F22-A01), with the following parts:
     - **Bootstrap succeeds:** the platform admin, in a new school with no administrator, sees the bootstrap form with an unattached person. Granting succeeds, at the school root, as INSTITUTION_ADMIN, audited.
     - **After that, no platform list:** the same unattached person is no longer offered, and a forged POST with that person and EDUCATOR is refused by the server action.
     - **Existing refusals hold:** a school admin of A is refused a grant at B, and refused the platform list (`persons_awaiting_first_role` raises). The test cites the existing D101/BOB20 coverage and adds what is missing.
     - **Red proof:** red against the current code, green after.
   - **Journeys:** S16, S24's follow-up and C12c restated (§3); the GS G3 selector updated; one CI run plus journeys; one Golden School GS-02/03 walk on staging.

## 5. Risks and open points

| Risk | Mitigation |
|---|---|
| **Requirement 3 needs words that do not exist yet.** The existing copy says «Jadikan admin sekolah?» and what an administrator does. No existing sentence tells the operator that the candidates are people **not recorded at any school** | One sentence from the owner, or from Dr Gladys's terminology review, before implementation. No word will be invented. Without it, the form ships with the existing copy only, and requirement 3 is met by its heading and fixed role alone |
| A refusal sentence for the server-side rule | Reuse an existing refusal code where one fits (the D-049 / role-guard family). If none fits, it waits for approved words like any other copy (BOB51 requires a sentence for every code) |
| Three journey steps restated | Each restatement follows the path a school really uses, and is marked with the ruling. The criteria audit's method applies again |
| Allowance | About 125 estimated minutes (one CI run, one journeys run, main's E1, the GS-02/03 walk and a facts check). 588 remain |
| A school whose administrators are all revoked | Covered by the definition (§2): the bootstrap form reappears |

## 6. Asked

1. **Approve this plan** (§4, steps 1, 2 and 4; no database change), or ask for the guard tightening as well.
2. **Provide the operator sentence** for requirement 3, or accept the existing copy only.
3. **Confirm the journey restatements** in §3.

Final L3 GREEN stays held. The journey suite's status will be stated as it is: **75 PASS and 1 governed FAIL (S23q, CR-52, D-123)**, not a fully green suite.
