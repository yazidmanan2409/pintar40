# PINTAR 4.0: post-login 60-second UX execution review

**Second Eye, 29 Sep 2026. Read-only. No code changed, no tickets opened.**

**Question:** after login, can each role understand what needs them, decide, and act, within about 60 seconds?

**Evidence came from three sources:**
- **Code:** the tree at `4400d18`, whose code equals `main` `ffcd7dc`.
- **Rendered screens:** audit #45 on `42b7b43`, jobs A (every role's screens, seeded world) and B (the first administrator's path from an empty database).
- **Framework source:** Next.js 16.3.5 in `node_modules`, for how server actions behave.

**Roles** are the product's own (`src/lib/beranda.ts:42`):

| Role | Lands on |
|---|---|
| STUDENT | `/belajar` |
| EDUCATOR | `/mengajar` |
| HEAD_OF_DEPARTMENT, DEAN | `/pimpinan` |
| INSTITUTION_ADMIN, SYSTEM_ADMIN | `/konfigurasi` |
| anyone else | `/` («Mau ke mana hari ini?») |

There is no separate «reviewer» role. Studio's second-person review is a capability (CAN_REVIEW) held by the Head of Department and the Institution admin.

---

## 1. Executive answer

**PARTIAL: the foundations exist, but important roles and journeys do not yet achieve it.**

**Where it works:**
- The **learner** journey executes Login → Understand → Act. One ranked «Langkah berikutnya» button names the step, and one or two clicks start the work.
- The **teacher** and **management** landings are built around the right question: «Layak dikerjakan lebih dulu» and «Apa yang menunggu Anda».

**What falls short:**
- The management decision queue is **never fed by the product**.
- The teacher's single suggestion **can name the wrong course**.
- The **admin** landing is a settings console that surfaces none of the admin's pending work.
- Separately, **every successful email sign-in briefly shows the "this link is no longer valid" failure screen**. Authentication mechanics leak into the journey, and the message is false.

## 2. Authentication journey

**Email magic link (staff, and any learner with an email account)**
1. `/masuk`: type an email → «Periksa email Anda». This screen correctly says: «Buka tautan di perangkat dan browser yang sama dengan halaman ini…» (`auth.sent_same`).
2. The user clicks the link in the email. It goes through Supabase `/auth/v1/verify`, then to `/auth/callback?code=…`.
3. S13 shows «Sedang memeriksa tautan…», with no button.
4. The server action `tukarKode` runs `exchangeCodeForSession`, then `redirect(tujuanMasuk())`, which sends the user to the role home.

Interaction: submit the email, then click the link. No click-through page exists.

**Class card + PIN (learners)**
- `/masuk` → «Gunakan kartu kelas» → card and PIN → `POST /masuk/kartu` → `window.location` → `/belajar`.
- No intermediate screen, and not affected by the defect below.

**The one-time-link message (S14)**
- **Copy** (`hle.ts:1914-1916, 1924`), rendered by `src/components/masuk/TukarTautan.tsx:56-71`:
  - «Tautan ini sudah tidak berlaku»
  - «Tautan masuk berlaku sekali dan untuk waktu yang terbatas. Minta tautan baru untuk melanjutkan.»
  - «Tautan masuk juga hanya berfungsi di perangkat dan browser tempat Anda memintanya…»
  - the button «Minta tautan baru»
- **Legitimate triggers:**
  - no `code`, or `error` / `error_code` in the URL (`callback/page.tsx:44`);
  - the exchange failing because the link is expired or already used;
  - a PKCE verifier missing because the link was opened in a different browser or device. Audit #45 S1b shows exactly this.
