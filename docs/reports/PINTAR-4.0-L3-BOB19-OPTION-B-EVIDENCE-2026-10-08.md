# PINTAR 4.0 · L3 · BOB19-K01, Option B: implementation evidence for the Second Eye

**8 October 2026.** This page answers the owner's product ruling of 8 October («Approve Option B for a narrowly scoped implementation»), point by point. It does **not** declare L3 GREEN; that verdict is the Second Eye's. No L4. No production change.

Code head: **bf18bc0**, proven by CI and fast-forwarded to main under E1. Two commits follow it: the Golden School walk request (7e4d6c4, a staging request file) and this report (documents only). Neither touches code.

| Evidence | Result |
|---|---|
| CI **37739842180** on bf18bc0 | **18 of 18 jobs succeeded** (baseline, build, both migration paths, every red case, the strict self-test contract, the verdict) |
| Journeys **37739845001** on bf18bc0 | Job A: **«Crawl A GREEN»**. Job B: **75 PASS, 1 FAIL**. The FAIL is **S23q (CR-52, governed by D-123)**, as in every run since D-123. The suite is not fully green, and this page does not say it is |
| Full local suite, fresh seeded database | **646 passed, 0 failed** (1 justified local-only skip, as before); `tsc` 0 errors; ESLint 0 errors |
| Main | Fast-forwarded to bf18bc0 (E1). Main's own `ci` run **37742974393** cancelled itself by proof reuse. Note: this time its baseline job was also cancelled before finishing (in the previous ALREADY PROVEN run, 37729629430, it had passed). The commit's full proof, baseline included, is 37739842180. **Main's head is now 9a37114** (bf18bc0 plus the walk request and this report). E1 reuses proof on main only for the identical commit, and the walk-request file is not in CI's path exclusions, so main ran in full: **ci 37743909195 on 9a37114, 18 of 18 jobs succeeded**. I had expected a documents-only landing; that full run (72 estimated minutes) was my misjudgement, recorded below |
| Staging | No migration (177 unchanged). **environment-facts 37743180546 (read only): success**: staging's app runs bf18bc0 and its database main's migrations |
| Golden School on staging | A new school, **Sekolah Uji Penutupan BOB19**, was founded by found-school.yml **37743250063** (GS-00 green inside it). An earlier attempt, 37742992546, was refused by its own GS-00 gate because staging had not yet deployed bf18bc0; nothing was written. **staging-golden-school 37743344493 (walk 7e4d6c4 against the app at bf18bc0): success**, GS-00 included. The walk exits non-zero on any FAIL and counts any error as a FAIL, so G0–G5 all passed. **G3** made the first administrator through «Menunjuk admin sekolah pertama» and its confirmation. **G5** read back one active Admin sekolah at the root, made by the operator, audited, and no other role in the school |

## 1. No migration; the database's authorization and audit, verified

No file under `supabase/` changed (`git diff cf72af7..bf18bc0 -- supabase` is empty). What the database already does, read from the latest definitions and exercised by F22-A02:

- **`role_assignments_guard`** (latest: `20261122100000_a_school_resolves_its_own_recovery.sql`) re-authorizes every grant:
  - no self-grant; the grantor is recorded (`granted_by`);
  - SYSTEM_ADMIN, or an unscoped role, only by an active SYSTEM_ADMIN;
  - INSTITUTION_ADMIN below a school's own node only by SYSTEM_ADMIN;
  - otherwise the grantor needs INSTITUTION_ADMIN scope over the node and, unless SYSTEM_ADMIN, a person the school already has (D-049).
- **Duplicates:** `refuse_duplicate_active_grant` raises GRANT_ALREADY_ACTIVE (23505).
- **Audit:** `role_assignments_audit` writes every grant and revocation to `audit_log`.
- **The platform's list:** `persons_awaiting_first_role()` raises for anyone but an active SYSTEM_ADMIN.

F22-A02 observes each of these against the running app: the appointment reads `INSTITUTION_ADMIN | the school's root | the operator | audit rows > 0`; a duplicate `grant_role` through PostgREST is refused with GRANT_ALREADY_ACTIVE; another school's administrator is refused the platform's list.

**The database itself was not narrowed.** As the plan said, an active SYSTEM_ADMIN may still grant any school role to anyone at the database. The exception is enforced in the application's server actions (§3), not in the guard. Tightening the guard would be a migration, which the ruling did not authorize.

## 2. The first-administrator path (ruling points 2, 3 and 6)

`src/app/konfigurasi/page.tsx`, with the shared rule in the new `src/lib/admin-pertama.ts`:

