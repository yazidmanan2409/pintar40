# PINTAR 4.0 — issues found, fixes applied, and status

**Status as of:** Thursday 24 September 2026, 06:55 WIB (23:55 UTC, 23 September)
**Prepared by:** Claude (coordinator / Second Eye), for Yazid
**Production:** https://app.pintarselalu.com
- release `5b5b68d`
- Supabase project `trtlvibiybwixfumjrrx`

---

## 1. Summary

| Area | Found | Fixed and verified | Open |
|---|---:|---:|---:|
| **Go-live issues** (deployment and configuration) | 10 | **10** | 0 |
| **Audit blockers** (the school cannot yet run a lesson through the app) | 6 | 0, plus 1 partly fixed (B6) | **6** |
| **Audit major issues** | 15 | 0 | **15** |
| **Audit minor issues and notes** | 15 | 0 | **15** |
| **Actions only Yazid can take** | 5 | — | **5** |

**In plain terms:**

- **PINTAR 4.0 is live, secure and stable.**
  - Every deployment and configuration problem found on 23 September was fixed and re-verified this morning.
  - The database passes all 17 launch-readiness checks.
  - The sign-in page loads correctly for strangers.
  - Gladys is the system administrator.
- **The product is not yet usable end to end.** The overnight audit found 6 blockers:
  - there is no screen to create classes;
  - lesson upload does not work;
  - lessons cannot be published;
  - a lesson's pre-test and post-test are never created;
  - students cannot sign out on shared devices;
  - administrators cannot reach any report.
- **None of the 36 audit findings has been fixed yet.**
  - They were found, then each was verified in code, in the live database or by running the app.
  - They need development work, assigned in section 6.
  - The only audit item acted on so far is B6's demo-school part: both schools were switched to real schools, which fixed it.

---

## 2. Go-live issues: all fixed and verified

These are the problems found while bringing PINTAR to live mode on 23 September.

| # | Issue | What was done | Status and proof |
|---|---|---|---|
| G1 | **Vercel held an invalid service-role key.** The GitHub secret it came from had held a bad value since release `46fd4452`. Every server feature that needs the key was quietly failing. | The deploy now takes the key from Supabase itself (Management API). It proves the key works (the Supabase Admin API must answer 200) before writing it, then reads it back by hash. Bob built it; Claude specified and verified it. | ✅ **Fixed.** Deploy attempt 012 (run 35847959997). A real 200 on certificate verification appears in the production logs. |
| G2 | **The deploy's "key works" check proved nothing.** It passed with the invalid key. | The check now runs **before** the key is written and must succeed. The later check was renamed to say what it actually proves: routing and the closed "not found" answer. | ✅ **Fixed.** Deploys 012 and 013. |
| G3 | **The production database was behind the release.** | All migrations applied. | ✅ **Fixed.** 111 of 111 (last `20261005120000`), re-checked this morning. |
| G4 | **No first administrator existed** (runbook §3b). Nobody could administer PINTAR. | Gladys was bootstrapped as SYSTEM_ADMIN: global scope, valid until **23 Sep 2027**, recorded in the audit log. This one-time door is now permanently closed. | ✅ **Fixed.** 1 bootstrap record, 1 active system administrator, re-checked this morning. |
| G5 | **The environment was still "development"** (runbook §3c). | Set to `production` with test fixtures off. | ✅ **Fixed.** Re-checked this morning. |
| G6 | **Risk that strangers could create their own accounts.** | Sign-up disabled, and the sign-in link may only return to `https://app.pintarselalu.com/auth/callback*`. Every deploy now re-reads and enforces both. | ✅ **Verified.** Deploy 013 printed `disable_signup: True` and the single allowed callback. |
| G7 | **Email delivery unproven.** | SMTP configured and a real delivery test sent. | ✅ **Verified** on 23 Sep. |
| G8 | **The sign-in page was broken for anyone not yet signed in.** The logo and all four fonts were redirected to the sign-in page, so strangers saw a broken logo and fallback fonts. | Fixed the middleware rule in `src/proxy.ts` (commit `5b5b68d`). Guarded three ways: a new test (F01-R08) that fails without the fix and passes with it; a deploy step that fetches the logo and fonts anonymously; and an external read-only check. | ✅ **Fixed.** CI green on `5b5b68d` (run 35850275026, 21/21 jobs). Deployed as attempt 013 (run 35851746640). External check "FRONT DOOR OK" on 23 Sep (run 35851951906) and **again this morning (run 35935767367)**. |
| G9 | **Launch readiness not measured after go-live.** | Ran all 17 launch-readiness checks on the live database, plus three standing assertions (official-evidence, canonical-tenant and evaluation-mode boundaries). | ✅ **17/17 PASS and all three assertions pass**, re-run this morning. |
| G10 | **The go-live record was out of date.** It still called the two schools "demo" after they became real. | Record corrected, with the reason and the audit reference (commit `06a91ad`). | ✅ **Fixed** this morning. |