- **Also triggered on every successful sign-in (defect):**
  - `TukarTautan.tsx:49` reads `tukarKode(...).then(() => setMati(true)).catch(() => setMati(true))`, and its comment assumes a successful call «goes away with the page».
  - In Next 16.3.5 a redirecting server action **rejects** the caller's promise: «If the action triggered a redirect, the action promise will be rejected with a redirect…» (`node_modules/next/dist/client/components/router-reducer/reducers/server-action-reducer.js`, redirect branch). Meanwhile the router navigates in a transition.
  - So after a *successful* exchange, the page switches to S14 and moves focus to its heading. It stays until the role home (a `force-dynamic` page) has rendered.
  - A user who presses «Minta tautan baru» in that window reaches `/masuk`, which shows S15 «Anda sudah masuk» (Lanjutkan / Keluar dari sesi ini): a second authentication screen.
  - This was not observed at runtime. The harness waits for the final URL, which is why audit S1 reports «landed on /konfigurasi». The certainty is at code level, from Next's own source.
  - It matches the manual observation in the brief.
- **Who sees it:** every role signing in by email (Educator, Head of Department, Dean, both admins, and email learners). Class-card learners do not.
- **Before the user's work:** yes. It sits between S13 and the role home.
- **Must the user interact with it:** no. The navigation completes on its own.
- **Is it needed for any decision:** no.

**First-landing tour.**
- `/belajar` and `/mengajar` (Educators without a senior role) open a 7-step modal tour automatically, up to 3 showings, until it is completed or suppressed.
- It makes the rest of the page inert. «Lewati tur» or Esc dismisses it.
- `/pimpinan` and `/konfigurasi` have none.

## 3. Role journey matrix

