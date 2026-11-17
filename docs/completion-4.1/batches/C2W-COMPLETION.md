# C2w · Reviewer notes on sealed questions («Catatan peninjau»)

Second Eye, 17 Nov 2026. Branch `claude/c2w`, over `a9d303b20294cf9fee9279944f66a3be6f1300fc`.
Source: `PLAN-A2B-C2W.md` §3 (on `claude/bob-41-master-plan`). Daisy's words: `A2B-C2W-KATA.md` §3 (on
`ux-1/daisy-experience`).

> **Status:** design only. **Nothing is built.** This page records the entry conditions and the design for
> Sharon's and Daisy's short reviews (§3.2). The build starts after both are recorded here.
> **Correction (Chief Architect, 17 Nov 07:12):** `a9d303b2` holds A2B-R2 and the F-3/F-4 entry evidence only. It is
> not C2w; its freeze was withdrawn (`3cb48f2a`).

## 1 · Purpose (§3.1)

A reviewer records what a wrong option reveals about learners' thinking, after the question is sealed.
- A note never changes a question, a score or a report.
- No learner ever sees one.

## 2 · Entry conditions (§3.2)

| Condition | State | Evidence |
|---|---|---|
| F-1 (derived views read the key in force) | **Closed**: corrected, accepted, on staging | 20270117100000 (`kunci_berlaku_sesi`); on main |
| F1-R1b (a key correction clears the explanations it makes stale) | **Closed**: corrected, accepted, on staging | 20270117140000; on main |
| F-4: concurrent edits of one draft, two connections, the shared race helper | **Closed** | C2W-F4R at `ac49795c` (Sharon: accepted) |
| F-3: a platform admin decides a PD certificate review, with its refusal counterpart | **Closed**, no authorization defect | C2W-F3D at `8cf25792` (Sharon: accepted) |
| A2b accepted on staging | **Promoted**: main `1b1cada8`, staging at 282; Sharon's acceptance check in progress | Chief Architect, 17 Nov 02:14 |
| Sharon's short design review | **Pending**: this page | — |
| Daisy's short review | **Pending**: this page | — |

## 3 · Already decided (§3.3), carried as they are

- Notes are rows in their own table: attributed, dated, immutable. A correction is a new note that replaces the old.
  Nothing is edited or deleted.
- A note is shown for every revision of the question, stating which revision it was written on.
- The table never feeds a report. The metric-source refusal names it, and learners never see a note.
- Platform-library notes are written by the platform's content reviewers only. A school does not annotate platform
  content in 4.1.
- Notes naming a misconception-taxonomy code are out of scope (M-3).
- The words are «Catatan peninjau» and «belum dikaitkan dengan pemahaman keliru». «anotasi» never appears on a screen
  (ruling 30).
- Notes do not print (O-3).
- I-5: a note written before a key correction stays attached to its revision. Read against a later revision whose key
  differs, it says so in Daisy's words (§6).

## 4 · The design, for review

### 4.1 One table: `catatan_peninjau`

| Column | Meaning |
|---|---|
| `id` | uuid |
| `item_id` | the revision the note was written on (a sealed item) |
| `opsi_label` | the option the note is about (A to E), on that revision |
| `institution_id` | the item's owner (a school, or the platform library) |
| `isi` | the text, 1 to 1000 characters, no control characters |
| `ditulis_oleh` | the person (never null) |
| `ditulis_pada` | `clock_timestamp()` |
| `menggantikan_id` | the note this one replaces, on the same item and option; null for a first note |

- **Immutable:** a trigger refuses every UPDATE and DELETE (also for the owner role). Row-level security is on, and the
  table is revoked from every client role. It is read and written only through the functions in §4.2.
- **One live note per item and option:** a note is current when no note replaces it. A unique index on
  `menggantikan_id` (where not null) stops two notes from replacing the same one.
- **Sealed only:** `content_is_sealed(course of item)` must hold at the write.
- **Not frozen content:** the table is outside `enforce_taught_content_immutable`'s list, so a note is not part of the
  question. B1 proves that the question, its options, every result and every metric evaluation stay byte-identical.

### 4.2 Functions (each registered in `client_rpc_registry`, STAFF, `CAPABILITY`)

| Function | What it does | Who may |
|---|---|---|
| `catatan_peninjau_tulis(item, opsi, isi, menggantikan)` | Writes a note, or a replacement of the current one | **School content:** `CAN_REVIEW` in the item's school. **Platform library** (`tenant_platform`): only the library's own reviewers (`peran_tenant_punya(…, 'CAN_REVIEW', library)`) or the platform admin. **Never** a learner, a teacher with `CAN_DRAFT` alone, or another school's reviewer |
| `catatan_peninjau_studio(item)` | The notes for every revision of the question's line, for Studio | The same readers as `riwayat_soal` (CAN_DRAFT or CAN_REVIEW over the item's owner) |
| `catatan_peninjau_kelas(kelas, item)` | The notes beside the class misconception report | A teacher authorised for that class's report (`metric_evaluate('class.misconceptions', …)`'s own rule), for a question in that class's evidence, including a library question released to their school (B6) |