---

## 3. Setup done for Gladys (23 September)

| Item | What was done | Status |
|---|---|---|
| First two schools | Created **SD Zayd Pintar Selalu** (`sd-zps`) and **SMA Zayd Pintar Selalu** (`sma-zps`), each with academic year **2026/2027** (13 Jul 2026 – 30 Jun 2027). This was done in the database because the app has no screen for creating schools. | ✅ Done, audited |
| Demo → real | Both schools were first made **demo** schools. The audit found demo evidence can **never** appear in any report, so on Yazid's decision both were switched to **real** schools. They had no activity, so nothing needed converting. Consequence: their certificates are now real and publicly verifiable. | ✅ Done, audited (`institution.reclassified_official`), assertions pass |
| Gladys's permissions | Checked as her account, read-only: she can write, review, freeze and publish content, assign learning, run quick quizzes and add people in both schools. | ✅ Verified |
| Sign-in instructions | Full instructions given in Bahasa Indonesia, including the same-device rule for the email link. | ✅ Delivered |
| Current activity in production | Only Gladys exists: 1 person, 1 account, 1 role. The schools have no classes, lessons or assessment sessions yet. | ℹ️ As of this morning |

---

## 4. Audit findings (night of 23 September): status

**How these were found:**
- four independent code reviews, each claim re-checked by Claude;
- read-only checks of the production database;
- browser runs of the exact deployed release on a local copy of the stack, covering 14 test users (96 screens) and Gladys's full path from an empty, production-configured school (19 steps).

The browser runs never touched production. They can be re-run after every fix: workflow **"audit · end-to-end journeys"** on branch `claude/awesome-rubin-bqxp6p`.

**Proof codes used in the tables:**
- **C** = confirmed in code
- **DB** = confirmed in the live database definitions
- **R** = reproduced by running the app

### 4.1 Blockers: all open

| # | Issue | Proof | What has been done | Status | Fix owner |
|---|---|---|---|---|---|
| B1 | **No way to create classes.** The app cannot create a class, grade, department or cohort. Students cannot be placed, and teachers have no class. | C, DB, R | Confirmed. In the test run a class could only be made by SQL. | 🔴 **Open.** Stop-gap: Claude builds each school's classes in the database from Gladys's class lists. | Bob: class and structure screen |
| B2 | **Lesson upload does not work.** There is no file upload, only a text box expecting machine-format data. Both buttons fail: "Unggah Mudah" creates nothing, and "Paket Terstruktur" fails with an English error. Nothing in the app creates lesson text or questions. | C, R | Confirmed. | 🔴 **Open.** Stop-gap: Claude loads Gladys's first lessons from a template. | Bob: working import, template and file upload |
| B3 | **Nothing can be published to students.** No screen or function creates the publishable version of a lesson (a "release"). | C, DB | Confirmed. | 🔴 **Open** | Bob |
| B4 | **A lesson's pre-test and post-test are never created.** The student's "Mulai" ends on an English "404 This page could not be found". Only quick quizzes create student assessments. | C, DB, R | Confirmed. | 🔴 **Open** | Bob |
| B5 | **Students, teachers and managers cannot sign out.** Only Konfigurasi has a "Keluar" button, and sessions last up to 400 days. On a shared tablet the next child continues as the previous one. | C, R | Confirmed. | 🔴 **Open** | Bob (logic), Daisy (placement) |
| B6 | **Reports cannot be seen.** (a) Demo schools could never show report figures. (b) School administrators have no screen that shows a report. (c) The management page asks for class figures at a level where they never appear. | DB, C, R | **(a) fixed** by switching both schools to real. (b) and (c) confirmed. | 🟠 **Partly fixed**: (b) and (c) open, and all reports also wait on B1–B4 | Bob |

