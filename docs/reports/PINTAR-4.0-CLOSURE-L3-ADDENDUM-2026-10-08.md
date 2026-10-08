# PINTAR 4.0 · L3 closure addendum: the Second Eye's conditional hold

**8 October 2026.** This answers the L3 hold:
- **Second Eye's verdict:** CR-93 and CR-94 ACCEPTED; L3 final closure AMBER.
- **Items 1–3:** corrected, minimally, with regression evidence.
- **Item 4:** presented for a product ruling. Nothing in its implementation was changed.
- **Not done:** no L4 and no production change. This report claims no GREEN; the verdict is the Second Eye's.

Head: **f27ffb3**, the branch and main alike.
- **CI 37726912124:** 18 of 18 jobs succeeded.
- **Journeys 37726914297:** job A «Crawl A GREEN» (387 pages, 0 broken); job B 75 PASS, 1 FAIL (S23q, CR-52, governed by D-123).

## Item 1 · C12k reconciled with D-132 C9, keeping the original intent

**What C-12's P1 protected.** Learning never displaces or changes the Guru as a teacher: the same person, still EDUCATOR, whose teaching home is `/mengajar` with Kelas 1A working there. Before L3, D-010's ranking chose `/mengajar` for her. Under D-132 C9 a person who holds two purposes is asked. Enrolled as «Peserta», she holds Mengajar and Belajar.

**Corrections:**
- **The acceptance text** (`docs/coordination/design/EDUCATOR-AS-LEARNER-TICKETS.md`, P1) now reads: she arrives on the chooser and is asked; choosing Mengajar lands her on `/mengajar`, where Kelas 1A opens. The reconciliation is stated in the row.
- **The criterion** (`audit/c12.mjs`, C12k) restores what the restatement had lost. It now asserts that **choosing Mengajar · SD Zayd lands on `/mengajar`**, read from the choice itself. The old step typed the address. FAIL unless all of these hold:
  - arrival on `/`;
  - choosing Mengajar lands on `/mengajar`;
  - Kelas 1A opens there;
  - display role EDUCATOR;
  - one person on every row.
  - The byte-identical hard gate (P2) is unchanged.