- **No existence oracle:** an unknown item, and an item the caller may not read, are refused alike.
- **The line:** every revision on the question's `supersedes_item_id` chain, walked as `riwayat_soal` walks it. No
  stored chain root (that would be §3.5's one escalation, a column on `items`, and it would come to Sharon).

### 4.3 I-5: the line for a note read against a later revision

- The key at the note's revision is that sealed revision's `is_correct` options. It never changes.
- The key now is the revision being read: in Studio, the revision on screen; beside the report, the key in force
  (`kunci_berlaku_sesi`).
- **When they differ**, the note's first line is Daisy's (§6), with `{kunci_saat_itu}`, `{kunci_kini}` and, in Studio,
  `{n}`: the version number as «Riwayat soal» counts it.
- **When they match** (a note written after the correction, or on a question never corrected): no line.

### 4.4 Never evidence, never a learner's

- The metric-source refusal trigger names `catatan_peninjau`, and the closure assertion checks that no `calc_*`
  function or metric view reads it.
- No learner function returns a note. Proved as F06-P01 proves its secret: the note's own text is absent from every
  learner projection and API answer.
- No print route reads the table.

### 4.5 The two disclosures

- **Studio** (`src/app/studio/paket/[course]/page.tsx`, beside `<RiwayatSoal>`): `<details class="pin-disclosure">`
  «Catatan peninjau», one block per option, each block naming the version it was written on.
- **Beside the class report** (`src/app/mengajar/[kelas]/soal/…`, the per-question evidence): the same disclosure, read
  only, with the teacher variant of I-5.

## 5 · Acceptance evidence (§3.4), as red-first tests

| # | Evidence | Test |
|---|---|---|
| B1 | Before and after a note: the question, its options, every result and every metric evaluation byte-identical | C2W-B1 (db) |
| B2 | A non-reviewer, a learner and another school's reviewer cannot write; nothing updates or deletes a note; declaring the table a metric source fails | C2W-B2 (db) |
| B3 | App: a reviewer adds and replaces a note; no learner surface or API answer contains one | C2W-B3 (app) |
| B4 | I-5 in Studio: a note calls B a common wrong answer, the key is corrected to B, and against the corrected revision the note shows it predates the correction and names its version | C2W-B4 (db + app, screenshots) |
| B5 | I-5 beside the class report: the same case, read by a teacher | C2W-B5 (db + app, screenshots) |
| B6 | A school reviewer cannot write on a library question; a teacher in a school that received the release reads it through the class report | C2W-B6 (db) |
| B7 | 1280, 390 and 320 px, with keyboard: both disclosures | captures on the frozen commit |
| B8 | Journeys; staging promotion with preservation readings | Chief Architect |

## 6 · The words

**Final (Daisy, `A2B-C2W-KATA.md` §3), I-5 only:**

| Where | ID | EN |
|---|---|---|
| Studio | «Ditulis sebelum kunci soal ini diperbaiki, saat kuncinya masih {kunci_saat_itu}. Catatan ini tentang versi {n}; kunci yang berlaku sekarang {kunci_kini}.» | «Written before this question's key was corrected, when its key was still {kunci_saat_itu}. This note is about version {n}; the key in force now is {kunci_kini}.» |
| Beside the class report | «Ditulis sebelum kunci soal ini diperbaiki, saat kuncinya masih {kunci_saat_itu}. Kunci yang berlaku sekarang {kunci_kini}.» | «Written before this question's key was corrected, when its key was still {kunci_saat_itu}. The key in force now is {kunci_kini}.» |

**Needed from Daisy before the build** (no words exist for them yet):
1. The disclosure's states: none yet, one note, a replaced note (is the replaced one shown, and how).
2. The writer's form: the field label, the option choice, «Simpan», and the refusals (not sealed, not a reviewer, a
   library question, too long).
3. The attribution line: «{nama}, {tanggal}» and the version.
4. Where «belum dikaitkan dengan pemahaman keliru» sits: on every note (M-3: a note never names a code), or only when
   the option has no misconception link.

## 7 · Migrations

- **One new migration**, after C2w's `20270121100000`: `20270121110000_a_reviewer_notes_what_a_wrong_option_reveals.sql`.
  It holds the table, its guard trigger, the three functions, their grants (ADR-0021), their registry rows, and the
  metric-source refusal's new name.
- A3's two migrations (`20270121200000`, `20270121210000`) sort after it.

## 8 · Questions for the reviews

- **Sharon:**
  - Is `CAN_REVIEW` the right capability for a school's writer (HEAD_OF_DEPARTMENT and INSTITUTION_ADMIN hold it;
    EDUCATOR does not)?
  - Is the library writer rule right, and is it enough that the teacher's read goes through the report's own
    authorization?
  - Is walking the revision chain on each read acceptable, with no stored root?
- **Daisy:**
  - the four word gaps in §6;
  - where the Studio disclosure sits relative to «Riwayat soal».