### 4.2 Major issues: all open

| # | Issue | Proof | Status | Fix owner |
|---|---|---|---|---|
| M1 | The email sign-in link only works in the same browser that asked for it. Otherwise the person sees "Tautan ini sudah tidak berlaku". | R | 🔴 Open. Workaround in Gladys's instructions (same device). | Bob |
| M2 | Only Gladys can give staff their roles. A school administrator cannot. | C | 🔴 Open | Bob |
| M3 | The Aktivasi (account activation) and Studio screens are not linked from anywhere; they must be typed. | R | 🔴 Open | Bob, Daisy |
| M4 | Everyone lands on the generic front page after signing in, not on their own page. | R (14 of 14 users) | 🔴 Open | Bob |
| M5 | The staff/student intake has traps: it accepts a place that fails later with no reason, turns a teacher imported into a class into a student of that class, and can never enrol someone recorded without a class. | C, R | 🔴 Open | Bob |
| M6 | Account mistakes cannot be corrected: wrong email, lost class card, forgotten PIN. | C | 🔴 Open | Bob |
| M7 | Raw English database errors are shown to users, and error pages are Next.js's English defaults. One teacher page can crash. | C, R | 🔴 Open | Daisy (wording), Bob |
| M8 | Studio's school picker defaults to "PINTAR Kurikulum Nasional", so content can be filed in the wrong place. | R | 🔴 Open | Bob |
| M9 | Lesson audio, video and PDFs cannot play. | C, R | 🔴 Open | Bob |
| M10 | Assignment start and end dates are ignored, and shifted by 7 hours. | C | 🔴 Open | Bob |
| M11 | Studio's approval steps are unlabelled (three identical "Konfirmasi" buttons). A lesson with an error finding can never be published. | C | 🔴 Open | Daisy, Bob |
| M12 | Nobody sees a quick-quiz score. | C | 🔴 Open | Bob |
| M13 | Shared sign-in limits may lock out whole classes, and the error messages hide the real cause. | C (suspected, depends on the Supabase settings in section 5) | 🟡 Open, needs checking | Yazid (settings), Bob |
| M14 | Pages will slow down, and lists will silently drop names, as schools grow past about 400 people. | C | 🔴 Open | Bob |
| M15 | Deans and heads of department cannot reach their own page (Pimpinan). The home page's staff button loops back to the home page. | C, R | 🔴 Open | Bob |

### 4.3 Minor issues and notes: all open

| # | Item | Status |
|---|---|---|
| N1 | "Buat dan aktifkan" says the person can sign in by email, but no email is sent (runtime: 0 emails). Someone must tell them to go to /masuk. | 🔴 Open |
| N2 | The sign-in email is Supabase's default English email. | 🟡 Yazid: translate in the Supabase dashboard |
| N3 | Class cards will fail if the password policy demands capitals or symbols. | 🟡 Yazid: check the setting |
| N4 | `CARD_PEPPER` and `CERT_SECRET_KEY_V1` exist only in Vercel. Losing them breaks every class card or certificate. | 🟡 Yazid: keep offline copies |
| N5 | The hint checker wrongly rejects some ordinary hints. | 🔴 Open |
| N6 | The quick quiz is called "Kuis Cepat" in Studio and "Uji Cepat" everywhere else. | 🔴 Open (Daisy) |
| N7 | The time zone is fixed to WIB (wrong for WITA and WIT schools). | 🔴 Open |
| N8 | Certificate numbers can collide when a whole class finishes together. | 🔴 Open |
| N9 | The role form checks neither that the role suits the place nor that the dates make sense. | 🔴 Open |
| N10 | The same teacher at SD and SMA cannot be linked as one person. | 🔴 Open |
| N11 | No security headers, so the sign-in page can be framed by another site. | 🔴 Open |
| N12 | `/masuk/kartu` is public but does not exist. | 🔴 Open |
| N13 | 25 migrations are dated in the future (up to 5 Oct), so new migrations will sort before them. | 🔴 Open |
| N14 | An anonymous visit to /masuk makes one refused database call (log noise only). | 🔴 Open |
| N15 | Gladys's administrator role expires on 23 Sep 2027 and she cannot renew it herself. | 🟡 Yazid/Gladys: appoint a second system administrator well before then |

