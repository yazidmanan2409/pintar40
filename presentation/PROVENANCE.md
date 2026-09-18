# PINTAR — Management & Educator deck · source and provenance note

**Compiled:** 2026-09-18 · **Deck version:** internal designation PINTAR 4.0 ·
**Repository state:** 70 migrations, FABLE-01 → FABLE-05 plus Task 1 (ADR-0018)
and Task 2 (ADR-0020) complete; FABLE-06 (Intelligence) not started.

This note maps every load-bearing claim, screen and diagram in the deck to the
document or code that authorises it, and records the conflicts found along the
way rather than resolving them silently.

---

## 1 · Source hierarchy applied

1. The presentation brief (the product ruling that commissioned this deck) —
   binding on terminology, palette, doctrine wording and deliverables.
2. The frozen PINTAR 4.0 Architecture Baseline, `docs/rebuild/00–16`.
3. The closed engineering contracts, `docs/adr/0001–0020`.
4. The implemented surfaces in `src/` and `supabase/migrations/`.
5. PINTAR 3.0 material in `docs/product/` — historical context and the binding
   Voice Guide and Philosophy, but never implementation authority.

---

## 2 · Claim → source

| # | Claim on the slide | Source | Status |
|---|---|---|---|
| 2 | "The problem is not a lack of data" framing; no universal criticism of any LMS | `docs/rebuild/15` *What PINTAR is / is not* | doctrine |
| 4 | The core proposition, verbatim | presentation brief | ruling |
| 5 | "Better information makes human decisions better"; "make the human better informed, not unnecessary" | presentation brief; `docs/rebuild/15` *AI architecture and trust boundaries* | ruling + doctrine |
| 6 | Learner journey screen: five ordered steps, each locked step states what opens it | `src/app/belajar/[tugas]/page.tsx`; HLE keys `cycle.*` | implemented |
| 6 | "No status, mode or version number reaches a learner's screen" | `src/lib/hle.ts` `INTERNAL_WORDS` + the `t()` guard that throws | implemented |
| 7 | Five-step cycle and its five questions | `docs/rebuild/15` *The learner cycle*; HLE `cycle.step.*` | implemented |
| 7 | Pre-test and post-test share no items and no parallel-group siblings | INV-24 (`docs/rebuild/03`); OD-2 RESOLVED (`docs/rebuild/11`) | invariant |
| 8 | "Ini bukan ujian…" wording | HLE `pretest.intro` | implemented, verbatim |
| 8 | No score, no pass/fail, progress as dots | `docs/rebuild/15`; `src/app/belajar/[tugas]/pemetaan/page.tsx` | implemented |
| 8 | "belum tepat", never "salah"/"gagal" | `docs/product/PINTAR-VOICE-GUIDE.md` §4.1; HLE `hasil.answer_notyet` | doctrine + implemented |
| 9 | Reading-map tiers and their wording | HLE `map.tier.*`, `map.intro`; `src/app/belajar/[tugas]/peta/page.tsx` | implemented, verbatim |
| 10 | Time counts up; flag and navigator; save & pause | HLE `posttest.*`; `src/app/belajar/_components/ItemPlayer.tsx` | implemented |
| 10 | A hint can never name or narrow to the correct option, enforced by the database | INV-02; `chk_items_scaffolding_tanpa_kunci` | invariant, DB-enforced |
| 10 | Asking for help never reduces the score | INV-11 (`docs/rebuild/03`); `docs/rebuild/06` telemetry category 3 | invariant |
| 10 | Durable outbox, idempotent replay, no duplicates | INV-28; `docs/rebuild/09` *Assessment resilience* | invariant |
| 11 | Results screen: mastery, safety banner, review, delta | `src/app/belajar/[tugas]/hasil/page.tsx`; HLE `hasil.*` | implemented, verbatim |
| 11 | "No false comparison" — PINTAR says there is nothing to compare | HLE `hasil.delta.BARU_*` | implemented, verbatim |
| 11 | One safety-critical item not yet right means mastery is not reached | INV-10 | invariant |
| 12 | Studio home buckets and their wording; a zero bucket does not render | `src/app/studio/page.tsx`; HLE `studio.bucket.*` | implemented, verbatim |
| 12 | "Classes in your teaching context", never "classes you can see" | presentation brief; `docs/rebuild/02` Scope / Capability / Role Assignment | ruling + doctrine |
| 13 | Quick Assessment: class → chapter → launch, about a minute | ADR-0018; `docs/rebuild/09` *Teacher Quick Assessment*; `src/app/studio/kuis/page.tsx` | implemented |
| 13 | Its result contributes learning evidence; one Quick Assessment does not issue a certificate | presentation brief (retires "tidak masuk sertifikat"); `docs/rebuild/02` *Assessment Assignment* | ruling |
| 13 | Withdrawn material stops new attempts; finished work stays finished | INV-27; HLE `studio.kuis.tidak_tersedia` | invariant + implemented |
| 14 | Prepare → review → lock → publish → assign; author ≠ reviewer | `docs/rebuild/04` content lifecycle; HLE `studio.tinjau.bukan_penulis` | implemented |
| 14 | "Publishing is not yet assigning" | HLE `studio.paket.terbit_bukan_tugas` | implemented, verbatim |
| 14 | Once locked, content cannot change; a correction is a new copy | INV-04; ADR-0016; HLE `studio.paket.kunci_peringatan`, `studio.paket.revisi_penjelasan` | invariant + implemented |
| 15 | Activity → evidence → enough? → interpret / wait | `docs/rebuild/02` *Question Health*; enum `question_health_state` incl. `INSUFFICIENT_EVIDENCE` | implemented |
| 16 | "Belum cukup bukti untuk menilai soal ini." | HLE `studio.bank.belum_cukup` | implemented, verbatim |
| 16 | belum ≠ tidak | `docs/product/PINTAR-VOICE-GUIDE.md` §4.1 | doctrine |
| 17 | What integrity records cover | `docs/rebuild/06` category 7; enum `integrity_category` | implemented |
| 17 | No webcam, microphone, screen capture or keylogging | `docs/rebuild/09` PARK; `docs/rebuild/02` *Integrity Signal* | scope boundary |
| 17 | Integrity records never score, and produce review signals, never verdicts | INV-11-shaped `assert_integrity_never_scores()`; `docs/rebuild/06` | implemented, DB-asserted |
| 17 | The learner-facing notice, verbatim | presentation brief | ruling — **wording approved, not a shipped screen** |
| 18 | Authored/predicted difficulty and empirical difficulty are separate fields; empirical stays honestly empty | `docs/rebuild/02` *Item Statistics*; HLE `studio.bank.prediksi` / `studio.bank.empiris` | implemented |
| 18 | Demonstration, preview and test evidence cannot reach official numbers | INV-20, INV-33; `docs/rebuild/06` *Eligibility is structural* | invariant |
| 19 | Verification page fields and wording | `src/app/verifikasi/[token]/page.tsx`; HLE `verifikasi.*` | implemented, verbatim |
| 19 | The signed payload binds the release identity and its content hash; altering a protected field fails verification | INV-05; ADR-0010 | invariant |
| 19 | Exactly one public verification route; old certificates verify after key rotation | INV-38, INV-07 | invariant |
| 20 | Role-based seven-step first-login introduction, replayable from Help | presentation brief | ruling — **design, not implemented** |
| 21 | Demonstration space: one school, one journey, five perspectives | ADR-0020; `supabase/seed/human_evaluation.sql`; `src/app/evaluasi/page.tsx` | implemented |
| 21 | The five labels: Murid · Guru · Penelaah & Penerbit · Pimpinan Sekolah · Administrator Sekolah | `supabase/seed/human_evaluation.sql` | implemented, verbatim |
| 21 | Switching perspective records both whose authority was used and who acted | ADR-0020; `audit_log.evaluation_actor_person_id` (migration 0067) | implemented |
| 21 | There is no sixth (platform-admin) perspective | ADR-0020 *Super Admin boundary*; migration 0066 persona guard | implemented |
| 22 | Class progress, briefings, institutional view | `docs/rebuild/09` BUILD NOW list; FABLE-06 scope | **design intent — not built** |
| 22 | A metric's meaning is PINTAR's; a school chooses selection and presentation | INV-34; `docs/rebuild/02` *Canonical Metric Catalogue* | invariant |
| 23 | Evidence → pattern → interpretation → action → human decision | `docs/rebuild/15` *AI architecture*; `docs/rebuild/02` *AI Provider Gateway* | doctrine |
| 23 | No AI can publish content or assign it to learners | INV-32 | invariant |
| 23 | Learner-facing help is produced with no access to answer keys | INV-31; `src/ai-gateway/contexts.ts` | invariant + implemented |
| 24 | "PINTAR does not automate the educator…" | `docs/rebuild/15` *Educator positioning* | doctrine |
| A2 | Answer keys never reach a learner's device | INV-01 | invariant |
| A2 | Score recomputed independently at issuance | INV-09 | invariant |
| A2 | Append-only audit trail for consequential actions | INV-18 | invariant |
| A3 | Role scope; leadership reads and does not approve | `docs/rebuild/05`; INV-19 | invariant |
| A4 | Every boundary listed | §4 below | acknowledged |
| A5 | Every future-direction item | `docs/rebuild/09` LATER | scope boundary |

