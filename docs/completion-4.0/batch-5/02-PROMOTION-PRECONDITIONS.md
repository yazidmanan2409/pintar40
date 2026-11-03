# Batch 5 · Promotion preconditions: the owner's conditions, met or open (3 Nov 2026)

**Authority:**
- Owner, 3 Nov: «PINTAR 4.0 — BATCH 5 CONTROLLED PROMOTION — Decision: CONDITIONAL GO» (D-157).
- Owner, 3 Nov: «PINTAR 4.0 — Overnight Engineering Authorization» (D-157(e)).

**Where the work is:**
- Development branch `claude/awesome-rubin-bqxp6p`. The pull request into `main` is opened for review and **not merged**.
- Staging is unchanged at 188 migrations. Nothing is deployed. Production is untouched. Dr Gladys's demonstration records are untouched.

This page answers conditions 1–5 (before merging) one by one. Conditions 6–10 (the merge, staging at 193, the staging walks, preservation, accessibility on staging, the freeze) belong to the promotion itself and have not started.

## Condition 1 · Dr Gladys's approved terminology

**Done.** No approved word is silently replaced.

| Key | Batch 5 had | Now (approved) |
|---|---|---|
| `metrik.peserta.label`, `metrik.peserta_institusi.label` | «Murid yang dinilai di kelas ini» / «… di sekolah ini» | «Peserta» / «Students» |
| `metrik.kenaikan*.label` | «Rata-rata kenaikan penguasaan di kelas ini» / «… di sekolah ini» | «Kenaikan» / «Gain» |
| `mengajar.bukti.bagian` (UX-41 heading) | «Penguasaan per tujuan pembelajaran» | «Penguasaan per bagian» / «Mastery by part» |

What stays from Batch 5, because it is not a change of approved words:
- «(0/5)» is the CR-46 sentence («Sekarang 0 murid; perlu 5.»).
- The cards are spaced.
- The UX-41 rows are named by their objective's statement.

No calculation or visibility rule changed in Batch 5.

The walks that read these words were set back to them: `audit/journey.mjs` (C12, S23t), `audit/c12.mjs` and `audit/staging/golden-school-laporan.mjs`. The guards assert the approved words: B5A-PIMPINAN-K01 and B5C-BUKTI-K01.

**Questions for Dr Gladys** (recorded, not guessed):
1. **RV-9 / W3.9, Pimpinan.** The class card and the school card each show «Peserta» (the number of learners assessed) and «Kenaikan» (the average gain in mastery). RV-9 notes two things: the same two labels repeat at both levels, and «Peserta» is also the word for a participant (J9.3). Should both levels keep exactly «Peserta» and «Kenaikan»? Or do you approve distinct labels, for example «Murid yang dinilai di kelas ini» and «Rata-rata kenaikan penguasaan di kelas ini», with «… di sekolah ini» for the school?
2. **UX-41, a teacher's evidence view.** The rows under «Penguasaan per bagian» are now each named by their learning objective. Should the heading stay «Penguasaan per bagian», or become «Penguasaan per tujuan pembelajaran» (Daisy's DAISY-29 wording)?
3. **Words written by engineering** (01 §5 item 6) remain for her review. Daisy gave the grammar but not the words:
   - `sertifikat.kelola.*`, `sertifikat.cabut.*`, `studio.integritas.*`;
   - `laporan.cakupan.*`, `mengajar.murid1.tujuan*`;
   - `lesson.media.tidak_ada*`, `aktivasi.tunggu.*`, `tolak.kembali_sertifikat`.

## Condition 2 · The guided tour: non-modal, keyboard, dismissal, continuation

**Done; walked in a real browser** (`audit/b5-fokus.mjs` F2). D-157(b) settles the earlier conflict with `08-migration.md`.