- **Offered only** to Admin platform in Mengelola · a school **that has no active Admin sekolah** (`adaAdminSekolah`; a failed read counts as «has one», so the path stays closed).
- **Candidates:** the platform's people who hold nothing (`persons_awaiting_first_role`) **and are recorded at no school** (no `institutional_identities` row anywhere). A failed read gives no candidates.
- **The role and the place are not choices:** Admin sekolah at the school's own root.
- **Two steps:** the first press returns asking for confirmation; the second appoints.
- **The approved words**, exactly:
  - heading `config.pertama.judul`: «Menunjuk admin sekolah pertama»;
  - explanation `config.pertama.arti`: «Sekolah ini belum memiliki admin sekolah. Pilih orang yang belum tercatat di sekolah mana pun untuk menjadi admin sekolah pertama di sekolah ini.»;
  - confirmation `config.pertama.yakin`: «Jadikan orang ini admin sekolah pertama di sekolah ini?»
  - The buttons reuse existing copy: «Berikan peran», «Ya, jadikan admin sekolah», «Batal».
- **For approval:** the copy table requires an English row. The three English sentences are my translation and await approval: «Appointing the first school administrator»; «This school has no school administrator yet. Choose a person not yet recorded at any school to become this school's first school administrator.»; «Make this person the first school administrator of this school?»

## 3. Enforced on the server (ruling points 4 and 5)

`src/app/konfigurasi/actions.ts`:

- **`grantRoleAction` (every ordinary grant):** a school role must name one of the school's own people (`orangSekolah`): recorded there and holding nothing yet, or known there by an active role, an active enrolment or a transfer. That is exactly what the general form offers. Anyone else gets **ACTION_NOT_ALLOWED** before the database is asked, whoever posts the form, Admin platform included. The general form never draws the platform's list in a school's context any more; it asks it only in «Seluruh platform», where no school scope is offered.
- **`tunjukAdminPertamaAction` (new):** asks every condition again, whatever the form sent:
  - the actor is SYSTEM_ADMIN;
  - the school has no active Admin sekolah;
  - the person is among the candidates above.
  - The person is then granted INSTITUTION_ADMIN at the school's root and nothing else. Any failure is ACTION_NOT_ALLOWED.
- Both actions keep the §2.11 context guard (`wajibDalamKonteks`). F22-P05 now counts 54 guarded actions.
- **No new refusal sentence:** ACTION_NOT_ALLOWED is an existing code with existing copy.

## 4. Tests (ruling points 9 and 10)

**F22-A02** (new; app runner; `selftest/app.test.ts`, `selftest/manifest.json`) runs against the running app and its database, posting Konfigurasi's own forms as a browser without script does. It sets up:
- a new school with no administrator;
- P1, recorded at no school and holding nothing;
- P2, recorded at another school;
- P3, a teacher of Alpha.

| Ruling item | What F22-A02 asserts |
|---|---|
| Initial appointment | The section shows the approved heading and explanation and offers P1, not P2; the general form does not offer P1. The first press asks the approved confirmation; the second appoints. The grant is Admin sekolah at the school's root, granted by the operator, with audit rows |
| Forged submission refusal | The general form's action, posted with P1 as Guru and then as Admin sekolah: ACTION_NOT_ALLOWED, 0 roles. The first-appointment action with P2 (recorded elsewhere) or P3 (holds a role): ACTION_NOT_ALLOWED |
| Already-attached person (point 10) | P2 and P3 above |
| Duplicate identity (point 10) | A second first appointment: ACTION_NOT_ALLOWED. The same grant through PostgREST `grant_role`: refused, GRANT_ALREADY_ACTIVE; still exactly 1 active administrator |
| The exception disappears | Once an administrator exists the section is not drawn |
| Cross-school refusal | Alpha's administrator, in Alpha's context, posting a grant at the new school: refused. Their call to `persons_awaiting_first_role`: refused |
| Recovery | The last administrator revoked by the revoke form: 0 active; the section is back offering P1; appointing again: 1 active |

**Red proof.** The pre-change source (cf72af7) was built with the new copy keys added so the test compiles, and F22-A02 run against it. Result: **FAIL**. Among the reasons: «a forged ordinary grant of the platform's person answered …hasil=ok&kode=ROLE_GRANTED; roles at the school 1». With the change: **PASS**, locally and in CI 37739842180.

**BOB19-K01 (static)**, restated by the ruling and strengthened, not weakened. Part 4 now also asserts that:
- the page asks the platform's list only in «Seluruh platform», or for a school's first administrator while it has none;
- `admin-pertama.ts` keeps only people recorded at no school and fails closed;
- the general action refuses a person not the school's own;
- the first-appointment action re-asks all three conditions and grants only Admin sekolah at the root.