- **Evidence:** journeys 37726914297, C12k **PASS**: «the Guru: display role EDUCATOR; landed on /; choosing Mengajar · SD Zayd lands on /mengajar; Kelas 1A opens from /mengajar true; one person on every row: 1|1|1|0». The hard gate is byte-identical (md5 `4542d1eb…` → `4542d1eb…`). C12d (the Guru's journey, chosen as Mengajar · SD Zayd) and L3D's teacher row (Mengajar → /mengajar) also PASS in the same run.

## Item 2 · S2's Studio rule made explicit in the canonical contract

The L3 design page (`docs/reports/PINTAR-4.0-L3-WORKING-CONTEXT-DESIGN-2026-10-07.md`, after §4's homes) now states the rule. Before, it was carried only by C7's list:
- Studio is a place's work: a school's context, with C8's capabilities, or Pustaka PINTAR's.
- **«Seluruh platform» offers no Studio**: no link, tab or page.
- This is presentation only; the database still decides every Studio act.

The clause is marked as written at the Second Eye's direction, for the owner's confirmation in the closure decision.

It was already tested:
- **F22-P02:** in «Seluruh platform» only `/konfigurasi`, `/aktivasi` and `/akun` are served, of the ten surfaces.
- **Journey S2:** Konfigurasi in «Seluruh platform» draws no Studio link. It passes in every job B since L3.

No code changed.

## Item 3 · Fail-closed regression test for unreadable role grants

**F22-A01** (new; app runner; `selftest/app.test.ts`, `selftest/manifest.json`) runs against the running app and its database.
- **The plant:** the read of the pairs a person holds (`konteks_tempat_saya`, with the person's own session) is refused for real. EXECUTE is taken from `authenticated` and given back in a `finally`, and the test checks it was given back.
- **The control:** before and after, the same teacher is offered her Mengajar door.
- **Asserted while the read is refused:**
  - the chooser offers **no door**;
  - `/mulai` chooses nothing and sends her into no surface;
  - `/mengajar` lists **no class**;
  - the session holds **no context**.

| Run | Result |
|---|---|
| Local, the real code | **PASS**: no door (1 before, 1 after), `/mulai` 307 → `/`, `/mengajar` 200 with no class, context `-:-` |
| Local, a **planted fail-open** (on a read error, offer Belajar; built, run, reverted) | **FAIL**: «with the grants unreadable the chooser still offers ["BELAJAR"]» |
| Full local suite, fresh seeded database | 644 passed, 1 failed. The failure was F06-S04: F22-A01's `proves` did not name the artefact it reads. It was fixed (it now names the rendered chooser and the routes `/mulai` and `/mengajar`), and F06-S04 then passed. `tsc` 0 errors; ESLint 0 errors (the same 6 old warnings) |
| CI 37726912124 (f27ffb3) | **18 of 18 jobs succeeded**, F22-A01 among the app tests |

No product code changed: the code already fails closed (`src/lib/konteks-server.ts`, `tempatSaya`: `error ? []`). The test now pins it.

## Item 4 · BOB19-K01: Admin platform reads the platform's «awaiting a first role» list in a school's context

**Current behaviour** (`src/app/konfigurasi/page.tsx`, the reads around lines 205–208 and the roles form around 1135–1150):

| Who, where | List asked | What it feeds |
|---|---|---|
| Admin platform in «Seluruh platform» | `persons_awaiting_first_role()` (the platform's) | The roles form's person picker, group «Orang baru». **But the scope picker offers no school there** (`lingkupPeran(platformKonteks ? [] : nodes)`), so a school-scoped role cannot be granted from it |
| **Admin platform in Mengelola · a school** (added in L3) | The platform's list, because `adminPlatformDiSekolah` | The same picker, now beside that school's scopes. This is where a new school's **first administrator** is appointed (J1.4) |
| Admin sekolah in Mengelola · their school | `persons_awaiting_first_role_at(school)` only: the school's own recorded people who hold nothing there | The same picker |
| Before L3 (886554b) | The platform's list whenever the reader was Admin platform, with every school merged | The same picker, with every school's scopes |

**Data scope.** The platform's list holds every person, platform-wide, who holds no active role, no enrolment and no transfer. It projects **person id and display name only**, and each row must still pass `person_visible_to_me`. In a school's context the picker therefore also offers unattached people who are **not that school's**. That is how a school's first administrator, whom no school has recorded yet, can be found at all.

**Authorization boundary.** Nothing here grants or widens anything; the database decides twice:
- **Reading the list:** `persons_awaiting_first_role` raises for anyone but an active SYSTEM_ADMIN (registry: STAFF, SYSTEM_ADMIN).
- **Granting:** `role_assignments_guard` re-authorizes every grant.
  - No self-grant.
  - SYSTEM_ADMIN, or an unscoped role, only by an active SYSTEM_ADMIN.
  - INSTITUTION_ADMIN below a school's own node only by SYSTEM_ADMIN.
  - Otherwise, the grantor needs INSTITUTION_ADMIN scope over the node, and a person the school has, unless the grantor is SYSTEM_ADMIN.
- **Audit:** every grant records its grantor.

**Why it is not covered.** C7 lists «activation across schools» among «Seluruh platform»'s views, and §2 records the L3 choice («otherwise a new school's first admin could not be granted without leaving that school»). No ruling names it.

**Proposed product ruling (for the owner):**
- **A, recommended: approve as built.** Admin platform, in a school's context, may choose a person from the platform's unattached list to give a role at that school. Its main use is the school's first administrator.
  - It discloses names only to the one role already entitled to the whole list.
  - It needs no code change.
  - C7 would read: «activation across schools: «Seluruh platform»; appointing a person not yet at any school to a role at one school: Admin platform in that school's context».
- **B: restrict the list in a school's context to the first administrator.** The «Orang baru» group would be offered only with the role «Admin sekolah», and only while the school has none. This is narrower and needs a small code change and a test.
- **C: move first-administrator appointment to «Seluruh platform»,** with a school picker there, and remove the platform list from school contexts. This changes C7's platform views and needs a code change and journey restatements (S3, S4, G2).

Stopped at the decision boundary: BOB19-K01 and the code stay as they are until the ruling.

## Reconciliation, and what did not change

| | Result |
|---|---|
| Branch = main | **f27ffb3**, fast-forwarded under E1 to the head CI 37726912124 proved. CI on main **37729629430**: the baseline passed and proof-reuse cancelled the run (the established ALREADY PROVEN shape) |
| Staging | No migration (177 unchanged). **environment-facts 37730111943 (read only): success**. Staging's app runs main's code and its database main's migrations |
| Production | Untouched: no production request file, workflow, secret or setting |
| Product source (`src/`) | **Unchanged** by this addendum. Only the C-12 walk, one app test, the manifest and two documents changed |
| Gates | None weakened. C12k gained a condition. F22-A01 is new and was proven red against a planted fail-open. S2, F22-P02 and every other criterion are unchanged. S23q stays a FAIL |
| Allowance | **1,312 of 1,900** estimated minutes (588 left). This addendum cost 123: one CI run, one journeys run, main's E1 and the facts check |

**For the final Second Eye:**
- Items 1–3 are corrected and evidenced.
- Item 4 awaits the owner's ruling (A, B or C above). Until it is ruled, BOB19-K01 pins behaviour that no ruling yet names.
