# Engineering items found during Daisy's design work (register; NOT authorised) · 4 Nov 2026

**What this is:**
- Defects and compatibility requirements that Daisy or the coordinator found while composing or reviewing A1, B1, C1 and D1.
- Each is engineering's, not a design decision. Each gets a regression test that fails red against today's code before the fix.
- **Nothing here is authorised.** Each item is built only at its item's implementation gate (the brief, §5 and §8), on the development branch, under the owner's authorisation.

**Already done:** the card email's role order (D-164(b), `9b52b51`, B6K-URUTAN-02; CI and journeys green).

## C1 · reports, Management and professional learning (D-167)

Found by Daisy, C1 part B §8 (`ux-1/daisy-experience` at `9914bc97`).

| # | Defect | Planned regression test (red today, green after) |
|---|---|---|
| E-C1-1 | A raw data key can appear as a label | render each report surface with an entry whose `label_key` has no copy; no key-shaped text (`[a-z]+(\.[a-z_]+)+`) reaches the page; the static «every key in the table» guard extended to the keys these pages read |
| E-C1-2 | Staff pages use the educator wording (`s(…, "educator", …)` on pages a Dekan, Kepala departemen or Admin sekolah reads) | source and rendered: each staff report page asks the copy table with the staff persona; the rendered words match the staff copy |
| E-C1-3 | Two pages can render an empty heading | rendered: no `h1`–`h3` with empty text on any C1 route, in any state (including withheld and not-yet entries) |
| E-C1-4 | The `/pengembangan` refusal falls back to a generic line | the refusal renders Daisy's proposed key (after copy approval), in both languages; never the generic fallback |
| E-C1-5 | The `/pengembangan` footer prints | the A4 print walk (`audit/b6-cetak.mjs`) gains `/pengembangan/[simpul]`: no shell part, footer included, on paper |
| E-C1-6 | `/pengembangan` picks its shell from role names in the page code (`peranSaya`, `src/app/pengembangan/[simpul]/page.tsx:37–39`) | source: the shell is chosen from the working context (D-132), as every other staff page does, not by matching role names; rendered: each audience gets its own context's shell |

### E-C1-7 · The safeguard: Admin sekolah never retrieves an individual professional-learning result (owner, 4 Nov)

**The rule:** D-069(b). The facilitator, the Kepala departemen over the place and the Dekan see each participant's result/score. **Admin sekolah sees enrolment, participation and completion, never a result**, and that is enforced at the database boundary, not by hiding a column (D-069(b): «enforced at the database/RLS boundary, never only by hiding UI»).

**What is already proven:** BOB43-D01 runs against the database. As Admin sekolah it shows:
- no PD row in `assessment_sessions`, `lesson_progress`, `responses`, `presented_items` or `integrity_signals`;
- `professional_learning_record` returning only the enrolment, participation and completion columns.

**What the safeguard adds:** a sweep, as Admin sekolah, of **every other path** to a PD participant's result. Each must return nothing for a PD session, or refuse:
- `assessment_results` read directly;
- `metric_evaluate('learner.result', …)` and every catalogue metric that carries a result, for the PD participant;
- `generate_report` on a template naming such a metric, at the PD Kelas, its Bagian and the school;
- the certificate reads (`my_certificate` is the learner's own; the verification and management reads for a PD certificate);
- the `/pengembangan`, Ringkasan, `/pimpinan` and Konfigurasi API routes, read with Admin sekolah's session.

**A planted control:** the test grants Admin sekolah one read, for example a permissive policy on `assessment_results`, inside a rolled-back transaction, and must then go red. That shows the sweep can detect a leak.

**Why it matters:** the earlier educator-as-learner evidence-access defect showed that a column hidden in the page is not a boundary. This test reads the database as the person, the way BOB43-D01 does.

## C2 · the PD Kelas «Lihat bukti» (design under review)

Found by Daisy in C2 (`ux-1/daisy-experience` at `d9a27652`), or by the coordinator reviewing it.

| # | Item | Planned regression test |
|---|---|---|
| E-C2-1 | «Lihat nama murid» does not switch to the participant word for a PD Kelas (proposed key `mengajar.bukti.siapa_peserta`, pending copy approval); seen live twice. The `/siapa` names link to `/mengajar/[kelas]/murid/[orang]` | rendered PD Kelas: no «murid» anywhere on the page or on the participant's page it links to (UX1-AJAR-KATA-01 extended) |
| E-C2-2 | For a PD Kelas the page still asks for the five class metrics and draws five «not yet» cards. D-070(h): no figure is added or computed | source and rendered: for a PD Kelas the page requests no class metric and draws only the one statement and the link to the record; the ordinary class page is unchanged |
| E-C2-3 | «Lihat per soal» is offered on a PD Kelas, and the per-question page **refuses the facilitator** (seen live, `verifikasi-b1-c2/putaran-2`); «Minta membaca lagi» stays. The database refuses the facilitator participants' answers (BOB43-D01 `jawaban_fasilitator` 0; live probe 0) | rendered PD Kelas: no link to a page that refuses this reader; the per-question page still refuses, and shows no participant's answer, if reached by address |

**Checked during review:** BOB43-D01 lets Admin sekolah read a PD `assessment_sessions` row (`sesi_admin: 1`). That table holds status and timestamps only: no score or result (`supabase/migrations/20260912133821_evidence_session_root.sql`). So it is completion, which D-069(b) allows. Results live in `assessment_results`, and E-C1-7 sweeps them.

## B1 · Konfigurasi (D-166(a))

| # | Item | Planned test |
|---|---|---|
| E-B1-1 | **Every existing Konfigurasi link keeps working:** the anchors (`#struktur`, `#roles`, `#rollover`, `#pindah`, `#system`, `#pemeliharaan`) and the query parameters (`?bagian=…`, `?hasil=…`, `?muat=…`, `?sekolah=…`, `?periksa=skema`, `?cari_sekolah=…`, `?hal_jejak=…`), from server actions, Persiapan, Ringkasan and the walks | a table of every link found in `src/` and `audit/`; each lands on its section page with the same result line; the walks updated to the routes |
| E-B1-2 | `config.refused`'s English says «system administrators only»; the Indonesian says Admin sekolah or Admin platform | the rendered copy says the same thing in both languages (after copy approval) |
| E-B1-3 | The seed school's display name: a seed-file change (`supabase/seed/official_bootstrap.sql:68`, and `audit/studio-ujung.mjs`), development and CI only; the wording waits on Dr Gladys | the seed and the walk agree; no migration |
| E-B1-4 | The design system's date field: the calendar button shows no focus ring (Daisy's proposed fix; a change to the frozen system) | rendered: every Tab stop of a date field shows the focus ring |

## A1 · the question review (D-166(b))

| # | Item | Planned test |
|---|---|---|
| E-A1-1 | The question loader (`src/lib/soal-tinjauan.ts`, `susunSoal`) does not read each question's difficulty band (`items.predicted_difficulty`) or each option's misconception (`item_options.misconception_code`) | the loader returns both; the review renders them; reading stays limited to the drafter's existing access |

## D1 · the identity emails

The full plan is in `05-D1-IMPLEMENTATION-TEST-PLAN.md`.