The walk is a synthetic learner on Belajar, on a fresh stack. It checks:
- The tour is a dialog that is not `aria-modal`, and nothing behind it is inert or hidden.
- Tab reaches «Berikutnya». Enter continues to the next step. «Kembali» goes back.
- Tab leaves the tour for the page (no trap).
- Esc closes it.

Continuation follows the tour's approved rule (`src/lib/tur.ts` `akanMunculLagi`):
- Esc and «Lewati» are a **skip**. The automatic presentation is counted, and the tour is not finished or suppressed. Under the cap (1 of 3), it is offered again by itself on the next visit.
- «Jangan tampilkan lagi»: Tab reaches it, Space ticks it, and Esc closes the tour. The database records the choice (`suppressed_at`). The tour does not open by itself again, and «Bantuan» still offers it.

**A correction to my own test, not to the product.** The first version of F2 asserted that a tour closed with Esc never opens by itself again. That contradicts the approved design: a skip comes back until the cap; only finishing or «Jangan tampilkan lagi» stops it. The assertion was corrected to the design, and the permanent opt-out is now walked by keyboard as well. No product code changed.

## Condition 3 · MODE PERAGAAN: no automatic sign-out on leaving

**Done.**

**What the code did:**
- On `main` (`31e456d`), assuming a persona wrote the persona's session into the same `sb-<ref>-auth-token` cookie. That replaced the evaluator's own session.
- Leaving deleted that cookie, so the evaluator was left signed out, implicitly. Their own Auth session also stayed open on the server until it expired.
- Batch 5 (agent B, `db351ba`) made the sign-out explicit, landing on `/masuk?sesi=peragaan`.
- My first report said the sign-out "predated Batch 5". It did in effect, but Batch 5 is what made it a deliberate redirect.

**What ADR-0020 requires:**
- Exit to the Hub, then assume again.
- Exiting ends the persona session server-side.
- The evaluator's own logout ends both.

Nothing requires the evaluator to be signed out on leaving.

**Now:**
- When a persona is assumed, the evaluator's own session cookies are set aside, httpOnly, for at most 12 hours (`src/lib/evaluation.ts` `sisihkanSesiPenilai`).
- Leaving ends the persona session server-side (`exit_persona`) and restores the evaluator's session. The evaluator lands on `/evaluasi?keluar=1`: the Hub, signed in as themselves, with «Anda sudah keluar dari peragaan.»
- Signing out while a persona is active ends both. The persona session ends as before. The set-aside evaluator session is ended in Auth (`/auth/v1/logout?scope=local`), and every set-aside cookie is cleared (`src/app/keluar/route.ts`).

**Boundaries kept:**
- The persona still never reaches beyond its own context.
- There is still no persona-to-persona switch.
- The set-aside cookies are httpOnly and are read only by the exit and sign-out paths.

**Verified in a real browser** (`audit/b5-fokus.mjs` F1). On the way in:
- The evaluator holds their own session.
- The Hub offers a persona, and the band is shown.
- The evaluator's session is set aside unchanged, and an evaluation session is open.

Leaving:
- lands on the Hub, with the leaving line and no band;
- shows the personas again, so the evaluator is signed in as themselves;
- restores the original session, with nothing left set aside;
- ends the evaluation session server-side.

Signing out (with a persona assumed again):
- leaves no session cookie;
- leaves no evaluation session open;
- ends the evaluator's own Auth session (read from `auth.sessions`);
- makes the evaluator's own refresh token refused (400).

## Condition 4 · Focused verification and green required CI on the final PR head

**Local, on a fresh build and a freshly reset database:**
- **Full suite (`npm run selftest:local`): 756 passed, 0 failed, 0 skipped.** One justified skip: F01-R04, whose evidence exists only inside a CI run.
- **Fresh-stack walks, in CI's order:**
  - Batch 4 administration walk: 11/11.
  - Batch 5 walk (`audit/b5-ujung.mjs`): 6/6.
  - Focused checks (`audit/b5-fokus.mjs`): 2/2.