## 5. Journeys (ruling points 7 and 8)

Each change is marked in the code with the ruling. Actors, school contexts, roles and assertions are unchanged.

| Step | Before | After | Result in 37739845001 |
|---|---|---|---|
| **S4** (SD's first administrator) | General roles form | **Selectors only:** «Menunjuk admin sekolah pertama» | PASS |
| **L3A** (SMA's first administrator, setup) | General roles form | **Selectors only:** the same path. The administrator is now made once, in C12c (below), and L3A reuses it; L3A's assertions are about Working Context, not this setup | PASS |
| **Golden School G3** (staging) | General roles form | **Selectors only:** the same path | staging-golden-school 37743344493: success |
| **S16** (Kepala departemen) | Gladys: «Orang baru di luar pendataan», then the grant in Mengelola · SD | Gladys, in Mengelola · SD: records her with SD's own tool (Pendataan), activates her (Aktivasi «Aktifkan dengan email»), grants Kepala departemen at Kelas Rendah from SD's list | PASS |
| **S27h** (S24's follow-up: re-appointment) | From the platform's list | From SD's own list, where S16 recorded her | PASS |
| **C12c** (a Guru of SMA, inside C12b) | Gladys: «Orang baru», then Guru at SMA, which had no administrator | Gladys, in Mengelola · SMA: SMA's code saved on Pendataan if absent, the Guru recorded there and activated, then Guru at SMA from SMA's list | C12b PASS (notes: «SMA's first administrator by «Menunjuk admin sekolah pertama»: ok»; «a Guru of SMA Zayd: ok»; the later C-12 refusals of her unchanged) |

**One procedural addition in C12c, stated plainly.** Pendataan offers only schools in which some role exists (`sekolahPendataanSemua` reads the schools of visible role assignments). At C12c, SMA had none, so its own tool could not record anyone. The first local run of the restatement failed on exactly this. C12c therefore first has Gladys give SMA its first administrator by the new path. That is the alternative the impact plan's §3 named («or the walk first gives SMA its administrator»). The actor, school and role of the Guru's appointment are unchanged. The administrator is the same person L3A used to make (Bu Admin SMA), and L3A now reuses her.

## 6. What did not change

- **Database:** no migration; the guard, audit and RPCs are as they were.
- **Other screens:** the school administrator's roles form offers what it did before, the school's own list. The platform-operator grant of SYSTEM_ADMIN in «Seluruh platform» is unchanged.
- **Gates:** none weakened. BOB19-K01 gained conditions. F22-A02 is new and proven red. S23q stays a FAIL.
- **Production:** untouched; no production request file, workflow, secret or setting.
- **Allowance:** **1,517 of 1,900** estimated minutes (383 left). This landing cost 205:
  - CI 75 and journeys 47 on bf18bc0;
  - main's E1 run 3;
  - main's full run on 9a37114, 72. **Avoidable:** landing the walk request on main together with this report triggered it (§ Main above). Lesson: land a staging request file with the next proven code commit, not with a report;
  - two founding runs 3, the walk 1 and the facts check 1, plus small runs since the addendum

## 7. For the Second Eye

- The ruling's ten points are answered above. The one judgement call is C12c's prior first-administrator appointment (§5), taken from the impact plan's own alternative.
- **Awaiting approval:** the three English translations (§2).
- **Open, as before:** the database still lets an active SYSTEM_ADMIN grant any school role to anyone. The narrowing is in the application. A guard-level restriction would need a migration and a separate ruling.
- **No L3 GREEN is claimed.** The journey suite stands at 75 PASS and 1 governed FAIL (S23q, CR-52, D-123).

## 8. The Second Eye's final review: what it asked to be recorded (8 October)

The Second Eye found L3 ready for conditional closure: GREEN with a documented exception for S23q (CR-52), once three things are recorded. Its findings rest on this report; it did not inspect the repository or run the tests. **L3 GREEN, if issued, is the Second Eye's verdict about this layer only, not a statement that PINTAR 4.0 is ready to launch.** L4, Daisy, the unscripted walkthroughs and final human acceptance remain ahead.

### 8.1 The English copy (approved)

The approved English for the three rows, replacing my translations of §2:

| Key | Bahasa Indonesia (approved earlier) | English (approved in the final review) |
|---|---|---|
| `config.pertama.judul` | «Menunjuk admin sekolah pertama» | «Appoint the school's first administrator» |
| `config.pertama.arti` | «Sekolah ini belum memiliki admin sekolah. Pilih orang yang belum tercatat di sekolah mana pun untuk menjadi admin sekolah pertama di sekolah ini.» | «This school does not yet have a school administrator. Choose someone who is not registered with any school to become this school's first administrator.» |
| `config.pertama.yakin` | «Jadikan orang ini admin sekolah pertama di sekolah ini?» | «Appoint this person as the school's first administrator?» |

Checked against the Indonesian: each keeps the exception's scope (a school with no administrator; a person at no school; this school's first administrator only). The review's text ran the heading and the explanation together; they are split here as the two rows they are.

**Where it lives.** `src/lib/hle.ts` is code, so under E1 the change lands on main only inside a CI-proven commit. It is committed on the branch after this record. It reaches main and staging with the next proven code landing, not with a CI run of its own (§8.4). Until then main and staging show my interim English; the Indonesian, the default, is the approved wording already.

### 8.2 The security boundary, stated

Two layers, each enforcing a different thing. They are not meant to be identical.

- **The database enforces who may grant a role, and records every grant.** `role_assignments_guard` re-authorizes each insert (no self-grant; SYSTEM_ADMIN-only roles; a school administrator only within their scope and only for the school's own people). Grants record `granted_by` and are audited. Duplicates are refused. The platform's list answers only an active SYSTEM_ADMIN.
- **The application enforces which workflows a platform administrator may use.** In a school's context, Konfigurasi's ordinary roles form and its action accept only the school's own people. The platform's list serves only «Menunjuk admin sekolah pertama», under its three conditions.
- **The database does not enforce the second.** An authenticated, active SYSTEM_ADMIN calling `grant_role` directly can still give any school role to anyone. That is the platform administrator's standing authority, audited like every grant. It is not a defect. **The application-level restriction is not, and must not be described as, a database-enforced restriction.**
- **A future database restriction** of SYSTEM_ADMIN grants requires a separate product and security ruling. No migration is proposed to make the two layers identical.

### 8.3 C12c's added administrator: a legitimate fixture that changes no authorization assertion

(The ruling's «C12c» is the appointment of a Guru of SMA Zayd. In `audit/c12.mjs` it sits inside the step named C12b, «the place».)

**The fixture is the documented path.**
- SMA's first administrator, Bu Admin SMA, is made by the platform operator with «Orang baru di luar pendataan», the route J1.4 names for a first administrator.
- She is appointed by «Menunjuk admin sekolah pertama».
- This is the same person and the same route L3A had always used for its setup, and S3/S4 use for SD. Only its moment moved: C12b instead of L3A. L3A reuses her (`pastikanAdminSma`), and its notes say «(in C12c)».

**Every assertion that touches SMA**, checked in the code:

| Where | Asserts | Affected by an SMA administrator existing earlier? |
|---|---|---|
| HOD-02 (`journey.mjs`, before C-12) | The Kepala departemen is refused `/pimpinan` at SMA's root | No. It runs before C-12, and her refusal rests on her own grants, which an SMA administrator does not change |
| C12b (the Guru of SMA) | Recorded at SMA, activated, given Guru at SMA: ok | This is the restated procedure. Same actor (Gladys, Mengelola · SMA), school and role |
| C12f (P5 visibility) | The SMA Guru reads no session, result or answer of SD's, and is refused the record | No. It concerns the SMA Guru's own reads of SD rows. The SMA administrator holds nothing at SD and is not among the readers |
| C12h (P7 tenancy) | Every C-12 row is SD's; the SMA Guru sees nothing and is refused on screen | No, for the same reason |
| L3A | Working Context across SD and SMA; the SMA administrator's grant of Guru at SMA to Gladys is setup (BLOCKED, not FAIL, if it fails) | No. Same person and grant; only who made her and when |
| L3D | Gladys holds Mengelola · SMA | No. That comes from her SYSTEM_ADMIN |

No other journey step reads SMA's roles or expects SMA to have no administrator. Evidence: C12b, C12f, C12h, L3A and L3D all PASS in journeys 37739845001. The local run before the restatement (C12b FAIL at the recording, no SMA administrator) and after it (PASS) are recorded in §5.

### 8.4 The avoidable run: the procedure, improved

- **Cause:** a staging request file (`.github/staging-*-request.txt`) landed on main with a documents-only report. CI's path filter skips only documents, and E1 reuses proof on main only for the identical commit, so main ran in full (37743909195, 72 estimated minutes).
- **Rule from now on:**
  - main receives either a CI-proven commit (E1) or a commit whose every changed path is in CI's skipped documents (`docs/{coordination,reports,deployment}/**` of an inert type);
  - a staging request file waits on the branch and reaches main inside the next proven code landing;
  - before any landing that is not E1, `git diff --name-only origin/main HEAD` is checked against those paths.
- **This record follows the rule:** it lands on main as a documents-only commit (no CI). The copy change of §8.1 lands with the next proven code commit.