| Role | Login destination | First meaningful screen | Attention surfaced? | Primary action obvious? | Clicks to useful action | 60-sec |
|---|---|---|---|---|---|---|
| **Murid** (STUDENT) | `/belajar` | «Halo, …» and the «Langkah berikutnya» panel | **Yes**: next step ranked; open Uji Cepat with close date | **Yes**: one primary button naming the step | 1 (continue lesson, resume test); 2 (start pre/post-test) | **YES** |
| **Guru** (EDUCATOR) | `/mengajar` | greeting, the «Layak dikerjakan lebih dulu» card, the class list, «Sedang berjalan» | **Partly**: one suggestion plus submission counts; class-level needs sit one class at a time on `/langkah` | **Yes** when there is a suggestion, but it can name the wrong course | 2 (prepare material via suggestion); 2 (evidence); 3 (who hasn't submitted); 4 (Uji Cepat) | **PARTIAL** |
| **Kepala Departemen / Dekan** (HEAD_OF_DEPARTMENT, DEAN) | `/pimpinan` | «Apa yang menunggu Anda», then «Keputusan», evidence, per class, «Perlu diketahui» | **Designed yes, fed no**: the queue has no product path in, so it always reads «Tidak ada keputusan yang menunggu Anda»; Studio reviews are not surfaced | Decisions: yes (in place). Otherwise «Lihat lebih rinci» | 1–2 for a decision (if one existed); about 3 for a Studio review | **PARTIAL** |
| **Admin sekolah** (INSTITUTION_ADMIN) | `/konfigurasi` | «Konfigurasi»: links, three status cards, nine settings sections | **No**: no pending-work summary (imports to approve, people to activate, Studio publish) | **No** | 2 (import approval); 1 (activation); about 3 (Terbitkan) | **NO** |
| **Admin platform** (SYSTEM_ADMIN) | `/konfigurasi` | same, plus the schema check, switches, and granting any role | **No** | **No** | varies; console use | **NO** |

## 4. Journey traces

**Murid**
1. **Login:** email link or class card.
2. **First screen:** `/belajar` shows «Beranda · Halo, {nama}», then «Ini yang sedang berjalan hari ini.», then the **«Langkah berikutnya»** panel (`PanelLanjut`).
3. **What the learner learns:**
   - «{mapel} · {judul}» and the status, e.g. «Sedang di Pelajaran — 3 dari 5 selesai».
   - A five-step trail.
   - The panel is ranked by `peringkat()` (`src/lib/siklus.ts:171-190`): an open session first, then step order, then progress.
4. **Primary action:** one `pin-primary` button whose label names the step: «Mulai Pemetaan Awal», «Lanjutkan pelajaran», «Mulai Uji Penguasaan», and so on (`aksi.ts:17-28`).
5. **Next screen:**
   - A lesson opens at the furthest page reached.
   - A test shows an orientation page (question count, close date, what is allowed), then «Mulai …».
6. **Work:** reading or answering.

Also on the page:
- «Siap untuk Uji Penguasaan».
- «Pembelajaran Anda», with a card per assignment.
- «Bisa dikerjakan sekarang», showing a teacher's Uji Cepat with «Ditutup {tanggal}».

Empty state: «Belum ada materi yang ditugaskan untuk Anda.»

**Guru**
1. **Login:** email link.
2. **First screen:** `/mengajar` shows the date, «Selamat sore, {nama}», and «Satu hal yang paling layak dikerjakan lebih dulu, lalu kelas dalam lingkup mengajar Anda.»
3. **What the teacher learns:**
   - The card «Layak dikerjakan lebih dulu: {kursus} sudah diterbitkan sekolah, tetapi belum disediakan untuk {kelas}».
   - Or the line «Tidak ada yang menunggu keputusan Anda hari ini.»
   - The class list, with «x/N mengumpulkan» per open test.
   - «Sedang berjalan» (these rows are not links).
4. **Primary action:** «Siapkan {kursus} untuk {kelas}».
5. **Next screen:** `/mengajar/{k}/siapkan?terbitan=…`, opened at step 2 «Tinjau yang akan diterima murid», with the window dates and «Sediakan …».
6. **Work:** `assign_release`. The outcome line reads «Materi disediakan untuk kelas ini.»

Class-level attention is **one class at a time** on `/mengajar/{k}/langkah`: «Yang bisa Anda lakukan sekarang — Diurutkan dari yang paling masuk akal hari ini…», e.g. «Lihat murid yang belum mengumpulkan — 3 murid» (audit #45 A).

Integrity signals are deliberately not the teacher's: «…Keduanya ditinjau Kepala Departemen, bukan pengajar.» (`hle.ts:3188`).

**Kepala Departemen / Dekan**
1. **Login:** email link.
2. **First screen:** `/pimpinan` shows «Apa yang menunggu Anda — Yang muncul di sini memerlukan wewenang, koordinasi, atau penafsiran tingkat institusi. Selebihnya tidak muncul.»
3. **What they learn:**
   - «Keputusan», where audit #45 A shows «Tidak ada keputusan yang menunggu Anda. PINTAR mengusulkan, manusia memutuskan.»
   - «Yang didukung bukti», «Per kelas», «Kesiapan bukti».
   - «Perlu diketahui — Hal berikut tidak menunggu keputusan siapa pun.»
4. **Primary action:**
   - On a decision card: «Saya yang menangani», or «Catat keputusan» with a «Hasil» choice.
   - Without a card: «Lihat lebih rinci».
5. **Next screen:** the scope pages (`/pimpinan/{simpul}`, `…/murid`, `…/umpan-balik`).
6. **Decisions and work:**
   - The four-part card: «Yang didukung bukti / Yang belum diketahui / Langkah yang mungkin / Keputusan Anda».
   - The Head of Department's **content review and integrity review live in Studio**: a Studio tab, then «Antrean Tinjauan» or «Tinjauan Integritas».
   - None of that Studio work is counted on `/pimpinan`.

**Admin sekolah**
1. **Login:** email link.
2. **First screen:** `/konfigurasi` shows «Konfigurasi», then:
   - links: «Menambahkan orang», «Aktivasi akun», «Studio»;
   - cards: «Kesehatan sistem», «Kelas aktif», «Lingkungan»;
   - sections: Struktur sekolah, Laporan, Sistem & Konfigurasi, Pergantian tahun ajaran, Perpindahan peserta didik, Peran & akses, Jejak audit, Fitur & saklar, Templat laporan.
3. **What the admin learns:** the shape of the system, but not what waits for them.
4. **Primary action:** none singled out.
5. **Next screen:** the admin chooses: `/pendataan` (a job in «Menunggu persetujuan Anda»), `/aktivasi` (people awaiting an account), or `/studio` (a course at «Terbitkan», a step only the admin can take).
6. **Decision:** made on those pages.

**Admin platform**
- The same console, plus the schema check, maintenance and registration switches, and granting INSTITUTION_ADMIN and SYSTEM_ADMIN.
- No «Menambahkan orang» link.
- The first job in a new installation (create the school admin, grant the role) is reached through sections. Audit #45 B, S2–S4, shows it works.

## 5. Approval & review matrix

| Workflow | How the user discovers it | Context before deciding | Interactions today | Classification | Evidence |
|---|---|---|---|---|---|
| Studio steps 1–3: «Tandai sudah tersusun», «Tandai lolos pemeriksaan», «Ajukan untuk ditinjau» | Package page; Studio home counts (not links) | Seven-step list; «Yang perlu diselesaikan»; findings | 1 click, no confirmation; outcome «Kursus ini maju ke langkah berikutnya.» | **ONE-CLICK FEASIBLE** (as built) | `LangkahTerbit.tsx:137-145`; `actions.ts:112` |
| **«Setujui isi»** (second person) | «Antrean Tinjauan», about 3 clicks from `/pimpinan` or `/konfigurasi`; counts not links | State, steps and findings on the page; **the content itself is on a separate preview page** | 1 click; **no return or reject path**: the status graph has no way back from IN_REVIEW | **MORE CONTEXT REQUIRED BEFORE DECISION** | `20260912114854_content_lifecycle.sql:37-46`; `studio_governance.sql:63-89` |
| «Buat terbitan» | Package page | As above | 1 click; no success line | **ONE-CLICK FEASIBLE** | `LangkahTerbit.tsx:103-119` |
| **«Kunci terbitan»** (seals content) | Package page | Validators rerun; refused with blockers if not ready | 1 click, **no confirmation**, no success line; irreversible (a correction is a new copy) | **CONFIRMATION JUSTIFIED** | `20261009100000_a_course_is_released.sql:109-156` |
| **«Terbitkan»** (Institution admin only) | Package page; not surfaced on `/konfigurasi` | Readiness check | 1 click, **no confirmation**, no success line; undone only by withdrawal (terminal) | **CONFIRMATION JUSTIFIED** | `publish_release`; `langkah.ts:49-61` |
| «Tarik dari peredaran» | Package page | — | Reason required | **CONFIRMATION JUSTIFIED** (as built) | `withdraw_release` |
| Findings «Sudah saya tinjau» | Package page, «Temuan» | Location, why it matters, how to fix | 1 click, optional note; ERROR findings cannot be acknowledged | **ONE-CLICK FEASIBLE** (as built) | `acknowledge_finding` (`studio_governance.sql:124-170`) |
| Pendataan «Ya, catat orang-orang ini» | `/konfigurasi` → «Menambahkan orang» → job «Menunggu persetujuan Anda» (2 clicks, no count) | «Yang akan terjadi»: rows, new vs registered, «Akun yang bisa masuk» 0, per-role breakdown | 1 press, which now also starts recording (UX-08); over 100 rows gets a pilot of 50, then «Sudah saya periksa, lanjutkan sisanya» | **ONE-CLICK FEASIBLE** for ≤100 rows; the pilot step is the justified confirmation above that | `import_confirm` (`20260926110000…sql:329-371`) |
| Aktivasi (email account / class card) | `/konfigurasi` → «Aktivasi akun» (1 click, no count) | Name and institutional number | 1 click each; the PIN is shown once, inline | **ONE-CLICK FEASIBLE** (as built) | `FormAktivasi.tsx:71-97` |
| Bank Soal question health | Studio home count «Sinyal mutu soal» (not a link) → Bank Soal (**latest 40 items, not only flagged ones**) | Stem and bank type; **what raised the signal is not shown** | Select plus «Catat tinjauan», only at SIGNAL_RAISED; **two of the three options are refused** by the transition table; after UNDER_REVIEW no form, so **the review cannot be concluded** | **MORE CONTEXT REQUIRED BEFORE DECISION** (and a dead end) | `studio/bank/page.tsx:70-78`; `20260912200213…sql:150-157` |
| Integrity-signal review (Head of Department, Institution admin) | Studio nav «Tinjauan Integritas» (no count) | Short session id and categories with times; **no learner, class or assessment** | Select plus note, «Catat tinjauan»; records **only the session's first signal** (`group[0].id`); reviewed items stay listed; **«Diteruskan ke pihak sekolah» creates no management decision** | **MORE CONTEXT REQUIRED BEFORE DECISION** | `studio/integritas/page.tsx:60-72`; `record_integrity_review` |
| `/pimpinan` management decision | On the landing, oldest first | Four-part evidence chain, the subject, the referrer's note | «Saya yang menangani» 1 click; «Catat keputusan» with an explicit «Hasil»; outcome shown on the card | Take: **ONE-CLICK FEASIBLE**. Decide: **CONFIRMATION JUSTIFIED**, which the explicit outcome choice already serves. **Unreachable: nothing in `src/` calls `refer_integrity_signal`.** | `KartuKeputusan.tsx:112-147`; `20260924110000…sql:175-286` |
| Feedback round close | `/pimpinan` → «Lihat lebih rinci» → umpan-balik | Round state | A two-step panel; terminal | **CONFIRMATION JUSTIFIED** (as built) | `TutupPutaran.tsx` |
| Transfers «Setujui / Laksanakan / Tolak» | `/konfigurasi` section 5, inline | Transfer row | 1 click, optional reason; buttons are shown to both sides, but only the counterpart may authorize | Setujui/Tolak: **ONE-CLICK FEASIBLE**. Laksanakan (irreversible): **CONFIRMATION JUSTIFIED** | `20260912004527_transfer_rollover.sql:121-126` |
| Uji Cepat launch (teacher) | Class page «Uji Cepat» (2 clicks) | Tinjau step: «Yang akan terjadi», four consequences | Atur → Tinjau → «Sediakan Uji Cepat sekarang» | **CONFIRMATION JUSTIFIED** (as built). Studio's `/studio/kuis` launches with no review step | `uji-cepat/page.tsx:173-213`; `kuis/page.tsx:107-145` |
| Siapkan / Sediakan materi | Teacher's suggestion card (1 click) | Review page «Yang akan diterima murid», with window dates | 2 clicks | **CONFIRMATION JUSTIFIED**: the window is an input | `siapkan/page.tsx:134-241` |
| Release move (Studio «Pindahkan») | Package page | Current release, target, **required reason** | 1 click after the reason | **CONFIRMATION JUSTIFIED** (as built) | `move_learning_assignment_release` |
| Certificates | Automatic on the result page | — | No human decision | **NOT APPLICABLE** | `lib/sertifikat.ts:143-160` |

**No unnecessary confirmation step was found.** The opposite holds: the two irreversible release steps, Kunci and Terbitkan, have none.

## 6. Friction against the 60-second rule

1. **A successful email sign-in shows the «Tautan ini sudah tidak berlaku» failure screen before the home.**
   - Evidence: `TukarTautan.tsx:49`, and Next 16.3.5 rejecting a redirecting action's promise.
   - Effect: a false failure message and a «Minta tautan baru» button at the moment of success. Focus moves to it, and pressing it leads to S15.
   - Roles: all email sign-ins.
   - **Severity: HIGH.**
2. **The management decision queue is never fed.**
   - Evidence: only INTEGRITY_REFERRAL can create a decision, through `refer_integrity_signal`, and no code in `src/` calls it. Studio's «Diteruskan ke pihak sekolah» records a review and creates nothing.
   - Effect: `/pimpinan` always says «Tidak ada keputusan yang menunggu Anda», even after a reviewer has "forwarded" a case, so the zero state is structurally false.
   - Roles: Head of Department, Dean (and the Studio reviewer who forwards).
   - **Severity: HIGH.**
3. **The teacher's one suggestion ignores subject and grade.**
   - Evidence: `satuHal` (`src/lib/pengajar.ts:625-657`) takes any PUBLISHED school release not yet assigned to a class in scope.
   - Effect: once a school publishes for more than one grade or subject (SD 5 Matematika, SMA XI Geografi, and SMA X Matematika next), a Grade 5 teacher can be told that an SMA course is «Layak dikerjakan lebih dulu». The «Tidak ada yang menunggu…» line then rarely appears.
   - Role: Guru.
   - **Severity: HIGH**, because it is the landing's primary action.
4. **The admin landing surfaces no pending work.**
   - Evidence: `/konfigurasi` shows sections and links only. Import approval, activation and «Terbitkan» are each on their own page with no count.
   - Effect: the admin must visit Pendataan, Aktivasi and Studio to learn what waits.
   - Role: Admin sekolah (and Admin platform).
   - **Severity: MEDIUM.**
5. **Studio work is counted but not reachable, and not shown on the reviewers' landings.**
   - Evidence: the `/studio` home count cards («Menunggu tinjauan Anda», «Sinyal mutu soal») are `<div>`s, not links (`studio/page.tsx:30-36`). Neither `/pimpinan` nor `/konfigurasi` shows them.
   - Effect: the second-person review is found by navigating.
   - Roles: Head of Department, Institution admin.
   - **Severity: MEDIUM.**
6. **A question-health review cannot be completed.**
   - Evidence: the form appears only at SIGNAL_RAISED; two of its three options are illegal transitions from there; after UNDER_REVIEW no form renders. The list is the latest 40 items and doesn't show the cause.
   - Effect: a flagged question can be picked up but never closed.
   - Roles: Head of Department, Institution admin.
   - **Severity: MEDIUM.**
7. **Integrity review lacks decision context and state.**
   - Evidence: no learner, class or assessment is shown; only the first signal of a session is recorded; reviewed items stay listed; the referral goes nowhere (item 2).
   - Effect: the reviewer cannot judge, and cannot tell what they have already handled.
   - Roles: Head of Department, Institution admin.
   - **Severity: MEDIUM.**
8. **Content review cannot send work back.**
   - Evidence: «Setujui isi» is the only control at IN_REVIEW; no backward edge exists.
   - Effect: a reviewer who finds a problem can only withhold approval and tell the author outside PINTAR.
   - Roles: Head of Department, Institution admin.
   - **Severity: MEDIUM.**
9. **Teacher: class-level attention is one class at a time.**
   - Evidence: per-class flags are absent on `/mengajar`; «Sedang berjalan» rows are not links; «Yang bisa Anda lakukan sekarang» is on `/mengajar/{k}/langkah`.
   - Effect: a teacher with several classes opens each one to see who needs them.
   - Role: Guru.
   - **Severity: MEDIUM.**
10. **The first-landing tour is modal.**
    - Evidence: `Tur.tsx:155-181, 434-435`, up to 3 automatic showings.
    - Effect: it blocks the landing until skipped.
    - Roles: Murid, Guru.
    - **Severity: LOW.**
11. **The result of an action is not always said.**
    - Evidence: release steps 5–7 re-render with no success line.
    - Roles: Head of Department, Institution admin.
    - **Severity: LOW.**
12. **Learner: a new result is never the next action, and there is no «all done» state.**
    - Evidence: a finished assignment leaves the panel (`siklus.ts:188`); «Lihat hasil» is a plain card button.
    - Role: Murid.
    - **Severity: LOW.**

## 7. Things already done well (preserve these)

- **Role homes, not a generic dashboard.** `berandaPeran` sends each role to its own surface. The class-card sign-in has no intermediate screen at all.
- **The learner's «Langkah berikutnya».**
  - One primary button whose label *is* the action, ranked by an explicit, testable rule (`peringkat`).
  - A lesson resumes at the furthest page.
  - An orientation page stands before every test.
  - This already is Login → Understand → Act.
- **The teacher's «one thing first».**
  - A single «Layak dikerjakan lebih dulu» card that deep-links to step 2 of the flow, so it takes 2 clicks.
  - An explicit «Tidak ada yang menunggu keputusan Anda hari ini.»
  - `/langkah`'s «Yang bisa Anda lakukan sekarang — Diurutkan dari yang paling masuk akal hari ini».
  - The evidence page's «Belum cukup bukan berarti buruk — artinya belum.»
- **`/pimpinan` is the best attention surface in the product.**
  - «Apa yang menunggu Anda» as the H1.
  - Decisions oldest first, each with a four-part evidence chain and in-place controls.
  - An explicit zero state.
  - «Perlu diketahui» kept apart from decisions («tidak menunggu keputusan siapa pun»).
  - It only needs feeding.
- **Decision pages that carry their own context.**
  - Pendataan's «Yang akan terjadi» (with revalidation at the press and the pilot gate).
  - The Uji Cepat review step listing consequences.
  - Studio's steps saying who acts and why not you («Anda menyusun kursus ini, jadi langkah ini diambil orang kedua»).
  - Findings with location / why / how.
  - Refusals listing their blockers.
- **Honest zero states where they exist.**
  - «Semua orang yang sudah didata sudah bisa masuk.»
  - «Tidak ada yang menunggu tinjauan Anda.»
  - «Tidak ada catatan mutu yang menunggu.»
- **S14's wording is right for real failures.** It explains the same-device/browser rule next to the way out.

## 8. Final answer

1. **Where each role lands:**
   - Murid: `/belajar`.
   - Guru: `/mengajar`.
   - Kepala Departemen and Dekan: `/pimpinan`.
   - Admin sekolah and Admin platform: `/konfigurasi`.
   - No role: `/` («Mau ke mana hari ini?», or «Akun Anda belum terhubung…»).
   - An evaluation persona lands on `/`.
2. **Does each role immediately know what to do next?**
   - Murid: yes.
   - Guru: mostly, but the one suggestion can be the wrong course.
   - Kepala Departemen and Dekan: they are told nothing waits, and the product guarantees that sentence.
   - Admins: no.
3. **Surfaced, or hunted?**
   - Surfaced for the learner.
   - Partly surfaced for the teacher.
   - For management, the surface exists but is unfed, and Studio review work is hunted.
   - Hunted for admins.
4. **Which approval flows could approach one-click?**
   - Already one-click and safely so: Studio steps 1–3 and «Buat terbitan»; findings acknowledgment; Aktivasi; Pendataan approval (≤100 rows, the page being its own confirmation); transfers «Setujui» / «Tolak»; `/pimpinan` «Saya yang menangani».
   - Not one-click: «Kunci terbitan», «Terbitkan», withdrawal, the release move, Uji Cepat launch, transfer execution, integrity and management outcomes, closing a feedback round.
   - Not yet decidable in one click: «Setujui isi», question health and integrity review, which need more context on the page first.
5. **Is authentication plumbing unnecessarily visible after login?** **Yes.** Every successful email sign-in passes through the false «Tautan ini sudah tidak berlaku» screen (item 1). The same-device note on the «Periksa email Anda» screen and S15 are legitimate.
6. **Closest to the 60-second principle:** Murid.
7. **Furthest from it:** Admin sekolah, with Admin platform alongside.
8. **What kind of problems these are.** Mostly **information architecture**: attention is not aggregated onto the Head of Department's and admin's landings, counts are not links, and class-level needs are buried. Then **missing wiring and functionality**: the decision queue is unfed, question health dead-ends, review has no return path, and the suggestion's filter is incomplete. Then **one unnecessary intermediate screen**: the S14 flash. **Not** visual presentation.
9. **Polish phase, or 4.0 functional issue?**
   - **Functional, better decided before the polish stage**, because each makes a screen say something untrue or a workflow unable to finish:
     - item 1, the false failure screen;
     - item 2, the unfed decision queue with its false zero state;
     - item 3, a wrong primary suggestion;
     - item 6, a review that cannot be concluded.
   - **Functional, but Yazid may choose to schedule them with the review work:** item 7 (integrity context and state) and item 8 (return path).
   - **Can wait for the terminology/UI/UX polish review:** items 4, 5, 9, 10, 11 and 12, which are IA, navigation and presentation of work that already exists.

**60-SECOND UX EXECUTION: PARTIAL**