---

## 5. Actions only Yazid can take

1. **Supabase → Authentication → Rate limits:** raise *emails per hour*. A school's first morning may need well over 30 sign-in emails.
2. **Supabase → Authentication → Password requirements:** must **not** require upper-case letters or symbols, or class cards cannot be created.
3. **Supabase → Authentication → Email templates → Magic link:** translate it to Bahasa Indonesia and add "buka tautan di perangkat dan browser yang sama".
4. **Keep offline copies of `CARD_PEPPER` and `CERT_SECRET_KEY_V1`** from Vercel's production environment, somewhere safe.
5. **Optional clean-up:**
   - delete the old, invalid GitHub secret `SUPABASE_SERVICE_ROLE_KEY` (nothing uses it now);
   - note that no release tag exists on GitHub, because the tag push was refused on 23 Sep.

Claude could not read settings 1–3: the permission guard blocked reading production's Auth configuration with the stored token. That is why they are listed here.

---

## 6. Next steps

1. **Today, Gladys:**
   - sign in;
   - create the two school administrators;
   - give roles;
   - look around.

   **Do not upload lessons yet.** Prepare three lists:
   - classes per school;
   - staff (name, email, role, class);
   - students (name, class).

   Also prepare her first lessons in the template Claude will provide.
2. **Stop-gap, Claude, within a day of receiving the lists:**
   - build each school's classes in the database;
   - load the first lessons, including release, pre-test and post-test, so testers can run a real lesson end to end and see reports.
3. **Bob, build sprint, in this order:**
   1. class and structure screen (B1);
   2. working lesson import with a template and file upload (B2);
   3. create, freeze and publish a release (B3);
   4. pre-test and post-test created when a lesson is assigned (B4);
   5. "Keluar" on every screen plus a session limit (B5);
   6. report access for administrators and management (B6, M15);
   7. links and role-home landing (M3, M4);
   8. then the remaining major issues.
4. **Daisy:**
   - Indonesian wording for every error (M7);
   - labelled Studio steps (M11);
   - honest empty states;
   - sign-out placement;
   - the /masuk wide-screen layout.
5. **Rule for every fix:** ship it the way the front-door fix shipped (G8):
   - a test that fails without the fix and passes with it;
   - green CI on the exact commit;
   - then deploy;
   - then re-run the audit journeys.

---

## 7. Evidence index

| What | Reference |
|---|---|
| Front-door fix commit | `5b5b68d` (branch `claude/quirky-meitner-a04smj`) |
| CI on the fix | run 35850275026: 21/21 jobs green, strict selftest included |
| Production deploy of the fix | run 35851746640 (attempt 013, every step green) |
| External front-door checks | run 35851951906 (23 Sep), run 35935767367 (24 Sep, this morning) |
| Service-role key deploy | run 35847959997 (attempt 012) |
| Go-live record | `docs/deployment/GO-LIVE-2026-09-23.md` on `claude/quirky-meitner-a04smj` (latest `06a91ad`) |
| Audit report (full detail) | https://claude.ai/artifact/XBz96KztaGp4iNXXMHegCm (private; share from its menu) |
| Audit harness | `audit/` and `.github/workflows/audit-journeys.yml` on `claude/awesome-rubin-bqxp6p`; last run 35857881901 |
| Production checks this morning | read-only SQL: 111 migrations, environment production, 1 system admin, both schools real, readiness 17/17, three standing assertions pass |
