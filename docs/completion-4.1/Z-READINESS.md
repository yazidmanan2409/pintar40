# Z · readiness tracker

Bob, 18 Nov 2026, about 10:00 UTC. **One list of everything that must be true, or triaged, before Z's candidate** (`PLAN-A3-C3W-Z.md` §4.2).
- It gathers items now scattered across `TEAM-INSTRUCTIONS.md`, the batch records and reviews, so that they can be
  worked in parallel with A3 and C3w-1 instead of all at once at Z.
- It adds no scope: every item below is already recorded, and its source is cited.
- Owners update their row with a commit.

## 1 · Batches

| Batch | State | What remains |
|---|---|---|
| B0, A1, C1w, B1, B2, A2a, A2b | Accepted on staging | — |
| **C2w** | **Accepted on staging at 284** (ruling 53) | — |
| **A3** | Building; head `fc7a26e5`, 286 migrations; V-1 and V-2 done | The recovery act (red cases to Sharon first), the teacher's authorisation and the finish manifest. Then merge main (now with C2w) into it: pins to 288 and a full pre-flight. Then the dry run (Sharon's six proofs; step 0's line-4 reference at 284), the reviews, CI, the journeys, the freeze and the promotion (owner) |
| **C3w-1** | Pre-build review complete (`C3W-1-DESIGN.md` §9) | Built after A3. Daisy's Z-2, Z-3 (one answer for unknown and forbidden, V-3), N-6 and N-7 come first |
| **C3w-2** | Waits for E's results, the owner's qualification and limits, egress and the key | — |

## 2 · The register carried to Z