**The integrity walk is now reproducible on a fresh stack** (the overnight authorisation's item 4):
- A fresh seed holds no sitting in alpha, so B5-W2 could earlier only run after the full suite had made one.
- The walk now makes its own controlled synthetic fixture, in alpha's school only:
  - a course, a release and a quick-assessment definition of alpha's own, each named for the run;
  - an IN_PROGRESS sitting of a learner active in an alpha class.
- The database's provenance trigger binds the person, school and period from the enrolment, and derives the evidence class: **SYNTHETIC**.
- It picks any active alpha learner, because the Batch 4 walk, run first in CI, transfers alpha-siswa-1 to beta.
- The walk is now a step in CI's journey job A (after the Batch 4 walk, before the focused checks).

**CI:** the exact head, run IDs and verdicts are in the PR and in the overnight report. A green CI is evidence for review, not product acceptance.

## Condition 5 · Staging's 188, the 189–193 prerequisites, recovery, and the backup

Staging was checked **read-only** through the Supabase MCP (project `keijhmdtsgrfvnvocfvk`) on 3 Nov.

| Check | Finding |
|---|---|
| Migrations applied | **188**, the last `20261221100000` |
| The 188 versions vs the repository | digest `776956cb650c4edd0a859490a9da7713` on both sides: identical |
| `record_integrity_review` (190 replaces it) | md5(prosrc) `14e24ea3ae9c8e929d128b3fc64c46c3` = the repository's pre-Batch-5 body |
| `integrity_signals_awaiting_review` (190 replaces it) | md5(prosrc) `e1cd1099dc3412b7501a7e8704730fa3` = the repository's pre-Batch-5 body |
| Prerequisites 189–193 call | all present: `revoke_certificate`, `persons_awaiting_account`, `management_scope_over_node`, `is_system_admin`, the integrity tables, `management_decisions`, … |
| Objects 189–193 create | none exists yet; `result_views` absent |
| Data 190 and 193 read or back-fill | certificates 42; integrity signals 15; recorded integrity reviews 0; management decisions 0; finalized sittings 1,580 (193 back-fills `result_views` from them) |

**Migrations 189–193 are forward-only and additive:**
- new functions, two replaced function bodies, one new table with a back-fill, and registry rows;
- no column dropped or retyped;
- no data rewritten.

**Recovery arrangements:** `ROLLBACK-189-193.sql` (not a migration; never run by any workflow) returns a database at 193 to 188's schema. It was tested locally in both directions on 3 Nov, on a populated database:
1. Applied at 193:
   - the two replaced functions' md5(prosrc) became staging's exactly (`14e24ea3…`, `e1cd1099…`);
   - every object 189–193 created was gone, `result_views` included;
   - 188 rows remained in `schema_migrations`.
2. `supabase migration up` re-applied 189–193 cleanly: 193 migrations, the 190 bodies back.
3. F25 and F26, the Batch 5 database suites, then passed 6/6 on that round-tripped database.

The physical backup remains the recovery point for data.

**The backup: OPEN, and the owner's to verify.**
- The backup list cannot be read from here: the management API answered 403 at the Batch 4 gate, and D-154 asks the owner to verify in the dashboard.
- Before the merge, the owner confirms in the Supabase `pintar-staging` dashboard a successful, restorable physical backup less than 24 hours old.

## Not done here, by the hard boundaries

- No merge into `main`.
- No staging migration or deployment.
- No production change.
- No change to Dr Gladys's records, branch protection, secrets or infrastructure.
- No 4.1, 4.5 or 5.0 work. No Batch 6.

The Daisy items stay registered and not invented:
- W3.8's report body and A4 print;
- the PD Kelas «Lihat bukti» view;
- W3.12, W3.16, W3.6 and UX-09.

## STOP

Stopped at the Batch 5 promotion gate. Merging waits for the owner's review of this record and the overnight report, and for the owner's backup verification.
