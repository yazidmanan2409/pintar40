# FABLE-03 — The Learning Experience (Dr. Gladys Learning Cycle)

*Amended per `docs/rebuild/14-FABLE-PROMPT-CROSSCHECK.md`, whose amendments
`15-FABLE-5.1-START-HERE.md` §4 requires to be applied to the FABLE file
itself rather than worked around. Two apply to this phase, and FABLE-02
already delivered the schema both need:*

1. *Crosscheck row "State machines (doc 04)" — §4's post-test and the whole
   session lifecycle run on an **explicit enumerated status with a
   transition trigger** (doc 04 §5: `CREATED, IN_PROGRESS, PAUSED,
   SUBMITTED, EXPIRED, TERMINATED, FINALIZED`), not on correct end-to-end
   behaviour over an open status string. `public.session_status` and
   `public.session_status_transitions` are that allow-list; every move goes
   through it.*
2. *Crosscheck row "INV-20" / the Rasch question — §8's onboarding and every
   other session-creating path marks preview/dev traffic **at creation**.
   FABLE-02 made this stronger than a flag: `evidence_class` is derived at
   insert from the tenant, the channel and the server context and cannot be
   asserted by any caller, and `official_*` are the only evidence read path
   for analytics, psychometrics and eligibility.*

*Where this file and a `docs/rebuild/` document differ, the document wins
(`15-FABLE-5.1-START-HERE.md`, "What implementation does NOT survive").*

Depends on Phases 1–2. This phase builds the learner-facing product end to
end for one seeded course before any Studio/authoring UI exists — content
for this phase can be seeded directly via the Phase 2 ingest function.

## The cycle

```
QR/link arrival → onboarding (passwordless, or classroom-card PIN for young learners)
  1. PRE-TEST "Pemetaan Awal"
  2. PETA BACAAN PERSONAL (personal reading map)
  3. Lesson(s) via the multimodal lesson player
  4. POST-TEST "Uji Penguasaan"
  5. HASIL (results) + delta vs. pre-test + certificate CTA if passed
  6. /sertifikat, /verifikasi/[id] — public, QR-scannable
```

## 1. Pre-test — "Pemetaan Awal"

- No pass/fail messaging anywhere on this screen or its result.
- No rationale reveal.
- Progress shown as dots, never a percent bar or countdown-feeling timer.
- Keyboard nav: A–D selects an option, Enter/→ advances, ← goes back.

## 2. Peta Bacaan Personal (reading map)

Not a results page. One card per competency domain, sorted safety-missed →
wajib (mandatory) → disarankan (recommended) → kuat (strong), each with a
chapter/page reference and a plain-language reason a non-technical learner
understands.

## 3. Multimodal lesson player

- Paginated reading, split at heading boundaries, with a dot page tracker.
- Audio/video with playback-rate control, resumable position, and a
  clickable transcript.
- Worked examples revealed step by step, not all at once.
- PDF companions (slide deck / module summary) with a prominent open/download
  action.
- Any fraction/ratio-style diagram is drawn live from a data directive
  (e.g. a `[[visual:...]]` line interpreted client-side), not shipped as a
  static image asset — keeps diagrams accurate and localizable.
- Reading progress persists both locally (survives refresh) and server-side,
  and never regresses (don't let a later "resume" show less progress than
  already recorded).

## 4. Post-test — "Uji Penguasaan"

- Formal framing: counting-up timer, pause ("Simpan & Jeda"),
  flag-for-review ("tandai"), a navigator drawer showing per-item status.
- No auto-advance on option selection — the learner explicitly confirms.
- Safety gate: items tagged safety-critical must be answered correctly at
  a defined minimum rate (from the module's `AssessmentBlueprint`) for the
  attempt to pass at all, independent of overall score.

## 5. Three (or more) item interaction types, learner-facing

Build UI for every type defined in Phase 2 §3: MCQ single/multi, numeric/
step-work entry (validated against final answer plus step-keyword
synonyms, not exact string match), grid/cell-shading interaction, true/false
battery, matching pairs, image-anchored items. Don't ship a type in the
schema without a working learner-facing UI for it.

## 6. Hesitation-triggered assistance

- Configurable hesitation window (10–300s, default ~25s of inactivity with
  no option selected yet).
- Reveals as an inline pill, never a modal or banner.
- Copy by stage per FABLE-00's assistance table (🤔/💡/🧭 variants).
- Content of the assistance must never name or narrow to the correct option
  — this is the same doctrine as the database CHECK from Phase 2, now
  enforced again at the authoring/copy level for any dynamically generated
  hint text.
- Log `time_before_assistance`, `assistance_offered`, `assistance_opened` to
  their own table/columns — verify no scoring view or scoring calculation
  reads them.

## 7. Hasil (results)

Score header, safety-gate banner (pass/fail framed via preferred-language
copy, never forbidden words), per-domain breakdown, a review accordion with
wrong safety-critical items pinned/auto-expanded, delta vs. pre-test,
certificate CTA when passed.

## 8. Onboarding

- Passwordless email/magic-link for most learners.
- Classroom-card PIN flow for young learners, sharing the same downstream
  session/attempt model as email users (no separate "identity that
  certificates can't see" — this avoids a prior build's bug where
  card-identity learners couldn't see their own certificates).

## Acceptance checklist — as an automated suite (must be green before Phase 4)

- [ ] Scripted end-to-end test (via API, headless where UI is unavoidable):
      pre-test → reading map → lesson → post-test → results, for both an
      email-onboarded learner and a classroom-card learner.
- [ ] Test: refreshing/re-fetching mid-lesson resumes at the same or later
      position, never earlier.
- [ ] Test: a safety-critical item answered wrong fails the attempt even
      when the overall score would otherwise pass.
- [ ] Test: the hesitation trigger never fires before the configured
      window, checked with a fast-forwarded clock, not a real 25s wait.
- [ ] Test: a planted forbidden word never appears in any generated
      assistance/feedback string, run against at least one item of each
      type.

Add these to the running `selftest` suite alongside Phases 1–2's tests.
