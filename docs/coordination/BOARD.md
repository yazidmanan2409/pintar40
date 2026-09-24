# PINTAR 4.0 — board

**Sprint 1 goal (D-005):** a school can run one lesson end to end through the app.
Statuses: TODO → IN PROGRESS → IN REVIEW (at the gate) → MERGED (on `main`) → RELEASED (in production).
Audit references (B1–B6, M1–M15, N1–N15) point to `docs/audit/PINTAR-4.0-ISSUES-AND-STATUS-2026-09-24.md`.

**`main` is at:** see the latest gate verdict. **Production release:** `5b5b68d` (see `RELEASES.md`).

---

## Bob — back end (lane `claude/quirky-meitner-a04smj`), in this order

| # | Ticket | Fixes | Depends on | Acceptance (all need tests that go red without the change and green with it) | Status |
|---|---|---|---|---|---|
| **BOB-01** | **School structure functions** (D-006): create, rename and deactivate **Bagian** (DEPARTMENT), **Tingkat** (COHORT, with the academic year) and **Kelas** (CLASS, with the academic year). The hidden **Jenjang** (FACULTY) and **Reguler** (PROGRAMME) nodes are created automatically, once per school. | B1 | — | Admin sekolah and Admin platform can do it for their school; everyone else is refused; another school's nodes are refused; a Kelas must sit under a Tingkat of the same year. It returns stable error codes (D-011). Contract handed to Daisy. The intake's "Tempat" accepts only a Kelas or Tingkat for students, and says why when it refuses (M5a). | TODO |
| **BOB-02** | **Lesson import v1** (D-007): the Excel template's column contract, server-side parsing, and one database function that creates course → chapters → lessons → questions → options (every option with its reason), plus pre/post question tags (D-008). Media go to storage under the path students read from. Fix Unggah Mudah (writes a status that does not exist) and Paket Terstruktur (the confirmation step is never reached). | B2, M9 (upload side) | — | The sample workbook imports into a real course in the chosen school, not the national library (M8). Row-level problems come back as codes, never as raw database text. Both JSON paths work end to end. The column contract is handed to Daisy for the downloadable template. | TODO |
| **BOB-03** | **Releases**: create a release from an APPROVED course; freeze → publish, with readiness checked; the four-eyes rule is unchanged. | B3 | BOB-02 | A course goes approve → freeze → publish, entirely through server actions. The teacher's "Siapkan" lists the release. Contract for the Studio buttons handed to Daisy. | TODO |
| **BOB-04** | **Pre-test and post-test on assignment** (D-008). | B4 | BOB-02, BOB-03 | Assigning a release creates both assessments. A release without them is refused, with a code. `/belajar/[tugas]/pemetaan` never returns 404; it returns a state Daisy can render. A student completes pre → lesson → post → result. | TODO |
| **BOB-05** | **Sessions and sign-out** (D-009). | B5 (logic) | — | `/keluar` ends only this device's session. Class-card sessions end after 60 minutes idle; email accounts after 7 days. Tests cover both. Contract (endpoint and behaviour) handed to Daisy. | TODO |
| **BOB-06** | **Landing, management and report access** (D-010). | M4, M15, B6b, B6c | — | After sign-in each role lands on its own home (D-010), and the `/` → `/masuk` → "Lanjutkan" loop is gone. Every school gets a standard report template automatically, so admins can open the class and school summaries without typing an ID. Management's class figures are computed at the class level, with scope checks unchanged. | TODO |
| **BOB-07** | **Stable error codes** (D-011): every server action and API route returns `{ ok, code }`, never database text. A catalogue in `src/lib/` is the contract. | M7 (server) | — | No `detail=` in any redirect carries raw database text (a test enforces it). Catalogue handed to Daisy. | TODO |

## Daisy — front end (lane `ux-1/daisy-experience`), in this order

First, merge `origin/main` into the lane. It is 112 commits behind.