---

## 3 · Screens and diagrams — what each one is

**No photographic screenshot appears in this deck.** The environment that built
it has no reachable PINTAR instance, so none could be captured honestly.

| Slide | Artefact | What it is | Label carried on the slide |
|---|---|---|---|
| 6, 8, 9, 10, 11, 12, 19 | Screen reconstructions | Vector reconstructions of screens that exist in `src/app/`, drawn from the components' own structure and filled with the product's own strings from `src/lib/hle.ts` | "Layout reconstructed from the built PINTAR interface. The on-screen wording is the product's own." |
| 20 | Seven-step introduction | Approved experience design; no such surface exists in this repository | "Approved experience design. Not a running screen in the version this document reviews." |
| 22 | Class progress / briefing / institutional view | Experience direction for FABLE-06 | "Experience direction. Not built in the version this document reviews." |
| 3, 7, 13, 14, 15, 23 | Diagrams | PINTAR's own concepts drawn as diagrams; no product screen is implied | — |

The numbers inside reconstructions (84%, 58% → 84%, bucket counts, "SMA Contoh
Nusantara") are illustrative and are not measurements of any real cohort. They
are deliberately plain so no one can mistake them for institutional data.

---

## 4 · Conflicts found, and how they were resolved

Four genuine conflicts surfaced. None was resolved by picking whichever answer
produced the better slide.

**1 · "Kuis Cepat" vs "Uji Cepat".** The built Studio surface says *Kuis Cepat*
(`src/lib/hle.ts`, `studio.nav.kuis` and `studio.kuis.judul`); ADR-0018 and the
presentation brief both use *Quick Assessment* / *Uji Cepat*, and the brief
explicitly retires *Kuis Cepat*.
**Resolved** in favour of the brief (source rank 1). The deck says Uji Cepat
throughout. The divergence is named in the terminology appendix's speaker note
and is listed in §5 as work for the product team — the shipped string should be
brought into line, and this deck does not silently pretend it already is.

**2 · "Peta Bacaan" vs "Peta Bacaan Personal".** The brief's canonical term is
*Peta Bacaan*; the implemented learner screen reads *Peta Bacaan Personal*
(HLE `map.title`).
**Resolved** by using *Peta Bacaan* in presentation copy and keeping *Peta
Bacaan Personal* inside the screen reconstruction, because a reconstruction
shows what the screen says. Both are recorded in the terminology appendix.

**3 · The primary colour.** The brief specifies `#245F55` (deep green). The
implemented token set specifies `#2F6F8F` and marks it **PROVISIONAL**, noting
that the established PINTAR primary must be copied from the brand assets before
a real institution sees a screen (`src/app/globals.css`; ADR-0001).
**Resolved** in favour of the brief, which is the later ruling and supplies the
value the code is waiting for. Every other token in the deck matches the
implemented set exactly. If `#245F55` is the intended product primary, the code
comment in `globals.css` can now be closed.

**4 · The name "PINTAR 4.0" on an educator-facing surface.**
`docs/rebuild/15` *Product naming* states that "PINTAR 4.0" must never appear in
learner, educator, administrator, public or marketing experiences — versioning
is internal. The brief titles the deck and its files "PINTAR 4.0".
**Resolved** by treating the designation as document metadata rather than
product branding: the files and this note carry "PINTAR 4.0"; on the slides the
product is **PINTAR**, and the designation appears once, in small type, in the
cover's document line ("Dokumen internal · PINTAR 4.0 · September 2026") and
once in the boundaries appendix, where the statement is about the release
itself. If the product owner prefers it removed from the slides entirely, the
cover's `meta` line is the only edit needed.

---

## 5 · Claims deliberately excluded for want of evidence

- **PINTAR Foresight.** Named in the brief only as something not to present as
  a 4.0 feature. No description of it exists in this repository, so it is not
  mentioned at all — not even in the future-direction appendix, where naming it
  would require inventing what it is.
- **Any management or dean dashboard as a live screen.** FABLE-06 is not built;
  `src/app/` contains no `/edukator`, `/dekan`, briefing or report surface.
- **Automatic certificate issuance on qualification.** Issuance and verification
  are implemented and were proved end-to-end on one journey (Task 2, EVAL-S02),
  but the learner-facing certificate view is not a built screen and the
  issuance lifecycle is not claimed to be automatic. The deck says only that
  certificates issued by the school can be verified.
- **A learner-facing integrity notice as a shipped screen.** The data layer and
  its separation from scoring exist; the notice wording is approved but is not
  rendered anywhere in `src/`. The slide carries the wording and the speaker
  note states the distinction.
- **Empirical psychometrics, Rasch/IRT, discrimination analysis.** LATER in
  `docs/rebuild/09`; presented only as direction.
- **Accreditation-framework alignment** (e.g. LAM-PTKes). OD-1 is open and
  "MUST ASK PRODUCT OWNER"; the deck names no framework.
- **Retention periods.** OD-5 leaves the legal durations open; the deck says
  the question is open rather than naming a number.
- **Cohort or cross-school benchmarking.** PARK in `docs/rebuild/09`.
- **Any statement that PINTAR prevents cheating, eliminates bias, guarantees an
  outcome, is production ready, or is fully tested.** The build's audit
  (`build/audit.py`) fails on each of these phrases.

---

## 6 · How the three editions are kept identical

`build/content.py` holds one content model. Every claim is a single
`{"id": …, "en": …}` node, and the Indonesian, English and bilingual editions
are three renderings of that one model — so a claim cannot exist in one edition
and not another, and cannot be stronger in one than in another. The executive
editions are a named subset of the same slides, in the same order, with no
slide of their own.

Two checks run on every build:

- `python3 build.py` measures every block before placing it and **fails the
  build** if any slide would overflow in any edition. Bilingual density is
  handled by tightening white space and shortening the source copy in both
  languages — never by reducing type size.
- `python3 audit.py` checks that both language sides are present and non-empty,
  that canonical terminology is used and obsolete variants are not, that the
  Learning Safety Doctrine's forbidden words appear nowhere, that no overclaim
  survives, that every slide has notes in both languages, and that the
  executive edition neither invents nor reorders a slide.

At the time of writing both report clean: 30 slides, 376 language pairs, no
overflow in any of the five files.

---

## 7 · Brand assets

**The official PINTAR SELALU identity was not present in this repository**
(no logo file of any kind exists under version control; the only image is a
favicon). Rather than redraw or approximate it, the deck uses a plain
typographic wordmark — the word PINTAR set in the deck's own typeface — and
leaves the identity mark to be placed before any external use. See the README
for exactly where.
