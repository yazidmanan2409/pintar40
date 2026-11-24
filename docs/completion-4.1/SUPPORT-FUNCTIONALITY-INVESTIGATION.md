# PINTAR support functionality: what exists (read-only investigation)

Read against `origin/main` at `61a6ff9e` (Merge Z, PR #28). The 4.1 planning documents
(PRODUCTION-READINESS-REGISTER, OWNER-RULINGS-4.1, MASTER-SEQUENCE, PLANNING-AUDIT) are **not on origin/main**.
They exist only on `origin/claude/bob-41-master-plan` (tip `8fd227a9`), and are cited from that branch, marked [branch].

## 1. What was designed and approved

- **D-037 (24 Sep), "Support: lean, in two steps"**, `docs/coordination/DECISIONS.md:44`.
  - Step 2 is «Laporkan masalah» inside PINTAR, **for staff only** (Guru, Kepala departemen, Dekan, Admin sekolah, Admin platform).
  - It attaches the page, role, school, build, time, device and error reference automatically.
  - The reporter sees status Diterima → Ditangani → Selesai.
  - **Students tell their teacher.** Reports stay inside PINTAR under RLS.
  - Tier 1 is the school admin plus the operations team (how-to questions, first look). Tier 2 is the coordinator (defects become BOARD tickets).
  - A stopped class is answered the same school day (WIB), everything else within one school day.
  - **"A full helpdesk product is reconsidered in 2027, at scale."**
- **D-101(f)**, `DECISIONS.md:109`: "Can the school safely resolve this itself?" PINTAR steps in only when the school's authority is exhausted or a security or platform boundary is crossed. This is cited in the migration header.
- **BOARD tickets**, `docs/coordination/BOARD.md:116-117`: BOB-15 (table, RLS, submit and move RPCs, audited) and DAISY-12 (/lapor, /lapor/saya, the triage list). Both are marked DONE 5 Oct.
- **Explicitly out of scope**: "a helpdesk product (reconsidered in 2027, D-037)" and "school-admin security notifications (C7)", `docs/recovery/PINTAR-4.0-SCOPE-INVENTORY.md:226-239`.
- **[branch] Readiness register**, `docs/completion-4.1/PRODUCTION-READINESS-REGISTER.md`:
  - **PR-12** (line 46), error capture: **GAP**. The minimum action is to "route the existing problem report and server errors to a monitored mailbox". The exit is "one induced error reaches a named person".
  - **PR-15** (line 49), named support people: **GAP**. The action is to "name one first-line contact … and an escalation path".
  - Lines 140-183: a design review (`fef73844`) found that the screens promise response times nobody guarantees. **Owner decision 24 Nov: option (b), soften `lapor.langkah.awal` and `lapor.langkah.awal_kelas`** until PR-12 and PR-15 are closed. The words are still to be settled by the design lead and ride D2-R.
- **[branch] Audit-79 ledger**, `docs/post-4.1/AUDIT-79-LEDGER.md`:
  - L-31 (line 135, Significant): the response-time promise.
  - L-32 (line 136): the error page has no «Laporkan masalah» link carrying the reference code.
- **No approved design exists** for threads or replies, escalation, notifications, or learner reporting.

## 2. What is implemented

**Data model.** Migration `supabase/migrations/20261119100000_a_staff_member_reports_a_problem.sql`.
- Enum `support_report_status` (DITERIMA, DITANGANI, SELESAI), line 22.
- Table `support_reports`, lines 24-44. Key columns:
  - `did`, `expected` and `happened` (1-2000 characters each) and `stops_class`;
  - `page`, `error_ref`, `build_sha`, `device` and `screenshot_path`;
  - `status`;
  - `next_step`, a **single overwritable** text field of up to 500 characters;
  - `handled_by_person_id`.
- There is **no messages or thread table, no escalation column and no assignee or tier field.**
- The only later reference is anonymisation, `20270117130000_an_anonymised_person_is_given_nothing_new.sql:97`.

**Visibility.** RLS policy `support_reports_select`, lines 55-58. Three groups can see a report:
- the reporter;
- `INSTITUTION_ADMIN` of the report's `institution_id`;
- `is_system_admin()` (Admin platform), which sees **every** report.

No one else can see a report. Clients cannot insert or update directly (terminal check, lines 177-181).

**RPCs.**
- `submit_support_report`, lines 81-126.
  - Refuses any person whose only role is STUDENT (`REPORT_NOT_STAFF`).
  - Records the reporter's highest role and its school. A pure system admin gets `institution_id` null.
  - Audit `support_report.received`.
- `move_support_report`, lines 129-157.
  - Caller must be the school's INSTITUTION_ADMIN or a system admin.
  - Forward only: DITERIMA → DITANGANI or SELESAI, then DITANGANI → SELESAI.
  - A next step is **required** on each move.
  - Audit `support_report.moved`, with `next_step` in its details. The audit log is the only history of earlier next steps.
- `may_read_support_screenshot`, lines 160-169.

**Screens.**
- **Entry point**: `TautanLapor`, on every **staff** shell beside Bantuan (`src/components/CangkangPengalaman.tsx:355-357`; `src/components/lapor/TautanLapor.tsx`). It carries the current page.
- **/lapor** (`src/app/lapor/page.tsx`, `actions.ts:20-45`). The form asks three questions, a "stops my class" box and an optional screenshot of up to 5 MB. A student sees «Murid menceritakan masalah kepada gurunya…» (`lapor.murid`, `hle.ts:5339`) instead of the form.
- **/lapor/saya** (`src/app/lapor/saya/page.tsx:49-60`; also linked from `MenuAkun.tsx:79`). The reporter sees each report's status, date, page and the latest next step.
- **Triage list** in Konfigurasi, section `laporan-masalah` (`src/app/konfigurasi/page.tsx:588, 1303-1360`).
  - A school admin sees their school's reports; Admin platform in «Seluruh platform» sees all.
  - Each row shows the three answers, the reference, the screenshot link and a "Ubah status" form with "Langkah berikutnya untuk pelapor".
  - Pages hold 20 rows.

**Triage ordering.** `src/lib/lapor-masalah.ts:65-95`.
- Open reports come first, ordered by `status`, then `stops_class` descending, then oldest first. Finished reports follow, newest first.
- Caveat: because status sorts first, a "class stopped" report that is already DITANGANI comes after any DITERIMA report.
- Proven by test W2.10 / CR-49 (`selftest/manifest.json:4288`).

**Notifications and email.** None.
- Test BOB15-K01 (`selftest/manifest.json:3774`) asserts that "no new line promises an email or a notification".
- No mail or notification code references support reports.

**Error page.** `src/components/HalamanGalat.tsx:45-48` shows the digest as «Kode rujukan». It has **no** link to /lapor.
- `alamatLapor(halaman, rujukan)` can carry `?ref=` (`src/lib/lapor-masalah-kontrak.ts:60`), but only `TautanLapor` calls it, and only with the page.

**Tests.** `selftest/bob15.test.ts`, IDs BOB15-K01, BOB15-S01 and BOB15-D01 (`selftest/manifest.json:3774-3786`). BOB15-D01 proves that only the reporter, the school admin and Admin platform can read a report, and that moves go forward only and are audited.

**The two `lapor.langkah` strings.** These are the default next step shown in «Laporan saya» until an admin writes one. They are unchanged on main and on the branch (`hle.ts:5363-5364` on main).
- `lapor.langkah.awal`: «Admin sekolah atau tim PINTAR akan melihatnya dalam satu hari sekolah.» ("…will look at it within one school day").
- `lapor.langkah.awal_kelas`: «Karena menghentikan kelas, laporan ini dijawab pada hari sekolah yang sama.» ("…answered the same school day").
- The owner ruled on 24 Nov to soften both (register [branch] line 183). The change has not landed yet.

Related strings:
- `lapor.privasi` (`hle.ts:5356`): read only by you, your school admin and the PINTAR team.
- `lapor.triase.arti` (`hle.ts:5375`): "the PINTAR team reads them too". The RLS policy does give system admins that access, but no process or notification makes sure anyone actually looks.

### Mapping of (a)–(g)

| Step | Status | Evidence |
|---|---|---|
| (a) User clicks Support, describes and submits | **PARTIAL** | Staff only. `submit_support_report` refuses students (migration lines 89-94; BOB15-D01; D-037 says students tell their teacher). The error page has no link (L-32). |
| (b) School admin receives it inside PINTAR | **IMPLEMENTED (pull only)** | Konfigurasi triage list (`konfigurasi/page.tsx:1303`) under RLS (migration line 55). There is no unread count, inbox badge or alert. |
| (c) Admin responds and resolves | **PARTIAL** | `move_support_report`: forward-only status plus one overwritable `next_step` (500 characters). There is no conversation, and a resolved report cannot be reopened. |
| (d) Escalate to the platform admin, keeping history | **MISSING** | No escalation action, flag, tier or assignee. The platform admin already sees every report (RLS `is_system_admin()`), but nobody is told. Earlier next steps survive only in `audit_log`. |
| (e) User sees replies and status | **PARTIAL** | /lapor/saya shows the status and the latest next step only. There are no replies and the user cannot answer back. |
| (f) School admin submits directly to PINTAR | **PARTIAL** | An Admin sekolah can submit, but the report is tagged with their own school, so it lands in their own school's triage list. They can resolve it themselves. The platform sees it through RLS, but nothing sends it to PINTAR. Only a system admin with no school role reports with a null school (migration line 94). |
| (g) Email only as notification | **MISSING** | No notification of any kind (BOB15-K01). PR-12's proposed minimum is routing reports to a monitored mailbox [branch, register line 46]. |

## 3. What is missing against (a)–(g)

1. Learner reporting, or a learner-to-teacher path. This was excluded by D-037, not merely left undone.
2. A link from the error page carrying the reference code (L-32).
3. A message thread: replies from both sides and from multiple admins, with history visible in the product.
4. Escalation from the school to the platform, with its own status, an assignee or tier, and kept history; also reopening a resolved report.
5. Routing that lets a school admin send a report straight to PINTAR, distinct from their own school's list.
6. In-product notifications: an unread count, a badge for new reports, and a "you have a reply" indicator.
7. Email notifications for new reports, escalations and replies. PR-12 proposes only a monitored mailbox.
8. Named support people, hours and an escalation path (PR-15), plus monitoring that backs the response-time promises (L-31).
9. "Class stopped first" across statuses, not only within each status.

## 4. Future-release assignment

- **No 4.2, 4.5 or 5.0 item covers support, tickets, threads, escalation or support notifications.**
  - The 4.2 list (now 4.5 under ruling 72, `OWNER-RULINGS-4.1.md:129` [branch]) has 4.2-01 to 4.2-13, 4.2-C1 to C5, 4.2-R, U-01 and U-02.
  - The 4.5 list (4.5-01 to 4.5-12, 4.5-S) and the 5.0 list (5.0-01 to 5.0-04) also have none. See `docs/roadmap/PLANNING-AUDIT-4.2-4.5-5.0.md:85-140` [branch].
  - `MASTER-SEQUENCE-4.1-TO-5.0.md` has none either.
- The nearest items:
  - **4.2-07 "Declining an account request"**, where the requester learns the outcome. It is a different feature.
  - The **4.5 Guest Exploration plan, G4 "Simulation seams"**, explains «Laporkan masalah» without sending anything (`docs/roadmap/GUEST-EXPLORATION-4.5-PLAN.md:218, 622` [branch]).
- **Open for 4.1 closure, not a release item:**
  - PR-12 and PR-15 (owner actions; option (b) string softening ruled 24 Nov);
  - L-31 and L-32 in the Audit-79 ledger (J5, J10).
- **A helpdesk product is deferred to "2027, at scale"** by D-037 (`DECISIONS.md:44`; `PINTAR-4.0-SCOPE-INVENTORY.md:239`). It has no item ID.