| # | Ticket | Fixes | Depends on | Acceptance | Status |
|---|---|---|---|---|---|
| **DAISY-01** | **Quick wins.** <br>/masuk wide-screen layout (already in her lane). <br>A "buka tautan di perangkat dan browser yang sama" line on "Periksa email Anda" and on "Tautan ini sudah tidak berlaku". <br>"Uji Cepat" everywhere (D-015). <br>The "Buat dan aktifkan" success message tells the admin to ask the person to sign in at /masuk (N1). | M1 (mitigation), N1, N6 | — | Copy in `hle.ts` in both languages; existing copy tests green; screenshots at phone and desktop width. | TODO |
| **DAISY-02** | **"Keluar" on every signed-in screen** (D-009): Belajar, Mengajar, Pimpinan, Pendataan, Studio, Aktivasi, and the refusal page. | B5 (UI) | uses the existing `/keluar`; switches to BOB-05's contract when it lands | Visible without scrolling on a phone. Announced to screen readers. Shows who is signed in, without naming a student on a shared device (S15 rule). | TODO |
| **DAISY-03** | **Navigation** (D-010): links from Konfigurasi to Aktivasi, Pendataan and Studio; the shell shows each role its own places, including Pimpinan for management. | M3, M15 (UI) | BOB-06 for the landing logic | Every role reaches every screen it is allowed to use by clicking, with no typed addresses. The audit crawl confirms it. | TODO |
| **DAISY-04** | **PINTAR's own error and not-found pages** (D-011): `error.tsx`, `not-found.tsx`, `global-error.tsx`, localized. `t()` falls back instead of throwing on an unknown key (the Siapkan crash). Codes are mapped to wording once BOB-07 lands. | M7 (UI) | BOB-07 for code mapping | There is no English Next.js default page anywhere, and a test proves an unknown key no longer crashes a page. | TODO |
| **DAISY-05** | **"Struktur sekolah" screen** in Konfigurasi (D-006): list, create, rename and deactivate Bagian, Tingkat and Kelas. | B1 (UI) | BOB-01 | Gladys can build the structure from her Kelas sheet without help. | TODO |
| **DAISY-06** | **Lesson upload and Studio steps**: <br>a file picker for the workbook and media; progress; problems per row in Indonesian; a downloadable Excel template matching BOB-02's contract; <br>Studio lifecycle steps labelled, with the current status visible (no three identical "Konfirmasi"); <br>the school picker labelled "Sekolah" and defaulting to the user's own school. | B2, M8, M11 (UI) | BOB-02, BOB-03 | Gladys uploads the sample workbook and takes it to "Terbit" with a second approver, without help. | TODO |
| **DAISY-07** | **Reports and honest empty states**: the admin's way into class and school summaries; Pimpinan cards that say *why* there is no figure yet and what will make it appear. | B6 (UI) | BOB-06 | Each role sees its report once evidence exists, and understandable wording before then. | TODO |

## Coordinator

| # | Item | Status |
|---|---|---|
| C-01 | Trunk and gate: `main` fast-forwarded to the production source; production workflows restricted to `main` (D-004); coordination folder published. | DONE (24 Sep) |
| C-02 | **Interim onboarding** (D-016): build Bagian, Tingkat and Kelas for SD and SMA from Gladys's workbook; write Gladys's step-by-step for staff and students. | WAITING for Gladys's filled workbook |
| C-03 | Extend the audit journeys to assert D-005 end to end as the tickets land. | TODO |
| C-04 | Sprint 1 release(s): gate, merge, release, verify, record. | TODO |

## Backlog (sprint 2, not started)

| Audit ref | Item | Lane |
|---|---|---|
| M1 | Email link that works across devices (token-hash template plus server verification). Needs Yazid to change the Supabase email template. | Bob, then Yazid |
| M2 | A school admin can give staff their roles. | Bob, then Daisy |
| M5 b–c | Intake: a teacher imported into a class must not become a student; people recorded without a class must be enrollable later. | Bob |
| M6 | Correct account mistakes: re-issue a class card or PIN, fix an email, disable an account. | Bob, then Daisy |
| M9 | Lesson media playback (read side). | Bob |
| M10, N7 | Assignment windows enforced and stored in WIB; time zone per school. | Bob |
| M12 | Quick-quiz score view for students and teachers. | Bob, then Daisy |
| M13 | Rate-limit errors shown truthfully. | Bob, then Daisy |
| M14 | Performance: one call for Studio permissions; pagination in Konfigurasi. | Bob |
| N5, N8–N14 | Hint-checker false positives, certificate-number race, role/place checks, one person in two schools, security headers, the dead `/masuk/kartu` path, future-dated migrations, the `evaluation_state` log noise. | Bob, Daisy |
