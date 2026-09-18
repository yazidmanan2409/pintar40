# UX-1 · THE ROLE-BASED FIRST-LOGIN TOUR — WHAT IS BUILT, AND WHAT IS NOT

Written by Daisy Code after implementing the approved r2.1 design
(`UX-1-ROLE-BASED-FIRST-LOGIN-TOUR.md`, SHA-256
`23a6fcdd026c03a506e72d9e94281151465818868a025247f8b0e7e3f4554121`) against
the baseline `699b6e8370d67bfebd9a7c3bad4a2fa1dc05c244`.

Nothing here asks for a decision before the tour ships. Each item is either a
piece of the design that has no contract to stand on yet, or a reconciliation
answer worth recording so that nobody re-derives it.

---

## 1. WHAT IS BUILT

Four tours, seven steps each, on the two landings that exist:

| Tour | Identity | Presented to | State |
|---|---|---|---|
| `Belajar·Netral` | `learner.first_login` | every learner | **executable** |
| `Belajar·SD` | `learner.first_login` | — | built, dormant (§2) |
| `Belajar·Menengah` | `learner.first_login` | — | built, dormant (§2) |
| `Kelas·Pengajar` | `educator.first_login` | an EDUCATOR, and no role above one | **executable** |

A **Bantuan / Help** control is added to the learner and educator shells. The
built shell had no help entry of any kind — two learner tabs, one educator tab,
and the language switch — so Daisy's proposed header control (§F, L-5) stands
rather than being withdrawn. It is on neither the focus shell nor the public
verification shell, because §G-3 forbids a tour or a tip in both places.

---

## 2. DEFERRED, WITH THE REASON

### §H-2 — the second-experience invitation
**Not built.** "Never more than one automatic tour per sign-in": a person who
enters a second experience for the first time in the same sign-in gets a quiet
invitation instead of a second tour.

The rule needs a **sign-in-scoped** signal, and the tour contract has none.
`my_tour_state` answers per person, per tour, per version — the right scope for
everything else in the design, and one scope too coarse for this. There is no
"has anything been presented during THIS sign-in" fact anywhere in the built
contract, and the Experience layer must not invent one: a client-held flag
would be device state, which is the exact thing §L-3 rules out.

What happens instead today: each experience presents its own tour on its own
first landing arrival. A person who is both a learner and an educator and
enters both doors in one sign-in may meet two tours. That is a smaller wrong
than a device-scoped answer, and it is bounded by the three-presentation cap.

*Closing it needs one fact and no new table: something the backend can answer
about the current sign-in rather than about the person.*

### §I-3 and §I-4 — the version-change invitation, and re-presenting a new tour
**Not built, and not yet buildable.** Both rules compare the version a person
last finished or dismissed against the version now declared, and both then show
only what changed.

The registry declares exactly one version of each tour today
(`learner.first_login` v1, `educator.first_login` v1), so there is nothing to
compare and nothing to invite anybody to. The state row already carries
`tour_version`, so the fact needed for §I-3 exists; what does not exist is a
second version, or any record of WHICH STEPS changed between two versions. The
design is explicit that a version is deliberate Experience metadata recorded
with a release (§I-1), so that record is Experience's to supply when it first
changes a tour — not something to derive.

§I-5 ("existing users see v1 once when the tour first ships") needs nothing:
a person with no row is a person who has not seen v1, and the contract already
answers that way.

### §L-13 — Evaluation Mode personas
**Recorded, not resolved.** Tour state hangs on the person in the session, and
an evaluation persona is one actor several human evaluators may sign in as. So
"don't show this tour again", ticked by the first evaluator, is ticked for all
of them.

This is the contract behaving correctly — the state follows the person, and
during an evaluation the persona IS the person — and it is the one place where
that produces a surprise. It costs an evaluator one Help click. Nothing in the
Experience layer should special-case it, because a tour that behaved
differently under an evaluation persona would stop demonstrating the product.

The one thing that IS handled: the tour card keeps clear of the evaluation
banner (§J-11), which cannot be dismissed because its presence is a property of
the session (ADR-0020).

---

## 3. RECONCILIATION ANSWERS WORTH KEEPING

- **L-1 · learner stage.** No person-scoped stage source exists at this
  baseline. `courses.stage` is a property of a course and the session's stage is
  a property of a session; neither is a fact about a learner. `varianBelajar()`
  therefore takes a legitimate person-scoped stage **or nothing**, and has no
  second parameter anything else could be passed through. Every caller passes
  `null` today. If a legitimate signal ever lands it selects a variant of the
  same identity — no reset, no re-presentation, no new version.
- **L-2 · experience source.** The tour is selected by the door the person is
  standing at, exactly as the shell derives it. No capability counting.
- **L-5 · help entry.** None existed. The header control is built.
- **L-6 · existing first-login state.** None exists; nothing is duplicated.
- **L-7 · anchors.** `daftar` and `sertifikat` on the learner side, `layak`,
  `kelas` and `berjalan` on the educator side, `bantuan` on both shells. An
  anchor names a place and grants nothing: what is behind each one is authorized
  again, server-side, exactly as before.
- **L-8 · the learner landing.** Teacher-opened Quick Assessments do render
  there, and a running window is identifiable from the mode the page already
  reads — so §J-10's exclusion is the page's own information rather than a
  second question asked of the database. The built learner-facing term is
  **Uji Cepat**.
- **L-9 · question-screen labels.** The built confirm control is
  "Kunci jawaban ini / Confirm this answer". The design deliberately does not
  name it, and the copy is unchanged.
- **L-10 · Mastery Check.** The EN variance is closed in favour of the UX-0
  glossary: **Mastery Check**. One Slice-3 telling
  (`mengajar.instrumen.POST_TEST`) was normalised to match; no other copy moved.
- **L-11 · certificate issuance.** V-6a is still open, so the certificate step
  promises nothing. It says where certificates live and that each can be
  checked, which is true today and stays true either way.
- **L-12 · the Slice-3 landing.** All three educator anchors exist on it. The
  header carries one tab, not three, because Slice 3 built one surface.
- **L-14 · copy.** 89 keys under the existing HLE mechanism, both languages,
  inside the `INTERNAL_WORDS` guard. No second language mechanism.

---

## 4. ONE THING THE DESIGN DID NOT RENDER

The approved phone boards are 480 px wide. At 390 px — the commonest phone
viewport — the tour card's header no longer fits on one line. It wraps, which
is what §K-9 asks for (nothing truncates, no type shrinks), and the card now
takes the wrap by intention: the tour's name on the first line, the progress
and both controls on the second, with the way out in its corner.

No copy changed and no value moved. Recorded here only so that a future render
pass at 390 px is not read as a defect.