| # | Item | Source | Owner | State |
|---|---|---|---|---|
| R-1 | A departed learner opening a sitting directly by its web address | Sharon's ruling; A2a page, item 6 | Second Eye | Re-check when A3 changes the start path |
| R-2 | Two simultaneous refused acts can each write an audit row | Sharon; A2a page, item 7 | Second Eye | Triage |
| R-3 | A2b's person-level start branch reads `now()`, not `clock_timestamp()` | Sharon, A2b commit 2 | Second Eye | Triage |
| R-4 | A2B-R3 | A2b acceptance | Second Eye | Triage |
| R-5 | A2B-R1 (emergency reason codes): deferred, not a blocker | PLAN §4.2 | — | Stated |
| R-6 | The L01 ranks (A3-R3); C3w-1 adds its three tables (Sharon, D-4) | A2b acceptance; C3W-1-DESIGN §9 | Second Eye | With A3 and C3w-1 |
| R-7 | **X-1:** a Studio refusal renders two `<main id="isi">` | TEAM-INSTRUCTIONS register | Daisy verifies | **Lands as Z-2** in C3w-1's first commits |
| R-8 | **X-2:** six `/belajar/[tugas]/` sub-pages don't check that the id belongs to the learner (they show the generic error page) | same | Second Eye; Daisy verifies | Open |
| R-9 | **X-3:** an unknown correction id shows "not allowed" | same | Daisy verifies | **Lands as Z-3, revised:** ONE answer for unknown and forbidden (Daisy's V-3) |
| R-10 | **X-4:** a Konfigurasi sub-page shows a shorter navigation than the index | same | Second Eye builds; Daisy verifies | **Open on `main` `7ba18b03`** (Daisy, ux-1 `1166d8bf`, `Z-SIAP-DAISY-7ba18b03.md` §1). Spec: every sub-page renders `/konfigurasi`'s navigation from one source, with `aria-current`; test over seven sub-pages × two admins × 1280 and 390. **Sibling N-9:** `/konfigurasi/staf` with an unknown person shows the certificate page's refusal; it gets Z-3's neutral form, one answer for unknown and forbidden |
| R-11 | Phone-width overflow on `/mengajar/[kelas]/siapa`, `soal` and `bukti` | Daisy | Second Eye builds; Daisy verifies | **Open on `/siapa` only;** `/soal` and `/bukti` clean (same record §2). Spec: stacked rows below 640, the mode switch wraps below 360, and a framed-overflow assertion added to the rendered-check helper and swept over every `pin-tabel-bingkai` and `pin-seg` page (N-8 rides that sweep) |
| R-12 | Daisy's N-1 to N-5, plus N-6 and N-7 (Kanonik keys) | A2b acceptance; Daisy `dde78004`, `1166d8bf` §3 | Second Eye builds; Daisy verifies | **Confirmed:** N-1 and N-2 open, **Z** (one string each); N-3 and N-5 open, **4.2**; N-4 **closed, not a defect**; N-6 and N-7 land in C3w-1; N-8 with R-11's sweep |
| R-13 | The three 4.0 rendered checks on staging (a night-issued certificate's date; the integrity count line; «Materi tanpa judul») | EXECUTION-PLAN §6 | Daisy, or a browser-capable person | Outstanding; before the walkthrough |
| R-14 | **X-15** (planning audit): four readers treat a not-yet-started role as live (`studio_capabilities`, `refuse_duplicate_active_grant`, `sertifikat_koreksi_tolak`, `orang_dipegang`) | Second Eye, 18 Nov | Bob | **Triaged (Bob, 18 Nov): not reachable today.** Every product path that grants a role on `main` writes `valid_from` as `now()` (for example `the_last_administrator_is_never_removed`:383), and no RPC accepts a start date; only fixtures use past dates. A future start cannot exist until 4.2-02 adds one, so the four readers are restated **before 4.2-02** (planning audit X-15). Not a Z item |
| R-15 | Non-blocking findings carried from 4.0, A1 and C1w ("with the batch that touches the same code, or in 4.2") | EXECUTION-PLAN §5 | Bob | Triage at Z; most go to 4.2 or the rationalisation audit |
| R-16 | **D-1:** multi-answer readers repaired, with containment until then (ruling 55) | `POST-REVIEW-EXECUTION-18NOV.md` §3 | Sharon (inventory); Second Eye (repair) | **Z, approved. Inventory done:** 13 live readers, **7 affected**. Learner-facing: `session_review`, `session_misconceptions`, `reading_map`. Teacher-facing: `teacher_question_evidence`. Statistical: `service_item_statistics`, `service_distractor_uptake`, `service_cohort_misconceptions`. `session_answers` and scoring already handle arrays (Sharon, `RULING55-D1-D8-D6-7ba18b03.md`). **Staging: 0 multi-answer items** (D-8, `d1-evidence/`). The only content is the local and CI seed's «Pecahan»: synthetic learners only, so no containment is triggered |
| R-19 | **The local shape file lacks `auth.users.banned_until`,** so golden-db fails on `main` (Sharon, while building the inventory) | Sharon, 18 Nov | Second Eye | **Z** |
| R-17 | **D-6:** the anonymous feedback round hidden pending Sharon's review; no deletion | ruling 55 | Sharon, then Second Eye | **Reviewed:** learners rate a named educator; it is reachable (9 RPCs granted to authenticated; links from /belajar, /mengajar, /pimpinan and /konfigurasi). **Containment:** revoke EXECUTE from authenticated on `open_feedback_cycle`, `submit_feedback`, `close_feedback_cycle` and the two publish functions, hide the links, delete nothing, with a test. In the Z window |
| R-18 | **D-2:** certificate conditions. Before any real certificate; whether it rides Z is the owner's call by 24 Nov | ruling 55 | Bob (specification); Dr Gladys; Sharon | Specification by 20 Nov |

## 3 · Z's other entry items

| Item | State |
|---|---|
| The external-AI guide and prompts (onboarding X-1) ready for the walkthrough | **Ready.** Written (Daisy), data warning reviewed (Sharon), paste test done 16 Nov; final text placed at `docs/onboarding/PANDUAN-AI-SENDIRI.md` (column headers checked against `main`'s import contract). The message table (§5) is confirmed at the walkthrough |
| The six integrated journeys (PLAN §4.3, Addendum 1) | J3 needs C3w-2 on staging. J1, J2, J4, J5 and J6 can be written against main as batches land |
| A fresh-built schema equal to migrated staging; restore yields both scheduled jobs | At Z |
| The owner's decisions | Staging promotion at Z; the walkthrough date (O41-7) |

## 4 · What can move now, without waiting for A3

- **Daisy: all done (18 Nov, ux-1 `1166d8bf` and `6c59a0f8`).** R-10, R-11 and R-12 confirmed with specs; X-1 closed;
  the vocabulary page (planning audit D-V) is `KOSAKATA-RIWAYAT-DAN-PENOLAKAN.md` on her branch.
- **The fixes that follow** (R-10 with N-9, R-11 with N-8, N-1, N-2) are app code, so Second Eye builds them after A3,
  with R-8, before C3w-1's Z commits.
- **Second Eye:** R-8 is small but changes app code, so it is built
  after A3, before C3w-1's Z commits.
- **Bob:**
  - R-15's triage list;
  - the Z journey skeletons for J1, J2, J4, J5 and J6, mapped to existing tests.

## 5 · R-15 triage (Bob, 18 Nov, 12:10 UTC). Provisional

Source: `EXECUTION-PLAN.md` §5. **The disposition is provisional:** where an item was "taken with" A1 or C1w, its state is
read from that batch's acceptance record at Z, not assumed. The owner of each check confirms with one line.

| Item | Disposition | Check by |
|---|---|---|
| 4.0, Sharon: the school guard before `not (v_summary ? 'run_id')`; the school filter in the run check; F37-K06 by a plant | **Z, verify.** Authority ordering, so not cosmetic. If still open, fix with R-8 after A3 | Sharon |
| 4.0, Daisy: the audit-run Tab scroll; the 15 px header strip on a phone | **Z, with R-11's sweep** (same rendered-check helper) | Daisy |
| 4.0, Daisy: broader audit presentation | **4.2** | — |
| 4.0, cosmetic: Kenaikan step 2's «·» line; the summary's group order; «Tambah Tingkat» suggesting «2026/2027»; titles breaking at 320 px; «Kursus» in «Cabut sertifikat» (X12) | **Z if one string or one style each, else 4.2.** The 320 px titles ride R-11's sweep | Daisy |
| A1 R1, R2 and R4 (Daisy); A1's seven conditions (Sharon) | **Z, verify closed** against A1's acceptance | Daisy; Sharon |
| C1w C1-R2, R4 and R5 (Daisy); C1w's six conditions (Sharon) | **Z, verify closed** against C1w's acceptance. C1-R5's email was left unbuilt (it is in-app only, as Review P's PETE-12 notes): **4.2,** unless the owner rules otherwise | Daisy; Sharon |
| B0, Sharon: closing an account can leave a school with no usable admin | **Z, verify.** B0's guarantee is the last administrator; check that account closure is covered | Sharon |
| Staging, Daisy: her session cannot reach staging | **Stays as R-13**, which needs a browser-capable person before the walkthrough | — |

**Most of these are verification, not new work.** Each check is one read of the acceptance record or the code, done
in A3's gaps, economically.

**Sharon's items, checked (18 Nov, 12:19):** `R15-SHARON-ITEMS-7ba18b03.md` on her branch. Still open, each mitigated:
- the run-guard order (`audit_run_parent_check`);
- A1's re-check at approval (`may_start`), and the rule for which result reports use when attempts are granted;
- C1w's statistics after a one-question revision (goes to 4.5), and the preference for a confirmer who is not the author;
- B0's account closure (platform admin only, and recoverable).

Everything else is closed, with citations. The open items are classed at Z.

**Daisy's items, checked (18 Nov, 12:22):** `R15-DAISY-7ba18b03.md` on `ux-1/daisy-experience` (`087b5848`).
- 6 closed.
- 6 open for Z: four are one string or one line each, and two need one look each (A1-R4, C1-R4).
- 1 goes to 4.2: C1-R5's email.

**R-15 is triaged.** Its Z items join Second Eye's Z fixes after A3.
